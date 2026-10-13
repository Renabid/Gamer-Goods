import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/auth/admin-guard'
import type { Product } from '@/types/database'

function formatProductDatabaseError(error: { code?: string; message: string }): string {
  if (error.code === '42P01') {
    return 'Database table missing: The "products" table does not exist in Supabase. Please execute migrations from supabase/migrations/.'
  }
  if (error.code === '42501') {
    return 'Permission denied (RLS): Row Level Security blocked product modification. Ensure you are signed in as an admin or provide SUPABASE_SERVICE_ROLE_KEY in .env.local.'
  }
  if (error.code === '23505') {
    return 'Conflict: A product with this URL slug already exists.'
  }
  if (error.code === '23503') {
    return 'Invalid Category: The specified category_id does not exist in the database.'
  }
  return `Database error (${error.code || 'UNKNOWN'}): ${error.message}`
}

function getMissingProductSupabaseConfigMessage(): string {
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
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      name,
      slug,
      category_id,
      subtitle,
      description,
      image_url,
      thumbnail_url,
      banner_url,
      platform_notice,
      delivery_type,
      requires_player_id,
      requires_server_id,
      player_id_label,
      server_id_label,
      server_input_type,
      server_options,
      custom_fields,
      is_featured,
      is_active,
    } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Product name and unique slug are required' },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'Category selection is required for all products' },
        { status: 400 }
      )
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        { error: getMissingProductSupabaseConfigMessage() },
        { status: 503 }
      )
    }

    const finalImage = image_url || thumbnail_url || banner_url || null

    const insertPayload: Record<string, unknown> = {
      name,
      slug,
      category_id: category_id || null,
      subtitle: subtitle || null,
      description: description || null,
      image_url: finalImage,
      thumbnail_url: thumbnail_url || finalImage,
      banner_url: banner_url || finalImage,
      platform_notice: platform_notice || null,
      delivery_type: delivery_type || 'manual',
      requires_player_id: Boolean(requires_player_id),
      requires_server_id: Boolean(requires_server_id),
      player_id_label: player_id_label || 'Player ID / UID',
      server_id_label: server_id_label || 'Zone / Server ID',
      is_featured: Boolean(is_featured),
      is_active: is_active ?? true,
      is_archived: false,
    }

    if (server_input_type !== undefined) {
      insertPayload.server_input_type = server_input_type === 'dropdown' ? 'dropdown' : 'text'
    }
    if (server_options !== undefined) {
      insertPayload.server_options = Array.isArray(server_options) ? server_options : []
    }
    if (custom_fields !== undefined) {
      insertPayload.custom_fields = Array.isArray(custom_fields) ? custom_fields : []
    }

    const { data, error } = await (client.from('products') as unknown as {
      insert: (record: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: Product | null; error: { code?: string; message: string } | null }> } }
    })
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: formatProductDatabaseError(error) }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects the new product
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')
    if (slug) {
      revalidatePath(`/products/${slug}`)
    }
    revalidatePath('/admin')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true, product: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Product creation failed'
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
    const {
      id,
      name,
      slug,
      category_id,
      subtitle,
      description,
      image_url,
      thumbnail_url,
      banner_url,
      platform_notice,
      delivery_type,
      requires_player_id,
      requires_server_id,
      player_id_label,
      server_id_label,
      server_input_type,
      server_options,
      custom_fields,
      is_featured,
      is_active,
      is_archived,
    } = body

    if (!id || !name || !slug) {
      return NextResponse.json(
        { error: 'Product ID, name and slug are required' },
        { status: 400 }
      )
    }

    if (!category_id) {
      return NextResponse.json(
        { error: 'Category selection is required for all products' },
        { status: 400 }
      )
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        { error: getMissingProductSupabaseConfigMessage() },
        { status: 503 }
      )
    }

    const finalImage = image_url || thumbnail_url || banner_url || null

    const updatePayload: Record<string, unknown> = {
      name,
      slug,
      category_id: category_id || null,
      subtitle: subtitle || null,
      description: description || null,
      image_url: finalImage,
      thumbnail_url: thumbnail_url || finalImage,
      banner_url: banner_url || finalImage,
      platform_notice: platform_notice || null,
      delivery_type: delivery_type || 'manual',
      requires_player_id: Boolean(requires_player_id),
      requires_server_id: Boolean(requires_server_id),
      player_id_label: player_id_label || 'Player ID / UID',
      server_id_label: server_id_label || 'Zone / Server ID',
      is_featured: Boolean(is_featured),
      is_active: is_active ?? true,
      is_archived: is_archived ?? false,
    }

    if (server_input_type !== undefined) {
      updatePayload.server_input_type = server_input_type === 'dropdown' ? 'dropdown' : 'text'
    }
    if (server_options !== undefined) {
      updatePayload.server_options = Array.isArray(server_options) ? server_options : []
    }
    if (custom_fields !== undefined) {
      updatePayload.custom_fields = Array.isArray(custom_fields) ? custom_fields : []
    }

    const { data, error } = await (client.from('products') as unknown as {
      update: (record: Record<string, unknown>) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: Product | null; error: { code?: string; message: string } | null }> } } }
    })
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: formatProductDatabaseError(error) }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects the product changes
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')
    if (slug) {
      revalidatePath(`/products/${slug}`)
    }
    revalidatePath('/admin')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true, product: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Product update failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        {
          error:
            'Database connection not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to persist products.',
        },
        { status: 503 }
      )
    }

    if (permanent) {
      // Hard delete from database (cascades to product_variants)
      const { error } = await client.from('products').delete().eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      // Soft archive product safely
      const { error } = await client
        .from('products')
        .update({ is_archived: true, is_active: false })
        .eq('id', id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately removes hidden/deleted product
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')
    revalidatePath('/admin')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Product deletion failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
