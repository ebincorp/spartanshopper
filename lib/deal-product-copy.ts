const sentenceSegments = new Intl.Segmenter('en-US', { granularity: 'sentence' })
const volatileOffer = /\p{Sc}|\[retailer amount omitted\]|\b\d+(?:\.\d+)?\s*(?:USD|dollars?)\b|\b\d+(?:\.\d+)?%\s*(?:off|below|savings|reduction)\b|\b(?:price|pricing|lowest|discounts?|coupons?|checkout|ratings?|stars?|purchased in|bought in|prime day|black friday|deal ends?|sale end|in stock|out of stock|ships? from|sold (?:and shipped )?by|delivery (?:showed|was|estimate|estimated)|ZIP)\b/iu
const deadEnd = /^(?:confirm|check|compare|verify|see)\s+(?:with the retailer|the (?:exact |selected )?(?:listing|seller|variant|retailer)\b)|\b(?:delivery (?:date|window)|check your address|before paying|one-time purchase|non-returnable)\b/i
const datedFragment = /^(?:on |checked |as of )?(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s*(?:\d|$)/i
const genericCopy = /^(?:scent preference is subjective|the checked offer is shade-specific)[.!]?$/i
const shortVariant = /\b(?:in (?:black|white|brown|grey|gray|red|blue|green)|size \w{1,5})[.!]?$/i
const shortTitleOffer = /(?:\s*[:—–-]\s*|\s+|\()(?:save\s+)?(?:\d+(?:\.\d+)?%|\$\s*\d[\d,.]*)\s*(?:off|discount|savings)?(?:\s+with\s+coupon)?\)?\s*$/i
const fitCue = /\b(?:check|match|measure|allow|suits?|choose|required?|requires|separately|only|compatible|clearance|instead|fits?|before installing)\b/i
const ignoredWords = new Set(['this', 'that', 'with', 'from', 'includes', 'listed', 'listing', 'exact', 'selected', 'model', 'check', 'product', 'before', 'ordering', 'buying', 'retailer'])

function words(value: string) {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? []
}

export function dealDisplayTitle(title: string) {
  return title.replace(shortTitleOffer, '').trim()
}

export function dealProductDescription(description?: string | null): string[] {
  if (!description) return []
  return Array.from(sentenceSegments.segment(description), item => item.segment.trim())
    .flatMap(sentence => (volatileOffer.test(sentence) || deadEnd.test(sentence)) && sentence.includes(';')
      ? sentence.split(';').map(clause => {
          const trimmed = clause.trim()
          return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).replace(/[.!?]?$/, '.') : ''
        })
      : [sentence])
    .filter(sentence => sentence.length >= 12 && /^[\p{L}\d]/u.test(sentence) &&
      !datedFragment.test(sentence) && !volatileOffer.test(sentence) && !deadEnd.test(sentence) && !genericCopy.test(sentence))
}

/** Exact excerpts of the stored description. Sparse listings get less copy. */
export function dealCardFacts(title: string, description?: string | null) {
  const titleWords = new Set(words(title))
  const facts = dealProductDescription(description).filter(sentence => {
    const newWords = new Set(words(sentence).filter(word => !titleWords.has(word) && !ignoredWords.has(word)))
    return sentence.length <= 198 && (newWords.size >= 4 || (newWords.size >= 2 && shortVariant.test(sentence)))
  })
  const first = facts[0]
  if (!first) return []
  const second = facts.slice(1).find(sentence => fitCue.test(sentence)) || facts[1]
  return second ? [first, second] : [first]
}
