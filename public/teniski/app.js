'use strict';
// Starter fixture for the first two fully checked PDF rows. Other Stedman products are NOT published until validated.
const models=[
{id:'ST2000',name:'Classic-T',bg:'Класическа унисекс тениска',desc:'Мека тениска от 100% ринг-спун памук (при Grey Heather: 85% памук и 15% вискоза), трико single jersey, 155 г/м², стандартна кройка.',gender:'Унисекс',sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],prices:{regular:{WHI:2.20,COL:2.60},large:{WHI:3.00,COL:3.50}},colors:[{code:'WHI',name:'Бяло',group:'WHI'},{code:'BLO',name:'Черно',group:'COL'},{code:'NAV',name:'Тъмносиньо',group:'COL'},{code:'GYH',name:'Сив меланж',group:'COL'}],image:'https://www.stedman.eu/public/images/products/2026/ST2000/ST2000_WHI.jpg',source:'https://www.stedman.eu/en/classic-t'},
{id:'ST2010',name:'Classic-T Fitted',bg:'Мъжка вталена тениска',desc:'Вталена мъжка тениска, 155 г/м², ринг-спун памук и подлепени раменни шевове.',gender:'Мъже',sizes:['S','M','L','XL','2XL'],prices:{regular:{WHI:2.20,COL:2.60}},colors:[{code:'WHI',name:'Бяло',group:'WHI'},{code:'BLO',name:'Черно',group:'COL'},{code:'NAV',name:'Тъмносиньо',group:'COL'}],image:'https://www.stedman.eu/public/images/products/2026/ST2010/ST2010_WHI.jpg',source:'https://www.stedman.eu/en/classic-t-fitted'}];
const €=v=>v.toLocaleString('bg-BG',{style:'currency',currency:'EUR'}),$=id=>document.getElementById(id);
let selected=null,activeSide='front';
const artwork={front:{url:null,size:62,x:50,y:40},back:{url:null,size:62,x:50,y:40}};
const escapeText=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const printCost=(front,back)=>(front?2:0)+(back?2:0);
const validQuantity=n=>Number.isInteger(n)&&n>=1&&n<=10000;
function tier(){return ['3XL','4XL','5XL'].includes($('size').value)?'large':'regular'}
function color(){return selected.colors.find(x=>x.code===$('colour').value)}
function price(){return selected.prices[tier()]?.[color().group]*2}
function describe(){
 if(!selected)return;
 const base=price(),front=Boolean(artwork.front.url),back=Boolean(artwork.back.url),printing=printCost(front,back);
 const count=Number($('quantity').value),valid=validQuantity(count);
 $('base-price').textContent=€(base);
 $('front-price').textContent=€(front?2:0);$('back-price').textContent=€(back?2:0);
 $('print-price').textContent=€(printing);$('unit-price').textContent=€(base+printing);
 $('total-price').textContent=valid?€(Math.round((base+printing)*100)*count/100):'Невалидно количество';
 $('viber').disabled=!valid;$('copy-request').disabled=!valid;
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
  ?'https://www.stedman.eu/public/images/products/2026/'+selected.id+'/'+selected.id+'_'+code+'.jpg'
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
 $('size').innerHTML=selected.sizes.map(s=>'<option>'+escapeText(s)+'</option>').join('');
 $('colour').value='WHI';
 clearArtwork('front');clearArtwork('back');$('quantity').value='1';setSide('front');describe();
 $('customizer').scrollIntoView({behavior:'smooth',block:'start'});
}
$('models').innerHTML=models.map(m=>'<button type="button" class="card" data-model="'+m.id+'"><img loading="lazy" src="'+m.image+'" alt="'+escapeText(m.bg)+'"><span class="tag">'+m.id+' · '+m.gender+'</span><strong>'+escapeText(m.bg)+'</strong><p>'+escapeText(m.name)+'</p><span class="tag">От '+€(Math.min(...Object.values(m.prices).flatMap(g=>Object.values(g)))*2)+'</span></button>').join('');
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
