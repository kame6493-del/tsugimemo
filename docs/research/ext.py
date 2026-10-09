import re,sys,glob,json
sys.stdout.reconfigure(encoding='utf-8')
for f in sorted(glob.glob('page*.html')):
  t=open(f,encoding='utf-8',errors='ignore').read()
  i=t.find('"contents"')
  print('=====',f, i)
  if i>0: print(t[i-800:i+300])
