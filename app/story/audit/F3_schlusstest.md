# F3 · Schlusstest (Prüfstufe 4) Kapitel 1–6 – 01.10.2026

Getestet nur mit dem echten Bau (`node tools/assemble.js && node build.js`, Electron-Selbsttest ohne `--root`, lädt `app/game` mit KTX/Vendor).
Jeder Lauf einzeln über `_testgate.sh` (≤ 12 min), 30 Läufe. Werkzeug, Schrittdateien, Ergebnisse: `C:/Users/GIGABYTE/_schluss/`
(`lib.js` Helfer, `mk_*.js` Erzeuger, `run.sh <steps> <name> [profil-vorlage]`, `ana.py`, `sheet.py` Kontaktbögen, `out_<lauf>/` Bilder + `steps.json`, `ana_<lauf>.txt`).

**Kapitelkette mit echtem Spielstand:** jeder Kapitel-Lauf startet über „Weiterspielen“ im Hauptmenü mit dem Profil des vorigen Laufs
(`prof_<lauf>`). Jeder Kapitelwechsel lief einmal echt: Gang hinter der Kellerwand (1→2), Leiter/Gully (2→3), Endkarten-Knopf (3→4, 4→5, 5→6).
Ausnahme: das Ende von Kap. 3 (Abgrund → Endkarte) lief mit gesetztem Zustand ab dem Abgrund (`k3d`), weil der ganze Nimmerheim-Weg nicht in 12 min passt.

**Methode / Testgrenzen:** Der Selbsttest hat keine Zeigersperre und keine Maus. Positionen sind teils per Teleport gesetzt, einzelne
Auslöser über die Testzugriffe (`__k1`, `__amt`, `__k6` …). Wo ein Fehlbefund nur daran lag, steht „Testgrenze“ (kein Spielfehler), z. B.
Justins Ankunft (Basis verlangt Zeigersperre), Augen-zu-Szenen (Q muss nach dem Freigeben neu gedrückt werden), `introSeq`-Karten.
Nebenbei: `app/main.js` schreibt `steps.json` jetzt nach jedem Schritt (nur Selbsttest), damit bei Zeitüberschreitung der Stand erhalten bleibt.

## Behobene Fehler

| # | Befund | Ursache | Datei (minimale Änderung) | nachgeprüft |
|---|---|---|---|---|
| 1 | **Kap. 4 startet schwarz**: Kapitelkarte unsichtbar, Klick-Ziel/Intro laufen nie (Weiterspielen und Knopf auf der Endkarte Kap. 3) | `// Story-Prüfung V-8` mitten in der Zeile verschluckte `$('introSeq').classList.add('show'); $('fade').style.opacity = 0;` | `anwesen.js` (Zeilen- → Blockkommentar) | ja, k4a3 |
| 2 | **Kap. 5 startet schwarz** (gleiche Ursache) | dito | `kapitel5.js` | ja, k5 |
| 3 | **Kap. 6 startet schwarz** (gleiche Ursache) | dito | `kapitel6.js` | ja, k5/k6 |
| 4 | Hände: Abbruch „keine Fingergruppe aktiv“ fehlte (IK lief jedes Bild, auch ohne Griff) | `// __griffAus …` verschluckte `let aktiv = false; for … if (!aktiv) return 0;` | `griff.js` | Joint-Szene k4a3 läuft |
| 5 | **Kap. 3 Sackgasse nach „Weiterspielen“ am Kapitelanfang**: Kuh fällt nie → Telefon klingelt nie → Justin kommt nie | `kapitel3_fortsetzen` bricht das Intro ab; die Kuh hing nur am Intro | `kapitel3.js` (Kuh nach dem Aufstehen nachholen, wenn sie noch nicht gefallen ist) | ja, k3a4 |
| 6 | Kap. 3 Polaroid „Sieben und ein halber“ immer ohne Bild (Warnung `drawImage`) | `kamera_render` liefert eine Bild-URL, nicht ein Canvas | `kapitel3.js` (URL erst als Bild laden) | ja (Album-Bild 35 KB) |
| 7 | Kap. 3 Abgrund `k3blinzeln`: Kreis der Behaltenen und Schritte an NaN-Orten, `AudioParam … non-finite` | `weiss.js` übergibt `mitte: [x, z]`, `kino_buehne()` gab das Array weiter, alle Nutzer lesen `.x/.z` | `kino.js` (`kino_buehne` wandelt das Array) | ja, k3d (Kreis gültig, keine AudioParam-Fehler) |
| 8 | Weiterspielen in Kap. 2: Ziel springt auf „Folge dem Gang …“ (bzw. auf Kap.-1-Text) zurück | `chapter2Begin()` speichert sofort neu (Ziel aus dem DOM), die Kapitelkarte setzt `C2_MAIN[0]` | `tod.js` (gespeichertes Ziel beim Laden merken, 3 s nach der Karte wieder setzen) | ja, k2b3 („Weg hier. Nach Osten.“) |
| 9 | **Kap. 6 Finale: Takt „Wendigo“ schaltet sich ab** (wiederholte Fehler) – Hirsch-/Raben-/Licht-Takt danach tot | `hungrige_cineTick` setzt `C.look`, das in der Phase „vor“ (Lampe stirbt) noch `null` ist | `hungrige.js` (`if (C.look)`) | Lauf v |
| 10 | Kap. 6 Finale: Shader `M_Crow·Fleisch` ungültig („texture image units exceeds 16“), Rabe unsichtbar, Logflut (> 1700 Zeilen) | Fleisch-Shader auf `MeshPhysicalMaterial` + Grafik-Bausteine > 16 Textureinheiten | `kreaturen.js` (Physical-Basis → Standard, wie schon bei Nicht-Standard-Materialien) | Lauf v |
| 11 | Rote Fehlerzeile im Bild „Takt „Raumklang“: Cannot read … 'frequency'“ (Kap. 5) | stumm angelegte Quellen (`Audio.cut`, ohne Filterkette) wurden über `Audio.play` nachgeführt | `raumklang.js` (nur Quellen mit Filterkette nachführen) | Lauf v |
| 12 | Waldboden Dustwoods/Tiefwald ohne Textur (6 leere Texturen, 404 `ms/forestfloor`, `ms/leaves`) | Pfad: die Texturen liegen in `assets/forestfloor`, `assets/leaves` | `wald.js`, `tiefwald.js` (`'../forestfloor'`, `'../leaves'`) | ja (0 fehlende Texturen) |
| 13 | 404 `fx_kette_3/4`, `fx_quietsch_3/4` bei jedem Laden | Liste nannte 4 Varianten, es gibt 2 | `klang.js` | ja |
| 14 | Einstellungen/Steuerung (Notizheft-Seite) rutscht nach rechts unten aus dem Bild (unterer Teil nicht erreichbar) | `#subPanel:has(#sSens) { transform: rotate(-.5deg) }` ersetzte das zentrierende `translate(-50%,-50%)` | `_base_source_index.html` (`translate(-50%, -50%) rotate(-.5deg)`) | Lauf v |
| 15 | **Türspione: 0** (an keiner Haustür), Klopf-Texte sprechen vom Spion | Türmodelle zeigen nach innen; der einseitige Strahltest traf keine Türfläche | `fassaden.js` (Strahltest kurz zweiseitig) | Lauf v |

## Prüfpunkte

Ergebnis: **OK** · **behoben (#n)** · **offen** · **ungeprüft** (Lauf kam nicht hin / Testgrenze). Lauf = Ordner `out_<lauf>`.

### Laden, Konsole, Bau
| Prüfpunkt | Ergebnis | Lauf / Beleg |
|---|---|---|
| Laden ohne Fehler, keine Shaderfehler | OK – nur Lader-Warnungen (FBX, D3D-Hinweis X3595), kein `WebGLProgram`-Fehler beim Laden | a, k1a … |
| 404-Dateien | behoben (#12, #13); übrig: `chars/<id>/kino.json` (optionale Sonde von `kino_extraClips`, harmlos) | a, k1b |
| Texturen vollständig | behoben (#12): 2415 ok / 6 leer → 0 leer | a → k1b |
| „Eingebettete GLB-Texturen laden nicht“ (F3_uebergaben PRIORITÄT 1) | nicht reproduzierbar – in keinem der Läufe `Couldn't load texture blob` | alle |
| Kollision vorhanden | OK (882 Kollisionskörper, Gänge/Treppen begehbar) | a |
| `Texture marked for update but no image data` (2×) | offen, gering – Quelle nicht gefunden (die volle Texturliste lief nicht mehr) | alle |
| Kontextverlust der Grafik (WebGL `CONTEXT_LOST`) | **offen, kritisch** – siehe „Offen“ | k5, k6d |

### Kapitel 1 (Läufe k1a, k1b)
| Prüfpunkt | Ergebnis |
|---|---|
| Neues Spiel → Helligkeit kalibrieren → Intro → Traum-Prolog (selbst gehen, Rabe landet, Kino „Kum, Wîse“) → Aufwachen | OK |
| Ziel-Anzeige mit Warum („NEUES ZIEL“, Warum in Handschrift, Taste Z) | OK |
| Briefkasten, Tür Nr. 7 (verschlossen ohne Schlüssel, Text passt), Kühlschrankzettel, Kalender, Tastenfeld 3110 | OK |
| Keller: Ankunft am Treppenfuß, Blick zum Stuhl | OK |
| „Nach oben gehen“ vor dem Band → „Noch nicht …“ | OK |
| Band, „… danke, Luke …“, Gurte offen | OK |
| Speichern im Keller → Weiterspielen: Treppenfuß, Label „WEITER“ | OK |
| Stromausfall, Laternen von Ost nach West, Hilde-Kino k1h, Versteck vor dem Kegel, Gehoben-werden | OK |
| Kellerende, „Die Hand an die Wand legen“, Abspann k1, Endkarte („/ 18“ im Code, Bild nicht erfasst) | OK |
| Gang hinter der Wand (unsichtbare Nahtstelle K1→K2), Amtstunnel → Kapitel 2, Spielstand Kap. 2 | OK |

### Kapitel 2 (k2a, z, k2b3)
| Prüfpunkt | Ergebnis |
|---|---|
| Weiterspielen → „WAS BISHER GESCHAH“ → Kapitelkarte → Amt | OK; Ziel nach dem Laden behoben (#8) |
| Nadeldrucker „VORGANG 08 BETRITT EBENE −2“ … „KORREKTUR: RÜCKLÄUFER 08.“ als Untertitel | OK |
| Nummer ziehen (echte E-Taste), Kantine, Archiv/Zimmer 7, AG-06, Strom, Spinnen | OK |
| Peter: lädt (20 Clips), Jagd-KI (verdacht → jagd), QTE-Ring an der Hand, Ausweichen Erfolg (Stolpern) | OK |
| k2a „Bruder.“ mit QTEs, Losreißen, Fass, Sturz – liegt bei `ax − 2,0`, Kopf nach Osten | OK |
| Zünden-QTE, Brand: Nicken → Winden → Sturz vor Ende, Flucht, Tür | OK |
| Tod durch Festhalten (2× verfehlt) → „DU BIST GESTORBEN“ → Fortsetzen → zweiter Griff ohne Kino mit QTEs | OK |
| AG-07 (Versteck hinter den Schränken) | ungeprüft (Lauf geriet in den Tod) |
| Planungsraum: Luke-Figur rückt nur beim Hinsehen | OK (1→4 Schritte); 6. Mal/Umfallen im Test nicht erreicht |
| Messraum, Stuhl 8, Klavier/Safe, Akte 08, Finale-Wahl, Kino k2b, Lucy im Tank | OK |
| UK 9: Stablampe am Leiterfuß → Leiter (E halten) → Gully → Whiskey „Scheiße!“ → Glocken/Karte → Kapitel 3 | OK |

### Kapitel 3 (k3a4, k3b, k3c2, k3d)
| Prüfpunkt | Ergebnis |
|---|---|
| Weiterspielen am Kapitelanfang: Aufwachen (W), dann Kuh | behoben (#5) |
| Kuh-Kino, drei Untersuchungsstellen (echte E-Taste), Polaroid mit Bild | OK, Polaroid behoben (#6) |
| Telefon klingelt, Anruf, Justin kommt | OK (Ankunft direkt ausgelöst – Basis verlangt Zeigersperre, Testgrenze) |
| „Kein Draußen“ an der Ostsperre | OK (Satz „Gesperrt. Ausgebrannte Autos …“) |
| AG-09 / AG-08 / AG-10 | ungeprüft (Auslöser hängen an Weg-Zähler/Reihenfolge, im Test nicht getroffen) |
| Zählbuch, Funk, Ochs am Berg (Graukind sichtbar, Fang zählt) | OK |
| Behaltene, „Nimm Justins Hand“, Weiterspielen mitten im Kapitel (UK 4 / Kette) | OK |
| Nimmerheim Raum 1–3, Hände, Geständnis, Abgrund, k3blinzeln, Wahl, Abspann, Endkarte, Knopf Kap. 4 | OK nach #7; „k3blinzeln hängt bei 29,8 s“ (kino2 5) = wartet auf Q (Augen zu), kein Fehler |

### Kapitel 4 (k4a3)
| Prüfpunkt | Ergebnis |
|---|---|
| Kapitelkarte mit „BISHER“ | behoben (#1) |
| AG-11, Nr. 3 (Lucy auf dem Sofa, Vegas), Graues Gesicht im Rauschen (Flashback) | OK |
| Joint-Szene alle Schritte (grinden … rauchen, 2 Züge), „Fünf Minuten“ erledigt, Gedanke danach | OK; Joint schwebt im Schritt „feuer“ neben der Hand (offen, gering) |
| Halle → Kino k4 → Endkarte (Schlüsselteile 8/8) → Kapitel 5 | OK |
| Halle/Villa-Räume sehr dunkel | offen (bekannt aus AP-19) |

### Kapitel 5 (k5)
| Prüfpunkt | Ergebnis |
|---|---|
| Kapitelkarte mit „BISHER“ | behoben (#2) |
| UK 1 Veranda: kein „Himmelherrgott“ | OK |
| Funk danach (N12, N11, Vegas) | ungeprüft (in 25 s nicht gekommen) |
| Gisela (Hänschen-Sätze), Hänschen tragen, Runde drei (Luna-Zeilen, Nahaufnahmen) | OK |
| Friedhof: „Pust.“ nach ~12 s ohne Lampe | ungeprüft (Test stand nicht am Friedhof) |
| Abspann k5, Endkarte, Knopf Kapitel 6 | OK |

### Kapitel 6 (k6, k6b–e, v)
| Prüfpunkt | Ergebnis |
|---|---|
| Kapitelkarte mit „BISHER“, Weiterspielen am Speicherpunkt | behoben (#3) / OK |
| AG-18, Falle mit Wolf, AG-20, Jagd, Tod durch das Hirschding → Todesbildschirm | OK |
| Raben-Finale, Aufstieg, Epilog („Whiskey fliegt voraus“), Fibel „~~Der Hungrige~~ Wendigo“ erledigt | OK; Takt-Abschaltung behoben (#9), Raben-Shader behoben (#10) |
| Hochsitz: Augen zu (Q), Wahl T-1 (1–3), „Das bist du“, Endkarte „Einer fehlt noch. Du.“ | Lauf v |
| VRAM in Kap. 6: 7,6–7,8 GB von 8 GB (4 700 Texturen, 876 Programme) | **offen, kritisch** |

### Systeme
| Prüfpunkt (Quelle) | Ergebnis |
|---|---|
| Menü m1–m9 (menue): Nr. 7, Laterne mit Whiskey auf dem Leuchtenkopf, Ortstafel, Kapelle, Waldrand, Hover, 7 Polaroids („7 1“), Mitwirkende | OK (130 Einträge) |
| Einstellungen/Steuerung als Notizheft-Seite | behoben (#14) |
| Ziele (selftest_ziele): start, NEUES ZIEL + Warum, Nebenaufgabe, Jagd hält Einblendungen zurück („DU HAST EINGESTECKT“ danach), „WAS JETZT?“, WEITER nach dem Laden, 18 Klänge vollständig | OK |
| Grafik (r14): Bildpass, keine Shaderfehler, Notizen (Lucy liniert, Akte mit Stempel, Kreide auf Tafel), Rätsel, HUD lesbar | OK (`p07_figur` zeigt eine roh geladene Figur in T-Pose – Testaufbau, nicht im Spiel) |
| Hervorhebung: Ränder an Tür/Stuhl/Tisch/Polaroid/Telefon, aus im Dialog | OK (Augenschein) |
| Fenster (fenster): nachts Zimmer/Licht hinter den Fenstern, Nr. 7 warm, Kinderzimmer Nr. 1 mit Nachtlicht | OK; Nr. 9 Front sehr dunkel (gering) |
| Türspione | behoben (#15) |
| Raumklang (rk-Proben): Telefon-Kreis (Balance ±12 dB), Beobachter links hinten, Tür Nr. 7 zu/auf (+8 dB, heller), Rabe über Kopf | OK |
| Raumklang: Schritte im Amt-Gang (Probe 4) verstummen zwischen 25 m und 5 m (−100 dB), vorher und danach hörbar | offen (Ursache nicht gefunden – Bitte an Klang) |
| Zombie/QTE (Peter) | OK (siehe Kap. 2) |
| Gesichter: Lucy/Luna nah (Runde drei) gut; Peter-Nahaufnahme k2a pixelig/kantig; Prolog-Graugesicht weiß überstrahlt (kino2 1d) | offen (Optik) |
| Kuh (k3kuh), graues Gesicht im Rauschen (Kap. 4), Behaltene im Kreis (k3blinzeln) | OK |
| Zeichen, Umwelt (Wind/Schaukel/Blätter), Vegetation, Hände/Räume (r56), Beobachter (r21), Kino-Stills (t_F) | ungeprüft – Sammelläufe b1b/b3 kamen wegen der Testschlange (Leistungsmessung exklusiv) nicht mehr dran; nur Fenster/Grafik/Ziele/Raumklang liefen |
| Schwarze, gestreckte Streifen („Schlieren“) über Vorgärten (Nr. 1, vor Nr. 7) | **offen** – siehe unten |
