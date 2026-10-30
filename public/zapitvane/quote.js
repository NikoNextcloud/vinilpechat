'use strict';
(function(){
 const Q=window.VinilQuote,byId=id=>document.getElementById(id);
 if(!Q)return;
 const list=byId('vp-selected-items'),count=byId('vp-item-count'),empty=byId('vp-empty');
 const status=byId('vp-server-status'),submit=byId('vp-submit'),files=byId('vp-files'),fileStatus=byId('vp-file-status');
 let ordersReady=false,selectedFiles=[];
 const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el};
 function render(){
  const items=Q.read();count.textContent=String(items.length);
  empty.hidden=items.length>0;list.replaceChildren();
  items.forEach((it,i)=>{
   const row=make('div','vp-item'),left=make('div','vp-item-copy');
   left.append(make('strong','',it.name),make('small','',it.details||'По запитване'));
   const controls=make('div','vp-item-controls');
   const input=make('input');input.type='number';input.min='1';input.max='1000';input.step='1';input.value=String(it.quantity);
   input.setAttribute('aria-label','Количество за '+it.name);
   input.addEventListener('change',()=>{if(!Q.setQuantity(i,input.value)){input.value=String(it.quantity);status.textContent='Въведи количество от 1 до 1000.'}else render()});
   const remove=make('button','','Премахни');remove.type='button';remove.addEventListener('click',()=>{Q.removeAt(i);render()});
   controls.append(input,remove);row.append(left,controls);list.append(row);
  });
  submit.disabled=!ordersReady||items.length===0;
 }
 function attachmentNotes(){return selectedFiles.length?'Файлове (не са изпратени автоматично): '+selectedFiles.map(x=>x.name+' ('+Math.round(x.size/1024)+' KB)').join(', '):''}
 function specification(){
  const notes=(new FormData(byId('vp-request-form')).get('notes')||'').toString().trim();
  return [Q.format(),notes?'Допълнителни уточнения: '+notes:'',attachmentNotes()].filter(Boolean).join('\n');
 }
 files.addEventListener('change',()=>{
  const arr=Array.from(files.files||[]);
  const valid=arr.length<=4&&arr.every(f=>['application/pdf','image/png','image/jpeg','image/webp'].includes(f.type)&&f.size>0&&f.size<=15*1024*1024);
  if(!valid){files.value='';selectedFiles=[];fileStatus.textContent='До четири PDF/JPG/PNG/WebP файла, максимум 15 MB всеки.';return}
  selectedFiles=arr.map(x=>({name:x.name.replace(/[\u0000-\u001f]/g,'').slice(0,90),size:x.size}));
  fileStatus.textContent=selectedFiles.length?selectedFiles.map(x=>x.name).join(' · ')+' — файловете НЕ са изпратени.':'Няма избрани файлове.';
 });
 byId('vp-download').addEventListener('click',()=>{
  const blob=new Blob([specification()],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='vinilpechat-v4-specifikatsia.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 byId('vp-copy').addEventListener('click',async()=>{
  const text=specification();
  try{await navigator.clipboard.writeText(text);status.textContent='Спецификацията е копирана.'}
  catch{status.textContent='За да копираш спецификацията, използвай бутона „Изтегли“. '}
 });
 byId('vp-request-form').addEventListener('submit',async event=>{
  event.preventDefault();
  if(!ordersReady||Q.read().length===0)return;
  const text=specification();
  if(text.length>2900){status.textContent='Твърде дълга спецификация. Съкрати бележките или намали позициите.';return}
  const data=new FormData(event.currentTarget),name=String(data.get('name')||'').trim(),phone=String(data.get('phone')||'').trim(),email=String(data.get('email')||'').trim();
  if(name.length<2||phone.length<5)return;
  submit.disabled=true;status.textContent='Изпращане на заявката…';
  try{
   const response=await fetch('/api/orders',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({kind:'contact',name,phone,email,message:text})});
   const result=await response.json();
   if(!response.ok||!result.ok||!result.order_id)throw new Error(result.error||'Заявката не е приета');
   Q.clear();render();byId('vp-confirm').hidden=false;
   byId('vp-confirm').textContent='Заявката е приета с номер '+result.order_id+'. Файловете за печат не са качени; изпрати ги отделно.';
   event.currentTarget.reset();selectedFiles=[];fileStatus.textContent='Няма избрани файлове.';
   status.textContent='Заявката е успешно записана.';
  }catch(err){status.textContent='Заявката НЕ е изпратена: '+err.message}
  finally{submit.disabled=!ordersReady||Q.read().length===0}
 });
 async function check(){
  try{
   const r=await fetch('/api/health',{cache:'no-store'}),j=await r.json();
   ordersReady=!!(r.ok&&j.ordersReady);
   status.textContent=ordersReady?'Готово за изпращане. Файловете се изпращат отделно.':'Онлайн заявките не са активни. Можеш да изтеглиш спецификацията и да я изпратиш във Viber.';
  }catch{ordersReady=false;status.textContent='Няма връзка със сървъра. Използвай спецификацията за Viber.'}
  render();
 }
 render();check();window.addEventListener('vinilpechat-quote-update',render);
})();
