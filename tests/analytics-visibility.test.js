'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Vercel Web Analytics script is installed across storefront entry points',()=>{
 for(const pathname of ['public/index.html','public/teniski/index.html','public/nov-vinil/index.html','public/brezenti/index.html','lib/seo-pages.js']){
  const source=read(pathname);
  assert.match(source,/\/_vercel\/insights\/script\.js/,pathname);
 }
});
test('Public Stedman catalog is indexable and no longer labeled a test',()=>{
 const html=read('public/teniski/index.html');
 assert.match(html,/robots" content="index,follow/);
 assert.match(html,/rel="canonical" href="https:\/\/vinilpechat\.vercel\.app\/teniski\/"/);
 assert.doesNotMatch(html,/Тестова версия/);
});
test('Analytics navigation is rendered only inside authorized administration',()=>{
 const js=read('public/site.js');
 assert.match(js,/if\(!state\.isAdmin\)\{\$\('#main'\)\.innerHTML=adminLogin\(\);return\}/);
 assert.match(js,/\['visitors','Посещения'\]/);
 assert.match(js,/if\(t==='visitors'\)/);
 assert.match(js,/https:\/\/vercel\.com\/ni-ko2\/vinilpechat\/analytics/);
 assert.doesNotMatch(read('public/index.html'),/vercel\.com\/ni-ko2\/vinilpechat\/analytics/);
});
