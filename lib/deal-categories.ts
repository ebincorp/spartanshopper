/**
 * Deals and posts use different category vocabularies: deals use the deal
 * schema list (`health-beauty`, `home-garden`, …) while posts' `relatedCategory`
 * uses the coupon list (`beauty`, `health`, `home`, …). Map deal → post
 * categories wherever deals link out to related guides.
 *
 * Order matters: the first category is the closest fit, and related-guide
 * lists rank posts from it before later ones (beauty before health).
 */
const DEAL_TO_POST_CATEGORIES: Record<string, string[]> = {
  'health-beauty': ['beauty', 'health'],
  'home-garden': ['home'],
  'food-dining': ['food'],
  electronics: ['tech'],
  fashion: ['fashion'],
  luxury: ['fashion', 'beauty'],
  automotive: ['automotive'],
  travel: ['travel'],
  'sports-outdoors': ['fitness'],
}

// Deal categories too broad for an automatic guide match to be a close fit:
// "beauty" posts span men's grooming to peptide serums, "fashion" posts are
// men's luxury roundups. Deals here only show hand-picked relatedGuides — no
// guide beats the wrong guide.
const BROAD_DEAL_CATEGORIES = new Set(['health-beauty', 'luxury', 'fashion', 'baby'])

/** Post categories close enough to auto-suggest guides on a deal page ([] = hand-picked only). */
export function autoGuideCategoriesForDeal(dealCategory: string | undefined): string[] {
  return dealCategory && !BROAD_DEAL_CATEGORIES.has(dealCategory) ? postCategoriesForDeals([dealCategory]) : []
}

export function postCategoriesForDeals(dealCategories: (string | undefined)[]): string[] {
  return [...new Set(dealCategories.flatMap((c) => (c ? DEAL_TO_POST_CATEGORIES[c] ?? [] : [])))]
}
