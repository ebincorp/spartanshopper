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
const destination = 'https://www.amazon.com/dp/EXAMPLE?tag=spartan03-20&campaignId=amzn1.campaign.example&linkId=amzn1.campaign.example_123';
const context = { params: Promise.resolve({ slug: 'test-deal' }) };
function routeWith(resolver) {
  return load('app/go/[slug]/route.ts', { '@/lib/affiliateRequest': policy, '@/lib/redirects': { getRedirectBySlug: resolver } });
}

test('HEAD, prefetch and known bots never resolve a retailer link', async () => {
  let lookups = 0;
  const route = routeWith(async () => { lookups++; return { url: destination }; });
  assert.equal(route.HEAD().status, 204);
  for (const [headers, status] of [
    [{ 'user-agent': 'Googlebot/2.1' }, 403],
    [{ 'user-agent': 'python-requests/2.0' }, 403],
    [{ 'sec-purpose': 'prefetch;prerender' }, 204],
    [{ purpose: 'prefetch' }, 204],
    [{ 'next-router-prefetch': '1' }, 204],
  ]) {
    const response = await route.GET(new NextRequest('https://www.spartanshopper.com/go/test-deal', { headers }), context);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('location'), null);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  assert.equal(lookups, 0);
});

test('normal and privacy-restricted visitors retain exact campaign URLs without permanent caching', async () => {
  const route = routeWith(async () => ({ url: destination }));
  for (const headers of [{}, { 'user-agent': 'Mozilla/5.0 Chrome/130.0 Safari/537.36' }]) {
    const response = await route.GET(new NextRequest('https://www.spartanshopper.com/go/test-deal', { headers }), context);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get('location'), destination);
    assert.match(response.headers.get('cache-control'), /no-store/);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
  }
});

test('missing links and lookup failures still fall back safely', async () => {
  for (const resolve of [async () => null, async () => { throw new Error('Unavailable'); }]) {
    const response = await routeWith(resolve).GET(new NextRequest('https://www.spartanshopper.com/go/missing'), context);
    assert.equal(response.status, 302);
    assert.equal(new URL(response.headers.get('location')).hostname, 'www.spartanshopper.com');
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
});

function browserFixture() {
  const listeners = new Map();
  const calls = [];
  class Element {
    constructor(href, download = false) { this.href = href; this.download = download; }
    closest() { return this.href === null ? null : this; }
    hasAttribute() { return this.download; }
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
