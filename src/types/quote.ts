import { Quote, QuoteItem, Product, DeliveryTier } from "@/generated/prisma/client"

export type QuoteItemDetail = QuoteItem & {
  product: Product
}

export type QuoteWithItems = Quote & {
  items: QuoteItemDetail[]
  deliveryTier: DeliveryTier | null
}
