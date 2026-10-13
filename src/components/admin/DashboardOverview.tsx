import Link from 'next/link'
import type { DashboardMetrics } from '@/lib/data/admin'
import { formatPoishaToBDT } from '@/lib/currency'
import {
  Package,
  Layers,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

interface DashboardOverviewProps {
  metrics: DashboardMetrics
}

export function DashboardOverview({ metrics }: DashboardOverviewProps) {
  const cards = [
    {
      title: 'Total Products',
      value: metrics.totalProducts.toString(),
      subtext: `${metrics.activeProducts} Active, ${metrics.archivedProducts} Archived`,
      icon: Package,
      color: 'from-violet-600/20 to-violet-900/10 border-violet-800/40 text-violet-400',
      href: '/admin/products',
    },
    {
      title: 'Confirmed Sales',
      value: formatPoishaToBDT(metrics.confirmedSalesPoisha),
      subtext: 'Paid & fulfilled orders',
      icon: TrendingUp,
      color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-800/40 text-emerald-400',
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toString(),
      subtext: `${metrics.pendingOrders} awaiting fulfillment`,
      icon: ShoppingBag,
      color: 'from-cyan-600/20 to-cyan-900/10 border-cyan-800/40 text-cyan-400',
      href: '/admin/orders',
    },
    {
      title: 'Active Categories',
      value: metrics.totalCategories.toString(),
      subtext: 'Catalog classifications',
      icon: Layers,
      color: 'from-indigo-600/20 to-indigo-900/10 border-indigo-800/40 text-indigo-400',
      href: '/admin/categories',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Dev Mode Notice */}
      {!metrics.isUsingLiveDatabase && (
        <div className="p-4 bg-violet-950/40 border border-violet-800/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-violet-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-violet-900 text-white shrink-0">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
            </span>
            <div>
              <p className="font-bold text-white">Database Preview Mode Active</p>
              <p className="text-gray-300">
                Metrics calculated from initialized workspace seed data. Configure Supabase credentials to sync live customer orders and sales records.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon
          const CardContent = (
            <div
              className={`p-6 rounded-2xl bg-[#151824] border bg-gradient-to-br ${card.color} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="w-9 h-9 rounded-xl bg-[#0d0f17]/70 border border-[#242b3e] flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-3xl font-extrabold text-white tracking-tight">
                {card.value}
              </div>

              <p className="text-xs text-gray-400 mt-2 font-medium">
                {card.subtext}
              </p>
            </div>
          )

          return card.href ? (
            <Link key={card.title} href={card.href} className="block">
              {CardContent}
            </Link>
          ) : (
            <div key={card.title}>{CardContent}</div>
          )
        })}
      </div>

      {/* Quick Action Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Portal */}
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-violet-950 flex items-center justify-center text-violet-400 border border-violet-800/40 mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Product &amp; Package Inventory
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Create new digital products, modify in-game packages, adjust BDT poisha prices, update game artwork, and toggle active status.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#242b3e] flex items-center justify-between">
            <span className="text-xs text-cyan-400 font-mono">
              {metrics.totalProducts} registered products
            </span>
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-xl transition shadow-md shadow-violet-800/30"
            >
              <span>Manage Products</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Categories Portal */}
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800/40 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">
              Category Organization
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Add new gaming categories (Mobile, PC, Gift Cards, Subscriptions), reorder display priorities, and control storefront navigation.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-[#242b3e] flex items-center justify-between">
            <span className="text-xs text-cyan-400 font-mono">
              {metrics.totalCategories} active groups
            </span>
            <Link
              href="/admin/categories"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 px-4 py-2 rounded-xl transition shadow-md shadow-cyan-800/30"
            >
              <span>Manage Categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
