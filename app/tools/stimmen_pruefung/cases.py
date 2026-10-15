"""Erzeugt cases.json: je Figur x Quellmodul eine Zeile (Dauer nahe 3,5 s) aus Manifest + zeilen_meta.json.
   python cases.py <manifest.json> <zeilen_meta.json> > cases.json   (danach: node mk_vt.js <name> <kapitel> a|b|c|figur|all, Lauf mit _live.sh run)"""
import json, sys, collections
man = json.load(open(sys.argv[1], encoding='utf-8')); meta = json.load(open(sys.argv[2], encoding='utf-8')); z = man['z']
by = collections.defaultdict(list)
for r in meta:
    if r['id'] in z and not r.get('schicht'):
        d = z[r['id']][1]; by[(r['sprecher'], r['mod'])].append((abs(d - 3.5), r['id'], r['who'], r['text'], d))
print(json.dumps([dict(zip(('f', 'mod', 'id', 'who', 'text', 'dur', 'art'), (f, m, v[0][1], v[0][2], v[0][3], v[0][4], z[v[0][1]][3]))) for (f, m), v in sorted(by.items()) for v in [sorted(v)]], ensure_ascii=False))
