-- ==============================================================================
-- Gamer Goods - Migration 001: Core Schema
-- Database Architecture for Digital Gaming Products & E-Commerce
-- All monetary amounts stored as integer BDT Poisha (1 BDT = 100 Poisha)
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'moderator')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to create profile when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'avatar_url', ''),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon_name TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. PRODUCTS (Games / Digital Platforms)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    subtitle TEXT,
    description TEXT,
    banner_url TEXT,
    thumbnail_url TEXT,
    platform_notice TEXT,
    delivery_type TEXT NOT NULL DEFAULT 'manual' CHECK (delivery_type IN ('instant', 'manual', 'code')),
    requires_player_id BOOLEAN NOT NULL DEFAULT true,
    requires_server_id BOOLEAN NOT NULL DEFAULT false,
    player_id_label TEXT DEFAULT 'Player ID / UID',
    server_id_label TEXT DEFAULT 'Zone / Server ID',
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. PRODUCT VARIANTS (Packages / Top-up Denominations)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Weekly Pass', '100 + 10 Diamonds', '500 CP'
    slug TEXT NOT NULL,
    description TEXT,
    price_poisha BIGINT NOT NULL CHECK (price_poisha >= 0), -- Stored in BDT Poisha (e.g., 10000 = 100.00 BDT)
    compare_at_price_poisha BIGINT CHECK (compare_at_price_poisha IS NULL OR compare_at_price_poisha >= price_poisha),
    in_stock BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INT DEFAULT NULL, -- NULL means unlimited/digital on-demand
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_product_variant_slug UNIQUE (product_id, slug)
);

-- 5. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE, -- Human-friendly e.g. GG-2026-1001
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Guest checkout nullable or linked to profile
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed')),
    total_amount_poisha BIGINT NOT NULL CHECK (total_amount_poisha >= 0),
    discount_amount_poisha BIGINT NOT NULL DEFAULT 0 CHECK (discount_amount_poisha >= 0),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    unit_price_poisha BIGINT NOT NULL CHECK (unit_price_poisha >= 0),
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal_poisha BIGINT NOT NULL CHECK (subtotal_poisha >= 0),
    player_id_value TEXT,
    server_id_value TEXT,
    digital_code_delivered TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('bkash', 'nagad', 'rocket', 'manual_transfer', 'sslcommerz')),
    status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'processing', 'completed', 'failed', 'refunded')),
    amount_poisha BIGINT NOT NULL CHECK (amount_poisha >= 0),
    transaction_id TEXT,
    sender_number TEXT,
    gateway_reference TEXT,
    gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. ORDER EVENTS (Audit Trail)
CREATE TABLE IF NOT EXISTS public.order_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- e.g., 'created', 'paid', 'processing_started', 'delivered', 'cancelled'
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- INDEXES for Performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true AND is_archived = false;
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);

-- UPDATED_AT TIMESTAMP TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER touch_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
