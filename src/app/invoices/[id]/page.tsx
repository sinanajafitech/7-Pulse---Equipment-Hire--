import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PrintButton } from "@/components/PrintButton"

export default async function PrintableInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const raw = await prisma.invoice.findUnique({
    where: { id },
    include: {
      items: true,
      quote: {
        include: { items: { include: { product: { select: { replacementPrice: true } } } } },
      },
    },
  })
  if (!raw) notFound()

  // Build replacement value map from quote items
  const replacementMap: Record<string, number | null> = {}
  if (raw.quote?.items) {
    for (const qi of raw.quote.items) {
      replacementMap[qi.productName] = qi.product.replacementPrice ? Number(qi.product.replacementPrice) : null
    }
  }
  const hasReplacements = Object.values(replacementMap).some((v) => v !== null)

  const inv = {
    ...raw,
    subtotal: Number(raw.subtotal), vatAmount: Number(raw.vatAmount),
    total: Number(raw.total), depositPaid: Number(raw.depositPaid),
    amountDue: Number(raw.amountDue), vatRate: Number(raw.vatRate),
    items: raw.items.map((i) => ({ ...i, unitPrice: Number(i.unitPrice), total: Number(i.total) })),
  }

  return (
    <div className="min-h-screen bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="max-w-3xl mx-auto p-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-3xl font-bold text-black">PULSE 7 EVENTS</h1>
            <p className="text-gray-500 text-sm mt-1">Sound & Lighting Hire</p>
            <p className="text-gray-500 text-sm">info@cybercina.co.uk</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-black">{inv.number}</div>
            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
              inv.status === "PAID" ? "bg-green-100 text-green-700" :
              inv.status === "OVERDUE" ? "bg-red-100 text-red-700" :
              inv.status === "SENT" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
            }`}>{inv.status}</div>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bill To</p>
            <p className="font-semibold text-black">{inv.customerName}</p>
            <p className="text-gray-600 text-sm">{inv.customerEmail}</p>
            {inv.customerPhone && <p className="text-gray-600 text-sm">{inv.customerPhone}</p>}
            {inv.customerAddress && <p className="text-gray-600 text-sm whitespace-pre-line">{inv.customerAddress}</p>}
          </div>
          <div>
            <div className="mb-2"><p className="text-xs text-gray-400 uppercase tracking-wide">Issue Date</p><p className="font-medium">{formatDate(inv.issueDate)}</p></div>
            <div><p className="text-xs text-gray-400 uppercase tracking-wide">Due Date</p><p className="font-medium">{formatDate(inv.dueDate)}</p></div>
            {inv.quote && <div className="mt-2"><p className="text-xs text-gray-400 uppercase tracking-wide">Quote Ref</p><p className="font-mono text-sm">{inv.quote.reference}</p></div>}
          </div>
        </div>

        {/* Items table */}
        <table className="w-full text-sm mb-8">
          <thead><tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 font-semibold text-gray-700">Description</th>
            <th className="text-center py-2 font-semibold text-gray-700">Qty</th>
            <th className="text-right py-2 font-semibold text-gray-700">Unit Price</th>
            <th className="text-right py-2 font-semibold text-gray-700">Total</th>
            {hasReplacements && <th className="text-right py-2 font-semibold text-red-600">Replacement Value</th>}
          </tr></thead>
          <tbody>
            {inv.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100">
                <td className="py-3">{item.description}</td>
                <td className="py-3 text-center text-gray-500">{item.quantity}</td>
                <td className="py-3 text-right text-gray-500">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{formatCurrency(item.total)}</td>
                {hasReplacements && (
                  <td className="py-3 text-right text-red-600 font-medium">
                    {replacementMap[item.description] ? formatCurrency(replacementMap[item.description]!) : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(inv.subtotal)}</span></div>
            {inv.vatRate > 0 && <div className="flex justify-between"><span className="text-gray-500">VAT ({(inv.vatRate * 100).toFixed(0)}%)</span><span>{formatCurrency(inv.vatAmount)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2"><span>Total</span><span>{formatCurrency(inv.total)}</span></div>
            {inv.depositPaid > 0 && <div className="flex justify-between text-green-600"><span>Deposit Paid</span><span>-{formatCurrency(inv.depositPaid)}</span></div>}
            <div className="flex justify-between font-bold text-xl border-t-2 border-black pt-2"><span>Amount Due</span><span>{formatCurrency(inv.amountDue)}</span></div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(inv.notes || inv.terms) && (
          <div className="mt-12 pt-6 border-t border-gray-200 space-y-4 text-sm text-gray-600">
            {inv.notes && <div><p className="font-semibold text-gray-800 mb-1">Notes</p><p>{inv.notes}</p></div>}
            {inv.terms && <div><p className="font-semibold text-gray-800 mb-1">Payment Terms</p><p>{inv.terms}</p></div>}
          </div>
        )}

        {/* Print button — hidden when printing */}
        {hasReplacements && (
          <div className="mt-8 p-4 rounded-lg border border-red-200 bg-red-50">
            <p className="text-sm font-semibold text-red-700 mb-1">Equipment Replacement Values</p>
            <p className="text-xs text-red-600">
              The replacement values listed above represent the cost to replace equipment in the event of loss or irreparable damage during the hire period.
              The hirer is liable for these amounts as set out in the hire agreement terms and conditions.
            </p>
          </div>
        )}

        <div className="mt-10 print:hidden">
          <PrintButton />
        </div>
      </div>
    </div>
  )
}
