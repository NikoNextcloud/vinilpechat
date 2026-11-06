'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function renderHomepage(){
 const source=read('public/site.js');
 const fn=source.slice(source.indexOf('function renderChoiceLanding(){'),source.indexOf('const designFormat'));
 const main={innerHTML:''};
 vm.runInNewContext(fn+'\nrenderChoiceLanding();',{$:()=>main,document:{title:'',querySelectorAll:()=>[]}});
 return main.innerHTML;
}
test('Homepage provides four accessible service sections in dynamic and static content',()=>{
 const html=read('public/index.html'),rendered=renderHomepage();
 for(const home of [rendered,html.slice(html.indexOf('<main id="main">'),html.indexOf('</main>'))]){
  assert.equal((home.match(/<section class="aero-panel /g)||[]).length,4);
  assert.equal((home.match(/<h1\b/g)||[]).length,1);
  for(const href of ['/#design','/nov-vinil/','/brezenti/','/teniski/','/pechatni-produkti/','/zapitvane/'])assert(home.includes('href="'+href+'"'));
  for(const title of ['aero-title','aero-shirts-title','aero-products-title','aero-materials-title']){
   assert(home.includes('aria-labelledby="'+title+'"'));
   assert(home.includes('id="'+title+'"'));
  }
  for(const match of home.matchAll(/<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g)){
   assert(match[2].trim());
   if(match[1].startsWith('/'))assert(fs.existsSync(path.join(root,'public',match[1])));
  }
 }
 assert(html.includes('id="instagram-posts"')&&html.includes('id="facebook-card-title"'));
});
test('Home marketing and metadata consistently describe the offered services',()=>{
 const h=read('public/index.html'),s=read('public/site.js');
 assert.match(h,/<meta name="description" content="[^"]*печатни рекламни продукти/);
 assert.match(h,/rel="canonical" href="https:\/\/vinilpechat\.vercel\.app\/"/);
 assert(!s.includes('ТРИ НАЧИНА ДА РЕАЛИЗИРАШ ИДЕЯТА СИ'));
 assert(!h.includes('Избери една от трите категории'));
 assert(!h.includes('Разширен каталог</a>'));
});
