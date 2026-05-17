import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const formData = new URLSearchParams()
    formData.append('email_address', email)
    formData.append('api_key', process.env.KIT_API_KEY || '')

    const res = await fetch('https://api.kit.com/v1/forms/5b21462827/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
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
