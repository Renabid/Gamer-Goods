import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

function getTrustedSiteUrl(request: Request): string {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envSiteUrl) {
    try {
      const parsed = new URL(envSiteUrl)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin
      }
    } catch {
      // Fallback
    }
  }

  const originHeader = request.headers.get('origin') || request.headers.get('host') || ''
  if (originHeader) {
    try {
      const fullOrigin = originHeader.startsWith('http://') || originHeader.startsWith('https://')
        ? originHeader
        : `http://${originHeader}`
      const parsed = new URL(fullOrigin)
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.endsWith('.localhost')
      ) {
        return parsed.origin
      }
    } catch {
      // Ignore
    }
  }

  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 })
    }

    const cleanEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Database service is currently unconfigured.' }, { status: 503 })
    }

    // Check if the user is already confirmed using admin client
    const adminClient = getSupabaseAdminClient()
    if (adminClient) {
      const { data: usersData } = await adminClient.auth.admin.listUsers()
      if (usersData?.users) {
        const existing = usersData.users.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        )
        if (existing && existing.email_confirmed_at) {
          return NextResponse.json(
            {
              error: 'This account is already verified. Please sign in directly.',
              alreadyConfirmed: true,
            },
            { status: 400 }
          )
        }
      }
    }

    const siteUrl = getTrustedSiteUrl(request)
    const callbackUrl = `${siteUrl}/auth/callback`

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: callbackUrl,
      },
    })

    if (resendError) {
      if (resendError.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            error:
              'Email rate limit reached. Please wait a few minutes before requesting another confirmation email.',
          },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: resendError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'A fresh confirmation link has been sent to your email. Please check your inbox and spam folder.',
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to resend confirmation email.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
