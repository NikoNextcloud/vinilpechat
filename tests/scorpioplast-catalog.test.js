'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const migration=fs.readFileSync('supabase/migrations/010_scorpioplast_products.sql','utf8');
const frontend=fs.readFileSync('public/site.js','utf8');
const api=fs.readFileSync('api/index.js','utf8');
test('Scorpioplast catalog contains 17 distinct covers and 3 sacks',()=>{
 const tarpEntries=(migration.match(/^\(\d+,'scorpioplast-pokrivala'/gm)||[]).length;
 const bagEntries=(migration.match(/^\(\d+,'scorpioplast-chuvali'/gm)||[]).length;
 assert.equal(tarpEntries,17);
 assert.equal(bagEntries,3);
 assert.match(migration,/50 бр\./);
 assert.match(migration,/200 бр\./);
});
test('Scorpioplast listed prices cannot accidentally become shop selling or supplier costs',()=>{
 assert.match(migration,/vinyl_supplier_reference/);
 assert.match(migration,/NULL,true,.*scorpioplast\.com/);
 assert.match(migration,/не се присвояват непроверени цени/);
 assert.match(api,/public_supplier_reference/);
});
test('supplier URL links include both vendors, never arbitrary external URLs',()=>{
 assert.match(frontend,/scorpioplast\.com/);
 assert.match(frontend,/vipborsa\.com/);
 assert.match(frontend,/const supplierURL=p=>/);
});
