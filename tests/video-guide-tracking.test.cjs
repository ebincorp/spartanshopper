const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const vm=require('node:vm');
test('video-guide click records only trusted internal navigation without query strings',()=>{
 const calls=[],listeners={};
 class Element { closest(){return this} hasAttribute(){return false} getAttribute(n){return n==='href'?'/blog/ototo-avocado-spoon-rest?token=private':n==='data-video-guide'?'ototo-avocado-spoon-rest':null} }
 const exports={}; vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/trackAffiliateClick.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Element,URL});
 const doc={title:'Videos',addEventListener:(k,v)=>listeners[k]=v,removeEventListener:()=>{}};
 const win={location:new URL('https://www.spartanshopper.com/videos?token=secret'),gtag:(...x)=>calls.push(x)};
 exports.installAffiliateClickTracking(doc,win);
 listeners.click({isTrusted:false,button:0,type:'click',target:new Element()}); assert.equal(calls.length,0);
 listeners.click({isTrusted:true,button:0,type:'click',target:new Element()}); assert.equal(calls[0][1],'video_guide_click'); assert(!JSON.stringify(calls).includes('token'));
 win.gtag=undefined; assert.doesNotThrow(()=>listeners.click({isTrusted:true,button:0,type:'click',target:new Element()}));
});
