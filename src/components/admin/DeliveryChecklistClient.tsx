"use client"

import { useState } from "react"
import { Printer, RotateCcw, CheckSquare, Square, ClipboardList } from "lucide-react"
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

  const outCount = Object.values(deliveredOut).filter(Boolean).length
  const returnCount = Object.values(returned).filter(Boolean).length
  const allOut = items.length > 0 && outCount === items.length
  const allBack = items.length > 0 && returnCount === items.length

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
      {/* Toolbar */}
      <div className="flex items-center gap-2 print:hidden">
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Reset
        </Button>
      </div>

      {/* Progress pills — screen only */}
      <div className="flex gap-3 print:hidden">
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${allOut ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-card border-border text-muted-foreground"}`}>
          {allOut ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          Delivered out: {outCount}/{items.length}
        </div>
        <div className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${allBack ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-card border-border text-muted-foreground"}`}>
          {allBack ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          Returned: {returnCount}/{items.length}
        </div>
      </div>

      {/* ── Printable area ── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden print:border-0 print:rounded-none print:shadow-none print:bg-white">

        {/* Colour header band */}
        <div className="bg-primary px-6 py-5 print:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/15 p-2">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Delivery Checklist</h2>
                <p className="font-mono text-sm text-white/70 mt-0.5">{reference}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-white text-sm">{customerName}</p>
              {customerPhone && <p className="text-white/70 text-sm">{customerPhone}</p>}
            </div>
          </div>
        </div>

        {/* Event info strip */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border bg-muted/20 print:bg-gray-50">
          {[
            { label: "Event", lines: [eventType, eventDate] },
            { label: "Venue", lines: [venueAddress] },
            { label: "Hire Period", lines: [hirePeriod] },
          ].map(({ label, lines }) => (
            <div key={label} className="px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400 mb-1">{label}</p>
              {lines.map((l, i) => (
                <p key={i} className={`text-sm ${i === 0 ? "font-semibold text-foreground print:text-gray-900" : "text-muted-foreground print:text-gray-500"}`}>{l}</p>
              ))}
            </div>
          ))}
        </div>

        {/* Checklist table */}
        <div className="px-6 py-4 print:px-6 print:py-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border print:border-gray-300">
                <th className="py-3 text-left font-bold text-foreground print:text-gray-900 text-xs uppercase tracking-wide">
                  Equipment Item
                </th>
                <th className="py-3 text-center font-bold text-foreground print:text-gray-900 text-xs uppercase tracking-wide w-12">
                  Qty
                </th>
                <th className="py-3 font-bold text-foreground print:text-gray-900 text-xs uppercase tracking-wide w-36">
                  <div className="flex flex-col items-center gap-1">
                    <span>Delivered Out</span>
                    <button
                      onClick={() => toggleAll("out", !allOut)}
                      className="text-[10px] font-normal text-primary underline print:hidden"
                    >
                      {allOut ? "uncheck all" : "check all"}
                    </button>
                  </div>
                </th>
                <th className="py-3 font-bold text-foreground print:text-gray-900 text-xs uppercase tracking-wide w-36">
                  <div className="flex flex-col items-center gap-1">
                    <span>Returned</span>
                    <button
                      onClick={() => toggleAll("return", !allBack)}
                      className="text-[10px] font-normal text-primary underline print:hidden"
                    >
                      {allBack ? "uncheck all" : "check all"}
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr
                  key={item.id}
                  className={`border-b border-border print:border-gray-100 transition-colors ${
                    idx % 2 === 0 ? "bg-transparent" : "bg-muted/10 print:bg-gray-50"
                  } hover:bg-primary/5 print:hover:bg-inherit`}
                >
                  <td className="py-3 font-medium text-foreground print:text-gray-900">{item.productName}</td>
                  <td className="py-3 text-center text-muted-foreground print:text-gray-600 font-mono">{item.quantity}</td>
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
        </div>

        {/* Signature section */}
        <div className="mx-6 mb-6 grid grid-cols-2 gap-8 rounded-lg border border-border print:border-gray-200 bg-muted/10 print:bg-gray-50 p-5">
          {[
            { role: "Delivered by (Staff)", hint: "Name & signature" },
            { role: "Received by (Customer)", hint: "Name & signature" },
          ].map(({ role, hint }) => (
            <div key={role} className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground print:text-gray-400">{role}</p>
              <div className="h-10 border-b-2 border-foreground/20 print:border-gray-300" />
              <p className="text-xs text-muted-foreground print:text-gray-400">{hint}</p>
              <div className="flex items-center gap-3 text-sm text-muted-foreground print:text-gray-500">
                <span className="font-medium">Date:</span>
                <div className="flex-1 border-b border-foreground/20 print:border-gray-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Footer — print only */}
        <div className="hidden print:block text-center text-xs text-gray-400 pb-4 pt-1 border-t border-gray-100">
          PULSE 7 EVENTS — Delivery Checklist — {reference}
        </div>
      </div>
    </div>
  )
}
