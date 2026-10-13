import { getStorefrontCatalog } from '@/lib/data/storefront'
import { Navbar } from '@/components/Navbar'
import { HeroBanner } from '@/components/HeroBanner'
import { CatalogSection } from '@/components/CatalogSection'
import { Footer } from '@/components/Footer'

export default async function HomePage() {
  const { categories, products, isUsingLiveDatabase, error } = await getStorefrontCatalog()

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17] text-gray-100 selection:bg-violet-600 selection:text-white">
      <Navbar isUsingLiveDatabase={isUsingLiveDatabase} />
      <main className="flex-grow">
        <HeroBanner isUsingLiveDatabase={isUsingLiveDatabase} />
        <CatalogSection categories={categories} products={products} error={error} />
      </main>
      <Footer />
    </div>
  )
}
