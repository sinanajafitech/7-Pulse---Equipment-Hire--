"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, PackageCheck, CheckCircle2 } from "lucide-react"

const STATUS_OPTIONS = [
  { value: "PENDING",   label: "Pending" },
  { value: "REVIEWING", label: "Reviewing" },
  { value: "APPROVED",  label: "Approved" },
  { value: "REJECTED",  label: "Rejected" },
  { value: "EXPIRED",   label: "Expired" },
  { value: "RETURNED",  label: "Returned" },
]

interface QuoteDetailActionsProps {
  quoteId: string
  currentStatus: string
  currentAdminNotes: string
  quoteItems?: Array<{ productName: string; quantity: number }>
}

export function QuoteDetailActions({
  quoteId,
  currentStatus,
  currentAdminNotes,
  quoteItems = [],
}: QuoteDetailActionsProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [marking, setMarking] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [status, setStatus] = useState(currentStatus)
  const [adminNotes, setAdminNotes] = useState(currentAdminNotes)
  const [sendEmail, setSendEmail] = useState(false)

  const isApproved = currentStatus === "APPROVED"
  const isReturned = currentStatus === "RETURNED"

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes, sendEmail }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Quote updated" + (sendEmail ? " — email sent to customer" : ""))
      router.refresh()
    } catch {
      toast.error("Failed to update quote")
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmReturned() {
    setMarking(true)
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RETURNED", adminNotes, sendEmail: false }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Server error ${res.status}`)
      toast.success("Equipment marked as returned — items are now available again")
      setStatus("RETURNED")
      setShowModal(false)
      router.refresh()
    } catch (err) {
      console.error("Mark returned error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to mark as returned")
    } finally {
      setMarking(false)
    }
  }

  return (
    <>
      {/* Return Confirmation Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 mx-auto mb-2">
              <PackageCheck className="h-6 w-6 text-teal-400" />
            </div>
            <DialogTitle className="text-center text-foreground">
              Mark Equipment as Returned?
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              This will mark all items on this quote as back in stock and available for new hire bookings.
            </DialogDescription>
          </DialogHeader>

          {quoteItems.length > 0 && (
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Items being returned
              </p>
              {quoteItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-teal-400 shrink-0" />
                  <span className="text-sm text-foreground">
                    {item.productName}
                    <span className="text-muted-foreground ml-1">×{item.quantity}</span>
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3">
            <p className="text-xs text-teal-400">
              Once confirmed, these items will immediately appear as available in the quote builder and equipment catalogue.
            </p>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              disabled={marking}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmReturned}
              disabled={marking}
              className="flex-1 bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30"
              variant="outline"
            >
              {marking
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Marking…</>
                : <><PackageCheck className="mr-2 h-4 w-4" />Confirm Returned</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Prominent return button */}
          {isApproved && (
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal-400">Mark Equipment Returned</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Marks all items as back in stock and available for new bookings
                </p>
              </div>
              <Button
                onClick={() => setShowModal(true)}
                className="shrink-0 bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-teal-500/30"
                variant="outline"
              >
                <PackageCheck className="mr-2 h-4 w-4" />
                Mark Returned
              </Button>
            </div>
          )}

          {isReturned && (
            <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 flex items-center gap-3">
              <PackageCheck className="h-4 w-4 text-teal-400 shrink-0" />
              <p className="text-sm text-teal-400">
                Equipment has been returned — items are available for new hires
              </p>
            </div>
          )}

          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => v && setStatus(v)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Admin Notes (optional — sent to customer if email is checked)</Label>
            <Textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Notes for customer or internal notes..."
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
            />
            Send status update email to customer
          </label>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </>
  )
}
