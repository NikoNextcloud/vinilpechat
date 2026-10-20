'use strict';
// Dependency-free catalogue/server with persistent JSON storage and a protected admin panel.
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const ROOT=__dirname;
const PUBLIC=path.join(ROOT,'public');
const DATA=path.join(ROOT,'data','store.json');
const SEED=path.join(ROOT,'data','seed.json');
const PORT=Number(process.env.PORT||3000);
const PASS=process.env.ADMIN_PASSWORD||'';
const sessions=new Map();
const attempts=new Map();
let db;
function initial(){if(!fs.existsSync(DATA))fs.copyFileSync(SEED,DATA);db=JSON.parse(fs.readFileSync(DATA,'utf8'));db.orders||=[];db.settings||={}}
function persist(){const name=DATA+'.tmp';fs.writeFileSync(name,JSON.stringify(db,null,2),{mode:0o600});fs.renameSync(name,DATA)}
initial();
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
function headers(res, extra={}){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https://id-preview--f2da8e1f-f49a-474a-ae45-4b0ddc08a96a.lovable.app; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");if(extra['Content-Type']?.includes('application/json'))res.setHeader('X-Robots-Tag','noindex, nofollow');for(let[k,v]of Object.entries(extra))res.setHeader(k,v)}
function reply(res,status,payload){headers(res,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.writeHead(status);res.end(JSON.stringify(payload))}
function reject(res,status,message){reply(res,status,{error:message})}
function cookieValue(req,name){let line=req.headers.cookie||'';let m=line.match(new RegExp('(?:^|;\\s*)'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):''}
function auth(req){let sid=cookieValue(req,'vinyl_sid'),session=sessions.get(sid);if(!sid||!session||session.until<Date.now()){if(sid)sessions.delete(sid);return null}session.until=Date.now()+8*3600e3;return session}
function requireAdmin(req,res,csrf=false){let session=auth(req);if(!session){reject(res,401,'Необходим е вход като администратор');return null}if(csrf && (req.headers['x-csrf-token']!==session.csrf)){reject(res,403,'Невалиден защитен токен');return null}return session}
function body(req,limit=5e6){return new Promise((resolve,reject)=>{let size=0,parts=[];req.on('data',x=>{size+=x.length;if(size>limit){reject(new Error('Заявката е твърде голяма'));req.destroy();return}parts.push(x)});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')||'{}'))}catch(e){reject(new Error('Невалиден JSON'))}});req.on('error',reject)})}
function safeText(v,n=1000){return String(v??'').slice(0,n).trim()}
function numberPrice(x){if(x===null||x===''||x===undefined)return null;let n=Number(x);if(!Number.isFinite(n)||n<0||n>100000000)throw new Error('Невалидна цена');return Math.round(n*100)/100}
function expose(){return {products:db.products.filter(p=>p.active).map(({supplier_price,image_source,source,...rest})=>({...rest,source})),categories:db.categories,settings:db.settings}}
function setCookie(res,name,val,req,seconds){let secure=req.socket.encrypted||req.headers['x-forwarded-proto']==='https';res.setHeader('Set-Cookie',`${name}=${encodeURIComponent(val)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${seconds}${secure?'; Secure':''}`)}
async function route(req,res){let url=new URL(req.url,'http://localhost');let api=url.pathname;if(req.method==='GET'&&api==='/api/health')return reply(res,200,{ok:true,products:db.products.length,categories:db.categories.length,images:db.products.filter(p=>!!p.image).length});
if(req.method==='GET'&&api==='/api/catalog')return reply(res,200,expose());
if(req.method==='GET'&&api==='/api/admin/session'){let s=auth(req);return reply(res,200,{authenticated:!!s,csrf:s?.csrf||''})}
if(req.method==='POST'&&api==='/api/admin/login'){
 if(PASS.length<12)return reject(res,503,'Администраторската парола не е настроена. Задай ADMIN_PASSWORD (поне 12 символа) на сървъра.');
 let ip=req.socket.remoteAddress||'local',entry=attempts.get(ip)||{count:0,start:Date.now()};if(Date.now()-entry.start>15*60e3)entry={count:0,start:Date.now()};if(entry.count>=10)return reject(res,429,'Твърде много опити. Опитай след 15 минути.');
 let d=await body(req,2000);let submitted=crypto.createHash('sha256').update(String(d.password||'')).digest();let expected=crypto.createHash('sha256').update(PASS).digest();if(!crypto.timingSafeEqual(submitted,expected)){entry.count++;attempts.set(ip,entry);return reject(res,401,'Грешна парола')};attempts.delete(ip);let sid=crypto.randomBytes(32).toString('hex'),csrf=crypto.randomBytes(24).toString('hex');sessions.set(sid,{csrf,until:Date.now()+8*3600e3});setCookie(res,'vinyl_sid',sid,req,8*3600);return reply(res,200,{authenticated:true,csrf});
}
if(req.method==='POST'&&api==='/api/admin/logout'){let sid=cookieValue(req,'vinyl_sid');sessions.delete(sid);setCookie(res,'vinyl_sid','',req,0);return reply(res,200,{ok:true})}
if(req.method==='GET'&&api==='/api/admin/data'){if(!requireAdmin(req,res))return;return reply(res,200,db)}
if(req.method==='POST'&&api==='/api/admin/save'){
 if(!requireAdmin(req,res,true))return;let d=await body(req);if(!Array.isArray(d.products)||d.products.length>3000)return reject(res,400,'Невалиден каталог');
 let byId=new Map(d.products.map(p=>[Number(p.id),p]));for(let p of db.products){let x=byId.get(p.id);if(!x)continue;for(let k of ['name','description','unit','category'])if(x[k]!==undefined){if(k==='category'&&!db.categories.find(c=>c.id===x.category))return reject(res,400,'Невалидна категория');p[k]=safeText(x[k],k==='description'?6000:250)};if(x.sale_price!==undefined)p.sale_price=numberPrice(x.sale_price);if(x.supplier_price!==undefined)p.supplier_price=numberPrice(x.supplier_price);if(x.active!==undefined)p.active=!!x.active;if(x.image!==undefined){let v=safeText(x.image,1200);if(v.startsWith('/uploads/')||v.startsWith('https://id-preview--f2da8e1f-f49a-474a-ae45-4b0ddc08a96a.lovable.app/products/'))p.image=v;}}
 if(d.settings && typeof d.settings==='object')for(let k of ['brand','company','phone','email','address','shipping','privacy'])if(d.settings[k]!==undefined)db.settings[k]=safeText(d.settings[k],k==='shipping'||k==='privacy'?6000:350);persist();return reply(res,200,{ok:true});
}
if(req.method==='POST'&&api==='/api/admin/order'){
 if(!requireAdmin(req,res,true))return;let d=await body(req,10000),order=db.orders.find(o=>o.id===safeText(d.id,80));if(!order)return reject(res,404,'Няма такава заявка');if(!['new','in_progress','confirmed','completed','cancelled'].includes(d.status))return reject(res,400,'Невалиден статус');order.status=d.status;persist();return reply(res,200,{ok:true})
}
if(req.method==='POST'&&api==='/api/admin/upload'){
 if(!requireAdmin(req,res,true))return;let d=await body(req,4.5e6),p=db.products.find(x=>x.id===Number(d.id));if(!p)return reject(res,404,'Няма такъв продукт');const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[d.mime];if(!ext||typeof d.base64!=='string')return reject(res,400,'Невалиден тип изображение');let raw=Buffer.from(d.base64,'base64');if(raw.length<100||raw.length>3*1024*1024)return reject(res,400,'Невалиден размер');let isJPG=ext==='jpg'&&raw[0]===0xff&&raw[1]===0xd8&&raw[2]===0xff;let isPNG=ext==='png'&&raw.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'));let isWebp=ext==='webp'&&raw.toString('ascii',0,4)==='RIFF'&&raw.toString('ascii',8,12)==='WEBP';if(!(isJPG||isPNG||isWebp))return reject(res,400,'Файлът не съответства на типа');const filename=`photo-${p.id}-${crypto.randomBytes(8).toString('hex')}.${ext}`;fs.mkdirSync(path.join(PUBLIC,'uploads'),{recursive:true});fs.writeFileSync(path.join(PUBLIC,'uploads',filename),raw,{flag:'wx',mode:0o644});p.image='/uploads/'+filename;p.image_source='Собствена снимка, качена от администратора';persist();return reply(res,200,{ok:true,url:p.image});
}
if(req.method==='POST'&&api==='/api/orders'){
 let d=await body(req,50000),kind=d.kind==='contact'?'contact':'order';let name=safeText(d.name,120),phone=safeText(d.phone,40),email=safeText(d.email,255),message=safeText(d.message,3000);if(name.length<2||phone.length<5)return reject(res,400,'Въведи име и телефон');if(email&&(!/^\S+@\S+\.\S+$/.test(email)))return reject(res,400,'Невалиден имейл');let items=[],total=0;if(kind==='order'){if(!Array.isArray(d.items)||d.items.length<1||d.items.length>100)return reject(res,400,'Заявката няма продукти');for(let x of d.items){let p=db.products.find(z=>z.id===Number(x.product_id)&&z.active);let n=Number(x.quantity);if(!p||!Number.isInteger(n)||n<1||n>100)return reject(res,400,'Невалиден продукт или количество');items.push({product_id:p.id,name:p.name,quantity:n,unit:p.unit,price:p.sale_price,variant:safeText(x.variant,500)});total+=n*(p.sale_price||0)}}let id='Z'+Date.now().toString(36).toUpperCase()+crypto.randomBytes(2).toString('hex').toUpperCase();db.orders.unshift({id,kind,status:'new',customer_name:name,phone,email,message,items,estimated_total:Math.round(total*100)/100,created_at:new Date().toISOString()});persist();return reply(res,201,{ok:true,order_id:id});
}
if(api.startsWith('/api/'))return reject(res,404,'Несъществуващ API адрес');
if(req.method!=='GET'&&req.method!=='HEAD')return reject(res,405,'Методът не е позволен');
let pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);if(pathname.endsWith('/'))pathname+='index.html';if(pathname.includes('\0')||pathname.split('/').includes('..'))return reject(res,403,'Забранено');let target=path.resolve(PUBLIC,'.'+pathname);if(!target.startsWith(PUBLIC+path.sep))return reject(res,403,'Забранено');
let ext=path.extname(target).toLowerCase();if(!Object.hasOwn(mime,ext))return reject(res,404,'Не е намерен файл');let st;try{st=fs.statSync(target)}catch(e){return reject(res,404,'Файлът липсва')}if(!st.isFile())return reject(res,404,'Файлът липсва');headers(res,{'Content-Type':mime[ext],'Cache-Control':ext==='.html'?'no-cache':'public, max-age=3600'});res.writeHead(200);if(req.method==='HEAD')res.end();else fs.createReadStream(target).pipe(res)
}
http.createServer((req,res)=>{route(req,res).catch(e=>{console.error('Request error:',e.message);if(!res.headersSent)reject(res,400,e.message||'Възникна грешка');else res.destroy()})}).listen(PORT,'0.0.0.0',()=>console.log(`Винил & Брезенти: http://localhost:${PORT} | продукти: ${db.products.length} | admin: ${PASS.length>=12?'configured':'NOT CONFIGURED'}`));
