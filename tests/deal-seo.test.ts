import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dealSearchCopy, dealProductJsonLd, serializeDealJsonLd } from '../lib/deal-seo'
const deal = { title:'PartySticks 100 Glow Sticks: Cost per Halloween Handout', store:'Amazon', salePrice:8.99, affiliateUrl:'https://www.amazon.com/dp/B00N1QPNMA?tag=sku18798384-20' }
test('snippets are neutral, compact and price-free',()=>{
 const copy=dealSearchCopy({...deal,title:'Amazon Basics Black Large Costume for Halloween and More'},false)
 assert(!/Amazon|8.99/.test(copy.title+copy.description))
 assert(copy.title.length+16<=60);assert(copy.description.length<=160);assert(copy.description.length>=70)
 assert(copy.description.includes('pack count'))
})
test('fashion copy addresses fit without inventing a deal claim',()=>{
 assert.match(dealSearchCopy({...deal,category:'fashion'},false).description,/sizing/)
})
test('ended snippets say ended, retain compact title and omit current price',()=>{
 const copy=dealSearchCopy(deal,true);assert.match(copy.title,/Deal Ended/);assert.match(copy.description,/has ended/);assert(copy.title.length+16<=60);assert(!/8.99/.test(copy.description))
})
test('unknown or retailer-equal brand is omitted, not guessed from title',()=>{
 const ld=dealProductJsonLd(deal,'https://cdn.example.com/p.jpg',true)!
 assert(!('brand' in ld));assert(!('seller' in ld.offers));assert(!('availability' in ld.offers))
 assert(!('brand' in dealProductJsonLd({...deal,brand:'Amazon'},'image',true)!))
})
test('explicit separate manufacturer brand is retained',()=>{
 assert.equal(dealProductJsonLd({...deal,brand:'PartySticks'},'image',true)!.brand?.name,'PartySticks')
})
test('no commerce markup for ended, stale, missing image or invalid prices',()=>{
 for(const input of [{current:false,image:'image',price:8.99},{current:true,image:null,price:8.99},{current:true,image:'image',price:NaN},{current:true,image:'image',price:0}]){
 assert.equal(dealProductJsonLd({...deal,salePrice:input.price},input.image,input.current),null)
 }
})
test('only a known date, not fabricated expiry or timestamp, is emitted',()=>{
 assert(!('priceValidUntil' in dealProductJsonLd(deal,'image',true)!.offers))
 assert(!('priceValidUntil' in dealProductJsonLd({...deal,expiryDate:'2026-10-28T06:59:59Z'},'image',true)!.offers))
 assert.equal(dealProductJsonLd({...deal,expiryDate:'2026-10-28'},'image',true)!.offers.priceValidUntil,'2026-10-28')
})
test('JSON-LD escapes script-breaking markup and remains parseable',()=>{
 const s=serializeDealJsonLd({name:'</script><script>alert(1)</script>'});assert(!s.includes('<'));assert.equal(JSON.parse(s).name,'</script><script>alert(1)</script>')
})
