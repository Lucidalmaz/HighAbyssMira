# Aussprache der Dialogzeilen: Befunde und Vorschläge (09.10.2026)

Grundlage: alle 1 100 Zeilen aus `HAM_Stimmen\spiel\zeilen_meta.json`, Abgleich mit der bereits vorhandenen Ersetzungsliste `LEXIKON` in `pipeline.py` (wird vor der Erzeugung angewandt und auch für die WER-Rückprüfung). **Die laufende Erzeugung wurde nicht verändert**; alles hier sind Vorschläge für eine spätere Nacherzeugung einzelner Zeilen (`schnell.py` mit den IDs, danach `baue_spiel.py`).

## Schon abgedeckt (LEXIKON)
| Fall | Beispiel | Ersetzung |
|---|---|---|
| Regie `*…*` | `*Rauschen* … Bergung drei` | entfernt |
| Jahreszahlen | 1312, 1975, 1958, 1992, 2009, 2026 | ausgeschrieben |
| Kurzjahre | `’75`, `’58`, `’92` | fünfundsiebzig usw. |
| Datum | `dem 23.` | dreiundzwanzigsten |
| Großbuchstaben-Betonung | `HINTEN`, `MEINER`, `EISEN` | `Hinten` … (sonst buchstabiert); `LWO` bleibt |
| UFO | `UFO` | `Ufo` |
| Aydın | `Aydın(s)` | `Aydin(s)` |
| Akteneinträge | `K-1` … `K-3` | `K eins` … |
| Nr./Dr. | `Nr. 7` | `Nummer 7` / `Doktor` |
| Eyengless | `Lost Eyengless` | `Eiängless` |
| Wîse | `Kum, Wîse.` | `Wiese` |

## Offene Befunde (Vorschläge)
| # | Fund | Zeilen-ID(s) | Risiko | Vorschlag |
|---|---|---|---|---|
| 1 | Ziffer bleibt nach „Nummer“: `Nummer 7`, `Nr. 1`, `Nr. 7` | `basis_416f7edca4`, `post_08f18732a0`, `kapitel5_bcd7bdb055` | Ziffer wird evtl. als „sieben“/„eins“ gelesen, bei „1“ auch „ein“ | Regeln `\b(Nummer|Nr\.) ?1\b` → `Nummer eins`, `… 7` → `Nummer sieben` |
| 2 | Name **Zayn** (Z = „ts“ im Deutschen) | `basis_5677ed3056`, `basis_e4522df7e3`, `basis_7bb1d8331c`, `kirchberg_9ed0384179`, `kirchberg_bd5560bce8`, `traum_db27f8bf0f`, `weiss_111aca3664` | wird „Tsain“ statt „Sein/Zein“ gesprochen; muss zu Zayns eigener Aussprache passen | Vor Nacherzeugung mit 2 Proben prüfen: `Zayn` → `Sain` (weiches S, englisch „Zane“) oder `Zein`; dieselbe Schreibung für alle 7 Zeilen |
| 3 | Klammer-Regie im Text | `neben3_37ba67b193` „(summt)“, `lwo_eeac546e53` „Gut. (und später entscheiden)“ | Klammer wird wörtlich gesprochen | `fertig_einsetzen.cmd --einsetzen` schaltet beide **automatisch stumm**. Dauerhaft besser: Zeile im Spiel vom Sprechtext trennen (Summen = `mira_summen`-ähnliche Aufnahme) |
| 4 | Englische Sätze in deutscher Zeile | `neben6_1bb7f56792` „October. Ich bin am Kreis. Lamp up. Come home, W.“; `neben6_c0424d01f7` „Twenty metres. Ich senke jetzt die Lampe. For science.“; `hungrige_f6dc469af6` „Come ho–“ | Pell ist als English konfiguriert: deutsche Mittelsätze bekommen englischen Akzent; „W.“ evtl. „Wie“ statt „Double-u“ | Akzent als Geisterstimme akzeptabel; sonst Zeilen splitten oder „W.“ → „Double-you“ |
| 5 | Hundekommandos in Dialekt-Schreibung | `whiskey_f990f7ecfe` „Kum!“, `traum_7e0573ddd7` „Kum, Wîse.“ | „Kum“ kann als „Kuhm“ (lang) kommen | `\bKum\b` → `Komm` (gleiche Aussprache, normale Schreibung) |
| 6 | `Tips?` | `kiffen_c60659fe1d` | harmlos | `Tipps?` |
| 7 | Abgebrochene Wörter (Gedankenstrich am Ende) | `kapitel1_81fbd10252` „Gro–“, `basis_5bd72b04e5` „…nicht nach Hau–“, `hungrige_f6dc469af6` „Come ho–“, `lwo_1670434e59` „… HINTEN –“ | Modell spricht das Wortfragment oft als volles Wort, WER-Rückprüfung kann deshalb verwerfen | Wenn durchgefallen: Zeile mit Ellipse statt Strich testen („Gro …“); sonst bleibt sie stumm |
| 8 | Sehr kurze Einzelwörter | 35 Zeilen ≤ 6 Zeichen („Eins.“, „Zu.“, „Ja?“, „Such!“, „Pust.“, „Nebel.“) | Qwen3-TTS liefert bei Ein-Wort-Texten manchmal Schluckauf/zu lange Stille | Im Bericht (Länge/Zeichen-Rate) auf „zu kurz“ und „Stille“ achten; bei Ausfall mit Satzzeichen-Variante nacherzeugen („Eins.“ → „Eins …“) |
| 9 | Lange Zeilen (> 200 Zeichen) | 5 Zeilen, u. a. `justin_2ce91710ae`, `justin_9ce1e35d96`, `justin_b841684520`, `lwo_f24560920a`, `lwo_d3ffab0d36` | Tempo-/Abbruchrisiko, Ende abgeschnitten | im Bericht „Ende evtl. abgeschnitten“ beachten; bei Durchfall an Satzgrenzen in 2 Aufnahmen teilen |
| 10 | Wiederholte Wörter | `lwo_f24560920a` „… dass das das …“ | wird oft zu einem „das“ verschluckt (WER) | bei Durchfall „dass das, das“ mit Komma |
| 11 | Uhrzeit `03:13` | nicht im Text; steht als „drei Uhr dreizehn“ | – | nichts zu tun |
| 12 | Kürzel „Kap.“, Telefon-/Funknummern, Ordnungszahlen außer `23.` | keine im Text | – | nichts zu tun |
| 13 | Namen Heidi, Jonas, Seiler, Dina, Mira, Luna, Wendigo, Grete, Hofer, Kühn | – | Heidi „Haidi“, Jonas „Jonas/Yonas“ passen | Beim Gehörtest nur Heidi, Jonas, Wendigo und Aydın beachten |
| 14 | `ne?`, `äh`, `ne` | mehrere | Füllwörter werden meist korrekt gesprochen | nichts zu tun |
| 15 | Mehrdeutigkeit „Tenor“-Fälle (Wort-Betonung): „heil“, „Wiederhole:“, „Uns.“ | `lwo_258d4e49e2` u. a. | gering | nichts zu tun |
| 16 | Dialog mit verwaisten Anführungszeichen/Tags im Spieltext | `<i>…</i>` bei gefressenen Stimmen (hungrige.js) | Zuordnung geht über Normtext (Tags/Anführungszeichen werden gleich entfernt, getestet) | nichts zu tun |

## Nacherzeugung einzelner Zeilen (falls gewünscht, nach dem Lauf)
1. Neue Regel in `LEXIKON` (`pipeline.py`) ergänzen (erst nach Ende des Laufs ändern).
2. Betroffene IDs in der Ausgabe auf „nicht fertig“ setzen (Eintrag aus `spiel\ausgabe\manifest.json` entfernen) und `schnell.py spiel\zeilen.csv --out spiel\ausgabe --nur <figur>` erneut starten (fertige Zeilen werden übersprungen).
3. `fertig_einsetzen.cmd --jetzt`, anhören, `baue_spiel.py`.
