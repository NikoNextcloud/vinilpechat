'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/brezenti/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'public/brezenti/catalog.js'),'utf8');
test('Cover page opens its product catalog directly without old hero actions',()=>{
 assert.match(html,/<h1 id="covers-title">Винили за покриване<\/h1>/);
 assert.match(html,/id="cover-grid"/);
 assert.match(html,/id="cover-search"/);
 assert.match(html,/id="cover-category"/);
 assert.match(html,/src="\/brezenti\/catalog.js" defer/);
 assert.doesNotMatch(html,/Разгледай каталога ↗|Свържи се с нас<\/a>|class="hero"/);
});
test('Cover catalog loads live products and never exposes supplier prices',()=>{
 assert.match(js,/fetch\('\/api\/catalog'/);
 assert.match(js,/p\.active!==false/);
 assert.match(js,/p\.variants/);
 assert.match(js,/sale_price/);
 assert.match(js,/cover-grid/);
 assert.match(js,/\/#item-/);
 assert.doesNotMatch(js,/supplier_price/);
 assert.doesNotMatch(js,/window\.SEED_DATA/);
});
