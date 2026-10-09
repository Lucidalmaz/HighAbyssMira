# QA Rätsel Kapitel 5–6 (nur Code-/Textanalyse, 09.10.2026)

Geprüft: `kapitel5.js`, `neben5.js`, `kapitel6.js`, `neben6.js`, `tiefwald.js`, `wald.js`, `hungrige.js` (+ Hilfeleiter `gedanken.js` nur gelesen).
Bewertung: **OK** = lösbar, ausreichend erklärt · **unklar** = lösbar, aber Spieler könnte hängen · **defekt** = Softlock/Fehler (behoben, wenn „behoben“ steht).
„Hilfe nach Zeit“ = `GEDANKEN_FADEN` (gedanken.js, 150 s gleiche Aufgabenzeile) bzw. eigene Zeitschwellen im Modul. Keine Spielläufe; Aussagen sind Codelesung.

## Kapitel 5 – „Iss auf, Bruder“ (13 Rätsel/Hürden)

| # | Rätsel / Hürde | Lösung | Hinweise im Spiel (WO / WANN) | Fehlschlag-Rückmeldung | Hilfe nach Zeit | Sackgasse / Softlock | Bewertung |
|---|---|---|---|---|---|---|---|
| 5.1 | Kamera finden (Nr. 7) | Kamera am Esstisch/Wohnzimmer Nr. 7 nehmen | Aufgabe `Hildes Kamera. Nr. 7, Wohnzimmer.` | – | nur Fallback-Gedanke | keine | OK |
| 5.2 | Foto 1 von Lucy am Fenster | `C` heben, auf Lucys Fenster (< 16 m, Blick > 0,9) halten, abdrücken | Aufgabe `Mach ein Foto von Lucy.`, Kreispfeil am Fenster, Kamera-Tip (`C`) beim Nehmen | Foto ohne Ziel zählt nicht, kein Hinweis, warum | **fehlt** (Fallback „Was hab ich übersehen“ hilft nicht) | Film: 3 Bilder; wer sie verknipst, hatte kein Bild für Runde 3 (siehe 5.6) | unklar → Vorschlag GEDANKEN_FADEN |
| 5.3 | Gisela / Hänschen | Automatisch, sobald Luke ≤ 5,5 m ans Gartentor kommt | Aufgabe `Nr. 1. Wer deckt da den Tisch?` | – | – | Haustür-Beat `tuer` braucht `f.gisela` | OK |
| 5.4 | Haustür / Küche | In Nr. 1 in die Küche gehen | Aufgabe, Licht in der Küche, Radio | – | – | keine | OK |
| 5.5 | Tisch + Schleife (3 Runden) | Nicht essen; zur Kinderzimmer-Tür hinten gehen, 3× zurückgesetzt; in Runde 3 Atem hinter dir: umdrehen + Foto (`C`, Klick, 6 s) | Aufgabe `Vier Gedecke. Lucy hat gesagt: Iss nichts.` (+ neu: `Hör hin, was unter ihrer Stimme läuft.`), nach 8 s `Lucys Spieluhr. Das Kinderzimmer.`, Familienfoto-Toasts je Runde, Runde 2 Mama-Nachbild + Gedanke zur Kamera, Runde 3 Tip `C Kamera` | Verfehlt: kalte Finger, „Iss auf, Bruder“, Atem neu in 7 s; Gedanke ab 1. Fehlversuch (**neu**) | Gedanke nach 2. Fehlversuch, davor nichts | **harter Softlock (behoben):** Tod am Tisch/in der Schleife (E essen) oder Laden in der Schleife → `k5.f.schleifeRuf` blieb true, `k5.runde` blieb stehen → Schleife feuerte nie wieder, Kapitel hing. Fix: `k5_setup` setzt für Beats ≤ `tisch` Schleife zurück. Zusätzlich Setzen im Beat `schleife` gesperrt (Toast statt Tod). | **defekt (behoben)**, Verständlichkeit unklar |
| 5.6 | Film für Runde 3 | Filmpack: Besteckschublade Nr. 7, Laube Parz. 7, Kommode Nr. 1, Kranz (Friedhof) | Toast/Notiz beim Fund | Kamera meldet „kein Film“ | Gedanke `Kein Film … Kommode` nur wenn Kommodenfilm noch nicht genommen | Film = 0, Kommodenfilm schon genommen → Runde 3 unlösbar. **behoben:** bei 0 Film in Runde 3 wird 1 Film nachgelegt | **defekt (behoben)** |
| 5.7 | Spieluhr nehmen | Im Kinderzimmer die Spieluhr aufheben (Hit auf `musicBox`) | Aufgabe `Lucys Spieluhr. Das Kinderzimmer.`, Melodie laut hörbar im Haus | – | – | Spieluhr-Fallback beim Respawn vorhanden | OK |
| 5.8 | Heimweg / Graukind | Spieluhr zu Lucy an die Kreuzung; Graukind jagt nur Ungesehene, zerfällt im Licht | Aufgabe `Bring Lucy die Spieluhr.`, Vegas ruft „zur Kreuzung“, Kichern, Laternen flackern | Gefangen: Teleport zurück zu Nr. 1 (kein Tod) | – | keine | OK |
| 5.9 | Lucy / Telefonzelle | Lucy `Spieluhr geben`, dann Hörer abnehmen | Aufgabe `Die Telefonzelle klingelt.`, Klingeln hörbar ≤ 42 m | Vor `anruf`: Toast `Nur Rauschen.` | – | Beat `anrufLaeuft` ohne Rückfall bei Abbruch (Tod unwahrscheinlich) | OK |
| 5.10 | Stall / Teller / Brot | Kanten Brot von Papas Platz in Nr. 1 (nach Spieluhr), im Stall auf den Teller legen, dann `Q` halten (Augen zu) | Aufgabe `Brot. Der Kanten von Papas Platz in Nr. 1…`, Teller-Toast (**neu:** nennt jetzt Papas Platz), nach 20 s „Er kommt nicht, solange ich hinsehe“, nach 35 s `Q halten – Augen zu` | Augen zu unterbrochen: `Weg. Er kommt wieder, wenn du nicht guckst.` (wiederholbar) | 2 Stufen (20/35 s) | Brot fehlt → Fallback beim Respawn am Stall; Whiskey klaute Kettenitems (behoben, siehe qa_items) | OK |
| 5.11 | Dem Tappen nach | Fußspuren/Geräusch folgen bis zum Plakat an der Laterne, Plakat lesen | Aufgabe `Hinterher.`, `Die Füße. Irgendwo vor mir.` bei > 26 m, Plakat-Hinweis nach 14 s | – | 14 s am Ende | keine | OK |
| 5.12 | Friedhof / Kerze | Mamas Kerze (vom Tisch) + Peters Feuerzeug: zuerst Feuerzeug (stirbt: „Pust.“), dann „Mamas Kerze anzünden“ an Luna | Aufgabe `Das Tappen hat aufgehört. Das Gedenkfeld.`, 15 s `‚Mamas Platz.‘`, 30 s Tip `E Mamas Kerze anzünden`, 60 s Beobachter-Zettel H1 | Kein Tod: Behaltene führen zurück ans Tor | 3 Stufen | Kerze fehlt (Ladepfad) → **behoben:** Fallback in `k5_wieder` (spieluhr, lucy, stall, friedhof); Feuerzeug-Fallback war vorhanden (`k5_welt`) | OK (behoben) |
| 5.13 | Zaun / Gitter | Dem Jungen (Luke) bis zum Nordzaun folgen, Gitter ansehen | Aufgabe `Hinterher.` → **neu** `Hinterher. Der Junge ist zum Nordzaun gelaufen.` | – | – | keine | OK (verbessert) |

Optional (Neben5): Jonas-Briefe, Laube, Zapfinsel, Heidi, Dina, Maas – alles kein Pflichtpfad. Fensterzeiten bewusst begrenzt (`N5_ZU`); verpassbar ohne Folgen für den Hauptweg.

## Kapitel 6 – „Wendigo“ (15 Rätsel/Hürden)

| # | Rätsel / Hürde | Lösung | Hinweise im Spiel | Fehlschlag | Hilfe nach Zeit | Sackgasse / Softlock | Bewertung |
|---|---|---|---|---|---|---|---|
| 6.1 | Gitter aufbiegen | Nach Wolter (AG-18) am Gitter `E` 1,6 s halten | Aufgabe `Hinter dem Gitter ist der Junge. Aber erst: wer parkt da hinter dir?`, danach (**neu**) `Das Gitter aufbiegen: E halten, am Gitter…`; Balken über `sideInfo` | Vor AG-18: Luke sagt „Gleich. Erst will ich wissen…“ | – | AG-18 ist skriptgesteuert (lwo_szene hängt nie, `finally` setzt `ag18`) | OK (verbessert) |
| 6.2 | Brotkrumen / Krähe | Krumen folgen; Krähe frisst Spur → „Zayns Hütte liegt hinten links“; sonst Hütte per Nähe (58, 149,5, r 13) | Aufgabe `Folge den Brotkrumen.`, Krähe-Szene, Luke-Zeile | – | – | Weg zur Hütte auch ohne Krähe | OK |
| 6.3 | Zayns Hütte | In die Hütte (Rect) gehen | Aufgabe `Zayns Hütte.`; nach 5 s `Die kleinen Hände führen hinaus. Zum eingedrückten Zaun.` | – | – | keine | OK |
| 6.4 | Zaunlücke | Durch die Lücke (42, 156) | Aufgabe wie oben, Handabdrücke im Moos | – | – | keine | OK |
| 6.5 | Rote Wolle → Hochsitz (SB-11) | Wolle bis zum Hochsitz folgen (liegt auf Pfad 1: 19|176,5), optional hinaufsteigen | Aufgabe `Der Hochsitz. Hinauf.` (nur bei Nähe 7 m!) | – | `busFrueh`-Gedanke nur wenn schon am Bus | Hochsitz-Checkpoint `k6_hochsitz` ist Voraussetzung der Falle; Wolle führt daran vorbei (5 m) | unklar (Aufgabenzeile erst nahe am Hochsitz) → Vorschlag |
| 6.6 | Bus-Falle (AG-19) | Weg „mit“: in die Mitte neben den Bus (61,2|196,9, 0,6 s), 22–40 s warten (nicht gehen, Lampe oben); Weg „ab“: Draht meiden, sonst Netz: `E` 12× / Messer halten | Aufgabe `Stell dich in die Mitte, neben den Bus. Sagt der Blechmann mit der Hand.`, **neu** `Warten. In der Mitte neben dem Bus bleiben.`; Funk | Netz: Hinweis `E`; Wolf springt: Neustart am Bus + Gedanke „Er kommt, wenn ich wegseh. Lampe oben lassen.“ | `k6_denk('wolf')` (**ergänzt:** „Er kommt nur, wenn ich wegseh.“) | Tod während Falle → `k6_falleReset`, Beat zurück `faden`, startet beim Nähern neu: kein Softlock | OK |
| 6.7 | Bus-Innenraum / Spind (N6-7, optional) | Schlüsselbund „3“ am Hochsitz-Fuß, Spind hinter Fahrersitz, Lampion | Hint-Marker (`hintAdd`), Luke-Gedanke | – | – | Whiskey durfte Schlüssel/Lampion stehlen → in `WHISKEY_NIE` aufgenommen | OK |
| 6.8 | AG-20 toter Blechmann | Bei 5,5 m ausgelöst (auto), Funkgerät/Kettenrolle optional | Aufgabe `Die Fraßstelle. Da vorn, wo das Blut endet.` | – | – | keine | OK |
| 6.9 | Fraßstelle (Dienstbuch Seite 1) | Beim Kadaver (1,5|199,6) das Heft „Eine Seite aus einem Dienstbuch“ lesen | Aufgabe wie 6.8; **neu:** nach 30 s in 8 m Nähe Gedanke „Neben dem Kadaver liegt etwas. Ein Heft…“ | – | **neu** | Ohne Seite 1 kommt der Hirsch nie, kein Fortschritt (vorher keine Hilfe) | unklar → behoben (Hilfe) |
| 6.10 | Hirsch-Verfolgung / Flucht | Event startet automatisch (< 34 m um die Fraßstelle); danach Whiskey fliegt zum Lager, ihm folgen | Aufgabe `Das Ding ist hier. Irgendwo.` → `Weg vom Bau. Whiskey fliegt nach Osten – zu Jonas’ Lager.` | Tod durch Hirschding (A-20): Checkpoint, Nachbild „gefressen“ | **neu:** nach 75 s außerhalb 34 m: `Zurück zur Fraßstelle. Das Ding ist in der Nähe.` | Wer vor Event weglief, kam nicht mehr in die Zone | unklar → behoben |
| 6.11 | Jonas’ Lager | Dorthin laufen; fertig nach Whiskey-Flag `k6_3` oder 45 s | Aufgabe, Whiskey-Route | Anruf „Lucy“: Wegdrücken/Rangehen, beides ok | – | keine | OK |
| 6.12 | Kinderspur | Kinderfüße (Decals) Richtung Westen zum Wrack | Aufgabe `Kleine nackte Füße im Laub, Richtung Westen. Zum Wrack.` | Jagd-Tod möglich: Lampe oben lassen (Merkblatt W) | `bauFrueh`-Gedanke, wenn Bau zu früh | keine | OK |
| 6.13 | Wrack / Handschuhfach | Hinter dem Wrack (−10|204,5, r 9) → Beat `bau`; Handschuhfach optional | Aufgabe `Hinter dem Wrack. Da, wo es still ist.` | – | – | keine | OK |
| 6.14 | Bau / Finale (Seite 6, R6-5, Lampe stirbt) | Seite 6 am Bau lesen → Finale; „Welcher ist Whiskey?“: `E` auf den Raben, den man ansieht (6 s); Lampe stirbt: `E` Batterie, `E` Feuerzeug (je ≤ 60 s) | Hinweis-Leiste `E …`; **neu:** nach 40 s Nähe Gedanke „Hofers letzte Seite. Sie muss hier irgendwo liegen…“ | Falsch/keine Wahl: Szene läuft weiter (kein Tod) | **neu** | Timeouts alle auflösend; Finale-Skip bei Fehler | OK (verbessert) |
| 6.15 | Whiskey-Führung (`k6_guide`, Epilog) | Whiskey fliegt Wegpunkte `K6_WEG` zum Hochsitz; Luke folgt | Aufgabe `Whiskey fliegt voraus. Folge ihm.` → `Der Hochsitz. Oben sitzt jemand.`; „Whiskey wartet auf dich“ alle 20 s | – | – | Ging der Ankunfts-Rückruf von `whiskey_fly` verloren (Beat blieb `epilog`), startete das Ende nie → **behoben** (`k6_oben` akzeptiert `epilog` nach letztem Wegpunkt) | defekt (behoben) |
| 6.16 | Hochsitz oben (Augen zu, SB-12, Wahl) | Hinaufsteigen (`E`), `Q` halten, Zahlen wählen | `augenzu_frei`-Hinweis `Q halten – Augen zu`, Notausstieg nach 30 s | Q nicht gehalten: wartet max. 30 s, dann weiter | – | keine | OK |
| 6.17 | Endkarten K5/K6 | `Weiter`/`Zum Titel` | Button | – | – | K5→`startChapter6` Fallback `location.reload` | OK |

Optionale Rätsel Kap. 6: R6-2 Welpe (Drahtschneider/Seitenschneider, Drahtschneider kommt aus Schuppen Kap. 3: zweiter Klick – Hinweis **ergänzt**), R6-4 Annis Schleife, Pell-Seiten, Spind. R6-4: jedes Tor wird endgültig entschieden, Fehlschlag kostet nur Schreck (kein Tod, kein Verlust) → kein Softlock; Hilfen jetzt ab dem 1. Fehlschlag (Whiskey fliegt in der Pause los) bzw. 2. (Toast).

## Verständlichkeit – größte Schwachstellen (in Reihenfolge)

1. Kap. 5.5 Schleife: das Muster (Kinderzimmer → zurückgesetzt → dritte Runde → Atem → Foto) bleibt ohne Vorwissen schwer; Aufgabenzeile und Gedanke nach 1. Fehlversuch jetzt vorhanden.
2. Kap. 5.2 Foto 1: keine zeitliche Hilfe.
3. Kap. 6.5 Hochsitz: Aufgabenzeile erst bei Nähe.
4. Kap. 6.9/6.10: Dienstbuch-Hinweis fehlte komplett (jetzt vorhanden).

## Umgesetzte Änderungen (Dateien)

- `app/mods/kapitel5.js`: Schleifen-Reset in `k5_setup` (Softlock), `k5_setzen` nur im Beat `tisch` (Toast in `schleife`), Film-Nachlage in Runde 3, Kerzen-Fallback in `k5_wieder`, Aufgabenzeile `Vier Gedecke … Hör hin, was unter ihrer Stimme läuft.`, Teller-Toast mit Brot-Hinweis, Aufgabe `zaun`, Gedanke nach 1. verpasstem Atem, totes Item `zaehlbuch` → `buch`.
- `app/mods/kapitel6.js`: Gitter-Aufgabe mit „E halten“, Hilfeleiter Fraßstelle/Hirsch/Bau, `Warten.`-Aufgabe der Falle eindeutig, Wolf-Gedanke ergänzt, Hochsitz-Start auch aus `epilog`, Mamas Kerze nur wenn aus Kap. 5 vorhanden (keine `/kerze/`-Suche mehr), `addItem` statt `story.items.push` (Pfandflasche, Seitenschneider, Funkgerät).
- `app/mods/neben6.js`: Annis-Schleife-Hilfen ab Fehlschlag 1/2, Text „Beim nächsten wart ich auf die Pause.“
- `app/mods/ausbau_ost_west.js`: Schuppen-Toast „Im Schuppen liegt noch mehr“.
- Items/Basis (Details in `qa_items.md`): `_base_source_index.html`, `whiskey.js`, `ausruestung.js`, `tausch.js`, `album.js`.

## Vorschläge GEDANKEN_FADEN (gedanken.js, **nicht geändert**) – vor `[/./, …]` einfügen

Reihenfolge beachten (erste Übereinstimmung gewinnt; bestehende Zeile `/Luke|Leiter/` steht davor – keiner dieser Texte enthält „Luke“/„Leiter“).

```js
  // Kapitel 5
  [/Hildes Kamera\. Nr\. 7|Mach ein Foto von Lucy/, 'Die Kamera heben – C –, auf Lucys Fenster in Nr. 3 halten und abdrücken. Sie bleibt stehen, solange ich sie ansehe.'],
  [/Vier Gedecke|Lucys Spieluhr\. Das Kinderzimmer/, 'Nicht essen. Die Spieluhr läuft im Kinderzimmer, hinten durch die Küche. Und wenn danach alles wieder wie vorher ist: nicht stehen bleiben, weitergehen.'],
  [/Bring Lucy die Spieluhr/, 'Lucy steht an der Kreuzung. Die Graue hinter mir nie lange aus den Augen lassen – im Lampenlicht zerfällt sie.'],
  [/^Brot\. /, 'Papas Platz in Nr. 1 – der Kanten Brot liegt noch da. Dann den Westweg hinunter zum Stall.'],
  [/Das Brot\. Auf den Teller/, 'Der Teller steht im Stall hinten bei den Paletten. Brot hinlegen und ihn nicht ansehen.'],
  [/^Warten\.$/, 'Er kommt nicht, solange ich hinsehe. Q halten: Augen zu, und bleiben.'],
  [/Das Gedenkfeld/, 'Mamas Platz am Tisch. Mamas Kerze und Peters Feuerzeug – sie pustet jedes Licht aus, nur dieses nicht.'],
  [/Nordzaun/, 'Der Junge ist zum Nordzaun gelaufen, hinter dem Spielplatz. Ihm nach, bis zum Gitter.'],
  // Kapitel 6
  [/Das Gitter aufbiegen/, 'Zum Gitter, E halten, bis es nachgibt. Der Junge ist darunter durch.'],
  [/Folge den Brotkrumen|Zayns Hütte/, 'Hildes Brot. Er hat es zerbröselt, Krume für Krume nach Norden. Ihr nach, zur Hütte hinten links.'],
  [/eingedrückten Zaun|rote Wolle/, 'Die Wolle spannt sich von Baum zu Baum, südöstlich, tiefer in den Wald. Irgendwo an ihr steht ein Hochsitz.'],
  [/Der Hochsitz\. Hinauf/, 'An der Leiter E drücken, um hinaufzusteigen. Oben steckt eine Seite an einem Nagel.'],
  [/Wolle führt weiter|Stell dich in die Mitte|Der Bus\. Irgendwas/, 'Der Bus steht östlich im Wald. Nicht den Draht am Boden berühren – in die Mitte, neben den Bus, wenn sie es so wollen.'],
  [/Warten\. In der Mitte/, 'Stehen bleiben. Lampe oben lassen. Der Wolf kommt nur näher, wenn ich wegsehe.'],
  [/Atmen\. Nur atmen/, 'E drücken, immer wieder. Oder mit Jonas’ Messer, E halten.'],
  [/Fraßstelle/, 'Neben dem Kadaver liegt ein Heft mit einer Dienstnummer. Lesen.'],
  [/Das Ding ist hier|Weg vom Bau/, 'Lampe oben lassen. Nicht rennen. Und nicht wegsehen, wenn es näher kommt.'],
  [/Jonas’ Lager|Kleine nackte Füße/, 'Den kleinen Füßen nach, Richtung Westen. Das Ding bleibt weg, solange die Lampe oben ist.'],
  [/Hinter dem Wrack/, 'Hofers letzte Seite liegt am Bau. Wenn die Lampe stirbt: E für die Batterie, dann E für das Feuerzeug.'],
  [/Whiskey fliegt voraus|Oben sitzt jemand/, 'Whiskey wartet, wenn ich zurückfalle. Ihm nach, zum Hochsitz. Oben: Q halten, nicht hinsehen.'],
```

## Offen / nicht prüfbar ohne Lauf

- Tatsächliche Klickbarkeit von „Eine Seite aus einem Dienstbuch“ (Fraßstelle) und der Wolle-Pfad-Dichte: Laufzeit-Inventur.
- Ob `whiskey_fly` bei belegtem `W.fl` den Rückruf ausführt (Epilog-Callback) – durch Fallback abgesichert.
- Kap. 5.9 `anrufLaeuft`: Tod/Abbruch im Gespräch hat keinen Rückfall (unwahrscheinlich).
