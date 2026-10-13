-- ==============================================================================
-- Gamer Goods - Migration 003: Storage & Image URL Enhancements
-- 1. Adds image_url column alias support to products & product_variants
-- 2. Sets up the Supabase Storage bucket for product-images with public read
--    and admin upload/edit policies.
-- ==============================================================================

-- 1. Add image_url to products if not present (stores main product image)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Sync initial image_url with existing thumbnail_url
UPDATE public.products 
SET image_url = COALESCE(thumbnail_url, banner_url) 
WHERE image_url IS NULL;

-- 2. Add image_url to product_variants (optional package-specific icon/badge)
-- If NULL, packages inherit the parent product's image
ALTER TABLE public.product_variants 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Supabase Storage bucket for product-images
-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies: Public can read product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Storage Policies: Only admins can upload/modify product images
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'product-images'
    AND (public.is_admin() OR auth.role() = 'service_role')
);

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'product-images'
    AND (public.is_admin() OR auth.role() = 'service_role')
);

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'product-images'
    AND (public.is_admin() OR auth.role() = 'service_role')
);
