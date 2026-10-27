'use strict';
/* V3: small, isolated progressive enhancements. Prices/orders remain owned by site.js and v2.js. */
(()=>{
 // On rare unavailable manufacturer model shots, use the verified product packshot,
 // then a local placeholder; avoid blank products on slow/blocked image hosts.
 document.addEventListener('error',event=>{
  const img=event.target;
  if(img?.tagName!=='IMG'||!img.dataset.v3Fallback)return;
  const attempt=Number(img.dataset.v3ImageTries||0);
  if(attempt===0){img.dataset.v3ImageTries='1';img.src=img.dataset.v3Fallback}
  else if(attempt===1){img.dataset.v3ImageTries='2';img.src='/teniski/shirt-placeholder.svg'}
 },true);
 const STEDMAN_FRONT='https://www.stedman.eu/public/images/products/2026/ST2000/ST2000_WHI.jpg';
 const STEDMAN_BACK='/teniski/assets/universal-back-white.webp';
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-v3-side]');
  if(button){
   const studio=button.closest('.v3-hero-studio');
   if(!studio)return;
   const side=button.dataset.v3Side,photo=studio.querySelector('.v3-studio-shirt'),
    logo=studio.querySelector('.v3-studio-mark');
   studio.querySelectorAll('[data-v3-side]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
   if(photo){
    photo.src=side==='back'?STEDMAN_BACK:STEDMAN_FRONT;
    photo.alt=side==='back'?'Примерен изглед отзад на бяла тениска':'Примерен изглед отпред на бяла тениска';
   }
   if(logo)logo.hidden=side==='back';
  }
 });
 const menu=document.getElementById('mobileMenu');
 if(menu){
  document.addEventListener('click',event=>{
   if(event.target===menu||menu.contains(event.target)){
    const panel=document.getElementById('mobile-nav');
    menu.setAttribute('aria-expanded',String(!!panel&&!panel.classList.contains('hidden')));
   }else if(event.target.closest('#mobile-nav a')){
    menu.setAttribute('aria-expanded','false');
   }
  });
 }
 const markActive=()=>{
  document.querySelectorAll('.v3-header .desktop-nav a[data-go]').forEach(a=>{
   const current=(location.hash||'#home')==='#'+a.dataset.go;
   if(current)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
 };
 window.addEventListener('hashchange',markActive);
 markActive();
})();
