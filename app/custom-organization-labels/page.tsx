import type { Metadata } from 'next'
import Link from 'next/link'
import { pageMetadata } from '@/lib/seo'
import { voltaritekOffer as offer } from '@/lib/voltaritek-offer'

export const metadata: Metadata = pageMetadata({
  title: 'Custom Labels for Your Workspace',
  description: 'Plan clear labels for carts, back bars, workshops, shelves, and supply stations, then preview a custom set in 3D.',
  path: '/custom-organization-labels',
  image: 'https://cdn.sanity.io/images/eohdr7jw/production/4e7bf36c1459cefeaf278ab6f755359932e2b10e-2545x1304.jpg',
  // This campaign landing page is intentionally excluded from search until its
  // dedicated search-intent research and post-launch review are complete.
  noIndex: true,
})

const useCases = [
  {
    title: 'Medical carts & supply stations',
    copy: 'Use the words your team recognizes for carts, cabinets, bins, and steel supply stations. Confirm your own facility requirements before relying on any label system for clinical workflow, infection-control, or regulatory needs.',
    examples: ['Intake', 'Dressings', 'Specimens', 'Clean supplies'],
  },
  {
    title: 'Back bars & beverage stations',
    copy: 'Name shelves, speed rails, well stations, or storage zones around the way your bar is actually stocked—not the categories in a generic pack.',
    examples: ['Top Shelf', 'Call', 'House', 'Well'],
  },
  {
    title: 'Workshops & tool storage',
    copy: 'Map drawers, cabinets, carts, and parts bins around your workflow. Measure the flat mounting space and test the exact surface before ordering.',
    examples: ['Brake Tools', 'Metric', 'Fasteners', 'Electrical'],
  },
  {
    title: 'Shelving, lockers & home organization',
    copy: 'Create a clear system for utility shelving, garage cabinets, pantry zones, lockers, or equipment storage—especially where the labels need to match your own names.',
    examples: ['Returns', 'Seasonal', 'Batteries', 'Refill'],
  },
]

export default function CustomOrganizationLabelsPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-[#1A1A2E] px-4 py-14 text-white sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-rose-300">Custom organization labels</p>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Label the way your space actually works.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">From medical supply stations to back bars, workshops, and shelving: start with the words people use, then preview a custom label set before checkout.</p>
            <div className="mt-7 rounded-2xl border border-rose-300/30 bg-white/10 p-5">
              <p className="font-bold text-white">{offer.label} at VoltariTek checkout</p>
              <p className="mt-1 text-sm text-slate-200">Use code <span className="rounded bg-white px-2 py-1 font-mono font-bold text-slate-900">{offer.code}</span>. SpartanShopper may earn a commission from qualifying purchases.</p>
              <a href="/go/voltaritek-label-builder" rel="sponsored nofollow" className="mt-4 inline-flex min-h-12 items-center rounded-xl bg-[#E63946] px-5 py-3 font-bold text-white hover:bg-rose-700">Preview your labels in 3D →</a>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/20 shadow-2xl">
            {/* Official builder screenshot, November 11, 2026. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://cdn.sanity.io/images/eohdr7jw/production/4e7bf36c1459cefeaf278ab6f755359932e2b10e-2545x1304.jpg" alt="VoltariTek live 3D builder showing Clinical style and a twelve-label set" className="h-full w-full object-contain" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">One label system, several real-world uses</h2>
          <p className="mt-3 leading-relaxed text-slate-600">Choose a use case as a starting point, then make the labels match the people, locations, and categories in your own space.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {useCases.map((useCase) => (
            <article key={useCase.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-extrabold text-slate-950">{useCase.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{useCase.copy}</p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label={`${useCase.title} example label names`}>
                {useCase.examples.map((example) => <span key={example} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{example}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Before you order</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {[
              ['1. Write the actual names', 'List the drawer, shelf, cart, or station names your team uses before choosing a style.'],
              ['2. Check the surface', 'For a magnetic setup, test the exact steel mounting spot. For other surfaces, review the adhesive option and the finish before applying it.'],
              ['3. Preview and confirm', 'Use the live 3D builder to check wording, size, backing, current price, and the final checkout total.'],
            ].map(([title, copy]) => <div key={title} className="rounded-2xl bg-slate-50 p-6"><h3 className="font-extrabold text-slate-950">{title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-extrabold text-slate-950">Choose a style, then build your sets</h2>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">The builder now has three steps: Design your sets, Add your set to the cart, then Checkout. Pick Classic, Tactical, Clinical, Hazard, Retro Garage, Minimal or Name tag, with available fonts and colors. Each set shares a style, color and size. Add it to the cart before designing another set; every label in the cart counts toward the quantity tiers.</p>
        <p className="mt-4 max-w-3xl leading-relaxed text-slate-600">Large labels are 34 mm tall, Medium 28.9 mm and Small 23.8 mm. There is no fixed character count: the builder checks physical fit. VoltariTek lists a maximum finished length of 255 mm (about 10 inches); the usable text width can be smaller for a particular design. Follow the fit indicator and measure your mounting space.</p>
        <p className="mt-4 text-sm text-slate-500">Official builder screenshot checked November 11, 2026. This is a software preview, not a product-performance test.</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <a href="/go/voltaritek-industries" rel="sponsored nofollow" className="font-bold text-slate-900 underline underline-offset-4">Browse industry starting points</a>
          <a href="/go/voltaritek-bulk-orders" rel="sponsored nofollow" className="font-bold text-slate-900 underline underline-offset-4">Review bulk and team options</a>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-extrabold text-slate-950">Custom words or a ready-made pack?</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Custom labels: price the complete list</h3>
              <p className="mt-3 leading-relaxed text-slate-600">Before the coupon, shipping and taxes, five standard Large labels cost $19.00 and twelve cost $29.99. The first five cost $3.80 each; labels 6–25 cost $1.57 each, 26–50 cost $1.49 each and 51 onward cost $1.39 each. These are marginal tiers: ten Large labels total $26.85. Medium costs 5% less and Small 10% less. Check the quote for premium options; magnetic or adhesive backing is included, while both together cost an extra $0.50 per label.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Seven stocked packs: count useful names</h3>
              <p className="mt-3 leading-relaxed text-slate-600">Choose from Hazmat &amp; Shop Chemicals, General Essentials, Electrical &amp; Fasteners, Automotive, Automotive Hand Tools, Automotive Sockets, and Dental &amp; Medical Supplies. Packs contain 10–15 labels with listed base prices of $19.99–$24.99. Compare the actual words with your list; custom-builder tiers do not price the stock packs.</p>
              <a href="/go/voltaritek-ready-made-packs" rel="sponsored nofollow" className="mt-4 inline-block font-bold text-slate-900 underline underline-offset-4">Compare stocked packs and trade sets</a>
            </div>
          </div>
          <h3 className="mt-8 text-xl font-bold text-slate-900">21 more sets, printed to order</h3>
          <p className="mt-3 max-w-4xl leading-relaxed text-slate-600">The catalog also offers sets for Bar, Coffee Bar, Dental Office, HVAC Van, Machine Shop, Office In/Out Board, Classroom Jobs and other workspaces. Many contain 12 labels at a $29.99 base price; count and price vary. Start with the supplied names or edit the words in the builder. These sets are separate from the seven stocked packs.</p>
          <h3 className="mt-8 text-xl font-bold text-slate-900">Shipping and returns affect the decision</h3>
          <p className="mt-3 max-w-4xl leading-relaxed text-slate-600">Checked November 11, 2026: US Standard shipping is free on orders of $29.99 or more and $8 below that; Express is $15. Check the shipping charge after applying the coupon: the published policy does not specify whether the threshold uses the amount before or after discounts. Custom labels normally dispatch in 3–5 business days; Express changes transit, not printing. Confirm the timing for stocked packs and sets printed to order. Custom wording is final sale for change of mind or buyer-entered errors. Unused stock packs have a 30-day return window, with return shipping paid by the buyer.</p>
          <p className="mt-3 max-w-4xl leading-relaxed text-slate-600">The maker’s one-year Hold Guarantee covers specified failures under normal use, subject to its exclusions. It does not establish universal fit or medical suitability. <a href="https://voltaritek.com/policies.html" className="font-semibold underline underline-offset-4">Read the full shipping, returns and guarantee policy</a>.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 text-center sm:py-20">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-950">Start with your own words.</h2>
        <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-slate-600">Use the builder for current options and checkout details. The offer code has no scheduled expiration, but final availability and order details are confirmed at checkout.</p>
        <a href="/go/voltaritek-label-builder" rel="sponsored nofollow" className="mt-7 inline-flex min-h-12 items-center rounded-xl bg-[#E63946] px-6 py-3 font-bold text-white hover:bg-rose-700">Build a custom label set →</a>
        <p className="mt-5 text-sm text-slate-500">Need help planning a toolbox setup? <Link href="/blog/magnetic-toolbox-labels" className="font-semibold text-slate-800 underline underline-offset-4">Read our magnetic label guide</Link>.</p>
      </section>
    </main>
  )
}
