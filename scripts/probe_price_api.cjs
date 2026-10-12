'use strict';
const tests=[
 {id:1374,choices:{"option[661]":"39962"}},
 {id:1374,choices:{"option[661]":"39963"}},
 {id:1925,choices:{"option[662]":"39967"}},
 {id:1925,choices:{"option[662]":"39971"}},
 {id:489,choices:{"option[256]":"39189","option[257]":"39190"}},
 {id:489,choices:{"option[256]":"39186","option[257]":"39190"}}
];
async function run(){
 for(const t of tests){
  const base='https://www.vipborsa.com/';
  try{
   const page=await fetch(base+'index.php?route=product/product&product_id='+t.id,{headers:{'User-Agent':'Mozilla/5.0'},signal:AbortSignal.timeout(16000)});
   const cookie=(page.headers.get('set-cookie')||'').split(';')[0];await page.arrayBuffer();
   const body=new URLSearchParams({product_id:String(t.id),quantity:'1',...t.choices});
   const r=await fetch(base+'index.php?route=checkout/cart/getOPrice',{method:'POST',headers:{'User-Agent':'Mozilla/5.0','Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','Accept':'application/json,text/javascript,*/*;q=0.01','X-Requested-With':'XMLHttpRequest','Referer':base+'index.php?route=product/product&product_id='+t.id,...(cookie?{'Cookie':cookie}:{})},body:body.toString(),signal:AbortSignal.timeout(16000)});
   const raw=await r.text();console.log('PRICE_API_RESULT '+JSON.stringify({id:t.id,choices:t.choices,status:r.status,raw:raw.slice(0,500)}));
  }catch(e){console.log('PRICE_API_RESULT '+JSON.stringify({id:t.id,error:e.message}))}
 }
}
run().catch(e=>{console.error('PRICE_API_FATAL',e.message);process.exitCode=1});
