# F3 · Verständlichkeit Prolog bis Kapitel 3 (Priorität 4 des Premium-Auftrags)

Stand 30.09.2026. Grundlage: Code der Module (Aufgaben, Gedanken, Untertitel, Notizen, Fibel) gegen die Fragen aus `docs/gameplay/premium_auftrag.md`
(Wo bin ich? Wer bin ich? Was ist passiert? Warum bin ich hier? Ziel und Einsatz? Wer ist diese Figur? Was als Nächstes?).
Kanon: Fassung 3, „Wer was wann weiß“ (Luna erst Kap. 3 aus Justins Mund, LWO erst Kap. 4, Wendigo erst Kap. 6).

Befund in einem Satz: Die Bibel-Texte sind fast vollständig gebaut, und die Rätsel und Enthüllungen sind fair. Was fehlt, ist der **Anker davor**:
Wer Luke ist, warum er gerade jetzt kommt, wer die Leute sind, denen er begegnet, und bei den Aufgaben das **Warum**. Viele Aufgaben nennen nur einen Ort
(„Der Messraum. Das Klavier.“, „Finde Zimmer 7.“), und entscheidende Sätze stehen nur in Nebenaufgaben (elf Anrufe) oder in optionalen Dialogen (Lunas Name).

## Lücken → Fix

| # | Moment | Was fehlt | Fix (Modul) |
|---|---|---|---|
| 1 | Aufwachen am Ortsschild | Wer Lucy für Luke ist (Zwilling). Warum er so spät kommt (elf weggedrückte Anrufe am 23. stehen nur in der Nebenaufgabe „Elf Anrufe“, Kap. 2 und 3 setzen sie aber voraus). Was er jetzt will. | 2. Gedanke nach „Lucy. Seit dem 23. …“: Zwillingsschwester, elfmal weggedrückt, „Diesmal fahr ich nicht ohne sie.“ (`traum.js`) |
| 2 | Erste Schritte durchs Dorf | Das Gefühl der Heimkehr (Bibel UK 1, „Hotelflur“) war nicht gebaut. | Ortsgedanke auf der Ahornstraße (`gedanken.js`) |
| 3 | Aufgabe „Finde Haus Nr. 7.“ | Warum Nr. 7? (nur Lucys Anruf im ersten Gedanken, der schnell vergessen ist) | Aufgabe: „Lucy hat angerufen: ‚Haus Nummer 7. Der Keller.‘ Finde Haus Nr. 7.“ (`kapitel1.js`) |
| 4 | Vor Nr. 7 | Wer wohnt da? Hilde tritt zuerst als Monster auf, ohne dass man weiß, wer sie ist. | Ortsgedanke: Frau Wendt, Jonas’ Mutter, „Was will Lucy in ihrem Keller?“ (`gedanken.js`) |
| 5 | „Nicht du.“ | Dass das Frau Wendt war, und welche Frage bleibt. | Gedanke 16 s danach: „Das war Frau Wendt. Hilde … Wen hat sie denn erwartet?“ (`kapitel1.js`) |
| 6 | „Durchsuche Haus Nr. 7.“ | Wonach? | Aufgabe nennt Lucys Band im Keller (steht so auf ihrem Zettel) (`kapitel1.js`) |
| 7 | Nach „… danke, Luke …“ | „Geh wieder nach oben.“ sagt nicht, warum. | „Irgendwas ist an dir vorbei die Treppe hoch. Hinterher.“ + Festhänge-Hinweis (`kapitel1.js`, `gedanken.js`) |
| 8 | Verstecken vor dem Licht | Warum der Keller hilft (Hildes Schrei geht im Höhepunkt leicht unter). | Aufgabe: „… unter der Erde sieht sie dich nicht.“ + Festhänge-Hinweis (`kapitel1.js`, `gedanken.js`) |
| 9 | Vegas (Nr. 3) | Nie vorgestellt: Stimme hinter der Tür, dann „Der nimmt Zoll“. Wer ist der Mann? | Gedanke beim ersten Kontakt (Gespräch, Taufe W-01 oder Zuruf beim Verstecken) (`gedanken.js`) |
| 10 | Übergang Kap. 1 → 2 | Warum gehe ich hinunter? Hildes „Hinter die Bilder! Lucy!“ steht nur im Höhepunkt. | Aufgabe „Hinter die Bilder, hat Hilde geschrien. Folge dem Gang …“; im Gang Gedanke „… wie einen Ort. Wenn Lucy irgendwo ist, dann hier unten.“ (`kapitel1.js`, `gedanken.js`) |
| 11 | Kap. 2, Aufgabenkette | Nur Orte statt Ziel („Folge dem Tunnel.“, „Finde Zimmer 7.“, „Der Messraum. Das Klavier.“). Das Ziel Lucy verschwindet bis zum Tank. | Jede Aufgabe mit Grund: Lucy ist hier unten; die Akten sind die der sieben Kinder, Lucys und deine dabei; Schlüssel ZIMMER 7; ohne Strom keine Stahltür; von dort kommt Lucys Summen; Klavier: nachspielen, was sie summt (`amt.js` Zuordnung für Basis-Texte, `zimmer7.js`, `lwo.js`) |
| 12 | Kap. 2, das Summen im Tunnel | „Das ist sie.“ – wer? Die Spieluhr-Regel ist noch nicht erklärt. | „Keine Spieluhr darunter. Das ist sie. Das ist Lucy.“ (`amt.js`) |
| 13 | Übergang Kap. 2 → 3 | Wo ist Lucy jetzt? Die Endkarte („Du weißt es jetzt. Sie auch.“) sagt es bewusst nicht; die erste Aufgabe von Kap. 3 („Finde heraus, was mit Lost Eyengless geschehen ist.“) hat Lucy vergessen. | Aufgabe „Hol Lucy zurück. Finde heraus …“ (Bibel UK 5 nennt genau diese Aufgabe); Gedanke „Der Tank war leer … es hat jetzt Lucy.“ (`lucy3.js`, `kapitel3.js` Weiterspielen) |
| 14 | Kap. 3, Telefon | „Der Anruf von damals“ – es war der Anruf von vorletzter Nacht, der Luke hergeholt hat. Der Bogen zum Anfang geht verloren. | „Das ist der Anruf, der mich hergeholt hat. Wort für Wort.“ (`kapitel3.js`) |
| 15 | Kap. 3, Justins Pflichtsätze | „Luna“ fällt in Pflichtsatz 1, der Name wird aber nur in einer optionalen Frage genannt. Wer die Happen überspringt, hört einen fremden Namen. | Vor Pflichtsatz 1 kommen, falls noch nicht gehört, die Bank-Zeilen „herz“ (seine Tochter) und „name“ (Luna, Lucy/Luna im Nebel) – Wortlaut unverändert, nur die Reihenfolge ist gesichert (`justin.js`) |
| 16 | Kap. 3, Aufgabe nach Justin | Zitat ohne Ziel („Der eiserne Kasten … spricht noch.“). | „Die Laternen müssen aus, dann muss sie herunter. Wie, steht bei Frau Wendt in Nr. 7 – und der Funkkasten an der Kreuzung spricht noch.“ (`kapitel3.js`, `justin.js`) |

Nicht geändert, weil schon verständlich: Prolog-Traum und Auftrag, Nachbild und Narbe, AG-02 (Nummern statt Namen), Kellercode-Hilfen, Tonband, Endkarte Kap. 1,
Akte 08 und Lucys Tank-Dialog, Justins Vorstellung (Name, Hof, „Ich hab dich losgeschnitten“, Einsatz „bis zum Morgen“), Nimmerheim-Aufgaben, Raum 3, „Noch eine Runde“, Endkarten Kap. 3.

## Fragen an den Autor (Kanon selbst unklar)

1. **Woher weiß Luke, dass Lucy seit dem 23. verschwunden ist?** Im Hauptweg sagt es ihm niemand (Kühns Polizei-Mailbox AG-03 liegt in der Nebenaufgabe „Elf Anrufe“).
   Vorschlag: eine Zeile im Aufwach-Gedanken, z. B. „Seit dem 23. geht keiner mehr ran. Die Polizei sagt: erwachsen, freiwillig.“ – oder AG-03 als Mailbox auf Lukes eigenem Handy gleich nach dem Aufwachen.
2. **Justins Pflichtsatz „… wenn Luna nicht findet, was sie sucht …“** setzt den Namen voraus, den die Bibel nur in einer optionalen Frage vergibt. Umgesetzt: Reihenfolge gesichert (s. o.). Vorschlag für die Bibel: Pflichtsatz 1 mit „meine Tochter“ statt „Luna“, oder „Wie heißt sie?“ als Pflichtfrage.
3. **Kap. 3, Intro-Tafel „Viele kleine Hände, die dich tragen“** gegen Kap. 2 UK 9, wo Luke selbst aus dem Gully steigt und daneben zusammensackt. Vorschlag: „Dann an Hände … die dich vom Gully wegziehen“ – oder die Hände auf den Traum im Tank beziehen.
4. **Endkarte Kap. 2 „Du weißt es jetzt. / Sie auch.“** – „sie“ ist bewusst offen. Mit dem neuen Gedanken zu Beginn von Kap. 3 bleibt das Rätsel und das Ziel ist trotzdem klar. Falls es noch zu dunkel ist: „Sie auch. Und sie hat Lucy.“
5. **„Das ist der Anruf von damals.“** (Bibel Kap. 3 UK 3) – „damals“ für einen Anruf von vor gut einem Tag. Umgesetzt als „der Anruf, der mich hergeholt hat“; bitte für die Bibel bestätigen.

## Beobachtung am Rand (nicht geändert)

Sprecherkennung für Lukes gesprochene Zeilen: Kap. 1/2 „LUKE“, Kap. 3 „DU“ (Justin-Bank, kapitel3, lucy3). Wer es nicht weiß, liest „DU:“ als fremde Figur. Einheitlich „LUKE“ wäre klarer; betrifft viele Module, deshalb nur notiert.
