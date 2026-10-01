# Stand R-20: Hauptmenü als Visitenkarte, dazu „Mitwirkende“ (01.10.2026)

Nutzerwunsch R-20: „gruseliger, enorm viel hochwertiger und detailreicher, kreativ und vielfältig“. Dazu der Auftrag aus der Lizenzprüfung: ein Menüpunkt „Mitwirkende“ mit allen Nachweisen aus `CREDITS.md`.

## Gebaut

**Modul `app/mods/menue.js`** (in ORDER ganz hinten nach `bewuchs`)
- Hinter dem Menü läuft die ohnehin geladene Welt. Es gibt kein eigenes Laden und keine Lichter.
- Die Bühne startet erst nach „Fertig“ (`ui.ready`).
- Die Kamera kommt über `menu.cam` (Haken in der Basis `attractUpdate`) und `setCamOverride`. Beim Spielstart wird sie sauber übergeben.

**Fünf Motive**, je etwa 30–34 s mit Schnitt über Schwarz, dazu Handkamera-Drift und leichte Mausparallaxe:
1. **Ahornstraße / Nr. 7**
   - Kreidestriche in Fünfergruppen entstehen von selbst, mit leisem Kreidegeräusch an der Stelle.
   - Die Hausnummer zeigt dreimal kurz „17“.
   - Eine Katze starrt in die Kamera.
2. **Laterne (−20 | 6,3)**
   - Die Fibel liegt im Lichtkegel. Sie ist das Scan-Buch `w_buch`, wie Wachstuch eingefärbt, mit Aufkleber „ABENTEUERFIBEL – LUKE · JONAS · ZAYN – GEHEIM!!“.
   - Whiskey fliegt ein, landet auf dem Laternenkopf, krächzt, dreht ruckartig den Kopf zur Kamera und legt ihn schief.
   - Die Laterne brummt und geht aus (`dying`). Nach 1,4 s flackert sie wieder an, und nun führen nasse, dreizehige Abdrücke aus dem Dunkel zur Fibel.
3. **Ortstafel durch die beschlagene Scheibe**
   - Der Beschlag ist ein `backdrop-filter` mit Maske.
   - Ein Finger malt ∴ hinein, die Spuren laufen nach unten ab. Tropfenbahnen schneiden durch den Beschlag.
   - Die Regentropfen selbst kommen aus `oberflaeche.js` (`#obRegen`).
4. **Kapelle**: Eine einzelne Glocke schlägt von drinnen.
5. **Waldrand im Nebel**: Ein Ast knackt, fern ruft ein Reh. Die Waldtiere bleiben im Menü ausgeblendet.

**Weitere Abläufe**
- **Leerlauf:** Nach 60 s ohne Eingabe nähert sich die Kamera 90 s lang Nr. 7. Die Tür knarrt und steht einen Spalt offen. Jede Eingabe schneidet zurück.
- **Fortschritt** (aus `saveFlags` und dem Spielstand, ohne Vorgriff):
  - Nach Kapitel 1 zeigt die Ortstafel „210“ (`kino_schild`, wird beim Spielstart zurückgesetzt; `kino_persist` setzt es im Spiel wieder). Die Katze sitzt dann mit dem Rücken zur Kamera vor der Tür von Nr. 7.
  - Ab Kapitel 3 steht der Neunte für 0,55 s am Rand des Lichtkegels, wenn die Laterne wieder angeht. Davor nie, denn in Kap. 1 ist er nie sichtbar.
- **Ton:**
  - Menümusik `mu_menue` (klang.js) sowie Regen und Wind. In Electron starten sie ohne Klick (`Audio.init` beim Start der Bühne).
  - Etwa alle 40–85 s kommt ein seltenes Geräusch von außerhalb des Bildes, nur aus echten Aufnahmen: Knarren, Tür, Flüstern, Rabe, Hund.

**Oberfläche** (CSS-Block „R-20“ in der Basis, mit den Schrift-Variablen `--f-*` des Grafik/UI-Agenten)
- **Titel:**
  - MIRA ist Kreide: eine körnige Textur pro Buchstabe.
  - Kreidestaub bröckelt ab (kleines Canvas, nur solange Teilchen fallen).
  - Ein Filmkratzer ersetzt das bisherige Farbglitch.
  - Alle 16–30 s flimmert der Titel 2,6 s lang wie unter Wasser (SVG-Verschiebung, nur dann aktiv).
  - Alle 45–110 s blitzt kurz ein kaltes Leuchten mit ∴ auf.
- Das rote Glühen ohne Quelle (`.ember`) ist entfernt.
- **Menüpunkte:**
  - Beim Darüberfahren und bei Tastaturfokus erscheint eine Bleistift-Unterstreichung mit zwei Strichen.
  - Ein Graphit-Schatten liegt für die Lesbarkeit hinter dem Wort.
  - Dazu ein Bleistiftgeräusch (`ui_stift`), selten ein sehr leises Flüstern.
- **Kapitel wählen als Polaroids:**
  - Freie Kapitel tragen ein Blitzfoto aus der geladenen Welt: Nr. 7, Gully, Straße, Ortstafel, Nr. 1, Waldrand. Es wird einmal je Sitzung beim Öffnen gerendert, mit derselben Auslese und Nachbearbeitung, und danach gecacht.
  - Gesperrte Kapitel erscheinen als unentwickelte Polaroids.
- **Einstellungen und Steuerung** sind eine Seite im Notizheft: Lochrand, roter Rand, Linien je Zeile, Lukes Handschrift. Die Helligkeits-Kalibrierung bleibt bewusst schwarz, sonst stimmt sie nicht.
- **Tastatur:**
  - Pfeile, W/S und Tab wandern durch das Menü, die Polaroids und die Einstellungen. Tab war global gesperrt.
  - Enter und Leertaste lösen aus, Esc schließt das Unterfenster bzw. die Mitwirkenden.

**Mitwirkende**
- Neuer Menüpunkt `#mCred` mit einem rollenden Abspann. Er scrollt selbst und lässt sich mit Mausrad oder Pfeiltasten übernehmen; Esc oder ZURÜCK schließen ihn.
- `app/tools/assemble.js` setzt `CREDITS.md` beim Bauen ein (Marke `/*@@CREDITS@@*/null`). Der Abspann ist damit immer vollständig und aktuell.
- **CC-BY-Einträge:** Werk, Urheber, Quelle, Lizenz-Link und „verändert“. CC0-Einträge tragen den CC0-Link.
- **Bewusst weggelassen:**
  - die Spalte „Verwendung im Spiel“, denn sie verrät die Handlung (z. B. „wahre Gestalt des Wendigo“, „Lucy (erwachsen)“);
  - technische Klammern mit Pfaden;
  - der Abschnitt „Heruntergeladen, derzeit nicht im Spiel“.

## Unverändert
Alle IDs und Handler: `beginGame`, Weiterspielen, Neues Spiel, Kapitel wählen (der Klick wird nur ergänzt), Einstellungen, Steuerung, Story-Editor, Beenden und die Helligkeits-Kalibrierung. Die Nachbearbeitungskette ist nicht angefasst.

## Geprüft
- Bau und Syntax sind sauber (`node tools/assemble.js`, einschließlich der Gesamtprüfung des Modul-Scripts). `CREDITS.md` ist im Bau enthalten.
- Der Sichtlauf ist **nicht gelaufen**: Die Testschlange war voll, und laut Regel wurde er nach über 20 min Wartezeit abgebrochen. Der Lauf ist vorbereitet: `app/tools/test_menue_steps.json`.
  - Aufruf: `npx electron . --selftest --steps=tools/test_menue_steps.json --out=<ordner> --readyTimeout=300000`
  - Die Schritte nutzen den Testzugriff `window.__mz`; er fehlt in der Veröffentlichung.

## Im Schlusstest zu prüfen (Bilder m1–m9 des Laufs oben)
1. **m1 Nr. 7:**
   - Die Kreidestriche (Fünfergruppen) liegen sichtbar auf dem Asphalt vor der Kamera. Sie liegen nicht unter dem Boden und sind auch nicht zu hell.
   - Die Katze steht im Bild. Laut Ergebnis-JSON sind `plate`, `cat`, `fibel` und `spur` alle `true`.
2. **m2 Laterne:**
   - Whiskey sitzt auf dem Laternenkopf. Er schwebt nicht und steckt nicht darin; falls doch, `to.y` in `mz_whiskey` anpassen.
   - Sein Kopf ist zur Kamera gedreht.
   - Die Fibel liegt flach im Lichtkegel und hat den Aufkleber oben.
3. **m2b:** Die Laterne ist wieder an, und die nassen Abdrücke führen zur Fibel.
4. **m3 Ortstafel:**
   - Der Beschlag ist unscharf, das ∴ ist klar und hat Ablaufspuren.
   - Die Tafel ist lesbar, die Kamera steht auf der Ostseite.
5. **m4 Kapelle / m5 Waldrand:**
   - Beide Bilder sind nicht schwarz und zeigen nichts Halbes.
   - Im Wald stehen keine eingefrorenen Tiere. Falls zu dunkel, die Kamerapunkte in `MZ_SHOTS` verschieben.
6. **m6 Hover:**
   - Die Bleistift-Unterstreichung liegt unter dem Wort.
   - Alle Menüpunkte sind gut lesbar.
7. **m7 Kapitel:**
   - Es gibt 7 Polaroids in 4 Spalten. Kapitel 1 hat ein Foto, das Ergebnis lautet „7 1“.
   - Die gesperrten Kapitel sind unentwickelt.
   - Es gibt kein sichtbares Aufblitzen des Zwischenbilds.
8. **m8 Einstellungen:** Die Notizheft-Seite ist lesbar, und die Regler sind bedienbar.
9. **m9 Mitwirkende:**
   - Der Abspann rollt, das Ergebnis sind über 120 Einträge.
   - Einträge, URLs und Lizenzzeile sind lesbar.
10. **Von Hand (kurz):**
    - Tastatur: Pfeile, Tab, Enter und Esc im Menü, in den Polaroids und den Einstellungen.
    - 60 s ohne Eingabe: Die Kamera fährt auf Nr. 7 zu, die Tür geht einen Spalt auf, eine Mausbewegung schneidet zurück.
    - Spielstart: Die Kamera übergibt sauber, und es bleiben keine Katze, kein Rabe und keine Fibel auf der Straße zurück.
    - Menümusik, Regen und Wind laufen ohne Klick.
    - Leistung im Menü ohne Einbruch, besonders beim Glas-Motiv mit `backdrop-filter`.

## Offen / fehlt
- **Echte Aufnahme eines zählenden Kindes:** nicht vorhanden. Deshalb gibt es diesen Effekt nicht; nur echte Aufnahmen sind erlaubt.
- **Ein eigenes Menüstück aus Lucys Spieluhrmotiv:** `mu_menue` bleibt. Ein zusätzliches Spieluhr-Motiv darüber würde harmonisch kollidieren.
- **Kapitel-Fotos 2 und 4** zeigen Orte im Dorf (Gully, Ortstafel), weil Amt und Villa nicht zur Oberwelt gehören.
