import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { enquirySchema } from "@/lib/validations"
import { sendEnquiryNotification } from "@/lib/email"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "20")

    const where = status
      ? { status: status as "UNREAD" | "READ" | "RESPONDED" }
      : {}

    const [enquiries, total] = await Promise.all([
      prisma.enquiry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.enquiry.count({ where }),
    ])

    return NextResponse.json({ data: enquiries, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch {
    return NextResponse.json({ error: "Failed to fetch enquiries" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = enquirySchema.parse(body)

    const enquiry = await prisma.enquiry.create({ data })

    sendEnquiryNotification(data).catch(console.error)

    return NextResponse.json({ data: enquiry }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to submit enquiry" }, { status: 500 })
  }
}
