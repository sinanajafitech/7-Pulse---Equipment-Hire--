import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  const brands = await prisma.brand.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: "asc" },
  })
  return NextResponse.json(brands)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, logoUrl, website, sortOrder, isVisible } = body
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const brand = await prisma.brand.create({
    data: {
      name: name.trim(),
      logoUrl: logoUrl || null,
      website: website || null,
      sortOrder: sortOrder ?? 0,
      isVisible: isVisible ?? true,
    },
  })
  return NextResponse.json(brand, { status: 201 })
}
