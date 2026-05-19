"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { slugify } from "@/lib/utils"
import type { Category } from "@/generated/prisma/client"
import { X, Plus, Upload, Loader2 } from "lucide-react"
import Image from "next/image"

interface SerializedProduct {
  id: string
  name: string
  slug: string
  description: string
  shortDesc: string | null
  categoryId: string
  category: Category
  images: string[]
  specs: unknown
  dailyRate: number
  weeklyRate: number | null
  depositRate: number
  replacementPrice: number | null
  stockQty: number
  isAvailable: boolean
  isFeatured: boolean
  weightKg: number | null
  dimensions: string | null
  powerW: number | null
  tags: string[]
}

interface ProductFormProps {
  product?: SerializedProduct
  categories: Category[]
}

export function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    product?.specs
      ? Object.entries(product.specs as Record<string, string>).map(([key, value]) => ({ key, value }))
      : []
  )
  const [form, setForm] = useState({
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    description: product?.description ?? "",
    shortDesc: product?.shortDesc ?? "",
    categoryId: product?.categoryId ?? "",
    dailyRate: product?.dailyRate ? String(product.dailyRate) : "",
    weeklyRate: product?.weeklyRate ? String(product.weeklyRate) : "",
    stockQty: product?.stockQty ? String(product.stockQty) : "1",
    isAvailable: product?.isAvailable ?? true,
    isFeatured: product?.isFeatured ?? false,
    replacementPrice: product?.replacementPrice ? String(product.replacementPrice) : "",
    dimensions: product?.dimensions ?? "",
    powerW: product?.powerW ? String(product.powerW) : "",
    tags: product?.tags?.join(", ") ?? "",
  })

  function handleNameChange(name: string) {
    setForm((f) => ({ ...f, name, ...(!product ? { slug: slugify(name) } : {}) }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData()
        fd.append("file", file)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        const json = await res.json()
        if (res.ok) setImages((prev) => [...prev, json.data.url])
        else toast.error(`Upload failed: ${json.error}`)
      }
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const specsObj = specs.reduce((acc, { key, value }) => key ? { ...acc, [key]: value } : acc, {})
      const body = {
        ...form,
        images,
        dailyRate: parseFloat(form.dailyRate),
        weeklyRate: form.weeklyRate ? parseFloat(form.weeklyRate) : undefined,
        stockQty: parseInt(form.stockQty),
        replacementPrice: form.replacementPrice ? parseFloat(form.replacementPrice) : undefined,
        powerW: form.powerW ? parseInt(form.powerW) : undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        specs: Object.keys(specsObj).length > 0 ? specsObj : undefined,
      }
      const url = product ? `/api/products/${product.id}` : "/api/products"
      const method = product ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(product ? "Product updated" : "Product created")
      router.push("/admin/products")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Product Name</Label>
          <Input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Slug (URL)</Label>
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={form.categoryId} onValueChange={(v) => v && setForm((f) => ({ ...f, categoryId: v }))}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Short Description (for cards)</Label>
          <Input value={form.shortDesc} onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))} />
        </div>
        <div className="col-span-2 space-y-1">
          <Label>Full Description</Label>
          <Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Daily Rate (£)</Label>
          <Input type="number" step="0.01" min="0" value={form.dailyRate} onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Weekly Rate (£) — optional</Label>
          <Input type="number" step="0.01" min="0" value={form.weeklyRate} onChange={(e) => setForm((f) => ({ ...f, weeklyRate: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Stock Quantity</Label>
          <Input type="number" min="0" value={form.stockQty} onChange={(e) => setForm((f) => ({ ...f, stockQty: e.target.value }))} required />
        </div>
        <div className="space-y-1">
          <Label>Replacement Price (£) — shown in contracts & invoices if damaged</Label>
          <Input type="number" step="0.01" min="0" placeholder="e.g. 1200.00" value={form.replacementPrice} onChange={(e) => setForm((f) => ({ ...f, replacementPrice: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Power (W) — optional</Label>
          <Input type="number" min="0" value={form.powerW} onChange={(e) => setForm((f) => ({ ...f, powerW: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Dimensions — optional</Label>
          <Input placeholder="L×W×H cm" value={form.dimensions} onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Tags (comma-separated)</Label>
          <Input placeholder="speaker, PA, active" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} />
        </div>
        <div className="col-span-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
            className={`relative inline-flex h-10 items-center gap-3 rounded-xl border px-4 text-sm font-medium transition-all duration-200 ${
              form.isAvailable
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-border bg-muted/30 text-muted-foreground"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full transition-colors ${form.isAvailable ? "bg-green-400" : "bg-muted-foreground/40"}`} />
            Available in catalogue
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))}
            className={`relative inline-flex h-10 items-center gap-3 rounded-xl border px-4 text-sm font-medium transition-all duration-200 ${
              form.isFeatured
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-muted/30 text-muted-foreground"
            }`}
          >
            <span className={`h-2.5 w-2.5 rounded-full transition-colors ${form.isFeatured ? "bg-primary" : "bg-muted-foreground/40"}`} />
            Featured on homepage
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Technical Specifications</Label>
        {specs.map((spec, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder="e.g. Power" value={spec.key} onChange={(e) => setSpecs((prev) => prev.map((s, j) => j === i ? { ...s, key: e.target.value } : s))} className="w-40" />
            <Input placeholder="e.g. 1500W" value={spec.value} onChange={(e) => setSpecs((prev) => prev.map((s, j) => j === i ? { ...s, value: e.target.value } : s))} />
            <Button type="button" variant="ghost" size="icon" onClick={() => setSpecs((prev) => prev.filter((_, j) => j !== i))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setSpecs((prev) => [...prev, { key: "", value: "" }])}>
          <Plus className="mr-2 h-3 w-3" />Add Spec
        </Button>
      </div>

      <div className="space-y-3">
        <Label>Images</Label>
        <div className="flex flex-wrap gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative h-24 w-24 rounded-lg overflow-hidden border border-border">
              <Image src={url} alt={`Product ${i + 1}`} fill className="object-cover" />
              <button type="button" onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : <Upload className="h-6 w-6 text-muted-foreground" />}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Save Changes" : "Create Product"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>Cancel</Button>
      </div>
    </form>
  )
}
