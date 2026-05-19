import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInCalendarDays, format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "GBP"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy")
}

export function formatDateRange(start: Date | string, end: Date | string): string {
  return `${format(new Date(start), "dd MMM")} – ${format(new Date(end), "dd MMM yyyy")}`
}

export function calculateHireDays(start: Date | string, end: Date | string): number {
  return Math.max(1, differenceInCalendarDays(new Date(end), new Date(start)) + 1)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function generateQuoteReference(count: number): string {
  const year = new Date().getFullYear()
  return `P7-${year}-${String(count).padStart(4, "0")}`
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + "…"
}
