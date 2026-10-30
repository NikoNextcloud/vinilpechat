'use strict';
(function(){
 const el=document.querySelector('[data-vp-service]'),button=document.getElementById('vp-service-add');
 if(!el||!button||!window.VinilQuote)return;
 button.addEventListener('click',async()=>{
  const id=el.dataset.vpService,quantity=Number(document.getElementById('vp-service-qty')?.value),status=document.getElementById('vp-service-status');
  try{
   const response=await fetch('/pechatni-produkti/catalog.json');
   if(!response.ok)throw Error('Каталогът не е достъпен.');
   const items=(await response.json()).items;
   const product=items.find(x=>x.id===id);if(!product)throw Error('Неизвестно изделие.');
   const result=window.VinilQuote.addDraft({id:product.id,name:product.name,type:'service',quantity,details:'Индивидуална оферта'});
   status.textContent=result.ok?'Добавено в общото запитване. Можеш да добавиш още продукти.':result.error;
  }catch(err){status.textContent='Неуспешно добавяне: '+err.message}
 });
})();
