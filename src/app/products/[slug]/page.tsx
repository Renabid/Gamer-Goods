import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/data/storefront'
import { getPublicPaymentMethods } from '@/lib/data/admin'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { ProductDetailClient } from '@/components/ProductDetailClient'

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params
  const [{ product, isUsingLiveDatabase }, paymentMethods] = await Promise.all([
    getProductBySlug(slug),
    getPublicPaymentMethods(),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0f17] text-gray-100">
      <Navbar isUsingLiveDatabase={isUsingLiveDatabase} />
      <main className="flex-grow">
        <ProductDetailClient
          product={product}
          paymentMethods={paymentMethods}
          isUsingLiveDatabase={isUsingLiveDatabase}
        />
      </main>
      <Footer />
    </div>
  )
}
