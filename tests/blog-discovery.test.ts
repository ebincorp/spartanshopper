import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findBlogPosts, LABEL_GUIDE_SLUGS } from '../lib/blog-discovery'
import { buildSocialProductCards, socialProductFeatures } from '../lib/social-products'
const posts = LABEL_GUIDE_SLUGS.map((slug, i) => ({ id: String(i), slug, title: slug.replaceAll('-', ' '), category: 'Reviews', publishedAt: '2026-05-01', updatedAt: '2026-10-23' }))
const other = { id: 'other', slug: 'coffee', title: 'Café coffee guide', category: 'Kitchen', publishedAt: '2026-10-22', updatedAt: '2026-10-22' }
test('VoltariTek and magnetic label searches find all eight established guides', () => {
  for (const query of ['VoltariTek', 'magnetic labels', 'custom builder', ' LABELS magnetic ']) assert.equal(findBlogPosts([...posts, other], query).length, 8)
  assert.equal(findBlogPosts([...posts, other], 'coffee', 'Reviews').length, 0)
  assert.equal(findBlogPosts([...posts, other], 'cafe', 'Kitchen')[0].id, 'other')
  assert.equal(findBlogPosts(posts, 'unmatched').length, 0)
})
test('recent update sort does not alter original publication dates', () => {
  assert.equal(findBlogPosts([...posts, other], '')[0].id, 'other')
  assert.equal(findBlogPosts([...posts, other], '', 'All', 'updated')[0].id, '0')
  assert(posts.every(p => p.publishedAt === '2026-05-01'))
})
test('builder video card uses its real retailer, guide and watch URL', () => {
  const feature = socialProductFeatures.find(f => f.id === 'voltaritek-label-builder')!
  const records = [{ _type: 'post' as const, slug: 'magnetic-toolbox-labels', publishedAt: '2026-05-01' }]
  const card = buildSocialProductCards([feature], records, ['voltaritek-label-builder'], Date.parse('2026-10-23'))[0]
  assert.equal(card.store, 'VoltariTek')
  assert.equal(card.affiliateHref, '/go/voltaritek-label-builder')
  assert.equal(card.detailHref, '/blog/magnetic-toolbox-labels')
  assert.equal(card.watchUrl, 'https://www.tiktok.com/@spartanshopper/video/7699663141633903885')
  assert.equal(buildSocialProductCards([feature], [], [], Date.parse('2026-10-23')).length, 0)
  assert.equal(buildSocialProductCards([feature], records, [], Date.parse('2026-10-23'))[0].affiliateHref, undefined)
})
