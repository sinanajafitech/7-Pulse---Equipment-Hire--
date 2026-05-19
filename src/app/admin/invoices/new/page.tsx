import { prisma } from "@/lib/prisma"
import { NewInvoiceForm } from "@/components/admin/NewInvoiceForm"

export const metadata = { title: "New Invoice" }

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ quoteId?: string }> }) {
  const { quoteId } = await searchParams

  const [approvedQuotes, pricingConfig] = await Promise.all([
    prisma.quote.findMany({
      where: { status: "APPROVED", invoice: null },
      select: { id: true, reference: true, customerName: true, customerEmail: true, customerPhone: true, venueAddress: true, grandTotal: true, depositAmount: true, items: { select: { productName: true, quantity: true, hireDays: true, dailyRate: true, lineTotal: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pricingConfig.findFirst({ where: { isActive: true } }),
  ])

  const quotes = approvedQuotes.map((q) => ({
    ...q,
    grandTotal: Number(q.grandTotal),
    depositAmount: Number(q.depositAmount),
    items: q.items.map((i) => ({ ...i, dailyRate: Number(i.dailyRate), lineTotal: Number(i.lineTotal) })),
  }))

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">New Invoice</h1><p className="text-muted-foreground">Create an invoice manually or import from an approved quote</p></div>
      <NewInvoiceForm
        approvedQuotes={quotes}
        defaultVatRate={pricingConfig ? Number(pricingConfig.vatRate) : 0.20}
        preloadQuoteId={quoteId}
      />
    </div>
  )
}
