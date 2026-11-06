(function headerBoot(){
 'use strict';
 document.documentElement.style.setProperty('scrollbar-gutter','stable');
 document.documentElement.style.setProperty('overflow-y','scroll');

 const modernTheme=document.createElement('style');modernTheme.id='vp-modern-theme';modernTheme.textContent="\n/* Modern print studio: graphite, acid lime and violet. */\nbody.vp-modern-preview{\n --v4-ink:#F1F5FA;--v4-muted:#B3BECE;--v4-teal:#C8FF63;--v4-deep:#C8FF63;--v4-blue:#A897FF;--v4-violet:#A897FF;--v4-line:#354050;--v4-bg:#0D1117;--v4-white:#171D26;\n --v3-ink:#F1F5FA;--v3-green:#C8FF63;--v3-line:#354050;--green:#C8FF63;--stroke:#354050;\n background:radial-gradient(ellipse at 90% 0,#6952b31c,transparent 40%),#0D1117!important;color:#F1F5FA!important;\n color-scheme:dark;\n}\nbody.vp-modern-preview :is(h1,h2,h3,h4){color:#F4F7FC!important}\nbody.vp-modern-preview :is(main p,.section-sub,.vp-count,.v4-quiet,.product-desc,.cover-product-desc,.v3-shirt-intro p,.vp-check-intro p,.vp-check-details>p,.vp-intro>p){color:#B6C2D3!important}\nbody.vp-modern-preview :is(.eyebrow,.vp-eyebrow,.vp-check-kicker,.v4-kicker,.v4-label,.vp-hero-label){color:#C8FF63!important;font-weight:750!important;letter-spacing:.16em}\nbody.vp-modern-preview :is(.vp-hero,.hero,.vp-intro,.intro.v3-shirt-hero,.seo-category-intro,.seo-product){\n background:radial-gradient(ellipse at 90% 0,#8163ff25,transparent 48%),radial-gradient(ellipse at 0 100%,#c8ff6310,transparent 48%),#141A23!important;\n border:1px solid #354050!important;box-shadow:0 22px 65px #0003!important;border-radius:26px;\n}\nbody.vp-modern-preview .vp-hero{border-radius:0;border-left:0!important;border-right:0!important;background:radial-gradient(ellipse at 80% 15%,#8a64ff2a,transparent 48%),linear-gradient(145deg,#10151D,#191F2A 65%,#10151D)!important}\nbody.vp-modern-preview .vp-hero-copy h1{font-size:clamp(40px,4.8vw,78px);line-height:1.03;letter-spacing:-.045em;color:#F7F9FC!important}\nbody.vp-modern-preview :is(.vp-hero-copy h1 strong,.vp-hero-tagline){color:#C8FF63!important}\nbody.vp-modern-preview .vp-hero-tagline{font-style:normal;font-weight:600;font-size:clamp(18px,2vw,24px);letter-spacing:-.02em}\nbody.vp-modern-preview .vp-hero-copy li{color:#E1E8F2!important}\nbody.vp-modern-preview .vp-hero-copy li::before{color:#C8FF63;border:1px solid #789948;background:#c8ff6310}\nbody.vp-modern-preview :is(.vp-hero-cta,.primary-btn,.btn:not(.secondary),.v3-shirt-start,.vp-submit:not(:disabled),.add-cart,.v3-btn-primary,.solid-btn,.vp-add,.vp-add-btn,.v4-primary){\n background:#C8FF63!important;border:1px solid #C8FF63!important;color:#11160D!important;box-shadow:0 8px 26px #c8ff6315!important;font-weight:800;border-radius:12px\n}\nbody.vp-modern-preview :is(.vp-hero-cta,.primary-btn,.v3-shirt-start,.vp-submit:not(:disabled)):hover{background:#D8FF93!important;box-shadow:0 8px 28px #c8ff6329!important}\nbody.vp-modern-preview :is(.outline-btn,.secondary,.vp-secondary,.v3-social-open){background:#1B2330!important;border:1px solid #586780!important;color:#E7EEF9!important}\nbody.vp-modern-preview :is(.v3-primary-card,.product-card,.cover-product,.seo-item,.vp-card,.card,.vp-check-list,.vp-check-details,.preview-pane,.controls,.filter-sidebar,.cover-sidebar,.vp-sidebar,.v4-finish-card,.v2-print-card,.v3-social-card){\n background:#171E28!important;border:1px solid #3A4658!important;box-shadow:0 14px 35px #0002!important;border-radius:20px;\n}\nbody.vp-modern-preview :is(.v3-primary-card,.product-card,.cover-product,.seo-item,.vp-card,.card):hover{border-color:#A897FF!important;box-shadow:0 20px 40px #0004,0 0 0 1px #a897ff22!important}\nbody.vp-modern-preview .v3-primary-card::before{background:radial-gradient(circle at 100% 0,#8b6bff22,transparent 65%)!important}\nbody.vp-modern-preview .v3-primary-card :is(p,strong,small,span){color:#E1E8F2!important}\nbody.vp-modern-preview :is(.product-name,.cover-product-name,.vp-card h3,.card strong,.vp-item-copy strong,.model-name){color:#F4F7FC!important}\nbody.vp-modern-preview :is(.product-foot,.vp-item,.v3-shirt-benefits){border-color:#354050!important}\nbody.vp-modern-preview :is(.product-photo,.product-image,.v3-model-photo,.seo-product-image){background:#F4F5F7!important;border-bottom:1px solid #3A4658}\nbody.vp-modern-preview :is(.vp-seo-guide,.vp-notice,.vp-file-info,.vp-side-help,.v2-print-choice,.v3-shirt-benefits,.doc,.totals){\n background:#171E28!important;border:1px solid #3A4658!important;border-radius:18px;color:#CBD5E3!important\n}\nbody.vp-modern-preview .vp-seo-guide{padding:clamp(22px,3.5vw,42px)}\nbody.vp-modern-preview :is(.vp-notice,.vp-side-help,.vp-file-info){background:#1B2432!important;border-color:#50607B!important}\nbody.vp-modern-preview :is(.vp-notice a,.vp-side-help a,.vp-seo-guide a,.vp-add-more,.vp-empty a){color:#C8FF63!important}\nbody.vp-modern-preview :is(.vp-intro-tags span,.v4-pill,.pill,.tag,.vp-check-list h2 span,.v3-shirt-count,.cover-total){\n color:#D8F5AA!important;background:#253321!important;border:1px solid #536C3C!important\n}\nbody.vp-modern-preview :is(.vp-group,.filter-item,.cover-filter,.v2-categories button){\n color:#C6D1E1!important;background:#1A2330!important;border:1px solid #3E4C61!important;box-shadow:none!important\n}\nbody.vp-modern-preview :is(.vp-group.active,.filter-item.active,.cover-filter.active,.v2-categories button[aria-pressed=true]){\n color:#11160D!important;background:#C8FF63!important;border-color:#C8FF63!important\n}\nbody.vp-modern-preview .v2-categories button span{background:#2C384B!important;color:#C5D1E2!important}\nbody.vp-modern-preview .v2-categories button[aria-pressed=true] span{background:#11160d1c!important;color:#11160D!important}\nbody.vp-modern-preview :is(.vp-group small,.filter-item .count){background:#293448!important;color:#C8D4E6!important}\nbody.vp-modern-preview :is(main input:not([type=\"range\"]):not([type=\"checkbox\"]):not([type=\"radio\"]),main select,main textarea,.vp-search,.cover-search){\n color:#F1F5FA!important;background:#111823!important;border:1px solid #657590!important;border-radius:12px\n}\nbody.vp-modern-preview :is(input,textarea)::placeholder{color:#9CAEC6!important;opacity:1}\nbody.vp-modern-preview :is(a,button,input,textarea,select):focus-visible{outline:2px solid #C8FF63!important;outline-offset:4px!important}\nbody.vp-modern-preview :is(.v3-shirt-hero h1 span){color:#C8FF63!important;background:none!important;-webkit-text-fill-color:#C8FF63!important}\nbody.vp-modern-preview :is(.price,.product-price,.vp-price,.v3-model-price){color:#C8FF63!important}\nbody.vp-modern-preview :is(.v3-shirt-hero-note,.vp-file-info p,.vp-item-copy small,.v3-shirt-benefits p,.vp-status){color:#AFBED2!important}\nbody.vp-modern-preview .vp-submit:disabled{color:#B3BFCE!important;background:#303C4D!important;border:1px solid #53617A!important;box-shadow:none!important}\nbody.vp-modern-preview :is(footer,.footer,.v3-shirts-footer,.vp-check-footer){background:#080C12!important;border-top:1px solid #354050!important;color:#B4C2D5!important}\nbody.vp-modern-preview :is(footer,.footer,.v3-shirts-footer,.vp-check-footer) :is(h2,h3,h4,strong){color:#F1F5FA!important}\nbody.vp-modern-preview :is(footer,.footer,.v3-shirts-footer,.vp-check-footer) :is(p,a,small,span){color:#B4C2D5!important}\nbody.vp-modern-preview .vp-hero-print{border:1px solid #6A6285;box-shadow:0 22px 60px #0007}\nbody.vp-modern-preview .vp-hero-screen{border-color:#303843;background:linear-gradient(130deg,#171827ee,#292038ed)!important}\nbody.vp-modern-preview .vp-hero-screen .vp-hero-screen-caption{color:#FFFFFF!important}\nbody.vp-modern-preview :is(.vp-hero-screen-caption em,.vp-hero-browser){color:#C8FF63!important}\nbody.vp-modern-preview .vp-hero-phone{border-color:#303843;background:linear-gradient(155deg,#171D27 55%,#8262E7 55%,#B2EC62 100%)!important}\nbody.vp-modern-preview .vp-hero-phone i{background:#C8FF63!important;color:#11160D!important}\n@media(prefers-reduced-motion:reduce){body.vp-modern-preview *{scroll-behavior:auto!important;transition:none!important}}\n";
 document.head.append(modernTheme);
 const syncModernTheme=()=>document.body.classList.toggle('vp-modern-preview',location.hash!=='#admin');
 syncModernTheme();window.addEventListener('hashchange',syncModernTheme);

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
 
 .surface{background:#10151D;color:#F4F7FC;border-color:#354050;box-shadow:0 6px 30px #0003}
 .brand strong{color:#F4F7FC}.brand small{color:#AAB8CC}
 .phone{color:#B8C5D9}.cart{background:#C8FF63;color:#11160D;border-color:#C8FF63;border-radius:99px}
 .nav-wrap{background:#171E28;border-color:#354050}.nav-link{color:#D8E2EF;border:1px solid transparent}
 .nav-link:hover{background:#242E40;border-color:#8A72C3}
 .nav-link[aria-current="page"]{background:#C8FF63;color:#11160D}
 .nav-link[aria-current="page"]::after{background:#11160D}
 .toggle{background:#1B2433;color:#F4F7FC;border-color:#657590}
 a:focus-visible,button:focus-visible{outline-color:#C8FF63}
 @media(max-width:1050px){.nav-link{background:#202B3B}}

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
