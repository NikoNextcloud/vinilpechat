'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const seo=require('../lib/seo-pages.js');
const handler=require('../api/index.js');
const {modelPath}=require('../public/teniski/model-links.js');
const models=require('../data/stedman-catalog.json');

// No network or production credentials: resolvers are replaced with fixtures.
process.env.SUPABASE_URL='https://seo-test.supabase.co';
process.env.SUPABASE_ANON_KEY='seo-test-only';
delete process.env.SUPABASE_SERVICE_ROLE_KEY;
function request(method,route,slug=''){
 const req={method,headers:{},query:{route,slug},url:'/api/index'};
 const res={headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},
  status(code){this.statusCode=code;return this;},
  send(body){this.body=body;return this;},end(){this.ended=true;return this;},
  json(body){this.body=body;return this;}};
 return handler(req,res).then(()=>res);
}
test('SEO HEAD responses match GET status and metadata without sending a body',async t=>{
 t.mock.method(seo,'sitemapXml',async()=>'<urlset/>');
 t.mock.method(seo,'resolveProduct',async()=>({html:'<h1>Product</h1>'}));
 t.mock.method(seo,'resolveCategory',async()=>({html:'<h1>Category</h1>'}));
 const shirtSlug=modelPath(models[0]).slice('/teniski/'.length);
 for(const [route,slug] of [['seo/sitemap',''],['seo/product','13-name'],['seo/category','kristal-name'],['seo/shirt',shirtSlug]]){
  const get=await request('GET',route,slug),head=await request('HEAD',route,slug);
  assert.equal(get.statusCode,200,route);
  assert.equal(head.statusCode,get.statusCode,route);
  assert.deepEqual(head.headers,get.headers,route);
  assert.equal(head.body,undefined,route);
  assert.equal(head.ended,true,route);
 }
});
test('SEO GET and HEAD preserve real 404 and permanent redirect responses',async t=>{
 t.mock.method(seo,'resolveProduct',async(_,slug)=>slug==='missing'?null:{redirect:'/produkti/13-canonical'});
 t.mock.method(seo,'resolveCategory',async(_,slug)=>slug==='missing'?null:{redirect:'/kategorii/kristal-canonical'});
 for(const method of ['GET','HEAD']){
  for(const route of ['seo/product','seo/category','seo/shirt']){
   const missing=await request(method,route,'missing');
   assert.equal(missing.statusCode,404);
   assert.equal(missing.headers['x-robots-tag'],'noindex');
   if(method==='HEAD')assert.equal(missing.body,undefined);
   const old=await request(method,route,route==='seo/shirt'?'Old-name-model-ST2300':'old');
   assert.equal(old.statusCode,308);
   assert.ok(old.headers.location.startsWith(route==='seo/product'?'/produkti/':route==='seo/category'?'/kategorii/':'/teniski/'));
   assert.equal(old.body,undefined);
  }
 }
});
test('HEAD support does not enable writes or other API methods',async()=>{
 assert.equal((await request('HEAD','orders')).statusCode,405);
 assert.equal((await request('DELETE','seo/product','13-name')).statusCode,405);
});
