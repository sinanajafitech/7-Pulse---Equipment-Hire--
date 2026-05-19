import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { sendQuoteStatusUpdate, sendContractEmail } from "@/lib/email"
import { generateTerms, COMPANY_NAME } from "@/lib/contractTerms"
import { formatDate } from "@/lib/utils"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const quote = await prisma.quote.findFirst({
      where: { OR: [{ id }, { reference: id }] },
      include: { items: { include: { product: true } }, deliveryTier: true, contract: true },
    })
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ data: quote })
  } catch (error) {
    console.error("GET /api/quotes/[id]:", error)
    return NextResponse.json({ error: "Failed to fetch quote" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { status, adminNotes, sendEmail } = body

    const existing = await prisma.quote.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, contract: true },
    })
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updateData: Record<string, unknown> = {}
    if (status) {
      updateData.status = status
      updateData.respondedAt = new Date()
    }
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
      include: { items: { include: { product: true } }, deliveryTier: true, contract: true },
    })

    // Auto-create contract and send when quote is first APPROVED
    if (status === "APPROVED" && !existing.contract) {
      try {
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
            quoteId: quote.id,
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
            sentAt: new Date(),
          },
        })

        const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"
        const contractUrl = `${base}/contracts/${contract.token}`

        // Send contract email
        sendContractEmail({
          customerEmail: quote.customerEmail,
          customerName: quote.customerName,
          reference: quote.reference,
          contractUrl,
          eventType: quote.eventType,
          eventDate: quote.eventDate,
          hireStartDate: quote.hireStartDate,
          hireEndDate: quote.hireEndDate,
        }).catch(console.error)
      } catch (contractError) {
        console.error("Contract creation failed (non-fatal):", contractError)
      }
    }

    if (sendEmail && status) {
      sendQuoteStatusUpdate(quote.customerEmail, quote.customerName, quote.reference, status, adminNotes).catch(console.error)
    }

    return NextResponse.json({ data: quote })
  } catch (error) {
    console.error("PUT /api/quotes/[id] error:", error)
    const message = error instanceof Error ? error.message : "Failed to update quote"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
