-- Migration: 20261012000004_create_order_rpc.sql
-- Description: Atomic PostgreSQL RPC for creating orders, order items, payments, and audit events safely.

CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_order_number TEXT,
    p_user_id UUID,
    p_customer_email TEXT,
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_variant_id UUID,
    p_quantity INT,
    p_player_id TEXT,
    p_server_id TEXT,
    p_payment_method TEXT,
    p_sender_number TEXT,
    p_transaction_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_product RECORD;
    v_variant RECORD;
    v_unit_price BIGINT;
    v_total_amount BIGINT;
    v_order_id UUID;
    v_order_item_id UUID;
    v_payment_id UUID;
    v_clean_trx_id TEXT;
BEGIN
    -- 1. Validate quantity
    IF p_quantity IS NULL OR p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be at least 1';
    END IF;

    -- 2. Validate customer contact
    IF p_customer_email IS NULL OR TRIM(p_customer_email) = '' THEN
        RAISE EXCEPTION 'Customer email is required';
    END IF;

    -- 3. Validate payment method
    IF p_payment_method NOT IN ('bkash', 'nagad', 'rocket', 'manual_transfer') THEN
        RAISE EXCEPTION 'Invalid payment method: %', p_payment_method;
    END IF;

    -- 4. Clean & validate transaction id to avoid duplicates
    v_clean_trx_id := UPPER(TRIM(p_transaction_id));
    IF v_clean_trx_id IS NULL OR v_clean_trx_id = '' THEN
        RAISE EXCEPTION 'Transaction ID is required for verification';
    END IF;

    IF EXISTS (
        SELECT 1 FROM public.payments
        WHERE UPPER(TRIM(transaction_id)) = v_clean_trx_id
          AND status IN ('initiated', 'processing', 'completed')
    ) THEN
        RAISE EXCEPTION 'Duplicate transaction reference: This Transaction ID has already been submitted';
    END IF;

    -- 5. Fetch & Lock Variant to guarantee consistent price & stock
    SELECT * INTO v_variant
    FROM public.product_variants
    WHERE id = p_variant_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product variant not found';
    END IF;

    IF NOT v_variant.is_active THEN
        RAISE EXCEPTION 'This product package is currently inactive';
    END IF;

    IF NOT v_variant.in_stock THEN
        RAISE EXCEPTION 'This product package is out of stock';
    END IF;

    -- If stock_quantity is tracked
    IF v_variant.stock_quantity IS NOT NULL AND v_variant.stock_quantity < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock available (requested %, available %)', p_quantity, v_variant.stock_quantity;
    END IF;

    -- 6. Fetch Product & validate required player/server IDs
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_variant.product_id;

    IF NOT FOUND OR NOT v_product.is_active OR v_product.is_archived THEN
        RAISE EXCEPTION 'Product is not available for purchase';
    END IF;

    IF v_product.requires_player_id AND (p_player_id IS NULL OR TRIM(p_player_id) = '') THEN
        RAISE EXCEPTION 'Player ID / UID is required for this product';
    END IF;

    IF v_product.requires_server_id AND (p_server_id IS NULL OR TRIM(p_server_id) = '') THEN
        RAISE EXCEPTION 'Zone / Server ID is required for this product';
    END IF;

    -- 7. Authoritative Server-side Price Calculation (in BDT Poisha)
    v_unit_price := v_variant.price_poisha;
    v_total_amount := v_unit_price * p_quantity;

    -- 8. Insert Order
    INSERT INTO public.orders (
        order_number,
        user_id,
        customer_email,
        customer_name,
        customer_phone,
        status,
        total_amount_poisha,
        discount_amount_poisha,
        admin_notes
    ) VALUES (
        p_order_number,
        p_user_id,
        TRIM(p_customer_email),
        NULLIF(TRIM(p_customer_name), ''),
        NULLIF(TRIM(p_customer_phone), ''),
        'pending',
        v_total_amount,
        0,
        NULL
    )
    RETURNING id INTO v_order_id;

    -- 9. Insert Order Item
    INSERT INTO public.order_items (
        order_id,
        product_id,
        product_variant_id,
        product_name,
        variant_name,
        unit_price_poisha,
        quantity,
        subtotal_poisha,
        player_id_value,
        server_id_value
    ) VALUES (
        v_order_id,
        v_product.id,
        v_variant.id,
        v_product.name,
        v_variant.name,
        v_unit_price,
        p_quantity,
        v_total_amount,
        NULLIF(TRIM(p_player_id), ''),
        NULLIF(TRIM(p_server_id), '')
    )
    RETURNING id INTO v_order_item_id;

    -- 10. Insert Payment Record
    INSERT INTO public.payments (
        order_id,
        payment_method,
        status,
        amount_poisha,
        transaction_id,
        sender_number
    ) VALUES (
        v_order_id,
        p_payment_method,
        'initiated',
        v_total_amount,
        v_clean_trx_id,
        NULLIF(TRIM(p_sender_number), '')
    )
    RETURNING id INTO v_payment_id;

    -- 11. Insert Audit Event
    INSERT INTO public.order_events (
        order_id,
        actor_id,
        event_type,
        notes,
        metadata
    ) VALUES (
        v_order_id,
        p_user_id,
        'created',
        'Order created with manual payment reference submitted',
        jsonb_build_object(
            'payment_method', p_payment_method,
            'transaction_id', v_clean_trx_id,
            'amount_poisha', v_total_amount
        )
    );

    -- 12. Return summary
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', p_order_number,
        'total_amount_poisha', v_total_amount,
        'status', 'pending',
        'product_name', v_product.name,
        'variant_name', v_variant.name,
        'quantity', p_quantity
    );
END;
$$;
