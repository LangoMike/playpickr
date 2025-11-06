import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
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
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      const errorResponse = NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
      return responseToReturn || errorResponse
    }

    // Get counts for each interaction type
    const [likedResult, favoriteResult, playedResult] = await Promise.all([
      supabase
        .from('user_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'like'),
      supabase
        .from('user_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'favorite'),
      supabase
        .from('user_interactions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('action', 'played')
    ])

    const stats = {
      liked: likedResult.count || 0,
      favorite: favoriteResult.count || 0,
      played: playedResult.count || 0
    }

    const successResponse = NextResponse.json({
      success: true,
      data: stats
    })
    return responseToReturn || successResponse

  } catch (error) {
    console.error('Error in interactions stats API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

