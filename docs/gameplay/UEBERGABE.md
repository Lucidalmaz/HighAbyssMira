# ÜBERGABE an eine neue Claude-Sitzung – Stand 02.10.2026

Zuerst lesen: `CLAUDE.md` (Regeln des Nutzers), diese Datei, dann `app/story/audit/F3_extras.md` (alle Nutzerwünsche R-1 … R-28 wörtlich) und
`app/story/audit/F3_uebergaben.md` / `F3_stand_*.md` (je ein Stand pro Arbeitspaket). **Antworten an den Nutzer immer auf Deutsch.**

## 1. Gesamtstand in einem Absatz
High Abyss Mira (deutsches Ego-Horror-Mystery-Spiel, Three.js r170 + Electron) ist inhaltlich fertig: Kapitel 1–6, alle 27 Arbeitspakete (AP) gebaut,
Story-Kanon Version 3 (`app/story/story_final.md`), Story-Überarbeitung A und B eingearbeitet. Eine **spielbare Beta-Testversion Kapitel 1–6** liegt auf dem
Desktop (`High Abyss Mira (Testversion).lnk` → `C:\Users\GIGABYTE\Spiele\High Abyss Mira - Testversion Kap 1-6\`), gebaut aus Commit `9c174cb` (+ Stimmen-Modul
`a46785f`, ohne Stimmen im Spiel). Danach kamen **Regen (cffdcfa, im Quellstand, noch nicht im Desktop-Bau)**. **Nicht erreicht: 60 FPS** (gemessen 25–37 FPS
draußen, 16 an der Kreuzung, CPU-gebunden im JS-Hauptthread). Das Spiel wird bewusst erst am Ende **einmal** gebaut und getestet (Nutzerentscheidung).

## 2. Arbeitsregeln (nichts unnötig umbauen)
- `app/mods/*.js` → `app/tools/assemble.js` (ORDER-Liste) → `game/index.html`. **`game/index.html` nie von Hand ändern.** Basis: `app/mods/_base_source_index.html`.
  Je Modul genau ein `WORLD_MODS.push` und ein `WORLD_TICK.push`. Ein `//`-Kommentar mitten in einer Zeile verschluckt den Rest der Zeile.
- Tests nur mit dem echten Bau: in `app/` `node tools/assemble.js && node build.js`, dann `bash /c/Users/GIGABYTE/_game_run.sh <steps.json> <out>`
  (Ergebnis `<out>/steps.json`; FPS-Route-Vorlage `C:\Users\GIGABYTE\_int1_steps.json`). **Nie `--root=game`** (fehlen Vendor/KTX → „Couldn't load texture blob“).
  Parallele Tests: `_testgate.sh` (Sperre `C:\Users\GIGABYTE\_testgate.lock`; bei hängender Sperre Ordner löschen). Vor jedem Test: keine fremden `electron.exe` laufen lassen.
- Release: `npm run release` (in `app/`; `HAM_TESTSTAND=6` setzt das Ende der Testversion hinter Kapitel 6) → `app/dist/High Abyss Mira-win32-x64`; danach per
  `robocopy /MIR` nach `C:\Users\GIGABYTE\Spiele\High Abyss Mira - Testversion Kap 1-6` und Desktop-Verknüpfung. `assemble --release` entfernt alle `window.__*`-Testzugriffe;
  neue Testzugriffe dürfen nur als Zuweisung im Testzugriff-Objekt stehen (Release-Prüfung `tools/release_check.mjs`), sonst scheitert der Bau.
- Keine Zwischenversionen mehr (Nutzer), Spieltest und Leistungsdurchgang **einmal am Ende**. Kontingent sparen, wenige gezielte Läufe.
- Assets: nur kostenlose Fab/Megascans (Nutzer meldet sich selbst an, **nie Zugangsdaten eingeben**), nur CC0/CC-BY (Nachweise in `CREDITS.md`), keine selbstgebauten
  Primitiv-Objekte. Der Nutzer wollte Modelle so verändern, dass „keiner erkennt, von wem“ – das habe ich **abgelehnt** (Herkunftsverschleierung); legitim verbessern
  und lizenzproblematische Assets ersetzen ist erlaubt (Audit: `docs/technical/lizenzen_release.md`).
- Nutzer hat entschieden: „nimm immer die Option, die du empfehlen würdest“ → Entscheidungen selbst treffen, in den Notizen dokumentieren und gesammelt berichten.
- Systemeinstellungen von Windows nie selbst ändern (Nutzer hat „Beste Leistung“ selbst gesetzt).

## 3. Fertig und im Quellstand (Branch `claude/wonderful-wozniak-twn7nr`)
Kapitel 1–6 + Nebenaufgaben, Qualitätssysteme (Gesichter 33 Figuren, Kreaturen, Beobachter-Neubau, Kino/QTE, Fenster/Türspione, Bewuchs, Umwelt, Grafik/UI/Schriften,
Ziele-System, Raumklang, Menü R-20, Hervorhebung, Hände, Zeichen), Lizenz-Ersatz (Epic-Mannequin, Justin-Animationen), Story A/B, Untertitel-Warteschlange (`subtitle()` reiht ein,
`subShow()` zeigt an; längere Lesezeit), Regen `regen.js` (R-24, Commit cffdcfa, geprüft: 0 Fehler, FPS ≈ gleich), Stimmen-Modul `stimmen.js` (aktiv, aber ohne Aufnahmen).
Die Testversion auf dem Desktop enthält **noch nicht** den neuen Regen und nicht die Leistungs-Zusatzmaßnahmen.

## 4. ANGEFANGEN, aber nicht abgeschlossen – nichts davon verwerfen
Alle drei Gruppen sind **gesichert** (Branches/Commits unten). Reihenfolge der Weiterarbeit: 4.1 → 4.2 → 4.3 → 4.4 → 4.5 → 4.6.

### 4.1 Leistung 60 FPS (Agent „Perf“, Fable) – Branch `wip/uebergabe-2026-10-02` (Commit „WIP-Sicherung (Übergabe)“)
- **Datei:** `app/mods/leistung.js` (nur diese). Neu darin, **ungemessen, ungetestet im Spiel** (Syntax ok, Zusammenbau ok):
  - 11) statisches Zusammenfassen fester, undurchsichtiger Einzelteile je Eltern+Material → ein Netz (Originale bleiben unsichtbar für Strahltests/Logik); erwartet 150–220 Zeichenaufrufe weniger (+8–12 %);
  - 12) durchsichtige beidseitige Materialien sofort einpassig (kein needsUpdate-Sturm);
  - 13) Texturen-Vorladen (eine je Bild). Testzugriff `window.__leistung.MRG / .TXQ`.
- **Fehlerfund des Agenten:** Basis setzt `Mesh.prototype.raycast` später asynchron auf three-mesh-bvh → Vergleich per `hasOwnProperty` (schon behoben).
- **Nächster Schritt:** Zweig-Stand in die Hauptlinie holen (`git checkout wip/uebergabe-2026-10-02 -- app/mods/leistung.js`), bauen, `_lst2_steps.json` laufen lassen
  (`cd C:\Users\GIGABYTE && bash _game_run.sh _lst2_steps.json _lst2`; Auswertung der `ab_*`-Schritte; Bildvergleich `pxdiff.py` – im Scratchpad der alten Sitzung, falls weg: Screenshots
  `px_<ort>_an/_aus/_an2` vergleichen). Nur committen, wenn messbar schneller **und** Bild gleich (Risiko: Module, die ein zusammengefasstes Original später klonen → Klon unsichtbar).
- **Erkenntnisse (nicht wiederholen):** Materialien zusammenlegen bringt nur −0,1…+2,6 %. Lichtpool 18→10 bringt CPU nichts (Last im JS-Thread, nicht GPU). BatchedMesh war langsamer.
  Leeres Bild kostet ≈ 14 ms (Matrizen 14 %, projectObject 10 %, Auslesen 6 %, Takte 10 %) → 60 FPS nur mit zusätzlichen Hebeln: Gesichtsteile der CC-Figuren zusammenfassen
  (20–30 Aufrufe je Figur), Körper-LOD, Animationen/Takte außerhalb des Blicks weiter drosseln, kalte Ladezeit (220–246 s) senken. Zudem: Ankunft an Kreuzung/Nr. 7 → CPU-Profil
  beim ersten Betreten (`"profile": 5000` im Schritt nach `__at`).
- Messwerte letzter Lauf (Desktop-Stand): Ortstafel 24,5 · Straße Ost 26,7 · Kreuzung 15,7 · Kreuzung Nord 37,2 · Nr. 7 innen 8,1 (erstes Betreten) · Lampe an 30,0 FPS.
- `F3_stand_leistung.md` ist **noch nicht** um Abschnitte 11–13 und die verworfenen Hebel fortgeschrieben (das ist Teil des nächsten Schritts).

### 4.2 Atem R-26 (Agent „Atem“, Fable) – gleicher Branch, Datei `app/mods/umwelt.js`
- Nutzer: Atemhauch „immer noch zu generisch und störend“ – soll organisch/realistisch/hochwertig sein. Neu (Syntax ok, **Test lief teilweise**, Bilder in `C:\Users\GIGABYTE\_game_atem`, `_game_atem2`
  `atem02/06/12/20.png`, `atem_lauf.png`, `dunkel.png`, `pos.png` – **noch nicht von mir angesehen/bewertet**):
  Raymarch-Volumen statt Punkte-Ring: je Atemzug ein Billboard-Quad, Fragment-Shader marschiert 14 Schritte durch sechs CPU-simulierte Ballen (Bremsen, Auftrieb, Wind, Turbulenz),
  erzeugte 3D-Rauschtextur 32³ (keine geladene Textur), Zerfasern über Schwellwert, Laternen-Vorwärtsstreuung, drei Plätze für Überlappung.
- **Nächster Schritt:** Bilder ansehen; Bau + ein Lauf (Taschenlampe an, nachts draußen); Kosten ≤ 0,3 ms prüfen; Texturen-Einheiten-Limit (16) nicht reißen; bei Gefallen committen,
  sonst verbessern (Ziel: Until Dawn/RE Village/RDR2-Winter-Niveau, nie dauerhaft im Bild). `F3_stand_umwelt.md` fortschreiben.

### 4.3 Menü/Titelbildschirm R-27 – **nur Auftrag, nichts gebaut** (Agent scheiterte am Wochenlimit)
- Wortlaut in `F3_extras.md` (R-27). Inhalt: Titelbild auf AAA-Niveau (RE Village/Alan Wake 2/Silent Hill 2), lebendige 3D-Titelszene (Ortstafel nachts, Regen, Rabe Whiskey, Idle-Ereignisse),
  Titel-Lockup, große gut lesbare Menüpunkte (≥ 22–26 px), UI-Töne, passende Titelmusik (Drone/Streicher/Spieluhr), **Beta-Vermerk** („BETA · Testversion Kapitel 1–6 · Build <Datum>“, ≥ 16 px,
  plus einmaliger Hinweis), alle Schriften groß genug. Datei: `app/mods/menue.js` (+ minimal Basis-CSS). Vorarbeit/Stand: `F3_stand_menue.md`.
- **Nächster Schritt:** als neuer Agent/Arbeitspaket starten (Auftragstext ist in dieser Sitzung formuliert; sinngemäß aus R-27 ableiten).

### 4.4 Desktop-Symbol R-28 – **nur Auftrag, nichts gebaut**
- Wortlaut in `F3_extras.md` (R-28): krasses, gruseliges, texturiertes Logo, „vielleicht eine Krähe“. Plan: Rabe (Whiskey-Modell aus dem Spiel) mit Rim-Light/Nebel rendern, Silhouette bei 32 px klar,
  mind. 3 Varianten, `app/icon.ico` (16–256 px) + `app/icon.png` 1024; altes als `icon_alt.ico`. `app/main.js` und electron-packager (`--icon=icon.ico`) nutzen `icon.ico`.

### 4.5 Aufräumen/Komprimieren R-25 – **teilweise, Branch `wip/pause-2026-10-01`** (Commit „WIP-Sicherung (Pause)“, Bericht des Agenten kam nie)
- Gemacht (nur dort, **nicht in der Hauptlinie**): `.gitignore` (Testseiten/Unreal-Logs), `app/build.js` (`HAM_OUT`, `HAM_SLIM`, `SKIP`-Mechanik), `app/tools/release_auslassen.js` (Liste nie genutzter Assets
  und Originale, deren KTX-Fassung geladen wird), 28 Werkzeuge nach `app/tools/_alt/` verschoben, `game/assets/ms/spindle/model.bin` 70 MB → 9 MB (+ `model.gltf`), `game/sounds.js`/`sounds_extra.js` bereinigt,
  `app/mods/klang.js`/`hungrige.js`/`fassaden.js`/… (diese Fixes sind bereits in der Hauptlinie), `app/story/audit/F3_schlusstest.md` (vollständiger QA-Bericht, 138 Zeilen – **dort „Offen“-Abschnitt lesen**).
- **ACHTUNG – nicht den ganzen Zweig mergen:** `app/mods/oberflaeche.js`, `stimmen.js`, `_base_source_index.html` und `assemble.js` (ORDER ohne `remise`/`raender`) sind dort ÄLTER als die Hauptlinie.
  Nur gezielt übernehmen: `git checkout wip/pause-2026-10-01 -- .gitignore app/build.js app/tools/release_auslassen.js app/tools/_alt game/assets/ms/spindle game/sounds.js game/sounds_extra.js app/story/audit/F3_schlusstest.md`
  (und das `git mv` der Werkzeuge: dort liegen sie in `_alt`, in der Hauptlinie noch in `app/tools/`).
- **Nächster Schritt:** Auswahl übernehmen, `HAM_SLIM=1 HAM_OUT=<Testordner> node build.js` prüfen, Release-Größe vergleichen, ein Spiellauf. Kandidat für Verlustfreiheit: `release_auslassen.js` zeigt, was entfällt.

### 4.6 Sprachausgabe (Stimmen) – Modul fertig, **Aufnahmen fehlen**
- `app/mods/stimmen.js` (committet a46785f), Werkzeuge/Erzeugung in `C:\Users\GIGABYTE\HAM_Stimmen\` (`phase2_erzeugen.cmd`, `_phase2.log`, `_refwahl3.log`), Ausgabe `spiel\ausgabe`, Spiel liest `game/assets/stimmen/manifest.json`.
  1 100 Zeilen sind mit Sprecher erfasst, **nur 3 sind vertont**. Hinweis des Agenten: in `neben5.js` sollen Lukes Antworten an Vegas von `LUKE` (stummer Gedanke) auf `DU` (gesprochen) gestellt werden (Helfer `L`; Agent meldete es als geändert, in der Hauptlinie NICHT eingecheckt → nachholen, wenn Stimmen laufen).
- **Blocker 1 (nur der Nutzer kann entscheiden):** Windows **Smart App Control** blockiert unsignierte DLLs (`select.pyd` des Pythons, PyAV) → jeder neue Python-Prozess der Pipeline bricht ab. Optionen: Smart App Control
  ausschalten (danach nur per Windows-Neuinstallation wieder einschaltbar) **oder** Werkzeuge auf signiertes Python von python.org (3.13) neu aufsetzen (~3 GB, Erfolg unsicher). Ich habe empfohlen: anlassen + neu aufsetzen.
- **Blocker 2:** Klone treffen die Stimme zu schwach (Luke Median 0,48, Schwelle 0,70; Phase 1 einzeln 0,80–0,86 → Verdacht: Bündelung von 4 Zeilen je Aufruf, schon auf 1 gestellt, ungeprüft). Regel bleibt hart: unter Schwelle kommt keine Zeile ins Spiel.
- Zeitbedarf auf dieser Maschine: 1–2 Tage. Peter bleibt vorerst stumm (Treue 0,40–0,50), Zayn stumm.

## 5. Bekannte Fehler / offene Punkte (aus dem Schlusstest, Stand 01.10.)
- **Kapitel 3:** komplett durchgetestet, **OK** (Aufwachen, Kuh-Kino, Polaroid, Telefon/Justin, „Kein Draußen“, Zählbuch/Funk/Ochs am Berg, Behaltene, Nimmerheim 1–3, Abgrund, `k3blinzeln`, Wahl, Endkarte → Kap. 4).
  Behoben: #5 Weiterspielen am Kapitelanfang, #6 Polaroid-Bild, #7 `k3blinzeln` (NaN-Orte, `kino_buehne` wandelt Array). `k3blinzeln` wartet auf Taste Q (Augen zu) – kein Fehler. **Ungeprüft:** AG-08/09/10 (Auslöser hängen am Weg-Zähler).
  Testgrenzen (kein Spielfehler): Justins Ankunft per Direktauslöser, Augen-zu-Szenen.
- **Kritisch, offen:** Grafikspeicher in Kap. 5/6 bei 7,6–7,8 GB von 8 GB (≈ 4 700 Texturen, 876 Programme) → zweimal WebGL-Kontextverlust im Test (vermutlich mit parallelen Testfenstern). Lösung: Texturen kleiner/ausladen, Auslese, Last der Figuren-Texturen.
- **Offen:** schwarze gestreckte „Schlieren“ über Vorgärten (Nr. 1, vor Nr. 7) – Details im „Offen“-Abschnitt von `F3_schlusstest.md` (Branch `wip/pause-2026-10-01`). Schritte im Amt-Gang verstummen zwischen 25 m und 5 m (Raumklang). Peter-Nahaufnahme pixelig; Prolog-Graugesicht überstrahlt;
  Joint schwebt im Schritt „feuer“; Hilde-Kopf fehlt in einem Bild von k1h (23,5 s); Halle/Villa sehr dunkel; Nr. 9 Front dunkel; `Texture marked for update but no image data` (2×); Lichtschiff-Unterseite; `needsUpdate`-Ruckler an Figurenmaterialien (teilweise durch Einpass-Maßnahmen entschärft).
  Kinderfiguren 76–107 k Dreiecke; JS-Heap ≈ 6,3 GB; kalte Ladezeit 220–246 s (warm 101–108 s).
- **Ungeprüft im Schlusstest** (Sammelläufe kamen nicht mehr dran): Zeichen, Umwelt (Wind/Schaukel/Blätter), Vegetation, Hände/Räume, Beobachter, Kino-Stills.
- **Release-Prüfung:** `ORDER` enthält `remise` und `raender`, deren Dateien gibt es nicht (assemble überspringt sie – harmlos).

## 6. Wichtige Entscheidungen (unter „empfohlene Option“, gesammelt für den Abschlussbericht an den Nutzer)
Story-Prüfung: alle 15 Verbesserungen übernommen (inkl. „Das siebzehnte Jahr“ V-1, „Die LWO hat Lucy als Köder benutzt“ W-5), Messlatte jetzt Kap. 4, Nachtlicht im Kinderzimmer Nr. 1, Funk am Hochsitz, Beobachter-Zettel 86→70 mit kalten Zetteln,
Epic-Mannequin/Justin-Animationen ersetzt, 47 CC-BY-Credits, Stümpfe/Stämme aus UEFN-Referenzscans **nicht** verwendet (Lizenz), Atem/Blätter/Regen überarbeitet, Untertitel-Warteschlange, Teststand-Ende (`teststand.js`, `HAM_TESTSTAND`).
Details je Entscheidung: `F3_extras.md`, `story_pruefung.md`, `lizenzen_release.md`.

## 7. Beim Abschluss noch zu tun (vom Nutzer so beauftragt)
Ein einziger Release-Bau, auf den Desktop (Verknüpfung „High Abyss Mira (Testversion)“, Ordner `C:\Users\GIGABYTE\Spiele\High Abyss Mira - Testversion Kap 1-6`, alte Teststand-Ordner `…Teststand Kap 1-3` darf der Nutzer löschen),
**GitHub-Sicherung wie vereinbart** (ohne `.env`, API-Schlüssel, Downloads, Build-Ordner, `node_modules`; Remote `origin`), gesammelter Entscheidungsbericht auf Deutsch. **Wochenlimit:** Stand 02.10.: „Alle Modelle“ 98 %, Fable-Zähler eigen (reset 07.10. 11:00); Agenten mit Fable scheiterten am Limit.
Neu zu beginnen erst nach Absprache: Menü R-27, Symbol R-28 (siehe 4.3/4.4).

## 8. Orte
Repo `C:\Users\GIGABYTE\HighAbyssMira-Repo` (Hauptzweig `claude/wonderful-wozniak-twn7nr`, WIP-Zweige `wip/pause-2026-10-01`, `wip/uebergabe-2026-10-02`) · Fab-Downloads `C:\Users\GIGABYTE\HAM_FabDownloads` · Stimmenwerkzeuge `C:\Users\GIGABYTE\HAM_Stimmen` ·
Testwerkzeuge `C:\Users\GIGABYTE\_game_run.sh`, `_testgate.sh`, `_schluss\` (QA-Läufe) · Gesprächsverlauf der alten Sitzung `C:\Users\GIGABYTE\.claude\projects\C--Users-GIGABYTE-OneDrive-Desktop-Claude-projekte\84aa0656-63f8-4f2e-a4e4-340c81f4c03a.jsonl`.


## 9. Nachtrag 02.10.2026 (Nachmittag) – Testrückmeldungen des Nutzers und Stand
**Erledigt und committet (Branch `claude/wonderful-wozniak-twn7nr`, auf GitHub):** 4.5 Aufräumen übernommen (Schlankbau, Spindel-Modell 9 MB; `lorenz` aus der Ungenutzt-Liste genommen),
riesige Leiter im Amt (Maßstab über Dicke → 52 m Balken; `amt.js` `amt_kit(..., 'lang')`), Ranken durch Wind-Shader (`inverse()` bei entarteten Instanzen, Basis `windVert`), Laub nicht an Möbeln/Stufen (`bewuchs.js`),
Zimmer-7-Tür-Absicherung (`zimmer7.js`, Erleichterungsszene hängt nicht mehr), Beta-Vermerk unten links (`teststand.js`, `HAM_BUILD` aus `assemble.js`), Release liegt auf dem Desktop (Build 02.10.).
**Verworfen:** `leistung.js` Abschnitte 11–13 (kein messbarer Gewinn; Zweig `wip/uebergabe-2026-10-02` bleibt).
**Im Arbeitsverzeichnis, gebaut, NICHT im Desktop-Bau:** Klang (`klang.js`: stille statt synthetischer Ersatzgeräusche, echtes Laub statt Rauschen, Musik ≈ +4 dB, kürzere Pausen).
**Noch offen (Nutzerwünsche, nach Dringlichkeit):**
1. **Haustür-Treppe Nr. 7 (Kap. 1):** Mittig (x = 23) bleibt man beim Rennen auf der ersten Stufe (z ≈ −11,0) hängen, y flackert 0 ↔ 0,22 (74–156 Wechsel in 4 s); x = 22,6 / 23,4 kommen durch. Stufen = nackte Boxen (Stufe 1: 22,1–23,9 × −11,8…−10,7, Oberkante 0,22; Stufe 2 bis −11,25, Oberkante 0,43) ohne Collider (Boden über `solidGround`, Regel `best <= y+.05 || cnt >= 3`). Verdächtig: Katze PETER (streunt auf der Veranda), Gras-Büschel `gruen` (noCol) auf den Stufen. Test: `_t_steps.json` (Schritt `treppe`).
2. **Kellertreppe (Kap. 1):** nicht untersucht (`enterBasement`/`leaveBasement` sind Fade-Wechsel mit `stairBusy`).
3. **Selbstgezeichnetes ersetzen:** Kreidestriche an Laternen schweben als Balken; Telefonzelle ohne Eingang; Schränke ohne sichtbare Tür; Farb-Ausreißer; blutige Hände/Kratzer (Kap. 2), UFO-Bilder im Keller (Kap. 1) – alles Canvas-Decals. Ersatz durch echte Scans/Decals nur mit freien Fab/Quixel-Assets (Nutzer meldet sich selbst an).
4. **Tassen/Gegenstände falsch platziert:** Orte nötig (Haus/Raum), Handplatzierungen in vielen Modulen.
5. **Tür Zimmer 7 (Kap. 2):** Ursache nur vermutet (hängende Untertitel-Szene); der „Balken“ war die Leiter (behoben) – bitte im neuen Bau prüfen.
6. 4.1 Rest, 4.2 Atem, 4.3 Menü, 4.4 Symbol, 4.6 Stimmen wie oben (am 07.10. weiter).
7. Klangprüfung: Abstürze/Aussetzer nicht reproduziert; Ursachenforschung nur mit Hörtest möglich.
