import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

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
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: 'Auth error', 
          details: authError.message 
        },
        { status: 401 }
      )
      return responseToReturn || errorResponse
    }
    
    if (!user) {
      const errorResponse = NextResponse.json(
        { 
          success: false, 
          error: 'No user found' 
        },
        { status: 401 }
      )
      return responseToReturn || errorResponse
    }

    const successResponse = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      }
    })
    return responseToReturn || successResponse

  } catch (error) {
    console.error('Error in test-auth API:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
