'use strict';
// Server-rendered public pages. Only published products and public fields are used.
const ORIGIN='https://vinilpechat.vercel.app';
const LOGO=ORIGIN+'/assets/vinilpechat-spectrum-logo.svg';
const PHONE='+359879436006';
const shirtCatalog=require('../data/stedman-catalog.json');
const printServices=require('./print-service-pages.js');
const {modelPath}=require('../public/teniski/model-links.js');
const publicFields='id,name,description,category,unit,sale_price,active,image,images,supplier_options,price_verification_needed';
function escapeHtml(value){
 return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function slugify(value){
 const tr={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya','ѝ':'i'};
 return String(value||'').toLowerCase().split('').map(c=>tr[c]||c).join('').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90)||'produkt';
}
function productUrl(p){return '/produkti/'+encodeURIComponent(String(p.id))+'-'+slugify(p.name);}
function categoryUrl(c){return '/kategorii/'+encodeURIComponent(String(c.id))+'-'+slugify(c.name);}
function text(value,cap=1000){return String(value||'').trim().replace(/\s+/g,' ').slice(0,cap);}
function safeImg(raw){
 if(!raw)return '';
 try{
  const u=new URL(String(raw||''),ORIGIN);
  if(u.protocol!=='https:'||u.username||u.password)return '';
  return u.href;
 }catch{return ''}
}
function seoImage(p){
 const images=[p.image,...(Array.isArray(p.images)?p.images:[])];
 for(const raw of images){
  if(!raw||String(raw).includes('placeholder')||String(raw).includes('id-preview--'))continue;
  const s=safeImg(raw);if(s)return s;
 }
 return '';
}
function structured(data){return JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');}
function layout({title,description,canonical,content,schema,image}){
 const sImg=image||LOGO,desc=text(description,260),t=text(title,150);
 return '<!doctype html><html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="robots" content="index,follow,max-image-preview:large">'+
 '<title>'+escapeHtml(t)+'</title><meta name="description" content="'+escapeHtml(desc)+'">'+
 '<link rel="canonical" href="'+escapeHtml(ORIGIN+canonical)+'">'+
 '<meta property="og:type" content="website"><meta property="og:locale" content="bg_BG">'+
 '<meta property="og:site_name" content="Vinilpechat"><meta property="og:title" content="'+escapeHtml(t)+'">'+
 '<meta property="og:description" content="'+escapeHtml(desc)+'"><meta property="og:url" content="'+escapeHtml(ORIGIN+canonical)+'">'+
 '<meta property="og:image" content="'+escapeHtml(sImg)+'"><meta property="og:image:alt" content="'+escapeHtml(t)+'"><meta name="twitter:card" content="summary_large_image">'+
 '<link rel="icon" href="/favicon.png" type="image/png"><link rel="icon" type="image/svg+xml" href="/assets/vinilpechat-spectrum-logo.svg"><link rel="stylesheet" href="/seo.css"><link rel="stylesheet" href="/seo-v3.css"><link rel="stylesheet" href="/v4.css">'+
 '<script type="application/ld+json">'+structured({'@context':'https://schema.org','@graph':schema})+'</script>'+
 '<script defer src="/_vercel/insights/script.js"></script></head><body><header><nav aria-label="Основна навигация"><a class="seo-brand" href="/"><img src="/assets/vinilpechat-spectrum-logo.svg" width="56" height="56" alt="Vinilpechat" decoding="async"><span>Vinilpechat</span></a>'+
 '<div class="links"><a href="/">Начало</a><a href="/nov-vinil/">Печат на винил</a><a href="/brezenti/">Винили за покриване</a><a href="/teniski/">Тениски за печат</a><a href="/#catalog">Каталог</a></div></nav></header>'+
 '<main>'+content+'</main><footer>© Vinilpechat · <a href="/">Начало</a> · <a href="/#contact">Контакти</a> · <a href="/#privacy">Поверителност</a></footer></body></html>';
}
function breadcrumb(items){
 return {'@type':'BreadcrumbList','itemListElement':items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x.name,item:ORIGIN+x.url}))};
}
function catalogCard(p){
 const url=productUrl(p),im=seoImage(p),description=text(p.description,130);
 return '<article class="card seo-item">'+
 (im?'<a href="'+escapeHtml(url)+'"><img class="seo-thumb" loading="lazy" decoding="async" width="300" height="220" src="'+escapeHtml(im)+'" alt="'+escapeHtml(p.name)+'"></a>':'')+
 '<h3><a href="'+escapeHtml(url)+'">'+escapeHtml(p.name)+'</a></h3>'+
 (description?'<p>'+escapeHtml(description)+'</p>':'')+
 '<a class="seo-details" href="'+escapeHtml(url)+'">Продуктови подробности →</a></article>';
}
function productPage(p,cat,related=[]){
 const url=productUrl(p),description=text(p.description,5000),name=text(p.name,250),im=seoImage(p);
 const hasVariants=Array.isArray(p.supplier_options)&&p.supplier_options.length>0;
 const price=(!hasVariants&&!p.price_verification_needed&&p.sale_price!==null&&p.sale_price!==undefined&&p.sale_price!==''&&Number.isFinite(Number(p.sale_price))&&Number(p.sale_price)>=0)?Number(p.sale_price):null;
 const category=cat||{id:p.category,name:p.category||'Продукти'};
 const org={'@type':'Organization','@id':ORIGIN+'/#organization','name':'Vinilpechat','url':ORIGIN+'/'};
 const data={'@type':'Product','@id':ORIGIN+url+'#product','name':name,'description':description||name,'url':ORIGIN+url,'category':text(category.name),'sku':String(p.id)};
 if(im)data.image=[im];
 if(price!==null)data.offers={'@type':'Offer','url':ORIGIN+url,'price':price.toFixed(2),'priceCurrency':'EUR','seller':{'@id':ORIGIN+'/#organization'}};
 // Google rejects Product snippets without an offer or real reviews. Keep
 // inquiry-only pages described as WebPage until a verified offer is present.
 const pageData=price!==null?data:{'@type':'WebPage','@id':ORIGIN+url+'#webpage',name,description:description||name,url:ORIGIN+url,identifier:String(p.id)};
 if(price===null&&im)pageData.primaryImageOfPage={'@type':'ImageObject',url:im};
 const crumbs=[{name:'Начало',url:'/'},{name:text(category.name),url:categoryUrl(category)},{name,url}];
 const photos=[p.image,...(Array.isArray(p.images)?p.images:[])].map(safeImg).filter(x=>x&&!x.includes('placeholder')&&!x.includes('id-preview--')).slice(0,6);
 const allPhotos=[...new Set(photos)];
 const options=hasVariants?'<h2>Варианти и размери</h2><p>За този продукт има избор на варианти. Виж актуалните размери и цена в каталога и ни изпрати запитване.</p>':'';
 const relatedCards=related.filter(r=>r.id!==p.id).slice(0,4);
 const body='<nav class="seo-breadcrumb" aria-label="Пътечка"><a href="/">Начало</a> › <a href="'+escapeHtml(categoryUrl(category))+'">'+escapeHtml(category.name)+'</a> › '+escapeHtml(name)+'</nav>'+
 '<section class="seo-product"><div class="seo-photos">'+(allPhotos.length?allPhotos.map((src,i)=>'<img src="'+escapeHtml(src)+'" alt="'+escapeHtml(name)+(i?' – снимка '+(i+1):'')+'" '+(i?'loading="lazy"':'fetchpriority="high"')+' decoding="async" width="680" height="540">').join(''):'<div class="seo-empty-photo" aria-hidden="true">Vinilpechat</div>')+'</div>'+
 '<div class="seo-product-copy"><span class="eyebrow">'+escapeHtml(category.name)+'</span><h1>'+escapeHtml(name)+'</h1>'+
 (description?'<p>'+escapeHtml(description)+'</p>':'')+
 '<p class="seo-price">'+(price!==null?price.toLocaleString('bg-BG',{style:'currency',currency:'EUR'}):'Цена по запитване')+(p.unit?' / '+escapeHtml(p.unit):'')+'</p>'+
 (p.price_verification_needed?'<p>Посочената в каталога цена подлежи на потвърждение при заявка.</p>':'')+
 options+'<p>Размерите, цената и доставката се потвърждават преди изпълнение на поръчката.</p>'+
 '<a class="btn" href="/#item-'+encodeURIComponent(String(p.id))+'">Избери вариант или поръчай ↗</a>'+
 '<a class="btn secondary" href="/#contact">Изпрати запитване</a><p><a href="tel:'+PHONE+'">Телефон: 0879 436 006</a></p></div></section>'+
 (relatedCards.length?'<section class="section"><h2>Подобни продукти</h2><div class="cards seo-grid">'+relatedCards.map(catalogCard).join('')+'</div></section>':'');
 return {canonical:url,html:layout({title:text(name,110)+' — '+p.id+' | Vinilpechat',description:description||'Разгледай '+name+' и изпрати запитване за размер и цена във Vinilpechat.',canonical:url,content:body,image:im,schema:[org,pageData,breadcrumb(crumbs)]})};
}
function categoryPage(cat,products,categories){
 const url=categoryUrl(cat),name=text(cat.name,200),description=text(cat.description,1300)||'Избери подходящ материал и изпрати запитване за наличност, размер и цена.';
 const related=categories.filter(x=>x.id!==cat.id);
 const cards=products.length?'<div class="cards seo-grid">'+products.map(catalogCard).join('')+'</div>':'<p>В момента няма публикувани артикули в тази категория.</p>';
 const body='<nav class="seo-breadcrumb" aria-label="Пътечка"><a href="/">Начало</a> › '+escapeHtml(name)+'</nav>'+
 '<section class="seo-category-intro"><span class="eyebrow">Материали и продукти · Vinilpechat</span><h1>'+escapeHtml(name)+'</h1><p>'+escapeHtml(description)+'</p>'+
 '<p>Разгледай продуктите, наличните описания и варианти и изпрати запитване за конкретните размери.</p><a class="btn" href="/#catalog">Виж целия каталог →</a></section>'+
 '<section class="section"><h2>Продукти в категорията</h2>'+cards+'</section>'+
 (related.length?'<section class="section"><h2>Други категории</h2><div class="seo-category-links">'+related.map(x=>'<a href="'+escapeHtml(categoryUrl(x))+'">'+escapeHtml(x.name)+'</a>').join('')+'</div></section>':'');
 const schema=[{'@type':'CollectionPage','name':name,'description':description,'url':ORIGIN+url,'isPartOf':{'@type':'WebSite','url':ORIGIN+'/'},'mainEntity':{'@type':'ItemList','itemListElement':products.map((p,i)=>({'@type':'ListItem','position':i+1,'url':ORIGIN+productUrl(p)}))}},breadcrumb([{name:'Начало',url:'/'},{name,url}])];
 return {canonical:url,html:layout({title:name+' — продукти и размери | Vinilpechat',description:description,canonical:url,content:body,schema})};
}
async function categories(db){
 const r=await db.from('vinyl_categories').select('id,name,description').order('sort_order');
 if(r.error)throw r.error;
 return r.data||[];
}
async function productById(db,id){
 const r=await db.from('vinyl_products').select(publicFields).eq('id',id).eq('active',true).maybeSingle();
 if(r.error)throw r.error;
 return r.data||null;
}
async function relatedProducts(db,category,id){
 const r=await db.from('vinyl_products').select(publicFields).eq('category',category).eq('active',true).order('id').limit(5);
 if(r.error)throw r.error;
 return (r.data||[]).filter(x=>x.id!==id);
}
async function categoryProducts(db,id){
 const r=await db.from('vinyl_products').select(publicFields).eq('category',id).eq('active',true).order('id').limit(400);
 if(r.error)throw r.error;
 return r.data||[];
}
async function resolveProduct(db,slug){
 const m=String(slug||'').match(/^(\d{1,10})-[a-z0-9-]+$/);
 if(!m)return null;
 const id=Number(m[1]),p=await productById(db,id);
 if(!p)return null;
 const canonical=productUrl(p);
 if('/produkti/'+slug!==canonical)return {redirect:canonical};
 const catList=await categories(db);
 const cat=catList.find(x=>x.id===p.category)||{id:p.category,name:p.category};
 const related=await relatedProducts(db,p.category,p.id);
 return productPage(p,cat,related);
}
async function resolveCategory(db,slug){
 const cats=await categories(db);
 // Category IDs may contain hyphens. Match the longest complete ID before
 // considering the name, so a renamed category keeps its existing links.
 const cat=cats.filter(x=>String(slug||'').startsWith(String(x.id)+'-'))
  .sort((a,b)=>String(b.id).length-String(a.id).length)[0];
 if(!cat)return null;
 const products=await categoryProducts(db,cat.id);
 if(!products.length)return null;
 const canonical=categoryUrl(cat);
 if('/kategorii/'+slug!==canonical)return {redirect:canonical};
 return categoryPage(cat,products,cats);
}
async function sitemapXml(db){
 const cats=await categories(db);
 const urls=['/','/nov-vinil/','/brezenti/','/teniski/'];
 const present=new Set();
 let products=[];
 for(let offset=0;offset<30000;offset+=500){
  const r=await db.from('vinyl_products').select('id,name,category,image,images').eq('active',true).order('id').range(offset,offset+499);
  if(r.error)throw r.error;
  const batch=r.data||[];products.push(...batch);
  if(batch.length<500)break;
 }
 for(const p of products)present.add(p.category);
 for(const c of cats)if(present.has(c.id))urls.push(categoryUrl(c));
 for(const p of products)urls.push(productUrl(p));
 for(const model of shirtCatalog)urls.push(modelPath(model));
 // Unverified new service pages are noindex; never list them in an indexable sitemap.
 for(const url of printServices.approved())urls.push(url);
 const imagePaths=new Map();
 for(const p of products){const image=seoImage(p);if(image)imagePaths.set(productUrl(p),image)}
 for(const model of shirtCatalog){const image=safeImg(model.image);if(image)imagePaths.set(modelPath(model),image)}
 const printCatalog=require('../public/pechatni-produkti/catalog.json');
 for(const item of printCatalog.items)if(item.approved===true)imagePaths.set(printServices.path(item),ORIGIN+item.image);
 const items=urls.map(u=>{
  const url='<loc>'+escapeHtml(ORIGIN+u)+'</loc>',image=imagePaths.get(u);
  return '<url>'+url+(image?'<image:image><image:loc>'+escapeHtml(image)+'</image:loc></image:image>':'')+'</url>';
 }).join('');
 return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+items+'</urlset>';
}
module.exports={ORIGIN,slugify,productUrl,categoryUrl,productPage,categoryPage,sitemapXml,resolveProduct,resolveCategory,escapeHtml,seoImage};
