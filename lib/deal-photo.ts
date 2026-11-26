import { urlFor } from './sanity.client'
import type { Deal } from './types'

const illustrationAlt = /\b(?:stylized|illustration)\b/i
const illustrationFile = /(?:^|[-_.])(?:illustration|editorial)(?=[-_.]|$)/i

export function dealPhotoUrl(deal: Pick<Deal, 'image' | 'hasCardImage'>, width: number, height?: number) {
  const image = deal.image
  if (!image?.asset || deal.hasCardImage === false) return undefined
  if (!image.attribution && (illustrationAlt.test(image.alt ?? '') || illustrationFile.test(image.originalFilename ?? ''))) {
    return undefined
  }

  const photo = urlFor(image).width(width)
  return (height ? photo.height(height) : photo).url()
}
