# High Abyss Mira – Story-Bibel (Audit 4)

Stand: 29.09.2026 · Nur-Lese-Audit von `C:\Users\GIGABYTE\HighAbyssMira-Repo`
Grundlage: `app/story/story_final.md` (Kanon, „Verbindliche Ergänzungen“ haben Vorrang) **und** das, was das Spiel tatsächlich zeigt.

**Abkürzungen für Fundstellen**
- `base:NNNN` = `app/mods/_base_source_index.html`, Zeile NNNN (Kapitel 1–3, Grundspiel)
- `modul.js:NN` = `app/mods/modul.js`, Zeile NN
- `kanon:NN` = `app/story/story_final.md`, Zeile NN

**Status-Zeichen:** ✅ im Spiel wie im Kanon · ◐ im Spiel teilweise/anders · ✗ fehlt im Spiel · ⚠ Widerspruch · 🔓 im offenen Kapitel-1-Welt vor der Enthüllung erreichbar (Spoiler-Leck)

**Wichtigster struktureller Befund vorweg:** Die gesamte Oberwelt (Kirchberg, Ost, West, Forbidden Dustwoods, tiefer Wald) ist **ab Kapitel 1 ohne Kapitel-Sperre** begehbar (keine Kapitelprüfung in `wald.js`, `tiefwald.js`, `hungrige.js`, `akte.js`, `ausbau_nord.js`-Texten, `ausbau_ost_west.js`-Quests). Dadurch können Hinweise, die für Kapitel 3/6 gedacht sind, schon in Kapitel 1 gefunden werden – mehrere davon verraten die Twists 1, 4, 7 und 8 im Klartext (siehe §8).

---

## 1. Chronologie 1312 → 2026

| Jahr / Datum | Ereignis (Kanon) | Im Spiel belegt durch | Status |
|---|---|---|---|
| 10.11.1312 | Weißes Licht fällt in die Senke hinter Justins Hof. Justin schneidet sich die linke Hand; die Kleine (7) wischt das Blut ab („Jetzt hab ich dich an mir“). Verstecken, Justin zählt bis 17. | Kind in Raum 3: „Aus deinem Blut an meinen Händen … bevor du angefangen hast zu zählen“ `base:3910`; Justin in Raum 2 `base:3887` | ✅ |
| 11.11.1312, 03:13 | Justin öffnet die Augen, die Kleine ist im Licht. Er geht nicht hinein, schickt 7 Dorfkinder mit Laternen („Sieben für meine eine“). | Justins Geständnis `base:3888–3889`; Chronik-Tafel erzählt die Legende („ritt ihm nach“) `base:3623` | ◐ Geständnis per Dialog statt Rätsel |
| 15.11.1312 | 7 Kinder kehren zurück, eines ist eine Kopie aus Justins Blut (Original **Konrad** bleibt). | Chronik „eines war ein anderes“ `base:3623`; Konrad-Grab ✗ | ◐ |
| 1313 | Sühnevertrag, Kapelle St. Martin, Laternenfest 11.11. | Akte Abgrund 2 („Sühnevertrag eines Ritters von 1313“) `akte.js:10`; Sühnekreuz 1312 `ausbau_nord.js:406`; Kapellen-Innenraum ✗ | ◐ |
| ab 1329, alle 17 J. | Die Kleine zählt, sucht Papa; Justin versteckt sich in Eisen, führt Kinder heim, altert nicht. | Kind: „714 Jahre … 42 Mal gerufen“ `base:3917`; Zählbuch, Vegas-Brief `base:3747, 3751` | ✅ |
| 1891 | Pfarrer Ahrens schreibt die Chronik (Urfassung des Reims). | Chronik „Abschrift von 1891“ `base:3623`; Gesangbuch ✗ | ◐ |
| 1941 | Theodor Seiler (7) unter den Sieben, erinnert sich. | nicht im Spiel | ✗ |
| 1958 | Seiler gründet die Außenstelle der BfR („verwalten, nicht beseitigen“), fotografiert Justin; Funk 31,10 MHz. | Akte Abgrund 2 `akte.js:10`; Zählbuch „seit 1958 dieselbe Zahl“ `base:3747`; Villa-Brief `anwesen.js:220`; Grab „Unbekanntes Kind … 5. Aug. 1958 … 08“ `ausbau_nord.js:268` | ✅ |
| Sommer 1975 | Unter den Sieben: Lars Vegas (9), Hilde Sommer (9), Marion Kranz (8), Peter Kranz (10). Peter kommt als Kopie zurück (braune Augen). Seiler lanciert „UFO über dem Abgrund“. | Echo 1975 `base:4359`; Vegas-Brief `base:3751`; Akte Abgrund 3 `akte.js:11`; Fotowand Beweis 4 `fotos.js:16` | ✅ |
| 1986 | Hilde wird Schreibkraft im Amt, wohnt in Nr. 7. | indirekt (Jonas-Zettel 3: „Sie geht jeden Morgen ins Amt“ `tiefwald.js:205`) | ◐ |
| 12./13.07.1992 | Zyklusnacht. Peter liest seine Akte, wird „nacherzählt“ zurückgegeben (Zahn-Mann), auf Ebene −2 eingesperrt. Bergungstrupp 3 holt den **Hungrigen**; Hofer kommt „mit fremdem Gesicht“ zurück. Kopie 1992 = Daniel Lorenz. | Akte Abgrund 4/6 `akte.js:12,14`; Hofers Dienstbuch `hungrige.js:84–85`; Fotowand Beweis 7 `fotos.js:21`; Sperr-Aushang 13.07.1992 `ausbau_ost_west.js:400`; Peter-Grab „1965–1992“ `ausbau_nord.js:266`; Daniel Lorenz ✗ | ◐ |
| 1994–2011 | Versuchsreihe K an Peter; 03.03.2011 reißt er das Gitter heraus. | Akte Abgrund 7 `akte.js:15` | ✅ |
| 05.05.2000 | Luke und Lucy Brandt geboren (Luke 4 Min. älter → „Großer“). Hund Flocke. | Karte „zum 10.“ `base:3825`; Flocke nur in Akte 06 `base:3269` | ◐ |
| 01.07.2009 | Losziehung in Zimmer 7; Hilde zieht Zayns Kugel. | **nicht im Spiel** (Zimmer 7, Losurne, Dienstbuch fehlen) | ✗ |
| 03.–21.07.2009 | Einwilligungen der Eltern (Mama 14.7., zweimal angesetzt; Hilde als Letzte 21.7.). | nur indirekt: Mamas Brief 1 `base:2388`, Akte 08 „Mutter unterschreibt“ `base:3476`, Vegas „Ich hab Mike unterschrieben“ `base:3751` | ◐ (Aushang fehlt) |
| 25.07.2009 | Cleos 8. Geburtstag, nur Lucy kommt. | Tagebuch `base:2382` | ✅ |
| 27.07.2009 | Sommerfest; blasses Mädchen: „Darf ich mitspielen?“ – der echte Luke: „Klar.“ Acht Kinder auf dem Foto. | Album `base:2378`; Fotowand Beweis 5 `fotos.js:18`; Gruppenfoto im Amt `innen_kapitel.js:195`; Sommerfest-Echo „Klar“ ✗ | ◐ |
| 28.07.2009, 23:40 | Die Sieben verschwinden; Cleo geht freiwillig mit („Eine für sieben“). | Akten 01–07 `base:3264–3270`; Fotowand Beweis 1 (23:41) `fotos.js:10`; Cleo `cleo.js:55,80` | ✅ |
| 01.–03.08.2009 | Rückkehr: Roxy 1.8. 05:10, Lucy 1.8. 23:55, Mike 2.8. 06:00, Dina 2.8. 21:30, Heidi 3.8. 04:45. | Akten 01–05 `base:3264–3268`; Ordnungstafel `base:3280` | ✅ |
| 05.08.2009, 03:13 | Justin führt die Kopie heran (Handtausch durch die Kleine). Echter Luke am Nebelrand. Vegas zählt sieben; „Acht.“ | Echo Kreuzung `base:4347–4348`; Akte 06/08 `base:3269, 3476`; Zählbuch `base:3747`; Laufzettel `innen_kapitel.js:158`; Handtausch-Enthüllung ✗ | ◐ |
| 06.08.2009 | Tauschversuch auf Stuhl 8, Justin zerschlägt die Maschine (Klingensplitter). | ✗ (Stuhl 8 nur als Schlüsselteil-Versteck `anwesen.js:76`) | ✗ |
| 08/2009 | Mama fragt nach dem Hundenamen; Nachsorge-Zeichnungen „LUKE, 9“. | Echo Kinderzimmer `base:4351–4352`; Keller-Zeichnungen `base:2368`; Mamas Brief 2 `base:3743` | ✅ |
| 10/2009 | Amt bietet Hilde ein Kind „fast wie Zayn“ an; Hilde: „Dann will ich gar keinen.“ | Echo Küche `base:4349–4350`; Zählbuch `base:3747` | ✅ |
| 31.10.2009, 03:13 | *(nur Spiel)* Ein barfüßiger Junge „Luke B.“ kauft 10 l Benzin, zahlt mit einem Foto „von morgen“. | `ausbau_ost_west.js:372, 380` | ⚠ ohne Kanon, ohne Auflösung |
| 12/2009 | Roxy zündet Nr. 5 an („Da oben war es warm“). | Echo Brand `base:4353–4354`; Polaroid Roxy `base:2213` | ✅ |
| 2010 | Papa Thomas geht; Familie Winter zieht mit Heidi weg. | Familienfoto `base:2377`; Akte 05 `base:3268` | ✅ |
| Frühjahr 2011 | Mama geht mit Laterne in die Senke (Lucy folgt ihr heimlich); Zwillinge wachsen bei Oma Erna Kranz auf. | Mamas Brief 2 (datiert Frühjahr 2011) `base:3743`; Fotowand Beweis 6 (14.03.2011) `fotos.js:20`; Familiengrab Brandt `ausbau_nord.js:269` | ✅ |
| 2009–2016 | Jonas sucht Zayn 40 Mal, rote Wolle. | Zettel 1–5 `tiefwald.js:203–207` | ✅ |
| 19.11.2012 | Auflösung der Außenstelle; Edda Brand verschwindet auf dem Weg nach Hamburg. | Akte Abgrund 10 `akte.js:18` | ✅ |
| 2018 / 2019 / 2020 | Luke zieht weg (Tontechniker); Seiler stirbt in der Villa (Brief März 2019); Oma Kranz stirbt. | Villa-Brief `anwesen.js:220`; Vegas bekam Teil 06 „2018“ `anwesen.js:98` | ◐ |
| 06/2026 | Roxy geht „heim“, Laterne vor Nr. 5 aus. | nur über Laternenfolge | ◐ |
| 12.07.2026, 03:13 | Mike verschwindet aus der Tankstelle; Laterne Nr. 3 aus. | Akte 03 Nachtrag `base:3266`; Fotowand Beweis 2 `fotos.js:12`; Polaroid Mike `base:2215` | ✅ |
| 20.–22.10.2026 | Hilde zeigt Lucy das Amt; Lucy bespricht das Tonband. | Tagebuch 20.10. `base:2382`; Tonband `base:2360–2364` | ✅ |
| 23.10.2026 | Lucy ruft 11× an (23:41–23:57), fotografiert das Licht (23:58), landet im Tank. Hilde zählt erstmals **neun**. | Handy `base:2425`; Zählbuch `base:3747`; Zeitung `base:2350` | ✅ |
| 31.10.2026, 03:13 | „Lucy“ (die Kleine in Lucys halber Gestalt) kommt zurück, wird im Keller festgeschnallt. SMS „bin wieder da. komm nach hause.“ | Kalender `base:2354`; SMS im Handy `base:2425`; Kühlschrankzettel `base:2352` | ✅ |
| 03.11.2026 | Die Gestalt übt Lucys Stimme; Bruno verschwindet. | Kalender-Eintrag 3.11. ✗; Bruno-Quest `base:2399–2410` | ◐ |
| 04.11.2026, 02:14 | Anruf „Haus Nummer 7. Der Keller.“ (4 s). | Intro `base:5100`; Handy „heute, 02:14 – 0:04“ `base:2425`; Telefon Kap. 3 `base:3732` | ✅ |
| 04.11. ca. 23:00 → 05.11. Morgengrauen | Kapitel 1–3 in einer Nacht. | ⚠ Spieluhr-Zeit: Welt-Uhr startet in Kap. 1 bei **02:47** und läutet 03:00 und **03:13** (`leben.js:896–903`) – Kapitel 3 beginnt erneut um 03:13 (`base:4081`). | ⚠ |
| 05.11.2026, Morgen | Kapitel 4: Strom zurück, Villa (setzt Ende B fort). | `anwesen.js:167–181` | ✅ |
| „2043“ | Polaroid in Ende B, Porträt „… IRA, gemalt 2043“ (Mira aus der Zukunft). | `base:3962`; `anwesen.js:222` | ✅ |

---

## 2. Die Nacht vom 4. auf den 5. November 2026 – wie sie im Spiel tatsächlich abläuft

1. **Prolog (Traum, `traum.js`)** – filmische Kamerafahrten mit Letterbox: leere Straße, Kind zählt bis 17, Rabe Whiskey auf der Laterne: „Du hast lange geschlafen. Siebzehn Jahre lang“, „Deine Schwester … hat sich versteckt“, „Die Kinder vor dem Licht. **Der Ritter vor seinem Kind.** Und du … vor dir selbst.“ (`traum.js:10–14`). Fibel wird übergeben. Aufwachen im Regen auf der Straße (`traum.js:80–83`).
2. **Kapitel 1 · Das Haus Nummer 7** – Ostende: Gestalt mit Lichtaugen verschwindet (Justin, `base:1678, 5252`). Briefkasten Nr. 7 → Schlüssel + Zettel „Folge den Pfeilen“ (`base:2337`). Nr. 7: Zeitung, Fernseher „HALLO LUKE“, Kalender „SIE IST ZURÜCK. ABER DAS IST NICHT LUCY“, Kühlschrank (Code-Regel), Küchenschreck (Hilde stürzt heran, Licht aus, Fußspuren enden an der Kellertür). Kellertür 3110. Keller: Tonband + Stuhlschreck („… Luke …“), Riemen offen (`base:2358–2366`). Parallel offene Welt: 7 Polaroids, Nr. 1 (Tagebuch, Brief 1, Laken-Geist, Schrank), Bruno/Vegas, Lucys Auto (Handy, Rücksitz-Kind), Telefonzelle (eigene Kinderstimme, Doppelgänger), Kirchberg, Ost, West, Wald. Hinaufgehen → Stromausfall, UFO, Hilde im Strahl („Du hast sie rausgelassen“ als geflüsterter Untertitel `base:5291`), wird an Luke vorbei hochgerissen (`base:2874`). **Kein Kapitelende**: „Stille. Wo sie stand, glänzt der Asphalt“ → zurück in den Keller (`base:2466–2470`). Das Versteckspiel vor dem Suchlicht (Kanon Beat 10) fehlt.
3. **Übergang (`uebergang.js`)** – Brechstange aus der Werkbank, Wand aufbrechen, Gang, Tür ohne Klinke fällt zu, Einblendung „KAPITEL 2“.
4. **Kapitel 2 · Das achte Kind** – Tunnel, Archiv (Akten 01–07, Ordnungstafel → Vermessungsprotokoll „Ersatz geliefert“), Sicherungsraum (Lights-Out, Hauptsicherung), Lautsprecher „Willkommen zurück, Luke“ + Kichern, Spinnenraum (Schwarm + Feuerzeug „P. K.“ `feuer.js:271`), langer Gang: Jagd durch den Zahn-Mann, Ölfass, Feuer – **Luke verbrennt Onkel Peter** (`feuer.js:377–424`), Rauchflucht (`feuer.js:430–490`), Messraum: Notenblatt, Klavier E-D-C-H-C, **Akte 08** (`base:3476`), Lucy im Tank („Du bist der, mit dem ich groß geworden bin … Weißt du es jetzt?“ `base:3482–3484`), graues Gesicht am Glas (`base:2893`), Schwarzblende, „Der Tank ist leer“ (`base:3495`), Leiter nach oben.
5. **Kapitel 3 · Das Licht** – Kreuzung, 03:13, die Kuh fällt (`base:4045`), Justin tritt aus der Lichtsäule (`base:3787–3791`), Telefon: „Das war nicht Lucy, Bruder. Das war ich“ (`base:3732–3735`), Geheimnisse (Chronik, Brief 2, Zählbuch, Vegas-Brief), Vegas an der Tür (`albers.js`), die Graue jagt (`base:4392`), Funk 31,10 **nennt die Laternenfolge direkt** (`base:3646`), Schaltkästen 5→3→1→7, Gezählte-Jagd zu Justin (`base:3689–3724`), das Weiße: Raum 1 (Geburtstagskarte), Raum 2 (Hilde; Küchenuhr 03:13; **Justin gesteht**), Raum 3 (acht Stühle, das graue Kind: „Ich habe ihn gemacht“), Wahl A/B, Endkarte (`base:3905–3963`). Optional: Atlantschiss (`base:4416–4512`), Zayn, Cleo, Wald, tiefer Wald.
6. **Kapitel 4 · Die Villa** – Morgen, Strom zurück, acht Schlüsselteile (fehlende aus Whiskeys Nest), Prägepresse, Halle, Seilers Brief, Porträt „… IRA / gemalt 2043“, eingebrochene Treppe, Frauenstimme „Noch nicht, Luke. Aber bald.“ → Endkarte (`anwesen.js:167–300`).
7. **Kapitel 5** – existiert nicht (Kanon: „bleibt frei“ `kanon:152`).
8. **„Kapitel 6“ · Der Hungrige** – kein eigenes Kapitel, sondern eine Nebenaufgabe im Wald, die **jederzeit** (ab Kapitel 1) spielbar ist; am Ende nur `questPop('KAPITEL 6', 'Der Hungrige')` (`hungrige.js:272`).

---

## 3. Figuren

### Luke Brandt (26) – Spielerfigur
- **Wahrheit:** Kopie von 2009 aus Justins Blut, „geboren“ 05.08.2009, 03:13; braune Augen; halbrunde Narbe links (= Justins Narbe). Liest den **Nachhall** der Orte (Echos) durch Justins Blut.
- **Motiv:** Lucy finden; später: wer bin ich.
- **Schuld:** 11 Anrufe nicht angenommen (Handy `base:2425`); hat „Lucy“ aus dem Keller gelassen; *(nur Spiel)* hat Onkel Peter verbrannt (`feuer.js:490`: „Ich hab ihn angezündet. Mamas Bruder.“).
- **Beziehungen:** Lucy (Zwilling, wählt ihn), Mama (liebte ihn trotzdem), Justin („Vater“, „Danke, Sohn“ `base:3949`), die Kleine („Bruder“), echter Luke (Original), Peter (Onkel/„Bruder“), Jonas (bester Freund des *echten* Luke), Zayn.
- **Spielstatus:** ◐ – Kanon-„Du-Seite“ mit vier durchgestrichenen Gedanken ✗; Innenstimme über `gedanken.js` ✅; „Ich hab nie gewusst, wie der Hund hieß“ ✗.

### Lucy Brandt (26)
- **Wahrheit:** echt; weiß seit dem ersten Morgen 2009, dass ihr Zwilling fehlt, wählt Luke trotzdem; seit 23.10.2026 halb im Tank, halb bei der Kleinen.
- **Erkennungszeichen:** „Großer“, „heim“ (✅ Tonband, Tank, Handy-Kommentar `base:2425`); HASENBROT ✗; blaue Kreispfeile ✗.
- **Spielstatus:** ◐ – Kapitel 1 und 2 stark; **in Kapitel 3 verschwindet sie** (Tank leer `base:3495`, keine Szene, kein Funk mit zwei Lucys), taucht nur im Endtext B wieder auf (`base:3962`). In Kapitel 4 schläft sie bei Vegas (nur Introtext `anwesen.js:167`).

### Die Kleine (Justins Tochter, namenlos, „DAS KIND“)
- **Wahrheit:** Sie *ist* das Licht; spielt Verstecken; macht Kopien aus Papas Blut; imitiert Stimmen (mit Spieluhr darunter); Heimkehrerin, Graue, Gesicht am Tank.
- **Spielstatus:** ◐ – Stimme am Telefon (Kap. 3), Graue (Jagd), Kind in Raum 3 („Ich habe ihn gemacht“ `base:3910`); Echo „Sieben für Papa“ `base:4362`. Heimkehrerin am gedeckten Tisch ✗, „Gefunden.“ ✗, „Ich hab die ganze Nacht durch dich geguckt“ ✗, Laterne statt UFO ✗.

### Justin vom Hohen Abgrund
- **Wahrheit (Kanon):** ging 1312 nie hinein; versteckt sich seit 714 Jahren in Eisen; lebt am Rand des Weißen; will gefunden werden.
- **Im Spiel:** tritt aus der Lichtsäule; sagt „Das Weiße spuckt mich aus … Dies ist nicht meine Zeit“ (`base:3788`) und „Seitdem wirft es mich alle siebzehn Jahre in eure Welt“ (`base:3889`) ⚠ (Kanon: er versteckt sich freiwillig). Gesteht in Raum 2 (statt durch das Fußspuren-Rätsel in Raum 3). Helm ab / braune Augen / Narbe ✗. „Danke, Sohn“ ✅. Name „Luke“ nie gesagt ✅.
- **Beziehungen:** Tochter, Frau Mira (Rabe Whiskey gehörte ihr `whiskey.js:65–66`), Luke, Seiler (fotografierte ihn), Vegas (führte ihn 1975 heim `base:3762`).

### Mira (Justins Frau, Retterin aus der Zukunft)
- **Spuren:** ältester Stein „… IRA · HAUSFRAU DES RITTERS … Sie kommt noch“ (`ausbau_nord.js:267`), Whiskey „Er gehörte meiner Frau“ (`whiskey.js:65–66`), Wrack-Zeichnung „Die Frau mit der Laterne – Sie kommt noch“ (`tiefwald.js:291`), Fahrtenbuch-Nachtrag „Sie kommt noch“ (`tiefwald.js:223`), Fibel letzte Seite „— M.“ (`entdecker.js:63`), Porträt 2043 (`anwesen.js:222`), Stimme „Noch nicht, Luke. Aber bald.“ (`anwesen.js:293–294`), Whiskeys Licht im Hungrigen-Finale (`hungrige.js:264–267`). ✅ sauber und leise gesetzt.

### Hilde Wendt (60, sieht aus wie 80) – Nr. 7
- **Wahrheit:** 1975 drin; Zählerin des Amts; zog Zayns Los; Wächterin, die den Keller zuhielt; Mutter von Zayn **und Jonas**.
- **Spiel:** Küchenschreck als Monster (`base:2776`), im Strahl („Du hast sie rausgelassen“), Zählbuch (`base:3747`), Raum 2 („Ich hab 2009 Nein gesagt … Frag ihn“ `base:3878–3881`). „Nicht du“ + Narbengriff ✗; Losziehung ✗; „Ich wollte dich festhalten, Junge“ ✗ → die Umdeutung des ersten Schreckens bleibt unvollständig. Jonas erwähnt sie nie ⚠.

### Der echte Luke (für immer 9, blaue Augen)
- **Kanon:** warnt am Telefon, schreibt „NICHT SIE“, Laken-Gespenst; wird in Raum 1 im Schrank gefunden.
- **Spiel:** Stimme am Telefon „Das ist … deine eigene“ (`base:2433`), Doppelgänger mit hellblauen Augen (`base:2856`), Laken „geh nicht in den Keller“ (`base:2863`); *(nur Spiel)* Brief im Stall: er schläft im Pferdestall, „Da schläft schon einer in meinem Bett“ (`ausbau_ost_west.js:415`) ⚠. **Begegnung/Enthüllung ✗.**

### Mama – Marion Brandt, geb. Kranz (1967–2011 verschollen)
- **Spiel:** Brief 1 (`base:2388`), Echo Kinderzimmer (`base:4352`), Brief 2 (`base:3743`), Beweis 6 (`fotos.js:20`), Familiengrab (`ausbau_nord.js:269`), Feuerzeug für Peter „– M.“ (`feuer.js:4`). Raum 1 „Wie hieß unser Hund?“ ✗.

### Lars Vegas (60) – Nr. 3, Hund Bruno
- **Wahrheit:** 1975 drin; Mikes Großvater; unterschrieb für Mike; zählte 2009 sieben.
- **Spiel:** Bruno-Quest (`base:2395–2410`), Brief (`base:3751`), fünf Türgespräche + Nebenaufgabe „Spinnereien“ (`albers.js:14–29`), Schlüsselteil 06 (`anwesen.js:98`), nennt den Raben Whiskey (`whiskey.js:43`). ✅ stark.

### Peter Kranz – der Zahn-Mann
- **Kanon:** Kopie 1975, wusste es 1992, seit 1992 im unteren Gang; beißt nicht, hält Lukes Gesicht, sagt „Bruder“.
- **Spiel:** jagt im langen Gang; Tod des Spielers durch **Biss** (`tod.js:3, 133–165`) ⚠; stirbt durch Lukes Feuer (`feuer.js`) – *neuer Kanon*, in `story_final.md` nicht nachgetragen; in Kapitel 3/4 reagiert niemand darauf ⚠.

### Weitere
- **Zayn Wendt (7)** – Nebenquest „Versprochen ist versprochen“ ✅ (`zayn.js`).
- **Jonas Wendt (geb. 2000)** – 40 Suchen, rote Wolle, Taschenmesser, Vorratsdose, Lager ✅; Verbleib nach 2016 offen.
- **Cleo (8)** – vergessenes Kind, „Eine für sieben“ ✅ (`cleo.js`).
- **Roxy, Mike, Dina, Heidi** – nur über Akten, Polaroids, Echos; Dina/Frau Aydın/Heidi-Postkarten-Quest ✗.
- **Daniel Lorenz (Kopie 1992)** ✗ komplett.
- **Dr. Theodor Seiler (1934–2019)** – Brief, Presse, Fahrtenbuch, Fotos ✅.
- **Dr. Edda Brand** – Akte Abgrund, 10 Durchschläge ✅.
- **Gefreiter Hofer / der Hungrige** – ✅ (`hungrige.js`).
- **Der Beobachter** (kleiner weißer Außerirdischer, „∴“, der Neunte) – ✅ (`beobachter.js`), Auflösung „Kapitel 7“.
- **Whiskey** – Rabe Miras ✅.
- **Oma Erna Kranz, Opa Kranz (Tankstelle Kranz)** – nur Spiel: „Tankstelle Kranz. Opas Tankstelle“ (`gedanken.js:29`), Zettel „Peter, wenn du das findest … — Vater“ (`ausbau_ost_west.js:380`), Kassenbuch „— E. K.“ (`ausbau_ost_west.js:372`).

---

## 4. Orte (Funktion im Spiel)

| Ort | Kap. 1 | Kap. 2/3/4/6 | Anmerkung |
|---|---|---|---|
| Ortsschild (West) | Start, Aufwachen | – | Einwohnerzähler 214/211/210 ✗ |
| Nr. 1 Elternhaus | Tagebuch, Brief 1, Album, Familienfoto, Spieluhr, Laken, Schrank, Polaroid Luke/Heidi, Lucys Pinnwand (`fotos.js`), Spiegel, verkehrtes Bild (`innen_ort.js:290`) | Kap. 3: Brief 2 | gedeckter Tisch/Flurschleife ✗ |
| Nr. 3 Vegas | Bruno-Quest | Kap. 3: Brief, Türgespräche; Kap. 4: Teil 06 | ✅ |
| Nr. 5 Brandhaus | Aschekreis, Halsband, Polaroid Roxy, Echo Brand | Kap. 3: Schaltkasten 1 | ✅ |
| Nr. 7 Wendt + Keller | Hauptquest, Fotowand Hildes (`fotos.js`) | Kap. 3: Zählbuch, Schaltkasten 4; Zayn-Rucksack | ✅ |
| Kreuzung/Telefon/Funk/Gully | Echo 2009, Anruf | Kap. 3: Kuh, Telefon, Funk, Chronik, Gully → Atlantschiss | ✅ |
| Südstraße, Lucys Auto | Handy, Rücksitz-Kind | – | Kap. 3 „GROSSER“ an der Scheibe ✗ |
| Kirchberg: Friedhof, Gedenkfeld, Kapelle, Spielplatz, Bushaltestelle, Häuser 11–17 | Gedenkfeld-Quest (7 Gräber † 28.07.2009), achter Stein (Cleo), Mira-Stein, Peter-Grab, Bärli, Bus 03:13, Kreide-Acht, Sühnekreuz | Kap. 3: Kapelle innen ✗ | ⚠ Gedenkfeld-Echo spoilert (§8) |
| Ost: Tankstelle Kranz, Kiosk, Schrottplatz, Sperre | Kassenbuch/Kassette/Kanister, Kiosk-Gestalt, Klopfen im Blech, Scheinwerfer | – | Mikes Schichtbuch, Band vom 12.7. ✗ |
| West: Schrebergärten, Hof/Stall, Villa | Brunnen („Luke? Bist du das oben?“), Vogelscheuche mit LUKE-Jacke, Heft im Heu (Brief des echten Luke), Drei Laternen | Kap. 4: Villa | ⚠ Stall-Brief spoilert |
| Forbidden Dustwoods | – (offen) | Kap. 3: Zayn, Cleo, Welpe, Hirsch | keine Sperre |
| Tiefer Wald | – (offen) | roter Faden, Rotte, Wrack (Mira), Weiher, Hungriger | keine Sperre |
| Amt Ebene −2 | – | Kap. 2 | Zimmer 7, Zelle, Kantine, Modelldorf ✗ |
| Das Weiße (Raum 1–3) | – | Kap. 3 | Raum 1 ohne Mama/echten Luke |
| Atlantschiss | – | Kap. 3 optional | ✅ |
| Villa-Halle | – | Kap. 4 | ✅ |

---

## 5. Ursache und Wirkung (Kausalketten)

1. **Justins Angst 1312** → Sieben Kinder statt Suche → die Kleine *wird* das Licht → Zyklus alle 17 Jahre → Sühnevertrag → Laternenfest → Dorf besteht aus Familien der Sieben (Seilers Stammbaum ✗).
2. **Kopien aus Justins Blut** → Konrad/Peter/Daniel/Luke → wer es weiß, durch den sieht sie (Peter 1992 → Zahn-Mann; Luke 2026 → Fenster der Kleinen) → Justin braucht Luke, um gefunden zu werden.
3. **Seilers Liste (1958–2012)** → Losziehung/Einwilligungen → 2009 nimmt das Licht genau die Sieben (+ Cleo freiwillig) → Auflösung 2012 → **2026 ohne Liste** holt sie die Sieben in der Reihenfolge der Unterschriften (Laternen 5→3→1→7).
4. **Lucy erfährt die Wahrheit (22.10.)** → ruft Luke 11× an, er geht nicht ran → Licht berührt sie → Hilde versteckt sie im Tank → die Kleine kommt in Lucys halber Gestalt (31.10.) → Hilde schnallt sie fest → die Kleine lockt Luke per Anruf → **Luke lässt sie frei** → Hilde wird geholt.
5. **Luke liest Akte 08** → die Kleine sieht durch ihn → sieht Lucy im Tank (Tank leer) und in Kapitel 3 Justin → Raum 3.
6. **Bergung 3 (1992)** → der Hungrige frisst den Nachhall → der Wald hat kein Echo, Jonas’ Suchen sind „gefressen“ → Luke ist das größte Mahl → Whiskey (Miras Licht) vertreibt ihn.
7. *(nur Spiel)* **Luke findet Peters Feuerzeug (von Mama)** → verbrennt Peter → Rauch, Todesgefahr → emotionale Folge nicht erzählt.
8. **Ende B** → Justin geht allein → Lucy bleibt Luke → Morgen/Strom → Villa (Kap. 4) → Mira kündigt sich an.

---

## 6. Die Regeln des Lichts – Kanon vs. Spiel

| Regel (Kanon `kanon:273–284`) | Gezeigt / erlebt / benutzt / erklärt im Spiel? |
|---|---|
| 1 Verstecken bis 17 | ✅ Zählen im Traum, Kerben-Reim, Chronik, Raum 2 |
| 2 Laternelaufen (Lampen = Augen; ausblasen vor dem Haus) | ◐ Schaltkästen, Funk; „UFO = ihre Laterne“ ✗ |
| 3 Ochs am Berg (Graue bewegt sich nur ungesehen) | ◐ Graue-Mechanik, Puppe, Totems; nie als Kinderspiel benannt |
| 4 Augen zu | ✗ (Mechanik und Dina fehlen) |
| 5 Stille Post (Stimmen, Spieluhr darunter, kein nie gesagtes Wort) | ◐ „Keine Spieluhr darunter“ (`base:2433`); HASENBROT ✗ |
| 6 Aus (unter der Erde sieht sie niemanden) | ◐ Tonband-Satz fehlt in der Spielfassung; Tank-Erklärung ✗ |
| 7 Eisen ist Freimal | ✗ (Hufeisen, „EISEN IST FREI“, Freimal in der Jagd fehlen) |
| 8 Die Kette („Wer loslässt, bleibt im Weißen“) | ✅ Echo 1975 `base:4360`, Justin `base:3722` |
| 9 Wer einmal drin war, den findet sie wieder | ◐ (Kellerwand-Satz ✗) |
| 10 Wer es weiß, durch den sieht sie | ✅ Akte 08, Lucy, Echo Archiv, Akte Abgrund 5 |
| 11 Geschenkt ist geschenkt (Cleo) | ✅ `cleo.js` |

---

## 7. Hinweis- und Foreshadowing-Karte (Fundort → Ziel)

Spalte „ab“ = frühestes Kapitel, in dem der Hinweis tatsächlich erreichbar ist.

### Zu Twist 1 „Du hast sie rausgelassen“ (Anruf kam von der Kleinen)
| Hinweis | Fundstelle | ab | Art |
|---|---|---|---|
| Kalender „SIE IST ZURÜCK. ABER DAS IST NICHT LUCY.“ | `base:2354` | 1 | Text |
| Kühlschrank „KELLER BLEIBT ZU!!“ (ohne „Egal mit welcher Stimme“) | `base:2352` | 1 | Text ◐ |
| SMS „komm nach hause“ – „So hat Lucy nie geredet. Sie sagt heim.“ | `base:2425` | 1 | Text |
| Anruf heute 02:14, Handy lag im Auto | `base:2425` | 1 | Text |
| Telefonzelle „Da unten ist nicht Lucy“, „Keine Spieluhr darunter“ | `base:2433` | 1 | hörbar |
| Fußspuren mit fremdem Gras enden an der Kellertür | `base:2784`; Bett Nr. 7 `innen_ort.js:230` | 1 | sichtbar (Toast) |
| Kratzspuren „Von innen“ an der Kellertür | `base:2355` | 1 | Text |
| Stuhl leer, Riemen offen | `base:2364, 2815` | 1 | sichtbar |
| Hilde „Du hast sie rausgelassen“ | `base:5291` | 1 | Enthüllung |
| Telefon Kap. 3 „Das war nicht Lucy, Bruder. Das war ich.“ | `base:3734` | 3 | Bestätigung |
| 🔓 Gedenkfeld-Echo „Er kommt. Ich hab ihn angerufen. Mit Lucys Stimme.“ | `ausbau_nord.js:606` | **1** | Spoiler vor der Enthüllung |

### Zu Twist 2 „Das achte Kind auf dem Foto ist ein Mädchen“
| Hinweis | Fundstelle | ab |
|---|---|---|
| Album: acht Kinder, blasses Mädchen hält deine Hand | `base:2378` | 1 |
| Polaroid-Rückseiten „Wer ist das achte Kind?“ | `base:2281` | 1 |
| Becher ohne Namen | `base:2308` | 1 |
| Fotowand Beweis 5 „Das achte Kind. Es hat sie angesehen.“ | `fotos.js:18` | 1 |
| Gruppenfoto im Amt „Partner anwesend“ | `innen_kapitel.js:195` | 2 |
| Enthüllungsmoment „Das bin nicht ich“ (Erleichterung) | – | ✗ |

### Zu Twist 3 „Das Dorf hat seine Kinder hergegeben“
| Hinweis | Fundstelle | ab |
|---|---|---|
| Mamas Brief 1 „Ich habe unterschrieben“ | `base:2388` | 1 |
| Vermessungsprotokoll „Mutter unterschreibt“ | `base:3286` | 2 |
| Vegas-Brief „Ich hab Mike unterschrieben“ | `base:3751` | 3 |
| Akte Abgrund 8 „Beobachtung statt Evakuierung“ | `akte.js:16` | 1 🔓 |
| **Enthüllung (Losurne, Dienstbuch, Einwilligungen)** | – | ✗ **fehlt** |

### Zu Twist 4 „Luke ist das achte Kind (Kopie)“
| Hinweis | Fundstelle | ab |
|---|---|---|
| Polaroid Luke: hellblaue Augen, zerkratztes Gesicht | `base:2217` | 1 |
| Familienfoto „Der Junge hat blaue Augen“ | `base:2377` | 1 |
| Spiegel: braune Augen, Spiegelbild verzögert | `innen_ort.js:355` | 1 |
| Tagebuch „Er weiß nicht mehr, wie unser Hund hieß“, „Nicht, bevor ich weiß, was er ist“ | `base:2382` | 1 |
| Echo Kinderzimmer „Wie heißt unser Hund, Luke?“ | `base:4352` | 1 |
| Keller-Zeichnungen „mit deinem Namen signiert“ | `base:2368` | 1 |
| Fotowand Beweis 5 „Meine Augen sind blau auf dem Foto“ | `fotos.js:18` | 1 |
| Verkehrtes Bild „Nicht umdrehen. Er erkennt sich sonst.“ | `innen_ort.js:290` | 1 |
| Akte 06 „Augenfarbe abweichend … Das ist nicht der Junge“ | `base:3269` | 2 |
| Laufzettel „Nr. 6 … niemand hat quittiert“ | `innen_kapitel.js:158` | 2 |
| Enthüllung: Akte 08 | `base:3476` | 2 |
| 🔓 Gedenkfeld-Echo „Für den Ersatz reicht es“ | `ausbau_nord.js:605` | **1** |
| 🔓 Stall-Brief des echten Luke „Da schläft schon einer in meinem Bett“ | `ausbau_ost_west.js:415` | **1** |
| 🔓 Akte Abgrund 3/5/9 (Kopien, Narbe, „08“) | `akte.js:11,13,17` | **1** |
| 🔓 Hofers letzte Seite „der Junge, den sie aus dem Ritter gemacht haben“ | `hungrige.js:85` | **1** |
| 🔓 Stöckchenmann „08 · L.“ | `tiefwald.js:252–255` | **1** |

### Zu Twist 5 „Wer es weiß, durch den sieht sie“
| Hinweis | Fundstelle | ab |
|---|---|---|
| Echo Archiv „Dann sieht es durch ihn“ | `base:4356` | 2 |
| Akte 08 roter Satz | `base:3476` | 2 |
| Lucy im Tank | `base:3484` | 2 |
| Funk „Er weiß es jetzt“ | `base:3646` | 3 |
| Telefon „Wer es weiß, gehört mir“ | `base:3735` | 3 |
| 🔓 Akte Abgrund 5 | `akte.js:13` | 1 |
| Enthüllung Teil 1 („Das hilft bei dir nicht, Bruder“, 3 s Perspektivwechsel) | – | ✗ |
| Enthüllung Teil 2 („durch dich geguckt“, Blitze durch Lukes Augen) | – | ✗ |

### Zu Twist 6 „Heimkehrerin = Graue = die Kleine“
| Hinweis | Fundstelle | ab |
|---|---|---|
| Kalender, Fußspuren, Stuhl-Gestalt mit Lucys Gesicht | `base:2354, 2784, 2806` | 1 |
| Graues Gesicht am Tank | `base:2893` | 2 |
| Graue-Jagd | `base:4392` | 3 |
| Kind in Raum 3 „grau wie Asche“ | `base:3909` | 3 |
| **Enthüllung (gedeckter Tisch, Polaroid)** | – | ✗ |

### Zu Twist 7 „Der echte Luke lebt und hat dich gewarnt“
| Hinweis | Fundstelle | ab |
|---|---|---|
| Eigene Kinderstimme am Telefon | `base:2433` | 1 |
| Doppelgänger mit hellblauen Augen | `base:2856` | 1 |
| Laken „geh nicht in den Keller“ | `base:2863` | 1 |
| Kinderschuh im Schrank „Nicht deiner. Nicht Lucys.“ | `base:2391` | 1 |
| Vogelscheuche mit Jacke „LUKE B.“ | `ausbau_ost_west.js:406` | 1 |
| Milchzahn „Luke, 7“ | `innen_ort.js:337` | 1 |
| Kerben-Erinnerung „kalte Hand“ | `entdecker.js:59` | 1 (60 Funde) |
| **Enthüllung (Raum 1, Schrank, Handtausch)** | – | ✗ → Hinweise laufen ins Leere |

### Zu Twist 8 „Justin ging nie hinein, er versteckt sich“
| Hinweis | Fundstelle | ab |
|---|---|---|
| 🔓 Rabe im Prolog: „Der Ritter vor seinem Kind“ | `traum.js:12` | **Minute 1** |
| Ostende-Gestalt verschwindet | `base:5252` | 1 |
| Echo Messraum „Warum weint er dann?“ | `base:4358` | 2 |
| Chronik „ritt ihm nach“ (die Lüge) | `base:3623` | 3 |
| Hilde „Frag ihn … wer den ersten Handel gemacht hat“ | `base:3880` | 3 |
| 🔓 Lichtsteine „Das Versteck … sucht den, der sich hinter der Birke versteckt“ | `geheimnisse.js:93` | 1 |
| Vegas „Er ist der Einzige, der jedes Mal aufräumt“ | `base:3751` | 3 |
| Enthüllung: Justins Geständnis (Dialog) | `base:3887–3890` | 3 |
| Kapellenfenster, Sühnevertrag, Gesangbuch, Tankstellenband, Fußspuren-Rätsel | – | ✗ |

### Neben-Stränge
| Strang | wichtigste Hinweise | Auflösung |
|---|---|---|
| Cleo | Tagebuch C. `base:2382`, Foto-Lücke `base:2378`, achter Stein `cleo.js:47`, Akte ohne Nummer `cleo.js:55`, Baumhaus `cleo.js:75` | Kreide-Ende `cleo.js:85–91` ✅ |
| Zayn/Jonas | Polaroid `base:2219`, Roboter `innen_ort.js:174`, Rucksack/Kamera `zayn.js:72`, Wolle `tiefwald.js:203–207`, Fahrtenbuch `tiefwald.js:223` | „Hast du dich an mich erinnert?“ `zayn.js:176` ✅; Weiher-Zug ✅ |
| Der Hungrige | Akte Abgrund 4 `akte.js:12`, Fotowand Beweis 7 `fotos.js:21`, 9 Stufen `hungrige.js:122–192` | Finale `hungrige.js:222–275` ✅ |
| Der Beobachter / der Neunte | Zählbuch „neun“ `base:3747`, Beobachter-Zettel `beobachter.js:29–79` | offen bis „Kap. 7“ |
| Mira | siehe §3 | offen (Kap. 4 Stimme) |
| Atlantschiss | Brunnen-Stimme `ausbau_ost_west.js:427`, Gully-Licht `base:4118` | Echos `base:4472–4475`, bewusst offen |
| Tankstelle Kranz / Benzin 2009 | `ausbau_ost_west.js:372–393` | ✗ keine Auflösung |

---

## 8. Plot-Twists – sind die Hinweise vor der Enthüllung vorhanden?

| # | Twist | Hinweise vorher | Enthüllung im Spiel | Probleme |
|---|---|---|---|---|
| 1 | Du hast sie rausgelassen | ✅ zahlreich, gut (sichtbar + hörbar) | ✅ Kap. 1 Finale, bestätigt Kap. 3 | 🔓 Gedenkfeld-Echo nennt die Lösung schon in Kap. 1; „Egal mit welcher Stimme“ fehlt; Hildes Umdeutung („Ich wollte dich festhalten“) fehlt |
| 2 | Achtes Kind = Mädchen | ✅ | ◐ nur optional (Gruppenfoto Amt) | Erleichterungs-Beat fehlt → Twist 4 trifft weniger |
| 3 | Dorf hat Kinder hergegeben | ◐ | ✗ | Zimmer 7 fehlt; Laternenfolge wird deshalb per Funk **vorgesagt** statt hergeleitet |
| 4 | Luke = Kopie | ✅ sehr viele | ✅ Akte 08 | 🔓 mindestens 6 Fundstellen verraten es schon in Kap. 1; Du-Seite/„Hundename“-Satz fehlt |
| 5 | Durch dich sieht sie | ✅ | ◐ Lucy sagt es; Kind sagt „Du hast ihn mitgebracht“ | Perspektivwechsel und „durch dich geguckt“ fehlen → moralische Last der Wahl fehlt |
| 6 | Heimkehrerin = Graue = Kleine | ◐ | ✗ | gedeckter Tisch fehlt komplett |
| 7 | Echter Luke lebt | ✅ viele | ✗ | Hinweise laufen ins Leere; Stall-Brief widerspricht Kanon |
| 8 | Justin versteckt sich | ✅ | ◐ Geständnis per Monolog (Raum 2) | Prolog verrät es in Minute 1; Deduktionsrätsel (Fußspuren) fehlt; „UFO = Laterne“ fehlt, Wappen-Notiz behauptet sogar „Rüstung eines Kindes“ (`geheimnisse.js:101`) |
| – | Kapitel-6-Twist (zwei Raben) | ✅ Whiskey-Lore, Hofer | ✅ | kann vor Justins Begegnung passieren, Luke zitiert dann Justin (`hungrige.js:267`) ⚠ |

---

## 9. Beantwortete vs. offene Fragen

**Im Spiel beantwortet**
- Was ist mit Lucy am 23.10. passiert? (Handy, Tank, Tonband)
- Wer hat angerufen? (die Kleine, Kap. 3 Telefon)
- Was ist das Amt? (Akten, Akte Abgrund, Fallwand `base:4560`)
- Wer ist Luke? (Akte 08)
- Warum sieht Luke Echos? (Nachhall/Narbe `gedanken.js:66–67`, Hofers Seite)
- Wer ist der Ritter, was hat er getan? (Raum 2)
- Warum wurde Cleo vergessen? (Regel 11)
- Was geschah mit Zayn? (im Licht geblieben; Weiher)
- Was ist der Hungrige? (Hofer, Finale)

**Bewusst offen (gut)**
- Wie heißt die Kleine? · Wer ist Mira, wann kommt sie? · Was ist der Beobachter (Kap. 7)? · Wer spielt in Atlantschiss? · Wer zieht am Weiher?

**Unbeabsichtigt offen / Lücken**
- Wo ist Lucy in Kapitel 3 (Tank leer `base:3495`)?
- Wo ist der echte Luke, und warum schreibt er aus dem Stall Briefe (`ausbau_ost_west.js:415`)?
- Wer hat 2009 sieben Gräber mit † 28.07.2009 aufgestellt, obwohl sechs Kinder zurückkamen (`ausbau_nord.js:293–299, 601`)?
- Wer hebt Lukes Grab aus („zwei Männer vom Amt“, 2026, obwohl das Amt 2012 aufgelöst wurde – gewollt als „Kind spielt Amt“, aber nie so benannt)?
- Was war mit dem Benzin-Jungen vom 31.10.2009 und dem Foto „von morgen“ (`ausbau_ost_west.js:372–380`)?
- Was wird aus Jonas (nach 2016)? Hilde erwähnt ihren zweiten Sohn nie.
- Wer ist der Pfarrer, der „1992 in den Nebel gegangen“ ist (`albers.js:20`)?
- Wie verarbeitet Luke Peters Tod (nach Kap. 2 kein Wort mehr)?
- Warum schreibt ein Kind 2013 „08 · L.“ an den Stöckchenmann (Jonas kannte die Aktennummer nicht)?
- Warum „Kapitel 6“, wenn Kapitel 5 fehlt – und warum kann Kapitel 6 vor Kapitel 2 stattfinden?

---

## 10. Kapitelzusammenfassungen (Spielstand)

### Prolog · Der Traum (`traum.js`)
Luke schläft am Ortsschild, träumt die leere Straße, der Rabe gibt ihm die Fibel und den Auftrag. Aufwachen im Regen. **Einzige echte Kinosequenz des Spiels.** Problem: der Rabe verrät die Grundwahrheit (Twist 8) und deutet Twist 4 an („siebzehn Jahre geschlafen“).

### Kapitel 1 · Das Haus Nummer 7 (Grundspiel + alle Welt-Module)
Dramatischer Zweck: Ankunft, Suche, Schuld (Twist 1). Atmosphäre: Regen, Laternen, Kerzen an Polaroids, Kreidepfeile – sehr dicht. Neue Info: Lucy verschwunden, „das ist nicht Lucy“, sieben Kinder 2009, acht auf dem Foto, 17-Jahres-Zyklus (Chronik liegt erst in Kap. 3, aber Gedenkfeld/Grab/Einmachgläser zeigen ihn). Neue Fragen: Wer ist das achte Kind? Was bin ich? Emotion: Heimkehr → Unbehagen → Schuld. Ende: Hilde wird hochgerissen, dann nahtlos zurück in den Keller – **kein Kapitelabschluss, keine Kinosequenz**. Das Versteckspiel vor dem Suchlicht fehlt.

### Kapitel 2 · Das achte Kind (Amt, linear)
Zweck: Verschwörung + Identitätsbruch. Atmosphäre: Rost, Neon, Lautsprecher-Kind. Eskalation: Rätsel → Spinnen → Jagd → Feuer/Rauch → Akte 08 → Gesicht am Tank. Neue Info: Akten, Ersatz, Lucy lebt, „Wer es weiß …“. Emotion: Hoffnung → Grauen → Schuld (Peter) → Bruch. Ende: Schwarzblende, Tank leer, Leiter – **keine Kinosequenz**. Fehlend: Zimmer 7, Zelle, Erleichterungs-Beat, Perspektivwechsel.

### Kapitel 3 · Das Licht
Zweck (Kanon): Regeln benutzen, Lucy zurückholen, alle Twists stapeln. Im Spiel: Kuh, Justin, Telefon, Geheimnisse, Funk sagt die Lösung, Laternen, Jagd, drei weiße Räume, Wahl A/B. Neue Info: Stimme = die Kleine, Justins Schuld, Luke aus Justins Blut. Emotion: sollte Trauer/Entschlossenheit sein – ist eher „abarbeiten“, weil Lucy fehlt und die großen persönlichen Begegnungen (Mama, echter Luke, Heimkehrerin) fehlen. Ende: Dialog + Wahl-Overlay + Weißblende + Textkarte – **keine Kinosequenz**. Ende C fehlt.

### Kapitel 4 · Die Villa (`anwesen.js`)
Zweck: Nachspiel + Mira-Ankündigung. Inhalt: Schlüsselteile/Nest, Presse, Halle, Brief, Porträt, Stimme. Kurz (≈10–20 Min.), ohne Gefahr, ohne neue Frage außer „Wer ist oben?“. Ende: Untertitel + Textkarte – **keine Kinosequenz**.

### Kapitel 5
Nicht vorhanden (Kanon: frei für Miras Rückkehr).

### „Kapitel 6“ · Der Hungrige (`hungrige.js`, `tiefwald.js`, `wald.js`)
Zweck: neues Wesen, Luke als „wandelnder Abdruck“, Whiskey = Miras Licht. Eskalation sehr gut (Reh rückwärts → Krähe „Großer“ → Fuchs → Fraßstelle → Hirsch → Funk → Silhouette → Hofer → Bau → zwei Raben). Ende: Skript-Sequenz mit gelenktem Blick, kein Letterbox, dann nur ein Hinweis-Popup „KAPITEL 6“. Strukturell eine Nebenaufgabe, die ab Kapitel 1 spielbar ist.

---

## 11. Widerspruchs- und Logikliste (kompakt)

1. ⚠ **Prolog-Spoiler** „Der Ritter vor seinem Kind“ `traum.js:12`.
2. ⚠ **Spoiler-Lecks in Kap. 1** (offene Welt): `ausbau_nord.js:603–606`, `ausbau_ost_west.js:415`, `akte.js:11,13,17`, `hungrige.js:85, 267, 272`, `geheimnisse.js:93, 101`, `tiefwald.js:252–255`.
3. ⚠ **Zeit**: Welt-Uhr Kap. 1 startet 02:47, Glocke 03:00/03:13 `leben.js:896–903` vs. Kanon Kap. 1 23:00–01:00 und Kap. 3 „Es ist 03:13“ `base:4081`.
4. ⚠ Chronik-Aushang „Lucy B., 24“ `base:3619` (richtig: 26).
5. ⚠ Glockenmuster: Kanon 3 + 13 Schläge; Spiel 3 Schläge um 03:00 + 7½ um 03:13 `leben.js:897`; Kapellen-Schreck „einmal … noch einmal“ `schrecken.js:28`.
6. ⚠ Justin „Das Weiße spuckt mich aus / nicht meine Zeit“ `base:3788, 3889` vs. Kanon (lebt am Rand des Weißen, versteckt sich freiwillig).
7. ⚠ Zahn-Mann beißt tödlich `tod.js:3, 133–165` vs. Kanon „beißt nicht“, Akte 7 „sucht keine Opfer“ `akte.js:15`.
8. ⚠ Peters Feuertod (neu) ist nicht in `story_final.md` und hat keine Folgen in Kap. 3/4.
9. ⚠ Lucy verschwindet zwischen Kap. 2 und Ende B ohne Erklärung `base:3495 → 3962`.
10. ⚠ Echter Luke schläft laut Stall-Brief im Pferdestall `ausbau_ost_west.js:415` vs. Kanon (im Weißen).
11. ⚠ Gedenkfeld mit sieben † 28.07.2009 `ausbau_nord.js:293–301` – unerklärt, widerspricht Kanon-Friedhof (kleine Gräber alle 17 Jahre, „Da fehlt eins“).
12. ⚠ Gedenkfeld-Echo: Kind mit Lukes Gesicht **und** Spieluhr unter der Stimme `ausbau_nord.js:606` bricht die Tonregel (Spieluhr = die Kleine, echter Luke = keine Spieluhr).
13. ⚠ Wappen-Notiz „Was da vom Himmel fällt … die Rüstung eines Kindes“ `geheimnisse.js:101` vs. Kanon „UFO = ihre Laterne“.
14. ⚠ Luke „drei Tage zu spät“ `base:3269, 3286, 3747` – Heidi kam 3.8. 04:45, Luke 5.8. 03:13 (≈2 Tage).
15. ⚠ Kühlschrankzettel verrät die Code-Regel `base:2352` (Kanon-Regel: Lösung nie in der Notiz) und verliert „Egal mit welcher Stimme“.
16. ⚠ Zwei verschiedene Abzählreime: Kerben-Reim `entdecker.js:8–11` vs. Kanon-Reim `kanon:731–737` (letzterer fehlt im Spiel).
17. ⚠ Hungrige-Finale zitiert Justin `hungrige.js:267`, auch wenn man ihn noch nie getroffen hat; „KAPITEL 6“-Popup kann in Kap. 1 erscheinen `hungrige.js:272`.
18. ⚠ Modulkopf Vegas „hinter ihm knurrt Bruno“ `albers.js:3` vs. Bruno verschwunden (Text in Zeile 45 ist korrekt).
19. ◐ Sperr-Aushang 13.07.1992 `ausbau_ost_west.js:400` vs. Akte Abgrund 8 (Sperre 2009 „Unwetterwarnung“) – vereinbar, aber nie verbunden.
20. ◐ Tankstelle „Kranz/Opas“ vs. Kanon (Mikes Nachtschicht, seit Frühjahr zu); Mikes Schichtbuch und Band fehlen.
21. ◐ Beobachter-Zettel „WENN DU EINE KOPIE BIST“ `beobachter.js:37` erscheint in Kap. 2 schon **vor** Akte 08.
22. ◐ Kapitel 4 wird nach Ende A mit „setzt Ende B fort“ angeboten `anwesen.js:305` – ehrlich markiert, macht Ende A aber zur Sackgasse.
23. ◐ Tod durch die Gezählten „Sie haben dich mitgezählt“ `tod.js:15` ist gut – aber „Eisen ist Freimal“ fehlt, obwohl die Jagd dafür gebaut ist.
24. ◐ Die in Kap. 1 frei zugängliche Akte Abgrund Nr. 9 liegt am Hochsitz im tiefen Wald und nennt „08“ + Narbe `akte.js:17`.
