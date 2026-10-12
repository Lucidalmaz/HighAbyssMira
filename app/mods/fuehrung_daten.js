// ERZEUGT von app/tools/fuehrung_daten.mjs aus docs/gameplay/fuehrung_texte.json – nicht von Hand ändern (Texte dort ändern, Skript erneut ausführen).
const FS_D = {
 "kk": {
  "1": {
   "kopf": "KAPITEL 1 · KELLER BLEIBT ZU",
   "ortzeit": "Lost Eyengless · Mittwoch, 4. November · kurz nach elf Uhr abends",
   "ziel": "Finde Haus Nr. 7. Lucy hat dort etwas hinterlassen."
  },
  "2": {
   "kopf": "KAPITEL 2 · DAS ACHTE KIND",
   "ortzeit": "Amt für Rückführung · Ebene −2 · Donnerstag, 5. November · kurz nach eins",
   "ziel": "Finde Lucy. Irgendwo hier unten summt sie."
  },
  "3": {
   "kopf": "KAPITEL 3 · ICH KOMME",
   "ortzeit": "Lost Eyengless · Donnerstag, 5. November · 03:13",
   "ziel": "Hol Lucy zurück. Finde heraus, was mit Lost Eyengless geschehen ist."
  },
  "4": {
   "kopf": "KAPITEL 4 · SEHEN, BERGEN, SCHWEIGEN",
   "ortzeit": "Lost Eyengless · Donnerstag, 5. November · Morgen, Nebel",
   "ziel": "Sieh nach Lucy. Dann die Villa Seiler: acht Schlüsselteile."
  },
  "5": {
   "kopf": "KAPITEL 5 · ISS AUF, BRUDER",
   "ortzeit": "Lost Eyengless · Donnerstag, 5. November · Abend",
   "ziel": "Lucy schläft bei Vegas. Bleib in ihrer Nähe."
  },
  "6": {
   "kopf": "KAPITEL 6 · WENDIGO",
   "ortzeit": "Forbidden Dustwoods · Freitag, 6. November · kurz nach zwei Uhr nachts",
   "ziel": "Finde den Jungen mit deinem Namen. Er ist im Wald."
  }
 },
 "bisher": {
  "2": [
   "Lucy ist seit dem 23. Oktober weg. Ihr Anruf hat mich nach Nr. 7 geholt.",
   "Im Keller war etwas eingesperrt, mit Lucys Stimme. Ich habe die Tür aufgemacht.",
   "Jetzt ist Frau Wendt fort. Und hinter der Zeichnungswand beginnt ein Gang."
  ],
  "3": [
   "Unter Nr. 7 liegt ein Amt. Es hat 2009 sieben Kinder ausgelost. Die Eltern unterschrieben.",
   "Akte 08 bin ich: Rückläufer, braune Augen. Der Hund hieß Flocke. Das wusste ich nicht.",
   "Lucy war im Tank. Dann war sie fort, und das graue Gesicht hat durch meine Augen gesehen."
  ],
  "4": [
   "Lucy ist zurück. Sie friert.",
   "Ein Ritter sucht seit 700 Jahren seine Tochter. Sie hat durch meine Augen gesucht.",
   "Ich bin nicht der, mit dem Lucy geboren ist."
  ],
  "5": [
   "Die vom Amt haben ein Bett für mich gemacht.",
   "Ein Ring passt in meine Narbe.",
   "Oben in der Villa hat eine Frau meinen Namen gesagt."
  ],
  "6": [
   "Der Junge im Stall ist der, der ich sein sollte.",
   "Ich hab ihn angesehen, und sie hat es gesehen.",
   "Er ist in einen Wald gelaufen, der kein Echo hat."
  ]
 },
 "phase": {
  "1": [
   "ANKOMMEN",
   "DAS HAUS",
   "DIE KELLERTÜR",
   "DER KELLER",
   "DAS LICHT",
   "VERSTECKEN",
   "DIE WAND"
  ],
  "2": [
   "DER TUNNEL",
   "DAS ARCHIV",
   "DER STROM",
   "DIE ZELLE",
   "DER LANGE GANG",
   "DIE BLECHMÄNNER",
   "DER MESSRAUM",
   "DER SCHACHT"
  ],
  "3": [
   "DIE KREUZUNG",
   "JUSTIN",
   "FUNK UND ZÄHLBUCH",
   "DIE LATERNEN",
   "NIMMERHEIM",
   "DER HOHE ABGRUND"
  ],
  "4": [
   "DER MORGEN",
   "DAS AMT KOMMT",
   "ACHT SCHLÜSSEL",
   "DIE VILLA",
   "DER KÜHLRAUM",
   "DIE TREPPE"
  ],
  "5": [
   "DER ABEND",
   "HAUS NR. 1",
   "DIE SPIELUHR",
   "DER STALL",
   "DAS TAPPEN",
   "DAS BETT"
  ],
  "6": [
   "DER ZAUN",
   "DER WALD",
   "ZAYNS HÜTTE",
   "TIEFER WALD",
   "DER BAU",
   "DER HOCHSITZ"
  ]
 },
 "om": [
  {
   "id": "FS-1-OM-01",
   "k": 1,
   "z1": "AHORNSTRASSE",
   "z2": "Ortsschild · 23 Uhr"
  },
  {
   "id": "FS-1-OM-02",
   "k": 1,
   "z1": "NR. 7",
   "z2": "Hildes Haus"
  },
  {
   "id": "FS-1-OM-03",
   "k": 1,
   "z1": "NR. 7 · KELLER",
   "z2": "unter der Erde"
  },
  {
   "id": "FS-1-OM-04",
   "k": 1,
   "z1": "KREUZUNG",
   "z2": "Telefonzelle · Funkkasten"
  },
  {
   "id": "FS-2-OM-05",
   "k": 2,
   "z1": "AMT FÜR RÜCKFÜHRUNG",
   "z2": "Ebene −2 · Tunnel"
  },
  {
   "id": "FS-2-OM-06",
   "k": 2,
   "z1": "ARCHIV",
   "z2": "Ordnungstafel · Akten"
  },
  {
   "id": "FS-2-OM-07",
   "k": 2,
   "z1": "ZIMMER 7",
   "z2": "Hildes Büro"
  },
  {
   "id": "FS-2-OM-08",
   "k": 2,
   "z1": "SICHERUNGSRAUM",
   "z2": "ohne Strom"
  },
  {
   "id": "FS-2-OM-09",
   "k": 2,
   "z1": "PRÜFRAUM 3",
   "z2": "Zelle"
  },
  {
   "id": "FS-2-OM-10",
   "k": 2,
   "z1": "DER LANGE GANG",
   "z2": "Rohre · Ölfass"
  },
  {
   "id": "FS-2-OM-11",
   "k": 2,
   "z1": "MESSRAUM",
   "z2": "acht Stühle · ein Tank"
  },
  {
   "id": "FS-3-OM-12",
   "k": 3,
   "z1": "KREUZUNG · 03:13",
   "z2": "alle Uhren stehen"
  },
  {
   "id": "FS-3-OM-13",
   "k": 3,
   "z1": "OSTENDE",
   "z2": "Nebel"
  },
  {
   "id": "FS-3-OM-14",
   "k": 3,
   "z1": "NIMMERHEIM · RAUM 1",
   "z2": "Kinderzimmer, Juli 2009"
  },
  {
   "id": "FS-3-OM-15",
   "k": 3,
   "z1": "NIMMERHEIM · RAUM 2",
   "z2": "Hildes Küche"
  },
  {
   "id": "FS-3-OM-16",
   "k": 3,
   "z1": "NIMMERHEIM · RAUM 3",
   "z2": "die Nacht von 1312"
  },
  {
   "id": "FS-3-OM-17",
   "k": 3,
   "z1": "DER HOHE ABGRUND",
   "z2": ""
  },
  {
   "id": "FS-4-OM-18",
   "k": 4,
   "z1": "AHORNSTRASSE · MORGEN",
   "z2": "Nebel, die Laternen sind aus"
  },
  {
   "id": "FS-4-OM-19",
   "k": 4,
   "z1": "NR. 3",
   "z2": "Vegas"
  },
  {
   "id": "FS-4-OM-20",
   "k": 4,
   "z1": "NR. 9",
   "z2": "vernagelt seit 2009"
  },
  {
   "id": "FS-4-OM-21",
   "k": 4,
   "z1": "VILLA SEILER · GARTEN",
   "z2": "Prägepresse"
  },
  {
   "id": "FS-4-OM-22",
   "k": 4,
   "z1": "VILLA SEILER · HALLE",
   "z2": "acht Schlösser"
  },
  {
   "id": "FS-4-OM-23",
   "k": 4,
   "z1": "ZELLE OST · KÜHLRAUM",
   "z2": "Nicht öffnen"
  },
  {
   "id": "FS-5-OM-24",
   "k": 5,
   "z1": "NR. 3 · VERANDA",
   "z2": "Abend"
  },
  {
   "id": "FS-5-OM-25",
   "k": 5,
   "z1": "NR. 1",
   "z2": "Küche · vier Gedecke"
  },
  {
   "id": "FS-5-OM-26",
   "k": 5,
   "z1": "KINDERZIMMER",
   "z2": "Lucys Spieluhr"
  },
  {
   "id": "FS-5-OM-27",
   "k": 5,
   "z1": "STALL AM HOF",
   "z2": "Brot, Augen zu"
  },
  {
   "id": "FS-5-OM-28",
   "k": 5,
   "z1": "FRIEDHOF",
   "z2": "Gedenkfeld · offenes Grab"
  },
  {
   "id": "FS-6-OM-29",
   "k": 6,
   "z1": "NORDZAUN",
   "z2": "das Gitter"
  },
  {
   "id": "FS-6-OM-30",
   "k": 6,
   "z1": "DUSTWOODS",
   "z2": "Lichtung"
  },
  {
   "id": "FS-6-OM-31",
   "k": 6,
   "z1": "ZAYNS HÜTTE",
   "z2": ""
  },
  {
   "id": "FS-6-OM-32",
   "k": 6,
   "z1": "TIEFER WALD",
   "z2": "Hochsitz"
  },
  {
   "id": "FS-6-OM-33",
   "k": 6,
   "z1": "AMTSBUS",
   "z2": "sieben Kindersitze"
  },
  {
   "id": "FS-6-OM-34",
   "k": 6,
   "z1": "FRASSSTELLE",
   "z2": "hier ist es still"
  },
  {
   "id": "FS-6-OM-35",
   "k": 6,
   "z1": "DER BAU",
   "z2": "Wrack"
  }
 ],
 "zl": [
  {
   "id": "FS-1-ZL-01",
   "k": 1,
   "text": "Finde Haus Nr. 7. Lucy hat dich dorthin gerufen.",
   "alt": "Lucy hat angerufen: „Haus Nummer 7. Der Keller.“ Finde Haus Nr. 7."
  },
  {
   "id": "FS-1-ZL-03",
   "k": 1,
   "text": "Durchsuche Nr. 7. Lucys Zettel nennt ein Band im Keller.",
   "alt": "Durchsuche Haus Nr. 7. Lucy hat dir ein Band im Keller hinterlassen."
  },
  {
   "id": "FS-1-ZL-05",
   "k": 1,
   "text": "Finde im Keller, was Lucy hinterlassen hat.",
   "alt": "Finde heraus, was Lucy hinterlassen hat."
  },
  {
   "id": "FS-1-ZL-06",
   "k": 1,
   "text": "Etwas ist an dir vorbei die Treppe hinauf. Geh nach oben.",
   "alt": "Irgendwas ist an dir vorbei die Treppe hoch. Hinterher."
  },
  {
   "id": "FS-1-ZL-07",
   "k": 1,
   "text": "Der Strom ist weg. Geh nach draußen und sieh nach, was da kommt.",
   "alt": "Der Strom ist weg, die Laternen erlöschen. Geh nach draußen und sieh nach, was da kommt."
  },
  {
   "id": "FS-1-ZL-08",
   "k": 1,
   "text": "Versteck dich vor dem Licht. Zurück in den Keller von Nr. 7.",
   "alt": "Versteck dich vor dem Licht. Zurück in den Keller – unter der Erde sieht sie dich nicht."
  },
  {
   "id": "FS-1-ZL-09",
   "k": 1,
   "text": "Hilde hat auf die Zeichnungswand gezeigt. Leg die Hand an die Zeichnungen.",
   "alt": "Hilde hat auf die Zeichnungswand gezeigt. Leg die Hand an die Zeichnungen."
  },
  {
   "id": "FS-2-ZL-03",
   "k": 2,
   "text": "Ordne die Namen an der Tafel im Archiv: Wer zuerst zurückkam, steht links.",
   "alt": "Bring die Namen in die richtige Reihenfolge. Die Ordnungstafel im Archiv: wer zuerst zurückkam, steht links."
  },
  {
   "id": "FS-2-ZL-05",
   "k": 2,
   "text": "Die Stahltür im Osten braucht Strom. Finde den Sicherungsraum.",
   "alt": "Ohne Strom geht die Stahltür im Osten nicht auf. Finde den Sicherungsraum und schalte den Strom ein."
  },
  {
   "id": "FS-2-ZL-06",
   "k": 2,
   "text": "Der Strom ist da. Weiter nach Osten – die Stahltür sollte jetzt aufgehen.",
   "alt": "Der Strom ist da. Weiter nach Osten – die Stahltür sollte jetzt aufgehen."
  },
  {
   "id": "FS-2-ZL-08",
   "k": 2,
   "text": "SCHÜTTLE SIE AB: Maus wild bewegen oder A und D abwechselnd hämmern",
   "alt": "SCHÜTTEL SIE AB — Maus wild bewegen, A/D hämmern | SCHÜTTLE SIE AB — Maus wild bewegen oder A und D abwechselnd hämmern"
  },
  {
   "id": "FS-2-ZL-09",
   "k": 2,
   "text": "Die östliche Stahltür ist frei. Geh weiter.",
   "alt": "Die östliche Stahltür ist frei. Geh weiter."
  },
  {
   "id": "FS-2-ZL-13",
   "k": 2,
   "text": "Lies die achte Akte. Das Fach neben dem Klavier ist offen.",
   "alt": "Lies die achte Akte."
  },
  {
   "id": "FS-2-ZL-14",
   "k": 2,
   "text": "Lucy. Sie ist im Tank. Sprich mit ihr.",
   "alt": "Lucy."
  },
  {
   "id": "FS-2-ZL-17",
   "k": 2,
   "text": "Raus hier. In der Decke steht eine Luke offen. Die Leiter führt hinauf.",
   "alt": "Raus hier. In der Decke steht eine Luke offen – eine Leiter führt nach oben."
  },
  {
   "id": "FS-3-ZL-03",
   "k": 3,
   "text": "Justin steht an der Kreuzung. Sprich mit ihm, sieh dich um – oder geh los.",
   "alt": "Justin steht an der Kreuzung. Sprich mit ihm, sieh dich um – oder geh los."
  },
  {
   "id": "FS-3-ZL-04",
   "k": 3,
   "text": "Lösch die Laternen, dann muss sie herunter. Frau Wendts Notizen und der Funkkasten helfen.",
   "alt": "Die Laternen müssen aus, dann muss sie herunter. Wie, steht bei Frau Wendt in Nr. 7 – und der Funkkasten an der Kreuzung spricht noch."
  },
  {
   "id": "FS-3-ZL-05",
   "k": 3,
   "text": "Lösch die Laternen vor den Häusern in der Reihenfolge, in der sie die Kinder geholt hat.",
   "alt": "Lösch die Laternen vor den Häusern – in der Reihenfolge, … | …, in der Reihenfolge, …"
  },
  {
   "id": "FS-3-ZL-08",
   "k": 3,
   "text": "Geh weiter. Der Raum baut sich vor dir auf.",
   "alt": "Geh weiter. Tiefer nach Nimmerheim."
  },
  {
   "id": "FS-3-ZL-09",
   "k": 3,
   "text": "Der Hohe Abgrund. Nimm Justins Hand und geh hinein.",
   "alt": "Der Hohe Abgrund. Geh hinein."
  },
  {
   "id": "FS-3-ZL-13",
   "k": 3,
   "text": "Eine Erinnerung lügt. Sieh genau hin: Wo enden die Spuren?",
   "alt": "Eine Erinnerung lügt. Sieh genau hin."
  },
  {
   "id": "FS-3-ZL-15",
   "k": 3,
   "text": "Atlantschiss, die versunkene Stadt. Finde, was hier unten erinnert. Zurück: die Leiter.",
   "alt": "Atlantschiss, die versunkene Stadt. Finde, was hier unten erinnert. Die Leiter führt zurück."
  },
  {
   "id": "FS-4-ZL-00",
   "k": 4,
   "text": "Sieh nach Lucy. Sie liegt bei Vegas in Nr. 3.",
   "alt": "(keine Zielzeile bis zu den Schlüsselteilen; Intro setzt direkt 'Die Villa Seiler. Dir fehlen noch N Schlüsselteile – frag den Raben.')"
  },
  {
   "id": "FS-4-ZL-02",
   "k": 4,
   "text": "Die Villa Seiler. Sieh dich in der Halle um.",
   "alt": "Die Villa Seiler. Sieh dich um."
  },
  {
   "id": "FS-4-ZL-03",
   "k": 4,
   "text": "Die Villa Seiler. Die Presse im Garten fügt die acht Teile zusammen.",
   "alt": "Die Villa Seiler. Die Presse im Garten fügt die acht Teile zusammen."
  },
  {
   "id": "FS-5-ZL-01",
   "k": 5,
   "text": "Lucy schläft bei Vegas. Warte auf der Veranda von Nr. 3.",
   "alt": "Lucy schläft bei Vegas. Warte auf der Veranda."
  },
  {
   "id": "FS-5-ZL-02",
   "k": 5,
   "text": "Lucy ist am Fenster von Nr. 3. Geh hin.",
   "alt": "Lucy. Am Fenster."
  },
  {
   "id": "FS-5-ZL-05",
   "k": 5,
   "text": "Nr. 1. Wer deckt da den Tisch?",
   "alt": "Nr. 1. Wer deckt da den Tisch?"
  },
  {
   "id": "FS-5-ZL-10",
   "k": 5,
   "text": "Die Telefonzelle klingelt.",
   "alt": "Die Telefonzelle klingelt."
  },
  {
   "id": "FS-5-ZL-12",
   "k": 5,
   "text": "Hinterher.",
   "alt": "Hinterher."
  },
  {
   "id": "FS-6-ZL-01",
   "k": 6,
   "text": "Hinter dem Gitter ist der Junge. Aber erst: Wer parkt da hinter dir?",
   "alt": "Hinter dem Gitter ist der Junge. Aber erst: wer parkt da hinter dir?"
  },
  {
   "id": "FS-6-ZL-02",
   "k": 6,
   "text": "Das Gitter aufbiegen: E halten. Der Junge ist darunter durch.",
   "alt": "Das Gitter aufbiegen: E halten, am Gitter. Der Junge ist darunter durch."
  },
  {
   "id": "FS-6-ZL-03",
   "k": 6,
   "text": "Der Hochsitz. Whiskey wartet oben.",
   "alt": "Der Hochsitz."
  }
 ],
 "wa": [
  {
   "id": "FS-1-WA-01",
   "k": 1,
   "rx": "^Finde Haus Nr\\. 7",
   "text": "Lucy ist seit dem 23. weg. Ihr Anruf sagte nur: Haus Nummer 7. Der Keller."
  },
  {
   "id": "FS-1-WA-03",
   "k": 1,
   "rx": "Durchsuche Nr\\. 7",
   "text": "Der Schlüssel hing an Lucys Panda. Sie war hier. Das Band liegt im Keller."
  },
  {
   "id": "FS-1-WA-06",
   "k": 1,
   "rx": "die Treppe hinauf\\. Geh nach oben",
   "text": "Das Band ist zu Ende, die Gurte sind offen. Was auch immer das war: Es ist nach oben."
  },
  {
   "id": "FS-1-WA-07",
   "k": 1,
   "rx": "Der Strom ist weg\\. Geh nach draußen",
   "text": "Das Brummen hat aufgehört. Wenn die Laternen ausgehen, will ich wissen, wer sie ausmacht."
  },
  {
   "id": "FS-1-WA-09",
   "k": 1,
   "rx": "Leg die Hand an die Zeichnungen",
   "text": "Hilde hat auf die Wand gezeigt, nicht auf mich. Sie wusste, was dahinter ist."
  },
  {
   "id": "FS-2-WA-05",
   "k": 2,
   "rx": "Stahltür im Osten braucht Strom",
   "text": "Ohne Strom bleibt die Stahltür zu. Und ohne die Tür komm ich hier nicht weiter."
  },
  {
   "id": "FS-2-WA-13",
   "k": 2,
   "rx": "Lies die achte Akte",
   "text": "Sieben Kinder, sieben Akten. Und eine achte. Ich muss wissen, wer das ist."
  },
  {
   "id": "FS-2-WA-14",
   "k": 2,
   "rx": "^Lucy\\. Sie ist im Tank",
   "text": "Der Tank ist offen. Sie hat gesummt, und jetzt sieht sie mich an."
  },
  {
   "id": "FS-3-WA-05",
   "k": 3,
   "rx": "Lösch die Laternen vor den Häusern",
   "text": "Die Laternen sind ihre Augen. Wenn ich sie richtig ausmache, sieht sie mich nicht kommen."
  },
  {
   "id": "FS-4-WA-00",
   "k": 4,
   "rx": "Sieh nach Lucy\\. Sie liegt bei Vegas",
   "text": "Sie hat gefroren, als ich sie zuletzt gesehen hab. Erst Lucy, dann alles andere."
  },
  {
   "id": "FS-5-WA-02",
   "k": 5,
   "rx": "Lucy ist am Fenster",
   "text": "Sie klopft. Sie will mir etwas sagen, das Vegas nicht hören soll."
  },
  {
   "id": "FS-5-WA-05",
   "k": 5,
   "rx": "Nr\\. 1\\. Wer deckt da den Tisch",
   "text": "Nr. 1 ist unser Haus. Mamas Haus. Da wohnt keiner mehr, und trotzdem klappert Geschirr."
  }
 ],
 "gf": [
  {
   "id": "FS-1-GF-03",
   "k": 1,
   "rx": "Durchsuche Nr\\. 7",
   "text": "Irgendwo hier muss es einen Hinweis geben. Zettel, Kalender, alles, was Hilde aufgeschrieben hat."
  },
  {
   "id": "FS-2-GF-15",
   "k": 2,
   "rx": "Peter ins Öl locken",
   "text": "Peter folgt dem Licht. Das Öl im Fass, oder die Notentriegelung an der Wand. Eins davon."
  },
  {
   "id": "FS-2-GF-16",
   "k": 2,
   "rx": "Weiter in den Messraum",
   "text": "Der Gang geht weiter nach Osten. Am Ende liegt der Messraum."
  },
  {
   "id": "FS-2-GF-18",
   "k": 2,
   "rx": "Der Messraum\\. (Hier ist es passiert|Das Klavier)",
   "text": "Der Raum mit den Stühlen im Kreis. Das Klavier steht an der Wand, das Fach daneben."
  },
  {
   "id": "FS-2-GF-19",
   "k": 2,
   "rx": "Die Matratze\\. Da glänzt was",
   "text": "In der Zelle glänzt etwas auf der Matratze. Hinsehen kostet nichts."
  },
  {
   "id": "FS-3-GF-16",
   "k": 3,
   "rx": "^Geh Justin nach",
   "text": "Justin geht voraus. Nicht zu weit zurückfallen."
  },
  {
   "id": "FS-1-GF-05",
   "k": 1,
   "rx": "im Keller, was Lucy hinterlassen",
   "text": "Lucy war hier unten. Etwas zum Anhören: ein Kassettenrekorder, bei der Zeichnungswand."
  },
  {
   "id": "FS-1-GF-06",
   "k": 1,
   "rx": "die Treppe hinauf\\. Geh nach oben",
   "text": "Die Kellertreppe. Die Haustür war vorhin zu."
  },
  {
   "id": "FS-1-GF-07",
   "k": 1,
   "rx": "Der Strom ist weg\\. Geh nach draußen",
   "text": "Das Brummen. Die Laternen gehen aus, eine nach der anderen. Raus, nicht festsitzen."
  },
  {
   "id": "FS-2-GF-03",
   "k": 2,
   "rx": "Ordne die Namen an der Tafel",
   "text": "Wer zuerst zurückkam, steht links. Die Zeiten stehen in den Akten."
  },
  {
   "id": "FS-2-GF-05",
   "k": 2,
   "rx": "Stahltür im Osten braucht Strom",
   "text": "Sechs Hebel. Wer schon leuchtet, bleibt in Ruhe."
  },
  {
   "id": "FS-2-GF-06",
   "k": 2,
   "rx": "Der Strom ist da\\. Weiter nach Osten",
   "text": "Nach Osten. Der Strom ist an, also muss die Stahltür aufgehen."
  },
  {
   "id": "FS-2-GF-09",
   "k": 2,
   "rx": "östliche Stahltür ist frei",
   "text": "Offen. Weiter nach Osten, so weit der Gang geht."
  },
  {
   "id": "FS-2-GF-13",
   "k": 2,
   "rx": "Lies die achte Akte",
   "text": "Das Fach an der Westwand, neben dem Klavier. Die Akte ohne Namen."
  },
  {
   "id": "FS-2-GF-14",
   "k": 2,
   "rx": "^Lucy\\. Sie ist im Tank",
   "text": "Sie wartet im Tank. Hingehen, ansprechen."
  },
  {
   "id": "FS-2-GF-17",
   "k": 2,
   "rx": "Die Leiter führt hinauf",
   "text": "Die Leiter. Nach oben. Nicht umdrehen."
  },
  {
   "id": "FS-3-GF-03",
   "k": 3,
   "rx": "Justin steht an der Kreuzung",
   "text": "Er steht an der Kreuzung und tut nichts. Hingehen, ansprechen."
  },
  {
   "id": "FS-3-GF-04",
   "k": 3,
   "rx": "Lösch die Laternen, dann muss sie herunter",
   "text": "Frau Wendt in Nr. 7 hat ihre Nächte notiert. Und der Funkkasten spricht noch."
  },
  {
   "id": "FS-3-GF-08",
   "k": 3,
   "rx": "Geh weiter\\. Der Raum baut sich",
   "text": "Nur ein Weg: weiter, wo sich der Raum aufbaut. Justin geht voraus."
  },
  {
   "id": "FS-3-GF-09",
   "k": 3,
   "rx": "Der Hohe Abgrund\\. Nimm Justins Hand",
   "text": "Das Weiße vor mir ist der Rand. Justin hat gesagt: Nicht loslassen."
  },
  {
   "id": "FS-3-GF-13",
   "k": 3,
   "rx": "Eine Erinnerung lügt",
   "text": "Die Spuren enden am Rand. Sieh hin, wo sie aufhören."
  },
  {
   "id": "FS-3-GF-15",
   "k": 3,
   "rx": "Atlantschiss",
   "text": "Eine Stadt unter dem Dorf. Alles Wichtige steht irgendwo auf Wänden und Schildern."
  },
  {
   "id": "FS-4-GF-00",
   "k": 4,
   "rx": "Sieh nach Lucy\\. Sie liegt bei Vegas",
   "text": "Nr. 3, die Veranda. Vegas macht auf, wenn man klopft."
  },
  {
   "id": "FS-4-GF-02",
   "k": 4,
   "rx": "Die Villa Seiler\\. Sieh dich in der Halle um",
   "text": "Die Halle hat mehr als eine Tür. Erst alle ansehen, dann eine nehmen."
  },
  {
   "id": "FS-4-GF-03",
   "k": 4,
   "rx": "Die Presse im Garten fügt",
   "text": "Die Presse steht im Garten und braucht Strom. Acht Teile hinein, ein Schlüssel heraus."
  },
  {
   "id": "FS-5-GF-01",
   "k": 5,
   "rx": "Warte auf der Veranda",
   "text": "Auf der Veranda von Nr. 3 warten. Vegas redet durch den Türspalt."
  },
  {
   "id": "FS-5-GF-02",
   "k": 5,
   "rx": "Lucy ist am Fenster",
   "text": "Das Fenster neben der Veranda. Sie klopft, sie will etwas sagen."
  },
  {
   "id": "FS-5-GF-05",
   "k": 5,
   "rx": "Nr\\. 1\\. Wer deckt da den Tisch",
   "text": "Licht in Nr. 1, zum ersten Mal seit Mama. Erst ansehen, dann hineingehen."
  },
  {
   "id": "FS-5-GF-10",
   "k": 5,
   "rx": "Die Telefonzelle klingelt",
   "text": "Wieder die Zelle. Diesmal hör ich auf die Spieluhr unter der Stimme."
  },
  {
   "id": "FS-5-GF-12",
   "k": 5,
   "rx": "^Hinterher\\.$",
   "text": "Er läuft vor mir. Ich folge dem Tappen, so weit es geht."
  },
  {
   "id": "FS-6-GF-01",
   "k": 6,
   "rx": "[Ww]er parkt da hinter dir",
   "text": "Hinter mir steht ein Wagen. Erst klären, wer das ist, dann durchs Gitter."
  },
  {
   "id": "FS-6-GF-02b",
   "k": 6,
   "rx": "Das Gitter aufbiegen",
   "text": "Er hat sich durchgezwängt. Ich muss nur lange genug drücken."
  },
  {
   "id": "FS-6-GF-03",
   "k": 6,
   "rx": "^Der Hochsitz\\. Whiskey wartet oben",
   "text": "Whiskey ist vorausgeflogen. Ihm nach, dann die Leiter hinauf."
  }
 ],
 "tp": [
  {
   "id": "FS-1-TP-01",
   "k": 1,
   "text": "Gehen: W A S D. Umsehen: Maus. / Springen: Leertaste.",
   "zeilen": [
    "Gehen: W A S D. Umsehen: Maus.",
    "Springen: Leertaste."
   ]
  },
  {
   "id": "FS-1-TP-02",
   "k": 1,
   "text": "Shift halten: rennen.",
   "zeilen": [
    "Shift halten: rennen."
   ]
  },
  {
   "id": "FS-1-TP-03",
   "k": 1,
   "text": "F: Taschenlampe an und aus. / R: Batterie wechseln.",
   "zeilen": [
    "F: Taschenlampe an und aus.",
    "R: Batterie wechseln."
   ]
  },
  {
   "id": "FS-1-TP-04",
   "k": 1,
   "text": "E halten: aufstemmen, aufschieben, klettern.",
   "zeilen": [
    "E halten: aufstemmen, aufschieben, klettern."
   ]
  },
  {
   "id": "FS-1-TP-05",
   "k": 1,
   "text": "Z: Ziel noch einmal zeigen. / Tab: Fibel, Reiter WAS JETZT?",
   "zeilen": [
    "Z: Ziel noch einmal zeigen.",
    "Tab: Fibel, Reiter WAS JETZT?"
   ]
  },
  {
   "id": "FS-1-TP-06",
   "k": 1,
   "text": "M: Karte. Sie füllt sich, wo du gewesen bist.",
   "zeilen": [
    "M: Karte. Sie füllt sich, wo du gewesen bist."
   ]
  },
  {
   "id": "FS-1-TP-07",
   "k": 1,
   "text": "Eingesteckt. Tab, Reiter INVENTAR: / ansehen und kombinieren.",
   "zeilen": [
    "Eingesteckt. Tab, Reiter INVENTAR:",
    "ansehen und kombinieren."
   ]
  },
  {
   "id": "FS-1-TP-08",
   "k": 1,
   "text": "Strg: ducken. Leertaste an Kanten: hochziehen.",
   "zeilen": [
    "Strg: ducken. Leertaste an Kanten: hochziehen."
   ]
  },
  {
   "id": "FS-1-TP-09",
   "k": 1,
   "text": "Hecken, Autos, Tonnen: dahinter bist du im Schatten. / Lampe aus (F): sie sehen dich später.",
   "zeilen": [
    "Hecken, Autos, Tonnen: dahinter bist du im Schatten.",
    "Lampe aus (F): sie sehen dich später."
   ]
  },
  {
   "id": "FS-1-TP-10",
   "k": 1,
   "text": "Enter oder Klick: weiter. / X: alles überspringen.",
   "zeilen": [
    "Enter oder Klick: weiter.",
    "X: alles überspringen."
   ]
  },
  {
   "id": "FS-1-TP-11",
   "k": 1,
   "text": "Gespeichert wird an Speicherpunkten. / Festgesteckt? Esc, dann FESTGESTECKT?.",
   "zeilen": [
    "Gespeichert wird an Speicherpunkten.",
    "Festgesteckt? Esc, dann FESTGESTECKT?."
   ]
  },
  {
   "id": "FS-2-TP-01",
   "k": 2,
   "text": "Leertaste halten: Atem anhalten. / Lampe aus, nicht bewegen.",
   "zeilen": [
    "Leertaste halten: Atem anhalten.",
    "Lampe aus, nicht bewegen."
   ]
  },
  {
   "id": "FS-2-TP-02",
   "k": 2,
   "text": "Q halten: Augen zu.",
   "zeilen": [
    "Q halten: Augen zu."
   ]
  },
  {
   "id": "FS-2-TP-03",
   "k": 2,
   "text": "Maus wild bewegen oder A und D abwechselnd hämmern.",
   "zeilen": [
    "Maus wild bewegen oder A und D abwechselnd hämmern."
   ]
  },
  {
   "id": "FS-3-TP-01",
   "k": 3,
   "text": "G: Kinderblick. Er zeigt, wo man suchen muss. / Er lädt sich langsam wieder auf.",
   "zeilen": [
    "G: Kinderblick. Er zeigt, wo man suchen muss.",
    "Er lädt sich langsam wieder auf."
   ]
  },
  {
   "id": "FS-3-TP-02",
   "k": 3,
   "text": "Regler drehen, bis das Rauschen kippt. / Wort auf Kanal: schreiben, senden.",
   "zeilen": [
    "Regler drehen, bis das Rauschen kippt.",
    "Wort auf Kanal: schreiben, senden."
   ]
  },
  {
   "id": "FS-5-TP-01",
   "k": 5,
   "text": "C: Kamera heben. Klick: abdrücken. / Es sind nur drei Bilder.",
   "zeilen": [
    "C: Kamera heben. Klick: abdrücken.",
    "Es sind nur drei Bilder."
   ]
  },
  {
   "id": "FS-5-TP-02",
   "k": 5,
   "text": "Q halten: Augen zu. Nicht hinsehen.",
   "zeilen": [
    "Q halten: Augen zu. Nicht hinsehen."
   ]
  },
  {
   "id": "FS-6-TP-01",
   "k": 6,
   "text": "Kriechen: Unter 70 cm Höhe geht es nur geduckt. / Strg halten.",
   "zeilen": [
    "Kriechen: Unter 70 cm Höhe geht es nur geduckt.",
    "Strg halten."
   ]
  },
  {
   "id": "FS-6-TP-02",
   "k": 6,
   "text": "R: Batterie wechseln. Danach E: Feuerzeug.",
   "zeilen": [
    "R: Batterie wechseln. Danach E: Feuerzeug."
   ]
  }
 ],
 "sc": {
  "FS-1-KZ-01": "Weiße Kinderkreide. Alle Pfeile zeigen die Straße hinunter, nach Osten. / Ich folge ihnen. Besser als gar kein Plan.",
  "FS-1-KZ-02": "Weiß: Kinderkreide, alt und frisch, zeigt nach Osten. / Blau mit Kreis am Schaft: Lucys Zeichen. / Gelb: meine eigene Kreide (K).",
  "FS-1-KZ-03": "Blau, mit Kreis am Schaft. Lucys Pfeil. / Der führt von Nr. 7 weg, den Kirchweg hinauf. Gegen die weißen.",
  "FS-1-KZ-04": "(kein Text)",
  "FS-1-SC-01": "Lost Eyengless. „Einwohner 214“, zweimal rot durchgestrichen. Darunter: 211. / Darunter ein Bleistiftstrich. Als hätte jemand schon angesetzt, sie wieder zu ändern.",
  "FS-1-SC-03": "Lost Eyengless. 214 und 211 sind durchgestrichen. / Darunter, frisch in Kreide: 210.",
  "FS-1-SC-04": "214, dann 211. Irgendwer führt hier Buch.",
  "FS-1-SC-05": "210. Die Kreide ist noch frisch. Frau Wendt ist erst vor Minuten fort.",
  "FS-1-SC-06": "Einw. 214 (durchgestrichen) / 211 (durchgestrichen ab Kap. 2) / 210 (darunter)",
  "FS-1-SC-07": "Einwohner 214. Rot durchgestrichen, darunter 211. / Später: 211 durchgestrichen, darunter 210."
 },
 "sz": [
  {
   "id": "FS-ALLE-SP-01",
   "text": "STIMME VON DRAUSSEN",
   "ausloeser": "Kap. 1 Ostende '… Lu–?'; Kap. 3 Ruf aus dem Nebel"
  },
  {
   "id": "FS-ALLE-SP-02",
   "text": "STIMME AM TELEFON",
   "ausloeser": "Kap. 1 Telefonzelle (bisher 'DAS KIND'), Kap. 5 Zelle (bisher 'ANRUF')"
  },
  {
   "id": "FS-ALLE-SP-03",
   "text": "STIMME IM FUNK",
   "ausloeser": "Kap. 3 vor dem ersten Namen; Amt Kap. 2 AG-06"
  },
  {
   "id": "FS-ALLE-SP-04",
   "text": "FUNK · LUCY",
   "ausloeser": "Kap. 3 Funk-Rätsel"
  },
  {
   "id": "FS-ALLE-SP-05",
   "text": "TONBAND · LUCY",
   "ausloeser": "Kap. 1 UK5"
  },
  {
   "id": "FS-ALLE-SP-06",
   "text": "TONBAND · MAMA",
   "ausloeser": "Kap. 4/5 Villa (Marion 2009)"
  },
  {
   "id": "FS-ALLE-SP-07",
   "text": "TONBAND · PELL",
   "ausloeser": "Kap. 6 Pells Heft/Band"
  },
  {
   "id": "FS-ALLE-SP-08",
   "text": "MAILBOX · KÜHN",
   "ausloeser": "Prolog Aufwachen"
  },
  {
   "id": "FS-ALLE-SP-09",
   "text": "LAUTSPRECHER · AMT",
   "ausloeser": "Kap. 2 Sicherungsraum, Gänge"
  },
  {
   "id": "FS-ALLE-SP-10",
   "text": "LUCY · IM TANK",
   "ausloeser": "Kap. 2 Messraum"
  },
  {
   "id": "FS-ALLE-SP-11",
   "text": "VEGAS · HINTER DER TÜR",
   "ausloeser": "Kap. 1, 4, 5"
  },
  {
   "id": "FS-ALLE-SP-12",
   "text": "DER RABE",
   "ausloeser": "Traum"
  },
  {
   "id": "FS-ALLE-SP-13",
   "text": "KINDERSTIMME",
   "ausloeser": "Kap. 1–3 bis Raum 'Luna' (justin.js luna/name)"
  },
  {
   "id": "FS-ALLE-SP-14",
   "text": "LUNA",
   "ausloeser": "Kap. 3 ab UK 8, Kap. 5, Kap. 6"
  },
  {
   "id": "FS-ALLE-SP-15",
   "text": "NACHBILD · 2009",
   "ausloeser": "alle Nachbilder"
  },
  {
   "id": "FS-ALLE-SP-16",
   "text": "DRUCKER (Papier)",
   "ausloeser": "Kap. 2"
  },
  {
   "id": "FS-1-SZ-01",
   "text": "STIMME VON DRAUSSEN",
   "ausloeser": "kapitel1.js Z.~265 kapitel1_ostTick: subtitle('… Lu–?', 2400, '')"
  },
  {
   "id": "FS-1-SZ-02",
   "text": "KINDERSTIMME · TELEFON",
   "ausloeser": "post.js Z.326 Telefonzelle: 'DAS KIND'"
  },
  {
   "id": "FS-3-SZ-01",
   "text": "KINDERSTIMME",
   "ausloeser": "lucy3.js Z.135: 'KINDERSTIMME'"
  },
  {
   "id": "FS-5-SZ-01",
   "text": "STIMME AM TELEFON",
   "ausloeser": "kapitel5.js K5_W.A = 'ANRUF' (Z.997/999)"
  },
  {
   "id": "FS-5-SZ-02",
   "text": "VEGAS · AM FENSTER",
   "ausloeser": "kapitel5.js Z.1410 k5_jagd: Zeile ohne Sprecher"
  },
  {
   "id": "FS-ALLE-SZ-01",
   "text": "HILDE WENDT",
   "ausloeser": "Hilde: 'HILDE' / 'HILDE WENDT' / 'FRAU WENDT'"
  },
  {
   "id": "FS-ALLE-SZ-02",
   "text": "VEGAS bzw. VEGAS · HINTER DER TÜR",
   "ausloeser": "Vegas: 'VEGAS' / 'LARS VEGAS' / 'HERR VEGAS · HINTER DER TÜR'"
  }
 ]
};
