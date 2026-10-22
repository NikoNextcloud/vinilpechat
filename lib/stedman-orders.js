'use strict';
const crypto=require('node:crypto');
const {quote,inputError}=require('./stedman-pricing');
const prices=require('./stedman-price-store');
const BUCKET='vinyl-shirt-artwork';
const FILE_LIMIT=1500*1024;
const FORMATS={'image/png':{ext:'png',valid:b=>b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))},
 'image/jpeg':{ext:'jpg',valid:b=>b[0]===255&&b[1]===216&&b[2]===255},
 'image/webp':{ext:'webp',valid:b=>b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP'}};
function decode(file){
 if(!file||typeof file!=='object')throw inputError('Липсва файл за щампата');
 const fmt=FORMATS[file.mime];
 if(!fmt||typeof file.base64!=='string'||file.base64.length>2100000||!/^[a-zA-Z0-9+/]+={0,2}$/.test(file.base64))
  throw inputError('Разрешени са JPG, PNG и WebP изображения до 1,5 MB');
 const bytes=Buffer.from(file.base64,'base64');
 if(bytes.length<16||bytes.length>FILE_LIMIT||!fmt.valid(bytes))throw inputError('Невалидно изображение за щампата');
 return {bytes,mime:file.mime,ext:fmt.ext};
}
function normalizedContact(d){
 const name=String(d.name||'').trim(),phone=String(d.phone||'').trim(),
  email=String(d.email||'').trim(),notes=String(d.notes||'').trim();
 if(name.length<2||name.length>120||phone.length<6||phone.length>40||!/^[+0-9()\s-]+$/.test(phone))
   throw inputError('Въведете име и валиден телефон за връзка');
 if(email&&(email.length>255||!/^\S+@\S+\.\S+$/.test(email)))throw inputError('Невалиден имейл');
 if(notes.length>1200)throw inputError('Бележките са твърде дълги');
 if(d.website)throw inputError('Невалидна заявка');
 return {name,phone,email,notes};
}
async function ensureBucket(db){
 const bucket=await db.storage.getBucket(BUCKET);
 if(!bucket.error){
  if(bucket.data?.public)throw Object.assign(new Error('Хранилището за файлове трябва да е частно'),{status:503});
  return;
 }
 // An authorized service-role backend initializes the private bucket once.
 const made=await db.storage.createBucket(BUCKET,{public:false,fileSizeLimit:'2MB',
  allowedMimeTypes:Object.keys(FORMATS)});
 if(made.error&&!/already exists|duplicate/i.test(made.error.message||'')){
  throw Object.assign(new Error('Частното хранилище за печат не е настроено'),{status:503});
 }
}
async function saveShirtOrder(db,d){
 const q=quote(d,await prices.loadOverrides(db)),customer=normalizedContact(d);
 if(d.consent!==true)throw inputError('Необходимо е съгласие за обработване на данните по заявката');
 const requested=[];
 for(const side of ['front','back']){
  if(q.prints[side]){
   const file=decode(d.prints?.[side]?.file);
   requested.push({side,...file});
  }else if(d.prints?.[side]?.file)throw inputError('Файл без избрана щампа');
 }
 const id='T'+Date.now().toString(36).toUpperCase()+crypto.randomBytes(4).toString('hex').toUpperCase();
 const uploaded=[];
 if(requested.length)await ensureBucket(db);
 try{
  for(const image of requested){
    const key='orders/'+id+'/'+image.side+'-'+crypto.randomUUID()+'.'+image.ext;
    const result=await db.storage.from(BUCKET).upload(key,image.bytes,{contentType:image.mime,upsert:false,cacheControl:'0'});
    if(result.error)throw Object.assign(new Error('Неуспешно записване на щампата'),{status:503});
    uploaded.push({side:image.side,key,mime:image.mime});
  }
  const artwork=Object.fromEntries(uploaded.map(({side,key,mime})=>[side,{key,mime,position:q.prints[side]}]));
  const items=q.lines.map(line=>({
    type:'stedman-print',model_id:q.model_id,name:q.name,
    variant:q.color_name+' / '+line.size,quantity:line.quantity,unit:'бр.',price:line.unitPrice,
    shirt_size:line.size,shirt_color:q.color_code,shirt_shade:q.shade_code,shirt_print_mode:q.printMode,shirt_prints:q.prints,
    shirt_artwork:artwork
  }));
  const note='Тениски Stedman '+q.model_id+'; '+q.color_name+'; '+q.quantity+' бр.; '+(q.printMode==='both'?'печат отпред и отзад (+6 €/бр.)':'печат отпред (+3 €/бр.)')+'; '+
    (artwork.front?'щампа отпред; ':'')+(artwork.back?'щампа отзад; ':'')+customer.notes;
  const result=await db.from('vinyl_orders').insert({id,kind:'order',status:'new',
     customer_name:customer.name,phone:customer.phone,email:customer.email,
     message:note,items,estimated_total:q.total});
  if(result.error)throw Object.assign(new Error('Неуспешно записване на заявката'),{status:503});
  return {ok:true,order_id:id,quote:q,filesSaved:uploaded.length};
 }catch(error){
  if(uploaded.length){try{await db.storage.from(BUCKET).remove(uploaded.map(x=>x.key))}catch{}}
  throw error;
 }
}
async function signedFiles(db,id){
 const record=await db.from('vinyl_orders').select('id,items').eq('id',id).maybeSingle();
 if(record.error)throw Object.assign(new Error('Заявката не може да се отвори'),{status:500});
 if(!record.data)throw Object.assign(new Error('Заявката не е намерена'),{status:404});
 const fileEntries=record.data.items?.find(item=>item.type==='stedman-print')?.shirt_artwork||{};
 const result={order_id:id,files:{}};
 for(const side of ['front','back']){
  const entry=fileEntries[side];
  if(!entry)continue;
  if(!entry.key?.startsWith('orders/'+id+'/'+side+'-'))continue;
  const signed=await db.storage.from(BUCKET).createSignedUrl(entry.key,600);
  if(signed.error)throw Object.assign(new Error('Файлът не може да се отвори'),{status:503});
  result.files[side]={url:signed.data.signedUrl,position:entry.position,mime:entry.mime,expires_in:600};
 }
 return result;
}
module.exports={saveShirtOrder,signedFiles,normalizedContact,decode,ensureBucket,BUCKET};
