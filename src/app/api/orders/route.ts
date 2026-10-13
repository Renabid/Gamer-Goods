import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DEFAULT_PAYMENT_METHODS } from '@/lib/data/admin'
import type { PaymentMethod, CustomFieldConfig } from '@/types/database'

export interface CreateOrderPayload {
  variantId: string
  quantity: number
  playerId?: string
  serverId?: string
  customFields?: Record<string, string>
  customerEmail: string
  customerName?: string
  customerPhone?: string
  paymentMethod: string // slug or id or name
  paymentMethodId?: string
  senderNumber?: string
  transactionId: string
}

function generateOrderNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase()
  const randomDigits = Math.floor(1000 + Math.random() * 9000)
  return `GG-${year}-${randomChars}${randomDigits}`
}

export async function POST(request: Request) {
  const adminClient = getSupabaseAdminClient()
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Database service is not configured. Please verify SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    )
  }

  let body: CreateOrderPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 })
  }

  const {
    variantId,
    quantity,
    playerId,
    serverId,
    customFields,
    customerEmail,
    customerName,
    customerPhone,
    paymentMethod,
    paymentMethodId,
    senderNumber,
    transactionId,
  } = body

  // 1. Basic field validation
  if (!variantId || typeof variantId !== 'string') {
    return NextResponse.json({ error: 'Please select a valid package/variant.' }, { status: 400 })
  }

  const parsedQuantity = Number(quantity)
  if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 50) {
    return NextResponse.json({ error: 'Quantity must be a positive integer between 1 and 50.' }, { status: 400 })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!customerEmail || typeof customerEmail !== 'string' || !emailRegex.test(customerEmail.trim())) {
    return NextResponse.json({ error: 'A valid email address is required for order confirmation.' }, { status: 400 })
  }

  if (!paymentMethod || typeof paymentMethod !== 'string') {
    return NextResponse.json({ error: 'Please select a valid payment method.' }, { status: 400 })
  }

  const cleanTrxId = (transactionId || '').trim().toUpperCase()
  if (!cleanTrxId || cleanTrxId.length < 4 || cleanTrxId.length > 50) {
    return NextResponse.json(
      { error: 'A valid Transaction ID (TrxID) is required to verify your transfer.' },
      { status: 400 }
    )
  }

  // 2. Resolve authenticated user session if present (optional guest checkout)
  let authenticatedUserId: string | null = null
  try {
    const userClient = await createServerSupabaseClient()
    if (userClient) {
      const { data: { user } } = await userClient.auth.getUser()
      if (user) {
        authenticatedUserId = user.id
      }
    }
  } catch {
    // Guest checkout fallback
  }

  const orderNumber = generateOrderNumber()

  try {
    // 3.1 Check duplicate transaction ID
    const { data: existingPayment } = await adminClient
      .from('payments')
      .select('id, transaction_id, status')
      .eq('transaction_id', cleanTrxId)
      .in('status', ['initiated', 'processing', 'completed'])
      .maybeSingle()

    if (existingPayment) {
      return NextResponse.json(
        { error: 'This Transaction ID has already been submitted for another order. Please check your reference.' },
        { status: 409 }
      )
    }

    // 3.2 Fetch authoritative Product & Variant details from Supabase (NEVER trust client prices)
    const { data: variant, error: variantError } = await adminClient
      .from('product_variants')
      .select('id, name, price_poisha, in_stock, is_active, stock_quantity, product_id')
      .eq('id', variantId)
      .single()

    if (variantError || !variant) {
      return NextResponse.json({ error: 'The selected product package does not exist.' }, { status: 404 })
    }

    if (!variant.is_active) {
      return NextResponse.json({ error: 'This package is currently disabled.' }, { status: 400 })
    }

    if (!variant.in_stock) {
      return NextResponse.json({ error: 'This package is currently out of stock.' }, { status: 400 })
    }

    if (variant.stock_quantity !== null && variant.stock_quantity < parsedQuantity) {
      return NextResponse.json(
        { error: `Insufficient stock available. Only ${variant.stock_quantity} available.` },
        { status: 400 }
      )
    }

    const { data: rawProduct, error: productError } = await adminClient
      .from('products')
      .select('*')
      .eq('id', variant.product_id)
      .single()

    if (productError || !rawProduct || !rawProduct.is_active || rawProduct.is_archived) {
      return NextResponse.json({ error: 'This product is no longer active in the catalog.' }, { status: 400 })
    }

    const product = rawProduct as typeof rawProduct & {
      server_input_type?: string
      server_options?: string[]
      custom_fields?: CustomFieldConfig[]
    }

    // 3.3 Dynamic Validation for Game Player UID, Server ID & Custom Fields
    if (product.requires_player_id && (!playerId || !playerId.trim())) {
      return NextResponse.json(
        { error: `${product.player_id_label || 'Player ID (UID)'} is required for this product.` },
        { status: 400 }
      )
    }

    if (product.requires_server_id) {
      if (!serverId || !serverId.trim()) {
        return NextResponse.json(
          { error: `${product.server_id_label || 'Zone / Server ID'} is required for this product.` },
          { status: 400 }
        )
      }
      // If server_input_type is dropdown with options, validate selected option
      if (
        product.server_input_type === 'dropdown' &&
        Array.isArray(product.server_options) &&
        product.server_options.length > 0
      ) {
        if (!product.server_options.includes(serverId.trim())) {
          return NextResponse.json(
            { error: `Invalid ${product.server_id_label || 'Server'}. Please select a valid option from the list.` },
            { status: 400 }
          )
        }
      }
    }

    // Validate any extra custom fields defined for this product
    const submittedCustomFields: Record<string, string> = customFields || {}
    if (Array.isArray(product.custom_fields) && product.custom_fields.length > 0) {
      for (const field of product.custom_fields) {
        const val = submittedCustomFields[field.id] ? submittedCustomFields[field.id].trim() : ''
        if (field.required && !val) {
          return NextResponse.json(
            { error: `${field.label} is required for this product.` },
            { status: 400 }
          )
        }
      }
    }

    // 3.4 Resolve & Snapshot Payment Method
    let selectedMethodRecord: PaymentMethod | null = null
    try {
      const pmQuery = adminClient.from('payment_methods').select('*')
      if (paymentMethodId) {
        const { data: pmById } = await pmQuery.eq('id', paymentMethodId).maybeSingle()
        selectedMethodRecord = pmById as PaymentMethod | null
      }
      if (!selectedMethodRecord) {
        const { data: pmBySlug } = await adminClient
          .from('payment_methods')
          .select('*')
          .or(`slug.eq.${paymentMethod},name.ilike.%${paymentMethod}%`)
          .maybeSingle()
        selectedMethodRecord = pmBySlug as PaymentMethod | null
      }
    } catch {
      // Table may not exist yet or offline fallback
    }

    if (!selectedMethodRecord) {
      selectedMethodRecord =
        DEFAULT_PAYMENT_METHODS.find(
          (m) => m.id === paymentMethodId || m.slug === paymentMethod || m.name.toLowerCase() === paymentMethod.toLowerCase()
        ) || DEFAULT_PAYMENT_METHODS[0]
    }

    // 3.5 Authoritative price calculation (in Poisha)
    const unitPricePoisha = Number(variant.price_poisha)
    const totalAmountPoisha = unitPricePoisha * parsedQuantity

    // 3.6 Insert Order record
    const { data: createdOrder, error: orderError } = await adminClient
      .from('orders')
      .insert({
        order_number: orderNumber,
        user_id: authenticatedUserId,
        customer_email: customerEmail.trim().toLowerCase(),
        customer_name: customerName ? customerName.trim() : null,
        customer_phone: customerPhone ? customerPhone.trim() : null,
        status: 'pending',
        total_amount_poisha: totalAmountPoisha,
        discount_amount_poisha: 0,
      })
      .select('id, order_number, status, total_amount_poisha, created_at')
      .single()

    if (orderError || !createdOrder) {
      console.error('Failed to insert order:', orderError)
      return NextResponse.json({ error: 'Failed to create order record. Please try again.' }, { status: 500 })
    }

    const orderId = createdOrder.id

    // Helper for cleaning up order if subsequent records fail
    const rollback = async () => {
      try {
        await adminClient.from('orders').delete().eq('id', orderId)
      } catch (cleanupErr) {
        console.error('Rollback failed for order:', orderId, cleanupErr)
      }
    }

    // 3.7 Insert Order Item with custom_fields JSONB
    const itemPayload: Record<string, unknown> = {
      order_id: orderId,
      product_id: product.id,
      product_variant_id: variant.id,
      product_name: product.name,
      variant_name: variant.name,
      unit_price_poisha: unitPricePoisha,
      quantity: parsedQuantity,
      subtotal_poisha: totalAmountPoisha,
      player_id_value: playerId ? playerId.trim() : null,
      server_id_value: serverId ? serverId.trim() : null,
      custom_fields: submittedCustomFields,
    }

    const { error: itemError } = await (adminClient.from('order_items') as unknown as {
      insert: (record: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }).insert(itemPayload)

    if (itemError) {
      // If error is missing custom_fields column before migration, retry without it
      if (itemError.message?.includes('column "custom_fields" of relation "order_items" does not exist')) {
        delete itemPayload.custom_fields
        const { error: retryItemError } = await (adminClient.from('order_items') as unknown as {
          insert: (record: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
        }).insert(itemPayload)
        if (retryItemError) {
          console.error('Failed to insert order item on fallback:', retryItemError)
          await rollback()
          return NextResponse.json({ error: 'Failed to record order item details.' }, { status: 500 })
        }
      } else {
        console.error('Failed to insert order item, rolling back order:', itemError)
        await rollback()
        return NextResponse.json({ error: 'Failed to record order item details.' }, { status: 500 })
      }
    }

    // 3.8 Insert Payment record with payment snapshot and method id
    const paymentPayload: Record<string, unknown> = {
      order_id: orderId,
      payment_method: selectedMethodRecord.slug || paymentMethod,
      status: 'initiated', // Pending Verification
      amount_poisha: totalAmountPoisha,
      transaction_id: cleanTrxId,
      sender_number: senderNumber ? senderNumber.trim() : null,
      payment_method_id: selectedMethodRecord.id,
      account_details: `${selectedMethodRecord.name} (${selectedMethodRecord.account_type || 'Personal'} - ${selectedMethodRecord.account_number})`,
      payment_snapshot: selectedMethodRecord,
    }

    const { error: paymentError } = await (adminClient.from('payments') as unknown as {
      insert: (record: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    }).insert(paymentPayload)

    if (paymentError) {
      // If error is unknown columns (payment_method_id, payment_snapshot) before migration, fallback to base columns
      if (
        paymentError.message?.includes('column "payment_method_id"') ||
        paymentError.message?.includes('column "payment_snapshot"')
      ) {
        const fallbackPaymentPayload = {
          order_id: orderId,
          payment_method: ['bkash', 'nagad', 'rocket', 'manual_transfer'].includes(selectedMethodRecord.slug)
            ? selectedMethodRecord.slug
            : 'manual_transfer',
          status: 'initiated',
          amount_poisha: totalAmountPoisha,
          transaction_id: cleanTrxId,
          sender_number: senderNumber ? senderNumber.trim() : null,
        }
        const { error: retryPaymentError } = await (adminClient.from('payments') as unknown as {
          insert: (record: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
        }).insert(fallbackPaymentPayload)
        if (retryPaymentError) {
          console.error('Failed to insert payment record on fallback:', retryPaymentError)
          await rollback()
          return NextResponse.json({ error: 'Failed to record payment transaction reference.' }, { status: 500 })
        }
      } else {
        console.error('Failed to insert payment record, rolling back order:', paymentError)
        await rollback()
        return NextResponse.json({ error: 'Failed to record payment transaction reference.' }, { status: 500 })
      }
    }

    // 3.9 Insert Order Audit Event
    await adminClient
      .from('order_events')
      .insert({
        order_id: orderId,
        actor_id: authenticatedUserId,
        event_type: 'created',
        notes: `Order created with ${selectedMethodRecord.name} reference ${cleanTrxId}`,
        metadata: {
          payment_method: selectedMethodRecord.name,
          transaction_id: cleanTrxId,
          amount_poisha: totalAmountPoisha,
          player_id: playerId || null,
          server_id: serverId || null,
          custom_fields: submittedCustomFields,
        },
      })

    return NextResponse.json({
      success: true,
      order: {
        order_id: orderId,
        order_number: createdOrder.order_number,
        total_amount_poisha: totalAmountPoisha,
        status: 'pending',
        payment_status: 'initiated',
        payment_method: selectedMethodRecord.name,
        transaction_id: cleanTrxId,
        product_name: product.name,
        variant_name: variant.name,
        quantity: parsedQuantity,
      },
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server encountered an unexpected error.'
    console.error('Unhandled error in order creation route:', err)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
