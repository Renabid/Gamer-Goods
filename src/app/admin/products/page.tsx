import { redirect } from 'next/navigation'
import { requireAdminSession } from '@/lib/auth/admin-guard'
import { getAdminProducts } from '@/lib/data/admin'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { AdminProductInventory } from '@/components/admin/AdminProductInventory'

export default async function AdminProductsPage() {
  const auth = await requireAdminSession()

  if (auth.isUsingLiveDatabase && !auth.isAdmin) {
    redirect('/admin/login')
  }

  const { products, categories, isUsingLiveDatabase } = await getAdminProducts()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17] text-gray-100">
      <AdminHeader
        userEmail={auth.user?.email}
        isUsingLiveDatabase={isUsingLiveDatabase}
      />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminProductInventory
          initialProducts={products}
          categories={categories}
          isUsingLiveDatabase={isUsingLiveDatabase}
        />
      </main>
    </div>
  )
}
