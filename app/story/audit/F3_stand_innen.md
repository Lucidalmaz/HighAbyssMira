# F3 · Stand „Bewohnt“-Prüfung der Innenräume (Q-8, Kap. 1–5)

Stand 01.10.2026. Modul `app/mods/bewohnt.js` steht in ORDER ganz hinten, nach `raender`.

## Was das Modul tut

- **Aufbau beim Näherkommen, einmal je Raum.** Häuser im Ort ab etwa 9 m Abstand, Amt-Räume ab 10–14 m.
  - Kirchberg-Räume (Nr. 4, Gisela, Pfarrhaus, Kapelle, Schuppen, Posten) baut das Modul vor der Überblendung fertig, über eine Hülle um `kirchberg_rein`.
  - Vegas' Stube baut es im Raumbau der Villa, über eine Hülle um `VILLA_BAU.nr3`, also noch während deren Überblendung.
  - Dauer je Raum 30–260 ms. Nr. 7 braucht beim ersten Mal 0,9 s, weil dort die Modelle laden.
- **Instanzen.** Je Modell und Raum gibt es eine InstancedMesh. Farbvarianten (Buchrücken, Ordner, Jacken) laufen über die Instanzfarbe.
  - Abziehbilder, Papiere, Kabel und Spinnweben sind je Material zu einem Mesh zusammengefasst.
  - Ein Raum kostet 3–29 Zeichenaufrufe und ist nur sichtbar, solange man drin ist.
- **Platzprüfung per Strahl.** Jedes Stück wird so gesetzt:
  - auf freien Boden, auf eine ebene Ablage, flach an eine echte Wandfläche oder an die Wand gelehnt;
  - nie in Türen und nie auf oder in Klickflächen (Kasten-Prüfung);
  - nie im Blick von Raummitte, Tür oder Augenpunkt auf eine Klickfläche (Sicht-Prüfung, Wände zählen).
  - Was nicht passt, fällt weg und landet im Log: `__bw.info().log`.
- **Licht.**
  - Nur `LICHT_HAKEN` (Hemisphäre) und einmalig höhere Stärken der vorhandenen Raumlichter. Es entstehen keine neuen Lichter.
  - Nr. 4: +0,20, oben +0,16, Keller +0,10, Lampen ×1,4.
  - Kapelle: +0,22, Kerzen ×1,8.
- **Kapelle außen.** Das schwarze Brett, also das Fensterbild `kirchberg_S.fensterTex`, das neben der Kapelle in der Luft hing, ist ausgeblendet.
  - Die Klickfläche „Kapellenfenster (mit der Lampe)“ rückt per Strahl auf die echte Kapellenwand (`__bw.info().hit`), sobald man auf 30 m herankommt.
- **Neue Scans** (in `CREDITS.md` schon geführt, Nutzung ergänzt):
  - `ms/lbook` (Leather Book)
  - `ms/geschirr` (Camping Dinnerware: Teller, Becher, Kanne, Besteck)
  - `ms/schirm` (Black Vintage Umbrella)
  - `ms/brille` (Metal Round Glasses)
  - KTX2 ist erzeugt.
- **Testzugriff.** `window.__bw = { bau(id), halt(on), info() }`.

## Räume: wer, was liegt herum, was ist kaputt, was zuletzt benutzt, was dazukam

| Raum | Wer / Geschichte | Dazugekommen (je mit Grund) |
|---|---|---|
| **Nr. 7 Wohnzimmer** | Hilde Wendt (Amt), zählt nachts die Kinder vom Fensterstuhl aus; ist in dieser Nacht an der Kreuzung gestorben | Strickjacke am Haken (ohne sie in den Regen), Schirm an der Wand (nicht mitgenommen), Tasse neben ihrem Stuhl, Strichliste in Fünfergruppen neben dem Fenster, Stapel *Laternenbote* neben dem Sofa, Kondenswasser unter dem Fenster, Spinnwebe |
| Nr. 7 Küche | Abendbrot, dann aufgesprungen (Stuhl umgekippt) | Teller mit Brotkante, Besteck, Tasse; Blechteller-Stapel und Kanne auf der Arbeitsplatte; Einkaufszettel am Kühlschrank „Brot (Zayn)“ |
| Nr. 7 Schlafzimmer | Hilde schläft neben Zayns Kinderbett | Wasserbecher und aufgeschlagenes Buch auf dem Boden am Bett, gerahmtes Foto auf dem Schrank |
| Nr. 7 Hauswirtschaftsraum | Kellertür, Grablichter | nasse Regenjacke an der Wand, Tropffleck darunter |
| Keller Nr. 7 | das Ritual (Stuhl mit Riemen, Spielzeugkreis) | Kabel vom Tonbandgerät zur Steckdose, Blechbecher Wasser vor dem Stuhl, alte Reifen, abgelegte Kette am Eisenbett, Feuchteflecken, Spinnweben |
| **Nr. 1** Wohnzimmer | Elternhaus Brandt, seit 2009 zu, Tücher über den Möbeln | ungeöffnete Post unter dem Briefschlitz, Papas Schirm an der Tür, Bücherstapel (nie eingepackt), Wasserrand unter der Decke |
| Nr. 1 Küche / Kinderzimmer / Eltern | Mama, Lucy, Luke | 2 Teller und Becher (Kakaorand) im Abtropfplatz; Lukes Martinslaterne vom letzten Fest 2009, Kinderzeichnung „MAMA PAPA LUCY LUKE“ mit Laterne, Kinderbücher; Mamas Buch und Wasserglas auf ihrer Bettseite |
| **Nr. 4** EG | Oma Erna Kranz (1934–2020), Zettel überall, Mottenkugeln und Kaffee | Knirps an der Haustür, Pilcher-Romane neben dem Sessel (E-08), Fernsehkabel, Kaffeekanne, Teller und Besteck auf der Arbeitsplatte, Fettfilm über dem Herd, Spinnwebe; **Licht heller** |
| Nr. 4 oben / Keller | Lukes Jugendzimmer (2016); Pfandkisten, Opa Kranz' Tankstelle | Comics und Schulbücher, Fernsehkabel, Zahnputzbecher, Stockfleck im Bad; Winterreifen „KRANZ“, Kartoffelsack, Feuchtefleck, Spinnwebe |
| **Giselas Küche/Stube** | Katzen (17 Näpfe), alle Uhren 3:13, Hänschen 1958 | Napf und Wasser auf Zeitung (für die Nachtkatzen), Strickjacke am Haken, Katzenstreu-Sack, Katzenkalender und Rätselhefte, Fernsehkabel, zweites Foto von Hänschen über dem Herd, Schmutz am Sockel |
| **Pfarrhaus** | Pfarrer Voss, seit 1992 verschwunden; Gisela macht jeden Abend das Licht an | Lesebrille, aufgeschlagene Bibel, Kerzenstummel und Pfeifenasche auf dem Schreibtisch, schwarzer Schirm an der Tür, Radiokabel, Predigtliteratur-Stapel, 34 Jahre Spinnweben, Ruß über der Birne |
| **Kapelle** | Laternenfest fällt aus („Keine Laternen im Freien“) | eingesammelte Martinslaternen an der Tür, liegengebliebene Gesangbücher auf den Bänken, **brennende Votivkerzen vor der Madonna** (Flammen), Opferstock, Wachs vor dem Altar, Spinnweben hoch oben; **Licht heller** |
| **Günthers Schuppen** | Postbote Günther Maas, gelbe Regenjacke, „Zigaretten für schlechte Zeiten“ | zweite gelbe Regenjacke, Thermoskanne und Becher (Nachtrunde), Aschenbecher, Reifen und Kanister (REIFEN – KRANZ), Fahrradkette, Werbeprospekte, Radiokabel |
| **Nr. 9 Posten** | Messstelle, Nachtdienst | Aschenbecher, Feuerzeug, Becher, Dienstjacke, Müllsack, Kabel von Funk und Kamera |
| **Nr. 3 Vegas** (Kap. 4) | Verschwörungen, drei Funkgeräte, Bruno ist zurück (frisst keinen Speck) | Brunos Napf (unberührt) und Kette, Liegeplatz an der Tür, Ordnerstapel „(hw)“, Wasserkanister (Notvorrat), Aschenbecher, Kabelsalat und Antenne zum Fenster, „Wand der Wahrheit“ mit Zeitungsausschnitten zwischen den Folienfenstern |
| **Amt** Tunnel / Wartebereich | Wartebereich für Begleitpersonen, seit 2012 leer | vergessener Schirm, Teddy neben dem ersten Wartestuhl, *Laternenbote* von 2009 auf einem Stuhl, Becher, halb heruntergerissener Kabelkanal, Wasserflecken |
| Amt Archiv / Registratur | Akten, die nicht mehr passten | Ordnerstapel, heruntergefallene Blätter, Kaffeetasse mit Schimmelrand, ausgetretener Laufweg |
| Amt Kantine | letztes Mittagessen März 2012 | Blechteller mit Gabel, Becher, Löffel auf den Tischen, Fleck |
| Amt Sicherung / Planung / Prüfraum 3 / Gang | Technik, Modellbau, Prüfung | Hauptleitung zum Kasten mit Rußfleck; Pinselbecher und Skizzen; Flecken und Spinnweben; Kabelkanal und Wasserläufe im Gang |
| **Zimmer 7** (Hildes Büro) | hier zog sie 2009 „WENDT, Z.“ | ihr Schirm an der Tür, Vorgänge Zyklus 2009 als Stapel, Papierkorb mit zerknülltem Blatt, Laufweg |

**Nicht begehbar, darum ohne Einrichtung:**
- Nr. 7 oben gibt es nicht.
- Roxys Laube, Hildes Laube, Stall und Scheune sind geschlossene Außenmodelle.
- `remise.js` fehlt (noch).
- Der Messraum ist Schreckszene und Rätsel; dort wurde bewusst nichts gestellt.

## Geprüft (ein Bildlauf)

- Lauf: `C:/Users/GIGABYTE/_bewohnt/shots/*_vorher.png` / `*_nachher.png`, 20 Raumansichten plus Kapelle außen.
  - Je Raum dieselbe Kamera vor dem Aufbau (`__bw.halt`) und danach.
  - Alle 21 Räume bauen fehlerfrei.
- Das schwarze Brett ist weg.
- Nach dem Lauf nachgebessert, nicht neu geprüft:
  - Stücke, die im Lauf keinen Platz fanden, haben neue Hinweise bekommen. Betroffen sind Jacken in Nr. 7, Gisela und Pfarrhaus, Schirme in Pfarrhaus und Zimmer 7, die Kantinentische (niedrigere Platte) und die Schuppen-Ablage.
  - Hinzugekommen sind Strichliste, Einkaufszettel, Kinderzeichnung, Katzenstreu, Kanister und Brunos Kette.
  - Lichtwerte in Nr. 4 und Kapelle sind höher.
  - Die Klickfläche des Kapellenfensters wird jetzt per Strahl zur Kapellenmitte gesetzt; der erste Ansatz fand keine Wand.
- Was nicht passt, fällt weiterhin sicher weg.

## Offen / Bitten

- **Hauptagent:**
  - Beim Gesamtlauf die Innenräume mit Taschenlampe ansehen. Nachts sind die Räume sehr dunkel, kleine Stücke sieht man erst mit Lampe.
  - `__bw.info().hit` prüfen (Kapellenfenster auf der Wand).
- **AP-18 / neben3.js:** Dort werden `w_papierlaterne/model.glb` und `toys_old/model.gltf` geladen. Beide Dateien gibt es nicht (404), richtig wären `model.fbx` mit `msFBX`.
- **Kapitel 6:** Das Modul „Nebenaufgaben (N6-7, N6-8)“ scheitert beim Laden mit `TypeError … reading 'includes'`.
