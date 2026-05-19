import { prisma } from "@/lib/prisma"
import { PricingConfigForm } from "@/components/admin/PricingConfigForm"

export const metadata = { title: "Pricing" }

export default async function PricingPage() {
  const raw = await prisma.pricingConfig.findFirst({
    where: { isActive: true },
    include: {
      deliveryTiers: { orderBy: { sortOrder: "asc" } },
      extras: { orderBy: { sortOrder: "asc" } },
    },
  })

  const config = raw
    ? {
        ...raw,
        setupFee: Number(raw.setupFee),
        vatRate: Number(raw.vatRate),
        deliveryTiers: raw.deliveryTiers.map((t) => ({
          ...t,
          fixedPrice: t.fixedPrice ? Number(t.fixedPrice) : null,
          pricePerMile: t.pricePerMile ? Number(t.pricePerMile) : null,
        })),
        extras: raw.extras.map((e) => ({
          ...e,
          price: Number(e.price),
        })),
      }
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pricing Configuration</h1>
        <p className="text-muted-foreground">Manage delivery tiers, setup fees, and add-on options</p>
      </div>
      <PricingConfigForm config={config} />
    </div>
  )
}
