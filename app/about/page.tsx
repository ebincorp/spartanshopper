import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — SpartanShopper',
  description: 'Learn about SpartanShopper — our mission to help you save money and win prizes through curated deals, coupons, and sweepstakes.',
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div style={{ backgroundColor: '#1A1A2E' }} className="py-16 px-4 text-center relative overflow-hidden">
        <div
          style={{ backgroundColor: '#E63946' }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] opacity-10 blur-3xl rounded-full pointer-events-none"
        />
        <div className="relative max-w-2xl mx-auto">
          <h1 className="text-white text-5xl font-extrabold tracking-tight mb-3">
            Spartan<span style={{ color: '#E63946' }}>Shopper</span>
          </h1>
          <p className="text-white/60 text-lg">
            Save Big. Enter to Win. Shop Smart.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-14">

        {/* Our Mission */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            SpartanShopper exists to help everyday people spend less and win more. We scour the internet for the best deals, verify coupon codes so you don&apos;t waste time at checkout, and surface legitimate free sweepstakes so you can enter to win without spending a dime.
          </p>
          <p className="text-gray-600 leading-relaxed">
            We believe saving money shouldn&apos;t require hours of searching. That&apos;s why we curate everything in one place — updated daily — so you can browse, click, and save in minutes.
          </p>
        </section>

        {/* How It Works */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Browse Offers',
                desc: 'Explore curated deals, verified coupon codes, and free sweepstakes — all updated daily.',
              },
              {
                step: '2',
                title: 'Click to Claim',
                desc: 'Hit the button on any offer. We\'ll route you directly to the retailer or sweepstake entry page.',
              },
              {
                step: '3',
                title: 'Save or Win',
                desc: 'Complete your purchase at a discount, apply your coupon code, or enter the sweepstake for free.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl p-6 flex flex-col"
                style={{ backgroundColor: '#1A1A2E' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-lg mb-4 flex-shrink-0"
                  style={{ backgroundColor: '#E63946' }}
                >
                  {item.step}
                </div>
                <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Trust Us */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Why Trust Us</h2>
          <div className="space-y-4">
            {[
              {
                icon: '✅',
                title: 'FTC Compliant',
                desc: 'We follow FTC guidelines on affiliate marketing. All commercial relationships are clearly disclosed.',
              },
              {
                icon: '🔍',
                title: 'No Fake Deals',
                desc: 'We only list offers we believe are genuine. Expired or unverified deals are marked or removed.',
              },
              {
                icon: '🏷️',
                title: 'Verified Coupon Codes',
                desc: 'Codes marked "Verified" have been tested. We flag expired codes as quickly as possible.',
              },
              {
                icon: '🏆',
                title: 'Legitimate Sweepstakes Only',
                desc: 'Every sweepstake we list is free to enter. We do not list scams, surveys disguised as sweepstakes, or anything requiring a purchase to enter.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 bg-white rounded-2xl p-5 shadow-sm">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Affiliate Relationships */}
        <section>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">Our Affiliate Relationships</h2>
          <p className="text-gray-600 leading-relaxed mb-3">
            SpartanShopper earns commissions through affiliate programs, primarily via the{' '}
            <strong>MaxBounty</strong> affiliate network. When you click a deal, coupon, or sweepstake link and complete a qualifying action, we may receive a small commission from the advertiser.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            This never affects the price you pay — you get the same deal, discount, or free entry regardless of whether we earn a commission. These relationships are what allow us to keep SpartanShopper free and updated.
          </p>
          <Link
            href="/affiliate-disclosure"
            className="inline-block font-bold text-sm px-5 py-2.5 rounded-xl text-white transition hover:opacity-90"
            style={{ backgroundColor: '#E63946' }}
          >
            Read Full Affiliate Disclosure →
          </Link>
        </section>

        {/* Contact */}
        <section>
          <div
            className="rounded-2xl px-8 py-8 text-center"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            <h2 className="text-white text-2xl font-extrabold mb-2">Get in Touch</h2>
            <p className="text-white/50 text-sm mb-5">
              Have a deal tip, a broken link to report, or just want to say hello?
            </p>
            <a
              href="mailto:contact@spartanshopper.com"
              className="inline-block font-bold text-sm px-6 py-3 rounded-xl text-white transition hover:opacity-90"
              style={{ backgroundColor: '#E63946' }}
            >
              contact@spartanshopper.com
            </a>
          </div>
        </section>

      </div>
    </main>
  )
}
