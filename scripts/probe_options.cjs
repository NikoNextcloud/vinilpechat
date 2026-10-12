'use strict';
const pages=[1374,1925,489];
async function main(){
  for(const id of pages){
    const u='https://www.vipborsa.com/index.php?route=product/product&product_id='+id;
    try{
      const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(18000)});
      const html=await r.text();
      const scripts=Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi));
      const scriptsInfo=scripts.map((m,i)=>({i,attrs:m[1].replace(/\s+/g,' ').slice(0,190),body:m[2]})).filter(x=>/option\[|price|total|product_id|ajax|qty|liveprice/i.test(x.body)||/price|option/i.test(x.attrs)).map(x=>({i:x.i,attrs:x.attrs,text:x.body.trim().slice(0,3500)})).slice(0,17);
      console.log('VARIANT_SCRIPTS '+JSON.stringify({id,status:r.status,totalScripts:scripts.length,scriptsInfo}));
    }catch(e){console.log('VARIANT_SCRIPTS '+JSON.stringify({id,error:e.message}));}
  }
}
main().catch(e=>{console.error('VARIANT_PROBE_FATAL',e.message);process.exitCode=1});
