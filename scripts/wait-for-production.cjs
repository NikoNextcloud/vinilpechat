'use strict';
const {setTimeout:delay}=require('node:timers/promises');

// Wait for the production alias to serve THIS checkout, not just any healthy build.
// This endpoint reads no catalog data and requires no deployment or database secret.
async function waitForProduction({base,expectedSha,timeoutMs=360000,intervalMs=5000,
 fetchImpl=fetch,now=Date.now,sleep=delay,log=console.log}){
 if(!/^[a-f0-9]{40}$/i.test(expectedSha||''))throw new Error('SEO_EXPECTED_SHA must be a full Git commit SHA');
 const deadline=now()+timeoutMs;
 let last='no response';
 while(now()<deadline){
  const url=new URL('/api/health',base);
  url.searchParams.set('seo_revision',expectedSha);
  url.searchParams.set('probe',String(now()));
  try{
   const res=await fetchImpl(url,{redirect:'error',cache:'no-store',
    signal:AbortSignal.timeout(Math.max(1,Math.min(15000,deadline-now()))),
    headers:{'Cache-Control':'no-cache','User-Agent':'Vinilpechat-Deployment-Wait/1.0'}});
   if(res.ok){
    const health=await res.json();
    last='commit '+(health.commit||'unavailable');
    if(health.ok===true&&health.commit===expectedSha){
     log('Production is serving commit '+expectedSha);
     return health;
    }
   }else last='HTTP '+res.status;
  }catch(error){last=error.message;}
  log('Waiting for production '+expectedSha+'; observed '+last);
  const remaining=deadline-now();
  if(remaining>0)await sleep(Math.min(intervalMs,remaining));
 }
 throw new Error('Production did not serve commit '+expectedSha+' within '+timeoutMs+'ms; last observed '+last);
}

module.exports={waitForProduction};
if(require.main===module){
 waitForProduction({base:process.env.SEO_BASE_URL||'https://vinilpechat.vercel.app',
  expectedSha:process.env.SEO_EXPECTED_SHA}).catch(error=>{console.error(error.message);process.exitCode=1;});
}
