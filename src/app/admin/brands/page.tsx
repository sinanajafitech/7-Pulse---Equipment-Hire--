import { prisma } from "@/lib/prisma"
import { BrandsClient } from "@/components/admin/BrandsClient"

export const metadata = { title: "Brands" }

export default async function BrandsPage() {
  const brands = await prisma.brand.findMany({ orderBy: { sortOrder: "asc" } })
  return <BrandsClient initialBrands={brands} />
}
