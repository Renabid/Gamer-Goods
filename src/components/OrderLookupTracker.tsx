'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2, Clock, CheckCircle2 } from 'lucide-react'

export function OrderLookupTracker() {
  const router = useRouter()
  const [orderQuery, setOrderQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = orderQuery.trim().toUpperCase()
    if (!clean) return
    setIsSearching(true)
    router.push(`/orders/${clean}`)
  }

  return (
    <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 sm:p-8 shadow-xl max-w-xl mx-auto">
      <div className="text-center space-y-2 mb-6">
        <div className="w-12 h-12 rounded-xl bg-violet-950/80 border border-violet-800/40 text-violet-400 flex items-center justify-center mx-auto">
          <Search className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Track Your Order &amp; Payment Status</h2>
        <p className="text-xs text-gray-400">
          Enter your order reference code (e.g. <span className="font-mono text-cyan-400">GG-2026-XXXXX</span>) to see if transaction verification is done and your delivery is processing or completed.
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
              className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-gray-600 focus:outline-none transition uppercase tracking-wide"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSearching || !orderQuery.trim()}
          className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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

      <div className="mt-6 pt-6 border-t border-[#242b3e]/60 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-400">
        <div className="space-y-1">
          <Clock className="w-4 h-4 text-amber-400 mx-auto" />
          <div className="font-semibold text-gray-300">1. Verification</div>
          <div>TrxID review</div>
        </div>
        <div className="space-y-1">
          <Loader2 className="w-4 h-4 text-cyan-400 mx-auto" />
          <div className="font-semibold text-gray-300">2. Processing</div>
          <div>Game delivery</div>
        </div>
        <div className="space-y-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
          <div className="font-semibold text-gray-300">3. Completed</div>
          <div>Ready &amp; credited</div>
        </div>
      </div>
    </div>
  )
}
