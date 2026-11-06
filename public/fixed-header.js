(function headerBoot(){
 'use strict';
 document.documentElement.style.setProperty('scrollbar-gutter','stable');
 document.documentElement.style.setProperty('overflow-y','scroll');

 const blueTheme=document.createElement('style');blueTheme.id='vp-clear-blue-theme';
 blueTheme.textContent="\nbody.vp-blue-preview{\n --v4-ink:#14263D;--v4-muted:#475569;--v4-teal:#2563EB;--v4-deep:#1D4ED8;--v4-blue:#2563EB;--v4-violet:#2563EB;\n --v4-line:#AFC4DF;--v4-bg:#F5F8FC;--v3-ink:#14263D;--v3-green:#1D4ED8;--v3-line:#AFC4DF;--green:#1D4ED8;--stroke:#AFC4DF;\n background:#F5F8FC!important;color:#14263D!important;\n}\nbody.vp-blue-preview :is(h1,h2,h3,h4){color:#14263D!important}\nbody.vp-blue-preview :is(main p,.section-sub,.vp-count,.cover-total,.v4-quiet){color:#475569}\nbody.vp-blue-preview :is(.eyebrow,.vp-eyebrow,.vp-check-kicker,.v4-kicker,.v4-label){color:#1D4ED8!important}\nbody.vp-blue-preview :is(.v3-primary-heading h1,.page-head h1){color:#14263D!important}\nbody.vp-blue-preview :is(.hero,.vp-intro,.intro.v3-shirt-hero,.seo-category-intro,.seo-product,.vp-seo-guide){\n background:linear-gradient(115deg,#FFFFFF 20%,#EDF4FF 80%,#E1F5FC)!important;\n border:1.5px solid #AFC4DF!important;box-shadow:0 8px 24px #14263d09!important\n}\nbody.vp-blue-preview :is(.v3-primary-card,.product-card,.cover-product,.seo-item,.vp-card,.card,.contact-aside,.vp-check-list,.vp-check-details,.preview-pane,.controls,.filter-sidebar,.cover-sidebar,.vp-sidebar,.v4-finish-card,.v2-print-card,.v3-social-card){\n border:1.5px solid #9FB7D5!important;background-color:#fff!important;box-shadow:0 4px 16px #14263d08!important\n}\nbody.vp-blue-preview .v3-primary-card{background:#fff!important;color:#14263D!important;border-top:4px solid #2563EB!important}\nbody.vp-blue-preview .v3-primary-card::before{background:none!important}\nbody.vp-blue-preview .v3-primary-card :is(h2,h3,p,strong,small,span){color:#14263D!important}\nbody.vp-blue-preview :is(.v3-primary-card,.product-card,.cover-product,.seo-item,.vp-card,.card):hover{\n border-color:#2563EB!important;box-shadow:0 8px 22px #2563eb18!important\n}\nbody.vp-blue-preview :is(.vp-seo-guide,.vp-notice,.vp-file-info,.vp-side-help,.v2-print-choice,.v3-shirt-benefits,.v3-social-section,.v4-finish-options,.doc){\n border:1.5px solid #AFC4DF!important;border-radius:16px;background:#FFFFFF!important\n}\nbody.vp-blue-preview :is(.vp-notice,.vp-side-help,.vp-file-info){background:#EDF4FF!important;color:#334155!important}\nbody.vp-blue-preview :is(.primary-btn,.btn:not(.secondary),.v3-shirt-start,.vp-submit:not(:disabled),.add-cart,.v3-btn-primary,.solid-btn,.vp-add,.v3-primary-card .v3-primary-link,.v4-primary){\n background:#1D4ED8!important;color:#FFFFFF!important;border:1px solid #1D4ED8!important;box-shadow:0 4px 12px #1d4ed823!important\n}\nbody.vp-blue-preview :is(.outline-btn,.secondary,.vp-secondary,.v3-social-open,.v3-primary-heading a,.v3-primary-card .v3-primary-link){\n border:1.5px solid #2563EB!important;background:#fff!important;color:#1D4ED8!important\n}\nbody.vp-blue-preview :is(.vp-group,.filter-item,.cover-filter,.v2-cat-btn){border:1px solid transparent}\nbody.vp-blue-preview :is(.vp-group.active,.filter-item.active,.cover-filter.active,.v2-cat-btn.active,[role=\"checkbox\"][aria-checked=\"true\"]){\n background:#DBEAFE!important;color:#1D4ED8!important;border-color:#93B4EE!important\n}\nbody.vp-blue-preview :is(.vp-intro-tags span,.v4-pill,.pill,.tag,.vp-check-list h2 span,.v3-shirt-count,.cover-total){\n background:#E7F0FF!important;color:#1D4ED8!important;border:1px solid #B8CFF5!important\n}\nbody.vp-blue-preview :is(main input:not([type=\"range\"]):not([type=\"checkbox\"]):not([type=\"radio\"]),main select,main textarea,.vp-search,.cover-search){\n background-color:#FFFFFF!important;color:#14263D!important;border:1.5px solid #93AAC7!important\n}\nbody.vp-blue-preview :is(input,textarea)::placeholder{color:#64748B!important;opacity:1}\nbody.vp-blue-preview :is(a,button,input,select,textarea):focus-visible{outline:3px solid #2563EB!important;outline-offset:3px}\nbody.vp-blue-preview :is(.v3-shirt-hero h1 span){color:#2563EB!important;background:none!important;-webkit-text-fill-color:#2563EB!important}\nbody.vp-blue-preview :is(.price,.product-price,.vp-price,.v3-model-price){color:#1D4ED8!important}\nbody.vp-blue-preview :is(.vp-item,.product-foot,.v3-shirt-benefits){border-color:#AFC4DF!important}\nbody.vp-blue-preview .vp-submit:disabled{background:#CBD5E1!important;color:#475569!important;box-shadow:none!important}\nbody.vp-blue-preview :is(footer,.footer,.v3-shirts-footer,.vp-check-footer){background:#14263D!important;color:#E7EFFA!important;border-top:3px solid #06B6D4!important}\nbody.vp-blue-preview :is(footer,.footer,.v3-shirts-footer,.vp-check-footer) :is(h2,h3,h4,p,a,small,span,strong){color:#E7EFFA!important}\n\nbody.vp-blue-preview .vp-hero{background:linear-gradient(120deg,#FFFFFF,#EAF2FF 65%,#DEF4FB)!important;color:#14263D!important;border-bottom:1.5px solid #AFC4DF}\nbody.vp-blue-preview .vp-hero-copy :is(h1,li){color:#14263D!important}\nbody.vp-blue-preview .vp-hero-copy p{color:#334155!important}\nbody.vp-blue-preview :is(.vp-hero-label,.vp-hero-copy h1 strong,.vp-hero-tagline){color:#1D4ED8!important}\nbody.vp-blue-preview .vp-hero-copy li::before{color:#1D4ED8!important;border-color:#2563EB!important;background:#DBEAFE}\nbody.vp-blue-preview .vp-hero-cta{background:#1D4ED8!important;color:#fff!important;border:1px solid #1D4ED8!important;box-shadow:0 5px 18px #2563eb30!important}\nbody.vp-blue-preview .v2-categories button{border:1.5px solid #AFC4DF!important;background:#fff!important;color:#14263D!important;box-shadow:none!important}\nbody.vp-blue-preview .v2-categories button[aria-pressed=true]{background:#1D4ED8!important;border-color:#1D4ED8!important;color:white!important}\nbody.vp-blue-preview .v2-categories button span{background:#DBEAFE!important;color:#1D4ED8!important}\nbody.vp-blue-preview .v2-categories button[aria-pressed=true] span{background:#FFFFFF26!important;color:white!important}\nbody.vp-blue-preview :is(.v3-shirt-benefits .benefit-icon,.v3-shirt-benefit-icon){background:#DBEAFE!important;color:#1D4ED8!important;border-color:#AFC4DF!important}\n\nbody.vp-blue-preview .vp-hero-screen .vp-hero-screen-caption{color:#FFFFFF!important}\nbody.vp-blue-preview :is(.vp-hero-screen-caption em,.vp-hero-browser){color:#38BDF8!important}\nbody.vp-blue-preview .vp-hero-phone i{background:#2563EB!important;color:#FFFFFF!important}\nbody.vp-blue-preview :is(.vp-add-more,.vp-empty a,.vp-seo-guide a){color:#1D4ED8!important}\n";
 document.head.append(blueTheme);
 const syncTheme=()=>document.body.classList.toggle('vp-blue-preview',location.hash!=='#admin');
 syncTheme();window.addEventListener('hashchange',syncTheme);

 const old=document.querySelector('header');if(!old)return;
 const host=document.createElement('header');host.id='vp-site-header';
 host.style.cssText='all:initial!important;display:block!important;position:sticky!important;top:0!important;z-index:100!important;width:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important;';
 const shadow=host.attachShadow({mode:'open'});
 const items=[['Начало','/'],['Печат на винил','/nov-vinil/'],['Винили за покриване','/brezenti/'],['Тениски за печат','/teniski/'],['Печатни продукти','/pechatni-produkti/'],['Общо запитване','/zapitvane/'],['Контакти','/#contact']];
 shadow.innerHTML=`
 <style>
 :host{font-family:Arial,Helvetica,sans-serif;color:#14263D}
 *,*::before,*::after{box-sizing:border-box}
 .surface{background:#fff;border-bottom:1px solid #AFC4DF;box-shadow:0 4px 18px #14263D08;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;line-height:1.25}
 .bar{max-width:1440px;width:100%;height:70px;margin:0 auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:24px}
 a{color:inherit;text-decoration:none}
 .brand{display:flex;align-items:center;gap:12px;flex:none;white-space:nowrap}
 .brand img{display:block;width:42px;height:42px}
 .brand strong{display:block;font-size:22px;line-height:26px;font-weight:700;letter-spacing:0}
 .brand small{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;color:#475569;line-height:15px}
 .actions{display:flex;align-items:center;gap:20px;white-space:nowrap}
 .phone{font-size:14px;font-weight:600}
 .cart{display:flex;align-items:center;gap:10px;height:40px;padding:0 16px;border:1px solid #AFC4DF;border-radius:10px;background:#F3F7FD;font-size:14px}
 .count{display:inline-flex;min-width:20px;justify-content:center;font-variant-numeric:tabular-nums}
 .nav-wrap{border-top:1px solid #CAD8EC;background:#F3F7FD}
 nav{max-width:1440px;width:100%;height:56px;padding:6px 28px;margin:0 auto;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
 .nav-link{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:44px;padding:0 8px;border-radius:8px;white-space:nowrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;line-height:20px;letter-spacing:0;background:transparent}
 .nav-link:hover{background:#E7EFFF}
 .nav-link[aria-current="page"]{background:#DBEAFE;color:#1D4ED8}
 .nav-link[aria-current="page"]::after{content:"";position:absolute;bottom:3px;left:28%;right:28%;height:3px;border-radius:3px;background:#1D4ED8}
 a:focus-visible,button:focus-visible{outline:2px solid #1D4ED8;outline-offset:2px}
 .toggle{display:none;align-items:center;justify-content:center;width:42px;height:40px;border:1px solid #AFC4DF;border-radius:10px;background:white;color:#14263D;font:600 20px Arial,Helvetica,sans-serif;cursor:pointer}
 @media(max-width:1050px){
 .bar{height:70px;padding:0 18px;gap:12px}.phone{display:none}.actions{gap:10px}.toggle{display:flex}
 .nav-wrap{display:none}.nav-wrap.open{display:block}
 nav{height:auto;padding:12px 18px;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .nav-link{font-size:14px;height:44px;background:#EDF3FD;padding:0 6px}
 }
 @media(max-width:430px){.bar{padding:0 12px}.brand{gap:8px}.brand img{width:34px;height:34px}.brand strong{font-size:18px}.brand small{font-size:8px;letter-spacing:.8px}.cart{padding:0 10px;gap:4px;font-size:12px}.actions{gap:7px}nav{padding:10px 12px;gap:6px}.nav-link{font-size:12px}}
 </style>
 <div class="surface">
 <div class="bar">
 <a class="brand" href="/" aria-label="Vinilpechat — начало"><img src="/assets/vinilpechat-spectrum-logo.svg" alt="" width="42" height="42"><span><strong>Vinilpechat</strong><small>ПЕЧАТ БЕЗ ГРАНИЦИ</small></span></a>
 <div class="actions"><a class="phone" href="tel:+359879436006">0879 436 006</a><a class="cart" href="/?cart=open#catalog">Количка <span class="count" id="cart-value">0</span></a><button class="toggle" aria-label="Отвори меню" aria-expanded="false" aria-controls="main-navigation">☰</button></div>
 </div>
 <div class="nav-wrap"><nav id="main-navigation" aria-label="Основна навигация">${items.map(([title,href])=>`<a class="nav-link" href="${href}">${title}</a>`).join('')}</nav></div>
 </div>`;
 // Keep the existing home-page cart and hash router DOM hooks available.
 const bridge=document.createElement('span');bridge.id='cart-count';bridge.hidden=true;host.append(bridge);
 old.replaceWith(host);
 let legacyMobile=document.getElementById('mobile-nav');
 if(!legacyMobile){legacyMobile=document.createElement('div');legacyMobile.id='mobile-nav';host.append(legacyMobile)}
 legacyMobile.hidden=true;legacyMobile.style.setProperty('display','none','important');
 function markCurrent(){
  const path=location.pathname,hash=location.hash;
  shadow.querySelectorAll('.nav-link').forEach(a=>{
   const u=a.getAttribute('href');
   const active=u==='/#contact'?path==='/'&&hash==='#contact':
    u==='/'?path==='/'&&(!hash||hash==='#home'):
    u==='/nov-vinil/'?(path.startsWith(u)||(path==='/'&&hash==='#design')):
    u==='/pechatni-produkti/'?(path.startsWith(u)||path.startsWith('/produkti/')):
    path.startsWith(u);
   if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
 }
 function refreshCount(){try{const cart=JSON.parse(localStorage.getItem('vinyl-cart')||'[]');shadow.getElementById('cart-value').textContent=String(Array.isArray(cart)?cart.reduce((sum,item)=>sum+(Number(item.qty)||0),0):0)}catch{}}
 const toggle=shadow.querySelector('.toggle'),panel=shadow.querySelector('.nav-wrap');
 function close(){panel.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.textContent='☰'}
 toggle.addEventListener('click',()=>{const open=panel.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'×':'☰'});
 shadow.querySelectorAll('.nav-link').forEach(a=>a.addEventListener('click',close));
 window.addEventListener('hashchange',()=>{markCurrent();close()});
 window.addEventListener('storage',refreshCount);
 new MutationObserver(refreshCount).observe(bridge,{childList:true,characterData:true,subtree:true});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 markCurrent();refreshCount();
})();
