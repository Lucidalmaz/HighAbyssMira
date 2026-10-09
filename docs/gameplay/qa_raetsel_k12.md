# QA Rätsel und Pflicht-Hürden · Kapitel 1 und 2 (reine Code-/Textanalyse, 09.10.2026)

Methode: Quelltext gelesen (kapitel1.js, amt.js, zimmer7.js, feuer.js, qte.js, akte.js, tod.js, post.js, ausbau_ost_west.js, uebergang.js, lwo.js AG-07, Basis `_base_source_index.html`, gedanken.js, ziele.js). Keine Spielläufe. Bewertung: OK = lösbar und verständlich · unklar = lösbar, aber Hinweis schwach/irreführend · defekt = Fehler/Softlock.
Legende „Hilfe“: Aufgabenzeile (`MAIN[n]` / `setC2Objective`), `ZIELE_WARUM` (ziele.js), `GEDANKEN_FADEN` (Stufe „Hilfe“ 1, nach `GEDANKEN.stuck` s Stillstand an derselben Aufgabe).

## Kapitel 1

| # | Rätsel / Hürde | Lösung / Schrittfolge (Code) | Hinweise (wo/wann) | Bewertung | Verbesserung |
|---|---|---|---|---|---|
| 1.1 | Briefkasten Nr. 7 → Schlüssel | `kapitel1_briefkasten`: Briefkasten klicken → `state.hasKey`, `door7.locked=false`, `setMain(1)`, Schlüssel + Zettel | MAIN[0] „Finde Haus Nr. 7“; ZIELE_WARUM („Lucy hat früher immer was im Briefkasten versteckt“); verschlossene Tür: „Abgeschlossen. Lucy hat den Schlüssel sicher irgendwo versteckt. Irgendwo in der Nähe.“; Faden „Weg in Haus Nr. 7“; Whiskey pickt am Briefkasten | OK | – |
| 1.2 | Haustür | `doorAction`: offen sobald `locked=false`; Öffnen → `setMain(2)` | MAIN[2] „Durchsuche Haus Nr. 7 …Band im Keller“ | OK | – |
| 1.3 | Kühlschrankzettel / Kalender → Hinweis auf 3110 | Zettel „31.10.“ → `setMain(3)`; Kalender „31. dick eingekreist“ | Zettel (31.10.), Kalender, Polaroid (31.10.), Faden „Durchsuche …“ nennt Kalender | OK | – |
| 1.4 | **Tastenfeld Kellertür 3110** | `kapitel1_kpPress`: Eingabe `3110` (Tag 31, Monat 10) | Beim Öffnen: „Drei Tasten abgegriffen: 0, 1 und 3“. Fehler 1: Kratzen + Lucy-Stimme + Blick zum Kalender; Fehler 2: „Tag und Monat“; Fehler 3: Schreck + „Lies, was im Haus liegt. Der Kalender weiß den Tag.“; 40 s Gedanke; Whiskey-Fenster bei Fehler 5. **Lücke:** ab Fehler 4 war die Meldung leer (`kpSay('')`); die alte Basishilfe „Erst der Tag, dann der Monat“ fiel weg. MAIN[3] „Öffne die Kellertür.“ sagte nicht, dass es ein Ziffernschloss ist | unklar → behoben | **Umgesetzt (kapitel1.js):** Fehler 4: „Der Kalender weiß den Tag. Erst der Tag, dann der Monat.“; Fehler 5: „Stille.“; ab 6: „Nur 0, 1 und 3 sind abgegriffen. Der eingekreiste Tag, dann der Monat.“; MAIN[3] = „Öffne die Kellertür. Das Tastenfeld will vier Ziffern.“ |
| 1.5 | Keller: Zettel, Rekorder, Band | `kapitel1_band`: 1. Klick Zettel am Rekorder, 2. Klick „Kassette abspielen“ (Band läuft, bei Stillstand 1,2 s weiter) → „… danke, Luke …“ → `heardTape`, `setMain(5)` | MAIN[4] „Finde heraus, was Lucy hinterlassen hat“; Zettel „Erst hören, dann heim“ an Rekorder und Wand; Interaktionsname wechselt „Zettel am Rekorder“ → „Kassette abspielen“; Treppe vorher: „Noch nicht. Lucy wollte, dass du hier etwas findest.“; Faden („Lucy hinterlassen“) | OK | Faden-Text konkreter (siehe unten) |
| 1.6 | Treppe nach oben | `kapitel1_treppe` → `leaveBasement` nur mit `heardTape` | MAIN[5] „…die Treppe hoch. Hinterher.“; Faden „Die Haustür. Vorhin war die zu.“ | OK | – |
| 1.7 | Stromausfall | startet nach 150 s oder 14 m vor Nr. 7 (`kapitel1_ausfall`); Hilde/UFO-Kino läuft von selbst | **Defekt (Aufgabenzeile):** `kapitel1_ausfall` ersetzt die Basisfunktion und rief `setMain(6)` nicht auf → während des Ausfalls blieb „Hinterher“ stehen | defekt → behoben | **Umgesetzt:** `setMain(6)` in `kapitel1_ausfall`; `MAIN[6]` = „Der Strom ist weg, die Laternen erlöschen. Geh nach draußen und sieh nach, was da kommt.“ |
| 1.8 | Versteck vor dem Lichtkegel | `kapitel1_versteck`: Deckung (Hecken, Tonnen, Veranda, Bäume …) oder Keller; erwischt = gehoben + fallen gelassen, kein Tod; Ziel erreicht, wenn Luke die Kellertür/Treppe erreicht | MAIN[7] „Versteck dich vor dem Licht. Zurück in den Keller – unter der Erde sieht sie dich nicht.“; Vegas ruft von der Veranda; Whiskey wartet auf Deckungen; Faden „Hecken, Mülltonnen, Veranda“ | OK | – |
| 1.9 | Kellerende: Hand an die Wand | `kapitel1_kellerEnde` → Interaktion „Die Hand an die Wand legen“ → `kapitel1_ende` | Zeile „Hinter die Bilder. Lucy.“; **Lücke:** Aufgabenzeile blieb „Versteck dich vor dem Licht“ (veraltet), Wand ist zugleich Zeichnungswand (zwei Interaktionen) | unklar → behoben | **Umgesetzt:** nach der Zeile Ziel „Hilde hat auf die Zeichnungswand gezeigt. Leg die Hand an die Zeichnungen.“ (setMain(8) überschreibt danach) |
| 1.10 | Geheimes Ende „Fahr heim“ | nur vor dem Tonband | Haltestelle „Auf den ersten Bus warten“ | OK (optional) | – |
| 1.11 | Nebenaufgabe „Sind sie wieder da?“ (Karten, Nr. 2) | 16 Karten nach Poststempel ordnen, 17. im Gras | Poststempel (Jahr) war **nicht sichtbar**, Orte doppelt (Kiel ×2, Göttingen ×2, Kassel ×2, Kreisstadt ×3) → nur Raten; nach Fund der 17. musste alles neu geordnet werden | unklar → behoben | **Umgesetzt (post.js):** Knopf zeigt „Stempel 20xx“; Text „… die älteste zuerst“; Stand der ersten 16 wird gemerkt (`steps.k16`), 17. wird einzeln einsortiert |
| 1.12 | Nebenaufgabe Dina/Scheune (Kap. 1) | Lampe aus, dem Summen folgen | Hilfestufen 1–5; Stufe 3 wurde nie vergeben, Stufe 5 sprach „Hier. Du Trampel.“ doppelt | unklar → behoben | **Umgesetzt (ausbau_ost_west.js):** Stufe 3 (ab 75 s: „Links/Rechts von mir. Nah.“), Doppelzeile entfernt |
| 1.13 | Nebenaufgabe Geldkassette (Tankstelle) | Code 0313 (Leuchtschild) | Leuchtschild + Schaufenster-Kalender; **sideDone beim Öffnen**, obwohl die Aufgabe „(n/5)“ Spuren verlangt → vorzeitiger Abschluss; kein Hinweis bei Fehlversuchen | defekt (Logik) → behoben | **Umgesetzt:** Abschluss erst bei 6/6 (inkl. Kassette), Hinweis ab 3 Fehlversuchen |

## Kapitel 2

| # | Rätsel / Hürde | Lösung / Schrittfolge (Code) | Hinweise | Bewertung | Verbesserung |
|---|---|---|---|---|---|
| 2.1 | Gang hinter der Wand → Amt-Tunnel | Kapitelwechsel durch Gehen (`uebergang.js`), Tür fällt zu | MAIN[8], C2_MAIN[0] „Folge dem Gang. Irgendwo hier unten ist Lucy.“, Zeile „Hinter dir fällt die Tür ins Schloss“ | OK | – |
| 2.2 | Archiv: sieben Akten + **Ordnungstafel** | Reihenfolge Roxy, Lucy, Mike, Dina, Heidi, Luke, Zayn (Rückführungszeit aus den Akten) | Aufgabe nach 3 gelesenen Akten: „Bring die Namen in die richtige Reihenfolge.“; Tafel: „Wer zuerst kam, steht links“; Fehler: Nadeldrucker, ab 2/4/6 Hilfe (Zeile, Band, leuchtendes Feld). Akte 01 nennt „erste Rückkehr“ (löst Roxy/Lucy-Mehrdeutigkeit) | OK (Aufgabentext war zu knapp) | **Umgesetzt (amt.js, AMT_ZIEL):** „Bring die Namen in die richtige Reihenfolge. Die Ordnungstafel im Archiv: wer zuerst zurückkam, steht links.“ |
| 2.3 | Schublade → Schlüssel ZIMMER 7 | Nach Lösung Schublade klicken, Protokoll schließen → `z7_protokoll` | Toast „Die unterste Schublade … springt auf“, Aufgabe „Ein Schlüssel aus der Schublade: ZIMMER 7“. **Softlock-Verdacht Laden:** nach Speichern (Zahlenschloss `saveGame(2)`, Beobachter) wurde die Schublade nach „Weiterspielen“ nicht neu verdrahtet. Korrektur der Vorab-Meldung: der Schlüssel selbst kommt über `zimmer7.js` (CH2_BEGIN) wieder; verloren ging nur das Protokoll (Story-Text, Lore) und die Schublade war tot | unklar → behoben | **Umgesetzt:** Callback als Funktion `archiveDrawerRead()` (Basis), `tod_ch2Apply` registriert sie bei geladener gelöster Tafel neu |
| 2.4 | Zimmer 7 → Schlüssel SICHERUNG | Tür mit Schlüssel, Schlüssel am Haken nehmen | Schild „ZIMMER 7 · H. WENDT“, Band „Zimmer sieben ist heute geschlossen“; Haken-Interaktion „Schlüssel am Haken“; danach Aufgabe „Ohne Strom … Sicherungsraum“; falscher Schlüssel am Sicherungsraum erklärt sich („auf seinem Schild steht ZIMMER 7“) | OK | – |
| 2.5 | Sicherungsraum / Sicherungskasten (6 Hebel) | Hebel 2-3-4-5 einschalten (1 und 6 leuchten schon); leuchtender Hebel wird bestraft (laut, Nachbarn fallen) | Kreide „Fang nie mit dem an, der schon leuchtet“; Zeilen nach 6/15 Umschaltungen, nach 30 Reset mit leuchtendem Hinweis; Funk AG-06 vorher | OK | Faden-Eintrag (siehe unten) |
| 2.6 | Spinnenraum (Schüttel-QTE) | Maus wild / A-D hämmern | Aufgabe „SCHÜTTLE SIE AB — Maus wild bewegen oder A und D abwechselnd hämmern“, HUD, Barrierefreiheit `settings.qte` | OK | – |
| 2.7 | Prüfraum 3: Feuerzeug (Pflicht für die Osttür) | Matratze in Peters Zelle, Feuerzeug nehmen → Riegel springt | Tür: „Der Riegel sitzt“; nach 20 s Aufgabe „Die Matratze. Da glänzt was.“ | OK | – |
| 2.8 | Flucht vor Peter: Fass, Öl, Feuerzeug, Notschalter | QTE Losreißen → Fass (E) → Peter liegt im Öl → „Das Öl anzünden“ (E) → Brandalarm, Notentriegelung E halten; Rückweg ohne Kampf nach 90 s | Aufgaben „Das Öl anzünden – schnell! (E)“, Fehlschlagtexte („Zu nah am Öl“, „Du stehst selbst im Öl“), nach 10 s „Das Öl liegt noch da. Das Feuerzeug auch.“, nach 90 s Alarm-Rückfall, rote Leuchte | OK | – |
| 2.9 | AG-06 / AG-07 (Schleichen, Atem anhalten) | AG-07: Lampe aus, still stehen hinter den Schränken, bei Nähe LEERTASTE halten | HUD-Hinweise „Lampe aus. Still. Hinter die Schränke.“ und „LEERTASTE Atem anhalten“, Neustart ohne Tod | OK | Lauf bestätigt später |
| 2.10 | Messraum: **Klavier E D C H C** | 5 Töne; Lucy summt und beschlägt die richtigen Tasten (nach 3 Fehlern langsamer, nach 6 bleibt Beschlag) | Aufgabe „Lucy ist im Tank. Sie summt. Spiel auf dem Klavier nach …“; Notenblatt „E D ? ? ?“; Spieluhr in Kap. 1 (Tastenfeld) | OK | Faden-Eintrag (siehe unten) |
| 2.11 | Akte 08 (Fach springt auf) | Fach nach dem letzten Ton, Akte klicken | Zeile „Beim letzten Ton springt ein Aktenfach …“, Aufgabe „Lies die achte Akte.“ | OK | – |
| 2.12 | Lucy im Tank / Finale / Gully | Dialog, Kino, Aufstieg (E halten) | Aufgaben „Lucy.“, „Die Leiter hinauf.“, „Klettern. E halten.“ | OK | – |
| 2.13 | Nebenaufgabe Hängeregistratur-Zahlenschloss („Alle siebzehn“) | 1958 · 1975 · 1992 · 2009 (aufsteigend, je +17) | Kreide „Alle siebzehn.“; Hinweise nach 2 und 4 Fehlern. **Fehler:** „Von 2009 rückwärts“ verleitete zur absteigenden Reihenfolge (2009, 1992 …) | defekt (Hinweis irreführend) → behoben | **Umgesetzt (amt.js):** Fehler 2: „Alle siebzehn Jahre. Von 2009 rückwärts. Und dann das älteste zuerst.“; Fehler 4: „Vier Felder, vier Jahre. 2009 minus 17, minus 17, minus 17. Das älteste links.“; exakte Gegenreihenfolge → „Richtig gerechnet, falsch herum. Das älteste zuerst.“ |
| 2.14 | Nebenaufgaben Kantine, Gründung (Leiter), Kühlregal, Modell, Vernichter, Bogen | siehe amt.js | Gründung: „Zu hoch. Irgendwo muss eine Leiter sein.“; Kühlregal: „Ohne Strom rührt sich nichts“ | OK (Stichprobe) | – |

## Sackgassen / Softlocks (Befund)
- Keine harte Sackgasse in Kap. 1 gefunden: Die Haustür nach dem Keller wird per Tick geöffnet (Kommentar im Code), Treppe ist während des Versteckens bewusst zugenagelt, `vTick` löst das Keller-Ende selbst aus.
- Kap. 2: Zimmer-7-Kette überlebt Laden (siehe 2.3). Sicherungsraum-Schlüssel nach Laden: zimmer7.js stellt `fuseKey` nur wieder her, wenn er genommen war; sonst muss Luke nochmal zu Zimmer 7 (gewollt, Aufgabentext passt).
- Offen, nicht geändert: Faden-Eintrag `Keller von Nr. 7` (Hinweis „Werkbank“) bezieht sich auf die Alt-Aufgabe MAIN[7] und wird nie mehr getroffen. Auch das Toast in uebergang.js („Oben im Hauswirtschaftsraum steht eine Werkbank“) ist unerreichbar (Kap. 1 öffnet die Wand selbst).

## Vorschläge GEDANKEN_FADEN (gedanken.js, geteilt – hier nur vorgeschlagen)
Einfügen vor `[/Luke|Leiter/ …]`, damit nichts abgefangen wird (Muster: Regex gegen den Text der Aufgabenzeile). Reihenfolge innerhalb der neuen Einträge egal.

```js
  [/Das Tastenfeld will vier Ziffern/, 'Vier Ziffern. Welche Tasten sind abgegriffen? Und welcher Tag ist in Hildes Kalender eingekreist?'],  // ersetzt/ergänzt /Kellertür/ (MAIN[3] enthält „Kellertür“, Eintrag bleibt gültig)
  [/Lucy hinterlassen/, 'Lucy war hier unten. Etwas zum Anhören. Ein Kassettenrekorder, irgendwo bei der Zeichnungswand.'],  // schärft den vorhandenen Eintrag
  [/Der Strom ist weg, die Laternen/, 'Das Brummen. Die Laternen gehen aus, eine nach der anderen. Raus, nicht im Haus festsitzen.'],  // MAIN[6]
  [/Leg die Hand an die Zeichnungen/, 'Hilde hat auf die Wand gezeigt. Die Zeichnungen. Da hinten, wo es warm ist.'],
  [/Finde das Zimmer/, 'Zimmer 7. Hildes Büro. Die Tür mit dem Emailleschild im Durchgang hinter dem Archiv.'],
  [/Sicherungsraum und schalte den Strom/, 'Sechs Hebel. Wer schon leuchtet, bleibt in Ruhe.'],
  [/auf dem Klavier nach/, 'Lucys Lied. E, D … den Rest hab ich schon gehört. Die Spieluhr. Die Stimme hinter der Kellertür.'],  // Achtung: nicht /Das Klavier/ – die angezeigte Aufgabe lautet „Spiel auf dem Klavier nach …“ (AMT_ZIEL)
  [/Die Ordnungstafel im Archiv/, 'Wer zuerst zurückkam, steht links. Die Zeiten stehen in den Akten. Lies sie nochmal.'],  // ersetzt /Namen in die richtige Reihenfolge/ (Satz bleibt in der Aufgabe erhalten)
```
Hinweis: `/Luke|Leiter/` fängt jede Aufgabe mit „Luke“ ab (z. B. künftige Texte mit dem Namen) – den Eintrag zu `/Die Leiter hinauf|Klettern/` schärfen.

## Umgesetzte Änderungen (Dateien)
- `app/mods/kapitel1.js`: MAIN[3] und MAIN[6]; `setMain(6)` im Stromausfall; Tastenfeld-Meldungen ab Fehler 4; Ziel im Keller-Ende.
- `app/mods/amt.js`: Zahlenschloss-Hinweise (inkl. Erkennung der Gegenreihenfolge); AMT_ZIEL für die Ordnungstafel.
- `app/mods/_base_source_index.html` und `app/mods/tod.js`: `archiveDrawerRead()` ausgelagert und nach Laden neu angebunden.
- `app/mods/post.js`: Stempel sichtbar, 17. Karte einzeln.
- `app/mods/ausbau_ost_west.js`: Dina Hilfestufe 3, Doppelzeile; Geldkassette Abschlusslogik und Hinweis.
- `node --check` für alle geänderten Module ok, `tools/assemble.js` läuft durch (game/index.html neu gebaut).
