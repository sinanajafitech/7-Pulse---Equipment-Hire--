import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { QuoteStatusBadge } from "@/components/admin/QuoteStatusBadge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"

export const metadata = { title: "Quotes" }

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string; search?: string }> }) {
  const params = await searchParams
  const where = {
    ...(params.status ? { status: params.status as "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED" | "EXPIRED" | "RETURNED" } : {}),
    ...(params.search ? { OR: [
      { reference: { contains: params.search, mode: "insensitive" as const } },
      { customerName: { contains: params.search, mode: "insensitive" as const } },
      { customerEmail: { contains: params.search, mode: "insensitive" as const } },
    ]} : {}),
  }

  const quotes = await prisma.quote.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const statusFilters = ["", "PENDING", "REVIEWING", "APPROVED", "RETURNED", "REJECTED", "EXPIRED"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotes</h1>
          <p className="text-muted-foreground">{quotes.length} quote requests</p>
        </div>
      </div>

      <div className="flex gap-2">
        {statusFilters.map((s) => (
          <Link key={s} href={s ? `/admin/quotes?status=${s}` : "/admin/quotes"}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              params.status === s || (!params.status && !s)
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}>
            {s || "All"}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Hire Period</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/quotes/${quote.id}`} className="font-mono text-primary hover:underline text-xs">{quote.reference}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{quote.customerName}</p>
                  <p className="text-xs text-muted-foreground">{quote.customerEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-foreground">{quote.eventType}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(quote.eventDate)}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(quote.hireStartDate)} → {formatDate(quote.hireEndDate)}
                  <p>{quote.hireDays} day{quote.hireDays !== 1 ? "s" : ""}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(Number(quote.grandTotal))}</td>
                <td className="px-4 py-3"><QuoteStatusBadge status={quote.status} /></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(quote.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {quotes.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No quotes found</p>
          </div>
        )}
      </div>
    </div>
  )
}
