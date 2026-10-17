import assert from 'node:assert/strict'
import { endingSoonDeals } from '../lib/ending-soon-deals'
import type { Deal } from '../lib/types'
const now = Date.parse('2026-10-17T17:00:00Z')
const base: Deal = {_id:'base',title:'Verified deal',slug:{current:'verified'},store:'Retailer',salePrice:10,affiliateUrl:'https://example.com',active:true,hasCardImage:true,priceVerifiedAt:new Date(now).toISOString(),expiryDate:new Date(now+3600000).toISOString()}
const d=(id:string,patch:Partial<Deal>={}):Deal=>({...base,_id:id,...patch})
assert.deepEqual(endingSoonDeals([
  d('later',{expiryDate:new Date(now+7200000).toISOString()}),d('soon'),
  d('inactive',{active:false}),d('no-photo',{hasCardImage:false}),d('unknown',{expiryDate:undefined}),
  d('expired',{expiryDate:new Date(now).toISOString()}),d('invalid',{expiryDate:'invalid'}),
  d('stale',{priceVerifiedAt:new Date(now-26*3600000).toISOString()}),
  d('too-late',{expiryDate:new Date(now+49*3600000).toISOString()}),d('zero',{salePrice:0})
],now).map(x=>x._id),['soon','later'])
assert.equal(endingSoonDeals([d('boundary',{expiryDate:new Date(now+48*3600000).toISOString()})],now).length,1)
assert.equal(endingSoonDeals([d('one'),d('two')],now,1).length,1)
assert.equal(endingSoonDeals([d('date-only',{expiryDate:'2026-10-17'})],now).length,1)
assert.equal(endingSoonDeals([],now).length,0)
console.log('Ending-soon filters, deadline ordering, boundaries, date-only values and limits passed.')
