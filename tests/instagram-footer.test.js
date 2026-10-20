'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/site.css'),'utf8');
const js=fs.readFileSync(path.join(root,'public/site.js'),'utf8');

test('Instagram and Facebook appear in one shared section between main content and footer',()=>{
 const main=page.indexOf('<main id="main"></main>');
 const social=page.indexOf('<section class="instagram-section"');
 const footer=page.indexOf('<footer class="footer">');
 assert.ok(main>=0&&main<social&&social<footer,'Feeds must be immediately above footer');
 assert.match(page,/id="instagram-posts"/);
 assert.match(page,/id="social-section-title"/);
 assert.match(page,/class="social-grid"/);
 assert.ok(page.indexOf('id="instagram-card-title"')<page.indexOf('id="facebook-card-title"'));
});
test('both social feeds use intended profiles and safe external fallback links',()=>{
 assert.ok(page.includes('src="https://www.instagram.com/vinilpechat/embed/"'));
 assert.ok(page.includes('href="https://www.instagram.com/vinilpechat/"'));
 assert.ok(page.includes('href="https://www.facebook.com/profile.php?id=61559753162459"'));
 assert.ok(page.includes('src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fprofile.php%3Fid%3D61559753162459'));
 assert.ok(page.includes('&amp;tabs=timeline'));
 assert.match(page,/title="Публикации от Instagram профила @vinilpechat"/);
 assert.match(page,/title="Публикации от Facebook страницата Vinilpechat"/);
 assert.equal((page.match(/loading="lazy"/g)||[]).length,2);
 assert.equal((page.match(/target="_blank" rel="noopener noreferrer"/g)||[]).length,2);
 assert.doesNotMatch(page,/<script[^>]*facebook\.com/i,'No unnecessary Facebook SDK');
});
test('social cards align in two columns, stack on mobile and stay outside protected admin',()=>{
 assert.match(css,/\.social-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:820px\)\{\.social-grid\{grid-template-columns:1fr/);
 assert.match(css,/\.social-card \.social-feed-frame\{[^}]*height:552px/);
 assert.match(css,/\.facebook-profile-embed\{[^}]*height:536px/);
 assert.match(js,/instagram\.hidden=route==='admin'/);
});
