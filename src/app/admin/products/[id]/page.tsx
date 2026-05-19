import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"
import { notFound } from "next/navigation"

export const metadata = { title: "Edit Product" }

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [raw, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { category: true } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ])
  if (!raw) notFound()

  const product = {
    ...raw,
    dailyRate: Number(raw.dailyRate),
    weeklyRate: raw.weeklyRate ? Number(raw.weeklyRate) : null,
    depositRate: Number(raw.depositRate),
    replacementPrice: raw.replacementPrice ? Number(raw.replacementPrice) : null,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Product</h1>
        <p className="text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
