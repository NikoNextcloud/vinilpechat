'use strict';
const base='https://scorpioplast.com';
const pages=[base+'/dom-i-gradina/',base+'/dom-i-gradina/page/2/',base+'/dom-i-gradina/page/3/'];
const decode=s=>String(s||'').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&(?:amp|#038);/g,'&').replace(/&quot;/g,'"').replace(/&apos;|&#039;/g,"'").replace(/&nbsp;/g,' ').replace(/&euro;/gi,'€').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const plain=s=>decode(String(s||'').replace(/<[^>]*>/g,' ')).replace(/\s+/g,' ').trim();
const esc=s=>String(s).replace(/[\\^$.*+?()[\]{}|]/g,'\\$&');
const attr=(tag,key)=>{const m=String(tag).match(new RegExp('(?:^|\\s)'+esc(key)+'\\s*=\\s*["\\x27]([^"\\x27]*)["\\x27]','i'));return m?decode(m[1]):''};
const safeURL=(raw,from=base)=>{try{const u=new URL(raw,from);if(u.protocol!=='https:'||!['scorpioplast.com','www.scorpioplast.com'].includes(u.hostname))return null;u.hostname='scorpioplast.com';u.search='';u.hash='';return u.href}catch{return null}};
const get=async url=>{const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; VinylCatalogImport/1.0)','Accept':'text/html,application/xhtml+xml'},redirect:'follow',signal:AbortSignal.timeout(22000)});if(!r.ok)throw Error('HTTP '+r.status+' for '+url);return r.text()};
const defs={
 'scorpioplast-pokrivala':['Платнища и покривала','Готови защитни платнища'],
 'scorpioplast-chuvali':['Чували и торби','Опаковки и чували'],
 'scorpio-mulch':['Мулчиращо фолио','Мулчиращи фолиа за лехи и насаждения'],
 'scorpio-greenhouse':['Найлон за оранжерии','Фолиа и найлон за оранжерии'],
 'scorpio-nets':['Мрежи за земеделие','Засенчващи и защитни мрежи'],
 'scorpio-hoses':['Маркучи и поливане','Маркучи и принадлежности за поливане'],
 'scorpio-accessories':['Крепежи за градина','Щипки, ленти и принадлежности'],
 'scorpio-sisal':['Сезал, канап и връзки','Канап, сезал и други връзки'],
 'scorpio-elastics':['Ластици за градина','Ластици и шнурове'],
 'scorpio-garden':['Други стоки за градина','Други продукти от Дом и градина']
};
const category=p=>{const hay=(p.url+' '+p.name).toLowerCase();
 if(/platnishte|платнище|покривало/.test(hay))return 'scorpioplast-pokrivala';
 if(/chuvali|чувал|torbi|торб/.test(hay))return 'scorpioplast-chuvali';
 if(/mulch|мулч/.test(hay))return 'scorpio-mulch';
 if(/lastitsi|ластик/.test(hay))return 'scorpio-elastics';
 if(/mrezha|zasench|мреж|засенч|grizach/.test(hay))return 'scorpio-nets';
 if(/markuch|маркуч|poliv|полив|uluts|улуц/.test(hay))return 'scorpio-hoses';
 if(/sezal|сезал|kanap|канап|vrazki|връзки/.test(hay))return 'scorpio-sisal';
 if(/shipki|shtipki|щип|polutrubi|полутръб|kolcheta|колчет|pratci|пръчк|skobi|скоб|tikso|тиксо|lenta|лента/.test(hay))return 'scorpio-accessories';
 if(/naylon|найлон|foli|фоли|oranjer|oranzher|оранжери|агрил/.test(hay))return 'scorpio-greenhouse';
 return 'scorpio-garden';
};
function prices(card){
 const m=card.match(/class=["'][^"']*\bprice\b[^"']*["']/i);if(!m)return [];
 const text=plain(card.slice(m.index,m.index+2200));
 return [...text.matchAll(/([\d][\d\s]*[.,]\d{2})\s*€/g)].slice(0,5).map(m=>Number(m[1].replace(/\s+/g,'').replace(',','.'))).filter(n=>n>=0&&n<1e6);
}
function listCards(html,page){
 const found=[];
 for(const m of html.matchAll(/<li\b([^>]*\bclass=["'][^"']*\bproduct\b[^"']*["'][^>]*)>([\s\S]*?)<\/li>/gi)){
   const tag=m[1],inner=m[2],anchor=(inner.match(/<a\b[^>]*\bclass=["'][^"']*\bproduct-images\b[^"']*["'][^>]*>/i)||[])[0]||'';
   const url=safeURL(attr(anchor,'href'));if(!url||url===base+'/dom-i-gradina/')continue;
   const name=plain(attr(anchor,'aria-label'))||plain((inner.match(/<h\d[^>]*class=["'][^"']*product-title[^"']*["'][^>]*>([\s\S]*?)<\/h\d>/i)||[])[1]);
   if(!name)continue;
   const img=(inner.match(/<img\b[^>]*>/i)||[])[0]||'';
   const image=safeURL(attr(img,'data-orig-src')||attr(img,'src'));
   const cls=attr('<li '+tag+'>','class');
   const p={name:name.slice(0,240),url,image:image&&new URL(image).pathname.includes('/wp-content/uploads/')?image:null,nominal:prices(inner),variable:/\bproduct-type-variable\b/.test(cls),outofstock:/\boutofstock\b/.test(cls),post:(cls.match(/\bpost-(\d+)\b/)||[])[1]||'',page};
   p.category=category(p);found.push(p);
 }
 return found;
}
function selectGroups(html){
 const form=(html.match(/<form\b[^>]*\bclass=["'][^"']*\bvariations_form\b[^"']*["'][^>]*>[\s\S]*?<\/form>/i)||[])[0]||'';
 if(!form)return [];
 const groups=[];
 for(const m of form.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)){
   const key=attr(m[1],'name');if(!key.startsWith('attribute_'))continue;
   const values=[...m[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)].map(z=>({id:attr(z[1],'value'),text:plain(z[2])})).filter(v=>v.id&&v.text).slice(0,100);
   if(!values.length)continue;
   const id=attr(m[1],'id'),labelMatch=id?form.match(new RegExp('<label\\b[^>]*for=["\\x27]'+esc(id)+'["\\x27][^>]*>([\\s\\S]*?)<\\/label>','i')):null;
   groups.push({id:key,label:plain(labelMatch?.[1])||'Изберете вариант',type:'select',required:true,values});
 }
 return groups.slice(0,5);
}
function makeVariants(groups,max=240){
 if(!groups.length)return [];
 let choices=[{arr:[],pairs:{},desc:[]}];
 for(const g of groups){const out=[];for(const row of choices)for(const v of g.values){
   const arr=[...row.arr,g.id+'='+v.id];if(arr.join('&').length>490)continue;
   out.push({arr,pairs:{...row.pairs,[g.id]:v.id},desc:[...row.desc,g.label+': '+v.text]});
   if(out.length>max)return null;
 }choices=out}
 return choices.map(o=>({variant_key:o.arr.join('&'),label:o.desc.join(' | ').slice(0,500),choices:o.pairs,supplier_price:null,sale_price:null,manual_sale_price:true,active:true,price_verification_needed:true}));
}
module.exports={base,pages,defs,safeURL,get,listCards,selectGroups,makeVariants};
