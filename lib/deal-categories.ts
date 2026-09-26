/**
 * Deals and posts use different category vocabularies: deals use the deal
 * schema list (`health-beauty`, `home-garden`, …) while posts' `relatedCategory`
 * uses the coupon list (`beauty`, `health`, `home`, …). Map deal → post
 * categories wherever deals link out to related guides.
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

export function postCategoriesForDeals(dealCategories: (string | undefined)[]): string[] {
  return [...new Set(dealCategories.flatMap((c) => (c ? DEAL_TO_POST_CATEGORIES[c] ?? [] : [])))]
}
