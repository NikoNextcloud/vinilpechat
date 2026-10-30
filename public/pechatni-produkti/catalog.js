'use strict';
(function(){
 const byId=id=>document.getElementById(id);
 const grid=byId('vp-grid'),groups=byId('vp-groups'),search=byId('vp-search'),sort=byId('vp-sort'),status=byId('vp-status');
 if(!grid||!window.VinilQuote)return;
 let all=[],categories=[],selected='all';
 const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el};
 function picture(product,index){
  const frame=make('a','vp-art vp-art-image');frame.href='/pechatni-produkti/'+product.slug;
  frame.setAttribute('aria-label','Подробности за '+product.name);
  const img=make('img','vp-picture');
  img.src=product.image;img.alt=product.image_alt;img.width=960;img.height=640;
  img.loading=index<3?'eager':'lazy';img.decoding='async';
  frame.append(img);
  return frame;
 }
 function card(p,index){
  const el=make('article','vp-card');el.dataset.service=p.id;
  el.append(picture(p,index));
  const body=make('div','vp-card-body');
  body.append(make('small','vp-cat',p.category));
  const h3=make('h3','vp-title');const title=make('a','vp-title-link',p.name);title.href='/pechatni-produkti/'+p.slug;h3.append(title);body.append(h3);
  body.append(make('p','vp-desc',p.description));
  const supplier=Number(p.supplier_price);
  const listed=Number(p.price);
  const selling=p.supplier_price!=null&&Number.isFinite(supplier)?(supplier>=10?Math.round((supplier+10)*100)/100:null):p.price!=null&&Number.isFinite(listed)?listed:null;
  const offer=make('div','vp-availability',selling==null?'По запитване':selling.toLocaleString('bg-BG',{style:'currency',currency:'EUR'}));
  body.append(offer);
  const detail=make('a','vp-detail','Виж подробности и размери ↗');detail.href='/pechatni-produkti/'+p.slug;body.append(detail);
  const controls=make('div','vp-card-actions');
  const label=make('label','vp-qty-label','Брой');
  const input=make('input','vp-qty');input.type='number';input.min='1';input.max='1000';input.step='1';input.value='1';input.setAttribute('aria-label','Количество за '+p.name);label.append(input);controls.append(label);
  const button=make('button','vp-add','Бързо запитване +');button.type='button';
  button.addEventListener('click',()=>{
   const value=Number(input.value);const result=window.VinilQuote.addDraft({id:p.id,name:p.name,type:'service',quantity:value,details:'Бързо запитване. Размери и варианти ще бъдат уточнени при офертата.'});
   if(!result.ok){status.textContent=result.error;return}
   status.textContent='Добавено: '+p.name+'. Можеш да добавиш още изделия или да отвориш общото запитване.';
   button.textContent='✓ Добавено';setTimeout(()=>{if(button.isConnected)button.textContent='+ Към запитването'},1700);
  });
  controls.append(button);body.append(controls);el.append(body);return el;
 }
 function renderFilters(){
  groups.replaceChildren();
  for(const value of ['all',...categories]){
   const button=make('button','vp-group'+(selected===value?' active':''));button.type='button';button.dataset.group=value;
   button.setAttribute('aria-pressed',String(selected===value));
   const count=value==='all'?all.length:all.filter(x=>x.category===value).length;
   button.append(make('span','',value==='all'?'Всички изделия':value),make('small','',String(count)));
   button.addEventListener('click',()=>{selected=value;renderFilters();render()});groups.append(button);
  }
 }
 function render(){
  const q=search.value.trim().toLocaleLowerCase('bg-BG');
  const shown=all.filter(x=>(selected==='all'||x.category===selected)&&(!q||(x.name+' '+x.description+' '+x.category).toLocaleLowerCase('bg-BG').includes(q)));
  if(sort.value==='name')shown.sort((a,b)=>a.name.localeCompare(b.name,'bg'));
  status.textContent='Показани '+shown.length+' от '+all.length+' изделия · за индивидуална оферта';
  grid.replaceChildren(...shown.map((p,i)=>card(p,i)));
  if(!shown.length)grid.append(make('p','vp-empty','Няма съвпадения. Опитай друга дума.'));
 }
 search.addEventListener('input',render);sort.addEventListener('change',render);
 (async()=>{try{
  const r=await fetch('/pechatni-produkti/catalog.json',{cache:'no-store'});
  if(!r.ok)throw new Error('HTTP '+r.status);
  const data=await r.json();
  if(!Array.isArray(data.categories)||!Array.isArray(data.items)||data.items.length===0)throw new Error('Невалиден каталог');
  categories=data.categories;all=data.items;renderFilters();render();
 }catch(err){status.textContent='Каталогът не може да се зареди. Опитай да презаредиш страницата.';console.warn('Print service catalog:',err.message)}})();
})();
