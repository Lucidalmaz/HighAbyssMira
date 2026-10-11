import json,sys,collections
d=json.load(open(sys.argv[1]))
print('sek',d['sek'],d['log'])
for r in d['out']:
    c=collections.Counter(x['cls'] for x in r['runs'])
    b=r['b']
    print(r['id'],r['key'],'h=%.2f'%(b['top']-b['base']),dict(c))
    for x in r['runs']:
        if x['cls'] in('STECKT','IM_OBJEKT','GEFANGEN','n/a'): print('   ',x['di'],x['sprint'],x['cls'],x.get('end'),x.get('ov'),x.get('mv'),x.get('why'))
