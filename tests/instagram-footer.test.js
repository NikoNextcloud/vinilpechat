'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const page=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public/site.css'),'utf8');
const js=fs.readFileSync(path.join(root,'public/site.js'),'utf8');
const api=fs.readFileSync(path.join(root,'api/index.js'),'utf8');
const widget='elfsight-app-33b7879c-8beb-48e0-8d94-6d48b5b5c481';

test('Facebook and Instagram are aligned in the last section before the footer',()=>{
 const main=page.indexOf('<main id="main"></main>');
 const social=page.indexOf('<section class="instagram-section"');
 const footer=page.indexOf('<footer class="footer">');
 assert.ok(main>=0&&main<social&&social<footer,'Feeds must be after main and before footer');
 assert.ok(page.includes('class="social-grid"'));
 assert.ok(page.indexOf('id="instagram-card-title"')<page.indexOf('id="facebook-card-title"'));
 assert.ok(page.includes('id="instagram-posts"'));
 assert.ok(page.includes('id="social-section-title"'));
 assert.match(css,/\.social-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:820px\)\{\.social-grid\{grid-template-columns:1fr/);
});
test('the owner-provided Elfsight widget is embedded exactly once in Facebook panel',()=>{
 assert.equal(page.split(widget).length-1,1);
 assert.ok(page.includes('class="'+widget+' facebook-elfsight-widget" data-elfsight-app-lazy'));
 assert.equal(page.split('src="https://elfsightcdn.com/platform.js"').length-1,1);
 assert.ok(page.includes('src="https://www.instagram.com/vinilpechat/embed/"'));
 assert.ok(page.includes('href="https://www.instagram.com/vinilpechat/"'));
 assert.ok(page.includes('href="https://www.facebook.com/profile.php?id=61559753162459"'));
 assert.ok(page.includes('facebook-elfsight-frame'));
 assert.ok(page.includes('Ако публикациите не се заредят'));
 assert.ok(page.includes('<noscript>'));
 assert.ok(page.includes('rel="noopener noreferrer"'));
});
test('social feeds remain height-aligned, with scrolling on small screens',()=>{
 assert.match(css,/\.social-card \.social-feed-frame\{[^}]*height:552px/);
 assert.match(css,/\.social-card \.social-feed-frame\.facebook-elfsight-frame\{[^}]*height:552px/);
 assert.match(css,/facebook-elfsight-frame\{[^}]*overflow:auto/);
 assert.match(css,/facebook-elfsight-widget\{[^}]*min-height:515px/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.ok(js.includes("instagram.hidden=route==='admin'"));
});
test('unused token-based Graph feed is removed and storefront retains other features',()=>{
 assert.ok(!js.includes('loadFacebookPosts'));
 assert.ok(!js.includes("fetch('/api/social/facebook'"));
 assert.ok(!api.includes("require('../lib/facebook-feed.js')"));
 assert.ok(!api.includes("route==='social/facebook'"));
 assert.ok(!fs.existsSync(path.join(root,'lib/facebook-feed.js')));
 assert.ok(!fs.existsSync(path.join(root,'tests/facebook-graph-feed.test.js')));
});
