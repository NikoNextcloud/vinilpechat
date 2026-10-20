'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/site.css'),'utf8');
const js=fs.readFileSync(path.join(root,'public/site.js'),'utf8');

test('Instagram publications embed is the last section before the storefront footer',()=>{
 const main=page.indexOf('<main id="main"></main>');
 const instagram=page.indexOf('<section class="instagram-section"');
 const footer=page.indexOf('<footer class="footer">');
 assert.ok(main>=0&&main<instagram&&instagram<footer,'Feed must be after main and before footer');
 assert.match(page,/id="instagram-posts"/);
 assert.match(page,/id="instagram-section-title"/);
 assert.match(page,/title="Публикации от Instagram профила @vinilpechat"/);
});
test('Instagram uses only the intended Vinilpechat profile and has a usable fallback link',()=>{
 assert.match(page,/src="https:\/\/www\.instagram\.com\/vinilpechat\/embed\/"/);
 assert.match(page,/loading="lazy"/);
 assert.match(page,/href="https:\/\/www\.instagram\.com\/vinilpechat\/"/);
 assert.match(page,/target="_blank" rel="noopener noreferrer"/);
 assert.doesNotMatch(page,/<script[^>]*instagram\.com/i,'Avoid loading unnecessary external scripts');
});
test('Instagram section is responsive and hidden for administrators',()=>{
 assert.match(css,/\.instagram-feed-frame/);
 assert.match(css,/\.instagram-profile-embed/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(js,/instagram\.hidden=route==='admin'/);
});
