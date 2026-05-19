import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { QuoteStatusBadge } from "@/components/admin/QuoteStatusBadge"
import { QuoteDetailActions } from "@/components/admin/QuoteDetailActions"
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils"
import { ArrowLeft, FileSignature, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Quote Detail" }

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { include: { product: true } }, deliveryTier: true, contract: true },
  })
  if (!quote) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/quotes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground font-mono">{quote.reference}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          <p className="text-muted-foreground">Received {formatDate(quote.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer</h3>
          <p className="font-medium text-foreground">{quote.customerName}</p>
          <p className="text-sm text-muted-foreground">{quote.customerEmail}</p>
          {quote.customerPhone && <p className="text-sm text-muted-foreground">{quote.customerPhone}</p>}
        </div>
        <div className="rounded-lg border border-border bg-card p-4 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Event</h3>
          <p className="font-medium text-foreground">{quote.eventType}</p>
          <p className="text-sm text-muted-foreground">{formatDate(quote.eventDate)}</p>
          <p className="text-sm text-muted-foreground">{quote.venueAddress}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Hire Period — {formatDateRange(quote.hireStartDate, quote.hireEndDate)} ({quote.hireDays} days)
        </h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 font-medium text-center">Qty</th>
              <th className="pb-2 font-medium text-center">Days</th>
              <th className="pb-2 font-medium text-right">Rate/day</th>
              <th className="pb-2 font-medium text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 font-medium text-foreground">{item.productName}</td>
                <td className="py-2 text-center text-muted-foreground">{item.quantity}</td>
                <td className="py-2 text-center text-muted-foreground">{item.hireDays}</td>
                <td className="py-2 text-right text-muted-foreground">{formatCurrency(Number(item.dailyRate))}</td>
                <td className="py-2 text-right font-semibold text-foreground">{formatCurrency(Number(item.lineTotal))}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border">
              <td colSpan={4} className="pt-3 text-right text-muted-foreground">Equipment subtotal</td>
              <td className="pt-3 text-right font-medium">{formatCurrency(Number(quote.equipmentTotal))}</td>
            </tr>
            {Number(quote.deliveryFee) > 0 && <tr><td colSpan={4} className="text-right text-muted-foreground">Delivery</td><td className="text-right">{formatCurrency(Number(quote.deliveryFee))}</td></tr>}
            {Number(quote.setupFee) > 0 && <tr><td colSpan={4} className="text-right text-muted-foreground">Setup & Collection</td><td className="text-right">{formatCurrency(Number(quote.setupFee))}</td></tr>}
            {Number(quote.extrasTotal) > 0 && <tr><td colSpan={4} className="text-right text-muted-foreground">Extras</td><td className="text-right">{formatCurrency(Number(quote.extrasTotal))}</td></tr>}
            <tr className="border-t border-border">
              <td colSpan={4} className="pt-3 text-right font-bold text-foreground">Grand Total</td>
              <td className="pt-3 text-right font-bold text-primary text-lg">{formatCurrency(Number(quote.grandTotal))}</td>
            </tr>
            <tr><td colSpan={4} className="text-right text-muted-foreground text-xs">Deposit (30%)</td><td className="text-right text-muted-foreground text-xs">{formatCurrency(Number(quote.depositAmount))}</td></tr>
          </tfoot>
        </table>
      </div>

      {quote.notes && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Customer Notes</h3>
          <p className="text-sm text-foreground">{quote.notes}</p>
        </div>
      )}

      {/* Contract panel */}
      {quote.contract ? (
        <div className={`rounded-lg border p-4 flex items-center justify-between gap-4 ${quote.contract.status === "SIGNED" ? "border-green-500/30 bg-green-500/5" : "border-blue-500/30 bg-blue-500/5"}`}>
          <div className="flex items-center gap-3">
            {quote.contract.status === "SIGNED"
              ? <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
              : <Clock className="h-5 w-5 text-blue-400 shrink-0" />
            }
            <div>
              <p className={`text-sm font-medium ${quote.contract.status === "SIGNED" ? "text-green-400" : "text-blue-400"}`}>
                {quote.contract.status === "SIGNED" ? `Contract signed by ${quote.contract.signedAt ? formatDate(quote.contract.signedAt) : "customer"}` : "Contract sent — awaiting signature"}
              </p>
              {quote.contract.signatureName && (
                <p className="text-xs text-muted-foreground">Signed as: {quote.contract.signatureName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={quote.contract.status === "SIGNED" ? "border-green-500/30 text-green-400" : "border-blue-500/30 text-blue-400"}>
              {quote.contract.status}
            </Badge>
            <Link href={`/contracts/${quote.contract.token}`} target="_blank"
              className="flex items-center gap-1.5 text-xs font-medium text-primary border border-primary/30 bg-primary/10 rounded-lg px-3 py-1.5 hover:bg-primary/20 transition-colors">
              <FileSignature className="h-3.5 w-3.5" />View Contract
            </Link>
          </div>
        </div>
      ) : quote.status === "APPROVED" ? (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-400">
          No contract yet — contract is auto-created when the quote is first approved. Re-save as Approved to generate one.
        </div>
      ) : null}

      <QuoteDetailActions
        quoteId={quote.id}
        currentStatus={quote.status}
        currentAdminNotes={quote.adminNotes ?? ""}
        quoteItems={quote.items.map((i) => ({ productName: i.productName, quantity: i.quantity }))}
      />
    </div>
  )
}
