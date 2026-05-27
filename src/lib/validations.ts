import { z } from "zod"

export const quoteSubmitSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  eventType: z.string().min(1, "Event type is required"),
  eventDate: z.string().min(1, "Event date is required"),
  eventEndDate: z.string().optional(),
  venueAddress: z.string().min(5, "Venue address is required"),
  guestCount: z.number().int().positive().optional(),
  notes: z.string().optional(),
  hireStartDate: z.string().min(1, "Hire start date is required"),
  hireEndDate: z.string().min(1, "Hire end date is required"),
  deliveryTierId: z.string().optional(),
  selectedExtraIds: z.array(z.string()).default([]),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      dailyRate: z.number().positive(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "At least one item is required"),
})

export type QuoteSubmitInput = z.infer<typeof quoteSubmitSchema>

export const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export type EnquiryInput = z.infer<typeof enquirySchema>

export const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().min(10, "Description is required"),
  shortDesc: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  images: z.array(z.string()).default([]),
  specs: z.record(z.string(), z.string()).optional(),
  dailyRate: z.number().positive("Daily rate must be positive"),
  weeklyRate: z.number().positive().optional(),
  depositRate: z.number().min(0).max(1).default(0.25),
  stockQty: z.number().int().min(0).default(1),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  weightKg: z.number().positive().optional(),
  dimensions: z.string().optional(),
  powerW: z.number().int().positive().optional(),
  youtubeUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

export type ProductInput = z.infer<typeof productSchema>

export const pricingConfigSchema = z.object({
  setupFee: z.number().min(0),
  setupFeeLabel: z.string().default("Setup & Collection"),
  vatRate: z.number().min(0).max(1).default(0),
  vatIncluded: z.boolean().default(false),
  deliveryTiers: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().min(1),
      description: z.string().optional(),
      priceType: z.enum(["FIXED", "PER_MILE", "FREE"]),
      fixedPrice: z.number().min(0).optional(),
      pricePerMile: z.number().min(0).optional(),
      minDistance: z.number().int().min(0).optional(),
      maxDistance: z.number().int().min(0).optional(),
      sortOrder: z.number().int().default(0),
    })
  ).default([]),
  extras: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      price: z.number().min(0),
      priceType: z.enum(["FIXED", "PER_DAY"]),
      isDefault: z.boolean().default(false),
      sortOrder: z.number().int().default(0),
    })
  ).default([]),
})

export type PricingConfigInput = z.infer<typeof pricingConfigSchema>
