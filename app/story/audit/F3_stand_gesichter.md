# F3 Stand Gesichter (Q-6) und fehlende Figuren – 01.10.2026

Auftrag: Q-6 (Gesichter realistischer und lebendiger), fehlende/falsche Figuren aus `F3_uebergaben.md`, Hund Bruno (Q-9 B-3), dazu R-3 (Körperteile verschwinden, Grundmodelle).
Geändert: `app/tools/forge.html`, `app/tools/cast.json`, `app/tools/chars_pack.mjs`, `app/mods/figuren.js`, alle `game/assets/chars/<id>/model.glb`, neu `game/assets/ms/hund/model.glb`;
kleine Haken in `weiss.js` (Mira, Voss, Bruno grau bei Zayn), `kapitel5.js` (Voss), `kapitel3.js` (Luke 26 von hinten), `lucy3.js` (Frau Reuter), `bewohnt.js` (Bruno in Vegas' Stube, Kap. 4). CREDITS ergänzt.

## 1. Werkstatt (forge.html) – alle 33 Figuren neu gebaut
- **Gesichtsformen behalten** (`FACE_RE`, 36 Formen): `Eye_Blink_L/R`, `Eye_[LR]_Look_(L|R|Up|Down)`, `Eye_Squint`, `Eye_Wide`, `Brow_Raise_Inner/Outer`, `Brow_Drop`, `Mouth_Smile/Frown/Stretch/Press`, `Nose_Sneer`, `Cheek_Raise` (je L/R), `V_Open`, `V_Tight_O`, `V_Wide`, `V_Explosive`. Vorher fielen beim Export alle ~140 CC-Formen weg (nur Wolter/Nachsorge/Gisela hatten 11).
- **`F.faceSplit`**: Bei CC-Körpern (Kinder) liegen Kopf, Rumpf, Arme, Beine in EINEM Netz – Kopf + Wimpern werden ein eigenes Netz `Gesicht_*` mit den Formen (~5 100 Ecken), der Rest ohne Formen. Augenschatten/Tränenrand behalten ihre Lid-Formen.
- **`F.morphTransfer`**: Bart-Köpfe ohne Formen (HB → Vegas, HB2 → Günther) bekommen die Formen des NoEdge-Mannes (MN) übertragen (normierter Gesichtsrahmen, 4 nächste Nachbarn je Art Haut/Wimpern/Augenschatten; Bart folgt der Haut). `cast.json`: `head.morphFrom: "MN"`.
- **Augapfel-Knochen** beim Kopftausch (`F.headSwap`, `eyeBones`): Erwachsene bekommen `R_Eye`/`L_Eye` im Kopfknochen (Pivot = Augapfelmitte, Inverse so gewählt, dass die Ruhelage gleich bleibt) – vorher standen die Augäpfel aller Erwachsenen starr.
- **Haut** (`FACE_FRAG`): Poren (Nase/Wangen dichter), Rötungszonen (Nasenflügel, Lider, Kinn, Ohren), bläulich-violette Augenringe + Tränenrinne, Stirn leicht gelblich, Fleckigkeit, Altersflecken und knittrige Haut ab Alter 0,5; Falten breiter und weicher (vorher harte Striche).
- **Locken** (`F.curls`, Weg wie AP-12 Justin): MotionstudioArts „Curly Hairs Brown“ (locken04) auf den FHQ-Kopf angepasst, 45 % der Haarkarten (ganze Karten, fester Samen) → `mira`. `recolorHair(…, sheen)`: helle Strähnen ziehen zu Scharlachrot.
- **Frisur ohne Texturen** (`swapHair` ohne Skelett/CC-Augen + `F.hairAlpha`): NoEdge „hair 7“ (lang, offen) – die eingebettete Deckkraft-PNG ausgelesen (`HAM_FabDownloads/v6/x/h_long__fbx/hair7_opacity.png`).
- **Zubehör** (`F.prop`): Lesebrille (Rikokenz) im Gesichtsrahmen, als SkinnedMesh am Kopfknochen; Gläser als einfaches Glas (kein Transmission-Durchgang im Spiel).
- Prüfoptionen: `F.buildCast(ids, { anim: false, faceShots: true })` → Nahaufnahmen Ruhe/Blinzeln/Angst/Trauer/Blick/Mund + Rückansicht.
- `chars_pack.mjs`: Blechmann bleibt in `chars.json`; gltfpack-Vereinfachung wird verworfen, wenn sie ein Netz mit Gesichtsformen verändern würde.

Neubau-Reihenfolge (gelaufen): `_forge_run.sh _gs_build.json` → `node tools/chars_pack.mjs` → `node tools/mocap_bake.mjs <alle> --no-ktx` → `node tools/ktx.mjs`.

## 2. Neue/geänderte Figuren (cast.json)
| id | Aussehen | Quelle | im Spiel |
|---|---|---|---|
| `mira` | dunkelbraune Locken mit Scharlachschimmer, dunkles weinrotes Kleid | Girl in Yellow + FHQ-Kopf + Locken 04 | weiss.js Raum 3 (Nachbild, vorher dina_erw) |
| `voss` | Pfarrer im schwarzen langen Mantel („Talar“), graues Haar | Doctor/Torturer + MN-Kopf | weiss.js Raum 2 (grau), kapitel5.js Friedhof gz3 (vorher amt1) |
| `hilde_tot` | Nachthemd (Kleid fast weiß), barfuß, langes offenes weißes Haar | Girl in Yellow + FN + hair 7 | wie bisher (Schreckgestalt „Nicht du“) |
| `gisela` | 78: Strickjacke verwaschen blau, dunkle Hose, dunkelgrüne Gummistiefel, Gesicht maximal gealtert | Russian Girl West + FN | wie bisher |
| `luke_erw` | Luke mit 26, dunkelbraunes Haar, dunkle Jacke, Jeans – nur von hinten | Office Worker 3 + MN | kapitel3.js „Augen zu“-Umriss (vorher amt2) |
| `reuter` | Roxys Mutter: dunkles Haar, grüne Augen, gedecktes Kleid | Office Worker 7 + FN | lucy3.js Nachhall 5 (vorher aydin) |
| `hilde` | + Lesebrille tief auf der Nase | Metal Round Glasses | wie bisher |

`FIGUREN_ERSATZ` (figuren.js): fehlt eine neue Figur in `chars.json`, lädt `figuren_load` den alten Stellvertreter.

## 3. Bewegungsschicht Gesicht (figuren.js) – API
- `figuren_mimik(P, 'angst'|'trauer'|'erleichterung'|'misstrauen'|'wut'|'schmerz'|'erschoepft'|'leer'|null, gewicht, dauer)`; ohne Modul-Mimik wählt der Clip (fear/nervous → Angst, weinen → Trauer, erschoepft → erschöpft, talk_wut → Wut, arme_verschraenkt/alert → Misstrauen, husten → Schmerz).
- `figuren_sprich(P, sek, { amp, pegel })` – Mund (V_Open/V_Wide/V_Tight_O/V_Explosive) im Silbenrhythmus oder nach Pegel. `figuren_mund(wer, sek, o)` über den Sprechernamen. **Untertitel mit Sprecher bewegen den Mund der nächsten passenden Figur automatisch** (Wrapper um `subtitle`, Gedanken LUKE/DU ausgenommen).
- **Haken Sprachausgabe (X-1):** `stimmen_spielen` soll `figuren_mund(wer, dauer, { pegel: () => analyser-Pegel 0…1 })` aufrufen → Lippen folgen der echten Stimme.
- `figuren_gesicht(id)` → Fähigkeiten; `P.autoBlick = false` schaltet den Automatikblick ab. Testzugang `window.__figuren.{mimik, sprich, mund, gesicht, hund}`.
- Je nahe Figur und Bild: **Blinzeln** zufällig 2–6 s, versetzt, 14 % Doppelblinzeln, schneller bei Angst/Blendung, Blinzeln bei großen Blicksprüngen; **Sakkaden** (klein beim Hinsehen, ruhiges Umherschauen ohne Ziel), Lider folgen dem Blick (Look-Formen); **Mikro-Mimik** alle 2,5–8,5 s; **Mikrobewegung des Kopfes** + Nicken beim Sprechen; **Automatikblick** zum Gesprächspartner (im Gespräch < 4,5 m, beim eigenen Sprechen < 9 m) und kurz ins Licht, wenn die Taschenlampe trifft (dazu Kneifen/Brauen runter). Atmung war schon da.
- **Starr** (kein Blinzeln, kein Automatikblick, keine Mikro-Regung): graue, gezaehlt_j/_m, hilde_tot – das Starren ist ihr Grusel.
- **Materialien** (einmal je Vorlage): Haut mit Poren-Relief (prozedural, verblasst mit der Entfernung, kein Flimmern) und warmer Streuung; Hornhaut additiv glänzend mit Lichtpunkt (stärker bei eingeschalteter Taschenlampe); Tränenrand nass; Haare/Wimpern/Brauen: Deckkraft wächst mit der Mip-Stufe.
- Kino-Figuren (kino.js) blinzeln jetzt auch; Untertitel-Sprecher bewegen ihren Mund (ohne Änderung an kino.js).

## 4. Hund Bruno (Q-9 B-3)
`figuren_hund(eltern, x, z, { y, ry, s, grau, an, ab, wandern })` – styloo „Dog“ braun umgefärbt, dünner weißer Ring in den Augen (`ms/hund/model.glb`).
„Falsch“: bellt nie, kein Laut, atmet nicht (Ruhe-Clip steht, zuckt alle 5–14 s kurz), Kopf/Hals drehen sich eine Sekunde zu spät, gleichmäßig und bis 115° nach Luke; beim Gehen frieren die Beine mitten im Schritt ein, der Körper gleitet weiter.
Eingebaut: Kap. 4 Vegas' Stube (bewohnt.js, Liegeplatz an der Tür, geht ab und zu 0,7 m in den Raum) · Kap. 3 Abgrund (weiss.js, grau zu Zayns Füßen, folgt Zayns Stuhl).
Nicht eingebaut: Kap.-3-Schluss-Kino („Bruno hinterher“, kino.js) – Kino-Agent kann `figuren_hund(scene, x, z, { wandern })` nutzen.

## 5. R-3 „Körperteile verschwinden“ – geprüft
- Figurenteile: alle Netze aus `figuren_load` haben `frustumCulled = false`; Kino klont mit `false`; Justins kopf.glb ebenfalls. DCULL (Kleinteile < 1 px) nimmt SkinnedMesh und `frustumCulled = false` aus → betrifft Figuren nicht. VCULL/RIGS blenden nur ganze Figuren außerhalb des Blickfelds (+6 m Rand) bzw. hinter dem Nebel aus. Nahebene 0,05 m. `figuren_guard` nimmt nur die Zusatzschicht weg, nie Teile.
- **Behoben (Ursache 1):** Haarkarten/Wimpern/Brauen dünnten mit der Entfernung durch Alpha-Test + Mipmaps aus, bis Haare „weg“ waren → Deckkraft je Mip-Stufe angehoben (`figuren_haarMat`).
- **Behoben (Ursache 2):** Erinnerungs-Material (`figuren_ghostMat`) verwarf Pixel überall nach Rauschen → Arme/Beine wirkten lückenhaft; jetzt zerfällt nur der Umriss.
- **Verdacht, nicht geändert:** `F.cull` (Werkstatt) entfernt Haut UND innere Stofflagen unter der Kleidung; spreizt sich die Kleidung in einer Bewegung, kann man durch die Lücke sehen. Ändern erst nach Sichtprüfung im Spiel (Abwägung gegen Durchstechen).

## 6. Fähigkeiten je Figur
(siehe Abschnitt 7 – aus dem Neubau und dem Prüflauf)

## 7. Prüfung
(folgt)

## 8. Offen / fehlende Assets
- Bessere Grundmodelle (R-3): Wunschliste an den Hauptagenten geschickt (Reallusion CC Kevin/Nia, ältere Personen realistisch, Kinder, Talar, Nachthemd, Gummistiefel, Brillenkette, Haarkarten mit Texturen, realistischer Hund).
- Hildes Perlenkette fehlt (kette.obj = rostige Kette, 61 MB – ungeeignet).
- Talar ist ein schwarzer Mantel (kein echtes Talar-Asset), Nachthemd ist das umgefärbte Kleid, Gummistiefel sind die umgefärbten Stiefel von „Russian Girl West“.
- Leo3DCG-Augen und kuroru0-Wimpern nicht eingesetzt: die CC-Wimpern folgen den Lid-Formen, fremde Wimpern würden beim Blinzeln stehen bleiben; die CC-Iris hat bei 1024 px dieselbe Auflösung.
