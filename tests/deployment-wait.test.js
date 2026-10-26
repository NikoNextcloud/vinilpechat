'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {waitForProduction}=require('../scripts/wait-for-production.cjs');
const sha='a'.repeat(40);
function fixture(responses){
 let time=0;
 const calls=[],logs=[];
 return {calls,logs,options:{base:'https://vinilpechat.vercel.app',expectedSha:sha,
  timeoutMs:30,intervalMs:10,now:()=>time,sleep:async ms=>{time+=ms;},log:s=>logs.push(s),
  fetchImpl:async(url,options)=>{
   calls.push({url,options});
   const response=responses.shift();
   if(response instanceof Error)throw response;
   return Response.json(response?.body||{ok:true,commit:'b'.repeat(40)},{status:response?.status||200});
  }}};
}
test('production wait rejects old or missing revisions, then accepts only the exact healthy revision',async()=>{
 const f=fixture([{body:{ok:true}},{body:{ok:true,commit:'b'.repeat(40)}},{body:{ok:true,commit:sha}}]);
 const health=await waitForProduction(f.options);
 assert.equal(health.commit,sha);
 assert.equal(f.calls.length,3);
 for(const {url,options} of f.calls){
  assert.equal(url.pathname,'/api/health');
  assert.equal(url.searchParams.get('seo_revision'),sha);
  assert.equal(options.cache,'no-store');
  assert.equal(options.redirect,'error');
  assert.equal(options.method,undefined); // GET only; no catalog or database writes.
 }
 assert.equal(new Set(f.calls.map(c=>c.url.href)).size,3);
});
test('temporary deployment/network errors are retried without running the audit early',async()=>{
 const f=fixture([{status:503},new Error('connection reset'),{body:{ok:true,commit:sha}}]);
 assert.equal((await waitForProduction(f.options)).commit,sha);
 assert.match(f.logs[0],/HTTP 503/);
 assert.match(f.logs[1],/connection reset/);
});
test('an old revision times out, and the requested revision must also be healthy',async()=>{
 for(const responses of [[],Array.from({length:3},()=>({body:{ok:false,commit:sha}}))]){
  const f=fixture(responses);
  await assert.rejects(waitForProduction(f.options),/did not serve commit.*within 30ms/);
  assert.equal(f.calls.length,3);
 }
});
test('missing or abbreviated commit hashes fail before making requests',async()=>{
 const f=fixture([]);
 for(const expectedSha of [undefined,'a16ab4e','not-a-sha']){
  await assert.rejects(waitForProduction({...f.options,expectedSha}),/full Git commit SHA/);
 }
 assert.equal(f.calls.length,0);
});
