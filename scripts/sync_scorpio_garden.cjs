'use strict';
// Idempotent one-time import of the three live Scorpioplast Home & Garden pages.
// Public supplier prices are NOT confidential procurement costs and NOT shop sale prices.
const {createClient}=require('@supabase/supabase-js');
const {pages,defs,safeURL,get,listCards,selectGroups,makeVariants}=require('./scorpio_garden_parser.cjs');
const placeholder='/assets/placeholder.svg';
const photoBucket='vinyl-product-images';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function uploadPhoto(db,p,id){
 if(!p.image)return 'missing';
 try{
   const response=await fetch(p.image,{headers:{'User-Agent':'Mozilla/5.0','Accept':'image/jpeg,image/webp,image/png'},signal:AbortSignal.timeout(18000)});
   if(!response.ok)throw Error('HTTP '+response.status);
   if(Number(response.headers.get('content-length'))>3*1024*1024)throw Error('over 3 MB');
   const b=Buffer.from(await response.arrayBuffer());
   if(b.length<350||b.length>3*1024*1024)throw Error('invalid size');
   let mime,ext;
   if(b[0]===255&&b[1]===216){mime='image/jpeg';ext='jpg'}
   else if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'){mime='image/webp';ext='webp'}
   else if(b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))){mime='image/png';ext='png'}
   else throw Error('unsupported image type');
   const path='scorpioplast/home-garden/'+id+'/main.'+ext;
   const up=await db.storage.from(photoBucket).upload(path,b,{contentType:mime,cacheControl:'31536000',upsert:true});
   if(up.error)throw up.error;
   const href=db.storage.from(photoBucket).getPublicUrl(path).data.publicUrl;
   const save=await db.from('vinyl_products').update({image:href}).eq('id',id).eq('image',placeholder);
   if(save.error)throw save.error;
   return 'ok';
 }catch(e){console.log('SCORPIO_GARDEN_PHOTO_ERROR '+JSON.stringify({id,error:e.message}));return 'failed'}
}
(async()=>{
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw Error('Missing Supabase service credentials');
 const db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const each=[];
 for(let i=0;i<pages.length;i++){
  const html=await get(pages[i]),rows=listCards(html,i+1);
  if(rows.length<25)throw Error('Expected at least 25 products on supplier page '+(i+1)+', got '+rows.length);
  each.push(rows);
  console.log('SCORPIO_GARDEN_SOURCE '+JSON.stringify({page:i+1,rows:rows.length,samples:rows.slice(0,2).map(p=>({name:p.name,url:p.url,price:p.nominal}))}));
 }
 const listed=each.flat(),all=[...new Map(listed.map(p=>[p.url,p])).values()];
 const {data:old,error:oe}=await db.from('vinyl_products').select('id,source,image,active').order('id');
 if(oe)throw oe;
 const oldMap=new Map(old.filter(p=>safeURL(p.source)).map(p=>[safeURL(p.source),p]));
 const cats=[...new Set(all.map(p=>p.category))].map((id,i)=>({id,name:defs[id][0],description:defs[id][1],icon:'',sort_order:11+i}));
 const c=await db.from('vinyl_categories').upsert(cats,{onConflict:'id',ignoreDuplicates:true});if(c.error)throw c.error;
 let id=Math.max(...old.map(p=>p.id))+1;
 const newItems=all.filter(p=>!oldMap.has(p.url)).map(p=>({p,item:{
   id:id++,category:p.category,name:p.name,description:'Продукт от раздел „Дом и градина“ на Scorpioplast. Наличността, точните характеристики и крайната продажна цена се потвърждават при запитване.',
   unit:'бр.',sale_price:null,manual_sale_price:true,active:!p.outofstock,source:p.url,
   image:placeholder,images:[],supplier_options:[],price_verification_needed:true
 }}));
 console.log('SCORPIO_GARDEN_PREPARED '+JSON.stringify({pageCounts:each.map(x=>x.length),listed:listed.length,unique:all.length,alreadyInShop:all.length-newItems.length,newToAdd:newItems.length,categories:cats.map(x=>x.name)}));
 let added=0,failed=0,referenced=0,photos=0,photoErrors=0,noImages=0,optionProducts=0,optionVariants=0,optionsMissing=0;
 for(let i=0;i<newItems.length;i+=15){
  const block=newItems.slice(i,i+15),resp=await db.from('vinyl_products').insert(block.map(o=>o.item)).select('id');
  if(resp.error){
    console.log('SCORPIO_GARDEN_BATCH_ERROR '+resp.error.message);
    for(const o of block){
      const one=await db.from('vinyl_products').insert(o.item).select('id').maybeSingle();
      if(one.error){failed++;console.log('SCORPIO_GARDEN_INSERT_ERROR '+JSON.stringify({name:o.p.name,error:one.error.message}))}
      else added++;
    }
  }else added+=resp.data.length;
 }
 const {data:current,error:se}=await db.from('vinyl_products').select('id,source,image,active').order('id');if(se)throw se;
 const bySource=new Map(current.filter(x=>safeURL(x.source)).map(x=>[safeURL(x.source),x]));
 const refs=[];
 for(const p of all){const row=bySource.get(p.url);
   if(row&&p.nominal.length)refs.push({product_id:row.id,public_min_price:Math.min(...p.nominal),public_max_price:Math.max(...p.nominal),source:p.url,note:'Публично обявена цена на Scorpioplast; не е доставна цена и не е продажна цена на този магазин.'});
 }
 for(let i=0;i<refs.length;i+=50){const z=await db.from('vinyl_supplier_reference').upsert(refs.slice(i,i+50),{onConflict:'product_id',ignoreDuplicates:true});if(z.error)console.log('SCORPIO_GARDEN_REFERENCE_ERROR '+z.error.message);else referenced+=Math.min(50,refs.length-i)}
 const newSources=new Set(newItems.map(x=>x.p.url));
 const variable=all.filter(p=>p.variable&&newSources.has(p.url));
 for(let i=0;i<variable.length;i+=5){
  await Promise.all(variable.slice(i,i+5).map(async p=>{
   const row=bySource.get(p.url);if(!row)return;
   try{
    const groups=selectGroups(await get(p.url));const opts=makeVariants(groups);
    if(!groups.length||opts===null||!opts.length){optionsMissing++;console.log('SCORPIO_GARDEN_OPTIONS_UNAVAILABLE '+JSON.stringify({id:row.id,name:p.name,count:groups.length}));return;}
    const update=await db.from('vinyl_products').update({supplier_options:groups}).eq('id',row.id).eq('source',p.url);
    if(update.error)throw update.error;
    const toAdd=opts.map(v=>({...v,product_id:row.id}));
    for(let j=0;j<toAdd.length;j+=60){
     const r=await db.from('vinyl_variants').upsert(toAdd.slice(j,j+60),{onConflict:'product_id,variant_key',ignoreDuplicates:true});
     if(r.error)throw r.error;
    }
    optionProducts++;optionVariants+=toAdd.length;
   }catch(e){optionsMissing++;console.log('SCORPIO_GARDEN_OPTIONS_ERROR '+JSON.stringify({id:row.id,error:e.message}))}
  }));
 }
 const imgs=all.filter(p=>p.image&&newSources.has(p.url)).map(p=>({p,row:bySource.get(p.url)})).filter(x=>x.row&&(!x.row.image||x.row.image===placeholder));
 for(let i=0;i<imgs.length;i+=5){await Promise.all(imgs.slice(i,i+5).map(async({p,row})=>{
   const status=await uploadPhoto(db,p,row.id);
   if(status==='ok')photos++;else if(status==='failed')photoErrors++;else noImages++;
 }));}
 const stats={pageCounts:each.map(x=>x.length),listed:listed.length,unique:all.length,alreadyPresent:all.length-newItems.length,added,failed,publicReferenceRows:referenced,variableProducts:variable.length,optionProducts,optionVariants,optionsMissing,imagesUploaded:photos,photoErrors,noImages};
 console.log('SCORPIO_GARDEN_IMPORT_RESULT '+JSON.stringify(stats));
 if(added!==newItems.length)throw Error('Import incomplete: '+JSON.stringify(stats));
})().catch(e=>{console.error('SCORPIO_GARDEN_IMPORT_FATAL '+e.stack);process.exitCode=1});
