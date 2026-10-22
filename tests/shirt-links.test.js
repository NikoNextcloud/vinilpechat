'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../data/stedman-catalog.json');
const {modelPath,matchPath}=require('../public/teniski/model-links.js');
const {resolve}=require('../lib/stedman-page.js');
const ST2300=catalog.find(m=>m.id==='ST2300');
const requested='/teniski/'+encodeURIComponent('Мъжка тениска')+'-model-ST2300';

test('All 75 Stedman product cards have unique directly shareable URLs',()=>{
 assert.equal(catalog.length,75);
 const urls=catalog.map(modelPath);
 assert.equal(new Set(urls).size,75);
 for(const model of catalog){
  const url=modelPath(model);
  assert.equal(matchPath(url,catalog)?.id,model.id);
  const page=resolve(url.slice('/teniski/'.length));
  assert.ok(page,'SSR should resolve '+model.id);
  assert.equal(page.redirect,undefined,'Canonical should not redirect '+model.id);
  assert.match(page.html,new RegExp(model.id));
 }
});
test('ST2300 has the exact requested Bulgarian model address',()=>{
 assert.equal(modelPath(ST2300),requested);
 assert.equal(matchPath(requested,catalog),ST2300);
 const page=resolve(requested.slice('/teniski/'.length));
 assert.ok(page.html.includes('href="https://vinilpechat.vercel.app'+requested+'"'));
 assert.ok(page.html.includes('Мъжка тениска с V-образно деколте'));
 assert.ok(page.html.includes('"@type":"Product"'));
 assert.ok(page.html.includes('src="/teniski/model-links.js" defer'));
 assert.doesNotMatch(page.html,/Доставна цена/);
});
test('Unknown products fail and wrong label redirects to canonical',()=>{
 assert.equal(resolve('Непознат-model-ST9999'),null);
 assert.equal(resolve('../anything'),null);
 assert.equal(resolve('%ZZ-model-ST2300'),null);
 assert.equal(resolve('Грешно-име-model-ST2300')?.redirect,requested);
});
test('Vercel and local server resolve the same permalink',()=>{
 const vercel=JSON.parse(fs.readFileSync(path.join(__dirname,'../vercel.json'),'utf8'));
 assert.ok(vercel.rewrites.some(v=>v.source==='/teniski/:slug(.*-model-ST[0-9]{4})'&&v.destination.includes('seo/shirt')));
 const api=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');
 const server=fs.readFileSync(path.join(__dirname,'../server.js'),'utf8');
 const app=fs.readFileSync(path.join(__dirname,'../public/teniski/app.js'),'utf8');
 assert.match(api,/route==='seo\/shirt'/);
 assert.match(server,/shirtPage\.resolve/);
 assert.match(app,/shirtLinks\.modelPath\(selected\)/);
 assert.match(app,/shirtLinks\.matchPath\(location\.pathname,models\)/);
 assert.match(app,/href=.*shirtLinks\.modelPath\(m\)/);
 assert.match(app,/#model-\(ST/);
});
