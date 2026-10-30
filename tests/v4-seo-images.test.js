'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const service=require('../lib/print-service-pages.js');
const seo=require('../lib/seo-pages.js');
const handler=require('../api/index.js');
const catalog=require('../public/pechatni-produkti/catalog.json');
const read=rel=>fs.readFileSync(path.join(__dirname,'..',rel),'utf8');
const ORIGIN='https://vinilpechat.vercel.app';

test('Every V4 print item has a unique, local 960x640 SVG illustration and alt text',()=>{
 const paths=new Set();
 for(const p of catalog.items){
  assert.match(p.slug,/^vp4-\d{3}-[a-z0-9-]+$/);
  assert(/^\/pechatni-produkti\/images\/vp4-\d{3}\.svg$/.test(p.image));
  assert(!paths.has(p.image),'Duplicate product image path '+p.image);
  paths.add(p.image);
  const file=path.join(__dirname,'../public',p.image);
  assert(fs.existsSync(file),'Missing image '+p.image);
  const svg=fs.readFileSync(file,'utf8');
  assert.match(svg,/<svg[^>]*width="960" height="640"/);
  assert.match(svg,/<title id="title">/);
  assert.match(svg,/<desc id="desc">/);
  assert(!/https?:\/\/|<script\b|xlink:href=/.test(svg),'No remote assets/scripts in '+p.image);
  assert(p.image_alt.includes(p.name));
 }
 assert.equal(paths.size,38);
});

test('Static overview uses discoverable image file references and accessible links',()=>{
 const js=read('public/pechatni-produkti/catalog.js');
 const html=read('public/pechatni-produkti/index.html');
 assert(js.includes('img.src=product.image'));
 assert(js.includes('img.alt=product.image_alt'));
 assert(js.includes('loading=index<3'));
 assert(html.includes('<noscript>'));
 for(const p of catalog.items)assert(html.includes('/pechatni-produkti/'+p.slug));
 assert(html.includes('"@type":"CollectionPage"'));
 assert(html.includes('noindex,follow'));
});

test('All 38 independent HTML service pages have self canonical, OG image and breadcrumbs',()=>{
 for(const p of catalog.items){
  const page=service.detail(p.slug);
  assert(page&&page.html);
  assert.equal(page.canonical,service.path(p));
  assert.equal(page.verified,false);
  assert(page.html.includes('<h1>'+p.name+'</h1>'));
  assert(page.html.includes('rel="canonical" href="'+ORIGIN+page.canonical+'"'));
  assert(page.html.includes('name="robots" content="noindex,follow"'));
  assert(page.html.includes('og:image:alt'));
  assert(page.html.includes('src="'+p.image+'"'));
  assert(!page.html.includes('"@type":"Offer"'));
  const raw=page.html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  const graph=JSON.parse(raw)['@graph'];
  assert(graph.some(x=>x['@type']==='BreadcrumbList'));
  assert(graph.some(x=>x['@type']==='WebPage'));
  assert(!graph.some(x=>x['@type']==='Product' || x['@type']==='Service'),'Unverified service cannot advertise an offer');
 }
});

test('Noncanonical slug redirects and unknown/unsafe URLs cannot leak data',()=>{
 assert.deepEqual(service.detail('vp4-013-wrong-name'),{redirect:'/pechatni-produkti/vp4-013-rol-baner'});
 assert.equal(service.detail('vp4-999-fake'),null);
 assert.equal(service.detail('../'),null);
 assert.equal(service.detail('vp4-013-%2F'),null);
 assert.equal(service.approved().length,0);
});

test('Google image sitemap covers active products while excluding unverified services',async()=>{
 const rows=[{id:13,name:'Лента кристал винил',category:'tarps',active:true,image:ORIGIN+'/assets/placeholder.svg',images:[]},
 {id:14,name:'Платнище синьо',category:'tarps',active:true,image:ORIGIN+'/uploads/blue.webp',images:[]}];
 const categories=[{id:'tarps',name:'Брезенти',description:'Оригинални предложения'}];
 const db={from(table){
  const a=table==='vinyl_products'?rows:categories;
  let filters=[];
  return {select(){return this},eq(k,v){filters.push([k,v]);return this},order(){return this},
   range(a,b){return Promise.resolve({data:(table==='vinyl_products'?rows:categories).filter(x=>filters.every(([k,v])=>x[k]===v)).slice(a,b+1),error:null})},
   then(resolve,reject){return Promise.resolve({data:a.filter(x=>filters.every(([k,v])=>x[k]===v)),error:null}).then(resolve,reject)}
  };
 }};
 const xml=await seo.sitemapXml(db);
 assert(xml.includes('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"'));
 assert(xml.includes('<image:image><image:loc>'+ORIGIN+'/uploads/blue.webp</image:loc></image:image>'));
 assert(xml.includes(seo.productUrl(rows[0])));
 assert(!xml.includes('<image:loc>'+ORIGIN+'/assets/placeholder.svg'));
 for(const p of catalog.items)assert(!xml.includes(service.path(p)),'Unverified service in sitemap');
});

test('Vercel and local route serve the same SEO page and 404/308 rules',async()=>{
 const vercel=JSON.parse(read('vercel.json'));
 assert(vercel.rewrites.some(x=>x.source.includes('pechatni-produkti/:slug')&&x.destination.includes('seo/print-service')));
 assert(read('server.js').includes("printServices.detail"));
 const req=(method,slug)=>({method,query:{route:'seo/print-service',slug},url:'/api/index',headers:{}});
 const request=async(method,slug)=>{
  const response={headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},
   status(code){this.statusCode=code;return this},send(x){this.body=x;return this},
   end(){this.ended=true;return this},json(x){this.body=x;return this}};
  await handler(req(method,slug),response);return response;
 };
 const good=await request('GET',catalog.items[0].slug);
 const head=await request('HEAD',catalog.items[0].slug);
 assert.equal(good.statusCode,200);
 assert.equal(head.statusCode,200);
 assert.equal(head.body,undefined);
 assert.equal(good.headers['x-robots-tag'],'noindex, follow');
 assert.equal((await request('GET','vp4-001-old')).statusCode,308);
 const missing=await request('GET','vp4-999-unknown');
 assert.equal(missing.statusCode,404);
 assert.equal(missing.headers['x-robots-tag'],'noindex');
});

test('Permanent SEO instructions are included in repository for future changes',()=>{
 assert(read('AGENTS.md').includes('docs/seo-standards.md'));
 assert(read('docs/seo-standards.md').includes('noindex'));
 assert(read('docs/seo-standards.md').includes('sitemap'));
});
