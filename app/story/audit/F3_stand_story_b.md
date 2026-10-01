# F3 · Stand Story-Prüfung Teil B (Pacing, Redundanz, Humor, Grusel-Dosierung)

Stand 01.10.2026 · **fertig (Syntax + Build geprüft, Funktionstest offen → Schlusstest)** · Grundlage `story_pruefung.md` (Rang 7, 12–15, G-3, H-4, Abschnitt 6) und `F3_extras.md` „Entscheidungen zur Story-Prüfung“.

## Abgrenzung zu Teil A
Teil B hat übernommen: G-1, G-2, H-1, H-2, H-3, R-1 (ganze Budget-Tabelle), **W-4** (Wolter altert nicht → 3 Hinweise), T-2, G-3, G-4 mit Zettel-Auswahl, H-4, H-6, R-3.
Nicht angefasst: Wendungen, Regeln, Konsistenz (W-1…W-5, V-1…V-10, T-1, T-3, T-4, G-6, H-5, Abschnitt 8) und alles, was Abschnitt 10 schützt.
**Bitte an Teil A (W-1):** „Der Strich ohne Namen“ liegt jetzt in Kapitel 4, also nach Akte 08. Lukes Satz „Einer ohne Namen. Das achte Kind?“ (`ausbau_nord.js`) passt dort nicht mehr; Vorschlag: „Einer ohne Namen. Sechster August. … Das bin ich.“ Der Text gehört Teil A, darum habe ich ihn nicht geändert.

## Tabelle

| Punkt | Bibel (`story_final.md`) | Spiel (`app/mods/`) | Status |
|---|---|---|---|
| **G-1** Modelldorf umgedreht (Rang 7) | Kap. 2 „Eins zu siebenundachtzig“: Regel, Enthüllung, Rätsel-Zeile, Schreckbudget | `amt.js` `amt_modellTick(dt)`: Figur rückt nur, solange Luke hinsieht (wie ein Uhrzeiger, 0,28 Räume/s), steht beim Wegsehen und beim Lesen (Overlay). Beim 6. Hinsehen fällt sie neben dem Tank um. Gesagt wird es beim 2. Hinsehen. Spielstand `modellN` bleibt. | fertig |
| **G-2** Friedhof im Blitz (Rang 7) | Kap. 5 UK 13 „Schlafenszeit“ | `kapitel5.js` `k5_grabTick`: vor „Pust.“ kein Ochs-am-Berg mehr, die Behaltenen sehen Luke nur nach. „Pust.“ kommt spätestens 12 s nach Lunas Sätzen von selbst; danach greift die vorhandene A-18-Blitzregel. | fertig |
| **H-1/R-1** Himmelherrgott ≤ 3 | Kap. 1, 4, 5, Whiskey-Dossier §2/§3, Kap. 7 Schlusspointe | `kapitel1.js` (Versteck → Autotür-Summen), `villa.js` (K4-1 → „Junge.“), `kapitel5.js` + `whiskey.js` `whiskey_k50` (Kap. 5 → Pfanne scheppert). Bleiben: K1-4 Haustür, W-09 Villa | fertig |
| Pling ≤ 3 | Kap. 3 Gully, Kap. 6 Baumhaus und N6-7, Whiskey-Dossier | `whiskey.js` K1-1 → Gurren; `neben3.js` Atlantschiss → Gurren; `tausch.js` Zufalls-Pling → Gurren; `neben6.js` N6-7 → Gurren und Flügelkratzen. Bleiben: Nr. 4, Kino Abspann Kap. 3, Kellertreppe Kap. 4 | fertig |
| Gartentor ≤ 2 | Kap. 4 Ankunft AG-12, Günther (Kap. 4 und Dossier), Humorliste | `lwo.js` AG-12 ohne Verhaken; `neben4.js` Günther ohne Tor und ohne Vegas-Ruf. Bleiben: Nr. 9 Kap. 1, Abgang S-04 | fertig |
| „Scheiße“ ≤ 2 | Kap. 5 UK 12, Whiskey-Dossier | `kapitel5.js` `k5_scheisseGag`: Whiskey faucht die Katze mit ihrer eigenen Stimme an. Luke: „Unentschieden.“ | fertig |
| „Super. Ganz toll.“ = 1 | Kap. 3 Telefonzelle, Justin-Dossier Nr. 36 | `kapitel3.js` neuer Zellen-Gedanke; `justin.js` „drache“ ohne den Vorsatz | fertig |
| „LUKE (ein Satz)“ ≤ 12 | 5 erklärende Einzeiler gestrichen; 11 auf „LUKE:“ umgestellt; 12 bleiben (nur nach Wendungen). Dazu zentrale Budget-Tabelle in §13 | `kapitel5.js` 2 gestrichen, `neben3.js` 2 gestrichen | fertig |
| **H-2** Speck steigern | Kap. 5 UK 1 (Wochenspeck), Kap. 7 „Zoll.“ + letztes „Himmelherrgott!“ | `kapitel5.js` UK 1 | fertig |
| **H-3** neue Atempausen | – (Dossier 85 §10 nicht geändert; die Texte stehen in `story_pruefung.md` H-3) | `gedanken.js` A-01, A-09, A-13, A-14 | fertig (Bibel-Dossier §10 bei Gelegenheit nachziehen) |
| Telefonzelle 7 → 4 | Kap. 1 (Versteck, Humorliste), Kap. 5 Heidi und Maas | `kapitel1.js` kein Klingeln im Versteck; `kapitel3.js` kein Klingeln beim 2. Hinausgehen; `neben5.js` kein Rückruf nach Heidi (Funktion, Zustand und Hülle entfernt), Maas: statt der Zelle schlägt die Briefkastenklappe von Nr. 7 | fertig |
| Warnendes Kind 4 → 2 | Kap. 1 Laken, Rücksitz, Kern §10.1, Stimmführer | `_base_source_index.html` `scareSheet` ohne Flüstern; `post.js`: Lucys blauer Kreispfeil falsch herum statt „NICHT SIE“ (Canvas) | fertig |
| **W-4** Wolter altert nicht 6 → 3 | Kap. 2 Kühlregal, Kap. 4/5 Gisela, Dossier Neue Figuren | `amt.js` Etikett „Ration · monatlich · Empfänger geschwärzt“; `neben4.js` und `kapitel5.js` neue Gisela-Sätze (R-1) | fertig |
| Brot für den Jungen → 3 | Kap. 2 Brotdose, Kap. 4 Gasleck | `zimmer7.js` Brotdose ohne Zettel; `neben4.js` Polaroid „Der Vogel“ ohne Brot | fertig |
| Acht Füße + neunter → 3 | Kap. 4 Gasleck | `neben4.js` Polaroid 0/1: Kreuzung „Der Abend davor“, Lucy nachts an der Kreuzung (neues Bild) | fertig |
| Heidi → 3 Beats | Kap. 4 Schuppen, Dossier Neue Figuren | `neben4.js` Fach AHORN 1: nur der leere Umschlag | fertig |
| Beobachter-Spuren ≤ 5 je Kapitel | Dossier 82 §4 (Agent G-4), Kap. 5 Laube | Agent G-4: Deckel `BEOB_SPUR_MAX`. Dazu von mir: `neben5.js` kein Bonbon an der Laube, `lucy3.js` kein Kiesel an der Zelle, `villa.js` zweite Kratzspur nur noch zu hören. Das Bonbon bei Keiner (`kirchberg.js`, Kap. 1) bleibt als Einführung des Motivs | fertig |
| **T-2** „Einunddreißig Flaschen“ (Rang 13) | Kap. 5 nach UK 9 | `neben5.js` `n5_flaschen()`: Tür Nr. 3 nach UK 9, einmal (`st.flaschen.done`), Wahl a/b, Lore „Einunddreißig Flaschen“, traurige Szene (`spannung_trauerAn/Aus`). Kommt vor Heidis Karte an derselben Tür. Der Titel ist erklärt: 32 passen in Mikes Pfandkiste, 31 stehen da | fertig |
| **G-3** Funk in der sicheren Stube | Kap. 5 UK 1 | `kapitel5.js` Takt „veranda“: Rauschsperre durch den Türspalt, N12/N11 (FUNK), Vegas. Einmal (`k5.f.funkG3`). Der vorgelesene Satz passt zu Lukes tatsächlicher Lage | fertig |
| **G-4** + Zettel-Auswahl (Rang 14) | Kern §7, §15.5, Dossier 82 §3–§5, §9–§11, Kapitelabschnitte | `beobachter.js` (nur Tabellen und Deckel): 86 → 70 Kennungen (18 gestrichen oder zusammengelegt, 3 kalte neu: B-K4-09, B-K5-08, B-K6-08), Orts-Zettel 19 → 13, `BEOB_GESTRICHEN`/`BEOB_ALIAS` (alte Spielstände bleiben gültig); Andockstellen in `kapitel5.js` und `kapitel6.js` | fertig (bewusst nur saubere Schnitte, statt „rund 25“) |
| **H-4** Lesen → Spiel | Kap. 4 AG-13, LWO-Dossier AG-13 | `lwo.js` AG-13: Nachsorge 12 liest die Bestandsliste vor, während Luke im Schrank steckt | fertig für AG-13; weitere Lesekürzungen in Kap. 4 nicht gemacht |
| **H-6** Kap. 1 entdichten (Rang 15) | Kap. 1 Zeit, Liste, Tabelle, Nr. 14/17/21; Kap. 3 und 4 Nebenaufgaben; „Noch offen“ 1 | `leben.js`: Uhr bleibt bis zu Lucys Band bei 00:55 stehen, Gedanke nach 7 min Stillstand. `gedanken.js`: 5 Lucy-Gedanken, je ca. 20 min freie Erkundung. `kirchberg.js` `KB_SPAETER`/`kirchberg_ab`: Strich → Kap. 4, Kindersitze → Kap. 3, winkendes Fenster → Kap. 3 (Auslöser gesperrt in `ausbau_nord.js`, `ausbau_ost_west.js`, `anwesen.js`; Schlüssel unverändert; schon laufende alte Stände bleiben gültig). Endkarte Kap. 1: 18 statt 21 (`kino.js`, `sammeln.js`) | 3 von 5 verschoben, s. u. |
| **R-3** Sammelsysteme bündeln | Umsetzung §Systeme | `sammeln.js`: Reiter „PAPIERE DER LWO“ (Akte Abgrund, Pells Heft, Hofers Dienstbuch) und „WARUM SIEHT SIE IHN NICHT?“ (RH-1…11, Lichtsteine); unter FUNDE ausgeblendet; gleiche Lore-Schlüssel | fertig |
| Zentrale Budget-Tabelle | §13 Schreibregeln, Ende: „Wiederholungs- und Gag-Budget“ | – | fertig |

**Bewusst nicht verschoben (H-6):**
- „Hinter dem ältesten Plakat“ bleibt in Kap. 1, weil SB-03 eine Kap.-1-Seite ist (Endkarte „Lose Seiten / 3“) und „Siebzehn“ die Regel aus Kap. 3 vorbereitet.
- „Sind sie wieder da?“ bleibt in Kap. 1, weil R-1 Heidis Karten ausdrücklich Kap. 1 zuordnet und Kap. 3 „Ja.“ darauf antwortet.

**Nicht gemacht:**
- R-2 (Vegas und Gisela trennen) und R12 („Luna mit Lucys Gesicht“, gehört zu W-2 / Teil A).
- B-K5-03 wird im Code von keinem Takt gelegt; das war schon vorher so.

## Für den Schlusstest (bitte gezielt prüfen)
1. **Kap. 2, Planungsraum:** Die Luke-Figur rückt nur beim Hinsehen und steht beim Lesen. Beim 6. Mal fällt sie um, dann ist die Aufgabe erledigt. Beim 2. Hinsehen sagt Luke seinen Satz.
2. **Kap. 5, UK 1 (Veranda):**
   - kein „Himmelherrgott“, die Pfanne scheppert
   - danach genau einmal der Funk (N12, N11, Vegas)
   - B-K4-09 liegt sichtbar auf den Dielen (Agent G-4)
3. **Kap. 5 nach UK 9, Tür Nr. 3:**
   - T-2 läuft mit Wahl
   - beim nächsten Klick Heidis Karte
   - danach weder Witz noch Zettel
4. **Kap. 5, UK 13 Friedhof:**
   - Die Behaltenen rücken vor „Pust.“ nicht.
   - „Pust.“ kommt nach etwa 12 s auch ohne Lampe.
   - Ab dann gilt die Blitzregel.
   - B-K5-08 an der Stalltür ist nicht in der Wand.
5. **Kap. 4, AG-13:** Die Vorlese-Zeilen kommen, während Luke versteckt ist. Wird Luke entdeckt, bricht es sauber ab.
6. **Fibel:**
   - Die Reiter „PAPIERE DER LWO“ und „WARUM SIEHT SIE IHN NICHT?“ erscheinen.
   - Ein Klick öffnet die Notiz.
   - Unter FUNDE fehlen diese Einträge, und der Zähler stimmt.
7. **Kap. 1:**
   - Die Uhr bleibt bei 00:55 stehen und läuft nach dem Band weiter (13 Schläge um eins).
   - Messlatte, Transporter und Villa-Hand lassen sich nicht starten.
   - Die Endkarte zeigt „/ 18“.
   - Die Rücksitz-Heckscheibe zeigt den Kreispfeil.
   - Das Laken-Kind flüstert nicht.
8. **Kap. 3:** Die Villa-Hand winkt. Das Transporter-Klopfen lässt sich starten und abschließen.
9. **Kap. 4:**
   - Die Messlatte lässt sich starten und abschließen.
   - Das Gasleck-Polaroid 1 zeigt Lucy (kein Fuß-Bild).
   - Günther ohne Tor.
   - Gisela mit dem Handschuh-Satz.
10. **Kap. 6:** B-K6-08 nach AG-20 (Agent G-4).

## Hinweis für alle Agenten
Das Bash-Werkzeug macht aus `\\n` in Heredocs ein echtes `\n`. Dadurch landen echte Zeilenumbrüche in JS-Strings, was den Build bricht; `neben4.js` war kurz davon betroffen, ist inzwischen wieder sauber. JS-Text mit Escapes deshalb über das Write-Werkzeug oder `chr(92)` schreiben.

## Geänderte gesprochene Zeilen

| Sprecher | Datei / Stelle | alt | neu |
|---|---|---|---|
| LUKE | `amt.js` Modelldorf | „Ochs am Berg. Ich hasse Ochs am Berg.“ | „Die bewegt sich, weil ich gucke.“ · „… Das ist schlimmer.“ |
| LUKE | `kapitel5.js` Friedhof (Lampe war schon aus) | – | „Die Lampe geht nicht mehr an. Ausgepustet. Wie eine Geburtstagskerze.“ |
| WHISKEY (MIT VEGAS’ STIMME) | `kapitel1.js` Versteck | „Himmelherrgott!“ | (kein Text, Autotür-Summen) |
| WHISKEY (MIT VEGAS’ STIMME) | `villa.js` K4-1 | „Himmelherrgott!“ | „Junge.“ |
| WHISKEY (MIT VEGAS’ STIMME) | `kapitel5.js` UK 1, `whiskey.js` `whiskey_k50` | „Himmelherrgott!“ | gestrichen |
| VEGAS | `kapitel5.js` UK 1 | „Das war nicht ich. Das war der Vogel. Er hat den Speck gefunden. Den ganzen Speck, für die ganze Woche.“ | „Der Vogel. Er hat den Speck gefunden. Den ganzen Speck, für die ganze Woche.“ (gab es schon als Variante) |
| WHISKEY (MIT DEINER STIMME) | `kapitel5.js` UK 12 | „Scheiße!“ (2×) | gestrichen (Fauchen) |
| LUKE | `kapitel5.js` UK 12 | „Das hab ich heute noch gar nicht gesagt.“ | „Unentschieden.“ |
| LUKE (DU) | `justin.js` drache | „Super. Ganz toll. Ein Ritter. Fehlt nur noch der Drache.“ | „Ein Ritter. Fehlt nur noch der Drache.“ |
| LUKE | `kapitel3.js` Zelle | „Fünfzig Hertz. Das Netzbrummen. Nur dass hier seit Stunden kein Strom ist. Super. Ganz toll.“ | „Fünfzig Hertz. Immer noch. Kein Strom im ganzen Dorf, und die Zelle brummt.“ |
| VEGAS | `neben4.js` Günther | „Das Tor ist geerdet! Ha!“ | gestrichen (die Zeile beim Abgang in `lwo.js` bleibt) |
| GISELA | `kapitel5.js` | „Und noch was. Heute Mittag stand der mit dem Hut oben auf dem Friedhof, mit dem Steinmetz. An dem Grab mit deinem Namen.“ · „Der hat sich nicht verändert, seit er bei uns am Küchentisch saß. Das ist nicht gesund.“ | „Und noch was. Der mit dem Hut war heut am Grab. An dem mit deinem Namen. Mit dem Steinmetz. Der zahlt bar. Wer zahlt Gräber bar?“ |
| GISELA | `neben4.js` | „Der Handschuh. Immer noch derselbe Handschuh.“ · „Der hat sich nicht verändert. Das ist nicht gesund.“ | „Der Handschuh. Immer noch derselbe. Ich hab den schon gehasst, da war ich zehn.“ |
| NACHSORGE 11 | `neben5.js` Rückruf nach Heidi | „Schönes Gespräch. Wir hören gern zu.“ | gestrichen |
| Flüstern (Kind) | `_base_source_index.html` `scareSheet` | „… geh nicht in den Keller …“ | gestrichen |
| LUKE | `kapitel5.js` | „Darum hat er mich an der Kreuzung so lange angesehen.“ | gestrichen |
| LUKE | `kapitel5.js` Stall | „Das steht in Mamas Liederheft, und die Häkchen sind Lucys Spieluhr.“ | gestrichen |
| LUKE (DU) | `neben3.js` Kapelle | „Sie zählt bis siebzehn zu dem Lied, das ihre Mama ihr vorgesungen hat.“ | gestrichen |
| LUKE (DU) | `neben3.js` Atlantschiss | „Da unten liegt noch eins, und das ist ganz.“ | gestrichen |
| LUKE | `neben4.js` Gasleck-Polaroid 0 | „Die Kreuzung, die Nacht mit dem Licht. Sie hat nicht die Kinder fotografiert. Sie hat die Füße gezählt.“ | „Die Kreuzung, bevor das Licht kam. Sie hat die Stelle fotografiert, als könnte die weglaufen.“ |
| LUKE | `neben4.js` Gasleck-Polaroid 1 | „Neun Paar. Das neunte ist klein. Drei Zehen. Und es steht nicht ganz auf dem Asphalt.“ | „Lucy. Mitten in der Nacht, an der Kreuzung. Zu weit weg für ein Gesicht. „Zählt mit.““ |
| LUKE | `neben4.js` Gasleck-Polaroid 3 | „Seit fünfundsiebzig derselbe. Und er hat Brot zu einem Jungen gebracht. Zu welchem Jungen?“ | „Seit fünfundsiebzig derselbe Vogel. Raben werden alt. So alt nicht.“ |
| NACHSORGE 12 (FUNK) | `kapitel5.js` UK 1, G-3 | – | „Brandt steht vor Nummer drei. Der Vogel hat den Speck. Brandt sieht jetzt zur Tür.“ |
| NACHSORGE 11 (FUNK) | `kapitel5.js` UK 1, G-3 | – | „Nicht vorlesen, Kollege. Er hört mit.“ |
| VEGAS | `kapitel5.js` UK 1, G-3 | – | „Ich hab’s dir gesagt. Die hören mit.“ |
| VEGAS | `neben5.js` T-2 | – | „Die hatte Mike in der Hand. Er hat für mich Pfand gesammelt. Zweiunddreißig passen in die Kiste hinten an der Tankstelle.“ · „Da stehen einunddreißig. Eine fehlt. Die hier lag morgens auf dem Hof.“ · „Ich hab für ihn unterschrieben.“ · „Deine Mutter hat zweimal angesetzt. Ich hab’s in einem Zug geschafft. Das verzeih ich mir nicht.“ |
| LUKE | `neben5.js` T-2 (Wahl) | – | [a] „Er sitzt auf dem dritten Stuhl. In der Tankstellenjacke.“ · [b] „Das konnten Sie nicht wissen.“ |
| VEGAS | `neben5.js` T-2 (Antwort) | – | [a] „Die hab ich ihm gekauft. Zwei Nummern zu groß. Er sollte reinwachsen.“ · [b] „Ich hab Ordner, Junge. Ich hab alles gewusst. Ich hab bloß gedacht, die nehmen die anderen.“ |
| NACHSORGE 12 / 11 | `lwo.js` AG-13, H-4 | – | N12: „Glas zwei. Leer. ‚Fenster war zu.‘“ · N11: „Lies leise.“ · N12: „Ich les immer so.“ · N12: „Kiste einundvierzig. Lebend. Nicht füttern.“ · N11: „Wer schreibt so was auf einen Lieferschein?“ · N12: „Du. Zweitausendzwölf.“ |
| LUKE (Gedanke) | `gedanken.js` A-01 | „Mein Herz macht gerade Techno. Hundertachtzig BPM. Das tanzt keiner.“ | „Puls auf hundertachtzig. Wenn das ein Podcast wär, würd ich den Atem rausschneiden. Geht nicht. Ist meiner.“ |
| LUKE (Gedanke) | `gedanken.js` A-09 | „Ich brauch einen Kaffee. Und eine Therapie. Und einen Kaffee während der Therapie.“ | „Ich brauch einen Kaffee. Oma hätte gesagt: Kind, du brauchst Kassler.“ |
| LUKE (Gedanke) | `gedanken.js` A-13 | „Ich war noch nie so wach. Ich glaub, ich kann Farben hören.“ | „Mein Tinnitus hat gerade gekündigt. Der will hier auch nicht sein.“ |
| LUKE (Gedanke) | `gedanken.js` A-14 | „Und das war der Moment, in dem Luke Brandt beschloss, nie wieder Nachtschicht zu machen. Für drei Sekunden.“ | „Notiz an mich: Nachtschicht im Studio ist gar nicht so schlimm. Da fällt nur selten was vom Himmel.“ |
| LUKE (Gedanke) | `gedanken.js` `GEDANKEN_LUCY` (H-6) | – | „Lucy. Ich sammel hier Katzen, und du bist irgendwo im Dunkeln.“ · „Elf Anrufe. Und jetzt lauf ich durch dein Dorf und guck in fremde Briefkästen.“ · „Wenn sie jetzt anruft, geh ich ran. Beim ersten Klingeln.“ · „Du hättest längst einen Plan. Mit Zettel und blauen Pfeilen. Ich hab eine Taschenlampe.“ · „„Großer, du trödelst.“ Ja. Ich weiß.“ |
| LUKE (Gedanke) | `leben.js` Weltuhr (H-6) | – | „Fünf vor eins. Seit einer Ewigkeit fünf vor eins.“ |
| LUKE (Gedanke) | `beobachter.js` nach B-K6-03 (Agent G-4) | „Ein Euro sechsunddreißig. Mit Glück. … Ja. Für hier schon.“ | gestrichen |

Nicht gesprochene Erzähltexte, die sich geändert haben (nur Untertitel/Notiz):
- Günthers Rad (`neben4.js`)
- Rücksitz (`post.js`)
- Brotdose (`zimmer7.js`)
- Heidi-Umschlag (`neben4.js`)
- Lore „Einunddreißig Flaschen“
