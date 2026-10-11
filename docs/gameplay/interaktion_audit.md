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
| Türen/Deckel/Schubladen/Klappen, die im Modell Teil eines Gesamtnetzes sind (Kapellentür, Müllcontainer, Kofferraum, Handschuhfach, Kinderkiste, Gullydeckel …) | **Laufzeit-Trennung** (`iap_trenne`): Dreiecke ganz innerhalb der Klickfläche (bzw. gemessener Region) werden zu eigenem Netz mit Scharnier/Gleitachse; Original zu Nulldreiecken (BVH bleibt gültig) | wie oben | wie oben | `iap` |
| Geräte (Funkgerät, Radio, Kassettenrekorder) | Drehknöpfe drehen sich, Tasten drücken ein (`iap_geraetBedienen`), Auslösung zusätzlich zur Original-Aktion | 0,25 s | `switch1` | – |
| Von der Story freigegebener Wagen (`userData.iapOffen`) | Tür klappt 66° auf (Scharnier vorn), zweites E schließt | 0,55 s | `carDoor` | – |

## 2. Inventar nach Typ (Kap. 1–6, je Fläche gemessen)

Gemessen wurden **58** Klickflächen mit mechanischem Typ (nach Beschriftung + Lage dedupliziert). Davon bewegen jetzt 49 ein Bauteil sichtbar, 6 haben kein trennbares Bauteil (Klickfläche über einem Gesamtnetz oder einer Wand).
Vorher (Modul abgeschaltet, Kap. 1, dieselben Flächen): 43 Flächen ausgelöst; bei 4 davon bewegte sich irgendetwas im 5-m-Umkreis (Figurenknochen, Raben, Teleport beim Gullydeckel) – das angeklickte Bauteil selbst bewegte sich bei **keiner**.

| Verhalten | Flächen | Beispiele | mit Ton | größter Winkel |
|---|---|---|---|---|
| Verschlossene Tür/Tor: Klinke rüttelt | 20 | Stahltür (verriegelt), Garagentor, Kellertür, An Vegas’ Tür klopfen | 20 | 2° |
| Deckel/Klappdeckel: kippt um die Hinterkante | 10 | Gullydeckel, Müllcontainer, Kofferraum, Pfandkisten | 10 | 74° |
| Fahrzeug ohne Tür-Teil: Karosserie wippt | 8 | Ausgebranntes Auto, Schrottauto, Erster Transporter, Auto | 8 | – |
| Durchgangstür (Raumwechsel): schwingt auf | 7 | Hinaus, Stalltür, Hinaus in den Vorgarten, Hinaus auf den Friedhof | 7 | 80° |
| Schublade: gleitet 30 cm | 3 | Unterste Schublade, Hängeregistratur (Zahlenschlos, Kommodenschublade | 3 | 2° |
| Fahrzeug ohne Teil | 2 | Transporter, Zweiter Transporter (es klopft | 2 | – |
| Fahrzeug: Autotür rüttelt am Scharnier | 2 | Autotür | 2 | 1° |
| Klappe: kippt | 2 | Handschuhfach | 2 | 80° |
| Schublade ohne trennbares Bauteil | 2 | Kommodenschublade, Registraturschrank durchsuchen | 2 | – |
| Deckel/Kiste ohne trennbares Bauteil | 1 | Blechkiste des Kommandos | 1 | – |
| Tür/Tor ohne trennbares Bauteil im Modell | 1 | Die Tür der Villa aufschließen | 1 | – |

## 3. Objektliste mit Schulnote

prägnant: ja = Hauptrequisite/Haupttür/Fahrzeug in Story oder erster Minute, nein = Nebenobjekt. „Kollision folgt“: Netz-Kollision aktualisiert sich je Bild (SOL) bzw. Schaltkiste.

| Objekt (Typ) | prägnant | bewegt vorher | bewegt nachher | Kollision folgt | Ton | Zustand gespeichert | Prompt wechselt | Note vorher | Note nachher | Beleg |
|---|---|---|---|---|---|---|---|---|---|---|
| Schwenktüren der Basis (`makeDoor`, 5 in Kap. 1 + Amt) – Tür öffnen/schließen | ja | ja (89°) | ja (89°) | Kiste schaltet: zu 1.2/1.2/1.2/1.2 m gesperrt, offen durchgelaufen | ja | ja (`doors` im Spielstand) | ja | 2 | 1 | door_k1.json (4 Durchgangstüren), ia_k1.json |
| Durchgangstüren (Hinaus, Kellertür Nr. 4, Friedhof, Vorgarten) – 7 Flächen | ja | nein (Überblendung ohne Tür) | ja (80°, vom Spieler weg) | Netz folgt | ja | nein (Tür fällt zu) | nein (Beschriftung bleibt „Hinaus“) | 4 | 2 | iap_final.json (rot 80,2°, weg −0,8) |
| Verschlossene Türen/Tore (Stahltür, Klopfen, Ladentür, Schuppen, Garagentor, Hintertür …) – 20 Flächen mit Bauteil | ja | nein (nur Text/Ton) | ja (Klinke rüttelt ±3°) | n. a. (bleibt zu) | ja | n. a. | n. a. | 4 | 2 | iap_final.json (rot 1,9°) |
| Türen/Tore, deren Blatt im Gesamtnetz steckt (Kapellentür, Stalltür, Eisentor, Garagentor, Hintertür, Schuppen) – 8 Flächen | ja | nein (Ton + Text) | ja: Blatt per Laufzeit-Trennung herausgelöst, **rüttelt** (Story: abgeschlossen) | n. a. (bleibt zu) | ja | n. a. | n. a. | 4 | 2 | iap_k*.json (ctl dreh:tuer, rot 1,9°); Kapellentür: Blatt per Region (-53,8…-52,8 / 81,1) aus der Scan-Wand getrennt |
| Villa-Tür (Eisenplatte mit acht Schlüssellöchern, Kap. 4) – 1 Flächen ohne Blatt | ja | nein | nein (Platte ist eine Textur-Decke, Wechsel per Überblendung) | n. a. | ja | n. a. | n. a. | 4 | 3 | Platte ohne Türblatt (`anwesen.js`): öffnet erst durch Szenenwechsel `anwesen_enterHall`; Wippen nur an der Wurzel |
| Autos/Transporter/Wracks (Klick „Auto“ …) – 12 Flächen | ja | nein | ja (Wippen/Türrütteln) | Hitbox bleibt | ja | n. a. | n. a. | 4 | 2 | iap_final.json |
| Autotür Lukes Leihwagen (strasse.js, Innenlicht + Warnsummen) | ja | ja (69°) | ja (69°, Innenlicht) | Netz folgt | ja (`carDoor`, Summen) | aus Story-Schlüssel abgeleitet | ja | 2 | 2 | ia_k1.json |
| Lucys Auto Fahrertür (Proxy-Tween, gespiegelt nach außen) | ja | ja | ja | Netz folgt | ja | aus Story abgeleitet | ja | 2 | 2 | strasse.js |
| Deckel/Gully/Karteikasten/Kiste mit Teil – 10 Flächen | nein/ja | nein | ja (74°, schließbar) | Netz folgt | ja | ja (`iap`) | ja („Schließen“) | 4 | 1 | iap_final.json |
| Müllcontainer, Kofferraum (Wrack), Kinderkiste, Pfandkisten, Zigarrenkiste, Gullydeckel – aus Gesamtnetz herausgetrennt (Laufzeit) | ja (Container/Kofferraum) / nein | nein | ja (73–75°, schließbar, Gully mit dunklem Schacht) | Netz folgt | ja | ja (`iap`) | ja („Schließen“) | 4 | 2 | iap_k*.json (ctl dreh:deckel); Bild shots5_out/zu0–auf0 |
| Blechkiste des Kommandos, Zweiter Transporter (es klopft) | nein | nein | nein (Ton + Text) | n. a. | ja | n. a. | n. a. | 4 | 3 | Klickfläche ohne eigenes Netz (Nebenobjekt) |
| Kommodenschublade (Nr. 4, Hit nachgeführt), Unterste Schublade (Archiv) | ja | nein | ja (gleitet 30 cm, schließbar) | Netz folgt | ja (`woodSqueak1`/`woodClose1`) | ja (`iap`) | ja | 4 | 1 | iap_k*.json (gleit:schublade, shift 0,30) |
| Hängeregistratur (Zahlenschloss), Aktenschrank (Doppeltürschrank) | ja | nein | rüttelt (verschlossen) / unverändert | n. a. | ja | n. a. | n. a. | 4 | 2 | Story: Zahlenschloss; Aktenschrank ist ein Türenschrank ohne Schublade (bewusst nicht typisiert, ein erster Versuch ließ die Griffleiste herausgleiten – verworfen) |
| Registraturschrank (Archiv, Batterie), Tresen-Schublade, Besteck | ja / nein / nein | nein | nein (Ton + Text) | n. a. | ja | n. a. | n. a. | 4 | 3 | Registraturschrank: Modell als `InstancedMesh` (alle Schränke teilen ein Netz, Schubladen nur Textur) – Trennung nur per Blender-Export je Schrankmodell; Tresen-Schublade hat kein sichtbares Möbelteil (Hit auf der Theke; Typisierung gesperrt, weil sonst der Fernseher auf der Theke herausglitt); Besteck liegt lose |
| Gartentore (8) | nein | ja (83°) | ja (83°) | Schaltkiste | ja | **neu: ja** (`tore`) | ja | 3 | 1 | ia_k1.json, `interaktion.js` |
| Briefkästen (8) | nein | ja (83–115°) | ja | n. a. | ja | **neu: ja** (`tore`) | ja | 3 | 1 | ia_k1.json |
| Schrank (Weiss-Raum, „Den Schrank öffnen“) | ja | ja (86°) | ja | Netz | ja (`doorCreak`) | ja | ja | 2 | 2 | ia_k1.json |
| Kühlschrank Nr. 4 (Modell mit Tür) | nein | ja (100°) | ja | Netz | ja | nein | ja | 2 | 2 | ia_k1.json (Commit 6cad8a5) |
| Geräte: Funkgerät (Funkkasten), Radio, Rekorder, Fernseher | ja | nein (Ton/Licht/Text) | ja: Drehknöpfe drehen sich (Funkgerät 2 Regler, Radio 2 Regler), Taste drückt ein (2–23 mm), Antenne/Klappe wo im Netz getrennt vorhanden | n. a. | ja (`switch1`) | ja (Rätselzustände wie vorher) | z. T. | 4 | 2 (Funkgerät/Radio) · 3 (Fernseher: Röhrenkörper ohne Bedienteile) | device_test.json; Overlay des Funkkastens: shots5_out/auf1 |

Bildpaare zu/auf (Kontaktbögen, `docs/gameplay/belege_interaktion/`): Müllcontainer (Deckel hebt ab), Funkgerät (Bedien-Overlay), Gartentor, Stalltür (Blatt gibt die Öffnung frei), Gullydeckel (steht auf, Schacht darunter).

## 4. Probleme, die beim Bauen auftraten (und gelöst wurden)

| Problem | Folge | Lösung |
|---|---|---|
| Türblätter der Fab-Tür-Modelle (`door1`) sind ein Netz mit Griff (21 cm Tiefe) | Eckpunkt-Test „Scharnierkante fix“ schlug an der Griffseite an | Scharnier an der Breitenkante, Mittellinie der Tiefe; per Mittelpunkt-Bewegung gemessen: Freikante weicht um 0,8–0,87 m vom Spieler (`weg` < 0) |
| Erste Fassung ließ die Tür **auf den Spieler** zu schwingen (`weg` +0,48 … +0,87) | Blatt hätte den Spieler gestoßen | Vorzeichen per Messung umgekehrt (`weg` −0,8) |
| Klickflächen mit Textvergleich in anderen Modulen (`anwesen.js`, `neben3.js`, `kapitel5.js`) | das Ersetzen von `userData.label` durch eine Funktion hätte Fundstellen verloren | Beschriftungswechsel „Schließen“ über `userData.iapAnz` (Basis-Patch), `label` bleibt |
| Kellertür der Basis (`cellarDoor`) heißt wie die Durchgangstür Nr. 4 | öffnete sich 80° und zeigte nur den Text „Eine schwere Tür …“ | Durchgang nur, wenn die Original-Aktion den Raum wechselt (Quelltext enthält `kirchberg_rein/raus`, `nr4_wechsel` …) |
| Brüche beim Indexieren von 12 000 Netzen | Ruckler beim ersten E | Verzeichnis nur 18 m um den Spieler, erst beim ersten E |

## 5. Offen (mit Ursache)

* **Registraturschrank** (Archiv, Batterie-Fund): Modell wird als `InstancedMesh` mehrfach gestellt; die Schubladen sind Teil der Textur. Echte Schublade braucht Blender-Nacharbeit je Schrankmodell (Schublade als eigenes Objekt, GLB neu) – Nebenfund, Note 3. Alle anderen Haupt-Rätselmöbel (Kommode, Unterste Schublade, Karteikasten, Handschuhfächer, Kofferraum, Müllcontainer, Kinderkiste) bewegen ein echtes Bauteil.
* **Verschlossene Türen** (Kapellentür, Stalltür, Eisentor, Garagentor, Ladentür, Hintertür, Schuppen) rütteln am echten Türblatt statt zu öffnen – das ist die Story (abgeschlossen); der Aufklapp-Mechanismus (`iapOffen`, 66° mit Innenlicht) ist für alle Wagen vorhanden, die eine Story-Aktion freigibt (heute: Lukes Leihwagen und Lucys Auto, beide mit eigenen Animationen). Transporter/Bus sind laut Story nicht zu öffnen.
* **Villa-Tür**: Eisenplatte ohne Türblatt, Szenenwechsel per Überblendung – kein Türblatt zum Schwenken.
* **Fernseher**: Röhrenkörper aus einem Netz ohne Bedienteile (Hintergrund, Note 3).
* **Blender**: nicht verwendet. Die Trennung geschieht zur Laufzeit (Dreiecke ganz innerhalb der Klickfläche → eigenes Netz, Original zu Nulldreiecken), das hält GLB/KTX unverändert; ein Blender-Export wäre nur für den Registraturschrank nötig.
* Zustand: Schubladen/Deckel/Klappen (`iap`) sowie Gartentore und Briefkästen (`tore`) werden gespeichert; rüttelnde/aufschwingende Durchgangstüren sind flüchtig.

