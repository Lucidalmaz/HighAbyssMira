# Klang-Inventar: echt oder erzeugt (Stand 08.10.2026, AP „Echte Klänge“)

Regel (Nutzer + Memory `ham-keine-generierten-dinge`): alles, was man hört, soll eine echte Aufnahme sein. Synthese bleibt nur dort, wo es physikalisch ein reiner Ton ist (Tinnitus, Netzbrummen) oder wo noch keine freie Aufnahme gefunden wurde (Tabelle „Offen“).
Quellen und Lizenzen je Datei: `CREDITS.md` (Abschnitt „Ton“, Unterabschnitt „AP Echte Klänge“). Bau der neuen Dateien: `app/tools/klang_bau5.py` (Quellen: `HAM_Audio/quellen5.py` → Sonniss 2016–2019, `HAM_Audio/fsdl` → freesound CC0, `HAM_Audio/commons` → Wikimedia CC0/gemeinfrei).
Die Messdatei `_au2_steps.json` (BURST/DIP-Liste) liegt im Repo und auf dem Rechner nicht vor und wurde nicht gelesen; die in UEBERGABE.md §16 genannten Kandidaten sind unten eingeordnet.

## 1. Bereits vorher echt (unverändert)
| Funktion | Ort | Quelle |
|---|---|---|
| Schritte (Holz, Fliese, Beton, Kies, Laub, Gras, nass, Wasser) | `klang.js` `klang_step`, `sounds.js` | OpenGameArt CC0 (`stepW/C/G/Wet`) |
| Türen, Schlösser, Schlüssel, Schläge, Metall, Holz | `sounds.js`, `Audio.doorSound/slam/knock/bang` | OpenGameArt CC0 |
| Regen, Wind, Betten (`amb_*`), Böen (`fx_boe_*`), Donner (`fx_donner_*`) | `klang.js` | Sonniss |
| Musik (`mu_*`), Stinger (`st_*`), Spieluhr, Klavier, Glocken, Instrumentenbank (`kb_*`) | `klang.js` KI-Bank | VSCO 2 CE (CC0), als Sampler gespielt – **keine Synthese** (Menümusik `mu_menue` gehört dazu) |
| Schreck (`sc_*`: Screech, Static, Scream, Whisper), Flüstern (`fx_fluester_*`), Rabe (`fx_rabe_*`), Vögel, Hunde, Reh | `Audio.scareSound/screech/whisper/bark/caw/vogel` | Sonniss |
| Herzschlag `Audio.heart` / `kino_herz` | `sounds.js` `heartbeat` (OGA CC0, Tiefpass 300 Hz) und `pz_herz_*` (Sonniss) | echt |
| Atem Peter/Spinnen (`pz_atem_*`, `pz_keuch_*`), Stoff (`pz_stoff_*`), Knochen (`wd_knochen_*`), Fleisch, Wendigo-Laute (`wd_*`) | `klang_peter.py`, `klang_wendigo.py` | Sonniss |
| Funk-Rauschen `fx_rauschen`, Telefon `fx_telefon`, Mikrowelle, Wecker, Ohrklingeln | `klang.js` | Sonniss |
| Zombie-/Untoten-Stimmen `zombie1`, `undead1–4`, Kichern, Auto (Hupe, Motor, Tür) | `sounds.js` | OpenGameArt CC0 |
| `Audio.drip/thump/musicBox/pianoNote/bell/glocke` | `klang.js` | Sonniss / VSCO |
| Fallback für fehlende Datei (`KL_ALT`) | `klang.js` | **still**, kein erzeugter Ersatz (Stinger, Schreck, Flüstern, Spieluhr, Tropfen, Thump, Tape, Radio, Glocke) |

## 2. In diesem Durchgang durch Aufnahmen ersetzt
| Funktion | Ort (Code) | vorher | jetzt (Dateien) | Quelle / Lizenz | Größe |
|---|---|---|---|---|---|
| **Flügelschlag** (Rabe/Krähe: Start, Landung, Flucht) `Audio.flap` | `raumklang.js` | 6 Rauschstöße (Tiefpass) | `fx_flug_1–4` (Taube, Taube, Ente, Adler; mit Tonhöhe 0,9–0,95 für Rabengröße) | freesound CC0 (siehe CREDITS) | 4 Dateien, 25 KB |
| **Feuer**: Knistern `FEU_SND.crackle`, Knall `pop`, Zündung `wuff`, Brüllen/Zischen `loopNoise roar/roar2/hiss` | `feuer.js` | Rauschen + Sinus | `fx_feuer_knist_1–6`, `fx_feuer_pop_1–3`, `fx_feuer_wuff`, Schleifen `amb_feuer` (Hochbrand), `amb_feuer_lo` (Glut) – **lazy** beim ersten Gebrauch/Betreten Amt | Sonniss (Burning House Library u. a.) | 12 + 2×75 KB |
| **Feuerzeug** `FEU_SND.flick`, `Audio.feuerzeug` | `feuer.js`, `klang.js` | Schalter-Sample + Rauschen | `fx_feuerzeug_1–3` | freesound CC0 | 7 KB |
| **Atem unter dem Rauch** `loopNoise breath` | `feuer.js` | AM-Rauschen | getaktete Atemzüge aus `pz_atem_*`/`pz_keuch_*` | Sonniss | – |
| **Atem / Keuchen / Stoff** `kino_atem`, `kino_einatmen`, `kino_stoff`, `weiss_atem`, `TOD_SND.gasp`, `beob_atem`, `beob_rustle` | `kino.js`, `weiss.js`, `tod.js`, `beobachter.js` über `Audio.atemEcht` | gefiltertes Rauschen | `pz_atem_*`, `pz_keuch_*`, `pz_stoff_*` (jetzt in der Vorladeliste) | Sonniss | – |
| **Zombie-Röcheln** `Audio.groan` (65 % `roecheln`) | `raumklang.js`, `klang.js` | OGA-Zombie (2 Aufnahmen) | `zb_roech_1–6`, `zb_zisch` – lazy (Gruppe `zombie`) | Sonniss | 55 KB |
| **Husten, Würgen** `TOD_SND.cough/choke` | `tod.js` | Rauschen + Sägezahn | `fx_husten_1–3`, `fx_wuergen_1–2` – lazy | freesound CC0 | 25 KB |
| **Körperfall** `TOD_SND.thud` | `tod.js` | Sinus + Rauschen | `pz_fall_1–2` (Aufnahme) | Sonniss | – |
| **Öl-/Schlamm-Glucksen** `FEU_SND.pour` → `Audio.oelBlasen` | `feuer.js`, `klang.js` | (nur Wasserlauf-Sample) | `fx_oel_blub_1–6` – lazy | Sonniss + freesound CC0 | 35 KB |
| **Katze**: Fauchen (`leben_hiss`, Whiskey „fauchen“), Miauen (Schnurr-Beginn), Schnurren `katzen_schnurren` | `leben.js`, `katzen.js`, `whiskey.js`, `klang.js` | Rauschen / AM-Rauschen / gar nichts | `fx_katze_fauch_1–3`, `fx_katze_miau_1–2`, Schleife `fx_katze_schnurr` (lazy) | Wikimedia Commons CC0/gemeinfrei | 55 KB |
| **Funk**: Rauschsperre/Klack, Rauschen der Geräte (`klang_funk`, `Audio.radio`, `lucy3_radioOn`, Whiskey „funk“, `intercomClick`) | `klang.js`, `lucy3.js`, `whiskey.js`, `raumklang.js` | Rauschen + Bandpass | `fx_funk_klick_1–3` (Handfunkgerät), `fx_funk_stat` (Röhrenempfänger Hallicrafters SX-122, Schleife, lazy) | Sonniss + freesound CC0 | 60 KB |
| **Tastenfeld-Piepen** `Audio.beep` (Kellertür Kap. 1) | `klang.js` | Sinus 1850/330 Hz | `ui_taste_1–4` (echte Quittungstasten; „falsch“ = tiefer abgespielt) | freesound CC0 + Sonniss (Mikrowellen-Tasten) | 7 KB |
| **Relais** `kino_relais`, `Audio.relais`, `Audio.flick` | `kino.js`, `klang.js` | Schalter-Sample / Rauschstoß | `fx_relais_1–3` | Sonniss + freesound CC0 | 5 KB |
| **Spinnen-/Käferkrabbeln** `Audio.skitter` | `klang.js` | 3 Rausch-Ebenen + Scrape-Samples | `fx_krabbel_1–4`, Schwarmschleife `amb_krabbel` (lazy) | freesound CC0 | 70 KB |
| **Dingdong** `Audio.ding` | `klang.js` | Sinus 1318/1760 Hz | Spieluhr-Zinken (`kb_spieluhr_E6/A6`) | VSCO CC0 | – |
| **Kamera** (Kap. 5): Verschluss, Blitz lädt, Schalter | `kamera.js` | Rechteck/Sägezahn/Rauschen | `fx_kamera_1–3`, `fx_blitz_laden`, `fx_relais_*` | Sonniss | 22 KB |
| **Nadeldrucker** (Amt, Archiv Zimmer 7) | `amt.js`, `zimmer7.js` | 30 Rauschbursts je Zeile | `fx_nadel_1–3`, `fx_nadel_servo` | Sonniss (Chris Skyes) | 20 KB |
| Waldkauz `owl/owlPair`, Fuchsschrei `fox` (waren stumm geschaltet) | `klang.js` | stumm | `fx_eule_1–3`, `fx_fuchs_1–3` | freesound CC0 | 70 KB |
| Schwein `leben_grunt` | `leben.js` | Rauschen + Sägezahn | `fx_schwein_1–3` | freesound CC0 | 10 KB |
| Bleistift, Papier abreißen, Kauen, Stroh (Beobachter, Kap. 5) | `beobachter.js`, `kapitel5.js` | Rauschen | `ui_stift`, `ui_seite`, `fx_kauen_1–3`, `fx_laub_*` | Sonniss | 15 KB |

## 3. Mix und Lautstärke
- **Donner:** Pegeldeckel in `klang.js` von 0,21 auf 0,15 (−3 dB, Formel gleichermaßen), Basis `dir.lightT` von 55–120 s auf **70–150 s** (`_base_source_index.html`). `naturschreck.js` (nahe Blitze) bleibt, setzt aber nur ein Minimum von 45–80 s.
- **Flügelschlag-Drossel** (`raumklang.js`): ferne (> 9 m) höchstens alle 6 s, nahe alle 0,8 s (vorher 9 s / 1,2 s wegen der Rauschblöcke; mit Aufnahmen kein Rauschen mehr).
- **Speicher (Audio-PCM im Heap):** neu vorgeladen ≈ 62 s Mono ≈ 12 MB dekodiert (Atem, Flügel, Katze, Eule/Fuchs/Schwein, Kamera, Nadeldrucker, Tasten, Relais, Funk-Klick, Kauen). Lazy (Gruppen `feuer`, `zombie`, `oel`, `funk`, `krabbel`, `katze`): ≈ 22 MB, geladen beim Betreten von Amt/Keller bzw. beim ersten Gebrauch. Alle neuen Dateien mono, Opus, zusammen 0,8 MB auf der Platte. Die Schleifen (`amb_feuer*`, `amb_krabbel`, `fx_katze_schnurr`, `fx_funk_stat`) tragen den üblichen 0,25-s-Rand (wird beim Laden abgeschnitten).
- Neue Einzelklänge liegen auf −22 bis −26 LUFS wie die vorhandenen; Spieler-Gains sind aus Vergleichswerten gesetzt, **ungehört** (kein Spiellauf erlaubt) – im gebündelten Test prüfen: Flügelschlag (0,5–0,65), Feuer-Schleifen (0,55/0,35 × Hitze), Zombie (0,55–0,85), Tasten (0,5).

## 4. Offen (noch synthetisch oder unvollständig)
| Funktion | Ort | Zustand | Vorschlag |
|---|---|---|---|
| Summen/Pfeifen von Lucys Lied (Kap. 5 `k5_summen`), gepfiffene Melodien (Hungrige, Amt-Band, `ausbau_ost_west`, Whiskey „wiegenlied“), Lieder aus Sinus/Dreieck | `kapitel5.js`, `hungrige.js`, `amt.js:426`, `neben3.js:264`, `lucy3.js:91` | Oszillatoren mit Vibrato | echte Summ-/Pfeifaufnahme (keine freie gefunden); alternativ Melodie auf der Spieluhr/Flöte (VSCO) spielen |
| Fake-Sprache im Funk (`klang_funk` „Stimme“: Rauschen mit Silbenhüllkurve), TV-Stimme in Fenstern (`leben.js`), Traum-Wörter (`traum.js` `TRAUM_WORT`) | `klang.js`, `leben.js`, `traum.js` | geformtes Rauschen | echte Walla-/Murmel-Aufnahme bzw. Sprachausgabe (`stimmen.js`, zurückgestellt) |
| ~~Kuh „Muh“ `kino_muh`~~ | `kino.js` | **erledigt**: `fx_kuh_1–3` (`Audio.kuh`) | Sonniss 2016 Animal Farm |
| ~~Wolfsheulen `leben_howl`~~ | `leben.js` | **erledigt**: `fx_wolf_1–3` (9-s-Ausschnitte der Winterwald-Nacht, lazy bei Wald/Friedhof) | Sonniss 2018 |
| Glocken-Teiltöne (kleine Glocke Post/Kirchberg/Neben3/Ausbau Nord, `Audio.bell` Fallback) | `post.js:16`, `kirchberg.js:373`, `neben3.js:72`, `ausbau_nord.js:966` | additive Sinus | `kb_glocke_*`/`kb_spieluhr_*` per Abspielrate stimmen (wie `Audio.glocke`) |
| Subbass/Brummen (`kapitel1` `K1.hum` Fallback, `geheimnisse.js:126`, `hungrige.js:399`, `kino_brumm` Fallback) | siehe links | Sinus 33–98 Hz | `amb_brumm` (echt, vorhanden) dahinterlegen; reine Töne wirken hier tragbar |
| Wimpernzucken `kino_wimper`, Pusten `kino_pusten`, Bonbon/Schuhquietschen `beob_bonbon/chirp`, Kiesel, Tapp | `kino.js`, `beobachter.js` | kurze Rausch-/Sinus-Klicks | Foley-Aufnahmen (Sonniss „Mouthy“, Schuhsohle) |
| Kinder-Tapp, Wind/Wald-Fallback in `waldleben.js:149`, Vogelzwitschern-Fallback, `Audio.ring` (425 Hz Freizeichen, leise) | `waldleben.js`, `klang.js` | Rauschen/Sinus | Freizeichen aus Sonniss „Vintage Telephones“; Wald-Bett `amb_wald` liegt bereits darunter |
| Kiffen-Szenen (Tinnitus, Schnitt, Zuckungen), Ohrklingeln-Fallback (3950 Hz) | `kiffen.js`, `tod.js` | Sinus/Rauschen | **bleibt absichtlich** (reiner Ton ist hier das Vorbild) |
| `Audio.powerUp` (Sägezahn-Anlaufton im Tank), Beobachter-Stimmen-Fallbacks, Feuer-Cue-Fallbacks (`feuer.js:156–165`) | `_base_source_index.html`, `feuer.js` | Oszillatoren | `mu_feuer_a/b` (echt) liegen bereits; Anlaufton durch Transformatorbrummen aus Sonniss ersetzen |
| Flügelschlag nur 4 Aufnahmen (Taube/Ente/Adler, tiefer gestimmt) | `fx_flug_*` | echt, aber keine Rabenaufnahme | bei Bedarf Rabenstart mit Mikro nah suchen (freesound-Suche „raven takeoff“ ergab nichts mit sauberem Flügelschlag) |
| Spinnenlaufen | `fx_krabbel_*` | echt (Spinnenschritte + Kakerlakenschwarm), aber keine Aufnahme einer großen Spinne | passt für Kap. 2; im Test auf Schwarmstärke prüfen |
| Wind-/Regenschleifen: Nähte | `amb_*` | `loopify` + 0,25-s-Rand, Überblendung 1,5–3 s; Messung der Naht fehlt | im gebündelten Test mit Messskript prüfen (BURST/DIP) |
| Hush (`leben_hush` / `spannung_hush`) | `spannung.js` | **kein Klang**, nur Pegelsenke der Regie | nichts zu ersetzen |

## 5. Zweiter Durchgang (08.10.2026, später)
- **Rabenflügel:** `Audio.flap` nimmt jetzt zu 80 % `fx_rabe_fluegel_1–3` (tieffrequente Schläge aus einer Raben-Feldaufnahme, ohne Rufe; per Pegel-/Spektrum-Auswahl, ungehört), sonst den schweren Adler-Schlag `fx_flug_4`. Taube/Ente (`fx_flug_1–3`) sind nur noch Rückfall. Krähen rufen weiterhin mit den OGA-/Sonniss-Krähenaufnahmen (`crow1/2`, `fx_rabe_*`); eine eigene Krähen-Flügelaufnahme gibt es nicht.
- **Glocken:** Fahrradklingel (Post, Whiskey) = `fx_klingel_kurz_1/2`, `fx_klingel_lang` (freesound CC0). Kapellenglocke Kirchberg und die Schläge Kap. 2/3 (`ausbau_nord_bellToll`, `neben3_glockeTon`) laufen über `Audio.glocke` = VSCO-Röhrenglocke (echt, auf Schlagton gestimmt, Hall über Raumklang); die Sinus-Synthese bleibt nur als Rückfall. Eine saubere **Kirchenglocke als Einzelschlag** fand sich nicht (Sonniss „Church Bells Calling to Mass“ und freesound „Church bells“ sind dauerndes Läuten mit Stadtgeräusch). Türglöckchen und Handglocke kommen im Code nicht vor. Das Warnsignal der offenen Autotür (`strasse_autoDing`) bleibt ein elektronischer Doppelton.
- **Pfeifen/Summen:** Sampler `Audio.stimmNote` (ein gepfiffener Ton E6, zwei Summtöne B3/G4, per Abspielrate auf die Tonhöhe gebracht): Whiskey „wiegenlied“, Lucys Summen Kap. 5, Summen der Hungrigen und im Amt. Nur ein Ton je Art ist sauber nutzbar gewesen; Transposition > 4 Halbtöne klingt künstlich, im Test prüfen. Offen bleiben `neben3.js:264`, `lucy3.js:91`, `ausbau_ost_west.js:659` (Dreieck-Melodien).
- **Funk-Fake-Sprache, TV-Stimme, Traum-Wörter:** bleiben vorerst unverändert. Nach dem Stimmenlauf (Qwen3-TTS, `HAM_Stimmen`) können sie auf TTS-Fetzen mit Filter (Bandpass 320–2900 Hz, Rauschen aus `fx_funk_stat`, Rauschsperre `fx_funk_klick_*`) umgestellt werden: `klang_funk` (Silbenhülle ersetzen), `leben.js` TV-Stimme (`S.tvVoice`), `traum.js` `TRAUM_WORT`.
- **Schleifen-Nähte:** `app/tools/klang_naht.py` prüft alle `amb_*`, `mu_gefahr`, `mu_jagd*`, Schnurr- und Funk-Schleife: Sprung der Sample-Werte am Übergang (Kern ohne 0,25-s-Rand, wie das Spiel ihn schneidet) und Pegel der letzten/ersten 0,25 s im Vergleich zu den normalen Pegelsprüngen im Material (95. Perzentil). Ergebnis: kein Sprung > 1,4× (alle Übergänge klickfrei, durch `loopify` überblendet); Pegelunterschiede liegen überall im natürlichen Schwankungsbereich bis auf `amb_weiss` (22 % gegen 20 %), das mit 1,5 s Kreuzblende neu gebacken wurde (jetzt 1,3 %). Ein pauschaler Schwellwert von 10 % würde 13 Betten und beide Jagdstücke markieren, ist bei Regen und Trommeln aber Material, kein Fehler; deshalb der Vergleich mit dem Inneren der Datei.
