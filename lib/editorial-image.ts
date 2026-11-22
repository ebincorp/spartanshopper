export const EDITORIAL_PLACEHOLDER = '/og-default.png'

function sanityUrl(src: string): URL | undefined {
  if (!src.startsWith('https://cdn.sanity.io/images/')) return undefined
  return new URL(src)
}

/** Keep the existing Sanity crop while choosing a smaller CDN rendition. */
export function sanityImageVariant(src: string, width: number): string {
  const url = sanityUrl(src)
  if (!url) return src
  url.searchParams.set('w', String(width))
  url.searchParams.set('fm', 'webp')
  url.searchParams.set('q', '78')
  return url.toString()
}

export function sanityImageSrcSet(src: string, widths: number[]): string | undefined {
  const url = sanityUrl(src)
  if (!url || url.searchParams.has('h')) return undefined
  const assetWidth = Number(url.pathname.match(/-(\d+)x\d+\.[^.]+$/)?.[1])
  const cropWidth = Number(url.searchParams.get('rect')?.split(',')[2])
  const maxWidth = cropWidth || assetWidth
  if (!maxWidth) return undefined
  const sizes = [...new Set(widths.map(width => Math.min(width, maxWidth)))]
  return sizes.map(width => `${sanityImageVariant(src, width)} ${width}w`).join(', ')
}

/** Social platforms receive a JPEG while on-page versions use WebP. */
export function socialImageUrl(src: string): string {
  const url = sanityUrl(src)
  if (!url) return src
  url.searchParams.set('fm', 'jpg')
  url.searchParams.set('q', '78')
  url.searchParams.set('bg', 'fff')
  return url.toString()
}
