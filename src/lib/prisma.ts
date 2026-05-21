import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof buildClient> | undefined
}

function toStrArr(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v === "string") { try { return JSON.parse(v) } catch { return [] } }
  return []
}

function buildClient() {
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!)
  return new PrismaClient({ adapter }).$extends({
    result: {
      product: {
        images: { needs: { images: true }, compute: (p) => toStrArr(p.images) },
        tags:   { needs: { tags: true },   compute: (p) => toStrArr(p.tags) },
      },
      blogPost: {
        tags: { needs: { tags: true }, compute: (p) => toStrArr(p.tags) },
      },
    },
  })
}

export const prisma = globalForPrisma.prisma ?? buildClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
