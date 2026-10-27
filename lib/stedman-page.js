'use strict';
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../data/stedman-catalog.json');
const {modelPath,matchPath}=require('../public/teniski/model-links.js');
const BASE='https://vinilpechat.vercel.app';
const templatePath=path.join(__dirname,'../public/teniski/index.html');
const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function resolve(slug){
 if(typeof slug!=='string'||slug.length>900||slug.includes('/'))return null;
 const model=matchPath('/teniski/'+slug,catalog);
 if(!model)return null;
 const canonical=modelPath(model);
 let incoming;
 try{incoming=decodeURIComponent('/teniski/'+slug).replace(/\/$/,'');}catch{return null;}
 if(incoming!==decodeURIComponent(canonical))return {redirect:canonical};
 const title=model.bg+' — '+model.id+' | Vinilpechat';
 const desc=model.desc||'Разгледай модел '+model.id+', избери цвят, размер и позиция на щампата.';
 const image=typeof model.image==='string'&&model.image.startsWith('https://')?model.image:'';
 // Prices depend on live size/color overrides and are not rendered in this
 // initial HTML. Do not advertise an incomplete Product rich-result entity.
 const structured=JSON.stringify({'@context':'https://schema.org','@graph':[
  {'@type':'WebPage','@id':BASE+canonical+'#webpage',name:model.bg,identifier:model.id,description:desc,url:BASE+canonical,...(image?{primaryImageOfPage:{'@type':'ImageObject',url:image}}:{})},
  {'@type':'BreadcrumbList',itemListElement:[{ '@type':'ListItem',position:1,name:'Начало',item:BASE+'/'},{'@type':'ListItem',position:2,name:'Тениски за печат',item:BASE+'/teniski/'},{'@type':'ListItem',position:3,name:model.bg+' '+model.id,item:BASE+canonical}]}
 ]})
  .replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 let html=fs.readFileSync(templatePath,'utf8');
 html=html.replace(/<title>[^<]*<\/title>/,'<title>'+escapeHtml(title)+'</title>');
 html=html.replace(/<meta name="description" content="[^"]*">/,'<meta name="description" content="'+escapeHtml(desc)+'">');
 html=html.replace(/<link rel="canonical" href="[^"]*">/,'<link rel="canonical" href="'+escapeHtml(BASE+canonical)+'">');
 html=html.replace('</head>','<meta property="og:type" content="product"><meta property="og:title" content="'+escapeHtml(title)+'"><meta property="og:description" content="'+escapeHtml(desc)+'"><meta property="og:url" content="'+escapeHtml(BASE+canonical)+'">'+
  (image?'<meta property="og:image" content="'+escapeHtml(image)+'">':'')+
  '<script type="application/ld+json">'+structured+'</script></head>');
 html=html.replace('</main>','<noscript><section class="catalog"><h1>'+escapeHtml(model.bg)+' · '+escapeHtml(model.id)+'</h1><p>'+escapeHtml(desc)+'</p><p>За да избереш цвят, размер и щампа, активирай JavaScript.</p></section></noscript></main>');
 return {html,canonical,model};
}
module.exports={resolve};
