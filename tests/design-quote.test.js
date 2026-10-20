'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {designQuote}=require('../lib/design-pricing.js');
const handler=require('../api/index.js');

test('vinyl with design: 1x1 metre includes the design service',()=>{
 const q=designQuote({width_cm:100,height_cm:100,quantity:1});
 assert.equal(q.total_eur,23);
 assert.equal(q.area_m2,1);
 assert.equal(q.currency,'EUR');
 assert.equal(q.includes_design,true);
 assert.equal(q.indicative,true);
});
test('minimum design print order is EUR20',()=>{
 assert.equal(designQuote({width_cm:50,height_cm:50,quantity:1}).total_eur,20);
 assert.equal(designQuote({width_cm:10,height_cm:10,quantity:1}).total_eur,20);
});
test('quantity multiplies area but design fee is charged once',()=>{
 const q=designQuote({width_cm:200,height_cm:300,quantity:2});
 assert.equal(q.area_m2,6);
 assert.equal(q.total_eur,166);
});
test('invalid dimensions and quantities are rejected, never NaN',()=>{
 for(const input of [{width_cm:0,height_cm:100,quantity:1},{width_cm:-10,height_cm:100,quantity:1},{width_cm:10,height_cm:10,quantity:0},{width_cm:10,height_cm:10,quantity:1.5},{width_cm:'a',height_cm:10,quantity:1},{width_cm:6000,height_cm:10,quantity:1}]){
   assert.throws(()=>designQuote(input),{status:400});
 }
});
test('public-facing source does not disclose confidential area rate',()=>{
 const front=fs.readFileSync('public/site.js','utf8');
 const html=fs.readFileSync('public/index.html','utf8');
 assert.doesNotMatch(front,/INTERNAL_RATE_EUR_PER_M2|RATE_EUR_PER_M2|13\s*€\s*\/\s*(?:m²|кв)/);
 assert.doesNotMatch(html,/13\s*€\s*\/\s*(?:m²|кв)/);
 assert.match(front,/Нов винил с дизайн/);
 assert.match(front,/Винили за покриване и др\./);
 assert.match(front,/data-design-viber/);
 assert.match(front,/data-design-web/);
 assert.match(front,/data-go="catalog"/);
 assert.match(html,/href="#design"/);
 assert.match(html,/href="#catalog"/);
});
test('Vercel exposes its design quote route without requiring Supabase to be configured',async()=>{
 const route=fs.readFileSync('api/design/quote.js','utf8');
 assert.match(route,/require\('\.\.\/index\.js'\)/);
 const headers={};
 const req={method:'POST',headers:{origin:'https://vinilpechat.vercel.app',host:'vinilpechat.vercel.app'},
  query:{route:'design/quote'},url:'/api/design/quote',body:{width_cm:100,height_cm:100,quantity:1}};
 const res={setHeader(k,v){headers[k.toLowerCase()]=v},status(code){this.statusCode=code;return this},json(payload){this.data=payload;return this}};
 await handler(req,res);
 assert.equal(res.statusCode,200);
 assert.equal(res.data.total_eur,23);
 assert.equal(headers['cache-control'],'no-store');
});
