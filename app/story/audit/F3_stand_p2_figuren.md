# F3 Stand P2 – Figuren- und Animationssysteme (Premium-Priorität 2)

Stand 01.10.2026. Ursachen der vom Nutzer gesehenen Figurenfehler (Kap. 1–3) behoben: Kopf-Flips, verdrehte Glieder, rotierende Teile, harte Wechsel, Gleiten. Das Aussehen der Figuren (Netze, Texturen, Kleidung) ist unverändert.

## Ursachen → Behebung
| Befund | Ursache | Behebung |
|---|---|---|
| Kopf dreht sich / 180°-Flip, rotierende Körperteile (graue, heidi, kleine …) | `figuren_rig` nahm bei den verschachtelten CC-Hilfsketten („Head > Head > Head“, „Spine02_2“) einen **unbewegten** Hilfsknochen; Atmung/Blick drehten ihn jedes Bild weiter (Aufsummieren) | Rollenwahl: animierter Knoten > äußerster gleichnamiger > Skin-Gelenk; **alle Zusatzschicht-Knoten werden vor jedem Mischer-Schritt auf ihre Grundlage zurückgesetzt** (`figuren_rest`) |
| Augen der Kinder drehen durch (bis 180°) | `L_Eye/R_Eye` haben keine Clip-Spur → Blickdrehung summierte sich | dieselbe Rücksetzung |
| Kopf schlägt um, wenn das Ziel hinter die Figur wandert (figuren, kino, Justin) | Grenze ±60–72° sprang beim Wechsel ±π von + nach − | Ziel hinten: Richtung einfrieren/Kopf zur Mitte und ausblenden |
| Kopf > 100° gegen den Oberkörper bei Blick + Clip-Kopfdrehung | Blick addierte sich zur Kopfdrehung des Clips | Blick = Ziel − Clip-Kopf (kürzester Weg), höchstens 60° gegen die **Brustkorb**-Richtung, −26°/+34° |
| Bindepose/T-Pose schimmert beim Anhalten/Wechseln durch, halb ausgeblendeter Clip springt hoch | `crossFadeFrom` blendet ab Gewicht 1 aus; beendete Einmal-Clips (pausiert) wurden nicht ausgeblendet; LWO-Gewichte ≠ 1 | Überblenden aus den **aktuellen** Gewichten (Summe 1) in `figuren_play`, `kino_play_`, `jPlay` (justin.js ersetzt die Basis) und `justin_knien`; LWO normiert Stand-/Geh-/Sitzgewichte |
| Wolter (Kap. 3, Bushaltestelle) sitzend: Rumpf/Kopf drehen sich fort, glitt danach im Sitzen | `lwo_sitzen` stoppte den Mischer, `lwo_rotW` summierte jedes Bild; Clips liefen nach dem Aufstehen nicht wieder an | LWO sitzt jetzt mit Mocap-Clip `sit` (Mischer läuft, Becken auf `seatY`), weiche Rückkehr; Figuren ohne `sit`: feste Grundlage |
| LWO-Figuren gleiten | Abspieltempo aus altem `def.stride` | Tempo des Mocap-Geh-Clips (`motion.walk.speed`) |
| Justin kniet: Wirbelsäule/Hals mischen zur Bindepose | Knien-Clip (mocap.json) ohne Spur für spine_02/04, neck_02, Drehknochen | fehlende Spuren aus dem Stand ergänzt |
| zuckende/verdrehte Unterarme, Endbild-Sprung (getup: 133° im letzten Bild, das Einmal-Clips halten) | Umschläge der Unterarmdrehung bei Übertragung/Quelle | `despike` im Übertragungskern (`tools/mocap.mjs`, künftige Bakes) + `tools/mocap_glatt.mjs` auf alle 29 Figuren angewandt (nur Drehschlüssel, Dateigrößen gleich; Sicherung `C:/Users/GIGABYTE/_mocap/backup_p2`) |
| Sitzende Figuren: Füße 14–23 cm im Boden | Stuhl niedriger als in der Aufnahme | Bein-IK hebt die Füße im Sitzen auf den Boden |
| Fuß taucht an Stufen ein | Boden-Abtastung 10 Hz | 20 Hz, hinauf steifer gefedert |
| Kinder gleiten beim Laufen | Jog-Clip 1,1 m/s, Takt max. 1,7 | Laufen bis Takt 2,0 |

**Sicherheitsnetz** (`figuren_guard`, je nahe Figur und Bild, ohne Allokation): Kopf gegen Brustkorb > 100° oder NaN → Zusatzschicht für dieses Bild weg; liegt es am Clip → Clip für die Figur gesperrt, sofort Rückfall `walk`/`idle` (Konsole: „Clip gesperrt“). **Sperrliste** `FIGUREN_SPERRE` (Rest-Drehsprünge > 30 rad/s): alle: gestik→talk, klopfen→idle, getup_floor→idle, walk_vorsicht→walk; Vegas zusätzlich schleichen, turn_180, sit_down, stand_up, getup, aufheben, window, window_lean, run_panik.

## Prüfwerkzeug
`node tools/mocap_check.mjs [ids|all] [--spiel|--nur-spiel] [--extra] [--szenen=…]` – Stufe A je Clip (Kopf-Flip, Kopfnetz löst sich/Skala 0, NaN, Einsinken, Knie, Handgelenk, Zittern, Drehsprung, Naht, Spuren, model.glb ↔ .ktx.glb); Stufe B lädt den echten `figuren.js`-Code mit Attrappen und fährt Blick rundum, Gehen, Drehen, Laufen, Hin-und-Her, Stufe, Geste, Sitzen. `--extra`: Justin, Katze, Rabe, Wild, Fuchs, Wolf, Schwein. Ergebnis: `C:/Users/GIGABYTE/_mocap/check.json`.

## Offen
- Rest-Drehsprünge in selten genutzten Clips (walk_vorsicht 33 rad/s, zusammenrollen 28, Vegas-Beine in Sitz/Aufheben/Fenster) → gesperrt bzw. ungenutzt; echte Lösung = Unterarm-Twist-Stetigkeit in `mocap.mjs` + neu backen.
- CC-Kinder: `Spine02` wird von keinem Clip bewegt (Brustkorb steif) – Übertragungslücke, nicht sichtbar gebrochen.
- Fuchs/Wolf `IdleAggressive`: Schwanz zittert in der Quelle; Katze `walk`: Pfote springt an der Schleifennaht (41°).
- Stufen-Fuß-IK: beim abrupten Höhenwechsel der Gruppe noch bis ~9 cm für wenige Bilder.
