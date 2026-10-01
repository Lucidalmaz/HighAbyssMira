# F3 · Stand Story-Prüfung Teil A (Text, Wendungen, Regeln, Konsistenz)

Stand 01.10.2026 · **fertig (Syntax + Build geprüft, kein Laufzeittest – siehe „Für den Schlusstest“)**
Grundlage: `story_pruefung.md` (W-1, W-2, W-3, W-5, V-1 … V-8, T-1, T-3, T-4, G-6, H-5, Abschnitt 8) und `F3_extras.md` „Entscheidungen zur Story-Prüfung“ (beide Kanon-Änderungen V-1 und W-5 freigegeben). Abschnitt 10 der Prüfung unangetastet.
Abgrenzung zu Teil B (`F3_stand_story_b.md`): G-1/G-2 (= Q-9 A-18 Friedhof im Blitz), H-1, R-1, W-4, H-6 macht Teil B. Teil A hat in `villa.js` (Nr. 3, Kap. 4) nur Bruno und das Summen ergänzt; Teil Bs „Junge.“ statt „Himmelherrgott!“ steht unverändert.

## Tabelle

| Punkt | Bibel (`story_final.md`) | Spiel (`app/mods`) | Status |
|---|---|---|---|
| **Rang 1 · W-1** Telefonzelle | Kap. 1 NA 4: „Die Stimme kenn ich. Ich weiß bloß nicht, woher. Das ist schlimmer.“ (Auflösung bleibt Kap. 5) | `post.js` Gedanke, Lore „Zwei Stimmen“, Aufgabentext | erledigt |
| W-1 Messlatte | NA 14: „Etwas abseits ein Strich ohne Namen“; Höhe zu LUKE B. nur noch Autorenwissen | `ausbau_nord.js` Notiz + Abschlusstext | erledigt |
| W-1 Nadeldrucker | Kap. 2 Archiv/Nadeldrucker-Liste/Akte 08: bis Akte 08 „VORGANG 08 …“, danach einmal „VORGANG 08 · KORREKTUR: RÜCKLÄUFER 08.“, dann „RÜCKLÄUFER 08“ | `amt.js` `amt_druck` mappt vor Akte 08 auf „VORGANG 08“; `amt_akte08` druckt 2,6 s nach der Akte die Korrektur (Messraum-Drucker, Untertitel); `zimmer7.js` Rückfalltext | erledigt |
| **Rang 2 · W-3** „Einer fehlt noch. Du.“ | Kap. 6 UK 9 drei Sätze des echten Luke nach W-15; Endkarte neue vorletzte Zeile; Kern §11; Kap. 7 UK 4 Verweis; Umsetzung (2×) | `kapitel6.js` drei Zeilen nach „Das sagt er manchmal …“, Endkarte | erledigt |
| **Rang 3 · V-1** Das siebzehnte Jahr (Kanon) | Kern §4 neuer Absatz + Justin-Satz; Kap. 3 UK 4 Pflichtsätze; Zählbuch S. 2 neue Zeile; Justin-Dossier; „Danach weiß“ Kap. 3 | `justin.js` Bank `siebzehn`, Pflicht nach `naeher` (auch in `justin_pflicht`); `kapitel3.js` Zählbuch S. 2 | erledigt |
| **Rang 4 · W-2** Spieluhr/Midpoint, Wendung 7 | Kap. 3 Abspann 16–22 s; Kap. 4 UK 2 Summen; Kap. 5 Höhepunkt neue LUNA-Zeile; Kern §10.1 Lucy, §11 Wendung 7 neu; „Danach weiß“ Kap. 5 | `kino.js` K3-Abspann: `mb_spieluhr` 1,3 s leise unter Lucys Satz + Gedanke; `villa.js` Summen + VEGAS; `kapitel5.js` LUNA-Zeile nach „… Bruder.“ | erledigt |
| **Rang 5 · W-5** LWO: Lucy als Köder (Kanon) | Kap. 4 Blatt 212 Nachtrag + Lukes Gedanke; LWO-Dossier 5.8 (Nachtrag nach dem 4.11., in Kap. 1 noch nicht auf dem Blatt); Kern §6.6, §11 | `villa.js` Ringbuch Nr. 9: Nachtrag (Kugelschreiber) + Gedanke „Elf Anrufe …“ | erledigt |
| **Rang 6 · T-1** Zwei-Lukes-Wahl + Kap.-7-Einlösung | Kap. 6 UK 9 Wahl (3 Antworten) + Fibel „Wer bin ich?“; Kap. 7 UK 6 „War es schön?“ – „Noch nicht. Ab jetzt zu zweit.“ | `kapitel6.js` `k6_zweiLukes()` nach „Kommst du mit heim?“ (Tasten 1–3, 15 s → schweigen), Flag `D-11`; `sammeln.js` neue Zeile „Das bist du“ (erscheint nur mit Flag) | erledigt (Kap. 7 nur Bibel) |
| **Rang 8 · T-3** Anruf „LUCY“ | Kap. 6 UK 6 neuer Absatz; V-03 (Vertrauen < 30) ohne Elf-Zählung | `kapitel6.js` `k6_anrufLucy()`: auf dem Weg zu Jonas’ Lager (12–34 m), einmal; Wegdrücken → 1…11 verpasste Anrufe; Rangehen → „Großer …“/„Ich hab Hunger, Junge.“ + `k6_laerm` lockt den Jäger | erledigt |
| **Rang 9 · V-4** LWO-Name | Kap. 4 Arbeitszimmer Messingschild + U-78; AG-14 Wolter-Zeilen (Kap. 4 und LWO-Dossier); Kern §6.6 | `lwo.js` AG-14 zwei W-Zeilen nach „Wollen Sie das machen?“; `neben4.js`/`villa.js` Weltkarte mit Schild + Lukes Witz; `gedanken.js` U-78 Text | erledigt |
| **Rang 10 · V-2** vier Augen | Kern Regel 2; Kap. 3 UK 1 Zusatz, UK 4 Pflichtsatz, Fibel-Zeile; Justin-Dossier | `justin.js` pflicht2 + Lore `c3_justin`; `sammeln.js` R-K3a | erledigt |
| V-3 Wald blind | Kern §5 Zusatz; Kap. 5 UK 13 Zeile + Fibel | `kapitel5.js` Zeile + Lore + Flag `R-K5c`; `sammeln.js` neue Regelzeile | erledigt |
| V-5 „Nicht du“ | Kap. 3 UK 12 neue Auswahl | `weiss.js` Frage `nichtdu` (zwei HILDE-Zeilen) | erledigt |
| V-6 Marion im Schiff | Kap. 6 UK 9 Zeile; Kern §10.1 Marion | `kapitel6.js` Zeile „Mama ist drin …“ | erledigt |
| **Rang 11 · G-6/Q-9** | A-03 (Kap. 1 Suchlicht), A-07 (Kap. 3 Erwischt), A-13 (Kap. 3 Abspann), A-14 (Kap. 4 Streife, AG-13-Zeile), A-17 (Kap. 5 Lucy schwebt), A-20–A-22 (Kap. 6 Jagd), A-23 (Wrack), A-24 (Abspann Kap. 6) in den Kapiteltexten; A-25: Angst-Untertitel Z. 809/828/4995/5167 gestrichen (Barrierefrei nur Geräuschangabe). **A-18 = G-2 → Teil B** | Code war schon weiter (laut Prüfung Abschnitt 9) | erledigt (Bibel) |
| B-3 Bruno | Kap. 3 (Tür, Abspann), Kap. 4 (Tür, Küche, Vegas’ Satz), Kap. 7 (stumm), U-45, Vegas-Form, Namensverzeichnis | `villa.js` Kap. 4: Bruno stumm + VEGAS „Seit er wieder da ist …“ | erledigt |
| H-5 / X-6 Joint-Szene | Kap. 4 UK 1 neuer Absatz „Fünf Minuten“ (ruhig, Brummen bleibt, Deko an drei Orten) | `kiffen.js`: Netzbrummen (`villa_brumm`, ungedämpft) ab erstem Zug, Gedanke „Fünf Minuten. Alles ist leiser. Das Brummen nicht.“; Deko Bushaltestelle/Auto/Remise-Bong gestrichen | erledigt |
| V-7 Fibel „Fragen“ | Umsetzung (bei „Wer was wann weiß“) mit Wortlaut | `sammeln.js` Reiter „FRAGEN“ ab Kap. 2, 11 Fragen, Antwort erst im Kapitel nach der Auflösung, max. 5 offen | erledigt |
| V-8 „Bisher“ | Umsetzung mit Wortlaut | Basis: `RECAP` 4–6 neu, `bisherHtml()`; oben auf den Intro-Karten `anwesen.js` (Kap. 4), `kapitel5.js`, `kapitel6.js`; `showRecap` zeigt ab Kap. 4 kein eigenes Blatt mehr | erledigt |
| T-4 Miras Summen | Kap. 6 Höhepunkt 0:46–0:50 und 1:08 | `hungrige.js` `hungrige_summen()` (Frauenstimme, synthetisch, leise, vom Raben) + zweiter Gedanke | erledigt |
| **Widersprüche (Abschnitt 8)** | | | |
| 1–3 Offene Nacht, Daten, Justin draußen | V-1 (Kern §4, Justin, Zählbuch) | wie V-1 | erledigt |
| 4 „alle“ / „alle vier“ | V-2 | wie V-2 | erledigt |
| 5 Marion | V-6 + Kern | `kapitel6.js` | erledigt |
| 6 Bruno | B-3 überall | `villa.js` | erledigt |
| 7 Lucys Band | Z. 783/916 neuer Satz | `kapitel1.js` (Band + Lore), Basis-Rückfall | erledigt |
| 8 Hildes Kalender | „23. – L. unten. Keiner darf das wissen. Auch der Kalender nicht.“ | `kapitel1.js` | erledigt |
| 9 „Stück von Papa“ | Kap. 3 Verdrahtung → Luke; W-3 | Fibel „Fragen“ beantwortet erst nach Kap. 6 | erledigt |
| 10 Cleos Akte | Kap. 2 Archiv: Akte ohne Nummer ergänzt | `cleo.js` (gab es schon) + „Name auf Wunsch der Mutter entfernt“ | erledigt |
| 11 RH-6 | Mira-Spur: Feld 7 | – (Code schon Feld 7) | erledigt |
| 12 Justins Narbe | Kap. 7: „über der Rippe“ | – | erledigt |
| 13 Prolog-Gesicht | „Kapitel 2, im Tank“ | – | erledigt |
| 14 Prolog-Zeit | „Mittwoch, ein Tag im Auto“ + Gedanke; Kapitelplan | `traum.js` Gedanke | erledigt |
| 15 LWO-Name | V-4 | V-4 | erledigt |
| 16 Joint-Szene | H-5 | H-5 | erledigt |
| 17 Wald-Regel N6-8 | „Er frisst nicht das Papier …“ | – | erledigt |
| 18 „Nicht du“ | V-5 | V-5 | erledigt |
| 19 Vegas/Mike | Großonkel und Vormund (Kern, Akte 03, Liste) | `zimmer7.js` (2×), Basis Akte 03 | erledigt |
| 20 U9 | U11 | `nr4.js` | erledigt |
| „Wer was wann weiß“ | Umsetzung Punkt 7 ergänzt; „Danach weiß“ Kap. 3, 4, 6 ergänzt | – | erledigt |

## Geänderte gesprochene Zeilen
(Zuordnung in `stimmen.js` über Text + Sprecher; Sprecher `LUKE` = Gedanke, stumm. Neue Zeilen brauchen Aufnahmen, geänderte neue Aufnahmen.)

| Modul | Sprecher | alt | neu |
|---|---|---|---|
| `kapitel1.js` (Band) | LUCY · TONBAND | „Hey, Großer. Ich weiß jetzt, warum wir uns an den Sommer 2009 nicht erinnern.“ | „Hey, Großer. Ich weiß jetzt, was im Sommer 2009 passiert ist. Nicht nur, dass. Was.“ |
| Basis (Rückfall-Band) | LUCY · TONBAND | „Ich weiß jetzt, warum ich mich an den Sommer 2009 nicht erinnern kann.“ | „Ich weiß jetzt, was im Sommer 2009 passiert ist. Nicht nur, dass. Was.“ |
| `justin.js` pflicht2 | JUSTIN (`JS`) | „Sie hält sich an den Lampen fest. Das sind ihre Augen über dem Dorf. Nimm sie ihr, alle vier, dann muss sie herunter, und wir können hinein.“ | „Sie hält sich an den Lampen fest. Die meisten Lampen hier schlafen. Wach sind nur die, vor denen sie dieses Jahr einen geholt hat. Vier Augen. Mach sie ihr zu, eins nach dem andern, dann muss sie herunter, und wir können hinein.“ |
| `justin.js` siebzehn | JUSTIN | – (neu) | „Die letzten Zahlen zählt sie langsam. Wie Kinder, die nicht wollen, dass es anfängt.“ · „In dem Jahr ist die Haut dünn. Wer Licht macht und zu ihr hochsieht, den holt sie vorher. Und mich spuckt sie aus, wenn sie mich wieder nicht gefunden hat. Dann wart ich am Rand, bis sie fertig gezählt hat.“ · „Und die Frau mit dem Buch.“ |
| `justin.js` siebzehn | DU | – (neu) | „Roxy. Mike. Lucy.“ |
| `weiss.js` Raum 2 | DU | – (neu) | „Was hieß ‚Nicht du‘?“ |
| `weiss.js` Raum 2 | HILDE WENDT | – (neu) | „Ich hab den anderen erwartet. Den mit den blauen Augen. Der kommt manchmal ans Küchenfenster, wenn das Brot nicht da ist.“ · „Dann standst du da, mit seiner Narbe in der Hand. Da wusst ich, wer dich gerufen hat.“ |
| `villa.js` Nr. 3 | VEGAS | – (neu) | „Das macht sie seit heute früh.“ · „Seit er wieder da ist, frisst er keinen Speck. Und er bellt nicht. Bruno hat immer gebellt.“ |
| `lwo.js` AG-14 | WOLTER (`W`) | – (neu) | „Die Bundesstelle war ein Briefkopf, Herr Brandt. Wir heißen Lucid World Organization. Lost Eyengless ist Außenstelle sieben.“ · „Es gibt andere Dörfer.“ |
| `kapitel5.js` Höhepunkt | LUNA | – (neu) | „Ich hab mir was von ihr geborgt. Das Kochen. Das Lachen. Das ‚Großer‘.“ |
| `kapitel5.js` Waldflucht | ECHTER LUKE | „Im Wald findet sie keinen! Der hat kein Echo!“ | „Im Wald findet sie keinen! Sie findet uns an dem, was wir liegen lassen. Da drin frisst das einer weg!“ |
| `kapitel6.js` Hochsitz | ECHTER LUKE | „Mama schläft. Im Stall. Sie hat mir gesagt, ich soll dich nicht ansehen, sonst wird’s dir schlecht.“ | „Mama ist drin. Sie wartet an der Kette, bis ich wiederkomm. Sie hat gesagt, ich soll dich nicht ansehen, sonst wird’s dir schlecht.“ |
| `kapitel6.js` T-1 | ECHTER LUKE | – (neu) | „Geht nicht. Das ist nicht mehr meins.“ · „Du hast es getragen. Jetzt hat es deine Form. Wie ein Schuh.“ · „Das sagen Große immer, wenn sie nichts finden.“ · „Siehst du. Du weißt es auch nicht. Gut. Dann lügst du wenigstens nicht.“ |
| `kapitel6.js` T-1 | LUKE (wie die übrigen Hochsitz-Fragen; stumm, solange `LUKE` Gedanke heißt) | – (neu) | „Dann geh ich rein. Du kriegst dein Leben zurück.“ · „Wir finden was. Zu zweit.“ |
| `kapitel6.js` W-3 | ECHTER LUKE | – (neu) | „Sie hat Papa fast. Sie hat mich. Lucy hat sie zurückgegeben.“ · „Sie sucht nur noch einen. Das Stück von Papa, das draußen rumläuft.“ · „Das Spiel ist erst aus, wenn alle gefunden sind.“ |
| `kapitel6.js` T-3 | DU | – (neu) | „Diesmal nicht.“ |
| `kapitel6.js` T-3 | LUCYS STIMME? / HOFER? | – (Texte gibt es schon: `k6_jagdStimme` „Großer …“, Höhepunkt „Ich hab Hunger, Junge.“) | wiederverwendet; am Telefon wäre ein Funk-/Telefonfilter schöner (Bitte an Stimmen-Agent) |
| `hungrige.js` T-4 | – (synthetisches Summen, keine Aufnahme) | – | Bitte an Ton/Stimmen: falls eine echte gesummte Frauenstimme (Mira, E D C H C, ohne Worte) erzeugt wird, `hungrige_summen()` ersetzen |

Nur Gedanken/Untertitel (stumm, keine Aufnahme nötig): `post.js` Telefonzelle, `kino.js` K3-Abspann, `villa.js` Ringbuch, `traum.js`, `hungrige.js` 1:08, `kiffen.js`, `neben4.js` U-78, Kalender/Messlatte/Drucker/Fragen/Bisher.

## Für den Schlusstest (bitte im Gesamtdurchlauf mitprüfen)
1. **Kap. 2 Amt:** Drucker zeigt „VORGANG 08 …“ bis zur Akte 08; nach dem Schließen der Akte ca. 2,6 s später „ZÄHLSCHLUSS 03:13 · VORGANG 08 · KORREKTUR: RÜCKLÄUFER 08.“ als Untertitel (Messraum-Drucker sichtbar); danach „RÜCKLÄUFER 08 …“.
2. **Kap. 3 UK 4:** Justin sagt nach „Bei siebzehn …“ die V-1-Sätze (auch wenn „Näher gehen“ übersprungen wurde, dann in `justin_pflicht`); keine doppelte Wiedergabe. Abspann: leise Spieluhr unter „Guck nicht so. Ich bin’s.“ + Gedanke. Raum 2: Frage „Was hieß ‚Nicht du‘?“ im Hilde-Menü.
3. **Kap. 4:** Intro-Karte mit „BISHER“ oben (Länge/Lesbarkeit); Nr. 3: Summen-Zeile + Bruno-Satz; Nr. 9 Ringbuch: Nachtrag + Gedanke; Weltkarte: Messingschild + Witz; AG-14: Wolters Name-Zeilen; Joint-Szene: Brummen ab erstem Zug, ausgeblendet nach ~72 s, Gedanke danach.
4. **Kap. 5/6:** Kap.-5-Höhepunkt neue LUNA-Zeile (Timing der Kamera-Phasen); Waldflucht-Zeile; Kap. 6: Anruf LUCY auf dem Weg zum Lager (beide Wege; beim Rangehen jagt der Wendigo – darf nicht zu unfairem Tod führen), Hochsitz: Wahl T-1 mit geschlossenen Augen (Tasten 1–3), danach Fibel „Das bist du“ letzte Zeile, W-3-Sätze, Endkarte mit „Einer fehlt noch. Du.“; Höhepunkt: leises Summen unter der Celesta.
5. **Fibel:** Reiter „FRAGEN“ ab Kap. 2 sichtbar, Antworten erst ab dem genannten Kapitel; Spielregeln: neue Zeilen R-K3a/R-K5c.
6. **Weiterspielen** eines Spielstands in Kap. 4–6: kein separates „Was bisher geschah“-Blatt mehr, „Bisher“ steht auf der Kapitelkarte (Kap. 4 nur, wenn deren Start die Intro-Karte zeigt).

## Offene Punkte / Bitten
- Kap. 7 ist nicht gebaut: T-1-Einlösung, W-3-Verweis, Bruno, Narbe nur in der Bibel.
- Q-9 A-18 (Friedhof im Blitz) und Modelldorf (G-1) macht Teil B.
- Die Laternen in Kap. 3 brennen im Spiel alle gleich hell; die Bibel erklärt das jetzt („hell sind alle, wach nur vier“). Ein sichtbares Glimmen der „schlafenden“ Laternen wäre ein Umgebungs-/Licht-Punkt, kein Muss.
- Fehlende Assets: keine.
