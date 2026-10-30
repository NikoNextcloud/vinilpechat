'use strict';
/* Vinilpechat V4: progressively enhanced vinyl studio.
   No database writes, no fabricated pricing, no automatic artwork upload. */
(function(){
 const $=id=>document.getElementById(id);
 let localImage=null,selectedFileName='';
 const FINISH={
  none:'Без довършителна обработка',
  eyelets:'Подгъв и капси',
  pockets:'Джобове за пръти'
 };
 const format=n=>Number(n).toLocaleString('bg-BG',{maximumFractionDigits:2});
 const valid=()=>{
  const w=Number($('designWidth')?.value),h=Number($('designHeight')?.value),q=Number($('designQuantity')?.value);
  return Number.isFinite(w)&&Number.isFinite(h)&&Number.isInteger(q)&&w>=1&&w<=5000&&h>=1&&h<=5000&&q>=1&&q<=100?{w,h,q}:null;
 };
 const finishing=()=>document.querySelector('input[name="v4Finishing"]:checked')?.value||'none';
 const needFinishingQuote=()=>finishing()!=='none';
 const notes=()=>[
  'Довършителна обработка: '+FINISH[finishing()],
  ...(selectedFileName?['Файл за печат: '+selectedFileName+' (ще го изпратя отделно през Viber; не е качен автоматично)']:[])
 ];
 function render(){
  if(!$('designCalculator')||!$('v4PreviewBanner'))return;
  const data=valid(),label=$('v4SizeLabel'),area=$('v4AreaLabel'),banner=$('v4PreviewBanner');
  const finishNote=$('v4FinishNote'),requestNote=$('v4FinishingPriceNote');
  if(data){
   const aspect=Math.max(.5,Math.min(3.3,data.w/data.h));
   banner.style.setProperty('--v4-aspect',String(aspect));
   label.textContent=format(data.w)+' × '+format(data.h)+' см';
   area.textContent='Площ: '+format(data.w*data.h/10000*data.q)+' м² за '+data.q+' бр.';
  }else{
   label.textContent='Въведи валидни размери';
   area.textContent='Площта се изчислява според въведените размери.';
  }
  if(finishNote)finishNote.textContent=needFinishingQuote()
   ?'За '+FINISH[finishing()].toLowerCase()+' ще уточним отделно цената и разположението. Посочената сума е само за основния печат.'
   :'Без допълнителна обработка. Показаната цена се изчислява от съществуващия сървърен калкулатор.';
  if(requestNote)requestNote.hidden=!needFinishingQuote();
  const ready=!!data;for(const id of ['v4Guide','v4Share']){const button=$(id);if(button)button.disabled=!ready;}
 }
 function hydrate(){
  const u=new URL(location.href),p=u.searchParams;
  if(!p.has('vp_width')&&!p.has('vp_height'))return;
  for(const [key,id,min,max] of [['vp_width','designWidth',1,5000],['vp_height','designHeight',1,5000],['vp_qty','designQuantity',1,100]]){
   const val=p.get(key);if(val===null)continue;const n=Number(val);
   if(Number.isFinite(n)&&n>=min&&n<=max&&(!id.endsWith('Quantity')||Number.isInteger(n)))$(id).value=String(n);
  }
  const radio=p.get('vp_finish');if(FINISH[radio]){const input=document.querySelector('input[name="v4Finishing"][value="'+radio+'"]');if(input)input.checked=true;}
  const d=p.get('vp_design');if(d==='0'){const input=document.querySelector('input[name="designService"][value="without"]');if(input)input.checked=true;}
  if(typeof refreshDesignQuote==='function')refreshDesignQuote();
 }
 function shareURL(){
  const v=valid();if(!v)return '';
  const u=new URL('/',location.origin);
  u.searchParams.set('vp_width',String(v.w));
  u.searchParams.set('vp_height',String(v.h));
  u.searchParams.set('vp_qty',String(v.q));
  u.searchParams.set('vp_finish',finishing());
  u.searchParams.set('vp_design',document.querySelector('input[name="designService"]:checked')?.value==='without'?'0':'1');
  u.hash='design';
  return u.href;
 }
 async function share(){
  const url=shareURL();if(!url)return;
  const field=$('v4ShareLink');field.value=url;field.hidden=false;
  try{await navigator.clipboard.writeText(url);$('v4UploadStatus').textContent='Линкът с размерите и избраната обработка е копиран.';}
  catch{$('v4UploadStatus').textContent='Маркирай и копирай връзката за споделяне.';field.focus();field.select();}
 }
 function textPdf(s){return String(s).replace(/[\\()]/g,c=>'\\'+c);}
 function pdfGuide(){
  const data=valid();if(!data)return null;
  const pw=842,ph=595,limitW=620,limitH=330;
  const scale=Math.min(limitW/data.w,limitH/data.h);
  const rw=Math.max(3,data.w*scale),rh=Math.max(3,data.h*scale);
  const x=(pw-rw)/2,y=155+(limitH-rh)/2;
  const inset=Math.min(15,rw/8,rh/8);
  const operations=[
   '0.96 0.98 0.99 rg 0 0 842 595 re f',
   '0.07 0.18 0.26 rg BT /F1 24 Tf 55 548 Td (VINILPECHAT - PRINT GUIDE) Tj ET',
   '0.36 0.46 0.52 rg BT /F1 12 Tf 55 515 Td ('+textPdf('Artwork size: '+format(data.w)+' x '+format(data.h)+' cm')+') Tj ET',
   '0.36 0.46 0.52 rg BT /F1 12 Tf 55 495 Td ('+textPdf('Quantity: '+data.q+' | Finishing: '+(finishing()==='none'?'None':finishing()==='eyelets'?'Hem and eyelets':'Pole pockets'))+') Tj ET',
   '0.96 0.97 0.98 rg '+x.toFixed(2)+' '+y.toFixed(2)+' '+rw.toFixed(2)+' '+rh.toFixed(2)+' re f',
   '0.02 0.52 0.48 RG 2 w '+x.toFixed(2)+' '+y.toFixed(2)+' '+rw.toFixed(2)+' '+rh.toFixed(2)+' re S',
   '0.90 0.39 0.15 RG 1 w [6 4] 0 d '+(x+inset).toFixed(2)+' '+(y+inset).toFixed(2)+' '+(rw-2*inset).toFixed(2)+' '+(rh-2*inset).toFixed(2)+' re S',
   '[] 0 d 0.28 0.41 0.51 rg BT /F1 11 Tf 55 108 Td (Outer line: trim edge. Inner dashed line: suggested safe area.) Tj ET',
   '0.28 0.41 0.51 rg BT /F1 11 Tf 55 87 Td (Scaled reference drawing only - not a 1:1 cutting template.) Tj ET',
   '0.28 0.41 0.51 rg BT /F1 11 Tf 55 66 Td (Confirm bleed, eyelets, final artwork and print resolution before production.) Tj ET'
  ].join('\n')+'\n';
  const bytes=new TextEncoder();
  const objects=[
   '<< /Type /Catalog /Pages 2 0 R >>',
   '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
   '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
   '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
   '<< /Length '+bytes.encode(operations).length+' >>\nstream\n'+operations+'endstream'
  ];
  let out='%PDF-1.4\n',offsets=[0];
  for(let i=0;i<objects.length;i++){offsets.push(bytes.encode(out).length);out+=(i+1)+' 0 obj\n'+objects[i]+'\nendobj\n';}
  const xref=bytes.encode(out).length;
  out+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';
  for(const n of offsets.slice(1))out+=String(n).padStart(10,'0')+' 00000 n \n';
  out+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
  return new Blob([out],{type:'application/pdf'});
 }
 function downloadGuide(){
  const blob=pdfGuide();if(!blob)return;
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='vinilpechat-shablon-'+valid().w+'x'+valid().h+'cm.pdf';a.style.display='none';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 function imageInput(){
  const input=$('v4File'),status=$('v4UploadStatus'),banner=$('v4PreviewBanner');
  const img=$('v4ArtworkImage');
  if(localImage){URL.revokeObjectURL(localImage);localImage=null;}
  img.removeAttribute('src');img.hidden=true;selectedFileName='';
  const file=input?.files?.[0];if(!file){status.textContent='Файлът остава на устройството ти; изпрати го отделно при потвърждаване на заявката.';return;}
  const types=['image/png','image/jpeg','image/webp','application/pdf'];
  if(file.size>15*1024*1024||!types.includes(file.type)){
   input.value='';status.textContent='Позволени са PDF, JPG, PNG и WebP до 15 MB. Файлът не е качен.';return;
  }
  selectedFileName=file.name.slice(0,100);
  status.textContent='Избран: '+selectedFileName+'. Само локален преглед — файлът НЕ е изпратен. Прикачи го във Viber след запитването.';
  if(file.type.startsWith('image/')){localImage=URL.createObjectURL(file);img.src=localImage;img.hidden=false;}
 }
 function mountDesign(){
  const root=$('designCalculator');
  if(!root||root.dataset.v4Mounted==='1'||!$('v4PreviewBanner'))return;
  root.dataset.v4Mounted='1';
  hydrate();render();
  for(const id of ['designWidth','designHeight','designQuantity']){
   $(id)?.addEventListener('input',render);
  }
  document.querySelectorAll('input[name="v4Finishing"],input[name="designService"]').forEach(el=>el.addEventListener('change',render));
  document.querySelectorAll('[data-v4-preset]').forEach(b=>b.addEventListener('click',()=>{
   const [w,h]=b.dataset.v4Preset.split('x').map(Number);
   $('designWidth').value=String(w);$('designHeight').value=String(h);
   $('designWidth').dispatchEvent(new Event('input',{bubbles:true}));render();
  }));
  $('v4File')?.addEventListener('change',imageInput);
  $('v4Share')?.addEventListener('click',share);
  $('v4Guide')?.addEventListener('click',downloadGuide);
 }
 document.addEventListener('DOMContentLoaded',()=>{if($('designCalculator'))mountDesign();});
 window.VinilV4={mountDesign,finishingNeedsQuote:needFinishingQuote,inquiryLines:notes,shareURL};
})();
