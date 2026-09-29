# Welle 2 – gemeinsamer Auftrag (gilt für jedes Paket)

Nutzerauftrag (wörtlich): „baue alles mit den vorgaben des promts“ – der Master-Prompt (AAA-Horror/Mystery, Realismus, jedes Licht mit Quelle, Stille als Werkzeug, Kinosequenz nach jedem Kapitel, faire Rätsel, ≥ 60 FPS, nur echte Fab/Megascans-Assets, Deutsch, Texte lange genug lesbar, nichts schwebt/abgeschnitten). Die Umsetzung ist in `app/story/audit/produktion_welle2.md` in Pakete zerlegt; Texte stehen wortgleich in `app/story/story_final.md` (Block „Produktionsplan Kapitel 1–6“, PK-…). Regeln: `app/story/audit/REGELN.md` (verbindlich).

## Parallelbetrieb
- Mehrere Helfer arbeiten gleichzeitig im selben Arbeitsbaum. Nur die im Paket genannten Dateien/Anker-Bereiche ändern. Basis (`app/mods/_base_source_index.html`, CRLF!) nur mit dem Edit-Werkzeug und exakten Ersetzungen, Stelle unmittelbar vorher frisch lesen; bevorzugt Basisfunktionen aus der eigenen neuen Datei heraus umhüllen/neu zuweisen.
- `assemble.js` ORDER enthält bereits alle neuen Module (kapitel, kino, augenzu, zimmer7, lucy3, kamera, kapitel5, kapitel6, raender). Fehlt eine Datei, wird sie übersprungen. Ein Modul mit Syntaxfehler wird im Testbau übersprungen (Warnung „!!! Syntaxfehler …“) – achte auf diese Warnung bei DEINEM Modul. Bricht der Bau wegen fremder Dateien, 1–2 Minuten warten und erneut bauen; fremde Dateien nicht reparieren, sondern im Bericht melden.
- Schnittstellen anderer Pakete (§1 in produktion_welle2.md) immer mit `typeof … === 'function'` prüfen; sie entstehen parallel.
- Tests: KEIN gemeinsames Testprofil. Kopiere `/c/Users/GIGABYTE/_game_run.sh` nach `/c/Users/GIGABYTE/_<paket>_run.sh` und ersetze darin `_ham_testprofil` durch `_ham_testprofil_<paket>`. Ausgabeordner immer mit Präfix `_<paket>_`. FPS-Werte sind unter Parallel-Last verrauscht; prüfe Leistung über Aufbau (keine Lichter zur Laufzeit, keine Allokationen im Tick, Objekte beim Laden anlegen), die Endmessung macht der Hauptagent.
- Nicht den eingebauten Browser benutzen (Fab macht der Hauptagent). Fehlt ein Asset: vorhandene nehmen oder im Bericht genau benennen – nie Primitiv-Objekte als sichtbare Gegenstände.
- Nicht committen.

## Verfügbare neue Requisiten (game/assets/ms/…)
w_kamera (Sofortbildkamera), w_teller, w_tasse, w_becher, w_brot, w_besteck, w_urne (Losurne/Topf), w_schwert, w_birke, w_papierlaterne (model.fbx), w_buch (altes Buch → Dienstbuch), w_spieluhr (Metall-Schmuckkästchen → Spieluhr), w_jacke (model.fbx + model.jpg, Strickjacke), w_lighter, w_barrel; dazu alles Vorhandene (candles, lantern2, chair, metaltable, shelf, dresser, crib, doll, teddy_*, frame_*, …). Lader: `msModel(key,'model.glb')`, FBX über die Basis-FBX-Hilfe (siehe Basis ~Zeile 5060, Texturen selbst setzen). Einmalig vorher prüfen: Maßstab/Ausrichtung per Screenshot.

## Bericht (letzte Nachricht, knapp, deutsch)
1. Umgesetzt (je Aufgabe des Pakets: erledigt / teilweise / offen + Grund). 2. Geänderte Dateien/Bereiche. 3. Tests mit Ergebnis (Schritt → Ergebnis, Screenshot-Pfade). 4. Offene Punkte / Bitten an andere Pakete / fehlende Assets. 5. Gefundene Fehler außerhalb des eigenen Bereichs (nicht selbst behoben).
