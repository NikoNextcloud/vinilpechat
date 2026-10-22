'use strict';
/* Vinilpechat 2.0 — progressive enhancement over the Stedman catalog. */
(()=>{
 if(!document.getElementById('models')||typeof models==='undefined')return;
 const el=id=>document.getElementById(id);
 const money2=n=>Number(n).toLocaleString('bg-BG',{style:'currency',currency:'EUR'});
 const checkedSizes=new Map();
 const retailPrices=new Map();
 let pricingReady=false;
 let orderBackendReady=false;
 const retailKey=(model,band,group)=>JSON.stringify([model,band,group]);
 const saleCents=(model,band,group,supplierPrice)=>{
  const custom=retailPrices.get(retailKey(model,band,group));
  return custom===undefined?Math.round(supplierPrice*200):Math.round(custom*100);
 };
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
   for(const card of el('models').querySelectorAll('[data-model]')){
     const m=models.find(x=>x.id===card.dataset.model);
     if(!m)continue;
     const prices=m.groups.flatMap(band=>Object.entries(band)
      .filter(([group,cost])=>group!=='label'&&typeof cost==='number')
      .map(([group,cost])=>saleCents(m.id,band.label,group,cost)));
     const labels=card.querySelectorAll('.tag');
     if(prices.length&&labels.length)labels[labels.length-1].textContent='От '+money2(Math.min(...prices)/100);
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


 // Visible product-detail controls: print placement, real checked colors and photography.
 let printMode='none';
 let selectedShade=null;
 let galleryView='front';
 const UNIVERSAL_BACK_PHOTO='/teniski/assets/universal-back-white.webp';
 const STEDMAN_COLORS=[
  {code:'WHI',group:'WHI',name:'Бяло',css:'#f9f9f6'},
  {code:'BLO',group:'COL',name:'Черно',css:'#171717'},
  {code:'GYH',group:'MEL',name:'Сив меланж',css:'#989e9c'},
  {code:'BMD',group:'DIP',name:'Dip Dye',css:'linear-gradient(135deg,#7396bb 50%,#e6f0f3 50%)'}
 ];
 function shadeOptions(model){
  if(!model)return [];
  const allowed=new Set(model.colors.map(c=>c.group));
  const special=(typeof stedmanDetails!=='undefined'?stedmanDetails[model.id]?.shades:null);
  let shades=special?.length?special.filter(c=>allowed.has(c.group)).map(c=>({
   ...c,photo:model.packshots?.[c.code]||'https://www.stedman.eu/public/images/products/2026/'+model.id+'/'+model.id+'_'+c.code+'.jpg'
  })):[];
  if(!shades.length){
   shades=STEDMAN_COLORS.filter(c=>model.packshots?.[c.code]).map(item=>{
     const group=item.code==='GYH'&&!allowed.has('MEL')?'COL':item.group;
     return {...item,group,photo:model.packshots[item.code]};
   }).filter(c=>allowed.has(c.group));
  }
  const swatchGroup=new Set(shades.map(x=>x.group));
  const fallbacks={WHI:{name:'Бяло',css:'#f9f9f6'},
   COL:{name:'Друг цвят — по запитване',css:'linear-gradient(135deg,#435779 0 35%,#b82340 36% 68%,#1f7c69 69%)'},
   MEL:{name:'Меланж — по запитване',css:'#9ca1a3'},
   DIP:{name:'Dip Dye — по запитване',css:'linear-gradient(#98bed1 50%,#51708a 50%)'}};
  for(const group of allowed)if(!swatchGroup.has(group)){
   shades.push({code:group,group,name:fallbacks[group]?.name||group,
    css:fallbacks[group]?.css||'#eee',photo:model.photoFront||model.image});
  }
  return shades;
 }
 function renderSwatches(){
  if(!selected)return;
  const shades=shadeOptions(selected);
  const buttons=el('v2-color-swatches');
  buttons.innerHTML=shades.map(shade=>
   '<button type="button" data-shade="'+shade.code+'" style="--swatch:'+shade.css+
   '" aria-pressed="'+(selectedShade?.code===shade.code)+'" aria-label="'+escapeText(shade.name)+
   '" title="'+escapeText(shade.name)+'"><span class="v2-swatch-check" aria-hidden="true">✓</span></button>').join('');
  el('v2-selected-color').textContent=selectedShade?.name||'Избери цвят';
  el('v2-color-note').textContent=selectedShade?.code===selectedShade?.group&&
   !selected.packshots?.[selectedShade?.code]?
   'Конкретният оттенък ще бъде уточнен преди изпълнение.':'Цветът и наличните размери зависят от модела.';
 }
 function updateMiniPhotos(){
  const front=selectedShade?.photo||selected?.photoFront||selected?.image||'/teniski/shirt-placeholder.svg';
  el('v2-mini-front').src=front;el('v2-mini-front-both').src=front;
  el('v2-mini-back').src=UNIVERSAL_BACK_PHOTO;
 }
 function galleryItems(){
  if(!selected)return [];
  const shades=shadeOptions(selected);
  const base=[{mode:'model',label:'На модел',src:selected.image},
   {mode:'front',label:'Отпред',src:selectedShade?.photo||selected.photoFront||selected.image},
   {mode:'back',label:'Бял гръб',src:UNIVERSAL_BACK_PHOTO}];
  return [...base,...shades.filter(sh=>sh.photo).map(sh=>({
   mode:'shade',code:sh.code,label:sh.name,src:sh.photo
  }))];
 }
 function syncGallerySelection(){
  const thumbs=el('v2-gallery-thumbs');
  for(const button of thumbs.querySelectorAll('button')){
   const chosen=button.dataset.galleryMode==='shade'?
    galleryView==='front'&&button.dataset.galleryShade===selectedShade?.code:
    button.dataset.galleryMode===galleryView;
   button.setAttribute('aria-pressed',String(chosen));
  }
 }
 function renderGallery(){
  if(!selected)return;
  const pictures=galleryItems();
  el('v2-gallery-count').textContent=pictures.length+' снимки / изгледи';
  el('v2-gallery-thumbs').innerHTML=pictures.map(item=>
    '<button type="button" data-gallery-mode="'+item.mode+'" '+
    (item.code?'data-gallery-shade="'+item.code+'" ':'')+
    'aria-label="'+escapeText(item.label)+'" aria-pressed="false">'+
    '<img loading="lazy" src="'+item.src+'" alt="'+escapeText(item.label)+'">'+
    '<span>'+escapeText(item.label)+'</span></button>').join('');
  syncGallerySelection();
 }
 function applyShade(next){
  if(!selected||!next)return;
  selectedShade=next;galleryView='front';
  el('colour').value=next.group;
  // Keep the original price-group logic and mixed-size validator synchronized.
  el('colour').dispatchEvent(new Event('change',{bubbles:true}));
  setSide('front');
  renderSwatches();renderGallery();renderSizeGuide();updateMiniPhotos();describe();
 }
 el('v2-color-swatches').addEventListener('click',event=>{
  const button=event.target.closest('[data-shade]');
  if(button)applyShade(shadeOptions(selected).find(sh=>sh.code===button.dataset.shade));
 });
 el('v2-gallery-thumbs').addEventListener('click',event=>{
  const button=event.target.closest('[data-gallery-mode]');if(!button)return;
  if(button.dataset.galleryMode==='shade'){
   applyShade(shadeOptions(selected).find(sh=>sh.code===button.dataset.galleryShade));return;
  }
  if(button.dataset.galleryMode==='model'){
   setSide('front');galleryView='model';updateShirtImage();syncGallerySelection();
  }else setSide(button.dataset.galleryMode);
 });
 el('v2-gallery-thumbs').addEventListener('error',event=>{
  const img=event.target;
  if(img?.tagName==='IMG'&&!img.dataset.fallback){img.dataset.fallback='1';img.src='/teniski/shirt-placeholder.svg'}
 },true);
 function renderSizeGuide(){
  if(!selected)return;
  const data=typeof stedmanDetails!=='undefined'?stedmanDetails[selected.id]:null;
  const guide=el('v2-size-table');
  const sizes=availableSizes();
  if(data?.sizeChart){
   const chart=data.sizeChart;
   guide.innerHTML='<table><thead><tr><th>Мярка</th>'+
    chart.sizes.map(size=>'<th>'+escapeText(size)+'</th>').join('')+'</tr></thead><tbody>'+
    '<tr><td>Ширина (см)</td>'+chart.width.map(value=>'<td>'+value+'</td>').join('')+'</tr>'+
    '<tr><td>Дължина (см)</td>'+chart.length.map(value=>'<td>'+value+'</td>').join('')+'</tr></tbody></table>'+
    '<p>Размерите са публикувани от Stedman за този модел; възможни са производствени отклонения.</p>';
  }else{
   guide.innerHTML='<table><thead><tr><th>Размер</th><th>Тениска без печат</th></tr></thead><tbody>'+
    sizes.map(size=>'<tr><td>'+escapeText(size)+'</td><td>'+
     money2((unitForSize(size,0)||0)/100)+'</td></tr>').join('')+'</tbody></table>'+
    '<p>За точните ширина и дължина в сантиметри виж данните на производителя за конкретния модел.</p>'+
    '<p><a href="'+selected.source+'" target="_blank" rel="noopener noreferrer">Продуктът при Stedman ↗</a></p>';
  }
 }
 function setPrintMode(mode){
  if(!['none','front','both'].includes(mode))return;
  printMode=mode;
  for(const button of el('v2-print-choice').querySelectorAll('[data-print-mode]'))
   button.setAttribute('aria-pressed',String(button.dataset.printMode===mode));
  const frontActive=mode!=='none',backActive=mode==='both';
  for(const side of ['front','back']){
   const visible=side==='front'?frontActive:backActive;
   const input=el(side+'-upload');
   const label=document.querySelector('label[for="'+side+'-upload"]');
   input.hidden=!visible;
   if(label)label.hidden=!visible;
   if(!visible&&artwork[side].url)clearArtwork(side);
  }
  el('v2-artwork-hint').hidden=!frontActive;
  el('view-back').hidden=!backActive;
  el('shirt-preview').closest('.preview-pane').querySelector('.side-switch').hidden=!frontActive;
  const prompt=el('v2-print-prompt');
  prompt.textContent=mode==='none'?'Не е избран печат — доплащане 0,00 €. Избери вариант, ако искаш щампа.':
   mode==='front'?'Избран печат отпред: +3,00 € за брой. Качи логото, за да го позиционираш.':
   'Избран печат отпред и отзад: +6,00 € за брой. Можеш да качиш отделно лого за всяка страна.';
  if(!backActive&&activeSide==='back')setSide('front');
  if(mode==='none')setSide('front');
  zone.classList.toggle('v2-print-inactive',!frontActive);
  updateArt();
  describe();
 }
 el('v2-print-choice').addEventListener('click',event=>{
  const button=event.target.closest('[data-print-mode]');
  if(button)setPrintMode(printMode===button.dataset.printMode?'none':button.dataset.printMode);
 });

 const sizeSelect=el('size'),oldSizeLabel=document.querySelector('label[for="size"]');
 const qty=el('quantity'),oldQtyLabel=document.querySelector('label[for="quantity"]');
 for(const legacy of [sizeSelect,oldSizeLabel,qty,oldQtyLabel])legacy?.classList.add('v2-legacy-hidden');
 const sizePanel=document.createElement('section');
 sizePanel.className='v2-size-panel';
 sizePanel.innerHTML='<div class="v2-section-head"><div><strong>Количество по размери</strong><small>Можеш да комбинираш различни размери в една заявка.</small></div><span class="v2-chip">До 500 бр.</span></div>'+
   '<div id="v2-sizes" class="v2-sizes"></div><p class="hint" id="v2-size-hint">Избери поне един размер.</p>';
 el('v2-size-guide').after(sizePanel);
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
  return saleCents(selected.id,band.label,group,band[group])+printed;
 }
 function printCents(){
   return printMode==='both'?600:printMode==='front'?300:0;
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

 // Never pretend a preview without the production service key has saved an order.
 fetch('/api/health',{credentials:'same-origin'}).then(r=>r.json()).then(status=>{
   orderBackendReady=status.ordersReady===true;
   if(!orderBackendReady){
     el('v2-place-order').disabled=true;
     el('v2-place-order').textContent='Онлайн заявки — в подготовка';
     el('v2-order-feedback').textContent='В тази тестова среда файловете не се записват. Използвай бутона за Viber, ако искаш да обсъдим модела.';
   }
   describe();
 }).catch(()=>{
   orderBackendReady=false;
   el('v2-place-order').disabled=true;
   el('v2-order-feedback').textContent='Онлайн поръчките не са налични в момента. Може да изпратиш запитване във Viber.';
 });

 for(const old of ['download-request','viber','copy-request','request-text','message-hint'])el(old)?.classList.add('v2-legacy-hidden');

 // Direct manipulation only: drag to move, grab the discreet corner to resize,
 // mouse-wheel to zoom, two fingers on mobile to pinch-zoom. No slider controls.
 const zone=el('print-zone'),logo=el('artwork'),handle=el('v2-resize-handle');
 zone.setAttribute('role','group');
 zone.setAttribute('tabindex','0');
 zone.setAttribute('aria-label','Премести логото със стрелките. Увеличи с плюс, намали с минус, или използвай пръстите си.');
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 const canEdit=()=>printMode!=='none'&&!!artwork[activeSide].url&&
   galleryView!=='model'&&(activeSide!=='back'||printMode==='both');
 function placeResizeHandle(){
  if(!canEdit()||logo.hidden||!logo.getBoundingClientRect().width||zone.getBoundingClientRect().width===0){
   handle.hidden=true;return;
  }
  const imgRect=logo.getBoundingClientRect(),area=zone.getBoundingClientRect();
  handle.hidden=false;
  handle.style.left=clamp(imgRect.right-area.left,10,area.width-10)+'px';
  handle.style.top=clamp(imgRect.bottom-area.top,10,area.height-10)+'px';
  handle.setAttribute('aria-valuenow',String(Math.round(artwork[activeSide].size)));
  handle.title='Мащаб '+Math.round(artwork[activeSide].size)+'% · плъзни за увеличаване/намаляване';
 }
 const originalUpdateArt=updateArt;
 updateArt=function(){
  originalUpdateArt();
  const state=artwork[activeSide];
  logo.style.transform='translate(-50%,-50%) rotate('+(state.rotation||0)+'deg)';
  const editing=canEdit();
  zone.classList.toggle('v2-print-inactive',!editing);
  zone.classList.toggle('v2-has-logo',editing);
  el('remove-art').hidden=!editing;
  handle.hidden=!editing;
  requestAnimationFrame(placeResizeHandle);
 };
 logo.addEventListener('load',placeResizeHandle);
 window.addEventListener('resize',placeResizeHandle);
 const originalUpdateShirtImage=updateShirtImage;
 updateShirtImage=function(){
  originalUpdateShirtImage();
  if(!selected)return;
  const photo=galleryView==='model'?selected.image:
   activeSide==='back'?UNIVERSAL_BACK_PHOTO:
   (selectedShade?.photo||selected.photoFront||selected.image);
  el('shirt-photo').src=photo;
  el('shirt-photo').alt=galleryView==='model'?selected.bg+' върху модел':
   activeSide==='back'?'Бяла тениска, изглед отзад, предоставен от клиента':
   selected.bg+' · '+(selectedShade?.name||'избран цвят');
  el('preview-side-label').textContent=galleryView==='model'?'Продуктова снимка на модел':
   activeSide==='back'?'Универсална бяла тениска отзад · само за разположение на щампата':
   'Преглед на печата отпред · '+(selectedShade?.name||'');
  zone.classList.toggle('v2-preview-hidden',galleryView==='model');
  updateArt();
 };
 const originalSetSide=setSide;
 setSide=function(side){
  galleryView=side==='back'?'back':'front';
  originalSetSide(side);
  updateArt();
  syncGallerySelection();
 };

 const pointers=new Map();
 let gesture=null;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const midpoint=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
 function updateLocation(x,y){
  const r=zone.getBoundingClientRect();
  const art=artwork[activeSide];
  art.x=clamp(Math.round((x-r.left)/r.width*100),0,100);
  art.y=clamp(Math.round((y-r.top)/r.height*100),0,100);
  el('art-x').value=art.x;
  el('art-y').value=art.y;
  updateArt();
 }
 function resize(size){
  if(!canEdit())return;
  const art=artwork[activeSide];
  art.size=clamp(Math.round(size),15,100);
  el('art-size').value=art.size;
  updateArt();
 }
 function startPinch(){
  const [a,b]=[...pointers.values()];
  const art=artwork[activeSide];
  gesture={type:'pinch',fromDistance:Math.max(distance(a,b),1),
   fromSize:art.size,fromMid:midpoint(a,b),fromX:art.x,fromY:art.y};
 }
 zone.addEventListener('pointerdown',event=>{
  if(!canEdit())return;
  event.preventDefault();
  const pt={x:event.clientX,y:event.clientY};
  pointers.set(event.pointerId,pt);
  zone.setPointerCapture(event.pointerId);
  if(pointers.size>=2){startPinch();return;}
  const r=zone.getBoundingClientRect(),image=logo.getBoundingClientRect();
  if(event.target.closest('#v2-resize-handle')){
   gesture={type:'resize',startX:pt.x,startY:pt.y,startSize:artwork[activeSide].size,
    zoneWidth:Math.max(r.width,1),zoneHeight:Math.max(r.height,1)};
  }else{
   const inside=pt.x>=image.left&&pt.x<=image.right&&pt.y>=image.top&&pt.y<=image.bottom;
   const center={x:r.left+(artwork[activeSide].x/100)*r.width,
    y:r.top+(artwork[activeSide].y/100)*r.height};
   gesture={type:'move',offsetX:inside?pt.x-center.x:0,offsetY:inside?pt.y-center.y:0};
   if(!inside)updateLocation(pt.x,pt.y);
  }
 });
 zone.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId)||!canEdit())return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
  if(pointers.size>=2){
   if(gesture?.type!=='pinch')startPinch();
   const [a,b]=[...pointers.values()];
   const mid=midpoint(a,b);
   resize(gesture.fromSize*distance(a,b)/gesture.fromDistance);
   const area=zone.getBoundingClientRect();
   updateLocation(area.left+gesture.fromX/100*area.width+mid.x-gesture.fromMid.x,
    area.top+gesture.fromY/100*area.height+mid.y-gesture.fromMid.y);
  }else if(gesture?.type==='resize'){
   const dx=(event.clientX-gesture.startX)/gesture.zoneWidth;
   const dy=(event.clientY-gesture.startY)/gesture.zoneHeight;
   resize(gesture.startSize+100*(dx+dy));
  }else if(gesture?.type==='move'){
   updateLocation(event.clientX-gesture.offsetX,event.clientY-gesture.offsetY);
  }
 });
 for(const name of ['pointerup','pointercancel','lostpointercapture']){
  zone.addEventListener(name,event=>{
   pointers.delete(event.pointerId);
   if(pointers.size>=2)startPinch();
   else gesture=null;
  });
 }
 zone.addEventListener('wheel',event=>{
  if(!canEdit())return;
  event.preventDefault();
  resize(artwork[activeSide].size*Math.exp(-event.deltaY*0.002));
 },{passive:false});
 function handleKeys(event){
  if(!canEdit())return;
  const key=event.key,step=event.shiftKey?5:1;
  const art=artwork[activeSide];
  if(['+','=','Add','ArrowUp'].includes(key)&&event.target===handle){
   event.preventDefault();resize(art.size+step);return;
  }
  if(['-','Subtract','ArrowDown'].includes(key)&&event.target===handle){
   event.preventDefault();resize(art.size-step);return;
  }
  if(['+','=','Add','-','Subtract'].includes(key)){
   event.preventDefault();resize(art.size+(['-','Subtract'].includes(key)?-step:step));return;
  }
  if(!/^Arrow/.test(key))return;
  event.preventDefault();
  if(key==='ArrowLeft')art.x=clamp(art.x-step,0,100);
  if(key==='ArrowRight')art.x=clamp(art.x+step,0,100);
  if(key==='ArrowUp')art.y=clamp(art.y-step,0,100);
  if(key==='ArrowDown')art.y=clamp(art.y+step,0,100);
  el('art-x').value=art.x;el('art-y').value=art.y;updateArt();
 }
 zone.addEventListener('keydown',handleKeys);
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
  el('front-price').textContent=money2(printMode==='none'?0:3);
  el('back-price').textContent=money2(printMode==='both'?3:0);
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
  el('v2-place-order').disabled=!valid||!orderBackendReady||!pricingReady;
  el('v2-viber').disabled=!valid;
  const text='Здравейте! Запитване за Stedman '+selected.id+' — '+selected.bg+
   '\nЦвят: '+(selectedShade?.name||color()?.name)+'\nРазмери: '+lines.map(l=>l.size+': '+l.quantity+' бр.').join(', ')+
   '\nПечат: '+(printMode==='both'?'отпред и отзад (+6 €/бр.)':printMode==='front'?'само отпред (+3 €/бр.)':'без щампа (0 €)')+
   '\nОбщо: '+money2(totalCents/100)+' ('+totalQty+' бр.)'+
   '\nМоля потвърдете наличност, доставка и крайна цена.';
  el('request-text').value=text;
 };
 const intro=document.querySelector('.intro');
 const originalOpenModel=openModel;
 openModel=function(id){
  checkedSizes.clear();selectedShade=null;galleryView='front';printMode='none';
  el('v2-size-guide').open=false;
  originalOpenModel(id);
  if(intro)intro.hidden=true;
  const shades=shadeOptions(selected);
  selectedShade=shades[0]||null;
  if(selectedShade){
   el('colour').value=selectedShade.group;
   el('colour').dispatchEvent(new Event('change',{bubbles:true}));
  }
  setPrintMode('none');
  renderSwatches();updateMiniPhotos();renderGallery();renderSizeGuide();renderSizes();
  updateShirtImage();
  el('v2-order-feedback').textContent='';
  form.reset();
  const label=el('model-heading');
  label.dataset.v2='true';
 };
 el('colour').addEventListener('change',()=>{renderSizes();renderSizeGuide();});
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
   shade_code:selectedShade?.code||color().code,
   print_mode:printMode,
   prints:Object.fromEntries((printMode==='both'?['front','back']:printMode==='front'?['front']:[]).map(side=>[side,{
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
  e.preventDefault();if(!orderBackendReady||!form.reportValidity())return;
  const feedback=el('v2-order-feedback'),button=el('v2-place-order');
  const request=formData();
  if(!request.sizes.length){feedback.textContent='Избери размер и количество.';return;}
  const requiredSides=printMode==='both'?['front','back']:printMode==='front'?['front']:[];
  const missing=requiredSides.find(side=>!el(side+'-upload').files?.length);
  if(missing){
   feedback.textContent='Качи логото '+(missing==='front'?'отпред':'отзад')+' за избраната печатна опция.';
   return;
  }
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
 if(selected)openModel(selected.id);
 renderModels();
 // Fetch only public retail overrides. Supplier costs are never returned to shoppers.
 fetch('/api/shirts/prices',{credentials:'same-origin',cache:'no-store'}).then(async response=>{
  if(!response.ok)throw new Error('Цените временно не са достъпни');
  return response.json();
 }).then(result=>{
  if(!Array.isArray(result.prices))throw new Error('Невалиден отговор за цените');
  retailPrices.clear();
  for(const row of result.prices){
   if(typeof row.model_id!=='string'||typeof row.size_band!=='string'||
      typeof row.color_group!=='string'||typeof row.sale_price!=='number'||
      !Number.isFinite(row.sale_price)||row.sale_price<0)continue;
   retailPrices.set(retailKey(row.model_id,row.size_band,row.color_group),row.sale_price);
  }
  pricingReady=true;
  renderModels();
  if(selected){renderSizes();renderSizeGuide();describe()}
 }).catch(error=>{
  console.warn('Shirt retail prices are unavailable:',error.message);
  const feedback=el('v2-order-feedback');
  if(feedback)feedback.textContent='Не можем да потвърдим цените в момента. Можеш да направиш запитване във Viber.';
  describe();
 });
})();
