export type PricingConfigFull = {
  id: string
  isActive: boolean
  setupFee: number
  setupFeeLabel: string
  vatRate: number
  vatIncluded: boolean
  createdAt: Date
  updatedAt: Date
  deliveryTiers: Array<{
    id: string
    pricingConfigId: string
    label: string
    description: string | null
    priceType: string
    fixedPrice: number | null
    pricePerMile: number | null
    minDistance: number | null
    maxDistance: number | null
    sortOrder: number
  }>
  extras: Array<{
    id: string
    pricingConfigId: string
    name: string
    description: string | null
    price: number
    priceType: string
    isDefault: boolean
    sortOrder: number
  }>
}
