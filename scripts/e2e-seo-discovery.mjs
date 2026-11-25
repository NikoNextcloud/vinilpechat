import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const base=process.env.SEO_BASE_URL||'http://localhost:3000';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
try{
 for(const width of [390,1400]){
  const page=await browser.newPage({viewport:{width,height:844}});
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/api/catalog',async route=>{await pending;await route.continue();});
  await page.addInitScript(()=>{
   window.catalogShifts=[];
   new PerformanceObserver(list=>{
    for(const e of list.getEntries())if(!e.hadRecentInput)window.catalogShifts.push(e.value);
   }).observe({type:'layout-shift',buffered:true});
  });
  await page.goto(base+'/brezenti/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.cover-buyer-guide').getBoundingClientRect().top>=innerHeight);
  assert.equal(await page.locator('#cover-grid').getAttribute('aria-busy'),'true');
  release();
  await page.locator('.cover-product').first().waitFor();
  await page.waitForFunction(()=>document.querySelector('#cover-grid').getAttribute('aria-busy')==='false');
  const shifts=await page.evaluate(async()=>{
   await new Promise(requestAnimationFrame);
   await new Promise(requestAnimationFrame);
   return window.catalogShifts;
  });
  const sum=shifts.reduce((total,value)=>total+value,0);
  assert.ok(sum<0.1,'Catalog loading layout shifts on '+width+'px: '+sum);
  console.log(width+'px: cover catalog loading layout shifts '+sum.toFixed(3));
  await page.close();
 }
 const page=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
 const response=await page.goto(base+'/pechatni-produkti/');
 assert.equal(response.status(),200);
 assert.equal(await page.locator('h1').textContent(),'Печат на перфофолио и рекламни изделия');
 const link=page.getByRole('link',{name:'Задай размери за перфофолио',exact:false});
 const [detail]=await Promise.all([page.waitForNavigation(),link.click()]);
 assert.equal(detail.status(),200);
 assert.match(detail.headers()['x-robots-tag'],/noindex/);
 assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,follow');
 console.log('Print hub to perfofilm details works without JavaScript');
}finally{await browser.close();}
