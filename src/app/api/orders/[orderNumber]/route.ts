import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  if (!orderNumber || typeof orderNumber !== 'string') {
    return NextResponse.json({ error: 'Order reference is required.' }, { status: 400 })
  }

  const cleanOrderNumber = orderNumber.trim().toUpperCase()

  const adminClient = getSupabaseAdminClient()
  const userClient = await createServerSupabaseClient()
  const client = adminClient || userClient

  if (!client) {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 503 })
  }

  try {
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, order_number, status, total_amount_poisha, created_at, customer_email, admin_notes')
      .eq('order_number', cleanOrderNumber)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found. Please check your order reference.' }, { status: 404 })
    }

    // Fetch order items and payments
    const [itemsRes, paymentsRes] = await Promise.all([
      client
        .from('order_items')
        .select('id, product_name, variant_name, quantity, player_id_value, server_id_value, custom_fields, unit_price_poisha, digital_code_delivered')
        .eq('order_id', order.id),
      client
        .from('payments')
        .select('id, payment_method, status, amount_poisha, transaction_id, sender_number, account_details, admin_verified_at, created_at')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false })
        .limit(1),
    ])

    const latestPayment = paymentsRes.data && paymentsRes.data.length > 0 ? paymentsRes.data[0] : null
    const orderItems = itemsRes.data || []

    return NextResponse.json({
      success: true,
      order: {
        order_number: order.order_number,
        status: order.status,
        total_amount_poisha: order.total_amount_poisha,
        created_at: order.created_at,
        customer_email: order.customer_email ? `${order.customer_email.slice(0, 3)}***@${order.customer_email.split('@')[1] || ''}` : null,
        items: orderItems,
        payment: latestPayment
          ? {
              payment_method: latestPayment.payment_method,
              status: latestPayment.status,
              transaction_id: latestPayment.transaction_id,
              sender_number: latestPayment.sender_number,
              account_details: latestPayment.account_details,
              admin_verified_at: latestPayment.admin_verified_at,
            }
          : null,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query order'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
