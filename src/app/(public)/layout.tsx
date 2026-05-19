import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { QuoteCartProvider } from "@/contexts/QuoteCartContext"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuoteCartProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </QuoteCartProvider>
  )
}
