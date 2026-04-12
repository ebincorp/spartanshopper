import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — SpartanShopper',
  description: 'Terms of service for SpartanShopper.com.',
}

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">Terms of Service</h1>
          <p className="text-white/50 text-sm">Last Updated: April 11, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing or using SpartanShopper.com (&quot;the Site&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Site. We reserve the right to update these terms at any time, and your continued use of the Site constitutes acceptance of any changes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Use of the Site</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            You agree to use SpartanShopper only for lawful purposes and in a manner that does not infringe the rights of others. You may not:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Scrape, copy, or reproduce content from the Site without written permission</li>
            <li>Use automated tools to access the Site at scale</li>
            <li>Attempt to disrupt, damage, or gain unauthorized access to the Site or its servers</li>
            <li>Use the Site for any fraudulent or deceptive purpose</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. No Guarantee of Deals or Availability</h2>
          <p className="text-gray-600 leading-relaxed">
            SpartanShopper aggregates deals, coupons, and sweepstakes for informational purposes only. We make no guarantee that any deal, coupon code, or sweepstake listed on the Site is currently active, valid, or available. Prices, availability, and offer terms are controlled entirely by third-party retailers and advertisers and are subject to change without notice. Always verify deal details on the retailer&apos;s website before completing a purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Coupon Codes</h2>
          <p className="text-gray-600 leading-relaxed">
            Coupon codes listed on the Site are provided as-is. We do not guarantee that any code will work at checkout. Coupon codes may expire, be limited to specific products, or have been revoked by the issuing retailer. The &quot;Verified&quot; label indicates codes that were tested at the time of listing but does not guarantee ongoing validity.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Sweepstakes</h2>
          <p className="text-gray-600 leading-relaxed">
            SpartanShopper lists sweepstakes operated by third parties. We are not the sponsor or administrator of any sweepstakes featured on the Site. Entry, eligibility, and prize fulfillment are governed entirely by the sponsoring company&apos;s official rules. We make no representation regarding the legitimacy, availability, or fulfillment of any sweepstake prize.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. External Links</h2>
          <p className="text-gray-600 leading-relaxed">
            The Site contains links to third-party websites, including retailer sites and affiliate destinations. These links are provided for convenience only. SpartanShopper has no control over the content, privacy practices, or accuracy of third-party sites. Inclusion of a link does not imply endorsement. We encourage you to review the terms and privacy policies of any third-party site you visit.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Affiliate Relationships</h2>
          <p className="text-gray-600 leading-relaxed">
            Some links on this Site are affiliate links through the MaxBounty network and other affiliate programs. See our{' '}
            <a href="/affiliate-disclosure" className="font-semibold underline" style={{ color: '#E63946' }}>
              Affiliate Disclosure
            </a>{' '}
            for full details. Affiliate relationships do not affect the price you pay.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            All content on SpartanShopper, including text, graphics, logos, and site design, is the property of SpartanShopper or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without express written permission.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            To the fullest extent permitted by law, SpartanShopper and its operators shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of the Site, inability to access the Site, reliance on any deal or coupon listed, participation in any sweepstake, or any transaction conducted with a third-party advertiser. Your use of the Site is entirely at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Disclaimer of Warranties</h2>
          <p className="text-gray-600 leading-relaxed">
            The Site is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. We do not warrant that the Site will be uninterrupted, error-free, or free of viruses or other harmful components.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These Terms of Service shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">12. Contact</h2>
          <p className="text-gray-600 leading-relaxed">
            For questions about these Terms of Service, please contact us at:{' '}
            <a href="mailto:contact@spartanshopper.com" className="font-semibold underline" style={{ color: '#E63946' }}>
              contact@spartanshopper.com
            </a>
          </p>
        </section>

      </div>
    </main>
  )
}
