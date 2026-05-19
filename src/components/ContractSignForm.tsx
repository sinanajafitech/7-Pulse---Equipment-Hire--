"use client"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, PenLine, RotateCcw, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function ContractSignForm({ token, customerName }: { token: string; customerName: string }) {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [typedName, setTypedName] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signMode, setSignMode] = useState<"draw" | "type">("draw")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.strokeStyle = "#1a1a2e"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [signMode])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    setDrawing(true)
    setHasDrawn(true)
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  async function handleSubmit() {
    if (!agreed) { toast.error("Please agree to the terms and conditions"); return }
    if (signMode === "draw" && !hasDrawn) { toast.error("Please draw your signature"); return }
    if (signMode === "type" && !typedName.trim()) { toast.error("Please type your full name"); return }

    setSubmitting(true)
    try {
      const signatureData = signMode === "draw"
        ? canvasRef.current?.toDataURL("image/png") ?? ""
        : `typed:${typedName}`

      const res = await fetch(`/api/contracts/${token}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureName: signMode === "type" ? typedName : customerName,
          signatureData,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success("Contract signed successfully!")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign contract")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 space-y-5">
      <h2 className="font-bold text-gray-900 flex items-center gap-2">
        <PenLine className="h-5 w-5 text-blue-500" />Electronic Signature
      </h2>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {["draw", "type"].map((m) => (
          <button key={m} type="button"
            onClick={() => setSignMode(m as "draw" | "type")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${signMode === m ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {m === "draw" ? "Draw Signature" : "Type Name"}
          </button>
        ))}
      </div>

      {signMode === "draw" ? (
        <div>
          <Label className="text-gray-700 mb-2 block">Draw your signature below</Label>
          <div className="relative border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50">
            <canvas ref={canvasRef} width={560} height={140} className="w-full touch-none cursor-crosshair"
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={() => setDrawing(false)} onMouseLeave={() => setDrawing(false)}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={() => setDrawing(false)} />
            {!hasDrawn && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-gray-300 text-sm">Sign here</p>
              </div>
            )}
          </div>
          <button type="button" onClick={clearCanvas} className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <RotateCcw className="h-3 w-3" />Clear
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <Label className="text-gray-700">Type your full legal name</Label>
          <Input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={customerName}
            className="text-lg font-semibold bg-gray-50 border-gray-300 text-gray-900"
            style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}
          />
          <p className="text-xs text-gray-400">Type your full name exactly as it appears on official documents</p>
        </div>
      )}

      {/* Agreement */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-blue-500" />
        <span className="text-sm text-gray-700">
          I confirm I have read and fully agree to the <strong>Terms & Conditions</strong> above.
          I understand this is a legally binding electronic signature under the{" "}
          <strong>Electronic Communications Act 2000</strong>.
        </span>
      </label>

      <Button
        onClick={handleSubmit}
        disabled={submitting || !agreed}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
      >
        {submitting
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing…</>
          : <><CheckCircle2 className="mr-2 h-5 w-5" />Sign & Accept Contract</>
        }
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Your IP address and timestamp will be recorded as proof of signature.
      </p>
    </div>
  )
}
