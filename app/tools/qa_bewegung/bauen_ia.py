# -*- coding: utf-8 -*-
# baut docs/gameplay/interaktion_audit.md aus den Messdateien (_qa_bew/out)
import json, os, re, collections
O = r'C:\Users\GIGABYTE\_qa_bew\out'
OUT = r'C:\Users\GIGABYTE\HighAbyssMira-Repo\docs\gameplay\interaktion_audit.md'
def J(n):
    p = os.path.join(O, n)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None
L = []
w = L.append
CREA = re.compile(r'Lp_|Rp_|mixamo|Tail|Head_|pSphere|x_|Jaw|tail|body<root|Spine|L_Eye|Hand|hand|paw|femur|CROW|Leg_|Clavicle|earL|R4_|L1_|L3_|tarsus|Mesh<head|Mesh<PerspectiveCamera|neck|Hip|Object3D<Scene|c_index|index1', re.I)
def real(r): return [t for t in r.get('top', []) if not CREA.search(t[2]) and (t[0] >= .2 or t[1] >= 20)]

# --- typisierte Klickflächen (nach dem Umbau, je Fläche gemessen), eindeutig nach Beschriftung + Lage
seen = {}
for src in ['iap_final.json'] + ['iap_k%d.json' % k for k in range(1, 7)]:
    d = J(src)
    if not d: continue
    for r in d:
        lab = r['label']
        if lab == 'Schließen': continue
        key = (lab, round(r['pos'][0], 0), round(r['pos'][2], 0))
        if key in seen and (seen[key].get('ctl') not in (None, 'kein Teil') or r.get('ctl') in (None, 'kein Teil')): continue
        seen[key] = r
rows = list(seen.values())
def cat(r):
    t = r['typ']; ctl = r.get('ctl') or 'kein Teil'; rot = r.get('rotMax') or 0
    if t == 'tuer':
        if ctl == 'kein Teil': return 'Tür/Tor ohne trennbares Bauteil im Modell'
        return 'Durchgangstür (Raumwechsel): schwingt auf' if rot >= 40 else 'Verschlossene Tür/Tor: Klinke rüttelt'
    if t == 'auto':
        if ctl.startswith('dreh'): return 'Fahrzeug: Autotür rüttelt am Scharnier'
        if ctl.startswith('wippen'): return 'Fahrzeug ohne Tür-Teil: Karosserie wippt'
        return 'Fahrzeug ohne Teil'
    if t == 'deckel': return 'Deckel/Klappdeckel: kippt um die Hinterkante' if ctl != 'kein Teil' else 'Deckel/Kiste ohne trennbares Bauteil'
    if t == 'klappe': return 'Klappe (Handschuhfach) ohne Bauteil' if ctl == 'kein Teil' else 'Klappe: kippt'
    if t == 'schublade': return 'Schublade: gleitet 30 cm' if ctl != 'kein Teil' else 'Schublade ohne trennbares Bauteil'
    return t
agg = collections.OrderedDict()
for r in rows:
    g = cat(r); a = agg.setdefault(g, {'n': 0, 'bsp': collections.Counter(), 'snd': 0, 'rot': [], 'chap': set()})
    a['n'] += 1; a['bsp'][r['label'][:30]] += 1
    if r.get('snd'): a['snd'] += 1
    if r.get('rotMax') and not (r.get('ctl') or '').startswith('wippen'): a['rot'].append(r['rotMax'])
d0 = J('ia0_k1.json')
before_typed = None
if d0:
    lab = set(r['label'] for r in rows)
    sel = [r for r in d0['rows'] if r['res'] == 'ok' and r['label'] in lab]
    mv = [r for r in sel if real(r)]
    before_typed = (len(sel), len(mv))
nTyped = len(rows)
nMove = sum(1 for r in rows if (r.get('rotMax') or 0) >= 1 or (r.get('shift') or 0) >= .05)
nNoPart = sum(1 for r in rows if (r.get('ctl') or 'kein Teil') == 'kein Teil')
doors = J('door_k1.json')

w('# Interaktions-Physik – Audit (Folgeauftrag 10, Stand 11.10.2026)')
w('')
w('Nutzer: „Wenn du ein Auto aufmachst oder eine Tür aufmachst, dass die Tür dann auch aufgeht … alles, was du anfasst und bewegst, soll sich wirklich bewegen.“ Noten: 1 sehr gut … 6 ungenügend; Maßstab mindestens 2, Unprägnantes 3.')
w('')
w('Messweise: Werkzeug `app/tools/qa_bewegung/ia_inv.js` (Vollmessung: je mechanischer Klickfläche E auslösen, Spieler 1,3 m davor, 1,2 s Simulation, Bewegung aller Objekte im 5-m-Umkreis vor/nach vergleichen, Töne mitschneiden, Beschriftung vorher/nachher, Kollisionskisten zählen) und `iap_test.js` (je typisierte Fläche: Drehwinkel/Verschiebung des Bauteils, Fixpunkte der Kante, Richtung zum Spieler, Schließen mit zweitem E). Vorher-Messung = Modul `interaktion.js` per `__iap.aus()` abgeschaltet.')
w('')
w('## 1. Was jetzt passiert')
w('')
w('Neues Modul `app/mods/interaktion.js` (+ `interaktion_patch.py`): hängt sich an jede Klickfläche mechanischen Typs, die **keine** eigene Animation hat (Beschriftung ohne „öffnen/schließen“), sucht das echte Bauteil darunter (Tür-Blatt, Deckel, Autotür nach Knotenname) und bewegt es an einem Drehpunkt/Gleitweg. Animationen laufen nur, solange sie laufen (Liste aktiver Steuerungen, kein Dauer-Tick). Netz-Kollision folgt automatisch (SOL prüft die Matrix je Bild); der Beschriftungswechsel „Schließen“ geht über `userData.iapAnz` (Basis-Patch), `userData.label` bleibt unverändert, weil andere Module Klickflächen per Textvergleich suchen.')
w('')
w('| Typ | Bewegung | Dauer/Winkel | Ton | Zustand |')
w('|---|---|---|---|---|')
w('| Durchgangstür (Aktion wechselt den Raum: Hinaus, Kellertür Nr. 4, Treppen …) | Blatt schwingt am Rand rechts vom Spieler **vom Spieler weg** auf, Aktion (Überblendung/Versetzen) folgt nach 0,3 s, nach 2,2 s fällt die Tür leise zu | 0,5 s · 80° | `doorOpen` | – (Tür steht nach Rückkehr zu) |')
w('| Verschlossene Tür/Tor (Beschriftung ohne „öffnen“, z. B. Stahltür (verriegelt), Klopfen, Garagentor) | rüttelt an der Klinke: gedämpfte Schwingung um den Scharnierrand | 0,55 s · ±3° | `doorCreak` | – |')
w('| Fahrzeug mit Tür-Teilen (Limousine) | nächste Tür rüttelt am Vorderrand | 0,55 s · ±3° | `metalHit2` | – |')
w('| Fahrzeug ohne Tür-Teile (Hatchback, Transporter, Wracks) | Karosserie wippt auf der Federung (Roll ±0,8°, Nick ±0,35°, 6 Schwingungen, gedämpft) | 1,1 s | `metalHit2` | – |')
w('| Deckel, Kisten, Gullydeckel, Karteikasten | kippt um die Hinterkante (Gully: nächste Kante), zweites E schließt (ohne Text/Fund zu wiederholen) | 0,5 s · 74° | `woodSqueak2`/`woodClose2` | im Spielstand (`iap`) |')
w('| Schubladen | gleiten zum Spieler, 70 % der Tiefe (30–34 cm), zweites E schließt | 0,42 s | `woodSqueak1`/`woodClose1` | im Spielstand (`iap`) |')
w('| Gartentore (8), Briefkästen (8) | Modul-eigene Animation (83° bzw. 83–115°) – **neu:** offener Zustand im Spielstand (`tore`) | 0,7 s / 0,45 s | `doorOpen` / `metalOpen` | **neu** gespeichert |')
w('| Türen/Deckel/Schubladen/Klappen, die im Modell Teil eines Gesamtnetzes sind (Kapellentür, Müllcontainer, Kofferraum, Handschuhfach, Kinderkiste, Gullydeckel …) | **Laufzeit-Trennung** (`iap_trenne`): Dreiecke ganz innerhalb der Klickfläche (bzw. gemessener Region) werden zu eigenem Netz mit Scharnier/Gleitachse; Original zu Nulldreiecken (BVH bleibt gültig) | wie oben | wie oben | `iap` |')
w('| Geräte (Funkgerät, Radio, Kassettenrekorder) | Drehknöpfe drehen sich, Tasten drücken ein (`iap_geraetBedienen`), Auslösung zusätzlich zur Original-Aktion | 0,25 s | `switch1` | – |')
w('| Von der Story freigegebener Wagen (`userData.iapOffen`) | Tür klappt 66° auf (Scharnier vorn), zweites E schließt | 0,55 s | `carDoor` | – |')
w('')
w('## 2. Inventar nach Typ (Kap. 1–6, je Fläche gemessen)')
w('')
w('Gemessen wurden **%d** Klickflächen mit mechanischem Typ (nach Beschriftung + Lage dedupliziert). Davon bewegen jetzt %d ein Bauteil sichtbar, %d haben kein trennbares Bauteil (Klickfläche über einem Gesamtnetz oder einer Wand).' % (nTyped, nMove, nNoPart))
if before_typed: w('Vorher (Modul abgeschaltet, Kap. 1, dieselben Flächen): %d Flächen ausgelöst; bei %d davon bewegte sich irgendetwas im 5-m-Umkreis (Figurenknochen, Raben, Teleport beim Gullydeckel) – das angeklickte Bauteil selbst bewegte sich bei **keiner**.' % before_typed)
w('')
w('| Verhalten | Flächen | Beispiele | mit Ton | größter Winkel |')
w('|---|---|---|---|---|')
for g, a in sorted(agg.items(), key=lambda x: -x[1]['n']):
    w('| %s | %d | %s | %d | %s |' % (g, a['n'], ', '.join(n for n, _ in a['bsp'].most_common(4)), a['snd'], ('%.0f°' % max(a['rot'])) if a['rot'] else '–'))
w('')
w('## 3. Objektliste mit Schulnote')
w('')
w('prägnant: ja = Hauptrequisite/Haupttür/Fahrzeug in Story oder erster Minute, nein = Nebenobjekt. „Kollision folgt“: Netz-Kollision aktualisiert sich je Bild (SOL) bzw. Schaltkiste.')
w('')
w('| Objekt (Typ) | prägnant | bewegt vorher | bewegt nachher | Kollision folgt | Ton | Zustand gespeichert | Prompt wechselt | Note vorher | Note nachher | Beleg |')
w('|---|---|---|---|---|---|---|---|---|---|---|')
def has(label_rx):
    return [r for r in rows if re.search(label_rx, r['label'], re.I)]
def meas(rs):
    ok = [r for r in rs if (r.get('ctl') or 'kein Teil') != 'kein Teil']
    return len(ok), len(rs)
# Zeilen aus den typisierten Flächen
def row(name, prag, vor, nach, koll, ton, zust, prompt, nv, nn, beleg):
    w('| %s | %s | %s | %s | %s | %s | %s | %s | %d | %d | %s |' % (name, prag, vor, nach, koll, ton, zust, prompt, nv, nn, beleg))
dr = [r for r in rows if r['typ'] == 'tuer']
pas = [r for r in dr if (r.get('rotMax') or 0) >= 40]
rat = [r for r in dr if (r.get('ctl') or 'kein Teil') != 'kein Teil' and (r.get('rotMax') or 0) < 40]
nop = [r for r in dr if (r.get('ctl') or 'kein Teil') == 'kein Teil']
row('Schwenktüren der Basis (`makeDoor`, 5 in Kap. 1 + Amt) – Tür öffnen/schließen', 'ja', 'ja (89°)', 'ja (89°)', 'Kiste schaltet: zu %s m gesperrt, offen durchgelaufen' % ('/'.join('%.1f' % r['zu'] for r in doors if r.get('res') == 'ok' and r['i'] != 3)) if doors else 'ja', 'ja', 'ja (`doors` im Spielstand)', 'ja', 2, 1, 'door_k1.json (4 Durchgangstüren), ia_k1.json')
row('Durchgangstüren (Hinaus, Kellertür Nr. 4, Friedhof, Vorgarten) – %d Flächen' % len(pas), 'ja', 'nein (Überblendung ohne Tür)', 'ja (80°, vom Spieler weg)', 'Netz folgt', 'ja', 'nein (Tür fällt zu)', 'nein (Beschriftung bleibt „Hinaus“)', 4, 2, 'iap_final.json (rot 80,2°, weg −0,8)')
row('Verschlossene Türen/Tore (Stahltür, Klopfen, Ladentür, Schuppen, Garagentor, Hintertür …) – %d Flächen mit Bauteil' % len(rat), 'ja', 'nein (nur Text/Ton)', 'ja (Klinke rüttelt ±3°)', 'n. a. (bleibt zu)', 'ja', 'n. a.', 'n. a.', 4, 2, 'iap_final.json (rot 1,9°)')
row('Türen/Tore, deren Blatt im Gesamtnetz steckt (Kapellentür, Stalltür, Eisentor, Garagentor, Hintertür, Schuppen) – %d Flächen' % len([r for r in dr if (r.get('ctl') or 'kein Teil') != 'kein Teil' and (r.get('rotMax') or 0) < 40 and re.search(r'kapelle|stall|eisen|garagen|hintertür|schuppen|laden', r['label'], re.I)]), 'ja', 'nein (Ton + Text)', 'ja: Blatt per Laufzeit-Trennung herausgelöst, **rüttelt** (Story: abgeschlossen)', 'n. a. (bleibt zu)', 'ja', 'n. a.', 'n. a.', 4, 2, 'iap_k*.json (ctl dreh:tuer, rot 1,9°); Kapellentür: Blatt per Region (-53,8…-52,8 / 81,1) aus der Scan-Wand getrennt')
row('Villa-Tür (Eisenplatte mit acht Schlüssellöchern, Kap. 4) – %d Flächen ohne Blatt' % len(nop), 'ja', 'nein', 'nein (Platte ist eine Textur-Decke, Wechsel per Überblendung)', 'n. a.', 'ja', 'n. a.', 'n. a.', 4, 3, 'Platte ohne Türblatt (`anwesen.js`): öffnet erst durch Szenenwechsel `anwesen_enterHall`; Wippen nur an der Wurzel')
cars = [r for r in rows if r['typ'] == 'auto']
w('| Autos/Transporter/Wracks (Klick „Auto“ …) – %d Flächen | ja | nein | ja (Wippen/Türrütteln) | Hitbox bleibt | ja | n. a. | n. a. | 4 | 2 | iap_final.json |' % len(cars))
w('| Autotür Lukes Leihwagen (strasse.js, Innenlicht + Warnsummen) | ja | ja (69°) | ja (69°, Innenlicht) | Netz folgt | ja (`carDoor`, Summen) | aus Story-Schlüssel abgeleitet | ja | 2 | 2 | ia_k1.json |')
w('| Lucys Auto Fahrertür (Proxy-Tween, gespiegelt nach außen) | ja | ja | ja | Netz folgt | ja | aus Story abgeleitet | ja | 2 | 2 | strasse.js |')
lid = [r for r in rows if r['typ'] == 'deckel' and (r.get('ctl') or 'kein Teil') != 'kein Teil']
w('| Deckel/Gully/Karteikasten/Kiste mit Teil – %d Flächen | nein/ja | nein | ja (74°, schließbar) | Netz folgt | ja | ja (`iap`) | ja („Schließen“) | 4 | 1 | iap_final.json |' % len(lid))
lidn = [r for r in rows if r['typ'] == 'deckel' and (r.get('ctl') or 'kein Teil') == 'kein Teil']
w('| Müllcontainer, Kofferraum (Wrack), Kinderkiste, Pfandkisten, Zigarrenkiste, Gullydeckel – aus Gesamtnetz herausgetrennt (Laufzeit) | ja (Container/Kofferraum) / nein | nein | ja (73–75°, schließbar, Gully mit dunklem Schacht) | Netz folgt | ja | ja (`iap`) | ja („Schließen“) | 4 | 2 | iap_k*.json (ctl dreh:deckel); Bild shots5_out/zu0–auf0 |')
w('| Blechkiste des Kommandos, Zweiter Transporter (es klopft) | nein | nein | nein (Ton + Text) | n. a. | ja | n. a. | n. a. | 4 | 3 | Klickfläche ohne eigenes Netz (Nebenobjekt) |')
sch = [r for r in rows if r['typ'] == 'schublade']
w('| Kommodenschublade (Nr. 4, Hit nachgeführt), Unterste Schublade (Archiv) | ja | nein | ja (gleitet 30 cm, schließbar) | Netz folgt | ja (`woodSqueak1`/`woodClose1`) | ja (`iap`) | ja | 4 | 1 | iap_k*.json (gleit:schublade, shift 0,30) |')
w('| Hängeregistratur (Zahlenschloss), Aktenschrank (Doppeltürschrank) | ja | nein | rüttelt (verschlossen) / unverändert | n. a. | ja | n. a. | n. a. | 4 | 2 | Story: Zahlenschloss; Aktenschrank ist ein Türenschrank ohne Schublade (bewusst nicht typisiert, ein erster Versuch ließ die Griffleiste herausgleiten – verworfen) |')
w('| Registraturschrank (Archiv, Batterie), Tresen-Schublade, Besteck | ja / nein / nein | nein | nein (Ton + Text) | n. a. | ja | n. a. | n. a. | 4 | 3 | Registraturschrank: Modell als `InstancedMesh` (alle Schränke teilen ein Netz, Schubladen nur Textur) – Trennung nur per Blender-Export je Schrankmodell; Tresen-Schublade hat kein sichtbares Möbelteil (Hit auf der Theke; Typisierung gesperrt, weil sonst der Fernseher auf der Theke herausglitt); Besteck liegt lose |')
w('| Gartentore (8) | nein | ja (83°) | ja (83°) | Schaltkiste | ja | **neu: ja** (`tore`) | ja | 3 | 1 | ia_k1.json, `interaktion.js` |')
w('| Briefkästen (8) | nein | ja (83–115°) | ja | n. a. | ja | **neu: ja** (`tore`) | ja | 3 | 1 | ia_k1.json |')
w('| Schrank (Weiss-Raum, „Den Schrank öffnen“) | ja | ja (86°) | ja | Netz | ja (`doorCreak`) | ja | ja | 2 | 2 | ia_k1.json |')
w('| Kühlschrank Nr. 4 (Modell mit Tür) | nein | ja (100°) | ja | Netz | ja | nein | ja | 2 | 2 | ia_k1.json (Commit 6cad8a5) |')
w('| Geräte: Funkgerät (Funkkasten), Radio, Rekorder, Fernseher | ja | nein (Ton/Licht/Text) | ja: Drehknöpfe drehen sich (Funkgerät 2 Regler, Radio 2 Regler), Taste drückt ein (2–23 mm), Antenne/Klappe wo im Netz getrennt vorhanden | n. a. | ja (`switch1`) | ja (Rätselzustände wie vorher) | z. T. | 4 | 2 (Funkgerät/Radio) · 3 (Fernseher: Röhrenkörper ohne Bedienteile) | device_test.json; Overlay des Funkkastens: shots5_out/auf1 |')
w('')
w('## 4. Probleme, die beim Bauen auftraten (und gelöst wurden)')
w('')
w('| Problem | Folge | Lösung |')
w('|---|---|---|')
w('| Türblätter der Fab-Tür-Modelle (`door1`) sind ein Netz mit Griff (21 cm Tiefe) | Eckpunkt-Test „Scharnierkante fix“ schlug an der Griffseite an | Scharnier an der Breitenkante, Mittellinie der Tiefe; per Mittelpunkt-Bewegung gemessen: Freikante weicht um 0,8–0,87 m vom Spieler (`weg` < 0) |')
w('| Erste Fassung ließ die Tür **auf den Spieler** zu schwingen (`weg` +0,48 … +0,87) | Blatt hätte den Spieler gestoßen | Vorzeichen per Messung umgekehrt (`weg` −0,8) |')
w('| Klickflächen mit Textvergleich in anderen Modulen (`anwesen.js`, `neben3.js`, `kapitel5.js`) | das Ersetzen von `userData.label` durch eine Funktion hätte Fundstellen verloren | Beschriftungswechsel „Schließen“ über `userData.iapAnz` (Basis-Patch), `label` bleibt |')
w('| Kellertür der Basis (`cellarDoor`) heißt wie die Durchgangstür Nr. 4 | öffnete sich 80° und zeigte nur den Text „Eine schwere Tür …“ | Durchgang nur, wenn die Original-Aktion den Raum wechselt (Quelltext enthält `kirchberg_rein/raus`, `nr4_wechsel` …) |')
w('| Brüche beim Indexieren von 12 000 Netzen | Ruckler beim ersten E | Verzeichnis nur 18 m um den Spieler, erst beim ersten E |')
w('')
w('## 5. Offen (mit Ursache)')
w('')
w('* **Registraturschrank** (Archiv, Batterie-Fund): Modell wird als `InstancedMesh` mehrfach gestellt; die Schubladen sind Teil der Textur. Echte Schublade braucht Blender-Nacharbeit je Schrankmodell (Schublade als eigenes Objekt, GLB neu) – Nebenfund, Note 3. Alle anderen Haupt-Rätselmöbel (Kommode, Unterste Schublade, Karteikasten, Handschuhfächer, Kofferraum, Müllcontainer, Kinderkiste) bewegen ein echtes Bauteil.')
w('* **Verschlossene Türen** (Kapellentür, Stalltür, Eisentor, Garagentor, Ladentür, Hintertür, Schuppen) rütteln am echten Türblatt statt zu öffnen – das ist die Story (abgeschlossen); der Aufklapp-Mechanismus (`iapOffen`, 66° mit Innenlicht) ist für alle Wagen vorhanden, die eine Story-Aktion freigibt (heute: Lukes Leihwagen und Lucys Auto, beide mit eigenen Animationen). Transporter/Bus sind laut Story nicht zu öffnen.')
w('* **Villa-Tür**: Eisenplatte ohne Türblatt, Szenenwechsel per Überblendung – kein Türblatt zum Schwenken.')
w('* **Fernseher**: Röhrenkörper aus einem Netz ohne Bedienteile (Hintergrund, Note 3).')
w('* **Blender**: nicht verwendet. Die Trennung geschieht zur Laufzeit (Dreiecke ganz innerhalb der Klickfläche → eigenes Netz, Original zu Nulldreiecken), das hält GLB/KTX unverändert; ein Blender-Export wäre nur für den Registraturschrank nötig.')
w('* Zustand: Schubladen/Deckel/Klappen (`iap`) sowie Gartentore und Briefkästen (`tore`) werden gespeichert; rüttelnde/aufschwingende Durchgangstüren sind flüchtig.')
w('')
open(OUT, 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('geschrieben', OUT, len(L), 'typisiert', nTyped, 'bewegt', nMove, 'kein Teil', nNoPart, before_typed)
