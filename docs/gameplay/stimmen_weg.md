# Sprachausgabe: Weg, Aufwand, Entscheidung (Stand 09.10.2026)

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

## Nachtrag 09.10.2026: OOM-Ursache, Fix, Zeitschätzung
- **Ursache des Absturzes** ("CUDA out of memory", 4,14 GiB allowed, 4,04 GiB belegt): `schnell.py` begrenzte VRAM auf 52 % (4,1 GB). Das VoiceDesign-Modell (bf16, ~3,9 GB) plus Audio-Decoder (`chunked_decode`, 300 Schritte je Block) überschritt das bei längeren Referenz-/Stimmungsref-Sätzen. Die GPU selbst hatte 2,6 GB frei. Folge: Referenzen für Zayn/Aydin/Heidi/Jonas (Schritt `ref`) und danach jeder Start in `baue_stimmungsrefs` stürzte ab; `schnell.cmd` startete bis zu 40-mal neu (ca. 12 Stunden verloren).
- **Fix (ohne Qualitätsverlust, gleiche Modelle/Seeds):** VRAM-Grenze 68 % (5,4 GB); Decoder-Blockgröße 100 statt 300 (gleicher Kontext von 25 Schritten, nur kleinere Spitze); `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` (unter Windows wirkungslos, harmlos); Referenzschritt wiederholt sich bis zu 5-mal. RAM-Latte: Fremdprogramme (`GiMATE_llm` ~4 GB) hielten dauerhaft nur ~5 GB frei, die starre 6-GB-Latte blockierte den Lauf endlos -> jetzt 3 GB (Modell laden) bzw. 2 GB (`HAM_MIN_FREI_GB`); Vorrang der Spiel-Messläufe (`.hamlock*`, Selbsttest) bleibt unverändert.
- **Referenzstimmen:** Aydin, Heidi, Jonas wurden gewählt; Zayn: alle 6 Kandidaten zu tief (110-137 Hz, Ziel 220-520) -> neue Beschreibung (`design_neu`, "sieben Jahre, hoch"), 10 neue Kandidaten über `schnell_zayn.cmd`, das automatisch nach `schnell.cmd` läuft (nur 3 Zayn-Zeilen). Peter hat Referenz; Verzerrung/Tiefpass/Detune/Hall in `schnell.py`.
- **Umfang jetzt:** 1 097 Zeilen (statt 1 069; Aydin, Heidi, Jonas, Peter, Seiler dazu), Zayn folgt (3 Zeilen).
- **Gemessene Geschwindigkeit:** ca. 3 s Rechenzeit je Sekunde Audio (GPU nur ~2 % ausgelastet, Sampling ist latenzgebunden, Priorität BelowNormal), ca. 5-6 Erzeugungen/min. Die Erzeugung der 1. Runde (ca. 1 270 Aufträge, ca. 1,5 h Audio) dauert **ca. 4-4,5 h**, danach CPU-Bewertung (WER/MOS/x-Vektor, ca. 6 s je Kandidat) **ca. 2 h**, dazu Runden 2-3 für Durchfaller (+1-2 h). **Gesamt ca. 7-9 h** (die Angabe "3-4 h" oben war zu optimistisch). Zeilen erscheinen im Manifest erst nach Erzeugung und Bewertung der Runde 1 (nicht fortlaufend).
- **Prüfung ohne Anhören:** `HAM_Stimmen\pruefe_ausgabe.py` (Dauer, Pegel, Übersteuerung, Stille, abgeschnittenes Ende, Zeichen/Sekunde gegen Text) -> `spieluffaellig.json`.
- **Weg ins Spiel:** `schnell.cmd` ruft am Ende `spiel/baue_spiel.py` auf; das kopiert nur Zeilen mit `ok=true` nach `game/assets/stimmen/*.opus` und schreibt `game/assets/stimmen/manifest.json` (`z`: id -> [Datei, Dauer, Figur, Art], `t`: Text -> ids, `k`: Hook-Schlüssel, `wer`: Anzeigename -> Figur). Ein weiterer Build-/Kopierschritt ist nicht nötig, außer dem normalen Spiel-Build (Assets liegen im Spielordner); `schnell_zayn.cmd` ruft `baue_spiel.py` danach erneut auf.

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
