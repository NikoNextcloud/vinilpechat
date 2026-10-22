'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const store=require('../lib/stedman-price-store');
const {quote}=require('../lib/stedman-pricing');
const sample={model_id:'ST2000',size_band:'S-2XL',color_group:'WHI',supplier_price:3.45,sale_price:12.75};

function storageFixture(){
 let stored=null,publicSetting=false,uploads=0,bucketChecks=0;
 const storage={
  async getBucket(name){bucketChecks++;assert.equal(name,store.BUCKET);
   return stored?{data:{name,public:publicSetting},error:null}:
    {data:null,error:{statusCode:404,message:'Bucket not found'}};},
  async createBucket(name,opts){assert.equal(name,store.BUCKET);assert.equal(opts.public,false);
   return {data:{name},error:null};},
  from(bucket){
   assert.equal(bucket,store.BUCKET);
   return {
    async download(name){assert.equal(name,store.OBJECT);return stored?
     {data:{async text(){return stored.toString('utf8')}},error:null}:
     {data:null,error:{statusCode:404,message:'Object not found'}};},
    async upload(name,buf,opts){assert.equal(name,store.OBJECT);
     assert.equal(opts.contentType,'application/json');assert.equal(opts.upsert,true);
     stored=Buffer.from(buf);uploads++;return {data:{path:name},error:null};}
   };
  }
 };
 return {db:{storage},getUploads:()=>uploads,getBucketChecks:()=>bucketChecks,getRaw:()=>stored,setPublic:v=>publicSetting=v};
}
test('Editable Stedman price matrix includes each of the 75 models',()=>{
 const models=store.modelRows(new Map());
 assert.equal(models.length,75);
 const m=models.find(x=>x.id==='ST2000');
 assert(m&&m.rows.length>=2);
 const row=m.rows.find(x=>x.size_band==='S-2XL'&&x.color_group==='WHI');
 assert.deepEqual([row.supplier_price,row.sale_price],[2.2,4.4]);
 assert(store.known.size>=75);
});
test('Private storage round-trip updates supplier and sale prices independently',async()=>{
 const fixture=storageFixture();
 const empty=await store.loadOverrides(fixture.db);
 assert.equal(empty.size,0);
 const result=await store.saveOverrides(fixture.db,[sample]);
 assert.equal(result.updated,1);
 assert.equal(fixture.getUploads(),1);
 const saved=await store.loadOverrides(fixture.db);
 const key=store.keyOf(sample.model_id,sample.size_band,sample.color_group);
 assert.deepEqual([saved.get(key).supplier_price,saved.get(key).sale_price],[3.45,12.75]);
 const exposed=store.publicPrices(saved);
 assert.equal(exposed.length,1);
 assert.equal(Object.hasOwn(exposed[0],'supplier_price'),false,'cost must not appear in retail response');
 const basic=quote({model_id:'ST2000',color_code:'WHI',shade_code:'WHI',sizes:[{size:'M',quantity:2}],print_mode:'none',prints:{}},saved);
 assert.equal(basic.total,25.5,'selling price, not supplier price, controls quote');
 const withFront=quote({model_id:'ST2000',color_code:'WHI',shade_code:'WHI',sizes:[{size:'M',quantity:2}],print_mode:'front',
  prints:{front:{position:{x:50,y:40,size:62,rotation:0}}}},saved);
 assert.equal(withFront.total,31.5,'print add-on stays EUR 3 per item');
 const unchanged=quote({model_id:'ST2000',color_code:'WHI',shade_code:'WHI',sizes:[{size:'3XL',quantity:1}],print_mode:'none',prints:{}},saved);
 assert.equal(unchanged.total,6,'other sizes retain the original price');
});
test('Editing only cost never changes sale price and setting defaults clears overrides',async()=>{
 const fixture=storageFixture();
 await store.saveOverrides(fixture.db,[sample]);
 await store.saveOverrides(fixture.db,[{...sample,supplier_price:9.95}]);
 let saved=await store.loadOverrides(fixture.db);
 assert.equal(saved.get(store.keyOf(sample.model_id,sample.size_band,sample.color_group)).sale_price,12.75);
 await store.saveOverrides(fixture.db,[{...sample,supplier_price:2.2,sale_price:4.4}]);
 saved=await store.loadOverrides(fixture.db);
 assert.equal(saved.size,0);
});
test('Disallow negative, invalid model, fractional cents and duplicate keys before any save',async()=>{
 const f=storageFixture(),bad=[
  {...sample,model_id:'ST0000'},
  {...sample,supplier_price:-1},
  {...sample,sale_price:1.999},
  {...sample,sale_price:Infinity},
  {...sample,supplier_price:'4.00'}
 ];
 for(const row of bad)await assert.rejects(()=>store.saveOverrides(f.db,[row]),{status:400});
 await assert.rejects(()=>store.saveOverrides(f.db,[sample,sample]),{status:400});
 assert.equal(f.getUploads(),0);
});
test('Pricing admin endpoints are protected and ordinary variants save supplier plus sale price',()=>{
 const api=fs.readFileSync(path.join(__dirname,'../api/index.js'),'utf8');
 const site=fs.readFileSync(path.join(__dirname,'../public/site.js'),'utf8');
 const html=fs.readFileSync(path.join(__dirname,'../public/teniski/index.html'),'utf8');
 assert.match(api,/route==='admin\/shirt-prices'&&req.method==='GET'/);
 assert.match(api,/if\(!await admin\(req,db,auth,res\)\)return/);
 assert.match(api,/route==='admin\/shirt-prices'\)return json\(res,200,await shirtPrices.saveOverrides/);
 assert.match(api,/supplier_price:price\(v.supplier_price\),sale_price:price\(v.sale_price\)/);
 assert.match(site,/data-variant-supplier-price/);
 assert.match(site,/data-stedman-edit="supplier_price"/);
 assert.match(site,/data-stedman-edit="sale_price"/);
 assert.match(site,/supplier_price:v.supplier_price,sale_price:v.sale_price/);
 assert(!html.includes('Избери модел, комбинирай размери и цвят.'));
});
