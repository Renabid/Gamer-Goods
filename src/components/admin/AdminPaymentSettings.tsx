'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { PaymentMethod } from '@/types/database'
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Smartphone,
  Building2,
  Settings2,
  X,
  ExternalLink,
} from 'lucide-react'

interface AdminPaymentSettingsProps {
  initialMethods: PaymentMethod[]
  isUsingLiveDatabase: boolean
}

export function AdminPaymentSettings({
  initialMethods,
  isUsingLiveDatabase,
}: AdminPaymentSettingsProps) {
  const router = useRouter()
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form State
  const [form, setForm] = useState({
    name: '',
    slug: '',
    payment_type: 'mfs' as 'mfs' | 'bank_transfer' | 'custom',
    account_number: '',
    account_type: 'Personal' as 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other',
    instructions: '',
    qr_code_url: '',
    is_active: true,
    display_order: 1,
  })

  const openCreateModal = () => {
    setEditingMethod(null)
    setForm({
      name: '',
      slug: '',
      payment_type: 'mfs',
      account_number: '',
      account_type: 'Personal',
      instructions: '',
      qr_code_url: '',
      is_active: true,
      display_order: methods.length + 1,
    })
    setMessage(null)
    setIsModalOpen(true)
  }

  const openEditModal = (method: PaymentMethod) => {
    setEditingMethod(method)
    setForm({
      name: method.name,
      slug: method.slug,
      payment_type: method.payment_type,
      account_number: method.account_number,
      account_type: (method.account_type || 'Personal') as 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other',
      instructions: method.instructions || '',
      qr_code_url: method.qr_code_url || '',
      is_active: method.is_active,
      display_order: method.display_order,
    })
    setMessage(null)
    setIsModalOpen(true)
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.account_number) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const url = '/api/admin/payment-methods'
      const method = editingMethod ? 'PUT' : 'POST'
      const payload = editingMethod ? { id: editingMethod.id, ...form } : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save payment method')
      }

      if (editingMethod) {
        setMethods((prev) =>
          prev.map((m) => (m.id === editingMethod.id ? data.paymentMethod : m))
        )
        setMessage({ type: 'success', text: `Payment method "${form.name}" updated successfully.` })
      } else {
        setMethods((prev) => [...prev, data.paymentMethod].sort((a, b) => a.display_order - b.display_order))
        setMessage({ type: 'success', text: `Payment method "${form.name}" created successfully.` })
      }

      setIsModalOpen(false)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed'
      setMessage({ type: 'error', text: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (method: PaymentMethod) => {
    if (!confirm(`Are you sure you want to delete payment method "${method.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/payment-methods?id=${method.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete payment method')

      setMethods((prev) => prev.filter((m) => m.id !== method.id))
      setMessage({ type: 'success', text: `Payment method "${method.name}" removed.` })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setMessage({ type: 'error', text: msg })
    }
  }

  const handleToggleActive = async (method: PaymentMethod) => {
    try {
      const updated = !method.is_active
      const res = await fetch('/api/admin/payment-methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...method,
          is_active: updated,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }

      setMethods((prev) =>
        prev.map((m) => (m.id === method.id ? { ...m, is_active: updated } : m))
      )
      setMessage({
        type: 'success',
        text: `Method "${method.name}" is now ${updated ? 'ENABLED' : 'DISABLED'}.`,
      })
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status toggle failed'
      setMessage({ type: 'error', text: msg })
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Payment Settings</h1>
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
            Configure bKash, Nagad, Rocket, Bank accounts, wallet numbers, and customer instructions.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs transition shadow-md shadow-violet-800/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs ${
            message.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/50 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-800/50 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-gray-400 hover:text-white px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Methods Table */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0d0f17] border-b border-[#242b3e] uppercase text-[10px] text-gray-400 font-mono tracking-wider">
              <tr>
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Type &amp; Account</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242b3e]">
              {methods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No payment methods configured yet.
                  </td>
                </tr>
              ) : (
                methods.map((method) => {
                  return (
                    <tr key={method.id} className="hover:bg-[#1a1f30]/40 transition">
                      <td className="py-3 px-4 font-mono text-gray-500 font-bold">
                        #{method.display_order}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-cyan-400">
                            {method.payment_type === 'bank_transfer' ? (
                              <Building2 className="w-4 h-4" />
                            ) : method.payment_type === 'mfs' ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-sm block">
                              {method.name}
                            </span>
                            <span className="text-[10px] text-gray-500 font-mono">
                              {method.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-gray-200 block capitalize">
                            {method.payment_type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] px-2 py-0.2 rounded bg-[#0d0f17] border border-[#242b3e] text-violet-300 font-medium inline-block">
                            {method.account_type || 'Personal'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-gray-200">
                          <span>{method.account_number}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(method.account_number, method.id)}
                            className="p-1 rounded bg-[#0d0f17] hover:text-white text-gray-400"
                            title="Copy number"
                          >
                            {copiedId === method.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(method)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition cursor-pointer ${
                            method.is_active
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/60'
                              : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                          }`}
                        >
                          {method.is_active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Enabled
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Disabled
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => openEditModal(method)}
                            className="p-1.5 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-violet-400 transition"
                            title="Edit method"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(method)}
                            className="p-1.5 rounded-lg bg-[#0d0f17] border border-rose-900/40 text-rose-400 hover:text-rose-300 transition"
                            title="Delete method"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog: Add / Edit Payment Method */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl max-w-xl w-full shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header (Sticky) */}
            <div className="px-6 py-4 border-b border-[#242b3e] flex items-center justify-between shrink-0 bg-[#151824]/95">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span>{editingMethod ? `Edit: ${editingMethod.name}` : 'Configure New Payment Method'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1f30] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Display Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                        slug: prev.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      }))
                    }
                    placeholder="e.g. bKash Personal, City Bank"
                    required
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Slug Identifier
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. bkash-personal"
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Payment Type</label>
                  <select
                    value={form.payment_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        payment_type: e.target.value as 'mfs' | 'bank_transfer' | 'custom',
                      }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  >
                    <option value="mfs">Mobile Financial Service (MFS)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="custom">Custom Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Account Type</label>
                  <select
                    value={form.account_type}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        account_type: e.target.value as 'Personal' | 'Merchant' | 'Agent' | 'Bank Account' | 'Other',
                      }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  >
                    <option value="Personal">Personal</option>
                    <option value="Merchant">Merchant</option>
                    <option value="Agent">Agent</option>
                    <option value="Bank Account">Bank Account</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, display_order: Number(e.target.value) }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Account Number / Wallet Details <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, account_number: e.target.value }))}
                  placeholder="e.g. 01712-345678 or Account: 123456789, Branch: Gulshan"
                  required
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Customer Transfer Instructions
                </label>
                <textarea
                  rows={3}
                  value={form.instructions}
                  onChange={(e) => setForm((prev) => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions displayed on checkout (e.g. Dial *247# > Send Money to the number above > Enter exact amount > Copy TrxID)."
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Optional QR Code Image URL
                </label>
                <input
                  type="text"
                  value={form.qr_code_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, qr_code_url: e.target.value }))}
                  placeholder="https://... or /images/qr/bkash.png"
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="method_active"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600"
                />
                <label htmlFor="method_active" className="font-semibold text-gray-200 cursor-pointer">
                  Enable on customer checkout
                </label>
              </div>
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="px-6 py-4 border-t border-[#242b3e] flex gap-3 shrink-0 bg-[#151824]/95">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="w-1/3 py-2 px-3 rounded-xl border border-[#242b3e] text-gray-300 hover:bg-[#1a1f30] font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !form.name || !form.account_number}
                className="w-2/3 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-md shadow-violet-800/30"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingMethod ? 'Save Changes' : 'Create Payment Method'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  )
}
