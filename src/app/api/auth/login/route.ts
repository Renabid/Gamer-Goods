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
            'Supabase is not configured yet. Live database authentication requires configuration in .env.local.',
          isConfigured: false,
        },
        { status: 503 }
      )
    }

    // 1. Authenticate credentials with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: String(email).trim(),
      password: String(password),
    })

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid email or password' },
        { status: 401 }
      )
    }

    // 2. Fetch profile from database
    const adminClient = getSupabaseAdminClient()
    const clientToUse = adminClient || supabase

    const { data: rawProfile } = await clientToUse
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    const profile = rawProfile as unknown as Profile | null

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: profile?.role || 'customer',
        fullName: profile?.full_name || '',
        phone: profile?.phone || '',
      },
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Login failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
