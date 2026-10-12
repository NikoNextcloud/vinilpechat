'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('public/site.js','utf8');
const begin=script.indexOf('function renderOrderCard(o){'),end=script.indexOf('function renderAdminPane(){',begin);
assert.ok(begin>=0&&end>begin,'Itemized order renderer must exist.');
const escaped=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const euro=n=>n==null?'По запитване':'€'+Number(n).toFixed(2);
const render=vm.runInNewContext(script.slice(begin,end)+';renderOrderCard',{escaped,euro,getProduct:()=>null});
test('historical order shows each ordered product, quantity, price and total',()=>{
 const h=render({id:'ORDER-123',status:'completed',customer_name:'Клиент',phone:'0888888888',
 estimated_total:124.76,items:[
 {product_id:10,name:'Перфовинил меш – ролка',unit:'кв.м.',quantity:1,price:2.05,variant:''},
 {product_id:2,name:'НОВО платно от билборд',unit:'бр.',quantity:1,price:122.71,variant:''}]});
 for(const term of ['Перфовинил меш','НОВО платно от билборд','€2.05','€122.71','€124.76','Клиент','Заявка № ORDER-123'])assert.ok(h.includes(term),term);
 const tbody=h.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1]||'';assert.equal((tbody.match(/<tr>/g)||[]).length,2,'Each distinct item renders in its own table row.');
});
test('variant, quantity and historical line subtotal display',()=>{
 const h=render({id:'O2',estimated_total:37.50,items:[{name:'Платнище',quantity:3,unit:'бр.',price:12.5,variant:'Размер: 2 x 3 м'}]});
 for(const term of ['Платнище','Размер: 2 x 3 м','€12.50','€37.50','3 бр.'])assert.ok(h.includes(term),term);
});
test('customer supplied product names and notes are escaped',()=>{
 const h=render({id:'O3',customer_name:'<script>alert(1)</script>',phone:'12345',items:[{name:'<img src=x onerror=alert(1)>',price:null,quantity:1}],message:'<svg onload=alert(1)>'});
 assert.ok(!h.includes('<script>alert(1)</script>'));
 assert.ok(!h.includes('<img src=x onerror=alert(1)>'));
 assert.ok(!h.includes('<svg onload=alert(1)>'));
 assert.ok(h.includes('&lt;script&gt;'));
 assert.ok(h.includes('По запитване'));
});
