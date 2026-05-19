"use client"
import { useEffect, useState } from "react"
import type { PricingConfigFull } from "@/types/pricing"

export function usePricingConfig() {
  const [config, setConfig] = useState<PricingConfigFull | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/pricing")
      .then((r) => r.json())
      .then((json) => setConfig(json.data ?? null))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { config, loading }
}
