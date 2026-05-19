import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Volume2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AddToQuoteButton } from "@/components/equipment/AddToQuoteButton"

export const metadata = { title: "Equipment Catalogue" }

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string }>
}) {
  const params = await searchParams
  const where = {
    isAvailable: true,
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.search ? { OR: [
      { name: { contains: params.search, mode: "insensitive" as const } },
      { tags: { has: params.search } },
    ]} : {}),
  }

  const orderBy = (() => {
    switch (params.sort) {
      case "price_asc": return { dailyRate: "asc" as const }
      case "price_desc": return { dailyRate: "desc" as const }
      default: return { name: "asc" as const }
    }
  })()

  const [rawProducts, categories] = await Promise.all([
    prisma.product.findMany({ where, include: { category: true }, orderBy }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ])

  const products = rawProducts.map((p) => ({
    ...p,
    dailyRate: Number(p.dailyRate),
    weeklyRate: p.weeklyRate ? Number(p.weeklyRate) : null,
    depositRate: Number(p.depositRate),
  }))

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Equipment Catalogue</h1>
        <p className="text-muted-foreground mt-1">{products.length} items available to hire</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters sidebar */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Categories</h3>
              <div className="space-y-1">
                <Link href="/equipment" className={`block rounded-lg px-3 py-2 text-sm transition-colors ${!params.category ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                  All Equipment
                </Link>
                {categories.map((cat) => (
                  <Link key={cat.id} href={`/equipment?category=${cat.slug}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${params.category === cat.slug ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Sort</h3>
              <div className="space-y-1">
                {[
                  { value: "", label: "Name A–Z" },
                  { value: "price_asc", label: "Price: Low–High" },
                  { value: "price_desc", label: "Price: High–Low" },
                ].map((opt) => (
                  <Link key={opt.value} href={`/equipment?${new URLSearchParams({ ...(params.category ? { category: params.category } : {}), ...(opt.value ? { sort: opt.value } : {}) }).toString()}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${params.sort === opt.value || (!params.sort && !opt.value) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-200">
              <Link href={`/equipment/${product.slug}`}>
                <div className="relative h-48 bg-muted overflow-hidden">
                  {product.images[0] ? (
                    <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Volume2 className="h-12 w-12 text-muted-foreground/30" /></div>
                  )}
                  <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs">{product.category.name}</Badge>
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/equipment/${product.slug}`}>
                  <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                </Link>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.shortDesc}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xl font-bold text-primary">{formatCurrency(Number(product.dailyRate))}</span>
                    <span className="text-sm text-muted-foreground">/day</span>
                  </div>
                  <AddToQuoteButton product={product} />
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && (
            <div className="col-span-full py-24 text-center text-muted-foreground">
              <Volume2 className="mx-auto mb-4 h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">No products found</p>
              <Button variant="link" asChild className="mt-2"><Link href="/equipment">Clear filters</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
