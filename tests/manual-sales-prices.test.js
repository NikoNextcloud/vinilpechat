'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const s=fs.readFileSync('public/site.js','utf8');
const api=fs.readFileSync('api/index.js','utf8');
const supplierSync=fs.readFileSync('scripts/sync_supplier_variants.cjs','utf8');
const migration=fs.readFileSync('supabase/migrations/009_disable_automatic_retail_markup.sql','utf8');

test('sales prices remain independently editable in the product and variant tables',()=>{
  assert.match(s,/data-field="sale_price"[^>]*value="\$\{p\.sale_price\?\?''\}"/);
  assert.match(s,/data-variant-price/);
  assert.match(s,/data-admin-save/);
  assert.match(s,/data-admin-save-variants/);
  assert.doesNotMatch(s,/Авто \+20 €|data-product-auto|data-variant-auto|data-product-pricing-status|data-variant-pricing-status/);
});
test('no automatic markup is applied while editing a supplier price',()=>{
  assert.doesNotMatch(s,/p\.supplier_price\+20/);
  assert.doesNotMatch(s,/p\.sale_price\s*=\s*p\.supplier_price/);
  assert.match(api,/sale_price:price\(p\.sale_price\)/);
  assert.match(api,/sale_price:price\(v\.sale_price\)/);
});
test('supplier import cannot overwrite existing sales prices with a fixed markup',()=>{
  assert.match(supplierSync,/const retail=old\?old\.sale_price:null/);
  assert.doesNotMatch(supplierSync,/price\+20|price\*1\.5/);
});
test('database migration disables automatic retail price triggers',()=>{
  for(const trigger of ['vinyl_retail_from_cost_on_products','vinyl_retail_when_supplier_cost_changed','vinyl_retail_from_cost_on_variants'])
    assert.ok(migration.includes('DROP TRIGGER IF EXISTS '+trigger),trigger);
});
