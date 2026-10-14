# Abschluss-Gate (12.–14.10.2026) – ehrlicher Stand

Note = Schulnote. Werkzeuge: `C:\Users\GIGABYTE\_abs\` (abs.py, seq.py, kbatch.sh, collect.py), `_anim`, `_qa_bew`, `_qa_kol`, `_zst`, `_gen`. Bilder: `fotos_1310/`.
Leistungs-Gate (`perf_gate.mjs`, Median aus 3 Läufen, frischer Prozess): **BESTANDEN** (Ladezeit 70,1 s, GPU-Speicher 1854 MB, JS-Heap 2835 MB, Kreuzung p95 60,6 ms, Neukompilierungen 44 = Referenz).

## A. Regressions-Gate je Fehlerklasse
| Fehlerklasse | Messwert / Bild | Note | prägnant | Status |
|---|---|---|---|---|
| Rückwärts/Seitwärts/Disco-Kopf (Lebewesen) | Kap. 1–6: 74/64/80/62/66/64 Rigs, 72/62/77/60/64/63 Köpfe gemessen; Kopf-Flicker (Hin-und-zurück >35°/Bild) **0** in allen Kapiteln. Ratten/Mammals: Kopf gegen Bewegung 2–6° (die „176°“ der Körperachsen-Messung = Links/Rechts-Namen vertauscht, nicht rückwärts). Krähen: Kopf-Clip-Auslenkung ≤ 62° (IdleLookAround 54°, ≤ 15° je Schlüssel); „turns 9–11“/„back 10–15“ = Messartefakt (Schräglage, Kopf senkrecht) | 2 | ja | grün |
| Schwebende Objekte/Decals | `schweben.js` nach Korrektur: gut 750 / schwebt 4 / neben 2 / steckt 1 / hängt 116 (1932 Einheiten). Strenges Audit: „schwebt“ 122 (10.10.: 112), fast alle Dinge auf Tischen/Regalen/Masten ohne erkennbare Fläche; Stichprobe 14 im Bild (Anrichte, Kantine, Archiv, Regal, Nr. 9 …): alle liegen auf. Nicht im Bild: Bus, Hochsitz-Stuhl, Käfiglampen (hängen) | 2 | ja | grün (Stichprobe) |
| Kreidepfeile | `kreidepfeil_vor.jpg` (dunkel) → `kreidepfeil_glimmen.jpg` (hell, liegt auf Asphalt) | 2 | ja | grün |
| Flache 2D-Auftritte / graues Gesicht | kein Code-Pfad mit flachem Porträt, Szenen-Scan unverändert, im Lauf nicht aufgetreten | 2 | ja | grün |
| Fenster-Figuren | Nr. 7: 3D-Figur hinter Glas (`fenster_nr7_4m.jpg`); 2 Rigs fig=true fail=false; Nr. 3 nachts ohne Warmlicht, dunkel; Nr. 8 nicht eigens aufgenommen | 2 | ja | grün (Nr. 8 nicht belegt) |
| Graue Klötze/Baukasten | Prim-Scan 1007 Meshes (10.10.: 1104); Kontaktbögen aller 36 Räume `rooms_a/b/c.jpg`: möbliert, keine grauen Quader | 2 | ja | grün |
| Kapelle innen | `kap_a_aus.jpg` / `kap_a_an.jpg`: Vertäfelung, Pfeiler, Balken, Bänke, Läufer, Kreuz, Kerzen, Buntglas; mit Lampe gut lesbar | 2 | ja | grün |
| Fahrzeuge | 9/8/8/10/8/10 Fahrzeuge Kap. 1–6: steckt/gefangen/im Objekt 0; „n/a“ = Anlauf an der Kartengrenze | 2 | ja | grün |
| Requisiten (300 je Kap.) | 0 steckt, 0 gefangen, 0 im Objekt | 2 | ja | grün |
| Interaktions-Physik | 103/102/78/80/82/88 Zeilen, 0 Ausnahmen; je 3 „unsichtbar“ = Nr.-1-Möbel (erst Kap. 5 gebaut, wie 11.10.) | 2 | ja | grün |
| Kap.-6-Sweep (frischer Prozess) | 558 Interaktionen, 257 mit Fund, 0 Fehler | 2 | ja | grün |
| Wände/Türen (qa_kol B+C) | Türen 102–103, auffällig 32/32/32/34/33/30 (10.10.: 29–30; +3: Nr.-4-Attrappe am Kühlschrank, „In den Keller“ Nr. 7 = Bodenplatte, Villa-Kellertür = Attrappe). „Durchgedrückt“ 5–9 → 33–101: Birken im Weiß-Raum (33) **echter Fehler, behoben**; Rest ruhende K3-Räume in Kap. 4–6 (Kapelle, Schuppen, Amt unerreichbar), Bettzeug/Laub/Baumkronen (weich), geöffnete Türblätter. Der Lauftest der übrigen Kandidaten war durch Kontextverlust ungültig und wurde nicht wiederholt | 3 | ja | gelb |
| Teil A (Stresstest Wände) | nicht erneut gelaufen | – | – | nicht belegt |
| Text weiter/überspringen | Enter → nächste Zeile, 2× Enter → übernächste, X → alles sofort, Toast mit Enter weg, 1,34 m Bewegung während Text | 2 | ja | grün |
| „Festgesteckt?“ | 5 Punkte laufen, „Ein paar Schritte zurück“ → 5,0 m zurück, Hauptzustand/Items unverändert, danach 1,6 m gelaufen | 2 | ja | grün |
| Item-Ketten (E) | K1 8/8, K2 6/6, K4–K6 ohne Fehler; K3 durch Eröffnungs-Leine nicht neu (c31–c33 nicht gelaufen) | 2 | ja | grün (K3 nicht neu) |
| Rück-Teleport Kap. 2–6 | nichts Erledigtes kehrt wieder; nur Gegenstands-Gedanken und Erstmeldungen neuer Orte. r6 im verseuchten Prozess zeitüberschritten (Speicherdruck), im frischen Prozess 13 Orte ohne Stillstand > 105 ms | 2 | ja | grün |
| Speichern/Laden | K1 Mitte: 10 Abweichungen (Akku/Weltuhr/Speicherpunkt); K1 nach Band: Weiterspielen springt bewusst an die Kellertreppe (Ausfall wird wiederholt); K1 Ende 2 (Weltuhr); K2 Zelle/Messraum **0 von 718 Feldern**; K2 Klavier: **safeOpen + Akte 08 nach Laden erhalten** | 2 | ja | grün (K3–K6-Zyklen nicht gelaufen) |
| Doppeltexte/Sprecher | Namen per Alias vereinheitlicht; im Lauf nur künstliche Hook-Wiederholungen; kein Vollprotokoll K3–K6 | 3 | ja | teilweise |
| Kap.-2-Phasen/Karte/Ortsmarke | Phasen 1–5, 7, 8 im Fluss (6 nur per Teleport übersprungen); Karte K1/K2 und „NR. 7 · Hildes Haus“ lesbar | 2 | ja | grün |
| Schrift Karte/Ort/Tipp | auf `clamp(…vw…)` umgestellt, bei 1584 px lesbar (`karte1/2.jpg`, `ort.jpg`, `tipp_tabelle.jpg`) | 2 | ja | behoben |
| Richtungsmarke ◀ ▶ | **gestrichen**: Stimmen-Pipeline blockiert, `st_ort()` liefert ohne Aufnahmen keine Quelle; Sprechername bleibt | – | nein | begründet gestrichen |
| Klavier-Rätsel speichern | `tod_patch.py` + `tod.js`: `safeOpens(quiet)`, `lenaMet` ab abgeschlossener Verfolgung | 2 | ja | behoben, im Spiel belegt |
| Übergang K1→K2 | Gang gehen (Knick nach Süden), Kap. 2 beginnt, „1 VON 8 · DER TUNNEL“ | 2 | ja | grün |
| Soak | 2 Runden × 18 Orte: JS-Heap 3,87 → 4,04 → 3,36 GB, Ruhe stabil | 2 | ja | grün |

## B. Gefundene und behobene Fehler
1. `weiss.js`: Birkenstämme der Weiß-Räume waren durchlaufbar (Kollision beim Anlegen sofort abgeschaltet) → fest.
2. Klavier-Rätsel/Lucy-Szene nicht im Spielstand → gespeichert.
3. Karten-/Ortsmarken-/Tipp-Schrift bei 1584 px zu klein → skaliert.

## C. Durchlauf Kap. 1 → 6
Kap. 1 echt per E (Briefkasten → Tür → Zettel → Tastenfeld 3110 → Band → Ausfall → Keller → Wand) bis Kap. 2 durch den Gang, 0 Fehler. Kap. 2 per Hooks bis zum Finale („Die Stablampe“); Start Kap. 3 nicht abgewartet. **Kap. 3–6 Hauptweg nicht per Hook durchlaufen** (Kontingent). Ersatz: Kapitelstart, Interaktions-Sweep, Item-Ketten, Rück-Teleport je Kap. 3–6 (siehe A).

## D. Nicht belegt / offen
Kap.-3–6-Hauptweg und Speichern/Laden-Zyklen dort; Teil A des Stresstests; Fenster-Figur Nr. 8; Lauftest der „durchgedrückt“-Restkandidaten; Doppeltext-Vollprotokoll. Bekannt: kalter Start im frischen Profil lang (Shader-Cache).
