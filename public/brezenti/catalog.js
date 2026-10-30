'use strict';
/* V3 material catalog — uses the existing public Supabase-backed catalog and cart format. */
(()=>{
 const grid=document.getElementById('cover-grid');
 if(!grid)return;
 const el=id=>document.getElementById(id);
 const count=el('cover-count'),total=el('cover-total'),status=el('cover-status');
 const search=el('cover-search'),sort=el('cover-sort'),categoriesNode=el('cover-categories');
 const money=n=>Number(n).toLocaleString('bg-BG',{style:'currency',currency:'EUR'});
 const productUrl=window.VinilProductLinks?.productUrl;
 if(!productUrl){status.textContent='Каталогът не може да се зареди. Опитай презареждане.';return;}
 const fallback='/assets/placeholder.svg';
 const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 const safeImage=p=>{
  const image=[p.image,...(Array.isArray(p.images)?p.images:[])].find(v=>typeof v==='string'&&v&&!v.includes('id-preview--')&&!v.includes('placeholder'));
  if(!image)return fallback;
  try{const url=new URL(image,location.origin);return ((url.protocol==='https:'||url.origin===location.origin)&&!url.username&&!url.password)?url.href:fallback;}catch{return fallback;}
 };
 const hasVariants=p=>Array.isArray(p.supplier_options)&&p.supplier_options.length>0;
 const priceFor=p=>{
  if(hasVariants(p)){
   const prices=(p.variants||[]).filter(v=>v.active!==false&&v.sale_price!==null&&v.sale_price!==undefined&&Number.isFinite(Number(v.sale_price))&&Number(v.sale_price)>=0).map(v=>Number(v.sale_price));
   return prices.length?Math.min(...prices):null;
  }
  const x=p.sale_price;
  return x===null||x===undefined||x===''||!Number.isFinite(Number(x))||Number(x)<0?null:Number(x);
 };
 let products=[],categories=[],chosen='all',toastTimer;
 const updateCartBadge=()=>{
  const badge=el('cover-cart-badge');if(!badge)return;
  try{
   const arr=JSON.parse(localStorage.getItem('vinyl-cart')||'[]');
   badge.textContent=String(Array.isArray(arr)?arr.reduce((sum,x)=>sum+(Number(x.qty)||0),0):0);
  }catch{badge.textContent='0'}
 };
 updateCartBadge();window.addEventListener('storage',updateCartBadge);
 const categoryName=id=>categories.find(c=>c.id===id)?.name||'Материали';
 const categoryButtons=()=>{
  categoriesNode.replaceChildren();
  const entries=[{id:'all',name:'Всички продукти'},...categories.filter(c=>products.some(p=>p.category===c.id))];
  for(const c of entries){
   const amount=c.id==='all'?products.length:products.filter(p=>p.category===c.id).length;
   const button=create('button','cover-category'+(chosen===c.id?' active':''));button.type='button';
   button.dataset.coverCat=c.id;button.setAttribute('aria-pressed',String(chosen===c.id));
   button.append(create('span','',c.name),create('small','',String(amount)));categoriesNode.append(button);
  }
 };
 function notify(message){
  const elToast=el('cover-toast');clearTimeout(toastTimer);elToast.textContent=message;elToast.hidden=false;
  toastTimer=setTimeout(()=>elToast.hidden=true,3300);
 }
 function addToCart(p){
  if(hasVariants(p)){location.assign('/#item-'+encodeURIComponent(String(p.id)));return;}
  if(priceFor(p)===null){location.assign(productUrl(p));return;}
  let cart=[];try{const saved=JSON.parse(localStorage.getItem('vinyl-cart')||'[]');if(Array.isArray(saved))cart=saved.filter(x=>x&&Number.isInteger(Number(x.id))&&Number(x.qty)>0);}catch{}
  const item=cart.find(x=>Number(x.id)===Number(p.id)&&!x.variant_key);
  if(item)item.qty=Number(item.qty)+1;else cart.push({id:p.id,qty:1,variant:'',variant_key:''});
  try{localStorage.setItem('vinyl-cart',JSON.stringify(cart));updateCartBadge();notify('Добавено в количката: '+p.name);}catch{notify('Количката не може да бъде запазена.');}
 }
 const openInteractiveDetail=(event,p)=>{
  if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  // Normal click keeps the existing full variant selector and cart; the final URL is the readable permalink.
  location.assign('/#item-'+encodeURIComponent(String(p.id)));
 };
 const card=p=>{
  const item=create('article','cover-product');item.dataset.productId=String(p.id);
  const url=productUrl(p),photo=create('a','cover-photo');photo.href=url;photo.setAttribute('aria-label','Отвори '+p.name);
  const image=create('img');image.alt=p.name;image.loading='lazy';image.decoding='async';image.src=safeImage(p);
  image.addEventListener('error',()=>{if(!image.dataset.fallback){image.dataset.fallback='1';image.src=fallback;}});
  photo.addEventListener('click',event=>openInteractiveDetail(event,p));
  photo.append(image);item.append(photo);
  const body=create('div','cover-content');
  body.append(create('span','cover-product-category',categoryName(p.category)));
  const title=create('a','cover-product-title',p.name);title.href=url;title.addEventListener('click',event=>openInteractiveDetail(event,p));body.append(title);
  const description=create('p','cover-product-desc',String(p.description||'').slice(0,195));body.append(description);
  const details=create('a','cover-detail','Подробности за продукта ↗');details.href=url;details.addEventListener('click',event=>openInteractiveDetail(event,p));body.append(details);
  const footer=create('div','cover-product-footer');
  const price=priceFor(p),priceBox=create('div','cover-price-stack');
  priceBox.append(create('strong','cover-price',price===null?'По запитване':(hasVariants(p)?'От ':'')+money(price)));
  priceBox.append(create('small','cover-price-unit',price!==null?'/ '+String(p.unit||'бр.'):'Цена при запитване'));
  footer.append(priceBox);
  if(hasVariants(p)){
   const btn=create('button','cover-add','Избери размер ↗');btn.type='button';
   btn.addEventListener('click',()=>addToCart(p));footer.append(btn);
  }else if(price!==null){
   const btn=create('button','cover-add','+ Добави');btn.type='button';
   btn.addEventListener('click',()=>addToCart(p));footer.append(btn);
  }else{
   const btn=create('a','cover-add','Запитване ↗');btn.href=url;footer.append(btn);
  }
  const quote=document.createElement('button');quote.type='button';quote.className='v4-cover-quote';quote.textContent='+ Към общото запитване';
  quote.addEventListener('click',()=>{
   const result=window.VinilQuote?.addDraft({id:'material-'+p.id,type:'material',name:p.name,quantity:1,details:'Материал · '+categoryName(p.category)+' · Вариант и цена по запитване'});
   notify(result?.ok?'Добавено към общото запитване.':result?.error||'Списъкът е недостъпен.');
  });
  body.append(footer,quote);item.append(body);return item;
 };
 const render=()=>{
  const term=search.value.trim().toLocaleLowerCase('bg-BG');
  const view=products.filter(p=>(chosen==='all'||p.category===chosen)&&
   (!term||[p.name,p.description,categoryName(p.category)].join(' ').toLocaleLowerCase('bg-BG').includes(term)));
  if(sort.value==='price_up')view.sort((a,b)=>(priceFor(a)??Infinity)-(priceFor(b)??Infinity));
  if(sort.value==='price_down')view.sort((a,b)=>(priceFor(b)??-1)-(priceFor(a)??-1));
  if(sort.value==='name')view.sort((a,b)=>a.name.localeCompare(b.name,'bg'));
  count.textContent='Показани '+view.length+' продукта';
  status.textContent=view.length?'':'Няма продукти по избраните критерии.';
  grid.replaceChildren(...view.map(card));
  for(const button of categoriesNode.querySelectorAll('[data-cover-cat]')){
   const active=button.dataset.coverCat===chosen;button.classList.toggle('active',active);
   button.setAttribute('aria-pressed',String(active));
  }
 };
 categoriesNode.addEventListener('click',event=>{
  const button=event.target.closest('[data-cover-cat]');if(!button)return;chosen=button.dataset.coverCat;render();
 });
 search.addEventListener('input',render);sort.addEventListener('change',render);
 (async()=>{
  try{
   const response=await fetch('/api/catalog',{credentials:'same-origin',headers:{Accept:'application/json'},cache:'no-store'});
   if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(!Array.isArray(data.products)||!Array.isArray(data.categories))throw Error('Невалиден отговор');
   products=data.products.filter(p=>p&&p.active!==false);
   categories=data.categories;
   total.textContent=products.length+' продукта';
   categoryButtons();render();
  }catch(error){
   status.textContent='Неуспешно зареждане на каталога. Моля, опитай отново или отвори основния каталог.';
   const a=create('a','','Отвори каталога →');a.href='/#catalog';status.append(' ',a);
   count.textContent='Каталогът е недостъпен';
   console.warn('Vinilpechat cover catalog loading failed:',error.message);
  }
 })();
})();
