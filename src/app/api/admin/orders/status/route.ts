import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/auth/admin-guard'

export async function PATCH(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 403 })
  }

  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return NextResponse.json({ error: 'Database service is not configured' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { orderId, status, paymentStatus, adminNotes } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid order status: ${status}` }, { status: 400 })
    }

    const validPaymentStatuses = ['initiated', 'processing', 'completed', 'failed', 'refunded']
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ error: `Invalid payment status: ${paymentStatus}` }, { status: 400 })
    }

    // 1. Update Order status if provided
    const updatePayload: { status?: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'; admin_notes?: string } = {}
    if (status) updatePayload.status = status
    if (adminNotes !== undefined) updatePayload.admin_notes = adminNotes

    if (Object.keys(updatePayload).length > 0) {
      const { error: orderError } = await adminClient
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)

      if (orderError) {
        console.error('Failed to update order:', orderError)
        return NextResponse.json({ error: orderError.message }, { status: 500 })
      }
    }

    // 2. Update Payment status if provided
    if (paymentStatus) {
      const paymentUpdatePayload: Record<string, unknown> = { status: paymentStatus }
      if (paymentStatus === 'completed' || paymentStatus === 'failed') {
        paymentUpdatePayload.admin_verified_at = new Date().toISOString()
        paymentUpdatePayload.admin_verified_by = auth.user?.id || null
      }

      const { error: paymentError } = await (adminClient.from('payments') as unknown as {
        update: (arg: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: { message: string } | null }> }
      })
        .update(paymentUpdatePayload)
        .eq('order_id', orderId)

      if (paymentError) {
        // Fallback without new columns if migration hasn't been run
        await adminClient
          .from('payments')
          .update({ status: paymentStatus })
          .eq('order_id', orderId)
      }
    }

    // 3. Log an audit event
    await adminClient.from('order_events').insert({
      order_id: orderId,
      actor_id: auth.user?.id || null,
      event_type: status || 'updated',
      notes: `Order status updated to ${status || 'unchanged'}${paymentStatus ? `, payment: ${paymentStatus}` : ''}`,
      metadata: {
        status,
        paymentStatus,
        adminNotes,
      },
    })

    revalidatePath('/admin')
    revalidatePath('/admin/orders')

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to update order'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
