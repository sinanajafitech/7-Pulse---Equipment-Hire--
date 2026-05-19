"use client"
import { useEffect, useState } from "react"

export interface AvailabilityResult {
  available: boolean
  bookedQty: number
  availableQty: number
  stockQty: number
  returnDate: string | null
}

export interface ProductRequest {
  productId: string
  quantity: number
}

export function useAvailability(
  products: ProductRequest[],
  startDate: string,
  endDate: string
) {
  const [availability, setAvailability] = useState<Record<string, AvailabilityResult>>({})
  const [loading, setLoading] = useState(false)

  const key = products.map((p) => `${p.productId}:${p.quantity}`).join(",")

  useEffect(() => {
    if (!startDate || !endDate || products.length === 0) {
      setAvailability({})
      return
    }

    setLoading(true)
    const params = new URLSearchParams({ startDate, endDate })
    products.forEach((p) => {
      params.append("productId", p.productId)
      params.append("qty", String(p.quantity))
    })

    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((json) => setAvailability(json.data ?? {}))
      .catch(console.error)
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, startDate, endDate])

  return { availability, loading }
}
