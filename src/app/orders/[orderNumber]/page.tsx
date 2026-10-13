import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import { OrderStatusClient } from '@/components/OrderStatusClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  return {
    title: `Order #${orderNumber} | Track Verification & Delivery - Gamer Goods`,
    description: `Real-time payment verification and fulfillment tracking for order ${orderNumber}.`,
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const isUsingLiveDatabase = isSupabaseConfigured()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17]">
      <Navbar isUsingLiveDatabase={isUsingLiveDatabase} />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <OrderStatusClient orderNumber={orderNumber} />
      </main>
      <Footer />
    </div>
  )
}
