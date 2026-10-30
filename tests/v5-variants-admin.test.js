'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const config=require('../public/pechatni-produkti/variation-config.json');
const catalog=require('../public/pechatni-produkti/catalog.json');
const service=require('../lib/print-service-pages.js');
const src=file=>fs.readFileSync(path.join(__dirname,'..',file),'utf8');

test('Each of 39 print products has exact, typed variation options and size presets',()=>{
 assert.equal(catalog.items.length,39);
 assert.equal(catalog.categories.length,5);
 assert.equal(Object.keys(config.items).length,39);
 for(const product of catalog.items){
  const conf=config.items[product.id];assert(conf,'Missing configuration for '+product.id);
  assert(conf.presets.length>=2);
  const keys=new Set();
  for(const preset of conf.presets){
   assert(preset.width_cm>=5&&preset.width_cm<=2000);
   assert(preset.height_cm>=5&&preset.height_cm<=2000);
  }
  for(const field of conf.fields){
   assert(/^[a-z]+$/.test(field.id),'Unexpected field ID '+field.id);
   assert(!keys.has(field.id),'Duplicate choice key');keys.add(field.id);
   assert(['radio','select'].includes(field.kind));
   assert(field.choices.length>=2);
   assert.equal(new Set(field.choices.map(c=>c.value)).size,field.choices.length);
  }
  const page=service.detail(product.slug);
  assert(page.html.includes('id="vp-product-config"'),product.name);
  assert(page.html.includes('id="vp-service-data"'));
  assert(page.html.includes('id="vp-width"')&&page.html.includes('id="vp-height"'));
  assert(page.html.includes('id="vp-service-qty"'));
  assert(!page.html.includes('itemprop="price"')&&!page.html.includes('"@type":"Offer"'));
 }
});

test('Komatex has documented 3/5/8 mm, rectangle/custom cut, side printing and design options',()=>{
 const p=catalog.items.find(x=>x.id==='VP4-039');
 assert.equal(p.name,'Коматекс');
 assert(p.image.startsWith('/pechatni-produkti/'));
 const c=config.items[p.id];
 assert.deepEqual(c.fields.find(x=>x.id==='thickness').choices.map(x=>x.value),['3','5','8']);
 assert.deepEqual(c.fields.find(x=>x.id==='cut').choices.map(x=>x.value),['rectangle','custom']);
 assert.deepEqual(c.fields.find(x=>x.id==='sides').choices.map(x=>x.value),['one','both']);
 const page=service.detail(p.slug).html;
 assert(page.includes('3 мм')&&page.includes('5 мм')&&page.includes('8 мм'));
 assert(page.includes('По запитване'));
 assert(page.includes('data-vp-preset="0"'));
});

test('Configurator does not invent prices and only adds validated choices to a quote',()=>{
 const js=src('public/pechatni-produkti/detail.js');
 assert(js.includes('new URL(location.href)'));
 assert(js.includes('new URLSearchParams')===false || js.includes('searchParams'));
 assert(js.includes('VinilQuote.addDraft'));
 assert(js.includes('Number.isInteger(q)'));
 assert(js.includes('v.selections'));
 assert(js.includes("u.searchParams.set('vp_"));
 assert(!js.includes('/api/admin/')&&!js.includes('SUPABASE_SERVICE_ROLE_KEY'));
});

test('Admin is authenticated and retains existing price/order actions',()=>{
 const shop=src('public/site.js'),html=src('public/index.html');
 const css=src('public/v5-admin.css');
 assert(shop.includes("request('/api/admin/session')"));
 assert(shop.includes("request('/api/admin/data')"));
 assert(shop.includes("state.isAdmin=false"));
 assert(shop.includes("data-admin-save"));
 assert(shop.includes("data-admin-save-variants"));
 assert(shop.includes("data-stedman-save"));
 assert(shop.includes("data-admin-logout"));
 assert(shop.includes("data-admin-tab="));
 assert(shop.includes("data-v5-admin-refresh"));
 assert(shop.includes("t==='overview'"));
 assert(shop.includes("t==='print-products'"));
 assert(shop.includes("loadV5PrintProducts"));
 assert(html.includes('/v5-admin.css'));
 assert(css.includes('.v5-admin-sidebar'));
 assert(css.includes('@media(max-width:800px)'));
 assert(!shop.includes('service_role'));
});
