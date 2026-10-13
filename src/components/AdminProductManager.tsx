'use client'

import { useState, useRef } from 'react'
import type { ProductWithVariants } from '@/types/database'
import { ProductImage } from '@/components/ProductImage'
import {
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

interface AdminProductManagerProps {
  initialProducts: ProductWithVariants[]
  isUsingLiveDatabase: boolean
}

export function AdminProductManager({
  initialProducts,
  isUsingLiveDatabase,
}: AdminProductManagerProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts)
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialProducts[0]?.id || ''
  )
  const [customUrl, setCustomUrl] = useState<string>('')
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info'
    text: string
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  // Handle local file selection and upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedProduct) return

    setIsUploading(true)
    setStatusMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', selectedProduct.id)

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      // Update current product's image
      await applyImageUrl(data.url)
      setStatusMessage({
        type: 'success',
        text: `Image uploaded successfully (${data.storage === 'supabase' ? 'Supabase Storage' : 'Local Preview'}).`,
      })
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Upload failed'
      setStatusMessage({ type: 'error', text: errorText })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Handle manual URL submission
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customUrl.trim() || !selectedProduct) return
    await applyImageUrl(customUrl.trim())
    setCustomUrl('')
  }

  const applyImageUrl = async (newUrl: string) => {
    if (!selectedProduct) return
    setIsSaving(true)
    setStatusMessage(null)

    try {
      const res = await fetch('/api/admin/products/image', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          imageUrl: newUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update image')
      }

      // Update state locally
      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? {
                ...p,
                image_url: newUrl,
                thumbnail_url: newUrl,
                banner_url: newUrl,
              }
            : p
        )
      )

      setStatusMessage({
        type: 'success',
        text: `Updated artwork for ${selectedProduct.name}!`,
      })
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : 'Save failed'
      setStatusMessage({ type: 'error', text: errorText })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#242b3e]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-violet-400 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Product Artwork &amp; Asset Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Upload new logos, banners, or adjust product artwork with instant live preview.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-3 py-1.5 rounded-full border font-mono font-semibold ${
              isUsingLiveDatabase
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-violet-950/40 text-violet-300 border-violet-800/50'
            }`}
          >
            {isUsingLiveDatabase ? 'Connected to Supabase' : 'Local Seed Mode'}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
              : 'bg-violet-950/40 border border-violet-800/50 text-violet-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Product Selector List */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">
            Select Game / Product ({products.length})
          </h2>

          <div className="space-y-2">
            {products.map((product) => {
              const isSelected = product.id === selectedProductId
              const displayImg =
                product.image_url || product.thumbnail_url || product.banner_url

              return (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProductId(product.id)
                    setStatusMessage(null)
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-violet-950/40 border-violet-500 shadow-md shadow-violet-900/30'
                      : 'bg-[#151824] border-[#242b3e] hover:border-gray-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-[#0d0f17] border border-[#242b3e] overflow-hidden shrink-0 flex items-center justify-center">
                    <ProductImage
                      src={displayImg}
                      alt={product.name}
                      aspectRatio="square"
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-100 truncate">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 truncate">
                      {product.variants?.length || 0} packages &bull; {displayImg || 'No artwork'}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Right: Asset Editor & Preview */}
        {selectedProduct && (
          <div className="lg:col-span-7 bg-[#151824] border border-[#242b3e] rounded-2xl p-6 shadow-xl space-y-6">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40">
                Editing Asset
              </span>
              <h2 className="text-xl font-bold text-white mt-1">
                {selectedProduct.name}
              </h2>
              <p className="text-xs text-gray-400">
                Slug: <code className="text-cyan-400">{selectedProduct.slug}</code>
              </p>
            </div>

            {/* Current Artwork Live Preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Live Preview (Storefront Card &amp; Banner View)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card view preview */}
                <div className="bg-[#0d0f17] border border-[#242b3e] rounded-xl overflow-hidden p-2">
                  <span className="text-[10px] uppercase text-gray-500 font-mono block mb-1">
                    Card Ratio (16:10)
                  </span>
                  <div className="rounded-lg overflow-hidden border border-[#242b3e]/60">
                    <ProductImage
                      src={
                        selectedProduct.image_url ||
                        selectedProduct.thumbnail_url ||
                        selectedProduct.banner_url
                      }
                      alt={selectedProduct.name}
                      aspectRatio="card"
                    />
                  </div>
                </div>

                {/* Banner view preview */}
                <div className="bg-[#0d0f17] border border-[#242b3e] rounded-xl overflow-hidden p-2">
                  <span className="text-[10px] uppercase text-gray-500 font-mono block mb-1">
                    Detail Banner (16:9)
                  </span>
                  <div className="rounded-lg overflow-hidden border border-[#242b3e]/60">
                    <ProductImage
                      src={
                        selectedProduct.image_url ||
                        selectedProduct.banner_url ||
                        selectedProduct.thumbnail_url
                      }
                      alt={selectedProduct.name}
                      aspectRatio="banner"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-2 text-[11px] text-gray-400">
                Current URL:{' '}
                <span className="font-mono text-cyan-400 break-all">
                  {selectedProduct.image_url ||
                    selectedProduct.thumbnail_url ||
                    selectedProduct.banner_url ||
                    '(None - using branded fallback)'}
                </span>
              </div>
            </div>

            {/* Upload File Section */}
            <div className="border-t border-[#242b3e] pt-6 space-y-4">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">
                Method 1: Upload File to Supabase Storage
              </h3>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="hidden"
                  id="admin-image-file"
                  disabled={isUploading || isSaving}
                />
                <label
                  htmlFor="admin-image-file"
                  className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs transition shadow-md shadow-violet-800/30 flex items-center gap-2 cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Choose Image File...</span>
                </label>
                <span className="text-xs text-gray-400">
                  PNG, JPG, WebP, SVG supported
                </span>
              </div>
            </div>

            {/* Manual URL Section */}
            <div className="border-t border-[#242b3e] pt-6 space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-bold text-gray-400">
                Method 2: Set Verified Image URL
              </h3>

              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="e.g. /images/products/free-fire.png or https://..."
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customUrl.trim() || isSaving}
                  className="px-4 py-2 bg-[#1a1f30] hover:bg-[#252c45] border border-violet-800/40 text-violet-300 font-bold text-xs rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Save URL</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
