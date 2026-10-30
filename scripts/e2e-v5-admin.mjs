import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium} from 'playwright';
mkdirSync('test-output',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.setDefaultTimeout(22000);
const failures=[];
page.on('pageerror',e=>failures.push(e.message));
const mockProducts=[
{id:13,name:'Брезент син',category:'covers',active:true,sale_price:28,supplier_price:16,variants:[]},
{id:14,name:'Винил рекламно платно',category:'vinyl',active:true,sale_price:null,supplier_price:8,variants:[]}
];
const orders=[
{id:101,kind:'contact',name:'Тест Клиент',status:'new',created_at:'2026-10-29T10:00:00Z',items:[],message:'[Vinilpechat V4] Коматекс'}
];
const mockDb={ok:true,products:mockProducts,categories:[{id:'covers',name:'Винили за покриване'},{id:'vinyl',name:'Печат на винил'}],
orders,settings:{brand:'Vinilpechat Test'},variants:[]};
await page.route('**/api/health',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,configured:true,ordersReady:true})}));
await page.route('**/api/catalog',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mockDb)}));
await page.route('**/api/admin/session',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({authenticated:true,csrf:'test-preview-csrf'})}));
await page.route('**/api/admin/data',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(mockDb)}));
try{
 await page.goto('http://127.0.0.1:3000/#admin',{waitUntil:'domcontentloaded'});
 await page.locator('.v5-admin-shell').waitFor({state:'visible'});
 assert(await page.locator('.v5-admin-brand').isVisible());
 assert.equal(await page.locator('.v5-kpi').count(),4);
 assert((await page.locator('.v5-dashboard').innerText()).includes('2'));
 assert((await page.locator('.v5-dashboard').innerText()).includes('Последни заявки'));
 await page.screenshot({path:'test-output/v5-admin-dashboard-desktop.png',fullPage:true});
 await page.locator('[data-admin-tab=products]').first().click();
 await page.locator('.admin-table tbody tr').first().waitFor();
 assert.equal(await page.locator('.admin-table tbody tr').count(),2);
 assert.equal(await page.locator('input[data-field=sale_price][data-id="13"]').inputValue(),'28');
 await page.locator('#v5-admin-search').fill('Брезент');
 assert.equal(await page.locator('.admin-table tbody tr:visible').count(),1);
 await page.locator('#v5-admin-search').fill('');
 await page.screenshot({path:'test-output/v5-admin-price-editor.png',fullPage:false});
 await page.locator('[data-admin-tab="print-products"]').first().click();
 await page.locator('.v5-service-row').first().waitFor();
 assert.equal(await page.locator('.v5-service-row').count(),39);
 await page.locator('#v5-service-filter').fill('Коматекс');
 assert.equal(await page.locator('.v5-service-row:visible').count(),1);
 assert((await page.locator('.v5-service-row:visible').innerText()).includes('Коматекс'));
 await page.screenshot({path:'test-output/v5-admin-print-matrix.png',fullPage:false});
 await page.locator('[data-admin-tab="orders"]').first().click();
 await page.locator('.admin-order-card').first().waitFor({state:'visible'});
 await page.setViewportSize({width:390,height:844});
 await page.locator('[data-admin-tab=overview]').first().click();
 await page.locator('.v5-kpi').first().waitFor();
 const width=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
 assert(width.scroll<=width.viewport+6,'No mobile admin overflow '+JSON.stringify(width));
 await page.screenshot({path:'test-output/v5-admin-dashboard-mobile.png',fullPage:true});
 assert.deepEqual(failures,[]);
 console.log('VINILPECHAT_V5_ADMIN_PASS',JSON.stringify({authenticated:true,dashboard:true,prices:true,services:39,filter:true,mobile:true,errors:0}));
}finally{await browser.close();}
