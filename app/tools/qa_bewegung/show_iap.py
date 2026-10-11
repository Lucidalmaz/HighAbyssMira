import json,sys
d=json.load(open(sys.argv[1]))
for r in d:
    print(r['label'].ljust(28), r['typ'].ljust(9), (r.get('teil') or '-')[:30].ljust(30), str(r.get('ctl')).ljust(14), 'rot',r.get('rotMax'),'sch',r.get('shift'),'k',r.get('k'),'fix',r.get('fix'),'dmax',r.get('dmax'),'weg',r.get('weg'),'k2',r.get('k2'),r.get('open2'), (r.get('snd') or [])[:2], r.get('res') or '', r.get('err') or '')
print(sum(1 for r in d if r.get('rotMax') or r.get('shift')), 'bewegt von', len(d))
