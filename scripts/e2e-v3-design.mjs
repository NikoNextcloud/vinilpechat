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
 await page.locator('.v3-hero h1').waitFor();
 assert.equal(await page.locator('.v3-category-tile').count(),7,'seven garment categories');
 assert.equal(await page.locator('.v3-featured-card').count(),4,'four featured real models');
 assert.equal(await page.locator('.v3-service-tile').count(),3,'three other services');
 assert.equal(await page.locator('#cartOpen').count(),1,'original functional cart exists');
 assert.equal(await page.locator('#focusSearch').count(),1);
 assert.equal(await page.locator('.brand-logo').getAttribute('src'),'/assets/vinilpechat-spectrum-logo.svg');
 assert(await page.locator('.v3-hero').isVisible());
 const heroImg=page.locator('.v3-hero-photography img');
 assert(heroImg&&await heroImg.getAttribute('src'));
 await page.screenshot({path:'test-output/v3-home-desktop.png',fullPage:true});
 await page.locator('[data-v3-side="back"]').click();
 assert.equal(await page.locator('.v3-studio-shirt').getAttribute('src'),'/teniski/assets/universal-back-white.webp');
 assert.equal(await page.locator('.v3-studio-mark').isVisible(),false);
 await page.locator('[data-v3-side="front"]').click();
 assert(await page.locator('.v3-studio-mark').isVisible());

 await goto('/#catalog');
 await page.locator('#catalogSearch').waitFor();
 assert(await page.locator('#productGrid').isVisible(),'existing materials catalog still works');
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
 await page.locator('[data-model]').first().waitFor();
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
 await page.locator('.v3-hero').waitFor();
 const dimensions=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:window.innerWidth}));
 assert(dimensions.width<=dimensions.view+5,'mobile home has no horizontal page overflow: '+JSON.stringify(dimensions));
 await page.screenshot({path:'test-output/v3-home-mobile.png',fullPage:true});
 await page.locator('#mobileMenu').click();
 assert(await page.locator('#mobile-nav').isVisible(),'mobile navigation opens');
 await goto('/teniski/?category='+encodeURIComponent('Суитшърти'));
 await page.locator('#models [data-model]').first().waitFor();
 assert((await page.locator('#models [data-model]:visible').count())>0,'mobile category filter works');
 const mobile=await page.evaluate(()=>({width:document.documentElement.scrollWidth,view:window.innerWidth}));
 assert(mobile.width<=mobile.view+5,'mobile clothing has no horizontal page overflow: '+JSON.stringify(mobile));
 await page.screenshot({path:'test-output/v3-clothing-mobile.png',fullPage:true});
 assert.deepEqual(errors,[],'browser JavaScript error list');
 console.log('VINILPECHAT_V3_BROWSER_PASS',JSON.stringify({
  homepage:true,garmentCategories:7,featured:4,services:3,vinyl:true,tarps:true,admin:true,
  modelFilter:true,editor:true,mobile:true,errors:errors.length
 }));
}finally{await browser.close()}
