import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils"
import { QuoteStatusBadge } from "@/components/admin/QuoteStatusBadge"

export const dynamic = "force-dynamic"

export default async function CustomerDetailPage({ params }: { params: Promise<{ email: string }> }) {
  const { email } = await params
  const decodedEmail = decodeURIComponent(email)

  const quotes = await prisma.quote.findMany({
    where: { customerEmail: { equals: decodedEmail } },
    include: { items: true, contract: { select: { status: true, token: true } } },
    orderBy: { createdAt: "desc" },
  })

  if (quotes.length === 0) notFound()

  const customer = quotes[0]
  const totalSpent = quotes.reduce((s, q) => s + Number(q.grandTotal), 0)
  const confirmedHires = quotes.filter((q) => ["APPROVED", "RETURNED"].includes(q.status)).length

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/customers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{customer.customerName}</h1>
          <div className="flex items-center gap-4 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />{customer.customerEmail}
            </span>
            {customer.customerPhone && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />{customer.customerPhone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Quotes", value: quotes.length },
          { label: "Confirmed Hires", value: confirmedHires },
          { label: "Total Spent", value: formatCurrency(totalSpent) },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Hire history */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Hire History</h2>
        <div className="space-y-3">
          {quotes.map((quote) => (
            <div key={quote.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link href={`/admin/quotes/${quote.id}`} className="font-mono text-primary text-sm hover:underline">
                      {quote.reference}
                    </Link>
                    <QuoteStatusBadge status={quote.status} />
                    {quote.contract && (
                      <Link href={`/contracts/${quote.contract.token}`} target="_blank"
                        className="text-xs text-blue-400 hover:underline border border-blue-400/30 bg-blue-400/10 rounded-full px-2 py-0.5">
                        {quote.contract.status === "SIGNED" ? "✓ Signed" : "Contract"}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{quote.eventType} · {quote.venueAddress}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateRange(quote.hireStartDate, quote.hireEndDate)} · {formatDate(quote.createdAt)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {quote.items.map((item, i) => (
                      <span key={i} className="text-xs bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                        {item.productName} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-primary">{formatCurrency(Number(quote.grandTotal))}</p>
                  <p className="text-xs text-muted-foreground">{quote.hireDays} day{quote.hireDays !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
