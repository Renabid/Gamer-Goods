'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatPoishaToBDT } from '@/lib/currency'
import type { ProductWithVariants, ProductVariant, PaymentMethod, CustomFieldConfig } from '@/types/database'
import { ProductImage } from '@/components/ProductImage'
import {
  ShieldCheck,
  Zap,
  ArrowLeft,
  CheckCircle2,
  Info,
  Clock,
  ShoppingCart,
  User,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Loader2,
  CreditCard,
  Building2,
  QrCode,
  RefreshCw,
  ExternalLink,
  Search,
} from 'lucide-react'

interface ProductDetailClientProps {
  product: ProductWithVariants
  paymentMethods?: PaymentMethod[]
  isUsingLiveDatabase: boolean
}

interface OrderSuccessData {
  order_id: string
  order_number: string
  total_amount_poisha: number
  status: string
  payment_status?: string
  payment_method?: string
  transaction_id?: string
  product_name: string
  variant_name: string
  quantity: number
}

export function ProductDetailClient({
  product,
  paymentMethods = [],
  isUsingLiveDatabase,
}: ProductDetailClientProps) {
  const variants = product.variants || []
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  )

  // Dynamic game-specific inputs
  const [playerId, setPlayerId] = useState<string>('')
  const [serverId, setServerId] = useState<string>(
    product.server_input_type === 'dropdown' && product.server_options && product.server_options.length > 0
      ? product.server_options[0]
      : ''
  )
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState<number>(1)

  // Checkout modal & payment state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Selected dynamic payment method
  const activePaymentMethods = (paymentMethods || []).filter((m) => m.is_active)
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(
    activePaymentMethods[0]?.id || ''
  )
  const [senderNumber, setSenderNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [hasCopiedNumber, setHasCopiedNumber] = useState(false)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessData | null>(null)
  const [isCheckingLiveStatus, setIsCheckingLiveStatus] = useState(false)

  const checkLatestOrderStatus = async (ordNum: string) => {
    setIsCheckingLiveStatus(true)
    try {
      const res = await fetch(`/api/orders/${ordNum}`)
      if (res.ok) {
        const data = await res.json()
        if (data.order) {
          setOrderSuccess((prev) =>
            prev
              ? {
                  ...prev,
                  status: data.order.status,
                  payment_status: data.order.payment?.status || prev.payment_status,
                }
              : null
          )
        }
      }
    } catch (err) {
      console.error('Failed to poll order status:', err)
    } finally {
      setIsCheckingLiveStatus(false)
    }
  }

  const activeVariants = variants.filter((v) => v.is_active)

  const selectedPaymentMethod =
    activePaymentMethods.find((m) => m.id === selectedPaymentMethodId) ||
    activePaymentMethods[0] ||
    null

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num.replace(/[^0-9a-zA-Z-]/g, ''))
    setHasCopiedNumber(true)
    setTimeout(() => setHasCopiedNumber(false), 2000)
  }

  const handleProceedToCheckout = () => {
    if (!selectedVariant) return
    if (product.requires_player_id && !playerId.trim()) return
    if (product.requires_server_id && !serverId.trim()) return

    // Validate custom fields
    if (Array.isArray(product.custom_fields)) {
      for (const field of product.custom_fields) {
        if (field.required && !customFieldValues[field.id]?.trim()) {
          return
        }
      }
    }

    setSubmitError(null)
    setIsCheckoutOpen(true)
  }

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVariant || !selectedPaymentMethod) return

    setSubmitError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity,
          playerId: playerId.trim() || undefined,
          serverId: serverId.trim() || undefined,
          customFields: customFieldValues,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          paymentMethod: selectedPaymentMethod.slug,
          paymentMethodId: selectedPaymentMethod.id,
          senderNumber: senderNumber.trim() || undefined,
          transactionId: transactionId.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order. Please try again.')
      }

      setOrderSuccess(data.order)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb navigation */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-violet-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Storefront</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Product Banner & Details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl overflow-hidden shadow-lg">
            {/* Banner Image using ProductImage with fallback */}
            <div className="relative w-full overflow-hidden bg-[#0d0f17]">
              <ProductImage
                src={product.image_url || product.banner_url || product.thumbnail_url}
                alt={product.name}
                aspectRatio="banner"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#151824] via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-violet-950/80 text-violet-300 border border-violet-800/50">
                  {product.delivery_type === 'instant'
                    ? 'Instant Delivery'
                    : product.delivery_type === 'code'
                    ? 'Gift Code'
                    : 'UID Reload'}
                </span>
                {product.requires_player_id && (
                  <span className="text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
                    UID Required
                  </span>
                )}
                {!isUsingLiveDatabase && (
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-violet-950 text-violet-400 border border-violet-800/40">
                    Local Data
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {product.name}
              </h1>

              {product.subtitle && (
                <p className="text-sm text-gray-300 mt-1 font-medium">
                  {product.subtitle}
                </p>
              )}

              {product.platform_notice && (
                <div className="mt-4 p-3 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-start gap-2.5 text-xs text-violet-200">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Important Notice: </span>
                    {product.platform_notice}
                  </div>
                </div>
              )}

              {/* Product description */}
              {product.description && (
                <div className="mt-6 border-t border-[#242b3e] pt-6">
                  <h3 className="text-sm font-bold text-gray-200 mb-2">About this Item</h3>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Safety & Delivery badges */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-[#242b3e] pt-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1d2233] border border-[#242b3e]">
                  <Zap className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Fast Delivery</h4>
                    <p className="text-[11px] text-gray-400">Within 5-15 mins</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1d2233] border border-[#242b3e]">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">100% Genuine</h4>
                    <p className="text-[11px] text-gray-400">Official distributor</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1d2233] border border-[#242b3e]">
                  <Clock className="w-5 h-5 text-violet-400 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-white">24/7 Support</h4>
                    <p className="text-[11px] text-gray-400">WhatsApp & Messenger</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Package Selector & Checkout Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 shadow-xl sticky top-20">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Select Package</span>
              <span className="text-xs text-gray-400 font-normal">
                {activeVariants.length} options available
              </span>
            </h2>

            {/* Step 1: Package Selection Cards */}
            {activeVariants.length === 0 ? (
              <div className="p-6 rounded-xl border border-[#242b3e] bg-[#1a1f30] text-center mb-6">
                <p className="text-sm font-semibold text-gray-300">No packages currently available</p>
                <p className="text-xs text-gray-500 mt-1">This product does not have any active packages right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
                {activeVariants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id
                  const isOutOfStock = !variant.in_stock

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => !isOutOfStock && setSelectedVariant(variant)}
                      className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                        isOutOfStock
                          ? 'border-[#242b3e] bg-[#141722] opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-violet-500 bg-violet-950/40 shadow-md shadow-violet-900/30'
                          : 'border-[#242b3e] bg-[#1a1f30] hover:border-gray-600 cursor-pointer'
                      }`}
                    >
                      {isSelected && !isOutOfStock && (
                        <CheckCircle2 className="w-4 h-4 text-violet-400 absolute top-2.5 right-2.5" />
                      )}
                      {isOutOfStock && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/50 absolute top-2.5 right-2.5">
                          Out of stock
                        </span>
                      )}
                      <div>
                        <div className="font-bold text-xs text-gray-200 line-clamp-1 pr-5">
                          {variant.name}
                        </div>
                        {variant.description && (
                          <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                            {variant.description}
                          </div>
                        )}
                      </div>
                      <div className="mt-3 pt-2 border-t border-[#242b3e]/60 flex items-baseline justify-between">
                        <span className="text-xs font-extrabold text-cyan-400">
                          {formatPoishaToBDT(variant.price_poisha)}
                        </span>
                        {variant.compare_at_price_poisha &&
                          variant.compare_at_price_poisha > variant.price_poisha && (
                            <span className="text-[10px] text-gray-500 line-through">
                              {formatPoishaToBDT(variant.compare_at_price_poisha)}
                            </span>
                          )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Step 2: Player, Server & Extra Fields */}
            {(product.requires_player_id ||
              product.requires_server_id ||
              (Array.isArray(product.custom_fields) && product.custom_fields.length > 0)) && (
              <div className="border-t border-[#242b3e] pt-4 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                    Account Verification Details
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-medium">Direct In-Game Delivery</span>
                </div>

                {/* Player UID Input */}
                {product.requires_player_id && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      {product.player_id_label || 'Player ID (UID)'} <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={playerId}
                      onChange={(e) => setPlayerId(e.target.value)}
                      placeholder={`Enter your ${product.player_id_label || 'Player ID / UID'}`}
                      className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                      required
                    />
                  </div>
                )}

                {/* Server / Region Input (Dropdown or Text) */}
                {product.requires_server_id && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                      {product.server_id_label || 'Server / Region'} <span className="text-rose-400">*</span>
                    </label>

                    {product.server_input_type === 'dropdown' &&
                    Array.isArray(product.server_options) &&
                    product.server_options.length > 0 ? (
                      <select
                        value={serverId}
                        onChange={(e) => setServerId(e.target.value)}
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none transition cursor-pointer"
                        required
                      >
                        <option value="" disabled>
                          -- Select Server / Region --
                        </option>
                        {product.server_options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={serverId}
                        onChange={(e) => setServerId(e.target.value)}
                        placeholder={`Enter ${product.server_id_label || 'Server / Region'}`}
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                        required
                      />
                    )}
                  </div>
                )}

                {/* Extra Configured Fields (e.g. Zone ID, Character ID) */}
                {Array.isArray(product.custom_fields) &&
                  product.custom_fields.map((field: CustomFieldConfig) => (
                    <div key={field.id}>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                        {field.label} {field.required && <span className="text-rose-400">*</span>}
                      </label>
                      <input
                        type={field.type || 'text'}
                        value={customFieldValues[field.id] || ''}
                        onChange={(e) =>
                          setCustomFieldValues((prev) => ({
                            ...prev,
                            [field.id]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3.5 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                        required={field.required}
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Step 3: Quantity Selector */}
            <div className="border-t border-[#242b3e] pt-4 mb-6 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300">Quantity</span>
              <div className="flex items-center border border-[#242b3e] rounded-lg bg-[#0d0f17]">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1 text-gray-400 hover:text-white transition"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold text-gray-200">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1 text-gray-400 hover:text-white transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Summary & Checkout Button */}
            <div className="border-t border-[#242b3e] pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Price:</span>
                <span className="text-xl font-extrabold text-cyan-400">
                  {selectedVariant
                    ? formatPoishaToBDT(selectedVariant.price_poisha * quantity)
                    : '৳0'}
                </span>
              </div>

              {(() => {
                const isOutOfStock = Boolean(!selectedVariant || !selectedVariant.in_stock || !selectedVariant.is_active)
                const isMissingPlayerId = Boolean(product.requires_player_id && !playerId.trim())
                const isMissingServerId = Boolean(product.requires_server_id && !serverId.trim())
                let isMissingCustomField = false
                let missingCustomFieldLabel = ''
                if (Array.isArray(product.custom_fields)) {
                  for (const f of product.custom_fields) {
                    if (f.required && !customFieldValues[f.id]?.trim()) {
                      isMissingCustomField = true
                      missingCustomFieldLabel = f.label
                      break
                    }
                  }
                }

                const isDisabled =
                  isOutOfStock ||
                  isMissingPlayerId ||
                  isMissingServerId ||
                  isMissingCustomField ||
                  activeVariants.length === 0

                let buttonLabel = 'Continue to Checkout'
                if (activeVariants.length === 0) {
                  buttonLabel = 'Unavailable'
                } else if (!selectedVariant) {
                  buttonLabel = 'Select a Package'
                } else if (isOutOfStock) {
                  buttonLabel = 'Package Out of Stock'
                } else if (isMissingPlayerId) {
                  buttonLabel = `Enter ${product.player_id_label || 'Player ID'}`
                } else if (isMissingServerId) {
                  buttonLabel = `Enter ${product.server_id_label || 'Server ID'}`
                } else if (isMissingCustomField) {
                  buttonLabel = `Enter ${missingCustomFieldLabel}`
                }

                return (
                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    disabled={isDisabled}
                    className="w-full py-3 px-4 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{buttonLabel}</span>
                  </button>
                )
              })()}

              <p className="text-[11px] text-center text-gray-500">
                Payment verified through official Bangladeshi MFS &amp; Bank Transfer
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout & Payment Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative my-8">
            {orderSuccess ? (
              /* Success / Verification Checkpoint State */
              <div className="py-4 space-y-4">
                <div className="text-center space-y-2">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
                    orderSuccess.status === 'completed'
                      ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-400'
                      : orderSuccess.status === 'cancelled'
                      ? 'bg-rose-950/80 border border-rose-500/50 text-rose-400'
                      : 'bg-amber-950/80 border border-amber-500/50 text-amber-400'
                  }`}>
                    {orderSuccess.status === 'completed' ? (
                      <CheckCircle2 className="w-8 h-8" />
                    ) : orderSuccess.status === 'cancelled' ? (
                      <AlertCircle className="w-8 h-8" />
                    ) : (
                      <Clock className="w-8 h-8 animate-pulse" />
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-white">
                      {orderSuccess.status === 'completed'
                        ? 'Order Completed & Delivered!'
                        : orderSuccess.status === 'processing'
                        ? 'Payment Verified — Order In Processing'
                        : orderSuccess.status === 'cancelled'
                        ? 'Order Cancelled'
                        : 'Order Queued & Awaiting Verification'}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Order Reference: <strong className="font-mono text-cyan-400">{orderSuccess.order_number}</strong>
                    </p>
                  </div>
                </div>

                {/* Progress Timeline Stepper */}
                <div className="p-4 rounded-xl bg-[#0d0f17] border border-[#242b3e] space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-300 border-b border-[#242b3e]/60 pb-2">
                    <span>Order Progress Tracker</span>
                    <button
                      type="button"
                      disabled={isCheckingLiveStatus}
                      onClick={() => checkLatestOrderStatus(orderSuccess.order_number)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1a1f30] hover:bg-[#252c45] text-[11px] text-cyan-300 border border-cyan-800/40 transition cursor-pointer disabled:opacity-50"
                      title="Check latest status"
                    >
                      <RefreshCw className={`w-3 h-3 ${isCheckingLiveStatus ? 'animate-spin' : ''}`} />
                      <span>{isCheckingLiveStatus ? 'Checking...' : 'Refresh Status'}</span>
                    </button>
                  </div>

                  {/* 3 Step Visual Progress */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                    {/* Step 1: Submission */}
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-emerald-500 w-full" />
                      <div className="font-bold text-emerald-400 flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Submitted
                      </div>
                      <div className="text-[10px] text-gray-500">TrxID Recorded</div>
                    </div>

                    {/* Step 2: Payment Verification */}
                    <div className="space-y-1">
                      <div className={`h-1.5 rounded-full w-full ${
                        orderSuccess.payment_status === 'completed' || orderSuccess.status === 'processing' || orderSuccess.status === 'completed'
                          ? 'bg-emerald-500'
                          : orderSuccess.payment_status === 'failed' || orderSuccess.status === 'cancelled'
                          ? 'bg-rose-500'
                          : 'bg-amber-500 animate-pulse'
                      }`} />
                      <div className={`font-bold flex items-center justify-center gap-1 ${
                        orderSuccess.payment_status === 'completed' || orderSuccess.status === 'processing' || orderSuccess.status === 'completed'
                          ? 'text-emerald-400'
                          : orderSuccess.payment_status === 'failed' || orderSuccess.status === 'cancelled'
                          ? 'text-rose-400'
                          : 'text-amber-300'
                      }`}>
                        {orderSuccess.payment_status === 'completed' || orderSuccess.status === 'processing' || orderSuccess.status === 'completed' ? (
                          <>
                            <Check className="w-3 h-3" /> Verified
                          </>
                        ) : orderSuccess.status === 'cancelled' ? (
                          'Rejected'
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Verifying
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {orderSuccess.payment_status === 'completed' || orderSuccess.status === 'processing' || orderSuccess.status === 'completed'
                          ? 'Admin Approved'
                          : 'Reviewing TrxID'}
                      </div>
                    </div>

                    {/* Step 3: Delivery */}
                    <div className="space-y-1">
                      <div className={`h-1.5 rounded-full w-full ${
                        orderSuccess.status === 'completed'
                          ? 'bg-emerald-500'
                          : orderSuccess.status === 'processing'
                          ? 'bg-cyan-500 animate-pulse'
                          : 'bg-[#242b3e]'
                      }`} />
                      <div className={`font-bold flex items-center justify-center gap-1 ${
                        orderSuccess.status === 'completed'
                          ? 'text-emerald-400'
                          : orderSuccess.status === 'processing'
                          ? 'text-cyan-300'
                          : 'text-gray-500'
                      }`}>
                        {orderSuccess.status === 'completed' ? (
                          <>
                            <Check className="w-3 h-3" /> Completed
                          </>
                        ) : orderSuccess.status === 'processing' ? (
                          'Delivering...'
                        ) : (
                          'Pending'
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500">UID Recharge</div>
                    </div>
                  </div>
                </div>

                {/* Details Summary Card */}
                <div className="p-4 rounded-xl bg-[#0d0f17] border border-[#242b3e] text-left space-y-2 text-xs">
                  <div className="flex justify-between pb-2 border-b border-[#242b3e]/60">
                    <span className="text-gray-400">Current Status:</span>
                    <span className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                      orderSuccess.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : orderSuccess.status === 'processing'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                        : orderSuccess.status === 'cancelled'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                        : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                    }`}>
                      {orderSuccess.status}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment Verification:</span>
                    <span className="font-semibold text-gray-200 capitalize">
                      {orderSuccess.payment_status === 'completed'
                        ? 'Verified & Approved'
                        : orderSuccess.payment_status === 'failed'
                        ? 'Payment Rejected'
                        : 'Pending Admin Verification'}
                    </span>
                  </div>

                  {orderSuccess.payment_method && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method:</span>
                      <span className="font-semibold text-white">{orderSuccess.payment_method}</span>
                    </div>
                  )}

                  {orderSuccess.transaction_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Submitted TrxID:</span>
                      <span className="font-mono text-emerald-400">{orderSuccess.transaction_id}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-400">Item:</span>
                    <span className="font-semibold text-gray-200">
                      {orderSuccess.product_name} &bull; {orderSuccess.variant_name} (x{orderSuccess.quantity})
                    </span>
                  </div>

                  {playerId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Player ID / UID:</span>
                      <span className="font-mono font-semibold text-cyan-400">{playerId}</span>
                    </div>
                  )}

                  {serverId && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Server / Region:</span>
                      <span className="font-mono font-semibold text-cyan-400">{serverId}</span>
                    </div>
                  )}

                  {/* Display any submitted custom fields */}
                  {Object.entries(customFieldValues).map(([key, val]) => {
                    const fieldDef = (product.custom_fields || []).find((f) => f.id === key)
                    return (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400">{fieldDef?.label || key}:</span>
                        <span className="font-mono font-semibold text-cyan-400">{val}</span>
                      </div>
                    )
                  })}

                  <div className="flex justify-between pt-2 border-t border-[#242b3e] text-sm">
                    <span className="font-bold text-gray-300">Total Amount:</span>
                    <span className="font-extrabold text-cyan-400">
                      {formatPoishaToBDT(orderSuccess.total_amount_poisha)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <Link
                    href={`/orders/${orderSuccess.order_number}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#1a1f30] hover:bg-[#252c45] border border-violet-800/40 text-violet-300 font-bold text-xs text-center transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Dedicated Order Tracker</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCheckoutOpen(false)
                      setOrderSuccess(null)
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs transition text-center cursor-pointer shadow-md shadow-violet-800/30"
                  >
                    Done & Return to Store
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleConfirmOrder} className="space-y-5">
                <div className="flex items-center justify-between border-b border-[#242b3e] pb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white">Complete Your Order</h3>
                    <p className="text-xs text-gray-400">
                      {product.name} &bull; {selectedVariant?.name} (x{quantity})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="text-gray-400 hover:text-white text-sm px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>{submitError}</div>
                  </div>
                )}

                {/* Customer Contact Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-violet-400" />
                    <span>Customer Information</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Your Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Shakib Ahmed"
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Email Address <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="receipt@example.com"
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Phone Number (WhatsApp for delivery notification)
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none transition"
                    />
                  </div>
                </div>

                {/* Dynamic Payment Method Selector */}
                <div className="space-y-3 border-t border-[#242b3e] pt-4">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Select Payment Method</span>
                  </h4>

                  {activePaymentMethods.length === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs">
                      No payment methods are currently active. Please contact support.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {activePaymentMethods.map((method) => {
                        const isSelected = selectedPaymentMethod?.id === method.id
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethodId(method.id)}
                            className={`p-2.5 rounded-xl border text-left transition ${
                              isSelected
                                ? 'border-violet-500 bg-violet-950/50 shadow-md shadow-violet-900/30'
                                : 'border-[#242b3e] bg-[#0d0f17] text-gray-400 hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-bold text-xs ${
                                  isSelected ? 'text-white' : 'text-gray-300'
                                }`}
                              >
                                {method.name}
                              </span>
                              {method.account_type && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e2438] text-gray-400">
                                  {method.account_type}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-500 block truncate mt-0.5">
                              {method.account_number}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Payment Instructions Box for Selected Method */}
                  {selectedPaymentMethod && (
                    <div className="p-4 rounded-xl bg-[#0d0f17] border border-[#242b3e] space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-gray-400 block text-[11px]">
                            {selectedPaymentMethod.name} ({selectedPaymentMethod.account_type || 'Account'}):
                          </span>
                          <span className="font-mono font-bold text-white text-sm">
                            {selectedPaymentMethod.account_number}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(selectedPaymentMethod.account_number)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#1e2438] hover:bg-[#28314e] text-gray-200 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                          title="Copy account number"
                        >
                          {hasCopiedNumber ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 text-[11px]">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px]">Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {selectedPaymentMethod.instructions && (
                        <p className="text-[11px] text-gray-300 leading-relaxed bg-[#151824] p-2.5 rounded-lg border border-[#242b3e]">
                          {selectedPaymentMethod.instructions}
                        </p>
                      )}

                      {selectedPaymentMethod.qr_code_url && (
                        <div className="pt-2 border-t border-[#242b3e]/60 flex items-center gap-3">
                          <img
                            src={selectedPaymentMethod.qr_code_url}
                            alt="Payment QR"
                            className="w-16 h-16 rounded-lg bg-white p-1 border border-gray-600 object-contain"
                          />
                          <div className="text-[11px] text-gray-400">
                            Scan this QR code in your payment app to transfer directly.
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-[#242b3e] text-xs">
                        <span className="font-semibold text-gray-300">Amount to Send:</span>
                        <span className="font-extrabold text-cyan-400 text-sm">
                          {selectedVariant
                            ? formatPoishaToBDT(selectedVariant.price_poisha * quantity)
                            : '৳0'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Sender Number & Transaction Reference */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Your Sender Number / Account
                      </label>
                      <input
                        type="text"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="e.g. 017xxxxxxxx or Bank A/C"
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        Transaction ID (TrxID) / Reference <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g. BL9A8X76"
                        className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none transition uppercase font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#242b3e] pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    disabled={isSubmitting}
                    className="w-1/3 py-2.5 px-3 rounded-xl border border-[#242b3e] text-xs text-gray-300 hover:bg-[#1a1f30] transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !transactionId.trim() ||
                      !customerEmail.trim() ||
                      !selectedPaymentMethod
                    }
                    className="w-2/3 py-2.5 px-4 rounded-xl font-bold text-white text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Confirm & Submit Order</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
