'use strict';
const assert=require('node:assert/strict');
const base=(process.env.SEO_BASE_URL||'https://vinilpechat.vercel.app').replace(/\/$/,'');
const timeout=15000;
async function get(path) {
 const res=await fetch(base+path,{signal:AbortSignal.timeout(timeout),redirect:'manual',headers:{'User-Agent':'Vinilpechat-SEO-Smoke-Test/1.0'}});
 const body=await res.text();
 console.log(res.status,path,'content-type:',res.headers.get('content-type'));
 return {res,body};
}
function ok(cond,msg){assert.ok(cond,msg)}
(async()=>{
 const robots=await get('/robots.txt');
 ok(robots.res.status===200&&robots.body.includes('/sitemap.xml'),'robots.txt');
 const sitemap=await get('/sitemap.xml');
 ok(sitemap.res.status===200,'sitemap must return HTTP 200');
 ok((sitemap.res.headers.get('content-type')||'').includes('xml'),'sitemap XML content-type');
 ok(sitemap.body.includes('<urlset'),'sitemap valid root');
 const urls=[...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
 ok(urls.length>=3,'sitemap has pages');
 ok(urls.every(x=>x.startsWith(base+'/')),'sitemap URLs must use canonical origin');
 ok(new Set(urls).size===urls.length,'no duplicate sitemap URLs');
 const product=urls.find(x=>x.includes('/produkti/'));
 const category=urls.find(x=>x.includes('/kategorii/'));
 ok(product&&category,'sitemap must have active product and category URLs');
 for(const url of [product,category]){
  const pathname=new URL(url).pathname;
  const page=await get(pathname);
  ok(page.res.status===200,'SEO page status 200: '+pathname);
  ok((page.res.headers.get('content-type')||'').includes('text/html'),'SEO HTML: '+pathname);
  ok(page.body.includes('<h1'),'server-rendered H1: '+pathname);
  ok(page.body.includes('rel="canonical" href="'+url+'"'),'canonical: '+pathname);
  const jsonld=page.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  ok(jsonld,'JSON-LD: '+pathname);
  const structured=JSON.parse(jsonld[1]);
  ok(structured['@context']==='https://schema.org','schema context');
 }
 const invalid=await get('/produkti/999999999-ne-sashtestvuva');
 ok(invalid.res.status===404,'nonexistent product must be HTTP 404');
 ok((invalid.res.headers.get('x-robots-tag')||'').includes('noindex'),'404 noindex');
 const original=new URL(product).pathname;
 const stale=original.replace(/\/produkti\/(\d+)-.+$/,'/produkti/$1-old-product-name');
 const redirect=await get(stale);
 ok(redirect.res.status===308,'outdated slug must be HTTP 308');
 ok(redirect.res.headers.get('location')===original,'redirect must point to canonical path');
 console.log('SEO smoke test passed:',urls.length,'sitemap URLs');
})().catch(e=>{console.error(e);process.exitCode=1;});
