'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {catalog,quote,expand}=require('../lib/stedman-pricing');
const {saveShirtOrder,signedFiles,decode,BUCKET}=require('../lib/stedman-orders');
const app=fs.readFileSync(path.join(__dirname,'../public/teniski/app.js'),'utf8');
const v2=fs.readFileSync(path.join(__dirname,'../public/teniski/v2.js'),'utf8');
test('Client and server share all exact 75 catalog models and price tiers',()=>{
 const m=app.match(/const models=(\[[^\n]+\]);/);
 assert.ok(m,'catalog array exists in client');
 assert.deepEqual(JSON.parse(m[1]),catalog);
 assert.equal(catalog.length,75);
 assert.equal(new Set(catalog.map(x=>x.id)).size,75);
});
test('Mixed sizes apply the selected EUR 3 front / EUR 6 both print package',()=>{
 const q=quote({model_id:'ST2000',color_code:'WHI',
 sizes:[{size:'M',quantity:2},{size:'3XL',quantity:1}],print_mode:'both',shade_code:'WHI',
 prints:{front:{position:{x:50,y:40,size:62,rotation:0}},back:{position:{x:50,y:40,size:62,rotation:0}}}});
 assert.equal(q.quantity,3);
 assert.equal(q.lines[0].unitPrice,10.40);
 assert.equal(q.lines[1].unitPrice,12);
 assert.equal(q.total,32.8);
 assert.equal(q.totalCents,3280);
 assert.equal(q.prints.front.rotation,0);
});
test('Reject invalid sizes, quantity, color, models and artwork geometry',()=>{
 const base={model_id:'ST2000',color_code:'WHI',sizes:[{size:'M',quantity:1}],print_mode:'front',prints:{front:{position:{x:50,y:40,size:62,rotation:0}}}};
 const invalid=[
  {...base,model_id:'ST0000'},
  {...base,color_code:'ORANGE'},
  {...base,sizes:[{size:'6XL',quantity:1}]},
  {...base,sizes:[{size:'M',quantity:1},{size:'M',quantity:2}]},
  {...base,sizes:[{size:'M',quantity:501}]},
  {...base,prints:{front:{position:{x:1000,y:30,size:60,rotation:0}}}},
  {...base,print_mode:'back'},
  {...base,print_mode:'both'},
  {...base,prints:{front:base.prints.front,back:base.prints.front}},
  {...base,shade_code:'FAKE'}
 ];
 for(const value of invalid)assert.throws(()=>quote(value));
 assert.deepEqual(expand('S-2XL'),['S','M','L','XL','2XL']);
});
test('Private upload only saves accepted PNG and stores order safely',async()=>{
 const bytes=Buffer.concat([Buffer.from('89504e470d0a1a0a','hex'),Buffer.alloc(100)]);
 const file={mime:'image/png',name:'logo.png',base64:bytes.toString('base64')};
 const saved=[],removed=[];
 let inserted;
 const storage={
  async getBucket(){return {data:{name:BUCKET,public:false},error:null};},
  from(name){assert.equal(name,BUCKET);return {
   async upload(key,binary,options){saved.push({key,binary,options});return {error:null}},
   async remove(keys){removed.push(...keys);return {error:null}},
   async createSignedUrl(key,ttl){assert.equal(ttl,600);return {data:{signedUrl:'https://example.test/'+key},error:null}}
  }}
 };
 const db={storage,from(name){
  assert.equal(name,'vinyl_orders');
  return {
   async insert(record){inserted=record;return {error:null}},
   select(){return {eq(){return {async maybeSingle(){return {data:inserted,error:null}}}}}}
  };
 }};
 const data={model_id:'ST2000',color_code:'WHI',sizes:[{size:'M',quantity:3}],
 print_mode:'front',shade_code:'WHI',prints:{front:{position:{x:50,y:30,size:62,rotation:15},file}},
 name:'Тест клиент',phone:'0879436006',notes:'Зелено лого',consent:true};
 const res=await saveShirtOrder(db,data);
 assert.equal(res.ok,true);
 assert.equal(saved.length,1);
 assert.equal(inserted.kind,'order');
 assert.equal(inserted.estimated_total,22.2); // (4.40 + 3.00) * 3
 assert.equal(inserted.items[0].shirt_size,'M');
 assert.ok(inserted.items[0].shirt_artwork.front.key.startsWith('orders/'+res.order_id+'/front-'));
 const signed=await signedFiles(db,res.order_id);
 assert.equal(Object.keys(signed.files).length,1);
 assert.equal(signed.files.front.position.rotation,15);
 assert.equal(removed.length,0);
 assert.equal(saved[0].options.upsert,false);
});
test('Private image decoder rejects unsupported MIME and corrupted image bytes',()=>{
 assert.throws(()=>decode({mime:'image/svg+xml',base64:'eHl6'}));
 assert.throws(()=>decode({mime:'image/png',base64:Buffer.alloc(100).toString('base64')}));
});
test('New checkout remains isolated and admin links require the existing session',()=>{
 const api=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');
 const admin=fs.readFileSync(path.join(__dirname,'../public/site.js'),'utf8');
 assert.match(api,/route==='shirts\/quote'/);
 assert.match(api,/route==='shirts\/order'/);
 assert.match(api,/route==='admin\/shirt-files'/);
 assert.match(api,/if\(!await admin\(req,db,auth,res\)\)return/);
 assert.match(admin,/data-admin-shirt-files/);
 assert.match(v2,/v2-sizes/);
 assert.match(v2,/setPointerCapture/);
 assert.match(v2,/readAsDataURL/);
 assert.match(v2,/v2-order-form/);
});

test('Verified Stedman shade must match selected supplier price group',()=>{
 const base={model_id:'ST2000',color_code:'COL',shade_code:'NAV',print_mode:'front',sizes:[{size:'M',quantity:1}],prints:{front:{position:{x:50,y:40,size:62,rotation:0}}}};
 const result=quote(base);
 assert.equal(result.color_name,'Тъмносиньо');
 assert.equal(result.shade_code,'NAV');
 assert.equal(result.total,8.2); // coloured unit 5.20 + front print 3.00
 assert.throws(()=>quote({...base,color_code:'WHI'}),/цвят/);
 assert.throws(()=>quote({...base,shade_code:'MADE_UP'}),/цвят/);
 assert.throws(()=>quote({...base,print_mode:'both'}),/страни/);
});
