import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { InvoiceStatusActions } from "@/components/admin/InvoiceStatusActions"

export const metadata = { title: "Invoice" }

const statusStyles: Record<string, string> = {
  DRAFT: "border-border text-muted-foreground",
  SENT: "border-blue-500/30 text-blue-400",
  PAID: "border-green-500/30 text-green-400",
  OVERDUE: "border-red-500/30 text-red-400",
  CANCELLED: "border-border text-muted-foreground",
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await prisma.invoice.findUnique({ where: { id }, include: { items: true, quote: true } })
  if (!raw) notFound()

  const inv = {
    ...raw,
    subtotal: Number(raw.subtotal),
    vatAmount: Number(raw.vatAmount),
    total: Number(raw.total),
    depositPaid: Number(raw.depositPaid),
    amountDue: Number(raw.amountDue),
    vatRate: Number(raw.vatRate),
    items: raw.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), total: Number(i.total) })),
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/invoices" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground font-mono">{inv.number}</h1>
            <Badge variant="outline" className={statusStyles[inv.status]}>{inv.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Issued {formatDate(inv.issueDate)} · Due {formatDate(inv.dueDate)}</p>
        </div>
        <Button variant="outline" asChild><Link href={`/invoices/${inv.id}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" />Print / PDF</Link></Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card p-4 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Customer</p>
          <p className="font-medium text-foreground">{inv.customerName}</p>
          <p className="text-sm text-muted-foreground">{inv.customerEmail}</p>
          {inv.customerPhone && <p className="text-sm text-muted-foreground">{inv.customerPhone}</p>}
          {inv.customerAddress && <p className="text-sm text-muted-foreground whitespace-pre-line">{inv.customerAddress}</p>}
        </div>
        {inv.quote && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Linked Quote</p>
            <Link href={`/admin/quotes/${inv.quote.id}`} className="font-mono text-primary hover:underline">{inv.quote.reference}</Link>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-muted-foreground text-left">
            <th className="pb-2 font-medium">Description</th>
            <th className="pb-2 font-medium text-center">Qty</th>
            <th className="pb-2 font-medium text-right">Unit</th>
            <th className="pb-2 font-medium text-right">Total</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {inv.items.map((item) => (
              <tr key={item.id}>
                <td className="py-2 text-foreground">{item.description}</td>
                <td className="py-2 text-center text-muted-foreground">{item.quantity}</td>
                <td className="py-2 text-right text-muted-foreground">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right font-medium text-foreground">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border"><td colSpan={3} className="pt-3 text-right text-muted-foreground">Subtotal</td><td className="pt-3 text-right">{formatCurrency(inv.subtotal)}</td></tr>
            {inv.vatRate > 0 && <tr><td colSpan={3} className="text-right text-muted-foreground">VAT ({(inv.vatRate * 100).toFixed(0)}%)</td><td className="text-right">{formatCurrency(inv.vatAmount)}</td></tr>}
            <tr><td colSpan={3} className="text-right font-bold text-foreground">Total</td><td className="text-right font-bold text-primary text-lg">{formatCurrency(inv.total)}</td></tr>
            {inv.depositPaid > 0 && <tr><td colSpan={3} className="text-right text-muted-foreground">Deposit Paid</td><td className="text-right text-green-400">-{formatCurrency(inv.depositPaid)}</td></tr>}
            <tr className="border-t border-border"><td colSpan={3} className="pt-2 text-right font-bold text-foreground">Amount Due</td><td className="pt-2 text-right font-bold text-primary text-xl">{formatCurrency(inv.amountDue)}</td></tr>
          </tfoot>
        </table>
      </div>

      {inv.notes && <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Notes</p><p className="text-sm">{inv.notes}</p></div>}
      {inv.terms && <div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Terms</p><p className="text-sm text-muted-foreground">{inv.terms}</p></div>}

      <InvoiceStatusActions invoiceId={inv.id} currentStatus={inv.status} />
    </div>
  )
}
