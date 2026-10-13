'use client'

import { useState } from 'react'
import type { Category } from '@/types/database'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react'

interface AdminCategoryManagerProps {
  initialCategories: Category[]
  isUsingLiveDatabase: boolean
}

export function AdminCategoryManager({
  initialCategories,
  isUsingLiveDatabase,
}: AdminCategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon_name: 'Gamepad2',
    display_order: 0,
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon_name: 'Gamepad2',
      display_order: categories.length + 1,
      is_active: true,
    })
    setIsModalOpen(true)
  }

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon_name: cat.icon_name || 'Gamepad2',
      display_order: cat.display_order,
      is_active: cat.is_active,
    })
    setIsModalOpen(true)
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate slug if in create mode
      slug: !editingCategory
        ? name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : prev.slug,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      const isEdit = Boolean(editingCategory)
      const url = '/api/admin/categories'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isEdit ? { id: editingCategory!.id, ...formData } : formData
        ),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save category')

      if (isEdit) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory!.id ? { ...c, ...formData } : c))
        )
        setStatusMessage({
          type: 'success',
          text: `Category "${formData.name}" updated successfully.`,
        })
      } else {
        const newCat: Category = data.category || {
          id: `c-${Date.now()}`,
          ...formData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setCategories((prev) => [...prev, newCat])
        setStatusMessage({
          type: 'success',
          text: `Category "${formData.name}" created successfully.`,
        })
      }

      setIsModalOpen(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (cat: Category) => {
    try {
      const updatedStatus = !cat.is_active
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cat,
          is_active: updatedStatus,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: updatedStatus } : c))
      )
      setStatusMessage({
        type: 'success',
        text: `Category "${cat.name}" is now ${updatedStatus ? 'active' : 'hidden'}.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed'
      setStatusMessage({ type: 'error', text: msg })
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"? Products under this category will become unassigned.`)) {
      return
    }

    setDeletingId(id)
    setStatusMessage(null)

    try {
      const res = await fetch(`/api/admin/categories?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete category')

      setCategories((prev) => prev.filter((c) => c.id !== id))
      setStatusMessage({
        type: 'success',
        text: `Category "${name}" deleted successfully.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed'
      setStatusMessage({ type: 'error', text: msg })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white">Categories</h1>
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
            Organize products and control navigation ordering.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white text-xs transition shadow-md shadow-violet-800/30 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {!isUsingLiveDatabase && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Database connection not configured (Local Seed Mode)
            </p>
            <p className="text-gray-400 leading-relaxed">
              To persist categories in your live Supabase database, configure <code className="text-violet-300 bg-[#0d0f17] px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="text-violet-300 bg-[#0d0f17] px-1.5 py-0.5 rounded font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and <code className="text-violet-300 bg-[#0d0f17] px-1.5 py-0.5 rounded font-mono">SUPABASE_SERVICE_ROLE_KEY</code> in <code className="text-cyan-300 bg-[#0d0f17] px-1.5 py-0.5 rounded font-mono">.env.local</code>.
            </p>
          </div>
        </div>
      )}

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

      {/* Category List Table */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0d0f17] border-b border-[#242b3e] text-gray-400 uppercase font-mono text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Category Name</th>
                <th className="py-3.5 px-4">Slug</th>
                <th className="py-3.5 px-4">Icon</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242b3e]/60">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-[#1a1f30] transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-400">
                    #{cat.display_order}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-white">
                    {cat.name}
                    {cat.description && (
                      <span className="block text-[11px] text-gray-400 font-normal truncate max-w-xs mt-0.5">
                        {cat.description}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-cyan-400">
                    {cat.slug}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-violet-300">
                    {cat.icon_name || 'Gamepad2'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        cat.is_active
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                          : 'bg-gray-800 text-gray-400 border border-gray-700'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleToggleActive(cat)}
                        title={cat.is_active ? 'Hide category' : 'Show category'}
                        className="p-1.5 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-white transition"
                      >
                        {cat.is_active ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(cat)}
                        title="Edit category"
                        className="p-1.5 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-400 hover:text-violet-400 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        disabled={deletingId === cat.id}
                        title="Delete category"
                        className="p-1.5 rounded-lg bg-[#0d0f17] border border-rose-900/40 text-rose-400 hover:text-rose-300 transition disabled:opacity-50"
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151824] border border-[#242b3e] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a1f30]"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Mobile Games Top-Up"
                  required
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  URL Slug <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="e.g. mobile-games"
                  required
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Brief description for customers"
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Icon Identifier
                  </label>
                  <select
                    value={formData.icon_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, icon_name: e.target.value }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none"
                  >
                    <option value="Gamepad2">Gamepad2 (Mobile/Console)</option>
                    <option value="Monitor">Monitor (PC)</option>
                    <option value="Gift">Gift (Gift Cards)</option>
                    <option value="Sparkles">Sparkles (Subscriptions)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        display_order: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-lg px-3 py-2 text-gray-200 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active_cat"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="rounded border-[#242b3e] bg-[#0d0f17] text-violet-600 focus:ring-0"
                />
                <label htmlFor="is_active_cat" className="text-gray-300 cursor-pointer">
                  Visible on Storefront (Active)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#242b3e]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#0d0f17] border border-[#242b3e] text-gray-300 hover:text-white font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold transition shadow-md shadow-violet-800/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
