import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      totalEnquiries,
      unreadEnquiries,
      totalProducts,
      recentQuotes,
      recentEnquiries,
      topProducts,
    ] = await Promise.all([
      prisma.quote.count(),
      prisma.quote.count({ where: { status: "PENDING" } }),
      prisma.quote.count({ where: { status: "APPROVED" } }),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: "UNREAD" } }),
      prisma.product.count({ where: { isAvailable: true } }),
      prisma.quote.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      }),
      prisma.enquiry.findMany({ take: 5, orderBy: { createdAt: "desc" } }),
      prisma.quoteItem.groupBy({
        by: ["productId", "productName"],
        _count: { productId: true },
        _sum: { lineTotal: true },
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),
    ])

    const revenueEstimate = await prisma.quote.aggregate({
      _sum: { grandTotal: true },
      where: { status: { in: ["APPROVED", "PENDING", "REVIEWING"] } },
    })

    return NextResponse.json({
      data: {
        quotes: { total: totalQuotes, pending: pendingQuotes, approved: approvedQuotes },
        enquiries: { total: totalEnquiries, unread: unreadEnquiries },
        products: { total: totalProducts },
        revenueEstimate: revenueEstimate._sum.grandTotal ?? 0,
        recentQuotes,
        recentEnquiries,
        topProducts,
      },
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
