const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

function load(file, imports = {}, globals = {}) {
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: name => imports[name] ?? require(name), URL, process, console: { info() {}, log() {}, error() {} }, ...globals });
  return exports;
}
const policy = load('lib/affiliateRequest.ts');
const challenge = require('../lib/affiliateChallenge.ts');
const destination = 'https://retailer.example/dp/EXAMPLE?tag=demo&campaignId=campaign.example&linkId=campaign.example_123';
const site = 'https://www.spartanshopper.com';
const context = { params: Promise.resolve({ slug: 'test-deal' }) };
const browserUa = 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36';
const safariUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15';
const appUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 WhatsApp/25.1';
const user = { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-user': '?1' };
const req = (headers = {}, path = '/go/test-deal') => new NextRequest(site + path, { headers });

function routeWith(resolver, options = {}) {
  const events = [];
  const route = load('app/go/[slug]/route.ts', {
    '@/lib/affiliateRequest': policy,
    '@/lib/affiliateChallenge': {
      ...challenge,
      affiliateGuardSecret: () => options.noSigner ? undefined : 'local-fixture-secret',
    },
    '@/lib/redirects': { getRedirectBySlug: resolver },
    '@/lib/affiliateClickAnalytics': { recordAffiliateNavigation(_request, event) { events.push(['accepted', event]); } },
    '@/lib/affiliateGuardStore': {
      afterAffiliateResponse(task) { task({}); },
      exceedsAffiliateBurst: options.burst ?? (async () => false),
      incrementAffiliateOutcome(_db, outcome, reason) { events.push([outcome, reason]); },
      recordCheckState(_db, action, claims) { events.push([action, claims.reason]); },
    },
  });
  return { route, events };
}

test('HEAD, prefetch and explicit automation never resolve a retailer link', async () => {
  let lookups = 0;
  const { route, events } = routeWith(async () => { lookups++; return { url: destination }; });
  assert.equal(route.HEAD().status, 204);
  for (const [headers, status] of [
    [{ 'user-agent': 'Googlebot/2.1' }, 403],
    [{ 'user-agent': 'python-requests/2.0' }, 403],
    [{ 'user-agent': 'HeadlessChrome/130.0.0.0' }, 403],
    [{ 'user-agent': 'x' }, 403],
    [{}, 403],
    [{ 'user-agent': browserUa, 'sec-fetch-dest': 'image', referer: site + '/deals' }, 403],
    [{ 'user-agent': browserUa, 'sec-fetch-mode': 'cors' }, 403],
    [{ 'sec-purpose': 'prefetch;prerender' }, 204],
    [{ purpose: 'prefetch' }, 204],
    [{ 'next-router-prefetch': '1' }, 204],
  ]) {
    const response = await route.GET(req(headers), context);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('location'), null);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  assert.equal(lookups, 0);
  assert.equal(events.filter(([outcome]) => outcome === 'blocked').length, 7);
});

test('same-site Safari and a user-started browser navigation skip the check and preserve exact campaign URLs', async () => {
  const { route, events } = routeWith(async () => ({ url: destination }), { burst: () => { throw new Error('Credible clicks must skip the limiter'); } });
  for (const headers of [
    { 'user-agent': safariUa, referer: site + '/blog/ji-yu' },
    { 'user-agent': browserUa, ...user },
  ]) {
    const response = await route.GET(req(headers), context);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), destination);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  }
  assert.deepEqual(events.map(([,event]) => event.reason), ['same-site','user-navigation']);
});

test('old Safari, in-app, headless with a normal UA and plain HTTP spoof get the same browser check', async () => {
  let lookups = 0;
  const { route, events } = routeWith(async () => { lookups++; return { url: destination }; });
  for (const headers of [
    { 'user-agent': safariUa },
    { 'user-agent': appUa, referer: 'https://social.example/shared-post' },
    { 'user-agent': browserUa, 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document' },
    { 'user-agent': browserUa },
  ]) {
    const start = await route.GET(req(headers), context);
    assert.equal(start.status, 200);
    const html = await start.text();
    assert.ok(html.includes('Continue to the retailer'));
    assert.ok(html.includes('location.replace'));
    assert.ok(!html.includes('retailer.example') && !html.includes('campaignId'));
    assert.match(start.headers.get('content-security-policy'), /nonce-/);
    assert.equal(start.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(start.headers.get('referrer-policy'), 'no-referrer');
  }
  assert.equal(lookups, 0);
  assert.equal(events.length, 4);
  assert.ok(events.every(([outcome]) => outcome === 'issue'));
});

test('a signed continuation forwards and counts only then, preserving the original referrer class', async () => {
  const { route, events } = routeWith(async () => ({ url: destination }), {
    burst: (() => { let checked = false; return async () => { if (checked) throw new Error('valid continuation must skip limiter'); checked = true; return false; }; })(),
  });
  const page = await route.GET(req({ 'user-agent': appUa, referer: 'https://social.example/path?token=ignored' }), context);
  const continuation = (await page.text()).match(/href="([^"]+)">Continue/)[1];
  assert.deepEqual(events.map(([kind]) => kind), ['issue']);
  const response = await route.GET(req({ 'user-agent': appUa }, '/go/test-deal' + continuation), context);
  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), destination);
  assert.deepEqual(events.map(([kind]) => kind), ['issue','accepted']);
  assert.equal(events[1][1].check.page, '(external)');
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
});

test('a bad or expired continuation gets a fresh recovery check without resolving the merchant', async () => {
  const { route } = routeWith(async () => { assert.fail('Invalid proof must not resolve a destination'); });
  const expired = challenge.issueAffiliateCheck(req({ 'user-agent': browserUa }), 'test-deal', 'missing-navigation',
    'local-fixture-secret', Date.now() - 600_000).proof;
  for (const token of ['wrong', expired]) {
    const response = await route.GET(req({ 'user-agent': safariUa }, '/go/test-deal?continue=' + token), context);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Continue to the retailer/);
  }
});

test('an over-limit ambiguous visitor gets a burst block but a cross-site activated click still passes', async () => {
  let attempts = 0;
  const { route, events } = routeWith(async () => ({ url: destination }), { burst: async () => ++attempts > 30 });
  const initial = req({ 'user-agent': appUa });
  for (let i = 0; i < 30; i++) assert.equal((await route.GET(initial, context)).status, 200);
  const blocked = await route.GET(initial, context);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get('location'), null);
  assert.deepEqual(events.at(-1), ['blocked','burst']);
  assert.equal((await route.GET(req({ 'user-agent': appUa, ...user }), context)).status, 302);
  const html = await blocked.text();
  assert.doesNotMatch(html, /location.replace/);
  const recovery = html.match(/href="([^"]+)">Continue/)[1];
  assert.equal((await route.GET(req({ 'user-agent': appUa }, '/go/test-deal' + recovery), context)).status, 302);
  assert.equal(events.at(-1)[1].check.reason, 'burst-recovery');
  assert.equal(attempts, 31);
});

test('missing signer does not break ambiguous shoppers and failed lookups still resolve to home', async () => {
  const fallback = routeWith(async () => ({ url: destination }), { noSigner: true });
  const redirect = await fallback.route.GET(req({ 'user-agent': appUa }), context);
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), destination);
  assert.equal(fallback.events[0][1].reason, 'signer-unavailable');
  for (const resolve of [async () => null, async () => { throw new Error('Unavailable'); }]) {
    const { route, events } = routeWith(resolve);
    const response = await route.GET(req({ 'user-agent': browserUa, ...user }, '/go/missing'), context);
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get('location')).hostname, 'www.spartanshopper.com');
    assert.equal(events.length, 0);
  }
});

function browserFixture() {
  const listeners = new Map();
  const calls = [];
  class Element {
    constructor(href, download = false, savedFind = false) { this.href = href; this.download = download; this.savedFind = savedFind; }
    closest() { return this.href === null ? null : this; }
    hasAttribute(name) { return name === 'download' ? this.download : name === 'data-saved-find' ? this.savedFind : false; }
    getAttribute() { return this.href; }
  }
  const doc = { title: 'Example offer', addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) };
  const win = { location: new URL('https://www.spartanshopper.com/coupons/example'), gtag: (...args) => calls.push(args) };
  const { installAffiliateClickTracking } = load('lib/trackAffiliateClick.ts', {}, { Element });
  const cleanup = installAffiliateClickTracking(doc, win);
  const click = (href, options = {}) => {
    const event = { type: 'click', button: 0, isTrusted: true, target: new Element(href), preventDefault() { throw new Error('Must never delay navigation'); }, ...options };
    listeners.get(event.type)(event);
  };
  return { listeners, calls, win, click, cleanup, Element };
}

test('trusted normal, keyboard and middle clicks use gtag without synthetic IDs', () => {
  const f = browserFixture();
  f.click('/go/test-deal');
  f.click('/go/test-deal', { detail: 0 });
  f.click('/go/test-deal', { type: 'auxclick', button: 1 });
  assert.equal(f.calls.length, 3);
  for (const [command, event, params] of f.calls) {
    assert.equal(command, 'event');
    assert.equal(event, 'outbound_affiliate_click');
    assert.equal(params.affiliate_slug, 'test-deal');
    assert.equal(params.tracking_version, 'browser_v2');
    assert.equal(params.client_id, undefined);
    assert.equal(params.session_id, undefined);
    assert.equal(params.page_location, 'https://www.spartanshopper.com/coupons/example');
    assert.equal(params.page_title, 'Example offer');
  }
  f.cleanup();
  assert.equal(f.listeners.size, 0);
});

test('SPA navigation updates attribution without leaking URL tokens', () => {
  const f = browserFixture();
  f.win.location = new URL('https://www.spartanshopper.com/blog/owala-vs-stanley?token=private#email');
  f.click('/go/test-deal');
  assert.equal(f.calls[0][2].page_location, 'https://www.spartanshopper.com/blog/owala-vs-stanley');
});

test('shortlist affiliate clicks are identified without changing attribution or navigation', () => {
  const f = browserFixture();
  f.win.location = new URL('https://www.spartanshopper.com/my-finds');
  f.click('/go/saved-offer', { target: new f.Element('/go/saved-offer', false, true) });
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0][2].saved_find, true);
  assert.equal(f.calls[0][2].affiliate_slug, 'saved-offer');
  assert.equal(f.calls[0][2].source_page_path, '/my-finds');
  f.click('/go/other-offer');
  assert.equal(f.calls[1][2].saved_find, false);
});

test('synthetic clicks, right clicks, unrelated links and downloads do not count', () => {
  const f = browserFixture();
  f.click('/go/test-deal', { isTrusted: false });
  f.click('/go/test-deal', { type: 'auxclick', button: 2 });
  f.click('/coupons/test-deal');
  f.click('https://other.example/go/test-deal');
  f.click('/go/');
  f.click(null);
  f.click('/go/test-deal', { target: new f.Element('/go/test-deal', true) });
  assert.equal(f.calls.length, 0);
});

test('missing or failing Analytics never interrupts navigation', () => {
  const f = browserFixture();
  f.win.gtag = undefined;
  assert.doesNotThrow(() => f.click('/go/test-deal'));
  f.win.gtag = () => { throw new Error('blocked'); };
  assert.doesNotThrow(() => f.click('/go/test-deal'));
});
