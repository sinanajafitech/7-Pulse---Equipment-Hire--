import { prisma } from "@/lib/prisma"
import { connection } from "next/server"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Lightbulb, Disc3, Package, ChevronRight, Star, ArrowRight } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AddToQuoteButton } from "@/components/equipment/AddToQuoteButton"

const categoryIcons = { Volume2, Lightbulb, Disc3, Package }

export default async function HomePage() {
  await connection()

  const [rawFeatured, categories, brands] = await Promise.all([
    prisma.product.findMany({ where: { isFeatured: true, isAvailable: true }, include: { category: true }, take: 6 }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { isAvailable: true } } } } } }),
    prisma.brand.findMany({ where: { isVisible: true }, orderBy: { sortOrder: "asc" } }),
  ])

  const featuredProducts = rawFeatured.map((p) => ({
    ...p,
    dailyRate: Number(p.dailyRate),
    weeklyRate: p.weeklyRate ? Number(p.weeklyRate) : null,
    depositRate: Number(p.depositRate),
  }))

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-32 lg:py-48">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image src="/hero-bg.jpg" alt="Sound mixing desk" fill className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-black/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-6 bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
            Professional AV Hire
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl drop-shadow-lg">
            Premium Sound & Lighting<br />
            <span className="text-gradient-amber">For Every Event</span>
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-2xl mx-auto">
            Professional audio and lighting equipment hire for weddings, parties, concerts, and corporate events. Get an instant quote in minutes.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-base">
              <Link href="/quote">Build Your Quote <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base border-white/40 text-white hover:bg-white/10">
              <Link href="/equipment">Browse Equipment</Link>
            </Button>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-white/70">
            <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-primary text-primary" /><span>500+ Events</span></div>
            <div className="w-px h-4 bg-white/30" />
            <span>Free Local Delivery</span>
            <div className="w-px h-4 bg-white/30" />
            <span>Same-Day Setup</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-card/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">What Are You Hiring?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconName = cat.iconName as keyof typeof categoryIcons
              const Icon = categoryIcons[IconName] ?? Package
              return (
                <Link key={cat.id} href={`/equipment?category=${cat.slug}`}
                  className="group rounded-2xl border border-border bg-card p-6 text-center hover:border-primary/50 hover:bg-card/80 transition-all duration-200">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{cat._count.products} items</p>
                  <ChevronRight className="mx-auto mt-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground mt-2">Get your equipment in three simple steps</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Browse & Select", desc: "Choose from our professional equipment catalogue and add items to your quote." },
              { step: "02", title: "Build Your Quote", desc: "Set your hire dates, select delivery and any extras. See live pricing instantly." },
              { step: "03", title: "Confirm & Relax", desc: "Submit your quote. We'll confirm availability and deliver, set up, and collect." },
            ].map((item) => (
              <div key={item.step} className="text-center rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm px-6 py-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">{item.step}</div>
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 bg-card/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Popular Equipment</h2>
                <p className="text-muted-foreground mt-1">Our most-hired items</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/equipment">View All <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-200">
                  <Link href={`/equipment/${product.slug}`}>
                    <div className="relative h-48 bg-muted overflow-hidden">
                      {product.images[0] ? (
                        <Image src={product.images[0]} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><Volume2 className="h-12 w-12 text-muted-foreground/30" /></div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-xs">{product.category.name}</Badge>
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link href={`/equipment/${product.slug}`}>
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{product.shortDesc}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-primary">{formatCurrency(Number(product.dailyRate))}</span>
                        <span className="text-sm text-muted-foreground">/day</span>
                      </div>
                      <AddToQuoteButton product={product} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">What Our Clients Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", event: "Wedding, July 2024", quote: "The sound quality was incredible. Our guests kept complimenting the music all night. Setup was seamless and the team were professional." },
              { name: "David K.", event: "Corporate Event, March 2024", quote: "Used PULSE 7 EVENTS for our annual conference. The PA system was crystal clear for 300 guests. Will definitely hire again." },
              { name: "Emma & Jack", event: "Birthday Party, Sep 2024", quote: "The lighting rig transformed our venue completely. The quote process was so easy and pricing was very fair." },
            ].map((t) => (
              <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
                <div className="flex gap-0.5 mb-3">
                  {Array(5).fill(0).map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brands */}
      {brands.length > 0 && (
        <section className="py-16 bg-card/50 border-y border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-8">
              Brands We Work With
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
              {brands.map((brand) =>
                brand.logoUrl ? (
                  <a
                    key={brand.id}
                    href={brand.website ?? undefined}
                    target={brand.website ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="group relative flex h-12 w-28 items-center justify-center transition-all duration-200 opacity-50 hover:opacity-100 grayscale hover:grayscale-0"
                    title={brand.name}
                  >
                    <Image
                      src={brand.logoUrl}
                      alt={brand.name}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </a>
                ) : (
                  <span
                    key={brand.id}
                    className="text-sm font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {brand.name}
                  </span>
                )
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-primary/5 border-y border-primary/10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Make Your Event Unforgettable?</h2>
          <p className="text-muted-foreground mb-8">Build your custom quote in minutes. No obligation — we&apos;ll confirm everything within 24 hours.</p>
          <Button size="lg" asChild className="text-base">
            <Link href="/quote">Build Your Quote Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
