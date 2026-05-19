import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { items: true, quote: true } })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: invoice })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const { status, paidAt, sentAt } = body
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(status === "PAID" && !paidAt ? { paidAt: new Date() } : {}),
      ...(status === "SENT" && !sentAt ? { sentAt: new Date() } : {}),
    },
    include: { items: true },
  })
  return NextResponse.json({ data: invoice })
}
