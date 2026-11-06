(function headerBoot(){
 'use strict';
 document.documentElement.style.setProperty('scrollbar-gutter','stable');
 document.documentElement.style.setProperty('overflow-y','scroll');

 if(!document.querySelector('link[href="/aerospace.css"]')){const aeroStyle=document.createElement('link');aeroStyle.rel='stylesheet';aeroStyle.href='/aerospace.css';document.head.append(aeroStyle);}
 const syncAero=()=>document.body.classList.toggle('vp-aero',location.hash!=='#admin');syncAero();window.addEventListener('hashchange',syncAero);
 const old=document.querySelector('header');if(!old)return;
 const host=document.createElement('header');host.id='vp-site-header';
 host.style.cssText='all:initial!important;display:block!important;position:sticky!important;top:0!important;z-index:100!important;width:100%!important;margin:0!important;padding:0!important;box-sizing:border-box!important;';
 const shadow=host.attachShadow({mode:'open'});
 const items=[['Начало','/'],['Печат на винил','/nov-vinil/'],['Винили за покриване','/brezenti/'],['Тениски за печат','/teniski/'],['Печатни продукти','/pechatni-produkti/'],['Общо запитване','/zapitvane/'],['Контакти','/#contact']];
 shadow.innerHTML=`
 <style>
 :host{font-family:Arial,Helvetica,sans-serif;color:#17334b}
 *,*::before,*::after{box-sizing:border-box}
 .surface{background:#fff;border-bottom:1px solid #dce6ed;box-shadow:0 4px 18px #17334b08;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;line-height:1.25}
 .bar{max-width:1440px;width:100%;height:70px;margin:0 auto;padding:0 28px;display:flex;align-items:center;justify-content:space-between;gap:24px}
 a{color:inherit;text-decoration:none}
 .brand{display:flex;align-items:center;gap:12px;flex:none;white-space:nowrap}
 .brand img{display:block;width:42px;height:42px}
 .brand strong{display:block;font-size:22px;line-height:26px;font-weight:700;letter-spacing:0}
 .brand small{display:block;font-size:10px;font-weight:400;letter-spacing:1.5px;color:#64798a;line-height:15px}
 .actions{display:flex;align-items:center;gap:20px;white-space:nowrap}
 .phone{font-size:14px;font-weight:600}
 .cart{display:flex;align-items:center;gap:10px;height:40px;padding:0 16px;border:1px solid #dce6ed;border-radius:10px;background:#f8fafb;font-size:14px}
 .count{display:inline-flex;min-width:20px;justify-content:center;font-variant-numeric:tabular-nums}
 .nav-wrap{border-top:1px solid #edf2f5;background:#f8fafb}
 nav{max-width:1440px;width:100%;height:56px;padding:6px 28px;margin:0 auto;display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
 .nav-link{position:relative;display:flex;align-items:center;justify-content:center;width:100%;height:44px;padding:0 8px;border-radius:8px;white-space:nowrap;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:600;line-height:20px;letter-spacing:0;background:transparent}
 .nav-link:hover{background:#eaf0f3}
 .nav-link[aria-current="page"]{background:#e1f3ec;color:#08775e}
 .nav-link[aria-current="page"]::after{content:"";position:absolute;bottom:3px;left:28%;right:28%;height:3px;border-radius:3px;background:#08775e}
 a:focus-visible,button:focus-visible{outline:2px solid #08775e;outline-offset:2px}
 .toggle{display:none;align-items:center;justify-content:center;width:42px;height:40px;border:1px solid #dce6ed;border-radius:10px;background:white;color:#17334b;font:600 20px Arial,Helvetica,sans-serif;cursor:pointer}
 @media(max-width:1050px){
 .bar{height:70px;padding:0 18px;gap:12px}.phone{display:none}.actions{gap:10px}.toggle{display:flex}
 .nav-wrap{display:none}.nav-wrap.open{display:block}
 nav{height:auto;padding:12px 18px;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .nav-link{font-size:14px;height:44px;background:#f0f5f7;padding:0 6px}
 }
 @media(max-width:430px){.bar{padding:0 12px}.brand{gap:8px}.brand img{width:34px;height:34px}.brand strong{font-size:18px}.brand small{font-size:8px;letter-spacing:.8px}.cart{padding:0 10px;gap:4px;font-size:12px}.actions{gap:7px}nav{padding:10px 12px;gap:6px}.nav-link{font-size:12px}}
 
 .surface{height:72px;display:grid;grid-template-columns:180px minmax(0,1fr) 105px;gap:20px;align-items:center;padding:0 30px;background:#08090B;color:#FFF;border:0;border-bottom:1px solid #FFFFFF24;box-shadow:none}
 .bar{display:contents}.brand{grid-column:1;grid-row:1;gap:9px}.brand img{width:25px;height:25px}
 .brand strong{font:600 15px/1 Arial,Helvetica,sans-serif;letter-spacing:2px;text-transform:uppercase;color:#FFF}.brand small{display:none}
 .actions{grid-column:3;grid-row:1;justify-content:flex-end;gap:10px}.phone{display:none}
 .cart{height:38px;padding:0 5px;border:0;border-radius:0;background:transparent;color:#FFF;font-size:11px;gap:4px;text-transform:uppercase}
 .nav-wrap{grid-column:2;grid-row:1;background:none;border:0}
 nav{display:flex;align-items:center;justify-content:center;height:72px;padding:0;gap:10px;max-width:none}
 .nav-link{height:42px;width:auto;flex:none;padding:0 5px;border-radius:0;background:transparent;color:#FFF;font-size:10px;letter-spacing:.025em;text-transform:uppercase;font-weight:600;white-space:nowrap}
 .nav-link:hover,.nav-link[aria-current="page"]{background:transparent;color:#FFF;box-shadow:none}
 .nav-link::after{content:"";position:absolute;bottom:3px;left:5px;right:5px;height:1px;background:#FFF;transform:scaleX(0);transform-origin:left;transition:transform .18s}
 .nav-link:hover::after,.nav-link[aria-current="page"]::after{background:#FFF;transform:scaleX(1)}
 .toggle{border:0;background:transparent;color:#FFF;border-radius:0}
 a:focus-visible,button:focus-visible{outline-color:#FFF}
 @media(max-width:1200px){
 .surface{height:auto;min-height:70px;grid-template-columns:1fr auto;padding:0 22px;gap:0 18px}
 .brand{grid-column:1;min-height:70px}.actions{grid-column:2}.toggle{display:flex}
 .nav-wrap{grid-column:1/-1;grid-row:2;display:none;border-top:1px solid #FFFFFF24}
 .nav-wrap.open{display:block}
 nav{height:auto;padding:15px 0 22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .nav-link{width:100%;height:44px;justify-content:flex-start;font-size:11px;white-space:nowrap;background:transparent}
 }
 @media(min-width:1201px){.nav-wrap{display:block!important}.toggle{display:none!important}}

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
