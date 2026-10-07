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

## 10. Nachtrag 02.10.2026 (Morgen) – echte Graffiti, Bewertung, Inventar
**Committet:** Graffiti-Wände sind eigene 2048-px-Bilder statt Atlas-Zeichnung (`zeichen.js` → `ZEICHEN_BILD`, eigenes Netz je Wand): Nr. 9, Tankstelle, Villenmauer, neu Alien-Schablone (Tankstelle, `tanke_alien`)
und Horror „ZÄHL NICHT MIT“ + 17 Striche (Schrottplatz, Wand x ≈ 116, `schrott_zaehl`, Bild im Spiel noch nicht angesehen). Erzeugung offline: `app/tools/grafik/gr_extract.py` (stellt echte Sprühfarbe aus den 8k-Scans
in `HAM_FabDownloads/v20_texturen` frei → `_cut/`), `gr_compose.py <nr9|tanke|villa|alien|zaehl>` (echte Ausschnitte + gesprühte Schriftzüge: Kern, Tröpfchennebel, Läufer, Korn). Kreidestriche sitzen auf dem echten Mast (`entdecker.js`).
Villenwand im Test nicht gesetzt (Bereich nicht geladen) – prüfen. Credits ergänzt (commonspence, Punttulanbro).
**Berichte:** `docs/gameplay/AAA_Bewertung.md` (Noten, 10 Hebel, Szenenvorschläge), `docs/technical/selbstgezeichnet_inventar.md` (~430 offene selbstgezeichnete Texturen; größte Hebel: Papier-Scan-Satz, Decal-Set Kreide/Kratzer/Abdrücke).
**Offen (Nutzerwunsch):** weitere Mystery-/Horror-/Alien-Graffiti, Lunas Kreide „1 … 17 UND NOCH EINS“ (Kap. 3), Kornkreis „sieben Kreise und ein halber“ am Hof als weitere Nazca-Figur. Wochenlimit 100 % (Reset 07.10.), Arbeit lief über bezahltes Zusatzkontingent.

## 11. Nachtrag 02.10.2026 (Vormittag, 20-€-Paket des Nutzers)
**Committet und im Desktop-Bau:** Lunas Kreide „1 … 17 UND NOCH EINS“ auf dem Spielplatz Kirchberg (nur Kap. 3, `spielplatz_zaehlen`, Bild `boden_kreide17.png`; Kapitelsichtbarkeit der Bild-Netze über `zeichen_S.bildM`),
Verschwörungswand „SUMPFGAS? LÜGE!“ (Wellblechzaun Schrottplatz z ≈ −10,4) und „ZÄHL NICHT MIT“ (z ≈ −14), beide hell auf dem dunklen Blech, im Spiel angesehen. Nazca-Figur „sieben Kreise und ein halber“
(`ZEICHEN_NAZCA` id `kreise`, c [29.5, 169], Perlen an einer Schnur) – **nur gebaut, nicht im Spiel angesehen** (Wald erst ab Kap. 6).
**Echtes Papier:** `papierScan(ctx, w, h, farbe)` in der Basis (Megascans „Dirty Papers“, leere Blattfläche → `game/assets/ms/papier/faser.jpg`, multipliziert über die Grundfarbe) ersetzt Farbfläche + gemalte Pünktchen in
`amt_papier`, `kapitel1_papier`, `kirchberg_papier`, `villa_papierCv`, `innen_kapitel` paperCanvas und im Lesefenster (`ob_papier`, gemalte Wolken/Fasern nur noch als Hauch). „Paper Grime“ (Megascans) ist unbrauchbar (durchgehend dunkle Fläche) und nicht verwendet.
Noch nicht umgestellt: `karte.js`, `album.js`, `ausbau_nord_paper`-Aufrufer. Testzugriff `__papier`. Quelle: `HAM_FabDownloads/v21_papier`.
**Offen:** Decal-Set (Kratzer, Blut, Abdrücke), Kinderzeichnungen, restliche Einträge aus `docs/technical/selbstgezeichnet_inventar.md`.
**Nachtrag (restliches Budget):** `kreideKorn(ctx, w, h)` (Basis, Maske `ms/papier/kreide_korn.png` aus dem Betonscan, nahtlos) in `kapitel1_verwaschen` (alle Kreide-Leinwände Kap. 1), `chalkTex`, `entd_kreideTex`,
`tausch_kreideTex`, `k5_tKreide` – im Spiel nicht angesehen (Pfeile nur im Taschenlampenlicht). Kino-Einschlagriss (`kino.js` `riss`) = Megascans „Concrete Crack“ sternförmig zusammengesetzt (`ms/riss/b.png` + Höhe `h.jpg`, Erzeugung im
Gesprächsverlauf 02.10.). Blut-Leinwand der Basis ist nur Ersatz ohne `FAB.blood` – nicht umgestellt. Megascans „Scratches“ (Pinsel) liegt in `HAM_FabDownloads/v22_risse/scr2`, noch nicht verwendet (Beobachter-Kratzer `beob_texte`). Danach: Beobachter-Krallenspuren `beob_texte` → `msTex('spuren/kratzer.png')` (Megascans „Scratches“ + Betonkorn), `kapitel1_wachs` mit Korn (Wachsmalstift). Fußspuren bleiben Nass-Masken (wirken schon echt).

## 12. Nachtrag 07.10.2026 – Rückmeldungen des Nutzers (unsichtbare Wände, Rettung, Rauschen)
**Behoben (Commit „Rettung stellt Keller-/Zonen-Zustand …“):**
- **Rettung „FESTGESTECKT?“ (tod.js):** nach dem Versetzen blieb `state.inBasement` stehen → draußen Mond/Spiegelung aus, Luft gedämpft („Nebel, nichts lädt“). Neu `tod_umwelt(x, z)` (Keller x/z≈300, Amt/Weiß z<−2000, Kanal z>2000) in `tod_zurueck` und `todRespawn`; „Ein paar Schritte zurück“ im Keller → Fuß der Kellertreppe.
- **Klemmt-Diagnose (tod.js `tod_klemmTick`, `tod_blockiert`):** 1,2 s Laufen ohne Fortkommen → Protokoll `log.txt` „Klemmt: pos=… davor/STECKT: <Objektname>“ (alle 15 s höchstens) und bei echter Überlappung Freischieben zum nächsten freien Punkt. **Beim nächsten Test log.txt lesen** (`%APPDATA%\High Abyss Mira\log.txt`, Suche „Klemmt“) – so sehen wir, welches Objekt die „unsichtbare Wand“ ist.
- **Kollision:** `solidLive` ignoriert Netze mit `layers.mask === 0` (nicht gezeichnet) und Material `opacity < .05`/`visible === false`. Hinter der Südsperre (z −56…−46,2) darf man nicht landen (`MANTLE_SPERR`, Absetzen in tod.js).
- **Rauschen:** gemessen am Weltbus (Test mit `Audio.init()`, `G.Audio`, Analyser): der Donner (Blitz alle 35–75 s) war mit RMS 0,34 das 25-fache des Klangbetts (70 % unter 80 Hz; Hauptanteil Aufnahme `rainThunder`, dazu `rumble` RMS 0,50). `KL_TRIM` (klang.js, angewandt in `raumklang.js` play – ein Umhüllen in klang.js geht verloren, raumklang ersetzt `play`), `RUMBLE_K`, Sinus-Tiefbass ×0,3 → 0,14. Pegel einzelner Slams/Krähe (`crow2`) gesenkt.
- **Laub:** Haufen (strasse.js `strasse_laubKante`, alphaHash) mit weichen Kanten statt hartem Rechteck.
**Nicht gefunden / offen:** Ursache der „überall unsichtbaren Wände“ beim Rückweg durch den Wald bei Lucys Auto (Rasterscan nach Teleport-Tour: nur 8 von 6 161 Feldern neu blockiert, weiche Büsche bremsen nur 0,3 %); Kellertreppe nach UFO-Flucht (Test `kellerEnde` + Laufen: frei). Sichtkontrolle der 11 Nutzer-Screenshots: siehe Fragen an den Nutzer (Wendt-Gesicht/Hände, Kopf im Küchenfenster, schwarze Figuren ohne Textur, Kreidebalken an der Kellertür, gepunktete blaue Ränder, Nebelklumpen).
**Nutzerwunsch Hanna Libu (Figur nach Fotos):** abgelehnt (reale Person, sieht minderjährig aus; „extrem flirtend“). Vom Nutzer fallen gelassen.

## 13. Nachtrag 07.10.2026 – Spinnenraum (Amt, Kap. 2) neu: `app/mods/spinnen.js`
**Fehler (Nutzer):** „Schütteln bewirkt nichts, Verzerrung bleibt, Spiel geht nicht weiter.“ Ursache: Wechsel in die Schüttelphase vor dem letzten Spawn, Endbedingung `spawned >= SPN` nie erfüllt (Basis spiderUpdate), Lampen setzten `glitchV` jedes Bild; Mausschütteln nur mit Zeigersperre.
**Neu:** Basis `spiderEvent`/`spiderUpdate` rufen `spn_event`/`spn_update` (alter Code bleibt als Rückfall). Spawnen in beiden Phasen; Ende = alles gespawnt + keine Spinne am Boden/auf dem Bild; Selbsthilfe 40 s, hartes Ende 75 s; `spn_abbruch` (TOD_RESET) und `spn_aufraeumen` setzen Bild/Ton/Licht zurück. Schütteln: Maus (auch ohne Sperre) oder A/D abwechselnd, Anzeige „Befall/Wucht“, Stöße schleudern Spinnen von der „Linse“.
**Spinnen:** echte Vogelspinne des Spiels (Fab, `FAB.spiders[0]`) als Instanz-Geometrie, Gehpose aus der Lauf-Animation eingebacken (`getVertexPosition`), Eckpunkte verschweißt/glatt geschattet, Beine im Vertex-Shader (`spn_beine`), 14 skelettanimierte Vogelspinnen laufen auf Luke zu, 36 3D-Spinnen auf dem Bild. `spn_haut` (Fell-Schimmer/sheen, Clearcoat, erzeugte Haar-Normalkarte, leichtes Eigenlicht) gilt für ALLE Spinnen im Spiel (Räume, Keller, Kreuzspinnen an Netzen, die abseilende; `spn_allePflegen`). Ton: synthetisierter Spinnenlauf (`spn_buffer`, Schleife + räumliche Stücke), Schüttelstoß, Atem/Herzschlag nach Befall. Lampen: defekte Leuchtstoffröhre statt Regenbogen. Hervorhebung (Ränder, Erklärkarte) während der Szene aus.
**Grenzen / offen:** das Modell hat nur ~1 400 Dreiecke und eine 1k-Textur (kein Foto-Scan); für „echte HD-Spinnen“ bräuchte es ein hochauflösendes Modell (Fab, ggf. kostenpflichtig, Nutzer wählt) – dann nur `spn_modell` und `spn_haut` anpassen. Ton nicht gehört, nur gemessen. Bildeindruck nur mit Testlicht und im Dunkeln geprüft.

## 14. Nachtrag 07.10.2026 (Abend) – Treppe, Hochziehen, Donner, Naturschreck
- **Kellertreppe (Nr. 7):** Ursache der „unsichtbaren Wand“ beim Runtergehen war ein Querbalken (`innen_ort.js`) 5 cm über den unteren Stufen; er sitzt jetzt hinter dem 45 cm verlängerten Deckendurchbruch. Test `_tr2_steps.json`: alle Spuren, Gehen/Rennen, beide Richtungen ohne Y-Sprünge.
- **Hochziehen** (`_base_source_index.html`, `mantleTarget`): probiert jetzt jede Kantenhöhe in Reichweite (Stoßstange, Haube, Dach) und prüft Standplatz an der echten Standhöhe (Autos gingen vorher fast nie). Ausnahme: Lucys Leihwagen (feste 99-m-Kiste, bewusst). Testzugriffe `G.mantleTarget`, `G.dbg`.
- **Donner** (`klang.js`, `app/tools/klang_donner.py`, Quellen via `HAM_Audio/donner_holen.py`): zehn echte Aufnahmen in drei Abstandsklassen (krach/nah/fern). Abstand = Zeit Blitz→Donner × 343 m/s; Pegel ~3,5 dB je Verdopplung, Tiefpass nach Abstand und während des Rollens, drinnen dumpf/leiser, nie dieselbe Datei hintereinander. Blitze seltener (55–120 s) und mit Verteilung meist fern, selten nah (`lightning()`). Messung: `_thd_steps.json` (Abgriff `Audio._thMess`).
- **Naturschreck** (`app/mods/naturschreck.js`): neun leise Momente (Spinne seilt sich ab, naher Donnerschlag, Spinnweben im Gesicht, Vogel aus dem Busch, Dose hinter dir, Tür fällt zu, rollende Flasche, Glas bricht, Kratzen in der Wand), nur in ruhigen Momenten, 5–9 Min Abstand, über die Regie (`spannung_can/did`). Testzugriff `__ns.run(id)`. Figuren mit festen Dialogen (Justin, Vegas …) sind bewusst nicht dabei.
- **Ritzschrift** (`app/mods/ritzschrift.js`): Strichschrift statt Computerschrift für Wand-/Tafel-/Blutschrift (Stile ritz/kreide/blut, Höhenrelief, nie abgeschnitten). Eingebaut in Peters Zelle (Wandritzen, Strichliste mit Jahreszahlen, Tafel in Kreide) und als Blutschicht „SIE NEHMEN NUR DIE …“ an der Zeichnungswand (`kapitel1_blutSchrift`, Kind von `B.wallArt`, Klarlack-Glanz); Zeichnungen auf echten Papierscans (`papierScan`). Alle Schreibschrift-Schriften (Caveat, Comic Sans …) werden auf Leinwänden jetzt Buchstabe für Buchstabe mit Jitter gesetzt (Patch auf fillText/strokeText am Ende der Datei).
- **Laubhaufen** (`strasse.js` → `S.haufen`, `umwelt_haufenTick`): werden beim Hindurchgehen platt getreten (bleibt), wirbeln Blätter auf, Wind lockert sie nur langsam.
- **Klang**: `Audio.crack` (Knochen) und `Audio.paper` nutzen Aufnahmen. Noch synthetisch: ding, flick, skitter, build (UI/kleine Effekte).
- **Offen (braucht Fotos/Rückfrage)**: Wendt-Hände/Buch, Küchenfenster-Kopf, schwarze Silhouette in der Erinnerung, Kellertür, Gurtstuhl, Wand hinter der Tür (Foto 11), schwarzer Fleck (sind die Reifen `bewohnt.js` keller7). Hanna: abgelehnt, erledigt.

## 15. Nachtrag 07.10.2026 (Nacht) – Foto-Rückmeldungen, Welt-Abgleich, Figuren
- **Fotos des Nutzers (11 Stück):** Laterne (Foto 2: schwebende leuchtende Platte – die Birne hing 1,7 m neben dem Kopf des Scan-Modells; neues Modul `laternen.js` setzt Birne/Kegel/Pool an den echten Kopf), Beete/Laub (Foto 3: weiche Ränder `boden_weich`), Kellertür (Krallenspuren echt mit `ritz_kratzer`), Blutschrift/Papier an der Zeichnungswand (Foto 7). Küchenfenster-Kopf (Foto 4, Frau Aydın Nr. 8) beim Kap.-3-Umsetzer. Offen: schwarze Silhouette (Foto 5), Gurtstuhl (Foto 8), Wand hinter der Tür (Foto 11), Mann mit verbogenen Händen (Foto 1).
- **Welt-Abgleich Text und Welt** (Nutzer: was im Dialog steht, muss zu sehen sein): sechs Prüfberichte in `docs/gameplay/abgleich/*.md` (ca. 230 Lücken), sechs Umsetzer-Agenten je Dateigruppe, Protokolle `*_umsetzung.md`.
- **Figuren-Prüfung** (34 Figuren, Kopf/Rumpf-Nahaufnahmen): Augen wirken unnatürlich (Wimpernkarten mit massivem schwarzem Band = Kajal-Eindruck, rosa Sklera, harter Limbusring) → `figuren_wimperMat`/`figuren_augeMat` in figuren.js (ungeprüft). Kinder: Hemdsaum mit schwarzen Zacken und herausragendem Hosenreißverschluss (Verschleiß „wear 0,55“ in cast.json) offen; Haare/Kopfhaut bei Mike/Hilde mit Lücken offen.
- **Testbetrieb:** nur EINE Spielinstanz gleichzeitig (RAM/Grafik). `_run_locked.sh` mit Sperrordner `.hamlock`. Schwarze Bilder plus CONTEXT_LOST_WEBGL heißt: zu viele Instanzen.
- **Ton:** Rauschen und Einbrüche noch nicht gemessen (Messskript `_au2_steps.json`: BURST/DIP-Liste mit Auslösern).

## 16. Übergabe 07.10.2026 (Nacht) – Stand für die nächste Sitzung
**Zuerst lesen:** dieses Kapitel, danach `docs/gameplay/abgleich/*_umsetzung.md` und `basis_ausbau.md` (Status-Abschnitt am Ende). Antworten an den Nutzer immer auf Deutsch. Modell: Sonnet 5.5 Standard, bei Festhängen höheres Modell empfehlen.
**Arbeitsregeln:** nur EINE Spielinstanz gleichzeitig testen (`C:\Users\GIGABYTE\_run_locked.sh <steps.json> <Ausgabeordner>`; Schritte wie `_hm_h_steps.json`); schwarze Bilder + CONTEXT_LOST_WEBGL = zu viele Instanzen. Bau: `cd app && node tools/assemble.js && node build.js`. Testseite `index.html?fast` (überspringt Shader-Vorkompilierung und Textur-Upload, nur für Tests). Kein Push/Desktop-Kopie ohne ausdrückliche Freigabe des Nutzers (am 07.10. Nacht für den damaligen fehlerfreien Stand erteilt).
**Erledigt in dieser Sitzung (siehe §14, §15):** Kellertreppe, Hochziehen, Donner, Naturschreck, Ritzschrift, Laubhaufen, Laternenköpfe (`laternen.js`), weiche Bodenränder, Augen ohne Wimpernkarten + neuer Augen-Shader, Welt-Abgleich Text↔Welt (sechs Agenten, Berichte `abgleich/*_umsetzung.md`).
**Neu, am Ende der Sitzung (ungeprüft bis auf Bau/Syntax):**
- Haut-Shader „Q7“ (`figuren_hautMat` in `figuren.js`): Poren auch im Albedo, Fleckung/Rötung, ungleichmäßiger Glanz, rötliches Streulicht, Flaum am Rand. Anlass: Nutzer „Gesichter sehen plastisch und unnatürlich aus, soll nach Triple-A aussehen“. Prüfung: `_hm_h_steps.json` (8 Gesichter, Nahaufnahme). Bei GLSL-Fehler oder Optik schlechter: `customProgramCacheKey 'fig_haut7'` zurück auf den Stand von Commit 40796a3.
- `figuren_hosenMat` (Kinderhose, Material Waistband): Hemdsaum-Zacken (Mike, Luke, Zayn) sind NICHT behoben; die Ursache liegt im Hemd-/Hosenmodell der Basis „C“/„G“ (Reißverschluss/Bund scheint durch den Saum), kein `wear`-Parameter. Idee: Saum am Hemd per UV-Maske schließen oder Hose am Bund mit Hemd-Farbe überblenden.
**Offen (Reihenfolge nach Wichtigkeit):**
1. Gesichter weiter verbessern (Nutzerwunsch 07.10.): Augenhöhlen-AO, Lippen-/Nasenglanz, Zähne/Mund, Haaransatz (Mike/Hilde haben Kahlstellen), Gisela hat zu starken Lidstrich, Lucy dunkle Schmiere links am Auge (Brauen-/Wimperntextur).
2. Foto-Fehler des Nutzers: kahler Mann im Trenchcoat (Hände verbogen, Hautlöcher, Buch nicht in der Hand; welche Figur-ID: amt1/wolter/nachsorge?), schwarze Silhouette in der Erinnerung im Raum mit grüner Tapete, Gurtstuhl (Gurt + Umriss), Wand hinter der Tür („zusammengeklatscht“). Fotos brauchen ggf. neue Zusendung.
3. Ton: ständiges lautes Rauschen und Einbrüche: gemessen ist nur der Donner (gelöst). Messskript `_au2_steps.json` (BURST/DIP-Liste) noch nicht gelaufen; Kandidaten: `scareSound` Static/Screech, `Audio.flick`, hush/abriss, Regenschleife-Nähte, Stimmen-Stealing.
4. Ladezeit des echten Spiels (Beutel, Figuren, Kirchberg, Fassaden, Ausbau O/W, Kino, Kollision, „Grafik vorbereiten“): parallele Vorabladung, Lazy-Laden, weniger Canvas-Erzeugung. Nur die Testseite `?fast` ist schneller.
5. Welt-Abgleich Rest: Kap. 6 Bus-Innenraum (nach letzter Änderung nie im Bild gesehen: von hinten und vorn prüfen, Heck-/Windschutzscheibe fehlen im Scan), Kindersitze 7 (Kap. 6) vs. 8 (`ausbau_ost_west.js:573`), Eisenkreuz-Haarbänder, Traktor-Pfeil, Eisenbett-Riemen, Rutsche, Fassaden-Karten Nr. 2/6/8/9, „C“ im Kistendeckel (`cleo.js`), `kapitel1.js:333` sagt „Stahltür“ (Text soll „schwere Tür“). Fehlt (Modelle müssten geladen werden, Nutzer klärt Download): Wrack-Innenraum, Bus-Innenraum, Kindersitz-Scan, Klappmesser, Zelt, Kassettenrekorder.
6. Neue Modul-Warnung: `neben3x` (Schilder) und Kap. 3 (Hufeisen) warfen beim Bauen `null.matrixWorld` (Raycaster ohne Kamera bei Sprites); `bu_strahl` in `ausbau_nord.js` fängt das für die eigenen Aufrufe ab.
7. Mantle bei Lucys Leihwagen bewusst aus; Kollision/Hitboxen überall (Auto-Kollision überspringt Skinning-Netze).
8. Ältere Wünsche: Stimmen, Titel/Menü, Nazca, Kinderzeichnungen/Karte/Album/Fußspuren/Handabdrücke als echte Scans, HD-Spinne, Figur „steht plötzlich hinter dir“ (Nutzer soll Figur wählen).
**Bessere Figurenmodelle (Nutzerfrage 07.10.):** MetaHuman ist seit 06/2025 auch außerhalb von Unreal und kommerziell nutzbar (Epic-Lizenzänderung), aber nur Erwachsene, schwer (Export/Bake nötig, Epic-/Fab-Login macht der Nutzer selbst, Download braucht seine Freigabe). Für Kinder gibt es keine bessere freie Quelle; Empfehlung: Kinder behalten (Reallusion-CC-Basis) + Shader/Textur-Verbesserungen; Erwachsene optional später.
**Git:** Zweig `claude/wonderful-wozniak-twn7nr`; Remote `origin` = github.com/Lucidalmaz/HighAbyssMira. Desktop-Ordner: `C:\Users\GIGABYTE\Spiele\High Abyss Mira - Testversion Kap 1-6`.
