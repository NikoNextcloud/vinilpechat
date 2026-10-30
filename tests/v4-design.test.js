'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const home=read('public/index.html');
const shop=read('public/site.js');
const shirt=read('public/teniski/index.html');
const cover=read('public/brezenti/index.html');
const vinyl=read('public/nov-vinil/index.html');
const seo=read('lib/seo-pages.js');
const skin=read('public/v4.css');
const studio=read('public/v4.js');
const design=shop.slice(shop.indexOf('function renderDesignPage(){'),shop.indexOf('function designDimensions(){'));
test('Home highlights four services and social channels',()=>{
 assert.equal((shop.match(/class="v3-primary-card v3-primary-/g)||[]).length,4);
 assert.equal((shop.match(/class="v4-card-visual"/g)||[]).length,4);
 for(const name of ['art-print.svg','art-cover.svg','art-shirt.svg']){
  assert(shop.includes(name));assert(fs.existsSync(path.join(root,'public/v4',name)));
 }
 assert.match(home,/id="instagram-posts"/);
 assert(shop.includes('/pechatni-produkti/photos/vp4-013.webp'));
 assert(fs.existsSync(path.join(root,'public/pechatni-produkti/photos/vp4-013.webp')));
 assert.match(home,/id="facebook-card-title"/);
 assert.match(home,/src="\/v4.js" defer/);
});
test('V4 design system appears across shop, apparel, cover catalog and SEO pages',()=>{
 for(const [name,source] of [['main',home],['shirts',shirt],['cover',cover],['vinyl',vinyl],['SEO',seo]]){
  assert(source.includes('/v4.css'),name+' missing V4');
 }
 assert.match(shirt,/Винили за покриване/);
 assert.match(cover,/Тениски за печат/);
 for(const selector of ['.design-layout{','.admin-nav{','.product-card,','.cover-product,','.v3-shirt-hero'])
  assert(skin.includes(selector),selector);
 assert.match(skin,/@media\(max-width:600px\)/);
 assert.match(skin,/prefers-reduced-motion:reduce/);
});
test('Vinyl studio preserves server quote and sends finishing choices with inquiry',()=>{
 for(const id of ['v4File','v4Guide','v4Share','v4FinishNote','v4PreviewBanner','v4ArtworkImage','v4FinishingPriceNote'])
  assert(design.includes('id="'+id+'"'),id);
 for(const option of ['none','eyelets','pockets'])
  assert(design.includes('name="v4Finishing" value="'+option+'"'));
 assert.match(shop,/window\.VinilV4\?\.mountDesign\(\)/);
 assert.match(shop,/window\.VinilV4\?\.inquiryLines/);
 assert.match(shop,/request\('\/api\/design\/quote'/);
 assert.match(studio,/finishingNeedsQuote:needFinishingQuote/);
 assert(!studio.includes('INTERNAL_RATE_EUR_PER_M2'));
});
test('Upload is local preview only and never falsely claims completed upload',()=>{
 assert.match(studio,/file\.size>15\*1024\*1024/);
 assert.match(studio,/application\/pdf/);
 assert.match(studio,/НЕ е изпратен/);
 assert.match(studio,/изпратя отделно през Viber/);
 assert.match(studio,/URL\.revokeObjectURL/);
 assert.doesNotMatch(studio,/supabase\.storage|\/api\/upload/);
});
test('Share URL avoids customer data, guide produces local PDF',()=>{
 for(const key of ['vp_width','vp_height','vp_qty','vp_finish','vp_design'])assert(studio.includes(key));
 assert.match(studio,/u\.hash='design'/);
 assert.match(studio,/%PDF-1\.4/);
 assert.match(studio,/\/MediaBox \[0 0 842 595\]/);
 assert.match(studio,/application\/pdf/);
 assert(!studio.includes('vp_phone'));
});
test('Existing cart, admin and shirt artwork controls are preserved',()=>{
 assert.match(shop,/function renderAdmin\(\)/);
 assert.match(shop,/function renderCart\(\)/);
 assert.match(shop,/function sendForm\(form,type\)/);
 assert.match(shirt,/id="v2-resize-handle"/);
 assert.match(shirt,/id="front-upload"/);
 assert.match(shirt,/id="back-upload"/);
});
