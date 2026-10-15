'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Zap,
  UserCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'

export function CustomerLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/'
  const isVerified = searchParams.get('verified') === 'true'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUnconfirmed, setIsUnconfirmed] = useState(false)

  // Resend state from login
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<string | null>(null)

  const verificationErrorMessage =
    errorParam === 'verification_failed'
      ? 'Email verification link was invalid or has expired. Please try signing in, or request a new confirmation link.'
      : errorParam
      ? 'An error occurred during authentication. Please try signing in.'
      : null

  const handleResendFromLogin = async () => {
    if (!email.trim() || isResending) return
    setIsResending(true)
    setResendStatus(null)

    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend confirmation email.')
      }

      setResendStatus('Confirmation link sent! Please check your inbox and spam folder.')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending confirmation email'
      setResendStatus(msg)
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setIsUnconfirmed(false)
    setResendStatus(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorText = data.error || 'Failed to sign in. Please verify your credentials.'
        if (errorText.toLowerCase().includes('not confirmed') || errorText.toLowerCase().includes('email not confirmed')) {
          setIsUnconfirmed(true)
        }
        throw new Error(errorText)
      }

      router.push(redirectPath)
      router.refresh()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white">
            GAMER<span className="text-violet-400">GOODS</span>
          </span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Customer Sign In
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Access your digital orders, transaction references, and quick top-ups.
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-violet-950/20">
        {/* Verification Success Banner */}
        {isVerified && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Email Verified Successfully!</span>
              <span>Your Gamer Goods account is now active. Please sign in below to continue.</span>
            </div>
          </div>
        )}

        {/* Verification Failure Banner */}
        {verificationErrorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{verificationErrorMessage}</span>
          </div>
        )}

        {/* Unconfirmed Email Notice with Resend button */}
        {isUnconfirmed && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-950/50 border border-amber-800/60 text-xs text-amber-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Email Not Confirmed Yet</span>
                <span>Please activate your account by clicking the confirmation link sent to your email.</span>
              </div>
            </div>
            {resendStatus ? (
              <p className="font-medium text-emerald-300 text-[11px] pt-1">{resendStatus}</p>
            ) : (
              <button
                type="button"
                disabled={isResending}
                onClick={handleResendFromLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/50 text-[11px] font-bold text-amber-200 transition cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>{isResending ? 'Resending email...' : 'Resend Confirmation Email'}</span>
              </button>
            )}
          </div>
        )}

        {/* Standard Form Error Banner */}
        {errorMessage && !isUnconfirmed && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Sign In to Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#242b3e] text-center text-xs text-gray-400 space-y-3">
          <p>
            Don&apos;t have an account yet?{' '}
            <Link
              href={`/register${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
              className="text-violet-400 hover:text-violet-300 font-semibold"
            >
              Sign Up here
            </Link>
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition"
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
