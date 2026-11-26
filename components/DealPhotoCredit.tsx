import type { DealPhotoAttribution } from '@/lib/types'

export default function DealPhotoCredit({ attribution }: { attribution?: DealPhotoAttribution }) {
  if (!attribution) return null

  return (
    <p className="px-4 py-1.5 text-xs leading-relaxed text-slate-600">
      Photo by <a href={attribution.sourceUrl} className="underline underline-offset-2">{attribution.author}</a>
      {' · '}
      <a href={attribution.licenseUrl} rel="license" className="underline underline-offset-2">{attribution.licenseName}</a>
      {attribution.changes && ` · ${attribution.changes}`}
    </p>
  )
}
