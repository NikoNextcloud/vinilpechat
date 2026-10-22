'use strict';
/* Vinilpechat 2.0 — progressive enhancement over the Stedman catalog. */
(()=>{
 if(!document.getElementById('models')||typeof models==='undefined')return;
 const el=id=>document.getElementById(id);
 const money2=n=>Number(n).toLocaleString('bg-BG',{style:'currency',currency:'EUR'});
 const checkedSizes=new Map();
 const ORDER=['3XS','2XS','XS','S','M','L','XL','2XL','3XL','4XL','5XL'];
 const classifications=[
  ['Тениски',m=>/t-shirt|classic-t|comfort-t|lux-t|stretch-t|cotton touch|ben |megan |morgan /i.test(m.name)&&!/polo|hoodie|fleece|jacket|top|tank/i.test(m.name)],
  ['Поло',m=>/polo/i.test(m.name)],
  ['Суитшърти',m=>/hoodie|sweat.?shirt|sweatpants/i.test(m.name)],
  ['Спортни',m=>/sports|mesh|seamless|tank top/i.test(m.name)],
  ['Якета и елеци',m=>/jacket|vest|fleece|softshell|scuba/i.test(m.name)]
 ];
 const categoryOf=m=>classifications.find(([,check])=>check(m))?.[0]||'Други';
 let activeCategory='Всички';
 const catalog=document.getElementById('catalog-view');
 const categories=document.createElement('div');
 categories.id='v2-categories';categories.className='v2-categories';
 categories.setAttribute('aria-label','Категории на облеклото');
 catalog.querySelector('.catalog-tools').before(categories);
 const categoryNames=['Всички',...classifications.map(x=>x[0]),'Други'];
 const counts=new Map(categoryNames.map(name=>[name,name==='Всички'?models.length:models.filter(m=>categoryOf(m)===name).length]));
 const oldRenderModels=renderModels;
 renderModels=function(){
   oldRenderModels();
   let count=0;
   for(const card of el('models').querySelectorAll('[data-model]')){
     const m=models.find(x=>x.id===card.dataset.model);
     const visible=activeCategory==='Всички'||categoryOf(m)===activeCategory;
     card.hidden=!visible;
     if(visible)count++;
   }
   const info=el('model-count');
   if(info)info.textContent=count+' модела от общо '+models.length;
 };
 categories.innerHTML=categoryNames.filter(c=>counts.get(c)).map(c=>
  '<button type="button" data-shirt-cat="'+c+'" aria-pressed="'+(c==='Всички')+'">'+
  c+' <span>'+counts.get(c)+'</span></button>').join('');
 categories.addEventListener('click',event=>{
   const button=event.target.closest('[data-shirt-cat]');if(!button)return;
   activeCategory=button.dataset.shirtCat;
   for(const b of categories.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));
   renderModels();
 });

 const sizeSelect=el('size'),oldSizeLabel=document.querySelector('label[for="size"]');
 const qty=el('quantity'),oldQtyLabel=document.querySelector('label[for="quantity"]');
 for(const legacy of [sizeSelect,oldSizeLabel,qty,oldQtyLabel])legacy?.classList.add('v2-legacy-hidden');
 const sizePanel=document.createElement('section');
 sizePanel.className='v2-size-panel';
 sizePanel.innerHTML='<div class="v2-section-head"><div><strong>Количество по размери</strong><small>Можеш да комбинираш различни размери в една заявка.</small></div><span class="v2-chip">До 500 бр.</span></div>'+
   '<div id="v2-sizes" class="v2-sizes"></div><p class="hint" id="v2-size-hint">Избери поне един размер.</p>';
 el('colour').after(sizePanel);
 sizePanel.addEventListener('input',e=>{
  const input=e.target.closest('[data-v2-size]');if(!input)return;
  const value=Number(input.value);
  if(!Number.isInteger(value)||value<0||value>300){input.setCustomValidity('Въведи между 0 и 300 бр.');}else input.setCustomValidity('');
  checkedSizes.set(input.dataset.v2Size,value);
  describe();
 });

 function sizesForGroup(label){
  const [start,end]=label.split('-');
  const from=ORDER.indexOf(start),to=end?ORDER.indexOf(end):from;
  return from<0||to<from?[]:ORDER.slice(from,to+1);
 }
 function availableSizes(){
  if(!selected)return [];
  const group=color()?.group;
  return [...new Set(selected.groups.filter(g=>typeof g[group]==='number').flatMap(g=>sizesForGroup(g.label)))];
 }
 function unitForSize(size,printed){
  const group=color()?.group;
  const band=selected?.groups.find(g=>sizesForGroup(g.label).includes(size)&&typeof g[group]==='number');
  if(!band)return null;
  return Math.round(band[group]*200)+printed;
 }
 function printCents(){
   return (artwork.front.url?200:0)+(artwork.back.url?200:0);
 }
 function currentLines(){
  if(!selected)return [];
  const printed=printCents();
  return [...checkedSizes.entries()].filter(([size,count])=>availableSizes().includes(size)&&Number.isInteger(count)&&count>0&&count<=300)
   .map(([size,quantity])=>({size,quantity,unitCents:unitForSize(size,printed)}));
 }
 function quantityTotal(){return currentLines().reduce((sum,row)=>sum+row.quantity,0)}
 function orderTotalCents(){return currentLines().reduce((sum,row)=>sum+row.quantity*row.unitCents,0)}
 function renderSizes(){
  const sizes=availableSizes();
  for(const key of [...checkedSizes.keys()])if(!sizes.includes(key))checkedSizes.delete(key);
  if(![...checkedSizes.values()].some(v=>v>0)&&sizes.length)checkedSizes.set(sizes.includes('M')?'M':sizes[0],1);
  el('v2-sizes').innerHTML=sizes.map(size=>'<label class="v2-size-cell"><span>'+size+'</span>'+
   '<input data-v2-size="'+size+'" aria-label="Бройки размер '+size+'" min="0" max="300" step="1" type="number" inputmode="numeric" value="'+(checkedSizes.get(size)||0)+'">'+
   '<small>'+money2(unitForSize(size,printCents())/100)+'/бр.</small></label>').join('');
  describe();
 }

 const summary=document.createElement('div');summary.id='v2-order-summary';
 summary.className='v2-order-summary';
 el('total-price').closest('.totals').after(summary);
 const form=document.createElement('form');
 form.id='v2-order-form';form.className='v2-checkout';
 form.innerHTML='<div class="v2-section-head"><div><strong>Изпрати заявка</strong><small>Логата се прикачват към заявката, а не само във Viber.</small></div><span class="v2-chip">Стъпка 3 от 3</span></div>'+
 '<div class="v2-field-grid"><label>Име и фамилия <input name="name" maxlength="120" autocomplete="name" required placeholder="Вашето име"></label>'+
 '<label>Телефон за връзка <input name="phone" maxlength="40" autocomplete="tel" required placeholder="08..."></label>'+
 '<label>Имейл (по желание) <input name="email" maxlength="255" autocomplete="email" type="email" placeholder="name@example.com"></label>'+
 '<label class="v2-honeypot" aria-hidden="true">Фирмен сайт <input name="website" autocomplete="off" tabindex="-1"></label>'+
 '</div><label>Бележки към поръчката<textarea name="notes" maxlength="1200" rows="3" placeholder="Уточнения за печата, доставката или цветовете"></textarea></label>'+
 '<label class="v2-consent"><input name="consent" type="checkbox" required><span>Съгласен/съгласна съм данните ми да се използват за обработка на тази заявка. <a href="/#privacy" target="_blank" rel="noopener">Поверителност</a></span></label>'+
 '<button id="v2-place-order" type="submit" class="v2-primary">Изпрати заявка с файловете →</button>'+
 '<p id="v2-order-feedback" role="status" aria-live="polite" class="v2-feedback"></p>'+
 '<button id="v2-viber" type="button" class="secondary">Или направи запитване във Viber</button>';
 el('download-request').before(form);
 for(const old of ['download-request','viber','copy-request','request-text','message-hint'])el(old)?.classList.add('v2-legacy-hidden');

 const transformControls=document.createElement('div');
 transformControls.className='v2-transform';
 transformControls.innerHTML='<label for="v2-rotation">Завъртане на щампата <span id="v2-rotation-label">0°</span></label>'+
 '<input id="v2-rotation" type="range" min="-180" max="180" step="5" value="0">'+
 '<div class="v2-transform-buttons"><button id="v2-center-art" class="secondary" type="button">Центрирай щампата</button>'+
 '<button id="v2-reset-art" class="secondary" type="button">Нулирай позицията</button></div>'+
 '<p class="hint">Хвани и премести щампата директно върху изображението. Работи и с пръст на телефон.</p>';
 el('art-y').closest('.sliders').after(transformControls);
 const zone=el('print-zone');
 zone.setAttribute('role','group');zone.setAttribute('tabindex','0');
 zone.setAttribute('aria-label','Област за печат. Стрелките местят щампата.');
 const originalUpdateArt=updateArt;
 updateArt=function(){
  originalUpdateArt();
  const current=artwork[activeSide];
  const img=el('artwork');
  img.style.transform='translate(-50%,-50%) rotate('+(current.rotation||0)+'deg)';
  if(el('v2-rotation')){
   el('v2-rotation').value=current.rotation||0;
   el('v2-rotation-label').textContent=(current.rotation||0)+'°';
  }
 };
 const originalSetSide=setSide;
 setSide=function(side){originalSetSide(side);updateArt();};
 let pointerID=null;
 function pointerMove(e){
  if(!artwork[activeSide].url)return;
  const rect=zone.getBoundingClientRect();
  const x=Math.round(100*(e.clientX-rect.left)/rect.width);
  const y=Math.round(100*(e.clientY-rect.top)/rect.height);
  const a=artwork[activeSide];
  a.x=Math.max(0,Math.min(100,x));a.y=Math.max(0,Math.min(100,y));
  el('art-x').value=a.x;el('art-y').value=a.y;
  updateArt();
 }
 zone.addEventListener('pointerdown',e=>{
  if(!artwork[activeSide].url)return;
  e.preventDefault();pointerID=e.pointerId;zone.setPointerCapture(pointerID);pointerMove(e);
 });
 zone.addEventListener('pointermove',e=>{if(pointerID===e.pointerId)pointerMove(e);});
 for(const eventName of ['pointerup','pointercancel','lostpointercapture'])
  zone.addEventListener(eventName,()=>{pointerID=null;});
 zone.addEventListener('keydown',e=>{
  if(!artwork[activeSide].url||!/^Arrow/.test(e.key))return;
  e.preventDefault();const a=artwork[activeSide],step=e.shiftKey?5:1;
  if(e.key==='ArrowLeft')a.x=Math.max(0,a.x-step);
  if(e.key==='ArrowRight')a.x=Math.min(100,a.x+step);
  if(e.key==='ArrowUp')a.y=Math.max(0,a.y-step);
  if(e.key==='ArrowDown')a.y=Math.min(100,a.y+step);
  el('art-x').value=a.x;el('art-y').value=a.y;updateArt();
 });
 el('v2-rotation').addEventListener('input',e=>{
  artwork[activeSide].rotation=Number(e.target.value);updateArt();
 });
 el('v2-center-art').addEventListener('click',()=>{
  artwork[activeSide].x=50;artwork[activeSide].y=45;
  el('art-x').value=50;el('art-y').value=45;updateArt();
 });
 el('v2-reset-art').addEventListener('click',()=>{
  Object.assign(artwork[activeSide],{size:62,x:50,y:40,rotation:0});
  el('art-size').value=62;el('art-x').value=50;el('art-y').value=40;updateArt();
 });

 const oldDescribe=describe;
 describe=function(){
  if(!selected)return;
  const lines=currentLines(),totalQty=quantityTotal(),totalCents=orderTotalCents();
  const valid=totalQty>0&&totalQty<=500&&!Array.from(el('v2-sizes').querySelectorAll('input')).some(x=>!x.checkValidity());
  sizeSelect.value=lines[0]?.size||availableSizes()[0]||'';
  qty.value=String(totalQty||1);
  oldDescribe();
  const printing=printCents();
  el('print-price').textContent=money2(printing/100);
  el('front-price').textContent=money2(artwork.front.url?2:0);
  el('back-price').textContent=money2(artwork.back.url?2:0);
  el('base-price').textContent='според размера';
  el('unit-price').textContent='според размера';
  el('total-price').textContent=valid?money2(totalCents/100):'Избери размери';
  el('v2-size-hint').textContent=valid?totalQty+' бр. в '+lines.length+' размера':'Избери поне един размер (до 500 бр. общо).';
  summary.innerHTML=lines.length?'<div class="v2-summary-heading">Разбивка на цената</div>'+
   lines.map(line=>'<div class="v2-summary-line"><span>'+line.size+' · '+line.quantity+' бр. × '+money2(line.unitCents/100)+'</span><strong>'+money2(line.unitCents*line.quantity/100)+'</strong></div>').join(''):'';
  for(const input of el('v2-sizes').querySelectorAll('[data-v2-size]')){
   const price=unitForSize(input.dataset.v2Size,printing);
   const text=input.closest('label')?.querySelector('small');
   if(text&&price!=null)text.textContent=money2(price/100)+'/бр.';
  }
  el('v2-place-order').disabled=!valid;
  el('v2-viber').disabled=!valid;
  const text='Здравейте! Запитване за Stedman '+selected.id+' — '+selected.bg+
   '\nЦвят: '+color()?.name+'\nРазмери: '+lines.map(l=>l.size+': '+l.quantity+' бр.').join(', ')+
   '\nЩампа отпред: '+(artwork.front.url?'+2 €/бр.':'няма')+
   '\nЩампа отзад: '+(artwork.back.url?'+2 €/бр.':'няма')+
   '\nОбщо: '+money2(totalCents/100)+' ('+totalQty+' бр.)'+
   '\nМоля потвърдете наличност, доставка и крайна цена.';
  el('request-text').value=text;
 };
 const intro=document.querySelector('.intro');
 const originalOpenModel=openModel;
 openModel=function(id){
  checkedSizes.clear();
  originalOpenModel(id);
  if(intro)intro.hidden=true;
  renderSizes();
  el('v2-order-feedback').textContent='';
  form.reset();
  const label=el('model-heading');
  label.dataset.v2='true';
 };
 el('colour').addEventListener('change',()=>{renderSizes();});
 for(const side of ['front','back']){
  el(side+'-upload').addEventListener('change',e=>{
   const file=e.target.files?.[0];
   if(file&&file.size>1500*1024){
    clearArtwork(side);alert('За запис на заявката файлът трябва да бъде до 1,5 MB. За по-голямо лого използвай Viber.');
    describe();
   }
  });
 }
 function formData(){
  const contact=new FormData(form);
  const lines=currentLines();
  return {
   model_id:selected.id,color_code:color().code,
   sizes:lines.map(x=>({size:x.size,quantity:x.quantity})),
   prints:Object.fromEntries(['front','back'].filter(side=>artwork[side].url).map(side=>[side,{
    position:Object.fromEntries(['x','y','size','rotation'].map(p=>[p,artwork[side][p]??0]))
   }])),
   name:String(contact.get('name')||'').trim(),phone:String(contact.get('phone')||'').trim(),
   email:String(contact.get('email')||'').trim(),notes:String(contact.get('notes')||'').trim(),
   website:String(contact.get('website')||'').trim(),consent:contact.get('consent')==='on'
  };
 }
 const toBase64=file=>new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(new Error('Файлът не може да се прочете'));
  reader.onload=()=>resolve(String(reader.result).split(',')[1]);
  reader.readAsDataURL(file);
 });
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const feedback=el('v2-order-feedback'),button=el('v2-place-order');
  const request=formData();
  if(!request.sizes.length){feedback.textContent='Избери размер и количество.';return;}
  button.disabled=true;feedback.textContent='Проверка на цената и записване на щампите...';
  try{
   for(const side of ['front','back']){
    if(!request.prints[side])continue;
    const file=el(side+'-upload').files[0];
    if(!file)throw new Error('Липсва оригиналният файл за '+(side==='front'?'лицето':'гърба'));
    if(file.size>1500*1024)throw new Error('Файлът е над 1,5 MB');
    request.prints[side].file={mime:file.type,name:file.name,base64:await toBase64(file)};
   }
   const response=await fetch('/api/shirts/order',{
    method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});
   const result=await response.json().catch(()=>({error:'Невалиден отговор от сървъра'}));
   if(!response.ok)throw new Error(result.error||'Заявката не е записана');
   if(!result.ok||!result.order_id)throw new Error('Липсва номер на заявката');
   feedback.classList.add('v2-success');
   feedback.textContent='Заявката е записана успешно! Номер: '+result.order_id+'. Ще се свържем с теб за потвърждение.';
   button.textContent='Заявка № '+result.order_id+' ✓';
   button.disabled=true;
  }catch(error){
   feedback.classList.remove('v2-success');
   feedback.textContent='Неуспешно изпращане: '+error.message+'. Не е потвърдена поръчка. Можеш да пишеш във Viber.';
   button.disabled=false;
  }
 });
 el('v2-viber').addEventListener('click',()=>{
  if(!selected||quantityTotal()<1)return;
  const text=el('request-text').value;
  navigator.clipboard?.writeText(text).catch(()=>{});
  el('v2-order-feedback').textContent='Текстът е подготвен за копиране във Viber. Изпрати изображенията отделно в чата.';
  window.location.href='viber://chat?number=%2B359879436006';
 });
 const origShowCatalog=showCatalog;
 showCatalog=function(){origShowCatalog();if(intro)intro.hidden=false;activeCategory='Всички';renderModels();
  categories.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.shirtCat==='Всички')));};
 // If a model was preselected through the URL, ensure V2 quantities are initialized.
 if(selected){checkedSizes.set(availableSizes().includes('M')?'M':availableSizes()[0],1);renderSizes();}
 renderModels();
})();