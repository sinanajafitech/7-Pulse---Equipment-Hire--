import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Users, Mail, Phone } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const metadata = { title: "Customers" }
export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  const quotes = await prisma.quote.findMany({
    select: {
      id: true, customerName: true, customerEmail: true, customerPhone: true,
      grandTotal: true, status: true, createdAt: true, eventType: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Group by email
  const customerMap = new Map<string, {
    name: string; email: string; phone: string | null
    quotes: typeof quotes; totalSpent: number; lastHire: Date
  }>()

  for (const q of quotes) {
    const key = q.customerEmail.toLowerCase()
    const existing = customerMap.get(key)
    if (existing) {
      existing.quotes.push(q)
      existing.totalSpent += Number(q.grandTotal)
      if (q.createdAt > existing.lastHire) existing.lastHire = q.createdAt
    } else {
      customerMap.set(key, {
        name: q.customerName, email: q.customerEmail, phone: q.customerPhone,
        quotes: [q], totalSpent: Number(q.grandTotal), lastHire: q.createdAt,
      })
    }
  }

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.lastHire.getTime() - a.lastHire.getTime())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="text-muted-foreground">{customers.length} unique customers</p>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total Hires</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Total Spent</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Hire</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event Types</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((c) => {
              const eventTypes = [...new Set(c.quotes.map((q) => q.eventType))]
              const approvedCount = c.quotes.filter((q) => ["APPROVED", "RETURNED"].includes(q.status)).length
              return (
                <tr key={c.email} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/admin/customers/${encodeURIComponent(c.email)}`}
                      className="font-medium text-foreground hover:text-primary transition-colors">
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 space-y-0.5">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Mail className="h-3 w-3" />{c.email}
                    </div>
                    {c.phone && <div className="flex items-center gap-1 text-muted-foreground text-xs"><Phone className="h-3 w-3" />{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{c.quotes.length}</div>
                    {approvedCount > 0 && <div className="text-xs text-muted-foreground">{approvedCount} confirmed</div>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(c.lastHire)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {eventTypes.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No customers yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
