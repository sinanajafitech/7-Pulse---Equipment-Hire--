import { prisma } from "@/lib/prisma"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Equipment Out" }
export const dynamic = "force-dynamic"

export default async function EquipmentOutPage() {
  const now = new Date()

  // Equipment currently out on hire — approved quotes where hire period covers today
  const activeQuotes = await prisma.quote.findMany({
    where: {
      status: { in: ["APPROVED", "REVIEWING"] },
      hireStartDate: { lte: now },
      hireEndDate: { gte: now },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true, images: true } } } },
      invoice: { select: { status: true, number: true } },
    },
    orderBy: { hireEndDate: "asc" },
  })

  // Upcoming (starting within next 7 days)
  const upcoming = await prisma.quote.findMany({
    where: {
      status: { in: ["APPROVED"] },
      hireStartDate: { gt: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true, images: true } } } },
    },
    orderBy: { hireStartDate: "asc" },
  })

  // Overdue — hire end date passed but not returned (still APPROVED)
  const overdue = await prisma.quote.findMany({
    where: {
      status: "APPROVED",
      hireEndDate: { lt: now },
    },
    include: {
      items: { include: { product: { select: { id: true, name: true } } } },
    },
    orderBy: { hireEndDate: "asc" },
  })

  // Flatten to product-level rows
  const activeRows = activeQuotes.flatMap((q) =>
    q.items.map((item) => ({
      quoteId: q.id,
      reference: q.reference,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      productName: item.productName,
      quantity: item.quantity,
      hireStartDate: q.hireStartDate,
      hireEndDate: q.hireEndDate,
      daysLeft: Math.ceil((q.hireEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      invoiceStatus: q.invoice?.status ?? null,
      invoiceNumber: q.invoice?.number ?? null,
    }))
  )

  const overdueRows = overdue.flatMap((q) =>
    q.items.map((item) => ({
      quoteId: q.id,
      reference: q.reference,
      customerName: q.customerName,
      customerPhone: q.customerPhone,
      productName: item.productName,
      quantity: item.quantity,
      hireEndDate: q.hireEndDate,
      daysOverdue: Math.ceil((now.getTime() - q.hireEndDate.getTime()) / (1000 * 60 * 60 * 24)),
    }))
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Equipment Out</h1>
        <p className="text-muted-foreground">Real-time view of all equipment currently on hire</p>
      </div>

      {/* Overdue */}
      {overdueRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <h2 className="text-base font-semibold text-red-400">Overdue — Not Returned ({overdueRows.length})</h2>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-red-500/20 text-left">
                <th className="px-4 py-3 font-medium text-red-400/70">Equipment</th>
                <th className="px-4 py-3 font-medium text-red-400/70">Customer</th>
                <th className="px-4 py-3 font-medium text-red-400/70">Was Due</th>
                <th className="px-4 py-3 font-medium text-red-400/70">Overdue</th>
                <th className="px-4 py-3 font-medium text-red-400/70">Quote</th>
              </tr></thead>
              <tbody className="divide-y divide-red-500/10">
                {overdueRows.map((row, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-foreground">{row.productName} ×{row.quantity}</td>
                    <td className="px-4 py-3"><p className="text-foreground">{row.customerName}</p>{row.customerPhone && <p className="text-xs text-muted-foreground">{row.customerPhone}</p>}</td>
                    <td className="px-4 py-3 text-red-400">{formatDate(row.hireEndDate)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="border-red-500/30 text-red-400">{row.daysOverdue}d overdue</Badge></td>
                    <td className="px-4 py-3"><Link href={`/admin/quotes/${row.quoteId}`} className="font-mono text-primary text-xs hover:underline">{row.reference}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Currently out */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Currently Out on Hire ({activeRows.length} items)</h2>
        </div>
        {activeRows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card py-16 text-center text-muted-foreground">
            <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No equipment currently out on hire</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Equipment</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Out Since</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Return Date</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Days Left</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Invoice</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Quote</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {activeRows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{row.productName} <span className="text-muted-foreground font-normal">×{row.quantity}</span></td>
                    <td className="px-4 py-3">
                      <p className="text-foreground">{row.customerName}</p>
                      {row.customerPhone && <p className="text-xs text-muted-foreground">{row.customerPhone}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(row.hireStartDate)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{formatDate(row.hireEndDate)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`${row.daysLeft <= 1 ? "border-yellow-500/30 text-yellow-400" : "border-green-500/30 text-green-400"}`}>
                        {row.daysLeft === 0 ? "Due today" : `${row.daysLeft}d left`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {row.invoiceNumber ? (
                        <span className={`text-xs font-mono ${row.invoiceStatus === "PAID" ? "text-green-400" : "text-muted-foreground"}`}>
                          {row.invoiceNumber} · {row.invoiceStatus}
                        </span>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/quotes/${row.quoteId}`} className="font-mono text-primary text-xs hover:underline">{row.reference}</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Going Out Soon — Next 7 Days</h2>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/30 text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Equipment</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Hire Start</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Hire End</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Quote</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {upcoming.flatMap((q) => q.items.map((item, i) => (
                  <tr key={`${q.id}-${i}`} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{item.productName} ×{item.quantity}</td>
                    <td className="px-4 py-3 text-foreground">{q.customerName}</td>
                    <td className="px-4 py-3 text-primary font-medium">{formatDate(q.hireStartDate)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(q.hireEndDate)}</td>
                    <td className="px-4 py-3"><Link href={`/admin/quotes/${q.id}`} className="font-mono text-primary text-xs hover:underline">{q.reference}</Link></td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
