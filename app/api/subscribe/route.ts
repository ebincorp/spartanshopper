import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const res = await fetch(`https://api.convertkit.com/v3/forms/9454781/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_secret: 'AL5xOi9VW2CboZy7ifuv37V_q920NOSzRov1i48SKgY',
        email,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({
        error: 'Subscription failed',
        status: res.status,
        details: data
      }, { status: 500 })
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
