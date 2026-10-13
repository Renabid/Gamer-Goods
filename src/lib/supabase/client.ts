import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Checks whether Supabase environment variables are properly configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return Boolean(
    url &&
    anonKey &&
    !url.includes('your-project-id') &&
    !anonKey.includes('...')
  )
}

let clientInstance: SupabaseClient<Database> | null = null

/**
 * Client-side / Public Supabase client instance.
 * Safe to use in browser and server components.
 * Returns null if environment variables are not yet configured.
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!clientInstance) {
    clientInstance = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: typeof window !== 'undefined',
      },
    })
  }

  return clientInstance
}
