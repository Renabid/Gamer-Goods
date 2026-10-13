-- Migration: 20261013000005_game_fields_and_payment_settings.sql
-- Description:
-- 1. Extend products with flexible player input configuration (server options, extra custom fields).
-- 2. Extend order_items with custom_fields JSONB to store historical submitted inputs permanently.
-- 3. Create payment_methods table for dynamic admin payment configuration (bKash, Nagad, Rocket, Bank, Custom).
-- 4. Extend payments table to store payment_method_id, account details, and instructions snapshot.
-- 5. Add RLS policies for payment_methods (Public read enabled, admin manage).

-- ------------------------------------------------------------------------------
-- 1. EXTEND PRODUCTS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.products
    ADD COLUMN IF NOT EXISTS server_input_type TEXT NOT NULL DEFAULT 'text' CHECK (server_input_type IN ('text', 'dropdown')),
    ADD COLUMN IF NOT EXISTS server_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Comment for clarity:
COMMENT ON COLUMN public.products.server_input_type IS 'UI input type for server/region selection: text or dropdown';
COMMENT ON COLUMN public.products.server_options IS 'Array of server options e.g. ["Asia", "Europe", "America", "Middle East", "India"]';
COMMENT ON COLUMN public.products.custom_fields IS 'Array of extra field configs e.g. [{"id":"zone_id","label":"Zone ID","placeholder":"e.g. 2001","required":true,"type":"text"}]';

-- ------------------------------------------------------------------------------
-- 2. EXTEND ORDER_ITEMS TABLE
-- ------------------------------------------------------------------------------
ALTER TABLE public.order_items
    ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.order_items.custom_fields IS 'Key-value map of submitted player details (e.g. {"zone_id":"2001", "character_id":"ShadowNinja"})';

-- ------------------------------------------------------------------------------
-- 3. PAYMENT METHODS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- e.g. 'bKash Personal', 'Nagad Merchant', 'City Bank Transfer'
    slug TEXT NOT NULL UNIQUE, -- e.g. 'bkash-personal', 'nagad-merchant'
    payment_type TEXT NOT NULL DEFAULT 'mfs' CHECK (payment_type IN ('mfs', 'bank_transfer', 'custom')),
    account_number TEXT NOT NULL, -- e.g. '01712-345678', 'A/C 123456789'
    account_type TEXT DEFAULT 'Personal' CHECK (account_type IS NULL OR account_type IN ('Personal', 'Merchant', 'Agent', 'Bank Account', 'Other')),
    instructions TEXT, -- Step-by-step guidance for customers
    qr_code_url TEXT, -- Optional QR code image
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for public queries
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods(is_active, display_order);

-- Auto touch updated_at
CREATE TRIGGER touch_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ------------------------------------------------------------------------------
-- 4. EXTEND PAYMENTS TABLE
-- ------------------------------------------------------------------------------
-- Allow dynamic payment methods without restriction to static check constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE public.payments
    ADD COLUMN IF NOT EXISTS payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS account_details TEXT,
    ADD COLUMN IF NOT EXISTS payment_snapshot JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS admin_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS admin_verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.payments.payment_snapshot IS 'Snapshot of the payment method config (name, number, type, instructions) at order time';

-- ------------------------------------------------------------------------------
-- 5. RLS POLICIES FOR PAYMENT_METHODS
-- ------------------------------------------------------------------------------
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone (including public customers) can read enabled payment methods
CREATE POLICY "Public read enabled payment methods"
    ON public.payment_methods FOR SELECT
    USING (is_active = true OR public.is_admin());

-- Only admins can manage payment methods (create, edit, delete)
CREATE POLICY "Admins manage payment methods"
    ON public.payment_methods FOR ALL
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 6. SEED INITIAL BANGLADESHI PAYMENT METHODS (IDEMPOTENT)
-- ------------------------------------------------------------------------------
INSERT INTO public.payment_methods (id, name, slug, payment_type, account_number, account_type, instructions, is_active, display_order)
VALUES
    (
        'b0000000-0000-0000-0000-000000000001',
        'bKash',
        'bkash-personal',
        'mfs',
        '01712-345678',
        'Personal',
        'Dial *247# or open bKash App > Send Money to the number above > Enter exact amount > Copy and paste the 10-character TrxID below.',
        true,
        1
    ),
    (
        'b0000000-0000-0000-0000-000000000002',
        'Nagad',
        'nagad-personal',
        'mfs',
        '01812-345678',
        'Personal',
        'Dial *167# or open Nagad App > Send Money to the number above > Enter exact amount > Copy and paste the 8-character TxnID below.',
        true,
        2
    ),
    (
        'b0000000-0000-0000-0000-000000000003',
        'Rocket',
        'rocket-personal',
        'mfs',
        '01912-345678-9',
        'Personal',
        'Dial *322# or open Rocket App > Send Money to the 12-digit number above > Enter exact amount > Copy and paste the Transaction ID below.',
        true,
        3
    )
ON CONFLICT (slug) DO NOTHING;
