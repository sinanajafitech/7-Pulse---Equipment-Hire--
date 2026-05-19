import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { pricingConfigSchema } from "@/lib/validations"

export async function GET() {
  try {
    const config = await prisma.pricingConfig.findFirst({
      where: { isActive: true },
      include: {
        deliveryTiers: { orderBy: { sortOrder: "asc" } },
        extras: { orderBy: { sortOrder: "asc" } },
      },
    })
    return NextResponse.json({ data: config })
  } catch {
    return NextResponse.json({ error: "Failed to fetch pricing config" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const data = pricingConfigSchema.parse(body)

    const existingConfig = await prisma.pricingConfig.findFirst({ where: { isActive: true } })

    if (existingConfig) {
      // Delete old tiers and extras, recreate
      await prisma.deliveryTier.deleteMany({ where: { pricingConfigId: existingConfig.id } })
      await prisma.pricingExtra.deleteMany({ where: { pricingConfigId: existingConfig.id } })

      const updated = await prisma.pricingConfig.update({
        where: { id: existingConfig.id },
        data: {
          setupFee: data.setupFee,
          setupFeeLabel: data.setupFeeLabel,
          vatRate: data.vatRate,
          vatIncluded: data.vatIncluded,
          deliveryTiers: { create: data.deliveryTiers.map(({ id: _id, ...t }) => t) },
          extras: { create: data.extras.map(({ id: _id, ...e }) => e) },
        },
        include: {
          deliveryTiers: { orderBy: { sortOrder: "asc" } },
          extras: { orderBy: { sortOrder: "asc" } },
        },
      })
      return NextResponse.json({ data: updated })
    }

    const created = await prisma.pricingConfig.create({
      data: {
        ...data,
        deliveryTiers: { create: data.deliveryTiers.map(({ id: _id, ...t }) => t) },
        extras: { create: data.extras.map(({ id: _id, ...e }) => e) },
      },
      include: {
        deliveryTiers: { orderBy: { sortOrder: "asc" } },
        extras: { orderBy: { sortOrder: "asc" } },
      },
    })
    return NextResponse.json({ data: created }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to update pricing config" }, { status: 500 })
  }
}
