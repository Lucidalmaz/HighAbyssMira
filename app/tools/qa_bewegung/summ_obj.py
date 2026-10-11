import json,sys,collections
d=json.load(open(sys.argv[1]))
print(d['n'],d['i'])
c=collections.Counter(); bad=[]
for r in d['res']:
    for k,run in enumerate(r['runs']):
        c[run[0]]+=1
        if run[0] in ('STECKT','IM_OBJEKT','GEFANGEN'): bad.append((run[0],k,r['src'],r.get('n'),r['b'],run[1],run[4]))
print(dict(c))
for b in bad[:int(sys.argv[2]) if len(sys.argv)>2 else 40]: print(b)
# Objekt-Ebene: hoehe vs. oben
hh=collections.defaultdict(lambda:[0,0])
for r in d['res']:
    h=round((r['b'][5]-r['b'][4])*2)/2
    for run in r['runs']:
        if run[0] in('oben','unten'): hh[h][0 if run[0]=='oben' else 1]+=1
for h in sorted(hh): print('Hoehe',h,'oben',hh[h][0],'unten',hh[h][1])
