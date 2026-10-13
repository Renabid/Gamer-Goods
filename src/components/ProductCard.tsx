import Link from 'next/link'
import { formatPoishaToBDT } from '@/lib/currency'
import type { ProductWithVariants } from '@/types/database'
import { Sparkles, ArrowRight } from 'lucide-react'
import { ProductImage } from '@/components/ProductImage'

interface ProductCardProps {
  product: ProductWithVariants
}

export function ProductCard({ product }: ProductCardProps) {
  // Find lowest price among active variants
  const activeVariants = product.variants || []
  const minPrice = activeVariants.length > 0
    ? Math.min(...activeVariants.map((v) => v.price_poisha))
    : 0

  // Fallback chain for product artwork: image_url -> thumbnail_url -> banner_url
  const displayImage = product.image_url || product.thumbnail_url || product.banner_url

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col bg-[#151824] hover:bg-[#1c2132] border border-[#242b3e] hover:border-violet-500/50 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-950/30"
    >
      {/* Thumbnail Banner with fallback */}
      <div className="relative w-full overflow-hidden bg-[#0d0f17]">
        <ProductImage
          src={displayImage}
          alt={product.name}
          aspectRatio="card"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#151824] via-transparent to-black/20 pointer-events-none" />

        {product.is_featured && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-violet-600/90 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow">
            <Sparkles className="w-3 h-3 text-cyan-300" />
            <span>POPULAR</span>
          </div>
        )}

        <div className="absolute top-2.5 right-2.5 bg-[#0d0f17]/80 backdrop-blur-sm text-cyan-400 border border-cyan-500/30 text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded">
          {product.delivery_type === 'instant' ? 'Instant' : product.delivery_type === 'code' ? 'Gift Code' : 'UID Reload'}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col flex-grow justify-between">
        <div>
          <h3 className="font-bold text-gray-100 text-base group-hover:text-violet-300 transition-colors line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {product.subtitle || product.description}
          </p>
        </div>

        {/* Pricing & Variants footer */}
        <div className="mt-4 pt-3 border-t border-[#242b3e] flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-medium">
              Starting from
            </span>
            <span className="text-base font-extrabold text-cyan-400">
              {formatPoishaToBDT(minPrice)}
            </span>
          </div>

          <div className="flex items-center text-xs font-semibold text-violet-400 group-hover:text-violet-300 group-hover:translate-x-0.5 transition-all">
            <span>{activeVariants.length} Packages</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}
