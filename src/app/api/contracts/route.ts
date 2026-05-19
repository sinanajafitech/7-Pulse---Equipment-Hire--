import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { generateTerms, COMPANY_NAME } from "@/lib/contractTerms"
import { formatDate } from "@/lib/utils"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { quoteId } = await req.json()

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: { items: { include: { product: true } } },
    })
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 })

    // Check if contract already exists
    const existing = await prisma.contract.findUnique({ where: { quoteId } })
    if (existing) return NextResponse.json({ data: existing })

    const terms = generateTerms({
      companyName: COMPANY_NAME,
      customerName: quote.customerName,
      reference: quote.reference,
      hireStartDate: formatDate(quote.hireStartDate),
      hireEndDate: formatDate(quote.hireEndDate),
    })

    const equipmentList = quote.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      dailyRate: Number(item.dailyRate),
      lineTotal: Number(item.lineTotal),
      replacementPrice: item.product.replacementPrice ? Number(item.product.replacementPrice) : null,
    }))

    const contract = await prisma.contract.create({
      data: {
        quoteId,
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        eventType: quote.eventType,
        eventDate: quote.eventDate,
        venueAddress: quote.venueAddress,
        hireStartDate: quote.hireStartDate,
        hireEndDate: quote.hireEndDate,
        equipmentList,
        grandTotal: quote.grandTotal,
        depositAmount: quote.depositAmount,
        terms,
      },
    })

    return NextResponse.json({ data: contract }, { status: 201 })
  } catch (error) {
    console.error("POST /api/contracts:", error)
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
  }
}
