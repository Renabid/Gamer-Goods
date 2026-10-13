-- ==============================================================================
-- Gamer Goods - Seed Data
-- Reproducible seed data for categories, products, and variants
-- Prices are in BDT Poisha (1 BDT = 100 Poisha)
-- Example: 9500 poisha = 95.00 BDT
-- ==============================================================================

-- Clean up existing data for fresh seed (safe cascade order)
DELETE FROM public.order_events;
DELETE FROM public.payments;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.product_variants;
DELETE FROM public.products;
DELETE FROM public.categories;

-- 1. INSERT CATEGORIES
INSERT INTO public.categories (id, name, slug, description, icon_name, display_order, is_active) VALUES
('c0000000-0000-0000-0000-000000000001', 'Mobile Games Top-Up', 'mobile-games', 'Instant top-up for popular mobile titles with direct UID/Player ID', 'Gamepad2', 1, true),
('c0000000-0000-0000-0000-000000000002', 'PC & Console Gaming', 'pc-console', 'In-game currencies and credits for competitive PC titles', 'Monitor', 2, true),
('c0000000-0000-0000-0000-000000000003', 'Gift Cards & Vouchers', 'gift-cards', 'Global and regional digital gift cards and prepaid codes', 'Gift', 3, true),
('c0000000-0000-0000-0000-000000000004', 'Streaming & Subscriptions', 'subscriptions', 'Entertainment and gaming service subscriptions', 'Sparkles', 4, true);

-- 2. INSERT PRODUCTS
INSERT INTO public.products (
    id, category_id, name, slug, subtitle, description, banner_url, thumbnail_url, image_url,
    platform_notice, delivery_type, requires_player_id, requires_server_id,
    player_id_label, server_id_label, is_featured, is_active, is_archived
) VALUES
-- Free Fire Diamonds
(
    'p0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'Free Fire Diamonds (UID)',
    'free-fire-diamonds',
    'Instant Garena Free Fire top-up via Player ID',
    'Fast delivery directly to your Garena Free Fire account using your Player ID (UID). Bangladesh server supported.',
    '/images/products/free-fire.png',
    '/images/products/free-fire.png',
    '/images/products/free-fire.png',
    'Please verify your UID carefully. Top-up will be sent directly to the specified account.',
    'manual',
    true,
    false,
    'Player ID (UID)',
    NULL,
    true,
    true,
    false
),
-- PUBG Mobile UC
(
    'p0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'PUBG Mobile Unknown Cash (UC)',
    'pubg-mobile-uc',
    'Global & Asia Server UC Top-up',
    'Get PUBG Mobile Unknown Cash instantly. Unlock Royale Pass, premium crates, and elite skins.',
    '/images/products/pubg-mobile.png',
    '/images/products/pubg-mobile.png',
    '/images/products/pubg-mobile.png',
    'Ensure your Player ID and in-game character name match before ordering.',
    'manual',
    true,
    false,
    'PUBG Player ID',
    NULL,
    true,
    true,
    false
),
-- Mobile Legends: Bang Bang
(
    'p0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'Mobile Legends: Bang Bang Diamonds',
    'mobile-legends-diamonds',
    'User ID + Zone ID Direct Reload',
    'Recharge MLBB Diamonds safely and rapidly with your User ID and Zone ID.',
    '/images/products/mobile-legends.png',
    '/images/products/mobile-legends.png',
    '/images/products/mobile-legends.png',
    'Both User ID (e.g. 12345678) and Zone ID (e.g. 2001) are mandatory.',
    'manual',
    true,
    true,
    'User ID',
    'Zone ID',
    true,
    true,
    false
),
-- Valorant Points
(
    'p0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000002',
    'Valorant Points (Riot ID)',
    'valorant-points',
    'Riot Games APAC / South Asia Region VP',
    'Level up your weapon arsenal with skins, battle passes, and Radianite points.',
    '/images/products/valorant.svg',
    '/images/products/valorant.svg',
    '/images/products/valorant.svg',
    'Valid for Riot accounts with India / Bangladesh / South Asia server region.',
    'manual',
    true,
    false,
    'Riot ID (e.g. Player#TAG)',
    NULL,
    true,
    true,
    false
),
-- Google Play Gift Card
(
    'p0000000-0000-0000-0000-000000000005',
    'c0000000-0000-0000-0000-000000000003',
    'Google Play Gift Card (US Region)',
    'google-play-gift-card-us',
    'Instant Digital Code Delivery',
    'US Google Play balance for buying apps, games, movies, and in-game items.',
    '/images/products/google-play.svg',
    '/images/products/google-play.svg',
    '/images/products/google-play.svg',
    'Codes work exclusively with US regional Google accounts with US payment profile.',
    'code',
    false,
    false,
    NULL,
    NULL,
    false,
    true,
    false
),
-- Steam Wallet Code
(
    'p0000000-0000-0000-0000-000000000006',
    'c0000000-0000-0000-0000-000000000003',
    'Steam Wallet Gift Card (Global / USD)',
    'steam-wallet-usd',
    'Digital Wallet Code for Steam',
    'Add wallet funds to your Steam account to purchase games and community market items.',
    '/images/products/steam.svg',
    '/images/products/steam.svg',
    '/images/products/steam.svg',
    'Redeem directly on the Steam redemption page. Automatically converts if eligible.',
    'code',
    false,
    false,
    NULL,
    NULL,
    false,
    true,
    false
);

-- 3. INSERT PRODUCT VARIANTS (Packages with prices in Poisha: 1 BDT = 100 Poisha)
INSERT INTO public.product_variants (
    id, product_id, name, slug, description, price_poisha, compare_at_price_poisha, in_stock, display_order, is_active
) VALUES
-- Free Fire Diamonds Variants
('v0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', '115 Diamonds', '115-diamonds', 'Direct UID topup', 9500, 10500, true, 1, true), -- 95.00 BDT
('v0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', '240 Diamonds', '240-diamonds', 'Direct UID topup', 19000, 21000, true, 2, true), -- 190.00 BDT
('v0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', '355 Diamonds', '355-diamonds', 'Direct UID topup', 28000, 31000, true, 3, true), -- 280.00 BDT
('v0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000001', 'Weekly Membership', 'weekly-membership', 'Free Fire Weekly Pass', 19500, 22000, true, 4, true), -- 195.00 BDT
('v0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000001', 'Monthly Membership', 'monthly-membership', 'Free Fire Monthly Pass', 98000, 110000, true, 5, true), -- 980.00 BDT

-- PUBG Mobile UC Variants
('v0000000-0000-0000-0000-000000000006', 'p0000000-0000-0000-0000-000000000002', '60 UC', '60-uc', 'Direct UC credit', 11500, 13000, true, 1, true), -- 115.00 BDT
('v0000000-0000-0000-0000-000000000007', 'p0000000-0000-0000-0000-000000000002', '325 UC (300+25)', '325-uc', 'Direct UC credit', 55000, 60000, true, 2, true), -- 550.00 BDT
('v0000000-0000-0000-0000-000000000008', 'p0000000-0000-0000-0000-000000000002', '660 UC (600+60)', '660-uc', 'Royale Pass Pack', 108000, 118000, true, 3, true), -- 1080.00 BDT
('v0000000-0000-0000-0000-000000000009', 'p0000000-0000-0000-0000-000000000002', '1800 UC (1500+300)', '1800-uc', 'Direct UC credit', 270000, 290000, true, 4, true), -- 2700.00 BDT

-- MLBB Diamonds Variants
('v0000000-0000-0000-0000-000000000010', 'p0000000-0000-0000-0000-000000000003', '86 Diamonds (78+8)', '86-diamonds', 'Direct reload', 17000, 19000, true, 1, true), -- 170.00 BDT
('v0000000-0000-0000-0000-000000000011', 'p0000000-0000-0000-0000-000000000003', '172 Diamonds (156+16)', '172-diamonds', 'Direct reload', 33000, 36000, true, 2, true), -- 330.00 BDT
('v0000000-0000-0000-0000-000000000012', 'p0000000-0000-0000-0000-000000000003', 'Weekly Diamond Pass', 'mlbb-weekly-pass', '7-day Diamond bundle', 21500, 25000, true, 3, true), -- 215.00 BDT
('v0000000-0000-0000-0000-000000000013', 'p0000000-0000-0000-0000-000000000003', '706 Diamonds (625+81)', '706-diamonds', 'Starlight bundle', 135000, 145000, true, 4, true), -- 1350.00 BDT

-- Valorant Points Variants
('v0000000-0000-0000-0000-000000000014', 'p0000000-0000-0000-0000-000000000004', '475 Valorant Points', '475-vp', 'Riot South Asia', 52000, 56000, true, 1, true), -- 520.00 BDT
('v0000000-0000-0000-0000-000000000015', 'p0000000-0000-0000-0000-000000000004', '1000 Valorant Points', '1000-vp', 'Battle Pass Pack', 105000, 115000, true, 2, true), -- 1050.00 BDT
('v0000000-0000-0000-0000-000000000016', 'p0000000-0000-0000-0000-000000000004', '2050 Valorant Points', '2050-vp', 'Riot South Asia', 210000, 230000, true, 3, true), -- 2100.00 BDT

-- Google Play Gift Card Variants
('v0000000-0000-0000-0000-000000000017', 'p0000000-0000-0000-0000-000000000005', '$5 Google Play Card', 'google-play-5-usd', 'Digital Code Delivery', 65000, 70000, true, 1, true), -- 650.00 BDT
('v0000000-0000-0000-0000-000000000018', 'p0000000-0000-0000-0000-000000000005', '$10 Google Play Card', 'google-play-10-usd', 'Digital Code Delivery', 128000, 135000, true, 2, true), -- 1280.00 BDT

-- Steam Wallet Variants
('v0000000-0000-0000-0000-000000000019', 'p0000000-0000-0000-0000-000000000006', '$5 Steam Wallet Card', 'steam-5-usd', 'Digital Wallet Code', 66000, 72000, true, 1, true), -- 660.00 BDT
('v0000000-0000-0000-0000-000000000020', 'p0000000-0000-0000-0000-000000000006', '$10 Steam Wallet Card', 'steam-10-usd', 'Digital Wallet Code', 130000, 140000, true, 2, true); -- 1300.00 BDT
