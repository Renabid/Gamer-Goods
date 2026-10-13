'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPoishaToBDT } from '@/lib/currency'
import type { AdminOrderWithDetails } from '@/lib/data/admin'
import type { Payment, OrderItem } from '@/types/database'
import {
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  Gamepad2,
  CreditCard,
  Loader2,
  RefreshCw,
} from 'lucide-react'

interface AdminOrderManagerProps {
  initialOrders: AdminOrderWithDetails[]
}

type OrderFilter = 'all' | 'pending' | 'processing' | 'completed' | 'cancelled'

export function AdminOrderManager({ initialOrders }: AdminOrderManagerProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<AdminOrderWithDetails[]>(initialOrders)
  const [filter, setFilter] = useState<OrderFilter>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    initialOrders.length > 0 ? initialOrders[0].id : null
  )
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: 'pending' | 'processing' | 'completed' | 'cancelled',
    paymentStatus?: 'initiated' | 'processing' | 'completed' | 'failed'
  ) => {
    setUpdatingOrderId(orderId)
    setActionMessage(null)

    try {
      const res = await fetch('/api/admin/orders/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          paymentStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update order status')
      }

      // Optimistically update state
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord.id !== orderId) return ord
          return {
            ...ord,
            status: newStatus,
            payments: (ord.payments || []).map((p: Payment) => ({
              ...p,
              status: paymentStatus || p.status,
            })),
          }
        })
      )

      setActionMessage({
        type: 'success',
        text: `Order status updated to "${newStatus.toUpperCase()}".`,
      })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status'
      setActionMessage({ type: 'error', text: msg })
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status === filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower) ||
      (order.customer_phone && order.customer_phone.toLowerCase().includes(searchLower)) ||
      (order.customer_name && order.customer_name.toLowerCase().includes(searchLower)) ||
      (order.payments || []).some((p: Payment) => p.transaction_id && p.transaction_id.toLowerCase().includes(searchLower)) ||
      (order.order_items || []).some((i: OrderItem) => i.player_id_value && i.player_id_value.toLowerCase().includes(searchLower))

    return matchesFilter && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
            <RefreshCw className="w-3 h-3 animate-spin" /> Processing
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/50">
            <Clock className="w-3 h-3" /> Pending Review
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/50">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700">
            {status}
          </span>
        )
    }
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const processingCount = orders.filter((o) => o.status === 'processing').length

  return (
    <div className="space-y-6">
      {/* Top Banner & Alert Feedback */}
      {actionMessage && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-gray-400 hover:text-white px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls: Search, Filters & Counters */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-grow max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order #, TrxID, Player UID, or Email..."
            className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none transition"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 border border-[#242b3e] p-1 rounded-xl bg-[#0d0f17]">
          {(
            [
              { id: 'pending', label: 'Pending', count: pendingCount },
              { id: 'processing', label: 'Processing', count: processingCount },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
              { id: 'all', label: 'All Orders', count: orders.length },
            ] as const
          ).map((tab) => {
            const isActive = filter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as OrderFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1f30]'
                }`}
              >
                <span>{tab.label}</span>
                {'count' in tab && tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-violet-900 text-violet-100' : 'bg-[#242b3e] text-gray-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No orders found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            {searchQuery
              ? 'No orders match your search criteria. Try a different query.'
              : `There are currently no orders with status "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id
            const payment = order.payments && order.payments[0]
            const isUpdating = updatingOrderId === order.id

            return (
              <div
                key={order.id}
                className={`bg-[#151824] border transition rounded-2xl overflow-hidden shadow-lg ${
                  order.status === 'pending'
                    ? 'border-amber-500/40 bg-gradient-to-r from-[#151824] to-[#1c1815]'
                    : 'border-[#242b3e]'
                }`}
              >
                {/* Header Summary Row */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#1a1f30]/60 transition"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-extrabold text-sm text-violet-400">
                      {order.order_number}
                    </span>
                    {getStatusBadge(order.status)}
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Total BDT</div>
                      <div className="text-sm font-extrabold text-cyan-400">
                        {formatPoishaToBDT(order.total_amount_poisha)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="text-gray-400 hover:text-white p-1 rounded-lg bg-[#0d0f17] border border-[#242b3e]"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Pane */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 border-t border-[#242b3e] bg-[#0d0f17]/80 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Column 1: Item & Delivery Details */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Gamepad2 className="w-4 h-4 text-violet-400" />
                          <span>Product & Player UID</span>
                        </h4>

                        <div className="p-4 rounded-xl bg-[#151824] border border-[#242b3e] space-y-2 text-xs">
                          {(order.order_items || []).map((it: OrderItem) => (
                            <div key={it.id} className="space-y-1.5 pb-2 border-b border-[#242b3e]/60 last:border-0 last:pb-0">
                              <div className="font-bold text-white text-sm">
                                {it.product_name}
                              </div>
                              <div className="text-gray-300">
                                Package: <span className="font-semibold text-violet-300">{it.variant_name}</span> (x{it.quantity})
                              </div>

                              {it.player_id_value && (
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-gray-400">Player ID / UID:</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-cyan-400 bg-[#0d0f17] px-2 py-0.5 rounded border border-cyan-800/40">
                                      {it.player_id_value}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(it.player_id_value!, 'uid')}
                                      className="p-1 rounded bg-[#242b3e] hover:text-white text-gray-300"
                                      title="Copy UID"
                                    >
                                      {copiedText === 'uid' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </div>
                              )}

                              {it.server_id_value && (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Zone / Server ID:</span>
                                  <span className="font-mono font-semibold text-cyan-300">
                                    {it.server_id_value}
                                  </span>
                                </div>
                              )}

                              {/* Custom Fields (e.g. Zone ID, Character ID) */}
                              {it.custom_fields && Object.keys(it.custom_fields).length > 0 && (
                                <div className="pt-1.5 border-t border-[#242b3e]/60 space-y-1">
                                  {Object.entries(it.custom_fields).map(([key, val]) => (
                                    <div key={key} className="flex items-center justify-between text-[11px]">
                                      <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                      <span className="font-mono font-semibold text-violet-300 bg-[#0d0f17] px-1.5 py-0.5 rounded border border-violet-800/30">
                                        {String(val)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Payment Verification (bKash/Nagad/Rocket/Custom) */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-cyan-400" />
                          <span>Payment Verification</span>
                        </h4>

                        <div className="p-4 rounded-xl bg-[#151824] border border-[#242b3e] space-y-2 text-xs">
                          {payment ? (
                            <>
                              <div className="flex justify-between items-center pb-2 border-b border-[#242b3e]/60">
                                <span className="text-gray-400">Method:</span>
                                <span className="font-bold text-xs uppercase text-white px-2 py-0.5 rounded bg-violet-950 border border-violet-800/50">
                                  {payment.payment_method}
                                </span>
                              </div>

                              {payment.account_details && (
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-400">Sent To Account:</span>
                                  <span className="font-mono text-gray-200">
                                    {payment.account_details}
                                  </span>
                                </div>
                              )}

                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Transaction ID (TrxID):</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-emerald-400 bg-[#0d0f17] px-2 py-0.5 rounded border border-emerald-800/40">
                                    {payment.transaction_id || 'N/A'}
                                  </span>
                                  {payment.transaction_id && (
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(payment.transaction_id!, 'trx')}
                                      className="p-1 rounded bg-[#242b3e] hover:text-white text-gray-300"
                                      title="Copy TrxID"
                                    >
                                      {copiedText === 'trx' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-gray-400">Sender Number:</span>
                                <span className="font-mono text-gray-200">
                                  {payment.sender_number || 'Not provided'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center">
                                <span className="text-gray-400">Payment Status:</span>
                                <span className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                                  payment.status === 'completed'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                                    : payment.status === 'failed'
                                    ? 'bg-rose-950/80 text-rose-300 border border-rose-800/50'
                                    : 'bg-amber-950/80 text-amber-300 border border-amber-800/50'
                                }`}>
                                  {payment.status === 'initiated' ? 'Pending Verification' : payment.status}
                                </span>
                              </div>

                              {payment.admin_verified_at && (
                                <div className="flex justify-between text-[11px] text-gray-400">
                                  <span>Reviewed At:</span>
                                  <span>{new Date(payment.admin_verified_at).toLocaleDateString()}</span>
                                </div>
                              )}

                              <div className="flex justify-between pt-1 border-t border-[#242b3e]/60 font-semibold">
                                <span className="text-gray-300">Amount Sent:</span>
                                <span className="font-extrabold text-cyan-400">
                                  {formatPoishaToBDT(payment.amount_poisha)}
                                </span>
                              </div>

                              {/* Quick Payment Verification Actions */}
                              {payment.status !== 'completed' && payment.status !== 'failed' && (
                                <div className="pt-2 border-t border-[#242b3e]/60 flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(order.id, 'processing', 'completed')}
                                    className="flex-1 py-1.5 rounded-lg text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow cursor-pointer text-center"
                                  >
                                    Verify Payment
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleUpdateStatus(order.id, 'cancelled', 'failed')}
                                    className="py-1.5 px-2.5 rounded-lg text-[11px] font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition cursor-pointer text-center"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-500 italic">No payment record attached.</p>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Customer Information */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-4 h-4 text-amber-400" />
                          <span>Customer Contact</span>
                        </h4>

                        <div className="p-4 rounded-xl bg-[#151824] border border-[#242b3e] space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Name:</span>
                            <span className="font-medium text-white">{order.customer_name || 'Guest'}</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-gray-400">Email:</span>
                            <span className="text-gray-200 font-mono text-[11px] truncate max-w-[160px]">
                              {order.customer_email}
                            </span>
                          </div>

                          {order.customer_phone && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Phone / WhatsApp:</span>
                              <span className="font-mono text-cyan-300">{order.customer_phone}</span>
                            </div>
                          )}

                          <div className="flex justify-between pt-1 border-t border-[#242b3e]/60">
                            <span className="text-gray-400">Customer Type:</span>
                            <span className="text-gray-400">
                              {order.user_id ? 'Registered Account' : 'Guest Checkout'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Controls: Change Status */}
                    <div className="pt-4 border-t border-[#242b3e] flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>Current Status:</span>
                        <strong className="text-white uppercase">{order.status}</strong>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status !== 'processing' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'processing', 'processing')}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/50 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                            <span>Mark Processing</span>
                          </button>
                        )}

                        {order.status !== 'completed' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'completed', 'completed')}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-md shadow-emerald-900/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            <span>Complete & Fulfilled</span>
                          </button>
                        )}

                        {order.status !== 'cancelled' && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(order.id, 'cancelled', 'failed')}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Cancel Order</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
