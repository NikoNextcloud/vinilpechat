import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

mkdirSync('test-output',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1480,height:940},deviceScaleFactor:1});
page.setDefaultTimeout(16000);
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:3000';
const goto=async path=>{await page.goto(base+path,{waitUntil:'domcontentloaded'});};
try{
 await goto('/');
 await page.locator('.v3-primary-card').first().waitFor();
 assert.equal(await page.locator('.v3-primary-card').count(),3,'homepage has exactly three main categories');
 assert.equal(await page.locator('#main section').count(),1,'homepage contains no other content sections');
 assert.equal(await page.locator('.v3-hero,.v3-category-block,.v3-featured,.v3-trust-strip,.v3-services').count(),0,'other homepage sections removed');
 assert.equal(await page.locator('.v3-primary-print strong').innerText(),'Печат на винил');
 assert.equal(await page.locator('.v3-primary-cover strong').innerText(),'Винили за покриване');
 assert.equal(await page.locator('.v3-primary-shirts strong').innerText(),'Тениски за печат');
 assert.equal(await page.locator('.v3-primary-print').getAttribute('href'),'#design');
 assert.equal(await page.locator('.v3-primary-cover').getAttribute('href'),'/brezenti/');
 assert.equal(await page.locator('.v3-primary-shirts').getAttribute('href'),'/teniski/');
 assert.equal(await page.locator('#instagram-posts .social-card').count(),2,'Instagram and Facebook cards remain');
 assert(await page.locator('#instagram-posts').isVisible(),'social media visible on homepage');
 assert.equal(await page.locator('#cartOpen').count(),1,'original cart available');
 assert.equal(await page.locator('#focusSearch').count(),1,'catalog search available');
 assert.equal(await page.locator('.brand-logo').getAttribute('src'),'/assets/vinilpechat-spectrum-logo.svg');
 await page.screenshot({path:'test-output/v3-home-desktop.png',fullPage:true});
 await page.locator('.v3-primary-print').click();
 await page.locator('#designCalculator').waitFor({state:'visible'});

 await goto('/#catalog');
 await page.locator('#catalogSearch').waitFor();
 assert(await page.locator('#productGrid').isVisible(),'existing materials catalog still works');
 const productCards=page.locator('#productGrid .product-card');
 await productCards.first().waitFor({state:'visible'});
 assert.equal(await page.locator('#productGrid .product-photo .photo-tag').count(),0,'product labels not on top of photos');
 const checkProductStatusLayout=async()=>{
  const points=await productCards.evaluateAll(cards=>cards.slice(0,20).map(card=>{
   const photo=card.querySelector('.product-photo')?.getBoundingClientRect();
   const label=card.querySelector('.product-status')?.getBoundingClientRect();
   return {found:!!label,bottom:photo?.bottom,top:label?.top};
  }));
  assert(points.length>0&&points.every(p=>p.found&&p.top>=p.bottom-1),'product label should sit below image: '+JSON.stringify(points));
 };
 await checkProductStatusLayout();
 await page.screenshot({path:'test-output/v3-catalog-labels-desktop.png',fullPage:false});
 await goto('/#design');
 await page.locator('#designCalculator').waitFor();
 assert(await page.locator('#designWidth').isVisible(),'vinyl pricing calculator retained');
 await goto('/#contact');
 await page.locator('#contactForm').waitFor();
 assert(await page.locator('#contactForm').isVisible());
 await goto('/#admin');
 await page.locator('#loginForm').waitFor();
 assert(await page.locator('#loginForm').isVisible(),'admin login retained');
 await page.screenshot({path:'test-output/v3-admin-login.png',fullPage:true});

 await goto('/teniski/?category='+encodeURIComponent('Поло'));
 await page.locator('#models [data-model]:visible').first().waitFor();
 assert.equal(await page.locator('.v2-categories [data-shirt-cat="Поло"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('#models [data-model]:visible').count(),10,'polo query filters models');
 assert.equal(await page.locator('#models [data-model="ST2000"]').isVisible(),false,'t-shirt hidden under polo filter');
 await page.screenshot({path:'test-output/v3-clothing-polo.png',fullPage:true});
 await goto('/teniski/#model-ST2000');
 await page.locator('#model-heading').waitFor({state:'visible'});
 assert.equal(await page.locator('#detail-code').innerText(),'ST2000');
 assert.equal(await page.locator('[data-print-mode="front"]').getAttribute('aria-pressed'),'false');
 assert.equal(await page.locator('#front-upload').isVisible(),false);
 assert.equal(await page.locator('#v2-resize-handle').count(),1);
 await page.screenshot({path:'test-output/v3-clothing-designer.png',fullPage:true});
 await page.locator('[data-print-mode="front"]').click();
 assert(await page.locator('#front-upload').isVisible());
 await page.locator('#view-back').click().catch(()=>{});
 await goto('/nov-vinil/');
 assert(await page.locator('link[href="/seo-v3.css"]').count()===1,'vinyl SEO page new theme');
 assert(await page.locator('.seo-brand').isVisible());
 await goto('/brezenti/');
 assert(await page.locator('link[href="/seo-v3.css"]').count()===1,'tarps SEO page new theme');

 await page.setViewportSize({width:390,height:844});
 await goto('/');
 await page.locator('.v3-primary-card').first().waitFor();
 assert.equal(await page.locator('.v3-primary-card').count(),3,'mobile has exactly the three top-level categories');
 assert(await page.locator('#instagram-posts').isVisible(),'mobile social section visible');
 const dimensions=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:window.innerWidth}));
 assert(dimensions.width<=dimensions.view+5,'mobile home has no horizontal page overflow: '+JSON.stringify(dimensions));
 await page.screenshot({path:'test-output/v3-home-mobile.png',fullPage:true});
 await page.locator('#mobileMenu').click();
 assert(await page.locator('#mobile-nav').isVisible(),'mobile navigation opens');
 await goto('/#catalog');
 await productCards.first().waitFor({state:'visible'});
 await checkProductStatusLayout();
 await page.screenshot({path:'test-output/v3-catalog-labels-mobile.png',fullPage:false});
 await goto('/teniski/?category='+encodeURIComponent('Суитшърти'));
 await page.locator('#models [data-model]:visible').first().waitFor();
 assert((await page.locator('#models [data-model]:visible').count())>0,'mobile category filter works');
 const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:window.innerWidth}));
 assert(mobile.width<=mobile.view+5,'mobile clothing has no horizontal page overflow: '+JSON.stringify(mobile));
 await page.screenshot({path:'test-output/v3-clothing-mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'browser JavaScript error list');
 console.log('VINILPECHAT_V3_BROWSER_PASS',JSON.stringify({
  homepage:true,primaryCategories:3,socialCards:2,vinyl:true,tarps:true,admin:true,
  modelFilter:true,editor:true,mobile:true,errors:errors.length
 }));
}finally{await browser.close()}
