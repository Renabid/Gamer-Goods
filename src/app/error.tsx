'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Storefront error boundary caught:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-[#0d0f17] text-gray-100 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400 mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h2 className="text-2xl font-extrabold text-white">Something went wrong</h2>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">
        We encountered an error loading this section. Please try refreshing.
      </p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-white text-xs transition shadow-lg shadow-violet-800/30 cursor-pointer"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  )
}
