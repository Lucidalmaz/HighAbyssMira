# Abnahme Kap. 5/6 – Zwischenstand (09.10.2026, 14:50)

Instanz normal1 ist freigegeben (`_live.sh stop`). Die Läufe liefen auf der gemeinsam genutzten Instanz, teils gestört durch Reloads und `window.__T`-Überschreiben anderer Agenten. Die Ergebnisse unten gelten nur dort, wo ein Beleg genannt ist.

## Belegt (Läufe unter C:\Users\GIGABYTE\_live\normal1\out\_abn56_*, Kopien unter C:\Users\GIGABYTE\_abn56_*_out)
| Prüfpunkt | Beleg | Ergebnis |
|---|---|---|
| Kap. 5 durchspielbar bis Endkarte (Kamera, Foto 1, Gisela, Tisch, Schleife 3 Runden, Spieluhr, Heimweg, Lucy, Telefonzelle, Brot, Stall, Tappen, Friedhof/Kerze, Nordzaun/Gitter, Endkarte "KAPITEL 5 ENDE") | `_abn56_c5d` (steps.json k5_1..k5_9) | ok, aber mit Fallbacks des Läufers: Tappen-Weg Wegpunkte (siehe offen), Schleife-Läufe per Zeitlimit |
| Kap. 6 durchspielbar bis Endkarte (Gitter E halten, Krumen, Hütte, Zaunlücke, Wolle/Hochsitz, Bus-Falle "mit", Funk/Kette, Dienstbuch Seite 1 klickbar, Wrack, Bau/Finale, Whiskey-Epilog, Hochsitz oben, Endkarte "ZUM TITEL") | `_abn56_c6a`, `_abn56_c6b`, `_abn56_c6c` | ok. Epilog am Hochsitz dauert ca. 150 s reiner Dialog (viel, kein Softlock; Schritt-Zeitlimit des Läufers war zu kurz) |
| Stall: Teller erreichbar | `_abn56_barn3`, `_abn56_barn4/stallteller.png` | ok: im Ostgang der Scheune (x=-139,7) zeigt das Ziel "Das Brot auf den Teller legen" (Abstand 3,0 m zur Mitte, Klickbox reicht). Der vermeintliche "Einschluss" im Teller-Raum war ein Läufer-Artefakt (T.reach teleportiert in den abgeschlossenen Heuverschlag). Auffällig: der Teller selbst ist vom Gang aus durch Sattel/Fass verdeckt, nur der Hinweistext zeigt ihn an |
| Nr. 7 "Klemmt"-Warnung nach Sweep | `_abn56_c5` k5_2/k5_3 | Läufer-Artefakt (Tür geschlossen), im Lauf `_abn56_c5d` kein Problem |
| Hirsch (A-20) | `_abn56_c6a` k6_6 | Läufer wartete 140 s; ein Reh-Ereignis (`nackt_reh`) blockierte die Folge, weil die Phase "come" ohne Zeitlimit war |

## Behoben (lokal, nicht committet)
- `app/mods/hungrige.js`: Phase "come" des nackten Rehs bekommt ein Zeitlimit (`this.t > 90` → Rennen/Ende), damit das Reh die Hirsch-Begegnung an der Fraßstelle nicht beliebig lange blockiert. `node --check` ok. Noch nicht neu gebaut (`assemble.js`/Build ausstehend, Instanz lief).

## Noch offen / ungeprüft
- Bilder: bisher nur ca. 20 Läufer-Bilder gesehen (meist Wände, wenig Aussage). Nahaufnahmen Mama, Papa, Lucy, Jonas, Hirsch, Wolf, Raben, Welpe, "Das Ding", Bus, Wrack, Hütte, Bau, Friedhof, Stall, Auto bei Aydın, Sprite-/Flachbild-Prüfung: NICHT erledigt (Fenster 18:00–19:30).
- Tappen-Weg (K5_TAPP) Wegpunkt 0–3 im Läufer "kein Weg" – vermutlich gleiche Ursache (Läufer stand im Heuverschlag); in echtem Spiel nachprüfen.
- Lager (Kap. 6) im Läufer nach Fallback-Hirsch nicht fertig geworden (Beat blieb "frass"); mit echtem Hirsch-Ablauf erneut prüfen.
- Bus-Falle: Lauf endete mit "tote=1" (ein Tod beim Warten in der Mitte) – Fairness (Zeitfenster, Checkpoint) mit Bildern prüfen.
- Messwerte FPS/Ladezeit: nur Nebenbefunde: Kaltstart der Instanz bis bereit ca. 145 s (leer) bzw. 300–760 s bei gleichzeitiger Last; Reload warm 324 s, bei CPU-Last 85 % und nur 1,3 GB freiem RAM (Stimmen-Erzeugung/andere Agenten) – nicht als Messung zu verwenden.
- Bereit liegen: `C:\Users\GIGABYTE\_abn56\mk.py` (Steps-Bau mit eigenem Namensraum `__T56`), `n_lib_step.json`, `s0.js`, Läufer `_abn56_c5d.json`, `_abn56_c6a/b/c.json`.
