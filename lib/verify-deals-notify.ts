/**
 * Alerting for the daily verify-deals cron.
 *
 * The cron mutates the live site (deactivates dead deals, reprices moved ones),
 * so a silent failure is dangerous: eligibility could flip back, Sanity could
 * return nothing, or Amazon could return a bad-but-200 response that looks like
 * "every deal died". This sends an email (via the same Resend setup the coupon
 * scanner uses) so those states are loud, not silent.
 *
 * Severity:
 *  - 'alert'  — something is wrong and needs a human (fault / regression / crash)
 *  - 'digest' — a routine successful run, sent on EVERY run as a daily heartbeat
 *               (whether or not anything changed). This is deliberate: if the
 *               digest is only sent when something changes, "no email" is
 *               ambiguous between "nothing changed" and "the cron never ran"
 *               (schedule deleted, route 404'd after a refactor, etc.). A daily
 *               heartbeat makes silence mean exactly one thing: the cron is down.
 */
type Severity = 'alert' | 'digest'

export interface VerifyAlert {
  severity: Severity
  subject: string
  heading: string
  lines: string[]
}

export async function sendVerifyAlert(alert: VerifyAlert): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const toEmail = process.env.NOTIFICATION_EMAIL

  if (!apiKey || !toEmail) {
    console.log('[verify-notify] RESEND_API_KEY or NOTIFICATION_EMAIL not set — skipping email')
    return
  }

  const accent = alert.severity === 'alert' ? '#dc2626' : '#16a34a'
  const date = new Date().toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111827">
      <div style="background:#1A1A2E;border-radius:12px;padding:24px;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:20px">🛰️ SpartanShopper — Deal Verification</h1>
        <p style="color:rgba(255,255,255,0.6);margin:8px 0 0">${date}</p>
      </div>
      <h2 style="font-size:17px;color:${accent};margin:0 0 12px">${alert.heading}</h2>
      <ul style="font-size:14px;line-height:1.6;color:#374151">
        ${alert.lines.map((l) => `<li>${l}</li>`).join('')}
      </ul>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb">
        <a href="https://vercel.com/dashboard"
           style="color:#E63946;font-weight:600;text-decoration:none;font-size:14px">
          View cron logs in Vercel →
        </a>
      </div>
    </body>
    </html>
  `

  const { Resend } = await import('resend')
  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: 'SpartanShopper <noreply@spartanshopper.com>',
    to: toEmail,
    subject: alert.subject,
    html,
  })

  if (error) console.error('[verify-notify] Email failed:', error)
  else console.log(`[verify-notify] ${alert.severity} email sent to ${toEmail}`)
}
