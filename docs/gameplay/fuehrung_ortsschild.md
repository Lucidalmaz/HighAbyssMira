# Ortsschild: Einwohnerzahl 214 → 211 → 210 (Konzeption, Stand 12.10.2026)

Auftrag (Nutzer): Die neue Ziffer stand neben der alten und las sich wie „2110“ / „21.000“. Neu: **alte Zahl sauber durchstreichen (zwei kräftige Striche), die neue Zahl darunter** in Kreide, gut lesbar, mit eigener Schreib-Animation; gleiche Logik an Karte und Fibel.
Texte: `fuehrung_texte.json`, Art `ortsschild`, `karte`, `fibel_fund` (`FS-1-SC-01…07`). Kanon: Die Zahlen selbst bleiben (214, 211, 210); nur die Anordnung ändert sich.

## 1. Ist-Stand (Code gelesen)

**Schild** (`app/mods/strasse.js` Z.304–319): `BoxGeometry(.72, .30, .02)` bei (−72,28 | 1,47 | 6,30), Textur 512×214 (Canvas, Z.314–316).
- Gedruckt: „Einwohner 214“, Arial fett 62 px, mittig, Grundlinie y = 128.
- **Roter Strich: ein einziger, von x = 248 bis 470 (y 112→96)**. Er liegt über „ner 214“ und streift das Wort.
- „211“ in Rot, `Caveat` 64 px, **zentriert bei x = 430, y = 196** (rechts unten).
- Bleistiftstrich: kleiner Zug bei x = 476–489, y = 150–197 (rechts neben der 211).
- Zwei `interact`-Texte (Z.319), je nach `state.ch1Done`/`kap() ≥ 2`; Wortlaut „Darunter … durchgestrichen, 211. **Daneben** …“.

**Abspann Kap. 1** (`kino.js` Z.957–965, Funktion `kino_schild` Z.499–510): Shot 4 s; `sfx`: 0,6 s Textur „2“ + `kino_kreide`; 1,15 s „21“; 1,7 s „210“; 2,6 s `kino_still`. Die Kreide-Schrift (`chalk`, Z.505): `Caveat` 62 px, Füllfarbe `rgba(58,56,52,.88)`, **ab x = 310, y = 198**, leicht gedreht. Die 210 landet damit **direkt neben der 211** (211 reicht ca. von 395 bis 465) und die Ziffern laufen optisch zusammen: „210211“.
**Bleibt danach:** `kino_persist` (Z.784–787, alle 1,5 s) setzt Textur „210“, sobald `state.ch1Done || state.ch2 || ch3.on || kap() ≥ 2`. Hauptmenü-Kulisse: `menue.js` Z.140 / Z.290.
**Interaktionstext:** `traum.js` `k1_ortsschildPrep` / `K1_S.act210` (Z.328–337) tauscht die `userData.action` von Tafel und Zusatzschild.
**Karte** (`karte.js` Z.275–281, `karte_ueber`): „Einw. 214“ (176,180, 38 px) mit rotem Strich (168,183→320,176); „211“ rot bei (338,178); ab `k ≥ 2` grauer Strich (332,183→392,173) und „210“ bei (404,181); ab `k ≥ 5` kurzer Strich bei (468,164→474,194).
**Fibel**: keine eigene Seite; die Zahl steht nur auf der Karte (Reiter KARTE, Blatt „dorf“) und in der Tafel-Aktion.
**Basis-Schild** `_base_source_index.html` Z.1894 („Einwohner: 214“) wird von strasse.js ausgeblendet (`msHide`), bleibt unverändert.
Kanon: `story_final.md` Z.743 und Z.893 sagen „daneben mit Kreide 211“, „Daneben ein frischer Bleistiftstrich“; Z.1108 „Texturtausch auf 210“.

**Ursache der Lesbarkeitsprobleme:** (1) drei Zahlen in einer Zeile, ohne Zeilenwechsel; (2) die 211 steht fast an der Stelle, an der die 210 beginnt; (3) der rote Strich ist einer, schräg über das halbe Wort; (4) bei 0,72 m Breite und 62 px Schrift sind die Ziffern in der Ansicht aus 3–4 m klein.

## 2. Soll: drei Zeilen, zwei Striche je alte Zahl

Das Zusatzschild wird **höher** (Breite bleibt), damit drei Zeilen Platz haben und die Ziffern größer werden.

| Größe | Alt | Neu |
|---|---|---|
| Box | .72 × .30 × .02 | **.72 × .46 × .02** |
| Mittelpunkt y | 1,47 | **1,39** (Oberkante bleibt bei 1,62, unter der Tafel bei 1,665 unten) |
| Textur | 512 × 214 | **512 × 328** |
| Klickfläche (`interact`) | Mesh | gleiche Mesh, keine Änderung |

Layout (Textur-Pixel, x von links, y Grundlinie):

| Zeile | Inhalt | Schrift | Grundlinie | Farbe | Zustände |
|---|---|---|---|---|---|
| A | „Einwohner 214“ | Arial fett 56 px, mittig | y = 84 | `#111` gedruckt | immer; **214 trägt zwei rote Striche** |
| B | „211“ | `Caveat` 72 px, linksbündig unter dem „2“ der 214 | y = 184 | Lackrot `rgba(150,10,10,.9)` | ab Start |
| C | „210“ | `Caveat` 80 px, gleiche Linksbündigkeit | y = 284 | dunkle Kreide `rgba(58,56,52,.9)` | ab Kap.-1-Ende; vorher nur ein **Bleistiftstrich** (2 px, `rgba(90,88,84,.5)`, 30 px lang) an der Stelle der Anfangsziffer |

Streichungen (Dimension aus `measureText`, nicht fest verdrahtet):
- Z0: **zwei** rote Striche über der **Zahl 214 allein**, nicht über dem Wort: Strich 1 von (x₀−6, y 62) nach (x₁+8, y 56), Strich 2 von (x₀−4, y 52) nach (x₁+6, y 70); Breite 7 px, leichte Pinselstärke (±1,5 px je 40 px Länge), Lackrot, `lineCap: round`. x₀/x₁ = linke/rechte Kante der „214“ aus `measureText("Einwohner ")` und `measureText("214")`.
- Z1: **zwei** dunkle Kreidestriche über der 211 (gleiche Geometrie, aber Breite 6 px, Kreidekorn über `destination-out` wie in `chalk`, Z.505), damit sichtbar „anderes Werkzeug, anderer Zeitpunkt“ ist.

Zustände:

| Z | Wann | Zeilen |
|---|---|---|
| Z0 | Spielbeginn bis Ende Kap. 1 | A mit zwei roten Strichen; B 211 rot; C Bleistiftstrich |
| Z1 | ab Abspann Kap. 1 (Persistenz `kino_persist`) | A durchgestrichen rot; B durchgestrichen Kreide; C 210 Kreide |
| Z2 | Ende C Kap. 3 (Kanon: „ALLE“) | wie Z1 plus „ALLE“ unter der 210 in Kinderschrift (bisher `kino_schild('alle')`; Aufruf im Repo nicht gefunden → vor Einbau prüfen) |
| Z3 | Kap. ≥ 5 | wie Z1; unter der 210 ein kurzer Bleistiftstrich (Parallele zum Karten-Strich ab `k ≥ 5`, karte.js Z.281) |

## 3. Schreib-Animation (Abspann Kap. 1, Shot 29–33, 4 s)

Statt der drei Texturwechsel (`2`/`21`/`210` bei 0,6/1,15/1,7 s) eine kontinuierliche Zeichnung:

| t (s) | Ereignis | Ton |
|---|---|---|
| 0,0–0,5 | Kameraeinschwenk (unverändert), Regen | `kino_regen` |
| 0,5 | Kreide-Ansatz | `kino_kreide` (3 Kratzer, vorhanden) |
| 0,6–0,95 | Strich 1 über der 211 (links → rechts, 0,35 s) | Kratzer 1 |
| 1,05–1,35 | Strich 2 (rechts → links, 0,30 s) | Kratzer 2 |
| 1,5–2,6 | „2“, „1“, „0“ nacheinander (je ~0,35 s), Schreibweise von oben nach unten, die „0“ zuletzt geschlossen | Kratzer 3 + leises Klacken beim Absetzen |
| 2,6 | Kreidestaub fällt (3–4 Partikel, 0,4 s), Stille (`kino_still`) | – |

Technik: `kino_schildAnim(von, nach)` in kino.js neben `kino_schild`; ein `CanvasTexture`, je Bild (`WORLD_TICK`) nur die Teilstrecke der Polylinien zeichnen (`kapitel1_kreideStrich`-Prinzip: mehrere dünne Züge + Korn; Polylinien je Ziffer vorab festlegen, nicht per `fillText`, damit die Schrift als Handschrift wirkt und mit dem Zug wächst). Bis zum Abschluss `needsUpdate` je Bild, danach einfrieren und als Textur „210“ in den Cache (`S.tex.schild['210']`). Überspringt der Spieler den Shot (Skip/`kino_skip`), wird sofort der Endzustand gesetzt (wie `done() { kino_schild('210'); }`, Z.965).
Arbeitsaufwand: ein Canvas, 512×328, ca. 60 Bilder; kein Zusatzlicht, keine neuen Assets.

## 4. Wo es steht (Einbauliste)

| Datei | Stelle | Änderung |
|---|---|---|
| `app/mods/strasse.js` | Z.314–316 | Box .72×.46, y = 1,39, Textur-Zeichnung für Z0 nach §2; Interaktionstext Z.319 → `FS-1-SC-01` (zwei Zeilen) |
| `app/mods/kino.js` | Z.499–510 `kino_schild` | Zustände `orig`/`210`/`alle` auf Drei-Zeilen-Layout; neue `kino_schildAnim`; Z.957–960 Shot-`sfx` ersetzen |
| `app/mods/kino.js` | Z.784–787 | unverändert (Persistenz), nur Zustand „210“ nach neuem Layout |
| `app/mods/traum.js` | Z.334 | `act210` → `FS-1-SC-03`; neu Gedanken `sc_erst`/`sc_zehn` (gedanken.js) |
| `app/mods/karte.js` | Z.278–281 | Zahlen untereinander (rechts von „Einw.“: Spalte x≈330, y 160/192/224, Schrift 36 px); Strichlogik wie am Schild; Kollision mit dem Kartenfeld prüfen (Kopfbereich endet y≈200) |
| `app/mods/menue.js` | Z.140, Z.290 | kein Code; benutzt `kino_schild` weiter |
| Fibel | neuer Fund `ortsschild` (kapitel1.js `kapitel1_lore`) | `FS-1-SC-07`, beim ersten Lesen der Ortstafel |
| `app/story/story_final.md` | Z.743, Z.893 | **nicht geändert** (Kanon); Wortlaut „daneben“ weicht von der Darstellung ab → Autorenfreigabe einholen |

Nicht ändern: die Tafel „Lost Eyengless · Landkreis Hohen Abgrund“ (Z.305–313), die Pfosten, die Basis-Schilder.

## 5. Texte (aus dem JSON)

- `FS-1-SC-01` (Z0, zwei Zeilen): „Lost Eyengless. „Einwohner 214“, zweimal rot durchgestrichen. Darunter: 211.“ / „Darunter ein Bleistiftstrich. Als hätte jemand schon angesetzt, sie wieder zu ändern.“
- `FS-1-SC-03` (Z1): „Lost Eyengless. 214 und 211 sind durchgestrichen.“ / „Darunter, frisch in Kreide: 210.“
- `FS-1-SC-04` (Gedanke, erster Blick Z0): „214, dann 211. Irgendwer führt hier Buch.“
- `FS-1-SC-05` (Gedanke, erster Blick Z1): „210. Die Kreide ist noch frisch. Frau Wendt ist erst vor Minuten fort.“
- `FS-1-SC-06` (Karte): drei Zeilen untereinander.
- `FS-1-SC-07` (Fibel-Fund): „Einwohner 214. Rot durchgestrichen, darunter 211. / Später: 211 durchgestrichen, darunter 210.“

Die Texte deuten die Zahlen nicht (214 → 211 sind drei weniger, 211 → 210 einer; der Kanon rechnet das nicht vor). Gedanke `sc_zehn` stützt sich nur auf das, was Luke in Kap. 1 gesehen hat (Hilde im Strahl).

## 6. Prüfung nach dem Einbau
1. Bildbeleg aus 3 m am Start (Z0): beide Striche sichtbar, 214 lesbar durchgestrichen, 211 darunter, Bleistiftstrich, keine Überlappung mit der Tafel.
2. Abspann: Frames bei 0,7 / 1,2 / 2,0 / 2,7 s (Strich, Strich, „21“, „210“).
3. Nach Laden (Kap. 2): sofort Z1 ohne Animation.
4. Menü-Kulisse nach Kap. 1: Z1.
5. Karte (alle Kapitel 1–6): kein Zusammenlaufen der Zahlen.
6. Perf-Gate (`node app/tools/perf_gate.mjs`): keine neue Draw-Call-Zahl (selbe Box).

## 7. Offenes
- „Schrift muss echt wirken“ (Nutzer): die Ziffern entstehen als Kreide-Polylinien, der gedruckte Schriftzug „Einwohner“ bleibt Canvas-Arial wie im Bestand. Ein echtes Schild-Modell (Scan) ist nicht vorhanden; Kandidaten in `download_kandidaten.md` nicht geprüft.
- Kanon-Wortlaut „daneben“ (story_final Z.743/893) → Nutzer/Autor bestätigen.
- `kino_schild('alle')` hat keinen gefundenen Aufrufer; Ende-C-Darstellung vor Einbau klären.
- Boxhöhe .46 ist so gewählt, dass Unterkante (1,16 m) über dem Boden und unter dem Tafelblech bleibt; Kollision/`interact`-Treffer nicht gemessen.
