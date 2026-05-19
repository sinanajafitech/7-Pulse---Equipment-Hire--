import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const enquiry = await prisma.enquiry.findUnique({ where: { id } })
    if (!enquiry) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ data: enquiry })
  } catch {
    return NextResponse.json({ error: "Failed to fetch enquiry" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const body = await req.json()
    const { status, adminNotes } = body

    const enquiry = await prisma.enquiry.update({
      where: { id },
      data: {
        ...(status ? { status, ...(status === "RESPONDED" ? { respondedAt: new Date() } : {}) } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
    })
    return NextResponse.json({ data: enquiry })
  } catch {
    return NextResponse.json({ error: "Failed to update enquiry" }, { status: 500 })
  }
}
