import { prisma } from "@/lib/prisma"
import { BlogForm } from "@/components/admin/BlogForm"
import { notFound } from "next/navigation"
export const metadata = { title: "Edit Post" }
export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.blogPost.findUnique({ where: { id } })
  if (!post) notFound()
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-foreground">Edit Post</h1><p className="text-muted-foreground">{post.title}</p></div>
      <BlogForm post={{ ...post, publishedAt: post.publishedAt ?? null }} />
    </div>
  )
}
