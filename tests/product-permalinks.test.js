'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const seo=require('../lib/seo-pages.js');
const publicUrls=require('../public/product-links.js');
const data=require('../data/seed.json');

test('Every product gets a unique readable latin SEO URL consistent with server routes',()=>{
 const products=data.products;
 assert(products.length>=40);
 for(const product of products){
  const actual=publicUrls.productUrl(product);
  assert.equal(actual,seo.productUrl(product),'Product: '+product.id);
  assert.match(actual,/^\/produkti\/\d+-[a-z0-9-]+$/);
  assert.doesNotMatch(actual,/item-/);
 }
 assert.equal(new Set(products.map(publicUrls.productUrl)).size,products.length);
});
test('Example product 13 has a real latin-language slug, not an item hash',()=>{
 const product=data.products.find(p=>p.id===13);
 assert(product);
 const url=publicUrls.productUrl(product);
 assert.equal(url,'/produkti/13-lenta-kristal-za-vrati-2000-mikrona');
 assert.equal(publicUrls.slugify(product.name),seo.slugify(product.name));
});
test('Main catalogue modal shows canonical product URL and keeps old hash deep links',()=>{
 const app=fs.readFileSync(path.join(__dirname,'../public/site.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../public/v3.css'),'utf8');
 assert.match(app,/history\.pushState\(\{vinilDetail:p\.id\},'',seoProductHref\(p\)\)/);
 assert.match(app,/route\.startsWith\('item-'\)/);
 assert.match(app,/if\(location\.pathname\.startsWith\('\/produkti\/'\)\&\&state\.detail!==null\)return/);
 assert.match(app,/a=t\.closest\('\[data-detail\]'\);if\(a\)\{e\.preventDefault\(\)/);
 assert.match(app,/history\.replaceState\(null,'',detailReturnUrl\)/);
 assert.match(app,/new URL\(seoProductHref\(p\),location\.origin\)/);
 assert.match(app,/data-detail=.*product-card|product-card.*data-detail/);
 assert.match(app,/class="seo-product-link" href="\$\{escaped\(seoProductHref\(p\)\)\}"/);
 assert.match(css,/\.product-photo/);
});
