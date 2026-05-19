import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import type { Metadata } from "next"
import { BookOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "Blog",
  description: "Tips, guides, and inspiration for events, sound systems, and lighting from the PULSE 7 EVENTS team.",
  openGraph: { title: "PULSE 7 EVENTS Blog", description: "Event tips, sound & lighting guides, and inspiration." },
}

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-foreground">Blog</h1>
        <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Tips, guides, and inspiration for events, sound, and lighting.</p>
      </div>

      {posts.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <BookOpen className="mx-auto mb-4 h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">No posts yet</p>
          <p className="text-sm mt-1">Check back soon for articles and guides.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <article className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all duration-200 h-full flex flex-col">
                <div className="relative h-48 bg-muted overflow-hidden">
                  {post.coverImage ? (
                    <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <h2 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">{post.title}</h2>
                  {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{post.excerpt}</p>}
                  <p className="text-xs text-muted-foreground mt-4">{post.publishedAt ? formatDate(post.publishedAt) : ""}</p>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
