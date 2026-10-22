import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const catalog=JSON.parse(readFileSync('data/stedman-catalog.json','utf8'));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:850}});
const errors=[];
page.on('pageerror',e=>errors.push(e.message));
page.setDefaultTimeout(15000);
const getMoney=async()=>{
 const text=await page.locator('#total-price').innerText();
 const clean=text.replace(/[\s\u00A0\u202F€]/g,'').replace(/\.(?=\d{3}\b)/g,'').replace(',','.');
 const value=Number(clean);
 assert(Number.isFinite(value)&&value>0,'Invalid price '+text);
 return value;
};
const failures=[];
try{
 await page.goto('http://127.0.0.1:3000/teniski/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-model]').first().waitFor();
 assert.equal(catalog.length,75);
 assert.equal(await page.locator('[data-model]').count(),catalog.length);
 for(const model of catalog){
  try{
   await page.locator('[data-model="'+model.id+'"]').click();
   assert.equal(await page.locator('#detail-code').innerText(),model.id);
   assert(await page.locator('#customizer').isVisible(),model.id+' details must show');
   assert((await page.locator('#v2-color-swatches button').count())>0,model.id+' needs color choices');
   assert((await page.locator('#v2-sizes [data-v2-size]').count())>0,model.id+' needs size choices');
   assert((await page.locator('#v2-gallery-thumbs button').count())>=3,model.id+' needs photos and back view');
   const image=await page.locator('#shirt-photo').getAttribute('src');
   assert(image&&image.length>15,model.id+' needs an image URL');
   for(const mode of ['front','both'])
    assert.equal(await page.locator('[data-print-mode="'+mode+'"]').getAttribute('aria-pressed'),'false',model.id+' should not preselect print');
   assert.equal(await page.locator('#front-upload').isVisible(),false,model.id+' initial upload must be hidden');
   const base=await getMoney();
   await page.locator('[data-print-mode="front"]').click();
   const front=await getMoney();
   assert(Math.abs(front-base-3)<0.01,model.id+' front adds 3 EUR ('+base+' -> '+front+')');
   await page.locator('[data-print-mode="both"]').click();
   const both=await getMoney();
   assert(Math.abs(both-base-6)<0.01,model.id+' both sides add 6 EUR ('+base+' -> '+both+')');
   await page.locator('#view-back').click();
   assert.equal(await page.locator('#shirt-photo').getAttribute('src'),'/teniski/assets/universal-back-white.webp',model.id+' should use customer white back image');
   await page.locator('#back-to-models').click();
   assert(await page.locator('#catalog-view').isVisible());
  }catch(e){
   failures.push({model:model.id,error:e.message});
   break;
  }
 }
 assert.deepEqual(failures,[],'Model-by-model regression failure');
 assert.deepEqual(errors,[],'Browser JS errors');
 console.log('ALL_STEDMAN_MODELS_PASS',JSON.stringify({total:catalog.length,commonLayout:true,universalBack:true,printSurcharges:[0,3,6],browserErrors:errors.length}));
}finally{await browser.close()}
