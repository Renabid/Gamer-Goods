import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/auth/admin-guard'

export async function POST(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const {
      product_id,
      name,
      slug,
      description,
      image_url,
      price_poisha,
      compare_at_price_poisha,
      in_stock,
      stock_quantity,
      display_order,
      is_active,
    } = body

    if (!product_id || !name || !slug || price_poisha === undefined) {
      return NextResponse.json(
        { error: 'Product ID, package name, slug, and price are required' },
        { status: 400 }
      )
    }

    if (price_poisha < 0) {
      return NextResponse.json(
        { error: 'Price in poisha cannot be negative' },
        { status: 400 }
      )
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        {
          error:
            'Database connection not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to persist packages.',
        },
        { status: 503 }
      )
    }

    const { data, error } = await client
      .from('product_variants')
      .insert({
        product_id,
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        price_poisha: Number(price_poisha),
        compare_at_price_poisha: compare_at_price_poisha ? Number(compare_at_price_poisha) : null,
        in_stock: in_stock ?? true,
        stock_quantity: stock_quantity !== undefined && stock_quantity !== null && stock_quantity !== '' ? Number(stock_quantity) : null,
        display_order: Number(display_order) || 0,
        is_active: is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects package changes
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')
    revalidatePath('/admin')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true, variant: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Variant creation failed'
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
      description,
      image_url,
      price_poisha,
      compare_at_price_poisha,
      in_stock,
      stock_quantity,
      display_order,
      is_active,
    } = body

    if (!id || !name || !slug || price_poisha === undefined) {
      return NextResponse.json(
        { error: 'Variant ID, package name, slug, and price are required' },
        { status: 400 }
      )
    }

    if (price_poisha < 0) {
      return NextResponse.json(
        { error: 'Price in poisha cannot be negative' },
        { status: 400 }
      )
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        {
          error:
            'Database connection not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local to persist packages.',
        },
        { status: 503 }
      )
    }

    const { data, error } = await client
      .from('product_variants')
      .update({
        name,
        slug,
        description: description || null,
        image_url: image_url || null,
        price_poisha: Number(price_poisha),
        compare_at_price_poisha: compare_at_price_poisha ? Number(compare_at_price_poisha) : null,
        in_stock: in_stock ?? true,
        stock_quantity: stock_quantity !== undefined && stock_quantity !== null && stock_quantity !== '' ? Number(stock_quantity) : null,
        display_order: Number(display_order) || 0,
        is_active: is_active ?? true,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects package changes
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')
    revalidatePath('/admin')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true, variant: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Variant update failed'
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

    if (!id) {
      return NextResponse.json({ error: 'Variant ID is required' }, { status: 400 })
    }

    const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
    if (!client) {
      return NextResponse.json(
        {
          error:
            'Database connection not configured. Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.',
        },
        { status: 503 }
      )
    }

    const { error } = await client.from('product_variants').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Invalidate caches so customer storefront immediately reflects package removal
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')
    revalidatePath('/admin')
    revalidatePath('/admin/products')

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Variant deletion failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
