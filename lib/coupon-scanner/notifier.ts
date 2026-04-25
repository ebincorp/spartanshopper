import type { AmazonPromotion, CreatedDraft } from './types'

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function buildEmailHtml(
  found: AmazonPromotion[],
  added: CreatedDraft[],
  skipped: AmazonPromotion[],
  errors: string[]
): string {
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const draftsSection = added.length === 0
    ? '<p style="color:#6b7280">No new drafts were created.</p>'
    : added.map((d) => `
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px">
          <strong style="font-size:15px">${d.title}</strong><br>
          <span style="color:#E63946;font-family:monospace;font-size:14px;font-weight:bold">${d.code}</span>
          &nbsp;·&nbsp;${d.discount}
          &nbsp;·&nbsp;${d.category}
          &nbsp;·&nbsp;Expires ${formatDate(d.expiryDate)}
        </div>
      `).join('')

  const skippedSection = skipped.length === 0
    ? ''
    : `
      <h2 style="font-size:16px;color:#6b7280;margin-top:32px">Skipped (low discount or expiring soon)</h2>
      <ul style="color:#6b7280;font-size:14px">
        ${skipped.map((s) => `<li>${s.brand} — ${s.discountPercent}% off, expires ${formatDate(s.endDate)}</li>`).join('')}
      </ul>
    `

  const errorsSection = errors.length === 0
    ? ''
    : `
      <h2 style="font-size:16px;color:#dc2626;margin-top:32px">Errors</h2>
      <ul style="color:#dc2626;font-size:14px">
        ${errors.map((e) => `<li>${e}</li>`).join('')}
      </ul>
    `

  return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827">
      <div style="background:#1A1A2E;border-radius:12px;padding:24px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:20px">🏷️ SpartanShopper — Coupon Scan</h1>
        <p style="color:rgba(255,255,255,0.6);margin:8px 0 0">${date}</p>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:24px">
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#E63946">${found.length}</div>
          <div style="font-size:13px;color:#6b7280">promotions found</div>
        </div>
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#16a34a">${added.length}</div>
          <div style="font-size:13px;color:#6b7280">drafts created</div>
        </div>
        <div style="flex:1;background:#f9fafb;border-radius:8px;padding:16px;text-align:center">
          <div style="font-size:28px;font-weight:800;color:#6b7280">${skipped.length}</div>
          <div style="font-size:13px;color:#6b7280">skipped</div>
        </div>
      </div>

      <h2 style="font-size:16px;margin-bottom:12px">New Drafts</h2>
      ${draftsSection}

      ${skippedSection}
      ${errorsSection}

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb;text-align:center">
        <a href="https://spartanshopper.sanity.studio"
           style="background:#E63946;color:#fff;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px">
          Review Drafts in Sanity Studio →
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">
          All drafts have <code>active: false</code> — verify and activate each one before it goes live.
        </p>
      </div>
    </body>
    </html>
  `
}

export async function sendNotification(
  found: AmazonPromotion[],
  added: CreatedDraft[],
  skipped: AmazonPromotion[],
  errors: string[]
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.NOTIFICATION_EMAIL

  if (!apiKey || !toEmail) {
    console.log('[notifier] RESEND_API_KEY or NOTIFICATION_EMAIL not set — skipping email')
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const subject = added.length > 0
    ? `✅ ${added.length} new coupon draft${added.length > 1 ? 's' : ''} — SpartanShopper ${date}`
    : `📭 No new coupons found — SpartanShopper ${date}`

  const { error } = await resend.emails.send({
    from:    'SpartanShopper <noreply@spartanshopper.com>',
    to:      toEmail,
    subject,
    html:    buildEmailHtml(found, added, skipped, errors),
  })

  if (error) {
    console.error('[notifier] Email failed:', error)
  } else {
    console.log(`[notifier] Email sent to ${toEmail}`)
  }
}
