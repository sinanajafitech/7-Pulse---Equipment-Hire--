"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function EnquiryActions({ enquiryId, currentStatus }: { enquiryId: string; currentStatus: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function updateStatus(status: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/enquiries/${enquiryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error()
      toast.success("Status updated")
      router.refresh()
    } catch {
      toast.error("Failed to update")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Select value={currentStatus} onValueChange={(v) => v && updateStatus(v)} disabled={saving}>
      <SelectTrigger className="w-36 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="UNREAD">Unread</SelectItem>
        <SelectItem value="READ">Read</SelectItem>
        <SelectItem value="RESPONDED">Responded</SelectItem>
      </SelectContent>
    </Select>
  )
}
