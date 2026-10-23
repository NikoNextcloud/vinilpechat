'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public/brezenti/index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'public/brezenti/catalog.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/brezenti/catalog.css'),'utf8');
test('Vinyl covers open the original storefront-style catalog, not promotional blocks',()=>{
 assert.match(html,/<h1 id="covers-title">Открий подходящия материал<\/h1>/);
 for(const id of ['cover-grid','cover-search','cover-sort','cover-categories','cover-count','cover-total'])
  assert(html.includes('id="'+id+'"'),'Missing '+id);
 assert.match(html,/src="\/product-links\.js" defer/);
 assert.match(html,/src="\/brezenti\/catalog\.js" defer/);
 assert.doesNotMatch(html,/Разгледай каталога ↗|Свържи се с нас<\/a>|class="hero"/);
});
test('Responsive cards have photos separated from product descriptions',()=>{
 assert.match(css,/\.cover-layout\{display:grid;grid-template-columns:245px minmax\(0,1fr\)/);
 assert.match(css,/\.cover-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/\.cover-photo\{[^}]*overflow:hidden/);
 assert.match(css,/\.cover-content\{[^}]*flex-direction:column/);
 assert.match(css,/@media\(max-width:750px\)/);
 assert.match(css,/@media\(max-width:490px\)/);
});
test('Products, prices, categories and existing cart use live public catalog',()=>{
 assert.match(js,/fetch\('\/api\/catalog'/);
 assert.match(js,/products=data\.products\.filter\(p=>p&&p\.active!==false\)/);
 assert.match(js,/categories=data\.categories/);
 assert.match(js,/window\.VinilProductLinks/);
 assert.match(js,/productUrl\(p\)/);
 assert.match(js,/vinyl-cart/);
 assert.match(js,/variant_key/);
 assert.match(js,/sale_price/);
 assert.match(js,/cover-product-title/);
 assert.match(js,/cover-product-desc/);
 assert.doesNotMatch(js,/supplier_price/);
 assert.doesNotMatch(js,/window\.SEED_DATA/);
});
