import { endTime } from './offer-status'

export interface SocialProductFeature {
  id: string
  title: string
  description: string
  category: string
  postedAt?: string
  dealSlug?: string
  guideSlug?: string
  affiliateSlug: string
  fallbackImage?: string
  store?: string
  watchUrl?: string
}

export interface SocialProductCard {
  id: string
  title: string
  description: string
  category: string
  postedAt?: string
  imageUrl?: string
  imageAlt: string
  detailHref: string
  detailKind: 'deal' | 'guide'
  affiliateHref?: string
  store: string
  offerEnded: boolean
  watchUrl?: string
}

export interface SocialProductRecord {
  _type: 'deal' | 'post'
  slug: string
  active?: boolean
  startDate?: string
  expiryDate?: string
  publishedAt?: string
  imageUrl?: string
  imageWidth?: number
  store?: string
}

// Publication evidence: docs/*/social-publication.json and tiktok-publication.json
// in the primary workspace, Oct 17–19, 2026. Dates describe our feature, not a sale
// deadline. Preserve the existing Risina pick without asserting TikTok visibility.
// Add confirmed posts here; published CMS records still gate every card.
export const socialProductFeatures: SocialProductFeature[] = [
  { id: 'tata-harper-creme-supreme', title: 'Tata Harper Crème Supreme Rich Moisture Cream', description: 'Full-size 1.7 fl oz / 50 ml rich moisture cream for dry or mature-feeling skin. It has a strong botanical fragrance, so it is not the pick for fragrance-free routines. Check the live price before buying.', category: 'Beauty', postedAt: '2026-10-24', dealSlug: 'tata-harper-creme-supreme-50ml', affiliateSlug: 'tata-harper-creme-supreme-50ml', watchUrl: 'https://www.tiktok.com/@spartanshopper/video/7700364256016944397' },
  { id: 'voltaritek-label-builder', title: 'VoltariTek Custom Magnetic Labels & 3D Builder', description: 'Type your own label names and preview them in 3D. For toolbox drawers, medical carts, cabinets and workplace organization; check magnetic or adhesive backing for your surface.', category: 'Workshop & Organization', postedAt: '2026-10-22', guideSlug: 'magnetic-toolbox-labels', affiliateSlug: 'voltaritek-label-builder', store: 'VoltariTek', watchUrl: 'https://www.tiktok.com/@spartanshopper/video/7699663141633903885' },
  { id: 'shark-flexstyle', title: 'Shark FlexStyle Copper', description: 'HD433CP multi-styler bundle. Match the Copper model and included attachments from Mara’s video.', category: 'Beauty', postedAt: '2026-10-19', dealSlug: 'shark-flexstyle-copper-multi-styler', affiliateSlug: 'shark-flexstyle-copper-multi-styler' },
  { id: 'risina-trimmer', title: 'Risina 2-in-1 Bikini Trimmer', description: 'TC-017 Pink Essential Kit with separate body and facial heads and guide combs.', category: 'Beauty', postedAt: '2026-10-19', dealSlug: 'risina-2-in-1-bikini-trimmer-pink', affiliateSlug: 'risina-2-in-1-bikini-trimmer-pink' },
  { id: 'samsonite-freeform', title: 'Samsonite Freeform Luggage Set', description: 'Amethyst Purple two-piece set: carry-on and large suitcase. Check airline size limits before buying.', category: 'Travel', postedAt: '2026-10-18', dealSlug: 'samsonite-freeform-purple-2-piece', affiliateSlug: 'samsonite-freeform-purple-2-piece' },
  { id: 'keurig-k-express', title: 'Keurig K-Express Coffee Maker', description: 'Black single-serve K-Cup coffee maker from our coffee-counter post.', category: 'Kitchen', postedAt: '2026-10-18', dealSlug: 'keurig-k-express-coffee-maker', affiliateSlug: 'keurig-k-express' },
  { id: 'ninja-ce251', title: 'Ninja CE251 Coffee Maker', description: 'Stainless-steel 12-cup brewer. Coffee-maker cups are smaller than many everyday mugs.', category: 'Kitchen', postedAt: '2026-10-18', dealSlug: 'ninja-ce251-coffee-maker', affiliateSlug: 'ninja-ce251-coffee-maker' },
  { id: 'forest-green-fleece', title: 'Men’s Full-Zip Polar Fleece', description: 'Forest Green, Large, recycled-polyester version from our cool-weather layering post.', category: 'Fashion', postedAt: '2026-10-18', dealSlug: 'essentials-mens-fleece-forest-green-large', affiliateSlug: 'essentials-mens-fleece-forest-green-large' },
  { id: 'ninja-bn601', title: 'Ninja BN601 Food Processor', description: 'Professional Plus 9-cup model in Grey. Compare it with the KitchenAid in our buying guide.', category: 'Kitchen', postedAt: '2026-10-18', guideSlug: 'kitchenaid-food-processor-deal-2026', affiliateSlug: 'ninja-bn601-food-processor-grey', fallbackImage: '/images/social-products/ninja-bn601.jpg' },
  { id: 'ptr-peel-pads', title: 'Peter Thomas Roth Peptide Skinjection Pads', description: '60-count exfoliating peel pads. These are rinse-off pads, not a leave-on toner.', category: 'Beauty', postedAt: '2026-10-18', guideSlug: 'how-to-use-peptides-in-a-skincare-routine', affiliateSlug: 'peter-thomas-roth-peptide-skinjection-peel-pads', fallbackImage: '/images/social-products/ptr-peel-pads.jpg' },
  { id: 'cosori-turboblaze', title: 'COSORI TurboBlaze Air Fryer', description: '6-quart Dark Gray model, new condition. Match the capacity and version from our post.', category: 'Kitchen', postedAt: '2026-10-18', dealSlug: 'cosori-9-in-1-turboblaze-air-fryer-6-qt', affiliateSlug: 'cosori-9-in-1-turboblaze-air-fryer-6-qt' },
  { id: 'elemis-cleansing-balm', title: 'ELEMIS Pro-Collagen Cleansing Balm', description: 'Original fragranced formula, 100 g. Check the formula and jar size when comparing options.', category: 'Beauty', postedAt: '2026-10-18', dealSlug: 'elemis-pro-collagen-cleansing-balm', affiliateSlug: 'elemis-pro-collagen-cleansing-balm' },
  { id: 'top-gun-jacket', title: 'Leg Avenue Top Gun Costume Jacket', description: 'Licensed jacket in Brown, Large. Check the size chart and delivery date for your event.', category: 'Halloween', postedAt: '2026-10-18', dealSlug: 'leg-avenue-top-gun-jacket-large', affiliateSlug: 'leg-avenue-top-gun-jacket-large' },
  { id: 'ocato-spider-web', title: 'OCATO Giant Spider Web Kit', description: 'Black / 1-Original set with a 200-inch web and 59-inch spider from our decorating video.', category: 'Halloween', postedAt: '2026-10-18', dealSlug: 'ocato-200-inch-web-59-inch-spider', affiliateSlug: 'ocato-200-inch-web-59-inch-spider' },
  { id: 'avapow-tj68', title: 'AVAPOW TJ68 Jump Starter', description: 'Portable 12V jump starter. Check vehicle compatibility and the current coupon terms.', category: 'Automotive', postedAt: '2026-10-17', dealSlug: 'avapow-tj68-jump-starter-coupon', affiliateSlug: 'avapow-tj68-jump-starter-coupon', fallbackImage: '/images/social-products/avapow-tj68.jpg' },
  { id: 'yeoreo-coreflex', title: 'YEOREO CoreFlex Flare Leggings', description: 'Cargo-pocket style in Black, Large, with a 32-inch inseam. Match your size before checkout.', category: 'Fashion', postedAt: '2026-10-17', dealSlug: 'yeoreo-coreflex-flare-leggings-coupon', affiliateSlug: 'yeoreo-coreflex-flare-leggings-coupon', fallbackImage: '/images/social-products/yeoreo-coreflex.jpg' },
  { id: 'hoshanho-knives', title: 'HOSHANHO Loong Knife Block Set', description: '16 pieces: 13 knives, kitchen shears, sharpening rod and block—not 16 knives.', category: 'Kitchen', postedAt: '2026-10-17', dealSlug: 'hoshanho-16-piece-knife-block-set', affiliateSlug: 'hoshanho-16-piece-knife-block-set' },
  { id: 'ninja-af181', title: 'Ninja AF181 Air Fryer XL', description: '6.5-quart Grey model from our earlier air-fryer post. Different from the 6-quart COSORI.', category: 'Kitchen', postedAt: '2026-10-17', dealSlug: 'ninja-air-fryer-xl-af181', affiliateSlug: 'ninja-air-fryer-xl-af181' },
  { id: 'shark-ai-ultra', title: 'Shark AI Ultra Robot Vacuum', description: 'AV2511AE robot vacuum from our home-cleaning post. Match the model and base configuration.', category: 'Home', postedAt: '2026-10-17', dealSlug: 'shark-ai-ultra-robot-vacuum', affiliateSlug: 'shark-ai-ultra-vacuum' },
  { id: 'jiyu-toner-pads', title: 'JIYU Toner Pads', description: '100-count, single-pack version. Our earlier post’s sale price may no longer apply.', category: 'Beauty', postedAt: '2026-10-17', dealSlug: 'jiyu-toner-pads-korean-skincare-100-count', affiliateSlug: 'jiyu-toning-polish-pads' },
  { id: 'milkmaid-dress', title: 'SCARLET DARKNESS Milkmaid Dress', description: 'The dress from our three fall outfits. See the styling guide and check the retailer’s size and color options.', category: 'Fashion', guideSlug: 'milkmaid-dress-fall-styling', affiliateSlug: 'scarlet-darkness-milkmaid-dress' },
  { id: 'ototo-spoon-rest', title: 'OTOTO Avocado Spoon Rest', description: 'The avocado-shaped resting spot for a messy cooking spoon from our kitchen video.', category: 'Kitchen', guideSlug: 'ototo-avocado-spoon-rest', affiliateSlug: 'ototo-avocado-spoon-rest' },
  { id: 'dr-jart-mask', title: 'Dr.Jart+ Ceramidin Skin Barrier Mask', description: 'The single-pack moisturizing mask from our evening skincare guide.', category: 'Beauty', guideSlug: 'dr-jart-ceramidin-mask-20-minute-routine-guide', affiliateSlug: 'dr-jart-ceramidin-skin-barrier-mask' },
]

/** Only records read with the published Sanity perspective may be passed here. */
export function buildSocialProductCards(features: SocialProductFeature[], records: SocialProductRecord[], affiliateSlugs: string[], now = Date.now()): SocialProductCard[] {
  const links = new Set(affiliateSlugs)
  return [...features].sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || '')).flatMap(feature => {
    const kind = feature.dealSlug ? 'deal' : 'post'
    const slug = feature.dealSlug || feature.guideSlug
    const record = records.find(item => item._type === kind && item.slug === slug)
    if (!record || !slug) return []
    if (record.startDate && (!Number.isFinite(Date.parse(record.startDate)) || Date.parse(record.startDate) > now)) return []
    if (kind === 'post' && (!record.publishedAt || !Number.isFinite(Date.parse(record.publishedAt)) || Date.parse(record.publishedAt) > now)) return []
    const expiry = endTime(record.expiryDate)
    const offerEnded = kind === 'deal' && (record.active !== true || (Boolean(record.expiryDate) && (expiry === null || expiry <= now)))
    const cmsImage = record.imageWidth && record.imageWidth > 1 ? record.imageUrl : undefined
    const imageUrl = feature.fallbackImage || (cmsImage?.startsWith('https://cdn.sanity.io/') ? `${cmsImage}?w=640&fit=max&auto=format` : undefined)
    return [{
      id: feature.id, title: feature.title, description: feature.description,
      category: feature.category, postedAt: feature.postedAt,
      imageUrl, imageAlt: feature.title,
      detailHref: `/${kind === 'deal' ? 'deals' : 'blog'}/${slug}`,
      detailKind: kind === 'deal' ? 'deal' as const : 'guide' as const,
      affiliateHref: !offerEnded && links.has(feature.affiliateSlug) ? `/go/${feature.affiliateSlug}` : undefined,
      store: feature.store || record.store || 'Amazon', offerEnded,
      ...(feature.watchUrl ? { watchUrl: feature.watchUrl } : {}),
    }]
  })
}

const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function filterSocialProducts(products: SocialProductCard[], query: string, category = 'All'): SocialProductCard[] {
  const words = normalize(query).split(' ').filter(Boolean)
  return products.filter(product => {
    if (category !== 'All' && product.category !== category) return false
    const searchable = normalize(`${product.title} ${product.description} ${product.category}`)
    return words.every(word => searchable.includes(word))
  })
}
