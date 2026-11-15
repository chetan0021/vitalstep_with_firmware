import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    console.log('Attempting login for:', email)
    console.log('Supabase URL:', supabaseUrl)

    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    })

    if (error) {
      console.error('Auth error:', error)
      return NextResponse.json(
        { error: error.message || 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!data.session) {
      console.error('No session created')
      return NextResponse.json(
        { error: 'No session created' },
        { status: 401 }
      )
    }

    console.log('Login successful for:', email)

    // Return the session data
    return NextResponse.json(
      {
        success: true,
        session: data.session,
        user: data.user,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Login error:', error)
    
    // Check for network/DNS errors
    if (error.code === 'ENOTFOUND' || error.syscall === 'getaddrinfo') {
      return NextResponse.json(
        { error: 'Cannot reach Supabase. Check your internet connection.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'An error occurred during login' },
      { status: 500 }
    )
  }
}
