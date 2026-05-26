import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, logoUrl, website, sortOrder, isVisible } = body

  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(website !== undefined && { website: website || null }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isVisible !== undefined && { isVisible }),
    },
  })
  return NextResponse.json(brand)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.brand.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
