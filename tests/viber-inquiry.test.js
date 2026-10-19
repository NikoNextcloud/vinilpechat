'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const script=fs.readFileSync('public/site.js','utf8');
const functions=script.slice(script.indexOf("const viberPhone="),script.indexOf('function productCard(p)'));
function harness(){
 const p={id:42,name:'Платнище <зелено>',variants:[]};
 const messages=[],copies=[],opened=[],panel={classList:{remove:c=>panel.hidden=false},hidden:true},field={value:'',focus(){this.focused=true},select(){this.selected=true}};
 const context={location:{href:'https://vinilpechat.example/?ref=catalog#catalog'},URL,state:{detail:null},getProduct:id=>id===42?p:null,openDetail:id=>{context.state.detail=id;opened.push(id)},hasOptions:p=>!!p.supplier_options?.length,selectionKey:()=>context.key||'',getVariant:(p,key)=>p.variants.find(v=>v.variant_key===key&&v.active!==false),$:s=>s==='#viberMessage'?field:panel,toast:t=>messages.push(t),navigator:{clipboard:{writeText:async text=>copies.push(text)}}};
 const api=vm.runInNewContext(functions+';({viberChatURL,viberProductMessage,prepareViberInquiry,copyViberMessage})',context);
 return {...api,context,p,messages,copies,opened,panel,field};
}
test('Viber link targets the requested Bulgarian number and does not use a recipient chooser',()=>{
 const h=harness();assert.equal(h.viberChatURL,'viber://chat?number=%2B359879436006');assert.ok(!h.viberChatURL.includes('forward'));
});
test('product inquiry contains exact product, ID, link and chosen variant',()=>{
 const h=harness(),text=h.viberProductMessage(h.p,{label:'2 x 3 м | Зелен'});
 for(const expected of ['Платнище <зелено>','Код на продукта: 42','Размер / вариант: 2 x 3 м | Зелен','https://vinilpechat.example/?ref=catalog#item-42'])assert.ok(text.includes(expected));assert.ok(!text.includes('#catalog'));
});
test('product without options prepares copyable inquiry and allows direct Viber navigation',async()=>{
 const h=harness();assert.equal(h.prepareViberInquiry(42),true);await Promise.resolve();assert.deepEqual(h.opened,[42]);assert.equal(h.panel.hidden,false);assert.equal(h.copies[0],h.field.value);assert.ok(h.field.value.includes(h.p.name));
});
test('missing or unavailable combinations block navigation and copying',()=>{
 const h=harness();h.p.supplier_options=[{id:'size'}];assert.equal(h.prepareViberInquiry(42),false);assert.equal(h.copies.length,0);
 h.context.key='size=missing';assert.equal(h.prepareViberInquiry(42),false);assert.equal(h.copies.length,0);
 h.p.variants=[{variant_key:'size=missing',active:false}];assert.equal(h.prepareViberInquiry(42),false);assert.equal(h.copies.length,0);
});
test('selected active variant is preserved when preparing Viber inquiry',()=>{
 const h=harness();h.p.supplier_options=[{id:'size'}];h.p.variants=[{variant_key:'size=large',label:'4 x 6 м',active:true}];h.context.state.detail=42;h.context.key='size=large';assert.equal(h.prepareViberInquiry(42),true);assert.deepEqual(h.opened,[]);assert.ok(h.field.value.includes('4 x 6 м'));
});
test('clipboard failure keeps the draft selectable for manual copy',async()=>{
 const h=harness();h.context.navigator={};h.field.value='Запитване';await h.copyViberMessage();assert.equal(h.field.focused,true);assert.equal(h.field.selected,true);assert.ok(h.messages[0].includes('копирай'));
});
test('unknown product cannot open a chat',()=>{const h=harness();assert.equal(h.prepareViberInquiry(99),false);assert.equal(h.copies.length,0)});
test('catalog, detail and contact UI wire Viber; option changes hide the old draft',()=>{
 assert.ok(script.includes('data-viber-product="${p.id}"'));assert.ok(script.includes('Пиши във Viber · 0879436006'));assert.ok(script.includes('id="viberMessage"'));assert.ok(script.includes("if(!prepareViberInquiry(Number(a.dataset.viberProduct)))e.preventDefault()"));assert.ok(script.includes("$('#viberInquiry')?.classList.add('hidden')"));assert.ok(script.includes('data-copy-viber'));
});
