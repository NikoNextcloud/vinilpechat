'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const seo=require('../lib/seo-pages.js');
const shirtCatalog=require('../data/stedman-catalog.json');
const shirtPage=require('../lib/stedman-page.js');
const {modelPath}=require('../public/teniski/model-links.js');
const origin='https://vinilpechat.vercel.app';
const cats=[
 {id:'kristal',name:'Кристал винил',description:'Прозрачни платнища по размер',sort_order:1},
 {id:'mesh',name:'Перфовинил меш',description:'Мрежести платнища',sort_order:2},
 {id:'empty',name:'Празна категория',description:'Няма продукти',sort_order:3}
];
const products=[
 {id:17,name:'Кристал винил 1000 микрона – ветроупорна завеса',category:'kristal',description:'Прозрачен PVC материал <по размер> & за тенти',unit:'кв.м.',sale_price:9.71,active:true,image:'https://okgimoegtsywbxkndzgw.supabase.co/storage/v1/object/public/vinyl-product-images/example.jpg',supplier_options:[],price_verification_needed:false,images:[]},
 {id:18,name:'Кристал винил – 2000 микрона',category:'kristal',description:'Материал с варианти',active:true,sale_price:null,price_verification_needed:true,supplier_options:[{id:'width',label:'Ширина',values:[]}],images:[]},
 {id:19,name:'Перфовинил за фасади',category:'mesh',description:'Перфориран материал',active:true,sale_price:15,price_verification_needed:true,images:[]},
 {id:20,name:'Скрит артикул',category:'kristal',description:'Чернова, не е видима',active:false,sale_price:5}
];
function mockDatabase(productRows=products,categoryRows=cats){
 return {from(table){
  const arr=table==='vinyl_products'?productRows:categoryRows;
  const matches=[];let limit=Infinity;
  const get=()=>arr.filter(x=>matches.every(([k,v])=>x[k]===v)).sort((a,b)=>(a.id||a.sort_order||0)-(b.id||b.sort_order||0)).slice(0,limit);
  return {
   select(){return this},
   eq(k,v){matches.push([k,v]);return this},
   order(){return this},
   limit(n){limit=n;return this},
   range(a,b){return Promise.resolve({data:get().slice(a,b+1),error:null})},
   maybeSingle(){return Promise.resolve({data:get()[0]||null,error:null})},
   then(onFulfilled,onRejected){return Promise.resolve({data:get(),error:null}).then(onFulfilled,onRejected)}
  };
 }};
}
test('SEO URLs are unique, readable and stable by ID',()=>{
 assert.equal(seo.slugify('Кристал винил 1000 микрона'),'kristal-vinil-1000-mikrona');
 assert.equal(seo.productUrl(products[0]),'/produkti/17-kristal-vinil-1000-mikrona-vetrouporna-zavesa');
 assert.equal(seo.categoryUrl(cats[0]),'/kategorii/kristal-kristal-vinil');
});
test('products generate server-side HTML, canonical, rich product data and safe descriptions',()=>{
 const p=seo.productPage(products[0],cats[0],[products[1]]);
 assert.equal(p.canonical,seo.productUrl(products[0]));
 assert.ok(p.html.includes('<html lang="bg">'));
 assert.ok(p.html.includes('rel="canonical" href="'+origin+p.canonical+'"'));
 assert.ok(p.html.includes('<h1>Кристал винил 1000 микрона'));
 assert.ok(p.html.includes('&lt;по размер&gt; &amp; за тенти'));
 assert.ok(p.html.includes('application/ld+json'));
 assert.ok(p.html.includes('"@type":"Product"'));
 assert.ok(p.html.includes('"priceCurrency":"EUR"'));
 assert.ok(p.html.includes('"price":"9.71"'));
 assert.ok(p.html.includes('href="/#item-17"'));
 assert.ok(p.html.includes(seo.productUrl(products[1])));
 assert.ok(!p.html.includes('<по размер>'));
});
test('unconfirmed products do not make false price claims',()=>{
 for(const p of [products[1],products[2]]){
  const rendered=seo.productPage(p,cats.find(c=>c.id===p.category));
  assert.ok(!rendered.html.includes('"@type":"Offer"'));
  const graph=JSON.parse(rendered.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.ok(!graph.some(x=>x['@type']==='Product'),'No incomplete Product entity');
  const page=graph.find(x=>x['@type']==='WebPage');
  assert.equal(page.identifier,String(p.id));
  assert.equal(page.url,origin+seo.productUrl(p));
  assert.ok(rendered.html.includes('Цена по запитване'));
 }
});
test('different products with the same long name retain unique HTML titles',()=>{
 const name='Еднакво дълго продуктово наименование '.repeat(10);
 const titles=[101,102].map(id=>seo.productPage({...products[0],id,name},cats[0]).html.match(/<title>([^<]+)<\/title>/)[1]);
 assert.notEqual(titles[0],titles[1]);
 assert.ok(titles.every(title=>title.length<=150));
});
test('category pages include actual content and crawlable product links',()=>{
 const html=seo.categoryPage(cats[0],products.filter(x=>x.active&&x.category==='kristal'),cats).html;
 assert.ok(html.includes('<h1>Кристал винил</h1>'));
 assert.ok(html.includes('href="'+seo.productUrl(products[0])+'"'));
 assert.ok(html.includes('"@type":"CollectionPage"'));
 assert.ok(html.includes('"@type":"ItemList"'));
 assert.ok(html.includes('href="'+seo.categoryUrl(cats[1])+'"'));
});
test('dynamic sitemap includes active products and occupied categories only',async()=>{
 const sitemap=await seo.sitemapXml(mockDatabase());
 assert.match(sitemap,/<urlset/);
 assert.ok(sitemap.includes(origin+'/nov-vinil/'));
 assert.ok(sitemap.includes(origin+'/brezenti/'));
 assert.ok(sitemap.includes(origin+seo.productUrl(products[0])));
 assert.ok(sitemap.includes(origin+seo.productUrl(products[2])));
 assert.ok(sitemap.includes(origin+seo.categoryUrl(cats[0])));
 assert.ok(!sitemap.includes('Skrit'));
 assert.ok(!sitemap.includes('/produkti/20-'));
 assert.ok(!sitemap.includes(seo.categoryUrl(cats[2])));
 assert.ok(!sitemap.includes('#item-'));
});
test('sitemap includes all 75 published shirt pages with their exact canonical URLs',async()=>{
 const sitemap=await seo.sitemapXml(mockDatabase());
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.ok(urls.includes(origin+'/teniski/'));
 assert.equal(new Set(urls).size,urls.length);
 for(const model of shirtCatalog){
  const pathname=modelPath(model);
  assert.ok(urls.includes(origin+pathname),model.id+' missing from sitemap');
  const page=shirtPage.resolve(pathname.slice('/teniski/'.length));
  assert.equal(page.canonical,pathname);
  assert.ok(page.html.includes('rel="canonical" href="'+origin+pathname+'"'));
 }
});
test('renamed categories redirect once, while empty and unknown categories remain 404',async()=>{
 const db=mockDatabase();
 assert.deepEqual(await seo.resolveCategory(db,'kristal-old-name'),{redirect:seo.categoryUrl(cats[0])});
 assert.equal(await seo.resolveCategory(db,'empty-old-name'),null);
 assert.equal(await seo.resolveCategory(db,'not-a-category'),null);
 const page=await seo.resolveCategory(db,seo.categoryUrl(cats[0]).split('/').pop());
 assert.equal(page.canonical,seo.categoryUrl(cats[0]));
 assert.equal(page.redirect,undefined);
});
test('category redirects use the longest hyphenated category ID without matching its prefix',async()=>{
 const categories=[{id:'scorpio',name:'Основна'},{id:'scorpio-garden',name:'За градината'}];
 const rows=[{id:1,name:'Продукт',active:true,category:'scorpio-garden'}];
 const db=mockDatabase(rows,categories);
 assert.deepEqual(await seo.resolveCategory(db,'scorpio-garden-old-name'),{redirect:'/kategorii/scorpio-garden-za-gradinata'});
 assert.equal(await seo.resolveCategory(db,'scorpio-old-name'),null);
});
test('SSR resolver returns 404 for hidden products and 308 for outdated slugs',async()=>{
 const db=mockDatabase();
 assert.equal(await seo.resolveProduct(db,'20-skrit-artikul'),null);
 assert.equal(await seo.resolveProduct(db,'not-a-product'),null);
 const old=await seo.resolveProduct(db,'17-old-slug');
 assert.equal(old.redirect,seo.productUrl(products[0]));
 const ok=await seo.resolveProduct(db,seo.productUrl(products[0]).split('/').pop());
 assert.ok(ok.html.includes('<h1>'));
 assert.equal(await seo.resolveCategory(db,seo.categoryUrl(cats[2]).split('/').pop()),null);
});
test('single-function Vercel SSR rewrites and transparent home fallback are wired',()=>{
 const root=path.join(__dirname,'..');
 const vercel=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
 const rules=vercel.rewrites;
 assert.ok(rules.some(x=>x.source==='/sitemap.xml'&&x.destination.includes('seo/sitemap')));
 assert.ok(rules.some(x=>x.source==='/produkti/:slug'&&x.destination.includes('seo/product')));
 assert.ok(rules.some(x=>x.source==='/kategorii/:slug'&&x.destination.includes('seo/category')));
 const api=fs.readFileSync(path.join(root,'api/index.js'),'utf8');
 assert.ok(api.includes("require('../lib/seo-pages.js')"));
 assert.ok(api.includes("route==='seo/product'"));
 assert.ok(api.includes("route==='seo/sitemap'"));
 const index=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
 assert.ok(index.includes('<main id="main">'));
 assert.ok(index.includes('<h1 id="seo-home-title">Печат на винил'));
 const js=fs.readFileSync(path.join(root,'public/site.js'),'utf8');
 assert.ok(js.includes('seoProductHref(p)'));
 assert.ok(js.includes('seoCategoryHref(c)'));
});
