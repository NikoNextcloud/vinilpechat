'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

test('Vercel exposes the protected admin database usage endpoint',()=>{
  const route=fs.readFileSync(path.join(root,'api/admin/usage.js'),'utf8');
  const handler=fs.readFileSync(path.join(root,'api/index.js'),'utf8');
  const frontend=fs.readFileSync(path.join(root,'public/site.js'),'utf8');
  assert.match(route,/module\.exports\s*=\s*require\(['"]\.\.\/index\.js['"]\)/);
  assert.ok(handler.includes("route==='admin/usage'"),'The API must implement /api/admin/usage');
  assert.ok(handler.includes("db.rpc('vinyl_store_usage')"),'Usage must come from the real Supabase function');
  assert.ok(frontend.includes("request('/api/admin/usage')"),'Admin UI and route must agree');
  assert.match(handler,/if\(!await admin\(req,db,auth,res\)\)return;/,'Endpoint must enforce admin authentication');
});
