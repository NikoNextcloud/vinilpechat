'use strict';
/* Same transliterated URL algorithm as the server-side SEO pages. */
(function(root){
 const transliteration={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sht','ъ':'a','ь':'y','ю':'yu','я':'ya','ѝ':'i'};
 function slugify(value){
  return String(value||'').toLowerCase().split('').map(c=>transliteration[c]||c).join('')
   .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
   .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,90)||'produkt';
 }
 const productUrl=p=>'/produkti/'+encodeURIComponent(String(p.id))+'-'+slugify(p.name);
 const api={slugify,productUrl};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.VinilProductLinks=api;
})(typeof window==='undefined'?null:window);
