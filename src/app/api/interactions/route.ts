import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with cookies from the request
    // This ensures cookies are properly read from the incoming request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    let responseToReturn: NextResponse | null = null
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            if (!responseToReturn) {
              responseToReturn = NextResponse.next()
            }
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              responseToReturn!.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    // Check if user is authenticated via cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
      return responseToReturn || errorResponse
    }

    const body = await request.json()
    const { gameId, action } = body

    if (!gameId || !action) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Missing gameId or action' },
        { status: 400 }
      )
      return responseToReturn || errorResponse
    }

    if (!['like', 'favorite', 'played'].includes(action)) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      )
      return responseToReturn || errorResponse
    }

    // check if interaction already exists
    const { data: existingInteraction, error: queryError } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .eq('action', action)
      .maybeSingle()

    if (queryError) {
      console.error('Error querying interactions:', queryError)
      const errorResponse = NextResponse.json(
        { success: false, error: `Failed to check interaction: ${queryError.message}` },
        { status: 500 }
      )
      return responseToReturn || errorResponse
    }

    if (existingInteraction) {
      // remove the interaction (toggle off)
      const { error: deleteError } = await supabase
        .from('user_interactions')
        .delete()
        .eq('id', existingInteraction.id)

      if (deleteError) {
        const errorResponse = NextResponse.json(
          { success: false, error: 'Failed to remove interaction' },
          { status: 500 }
        )
        return responseToReturn || errorResponse
      }

      const successResponse = NextResponse.json({
        success: true,
        action: 'removed',
        data: null
      })
      return responseToReturn || successResponse
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
        console.error('Error inserting interaction:', insertError)
        const errorResponse = NextResponse.json(
          { success: false, error: `Failed to add interaction: ${insertError.message}` },
          { status: 500 }
        )
        return responseToReturn || errorResponse
      }

      const successResponse = NextResponse.json({
        success: true,
        action: 'added',
        data: newInteraction
      })
      return responseToReturn || successResponse
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
    // Create Supabase client with cookies from the request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    let responseToReturn: NextResponse | null = null
    
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            if (!responseToReturn) {
              responseToReturn = NextResponse.next()
            }
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              responseToReturn!.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    
    // check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
      return responseToReturn || errorResponse
    }

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Missing gameId' },
        { status: 400 }
      )
      return responseToReturn || errorResponse
    }

    // get all interactions for this game
    const { data: interactions, error } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('game_id', gameId)

    if (error) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Failed to fetch interactions' },
        { status: 500 }
      )
      return responseToReturn || errorResponse
    }

    // transform to object for easier access
    const interactionMap = interactions.reduce((acc, interaction) => {
      acc[interaction.action] = true
      return acc
    }, {} as Record<string, boolean>)

    const successResponse = NextResponse.json({
      success: true,
      data: {
        liked: interactionMap.like || false,
        favorited: interactionMap.favorite || false,
        played: interactionMap.played || false
      }
    })
    return responseToReturn || successResponse

  } catch (error) {
    console.error('Error in interactions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
