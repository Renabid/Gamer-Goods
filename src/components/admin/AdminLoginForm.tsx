'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle, ArrowLeft, Zap } from 'lucide-react'
import Link from 'next/link'

export function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      router.push('/admin')
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-[#0d0f17] text-gray-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              GAMER<span className="text-violet-400">GOODS</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-300 text-xs font-semibold mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Administrator Access Control</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Restricted area. Only verified administrator credentials permitted.
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-8 shadow-2xl shadow-violet-950/20">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gamergoods.com"
                  required
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In as Admin</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#242b3e] text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
