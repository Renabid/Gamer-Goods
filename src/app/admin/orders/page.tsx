import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/auth/admin-guard'
import { getAdminOrders } from '@/lib/data/admin'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminOrderManager } from '@/components/admin/AdminOrderManager'

export default async function AdminOrdersPage() {
  const auth = await requireAdminSession()

  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    redirect('/admin/login')
  }

  const { orders, isUsingLiveDatabase } = await getAdminOrders()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17] text-gray-100">
      <AdminHeader
        userEmail={auth.user?.email}
        isUsingLiveDatabase={isUsingLiveDatabase}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Customer Orders & Fulfillment
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Verify bKash / Nagad transaction references and fulfill digital reloads.
            </p>
          </div>
        </div>

        <AdminOrderManager
          initialOrders={orders}
        />
      </main>
    </div>
  )
}
