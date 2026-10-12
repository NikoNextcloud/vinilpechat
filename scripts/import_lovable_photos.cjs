'use strict';
// Import product gallery photos from the supplier into this shop's Supabase Storage.
// Runs at Vercel production build time. It NEVER overwrites an administrator's own uploaded photo.
const {readFileSync}=require('node:fs');
const {createClient}=require('@supabase/supabase-js');
const items=JSON.parse(readFileSync('data/seed.json','utf8')).products;
const hostnames=['www.vipborsa.com','vipborsa.com'];
const validSource=url=>{try{const u=new URL(url);return u.protocol==='https:'&&hostnames.includes(u.hostname)&&u.pathname.startsWith('/image/')&&/\.(?:jpe?g|png|webp)$/i.test(u.pathname)}catch{return false}};
async function supplierGallery(product){
  try{
    const u=new URL(product.source);
    if(u.protocol!=='https:'||!hostnames.includes(u.hostname)||u.pathname!=='/index.php'||u.searchParams.get('route')!=='product/product')return [];
    const r=await fetch(u.href,{headers:{'User-Agent':'Mozilla/5.0 (compatible; VinylCatalogImport/1.0)','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const html=await r.text();
    const thumbTags=html.match(/<a\b[^>]*class\s*=\s*(?:"[^"]*thumbnail[^"]*"|'[^']*thumbnail[^']*')[^>]*>/gi)||[];
    const list=[];
    for(const tag of thumbTags){
      const match=tag.match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if(!match)continue;
      const link=new URL(match[1].replaceAll('&amp;','&'),u.href).href;
      if(validSource(link)&&!list.includes(link))list.push(link);
    }
    if(!list.length){
      const og=html.match(/<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i);
      if(og){const link=new URL(og[1].replaceAll('&amp;','&'),u.href).href;if(validSource(link))list.push(link);}
    }
    if(!list.length)console.log('No gallery pictures found for product',product.id);
    return list.slice(0,8);
  }catch(e){console.log('Supplier page unavailable for product',product.id,':',e.message);return []}
}
const isImage=(b)=>b.length>=300&&(b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))?'image/png':b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'?'image/webp':null);
const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
let downloaded=0,uploaded=0,failed=0,updated=0,skipped=0;
async function download(url){
  for(let attempt=0;attempt<2;attempt++){
    try{
      const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (VinylAndBrezentiCatalogImporter/1.0)','Accept':'image/avif,image/webp,image/png,image/jpeg,image/*;q=0.8'},signal:AbortSignal.timeout(18000),redirect:'follow'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      if(Number(response.headers.get('content-length'))>3*1024*1024)throw new Error('over 3 MB');
      const bytes=Buffer.from(await response.arrayBuffer());const mime=isImage(bytes);
      if(!mime||bytes.length>3*1024*1024)throw new Error('invalid photo');
      return {bytes,mime};
    }catch(e){if(attempt===1){failed++;console.log('photo unavailable:',new URL(url).pathname,e.message);return null}await new Promise(r=>setTimeout(r,650))}
  }
}
async function main(){
  if(!process.env.SUPABASE_URL||!process.env.SUPABASE_SERVICE_ROLE_KEY){console.log('Photo import skipped: Supabase production credentials unavailable');return}
  const db=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:stored,error:err}=await db.from('vinyl_products').select('id,image');
  if(err)throw new Error('Cannot inspect image state: '+err.message);
  const current=new Map(stored.map(p=>[p.id,p]));
  async function importOne(p){
    const prior=current.get(p.id);
    if(!prior){skipped++;return}
    if(prior.image&&!prior.image.includes('placeholder')&&!prior.image.includes('id-preview--')){skipped++;return}
    const links=await supplierGallery(p);
    const urls=[];
    for(let i=0;i<links.length;i++){
      const payload=await download(links[i]);
      if(!payload)continue;
      downloaded++;
      const key='supplier/'+String(p.id).padStart(2,'0')+'/'+(i+1)+'.'+ext[payload.mime];
      const {error}=await db.storage.from('vinyl-product-images').upload(key,payload.bytes,{contentType:payload.mime,cacheControl:'31536000',upsert:true});
      if(error){failed++;console.log('Storage upload failed for product',p.id,':',error.message);continue}
      uploaded++;
      urls.push(db.storage.from('vinyl-product-images').getPublicUrl(key).data.publicUrl);
    }
    if(urls.length){
      const {data:changed,error}=await db.from('vinyl_products').update({image:urls[0],images:urls.slice(1)}).eq('id',p.id).eq('image',prior.image).select('id');
      if(error)console.log('Database image update failed for product',p.id,':',error.message);
      else updated+=(changed||[]).length;
    }
  }
  // Keep concurrency low to respect the original host and storage API.
  for(let i=0;i<items.length;i+=4)await Promise.all(items.slice(i,i+4).map(importOne));
  console.log('SUPPLIER_PHOTO_IMPORT_RESULT '+JSON.stringify({products:items.length,downloaded,uploaded,updated,failed,skipped}));
}
main().catch(err=>{console.error('Photo import failed safely:',err.message);process.exitCode=1});
