'use strict';
/* Cover products come from the same public catalog and retail prices as the main store. */
(()=>{
 const list=document.getElementById('cover-grid');
 if(!list)return;
 const count=document.getElementById('cover-count');
 const status=document.getElementById('cover-status');
 const search=document.getElementById('cover-search');
 const category=document.getElementById('cover-category');
 const COVER_WORDS=/винил|брезент|покрив|платн|меш|мреж|зебло|найлон|обков|кристал|pvc|ленти|агротекстил/i;
 const allowedIds=new Set(['bilbord','mesh','lenti','kristal','tir','zeblo','nailon','obkov']);
 const eur=n=>Number(n).toLocaleString('bg-BG',{style:'currency',currency:'EUR'});
 const txt=(type,className,text)=>{const el=document.createElement(type);if(className)el.className=className;el.textContent=text;return el;};
 let products=[],categories=[],activeCategory='all';
 const safeImage=p=>{
  const raw=[p.image,...(Array.isArray(p.images)?p.images:[])].find(x=>typeof x==='string'&&x&&!x.includes('id-preview--')&&!x.includes('placeholder'));
  if(!raw)return '/assets/placeholder.svg';
  try{
   const u=new URL(raw,location.origin);
   return ((u.protocol==='https:'||u.origin===location.origin)&&!u.username&&!u.password)?u.href:'/assets/placeholder.svg';
  }catch{return '/assets/placeholder.svg';}
 };
 const minRetail=p=>{
  if(Array.isArray(p.supplier_options)&&p.supplier_options.length){
   const prices=(p.variants||[]).filter(v=>v.active!==false&&v.sale_price!==null&&v.sale_price!==undefined&&Number.isFinite(Number(v.sale_price))).map(v=>Number(v.sale_price));
   return prices.length?Math.min(...prices):null;
  }
  return p.sale_price!==null&&p.sale_price!==undefined&&Number.isFinite(Number(p.sale_price))?Number(p.sale_price):null;
 };
 const card=p=>{
  const el=txt('article','cover-product','');
  const href='/#item-'+encodeURIComponent(String(p.id));
  const photo=document.createElement('a');photo.className='cover-photo';photo.href=href;photo.setAttribute('aria-label','Отвори '+p.name);
  const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt=p.name;img.src=safeImage(p);
  img.addEventListener('error',()=>{if(!img.dataset.fallback){img.dataset.fallback='1';img.src='/assets/placeholder.svg';}});
  photo.append(img);el.append(photo);
  const meta=document.createElement('div');meta.className='cover-content';
  const label=categories.find(c=>c.id===p.category)?.name||'Покривни материали';
  meta.append(txt('small','cover-product-category',label));
  const title=txt('a','cover-product-title',p.name);title.href=href;meta.append(title);
  const desc=txt('p','cover-product-desc',String(p.description||'').slice(0,145));meta.append(desc);
  const footer=document.createElement('div');footer.className='cover-product-footer';
  const retail=minRetail(p);
  const quote=txt('span','cover-price',retail===null?'По запитване':(p.supplier_options?.length?'От ':'')+eur(retail));
  const note=txt('small','cover-price-note',retail===null?'Цена при запитване':p.price_verification_needed?'Цената се потвърждава':'Ориентировъчна цена');
  const stack=document.createElement('span');stack.className='cover-price-stack';stack.append(quote,note);footer.append(stack);
  const go=txt('a','cover-open',p.supplier_options?.length?'Избери вариант ↗':'Виж продукта ↗');go.href=href;footer.append(go);
  meta.append(footer);el.append(meta);return el;
 };
 const render=()=>{
  const term=search.value.toLocaleLowerCase('bg-BG').trim();
  const shown=products.filter(p=>(activeCategory==='all'||p.category===activeCategory)&&
   (!term||(p.name+' '+(p.description||'')+' '+(categories.find(c=>c.id===p.category)?.name||'')).toLocaleLowerCase('bg-BG').includes(term)));
  count.textContent=shown.length+' продукта';
  status.textContent=shown.length?'':'Няма продукти по избраните критерии.';
  list.replaceChildren(...shown.map(card));
 };
 category.addEventListener('change',()=>{activeCategory=category.value;render();});
 search.addEventListener('input',render);
 (async()=>{
  try{
   const response=await fetch('/api/catalog',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
   if(!response.ok)throw new Error('Каталогът временно не е достъпен');
   const data=await response.json();
   if(!Array.isArray(data.products)||!Array.isArray(data.categories))throw new Error('Каталогът върна невалидни данни');
   categories=data.categories.filter(c=>allowedIds.has(String(c.id).toLowerCase())||COVER_WORDS.test(c.name||''));
   const ids=new Set(categories.map(c=>c.id));
   products=data.products.filter(p=>p.active!==false&&ids.has(p.category));
   for(const c of categories){
    if(!products.some(p=>p.category===c.id))continue;
    const option=document.createElement('option');option.value=c.id;option.textContent=c.name;category.append(option);
   }
   render();
  }catch(error){
   count.textContent='Няма връзка';
   status.textContent='Каталогът временно не може да се зареди. Опитай презареждане или използвай страницата за контакти.';
   console.warn('Cover catalog unavailable:',error.message);
  }
 })();
})();