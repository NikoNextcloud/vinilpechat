'use strict';
(function(){
 const form=document.getElementById('vp-product-config'),script=document.getElementById('vp-service-data');
 if(!form||!script||!window.VinilQuote)return;
 let data;
 try{data=JSON.parse(script.textContent)}catch{return}
 const $=sel=>form.querySelector(sel);
 const width=$('#vp-width'),height=$('#vp-height'),qty=$('#vp-service-qty');
 const share=$('#vp-share-url'),status=$('#vp-service-status'),error=$('#vp-measure-error');
 const fields=data.options.fields;
 const number=v=>Number(String(v).replace(',','.'));
 const fmt=n=>Number(n).toLocaleString('bg-BG',{maximumFractionDigits:2});
 function choices(){
  const result={};
  for(const field of fields){
   const selector=field.kind==='select'?form.querySelector('select[data-vp-choice="'+field.id+'"]'):form.querySelector('input[name="vp-'+field.id+'"]:checked');
   const candidate=selector?.value;
   if(!field.choices.some(x=>x.value===candidate))return null;
   result[field.id]=candidate;
  }
  return result;
 }
 function values(){
  const w=number(width.value),h=number(height.value),q=number(qty.value);
  if(!Number.isFinite(w)||!Number.isFinite(h)||w<data.rules.min||w>data.rules.max||h<data.rules.min||h>data.rules.max||
     !Number.isInteger(q)||q<1||q>data.rules.qty_max||!width.value||!height.value||!qty.value)return null;
  const selections=choices();if(!selections)return null;
  return {w,h,q,selections};
 }
 function summary(v){
  return ['Ширина: '+fmt(v.w)+' см','Височина: '+fmt(v.h)+' см',
   ...fields.map(f=>f.label+': '+f.choices.find(c=>c.value===v.selections[f.id]).label)].join(' · ');
 }
 function update(){
  const v=values();error.hidden=!!v;error.textContent=v?'':'Въведи ширина и височина от 5 до 2000 см и количество от 1 до 1000 бр.';
  $('#vp-service-add').disabled=!v;$('#vp-config-share').disabled=!v;
  $('#vp-config-dimensions').textContent=v?fmt(v.w)+' × '+fmt(v.h)+' см · '+v.q+' бр.':'Провери размерите и количеството';
  $('#vp-config-variant-summary').textContent=v?fields.map(f=>f.choices.find(c=>c.value===v.selections[f.id]).label).join(' · '):'Необходимо е да уточниш размер';
  for(const [i,p] of data.options.presets.entries()){
   const button=form.querySelector('[data-vp-preset="'+i+'"]');
   if(button)button.classList.toggle('is-active',!!v&&v.w===p.width_cm&&v.h===p.height_cm);
  }
 }
 function applyUrl(){
  const u=new URL(location.href);
  for(const [field,target] of [['w',width],['h',height],['q',qty]]){
   const v=u.searchParams.get('vp_'+field);
   if(v!==null&&v!==''&&Number.isFinite(Number(v)))target.value=v;
  }
  for(const f of fields){
   const value=u.searchParams.get('vp_'+f.id);
   if(!value||!f.choices.some(c=>c.value===value))continue;
   if(f.kind==='select'){const input=form.querySelector('select[data-vp-choice="'+f.id+'"]');if(input)input.value=value}
   else{const radio=Array.from(form.querySelectorAll('[name="vp-'+f.id+'"]')).find(x=>x.value===value);if(radio)radio.checked=true}
  }
 }
 form.addEventListener('input',update);form.addEventListener('change',update);
 form.querySelectorAll('[data-vp-preset]').forEach(button=>button.addEventListener('click',()=>{
  const p=data.options.presets[Number(button.dataset.vpPreset)];
  if(!p)return;
  width.value=p.width_cm;height.value=p.height_cm;update();
 }));
 form.addEventListener('submit',event=>{
  event.preventDefault();const v=values();
  if(!v){update();status.textContent='Провери избраните варианти.';return}
  const details=summary(v);
  const result=window.VinilQuote.addDraft({id:data.id,name:data.name,type:'service',quantity:v.q,details});
  status.textContent=result.ok?'Добавено към общото запитване. Изборите и размерите са запазени.':result.error;
  if(result.ok)status.scrollIntoView({block:'nearest',behavior:'smooth'});
 });
 $('#vp-config-share').addEventListener('click',async()=>{
  const v=values();if(!v)return;
  const u=new URL(location.href);
  for(const key of Array.from(u.searchParams.keys()))if(key.startsWith('vp_'))u.searchParams.delete(key);
  u.searchParams.set('vp_w',String(v.w));u.searchParams.set('vp_h',String(v.h));u.searchParams.set('vp_q',String(v.q));
  for(const field of fields)u.searchParams.set('vp_'+field.id,v.selections[field.id]);
  share.value=u.toString();
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard not available');await navigator.clipboard.writeText(share.value);status.textContent='Връзката е копирана. Съдържа само избраните варианти.'}
  catch{share.focus();share.select();status.textContent='Връзката е готова — копирай я от полето.'}
 });
 applyUrl();update();
})();
