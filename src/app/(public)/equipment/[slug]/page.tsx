import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Volume2, Zap, Weight, Maximize, Play } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { AddToQuoteButton } from "@/components/equipment/AddToQuoteButton"
import type { Metadata } from "next"

function getYoutubeEmbedId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0]
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v")
      if (v) return v
      const parts = u.pathname.split("/")
      const embedIdx = parts.indexOf("embed")
      if (embedIdx !== -1) return parts[embedIdx + 1]
    }
    return null
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = await prisma.product.findUnique({ where: { slug }, include: { category: true } })
  if (!product) return { title: "Product Not Found" }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  const url = `${base}/equipment/${product.slug}`

  const rawDesc = product.shortDesc ?? product.description
  const description = rawDesc.length > 155
    ? rawDesc.slice(0, 152).replace(/\s\S*$/, "") + "..."
    : rawDesc

  const ogImages = (product.images as string[])[0]
    ? [{ url: (product.images as string[])[0], width: 1200, height: 630, alt: product.name }]
    : []

  return {
    title: product.name,
    description,
    keywords: [
      product.name,
      `${product.name} hire`,
      product.category.name,
      `${product.category.name} hire`,
      ...(product.tags as string[]),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${product.name} | PULSE 7 EVENTS`,
      description,
      url,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | PULSE 7 EVENTS`,
      description,
      images: (product.images as string[])[0] ? [(product.images as string[])[0]] : [],
    },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await prisma.product.findUnique({
    where: { slug, isAvailable: true },
    include: { category: true },
  })
  if (!product) notFound()

  const serialized = {
    ...product,
    dailyRate: Number(product.dailyRate),
    weeklyRate: product.weeklyRate ? Number(product.weeklyRate) : null,
    depositRate: Number(product.depositRate),
  }
  const specs = product.specs as Record<string, string> | null
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc ?? product.description,
    image: product.images,
    sku: product.id,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      price: serialized.dailyRate,
      priceCurrency: "GBP",
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      url: `${base}/equipment/${product.slug}`,
    },
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative h-80 lg:h-[480px] w-full rounded-2xl overflow-hidden bg-muted">
            {product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center"><Volume2 className="h-20 w-20 text-muted-foreground/30" /></div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.slice(1).map((img, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden bg-muted">
                  <Image src={img} alt={`${product.name} ${i + 2}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <Badge variant="outline" className="mb-3">{product.category.name}</Badge>
            <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
            <p className="text-muted-foreground mt-2">{product.shortDesc}</p>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{formatCurrency(Number(product.dailyRate))}</span>
            <span className="text-muted-foreground">/ day</span>
            {product.weeklyRate && (
              <span className="text-sm text-muted-foreground ml-2">· {formatCurrency(Number(product.weeklyRate))}/week</span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {product.powerW && <span className="flex items-center gap-1"><Zap className="h-4 w-4" />{product.powerW}W</span>}
            {product.weightKg && <span className="flex items-center gap-1"><Weight className="h-4 w-4" />{product.weightKg}kg</span>}
            {product.dimensions && <span className="flex items-center gap-1"><Maximize className="h-4 w-4" />{product.dimensions}</span>}
          </div>

          <AddToQuoteButton product={serialized} size="lg" />

          <p className="text-sm text-foreground leading-relaxed">{product.description}</p>

          {specs && Object.keys(specs).length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Technical Specifications</h3>
              <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex px-4 py-3 text-sm">
                    <span className="w-40 font-medium text-muted-foreground shrink-0">{key}</span>
                    <span className="text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.youtubeUrl && (() => {
            const videoId = getYoutubeEmbedId(product.youtubeUrl)
            return videoId ? (
              <div>
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-red-600"><Play className="h-3 w-3 fill-white text-white" /></span>
                  Watch it in action
                </h3>
                <div className="relative w-full rounded-xl overflow-hidden border border-border bg-black aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={`${product.name} video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 h-full w-full"
                  />
                </div>
              </div>
            ) : null
          })()}

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
