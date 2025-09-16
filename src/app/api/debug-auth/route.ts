import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== DEBUG AUTH API ===')
    
    const supabase = await createClient()
    
    // Check cookies
    const cookies = request.cookies.getAll()
    console.log('Cookies:', cookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User error:', userError)
    console.log('User:', user ? { id: user.id, email: user.email } : 'No user')
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session error:', sessionError)
    console.log('Session:', session ? { access_token: !!session.access_token, expires_at: session.expires_at } : 'No session')
    
    if (userError) {
      return NextResponse.json({
        success: false,
        error: 'User error',
        details: userError.message,
        cookies: cookies.length
      }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'No user found',
        cookies: cookies.length,
        cookieNames: cookies.map(c => c.name)
      }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      session: session ? {
        hasAccessToken: !!session.access_token,
        expiresAt: session.expires_at
      } : null,
      cookies: cookies.length
    })

  } catch (error) {
    console.error('Error in debug-auth API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
