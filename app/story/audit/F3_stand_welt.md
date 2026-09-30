# Stand AP Welt/Licht · Premium-Prioritäten 6–8 (Kap. 1–4: Detaildichte, Atmosphäre, eigene Bildsprache)

Stand 01.10.2026. Die Bildsprache ist in 8 Regeln festgelegt: `docs/gameplay/visual_identity.md`.

## Diagnose (Lauf „vorher“, 17 Bilder an 12 Orten, `C:/Users/GIGABYTE/_welt/vorher`)
| Ort | Befund |
|---|---|
| Dorfstraße Kap. 1 | Das Bild ist einfarbig grau, die Laternen wirken weißlich statt natriumgelb, es gibt keinen Farbkontrast. Der Asphalt ist trotz Regen matt schwarz und spiegelt nichts. Die Nebelschichten stehen als harte waagerechte Bänder am Horizont (wirkt „technisch unfertig“). |
| Kreuzung | Viel schwarze leere Fahrbahn. Die Pfütze glitzert körnig. |
| Ortstafel | Die Nebelschicht liegt als flache graue Platte da, die Kante der Schicht ist sichtbar. |
| Waldrand | Dicht und stimmig; nur sehr dunkel. |
| Nr. 1 | Ohne Lampe völlig schwarz, es gibt keine Quelle (kein Fenster-/Mondlicht). |
| Nr. 7 EG | Schwarz. Der „blaue Leuchtpunkt“ ist der Nachbild-Anker `addEcho` (Basis, Sprite 0xaecdff) und kein Fehler (siehe unten). |
| Keller Nr. 7 | Die Glühbirne wirkt, aber außerhalb ihres Kegels bleibt nur schwarze Leere. |
| Nr. 4 | Die Birne ist sichtbar, ihr Licht erreicht die Wände kaum. |
| Kapelle | Innen stimmen Kerzen und Fenster. Außen gut, aber neben der Kapelle schwebt eine schwarze Tafel (Herkunft nicht geprüft). |
| Amt Ebene −2 | Die Neonröhre glüht grell, der Raum bleibt schwarz: Die Röhrenlichter hatten 1,5 cd, das ist physikalisch fast wirkungslos. |
| Villa Halle/Arbeitszimmer (Tag) | Fast schwarz. Die Basis überschreibt `hemi` **nicht**: Gemessen waren 0,6 bzw. 0,42, die kommen an. Die Werte sind für Tageslicht nur viel zu klein. |
| Tag-Straße | Nebelwand passt zum Morgen; die Nebelschichten zeigen Streifen. |

## Umgesetzt
- **Basis** (nur Licht, Grading und Nebel):
  - **Grading:** Schatten kälter, Lichter bernsteinfarben (`filmPass`).
  - **Natriumfarbe:** `lampPool` 0xff9f4c, Birne und Bodenlicht angepasst.
  - **Bodennebel:** weiche Ränder je Schicht (über die UV); streifend gesehen nur noch 30 % Deckung, damit keine Horizontbänder mehr entstehen.
  - **`c2Tube` ×3,2:** Die Amtsröhren leuchten den Raum jetzt aus.
  - **Neuer Haken `LICHT_HAKEN`:** `fn(dt, indoor, rect, indoorK)`; er läuft je Bild nach der Basis-Lichtzeile und vor den Takten.
- **gruen.js:**
  - Nasse Straße spiegelt die zehn nächsten Laternen als senkrechte, weiche Natriumstreifen (`gStreak`, Glanzkeule seitlich eng und in der Höhe weit). Auf Asphalt stärker als auf dem Gehweg, in Pfützen schärfer.
  - Pfützen: Rauheit 0,15 und ruhigere Regenringe (0,24), das Glitzern ist dadurch nur gemindert.
  - Zusatzkosten: je Bodenpixel eine Schleife über 10 Laternen, keine neuen Draw Calls.
- **villa.js:** nur die Lichtzeile.
  - `villa_tagLicht` läuft jetzt über `LICHT_HAKEN`.
  - Hemisphäre in der Halle 4,2; in den Räumen `amb × 9` (der Kühlraum bleibt ≈ 0,1); Belichtung drinnen 1,2.
  - Die Räume lesen sich jetzt als Räume, die Lampen setzen weiter die Akzente.
- **innen_ort.js / innen_kapitel.js** (je ein Haken am Dateiende, keine Lichter):
  - Nr. 7 +0,11 und Nr. 1 +0,08 Hemisphäre als kaltes Fensterlicht (bei Stromausfall ×0,6, Keller nichts).
  - Amt: +0,13 × Nähe einer brennenden Röhre. Ohne Strom bleibt es schwarz.
- **leben.js:** Motten sind jetzt weiche, runde, warme Sprites statt weißer Quadrate (auch der Mottenschwarm im Schrank) und fliegen unruhiger (Abstand und Richtung schwanken).
- **fassaden.js:** Überlaufende Dachrinnen tropfen: 36 Tropfen-Striche an den drei nächsten Häusern in 16 m Umkreis, alles beim ersten Aufruf angelegt, keine Allokation im Takt.
- **strasse.js:**
  - Nasses Laub (Scan `w_leaves`) als Haufen im Rinnstein unter den Laternen der Ahornstraße und an den drei Kanaldeckeln.
  - Grund: Regen schwemmt Oktoberlaub an die Bordsteinkante.
  - Technik: eine Instanzgruppe, ohne Kollision und ohne Schatten.
- **Vorhandenes geprüft und nicht verdoppelt:** Wind in Gras/Hecken (`gruen_wind`) und Wald (`waldleben`), Vorhänge (zuckender Vorhang Nr. 4), Laub-/Schlamm-/Pfützen-Decals, Flackern mit Ursache (Laternen, Röhren, Kerzen).

## Tests
- **Vorher und nachher:** gleiche 12 Orte, Schritte `C:/Users/GIGABYTE/_welt/steps.json`, Profil `_ham_testprofil_welt`.
  - Kontaktbögen: `C:/Users/GIGABYTE/_welt/vergleich_1…3.png` (links vorher, rechts nachher).
- **Kurzer Nachtest** nach zwei Korrekturen, 5 Bilder (`_welt/check`):
  - Die erste Streifen-Fassung war viel zu stark: Die ganze Fahrbahn war orange. Sie ist jetzt als Winkelkeule neu gebaut.
  - Der Haken für Nr. 7 griff nicht: Die Raumrechtecke sind Kopien von `s7`, deshalb prüft er jetzt die Hausgrenzen.
  - Ergebnis: Straße und Kreuzung zeigen saubere senkrechte Laternenstreifen im nassen Asphalt. Villa Halle und Arbeitszimmer sind als Räume lesbar. Nr. 7 hat `hemi` 0,16 (lesbar nur als Umrisse, gewollt).
- **Log:** keine neuen Fehler. Die 404 für `w_papierlaterne`/`toys_old` bestanden schon vorher.
- **Nicht im Bild geprüft:** Laubhaufen (Protokoll ohne Fehler), Tropfen, Motten (Bewegung, nachts klein), Nebelkanten an der Ortstafel nach der Korrektur.

## Offen / Bitten
- **Hauptagent (Performance-Schluss):** `gStreak` kostet Füllrate auf dem Boden. Falls es knapp wird, auf 6 Laternen kürzen (Schleifengrenze in `gruen.js`).
- **Nachbild-Anker (Basis `addEcho`)**, der gemeldete „blaue Leuchtpunkt“ in Küche Nr. 7 und draußen: Er ist gewollt, wirkt aber wie eine generische Leuchtkugel ohne Quelle. Vorschlag: kleiner, schwach pulsierend, nur mit Taschenlampe oder in der Nähe sichtbar.
- **Verdacht Basis:** `rect === s7` (Tür knallt zu) und `rect === s1` (Kinderzimmer-Spieluhr) werden nie wahr, weil `shell()` `{ ...r, g }` zurückgibt und `indoorRects` das Original hält. Bitte prüfen.
- **Nicht meine Dateien, noch dunkel:** Nr. 4 und Kapelle innen (kirchberg.js/nr4.js) könnten denselben Haken nutzen (Fensterlicht/Kerzen). Außerdem die schwarze Tafel neben der Kapelle (außen).
- **Villa (AP-20):** Die Halle hat keine Fenster. Das Licht ist über Deckenlicht und Lampe begründet; echte Fenster würden das Tageslicht besser tragen.
- **Keine fehlenden Assets:** Verwendet wurde nur `w_leaves` (Megascans, liegt schon in `game/assets/ms`).
