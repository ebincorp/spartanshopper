import type { Metadata } from 'next'
import { generatePageJsonLd } from '@/lib/generateJsonLd'

type Props = {
  metadata: Metadata
  path: string
  name: string
  type?: 'WebPage' | 'AboutPage' | 'ContactPage'
}

export default function PageJsonLd({ metadata, path, name, type }: Props) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{
    __html: generatePageJsonLd(path, name, metadata.description, type),
  }} />
}
