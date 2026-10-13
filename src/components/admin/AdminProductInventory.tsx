'use client'

import { useState, useRef, useEffect } from 'react'
import type { Product, ProductVariant, Category, CustomFieldConfig } from '@/types/database'
import { ProductImage } from '@/components/ProductImage'
import { formatPoishaToBDT, poishaToBDT, bdtToPoisha } from '@/lib/currency'
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Archive,
  RotateCcw,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface FullProduct extends Product {
  variants: ProductVariant[]
  category?: Category | null
}

interface AdminProductInventoryProps {
  initialProducts: FullProduct[]
  categories: Category[]
  isUsingLiveDatabase: boolean
}

export function AdminProductInventory({
  initialProducts,
  categories,
  isUsingLiveDatabase,
}: AdminProductInventoryProps) {
  const [products, setProducts] = useState<FullProduct[]>(initialProducts)
  const [dynamicCategories, setDynamicCategories] = useState<Category[] | null>(null)
  const categoryList = dynamicCategories ?? categories
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden' | 'archived'>('all')

  // Expanded product ID for package management accordion
  const [expandedProductId, setExpandedProductId] = useState<string | null>(
    products[0]?.id || null
  )

  // Status message alert
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<FullProduct | null>(null)
  const [isProductSubmitting, setIsProductSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    category_id: categories[0]?.id || '',
    subtitle: '',
    description: '',
    image_url: '',
    platform_notice: '',
    delivery_type: 'manual' as 'instant' | 'manual' | 'code',
    requires_player_id: true,
    requires_server_id: false,
    player_id_label: 'Player ID / UID',
    server_id_label: 'Zone / Server ID',
    server_input_type: 'text' as 'text' | 'dropdown',
    server_options: [] as string[],
    custom_fields: [] as CustomFieldConfig[],
    is_featured: false,
    is_active: true,
  })

  // Local helper state for adding server options and custom fields
  const [newServerOption, setNewServerOption] = useState('')
  const [newCustomField, setNewCustomField] = useState<CustomFieldConfig>({
    id: '',
    label: '',
    placeholder: '',
    required: true,
    type: 'text',
  })

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data.categories)) {
          setDynamicCategories(data.categories)
          // Preselect first category if form does not have one
          setProductForm((prev) => {
            if (!prev.category_id && data.categories.length > 0) {
              return { ...prev, category_id: data.categories[0].id }
            }
            return prev
          })
        }
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setIsLoadingCategories(false)
    }
  }

  useEffect(() => {
    let ignore = false
    async function loadInitialCategories() {
      try {
        const res = await fetch('/api/admin/categories')
        if (res.ok && !ignore) {
          const data = await res.json()
          if (Array.isArray(data.categories) && !ignore) {
            setDynamicCategories(data.categories)
            setProductForm((prev) => {
              if (!prev.category_id && data.categories.length > 0) {
                return { ...prev, category_id: data.categories[0].id }
              }
              return prev
            })
          }
        }
      } catch (err) {
        console.error('Failed to load initial categories:', err)
      }
    }
    loadInitialCategories()
    return () => {
      ignore = true
    }
  }, [])

  // Variant (Package) Modal State
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [targetProductIdForVariant, setTargetProductIdForVariant] = useState<string>('')
  const [isVariantSubmitting, setIsVariantSubmitting] = useState(false)

  const [variantForm, setVariantForm] = useState({
    name: '',
    slug: '',
    description: '',
    price_bdt: 0,
    compare_at_price_bdt: 0,
    in_stock: true,
    stock_quantity: '',
    display_order: 1,
    is_active: true,
  })

  // Filtered products calculation
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategoryFilter === 'all' || p.category_id === selectedCategoryFilter

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'archived'
        ? p.is_archived
        : statusFilter === 'active'
        ? p.is_active && !p.is_archived
        : !p.is_active && !p.is_archived

    return matchesSearch && matchesCategory && matchesStatus
  })

  // ----------------------------------------------------------------------------
  // Product Handlers
  // ----------------------------------------------------------------------------
  const openCreateProductModal = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      slug: '',
      category_id: categoryList[0]?.id || '',
      subtitle: '',
      description: '',
      image_url: '',
      platform_notice: '',
      delivery_type: 'manual',
      requires_player_id: true,
      requires_server_id: false,
      player_id_label: 'Player ID / UID',
      server_id_label: 'Zone / Server ID',
      server_input_type: 'text',
      server_options: [],
      custom_fields: [],
      is_featured: false,
      is_active: true,
    })
    setNewServerOption('')
    setNewCustomField({ id: '', label: '', placeholder: '', required: true, type: 'text' })
    setIsProductModalOpen(true)
    fetchCategories()
  }

  const openEditProductModal = (product: FullProduct) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      slug: product.slug,
      category_id: product.category_id || categoryList[0]?.id || '',
      subtitle: product.subtitle || '',
      description: product.description || '',
      image_url: product.image_url || product.thumbnail_url || product.banner_url || '',
      platform_notice: product.platform_notice || '',
      delivery_type: product.delivery_type,
      requires_player_id: product.requires_player_id,
      requires_server_id: product.requires_server_id,
      player_id_label: product.player_id_label || 'Player ID / UID',
      server_id_label: product.server_id_label || 'Zone / Server ID',
      server_input_type: product.server_input_type || 'text',
      server_options: Array.isArray(product.server_options) ? product.server_options : [],
      custom_fields: Array.isArray(product.custom_fields) ? product.custom_fields : [],
      is_featured: product.is_featured,
      is_active: product.is_active,
    })
    setNewServerOption('')
    setNewCustomField({ id: '', label: '', placeholder: '', required: true, type: 'text' })
    setIsProductModalOpen(true)
    fetchCategories()
  }

  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setProductForm((prev) => ({
      ...prev,
      name,
      slug: !editingProduct
        ? name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : prev.slug,
    }))
  }

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', editingProduct?.id || 'new')

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      setProductForm((prev) => ({ ...prev, image_url: data.url }))
      setStatusMessage({
        type: 'success',
        text: `Image uploaded (${data.storage === 'supabase' ? 'Supabase Storage' : 'Local Preview'}).`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image upload failed'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setIsUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProductSubmitting(true)
    setStatusMessage(null)

    // Validate category selection (required business rule)
    if (!productForm.category_id || productForm.category_id.trim() === '') {
      setStatusMessage({
        type: 'error',
        text: 'Please select a valid category for the product. If no categories exist, create one in Category Management first.',
      })
      setIsProductSubmitting(false)
      return
    }

    try {
      const isEdit = Boolean(editingProduct)
      const res = await fetch('/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit ? { id: editingProduct!.id, ...productForm } : productForm
        ),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save product')

      const matchedCategory =
        categoryList.find((c) => c.id === productForm.category_id) ||
        editingProduct?.category ||
        null

      if (isEdit) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editingProduct!.id
              ? {
                  ...p,
                  ...productForm,
                  category: matchedCategory,
                }
              : p
          )
        )
        setStatusMessage({
          type: 'success',
          text: `Product "${productForm.name}" updated successfully.`,
        })
      } else {
        const newProduct: FullProduct = {
          ...(data.product || {
            id: `p-${Date.now()}`,
            ...productForm,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
          variants: [],
          category: matchedCategory,
        }
        setProducts((prev) => [newProduct, ...prev])
        setExpandedProductId(newProduct.id)
        setStatusMessage({
          type: 'success',
          text: `Product "${productForm.name}" created! You can now add packages.`,
        })
      }

      setIsProductModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Product operation failed'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setIsProductSubmitting(false)
    }
  }

  const handleToggleProductActive = async (product: FullProduct) => {
    try {
      const newStatus = !product.is_active
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          is_active: newStatus,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update active state')

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_active: newStatus } : p))
      )
      setStatusMessage({
        type: 'success',
        text: `"${product.name}" is now ${newStatus ? 'active' : 'hidden'}.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Update failed'
      setStatusMessage({ type: 'error', text: msg })
    }
  }

  const handleArchiveProduct = async (product: FullProduct, unarchive: boolean = false) => {
    const actionText = unarchive ? 'restore' : 'archive'
    if (!confirm(`Are you sure you want to ${actionText} "${product.name}"?`)) return

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          is_archived: !unarchive,
          is_active: unarchive ? true : false,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Failed to ${actionText} product`)

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, is_archived: !unarchive, is_active: unarchive ? true : false }
            : p
        )
      )
      setStatusMessage({
        type: 'success',
        text: `"${product.name}" has been ${unarchive ? 'restored' : 'archived'}.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      setStatusMessage({ type: 'error', text: msg })
    }
  }

  const handleDeleteProductPermanently = async (product: FullProduct) => {
    if (
      !confirm(
        `PERMANENT DELETION: Are you sure you want to permanently delete "${product.name}"? This will delete all associated packages and cannot be undone.`
      )
    ) {
      return
    }

    try {
      const res = await fetch(`/api/admin/products?id=${product.id}&permanent=true`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete product')

      setProducts((prev) => prev.filter((p) => p.id !== product.id))
      setStatusMessage({
        type: 'success',
        text: `Product "${product.name}" permanently removed.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setStatusMessage({ type: 'error', text: msg })
    }
  }

  // ----------------------------------------------------------------------------
  // Variant (Package) Handlers
  // ----------------------------------------------------------------------------
  const openCreateVariantModal = (productId: string) => {
    setEditingVariant(null)
    setTargetProductIdForVariant(productId)
    const parentProduct = products.find((p) => p.id === productId)
    const existingCount = parentProduct?.variants.length || 0

    setVariantForm({
      name: '',
      slug: '',
      description: '',
      price_bdt: 100,
      compare_at_price_bdt: 0,
      in_stock: true,
      stock_quantity: '',
      display_order: existingCount + 1,
      is_active: true,
    })
    setIsVariantModalOpen(true)
  }

  const openEditVariantModal = (productId: string, variant: ProductVariant) => {
    setEditingVariant(variant)
    setTargetProductIdForVariant(productId)
    setVariantForm({
      name: variant.name,
      slug: variant.slug,
      description: variant.description || '',
      price_bdt: poishaToBDT(variant.price_poisha),
      compare_at_price_bdt: variant.compare_at_price_poisha
        ? poishaToBDT(variant.compare_at_price_poisha)
        : 0,
      in_stock: variant.in_stock,
      stock_quantity: variant.stock_quantity !== null ? String(variant.stock_quantity) : '',
      display_order: variant.display_order,
      is_active: variant.is_active,
    })
    setIsVariantModalOpen(true)
  }

  const handleVariantNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setVariantForm((prev) => ({
      ...prev,
      name,
      slug: !editingVariant
        ? name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : prev.slug,
    }))
  }

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsVariantSubmitting(true)
    setStatusMessage(null)

    try {
      const isEdit = Boolean(editingVariant)
      const price_poisha = bdtToPoisha(variantForm.price_bdt)
      const compare_at_price_poisha =
        variantForm.compare_at_price_bdt > 0
          ? bdtToPoisha(variantForm.compare_at_price_bdt)
          : null

      const payload = {
        product_id: targetProductIdForVariant,
        name: variantForm.name,
        slug: variantForm.slug,
        description: variantForm.description,
        price_poisha,
        compare_at_price_poisha,
        in_stock: variantForm.in_stock,
        stock_quantity: variantForm.stock_quantity ? Number(variantForm.stock_quantity) : null,
        display_order: variantForm.display_order,
        is_active: variantForm.is_active,
      }

      const res = await fetch('/api/admin/variants', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit ? { id: editingVariant!.id, ...payload } : payload
        ),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save package')

      const savedVariant: ProductVariant =
        data.variant || {
          id: isEdit ? editingVariant!.id : `v-${Date.now()}`,
          ...payload,
          image_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== targetProductIdForVariant) return p
          const updatedVariants = isEdit
            ? p.variants.map((v) => (v.id === editingVariant!.id ? savedVariant : v))
            : [...p.variants, savedVariant]
          return {
            ...p,
            variants: updatedVariants.sort((a, b) => a.display_order - b.display_order),
          }
        })
      )

      setStatusMessage({
        type: 'success',
        text: `Package "${variantForm.name}" ${isEdit ? 'updated' : 'added'} successfully.`,
      })
      setIsVariantModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Variant operation failed'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setIsVariantSubmitting(false)
    }
  }

  const handleDeleteVariant = async (productId: string, variant: ProductVariant) => {
    if (!confirm(`Are you sure you want to remove package "${variant.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/variants?id=${variant.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete package')

      setProducts((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p
          return {
            ...p,
            variants: p.variants.filter((v) => v.id !== variant.id),
          }
        })
      )
      setStatusMessage({
        type: 'success',
        text: `Package "${variant.name}" removed successfully.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setStatusMessage({ type: 'error', text: msg })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">
              Products &amp; Packages
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isUsingLiveDatabase
                  ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
                  : 'bg-violet-950 text-violet-300 border-violet-800/40'
              }`}
            >
              {isUsingLiveDatabase ? 'Supabase' : 'Local Preview'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Manage gaming titles, packages, UID input requirements, and pricing.
          </p>
        </div>

        <button
          onClick={openCreateProductModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs transition shadow-md shadow-violet-800/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by title, slug, or subtitle..."
            className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg pl-9 pr-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Category filter */}
          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-[#0d0f17] border border-[#242b3e] text-gray-300 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as 'all' | 'active' | 'hidden' | 'archived'
              )
            }
            className="bg-[#0d0f17] border border-[#242b3e] text-gray-300 rounded-lg px-3 py-2 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="hidden">Hidden Only</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products & Packages Accordion List */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-12 text-center">
            <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-200">No products found</h3>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your search criteria or add a new product.
            </p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const isExpanded = expandedProductId === product.id
            const displayImg =
              product.image_url || product.thumbnail_url || product.banner_url

            return (
              <div
                key={product.id}
                className={`bg-[#151824] border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded
                    ? 'border-violet-500/60 shadow-xl shadow-violet-950/20'
                    : 'border-[#242b3e] hover:border-gray-700'
                }`}
              >
                {/* Product Header Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl bg-[#0d0f17] border border-[#242b3e] overflow-hidden shrink-0 flex items-center justify-center">
                      <ProductImage
                        src={displayImg}
                        alt={product.name}
                        aspectRatio="square"
                        className="w-full h-full"
                      />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-extrabold text-base text-white">
                          {product.name}
                        </span>

                        {product.is_archived ? (
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50">
                            Archived
                          </span>
                        ) : product.is_active ? (
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                            Hidden
                          </span>
                        )}

                        {product.is_featured && (
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/40">
                            Featured
                          </span>
                        )}

                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#0d0f17] text-cyan-400 border border-[#242b3e]">
                          {product.delivery_type}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>
                          Category:{' '}
                          <strong className="text-gray-300">
                            {product.category?.name || 'Unassigned'}
                          </strong>
                        </span>
                        <span>&bull;</span>
                        <span className="font-mono text-gray-500">
                          /{product.slug}
                        </span>
                        <span>&bull;</span>
                        <span className="text-violet-400 font-semibold">
                          {product.variants.length} packages
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    <Link
                      href={`/products/${product.slug}`}
                      target="_blank"
                      title="View on storefront"
                      className="p-2 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-cyan-400 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>

                    <button
                      onClick={() => handleToggleProductActive(product)}
                      title={product.is_active ? 'Hide on storefront' : 'Make visible'}
                      className="p-2 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-white transition"
                    >
                      {product.is_active ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4 text-cyan-400" />
                      )}
                    </button>

                    <button
                      onClick={() => openEditProductModal(product)}
                      title="Edit product"
                      className="p-2 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-violet-400 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {product.is_archived ? (
                      <>
                        <button
                          onClick={() => handleArchiveProduct(product, true)}
                          title="Restore product"
                          className="p-2 rounded-lg bg-[#0d0f17] border border-emerald-900/40 text-emerald-400 hover:text-emerald-300 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProductPermanently(product)}
                          title="Permanently Delete"
                          className="p-2 rounded-lg bg-[#0d0f17] border border-rose-900/40 text-rose-400 hover:text-rose-300 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleArchiveProduct(product, false)}
                        title="Archive product safely"
                        className="p-2 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-amber-400 transition"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() =>
                        setExpandedProductId(isExpanded ? null : product.id)
                      }
                      className="px-3 py-2 rounded-lg bg-[#1a1f30] border border-violet-800/40 text-violet-300 font-bold text-xs flex items-center gap-1.5 transition ml-2"
                    >
                      <span>Packages ({product.variants.length})</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Packages Section (Accordion) */}
                {isExpanded && (
                  <div className="border-t border-[#242b3e] bg-[#111420] p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs uppercase tracking-wider font-bold text-gray-300">
                          Package Denominations &amp; Pricing for {product.name}
                        </h4>
                        <span className="text-[11px] text-gray-500 font-mono">
                          (Stored in Poisha, displayed in BDT)
                        </span>
                      </div>

                      <button
                        onClick={() => openCreateVariantModal(product.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Package</span>
                      </button>
                    </div>

                    {product.variants.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-[#242b3e] rounded-xl text-xs text-gray-400">
                        No packages configured yet. Click &quot;Add Package&quot; to create denominations.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="text-gray-400 uppercase font-mono text-[10px] border-b border-[#242b3e]/60">
                            <tr>
                              <th className="py-2.5 px-3">Order</th>
                              <th className="py-2.5 px-3">Package Name</th>
                              <th className="py-2.5 px-3">Slug</th>
                              <th className="py-2.5 px-3">Price (BDT)</th>
                              <th className="py-2.5 px-3">DB Poisha</th>
                              <th className="py-2.5 px-3">Stock</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#242b3e]/40">
                            {product.variants.map((v) => (
                              <tr key={v.id} className="hover:bg-[#151824]/60 transition">
                                <td className="py-2.5 px-3 font-mono text-gray-500 font-bold">
                                  #{v.display_order}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-white">
                                  {v.name}
                                  {v.description && (
                                    <span className="block text-[10px] text-gray-400 font-normal">
                                      {v.description}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-cyan-400">
                                  {v.slug}
                                </td>
                                <td className="py-2.5 px-3 font-extrabold text-cyan-400 text-sm">
                                  {formatPoishaToBDT(v.price_poisha)}
                                  {v.compare_at_price_poisha &&
                                    v.compare_at_price_poisha > v.price_poisha && (
                                      <span className="text-xs text-gray-500 line-through block font-normal">
                                        {formatPoishaToBDT(v.compare_at_price_poisha)}
                                      </span>
                                    )}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-gray-400">
                                  {v.price_poisha}p
                                </td>
                                <td className="py-2.5 px-3 font-mono">
                                  {v.stock_quantity !== null
                                    ? `${v.stock_quantity} left`
                                    : 'Unlimited'}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                      v.is_active && v.in_stock
                                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                                    }`}
                                  >
                                    {v.is_active && v.in_stock ? 'Available' : 'Disabled'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => openEditVariantModal(product.id, v)}
                                      title="Edit package"
                                      className="p-1 rounded bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-violet-400"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVariant(product.id, v)}
                                      title="Remove package"
                                      className="p-1 rounded bg-[#0d0f17] border border-rose-900/40 text-rose-400 hover:text-rose-300"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl max-w-3xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header (Sticky) */}
            <div className="px-6 py-4 border-b border-[#242b3e] flex items-center justify-between shrink-0 bg-[#151824]/95">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-violet-400" />
                  <span>{editingProduct ? `Edit: ${editingProduct.name}` : 'Create New Game / Digital Product'}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Configure game titles, categories, custom player inputs, and delivery settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1f30] transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body & Form (Scrollable) */}
            <form onSubmit={handleProductSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Product / Game Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={handleProductNameChange}
                    placeholder="e.g. Free Fire Diamonds (UID)"
                    required
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    URL Slug <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g. free-fire-diamonds"
                    required
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="product-category-select" className="block font-semibold text-gray-300">
                      Category <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={fetchCategories}
                      disabled={isLoadingCategories}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                      title="Reload categories from database"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingCategories ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>

                  {categoryList.length === 0 ? (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-amber-200 font-medium text-xs sm:text-sm">
                            No categories exist in the database
                          </p>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            A category is required to create or save a product. Please add at least one category first.
                          </p>
                          <div className="pt-1.5 flex items-center gap-3">
                            <Link
                              href="/admin/categories"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 underline"
                            >
                              Go to Categories &rarr;
                            </Link>
                            <button
                              type="button"
                              onClick={fetchCategories}
                              disabled={isLoadingCategories}
                              className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-white"
                            >
                              <RefreshCw className={`w-3 h-3 ${isLoadingCategories ? 'animate-spin' : ''}`} />
                              Refresh list
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <select
                        id="product-category-select"
                        required
                        value={productForm.category_id}
                        onChange={(e) =>
                          setProductForm((prev) => ({ ...prev, category_id: e.target.value }))
                        }
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                      >
                        <option value="" disabled>
                          -- Select a Category --
                        </option>
                        {/* If editing an existing product whose category is not in categoryList, preserve it */}
                        {editingProduct?.category &&
                          !categoryList.some((c) => c.id === editingProduct.category_id) && (
                            <option value={editingProduct.category.id}>
                              {editingProduct.category.name} (Current)
                            </option>
                          )}
                        {categoryList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Need another category?{' '}
                        <Link
                          href="/admin/categories"
                          target="_blank"
                          className="text-violet-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          Manage categories <ExternalLink className="w-2.5 h-2.5" />
                        </Link>
                      </p>
                    </>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Delivery Method
                  </label>
                  <select
                    value={productForm.delivery_type}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        delivery_type: e.target.value as 'instant' | 'manual' | 'code',
                      }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  >
                    <option value="manual">Manual UID Recharge (5-15 mins)</option>
                    <option value="instant">Instant Automated Top-Up</option>
                    <option value="code">Prepaid Digital Voucher / Gift Code</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={productForm.subtitle}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="e.g. Instant Garena Free Fire top-up via Player ID"
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Description &amp; Instructions
                </label>
                <textarea
                  rows={3}
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Provide instructions and delivery details for the user."
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                />
              </div>

              {/* Artwork & Image Upload */}
              <div className="border-t border-[#242b3e] pt-4">
                <label className="block font-semibold text-gray-300 mb-1">
                  Product Image Artwork URL or Upload
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={productForm.image_url}
                    onChange={(e) =>
                      setProductForm((prev) => ({ ...prev, image_url: e.target.value }))
                    }
                    placeholder="/images/products/free-fire.png or Supabase storage URL"
                    className="flex-1 bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 font-mono focus:outline-none text-xs"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProductImageUpload}
                    accept="image/*"
                    className="hidden"
                    id="product-file-upload"
                  />
                  <label
                    htmlFor="product-file-upload"
                    className="px-3 py-2 rounded-lg bg-[#1a1f30] hover:bg-[#252c45] border border-violet-800/40 text-violet-300 font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Upload Image</span>
                  </label>
                </div>
              </div>

              {/* Player ID & Server ID Configuration */}
              <div className="border-t border-[#242b3e] pt-4 space-y-3">
                <span className="font-bold text-gray-300 uppercase tracking-wider text-[11px] block">
                  Customer Input Configuration
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Player UID Configuration */}
                  <div className="p-3.5 rounded-xl bg-[#0d0f17] border border-[#242b3e] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="req_player_id"
                            checked={productForm.requires_player_id}
                            onChange={(e) =>
                              setProductForm((prev) => ({
                                ...prev,
                                requires_player_id: e.target.checked,
                              }))
                            }
                            className="rounded border-[#242b3e] bg-[#151824] text-violet-600 focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="req_player_id" className="font-semibold text-gray-200 cursor-pointer text-xs">
                            Player ID / UID
                          </label>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${productForm.requires_player_id ? 'bg-violet-950/80 text-violet-300 border border-violet-800/40' : 'bg-gray-800 text-gray-400'}`}>
                          {productForm.requires_player_id ? 'Required' : 'Optional / Off'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={productForm.player_id_label}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            player_id_label: e.target.value,
                          }))
                        }
                        placeholder="Label (e.g. Player ID / UID)"
                        className="w-full bg-[#151824] border border-[#242b3e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:border-violet-500 focus:outline-none"
                      />
                    </div>

                    {/* Server / Region Configuration */}
                    <div className="p-3.5 rounded-xl bg-[#0d0f17] border border-[#242b3e] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="req_server_id"
                            checked={productForm.requires_server_id}
                            onChange={(e) =>
                              setProductForm((prev) => ({
                                ...prev,
                                requires_server_id: e.target.checked,
                              }))
                            }
                            className="rounded border-[#242b3e] bg-[#151824] text-violet-600 focus:ring-0 cursor-pointer"
                          />
                          <label htmlFor="req_server_id" className="font-semibold text-gray-200 cursor-pointer text-xs">
                            Server / Region Field
                          </label>
                        </div>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${productForm.requires_server_id ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/40' : 'bg-gray-800 text-gray-400'}`}>
                          {productForm.requires_server_id ? 'Required' : 'Disabled'}
                        </span>
                      </div>

                      {productForm.requires_server_id && (
                        <div className="space-y-3 pt-1 border-t border-[#242b3e]/60">
                          <div>
                            <label className="text-[11px] font-medium text-gray-400 block mb-1">
                              Field Label
                            </label>
                            <input
                              type="text"
                              value={productForm.server_id_label}
                              onChange={(e) =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  server_id_label: e.target.value,
                                }))
                              }
                              placeholder="e.g. Server / Region"
                              className="w-full bg-[#151824] border border-[#242b3e] rounded-lg px-2.5 py-1.5 text-xs text-gray-200 focus:border-violet-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-medium text-gray-400 block mb-1">
                              Input Type
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setProductForm((prev) => ({ ...prev, server_input_type: 'dropdown' }))
                                }
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                                  productForm.server_input_type === 'dropdown'
                                    ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                                    : 'bg-[#151824] border-[#242b3e] text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Dropdown Menu
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setProductForm((prev) => ({ ...prev, server_input_type: 'text' }))
                                }
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                                  productForm.server_input_type === 'text'
                                    ? 'bg-violet-600/20 border-violet-500 text-violet-300'
                                    : 'bg-[#151824] border-[#242b3e] text-gray-400 hover:text-gray-200'
                                }`}
                              >
                                Free Text Input
                              </button>
                            </div>
                          </div>

                          {productForm.server_input_type === 'dropdown' && (
                            <div className="space-y-2 bg-[#151824]/60 p-2.5 rounded-lg border border-[#242b3e]">
                              <label className="text-[11px] font-semibold text-gray-300 flex items-center justify-between">
                                <span>Dropdown Server Options</span>
                                <span className="text-[10px] text-gray-400">
                                  {productForm.server_options?.length || 0} options
                                </span>
                              </label>

                              {/* Tags display */}
                              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                                {(productForm.server_options || []).length === 0 ? (
                                  <span className="text-[11px] text-gray-500 italic">
                                    No options added yet. Add Asia, Europe, etc. below:
                                  </span>
                                ) : (
                                  (productForm.server_options || []).map((opt, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-violet-950 text-violet-300 border border-violet-800/60"
                                    >
                                      <span>{opt}</span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setProductForm((prev) => ({
                                            ...prev,
                                            server_options: (prev.server_options || []).filter(
                                              (_, i) => i !== idx
                                            ),
                                          }))
                                        }
                                        className="text-violet-400 hover:text-white ml-0.5"
                                        title="Remove option"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))
                                )}
                              </div>

                              {/* Add option input */}
                              <div className="flex gap-2 pt-1">
                                <input
                                  type="text"
                                  value={newServerOption}
                                  onChange={(e) => setNewServerOption(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      const val = newServerOption.trim()
                                      if (val && !productForm.server_options?.includes(val)) {
                                        setProductForm((prev) => ({
                                          ...prev,
                                          server_options: [...(prev.server_options || []), val],
                                        }))
                                        setNewServerOption('')
                                      }
                                    }
                                  }}
                                  placeholder="e.g. Asia, Europe, America..."
                                  className="flex-1 bg-[#151824] border border-[#242b3e] rounded-lg px-2 py-1 text-xs text-gray-200 focus:border-violet-500 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = newServerOption.trim()
                                    if (val && !productForm.server_options?.includes(val)) {
                                      setProductForm((prev) => ({
                                        ...prev,
                                        server_options: [...(prev.server_options || []), val],
                                      }))
                                      setNewServerOption('')
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-[#242b3e] hover:bg-violet-600 text-xs font-semibold text-white transition"
                                >
                                  + Add
                                </button>
                              </div>

                              {/* Preset Quick-Buttons */}
                              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-gray-400">
                                <span>Quick presets:</span>
                                {['Asia', 'Europe', 'America', 'Middle East', 'India'].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    disabled={productForm.server_options?.includes(preset)}
                                    onClick={() => {
                                      if (!productForm.server_options?.includes(preset)) {
                                        setProductForm((prev) => ({
                                          ...prev,
                                          server_options: [...(prev.server_options || []), preset],
                                        }))
                                      }
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-[#242b3e]/60 hover:bg-[#242b3e] text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    +{preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  {/* Extra Custom Fields Section (e.g. Zone ID, Character ID) */}
                  <div className="p-3.5 rounded-xl bg-[#0d0f17] border border-[#242b3e] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-200 text-xs">
                          Extra Product Fields
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Add custom fields required for specific games (e.g., Zone ID for Mobile Legends, Character ID).
                        </p>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-400 bg-[#151824] px-2 py-0.5 rounded border border-[#242b3e]">
                        {productForm.custom_fields?.length || 0} custom fields
                      </span>
                    </div>

                    {/* Existing Custom Fields */}
                    {productForm.custom_fields && productForm.custom_fields.length > 0 && (
                      <div className="space-y-2">
                        {productForm.custom_fields.map((fld, idx) => (
                          <div
                            key={fld.id || idx}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#151824] border border-[#242b3e] text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white">{fld.label}</span>
                                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                                  ID: {fld.id}
                                </span>
                                {fld.required && (
                                  <span className="text-[10px] text-amber-400 font-semibold">
                                    (Required)
                                  </span>
                                )}
                              </div>
                              {fld.placeholder && (
                                <p className="text-[10px] text-gray-400 italic">
                                  Placeholder: &ldquo;{fld.placeholder}&rdquo;
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setProductForm((prev) => ({
                                  ...prev,
                                  custom_fields: (prev.custom_fields || []).filter((_, i) => i !== idx),
                                }))
                              }
                              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition"
                              title="Delete field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Custom Field Form */}
                    <div className="p-2.5 rounded-lg bg-[#151824]/60 border border-[#242b3e] space-y-2">
                      <div className="text-[11px] font-semibold text-gray-300">
                        + Add Custom Field
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-0.5">Field Label *</label>
                          <input
                            type="text"
                            value={newCustomField.label}
                            onChange={(e) => {
                              const label = e.target.value
                              const id = label
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '_')
                                .replace(/(^_|_$)+/g, '')
                              setNewCustomField((prev) => ({ ...prev, label, id }))
                            }}
                            placeholder="e.g. Zone ID"
                            className="w-full bg-[#151824] border border-[#242b3e] rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-0.5">Placeholder</label>
                          <input
                            type="text"
                            value={newCustomField.placeholder || ''}
                            onChange={(e) =>
                              setNewCustomField((prev) => ({ ...prev, placeholder: e.target.value }))
                            }
                            placeholder="e.g. 2001"
                            className="w-full bg-[#151824] border border-[#242b3e] rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-violet-500"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-1.5 text-[11px] text-gray-300 pb-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newCustomField.required !== false}
                              onChange={(e) =>
                                setNewCustomField((prev) => ({ ...prev, required: e.target.checked }))
                              }
                              className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600 focus:ring-0"
                            />
                            Required
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              if (!newCustomField.label.trim()) return
                              const finalId =
                                newCustomField.id.trim() ||
                                newCustomField.label
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, '_')
                                  .replace(/(^_|_$)+/g, '')
                              const fieldToAdd: CustomFieldConfig = {
                                id: finalId,
                                label: newCustomField.label.trim(),
                                placeholder: newCustomField.placeholder?.trim() || undefined,
                                required: newCustomField.required !== false,
                                type: 'text',
                              }
                              setProductForm((prev) => ({
                                ...prev,
                                custom_fields: [
                                  ...(prev.custom_fields || []).filter((f) => f.id !== fieldToAdd.id),
                                  fieldToAdd,
                                ],
                              }))
                              setNewCustomField({
                                id: '',
                                label: '',
                                placeholder: '',
                                required: true,
                                type: 'text',
                              })
                            }}
                            className="flex-1 px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-xs font-semibold text-white transition mb-0.5 cursor-pointer text-center"
                          >
                            Add Field
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Toggles */}
              <div className="border-t border-[#242b3e] pt-4 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active_prod"
                    checked={productForm.is_active}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600"
                  />
                  <label htmlFor="is_active_prod" className="text-gray-300 cursor-pointer font-semibold">
                    Active on Storefront
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_featured_prod"
                    checked={productForm.is_featured}
                    onChange={(e) =>
                      setProductForm((prev) => ({
                        ...prev,
                        is_featured: e.target.checked,
                      }))
                    }
                    className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600"
                  />
                  <label htmlFor="is_featured_prod" className="text-gray-300 cursor-pointer font-semibold">
                    Featured (Popular badge)
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="px-6 py-4 border-t border-[#242b3e] flex items-center justify-between gap-3 shrink-0 bg-[#151824]/95">
              <span className="text-[11px] text-gray-500 hidden sm:inline">
                All fields marked <span className="text-rose-400">*</span> are required.
              </span>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0d0f17] hover:bg-[#1a1f30] border border-[#242b3e] text-gray-300 font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProductSubmitting}
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-md shadow-violet-800/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isProductSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* ------------------------------------------------------------------------ */}
      {/* Variant (Package) Modal Dialog */}
      {/* ------------------------------------------------------------------------ */}
      {isVariantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl max-w-xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Variant Header (Sticky) */}
            <div className="px-6 py-4 border-b border-[#242b3e] flex items-center justify-between shrink-0 bg-[#151824]/95">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-violet-400" />
                <span>{editingVariant ? `Edit Package: ${editingVariant.name}` : 'Add New Package'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsVariantModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1f30] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVariantSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Package Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={variantForm.name}
                    onChange={handleVariantNameChange}
                    placeholder="e.g. 115 Diamonds, Weekly Pass"
                    required
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Package Slug <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={variantForm.slug}
                    onChange={(e) =>
                      setVariantForm((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="e.g. 115-diamonds"
                    required
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Package Description / Badge
                </label>
                <input
                  type="text"
                  value={variantForm.description}
                  onChange={(e) =>
                    setVariantForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="e.g. Direct UID reload, 100+15 bonus"
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                />
              </div>

              {/* Price poisha conversion fields */}
              <div className="grid grid-cols-2 gap-4 bg-[#0d0f17] p-3.5 rounded-xl border border-[#242b3e]">
                <div>
                  <label className="block font-semibold text-cyan-400 mb-1">
                    Price in BDT (৳) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variantForm.price_bdt}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        price_bdt: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    className="w-full bg-[#151824] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-white font-extrabold text-sm focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block font-mono">
                    = {bdtToPoisha(variantForm.price_bdt)} Poisha in DB
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-400 mb-1">
                    Original Price (Optional strikethrough)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={variantForm.compare_at_price_bdt}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        compare_at_price_bdt: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#151824] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-300 focus:outline-none"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block font-mono">
                    = {bdtToPoisha(variantForm.compare_at_price_bdt)} Poisha in DB
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Stock Quantity (Empty = Unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={variantForm.stock_quantity}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        stock_quantity: e.target.value,
                      }))
                    }
                    placeholder="Leave blank for on-demand"
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={variantForm.display_order}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        display_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="var_in_stock"
                    checked={variantForm.in_stock}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        in_stock: e.target.checked,
                      }))
                    }
                    className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600"
                  />
                  <label htmlFor="var_in_stock" className="text-gray-300 cursor-pointer font-semibold">
                    In Stock
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="var_is_active"
                    checked={variantForm.is_active}
                    onChange={(e) =>
                      setVariantForm((prev) => ({
                        ...prev,
                        is_active: e.target.checked,
                      }))
                    }
                    className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600"
                  />
                  <label htmlFor="var_is_active" className="text-gray-300 cursor-pointer font-semibold">
                    Active &amp; Purchasing Enabled
                  </label>
                </div>
              </div>
            </div>

            {/* Variant Footer (Sticky) */}
            <div className="px-6 py-4 border-t border-[#242b3e] flex items-center justify-end gap-3 shrink-0 bg-[#151824]/95">
              <button
                type="button"
                onClick={() => setIsVariantModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-[#0d0f17] hover:bg-[#1a1f30] border border-[#242b3e] text-gray-300 font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isVariantSubmitting}
                className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-md shadow-violet-800/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isVariantSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingVariant ? 'Save Package' : 'Create Package'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  )
}
