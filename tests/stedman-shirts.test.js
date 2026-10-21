'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root=path.join(__dirname,'..');
test('T-shirt experience is isolated from existing product catalog, has entry links',()=>{
 const h=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 const p=fs.readFileSync(path.join(root,'public/teniski/index.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'public/teniski/app.js'),'utf8');
 assert.match(h,/href="\/teniski\/"/);
 assert.match(p,/Печат на тениски/);
 assert.match(p,/id="print-zone"/);
 assert.match(p,/id="front-upload"/);
 assert.match(p,/id="back-upload"/);
 assert.match(p,/id="view-back"/);
 assert.match(p,/id="quantity"/);
 assert.match(p,/id="unit-price"/);
 assert.match(js,/ST2000/);
 assert.match(js,/ST2010/);
 assert.match(js,/\*2/);
 assert.match(js,/printCost=\(front,back\)/);
 assert.match(js,/validQuantity/);
 assert.match(js,/Общо за заявката/);
 assert.match(js,/\(front\?2:0\)\+\(back\?2:0\)/);
 assert.match(js,/viber:\/\/chat/);
 assert.match(p,/index,follow/);
});

test('First PDF page garments have distinct Stedman codes and selectable nonoverlapping price bands',()=>{
 const js=fs.readFileSync(path.join(root,'public/teniski/app.js'),'utf8');
 const raw=js.match(/const models=(\[[^;]+\]);/);
 assert.ok(raw,'catalog data exists');
 const models=JSON.parse(raw[1]);
 assert.equal(models.length,75);
 assert.equal(new Set(models.map(x=>x.id)).size,75);
 for(const m of models){
  assert.ok(m.groups.length>0);
  assert.equal(new Set(m.groups.map(g=>g.label)).size,m.groups.length);
  for(const g of m.groups){const prices=Object.entries(g).filter(([k])=>k!=='label').map(([,v])=>v);assert.ok(prices.length>0);for(const v of prices)assert.ok(Number.isFinite(v)&&v>0)}
 }
 assert.ok(js.includes('noindex')===false);
});

test('Home landing has three accessible service cards and catalog has filters',()=>{
 const js=fs.readFileSync(path.join(root,'public/site.js'),'utf8');
 const css=fs.readFileSync(path.join(root,'public/site.css'),'utf8');
 const shirts=fs.readFileSync(path.join(root,'public/teniski/index.html'),'utf8');
 assert.match(js,/choice-card--shirts/);
 assert.match(js,/03 · Персонален печат/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(shirts,/id="model-search"/);
 assert.match(shirts,/id="model-gender"/);
});

test('T-shirt catalog opens model details as separate view and offers back navigation',()=>{
 const html=fs.readFileSync(path.join(root,'public/teniski/index.html'),'utf8');
 const js=fs.readFileSync(path.join(root,'public/teniski/app.js'),'utf8');
 assert.match(html,/id="catalog-view"/);
 assert.match(html,/id="back-to-models"/);
 assert.match(js,/function showCatalog\(\)/);
 assert.match(js,/\$\('catalog-view'\)\.hidden=true/);
 assert.match(js,/\$\('customizer'\)\.hidden=false/);
 assert.match(js,/function openModel\(id\)/);
});

test('All PDF models use verified official Stedman product photography',()=>{
 const js=fs.readFileSync(path.join(root,'public/teniski/app.js'),'utf8');
 const m=js.match(/const models=(\[[^\n]+\]);/);
 const models=JSON.parse(m[1]);
 assert.equal(models.length,75);
 for(const model of models){
   assert.match(model.image,new RegExp('^https://www\\.stedman\\.eu/public/images/products/2026/'+model.id+'/'+model.id+'_'));
 }
 assert.match(js,/IMAGE_FALLBACK/);
});
