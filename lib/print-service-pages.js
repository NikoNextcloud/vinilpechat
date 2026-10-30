'use strict';
// Static source of truth for quote-only print-services: safe SEO without fake offers.
const services=require('../public/pechatni-produkti/catalog.json');
const variations=require('../public/pechatni-produkti/variation-config.json');
const SITE='https://vinilpechat.vercel.app';
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(v,n=220)=>String(v??'').trim().replace(/\s+/g,' ').slice(0,n);
const schema=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const path=p=>'/pechatni-produkti/'+p.slug;
const byId=new Map(services.items.map(p=>[p.id.toLowerCase(),p]));
function variationMarkup(p){
 const cfg=variations.items[p.id];
 if(!cfg)throw new Error('Missing variation config for '+p.id);
 const inp=(id,label,value)=>'<label class="vp-measure-label" for="'+id+'"><span>'+label+'</span><input type="number" id="'+id+'" name="'+id+'" min="5" max="2000" step="0.01" inputmode="decimal" value="'+value+'" required></label>';
 const size=cfg.presets[0];
 const fast=cfg.presets.map((o,i)=>'<button class="vp-preset'+(i===0?' is-active':'')+'" type="button" data-vp-preset="'+i+'">'+escapeHtml(o.label)+'</button>').join('');
 const renderField=f=>'<fieldset class="vp-choice-group" data-vp-choice-group="'+escapeHtml(f.id)+'"><legend>'+escapeHtml(f.label)+'</legend>'+
  (f.kind==='select'?'<label class="vp-choice-select"><span class="vp-visually-hidden">'+escapeHtml(f.label)+'</span><select name="vp-'+escapeHtml(f.id)+'" data-vp-choice="'+escapeHtml(f.id)+'">'+f.choices.map(c=>'<option value="'+escapeHtml(c.value)+'">'+escapeHtml(c.label)+'</option>').join('')+'</select></label>':
  '<div class="vp-choice-grid">'+f.choices.map((c,i)=>'<label class="vp-choice-card"><input type="radio" name="vp-'+escapeHtml(f.id)+'" data-vp-choice="'+escapeHtml(f.id)+'" value="'+escapeHtml(c.value)+'"'+(i===0?' checked':'')+'><span class="vp-choice-title">'+escapeHtml(c.label)+'</span>'+(c.hint?'<small>'+escapeHtml(c.hint)+'</small>':'')+'</label>').join('')+'</div>')+'</fieldset>';
 return '<form id="vp-product-config" class="vp-configurator" novalidate>'+
  '<div class="vp-config-kicker">ПЕРСОНАЛИЗИРАНА ПОРЪЧКА · ПО ЗАПИТВАНЕ</div>'+
  '<h2>Избери варианти на продукта</h2><p class="vp-config-note">Параметрите са ориентировъчни предпочитания за оферта. Наличностите, ограниченията на размерите и цената се потвърждават от Vinilpechat.</p>'+
  '<fieldset class="vp-choice-group vp-size-group"><legend>Размер и количество</legend><div class="vp-size-preset-label">Популярни примерни размери</div><div class="vp-size-presets">'+fast+'</div>'+
  '<div class="vp-size-inputs">'+inp('vp-width','Ширина (см)',size.width_cm)+inp('vp-height','Височина (см)',size.height_cm)+
  '<label class="vp-measure-label" for="vp-service-qty"><span>Количество</span><input id="vp-service-qty" type="number" min="1" max="1000" step="1" value="1" inputmode="numeric" required></label></div>'+
  '<p id="vp-measure-error" class="vp-form-error" role="alert" hidden></p></fieldset>'+
  cfg.fields.map(renderField).join('')+
  '<div class="vp-config-bottom"><div class="vp-config-summary" aria-live="polite">'+
  '<strong>Твоята конфигурация</strong><div class="vp-config-live">'+
  '<span id="vp-config-dimensions">—</span><span id="vp-config-variant-summary">Избери вариантите</span></div>'+
  '<div class="vp-config-estimate"><span>Ориентировъчна цена</span><strong>По запитване</strong></div>'+
  '<small>Не използваме цените от друг магазин. След запитването потвърждаваме изпълнение и крайна цена.</small></div>'+
  '<button id="vp-service-add" type="submit" class="vp-add">Добави конфигурацията към общото запитване</button>'+
  '<div class="vp-share-tools"><button id="vp-config-share" type="button">Сподели настройките ↗</button><input id="vp-share-url" type="text" readonly aria-label="Адрес за споделяне на конфигурацията" placeholder="Връзката ще се появи тук"></div>'+
  '<p id="vp-service-status" role="status" aria-live="polite"></p>'+
  '<a class="vp-service-quote-link" href="/zapitvane/">Отвори общото запитване ↗</a></div>'+
  '</form>'+
  '<script id="vp-service-data" type="application/json">'+schema({id:p.id,name:p.name,slug:p.slug,options:cfg,rules:{min:variations.minimum_cm,max:variations.maximum_cm,qty_max:variations.maximum_qty}})+'</script>';
}

function detail(slug){
 if(typeof slug!=='string'||slug.length>180||slug.includes('/')||slug.includes('%'))return null;
 const match=slug.toLowerCase().match(/^(vp4-\d{3})-[a-z0-9-]+$/);
 if(!match)return null;
 const p=byId.get(match[1]);if(!p)return null;
 const canonical=path(p);if('/pechatni-produkti/'+slug!==canonical)return {redirect:canonical};
 const verified=p.approved===true;
 const desc=text(p.description+' За точна оферта уточни размери, количество, материал и желаната обработка. Vinilpechat.',240);
 const title=text(p.name+' по запитване | Vinilpechat',145);
 const image=SITE+p.image;
 const metaRobots=verified?'index,follow,max-image-preview:large':'noindex,follow';
 const a=[{name:'Начало',url:'/'},{name:'Печатни продукти',url:'/pechatni-produkti/'},{name:p.name,url:canonical}];
 const provider={'@type':'Organization','name':'Vinilpechat','url':SITE+'/'};
 const breadcrumbs={'@type':'BreadcrumbList','itemListElement':a.map((x,i)=>({'@type':'ListItem','position':i+1,'name':x.name,'item':SITE+x.url}))};
 const entity=verified?{'@type':'Service','name':p.name,'description':desc,'serviceType':p.name,'provider':provider,'image':image,'url':SITE+canonical,'areaServed':{'@type':'Country','name':'България'}}:
  {'@type':'WebPage','@id':SITE+canonical+'#webpage','name':p.name,'description':desc,'url':SITE+canonical,'primaryImageOfPage':{'@type':'ImageObject','url':image}};
 const tips=p.category==='Печатни материали'?
 ['Размер и формат на изделието','Хартия, граматура и покритие','Едностранен или двустранен печат','Тираж и желана дата']:
 p.category==='Фолиа и стикери'?
 ['Вид на повърхността и приложение','Размер, брой и очертания за рязане','Подходящ материал и ламинация','Монтаж и желана дата']:
 p.category==='Изложения и събития'?
 ['Размер на системата и пространството','Вид конструкция или стойка','Файл за печат и обработка','Количество и дата на събитието']:
 ['Размер и място на приложение','Материал и закрепване','Брой и довършителна обработка','Файл за печат и желана дата'];
 const alt=text(p.image_alt||p.name+' – оригинална илюстрация Vinilpechat');
 const related=services.items.filter(x=>x.id!==p.id&&x.category===p.category).slice(0,4);
 const cards=related.map(x=>'<a class="vp-service-related-card" href="'+escapeHtml(path(x))+'"><img loading="lazy" decoding="async" src="'+escapeHtml(x.image)+'" alt="'+escapeHtml(x.image_alt)+'" width="300" height="200"><span>'+escapeHtml(x.name)+'</span></a>').join('');
 const html='<!doctype html><html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<meta name="robots" content="'+metaRobots+'"><title>'+escapeHtml(title)+'</title>'+
 '<meta name="description" content="'+escapeHtml(desc)+'"><link rel="canonical" href="'+escapeHtml(SITE+canonical)+'">'+
 '<meta property="og:type" content="website"><meta property="og:locale" content="bg_BG"><meta property="og:site_name" content="Vinilpechat">'+
 '<meta property="og:title" content="'+escapeHtml(title)+'"><meta property="og:description" content="'+escapeHtml(desc)+'">'+
 '<meta property="og:url" content="'+escapeHtml(SITE+canonical)+'"><meta property="og:image" content="'+escapeHtml(image)+'">'+
 '<meta property="og:image:alt" content="'+escapeHtml(alt)+'"><meta name="twitter:card" content="summary_large_image">'+
 '<link rel="icon" type="image/svg+xml" href="/assets/vinilpechat-spectrum-logo.svg">'+
 '<link rel="stylesheet" href="/seo.css"><link rel="stylesheet" href="/v4.css"><link rel="stylesheet" href="/pechatni-produkti/catalog.css">'+
 '<link rel="stylesheet" href="/pechatni-produkti/detail.css">'+
 '<script type="application/ld+json">'+schema({'@context':'https://schema.org','@graph':[provider,entity,breadcrumbs]})+'</script>'+
 '<script src="/quote-cart.js" defer></script><script src="/pechatni-produkti/detail.js" defer></script></head><body>'+
 '<header class="vp-top"><nav class="vp-nav" aria-label="Основна навигация">'+
 '<a class="vp-brand" href="/"><img src="/assets/vinilpechat-spectrum-logo.svg" width="46" height="46" alt=""><strong>Vinilpechat <small>ПЕЧАТ БЕЗ ГРАНИЦИ</small></strong></a>'+
 '<div class="vp-nav-links"><a href="/">Начало</a><a href="/#design">Печат на винил</a><a href="/brezenti/">Винили за покриване</a><a href="/teniski/">Тениски</a></div>'+
 '<a class="vp-quote-link" href="/zapitvane/">Общо запитване <b data-v4-quote-count>0</b></a></nav></header>'+
 '<main class="vp-service-main"><nav class="vp-service-crumbs" aria-label="Пътечка"><a href="/">Начало</a> / <a href="/pechatni-produkti/">Печатни продукти</a> / '+escapeHtml(p.name)+'</nav>'+
 '<div class="vp-service-layout"><figure class="vp-service-figure"><img src="'+escapeHtml(p.image)+'" alt="'+escapeHtml(alt)+'" width="960" height="640" fetchpriority="high" decoding="async"><figcaption>'+(p.image.endsWith('.webp')?'Реална продуктова снимка · Примерен вид':'Оригинална илюстрация · Примерен вид')+'</figcaption></figure>'+
 '<article class="vp-service-info" data-vp-service="'+escapeHtml(p.id)+'"><span class="vp-eyebrow">'+escapeHtml(p.category)+' · ВЪЗМОЖНОСТ ЗА ЗАПИТВАНЕ</span>'+
 '<h1>'+escapeHtml(p.name)+'</h1><p class="vp-service-lead">'+escapeHtml(p.description)+'</p>'+
 '<p>Този тип изделие се предлага за индивидуално обсъждане. Не обявяваме цена, наличност или срок, преди да уточним параметрите на проекта.</p>'+
 '<h2>Какво е необходимо за оферта?</h2><ul>'+tips.map(t=>'<li>'+escapeHtml(t)+'</li>').join('')+'</ul>'+
 variationMarkup(p)+
 '<small class="vp-service-safety">Печатните файлове се изпращат отделно. Няма онлайн плащане.</small></article></div>'+
 '<section class="vp-service-related"><h2>Още от '+escapeHtml(p.category)+'</h2><div>'+cards+'</div></section>'+
 '<p class="vp-service-back"><a href="/pechatni-produkti/">← Върни се към всички печатни изделия</a></p></main>'+
 '<footer class="vp-footer">© Vinilpechat · <a href="/#contact">Контакти</a> · <a href="/#privacy">Поверителност</a></footer></body></html>';
 return {canonical,html,verified,image};
}
const approved=()=>services.items.filter(x=>x.approved===true).map(path);
module.exports={detail,approved,path};
