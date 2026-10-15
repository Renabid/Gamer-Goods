import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || requestUrl.searchParams.get('redirect_to')

  // Validate local redirect target to prevent open redirect vulnerabilities
  let redirectTarget = '/login?verified=true'
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
    redirectTarget = next
  }

  if (code) {
    const supabase = await createServerSupabaseClient()
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (!error) {
        return NextResponse.redirect(new URL(redirectTarget, requestUrl.origin))
      }
      console.error('Email confirmation code exchange failed:', error.message)
    }
  }

  // If code is missing or exchange failed, redirect to login with helpful error flag
  return NextResponse.redirect(new URL('/login?error=verification_failed', requestUrl.origin))
}
