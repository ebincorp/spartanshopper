import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const res = await fetch('https://app.kit.com/forms/5b21462827/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `email_address=${encodeURIComponent(email)}`,
  })

  if (res.ok) {
    return NextResponse.json({ success: true })
  } else {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
