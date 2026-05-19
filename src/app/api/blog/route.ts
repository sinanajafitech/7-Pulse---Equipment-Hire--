import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { z } from "zod"
import { slugify } from "@/lib/utils"

const blogSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(1),
  coverImage: z.string().optional(),
  published: z.boolean().default(false),
  publishedAt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const session = await auth()
  const isAdmin = !!session?.user
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "9")

  const where = isAdmin ? {} : { published: true }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, published: true, publishedAt: true, tags: true, createdAt: true },
    }),
    prisma.blogPost.count({ where }),
  ])

  return NextResponse.json({ data: posts, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const data = blogSchema.parse(body)
  const slug = data.slug || slugify(data.title)

  const post = await prisma.blogPost.create({
    data: {
      ...data,
      slug,
      publishedAt: data.published && !data.publishedAt ? new Date() : data.publishedAt ? new Date(data.publishedAt) : null,
    },
  })
  return NextResponse.json({ data: post }, { status: 201 })
}
