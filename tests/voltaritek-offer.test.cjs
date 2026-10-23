const {test}=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react')
const {renderToStaticMarkup}=require('react-dom/server')
function load(file){
 const exports={}
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText
 vm.runInNewContext(code,{exports,require:name=>name==='../lib/voltaritek-offer'?config:require(name)})
 return exports
}
const config=load('lib/voltaritek-offer.ts')
const Offer=load('components/VoltariTekOffer.tsx').default
test('owner coupon is prominent, with code, disclosure and direct builder CTA',()=>{
 const html=renderToStaticMarkup(React.createElement(Offer))
 assert(html.includes('25% OFF'))
 assert(html.includes('VTEK25'))
 assert(html.includes('Build your labels &amp; save 25%'))
 assert(html.includes('href="/go/voltaritek-label-builder"'))
 assert(html.includes('rel="sponsored nofollow"'))
 assert(html.indexOf('Affiliate link:')<html.indexOf('href='))
 assert(!/expires|countdown|limited time/i.test(html))
})
test('one switch can withdraw all callouts and video does not duplicate the purchase button',()=>{
 assert(!renderToStaticMarkup(React.createElement(Offer,{showButton:false})).includes('<a '))
 config.voltaritekOffer.active=false
 assert.equal(renderToStaticMarkup(React.createElement(Offer)),'')
 config.voltaritekOffer.active=true
})
test('blog feature, all eight guide cards and confirmed video card use the shared offer',()=>{
 assert(fs.readFileSync('components/LabelGuideFeature.tsx','utf8').includes('<VoltariTekOffer />'))
 assert(fs.readFileSync('app/blog/page.tsx','utf8').includes('LABEL_GUIDE_SLUGS.includes(post.slug.current) && <VoltariTekOffer />'))
 const video=fs.readFileSync('components/SocialProductFinder.tsx','utf8')
 assert(video.includes("product.id === 'voltaritek-label-builder'"))
 assert(video.includes('<VoltariTekOffer showButton={false} />'))
 assert(video.includes('labelOffer ? voltaritekOffer.cta'))
})
