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
  - Referenzwahl für **Frau Aydın**, **Heidi** und **Jonas** folgt nach Kap. 1–3.
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

## Stand der Erzeugung
(wird nachgeführt)

## Bitten / Hinweise an andere
- Ändert die Story-Prüfung Zeilen, danach erneut ausführen: `node spiel\extrahiere.js`, `node spiel\teile.js`, `phase2_erzeugen.cmd`. Nur neue IDs werden erzeugt.
- `game/assets/stimmen/` mitcommitten (Opus, ca. 15–25 KB je Zeile).
