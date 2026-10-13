import Link from 'next/link'
import { ShieldCheck, Zap, Database, ShoppingBag } from 'lucide-react'

interface NavbarProps {
  isUsingLiveDatabase: boolean
}

export function Navbar({ isUsingLiveDatabase }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#242b3e] bg-[#0d0f17]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform duration-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
              GAMER<span className="text-violet-400">GOODS</span>
            </span>
            <span className="text-[10px] uppercase tracking-widest text-cyan-400 font-semibold -mt-1">
              Digital Reloads
            </span>
          </div>
        </Link>

        {/* Database status indicator & actions */}
        <div className="flex items-center gap-4">
          <div
            className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
              isUsingLiveDatabase
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                : 'bg-violet-950/40 text-violet-300 border-violet-800/50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>
              {isUsingLiveDatabase ? 'Supabase Live' : 'Supabase Required'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center text-xs text-gray-400 gap-1 bg-[#151824] px-3 py-1.5 rounded-md border border-[#242b3e]">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>BD Direct Delivery</span>
            </div>
            <Link
              href="/orders"
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#151824] hover:bg-[#1f2638] text-cyan-300 border border-cyan-800/40 px-3 py-1.5 rounded-md transition"
            >
              <span>Track Order</span>
            </Link>
            <Link
              href="/admin/products"
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#1a1f30] hover:bg-[#232a42] text-violet-300 border border-violet-800/50 px-3 py-1.5 rounded-md transition"
            >
              <span>Admin</span>
            </Link>
            <Link
              href="/#catalog"
              className="flex items-center gap-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-1.5 rounded-md transition shadow-md shadow-violet-700/20"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Explore Products</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
