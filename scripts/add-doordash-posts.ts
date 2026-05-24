import dotenv from 'dotenv'
import path from 'path'
import { createClient } from '@sanity/client'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  token:     process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn:    false,
})

// ── Portable-text helpers ────────────────────────────────────────────────────

const k = () => crypto.randomUUID().replace(/-/g, '').slice(0, 12)

type Span    = { _type: 'span'; _key: string; text: string; marks: string[] }
type LinkDef = { _key: string; _type: 'link'; href: string }
type Block   = {
  _type: 'block'; _key: string; style: string
  children: Span[]; markDefs: LinkDef[]
  listItem?: 'bullet' | 'number'; level?: number
}

const s = (text: string, marks: string[] = []): Span =>
  ({ _type: 'span', _key: k(), text, marks })

const p = (spans: Span[], defs: LinkDef[] = []): Block =>
  ({ _type: 'block', _key: k(), style: 'normal', children: spans, markDefs: defs })

const h2 = (text: string): Block =>
  ({ _type: 'block', _key: k(), style: 'h2', children: [s(text)], markDefs: [] })

const h3 = (text: string): Block =>
  ({ _type: 'block', _key: k(), style: 'h3', children: [s(text)], markDefs: [] })

const bullet = (spans: Span[], defs: LinkDef[] = []): Block =>
  ({ _type: 'block', _key: k(), style: 'normal', listItem: 'bullet', level: 1, children: spans, markDefs: defs })

const li = (spans: Span[], defs: LinkDef[] = []): Block =>
  ({ _type: 'block', _key: k(), style: 'normal', listItem: 'number', level: 1, children: spans, markDefs: defs })

function link(text: string, href: string): { span: Span; def: LinkDef } {
  const lk = k()
  return { span: s(text, [lk]), def: { _key: lk, _type: 'link', href } }
}

// ── Post 1 body: free-doordash-gift-card ─────────────────────────────────────

function buildPost1Body(): Block[] {
  const sweepsUrl = 'https://www.spartanshopper.com/go/doordash-gift-card-sweepstakes'
  const l1 = link('Enter the $100 DoorDash Gift Card Sweepstakes', sweepsUrl)
  const l2 = link('Enter the $100 DoorDash Gift Card Sweepstakes — Free', sweepsUrl)

  return [
    p([s('If you’ve ever searched for a '), s('free DoorDash gift card', ['strong']), s(', you already know how that goes — page after page of “generators,” code lists, and survey farms that exist purely to harvest your data. None of them work. None of them have ever worked.')]),
    p([s('What does work is knowing where legitimate gift card giveaways actually happen, and which reward platforms consistently pay out. This guide covers both — including a monthly sweepstakes where US residents can enter to win a $100 DoorDash gift card completely free, no purchase necessary.')]),

    h2('Method 1: Enter the $100 DoorDash Gift Card Sweepstakes'),
    p([s('The most direct route to a free DoorDash gift card is entering a legitimate monthly sweepstakes that pays out real prizes. ConsumerTestConnect runs a recurring DoorDash gift card contest open to US residents — no purchase required, no credit card, just a simple entry form.')]),
    bullet([s('Prize:', ['strong']), s(' $100 DoorDash Gift Card')]),
    bullet([s('Entry frequency:', ['strong']), s(' Monthly')]),
    bullet([s('Who can enter:', ['strong']), s(' US residents, 18+')]),
    bullet([s('Cost:', ['strong']), s(' Free')]),
    p([l1.span], [l1.def]),
    p([s('This is the fastest legitimate path to a free DoorDash gift card for most people. The entry takes under a minute and the contest resets monthly, so you can enter every 30 days.')]),

    h2('Method 2: Swagbucks'),
    p([s('Swagbucks', ['strong']), s(' is the most established get-paid-to platform on the internet — over 10 million members, a 4.3 rating on Trustpilot, and a genuinely functional reward system. You earn points (called SB) by completing surveys, watching videos, shopping online, and using their search engine. Once you hit $25 in points, you can redeem for a DoorDash gift card.')]),
    p([s('The realistic timeline for a new user is 1–3 days to reach the $25 threshold, depending on how many surveys you complete. The platform has been around since 2008 and consistently pays out — it’s not a scam, but it does require actual time investment.')]),
    p([s('Best for:', ['strong']), s(' People willing to spend 30–60 minutes on surveys in exchange for a gift card.')]),

    h2('Method 3: Microsoft Rewards'),
    p([s('If you already use a Windows computer or Edge browser, '), s('Microsoft Rewards', ['strong']), s(' is genuinely passive income. You earn points just by using Bing as your search engine, completing daily quizzes, and taking short polls. Points accumulate faster than most people expect, and DoorDash gift cards are among the redemption options.')]),
    p([s('The tradeoff is that this works best as a slow-build strategy over several weeks rather than a quick path to an immediate gift card.')]),
    p([s('Best for:', ['strong']), s(' Passive earners who don’t mind switching their default search engine.')]),

    h2('Method 4: Branded Surveys'),
    p([s('Branded Surveys', ['strong']), s(' pays users to complete market research questionnaires. The payouts are more consistent than most survey platforms, and DoorDash gift cards are a direct redemption option. New members can typically earn enough for a $5–$10 gift card within the first week.')]),
    p([s('The key advantage over Swagbucks is that Branded Surveys tends to have higher-paying surveys and fewer disqualifications, making the time-per-dollar ratio more favorable.')]),
    p([s('Best for:', ['strong']), s(' People who want a straightforward survey-to-gift-card pipeline.')]),

    h2('Method 5: DoorDash DashPass and Referrals'),
    p([s('DoorDash itself occasionally offers promotional gift card credits through its '), s('DashPass', ['strong']), s(' subscription and referral program. When DoorDash runs promotions, existing members can earn account credits by referring new users — these credits function similarly to gift card balances.')]),
    p([s('This method is inconsistent and promotion-dependent, but worth checking if you’re already a DoorDash user. Log into your account and check the “Promotions” or “Refer a Friend” section for active offers.')]),
    p([s('Best for:', ['strong']), s(' Existing DoorDash users looking for account credits.')]),

    h2('What to Avoid: DoorDash Gift Card Generators and Code Lists'),
    p([s('Any website offering “free DoorDash gift card codes” or a “DoorDash gift card generator” is a scam. These sites operate on one of two models:')]),
    li([s('Data harvesting', ['strong']), s(' — They collect your email and personal information to sell to marketing lists. You complete endless surveys that never actually result in a gift card.')]),
    li([s('Malware distribution', ['strong']), s(' — Clicking through “verification” steps installs tracking software or worse on your device.')]),
    p([s('DoorDash gift cards are issued by DoorDash and redeemed through their platform. There is no publicly accessible database of unused codes, no “generator” that creates valid codes, and no list that gets updated with working codes. These sites are universally fraudulent.')]),

    h2('Frequently Asked Questions'),
    h3('Can you actually win a free DoorDash gift card?'),
    p([s('Yes — through legitimate sweepstakes like the ConsumerTestConnect monthly drawing, or by earning points on platforms like Swagbucks and Microsoft Rewards. There is no shortcut that bypasses earning or winning.')]),
    h3('How do I redeem a DoorDash gift card?'),
    p([s('Open the DoorDash app → Account → Gift Cards → Enter the 16-digit code. The balance is added to your account immediately and applies automatically to your next order.')]),
    h3('Do DoorDash gift cards expire?'),
    p([s('DoorDash gift cards do not expire and have no inactivity fees. Once a balance is loaded to your account, it stays there indefinitely.')]),
    h3('Can I use a DoorDash gift card for DashPass?'),
    p([s('No — DoorDash gift card balances can only be used for food orders. DashPass subscriptions must be paid with a credit or debit card.')]),
    h3('What’s the maximum DoorDash gift card amount?'),
    p([s('DoorDash gift cards are available in denominations from $10 to $500. The monthly sweepstakes featured on this page pays out a $100 gift card.')]),

    h2('Final Verdict'),
    p([s('The only legitimate ways to get a free DoorDash gift card are entering real sweepstakes, earning reward points on established platforms, or taking advantage of DoorDash’s own promotional programs. Everything else is a scam designed to collect your data.')]),
    p([s('If you want the fastest path to a free $100 in DoorDash credit, the monthly sweepstakes is the cleanest option — one entry, no surveys, no credit card required.')]),
    p([l2.span], [l2.def]),
    p([s('Disclosure: SpartanShopper may earn a commission when you enter sweepstakes featured on this site. Entering is always free and there is no obligation to purchase anything.', ['em'])]),
  ]
}

// ── Post 2 body: win-doordash-gift-card ──────────────────────────────────────

function buildPost2Body(): Block[] {
  const sweepsUrl   = 'https://www.spartanshopper.com/go/doordash-gift-card-sweepstakes'
  const sweepsPage  = 'https://www.spartanshopper.com/sweepstakes'
  const post1Url    = 'https://www.spartanshopper.com/blog/free-doordash-gift-card'
  const lEntry      = link('Enter to Win a $100 DoorDash Gift Card — Free', sweepsUrl)
  const lSweeps     = link('free sweepstakes page', sweepsPage)
  const lPost1      = link('How to Get a Free DoorDash Gift Card in 2026', post1Url)

  return [
    p([s('Every month, a '), s('$100 DoorDash gift card', ['strong']), s(' goes to a lucky US resident through a free, no-purchase-necessary sweepstakes. The entry takes under a minute, there’s no credit card required, and a new drawing happens every 30 days — so if you don’t win this month, you can enter again next month.')]),
    p([s('This is a legitimate sweepstakes run by ConsumerTestConnect, not a scam survey farm or code generator. Real prizes, real drawings, real winners.')]),

    h2('How to Enter'),
    li([s('Click the entry link below')]),
    li([s('Fill in your email address on the entry form')]),
    li([s('Complete the optional sponsored questionnaire (this is how the sweepstakes is funded — completing it is optional but appreciated)')]),
    li([s('Watch for a notification if you’re selected as a winner')]),
    p([lEntry.span], [lEntry.def]),
    p([s('No purchase necessary. Open to US residents 18+. One entry per person.', ['strong'])]),

    h2('About This Sweepstakes'),
    bullet([s('Prize:', ['strong']), s(' $100 DoorDash Gift Card')]),
    bullet([s('Drawing frequency:', ['strong']), s(' Monthly')]),
    bullet([s('Eligibility:', ['strong']), s(' US residents, 18 years or older')]),
    bullet([s('Entry cost:', ['strong']), s(' Free')]),
    bullet([s('Sponsor:', ['strong']), s(' ConsumerTestConnect')]),
    p([s('The $100 DoorDash gift card can be applied to any DoorDash order — food delivery, grocery delivery, or DashMart convenience items. It’s loaded directly to your DoorDash account balance and never expires.')]),

    h2('Is This Sweepstakes Legit?'),
    p([s('Yes. ConsumerTestConnect is a market research company that uses sweepstakes to incentivize participation in consumer surveys. The model is straightforward: they get survey responses, participants get a chance to win real prizes. Winners are contacted directly and prizes are fulfilled.')]),
    p([s('This is a fundamentally different structure from the “free gift card generator” sites that plague search results. Those sites harvest data and deliver nothing. This sweepstakes has a funded prize pool, official rules, and a real drawing process.')]),

    h2('Frequently Asked Questions'),
    h3('How do I know if I won?'),
    p([s('ConsumerTestConnect contacts winners directly via the email address provided at entry. Check your spam folder if you entered and don’t hear back — contest notification emails sometimes get filtered.')]),
    h3('Can I enter every month?'),
    p([s('Yes. The contest runs monthly and entries reset with each new drawing period. Bookmark this page and come back each month to enter again.')]),
    h3('Do I have to complete the survey to win?'),
    p([s('The optional sponsored questionnaire is how the sweepstakes is funded, but completing it is not required to be entered in the drawing. Your entry is valid regardless.')]),
    h3('What can I use a DoorDash gift card for?'),
    p([s('A DoorDash gift card balance can be used for any DoorDash order — restaurant delivery, grocery delivery through DashMart, or convenience items. The balance is applied automatically at checkout and never expires.')]),
    h3('Is there a limit on entries?'),
    p([s('One entry per person per drawing period. Duplicate entries are disqualified per the official sweepstakes rules.')]),

    h2('More Free Sweepstakes'),
    p([s('Looking for more chances to win? SpartanShopper tracks legitimate sweepstakes across dozens of categories — from gift cards to vacations to tech. Browse all current sweepstakes on our '), lSweeps.span, s('.')], [lSweeps.def]),
    p([s('For more ways to get free DoorDash credit and other gift cards, see our full guide: '), lPost1.span, s('.')], [lPost1.def]),
    p([s('Disclosure: SpartanShopper may earn a commission when you enter sweepstakes featured on this site. Entering is always free and there is no obligation to purchase anything. SpartanShopper is not affiliated with or sponsored by DoorDash.', ['em'])]),
  ]
}

// ── JSON-LD ──────────────────────────────────────────────────────────────────

const jsonLdPost1 = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How to Get a Free DoorDash Gift Card in 2026 (Legit Methods Only)',
    description: 'Want a free DoorDash gift card? Here are the only legit methods that actually work in 2026 — including one sweepstakes paying out $100 in DoorDash credit monthly.',
    url: 'https://www.spartanshopper.com/blog/free-doordash-gift-card',
    datePublished: '2026-05-22T00:00:00Z',
    dateModified: '2026-05-22T00:00:00Z',
    author: { '@type': 'Organization', name: 'SpartanShopper', url: 'https://www.spartanshopper.com' },
    publisher: { '@type': 'Organization', name: 'SpartanShopper', url: 'https://www.spartanshopper.com' },
    image: 'https://cdn.sanity.io/images/eohdr7jw/production/e49872adf5a433c3aafd816d5a25043d62b5e3f5-1408x768.png',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'Can you actually win a free DoorDash gift card?', acceptedAnswer: { '@type': 'Answer', text: 'Yes — through legitimate sweepstakes like the ConsumerTestConnect monthly drawing, or by earning points on platforms like Swagbucks and Microsoft Rewards. There is no shortcut that bypasses earning or winning.' } },
      { '@type': 'Question', name: 'How do I redeem a DoorDash gift card?', acceptedAnswer: { '@type': 'Answer', text: 'Open the DoorDash app → Account → Gift Cards → Enter the 16-digit code. The balance is added to your account immediately and applies automatically to your next order.' } },
      { '@type': 'Question', name: 'Do DoorDash gift cards expire?', acceptedAnswer: { '@type': 'Answer', text: 'DoorDash gift cards do not expire and have no inactivity fees. Once a balance is loaded to your account, it stays there indefinitely.' } },
      { '@type': 'Question', name: 'Can I use a DoorDash gift card for DashPass?', acceptedAnswer: { '@type': 'Answer', text: 'No — DoorDash gift card balances can only be used for food orders. DashPass subscriptions must be paid with a credit or debit card.' } },
      { '@type': 'Question', name: "What’s the maximum DoorDash gift card amount?", acceptedAnswer: { '@type': 'Answer', text: 'DoorDash gift cards are available in denominations from $10 to $500. The monthly sweepstakes featured on this page pays out a $100 gift card.' } },
    ],
  },
], null, 2)

const jsonLdPost2 = JSON.stringify([
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'Win a $100 DoorDash Gift Card — Free Monthly Sweepstakes (2026)',
    description: 'Enter to win a $100 DoorDash gift card — free monthly sweepstakes open to US residents 18+. No purchase necessary. New drawing every month.',
    url: 'https://www.spartanshopper.com/blog/win-doordash-gift-card',
    datePublished: '2026-05-22T00:00:00Z',
    dateModified: '2026-05-22T00:00:00Z',
    author: { '@type': 'Organization', name: 'SpartanShopper', url: 'https://www.spartanshopper.com' },
    publisher: { '@type': 'Organization', name: 'SpartanShopper', url: 'https://www.spartanshopper.com' },
    image: 'https://cdn.sanity.io/images/eohdr7jw/production/577858077bc3f8ab44269981641aab958048cf69-1408x768.png',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How do I know if I won?', acceptedAnswer: { '@type': 'Answer', text: "ConsumerTestConnect contacts winners directly via the email address provided at entry. Check your spam folder if you entered and don’t hear back — contest notification emails sometimes get filtered." } },
      { '@type': 'Question', name: 'Can I enter every month?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. The contest runs monthly and entries reset with each new drawing period. Bookmark this page and come back each month to enter again.' } },
      { '@type': 'Question', name: 'Do I have to complete the survey to win?', acceptedAnswer: { '@type': 'Answer', text: 'The optional sponsored questionnaire is how the sweepstakes is funded, but completing it is not required to be entered in the drawing. Your entry is valid regardless.' } },
      { '@type': 'Question', name: 'What can I use a DoorDash gift card for?', acceptedAnswer: { '@type': 'Answer', text: 'A DoorDash gift card balance can be used for any DoorDash order — restaurant delivery, grocery delivery through DashMart, or convenience items. The balance is applied automatically at checkout and never expires.' } },
      { '@type': 'Question', name: 'Is there a limit on entries?', acceptedAnswer: { '@type': 'Answer', text: 'One entry per person per drawing period. Duplicate entries are disqualified per the official sweepstakes rules.' } },
    ],
  },
], null, 2)

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════')
  console.log('  SpartanShopper — Add DoorDash Post Drafts to Sanity')
  console.log('═══════════════════════════════════════════════════════\n')

  // Check for slug conflicts
  const existing = await client.fetch<{ slug: string }[]>(
    `*[_type == "post" && slug.current in $slugs]{ "slug": slug.current }`,
    { slugs: ['free-doordash-gift-card', 'win-doordash-gift-card'] }
  )
  if (existing.length > 0) {
    const taken = existing.map((d) => d.slug).join(', ')
    console.error(`  ✗ Slug(s) already in use: ${taken}`)
    console.error('  Aborting to prevent duplicate posts.')
    process.exit(1)
  }

  const publishedAt = '2026-05-22T00:00:00Z'

  const post1Id = `drafts.${crypto.randomUUID()}`
  const post2Id = `drafts.${crypto.randomUUID()}`

  const post1 = {
    _id: post1Id,
    _type: 'post',
    title: 'How to Get a Free DoorDash Gift Card in 2026 (Legit Methods Only)',
    slug: { _type: 'slug', current: 'free-doordash-gift-card' },
    publishedAt,
    author: 'SpartanShopper',
    category: 'Deals',
    excerpt: 'Free DoorDash gift card codes floating around the internet are almost always scams. Here are the methods that actually work — including one monthly sweepstakes where real people win $100 in DoorDash credit.',
    coverImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-e49872adf5a433c3aafd816d5a25043d62b5e3f5-1408x768-png' },
      alt: 'DoorDash gift card next to a smartphone displaying the DoorDash app on a white marble countertop',
    },
    seo: {
      metaDescription: 'Want a free DoorDash gift card? Here are the only legit methods that actually work in 2026 — including one sweepstakes paying out $100 in DoorDash credit monthly.',
    },
    jsonLd: jsonLdPost1,
    body: buildPost1Body(),
  }

  const post2 = {
    _id: post2Id,
    _type: 'post',
    title: 'Win a $100 DoorDash Gift Card — Free Monthly Sweepstakes (2026)',
    slug: { _type: 'slug', current: 'win-doordash-gift-card' },
    publishedAt,
    author: 'SpartanShopper',
    category: 'Sweepstakes',
    excerpt: "A legitimate monthly sweepstakes is giving away $100 in DoorDash credit every month to US residents. Free to enter, no credit card, no strings attached. Here’s how to get your entry in.",
    coverImage: {
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-577858077bc3f8ab44269981641aab958048cf69-1408x768-png' },
      alt: "DoorDash gift card on a white marble surface with a winner’s trophy for a free sweepstakes giveaway",
    },
    seo: {
      metaDescription: 'Enter to win a $100 DoorDash gift card — free monthly sweepstakes open to US residents 18+. No purchase necessary. New drawing every month.',
    },
    jsonLd: jsonLdPost2,
    body: buildPost2Body(),
  }

  process.stdout.write('  Creating Post 1: free-doordash-gift-card… ')
  await client.create(post1)
  console.log('✓')
  console.log(`  Draft ID: ${post1Id}\n`)

  process.stdout.write('  Creating Post 2: win-doordash-gift-card… ')
  await client.create(post2)
  console.log('✓')
  console.log(`  Draft ID: ${post2Id}\n`)

  console.log('── Done ────────────────────────────────────────────────')
  console.log('  Review at: https://spartanshopper.sanity.studio')
}

main().catch((err) => {
  console.error('\n[fatal]', err.message ?? err)
  process.exit(1)
})
