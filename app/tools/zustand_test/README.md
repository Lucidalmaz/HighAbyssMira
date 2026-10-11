# Zustands-Tests (11.10.2026)
Werkzeug für `docs/gameplay/zustand_audit.md` und `item_ketten_lauf.md`. Läuft gegen die Dauerinstanz (`C:\Users\GIGABYTE\_live.sh`, Modus normal).
Pfade in den Skripten (`C:/Users/GIGABYTE/_zst`, `_abn56/n_lib_step.json`, `barn.json`) sind die der Entwicklungsmaschine; die Bibliothek `n_lib_step.json` (T.use/T.reach/T.walk …) liegt dort.
* `mk.py out.json [-s0|-s0b] name=datei.js …` – Steps-Datei bauen (`-s0` Neues Spiel, `-s0b` Menüzustand ohne Start)
* `obs.js` + `obsfix.js` – Beobachter (protokolliert subtitle/toast/gedanke/questPop/playEcho/addItem …) · `ev.py` – Ausgabe gruppieren
* `s1.js` – Kapitelwahl N (setzt `window.__N`), 30 s beobachten · `jump.sh N` – Neuladen + Kapitelwahl + Zustandsausgabe
* `sweep.js` – Raster-Streifzug (253 Punkte + Innenräume) · `rueck.js` – Rück-Teleport zu Orten früherer Kapitel
* `p1a…p1k.js` – Kapitel 1 echt gespielt (E, Tastenfeld 3110, Rekorder, Ausfall, Werkbank, Wand)
* `cont.js` + `loadtest.sh NAME [basis.json]` – Weiterspielen + Snapshot-Vergleich (`cmp.py`)
* `ia_sweep.js` + `harvest.sh N` – jede Interaktion einmal auslösen, Funde protokollieren (Quelle der Funde in `app/mods/zustand.js`)
* `chain.js` + `chain_N.js` + `chain.sh N` – Item-Ketten per E (Teleport zum Fundort)
* `s3.sh N TAG` + `C:\Users\GIGABYTE\_fx\qa_c_schrift.js` – Schrift-Audit
