import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug } })
  if (!post) return { title: "Post Not Found" }
  const base = process.env.NEXT_PUBLIC_APP_URL ?? ""
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDesc ?? post.excerpt ?? post.title,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDesc ?? post.excerpt ?? "",
      images: post.coverImage ? [{ url: post.coverImage }] : [],
      url: `${base}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await prisma.blogPost.findUnique({ where: { slug, published: true } })
  if (!post) notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Button variant="ghost" asChild className="mb-8 -ml-2 text-muted-foreground">
        <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Link>
      </Button>

      {post.coverImage && (
        <div className="relative h-64 md:h-96 w-full rounded-2xl overflow-hidden mb-10">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
        </div>
      )}

      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
        </div>
      )}

      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{post.title}</h1>
      {post.publishedAt && <p className="text-sm text-muted-foreground mb-8">{formatDate(post.publishedAt)}</p>}

      <div
        className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </div>
  )
}
