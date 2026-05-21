import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { productSchema } from "@/lib/validations"
import { slugify } from "@/lib/utils"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") ?? "name_asc"
    const page = parseInt(searchParams.get("page") ?? "1")
    const limit = parseInt(searchParams.get("limit") ?? "12")
    const featured = searchParams.get("featured") === "true"
    const session = await auth()
    const isAdmin = !!session?.user

    const where = {
      ...(isAdmin ? {} : { isAvailable: true }),
      ...(featured ? { isFeatured: true } : {}),
      ...(category ? { category: { slug: category } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { description: { contains: search } },
            ],
          }
        : {}),
    }

    const orderBy = (() => {
      switch (sort) {
        case "price_asc": return { dailyRate: "asc" as const }
        case "price_desc": return { dailyRate: "desc" as const }
        case "name_desc": return { name: "desc" as const }
        case "newest": return { createdAt: "desc" as const }
        default: return { name: "asc" as const }
      }
    })()

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const data = productSchema.parse(body)

    const slug = data.slug || slugify(data.name)
    const product = await prisma.product.create({
      data: {
        ...data,
        slug,
        specs: data.specs ?? undefined,
        dailyRate: data.dailyRate,
        weeklyRate: data.weeklyRate ?? null,
        depositRate: data.depositRate,
      },
      include: { category: true },
    })

    return NextResponse.json({ data: product }, { status: 201 })
  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
