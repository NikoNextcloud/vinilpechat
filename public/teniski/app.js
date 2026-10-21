'use strict';
// Starter fixture for the first two fully checked PDF rows. Other Stedman products are NOT published until validated.
const models=[{"id":"ST2000","name":"Classic-T","bg":"Класическа унисекс тениска","desc":"Модел Classic-T от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Унисекс","groups":[{"label":"2XS-XS","WHI":2.2,"COL":2.7},{"label":"S-2XL","WHI":2.2,"COL":2.6},{"label":"3XL-5XL","WHI":3,"COL":3.5}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2010","name":"Classic-T Fitted","bg":"Мъжка вталена тениска","desc":"Модел Classic-T Fitted от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"S-2XL","WHI":2.2,"COL":2.6}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2100","name":"Comfort-T","bg":"Мъжка тениска Comfort","desc":"Модел Comfort-T от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"XS","WHI":2.6,"COL":3},{"label":"S-2XL","WHI":2.6,"COL":3.2},{"label":"3XL-5XL","WHI":3.5,"COL":4.1}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2130","name":"Comfort-T Long Sleeve","bg":"Мъжка тениска с дълъг ръкав","desc":"Модел Comfort-T Long Sleeve от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"S-2XL","WHI":4.5,"COL":5.7},{"label":"3XL","WHI":5.5,"COL":7.1}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2160","name":"Comfort-T","bg":"Дамска тениска Comfort","desc":"Модел Comfort-T от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Жени","groups":[{"label":"XS-2XL","WHI":2.6,"COL":3.1},{"label":"3XL","WHI":3.5,"COL":3.9}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2200","name":"Classic-T","bg":"Детска класическа тениска","desc":"Модел Classic-T от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Деца","groups":[{"label":"3XS-XL","WHI":2.2,"COL":2.6}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2300","name":"Classic-T V-neck","bg":"Мъжка тениска с V-образно деколте","desc":"Модел Classic-T V-neck от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"S-2XL","WHI":2.6,"COL":3.2},{"label":"3XL","WHI":3.2,"COL":3.8}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2500","name":"Classic-T Long Sleeve","bg":"Мъжка класическа тениска с дълъг ръкав","desc":"Модел Classic-T Long Sleeve от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"S-2XL","WHI":4,"COL":5},{"label":"3XL","WHI":4.5,"COL":5.5}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2600","name":"Classic-T Fitted","bg":"Дамска вталена класическа тениска","desc":"Модел Classic-T Fitted от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Жени","groups":[{"label":"XS","WHI":2.2,"COL":2.7},{"label":"S-XL","WHI":2.2,"COL":2.6},{"label":"2XL","WHI":2.3,"COL":2.8},{"label":"3XL","WHI":3,"COL":3.5}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2700","name":"Classic-T V-neck","bg":"Дамска тениска с V-образно деколте","desc":"Модел Classic-T V-neck от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Жени","groups":[{"label":"XS","WHI":2.5,"COL":3},{"label":"S-XL","WHI":2.4,"COL":2.9},{"label":"2XL","WHI":2.6,"COL":3.1}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2800","name":"Classic Tank Top","bg":"Мъжки класически потник","desc":"Модел Classic Tank Top от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"S-2XL","WHI":2.4,"COL":3},{"label":"3XL","WHI":3,"COL":3.8}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2810","name":"Comfort Tank Top","bg":"Мъжки потник Comfort","desc":"Модел Comfort Tank Top от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Мъже","groups":[{"label":"S-2XL","WHI":2.7,"COL":3.4},{"label":"3XL","WHI":3.3,"COL":4.14}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"},{"id":"ST2900","name":"Classic Tank Top","bg":"Дамски класически потник","desc":"Модел Classic Tank Top от каталога Stedman 2026. Избери размер и цветова група за точна цена.","gender":"Жени","groups":[{"label":"XS-2XL","WHI":2.4,"COL":3}],"colors":[{"code":"WHI","name":"Бяло","group":"WHI"},{"code":"COL","name":"Цветно (цветът се уточнява)","group":"COL"}],"image":"/teniski/shirt-placeholder.svg","source":"https://www.stedman.eu/en/t-shirts"}];
const €=v=>v.toLocaleString('bg-BG',{style:'currency',currency:'EUR'}),$=id=>document.getElementById(id);
let selected=null,activeSide='front';
const artwork={front:{url:null,size:62,x:50,y:40},back:{url:null,size:62,x:50,y:40}};
const escapeText=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const printCost=(front,back)=>(front?2:0)+(back?2:0);
const validQuantity=n=>Number.isInteger(n)&&n>=1&&n<=10000;
const SIZE_ORDER=['2XS','XS','S','M','L','XL','2XL','3XL','4XL','5XL'];
function sizesFor(label){
 const normalized=label.replaceAll('XXS','2XS').replaceAll('3XS','2XS');
 const parts=normalized.split('-').map(x=>x.trim());
 if(parts.length===1)return parts;
 const from=SIZE_ORDER.indexOf(parts[0]),to=SIZE_ORDER.indexOf(parts[1]);
 return from>=0&&to>=from?SIZE_ORDER.slice(from,to+1):[];
}
function tier(){return selected.groups.find(g=>sizesFor(g.label).includes($('size').value))}
function color(){return selected.colors.find(x=>x.code===$('colour').value)}
function price(){return tier()[color().group]*2}
function describe(){
 if(!selected)return;
 const base=price(),front=Boolean(artwork.front.url),back=Boolean(artwork.back.url),printing=printCost(front,back);
 const count=Number($('quantity').value),valid=validQuantity(count);
 $('base-price').textContent=€(base);
 $('front-price').textContent=€(front?2:0);$('back-price').textContent=€(back?2:0);
 $('print-price').textContent=€(printing);$('unit-price').textContent=€(base+printing);
 $('total-price').textContent=valid?€(Math.round((base+printing)*100)*count/100):'Невалидно количество';
 $('viber').disabled=!valid;$('copy-request').disabled=!valid;$('download-request').disabled=!valid;
 const text='Здравейте! Искам запитване за тениска Stedman '+selected.id+' '+selected.name
  +'\nРазмер: '+$('size').value+'\nЦвят: '+color().name+'\nКоличество: '+(valid?count:'невалидно')
  +'\nЩампа отпред: '+(front?'да (+2 €)':'не')
  +'\nЩампа отзад: '+(back?'да (+2 €)':'не')
  +'\nОриентировъчна цена за брой: '+€(base+printing)
  +'\nОбщо за заявката: '+(valid?€(Math.round((base+printing)*100)*count/100):'невалидно количество')
  +'\nСтраница: https://vinilpechat.vercel.app/teniski/'
  +'\nМоля, потвърдете наличност и крайна цена.'
  +(front||back?' Ще изпратя оригиналните файлове за печат отделно.':'');
 $('request-text').value=text;
}
function updateShirtImage(){
 if(!selected)return;
 const code=$('colour').value;
 // Official front photo is never represented as an authentic back photo.
 $('shirt-photo').src=activeSide==='front'
  ?'/teniski/shirt-placeholder.svg'
  :'/teniski/back-placeholder.svg';
 $('shirt-photo').alt=activeSide==='front'?'Предна страна на тениска '+selected.id:'Схематичен гръб на тениска';
 $('preview-side-label').textContent=activeSide==='front'?'Преглед отпред':'Преглед отзад — схематично изображение';
}
function updateArt(){
 const a=$('artwork'),state=artwork[activeSide];
 a.hidden=!state.url;
 if(!state.url)return;
 a.src=state.url;
 a.style.width=state.size+'%';a.style.left=state.x+'%';a.style.top=state.y+'%';
}
function setSide(side){
 activeSide=side;
 ['front','back'].forEach(s=>{$('view-'+s).setAttribute('aria-pressed',String(s===side));$('view-'+s).classList.toggle('secondary',s!==side)});
 const state=artwork[side];
 $('art-size').value=state.size;$('art-x').value=state.x;$('art-y').value=state.y;
 updateShirtImage();updateArt();
}
function clearArtwork(side){
 if(artwork[side].url)URL.revokeObjectURL(artwork[side].url);
 artwork[side]={url:null,size:62,x:50,y:40};
 $(side+'-upload').value='';
}
function openModel(id){
 selected=models.find(m=>m.id===id);
 if(!selected)return;
 $('customizer').hidden=false;
 $('model-heading').textContent=selected.bg+' · '+selected.id;
 $('model-info').textContent=selected.desc;
 $('colour').innerHTML=selected.colors.map(c=>'<option value="'+c.code+'">'+escapeText(c.name)+'</option>').join('');
 const sizes=[...new Set(selected.groups.flatMap(g=>sizesFor(g.label)))];
 $('size').innerHTML=sizes.map(size=>'<option value="'+escapeText(size)+'">'+escapeText(size)+'</option>').join('');
 $('colour').value='WHI';
 clearArtwork('front');clearArtwork('back');$('quantity').value='1';setSide('front');describe();
 $('customizer').scrollIntoView({behavior:'smooth',block:'start'});
}
$('models').innerHTML=models.map(m=>'<button type="button" class="card" data-model="'+m.id+'"><img loading="lazy" src="'+m.image+'" alt="'+escapeText(m.bg)+'"><span class="tag">'+m.id+' · '+m.gender+'</span><strong>'+escapeText(m.bg)+'</strong><p>'+escapeText(m.name)+'</p><span class="tag">От '+€(Math.min(...m.groups.flatMap(g=>[g.WHI,g.COL]))*2)+'</span></button>').join('');
$('models').addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(b)openModel(b.dataset.model)});
$('view-front').addEventListener('click',()=>setSide('front'));
$('view-back').addEventListener('click',()=>setSide('back'));
['size','colour'].forEach(id=>$(id).addEventListener('change',()=>{if(id==='colour')updateShirtImage();describe();}));
$('quantity').addEventListener('input',describe);
[['art-size','size'],['art-x','x'],['art-y','y']].forEach(([id,key])=>$(id).addEventListener('input',()=>{artwork[activeSide][key]=Number($(id).value);updateArt();}));
['front','back'].forEach(side=>$(side+'-upload').addEventListener('change',e=>{
 const f=e.target.files[0];if(!f)return;
 if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>10*1024*1024){
  alert('Избери PNG, JPG или WebP до 10 MB.');e.target.value='';return;
 }
 if(artwork[side].url)URL.revokeObjectURL(artwork[side].url);
 artwork[side].url=URL.createObjectURL(f);setSide(side);describe();
}));
$('remove-art').addEventListener('click',()=>{clearArtwork(activeSide);updateArt();describe();});
$('copy-request').addEventListener('click',()=>navigator.clipboard?.writeText($('request-text').value).then(()=>$('message-hint').textContent='Текстът е копиран.').catch(()=>$('request-text').select()));
$('viber').addEventListener('click',()=>{
 if(!selected||!validQuantity(Number($('quantity').value)))return;
 navigator.clipboard?.writeText($('request-text').value).catch(()=>{});
 $('message-hint').textContent='Копирай текста и го постави във Viber. Файловете за двете страни се изпращат отделно.';
 window.location.href='viber://chat?number=%2B359879436006';
});

$('download-request').addEventListener('click',()=>{
 if(!selected||!validQuantity(Number($('quantity').value)))return;
 const layout=['front','back'].map(side=>{
  const a=artwork[side];return '\\n'+(side==='front'?'ПРЕДНА СТРАНА':'ЗАДНА СТРАНА')+
   '\\nФайл: '+($(side+'-upload').files[0]?.name||'няма')+
   '\\nРазмер (% от зоната): '+a.size+'\\nПозиция X: '+a.x+'\\nПозиция Y: '+a.y;
 }).join('\\n');
 const data=new Blob([$('request-text').value+'\\n'+layout+'\\nВНИМАНИЕ: Това е спецификация, а не файл за печат. Прикачи оригиналните изображения отделно.'],{type:'text/plain;charset=utf-8'});
 const url=URL.createObjectURL(data),link=document.createElement('a');
 link.href=url;link.download='vinilpechat-'+selected.id+'-zayavka.txt';
 document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
});
