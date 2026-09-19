/** Browser interactions only. Redirect requests must never create GA users. */
export function installAffiliateClickTracking(doc: Document, win: Window) {
  const onClick = (event: MouseEvent) => {
    if (!event.isTrusted || (event.type === 'click' ? event.button !== 0 : event.button !== 1)) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    const anchor = target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download')) return;
    let url: URL;
    try { url = new URL(anchor.getAttribute('href')!, win.location.href); } catch { return; }
    if (url.origin !== win.location.origin) return;
    const match = url.pathname.match(/^\/go\/([^/]+)\/?$/);
    if (!match) return;

    // gtag supplies the real client/session context and respects its consent settings.
    // Do not prevent navigation or invent IDs when Analytics is unavailable.
    const gtag = (win as Window & { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag !== 'function') return;
    try {
      gtag('event', 'outbound_affiliate_click', {
        affiliate_slug: decodeURIComponent(match[1]),
        link_url: url.href,
        outbound: true,
        // Attribute client-side navigation clicks to the page being viewed.
        // Omit query strings and fragments, which can contain private tokens.
        page_location: `${win.location.origin}${win.location.pathname}`,
        page_title: doc.title,
        transport_type: 'beacon',
        tracking_version: 'browser_v2',
      });
    } catch {
      // Analytics must never interfere with following a deal link.
    }
  };

  doc.addEventListener('click', onClick, true);
  doc.addEventListener('auxclick', onClick, true);
  return () => {
    doc.removeEventListener('click', onClick, true);
    doc.removeEventListener('auxclick', onClick, true);
  };
}
