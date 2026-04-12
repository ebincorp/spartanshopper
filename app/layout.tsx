import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import GoogleAnalytics from '@/components/GoogleAnalytics'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'SpartanShopper — Deals, Coupons & Sweepstakes',
    template: '%s — SpartanShopper',
  },
  description: 'Find the best deals, verified coupon codes, and free sweepstakes — all in one place.',
  keywords: 'deals, coupons, coupon codes, sweepstakes, discounts, promo codes, free prizes',
  metadataBase: new URL('https://spartanshopper.com'),
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'SpartanShopper — Deals, Coupons & Sweepstakes',
    description: 'Find the best deals, verified coupon codes, and free sweepstakes — all in one place.',
    url: 'https://spartanshopper.com',
    siteName: 'SpartanShopper',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'SpartanShopper — Deals, Coupons & Sweepstakes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpartanShopper — Deals, Coupons & Sweepstakes',
    description: 'Find the best deals, verified coupon codes, and free sweepstakes — all in one place.',
    images: ['/og-default.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50`}>
        <GoogleAnalytics />
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}
