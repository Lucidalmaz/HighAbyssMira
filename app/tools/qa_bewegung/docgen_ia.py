# -*- coding: utf-8 -*-
# Aggregiert die Interaktionsmessungen zu Typ-Tabellen (stdout, UTF-8)
import json, os, re, collections, sys
sys.stdout.reconfigure(encoding='utf-8')
O = r'C:\Users\GIGABYTE\_qa_bew\out'
def J(n):
    p = os.path.join(O, n)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None
CREA = re.compile(r'Lp_|Rp_|mixamo|Tail|Head_|pSphere|x_|Jaw|tail|body<root|Spine|L_Eye|Hand|hand|paw|femur|CROW|Leg_|Clavicle|earL|R4_|L1_|L3_|tarsus|Mesh<head|Mesh<PerspectiveCamera|neck|Hip', re.I)
def real(r):
    return [t for t in r.get('top', []) if not CREA.search(t[2]) and (t[0] >= .05 or t[1] >= 8)]
def grp(l, name=''):
    s = l.lower()
    if re.search(r'tür öffnen|tür schließen|^tür$', s) and 'auto' not in s: return 'Tür öffnen/schließen (Schwenktür, eigene Animation)'
    if re.search(r'gartentor', s): return 'Gartentor (eigene Animation)'
    if re.search(r'autotür (öffnen|schließen)', s): return 'Autotür Lukes/Lucys Wagen (eigene Animation)'
    if re.search(r'briefkasten (öffnen|schließen)|^briefkasten schließen', s): return 'Briefkasten (Klappe, eigene Animation)'
    if re.search(r'schrank (öffnen|schließen)|^den schrank', s): return 'Schrank (Tür, eigene Animation)'
    if re.search(r'kühlschrank (öffnen|schließen)', s): return 'Kühlschrank Nr. 4 (Modell mit Tür)'
    if re.search(r'schublade öffnen', s): return 'Schublade (eigene Animation)'
    if re.search(r'radio|fernseher|funkgerät|hörer|telefon|kassett|tonband|spieluhr|rekorder|nachtschalter|sicherungen|notentriegelung|hebel|kurbel', s): return 'Geräte/Schalter (Klick löst Ton, Text oder Rätsel aus)'
    return None
print('### A. Messung der Klickflächen mit mechanischem Typ (Kap. 1–6, je Fläche E ausgelöst, 1,2 s Simulation)\n')
agg = collections.OrderedDict()
seen = set()
for k in range(1, 7):
    d = J('iap_k%d.json' % k)
    if not d: continue
    for r in d:
        key = (r['label'], tuple(r['pos'][:1] + r['pos'][2:]))
        if key in seen: continue
        seen.add(key)
        t = r['typ']
        ctl = r.get('ctl') or 'kein Teil'
        if t == 'tuer':
            if ctl == 'kein Teil': g = 'Tür/Tor ohne trennbares Bauteil im Modell'
            elif (r.get('rotMax') or 0) >= 40: g = 'Durchgangstür: schwingt 80° auf, Wechsel folgt nach 0,3 s'
            else: g = 'Verschlossene Tür/Tor: Klinke rüttelt (Teil gefunden)'
        elif t == 'auto':
            if ctl.startswith('dreh'): g = 'Fahrzeug: Autotür rüttelt am Scharnier (Tür-Teil im Modell)'
            elif ctl.startswith('wippen'): g = 'Fahrzeug ohne Tür-Teil: Karosserie wippt auf der Federung'
            else: g = 'Fahrzeug ohne Hülle/Teil (Wrack-Suche)'
        elif t == 'deckel': g = 'Deckel/Kiste/Gully: kippt um die Hinterkante (74°), Schließen mit E' if ctl != 'kein Teil' else 'Deckel/Kiste ohne trennbares Bauteil'
        elif t == 'klappe': g = 'Klappe (Handschuhfach) ohne trennbares Bauteil'
        elif t == 'schublade': g = 'Schublade: gleitet 30 cm' if ctl != 'kein Teil' else 'Schublade ohne trennbares Bauteil'
        else: g = t
        a = agg.setdefault(g, {'n': 0, 'bsp': collections.Counter(), 'snd': 0, 'k': []})
        a['n'] += 1; a['bsp'][r['label'][:26]] += 1
        if r.get('snd'): a['snd'] += 1
print('| Verhalten nach Umbau | Anzahl Klickflächen | Beispiele | mit Ton |')
print('|---|---|---|---|')
for g, a in sorted(agg.items(), key=lambda x: -x[1]['n']):
    print('| %s | %d | %s | %d |' % (g, a['n'], ', '.join(n for n, _ in a['bsp'].most_common(4)), a['snd']))
print('\n### B. Eigene Animationen der Module (vorher schon vorhanden), aus der Vollmessung\n')
tab = collections.OrderedDict()
seen = set()
for k in range(1, 7):
    d = J('ia_k%d.json' % k)
    if not d: continue
    for r in d['rows']:
        if r['res'] != 'ok': continue
        g = grp(r['label'])
        if not g: continue
        key = (r['label'], r['pos'][0], r['pos'][2])
        if key in seen: continue
        seen.add(key)
        a = tab.setdefault(g, {'n': 0, 'bew': 0, 'snd': 0, 'l1': 0, 'bsp': collections.Counter(), 'rot': []})
        a['n'] += 1; a['bsp'][r['label'][:26]] += 1
        rl = real(r)
        if any(t[1] >= 20 or t[0] >= .2 for t in rl): a['bew'] += 1; a['rot'] += [t[1] for t in rl]
        if r.get('snd'): a['snd'] += 1
        if r.get('l1'): a['l1'] += 1
print('| Typ | Flächen | sichtbare Bewegung gemessen | Ton | Prompt wechselt | größte Drehung (Grad) |')
print('|---|---|---|---|---|---|')
for g, a in tab.items():
    print('| %s | %d | %d | %d | %d | %s |' % (g, a['n'], a['bew'], a['snd'], a['l1'], max(a['rot']) if a['rot'] else '-'))
d0 = J('ia0_k1.json')
if d0:
    ok = [r for r in d0['rows'] if r['res'] == 'ok']
    mv = [r for r in ok if any(t[1] >= 20 or t[0] >= .2 for t in real(r))]
    print('\nVorher (Kap. 1, Modul „interaktion“ abgeschaltet): %d mechanische Klickflächen ausgelöst, davon %d mit gemessener Bewegung eines Bauteils.' % (len(ok), len(mv)))
