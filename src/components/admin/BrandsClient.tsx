"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2, Globe, GripVertical, Eye, EyeOff, X, Check, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Brand = {
  id: string
  name: string
  logoUrl: string | null
  website: string | null
  sortOrder: number
  isVisible: boolean
}

interface Props {
  initialBrands: Brand[]
}

type FormState = {
  name: string
  logoUrl: string
  website: string
  sortOrder: number
  isVisible: boolean
}

const empty: FormState = { name: "", logoUrl: "", website: "", sortOrder: 0, isVisible: true }

export function BrandsClient({ initialBrands }: Props) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(empty)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function openAdd() {
    setEditing(null)
    setForm({ ...empty, sortOrder: brands.length })
    setShowForm(true)
  }

  function openEdit(brand: Brand) {
    setEditing(brand.id)
    setForm({
      name: brand.name,
      logoUrl: brand.logoUrl ?? "",
      website: brand.website ?? "",
      sortOrder: brand.sortOrder,
      isVisible: brand.isVisible,
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditing(null)
    setForm(empty)
  }

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const json = await res.json()
      if (json.data?.url) setForm((f) => ({ ...f, logoUrl: json.data.url }))
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const url = editing ? `/api/brands/${editing}` : "/api/brands"
      const method = editing ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const brand: Brand = await res.json()
      if (editing) {
        setBrands((prev) => prev.map((b) => (b.id === editing ? brand : b)))
      } else {
        setBrands((prev) => [...prev, brand])
      }
      cancelForm()
    } finally {
      setSaving(false)
    }
  }

  async function deleteBrand(id: string) {
    await fetch(`/api/brands/${id}`, { method: "DELETE" })
    setBrands((prev) => prev.filter((b) => b.id !== id))
    setDeleteConfirm(null)
  }

  async function toggleVisibility(brand: Brand) {
    const res = await fetch(`/api/brands/${brand.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVisible: !brand.isVisible }),
    })
    const updated: Brand = await res.json()
    setBrands((prev) => prev.map((b) => (b.id === brand.id ? updated : b)))
  }

  const sorted = [...brands].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brands</h1>
          <p className="text-muted-foreground">{brands.length} brands — shown on the homepage</p>
        </div>
        <Button onClick={openAdd} className="gap-2">
          <Plus className="h-4 w-4" /> Add Brand
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">{editing ? "Edit Brand" : "New Brand"}</h2>
            <button onClick={cancelForm} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Brand Name *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Pioneer DJ"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Website</label>
              <Input
                value={form.website}
                onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Logo upload */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Logo</label>
            <div className="flex items-center gap-4">
              {form.logoUrl ? (
                <div className="relative h-16 w-32 rounded-lg border border-border bg-white/5 overflow-hidden flex items-center justify-center p-2">
                  <Image src={form.logoUrl} alt="Logo preview" fill className="object-contain p-1" unoptimized />
                  <button
                    onClick={() => setForm((f) => ({ ...f, logoUrl: "" }))}
                    className="absolute top-1 right-1 rounded-full bg-destructive p-0.5 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex h-16 w-32 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-4 w-4 text-muted-foreground mb-0.5" />
                    <span className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Upload"}</span>
                  </div>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
              />
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Or paste URL</label>
                <Input
                  value={form.logoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sort Order</label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              />
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isVisible}
                  onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm text-foreground">Visible on homepage</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={save} disabled={saving || !form.name.trim()} className="gap-2">
              <Check className="h-4 w-4" /> {saving ? "Saving…" : editing ? "Save Changes" : "Add Brand"}
            </Button>
            <Button variant="outline" onClick={cancelForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Brands grid */}
      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">No brands yet. Add your first brand to display it on the homepage.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((brand) => (
            <div
              key={brand.id}
              className="group relative rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-muted-foreground/30 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  {/* Logo */}
                  {brand.logoUrl ? (
                    <div className="relative h-12 w-full rounded-md border border-border bg-white/5 overflow-hidden mb-3 flex items-center justify-center">
                      <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain p-2" unoptimized />
                    </div>
                  ) : (
                    <div className="h-12 w-full rounded-md border border-dashed border-border bg-muted/10 mb-3 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">No logo</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground text-sm truncate">{brand.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge
                        variant="outline"
                        className={`text-xs ${brand.isVisible ? "text-green-500 border-green-500/30" : "text-muted-foreground"}`}
                      >
                        {brand.isVisible ? "Visible" : "Hidden"}
                      </Badge>
                    </div>
                  </div>

                  {brand.website && (
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary mt-1 truncate"
                    >
                      <Globe className="h-3 w-3 shrink-0" />
                      {brand.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleVisibility(brand)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {brand.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {brand.isVisible ? "Hide" : "Show"}
                </button>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(brand)} className="h-7 px-2 gap-1 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                  {deleteConfirm === brand.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteBrand(brand.id)}
                        className="h-7 px-2 text-xs"
                      >
                        Confirm
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(null)}
                        className="h-7 px-2 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(brand.id)}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
