'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Zap,
  ShieldCheck,
  Database,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react'

interface NavbarProps {
  isUsingLiveDatabase: boolean
}

interface CustomerUser {
  id: string
  email: string
  fullName: string
  role: string
}

export function Navbar({ isUsingLiveDatabase }: NavbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<CustomerUser | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setMobileMenuOpen(false)
  }

  // Fetch current customer session on mount and route changes
  useEffect(() => {
    let ignore = false
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { user: null }))
      .then((data) => {
        if (!ignore) {
          setUser(data.user)
          setIsLoadingAuth(false)
        }
      })
      .catch(() => {
        if (!ignore) {
          setUser(null)
          setIsLoadingAuth(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [pathname])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      router.refresh()
    } catch {
      // Ignored
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#242b3e] bg-[#0d0f17]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Tagline */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform duration-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white flex items-center gap-1.5">
              GAMER<span className="text-violet-400">GOODS</span>
            </span>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-cyan-400 font-semibold -mt-1">
              Digital Reloads
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links & Customer Actions */}
        <div className="hidden md:flex items-center gap-3 lg:gap-4">
          <div
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isUsingLiveDatabase
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-violet-950/40 text-violet-300 border-violet-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span className="text-[11px]">
              {isUsingLiveDatabase ? 'Supabase Live' : 'Database Offline'}
            </span>
          </div>

          <div className="hidden lg:flex items-center text-xs text-gray-400 gap-1 bg-[#151824] px-3 py-1.5 rounded-md border border-[#242b3e]">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>BD Direct Delivery</span>
          </div>

          <Link
            href="/orders"
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#151824] hover:bg-[#1f2638] text-cyan-300 border border-cyan-800/40 px-3 py-1.5 rounded-md transition"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Track Order</span>
          </Link>

          {/* Customer Auth State */}
          {!isLoadingAuth && (
            user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold bg-[#1a1f30] text-gray-200 border border-[#242b3e] px-3 py-1.5 rounded-md max-w-[160px] truncate">
                  <User className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                  <span className="truncate">{user.fullName || user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  title="Sign Out"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-rose-400 bg-[#151824] hover:bg-rose-950/30 border border-[#242b3e] hover:border-rose-800/40 px-2.5 py-1.5 rounded-md transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-[#151824] transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-semibold text-violet-300 hover:text-white bg-violet-950/50 hover:bg-violet-900/60 border border-violet-800/50 px-3 py-1.5 rounded-md transition"
                >
                  Register
                </Link>
              </div>
            )
          )}

          <Link
            href="/#catalog"
            className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-1.5 rounded-md transition shadow-md shadow-violet-700/20 shrink-0"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Explore Products</span>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/orders"
            className="text-xs font-semibold text-cyan-400 bg-[#151824] border border-cyan-800/40 p-2 rounded-lg"
            title="Track Order"
          >
            <Search className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-300 hover:text-white bg-[#151824] border border-[#242b3e] focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#242b3e] bg-[#0d0f17]/98 px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-150 shadow-2xl">
          {/* User Account / Auth Section */}
          <div className="p-3.5 rounded-xl bg-[#151824] border border-[#242b3e]">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-violet-950 border border-violet-800/60 flex items-center justify-center text-violet-300">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {user.fullName || 'Valued Customer'}
                    </div>
                    <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/30 border border-rose-800/40 hover:bg-rose-900/50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 mb-2">Customer Account:</div>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    className="py-2.5 rounded-lg text-center text-xs font-bold text-gray-200 bg-[#0d0f17] border border-[#242b3e] hover:border-violet-500 transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="py-2.5 rounded-lg text-center text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 transition shadow"
                  >
                    Register
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <Link
              href="/orders"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#151824] border border-[#242b3e] text-xs font-semibold text-cyan-300 hover:bg-[#1a1f30] transition"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Track Order &amp; Payment Status</span>
              </div>
              <span className="text-gray-500">&rarr;</span>
            </Link>

            <Link
              href="/#catalog"
              className="w-full flex items-center justify-between p-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition shadow-lg shadow-violet-800/20"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Explore All Gaming Products</span>
              </div>
              <span className="text-violet-200">&rarr;</span>
            </Link>
          </div>

          {/* Info Status Badges */}
          <div className="pt-2 border-t border-[#242b3e]/60 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>BD Direct Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isUsingLiveDatabase ? 'Supabase Live' : 'Database Offline'}</span>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
