import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/auth/admin-guard'

export async function GET() {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
  if (!client) {
    return NextResponse.json({ categories: [] })
  }

  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ categories: data })
}

function formatCategoryDatabaseError(error: { code?: string; message: string }): string {
  if (error.code === '42P01') {
    return 'Database table missing: The "categories" table does not exist in Supabase. Please execute migrations from supabase/migrations/.'
  }
  if (error.code === '42501') {
    return 'Permission denied (RLS): Row Level Security blocked category modification. Ensure you are signed in as an admin or provide SUPABASE_SERVICE_ROLE_KEY in .env.local.'
  }
  if (error.code === '23505') {
    return 'Conflict: A category with this name or slug already exists.'
  }
  return `Database error (${error.code || 'UNKNOWN'}): ${error.message}`
}

function getMissingSupabaseConfigMessage(): string {
  const missing: string[] = []
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || url.includes('your-project-id')) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }
  if (!serviceKey && !anonKey) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }
  if (missing.length > 0) {
    return `Database connection is not configured. Missing in .env.local: ${missing.join(', ')}.`
  }
  return 'Database connection is not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.'
}

export async function POST(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication required to create categories' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { name, slug, description, icon_name, display_order, is_active } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Category name and slug are required' },
        { status: 400 }
      )
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        { error: getMissingSupabaseConfigMessage() },
        { status: 503 }
      )
    }

    const { data, error } = await client
      .from('categories')
      .insert({
        name,
        slug,
        description: description || null,
        icon_name: icon_name || 'Gamepad2',
        display_order: Number(display_order) || 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: formatCategoryDatabaseError(error) }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects category changes
    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true, category: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Category creation error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, name, slug, description, icon_name, display_order, is_active } = body

    if (!id || !name || !slug) {
      return NextResponse.json(
        { error: 'Category ID, name and slug are required' },
        { status: 400 }
      )
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        { error: getMissingSupabaseConfigMessage() },
        { status: 503 }
      )
    }

    const { data, error } = await client
      .from('categories')
      .update({
        name,
        slug,
        description: description || null,
        icon_name: icon_name || 'Gamepad2',
        display_order: Number(display_order) || 0,
        is_active: is_active ?? true,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: formatCategoryDatabaseError(error) }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects category changes
    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true, category: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Category update error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized: Admin authentication required to delete categories' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        { error: getMissingSupabaseConfigMessage() },
        { status: 503 }
      )
    }

    const { error } = await client.from('categories').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: formatCategoryDatabaseError(error) }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects category deletion
    revalidatePath('/')
    revalidatePath('/admin')
    revalidatePath('/admin/categories')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Category delete error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
