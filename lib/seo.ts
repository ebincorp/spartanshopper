/**
 * Central page-metadata builder.
 *
 * Exists because metadata was being assembled ad-hoc per route, which produced
 * three classes of bug (all confirmed live 2026-07-25):
 *
 *  1. Doubled brand in <title>. `app/layout.tsx` sets
 *     `title.template = '%s — SpartanShopper'`, so any route exporting a plain
 *     string title that already ended in the brand rendered
 *     "Sweepstakes — SpartanShopper — SpartanShopper". Fixed here by always
 *     emitting `title.absolute`, which bypasses the template entirely — the
 *     brand is appended exactly once, by this function.
 *
 *  2. Wrong canonical on `/`. The root layout's inherited relative
 *     `alternates.canonical: './'` resolved to `/index` on the home route.
 *     Every route now sets an explicit absolute self-referencing canonical, and
 *     the inherited relative default has been removed from the root layout — a
 *     route that forgets one gets no canonical (safe: Google self-canonicalises)
 *     rather than a wrong one.
 *
 *  3. Generic OG/Twitter. Index routes set neither, so they inherited the root
 *     layout's homepage OG block — including `og:url` pointing at the site root
 *     regardless of which page was being shared.
 */
import type { Metadata } from 'next'

export const SITE_URL = 'https://www.spartanshopper.com'
export const SITE_NAME = 'SpartanShopper'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

export interface PageMetaInput {
  /** Page title WITHOUT the brand suffix — this function appends it exactly once. */
  title: string
  description: string
  /** Root-relative path, e.g. '/' or '/coupons/foo'. Becomes the canonical + og:url. */
  path: string
  /** Absolute image URL. Falls back to the site default OG image. */
  image?: string
  type?: 'website' | 'article'
  /** Set for search//filtered views that must not be indexed. */
  noIndex?: boolean
  /**
   * Use the given string verbatim as the whole title, skipping brand appending.
   * Only for pages that lead with the brand (the homepage).
   */
  absoluteTitle?: string
  /**
   * Point the canonical somewhere other than `path` — e.g. a filtered listing
   * canonicalising to its unfiltered parent, or a CMS-supplied canonical.
   */
  canonicalPath?: string
}

/** Absolute URL for a root-relative path, collapsing any duplicate slashes. */
function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`.replace(/([^:]\/)\/+/g, '$1')
}

export function pageMetadata(input: PageMetaInput): Metadata {
  const {
    title,
    description,
    path,
    image,
    type = 'website',
    noIndex = false,
    absoluteTitle,
    canonicalPath,
  } = input

  const fullTitle = absoluteTitle ?? `${title} — ${SITE_NAME}`
  const url = absoluteUrl(path)
  const canonical = absoluteUrl(canonicalPath ?? path)
  const ogImage = image ?? DEFAULT_OG_IMAGE

  return {
    // `absolute` bypasses the root layout's title template — without it the
    // brand would be appended a second time.
    title: { absolute: fullTitle },
    description,
    alternates: { canonical },
    ...(noIndex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage],
    },
  }
}
