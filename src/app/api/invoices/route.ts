import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { formatCurrency } from "@/lib/utils"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "20")

  const where = status ? { status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED" } : {}

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({ where, include: { items: true, quote: { select: { reference: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.invoice.count({ where }),
  ])

  return NextResponse.json({ data: invoices, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { quoteId, dueDate, notes, terms, vatRate = 0, depositPaid = 0, items, ...rest } = body

  // Auto-generate invoice number
  const count = await prisma.invoice.count()
  const year = new Date().getFullYear()
  const number = `P7INV--${String(count + 1).padStart(4, "0")}`

  const subtotal = items.reduce((s: number, i: { quantity: number; unitPrice: number }) => s + i.quantity * i.unitPrice, 0)
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100
  const total = Math.round((subtotal + vatAmount) * 100) / 100
  const amountDue = Math.round((total - depositPaid) * 100) / 100

  const invoice = await prisma.invoice.create({
    data: {
      number,
      quoteId: quoteId || null,
      dueDate: new Date(dueDate),
      notes: notes || null,
      terms: terms || "Payment due within 14 days of invoice date.",
      vatRate,
      subtotal,
      vatAmount,
      total,
      depositPaid,
      amountDue,
      ...rest,
      items: {
        create: items.map((i: { description: string; quantity: number; unitPrice: number }) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: Math.round(i.quantity * i.unitPrice * 100) / 100,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ data: invoice }, { status: 201 })
}
