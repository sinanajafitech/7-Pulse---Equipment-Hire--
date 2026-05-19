import { Category, Product } from "@/generated/prisma/client"

export type ProductWithCategory = Product & {
  category: Category
}

export type ProductSummary = {
  id: string
  name: string
  slug: string
  shortDesc: string | null
  images: string[]
  dailyRate: string
  categoryId: string
  category: { name: string; slug: string }
  isAvailable: boolean
  isFeatured: boolean
  stockQty: number
}
