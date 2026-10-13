import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    if (!supabase) {
      return NextResponse.json(
        {
          error:
            'Supabase is not configured yet. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local to enable live database authentication.',
          isConfigured: false,
        },
        { status: 503 }
      )
    }

    // 1. Authenticate credentials with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 2. Authorize admin privileges against database public.profiles
    const adminClient = getSupabaseAdminClient()
    const clientToUse = adminClient || supabase

    const { data: rawProfile, error: profileError } = await clientToUse
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    const profile = rawProfile as unknown as Profile | null

    if (profileError || !profile || profile.role !== 'admin') {
      // Sign user out immediately if they are not an authorized admin
      await supabase.auth.signOut()
      return NextResponse.json(
        {
          error:
            'Access denied: This account does not possess authorized administrator privileges.',
        },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile.role,
        fullName: profile.full_name,
      },
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
