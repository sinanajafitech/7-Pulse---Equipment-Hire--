"use client"
import { usePathname } from "next/navigation"
import { ChevronRight, Home, Menu } from "lucide-react"

const pathLabels: Record<string, string> = {
  admin: "Dashboard",
  products: "Products",
  quotes: "Quotes",
  enquiries: "Enquiries",
  pricing: "Pricing",
  invoices: "Invoices",
  blog: "Blog",
  brands: "Brands",
  customers: "Customers",
  "equipment-out": "Equipment Out",
  platform: "Platform",
  checklist: "Checklist",
  new: "New",
}

interface Props {
  userName?: string | null
  onMenuToggle?: () => void
}

export function AdminTopbar({ userName, onMenuToggle }: Props) {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  return (
    <header className="flex h-14 lg:h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6 print:hidden shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 overflow-hidden">
          <Home className="h-3.5 w-3.5 shrink-0" />
          {segments.map((segment, i) => (
            <span key={i} className="flex items-center gap-1 min-w-0">
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className={`truncate ${i === segments.length - 1 ? "text-foreground font-medium" : ""}`}>
                {pathLabels[segment] ?? segment}
              </span>
            </span>
          ))}
        </nav>
      </div>

      {userName && (
        <span className="text-sm text-muted-foreground shrink-0 ml-4 hidden sm:block">{userName}</span>
      )}
    </header>
  )
}
