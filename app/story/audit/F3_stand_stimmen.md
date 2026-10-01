# Stand Sprachausgabe X-1, Phase 2 und 3 (01.10.2026)

## Kurz
- **Phase 3 ist fertig gebaut:** `app/mods/stimmen.js` steht in ORDER nach `klang` und vor `spannung`/`kino`. Damit liegt sein `subtitle`-Haken innen und spielt nur, was wirklich angezeigt wird.
- **Phase 2 läuft im Hintergrund:** Extraktion, Pipeline, Spiel-Manifest. Die Erzeugung ist resumierbar und läuft mit niedriger Priorität. Sie erzeugt nur, solange mehr als 4,5 GB RAM frei sind. Wird es knapper, gibt sie das Modell frei und wartet. Zum Laden braucht sie 6 GB frei.
- **Das Spiel holt Stimmen zur Laufzeit:** `stimmen.js` liest `game/assets/stimmen/manifest.json` per fetch. Nach jeder Figurengruppe schreibt `baue_spiel.py` das Manifest neu. So erscheinen neue Stimmen ohne Neubau im Spiel.
- Zahlen zum Erzeugungsstand: Abschnitt „Stand der Erzeugung“ (wird nachgeführt).

## Extraktion (Phase 2)
- Werkzeug: `C:\Users\GIGABYTE\HAM_Stimmen\spiel\extrahiere.js` (acorn-AST über Basis und alle Module in ORDER), Sprecherliste `sprecher.js`. Ausgaben: `zeilen.csv` (`id`, `sprecher`, `text`, `stimmung`, `stil`), `zeilen_meta.json`, `zeilen_alle.json` (jede Fundstelle mit Grund), `wer.json`.
- **Erfasst:**
  - Aufrufe: `subtitle`, `say`-Tupel, `kino_sag`, Kino- und Traum-Shots, `lwo_zeile`, `lwo_funk`.
  - LWO-Szenen `[Code, Text]` und Antwortwahl `wahl: [{ t }]` (Luke spricht, außer `stumm`).
  - Hüllfunktionen um `subtitle` (`post_zeile` → GÜNTHER, `kapitel1_zeile` …), automatisch erkannt.
  - `hungrige_stimme` mit Hook-Schlüssel, `WHISKEY_MIMIC` (Whiskey ahmt Stimmen nach), das zählende Kind im Traum (`traum_zaehlen_*`).
- **Stumm bleiben:**
  - Gedanken (`'LUKE'`, Traum-Art `gedanke`).
  - Erzählung ohne Sprecher, Geräuschangaben `[…]`, Beschriftungen (AP-/V-/AG-Codes, Schilder, Tafel, NACHBILD).
- **ID:** `<modul>_<sha1(modul + Normtext)[:10]>`. Normtext = ohne Tags und Anführungszeichen. Gleicher Text bei gleicher Stimme wird nur einmal erzeugt.
  - Geänderte Story-Zeilen bekommen eine neue ID und werden nacherzeugt. Verwaiste Dateien löscht `baue_spiel.py`.
- **Ergebnis:** 2310 Fundstellen.
  - 1035 eindeutige Zeilen werden vertont.
  - Stumm bleiben 413 Gedanken, 563 Erzählung, 49 Beschriftungen, 40 leere/Daten und 55 Zeilen ohne Besetzung (s. u.).
- **Stimmung** wird aus dem Kontext abgeleitet:
  - Flüstern: „?“-Stimmen, psst/leise.
  - Angst: Ausruf + lauf/weg/raus/nein …
  - Wut: Ausruf + verdammt/hau ab …
  - Zärtlichkeit: Großer, Kleiner, hab dich lieb …
  - Erschöpfung: müde, kann nicht mehr …
- **Aussprache** (`LEXIKON` in `pipeline.py`):
  - Eyengless → Eiängless, Wîse → Wiese, K-1 → K eins, ’75 → fünfundsiebzig.
  - Jahreszahlen ausgeschrieben (1312, 1975, 2009 …).
  - *Regie* entfernt, UFO → Ufo.
  - GROSSBUCHSTABEN-Betonung wird nicht buchstabiert.
  - oğlum/Aydın.
  - Die Verständlichkeitsprüfung (WER) vergleicht jetzt mit der gesprochenen Form.

## Besetzung (Änderungen in Phase 2)
- **Nachsorge 12:** neue Referenz. Nächste andere Figur ist jetzt Hofer (0,52) statt Justin (0,59).
- **Pfarrer Voss:** neue Referenz, heller Tenor, 127 Hz. Nächste andere Figur ist jetzt Funk (0,33) statt Justin (0,57). Damit ist der Justin-Cluster aufgelöst.
- **Nachsorge 11:** Alle hohen Kandidaten klangen weiblich (220–280 Hz, nahe Lucy/Gisela). Die alte Referenz bleibt; der Abstand zu Justin beträgt jetzt 0,56.
- **Kinder:**
  - Anni bekam eine neue Referenz (244 Hz, MOS 3,5). Sie liegt jetzt nahe am echten Luke (0,64) statt an Luna (0,73).
  - Der echte Luke behält seine Referenz: Alle „rauen Jungen“-Kandidaten lagen bei 130–210 Hz, also zu alt.
- **Neu besetzt** (Vollmacht des Nutzers, nur entworfene Stimmen):
  - **Mira** (Rabe im Traum, „?“-Frauenstimme in der Villa, Whiskeys „Kum!/Such!/Luna.“), **Dina**, **Zayn**, **Seiler**.
  - Referenzwahl für **Frau Aydın**, **Heidi** und **Jonas** folgt nach Kap. 1–3. Zayn: keine passende Kinderstimme gefunden.
- **Ohne Stimme bleiben** (zu wenige Zeilen oder unklare Identität):
  - die Nimmerheim-Kinder (KIND, JUNGE, EIN MÄDCHEN, ROXY 8, LARS VEGAS 9)
  - ARBEITER (9 Zeilen)
  - Cleo, Chef, Frau Reuter, „EINE FRAUENSTIMME“, „EINE MÄNNERSTIMME IM NEBEL“, „STIMME“ (2 Zeilen, Sprecher unklar)
  - Whiskeys Rabenrufe als Rabe

## Spielmodul `stimmen.js` (Phase 3)
- **Zuordnung:** Untertitel → Normtext → Manifest. Der Anzeigename wählt die Stimme (`wer`). Bei unbekanntem Sprecher bleibt die Zeile stumm, damit nie eine fremde Stimme erklingt.
- **Haken `stimmen_spielen(key, pos)`:** liefert den Ort nach (Traum), spielt per Schlüssel (Whiskey, zählendes Kind, gestapelte Wendigo-Zeile „Hunger.“) oder gibt den Ort an den folgenden Untertitel (Wendigo-Stimmen, Pell-Band). Rückgabe `true` = die Stimme läuft, der Rückfall-Hauch entfällt.
- **Klangwege:**
  - **Welt:** räumlich über `Audio.at`, also Welt-Bus mit Raumhall und Verdeckung. Positionen: Vegas an der Tür, Justin, Nachsorge 11/12 und Wolter (LWO-Figuren).
  - **Ohne Ort:** mittig über den Welt-Bus (Raumhall); Lukes eigene Stimme −1,4 dB.
  - **Funk/Telefon/Band/Mailbox/Lautsprecher:** Bandpass 320–3300 Hz, Präsenz +5 dB, leichte Sättigung, trocken.
  - **Gefressene Stimmen („…?“):** trocken, HRTF, ohne Raum.
  - **Whiskey:** Rabenmund (Bandpass 1,5 kHz, +2 HT).
  - **Luna:** leise Spieluhr darunter (`lucy3_tines`).
- **Timing:**
  - `say()` wartet, bis die Stimme ausgesprochen ist; die Lesezeit bleibt Mindestdauer. Auch `lwo_ms` wartet auf die Stimme.
  - Die nächsten Zeilen eines Blocks werden vorgeladen.
  - Sprecherwechsel: Läuft die vorige Zeile höchstens noch 1,4 s, wartet die neue. Sonst wird weich abgeblendet.
  - Pause (ESC) hält die Stimme an und setzt sie fort.
- **Laden:** Das Manifest wird per fetch geholt, die Dateien erst beim Abspielen (`fetch` + `decodeAudioData`). Kein base64.
- **Mund:** Je Bild ruft der Tick `figuren_mund(stimme, pegel)` mit der Analyser-Hüllkurve auf (Pegel-Weg aus `figuren.js`). `stimmen_pegel()` liefert den Pegel für andere Module.
- **Ducking:** Das vorhandene in `klang.js` (Betten −4 dB, Musik weicht bei Untertitel/Gespräch). Da `say()` den Untertitel so lange stehen lässt wie die Stimme, greift es über die ganze Zeile.
- **Einstellungen:** „Sprachausgabe“ an/aus und „Lautstärke Sprache“ (0–150 %), eingefügt wie bei `spannung.js` (`settings.stimmen`, `settings.stimmenVol`).
- **Testzugang:** `window.__stimmen` mit `zustand`, `spiele`, `kino`, `sub`, `init`. Im Release-Bau wird er entfernt.

## Stand der Erzeugung (01.10.2026, 14:00)
- **Zeilen:** 1100 werden vertont (Story-Prüfung A und B eingearbeitet, neu extrahiert).
  - Davon 687 Hauptweg Kap. 1–3 (`zeilen_a.csv`), 152 Nebenaufgaben Kap. 1–3 (`zeilen_b.csv`), 261 Kap. 4–6.
  - Reihenfolge in `phase2_erzeugen.cmd`: A, dann B, dann Miras Summen, dann Referenzen aydin/heidi/jonas, dann der Rest.
- **Vertont im Spiel: 0.** Ohne Stimme sind derzeit also alle Zeilen; die Untertitel laufen unverändert. Zwei Gründe:
  1. **Smart App Control (Windows) blockiert seit heute Vormittag unsignierte DLLs der Stimmen-Python.**
     - Zuerst blockierte es `av/sidedata/encparams.pyd`; das ist umgangen, weil PyAV nicht nötig ist (Platzhalter `_stubs_av`).
     - Seit 13:46 blockiert es auch `DLLs\select.pyd` der Python-Installation selbst (CodeIntegrity-Ereignisse 3077/3118).
     - Folge: **Jeder neu gestartete Python-Prozess der Pipeline bricht ab.** Der laufende Prozess (Luke, Kap. 1–3, Runde 2/3) arbeitet weiter, die folgenden Schritte scheitern.
     - Lösung nur durch den Nutzer: Smart App Control ausschalten (in Windows 11 nicht ohne Neuinstallation wieder einschaltbar), oder die Werkzeuge auf ein signiertes Python (python.org 3.13) neu aufsetzen. Letzteres heißt die Pakete neu laden (ca. 3 GB, torch cu128) und ist nicht sicher, weil auch Paket-DLLs blockiert werden können.
  2. **Die Stimmtreue der Klone ist zu niedrig:**
     - Luke liegt im Median bei 0,48 (0,13–0,58), Schwelle 0,70. Häufigster Verwerfungsgrund: zu nah an `radio`. WER (meist 0) und MOS (3–4) sind gut.
     - In Phase 1 lagen einzeln erzeugte Klone bei 0,80–0,86.
     - Verdacht: die Bündelung (4 Zeilen je Aufruf) verschlechtert die Sprecher-Konditionierung. `--batch` steht wieder auf 1.
     - Prüfen konnte ich das wegen Punkt 1 nicht mehr. Zu prüfen ist auch die Zentrierung mit jetzt 29 Referenzen.
  - Die Qualitätsregel bleibt hart: Keine Zeile unter den Schwellen kommt ins Spiel.
- **Tempo unter Last:** Die Spieltests der anderen Agenten belegen fast den ganzen RAM; die Erzeugung wartet die meiste Zeit. Runde 1 für 131 Luke-Zeilen dauerte 5,6 h. Bei voller Maschine rechne ich mit 1–2 Tagen für alle Zeilen.
- **Peter (Zahn-Mann):**
  - Die neue Referenz „tief, heiser, gebrochen“ wurde nicht übernommen. Kandidaten mit 92–108 Hz lagen nahe an Justin/Hofer; die hellen (138–158 Hz) fielen durch den Grundton-Bereich. Die alte Referenz bleibt.
  - „Bruder.“, „… raus …“, „… Lu… ke …“: Stimmtreue 0,40–0,50, deshalb ohne Stimme. Das Atmen/Lachen in `feuer.js` bleibt.
- **Referenzen neu:** Mira (nächste Figur Hilde 0,53), Dina (Mama 0,55), Seiler (Pell 0,45).
  - Zayn: keine Kinderstimme gefunden (alle Kandidaten 110–137 Hz), bleibt stumm.
  - Aydın, Heidi, Jonas folgen in der Kette.
- **Miras Summen (T-4):**
  - `spiel/summen_mira.py`: Klon und Entwürfe „Mmmh…“ werden mit dem WORLD-Vocoder auf E D C H C gesetzt (0,62 s, letzter Ton 1,05 s). Gemessen: 330/291/251/247/260 Hz. Kein Oszillator; Klangfarbe und Atem sind ihre.
  - Steht in der Kette; im Spiel ersetzt es `hungrige_summen`, sobald die Datei da ist. Sonst bleibt das Synth-Summen.

## Kurz geprüft (zwei Läufe über `_testgate.sh`, `_x1_run.sh`, Schritte `C:/Users/GIGABYTE/_x1_t/mk.js`)
- Bau fehlerfrei. Das echte Manifest wird geladen (0 Zeilen).
- Mit einem eingesetzten Testmanifest (vorhandene Aufnahme `audio/sc_whisper.ogg`):
  - **Figur in der Welt** (Vegas, räumlich): `welt@22,1.5,110`, Hüllkurve 0,76.
  - **Funk** (Kühn, Mailbox): Weg `funk`, Hüllkurve 0,71.
  - **Kino-Zeile:** `kino_sag` → Untertitel-Warteschlange → `subShow` → Stimme läuft, Untertitel steht.
  - **Gedanke** (`LUKE`) mit gleichem Text: keine Stimme.
- Lazy-Load per fetch: 0 Fehler.

## Weitere Einbauten
- **Neue Untertitel-Warteschlange der Basis:** Die Stimme hängt jetzt an `subShow`, spricht also, wenn die Zeile wirklich erscheint. Rückfall: `subtitle`.
- **T-3 (Kap. 6, Anruf):** Während `k6_anrufLucy` laufen alle Stimmen außer Lukes über den Telefonfilter. Das ist eine Hülle in `stimmen.js`, keine Änderung an `kapitel6.js`.
- **Peter:** Seine Stimme sitzt räumlich an der Figur (`zombie.g`).
- **Mund:** `figuren_mund(stimme, pegel)` je Bild (Pegel-Weg aus `figuren.js`); Luke ausgenommen.
- **Manifest:** Einträge können eine eigene Lautstärke tragen (`z[id][4]`, Summen 0,4).
- **`neben5.js` (Einunddreißig Flaschen):** Lukes Antworten an Vegas standen als `LUKE` (= Gedanke, kursiv, stumm). Sie stehen jetzt auf `DU`; das ist eine Zeile im Helfer `L`.
- **Extraktion erweitert:** Fragebänke `{ q, a, a2 }` (Hilde, Raum 2), Tupel-Helfer `const V = (t, ms) => [t, ms, 'VEGAS']`, `NACHSORGE 11/12 (FUNK)`.

## Bitten / Hinweise an andere
- Ändert die Story-Prüfung Zeilen, danach erneut ausführen: `node spiel\extrahiere.js`, `node spiel\teile.js`, `phase2_erzeugen.cmd`. Nur neue IDs werden erzeugt.
- `game/assets/stimmen/` mitcommitten (Opus, ca. 15–25 KB je Zeile).
