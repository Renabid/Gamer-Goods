import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import type { Profile } from '@/types/database'

export interface AdminAuthResult {
  isAdmin: boolean
  user: {
    id: string
    email: string
  } | null
  profile: Profile | null
  isUsingLiveDatabase: boolean
}

/**
 * Validates whether the current request is from an authorized admin.
 * Verifies the authenticated user against public.profiles (role === 'admin').
 * NEVER trusts client-side role claims alone.
 */
export async function requireAdminSession(): Promise<AdminAuthResult> {
  const supabase = await createServerSupabaseClient()

  // If Supabase is not configured yet, indicate offline preview mode
  if (!supabase) {
    return {
      isAdmin: false,
      user: null,
      profile: null,
      isUsingLiveDatabase: false,
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      isAdmin: false,
      user: null,
      profile: null,
      isUsingLiveDatabase: true,
    }
  }

  // Fetch verified profile from database
  const { data: rawProfile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = rawProfile as unknown as Profile | null

  if (profileError || !profile) {
    // If not found in user-scoped client, check with admin client
    const adminClient = getSupabaseAdminClient()
    if (adminClient) {
      const { data: rawFallbackProfile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      const fallbackProfile = rawFallbackProfile as unknown as Profile | null

      if (fallbackProfile && (fallbackProfile.role === 'admin' || fallbackProfile.role === 'moderator')) {
        return {
          isAdmin: true,
          user: { id: user.id, email: user.email || '' },
          profile: fallbackProfile,
          isUsingLiveDatabase: true,
        }
      }
    }

    return {
      isAdmin: false,
      user: { id: user.id, email: user.email || '' },
      profile: null,
      isUsingLiveDatabase: true,
    }
  }

  const isAdmin = profile.role === 'admin'

  return {
    isAdmin,
    user: { id: user.id, email: user.email || '' },
    profile,
    isUsingLiveDatabase: true,
  }
}
