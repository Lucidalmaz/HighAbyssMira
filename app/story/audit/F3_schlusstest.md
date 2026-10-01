# F3 · Schlusstest (Prüfstufe 4) Kapitel 1–6 – 01.10.2026

Getestet nur mit dem echten Bau (`node tools/assemble.js && node build.js`, Electron-Selbsttest ohne `--root`, lädt `app/game` mit KTX/Vendor).
Jeder Lauf einzeln über `_testgate.sh` (≤ 12 min). Werkzeug und alle Schrittdateien: `C:/Users/GIGABYTE/_schluss/`
(`lib.js` Helfer, `mk_*.js` Erzeuger, `run.sh <steps> <name> [profil-vorlage]`, `ana.py`, `sheet.py` Kontaktbögen).
Kapitelkette mit echtem Spielstand: jeder Kapitel-Lauf startet über „Weiterspielen“ aus dem Profil des vorigen Laufs
(`prof_<lauf>`), Kapitelwechsel jeweils einmal echt (Endkarte/Gang/Gully/Knopf).
Nebenbei: `app/main.js` schreibt `steps.json` jetzt nach jedem Schritt (Zwischenstand bleibt bei Zeitüberschreitung erhalten, nur Selbsttest).

(Tabelle und Befunde folgen unten – Stand wird während des Laufs fortgeschrieben.)
