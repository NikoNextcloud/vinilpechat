'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('public/site.js','utf8');
const functions=script.slice(script.indexOf('const variantCSVFields='),script.indexOf('function readCSV(csv)'));
const save=script.slice(script.indexOf('async function saveVariantPrices(){'),script.indexOf('async function saveAdmin(){'));
function products(){return [{id:10,name:'Платно; "градина"\nзелено',sale_price:99,supplier_price:11,public_supplier_reference:{public_min_price:22},supplier_options:[{id:'s',label:'Размер',values:[{id:'a',text:'2 x 3 м'},{id:'b',text:'4 x 5 м'}]}],variants:[{variant_key:'s=a&color=green',label:'Размер: 2 x 3 м | зелен',choices:{s:'a',color:'green'},sale_price:null,supplier_price:3,active:false,price_verification_needed:true},{variant_key:'s=b&color=green',label:'Размер: 4 x 5 м | зелен',choices:{s:'b',color:'green'},sale_price:20,supplier_price:8,manual_sale_price:false,active:true,price_verification_needed:false}]},{id:11,name:'Друг продукт',variants:[{variant_key:'s=a&color=green',label:'Друг размер',choices:{s:'a'},sale_price:7}]}]}
function harness(){
 const calls=[],messages=[],panel={innerHTML:''};const db={products:products()};
 const context={db,changedVariants:new Set(),useServer:false,escaped:s=>String(s).replaceAll('<','&lt;'),euro:n=>n==null?'По запитване':'€'+n,$:()=>panel,getProduct:id=>db.products.find(p=>p.id===id),renderAdminPane:()=>{},toast:s=>messages.push(s),request:async(url,options)=>{calls.push({url,options});return {products:products()}}};
 const api=vm.runInNewContext(functions+save+';({buildVariantCSV,parseVariantCSV,validateVariantCSV,importVariantCSV,applyVariantCSV,saveVariantPrices})',context);
 return {...api,context,calls,messages,panel,db};
}
function edit(h,fn){const rows=h.parseVariantCSV(h.buildVariantCSV(h.db.products));fn(rows);return '\uFEFF'+rows.map(r=>r.map(s=>'"'+String(s).replaceAll('"','""')+'"').join(';')).join('\r\n')}
const file=text=>({size:Buffer.byteLength(text),text:async()=>text});
test('exports every combination including inactive and unset prices; semicolons, quotes, newlines round-trip',()=>{
 const h=harness(),text=h.buildVariantCSV(h.db.products),rows=h.parseVariantCSV(text);
 assert.ok(text.startsWith('\uFEFF'));assert.equal(rows.length,4);assert.equal(rows[1][1],h.db.products[0].name);assert.equal(rows[1][4],'2 x 3 м');assert.equal(rows[1][6],'');assert.equal(rows[1][7],'');
 assert.deepEqual(JSON.parse(JSON.stringify(h.validateVariantCSV(text,h.db.products))),{changes:[],errors:[]});
 assert.ok(!rows[0].includes('supplier_price'));
});
test('only explicit new prices change; comma decimals, zero, null current price and reordered columns are supported',()=>{
 const h=harness(),csv=edit(h,rows=>{rows[1][7]='12,50';rows[2][7]='0';rows.forEach(r=>r.reverse())}),result=h.validateVariantCSV(csv,h.db.products);
 assert.equal(result.errors.length,0);assert.equal(result.changes.length,2);assert.equal(result.changes[0].sale_price,12.5);assert.equal(result.changes[1].sale_price,0);
});
for(const value of ['-1','NaN','Infinity','1e2','0x10','1.234','1,2.3','100000000.01','=1+1','12 €'])test('rejects invalid price '+value,()=>{
 const h=harness(),before=JSON.stringify(h.db),result=h.validateVariantCSV(edit(h,r=>r[1][7]=value),h.db.products);
 assert.equal(result.errors.length,1);assert.equal(JSON.stringify(h.db),before);
});
for(const [name,mutate] of [
 ['unknown product',r=>r[1][0]='999'],['unknown key',r=>r[1][2]='s=missing'],['wrong product with shared key',r=>r[1][0]='11'],['wrong size',r=>r[1][4]='9 x 9'],['changed label',r=>r[1][3]='wrong'],['changed choices',r=>r[1][5]='{}'],['stale price',r=>r[2][6]='19'],['duplicate row',r=>r.push([...r[1]])],['missing column',r=>r[0].pop()],['duplicate column',r=>r[0][7]='current_sale_price'],['short row',r=>r[1].pop()],['extra row cell',r=>r[1].push('extra')]
])test('rejects '+name+' before applying any row',async()=>{
 const h=harness(),before=JSON.stringify(h.db),csv=edit(h,r=>{r[1][7]='12';mutate(r)});
 await h.importVariantCSV(file(csv));await h.applyVariantCSV();assert.equal(JSON.stringify(h.db),before);assert.equal(h.context.changedVariants.size,0);assert.ok(h.panel.innerHTML.includes('CSV не е приет'));
});
test('rejects malformed quoting and supports comma-delimited CSV with quoted decimal commas',()=>{
 const h=harness();assert.throws(()=>h.parseVariantCSV('a;b\n"oops'),/кавички/);assert.throws(()=>h.parseVariantCSV('a;b\n"ok"x;2'),/кавички/);
 const rows=h.parseVariantCSV(edit(h,r=>r[1][7]='12,50'));const comma=rows.map(r=>r.map(s=>'"'+s.replaceAll('"','""')+'"').join(',')).join('\r\n');assert.equal(h.validateVariantCSV(comma,h.db.products).changes[0].sale_price,12.5);
});
test('spreadsheet formulas are escaped in identifying text and still round-trip',()=>{
 const h=harness();h.db.products[0].name='=HYPERLINK("bad")';const rows=h.parseVariantCSV(h.buildVariantCSV(h.db.products));assert.equal(rows[1][1][0],"'");assert.equal(h.validateVariantCSV(h.buildVariantCSV(h.db.products),h.db.products).errors.length,0);
});
test('preview does not mutate; apply changes only sales/manual flags and existing save posts exact keys',async()=>{
 const h=harness(),expected=structuredClone(h.db.products),csv=edit(h,r=>{r[1][7]='12.50';r[2][7]='21'});
 await h.importVariantCSV(file(csv));assert.deepEqual(h.db.products,expected);assert.equal(h.calls.length,0);assert.ok(h.panel.innerHTML.includes('Преглед: 2'));
 h.context.useServer=true;await h.applyVariantCSV();
 expected[0].variants[0].sale_price=12.5;expected[0].variants[0].manual_sale_price=true;expected[0].variants[1].sale_price=21;expected[0].variants[1].manual_sale_price=true;
 assert.deepEqual(h.db.products,expected);assert.equal(h.context.changedVariants.size,2);
 await h.saveVariantPrices();assert.equal(h.calls[0].url,'/api/admin/data');assert.equal(h.calls[1].url,'/api/admin/variants');const posted=JSON.parse(h.calls[1].options.body).variants;assert.equal(posted.length,2);assert.equal(posted[0].product_id,10);assert.equal(posted[0].variant_key,'s=a&color=green');assert.equal(posted[0].manual_sale_price,true);assert.equal(posted[0].active,false);assert.ok(!('supplier_price' in posted[0]));assert.equal(h.context.changedVariants.size,0);
});
test('a local edit after preview invalidates the whole import',async()=>{
 const h=harness();await h.importVariantCSV(file(edit(h,r=>r[1][7]='12')));h.db.products[0].variants[1].sale_price=25;const before=JSON.stringify(h.db);await h.applyVariantCSV();assert.equal(JSON.stringify(h.db),before);assert.equal(h.context.changedVariants.size,0);
});
test('fresh server identity/price mismatch blocks staging',async()=>{
 const h=harness();h.context.useServer=true;h.context.request=async()=>{const p=products();p[0].variants[0].sale_price=1;return {products:p}};
 await h.importVariantCSV(file(edit(h,r=>r[1][7]='12')));const before=JSON.stringify(h.db);await h.applyVariantCSV();assert.equal(JSON.stringify(h.db),before);assert.equal(h.context.changedVariants.size,0);
});
test('failed save retains staged prices for retry',async()=>{
 const h=harness();await h.importVariantCSV(file(edit(h,r=>r[1][7]='12')));await h.applyVariantCSV();h.context.request=async()=>{throw new Error('offline')};await h.saveVariantPrices();assert.equal(h.context.changedVariants.size,1);assert.ok(h.messages.at(-1).includes('offline'));
});
test('UI exposes dedicated export, import, preview and apply controls',()=>{
 for(const s of ['data-variant-csv-export','data-variant-csv-import','data-variant-csv-apply','variantCSVFile','variantCSVPreview'])assert.ok(script.includes(s));
});
test('local edits during the server check are revalidated before staging',async()=>{
 const h=harness();h.context.useServer=true;
 h.context.request=async()=>{h.db.products[0].variants[0].sale_price=15;return {products:products()}};
 await h.importVariantCSV(file(edit(h,r=>r[1][7]='12')));await h.applyVariantCSV();assert.equal(h.db.products[0].variants[0].sale_price,15);assert.equal(h.context.changedVariants.size,0);
});
test('replacing a preview during the server check cancels the older application',async()=>{
 const h=harness(),first=edit(h,r=>r[1][7]='12'),second=edit(h,r=>r[1][7]='13');h.context.useServer=true;
 h.context.request=async()=>{await h.importVariantCSV(file(second));return {products:products()}};
 await h.importVariantCSV(file(first));await h.applyVariantCSV();assert.equal(h.db.products[0].variants[0].sale_price,null);assert.equal(h.context.changedVariants.size,0);
});
