'use strict';
const $=s=>document.querySelector(s);
const escaped=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const euro=v=>v==null?'По запитване':Number(v).toLocaleString('bg-BG',{style:'currency',currency:'EUR'});
const demo=!['http:','https:'].includes(location.protocol);
let db=structuredClone(window.SEED_DATA||{products:[],categories:[],settings:{},orders:[]});
let state={cat:'all',q:'',sort:'default',cart:JSON.parse(localStorage.getItem('vinyl-cart')||'[]'),isAdmin:false,csrf:'',adminTab:'products',detail:null};
let useServer=false;
let ordersReady=false;
const missingImage='/assets/placeholder.svg';
const fallback=p=>'/assets/placeholder.svg';
const absoluteImagePath=raw=>{
 if(!raw)return missingImage;
 const s=String(raw);
 return /^(?:https?:|data:|blob:|\/)/i.test(s)?s:'/'+s.replace(/^\.\//,'');
};
const src=p=>p.image&&!p.image.includes('id-preview--')?absoluteImagePath(p.image):fallback(p);
const errImg=(img,id)=>{img.onerror=null;img.src='/assets/placeholder.svg';img.classList.add('fallback')};
const images=p=>[p.image,...(p.images||[])].filter(v=>v&&!v.includes('id-preview--')).map(absoluteImagePath);
const getProduct=id=>db.products.find(x=>x.id===Number(id));
let changedVariants=new Set();
const hasOptions=p=>Array.isArray(p?.supplier_options)&&p.supplier_options.length>0;
const getVariant=(p,key)=>(p?.variants||[]).find(v=>(v.variant_key||v.key)===key && v.active!==false);
const rowPrice=(p,key)=>hasOptions(p)?getVariant(p,key)?.sale_price??null:p?.sale_price??null;
const retailDisplayPrice=p=>{if(!hasOptions(p))return p.sale_price;const prices=(p.variants||[]).filter(x=>x.active!==false&&x.sale_price!=null).map(x=>Number(x.sale_price));return prices.length?Math.min(...prices):null};
const selectionKey=(p)=>{const vals=[];for(let i=0;i<(p.supplier_options||[]).length;i++){const field=document.querySelector('[data-product-option="'+i+'"]');if(!field?.value)return '';vals.push(p.supplier_options[i].id+'='+field.value)}return vals.join('&')};
function refreshVariantPrice(){const p=getProduct(state.detail);if(!p||!hasOptions(p))return;const el=$('#detail-variant-price');if(!el)return;const key=selectionKey(p);const v=key?getVariant(p,key):null;el.textContent=!key?'Избери размер за цена':v?.sale_price!=null?euro(v.sale_price):'По запитване';}

const supplierURL=p=>{try{const u=new URL(p.source||'');if(u.protocol!=='https:')return '';if(['vipborsa.com','www.vipborsa.com'].includes(u.hostname))return u.pathname==='/index.php'&&u.searchParams.get('route')==='product/product'&&u.searchParams.has('product_id')?u.href:'';if(['scorpioplast.com','www.scorpioplast.com'].includes(u.hostname))return u.pathname.split('/').filter(Boolean).length>=2&&!u.search&&!u.hash?u.href:'';return ''}catch{return ''}};
const getCat=id=>(db.categories.find(c=>c.id===id)||{}).name||id;

const seoSlug=v=>{
 const tr={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya','ѝ':'i'};
 return String(v||'').toLowerCase().split('').map(c=>tr[c]||c).join('').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90)||'produkt';
};
const seoProductHref=p=>'/produkti/'+encodeURIComponent(String(p.id))+'-'+seoSlug(p.name);
const seoCategoryHref=c=>'/kategorii/'+encodeURIComponent(String(c.id))+'-'+seoSlug(c.name);

const unit=p=>p.unit||'бр.';
function toast(t){let el=$('#toast');el.textContent=t;el.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.add('hidden'),3500)}
function persist(){localStorage.setItem('vinyl-cart',JSON.stringify(state.cart));$('#cart-count').textContent=state.cart.reduce((a,b)=>a+b.qty,0)}
async function request(url,opt={}){let resp=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json',...(state.csrf?{'X-CSRF-Token':state.csrf}:{})},...opt});let d=await resp.json().catch(()=>({error:'Невалиден отговор'}));if(!resp.ok)throw Error(d.error||'Грешка при заявката');return d}
async function load(){if(!demo){try{const [status,d]=await Promise.all([request('/api/health'),request('/api/catalog')]);if(d.products?.length){db={...db,...d};useServer=true;ordersReady=!!status.ordersReady}}catch(e){console.warn('Catalog loading failed:',e.message)}}$('#year').textContent=new Date().getFullYear();persist();navigate();
 if(new URLSearchParams(location.search).get('cart')==='open'){
  history.replaceState(null,'',location.pathname+location.hash);
  requestAnimationFrame(showCart);
 }
}
function go(which){
 if(location.pathname!=='/'){location.assign('/#'+encodeURIComponent(which));return}
 location.hash=which;
 document.getElementById('mobile-nav').classList.add('hidden');
}
let detailReturnUrl=null;
function navigate(){if(location.pathname.startsWith('/produkti/')&&state.detail!==null)return;let route=decodeURIComponent((location.hash||'#home').slice(1));const instagram=$('#instagram-posts');if(instagram)instagram.hidden=route==='admin';if(route.startsWith('item-')){renderHome();openDetail(Number(route.split('-')[1]));return}closeDialog();if(route==='design')renderDesignPage();else if(route==='home'||!route)renderChoiceLanding();else if(['contact','terms','delivery','privacy','admin'].includes(route)){if(route==='admin')renderAdmin();else renderPage(route)}else{renderHome();if(route==='catalog'){requestAnimationFrame(()=>$('#catalog')?.scrollIntoView({block:'start'}))}}window.scrollTo({top:0,behavior:'instant'})}

let currentDesignQuote=null;
let designQuoteSequence=0;
let designDebounce=null;
let designInquiryDraft='';
function renderChoiceLanding(){
 document.title='Печат на винил | Винили за покриване | Тениски за печат | Vinilpechat';
 $('#main').innerHTML=`<div class="v3-landing v3-simple-home">
 <section class="v3-primary-categories container" aria-labelledby="v3-primary-title">
  <div class="v3-primary-heading"><span class="v3-section-kicker">ТРИ НАЧИНА ДА РЕАЛИЗИРАШ ИДЕЯТА СИ</span><h1 id="v3-primary-title">Какво искаш да създадем?</h1><p>Избери услуга и премини директно към продуктите или калкулатора.</p></div>
  <div class="v3-primary-grid">
   <a class="v3-primary-card v3-primary-print" href="#design" data-go="design"><span class="v3-primary-number">01 / РЕКЛАМЕН ПЕЧАТ</span><span class="v3-primary-art" aria-hidden="true">▧</span><strong>Печат на винил</strong><span class="v3-primary-description">Рекламни банери по размер, със или без изработка на дизайн.</span><span class="v3-primary-cta">Изчисли цена <span aria-hidden="true">↗</span></span></a>
   <a class="v3-primary-card v3-primary-cover" href="/brezenti/"><span class="v3-primary-number">02 / ПОКРИВНИ МАТЕРИАЛИ</span><span class="v3-primary-art" aria-hidden="true">◫</span><strong>Винили за покриване</strong><span class="v3-primary-description">Брезенти, PVC платнища и материали за защита и покриване.</span><span class="v3-primary-cta">Разгледай винилите <span aria-hidden="true">↗</span></span></a>
   <a class="v3-primary-card v3-primary-shirts" href="/teniski/"><span class="v3-primary-number">03 / ПЕРСОНАЛЕН ПЕЧАТ</span><span class="v3-primary-art" aria-hidden="true">✦</span><strong>Тениски за печат</strong><span class="v3-primary-description">75 модела Stedman с избор на размер, цвят и собствена щампа.</span><span class="v3-primary-cta">Избери тениска <span aria-hidden="true">↗</span></span></a>
  </div>
 </section>
 </div>`;
}

const designFormat=n=>Number(n).toLocaleString('bg-BG',{maximumFractionDigits:2});
function renderDesignPage(){
 document.title='Печат на винил със или без дизайн | Vinilpechat';
 currentDesignQuote=null;
 $('#main').innerHTML=`<section class="container design-page">
 <nav class="design-breadcrumb" aria-label="Навигация"><a href="#home">Начало</a><span>›</span><span>Нов винил с дизайн</span></nav>
 <div class="design-layout">
 <div class="design-left">
  <span class="design-kicker">Рекламен винил · Печат по твой размер</span>
  <h1>Твоят дизайн.<br><em>Твоят размер.</em></h1>
  <p class="design-lead">Изчисли цена за нов винил по размер. Избери дали искаш да изготвим дизайн, след което изпрати запитване през Viber.</p>
  <div class="design-sample" aria-hidden="true"><div class="design-print-preview"><div class="design-preview-top">ТВОЯТА РЕКЛАМА</div><div class="design-preview-middle"><span>ИДЕЯ</span><strong>→</strong><span>ДИЗАЙН</span></div><div class="design-preview-bottom">ГОТОВ ВИНИЛ ПО РАЗМЕР</div></div></div>
  <div class="design-perks"><span>✓ Дизайн по желание</span><span>✓ Избираш точни размери</span><span>✓ Поръчката се потвърждава преди печат</span></div>
 </div>
 <div class="design-form-card" id="designCalculator">
   <div class="design-form-head"><span class="design-form-step">Калкулатор</span><h2>Размери на винила</h2><p>Въведи размерите в сантиметри.</p></div>
   <fieldset class="design-service-choice" aria-label="Услуга за дизайн"><legend>Желаеш ли изработка на дизайн?</legend><div class="design-service-options"><label class="design-service-option"><input type="radio" name="designService" value="with" data-design-field checked><span><strong>С дизайн</strong><small>+10 € за дизайн</small></span></label><label class="design-service-option"><input type="radio" name="designService" value="without" data-design-field><span><strong>Без дизайн</strong><small>Подготвен файл за печат</small></span></label></div></fieldset>
   <div class="design-measure-row">
    <div class="form-field"><label for="designWidth">Ширина (см)</label><input id="designWidth" data-design-field inputmode="decimal" type="number" min="1" max="5000" step="0.1" value="100" required></div>
    <div class="design-measure-times" aria-hidden="true">×</div>
    <div class="form-field"><label for="designHeight">Височина (см)</label><input id="designHeight" data-design-field inputmode="decimal" type="number" min="1" max="5000" step="0.1" value="100" required></div>
   </div>
   <div class="form-field"><label for="designQuantity">Количество (бр.)</label><input id="designQuantity" data-design-field inputmode="numeric" type="number" min="1" max="100" step="1" value="1" required></div>
   <div class="form-field"><label for="designNotes">Бележки към заявката <span class="design-optional">(по желание)</span></label><textarea id="designNotes" rows="3" maxlength="600" placeholder="Текст за дизайна или информация за готовия файл за печат."></textarea></div>
   <div class="design-price-summary" aria-live="polite" aria-atomic="true"><span>Цена за заявката</span><strong id="designTotal">Изчисляване...</strong><small id="designPriceNote">Минимална стойност на заявката: 20 €.</small></div>
   <div class="design-actions">
    <a class="primary-btn design-viber-button" id="designViberButton" href="${viberChatURL}" data-design-viber aria-disabled="true"><span aria-hidden="true">✆</span> Пиши във Viber <span aria-hidden="true">↗</span></a>
    <button type="button" class="outline-btn design-copy-button" data-design-copy>Копирай текста за Viber</button>
   </div>
   <div id="designInquiryPreview" class="design-inquiry-preview hidden"><label for="designViberMessage">Готов текст за Viber</label><textarea id="designViberMessage" rows="7" readonly></textarea><p>Копирай текста и го постави в чата във Viber, ако приложението не го попълни автоматично.</p></div>
   <div class="design-alternatives"><span>Друг начин за контакт:</span><a href="tel:+359879436006">Обади се: 0879 436 006</a><button type="button" data-design-web>Уеб запитване</button></div>
 </div>
 </div>
 </section>`;
 refreshDesignQuote();
}
function designDimensions(){
 const width=document.querySelector('#designWidth'),height=document.querySelector('#designHeight'),qty=document.querySelector('#designQuantity');
 if(!width?.checkValidity()||!height?.checkValidity()||!qty?.checkValidity())return null;
 return {width_cm:Number(width.value),height_cm:Number(height.value),quantity:Number(qty.value),with_design:document.querySelector('input[name="designService"]:checked')?.value!=='without'};
}
async function refreshDesignQuote(){
 const el=$('#designTotal'),note=$('#designPriceNote'),viber=$('#designViberButton'),preview=$('#designInquiryPreview');
 if(!el)return;
 const seq=++designQuoteSequence,dimensions=designDimensions();
 currentDesignQuote=null;
 if(preview)preview.classList.add('hidden');
 if(viber)viber.setAttribute('aria-disabled','true');
 if(!dimensions){el.textContent='Въведи валидни размери';note.textContent='Ширина и височина: 1–5000 см. Количество: 1–100 бр.';return}
 el.textContent='Изчисляване...';note.textContent='Минимална стойност на заявката: 20 €.';
 try{
   const q=await request('/api/design/quote',{method:'POST',body:JSON.stringify(dimensions)});
   if(seq!==designQuoteSequence||!$('#designTotal'))return;
   currentDesignQuote=q;
   el.textContent=euro(q.total_eur);
   note.textContent='Обща площ: '+designFormat(q.area_m2*q.quantity)+' м² • '+(q.includes_design?'С включен дизайн':'Без дизайн')+' • Минимум 20 €. Цената се потвърждава при запитване.';
   if(viber)viber.setAttribute('aria-disabled','false');
 }catch(err){
   if(seq!==designQuoteSequence||!$('#designTotal'))return;
   el.textContent='Цена временно недостъпна';
   note.textContent='Опитай отново или ни изпрати размерите чрез уеб запитването.';
 }
}
function designViberText(){
 const q=currentDesignQuote;
 if(!q)return '';
 const notes=($('#designNotes')?.value||'').trim().slice(0,600);
 return ['Здравейте! Искам нов винил.',
  'Дизайн: '+(q.includes_design?'С дизайн':'Без дизайн'),
  'Ширина: '+designFormat(q.width_cm)+' см',
  'Височина: '+designFormat(q.height_cm)+' см',
  'Количество: '+q.quantity+' бр.',
  'Обща площ: '+designFormat(q.area_m2*q.quantity)+' м²',
  'Изчислена обща цена: '+euro(q.total_eur),
  notes?'Уточнения: '+notes:'',
  'Моля, потвърдете цената, изработката и срока.'].filter(Boolean).join('\n');
}
function displayDesignViberMessage(){
 const text=designViberText();
 if(!text)return '';
 const el=$('#designViberMessage'),box=$('#designInquiryPreview');
 if(el)el.value=text;
 if(box)box.classList.remove('hidden');
 return text;
}
async function copyDesignViberMessage(){
 const message=displayDesignViberMessage();
 if(!message){toast('Първо въведи валидни размери и изчакай изчислението.');return}
 try{await navigator.clipboard.writeText(message);toast('Копирано! Постави текста във Viber.')}
 catch{const t=$('#designViberMessage');if(t){t.focus();t.select()}toast('Маркирай текста и го копирай, след което го постави във Viber.')}
}

function hero(){return `<section class="hero container"><div class="hero-banner"><div class="hero-copy"><span class="eyebrow">Надеждни материали • Голям избор</span><h1>Материали за <em>всяка идея.</em></h1><p>Винилни платна, PVC брезенти, кристал винил, зебло и консумативи — на едно място. Изберете материал и изпратете заявка.</p><button class="primary-btn" data-goto="catalog">Разгледай продуктите <span>↗</span></button></div><div class="hero-visual"><div class="roll one"></div><div class="roll two"></div><div class="tag-float">40 избрани продукта<small>Осем специализирани категории</small></div></div></div></section><section class="container perks"><div class="perk"><span class="perk-icon">◇</span><span><b>Широк избор от материали</b><small>Брезенти, винил, мрежи и фолиа</small></span></div><div class="perk"><span class="perk-icon">◫</span><span><b>Размери по заявка</b><small>Възможност за рязане според продукта</small></span></div><div class="perk"><span class="perk-icon">↗</span><span><b>Бързо запитване</b><small>Потвърждение на цена и вариант</small></span></div></section>`}
function catCards(){return `<section class="container"><div class="section-head"><div><span class="section-eyebrow">КАКВО ПРЕДЛАГАМЕ</span><h2 class="section-title">Разгледай по категория</h2><p class="section-sub">Точно това, което търсиш — подредено и лесно за избор.</p></div></div><div class="category-grid">${db.categories.map(c=>`<div class="seo-category-tile"><button class="category-card" data-catgo="${escaped(c.id)}"><span class="cat-glyph">${escaped(c.icon||'▧')}</span><span><div class="cat-name">${escaped(c.name)}</div><div class="cat-count">${db.products.filter(p=>p.category===c.id&&p.active).length} продукта ↗</div></span></button><a class="seo-category-link" href="${escaped(seoCategoryHref(c))}">Продуктова страница →</a></div>`).join('')}</div></section>`}
function filters(){let all=db.products.filter(x=>x.active);let p=all.filter(x=>(state.cat==='all'||x.category===state.cat)&&(`${x.name} ${x.description} ${getCat(x.category)}`).toLocaleLowerCase('bg-BG').includes(state.q.toLocaleLowerCase('bg-BG')));if(state.sort==='price_up')p.sort((a,b)=>(a.sale_price??Infinity)-(b.sale_price??Infinity));if(state.sort==='price_down')p.sort((a,b)=>(b.sale_price??-1)-(a.sale_price??-1));if(state.sort==='name')p.sort((a,b)=>a.name.localeCompare(b.name,'bg'));return p}
// Phone-number chats do not guarantee a prefilled draft; keep a copyable message.
const viberPhone='+359879436006';
const viberChatURL='viber://chat?number='+encodeURIComponent(viberPhone);
function viberProductMessage(p,v=null){
 const url=new URL(seoProductHref(p),location.origin);
 return ['Здравейте! Интересувам се от:',p.name,'Код на продукта: '+p.id,v?'Размер / вариант: '+v.label:'',url.href,'Моля за информация за цена и наличност.'].filter(Boolean).join('\n');
}
async function copyViberMessage(){
 const field=$('#viberMessage');if(!field)return;
 try{await navigator.clipboard.writeText(field.value);toast('Текстът е копиран. Постави го във Viber.')}catch{field.focus();field.select();toast('Маркирай и копирай текста, след това го постави във Viber.')}
}
function prepareViberInquiry(id){
 const p=getProduct(id);if(!p)return false;
 if(state.detail!==p.id)openDetail(p.id);
 let variant=null;
 if(hasOptions(p)){
  const key=selectionKey(p);if(!key){toast('Избери размер и вариант, после натисни „Пиши във Viber“.');return false}
  variant=getVariant(p,key);if(!variant){toast('Тази комбинация не е налична. Избери друг размер.');return false}
 }
 const panel=$('#viberInquiry'),field=$('#viberMessage');
 field.value=viberProductMessage(p,variant);panel.classList.remove('hidden');
 copyViberMessage();return true;
}

function productCard(p){return `<article class="product-card"><button class="product-photo" data-detail="${p.id}" aria-label="Отвори ${escaped(p.name)}"><img loading="lazy" decoding="async" width="320" height="240" src="${escaped(src(p))}" alt="${escaped(p.name)}" onerror="this.onerror=null;this.src='${escaped(fallback(p))}'" /></button><div class="product-content"><span class="product-category">${escaped(getCat(p.category))}</span><span class="product-status ${p.price_verification_needed?'is-verification':'is-listed'}">${p.price_verification_needed?'Цена за потвърждение':'В каталога'}</span><button data-detail="${p.id}" style="padding:0;text-align:left;border:0;background:transparent"><h3 class="product-name">${escaped(p.name)}</h3></button><p class="product-desc">${escaped(p.description)}</p><a class="seo-product-link" href="${escaped(seoProductHref(p))}" aria-label="Подробна страница за ${escaped(p.name)}">Подробности за продукта ↗</a></div><div class="product-foot"><div class="price ${p.sale_price==null?'ask':''}">${hasOptions(p)&&retailDisplayPrice(p)!=null?'от ':''}${euro(retailDisplayPrice(p))} ${retailDisplayPrice(p)==null?'':`<small>/ ${escaped(unit(p))}</small>`}</div>${!hasOptions(p)&&p.sale_price==null?`<a class="add-cart viber-btn" href="${viberChatURL}" data-viber-product="${p.id}" aria-label="Пиши във Viber за ${escaped(p.name)}">Пиши</a>`:`<button class="add-cart" data-add="${p.id}">${hasOptions(p)?'Избери размер ↗':'+ Добави'}</button>`}</div></article>`}
function catalog(){let p=filters();return `<section class="container catalog-section" id="catalog"><div class="section-head"><div><span class="section-eyebrow">ПРОДУКТОВ КАТАЛОГ</span><h2 class="section-title">Открий подходящия материал</h2><p class="section-sub">Преглед на предложенията. Крайната цена се потвърждава при заявката.</p></div><span class="pill">${db.products.filter(x=>x.active).length} продукта</span></div><div class="catalog-layout"><aside class="filter-sidebar"><h3>Категории</h3><div class="filter-options"><button class="filter-item ${state.cat==='all'?'active':''}" data-filter="all">Всички продукти <span class="count">${db.products.filter(p=>p.active).length}</span></button>${db.categories.map(c=>`<button class="filter-item ${state.cat===c.id?'active':''}" data-filter="${c.id}">${escaped(c.name)} <span class="count">${db.products.filter(p=>p.active&&p.category===c.id).length}</span></button>`).join('')}</div></aside><div><div class="catalog-tools"><label class="search-field"><span>⌕</span><input id="catalogSearch" type="search" placeholder="Търси винил, брезент, найлон..." value="${escaped(state.q)}"></label><select id="catalogSort" class="sort"><option value="default" ${state.sort==='default'?'selected':''}>Препоръчани</option><option value="price_up" ${state.sort==='price_up'?'selected':''}>Цена: възходяща</option><option value="price_down" ${state.sort==='price_down'?'selected':''}>Цена: низходяща</option><option value="name" ${state.sort==='name'?'selected':''}>По име</option></select></div><p class="results-hint">Показани ${p.length} продукта${state.cat!=='all'?' в '+escaped(getCat(state.cat)):''}</p><div class="products-grid" id="productGrid">${p.length?p.map(productCard).join(''):'<div class="empty">Няма продукти по избраните критерии.</div>'}</div></div></div></section>`}
function renderHome(){document.title='Винил & Брезенти | Продуктов каталог';$('#main').innerHTML=(!useServer?'<div class="preview-note container">ТЕСТОВ КАТАЛОГ — няма връзка с базата. Не изпращайте лични данни; поръчки не се приемат.</div>':!ordersReady?'<div class="preview-note container">Каталогът работи, но приемането на заявки все още се настройва. Моля, не изпращайте поръчки.</div>':'')+hero()+catalog()+`<section class="container cta"><div><h2>Не откри точния размер?</h2><p>Изпрати запитване с размери, материал и количество.</p></div><button class="primary-btn" data-goto="contact">Изпрати запитване ↗</button></section>`;}
function renderPage(route){let s=db.settings||{};let head={contact:['Контакти и запитвания','Имаш въпрос или индивидуална поръчка? Свържи се с нас.'],terms:['Общи условия','Информация за поръчките, цените и отговорностите.'],delivery:['Доставка и плащане','Уточняваме детайлите преди изпълнение на заявката.'],privacy:['Политика за поверителност','Информация за обработката на данни.']}[route];let body='';if(route==='contact'){body=`<div class="page-columns"><div class="form-card"><h2>Изпрати запитване</h2><p class="section-sub">Ще получиш потвърждение за крайна цена, размер и доставка.</p><form id="contactForm"><div class="form-field"><label>Име *</label><input name="name" required maxlength="120"></div><div class="field-row"><div class="form-field"><label>Телефон *</label><input name="phone" required maxlength="40"></div><div class="form-field"><label>Имейл</label><input type="email" name="email" maxlength="255"></div></div><div class="form-field"><label>Какво търсиш? *</label><textarea name="message" required>${escaped(designInquiryDraft)}</textarea></div><button type="submit" class="primary-btn">Изпрати запитване ↗</button><p class="form-note">Данните се използват единствено за обработка на запитването.</p></form></div><div class="contact-aside"><span class="eyebrow">ЗА КОНТАКТ</span><h2>Ще намерим правилния материал за твоя проект.</h2><p><b>Телефон:</b> ${escaped(s.phone||'Предстои попълване')}<br><b>Имейл:</b> ${escaped(s.email||'Предстои попълване')}<br><b>Адрес:</b> ${escaped(s.address||'Предстои попълване')}</p><p><a class="outline-btn viber-btn" href="${viberChatURL}">Пиши във Viber · 0879436006</a></p><p class="form-note">Отваря приложението Viber на устройството ти.</p></div></div>`}else{let paras={terms:['Цените в каталога са ориентировъчни и подлежат на потвърждение според конкретния размер, количество и наличност.','Договор за покупко-продажба възниква след изрично потвърждение на заявката от търговеца.','Данните на търговеца и пълните общи условия трябва да бъдат попълнени преди публично използване.'],delivery:[s.shipping||'Доставката и цената на транспорта се уточняват индивидуално.','Плащането се договаря с клиента при потвърждаване на заявката. Няма активирано онлайн картово плащане.'],privacy:[s.privacy||'Политиката за поверителност трябва да бъде попълнена от собственика.','Сайтът приема име, телефон и евентуално имейл само във връзка със запитвания и поръчки.','Преди публикуване трябва да се попълнят администраторът на личните данни, сроковете за съхранение и основанието за обработване.']}[route];body=`<article class="doc"><span class="pill">Подлежи на попълване преди публикация</span>${paras.map(a=>`<p>${escaped(a)}</p>`).join('')}<p><strong>Търговец:</strong> ${escaped(s.company||'[Име на фирма — за попълване]')}</p></article>`}$('#main').innerHTML=`<section class="container page-pad"><div class="crumbs"><a href="#home">Начало</a> / ${head[0]}</div><div class="page-head"><h1>${head[0]}</h1><p>${head[1]}</p></div>${body}</section>`;document.title=head[0]+' | Винил & Брезенти'}
function openDetail(id,updateHistory=true){
 let p=getProduct(id);if(!p)return;
 if(updateHistory&&location.pathname!==seoProductHref(p)){
  detailReturnUrl=/^#item-\d+$/.test(location.hash)?'/#catalog':location.pathname+location.search+location.hash;
  history.pushState({vinilDetail:p.id},'',seoProductHref(p));
 }
 state.detail=id;const list=images(p);$('#productDetail').innerHTML=`<div class="detail-layout"><div><div class="detail-image"><img id="detailMainImage" src="${escaped(list[0]||fallback(p))}" onerror="this.onerror=null;this.src='${escaped(fallback(p))}'" alt="${escaped(p.name)}"></div><div class="detail-thumbs">${list.map((s,i)=>`<button data-thumb="${i}" class="${i===0?'sel':''}"><img src="${escaped(s)}" onerror="this.onerror=null;this.src='${escaped(fallback(p))}'"></button>`).join('')}</div></div><div class="detail-copy"><span class="pill">${escaped(getCat(p.category))}</span><h2>${escaped(p.name)}</h2><p>${escaped(p.description)}</p><p>Цената се потвърждава спрямо размера и варианта преди изпълнение.</p>${(p.supplier_options||[]).length?`<div class="product-options"><p><b>Изберете вариант:</b> Цената се потвърждава след запитване.</p>${p.supplier_options.map((o,i)=>`<div class="form-field"><label>${escaped(o.label||o.id)}</label><select data-product-option="${i}"><option value="">Изберете...</option>${(o.values||[]).map(v=>`<option value="${escaped(v.id)}">${escaped(v.text)}</option>`).join('')}</select></div>`).join('')}</div>`:''}<div class="detail-price" id="detail-variant-price">${hasOptions(p)?'Избери размер за цена':euro(p.sale_price)} <small style="font-size:12px;color:#8a9d90">${p.sale_price!=null?`/ ${escaped(unit(p))}`:''}</small></div><div class="detail-actions"><button class="primary-btn" data-add="${p.id}">${hasOptions(p)?'Добави избрания вариант':p.sale_price==null?'Добави запитване':'Добави към заявка'} ↗</button><button class="outline-btn" data-showcart>Виж количката</button><a class="outline-btn viber-btn" href="${viberChatURL}" data-viber-product="${p.id}">Пиши във Viber</a></div><div id="viberInquiry" class="viber-inquiry hidden"><label for="viberMessage">Запитване за избрания продукт</label><textarea id="viberMessage" rows="6" readonly></textarea><button type="button" class="outline-btn" data-copy-viber>Копирай текста</button><p class="form-note">Постави текста в чата и го изпрати. Ако Viber не се отвори, добави 0879436006 във Viber или се <a href="tel:+359879436006">обади на 0879436006</a>.</p></div><p class="form-note">Цената, вариантите и наличността се потвърждават от магазина.</p></div></div>`;$('#overlay').classList.remove('hidden');$('#productDialog').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeDialog(){
 if(state.detail!==null&&detailReturnUrl&&location.pathname.startsWith('/produkti/')){
  history.replaceState(null,'',detailReturnUrl);
 }
 detailReturnUrl=null;state.detail=null;
 $('#productDialog').classList.add('hidden');
 if($('#cartDrawer').classList.contains('hidden')){$('#overlay').classList.add('hidden');document.body.style.overflow=''}
}
function addCart(id){const p=getProduct(id);if(!p)return;if(hasOptions(p)&&state.detail!==p.id){openDetail(p.id);toast('Избери размер и вариант');return}
let key='',label='';if(hasOptions(p)){key=selectionKey(p);if(!key){toast('Избери всички задължителни размери');return}const row=getVariant(p,key);if(!row){toast('Тази комбинация не е налична. Избери друг размер.');return}label=row.label}
let item=state.cart.find(x=>x.id===p.id&&(x.variant_key||'')===key);if(item)item.qty++;else state.cart.push({id:p.id,qty:1,variant:label,variant_key:key});persist();toast('Добавено към заявката');}
function cartTotal(){return state.cart.reduce((sum,l)=>{const p=getProduct(l.id),value=rowPrice(p,l.variant_key||'');return sum+(value==null?0:Number(value)*l.qty)},0)}
function renderCart(){let content=state.cart.map((l,i)=>{let p=getProduct(l.id);if(!p)return '';return `<div class="cart-line"><div class="mini-photo"><img src="${escaped(src(p))}" onerror="this.onerror=null;this.src='${escaped(fallback(p))}'"></div><div><strong>${escaped(p.name)}</strong><small>${escaped(l.variant||'')} ${euro(rowPrice(p,l.variant_key||''))}</small><button class="small-link" data-remove="${i}">Премахни</button></div><div class="qty"><button data-minus="${i}">−</button><b>${l.qty}</b><button data-plus="${i}">+</button></div></div>`}).join('');$('#cartContents').innerHTML=state.cart.length?`${content}<div class="cart-total"><span>Ориентир:</span><span>${euro(cartTotal())}</span></div><div class="preview-note">Крайната цена и наличностите се потвърждават при заявката.</div><form id="orderForm"><div class="form-field"><label>Име *</label><input name="name" required></div><div class="form-field"><label>Телефон *</label><input name="phone" required></div><div class="form-field"><label>Имейл</label><input name="email" type="email"></div><div class="form-field"><label>Бележка / размери</label><textarea name="message" placeholder="Напиши размери, цвят, количество или адрес"></textarea></div><button class="primary-btn" style="width:100%">Изпрати заявка ↗</button></form>`:'<div class="empty">Количката е празна.<p>Разгледай продуктите и добави желаните материали.</p></div>'}
function showCart(){renderCart();closeDialog();$('#overlay').classList.remove('hidden');$('#cartDrawer').classList.remove('hidden');document.body.style.overflow='hidden'}
function closeCart(){$('#cartDrawer').classList.add('hidden');$('#overlay').classList.add('hidden');document.body.style.overflow=''}
async function sendForm(form,type){let fd=new FormData(form);let o=Object.fromEntries(fd);o.kind=type;if(type==='order'){o.items=state.cart.map(x=>({product_id:x.id,quantity:x.qty,variant_key:x.variant_key||''}));if(!o.items.length){toast('Добави продукт в заявката');return}}if(!demo&&!ordersReady){toast('Приемането на заявки все още не е активирано.');return}if(useServer){try{const r=await request('/api/orders',{method:'POST',body:JSON.stringify(o)});toast('Заявката е регистрирана: № '+r.order_id);if(type==='order'){state.cart=[];persist();closeCart()}form.reset()}catch(e){toast('Неуспешно изпращане: '+e.message)}}else if(demo){let local=JSON.parse(localStorage.getItem('vinyl-local-orders')||'[]');local.unshift({...o,id:'DEMO-'+Date.now(),status:'new',created_at:new Date().toISOString()});localStorage.setItem('vinyl-local-orders',JSON.stringify(local));toast('Демо режим: заявката е запазена само в този браузър, не е изпратена.');if(type==='order'){state.cart=[];persist();closeCart()}form.reset()}}
function adminLogin(){return `<div class="container page-pad"><div class="page-head"><h1>Администрация</h1><p>Вход за собственика на магазина.</p></div><div class="form-card" style="max-width:430px"><h2>Вход в панела</h2><form id="loginForm"><div class="form-field"><label>Администраторски имейл</label><input type="email" name="email" required autocomplete="username"></div><div class="form-field"><label>Парола</label><input type="password" name="password" required autocomplete="current-password"></div><button class="primary-btn">Вход ↗</button></form><p class="form-note">Входът използва Supabase Auth. Администраторът се задава с ADMIN_EMAIL във Vercel.</p></div></div>`}

let stedmanPriceModels=null;
let changedStedmanPrices=new Set();
function renderStedmanPricing(){
 const pane=$('#adminPane');
 if(!pane||state.adminTab!=='stedman')return;
 if(!stedmanPriceModels){
  pane.innerHTML='<h2>Цени на облекло Stedman</h2><p role="status">Зареждам доставните и продажните цени...</p>';
  loadStedmanPricing();
  return;
 }
 const colorNames={WHI:'Бяло',COL:'Цветно',MEL:'Меланж',DIP:'Dip Dye'};
 pane.innerHTML=`<h2>Облекло Stedman <span class="pill">${stedmanPriceModels.length} модела</span></h2>
 <p class="admin-hint">За всяка комбинация от модел, размер и цвят можеш независимо да променяш <strong>доставната</strong> и <strong>продажната</strong> цена в евро. В магазина се използва само продажната цена. Промените се запазват в частно хранилище.</p>
 <div class="admin-toolbar"><button type="button" class="primary-btn" data-stedman-save>Запази цените ✓</button><button type="button" class="outline-btn" data-stedman-reload>Обнови ↻</button><a class="outline-btn" href="/teniski/" target="_blank" rel="noopener">Виж каталога ↗</a></div>
 <p id="stedman-pricing-status" class="admin-hint" role="status" aria-live="polite">${changedStedmanPrices.size?'Незаписани промени: '+changedStedmanPrices.size:'Всички промени са записани.'}</p>
 <div class="form-field"><label for="stedman-model-filter">Търси модел или код</label><input id="stedman-model-filter" placeholder="Например ST2000, Classic-T, суитшърт..." autocomplete="off"></div>
 <div class="admin-variant-groups" id="stedman-model-list">${stedmanPriceModels.map(m=>`<details class="admin-variant-group" data-stedman-label="${escaped((m.id+' '+m.name+' '+m.gender).toLocaleLowerCase('bg-BG'))}">
   <summary><strong>${escaped(m.id)}</strong> · ${escaped(m.name)} <span class="pill">${m.rows.length} ценови комбинации</span></summary>
   <div class="table-scroll"><table class="admin-table"><thead><tr><th>Размери</th><th>Цветова група</th><th>Доставна цена (€)</th><th>Продажна цена (€)</th><th>Разлика (€)</th></tr></thead>
   <tbody>${m.rows.map(r=>`<tr data-stedman-row><td>${escaped(r.size_band)}</td><td>${escaped(colorNames[r.color_group]||r.color_group)}</td>
   <td><input type="number" min="0" max="100000" step="0.01" required inputmode="decimal" data-stedman-edit="supplier_price" data-stedman-id="${escaped(r.model_id)}" data-stedman-band="${escaped(r.size_band)}" data-stedman-group="${escaped(r.color_group)}" aria-label="Доставна цена ${escaped(r.model_id)} ${escaped(r.size_band)} ${escaped(r.color_group)}" value="${escaped(r.supplier_price)}"></td>
   <td><input type="number" min="0" max="100000" step="0.01" required inputmode="decimal" data-stedman-edit="sale_price" data-stedman-id="${escaped(r.model_id)}" data-stedman-band="${escaped(r.size_band)}" data-stedman-group="${escaped(r.color_group)}" aria-label="Продажна цена ${escaped(r.model_id)} ${escaped(r.size_band)} ${escaped(r.color_group)}" value="${escaped(r.sale_price)}"></td>
   <td><strong data-stedman-margin>${Number.isFinite(Number(r.sale_price)-Number(r.supplier_price))?(Math.round((Number(r.sale_price)-Number(r.supplier_price))*100)/100).toFixed(2):'—'}</strong></td></tr>`).join('')}</tbody></table></div></details>`).join('')}</div>`;
}

async function loadStedmanPricing(){
 const pane=$('#adminPane');
 try{
  const loaded=await request('/api/admin/shirt-prices');
  if(state.adminTab!=='stedman')return;
  if(!Array.isArray(loaded.models)||loaded.models.length!==75)throw Error('Непълни данни за моделите');
  stedmanPriceModels=loaded.models;
  changedStedmanPrices.clear();
  renderStedmanPricing();
 }catch(error){
  if(state.adminTab!=='stedman'||!pane)return;
  pane.innerHTML=`<h2>Цени на облекло Stedman</h2><p class="admin-hint" role="alert">Цените не можаха да се заредят: ${escaped(error.message)}</p><button class="outline-btn" type="button" data-stedman-reload>Опитай отново</button>`;
 }
}

async function saveStedmanPricing(){
 if(!changedStedmanPrices.size){toast('Няма нови промени по цените');return}
 const rows=[];
 for(const model of stedmanPriceModels||[])for(const r of model.rows){
  if(!changedStedmanPrices.has(JSON.stringify([r.model_id,r.size_band,r.color_group])))continue;
  rows.push({model_id:r.model_id,size_band:r.size_band,color_group:r.color_group,
   supplier_price:r.supplier_price,sale_price:r.sale_price});
 }
 const invalid=Array.from(document.querySelectorAll('[data-stedman-edit]')).find(e=>e.value===''||!e.checkValidity());
 if(invalid||rows.some(r=>!Number.isFinite(r.supplier_price)||!Number.isFinite(r.sale_price))){
  if(invalid){invalid.closest('details').open=true;invalid.focus()}
  toast('Въведи валидни цени с до две цифри след запетаята.');
  return;
 }
 const btn=$('[data-stedman-save]'),status=$('#stedman-pricing-status');
 if(btn)btn.disabled=true;
 if(status)status.textContent='Записване на цените в Supabase...';
 try{
  const result=await request('/api/admin/shirt-prices',{method:'POST',body:JSON.stringify({rows})});
  changedStedmanPrices.clear();
  if(status)status.textContent='Записани '+result.updated+' ценови позиции. Продажните цени са активни в каталога.';
  toast('Цените за облекло са записани успешно.');
 }catch(error){
  if(status)status.textContent='Неуспешно записване: '+error.message;
  toast('Грешка при запис: '+error.message);
 }finally{if(btn)btn.disabled=false}
}

async function renderAdmin(){document.title='Администрация | Винил & Брезенти';if(!useServer){state.isAdmin=false;}
else if(!state.isAdmin){try{let r=await request('/api/admin/session');state.isAdmin=r.authenticated;state.csrf=r.csrf||'';if(r.authenticated){let info=await request('/api/admin/data');db={...db,...info}}}catch(e){}}
if(!state.isAdmin){$('#main').innerHTML=adminLogin();return}let tabs=[['products','Продукти и цени'],['variants','Размери и варианти'],['stedman','Облекло Stedman · Цени'],['orders','Заявки'],['settings','Настройки'],['images','Снимки'],['usage','База данни'],['visitors','Посещения']];$('#main').innerHTML=`<section class="container page-pad"><div class="page-head"><h1>Администрация</h1><p>Управление на магазина и продуктовия каталог.</p></div><div class="admin-layout"><nav class="admin-nav">${tabs.map(([k,t])=>`<button class="${state.adminTab===k?'active':''}" data-admin-tab="${k}">${t}</button>`).join('')}<button data-admin-logout>Изход</button></nav><div class="admin-body" id="adminPane"></div></div></section>`;renderAdminPane()}

function renderOrderCard(o){
 const lines=Array.isArray(o.items)?o.items:[];
 const dateValue=o.created_at?new Date(o.created_at):null;
 const date=dateValue&&!Number.isNaN(dateValue.getTime())?dateValue.toLocaleString('bg-BG',{dateStyle:'medium',timeStyle:'short'}):'';
 const orderLines=lines.map(line=>{
   const qty=Number(line.quantity??line.qty??1),count=Number.isFinite(qty)?qty:1;
   const price=line.price==null?null:Number(line.price);
   const name=line.name||line.product_name||getProduct(line.product_id)?.name||'Неназован артикул';
   const variant=line.variant||'';
   const validPrice=price!=null&&Number.isFinite(price);
   return `<tr><td><strong>${escaped(name)}</strong>${variant?`<small class="admin-order-variant">Размер / вариант: ${escaped(variant)}</small>`:''}${line.product_id?`<a class="admin-order-product-link" href="${escaped(getProduct(line.product_id)?seoProductHref(getProduct(line.product_id)):'/#catalog')}" target="_blank" rel="noopener noreferrer">Отвори артикула ↗</a>`:''}</td><td>${escaped(count)} ${escaped(line.unit||'бр.')}</td><td>${validPrice?euro(price):'По запитване'}</td><td><strong>${validPrice?euro(Math.round(price*count*100)/100):'По запитване'}</strong></td></tr>`;
 }).join('');
 const total=Number(o.estimated_total);
 const shirt=lines.find(x=>x.type==='stedman-print');
 const garmentFiles=shirt?.shirt_artwork||{};
 const hasArtwork=!!(garmentFiles.front||garmentFiles.back);
 const garmentNote=shirt?'<div class="admin-order-note"><strong>Vinilpechat 2.0 · Stedman '+escaped(shirt.model_id)+'</strong><p>Щампи: '+(garmentFiles.front?'Отпред ':'')+(garmentFiles.back?'Отзад':'')+'. Файловете са в частно хранилище.</p></div>':'';
 return `<article class="admin-order-card">
 <div class="admin-order-head">
   <div><strong class="admin-order-number">Заявка № ${escaped(o.id)}</strong>${date?`<small class="admin-order-date">${escaped(date)}</small>`:''}</div>
   <div class="admin-order-status"><label for="status-${escaped(o.id)}">Статус</label><select id="status-${escaped(o.id)}" data-order-status="${escaped(o.id)}">${[['new','Нова'],['in_progress','Обработка'],['confirmed','Потвърдена'],['completed','Приключена'],['cancelled','Отказана']].map(([v,n])=>`<option ${o.status===v?'selected':''} value="${v}">${n}</option>`).join('')}</select></div>
 </div>
 <div class="admin-order-contact"><div><span>Клиент</span><strong>${escaped(o.customer_name||o.name||'—')}</strong></div><div><span>Телефон</span><strong>${escaped(o.phone||'—')}</strong></div>${o.email?`<div><span>Имейл</span><strong>${escaped(o.email)}</strong></div>`:''}</div>
 <h3 class="admin-order-items-title">Поръчани артикули <span class="pill">${lines.length}</span></h3>
 ${lines.length?`<div class="admin-order-table-wrap"><table class="admin-order-items"><thead><tr><th>Артикул и вариант</th><th>Количество</th><th>Ед. цена</th><th>Стойност</th></tr></thead><tbody>${orderLines}</tbody></table></div>`:`<p class="admin-order-empty">Запитване без избрани артикули.</p>`}
 ${garmentNote}
 ${hasArtwork?`<div class="admin-order-note"><button type="button" class="outline-btn" data-admin-shirt-files="${escaped(o.id)}">Изтегли оригинални файлове за печат ↗</button><div data-shirt-files-result="${escaped(o.id)}" role="status" aria-live="polite"></div></div>`:''}
 ${o.message?`<div class="admin-order-note"><strong>Бележка от клиента:</strong><p>${escaped(o.message)}</p></div>`:''}
 <div class="admin-order-footer"><span>Обща стойност при заявката</span><strong>${lines.length&&Number.isFinite(total)?euro(total):'По запитване'}</strong></div>
 </article>`;
}

function renderAdminPane(){const el=$('#adminPane');if(!el)return;let t=state.adminTab;if(t==='products'){el.innerHTML=`<h2>Продукти и цени <span class="pill">${db.products.length} артикула</span></h2><p class="admin-hint">Продажната цена се задава ръчно от теб и не се променя автоматично при редакция на доставната цена. Въведи цена и натисни „Запази промените“.</p><div class="admin-toolbar"><button class="primary-btn" data-admin-save>Запази промените ✓</button><button class="outline-btn" data-admin-export>Експорт CSV ↧</button><button class="outline-btn" data-admin-import>Импорт CSV ↥</button><input type="file" id="csvImportFile" accept=".csv,text/csv" hidden></div><div class="table-scroll"><table class="admin-table"><thead><tr><th>#</th><th>Продукт</th><th>Връзки</th><th>Доставна €</th><th>Цена в Scorpioplast</th><th>Продажна €</th><th>Активен</th></tr></thead><tbody>${db.products.map(p=>`<tr><td>${p.id}</td><td class="titlecell">${escaped(p.name)}</td><td><div class="admin-product-links">${supplierURL(p)?`<a class="outline-btn admin-source-btn" target="_blank" rel="noopener noreferrer" href="${escaped(supplierURL(p))}" title="Отвори конкретния продукт при доставчика">Доставчик ↗</a>`:`<small class="admin-no-source">Липсва адрес</small>`}<a class="outline-btn admin-source-btn" target="_blank" rel="noopener noreferrer" href="${escaped(seoProductHref(p))}" title="Отвори продукта в магазина">В магазина ↗</a></div></td><td><input type="number" min="0" step="0.01" data-field="supplier_price" data-id="${p.id}" value="${p.supplier_price??''}"></td><td>${p.public_supplier_reference?`<div class="admin-reference-price"><strong>${euro(p.public_supplier_reference.public_min_price)}${p.public_supplier_reference.public_max_price!==p.public_supplier_reference.public_min_price?' – '+euro(p.public_supplier_reference.public_max_price):''}</strong><small>Обявена цена на сайта, не доставна</small></div>`:'—'}</td><td><div class="admin-sale-editor"><input type="number" min="0" step="0.01" data-field="sale_price" data-id="${p.id}" value="${p.sale_price??''}" title="Въведи продажната цена"></div></td><td><input type="checkbox" data-field="active" data-id="${p.id}" ${p.active?'checked':''}></td></tr>`).join('')}</tbody></table></div>`}
if(t==='variants'){const matching=db.products.filter(p=>(p.variants||[]).length);el.innerHTML=`<h2>Размери и варианти <span class="pill">${matching.reduce((n,p)=>n+p.variants.length,0)} комбинации</span></h2><p class="admin-hint">Редактирай доставната и продажната цена независимо за всеки размер или цвят. Промените се записват със зеления бутон.</p><div class="admin-toolbar"><button class="primary-btn" data-admin-save-variants>Запази цените и настройките ✓</button><button class="outline-btn" data-variant-csv-export>Експорт цени CSV ↧</button><button class="outline-btn" data-variant-csv-import>Импорт цени CSV ↥</button><input type="file" id="variantCSVFile" accept=".csv,text/csv" hidden></div><p class="admin-hint">В CSV попълни само new_sale_price в евро (напр. 12,50). Празно = без промяна; 0 = нулева цена. Не променяй идентификаторите и останалите колони. След проверка приложи цените и ги запази.</p><div id="variantCSVPreview" aria-live="polite"></div><div class="admin-variant-groups">${matching.map(p=>`<details class="admin-variant-group"><summary>${escaped(p.name)} <span class="pill">${p.variants.length} варианта</span></summary><div class="table-scroll"><table class="admin-table"><thead><tr><th>Вариант / размер</th><th>Доставна цена €</th><th>Продажна цена €</th><th>Активен</th><th>За потвърждение</th></tr></thead><tbody>${p.variants.map(v=>`<tr><td>${escaped(v.label)}</td><td><input type="number" min="0" step="0.01" data-variant-supplier-price data-id="${p.id}" data-variant-key="${escaped(v.variant_key)}" value="${v.supplier_price??''}" aria-label="Доставна цена ${escaped(v.label)}"></td><td><div class="admin-sale-editor"><input type="number" min="0" step="0.01" data-variant-price data-id="${p.id}" title="Редактирай продажната цена на избрания вариант" data-variant-key="${escaped(v.variant_key)}" value="${v.sale_price??''}"></div></td><td><input type="checkbox" data-variant-active data-id="${p.id}" data-variant-key="${escaped(v.variant_key)}" ${v.active!==false?'checked':''}></td><td><input type="checkbox" data-variant-verify data-id="${p.id}" data-variant-key="${escaped(v.variant_key)}" ${v.price_verification_needed?'checked':''}></td></tr>`).join('')}</tbody></table></div></details>`).join('')}</div>`}
if(t==='stedman'){renderStedmanPricing()}
if(t==='orders'){const records=db.orders||[];el.innerHTML=`<h2>Получени заявки <span class="pill">${records.length}</span></h2><p class="admin-hint">Всеки артикул се показва с количество, размер или вариант, единична цена и стойност към момента на заявката. Промени в каталога не променят старите заявки.</p>${records.length?`<div class="admin-orders">${records.map(renderOrderCard).join('')}</div>`:`<div class="empty">Все още няма получени заявки.</div>`}`}
if(t==='settings'){let s=db.settings;el.innerHTML=`<h2>Настройки на магазина</h2><div class="field-row"><div class="form-field"><label>Име на магазина</label><input data-setting="brand" value="${escaped(s.brand||'')}"></div><div class="form-field"><label>Име на фирма</label><input data-setting="company" value="${escaped(s.company||'')}"></div><div class="form-field"><label>Телефон</label><input data-setting="phone" value="${escaped(s.phone||'')}"></div><div class="form-field"><label>Имейл</label><input data-setting="email" value="${escaped(s.email||'')}"></div></div><div class="form-field"><label>Адрес</label><input data-setting="address" value="${escaped(s.address||'')}"></div><div class="form-field"><label>Доставка</label><textarea data-setting="shipping">${escaped(s.shipping||'')}</textarea></div><div class="form-field"><label>Поверителност (попълни преди публикуване)</label><textarea data-setting="privacy">${escaped(s.privacy||'')}</textarea></div><button class="primary-btn" data-admin-save>Запази настройките ✓</button>`}
if(t==='usage'){el.innerHTML='<h2>Използване на Supabase</h2><p class="admin-hint">Реално заети данни в твоя проект. Месечният трафик и разходите се проверяват отделно в Supabase Dashboard.</p><div id="adminUsagePanel">Зареждане...</div>';loadAdminUsage()}
if(t==='visitors'){
  el.innerHTML='<h2>Посещения на сайта</h2>'+
   '<p class="admin-hint">Статистиката е достъпна само за теб и оторизираните членове на Vercel проекта. Тук не се показва публичен брояч.</p>'+
   '<div class="form-card"><h3>Посетители и разглеждания</h3>'+
   '<p>Във Vercel Analytics можеш да видиш уникалните посетители, броя прегледани страници, най-посещаваните раздели и откъде идват посетителите.</p>'+
   '<p class="admin-hint">Ако услугата не е включена, натисни Enable в Analytics, след което публикувай нова версия. Статистика се събира от активирането нататък.</p>'+
   '<a class="primary-btn" target="_blank" rel="noopener noreferrer" href="https://vercel.com/ni-ko2/vinilpechat/analytics">Отвори статистиката във Vercel ↗</a></div>';
}
if(t==='images'){el.innerHTML=`<h2>Снимки на продуктите</h2><p class="admin-hint">Преди публично използване е нужно разрешение за чуждите изображения. Качените снимки се съхраняват в Supabase Storage.</p><div class="form-field"><label>Избери продукт</label><select id="imageProductSelect">${db.products.map(p=>`<option value="${p.id}">${p.id}. ${escaped(p.name)}</option>`).join('')}</select></div><div class="form-field"><label>Качи снимка (JPG, PNG, WebP — до 3 MB)</label><input id="adminPhotoInput" type="file" accept="image/jpeg,image/png,image/webp"></div><button class="primary-btn" data-upload>Качи / смени снимката</button>`}}
async function loadAdminUsage(){
  try{
    const d=await request('/api/admin/usage');
    if(state.adminTab!=='usage')return;
    const panel=$('#adminUsagePanel');if(!panel)return;
    const u=d.usage||{},limits=d.limits||{};
    const dbBytes=Number(u.database_bytes)||0,photoBytes=Number(u.storage_bytes)||0;
    const dbLimit=Number(limits.database_bytes)||524288000,photoLimit=Number(limits.storage_bytes)||1073741824;
    const mb=n=>(n/1048576).toLocaleString('bg-BG',{maximumFractionDigits:2})+' MB';
    const percent=(n,max)=>max?((n/max)*100).toLocaleString('bg-BG',{maximumFractionDigits:2})+'%':'—';
    const bar=(n,max)=>Math.max(0,Math.min(100,max?100*n/max:0)).toFixed(2);
    panel.innerHTML=`<div class="usage-grid">
      <div class="usage-metric"><div class="usage-heading"><b>База данни</b><strong>${percent(dbBytes,dbLimit)}</strong></div><div class="usage-bar"><span style="width:${bar(dbBytes,dbLimit)}%"></span></div><small>${mb(dbBytes)} от ${mb(dbLimit)} (Free)</small></div>
      <div class="usage-metric"><div class="usage-heading"><b>Продуктови снимки</b><strong>${percent(photoBytes,photoLimit)}</strong></div><div class="usage-bar"><span style="width:${bar(photoBytes,photoLimit)}%"></span></div><small>${mb(photoBytes)} от ${mb(photoLimit)} (Free)</small></div>
      <div class="usage-metric"><div class="usage-heading"><b>Артикули</b><strong>${Number(u.products)||0}</strong></div><small>${Number(u.products_with_images)||0} със снимка</small></div>
      <div class="usage-metric"><div class="usage-heading"><b>Файлове / заявки</b><strong>${Number(u.photo_files)||0} / ${Number(u.orders)||0}</strong></div><small>Снимки / получени заявки</small></div>
    </div><p class="admin-hint">Статистика към ${escaped(u.measured_at?new Date(u.measured_at).toLocaleString('bg-BG'):'момента')}. Това не включва изразходвания месечен трафик, API и Auth квоти.</p><a class="outline-btn" href="https://supabase.com/dashboard/project/okgimoegtsywbxkndzgw" target="_blank" rel="noopener noreferrer">Пълен Supabase Dashboard ↗</a> <button class="outline-btn" type="button" data-admin-reload-usage>Обнови ↻</button>`;
  }catch(e){const panel=$('#adminUsagePanel');if(panel)panel.textContent='Неуспешно зареждане: '+e.message}
}
async function saveVariantPrices(){
 const changes=db.products.flatMap(p=>(p.variants||[]).filter(v=>changedVariants.has(p.id+':'+v.variant_key)).map(v=>({product_id:p.id,variant_key:v.variant_key,supplier_price:v.supplier_price,sale_price:v.sale_price,manual_sale_price:!!v.manual_sale_price,active:v.active!==false,price_verification_needed:!!v.price_verification_needed})));
 if(!changes.length){toast('Няма нови промени');return}
 try{for(let i=0;i<changes.length;i+=120)await request('/api/admin/variants',{method:'POST',body:JSON.stringify({variants:changes.slice(i,i+120)})});changedVariants.clear();toast('Записани варианти: '+changes.length)}
 catch(e){toast('Неуспешно записване: '+e.message)}
}
async function saveAdmin(){if(useServer){try{await request('/api/admin/save',{method:'POST',body:JSON.stringify({products:db.products,settings:db.settings})});const latest=await request('/api/admin/data');db={...db,...latest};renderAdmin();toast('Продажните цени са записани успешно.');}catch(e){toast('Грешка при запис: '+e.message);return}}else{localStorage.setItem('vinyl-catalog-local',JSON.stringify(db));toast('Демо промените са записани в този браузър')} }
async function updateStatus(id,status){if(useServer){try{await request('/api/admin/order',{method:'POST',body:JSON.stringify({id,status})});toast('Статусът е обновен')}catch(e){toast(e.message)}}else{let arr=JSON.parse(localStorage.getItem('vinyl-local-orders')||'[]');let o=arr.find(x=>x.id===id);if(o)o.status=status;localStorage.setItem('vinyl-local-orders',JSON.stringify(arr));toast('Демо статус обновен')}}
function download(name,content,type='text/plain'){let blob=new Blob([content],{type});let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1200)}
function exportCSV(){const fields=['id','category','name','description','unit','supplier_price','sale_price','active','source','image'];let v=[fields.join(';'),...db.products.map(p=>fields.map(k=>'"'+String(p[k]??'').replaceAll('"','""')+'"').join(';'))].join('\r\n');download('vinil-brezenti-produkti.csv','\uFEFF'+v,'text/csv;charset=utf-8')}
// Variant CSV is a price-only workflow; metadata identifies the exact combination.
const variantCSVFields=['product_id','product_name','variant_key','variant_label','size','choices','current_sale_price','new_sale_price'];
let variantCSVPreview=null;
const variantChoices=v=>JSON.stringify(Object.entries(v.choices||{}).sort(([a],[b])=>a.localeCompare(b)));
const variantSize=(p,v)=>(p.supplier_options||[]).filter(o=>/размер|size|dimension/i.test(o.label||o.id)).map(o=>(o.values||[]).find(x=>String(x.id)===String(v.choices?.[o.id]))?.text||'').join(' | ');
// Escape formula-like text for spreadsheet programs; import compares this representation too.
const variantCSVText=value=>{const s=String(value??'');return /^[\s]*[=+\-@]/.test(s)?"'"+s:s};
function variantCSVIdentity(p,v){return [String(p.id),variantCSVText(p.name),variantCSVText(v.variant_key),variantCSVText(v.label),variantCSVText(variantSize(p,v)),variantChoices(v)]}
function buildVariantCSV(products){
 const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 return '\uFEFF'+[variantCSVFields,...products.flatMap(p=>(p.variants||[]).map(v=>[...variantCSVIdentity(p,v),v.sale_price??'','']))].map(row=>row.map(quote).join(';')).join('\r\n');
}
function parseVariantCSV(text){
 text=String(text).replace(/^\uFEFF/,'');
 const first=text.split(/\r?\n/,1)[0],delimiter=first.includes(';')?';':',';
 const rows=[];let row=[],buf='',quoted=false,closed=false;
 const cell=()=>{row.push(buf);buf='';closed=false};
 const line=()=>{cell();if(row.some(x=>x!==''))rows.push(row);row=[]};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){buf+='"';i++}else{quoted=false;closed=true}}else buf+=c;continue}
  if(c===delimiter){cell();continue}
  if(c==='\r'||c==='\n'){if(c==='\r'&&text[i+1]==='\n')i++;line();continue}
  if(c==='"'&&!buf&&!closed){quoted=true;continue}
  if(closed||c==='"')throw new Error('Невалидни кавички в CSV');
  buf+=c;
 }
 if(quoted)throw new Error('Незатворени кавички в CSV');
 line();return rows;
}
function variantCSVPrice(value,allowBlank=false){
 const s=String(value).trim();if(s===''&&allowBlank)return null;
 if(!/^\d+(?:[.,]\d{1,2})?$/.test(s))throw new Error('Невалидна цена: използвай число с до 2 знака след запетаята');
 const n=Number(s.replace(',','.'));if(!Number.isFinite(n)||n>1e8)throw new Error('Цената трябва да е между 0 и 100000000 €');return n;
}
function validateVariantCSV(text,products){
 const rows=parseVariantCSV(text),headers=rows.shift();
 if(!headers||headers.length!==variantCSVFields.length||new Set(headers).size!==headers.length||variantCSVFields.some(f=>!headers.includes(f)))throw new Error('Нужни са точно колоните: '+variantCSVFields.join(', '));
 const changes=[],errors=[],seen=new Set();
 rows.forEach((row,i)=>{try{
  if(row.length!==headers.length)throw new Error('Неправилен брой колони');
  const r=Object.fromEntries(headers.map((h,j)=>[h,row[j]]));
  if(!/^[1-9]\d*$/.test(r.product_id))throw new Error('Невалиден ID на продукт');
  const matches=products.filter(p=>String(p.id)===r.product_id);
  if(matches.length!==1)throw new Error('Липсващ или нееднозначен продукт');
  const p=matches[0],variants=(p.variants||[]).filter(v=>variantCSVText(v.variant_key)===r.variant_key);
  if(variants.length!==1)throw new Error('Липсващ или нееднозначен вариант');
  const v=variants[0],identity=variantCSVIdentity(p,v),key=JSON.stringify([p.id,v.variant_key]);
  if(seen.has(key))throw new Error('Дублиран вариант');seen.add(key);
  if(variantCSVFields.slice(0,6).some((f,j)=>r[f]!==identity[j]))throw new Error('Променен продукт, вариант или размер — експортирай нов CSV');
  const current=variantCSVPrice(r.current_sale_price,true);
  if(current!==(v.sale_price==null?null:Number(v.sale_price)))throw new Error('Текущата цена е променена — експортирай нов CSV');
  if(r.new_sale_price.trim()==='')return;
  const price=variantCSVPrice(r.new_sale_price);
  if(price!==current)changes.push({product_id:p.id,variant_key:v.variant_key,label:p.name+' — '+v.label,current_sale_price:current,sale_price:price});
 }catch(e){errors.push('Ред '+(i+2)+': '+e.message)}});
 return {changes,errors};
}
function renderVariantCSVPreview(result){
 const el=$('#variantCSVPreview');if(!el)return;
 el.innerHTML=result.errors.length?`<h3>CSV не е приет</h3><ul>${result.errors.map(e=>`<li>${escaped(e)}</li>`).join('')}</ul><p>Няма приложени промени. Поправи файла и го импортирай отново.</p>`:`<h3>Преглед: ${result.changes.length} промени</h3><div class="table-scroll"><table class="admin-table"><thead><tr><th>Продукт / вариант</th><th>Текуща цена</th><th>Нова цена</th></tr></thead><tbody>${result.changes.map(c=>`<tr><td>${escaped(c.label)}</td><td>${euro(c.current_sale_price)}</td><td>${euro(c.sale_price)}</td></tr>`).join('')}</tbody></table></div>${result.changes.length?'<button class="outline-btn" data-variant-csv-apply>Приложи проверените цени</button>':''}`;
}
async function importVariantCSV(file){
 variantCSVPreview=null;if(!file)return;
 try{
  if(file.size>5*1024*1024)throw new Error('CSV файлът е над 5 MB');
  const text=await file.text(),result=validateVariantCSV(text,db.products);
  if(!result.errors.length)variantCSVPreview=text;
  renderVariantCSVPreview(result);
 }catch(e){renderVariantCSVPreview({errors:[e.message],changes:[]})}
}
async function applyVariantCSV(){
 if(variantCSVPreview===null)return;
 try{
  // Check again against both unsaved edits and fresh server data before staging.
  const source=variantCSVPreview;
  let result=validateVariantCSV(source,db.products);
  if(useServer&&!result.errors.length){
   const latest=await request('/api/admin/data');
   if(variantCSVPreview!==source)return;
   result=validateVariantCSV(source,db.products);
   result.errors.push(...validateVariantCSV(source,latest.products).errors);
  }
  if(result.errors.length){variantCSVPreview=null;renderVariantCSVPreview(result);return}
  for(const c of result.changes){const p=getProduct(c.product_id),v=p.variants.find(v=>v.variant_key===c.variant_key);v.sale_price=c.sale_price;v.manual_sale_price=true;changedVariants.add(p.id+':'+v.variant_key)}
  variantCSVPreview=null;renderAdminPane();toast('Приложени: '+result.changes.length+' цени. Натисни „Запази цените и настройките“.');
 }catch(e){toast('CSV не е приложен: '+e.message)}
}

function readCSV(csv){let rows=[];let row=[],buf='',q=false;for(let i=0;i<csv.length;i++){let c=csv[i];if(c==='"'){if(q&&csv[i+1]==='"'){buf+='"';i++}else q=!q}else if((c===';'||c===','||c==='\n')&&!q){row.push(buf.trim());buf='';if(c==='\n'){if(row.some(x=>x))rows.push(row);row=[]}}else if(c!=='\r'){buf+=c}}row.push(buf.trim());if(row.some(x=>x))rows.push(row);return rows}
async function csvImport(file){if(!file)return;let txt=(await file.text()).replace(/^\uFEFF/,'');let rows=readCSV(txt);let headers=rows.shift();if(!headers?.includes('id')){toast('CSV трябва да има колона id');return}let updated=0;for(let row of rows){let v=Object.fromEntries(headers.map((h,i)=>[h,row[i]]));let p=getProduct(Number(v.id));if(!p)continue;for(let key of ['name','description','unit','category','image'])if(v[key]!==undefined)p[key]=v[key];for(let key of ['supplier_price','sale_price'])if(v[key]!==undefined)p[key]=v[key]===''?null:Number(v[key]);if(v.active!==undefined)p.active=v.active==='true'||v.active==='1';updated++}state.adminTab='products';renderAdmin();toast('Импортирани: '+updated+' продукта. Натисни „Запази промените“.')}
async function uploadImage(){let id=Number($('#imageProductSelect')?.value),file=$('#adminPhotoInput')?.files[0];if(!file)return toast('Избери снимка');if(file.size>3*1024*1024)return toast('Размерът е над 3 MB');if(!['image/jpeg','image/png','image/webp'].includes(file.type))return toast('Само JPG, PNG или WebP');let base64=await new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.onerror=reject;r.readAsDataURL(file)});if(useServer){try{let d=await request('/api/admin/upload',{method:'POST',body:JSON.stringify({id,mime:file.type,base64})});getProduct(id).image=d.url;toast('Снимката е качена');}catch(e){toast('Грешка: '+e.message)}}else{getProduct(id).image='data:'+file.type+';base64,'+base64;localStorage.setItem('vinyl-catalog-local',JSON.stringify(db));toast('Снимката е запазена локално (демо)')}}
// Events
window.addEventListener('hashchange',navigate);
window.addEventListener('popstate',()=>{
 if(location.pathname.startsWith('/produkti/')){
  const p=db.products.find(p=>p.active!==false&&seoProductHref(p)===location.pathname);
  if(p){if(!$('#productGrid'))renderHome();openDetail(p.id,false);return;}
 }
 if(state.detail!==null)closeDialog();
 navigate();
});
document.addEventListener('click',async e=>{let t=e.target;
let a=t.closest('[data-design-viber]');if(a){
 if(!currentDesignQuote){e.preventDefault();toast('Изчакай изчисляването на цената или въведи валидни размери.');return}
 const message=displayDesignViberMessage();
 if(navigator.clipboard?.writeText){navigator.clipboard.writeText(message).then(()=>toast('Запитването е копирано. Постави го в чата във Viber.')).catch(()=>toast('Копирай подготвения текст и го постави във Viber.'))}
 else toast('Копирай подготвения текст и го постави във Viber.');
 return
}
a=t.closest('[data-design-copy]');if(a){await copyDesignViberMessage();return}
a=t.closest('[data-design-web]');if(a){
 const q=designDimensions(),notes=($('#designNotes')?.value||'').trim();
 designInquiryDraft=designViberText()||['Здравейте! Искам нов винил.',q?'Дизайн: '+(q.with_design?'С дизайн':'Без дизайн'):'',q?'Ширина: '+q.width_cm+' см':'',q?'Височина: '+q.height_cm+' см':'',q?'Количество: '+q.quantity+' бр.':'',notes?'Дизайн: '+notes:'','Моля за оферта.'].filter(Boolean).join('\n');
 go('contact');return
}
a=t.closest('[data-go]');if(a){e.preventDefault();go(a.dataset.go);return}a=t.closest('[data-goto]');if(a){go(a.dataset.goto);return}a=t.closest('[data-catgo]');if(a){state.cat=a.dataset.catgo;go('catalog');return}a=t.closest('[data-filter]');if(a){state.cat=a.dataset.filter;renderHome();$('#catalog')?.scrollIntoView();$('#catalogSearch')?.focus();return}a=t.closest('[data-detail]');if(a){e.preventDefault();openDetail(Number(a.dataset.detail));return}a=t.closest('[data-viber-product]');if(a){if(!prepareViberInquiry(Number(a.dataset.viberProduct)))e.preventDefault();return}a=t.closest('[data-copy-viber]');if(a){await copyViberMessage();return}a=t.closest('[data-add]');if(a){addCart(a.dataset.add);return}a=t.closest('[data-showcart]');if(a){showCart();return}a=t.closest('[data-thumb]');if(a){let p=getProduct(state.detail);let url=images(p)[Number(a.dataset.thumb)];$('#detailMainImage').src=url;document.querySelectorAll('[data-thumb]').forEach(x=>x.classList.toggle('sel',x===a));return}a=t.closest('[data-plus],[data-minus],[data-remove]');if(a){let i=Number(a.dataset.plus??a.dataset.minus??a.dataset.remove);let l=state.cart[i];if(l){if(a.dataset.remove!==undefined)state.cart.splice(i,1);else {l.qty+=a.dataset.plus!==undefined?1:-1;if(l.qty<=0)state.cart.splice(i,1)}}persist();renderCart();return}a=t.closest('[data-admin-tab]');if(a){state.adminTab=a.dataset.adminTab;renderAdmin();return}a=t.closest('[data-admin-shirt-files]');if(a){
 const id=a.dataset.adminShirtFiles;
 const panel=[...document.querySelectorAll('[data-shirt-files-result]')].find(x=>x.dataset.shirtFilesResult===id);
 if(!panel)return;
 panel.textContent='Зареждане на защитените файлове...';
 try{
  const result=await request('/api/admin/shirt-files?id='+encodeURIComponent(id));
  const labels={front:'Оригинално лого отпред',back:'Оригинално лого отзад'};
  const links=Object.entries(result.files||{});
  if(!links.length){panel.textContent='Към тази заявка няма прикачени файлове.';return;}
  panel.replaceChildren();
  for(const [side,file] of links){
   const link=document.createElement('a');
   link.href=file.url;link.target='_blank';link.rel='noopener noreferrer';link.className='outline-btn';
   link.textContent=(labels[side]||side)+' ↧';
   panel.append(link);
   const details=document.createElement('small');details.style.display='block';
   const position=file.position||{};
   details.textContent='Позиция: X '+(position.x??'—')+'%, Y '+(position.y??'—')+'%, размер '+(position.size??'—')+'%, завъртане '+(position.rotation??0)+'°; връзката изтича след 10 мин.';
   panel.append(details);
  }
 }catch(error){panel.textContent='Неуспешно отваряне на файловете: '+error.message;}
 return;
}
a=t.closest('[data-stedman-save]');if(a){saveStedmanPricing();return}
a=t.closest('[data-stedman-reload]');if(a){stedmanPriceModels=null;changedStedmanPrices.clear();renderStedmanPricing();return}
a=t.closest('[data-admin-reload-usage]');if(a){loadAdminUsage();return}a=t.closest('[data-variant-csv-export]');if(a){download('vinil-variant-prices.csv',buildVariantCSV(db.products),'text/csv;charset=utf-8');return}a=t.closest('[data-variant-csv-import]');if(a){$('#variantCSVFile').click();return}a=t.closest('[data-variant-csv-apply]');if(a){await applyVariantCSV();return}a=t.closest('[data-admin-save-variants]');if(a){saveVariantPrices();return}a=t.closest('[data-admin-save]');if(a){saveAdmin();return}a=t.closest('[data-admin-export]');if(a){exportCSV();return}a=t.closest('[data-admin-import]');if(a){$('#csvImportFile').click();return}a=t.closest('[data-upload]');if(a){uploadImage();return}a=t.closest('[data-admin-logout]');if(a){if(useServer)await request('/api/admin/logout',{method:'POST',body:'{}'}).catch(()=>{});state.isAdmin=false;state.csrf='';go('home');toast('Изход');return}});
document.addEventListener('input',e=>{let t=e.target;
if(t.id==='stedman-model-filter'){const q=t.value.trim().toLocaleLowerCase('bg-BG');document.querySelectorAll('[data-stedman-label]').forEach(el=>el.hidden=!el.dataset.stedmanLabel.includes(q));return}
if(t.matches('[data-stedman-edit]')){
 const m=(stedmanPriceModels||[]).find(x=>x.id===t.dataset.stedmanId);
 const r=m?.rows.find(x=>x.size_band===t.dataset.stedmanBand&&x.color_group===t.dataset.stedmanGroup);
 if(r){r[t.dataset.stedmanEdit]=t.value===''?null:Number(t.value);
  changedStedmanPrices.add(JSON.stringify([r.model_id,r.size_band,r.color_group]));
  const tr=t.closest('tr'),margin=tr?.querySelector('[data-stedman-margin]');
  if(margin)margin.textContent=r.sale_price!=null&&r.supplier_price!=null?(Math.round((r.sale_price-r.supplier_price)*100)/100).toFixed(2):'—';
  const status=$('#stedman-pricing-status');if(status)status.textContent='Незаписани промени: '+changedStedmanPrices.size;
 }return
}
if(t.matches('[data-design-field]')){++designQuoteSequence;currentDesignQuote=null;$('#designViberButton')?.setAttribute('aria-disabled','true');const result=$('#designTotal');if(result)result.textContent='Изчисляване...';clearTimeout(designDebounce);designDebounce=setTimeout(refreshDesignQuote,260);return}if(t.matches('[data-variant-price],[data-variant-supplier-price],[data-variant-active],[data-variant-verify]')){const p=getProduct(Number(t.dataset.id));const v=(p?.variants||[]).find(x=>x.variant_key===t.dataset.variantKey);if(v){if(t.hasAttribute('data-variant-price')){v.sale_price=t.value===''?null:Number(t.value);v.manual_sale_price=true;}if(t.hasAttribute('data-variant-supplier-price')){v.supplier_price=t.value===''?null:Number(t.value);v.manual_sale_price=true;}if(t.hasAttribute('data-variant-active'))v.active=t.checked;if(t.hasAttribute('data-variant-verify'))v.price_verification_needed=t.checked;changedVariants.add(p.id+':'+v.variant_key)}return}if(t.id==='catalogSearch'){state.q=t.value;const pos=t.selectionStart;const products=filters();$('#productGrid').innerHTML=products.map(productCard).join('')||'<div class="empty">Няма намерени продукти</div>';$('.results-hint').textContent=`Показани ${products.length} продукта`;return}if(t.dataset.field){let p=getProduct(t.dataset.id);if(p){let k=t.dataset.field;p[k]=k==='active'?t.checked:k.includes('price')?(t.value===''?null:Number(t.value)):t.value;if(k==='sale_price'||k==='supplier_price')p.manual_sale_price=true;}}if(t.dataset.setting)db.settings[t.dataset.setting]=t.value});
document.addEventListener('change',e=>{let t=e.target;if(t.matches('[data-product-option]')){refreshVariantPrice();$('#viberInquiry')?.classList.add('hidden');return}if(t.id==='catalogSort'){state.sort=t.value;renderHome();$('#catalog')?.scrollIntoView();}if(t.dataset.orderStatus)updateStatus(t.dataset.orderStatus,t.value);if(t.id==='variantCSVFile'){importVariantCSV(t.files[0]);t.value=''}if(t.id==='csvImportFile')csvImport(t.files[0])});
document.addEventListener('submit',async e=>{if(e.target.id==='orderForm'||e.target.id==='contactForm'){e.preventDefault();await sendForm(e.target,e.target.id==='orderForm'?'order':'contact')}else if(e.target.id==='loginForm'){e.preventDefault();let fields=new FormData(e.target);try{const v=await request('/api/admin/login',{method:'POST',body:JSON.stringify({email:fields.get('email'),password:fields.get('password')})});state.isAdmin=true;state.csrf=v.csrf;let info=await request('/api/admin/data');db={...db,...info};renderAdmin();toast('Успешен вход')}catch(err){toast(err.message)}}});


// Load the third-party Facebook widget only when customers scroll near the social section.
function initLazyElfsight(){
 const target=document.getElementById('instagram-posts');
 if(!target)return;
 let loaded=false;
 const start=()=>{
  if(loaded)return;loaded=true;
  const script=document.createElement('script');
  script.src='https://elfsightcdn.com/platform.js';
  script.async=true;
  document.body.append(script);
 };
 if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>{
   if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();start();}
  },{rootMargin:'350px'});
  observer.observe(target);
 }else start();
}

$('#cartOpen').addEventListener('click',showCart);$('#cartClose').addEventListener('click',closeCart);$('#productClose').addEventListener('click',closeDialog);$('#overlay').addEventListener('click',()=>{closeDialog();closeCart()});$('#focusSearch').addEventListener('click',()=>{go('catalog');setTimeout(()=>$('#catalogSearch')?.focus(),80)});$('#mobileMenu').addEventListener('click',()=>$('#mobile-nav').classList.toggle('hidden'));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDialog();closeCart()}});initLazyElfsight();load();
