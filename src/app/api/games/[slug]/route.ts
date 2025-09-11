import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { fetchGameBySlug, transformRAWGGame } from '@/lib/rawg'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = await createClient()

    // check if game already in database
    const { data: existingGame, error: dbError } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .single()

    if (existingGame && !dbError) {
      // return cached data
      return NextResponse.json({
        success: true,
        data: existingGame,
        cached: true
      })
    }

    // fetch from RAWG API if not in database
    let rawgGame
    try {
      rawgGame = await fetchGameBySlug(slug)
    } catch (error) {
      if (error instanceof Error && error.message === 'Game not found') {
        return NextResponse.json(
          { success: false, error: 'Game not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch game data from RAWG API' },
        { status: 500 }
      )
    }

    // transform RAWG data to match database schema
    const gameData = transformRAWGGame(rawgGame)

    // cache the game data in database
    const { data: newGame, error: insertError } = await supabase
      .from('games')
      .insert(gameData)
      .select()
      .single()

    if (insertError) {
      console.error('Error caching game data:', insertError)
      // still return the data even if caching fails
      return NextResponse.json({
        success: true,
        data: gameData,
        cached: false,
        warning: 'Failed to cache game data'
      })
    }

    return NextResponse.json({
      success: true,
      data: newGame,
      cached: true
    })

  } catch (error) {
    console.error('Error in games API route:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
