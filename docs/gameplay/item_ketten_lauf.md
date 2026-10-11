# Item-Ketten Kapitel 1–6 – echter Durchlauf mit E (11.10.2026)

Methode: je Kapitel eine frische Sitzung (Kapitel 1 = „Neues Spiel“, Kapitel 2–6 = Kapitelwahl wie im Menü), Teleport zum Fundort (`T.reach`: stellt sich in 0,6–3 m vor das Objekt und prüft, dass der Spielstrahl genau dieses Objekt trifft), echte Taste E (`T.use`), danach Prüfung: (a) Schlüssel im Inventar, (b) Name/Beschreibung vorhanden, (c) im Inventar-Text der Fibel angezeigt, (d) Fundort-Merker der Aufheben-Darstellung (`INV3D.found`). Ergebnisse: `_zst/c<N>_res.txt`.
Zusätzlich der Interaktions-Sweep (`_zst/ia_sweep.js`): jede der ~540–570 Interaktionen eines Kapitels einmal ausgelöst, Funde protokolliert (H1–H5; H6 – siehe unten).
Zustand je Zeile: **E** = mit E am Fundort aufgenommen, **Hook** = über Testhook ausgelöst (Szene), **–** nicht getestet (Grund).

| Kap. | Gegenstand (Schlüssel) | Fundort / Interaktion | Pflicht | Aufnahme | Inventar-Anzeige | Aufheben-Darstellung | Note | prägnant | Beleg |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Schlüssel Nr. 7 (`key`) | Briefkasten Nr. 7, „Briefkasten öffnen“ (28,−7) | P | E | ja | ja (Kap1) | 1 | ja | c1, P1 |
| 1 | Brechstange (`brechstange`) | Werkbank Nr. 7, „Werkbank durchsuchen“ (26,−21) | P | E | ja | ja | 1 | ja | c1, P1 |
| 1 | Lucys Tonband (`tape`) | Keller Nr. 7, „Zettel am Rekorder“ → „Kassette abspielen“ (302,296,75) | P | E | ja | ja | 1 | ja | P1 (Tastenfeld 3110 echt eingegeben, Band bis „Klick. Bandende.“, `heardTape`) |
| 1 | Brunos Halsband (`collar`) | Aschekreis, „Halsband aufheben“ (−12,−10) | O | E | ja | ja | 1 | ja | c1 |
| 1 | Lucys Handy (`phone`) | Lucys Auto, erst „Autotür öffnen“ (1,−37), dann „Lucys Handy“ | O | E | ja | ja | 1 | ja | c1 |
| 1 | Lucys Zigaretten (`lucy_zigaretten`) | Handschuhfach Lucys Auto (2,−37,5) | O | E | ja | ja | 2 | nein | c1 |
| 1 | Fotoalbum (`fotoalbum`) | Nr. 7 Wohnzimmer (21,−13) | O | E | ja | ja | 1 | ja | c1 |
| 1 | Drahtschneider (`drahtschneider`) | Alter Schuppen Parzelle (−123,14): 1. E Heftseite, 2. E Drahtschneider | P (Kap. 4) | E | ja | ja | 2 | ja | c1; c3 (zweimal E nötig – Hinweis-Toast R5 vorhanden) |
| 2 | Einwilligungen 2009 (`einwilligungen`) | Zimmer 7, „Aushang“ (631,−2602) | P | E | ja | ja (Kap2) | 1 | ja | c2 |
| 2 | Schlüssel Sicherungsraum (`fuse`) | Zimmer 7, „Schlüssel am Haken“ (634,−2602) | P | E | ja | ja | 1 | ja | c2 |
| 2 | Keramiksicherung (`sicherung`) | Archiv, „Aktenschrank durchsuchen“ (628,−2605) | P | E | ja | ja | 1 | ja | c2 |
| 2 | Leiter (`leiter_amt`) | Sicherungsraum, „Leiter nehmen“ (635,−2593) | O | E | ja | ja | 1 | nein | c2 |
| 2 | Wartenummer 8 (`wartenummer`) | Nummernautomat, „Eine Nummer ziehen“ (615,−2602) | O | E | ja | ja (Fundort-Name „Treppe“) | 2 | nein | c2 |
| 2 | Peters Feuerzeug (`feuerzeug`) | Peters Zelle, „Feuerzeug“ (643,−2604) | P (Kap. 5/6) | E | ja | ja | 1 | ja | c2 |
| 3 | Drahtschneider | wie Kap. 1 (in Kap. 3 erneut erreichbar) | P | E (2×) | ja | ja | 2 | ja | c3 |
| 3 | Hildes Zählbuch (`buch`) | Kreuzung, „Zählbuch lesen“ (21,−13) | O | E | ja | ja (Kap3) | 1 | ja | c33 |
| 3 | Brecheisen (`n3_brecheisen`) | Friedhof/Pfarrhaus-Weg, „Brecheisen“ (−57,50) | O | E | ja | ja | 1 | nein | c3 |
| 3 | Feuerwehr-Handscheinwerfer (`lampe3`) | Tankstelle, „Ladegerät durchsuchen“ (116,30) | O (Lampenstufe 3) | E | ja | ja (Tankstelle) | 1 | ja | c31 |
| 4 | Schlüsselteile → Villaschlüssel (`schluesselteile`) | Spielplatz, „Aufgewühlter Sand“ (24,74) | P | E | ja | ja (Spielplatz/Kap4) | 1 | ja | c4 |
| 4 | Zayns Kinderkamera (`zayn_kamera`) | Nr. 7, „Kleiner Rucksack“ (24,−13) | O | E | ja | ja | 1 | nein | c4 |
| 4 | Knolle / Grinder / Pappdeckel (`kf_*`) | Schrebergarten Blumentopf, Schreibtisch, Küchenschublade | O | E | ja | ja | 2 | nein | c4 |
| 5 | Hildes Kamera (`polaroid_kamera`) | Nr. 7, „Hildes Kamera nehmen“ (21,−13), Beat `kamera` | P | E | ja | ja (Kap5) | 1 | ja | c5 |
| 5 | Kanten Brot (`brot`) | Nr. 1, „Den Kanten Brot nehmen“ (−52,−15), Beat `heimweg` | P | E | ja | ja | 1 | ja | c5 |
| 5 | Heidis Karten (`heidis_karten`) | Nr. 1 (−52,−15), Beat `heimweg` | O | E | ja | ja | 1 | nein | c5 |
| 5 | Mamas Kerze (`mamas_kerze`) | Heimkehrerin-Szene (`__k5.runde3()`, 45 s) | P | Hook | ja | ja | 1 | ja | c5 (Inventar enthält `mamas_kerze` nach der Szene) |
| 5 | Lucys Spieluhr (`lucys_spieluhr`) | Nr. 1 Kinderzimmer, „Lucys Spieluhr nehmen“ (−53,−22), Beat `spieluhr` | P | E | ja | ja | 1 | ja | c5 |
| 6 | Pfandflasche (`pfandflasche`) | Waldweg, „Eine Pfandflasche“ (20,120) | O | E | ja | ja (Lichtung/Kap6) | 1 | nein | c6 |
| 6 | Funkgerät der Bergung (`bergungsfunk`) | toter Blechmann (AG-20, Szene per Hook bis zum Ende), „Das Funkgerät nehmen“ | O | Hook + E | ja | ja (Hochsitz/Kap6) | 1 | ja | c6 |
| 6 | Seitenschneider (`seitenschneider`) | Tasche (AG-18, nur nach der Dialogoption `schneiderFrei`), „Den Seitenschneider einstecken“ | O | E (nach Setzen von `schneiderFrei`; Tasche nach der Szene wieder aufgeschaltet) | ja | ja | 2 | nein | sch6 |

## Interaktions-Sweep (alle Interaktionen einmal ausgelöst)
H1 (Neues Spiel): 544 Interaktionen, 249 mit Fund (21 Gegenstände, 277 Fibel-Einträge). H2 (Kap. 2): 541 / 244. H3 (Kap. 3): 561 / 260. H4 (Kap. 4): 573 / 271. H5 (Kap. 5): 562 / 255. Fehler (Ausnahmen) in keiner Aktion. H6 (Kap. 6): Sitzung brach ab (WebGL „too many errors“ / Kontextverlust des Dauerprozesses nach 15+ Neuladungen; im frischen Prozess lief dieselbe Szene AG-20 durch, Trace ohne Hänger). Die Funde aus H1–H4 sind die Grundlage der „wie erspielt“-Funde der Vorkapitel in `app/mods/zustand.js` (`ZUST_LORE`: Wortlaut unverändert aus den echten Aktionen übernommen).

## Speichern/Laden der Ketten
Speichern → Neuladen → „Weiterspielen“ → Snapshot-Vergleich: L4 (Kap. 4, Inventar mit 14 Gegenständen inkl. `ow_kanister`/`ow_seiten` mit idefs): 0 verlorene Items/Lore/Seiten, 18 erwartbare Zeitdifferenzen (Akku, Weltuhr, Zeitgeber, Ziele-Log). L1 (Kap. 1 Ende): siehe `zustand_audit.md`.

## Befunde aus dem Durchlauf
* **Kap. 3 Eröffnung**: Die Eröffnung (Glocke 3 + 13, ~2 min) hält den Spieler bewusst an der Kreuzung (`lucy3.js:130`, Leine 5 m, nur solange `scripted` nicht aktiv) – Teleport-Tests der weit entfernten Fundstellen müssen vor Beginn der Leine (liegender Start) oder nach der Eröffnung stattfinden; deshalb je Gegenstand eine eigene frische Sitzung (c31–c33).
* **Kap. 3 Drahtschneider**: erster E liefert nur die Heftseite (`ow_seiten`), zweiter E den Drahtschneider (Hinweis-Toast R5 vorhanden).
* **Kap. 6**: Dauerprozess mit vielen Neuladungen verliert den WebGL-Kontext (Shader-Validierungsfehler auf beliebigen Materialien, danach „too many errors“) – Testartefakt, nicht Spiellogik.
* Alle geprüften Gegenstände erscheinen im Inventar-Text der Fibel (Spalte „Inventar-Anzeige“), `INV3D.found` merkt Fundort und Kapitel.
