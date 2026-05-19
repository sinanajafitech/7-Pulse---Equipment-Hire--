"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Loader2 } from "lucide-react"
import type { PricingConfigFull } from "@/types/pricing"

interface PricingConfigFormProps {
  config: PricingConfigFull | null
}

type DeliveryTier = { id?: string; label: string; description: string; priceType: "FIXED" | "PER_MILE" | "FREE"; fixedPrice: string; pricePerMile: string; sortOrder: number }
type Extra = { id?: string; name: string; description: string; price: string; priceType: "FIXED" | "PER_DAY"; isDefault: boolean; sortOrder: number }

export function PricingConfigForm({ config }: PricingConfigFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [setupFee, setSetupFee] = useState(config?.setupFee ? String(config.setupFee) : "0")
  const [setupFeeLabel, setSetupFeeLabel] = useState(config?.setupFeeLabel ?? "Setup & Collection")
  const [vatRate, setVatRate] = useState(config?.vatRate ? String(Number(config.vatRate) * 100) : "20")
  const [vatIncluded, setVatIncluded] = useState(config?.vatIncluded ?? false)
  const [tiers, setTiers] = useState<DeliveryTier[]>(
    config?.deliveryTiers.map((t) => ({
      id: t.id,
      label: t.label,
      description: t.description ?? "",
      priceType: t.priceType as "FIXED" | "PER_MILE" | "FREE",
      fixedPrice: t.fixedPrice ? String(t.fixedPrice) : "",
      pricePerMile: t.pricePerMile ? String(t.pricePerMile) : "",
      sortOrder: t.sortOrder,
    })) ?? []
  )
  const [extras, setExtras] = useState<Extra[]>(
    config?.extras.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description ?? "",
      price: String(e.price),
      priceType: e.priceType as "FIXED" | "PER_DAY",
      isDefault: e.isDefault,
      sortOrder: e.sortOrder,
    })) ?? []
  )

  function addTier() {
    setTiers((prev) => [...prev, { label: "", description: "", priceType: "FIXED", fixedPrice: "", pricePerMile: "", sortOrder: prev.length }])
  }

  function addExtra() {
    setExtras((prev) => [...prev, { name: "", description: "", price: "", priceType: "FIXED", isDefault: false, sortOrder: prev.length }])
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = {
        setupFee: parseFloat(setupFee) || 0,
        setupFeeLabel,
        vatRate: parseFloat(vatRate) / 100,
        vatIncluded,
        deliveryTiers: tiers.map((t) => ({
          ...(t.id ? { id: t.id } : {}),
          label: t.label,
          description: t.description || undefined,
          priceType: t.priceType,
          fixedPrice: t.fixedPrice ? parseFloat(t.fixedPrice) : undefined,
          pricePerMile: t.pricePerMile ? parseFloat(t.pricePerMile) : undefined,
          sortOrder: t.sortOrder,
        })),
        extras: extras.map((e) => ({
          ...(e.id ? { id: e.id } : {}),
          name: e.name,
          description: e.description || undefined,
          price: parseFloat(e.price) || 0,
          priceType: e.priceType,
          isDefault: e.isDefault,
          sortOrder: e.sortOrder,
        })),
      }
      const res = await fetch("/api/pricing", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Pricing configuration saved")
      router.refresh()
    } catch {
      toast.error("Failed to save pricing configuration")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Setup & VAT</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Setup / Collection Fee (£)</Label>
              <Input type="number" step="0.01" min="0" value={setupFee} onChange={(e) => setSetupFee(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Fee Label</Label>
              <Input value={setupFeeLabel} onChange={(e) => setSetupFeeLabel(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>VAT Rate (%)</Label>
              <Input type="number" step="1" min="0" max="100" value={vatRate} onChange={(e) => setVatRate(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <input type="checkbox" id="vatIncluded" checked={vatIncluded} onChange={(e) => setVatIncluded(e.target.checked)} className="rounded" />
              <Label htmlFor="vatIncluded">Prices include VAT</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Delivery Tiers</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addTier}><Plus className="mr-2 h-3 w-3" />Add Tier</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {tiers.map((tier, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Tier {i + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Label</Label>
                  <Input value={tier.label} onChange={(e) => setTiers((prev) => prev.map((t, j) => j === i ? { ...t, label: e.target.value } : t))} placeholder="e.g. Local (0–10 miles)" />
                </div>
                <div className="space-y-1">
                  <Label>Price Type</Label>
                  <Select value={tier.priceType} onValueChange={(v) => v && setTiers((prev) => prev.map((t, j) => j === i ? { ...t, priceType: v as "FIXED" | "PER_MILE" | "FREE" } : t))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="FIXED">Fixed Price</SelectItem>
                      <SelectItem value="PER_MILE">Per Mile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tier.priceType === "FIXED" && (
                  <div className="space-y-1">
                    <Label>Fixed Price (£)</Label>
                    <Input type="number" step="0.01" min="0" value={tier.fixedPrice} onChange={(e) => setTiers((prev) => prev.map((t, j) => j === i ? { ...t, fixedPrice: e.target.value } : t))} />
                  </div>
                )}
                {tier.priceType === "PER_MILE" && (
                  <div className="space-y-1">
                    <Label>Price per Mile (£)</Label>
                    <Input type="number" step="0.01" min="0" value={tier.pricePerMile} onChange={(e) => setTiers((prev) => prev.map((t, j) => j === i ? { ...t, pricePerMile: e.target.value } : t))} />
                  </div>
                )}
                <div className="col-span-2 space-y-1">
                  <Label>Description (shown to customers)</Label>
                  <Input value={tier.description} onChange={(e) => setTiers((prev) => prev.map((t, j) => j === i ? { ...t, description: e.target.value } : t))} />
                </div>
              </div>
            </div>
          ))}
          {tiers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No delivery tiers configured</p>}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Optional Add-ons</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addExtra}><Plus className="mr-2 h-3 w-3" />Add Extra</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {extras.map((extra, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Extra {i + 1}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => setExtras((prev) => prev.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input value={extra.name} onChange={(e) => setExtras((prev) => prev.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="e.g. On-site Technician" />
                </div>
                <div className="space-y-1">
                  <Label>Price Type</Label>
                  <Select value={extra.priceType} onValueChange={(v) => v && setExtras((prev) => prev.map((x, j) => j === i ? { ...x, priceType: v as "FIXED" | "PER_DAY" } : x))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                      <SelectItem value="PER_DAY">Per Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Price (£)</Label>
                  <Input type="number" step="0.01" min="0" value={extra.price} onChange={(e) => setExtras((prev) => prev.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input type="checkbox" checked={extra.isDefault} onChange={(e) => setExtras((prev) => prev.map((x, j) => j === i ? { ...x, isDefault: e.target.checked } : x))} className="rounded" />
                  <span className="text-sm">Pre-selected</span>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label>Description</Label>
                  <Input value={extra.description} onChange={(e) => setExtras((prev) => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
                </div>
              </div>
            </div>
          ))}
          {extras.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No add-ons configured</p>}
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Pricing Configuration
      </Button>
    </div>
  )
}
