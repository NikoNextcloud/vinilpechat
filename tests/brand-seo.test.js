'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pub=path.join(__dirname,'..','public');
const read=x=>fs.readFileSync(path.join(pub,x),'utf8');

test('storefront allows Google indexing, serves exact selected spiral artwork and matching favicon',()=>{
 const html=read('index.html');
 assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large"/);
 assert.doesNotMatch(html,/<meta name="robots" content="noindex/);
 assert.match(html,/<link rel="canonical" href="https:\\/\\/vinilpechat\\.vercel\\.app\\/"/);
 assert.match(html,/src="\\/assets\\/vinilpechat-art-spiral\\.webp"/);
 assert.match(html,/href="\\/favicon\\.png\\?v=spiral1"/);
 assert.match(html,/"@type":"Organization"/);
 assert.match(html,/"@type":"WebSite"/);
 assert.match(html,/"logo":"https:\\/\\/vinilpechat\\.vercel\\.app\\/assets\\/vinilpechat-art-spiral\\.webp"/);
 const logo=fs.readFileSync(path.join(pub,'assets/vinilpechat-art-spiral.webp'));
 const icon=fs.readFileSync(path.join(pub,'favicon.png'));
 assert.equal(logo.toString('ascii',0,4),'RIFF');
 assert.equal(logo.toString('ascii',8,12),'WEBP');
 assert.equal(icon.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.ok(logo.length<30000,'Website logo should load quickly');
 assert.ok(icon.length<5000,'Favicon should be compact');
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
 assert.match(vinyl,/src="\\/assets\\/vinilpechat-art-spiral\\.webp"/);
 assert.match(tarps,/src="\\/assets\\/vinilpechat-art-spiral\\.webp"/);
 assert.match(vinyl,/href="\\/favicon\\.png\\?v=spiral1"/);
 assert.match(tarps,/href="\\/favicon\\.png\\?v=spiral1"/);
});
test('local server no longer globally blocks public indexing but keeps JSON private',()=>{
 const srv=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
 assert.match(srv,/extra\['Content-Type'\]\?\.includes\('application\/json'\)/);
 assert.match(srv,/pathname\.endsWith\('\/'\)/);
 assert.match(srv,/'\.xml':'application\/xml/);
});
