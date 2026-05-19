import { prisma } from "@/lib/prisma"
import { MetricCard } from "@/components/admin/MetricCard"
import { QuoteStatusBadge } from "@/components/admin/QuoteStatusBadge"
import { FileText, MessageSquare, Package, PoundSterling, Clock, Truck, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export const metadata = { title: "Dashboard" }
export const dynamic = "force-dynamic"

async function getDashboardData() {
  const now = new Date()

  const [
    totalQuotes, pendingQuotes, approvedQuotes, unreadEnquiries,
    totalProducts, revenueResult, recentQuotes, recentEnquiries,
    equipmentOut, overdueCount,
  ] = await Promise.all([
    prisma.quote.count(),
    prisma.quote.count({ where: { status: "PENDING" } }),
    prisma.quote.count({ where: { status: "APPROVED" } }),
    prisma.enquiry.count({ where: { status: "UNREAD" } }),
    prisma.product.count({ where: { isAvailable: true } }),
    prisma.quote.aggregate({ _sum: { grandTotal: true }, where: { status: { in: ["APPROVED", "PENDING", "REVIEWING"] } } }),
    prisma.quote.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { items: true } }),
    prisma.enquiry.findMany({ take: 4, orderBy: { createdAt: "desc" } }),
    // Equipment currently out on hire
    prisma.quote.findMany({
      where: {
        status: { in: ["APPROVED", "REVIEWING"] },
        hireStartDate: { lte: now },
        hireEndDate: { gte: now },
      },
      include: {
        items: true,
        invoice: { select: { status: true, number: true } },
      },
      orderBy: { hireEndDate: "asc" },
      take: 8,
    }),
    // Overdue count
    prisma.quote.count({
      where: { status: "APPROVED", hireEndDate: { lt: now } },
    }),
  ])

  return {
    totalQuotes, pendingQuotes, approvedQuotes, unreadEnquiries, totalProducts,
    revenueEstimate: revenueResult._sum.grandTotal ?? 0,
    recentQuotes, recentEnquiries, equipmentOut, overdueCount,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()
  const now = new Date()

  const outItems = data.equipmentOut.flatMap((q) =>
    q.items.map((item) => ({
      quoteId: q.id,
      reference: q.reference,
      customerName: q.customerName,
      productName: item.productName,
      quantity: item.quantity,
      hireEndDate: q.hireEndDate,
      daysLeft: Math.ceil((q.hireEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      invoiceStatus: q.invoice?.status ?? null,
    }))
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your PULSE 7 EVENTS operation</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Quotes" value={data.totalQuotes} subtitle={`${data.pendingQuotes} pending review`} icon={FileText} trend={data.pendingQuotes > 0 ? "up" : "neutral"} />
        <MetricCard title="Revenue Pipeline" value={formatCurrency(Number(data.revenueEstimate))} subtitle="Pending + approved quotes" icon={PoundSterling} trend="up" />
        <MetricCard title="Equipment Out" value={outItems.length} subtitle={data.overdueCount > 0 ? `${data.overdueCount} overdue!` : "Currently on hire"} icon={Truck} trend={data.overdueCount > 0 ? "down" : "neutral"} />
        <MetricCard title="Unread Enquiries" value={data.unreadEnquiries} subtitle="Awaiting response" icon={MessageSquare} trend={data.unreadEnquiries > 0 ? "up" : "neutral"} />
      </div>

      {/* Overdue alert */}
      {data.overdueCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400 font-medium">
            {data.overdueCount} job{data.overdueCount > 1 ? "s are" : " is"} overdue — equipment not yet returned.{" "}
            <Link href="/admin/equipment-out" className="underline hover:no-underline">View details →</Link>
          </p>
        </div>
      )}

      {/* Equipment Out + Recent Quotes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />Equipment Out ({outItems.length})
            </CardTitle>
            <Link href="/admin/equipment-out" className="text-xs text-primary hover:underline">Full view</Link>
          </CardHeader>
          <CardContent>
            {outItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No equipment currently out on hire</p>
            ) : (
              <div className="space-y-2">
                {outItems.map((item, i) => (
                  <Link key={i} href={`/admin/quotes/${item.quoteId}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {item.productName} <span className="text-muted-foreground font-normal">×{item.quantity}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.customerName} · {item.reference}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {item.invoiceStatus === "PAID" && (
                        <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Paid</Badge>
                      )}
                      <Badge variant="outline" className={`text-xs ${item.daysLeft <= 1 ? "border-yellow-500/30 text-yellow-400" : "border-border text-muted-foreground"}`}>
                        {item.daysLeft === 0 ? "Due today" : item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `Return ${formatDate(item.hireEndDate)}`}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Quotes</CardTitle>
            <Link href="/admin/quotes" className="text-xs text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentQuotes.map((quote) => (
                <Link key={quote.id} href={`/admin/quotes/${quote.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">{quote.customerName}</p>
                    <p className="text-xs text-muted-foreground">{quote.reference} · {formatDate(quote.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-primary">{formatCurrency(Number(quote.grandTotal))}</span>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                </Link>
              ))}
              {data.recentQuotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No quotes yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Enquiries */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Enquiries</CardTitle>
          <Link href="/admin/enquiries" className="text-xs text-primary hover:underline">View all</Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.recentEnquiries.map((enq) => (
              <Link key={enq.id} href="/admin/enquiries" className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{enq.name}</p>
                  <p className="text-xs text-muted-foreground">{enq.email} · {formatDate(enq.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {enq.status === "UNREAD" && <span className="h-2 w-2 rounded-full bg-primary" />}
                  <Clock className="h-3 w-3 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {data.recentEnquiries.length === 0 && <p className="text-sm text-muted-foreground text-center py-4 col-span-2">No enquiries yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
