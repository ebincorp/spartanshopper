// Campaign dates are midnight in America/Los_Angeles (still PDT on November 1).
// After the end date, omit this feature on the homepage's next ISR regeneration
// (the existing revalidation interval is 300 seconds, not an exact-time timer).
const campaignStartsAt = Date.parse('2026-10-21T00:00:00-07:00')
const campaignEndsAt = Date.parse('2026-11-01T00:00:00-07:00')

export function isHalloweenFeatureActive(now = Date.now()): boolean {
  return Number.isFinite(now) && now >= campaignStartsAt && now < campaignEndsAt
}

export const halloweenGuides = [
  {
    number: '01',
    label: 'The outfit',
    title: 'A costume without the scramble',
    description: 'Start with your closet. Check the fit, included pieces, and delivery before buying extras.',
    href: '/blog/last-minute-halloween-costumes-2026',
    cta: 'Find last-minute costume ideas',
  },
  {
    number: '02',
    label: 'The atmosphere',
    title: 'Make one corner feel haunted',
    description: 'Give a doorway, mantel, or party table a little drama. The whole house can sit this one out.',
    href: '/blog/indoor-halloween-decorations-2026',
    cta: 'Plan your indoor decorations',
  },
  {
    number: '03',
    label: 'The doorbell crowd',
    title: 'Handouts beyond the candy bowl',
    description: 'Compare non-candy ideas, plan quantities, and check age labels before stocking up.',
    href: '/blog/non-candy-halloween-treats',
    cta: 'Compare non-candy treats',
  },
] as const
