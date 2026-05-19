import nodemailer from "nodemailer"
import { formatCurrency, formatDate } from "@/lib/utils"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

interface QuoteEmailData {
  reference: string
  customerName: string
  customerEmail: string
  eventType: string
  eventDate: Date
  venueAddress: string
  hireStartDate: Date
  hireEndDate: Date
  grandTotal: number
  depositAmount: number
  items: Array<{ productName: string; quantity: number; hireDays: number; lineTotal: number }>
}

export async function sendQuoteConfirmation(data: QuoteEmailData) {
  if (!process.env.SMTP_PASSWORD) return

  const itemsList = data.items
    .map((i) => `<tr>
      <td style="padding:8px 0;">${i.productName}</td>
      <td style="padding:8px 0;text-align:center;">${i.quantity}</td>
      <td style="padding:8px 0;text-align:center;">${i.hireDays} days</td>
      <td style="padding:8px 0;text-align:right;">${formatCurrency(i.lineTotal)}</td>
    </tr>`)
    .join("")

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.customerEmail,
    subject: `Quote Request Received – ${data.reference} | PULSE 7 EVENTS`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0F12;color:#f0f0f0;padding:32px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#F59E0B;font-size:28px;margin:0;">PULSE 7 EVENTS</h1>
          <p style="color:#999;margin-top:4px;">Sound & Lighting Hire</p>
        </div>
        <h2 style="color:#fff;">Quote Request Confirmed</h2>
        <p>Hi ${data.customerName},</p>
        <p>Thank you for your quote request. We've received it and will get back to you within <strong>24 hours</strong> with a final price and availability confirmation.</p>
        <div style="background:#17191D;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;"><strong style="color:#F59E0B;">Reference:</strong> ${data.reference}</p>
          <p style="margin:0 0 8px;"><strong style="color:#F59E0B;">Event Type:</strong> ${data.eventType}</p>
          <p style="margin:0 0 8px;"><strong style="color:#F59E0B;">Event Date:</strong> ${formatDate(data.eventDate)}</p>
          <p style="margin:0 0 8px;"><strong style="color:#F59E0B;">Venue:</strong> ${data.venueAddress}</p>
          <p style="margin:0;"><strong style="color:#F59E0B;">Hire Period:</strong> ${formatDate(data.hireStartDate)} – ${formatDate(data.hireEndDate)}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <thead>
            <tr style="border-bottom:1px solid #333;">
              <th style="text-align:left;padding:8px 0;color:#999;">Item</th>
              <th style="text-align:center;padding:8px 0;color:#999;">Qty</th>
              <th style="text-align:center;padding:8px 0;color:#999;">Duration</th>
              <th style="text-align:right;padding:8px 0;color:#999;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsList}</tbody>
          <tfoot>
            <tr style="border-top:1px solid #333;">
              <td colspan="3" style="padding:12px 0;font-weight:bold;">Estimated Total</td>
              <td style="padding:12px 0;text-align:right;font-weight:bold;color:#F59E0B;font-size:18px;">${formatCurrency(data.grandTotal)}</td>
            </tr>
            <tr>
              <td colspan="3" style="padding:0 0 8px;color:#999;">Deposit (30%)</td>
              <td style="padding:0 0 8px;text-align:right;color:#999;">${formatCurrency(data.depositAmount)}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#999;font-size:13px;">This is an estimate only. Final pricing will be confirmed by our team. Prices are subject to availability.</p>
        <hr style="border:none;border-top:1px solid #333;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">PULSE 7 EVENTS | info@cybercina.co.uk</p>
      </div>
    `,
  })
}

export async function sendAdminQuoteNotification(data: QuoteEmailData) {
  if (!process.env.SMTP_PASSWORD || !process.env.ADMIN_EMAIL) return

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Quote Request – ${data.reference} | ${data.customerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>New Quote Request</h2>
        <p><strong>Reference:</strong> ${data.reference}</p>
        <p><strong>Customer:</strong> ${data.customerName} (${data.customerEmail})</p>
        <p><strong>Event:</strong> ${data.eventType} on ${formatDate(data.eventDate)}</p>
        <p><strong>Venue:</strong> ${data.venueAddress}</p>
        <p><strong>Hire Period:</strong> ${formatDate(data.hireStartDate)} – ${formatDate(data.hireEndDate)}</p>
        <p><strong>Estimated Total:</strong> ${formatCurrency(data.grandTotal)}</p>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/quotes" style="background:#F59E0B;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin</a></p>
      </div>
    `,
  })
}

export async function sendQuoteStatusUpdate(
  customerEmail: string,
  customerName: string,
  reference: string,
  status: string,
  adminNotes?: string
) {
  if (!process.env.SMTP_PASSWORD) return

  const statusMessages: Record<string, string> = {
    APPROVED: "Great news! Your quote has been approved.",
    REJECTED: "Unfortunately, we are unable to fulfil your quote request at this time.",
    REVIEWING: "Your quote is currently being reviewed by our team.",
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: `Quote Update – ${reference} | PULSE 7 EVENTS`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0F12;color:#f0f0f0;padding:32px;border-radius:8px;">
        <h1 style="color:#F59E0B;">PULSE 7 EVENTS</h1>
        <h2>Quote Update: ${reference}</h2>
        <p>Hi ${customerName},</p>
        <p>${statusMessages[status] ?? `Your quote status has been updated to: ${status}`}</p>
        ${adminNotes ? `<div style="background:#17191D;border-radius:8px;padding:16px;margin:16px 0;"><strong>Message from our team:</strong><p style="margin:8px 0 0;">${adminNotes}</p></div>` : ""}
        <p>If you have any questions, please reply to this email or contact us directly.</p>
        <hr style="border:none;border-top:1px solid #333;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">PULSE 7 EVENTS | info@cybercina.co.uk</p>
      </div>
    `,
  })
}

export async function sendEnquiryNotification(data: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
}) {
  if (!process.env.SMTP_PASSWORD || !process.env.ADMIN_EMAIL) return

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: `New Enquiry – ${data.subject ?? "General"} | ${data.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>New Enquiry</h2>
        <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
        ${data.phone ? `<p><strong>Phone:</strong> ${data.phone}</p>` : ""}
        ${data.subject ? `<p><strong>Subject:</strong> ${data.subject}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p style="background:#f5f5f5;padding:16px;border-radius:6px;">${data.message}</p>
        <p><a href="${process.env.NEXTAUTH_URL}/admin/enquiries" style="background:#F59E0B;color:#000;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View in Admin</a></p>
      </div>
    `,
  })
}

export async function sendContractEmail(data: {
  customerEmail: string
  customerName: string
  reference: string
  contractUrl: string
  eventType: string
  eventDate: Date
  hireStartDate: Date
  hireEndDate: Date
}) {
  if (!process.env.SMTP_PASSWORD) return

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: data.customerEmail,
    subject: `Your Hire Agreement – ${data.reference} | PULSE 7 EVENTS`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0D0F12;color:#f0f0f0;padding:32px;border-radius:8px;">
        <div style="text-align:center;margin-bottom:32px;">
          <h1 style="color:#F59E0B;font-size:28px;margin:0;">PULSE 7 EVENTS</h1>
          <p style="color:#999;margin-top:4px;">Sound & Lighting Hire</p>
        </div>
        <h2 style="color:#fff;">Your Hire Agreement is Ready</h2>
        <p>Hi ${data.customerName},</p>
        <p>Great news! Your quote <strong style="color:#F59E0B;">${data.reference}</strong> has been approved. Please review and sign your hire agreement to confirm your booking.</p>
        <div style="background:#17191D;border-radius:8px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;"><strong style="color:#F59E0B;">Event:</strong> ${data.eventType} on ${formatDate(data.eventDate)}</p>
          <p style="margin:0;"><strong style="color:#F59E0B;">Hire Period:</strong> ${formatDate(data.hireStartDate)} – ${formatDate(data.hireEndDate)}</p>
        </div>
        <div style="text-align:center;margin:32px 0;">
          <a href="${data.contractUrl}" style="background:#F59E0B;color:#000;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block;">
            ✍️ Review & Sign Agreement
          </a>
        </div>
        <p style="color:#999;font-size:13px;">This is a legally binding document. Please read all terms carefully before signing. If you have any questions, contact us at ${process.env.ADMIN_EMAIL}.</p>
        <hr style="border:none;border-top:1px solid #333;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">PULSE 7 EVENTS | ${process.env.ADMIN_EMAIL}</p>
      </div>
    `,
  })
}
