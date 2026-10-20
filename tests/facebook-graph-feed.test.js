'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {getFacebookPosts,normalizePosts,safeUrl,PAGE_ID}=require('../lib/facebook-feed.js');
const handler=require('../api/index.js');
const ROOT=path.join(__dirname,'..');

test('Meta feed is unconfigured without a Page token; no external request is made',async()=>{
 let calls=0;
 const result=await getFacebookPosts({token:'',useCache:false,fetchFn:async()=>{calls++;throw Error('Should not fetch')}});
 assert.equal(result.status,'needs_connection');
 assert.deepEqual(result.posts,[]);
 assert.equal(calls,0);
 assert.ok(result.profile_url.includes(PAGE_ID));
});

test('real published posts include date, original links, text and supported photo sources',()=>{
 const posts=normalizePosts({data:[
  {id:'61559753162459_1234',message:'Нашият нов винил е готов!',permalink_url:'https://www.facebook.com/61559753162459/posts/1234',created_time:'2026-10-20T10:20:00+0000',full_picture:'https://scontent.xx.fbcdn.net/img.jpg',is_published:true},
  {id:'61559753162459_2234',message:'Втора публикация',permalink_url:'https://www.facebook.com/61559753162459/posts/2234',created_time:'2026-10-20T09:10:00Z',attachments:{data:[{media:{image:{src:'https://scontent.xx.fbcdn.net/other.png'}}}]}},
  {id:'61559753162459_9999',message:'Не трябва да се вижда',permalink_url:'https://www.facebook.com/example',created_time:'2026-10-20T08:10:00Z',is_published:false},
  {id:'61559753162459_8888',message:'Непозволен линк',permalink_url:'https://evil.example/steal',created_time:'2026-10-20T08:10:00Z',full_picture:'https://evil.example/pic'}
 ]});
 assert.equal(posts.length,2);
 assert.equal(posts[0].message,'Нашият нов винил е готов!');
 assert.equal(posts[0].image_url,'https://scontent.xx.fbcdn.net/img.jpg');
 assert.equal(posts[1].image_url,'https://scontent.xx.fbcdn.net/other.png');
 assert.match(posts[0].published_at,/2026-10-20T10:20:00/);
 assert.equal(safeUrl('javascript:alert(1)','post'),'');
 assert.equal(safeUrl('https://evil.example/image.jpg','photo'),'');
});
test('Meta request never exposes the access token in a public URL or response',async()=>{
 const token='secret_page_access_token_no_public_output';
 let url,headers;
 const result=await getFacebookPosts({token,useCache:false,fetchFn:async(u,opts)=>{
  url=u;headers=opts.headers;
  return {ok:true,json:async()=>({data:[{id:'61559753162459_12345',message:'Истинска публикация',permalink_url:'https://www.facebook.com/61559753162459/posts/12345',created_time:'2026-10-20T11:00:00Z'}]})};
 }});
 assert.equal(result.status,'ready');
 assert.equal(result.posts.length,1);
 assert.ok(url.includes('/'+PAGE_ID+'/posts'));
 assert.ok(url.includes('limit=18'));
 assert.ok(!url.includes(token));
 assert.equal(headers.Authorization,'Bearer '+token);
 assert.ok(!JSON.stringify(result).includes(token));
});
test('Meta failure does not expose secrets or error messages',async()=>{
 const result=await getFacebookPosts({token:'secret_page_access_token_error_path',useCache:false,fetchFn:async()=>{throw Error('secret page token information')}});
 assert.equal(result.status,'unavailable');
 assert.equal(result.posts.length,0);
 assert.ok(!JSON.stringify(result).includes('secret'));
});
test('one existing Vercel function serves the public feed without Supabase or Meta secrets',async()=>{
 const req={method:'GET',url:'/api/social/facebook',query:{route:'social/facebook'},headers:{host:'vinilpechat.vercel.app'}};
 const res={statusCode:0,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v},status(n){this.statusCode=n;return this},json(data){this.data=data;return this}};
 const had=process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
 try{
  delete process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  await handler(req,res);
  assert.equal(res.statusCode,200);
  assert.equal(res.data.status,'needs_connection');
  assert.equal(res.headers['cache-control'],'no-store');
 }finally{if(had!==undefined)process.env.FACEBOOK_PAGE_ACCESS_TOKEN=had;}
 const apiFiles=fs.readdirSync(path.join(ROOT,'api'),{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.js'));
 assert.deepEqual(apiFiles.map(x=>x.name),['index.js']);
});
test('website shows real Facebook cards safely and keeps existing Instagram/fallback',()=>{
 const html=fs.readFileSync(path.join(ROOT,'public/index.html'),'utf8');
 const js=fs.readFileSync(path.join(ROOT,'public/site.js'),'utf8');
 const css=fs.readFileSync(path.join(ROOT,'public/site.css'),'utf8');
 assert.ok(html.includes('id="facebookFeedContent"'));
 assert.ok(html.includes('https://www.instagram.com/vinilpechat/embed/'));
 assert.ok(html.includes('https://www.facebook.com/profile.php?id=61559753162459'));
 assert.ok(!html.includes('www.facebook.com/plugins/page.php'));
 assert.ok(js.includes("fetch('/api/social/facebook'"));
 assert.ok(js.includes('document.createElement('));
 assert.ok(js.includes('textContent=post.message'));
 assert.ok(js.includes('IntersectionObserver'));
 assert.ok(css.includes('.facebook-real-posts{'));
 assert.ok(css.includes('.facebook-post-card{'));
 assert.ok(css.includes('overflow:auto'));
});
