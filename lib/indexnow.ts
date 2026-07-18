/**
 * IndexNow — instant crawl notification for the Bing ecosystem
 * (Bing, Yahoo, DuckDuckGo, Yandex, Seznam, Naver). Google does NOT
 * participate in IndexNow — this is deliberately for the index that
 * actually ranks and sends traffic to SpartanShopper.
 *
 * The key is NOT secret: it is publicly hosted at
 * https://www.spartanshopper.com/<key>.txt so search engines can verify
 * ownership. Keep the constant below in sync with that public file.
 */
const INDEXNOW_KEY = '50869ceed0f9e89a14737f7e5f8503ff'
const HOST = 'www.spartanshopper.com'
const ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * Notify IndexNow of changed URLs. Accepts absolute URLs or site-relative
 * paths ("/blog/foo"). Best-effort: never throws — a failed ping must not
 * break revalidation.
 */
export async function pingIndexNow(pathsOrUrls: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY || INDEXNOW_KEY
  const urlList = [...new Set(pathsOrUrls)]
    .filter(Boolean)
    .map((p) => (p.startsWith('http') ? p : `https://${HOST}${p.startsWith('/') ? '' : '/'}${p}`))

  if (urlList.length === 0) return

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key,
        keyLocation: `https://${HOST}/${key}.txt`,
        urlList,
      }),
    })
    // IndexNow returns 200 (accepted) or 202 (accepted, pending). Log either way.
    console.log(`[indexnow] submitted ${urlList.length} URL(s) — HTTP ${res.status}`)
  } catch (err) {
    console.error('[indexnow] ping failed:', err instanceof Error ? err.message : err)
  }
}
