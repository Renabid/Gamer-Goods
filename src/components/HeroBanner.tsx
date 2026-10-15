import { Shield, Zap, RefreshCw, Headphones, AlertTriangle } from 'lucide-react'

export function HeroBanner({ isUsingLiveDatabase }: { isUsingLiveDatabase: boolean }) {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 border-b border-[#242b3e] bg-gradient-to-b from-[#131623] to-[#0d0f17]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {!isUsingLiveDatabase && (
          <div className="mb-6 p-3.5 bg-violet-950/40 border border-violet-800/60 rounded-xl flex items-start sm:items-center justify-between gap-3 text-xs text-violet-200">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-violet-800/80 text-white shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong>Database Setup Mode:</strong> Storefront is connected to PostgreSQL schema. Provide <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="bg-black/40 px-1 py-0.5 rounded text-cyan-300">.env.local</code> to synchronize products directly with the admin dashboard.
              </span>
            </div>
            <span className="text-[10px] uppercase font-mono font-bold bg-violet-900/60 text-violet-300 px-2 py-0.5 rounded border border-violet-700/50 shrink-0">
              Setup
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-700/50 text-violet-300 text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next-Gen Gaming Top-Up Platform</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Instant In-Game Currencies &amp; Digital Vouchers with{' '}
              <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
                Zero Friction
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base lg:text-lg text-gray-300 max-w-2xl">
              Gamer Goods provides secure, automated digital reloads for Free Fire, PUBG Mobile, MLBB, Valorant, and prepaid gaming cards across Bangladesh with transparent BDT pricing.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                className="px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 font-semibold text-white text-sm transition shadow-lg shadow-violet-700/30 flex items-center gap-2"
              >
                <span>Browse Products</span>
                <span className="text-cyan-300">↓</span>
              </a>
              <a
                href="#features"
                className="px-5 py-2.5 rounded-lg bg-[#151824] hover:bg-[#1f2436] border border-[#242b3e] text-gray-300 text-sm font-semibold transition"
              >
                Why Gamer Goods?
              </a>
            </div>
          </div>

          {/* Quick value props badges */}
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-3" id="features">
            <div className="bg-[#151824]/90 p-3.5 rounded-xl border border-[#242b3e] flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-violet-950 flex items-center justify-center text-violet-400 border border-violet-800/40">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">Swift Reload</h4>
              <p className="text-[11px] text-gray-400">Direct top-up within 5-15 mins of verification.</p>
            </div>

            <div className="bg-[#151824]/90 p-3.5 rounded-xl border border-[#242b3e] flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800/40">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">Safe &amp; Genuine</h4>
              <p className="text-[11px] text-gray-400">100% legitimate distributor digital credits.</p>
            </div>

            <div className="bg-[#151824]/90 p-3.5 rounded-xl border border-[#242b3e] flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-violet-950 flex items-center justify-center text-violet-400 border border-violet-800/40">
                <RefreshCw className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">bKash &amp; Nagad</h4>
              <p className="text-[11px] text-gray-400">Native local payment methods supported.</p>
            </div>

            <div className="bg-[#151824]/90 p-3.5 rounded-xl border border-[#242b3e] flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400 border border-cyan-800/40">
                <Headphones className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-white text-sm">Live Support</h4>
              <p className="text-[11px] text-gray-400">Helpful customer assistance on WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
