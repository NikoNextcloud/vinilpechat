'use strict';
const base='https://scorpioplast.com/dom-i-gradina/';
const paths=[base,base+'page/2/',base+'page/3/'];
const dec=x=>String(x||'').replace(/&amp;/g,'&').replace(/&#038;/g,'&').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ');
(async()=>{
 for(const path of paths){
  try{
   const res=await fetch(path,{headers:{'User-Agent':'Mozilla/5.0 (compatible; CatalogImport/1.0)','Accept':'text/html,application/xhtml+xml'},redirect:'follow',signal:AbortSignal.timeout(17000)});
   const html=await res.text();
   const parts=[...html.matchAll(/<li\b[^>]*class=(["'])([^"']*\bproduct\b[^"']*)\1[^>]*>([\s\S]*?)<\/li>/gi)];
   const titleLinks=[...html.matchAll(/<h2\b[^>]*class=(["'])[^"']*woocommerce-loop-product__title[^"']*\1[^>]*>([\s\S]*?)<\/h2>/gi)];
   let examples=parts.slice(0,2).map(z=>({css:z[2].slice(0,100),html:z[0].slice(0,1800)}));
   const titles=titleLinks.slice(0,4).map(z=>dec(z[2].replace(/<[^>]*>/g,'')).trim());
   const pageTitle=(html.match(/<title[^>]*>(.*?)<\/title>/is)||[])[1];
   console.log('SCORPIO_PROBE '+JSON.stringify({path,status:res.status,actualUrl:res.url,bytes:html.length,pageTitle,titleLinks:titleLinks.length,listBlocks:parts.length,titles,examples}).slice(0,5600));
  }catch(e){console.log('SCORPIO_PROBE '+JSON.stringify({path,error:e.message}));}
 }
})().catch(e=>{console.log('SCORPIO_PROBE_FATAL '+e.message);process.exitCode=1;});
