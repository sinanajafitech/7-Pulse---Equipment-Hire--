import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { Plus, Edit, BookOpen } from "lucide-react"
import { DeleteBlogButton } from "@/components/admin/DeleteBlogButton"

export const metadata = { title: "Blog" }

export default async function AdminBlogPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground">{posts.length} posts</p>
        </div>
        <Button asChild><Link href="/admin/blog/new"><Plus className="mr-2 h-4 w-4" />New Post</Link></Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/30">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Published</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tags</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{post.title}</p>
                  <p className="text-xs text-muted-foreground">/blog/{post.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={post.published ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}>
                    {post.published ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{post.publishedAt ? formatDate(post.publishedAt) : "—"}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{post.tags.slice(0, 3).map((t) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" asChild><Link href={`/admin/blog/${post.id}`}><Edit className="h-4 w-4" /></Link></Button>
                    <DeleteBlogButton postId={post.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {posts.length === 0 && <div className="py-16 text-center text-muted-foreground"><BookOpen className="mx-auto mb-3 h-8 w-8 opacity-40" /><p>No posts yet</p></div>}
      </div>
    </div>
  )
}
