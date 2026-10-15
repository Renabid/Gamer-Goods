'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Mail,
  Lock,
  User,
  Phone,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Zap,
  CheckCircle2,
  MailCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

export function CustomerRegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || '/'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isAwaitingConfirmation, setIsAwaitingConfirmation] = useState(false)

  // Resend state
  const [isResending, setIsResending] = useState(false)
  const [resendStatus, setResendStatus] = useState<{ text: string; isError: boolean } | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return
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

      setResendStatus({ text: 'Fresh confirmation email sent! Check your inbox.', isError: false })
      setResendCooldown(60)

      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error sending email'
      setResendStatus({ text: msg, isError: true })
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setIsAlreadyRegistered(false)
    setSuccessMessage(null)

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyRegistered) {
          setIsAlreadyRegistered(true)
        }
        throw new Error(data.error || 'Registration failed')
      }

      if (data.requiresEmailConfirmation) {
        setIsAwaitingConfirmation(true)
        setSuccessMessage(
          'Account created! Check your email and click the confirmation link to activate your Gamer Goods account.'
        )
        setIsLoading(false)
        return
      }

      // If email confirmation is disabled on Supabase, proceed with login
      setSuccessMessage('Account registered successfully! Signing you in...')

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (loginRes.ok) {
        setTimeout(() => {
          router.push(redirectPath)
          router.refresh()
        }, 1200)
      } else {
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setErrorMessage(msg)
      setIsLoading(false)
    }
  }

  // Confirmation email notification screen
  if (isAwaitingConfirmation) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-600/30 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">
              GAMER<span className="text-violet-400">GOODS</span>
            </span>
          </Link>
        </div>

        <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-violet-950/20 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Check Your Email
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Account created! Check your email and click the confirmation link to activate your Gamer Goods account.
            </p>
            <div className="p-2.5 rounded-lg bg-[#0d0f17] border border-[#242b3e] font-mono text-xs text-cyan-300">
              {email}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0d0f17]/60 border border-[#242b3e] text-left text-xs text-gray-400 space-y-1.5">
            <p className="font-semibold text-gray-300">Troubleshooting delivery:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-400">
              <li>Open the email sent from <strong>Gamer Goods</strong> (or Supabase).</li>
              <li>Click the activation button/link to verify your account.</li>
              <li>Check your <strong>Spam or Junk folder</strong> if you don&apos;t see it within 1-2 minutes.</li>
            </ul>
          </div>

          {resendStatus && (
            <div
              className={`p-3 rounded-xl border text-xs text-left ${
                resendStatus.isError
                  ? 'bg-rose-950/50 border-rose-800/60 text-rose-300'
                  : 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300'
              }`}
            >
              {resendStatus.text}
            </div>
          )}

          <div className="space-y-3 pt-1">
            <button
              type="button"
              disabled={isResending || resendCooldown > 0}
              onClick={handleResend}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-cyan-300 hover:text-white bg-[#0d0f17] hover:bg-[#1f2638] border border-cyan-800/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
              <span>
                {isResending
                  ? 'Resending confirmation email...'
                  : resendCooldown > 0
                  ? `Resend available in ${resendCooldown}s`
                  : 'Didn’t receive it? Resend Confirmation Email'}
              </span>
            </button>

            <Link
              href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Storefront</span>
            </Link>
          </div>
        </div>
      </div>
    )
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
          Create Customer Account
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Join Gamer Goods for fast checkouts, tracking, and instant delivery notifications.
        </p>
      </div>

      {/* Card */}
      <div className="bg-[#151824] border border-[#242b3e] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-violet-950/20">
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 flex flex-col gap-2 text-xs text-rose-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
            {isAlreadyRegistered && (
              <div className="pt-1">
                <Link
                  href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg transition"
                >
                  <span>Sign In with this Email</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 flex items-start gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Shakib Ahmed"
                className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Phone Number <span className="text-gray-500 font-normal">(Optional, for WhatsApp)</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01700000000"
                className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 chars"
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full bg-[#0d0f17] border border-[#242b3e] focus:border-violet-500 rounded-xl pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-200 placeholder-gray-600 focus:outline-none transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 transition shadow-lg shadow-violet-800/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account &amp; Continue</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#242b3e] text-center text-xs text-gray-400 space-y-3">
          <p>
            Already have an account?{' '}
            <Link
              href={`/login${redirectPath !== '/' ? `?redirect=${encodeURIComponent(redirectPath)}` : ''}`}
              className="text-violet-400 hover:text-violet-300 font-semibold"
            >
              Sign In
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
