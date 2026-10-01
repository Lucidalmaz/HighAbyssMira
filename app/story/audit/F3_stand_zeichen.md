# Stand X-7 · Mysteriöse Symbole und Zeichen (01.10.2026)

Modul `app/mods/zeichen.js` (in ORDER nach `nr4`, ein `WORLD_MODS.push`, ein `WORLD_TICK.push`, Spielstand `MOD_SAVE` `zeichen` = `{ neu: [ids] }`).
Keine anderen Dateien geändert.

## Was gebaut ist

### Zeichen-Tabelle `ZEICHEN_TAB` (29 Zeichen)
Jede Zeile hat Ort, Kapitel (`k`), Sichtbarkeit (`s`) und Bedeutung (`was`). Es gibt keine Zufallssymbole.

| Bereich | Zeichen (Sicht) |
|---|---|
| Ort | ∴ alt im Kirchweg-Mauerstein (Streiflicht, Luke) · Auge über Flamme im Kreis als Schablone am Strommast (0, 7.6) (Luke) · Aufkleber „ICH WAR DRIN“ an einer Laterne · Graffiti Nr. 9 (Band „SCHIMMEL“, Herz „J + K“, „NIX WIE WEG“, klein ∴) · Bleistift-Strichliste neben Hildes Tür · Dinas Kreise von unten, uralte Kreide unter dem Fenster der Aydıns (Nr. 8) · „ICH KOMME“ + 17 Striche auf der Kreuzung (Kreide ab Kap. 3, erscheint im Rücken; Luke: „Das war eben noch nicht da.“) · sieben Kreise und ein halber an Nr. 1 (nur im Blitz, Kap. 5; Luke nach dem Foto) · Graffiti Tankstelle („HIER LANDEN VERBOTEN“, „KEVIN ♥ JULE“, abgemaltes Auge mit „?“, „NIEMANDSLAND“) |
| Kirchberg | Turm über dem Abgrund an der Friedhofsmauer beim Tor · Birke (1312) innen an der Friedhofsmauer · Laterne (1312) an der Kapelle beim ältesten Stein (alle drei nur im Streiflicht) · 1958/1975/1992/2009 in der Friedhofsbank (Luke) · Lunas Strichmännchen mit Laterne auf dem Spielplatz (Kreide ab Kap. 3, im Rücken) |
| Schrebergärten | sieben Kreise und ein halber in den Brettern von Parzelle 7 · Turm im Brunnenstein (beide nur im Streiflicht) |
| Hof | Brandzeichen sieben Kreise und ein halber an der Remise · Dinas Kreis am Hofhaus (nur im Blitz) |
| Villa | Mutprobe „SPUKHAUS“, Geist, „TIM WAR DRIN 2014“ / „LÜGNER“ · Turm im Mauerstein (Streiflicht) |
| Tunnel zum Amt | Strichliste auf Kniehöhe · 1958/1975/1992/„20“ (beide Streiflicht; das vorhandene ∴ von amt.js nicht verdoppelt) |
| Kanalstadt | „ATLANTSCHISS“ mit Krone und Fisch · Schablone Auge + „AST 3“ · Strichliste · Laterne (1312). Die Wände werden beim ersten Betreten von begehbaren Punkten aus gesucht (Kanal-BVH). |
| Wald (ab Kap. 6) | zwei Stöckchenmänner in Rinde · Jägerstriche „75 / 92 / 09“ am Hochsitz |

### Sichtbarkeit (im Shader, ohne Lichter)
- **0** immer sichtbar.
- **1** nur im Streiflicht der Taschenlampe. Das sind Kegel × Einfallswinkel × Entfernung aus `fogUniforms.flP/flD/flK` der Basis. Die Tiefe der Ritzung kommt über die Normal-Map.
- **2** nur im Blitz. `onBeforeRender` erkennt das Render-Ziel `kamera_S.rt`, deshalb gibt es kein Eingreifen in `kamera.js`. Nach dem Polaroid kommt Lukes Gedanke, wenn das Zeichen im Bild war.
- **3** Kreide: frisch ab `k[0]`, sie verblasst je Kapitel (× 0,55), und der Blitz zeigt sie wieder ganz.
- `neu` = die Kreide erscheint erst, wenn die Stelle 3 s nicht im Blick war (nachdem Luke sie leer gesehen hat, aus > 30 m Entfernung oder nach 20 s). Das wird gespeichert.
- Luke kommentiert nur sieben Zeichen, je einmal, über `gedanke()`. Dazu kommen das Wandbild und die Nazca-Bilder (Rabe, Hirsch, die Furche am Boden).

### Technik
- Der Atlas ist ein 2048²-Canvas. Er wird beim Laden gemalt (Stile: Kreide mit Korn, Ritzung frisch/alt für Stein, Rinde, Holz und Putz, Brand, Sprühfarbe mit Läufern, Schablone mit Stegen, Edding, Bleistift, „Schimmer“ für den Blitz).
- Die Normal-Map wird nur in Zellen mit Höhe gerechnet.
- Alle Zeichen teilen EIN Material. Je Bereich gibt es EIN Mesh, also einen Draw Call.
- Das Mesh entsteht beim ersten Annähern an den Bereich. Jedes einzelne Zeichen wird erst gesetzt, wenn Luke ihm auf 38 m nahe kommt, mit 2 Zeichen je Bild.
  - Grund: Andere Module blenden entfernte Kulissen aus (Regionen, Gras-/Mauer-Blöcke). Unsichtbare Flächen zählen in `SOL` nicht.
  - Fehlschläge werden nach 6 s noch zweimal versucht.
  - Danach wird die kleine Bereichsgeometrie neu gebaut (wenige hundert Ecken).
- Die Zeichen schmiegen sich per Strahlgitter gegen die Kollisions-BVH (`SOL`) an. Bei Rinde und Bruchstein liegen sie damit auf der Oberfläche und schweben nicht.
- Es gibt keine Lichter und keine Allokation im Takt. Die Prüfungen laufen alle 0,3 s bzw. 0,5 s.

### Nazca-Prinzip (Kap. 6)
- Es gibt zwei Scharrbilder, jeweils als EINE durchgehende Linie mit Zugangslinie: den **Raben** und den **Hirsch mit verkehrt herum sitzendem Kopf** (der Kopf sieht zum Schwanz).
- Sie liegen im Waldboden vor dem Hochsitz (14 / 178,5): der Rabe bei (2 / 171,5), der Hirsch bei (22 / 166,5), etwa 16 m groß.
- Sie sind so ausgerichtet, dass sie vom Hochsitz aufrecht gelesen werden.
- Technik: ein Mesh-Streifen, 0,62 m breit, mit eigener Erd-Kachel und Normal-Map (helle, freigescharrte Erde, Ränder aus zur Seite geschobenem Laub).
- Vom Boden aus sieht man nur Furchen (Gedanke „Furchen im Laub …“). Oben auf dem Hochsitz kommt der Satz aus X-7 („Von hier oben … das ist ein Vogel …“) und danach der Hirsch.
- Wer sie gezogen hat, bleibt offen.

### GTA-V-Prinzip: Wandbild „Unser Dorf“
- Die Mauer steht neben der Haltestelle Kirchberg (x 13,65–19,45, z 50,9, 2,25 m hoch). Sie ist eine Box mit Scan-Putz `wall_plaster` und Deckstein `facade_concrete` und wird beim Laden gebaut, damit sie exakte Kollision hat.
- Das Bild wird erst beim Annähern (< 45 m) gemalt.
- Inhalt: ein Heimatbild der „Klasse 3b · Grundschule am Kirchberg · 1976“ mit Schriftband „UNSER DORF“ und dem Wappen (Turm über dem Abgrund). Es zeigt die Sonne mit Gesicht und eine blasse **zweite Sonne mit Lichterkranz**, die später übermalt wurde (die Übermalung blättert). Dazu Kapelle mit Friedhof, Gärten, Hof, Dorf, Bus „7“, Martinszug und Spielplatz.
- Alterung: verblasst und entsättigt, Regenschlieren, Risse, Algen am Fuß. Die Abplatzer sitzen in Nestern; darunter kommt die helle Grundierung, an wenigen Stellen der nackte Putz.
- Darüber haben Jugendliche geschrieben: „LINIE 7 KOMMT NIE“, „S + T“, „NIEMANDSLAND“.
- Mit „Wandbild ansehen“ öffnet sich eine Notiz mit dem Bild in groß, ohne Lösung im Text. Luke denkt einmal: „Ein Heimatbild mit zwei Sonnen …“.
- Versteckte Zeichen und wohin sie zeigen (`ZEICHEN_WAND_HINWEISE`):
  - ∴ im Sand unter der Rutsche → `k1_rutsche`
  - Rabe auf dem Brunnenrand mit Silber im Schnabel → `k1_brunnen`
  - Auge im Scheinwerfer des roten Treckers → `k1_hof`
  - Laterne am Fuß des linken Friedhofspfeilers → **neu `x7_tor`** (Ring + Batterie, Kap. 1–5, über `TAUSCH_FUNDE.push` vor dem Tausch-Aufbau)
  - offenes Gartentor „7“ → `k5_parzelle`
  - der Strahl der zweiten Sonne endet auf der Kreuzung → `k3_kreuzung`

## Kurz geprüft
LAUFPLATZHALTER

## Offen / Bitten
- **Testseiten:** Testbauten unter `game/` (z. B. `index_ap24.html`, `index_kr.html`) laden `three-mesh-bvh` nicht, denn die Import-Map dort zeigt aufs CDN ohne bvh.
  - Folge im Test: keine Kollision (Log: „Kollision TypeError: Failed to resolve module specifier 'three-mesh-bvh'“).
  - Mein Test lief deshalb über `app/game/index_zeichen.html`, lokalisiert wie `build.js` (Skript `C:/Users/GIGABYTE/_zeichen_t/lokal.js`).
  - Bitte an alle Agenten mit eigenen Testbauten: genauso testen.
- **Nazca von Kirchberg/Kapellenturm/Villa-Dachfenster:** Diese Blickpunkte gibt es nicht begehbar. Die Villa-Räume sind getrennte Innenräume ohne Außenblick. Deshalb liegen beide Scharrbilder am Hochsitz (Kap. 6).
  - Eine Kinoeinstellung von oben über ein Feld wäre ein Wunsch an das Kino-Modul, z. B. ein Abspann-Schnitt über den Hirsch.
- **Laternenbote / „Sie sind unter uns“ / Fahrplan 03:13:** Das ist die Zeitungs- bzw. Requisitenseite des GTA-Prinzips. Sie gehört zu den Modulen, die den Laternenboten bzw. Mikes Tankstelle bauen, und ist hier nicht gebaut. Den Fahrplanzusatz „03:13 nur für Kinder“ gibt es schon (ausbau_nord).
- **Hauptagent (Leistung):** Der Atlas kostet beim Laden etwa 0,1–0,2 s, das Wandbild beim ersten Annähern etwa 50–80 ms (Malen + Normal-Map in halber Auflösung).
