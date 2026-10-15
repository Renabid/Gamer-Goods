'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Loader2, Clock, CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react'
import { formatPoishaToBDT } from '@/lib/currency'

interface CustomerOrderSummary {
  id: string
  order_number: string
  status: string
  total_amount_poisha: number
  created_at: string
  order_items: Array<{
    id: string
    product_name: string
    variant_name: string
    quantity: number
  }>
  payments: Array<{
    status: string
    payment_method: string
    transaction_id: string | null
  }>
}

export function OrderLookupTracker() {
  const router = useRouter()
  const [orderQuery, setOrderQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [myOrders, setMyOrders] = useState<CustomerOrderSummary[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = useState(true)

  useEffect(() => {
    let ignore = false
    async function loadMyOrders() {
      try {
        const res = await fetch('/api/customer/orders')
        if (res.ok) {
          const data = await res.json()
          if (!ignore && data.orders && data.orders.length > 0) {
            setMyOrders(data.orders)
          }
        }
      } catch {
        // Ignored
      } finally {
        if (!ignore) setIsLoadingOrders(false)
      }
    }
    loadMyOrders()
    return () => {
      ignore = true
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = orderQuery.trim().toUpperCase()
    if (!clean) return
    setIsSearching(true)
    router.push(`/orders/${clean}`)
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto w-full">
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-5 sm:p-8 shadow-xl">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">Track Order &amp; Payment Status</h2>
          <p className="text-xs text-gray-400">
            Enter your order reference code (e.g.{' '}
            <span className="font-mono text-cyan-400">GG-2026-XXXXX</span>) to see if transaction
            verification is complete and your delivery is processing or completed.
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label htmlFor="order-number-input" className="block text-xs font-semibold text-gray-300 mb-1.5">
              Order Reference Code
            </label>
            <div className="relative">
              <input
                id="order-number-input"
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="e.g. GG-2026-ABC1234"
                className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-mono text-white placeholder-gray-600 focus:outline-none transition uppercase tracking-wide"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSearching || !orderQuery.trim()}
            className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Looking up order...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Check Verification &amp; Order Status</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#242b3e]/60 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400">
          <div className="space-y-1">
            <Clock className="w-4 h-4 text-amber-400 mx-auto" />
            <div className="font-semibold text-gray-300">1. Verification</div>
            <div className="truncate">TrxID review</div>
          </div>
          <div className="space-y-1">
            <Loader2 className="w-4 h-4 text-cyan-400 mx-auto" />
            <div className="font-semibold text-gray-300">2. Processing</div>
            <div className="truncate">Game delivery</div>
          </div>
          <div className="space-y-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
            <div className="font-semibold text-gray-300">3. Completed</div>
            <div className="truncate">Ready &amp; credited</div>
          </div>
        </div>
      </div>

      {/* If customer has past orders, display quick access list */}
      {!isLoadingOrders && myOrders.length > 0 && (
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-5 sm:p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-[#242b3e]/60">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-violet-400" />
              <span>Your Recent Orders</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-mono">
              {myOrders.length} {myOrders.length === 1 ? 'order' : 'orders'} found
            </span>
          </div>

          <div className="space-y-2">
            {myOrders.map((ord) => {
              const firstItem = ord.order_items?.[0]
              const payment = ord.payments?.[0]

              return (
                <Link
                  key={ord.id}
                  href={`/orders/${ord.order_number}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#0d0f17] hover:bg-[#1a1f30] border border-[#242b3e] transition group"
                >
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-violet-300">
                        {ord.order_number}
                      </span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                          ord.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : ord.status === 'processing'
                            ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                            : ord.status === 'cancelled'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-400 truncate">
                      {firstItem ? `${firstItem.product_name} - ${firstItem.variant_name}` : 'Gaming Package'}
                    </div>

                    <div className="text-[10px] text-gray-500 font-mono">
                      {new Date(ord.created_at).toLocaleDateString()} &bull;{' '}
                      {formatPoishaToBDT(ord.total_amount_poisha)}
                      {payment?.transaction_id && ` • TrxID: ${payment.transaction_id}`}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
