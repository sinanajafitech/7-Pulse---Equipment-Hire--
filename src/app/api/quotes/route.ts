import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { quoteSubmitSchema } from "@/lib/validations"
import { generateQuoteReference, calculateHireDays } from "@/lib/utils"
import { calculateQuotePrice } from "@/lib/pricing"
import { sendQuoteConfirmation, sendAdminQuoteNotification } from "@/lib/email"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")

    const where = {
      ...(status ? { status: status as "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED" | "EXPIRED" } : {}),
      ...(search
        ? {
            OR: [
              { reference: { contains: search, mode: "insensitive" as const } },
              { customerName: { contains: search, mode: "insensitive" as const } },
              { customerEmail: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { items: true, deliveryTier: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ])

    return NextResponse.json({ data: quotes, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = quoteSubmitSchema.parse(body)

    const hireStart = new Date(data.hireStartDate)
    const hireEnd = new Date(data.hireEndDate)
    const hireDays = calculateHireDays(hireStart, hireEnd)

    // Fetch pricing config server-side
    const pricingConfig = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
      include: { deliveryTiers: true, extras: true },
    })

    // Fetch products to get authoritative pricing
    const productIds = data.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isAvailable: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: "One or more products are unavailable" }, { status: 400 })
    }

    const deliveryTier = data.deliveryTierId && pricingConfig
      ? pricingConfig.deliveryTiers.find((t) => t.id === data.deliveryTierId) ?? null
      : null

    const selectedExtras = data.selectedExtraIds && pricingConfig
      ? pricingConfig.extras.filter((e) => data.selectedExtraIds.includes(e.id))
      : []

    const cartItems = products.map((p) => {
      const item = data.items.find((i) => i.productId === p.id)!
      return {
        productId: p.id,
        productName: p.name,
        dailyRate: Number(p.dailyRate),
        weeklyRate: p.weeklyRate ? Number(p.weeklyRate) : null,
        quantity: item.quantity,
      }
    })

    const breakdown = calculateQuotePrice(
      cartItems,
      hireStart,
      hireEnd,
      deliveryTier
        ? {
            id: deliveryTier.id,
            label: deliveryTier.label,
            priceType: deliveryTier.priceType as "FIXED" | "PER_MILE" | "FREE",
            fixedPrice: deliveryTier.fixedPrice ? Number(deliveryTier.fixedPrice) : null,
            pricePerMile: deliveryTier.pricePerMile ? Number(deliveryTier.pricePerMile) : null,
          }
        : null,
      selectedExtras.map((e) => ({
        id: e.id,
        name: e.name,
        price: Number(e.price),
        priceType: e.priceType as "FIXED" | "PER_DAY",
      })),
      pricingConfig
        ? {
            setupFee: Number(pricingConfig.setupFee),
            setupFeeLabel: pricingConfig.setupFeeLabel,
            vatRate: Number(pricingConfig.vatRate),
            vatIncluded: pricingConfig.vatIncluded,
            deliveryTiers: [],
            extras: [],
          }
        : { setupFee: 0, setupFeeLabel: "", vatRate: 0, vatIncluded: false, deliveryTiers: [], extras: [] }
    )

    // Generate reference
    const quoteCount = await prisma.quote.count()
    const reference = generateQuoteReference(quoteCount + 1)

    const quote = await prisma.quote.create({
      data: {
        reference,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        eventType: data.eventType,
        eventDate: new Date(data.eventDate),
        eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : null,
        venueAddress: data.venueAddress,
        guestCount: data.guestCount ?? null,
        notes: data.notes ?? null,
        hireStartDate: hireStart,
        hireEndDate: hireEnd,
        hireDays,
        equipmentTotal: breakdown.equipmentSubtotal,
        deliveryFee: breakdown.deliveryFee,
        setupFee: breakdown.setupFee,
        extrasTotal: breakdown.extrasTotal,
        grandTotal: breakdown.grandTotal,
        depositAmount: breakdown.depositAmount,
        deliveryTierId: data.deliveryTierId ?? null,
        selectedExtras: breakdown.extras,
        items: {
          create: breakdown.items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            dailyRate: item.dailyRate,
            quantity: item.quantity,
            hireDays,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: { items: { include: { product: true } }, deliveryTier: true },
    })

    // Send emails (non-blocking)
    const emailData = {
      reference: quote.reference,
      customerName: quote.customerName,
      customerEmail: quote.customerEmail,
      eventType: quote.eventType,
      eventDate: quote.eventDate,
      venueAddress: quote.venueAddress,
      hireStartDate: quote.hireStartDate,
      hireEndDate: quote.hireEndDate,
      grandTotal: breakdown.grandTotal,
      depositAmount: breakdown.depositAmount,
      items: breakdown.items,
    }
    Promise.all([
      sendQuoteConfirmation(emailData),
      sendAdminQuoteNotification(emailData),
    ]).catch(console.error)

    return NextResponse.json({ data: quote }, { status: 201 })
  } catch (error) {
    console.error("POST /api/quotes error:", error)
    return NextResponse.json({ error: "Failed to submit quote" }, { status: 500 })
  }
}
