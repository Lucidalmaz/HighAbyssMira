# High Abyss Mira – Was im Spiel steckt, die ganze Geschichte und was noch fehlt

Stand: 29.09.2026, mitten in Welle 2 (Kapitelumsetzung). Dieses Dokument ist **zum Bearbeiten** gedacht.

**So benutzt du es**
- **Teil A** listet, was das Spiel enthält. Hier musst du nichts tun, außer du willst etwas streichen oder ändern.
- **Teil B** ist der komplette Plot, so wie er jetzt gilt. Schreib unter jedes **✏️ DEINE ÄNDERUNGEN:** einfach hinein, was anders werden soll – Stichworte reichen. Du kannst auch direkt im Text streichen oder umschreiben.
- **Teil C** sind meine Vorschläge für mehr Grusel und A+++-Gefühl. Kreuze an (`[x]`), was du willst, und streich, was du nicht willst.
- Schick mir die Datei (oder sag „ist bearbeitet“). Ich arbeite dann Dialoge, Geschichte und Quests final ein, erst danach wird das Spiel fertig gebaut, auf den Desktop gelegt und auf GitHub gesichert.

**Legende:** ✅ im Spiel und getestet · 🔨 wird gerade gebaut (Welle 2) · 📋 geplant (Welle 3) · ❓ Entscheidung von dir nötig

---

# Teil A – Was das Spiel enthält

## A1 · Eckdaten
- **Genre:** Horror-Mystery, Ego-Perspektive, Erkunden, Rätsel, Schleichen, Flucht. Vorbild-Niveau: Silent Hill 2, P.T., Resident Evil 7, Return of the Obra Dinn, Alan Wake 2 – ohne zu kopieren.
- **Sprache:** komplett Deutsch (Texte, Notizen, Untertitel). Keine Sprachausgabe (siehe Vorschlag C1).
- **Technik:** Three.js (WebGL) als eigenständige Windows-App (Electron). Kein Browser nötig.
- **Umfang:** Prolog + **6 Kapitel**, drei Enden in Kapitel 3 (A, B, C), Kapitel 4–6 setzen Ende B fort. Kapitel 7 ist als Fortsetzung angelegt (Beobachter, Mira).
- **Aufbau im Code:** Grundspiel plus **41 Module** (Welt, Figuren, Kapitel, Systeme), alles aus echten, lizenzierten Scans und Modellen (Fab/Megascans, 47 Werke mit Namensnennung in `CREDITS.md`).

## A2 · Die Spielwelt
**Oberwelt Lost Eyengless** ✅
- **Ahornstraße (Ortskern):** Häuser Nr. 1–9, davon begehbar **Nr. 1** (Elternhaus Brandt), **Nr. 7** (Hilde + Keller). Kreuzung mit Funkkasten, Telefonzelle, Gully. Ortsschild „Einwohner 214“ (zählt die Nacht mit: 211 → 210). Lucys Auto an der Südsperre.
- **Kirchberg (Nord):** Kapelle St. Martin, Friedhof mit den kleinen Gräbern und dem Gedenkfeld, Spielplatz, Bushaltestelle, Pfarrhaus, Praxis Seiler, Haus mit dem Kinderfahrrad.
- **Landstraße Ost:** alte Tankstelle, Schrottplatz mit den weißen Amts-Transportern, gesperrte Straße mit den weiß verbrannten Fluchtautos.
- **West:** Schrebergärten (Roxys Laube, Hildes Laube, Vogelscheuche, Brunnen), Hof mit Scheune, Stall und Traktor, **Villa Seiler**.
- **Forbidden Dustwoods** (hinter dem Spielplatz) und **tiefer Wald** 🔨 (ab Kapitel 6): dicht bewachsen und lebendig – Unterholz, Moos, Laub, Pilze, Efeu, umgestürzte Stämme, Wind, Eulen, Rehe, Hirsch, Fuchs, Wölfe, Wildschweine. Hochsitz, überwucherter Amtsbus, Steinkreis, Weiher ohne Grund, Autowrack, der Bau, Zayns Hütte, Cleos Baumhaus, eine Schaukel, die nicht stillhält.

**Unter der Erde und im Weißen** ✅/🔨
- **Amt für Rückführung, Ebene −2:** Tunnel, Archiv, **Zimmer 7** 🔨, Sicherungsraum, Planungsraum mit Modelldorf, Prüfraum/Peters Zelle, langer Gang, Messraum mit acht Stühlen, Klavier und Tank.
- **Das Weiße:** Raum 1 (Kinderzimmer 28.7.2009), Raum 2 (Hildes Küche), Raum 3 (die Nacht von 1312 🔨 → der Hohe Abgrund mit der riesigen Laterne 🔨).
- **Versunkene Kanalstadt Atlantschiss** unter dem Gully (optional).
- **Villa Seiler innen:** Eingangshalle, Porträt, eingebrochene Treppe.

## A3 · Die Kapitel und ihr Stand
| Kapitel | Titel | Zeit | Stand |
|---|---|---|---|
| Prolog | Der Traum vom Raben | Nacht auf den 4.11. | ✅ (Zeile des Raben wird geändert 🔨) |
| 1 | Das Haus Nummer 7 | Mi 4.11.2026, 23:04–01:00 | ✅ Grundfassung · 🔨 fairer Kellercode, HASENBROT im Tagebuch, Kinosequenz K1 |
| 2 | Das achte Kind | Do 5.11., 01:04–03:13 | ✅ Grundfassung, Feuer/Rauch/Tod · 🔨 Zimmer 7, Peters Zelle, Feuer Pflicht, „Augen zu“ im Finale, K2 |
| 3 | Das Licht | Do 5.11., 03:13 bis Morgengrauen | ✅ Grundfassung · 🔨 Lucys Auto, Funk mit zwei Lucys, Laternen herleiten, Nacht von 1312, Ende C, K3A/B/C |
| 4 | Die Villa Seiler | Do 5.11., 07:40–09:30 | ✅ Grundfassung · 🔨 Rauch aus dem Gully, K4, Übergang zu Kapitel 5 |
| 5 | Der gedeckte Tisch | Do 5.11., 18:10–23:40 | 🔨 komplett neu |
| 6 | Der Hungrige | Fr 6.11., 02:10–05:40 | ✅ Hungriger, Wald, Beobachter · 🔨 als echtes Kapitel mit Sperren, Stille-Zonen, Epilog, K6 |

Schon fertig aus Welle 2: **Kapitel-Rückgrat** ✅ (sechs Kapitel in Menü, Spielstand und „Weiterspielen“) und **Weltuhr/Glocke** ✅ (Uhrzeit und Glockenschläge je Kapitel, 3 + 13 nur in Kapitel 3).

## A4 · Figuren und Wesen (alle mit eigenem Aussehen, echte Bewegungsaufnahmen)
- **Familie & Dorf:** Luke (Spieler, nie von vorn zu sehen), Lucy (erwachsen und als Kind), der echte Luke (blaue Augen, für immer neun), Mama (als Nachhall), Hilde Wendt (lebend und als Nachhall), Lars Vegas mit Hund Bruno, Dina, Frau Aydın, Daniel Lorenz, Gefreiter Hofer, zwei Männer vom Amt.
- **Die Kinder von 2009:** Roxy, Lucy, Mike, Dina, Heidi, Luke, Zayn, Cleo.
- **Das Übernatürliche:** die Kleine (Kind im Licht), **die Graue**, **die Gezählten** (bleiche Kinder), **Justin** (der Ritter), **Peter Kranz / der Zahn-Mann**, **der Hungrige** (Wendigo: Reh, Krähe, Fuchs, Hirsch, Wolf, nackte fleischige Tierformen, wahre Gestalt „Hirschding“), **der Beobachter** (kleiner weißer Außerirdischer, leicht unheimlich), **Whiskey** (Rabe, Miras Rabe) und sein falscher Doppelgänger.
- **Tiere:** Kühe, Krähen, Rehe, Hirsch, Fuchs, Wölfe mit Welpe, Wildschweine, Eulen, Bruno.

## A5 · Nebenaufgaben und Sammelsysteme
- **Kapitel 1:** Das alte Zuhause · Bruno · Lucys Auto · Die Sieben (Polaroids mit Kerzen) · Der Anruf · Dina in der Scheune · Post für Heidi · Der Mann hinter den Brettern · Nachtschicht (Tankstelle) · Roxys Laube · geheimes Ende 0 „Fahr heim“.
- **Kapitel 2:** Partner-Sichtungen (Registratur) · Kantine · Gründungsakte 1958 · Modelldorf · Stuhl 8 (Klingensplitter) · Vermessungsbogen.
- **Kapitel 3:** Kapelle (Vegas' Schlüssel, Kapellenfenster, Sühnevertrag, Gesangbuch, Glockenseil-Joker) · Vegas' Brief · Seilers Villa (Stammbaum, drei Tonbänder) · Band der Tankstelle · Das eigene Grab · Sommerfest-Echo · Kanalstadt · Dinas Karte.
- **Durch alle Kapitel:**
  - **Versprochen ist versprochen** (Zayn, 5 Schritte).
  - **Cleo, die Vergessene** (Baumhaus, Kreide-Ende).
  - **Whiskey** (Stationen, Nest mit übersehenen Schlüsselteilen).
  - **Die Villa** (8 Schlüsselteile 01–08).
  - **Akte Abgrund** (10 Durchschläge von Dr. Edda Brand).
  - **Entdecker** (17 Kerben mit dem Abzählreim, Belohnungsstufen bis zu Lukes frühester Erinnerung).
  - **Lichtsteine** (7).
  - **Der Beobachter:** 24 wandernde Zettel (Hilfen, Rätsel, Fragen, Batterien) und 19 Orts-Zettel als Erkundungsbelohnung; Belohnung: drei Batterien und eine milchweiße Murmel.
  - **Indizienwände:** Hildes Wand im Keller und Lucys Pinnwand, 8 dokumentarische Fotos mit Datum, Ort, Quelle und Hinweis.
- **Kapitel 6 / Wald:** Die Lichtung · Die Schlinge (Welpe, Jonas' Taschenmesser) · Der rote Faden (5 Zettel von Jonas) · Die Rotte · Der Hungrige (9 Stufen + die Nackten).
- **Ränder** 📋 (Welle 3): 25 versteckte Meta-Notizen („— lw“ / „LW“), in sieben Phasen von unheimlich bis paranoid, nur mit der Taschenlampe im Streiflicht oder aus bestimmten Winkeln zu finden. Keine Tricks mit deinem PC, keine falschen Behauptungen über deine Daten.

## A6 · Rätsel (alle mit Hilfeleiter, keine Lösung steht in der Notiz dazu)
Kellercode 3110 · Dina (Licht aus, dem Summen folgen) · Daniel (keine Fragen stellen) · Heidis Karten ordnen · Ordnungstafel · Registratur 1958/1975/1992/2009 · Lights-Out 2-3-4-5 · Klavier E D C H C · Funkfrequenz 31,10 · Welche Lucy ist echt (HASENBROT an Kanal B) · Laternen 5 → 3 → 1 → 7 (aus Zählbuch und Einwilligungen herleiten) · Raum 1 „Was gehört nicht in diese Nacht?“ · Raum 2 Küchenuhr 03:13 · Raum 3 „Eine Erinnerung lügt“ (Fußspuren) · Kapitel 5: der gedeckte Tisch, die Schleife, nicht hinsehen, Schlafenszeit · Kapitel 6: Gitter, roter Faden, Feuerzeug im Bau.

## A7 · Spielmechaniken
- **Taschenlampe** (drei Stufen, Akku, Batterien, Aussetzer), **Feuerzeug** (Peters, „– M.“).
- **Augen zu** (Q halten; Bild schwarz, Ton bleibt) 🔨, **Polaroid-Kamera** (C, nur Kapitel 5, 3 Bilder, das Foto zeigt die Wahrheit) 🔨.
- **Dialoge mit Auswahl**, „In den Staub schreiben“ (Wortwahl), Verstecken vor dem Licht, Schleichen, Klettern, Gitter aufbiegen (E halten), Ölfass umwerfen, Öl anzünden.
- **Abenteuerfibel** (Tab): Aufgaben, Funde, Lore, **Du-Seite** (Lukes Steckbrief, Gedanken werden später durchgestrichen), **Fallwand** (Fragen mit Antworten statt Textwänden).
- **Nachhall/Echos:** Geisterszenen am Ort des Geschehens (entsättigt, flimmernd, echte Gesichter).
- **Tod und Neustart** ✅: realistische Todesanimationen (Peters Umarmung ohne Biss 🔨, Ersticken im Rauch, „Essen“ in Kapitel 5 🔨), Speicherpunkte je Kapitel.
- **Feuer- und Rauchszene** im langen Gang ✅: Fass rollt, Öl läuft aus, Inferno mit Filmsequenz und Musik, 30 Sekunden Rauchflucht mit Notentriegelung.

## A8 · Technik und Präsentation
- **Licht (Welle 1)** ✅: Jedes Licht hat eine Quelle, zurückhaltende Nachbearbeitung, Helligkeits-Testbild beim ersten Start, gemeinsames Schatten-Hauptlicht in Innenräumen, bildratenunabhängiges Flackern, Mondschatten, physikalische Taschenlampe mit Glühbirnen-, LED- und Lampenfarbe, nasse Straßen, Fensterglas mit Spiegelung.
- **Ton (Welle 1)** ✅: räumlicher Klang mit vier Faltungshallen je nach Raum, Verdeckung durch Wände, Schritte je nach Boden, **Spannungs-Regie** (verteilt Schrecken mit Atempausen, Stille als Werkzeug, Totenstille an den Fraßstellen), adaptive Musikzustände.
- **Oberfläche** ✅: hochwertiges Horror-Design für Menü, Notizen, Rätsel, Fibel; Texte bleiben lange genug stehen; einheitlicher Look (gedämpfte Farben, kalte Schwärzen, Filmkorn).
- **Einstellungen** ✅: Maus, Lautstärke, Musik, Helligkeit + Kalibrierung, Sichtfeld, Untertitelgröße, Maus invertieren, Kopfbewegung, Grafikqualität, Steuerung (Gehen, Rennen, Springen).
- **Spielstand** ✅: Version 2 mit automatischer Umwandlung alter Stände, Kapitelmenü, Weiterspielen.
- **Leistung** (ehrlich): im Schnitt 64–99 FPS je Gebiet, aber **einzelne Ruckler unter 60 FPS** an Kirche, Villa, Hof und Schrebergärten; **Ladezeit ca. 74 s**; Spielgröße ca. 5 GB. Alles drei geht Welle 3 an (Ziel: nie unter 60 FPS, Ladezeit deutlich kürzer, ca. 2,2–2,6 GB ohne Qualitätsverlust). 📋

## A9 · Was noch aussteht (Fahrplan)
- **Welle 2 🔨:** Kinosequenzen · Kapitel 1-Feinschliff · Zimmer 7 · Peter/Augen zu/Finale · Kapitel 3 Straße · Das Weiße & Ende C · Kapitel 4-Ende · Kapitel 5 · Kapitel 6 · Sperren & Welttexte.
- **Welle 3 📋:** Ränder (Meta-Notizen) · Figuren-/Tier-Feinschliff · Leistung (kein Bild über 16,7 ms) · Verkleinern · Credits im Spiel · kompletter Durchlauf Kapitel 1–6 · Abnahme · fertige Spieldatei auf dem Desktop + GitHub.

---

# Teil B – Die ganze Geschichte

## B1 · In einem Satz
Ein junger Mann kehrt nach Lost Eyengless zurück, um seine verschwundene Zwillingsschwester zu suchen, und entdeckt, dass er selbst vor siebzehn Jahren von einem Licht „zurückgegeben“ wurde – einem Licht, das seit 1312 mit dem Dorf Verstecken spielt, weil ein Ritter sich vor seiner eigenen Tochter versteckt.

**Die Kernfrage:** „Wer ist das achte Kind?“ – Die Antwort ändert sich dreimal (ein fremdes Kind → ein Mädchen, das nie altert → „ich“).
**Die Frage darunter:** Darf man jemanden lieben, der nicht der ist, für den man ihn gehalten hat? (Lucy & Luke, Mama & Luke, Hilde & Zayn, Justin & die Kleine.)

✏️ DEINE ÄNDERUNGEN:

## B2 · Die Vorgeschichte (1312 → 2026)
- **1312, Vorabend von St. Martin:** In die Senke hinter dem Hof des Ritters **Justin** fällt ein weißes Licht. Justin schneidet sich die linke Hand am Schwert, seine Tochter (**die Kleine**, 7) wischt lachend das Blut ab: „Jetzt hab ich dich an mir.“ Sie spielen Verstecken, er zählt bis **siebzehn**, sie versteckt sich im Leuchten.
- **11.11.1312, 03:13:** Sie ist fort und ruft „Such mich, Papa.“ Justin geht bis zum Rand – und keinen Schritt weiter. Aus Angst schickt er **sieben Dorfkinder mit Laternen** hinein: „Sieben für meine eine.“
- Vier Tage später kommen sieben Kinder zurück. Eines ist eine **Kopie aus Justins Blut** (braune Augen); das Original behält die Kleine als Spielkameraden. Sie selbst kommt nie zurück – **das Licht ist zu ihr geworden**.
- **1313:** Sühnevertrag („… bis dass er die Seine selbst suche und finde“), Kapelle St. Martin, aus der Tat wird das **Laternenfest**. **Alle 17 Jahre** zählt die Kleine zu Ende und sucht ihren Vater; Justin versteckt sich in Eisen am Rand des Weißen, wo er nicht altert, und führt die zurückgegebenen Kinder heim. Jedes Mal behält sie eins und legt eine Kopie in seine Hand.
- **1941:** Theodor Seiler (7) kommt als er selbst zurück und erinnert sich. **1958** gründet er unter dem heutigen Haus Nr. 7 die „Außenstelle“ des **Amts für Rückführung**: Gib dem Licht eine **Liste** vermessener, von den Eltern „eingewilligter“ Kinder, dann nimmt es nur diese.
- **1975:** Unter den Sieben: Lars Vegas, Hilde Sommer (später Wendt), Marion Kranz (Lukes Mutter) und ihr Bruder **Peter Kranz** – er kommt als Kopie zurück. Schlagzeile „UFO über dem Abgrund“ (von Seiler lanciert).
- **1992:** Peter liest seine Akte und **weiß es**. Das Licht gibt ihn „nacherzählt“ zurück – als Gesicht aus Zähnen. Das Amt sperrt ihn auf Ebene −2 ein. In derselben Nacht holt Bergungstrupp 3 etwas aus der Senke, das mit Hofers Gesicht zurückkommt: **der Hungrige**.
- **5.5.2000:** Luke und Lucy Brandt, Zwillinge; Lucy nennt ihn „Großer“. Hund: **Flocke**.
- **Juli 2009:** Losziehung in Zimmer 7 – Hilde zieht die Kugel ihres eigenen Sohnes **Zayn**. Alle Eltern unterschreiben, Mama zweimal angesetzt. **27.7. Sommerfest:** Ein blasses Mädchen fragt „Darf ich mitspielen?“ – nur der echte Luke sagt „Klar.“ Deshalb behält sie ihn.
- **28.7.2009, 23:40:** Die Sieben verschwinden barfuß. Rückkehr einzeln; am **5.8., 03:13** führt Justin einen Jungen heim – unterwegs hat die Kleine die Hand des echten Luke aus seiner genommen und **die Kopie hineingelegt**. Zayn kommt nie. Mama merkt es am ersten Morgen (braune Augen, kennt den Hund nicht) und liebt ihn trotzdem.
- **2010–2012:** Papa geht, Roxy zündet ihr Elternhaus an, Mama geht **2011** mit einer Laterne in die Senke, um den echten Luke zu holen, und bleibt bei ihm. Das Amt wird **2012** aufgelöst. Hilde behält die Schlüssel und zählt jede Nacht.
- **2026, Zyklusjahr, ohne Liste:** Die Kleine holt ihre Spielkameraden von 2009 zurück, **in der Reihenfolge, in der man sie hergegeben hat**, und bläst vor jedem Haus die Laterne aus: Roxy (Juni, Nr. 5), Mike (12.7., Nr. 3), Lucy (23.10., Nr. 1). Lucy ruft Luke vorher **elfmal** an – er geht nicht ran. Hilde versteckt Lucy im Tank unter der Erde; am 31.10. klopft „Lucy“ an Hildes Tür – die Kleine in Lucys Gestalt. Hilde sperrt sie im Keller auf den Gurtstuhl. Die Gestalt übt Lucys Stimme und ruft am 4.11. Luke an: „Haus Nummer 7. Der Keller.“

✏️ DEINE ÄNDERUNGEN:

## B3 · Die Regeln des Lichts (Kinderspiele als Naturgesetze)
1. **Verstecken bis siebzehn.** Das Spiel ist erst aus, wenn alle gefunden sind.
2. **Laternelaufen.** Brennende Laternen sind ihre Augen. Sie bläst die Laterne vor dem Haus aus, dessen Kind sie holt. Sind alle aus, muss sie herunterkommen.
3. **Ochs am Berg.** Die Graue bewegt sich nur, wenn niemand hinsieht.
4. **Augen zu.** Wer die Augen zu hat, den sieht sie nicht – außer ihre eigenen Kinder, sobald sie wissen, was sie sind.
5. **Stille Post.** Sie ahmt jede gehörte Stimme nach, aber nie ein Wort, das nie laut gesagt wurde (HASENBROT). Unter ihren Stimmen läuft Lucys Spieluhr.
6. **Aus.** Unter der Erde wird nicht gespielt.
7. **Eisen ist Freimal.** Hufeisen über den Türen, Justins Rüstung.
8. **Die Kette.** Wer aus dem Weißen kommt, braucht eine Hand. Wer loslässt, bleibt.
9. **Wer einmal drin war, den findet sie wieder** – auch sein Blut.
10. **Wer es weiß, durch den sieht sie.**
11. **Geschenkt ist geschenkt, wiederholen ist gestohlen.** Wer sich selbst verschenkt, wird vergessen (Cleo).
12. **Wer mitisst, bleibt über Nacht.** (Kapitel 5)

**03:13** ist der Augenblick, in dem Justin 1312 „siebzehn“ rief. Die Glocke schlägt in Zyklusnächten **drei, Pause, dreizehn**.

✏️ DEINE ÄNDERUNGEN:

## B4 · Der Plot, Kapitel für Kapitel

### Prolog – Der Traum vom Raben
Nach Lucys Anruf fährt Luke die ganze Nacht und schläft am Ortsschild im Auto ein. Er träumt von der leeren Straße im Nebel. Ein Rabe (**Whiskey**) landet auf der Laterne: Lucy ist nicht verschwunden, sie hat sich versteckt – „In dieser Stadt versteckt sich jeder vor irgendwem. Die Kinder vor dem Licht. Die Eltern vor dem, was sie unterschrieben haben.“ Der Rabe gibt ihm die **Abenteuerfibel** zurück (das Kinderheft von Luke, Jonas und Zayn). Luke wacht im Regen mitten auf der Straße auf, schlafwandelnd wie die Kinder um 03:13.

✏️ DEINE ÄNDERUNGEN:

### Kapitel 1 – Das Haus Nummer 7 (4.11., 23:04–01:00)
1. **Ankunft:** weiße Kreidepfeile in Kinderschrift; am Ostende eine Gestalt in Eisen, die die Laterne über sich ausdreht (Justin).
2. **Nr. 7:** Im Wohnzimmer brennt Licht, niemand bewegt sich. Im Briefkasten Lucys Schlüssel und Zettel („Hör das Band, dann fahr heim. Hinter den Bildern ist eine Tür. Mach sie NICHT auf.“).
3. **Im Haus:** Zeitung, Fernseher „HALLO LUKE“, Kalender „31.: SIE IST ZURÜCK. ABER DAS IST NICHT LUCY.“ / „3.: Sie übt Lucys Stimme.“
4. **Küche:** Kühlschrankzettel „KELLER BLEIBT ZU. Egal wer ruft. Egal mit welcher Stimme.“ – **Schreck:** Hilde packt Lukes linke Hand mit der Narbe: „**Nicht du.**“ Licht aus, sie ist fort. Barfüßige Spuren mit fremdem Gras enden an der Kellertür – **von innen**.
5. **Kellertür:** Hinter der Stahltür weint „Lucy“ (mit leiser Spieluhr darunter). Code **3110**, herleitbar aus den abgegriffenen Tasten und dem umkreisten 31. im Kalender.
6. **Keller:** Gurtstuhl mit geschlossenen Gurten – leer. Zeichnungswand „LUKE, 9“ (das Innere des Weißen). „SIE NEHMEN NUR DIE, DIE SCHON MAL WEG WAREN.“
7. **Tonband** mit Lucys echter Stimme („Wir waren weg. Sieben Kinder. Ich. Und du auch.“). Im Flackern sitzt „Lucy“ festgeschnallt da und flüstert „… danke, Luke …“ – danach sind **die Gurte offen**.
8. **Oben:** Stromausfall, die Laternen gehen von Ost nach West aus, die „Scheibe“ zieht über die Dächer, in ihrem Kegel flackert es wie eine Kerze, Papier raschelt.
9. **Finale:** Hilde auf der Straße: „**Du hast sie rausgelassen!**“ – der Strahl reißt sie an Lukes Gesicht vorbei nach oben.
10. **Verstecken** vor dem suchenden Licht zurück in den Keller. → **Kinosequenz K1 „Du hast sie rausgelassen“** (Polaroid von Zayn fällt vom Himmel, das Ortsschild zeigt nun 210).
- **Nebenwege:** alle Nebenaufgaben aus A5, darunter das Laken-Gespenst („geh nicht in den Keller“), die Telefonzelle („Da unten ist nicht Lucy“ – Lukes eigene Kinderstimme), „NICHT SIE“ auf der Heckscheibe, Dina mit Augenbinde („Augen zu, dann sieht sie dich nicht“).
- **Geheimes Ende 0:** Wer vor dem Tonband den Bus um 05:40 nimmt, fährt heim – und steht am 11.11. um 03:13 barfuß auf.
- **Enthüllung:** Der Anruf kam von dem, was Hilde eingesperrt hatte. **Luke hat es befreit.** (Twist 1)

✏️ DEINE ÄNDERUNGEN:

### Kapitel 2 – Das achte Kind (5.11., 01:04–03:13, Amt Ebene −2)
1. **Tunnel:** Kinderhandabdrücke, von unten summt Lucy – ohne Spieluhr: „Das ist sie.“ Ein Nadeldrucker protokolliert Luke live („Ersatz 08 betritt Ebene −2“).
2. **Archiv:** Akten 01–07, **Ordnungstafel**. Belohnung: Vermessungsprotokoll mit Sommerfest-Foto, das Mädchen rot umkreist, „PARTNER ANWESEND“ – Luke atmet aus: „**Das bin nicht ich.**“ (Twist 2, Erleichterung). Dazu der Schlüssel zu Zimmer 7.
3. **Zimmer 7 (Hildes Büro)** 🔨: Losurne mit sieben verkohlten Kugeln (zweimal BRANDT, L.), Dienstbuch („Gott, er ist sieben.“, Mama „hat zweimal angesetzt“, „Das Brot für den Jungen im Stall liegt in der Laube“), Aushang **Einwilligungen 2009** zum Mitnehmen, Gründungsnotiz 1958. **Twist 3: Das Dorf hat seine Kinder hergegeben.**
4. **Sicherungsraum:** Lights-Out, Notstrom. Die Lautsprecherstimme (die Kleine spielt „Amt“) kichert am Satzende.
5. **Prüfraum = Peters Zelle:** Spinnenschwarm, dann die Tafel „Original: starke Spinnenangst / Rückkehrer 08: keine Reaktion. Lacht.“, an allen Wänden „ICH WEISS ES JETZT“. **Peters Feuerzeug** auf der Matratze („Damit du im Dunkeln nicht allein bist. – M.“) ist Pflicht.
6. **Der lange Gang:** Der Zahn-Mann (**Onkel Peter**) jagt Luke. Die Brandschutztür ist zu. Am Ende das **Ölfass**: umwerfen, Peter stürzt ins Öl, Feuerzeug – **Inferno** mit Filmsequenz. Fängt Peter Luke vorher, hält er ihn fest, sagt „**Bruder.**“ und Luke erstickt (kein Biss). Danach Brandalarm, Notentriegelung, **30 Sekunden Rauchflucht**. „Ich hab ihn angezündet. Mamas Bruder. Mit dem Feuerzeug, das sie ihm geschenkt hat.“
7. **Messraum:** acht Stühle, das achte leer; im Tank **Lucy**. Klavier **E D C H C** (Lucy summt mit, die Tasten beschlagen).
8. **Akte 08:** „Rückkehrer 08 (Amtsbegriff: Ersatz) … Augen braun (Original: blau). Kennt Hundenamen nicht. Er darf es nie erfahren. Sonst sieht sie durch ihn.“ **Twist 4: Luke ist das achte Kind.**
9. **Lucy (Dialog):** „Ich hab nie gewusst, wie der Hund hieß.“ – „Flocke. … Hey, Großer.“ / „**Du bist nicht der, mit dem ich geboren wurde. Du bist der, mit dem ich groß geworden bin. Das ist mehr.**“
10. **Finale:** Im Tankglas presst sich das graue Gesicht genau in Lukes gespiegelte Augen. Lucy: „Mach die Augen zu!“ – erste „Augen zu“-Taste – im Dunkeln, fast zärtlich: „**Das hilft bei dir nicht, Bruder. Ich seh ja durch dich.**“ (Twist 5) → **K2 „Ich seh ja durch dich“** (drei Sekunden durch ihre Augen, der leere Tank, „PAPA + ICH“ an Stuhl 8, die Glocke beginnt).

✏️ DEINE ÄNDERUNGEN:

### Kapitel 3 – Das Licht (5.11., 03:13 bis Morgengrauen)
1. **Intro:** Luke erwacht auf der Kreuzung. Glocke 3 + 13, am Ohr: „… siebzehn. **Ich komme!**“ Alle Laternen springen an. Luke: „Sie hat mich elfmal angerufen. Diesmal geh ich ran.“
2. **Blinde Kuh:** Eine Kuh fällt vom Himmel, augenlos, sieben Kreise und ein halber achter eingebrannt.
3. **Telefon:** „Das war nicht Lucy, Bruder. Das war ich. **Du hast mich freigeschlagen. Danke.**“
4. **Justin** tritt aus der Lichtsäule: „Ich bin Justin. Ritter vom Hohen Abgrund.“ Er riecht den Rauch: „Er war auch einer von meinen.“ Auftrag: **Nimm ihr die Lampen, dann muss sie herunter.** „Zu wem?“ – „Zu meiner Tochter.“ Die Straße hinaus führt zurück hinein.
5. **Lucys Auto** 🔨: Motor läuft, Radio auf 31,10, auf der Heckscheibe von innen „GROSSER“, darunter halb weggewischt „HASEN…“, blaue Kreispfeile zum Funkkasten. „Lucy. Sie ist halb hier.“
6. **Hildes Zählbuch:** „Es sind immer acht. Vegas zählt sieben.“ / „23.10.: Neun. … Eins ist ganz klein. Keins von unseren.“ / die Laternendaten / „Notfunk auf dem Tag, an dem SIE kam.“
7. **Funk: Zwei Lucys** 🔨: Auf Kanal A und B flüstern zwei Lucys „Großer?“. Hund? Beide: „Flocke.“ Unser Wort? A: „Hasen … sag du es zuerst.“ B: „Schreib's.“ Luke schreibt **HASENBROT** in den Staub, sendet an B: „Da bist du.“ Die echte Lucy gibt die Regel, nicht die Lösung.
8. **Laternen löschen 5 → 3 → 1 → 7**, hergeleitet aus Zählbuch und Einwilligungen, während **die Graue** jagt (erwischt sie Luke, geht eine Laterne wieder an). An jeder Laterne das Echo der Unterschrift – Mama setzt zweimal an.
9. **Die Gezählten** wollen seine Hand; Eisen ist Freimal. Justin: „Nimm meine Hand. Wer loslässt, bleibt im Weißen.“
10. **Raum 1 (Kinderzimmer 28.7.2009):** Rätsel Geburtstagskarte. Der Schrank steht einen Spalt offen, drinnen atmet ein Kind – leuchtet Luke hinein, ist er leer. Justin: „Sieh nicht so genau hin.“
11. **Raum 2 (Hildes Küche):** Hilde, jetzt als Auswahl-Dialog: „Ich wollte dich festhalten, Junge. Du warst schneller.“ / „Frag ihn, **warum er sich versteckt**.“ Küchenuhr 03:13, „Zähl für mich weiter.“
12. **Raum 3, Teil 1 – Die Nacht von 1312** 🔨: eingefrorene Wiese, Birken, stillstehende Fackeln, sieben Kinder mit Laternen. Justin erzählt, er sei hineingegangen. **„Eine Erinnerung lügt“**: Seine Stiefel- und Hufspuren **enden am Rand**. Justin kniet: „Ich bin nie hineingegangen. Ich hatte Angst. Also habe ich bezahlt. Mit ihren Kindern.“ – Luke: „Du hast dich versteckt. Siebenhundert Jahre lang.“ (Twist 8)
13. **Raum 3, Teil 2 – Der Hohe Abgrund** 🔨: acht Stühle, Lucy flackert auf einem, darüber die **riesige Papierlaterne** – „Das war nie ein UFO. Das ist ihre Laterne.“ Die Kleine: „… Papa? **Gefunden.**“ / „Ich hab dich gemacht. Aus seinem Blut an meinen Händen. **Ich hab die ganze Nacht durch dich geguckt.**“ Justin nimmt den Helm ab – im Visier spiegeln sich Lukes braune Augen, in seiner Hand dieselbe Narbe. „Ein Stück von Papa ist noch draußen.“ – Justin: „**Was will sie?**“
14. **Die Wahl:**
    - **A „Das Siegel“:** „Dich. Dein Blut.“ – Luke nimmt Justins Hand. Morgengrauen, die Barfüßigen auf der Kreuzung, ein Schwert im Asphalt, Lucy zählt acht.
    - **B „Die Regel“:** „Den Handel.“ – Justin geht allein hinab. Lucy ist wieder da, aber in ihren Augen ist manchmal nur Weiß. Polaroid mit der Rückseite **2043**. *(Kapitel 4–6 setzen hier an.)*
    - **C „Such mich“** 🔨 (nur mit ≥ 3 Versteck-Hinweisen): „Dass du sie suchst.“ – Justin legt das Eisen ab, zählt bis siebzehn und sucht sie zwischen den Birken. „Danke, **Luke**.“ Auf dem Ortsschild steht „ALLE“.
    → je Ende eine eigene Kinosequenz (K3A/K3B/K3C).

✏️ DEINE ÄNDERUNGEN:

### Kapitel 4 – Die Villa Seiler (5.11., 07:40–09:30, setzt Ende B fort)
1. **Morgen:** Der Strom ist zurück, die Laternen sind aus. Aus dem Gully an der Kreuzung steigt Rauch, er riecht nach Heizöl – „Der Gang brennt noch.“ Lucy schläft bei Vegas. Oben in der Villa brennt ein einziges Fenster.
2. **Peters Grab** ist über Nacht eingesunken, frisch in Kinderschrift: „HEIM.“ – „Onkel Peter. Ich hab dich heimgeschickt.“
3. **Die acht Schlüsselteile** (01–08, dort, wo sich die Kinder versteckten; übersehene hat Whiskey im Nest gesammelt) → **Prägepresse** im Garten (braucht den Strom) → die Tür mit den acht Schlüssellöchern.
4. **Die Halle:** Seilers Brief, Akte Abgrund 10, eine Uhr auf 03:13, das **Porträt** einer Frau mit Laterne, deren Flamme gerade steht: „… IRA“, gemalt **2043**. Die eingebrochene Treppe, oben atmendes Licht, ein Teddy auf der vierten Stufe, drei kleine Schritte.
5. Eine Frauenstimme, weit weg und ganz nah: „**Noch nicht, Luke. Aber bald.**“ → **K4 „Noch nicht“** (im Dachfenster steht kurz eine kerzengerade, kalt-weiße Flamme; Whiskey landet auf dem Giebel) → Endkarte: „Am Abend brennt auch in eurem Elternhaus Licht.“ → weiter zu Kapitel 5.

✏️ DEINE ÄNDERUNGEN:

### Kapitel 5 – Der gedeckte Tisch (5.11., 18:10–23:40) 🔨
1. **Veranda Nr. 3:** Vegas durch den Türspalt: Lucy friert „bei zweiundzwanzig Grad“ und fragt nach Flocke. Lucy klopft ans Fenster, malt ihren blauen Kreispfeil: „Wo mir was fehlt, ist es weiß. Sie hat noch ein Stück von mir.“ / „Ich koch nie. Das war Mama.“ / „Wenn dich heute einer zum Essen ruft, der nicht ich bin: **Iss nichts.**“
2. **Nr. 7:** Hildes **Polaroid-Kamera** („Die Kamera lügt nicht. Menschen schon. – H.“), drei Bilder. Im Briefkasten drei Briefe von **Jonas** aus Hamburg – er lebt und kommt am Samstag.
3. **Das erste Foto:** Lucy am Fenster – auf dem Polaroid liegt **eine kleine graue Hand** auf ihrer Schulter. „Dann spielt sie noch mit mir.“
4. **Licht in Nr. 1**, zum ersten Mal seit 2011. Hinter dem Küchenfenster deckt eine Frau mit Lucys Haaren den Tisch – obwohl Lucy bei Vegas schläft.
5. **Der gedeckte Tisch:** Die **Heimkehrerin** mit Lucys Gesicht, das Lächeln zu breit: „Da bist du ja, Bruder. Setz dich. Ich hab gekocht.“ Vier Gedecke: Papas Platz (Zinnbecher, Brot), Mamas Platz (Kerze, schwarze Feder: „Mama kommt noch. Sie bringt das Licht mit.“), Lukes Teller (nasses Gras und ein Milchzahn), Lucys Häschenteller („Meiner.“). **Wer isst, stirbt** („Jetzt bleibst du über Nacht.“). Vor der Kamera versteckt sie ihr Gesicht.
6. **Die Schleife:** Der Weg zum Kinderzimmer führt immer wieder in die Küche. Auf dem Familienfoto verblasst der Junge Runde für Runde, die Spieluhr leiert, ein Nachhall von Mama 2011 („Ich hol ihn.“). Runde 3: Atem direkt hinter dir – **umdrehen und abdrücken**.
7. **Das Foto (Twist 6):** Im Flur hinter Luke ein Mädchen in Lucys Sommerkleid, grau, große schwarze Augen, kein Mund. „Jetzt weißt du's. Wir tragen beide ein geliehenes Gesicht, Bruder. **Warum darfst du bleiben und ich nicht?**“ Im Dunkeln findet Luke **Mamas Kerze**. „Das war sie. Die ganze Zeit.“
8. **Die Spieluhr** im Kinderzimmer – Lucys Spieluhr, das Stück von Lucy, das die Kleine behalten hat. „Das ist MEINS!“ Die Graue jagt Luke zur Kreuzung, wo Lucy mit weißen Augen steht. Lucy zieht die Spieluhr auf – das Weiß weicht: „Großer. … Da bist du. Sie hat jetzt keine Spieluhr mehr unter der Stimme. Pass auf, wem du glaubst.“
9. **Die Telefonzelle:** eine Kinderstimme ohne Spieluhr: „Komm in den Stall. Bring Brot. Und guck mich nicht an.“ – „Das war … ich. Als Kind.“ Lucy: Hilde hat dem Jungen im Stall seit 2009 jeden Abend Brot hingestellt.
10. **Der Stall:** Kreidestriche, „AUGEN ZU“ ins Brett geritzt. Brot hinlegen, **Augen zu halten**. Im Dunkeln eine kleine kalte Hand. **Der echte Luke (Twist 7):** „Der Eisenmann hatte mich an der Hand. Sie hat meine Hand aus seiner genommen. Und deine reingelegt.“ / Mama kam 2011 mit einer Laterne und ist geblieben, damit er nicht allein ist. / „**War es schön? Mein Leben?**“
11. **Augen auf:** „Augen auf, Bruder.“ – Lukes Augen öffnen sich von selbst. Der Junge sieht ihn an, entsetzt, und rennt. „Da ist er ja.“ – „Ich hab ihn angesehen.“ (Verrat)
12. **Dem Tappen nach** durch Gärten, am Hof vorbei, zweimal um die Villa – die Glocke schlägt elf.
13. **Das Bett (Friedhof):** Kerzen auf den sieben Kindergräbern, fünf Gezählte (Ochs am Berg), am offenen Grab mit Lukes Namen die Kleine mit dem echten Luke an der Hand: „Schlafenszeit, Bruder. Du legst dich rein. Dann darf er nach Hause. Tausch.“ Sie pustet jedes Licht aus – außer **Mamas Kerze mit Peters Feuerzeug**: Die Flamme wird kerzengerade und kalt-weiß, weit weg flammt das Villafenster auf. „… Mama? Mama, ich war gar nicht böse.“ Sie läuft zur Villa und wird zu Nebel.
14. **Kein Echo:** Der Junge flieht durch die Lücke im Absperrgitter in den Wald: „Im Wald findet sie keinen! Der hat kein Echo!“ Luke ruft seinen Namen – nichts kommt zurück. Lucy mit Vegas' Sturmlaterne: „Großer. **Komm heim.**“ → **K5 „Kein Echo“** (zwischen den Bäumen etwas Hohes, dessen Kopf sich ohne den Hals dreht).

✏️ DEINE ÄNDERUNGEN:

### Kapitel 6 – Der Hungrige (6.11., 02:10–05:40) 🔨
1. **Intro:** Lucy schläft, diesmal ganz. Luke nicht. In der Jacke: Peters Feuerzeug, Mamas Kerze, die Lampe. „Hinter dem Spielplatz sitzt ein Junge mit deinem Namen in einem Wald, der kein Echo hat.“
2. **Akt I – Der Wald lebt:** Gitter aufbiegen, kleine nackte Fußspuren, **Brotkrumen** („damit er zurückfindet“). Ein Reh geht rückwärts. Eine Krähe sagt „Großer“ – und frisst die Krumen. Ein Fuchs mit verdrehtem Kopf.
3. **Akt II – Zayns Hütte:** weiches Kerzenwachs, eine Kinderdecke, kleine Handabdrücke zum eingedrückten Zaun. Jonas' **roter Faden** (vierzig Suchen nach seinem Bruder, 2009–2016).
4. **Akt III – Tiefer Wald:** Hochsitz (Akte 9) mit einem **nackten Reh**, Amtsbus mit Fahrtenbuch und einem **Wolf ohne Fell**, der jedes Mal näher liegt, wenn man wegsieht. Die **Fraßstelle** (Hofers Dienstbuch Seite 1) – hier ist der Wald **totenstill**: keine Tiere, kein Hall. „Hier ist es still. Nicht leise. Still.“ Hirsch-Angriff, der einen Meter vor Luke stoppt. Heulen, das zu **Funk von 1992** wird. Die Silhouette, die im Lampenlicht zu Nebel wird. **Gefreiter Hofer** zwischen den Bäumen – der Kopf dreht sich, der Körper nicht.
5. **Akt IV – Der Bau:** Autowrack („Die Frau mit der Laterne – Sie kommt noch.“), Tierschädel auf dem Pfahl, Hofers letzte Seite: „Es ist mit meinem Gesicht zurückgekommen. Ich schreibe das mit seiner Hand.“ Lukes Lampe stirbt – **das Feuerzeug**: „Damit du im Dunkeln nicht allein bist.“ **Zwei Whiskeys** landen. „Der linke atmet nicht.“ Der falsche verdreht den Kopf, die Federn fallen, er wird zu rohem Fleisch – **das Hirschding** steigt heraus. Der echte Whiskey stößt dreimal herab, sein Licht wird kalt und gerade wie Mamas Kerze – ein Blitz wie bei Tag, der Hungrige flieht. „Er hat ihn vertrieben. Nicht ich – er.“
6. **Epilog – Der Hochsitz:** Whiskey fliegt voraus. Oben schläft der echte Luke. **Augen zu.** „Du bist mir nachgekommen. Das hat noch keiner.“ / „Wenn ich heimgeh, musst du gehen. **Einer von uns ist immer übrig.**“ Luke legt ihm seine Jacke um: „Meine Jacke hängt an der Vogelscheuche. Jetzt hab ich deine. Gerecht.“ → **K6 „Der Morgen“** (der Pfahl am Bau ist leer, der Schädel fort, ein Reh ruft – zu langsam) → „Am Samstag kommt Jonas. HIGH ABYSS MIRA · FORTSETZUNG FOLGT“.
- **Enthüllungen:** Der Hungrige frisst den **Nachhall** (deshalb ist die Kleine im Wald blind). Hofer war seit 1992 der Hungrige. Whiskey trägt **Miras Licht**. Der achte Stöckchenmann „08 · L.“ ist vom echten Luke.

✏️ DEINE ÄNDERUNGEN:

### Ausblick Kapitel 7+ (noch nicht gebaut)
- **Der Beobachter:** gut oder böse? Was sammelt er? Warum war er „der Neunte“ in Hildes Zählung? („Ich habe dich nicht gerettet. Ich habe nur zugesehen. Frag dich, warum.“)
- **Mira**, Justins Frau, die Retterin aus der Zukunft (Porträt 2043, das kalt-weiße Licht, „Noch nicht, Luke. Aber bald.“).
- Wen nennt die Kleine „Mama“? Was wird aus dem Jungen mit Lukes Namen? „Einer von uns ist immer übrig.“
- Jonas kommt am Samstag. Die Kanalstadt: „Sie ist nicht die Einzige, die spielt.“

✏️ DEINE IDEEN FÜR KAPITEL 7:

## B5 · Die Twists auf einen Blick
| # | Twist | Kapitel |
|---|---|---|
| 1 | Du hast sie rausgelassen (Hilde war die Wächterin) | 1 |
| 2 | Das achte Kind auf dem Foto ist ein Mädchen, das nie altert | 2 |
| 3 | Das Dorf hat seine Kinder hergegeben (Los, Unterschriften) | 2 |
| 4 | Luke ist das achte Kind – die Kopie | 2 |
| 5 | „Ich seh ja durch dich“ – Luke ist ihr Fenster | 2 → 3 |
| 8 | Justin ging nie hinein, er versteckt sich seit 714 Jahren; das UFO ist ihre Laterne | 3 |
| 6 | Heimkehrerin = Graue = die Kleine mit Lucys Gesicht | 5 |
| 7 | Der echte Luke lebt, der Tausch war ein Handtausch; Mama ist bei ihm | 5 |
| – | Hofer ist der Hungrige; Whiskey trägt Miras Licht | 6 |

✏️ DEINE ÄNDERUNGEN:

## B6 · Die wichtigsten Figuren (Kurzfassung)
- **Luke Brandt (26):** Tontechniker, Nachtschicht, spricht wenig, nach jeder großen Enthüllung genau einen Satz. Seine eine echte Schuld: die elf Anrufe.
- **Lucy Brandt (26):** das Herz der Geschichte. Sagt „Großer“ und „heim“, nie „Luke“ und „nach Hause“. Hat ihn gewählt, obwohl sie es wusste.
- **Die Kleine:** keine Bösewichtin – ein Kind mit der Macht eines Himmels. Zählt, summt, kichert, schreit nie.
- **Justin:** scheinbarer Retter, tatsächlich Ursprung. Sagt „Knabe“, nie „Luke“ – außer in Ende C.
- **Hilde Wendt:** Zählerin des Amts, die das Los ihres Sohnes zog, und Wächterin des Kellers.
- **Der echte Luke:** für immer neun, blaue Augen, stiller Warner.
- **Mama (Marion):** unterschrieb und liebte trotzdem, ging 2011 ins Weiße.
- **Lars Vegas:** unterschrieb für seinen Enkel Mike, zählte 2009 sieben.
- **Peter Kranz:** Mamas Bruder, Kopie von 1975, der Zahn-Mann – Lukes Zukunft, wenn er es weiß.
- **Daniel Lorenz:** Kopie von 1992, hat nie gefragt – Lukes Zukunft, wenn er es nicht weiß.
- **Der Hungrige**, **der Beobachter**, **Whiskey**, **Jonas**, **Cleo**, **Zayn**, **Dina**, **Hofer**, **Seiler**, **Edda Brand**.

✏️ DEINE ÄNDERUNGEN:

## B7 · Offene Entscheidungen ❓
Bitte jeweils ankreuzen oder eigene Antwort schreiben. Was du nicht beantwortest, bleibt wie es ist (jeweils die erste Option).

**Neu aufgefallen beim Zusammenstellen:**
1. **Mama in Raum 1 (Kapitel 3):** In der alten Fassung sitzt Mama am Bett und sagt „Ich bin gekommen, um ihn zu holen.“ Das verrät Kapitel 5 vorzeitig.
   - [ ] a) Mama bleibt in Raum 1, sagt aber nur „Wie hieß unser Hund?“ und „Du hast es gelernt.“ (kein Hinweis auf den echten Luke) **– Empfehlung**
   - [ ] b) Mama erscheint in Raum 1 gar nicht, erst in Kapitel 5
2. **Die Polaroid-Kamera:** Die ältere Fassung von Kapitel 1 benutzt sie schon (Foto vom Gurtstuhl, Spiegel usw.), der neue Plan gibt sie **nur in Kapitel 5**. Im Spiel ist sie derzeit nur für Kapitel 5 vorgesehen.
   - [ ] a) nur Kapitel 5 (stärker, weil neu und besonders) **– Empfehlung**
   - [ ] b) schon ab Kapitel 1 mit wenig Film, in Kapitel 5 wird sie zur Hauptmechanik
3. **Kapitel 4 ist das kürzeste Kapitel** (Schlüsselteile, Presse, Halle, Stimme).
   - [ ] a) so lassen – eine ruhige Atempause zwischen zwei starken Kapiteln
   - [ ] b) ausbauen: ein eigenes Rätsel in Seilers Krankenzimmer mit den drei Tonbändern und ein großer Schreckmoment in der Halle **– Empfehlung**
4. **„— M.“** auf dem Feuerzeug (Marion oder Mira) – bleibt bewusst offen?
   - [ ] a) ja, offen bis Kapitel 7   - [ ] b) in Kapitel 6 auflösen

**Aus der Story-Bibel (noch offen):**
5. Kapitel 3 spielt im echten Dorf am Rand des Weißen (a) · in einer Puppenstube (b) · Mischform (c)
6. Das „wahre“ Ende C: „Such mich“ (a) · „Alle frei“ (b) · „Der Tausch“ (c)
7. Mamas Hoffnung: kommt in Ende A/C heim (a) · erkennt Luke nicht (b) · Verbleib offen (c)
8. Luke spricht wenig (a) · mehr Dialogauswahl schon in Kapitel 1 (b) · anderer Beruf (c)
9. Mike als Vegas' Enkel: ja (a) · nein (b)
10. Kamerafilm begrenzt (a) · unbegrenzt mit langer Entwicklungszeit (b) · nur an Wahrheitsorten (c)
11. Daniel Lorenz behalten (a) · streichen (b)
12. Härte bei Kuh und Zahn-Mann: wie jetzt (a) · mehr Andeutung, weniger Gore (b)
13. Fortsetzungshaken: andere Lichter (a) · Zentrale des Amts (b) · beides (c)

✏️ DEINE ANTWORTEN / WEITERE ÄNDERUNGEN:

---

# Teil C – Was dem Spiel noch fehlt: Vorschläge für mehr Grusel und A+++

Sortiert nach Wirkung. Aufwand: **S** klein · **M** mittel · **L** groß. Kreuze an, was ich einbauen soll.

## C1 · Die größten Sprünge Richtung A+++
- [ ] **Sprachausgabe (deutsche Stimmen)** – L. Der größte Unterschied zwischen „sehr gutes Indie-Spiel“ und A+++: Lucys geflüsterte Stimme hinter der Stahltür, die Spieluhr **unter** der Stimme der Kleinen, Justins Eisenstimme. Ohne Stimmen funktioniert die wichtigste Regel des Spiels (Stille Post, „Keine Spieluhr darunter“) nur über Untertitel. Möglich mit echten Sprecherinnen/Sprechern oder hochwertiger Sprachsynthese – das entscheidest du (Kosten und Rechte).
- [ ] **Eigene Musik mit Leitmotiv** – M/L. Lucys Lied (E D C H C) als roter Faden: als Spieluhr, als Cello bei der Erleichterung, verstimmt in der Schleife, rückwärts im Weißen. Die adaptive Musiksteuerung ist schon da, ihr fehlen komponierte Stücke.
- [ ] **Ladezeit drastisch kürzen** – M. Heute ca. 74 s. Ziel: unter 20 s bis zum Menü, Kapitel im Hintergrund nachladen. Steht in Welle 3.
- [ ] **Nie unter 60 FPS** – M. Die Ruckler an Kirche, Villa, Hof und Schrebergärten beseitigen. Steht in Welle 3 (Pflicht aus deinem Master-Prompt).
- [ ] **Gamepad-Unterstützung mit Vibration** – S/M. Gibt es noch nicht. Herzschlag in der Hand bei der Grauen, Vibration beim Tod – sehr wirkungsvoll.
- [ ] **Gegenstände in 3D untersuchen** – M. Wie bei Resident Evil: Feuerzeug drehen und die Gravur finden, das Polaroid umdrehen und die Rückseite lesen. Manche Hinweise stecken dann *im* Gegenstand statt im Text.
- [ ] **Hände im Bild** – M. Luke hält sichtbar Lampe, Feuerzeug, Kamera, Brief. Braucht ein lizenziertes Arm-Modell von Fab.

## C2 · Grusel-Design (passt genau zum Thema „Verstecken“)
- [ ] **Sich selbst verstecken** – M. Das ganze Spiel ist Verstecken, aber Luke kann sich nirgends verstecken. Schränke, unter Betten, hinter Lauben: in Kapitel 1 (suchendes Licht) und Kapitel 3 (die Graue). Dazu Atem anhalten (Taste halten), während sie vorbeigeht.
- [ ] **Die Welt merkt sich Dinge** – S/M. Türen, die du zugemacht hast, stehen beim Zurückkommen offen; der Teddy sitzt woanders; auf einem Foto an der Wand hat sich jemand umgedreht. Ochs am Berg für die ganze Welt, sparsam dosiert von der Spannungs-Regie.
- [ ] **Die Kleine reagiert auf dein Verhalten** – M. Wer lange stillsteht, hört sie zählen („… elf … zwölf …“). Wer oft die Lampe ausmacht, bekommt einen Beobachter-Zettel dazu. Wer rennt, hört Kinderschritte, die mitrennen.
- [ ] **Stille-Momente als Schreck** – S. An drei festen Stellen fällt **der gesamte Ton** für 4–6 Sekunden aus (auch Regen und Wind), dann ein einziges Geräusch ganz nah.
- [ ] **Falsche Sicherheit** – S. Ein Speicherort, der sich einmal (und nur einmal) als unsicher erweist: Die Kerze geht aus, während du speicherst.
- [ ] **Speichern als Ritual** – S. Statt automatisch: an Hildes Kerzen speichern (Kerze anzünden). Passt zu „Laternen, damit die Kinder heimfinden“ und gibt Sicherheit ein Bild.
- [ ] **Spiegel und Fotos** – S. Spiegel, in denen Luke eine halbe Sekunde zu spät reagiert (nur in Kapitel 2 und 5, sehr selten).
- [ ] **Mehr Nachhall-Szenen im Ort** – M. Jedes Haus hat ein kleines Echo aus 2009 (heute gibt es sie an wichtigen Orten).

## C3 · Komfort und Standard, den A+++-Spiele haben
- [ ] **Karte in der Fibel** – M. Handgezeichnet, füllt sich beim Erkunden, Lucy/Hilde/Kleine markieren Orte in ihren Farben (blaue Pfeile, Kerzen, weiße Kreide).
- [ ] **Erfolge mit deutschen Namen** – S („Klar.“, „Kein Echo“, „Einer von uns ist immer übrig“).
- [ ] **Neues Spiel+** – M. Zweiter Durchlauf mit zusätzlichen Beobachter-Zetteln, anderen Schrecken und den Rändern.
- [ ] **Credits-Szene** – S (steht in Welle 3): Namensnennung aller Fab-Autorinnen und -Autoren als ruhige Abspannfahrt über das Dorf im Morgengrauen.
- [ ] **Titelbildschirm als lebende Szene** – S. Das Menü zeigt die Kreuzung bei Nacht, die Telefonzelle klingelt manchmal.
- [ ] **Weitere Einstellungen** – S. Textgeschwindigkeit, Untertitel-Hintergrund, Hinweise an/aus (Rätselhilfe), Bewegungsunschärfe/Kopfbewegung, Farbfehlsichtigkeit.
- [ ] **Englische Fassung** – L (später).

## C4 · Story-Vorschläge
- [ ] **Kapitel 4 aufwerten** (siehe B7, Frage 3): ein Rätsel mit Seilers drei Tonbändern und ein großer Schreck in der Halle – damit jedes Kapitel einen Höhepunkt hat.
- [ ] **Jonas als Figur** – M. Er kommt „am Samstag“. Ein kurzer Epilog nach Kapitel 6 oder der Anfang von Kapitel 7 mit ihm am Briefkasten von Nr. 7 wäre ein sehr menschlicher Abschluss.
- [ ] **Entscheidungen, die nachwirken** – M. Kleine Folgen früherer Entscheidungen in späteren Kapiteln (z. B. ob Mama in Raum 1 „Flocke“ gehört hat, ob Cleos Name auf dem Stein steht, ob der Welpe befreit ist).
- [ ] **Der Beobachter bekommt eine Szene in Kapitel 6** – S. Ein einziges Mal steht er offen da und sieht zu, wie Whiskey den Hungrigen vertreibt – dann ist er weg. Bereitet Kapitel 7 vor.
- [ ] **Lucys Tonband 2** – S. Ein zweites, kurzes Band in Kapitel 5 in Nr. 1 mit Lucys echter Stimme, aufgenommen vor dem 23.10. („Falls du das hörst, Großer, dann …“).

✏️ WEITERE WÜNSCHE / DEINE EIGENEN IDEEN:
