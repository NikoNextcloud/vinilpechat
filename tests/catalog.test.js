const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(base, 'data/seed.json'), 'utf8'));
const publicSeed=fs.readFileSync(path.join(base,'public/seed.js'),'utf8');
test('Original catalogue has 40 unique products and eight categories',()=>{
  assert.equal(data.products.length,40);
  assert.equal(new Set(data.products.map(p=>p.id)).size,40);
  assert.equal(data.categories.length,8);
  assert.ok(data.products.every(p=>data.categories.some(c=>c.id===p.category)));
});
test('Browser demo hides sensitive supplier prices and missing Lovable photos',()=>{
  assert.ok(!publicSeed.includes('supplier_price'));
  assert.ok(!publicSeed.includes('id-preview--'));
});
test('SQL seed contains 40 products and 40 supplier-cost rows',()=>{
  const sql=fs.readFileSync(path.join(base,'supabase/seeds/002_catalog.sql'),'utf8');
  assert.equal((sql.match(/insert into public\.vinyl_products/g)||[]).length,40);
  assert.equal((sql.match(/insert into public\.vinyl_costs/g)||[]).length,40);
});
