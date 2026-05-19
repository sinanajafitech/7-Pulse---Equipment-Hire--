import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { MessageSquare } from "lucide-react"
import { EnquiryActions } from "@/components/admin/EnquiryActions"

export const metadata = { title: "Enquiries" }

export default async function EnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Enquiries</h1>
        <p className="text-muted-foreground">{enquiries.filter((e) => e.status === "UNREAD").length} unread</p>
      </div>

      <div className="space-y-3">
        {enquiries.map((enq) => (
          <div key={enq.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground">{enq.name}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{enq.email}</span>
                  {enq.phone && <><span className="text-muted-foreground">·</span><span className="text-sm text-muted-foreground">{enq.phone}</span></>}
                </div>
                {enq.subject && <p className="text-sm font-medium text-foreground mb-1">{enq.subject}</p>}
                <p className="text-sm text-muted-foreground">{enq.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(enq.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline" className={
                  enq.status === "UNREAD" ? "border-yellow-500/30 text-yellow-400" :
                  enq.status === "READ" ? "border-blue-500/30 text-blue-400" :
                  "border-green-500/30 text-green-400"
                }>
                  {enq.status}
                </Badge>
                <EnquiryActions enquiryId={enq.id} currentStatus={enq.status} />
              </div>
            </div>
          </div>
        ))}
        {enquiries.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No enquiries yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
