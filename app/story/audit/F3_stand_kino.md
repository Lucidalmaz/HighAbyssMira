# Stand kino.js (Fassung 3, AP-10 – Maschine neu, Prolog/Kap. 1–3 gebaut, Kap. 4–6 vorbereitet)

## Schnittstelle
- `kino_play(id, opts)` → Promise. opts: `aufblenden` (ms), `nahtlos` (ohne Schwarzblende beginnen), `antwort` ('A'|'B'|'C', Kap. 3), `mitte` ([x, z], Blinzeln).
- `kino_def(id, shots, meta)` · meta: `name`, `skipAfter` (Standard 3 s, `Infinity` = nicht überspringbar), `nahtlos`, `offen` (endet ohne Schwarz im Spiel), `uebergabe` (Blickrichtung der letzten Einstellung wird die des Spielers), `start(opts)`, `done(skipped, opts)`.
- `kino_karte(zeilen, opts)` → Promise: Endkarte außerhalb einer Sequenz (Schreibmaschine, Zeile für Zeile je 2 s; Zeilen als String oder `{ t, klein, stempel }`).
- `kino_blinzeln(zu, auf, onZu)`, `kino_busy()`, `kino_preload('k3'|'k5'|'k6')`, Einstiege `kino_hilde()`, `kino_kuh()`, `kino_prolog()`.
- Testzugriff `window.__kino`: `play`, `seek(t)` (spult deterministisch vor und hält das Bild), `hold`, `skip`, `fps`, `info`, `outage` (Kap.-1-Stromausfall), `cam`, `free`.

## Einstellung (Daten)
`{ dur | 'auto', from, to, via, look, lookTo, lookVia, ease ('smooth'|'soft'|'in'|'out'|'lin'|'inout3'), fov, fovTo, roll, rollTo, hand, breathe, follow, traeg, gerade,
frei, blick, blickRate, dy, shakes: [[t, amp, dur]], lens: { at, r, amt, to }, env, film, fadeIn, black | white | card, lines, sfx, setup, tick, teardown, wenn, keepFlash }`
- `from`/`to`/`look`: Array, Funktion `(sh) → Array` oder `'cam'` (aktuelle Kamera). `look` als Funktion ohne Parameter = bewegtes Blickziel (Rückgabe Array/Vektor).
- Kamera (Q-11): Fahrten laufen nie gerade – ohne `via` legt die Maschine einen leichten Bogen (weg vom Blickziel); Position und Blickpunkt folgen über eine kritisch gedämpfte Feder (Trägheit `traeg`, beim Schnitt ohne Nachlauf); dazu ruhige Hand (zwei überlagerte Schwingungen) und Stöße (`shakes`). `frei` = Spielerkamera (Kopf drehen möglich, Gehen gesperrt), `blick` zieht den Blick weich, `fov/fovTo` auch dort.
- Linse: eigener günstiger Nachbearbeitungs-Durchgang (16 Abtastungen, nur im Kino aktiv, beim Laden übersetzt): Fokuspunkt (Weltpunkt) scharf, Rand weich, Fokus ziehen über `to`.
- Licht: nur Intensitäten vorhandener Lichter – zwei eigene VLights (`kino_S.vl`, beim Laden mit 0), Punktlicht-Reserve (`lit`), Taschenlampe (`flash`), Laternen über `kino_lampe(L, 'pusten'|'relais'|'aus'|'an'|'puls'|'hell')` (Ausblasen mit Nachglühen); alles nach der Sequenz zurück.
- Ton: eigener Bus; Brummen/Summen (`kino_brumm`), Stille/Tonabriss (`kino_still`, `kino_abriss`), Foley (Atem, Einatmen/Pusten, Relais, Kreide, Kiesel, Trippeln, Schnabel, Taube, Pling, Amsel, Klingel, Muhen, Fall, Sub-Schlag, Stahltür, Blasen, Wimpernschlag, Schreibmaschine), Musik sparsam aus `KI` (Cello, Spieluhr, Klavier, Streicherton, Summen).
- Figuren: Klone aus `figuren_load`, weiche Überblendungen (0,5 s), Blickziele (Kopf/Hals begrenzt, geglättet), Gesten (`kino_arm`), Atmung immer an, Gehen mit passender Schrittfrequenz (`kino_gehen`), Behaltene grau (`kino_grau`), Sitzen per Motion-Capture (`sitzen`, Hüfte auf Sitzhöhe; sonst `figuren_seat`).
- Zusätzliche Motion-Capture-Bewegungen (Motifect Daily Life, in der Werkstatt auf die fertigen Figuren übertragen; bestehende `model.glb` unberührt): `game/assets/chars/<id>/kino.json` – vegas (`hug`, `nick`), lucy_erw (`hug`), hilde (`kopfschuetteln`, `sitzen`), zayn/mike/roxy/dina/heidi/gezaehlt_m/lucy (`sitzen`). Werkzeug: `C:/Users/GIGABYTE/_ap10_js/forge_clips.js` (Lauf über `_forge_run.sh`).

## Sequenzen
| id | Name | Länge | Aufrufer | Stand |
|---|---|---|---|---|
| `kp` | Prolog „Kum, Wîse“ | 22 s, nicht überspringbar | `traum.js` (letzter Traum-Shot → `kino_prolog()`) | gebaut |
| `k1h` | Kap. 1 „Hilde im Strahl“ | 44 s, nicht überspringbar, endet im Spiel | Basis Stromausfall (`kino_hilde()` statt `startPhase2`), danach `ending()` | gebaut |
| `k1` | Kap. 1 Abspann „Du hast sie rausgelassen“ + Endkarte (vier Zähler) | 36 s + Karte | Basis `ending()` | gebaut |
| `k2a` | Kap. 2 A „Bruder.“ | 16 s | Basis `caught()` beim ersten Griff | gebaut (Fass/Öl verdrahtet AP-16) |
| `k2b` | Kap. 2 B „Das Gesicht im Glas“ | 31 s, mit „Augen zu“ | Basis `finale()` | gebaut |
| `k2` | Kap. 2 Abspann „Ihre Augen“ | 31 s (+ Endkarte, s. u.) | Basis `finale()` | gebaut |
| `k3kuh` | Kap. 3 „Blinde Kuh“ | 24 s | `lucy3.js` (`kino_kuh()` statt `cowDrop`) | gebaut (A-12: „Scheiße“-Gag nicht mehr in der Sequenz) |
| `k3blinzeln` | Kap. 3 „Blinzeln“ | 38 s | – (AP-17 ruft mit `{ mitte: [x, z] }` in Nimmerheim) | gebaut, vorläufige Bühne (weißer Raum) |
| `k3`, `k3a/b/c` | Kap. 3 Abspann „Wie jeden Morgen“ + Endkarte je Antwort, RH-Zeile, Stempel | 60 s + Karte | `weiss.js` / Basis (`k3a/k3b/k3c` = Antwort A/B/C) | gebaut (Nimmerheim-Einstellung vorläufig) |
| `k4`, `k5`, `k6` | „Noch nicht“ / „Kein Echo“ / „Gleich wieder da“ | Plan 70 / 40 / 80 s | anwesen / kapitel5 / kapitel6 | vorbereitet: alte Einstellungen laufen weiter, Plan in `kino_defVorbereitet` |

## Offen / für andere Pakete
- AP-16: Endkarte Kap. 2 an den Gully unter die dreizehn Schläge (`KINO_K2_KARTE = false`, dort `kino_karte(KINO_KARTE2())`); „Bruder.“ mit Fass/Öl im Gang verdrahten.
- AP-17: Nimmerheim bauen und `kino_play('k3blinzeln', { mitte })` aufrufen; „Scheiße“-Gag (A-12) am dritten Untersuchungspunkt der Kuh.
- AP-14: Unterkapitel 7 (Verstecken) zwischen `k1h` und `ending()`.
- AP-MOCAP: Sitzen läuft vorerst prozedural (`KINO_MOCAP_SITZ = false`: das Motifect-„sitzen“ saß zu hoch/hinter der Lehne). Gebraucht werden `sit` mit Fuß-IK (Kinder auf Erwachsenenstühlen), `hug`/`carry` (Vegas hebt Lucy), `hands_over_eyes` (Luna und die Behaltenen zählen), `reach` (Hilde, Behaltene: Hand heben), `stagger`/`kneel` (Luke-Ersatz entfällt), `lie_side` (Peter im Öl). Die eigenen `kino.json`-Clips treten zurück, sobald die Figur einen gleichnamigen Clip hat. Hilde steht nach dem Neubacken um 15:06 im eigenen `idle` kopfüber (Beine oben) – liegt am neuen `model.glb`, nicht an kino.js.
- Assets: Lesebrille mit Perlenkette (Modell; jetzt Decal), Wolldecke, Bruno (Hund), Lichtschiff-Look (jetzt Basis-Scheibe); die Kuh der Basis ist schon beim Laden blutig verformt (liest sich als Fleischklumpen).
