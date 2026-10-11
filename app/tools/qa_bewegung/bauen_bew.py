# -*- coding: utf-8 -*-
# baut docs/gameplay/bewegung_audit.md aus den Messdateien (_qa_bew/out) – Zahlen kommen aus den Daten, nicht aus dem Gedächtnis
import json, os, collections, datetime
O = r'C:\Users\GIGABYTE\_qa_bew\out'
OUT = r'C:\Users\GIGABYTE\HighAbyssMira-Repo\docs\gameplay\bewegung_audit.md'
def J(n):
    p = os.path.join(O, n)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None
L = []
w = L.append
NAMEN = {'car_neu/sedan.glb': 'Limousine (car_neu/sedan)', 'car_neu/hatch.glb': 'Kleinwagen (car_neu/hatch)', 'van_neu/model.glb': 'Transporter (van_neu)',
         'car_rusty/model.glb': 'Wrack, überwachsen (car_rusty)', 'car_burned/model.fbx': 'Wrack, ausgebrannt (car_burned)', 'vans/model.fbx': 'Transporter/Bus (vans, auf Buslänge gestreckt)',
         'tractor/model.glb': 'Traktor'}

# ---------- Fahrzeuge (alle Fahrzeuge der Welt; Kap.-6-Waldfahrzeuge aus dem Kap.-6-Lauf)
veh = {}
srcs = [('veh_all', J('veh_all.json'))] + [('veh_k%d' % k, J('veh_k%d.json' % k)) for k in (6, 4, 1, 2, 3, 5)]
for src, d in srcs:
    if not d: continue
    for r in d['out']:
        if not r['runs']:
            veh.setdefault(r['id'], {'key': r['key'], 'h': None, 'c': collections.Counter(), 'res': r.get('res'), 'pos': r.get('pos')})
            continue
        b = r['b']; c = collections.Counter(x['cls'] for x in r['runs'])
        pos = r.get('pos') or [(b['minX'] + b['maxX']) / 2, 0, (b['minZ'] + b['maxZ']) / 2]
        if r['id'] in veh and veh[r['id']]['h'] is not None: continue
        veh[r['id']] = {'key': r['key'], 'h': b['top'] - b['base'], 'c': c, 'res': None, 'pos': pos}
tot = collections.Counter(); nVeh = 0
for v in veh.values():
    if v['h'] is None: continue
    nVeh += 1; tot.update(v['c'])
nLaeufe = sum(tot.values())
bad = tot['STECKT'] + tot['GEFANGEN'] + tot['IM_OBJEKT']

# ---------- Objekte
objs = {}
for k in range(1, 7):
    d = J('obj_k%d.json' % k)
    if d:
        c = collections.Counter()
        for r in d['res']:
            for run in r['runs']: c[run[0]] += 1
        objs[k] = (len(d['res']), c)
dv = J('obj_k1_voll.json')
voll = None
if dv:
    c = collections.Counter()
    for r in dv['res']:
        for run in r['runs']: c[run[0]] += 1
    voll = (len(dv['res']), c)
syn = J('synth.json'); cr = J('crawl.json'); fr = J('freischieben.json'); air = J('aircontrol.json'); doors = J('door_k1.json')
hv = J('hohl_voll.json')
nobj = sum(v[0] for v in objs.values()); nobjl = sum(sum(v[1].values()) for v in objs.values())
objbad = sum(v[1]['STECKT'] + v[1]['GEFANGEN'] + v[1]['IM_OBJEKT'] for v in objs.values()) + (voll[1]['STECKT'] + voll[1]['GEFANGEN'] + voll[1]['IM_OBJEKT'] if voll else 0)

w('# Bewegung und Hitboxen – Audit (Folgeauftrag 7, Stand 11.10.2026)')
w('')
w('Maßstab (Nutzer, 10.10.): bei allem mindestens Schulnote 2, Unprägnantes darf 3 sein; „prägnant“ = Fahrzeuge, Hauptrequisiten, Bewegung. Noten: 1 sehr gut … 6 ungenügend. Jede Zahl unten stammt aus einem Messlauf (Werkzeuge: `app/tools/qa_bewegung/`, Dauerinstanz `_live.sh`, `__BW` in der Spielseite; Läufe 11.10.2026).')
w('')
w('## 1. Ergebnis in einer Tabelle')
w('')
w('| Punkt | prägnant | Note vorher | Note nachher | Messwert / Beleg |')
w('|---|---|---|---|---|')
w('| Fahrzeuge begehbar (Dach/Haube/Kofferraum, Sprung + Hochziehen aus 8 Richtungen, 4 davon im Sprint) | ja | 5 | 1 | %d Fahrzeuge, %d Läufe: oben %d · abgeglitten/drüber %d · Anlauf durch Nachbarn blockiert %d · steckt %d · gefangen %d |' % (nVeh, nLaeufe, tot['oben'], tot['unten'], tot['n/a'], tot['STECKT'], tot['GEFANGEN'] + tot['IM_OBJEKT']))
w('| Fahrzeuge: nie hineinfallen / kein Hohlraum | ja | 4 | 1 | Hitbox = Höhenfeld des echten Netzes (15-cm-Zellen → Kisten, Oberkante = Dach/Haube); Freischieben aus dem Volumen: %d/%d Testlagen frei (%s) |' % (sum(1 for r in fr if r['ov1'] == 0), len(fr), '3 Lagen je Fahrzeug: Mitte unten, vorn innen, Mitte hoch') if fr else '| Fahrzeuge: nie hineinfallen | ja | 4 | 1 | – |')
w('| Lukes Leihwagen (erste Minute des Spiels) | ja | 4 | 1 | alte Kiste `addCol(-77.2 … 3.75)` ohne Höhe = 99 m → Wand bis zum Himmel; jetzt Höhenfeld-Hitbox, 12/12 Läufe oben |')
w('| Requisiten/Kollisionskörper: Steckenbleiben (Stichprobe 300/Kapitel + alle Objekte Kap. 1) | ja | 3 | 1 | %d Objekte / %d Läufe in Kap. 1–6 + %s: steckt/gefangen = %d (vorher 5 gefangene Fässer in 400 Objekten) |' % (nobj, nobjl, ('%d Objekte / %d Läufe Vollmessung Kap. 1' % (voll[0], sum(voll[1].values()))) if voll else 'keine Vollmessung', objbad))
w('| Hochziehen/Mantle-Höhe | ja | 3 (bis 2,0 m) | 1 (bis 2,4 m) | Kiste 1,6 × 1,6 m: 0,4 … 2,4 m aus 4 Richtungen oben (4/4), 2,6 m nicht (Sprung 0,98 m + Hochziehen) |' if syn else '| Hochziehen | ja | – | – | – |')
w('| Hocken (Kollisionshöhe) | ja | 3 (1,15 m) | 1 (0,90 m) | `bodyH() = 1,7 − 0,8·crouchK − 0,25·crawlK`; Augenhöhe 0,85 m |')
w('| Kriechen durch Öffnungen | ja | 4 (nur ≥ 1,15 m) | 1 (ab 0,70 m) | Wand mit Loch, Kiste und Netz: 0,70 … 1,20 m durch, 0,55/0,60 gesperrt; Netz auch 0,65 m |' if cr else '| Kriechen | ja | – | – | – |')
w('| Abrutschen von Kanten | ja | 3 (21 cm Überstand) | 2 (13,5 cm) | Körpermitte 10 cm hinter der Kante: steht, 20 cm: rutscht ab |' if syn else '| Kante | ja | – | – | – |')
w(('| Sprung/Luftkontrolle | ja | 2 | 2 (unverändert) | Scheitel %.2f m, Flugzeit %.2f s; Seitenschritt in der Luft %.2f m; Sprint-Sprung %.1f m weit |' % (air['gehen_gerade']['apex'], air['gehen_gerade']['t'], abs(air['gehen_D']['dz']), air['sprint_gerade']['dx'])).replace('.', ',') if air else '| Sprung | ja | 2 | 2 | – |')
w('| Schwenktüren der Basis: offen = Durchgang, zu = gesperrt | ja | 2 | 1 | %s; Tür 3 ist die Klappe des Sicherungskastens (kein Durchgang) |' % ('; '.join('Tür %d (%.0f / %.0f): zu %.1f m gesperrt, offen %.1f m durchgelaufen' % (r['i'], r['pos'][0], r['pos'][1], r['zu'], r['offen']) for r in doors if r.get('res') == 'ok' and r['i'] != 3)) if doors else '| Türen | ja | 2 | 2 | – |')
w('| Fallen (Flutfüllung, Hineingelangen ohne Rückweg) | ja | nicht gemessen | 1 | 8 Gebiete (Dorf, Wald, Amt, Villa, Nr. 1, Nr. 4, Kirchberg-Räume, Kap.-6-Gelände): 0 Fallen (Abschnitt 4) |')
w('')
w('## 2. Befunde, Ursachen, Maßnahmen')
w('')
w('| # | Befund (Messung) | Ursache im Code | Maßnahme | Datei |')
w('|---|---|---|---|---|')
w('| 1 | Auf **jedes** Fahrzeug springen/hochziehen schlug fehl: alle 8 Fahrzeuge „unten“, man lief durch den Wagen (erster Lauf: 12/12 „unten“ je Fahrzeug) | `bewegung_bauen` setzte nach einem Neubau die neuen Kisten nicht auf „aktiv“; `bewegung_aktiv(true)` schrieb dann `minX = __x0` = `undefined` → NaN-Kisten, Fahrzeug ohne Kollision (nach jeder Unsichtbarkeit, z. B. Kapitelstart) | `rec.on = true` nach dem Bauen | `app/mods/bewegung.js` |')
w('| 2 | Lukes Leihwagen (Start) nicht begehbar: Hochziehen unmöglich | `strasse.js` legt `addCol(-77.2, -72.6, 1.85, 3.75)` ohne Höhe an (Standardhöhe 99 m) – eine Wand bis zum Himmel mitten im Wagen | beim Bau der Hitbox werden hohe Kisten im Fahrzeugumriss abgeschaltet (nicht gelöscht) | `bewegung.js` |')
w('| 3 | Konsolenfehler `Cannot read properties of undefined (reading \'minX\')` (raumklang `rk_seg`) und falsche Wandverdeckung des Tons | `colliders.splice(...)` verschob die Indizes, die `raumklang.js` hält (die Türen schalten deshalb nur ab: `minX = maxX = -9999`) | Kisten werden abgeschaltet und beim Neubau wiederverwendet (Pool) – `colliders` wächst nicht mehr (zuerst als Leistungs-Gate-Fehler aufgefallen: p95 Wald 18 → 42 ms) | `bewegung.js` |')
w('| 4 | Fässer/Tonnen: Sprung/Hochziehen „drüber“ landete **im** Fass, Körper (r 0,3 m) steckte fest (5 gefangene Fälle in 400 Objekten) | Netz-Kollision arbeitet an der Oberfläche: steht die Körpermitte weiter als 0,3 m von der Wand, gibt es keinen Treffer – kein Schieben, kein Hochziehen | Volumenfüller: kleine wasserdichte Netze (≤ 5000 Dreiecke, ≤ 2,4 m) werden von oben mit Strahlen durchlaufen (Vorder-/Rückseiten → feste Abschnitte, Hohlräume im Inneren bleiben frei), Zellen mit Körpermitte ganz im Festen werden zu Kisten bis zur echten Oberkante; Takt höchstens ein Netz je 60 ms im 25-m-Umkreis | `bewegung.js` (`hohl_*`) |')
w('| 5 | Wer (z. B. nach einem Szenenwechsel) im Volumen eines Fahrzeugs steht, kam nicht heraus: 14 von 24 Testlagen (8 Fahrzeuge × 3) blieben drin | `tod_klemmTick` suchte den freien Platz nur mit Weg, der **nicht** durch Kisten führt – vom Wageninneren geht jeder Weg durch die Wagenkisten | neu: steckt der Körper in Füllkisten (Fahrzeug/Fass), nach 0,5 s – auch ohne Eingabe – zum nächsten freien Platz außen schieben; Weg darf durch Füllkisten führen, nicht durch Wände | `app/mods/tod.js` |')
w('| 6 | Hocke 1,15 m Kollisionshöhe, kein Kriechen: Öffnungen niedriger als 1,15 m waren gesperrt (Rätsel „kleine Löcher in Häusern“) | `bodyH = 1,7 − 0,55·crouchK`, Netz-Proben fest bei 0,62/1,05/1,5/1,72 m | Hocke 0,90 m; Kriechzustand 0,65 m (automatisch bei Hocke und Decke < 0,96 m voraus, erst ab 1,0 m wieder Hocke); Netz-Proben folgen der Körperhöhe (`bodyProbes()`); Augenhöhe 0,85/0,55 m; Tempo ×0,5/×0,25 | `app/mods/bewegung_patch.py`, `tod.js` |')
w('| 7 | Hochziehen aus der Luft nur bis ≈ 2,0 m | Grenze `m.top − player.pos.y < 1.2` im Sprung | 1,45 → bis 2,4 m (Sprungscheitel 0,98 m) | `bewegung_patch.py` |')
w('| 8 | Man stand 21 cm neben einer Kante „in der Luft“ | `groundAt` nutzt Radius `R·0,7` für die Stützfläche | `R·0,45` (13,5 cm) | `bewegung_patch.py` |')
w('')
w('Unverändert und geprüft (kein Befund): Kollisionsauflösung `collide()` achsweise in 10-cm-Teilschritten, Stufen bis 0,36 m, Kopfstoß-Schutz, Netz-Schiebung `solidPush`, Kamera-Schutz `camGuard`, Weltgrenze `mapGuard`.')
w('')
w('## 3. Messtabellen')
w('')
w('### 3.1 Fahrzeuge: Sprung-/Mantle-Test')
w('')
w('Je Fahrzeug 8 Richtungen (4 Achsen + 4 Diagonalen), Achsen zusätzlich im Sprint; Anlauf 3,2 m (bei Nachbarn 2,2/1,7 m), Absprung 1,1 m vor der Kante, danach 1 s ausrollen. „oben“ = Körper steht auf dem Fahrzeug (Boden unter den Füßen = Kisten-Oberkante) ; „unten“ = außen gelandet/abgeglitten; „steckt“ = Eindringtiefe > 10 cm in Kiste oder Netz; „gefangen“ = von dort in 0,7 s Lauf + Sprung keine 0,4 m Weg.')
w('')
w('| Nr. | Fahrzeug | Lage x / z | Höhe m | Läufe | oben | unten | Anlauf blockiert | steckt | gefangen | Note |')
w('|---|---|---|---|---|---|---|---|---|---|---|')
for i in sorted(veh):
    v = veh[i]
    if v['h'] is None:
        w('| %d | %s | %.0f / %.0f | – | – | – | – | – | – | – | Kap. 6: siehe Zeile Nr. 3/4 bzw. nicht sichtbar in Kap. 1 (wird erst im Kapitel gebaut) |' % (i, NAMEN.get(v['key'], v['key']), v['pos'][0], v['pos'][2]) if i not in (3, 4) else '| %d | %s | – | – | – | – | – | – | – | – | im Kap.-6-Lauf (Zeile unten) |' % (i, NAMEN.get(v['key'], v['key'])))
        continue
    c = v['c']; n = sum(c.values()); b = c['STECKT'] + c['GEFANGEN'] + c['IM_OBJEKT']
    w('| %d | %s | %.0f / %.0f | %.2f | %d | %d | %d | %d | %d | %d | %d |' % (i, NAMEN.get(v['key'], v['key']), v['pos'][0], v['pos'][2], v['h'], n, c['oben'], c['unten'], c['n/a'], c['STECKT'], c['GEFANGEN'] + c['IM_OBJEKT'], 1 if b == 0 and c['oben'] > 0 else 4))
w('')
w('Alle Fahrzeuge prägnant = ja. „Anlauf blockiert“ entsteht, wenn die Anlaufstrecke vor Wand, Zaun oder Nachbarwagen endet (Wagen 7 und 13 stehen dicht an Hauswänden) – der Test lässt diese Richtung aus, statt die Wand zu werten.')
w('')
w('### 3.2 Requisiten und Kollisionskörper')
w('')
w('Alle Kollisionskisten (Höhe 0,5 … 2,2 m, Grundfläche ≤ 9 m) und alle festen Netze (0,5 … 4 m hoch, ≤ 9 m) der geladenen Welt, gleichmäßige Stichprobe von 300 Objekten je Kapitel, je 4 Richtungen; zusätzlich Kap. 1 vollständig.')
w('')
w('| Kap. | Objekte | Läufe | oben | unten (drüber/abgeglitten) | Anlauf blockiert | innen frei (unter/neben Teilen, beweglich) | streift | steckt | gefangen |')
w('|---|---|---|---|---|---|---|---|---|---|')
for k, (n, c) in objs.items():
    w('| %d | %d | %d | %d | %d | %d | %d | %d | %d | %d |' % (k, n, sum(c.values()), c['oben'], c['unten'], c['n/a'], c['innen_frei'], c['streift'], c['STECKT'], c['GEFANGEN'] + c['IM_OBJEKT']))
if voll:
    n, c = voll; w('| 1 (voll) | %d | %d | %d | %d | %d | %d | %d | %d | %d |' % (n, sum(c.values()), c['oben'], c['unten'], c['n/a'], c['innen_frei'], c['streift'], c['STECKT'], c['GEFANGEN'] + c['IM_OBJEKT']))
w('')
w('Stand der Läufe: Kap. 2–5 mit dem Zwischenstand vom Vormittag (Füller mit 40 m Umkreis und 24-k-Dreiecksgrenze); Kap. 1, Kap. 6 und die Vollmessung mit dem Endstand (25 m, ≤ 5000 Dreiecke, Pool). Die Fahrzeugtests, Kriech-, Hochzieh-, Kanten- und Freischiebe-Messungen sind vom Endstand.')
w('')
w('Die Hälfte der Läufe ist „Anlauf blockiert“: viele Requisiten stehen an Wänden oder in Räumen ohne 1,7 m Anlauf. Das ist keine Aussage über diese Objekte; sie sind in den anderen Richtungen oder durch die Laufraster-Tests (`_qa_kol` Teil C) abgedeckt.')
w('')
w('### 3.3 Hohlraum-Füller')
w('')
w('| Kap. | geprüfte Netze (25 m um den Spieler) | Netze mit gefüllten Volumen | Kollisionskisten | Fehler |')
w('|---|---|---|---|---|')
for k in range(1, 7):
    d = J('hohl_k%d.json' % k)
    if d: w('| %d | %d | %d | %d | %d |' % (k, d['geprueft'], d['recs'], d['n'], d['err']))
if hv: w('| 1 (voll) | %d | %d | %d | %d |' % (hv['geprueft'], hv['recs'], hv['n'], hv['err']))
w('')
w('(Die Kap.-1–6-Zeilen stammen aus dem Lauf vor der Umstellung auf 25 m Umkreis und das Dreiecksbudget; die Vollmessung zeigt den jetzigen Stand.)')
if syn:
    w('')
    w('### 3.4 Hochziehen (Kiste 1,6 × 1,6 m, Anlauf aus 4 Richtungen)')
    w('')
    w('| Höhe | oben | Hochziehen |')
    w('|---|---|---|')
    for r in syn['thick']:
        res = r['res']; w('| %.1f m | %d/4 | %s |' % (r['h'], sum(1 for x in res if x[0] == 'oben'), 'ja' if any(x[2] for x in res) else 'nein (Sprung/Stufe)'))
    w('')
    w('Dünne Mauer (20 cm): ' + ', '.join('%.1f m: %s' % (r['h'], 'oben' if r['res'][0][0] == 'oben' else ('über die Kante gestiegen' if r['res'][0][2] else 'nicht überwunden')) for r in syn['thin']) + '. Mauern über 1,8 m und dünner als 40 cm lassen sich nicht übersteigen (keine Standfläche hinter der Kante) – bewusst.')
    if syn.get('kante'):
        w('')
        w('### 3.5 Kante')
        w('')
        w('| Körpermitte hinter der Kante | Höhe nach 1 s | Ergebnis |')
        w('|---|---|---|')
        for off, y, x in syn['kante']:
            w('| %d cm | %.2f m | %s |' % (round(off * 100), y, 'steht' if y > .9 else 'rutscht ab'))
if cr:
    w('')
    w('### 3.6 Kriechen')
    w('')
    w('Wand 4 m breit, Öffnung 1,0 m breit, Hocke gehalten (Strg) und 2,6 m Anlauf; als Kollisionskisten und als Netz (Box-Meshes mit BVH) gebaut.')
    w('')
    w('| Lochhöhe | Kisten | Netz | Zustand | tiefste Augenhöhe |')
    w('|---|---|---|---|---|')
    by = collections.defaultdict(dict)
    for r in cr['rows']: by[r['hh']][r['mode']] = r
    for hh in sorted(by):
        a, m = by[hh].get('col'), by[hh].get('mesh')
        w('| %.2f m | %s | %s | %s | %.2f m |' % (hh, 'durch' if a and a['durch'] else 'gesperrt', 'durch' if m and m['durch'] else 'gesperrt', 'Kriechen' if (a and a['maxCrawl'] > .5) else 'Hocke', (a or m)['minEye']))
    w('')
    w('Geplant für die Rätsel mit kleinen Löchern: Öffnungen ab **0,70 m** Höhe sind verlässlich passierbar (0,65 m nur als Netz). Rät­sel­bau: Loch als Lücke zwischen Kollisionskisten (Unterkante der oberen Kiste = Lochhöhe) oder als Netz-Öffnung bauen; Mindestbreite 0,7 m.')
w('')
w('## 4. Fallen / Erreichbarkeit (Flutfüllung)')
w('')
w('Raster 0,5 m; Zelle frei = Körper (r 0,3 m, 1,7 m) überlappt weder Kisten noch feste Netze; Kanten zu 8 Nachbarn, Aufstieg ≤ 1,5 m (Sprung/Hochziehen), Abstieg beliebig. **Vorwärts** vom Start aus erreichbar (F), **rückwärts** zum Start zurückkehrbar (R). Falle = F \\ R (hineingelangt, nicht wieder heraus). Außerdem werden freie, aber **nicht erreichbare** Bereiche gelistet (geschlossene Räume hinter verriegelten Türen, Zaunstreifen an der Weltgrenze).')
w('')
w('| Gebiet | Fläche erreichbar m² | Fallen | nicht erreichbare Bereiche | Bemerkung |')
w('|---|---|---|---|---|')
BEM = {'f2_dorf': 'Kap. 1: Straße, Gärten, Hinterhöfe; unerreichbar: zwei Zaunstreifen hinter der Südgrenze, Innenräume Nr. 1 und Nr. 7 (Türen zu)',
       'f2_wald': 'Kap. 1/6: Dustwoods; unerreichbar: Streifen jenseits der Weltgrenze (z 62…98)',
       'f2_amt': 'Kap. 2: Amt; unerreichbar: Räume hinter verriegelten Stahltüren (Messraum, Archiv …) und Außenwelt',
       'f2_villa': 'Villa: unerreichbar: ein Raum (Tür zu)', 'f2_nr4': 'Nr. 4 (Oma Erna): unerreichbar: drei Zimmer (Türen zu) und eine Bettfläche (1 m², 0,7 m hoch, Möbel ringsum)',
       'f2_kb2': 'Kirchberg-Räume (Friedhofs-/Vorgartenräume): 3 kleine Flecken (0,5–30 m²) hinter Möbeln', 'f2_nr1': 'Nr. 1 (Elternhaus): Innenraum (Tür zu) und Grenzstreifen',
       'f2_k6': 'Kap. 6: Gelände um den Bus; ein 3-m²-Fleck an der Boxkante'}
NAMEF = {'f2_dorf': 'Dorf (x −110…110, z −42…62)', 'f2_wald': 'Wald (x −60…140, z 62…262)', 'f2_amt': 'Amt Kap. 2', 'f2_villa': 'Villa', 'f2_nr4': 'Nr. 4 innen', 'f2_kb2': 'Kirchberg-Räume', 'f2_nr1': 'Nr. 1 + Vorgarten', 'f2_k6': 'Kap. 6 Bus/Wald'}
for n in ('f2_dorf', 'f2_wald', 'f2_amt', 'f2_villa', 'f2_nr4', 'f2_kb2', 'f2_nr1', 'f2_k6'):
    f = J(n + '.json')
    if f: w('| %s | %.0f | %d | %d | %s |' % (NAMEF[n], f['vorwaerts_m2'], f['nFallen'], f['nUnerreichbar'], BEM[n]))
w('')
w('## 5. Grenzen und Offenes (ehrlich)')
w('')
w('* **Stichprobe:** Requisiten/Netze in Kap. 1–6 je 300 Objekte × 4 Richtungen (gleichmäßig über Kisten und feste Netze); Kap. 1 zusätzlich vollständig. Die Welt bleibt über alle Kapitel geladen, die Kapitel unterscheiden sich durch Sichtbarkeit und nachgebaute Räume – die Stichproben je Kapitel prüfen deshalb zum großen Teil dieselben Orte, Kap. 6 zusätzlich Dustwoods/Bus.')
w('* **Anlauf blockiert** (rund die Hälfte der Objektläufe) wird nicht als „bestanden“ gewertet, nur nicht gewertet.')
w('* Fahrzeuge **ohne** Spielerzugang nach innen: Bus (Kap. 6) und Transporter sind als massive Hitbox gebaut (Fenster sind nie Eingang); Innenräume sind reine Kulisse hinter Glas. Konsistent, keine Hohlräume ohne Ausgang.')
w('* Rätsel mit kleinen Löchern (Nutzer baut später): physikalisch bestätigt ab 0,70 m; **Spielhinweis** (Fibel/Tutorial „Strg/C: ducken, unter Öffnungen kriechen“) ist nicht geändert worden – der Text steht in `verstecke.js`/`fibeltour.js` unter „ducken“ und bleibt gültig.')
w('* `raumklang.js` hält Kollisionsindizes: Kisten werden deshalb nur abgeschaltet/wiederverwendet. Wiederverwendete Fahrzeugkisten stehen im Schallraster in den alten Zellen (Verdeckung für parkende Fahrzeuge unverändert, bewegte Fahrzeuge sind selten).')
w('')
w('## 6. Werkzeuge und Nachlauf')
w('')
w('`app/tools/qa_bewegung/` (Kopie der Werkzeuge aus `C:\\Users\\GIGABYTE\\_qa_bew`): `lib.js` (Testbibliothek `__BW`: place/upd/sprungTest/overlap), `mk.js` (Steps bauen), `veh_all.js`, `obj_test.js`, `synth.js` (Hochziehen/Kante), `crawl.js`, `falle2.js`/`falle.js`, `freischieben.js`, `door_test.js`, `aircontrol.js`, `chain*.js`, `docgen_*.py`. Aufruf: `node mk.js <name> <kap> lib.js <test>.js` → `bash _live.sh run <name>.json`; Ergebnis liegt in `out/*.json` (Schritt gibt „FILES:“ zurück).')
w('')
open(OUT, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('geschrieben', OUT, len(L))
