import { Suspense } from 'react'
import { CustomerLoginForm } from '@/components/auth/CustomerLoginForm'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Customer Sign In | Gamer Goods',
  description: 'Sign in to your Gamer Goods customer account to track orders and fast-track digital reloads.',
}

export default function CustomerLoginPage() {
  const isUsingLiveDatabase = isSupabaseConfigured()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17]">
      <Navbar isUsingLiveDatabase={isUsingLiveDatabase} />
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          }
        >
          <CustomerLoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
