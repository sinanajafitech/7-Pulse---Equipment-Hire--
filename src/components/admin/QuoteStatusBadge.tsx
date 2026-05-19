import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusConfig = {
  PENDING:   { label: "Pending",   className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  REVIEWING: { label: "Reviewing", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  APPROVED:  { label: "Approved",  className: "bg-green-500/20 text-green-400 border-green-500/30" },
  REJECTED:  { label: "Rejected",  className: "bg-red-500/20 text-red-400 border-red-500/30" },
  EXPIRED:   { label: "Expired",   className: "bg-gray-500/20 text-gray-400 border-gray-500/30" },
  RETURNED:  { label: "Returned",  className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
}

export function QuoteStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.PENDING
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  )
}
