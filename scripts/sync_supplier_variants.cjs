'use strict';
// One-time supplier choice and live price sync from VIP Borsa.
// Preserves existing manually edited retail variant prices.
const {createClient}=require('@supabase/supabase-js');
const BASE='https://www.vipborsa.com/';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const clean=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim();
const reqHeaders={'User-Agent':'Mozilla/5.0 (compatible; VinylCatalogVariants/1.0)','Accept':'text/html,application/xhtml+xml'};
const validSource=url=>{try{const u=new URL(url);return u.protocol==='https:'&&['vipborsa.com','www.vipborsa.com'].includes(u.hostname)&&u.pathname==='/index.php'&&u.searchParams.get('route')==='product/product'&&/^\d+$/.test(u.searchParams.get('product_id')||'')}catch{return false}};
const money=n=>Math.round(Number(n)*100)/100;
const idRe=/\bname\s*=\s*["'](option\[\d+\])["']/i;
function parseGroups(html){
 const groups=[];
 for(const m of html.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>/gi)){
  const tag=m[0],match=tag.match(idRe);if(!match)continue;
  const key=match[1],optionID=key.match(/\d+/)[0];
  const lab=new RegExp('<label\\b[^>]*for\\s*=\\s*["\\x27]input-option'+optionID+'["\\x27][^>]*>([\\s\\S]*?)<\\/label>','i').exec(html);
  const values=Array.from(tag.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi))
   .map(o=>({id:(o[1].match(/\bvalue\s*=\s*["']([^"']*)["']/i)||[])[1]||'',text:clean(o[2])}))
   .filter(x=>x.id&&x.text&&!/^---/.test(x.text)).slice(0,200);
  if(values.length&&!groups.some(g=>g.id===key))groups.push({id:key,label:clean(lab?.[1]||'Вариант'),required:true,type:'select',values});
 }
 return groups;
}
function combinations(groups,max=240){
 if(!groups.length)return [];
 let rows=[{choices:{},labels:[],ids:[]}];
 for(const group of groups){
  const next=[];
  for(const a of rows)for(const v of group.values){
   next.push({choices:{...a.choices,[group.id]:v.id},labels:[...a.labels,group.label+': '+v.text],ids:[...a.ids,group.id+'='+v.id]});
   if(next.length>max)return null;
  }
  rows=next;
 }
 return rows.map(x=>({key:x.ids.join('&'),label:x.labels.join(' | '),choices:x.choices}));
}
async function supplierPrice(product,entry,cookie){
 const u=new URL('index.php?route=checkout/cart/getOPrice',BASE);
 const body=new URLSearchParams({product_id:String(new URL(product.source).searchParams.get('product_id')),quantity:'1',...entry.choices});
 for(let i=0;i<2;i++){
  try{
   const r=await fetch(u.href,{method:'POST',headers:{'User-Agent':'Mozilla/5.0','Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'application/json','X-Requested-With':'XMLHttpRequest','Referer':product.source,...(cookie?{'Cookie':cookie}:{})},body:body.toString(),signal:AbortSignal.timeout(18000)});
   if(!r.ok)throw new Error('HTTP '+r.status);
   const json=await r.json();
   const p=Number(json.pprice);
   if(!Number.isFinite(p)||p<=0||p>1e7)throw new Error('Invalid dynamic price');
   return money(p);
  }catch(e){if(i===1)return null;await wait(350)}
 }
}
async function main(){
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Supabase production server credentials required');
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:products,error:pe}=await db.from('vinyl_products').select('id,name,source,supplier_options,sale_price').order('id');
 if(pe)throw pe;
 let totalProducts=0,optionProducts=0,variants=0,priced=0,errors=0,empty=0,capped=0;
 for(const product of products){
  totalProducts++;
  if(!validSource(product.source)){console.log('VARIANT_SYNC_SKIPPED '+product.id+' invalid url');continue}
  try{
   const r=await fetch(product.source,{headers:reqHeaders,signal:AbortSignal.timeout(20000)});
   if(!r.ok)throw new Error('supplier product HTTP '+r.status);
   const html=await r.text(),cookie=(r.headers.get('set-cookie')||'').split(';')[0];
   const groups=parseGroups(html);
   if(!groups.length){empty++;console.log('VARIANT_SYNC_PRODUCT '+JSON.stringify({id:product.id,groups:0,choices:0,prices:0}));continue}
   const all=combinations(groups);
   if(!all){capped++;console.log('VARIANT_SYNC_PRODUCT '+JSON.stringify({id:product.id,groups:groups.length,error:'more than 240 combinations; manual review needed'}));continue}
   const prevOpts=Array.isArray(product.supplier_options)?product.supplier_options:[];
   const safeGroups=groups.map(g=>({...g,values:g.values.map(v=>({id:v.id,text:v.text}))}));
   // Keep custom fields added in the admin, but refresh exact supplier option labels.
   const {error:ue}=await db.from('vinyl_products').update({supplier_options:safeGroups}).eq('id',product.id);
   if(ue)throw ue;
   optionProducts++;
   const {data:oldRows,error:oe}=await db.from('vinyl_variants').select('variant_key,sale_price,active,price_verification_needed').eq('product_id',product.id);
   if(oe)throw oe;
   const existing=new Map(oldRows.map(x=>[x.variant_key,x]));

   // All supplier combinations use the fixed EUR 20 retail addition.
   const rows=[],batchSize=4;
   for(let i=0;i<all.length;i+=batchSize){
    const batch=all.slice(i,i+batchSize);
    const values=await Promise.all(batch.map(async e=>({entry:e,price:await supplierPrice(product,e,cookie)})));
    for(const {entry,price} of values){
     const old=existing.get(entry.key);
     const retail=price==null?null:money(price+20);
     rows.push({product_id:product.id,variant_key:entry.key,label:entry.label,choices:entry.choices,
       supplier_price:price,sale_price:retail,active:old?old.active:true,
       price_verification_needed:old?old.price_verification_needed:true,synced_at:new Date().toISOString()});
     if(price!=null)priced++;
    }
    await wait(70);
   }
   for(let i=0;i<rows.length;i+=80){
    const {error}=await db.from('vinyl_variants').upsert(rows.slice(i,i+80),{onConflict:'product_id,variant_key'});
    if(error)throw error;
   }
   variants+=rows.length;
   console.log('VARIANT_SYNC_PRODUCT '+JSON.stringify({id:product.id,name:product.name.slice(0,60),groups:groups.map(g=>({name:g.label,count:g.values.length})),choices:rows.length,prices:rows.filter(x=>x.supplier_price!=null).length,retailDrafts:rows.filter(x=>x.sale_price!=null).length}));
  }catch(e){errors++;console.log('VARIANT_SYNC_ERROR '+JSON.stringify({id:product.id,error:e.message}))}
  await wait(140);
 }
 console.log('VARIANT_SYNC_RESULT '+JSON.stringify({totalProducts,optionProducts,variants,priced,noOptions:empty,capped,errors}));
 if(errors>0)process.exitCode=1;
}
main().catch(e=>{console.error('VARIANT_SYNC_FATAL',e.message);process.exitCode=1});
