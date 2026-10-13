import { getSupabaseClient } from '@/lib/supabase/client'
import type { Category, Product, ProductVariant, ProductWithVariants } from '@/types/database'

/**
 * Fallback static catalog used when Supabase credentials have not yet been configured locally.
 * This guarantees that developers can explore the UI and test the design system immediately,
 * while seamlessly switching to Supabase the moment environment variables are connected.
 */
export const SAMPLE_CATEGORIES: Category[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Mobile Games',
    slug: 'mobile-games',
    description: 'Instant top-up for popular mobile titles with direct UID/Player ID',
    icon_name: 'Gamepad2',
    display_order: 1,
    is_active: true,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'PC & Console',
    slug: 'pc-console',
    description: 'In-game currencies and credits for competitive PC titles',
    icon_name: 'Monitor',
    display_order: 2,
    is_active: true,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Gift Cards',
    slug: 'gift-cards',
    description: 'Global and regional digital gift cards and prepaid codes',
    icon_name: 'Gift',
    display_order: 3,
    is_active: true,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
  },
  {
    id: 'c0000000-0000-0000-0000-000000000004',
    name: 'Subscriptions',
    slug: 'subscriptions',
    description: 'Entertainment and gaming service subscriptions',
    icon_name: 'Sparkles',
    display_order: 4,
    is_active: true,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
  },
]

export const SAMPLE_PRODUCTS: ProductWithVariants[] = [
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Free Fire Diamonds (UID)',
    slug: 'free-fire-diamonds',
    subtitle: 'Instant Garena Free Fire top-up via Player ID',
    description: 'Fast delivery directly to your Garena Free Fire account using your Player ID (UID). Bangladesh server supported.',
    banner_url: '/images/products/free-fire.png',
    thumbnail_url: '/images/products/free-fire.png',
    image_url: '/images/products/free-fire.png',
    platform_notice: 'Please verify your UID carefully. Top-up will be sent directly to the specified account.',
    delivery_type: 'manual',
    requires_player_id: true,
    requires_server_id: false,
    player_id_label: 'Player ID (UID)',
    server_id_label: null,
    is_featured: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    variants: [
      {
        id: 'v0000000-0000-0000-0000-000000000001',
        product_id: 'p0000000-0000-0000-0000-000000000001',
        name: '115 Diamonds',
        slug: '115-diamonds',
        description: 'Direct UID topup',
        image_url: null,
        price_poisha: 9500, // 95.00 BDT
        compare_at_price_poisha: 10500,
        in_stock: true,
        stock_quantity: null,
        display_order: 1,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
      {
        id: 'v0000000-0000-0000-0000-000000000002',
        product_id: 'p0000000-0000-0000-0000-000000000001',
        name: '240 Diamonds',
        slug: '240-diamonds',
        description: 'Direct UID topup',
        image_url: null,
        price_poisha: 19000, // 190.00 BDT
        compare_at_price_poisha: 21000,
        in_stock: true,
        stock_quantity: null,
        display_order: 2,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
      {
        id: 'v0000000-0000-0000-0000-000000000004',
        product_id: 'p0000000-0000-0000-0000-000000000001',
        name: 'Weekly Membership',
        slug: 'weekly-membership',
        description: 'Free Fire Weekly Pass',
        image_url: null,
        price_poisha: 19500, // 195.00 BDT
        compare_at_price_poisha: 22000,
        in_stock: true,
        stock_quantity: null,
        display_order: 4,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
    ],
  },
  {
    id: 'p0000000-0000-0000-0000-000000000002',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    name: 'PUBG Mobile Unknown Cash (UC)',
    slug: 'pubg-mobile-uc',
    subtitle: 'Global & Asia Server UC Top-up',
    description: 'Get PUBG Mobile Unknown Cash instantly. Unlock Royale Pass, premium crates, and elite skins.',
    banner_url: '/images/products/pubg-mobile.png',
    thumbnail_url: '/images/products/pubg-mobile.png',
    image_url: '/images/products/pubg-mobile.png',
    platform_notice: 'Ensure your Player ID and in-game character name match before ordering.',
    delivery_type: 'manual',
    requires_player_id: true,
    requires_server_id: false,
    player_id_label: 'PUBG Player ID',
    server_id_label: null,
    is_featured: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    variants: [
      {
        id: 'v0000000-0000-0000-0000-000000000006',
        product_id: 'p0000000-0000-0000-0000-000000000002',
        name: '60 UC',
        slug: '60-uc',
        description: 'Direct UC credit',
        image_url: null,
        price_poisha: 11500, // 115.00 BDT
        compare_at_price_poisha: 13000,
        in_stock: true,
        stock_quantity: null,
        display_order: 1,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
      {
        id: 'v0000000-0000-0000-0000-000000000007',
        product_id: 'p0000000-0000-0000-0000-000000000002',
        name: '325 UC (300+25)',
        slug: '325-uc',
        description: 'Direct UC credit',
        image_url: null,
        price_poisha: 55000, // 550.00 BDT
        compare_at_price_poisha: 60000,
        in_stock: true,
        stock_quantity: null,
        display_order: 2,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
      {
        id: 'v0000000-0000-0000-0000-000000000008',
        product_id: 'p0000000-0000-0000-0000-000000000002',
        name: '660 UC (600+60)',
        slug: '660-uc',
        description: 'Royale Pass Pack',
        image_url: null,
        price_poisha: 108000, // 1080.00 BDT
        compare_at_price_poisha: 118000,
        in_stock: true,
        stock_quantity: null,
        display_order: 3,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
    ],
  },
  {
    id: 'p0000000-0000-0000-0000-000000000003',
    category_id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Mobile Legends: Bang Bang Diamonds',
    slug: 'mobile-legends-diamonds',
    subtitle: 'User ID + Zone ID Direct Reload',
    description: 'Recharge MLBB Diamonds safely and rapidly with your User ID and Zone ID.',
    banner_url: '/images/products/mobile-legends.png',
    thumbnail_url: '/images/products/mobile-legends.png',
    image_url: '/images/products/mobile-legends.png',
    platform_notice: 'Both User ID (e.g. 12345678) and Zone ID (e.g. 2001) are mandatory.',
    delivery_type: 'manual',
    requires_player_id: true,
    requires_server_id: true,
    player_id_label: 'User ID',
    server_id_label: 'Zone ID',
    is_featured: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    variants: [
      {
        id: 'v0000000-0000-0000-0000-000000000010',
        product_id: 'p0000000-0000-0000-0000-000000000003',
        name: '86 Diamonds (78+8)',
        slug: '86-diamonds',
        description: 'Direct reload',
        image_url: null,
        price_poisha: 17000, // 170.00 BDT
        compare_at_price_poisha: 19000,
        in_stock: true,
        stock_quantity: null,
        display_order: 1,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
      {
        id: 'v0000000-0000-0000-0000-000000000012',
        product_id: 'p0000000-0000-0000-0000-000000000003',
        name: 'Weekly Diamond Pass',
        slug: 'mlbb-weekly-pass',
        description: '7-day Diamond bundle',
        image_url: null,
        price_poisha: 21500, // 215.00 BDT
        compare_at_price_poisha: 25000,
        in_stock: true,
        stock_quantity: null,
        display_order: 2,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
    ],
  },
  {
    id: 'p0000000-0000-0000-0000-000000000004',
    category_id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Valorant Points (Riot ID)',
    slug: 'valorant-points',
    subtitle: 'Riot Games APAC / South Asia Region VP',
    description: 'Level up your weapon arsenal with skins, battle passes, and Radianite points.',
    banner_url: '/images/products/valorant.svg',
    thumbnail_url: '/images/products/valorant.svg',
    image_url: '/images/products/valorant.svg',
    platform_notice: 'Valid for Riot accounts with India / Bangladesh / South Asia server region.',
    delivery_type: 'manual',
    requires_player_id: true,
    requires_server_id: false,
    player_id_label: 'Riot ID (e.g. Player#TAG)',
    server_id_label: null,
    is_featured: true,
    is_active: true,
    is_archived: false,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    variants: [
      {
        id: 'v0000000-0000-0000-0000-000000000014',
        product_id: 'p0000000-0000-0000-0000-000000000004',
        name: '475 Valorant Points',
        slug: '475-vp',
        description: 'Riot South Asia',
        image_url: null,
        price_poisha: 52000, // 520.00 BDT
        compare_at_price_poisha: 56000,
        in_stock: true,
        stock_quantity: null,
        display_order: 1,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
      {
        id: 'v0000000-0000-0000-0000-000000000015',
        product_id: 'p0000000-0000-0000-0000-000000000004',
        name: '1000 Valorant Points',
        slug: '1000-vp',
        description: 'Battle Pass Pack',
        image_url: null,
        price_poisha: 105000, // 1050.00 BDT
        compare_at_price_poisha: 115000,
        in_stock: true,
        stock_quantity: null,
        display_order: 2,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
    ],
  },
  {
    id: 'p0000000-0000-0000-0000-000000000005',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Google Play Gift Card (US Region)',
    slug: 'google-play-gift-card-us',
    subtitle: 'Instant Digital Code Delivery',
    description: 'US Google Play balance for buying apps, games, movies, and in-game items.',
    banner_url: '/images/products/google-play.svg',
    thumbnail_url: '/images/products/google-play.svg',
    image_url: '/images/products/google-play.svg',
    platform_notice: 'Codes work exclusively with US regional Google accounts with US payment profile.',
    delivery_type: 'code',
    requires_player_id: false,
    requires_server_id: false,
    player_id_label: null,
    server_id_label: null,
    is_featured: false,
    is_active: true,
    is_archived: false,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    variants: [
      {
        id: 'v0000000-0000-0000-0000-000000000017',
        product_id: 'p0000000-0000-0000-0000-000000000005',
        name: '$5 Google Play Card',
        slug: 'google-play-5-usd',
        description: 'Digital Code Delivery',
        image_url: null,
        price_poisha: 65000, // 650.00 BDT
        compare_at_price_poisha: 70000,
        in_stock: true,
        stock_quantity: 15,
        display_order: 1,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
    ],
  },
  {
    id: 'p0000000-0000-0000-0000-000000000006',
    category_id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Steam Wallet Gift Card (Global / USD)',
    slug: 'steam-wallet-usd',
    subtitle: 'Digital Wallet Code for Steam',
    description: 'Add wallet funds to your Steam account to purchase games and community market items.',
    banner_url: '/images/products/steam.svg',
    thumbnail_url: '/images/products/steam.svg',
    image_url: '/images/products/steam.svg',
    platform_notice: 'Redeem directly on the Steam redemption page. Automatically converts if eligible.',
    delivery_type: 'code',
    requires_player_id: false,
    requires_server_id: false,
    player_id_label: null,
    server_id_label: null,
    is_featured: false,
    is_active: true,
    is_archived: false,
    created_at: '2026-10-09T00:00:00Z',
    updated_at: '2026-10-09T00:00:00Z',
    variants: [
      {
        id: 'v0000000-0000-0000-0000-000000000019',
        product_id: 'p0000000-0000-0000-0000-000000000006',
        name: '$5 Steam Wallet Card',
        slug: 'steam-5-usd',
        description: 'Digital Wallet Code',
        image_url: null,
        price_poisha: 66000, // 660.00 BDT
        compare_at_price_poisha: 72000,
        in_stock: true,
        stock_quantity: 10,
        display_order: 1,
        is_active: true,
        created_at: '2026-10-09T00:00:00Z',
        updated_at: '2026-10-09T00:00:00Z',
      },
    ],
  },
]

export interface CatalogResult {
  categories: Category[]
  products: ProductWithVariants[]
  isUsingLiveDatabase: boolean
  error?: string | null
}

function getStorefrontClient() {
  return getSupabaseClient()
}

/**
 * Centralized Data Access Layer: Fetches all active categories and products with their packages.
 * Queries live Supabase PostgreSQL. Never silently replaces live data with demo items.
 */
export async function getStorefrontCatalog(): Promise<CatalogResult> {
  const client = await getStorefrontClient()

  if (!client) {
    return {
      categories: [],
      products: [],
      isUsingLiveDatabase: false,
      error:
        'Database connection not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local to view live products.',
    }
  }

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      client
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      client
        .from('products')
        .select('*, product_variants(*), category:categories(*)')
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: false }),
    ])

    if (categoriesRes.error || productsRes.error) {
      const errorMsg =
        categoriesRes.error?.message ||
        productsRes.error?.message ||
        'Failed to query database catalog.'
      console.error('Supabase query error in storefront:', errorMsg)
      return {
        categories: [],
        products: [],
        isUsingLiveDatabase: true,
        error: errorMsg,
      }
    }

    type RawProductWithVariants = Product & {
      product_variants: ProductVariant[]
      category: Category | null
    }

    const rawProducts = (productsRes.data || []) as unknown as RawProductWithVariants[]
    const products: ProductWithVariants[] = rawProducts.map((prod) => ({
      ...prod,
      variants: (prod.product_variants || [])
        .filter((v) => v.is_active)
        .sort((a, b) => a.display_order - b.display_order),
      category: prod.category || null,
    }))

    return {
      categories: (categoriesRes.data || []) as Category[],
      products,
      isUsingLiveDatabase: true,
      error: null,
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to query Supabase storefront data'
    console.error('Failed to query Supabase storefront data:', err)
    return {
      categories: [],
      products: [],
      isUsingLiveDatabase: false,
      error: errorMsg,
    }
  }
}

/**
 * Centralized Data Access Layer: Retrieves a single product by slug with its active variants.
 */
export async function getProductBySlug(slug: string): Promise<{
  product: ProductWithVariants | null
  isUsingLiveDatabase: boolean
  error?: string | null
}> {
  const client = await getStorefrontClient()

  if (!client) {
    return {
      product: null,
      isUsingLiveDatabase: false,
      error: 'Database connection not configured',
    }
  }

  try {
    const { data, error } = await client
      .from('products')
      .select('*, product_variants(*), category:categories(*)')
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('is_archived', false)
      .single()

    if (error || !data) {
      return {
        product: null,
        isUsingLiveDatabase: true,
        error: error ? error.message : 'Product not found',
      }
    }

    type RawProductDetail = Product & {
      product_variants: ProductVariant[]
      category: Category | null
    }

    const rawData = data as unknown as RawProductDetail
    const product: ProductWithVariants = {
      ...rawData,
      variants: (rawData.product_variants || [])
        .filter((v) => v.is_active)
        .sort((a, b) => a.display_order - b.display_order),
      category: rawData.category || null,
    }

    return { product, isUsingLiveDatabase: true, error: null }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Product query error'
    return { product: null, isUsingLiveDatabase: true, error: errorMsg }
  }
}
