"use client"
import { Button } from "@/components/ui/button"
import { useQuoteCart } from "@/hooks/useQuoteCart"
import { ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"

export interface ProductForCart {
  id: string
  name: string
  dailyRate: number
  weeklyRate?: number | null
  images: string[]
}

export function AddToQuoteButton({ product, size = "sm" }: { product: ProductForCart; size?: "sm" | "default" | "lg" }) {
  const { items, addItem } = useQuoteCart()
  const inCart = items.some((i) => i.productId === product.id)

  function handleAdd() {
    addItem({
      productId: product.id,
      productName: product.name,
      dailyRate: product.dailyRate,
      weeklyRate: product.weeklyRate ?? null,
      quantity: 1,
      imageUrl: product.images[0],
    })
    toast.success(`${product.name} added to quote`)
  }

  if (inCart) {
    return (
      <Button size={size} variant="outline" className="border-primary/50 text-primary" disabled>
        <Check className="mr-1 h-4 w-4" />In Quote
      </Button>
    )
  }

  return (
    <Button size={size} onClick={handleAdd}>
      <ShoppingCart className="mr-1 h-4 w-4" />Add to Quote
    </Button>
  )
}
