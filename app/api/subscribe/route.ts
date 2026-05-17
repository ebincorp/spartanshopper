import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const res = await fetch(`https://api.kit.com/v4/forms/5b21462827/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIT_API_KEY}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email_address: email }),
    })

    const data = await res.json()

    if (res.ok) {
      return NextResponse.json({ success: true })
    } else {
      // Return full error details temporarily for debugging
      return NextResponse.json({
        error: 'Subscription failed',
        status: res.status,
        details: data,
        formId: '5b21462827',
        hasKey: !!process.env.KIT_API_KEY
      }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
