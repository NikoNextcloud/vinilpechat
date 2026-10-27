'use strict';
// Read-only production audit. --full checks every sitemap page, with five workers.
const assert=require('node:assert/strict');
const seo=require('../lib/seo-pages.js');
const models=require('../data/stedman-catalog.json');
const {modelPath}=require('../public/teniski/model-links.js');
const base=(process.env.SEO_BASE_URL||seo.ORIGIN).replace(/\/$/,'');
const expectedSha=process.env.SEO_EXPECTED_SHA;
const full=process.argv.includes('--full');
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const href=s=>new URL(s,seo.ORIGIN).href;
async function get(path,method='GET'){
 const res=await fetch(base+path,{method,signal:AbortSignal.timeout(45000),redirect:'manual',cache:'no-store',headers:{'User-Agent':'Vinilpechat-SEO-Audit/2.0','Cache-Control':'no-cache'}});
 if(expectedSha&&(path==='/sitemap.xml'||/^\/(produkti|kategorii)\//.test(path)||/^\/teniski\/.+-model-ST\d{4}$/.test(path))){
  assert.equal(res.headers.get('x-vinilpechat-commit'),expectedSha,'published SEO response commit (stale deployment/cache): '+path);
 }
 return {res,body:await res.text()};
}
async function pool(items,work){
 let next=0;
 await Promise.all(Array.from({length:Math.min(5,items.length)},async()=>{
  while(next<items.length)await work(items[next++]);
 }));
}
function jsonld(body){
 const scripts=[...body.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
 return scripts.flatMap(m=>{
  const data=JSON.parse(m[1]);
  assert.equal(data['@context'],'https://schema.org');
  return data['@graph']||[data];
 });
}
(async()=>{
 if(expectedSha){
  const health=await get('/api/health');
  assert.equal(health.res.status,200);
  assert.equal(JSON.parse(health.body).commit,expectedSha,'production must serve the commit under test');
 }
 const robots=await get('/robots.txt');
 assert.equal(robots.res.status,200);
 assert.ok(robots.body.includes('Sitemap: '+seo.ORIGIN+'/sitemap.xml'));
 assert.doesNotMatch(robots.body,/Disallow:\s*\/\s*(?:\n|$)/);
 const sitemap=await get('/sitemap.xml');
 assert.equal(sitemap.res.status,200);
 assert.match(sitemap.res.headers.get('content-type')||'',/xml/);
 assert.match(sitemap.body,/<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
 const urls=[...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1]));
 assert.equal(new Set(urls).size,urls.length,'duplicate sitemap URLs');
 for(const url of urls){assert.ok(url.startsWith(seo.ORIGIN+'/'));assert.equal(new URL(url).hash,'');}
 const catalogResponse=await get('/api/catalog');
 assert.equal(catalogResponse.res.status,200);
 const catalog=JSON.parse(catalogResponse.body);
 const products=catalog.products.filter(p=>p.active===true);
 const occupied=new Set(products.map(p=>p.category));
 const categories=catalog.categories.filter(c=>occupied.has(c.id));
 const expected=['/','/nov-vinil/','/brezenti/','/teniski/',...products.map(seo.productUrl),...categories.map(seo.categoryUrl),...models.map(modelPath)].map(x=>seo.ORIGIN+x);
 assert.deepEqual(new Set(urls),new Set(expected),'sitemap must exactly match active materials, occupied categories and published shirts');
 const byPath=new Map(products.map(p=>[seo.productUrl(p),p]));
 const sample=new Set(['/', '/nov-vinil/', '/brezenti/', '/teniski/',seo.productUrl(products.find(p=>p.id===13)||products[0]),seo.productUrl(products.at(-1)),seo.categoryUrl(categories[0]),modelPath(models[0]),modelPath(models.find(m=>m.id==='ST2300'))]);
 const selected=full?urls:urls.filter(u=>sample.has(new URL(u).pathname));
 let checked=0,inquiryPages=0;
 await pool(selected,async url=>{
  const path=new URL(url).pathname,page=await get(path);
  assert.equal(page.res.status,200,'HTTP status: '+path);
  assert.match(page.res.headers.get('content-type')||'',/text\/html/);
  assert.match(page.body,/<h1\b/);
  assert.match(page.body,/<title>[^<]+<\/title>/);
  assert.match(page.body,/<meta name="description" content="[^"]+"/);
  const canonical=[...page.body.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map(m=>href(decode(m[1])));
  assert.deepEqual(canonical,[href(url)],'self canonical: '+path);
  assert.doesNotMatch(page.res.headers.get('x-robots-tag')||'',/noindex/i);
  assert.doesNotMatch(page.body,/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i);
  const graph=jsonld(page.body);
  if(path.startsWith('/produkti/')||/\/teniski\/.+-model-ST\d{4}$/.test(path)){
   const product=graph.find(x=>x['@type']==='Product');
   const entity=product||graph.find(x=>x['@type']==='WebPage');
   assert.ok(entity?.name&&(entity.sku||entity.identifier),'Page name and product identifier: '+path);
   assert.equal(href(entity.url),href(url),'Page entity URL: '+path);
   if(product)assert.ok(product.offers||product.review||product.aggregateRating,'No incomplete Product rich-result markup: '+path);
   else inquiryPages++;
   const record=byPath.get(path);
   if(record){
    assert.equal(entity.sku||entity.identifier,String(record.id));
    assert.equal(entity.name,record.name.trim().replace(/\s+/g,' ').slice(0,250));
    assert.ok(page.body.includes('<h1>'+seo.escapeHtml(entity.name)+'</h1>'));
    assert.ok(graph.some(x=>x['@type']==='BreadcrumbList'));
   }
  }
  if(path.startsWith('/kategorii/'))assert.ok(graph.some(x=>x['@type']==='CollectionPage'));
  checked++;
  if(checked%25===0)console.log('Checked',checked,'/',selected.length,'pages');
 });
 const product=seo.productUrl(products.find(p=>p.id===13)||products[0]);
 const category=seo.categoryUrl(categories[0]);
 const shirt=modelPath(models.find(m=>m.id==='ST2300'));
 for(const [stale,canonical] of [[product.replace(/-.*$/,'-old-name'),product],['/kategorii/'+categories[0].id+'-old-name',category],['/teniski/Old-name-model-ST2300',shirt]]){
  for(const method of ['GET','HEAD']){
   const redirect=await get(stale,method);
   assert.equal(redirect.res.status,308,'permanent redirect: '+stale+' '+method);
   assert.equal(href(redirect.res.headers.get('location')),href(canonical));
   const target=await get(canonical,method);
   assert.equal(target.res.status,200,'redirect target: '+canonical);
   if(method==='HEAD')assert.equal(target.body,'');
  }
 }
 for(const path of ['/produkti/999999999-ne-sashtestvuva','/produkti/not-a-product','/kategorii/not-a-category','/teniski/no-such-model-ST9999']){
  for(const method of ['GET','HEAD']){
   const missing=await get(path,method);
   assert.equal(missing.res.status,404,'real 404: '+path+' '+method);
   assert.match(missing.res.headers.get('x-robots-tag')||'',/noindex/);
   if(method==='HEAD')assert.equal(missing.body,'');
  }
 }
 assert.equal((await get('/seo-audit-not-found-20261026')).res.status,404,'unknown path must not return the home page');
 for(const path of ['/sitemap.xml',product,category,shirt]){
  const head=await get(path,'HEAD');
  assert.equal(head.res.status,200,'HEAD '+path);
  assert.equal(head.body,'');
  assert.match(head.res.headers.get('content-type')||'',path.endsWith('.xml')?/xml/:/text\/html/);
 }
 console.log(JSON.stringify({result:'PASS',base,commit:expectedSha||null,sitemapUrls:urls.length,activeMaterials:products.length,categories:categories.length,shirtModels:models.length,pagesChecked:checked,inquiryPagesWithWebPageSchema:inquiryPages,incompleteProductSchemas:0}));
 console.log('JSON-LD parsing and identity checked; Google rich-result eligibility and indexing require Search Console/Rich Results Test.');
})().catch(e=>{console.error(e);process.exitCode=1;});
