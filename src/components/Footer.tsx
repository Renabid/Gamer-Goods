import Link from 'next/link'
import { Zap, Shield } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[#242b3e] bg-[#0d0f17] text-gray-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white">
                GAMER<span className="text-violet-400">GOODS</span>
              </span>
            </Link>
            <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
              Premium digital recharge service for gamers across Bangladesh. Secure transactions, instant verification, and multiple local payment gateways.
            </p>
          </div>

          <div>
            <h4 className="text-gray-200 font-bold mb-3 uppercase tracking-wider text-[11px]">
              Categories
            </h4>
            <ul className="space-y-2">
              <li><Link href="/#catalog" className="hover:text-violet-400 transition">Mobile Games Top-Up</Link></li>
              <li><Link href="/#catalog" className="hover:text-violet-400 transition">PC &amp; Console Points</Link></li>
              <li><Link href="/#catalog" className="hover:text-violet-400 transition">Prepaid Gift Cards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-gray-200 font-bold mb-3 uppercase tracking-wider text-[11px]">
              Support &amp; Trust
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-cyan-400" /> bKash &amp; Nagad Verified</li>
              <li>Terms of Service</li>
              <li>Refund &amp; Delivery Policy</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#242b3e] flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-500 text-[11px]">
          <div>
            &copy; 2026 Gamer Goods. All rights reserved.
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span>Built with Next.js, Supabase &amp; Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
