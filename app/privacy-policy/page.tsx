import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — SpartanShopper',
  description: 'Privacy policy for SpartanShopper.com — how we collect and use your data.',
}

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-4xl font-extrabold mb-2">Privacy Policy</h1>
          <p className="text-white/50 text-sm">Last Updated: April 11, 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Introduction</h2>
          <p className="text-gray-600 leading-relaxed">
            Welcome to SpartanShopper.com (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We collect information automatically when you visit our site, including:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Pages visited, time spent on site, and referring URLs (via Google Analytics)</li>
            <li>Browser type, operating system, and device type</li>
            <li>IP address (anonymized where possible)</li>
            <li>Cookie identifiers for analytics and session purposes</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            We do <strong>not</strong> collect your name, email address, or any personally identifiable information unless you voluntarily contact us.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cookies</h2>
          <p className="text-gray-600 leading-relaxed">
            SpartanShopper uses cookies to understand how visitors interact with the site. These are primarily analytics cookies set by Google Analytics. You can disable cookies in your browser settings at any time. Note that disabling cookies may affect site functionality.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>To understand which deals, coupons, and sweepstakes are most popular</li>
            <li>To improve site performance and user experience</li>
            <li>To diagnose technical issues</li>
            <li>To measure the effectiveness of our content</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mt-3">
            We do not sell, trade, or rent your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            We use the following third-party services that may process data on our behalf:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li><strong>Google Analytics</strong> — website traffic analysis. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#E63946' }}>Google&apos;s Privacy Policy</a>.</li>
            <li><strong>Vercel</strong> — website hosting and deployment. See <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#E63946' }}>Vercel&apos;s Privacy Policy</a>.</li>
            <li><strong>Sanity.io</strong> — content management system. See <a href="https://www.sanity.io/legal/privacy" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#E63946' }}>Sanity&apos;s Privacy Policy</a>.</li>
            <li><strong>MaxBounty</strong> — affiliate network. When you click an affiliate link and make a purchase, MaxBounty may set cookies. See <a href="https://www.maxbounty.com/privacy.cfm" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#E63946' }}>MaxBounty&apos;s Privacy Policy</a>.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            Depending on your location, you may have the right to:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-2 leading-relaxed">
            <li>Access the personal data we hold about you</li>
            <li>Request correction or deletion of your data</li>
            <li>Opt out of analytics tracking (via browser settings or the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#E63946' }}>Google Analytics Opt-out Browser Add-on</a>)</li>
            <li>Lodge a complaint with a supervisory authority</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Children&apos;s Privacy</h2>
          <p className="text-gray-600 leading-relaxed">
            SpartanShopper is not directed at children under the age of 13. We do not knowingly collect personal information from children.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Changes to This Policy</h2>
          <p className="text-gray-600 leading-relaxed">
            We may update this Privacy Policy from time to time. The &quot;Last Updated&quot; date at the top of this page reflects the most recent revision. Continued use of the site after any changes constitutes your acceptance of the new policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact Us</h2>
          <p className="text-gray-600 leading-relaxed">
            If you have any questions about this Privacy Policy or your data, please contact us at:{' '}
            <a href="mailto:contact@spartanshopper.com" className="font-semibold underline" style={{ color: '#E63946' }}>
              contact@spartanshopper.com
            </a>
          </p>
        </section>

      </div>
    </main>
  )
}
