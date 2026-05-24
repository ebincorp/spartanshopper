import { NextRequest, NextResponse } from 'next/server'

// Patterns that should return 410 Gone
const GONE_PATTERNS: RegExp[] = [
  /^\/category(\/.*)?$/,
  /^\/article(\/.*)?$/,
  /^\/grocery-coupons\/?$/,
  /^\/coupon-map\/?$/,
  /^\/diy-and-tools(\/.*)?$/,
  /^\/comments_post(\/.*)?$/,
  /^\/cgi-bin(\/.*)?$/,
  /^\/cgi-sys\/defaultwebpage\.cgi\/?$/,
  // Root-level Title-Case store paths e.g. /Guitar-Center/ or /Best-Buy
  /^\/[A-Z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*\/?$/,
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  for (const pattern of GONE_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse(null, { status: 410 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/category/:path*',
    '/article/:path*',
    '/grocery-coupons',
    '/coupon-map',
    '/diy-and-tools/:path*',
    '/comments_post/:path*',
    '/cgi-bin/:path*',
    '/cgi-sys/defaultwebpage.cgi',
    // Broad single-segment root paths — lets middleware check for Title-Case
    '/:slug',
  ],
}
