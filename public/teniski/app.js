'use strict';
// Starter fixture for the first two fully checked PDF rows. Other Stedman products are NOT published until validated.
const models=[
{id:'ST2000',name:'Classic-T',bg:'Класическа унисекс тениска',desc:'Мека тениска от 100% ринг-спун памук (при Grey Heather: 85% памук и 15% вискоза), трико single jersey, 155 г/м², стандартна кройка.',gender:'Унисекс',sizes:['XS','S','M','L','XL','2XL','3XL','4XL','5XL'],prices:{regular:{WHI:2.20,COL:2.60},large:{WHI:3.00,COL:3.50}},colors:[{code:'WHI',name:'Бяло',group:'WHI'},{code:'BLO',name:'Черно',group:'COL'},{code:'NAV',name:'Тъмносиньо',group:'COL'},{code:'GYH',name:'Сив меланж',group:'COL'}],image:'https://www.stedman.eu/public/images/products/2026/ST2000/ST2000_WHI.jpg',source:'https://www.stedman.eu/en/classic-t'},
{id:'ST2010',name:'Classic-T Fitted',bg:'Мъжка вталена тениска',desc:'Вталена мъжка тениска, 155 г/м², ринг-спун памук и подлепени раменни шевове.',gender:'Мъже',sizes:['S','M','L','XL','2XL'],prices:{regular:{WHI:2.20,COL:2.60}},colors:[{code:'WHI',name:'Бяло',group:'WHI'},{code:'BLO',name:'Черно',group:'COL'},{code:'NAV',name:'Тъмносиньо',group:'COL'}],image:'https://www.stedman.eu/public/images/products/2026/ST2010/ST2010_WHI.jpg',source:'https://www.stedman.eu/en/classic-t-fitted'}];
const €=v=>v.toLocaleString('bg-BG',{style:'currency',currency:'EUR'}),$=id=>document.getElementById(id);
let selected=null,artURL=null;
const escapeText=x=>String(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function tier(){return ['3XL','4XL','5XL'].includes($('size').value)?'large':'regular'}
function color(){return selected.colors.find(x=>x.code===$('colour').value)}
function price(){return selected.prices[tier()]?.[color().group]*2}
function describe(){const has=Boolean(artURL),base=price(),printing=has?2:0;
$('base-price').textContent=€(base);$('print-price').textContent=€(printing);$('total-price').textContent=€(base+printing);
const text='Здравейте! Искам запитване за тениска Stedman '+selected.id+' '+selected.name+'\\nРазмер: '+$('size').value+'\\nЦвят: '+color().name+'\\nЩампа: '+(has?'да (+2 €)':'не')+'\\nОриентировъчна цена за брой: '+€(base+printing)+'\\nЛинк: https://vinilpechat.vercel.app/teniski/\\nМоля, потвърдете наличност и крайна цена. '+(has?'Ще изпратя и оригиналния файл за печат.':'');
$('request-text').value=text;}
function updateShirtImage(){if(!selected)return;const code=$('colour').value;$('shirt-photo').src='https://www.stedman.eu/public/images/products/2026/'+selected.id+'/'+selected.id+'_'+code+'.jpg';}
function updateArt(){const a=$('artwork');if(!artURL){a.hidden=true;return;}a.hidden=false;a.style.width=$('art-size').value+'%';a.style.left=$('art-x').value+'%';a.style.top=$('art-y').value+'%';}
function openModel(id){selected=models.find(m=>m.id===id);$('customizer').hidden=false;$('model-heading').textContent=selected.bg+' · '+selected.id;$('model-info').textContent=selected.desc;
$('shirt-photo').src=selected.image;$('colour').innerHTML=selected.colors.map(c=>'<option value="'+c.code+'">'+escapeText(c.name)+'</option>').join('');$('size').innerHTML=selected.sizes.map(s=>'<option>'+escapeText(s)+'</option>').join('');
$('colour').value='WHI';if(artURL){URL.revokeObjectURL(artURL);artURL=null;}$('art-upload').value='';updateArt();describe();$('customizer').scrollIntoView({behavior:'smooth',block:'start'});}
$('models').innerHTML=models.map(m=>'<button type="button" class="card" data-model="'+m.id+'"><img loading="lazy" src="'+m.image+'" alt="'+escapeText(m.bg)+'"><span class="tag">'+m.id+' · '+m.gender+'</span><strong>'+escapeText(m.bg)+'</strong><p>'+escapeText(m.name)+'</p><span class="tag">От '+€(Math.min(...Object.values(m.prices).flatMap(g=>Object.values(g)))*2)+'</span></button>').join('');
$('models').addEventListener('click',e=>{const b=e.target.closest('[data-model]');if(b)openModel(b.dataset.model)});
['size','colour'].forEach(id=>$(id).addEventListener('change',()=>{if(id==='colour')updateShirtImage();describe();}));
['art-size','art-x','art-y'].forEach(id=>$(id).addEventListener('input',updateArt));
$('art-upload').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>10*1024*1024){alert('Избери PNG, JPG или WebP до 10 MB.');e.target.value='';return;}if(artURL)URL.revokeObjectURL(artURL);artURL=URL.createObjectURL(f);$('artwork').src=artURL;updateArt();describe();});
$('remove-art').addEventListener('click',()=>{if(artURL)URL.revokeObjectURL(artURL);artURL=null;$('art-upload').value='';updateArt();describe();});
$('copy-request').addEventListener('click',()=>navigator.clipboard?.writeText($('request-text').value).then(()=>$('message-hint').textContent='Текстът е копиран.').catch(()=>$('request-text').select()));
$('viber').addEventListener('click',()=>{if(!selected)return;const t=$('request-text').value;navigator.clipboard?.writeText(t).catch(()=>{});$('message-hint').textContent='Копирай текста и го постави във Viber. Файлът за щампа се изпраща отделно.';window.location.href='viber://chat?number=%2B359879436006';});
