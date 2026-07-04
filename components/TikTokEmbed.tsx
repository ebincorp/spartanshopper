'use client'

import Script from 'next/script'

interface TikTokEmbedProps {
  videoUrl: string
  videoId: string
}

export default function TikTokEmbed({ videoUrl, videoId }: TikTokEmbedProps) {
  return (
    <div className="my-8 flex justify-center">
      <blockquote
        className="tiktok-embed"
        cite={videoUrl}
        data-video-id={videoId}
        style={{ maxWidth: 605, minWidth: 325 }}
      >
        <section></section>
      </blockquote>
      <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
    </div>
  )
}
