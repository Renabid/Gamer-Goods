import Link from 'next/link'
import { ArrowLeft, Gamepad2 } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0f17] text-gray-100 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-violet-950 flex items-center justify-center border border-violet-800/40 text-violet-400 mb-4">
        <Gamepad2 className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-extrabold text-white">Product Not Found</h2>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">
        The game or digital item you are searching for does not exist or has been removed from Gamer Goods.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white text-xs transition shadow-lg shadow-violet-800/30"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Catalog</span>
      </Link>
    </div>
  )
}
