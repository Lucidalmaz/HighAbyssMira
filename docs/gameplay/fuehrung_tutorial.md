# Tutorial und Wegführung (Konzeption, Stand 12.10.2026)

Auftrag (Nutzer): Tutorial ausführlicher; die Pfeile und Striche auf dem Boden **einmal erklären**; nicht übertrieben, wie in AAA-Spielen; geführter und natürlicher.
Texte: `docs/gameplay/fuehrung_texte.json` (Art `tipp`, `gedanke`, `fibel_fund`, `pulse`; IDs `FS-k-TP-nn`, `FS-1-KZ-nn`). Kanon unverändert; es werden keine Weltfakten behauptet (kein Wort darüber, wer die weißen Pfeile gemalt hat).

## 1. Bestand (gelesen, nicht gespielt)

| Was | Wo | Verhalten |
|---|---|---|
| Traumstraße: „W · GEHEN“ | traum.js `traumHint` | erscheint nur auf der Traumstraße |
| Fibel-Tour (6 Seiten) | fibeltour.js | beim Aufwachen, Enter weiter, X überspringen |
| Frage „Tab – jederzeit nachlesen“ | traum.js `questPop` | einmal nach der Mailbox |
| Dauerhinweis `TAB · ABENTEUERFIBEL` | `#hudHint` | immer |
| Taste Z „Ziel zeigen“ | ziele.js | Hinweis höchstens dreimal unter der Zielzeile |
| Bewegungshinweise Kriechen/Ducken/Hochziehen | bewegung.js `BHINT` Z.157–161 | als Gedanke (italic), einmal; nennt „Strg oder C“ |
| Kamera-Tipp | kamera.js `kamera_tip` Z.17 | `C` heben, Klick auslösen, 7 s |
| Augen zu: „Q halten – Augen zu“ | augenzu.js Z.33 | Hinweis am Bild |
| Textspur „KLICK · WEITER   X · ÜBERSPRINGEN“ | stimmen.js `say_hinweis` | **bei jedem Dialogblock** |
| Festgesteckt? | tod.js Z.363 | Toast nach 60 s Stillstand; Pausen-Knopf |
| Kreide `K`, Lampe `L`, Fernglas `V` | tausch.js Z.263 | Tipp beim Aufheben |
| Steuerungsliste | `_base` `mCtrl` Z.5909 | nur im Menü |

Lücken: Rennen, Lampe `F`/Batterie `R`, E-Halten, Karte `M`, Inventar, Verstecken (K1 UK7), Atem anhalten (K2), QTE-Einführung, Kinderblick `G`, Speicherpunkte und **die Bodenpfeile** (weiß, blau mit Kreis, gelb).

## 2. Prinzipien (AAA-Maß, ohne Textwand)
1. **Kontext statt Liste.** Ein Tipp erscheint erst, wenn die Situation ihn braucht, nie als Block.
2. **Einmal.** Gelernt-Merker in `MOD_SAVE` (`tipps`); wer die Aktion von selbst ausführt, sieht den Tipp nie.
3. **≤ 2 Zeilen, ≤ 90 Zeichen**, Tastenkappe vor dem Text (Stil von `#kamTip kbd`: goldener Rand, Georgia 11 px).
4. **Nie blockierend.** Spieler bleibt beweglich; Enter/Klick/X blenden aus (wie Toasts, leistung_1010 §5).
5. **Ruhe.** Höchstens ein Tipp je 60 s; keiner in Jagd, Kino, QTE, Dialog, offener Fibel; 4–5 s sichtbar.
6. **Einstellung „Hilfe“** (ziele.js): aus = nur Tipps der Priorität 1 (Lebensgefahr-Mechaniken: Verstecken, Atem, Augen zu); sanft (Standard) = alle; deutlich = zusätzlich nach 20 s statt 40 s Stillstand.
7. **Ton statt Fanfare:** vorhandenes `ui_stift` (leise), keine neue Aufnahme nötig.
8. **Pfeile erklärt Luke, nicht ein Fenster** (siehe §4).

Darstellung: neues Modul `app/mods/tipps.js` (`tipp(id, {zeilen, tasten, prio})`), Position unten links über `#batt`, damit es weder mit der Textspur (unten Mitte) noch mit Hinweisen (Toast) kollidiert.

## 3. Tutorial-Beats

Priorität 1 = nie unterdrücken (außer Hilfe aus nicht), 2 = Standard, 3 = optional.

| ID | Beat | Auslöser (Ort/Ereignis) | Text (≤ 2 Zeilen) | Taste | gelernt wenn | Kap. | Prio |
|---|---|---|---|---|---|---|---|
| FS-1-TP-01 | Bewegung | nach dem Aufwachen, Spieler steht > 3 s still | Gehen: W A S D. Umsehen: Maus. / Springen: Leertaste. | W A S D · Maus · Leertaste | ≥ 5 m gelaufen | 1 | 1 |
| FS-1-TP-02 | Rennen | 25 s Gehen auf der Straße ohne Shift | Shift halten: rennen. | Shift | Shift benutzt | 1 | 3 |
| FS-1-TP-03 | Lampe, Batterie | dunkle Zone mit Lampe aus; oder Akku < 25 % | F: Taschenlampe an und aus. / R: Batterie wechseln. | F · R | F gedrückt | 1 | 2 |
| FS-1-TP-04 | E halten | erstes Objekt mit Halte-Aktion im Blick | E halten: aufstemmen, aufschieben, klettern. | E | E > 0,6 s | 1/2/6 | 2 |
| FS-1-TP-05 | Ziel, Fibel | 40 s nach neuem Ziel ohne Fortschritt | Z: Ziel noch einmal zeigen. / Tab: Fibel, Reiter WAS JETZT? | Z · Tab | Z/Tab gedrückt | 1 | 2 |
| FS-1-TP-06 | Karte | erster Betritt der Kreuzung / Ziel > 60 m | M: Karte. Sie füllt sich, wo du gewesen bist. | M | M gedrückt | 1 | 3 |
| FS-1-TP-07 | Inventar | erster eingesteckter Gegenstand (Schlüssel) | Eingesteckt. Tab, Reiter INVENTAR: / ansehen und kombinieren. | Tab | Reiter geöffnet | 1 | 2 |
| FS-1-KZ-01 | **Kreidepfeile** | erster weißer Pfeil < 7 m im Blickfeld (0,8 s) | Weiße Kinderkreide. Alle Pfeile zeigen die Straße hinunter, nach Osten. / Ich folge ihnen. Besser als gar kein Plan. | – (Gedanke) | – | 1 | 1 |
| FS-1-TP-08 | Ducken/Klettern | Kante in Reichweite / niedrige Öffnung | Strg: ducken. Leertaste an Kanten: hochziehen. | Strg · Leertaste | ausgeführt | alle | 2 |
| FS-1-TP-09 | **Verstecken** | K1 UK7 beginnt, erste 4 s | Hecken, Autos, Tonnen: dahinter bist du im Schatten. / Lampe aus (F): sie sehen dich später. | F | Spieler in Deckung | 1 | 1 |
| FS-1-TP-10 | Text überspringen | erste drei `say()`-Blöcke | Enter oder Klick: weiter. / X: alles überspringen. | Enter · X | einmal benutzt | 1 | 2 |
| FS-1-TP-11 | Speichern | erster Speicherpunkt | Gespeichert wird an Speicherpunkten. / Festgesteckt? Esc, dann FESTGESTECKT?. | Esc | – | 1 | 2 |
| FS-2-TP-01 | **Atem anhalten** | K2 AG-07, Blechmann nah | Leertaste halten: Atem anhalten. / Lampe aus, nicht bewegen. | Leertaste | im Takt benutzt | 2 | 1 |
| FS-2-TP-02 | **Augen zu** | K2 Finale (`augenzu_frei`) | Q halten: Augen zu. | Q | Q gehalten | 2 | 1 |
| FS-2-TP-03 | Schütteln | erste Spinnen-/Griff-Szene | Maus wild bewegen oder A und D abwechselnd hämmern. | Maus · A · D | – | 2 | 1 |
| FS-3-TP-01 | Kinderblick | erster Lichtstein im Inventar | G: Kinderblick. Er zeigt, wo man suchen muss. / Er lädt sich langsam wieder auf. | G | G gedrückt | 3 | 2 |
| FS-3-TP-02 | Funk | Funkkasten zum ersten Mal | Regler drehen, bis das Rauschen kippt. / Wort auf Kanal: schreiben, senden. | Maus | – | 3 | 3 |
| FS-5-TP-01 | Kamera | Kamera aufgenommen (K5) | C: Kamera heben. Klick: abdrücken. / Es sind nur drei Bilder. | C · Klick | ein Bild gemacht | 5 | 1 |
| FS-5-TP-02 | Augen zu (Stall/Hochsitz) | Stall, Hochsitz | Q halten: Augen zu. Nicht hinsehen. | Q | Q gehalten | 5/6 | 1 |
| FS-6-TP-01 | Kriechen | `crawlK > .5` | Kriechen: Unter 70 cm Höhe geht es nur geduckt. / Strg halten. | Strg | – | 6 | 2 |
| FS-6-TP-02 | Lampe tot | Akku leer im Bau | R: Batterie wechseln. Danach E: Feuerzeug. | R · E | Batterie gewechselt | 6 | 1 |

**QTE (kein eigener Tipp).** Jeder QTE trägt Ring, Tastenkappe und Label (qte.js). Einzig beim ersten QTE eines Spielstands blendet `tipps.js` 0,8 s vorher den Text ein: „Gleich: die Taste im Ring drücken.“ (nur wenn das QTE-Modul das Vorlauf-Signal liefert; sonst weglassen). Barrierefreiheit: nach zwei Fehlschlägen am selben QTE einmal „Zu schnell? Einstellungen, QTE: leicht.“

**Textspur-Hinweis.** `say_hinweis` (stimmen.js) zeigt „KLICK · WEITER   X · ÜBERSPRINGEN“ bisher bei jedem Block. Neu: die ersten drei Blöcke mit vollem Hinweis (`FS-ALLE-UI-01`), danach nur bei Blöcken mit mehr als drei Zeilen und klein „ENTER · WEITER“ (`FS-ALLE-UI-02`).

**Zu streichen/zusammenzulegen:** questPop „ABENTEUERFIBEL · Taste Tab – jederzeit nachlesen“ (vierte Tab-Nennung, `#hudHint` bleibt); `traum_kum`-Gedanke wandert in die Fibel (Fund existiert); Hinweis `C` in BHINT.

## 4. Die Bodenpfeile und Striche – einmal erklärt

Bestand im Code (kapitel1.js `kapitel1_welt`):
- **Weiß**, Kinderkreide, 7 Pfeile von x = −63,5 bis +12,5 entlang der Ahornstraße, alle nach Osten (Z.112).
- **Blau mit Kreis am Schaft** (Lucys Zeichen), 10 Pfeile vom Briefkasten Nr. 7 den Kirchweg hinauf zur Haltestelle, *gegen* die weißen (Z.115). Gehört zum geheimen Ende „Fahr heim“.
- **Gelb**: die eigene Straßenkreide (`K`), auf der Karte mit Nadel (tausch.js).
- Daneben ohne Richtung: Hüpfkästchen (17 Felder) und Martinslaterne in Kinderkreide; „Zeichen“ (zeichen.js) sind eigene, nie pfeilförmige Ritzungen.

Lücke: Bisher erklärt nichts die **weißen** Pfeile. Nur die blauen haben eine Untersuchungszeile (U-30 „Lucys Pfeil …“). Das tote Warum behauptete „sie laufen zu Hilde Wendt“.

Konzept (genau **ein** Moment je Farbe, kein Fenster):
1. **Weiß** `FS-1-KZ-01`: Der erste Pfeil, der länger als 0,8 s in 7 m Sicht ist (nach Mailbox/Whiskey, spätestens 40 s nach Spielbeginn), glimmt 2 s auf (`FS-1-KZ-04`, Instanzfarbe, Deckkraft 0,35→0,6→0,35; kein Rand wie bei interaktiven Objekten). Luke denkt zwei Zeilen. Dabei legt `kapitel1_lore('kreidezeichen')` den Fibel-Fund „Kreidezeichen“ an (`FS-1-KZ-02`).
2. **Blau** `FS-1-KZ-03`: erster blauer Pfeil im Blick (am Briefkasten Nr. 7). Zwei Zeilen, nennt das Zeichen und die Gegenrichtung.
3. **Gelb**: bestehender Tipp beim Aufheben der Kreide; Fibel-Zeile erscheint dann in „Kreidezeichen“.
4. **Wege**: nach dem ersten Gedanken entscheidet die Ziel-Zeile („Finde Haus Nr. 7“), nicht die Pfeile; die Pfeile sind Orientierung, nicht Pflicht.

Zusätzlich (Folgeauftrag 5): Pfeile liegen nach Bodenhöhe-Strahl 0,5–1 cm über dem Boden (`kapitel1_bodenY` ist heute eine feste Tabelle). Das ist Sache des Decal-Audits; hier nur der Hinweis, dass der Erklär-Moment erst nach dessen Fix sinnvoll wirkt.

## 5. Wegführung (sanft, ohne Marker-Zwang)

| Kap. | Licht | Kreide / Zeichen | Geräusch | Marker (Hilfe „deutlich“) |
|---|---|---|---|---|
| 1 | beleuchtetes Wohnzimmer Nr. 7, einzelne Laternen; Whiskey setzt sich auf Deckungen Richtung Nr. 7 (kapitel1_vTick) | weiße Pfeile nach Osten; Hufeisen | Tastenfeld hämmert, Summen hinter der Stahltür | `ziele_hinweis()`/HINTS „story“, Kartennadel |
| 2 | flackernde Röhren führen nach Osten | Kinderhände im Tunnel | Nadeldrucker, Lucys Summen aus dem Messraum (`Audio.whisper`) | wie oben |
| 3 | Lichtsäule am Ostende, Telefon, grüne LED am Funkkasten | blaue Pfeile zum Funkkasten (lucy3 `lucy3_buildArrows`) | Telefon klingelt lauter, Glocke | Kartennadel |
| 4 | Fenster der Villa | Glanz an Schlüsselteilen (hervorhebung `glanz`) | Presse stampft | Hinweis „Dir fehlen noch N“ |
| 5 | Licht in Nr. 1, Telefonzelle | blauer Pfeil am Fenster | Tappen, Spieluhr | Z-Hinweis |
| 6 | Whiskey fliegt voraus | Brotkrumen, rote Wolle (Roter Faden) | Stille-Zonen als Warnung | Wolle ist der Marker |

## 6. Einstiegs-Choreografie (erste 3 Minuten, Reihenfolge fest)
1. Aufwachen: „Huh …?“ → Fibel-Fund → Fibel-Tour (überspringbar).
2. Mailbox (MAILBOX · KÜHN) → Kurzkarte Kapitel 1.
3. Tipp Bewegung (nur wenn 3 s stillstehend).
4. Erster Pfeil: Gedanke + Fibel-Fund (`FS-1-KZ-01/02`), Pfeile glimmen.
5. Whiskey-Szene (Tausch; E-Label „etwas anbieten“ trägt die Bedienung).
6. Ortsschild bei Blick: neuer Gedanke (`FS-1-SC-04`), Ortstafel-Aktion.
7. Gedanken `traum_lucy`, `traum_elf` mit gap 9 s weiter; Tipp Karte an der Kreuzung.
Kein Textereignis darf ein anderes unterbrechen (obt_ruhig der Textspur gilt).

## 7. Offenes
- Ob der Vorlauf-Hinweis vor dem ersten QTE technisch möglich ist, hängt an `qte_start` (nicht geprüft).
- Tastenkonflikt `C` (Ducken-Umschalter, Kamera K5): Konzept nennt nur Strg; Umbelegung ist Entscheidung des Nutzers.
- Controller-Beschriftung fehlt; Tasten sind Tastatur/Maus.
- Keine Spieltests: Reichweiten (7 m, 0,8 s) sind Startwerte.
