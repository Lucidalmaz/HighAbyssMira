# Testen – Modi und Läufer (Stand 08.10.2026)

| Modus | Seite | Wofür | Speicher je Instanz | bis „Fertig“ |
|---|---|---|---|---|
| Normal | `index.html` | Optik, Leistung (FPS), Ladezeit | Heap ≈ 2,8 GB (vorher 6,2), GPU ≈ 3,3 GB | ≈ 100–170 s |
| fast | `index.html?fast` | wie Normal, nur ohne Vorladen (kapitel.js) | wie Normal | wie Normal |
| **lite** | `index.html?lite` | **Logik, Kollision, Auslöser, Interaktion, Abläufe** | Heap ≈ 1,9–2,2 GB, GPU klein | ≈ 55 s (2 parallel) |

**Lite** (nur Entwicklungsfassung, in der Veröffentlichung wirkungslos): Bilddateien und Modell-Texturen werden nicht geladen (4×4-Platzhalter),
alles wird mit einem grauen Einheitsmaterial gezeichnet (`scene.overrideMaterial`; die Materialien der Module bleiben und werden von der Logik weiter benutzt),
kein Vorübersetzen, kein Textur-Vorabhochladen, kein Vorladen. Formen, Kollision (BVH), Auslöser und Zeitabläufe sind unverändert.
**Bilder aus Lite-Läufen sind grau und taugen nicht zur Optik-Prüfung.** Schwarze Bilder/CONTEXT_LOST sind in Lite kein Fehler.

## Läufer
- Normal/fast (eine Instanz, globale Sperre `.hamlock`, baut vorher): `bash /c/Users/GIGABYTE/_run_locked.sh <steps.json> <ausgabe>` bzw. `_run_locked_slow.sh` (ohne `?fast`).
- Lite (parallel, bis 3 Slots): einmal bauen `bash /c/Users/GIGABYTE/_build_lite.sh`, dann je Lauf
  `bash /c/Users/GIGABYTE/_run_lite.sh <steps.json> <ausgabe> [slot 1–3]` (ohne Slot: erster freier). Eigene Sperre `.hamlock_lite<N>` und eigenes Profil `_ham_lite<N>` je Slot;
  startet erst bei ≥ 2,5 GB freiem Arbeitsspeicher; beendet hängende Fenster nach 15 min. Baut NICHT (sonst `HAM_BUILD=1` voranstellen).
- Schritt-Schalter in steps.json (main.js): `"heap": true` hängt `<name>_heap` (V8-Heap + ArrayBuffer-Speicher) an, `"profile": 5000` schreibt ein CPU-Profil.

## Speicher-Schalter (Normal)
- `?noktxfree`: KTX-Texturdaten nach dem Hochladen NICHT freigeben (Vergleich). Zählung im Spiel: `window.__ktxf` (freed, mb, restores, fails).
