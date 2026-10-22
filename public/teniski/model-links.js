'use strict';
/* Public Stedman product permalinks; shared by Node and browser. */
(function(){
 const publicLabel=model=>{
  if(model.id==='ST2300')return 'Мъжка тениска';
  return String(model.bg||model.name||model.id)
   .replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim().slice(0,84)||model.id;
 };
 const modelPath=model=>'/teniski/'+encodeURIComponent(publicLabel(model))+'-model-'+model.id;
 const matchPath=(pathname,catalog)=>{
  const match=String(pathname||'').match(/^\/teniski\/([^/]+)\/?$/);
  if(!match)return null;
  let part;
  try{part=decodeURIComponent(match[1]);}catch{return null;}
  const code=part.match(/^(.+)-model-(ST[0-9]{4})$/i);
  if(!code)return null;
  const model=catalog.find(m=>m.id===code[2].toUpperCase());
  return model||null;
 };
 const api={modelPath,matchPath};
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(typeof window!=='undefined')window.StedmanLinks=api;
})();