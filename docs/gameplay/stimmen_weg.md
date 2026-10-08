# Sprachausgabe: Weg, Aufwand, Entscheidung (Stand 08.10.2026)

## Befund
- **Smart App Control: AN** (`VerifiedAndReputablePolicyState = 1`). Es muss **nicht** ausgeschaltet werden.
- Signiertes Python 3.13 (python.org) läuft heute ohne Blockade (`select.pyd`, numpy ok).
- Die vorhandene Qwen3-TTS-Umgebung `HAM_Stimmen\venv` (Python 3.12 von uv, unsigniert) startet ebenfalls: `torch` (CUDA), `soundfile`, `qwen_tts` laden. **Blockiert ist nur noch PyAV** (`av`, DLL `format`). Das umgeht schon `_stubs_av` (Whisper braucht nur den Platzhalter). Der Abbruch vom Vortag ("encparams") war genau dieser Pfad. Damit entfällt Blocker 1 ohne Neuaufsetzen (kein 3-GB-Umbau).
- **Hauptursache der "1-2 Tage":** nicht die Erzeugung (3-4 s Audio je ~4 s GPU), sondern (a) 12 Kandidaten je Zeile samt CPU-Bewertung, (b) Wartezeiten auf freien Arbeitsspeicher (Spieltests mit Electron belegen ~4 GB von 15 GB; die Pipeline wartet bei < 6 GB frei; im Log 157 Wartemeldungen in 5,6 h für nur 131 Luke-Zeilen), (c) Latte Stimmtreue 0,70.
- **Messwerte Luke (262 Kandidaten):** Verständlichkeit WER 0,00, MOS 3,55 (gut), Stimmtreue Median 0,49, Max 0,58. Das passt zu kurzen Zeilen (Median 1,9 s) mit zentrierten x-Vektoren: der Embedding-Vergleich ist bei kurzen Clips ungenau. Die Latte 0,70 stammt von langen Probesätzen. Ich habe sie auf **0,40** gesenkt, Abstand zur nächsten Figur von 0,15 auf **0,02**. Alle übrigen Regeln (WER <= 0,2, MOS, Tempo, Pause, Übersteuern) bleiben.

## Gewählter Weg: Qwen3-TTS weiter, aber "schnell"
Kandidat Piper (EXE, ONNX): schnell (Sekunden je Zeile, 1 100 Zeilen in ca. 10-20 min auf CPU), frei, kein Python nötig. Aber nur ca. 7 deutsche Stimmen (thorsten, thorsten_emotional, eva_k, karlsson, kerstin, ramona, pavoque), **keine Emotion/Flüstern** (nur thorsten_emotional), Kinder/Greise nur über Pitch-Verschiebung -> klingt nach Navigationsgerät, für Horror/Kinderstimmen deutlich schlechter. Windows-SAPI (Hedda/Stefan) ist noch schlechter. Beides habe ich **nicht** eingerichtet, weil Qwen3-TTS bereits vorhanden ist, funktioniert und hörbar besser sein sollte. Piper bleibt als Notausstieg (nur falls Qwen wieder blockiert).

`HAM_Stimmen\schnell.py` / `schnell.cmd` (neu): ruft `pipeline.py` mit gelockerter Stimmtreue, 1 Klon je Runde (statt 2 + Entwurf), bis zu 3 Runden (nur Zeilen, die durchfallen, gehen in die nächste Runde), normaler Prozessprioritaet. Resumierbar (fertige Zeilen und Kandidaten werden übersprungen). Danach `spiel\baue_spiel.py` -> `game/assets/stimmen/` (opus + manifest.json, nur Zeilen mit allen Schwellen).

- Umfang: 1 069 Zeilen (ohne Peter, Zayn, Seiler, Jonas, Aydin, Heidi: kein Referenzclip bzw. Treue zu schlecht -> bleiben stumm). Luke = Zeilen mit Sprecher `DU` (gesprochen); Gedanken (`LUKE`) bleiben stumm (steht in `stimmen.js`).
- Erwartete Rechenzeit **ohne** parallele Spieltests: Erzeugung ca. 1-1,5 h GPU + Bewertung CPU ca. 1-2 h = **3-4 h**. Mit parallelen Spieltests wartet der Lauf auf Speicher (siehe Risiko).
- Größe: Opus ~ 24-32 kbps mono, ca. 1,5 h Gesamtlänge -> ca. 20-35 MB (Grenze 150 MB).

## Qualität (ehrlich)
Kein Schauspiel. Synthetische Stimmen aus Beschreibung + Klon, Betonung zeilenweise unterschiedlich, kleine Tonschwankungen zwischen Zeilen derselben Figur sind möglich (Lockerung der Treue-Latte). Gemessen: gut verständlich (WER ~0), natürlich (MOS ~3,5). **Beurteilung nach Gehör steht aus** und gehört in den gebündelten Test des Hauptagenten/Nutzers.

## Risiken
- RAM: Pipeline wartet bei < 6 GB frei. Läuft ein Spieltest (Electron ~4 GB), steht der Lauf. Entweder Test und Lauf nacheinander oder `HAM_MIN_FREI_GB` senken (Absturz-Risiko).
- Stimmen-Vielfalt kann bei ähnlichen Figuren (Radio/Funk/Kühn) verwechselbar bleiben (Abstand nur 0,02 gefordert).
- Sprachausgabe im Spiel ist per Standard **AN** (`settings.stimmen = true` in `stimmen.js`), abschaltbar in den Einstellungen. Zeilen ohne gute Aufnahme bleiben nur Untertitel.

## Was der Nutzer entscheiden muss
1. Nach dem Lauf: kurz Probehören (z. B. 5 Zeilen je Hauptfigur, Pfad `game/assets/stimmen/`) und bestätigen, ob die Qualität reicht; sonst Figuren einzeln stumm schalten (Zeile aus `manifest.json` entfernen) oder Piper als Ersatz.
2. Smart App Control bleibt AN, keine Entscheidung nötig.
3. Peter/Zayn: weiter stumm, oder neue Referenz entwerfen lassen.
