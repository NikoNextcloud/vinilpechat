'use strict';
// Copies Scorpioplast public product preview photos to shop-owned Supabase Storage.
// Never overwrites photographs manually uploaded by the shop administrator.
const {createClient}=require('@supabase/supabase-js');
const url=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket='vinyl-product-images';
const allowedHosts=new Set(['scorpioplast.com','www.scorpioplast.com']);
const fallback='/assets/placeholder.svg';
const headers={'User-Agent':'Mozilla/5.0 (compatible; VinylCatalogMedia/1.0)','Accept':'text/html,application/xhtml+xml,*/*'};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const decode=x=>String(x||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#039;|&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const attr=(html,key)=>{const m=html.match(new RegExp('\\b'+key+'\\s*=\\s*["\\x27]([^"\\x27]+)["\\x27]','i'));return m?decode(m[1]):''};
function imagesFromPage(html,base){
 const list=[];
 const meta=html.match(/<meta\b[^>]*>/gi)||[];
 for(const m of meta){
   const prop=attr(m,'property')||attr(m,'name');
   if(['og:image','og:image:secure_url','twitter:image'].includes(prop)){
     const c=attr(m,'content');if(c)list.push(c);
   }
 }
 for(const img of html.match(/<img\b[^>]*>/gi)||[]){
   if(/wp-post-image|woocommerce-product-gallery__image/i.test(img)){
     for(const field of ['data-large_image','data-src','src']){const s=attr(img,field);if(s)list.push(s);}
   }
 }
 const urls=[];
 for(const candidate of list){
   try{
     const u=new URL(candidate,base);
     if(u.protocol!=='https:'||!allowedHosts.has(u.hostname)||!u.pathname.includes('/wp-content/uploads/'))continue;
     u.hash='';u.search='';
     if(!urls.includes(u.href))urls.push(u.href);
   }catch{}
 }
 return urls.slice(0,4);
}
function imageType(bytes){
 if(bytes.length<400||bytes.length>3*1024*1024)return null;
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return ['image/jpeg','jpg'];
 if(bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return ['image/png','png'];
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return ['image/webp','webp'];
 return null;
}
async function fetchWithTimeout(address,opts={}){
 return fetch(address,{...opts,signal:AbortSignal.timeout(14000),redirect:'follow'});
}
async function main(){
 if(!url||!secret){console.log('SCORPIO_IMAGES skipped; Supabase credentials missing');return;}
 const db=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data, error}=await db.from('vinyl_products').select('id,source,image').gte('id',41).lte('id',60).eq('active',true).order('id');
 if(error)throw error;
 let uploaded=0,failed=0,skipped=0,attempted=0;
 async function one(p){
  if(!p.image||!(p.image===fallback||p.image.includes('placeholder.svg'))){skipped++;return;}
  try{
   const site=new URL(p.source);
   if(site.protocol!=='https:'||!allowedHosts.has(site.hostname))throw Error('Untrusted site hostname');
   attempted++;
   const page=await fetchWithTimeout(site.href,{headers});
   if(!page.ok)throw Error('Supplier page HTTP '+page.status);
   const html=await page.text(),media=imagesFromPage(html,site.href);
   if(!media.length)throw Error('No supplier product image found');
   let payload=null,mime=null,ext=null;
   for(const photo of media){
    try{
     const res=await fetchWithTimeout(photo,{headers:{'User-Agent':headers['User-Agent'],'Accept':'image/*'}});
     if(!res.ok||Number(res.headers.get('content-length'))>3*1024*1024)continue;
     const bytes=Buffer.from(await res.arrayBuffer());
     const type=imageType(bytes);if(!type)continue;
     payload=bytes;[mime,ext]=type;break;
    }catch{}
   }
   if(!payload)throw Error('Photo inaccessible or too large');
   const fileName='scorpioplast/'+p.id+'/main.'+ext;
   const up=await db.storage.from(bucket).upload(fileName,payload,{contentType:mime,cacheControl:'31536000',upsert:true});
   if(up.error)throw Error('Storage: '+up.error.message);
   const photoUrl=db.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
   const save=await db.from('vinyl_products').update({image:photoUrl}).eq('id',p.id).eq('image',p.image).select('id');
   if(save.error)throw Error(save.error.message);
   uploaded+=(save.data||[]).length;
  }catch(e){failed++;console.log('SCORPIO_IMAGE_UNAVAILABLE '+JSON.stringify({id:p.id,error:e.message}));}
 }
 for(let i=0;i<data.length;i+=4){await Promise.all(data.slice(i,i+4).map(one));await sleep(180);}
 console.log('SCORPIO_IMAGES_RESULT '+JSON.stringify({products:data.length,attempted,uploaded,failed,skipped}));
}
main().catch(e=>{console.error('SCORPIO_IMAGES_FATAL',e.message);process.exitCode=1});
