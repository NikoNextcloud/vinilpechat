'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const s=fs.readFileSync('public/site.js','utf8');
const api=fs.readFileSync('api/index.js','utf8');
const migrations=fs.readFileSync('supabase/migrations/008_manual_sale_price_overrides.sql','utf8');
test('product selling price is editable, with a reset button',()=>{
 assert.match(s,/data-field="sale_price"[^>]*value="\$\{p\.sale_price\?\?''\}"/);
 assert.match(s,/data-product-auto/);
 assert.match(s,/p\.manual_sale_price=true/);
 assert.match(s,/p\.manual_sale_price=false/);
});
test('variant selling prices preserve manual overrides',()=>{
 assert.match(s,/data-variant-price/);
 assert.match(s,/data-variant-auto/);
 assert.match(s,/v\.manual_sale_price=true/);
 assert.match(s,/v\.manual_sale_price=false/);
 assert.match(s,/manual_sale_price:!!v\.manual_sale_price/);
 assert.match(api,/manual_sale_price:v\.manual_sale_price===true/);
});
test('database provides override flags and automatic price fallback',()=>{
 assert.match(migrations,/ADD COLUMN IF NOT EXISTS manual_sale_price boolean NOT NULL DEFAULT false/g);
 assert.match(migrations,/IF NOT NEW\.manual_sale_price THEN/g);
 assert.match(migrations,/NOT p\.manual_sale_price/);
 assert.match(api,/manual_sale_price:p\.manual_sale_price===true/);
});
