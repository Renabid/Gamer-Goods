import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Resolves a trusted, validated public site URL for auth redirects.
 * Prioritizes NEXT_PUBLIC_SITE_URL in production, and allows verified localhost in development.
 * Never blindly trusts arbitrary Origin headers.
 */
function getTrustedSiteUrl(request: Request): string {
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envSiteUrl) {
    try {
      const parsed = new URL(envSiteUrl)
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return parsed.origin
      }
    } catch {
      // Fallback if env variable is malformed
    }
  }

  // Validate request origin for local development
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
      // Ignore invalid headers
    }
  }

  return 'http://localhost:3000'
}

export async function POST(request: Request) {
  try {
    const { email, password, fullName, phone } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const cleanEmail = email.trim().toLowerCase()
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
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

    const cleanName = (fullName || '').trim()
    const cleanPhone = (phone || '').trim()
    const siteUrl = getTrustedSiteUrl(request)
    const callbackUrl = `${siteUrl}/auth/callback`

    // Pre-check existing account status to prevent silent identity dropping
    const adminClient = getSupabaseAdminClient()
    if (adminClient) {
      const { data: existingUsers } = await adminClient.auth.admin.listUsers()
      if (existingUsers?.users) {
        const existing = existingUsers.users.find(
          (u) => u.email?.toLowerCase() === cleanEmail
        )
        if (existing) {
          if (existing.email_confirmed_at) {
            // Already verified: tell user directly to sign in instead of leaving them waiting for email
            return NextResponse.json(
              {
                error:
                  'An account with this email address already exists and is verified. Please sign in.',
                alreadyRegistered: true,
              },
              { status: 409 }
            )
          }

          // Existing but unconfirmed: resend fresh confirmation link
          const { error: resendErr } = await supabase.auth.resend({
            type: 'signup',
            email: cleanEmail,
            options: { emailRedirectTo: callbackUrl },
          })

          if (resendErr && resendErr.message?.toLowerCase().includes('rate limit')) {
            return NextResponse.json(
              {
                error:
                  'Email rate limit reached. Please wait a few minutes before requesting another confirmation email.',
              },
              { status: 429 }
            )
          }

          return NextResponse.json({
            success: true,
            requiresEmailConfirmation: true,
            message:
              'Account exists but is not yet confirmed. We have sent a confirmation link to your email. Please check your inbox and spam folder.',
            user: {
              id: existing.id,
              email: cleanEmail,
              fullName: cleanName,
              role: 'customer',
            },
          })
        }
      }
    }

    // Sign up new customer
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: String(password),
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
        },
        emailRedirectTo: callbackUrl,
      },
    })

    if (authError) {
      if (authError.message?.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            error:
              'Email send rate limit reached. Supabase limits outgoing confirmation emails per hour. Please wait a few minutes, or sign in if already registered.',
          },
          { status: 429 }
        )
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Registration could not be completed.' }, { status: 400 })
    }

    // Check if identities array is empty (user enumeration protection trigger)
    if (authData.user.identities && authData.user.identities.length === 0) {
      return NextResponse.json(
        {
          error:
            'An account with this email address already exists. Please sign in or reset your password.',
          alreadyRegistered: true,
        },
        { status: 409 }
      )
    }

    // Ensure profile has phone, full_name, and strictly role 'customer'
    if (adminClient) {
      await adminClient
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: cleanEmail,
          full_name: cleanName || null,
          phone: cleanPhone || null,
          role: 'customer',
        })
    }

    const requiresEmailConfirmation = !authData.session || (authData.user && !authData.user.confirmed_at)

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: Boolean(requiresEmailConfirmation),
      message: requiresEmailConfirmation
        ? 'Account created! Check your email and click the confirmation link to activate your Gamer Goods account.'
        : 'Account registered successfully.',
      user: {
        id: authData.user.id,
        email: cleanEmail,
        fullName: cleanName,
        role: 'customer',
      },
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Registration failed'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
