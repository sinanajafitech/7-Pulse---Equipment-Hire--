import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { formatDate, formatDateRange } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DeliveryChecklistClient } from "@/components/admin/DeliveryChecklistClient"

export const metadata = { title: "Delivery Checklist" }

export default async function DeliveryChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { items: { orderBy: { productName: "asc" } } },
  })
  if (!quote) notFound()

  const items = quote.items.map((item) => ({
    id: item.id,
    productName: item.productName,
    quantity: item.quantity,
  }))

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-4 print:hidden">
        <Link href={`/admin/quotes/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Delivery Checklist</h1>
      </div>

      <DeliveryChecklistClient
        reference={quote.reference}
        customerName={quote.customerName}
        customerPhone={quote.customerPhone ?? ""}
        eventType={quote.eventType}
        eventDate={formatDate(quote.eventDate)}
        venueAddress={quote.venueAddress}
        hirePeriod={formatDateRange(quote.hireStartDate, quote.hireEndDate)}
        items={items}
      />
    </div>
  )
}
