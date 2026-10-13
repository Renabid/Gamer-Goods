import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/auth/admin-guard'
import { getDashboardMetrics } from '@/lib/data/admin'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { DashboardOverview } from '@/components/admin/DashboardOverview'

export default async function AdminDashboardPage() {
  const auth = await requireAdminSession()

  // Enforce server-side authorization check:
  // If database is connected and user is not an authorized admin, redirect to login
  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    redirect('/admin/login')
  }

  const metrics = await getDashboardMetrics()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17] text-gray-100">
      <AdminHeader
        userEmail={auth.user?.email}
        isUsingLiveDatabase={metrics.isUsingLiveDatabase}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Real-time catalog metrics and business operations.
          </p>
        </div>

        <DashboardOverview metrics={metrics} />
      </main>
    </div>
  )
}
