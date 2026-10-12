'use strict';
// Refresh supplier's publicly listed prices as ADMIN-ONLY references.
// Never touches retail selling prices or confidential purchasing costs.
const {createClient}=require('@supabase/supabase-js');
const {pages,get,listCards,safeURL}=require('./scorpio_garden_parser.cjs');
(async()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Missing Supabase server credentials');
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const all=[];
 for(let i=0;i<pages.length;i++){
   const p=listCards(await get(pages[i]),i+1);all.push(...p);
   console.log('SCORPIO_PRICES_PAGE '+JSON.stringify({page:i+1,count:p.length,priced:p.filter(x=>x.nominal.length>0).length,samples:p.slice(0,3).map(x=>({name:x.name,amounts:x.nominal}))}));
 }
 const unique=[...new Map(all.map(x=>[x.url,x])).values()];
 const priced=unique.filter(x=>x.nominal.length>0);
 if(priced.length<65)throw Error('Refuse reference import: supplier price extraction too sparse ('+priced.length+'/'+unique.length+')');
 const {data:existing,error}=await db.from('vinyl_products').select('id,source');if(error)throw error;
 const byUrl=new Map(existing.filter(x=>safeURL(x.source)).map(x=>[safeURL(x.source),x]));
 const rows=priced.flatMap(x=>{const p=byUrl.get(x.url);return p?[{product_id:p.id,source:x.url,public_min_price:Math.min(...x.nominal),public_max_price:Math.max(...x.nominal),note:'Публично обявена цена на Scorpioplast — само за справка. Не е доставна или продажна цена.'}]:[]});
 let updated=0;
 for(let i=0;i<rows.length;i+=60){const batch=rows.slice(i,i+60);
  const r=await db.from('vinyl_supplier_reference').upsert(batch,{onConflict:'product_id'});if(r.error)throw r.error;updated+=batch.length;
 }
 console.log('SCORPIO_PRICES_RESULT '+JSON.stringify({listed:all.length,unique:unique.length,priced:priced.length,matched:rows.length,updated}));
})().catch(e=>{console.error('SCORPIO_PRICES_FATAL '+e.message);process.exitCode=1});
