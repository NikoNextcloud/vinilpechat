'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const data=JSON.parse(read('public/pechatni-produkti/catalog.json'));
test('39 original print-service entries in five quote-only groups',()=>{
 assert.equal(data.items.length,39);assert.equal(data.categories.length,5);
 assert.equal(new Set(data.items.map(p=>p.id)).size,39);
 for(const p of data.items){assert(data.categories.includes(p.category));assert(p.name&&p.description&&p.visual);assert.equal(p.price,null);assert.equal(p.quote_only,true)}
});
test('No copied external descriptions, images or prices; unconfirmed services are noindex',()=>{
 for(const path of ['public/pechatni-produkti/catalog.json','public/pechatni-produkti/index.html','public/pechatni-produkti/catalog.js']){
  assert(!read(path).includes('billboard.bg'));assert(!read(path).includes('cloudfront.net'));
 }
 assert(read('public/pechatni-produkti/index.html').includes('noindex,follow'));
});
test('Original homepage, three main services and social feeds remain',()=>{
 const js=read('public/site.js'),html=read('public/index.html');
 assert.equal((js.match(/class="v3-primary-card v3-primary-/g)||[]).length,3);
 assert(html.includes('id="instagram-posts"')&&html.includes('id="facebook-card-title"'));
 assert(!js.includes('class="vp-grid"'));
});
test('Mixed inquiry draft merges, removes, checks amount, keeps no personal data',()=>{
 const memory=new Map();
 const win={localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)},
 document:{readyState:'loading',addEventListener(){},querySelectorAll(){return []}},
 addEventListener(){},dispatchEvent(){},CustomEvent:function(type){this.type=type}};
 vm.runInNewContext(read('public/quote-cart.js'),{window:win,CustomEvent:win.CustomEvent});
 const Q=win.VinilQuote;
 for(const [type,id] of [['service','VP4-001'],['shirt','stedman-ST2300'],['vinyl','vinyl-custom'],['material','material-13']])
  assert(Q.addDraft({id,type,name:id,quantity:1,details:'Тест'}).ok);
 assert.equal(Q.read().length,4);
 assert(Q.addDraft({id:'VP4-001',type:'service',name:'VP4-001',quantity:2,details:'Тест'}).ok);
 assert.equal(Q.read()[0].quantity,3);
 assert(!Q.addDraft({id:'bad',name:'Bad',quantity:0}).ok);
 assert(!JSON.stringify(Q.read()).includes('phone'));
 assert(Q.format().includes('[Vinilpechat V4]'));
 assert(Q.removeAt(0));assert(Q.clear());assert.equal(Q.count(),0);
});
test('Existing product, apparel, vinyl and admin pages have quote integration',()=>{
 const shop=read('public/site.js'),main=read('public/index.html');
 const shirts=read('public/teniski/index.html'),covers=read('public/brezenti/index.html');
 for(const html of [main,shirts,covers]){assert(html.includes('/quote-cart.js'));assert(html.includes('/zapitvane/'))}
 assert(shop.includes('data-v4-add-material'));assert(shop.includes('id="v4AddInquiry"'));
 assert(shop.includes("['print-inquiries','Запитвания за печат']"));
 assert(shop.includes('function renderCart()')&&shop.includes('function sendForm(form,type)'));
 assert(shirts.includes('id="v2-resize-handle"'));
});
test('Checkout never fakes payments or sends artwork bytes',()=>{
 const html=read('public/zapitvane/index.html'),js=read('public/zapitvane/quote.js');
 assert(js.includes("kind:'contact'"));assert(js.includes('ordersReady'));
 assert(js.includes('/api/orders'));assert(js.includes('Q.clear()'));
 assert(js.includes('response.ok'));assert(js.includes('не са изпратени автоматично'));
 assert(html.includes('не се качват автоматично'));
 assert(!js.includes('service_role')&&!js.includes('supabase.storage'));
});
