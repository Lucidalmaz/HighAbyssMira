import json,sys
d=json.load(open(sys.argv[1]+'/steps.json',encoding='utf-8'))
txt=d[sys.argv[2]]
seen=set()
for l in txt.split('\n'):
    p=l.find('{')
    if p<0 or not l.rstrip().endswith('}'): print(l[:300]); continue
    try: o=json.loads(l[p:])
    except: print(l[:300]); continue
    key=(o['f'],o['s'])
    if key in seen: continue
    seen.add(key); print(o['t'],'k',o['k'],o['f'],o['s'],'@',o['x'],o['z'])
