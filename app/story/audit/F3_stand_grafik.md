# F3 – Stand Grafik/Oberfläche (R-14, Q-3, Q-10-Licht, Schriften-Wunsch) · 01.10.2026

## Gebaut
**`app/mods/grafik.js`** (ORDER nach `bewohnt`, vor `hervorhebung`):
- **Oberflächen, zentral:** Die Bausteine sitzen in `THREE.ShaderChunk` (`lights_physical_pars_fragment`, `lights_physical_fragment`, `map_fragment`). Damit gelten sie für alle Standard- und Physical-Materialien. Es entstehen keine neuen Shader-Varianten, nur Böden aus `gruen.js` bekommen das Define `HAM_BODEN`. Die Uniforms `hamG[2]`/`hamT[2]` hängen an `ShaderLib.standard/physical`, ihre Arrays werden zwischen allen Materialien geteilt.
  - **Mikrostruktur:** Detail-Normalen, triplanar in Weltkoordinaten, nur nah (bis ≈ 9 m). Quelle ist der Scan `wet_asphalt/n`.
  - **Rauheit und Farbe:** Die Rauheit schwankt, und die Farbe schwankt großflächig. Maske ist `rust_sheet/orm` (Kanal G).
  - **Schmutz in Vertiefungen:** über die AO-Karte der Scans.
  - **Abgestoßene Kanten:** aus der Krümmung der Geometrie-Normale; Metall wird blanker.
  - **Gegen sichtbare Kacheln:** Große Kachelflächen mit UV > 2 bekommen eine zweite, gedrehte Abtastung.
  - **Nässe draußen** (`hamG[0].x`, folgt `indoor`, weich überblendet):
    - Oberseiten werden dunkel und glänzend.
    - An Wänden entstehen Laufspuren.
    - Am Sockel liegt Spritzwasser.
  - **Ausgenommen:**
    - Skinning (Figuren, Hände)
    - Durchsichtiges (also kein `OPAQUE`)
    - Transmission
    - Laub mit alphaTest bekommt nur Nässe.
- **Bildpass direkt nach dem RenderPass**, vor Bloom. Die Maske der Hervorhebung rastet davor ein und bleibt unberührt.
  - Er läuft in halber Auflösung.
  - **Verdeckung (SSAO):** 8 Proben, Normale aus der Szenentiefe, ausgeblendet ab 22–55 m und in hellem Direktlicht.
  - **Lichtstreuung im Taschenlampenkegel:** 12 Schritte, driftendes Rauschen in Weltkoordinaten. Drinnen ist die Streuung schwächer.
  - **Zusammensetzen:** Hochskaliert wird mit Tiefengewichtung (3 × 3).
  - Tiefentexturen an beiden Composer-Puffern, wie bei der Hervorhebung.
- **`filmPass` (Basis), neue Uniforms** `caK`, `sharp`, `grainK`, `dirtK`, `px`, `tBloom`, `tDirt`:
  - Linsenschmutz: Bloom × Schmutzmaske
  - Nachschärfen, begrenzt (keine Lichthöfe)
  - Filmkorn fein plus etwas gröber, in Schatten stärker als in Lichtern
  - Farbsaum an/aus. Die Hitze- und Tod-Effekte von feuer, tod und kino laufen weiter über `ca`.
- **Tonemapping:** ACES bleibt, passend zu Grading, Kalibrierung und Bildsprache.
- **Einstellungen:** Unter „Grafikqualität“ steht die neue Zeile „Grafik-Details → ANPASSEN“. Dort gibt es:
  - die Voreinstellung Hoch/Mittel/Niedrig
  - Oberflächendetail
  - Umgebungsverdeckung
  - Lichtstreuung
  - Linsenschmutz
  - Farbsaum
  - Filmkorn
  - Nachschärfen
  - Gespeichert wird in `settings.fx`. Ändert man die Grafikqualität, gilt wieder deren Voreinstellung. Standard ist „Hoch“, alles an (RTX 5070 Laptop). „Niedrig“ schaltet Detail, SSAO, Streuung und Schmutz ab.
- Testzugriff: `window.__grafik = { G, an(fx) }`.

**`app/mods/oberflaeche.js`** (nach `grafik`). Es ändert nur Aussehen und Übergänge, IDs und Handler bleiben unverändert.
- **Schriften je Funktion** (R-18), über CSS-Variablen `--f-*`. Konzept: `docs/gameplay/visual_identity.md` § 9.
  - Die Dateien liegen lokal in `app/vendor/fonts`, mit Lizenzdateien, nachgewiesen in `CREDITS.md`.
  - Neu sind 9 Familien: IM Fell English (+SC), Alegreya Sans (+SC), Kalam, Gochi Hand, Covered By Your Grace, Courier Prime und Julius Sans One.
  - Untertitel nutzen Alegreya Sans 500. Lukes Gedanken stehen in Kalam. Fremde Stimmen (`WEISS`, `LICHTSCHIFF`, `∴`, `BEOBACHTER`, `NIMMER`) erscheinen in Julius Sans One mit kaltem Leuchten. Die Klasse `.ob-fremd` steht anderen zur Verfügung.
- **Papier je Quelle:** `showNote` ist umhüllt. `data-src` wird aus Titel und Inhalt bestimmt:
  - **brief:** zwei Varianten, mit Falzen, Kaffeering und Stockflecken
  - **amt:** Bürobogen mit Lochung, Schreibmaschine und Stempel „EINGANG“ bzw. „VERSCHLUSSSACHE“; „Handschriftlich:“ in blauem Kuli
  - **druck:** Zeitungspapier in IM Fell
  - **lucy:** liniertes Heft, Bleistift
  - **kind:** Karoheft
  - **beob:** Schiefertafel mit körniger Kreide
  - **postit**
  - **handy:** dunkler Bildschirm
  - „Fibel:“-Randnotizen stehen in Lukes Handschrift.
  - Die Papiere werden beim Laden einmal auf Canvas erzeugt (Fasern, Wolken, Ränder).
- **Übergänge:**
  - Overlays (Notiz, Fibel, Rätsel, Pause, Tastenfeld) blenden weich ein und aus (`allow-discrete`, `@starting-style`), ebenso das Unterfenster.
  - Panels gleiten leicht unscharf herein.
- **Hauptmenü:** Regentropfen laufen über die Scheibe (Canvas in halber Auflösung, 30 fps, nur solange das Menü sichtbar ist). Das Kerzenflackern war schon da.

## Vorher-Lauf (Diagnose, `C:/Users/GIGABYTE/_r14/vorher/`, Seite aus den Modulen vom 01.10. vor den Änderungen)
- **Straße, Fassaden, Asphalt:** wirken nah glatt.
  - Holzfassaden und Putz haben im Lampenlicht gleichmäßige Rauheit und keinen Schmutz am Sockel.
  - Nasse Glanzstellen gibt es nur auf dem Straßenbelag (gruen).
  - Die Kachelwiederholung ist auf großen Flächen sichtbar.
- **Lichtkegel nach unten** (Gehweg an der Laterne): gibt eine flächige, beige „Plastik“-Fläche ohne Mikrostruktur.
- **Innenräume (Nr. 7, Nr. 1):** stimmungsvoll, aber Möbel und Kanten ohne Abrieb. In Ecken fehlt Kontaktverdunkelung (es gibt kein SSAO).
- **Figur (Hilde)** im Ruhe-Pose-Test: Figuren sind ausgenommen (Gesichter-Agent).
- **Wald:** Die gewählten Testpunkte waren schwarz bzw. leer. Die Punkte sind für den Schlusstest angepasst.
- **UI:**
  - Die Einstellungen und die Fibel sind schon hochwertig (Premium-Oberfläche).
  - Alles steht in Cormorant oder Georgia, ohne Hierarchie nach Funktion.
  - Rätsel-Knöpfe in Monospace.
  - Overlays springen hart auf und zu.

## Prüfung
- Syntax und Bau sind geprüft: `node tools/assemble.js` läuft fehlerfrei, `node --check` ebenfalls für beide Module.
- **Den Nachher-Lauf gibt es nicht.**
  - Der erste Versuch scheiterte, weil ein paralleles `build.js` die eigene Testseite gelöscht hatte.
  - Der zweite hing mehr als 20 Minuten in der Testwarteschlange und wurde nach der Vorgabe des Hauptagenten abgebrochen.
  - Laufzeit, Shader-Übersetzung und Optik sind also **ungeprüft**.

## Für den Schlusstest (bitte gezielt prüfen)
Schrittdatei und Generator: `C:/Users/GIGABYTE/_r14/steps.json` (`mk.py`, `run.sh <ausgabe> <seite>`). 10 Orte, dazu Menü, Einstellungen, Fibel, 3 Notizen (Lucy, Akte, Kreide), Rätsel und HUD. Vorher-Bilder liegen in `_r14/vorher/`. Kontaktbogen: `python _r14/sheet.py vorher <nachher> cmp`.
1. **Shader:**
   - Die Konsole darf keine `THREE.WebGLProgram: Shader Error` zeigen.
   - Die Bausteine stehen in jedem Standardmaterial. Ein Fehler dort wäre flächig sichtbar: schwarze oder rosa Flächen.
   - Auch Module mit eigenem `onBeforeCompile` prüfen, besonders gruen (`HAM_BODEN`) und kino (ersetzt `lights_physical_fragment`, hängt aber an).
2. **Bildpass:**
   - Ecken und Kontaktstellen sind dunkler (SSAO), es gibt kein Flackern und keine Halos an Silhouetten.
   - Der Taschenlampenkegel ist draußen im Regen als weicher Lichtschleier sichtbar, nicht als Fläche.
   - Bei `G.flashOn=false` ist kein Schleier zu sehen.
   - Keine Ränder oder Pixeltreppen beim Hochskalieren.
   - Die Reihenfolge in `composer.passes` muss stimmen: `RenderPass` → Hervorhebung-Maske → Grafik → NaN-Schutz → … → OutputPass → Glow → … → filmPass.
3. **Nässe:**
   - Draußen sind Oberseiten und Sockel dunkler und glänzender.
   - Drinnen trocknet es nach ≈ 1 s (`__grafik.G.wetK` → 0).
   - Straße und Gehweg aus gruen dürfen nicht doppelt dunkel werden.
4. **Leistung** (Gesamtmessung): Der Grafik-Pass sowie 7–9 zusätzliche Texturabtastungen je Standard-Fragment liegen in der Messung. Falls es zu teuer ist: zuerst `hamG[1].x`/Detail nur auf „Hoch“, oder SSAO auf Viertelauflösung.
5. **Einstellungen:**
   - „Grafik-Details → ANPASSEN“ öffnet das Unterfenster, die Schalter wirken sofort.
   - „ZURÜCK“ führt zu den Einstellungen zurück.
   - Die Voreinstellung schaltet auch `settings.gfx` um.
6. **Notizen:**
   - Papier und Schrift passen zur Quelle: Lucy liniert, Akte mit Stempel, Kreide auf Tafel.
   - Text ist lesbar und scrollbar.
   - Der Stempel verdeckt keinen Text.
   - Umlaute in allen Schriften sind korrekt.
7. **Übergänge:** Overlays blenden weich und blockieren nach dem Schließen keine Klicks (`pointer-events`). Der Hauptmenü-Start blendet sauber aus.
8. **Menüregen:** Tropfen laufen. Im Spiel gibt es keine Kosten, die Schleife pausiert, wenn `#start` nicht sichtbar ist.

## Offen / Bitten an andere
- Um Laternen gibt es keine eigene Lichtstreuung: Die Kegelmeshes, `coneMat` und der Nebelschein decken das schon ab, sonst wäre das Licht doppelt. Innenlampen haben noch keine Streuung.
- **Gesichter-Agent:** Figuren mit Skinning sind ausgenommen. Mikrodetail für die Haut liegt bei euch.
- **Fenster-Agent:** Glas mit `transparent` ist ausgenommen.
- **Wer neue UI-Texte baut:** `--f-*`-Variablen bzw. `.ob-fremd` nutzen (`visual_identity.md` § 9).
- Kein neues Asset nötig. Detail und Schmutzmaske kommen aus vorhandenen Megascans-Scans.
