# F3 · Grusel und Spannung im Vergleich mit A+++-Titeln (Q-7)

Stand 30.09.2026 · Grundlage: `story_final.md` (Fassung 3: Kern, Entscheidungen, Prolog, Kapitel 1–6, „Umsetzung für Claude Code“ 5.2/5.5/5.6/Test-Checkliste, Dossier 85 §10) und die Systeme `spannung.js`, `schrecken.js`, `klang.js`, `tod.js`, `feuer.js`, `hungrige.js`, `beobachter.js`, dazu Basis (`FLASH`, `hunt`, `dir`) und `F3_extras.md`.
Diese Datei ändert nichts. Sie schlägt vor. **Teil A** (ohne Handlungsänderung) kann in die Kapitel-APs (AP-14 … AP-24) und AP-26 einfließen. **Teil B** (mit Handlungsänderung) braucht die Entscheidung des Autors.
Vergleichstitel dienen nur als Prinzip-Quelle, nichts wird kopiert.

---

## 1 · Kurzbefund

- **Auf A+++-Niveau oder darüber:** die sechs Kinosequenzen (Hilde im Strahl mit sechs Sekunden Stille und der Träne nach oben; „Ich seh ja durch dich“, wenn „Augen zu“ versagt; das erzwungene Blinzeln; die Flurschleife „Runde drei“; „Zwei Raben“), das Regelwerk „Lunas Spielregeln“ (zeigen → erleben → benutzen → erklären), die Spieluhr als hörbares Erkennungszeichen, emotionale Fallhöhe (Peter, Hilde, der echte Luke), Umgebung als Erzähler (Nr. 9, Villa, Zeichnungswand) und der Fragen-Antworten-Sog je Kapitel. Das ist die Liga von P.T., Silent Hill 2 Remake und Signalis.
- **Deutlich darunter:** Es gibt **keinen dauerhaften Jäger**, der den Spieler zwischen den Höhepunkten wirklich bedroht. Außer in Kapitel 2 (Peter, Rauch) und Kapitel 5 (Essen) kann Luke praktisch nicht scheitern: Das Licht hebt ihn nur hoch, das Graukind zündet eine Laterne wieder an, die Behaltenen setzen die Runde zurück, die LWO führt ihn höflich am Ellenbogen weg, der Wendigo tritt nur in einmaligen Skript-Momenten auf. Der Spieler lernt spätestens in Kapitel 3: „Mir passiert nichts.“ Ab da kippt Grauen in Zuschauen.
- **Weitere Lücken:** Ressourcen sind zu großzügig (Batterien vom Beobachter, Speicherpunkt nach fast jedem Teilerfolg); der Rhythmus „Schreck → Lacher“ ist vorhersagbar (nach vier von sechs Höhepunkten löst ein Vogel-Gag); erzählende Untertitel nehmen dem Spieler das Erschrecken ab („Hinter dir. Ein Atem. Klein. Kalt.“); der Beobachter wird durch Dauergeräusch und niedliche Zettel zum Maskottchen statt zum Nackenhaar-Gefühl; Zufallsschrecken der Basis (`dir`, `schrecken.js`) sind generisch (Geige-Stinger, „Laternenmann“ mit beliebigem Gesicht) und passen nicht zum Kanon.
- **Fazit:** Story und Höhepunkte müssen kaum angefasst werden. Was fehlt, ist die **Zeit zwischen den Höhepunkten**: Präsenz, Verletzlichkeit, Folgen, Dynamik. Das lässt sich fast vollständig ohne Handlungsänderung beheben (Teil A und Abschnitt 5).

---

## 2 · Vergleichsraster

Bewertung 1–5: „HAM“ = Fassung 3 wie geschrieben plus vorhandene Systeme; „Ref.“ = Niveau des genannten Titels.

| Kriterium | HAM | Ref. | Begründung aus konkreten Szenen |
|---|---|---|---|
| Grundbedrohung / Präsenz eines Jägers | 2 | 5 (RE7 Jack, RE2R Mr. X, Amnesia: The Bunker) | Nur Kap. 2 hat einen Verfolger (Zahn-Mann, ein Gang). Graukind jagt nur in Kap. 3 (Straße) und kurz in Kap. 5, ohne echte Folge. Kap. 4: „keiner jagt Luke“. Kap. 6: Wendigo nur in `HUNGRIGE_FOLGE`, jede Stufe einmal, nie freie Jagd. |
| Verletzlichkeit, Ressourcen (Licht, Batterien, Speichern) | 2 | 5 (Amnesia: The Bunker, RE Madhouse) | `FLASH.charge` existiert, aber der Beobachter legt Batterien „im Dreieck“, sobald die Lampe müde wird (B-K2-03 mit Prozentzahl). Speicherpunkt nach jeder gelöschten Laterne (Kap. 3), SP5-1 bis SP5-7, SP6-1 bis SP6-5. |
| Ungewissheit, Regelbrüche | 4 | 5 (P.T., Signalis) | Stark: „Augen zu“ versagt (Kap. 2), Blinzeln ohne Taste (Kap. 3), „Ja, Luke.“ auf dem Band. Abzug: Regeln werden oft doppelt erklärt (Zettel + Justin + Lukes Gedanke, z. B. HASENBROT: B-K3-H2, Justin, Fibel). |
| Grauen (Dread) statt Jumpscares | 4 | 5 (Silent Hill 2 Remake, P.T.) | Die Bibel verbietet Stinger an den richtigen Stellen. Der Code nicht: `scareSound('scream')` bei jedem Graukind-Kontakt (Basis `greyCaught`, `k5_gefangen`, `tod.js`), Geige-Stinger bei jeder Zufallsgestalt (`schrecken.js`). Widerspricht 02 H4 „Luna schreit nie“. |
| Tempo-Kurve, Atempausen | 3 | 5 (Alan Wake 2, RE4R) | Budget je Kapitel sauber (nie zwei Dreier). Aber die Atempause ist fast immer ein Lacher, und nach Höhepunkten fast immer vom Raben (Kap. 2 „Scheiße!“, Kap. 3 Pling, Kap. 4 Pling, Kap. 6 „Bedauerlich.“). Der Spieler lernt: Vogel-Gag = sicher. Keine „falsche Sicherheit“. |
| Sounddesign, Stille | 4 | 5 (Amnesia, Visage, SH2R) | Spieluhr unter geliehenen Stimmen, 50-Hz-Brummen, Stille-Zonen, Kindergeräusche ohne Kinder: erstklassig. Abzug: Untertitel erzählen Geräusche nach; Beobachter-Geräusche alle 6–15 s nutzen sich ab; Stille-Zonen sind ortsfest (`SP.silent` nur an zwei Punkten). |
| Sichtbarkeit des Monsters | 3 | 5 (P.T. Lisa, SH2 Pyramid Head) | Beobachter (1-s-Regel) und Wendigo (erst im Finale ganz) vorbildlich. Das Graukind ist überbelichtet: Fernseher, Gurtstuhl-Flackern, Tank, lange im Lampenlicht bei Ochs am Berg, Küchenfenster-Foto, Polaroid, Heimweg, Grab. Behaltene: Kap. 3 Straße, Blinzeln, Kap. 5 Friedhof im selben Muster. |
| Umgebung als Erzähler | 5 | 5 (RE7, What Remains of Edith Finch) | Nr. 9 („Objekt weint. Schichtwechsel.“), Zeichnungswand „LUKE, 9“, Kalender bis das Papier durch ist, gemachtes Bett in Zelle Ost, Seilers Striche. Nichts zu tun außer bewahren. |
| Verfolgungsjagden, Konfrontationen | 3 | 5 (RE Village Dimitrescu, Outlast) | Peter + Rauch (Kap. 2) und Behaltene zur Lichtsäule (Kap. 3) gut. Kap. 4–6 ohne echte Jagd; das Finale Kap. 6 ist Zuschauen (Kamera geführt). Wolter-Konfrontation ist Dialog (gewollt, stark). |
| Schleichen | 3 | 5 (Alien Isolation, Amnesia Bunker) | AG-07 (Atem anhalten) und AG-13 (Schrank, Sichtkegel) sind geskriptete Einzelräume. Entdeckt werden bedeutet höfliches Abführen, keine Angst vor dem Ergebnis. |
| Rätsel unter Druck | 3 | 5 (RE2R, Amnesia Bunker) | Laternen unter Ochs am Berg und Kellercode mit steigender Reaktion sind vorbildlich. Lights-Out (Kap. 2), Sicherungskasten (Kap. 4), Villa-Nadel, Deduktion Raum 3 sind in völliger Ruhe. |
| Persönliche / emotionale Fallhöhe | 5 | 5 (SH2R) | Peter nickt im Öl; Hilde „Zähl für mich weiter“; „War es schön? Mein Leben?“; Mamas Stimme auf Band in Zelle Ost. A+++. |
| Mystery-Sog, Cliffhanger | 5 | 5 (Alan Wake 2) | Jede Endkarte stellt eine neue Frage („Du weißt es jetzt. / Sie auch. / 03:13.“, „Am Abend brennt Licht in eurem Elternhaus.“, AG-21). Einzige Schwäche: Ende Kap. 3 ist warm ohne Stachel (bei Vertrauen „mittel“). |
| Unvorhersehbarkeit, dynamische Schrecken | 2 | 5 (Amnesia Bunker, Visage) | Fast alles ist einmalig und ortsgebunden (`schreck_S.done`, `hungrige_S.done`). Zufall nur als generischer Laternenmann / Schritte / Flüstern. Keine Reaktion auf Spielerverhalten außer Beobachter (Stehenbleiben, Anleuchten). |
| Meta-/Psycho-Horror | 4 | 5 (P.T., Layers of Fear) | „Augen zu“ versagt, „Ihre Augen“-Kamera, Nadeldrucker protokolliert Luke, „HALLO LUKE“. Es fehlt ein Moment, in dem die Oberfläche selbst (Fibel, Speichern, Menü) nicht sicher ist. |
| Konsequenzen, Tod, Neustart | 2 | 5 (RE7, Madison) | Tod nur in Kap. 2 (Peter, Rauch) und Kap. 5 (Essen). Sonst „Kein Tod. Sie spielt.“ Folgen gibt es nur im Vertrauenswert (unsichtbar) und in Kleinigkeiten. |

---

## 3 · Lücken je Kapitel

**Prolog** (sehr stark). Einzige Lücke: vier Minuten ohne Steuerung. A+++-Einstiege (P.T., RE7) geben früh Kontrolle, damit der erste Schreck dem Spieler selbst passiert. Der Höhepunkt (Kindergesicht 1,2 s, Frame-Sprung, Thump statt Stinger) ist genau richtig.

**Kapitel 1.**
- Die ersten 20–30 Minuten liegen nur auf Stufe 1–2 (Rabe, Gestalt, Nachbild, Pat und Patachon, warmer Sessel, Fernseher). Gut gebaut, aber in der offenen Welt mit 21 Nebenaufgaben gibt es **keine wandernde Bedrohung**; wer erkundet, erlebt eine Stunde ohne Druck.
- Das Verstecken vor dem Licht lehrt als erste Jagd des Spiels: Erwischtwerden kostet nichts („gehoben, fallen gelassen, Neustart an der letzten Deckung“). Das untergräbt jede spätere Jagd.
- Stark und unbedingt behalten: „Nicht du“, „… danke, Luke …“, die ausgeblasenen Laternen mit Luftholen, Endbild 210.

**Kapitel 2** (das beste Spannungskapitel).
- Peter existiert bis zum langen Gang nur als Funkspruch. Es fehlt das Gefühl, dass **er seit dem Tunnel irgendwo in der Ebene ist** (Alien Isolation: Präsenz vor Kontakt).
- Lights-Out im Sicherungsraum ist ein Ruherätsel direkt nach „K-1 nicht im Käfig“. Dort gehört Druck hin.
- Kein zu früh Erklärtes, kein schwaches Ende.

**Kapitel 3.**
- Lange Erklärstrecke mit Justin (acht Happen plus Mira, Rüstung, Schokoriegel) ohne Bedrohung im Bild. Der Horror pausiert, während der Mythos erklärt wird.
- Ochs am Berg ohne Folge: Erwischt heißt nur „eine Laterne geht wieder an“. Regel 1 („Wer gefunden wird, muss zählen“) bleibt ungenutzt, obwohl sie genau hier passt.
- Die Kuh-Sequenz endet in ihren letzten drei Sekunden mit dem dreifachen „Scheiße“ samt Rabe. Der Lacher kommt zu früh; die Stille nach dem Aufschlag fehlt.
- Das Graukind steht lange im Lampenlicht; ohne Posenwechsel wird es zur Puppe.
- „Kein Draußen“ ist eine starke Idee, wird aber nur erzählt (Justin am Ausgang), nicht spürbar gemacht.
- Ende „Wie jeden Morgen“ ist warm und richtig, hat aber keinen Stachel (nur bei miserablem Vertrauen „Gute Nacht, K-3“).

**Kapitel 4** (bewusst ohne Monster, die schwächste Spannungskurve).
- „Resident-Evil-Villa“ ohne Mr. X: Nach AG-13 ist das Haus wieder sicher. Die Uhr „Abholung Freitag früh (hw)“ (DA 11) wird gelesen, aber nie gespürt.
- Entdeckt werden ist höflich und folgenarm (−8 Vertrauen). Kein „Oh nein“ zwischen Archiv und Kühlraum.
- Stark: Nr. 9 als Papier-Horror, Kühlraum ∴-1 (A+++), Zelle Ost mit Mamas Stimme, Wolters Hand.

**Kapitel 5** (P.T.-Kapitel, sehr stark).
- Friedhof wiederholt das Muster „Behaltene rücken beim Wegsehen näher“ zum dritten Mal (Kap. 3 Straße, Kap. 3 Blinzeln). Die neue Kamera wird dort nicht eingesetzt.
- Lucy auf der Kreuzung ist der einzige Moment, in dem ein geliebter Mensch in Gefahr scheint, aber das Bild zeigt nur „steht da, Augen weiß“.
- Sonst: Schleife, Polaroid, Stall, „Augen auf, Bruder“, Kerze am Grab sind A+++.

**Kapitel 6** (längstes Kapitel, größtes Potenzial).
- Zwei Stunden Hauptweg aus einmaligen Stufen (Reh, Krähe, Fuchs, Hirsch, Funk, Silhouette, Hofer). Der Wendigo **jagt nie frei**. Die Stille-Zonen sind ortsfest statt an ihm.
- Das Finale „Zwei Raben“ ist geführte Kamera; der Spieler tut nichts außer optional „Hand ausstrecken“.
- Die Uhr „Abholung Freitag früh“ läuft in genau dieser Nacht ab und wird nicht eingelöst (AG-21 ist die Gelegenheit).
- Stark: Merkblatt W, AG-20 ohne Gesicht, „Er schabt“ (Justins Stimme ohne Plattengeräusch), die Falle am Bus in drei Varianten.

---

## 4 · Vorschläge

Aufwand: **S** ≤ ½ Tag · **M** 1–2 Tage · **L** 3+ Tage. Alle ohne neue Lichter zur Laufzeit, ohne Allokationen im Tick, mit vorhandenen oder ohnehin geplanten Modellen (Blechmann, Nachsorge 11/12, Deer Thing, Graukind-Rig).

### A) Ohne Handlungsänderung

**A-01 · Prolog · Die Traumstraße gehört dem Spieler (S)**
- Was: Nach der Fahrt aus dem Nebel geht der Spieler selbst, sehr langsam (1,1 m/s, kein Laufen), auf die Kreuzung zu. Die Laterne kommt nicht näher, das Zählen schon („… vierzehn … fünfzehn …“ wird mit jedem Schritt lauter, als wäre das Kind hinter ihm). Nach 25–35 s landet der Rabe; ab da übernimmt `traum.js` wie geschrieben.
- Warum: P.T./RE7: der erste Schreck muss dem Spieler passieren, nicht dem Zuschauer; eine Straße, die nicht kürzer wird, ist das Kernbild des ganzen Spiels.
- Kanon: kein Inhalt neu. Widerspricht nur der Produktionsnotiz „Der Spieler steuert im Traum nicht“ → Autor entscheidet.
- Technik: `traum.js` Shot 1 als freie Phase, Kreuzung per Kamera-Offset „mitziehen“, Zählen über `Audio.whisper` hinter der Kamera.

**A-02 · Kap. 1 · Die Laternen summen ihr Lied (S)**
- Was: In Nähe von Nr. 7 (vor dem Keller) moduliert das Laternenbrummen ganz leise im Rhythmus E D C H C. Nur hörbar, wer stehen bleibt; Luke kommentiert es genau einmal („Die Laternen brummen in Moll. Ich muss dringend schlafen.“).
- Warum: Präsenz ohne Kontakt, Regel 2 wird *gehört*, bevor sie gezeigt wird (Amnesia: die Welt verrät das Monster vor dem Monster).
- Kanon: Kap. 2 bestätigt, dass Luna die Amtskabel über die Laternenmasten nutzt, auch unter der Erde. Nichts wird erklärt.
- Technik: vorhandener Laternen-Brummton, Gain-LFO in `klang.js`, nur in Radius 25 m um Nr. 7.

**A-03 · Kap. 1 · Suchlicht mit steigendem Preis (S)**
- Was: Erwischt 1: einen Meter gehoben (wie geschrieben). Erwischt 2: drei Meter, harter Fall, 8 s Humpeln (Schrittgeschwindigkeit 60 %, Lampe flackert), zum ersten Mal das Kichern. Erwischt 3: Luke hängt fünf Sekunden oben, sieht die Scheibe von unten atmen, dann Schwarz und Neustart; der Kegel sucht ab da 20 % schneller.
- Warum: RE/Outlast: jede Wiederholung muss schlimmer werden, sonst lernt der Spieler Gleichgültigkeit.
- Kanon: „Kein Tod. Sie spielt. Sie will nicht, dass es schnell geht.“ bleibt wahr; das Kichern kommt laut Kinosequenz „erst, wenn sie Luke das erste Mal erwischt“.
- Technik: vorhandene Deckungsmechanik; Kamerahöhe per Kurve, `vel`-Faktor, keine neuen Objekte.

**A-04 · Kap. 1 · Zwei Männer, die immer schon da sind (S)**
- Was: Nach AG-02 stehen Pat und Patachon zwei- bis viermal in der offenen Welt im Nebel, 25–40 m entfernt, sehen Luke an, gehen nebeneinander in gleichem Schritt weg, wenn er auf 15 m herankommt. Nie ein Wort. Einmal steht nur der Kurze da und schreibt.
- Warum: RE2R/Outlast-Prinzip „beobachtet werden“; die offene Welt bekommt eine Präsenz, ohne die Hauptlinie zu stören.
- Kanon: Kap. 1 = LWO „Zeichen und Schatten, zwei Männer im Nebel“. Nicht im Keller, nicht in Nr. 7.
- Technik: geplante Modelle Nachsorge 11/12, feste Anker, Einblenden außerhalb des Sichtkegels (Blick-Test wie `schreck_fwd`).

**A-05 · Kap. 2 · Der Nadeldrucker meldet K-1 (S)**
- Was: Der Drucker, der „RÜCKLÄUFER 08 BETRITT ARCHIV“ druckt, meldet ab dem Funkspruch zusätzlich K-1: „K-1 · BEWEGUNG · GANG OST“, „K-1 · TÜR PRÜFRAUM“, „K-1 · STILLSTAND“. Die Meldungen rücken Raum für Raum näher. In Zimmer 7 rattert er einmal, während Luke liest: „K-1 · FLUR VOR ZIMMER 7“. Unter der Tür wandert ein Schatten vorbei, langsam, und bleibt stehen. Dann geht er weiter.
- Warum: Alien Isolation (Bewegungsmelder): man weiß, dass er kommt, und sieht ihn nicht. Der Gang wird zur Einlösung statt zur Überraschung.
- Kanon: Peter „sucht den Ausgang“, jagt nicht aus Bosheit; keine Uhrzeiten im Druck; Peter beißt nie; die eine Beobachter-Sichtung bleibt die einzige Sichtung.
- Technik: vorhandener Drucker-Text; Schatten = Decal mit Opazität unter dem Türspalt (keine Figur, kein Licht).

**A-06 · Kap. 2 · Lights-Out mit Zuhörer (S)**
- Was: Jeder falsche Hebel schlägt laut. Nach dem zweiten Fehler druckt der Drucker im Nebenraum „K-1 · GERÄUSCH · SICHERUNG“, nach dem dritten kratzt es langsam außen an der Stahltür, dreimal, und hört auf. Die Tür ist zu und bleibt zu.
- Warum: RE-Prinzip Rätsel unter Druck; der Spieler zögert bei jedem Hebel.
- Kanon: Lösung 2-3-4-5 bleibt, keine Todesgefahr vor dem Gang.
- Technik: `Audio.knock`/Kratzen positioniert an der Tür, Zähler der Fehlversuche.

**A-07 · Kap. 3 · „Du bist.“ heißt zählen (S)**
- Was: Erwischt das Graukind Luke, wird das Bild schwarz, Q ist erzwungen, und Luke zählt laut bis siebzehn, schnell, mit einer Kinderstimme, die mitzählt und bei „siebzehn und noch eins“ lacht. Währenddessen hört man nackte Füße weglaufen und eine Laterne „rückwärts angepustet“. Augen auf: Das Graukind steht woanders, näher am nächsten Kasten.
- Warum: Kontrollverlust als Strafe (P.T., Signalis), und die Regel wird erlebt statt nur notiert.
- Kanon: Regel 1 („Wer gefunden wird, muss zählen“), „siebzehn und noch eins“ (Kern §3). Keine Verletzung, kein Tod.
- Technik: vorhandene `augenzu`-Schwärze, Zähl-Audio, Teleport der vorhandenen `grey`-Figur.

**A-08 · Kap. 3 · Ochs am Berg ohne Puppe (M)**
- Was: Das Graukind hat nie zweimal dieselbe Haltung, wenn Luke hinsieht: Hände vor den Augen wie beim Zählen, Finger am mundlosen Gesicht, winkend, auf Zehenspitzen, mit Lukes Richtung im Kopf schief. Im Lampenkegel steht es nie näher als 4 m (außer beim Erwischen) und bleibt am Rand des Kegels, halb im Nebel.
- Warum: SH2R/P.T.: was man zu lange und zu gleich sieht, verliert seinen Schrecken.
- Kanon: Regel 3; Aussehen unverändert.
- Technik: 5–6 Posen aus dem vorhandenen Rig (Standbilder, Pose beim Unsichtbarwerden wechseln), Abstandsklemme in `greyUpdate`.

**A-09 · Kap. 3 · Erklären, während sie zuhört (S)**
- Was: Mitten in einem Justin-Happen (nach „Das Erste, was es berührt hat, war meine Tochter.“) bricht er ab. Whiskey wird still. Die Laternen atmen schneller. Unter der letzten Laterne der Straße steht das Graukind, einen Atemzug lang, und ist weg. Justin, leiser: „Sie hört zu.“ Dann weiter, als wäre nichts.
- Warum: Alan Wake 2 lässt Erklärungen nie in sicherem Raum stattfinden; die Exposition bekommt einen Puls.
- Kanon: Justin kennt Luna, sagt ihren Namen erst auf Nachfrage; die Sichtung ist Ochs am Berg ohne Jagd. Eine Zeile, keine neue Information.
- Technik: `grey` an Laternen-Anker für 1,2 s, `spannung_hush(3)`.

**A-10 · Kap. 3 · „Kein Draußen“ sichtbar machen (S)**
- Was: Wer beim zweiten Versuch aus dem Nebel am Westende herauskommt, sieht vor sich auf dem nassen Asphalt frische Schuhabdrücke in Lukes Größe, die in den Nebel **hinein**führen. Die Telefonzelle klingelt einmal.
- Warum: P.T.-Schleife: der Beweis, dass man schon einmal hier war, ist schlimmer als jede Erklärung.
- Kanon: „Die Straße hinaus führt hinein.“ Nichts Neues.
- Technik: vorhandene Fußspur-Decals, Einweg-Auslöser.

**A-11 · Kap. 3 · Die Kette als Halte-Mechanik (M)**
- Was: In Nimmerheim hält der Spieler Justins Hand über eine Taste. Loslassen ist möglich. Im Kinderzimmer, wenn das Atmen aus dem Schrank hinter Luke weitergeht, zupft eine kleine kalte Hand an seiner freien Hand. Wer die Haltetaste loslässt, fällt (Weißblende, Nachbild eines fremden Jahres, Neustart am Speicherpunkt „Die Kette“).
- Warum: Amnesia/Signalis: eine Regel, die man körperlich halten muss, erzeugt Dauerspannung in einem Abschnitt ohne Gegner.
- Kanon: Regel 8 und Kap.-3-Mechanik „die Kette (Hand halten, nie loslassen)“ stehen schon im Kapitel; Justin sagt „Wer loslässt, fällt. Irgendwohin. Irgendwann.“ Raum 3 bleibt schreckfrei.
- Technik: Haltetaste, Fall als vorhandene Weißblende + `tod.js`-Variante ohne Blut (Zeile: „Du hast losgelassen. Irgendwann bist du irgendwo aufgewacht. Es war nicht heute.“).

**A-12 · Kap. 3 · Stille nach der Kuh (S)**
- Was: Der dreifache „Scheiße“-Gag rückt aus der Kinosequenz heraus. Nach dem Aufschlag 10–15 s Untersuchen in Stille (nur Dampf, das zuckende Bein, das Klappern der Ohrmarke). Erst beim dritten Untersuchungspunkt der Gag.
- Warum: SH2R lässt das Grauen stehen, bevor es löst.
- Kanon: Schreckbudget bleibt; Atempause kommt, nur später.
- Technik: Zeilen-Timing in `kino.js`.

**A-13 · Kap. 3 · Stachel im Morgengrauen (S)**
- Was: In „Wie jeden Morgen“ (8–16 s) klicken die Laternen-Relais von Ost nach West aus, ganz gewöhnlich. Die vor Nr. 1 klickt nicht. Sie brennt eine Sekunde zu lang. Dann wird sie ausgepustet, mit dem kleinen Nachglühen und einem Luftholen. Niemand kommentiert es.
- Warum: jedes A+++-Kapitelende hält eine Frage offen, auch das warme.
- Kanon: Luna spielt nach „Noch eine Runde“ weiter; Kap. 5 spielt in Nr. 1 („Am Abend brennt Licht in eurem Elternhaus“). Autor prüfen: Ausblasen heißt in Regel 2 „holen“; hier soll es „ich komme zu euch“ heißen. Alternative ohne Regelbezug: sie brennt weiter, als alle aus sind.
- Technik: vorhandene Laternen-Modi, Audio aus Kap. 1.

**A-14 · Kap. 4 · Ein Blechmann bleibt im Haus (M/L)**
- Was: Nach AG-13 zieht ein Blechmann nicht mit ab. Er geht Streife zwischen Halle, Galerie, Archiv und Anrichte, bis Luke den Kühlraum erreicht: schwere Schritte, Kettenrolle am Gürtel, Filterzischen, grelle Lampe als langer schmaler Sichtkegel. Er öffnet Schränke. Er bleibt stehen, wenn Luke rennt. Gesehen = der vorhandene „Gefunden“-Zweig (höfliches Abführen, Vertrauen −8, Höhepunkt mit Pat und Patachon oben an der Treppe).
- Warum: RE2R Mr. X, RE Village: das Herrenhaus wird feindlich, Rätsel werden zu Entscheidungen unter Druck.
- Kanon: Blechmann aus AG-13, LWO wendet keine Gewalt an; Kühlraum-Reihenfolge bleibt; nie mit dem Beobachter im Bild.
- Technik: Sichtkegel und Luftbalken aus AG-13, Wegpunktliste (8 Punkte), ein Modell, Lampe = bereits vorhandene Blechmann-Lampe mit Intensität geschaltet.

**A-15 · Kap. 4 · Die Uhr hören (S)**
- Was: Seilers Radio im Arbeitszimmer und das Funkgerät des Blechmanns rauschen gelegentlich Positionsmeldungen: „Nachsorge an Bergung. Villa. Stand?“ – „Obergeschoss. Keine Sicht.“ Der Kombi fährt zweimal hörbar außen am Haus vorbei, Motor im Schritttempo. Whiskey wird am Fenster dabei jedes Mal still.
- Warum: Präsenz ohne Kontakt (Amnesia: The Bunker); „Abholung Freitag früh“ wird fühlbar.
- Kanon: keine neue Information, nur Funk wie in AG-06/07/10.
- Technik: positionierte Funk-Audios, Motor-Loop an Pfad.

**A-16 · Kap. 4 · Das Haus hält den Atem an (S)**
- Was: Einmal, in der Halle nach dem Archiv: Pendel, Radio, Stehlampen-Surren, Whiskeys Klopfen verstummen gleichzeitig für acht Sekunden. Oben atmet das Licht einmal. Dann ist alles wieder da. Nichts passiert.
- Warum: Kern §13 „manche enden mit nichts, und das Nichts ist schlimmer“ – bisher kaum eingelöst; SH2R arbeitet genau so.
- Kanon: das atmende Licht oben ist gesetzt.
- Technik: `spannung_hush(8)` + Musik-Duck.

**A-17 · Kap. 5 · Lucys Zehen berühren den Boden nicht (S)**
- Was: Lucy steht auf der Kreuzung, Augen weiß. Wer hinsieht, erkennt: Ihre Fersen sind drei Zentimeter über dem Asphalt. Je näher das Graukind Luke kommt, desto höher (bis 20 cm), ihr Haar hebt sich wie bei Hilde im Strahl. Mit der Spieluhr sinkt sie auf die Fersen.
- Warum: Fallhöhe über eine geliebte Figur (RE Village, TLOU), und das Bild reimt auf Hildes Füße in Kap. 1, ohne ein Wort.
- Kanon: „Sie spielt noch mit mir“; kein Strahl, keine neue Regel. Autor prüfen, ob das Schweben zu nah an „holen“ liegt.
- Technik: Y-Offset am vorhandenen `lucy_erw`, Haar über vorhandenen Wind-/Idle-Parameter.

**A-18 · Kap. 5 · Friedhof im Blitzlicht (M)**
- Was: Nach „Pust.“ (Lampe aus, kanonisch) bleiben nur die Grablichter, zu schwach für die Mitte des Feldes. Die Behaltenen sieht man verlässlich nur im Blitz der Polaroid-Kamera: Jeder Blitz zeigt sie näher, das Bild entwickelt sich vier Sekunden in der Hand. Film ist knapp (Rest aus Nr. 1 + eine Packung im Grabkranz). Ohne Film: nur das Geräusch nackter Füße.
- Warum: Visage/Fatal Frame; die Kapitelmechanik wird zur Überlebensfrage, das dritte Ochs-am-Berg bekommt ein neues Gesicht.
- Kanon: „Die Kamera zeigt, was das Auge nicht sieht“; „Taschenlampe auf sie: Pust. Lampe aus, bis gelöst.“; Behaltene greifen nicht an (Neustart SP5-7 statt Tod).
- Technik: vorhandene Kamera-Textur (`zayn_takePhotos`-Prinzip), Blitz = vorhandener Kamera-Weißpuls, Figurenversatz nur bei Blitz.

**A-19 · Kap. 5 · Die Fibel ist nicht mehr nur deine (S)**
- Was: Genau einmal, nach Schleifenrunde 2: Wer die Fibel öffnet, findet auf der Seite „DAS BIST DU“ unter Lukes Einträgen eine neue Zeile in weißer Kinderkreide: „BRUDER“. Beim Schließen der Fibel läuft hinter der Kamera die Spieluhr einen Ton weiter. Danach ist die Zeile verschwunden.
- Warum: P.T./Layers of Fear: der Pausenraum ist nicht sicher. Einmal reicht für den Rest des Spiels.
- Kanon: Luna sieht durch Luke (Regel 10), kann schreiben, was sie nie sagen kann (HASENBROT im Beschlag), die Fibel „schreibt weiter“ (Prolog).
- Technik: Fibel-Renderer mit Einmal-Flag; Audio-Note beim Schließen.

**A-20 · Kap. 6 · Der Wendigo jagt (L)** – wichtigster Einzelvorschlag
- Was: Zwischen AG-20 und dem Bau (und einmal auf dem Weg zum Wrack) ist der Wendigo frei unterwegs. Seine Gegenwart **ist** die Stille-Zone: Wo er ist, verstummen Wald, Wind und Hall im Radius 20–30 m. Man sieht ihn fast nie, man hört, dass nichts mehr zu hören ist. Er folgt Lärm (Rennen, Klirren der Pfandflasche, Rufen) und meidet die Lampe (Merkblatt W: „Lampe nie senken“). In der Stille-Zone entlädt sich die Lampe 1,5× schneller. Leere Lampe + Kontakt = Tod (neue `tod.js`-Art). Bei Sichtkontakt mit voller Lampe weicht er rückwärts, knickt die Knie falsch.
- Warum: Amnesia: The Bunker (Beast), Alien Isolation: ein Jäger mit lesbaren Regeln, der aus dem Kapitel ein Überleben macht statt einer Geisterbahn.
- Kanon: „Luke ist das größte Mahl im Ort“, fürchtet grelles Licht und Whiskey; Name „Wendigo“ erst nach Hofers Seite 1 (die Jagd beginnt danach). Das Finale „Zwei Raben“ bleibt die einzige volle Sichtung.
- Technik: Deer Thing (`hungrige_S.dt`) mit Wegfindung auf dem Waldnavigationsraster, `SP.silent` aus Wendigo-Position statt aus zwei festen Punkten, Lampenverbrauch über `FLASH.charge`. Ein Modell, keine neuen Lichter.

**A-21 · Kap. 6 · Er frisst, was du gesehen hast (S/M)**
- Was: Stirbt Luke durch den Wendigo, fehlt nach dem Neustart eine gesammelte Nachbild-Seite der Fibel: Die Schrift ist verschmiert, die Seite hat einen halbrunden Riss („— gefressen —“). Höchstens zwei, nie eine Seite, die für Rätsel oder Wendungen gebraucht wird.
- Warum: Folgen, die bleiben (Pathologic, Amnesia-Sanity); der Tod erzählt die Monsterregel.
- Kanon: Der Wendigo frisst Nachbilder (§6.4). Keine Information geht verloren, nur ein Andenken.
- Technik: Flag in `story.lore`, Text-Ersatz im Fibel-Renderer, `MOD_SAVE`.

**A-22 · Kap. 6 · Das falsche Trippeln (S)**
- Was: Einmal im tiefen Wald: das vertraute Beobachter-Trippeln links, Kiesel, Rascheln. Whiskey schaut nach rechts. Wer dem Trippeln folgt, findet einen Geschälten. Wer Whiskeys Blick folgt, findet einen Beobachter-Zettel.
- Warum: P.T./Signalis: das gelernte Sicherheitssignal wird gegen den Spieler gedreht, genau einmal.
- Kanon: „Whiskey sieht ihn immer“ (bei Anni im Kap. 6 schon so benutzt); der Wendigo ahmt Geräusche nach (das zweite Klirren am Hochsitz). Beobachter bleibt unsichtbar.
- Technik: `Audio.stepAt`-Trippeln-Sample an Wendigo-Position, Whiskey-Blickziel.

**A-23 · Kap. 6 · Hufe über Kinderfüßen (S)**
- Was: Zwischen Wrack und Bau: kleine nackte Abdrücke und Brotkrumen, und über den Kinderfüßen, frischer, gespaltene Hufabdrücke, die ihnen folgen. Luke, ein Satz: „Er ist hinter ihm her.“
- Warum: Fallhöhe über einen anderen (Little Nightmares, RE4R); die Suche bekommt Eile.
- Kanon: Der echte Luke ist im Wald, der Wendigo frisst, was das Licht liegen lässt. Er erreicht ihn nie (Epilog bleibt).
- Technik: Decals.

**A-24 · Kap. 6 · „Freitag früh“ einlösen (S)**
- Was: In AG-21 hält Nachsorge 12 seinen Block; in der Halbtotale lesbar: „Abholung K-3. Freitag früh. Waldrand.“ Der Kombi steht dahinter mit offener Tür und laufendem Motor, niemand am Steuer.
- Warum: gesetzte Uhr wird eingelöst (Tschechows Uhr); das Bild bekommt einen zweiten Schrecken: die Abholung kam, und was sie trägt, ist nicht mehr die LWO.
- Kanon: DA 11 („Abholung Freitag früh (hw)“), AG-21 unverändert; ob Nachsorge 12 tot ist, bleibt offen (02 C6 hält beide für Kap. 7).
- Technik: Textur auf dem Block, Kombi-Pose.

**A-25 · Überall · Untertitel erzählen keine Angst mehr (S)**
- Was: Zeilen, die den Schreck beschreiben, werden gestrichen oder zu reinen Geräuschangaben im Barrierefrei-Modus („[Atmen, nah]“), Standard aus: „Hinter dir. Ein Atem. Klein. Kalt.“, „Sie sucht. Wie beim Verstecken. Und du bist dran.“, „Sie spielt. Sie will nicht, dass es schnell geht.“, „Irgendwo hinter dir: ein Kichern. Ganz leise.“, „Das Kichern entfernt sich. Für jetzt.“
- Warum: SH2R/P.T. vertrauen dem Ohr; ein Satz vor dem Umdrehen nimmt das Umdrehen weg.
- Kanon: Schreibregeln („Stille ist ein Werkzeug“). Autor entscheidet je Zeile; Lukes Gedanken bleiben.
- Technik: `subtitle`-Aufrufe mit Flag `sfxCaption`.

**A-26 · Überall · Stinger-Diät und kein Schrei (S)**
- Was: `scareSound('scream')` fällt bei jedem Kontakt mit Luna/Graukind/Behaltenen weg (Basis `greyCaught`, Kap.-3-Erwischen, `k5_gefangen`, `tod.js`) und wird durch diegetischen Ton ersetzt (Atem am Ohr, Kichern, abgeschnittene Spieluhrnote, dann Stille). Der Geige-Stinger bei Zufallsgestalten entfällt; stattdessen Ton-Abriss (0,4 s alles auf 0). Höchstens ein musikalischer Stinger je Kapitel außerhalb der Kinosequenzen.
- Warum: Dread statt Jumpscare; Stinger nutzen sich ab und klingen billig.
- Kanon: 02 H4 „Luna schreit nie“; Kern §13.
- Technik: Aufrufe ersetzen, `spannung_hush(0.4)`.

**A-27 · Überall · Jede Zufallsgestalt ist jemand (S/M)**
- Was: Die generischen Zufallsgestalten aus `dir` und `schrecken.js` (Gesichter `pale`/`wendt`/`grey`, „Laternenmann“, laufende Figur im Wald) werden je Kapitel an Kanonwesen gebunden: Kap. 1 nur die Gestalt mit Helm oder Kapuze unter einer Laterne (Justin oder Blechmann, bewusst unklar); Kap. 3 Graukind; Kap. 4 Blechmann im Nebel, Kombi; Kap. 5 Graukind, Behaltene; Kap. 6 Geschälte. **Nie** eine kleine blasse Figur in Kap. 1/2 (liest sich als Beobachter und bricht „Kap. 1 nie sichtbar, Kap. 2 einmal“).
- Warum: SH2: jede Erscheinung bedeutet etwas; Zufall ohne Bedeutung ist Rauschen.
- Kanon: schützt Test-Checkliste (e).
- Technik: Tabelle `SCHRECK_WESEN[kap]` statt Zufallsgesicht; Modelle vorhanden/geplant.

**A-28 · Überall · Atempausen mischen, Vogel-Gag rationieren (S)**
- Was: Nach Stufe-2/3-Schrecken: etwa 50 % Lacher (A-01 … A-25), 30 % Stille (Luke atmet, sagt nichts, Gedanke frühestens nach 20 s), 20 % „Ruhe mit Riss“ (die Pause ist fast vorbei, dann eine kleine Stufe-1-Anomalie). Der Rabe darf nach einem Dreier höchstens einmal je Kapitel den Lacher liefern; für Kap. 3 und 4 (beide Male Mikrowellen-Pling) einer der beiden ohne Pling (vorzugsweise Kap. 3, dort trägt Whiskeys erstes Geräusch nach der Stille in Nimmerheim ohnehin).
- Warum: Alan Wake 2/RE4R: der Rhythmus darf nicht vorhersagbar werden; Lachen muss sich wie Glück anfühlen, nicht wie ein Signal.
- Kanon: Kern §13 sagt „oft mit einem Lacher“, nicht „immer“. Keine Pause in traurigen Szenen.
- Technik: `spannung_breath(kind)` mit Zufallswahl nach Gewichten, Sperre je Kapitel.

**A-29 · Überall · Der Beobachter wird wieder unheimlich (S)**
- Was: Geräusch-Budget passt sich an (siehe 5.7); zwei- bis dreimal je Kapitel ein Stille-Fenster von 60–120 s ohne ihn, danach als erstes Geräusch Papier. Und je Kapitel ab Kap. 4 ein Zettel, der Nähe zeigt statt Hilfe, Vorschlag für Dossier 82: „DU HAST AUF DEM SESSEL GESCHLAFEN. ICH HAB DICH GEZÄHLT. ZWEI MAL. ∴“ (Kap. 4, Abspann bei Vegas, liegt auf der Armlehne; beim zweiten Spielen: es gibt zwei Lukes).
- Warum: Outlast/Visage: verfolgt werden muss unangenehm bleiben; das Zwiespältige (Kern: „zwiespältig bis Kapitel 7“) braucht auch unangenehme Momente.
- Kanon: keine Sichtung, kein Preis, kein Ein-Punkt-Zettel; Wortlaut entscheidet der Dossier-Autor.
- Technik: `BEOB.sndGap` dynamisch, `beob_S.dyn`.

**A-30 · Überall · Weniger Netz (S)**
- Was: In Jagdphasen kein Speicherpunkt nach jedem Teilerfolg: Kap. 3 speichert nach der zweiten und vierten Laterne statt nach jeder; Kap. 6 zwischen AG-20 und Bau nur an Jonas’ Lager. Beobachter-Batterien nur, wenn Ladung < 25 % **und** keine Jagd läuft; Kap. 1 Start mit einer Ersatzbatterie; Kap. 6 höchstens drei im ganzen tiefen Wald. Einstellung „Geschichte“ (alte Dichte) für Spieler, die nur die Story wollen.
- Warum: RE7/Amnesia: Verlustangst ist die Grundlage jeder Jagd.
- Kanon: Beobachter hilft weiterhin, „wenn Luke festhängt“.
- Technik: `todCheckpoint`-Aufrufe bedingen, `FLASH.spare`-Start, Batterie-Spawn prüft `spannung_k()`.

**A-31 · Überall · Hinhören, die Tontechniker-Taste (M)**
- Was: Halten (z. B. H): alle Schichten ducken sich auf 30 %, eine Schicht wird herausgehoben (Spieluhr unter Stimmen, Atmen in Wänden, fehlendes Plattenschaben, Wendigo-Stille-Rand). Während des Hinhörens: Bewegung 40 %, FOV −6°, Lampe schwankt. Zu lange hinhören (> 6 s) in Gefahr = verwundbar.
- Warum: Madison/Visage: eine Mechanik, die aus der Figur kommt; Luke ist Tontechniker, und die Bibel stützt Hinweise schon aufs Hören („Wer still steht, hört die Spieluhr“).
- Kanon: formalisiert nur, was im Text passiert.
- Technik: Gain-Busse in `klang.js`/`Audio` vorhanden; kein Rendering-Aufwand.

### B) Mit Handlungsänderung (nur zur Entscheidung)

**B-1 · Kap. 5 · Lucy wird noch einmal gezogen (M)**
- Was: Statt nur zu schweben (A-17) hebt sich Lucy auf der Kreuzung langsam, wie Hilde: Luke hat mit dem Graukind im Rücken so lange, bis sie auf Laternenhöhe ist (ca. 45 s). Zu spät = Tod-Bildschirm „Du warst zu langsam. Wieder.“ (Neustart SP5-4).
- Warum: das stärkste „Oh nein“, das das Spiel haben kann, weil es Kap. 1 spiegelt; Zeitdruck mit Liebesobjekt.
- Kanon-Risiko: Kap. 5 ist keine offene Nacht; ein Hochheben außerhalb der Zyklusnächte ist in 2026 zwar belegt (Roxy, Mike, Lucy, Hilde), nach „Noch eine Runde“ aber neu. Neue Information: Luna kann nach Kap. 3 noch holen. Lohnend, aber der Autor muss es wollen. Sonst A-17.

**B-2 · Kap. 6 · Nachsorge 11 allein im Kombi (S)**
- Was: Nach AG-21, im Abspann: Nachsorge 11 sitzt allein im Kombi, zwei Stullen im Papier, eine unangetastet. Er spricht in den Funk: „Zwölf, melden.“ Rauschen. „… Zwölf. Ich hab Käse.“ Er hört nicht auf zu fragen.
- Warum: RE Village/Alan Wake 2 geben dem Gegner Menschlichkeit genau dann, wenn er verliert; macht AG-21 grausamer und bereitet Kap. 7 vor.
- Kanon-Risiko: zeigt klarer, dass Nachsorge 12 weg ist (02 C6 sieht beide in Kap. 7). Nur bauen, wenn Kap. 7 Nachsorge 12 als verloren oder als „getragen“ weiterführt.

**B-3 · Kap. 3/4 · Bruno ist falsch zurückgekommen (S)**
- Was: Beobachtung: In Kap. 3 sitzt Bruno grau auf Zayns Schoß in Nimmerheim, bellt aber in derselben Nacht hinter Vegas’ Tür (UK 6) und läuft im Abspann über die Straße. Das ist entweder ein Kontinuitätsfehler oder eine Chance: Der Bruno bei Vegas hat einen dünnen weißen Ring in den Augen (wie Lucy), niest bei Luke, bellt nie wieder. Vegas: „Seit er wieder da ist, frisst er keinen Speck.“
- Warum: Unheimliches Alltagsdetail (Pet-Sematary-Prinzip) im sichersten Haus des Spiels.
- Kanon-Risiko: neue Information („Luna gibt auch Tiere halb zurück“); Kap. 7 lässt den Beobachter sagen, Bruno „lebt noch“. Mindestens die Kontinuität muss der Autor klären; die Horror-Lösung ist optional.

**B-4 · Kap. 4 · Die Abholung wird vorgezogen (M)**
- Was: Nach AG-14 versuchen Pat und Patachon Luke am Villentor mitzunehmen („Es ist jetzt doch eilig, Herr Brandt.“); Flucht durch die Schrebergärten bei Tag, Whiskey lenkt ab.
- Warum: gäbe Kap. 4 eine echte Jagd im Freien.
- Kanon-Risiko: widerspricht Wolters „Er soll erst mal laufen“ und DA 11 „Freitag früh“, und der offenen Frage „Warum hat Wolter ihn heute nicht einfach mitgenommen?“. **Empfehlung: nicht bauen**, A-14/A-15 decken den Bedarf.

---

## 5 · Systemische Vorschläge für `spannung.js`

**5.1 Bedrohungsstufen (Zustandsmaschine).** `SP.phase` ∈ Ruhe (0) → Unbehagen (1) → Präsenz (2) → Jagd (3) → Höhepunkt (4) → Nachklang (5). Skripte melden `spannung_phase(n, grund)`; Zufallsplaner lesen sie.
- Ruhe: Umgebung voll, Minor-Abstand wie Kapiteltabelle.
- Unbehagen: Umgebung −30 %, Minor erlaubt, Major gesperrt.
- Präsenz: Präsenz-Tokens (5.3) aktiv, Major nur als Sichtung ≥ 25 m.
- Jagd: nur Jäger-Geräusche + Atmung, alle anderen Planer stumm (`SP.chase`), kein Autosave.
- Höhepunkt: alles gesperrt (wie heute `scripted`).
- Nachklang: 60–120 s (Stufe 2: 60, Stufe 3: 120) Pflichtruhe, danach Atempause nach A-28.

**5.2 Stressmodell (Spieler-Spannung, 0…1).** Ersetzt die heutige Näherung `spannung_k()`:
`S = clamp(0,35·dunkel + 0,25·nähe + 0,20·nachklang + 0,10·rennen + 0,10·lampeSchwach)` mit dunkel = Lampe aus/leer und Umgebungslicht < Schwelle; nähe = 1 − d/25 zum nächsten Jäger/Graukind; nachklang = exp(−Δt/40) seit Höhepunkt; lampeSchwach = `FLASH.charge < FLASH.LOW`.
Wirkung: Herzschlag ab S 0,5 (60 → 110 bpm, Gain 0 → 0,35), hörbarer Atem ab 0,6, Lampenzittern 0,004·S rad, Vignette +0,15·S, Luke-Gedanken ab S > 0,7 unterdrückt.
Regie (Left-4-Dead-Prinzip): S < 0,25 länger als 120 s → nächstes Präsenz-Ereignis freigeben; S > 0,75 länger als 20 s → 45 s keine neuen Minor-Ereignisse.

**5.3 Gegner-Präsenz ohne Kontakt.** Je Kapitel ein Wesen mit Token-Budget: Kap. 1 Pat und Patachon / Licht in den Laternen, Kap. 2 K-1 (Drucker, Kratzen, Schatten), Kap. 3 Graukind (Laterne, Kichern), Kap. 4 Blechmann / Kombi, Kap. 5 Graukind, Kap. 6 Wendigo (wandernde Stille). Abstand 150–240 s (Kap. 1), 90–180 s (Kap. 2–6); Sichtung ≥ 25 m oder Geräusch ≥ 12 m; nie länger als 1,2 s im Blick; bevorzugt im Augenwinkel (60–110° zur Blickrichtung) oder hinter Luke; nie < 90 s nach einem Höhepunkt; nie in traurigen Szenen.

**5.4 Falsche Sicherheit.** Genau einmal je Kapitel in einer Sicherheitszone (Vegas’ Haus, Justins Lichtsäule, Villa-Arbeitszimmer, Jonas’ Lager): nach 40–70 s Ruhe ein Stufe-1-Riss (Klopfen am Fenster, Schritt auf der Treppe, Spieluhrnote). Nie Stufe 2+, nie nach einem traurigen Moment. `spannung_safe(zone)` meldet die Zone.

**5.5 Stille als Werkzeug.** Vor der Hälfte aller Dreier ein „Vakuum“: `hushG` in 0,8 s auf 0,05, 3–6 s halten. Zusätzlich 1–2× je Kapitel „leere Stille“: 8–12 s alles weg, danach nichts. Stille-Zonen folgen im Kap. 6 dem Wendigo (A-20): `SP.silent` aus Distanz zum Wesen, Rand 30 m weich, innen 20 m voll.

**5.6 Dynamische Geräusche nach Spielerverhalten.**
- Lärmradius: Rennen 18 m, Gehen 6 m, Stehen/Schleichen 2 m, Pfandflasche/Klirren 25 m, Rufen 35 m → speist Wendigo, Blechmann (A-14), Beobachter-Abstand.
- Lampe an = Sichtbarkeit 30 m für Jäger, aus = 8 m.
- Häufiges Umdrehen (≥ 4 Drehungen > 120° in 10 s) → nächstes Minor-Ereignis vor Luke statt hinter ihm.
- Stehenbleiben > 8 s: Beobachter kommt näher (vorhanden); in Kap. 6 wächst die Stille-Zone um 1 m/s.
- Lesen > 20 s: nach dem Schließen mit 30 % ein Minor-Ereignis hinter Luke (Schritt, Tür angelehnt).
- Fibel öffnen: einmal je Kapitel ein Ereignis beim Schließen (vgl. A-19).

**5.7 Gewöhnung verhindern.** Zähler je Familie: mehr als vier Ereignisse derselben Familie in zehn Minuten → Abstand ×1,8. Beobachter-Geräusche: Takt dynamisch 8–20 s statt 6–15 s, zwei Stille-Fenster je Kapitel (A-29). Variationspool je Familie mindestens sechs Samples, nie dasselbe zweimal hintereinander (heute nur für Familien, nicht Samples).

**5.8 Kapitel-Erkennung reparieren (Befund).** `spannung_chapter()` kennt nur 1–4 (`ch3.on ? 3 : state.ch2 ? 2 : anwesen_S.ch4 ? 4 : 1`); Kapitel 5 und 6 fallen auf den Abstand von Kapitel 1 (85 s) zurück oder, falls `ch3.on` noch gesetzt ist, auf Kapitel 3. Vorschlag: `kap()` aus AP-01 verwenden und Tabelle `[—, 85, 70, 60, 75, 55, 50]` (Kap. 4 bei Tag etwas ruhiger, Kap. 5/6 dichter).

**5.9 Stinger-Budget.** `Audio.scareSound` außerhalb von `kino.js` höchstens einmal je Kapitel; weitere Aufrufe werden auf diegetischen Ton + `spannung_hush(0.4)` umgeleitet (A-26). Protokolliert in `SP.log` für den Test.

Leistung: alles läuft über vorhandene Gain-Knoten, den 0,25-s-Takt der Regie und vorhandene Figuren; keine neuen Lichter, keine Objekte im Tick, ein zusätzliches animiertes Modell (Wendigo) nur in Kap. 6. Test-Checkliste ergänzen: (j) Stinger je Kapitel ≤ 1 außerhalb Kino; (k) kein `scream` bei Luna; (l) Präsenz-Ereignisse nie < 90 s nach Höhepunkt; (m) keine kleine blasse Zufallsgestalt in Kap. 1/2.

---

## 6 · Top 15 nach Wirkung / Aufwand

1. **A-20** Der Wendigo jagt frei, seine Gegenwart ist die Stille-Zone (L, größter Einzelgewinn).
2. **A-26** Kein Schrei bei Luna, Stinger-Diät (S, kanonpflichtig).
3. **A-05** Der Nadeldrucker meldet K-1, Schatten unter der Tür (S).
4. **A-14** Ein Blechmann bleibt in der Villa auf Streife (M/L).
5. **A-07** „Du bist.“ heißt zählen, Regel 1 als Strafe (S).
6. **A-30** Weniger Netz: Speicherpunkte und Batterien in Jagden verknappen (S).
7. **A-25** Untertitel erzählen keine Angst mehr (S).
8. **A-28** Atempausen mischen, Vogel-Gag rationieren (S).
9. **A-03** Suchlicht mit steigendem Preis in Kap. 1 (S).
10. **5.2/5.3** Stressmodell und Präsenz ohne Kontakt in `spannung.js` (M).
11. **A-18** Friedhof im Blitzlicht der Polaroid-Kamera (M).
12. **A-22** Das falsche Trippeln, Whiskey schaut woandershin (S).
13. **A-19** Die Fibel ist einmal nicht sicher („BRUDER“) (S).
14. **A-27** Jede Zufallsgestalt ist ein Kanonwesen, nie ein falscher Beobachter (S/M).
15. **A-17** Lucys Zehen berühren den Boden nicht (S); B-1 nur, wenn der Autor die stärkere Fassung will.

Außerhalb der Liste, aber kurz zu erledigen: A-12 (Stille nach der Kuh), A-13 (Stachel im Morgengrauen), A-24 („Freitag früh“ einlösen), 5.8 (Kapitel-Erkennung in `spannung.js`), B-3 (Bruno-Kontinuität klären).
