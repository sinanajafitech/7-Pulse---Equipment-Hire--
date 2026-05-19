import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatCurrency, formatDate, formatDateRange } from "@/lib/utils"
import { ContractSignForm } from "@/components/ContractSignForm"
import { FileText } from "lucide-react"
import { COMPANY_NAME, COMPANY_EMAIL } from "@/lib/contractTerms"
import { PrintButton } from "@/components/PrintButton"

export default async function ContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const contract = await prisma.contract.findUnique({
    where: { token },
    include: { quote: { select: { reference: true, hireDays: true } } },
  })
  if (!contract) notFound()

  const equipment = contract.equipmentList as Array<{
    name: string; quantity: number; dailyRate: number; lineTotal: number; replacementPrice: number | null
  }>
  const hasReplacementValues = equipment.some((e) => e.replacementPrice)
  const isSigned = contract.status === "SIGNED"
  const isTypedSig = contract.signatureData?.startsWith("typed:")
  const typedName = isTypedSig ? contract.signatureData!.replace("typed:", "") : null

  // Shared contract document (used for both unsigned and signed views)
  const contractDoc = (
    <div className="max-w-3xl mx-auto p-6 md:p-10">

      {/* Print/PDF button — hidden when printing */}
      {isSigned && (
        <div className="print:hidden mb-6 flex justify-end">
          <PrintButton />
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 print:border-0 print:rounded-none print:p-0 print:mb-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{COMPANY_NAME}</h1>
            <p className="text-gray-500 text-sm">Equipment Hire Agreement</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono font-semibold text-gray-800">{contract.quote?.reference}</p>
            <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${isSigned ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {isSigned ? "✓ Signed" : "Awaiting Signature"}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Customer</p>
            <p className="font-semibold text-gray-900">{contract.customerName}</p>
            <p className="text-gray-600">{contract.customerEmail}</p>
            {contract.customerPhone && <p className="text-gray-600">{contract.customerPhone}</p>}
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Event Details</p>
            <p className="font-semibold text-gray-900">{contract.eventType}</p>
            <p className="text-gray-600">{formatDate(contract.eventDate)}</p>
            <p className="text-gray-600 text-xs">{contract.venueAddress}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Hire Period</p>
            <p className="font-semibold text-gray-900">{formatDateRange(contract.hireStartDate, contract.hireEndDate)}</p>
            <p className="text-gray-600 text-xs">{contract.quote?.hireDays} days</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(contract.grandTotal))}</p>
            <p className="text-gray-500 text-xs">Deposit: {formatCurrency(Number(contract.depositAmount))}</p>
          </div>
        </div>
      </div>

      {/* Equipment Schedule */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 print:border-0 print:rounded-none print:p-0 print:mb-8">
        <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400 print:hidden" />Equipment Schedule
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="pb-2">Item</th>
              <th className="pb-2 text-center">Qty</th>
              <th className="pb-2 text-right">Hire Total</th>
              {hasReplacementValues && <th className="pb-2 text-right text-red-600">Replacement Value</th>}
            </tr>
          </thead>
          <tbody>
            {equipment.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2.5 font-medium text-gray-900">{item.name}</td>
                <td className="py-2.5 text-center text-gray-500">{item.quantity}</td>
                <td className="py-2.5 text-right text-gray-900">{formatCurrency(item.lineTotal)}</td>
                {hasReplacementValues && (
                  <td className="py-2.5 text-right text-red-600 font-medium">
                    {item.replacementPrice ? formatCurrency(item.replacementPrice) : "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-900">
              <td colSpan={2} className="pt-3 font-bold text-gray-900">Grand Total</td>
              <td className="pt-3 text-right font-bold text-gray-900 text-base">{formatCurrency(Number(contract.grandTotal))}</td>
              {hasReplacementValues && (
                <td className="pt-3 text-right font-bold text-red-600">
                  {formatCurrency(equipment.reduce((s, e) => s + (e.replacementPrice ?? 0), 0))}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
        {hasReplacementValues && (
          <p className="text-xs text-gray-400 mt-3">
            * Replacement values are the liability of the customer in the event of loss or irreparable damage.
          </p>
        )}
      </div>

      {/* Terms & Conditions */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 print:border-0 print:rounded-none print:p-0 print:mb-8">
        <h2 className="font-bold text-gray-900 mb-4">Terms & Conditions</h2>
        <div className={`text-xs text-gray-600 leading-relaxed whitespace-pre-line ${isSigned ? "" : "max-h-72 overflow-y-auto"} border border-gray-100 rounded-xl p-4 bg-gray-50 print:border-0 print:bg-white print:rounded-none print:p-0`}>
          {contract.terms}
        </div>
      </div>

      {/* Signature block */}
      {isSigned ? (
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6 mb-6 print:border print:border-gray-300 print:rounded-none">
          <h2 className="font-bold text-gray-900 mb-4">Electronic Signature</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Signature</p>
              {isTypedSig ? (
                <div className="border border-gray-200 rounded-xl bg-gray-50 px-6 py-4 min-h-[80px] flex items-center">
                  <span className="text-2xl text-gray-800" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
                    {typedName}
                  </span>
                </div>
              ) : contract.signatureData ? (
                <div className="border border-gray-200 rounded-xl bg-gray-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={contract.signatureData} alt="Customer signature" className="max-h-20 w-full object-contain" />
                </div>
              ) : null}
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Signed By</p>
                <p className="font-semibold text-gray-900">{contract.signatureName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date & Time</p>
                <p className="text-gray-700">{contract.signedAt ? new Date(contract.signedAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" }) : "—"}</p>
              </div>
              {contract.signedIp && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">IP Address</p>
                  <p className="text-gray-500 font-mono text-xs">{contract.signedIp}</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-xs text-green-700">
              ✓ This document was signed electronically under the <strong>Electronic Communications Act 2000</strong>.
              The signature, timestamp and IP address above constitute a legally binding agreement.
            </p>
          </div>
        </div>
      ) : (
        <ContractSignForm token={token} customerName={contract.customerName} />
      )}

      <p className="text-center text-xs text-gray-400 mt-6 print:mt-8">
        {COMPANY_NAME} · {COMPANY_EMAIL} · Ref: {contract.quote?.reference}
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
      <style>{`
        @media print {
          @page { margin: 15mm 15mm 15mm 15mm; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      {contractDoc}
    </div>
  )
}
