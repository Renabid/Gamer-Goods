'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Gamepad2 } from 'lucide-react'

interface ProductImageProps {
  src?: string | null
  alt: string
  aspectRatio?: 'card' | 'banner' | 'square'
  className?: string
  priority?: boolean
  sizes?: string
}

/**
 * Robust Product Image component for Gamer Goods.
 * Features:
 * - Prioritizes verified image source (product.image_url, thumbnail_url, or banner_url)
 * - Automatically falls back to a clean branded placeholder if source is missing or fails to load
 * - Ensures aspect ratio preservation without layout shifting
 * - Adapts object-fit: contain for SVG logos, cover for banners/posters
 */
export function ProductImage({
  src,
  alt,
  aspectRatio = 'card',
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false)

  const isVectorLogo = src?.endsWith('.svg')

  // Clean initials or short name for placeholder badge
  const initials = alt
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  const aspectClass =
    aspectRatio === 'banner'
      ? 'aspect-[16/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : 'aspect-[16/10]'

  if (!src || hasError) {
    return (
      <div
        className={`relative w-full ${aspectClass} bg-gradient-to-br from-[#161a29] to-[#0d0f17] flex flex-col items-center justify-center p-4 text-center border-b border-[#242b3e]/60 select-none ${className}`}
      >
        <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800/50 flex items-center justify-center text-violet-400 mb-2 shadow-inner">
          {initials ? (
            <span className="font-extrabold text-sm tracking-wider">{initials}</span>
          ) : (
            <Gamepad2 className="w-6 h-6 text-violet-400" />
          )}
        </div>
        <span className="text-xs font-bold text-gray-300 max-w-[85%] truncate">
          {alt}
        </span>
        <span className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wider font-mono">
          Gamer Goods
        </span>
      </div>
    )
  }

  return (
    <div
      className={`relative w-full ${aspectClass} overflow-hidden bg-[#0d0f17] flex items-center justify-center ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        onError={() => setHasError(true)}
        className={`transition-transform duration-300 ${
          isVectorLogo
            ? 'object-contain p-6 scale-90 group-hover:scale-95'
            : 'object-cover group-hover:scale-105 opacity-95 group-hover:opacity-100'
        }`}
      />
    </div>
  )
}
