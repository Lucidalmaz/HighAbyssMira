# -*- coding: utf-8 -*-
# Erzeugt die Messtabellen für docs/gameplay/bewegung_audit.md aus _qa_bew/out/*.json (Ausgabe auf stdout, UTF-8)
import json, os, collections, sys
sys.stdout.reconfigure(encoding='utf-8')
O = r'C:\Users\GIGABYTE\_qa_bew\out'
def J(n):
    p = os.path.join(O, n)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None

NAMEN = {'car_neu/sedan.glb': 'Limousine (car_neu/sedan)', 'car_neu/hatch.glb': 'Kleinwagen (car_neu/hatch)', 'van_neu/model.glb': 'Transporter (van_neu)',
         'car_rusty/model.glb': 'Wrack, überwachsen (car_rusty)', 'car_burned/model.fbx': 'Wrack, ausgebrannt (car_burned)', 'vans/model.fbx': 'Transporter/Bus (vans, gestreckt)',
         'tractor/model.glb': 'Traktor'}
print('### Fahrzeuge: Sprung-/Mantle-Test (8 Richtungen, 4 davon zusätzlich im Sprint; Anlauf 3,2 m, Absprung 1,1 m vor der Kante)\n')
print('| Kap. | Nr. | Fahrzeug | Höhe m | oben | unten (abgeglitten/drüber) | Anlauf blockiert | steckt | gefangen | Note |')
print('|---|---|---|---|---|---|---|---|---|---|')
seen = set()
for k in range(1, 7):
    d = J('veh_k%d.json' % k)
    if not d: continue
    for r in d['out']:
        b = r['b']
        if b['top'] < -1e8 or b['base'] > 1e8: continue
        key = (r['key'], round(b['minX'], 1), round(b['minZ'], 1))
        if key in seen: continue
        seen.add(key)
        c = collections.Counter(x['cls'] for x in r['runs'])
        bad = c.get('STECKT', 0) + c.get('IM_OBJEKT', 0) + c.get('GEFANGEN', 0)
        note = 1 if bad == 0 and c.get('oben', 0) >= 1 else (2 if bad == 0 else 4)
        print('| %d | %d | %s | %.2f | %d | %d | %d | %d | %d | %d |' % (k, r['id'], NAMEN.get(r['key'], r['key']), b['top'] - b['base'], c.get('oben', 0), c.get('unten', 0), c.get('n/a', 0), c.get('STECKT', 0) + c.get('streift', 0) * 0, c.get('GEFANGEN', 0) + c.get('IM_OBJEKT', 0), note))
print('\n### Requisiten/Kollisionskörper: Sprung-Test (4 Richtungen, gleichmäßige Stichprobe je Kapitel)\n')
print('| Kap. | getestet (Objekte) | Läufe | oben | unten (drüber/abgeglitten) | Anlauf blockiert (Wand/Nachbar) | innen frei (unter/neben Teilen, beweglich) | streift | steckt | gefangen |')
print('|---|---|---|---|---|---|---|---|---|---|')
for k in range(1, 7):
    d = J('obj_k%d.json' % k)
    if not d: continue
    c = collections.Counter()
    for r in d['res']:
        for run in r['runs']: c[run[0]] += 1
    print('| %d | %d | %d | %d | %d | %d | %d | %d | %d | %d |' % (k, len(d['res']), sum(c.values()), c['oben'], c['unten'], c['n/a'], c['innen_frei'], c['streift'], c['STECKT'], c['GEFANGEN'] + c['IM_OBJEKT']))
print('\n### Hohlraum-Füller (Volumen geschlossener kleiner Netze)\n')
print('| Kap. | geprüfte Netze (≤ 40 m um den Test) | Netze mit gefüllten Volumen | Kollisionskisten | Fehler |')
print('|---|---|---|---|---|')
for k in range(1, 7):
    d = J('hohl_k%d.json' % k)
    if d: print('| %d | %d | %d | %d | %d |' % (k, d['geprueft'], d['recs'], d['n'], d['err']))
s = J('synth.json')
if s:
    print('\n### Hochziehen: Kiste 1,6 × 1,6 m, Anlauf 3,2 m aus 4 Richtungen\n')
    print('| Höhe m | oben (4 Richtungen) | Hochziehen genutzt |')
    print('|---|---|---|')
    for r in s['thick']:
        res = r['res']; print('| %.1f | %d/4 | %s |' % (r['h'], sum(1 for x in res if x[0] == 'oben'), 'ja' if any(x[2] for x in res) else 'nein (Sprung/Stufe)'))
    print('\nDünne Mauer (20 cm): ' + ', '.join('%.1f m: %s' % (r['h'], 'oben' if r['res'][0][0] == 'oben' else ('über Kante gestiegen' if r['res'][0][2] else 'unten')) for r in s['thin']))
    if s.get('kante'):
        print('\n### Kante: Körpermitte x cm außerhalb der Kante einer 1,0 m hohen Kiste (Stand nach 1 s)\n')
        print('| Abstand Mitte → Kante | Höhe nach 1 s | Ergebnis |')
        print('|---|---|---|')
        for off, y, x in s['kante']: print('| %d cm | %.2f m | %s |' % (round(off * 100), y, 'steht' if y > .9 else 'rutscht ab'))
c = J('crawl.json')
if c:
    print('\n### Kriechen: Wand 4 m breit, Loch 1,0 m breit, Hocke gehalten (Strg), Kollisionskiste und Netz\n')
    print('| Lochhöhe | Kiste | Netz | Kriechzustand | tiefste Augenhöhe |')
    print('|---|---|---|---|---|')
    by = collections.defaultdict(dict)
    for r in c['rows']: by[r['hh']][r['mode']] = r
    for hh in sorted(by):
        a, m = by[hh].get('col'), by[hh].get('mesh')
        print('| %.2f m | %s | %s | %s | %.2f m |' % (hh, 'durch' if a and a['durch'] else 'gesperrt', 'durch' if m and m['durch'] else 'gesperrt', 'Kriechen' if (a and a['maxCrawl'] > .5) else 'Hocke', (a or m)['minEye']))
for n in ('falle_k1', 'falle_k1b'):
    f = J(n + '.json')
    if f:
        print('\n### Falle (Flutfüllung): %s, Raster %.1f m, Bereich x %.0f…%.0f, z %.0f…%.0f\n' % (n, f['cs'], f['box'][0], f['box'][1], f['box'][2], f['box'][3]))
        print('Freie Zellen: %d, Hauptfläche %.0f m², nicht verbundene Komponenten: %d\n' % (f['frei'], f['haupt'], f['komponenten']))
        print('| Fläche m² | Lage x…x / z…z | Innenraum/Haus | nahe Fahrzeug | Bemerkung |')
        print('|---|---|---|---|---|')
        for o in f['out'][:30]:
            print('| %.1f | %.1f…%.1f / %.1f…%.1f | %s | %s | |' % (o['area'], o['bb'][0], o['bb'][1], o['bb'][2], o['bb'][3], 'ja' if o['inRect'] else 'nein', 'ja' if o['nearV'] else 'nein'))
