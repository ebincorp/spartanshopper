import type { ComponentProps } from 'react'
import { sanityImageSrcSet } from '@/lib/editorial-image'

type Props = ComponentProps<'img'> & {
  src: string
  widths?: number[]
}

export default function EditorialImage({ src, widths, sizes, loading = 'lazy', ...props }: Props) {
  const srcSet = widths && sanityImageSrcSet(src, widths)
  // Sanity generates the variants, so the image can go straight to its CDN.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} srcSet={srcSet || undefined} sizes={srcSet ? sizes : undefined} loading={loading} decoding="async" {...props} />
}
