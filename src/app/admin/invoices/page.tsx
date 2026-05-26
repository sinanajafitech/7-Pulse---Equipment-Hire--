import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Plus, FileText } from "lucide-react"

export const metadata = { title: "Invoices" }

const statusStyles: Record<string, string> = {
  DRAFT: "border-border text-muted-foreground",
  SENT: "border-blue-500/30 text-blue-400",
  PAID: "border-green-500/30 text-green-400",
  OVERDUE: "border-red-500/30 text-red-400",
  CANCELLED: "border-border text-muted-foreground",
}

export default async function InvoicesPage() {
  const raw = await prisma.invoice.findMany({
    include: { quote: { select: { reference: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const invoices = raw.map((inv) => ({
    ...inv,
    subtotal: Number(inv.subtotal),
    vatAmount: Number(inv.vatAmount),
    total: Number(inv.total),
    depositPaid: Number(inv.depositPaid),
    amountDue: Number(inv.amountDue),
    vatRate: Number(inv.vatRate),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <Button asChild><Link href="/admin/invoices/new"><Plus className="mr-2 h-4 w-4" />New Invoice</Link></Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Number</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Quote</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Amount Due</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Due Date</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-primary text-xs">{inv.number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{inv.customerName}</p>
                  <p className="text-xs text-muted-foreground">{inv.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{inv.quote?.reference ?? "—"}</td>
                <td className="px-4 py-3 font-semibold text-foreground">{formatCurrency(inv.total)}</td>
                <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(inv.amountDue)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(inv.dueDate)}</td>
                <td className="px-4 py-3"><Badge variant="outline" className={statusStyles[inv.status]}>{inv.status}</Badge></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild><Link href={`/admin/invoices/${inv.id}`}>Manage</Link></Button>
                    <Button variant="outline" size="sm" asChild><Link href={`/invoices/${inv.id}`} target="_blank">View</Link></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {invoices.length === 0 && <div className="py-16 text-center text-muted-foreground"><FileText className="mx-auto mb-3 h-8 w-8 opacity-40" /><p>No invoices yet</p></div>}
      </div>
    </div>
  )
}
