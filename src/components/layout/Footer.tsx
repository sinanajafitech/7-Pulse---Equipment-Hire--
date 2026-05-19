import Link from "next/link"
import { Volume2, Mail, Phone } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground">PULSE 7 EVENTS</span>
            </div>
            <p className="text-sm text-muted-foreground">Professional sound & lighting hire for weddings, parties, and corporate events.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Equipment</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/equipment?category=sound-systems" className="hover:text-foreground transition-colors">Sound Systems</Link></li>
              <li><Link href="/equipment?category=lighting" className="hover:text-foreground transition-colors">Lighting</Link></li>
              <li><Link href="/equipment?category=dj-gear" className="hover:text-foreground transition-colors">DJ Gear</Link></li>
              <li><Link href="/equipment?category=event-packages" className="hover:text-foreground transition-colors">Event Packages</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              <li><Link href="/quote" className="hover:text-foreground transition-colors">Get a Quote</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Get in Touch</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <a href="mailto:info@cybercina.co.uk" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4" />info@cybercina.co.uk
              </a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} PULSE 7 EVENTS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
