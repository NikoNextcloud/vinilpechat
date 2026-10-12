#!/usr/bin/env python3
"""Download supplier product photos and selected product choices into a local catalog.

Requires a network connection, permissions to use the third-party media, and Python 3.10+.
Run from anywhere: python scripts/download_supplier_media.py

Photographs are downloaded *only* when the supplier page returns a matching product-gallery
link. An unsuccessful fetch never results in a synthetic substitute. The current product
base price is not assumed to be the price of an option.
"""
from __future__ import annotations
import argparse
import html
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'seed.json'
SEED_JS = ROOT / 'public' / 'seed.js'
DEST = ROOT / 'public' / 'products'
AGENT = 'Mozilla/5.0 (compatible; catalog-import/1.0)'

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.gallery_images=[]
        self.choices=[]
        self.depth=0
        self.gallery_depth=None
        self.in_option=False
        self.option_labels={}
        self.in_label=False
        self.label_for=None
        self.label_text=[]
        self.current_select=None
        self.current_choice=None
        self.current_text=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs)
        if tag in ('ul','div'):
            self.depth+=1
            if 'thumbnails' in (a.get('class') or '').split() and self.gallery_depth is None:
                self.gallery_depth=self.depth
        if tag=='a' and ('thumbnail' in (a.get('class') or '').split() or self.gallery_depth is not None):
            href=a.get('href','')
            if re.search(r'(?:^|/)image/', href, re.I) and not re.search(r'(?:logo|icon|banner)',href,re.I):
                if href not in self.gallery_images: self.gallery_images.append(href)
        if tag=='label' and re.search(r'input-option\d+', a.get('for','')):
            self.in_label=True; self.label_for=a.get('for'); self.label_text=[]
        if tag=='select' and re.search(r'option\[\d+\]', a.get('name','')):
            self.current_select={'id':a.get('name'),'label': self.option_labels.get(a.get('id',''),a.get('name')),'values':[]}
        if tag=='option' and self.current_select is not None:
            self.in_option=True
            self.current_choice={'id':a.get('value',''),'text':''}
            self.current_text=[]
    def handle_endtag(self, tag):
        if tag in ('ul','div'):
            if self.gallery_depth==self.depth: self.gallery_depth=None
            self.depth=max(0,self.depth-1)
        if tag=='label' and self.in_label:
            self.option_labels[self.label_for]=' '.join(''.join(self.label_text).split())
            self.in_label=False
        if tag=='option' and self.in_option and self.current_select is not None:
            self.current_choice['text']=' '.join(''.join(self.current_text).split())
            if self.current_choice['id'] and self.current_choice['text']:
                self.current_select['values'].append(self.current_choice)
            self.in_option=False
        if tag=='select' and self.current_select is not None:
            if self.current_select['values']: self.choices.append(self.current_select)
            self.current_select=None
    def handle_data(self, data):
        if self.in_option: self.current_text.append(data)
        if self.in_label: self.label_text.append(data)


def fetch(url, timeout=25):
    req=urllib.request.Request(url,headers={'User-Agent':AGENT,'Accept':'text/html,image/avif,image/webp,image/*,*/*;q=0.8'})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return r.read(),r.headers.get('Content-Type','')


def picture_type(data):
    if data.startswith(b'\xff\xd8\xff'): return '.jpg'
    if data.startswith(b'\x89PNG\r\n\x1a\n'): return '.png'
    if data.startswith(b'RIFF') and data[8:12]==b'WEBP': return '.webp'
    return None


def main():
    arg=argparse.ArgumentParser()
    arg.add_argument('--limit',type=int,default=0,help='Only first N products, for a smoke test')
    arg.add_argument('--delay',type=float,default=1.0,help='Pause between requests (seconds)')
    opts=arg.parse_args()
    db=json.loads(DATA.read_text(encoding='utf-8'))
    DEST.mkdir(exist_ok=True,parents=True)
    summary=[]
    for p in db['products'][:opts.limit or len(db['products'])]:
        product_id=p['id']; source=p.get('source','')
        if not source.startswith('https://www.vipborsa.com/index.php?') and not source.startswith('https://vipborsa.com/index.php?'):
            print(f'{product_id:02d}: invalid supplier page; skipped');continue
        try:
            body,_=fetch(source)
            page=PageParser();page.feed(body.decode('utf-8','replace'))
        except Exception as ex:
            print(f'{product_id:02d}: could not open product page: {ex}');summary.append({'id':product_id,'status':'page_failed','count':0});continue
        collected=[]
        for i,href in enumerate(page.gallery_images[:8],start=1):
            url=urllib.parse.urljoin(source,html.unescape(href)).replace(' ','%20')
            if urllib.parse.urlparse(url).hostname not in ('vipborsa.com','www.vipborsa.com'):
                continue
            try:
                raw,mime=fetch(url)
                ext=picture_type(raw)
                if not ext or len(raw)>12*1024*1024 or len(raw)<1000:
                    print(f'{product_id:02d}: image {i} had invalid bytes');continue
                name=f'p{product_id:02d}-{i}{ext}'
                (DEST/name).write_bytes(raw)
                collected.append('products/'+name)
            except Exception as ex:
                print(f'{product_id:02d}: could not download gallery image {i}: {ex}')
            time.sleep(max(0,opts.delay/2))
        if collected:
            p['image']=collected[0]
            p['images']=collected[1:]
            p['photo_note']='Локални снимки от публичната продуктова страница на доставчика; потвърдете правата за употреба.'
        else:
            p['image']='assets/placeholder.svg'
            p['images']=[]
            p['photo_note']='Оригиналните продуктови снимки не успяха да се свалят; необходима е ръчна проверка.'
        p['supplier_options']=page.choices
        summary.append({'id':product_id,'status':'ok' if collected else 'no_gallery_images','count':len(collected),'options_found':len(page.choices)})
        print(f'{product_id:02d}: {len(collected)} pictures; {len(page.choices)} option groups')
        time.sleep(max(0,opts.delay))
    DATA.write_text(json.dumps(db,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # If the Node server has previously been started, merge media and options only, preserving orders and admin-edited prices.
    store=ROOT/'data'/'store.json'
    if store.exists():
        current=json.loads(store.read_text(encoding='utf-8'))
        index={int(x['id']):x for x in db['products']}
        for item in current.get('products',[]):
            fresh=index.get(int(item.get('id',0)))
            if fresh and fresh.get('image','').startswith(('products/','assets/')):
                item['image']=fresh['image'];item['images']=fresh.get('images',[])
                item['supplier_options']=fresh.get('supplier_options',[])
                item['photo_note']=fresh.get('photo_note','')
        store.write_text(json.dumps(current,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # Public JavaScript must never expose supplier cost prices.
    public_db = json.loads(json.dumps(db,ensure_ascii=False))
    for product in public_db['products']:
        product.pop('supplier_price',None)
        product.pop('image_source',None)
    SEED_JS.write_text("window.SEED_DATA="+json.dumps(public_db,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
    (ROOT/'data'/'image_import_status.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Completed. Downloaded:',sum(x['count'] for x in summary),'photos; updated',len(summary),'products.')
    print('Option groups have been recorded in supplier_options for manual verification. Prices for variants are NOT inferred.')
    print('Before publishing, secure the rights to use supplier images and verify variant pricing.')

if __name__=='__main__':main()
