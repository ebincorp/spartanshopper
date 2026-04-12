import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact — SpartanShopper',
  description: 'Get in touch with SpartanShopper. Questions, suggestions, or partnership inquiries welcome.',
}

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">Contact Us</h1>
          <p className="text-white/60">Have a question, suggestion, or partnership inquiry? We&apos;d love to hear from you.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

        {/* Email card */}
        <div
          className="rounded-2xl px-8 py-8 text-center"
          style={{ backgroundColor: '#1A1A2E' }}
        >
          <p className="text-white/50 text-sm uppercase tracking-widest font-semibold mb-3">Email Us</p>
          <a
            href="mailto:contact@spartanshopper.com"
            className="text-2xl font-extrabold hover:opacity-80 transition"
            style={{ color: '#E63946' }}
          >
            contact@spartanshopper.com
          </a>
          <p className="text-white/40 text-sm mt-4">
            We typically respond within 1–2 business days.
          </p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-bold text-gray-900 mb-1">General Inquiries</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Questions about the site, content suggestions, or anything else — drop us an email and we&apos;ll get back to you.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-2xl mb-3">🤝</div>
            <h3 className="font-bold text-gray-900 mb-1">Partnership Inquiries</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Interested in featuring your brand&apos;s deals or sweepstakes on SpartanShopper? Reach out and let&apos;s talk.
            </p>
          </div>
        </div>

        {/* Retailer note */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-6 py-5 flex gap-4">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <div>
            <h3 className="font-bold text-amber-800 mb-1">Deal or Coupon Issues?</h3>
            <p className="text-amber-700 text-sm leading-relaxed">
              If a deal price is wrong, a coupon code isn&apos;t working, or you have an issue with an order, please contact the retailer directly — they&apos;re best placed to resolve it. We curate and list offers but are not the seller.
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
