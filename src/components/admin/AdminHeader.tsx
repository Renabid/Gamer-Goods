'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Layers,
  LogOut,
  ExternalLink,
  Zap,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
} from 'lucide-react'

interface AdminHeaderProps {
  userEmail?: string
  isUsingLiveDatabase: boolean
}

export function AdminHeader({ userEmail, isUsingLiveDatabase }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' })
      router.push('/admin/login')
      router.refresh()
    } catch {
      router.push('/admin/login')
    }
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Products & Packages', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: Layers },
    { label: 'Payment Settings', href: '/admin/payments', icon: CreditCard },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#242b3e] bg-[#0d0f17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-violet-600/30">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                  GAMER<span className="text-violet-400">GOODS</span>
                </span>
                <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono font-bold">
                  Admin Portal
                </span>
              </div>
            </Link>

            {/* Main Admin Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isActive
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-700/30'
                        : 'text-gray-400 hover:text-white hover:bg-[#151824]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User Status & Actions */}
          <div className="flex items-center gap-3">
            <div
              className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-mono ${
                isUsingLiveDatabase
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                  : 'bg-violet-950/40 text-violet-300 border-violet-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isUsingLiveDatabase ? 'Supabase Connected' : 'Local Seed Mode'}</span>
            </div>

            {userEmail && (
              <span className="hidden lg:inline text-xs font-mono text-gray-400 bg-[#151824] px-2.5 py-1 rounded-md border border-[#242b3e]">
                {userEmail}
              </span>
            )}

            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-violet-400 px-2.5 py-1 rounded-md hover:bg-[#151824] transition"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1 rounded-md border border-rose-900/40 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center gap-2 py-2.5 border-t border-[#242b3e]/60 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white bg-[#151824]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </header>
  )
}
