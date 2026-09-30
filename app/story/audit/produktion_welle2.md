# Produktion Welle 2 und 3 – Arbeitspakete

Stand: 29.09.2026 · Grundlage: `app/story/story_final.md`, Block **„Produktionsplan Kapitel 1–6 (Stand 29.09.2026)“** (Abschnitte PK-0 … PK-G, im Folgenden nur „PK-…“) und `app/story/audit/meta_entwurf.md`.
Es gelten `app/story/audit/REGELN.md` (Edit-Werkzeug mit exakten Ersetzungen, Stelle vorher frisch lesen; keine Lichter zur Laufzeit; keine Allokationen im Tick; ≥ 60 FPS; nur echte Assets; nicht committen; danach `cd /c/Users/GIGABYTE/HighAbyssMira-Repo/app && node tools/assemble.js && node build.js`).

**Texte:** Alle Spieltexte stehen wortgleich im Produktionsplan. Dieses Dokument verweist mit der Beat-Nummer darauf (z. B. „Text: PK-B K5-7“). Nichts umformulieren; Tippfehler bitte melden, nicht still korrigieren.
**Zeilen:** Zeilenangaben sind „Stand 29.09.2026, 06:20“. Maßgeblich ist immer der **Anker** (zitierter Code).

---

## 0. Übersicht und Besitzrechte

Jedes Paket **besitzt** Dateien bzw. klar abgegrenzte Bereiche. Niemand ändert fremde Bereiche. Wo ein Paket etwas von einem anderen braucht, benutzt es die unten festgelegte **Schnittstelle** und prüft mit `typeof x === 'function'`, ob sie schon da ist (dann laufen alle Pakete parallel).

| Paket | Inhalt | besitzt (nur diese Bereiche ändern) | neue Dateien |
|---|---|---|---|
| **W2-P0** Kapitel-Rückgrat | `kap()`, Kapitel 5/6 im Spielstand und Menü, Recaps, Modul-Reihenfolge | `app/tools/assemble.js` (ORDER); `base` Region Speichern/Menü: `const CH_TITLE` … `function continueGame` (inkl. `const RECAP`, `function curChapter`), `$('mChap').onclick`, Menüfuß `KAPITEL 1–4`, Fallwand-Antwort `'Du bist der Ersatz, drei Tage zu spät'` (T5) | `kapitel.js` |
| **W2-P1** Kino | Kinosequenzen-Maschine + alle Shotlisten | nur neue Datei | `kino.js` |
| **W2-P2** Zeit & Glocke | Weltuhr je Kapitel, Glocke 3 + 13 | `leben.js`: `leben_bell313`, `leben_clockTick` (und nur diese) | – |
| **W2-P3** Kapitel 1 + Prolog | Kühlschrank, Tagebuch, Kap.-1-Ende mit K1, Rabe | `base` Kapitel-1-Region: Anker `'Zettel am Kühlschrank'`, `openNote('Lucys Tagebuch'`, `async function ending()`; `traum.js` (Zeile 12 + Lore) | – |
| **W2-P4** Kapitel 2 · Archiv & Zimmer 7 | Akte 06, Protokoll, Erleichterung, Zimmer 7, Einwilligungen | `base` Kapitel-2-Region: `const FILE_TEXT` (nur Eintrag `Luke`), Ordnungstafel-Erfolgszweig mit `'Vermessungsprotokoll · Sommer 2009'`, `const fuseDoor` + dessen `interact` (Schlüsselbedingung); `innen_kapitel.js` nur Anker `'Gruppenfoto · Sommerfest 2009'` | `zimmer7.js` |
| **W2-P5** Kapitel 2 · Peter, Augen zu, Finale | Feuer Pflicht, Tod ohne Biss, Lucy-Dialog, Augen zu, POV | `feuer.js` (ganz), `tod.js` (ganz), `base`: `async function finale()`, `async function scareZombieGrab`; `innen_kapitel.js` nur Abschnitt Prüfraum (Spinnenraum, x 636–646) | `augenzu.js` |
| **W2-P6** Kapitel 3 · Straße | Intro, Justin-Zeilen, Lucys Auto, Funk mit zwei Lucys, Laternen herleiten, Zählbuch, Chronik | `base` Kapitel-3-Straßenregion: `const C3_INTRO`, `chapter3Opening`, `justinArrives`, `radioPuzzle`, `broadcast`, `pressSwitch`/`wrongSwitch`/`lampsOut`, `jHint`, Chronik-Canvas (`'Lucy B., 24'`), `readBook`; Echo-Einträge `echo_kreuzung` und `echo_kanal_laterne` (nur die `lines`) | `lucy3.js` |
| **W2-P7** Kapitel 3 · Das Weiße & Ende C | Raum 1 Schrank, Raum 2 Hilde, Raum 3 (1312 + Abgrund), Wahl A/B/C, Enden | `base` Kapitel-3-Weiß-Region: `r1Items` bis `async function enterWhite` (inkl. `hildeTalks`, `room2Solved`, Raum-3-Aufbau, `room3Scene`, `showChoice`, `c3Endcard`, `endingA`, `endingB`); `innen_kapitel.js` nur Abschnitt „Das Weiße“ | – |
| **W2-P8** Kapitel 4 | Titel, Intro, Rauch, Ende mit K4, Knopf zu Kap. 5 | `anwesen.js` (ganz) | – |
| **W2-P9** Kapitel 5 | das ganze Kapitel inkl. Polaroid-Kamera | nur neue Dateien | `kapitel5.js`, `kamera.js` |
| **W2-P10** Sperren & Welttexte | Kapitel-Sperren im Ort, Welttexte | `akte.js`, `ausbau_nord.js`, `ausbau_ost_west.js`, `geheimnisse.js`, `beobachter.js`, `zayn.js`, `cleo.js`, `whiskey.js` | – |
| **W2-P11** Kapitel 6 | das ganze Kapitel, Wald-Sperren, Stille-Zonen | `hungrige.js`, `tiefwald.js`, `wald.js`, `waldleben.js`, `gruen.js` (nur Nordzaun-Lücke) | `kapitel6.js` |
| **W3-P12** Ränder | 25 Randnotizen | nur neue Datei | `raender.js` |

**Mehrere Pakete in einer Datei** (`base`, `innen_kapitel.js`): Jeder ändert nur seine Anker-Bereiche, immer mit dem Edit-Werkzeug, Stelle unmittelbar vorher frisch lesen. Neue Logik gehört bevorzugt in die neue Datei des Pakets (Funktionen der Basis sind globale Namen und dürfen dort **umhüllt/ersetzt** werden, z. B. `radioPuzzle = async function () {…}` – so macht es schon `gedanken.js`).

**Reihenfolge:** Alle Welle-2-Pakete können sofort parallel starten. W2-P0 und W2-P1 sollten zuerst fertig werden (klein). W3-P12 startet, wenn P0, P3, P4, P6, P7, P9, P11 abgenommen sind.

---

## 1. Gemeinsame Schnittstellen (verbindlich)

### 1.1 `kapitel.js` (W2-P0)
```
kap()            → 1…6   (5/6 aus KAP.n, sonst curChapter())
kapAb(n)         → kap() >= n
KAP_BEGIN[n]     → Array von Funktionen, läuft beim Start von Kapitel n (auch beim Laden eines Spielstands)
KAP_END[n]       → Array von Funktionen, läuft beim Ende von Kapitel n
kapStart(n)      → setzt KAP.n, saveFlag('ch'+n), saveGame(n), ruft KAP_BEGIN[n]
kapEnde(n)       → saveFlag('ch'+(n+1)), ruft KAP_END[n]
window.__kap     → { get: kap, set(n), start(n), ende(n) }   (Testzugriff)
```
`startChapter5()` / `startChapter6()` definieren W2-P9 bzw. W2-P11 in ihren Dateien; `continueGame` (W2-P0) ruft sie über `typeof`.

### 1.2 `kino.js` (W2-P1)
```
kino_play(id, opts?) → Promise, löst nach Ende/Überspringen auf. id ∈ 'k1','k2','k3a','k3b','k3c','k4','k5','k6'
kino_def(id, shots)  → registriert/überschreibt eine Sequenz (für Tests)
kino_busy()          → true während einer Sequenz
```
Aufrufer: P3 (k1), P5 (k2), P7 (k3a/b/c), P8 (k4), P9 (k5), P11 (k6). Jeder Aufrufer: `if (typeof kino_play === 'function') await kino_play('k…')`.

### 1.3 `augenzu.js` (W2-P5)
```
augenzu_frei(opts)  → schaltet die Taste Q für eine Szene frei. opts: { wirkt: true|false, hinweis: 'Q halten – Augen zu', onZu(), onAuf(sekunden) }
augenzu_sperre()    → Q wieder ohne Wirkung
augenzu_zu()        → true, solange Q gehalten wird und die Szene frei ist
augenzu_oeffnen()   → erzwingt „Augen auf“ (Kap. 2 Finale, Kap. 5 K5-14)
```
Bild: Schwarzblende 0,3 s (eigenes Overlay, kein Licht), Ton bleibt, leichter Tiefpass aus, Nähe-Hall (vorhandene Audio-Funktionen). Nutzer: P5 (Kap. 2), P9 (Kap. 5), P11 (Kap. 6).

### 1.4 `kamera.js` (W2-P9, nur Kap. 5)
```
kamera_frei(n)      → Kamera mit n Bildern ins Inventar ('polaroid_kamera'), Taste C
kamera_film(+n)     → Film nachlegen
kamera_ziel(fn)     → fn(camera) → { vorFoto(), nachFoto(), text, sperre?: 'weggedreht' } für die aktuelle Blickrichtung oder null
```

### 1.5 Speicherstände
Jedes neue Modul: genau ein `MOD_SAVE.push([name, holen, setzen])`, genau ein `WORLD_MODS.push`, genau ein `WORLD_TICK.push` (REGELN).

---

## 2. Pakete

### W2-P0 · Kapitel-Rückgrat
**Aufgaben**
1. `kapitel.js` mit der Schnittstelle 1.1. `MOD_SAVE.push(['kapitel', () => ({ n: KAP.n }), v => { KAP.n = v.n || 0; }])`.
2. `assemble.js` → ORDER ergänzen (einmalig für alle Pakete): `'kapitel'` direkt an den Anfang; `'kino'` direkt nach `'traum'`; `'augenzu'`, `'zimmer7'`, `'lucy3'`, `'kamera'`, `'kapitel5'`, `'kapitel6'`, `'raender'` ans Ende (nach `'feuer'`). Fehlende Dateien überspringt `assemble.js` bereits.
3. `base` `curChapter()` → `(typeof KAP !== 'undefined' && KAP.n >= 5) ? KAP.n : …bisher…`.
4. `CH_TITLE` → `{1:'Das Haus Nummer 7', 2:'Das achte Kind', 3:'Das Licht', 4:'Die Villa Seiler', 5:'Der gedeckte Tisch', 6:'Der Hungrige'}`.
5. `RECAP[5]` und `RECAP[6]`:
   - 5: `['WAS BISHER GESCHAH', 'Justin ging allein ins Weiße. Lucy ist wieder da – aber in ihren Augen ist manchmal nur Weiß.', 'In der Villa Seiler sagte eine Frauenstimme: <i>„Noch nicht, Luke. Aber bald.“</i>', 'Am Abend brennt in eurem Elternhaus Licht. Jemand deckt den Tisch.']`
   - 6: `['WAS BISHER GESCHAH', 'Am gedeckten Tisch saß nicht Lucy. Es war sie – die Kleine, mit Lucys geliehenem Gesicht.', 'Im Stall hast du den echten Luke getroffen. Mit geschlossenen Augen.', 'Er ist in die Dustwoods gelaufen. Der Wald hat kein Echo.']`
6. `continueGame`: `d.chapter === 5` → `startChapter5()`, `=== 6` → `startChapter6()` (mit `typeof`-Prüfung, sonst Kapitel 4).
7. Kapitelmenü: Knöpfe `c5`, `c6` wie `c4` (Flags `ch5`, `ch6`; Untertitel „DER ABEND · NR. 1 · DER STALL“ bzw. „DIE DUSTWOODS · DER TIEFE WALD“); Knopf `c4` „Kapitel 4 · Die Villa Seiler“; Fuß „KAPITEL 1–6“ (T22).
8. Fallwand-Antwort T5 (PK-G).
**Abnahme:** `kap()` liefert in jedem Kapitel die richtige Zahl (auch nach Laden). Menü zeigt 6 Kapitel, 5/6 gesperrt ohne Flag. Kein Syntaxfehler beim Zusammenbau. FPS unverändert.
**Test:** Schritt `kap1.js`: Spielstart (Zeilen 1–3 aus `_wl2.js`), dann `return JSON.stringify({ k: kap(), ab3: kapAb(3) })` → `{k:1, ab3:false}`. Schritt `kap5.js`: `__kap.set(5); saveGame(5); return loadSave().chapter` → `5`. Menü-Screenshot `menu.png` mit sechs Einträgen.

### W2-P1 · Kino
**Aufgaben**
1. `kino.js`: Maschine nach PK-F „Technik“, Letterbox über vorhandenes `traum_css()` (#traumBars, `body.cine`); `setCamOverride`; Überspringen (Klick/Leertaste; bei `k2` und `k5` erst nach 3 s); Untertitel per `subtitle`; Karten auf Schwarz über `#fade` + eigenes Textfeld (Georgia, wie Kapitel-Intros).
2. Alle acht Sequenzen als Daten nach PK-F (Kameras, Zeiten, Zeilen, Geräusche). Vorbereitende Objekte (Polaroid-Blatt Zayn, Flammen-Sprite im Villafenster, Silhouetten-Figuren, Hirschding-Silhouette) **beim Laden** anlegen und unsichtbar halten; Sprites/Meshes ohne Licht dürfen umgeschaltet werden, Lichter nicht.
3. Figuren aus `figuren_load(id)` (bereits gecacht) klonen, nie während einer Sequenz laden: beim Laden vorwärmen.
**Abnahme:** jede Sequenz 20–45 s, ≥ 60 FPS über die ganze Dauer (Messanzeige F3), kein Ruckler an Schnitten, Luke nie von vorn, Überspringen funktioniert, danach sind HUD, Nebel, Kamera exakt wie vorher.
**Test:** je Sequenz ein Schritt `kino_k1.js` … `kino_k6.js`: `await kino_play('k1'); return 'ok'` mit Screenshots bei 3 Zeitpunkten (`await W(ms)` zwischen den Aufnahmen); Kontaktbogen `kino.png` per `_sheet.py`.

### W2-P2 · Zeit & Glocke
**Aufgaben**
1. `leben_clockTick`: Startzeit und Glockenplan je `kap()` nach PK-G G-1 (Tabelle `LEBEN_UHR` beim Laden). Kap. 1: Start 23:04, 00:00 zwölf Schläge, 01:00 dreizehn Schläge, Uhr steht ab `state.outage`. Kap. 3: einmal 3 + 13 (aufgerufen von P6 über `leben_bell3plus13()`), sonst keine Schläge. Kap. 4–6 gewöhnliche Stundenschläge. Sprünge (Kap. 5) über neue Funktion `leben_uhr(hh, mm)` (P9 ruft sie).
2. `leben_bell313` durch `leben_bell3plus13()` ersetzen (T10), alte Untertitel entfernen.
**Abnahme:** In Kap. 1 schlägt es nie mehr um 03:00/03:13; um 01:00 dreizehnmal. In Kap. 3 genau einmal 3 + 13. Keine Allokationen im Tick.
**Test:** `uhr1.js`: `leben_S.clk.min = 23*60+59; await W(26000); return leben_S.clk.min` und Konsole auf 12 Schläge prüfen; `uhr3.js`: `__kap.set(3); leben_bell3plus13(); await W(60000)` → 16 Schläge gezählt (Zähler im Test um `leben_bellStrike` legen).

### W2-P3 · Kapitel 1 + Prolog
**Aufgaben**
1. Kühlschrankzettel T8 (PK-G). Code-Herleitung: Kellertastenfeld, nach drei Fehlversuchen Hinweis „Der Kalender weiß den Tag.“ (vorhandene Fehlversuch-Logik erweitern).
2. Tagebuch HASENBROT T11.
3. `ending()` SEAMLESS-Zweig: nach dem Weißblitz `kino_play('k1')` statt der beiden Untertitel; danach `setMain(7)` wie bisher. Ortsschild-Textur „210“ (in K1 getauscht, danach bleibt sie).
4. UFO-Kegel in Kap. 1 (Kanon Beat 8): im Lichtkegel flackert es wie eine Kerze (Intensitätsschwankung am vorhandenen Spot, **kein** neues Licht) und es raschelt Papier (Geräusch, leise, nur wenn Luke im Kegel steht).
5. `traum.js` T9 (Zeile 12 und Lore).
**Abnahme:** Kellercode nicht mehr aus dem Zettel ablesbar, aber fair (Tasten + Kalender). K1 läuft nach Hilde im Strahl, danach nahtlos weiter. Rabe sagt „Die Eltern vor dem, was sie unterschrieben haben.“
**Test:** `k1_zettel.js`: Notiz öffnen (`openNote` abfangen) und Text prüfen; `k1_ende.js`: `ending()` aufrufen, Screenshots bei 3 s / 20 s / 34 s.

### W2-P4 · Kapitel 2 · Archiv & Zimmer 7
**Aufgaben**
1. Akte 06 (T2), Vermessungsprotokoll (T3, Text PK-D K2-2) inkl. Erleichterungs-Zeilen und Gedanke nach 90 s.
2. Schlüssellogik: Archivschublade → Schlüssel `zimmer7`; Sicherungsraum-Tür (`fuseDoor`) öffnet nur mit Schlüssel `sicherung` aus Zimmer 7. Amt-Uhr-Zeiten PK-D (über `ch2`-Hooks; Anzeige nur, wo Bahnhofsuhren existieren).
3. `zimmer7.js`: Raum x 630–636, z −2608…−2602 (`c2Room`, Öffnung Süd im Durchgang bei X + 33, Breite 1,2; `makeDoor`, verschlossen); Einrichtung nur Scans (`metaltable`, `chair`, `shelf`, Tasse/Losurne/Dienstbuch als geholte Scans – siehe Assets); Wandflächen/Böden mit vorhandenen Megascans-Materialien wie in `innen_kapitel.js`. Schreibtischlampe: Licht beim Laden mit Intensität 0, bei Kapitel-2-Beginn hochsetzen. Fundstücke 1–5 und Nachhall nach PK-D K2-3 (Texte wortgleich); Gegenstand `einwilligungen` („Einwilligungen 2009“, im Inventar lesbar, Beschreibung = Tabelle). Nadeldrucker-Zeile. Lore-Einträge `z7_urne`, `z7_dienstbuch`, `z7_aushang`, `z7_gruendung` (letzter zählt für Ende C).
4. Gruppenfoto-Rückseite (innen_kapitel.js, Anker `'Gruppenfoto · Sommerfest 2009'`) → „Belegfoto. Partner anwesend. Auswahl bestätigt.“
**Abnahme:** Ohne Zimmer 7 kein Strom; Zimmer 7 braucht die Ordnungstafel. „Das bin nicht ich“ kommt vor Zimmer 7. Aushang als Gegenstand in Kap. 3 lesbar. Keine Primitiv-Möbel.
**Assets zu holen:** Losurne/Holzkasten mit Schlitz, Holzkugeln (verkohlt: Material), Dienstbuch/Notizbuch (Leinen), Keramiktasse, Strickjacke (Kleidungs-Scan, notfalls weglassen).
**Test:** `z7_weg.js`: `startChapter2()`, Tafel über `ch2.slots = [...]` lösen, Schublade, Tür Zimmer 7, Aushang nehmen → `story.items.includes('einwilligungen')`; Screenshots Zimmer 7 aus zwei Winkeln.

### W2-P5 · Kapitel 2 · Peter, Augen zu, Finale
**Aufgaben**
1. `augenzu.js` (Schnittstelle 1.3).
2. Prüfraum als Zelle (innen_kapitel.js, Abschnitt Prüfraum): Schilder, Kratzspuren „ICH WEISS ES JETZT“, Strichliste, Tafel Original/Rückkehrer (erst nach dem Schwarm lesbar), Fluchtplan-Schild – alles Decals/Papier (PK-D K2-4).
3. `feuer.js`: `spiderDoorOut` erst nach dem Feuerzeug entriegeln; Aufgabe „Die Matratze. Da glänzt was.“ nach 20 s. `chaseDoor` ist zu Beginn der Jagd geschlossen und verriegelt (Text „Notentriegelung nur bei Brandalarm“); den Zweig „Ohne Zünden durch die offene Tür“ entfernen. Brandalarm → Notentriegelung wie bisher.
4. `tod.js` T23: Zahn-Mann-Tod als Umarmung und Ersticken (keine `TOD_SND.bite`, keine Biss-Stöße, keine Blutbild-Überlagerung; Herz langsamer, Bild läuft zu, „Bruder.“ bleibt), Kopfkommentar anpassen. `scareZombieGrab` in `base` entsprechend ohne Biss-Andeutung.
5. `finale()`: Dialog mit Auswahl (PK-D K2-7) inkl. Peter-Frage; danach Augen-zu-Szene mit `augenzu_frei({ wirkt:false })`, „Das hilft bei dir nicht, Bruder …“, `augenzu_oeffnen()`, `kino_play('k2')`; danach der vorhandene SEAMLESS-Ablauf („Der Tank ist leer“).
**Abnahme:** Es gibt keinen Weg in den Messraum ohne Feuer. Peter beißt nie. Q wird im Finale eingeblendet und wirkt nicht. Keine Lichter zur Laufzeit neu.
**Test:** `p5_tuer.js`: Gang ohne Fass durchlaufen (`player.pos.x = X+107`) → Tür bleibt zu; `p5_tod.js`: `ch2.chase='run'`, Zombie an den Spieler → Todesbildschirm, Konsole ohne `bite`; `p5_finale.js`: `safeOpens()`, Akte 08, Dialog durchklicken, Screenshots POV-Anfang von K2.

### W2-P6 · Kapitel 3 · Straße
**Aufgaben**
1. `C3_INTRO` und `chapter3Opening` (PK-C K3-1), Glocke über `leben_bell3plus13()`.
2. `justinArrives` Zeilen (K3-2, T6). `jHint`: keine Zahlen mehr (K3-5).
3. `lucy3.js`: Lucys Auto (K3-3) – Motor-Ton, Radio, Heckscheiben-Decals „GROSSER“ / „HASEN…“, blaue Kreispfeile (Decals) zum Funkkasten, zwei Untersuchungsstellen.
4. Funk (K3-4): `radioPuzzle`/`broadcast` ersetzen (in `lucy3.js` per Neuzuweisung): Frequenz bleibt 31,10; neues Fenster mit Kanal A/B, drei Fragen, „In den Staub schreiben“ (Wortauswahl) + „An Kanal A/B senden“; Erfolg/Fehlschlag und Hilfeleiter wortgleich. Lore `c3funk` neuer Text „Zwei Lucys“. `ch3.radio = true` erst nach Erfolg.
5. Laternen (K3-5): Aufgabe ohne Zahlen; `wrongSwitch`-Text; Hilfe nach 1./2./3. Fehlschlag; Unterschriften-Nachhall je Haus (vorhandenes Echo-System, 3 s, eine Zeile). Brunnen „Hasen … Hasen …“ ist P10 (`ausbau_ost_west.js`).
6. T1 (Chronik 26), T4 (Zählbuch, Aufgabe ohne Zahl), T17 (Kanalstadt-Zeile), T18 (Echo Kreuzung).
**Abnahme:** Die Laternenfolge steht in keinem Text mehr wörtlich; sie ist aus Zählbuch + Einwilligungen herleitbar. HASENBROT an B löst; alles andere scheitert fair. Lucy ist hörbar und sichtbar anwesend.
**Test:** `p6_funk.js`: `chapter3Begin(); ch3.met=true; radioPuzzle()`, Knöpfe per DOM klicken (Frequenz setzen, Fragen, HASENBROT, Kanal B) → `ch3.radio===true`; `p6_falsch.js`: HASENBROT an A → Laternen flackern, `ch3.radio===false`; `p6_laternen.js`: `pressSwitch` in 5-3-1-7 → `ch3.lampsOff`. Text-Scan: `document.body.innerHTML` / alle `say`-Aufrufe auf „fünf – drei – eins – sieben“ prüfen → darf nicht vorkommen.

### W2-P7 · Kapitel 3 · Das Weiße & Ende C
**Aufgaben**
1. Raum 1: Schrank mit Atmen, leer beim Hinsehen, Justins Zeile (K3-6).
2. Raum 2: `hildeTalks` als Auswahl (K3-7), `room2Solved` ohne Geständnis (T7).
3. Raum 3 Teil 1 „Die Nacht von 1312“ (K3-8): Aufbau beim Laden unsichtbar; Birken-Scans, Reif-Decal, Flammen-Sprites, sieben Nachhall-Kinder mit `lantern2`, Nachhall-Klon des Justin-Modells, Spur-Decals (Stiefel, Hufe, Kinderfüße); fünf Untersuchungsstellen und Auswahl „Was lügt?“; Geständnis; Lore `c3_1312` (Versteck-Hinweis).
4. Raum 3 Teil 2 (K3-9): Weißblende, Stühle, flackernde Lucy, Papierlaterne (Modell, nur Emissive), die acht Schläge, „Blitze durch Lukes Augen“ (drei Kamera-Schnitte, 0,3 s), Helm-Szene von hinten mit Spiegelung im Visier, Zusatzzeilen inkl. Peter.
5. `showChoice` → „Was will sie?“ mit A/B/(C); C nur mit ≥ 3 Versteck-Hinweisen: `c3_1312` (automatisch) + zwei aus `geh_versteck`, `echo_kanal_laterne`, `nord_suehnekreuz` (mit neuer Zeile, P10), `c3_hilde_versteck` (Hildes Frage gewählt), `z7_gruendung` (P4). Ende C (Szene + Endkarte K3-10). `kino_play('k3a'|'k3b'|'k3c')` vor der jeweiligen Endkarte. `ch3.choice = 'C'` setzen (P8 liest das für den Knopftext).
**Abnahme:** Justins Geständnis nur nach gelöstem Fußspuren-Rätsel. Ende C erscheint mit genau den festgelegten Hinweisen, sonst nicht. Kein neues Licht in Raum 3.
**Assets zu holen:** Birke, Papierlaterne/Lampion mit Bambusrippen, Schwert (falls nicht aus dem Paladin-Modell trennbar).
**Test:** `p7_raum3.js`: `enterWhite()`, Räume per Flags überspringen (`ch3.room1=ch3.room2=true`), Spuren-Auswahl falsch/richtig; `p7_endec.js`: Lore mit zwei Hinweisen füllen → `showChoice()` → Knopf C vorhanden; ohne → nicht vorhanden. Screenshots Laterne, Helm-Szene.

### W2-P8 · Kapitel 4
**Aufgaben** (PK-H): Titel „Die Villa Seiler“ (Intro, Endkarte), neue Intro-Tafel, Rauch am Gully (Partikel, beim Laden angelegt), Gedanke, Weltuhr-Start über P2, Ende: `kino_play('k4')` → Endkarte → Knopf „WEITER · KAPITEL 5 · DER GEDECKTE TISCH“ (`kapEnde(4)`, dann `startChapter5` mit `typeof`). `c3Endcard`-Hülle: Knopftext „(setzt Ende B fort)“ für `ch3.choice` A **und** C.
**Abnahme:** Kap. 4 endet nicht mehr im Hauptmenü, sondern führt zu Kap. 5.
**Test:** `p8_ende.js`: `__anw.startChapter4()`, `anwesen_S.seen.add('brief'); anwesen_S.seen.add('bild'); __anw.hallEnd()` → nach K4 Endkarte mit Knopf „KAPITEL 5“.

### W2-P9 · Kapitel 5 · Der gedeckte Tisch
**Aufgaben**
1. `kapitel5.js`: `startChapter5()` (Kapitel-3/4-Zustände wie `startChapter4` herstellen, `kapStart(5)`, Intro K5-0), alle Beats K5-1 … K5-17 in einer Zustandsmaschine (`k5.beat`), Aufgabentexte, Speicherpunkte SP5-1…7 (über das vorhandene Speicherpunkt-System in `tod.js`: `todCheckpoint`), Todesart `tisch` (über `TOD_ANIM`/`TOD_LINES` erweitern, **ohne `tod.js` zu ändern**: `TOD_ANIM.tisch = …` in `kapitel5.js`), `MOD_SAVE ['kapitel5']`.
2. Figuren: `lucy_erw` (Fenster Nr. 3, Küchenfenster, Heimkehrerin, Kreuzung, Friedhof mit Laterne), `luke_echt` (Stalltür, Grab), `graue`/`kleine`, `gezaehlt_j/_m` ×5, `vegas` (Türspalt – Technik aus `albers.js` nachnutzen, nicht ändern), `mama` als Nachhall (Schleife Runde 2). Alle beim Laden klonen und verstecken.
3. Nr. 1 (Objekte aus `innen_ort.js` **suchen, nicht die Datei ändern**): Laken ausblenden, Küchen-/Wohnzimmerlicht beim Laden mit 0 anlegen, Tisch mit vier Gedecken (geholte Scans + vorhandene Stühle), Decals (Fußspuren, HASENBROT, Gras), Familienfoto-Texturen (drei Stufen, aus der vorhandenen Textur per Canvas abgeleitet), Milchzahn vom Kissen entfernen, Spieluhr als Gegenstand, Kommoden-Filmpack.
4. Schleife (K5-8): Schwellenlinie z −17,0 (x −55,8…−50,1) → Versetzen an die Wohnzimmer-Küchen-Tür ohne Schnitt; Rundenzähler; Veränderungen je Runde; Runde 3 mit Atem hinter dem Spieler und 6-s-Fenster.
5. `kamera.js` (Schnittstelle 1.4): Heben (C), Auslösen (Klick), Blitz, Rendern in eine Textur (Technik `zayn_takePhotos`: 400×300, einmal, im Blitz-Frame), Polaroid-Einblendung mit 4 s Entwicklung; Sonderfotos: Lucy mit grauer Hand, Küchenfenster mit Mädchen, Flur mit der Grauen; Sperre „weggedreht“ am Tisch.
6. Stall (K5-13): Brett, Teller, Kreidestriche, „AUGEN ZU“, Brot ablegen, `augenzu_frei({ wirkt:true })`, Dialog auf schwarzem Bild, Abbruch bei zu frühem Öffnen, K5-14 mit `augenzu_oeffnen()`, „DU + ICH“-Decal.
7. Dem Tappen nach (K5-15): Tonquelle, die dem Spieler auf einem vorgegebenen Pfad vorausläuft (Schrebergärten → Villa-Tor → Kirchweg), danach Zeitsprung über `leben_uhr(23, 0)` und elf Schläge.
8. Grab (K5-16): Gezählte mit Ochs-am-Berg-Bewegung (vorhandene Logik der Grauen als Vorbild), „Pust.“-Sperre für Taschenlampe (über `state.flashFail`/eigene Sperre, nach Lösung aufheben) und Feuerzeug, Kerze anzünden (Flammen-Sprite, gelb → weiß-kalt → gelb → aus), Villafenster-Flamme (Sprite im Dachfenster −125 / 8 / 66, beim Laden angelegt), Flucht des Jungen zur Nordzaun-Lücke; kindgroße Lücke unter dem Gitter ist ab Kap. 5 sichtbar (Decal/Aufbiegung – Gitter selbst gehört P11, Absprache: P11 legt ein Objekt `gruen_S.dustBarrier` an, P9 nur Blick/Text).
9. K5-17, `kino_play('k5')`, Endkarte, `kapEnde(5)`, Knopf „WEITER · KAPITEL 6 · DER HUNGRIGE“.
10. Jonas' Briefe (K5-3), Filme in Hildes Laube (−114 / 24).
**Abnahme:** Kapitel ohne Sackgasse durchspielbar (Film-Absicherung, Kerze und Feuerzeug Pflichtbesitz). Die Graue und die Gezählten töten nicht; Tod nur durch Essen. ≥ 60 FPS in Nr. 1 und am Friedhof mit allen Figuren. Keine Lichter zur Laufzeit angelegt.
**Assets zu holen:** Sofortbildkamera, Essteller ×3, Kinderteller, Zinnbecher, Besteck, Brot/Kanten (siehe PK-B „Assets“).
**Test:** `k5_start.js` (`startChapter5()`, Screenshot Veranda); `k5_foto.js` (Kamera frei, Blick auf Lucy, Auslösen → Polaroid-Overlay vorhanden); `k5_tisch.js` (Setzen, „essen“ → Todesbildschirm `tisch`); `k5_schleife.js` (drei Mal Schwelle überschreiten, Runde 3, Foto → `k5.beat === 'spieluhr'`); `k5_stall.js` (Q simuliert gehalten über `keys.KeyQ = true` → Dialog läuft; loslassen → Abbruch); `k5_grab.js` (Kerze anzünden → Villafenster-Sprite sichtbar, `k5.beat === 'zaun'`); Kontaktbogen.

### W2-P10 · Sperren & Welttexte
**Aufgaben** (Tabelle PK-A und Texte PK-G)
1. `akte.js`: Liegen ab Kapitel je A14–A20 (`kapAb`), Akte 8 an die Oststraßensperre (144,2 / 1,2 / 4,1).
2. `ausbau_nord.js`: Gedenkfeld-Echo nur ab Kap. 5 und Text T12; Peters Grab ab Kap. 4 Text nach PK-D K2-6; Sühnekreuz T16; Gedanke „Paragraf vier …“ (T20) wenn `einwilligungen` vorhanden.
3. `ausbau_ost_west.js`: Heft-Seiten (Vogelscheuche, Schuppen, Heft im Heu) nur ab Kap. 5, Jacke bleibt; Kassette T13; Brunnen ab Kap. 3 „Hasen … Hasen …“ (Kap. 1–2 unverändert).
4. `geheimnisse.js`: Lichtsteine ab Kap. 3; T14 (beide Notizen).
5. `beobachter.js`: A27–A30, T15.
6. `zayn.js`: Schritte 3–5 ab Kap. 6, Gedanke am Absperrgitter (A10). `cleo.js`: Baumhaus ab Kap. 6. `whiskey.js`: Station `waldrand` ab Kap. 6.
**Abnahme:** In Kap. 1 ist keiner der Spoiler aus Story-Bibel §11 Nr. 2 mehr erreichbar. Alle Texte wortgleich.
**Test:** `p10_k1.js`: Spielstart, dann per Teleport jeden Ort aus PK-A abgehen und prüfen, dass `interactables` dort keine gesperrten Objekte enthält (Liste im Test); `p10_k5.js`: `__kap.set(5)` → Gedenkfeld-Echo angelegt, Heft-Seiten vorhanden.

### W2-P11 · Kapitel 6 · Der Hungrige
**Aufgaben**
1. `gruen.js`: Absperrgitter an der Nordzaun-Lücke (A1), Objekt `gruen_S.dustBarrier`; ab Kap. 6 „Das Gitter aufbiegen (E halten)“ (Muster: Gitter im Amt), danach offen.
2. `wald.js`, `waldleben.js`, `tiefwald.js`, `hungrige.js`: Ticks und Ereignisse erst ab Kap. 6 (A2–A6); in Kap. 1–5 Wald-Blöcke unsichtbar.
3. `kapitel6.js`: `startChapter6()`, Intro, Hauptaufgaben und Akte nach PK-E, Brotkrumen-Decals, Hütten-Spuren, Handabdrücke an Wollbäumen, Speicherpunkte SP6-1…5, Stille-Zonen (r 25 Fraßstelle, r 15 Hochsitz-Nackte, r 15 Bus-Wolf, r 30 Bau: Tierlaute aus, Wind 20 %, kein Hall, Übergang 3 s; Werte vorab, keine Allokation), Epilog am Hochsitz mit `augenzu_frei({ wirkt:true })` und Dialog, `kino_play('k6')`, Endkarte, `kapEnde(6)`.
4. `hungrige.js`: Stufen 1–3 nur `wald_in`, 4–9 nur `tief_in`; `spuren` Pflicht auf dem Weg; Finale: Lampe stirbt, Feuerzeug (Taste E, Flammen-Sprite, Licht beim Laden mit 0), Zeile `:273` ersetzen, Popup `:281` entfernen, Aufgabe „Whiskey fliegt voraus. Folge ihm.“, Whiskey fliegt zum Hochsitz (vorhandene `whiskey_fly`). `d_zugesehen`-Freigabe nach dem Epilog (Flag `hungrige_S.epilog`, P10 liest es).
**Abnahme:** In Kap. 1–5 ist der Wald nicht betretbar und kostet keine Leistung. In Kap. 6 lebt der Wald außerhalb der Stille-Zonen hörbar. Kein Justin-Zitat vor Kap. 3 möglich. ≥ 60 FPS im tiefen Wald und im Finale.
**Test:** `p11_sperre.js`: Kap. 1, Teleport an die Lücke → Kollision/Gitter, `wald_S.inside` bleibt false; `p11_start.js`: `startChapter6()`, Gitter aufbiegen; `p11_stille.js`: Teleport zur Fraßstelle → Tierlaut-Lautstärke 0; `p11_finale.js`: `__hungrige.S.done` vorbelegen, Bau betreten → Feuerzeug-Aufforderung, zwei Raben, danach Aufgabe Epilog; Kontaktbogen.

---

## 3. Welle 3

### W3-P12 · Ränder (`raender.js`)
**Grundlage:** `app/story/audit/meta_entwurf.md` (25 Notizen, Regeln Abschnitt 3).
**Aufgaben**
1. Datentabelle der 25 Notizen (Nummer, Kapitel, Phase, Papier, Technik, Ort, Auslöser-Funktion, Text).
2. Papier-Texturen A–H beim Laden per Canvas; Notiz-Meshes klein (Postkarten- bis Zettelgröße, flach, `noCol`), am Ort beim Laden angelegt und unsichtbar; Büroklammer-Glanz (T1) über ein kleines additives Sprite, dessen Deckkraft nur aus Taschenlampenrichtung, Abstand ≤ 2,5 m und Streifwinkel ≤ 25° folgt (Werte je Notiz vorberechnet, Prüfung alle 0,25 s, keine Allokation).
3. Techniken T2–T5 über Zustandsabfragen bestehender Flags (Liste pro Notiz in `meta_entwurf.md`).
4. Phasen-Sperre und Kapitel-Mindeststand (`kapAb`).
5. Leseansicht: `openNote` mit eigener Schrift je Papierart; Ton `Audio.paper`; keine Lore, keine Gegenstände.
6. Tagebuch-Reiter „RÄNDER“: `renderJournal` umhüllen; Reiter erst ab drei Funden; keine Gesamtzahl, keine Platzhalter.
7. `MOD_SAVE.push(['raender', () => ({ found: [...], read: [...] }), v => …])`; keine Zeitstempel.
8. #25 nach Schließen der Endkarte von Kap. 6, nur bei 24/24.
**Abnahme:** Jede Notiz ist im jeweiligen Build-Zustand wörtlich wahr (Spalte „stimmt, weil“ abhaken). Kein Zugriff auf Systemzeit, Benutzer, Dateien. Nichts blockiert, nichts belohnt. Reiter ohne Gesamtzahl. ≥ 60 FPS.
**Test:** `r_glanz.js`: Teleport vor den Ortsschild-Pfosten (−71 / 0 / 5,6), Lampe an, Blick flach → Glanz-Deckkraft > 0; steil → 0; `r_phase.js`: Notizen 1–2 als gefunden setzen → #5 liegt aus, vorher nicht; `r_reiter.js`: 2 Funde → kein Reiter, 3 → Reiter, Text enthält kein „/ 25“; `r_save.js`: speichern/laden → Funde erhalten, `story.lore` unverändert.

---

## 4. Endabnahme Welle 2 (alle Pakete zusammen)

Ein Durchlauf **Kapitel 1 → 6** im Testprofil mit Stichproben-Screenshots je Beat und Konsolenprüfung (keine Fehler, keine Warnungen aus neuen Modulen), plus:
- Spoiler-Prüfung: In Kap. 1 sind Akte 5/6/8/9, Gedenkfeld-Echo, Heft im Heu, Wald, Hungriger, Lichtsteine nicht erreichbar.
- Zeitprüfung: kein 03:13-Glockenschlag außer Kap. 3; Weltuhr je Kapitel nach G-1.
- Text-Scan über alle Module: „Lucy B., 24“, „drei Tage zu spät“, „spuckt mich aus“, „wirft es mich“, „Rüstung eines Kindes“, „FÜNF. DREI. EINS. SIEBEN“, „Der Ritter vor seinem Kind“, „Von morgen“ dürfen nicht mehr vorkommen.
- Leistung: F3-Messanzeige in Nr. 1 (Kap. 5), Friedhof (Kap. 5), Raum 3 (Kap. 3), tiefer Wald (Kap. 6) jeweils ≥ 60 FPS.
- Nach jedem Kapitel läuft genau eine Kinosequenz, danach Endkarte/Übergang.
