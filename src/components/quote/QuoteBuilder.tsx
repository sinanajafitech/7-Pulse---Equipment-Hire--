"use client"
import { useState } from "react"
import { useQuoteCart } from "@/hooks/useQuoteCart"
import { usePricingConfig } from "@/hooks/usePricingConfig"
import { useAvailability, type ProductRequest } from "@/hooks/useAvailability"
import { calculateQuotePrice } from "@/lib/pricing"
import { calculateHireDays, formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { X, Minus, Plus, ShoppingCart, Loader2, CheckCircle, ArrowRight, Truck, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"

const EVENT_TYPES = ["Wedding", "Birthday Party", "Corporate Event", "Concert / Gig", "Festival", "Conference", "Graduation", "Other"]

export function QuoteBuilder() {
  const { items, hireStartDate, hireEndDate, deliveryTierId, selectedExtraIds, removeItem, updateQty, setDates, setDeliveryTier, toggleExtra, clearCart, itemCount } = useQuoteCart()
  const { config, loading } = usePricingConfig()
  const productRequests: ProductRequest[] = items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  const { availability } = useAvailability(productRequests, hireStartDate, hireEndDate)
  const unavailableItems = items.filter((i) => availability[i.productId] && !availability[i.productId].available)
  const [step, setStep] = useState<"cart" | "form" | "success">("cart")
  const [submitting, setSubmitting] = useState(false)
  const [reference, setReference] = useState("")
  const [form, setForm] = useState({ customerName: "", customerEmail: "", customerPhone: "", eventType: "", eventDate: "", venueAddress: "", notes: "" })

  const deliveryTier = config?.deliveryTiers.find((t) => t.id === deliveryTierId) ?? null
  const selectedExtras = config?.extras.filter((e) => selectedExtraIds.includes(e.id)) ?? []

  const breakdown = (items.length > 0 && hireStartDate && hireEndDate && config)
    ? calculateQuotePrice(
        items,
        new Date(hireStartDate),
        new Date(hireEndDate),
        deliveryTier ? { id: deliveryTier.id, label: deliveryTier.label, priceType: deliveryTier.priceType as "FIXED" | "PER_MILE" | "FREE", fixedPrice: deliveryTier.fixedPrice ? Number(deliveryTier.fixedPrice) : null, pricePerMile: deliveryTier.pricePerMile ? Number(deliveryTier.pricePerMile) : null } : null,
        selectedExtras.map((e) => ({ id: e.id, name: e.name, price: Number(e.price), priceType: e.priceType as "FIXED" | "PER_DAY" })),
        { setupFee: Number(config.setupFee), setupFeeLabel: config.setupFeeLabel, vatRate: Number(config.vatRate), vatIncluded: config.vatIncluded, deliveryTiers: [], extras: [] }
      )
    : null

  const hireDays = (hireStartDate && hireEndDate) ? calculateHireDays(new Date(hireStartDate), new Date(hireEndDate)) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!hireStartDate || !hireEndDate) { toast.error("Please select hire dates"); return }
    if (items.length === 0) { toast.error("Add at least one item to your quote"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hireStartDate,
          hireEndDate,
          deliveryTierId: deliveryTierId || undefined,
          selectedExtraIds,
          items: items.map((i) => ({ productId: i.productId, productName: i.productName, dailyRate: i.dailyRate, quantity: i.quantity })),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setReference(json.data.reference)
      setStep("success")
      clearCart()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit quote")
    } finally {
      setSubmitting(false)
    }
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
        <h2 className="text-2xl font-bold text-foreground mb-2">Quote Submitted!</h2>
        <p className="text-muted-foreground mb-4">Your reference number is:</p>
        <p className="text-3xl font-mono font-bold text-primary mb-6">{reference}</p>
        <p className="text-muted-foreground mb-8">We&apos;ll review your quote and get back to you within 24 hours with a confirmed price and availability.</p>
        <Button onClick={() => { setStep("cart"); setForm({ customerName: "", customerEmail: "", customerPhone: "", eventType: "", eventDate: "", venueAddress: "", notes: "" }) }}>
          Build Another Quote
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main content */}
      <div className="lg:col-span-2 space-y-6">
        {step === "cart" && (
          <>
            {/* Cart items */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />Equipment ({itemCount} items)
              </h2>
              {items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>Your quote is empty.</p>
                  <Button variant="link" asChild className="mt-1"><a href="/equipment">Browse Equipment →</a></Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {unavailableItems.length > 0 && hireStartDate && hireEndDate && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Some items are unavailable on your selected dates</p>
                        <p className="text-xs text-red-400/70 mt-0.5">
                          {unavailableItems.map((i) => {
                            const info = availability[i.productId]
                            const stockMsg = info ? `${info.availableQty} of ${info.stockQty} available` : ""
                            const returnMsg = info?.returnDate ? ` · back from ${formatDate(info.returnDate)}` : ""
                            return `${i.productName} (${stockMsg}${returnMsg})`
                          }).join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {items.map((item) => {
                    const avail = availability[item.productId]
                    const isUnavailable = !!avail && !avail.available && hireStartDate && hireEndDate
                    return (
                    <div key={item.productId} className={`flex items-center gap-4 rounded-xl border p-3 transition-colors ${isUnavailable ? "border-red-500/30 bg-red-500/5" : "border-border"}`}>
                      {item.imageUrl ? (
                        <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted shrink-0">
                          <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-lg bg-muted shrink-0 flex items-center justify-center text-muted-foreground text-xs">No img</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm truncate">{item.productName}</p>
                          {isUnavailable && (
                            <span className="shrink-0 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.dailyRate)}/day
                          {isUnavailable && avail && (
                            <span className="text-red-400">
                              {` · ${avail.availableQty} of ${avail.stockQty} in stock available`}
                              {avail.returnDate && ` · Returns ${formatDate(avail.returnDate)}`}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted disabled:opacity-50">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {hireDays > 0 && <span className={`text-sm font-semibold w-20 text-right ${isUnavailable ? "text-red-400 line-through opacity-50" : "text-primary"}`}>{formatCurrency(item.dailyRate * item.quantity * hireDays)}</span>}
                      <button onClick={() => removeItem(item.productId)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )})}

                </div>
              )}
            </div>

            {/* Dates */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Hire Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="date" value={hireStartDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setDates(e.target.value, hireEndDate)} />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input type="date" value={hireEndDate} min={hireStartDate || new Date().toISOString().split("T")[0]} onChange={(e) => setDates(hireStartDate, e.target.value)} />
                </div>
              </div>
              {hireDays > 0 && <p className="text-sm text-primary font-medium mt-3">{hireDays} day{hireDays !== 1 ? "s" : ""} hire</p>}
            </div>

            {/* Delivery */}
            {!loading && config && config.deliveryTiers.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-primary" />Delivery</h2>
                <div className="space-y-2">
                  {config.deliveryTiers.map((tier) => (
                    <label key={tier.id} className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors ${deliveryTierId === tier.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="delivery" checked={deliveryTierId === tier.id} onChange={() => setDeliveryTier(tier.id)} className="text-primary" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{tier.label}</p>
                          {tier.description && <p className="text-xs text-muted-foreground">{tier.description}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {tier.priceType === "FREE" ? "Free" : tier.fixedPrice ? formatCurrency(Number(tier.fixedPrice)) : "POA"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Extras */}
            {!loading && config && config.extras.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">Optional Add-ons</h2>
                <div className="space-y-2">
                  {config.extras.map((extra) => (
                    <label key={extra.id} className={`flex items-center justify-between rounded-xl border p-4 cursor-pointer transition-colors ${selectedExtraIds.includes(extra.id) ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selectedExtraIds.includes(extra.id)} onChange={() => toggleExtra(extra.id)} className="rounded text-primary" />
                        <div>
                          <p className="font-medium text-foreground text-sm">{extra.name}</p>
                          {extra.description && <p className="text-xs text-muted-foreground">{extra.description}</p>}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        {formatCurrency(Number(extra.price))}{extra.priceType === "PER_DAY" ? "/day" : ""}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" size="lg" onClick={() => setStep("form")} disabled={items.length === 0 || !hireStartDate || !hireEndDate || unavailableItems.length > 0}>
              {unavailableItems.length > 0
                ? "Remove unavailable items to continue"
                : <><span>Continue to Your Details</span><ArrowRight className="ml-2 h-5 w-5" /></>
              }
            </Button>
          </>
        )}

        {step === "form" && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Your Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <Label>Full Name *</Label>
                <Input required value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" required value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input type="tel" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Event Type *</Label>
                <Select required value={form.eventType} onValueChange={(v) => v && setForm((f) => ({ ...f, eventType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                  <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Event Date *</Label>
                <Input type="date" required value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Venue / Delivery Address *</Label>
                <Input required placeholder="Full address including postcode" value={form.venueAddress} onChange={(e) => setForm((f) => ({ ...f, venueAddress: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Additional Notes</Label>
                <Textarea rows={3} placeholder="Anything else we should know about your event..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("cart")}>Back</Button>
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Quote Request
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Price summary sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 rounded-2xl border border-border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Price Summary</h3>
          {!breakdown ? (
            <p className="text-sm text-muted-foreground">Add items and select dates to see pricing</p>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                {breakdown.items.map((item) => (
                  <div key={item.productId} className="flex justify-between text-muted-foreground">
                    <span className="truncate mr-2">{item.productName} ×{item.quantity}</span>
                    <span className="shrink-0">{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Equipment ({hireDays} day{hireDays !== 1 ? "s" : ""})</span>
                  <span>{formatCurrency(breakdown.equipmentSubtotal)}</span>
                </div>
                {breakdown.deliveryFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery</span>
                    <span>{formatCurrency(breakdown.deliveryFee)}</span>
                  </div>
                )}
                {breakdown.setupFee > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>{config?.setupFeeLabel ?? "Setup & Collection"}</span>
                    <span>{formatCurrency(breakdown.setupFee)}</span>
                  </div>
                )}
                {breakdown.extras.map((e) => (
                  <div key={e.id} className="flex justify-between text-muted-foreground">
                    <span>{e.name}</span>
                    <span>{formatCurrency(e.price)}</span>
                  </div>
                ))}
                {breakdown.vatAmount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT ({Number(config?.vatRate ?? 0) * 100}%)</span>
                    <span>{formatCurrency(breakdown.vatAmount)}</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-foreground">
                <span>Total Estimate</span>
                <span className="text-primary text-lg">{formatCurrency(breakdown.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Deposit (30%)</span>
                <span>{formatCurrency(breakdown.depositAmount)}</span>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                This is an estimate. Final price confirmed within 24 hours.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
