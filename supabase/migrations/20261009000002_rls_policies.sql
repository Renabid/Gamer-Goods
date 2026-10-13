-- ==============================================================================
-- Gamer Goods - Migration 002: Row Level Security (RLS) Policies
-- Secure Data Access: Public reads for active catalog; Private orders/payments;
-- Admin-only modification rules.
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- HELPER FUNCTION: Check if the calling user has 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Users can view their own profile; admins can view all profiles
CREATE POLICY "Users can view own profile or admins can view all"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

-- Users can update their own personal info (excluding role)
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- Admins have full access to profiles
CREATE POLICY "Admins full access to profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
-- Anyone (including anonymous visitors) can view active categories
CREATE POLICY "Public read active categories"
    ON public.categories FOR SELECT
    USING (is_active = true OR public.is_admin());

-- Only admins can insert, update, delete categories
CREATE POLICY "Admins manage categories"
    ON public.categories FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view active, non-archived products
CREATE POLICY "Public read active products"
    ON public.products FOR SELECT
    USING ((is_active = true AND is_archived = false) OR public.is_admin());

-- Only admins can manage products (insert/update/delete)
CREATE POLICY "Admins manage products"
    ON public.products FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. PRODUCT VARIANTS POLICIES
-- ------------------------------------------------------------------------------
-- Anyone can view active variants of active, unarchived products
CREATE POLICY "Public read active product variants"
    ON public.product_variants FOR SELECT
    USING (
        (is_active = true AND EXISTS (
            SELECT 1 FROM public.products p
            WHERE p.id = product_variants.product_id
            AND p.is_active = true
            AND p.is_archived = false
        ))
        OR public.is_admin()
    );

-- Only admins can manage variants
CREATE POLICY "Admins manage product variants"
    ON public.product_variants FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. ORDERS POLICIES
-- ------------------------------------------------------------------------------
-- Customers can view their own orders; admins can view all
CREATE POLICY "Customers view own orders or admins view all"
    ON public.orders FOR SELECT
    USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR public.is_admin()
    );

-- Anyone can insert an order (Guest checkout or logged in user)
-- Note: Order creation will attach user_id if authenticated, or NULL for guests
CREATE POLICY "Anyone can create order"
    ON public.orders FOR INSERT
    WITH CHECK (
        (user_id IS NULL OR user_id = auth.uid())
    );

-- Only admins can modify orders
CREATE POLICY "Admins update orders"
    ON public.orders FOR UPDATE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------------
-- Customers view items of their own orders; admins view all
CREATE POLICY "Customers view order items of own orders"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.user_id = auth.uid() OR public.is_admin())
        )
    );

-- Anyone can insert order items when creating their order
CREATE POLICY "Order items insert allowed"
    ON public.order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_items.order_id
            AND (o.user_id IS NULL OR o.user_id = auth.uid())
        )
    );

-- Only admins update/delete order items
CREATE POLICY "Admins manage order items"
    ON public.order_items FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. PAYMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Customers can view payments linked to their orders; admins can view all
CREATE POLICY "Customers view payments of own orders"
    ON public.payments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
            AND (o.user_id = auth.uid() OR public.is_admin())
        )
    );

-- Anyone creating an order can submit payment details
CREATE POLICY "Insert payment record"
    ON public.payments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = payments.order_id
            AND (o.user_id IS NULL OR o.user_id = auth.uid())
        )
    );

-- Only admins can update payment verification status
CREATE POLICY "Admins update payments"
    ON public.payments FOR UPDATE
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 8. ORDER EVENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Customers view events of own orders"
    ON public.order_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            WHERE o.id = order_events.order_id
            AND (o.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins manage order events"
    ON public.order_events FOR ALL
    USING (public.is_admin());
