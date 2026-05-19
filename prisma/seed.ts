import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config() // fallback to .env
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../src/generated/prisma/client"
import { hashSync } from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@audiorent.co.uk"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AudioRent2026!"

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Admin",
      password: hashSync(adminPassword, 12),
      role: "ADMIN",
    },
  })
  console.log(`Admin user: ${adminEmail}`)

  const categories = [
    { name: "Sound Systems", slug: "sound-systems", description: "Professional PA systems, speakers, amplifiers, and mixers", iconName: "Volume2", sortOrder: 1 },
    { name: "Lighting Equipment", slug: "lighting", description: "Stage lighting, LED rigs, moving heads, and effects", iconName: "Lightbulb", sortOrder: 2 },
    { name: "DJ Gear", slug: "dj-gear", description: "DJ controllers, turntables, CDJs, and mixers", iconName: "Disc3", sortOrder: 3 },
    { name: "Event Packages", slug: "event-packages", description: "Complete sound and lighting packages for any event", iconName: "Package", sortOrder: 4 },
  ]

  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat })
  }
  console.log("Categories created")

  const soundCat = await prisma.category.findUnique({ where: { slug: "sound-systems" } })
  const lightingCat = await prisma.category.findUnique({ where: { slug: "lighting" } })
  const djCat = await prisma.category.findUnique({ where: { slug: "dj-gear" } })
  const packagesCat = await prisma.category.findUnique({ where: { slug: "event-packages" } })

  const products = [
    {
      name: "QSC K12.2 Active Speaker (Pair)",
      slug: "qsc-k12-2-active-speaker-pair",
      shortDesc: "2000W professional active speakers, perfect for medium events",
      description: "The QSC K12.2 delivers 2000 watts of Class D power with a 12-inch woofer and 1.75-inch compression driver. Ideal for live events, weddings, and corporate functions. Supplied as a matched stereo pair with stands and cables.",
      categoryId: soundCat!.id,
      images: [] as string[],
      specs: { Power: "2000W (each)", Frequency: "45Hz – 20kHz", "SPL Max": "132dB", Weight: "16.4kg each", Inputs: "XLR/TRS combo, RCA" },
      dailyRate: 85, stockQty: 4, isAvailable: true, isFeatured: true, powerW: 2000,
      tags: ["speaker", "active", "QSC", "PA"],
    },
    {
      name: "Yamaha DXS18XLF Subwoofer",
      slug: "yamaha-dxs18xlf-subwoofer",
      shortDesc: "18-inch powered subwoofer for deep bass at large events",
      description: "The Yamaha DXS18XLF delivers powerful low-frequency extension with its 18-inch driver and 1020W amplifier. Perfect for large parties, clubs, and outdoor events.",
      categoryId: soundCat!.id,
      images: [] as string[],
      specs: { Power: "1020W", Driver: "18-inch", Frequency: "32Hz – 120Hz", "SPL Max": "138dB", Weight: "44kg" },
      dailyRate: 65, stockQty: 2, isAvailable: true, isFeatured: false, powerW: 1020,
      tags: ["subwoofer", "bass", "Yamaha"],
    },
    {
      name: "Allen & Heath SQ-5 Digital Mixer",
      slug: "allen-heath-sq5-digital-mixer",
      shortDesc: "48-channel professional digital mixing console",
      description: "The Allen & Heath SQ-5 is a professional 48-channel digital mixer featuring 96kHz processing, 32 local XLR inputs, built-in effects, and full remote control via iPad.",
      categoryId: soundCat!.id,
      images: [] as string[],
      specs: { Channels: "48 (32 local + 16 via expansion)", "Sample Rate": "96kHz", Effects: "Built-in FX rack", Weight: "14kg", Remote: "iPad app control" },
      dailyRate: 120, stockQty: 1, isAvailable: true, isFeatured: true,
      tags: ["mixer", "digital", "Allen & Heath"],
    },
    {
      name: "Moving Head LED Beam (x8 Rig)",
      slug: "moving-head-led-beam-x8",
      shortDesc: "8x professional moving head beam lights with DMX control",
      description: "A stunning rig of 8 professional LED moving head beam fixtures, pre-programmed and ready to go. Includes DMX controller, all cabling, and truss mounting.",
      categoryId: lightingCat!.id,
      images: [] as string[],
      specs: { Fixtures: "8x Moving Head Beams", LEDs: "10W RGBW per unit", Pan: "540°", Tilt: "270°", Control: "DMX-512 + pre-programmed" },
      dailyRate: 150, stockQty: 1, isAvailable: true, isFeatured: true,
      tags: ["moving head", "beam", "DMX", "LED"],
    },
    {
      name: "LED Par Can Set (12x)",
      slug: "led-par-can-set-12x",
      shortDesc: "12 LED par cans for wash lighting and colour effects",
      description: "A set of 12 professional LED par can fixtures providing full colour wash lighting. Ideal for illuminating stages, dancefloors, and venue architecture.",
      categoryId: lightingCat!.id,
      images: [] as string[],
      specs: { Fixtures: "12x LED Par Cans", LEDs: "36x 3W RGB", "Beam Angle": "25°", Control: "DMX-512 / Sound-active" },
      dailyRate: 80, stockQty: 2, isAvailable: true, isFeatured: false,
      tags: ["par can", "LED", "wash", "colour"],
    },
    {
      name: "Pioneer DJ CDJ-2000NXS2 + DJM-900NXS2 Setup",
      slug: "pioneer-cdj-2000nxs2-djm-900nxs2",
      shortDesc: "Industry-standard 2-deck CDJ setup with club mixer",
      description: "The gold standard in professional DJ equipment. Two CDJ-2000NXS2 media players and one DJM-900NXS2 4-channel mixer. USB/SD playback, rekordbox compatible.",
      categoryId: djCat!.id,
      images: [] as string[],
      specs: { Players: "2x CDJ-2000NXS2", Mixer: "DJM-900NXS2 (4ch)", Playback: "USB, SD, Link", Software: "rekordbox compatible", Outputs: "XLR Master, Booth" },
      dailyRate: 200, stockQty: 1, isAvailable: true, isFeatured: true,
      tags: ["CDJ", "Pioneer", "DJ", "club"],
    },
    {
      name: "Wedding Sound & Lighting Package",
      slug: "wedding-sound-lighting-package",
      shortDesc: "Complete audio and lighting solution for up to 200 guests",
      description: "Our most popular wedding package. Includes stereo PA system, wireless microphones, LED par can lighting rig (12 fixtures), and fairy light backdrop. Delivered, set up, and collected by our team.",
      categoryId: packagesCat!.id,
      images: [] as string[],
      specs: { Capacity: "Up to 200 guests", Sound: "Stereo PA + Sub", Lighting: "12x LED Par Cans", Microphones: "2x Wireless handheld", Includes: "Delivery, setup & collection" },
      dailyRate: 350, stockQty: 1, isAvailable: true, isFeatured: true,
      tags: ["wedding", "package", "complete"],
    },
    {
      name: "Corporate Event Package",
      slug: "corporate-event-package",
      shortDesc: "Professional AV setup for presentations and corporate events",
      description: "Perfect for corporate conferences, product launches, and award ceremonies. Includes PA, wireless microphones, stage lighting, and digital mixer.",
      categoryId: packagesCat!.id,
      images: [] as string[],
      specs: { Capacity: "Up to 150 guests", Sound: "Stereo PA + Digital mixer", Microphones: "1x Lapel + 2x Wireless handheld", Lighting: "Stage wash lighting", Optional: "On-site technician" },
      dailyRate: 280, stockQty: 1, isAvailable: true, isFeatured: false,
      tags: ["corporate", "conference", "package", "AV"],
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: { ...product, specs: product.specs as object, dailyRate: product.dailyRate },
    })
  }
  console.log("Products created")

  const existingConfig = await prisma.pricingConfig.findFirst({ where: { isActive: true } })
  if (!existingConfig) {
    await prisma.pricingConfig.create({
      data: {
        isActive: true,
        setupFee: 75,
        setupFeeLabel: "Delivery, Setup & Collection",
        vatRate: 0.20,
        vatIncluded: false,
        deliveryTiers: {
          create: [
            { label: "Local (0–10 miles)", description: "Free delivery within 10 miles", priceType: "FREE", sortOrder: 1 },
            { label: "Regional (10–30 miles)", description: "Fixed delivery charge 10–30 miles", priceType: "FIXED", fixedPrice: 50, sortOrder: 2 },
            { label: "Extended (30–60 miles)", description: "Fixed delivery charge 30–60 miles", priceType: "FIXED", fixedPrice: 100, sortOrder: 3 },
            { label: "National (60+ miles)", description: "Please contact us for a quote", priceType: "FIXED", fixedPrice: 200, sortOrder: 4 },
          ],
        },
        extras: {
          create: [
            { name: "On-site Technician", description: "Experienced audio/lighting technician for the duration of your event", price: 250, priceType: "FIXED", isDefault: false, sortOrder: 1 },
            { name: "Equipment Insurance Waiver", description: "Cover against accidental damage", price: 45, priceType: "FIXED", isDefault: true, sortOrder: 2 },
            { name: "Generator Hire", description: "3kW silent generator for outdoor events", price: 150, priceType: "FIXED", isDefault: false, sortOrder: 3 },
          ],
        },
      },
    })
    console.log("Pricing config created")
  }

  console.log("Seed complete!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
