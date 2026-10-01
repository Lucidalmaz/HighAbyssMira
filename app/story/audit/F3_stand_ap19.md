# Stand AP-19 · Kapitel 4 „Sehen, Bergen, Schweigen“ (Hauptweg)

Stand 30.09.2026. Kapitel 4 ist vom Intro bis zur Endkarte (Knopf „WEITER · KAPITEL 5 · ISS AUF, BRUDER“) spielbar.

## Module / Anker
- **neu `villa.js`** (ORDER nach `anwesen`, stand schon drin; ein `WORLD_MODS.push`, ein `WORLD_TICK.push`, `MOD_SAVE` 'villa'): Kapitelablauf UK 1–12, Innenräume, Tageslicht.
  - Räume (je ein eigener Innenraum, Überblendung wie `anwesen_enterHall`, **Bau erst beim ersten Betreten**, Gruppe `VILLA.g` nur sichtbar, solange Luke drin steht):
    `az` Arbeitszimmer (x −921…−913, z 896…904) · `an` Anrichte (−891…−885, 897…903) · `og` Archiv + Heinrichs Zimmer (−908…−886, 927…933) ·
    `kr` Kühlraum + Schleuse + Zelle Ost (−908…−888, 866…872) · `nr3` Vegas' Stube (−985…−977, 855…861) · `nr9` Posten Nr. 9 (−985…−975, 895…901).
  - Lichter: 18 `VLight` beim Laden (Intensität 0), beim Raumbau nur umgesetzt; Kühlraum-Röhren nur über Intensität/Emission.
  - Tageslicht Kap. 4: Nebel, Himmel, Hemisphäre/Mond, Belichtung je Bild nach dem Basis-Update (`villa_tagTick`), zurück beim Kapitelwechsel.
- `anwesen.js`: `chapter4Begin` → `villa_neu()`, Intro-Klick → `villa_nachIntro()` (Flashbacks + „Fünf Minuten“ über `kiffen_start`); Nest ohne Teil 04 + „Das ist meins“-Hacken;
  Porträt neu (Bild `villa_portraetBild`, Notiztext Fassung 3, „L. B.“-Gedanke, Klopfen am Fenster, „Das Porträt anheben“ → Noten); Wanduhr beim zweiten Mal Bleistift;
  Krankenbett → `villa_bett` (Nachbild Seiler/Wolter, Strickjacke, Dienstnadel); Hallentüren West/Ost + Post Z-07 (`villa_halleTueren`); Treppe erst nach `ring` + `noten`,
  Stimme oben mit Summen/Whiskey/„Aus dem Traum“; Endkarte mit Vertrauenszeile (`lwo_kapitelende(4)`).
- `kino.js` k4: Einstellung 1 auf 12 s mit der einen Sichtung (`beob_sichtung` an der Bruchkante, 0,95 s), am Ende 23 s Schwarz mit `traum_zweiter()`.

## Tests (Profil `_ham_testprofil_ap19`, Schritte `C:/Users/GIGABYTE/_ap19_t/mk.js` → steps_a1/a2/b1/b2.json, je ≤ 10 min über `_testgate.sh`)
Die Kette ist in vier Teilläufe zerlegt; a2/b1/b2 setzen den Stand davor per Merker, nie in einem Stück gespielt.
- **a1 (UK 1–3)** ✓: Intro, Taglicht/Nebel, Kommando + AG-11, Z-09, „Fünf Minuten“ startet, Kombi, Nr. 3 (Lucy/Vegas, Teil 06), AG-12 bis zum Ende (Weg „ablehnen“, Vertrauen 50→40).
- **a2 (UK 4–9)** ✓: Nr. 9 (−10, Ringbuch, DA 10, Kameraloch mit Sichtung), Presse → Schlüssel → Halle, Arbeitszimmer (Akte EISEN, SB-09), Archiv, K-Akten → AG-13 mit Schrank-Versteck; nur der Entdeckt-Weg lief (Testskript atmete stur im Takt).
- **b1 (UK 10)** ✓: Keller, Sicherungskasten, Höhepunkt A komplett (~46 s), Zelle Ost, B-K4-07/B-K4-06, Band.
- **b2 (UK 11–13)** ✓: Pling, AG-14 (Wolter, Handschuh/Höhepunkt B), W-11 Ring, Noten, Treppe, Kinosequenz k4, Endkarte wörtlich mit Knopf „WEITER · KAPITEL 5 · ISS AUF, BRUDER“; Lichtanzahl vorher = nachher (18).
- Nicht einzeln geprüft: R4-1 falsche Schublade, R4-3 Fehlversuche, Deckel ∴-1 (−6) + B-K4-06b, Weg „echt“/„Fälschung“, Flicken-Einlösung, Sichtung im Kino (Test hat sie nicht erfasst), Weiterspielen aus einem Villa-Raum.
- FPS: unter Parallel-Last verrauscht (Keller 109, Archiv 36, Nr. 9 60; Halle/Arbeitszimmer/Nr. 3 einzeln 3–4 gemessen – bitte in der sauberen Messung prüfen).
- Behoben in den Läufen: Kamera-NaN während Höhepunkt A (Hauptschleife stand, AudioParam non-finite) → eigene Brumm-Oszillatoren statt `kino_brumm/kino_still` außerhalb des Kinos, Kamera-Dummy als Kamera, NaN-Schutz (`villa_heil`); hängendes `state.talking` → Zähler (`villa_rede`), AG-14-Auslöser robust; Taschenlampe nach dem Versteck wieder an; Entdeckungsbalken weicher; Thermoskanne ohne Strahltest; Innenräume heller.
- Fremd (nicht behoben): `Hauptschleife render ReferenceError: Cannot access 'FRZ' before initialization` beim Laden (Basis, Leistungs-Agent: `frzTick()` in der Renderschleife vor `const FRZ`).

- Letzter b2-Lauf (nach allen Fixes): AG-14 löst selbst aus, Thermoskanne steht, Endkarte korrekt, keine Fehler im Log.

## Offen / Politur
**Halle und Villa-Räume sind zu dunkel:** `villa_tagTick` setzt `hemi.intensity`, aber die Basis überschreibt die Hemisphäre offenbar nach den Takten (Nebel/Himmel greifen, die Hemisphäre drinnen nicht). Lösung braucht einen Haken in der Basis-Lichtzeile oder eigene Vorab-Lichter je Raum.
Blechmänner bei Tag schwarz statt weiß, ohne „ohne Kapuze“-Variante · Abspann noch ohne Kombi-Einstellung und Vegas' Decke (nicht 70 s), Traumlicht fehlt · Absperrband −4, durchwühlte Küche (Weg 3), Chip-Tausch im Nest, V-07/V-14 nicht gebaut · Glasfigur starr · Wolter-Konfrontation ohne Schnitte · Nr. 3 und Posten wirken noch leer.
Fehlende Assets (Rückfälle): Wandkacheln (Gehwegplatten), Metall-Aktenschrank (Anrichte-Scan), Asservatenkiste (Holz-Scan-Kiste), Kühlbox, grüne Schreibtischlampe, Tonbandgerät (Radio), Heizkörper, Sicherungskasten, Rollregale, Neonröhren, Stativ, Hund Bruno.

## Schnittstellen (für AP-20/21 und andere)
- `villa_S` (Spielstand 'villa'): `rooms`, `kuehl` (∴-1-Deckel offen), `zaehlbuch` ('echt'|'faelschung'|'ablehnen'), `grete` (Foto gesehen), `kanne`, `uk`, `f` (Schritte: lucy, ag11, ag12, nr9, da10, akte, sb08, nadel, kakten, ag13, entdeckt, strom, hoehepunktA, zelle, deckel, pling, ag14, w11, ring, noten …).
- `villa_hat(k)`, `villa_setz(k)`, `villa_geh(raum, {p:[x,z,yaw]})`, `villa_bauen(raum)`, `VILLA_R` (Raumgrenzen), `VILLA_TUER`.
- AP-20: Haushaltsbuch als Item `haushaltsbuch` → AG-12 bietet dann Weg 2 (Fälschung, Funk beim Verlassen des Archivs, −15); Teedose/Grete-Foto (N-08) minimal da (`villa_ogTeedose`, Album 'grete', −5 über AG-14); Weltkarte gibt Z-10.
