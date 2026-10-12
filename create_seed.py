import json
from pathlib import Path
root=Path(__file__).resolve().parent
p=json.loads((root/'data/seed.json').read_text('utf-8'))
def quoted(x):
    if x is None:return 'NULL'
    if isinstance(x,bool):return 'true' if x else 'false'
    if isinstance(x,(int,float)):return str(x)
    return "'"+str(x).replace("'","''")+"'"
lines=['-- Initial catalogue import. Designed for the dedicated store Supabase project.', 'begin;']
for i,c in enumerate(p['categories'],1):
    cols=['id','name','description','icon','sort_order']
    vals=[c.get('id'),c.get('name'),c.get('description',''),c.get('icon',''),i]
    lines.append('insert into public.vinyl_categories ('+','.join(cols)+') values ('+','.join(map(quoted,vals))+') on conflict (id) do nothing;')
for x in p['products']:
    cols=['id','category','name','description','sale_price','unit','active','source','image','images','supplier_options','price_verification_needed']
    # No photo is inferred from a blocked Lovable link. The importer supplies real files later.
    def image(u):return u if u and not u.startswith('https://id-preview--') else '/assets/placeholder.svg'
    vals=[x['id'],x['category'],x['name'],x['description'],x['sale_price'],x['unit'],x['active'],x['source'],image(x.get('image')),
          json.dumps([image(u) for u in x.get('images',[]) if not u.startswith('https://id-preview--')],ensure_ascii=False),
          json.dumps(x.get('supplier_options',[]),ensure_ascii=False),x.get('price_verification_needed',True)]
    vals[9]=quoted(vals[9])+'::jsonb';vals[10]=quoted(vals[10])+'::jsonb'
    vals=[quoted(v) if i not in (9,10) else v for i,v in enumerate(vals)]
    lines.append('insert into public.vinyl_products ('+','.join(cols)+') values ('+','.join(vals)+') on conflict(id) do nothing;')
    lines.append('insert into public.vinyl_costs (product_id,supplier_price) values ('+str(x['id'])+','+quoted(x['supplier_price'])+') on conflict(product_id) do nothing;')
s=p['settings'];cols=['id','brand','company','phone','email','address','shipping','privacy'];vs=[1]+[s.get(c,'') for c in cols[1:]]
lines.append('insert into public.vinyl_settings ('+','.join(cols)+') values ('+','.join(map(quoted,vs))+') on conflict(id) do nothing;')
lines+=['commit;','']
(root/'supabase/seeds/002_catalog.sql').write_text('\n'.join(lines),encoding='utf-8')
public={k:v for k,v in p.items() if k!='orders'}
for x in public['products']:
    x.pop('supplier_price',None)
    x.pop('image_source',None)
    x['image']=x.get('image','') if not x.get('image','').startswith('https://id-preview--') else 'assets/placeholder.svg'
    x['images']=[u for u in x.get('images',[]) if not u.startswith('https://id-preview--')]
(root/'public/seed.js').write_text('window.SEED_DATA='+json.dumps(public,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Wrote SQL seed and public preview. Products:',len(p['products']))
