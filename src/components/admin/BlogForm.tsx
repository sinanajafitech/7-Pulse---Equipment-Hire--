"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { slugify } from "@/lib/utils"
import { Loader2, Upload } from "lucide-react"
import Image from "next/image"

interface BlogFormProps {
  post?: {
    id: string; title: string; slug: string; excerpt: string | null
    content: string; coverImage: string | null; published: boolean
    publishedAt: Date | null; tags: string[]; seoTitle: string | null; seoDesc: string | null
  }
}

export function BlogForm({ post }: BlogFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "")
  const [form, setForm] = useState({
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    published: post?.published ?? false,
    tags: post?.tags?.join(", ") ?? "",
    seoTitle: post?.seoTitle ?? "",
    seoDesc: post?.seoDesc ?? "",
  })

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (res.ok) setCoverImage(json.data.url)
      else toast.error("Upload failed")
    } finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form,
        coverImage: coverImage || null,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        seoTitle: form.seoTitle || null,
        seoDesc: form.seoDesc || null,
      }
      const url = post ? `/api/blog/${post.id}` : "/api/blog"
      const method = post ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(post ? "Post updated" : "Post created")
      router.push("/admin/blog")
      router.refresh()
    } catch { toast.error("Failed to save post") }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Title</Label>
          <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value, ...(!post ? { slug: slugify(e.target.value) } : {}) }))} />
        </div>
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input required value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Tags (comma-separated)</Label>
          <Input placeholder="events, tips, weddings" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Excerpt</Label>
          <Textarea rows={2} placeholder="Short summary shown in blog listing..." value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Content (HTML)</Label>
          <Textarea rows={16} required placeholder="<p>Your blog post content here...</p>" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="font-mono text-xs" />
        </div>
        <div className="space-y-1">
          <Label>SEO Title</Label>
          <Input placeholder="Defaults to post title" value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>SEO Description</Label>
          <Input placeholder="Defaults to excerpt (max 155 chars)" value={form.seoDesc} onChange={(e) => setForm((f) => ({ ...f, seoDesc: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Cover Image</Label>
        {coverImage && (
          <div className="relative h-40 w-full rounded-xl overflow-hidden border border-border">
            <Image src={coverImage} alt="Cover" fill className="object-cover" />
          </div>
        )}
        <label className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary text-sm text-muted-foreground hover:text-primary transition-colors">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" />{coverImage ? "Change image" : "Upload cover image"}</>}
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
        </label>
      </div>

      <div className="flex items-center gap-4">
        <button type="button" onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
          className={`inline-flex h-10 items-center gap-3 rounded-xl border px-4 text-sm font-medium transition-all ${form.published ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-border bg-muted/30 text-muted-foreground"}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${form.published ? "bg-green-400" : "bg-muted-foreground/40"}`} />
          {form.published ? "Published" : "Draft"}
        </button>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {post ? "Save Changes" : "Publish Post"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/blog")}>Cancel</Button>
      </div>
    </form>
  )
}
