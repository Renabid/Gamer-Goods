import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Product, Category, ProductVariant, Order, OrderItem, Payment, PaymentMethod } from '@/types/database'

export interface DashboardMetrics {
  totalProducts: number
  activeProducts: number
  archivedProducts: number
  totalOrders: number
  pendingOrders: number
  confirmedSalesPoisha: number
  totalCategories: number
  isUsingLiveDatabase: boolean
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const adminClient = getSupabaseAdminClient()
  const userClient = await createServerSupabaseClient()
  const client = adminClient || userClient

  if (!client) {
    return {
      totalProducts: 0,
      activeProducts: 0,
      archivedProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      confirmedSalesPoisha: 0,
      totalCategories: 0,
      isUsingLiveDatabase: false,
    }
  }

  try {
    const [
      productsRes,
      ordersRes,
      pendingOrdersRes,
      completedOrdersRes,
      categoriesRes,
    ] = await Promise.all([
      client.from('products').select('id, is_active, is_archived'),
      client.from('orders').select('id', { count: 'exact', head: true }),
      client.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      client.from('orders').select('total_amount_poisha').in('status', ['completed', 'processing']),
      client.from('categories').select('id', { count: 'exact', head: true }),
    ])

    const productsList = (productsRes.data || []) as Array<{ id: string; is_active: boolean; is_archived: boolean }>
    const totalProducts = productsList.length
    const activeProducts = productsList.filter((p) => p.is_active && !p.is_archived).length
    const archivedProducts = productsList.filter((p) => p.is_archived).length

    const totalOrders = ordersRes.count || 0
    const pendingOrders = pendingOrdersRes.count || 0

    const completedSalesData = (completedOrdersRes.data || []) as Array<{ total_amount_poisha: number }>
    const confirmedSalesPoisha = completedSalesData.reduce(
      (sum, order) => sum + (order.total_amount_poisha || 0),
      0
    )

    const totalCategories = categoriesRes.count || 0

    return {
      totalProducts,
      activeProducts,
      archivedProducts,
      totalOrders,
      pendingOrders,
      confirmedSalesPoisha,
      totalCategories,
      isUsingLiveDatabase: true,
    }
  } catch (err) {
    console.error('Failed to query dashboard metrics from Supabase:', err)
    return {
      totalProducts: 0,
      activeProducts: 0,
      archivedProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      confirmedSalesPoisha: 0,
      totalCategories: 0,
      isUsingLiveDatabase: true,
    }
  }
}

/**
 * Retrieves all categories for admin management (including inactive ones)
 */
export async function getAdminCategories(): Promise<{ categories: Category[]; isUsingLiveDatabase: boolean }> {
  const adminClient = getSupabaseAdminClient()
  const userClient = await createServerSupabaseClient()
  const client = adminClient || userClient

  if (!client) {
    return { categories: [], isUsingLiveDatabase: false }
  }

  try {
    const { data, error } = await client
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('getAdminCategories Supabase query error:', error.message)
      return { categories: [], isUsingLiveDatabase: true }
    }

    if (!data) {
      return { categories: [], isUsingLiveDatabase: true }
    }

    return { categories: data as Category[], isUsingLiveDatabase: true }
  } catch (err: unknown) {
    console.error('getAdminCategories unexpected error:', err)
    return { categories: [], isUsingLiveDatabase: true }
  }
}

/**
 * Retrieves all products for admin management (including inactive & archived ones) with categories and variants
 */
export async function getAdminProducts(): Promise<{
  products: Array<Product & { variants: ProductVariant[]; category?: Category | null }>
  categories: Category[]
  isUsingLiveDatabase: boolean
}> {
  const adminClient = getSupabaseAdminClient()
  const userClient = await createServerSupabaseClient()
  const client = adminClient || userClient

  if (!client) {
    return {
      products: [],
      categories: [],
      isUsingLiveDatabase: false,
    }
  }

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      client
        .from('products')
        .select('*, product_variants(*), category:categories(*)')
        .order('created_at', { ascending: false }),
      client
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true }),
    ])

    if (productsRes.error || !productsRes.data) {
      return {
        products: [],
        categories: (categoriesRes.data || []) as Category[],
        isUsingLiveDatabase: true,
      }
    }

    type RawAdminProduct = Product & {
      product_variants: ProductVariant[]
      category: Category | null
    }

    const products = ((productsRes.data as unknown) as RawAdminProduct[]).map((p) => ({
      ...p,
      variants: (p.product_variants || []).sort((a, b) => a.display_order - b.display_order),
      category: p.category || null,
    }))

    return {
      products,
      categories: (categoriesRes.data || []) as Category[],
      isUsingLiveDatabase: true,
    }
  } catch {
    return {
      products: [],
      categories: [],
      isUsingLiveDatabase: true,
    }
  }
}

export type AdminOrderWithDetails = Order & {
  order_items: OrderItem[]
  payments: Payment[]
}

/**
 * Fetches all orders with their items and payments for the admin order management panel.
 */
export async function getAdminOrders(): Promise<{
  orders: AdminOrderWithDetails[]
  isUsingLiveDatabase: boolean
}> {
  const adminClient = getSupabaseAdminClient()
  const userClient = await createServerSupabaseClient()
  const client = adminClient || userClient

  if (!client) {
    return {
      orders: [],
      isUsingLiveDatabase: false,
    }
  }

  try {
    const { data, error } = await client
      .from('orders')
      .select('*, order_items(*), payments(*)')
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('Failed to query admin orders:', error)
      return {
        orders: [],
        isUsingLiveDatabase: true,
      }
    }

    return {
      orders: data as unknown as AdminOrderWithDetails[],
      isUsingLiveDatabase: true,
    }
  } catch (err) {
    console.error('Error fetching admin orders:', err)
    return {
      orders: [],
      isUsingLiveDatabase: true,
    }
  }
}

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'b0000000-0000-0000-0000-000000000001',
    name: 'bKash',
    slug: 'bkash-personal',
    payment_type: 'mfs',
    account_number: '01712-345678',
    account_type: 'Personal',
    instructions:
      'Dial *247# or open bKash App > Send Money to the number above > Enter exact amount > Copy and paste the 10-character TrxID below.',
    qr_code_url: null,
    is_active: true,
    display_order: 1,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000002',
    name: 'Nagad',
    slug: 'nagad-personal',
    payment_type: 'mfs',
    account_number: '01812-345678',
    account_type: 'Personal',
    instructions:
      'Dial *167# or open Nagad App > Send Money to the number above > Enter exact amount > Copy and paste the 8-character TxnID below.',
    qr_code_url: null,
    is_active: true,
    display_order: 2,
  },
  {
    id: 'b0000000-0000-0000-0000-000000000003',
    name: 'Rocket',
    slug: 'rocket-personal',
    payment_type: 'mfs',
    account_number: '01912-345678-9',
    account_type: 'Personal',
    instructions:
      'Dial *322# or open Rocket App > Send Money to the 12-digit number above > Enter exact amount > Copy and paste the Transaction ID below.',
    qr_code_url: null,
    is_active: true,
    display_order: 3,
  },
]

/**
 * Fetches all payment methods for admin management.
 */
export async function getAdminPaymentMethods(): Promise<{
  paymentMethods: PaymentMethod[]
  isUsingLiveDatabase: boolean
}> {
  const adminClient = getSupabaseAdminClient()
  const userClient = await createServerSupabaseClient()
  const client = adminClient || userClient

  if (!client) {
    return {
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      isUsingLiveDatabase: false,
    }
  }

  try {
    const { data, error } = await client
      .from('payment_methods')
      .select('*')
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return {
        paymentMethods: DEFAULT_PAYMENT_METHODS,
        isUsingLiveDatabase: true,
      }
    }

    return {
      paymentMethods: data as PaymentMethod[],
      isUsingLiveDatabase: true,
    }
  } catch {
    return {
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      isUsingLiveDatabase: true,
    }
  }
}

/**
 * Fetches active payment methods for customer storefront checkout.
 */
export async function getPublicPaymentMethods(): Promise<PaymentMethod[]> {
  const adminClient = getSupabaseAdminClient()
  const client = adminClient

  if (!client) {
    return DEFAULT_PAYMENT_METHODS.filter((m) => m.is_active)
  }

  try {
    const { data, error } = await client
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return DEFAULT_PAYMENT_METHODS.filter((m) => m.is_active)
    }

    return data as PaymentMethod[]
  } catch {
    return DEFAULT_PAYMENT_METHODS.filter((m) => m.is_active)
  }
}
