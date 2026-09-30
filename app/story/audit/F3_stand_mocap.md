# F3 Stand AP-MOCAP – Motion-Capture-Grundlage für alle Menschen (Q-10/Q-11)

Stand 30.09.2026. Alle Figuren in `game/assets/chars/<id>/model.glb` (+ `model.glb.ktx.glb`) bewegen sich jetzt mit echten Mocap-Daten statt mit den alten Tony-Flanagan-Spielclips. Aussehen (Netze, Texturen, Haare, Kleidung) ist Byte für Byte unverändert – es werden nur die Bewegungen ausgetauscht/ergänzt.

## 1. Quellen und Skelette

| Paket | Ort (`HAM_FabDownloads/…`) | Skelett (Familie) | Ruhepose | Anmerkung |
|---|---|---|---|---|
| Motifect Locomotion / Injured / Emotes / Daily Life | `v15_mocap/x/loco|injured|emotes`, `v6/x/a_daily__…` | Motifect (`dl`): Hips (leerer Knoten), Spine1/Spine2/Chest, Neck1/Neck2, LeftLeg = Oberschenkel, LeftShin = Unterschenkel, Finger mit Mittelhand (Index1 = Mittelhand) | Bindepose des Strichmännchens = erstes Bild (steht, liegt oder sitzt je Clip) | KI-erzeugt; sauber, aber teils stilisiert (z. B. `walk_cautious`, `run_panic` gebogen). Wurzelweg auf `Hips`. |
| Mocap.in Acting / Mobility / Movement | `v15_mocap/x/acting|mobility|movement` | Mixamo-Namen (`mx`), Wurzel `Root`, Finger 1–4 | Grundstellung der Datei | echte Aufnahme, sehr natürlich (Sprechen, Zuhören, Sitzen) |
| Einzel-Clips (conv, convsit, lying, dying, disap, strange, …) | `v15_mocap/*.fbx` | HumanIK/Mixamo (`mx`, Spine–Spine3, Neck/Neck1) | Bindepose | echte Aufnahme |
| Toei „24motion“ (Gaze …) | `v15_mocap/x/npcset` | Mixamo-ähnlich (spine klein, `LeftINHand…` = Mittelhand) | Bindepose | 60 Bilder/s |
| Look Through Window | `v15_mocap/x/window` | Unreal 5 Manny (`ue5`: spine_01…05, neck_01/02, Hilfsknochen) | Grundstellung (kein Skin) | wie bisher `window*` |
| Rokoko: Getting Up, Smoking (mit Handschuhen = echte Finger) | `v15_mocap/x/getup1|2`, `x/smoke` | Unreal 4 (`ue4`: spine_01…03, index_01…03 …) | Bindepose | Z-oben |
| UEFN Zombie (Manny), Zombie-Idles | `v15_mocap/x/zombie`, `x/zidle` | Unreal 5 (`ue5`) | Bindepose | Idle 01/02 mit vierfach verschachtelten Knochen |
| 24Shibuya Stand | `v6/a_idle__24shibuya…` | HumanIK (`mx`), Bindepose nur fürs Becken | Grundstellung | knickige Haltung → nicht mehr als Idle benutzt |

Ziel-Skelette:
- **Kinder** (NoEdge Character Creator, `cc`): `Hip` (leerer Knoten) → `Pelvis`, `Waist/Spine01/Spine02`, `NeckTwist01`, `Head`, `L_Clavicle/L_Upperarm/L_Forearm/L_Hand`, Finger `L_Index1…3`, `L_Thigh/L_Calf/L_Foot/L_ToeBase`, Drehknochen `L_ForearmTwist01/02`, Augen `L_Eye/R_Eye`. Oberschenkel/Oberarm sind im GLB leere Knoten (die Haut hängt an den Twist-Knochen).
- **Erwachsene** (Tony Flanagan, Sketchfab-Export): fast alle **Mixamo** (`mixamorigHips_64` …, mit angehängter Nummer) + aufgesetzter CC-Kopf (Kopfteile an `mixamorigHead`/`Neck` gebunden, Augen als Formen `Eye_L_Look_L …`).
- **Vegas** (Farmer): **Auto-Rig Pro**, *flach*: `thigh_stretchl`, `leg_stretchl`, `arm_stretchl`, `forearm_stretchl`, `headx` hängen alle direkt an `c_traj` (keine Kette!), Fuß/Zehen an der FK-Steuerkette. Nur mit Positionen je Knochen bewegbar.

## 2. Übertragung (`app/tools/mocap.mjs`, gemeinsam für Werkstatt und Backen)

1. **Familie je Skelett erkennen** (Namen), dann Rollen: Hüfte, Wirbelsäulen-Kette (erstes/mittleres/letztes Glied → Spine/Spine1/Spine2), Hals, Kopf, Schulter, Ober-/Unterarm, Hand, Finger 1–3 (Motifect: Mittelhand übersprungen), Bein.
   *Behobener Altfehler:* Die frühere Werkstatt prüfte alle Familien gleichzeitig; Motifect-„LeftLeg“ (Oberschenkel) verdrängte Mixamo-„LeftLeg“ (Unterschenkel), „Spine1“ wurde zu „Spine“ → **bei allen alten Clips waren Knie und Brustkorb starr**. Skin-Gelenke haben Vorrang vor gleichnamigen Hilfsknoten (`head_70` neben `mixamorigHead_1`).
2. **Ruhepose der Quelle**: Bindepose des Skin-Meshes, aber nur wenn sie die Hauptknochen enthält und die Glieder gestreckter sind als in der Grundstellung der Datei (sonst Grundstellung). **Weltachsen der Quelle aus dem Clip** (Kopf über den Füßen, tiefster Fuß am ruhigsten = Boden; links = Hüft-/Schulterbreite) – so funktionieren auch Z-oben-Dateien und Clips, deren Bindepose liegt (Motifect „get_up_from_floor“). Je Clip vorgebbar (`"up": "y"`).
3. **Rest-Pose-Delta je Knochen**: Weltdrehung gegenüber der Ruhe (`D = Q(t)·Q0⁻¹`) wird übertragen; unterschiedliche Ruheposen (T/A-Pose) gleicht eine Ausrichtung der Knochenrichtung aus, bei Händen zusätzlich die Handflächenebene (Zeige→Kleiner Finger) → keine verdrehten Handgelenke. Liegt/steht die Quell-Ruhe anders als das Ziel, wird auch der Rumpf über die Körperachsen ausgerichtet.
4. **Positionen über eine virtuelle Vorwärtskette** (Ruheabstände je Knochen) → auch das flache Auto-Rig-Pro-Skelett bleibt zusammen. Oberschenkel-/Oberarm-Drehknochen, die an Steuerknochen hängen, laufen starr mit (`thigh_twist`, `c_arm_twist_offset`).
5. **Unterarm-Drehknochen** bekommen 20/55 % (CC) bzw. 50 % (ARP) der Handdrehung um die Unterarmachse – kein „Bonbonpapier“-Handgelenk.
6. **Becken**: Höhe = Knöchelhöhe der Figur + (Beckenhöhe der Quelle über ihrem Boden) × Größenverhältnis (Beckenhöhe bzw. Beinlänge). Wurzelweg je Clip:
   - `lin` Fortbewegung: gebogene Wege werden begradigt (Blickrichtung = über einen Doppelschritt gemittelte Beckendrehung), Geradenanteil wird zum **Tempo `speed` (m/s)**, Schwanken bleibt; Clips ohne Wurzelweg bekommen das Tempo aus dem Standfuß.
   - `fix` Stand: Drift heraus, Schwanken bleibt · `keep`: Weg bleibt (Aufstehen, Zusammenbrechen) · `turn`: Drehung und Weg werden herausgenommen und als **Wurzelkurve** (`root.yaw/x/z`, 10 Hz) gespeichert.
7. **Bein-IK beim Backen**: Fußgelenke dorthin, wo sie in der Quelle relativ zum Becken (skaliert) stehen → Standfuß bleibt stehen, auch bei anderen Ober-/Unterschenkel-Proportionen; Kniebeuge-Ebene aus der Vorwärtskette.
8. **Nahtlose Schleifen**: beste Schleifenstelle (Pose + Geschwindigkeit) gesucht, Restfehler über die Länge verteilt. **Fußkontakte**: `phaseL/phaseR` (Aufsetzen normiert 0…1), `slide` = Rest-Rutschen im Stand (m/s).
9. **Speicher**: Drehungen als normierte 16-Bit-Werte (glTF erlaubt, three.js dekodiert), Keyframe-Reduktion ≤ 0,1° / ≤ 0,03 % Knochenlänge, 30 Bilder/s. Metadaten je Clip in den Szene-extras (`gltf.scene.userData.motion[clip]`).

## 3. Werkzeuge

| Werkzeug | Zweck |
|---|---|
| `app/tools/cast.json` → `"mocap"` | Quellen (`src`), Sätze (`sets.adult/kid/old/zombie`), Figur → Sätze (`figs`). Optionen je Clip: `rm`, `loop`, `trim`, `clip`, `up`, `fingers`, `ik`. |
| `node tools/mocap_bake.mjs <id…\|all> [--only=a,b] [--dry] [--meta] [--out=Ordner] [--no-ktx]` | **Hauptweg**: backt die Sätze in `model.glb` **und** `model.glb.ktx.glb` (gleiche Knoten, KTX-Texturen bleiben), ersetzt gleichnamige Clips, entfernt verwaiste Daten, trägt Clip-Namen in `chars.json` ein. |
| `tools/forge.html` → `F.buildCast` | nutzt jetzt denselben Kern (`F.mocapClips`): neu gebaute Figuren bekommen die Mocap-Sätze direkt. Danach wie bisher `chars_pack.mjs`; **zur Sicherheit anschließend `mocap_bake.mjs <id>`** (Metadaten in die Szene). `F.film(url, {clips})` = Filmstreifen mit Texturen (Electron). |
| `node tools/mocap_film.mjs <glb> <ordner> [clips] [--posen=…]` | Filmstreifen ohne Grafikkarte (Node, Software-Skinning, SVG→PNG): schräg vorn + Seite, Bodenraster, Fußmarken. |
| `node tools/mocap_check.mjs <id…\|all>` | Prüfung aller Clips: kopfüber/Becken zu tief, Einsinken, Knie-Überstreckung, Handgelenk-Verdrehung, Rutschen. |
| `node tools/mocap_haende.mjs` | Fingerposen für die Ich-Hände (Abschnitt 6). |
| `tools/_mocap_*.mjs` | Hilfen (Skelette/Kanäle/Katalog ansehen). |

**Reihenfolge nach jedem Neubau einer Figur:** Werkstatt (`_forge_run.sh`) → `node tools/chars_pack.mjs` → `node tools/mocap_bake.mjs <id>` → ggf. `node tools/ktx.mjs`.

## 4. Bewegungsschicht im Spiel (`app/mods/figuren.js`) – API für alle Module

**Stand:** eingebaut, Syntax/Zusammenbau geprüft, **im Spiel noch nicht abgenommen** (Spieltest blockiert: `lwo.js` Z. 851 `typeof TOD_RESET` vor `const TOD_RESET` in tod.js → ReferenceError beim Start; danach Rechner ohne freie Prozesse). Jede Zusatzfunktion läuft in try/catch und schaltet sich bei einem Fehler je Figur ab (Clips spielen dann wie bisher). Abnahme (FPS, Fuß-IK auf Treppen, Drehen) = Politur-Aufgabe.

Bestehende Funktionen/Signaturen bleiben: `figuren_load`, `figuren_embody(g, id, {ghost, doll, clip, sit, gait})`, `figuren_play(P, clip, first, o)`, `figuren_seat(P, seatY)`, `figuren_release`, `figuren_person`, `figuren_clone`.

- **Automatische Fortbewegung** (Figur ohne `clip`, `P.fixed = false`): Das Modul bewegt nur die Gruppe `g`. Die Schicht misst das Tempo (kritisch gedämpft) und wählt Ruhe/Gehen/Laufen; **Abspieltempo = Wegtempo / Clip-Tempo** (0,55–1,7), Wechsel **fußsynchron** (gleiche Schrittphase) mit ≥ 0,3 s Überblendung. Gangart: `figuren_embody(g, id, { gait: 'vorsicht' | 'muede' | 'panik' | 'alt' | 'zombie' })` bzw. `P.gait = …`.
- **Drehen**: Dreht ein Modul `g` im Stand um > 60°, spielt `turn_l/turn_r/turn_180` und die Figur dreht sich mit der echten Wurzelkurve; sonst Feder (kein Drehen auf dem Teller).
- **Ruhe**: `idle/idle2/idle3` wechseln zufällig (7–19 s, 0,9 s Überblendung).
- **Feste Clips** (`clip: 'x'` oder `figuren_play(P, 'x')` mit `P.fixed = true`): bleiben stehen; Geh-Clips passen ihr Abspieltempo trotzdem an den Weg an (kein Gleiten in Kinoszenen).
- **Gesten/Einmal-Clips**: `figuren_do(P, 'winken', { then: 'idle' })` – spielt einmal, blendet danach von selbst zurück.
- **Blick**: `figuren_lookAt(P, ziel, gewicht)` mit `ziel` = `Vector3` | `Object3D` | `'cam'` | `'auto'` (Spieler, wenn < 5 m) | `null`. Augen zuerst (Knochen bei Kindern, Formen `Eye_*_Look_*` bei Erwachsenen), Kopf/Hals folgen (Hals+Kopf ≤ 60° seitlich, −26°/+34°), Federn; Ziel hinter der Figur → sieht nicht hin.
- **Atmung**: immer an (Brustkorb + Hals-Ausgleich), nach Laufen schneller/tiefer, klingt über ~30 s ab.
- **Fuß-IK**: für nahe Figuren (< 9 m): Boden unter jedem Fuß (Kisten-Kollision + `solidGround`, 10 Hz, gefedert); Becken sinkt auf den tieferen Fuß, der höhere wird angehoben (Treppen, Kanten, Bordsteine).
- **Sitzen**: `figuren_seat(P, sitzHöheWelt)` spielt bei Mocap-Figuren den Clip `sit` weiter (atmet, verlagert Gewicht) und setzt das Becken auf die Sitzfläche. Das Becken bleibt über dem Ursprung der Gruppe → **Gruppe auf die Mitte der Sitzfläche stellen**, Blick zur Stuhlvorderkante. Stoppt ein Modul den Mischer, startet die Schicht den Sitz-Clip neu.
- **Clip-Daten**: `figuren_motion(P, 'walk')` → `{ speed, loop, rm, phaseL, phaseR, turn, root, dur, slide }`.
- **Kosten/LOD**: keine Allokationen im Tick; < 12 m im Bild: alles jedes Bild; bis 20 m: Atmung/Blick; bis 30 m: Mischer 30 Hz; weiter/außer Bild 15/5 Hz; > 70 m nichts. Messwerte: `window.__figuren.MV` (`ms`, `n`, `near`, `ik`).

## 5. Ich-Hände: echte Fingerbewegung (für kiffen.js)

`game/assets/anim/haende_rauchen.json` (318 KB, aus `Anim_UE4_Smoking_01`, Rokoko mit Handschuhen): je Gelenk (`Hand, Thumb1–3, Index1–3, Middle1–3, Ring1–3, Pinky1–3`) die **lokale Drehung im Skelett der Detective_Hands** (`L_/R_Hand…`).
- `posen`: `halten` (Joint zwischen Zeige-/Mittelfinger, 22–25 s), `zug` (am Mund), `heben`, `senken`, `klopfen`, `locker`, `anfang` – gemittelte Fenster, Zeiten wie `KF_MO` in kiffen.js.
- `kurven.rauchen`: ganze Aufnahme, 15 Bilder/s, 928 Bilder (Int16/32767, Base64).
- Hilfe (figuren.js): `figuren_handLib()` (lädt einmal), `figuren_handPose(hände, pose, gewicht, { seite: 'L'|'R'|'beide', t, handgelenk: false })` – `pose` = Name aus `posen` oder `'rauchen'` mit `t` in Sekunden; setzt lokale Drehungen gewichtet (slerp) **nach** eigenen Animationen. Beispiel: `figuren_handPose(kf_rig, 'rauchen', 1, { seite: 'R', t: m.t })` statt der fünf Krümmungswerte `c[]`.
- Übertragung im Handraum (Handrücken quer, Richtung Mittelfinger), Gliedrichtungen angeglichen. kiffen.js wurde **nicht** verändert.

## 6. Clip-Katalog (je Figur: Sätze aus `cast.json → mocap.figs`)

Figuren → Sätze: Kinder (zayn roxy lucy luke luke_echt heidi dina mike cleo kleine) = `kid` (30 Clips) · graue, gezaehlt_j/_m = `kid` + `zombie` · Erwachsene (mama lucy_erw amt1 amt2 lorenz aydin dina_erw wolter nachsorge11 nachsorge12 guenther) = `adult` (62) · hilde, gisela, vegas = `adult` + `old` (Gehen = müde, `walk_stock`, `husten`) · hilde_tot, polizist = `adult` + `zombie` (bzw. + `old`) · blechmann/justin: nicht betroffen (eigene Wege).
Alte Namen bleiben gültig und sind jetzt Mocap: `idle, walk, look, nervous, phone, window, window_lean, window_knock`. Verworfen nach Sichtprüfung (Übertragung unsauber: vorgebeugt/verdreht): `conv` (ernstes Gespräch), `disap`, `strange`, Toei `Gaze`, `Carry luggage`, 24Shibuya-Idle.
Länge/Tempo unten von mama (adult), zayn (kid), vegas (old), polizist (zombie) – Tempo skaliert je Figur.

| Clip | Satz | Einsatz | Quelle (Datei) | Länge | Art |
|---|---|---|---|---|---|
| idle | adult | Stehen (Grundhaltung) | idle_neutral.fbx | 9.7 s | fix, Schleife |
| idle2 | adult | Stehen, Gewicht verlagern / Arme verschränkt | idle_relaxed_weight_shift.fbx | 9.9 s | fix, Schleife |
| idle3 | adult | Stehen, zuhören (echte Mocap) | 07_01_004_Listing.fbx | 10.6 s | fix, Schleife |
| look | adult | sich umsehen | idle_looking_around.fbx | 4.5 s | fix, Schleife |
| nervous | adult | panisch umsehen | panic_look_around.fbx | 4.2 s | fix, Schleife |
| alert | adult | wachsam stehen | idle_alert.fbx | 9.2 s | fix, Schleife |
| walk | adult | Gehen | walk_forward.fbx | 3.4 s | lin, Schleife, 1.26 m/s |
| walk_vorsicht | adult | vorsichtig gehen | walk_cautious.fbx | 6.5 s | lin, Schleife, 0.76 m/s |
| walk_muede | adult | müde gehen | walk_tired.fbx | 4.2 s | lin, Schleife, 0.44 m/s, 20° |
| walk_zurueck | adult | rückwärts gehen | walk_backward.fbx | 3.9 s | lin, Schleife, 0.71 m/s |
| schleichen | adult | auf Zehenspitzen schleichen | tiptoe_walk.fbx | 6.0 s | lin, Schleife, 0.46 m/s |
| run | adult | Joggen/Laufen | run_jog.fbx | 3.7 s | lin, Schleife, 1.40 m/s |
| run_panik | adult | Panik-Lauf | run_panic.fbx | 3.0 s | lin, Schleife, 0.68 m/s, 35° |
| turn_l | adult | auf der Stelle 90° links drehen | turn_left_90.fbx | 3.0 s | turn, einmal, 82° |
| turn_r | adult | 90° rechts drehen | turn_right_90.fbx | 3.0 s | turn, einmal, -91° |
| turn_180 | adult | umdrehen | turn_180.fbx | 3.0 s | turn, einmal, -180° |
| fear | adult | zurückweichen (Angst) | shrink_away_scared.fbx | 5.0 s | keep, einmal |
| ohren_zu | adult | Ohren zuhalten | cover_ears.fbx | 7.0 s | fix, Schleife |
| crouch | adult | hocken | crouch_idle.fbx | 9.6 s | fix, Schleife |
| talk | adult | sprechen | 07_01_002_talking normal.fbx | 21.5 s | fix, Schleife |
| talk_wut | adult | wütend sprechen | 07_01_003_taking_angry_01.fbx | 9.3 s | fix, Schleife |
| listen | adult | zuhören | 07_01_004_Listing.fbx | 10.6 s | fix, Schleife |
| gestik | adult | lebhaft gestikulieren | talk_animate_hands.fbx | 5.4 s | fix, Schleife |
| erklaeren | adult | weit ausholend erklären | explain_wide_gesture.fbx | 6.0 s | keep, einmal |
| sit | adult | sitzen (aufrecht) | sit_idle_upright.fbx | 9.8 s | fix, Schleife |
| sit2 | adult | sitzen (zusammengesunken) | sit_idle_slouched.fbx | 9.7 s | fix, Schleife |
| sit_talk | adult | sitzend sprechen | 07_02_002_talking_normal_01.fbx | 6.2 s | fix, Schleife |
| sit_down | adult | hinsetzen | sit_down_chair.fbx | 6.0 s | keep, einmal |
| stand_up | adult | aufstehen vom Stuhl | stand_up_from_chair.fbx | 5.0 s | keep, einmal |
| getup | adult | vom Boden aufstehen (Rokoko) | AnimUE4_GettingUp_UP.FBX | 6.5 s | keep, einmal |
| getup_floor | adult | aus Bauchlage aufstehen | get_up_from_floor.fbx | 7.0 s | keep, einmal |
| lean_wall | adult | an Wand lehnen, ausruhen | lean_on_wall_rest.fbx | 8.6 s | fix, Schleife |
| wand_ruecken | adult | Rücken an die Wand | back_to_wall.fbx | 6.8 s | fix, Schleife |
| phone | adult | aufs Handy schauen | check_phone_standing.fbx | 6.6 s | fix, Schleife |
| nick | adult | nicken | nod_yes.fbx | 4.0 s | keep, einmal |
| kopfschuetteln | adult | Kopf schütteln | shake_head_no.fbx | 4.0 s | keep, einmal |
| winken | adult | winken | wave_hello.fbx | 6.0 s | keep, einmal |
| klopfen | adult | an Tür klopfen | knock_on_door.fbx | 6.0 s | keep, einmal |
| aufheben | adult | vom Boden aufheben | pick_up_object_floor.fbx | 6.0 s | keep, einmal |
| trinken | adult | aus Tasse trinken | drink_from_cup.fbx | 6.0 s | keep, einmal |
| hug | adult | umarmen | hug_greeting.fbx | 7.0 s | keep, einmal |
| arme_verschraenkt | adult | Arme verschränken (trotzig) | arms_crossed_defiant.fbx | 8.7 s | fix, Schleife |
| schulterzucken | adult | Schulterzucken | shrug_i_dont_know.fbx | 5.0 s | keep, einmal |
| nachdenken | adult | nachdenken (Kinn) | think_chin_stroke.fbx | 4.0 s | fix, Schleife |
| facepalm | adult | Hand vors Gesicht | facepalm.fbx | 5.0 s | keep, einmal |
| warten | adult | „Moment!“ Hand heben | hold_up_wait.fbx | 4.0 s | keep, einmal |
| erschoepft | adult | erschöpft atmen | exhausted_heavy_breathing.fbx | 4.6 s | fix, Schleife |
| haende_knie | adult | Hände auf Knie, außer Atem | hands_on_knees_exhausted.fbx | 4.5 s | fix, Schleife |
| weinen | adult | weinen | sob_crying.fbx | 4.7 s | fix, Schleife |
| schwanken | adult | kaum stehen, schwanken | barely_stand_swaying.fbx | 7.1 s | fix, Schleife |
| zusammenbruch | adult | auf die Knie sinken | collapse_to_knees.fbx | 6.0 s | keep, einmal |
| window | adult | aus dem Fenster schauen | MC_Look_Window_01_Stand_Idle_Turn_L180_IP.fbx | 11.7 s | fix, Schleife |
| window_lean | adult | vorgebeugt aus Fenster schauen | MC_Look_Window_02_Stand_Idle_Bend_Fwd_Turn_L180_IP.fbx | 5.8 s | fix, Schleife |
| window_knock | adult | an Scheibe klopfen/winken | MC_Look_Window_04_Stand_Idle_Knock_Wave_Turn_L180_IP.fbx | 5.6 s | fix, Schleife |
| stairs_up | adult | Treppe hoch | climb_stairs_up.fbx | 4.1 s | lin, Schleife, 0.29 m/s |
| stairs_down | adult | Treppe runter | climb_stairs_down.fbx | 3.9 s | lin, Schleife, 0.30 m/s |
| tragen | adult |  | carry_box_two_hands.fbx | 4.1 s | lin, Schleife, 0.34 m/s |
| greifen | adult |  | pick_up_object_table.fbx | 5.0 s | keep, einmal |
| augen_zu | adult |  | cover_face_embarrassed.fbx | 7.0 s | keep, einmal |
| liegen | adult |  | lying.fbx | 5.1 s | fix, Schleife |
| zusammenrollen | adult |  | curl_up_fetal.fbx | 10.0 s | keep, einmal |
| zusammensacken | adult |  | slump_defeated.fbx | 6.0 s | keep, einmal |
| idle | kid | Stehen (Grundhaltung) | idle_neutral.fbx | 9.7 s | fix, Schleife |
| idle2 | kid | Stehen, Gewicht verlagern / Arme verschränkt | idle_relaxed_weight_shift.fbx | 9.9 s | fix, Schleife |
| idle3 | kid | Stehen, zuhören (echte Mocap) | 07_01_004_Listing.fbx | 10.6 s | fix, Schleife |
| look | kid | sich umsehen | idle_looking_around.fbx | 4.5 s | fix, Schleife |
| nervous | kid | panisch umsehen | panic_look_around.fbx | 4.2 s | fix, Schleife |
| alert | kid | wachsam stehen | idle_alert.fbx | 9.2 s | fix, Schleife |
| walk | kid | Gehen | walk_forward.fbx | 3.4 s | lin, Schleife, 0.98 m/s |
| walk_vorsicht | kid | vorsichtig gehen | walk_cautious.fbx | 6.5 s | lin, Schleife, 0.59 m/s |
| walk_muede | kid | müde gehen | walk_tired.fbx | 4.2 s | lin, Schleife, 0.34 m/s, 20° |
| walk_zurueck | kid | rückwärts gehen | walk_backward.fbx | 3.9 s | lin, Schleife, 0.55 m/s |
| schleichen | kid | auf Zehenspitzen schleichen | tiptoe_walk.fbx | 6.0 s | lin, Schleife, 0.36 m/s |
| run | kid | Joggen/Laufen | run_jog.fbx | 3.7 s | lin, Schleife, 1.09 m/s |
| run_panik | kid | Panik-Lauf | run_panic.fbx | 3.0 s | lin, Schleife, 0.53 m/s, 35° |
| turn_l | kid | auf der Stelle 90° links drehen | turn_left_90.fbx | 3.0 s | turn, einmal, 82° |
| turn_r | kid | 90° rechts drehen | turn_right_90.fbx | 3.0 s | turn, einmal, -91° |
| turn_180 | kid | umdrehen | turn_180.fbx | 3.0 s | turn, einmal, -180° |
| fear | kid | zurückweichen (Angst) | shrink_away_scared.fbx | 5.0 s | keep, einmal |
| ohren_zu | kid | Ohren zuhalten | cover_ears.fbx | 7.0 s | fix, Schleife |
| crouch | kid | hocken | crouch_idle.fbx | 9.6 s | fix, Schleife |
| talk | kid | sprechen | 07_01_002_talking normal.fbx | 21.5 s | fix, Schleife |
| listen | kid | zuhören | 07_01_004_Listing.fbx | 10.6 s | fix, Schleife |
| sit | kid | sitzen (aufrecht) | sit_idle_upright.fbx | 9.8 s | fix, Schleife |
| weinen | kid | weinen | sob_crying.fbx | 4.7 s | fix, Schleife |
| winken | kid | winken | wave_hello.fbx | 6.0 s | keep, einmal |
| getup_floor | kid | aus Bauchlage aufstehen | get_up_from_floor.fbx | 7.0 s | keep, einmal |
| schulterzucken | kid | Schulterzucken | shrug_i_dont_know.fbx | 5.0 s | keep, einmal |
| augen_zu | kid |  | cover_face_embarrassed.fbx | 7.0 s | keep, einmal |
| liegen | kid |  | lying.fbx | 5.1 s | fix, Schleife |
| zusammenrollen | kid |  | curl_up_fetal.fbx | 10.0 s | keep, einmal |
| greifen | kid |  | pick_up_object_table.fbx | 5.0 s | keep, einmal |
| walk | old | Gehen | walk_tired.fbx | 4.2 s | lin, Schleife, 0.50 m/s, 20° |
| walk_stock | old | am Stock humpeln (Stock als Requisit fehlt) | hobble_with_cane.fbx | 8.0 s | lin, Schleife, 0.16 m/s |
| husten | old | Hustenanfall | cough_fit.fbx | 10.0 s | keep, einmal |
| z_idle | zombie | Hungriger: stehen/schwanken | SK_Mannequin_Zombie_Idle_01.FBX | 26.6 s | fix, Schleife |
| z_idle2 | zombie | Hungriger: stehen (2) | SK_Mannequin_Zombie_Idle_02.FBX | 30.1 s | fix, Schleife |
| z_walk | zombie | Hungriger: schlurfen | FN_Manny_Zombie_Walk.FBX | 4.1 s | lin, Schleife, 0.19 m/s, 34° |
| z_run | zombie | Hungriger: rennen | FN_Manny_Zombie_Run.FBX | 0.8 s | lin, Schleife, 2.58 m/s |
| z_attack | zombie | Hungriger: Angriff | FN_Manny_Zombie_Attack.FBX | 2.7 s | keep, einmal |
| z_crawl | zombie | Hungriger: kriechen | FN_Manny_Zombie_Crawl.FBX | 5.1 s | lin, Schleife, 0.02 m/s |
| z_death | zombie | Hungriger: zusammenbrechen | FN_Manny_Zombie_Death.FBX | 3.0 s | keep, einmal |


### Wünsche aus Kino (AP-10) – Stand
- `sit` (Mocap, Becken über dem Gruppenursprung, Füße vorn am Boden) · Kinder auf Erwachsenenstühlen: `figuren_seat` legt nur die Beckenhöhe fest, Fuß-IK ist beim Sitzen aus → Füße hängen frei, wenn der Sitz hoch ist (gewollt). Gruppe auf die Sitzmitte stellen, nicht an die Lehne.
- `hug` (Umarmung), `tragen` (Kiste mit beiden Händen, gehend), `aufheben`, `greifen` (vom Tisch) – echtes „Kind hochheben“ gibt es in keinem Paket (Näherung aufheben → tragen).
- `augen_zu` (Hände vors Gesicht), `facepalm`, `ohren_zu`.
- `liegen` (auf dem Boden liegend, lebendig), `zusammenrollen` (Embryohaltung, Seite), `zusammenbruch`, `z_death` – für Peter „liegt auf der Seite“: `zusammenrollen` am Ende halten oder `liegen`.
- ruhiges Stehen: `idle`, `idle3` (zuhören, echte Aufnahme), `listen`, `arme_verschraenkt`, `warten`.
- kino.json-Clips gleichen Namens (`hug`, `nick`, `sitzen`, `kopfschuetteln`) wurden mit dem alten, fehlerhaften Übertragungsweg (starre Knie/Brust) gebacken → besser die gleichnamigen Clips aus model.glb nehmen (`sitzen` → `sit`).

## 7. Offene Punkte
- Vegas (Auto-Rig Pro, flach): kräftige Proportionen → „Arme verschränken“ (`idle2`, `arme_verschraenkt`) kreuzt nicht ganz; liegende Clips sinken bis ~20 cm in den Boden (Bauch).
- `schleichen`, `crouch`, `run_panik`, `walk_zurueck`: Hocke sinkt 5–10 cm ein bzw. Rückwärts-Clip rutscht (Quelle); nur mit Bedacht einsetzen.
- Prüfskript meldet Handgelenk > 100° bei Gesten (`gestik`, `erklaeren`, `hug`, `window_knock`) – im Bild natürliche Unterarmdrehung, kein Bruch sichtbar.
- Motifect ist KI-erzeugt: `walk_vorsicht` (übertrieben geduckt), `run_panik` (gebogener Weg) wirken stilisiert; bei Bedarf durch echte Aufnahmen ersetzen.
- `walk_stock` braucht einen Stock als Requisit (fehlt).
- Kein Mocap für „Person hochheben/tragen“ (Vegas hebt Lucy): Näherung `aufheben` + `tragen` (Kiste).
- `deadposes/` (30 Leichen-Posen) noch nicht verbacken – für Weltgestaltung bei Bedarf als `tot_*`-Clips aufnehmen (`rm: 'fix', up: 'y'`).
