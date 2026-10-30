'use strict';
/* Shared price-free inquiry draft; stores no customer information or artwork. */
(function(root){
 const KEY='vinilpechat-v4-inquiry-draft',LIMIT=30;
 const clean=(v,n=600)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,n);
 const qty=n=>Number.isInteger(Number(n))&&Number(n)>=1&&Number(n)<=1000?Number(n):null;
 function read(){
  try{
   const raw=JSON.parse(root.localStorage.getItem(KEY)||'[]');
   return Array.isArray(raw)?raw.filter(x=>x&&/^[a-z0-9-]{2,90}$/i.test(x.id)&&x.name&&qty(x.quantity)&&['service','material','vinyl','shirt'].includes(x.type))
    .slice(0,LIMIT).map(x=>({id:clean(x.id,90),name:clean(x.name,120),type:x.type,quantity:qty(x.quantity),details:clean(x.details)})):[];
  }catch{return []}
 }
 function write(items){
  try{root.localStorage.setItem(KEY,JSON.stringify(items));root.dispatchEvent(new CustomEvent('vinilpechat-quote-update'));return true}catch{return false}
 }
 function addDraft(input){
  const id=clean(input?.id,90),name=clean(input?.name,120),type=['service','material','vinyl','shirt'].includes(input?.type)?input.type:'service';
  const quantity=qty(input?.quantity),details=clean(input?.details);
  if(!/^[a-z0-9-]{2,90}$/i.test(id)||!name||!quantity)return {ok:false,error:'Провери продукта и количеството.'};
  const arr=read(),same=arr.find(x=>x.id===id&&x.details===details&&x.type===type);
  if(same){if(same.quantity+quantity>1000)return {ok:false,error:'Прекалено голямо количество.'};same.quantity+=quantity}
  else{if(arr.length>=LIMIT)return {ok:false,error:'Можеш да добавиш до 30 позиции.'};arr.push({id,name,type,quantity,details})}
  return write(arr)?{ok:true,count:arr.length}:{ok:false,error:'Браузърът блокира локалното съхранение.'};
 }
 function removeAt(i){const arr=read();if(!Number.isInteger(i)||i<0||i>=arr.length)return false;arr.splice(i,1);return write(arr)}
 function setQuantity(i,n){const arr=read(),v=qty(n);if(!v||!arr[i])return false;arr[i].quantity=v;return write(arr)}
 function format(){
  const arr=read();return ['[Vinilpechat V4] Комбинирано запитване']
   .concat(arr.map((x,i)=>String(i+1)+'. '+x.name+' — '+x.quantity+' бр.'+(x.details?' | '+x.details:'')))
   .concat(['Цените, техническите параметри и сроковете подлежат на потвърждение.','Няма автоматично прикачени файлове; клиентът ги изпраща отделно.']).join('\n');
 }
 const count=()=>read().reduce((a,b)=>a+b.quantity,0);
 const update=()=>root.document.querySelectorAll('[data-v4-quote-count]').forEach(x=>{x.textContent=String(count())});
 root.addEventListener('vinilpechat-quote-update',update);root.addEventListener('storage',update);
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',update);else update();
 root.VinilQuote={read,addDraft,removeAt,setQuantity,clear:()=>write([]),format,count,KEY};
})(window);
