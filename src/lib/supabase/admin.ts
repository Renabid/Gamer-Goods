import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Checks whether Supabase Service Role Key is configured for admin operations.
 */
export function isSupabaseAdminConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return Boolean(
    url &&
    serviceKey &&
    !url.includes('your-project-id') &&
    !serviceKey.includes('...')
  )
}

export type SupabaseAdminClient = SupabaseClient<Database>

/**
 * SERVER-ONLY Supabase Admin client using the service role key.
 * CAUTION: Bypasses Row Level Security (RLS).
 * MUST NEVER BE IMPORTED OR USED IN CLIENT COMPONENTS.
 */
export function getSupabaseAdminClient(): SupabaseAdminClient | null {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL: Supabase Admin client cannot be invoked in browser/client components!')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey || !isSupabaseAdminConfigured()) {
    return null
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
