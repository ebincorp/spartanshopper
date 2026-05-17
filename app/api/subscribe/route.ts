import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const res = await fetch('https://api.kit.com/v4/forms/5b21462827/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIT_API_KEY}`,
        'X-Kit-Api-Version': '2025-01-01',
      },
      body: JSON.stringify({ email_address: email }),
    })

    const data = await res.json()
    console.log('Kit response:', res.status, JSON.stringify(data))

    if (res.ok) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Subscription failed', details: data }, { status: 500 })
    }
  } catch (err) {
    console.error('Subscribe error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
