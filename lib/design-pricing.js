'use strict';
// Server-only vinyl design pricing. Do not expose the internal sqm rate to the browser.
const INTERNAL_RATE_EUR_PER_M2=13;
const DESIGN_FEE_EUR=10;
const MIN_ORDER_EUR=20;
function asNumber(value,label,min,max){
  if(value===undefined||value===null||typeof value==='boolean'||String(value).trim()==='')throw Object.assign(new Error('Въведете '+label),{status:400});
  const n=Number(value);
  if(!Number.isFinite(n)||n<min||n>max)throw Object.assign(new Error('Невалидна стойност за '+label),{status:400});
  return n;
}
function designQuote(data){
  const widthCm=asNumber(data.width_cm,'ширина в см',1,5000);
  const heightCm=asNumber(data.height_cm,'височина в см',1,5000);
  const quantity=asNumber(data.quantity??1,'количество',1,100);
  if(!Number.isInteger(quantity))throw Object.assign(new Error('Количеството трябва да е цяло число'),{status:400});
  const withDesign=data.with_design===undefined?true:data.with_design;
  if(typeof withDesign!=='boolean')throw Object.assign(new Error('Невалиден избор за дизайн'),{status:400});
  const areaM2=widthCm*heightCm/10000;
  // Design fee is charged once for the inquiry; the 20 EUR minimum applies to the complete inquiry.
  const total=Math.max(MIN_ORDER_EUR,Math.round((areaM2*quantity*INTERNAL_RATE_EUR_PER_M2+(withDesign?DESIGN_FEE_EUR:0))*100)/100);
  return {width_cm:widthCm,height_cm:heightCm,quantity,area_m2:Math.round(areaM2*10000)/10000,total_eur:total,currency:'EUR',includes_design:withDesign,minimum_order_eur:MIN_ORDER_EUR,indicative:true};
}
module.exports={designQuote};
