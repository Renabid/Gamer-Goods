'use client'

import { useState } from 'react'
import type { Category, ProductWithVariants } from '@/types/database'
import { ProductCard } from '@/components/ProductCard'
import { Gamepad2, Monitor, Gift, Sparkles, LayoutGrid, Search, AlertCircle } from 'lucide-react'

interface CatalogSectionProps {
  categories: Category[]
  products: ProductWithVariants[]
  error?: string | null
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Gamepad2: <Gamepad2 className="w-4 h-4" />,
  Monitor: <Monitor className="w-4 h-4" />,
  Gift: <Gift className="w-4 h-4" />,
  Sparkles: <Sparkles className="w-4 h-4" />,
}

export function CatalogSection({ categories, products, error }: CatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category_id === selectedCategory
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.subtitle && prod.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return (
    <section id="catalog" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category filter tabs and search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 border-b border-[#242b3e]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex flex-wrap items-center gap-2">
            <span>Available Gaming Products</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-950 text-violet-300 border border-violet-800/40">
              {products.length} Games
            </span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Choose a title to browse packages, compare pricing, and enter player details.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search game or gift card..."
            className="w-full bg-[#151824] border border-[#242b3e] focus:border-violet-500 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition"
          />
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 rounded-xl bg-violet-950/40 border border-violet-800/60 flex items-start gap-3 text-xs text-violet-200">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">Database Status: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto py-6 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
            selectedCategory === 'all'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-700/30'
              : 'bg-[#151824] text-gray-300 hover:bg-[#1f2436] border border-[#242b3e]'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>All Goods</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-violet-600 text-white shadow-md shadow-violet-700/30'
                : 'bg-[#151824] text-gray-300 hover:bg-[#1f2436] border border-[#242b3e]'
            }`}
          >
            {cat.icon_name && ICON_MAP[cat.icon_name]}
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Product Grid / Empty State */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center bg-[#151824] border border-[#242b3e] rounded-2xl p-8">
          <Gamepad2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-200">
            {error ? 'Database Setup Required' : 'No products found'}
          </h3>
          <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
            {error
              ? 'Connect your Supabase database in .env.local and run migrations to display live products and packages.'
              : searchQuery
              ? `No gaming products match "${searchQuery}". Try a different keyword.`
              : 'There are no active products in the database at the moment. Add products from the admin panel to populate the catalog.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <button
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
              className="mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  )
}
