import re,sys,glob,json
sys.stdout.reconfigure(encoding='utf-8')
dec=json.JSONDecoder()
def reviews(f):
  t=open(f,encoding='utf-8',errors='ignore').read()
  out={}
  for m in re.finditer(r'\{"\$kind":"Review"',t):
    try:
      o,_=dec.raw_decode(t[m.start():])
      out[o['id']]=o
    except Exception as e: pass
  return out
ids={'6753734581':'LockScreenNotes','6756626124':'Chalkee','6770345898':'Yondo'}
allr={}
for i,n in ids.items():
  r={}
  for f in glob.glob(f'page*_{i}.html'): r.update(reviews(f))
  allr[n]=list(r.values())
  print('=====',n,len(r))
  for o in sorted(r.values(),key=lambda x:x.get('date','')):
    print(f"[{o.get('rating')}] {o.get('date','')[:10]} {o.get('title')} :: {o.get('contents','').replace(chr(10),' ')[:400]}")
json.dump(allr,open('reviews_all.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
