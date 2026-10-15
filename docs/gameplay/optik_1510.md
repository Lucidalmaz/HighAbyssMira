# Optik 15.10.2026 („Schaerfe und Detailreichtum“)

Rechner exklusiv, Dauerinstanz normal1 (1584 x 861, Pixelratio 1). Vergleiche im selben Spiel per `?aniso=1` / `?aniso=8` (Neuladen der Seite, gleiche Schritte `b2.json`), GPU-Zeit per Timer-Query um `composer.render` (6 s je Punkt). Werkzeuge ausserhalb des Repos: `C:\Users\GIGABYTE\_opt\`.

## Diagnose (was schon gut war)
* MSAA 4x im Composer-Ziel (HalfFloat), Pixelratio min(devicePixelRatio, 1.5), Nachschaerfen im Film-Pass (vorhanden, Voreinstellung 0,25/0,35, begrenzt auf +-0,05), Bloom nur ab Schwelle 1,5, Fog FogExp2 0,034 (Nachtszenen).
* Mip-Fenster (vram.js): schneidet nur Stufen, die bei Texeldichte < 1 500 px/m nie sichtbar sind (maximal 2). Kein Befund; bei 880 px/m (1 m Abstand) kein sichtbarer Verlust.
* **Befund Anisotropie**: 782 von ca. 1 718 Material-Texturen (Farbe/Normal/Rauheit/Metall/AO) haben `anisotropy = 1` (GLB-/KTX-Modelltexturen, Moebel, Tueren, Fahrzeuge, Bodenbelaege; nur Canvas-/Handlader-Texturen und Figuren setzten 4-8). Schraege Boeden/Waende (Teppichmuster, Tapete) verschmieren.

## Tabelle
| Ort | Befund | Ursache | Aenderung | Messung vorher -> nachher | Bilder vorher / nachher | Note |
|---|---|---|---|---|---|---|
| Nr. 7 innen (Nebenraum, Teppich, Tapete, Sofa) | schraege Flaechen verschmiert, Muster nicht erkennbar | 782 Texturen mit Anisotropie 1 | `vram.js` (`vram_diet`, laeuft vor dem Hochladen): jede Material-Textur (nicht Canvas/Renderziel) mit Anisotropie < 8 auf min(8, Max) setzen; Schalter `?aniso=N` (1 = aus), Zaehler `__vram.anN/aniso` | GPU-Zeit (Timer-Query, Mittel/p95): Kreuzung 18,44/33,6 -> 18,69/34,2 ms; Nr. 7 11,38/15,7 -> 11,58/14,9 ms; Strasse 15,91/19,7 -> 16,14/22,1 ms (Rauschen, ca. +0,2 ms); Texturen (renderer.info) 4108 -> 3930; Grafikspeicher gesamt 3310 -> 3234 MiB; Konsolenfehler 0, `__stream.nFix` 0 | `fotos_1510/optik_aniso_nr7_vergleich.png`, `optik_aniso_sofa_vergleich.png` (oben aniso=1, unten 8) | 3 -> 2 (Muster am Teppich/Tapete erkennbar, Sofa-Stoff schaerfer) |
| Strasse/Nr. 7 | Nachschaerfen staerker (sharp 0,35 -> 1,0) | – | **verworfen**: Wirkung bei Nachtnebel/Regen kaum sichtbar (Korrektur auf +-0,05 begrenzt), Korn wird stoerender | – | `optik_schaerfe_*_035_vs_100.png` | unveraendert |
| Zusatz-Filter / Extra-Pass | Idee „Filter drauf“ | – | nicht umgesetzt: CAS/Unsharp steckt schon im Film-Pass, kein Gewinn messbar | – | – | – |

## Nicht geprueft / offen (ehrlich)
* Gesichter/Haut/Haar nah (2-3 m): der Testlauf fand die Figur bei (67, 0, 5) nicht im Bild (geparkt/nicht sichtbar); keine belastbare Nahaufnahme. Figuren setzten Anisotropie schon selbst (figuren.js, 8).
* Kapelle, Keller, Inventar-3D, Fahrzeuge nah, Z-Fighting/Banding-Suche: wegen Zeitbudget nicht untersucht.
* Pixelratio/Render-Skalierung: Test-Fenster 1584 x 861 mit Pixelratio 1; auf einem hochaufloesenden Bildschirm (Pixelratio 1,5) ist das Bild schaerfer, nicht gemessen.
* Das GPU-Budget (Kreuzung ca. 18 ms Mittel, p95 34 ms) ist knapp: weitere Pixel-/Filterkosten (hoeheres Pixelratio, Extra-Passes) sind nicht ohne Leistungsverlust moeglich.
