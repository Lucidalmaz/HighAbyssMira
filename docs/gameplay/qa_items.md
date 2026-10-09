# QA Item-/Sammel-Kette (alle Kapitel, 09.10.2026) – statische Analyse

Grundlage: `docs/gameplay/qa_inventar.md` (Abschnitt Sammel-Quellen: 81 `addItem`, 69 `modItem`, 7 `mystFound`, 28 `beobachter_zettel`, 10 `beob_drop`, 32 `sammeln_fibel`, 2 `lore`) plus Querlesung der Verwendungsstellen (`story.items.includes`, `k5_hat`, `k6_has`, `hasItem`). Rund 90 Gegenstands-Schlüssel. Laufzeitteil (tatsächliche Klickbarkeit) steht aus.
Kapitel 5/6 sind im Detail geprüft (Code gelesen), Kapitel 1–4 über Schlüsselsuche + Stichproben der Verwendungsstellen (anwesen, amt, ausruestung, kapitel3-Gaben, whiskey). **Pflicht** = ohne den Gegenstand/Vorgang geht der Hauptweg nicht weiter. **VERPASSBAR** = nur in einem Zeitfenster aufnehmbar.

Schwere: **H** = harter Softlock (Hauptweg), **M** = Gegenstand/Fortschritt geht verloren oder wird unsichtbar, **N** = kosmetisch/optional.

## Systemische Befunde und Fixes

| ID | Schwere | Befund | Fix |
|---|---|---|---|
| B1 | M | Mod-Gegenstände (`modItem`) werden beim Laden nicht neu registriert: `story.items` enthält den Schlüssel, `ITEMS[k]`/`ICONS[k]` fehlen → leerer Slot, `TypeError` beim Hover (`it.name`), `beutel.js` überspringt. Betroffen u. a. `villaschluessel`, `schluesselteile`, `dienstnadel`, `da10`, `miras_ring`, `n3_*`, `euro_bruno`, `kaugummipapier`, `mamas_kerze`, `brot`, `lucys_spieluhr`, Justin-Gaben, `ow_*`, `lucy_zigaretten`, `autoschluessel`. | **behoben** in `_base_source_index.html`: `ITEM_DEFS` (jedes `modItem` merkt sich Name/Beschreibung/Symbol), `saveGame` schreibt `idefs` für alle Inventar-Items (auch solche, die nur `ITEMS[k]=…` setzen), `applySave` stellt sie wieder her; ältere Spielstände: Notbezeichnung (Schlüsselname mit Leerzeichen statt Unterstrich) und `ICONS.paper`. `addItem` und `renderJournal` fallen bei fehlendem Eintrag nicht mehr um. |
| B2 | N | `ICONS.murmel`/`ICONS.sender` fehlen. | **behoben** durch den `ICONS[k] \|\| ICONS.paper`-Fallback in `renderJournal`. |
| B3 | N | Inventar zeigt nur 12 Slots; weitere Items unsichtbar. | **behoben:** Slots = max(12, Aufrunden auf Vielfache von 6), Buch scrollt (`max-height 84vh; overflow:auto`). |
| R1 | M | Whiskeys Klau-Mechanik (`WHISKEY_NIE`) kann Kettenitems nehmen; Rückgabe erst „an der nächsten Station“ → mitten in einer Aufgabe fehlt der Gegenstand (z. B. `lucys_spieluhr`, `brot`, `spindschluessel`). | **behoben** (`whiskey.js`): in die Sperrliste aufgenommen: `lucys_spieluhr, brot, n3_kapschluessel, n3_pfarrschluessel, n3_brecheisen, leiter_amt, spindschluessel, lampion, dienstnadel, haushaltsbuch, riegel_halb, ranzenriemen, schnalle_turm, seitenschneider, hildes_antworten, heidi_karte, umschlag7, wartenummer`. |
| R2 | M | Kap. 2: `fuseIn` (Sicherung eingesetzt) wird nicht gespeichert; Sicherung ist aus dem Inventar, `taken` hat `c2_sicherung` → nach Laden: Steckplatz leer, Sicherung weg, Strom kommt nie (wenn noch nicht `ch2.power`). | **behoben** (`ausruestung.js`): entnommen + nicht im Inventar zählt als eingesetzt. |
| R3 | M | Kap. 5: Mamas Kerze fehlt am Grab (Ladepfad); `kapitel5.js` gibt sie nur in der Heimkehrerin-Szene. | **behoben:** `k5_wieder` gibt sie bei Spieluhr/Lucy/Stall/Friedhof nach, wenn sie fehlt und nicht schon angezündet. |
| R5 | N | Kap. 3 Schuppen (`ausbau_ost_west.js`): erster Klick liefert nur die Heftseite, der Drahtschneider kommt erst beim zweiten – kein Hinweis. | **behoben:** Toast „Im Schuppen liegt noch mehr – sieh noch einmal hin.“ |
| R6 | – | Kap. 4 ohne Brechstange: war schon abgedeckt (`anwesen.js:214` gibt sie bei `chapter4Begin`). | – |
| B4 | N | `kapitel6.js` `k6_welt`: suchte `/kerze/` in `ITEMS` und gab beliebig die erste passende Kerze, unabhängig von Kapitel 5. | **behoben:** nur `mamas_kerze`, nur wenn Kap. 5 sie wirklich hatte (`k5.f.kerze` oder Lore `k5_schlafenszeit`), nur beim Neustart, nicht beim Laden. |
| B5 | N | Tote Schlüssel: `kapitel5.js` `'zaehlbuch'` (richtig: `buch`); `kapitel3.js:267` `'riegel'`; `'lesebrille'` (tausch.js, nie vergeben); `'heini'` (kapitel6, wird über `polaroid_heini`/Lore abgedeckt). | `zaehlbuch` → `buch` **behoben**. `'riegel'` bewusst **nicht** auf `riegel_halb` geändert (sonst würde die Kap.-5-Einlösung des Geschenks B zerstört; der tote Schlüssel schützt sie) – Zeile ist funktionslos, kann gelöscht werden. `lesebrille`/`heini` offen/harmlos. |
| B7 | N | `story.items.push` ohne Popup (`kapitel6.js` Pfandflasche/Seitenschneider/Funkgerät, `tausch.js`, `album.js`). | **behoben:** `addItem`. Verbleibend (nicht angefasst): Whiskey-Rückgabe, `feuer.js:711/715` (Feuerzeug beim Laden, absichtlich still). |
| K5 | H | Kap. 5 Schleife: Softlock nach Tod/Laden in der Schleife (siehe `qa_raetsel_k56.md` 5.5). | **behoben** (`kapitel5.js`). |
| K5-F | M | Kap. 5 Runde 3 ohne Film (3 Bilder Startbestand, frei verknipsbar). | **behoben:** wird 1 Film nachgelegt. |
| K6-E | H | Kap. 6 Epilog: ging der Rückruf von `whiskey_fly` verloren, startete das Ende nie. | **behoben** (`k6_oben`). |

## Kette je Kapitel

Legende: Q = Quelle (Ort/Bedingung), V = Verwendung, P/O = Pflicht/optional, ⚠ = verpassbar/Risiko.

### Kapitel 1
| Item | Q | V | P/O | Hinweis |
|---|---|---|---|---|
| `key` (Schlüssel Nr. 7) | Briefkasten Nr. 7 (`state.hasKey`), kiffen/kapitel1 Alternativen | Haustür Nr. 7 | P | Tür prüft `state.hasKey`, nicht das Item – Item nur Anzeige |
| `tape` (Lucys Tonband) | Kassette im Keller (kapitel1 `band`) | Keller → Kapitelende | P | |
| `collar` (Brunos Halsband) | Aschekreis | Vegas (Albers) | O | |
| `phone` | Auto (`lore phone`) | Fibel | O | |
| `ring_hufeisen`, `euro_bruno` | Albers (k1Klopfen) | Fibel/Tausch | O | |
| `autoschluessel` | Whiskey-Tausch | Kap. 1 Auto | O (Fahrt) | `kapitel1.js:559/600` prüft, Fahrt = Endbild |
| `lucy_zigaretten` | Handschuhfach (post) | `post.js:97` | O | |
| `futterdose` | Kirchberg Näpfe-Finale | – | O | |

### Kapitel 2
| `fuse` / `sicherung` | Z7-Aushang `fuse` (Pflicht, Haken Zimmer 7) / Archiv-Aktenschrank `c2_sicherung` | Sicherungsraum / Kasten | P | ⚠ R2 behoben |
| `zimmer7`, `einwilligungen` | Zimmer 7 / Aushang | Aktenraum, Lösch-Reihenfolge Laternen (Kap. 3) | P/O | `einwilligungen` ist Rätselgrundlage (Gedanken-Hinweis nennt sie) – bleibt nach Aufnahme im Inventar/Lore |
| `leiter_amt` | Sicherungsraum | Archivschrank „Gründung“ | O | in Sperrliste |
| `wartenummer`, `umschlag7` | Nummernautomat, Akte 08-Fach | Fibel/Akte | O / P-Story | |
| `brechstange` | Werkbank Nr. 7 (Hauswirtschaftsraum) | Wand Kap. 1→2 (`uebergang.js:47`), Kellerfenster Kap. 4 | P | ⚠ Fallback `chapter4Begin`; für Wand Kap. 1: Hinweis „Oben… Werkbank“ vorhanden |
| `drahtschneider` | Schuppen Parz. (ow) | Tor, Vogelscheuche, Welpe | P (Tor wird in Kap. 4 automatisch geöffnet) | ⚠ ohne ihn fehlt Teil 02 – Whiskeys Nest gleicht aus; ow-Hinweis ergänzt |
| `batterie` | Werkbank, Tankstelle (3×) | Taschenlampe | P-weich | |

### Kapitel 3
| `buch` (Zählbuch) | Kap.-3-Szene `kapitel3_zaehlbuch` | Albers/Weiss, Kap. 5 Brett-Randnotiz | O | |
| `n3_*` (Glocke, Brecheisen, Pfarr-/Kapellenschlüssel, Ordner, Lieferschein, Schuh, Kassetten, Predigtmappe) | Nebenaufgaben (neben3/albers) | Kapelle/Pfarrhaus | O | Kettenitems `n3_kapschluessel`, `n3_pfarrschluessel`, `n3_brecheisen` jetzt diebstahlsicher |
| `kaugummipapier`, `thermoskanne` | lwo-Haken (Wolter) | Albers (Tausch), Villa | O | |
| Justin-Gaben `ranzenriemen`/`riegel_halb`/`schnalle_turm` | Justin (Wahl A/B/C, einmal) | Kap. 5: Riemen bei Gisela (Beat `licht`), Riegel auf Nr. 7 (Beats `kamera`–`foto1`), Schnalle im Stall-Fundament (Beats `brot`–`stall`) | O (Einlösung) | ⚠ **VERPASSBAR** (Zeitfenster je Beat); Hauptweg läuft ohne; Verlust = nur Lore-Zeile |

### Kapitel 4
| `haushaltsbuch`, `thermos_bfr`, `tonband_ast`, `thermoskanne` | neben4 | Fibel, Kap. 6 teils | O | |
| `schluesselteile` (acht Teile) → `villaschluessel` | Nest/Brunnen/Vogelscheuche/…; Whiskeys Nest gleicht fehlende Teile aus (außer Teil 04: Kellerfenster, Brechstange) | Presse → Villa-Tür | P | gut abgesichert |
| `dienstnadel`, `da10`, `miras_ring` | Villa (Bett, Dienstanweisung, W11-Akte) / Whiskey-Gabe (Ring) | Kap. 5 „Ring passt in Narbe“ (Story), Villa | O/P-Story | `miras_ring` doppelt vergeben (villa:1106 + whiskey:413) – `addItem` dedupliziert |
| `zayn_kamera`, `zayn_kassette`, `cleo_*`, `geh_lichtstein`, `nord_*` | zayn/cleo/geheimnisse/ausbau_nord | Fibel-Reiter, Baumhaus | O | `baumhausschluessel` (Whiskey) = P für Cleo-Baumhaus-Nebenzweig |

### Kapitel 5
| Item | Q | V | P/O | Hinweis |
|---|---|---|---|---|
| `polaroid_kamera` | Nr. 7 Wohnzimmer | Fotos 1/2, Friedhof-Blitz | P | |
| Filmpacks (Zähler, kein Item): Besteck, Laube, Kommode, Kranz | siehe Rätselliste | Kamera | P-weich | ⚠ 0 Film in Runde 3 → Notfilm (behoben) |
| `mamas_kerze` | Tisch (nach der Heimkehrerin) | Friedhof-Anzünden | **P** | ⚠ Fallback `k5_wieder` (behoben); in Sperrliste |
| `feuerzeug` | Kap. 2 (Peter) / Fallback `k5_welt` | Friedhof, Kap. 6 Bau | **P** | ⚠ `feuer.js` Quelle; Fallback in Kap. 5 und 6 vorhanden |
| `lucys_spieluhr` | Kinderzimmer | Lucy an Kreuzung | **P** | ⚠ Fallback am SP `k5_spieluhr` |
| `brot` | Papas Platz, ab Beat `spieluhr` | Stallteller | **P** | ⚠ Fallback am SP `k5_stall`; **VERPASSBAR?** Nein: bleibt greifbar bis `stall`; Hinweis jetzt im Teller-Toast |
| `heidis_karten` | Tisch Runde 1 (nur Schleife) | Lore | O | ⚠ **VERPASSBAR** (nur Runde 1–`stall`, einmalig) |
| `rechnung_kuehnle`, `polaroid_heini` | Grabhügel / Foto Grete | Fibel/Kap. 6 AG-18 | O | |
| `riegel_halb`/`ranzenriemen`/`schnalle_turm` | Kap. 3 Justin | siehe Kap. 3 | O | |
| Neben5: `hildes_antworten`, `heidi_karte`, `brecheisen`, `boerek`, `brief_edda`, `rechnung_durchschlag` | Neben5 | Briefkasten, Telefonzelle, Schuppen | O | `boerek` wird nach 16 s im Beat `tappen` gefuttert (zeitgebunden, optional) |
| `n5` Lore `k5_*` (Foto 1, Küchenfenster, Heimkehrerin, Handtausch, Mama, Riemen, Riegel, Schnalle, Cleo, Rechnung, Plakat, Heini) | Szenen | Fibel „Funde“ | O | meist einmalig und an Beat gebunden |

### Kapitel 6
| Item | Q | V | P/O | Hinweis |
|---|---|---|---|---|
| `feuerzeug`, Lampe, Batterien (3) | Kap. 2 / Start (`FLASH.spare ≥ 3`) | Finale `k6_lampeStirbt` | P | Finale bleibt auch ohne Feuerzeug-Item lösbar (Hinweis-Leiste greift nicht auf das Item zu) |
| `pfandflasche` | Waldweg (Hütte) | Humor/Lärm (Hochsitz, Whiskey wirft sie) | O | wird absichtlich zerstört (`flasche = 3`) |
| `seitenschneider` | Wolter-Tasche (AG-18, Option) | Welpe (Gitter braucht ihn nicht) | O | ⚠ Nur bei Dialogoption (`schneiderFrei`); Welpe geht auch mit Drahtschneider |
| `bergungsfunk` | Leiche (AG-20) | Hochsitz zurücklegen | O | Fibel-Punkte |
| `jonas_messer`, `plombe`, `jonas_karte` | Welpe frei; Lager | Netz (Messer), Karte | O | `wald_welpe`-Lore genügt für „Messer“ im Netz |
| `spindschluessel` → `lampion`; `pell_kassette` | Hochsitz-Fuß; Spind im Bus; Wrack-Handschuhfach | Hungrige-Stimme „Anni 5“, Fibel | O | Whiskey-sicher gemacht |
| `murmel` | Beobachter-Finale (13 Zettel) | – | O | |
| `sender` | AG-09 (Kap. 3), K6 V-11 | Variante A/B/C → Falle | O | `ICONS.sender` fehlte (behoben via Fallback) |
| Dienstbuch-Seiten 1–6, Pell-Seiten 1–9 | Kap. 6 Orte | Fortschritt Seite 1/6 **P**, Rest O | **Seite 1 und 6 = P** | Hilfen ergänzt (siehe Rätseldoku) |

## Verpassbare / zeitgebundene Gegenstände (Zusammenfassung)

| Item/Fund | Fenster | Hauptweg betroffen? | Maßnahme |
|---|---|---|---|
| Riemen / halber Riegel / Schnalle (Justin-Geschenke) | Beat-gebunden Kap. 5 | nein | akzeptiert (Lore „Einlösungen“ optional); bei Wunsch: Einlösung nachholbar machen (nicht umgesetzt – Story) |
| Heidis Karten | Schleife Runde 1 bis `stall` | nein | akzeptiert |
| Börek füttern | Beat `tappen`, 16 s | nein | akzeptiert |
| Filmpacks | Kommode nur ab Runde 2, Besteck nur Beat `kamera`–`foto1` | **ja** (Foto Runde 3) | Notfilm in Runde 3 (umgesetzt) |
| Brot | ab `spieluhr` bis Stall | **ja** | Fallback beim Respawn + Hinweis im Teller-Toast |
| Mamas Kerze | Tisch bis Heimkehrerin | **ja** | Fallback in `k5_wieder` |
| Feuerzeug / Öl nach Peter | Kap. 2 Quelle; später nur gelesen, nie verbraucht | **ja** (Kap. 5/6) | `k5_welt` und `k6_welt` geben es zurück (bestehend); Öl existiert nicht als Item |
| Fibel-Einträge an Ereignissen (`R-K5c` Kerze, `R-K6` Anni 1, `D-11` Zwei Lukes, `J-15` Weiher) | Ereignis-gebunden | nein | siehe `sammeln_fibel`; `R-K6` hängt an Verlassen der ersten Stille-Zone (Beat `faden`), `D-11` an Wahl „Kommst du mit heim?“ |
| Beobachter-Zettel `b_k6_0x` | Positionsgebunden, einmal | nein | optional (13 Zettel → `murmel`) |

## Anzeige in Inventar/Fibel

- Inventar: nach Fix alle Items sichtbar (scrollbar), Name/Beschreibung stets vorhanden, Symbol Fallback Papier. Batterie-Anzahl bleibt dynamisch.
- Fibel/„Funde“: `story.lore` wird gespeichert; `k5_lore`/`k6`-Einträge bleiben nach Laden erhalten. `pell_projekt` und `hungrige_seite_6` ändern Titel zur Laufzeit (`Projekt W` → `Projekt WENDIGO`).
- Offene Punkte für den Laufzeit-Lite-Lauf: `beutel.js` `BEUTEL_FUNDE` (2 Einträge) und Slot-Rendering nach Laden; Hover-Text in `renderJournal`.

## Vorschläge GEDANKEN_FADEN (Item-Kette)

Zusätzlich zu `qa_raetsel_k56.md` – Aufgabentexte, an denen ein fehlendes Item hängt:

```js
  [/Brot\. Der Kanten von Papas Platz/, 'Papas Platz am Tisch in Nr. 1 – dort liegt der Kanten Brot, nicht angeschnitten. Mitnehmen, dann zum Stall.'],
  [/Mamas Platz/, 'Mamas Platz am Tisch: Kerze und Feder. Die Kerze hab ich noch. Peters Feuerzeug auch.'],
  [/Schließ die Tür auf|Die Villa Seiler/, 'Acht Schlüsselteile, eine Presse im Garten. Was fehlt, hat vielleicht der Vogel in seinem Nest.'],
```
