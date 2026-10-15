# Stimmen im Spiel: Einbau, Prüfung, Abdeckung (Stand 15.10.2026)

Auftrag: die erzeugten Sprachzeilen (WSL2-Lauf, `docs/gameplay/stimmen_bericht.md`) ins Spiel einsetzen, **alles oder nichts**, ohne Verschlechterung von Ladezeit, Speicher
und Release-Größe, und im laufenden Spiel prüfen. Alle Zahlen unten stammen aus Messungen dieser Sitzung (Dauerinstanz `_live.sh normal`, ein Fenster, GPU frei).
Gehörtest kann kein Werkzeug ersetzen: die Pegel-/Dauerprüfung ist objektiv, die Anhörliste (Abschnitt 7) bleibt beim Nutzer.

## 1. Ergebnis in Kürze

| Größe | Wert |
|---|---|
| Aufnahmen im Spiel (`game/assets/stimmen/*.opus`) | **1 126** (35,2 MB, nur finale Dateien, ohne `_varianten`) |
| Manifest (`manifest.json`) | 167 KB: 1 126 Zeilen `z`, 1 119 Textschlüssel `t`, 44 Hook-Schlüssel `k` |
| Figuren/Stimmen | 34 (28 aus dem Hauptcast + 6 neu besetzte Nebenstimmen, Abschnitt 2.3) |
| Fundstellen gesprochener Zeilen im Spielcode (Text × Sprecher × Modul) | 1 195 vertont, **0 ohne Stimme** (`app/tools/stimmen_abdeckung.js`) |
| Bewusst stumm | Lukes Gedanken (426 Fundstellen) und Erzähltext (570), siehe Abschnitt 5 und 6 |
| Objektive Note der eingesetzten Zeilen | alle ≤ 2 (`pruefung.json`): 668 × Note 1, 458 × Note 2; davon 37 Nachträge (20 × 1, 17 × 2) |
| Kette | `HAM_Stimmen\spiel\einsetzen.py` (Abschnitt 2.1), kein Eingriff in die WSL-Pipeline |

## 2. Was eingesetzt wurde

### 2.1 Auswahl und Kette
* `baue_spiel.py` nahm bisher nur Zeilen mit `ok=true` (Abstandsschwelle der Pipeline). 118 der 1 100 Zeilen hatten `ok=false`, bestanden aber die objektive Nachprüfung.
  Maßgeblich ist jetzt `pruefung.json` (Note ≤ 2); `--ohne-pruefung` stellt das alte Verhalten wieder her.
* Neu in `baue_spiel.py`: `alias.json` (Textvariante mit Zusatz spricht die vorhandene Aufnahme, z. B. „Kum, Wîse. – alt für Komm, Wîse.“ im Kino) und `gains.json`
  (Zeilen-Pegelausgleich, `z[4]`, nur Rabenmund-Zeilen).
* `spiel\einsetzen.py` = `baue_spiel.py` + Regie-Klammern wieder herausnehmen (wie `fertig_einsetzen.py --einsetzen`). Aufruf mit dem System-Python (nur Standardbibliothek):
  `python C:\Users\GIGABYTE\HAM_Stimmen\spiel\einsetzen.py`. Das `venv\Scripts\python.exe` ist in dieser Sitzung per Berechtigung gesperrt (Smart App Control), `fertig_einsetzen.cmd`
  läuft deshalb hier nicht.
* Regie-Klammern, bewusst nicht vertont: `lwo_eeac546e53` „Gut. (und später entscheiden)“ (Auswahltext), `neben3_37ba67b193` „(summt)“ und die beiden
  TONBAND-Zeilen „(Rauschen …)“ / „(Drei Klopfzeichen …)“ in `neben4.js` (Geräuschangaben).

### 2.2 Text im Spiel hatte sich seit der Erzeugung geändert
Der Abgleich der aktuellen Spieltexte mit der Erzeugungsliste (`extrahiere.js` gegen HEAD) ergab **12 neue Textzeilen und 9 veraltete Aufnahmen** (Traum-Fibel-Text des Raben,
Dina „Sieben Sitze“, eine Hilde-Zeile, zwei Kino-Zeilen). Diese 11 neuen Zeilen wurden mit derselben Pipeline (gleiche Referenzen, gleiche Prüfung) in WSL erzeugt und sind eingebaut
(Note 1: 4, Note 2: 7); die 9 veralteten Aufnahmen sind nicht mehr im Manifest, die Dateien liegen weiter im Lauf-Ordner. „Kum, Wîse.“ im Kino läuft über `alias.json`.

### 2.3 Nachbesetzung: gesprochene Zeilen ohne eigene Figur
Im Spielcode gab es 26 gesprochene Zeilen mit Sprechern, die keine Stimme hatten (STIMME, ROXY, KIND, JUNGE, EIN MÄDCHEN, LARS VEGAS, 9, EINE FRAUENSTIMME, FRAU REUTER,
EINE MÄNNERSTIMME IM NEBEL, ARBEITER, CHEF (AM TELEFON), TONBAND, BAND?, STIMME VON DRAUSSEN, CLEO, WHISKEY und DU). Sie sind jetzt zugeordnet (`spiel\sprecher.js`):

| Sprecher im Spiel | Stimme | Zeilen | Anmerkung |
|---|---|---|---|
| STIMME (Anruf, „deine eigene“) | luke (Funkweg) | 2 | Funkfilter über `^STIMME$` |
| STIMME VON DRAUSSEN, „… Lu–?“ | lucy | 1 | |
| WHISKEY und DU, „Scheiße.“ | luke (Rabenmund) | 0 neu | bestehende Aufnahme |
| WHISKEY („Kum!“, „Das ist bedauerlich.“) | Zuordnung nur über den Text | 0 neu | `ST_OHNE` in `stimmen.js` |
| BAND? („Station Nord, Seiler …“) | seiler | 1 | |
| TONBAND („… it’s counting again …“, „Danke.“) | pell, „Danke.“ mit der deutschen Männerstimme arbeiter | 2 | Pell spricht im Modell Englisch: „Danke.“ wurde als „Don’t care.“ erkannt |
| ROXY, 8 / EIN MÄDCHEN / KIND / CLEO | **kind_w** (neu) | 6 | Cleo: nur der zitierte Satz, Untertitel zeigt den ganzen Text |
| LARS VEGAS, 9 / JUNGE (auch Luke als Kind) | **kind_m** (neu) | 3 | |
| ROXY (erwachsen) | **roxy** (neu) | 1 | |
| EINE FRAUENSTIMME / FRAU REUTER, 2009 | **frau** (neu) | 2 | |
| ARBEITER / EINE MÄNNERSTIMME IM NEBEL | **arbeiter** (neu) | 7 | |
| CHEF (AM TELEFON) | **chef** (neu, Telefonfilter) | 1 | |

Die sechs neuen Stimmen wurden wie Zayn/Aydin/Jonas per VoiceDesign + `referenz_waehlen.py` bestimmt (je 6 Kandidaten, gewählt nach Verständlichkeit, MOS, Abstand zu allen anderen
Figuren, Grundton im Bereich). Gewählte Kandidaten: kind_w 3, kind_m 2, roxy 1, frau 4, arbeiter 5, chef 5; Definition in `/root/ham/besetzung.json` (WSL) und
`HAM_Stimmen\besetzung_wsl_1015.json`.

### 2.4 Pegel-Anpassungen im Spiel (`stimmen.js`)
Gemessen mit den 149 Figur×Modul-Zeilen (Abschnitt 4): trockene „gefressene“ Stimmen lagen im Median 5 dB unter den Weltstimmen, die Rabenmund-Zeilen (Bandpass 1,5 kHz) 10 dB.
* Weg `trocken`: Verstärkung 0,85 → 1,1.
* Rabenmund: der Bandpass nimmt je nach Stimme 5 bis 15 dB. Statt eines festen Faktors steht der Ausgleich je Zeile im Manifest (`z[4]`, aus `spiel\gains.json`, gerechnet
  mit Bandpass und Wiedergaberate 1,12 auf 5,5 dB unter dem Original; Faktoren 1,0 bis 2,8).
* Puffer-Speicher: zusätzlich zu 40 Zeilen jetzt höchstens 150 s dekodiertes Audio (≈ 29 MB). Die 40 längsten Zeilen wären 433 s ≈ 83 MB gewesen (längste Zeile 14,3 s).

### 2.5 Tod und Rettung
`todDie` und `tod_zurueck` (Rettung/„unter die Welt gefallen“) versetzen den Spieler, ohne Kapitelwechsel; eine laufende Stimme lief dabei weiter. Beide rufen jetzt `st_stop` (Wrapper in `stimmen.js`).
Gemessen: Zeile läuft → Rettung → 0 laufende Stimmen; Zeile läuft → Tod → 0 laufende Stimmen (`vt_tod`).
## 3. Ladezeit, Speicher, Größe

| Punkt | Messung / Begründung |
|---|---|
| Release-Größe Stimmen | 1 126 Dateien, **35,2 MB** (`release_check.mjs`: „Stimmen: 1126 Zeilen, 35.2 MB, 0 Fehler“, Grenze 150 MB). Gesamtlänge 75 min, Ø 4,0 s je Zeile. |
| Start | nur `manifest.json` (167 KB) per `fetch`, parallel zum Laden; keine Aufnahme wird beim Start dekodiert, kein base64 im HTML. |
| Beim Spielen | Datei erst beim Abspielen (`fetch` + `decodeAudioData`), `say()` lädt nur die Zeilen des eigenen Blocks vor. Start der Stimme nach Auslösen des Untertitels: Median 177 ms, 95 % ≤ 334 ms (149 Zeilen; Ausreißer 1 757 ms = erster Kaltstart einer Lautsprecher-Zeile). |
| Speicher | JS-Heap unberührt (Puffer sind Audiospeicher außerhalb des Heaps), gedeckelt auf 40 Zeilen / 150 s (≈ 29 MB). |
| Leistungs-Gate | `node app/tools/perf_gate.mjs` (3 Läufe, Median, Referenz 12.10.): **Lauf mit Stimmen (Endstand) bestanden** – Ladezeit 68,9 s [68,2 / 69,3 / 68,9] (Referenz 70,1 s), Modulphase 44 s, Grafikspeicher GPU-Prozess 1 865 MB (Ref. 1 851), JS-Heap Median 2 724 MB (Ref. 2 937), Shader-Programme 653 (Ref. 651), nr7_innen p95 72,7 ms [84,9 / 66,7 / 72,7] (Ref. 60,5; Grenze 86,6). Ein erster Durchlauf (Zwischenstand, gleiche Stimmen) hatte genau **einen** Wert über der Grenze: nr7_innen p95 90,8 ms [48,5 / 90,8 / 115,1]; Kontrolle mit leerem Manifest (keine Stimmen) lag bei 84,7 ms [96,9 / 54,5 / 84,7], also im selben Streubereich (Fremdlast 16–20 % in allen Läufen) – Messrauschen dieses Punktes, kein Stimmeneffekt; im zweiten Durchlauf mit Stimmen grün. Nach diesem Lauf kam nur noch der Wrapper für Tod/Rettung (`st_stop`, 2.5) dazu, ein einzelner Funktionsaufruf ohne Rechenlast, ungemessen. |

## 4. Funktionsprüfung im laufenden Spiel

Methode: Dauerinstanz, Seite mit eingeschaltetem Ton. Je Zeile wurde der echte Weg ausgelöst (`subtitle()` bzw. `say()`, `kino_sag()`, `stimmen_spielen(key, pos)` für Hooks),
gemessen hinter dem Begrenzer der Ausgabe (`Audio.lim`, was wirklich ausgegeben wird): Start, Sprecher laut Manifest, Zahl der gestarteten Quellknoten, Stimmdauer gegen
Untertitel-Sichtbarkeit (DOM), RMS der lauteren Hälfte der Stimme, Spitze, Bett vor der Zeile (Musik/Atmosphäre/Regen), Anteil unter 250 Hz.

### 4.1 Abdeckung der Prüfung
* **Kapitel 1 (Spielstart): alle 149 Kombinationen Figur × Quellmodul**, je eine Zeile (jede Figur in jedem Modul, aus dem sie spricht).
* **Kapitel 2 bis 6** (jeweils frisch geladen, Kapitel per Test-Hook gestartet, gleicher Weg wie `mk.js`): je Figur eine Zeile (34 Figuren × 5 Kapitel = 170 Zeilen, je Kapitel eine
  andere Zeile der Figur) plus Ablauftests (4.3) und Kapitelwechsel.
* **44 Hook-Schlüssel** (Traum, Wendigo-Stimmen, Pell-Band, Whiskey-Nachahmung, gefressene Stimmen), **7 Kino-Zeilen**, **Ablauf** (Enter, Klick, X, Pause, Aus-Schalter), **Tod/Rettung**.
Werkzeuge: `app/tools/stimmen_pruefung/` (README dort).

### 4.2 Ergebnis je Figur (Kapitel 1 vollständig, K2–K6 je eine Zeile)

Spalten: Zeilen im Spiel; Zahl der Module, aus denen die Figur spricht; getestete Module in Kapitel 1; K1–K6: Sprecher richtig, Stimme startet zum Text, Text mindestens
so lange sichtbar wie die Stimme (ja/NEIN); Pegel RMS Median (dBFS, am Ausgang); Abstand zum Bett (Median / Minimum, dB); Weg.

| Figur | Zeilen | Module | K1 Module getestet | K1 | K2 | K3 | K4 | K5 | K6 | Pegel RMS Median (dBFS) | SNR gegen Bett: Median / Minimum (dB) | Wege | Befund |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| luke | 203 | 14 | 14/14 | ja | ja | ja | ja | ja | ja | −16.9 | 18 / 9 | funk/rabe/trocken/welt |  |
| justin | 177 | 11 | 11/11 | ja | ja | ja | ja | ja | ja | −17.9 | 16 / 8 | trocken/welt |  |
| vegas | 108 | 13 | 13/13 | ja | ja | ja | ja | ja | ja | −16.7 | 15 / 7 | welt |  |
| wolter | 91 | 7 | 7/7 | ja | ja | ja | ja | ja | ja | −16.6 | 18 / 10 | rabe/welt |  |
| lucy | 84 | 11 | 11/11 | ja | ja | ja | ja | ja | ja | −17.1 | 18 / 12 | funk/trocken/welt | Zeilen über Funk/Tonband trocken, ruhig |
| luna | 63 | 12 | 12/12 | ja | ja | ja | ja | ja | ja | −17.2 | 19 / 12 | welt | Spieluhr darunter wie vorgesehen (Zählung zeigt 8 Quellstarts, 1 Stimme) |
| nachsorge11 | 59 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −16.4 | 20 / 19 | funk/welt |  |
| luke_echt | 50 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −17.4 | 14 / 10 | welt |  |
| funk_blechmann | 41 | 9 | 9/9 | ja | ja | ja | ja | ja | ja | −14.2 | 19 / 14 | funk |  |
| nachsorge12 | 39 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −14.4 | 22 / 21 | funk/welt |  |
| gisela | 32 | 4 | 4/4 | ja | ja | ja | ja | ja | ja | −18.2 | 15 / 9 | welt |  |
| hilde | 25 | 7 | 7/7 | ja | ja | ja | ja | ja | ja | −18.0 | 15 / 7 | rabe/welt |  |
| guenther | 20 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −17.6 | 16 / 12 | welt |  |
| mira | 20 | 4 | 4/4 | ja | ja | ja | ja | ja | ja | −19.5 | 15 / 5 | rabe/welt | Rabenmund-Zeilen (Whiskey) bleiben leise (Bandpass 1,5 kHz), siehe Abschnitt Pegel |
| dina | 16 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −15.9 | 19 / 16 | welt |  |
| aydin | 13 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −17.5 | 19 / 10 | welt |  |
| pell | 9 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −18.7 | 12 / 12 | funk/trocken |  |
| lautsprecher | 8 | 4 | 4/4 | ja | ja | ja | ja | ja | ja | −13.8 | 18 / 11 | funk |  |
| anni | 8 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −20.8 | 12 / 11 | trocken | leise (trocken, geflüstert), SNR 10–12 dB |
| heidi | 8 | 1 | 1/1 | ja | ja | ja | ja | ja | ja | −15.1 | 20 / 20 | welt |  |
| arbeiter | 7 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −19.6 | 14 / 12 | welt |  |
| kind_w | 6 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −17.9 | 19 / 17 | welt |  |
| hofer | 6 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −22.5 | 12 / 3 | trocken | leise (trocken, geflüstert): Median −22,5 dBFS, kürzeste Zeilen 1 s; verständlich nur bei ruhigem Bett |
| radio | 5 | 4 | 4/4 | ja | ja | ja | ja | ja | ja | −15.4 | 17 / 11 | funk |  |
| mama | 5 | 4 | 4/4 | ja | ja | ja | ja | ja | ja | −17.4 | 20 / 17 | funk/welt |  |
| kuehn | 5 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −13.8 | 24 / 24 | funk |  |
| seiler | 3 | 3 | 3/3 | ja | ja | ja | ja | ja | ja | −16.8 | 13 / 10 | funk/welt |  |
| kind_m | 3 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −19.9 | 15 / 10 | welt |  |
| zayn | 3 | 1 | 1/1 | ja | ja | ja | ja | ja | ja | −19.0 | 17 / 17 | welt |  |
| peter | 3 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −17.2 | 14 / 9 | welt | DSP-Zahn-Mann: Anhören |
| frau | 2 | 2 | 2/2 | ja | ja | ja | ja | ja | ja | −17.9 | 18 / 17 | welt |  |
| jonas | 2 | 1 | 1/1 | ja | ja | ja | ja | ja | ja | −16.2 | 21 / 21 | funk |  |
| roxy | 1 | 1 | 1/1 | ja | ja | ja | ja | ja | ja | −19.2 | 17 / 17 | welt |  |
| chef | 1 | 1 | 1/1 | ja | ja | ja | ja | ja | ja | −17.7 | 17 / 17 | funk |  |

Fußnoten
* „ja“ in K2–K6: alle 170 Messungen bestanden diese drei Kriterien (Sprecher, Start, Text-Dauer). Auffälligkeiten ohne Funktionsfehler: in K2 wurde bei zwei Zeilen (Arbeiter,
  Aydin) kein eigener Quellstart gezählt, während gleichzeitig Spielgeräusche liefen (Bett einmal −10,9 dBFS); in K3 zählten zwei Zeilen einen Zusatzknoten gleicher Länge (Umgebungsgeräusch);
  in K6 lagen im ersten Lauf drei Zeilen bei −32 bis −41 dBFS, eine Wiederholung derselben Zeilen im selben Zustand (12 Messungen) lag bei −16,6 bis −22,3 dBFS. Ursache nicht gefunden,
  nicht reproduzierbar (Pegel am Ausgang, `Audio.master` 0,9, `world` 1,0).
* Rohdaten der K2–K6-Läufe wurden vom Leistungs-Gate überschrieben (es leert `out/`); die Auswertung steht hier, die Kapitel-1-Zeilen liegen in
  `docs/gameplay/data/stimmen_k1_zeilen.json`.

### 4.3 Verhalten (je Kapitel 1–6 gemessen, `vt_flow`)
| Prüfung | Ergebnis |
|---|---|
| `say()`: Enter bricht die laufende Stimme ab und startet die nächste | Stimme 1 läuft; Enter bei 2 515 ms, Start von Zeile 2 nach 27 ms (Einzelmessung mit Zeitprotokoll), Quellstarts = 2 (kein Doppelstart) |
| X überspringt den Block | `say()` endet, danach 0 laufende Stimmen |
| Mausklick wie Enter | ja (Stimme 1 → Zeile 2) |
| Aus-Schalter „Sprachausgabe“ | 0 gestartete Quellen, 0 laufende Stimmen |
| Pause (`ui.paused`) | Stimme hält an (`halt`), setzt nach dem Fortsetzen fort |
| Kapitelwechsel (`setChapter` → `zustand_aufraeumen` → `st_stop`) | in K1–K6: Stimme vor Wechsel läuft, nach 0,7 s 0 laufende Stimmen; neue Zeile danach normal |
| Tod / Rettung (Teleport) | Stimme läuft → `tod_zurueck('schritt')` bzw. `todDie('zombie')` → 0 laufende Stimmen |
| Zustand (`zustand.js`, `__stimmen.zustand()`) | `fehl = 0`, `ctx = running`, kein hängendes Lade-Promise |
| Doppelstart über alle 149 Zeilen (je 0,75 s nach Auslösen) | 146 × genau 1 Quellstart, die 3 übrigen waren Messartefakte (Warteschlange des Untertitels, Spieluhr unter Luna: 8 Zinken-Quellen) und einzeln fehlerfrei wiederholt |
| 44 Hook-Schlüssel | 44 von 44 starten (`stimmen_spielen` liefert `true`), Start 45–211 ms, Sprecher laut Manifest; 2 Zählungen mit Zusatz-Quellknoten sind Umgebungsgeräusche gleicher Länge |
| 7 Kino-Zeilen (`kino_sag`) | 7 von 7: richtige Figur, Stimme läuft |

### 4.4 Pegel und Mischung
Alle Werte am Ausgang (nach Bus-Kompressor und Begrenzer) im Kapitel-1-Lauf, 149 Zeilen:

| Weg | Zeilen | RMS Median (dBFS) | Abstand zum Bett (Median) | Anteil < 250 Hz (Median) |
|---|---|---|---|---|
| Welt (Raum, räumlich) | 107 | −17,2 | 17,4 dB | 50 % |
| Funk / Telefon / Band (Bandpass 320–3 300 Hz, Sättigung) | 29 | −14,6 | 19,8 dB | **9,5 %** |
| trocken (gefressene Stimmen, vor Anpassung) | 9 | −22,5 | 12,4 dB | 63 % |
| Rabenmund (Whiskey, vor Anpassung) | 4 | −27,6 | 8,3 dB | 22 % |

* Gesamt: Median −17,0 dBFS (5 % −24,1; 95 % −13,7), Abstand zum Bett im Median 17,4 dB; unter 10 dB nur 14 von 149 (alle in lauten Szenen oder bei kurzen Flüsterzeilen von Hofer/Anni/Mira-Rabe);
  Spitze höchstens −0,7 dBFS, nie über 0 (der Begrenzer greift bei −2 dB, 48 Zeilen liegen zwischen −1 und −0,7).
* **Funkfilter wirkt:** Funkzeilen haben 9,5 % ihrer Energie unter 250 Hz gegen 50 % bei Weltstimmen (Hochpass 320 Hz), gleiche Kette für STIMME, CHEF, Kühn, Jonas, Blechmann, Lautsprecher, Radio.
* **Nach der Anpassung (2.4)** gemessen (13 Zeilen, Endstand): trockene Zeilen im Median −19,8 dBFS (vorher −22,5; flüsternde Anni/Lucy bleiben bei −25 bis −26); Rabenmund-Zeilen −22,9 bis −26,7 dBFS (vorher −25 bis −33), Abstand zum Bett 6 bis 11 dB.
  Die Rabenmund-Zeilen sind bewusst „nie sauber“ und bleiben die leisesten Zeilen; Whiskey spricht im Spiel an seiner Position (Entfernungsdämpfung dazu).
* Lauteste Zeile: Kühn (Funk) −12,6; leiseste Weltzeile: −24,7 (arbeiter, „Wer da?“, 0,7 s).
* Musik/Atmosphäre: Betten ducken während der Stimme (`klang.js`, unverändert), das Bett lag vor den Zeilen im Median bei −35 dBFS (K1) bzw. −36 bis −49 dBFS (K2–K6).

### 4.5 Untertitel-Dauer
Der Untertitel bleibt mindestens Stimmdauer + 0,35 s (`subShow`/`say`/`lwo_ms`). Gemessen über 149 Zeilen: **0 Fälle, in denen der Text vor dem Ende der Stimme verschwand**; Text bleibt
im Median 1,9 s länger als die Stimme (kleinster Überstand 105 ms), Überspringen mit Enter/Klick/X unverändert möglich (4.3).

## 5. Abdeckung: alle Textzeilen im Spiel gegen vertont

Messung mit `node app/tools/stimmen_abdeckung.js <zeilen_alle.json>` (Extraktion aller `subtitle`/`say`/`kino_sag`/Tupel/Hook-Fundstellen aus dem Spielcode, Zuordnung mit der
echten `st_finde`-Logik der Spielseite und dem ausgelieferten Manifest). 2 495 Fundstellen insgesamt:

| Gruppe | Fundstellen | Stimme | Grund |
|---|---|---|---|
| gesprochene Zeilen mit Sprecher (Dialog, Kino, Funk, Band, Traum, Wendigo, Whiskey) | 1 195 | **1 195 ja** | – |
| Sprecher ohne eigene Figur, jetzt besetzt | 3 | ja | Whiskey-Nachahmung (Zuordnung über den Text) |
| Lukes Gedanken (`LUKE`) | 426 | nein | bewusst stumm: innerer Monolog als Text (Entscheidung `stimmen_weg.md`, `stimmen.js`); 422 verschiedene Texte, ≈ 28 min Sprechzeit |
| Erzähltext ohne Sprecher | 570 | nein | Lesetext, keine Figur besetzt; 553 verschiedene Texte, ≈ 41 min |
| Kein Sprecher (Beschriftungen, Briefe, Plakate, Modellnamen im Code) | 63 | nein | keine Rede: Lesetext von Objekten |
| Einzelzeichen, Zahlen, Schachfiguren | 39 | nein | keine Sprache |
| Namen von Geräuschen/Modellen/Fibel-Fragen mit „?“ im Code | 85 | nein | Extraktions-Fehltreffer bzw. Lesetext (Fibel-Fragen Lukes) |
| NACHBILD, TAFEL, Ortsnamen auf Postkarten | 26 | nein | Beschreibungen/Beschriftungen, nicht gesprochen; dazu `LUCY (ohne Ton)` „Großer.“ (Lippenbild ohne Ton, Absicht) |
| Regie-Klammern | 4 | nein | Geräusch-/Handlungsangabe in Klammern (2.1) |

**Gesprochene Zeilen ohne Stimme: 0.** Die UI-Texte der Story-Führung (`fuehrung_texte.json`, 241 Einträge: Phase, Ortsmarke, Zielzeile, Tipp, Kapitelkarte, Gedanke/Faden, Warum) sind keine
Sprecherzeilen; die 64 mit „LUKE“/„LUKE · GEDANKE“ sind Gedanken (stumm), die 16 Sprecher-Kennungen sind Beschriftungen der Stimmen, die ihre Aufnahme bereits haben.

## 6. Offene Entscheidung für den Nutzer: Gedanken und Erzähltext
Der Auftrag nannte „Gedanken“ unter den gesprochenen Zeilen. Lukes Gedanken sind im Bestand Text ohne Stimme (Entscheidung stimmen_weg.md). Es gibt keinen Erzähler im Cast. Aufwand, falls
gewünscht (nicht gemacht, weil Pacing und Leistung betroffen sind):
* Gedanken mit der Luke-Stimme: 422 Texte, ≈ 28 min, ca. +13 MB; die Zeilen laufen über die Gedanken-Reihe (`gedanken.js`), nicht über `say()`; ein früherer Versuch (siehe
  `zustand_audit.md`, `gate_1010.md`) ließ zusätzliche, verworfene Gedanken sprechen und kostete Ladezeit (Straße 1,65 s) – Voraussetzung wäre eine eigene Prüfung der Reihe.
* Erzähltext: 553 Texte, ≈ 41 min, ca. +19 MB und eine neue Erzählerstimme.
Beides ist technisch derselbe Weg (Zeilen in `zeilen.csv`, `sprecher.js`, `stimmen.js` Zeile „`who === 'LUKE'`“ öffnen); es ändert das Spielgefühl und braucht eine Entscheidung.

## 7. Anhörliste (Nutzer, vor dem Release)
Zuerst die Figuren, deren Stimme per Nachbearbeitung (DSP) geändert wurde, danach die neu besetzten, danach Sonderwege:
1. **luna** (Note 2 durchgängig, MOS 2,0; Spieluhr darunter): `ausbau_nord_59be17d0aa`, `basis_0d577d250c`
2. **luke_echt** (46 × Note 2): `kapitel5_009996e145`, `kapitel5_0a49309979`
3. **anni**: `kapitel6_6c6fb92a5f`, `kapitel6_b408a36e85` (trocken, geflüstert, leise)
4. **peter**: `feuer_47f9e15d2c`, `feuer_5205467654` (Zahn-Mann, gebrochen)
5. **zayn**: `zayn_0d2e4e4b06`, `zayn_6056de0274`
6. Neue Stimmen: `kind_w` (`basis_1de473304e`, `cleo_9954ed461e`), `kind_m` (`basis_7c113dd6c6`, `neben3_fdaf3a7d73`), `roxy` (`ausbau_ost_west_7c864ef513`),
   `frau` (`kirchberg_bf82e55a98`), `arbeiter` (`lwo_f946067093`, `villa_77b2c9e3c9`), `chef` (`spannung_01c7f82dba`), TONBAND „Danke.“ (`neben4_68bf9cff50`)
7. Rabenmund-Zeilen (Pegel angepasst): `whiskey_fa1f734791` (Mira), `whiskey_b5a897e92c` (Wolter), `whiskey_3355be60aa` (Hilde), `whiskey_88a2cd96d1` (Luke)
8. Hofer (6 Zeilen, MOS 2,3, Stimmtreue 0,38): `hungrige_884ba9b10e`, `hungrige_94862a1c4a`
9. Vollständige Stichprobe je Figur: `docs/gameplay/stimmen_einsetzen.md` Abschnitt 3.

Worauf achten: richtige Figur (Alter/Geschlecht), Wörter verständlich, Betonung passt, Ende nicht abgeschnitten, Namen und Zahlen richtig gesprochen
(`stimmen_aussprache.md`), Lautstärke der Figuren untereinander.

## 8. Mira-Summen

Mira summt die fünf Töne (T-4, Kapitel 6) mit ihrer eigenen Stimme: `spiel\summen_mira.py` (Klon der Referenz + WORLD-Vocoder auf E4 D4 C4 H3 C4) wurde in WSL ausgeführt
(6 Klon- und 4 Entwurfs-Kandidaten). Objektiv gemessen am gewählten Kandidaten (`klon_0`, `HAM_Stimmen\spielusgabe\mira_summen.opus`, 3,53 s):

| Prüfung | Messwert | Soll | Ergebnis |
|---|---|---|---|
| Töne (pYIN, Median je Ton) | 329,0 · 293,1 · 261,2 · 247,2 · 262,7 Hz | 329,6 · 293,7 · 261,6 · 246,9 · 261,6 Hz | alle ≤ 1,1 Hz daneben |
| Stimmhaft je Ton | 95–100 % | – | ok |
| Pegel / Spitze | −16,0 LUFS / −6,9 dBFS (im Spiel × 0,4 über `gain`) | −16 LUFS | ok |
| Stimmtreue (x-Vektor gegen Mira) | 0,20 (alle 10 Kandidaten 0,07–0,20) | ≥ 0,6 | **nicht bestanden** |
| MOS (UTMOSv2, Sprachmodell) | 0,45–1,29 | – | für Summen nicht aussagekräftig |

Die Pipeline setzt `ok = false` (Stimmtreue-Schwelle für Sprache); `baue_spiel.py` trägt die Aufnahme deshalb **nicht** ein, das Spiel nimmt den bisherigen Synth-Summ-Weg (`hungrige_summen`, kein
Fehler, keine Lücke). Die Schwelle ist für gehauchtes Summen ohne Wörter nicht sinnvoll (Sprecher-Einbettungen sind für Summen nicht trainiert), die Melodie stimmt – ob es **klingt**, kann nur der Nutzer
entscheiden. Einschalten nach dem Anhören: in `HAM_Stimmen\spiel\extras.json` bei `mira_summen` `"ok": true` setzen, `python spiel\einsetzen.py`, Hook `mira_summen` ist in `stimmen.js` schon verdrahtet
(`k`-Schlüssel, Lautstärke `z[4]` = 0,4). Aus: `"ok": false` (jetziger Stand).

## 9. Befehle
```
python C:\Users\GIGABYTE\HAM_Stimmen\spiel\einsetzen.py                   (Einsetzen: pruefung.json, alias.json, gains.json, Regie-Klammern raus)
cd C:\Users\GIGABYTE\HighAbyssMira-Repo\app
node tools\test_stimmen.js                                                (Spielseite gegen künstliches Manifest)
node tools\stimmen_abdeckung.js C:\Users\GIGABYTE\HAM_Stimmen\spiel\zeilen_alle.json [--detail] [--md out.md]
node tools\release_check.mjs                                              (Manifest, Dateien, Ogg, Größe ≤ 150 MB)
```
Neue Zeilen später: `node HAM_Stimmen\spiel\extrahiere.js` (liefert `zeilen_meta.json`/`zeilen.csv`), fehlende Zeilen in WSL mit `schnell_linux.py`, `bewerte_linux.py` und `note.py`
erzeugen/prüfen, Dateien und Einträge in `spiel/ausgabe/manifest.json` + `pruefung.json` übernehmen, dann `einsetzen.py`.
