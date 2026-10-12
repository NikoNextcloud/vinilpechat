'use strict';
const pages=[1374,1925,489];
async function main(){
  for(const id of pages){
    const u='https://www.vipborsa.com/index.php?route=product/product&product_id='+id;
    try{
      const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(18000)});
      const html=await r.text();
      const optionMatches=Array.from(html.matchAll(/<select\b[^>]*>[\s\S]*?<\/select>|<div\b[^>]*id\s*=\s*["']input-option\d+["'][^>]*>[\s\S]{0,1600}/gi)).filter(m=>/option\[|input-option|Размер|размер|Размери|размери/i.test(m[0]));
      const group=Array.from(html.matchAll(/<div\b[^>]*class\s*=\s*["'][^"']*form-group[^"']*["'][^>]*>[\s\S]{0,2600}/gi)).filter(m=>/option\[|input-option/i.test(m[0])).map(m=>m[0]);
      let fragments=[...optionMatches.map(m=>m[0]),...group].slice(0,2).map(x=>x.slice(0,1250).replace(/\s+/g,' '));
      const priceTag=html.match(/(?:id="product"|name="option\\[)[\\s\\S]{0,250}/i);
      const scripts=Array.from(html.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi));
      const scriptsInfo=scripts.map((m,i)=>({i,attrs:m[1].replace(/\\s+/g,' ').slice(0,190),body:m[2]})).filter(x=>/option\\[|price|total|product_id|ajax|qty|liveprice/i.test(x.body)||/price|option/i.test(x.attrs)).map(x=>({i:x.i,attrs:x.attrs,text:x.body.trim().slice(0,3200)})).slice(0,15);
      console.log('VARIANT_SCRIPTS '+JSON.stringify({id,scriptsInfo}));
      console.log('VARIANT_PROBE '+JSON.stringify({id,status:r.status,htmlBytes:html.length,optionMatchCount:optionMatches.length,groupCount:group.length,fragments,priceTag:priceTag?.[0]?.replace(/\s+/g,' ').slice(0,150)}));
    }catch(e){console.log('VARIANT_PROBE '+JSON.stringify({id,error:e.message}));}
  }
}
main().catch(e=>{console.error('VARIANT_PROBE_FATAL',e.message);process.exitCode=1});
