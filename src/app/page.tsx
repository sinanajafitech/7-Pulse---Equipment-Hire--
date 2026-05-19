import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import PublicHome from "./(public)/page"


export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <PublicHome />
      </main>
      <Footer />
    </div>
  )
}
