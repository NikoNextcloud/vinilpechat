#!/usr/bin/env python3
"""Owner-authorized photo importer; only saves verified product imagery as WebP."""
import datetime
import hashlib
from html.parser import HTMLParser
import html
from io import BytesIO
import json
import os
from pathlib import Path
import re
import sys
import time
import unicodedata
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin,urlparse
from urllib.request import Request,urlopen
from PIL import Image,ImageOps

ROOT=Path(__file__).resolve().parents[1]
catalog_path=ROOT/'public/pechatni-produkti/catalog.json'
manifest=json.loads((ROOT/'scripts/billboard-photo-manifest.json').read_text('utf8'))
ORIGIN=manifest['origin']
allowed={'shop.billboard.bg','djuqbvg97u5zb.cloudfront.net'}
Image.MAX_IMAGE_PIXELS=25_000_000

class Page(HTMLParser):
 def __init__(self):
  super().__init__(convert_charrefs=True)
  self.links=[];self.active=[];self.images=[];self.meta=[];self.h1=[];self.in_h1=False
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a':self.active.append({'url':a.get('href',''),'parts':[]})
  elif tag=='meta':self.meta.append(a)
  elif tag=='img':self.images.append(a)
  elif tag=='h1':self.in_h1=True
 def handle_data(self,data):
  for a in self.active:a['parts'].append(data)
  if self.in_h1:self.h1.append(data)
 def handle_endtag(self,tag):
  if tag=='a' and self.active:
   a=self.active.pop();self.links.append((a['url'],' '.join(a['parts']).strip()))
  elif tag=='h1':self.in_h1=False

def norm(text):
 s=unicodedata.normalize('NFKD',str(text).lower().replace('×','x').replace('х','x'))
 return re.sub('[^a-zа-я0-9]','',s)

def get(url,ref=ORIGIN):
 p=urlparse(url)
 if p.scheme!='https' or p.hostname not in allowed:raise ValueError('Unexpected source host')
 req=Request(url,headers={
 'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/121.0.0.0 Safari/537.36',
 'Accept':'image/avif,image/webp,image/*,text/html,*/*;q=0.8',
 'Accept-Language':'bg-BG,bg;q=0.9,en;q=0.7',
 'Accept-Encoding':'identity','Referer':ref})
 for attempt in range(2):
  try:
   with urlopen(req,timeout=18) as r:
    if int(r.headers.get('Content-Length') or 0)>9000000:raise ValueError('Image too large')
    out=r.read(9000001)
    if not out or len(out)>9000000:raise ValueError('Bad response size')
    return out
  except (HTTPError,URLError,TimeoutError,OSError) as e:
   if attempt==1:raise
   time.sleep(.6)

def page(raw):
 p=Page();p.feed(raw.decode('utf8','replace'));return p

def source_page(item,links):
 override=manifest['manual'].get(item['id'])
 if override:return urljoin(ORIGIN,override),True
 names={norm(x) for x in [item['name']]+manifest['aliases'].get(item['id'],[])}
 for href,label in links:
  if norm(label) not in names:continue
  u=urljoin(ORIGIN,href);p=urlparse(u)
  if p.hostname!='shop.billboard.bg' or any(w in p.path for w in ('/products/','/categories/')):continue
  if p.path in ('','/'):continue
  return u,False
 return None,False

def asset_urls(p,raw,base):
 candidates=[]
 def add(s,score):
  if not s:return
  s=html.unescape(str(s).strip().replace('\\/','/')).split()[0]
  u=urljoin(base,s);q=urlparse(u);path=q.path.lower()
  if q.scheme!='https' or q.hostname not in allowed:return
  if '/billboard/images/' not in path or 'product' not in path:return
  if any(k in path for k in ('logo','icon','payment','placeholder','avatar','review')):return
  if not re.search(r'\.(jpg|jpeg|png|webp|avif)$',path):return
  if u not in [v for _,v in candidates]:candidates.append((score,u))
 for m in p.meta:
  if (m.get('property') or m.get('name','')).lower() in ('og:image','og:image:url','twitter:image'):
   add(m.get('content'),110)
 for i,im in enumerate(p.images):
  for key in ('data-zoom-image','data-original','data-large-image','data-src','src','data-lazy-src'):
   add(im.get(key),90-i/10)
  for key in ('data-srcset','srcset'):
   for entry in im.get(key,'').split(',')[:3]:add(entry.strip(),75-i/10)
 text=raw.decode('utf8','replace').replace('\\/','/')
 for u in re.findall(r'https?://djuqbvg97u5zb\.cloudfront\.net/billboard/images/[^"<>\\\s]+',text)[:70]:
  add(u,55)
 return [u for _,u in sorted(candidates,reverse=True)]

def optimize(raw):
 im=Image.open(BytesIO(raw))
 if getattr(im,'is_animated',False):im.seek(0)
 im.load();w,h=im.size
 if w<180 or h<160 or w*h>25000000:raise ValueError('Source not a full product photograph')
 im=ImageOps.exif_transpose(im)
 im.thumbnail((1280,960),Image.Resampling.LANCZOS)
 if im.mode in ('RGBA','LA') or 'transparency' in im.info:
  white=Image.new('RGBA',im.size,'white');white.alpha_composite(im.convert('RGBA'));im=white.convert('RGB')
 else:im=im.convert('RGB')
 out=BytesIO();im.save(out,'WEBP',quality=83,method=5)
 result=out.getvalue()
 if len(result)>1700000:
  out=BytesIO();im.save(out,'WEBP',quality=70,method=5);result=out.getvalue()
 if len(result)<2000 or len(result)>1700000:raise ValueError('Image failed size check')
 return result,im.size

def main():
 catalog=json.loads(catalog_path.read_text('utf8'))
 try:
  links=page(get(ORIGIN+'/')).links
  print('Found navigation links:',len(links),flush=True)
 except Exception as e:
  links=[];print('Homepage unavailable:',str(e)[:150],flush=True)
 folder=ROOT/'public/pechatni-produkti/photos';folder.mkdir(parents=True,exist_ok=True)
 results=[]
 history_path=ROOT/'docs/billboard-photo-import.json'
 previous={}
 if history_path.exists():
  history=json.loads(history_path.read_text('utf8'))
  previous={entry['id']:entry for entry in history.get('products',[])}
 for item in catalog['items']:
  ident=item['id']
  if item['image'].endswith('.webp') and (ROOT/'public'/item['image'].lstrip('/')).exists():
   old=previous.get(ident)
   if not old:raise ValueError('Missing provenance for previously imported image '+ident)
   results.append(old)
   print(ident,'already imported',flush=True)
   continue
  url,direct=source_page(item,links)
  entry={'id':ident,'name':item['name'],'page':url,'status':'fallback','original_image':None,'saved_image':item['image']}
  if not url:
   entry['reason']='No exact source product URL'
   print(ident,'fallback: no source page',flush=True);results.append(entry);continue
  try:
   raw=get(url);parsed=page(raw)
   if not direct and not any(norm(n) in norm(' '.join(parsed.h1)) for n in [item['name']]+manifest['aliases'].get(ident,[])):
    raise ValueError('Product title mismatch')
   sources=asset_urls(parsed,raw,url)
   if not sources:raise ValueError('No product-specific gallery images found')
   errors=[]
   for imageurl in sources[:12]:
    try:
     rawphoto=get(imageurl,url)
     data,size=optimize(rawphoto)
     name=ident.lower()+'.webp';target=folder/name;target.write_bytes(data)
     local='/pechatni-produkti/photos/'+name
     item['image']=local
     item['image_alt']='Снимка на '+item['name']+' – продуктово изображение'
     entry.update({'status':'downloaded','original_image':imageurl,'saved_image':local,'bytes':len(data),'dimensions':list(size),'sha256':hashlib.sha256(data).hexdigest()})
     break
    except (ValueError,HTTPError,URLError,TimeoutError,OSError) as e:errors.append(str(e)[:70])
   if entry['status']!='downloaded':raise ValueError('All image candidates failed: '+str(errors[:2]))
   print(ident,'downloaded',entry['bytes'],'bytes',flush=True)
  except Exception as e:
   entry['reason']=type(e).__name__+': '+str(e)[:180]
   print(ident,'fallback',entry['reason'],flush=True)
  results.append(entry)
 count=sum(v['status']=='downloaded' for v in results)
 report={'imported_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),
         'rights_basis':manifest['rights'],'total':len(results),
         'downloaded':count,'fallback':len(results)-count,'products':results}
 path=ROOT/'docs/billboard-photo-import.json'
 path.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n','utf8')
 if count:
  catalog_path.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n','utf8')
  featured=next((r for r in results if r['id']=='VP4-013' and r['status']=='downloaded'),None)
  if featured:
   p=ROOT/'public/pechatni-produkti/index.html'
   p.write_text(p.read_text('utf8').replace('/pechatni-produkti/images/vp4-013.svg',featured['saved_image']),'utf8')
 print('DOWNLOADED',count,'OF',len(results),'FALLBACK',len(results)-count,flush=True)
 if count<int(os.getenv('BILLBOARD_MIN_IMPORTED','5')):
  raise SystemExit('Cannot publish photos: too few product-source matches')

if __name__=='__main__':main()
