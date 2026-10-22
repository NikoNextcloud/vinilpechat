'use strict';
// The server is the authority for retail prices. Do not trust browser-submitted totals.
const catalog=require('../data/stedman-catalog.json');
const modelDetails=require('../data/stedman-details.json');
const lookup=new Map(catalog.map(m=>[m.id,m]));
const ORDER=['3XS','2XS','XS','S','M','L','XL','2XL','3XL','4XL','5XL'];
const money=cents=>Math.round(cents)/100;
const inputError=message=>Object.assign(new Error(message),{status:400});
function expand(label){
  const [first,last]=String(label||'').split('-');
  const start=ORDER.indexOf(first),stop=last?ORDER.indexOf(last):start;
  return start>=0&&stop>=start?ORDER.slice(start,stop+1):[];
}
function position(raw){
  const p=raw||{},x=Number(p.x),y=Number(p.y),size=Number(p.size),rotation=Number(p.rotation??0);
  if(![x,y,size,rotation].every(Number.isFinite)||x<0||x>100||y<0||y>100||size<15||size>100||rotation< -180||rotation>180)throw inputError('Невалидна позиция на щампата');
  return {x:Math.round(x),y:Math.round(y),size:Math.round(size),rotation:Math.round(rotation)};
}
const SPECIFIC_SHADES={
 WHI:{name:'Бяло',group:'WHI'},BLO:{name:'Черно',group:'COL'},
 GYH:{name:'Сив меланж',group:'MEL'},BMD:{name:'Dip Dye',group:'DIP'}
};
function validateShade(model,color,requested){
 const code=String(requested||color.code);
 const overrides=modelDetails[model.id]?.shades||[];
 let shade=overrides.find(v=>v.code===code);
 if(!shade){
  const basic=SPECIFIC_SHADES[code];
  if(basic&&Object.hasOwn(model.packshots||{},code))
   shade={code,name:basic.name,group:code==='GYH'&&color.group==='COL'?'COL':basic.group};
 }
 if(!shade&&code===color.code)shade={code,name:color.name,group:color.group};
 if(!shade||shade.group!==color.group)throw inputError('Избраният цвят не съответства на модела');
 return shade;
}
function quote(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw inputError('Невалидни данни за поръчката');
  const model=lookup.get(String(data.model_id||''));
  if(!model)throw inputError('Непознат модел Stedman');
  const color=model.colors.find(c=>c.code===data.color_code);
  if(!color)throw inputError('Изберете валидна цветова група');
  const shade=validateShade(model,color,data.shade_code);
  const rows=data.sizes;
  if(!Array.isArray(rows)||!rows.length||rows.length>12)throw inputError('Изберете количества по размер');
  const used=new Set(),lines=[];
  const fronts=data.prints?.front||null,backs=data.prints?.back||null;
  const printMode=String(data.print_mode||'');
  if(!['front','both'].includes(printMode))throw inputError('Изберете начин на печат');
  if(!fronts||(printMode==='both'&&!backs)||(printMode==='front'&&backs))
    throw inputError('Избраните страни за печат не съответстват на ценовата опция');
  const prints={front:position(fronts.position),back:printMode==='both'?position(backs.position):null};
  const printCents=printMode==='both'?600:300;
  let totalCents=0,quantity=0;
  for(const item of rows){
    const size=String(item.size||''),qty=Number(item.quantity);
    if(used.has(size)||!Number.isInteger(qty)||qty<1||qty>300)throw inputError('Проверете количествата и размерите');
    used.add(size);
    const band=model.groups.find(g=>expand(g.label).includes(size)&&typeof g[color.group]==='number');
    if(!band)throw inputError('Размерът '+size+' не се предлага в избрания цвят');
    const baseCents=Math.round(band[color.group]*200);
    const unitCents=baseCents+printCents;
    const rowTotal=unitCents*qty;
    totalCents+=rowTotal;quantity+=qty;
    lines.push({size,quantity:qty,baseCents,printCents,unitCents,totalCents:rowTotal,
      basePrice:money(baseCents),unitPrice:money(unitCents),total:money(rowTotal)});
  }
  if(quantity>500||totalCents>50000000)throw inputError('Количество или сума над допустимия лимит');
  return {model_id:model.id,name:model.bg,model_name:model.name,
    color_code:color.code,color_name:shade.name,shade_code:shade.code,
    quantity,lines,prints,printMode,printCents,
    totalCents,total:money(totalCents),currency:'EUR',
    note:'Цената е ориентировъчна. Наличност и доставка се потвърждават отделно.'};
}
module.exports={catalog,expand,quote,inputError};
