import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { gameId, action } = body

    if (!gameId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing gameId or action' },
        { status: 400 }
      )
    }

    if (!['like', 'favorite', 'played'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
    }

    // check if interaction already exists
    const { data: existingInteraction } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .eq('action', action)
      .single()

    if (existingInteraction) {
      // remove the interaction (toggle off)
      const { error: deleteError } = await supabase
        .from('user_interactions')
        .delete()
        .eq('id', existingInteraction.id)

      if (deleteError) {
        return NextResponse.json(
          { success: false, error: 'Failed to remove interaction' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'removed',
        data: null
      })
    } else {
      // add the interaction
      const { data: newInteraction, error: insertError } = await supabase
        .from('user_interactions')
        .insert({
          user_id: user.id,
          game_id: gameId,
          action: action
        })
        .select()
        .single()

      if (insertError) {
        return NextResponse.json(
          { success: false, error: 'Failed to add interaction' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        action: 'added',
        data: newInteraction
      })
    }

  } catch (error) {
    console.error('Error in interactions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: 'Missing gameId' },
        { status: 400 }
      )
    }

    // get all interactions for this game
    const { data: interactions, error } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch interactions' },
        { status: 500 }
      )
    }

    // transform to object for easier access
    const interactionMap = interactions.reduce((acc, interaction) => {
      acc[interaction.action] = true
      return acc
    }, {} as Record<string, boolean>)

    return NextResponse.json({
      success: true,
      data: {
        liked: interactionMap.like || false,
        favorited: interactionMap.favorite || false,
        played: interactionMap.played || false
      }
    })

  } catch (error) {
    console.error('Error in interactions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
