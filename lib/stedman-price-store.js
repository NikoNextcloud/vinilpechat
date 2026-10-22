'use strict';
// Server-only Stedman price overrides. Kept in private Supabase Storage so an
// existing Vinilpechat installation can use the editor without a schema change.
const catalog=require('../data/stedman-catalog.json');
const BUCKET='vinyl-stedman-price-settings';
const OBJECT='prices.json';
const MAX_PRICE=100000;
const known=new Map();
const priceError=message=>Object.assign(new Error(message),{status:400});
const storeError=message=>Object.assign(new Error(message),{status:503});
const keyOf=(model,band,group)=>JSON.stringify([model,band,group]);
const cents=value=>Math.round(Number(value)*100);
for(const model of catalog)for(const band of model.groups){
 for(const [group,cost] of Object.entries(band)){
  if(group==='label'||typeof cost!=='number')continue;
  const key=keyOf(model.id,band.label,group);
  known.set(key,{model_id:model.id,size_band:band.label,color_group:group,
   supplier_price:Math.round(cost*100)/100,sale_price:Math.round(cost*200)/100});
 }
}
function checkedPrice(value,label){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>MAX_PRICE||
    Math.abs(value*100-Math.round(value*100))>1e-6)throw priceError('Невалидна '+label+' цена (0–100 000 €, до два знака)');
 return cents(value)/100;
}
function normalizeRow(row){
 if(!row||typeof row!=='object'||Array.isArray(row))throw priceError('Невалиден ценови ред');
 const key=keyOf(row.model_id,row.size_band,row.color_group),base=known.get(key);
 if(!base)throw priceError('Невалиден модел, размер или цветова група');
 return {...base,supplier_price:checkedPrice(row.supplier_price,'доставна'),
  sale_price:checkedPrice(row.sale_price,'продажна')};
}
function isMissing(error){
 const status=String(error?.statusCode??error?.status??'');
 const message=String(error?.message||'').toLowerCase();
 return status==='404'||/bucket not found|object not found|resource was not found|not found/.test(message);
}
async function loadOverrides(db){
 if(!db||!db.storage)throw storeError('Цените не са достъпни');
 let response;
 try{response=await db.storage.from(BUCKET).download(OBJECT)}
 catch{throw storeError('Неуспешно свързване с хранилището за цени');}
 if(response.error){
  if(isMissing(response.error))return new Map();
  throw storeError('Неуспешно прочитане на цените: '+response.error.message);
 }
 let payload;
 try{const data=await response.data.text();payload=JSON.parse(data)}
 catch{throw storeError('Повреден файл с цените на облеклото');}
 if(payload?.version!==1||!Array.isArray(payload.rows)||payload.rows.length>known.size)
  throw storeError('Невалиден файл с цените на облеклото');
 const out=new Map();
 try{
  for(const raw of payload.rows){const row=normalizeRow(raw),key=keyOf(row.model_id,row.size_band,row.color_group);
   if(out.has(key))throw priceError('Повторена ценова позиция');
   out.set(key,row);
  }
 }catch{throw storeError('Некоректни запазени цени на облеклото');}
 return out;
}
function modelRows(overrides){
 const byModel=new Map();
 for(const m of catalog)byModel.set(m.id,{id:m.id,name:m.bg,gender:m.gender,rows:[]});
 for(const base of known.values())byModel.get(base.model_id).rows.push({
  ...base,...(overrides.get(keyOf(base.model_id,base.size_band,base.color_group))||{})
 });
 return [...byModel.values()];
}
function publicPrices(overrides){
 return [...overrides.values()].map(r=>({model_id:r.model_id,size_band:r.size_band,
  color_group:r.color_group,sale_price:r.sale_price}));
}
async function ensurePrivateBucket(db){
 const existing=await db.storage.getBucket(BUCKET);
 if(!existing.error){
  if(existing.data?.public)throw storeError('Ценовото хранилище не е частно');
  return;
 }
 if(!isMissing(existing.error))throw storeError('Не може да се провери хранилището за цени');
 const made=await db.storage.createBucket(BUCKET,{public:false,fileSizeLimit:'512KB',allowedMimeTypes:['application/json']});
 if(made.error&&!/already exists|duplicate/i.test(made.error.message||''))
  throw storeError('Не може да се създаде частно хранилище за цени');
}
async function saveOverrides(db,submitted){
 if(!Array.isArray(submitted)||!submitted.length||submitted.length>known.size)
  throw priceError('Избери валидни ценови редове');
 const changes=new Map();
 for(const raw of submitted){const row=normalizeRow(raw),key=keyOf(row.model_id,row.size_band,row.color_group);
  if(changes.has(key))throw priceError('Повторена ценова позиция');
  changes.set(key,row);
 }
 const overrides=await loadOverrides(db);
 for(const [key,row] of changes){
  const base=known.get(key);
  if(base.supplier_price===row.supplier_price&&base.sale_price===row.sale_price)overrides.delete(key);
  else overrides.set(key,row);
 }
 await ensurePrivateBucket(db);
 const contents=Buffer.from(JSON.stringify({version:1,rows:[...overrides.values()]}),'utf8');
 if(contents.length>512*1024)throw priceError('Файлът с цените е твърде голям');
 const stored=await db.storage.from(BUCKET).upload(OBJECT,contents,{upsert:true,contentType:'application/json',cacheControl:'0'});
 if(stored.error)throw storeError('Цените не бяха записани в Supabase: '+stored.error.message);
 return {ok:true,updated:changes.size};
}
module.exports={BUCKET,OBJECT,known,keyOf,modelRows,publicPrices,normalizeRow,loadOverrides,saveOverrides};
