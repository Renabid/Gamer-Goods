import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { requireAdminSession } from '@/lib/auth/admin-guard'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/data/admin'
import type { PaymentMethod } from '@/types/database'

function formatPaymentDatabaseError(error: { code?: string; message: string }): string {
  if (error.code === '42P01') {
    return 'Database table missing: The "payment_methods" table does not exist in Supabase. Please run the SQL migration.'
  }
  if (error.code === '23505') {
    return 'Conflict: A payment method with this slug already exists.'
  }
  return `Database error: ${error.message}`
}

export async function GET() {
  const client = getSupabaseAdminClient() || (await createServerSupabaseClient())
  if (!client) {
    return NextResponse.json({ paymentMethods: DEFAULT_PAYMENT_METHODS })
  }

  try {
    const { data, error } = await client
      .from('payment_methods')
      .select('*')
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return NextResponse.json({ paymentMethods: DEFAULT_PAYMENT_METHODS })
    }

    return NextResponse.json({ paymentMethods: data })
  } catch {
    return NextResponse.json({ paymentMethods: DEFAULT_PAYMENT_METHODS })
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 403 })
  }

  const client = getSupabaseAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Database service is not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const {
      name,
      slug,
      payment_type,
      account_number,
      account_type,
      instructions,
      qr_code_url,
      is_active,
      display_order,
    } = body

    if (!name || !account_number) {
      return NextResponse.json({ error: 'Method name and account number are required' }, { status: 400 })
    }

    const cleanSlug = (slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'method-' + Date.now()

    const { data, error } = await (client.from('payment_methods') as unknown as {
      insert: (record: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: PaymentMethod | null; error: { code?: string; message: string } | null }> } }
    })
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        payment_type: payment_type || 'mfs',
        account_number: account_number.trim(),
        account_type: account_type || 'Personal',
        instructions: instructions ? instructions.trim() : null,
        qr_code_url: qr_code_url ? qr_code_url.trim() : null,
        is_active: is_active ?? true,
        display_order: Number(display_order) || 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: formatPaymentDatabaseError(error) }, { status: 500 })
    }

    revalidatePath('/admin/payments')
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')

    return NextResponse.json({ success: true, paymentMethod: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create payment method'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 403 })
  }

  const client = getSupabaseAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Database service is not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const {
      id,
      name,
      slug,
      payment_type,
      account_number,
      account_type,
      instructions,
      qr_code_url,
      is_active,
      display_order,
    } = body

    if (!id || !name || !account_number) {
      return NextResponse.json({ error: 'Method ID, name and account number are required' }, { status: 400 })
    }

    const { data, error } = await (client.from('payment_methods') as unknown as {
      update: (record: Record<string, unknown>) => { eq: (col: string, val: string) => { select: () => { single: () => Promise<{ data: PaymentMethod | null; error: { code?: string; message: string } | null }> } } }
    })
      .update({
        name: name.trim(),
        slug: slug.trim(),
        payment_type: payment_type || 'mfs',
        account_number: account_number.trim(),
        account_type: account_type || 'Personal',
        instructions: instructions ? instructions.trim() : null,
        qr_code_url: qr_code_url ? qr_code_url.trim() : null,
        is_active: Boolean(is_active),
        display_order: Number(display_order) || 0,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: formatPaymentDatabaseError(error) }, { status: 500 })
    }

    revalidatePath('/admin/payments')
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')

    return NextResponse.json({ success: true, paymentMethod: data })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update payment method'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 403 })
  }

  const client = getSupabaseAdminClient()
  if (!client) {
    return NextResponse.json({ error: 'Database service is not configured' }, { status: 503 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Payment Method ID is required' }, { status: 400 })
    }

    const { error } = await client.from('payment_methods').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: formatPaymentDatabaseError(error) }, { status: 500 })
    }

    revalidatePath('/admin/payments')
    revalidatePath('/')
    revalidatePath('/products/[slug]', 'page')

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete payment method'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
