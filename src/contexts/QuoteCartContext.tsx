"use client"
import { createContext, useContext, useEffect, useState, useCallback } from "react"

export interface CartItem {
  productId: string
  productName: string
  dailyRate: number
  weeklyRate?: number | null
  quantity: number
  imageUrl?: string
}

interface QuoteCartState {
  items: CartItem[]
  hireStartDate: string
  hireEndDate: string
  deliveryTierId: string
  selectedExtraIds: string[]
}

interface QuoteCartContextValue extends QuoteCartState {
  itemCount: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  setDates: (start: string, end: string) => void
  setDeliveryTier: (id: string) => void
  toggleExtra: (id: string) => void
  clearCart: () => void
}

const QuoteCartContext = createContext<QuoteCartContextValue | null>(null)

const STORAGE_KEY = "pulse7-quote-cart"
const defaultState: QuoteCartState = {
  items: [],
  hireStartDate: "",
  hireEndDate: "",
  deliveryTierId: "",
  selectedExtraIds: [],
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QuoteCartState>(defaultState)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setState(JSON.parse(saved))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const addItem = useCallback((item: CartItem) => {
    setState((prev) => {
      const existing = prev.items.find((i) => i.productId === item.productId)
      if (existing) {
        return { ...prev, items: prev.items.map((i) => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i) }
      }
      return { ...prev, items: [...prev.items, item] }
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.productId !== productId) }))
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty < 1) return
    setState((prev) => ({ ...prev, items: prev.items.map((i) => i.productId === productId ? { ...i, quantity: qty } : i) }))
  }, [])

  const setDates = useCallback((start: string, end: string) => {
    setState((prev) => ({ ...prev, hireStartDate: start, hireEndDate: end }))
  }, [])

  const setDeliveryTier = useCallback((id: string) => {
    setState((prev) => ({ ...prev, deliveryTierId: id }))
  }, [])

  const toggleExtra = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedExtraIds: prev.selectedExtraIds.includes(id)
        ? prev.selectedExtraIds.filter((e) => e !== id)
        : [...prev.selectedExtraIds, id],
    }))
  }, [])

  const clearCart = useCallback(() => setState(defaultState), [])

  return (
    <QuoteCartContext.Provider value={{
      ...state,
      itemCount: state.items.reduce((sum, i) => sum + i.quantity, 0),
      addItem, removeItem, updateQty, setDates, setDeliveryTier, toggleExtra, clearCart,
    }}>
      {children}
    </QuoteCartContext.Provider>
  )
}

export function useQuoteCart() {
  const ctx = useContext(QuoteCartContext)
  if (!ctx) throw new Error("useQuoteCart must be used within QuoteCartProvider")
  return ctx
}
