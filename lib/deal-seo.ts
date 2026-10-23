type DealSeoInput = {
  title: string
  store?: string
  brand?: string
  category?: string
  description?: string
  salePrice: number
  affiliateUrl: string
  expiryDate?: string
}

const neutral = (value: string) => value
  .replace(/\bAmazon(?:\.com)?\b/gi, '')
  .replace(/\s*[—|]\s*SpartanShopper\s*$/i, '')
  .replace(/\s+/g, ' ').trim()

function shorten(value: string, limit: number): string {
  if (value.length <= limit) return value
  const words = value.slice(0, limit - 1)
  const cut = words.lastIndexOf(' ')
  return (cut > limit / 2 ? words.slice(0, cut) : words).replace(/[,:;—\s]+$/, '') + '…'
}

/** Stable, retailer-neutral snippets: volatile prices belong in the verified offer. */
export function dealSearchCopy(deal: DealSeoInput, ended: boolean) {
  const label = neutral(deal.title) || 'Product offer'
  const prefix = label.split(/:\s/)[0]
  const compact = label.length > 44 && prefix.length >= 16 && prefix.length <= 39
    ? `${prefix} Deal` : label
  const title = shorten(compact, ended ? 31 : 44) + (ended ? ' — Deal Ended' : '')
  const focus = deal.category === 'fashion'
    ? 'Check sizing, included pieces and delivery before buying.'
    : deal.category === 'automotive'
      ? 'Check vehicle compatibility, included parts and offer conditions.'
      : deal.category === 'home-garden'
        ? 'Check dimensions, included pieces and the space it needs.'
        : 'Check pack count, included pieces and current offer conditions.'
  const description = ended
    ? shorten(`This ${shorten(label, 65)} offer has ended. See current deals and compare the details before buying.`, 160)
    : shorten(`${shorten(label, 80)}. ${focus}`, 160)
  return { title, description }
}

/** Do not substitute a retailer for an unknown brand or infer stock from active:true. */
export function dealProductJsonLd(
  deal: DealSeoInput,
  image: string | null,
  offerCurrent: boolean,
) {
  if (!offerCurrent || !image || !Number.isFinite(deal.salePrice) || deal.salePrice <= 0) return null
  const brand = deal.brand?.trim()
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: deal.title,
    ...(deal.description && { description: deal.description }),
    image,
    ...(brand && brand.toLowerCase() !== deal.store?.trim().toLowerCase()
      ? { brand: { '@type': 'Brand', name: brand } } : {}),
    offers: {
      '@type': 'Offer',
      price: deal.salePrice,
      priceCurrency: 'USD',
      url: deal.affiliateUrl,
      // A timed deadline cannot be represented accurately by a Date-only value.
      // Keep exact instants in visible offer details; include only valid Date inputs here.
      ...(/^\d{4}-\d{2}-\d{2}$/.test(deal.expiryDate ?? '') &&
        Number.isFinite(Date.parse(deal.expiryDate!))
        ? { priceValidUntil: deal.expiryDate } : {}),
    },
  }
}

export const serializeDealJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c')
