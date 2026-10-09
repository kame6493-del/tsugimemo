import re, glob, sys, json, datetime
sys.stdout.reconfigure(encoding='utf-8')
dec = json.JSONDecoder()
for f in glob.glob('yrt_*.html'):
    t = open(f, encoding='utf-8', errors='ignore').read()
    out = []
    for m in re.finditer(r'"displayText":', t):
        try:
            s, _ = dec.raw_decode(t[m.end():])
        except Exception:
            continue
        seg = t[m.end():m.end() + 4000]
        d = re.search(r'"createdAt":(\d+)', seg)
        out.append((datetime.datetime.fromtimestamp(int(d.group(1))).date() if d else '?', s))
    print('=====', f, len(out))
    for d, s in out[:15]:
        print(d, s.replace('\n', ' ')[:220])
