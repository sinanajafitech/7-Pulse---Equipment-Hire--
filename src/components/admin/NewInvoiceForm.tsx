"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface QuoteOption {
  id: string; reference: string; customerName: string; customerEmail: string
  customerPhone: string | null; venueAddress: string; grandTotal: number
  depositAmount: number; items: Array<{ productName: string; quantity: number; hireDays: number; dailyRate: number; lineTotal: number }>
}

interface LineItem { description: string; quantity: number; unitPrice: string }

interface Props { approvedQuotes: QuoteOption[]; defaultVatRate: number; preloadQuoteId?: string }

export function NewInvoiceForm({ approvedQuotes, defaultVatRate, preloadQuoteId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedQuoteId, setSelectedQuoteId] = useState(preloadQuoteId ?? "")
  const [items, setItems] = useState<LineItem[]>([{ description: "", quantity: 1, unitPrice: "" }])
  const [form, setForm] = useState({
    customerName: "", customerEmail: "", customerPhone: "", customerAddress: "",
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    vatRate: String(defaultVatRate * 100), depositPaid: "",
    notes: "", terms: "Payment due within 14 days of invoice date.",
  })

  function loadFromQuote(quoteId: string) {
    const q = approvedQuotes.find((q) => q.id === quoteId)
    if (!q) return
    setForm((f) => ({ ...f, customerName: q.customerName, customerEmail: q.customerEmail, customerPhone: q.customerPhone ?? "", customerAddress: q.venueAddress, depositPaid: String(q.depositAmount) }))
    setItems(q.items.map((i) => ({ description: `${i.productName} (×${i.quantity}, ${i.hireDays} days)`, quantity: 1, unitPrice: String(i.lineTotal) })))
  }

  useEffect(() => { if (preloadQuoteId) loadFromQuote(preloadQuoteId) }, [])

  const subtotal = items.reduce((s, i) => s + (i.quantity * (parseFloat(i.unitPrice) || 0)), 0)
  const vatRate = parseFloat(form.vatRate) / 100 || 0
  const vatAmount = Math.round(subtotal * vatRate * 100) / 100
  const total = Math.round((subtotal + vatAmount) * 100) / 100
  const depositPaid = parseFloat(form.depositPaid) || 0
  const amountDue = Math.round((total - depositPaid) * 100) / 100

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = {
        ...form, vatRate: parseFloat(form.vatRate) / 100,
        depositPaid: parseFloat(form.depositPaid) || 0,
        quoteId: selectedQuoteId || null,
        items: items.filter((i) => i.description).map((i) => ({ description: i.description, quantity: i.quantity, unitPrice: parseFloat(i.unitPrice) || 0 })),
        customerName: form.customerName, customerEmail: form.customerEmail,
      }
      const res = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      toast.success(`Invoice ${json.data.number} created`)
      router.push(`/admin/invoices/${json.data.id}`)
    } catch { toast.error("Failed to create invoice") }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {approvedQuotes.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader><CardTitle className="text-base text-primary">Import from Approved Quote</CardTitle></CardHeader>
          <CardContent className="flex gap-3">
            <Select value={selectedQuoteId} onValueChange={(v) => { if (v) { setSelectedQuoteId(v); loadFromQuote(v) } }}>
              <SelectTrigger className="flex-1"><SelectValue placeholder="Select a quote to import..." /></SelectTrigger>
              <SelectContent>{approvedQuotes.map((q) => <SelectItem key={q.id} value={q.id}>{q.reference} — {q.customerName}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><Label>Name *</Label><Input required value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Email *</Label><Input required type="email" value={form.customerEmail} onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Due Date *</Label><Input required type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} /></div>
          <div className="col-span-2 space-y-1"><Label>Address</Label><Textarea rows={2} value={form.customerAddress} onChange={(e) => setForm((f) => ({ ...f, customerAddress: e.target.value }))} /></div>
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => setItems((p) => [...p, { description: "", quantity: 1, unitPrice: "" }])}><Plus className="mr-2 h-3 w-3" />Add Item</Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <Input placeholder="Description" value={item.description} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} className="flex-1" />
              <Input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, quantity: parseInt(e.target.value) || 1 } : x))} className="w-20" />
              <Input type="number" step="0.01" placeholder="Unit £" value={item.unitPrice} onChange={(e) => setItems((p) => p.map((x, j) => j === i ? { ...x, unitPrice: e.target.value } : x))} className="w-28" />
              <span className="text-sm text-muted-foreground pt-2 w-20 text-right">{formatCurrency((item.quantity * (parseFloat(item.unitPrice) || 0)))}</span>
              {items.length > 1 && <button type="button" onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground pt-2"><X className="h-4 w-4" /></button>}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Totals & Payment</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1"><Label>VAT Rate (%)</Label><Input type="number" step="1" min="0" max="100" value={form.vatRate} onChange={(e) => setForm((f) => ({ ...f, vatRate: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Deposit Already Paid (£)</Label><Input type="number" step="0.01" min="0" value={form.depositPaid} onChange={(e) => setForm((f) => ({ ...f, depositPaid: e.target.value }))} /></div>
          <div className="col-span-2 rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            {vatRate > 0 && <div className="flex justify-between text-muted-foreground"><span>VAT ({(vatRate * 100).toFixed(0)}%)</span><span>{formatCurrency(vatAmount)}</span></div>}
            <div className="flex justify-between font-semibold text-foreground border-t border-border pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
            {depositPaid > 0 && <div className="flex justify-between text-green-400"><span>Deposit Paid</span><span>-{formatCurrency(depositPaid)}</span></div>}
            <div className="flex justify-between font-bold text-primary text-lg border-t border-border pt-2"><span>Amount Due</span><span>{formatCurrency(amountDue)}</span></div>
          </div>
          <div className="space-y-1"><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Payment Terms</Label><Textarea rows={2} value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} /></div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Create Invoice
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/invoices")}>Cancel</Button>
      </div>
    </form>
  )
}
