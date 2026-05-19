import { Suspense } from "react"
import { QuoteBuilder } from "@/components/quote/QuoteBuilder"

export const metadata = { title: "Build Your Quote" }

export default function QuotePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Build Your Quote</h1>
        <p className="text-muted-foreground mt-1">Add equipment, set dates, and get an instant price estimate</p>
      </div>
      <Suspense>
        <QuoteBuilder />
      </Suspense>
    </div>
  )
}
