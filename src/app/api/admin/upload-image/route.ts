import { NextResponse } from 'next/server'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { requireAdminSession } from '@/lib/auth/admin-guard'

/**
 * Admin Upload API Route:
 * Uploads product image file to Supabase Storage bucket 'product-images'.
 * If Supabase is not configured or in local developer preview, saves to local public/images/products folder.
 */
export async function POST(request: Request) {
  const auth = await requireAdminSession()
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const adminClient = getSupabaseAdminClient()

    // 1. If Supabase Admin Client is configured, upload directly to Supabase Storage
    if (adminClient) {
      const fileExt = file.name.split('.').pop() || 'png'
      const fileName = `${productId || 'product'}-${Date.now()}.${fileExt}`
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data, error } = await adminClient.storage
        .from('product-images')
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (error) {
        console.error('Supabase storage upload error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // Retrieve public URL
      const { data: publicUrlData } = adminClient.storage
        .from('product-images')
        .getPublicUrl(data.path)

      return NextResponse.json({
        url: publicUrlData.publicUrl,
        storage: 'supabase',
      })
    }

    // 2. Local fallback: Return data URL preview or notify manual upload
    // Convert to base64 data URL so admin can preview and verify immediately in local mode
    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      storage: 'local-preview',
      note: 'Supabase storage is not yet connected. Provided local preview data URL.',
    })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during upload'
    console.error('Upload handler error:', err)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
