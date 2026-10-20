'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pub=path.join(__dirname,'..','public');
const read=x=>fs.readFileSync(path.join(pub,x),'utf8');

test('storefront allows public Google indexing, has logo and favicon',()=>{
 const html=read('index.html');
 assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large"/);
 assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
 assert.match(html,/<link rel="canonical" href="https:\/\/vinilpechat\.vercel\.app\/"/);
 assert.match(html,/src="\/assets\/vinilpechat-logo\.svg"/);
 assert.match(html,/href="\/favicon\.svg"/);
 assert.match(html,/"@type":"Organization"/);
 assert.match(html,/"@type":"WebSite"/);
 const logo=read('assets/vinilpechat-logo.svg');
 const icon=read('favicon.svg');
 assert.match(logo,/<svg\b/);
 assert.match(logo,/Vinilpechat/);
 assert.match(icon,/<svg\b/);
 assert.match(icon,/viewBox="0 0 128 128"/);
});
test('robots and sitemap expose real indexable routes rather than hash fragments',()=>{
 const robots=read('robots.txt');
 const sitemap=read('sitemap.xml');
 assert.match(robots,/User-agent: \*/);
 assert.match(robots,/Sitemap: https:\/\/vinilpechat\.vercel\.app\/sitemap\.xml/);
 assert.doesNotMatch(robots,/Disallow:\s*\/\s*(?:\n|$)/);
 for(const entry of ['/','/nov-vinil/','/brezenti/']){
  assert.ok(sitemap.includes('https://vinilpechat.vercel.app'+entry),entry);
 }
 assert.doesNotMatch(sitemap,/#(?:design|catalog|item-)/);
 assert.match(sitemap,/<urlset/);
});
test('service landing pages are crawlable, unique and navigable',()=>{
 const vinyl=read('nov-vinil/index.html'),tarps=read('brezenti/index.html');
 assert.match(vinyl,/<html lang="bg">/);
 assert.match(tarps,/<html lang="bg">/);
 assert.match(vinyl,/Печат на винил по размер/);
 assert.match(tarps,/Брезенти и покривни платнища/);
 assert.match(vinyl,/href="\/#design"/);
 assert.match(tarps,/href="\/#catalog"/);
 assert.match(vinyl,/"@type":"Service"/);
 assert.match(tarps,/"@type":"CollectionPage"/);
 assert.match(vinyl,/rel="canonical"/);
 assert.match(tarps,/rel="canonical"/);
 assert.doesNotMatch(vinyl+tarps,/noindex|nofollow/);
});
test('local server no longer globally blocks public indexing but keeps JSON private',()=>{
 const srv=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
 assert.match(srv,/extra\['Content-Type'\]\?\.includes\('application\/json'\)/);
 assert.match(srv,/pathname\.endsWith\('\/'\)/);
 assert.match(srv,/'\.xml':'application\/xml/);
});
