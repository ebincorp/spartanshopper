import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Affiliate Disclosure — SpartanShopper',
  description: 'FTC-compliant affiliate disclosure for SpartanShopper.com.',
}

export default function AffiliateDisclosurePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">Affiliate Disclosure</h1>
          <p className="text-white/50 text-sm">Last Updated: April 11, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        {/* Highlighted summary box */}
        <div
          className="rounded-2xl px-6 py-5 border-l-4"
          style={{ backgroundColor: '#1A1A2E', borderColor: '#E63946' }}
        >
          <p className="text-white font-semibold leading-relaxed">
            <span style={{ color: '#E63946' }}>Short version:</span> Some links on SpartanShopper are affiliate links. If you click one and make a purchase, we may earn a commission — at no extra cost to you. This helps us keep the site free.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. FTC Compliance</h2>
          <p className="text-gray-600 leading-relaxed">
            In accordance with the Federal Trade Commission&apos;s guidelines concerning the use of endorsements and testimonials in advertising (16 CFR Part 255), SpartanShopper.com discloses that this site contains affiliate links. When you click on certain links and complete a qualifying action (such as making a purchase or signing up), we may receive compensation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Our Affiliate Network</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            SpartanShopper participates in affiliate programs through:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>
              <strong>MaxBounty</strong> — a performance-based affiliate marketing network. Affiliate links on this site may route through <code className="bg-gray-100 px-1 rounded text-sm">spartanshopper.com/go/[slug]</code> before redirecting to the advertiser&apos;s site.
            </li>
            <li>Other affiliate networks and direct partnerships as they are added.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. No Additional Cost to You</h2>
          <p className="text-gray-600 leading-relaxed">
            Using our affiliate links does <strong>not</strong> increase the price you pay. In many cases, our links grant access to the same deals or prices available directly. Any commission we earn comes from the advertiser, not from you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Our Editorial Independence</h2>
          <p className="text-gray-600 leading-relaxed">
            Affiliate relationships do not influence which deals, coupons, or sweepstakes we feature. We list offers because we believe they provide genuine value to our readers. We do not accept payment to feature specific offers, and our editorial opinions are our own.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Identifying Affiliate Links</h2>
          <p className="text-gray-600 leading-relaxed">
            Affiliate links on SpartanShopper may be identified by URLs that pass through our link cloaker (<code className="bg-gray-100 px-1 rounded text-sm">spartanshopper.com/go/</code>) before redirecting to the advertiser. All &quot;Get Deal&quot;, &quot;Shop Now&quot;, and &quot;Enter Now&quot; buttons on deal, coupon, and sweepstakes cards may be affiliate links.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Sweepstakes</h2>
          <p className="text-gray-600 leading-relaxed">
            Sweepstakes listed on SpartanShopper are free to enter and require no purchase. Entry links may be affiliate links. We only list legitimate sweepstakes from reputable sponsors.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Questions</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about our affiliate relationships, please contact us at:{' '}
            <a href="mailto:contact@spartanshopper.com" className="font-semibold underline" style={{ color: '#E63946' }}>
              contact@spartanshopper.com
            </a>
          </p>
        </section>

      </div>
    </main>
  )
}
