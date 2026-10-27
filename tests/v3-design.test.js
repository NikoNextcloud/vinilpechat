'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pub=path.join(__dirname,'..','public');
const read=name=>fs.readFileSync(path.join(pub,name),'utf8');

test('V3 theme is loaded on all storefront entry points and every crawlable landing page',()=>{
 const home=read('index.html');
 const shirts=read('teniski/index.html');
 const vinyl=read('nov-vinil/index.html');
 const covers=read('brezenti/index.html');
 const seo=fs.readFileSync(path.join(__dirname,'../lib/seo-pages.js'),'utf8');
 assert.match(home,/href="\/v3\.css"/);
 assert.match(home,/src="\/v3\.js" defer/);
 assert.match(shirts,/href="\/teniski\/v3\.css"/);
 for(const entry of [vinyl,covers,seo])assert.match(entry,/\/seo-v3\.css/);
 for(const entry of [home,shirts,vinyl,covers,seo])assert.match(entry,/vinilpechat-spectrum-logo\.svg/);
 assert.match(read('assets/vinilpechat-spectrum-logo.svg'),/linearGradient/);
});

test('V3 homepage contains exactly three services and social feeds without losing navigation',()=>{
 const js=read('site.js');
 const html=read('index.html');
 const css=read('v3.css');
 assert.match(js,/function renderChoiceLanding\(\)/);
 assert.equal((js.match(/v3-primary-card v3-primary-/g)||[]).length,3);
 for(const title of ['Печат на винил','Винили за покриване','Тениски за печат'])
  assert(js.includes(title),'Missing main category '+title);
 for(const old of ['v3-hero','v3-hero-studio','v3-category-strip','v3-featured-grid','v3-service-grid','v3-trust-strip'])
  assert(!js.includes(old),'Removed homepage block unexpectedly present: '+old);
 assert.match(html,/id="instagram-posts"/);
 assert.match(html,/instagram\.com\/vinilpechat/);
 assert.match(html,/facebook\.com\/profile/);
 for(const id of ['focusSearch','cartOpen','mobileMenu','mobile-nav'])
  assert(html.includes('id="'+id+'"'),'Missing persistent navigation control '+id);
 assert.match(css,/\.v3-primary-grid/);
 assert.match(css,/@media\(max-width:680px\)/);
 assert.match(css,/\.admin-nav/);
 assert.match(css,/\.drawer/);
 assert.match(css,/\.design-form-card/);
});

test('V3 keeps the 75-model Stedman designer and real supplier/retail pricing code unchanged',()=>{
 const v2=read('teniski/v2.js');
 const html=read('teniski/index.html');
 const source=require('../data/stedman-catalog.json');
 assert.equal(source.length,75);
 assert.match(v2,/UNIVERSAL_BACK_PHOTO/);
 assert.match(v2,/printMode='none'/);
 assert.match(v2,/setPointerCapture/);
 assert.match(v2,/v3-card-swatches/);
 assert.match(v2,/requestedCategory/);
 assert.match(html,/id="v2-print-choice"/);
 assert.match(html,/id="artwork"/);
 assert.doesNotMatch(html,/id="v2-resize-handle"/);
 assert.match(read('teniski/v3.css'),/\.v2-print-card\[aria-pressed=true\]/);
 assert.match(read('teniski/v3.css'),/\.v2-color-swatches button/);
});

test('V3 product price-verification label is never rendered',()=>{
 const js=read('site.js'),css=read('v3.css'),base=read('site.css');
 const start=js.indexOf('function productCard(p){');
 const end=js.indexOf('\nfunction catalog()',start);
 assert(start>=0&&end>start,'productCard template is found');
 const markup=js.slice(start,end);
 const photoEnd=markup.indexOf('</button><div class="product-content">');
 assert(photoEnd>0,'photo closes before metadata');
 assert(!markup.includes('Цена за потвърждение'),'verification badge text must be removed');
 assert(!markup.slice(0,photoEnd).includes('product-status'),'no badges appear on images');
 assert(markup.includes("p.price_verification_needed?'':'<span class=\"product-status is-listed\">В каталога</span>'"),'other catalog labels are preserved');
 assert(css.includes('.product-card .product-status.is-listed'));
 assert(!css.includes('.product-card .product-status.is-verification'));
 assert(!base.includes('.product-photo .photo-tag{'));
});
