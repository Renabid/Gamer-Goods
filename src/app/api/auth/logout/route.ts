import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Sign out error'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
