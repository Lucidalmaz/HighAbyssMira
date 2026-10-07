# Umsetzung Abgleich Kapitel 3 (Text gegen Welt)

Grundlage: `docs/gameplay/abgleich/kap3.md`. Geändert wurden ausschließlich `app/mods/kapitel3.js`, `app/mods/neben3.js`, `app/mods/weiss.js`, `app/mods/lucy3.js`. Alle Funktionen der neuen Objekte haben das Präfix `neben3x_` (neben3.js), `kapitel3_` (kapitel3.js), `lucy3_hebel…` (lucy3.js) bzw. `weiss_…` (weiss.js). Jeder Bauteil läuft in `try/catch`, ein Fehler lässt also nur das jeweilige Objekt fehlen.

Prüfung: `node --check` je Datei, Gerüsttests der Geometrie in Node, danach mehrere Spielläufe über `_run_locked.sh` (Ausgabeordner `_kap3_out_a` … `_kap3_out_j`) mit Screenshots.

## Status je Lücke

| # | Lücke | Stand | Umsetzung |
|---|---|---|---|
| 1 | Hufeisen über der Stalltür (hoch) | umgesetzt | `kapitel3_hufeisenBau`: echtes Hufeisen (Extrusion mit sieben Nagellöchern, Eisen mit Rost, Nagel, Rostfahne) an der Oberkante des rechten Türpfostens des Stalltors (von außen sichtbar; die Stirnwand über der Tür liegt hinter dem Gebälk und war per Strahl nicht zuverlässig zu finden). Ab Kapitel 3 sichtbar. |
| 2 | Bus um 03:13 (hoch) | umgesetzt | `neben3x_busBau`: grauer Fahrdienstbus „AMT FÜR RÜCKFÜHRUNG · FAHRDIENST“, Zielanzeige „7 HOHER ABGRUND“, Seitenplatten mit Fenstern, Falttüren, Räder (Zwillingsachse hinten), leerer Fahrerplatz, Sitzreihen, Entwerter mit roter LED. Fährt aus Osten ein, hält an der Haltestelle (Tür zum Wartehäuschen), Türen zischen auf, Motorton wandert mit; fährt bei „Stehen bleiben“ nach Westen ab. Kollision nur im Halt. Die Licht-Variante aus `ausbau_nord` wird in Kap. 3 stillgelegt, solange die Aufgabe offen ist. |
| 3 | Frau Aydın am Fenster Nr. 8 auch in Kap. 3 (hoch) | umgesetzt | Sichtbarkeit wird in Kap. 3 überstimmt (nahe < 16 m). Position/Höhe korrigiert (Fußboden im Haus, Kopf direkt hinter der Scheibe, vorher ragte der Kopf durch die Scheibe bzw. stand zu tief; gilt auch für Kap. 1). Wecker (klingelt zitternd), Foto mit Giraffe auf der Fensterbank, Wolldecke erscheint auf den Schultern, wenn sie umgelegt wird. |
| 4 | Dina (26) mit Augenbinde (hoch) | umgesetzt | `dina_erw` statt `dina` (9), flacher Strohballen als Sitz, Blick zum Eingang, Stoffband mit Knoten auf Augenhöhe (Augenhöhe aus dem Augennetz berechnet; frontale Sicht im Test nicht erreicht, nur die Formel geprüft – bitte im Spiel ansehen). |
| 5 | Hebel und Blechschild an den Schaltkästen (hoch) | umgesetzt | `lucy3_hebelBau`: Tür mit Scharnieren, Emailleschild „LEUCHTE AUS / EIN · Nur für befugtes Personal“, Schlitzplatte EIN/AUS, Hebel mit roter Kugel, Schloss. Hebel kippt bei AUS und springt bei falscher Reihenfolge schnell zurück (mit Klacken). Kasten mit Rostblech-Oberfläche, Dachkappe, Sockel. „ZULETZT.“-Zettel nach unten verschoben. |
| 6 | Handschuh / Ring / Schleifspur (hoch) | umgesetzt | `weiss_luecken`: Miras rechte Hand als Faust (Fingerknochen), Silberring mit halbem Mond am Ringfinger, Handschuh des Ritters offen mit gespreizten Fingern und halbrundem Brandfleck in der Handfläche, Schleifspur (zwei Fersenrillen, abgeschabter Reif) hinter dem Stiefel. Gemessen: Fingerspitze–Handgelenk Mira ≈ 0,07 m (Faust), Justin ≈ 0,17 m (offen). |
| 7 | Vegas’ Dahlien (mittel) | umgesetzt | `kapitel3_dahlienBeet`: zwei Beete links/rechts der Veranda von Nr. 3, Pompon-Dahlien (instanzierte Blütenköpfe in Rot, Orange, Rosa, Gelb, Weiß), Stängel, Blätter, Stützstäbe, Erdbeet-Abziehbild. |
| 8 | Anrufbeantworter (mittel) | umgesetzt | Telefontisch zwischen Tür und Fenster in Nr. 7, `w_telefon` (Bakelit-Wählscheibe) und ein gebautes Kassettengerät mit „FUL“-Anzeige und blinkender LED. Klickfläche liegt jetzt am Gerät (stand vorher in der Haustür). |
| 9 | Grube: Schuh, Kniespur, Stein (mittel) | umgesetzt | Kinderschuh (Größe 33, Klett) auf dem Grubenboden, zwei Knieabdrücke am Kopfende (Klickfläche), neuer Stein „LUKE BRANDT · 2009 – 2026“ ab Kapitel 3 (alte Platte wird ausgeblendet). |
| 10 | Kerben (mittel) | umgesetzt (Birke als kahler heller Baum) | Neun Kerben mit Turm am Fundamentstein, 28 Kerben mit Rabenfuß neben der 26. (an die nächste Fläche um den Klickpunkt gesetzt), Birke mit fünf Kerben (letzte frisch, Saftspur) – die Birke gab es nicht, sie ist neu (heller kahler Baum aus dem Scan `deadtree1`, weil `w_birke` nur ein Stammstück ohne Krone ist). |
| 11 | Monitor / Aufkleber Tankstelle (mittel) | umgesetzt | Der Bildschirm des Röhrenfernsehers am Kiosk flimmert (Außenkamera, Rauschen, Zeitmarke), solange die Aufgabe offen ist; Klickfläche wandert an das Gerät. Aufkleber „Bitte lächeln“ mit winzigem Auge an der Tür. |
| 12 | Licht über der Senke (mittel) | umgesetzt (Näherung) | `kapitel3_senkeBau`: bleiches Himmelsleuchten (Sprite, keine Lichtquelle) im Osten, nur in Kap. 3 im Ort. |
| 13 | Kreisel (niedrig) | umgesetzt | Blechkreisel (Rotationskörper, bunt) vor den Füßen des Mädchens auf Stuhl 7. |
| 14 | Schilder Nr. 2 und Nr. 6 (niedrig) | umgesetzt | Verkaufsschild („ZU VERKAUFEN · Objekt frei ab sofort. Ruhige Lage.“) auf zwei Pfosten im Vorgarten, Emailleschild „Keine Werbung. Keine Zeugen Jehovas. Kein Amt.“ neben der Tür. |
| 15 | Postkarte (niedrig) | umgesetzt | Karte ragt aus dem Briefkasten von Nr. 2, nur solange „Ja.“ offen ist. |
| 16 | Nachtlicht-Fisch / Spieluhr (niedrig) | umgesetzt | Nachtlicht als blaue Fischsilhouette an der Steckdosenplatte (Wandabstand korrigiert), Spieluhr = `w_spieluhr`-Scan. |
| 17 | Krüge | nicht umgesetzt | Eine Textfrage (Pfandkiste/Krüge) in `justin.js`/Funkkasten, außerhalb der erlaubten Dateien. |
| 18 | Remise/Scheune | umgesetzt | Aufgabentext auf „Scheune am Hof“ geändert. |
| 19 | Doppelter Briefkasten Villa | umgesetzt | Der zusätzliche Kasten aus `neben3_villaBau` entfällt, die Klickfläche liegt auf dem vollgestopften Kasten aus `anwesen.js`. |

## Braucht Download

* Bus: kein Busmodell im Bestand. Der gebaute Bus ist eine saubere Näherung, ein echter Stadtbus (z. B. Fab „old city bus“, grau lackierbar) wäre besser.
* Anrufbeantworter: Kassettengerät der 90er (Näherung gebaut).
* Dahlien: kein Dahlien-Asset (Blüten procedural).
* Pferdebox-Details für Dina (Strohballen flach) und eine echte Birke mit Krone.
* Frau Aydıns Wolldecke als Schulterdecke (gebaut: einfacher Umhang).

## Auffälligkeiten

* Die Lücke 12 „Schiff“ wird nur als Leuchten angedeutet; das UFO selbst liegt bei (0, −800).
* Der Wrapper `_run_locked.sh` wartet höchstens 20 Minuten auf die Sperre und startet danach trotzdem; mehrere Agenten führten dadurch zu gleichzeitigen Läufen und Grafikabstürzen.
* Die Test-Teleports wurden von Spielregeln überlagert (Leine der Intro-Szene, Kollisions-Herausschieben); die Prüfläufe löschen die Leine und halten Position und Blick.
