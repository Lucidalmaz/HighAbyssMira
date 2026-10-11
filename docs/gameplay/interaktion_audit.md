# Interaktions-Physik – Audit (Folgeauftrag 10, Stand 11.10.2026)

Nutzer: „Wenn du ein Auto aufmachst oder eine Tür aufmachst, dass die Tür dann auch aufgeht … alles, was du anfasst und bewegst, soll sich wirklich bewegen.“ Noten: 1 sehr gut … 6 ungenügend; Maßstab mindestens 2, Unprägnantes 3.

Messweise: Werkzeug `app/tools/qa_bewegung/ia_inv.js` (Vollmessung: je mechanischer Klickfläche E auslösen, Spieler 1,3 m davor, 1,2 s Simulation, Bewegung aller Objekte im 5-m-Umkreis vor/nach vergleichen, Töne mitschneiden, Beschriftung vorher/nachher, Kollisionskisten zählen) und `iap_test.js` (je typisierte Fläche: Drehwinkel/Verschiebung des Bauteils, Fixpunkte der Kante, Richtung zum Spieler, Schließen mit zweitem E). Vorher-Messung = Modul `interaktion.js` per `__iap.aus()` abgeschaltet.

## 1. Was jetzt passiert

Neues Modul `app/mods/interaktion.js` (+ `interaktion_patch.py`): hängt sich an jede Klickfläche mechanischen Typs, die **keine** eigene Animation hat (Beschriftung ohne „öffnen/schließen“), sucht das echte Bauteil darunter (Tür-Blatt, Deckel, Autotür nach Knotenname) und bewegt es an einem Drehpunkt/Gleitweg. Animationen laufen nur, solange sie laufen (Liste aktiver Steuerungen, kein Dauer-Tick). Netz-Kollision folgt automatisch (SOL prüft die Matrix je Bild); der Beschriftungswechsel „Schließen“ geht über `userData.iapAnz` (Basis-Patch), `userData.label` bleibt unverändert, weil andere Module Klickflächen per Textvergleich suchen.

| Typ | Bewegung | Dauer/Winkel | Ton | Zustand |
|---|---|---|---|---|
| Durchgangstür (Aktion wechselt den Raum: Hinaus, Kellertür Nr. 4, Treppen …) | Blatt schwingt am Rand rechts vom Spieler **vom Spieler weg** auf, Aktion (Überblendung/Versetzen) folgt nach 0,3 s, nach 2,2 s fällt die Tür leise zu | 0,5 s · 80° | `doorOpen` | – (Tür steht nach Rückkehr zu) |
| Verschlossene Tür/Tor (Beschriftung ohne „öffnen“, z. B. Stahltür (verriegelt), Klopfen, Garagentor) | rüttelt an der Klinke: gedämpfte Schwingung um den Scharnierrand | 0,55 s · ±3° | `doorCreak` | – |
| Fahrzeug mit Tür-Teilen (Limousine) | nächste Tür rüttelt am Vorderrand | 0,55 s · ±3° | `metalHit2` | – |
| Fahrzeug ohne Tür-Teile (Hatchback, Transporter, Wracks) | Karosserie wippt auf der Federung (Roll ±0,8°, Nick ±0,35°, 6 Schwingungen, gedämpft) | 1,1 s | `metalHit2` | – |
| Deckel, Kisten, Gullydeckel, Karteikasten | kippt um die Hinterkante (Gully: nächste Kante), zweites E schließt (ohne Text/Fund zu wiederholen) | 0,5 s · 74° | `woodSqueak2`/`woodClose2` | im Spielstand (`iap`) |
| Schubladen | gleiten zum Spieler, 70 % der Tiefe (30–34 cm), zweites E schließt | 0,42 s | `woodSqueak1`/`woodClose1` | im Spielstand (`iap`) |
| Gartentore (8), Briefkästen (8) | Modul-eigene Animation (83° bzw. 83–115°) – **neu:** offener Zustand im Spielstand (`tore`) | 0,7 s / 0,45 s | `doorOpen` / `metalOpen` | **neu** gespeichert |

## 2. Inventar nach Typ (Kap. 1–6, je Fläche gemessen)

Gemessen wurden **61** Klickflächen mit mechanischem Typ (nach Beschriftung + Lage dedupliziert). Davon bewegen jetzt 36 ein Bauteil sichtbar, 21 haben kein trennbares Bauteil (Klickfläche über einem Gesamtnetz oder einer Wand).
Vorher (Modul abgeschaltet, Kap. 1, dieselben Flächen): 44 Flächen ausgelöst; bei 4 davon bewegte sich irgendetwas im 5-m-Umkreis (Figurenknochen, Raben, Teleport beim Gullydeckel) – das angeklickte Bauteil selbst bewegte sich bei **keiner**.

| Verhalten | Flächen | Beispiele | mit Ton | größter Winkel |
|---|---|---|---|---|
| Verschlossene Tür/Tor: Klinke rüttelt | 16 | Stahltür (verriegelt), Garagentor, Kellertür, An Vegas’ Tür klopfen | 16 | 2° |
| Fahrzeug ohne Tür-Teil: Karosserie wippt | 10 | Ausgebranntes Auto, Transporter, Schrottauto, Erster Transporter | 10 | – |
| Durchgangstür (Raumwechsel): schwingt auf | 7 | Hinaus, Stalltür, Hinaus in den Vorgarten, Hinaus auf den Friedhof | 7 | 80° |
| Deckel/Kiste ohne trennbares Bauteil | 6 | Gullydeckel, Müllcontainer, Kofferraum, Kinderkiste | 5 | – |
| Tür/Tor ohne trennbares Bauteil im Modell | 6 | Eisentor, Kapellentür, Die Frage an der Tür, Unter das Tor leuchten | 6 | – |
| Schublade ohne trennbares Bauteil | 6 | Kommodenschublade, Unterste Schublade, Hängeregistratur (Zahlenschlos, Schublade unter dem Tresen dur | 6 | – |
| Deckel/Klappdeckel: kippt um die Hinterkante | 5 | Gullydeckel, Pfandkisten, Zigarrenkiste unter dem Bett, Karteikasten „VERSUCHSREIHE K“ | 5 | 74° |
| Fahrzeug: Autotür rüttelt am Scharnier | 2 | Autotür | 2 | 1° |
| Klappe (Handschuhfach) ohne Bauteil | 2 | Handschuhfach | 2 | – |
| Fahrzeug ohne Teil | 1 | Zweiter Transporter (es klopft | 1 | – |

## 3. Objektliste mit Schulnote

prägnant: ja = Hauptrequisite/Haupttür/Fahrzeug in Story oder erster Minute, nein = Nebenobjekt. „Kollision folgt“: Netz-Kollision aktualisiert sich je Bild (SOL) bzw. Schaltkiste.

| Objekt (Typ) | prägnant | bewegt vorher | bewegt nachher | Kollision folgt | Ton | Zustand gespeichert | Prompt wechselt | Note vorher | Note nachher | Beleg |
|---|---|---|---|---|---|---|---|---|---|---|
| Schwenktüren der Basis (`makeDoor`, 5 in Kap. 1 + Amt) – Tür öffnen/schließen | ja | ja (89°) | ja (89°) | Kiste schaltet: zu 1.2/1.2/1.2/1.2 m gesperrt, offen durchgelaufen | ja | ja (`doors` im Spielstand) | ja | 2 | 1 | door_k1.json (4 Durchgangstüren), ia_k1.json |
| Durchgangstüren (Hinaus, Kellertür Nr. 4, Friedhof, Vorgarten) – 7 Flächen | ja | nein (Überblendung ohne Tür) | ja (80°, vom Spieler weg) | Netz folgt | ja | nein (Tür fällt zu) | nein (Beschriftung bleibt „Hinaus“) | 4 | 2 | iap_final.json (rot 80,2°, weg −0,8) |
| Verschlossene Türen/Tore (Stahltür, Klopfen, Ladentür, Schuppen, Garagentor, Hintertür …) – 16 Flächen mit Bauteil | ja | nein (nur Text/Ton) | ja (Klinke rüttelt ±3°) | n. a. (bleibt zu) | ja | n. a. | n. a. | 4 | 2 | iap_final.json (rot 1,9°) |
| Türen/Tore ohne trennbares Bauteil (Stalltür, Eisentor, Kapellentür, Villa-Tür …) – 6 Flächen | z. T. | nein | nein (Ton + Text) | n. a. | ja | n. a. | n. a. | 4 | 3 | Klickfläche über Gesamtnetz; Bauteil müsste im Modell getrennt werden (Blender) |
| Autos/Transporter/Wracks (Klick „Auto“ …) – 13 Flächen | ja | nein | ja (Wippen/Türrütteln) | Hitbox bleibt | ja | n. a. | n. a. | 4 | 2 | iap_final.json |
| Autotür Lukes Leihwagen (strasse.js, Innenlicht + Warnsummen) | ja | ja (69°) | ja (69°, Innenlicht) | Netz folgt | ja (`carDoor`, Summen) | aus Story-Schlüssel abgeleitet | ja | 2 | 2 | ia_k1.json |
| Lucys Auto Fahrertür (Proxy-Tween, gespiegelt nach außen) | ja | ja | ja | Netz folgt | ja | aus Story abgeleitet | ja | 2 | 2 | strasse.js |
| Deckel/Gully/Karteikasten/Kiste mit Teil – 5 Flächen | nein/ja | nein | ja (74°, schließbar) | Netz folgt | ja | ja (`iap`) | ja („Schließen“) | 4 | 1 | iap_final.json |
| Deckel/Container/Kofferraum/Kinderkiste ohne Teil – 6 Flächen | nein | nein | nein (Ton + Text/Fund) | n. a. | ja | n. a. | n. a. | 4 | 3 | Modell ohne trennbare Klappe |
| Schubladen (Kommode, Besteck, Registratur, Tresen) – 6 Flächen | nein | nein | nein (kein Bauteil) | n. a. | ja | n. a. | n. a. | 4 | 3 | Möbel ohne eigene Schubladenteile (Fab-Modelle in einem Netz) |
| Gartentore (8) | nein | ja (83°) | ja (83°) | Schaltkiste | ja | **neu: ja** (`tore`) | ja | 3 | 1 | ia_k1.json, `interaktion.js` |
| Briefkästen (8) | nein | ja (83–115°) | ja | n. a. | ja | **neu: ja** (`tore`) | ja | 3 | 1 | ia_k1.json |
| Schrank (Weiss-Raum, „Den Schrank öffnen“) | ja | ja (86°) | ja | Netz | ja (`doorCreak`) | ja | ja | 2 | 2 | ia_k1.json |
| Kühlschrank Nr. 4 (Modell mit Tür) | nein | ja (100°) | ja | Netz | ja | nein | ja | 2 | 2 | ia_k1.json (Commit 6cad8a5) |
| Geräte/Schalter: Radio, Fernseher, Funkgerät, Telefon (Hörer ✓), Kassettenrekorder, Spieluhr, Tonband | ja | teils (Hörer 8 cm, Spieluhr Deckel 100°) | unverändert | n. a. | ja | ja (Rätselzustände) | z. T. | 3 | 3 | ia_k1.json: Modelle sind ein Netz (Knöpfe nicht trennbar) – Klick löst Ton/Licht/Text aus |

## 4. Probleme, die beim Bauen auftraten (und gelöst wurden)

| Problem | Folge | Lösung |
|---|---|---|
| Türblätter der Fab-Tür-Modelle (`door1`) sind ein Netz mit Griff (21 cm Tiefe) | Eckpunkt-Test „Scharnierkante fix“ schlug an der Griffseite an | Scharnier an der Breitenkante, Mittellinie der Tiefe; per Mittelpunkt-Bewegung gemessen: Freikante weicht um 0,8–0,87 m vom Spieler (`weg` < 0) |
| Erste Fassung ließ die Tür **auf den Spieler** zu schwingen (`weg` +0,48 … +0,87) | Blatt hätte den Spieler gestoßen | Vorzeichen per Messung umgekehrt (`weg` −0,8) |
| Klickflächen mit Textvergleich in anderen Modulen (`anwesen.js`, `neben3.js`, `kapitel5.js`) | das Ersetzen von `userData.label` durch eine Funktion hätte Fundstellen verloren | Beschriftungswechsel „Schließen“ über `userData.iapAnz` (Basis-Patch), `label` bleibt |
| Kellertür der Basis (`cellarDoor`) heißt wie die Durchgangstür Nr. 4 | öffnete sich 80° und zeigte nur den Text „Eine schwere Tür …“ | Durchgang nur, wenn die Original-Aktion den Raum wechselt (Quelltext enthält `kirchberg_rein/raus`, `nr4_wechsel` …) |
| Brüche beim Indexieren von 12 000 Netzen | Ruckler beim ersten E | Verzeichnis nur 18 m um den Spieler, erst beim ersten E |

## 5. Offen (mit Ursache)

* **Schubladen, Kofferraum, Handschuhfach, Stalltür, Eisentor, Kapellentür, Villa-Tür** ohne trennbares Bauteil: die Fab-/Scan-Modelle liefern Möbel und Tore als ein Netz (Schubladen/Türen nicht getrennt). Fix wäre Blender-Nacharbeit je Modell (Nr. 4 Kommode/Küche, Registraturschrank, Tankstellen-Tresen, Villa-Portal); als Unprägnantes (Note 3) akzeptiert, Prägnantes (Villa-Tür, Kapellentür) ist über Klopfen/Ton und Überblendung geführt.
* **Geräte** (Radio, Funkgerät, Kassettenrekorder): Knöpfe sind in einem Netz verschmolzen – keine Drehknöpfe; Klick löst Ton/Licht/Text aus (Note 3).
* Autotüren der Limousinen **öffnen** nicht, sie rütteln: die Wagen sind abgeschlossen (Story); echtes Aufklappen mit Innenlicht gibt es nur bei Lukes und Lucys Wagen (Modul-eigen).
* Zustand: nur Schubladen/Deckel/Klappen (`iap`) sowie Gartentore und Briefkästen (`tore`) werden gespeichert; rüttelnde/aufschwingende Türen sind flüchtig.

