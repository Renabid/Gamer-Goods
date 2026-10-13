import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { OrderLookupTracker } from '@/components/OrderLookupTracker'

export const metadata = {
  title: 'Track Order & Payment Status | Gamer Goods',
  description: 'Check whether transaction verification is completed and your game points/recharge order is processing or delivered.',
}

export default function OrderTrackingIndexPage() {
  const isUsingLiveDatabase = isSupabaseConfigured()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17]">
      <Navbar isUsingLiveDatabase={isUsingLiveDatabase} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col justify-center">
        <OrderLookupTracker />
      </main>
      <Footer />
    </div>
  )
}
