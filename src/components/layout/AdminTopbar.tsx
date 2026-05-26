"use client"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

const pathLabels: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  quotes: "Quotes",
  enquiries: "Enquiries",
  pricing: "Pricing",
  new: "New",
}

export function AdminTopbar({ userName }: { userName?: string | null }) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 print:hidden">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Home className="h-3.5 w-3.5" />
        {segments.map((segment, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            <span className={i === segments.length - 1 ? "text-foreground font-medium" : ""}>
              {pathLabels[segment] ?? segment}
            </span>
          </span>
        ))}
      </nav>
      {userName && (
        <span className="text-sm text-muted-foreground">
          {userName}
        </span>
      )}
    </header>
  )
}
