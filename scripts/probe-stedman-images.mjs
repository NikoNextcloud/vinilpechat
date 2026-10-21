import fs from 'node:fs';
const js=fs.readFileSync('public/teniski/app.js','utf8');
const match=js.match(/const models=(\[[^\n]+\]);/);
if(!match)throw Error('Could not parse models');
const products=JSON.parse(match[1]);
const root='https://www.stedman.eu';
const res=await fetch(root+'/en/complete-collection',{signal:AbortSignal.timeout(15000)});
if(!res.ok)throw Error('Complete collection HTTP '+res.status);
const html=await res.text();
const siteEntries=new Map();
for(const item of html.matchAll(/<a class="a-section" href="([^"]+)">([\s\S]*?)<\/a>/g)){
 const id=item[2].match(/<span>\s*(ST\d{4})\s*<\/span>/)?.[1];
 const src=item[2].match(/<img\b[^>]*src="([^"]+)"[^>]*>/i)?.[1];
 if(id&&src?.includes('/public/images/products/')&&src.endsWith('.jpg')){
  siteEntries.set(id,{image:new URL(src,root).href,productPage:new URL(item[1],root).href});
 }
}
console.log('OFFICIAL_LISTING',siteEntries.size,'CATALOGUE',products.length);
const results={};let idx=0;const failures=[];
async function verify(url){
 try {
  const resp=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(9500)});
  if(resp.ok&&resp.headers.get('content-type')?.startsWith('image/'))return true;
 }catch{}
 return false;
}
async function worker(){
 while(idx<products.length){
  const p=products[idx++];
  const id=p.id, entry=siteEntries.get(id);
  const folder=root+'/public/images/products/2026/'+id+'/'+id;
  const candidates=[entry?.image,folder+'_model.jpg',folder+'_WHI.jpg',folder+'_BLO.jpg'].filter(Boolean);
  let chosen=null;
  for(const candidate of [...new Set(candidates)]){
   if(await verify(candidate)){chosen=candidate;break}
  }
  if(chosen){
   results[id]={image:chosen,productPage:entry?.productPage||null};
   console.log('FOUND',id,chosen,entry?.productPage||'');
  } else {failures.push(id); console.log('MISSING',id)}
 }
}
await Promise.all(Array.from({length:5},worker));
console.log('SUMMARY',JSON.stringify({found:Object.keys(results).length,total:products.length,missing:failures.sort()}));
console.log('MANIFEST_JSON',JSON.stringify(results));
