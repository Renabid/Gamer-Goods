import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ orders: [] })
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ orders: [] })
    }

    const adminClient = getSupabaseAdminClient()
    const clientToUse = adminClient || supabase

    // Find orders placed by this user or matching their email
    const { data: orders, error: ordersError } = await clientToUse
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount_poisha,
        created_at,
        order_items (
          id,
          product_name,
          variant_name,
          quantity
        ),
        payments (
          status,
          payment_method,
          transaction_id
        )
      `)
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .order('created_at', { ascending: false })
      .limit(10)

    if (ordersError) {
      return NextResponse.json({ orders: [] })
    }

    return NextResponse.json({ orders: orders || [] })
  } catch {
    return NextResponse.json({ orders: [] })
  }
}
