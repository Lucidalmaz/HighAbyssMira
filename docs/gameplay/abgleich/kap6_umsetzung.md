# Umsetzung Abgleich Kapitel 6 (Wald, Hungrige, Kreaturen)

Grundlage: `docs/gameplay/abgleich/kap6_wald.md`. Geändert wurden nur `hungrige.js`, `tiefwald.js`, `kapitel6.js`, `neben6.js`, `wald.js` (`entdecker.js` blieb unberührt, dort war nichts zu tun). Alle Dateien: `node --check` grün; Spieltest über `_run_locked.sh` (Ausgabeordner `_kap6_r*`, Screenshots der letzten Läufe in `C:\Users\GIGABYTE\_kap6_r11` und `_kap6_r12`).

Koordinaten sind Weltkoordinaten (x, z). Hilfsfunktionen in den eigenen Dateien: `tief_blatt()` (Papier mit Bleistiftzeilen), `tief_kindersitz()`, `tief_vanOeffnen()`, `tief_busInnen()`, `tief_busW(x,y,z)` (Wagenkoordinaten → Welt), `n6_spindBau()`, `hungrige_kadaver()`, `k6_ag20Props()`.

## Hoch

| Lücke | Stand | Umsetzung |
|---|---|---|
| Kadaver an der Fraßstelle (1,5; 199,6) | umgesetzt | `hungrige_kadaver()`: Scan `animal_deerdoe` (aus dem Tierregister von `leben.js`), Clip `Death` auf dem letzten Bild festgehalten, Fell bleibt, Flanke aufgerissen (Fleisch-Shader `kr_haut`, Wunde `HUNGRIGE.wunde`). Das Netz ist geskinnt und damit nicht automatisch fest: unsichtbare Kollisionskiste in Körpergröße (Spieler läuft nicht hindurch). Boden: auf Bodenhöhe gesetzt (Box3 mit Skinning). Blutflecken, Fleischbrocken, Niere, Gedärm und Seite 1 liegen darum herum (waren schon da). |
| Funkgerät beim toten Blechmann (AG-20) | umgesetzt | `k6_ag20Props()` legt `ms/w_funk` (30 cm) neben ihn ins Laub; verschwindet beim Einstecken (`K6.funkM`). |
| Kettenrolle | umgesetzt | `ms/w_kette` (46 cm) auf dem Boden neben ihm; verschwindet beim Nehmen (`K6.ketteM`). |
| Rote Wolle von Stamm zu Stamm | umgesetzt | Die Stämme der Totholz-Scans (deadtree1/3) werden aus den Instanzmatrizen gemessen (Mitte und Radius in 1,1 m Modellhöhe, am Scan gemessen). Die Wolle beginnt am Zaunpfahl mit Zettel 1 (39,8; 156,3) und läuft von Stamm zu Stamm (nächster Stamm auf der Wegseite, mind. 3,2 m Abstand, Durchhang je Länge); steht ein anderer Stamm im Weg, wird er mit angeknüpft. An jedem Stamm zwei Wicklungen (Torus). Nur wo am Weg kein Stamm steht, hält ein Pfahl. Letzte Strecke zum Steg und ins Wasser wie bisher (die letzten 3 Segmente, die `tief_weiher` entfernt, bleiben die letzten). |
| Hofers Spind im Bus | umgesetzt | `n6_spindBau()`: schmaler Blechspind (grüngrau, Rost, Lüftungsschlitze, von Hand gemalte „3“ mit Auge über `akte_auge`, Griff, Schloss) im Laderaum hinter dem Fahrerhaus, links, Tür nach hinten. Die Tür schwingt auf, sobald der Spind geöffnet ist (`n6_spindTick`). Die Hitbox ist nach hinten gestreckt: man zielt durch die Heckscheibe. |
| Sieben Kindersitze im Bus, auf einem ein „Z“, Zettel | umgesetzt | Der Scan `vans` enthält zwei Wagen (unbeschädigt + beschädigt) und ist geschlossen. `tief_vanOeffnen()` entfernt den zweiten Wagen (vorher standen zwei nebeneinander), nimmt Heckscheibe und Windschutzscheibe heraus (Dreiecke im Fensterrahmen) und macht die Innenseiten sichtbar. `tief_busInnen()`: Riffelblechboden, sieben Kindersitze (`tief_kindersitz()`: Wanne, Polster, Lehne, Seitenflügel, Gurte, Schloss; drei hinten, vier davor, einer liegt auf der Seite). Auf dem mittleren hinteren Sitz klebt ein Klebeband-„Z“ (von Hand gemalt, halb abgekratzt), am linken hinteren Sitz hängt ein Zettel. Fahrerhaus mit Armaturenbrett, Lenkrad und zwei Sitzen. Hitbox „In den Bus sehen“ liegt hinter der Heckscheibe. Sieben/acht: Der Text in Kapitel 6 sagt überall sieben; `ausbau_ost_west.js:573` nennt acht und ist eine fremde Datei (Abgleich offen). |

## Mittel

| Lücke | Stand | Umsetzung |
|---|---|---|
| Zettel unter dem Stein (Steinkreis) | umgesetzt | Papier (`tief_blatt`) am Fuß des ersten stehenden Findlings (19,5; 225,6), die Ecke unter einem faustgroßen Stein (Scan `boulder`). Hitbox am Boden. |
| Fahrtenbuch am Armaturenbrett | umgesetzt | `ms/w_buch` (24 cm) auf dem Armaturenbrett, darüber eine Klarsichthülle (Physical-Material). Hitbox vor der Windschutzscheibe. |
| Dienstbuchseite 4 unter dem Fahrersitz | umgesetzt | Liegt jetzt auf dem Boden des Fahrerhauses unter dem Fahrersitz (vorher im Wagenkörper), Hitbox groß genug von außen. |
| Zeltstange am Lager | umgesetzt | Zelt neu: Firststange (Rinde, schräg, vorn auf einem Stützstock, hinten abgesackt) genau über (81,3; 233,2), dem Platz von Whiskeys Station `lager` (`whiskey_perch` findet die Stange); zwei hängende Planen mit Falten, Schmutz am Saum. Im Test sitzt Whiskey auf der Stange. |
| Batterie in den Brombeeren | umgesetzt | `ue/batterie` in echter Größe (6 cm), liegt am Rand des Busches im Laub; sichtbar erst, wenn das Reh weg ist (`wald_fakeWeg`), weg nach dem Fund. |
| Code-Fehler `wald.js:68` (Ostzaun) | behoben | Der Aufruf stand hinter dem `//`-Kommentar. Jetzt eigene Zeile. Ostzaun x = 110, z 98,2–156: kein Weg endet dort (Wege reichen bis x = 93, der Wolfsplatz liegt bei x = 96–101), der Zaun blockiert nichts. |
| Handschuhfach / Rekorder im Wrack | nicht umgesetzt | Das Wrack (`car_rusty`) hat kein einsehbares Fach; die Hitbox sitzt im Fahrgastraum. Ohne neues Modell (Innenraum mit Armaturenbrett und Fach) wäre jede Einlage ein schwebendes Objekt. Siehe „braucht Download“. |

## Niedrig (billig mitgenommen)

| Lücke | Stand | Umsetzung |
|---|---|---|
| Zettel 5 am Stegpfosten | umgesetzt | Papier in Klarsichthülle an der Innenseite des letzten Pfostens. Zettel 1 am Zaunpfahl hat jetzt ebenfalls Hülle und Bleistiftzeilen. |
| Taschenmesser und Plombe an der Schlinge | umgesetzt | Messer (Holzgriff, Messingzwingen, rostige Klinge, Öse) steckt im Draht, Blechplombe mit Auge hängt am Draht am Pflock; beide verschwinden, wenn die Schlinge offen ist. |
| Frischer Knoten bei (46; 212,8) | umgesetzt | Hellerer Knoten mit zwei losen Enden am nächstgelegenen Stamm (`S.knotAt`); der Gedanke `tief_knoten` löst jetzt an diesem Stamm aus. |
| Schaukel „zwischen toten Bäumen“ | Text angepasst | Lore: „zwischen zwei Holzpfosten“. |
| Schild-Wortlaut Bus | angeglichen | Toast nennt jetzt den Wortlaut des Schildes („AMT FÜR RÜCKFÜHRUNG · FAHRDIENST · LOST EYENGLESS“). |
| Baumhaus „Klappe“ | Text angepasst | `wald.js`: „Oben eine Kiste mit einem Schloss“ (das Schloss sitzt an der Kiste). Das „C“ im Kistendeckel liegt in `cleo.js` (fremde Datei): nicht umgesetzt. |
| Sender blinkt rot | nicht umgesetzt | Die Flags `senderBlink`/`blinkSink` sind reine Logik ohne Bild; kein Mesh vorgesehen. |
| Hochsitz-Junge-Rückfall | nicht umgesetzt | Fällt `figuren_embody('luke_echt')` aus, bleibt der Platz leer; kein Rückfall gebaut. |

## Braucht Download

* Wrack mit Innenraum und Handschuhfach (Armaturenbrett, Fach mit Klappe, Polaroid, Kassettenrekorder). Das aktuelle `car_rusty` ist außen gut, innen leer.
* Amtsbus mit echtem Innenraum und Scheiben (Kleinbus mit Laderaum, Sitzbank, Trennwand). Der Scan `vans` ist ein geschlossenes Low-Poly-Modell; das Innere ist selbst gebaut (Boden, Sitze, Armaturenbrett aus Rundkörpern).
* Echte Kindersitze (Autositze Gruppe 1/2 als PBR-Scan) statt der selbstgebauten.
* Taschenmesser (Klappmesser) als Scan für die Schlinge.
* Zeltstoff/Zelt-Scan (eingefallenes Zelt) für das Lager.

## Auffälligkeiten

* Der Scan `vans` enthielt zwei Wagen nebeneinander (`Object016` und `Object017`); `msFit` skalierte auf beide. Jetzt steht nur noch einer, 5,3 m lang (vorher war jeder knapp 5 m lang, Mitte zwischen beiden).
* Skinning-Netze (Reh, Tiere) werden von der Auto-Kollision (`buildSolids`) übersprungen; darum die Kollisionskiste am Kadaver.
* Die Testläufe liefen oft mit zwei bis drei gleichzeitigen Spielinstanzen anderer Agenten; dabei brach der WebGL-Kontext ab („Shader Error … VALIDATE_STATUS“, „G is not defined“). Nur erfolgreiche Läufe wurden ausgewertet.

## Prüfstand (Übergabe)

Build: `node tools/assemble.js` und alle sechs Module `node --check` grün. Der letzte geplante Testlauf (`_kap6_r12`, Nahaufnahmen Innenraum, Messer, Plombe, Steg, Zelt) wurde auf Anweisung abgebrochen.

**Im Spiel gesehen (Screenshots `_kap6_r9`–`_kap6_r11`, inzwischen gelöscht oder überschrieben):**
* Kadaver an der Fraßstelle: Reh liegt auf der Seite, Flanke aufgerissen, Fell am Kopf (gut sichtbar, wirkt etwas rosa-glatt).
* Funkgerät beim Blechmann liegt im Laub (rotes Gehäuse).
* Rote Wolle läuft sichtbar an Baumstämmen entlang; Knoten-Stamm bei (46; 212,8) mit roter Wolle im Bild.
* Zettel unter dem Stein: Papier mit Stein auf der Ecke neben dem Findling.
* Zelt: Whiskey sitzt auf der Firststange (Station `lager`).
* Bus: Heckscheibe offen, durch sie sieht man Hofers Spind mit weißer „3“ und Auge sowie dunkle Sitzformen; Hitbox „In den Bus sehen“ und „Ein schmaler Blechspind hinter dem Fahrersitz“ erscheinen beim Anzielen.
* Batterie: liegt als kleines Teil neben den drei Kratzern.

**Nicht verifiziert (Code fertig, kein brauchbarer Screenshot):**
* Bus-Innenraum nach der letzten Änderung: Boden des Laderaums auf 0,72 m angehoben (damit man die Sitze über dem Heckscheibenrand sieht), Spind auf 80 % Höhe gestaucht, Fahrerhausboden getrennt (0,5 m). Ein Kommentar-Fehler, der den Innenraum in `_kap6_r11` unsichtbar machte, ist behoben (Zeile mit `FY`/`FC`).
* „Z“-Aufkleber (Lage am Lehnenrücken des mittleren hinteren Sitzes), Zettel am linken hinteren Sitz, umgekippter Sitz.
* Fahrerhaus mit Armaturenbrett, Fahrtenbuch in Hülle, Dienstbuchseite 4 am Boden.
* Kettenrolle, Taschenmesser und Plombe an der Schlinge, Zettel am Stegpfosten (Innenseite, vom Steg aus eventuell kaum zu sehen), Wolle am Zaunpfahl.
* Kollision des Kadavers (Kiste im Code, nicht abgelaufen).

**Offen:** Handschuhfach/Rekorder im Wrack, „C“ im Kistendeckel (cleo.js, fremd), Sender-Blinken, Rückfall-Junge am Hochsitz, Kindersitz-Zahl sieben/acht (ausbau_ost_west.js:573, fremd).
