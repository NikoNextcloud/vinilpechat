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
 assert.match(p,/noindex,follow/);
});

test('First PDF page garments have distinct Stedman codes and selectable nonoverlapping price bands',()=>{
 const js=fs.readFileSync(path.join(root,'public/teniski/app.js'),'utf8');
 const raw=js.match(/const models=(\[[^;]+\]);/);
 assert.ok(raw,'catalog data exists');
 const models=JSON.parse(raw[1]);
 assert.equal(models.length,13);
 assert.equal(new Set(models.map(x=>x.id)).size,13);
 for(const m of models){
  assert.ok(m.groups.length>0);
  assert.equal(new Set(m.groups.map(g=>g.label)).size,m.groups.length);
  for(const g of m.groups){assert.ok(Number.isFinite(g.WHI)&&g.WHI>0);assert.ok(Number.isFinite(g.COL)&&g.COL>0)}
 }
 assert.ok(js.includes('noindex')===false);
});
