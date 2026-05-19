import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { QuoteCartProvider } from "@/contexts/QuoteCartContext"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"),
  title: { default: "PULSE 7 EVENTS — Sound & Lighting Hire", template: "%s | PULSE 7 EVENTS" },
  description: "Professional sound systems, lighting equipment, and DJ gear hire for weddings, parties, and corporate events across the UK.",
  keywords: ["sound hire", "lighting hire", "PA hire", "DJ equipment hire", "event equipment", "wedding sound system", "party lighting hire"],
  openGraph: {
    type: "website",
    siteName: "PULSE 7 EVENTS",
    title: "PULSE 7 EVENTS — Sound & Lighting Hire",
    description: "Professional sound systems, lighting equipment, and DJ gear hire for weddings, parties, and corporate events.",
    images: [{ url: "/hero-bg.jpg", width: 1280, height: 853, alt: "PULSE 7 EVENTS — Sound & Lighting Hire" }],
  },
  twitter: { card: "summary_large_image", title: "PULSE 7 EVENTS", description: "Professional AV hire for any event." },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, Helvetica, sans-serif" }} className="antialiased">
        <QuoteCartProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QuoteCartProvider>
      </body>
    </html>
  )
}
