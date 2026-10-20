'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Hobby plan deploys exactly one Serverless Function for the store API',()=>{
 const root=path.join(__dirname,'..','api');
 function javascriptFiles(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
   const full=path.join(dir,e.name);
   return e.isDirectory()?javascriptFiles(full):e.isFile()&&e.name.endsWith('.js')?[path.relative(root,full).replaceAll('\\','/')]:[];
  });
 }
 assert.deepEqual(javascriptFiles(root),['index.js']);
 const vercel=JSON.parse(fs.readFileSync(path.join(__dirname,'..','vercel.json'),'utf8'));
 assert.ok(vercel.rewrites.some(x=>x.source==='/api/:path*'&&x.destination==='/api/index?route=:path*'));
});

test('All existing catalog, order and admin operations stay in the unified handler',()=>{
 const handler=fs.readFileSync(path.join(__dirname,'..','api','index.js'),'utf8');
 for(const route of ['health','catalog','orders','design/quote','admin/login','admin/logout',
 'admin/session','admin/data','admin/usage','admin/save','admin/variants','admin/order','admin/upload']){
  assert.ok(handler.includes("'"+route+"'"),'Missing route: '+route);
 }
 const middleware=handler.slice(handler.indexOf("if(route==='admin/data'"),handler.indexOf("if(['admin/save'"));
 assert.match(middleware,/admin\(req,db,auth,res\)/,'Private read APIs must still check admin session');
});
