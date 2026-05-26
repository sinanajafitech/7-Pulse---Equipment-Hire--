"use client"

import { useState } from "react"
import { Printer, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

type Item = { id: string; productName: string; quantity: number }

interface Props {
  reference: string
  customerName: string
  customerPhone: string
  eventType: string
  eventDate: string
  venueAddress: string
  hirePeriod: string
  items: Item[]
}

export function DeliveryChecklistClient({
  reference, customerName, customerPhone, eventType,
  eventDate, venueAddress, hirePeriod, items,
}: Props) {
  const [deliveredOut, setDeliveredOut] = useState<Record<string, boolean>>({})
  const [returned, setReturned] = useState<Record<string, boolean>>({})

  const allOut = items.every((i) => deliveredOut[i.id])
  const allBack = items.every((i) => returned[i.id])

  function toggleAll(type: "out" | "return", value: boolean) {
    const next = Object.fromEntries(items.map((i) => [i.id, value]))
    type === "out" ? setDeliveredOut(next) : setReturned(next)
  }

  function reset() {
    setDeliveredOut({})
    setReturned({})
  }

  return (
    <div className="space-y-4">
      {/* Toolbar — hidden when printing */}
      <div className="flex items-center gap-2 print:hidden">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print Checklist
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Printable area */}
      <div className="rounded-lg border border-border bg-card p-6 print:border-0 print:p-0 print:shadow-none space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground print:text-2xl">Delivery Checklist</h2>
            <p className="text-muted-foreground font-mono text-sm mt-0.5">{reference}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground">{customerName}</p>
            {customerPhone && <p>{customerPhone}</p>}
          </div>
        </div>

        {/* Event info */}
        <div className="grid grid-cols-3 gap-4 rounded-md border border-border p-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Event</p>
            <p className="font-medium text-foreground">{eventType}</p>
            <p className="text-muted-foreground">{eventDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Venue</p>
            <p className="text-foreground">{venueAddress}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Hire Period</p>
            <p className="text-foreground">{hirePeriod}</p>
          </div>
        </div>

        {/* Checklist table */}
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="py-2 text-left font-semibold text-foreground">Equipment Item</th>
              <th className="py-2 text-center font-semibold text-foreground w-14">Qty</th>
              <th className="py-2 text-center font-semibold text-foreground w-32">
                <div className="flex flex-col items-center gap-1">
                  <span>Delivered Out</span>
                  <button
                    onClick={() => toggleAll("out", !allOut)}
                    className="text-xs font-normal text-primary underline print:hidden"
                  >
                    {allOut ? "uncheck all" : "check all"}
                  </button>
                </div>
              </th>
              <th className="py-2 text-center font-semibold text-foreground w-32">
                <div className="flex flex-col items-center gap-1">
                  <span>Returned</span>
                  <button
                    onClick={() => toggleAll("return", !allBack)}
                    className="text-xs font-normal text-primary underline print:hidden"
                  >
                    {allBack ? "uncheck all" : "check all"}
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-muted/20 print:hover:bg-transparent">
                <td className="py-3 font-medium text-foreground">{item.productName}</td>
                <td className="py-3 text-center text-muted-foreground">{item.quantity}</td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={!!deliveredOut[item.id]}
                    onChange={(e) => setDeliveredOut((p) => ({ ...p, [item.id]: e.target.checked }))}
                    className="h-5 w-5 cursor-pointer accent-primary print:h-4 print:w-4"
                  />
                </td>
                <td className="py-3 text-center">
                  <input
                    type="checkbox"
                    checked={!!returned[item.id]}
                    onChange={(e) => setReturned((p) => ({ ...p, [item.id]: e.target.checked }))}
                    className="h-5 w-5 cursor-pointer accent-primary print:h-4 print:w-4"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Progress summary — screen only */}
        <div className="flex gap-6 text-sm print:hidden">
          <span className="text-muted-foreground">
            Delivered out:
            <span className={`ml-1 font-semibold ${allOut ? "text-green-500" : "text-foreground"}`}>
              {Object.values(deliveredOut).filter(Boolean).length}/{items.length}
            </span>
          </span>
          <span className="text-muted-foreground">
            Returned:
            <span className={`ml-1 font-semibold ${allBack ? "text-green-500" : "text-foreground"}`}>
              {Object.values(returned).filter(Boolean).length}/{items.length}
            </span>
          </span>
        </div>

        {/* Footer — print only */}
        <div className="hidden print:block text-center text-xs text-muted-foreground pt-2">
          Powered by <a href="https://www.cybercina.co.uk" className="underline">Cybercina</a> — www.cybercina.co.uk
        </div>

        {/* Signature section */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-border">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Delivered by</p>
            <div className="border-b border-foreground/40 pb-1 h-8" />
            <p className="text-xs text-muted-foreground">Name &amp; signature</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Date:</span>
              <div className="flex-1 border-b border-foreground/40" />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Received by (Customer)</p>
            <div className="border-b border-foreground/40 pb-1 h-8" />
            <p className="text-xs text-muted-foreground">Name &amp; signature</p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Date:</span>
              <div className="flex-1 border-b border-foreground/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
