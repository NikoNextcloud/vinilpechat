'use strict';
// Server-only, read-only Facebook Page posts feed.
// Never sends a Meta access token or raw Graph error to the visitor.
const PAGE_ID='61559753162459';
const GRAPH_VERSION='v26.0';
const PROFILE_URL='https://www.facebook.com/profile.php?id='+PAGE_ID;
const FEED_LIMIT=9;
const CACHE_MS=15*60*1000;
let cache={token:null,until:0,data:null};
const validToken=t=>typeof t==='string'&&t.trim().length>=20&&!/^(REPLACE|YOUR_|EXAMPLE|PASTE_)/i.test(t.trim());
const safeUrl=(raw,kind)=>{
  try{
    const u=new URL(String(raw||''));
    if(u.protocol!=='https:'||u.username||u.password)return '';
    const host=u.hostname.toLowerCase();
    if(kind==='photo')return (host==='fbcdn.net'||host.endsWith('.fbcdn.net')||host==='facebook.com'||host.endsWith('.facebook.com'))?u.href:'';
    return (host==='facebook.com'||host.endsWith('.facebook.com')||host==='fb.watch')?u.href:'';
  }catch{return ''}
};
function photoFromPost(row){
 const media=row?.attachments?.data?.[0];
 const sub=media?.subattachments?.data?.[0];
 return safeUrl(row?.full_picture,'photo')||safeUrl(media?.media?.image?.src,'photo')||safeUrl(sub?.media?.image?.src,'photo');
}
function normalizePosts(payload){
 if(!Array.isArray(payload?.data))return [];
 return payload.data.filter(p=>p&&p.is_published!==false).map(row=>{
  const message=String(row.message??'').trim().slice(0,900);
  const picture=photoFromPost(row);
  const permalink=safeUrl(row.permalink_url,'post');
  const date=new Date(row.created_time||'');
  if(!permalink||!Number.isFinite(date.getTime())||(!message&&!picture))return null;
  const id=String(row.id||'').match(/^\d+(?:_\d+)?$/)?.[0]||permalink;
  return {id,message,image_url:picture,url:permalink,published_at:date.toISOString()};
 }).filter(Boolean).slice(0,FEED_LIMIT);
}
async function getFacebookPosts(options={}){
 const token=options.token??process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
 if(!validToken(token))return {status:'needs_connection',posts:[],profile_url:PROFILE_URL};
 const now=options.now??Date.now();
 const useCache=options.useCache!==false;
 if(useCache&&cache.data&&cache.token===token&&now<cache.until)return cache.data;
 const fetchFn=options.fetchFn||globalThis.fetch;
 const url=new URL('https://graph.facebook.com/'+GRAPH_VERSION+'/'+PAGE_ID+'/posts');
 url.searchParams.set('fields','id,message,created_time,permalink_url,full_picture,is_published,attachments{media,subattachments{media}}');
 url.searchParams.set('limit','18');
 let result={status:'unavailable',posts:[],profile_url:PROFILE_URL};
 try{
  const response=await fetchFn(url.href,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error('Graph API returned non-2xx');
  const payload=await response.json();
  if(payload?.error||!Array.isArray(payload?.data))throw Error('Invalid Graph API response');
  result={status:'ready',posts:normalizePosts(payload),profile_url:PROFILE_URL};
 }catch{
  // Intentional: do not reveal Page token, Graph error messages or details to public visitors.
  if(cache.data?.status==='ready'&&cache.token===token&&now-cache.until<3*60*60*1000)
   return {...cache.data,status:'stale'};
 }
 if(useCache){cache={token,until:now+(result.status==='ready'?CACHE_MS:60*1000),data:result};}
 return result;
}
module.exports={getFacebookPosts,normalizePosts,photoFromPost,safeUrl,PAGE_ID,PROFILE_URL};
