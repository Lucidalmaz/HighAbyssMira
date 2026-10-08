# Testen – Modi und Läufer (Stand 08.10.2026)

| Modus | Seite | Wofür | Speicher je Instanz | bis „Fertig“ |
|---|---|---|---|---|
| Normal | `index.html` | Optik, Leistung (FPS), Ladezeit | Heap ≈ 2,8 GB (vorher 6,2), GPU ≈ 3,3 GB | ≈ 100–170 s |
| fast | `index.html?fast` | wie Normal, nur ohne Vorladen (kapitel.js) | wie Normal | wie Normal |
| **lite** | `index.html?lite` | **Logik, Kollision, Auslöser, Interaktion, Abläufe** | Heap ≈ 2 GB (Ton mit 8 kHz) | ≈ 55 s (2 parallel) |

**Lite** (nur Entwicklungsfassung, in der Veröffentlichung wirkungslos): Bilddateien und Modell-Texturen werden nicht geladen (4×4-Platzhalter),
alles wird mit einem grauen Einheitsmaterial gezeichnet (`scene.overrideMaterial`; die Materialien der Module bleiben und werden von der Logik weiter benutzt),
kein Vorübersetzen, kein Textur-Vorabhochladen, kein Vorladen. Formen, Kollision (BVH), Auslöser und Zeitabläufe sind unverändert.
**Bilder aus Lite-Läufen sind grau und taugen nicht zur Optik-Prüfung.** Schwarze Bilder/CONTEXT_LOST sind in Lite kein Fehler.

## Läufer
- Normal/fast (eine Instanz, globale Sperre `.hamlock`, baut vorher): `bash /c/Users/GIGABYTE/_run_locked.sh <steps.json> <ausgabe>` bzw. `_run_locked_slow.sh` (ohne `?fast`).
- Lite (parallel, **höchstens 2 Slots** – eine Lite-Instanz belegt ~4 GB Renderer + ~2,5 GB GPU-Prozess): einmal bauen `bash /c/Users/GIGABYTE/_build_lite.sh`, dann je Lauf
  `bash /c/Users/GIGABYTE/_run_lite.sh <steps.json> <ausgabe> [slot 1–2]` (ohne Slot: erster freier). Eigene Sperre `.hamlock_lite<N>` und eigenes Profil `_ham_lite<N>` je Slot;
  startet nicht, solange ein Normal-Lauf die globale Sperre hält, und erst bei ≥ 4 GB freiem Arbeitsspeicher (Normal + 2 Lite gleichzeitig = Speicher voll, Läufe hängen); beendet hängende Fenster nach 15 min. Baut NICHT (sonst `HAM_BUILD=1` voranstellen).
- Schritt-Schalter in steps.json (main.js): `"heap": true` hängt `<name>_heap` (V8-Heap + ArrayBuffer-Speicher) an, `"profile": 5000` schreibt ein CPU-Profil.

## Speicher-Schalter (Normal)
- `?noktxfree`: KTX-Texturdaten nach dem Hochladen NICHT freigeben (Vergleich). Zählung im Spiel: `window.__ktxf` (freed, mb, restores, fails).

## Dauerinstanz (--live, ohne Neuladen pro Lauf)
Das Spiel wird EINMAL geladen und bleibt offen; weitere Steps-Dateien laufen nacheinander im selben Fenster (Folgelauf = nur die Schrittzeit, Sekunden statt 60–140 s).
- `bash /c/Users/GIGABYTE/_live.sh start <lite|normal|fast> [slot]` – startet (wartet auf Sperre; Lite: `.hamlock_lite<N>`, Normal/fast: `.hamlock` + Bau). Die Sperre bleibt, solange die Instanz lebt; **Leerlauf-Ende nach 20 min ohne Auftrag** (`HAM_LIVE_IDLE=<ms>` ändert das).
- `_live.sh run <steps.json> [ausgabeordner]` – gleiches Steps-Format wie bisher (`name/js/wait/shot/heap/profile/trace`, zusätzlich `"timeout": ms` je Schritt, Standard 120 s; Fehler/Zeitlimit eines Schritts steht als `FEHLER …` im Ergebnis und bricht weder Lauf noch Instanz ab). Ergebnis: `_live/<instanz>/out/<dateiname>/` (steps.json, result.json mit nur den Logs dieses Laufs, Bilder), Kopie nach `ausgabeordner`; Eingabe wandert nach `done/`.
- `_live.sh reload` – Seite neu laden (frischer Zustand, dauert wie die Ladezeit). `_live.sh stop` – beenden, Sperre frei. `_live.sh status` – Zustand aller Instanzen/Sperren. Mehrere Instanzen: `LIVE=lite2 bash _live.sh run …`.
- Ohne Skript: JSON als `in/x.tmp` schreiben und in `x.json` umbenennen; `reload.cmd` / `quit.cmd` (leere Dateien) in `in/`.
- **Der Spielzustand bleibt zwischen Dateien erhalten** (gewollt). Der Start-Schritt `s0` nur beim ersten Mal: Skripte setzen/prüfen `window.__s0done` und überspringen ihn sonst. Für reproduzierbare Läufe vorher `reload`.
- Grenzen: hängt Schrittcode die Seite, blockiert er die Instanz bis zum Schritt-Zeitlimit (dann `stop`/`start`); Lite-Bilder bleiben grau; eine Live-Instanz hält Speicher/Sperre bis `stop` oder Leerlauf-Ende.
