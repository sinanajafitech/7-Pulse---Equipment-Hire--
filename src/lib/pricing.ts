import { differenceInCalendarDays } from "date-fns"

export interface CartItem {
  productId: string
  productName: string
  dailyRate: number
  weeklyRate?: number | null
  quantity: number
  imageUrl?: string
}

export interface DeliveryTierData {
  id: string
  label: string
  priceType: "FIXED" | "PER_MILE" | "FREE"
  fixedPrice?: number | null
  pricePerMile?: number | null
}

export interface PricingExtraData {
  id: string
  name: string
  price: number
  priceType: "FIXED" | "PER_DAY"
}

export interface PricingConfigData {
  setupFee: number
  setupFeeLabel: string
  vatRate: number
  vatIncluded: boolean
  deliveryTiers: DeliveryTierData[]
  extras: PricingExtraData[]
}

export interface PriceBreakdownItem {
  productId: string
  productName: string
  dailyRate: number
  quantity: number
  hireDays: number
  lineTotal: number
}

export interface PriceBreakdown {
  items: PriceBreakdownItem[]
  equipmentSubtotal: number
  deliveryFee: number
  setupFee: number
  extras: Array<{ id: string; name: string; price: number }>
  extrasTotal: number
  subtotal: number
  vatAmount: number
  grandTotal: number
  depositAmount: number
  hireDays: number
}

export function calculateQuotePrice(
  cartItems: CartItem[],
  hireStartDate: Date,
  hireEndDate: Date,
  deliveryTier: DeliveryTierData | null,
  selectedExtras: PricingExtraData[],
  pricingConfig: PricingConfigData,
  distanceMiles = 0
): PriceBreakdown {
  const hireDays = Math.max(
    1,
    differenceInCalendarDays(hireEndDate, hireStartDate) + 1
  )

  const items: PriceBreakdownItem[] = cartItems.map((item) => {
    let lineTotal: number
    if (item.weeklyRate && hireDays >= 7) {
      const fullWeeks = Math.floor(hireDays / 7)
      const remainingDays = hireDays % 7
      lineTotal =
        item.weeklyRate * item.quantity * fullWeeks +
        item.dailyRate * item.quantity * remainingDays
    } else {
      lineTotal = item.dailyRate * item.quantity * hireDays
    }
    return {
      productId: item.productId,
      productName: item.productName,
      dailyRate: item.dailyRate,
      quantity: item.quantity,
      hireDays,
      lineTotal: Math.round(lineTotal * 100) / 100,
    }
  })

  const equipmentSubtotal = items.reduce((sum, i) => sum + i.lineTotal, 0)

  let deliveryFee = 0
  if (deliveryTier) {
    if (deliveryTier.priceType === "FREE") {
      deliveryFee = 0
    } else if (deliveryTier.priceType === "FIXED") {
      deliveryFee = deliveryTier.fixedPrice ?? 0
    } else if (deliveryTier.priceType === "PER_MILE") {
      deliveryFee = (deliveryTier.pricePerMile ?? 0) * distanceMiles
    }
  }

  const setupFee = pricingConfig.setupFee

  const extrasWithPrices = selectedExtras.map((extra) => ({
    id: extra.id,
    name: extra.name,
    price:
      extra.priceType === "PER_DAY"
        ? Math.round(extra.price * hireDays * 100) / 100
        : extra.price,
  }))
  const extrasTotal = extrasWithPrices.reduce((sum, e) => sum + e.price, 0)

  const subtotal =
    Math.round((equipmentSubtotal + deliveryFee + setupFee + extrasTotal) * 100) / 100

  let vatAmount = 0
  if (pricingConfig.vatRate > 0) {
    if (pricingConfig.vatIncluded) {
      vatAmount =
        Math.round((subtotal - subtotal / (1 + pricingConfig.vatRate)) * 100) / 100
    } else {
      vatAmount = Math.round(subtotal * pricingConfig.vatRate * 100) / 100
    }
  }

  const grandTotal = pricingConfig.vatIncluded
    ? subtotal
    : Math.round((subtotal + vatAmount) * 100) / 100

  const depositAmount = Math.round(grandTotal * 0.3 * 100) / 100

  return {
    items,
    equipmentSubtotal: Math.round(equipmentSubtotal * 100) / 100,
    deliveryFee: Math.round(deliveryFee * 100) / 100,
    setupFee: Math.round(setupFee * 100) / 100,
    extras: extrasWithPrices,
    extrasTotal: Math.round(extrasTotal * 100) / 100,
    subtotal,
    vatAmount,
    grandTotal,
    depositAmount,
    hireDays,
  }
}
