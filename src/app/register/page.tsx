import { Suspense } from 'react'
import { CustomerRegisterForm } from '@/components/auth/CustomerRegisterForm'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export const metadata = {
  title: 'Customer Registration | Gamer Goods',
  description: 'Create your Gamer Goods customer account for fast checkouts and verified digital gaming points.',
}

export default function CustomerRegisterPage() {
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
          <CustomerRegisterForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
