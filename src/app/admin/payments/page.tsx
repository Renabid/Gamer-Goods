import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/auth/admin-guard'
import { getAdminPaymentMethods } from '@/lib/data/admin'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminPaymentSettings } from '@/components/admin/AdminPaymentSettings'

export default async function AdminPaymentSettingsPage() {
  const auth = await requireAdminSession()

  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    redirect('/admin/login')
  }

  const { paymentMethods, isUsingLiveDatabase } = await getAdminPaymentMethods()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17] text-gray-100">
      <AdminHeader
        userEmail={auth.user?.email}
        isUsingLiveDatabase={isUsingLiveDatabase}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminPaymentSettings
          initialMethods={paymentMethods}
          isUsingLiveDatabase={isUsingLiveDatabase}
        />
      </main>
    </div>
  )
}
