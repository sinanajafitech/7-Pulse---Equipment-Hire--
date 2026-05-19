import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")
  const productIds = searchParams.getAll("productId")

  // requestedQty[productId] = how many the customer wants
  const requestedQtyRaw = searchParams.getAll("qty")
  const requestedQty: Record<string, number> = {}
  productIds.forEach((id, i) => {
    requestedQty[id] = parseInt(requestedQtyRaw[i] ?? "1") || 1
  })

  if (!startDate || !endDate || productIds.length === 0) {
    return NextResponse.json({ data: {} })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  // All overlapping bookings (APPROVED or REVIEWING, not RETURNED)
  const bookedItems = await prisma.quoteItem.findMany({
    where: {
      productId: { in: productIds },
      quote: {
        status: { in: ["APPROVED", "REVIEWING"] },
        hireStartDate: { lte: end },
        hireEndDate: { gte: start },
      },
    },
    include: {
      quote: {
        select: { hireEndDate: true, reference: true },
      },
    },
  })

  // Read live stockQty directly from the product table
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stockQty: true, name: true },
  })

  const availability: Record<string, {
    available: boolean
    bookedQty: number
    availableQty: number
    stockQty: number
    returnDate: string | null
  }> = {}

  for (const product of products) {
    const productBookings = bookedItems.filter((i) => i.productId === product.id)

    const bookedQty = productBookings.reduce((sum, i) => sum + i.quantity, 0)
    const availableQty = Math.max(0, product.stockQty - bookedQty)

    // Latest return date among conflicting bookings
    const returnDate = productBookings
      .map((i) => i.quote.hireEndDate)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] ?? null

    // Unavailable if available stock < what the customer wants
    const wanted = requestedQty[product.id] ?? 1
    const available = availableQty >= wanted

    availability[product.id] = {
      available,
      bookedQty,
      availableQty,
      stockQty: product.stockQty,
      returnDate: returnDate ? new Date(returnDate).toISOString().split("T")[0] : null,
    }
  }

  return NextResponse.json({ data: availability })
}
