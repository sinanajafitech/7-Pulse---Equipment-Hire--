import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/admin/ProductForm"

export const metadata = { title: "New Product" }

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } })
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">New Product</h1>
        <p className="text-muted-foreground">Add a new item to your rental catalogue</p>
      </div>
      <ProductForm categories={categories} />
    </div>
  )
}
