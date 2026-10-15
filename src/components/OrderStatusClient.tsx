'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatPoishaToBDT } from '@/lib/currency'
import {
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Gamepad2,
  Check,
  AlertCircle,
  Loader2,
  Copy,
} from 'lucide-react'

interface OrderDetails {
  order_number: string
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed'
  total_amount_poisha: number
  created_at: string
  customer_email: string | null
  items: Array<{
    id: string
    product_name: string
    variant_name: string
    quantity: number
    player_id_value: string | null
    server_id_value: string | null
    custom_fields: Record<string, string> | null
    unit_price_poisha: number
    digital_code_delivered: string | null
  }>
  payment: {
    payment_method: string
    status: 'initiated' | 'processing' | 'completed' | 'failed' | 'refunded'
    transaction_id: string | null
    sender_number: string | null
    account_details: string | null
    admin_verified_at: string | null
  } | null
}

export function OrderStatusClient({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  const fetchOrder = async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    try {
      const res = await fetch(`/api/orders/${orderNumber}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Unable to retrieve order details')
      }
      setOrder(data.order)
      setError(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error fetching order'
      setError(msg)
    } finally {
      setIsLoading(false)
      if (isManualRefresh) setIsRefreshing(false)
    }
  }

  useEffect(() => {
    let ignore = false

    async function loadData() {
      try {
        const res = await fetch(`/api/orders/${orderNumber}`, { cache: 'no-store' })
        const data = await res.json()
        if (ignore) return
        if (!res.ok) {
          throw new Error(data.error || 'Unable to retrieve order details')
        }
        setOrder(data.order)
        setError(null)
      } catch (err) {
        if (!ignore) {
          const msg = err instanceof Error ? err.message : 'Error fetching order'
          setError(msg)
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    // Auto-poll every 12 seconds so customer sees real-time admin status updates
    const interval = setInterval(() => {
      loadData()
    }, 12000)

    return () => {
      ignore = true
      clearInterval(interval)
    }
  }, [orderNumber])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500 mx-auto" />
        <h3 className="text-lg font-bold text-white">Loading Order Status...</h3>
        <p className="text-xs text-gray-400 font-mono">{orderNumber}</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-5 bg-[#151824] border border-[#242b3e] rounded-2xl p-8">
        <div className="w-14 h-14 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Order Not Found</h3>
          <p className="text-xs text-gray-400 mt-1">{error || `We could not locate order "${orderNumber}".`}</p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/orders"
            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition"
          >
            Search Again
          </Link>
          <Link
            href="/"
            className="w-full py-2.5 rounded-xl bg-[#0d0f17] border border-[#242b3e] text-gray-300 hover:text-white font-semibold text-xs transition"
          >
            Return to Storefront
          </Link>
        </div>
      </div>
    )
  }

  const isPaymentVerified =
    order.payment?.status === 'completed' || order.status === 'processing' || order.status === 'completed'
  const isPaymentFailed = order.payment?.status === 'failed' || order.status === 'cancelled'
  const isOrderCompleted = order.status === 'completed'
  const isOrderProcessing = order.status === 'processing'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header breadcrumb & refresh */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-violet-400 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Store</span>
        </Link>

        <button
          type="button"
          disabled={isRefreshing}
          onClick={() => fetchOrder(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151824] hover:bg-[#1a1f30] border border-[#242b3e] text-xs font-semibold text-cyan-300 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Checking...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-[#242b3e] pb-6">
          <div className="text-center sm:text-left">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Order Reference
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-mono tracking-tight">
              {order.order_number}
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Placed on {new Date(order.created_at).toLocaleString()}
            </p>
          </div>

          <div className="flex flex-col items-center sm:items-end gap-1.5">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Overall Status</span>
            <div className={`px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
              isOrderCompleted
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80 shadow-lg shadow-emerald-950/50'
                : isOrderProcessing
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/80 shadow-lg shadow-cyan-950/50'
                : isPaymentFailed
                ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                : 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-lg shadow-amber-950/50'
            }`}>
              {isOrderCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Delivered &amp; Completed
                </>
              ) : isOrderProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> In Processing
                </>
              ) : isPaymentFailed ? (
                <>
                  <XCircle className="w-4 h-4" /> Cancelled / Rejected
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4 animate-pulse" /> Pending Verification
                </>
              )}
            </div>
          </div>
        </div>

        {/* 3-Stage Visual Pipeline */}
        <div className="py-6 border-b border-[#242b3e]">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-4">
            Live Order Checkpoint Pipeline
          </h3>

          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
            {/* Step 1: Placed */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-xs font-bold">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-white leading-tight">1. Order Placed</div>
                <div className="text-[9px] sm:text-[11px] text-emerald-400 font-medium">TrxID Submitted</div>
              </div>
            </div>

            {/* Step 2: Payment Verification */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                isPaymentVerified
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isPaymentFailed
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
              }`}>
                {isPaymentVerified ? (
                  <Check className="w-4 h-4" />
                ) : isPaymentFailed ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-white leading-tight">2. Verification</div>
                <div className={`text-[9px] sm:text-[11px] font-semibold ${
                  isPaymentVerified
                    ? 'text-emerald-400'
                    : isPaymentFailed
                    ? 'text-rose-400'
                    : 'text-amber-300'
                }`}>
                  {isPaymentVerified ? 'Approved' : isPaymentFailed ? 'Rejected' : 'In Review'}
                </div>
              </div>
            </div>

            {/* Step 3: Fulfillment */}
            <div className="space-y-1.5 sm:space-y-2">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                isOrderCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isOrderProcessing
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                  : 'bg-[#242b3e] text-gray-500 border border-gray-700'
              }`}>
                {isOrderCompleted ? (
                  <Check className="w-4 h-4" />
                ) : isOrderProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <span>3</span>
                )}
              </div>
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-white leading-tight">3. Game Delivery</div>
                <div className={`text-[9px] sm:text-[11px] font-semibold ${
                  isOrderCompleted
                    ? 'text-emerald-400'
                    : isOrderProcessing
                    ? 'text-cyan-300'
                    : 'text-gray-500'
                }`}>
                  {isOrderCompleted ? 'Delivered' : isOrderProcessing ? 'Crediting...' : 'Waiting'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status Explainer Box */}
        <div className="mt-6 p-4 rounded-xl bg-[#0d0f17] border border-[#242b3e] flex items-start gap-3">
          <div className="mt-0.5">
            {isOrderCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : isOrderProcessing ? (
              <RefreshCw className="w-5 h-5 text-cyan-400 shrink-0 animate-spin" />
            ) : isPaymentFailed ? (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            )}
          </div>
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-white">
              {isOrderCompleted
                ? 'Delivery Complete!'
                : isOrderProcessing
                ? 'Payment is verified! Your items are being credited.'
                : isPaymentFailed
                ? 'Payment was rejected or order was cancelled.'
                : 'Payment Verification in Progress'}
            </h4>
            <p className="text-gray-400 leading-relaxed">
              {isOrderCompleted
                ? 'Your reload or digital code has been delivered. Please open your game account to confirm your new balance.'
                : isOrderProcessing
                ? 'The admin team verified your transaction ID. The order is now in processing and will be delivered shortly (typical delivery: 5-15 mins).'
                : isPaymentFailed
                ? 'The submitted transaction ID could not be matched with incoming funds. Please contact customer support with your correct statement.'
                : 'Your transaction reference has been logged. Our payment team is cross-checking your bKash/Nagad/Bank statement. This page auto-refreshes every 12 seconds.'}
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid: Payment & Delivery Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Verification Record */}
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span>Transaction Verification Details</span>
          </h3>

          <div className="space-y-3 text-xs">
            {order.payment ? (
              <>
                <div className="flex justify-between py-1.5 border-b border-[#242b3e]/60">
                  <span className="text-gray-400">Payment Verification:</span>
                  <span className={`font-bold capitalize px-2 py-0.5 rounded text-[11px] ${
                    isPaymentVerified
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                      : isPaymentFailed
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                      : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                  }`}>
                    {order.payment.status === 'initiated' ? 'Pending Review' : order.payment.status}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#242b3e]/60">
                  <span className="text-gray-400">Payment Method:</span>
                  <span className="font-semibold text-white uppercase">{order.payment.payment_method}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#242b3e]/60">
                  <span className="text-gray-400">Submitted TrxID / Ref:</span>
                  <span className="font-mono font-bold text-emerald-400 bg-[#0d0f17] px-2 py-0.5 rounded border border-emerald-800/40">
                    {order.payment.transaction_id || 'N/A'}
                  </span>
                </div>

                {order.payment.sender_number && (
                  <div className="flex justify-between py-1.5 border-b border-[#242b3e]/60">
                    <span className="text-gray-400">Sender Account:</span>
                    <span className="font-mono text-gray-200">{order.payment.sender_number}</span>
                  </div>
                )}

                {order.payment.admin_verified_at && (
                  <div className="flex justify-between py-1.5 border-b border-[#242b3e]/60">
                    <span className="text-gray-400">Verified Timestamp:</span>
                    <span className="text-gray-300">
                      {new Date(order.payment.admin_verified_at).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-2 text-sm font-bold">
                  <span className="text-gray-300">Total Paid:</span>
                  <span className="font-extrabold text-cyan-400">
                    {formatPoishaToBDT(order.total_amount_poisha)}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 italic">No payment record attached to this order.</p>
            )}
          </div>
        </div>

        {/* Target Game Items & Destination */}
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-violet-400" />
            <span>Target Game &amp; Player ID</span>
          </h3>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-[#0d0f17] border border-[#242b3e] space-y-2 text-xs">
                <div className="font-bold text-white text-sm">
                  {item.product_name}
                </div>
                <div className="text-gray-300">
                  Package: <span className="font-semibold text-violet-300">{item.variant_name}</span> (x{item.quantity})
                </div>

                {item.player_id_value && (
                  <div className="flex justify-between pt-1">
                    <span className="text-gray-400">Player ID / UID:</span>
                    <span className="font-mono font-bold text-cyan-400 bg-[#151824] px-2 py-0.5 rounded border border-cyan-800/40">
                      {item.player_id_value}
                    </span>
                  </div>
                )}

                {item.server_id_value && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Server / Region:</span>
                    <span className="font-mono font-semibold text-cyan-300">{item.server_id_value}</span>
                  </div>
                )}

                {item.custom_fields && Object.keys(item.custom_fields).length > 0 && (
                  <div className="pt-1.5 border-t border-[#242b3e]/60 space-y-1">
                    {Object.entries(item.custom_fields).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px]">
                        <span className="text-gray-400 capitalize">{k.replace(/_/g, ' ')}:</span>
                        <span className="font-mono text-violet-300">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Digital code delivery if applicable */}
                {item.digital_code_delivered && (
                  <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                      Delivered Redeem Code:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-extrabold text-white text-sm">
                        {item.digital_code_delivered}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.digital_code_delivered!)}
                        className="p-1 rounded bg-[#151824] hover:bg-[#1a1f30] text-gray-300 hover:text-white"
                        title="Copy code"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Return Action */}
      <div className="text-center pt-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs transition shadow-lg shadow-violet-800/30"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Explore More Products</span>
        </Link>
      </div>
    </div>
  )
}
