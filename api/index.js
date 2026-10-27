'use strict';
// Vercel Node function. All database privileges and costs stay on the server.
const { createClient } = require('@supabase/supabase-js');
const crypto = require('node:crypto');
const {designQuote}=require('../lib/design-pricing.js');
const seo=require('../lib/seo-pages.js');
const shirtPage=require('../lib/stedman-page.js');
const shirts=require('../lib/stedman-pricing.js');
const shirtOrders=require('../lib/stedman-orders.js');
const shirtPrices=require('../lib/stedman-price-store.js');
const MAX_BODY = 5 * 1024 * 1024;
const json = (res,status,obj) => {res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.status(status).json(obj);};
const msg = (res,status,message) => json(res,status,{error:message});
const env = (key) => {const value=process.env[key];if(!value || value.includes('YOUR-PROJECT') || value.includes('SERVER-ONLY') || value.startsWith('REPLACE-'))throw Object.assign(new Error('Не е настроен '+key),{status:503});return value;};
function clients(){const url=env('SUPABASE_URL');const anon=createClient(url,env('SUPABASE_ANON_KEY'),{auth:{autoRefreshToken:false,persistSession:false}});const privileged=process.env.SUPABASE_SERVICE_ROLE_KEY;return { db:privileged?createClient(url,privileged,{auth:{autoRefreshToken:false,persistSession:false}}):anon, auth:anon, privileged:!!privileged };}
function parseCookie(req,key){const text=req.headers.cookie||'';const needle=text.split(';').map(s=>s.trim()).find(s=>s.startsWith(key+'='));return needle?needle.substring(key.length+1):'';}
function sessionCsrf(token){return crypto.createHmac('sha256',env('SESSION_SECRET')).update(token).digest('hex');}
function cookie(req,value,clear=false){let isSecure=(req.headers['x-forwarded-proto']||'https').split(',')[0].trim()==='https';return 'vinyl_auth='+encodeURIComponent(value||'')+'; HttpOnly; SameSite=Strict; Path=/; '+(isSecure?'Secure; ':'')+'Max-Age='+(clear?0:3500);}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return false;try{const host=req.headers['x-forwarded-host']||req.headers.host;return !!host&&new URL(origin).host.toLowerCase()===String(host).toLowerCase()&&new URL(origin).protocol==='https:'}catch{return false}}
function price(value){if(value===undefined||value===null||value==='')return null;const n=Number(value);if(!Number.isFinite(n)||n<0||n>1e8)throw Object.assign(new Error('Невалидна цена'),{status:400});return Math.round(n*100)/100;}
function str(v,max=400){return String(v??'').trim().slice(0,max);}
function bad(data,loc){if(data.error)throw Object.assign(new Error('Грешка в базата ('+loc+'): '+data.error.message),{status:500});return data.data;}
async function admin(req,db,auth,res,csrf=false){let token=parseCookie(req,'vinyl_auth');if(!token){msg(res,401,'Необходим е вход като администратор');return null;}const userData=await auth.auth.getUser(token);const u=userData?.data?.user;const allow=str(process.env.ADMIN_EMAIL||'',254).toLowerCase();if(!u || !allow || u.email?.toLowerCase()!==allow || !u.email_confirmed_at){msg(res,401,'Невалиден или неразрешен администратор');return null;}if(csrf && (!sameOrigin(req)||req.headers['x-csrf-token']!==sessionCsrf(token))){msg(res,403,'Невалидна защита на заявката');return null;}return {u,token};}
async function body(req){let d=req.body;if(typeof d==='string'){if(Buffer.byteLength(d,'utf8')>MAX_BODY)throw Object.assign(new Error('Твърде голяма заявка'),{status:413});d=JSON.parse(d);}if(!d||typeof d!=='object'||Array.isArray(d))throw Object.assign(new Error('Невалидни данни'),{status:400});return d;}
const publicColumns='id,category,name,description,sale_price,unit,active,source,image,images,supplier_options,price_verification_needed';
async function catalog(db){const [pp,cc,ss,vv]=await Promise.all([
    db.from('vinyl_products').select(publicColumns).eq('active',true).order('id'),
    db.from('vinyl_categories').select('id,name,description,icon').order('sort_order'),
    db.from('vinyl_settings').select('brand,company,phone,email,address,shipping,privacy').eq('id',1).single(),
    db.from('vinyl_variants').select('product_id,variant_key,label,choices,sale_price,active,price_verification_needed').eq('active',true).order('variant_key')
]);
const variantsByProduct=new Map();for(const v of bad(vv,'variants')){if(!variantsByProduct.has(v.product_id))variantsByProduct.set(v.product_id,[]);variantsByProduct.get(v.product_id).push({...v,key:v.variant_key})}
return {products:bad(pp,'products').map(p=>({...p,variants:variantsByProduct.get(p.id)||[]})),categories:bad(cc,'categories'),settings:bad(ss,'settings')};}
async function adminData(db){const [pp,cc,ss,orders,costs,vv,reference]=await Promise.all([
    db.from('vinyl_products').select('*').order('id'),db.from('vinyl_categories').select('*').order('sort_order'),
    db.from('vinyl_settings').select('*').eq('id',1).single(),
    db.from('vinyl_orders').select('*').order('created_at',{ascending:false}).limit(500),
    db.from('vinyl_costs').select('product_id,supplier_price'),
    db.from('vinyl_variants').select('*').order('product_id').order('variant_key'),
    db.from('vinyl_supplier_reference').select('product_id,public_min_price,public_max_price,recorded_at,note')
]);const costsById=new Map(bad(costs,'costs').map(x=>[x.product_id,x.supplier_price]));const publicSupplierById=new Map(bad(reference,'supplier reference').map(x=>[x.product_id,x]));const byProduct=new Map();for(const v of bad(vv,'admin variants')){if(!byProduct.has(v.product_id))byProduct.set(v.product_id,[]);byProduct.get(v.product_id).push({...v,key:v.variant_key})}
return {products:bad(pp,'admin products').map(x=>({...x,supplier_price:costsById.get(x.id)??null,public_supplier_reference:publicSupplierById.get(x.id)||null,variants:byProduct.get(x.id)||[]})),categories:bad(cc,'categories'),settings:bad(ss,'settings'),orders:bad(orders,'orders')};}
async function saveProducts(db,data){
 if(!Array.isArray(data.products)||data.products.length>3000)throw Object.assign(new Error('Невалиден списък с продукти'),{status:400});
 const ids=data.products.map(x=>Number(x.id));
 if(ids.some(x=>!Number.isInteger(x)||x<=0)||new Set(ids).size!==ids.length)throw Object.assign(new Error('Дублиран/невалиден ID'),{status:400});
 const products=data.products.map(p=>({
   id:Number(p.id),name:str(p.name,250),description:str(p.description,6000),
   category:str(p.category,80),unit:str(p.unit,20),sale_price:price(p.sale_price),
   manual_sale_price:p.manual_sale_price===true,active:!!p.active
   // Supplier option groups, source links and product images are maintained separately.
 }));
 if(products.some(x=>!x.name||!x.category))throw Object.assign(new Error('Има продукт без име/категория'),{status:400});
 const exists=bad(await db.from('vinyl_products').select('id').in('id',ids),'validate products');
 if(exists.length!==ids.length)throw Object.assign(new Error('Непознат продукт'),{status:400});
 // Write supplier costs FIRST: the supplier-cost trigger recalculates only automatic prices.
 const costs=data.products.filter(p=>Object.hasOwn(p,'supplier_price'));
 for(let i=0;i<costs.length;i+=10){
   await Promise.all(costs.slice(i,i+10).map(async p=>bad(
     await db.from('vinyl_costs').upsert({product_id:Number(p.id),supplier_price:price(p.supplier_price)},{onConflict:'product_id'}),
     'save supplier price')));
 }
 // Save manual overrides AFTER cost edits so a manual retail amount always wins.
 for(let i=0;i<products.length;i+=10){
   await Promise.all(products.slice(i,i+10).map(async p=>{
     const {id,...changes}=p;
     bad(await db.from('vinyl_products').update(changes).eq('id',id),'save product');
   }));
 }
 if(data.settings&&typeof data.settings==='object'){
   let settings={};for(const k of ['brand','company','phone','email','address','shipping','privacy'])
     if(Object.hasOwn(data.settings,k))settings[k]=str(data.settings[k],['privacy','shipping'].includes(k)?6000:350);
   if(Object.keys(settings).length)bad(await db.from('vinyl_settings').update(settings).eq('id',1),'settings');
 }
 return {ok:true};
}
async function orders(db,d){const kind=d.kind==='contact'?'contact':'order';const customer_name=str(d.name,120),phone=str(d.phone,40),email=str(d.email,255),message=str(d.message,3000);if(customer_name.length<2||phone.length<5)throw Object.assign(new Error('Въведете име и телефон'),{status:400});if(email&&!/^\S+@\S+\.\S+$/.test(email))throw Object.assign(new Error('Невалиден имейл'),{status:400});let items=[],total=0;
if(kind==='order'){
    if(!Array.isArray(d.items)||!d.items.length||d.items.length>100)throw Object.assign(new Error('Невалидна количка'),{status:400});
    let requested=d.items.map(x=>Number(x.product_id));const [pc,vc]=await Promise.all([db.from('vinyl_products').select(publicColumns).in('id',requested).eq('active',true),db.from('vinyl_variants').select('product_id,variant_key,label,sale_price,active').in('product_id',requested).eq('active',true)]);
    const catalog=bad(pc,'order catalogue'),variants=bad(vc,'order variants');const byId=new Map(catalog.map(x=>[x.id,x])),byVariant=new Map(variants.map(x=>[x.product_id+':'+x.variant_key,x]));
    for(const row of d.items){
      const p=byId.get(Number(row.product_id)),q=Number(row.quantity);if(!p||!Number.isInteger(q)||q<1||q>100)throw Object.assign(new Error('Невалиден продукт или количество'),{status:400});
      const requires=(p.supplier_options||[]).length>0;
      const variantKey=str(row.variant_key,500);
      const variant=variantKey?byVariant.get(p.id+':'+variantKey):null;
      if(requires&&!variant)throw Object.assign(new Error('Изберете валиден размер или вариант за '+p.name),{status:400});
      if(!requires&&variantKey)throw Object.assign(new Error('Непознат вариант'),{status:400});
      const chosenPrice=requires?variant.sale_price:p.sale_price;
      const verifiedPrice=chosenPrice==null?null:Number(chosenPrice);
      items.push({product_id:p.id,name:p.name,quantity:q,unit:p.unit,price:verifiedPrice,variant:variant?.label||'',variant_key:variant?.variant_key||''});
      if(verifiedPrice!=null)total+=q*verifiedPrice;
    }
}
const id='Z'+Date.now().toString(36).toUpperCase()+crypto.randomBytes(3).toString('hex').toUpperCase();
bad(await db.from('vinyl_orders').insert({id,kind,status:'new',customer_name,phone,email,message,items,estimated_total:Math.round(total*100)/100}),'insert order');return {ok:true,order_id:id};}
async function upload(db,d){const id=Number(d.id),ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[d.mime];if(!Number.isInteger(id)||!ext||typeof d.base64!=='string'||d.base64.length>4.3e6)throw Object.assign(new Error('Невалидно изображение'),{status:400});const row=bad(await db.from('vinyl_products').select('id').eq('id',id).maybeSingle(),'image product');if(!row)throw Object.assign(new Error('Продуктът не съществува'),{status:404});const raw=Buffer.from(d.base64,'base64');if(raw.length<100||raw.length>3*1024*1024)throw Object.assign(new Error('Изображението трябва да е под 3 MB'),{status:400});const valid=ext==='jpg'?raw[0]===255&&raw[1]===216&&raw[2]===255:ext==='png'?raw.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):raw.toString('ascii',0,4)==='RIFF'&&raw.toString('ascii',8,12)==='WEBP';if(!valid)throw Object.assign(new Error('Неправилен формат'),{status:400});let key=id+'/'+crypto.randomUUID()+'.'+ext;const result=await db.storage.from('vinyl-product-images').upload(key,raw,{contentType:d.mime,upsert:false,cacheControl:'3600'});if(result.error)throw Object.assign(new Error('Storage: '+result.error.message),{status:500});const url=db.storage.from('vinyl-product-images').getPublicUrl(key).data.publicUrl;bad(await db.from('vinyl_products').update({image:url}).eq('id',id),'save photo');return {ok:true,url};}
module.exports=async function handler(req,res){
    if(req.headers['content-length']&&Number(req.headers['content-length'])>MAX_BODY+1024)return msg(res,413,'Заявката е твърде голяма');
    let route=String(req.query?.route||'').replace(/^\/+|\/+$/g,'')||new URL(req.url,'https://localhost').pathname.replace(/^\/api\//,'');
    if(Array.isArray(route))route=route.join('/');
    const seoRead=['GET','HEAD'].includes(req.method)&&['seo/product','seo/category','seo/sitemap','seo/shirt'].includes(route);
    if(!['GET','POST'].includes(req.method)&&!seoRead)return msg(res,405,'Непозволен метод');
    if(seoRead&&process.env.VERCEL_GIT_COMMIT_SHA)res.setHeader('X-Vinilpechat-Commit',process.env.VERCEL_GIT_COMMIT_SHA);
    try{
        if(route==='health')return json(res,200,{ok:true,commit:process.env.VERCEL_GIT_COMMIT_SHA||null,configured:!!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY),catalogReady:!!(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY),ordersReady:!!process.env.SUPABASE_SERVICE_ROLE_KEY,adminReady:!!(process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.ADMIN_EMAIL&&process.env.SESSION_SECRET)});
        if(route==='shirts/prices'&&req.method==='GET'){
          const {db,privileged}=clients();
          const overrides=privileged?await shirtPrices.loadOverrides(db):new Map();
          return json(res,200,{ok:true,prices:shirtPrices.publicPrices(overrides)});
        }
        if(route==='shirts/quote'&&req.method==='POST'){
          if(!sameOrigin(req))return msg(res,403,'Заявката трябва да е от този сайт');
          const {db,privileged}=clients();
          const overrides=privileged?await shirtPrices.loadOverrides(db):new Map();
          return json(res,200,{ok:true,quote:shirts.quote(await body(req),overrides)});
        }
        if(route==='design/quote'&&req.method==='POST'){
            if(!sameOrigin(req))return msg(res,403,'Заявката трябва да е от този сайт');
            return json(res,200,designQuote(await body(req)));
        }
        if(route==='seo/shirt'&&seoRead){
          const slug=typeof req.query?.slug==='string'?req.query.slug:'';
          const page=shirtPage.resolve(slug);
          if(!page){res.setHeader('X-Robots-Tag','noindex');return req.method==='HEAD'?res.status(404).end():res.status(404).send('Моделът не е намерен');}
          if(page.redirect){res.setHeader('Location',page.redirect);return res.status(308).end();}
          res.setHeader('Content-Type','text/html; charset=utf-8');
          res.setHeader('Cache-Control','public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
          res.setHeader('X-Content-Type-Options','nosniff');
          return req.method==='HEAD'?res.status(200).end():res.status(200).send(page.html);
        }
        if(seoRead){
            const {db}=clients();
            if(route==='seo/sitemap'){
                const xml=await seo.sitemapXml(db);
                res.setHeader('Content-Type','application/xml; charset=utf-8');
                res.setHeader('Cache-Control','public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
                res.setHeader('X-Content-Type-Options','nosniff');
                return req.method==='HEAD'?res.status(200).end():res.status(200).send(xml);
            }
            const slug=typeof req.query?.slug==='string'?req.query.slug:'';
            const page=route==='seo/product'?await seo.resolveProduct(db,slug):await seo.resolveCategory(db,slug);
            if(!page){res.setHeader('X-Robots-Tag','noindex');return req.method==='HEAD'?res.status(404).end():res.status(404).send('Страницата не е намерена');}
            if(page.redirect){res.setHeader('Location',page.redirect);return res.status(308).end();}
            res.setHeader('Content-Type','text/html; charset=utf-8');
            res.setHeader('Cache-Control','public, max-age=0, s-maxage=900, stale-while-revalidate=3600');
            res.setHeader('X-Content-Type-Options','nosniff');
            return req.method==='HEAD'?res.status(200).end():res.status(200).send(page.html);
        }
        let {db,auth,privileged}=clients();
        if(!privileged && (route==='orders'||route==='shirts/order'||route.startsWith('admin/')))return msg(res,503,'Магазинът приема само запитвания след завършване на настройките.');
        if(req.method==='GET'&&route==='catalog')return json(res,200,await catalog(db));
        if(req.method==='POST'&&route==='orders')return json(res,201,await orders(db,await body(req)));
        if(req.method==='POST'&&route==='shirts/order'){
          if(!sameOrigin(req))return msg(res,403,'Заявката трябва да е от този сайт');
          return json(res,201,await shirtOrders.saveShirtOrder(db,await body(req)));
        }
        if(req.method==='POST'&&route==='admin/login'){
            if(!sameOrigin(req))return msg(res,403,'Заявката трябва да е от този сайт');
            let d=await body(req);const email=str(d.email,254).toLowerCase();if(!email || email!==str(process.env.ADMIN_EMAIL).toLowerCase())return msg(res,401,'Неправилни данни за вход');
            const result=await auth.auth.signInWithPassword({email,password:String(d.password||'')});if(result.error||!result.data?.session)return msg(res,401,'Неправилни данни за вход');
            const token=result.data.session.access_token;const user=result.data.user;if(!user.email_confirmed_at)return msg(res,401,'Потвърдете имейла си');
            res.setHeader('Set-Cookie',cookie(req,token));return json(res,200,{authenticated:true,csrf:sessionCsrf(token)});
        }
        if(req.method==='POST'&&route==='admin/logout'){
            if(!sameOrigin(req))return msg(res,403,'Невалидна заявка');res.setHeader('Set-Cookie',cookie(req,'',true));return json(res,200,{ok:true});
        }
        if(req.method==='GET'&&route==='admin/session'){
            const token=parseCookie(req,'vinyl_auth');if(!token)return json(res,200,{authenticated:false,csrf:''});const user=await auth.auth.getUser(token);const allow=str(process.env.ADMIN_EMAIL||'',254).toLowerCase();const ok=!!(allow&&user?.data?.user?.email?.toLowerCase()===allow&&user.data.user.email_confirmed_at);return json(res,200,{authenticated:ok,csrf:ok?sessionCsrf(token):''});
        }
        if(route==='admin/shirt-prices'&&req.method==='GET'){
          if(!await admin(req,db,auth,res))return;
          return json(res,200,{ok:true,models:shirtPrices.modelRows(await shirtPrices.loadOverrides(db))});
        }
        if(route==='admin/data'&&req.method==='GET'){
            if(!await admin(req,db,auth,res))return;return json(res,200,await adminData(db));
        }
        if(route==='admin/shirt-files'&&req.method==='GET'){
          if(!await admin(req,db,auth,res))return;
          const id=str(req.query?.id,90);
          if(!/^T[A-Z0-9]{8,40}$/.test(id))return msg(res,400,'Невалиден номер на заявката');
          return json(res,200,await shirtOrders.signedFiles(db,id));
        }
        if(route==='admin/usage'&&req.method==='GET'){
            if(!await admin(req,db,auth,res))return;
            const usage=bad(await db.rpc('vinyl_store_usage'),'usage');
            return json(res,200,{usage,limits:{database_bytes:500*1024*1024,storage_bytes:1024*1024*1024},plan:'free'});
        }
        if(['admin/save','admin/order','admin/upload','admin/variants','admin/shirt-prices'].includes(route)&&req.method==='POST'){
            if(!await admin(req,db,auth,res,true))return;const d=await body(req);
            if(route==='admin/save')return json(res,200,await saveProducts(db,d));
            if(route==='admin/shirt-prices')return json(res,200,await shirtPrices.saveOverrides(db,d.rows));
            if(route==='admin/variants'){
                if(!Array.isArray(d.variants)||d.variants.length>800) return msg(res,400,'Невалиден списък с варианти');
                const seen=new Set();
                for(const v of d.variants){const id=Number(v.product_id),key=str(v.variant_key,500);if(!Number.isInteger(id)||id<1||!key||seen.has(id+':'+key))return msg(res,400,'Невалиден или дублиран вариант');seen.add(id+':'+key);}
                for(let i=0;i<d.variants.length;i+=12){
                    await Promise.all(d.variants.slice(i,i+12).map(async v=>{
                      const values={supplier_price:price(v.supplier_price),sale_price:price(v.sale_price),manual_sale_price:v.manual_sale_price===true,active:!!v.active,price_verification_needed:!!v.price_verification_needed};
                      const changed=bad(await db.from('vinyl_variants').update(values).eq('product_id',Number(v.product_id)).eq('variant_key',v.variant_key).select('product_id'),'variant pricing');
                      if(changed.length!==1)throw Object.assign(new Error('Невалиден вариант'),{status:400});
                    }));
                }
                return json(res,200,{ok:true,count:d.variants.length});
            }
            if(route==='admin/order'){
                if(!['new','in_progress','confirmed','completed','cancelled'].includes(d.status))return msg(res,400,'Неправилен статус');
                const id=str(d.id,90);const row=bad(await db.from('vinyl_orders').update({status:d.status}).eq('id',id).select('id').maybeSingle(),'update order');return row?json(res,200,{ok:true}):msg(res,404,'Заявката не е намерена');
            }
            return json(res,200,await upload(db,d));
        }
        return msg(res,404,'Няма такъв API адрес');
    }catch(e){console.error('Vinyl API:',e.message);return msg(res,e.status||500,e.status?e.message:'Грешка при обработката. Опитайте отново.');}
};
