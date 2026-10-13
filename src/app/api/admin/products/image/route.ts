import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Admin Product Image Update Route:
 * Updates image_url, thumbnail_url, and banner_url for a product in Supabase.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, imageUrl } = body

    if (!id || !imageUrl) {
      return NextResponse.json({ error: 'Product ID and Image URL are required' }, { status: 400 })
    }

    const adminClient = getSupabaseAdminClient()

    if (!adminClient) {
      // In local preview mode, simulate success response
      return NextResponse.json({
        success: true,
        isUsingLiveDatabase: false,
        message: 'Product image updated in local preview state.',
      })
    }

    const query = adminClient.from('products') as unknown as {
      update: (values: Record<string, unknown>) => {
        eq: (col: string, val: string) => {
          select: () => {
            single: () => Promise<{ data: unknown; error: { message: string } | null }>
          }
        }
      }
    }

    const { data, error } = await query
      .update({
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        banner_url: imageUrl,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      isUsingLiveDatabase: true,
      product: data,
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during update'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
