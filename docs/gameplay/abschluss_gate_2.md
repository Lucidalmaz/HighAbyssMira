# Abschluss-Gate 2 (14.10.2026) – die im Gate vom 13.10. nicht belegten Punkte

Note = Schulnote. Grundlage: `abschluss_gate.md` (Abschnitt D „Nicht belegt / offen“). Werkzeuge: `C:\Users\GIGABYTE\_gate2\` (g2.py, cyc.py, proto.py, pre.js, k3_*/k4_*/k5_*/k6_*.js, walls2.js, cands.json), dazu `_abs`, `_qa_kol`, `_zst`.
Bilder: `fotos_1410/`.

**Methode, wichtig für die Einordnung.** Auf der GPU lief der Stimmen-Prozess (7,3–7,7 GB von 8 GB belegt): die Normal-Instanz verlor dabei den WebGL-Kontext (`isContextLost() = true`, Spieler ließ sich nicht mehr bewegen – das hatte auch den ersten Wand-Lauf am 13.10. ungültig gemacht). Alle Logik-, Kollisions- und Ablauf-Läufe liefen deshalb in der **Lite-Instanz** (Formen, Kollision, Auslöser, Zeitabläufe unverändert; Bilder grau). Normal nur für Bild (Fenster-Figur) und das Leistungs-Gate. Pro Kapitel ein frischer Seitenstand, Kapitel nicht neu geladen, sondern per Teleport/Hook gesprungen; je Kapitel ein Speichern/Laden-Zyklus mit echtem Weg (Menü → Karte → Kapitelkarte → Spiel) und Snapshot-Vergleich.

## A. Ergebnis je Punkt

| # | Punkt | Befund | Note vorher | Note nachher | Beleg |
|---|---|---|---|---|---|
| 1a | Hauptweg Kap. 3 | **Echt durchlaufen** (Tasten/E/UI, kein Hook außer `kapitel3_erstarren` gegen die Graukind-Jagd beim Testlauf; die Jagd selbst wurde mit 3 echten Fängen und Zurückspringen der Laterne einmal erlebt): Aufstehen (W) → Glocke → Kuh 3 Stellen → Telefon (E, Auflegen-Taste) → Justin (Ankunft, Pflichtsätze) → Zählbuch → Funkkasten 31,10 (Regler, HINHÖREN, 3 Fragen, HASENBROT an Kanal B) → Hebel 5-3-1-7 → Behaltene (echt zu Justin gelaufen) → Hand → Nimmerheim Raum 1 (Frage an der Tür, Karte) → Raum 2 (Hilde, 4 Fragen, Küchenuhr falsch, dann 3:13) → Raum 3 (Blatt, 4 Stellen, „JUSTINS“) → Hoher Abgrund → Wahl A → Endkarte „KAPITEL 3 — ENDE“, `KAP.done = 3`, Knopf „WEITER · KAPITEL 4“. Keine Softlocks. | 3 | 2 | `_abs/out_k3b … out_k3a5` (Zeilen je Schritt), Log in `steps.json` |
| 1b | Hauptweg Kap. 4 | Start → Nr. 3 klopfen (echt, Szene Lucy/Vegas) → AG-12 (3 Auswahlen, echt) → Presse mit 8 Teilen (E, Schlüssel entsteht, Ziel wechselt) → „Die Tür der Villa aufschließen“ (E) → Halle (echt). Danach **per Flags/Hook**: Räume Arbeitszimmer/Anrichte/Obergeschoss/Keller betreten (`villa_geh`, alle 4 laden, Raum-Wechsel korrekt), Schritte Nadel/AG-13/Zelle/AG-14/Ring/Noten gesetzt, `__anw.hallEnd()` → Endkarte „KAPITEL 4 — ENDE“. Die Szenen in den Innenräumen (R4-1, AG-13, Wolter AG-14, W-09…W-11) wurden **nicht** gespielt. | 3 | 3 (Hälfte echt) | `_abs/out_k4c … out_k4cyc_r` |
| 1c | Hauptweg Kap. 5 | Start → Veranda (echt, ~70 s Gespräch) → Fenster-Wahl (echt, „Nichts sagen“) → Hildes Kamera (E) → Foto Lucy am Fenster (echt, `kamera_ausloesen`) → Licht → Haus Nr. 1 (Tür, Küche, „Tisch“, Ziel wechselt nach 8 s zur Spieluhr) → danach Beats foto2, spieluhr, heimweg, lucy, anruf, brot, stall, tappen, grab, zaun **per Hook** (`__k5.go`), je Ziel/Fehler geprüft (0 Fehler) → Nordzaun-Gitter (E) → Endkarte „KAPITEL 5 — ENDE · ISS AUF, BRUDER“, `KAP.done = 5`. Nicht gespielt: Schleife (3 Runden), Atem-Szene, Stall/Brot, Tappen, Friedhof, AG-15/16/17. | 3 | 3 (Hälfte echt) | `_abs/out_k5a … out_k5g` |
| 1d | Hauptweg Kap. 6 | Start → Gitter (E halten, echt) → Krumen → Hütte → Zaun → Faden → Hochsitz-Nähe → Falle (AG-19, Start echt, `__k6.zu()` Hook) → Fraßstelle (Dienstbuch echt) → Hirsch-Ereignis **kam in 60 s nicht von selbst → Hook** → Lager (Hook nach 60 s) → Wrack → Bau (echt) → Seite am Bau (E) → Finale-Kino (echt) → Epilog (Whiskey-Führung, echt) → Hochsitz hinaufsteigen (E) → Gespräch oben → Endkarte „KAPITEL 6 · WENDIGO · ENDE“. AG-18 (Wolter) per Flag `K6.ag18` übersprungen (Szene dauert > 150 s, lief nicht zu Ende). | 3 | 2 | `_abs/out_k6d … out_k6q` |
| 1e | Speichern/Laden mitten im Kapitel | K3 (Laternen 5,3 aus, Funk, Justin): erste Messung zeigte, dass die Weltuhr und die Beobachter-Zähler beim Laden zurückgesetzt wurden (Befund 3) – **behoben**; K4 (in der Halle): 13 Abweichungen, alle Zeit/Akku/Fibel-Eintrag; K5: nur Zeit/Ziele-Log (Testartefakt: Beat wurde per Hook zurückgesetzt, Speicherpunkt blieb am Friedhof); K6 (Faden): 19 Abweichungen, davon 2 echte (Befund 4/5, behoben), Rest Zeit/Whiskey-Flags (aufgeholt)/Karten-Nebel | 2 | 2 | `_abs/snaps/k3cyc1_*`, `k4cyc_*`, `k5cyc_*`, `k6cyc_*` |
| 2 | Item-Ketten Kap. 3 (c31–c33) | Echt mit E, nach der Eröffnung: `lampe3` (Ladegerät, Tankstelle) ✓, `drahtschneider` (1. E → Heftseite `ow_seiten`, 2. E → Drahtschneider) ✓, `n3_brecheisen` ✓, `buch` (Zählbuch) ✓; alle vier stehen im Inventar-Text der Fibel | 2 (nicht gelaufen) | 1–2 | `_abs/out_k3items/steps.json` |
| 3 | Türen/Wände „durchgedrückt“ | 135 eindeutige Kandidaten aus `abs_k4–6.json` (K4–K6) per echtem Lauftest (Spieler 1,3 m vor die Fläche, 2 s W, Weg gemessen). Auswertung unten (B). Echte Lücke: Ausgangstür der drei Innenräume Kapelle/Schuppen/Nr. 4 (+ Gisela, Pfarrhaus) – **behoben**. | 3 | 2 (mit Vorbehalt, siehe B) | `_gate2/walls_k4e.json`, `_abs/out_k4x3`, `out_k4x4` |
| 4 | Fenster-Figur Nr. 8 | 3D-Körper (Kind in kurzen Hosen, `gezaehlt_j`) steht hinter dem Glas, blickt zur Straße: `ff3=true, fail=false, fade=1,0, err=0`. Das Fenster liegt an der **Rückseite** von Nr. 8 (Außen-Normale +z, nicht zur Straße) – von der Straße aus ist sie nicht zu sehen, nur vom Garten. Erster Versuch zeigte den Rücken, weil ich im Haus stand (falscher Standort, Bild gelassen: `fenster_nr8_innenseite_falscher_standort.png`). | – | 2 | `fotos_1410/fenster_nr8_aussen.png` |
| 5 | Doppeltext/Sprecher K3–K6 | Aus dem Beobachter-Log (volle Textlänge, 189 Ereignisse über K3–K6): **0 echte Doppelungen**; gefundene Wiederholungen sind Absicht: „W – aufstehen“ alle 8 s bis W, „Whiskey wartet auf dich“ alle 20 s bei Abstand, „Hinter dir geht eine Laterne wieder an“ je Fang (3 Fänge = 3×), „Scheiße.“ 3×. Einziger auffälliger Fall: der Drahtschneider-Toast kommt bei beiden E (Heftseite und Werkzeug) mit demselben Text (2 Toasts in 4,8 s). Sprecher: jede Rede in „…“ trägt einen Sprecher (K3: JUSTIN, KINDERSTIMME, LUCYS STIMME, LUCY · KANAL B, AMTSSTIMME, FUNK, HILDE WENDT, VEGAS 2009 …; K4: VEGAS, NACHSORGE 11/12, FUNK; K5: VEGAS, LUCY, LUCY?, GISELA, NACHSORGE (FUNK); K6: LUKE, ECHTER LUKE, WOLTER, WHISKEY (EINE FRAUENSTIMME) …). Es sind nur die gespielten Strecken protokolliert (siehe D). | 3 | 2 | `_gate2/proto.py`, `_abs/snaps/*_obs.json` |
| 5b | Text weiter / X | X überspringt in den Gesprächen (K3 Justin, Hilde, Wahl, K5 Veranda …) zuverlässig. **Ausnahme:** die Hochsitz-Szene in K6 („ECHTER LUKE“, ~60 Zeilen) lief trotz X (alle 0,5 s) rund **13 Minuten** bis zur Endkarte – dort greift X nicht (Befund 8, offen). | 2 | 3 (K6-Ende) | `_abs/out_k6o … out_k6q` |

## B. Wand-/Türen-Lauftest (Punkt 3) im Einzelnen

Kandidatenquelle: `_qa_kol/out/abs_k4.json … abs_k6.json`, Bereich `C.durchgedrueckt` (101/102/96 Einträge, 135 eindeutige Zellen+Richtungen). Eine Zeile = Spieler startet 1,3 m vor der Zelle in Richtung `dir`, hält 2 s W, gemessen wird der Weg gegenüber der Mitte der Objektbox (`walls2.js`, Ergebnis `_gate2/walls_k4e.json`). Zahlen nach den Fixes (Tür-Kollision).
„durch“ = Weg größer als Mitte + halbe Breite + 0,25 m; „Mitte“ = Spieler steht an/hinter der Mitte; „Rand“ = erreicht die Box; „fest“ = bleibt davor; „0 m“ = kommt nicht vom Fleck (Start gesperrt/Möbel).

| Gruppe | Anzahl | durch / Mitte / Rand / fest / 0 m | Entscheid |
|---|---|---|---|
| Weiß · Raum 2/4 (Hülle „sichtbar ohne Kollision“, Box 18 × 18 × 3,5 m) | 34 | 0 / 15 / 14 / 2 / 3 (alle ≤ 1,4 m Weg) | **Messartefakt**: ein Netz ohne Kollision umhüllt den Raum; die Box-Mitte liegt bis 9 m entfernt, der Spieler wird nach ≤ 1,4 m von den Raumwänden gehalten |
| Villa-Räume, Nr. 3, Nr. 9 | 15 | 1 / 1 / 5 / 8 / 0 | **Messartefakt für die frühere Zahl**: im ersten Lauf ohne gebaute Räume war die Möbelmenge „durch“ (14); nach `__villa.bau(...)` aller sechs Räume fest. Rest: Nr. 3 Sofa „Mitte“ (Spieler steigt 0,35 m auf – Sitzfläche), Halle #117 = Netz in 1,7–2,1 m Höhe (Bogen über dem Kopf) |
| Bäume/Laub/Büsche (`gruen`, Instanzen > 4 m hoch) | 22 | 11 / 10 / 1 / 0 / 0 | **Absicht**: `SOL.soft` – Laub „ist weich, bremst und raschelt“. Ob die **Stämme** eigene feste Kollision haben, ist hier nicht getrennt gemessen (offen) |
| Türblatt `uflvddofa…<iap_pivot` (Kapelle/Sakristei, Nr. 4 Diele↔Stube, Schuppen, Nr. 7 Kellertür) | 12 | 3 / 5 / 1 / 2 / 1 | Durchgänge **zwischen** Räumen sind frei, das Blatt steht aber „zu“ und ist durchlaufbar – **offen**, im Bild nicht geprüft |
| Amt (Registratur, Gang, Messraum, Vorraum, Planungsraum, Sicherungsraum) | 17 | 0 / 1 / 2 / 14 / 0 | fest; das Amt ist ab Kap. 3 nicht mehr erreichbar (ruhender Raum) |
| Kapelle innen | 14 | 1 / 0 / 0 / 3 / 10 | die 10 „0 m“ sind Bänke (kommt vom Start nicht weiter = fest); die 1 „durch“ ist eine 4 cm dicke Hervorhebungs-Stange (`hlP`, noCol) – **Messartefakt** |
| Schuppen, Gisela | 4 | 0 / 0 / 0 / 3 / 1 | fest |
| Nr. 1 / Nr. 4 | 3 | 1 / 1 / 0 / 1 / 0 | Nr. 4 oberes Bett „Mitte“ – **echte Lücke, nicht behoben** (ein Versuch über `solidAdd` in `kirchberg_setze` blieb ohne Wirkung und wurde zurückgenommen); Nr. 1 Haustür „durch“ – Zustand je Spielstand (Tür offen), **nicht entschieden** |
| Freiland (Torflügel Alte Villa, Pfosten Hochsitz/Weiher, Scan bei Hof, Schrott) | 14 | 4 / 3 / 1 / 5 / 1 | Torflügel Alte Villa ist in Kap. 4 absichtlich offen (`chapter4Begin`); zwei 0,2 m dicke Pfosten (1,1 m hoch) und ein 6,7 m breiter Scan „ohne Kollision“ bei Hof sind **durchlaufbar, nicht im Bild geprüft** |
| **Ausgangstür der Innenräume Kapelle, Schuppen, Nr. 4, Gisela, Pfarrhaus** (kein Kandidat der Liste, im Lauftest „Hinaus“ aufgefallen) | 5 Räume | vorher durch | **echte Lücke, behoben** (`kirchberg.js`): die geschlossene Scan-Tür hatte keine Kollision, die Wandlücke war frei – man lief aus dem Raum ins Leere. Jetzt: 0,93 m Weg gegen die Tür = blockiert (5/5), E auf „Hinaus …“ führt wie vorher nach draußen |

Zusammen: **ca. 105 von 135 als Messartefakt, Absicht oder fest belegt**; **1 echte Lücke offen** (Bett Nr. 4); **5 Räume Ausgangstür behoben**; **ca. 29 „durch/Mitte“ ohne Bildentscheid** (Türblätter 8, Bäume 21 – die Bäume als Absicht gewertet, Stämme offen, dazu 7 Freiland/Nr. 1). Die Note 2 gilt für die Hauptwege Kap. 4–6 (keine der offenen Stellen liegt darauf); Nebenräume (Kapelle, Nr. 4) 2–3.

## C. Gefundene Fehler und Änderungen (Commit `abschluss_gate_2`)

| # | Datei | Fehler | Änderung | Beleg |
|---|---|---|---|---|
| 1 | `weiss.js` (`c3WhiteUpdate`) | Beim Eintritt nach Nimmerheim lief der Raum-1-Auslöser im ersten Takt mit der **Straßenposition** (x > X3 + 8,6): „Dein Zimmer. / Nein. Seines.“ unter der Weißblende, danach überschrieb `enterWhite` das Ziel mit „Geh Justin nach.“ – im Raum stand es dann falsch | Update nur in Nimmerheim (`|z − Z3| < 60`), sonst Rückkehr | Log `k3q` (Zeile „Dein Zimmer.“ beim Eintritt, `r1Seen=true` bei Position −598), danach Ziel „Geh Justin nach.“ im Raum. Nach dem Fix siehe D.1 |
| 2 | `weiss.js` | Ziel „Sieh dir die Hände an…“ blieb bis zur Wahl stehen (Gespräch am Abgrund, Frage „Was will sie?“) | `setC3` in `weiss_gestaendnisF3` („Der Hohe Abgrund. Nimm Justins Hand.“, Text aus `fuehrung_daten.js` GF-09) und bei der Wahl („Was will sie? Antworte Justin.“) | Log `k3a4` (Ziel bei `phase=wahl`) |
| 3 | `leben.js` (`leben_uhrSync`), `beobachter.js` (Takt) | Weiterspielen: zwischen `applySave` und Kapitelstart steht `kap()` auf 1 → Weltuhr sprang auf den Kapitelstart, die Beobachter-Zähler (`wins`, `vanish`, `stilleLehr`, `turns`, `papierLeer`) und das Glocken-Merkmal `c3` wurden verworfen | Beide Rücksetzungen unterdrückt, solange `ZUST.geladen` und die gespeicherte Kapitelnummer größer ist | Diff `k3cyc1` (wins 2→0, c3 True→False) → nach dem Fix K4/K5/K6-Zyklen ohne diese Felder (nur +1 Zähler) |
| 4 | `anwesen.js` (MOD_SAVE-Setter) | `hallDone` wurde gespeichert, aber nie zurückgelesen: ab Kap. 5 galt die Halle nach dem Laden wieder als nicht beendet | `S.hallDone = !!v.hallDone` | Diff `k6cyc` (`/mods/anwesen/hallDone True → False`) |
| 5 | `kapitel6.js` (`k6_sperre`) | Beim Weiterspielen feuerte die Dorfsperre (Luke steht noch vorm Gitter), `told` bekam „sperre“, Text/Verschiebung möglich | zusätzlich `ZUST.geladen` abgefragt | Diff `k6cyc` (`told` + `sperre`) |
| 6 | `kirchberg.js` (`kirchberg_raum`) | Ausgangstür ohne Kollision (siehe B) | Kollisionskiste in der Türlücke | `out_k4x4`: „Lauf auf die Tür zu: 0,93 m → BLOCKIERT“ in 5/5 Räumen, E „Hinaus“ geht weiter |
| 7 | `gruen.js` (Absperrgitter-Klickfläche) | In Kap. 5 liegen zwei „Absperrgitter“-Klickflächen übereinander (Wild-Hinweis und Kap.-5-Ende `k5_gitter`); zielt der Strahl auf die untere (1,4 m), tut E nichts außer dem Hinweis-Toast, das Kapitelende bleibt aus | Bei `k5.beat === 'zaun'` ruft die Wild-Fläche `k5_gitter()` | `_abs/out_k5g`: erstes E „reach=true“ ohne Wirkung (`f.gitter` undefined), zweites E auf die K5-Fläche löst aus |

## D. Nicht belegt / offen (mit Grund)

1. **Nach dem Einbau wiederholt und belegt:** Fix 1 (Nimmerheim-Eintritt: `r1Seen` nicht mehr früh, Ziel „Geh Justin nach.“ beim Ankommen, nach 10 m im Raum „Finde, was nicht in diese Nacht gehört…“; `_abs/out_fix1`), Fix 3 (K4/K5/K6-Zyklen), Fix 6 (`out_k4x4`). **Gebaut (`node --check`, `node build.js`), aber nicht in einem eigenen Lauf wiederholt:** Fix 2, 4, 5. **Fix 7** (Gitter Kap. 5): der Versuch, den Strahl auf die untere Wild-Fläche zu legen, traf „In den Wald rufen“ – nicht belegt.
2. **Kap. 4–6 nur teilweise echt gespielt** (A, 1b–1d). Per Flag/Hook übersprungen: K4 Innenräume (R4-1, AG-13, AG-14, W-09…11), K5 ab „Tisch“ bis „Zaun“, K6 AG-18, Hirsch-Ereignis, Lager. Grund: Zeit (4 h) und die Länge der AG-Szenen (AG-18 > 150 s ohne Ende).
3. **K3-Doppeltext-Protokoll mit voller Textlänge** gibt es nur für die Item-Strecke; der Hauptweg K3 wurde mit der abgeschnittenen 110-Zeichen-Aufzeichnung gelaufen (Sprecher dort aus dem Log gelesen, nicht maschinell).
4. ~~Befund 8~~ behoben, siehe F1.
5. **Offen aus B:** Türblatt der Innentüren steht zu und ist durchlaufbar (Bild fehlt), Nr.-4-Bett durchlaufbar, Stämme der Bäume nicht von der Krone getrennt geprüft.
6. **Ziel-Anzeige kurz veraltet** (gemessen, nicht geändert): K3 nach dem Anruf „Das Telefon an der Kreuzung klingelt. Nimm ab.“ bis Justin spricht; K4 „Lucy lebt. Fast ganz.“ während AG-12; K6 „Der Hochsitz. Hinauf.“ beim Falle-Start; Phasenzeile eine Stufe hinterher (K6 „3 VON 6“ bei Beat `faden`).
7. Dauerinstanz Normal verliert bei belegter GPU (Stimmen-Prozess) den Kontext; Bilder/Leistung brauchen leere GPU.

## E. Leistungs-Gate (Rauchlauf)

`perf_gate.mjs`, frischer Prozess, Median aus 3 Läufen (das Werkzeug misst immer 3; 1 Vorlauf + 3 × ≈ 255 s), Build mit den Fixes 1–7 (ohne die zurückgenommene `kirchberg_setze`-Änderung): **GATE BESTANDEN**.

| Messwert | Referenz | Median | Grenze |
|---|---|---|---|
| Ladezeit bis spielbar | 70,1 s | 64,6 s [64,6 / 64,9 / 64,1] | 115,1 s |
| Modulphase | 45,4 s | 41,2 s | 78,1 s |
| Kreuzung p95 | – | 42,4–54,5 ms (Einzelläufe) | – |
| Grafikspeicher (GPU-Prozess) | 1851 MB | 1859 MB | 2212 MB |
| JS-Heap | 2937 MB | 2865 MB | 3527 MB |
| Wald p95 / Villa p95 / Amt p95 | 18,2 / 18,2 / 42,3 ms | 18,2 / 18,2 / 24,3 ms | 35,8 / 35,8 / 64,8 ms |
| Shader-Neukompilierungen nach Spielstart | 44 | 44 | 59 |

Rohdaten: `app/tools/perf_last.json`.

## F. Nachtrag 14.10. 18:30–19:00 (Auftrag des Koordinators)

| # | Punkt | Befund / Änderung | Beleg |
|---|---|---|---|
| F1 | **Hochsitz-Szene K6 nicht überspringbar (Befund 8)** | Ursache: `k6_sayZu` wartete mit `k6_wait` (nicht überspringbar) und `k6_zuWarten` hielt jede Zeile bis zu 30 s an, solange „Augen zu“ (Q) nicht gehalten wurde; `say()`/`textweiter` griffen nie. Fix (`kapitel6.js`): Tastenabfang für X/Enter in Beat `oben` (`K6.zuSkip`), `k6_waitS` (überspringbare Wartezeit, in `k6_hochsitz` als `k6_wait` eingeblendet), `k6_sayZu` bricht bei X die Folge ab, `k6_zuWarten` und die Auswahl (`k6_tasteZu`) enden bei X/Enter. | Lauf `_abs/out_k6x`: Zeit bis Endkarte mit X alle 0,5 s **15,8 s** (vorher ≈ 13 min) |
| F2 | Nr.-4-Bett durchlaufbar | `nr4.js`: Box-Collider (`bettKoll`, Höhe 0,9 m, aus `occluders` genommen) über die Bounding-Box beider Betten (Erdgeschoss, oben). | `_abs/out_bed2`: Lauf gegen das Bett stoppt nach 0,87 m bzw. 0,60 m (vorher durch); Collider-Box (−1403,31…−1401,69 | 1424,05…1426,15) im `colliders`-Array |
| F3 | Innentür-Blätter (8) + Nr.-1-Haustür | Die `iap_pivot`-Blätter sind die Ausgangstüren der Kirchberg-Räume (Label „Hinaus …“, `passage`); sie schwingen beim E und fallen nach 2,2 s zu, das stehende Blatt der Messung ist die Kante des aufgeschwungenen Blatts neben der Türlücke. Die Türlücke selbst ist seit Fix 6 blockiert (5/5). Nr. 1: Spieler läuft von innen bei z −12,4 durch die Ostwand (x −47,5) hindurch, die Haustür (`door1`) liegt bei z −11,9 und ist geschlossen – dort ist in der Wand eine **Öffnung (Fenster/Tür-Netz 1,4 × 2,3 m ohne Kollision)**; nicht entschieden, ob Fenster oder Wandlücke. | `_abs/out_sub1`, `out_door2` |
| F4 | Fix 2 (Ziele am Abgrund) | Beleg: Ziel nach `weiss_gestaendnisF3()` = „Der Hohe Abgrund. Nimm Justins Hand.“ | `_abs/out_fixA` |
| F5 | Fix 4 (`hallDone`) | Beleg: Setter mit `{hallDone:true}` → `anwesen_S.hallDone = true` | `out_fixA` |
| F6 | Fix 5 (Dorfsperre beim Laden) | Beleg: mit `ZUST.geladen` setzt `k6_sperre()` kein `told.sperre`, ohne wirkt sie weiter | `_abs/out_fixB` |
| F7 | Fix 7 / K5-Gitter | Zwei übereinanderliegende „Absperrgitter“-Flächen (gruen.js Wild-Fläche 9,4 × 1,4 m, K5-Fläche 8 × 2,2 m). Jetzt löst E auf die Wild-Fläche in Kap. 5 (Beat `zaun`) `k5_gitter()` aus; ihr Label zeigt dort „Absperrgitter“ statt „Das Gitter aufbiegen“. | `out_fixA`: Strahl trifft die Wild-Fläche, E → `k5.f.gitter = true`, Endkarte „KAPITEL 5 — ENDE“, `KAP.done = 6` |

**Leistungs-Gate nach den Nachträgen F1–F7 (19:30):** `perf_gate.mjs`, Median 3 Läufe, alle Zeilen „ok“ (GATE BESTANDEN laut Ausgabe nur wenn Zeile unten steht – siehe `perf_last.json`). Rechner war durch den Stimmen-Prozess unruhig (Fremdlast 20–88 %, ein Lauf wiederholt, Lauf 3 gestört: Ladezeit 232 s): Ladezeit Median 75,4 s (Ref. 70,1; Grenze 115), Kreuzung p95 66,7 ms (Grenze 79,3), Grafikspeicher 1865–1901 MB. Wegen der Fremdlast nur eingeschränkt aussagekräftig; Vorlauf Ende 18:00 (leer): 64,6 s / 42–55 ms.
