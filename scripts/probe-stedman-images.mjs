const paths=['https://www.stedman.eu/en/classic-t','https://www.stedman.eu/en/t-shirts','https://ftp.stedman.eu/Classic-T-Unisex/en'];
for (const url of paths){
try {
 const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 (compatible; VinilpechatCatalogCheck/1.0)'}});
 const html=await response.text();
 console.log('PAGE',url,'STATUS',response.status,'LENGTH',html.length,'ENDURL',response.url);
 for(const keyword of ['og:image','ST2000','_WHI','model.jpg','<img','\.webp','\.jpg','image','srcset']){
  let pos=html.indexOf(keyword);
  console.log('MATCH',keyword,'POS',pos,'CONTEXT',pos<0?'':html.slice(Math.max(0,pos-220),pos+380).replace(/\n/g,' ').slice(0,570));
 }
 const images=[...html.matchAll(/(?:src|data-src|srcset|content)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)].slice(0,35).map(m=>m[1]);
 console.log('IMAGE_URLS',JSON.stringify(images));
} catch(e){console.log('FETCH_ERROR',url,e.message)}
}