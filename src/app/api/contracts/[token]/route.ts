import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const contract = await prisma.contract.findUnique({ where: { token } })
  if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: contract })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const body = await req.json()
    const { signatureName, signatureData } = body

    const contract = await prisma.contract.findUnique({ where: { token } })
    if (!contract) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (contract.status === "SIGNED") return NextResponse.json({ error: "Already signed" }, { status: 400 })

    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"

    const updated = await prisma.contract.update({
      where: { token },
      data: {
        signatureName,
        signatureData,
        signedAt: new Date(),
        signedIp: ip,
        status: "SIGNED",
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error("PUT /api/contracts/[token]:", error)
    return NextResponse.json({ error: "Failed to sign contract" }, { status: 500 })
  }
}
