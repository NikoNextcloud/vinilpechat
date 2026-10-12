'use strict';
async function main(){
 const id=1374, u='https://www.vipborsa.com/index.php?route=product/product&product_id='+id;
 const r=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});
 const html=await r.text();
 const scripts=Array.from(html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi));
 scripts.forEach((m,i)=>{const body=m[2].trim(),attrs=m[1].trim();
  console.log('PRICE_SCRIPT_INFO '+JSON.stringify({i,attrs:attrs.slice(0,160),length:body.length,
   priceCount:(body.match(/price/gi)||[]).length,optionCount:(body.match(/option/gi)||[]).length,
   urls:Array.from(body.matchAll(/(?:route=|url:\s*['"])([^'"&\n\s]{2,90})/gi)).map(z=>z[0]).slice(0,8)}));
  if(i>=14){for(let j=0;j<body.length;j+=800)console.log('PRICE_SCRIPT_CHUNK '+JSON.stringify({i,part:j,body:body.slice(j,j+800)}));}
 });
}
main().catch(e=>{console.error('PRICE_SCRIPT_FATAL',e.message);process.exitCode=1});
