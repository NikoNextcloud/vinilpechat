import assert from 'node:assert/strict';
import {readFileSync,mkdirSync} from 'node:fs';
import {chromium} from 'playwright';

const shirts=JSON.parse(readFileSync('data/stedman-catalog.json','utf8'));
const fullModels=shirts.map(m=>({id:m.id,name:m.bg,gender:m.gender,rows:m.groups.flatMap(g=>
 Object.entries(g).filter(([k,v])=>k!=='label'&&typeof v==='number').map(([color_group,cost])=>({
  model_id:m.id,size_band:g.label,color_group,supplier_price:cost,sale_price:Math.round(cost*200)/100
 })))}));
const product={id:1,name:'Тестов продукт',description:'',category:'test',unit:'бр.',active:true,sale_price:19.5,
 supplier_price:8.5,manual_sale_price:true,source:'',image:'',images:[],supplier_options:[
  {id:'size',label:'Размер',values:[{id:'m',text:'M'}]}
 ],variants:[{product_id:1,variant_key:'size=m',label:'Размер M',choices:{size:'m'},supplier_price:5.5,
  sale_price:12.5,manual_sale_price:true,active:true,price_verification_needed:false}]};
const initial={products:[product],categories:[{id:'test',name:'Тест',description:'',icon:''}],settings:{
 brand:'Vinilpechat',company:'',phone:'',email:'',address:'',shipping:'',privacy:''},orders:[]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];let postedProduct=null,postedVariant=null,postedStedman=null;
page.on('pageerror',error=>errors.push(error.message));
await page.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({
 ok:true,configured:true,catalogReady:true,ordersReady:true,adminReady:true})}));
await page.route('**/api/catalog',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(initial)}));
await page.route('**/api/admin/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:true,csrf:'browser-test'})}));
await page.route('**/api/admin/data',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(initial)}));
await page.route('**/api/admin/save',route=>{postedProduct=route.request().postDataJSON();
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})});});
await page.route('**/api/admin/variants',route=>{postedVariant=route.request().postDataJSON();
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,count:1})});});
await page.route('**/api/admin/shirt-prices',route=>{
 if(route.request().method()==='POST'){postedStedman=route.request().postDataJSON();
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,updated:postedStedman.rows.length})});}
 return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,models:fullModels})});
});
try{
 await page.goto('http://127.0.0.1:3000/#admin',{waitUntil:'domcontentloaded'});
 await page.locator('[data-admin-tab="products"]').waitFor({state:'visible'});
 assert(await page.locator('[data-field="supplier_price"]').isVisible(),'ordinary product supplier editable');
 assert(await page.locator('[data-field="sale_price"]').isVisible(),'ordinary product retail editable');
 await page.locator('[data-field="supplier_price"]').fill('9.25');
 await page.locator('[data-field="sale_price"]').fill('27.80');
 await Promise.all([page.waitForResponse(response=>response.url().includes('/api/admin/save')&&response.request().method()==='POST'),
  page.locator('[data-admin-save]').first().click()]);
 assert(postedProduct,'product save request sent');
 assert.equal(postedProduct.products[0].supplier_price,9.25);
 assert.equal(postedProduct.products[0].sale_price,27.8);

 await page.locator('[data-admin-tab="variants"]').click();
 await page.locator('.admin-variant-group summary').first().click();
 await page.locator('[data-variant-supplier-price]').waitFor({state:'visible'});
 await page.locator('[data-variant-supplier-price]').fill('6.75');
 await page.locator('[data-variant-price]').fill('15.50');
 await Promise.all([page.waitForResponse(response=>response.url().includes('/api/admin/variants')&&response.request().method()==='POST'),
  page.locator('[data-admin-save-variants]').click()]);
 assert(postedVariant&&postedVariant.variants.length===1,'variant edit sent');
 assert.equal(postedVariant.variants[0].supplier_price,6.75);
 assert.equal(postedVariant.variants[0].sale_price,15.50);
 assert.equal(postedVariant.variants[0].manual_sale_price,true);

 await page.locator('[data-admin-tab="stedman"]').click();
 await page.locator('#stedman-model-list details').first().waitFor({state:'attached'});
 assert.equal(await page.locator('#stedman-model-list details').count(),75,'all models have independent cost + retail edit');
 await page.locator('#stedman-model-list details').first().locator('summary').click();
 const cost=page.locator('[data-stedman-edit="supplier_price"][data-stedman-id="ST2000"]').first();
 const sale=page.locator('[data-stedman-edit="sale_price"][data-stedman-id="ST2000"]').first();
 assert(await cost.isVisible()&&await sale.isVisible(),'both price inputs are visible');
 await cost.fill('3.70');await sale.fill('10.90');
 assert((await page.locator('#stedman-pricing-status').innerText()).includes('Незаписани промени'));
 mkdirSync('test-output',{recursive:true});
 await page.screenshot({path:'test-output/stedman-admin-dual-prices.png',fullPage:true});
 await Promise.all([page.waitForResponse(response=>response.url().includes('/api/admin/shirt-prices')&&response.request().method()==='POST'),
  page.locator('[data-stedman-save]').click()]);
 await page.waitForFunction(()=>document.querySelector('#stedman-pricing-status')?.textContent.includes('Записани'));
 assert(postedStedman&&postedStedman.rows.length===1,'one price band saved');
 assert.equal(postedStedman.rows[0].supplier_price,3.7);
 assert.equal(postedStedman.rows[0].sale_price,10.9);
 assert.deepEqual(errors,[],'no browser JavaScript errors');
 console.log('ADMIN_DUAL_PRICING_BROWSER_PASS',JSON.stringify({models:fullModels.length,productPriceEdit:true,variantPriceEdit:true,stedmanPriceEdit:true,pageErrors:errors.length}));
}finally{await browser.close()}
