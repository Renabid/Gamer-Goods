import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ user: null, isConfigured: false })
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null, isConfigured: true })
    }

    // Fetch verified profile
    const adminClient = getSupabaseAdminClient()
    const clientToUse = adminClient || supabase

    const { data: rawProfile } = await clientToUse
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const profile = rawProfile as unknown as Profile | null

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: profile?.full_name || '',
        phone: profile?.phone || '',
        role: profile?.role || 'customer',
      },
      isConfigured: true,
    })
  } catch {
    return NextResponse.json({ user: null })
  }
}
