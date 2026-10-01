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
- **Sprachausgabe (X-1, stimmen.js):** stimmen.js ruft je Bild `figuren_mund(stimme, pegel 0…1)` auf → figuren.js erkennt den Pegel-Aufruf (zweites Argument ≤ 1, kein drittes), sucht die sprechende Figur (Cache 0,6 s) und lässt die Lippen der echten Hüllkurve folgen; Pegel 0 schließt den Mund. Ohne Stimme: Silbenrhythmus aus dem Untertitel.
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
- Schemen-Figur `assets/ghost/ghost.glb` ist jetzt ein NoEdge-Körper (siehe 7) – alle Teile SkinnedMesh, `frustumCulled = false` in Basis/fassaden/innen_kapitel.
- **Verdacht, nicht geändert:** `F.cull` (Werkstatt) entfernt Haut UND innere Stofflagen unter der Kleidung; spreizt sich die Kleidung in einer Bewegung, kann man durch die Lücke sehen. Ändern erst nach Sichtprüfung im Spiel (Abwägung gegen Durchstechen).

## 6. Fähigkeiten je Figur (nach Neubau, aus den GLBs)
| Figuren | Formen | Lid-Blinzeln | Augapfel-Knochen | Mimik/Mund | Bemerkung |
|---|---|---|---|---|---|
| Kinder: zayn roxy lucy luke luke_echt heidi dina mike cleo kleine | 36 (Gesicht) + Lid-Formen an Augenschatten/Tränenrand | ja | ja (CC) | ja | CC-Kopf, Gesicht als eigenes Netz |
| graue, gezaehlt_j/_m | 36 | – (absichtlich starr) | ja | ja | Behaltene: kein Blinzeln, kein Automatikblick |
| Erwachsene mit NoEdge-Kopf: mama hilde lucy_erw amt1 amt2 lorenz aydin dina_erw polizist wolter nachsorge11/12 gisela mira voss luke_erw reuter | 30–36 | ja | ja (neu) | ja | hilde_tot starr |
| vegas | 36 (übertragen vom NoEdge-Mann, auch Bart) | ja | ja | ja | Kopf jetzt „Realistic Man“ (echtes Hautfoto), grau gealtert |
| guenther | 36 (übertragen) | ja | ja | ja | Bart-Kopf HB2 |
| justin | eigener Weg (justin.js: Lider als Form, Augen im Shader) | ja | – | nein | Bewegungen jetzt Fab-Mocap |
| blechmann, peter | – | – | – | – | Gasmaske bzw. Kreatur (anderes AP) |

## 7. R-3/R-13 Grundmodelle, Lizenz-Bereinigung
- Neue Fab-Figuren (`HAM_FabDownloads/v18_figuren`) geprüft: **„Realistic Man Base Mesh“** hat echte 2K-Hautfotos → Kopf für **Vegas** (`look.real`: Foto bleibt, darüber nur Alterung/Augenringe/Tönung; Formen per Übertragung). **„Hair 1“** (Pferdeschwanz) → Frau Reuter. „Free High-Quality Female/Male“ sind dieselben Netze wie FHQ/MN (keine Hautfarbe im Paket, nur Rauheit/SSS) → kein Gewinn. **Camilia**: FBX bricht im Lader ab (Netz ohne Skin, „Kopf nicht gefunden“) → nicht verwendet. **Business man** (Rigify, MakeHuman, Texturen fehlen) und **Old man** (Auto-Rig Pro, 2 112 Knochen) nicht verwendet. Für weitere echte Gesichter fehlt weiterhin Material (Frauen, Alte, Kinder).
- **Epic-Vorlage entfernt:** `game/assets/ghost/ghost.glb` = NoEdge-Mann (Körper, ohne Haar/Augen/Wimpern), grau, Mocap `idle`/`walk` (Motifect) – Aussehen als Schemen bleibt (Basis/fassaden/innen_kapitel ersetzen das Material). Alte `ghost.glb.ktx.glb` (Quinn) gelöscht.
- **Justin:** `tools/justin_mocap.mjs` holt das GLB aus `game/justin.js`, backt den Satz `justin` (cast.json: idle = Motifect idle_neutral, walk = walk_forward, talk = Mocap.in talking, draw = pick_up_object_table) mit `mocap_bake.mjs` auf das UE5-Skelett und schreibt `justin.js`/`justin.glb` zurück; MM_Idle, MF_Unarmed_Walk_Fwd, MM_Attack_01, MM_Death_Front_01 entfernt. `knien` (mocap.json, Motifect) bleibt. `mocap_bake all` überspringt Figuren ohne model.glb (Justin).
- Suche nach `MM_`, `MF_`, `Quinn`, `SK_Mannequin` in `game/` (glb/js/json): keine Treffer mehr. Ausnahme: UEFN-Manny-Zombie-Mocap (Teddy Goldstien, Fab) steckt als Clips `z_*` in graue/gezaehlt/hilde_tot/polizist – Lizenz „prüfen“ (Hauptagent).

## 8. Prüfung
- Werkstatt-Vorschauen (forge, ohne Spiel): alle 33 Figuren mit Ruhe/Blinzeln/Angst/Trauer/Blick/Mund, Rückansicht – Blinzeln beide Lider, Augapfel-Knochen drehen, Mimik sichtbar, keine kaputten Netze. Bilder: `C:/Users/GIGABYTE/_forge_gs/build/`.
- Neubau-Kette gelaufen: forge → chars_pack → mocap_bake (alle, `--no-ktx`) → ktx (Vegas nachkonvertiert, weil ein paralleler KTX-Lauf das noch ungebackene GLB erwischt hatte). KTX-Fassungen geprüft: Formen, Clips, `motion`, Augenknochen vorhanden.
- Spiel-Nahlauf **nicht gelaufen** (Testwarteschlange voll, Anweisung Hauptagent: nach 20 min abbrechen). Gelaufen: Syntax aller geänderten Module/Werkzeuge, `assemble.js`. Fertiger Prüflauf liegt bereit: `bash /c/Users/GIGABYTE/_gs_run.sh` (Schritte `C:/Users/GIGABYTE/_gs_test/steps.json`, Ergebnis `_gs_test/out/filmstreifen.jpg` + `faehigkeiten.json`).

### Im Schlusstest prüfen (Gesichter/Figuren)
1. Nahaufnahme einer Figur (z. B. `__figuren.show('zayn', …)`, Kamera 0,6 m): Blinzeln alle 2–6 s mit beiden Lidern, Sakkaden, Lider folgen dem Blick; `__figuren.mimik(P,'angst'|'trauer'|'misstrauen')` sichtbar und weich; `__figuren.sprich(P,3)` Mund bewegt sich.
2. Haut im Spiel: Poren-Relief flimmert nicht (Nähe und 5–10 m), keine Shader-Fehler im Log (`fig_haut`, `fig_cornea`, `fig_haar`); Hornhaut-Lichtpunkt sichtbar, Augen nicht milchig/zu hell.
3. Gespräch mit Vegas (Kap. 1 Tür / Kap. 4 Stube): Vegas schaut Luke an, Lippen bewegen sich mit der Sprachausgabe (stimmen.js-Pegel), neuer realistischer Kopf passt zum Körper (Halsübergang, Hut).
4. Taschenlampe auf ein nahes Gesicht: Figur kneift, blickt kurz ins Licht; Behaltene (graue, gezaehlt, hilde_tot) blinzeln NIE und schauen nicht von selbst.
5. Neue Figuren an ihren Orten: Mira (Raum 3, Nachbild, Locken), Voss (Raum 2 grau / Friedhof Kap. 5), Luke 26 als Umriss (Kap. 3 „Augen zu“), Frau Reuter (lucy3 Nachhall 5), Hilde mit Lesebrille, Hilde „Nicht du“ (Nachthemd, offenes Haar, barfuß), Gisela (Gummistiefel).
6. Bruno: Kap. 4 Vegas' Stube (steht still, Kopf dreht spät/zu weit, geht ruckhaft 0,7 m – nicht durch Möbel), Kap. 3 Abgrund grau neben Zayns Stuhl (Lage/Höhe).
7. Schemen (`ghost.glb`, neu): Echo-Umrisse, Fenster-Silhouetten (fassaden), Kokon (innen_kapitel Amt) – Form, Größe, Bewegung idle/walk.
8. Justin: idle/walk/talk/draw (neue Mocap) – kein Gleiten (Schrittmessung), Knien weiter ok, Helm/Schild/Schwert sitzen.
9. Leistung: Kinder jetzt 76–107 k Dreiecke (Nimmerheim: 7 Kinder sitzend); Figuren-Tick `__figuren.MV.ms`.
10. Körperteile: Haare/Wimpern in 10–30 m nicht ausgedünnt; Nachbilder (Erinnerungs-Material) zerfallen nur am Rand.

## 9. Offen / fehlende Assets
- **Dreiecke:** gltfpack würde die Gesichtsnetze vereinfachen (Lider zerfallen) → `chars_pack` lässt solche Modelle jetzt unvereinfacht: Kinder 76–107 k statt 45 k Dreiecke. Für die Schluss-Leistungsprüfung: ggf. Körper-LOD/Vereinfachung ohne Gesichtsnetz.
- Peter (Kreaturen-Agent) steht in cast.json/mocap und wurde von chars_pack/mocap_bake mitbehandelt (unverändert vereinfacht, 20 Clips neu gebacken).
- Bessere Grundmodelle (R-3): Wunschliste an den Hauptagenten geschickt (Reallusion CC Kevin/Nia, ältere Personen realistisch, Kinder, Talar, Nachthemd, Gummistiefel, Brillenkette, Haarkarten mit Texturen, realistischer Hund).
- Hildes Perlenkette fehlt (kette.obj = rostige Kette, 61 MB – ungeeignet).
- Talar ist ein schwarzer Mantel (kein echtes Talar-Asset), Nachthemd ist das umgefärbte Kleid, Gummistiefel sind die umgefärbten Stiefel von „Russian Girl West“.
- Leo3DCG-Augen und kuroru0-Wimpern nicht eingesetzt: die CC-Wimpern folgen den Lid-Formen, fremde Wimpern würden beim Blinzeln stehen bleiben; die CC-Iris hat bei 1024 px dieselbe Auflösung.
