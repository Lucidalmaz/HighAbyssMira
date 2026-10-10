# Item-Katalog (10.10.2026) – Modellzuordnung des Inventars

Quelle der Schlüssel: Laufzeit-`ITEMS` plus statische Suche (`modItem`, `addItem`, `story.items.push`, `includes`) in `app/mods/*`. Zuordnung im Modul `app/mods/inventar3d.js` (`INV3D_ITEM`, `INV3D_MODELLE`, `INV3D_REGELN`).

Darstellung: Fibel → INVENTAR zeigt je Gegenstand ein aus dem 3D-Modell gerendertes Symbol; Detail mit frei drehbarem/zoombarem Modell (Offscreen-Pass im Hauptrenderer, nur bei offener Fibel). Beim Aufnehmen: eigene Darstellung (Gegenstand dreht sich groß vor dem Bild, „AUFGENOMMEN“, Ton), anders als in der Welt.

Leistungsgrenzen: Modelle ≤ 20 000 Dreiecke, Texturen ≤ 1024 px (verschlankt mit `tools/item_opt.mjs`; Originale 4k/158k Dreiecke bleiben für die Welt).

Gesamt: 95 Schlüssel, davon mit Modell: 95.

| Kategorie | Schlüssel | Name | Modell-Id | Verzeichnis | Quelle/Lizenz | Status |
|---|---|---|---|---|---|---|
| Erinnerung | boerek | Börek | brot | w_brot | vorhandenes Spielmodell (assets/ms) | Modell |
| Erinnerung | brot | Brot | brot | w_brot | vorhandenes Spielmodell (assets/ms) | Modell |
| Erinnerung | cleo_dose | Keksdose mit acht Kronkorken | blechdose | ph_oil_tin | Poly Haven CC0 | Modell |
| Erinnerung | collar | Brunos Halsband | halsband | it_halsband | Blender-Eigenbau (item_bau.py) | Modell |
| Erinnerung | euro_bruno | Eine Euromünze | muenze | it_muenze | Blender-Eigenbau (item_bau.py) | Modell |
| Erinnerung | futterdose | Katzenfutterdose | dose | ph_can_rusted | Poly Haven CC0 | Modell |
| Erinnerung | kronkorken | Kronkorken | kronkorken | it_kronkorken | Blender-Eigenbau (item_bau.py) | Modell |
| Erinnerung | lucys_spieluhr | Lucys Spieluhr | spieluhr | w_spieluhr | vorhandenes Spielmodell (assets/ms) | Modell |
| Erinnerung | miras_ring | Miras Ring | ring | it_ring | Blender-Eigenbau (item_bau.py) | Modell |
| Erinnerung | murmel | Milchweiße Murmel | murmel | it_murmel | Blender-Eigenbau (item_bau.py) | Modell |
| Erinnerung | n3_schuh | Kinderschuh, rechts | schuh | it_schuh | Blender-Eigenbau (item_bau.py) | Modell |
| Erinnerung | pfandflasche | Pfandflasche | flasche | it_flasche | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Erinnerung | teddy | Teddy | teddy | it_teddy | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Erinnerung | thermos_bfr | Günthers Thermoskanne | thermos | w_thermos | vorhandenes Spielmodell (assets/ms) | Modell |
| Erinnerung | thermoskanne | Thermoskanne | thermos | w_thermos | vorhandenes Spielmodell (assets/ms) | Modell |
| Licht & Gerät | batterie | Batterien × 1 | batterie | ../ue/batterie | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Licht & Gerät | feuerzeug | Peters Feuerzeug | feuerzeug | w_lighter | vorhandenes Spielmodell (assets/ms) | Modell |
| Licht & Gerät | geh_lichtstein | Ein Lichtstein | lichtstein | it_lichtstein | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Licht & Gerät | lampe1 | Lucys alte Taschenlampe | lampe1 | it_lampe1 | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Licht & Gerät | lampe2 | Stablampe (LED) | lampe2 | ../ue/lampe2 | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Licht & Gerät | lampe3 | Feuerwehr-Handscheinwerfer | lampe3 | it_lampe3 | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Licht & Gerät | lampion | Annis Lampion | lampion | w_papierlaterne | vorhandenes Spielmodell (assets/ms) | Modell |
| Licht & Gerät | leiter_amt | Leiter | leiter | ../ue/leiter | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Licht & Gerät | mamas_kerze |  | kerze | candles | vorhandenes Spielmodell (assets/ms) | Modell |
| Papier & Akten | brief_edda | Edda Brands Brief | brief | it_brief | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | buch | Hildes Zählbuch | buch | w_buch | vorhandenes Spielmodell (assets/ms) | Modell |
| Papier & Akten | da10 | DA 10 | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | dina_zeichnung | Dinas Zeichnung | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | einwilligungen | Einwilligungen 2009 | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | fibel | Abenteuerfibel | buch | w_buch | vorhandenes Spielmodell (assets/ms) | Modell |
| Papier & Akten | haushaltsbuch | Oma Ernas Haushaltsbuch | buch | w_buch | vorhandenes Spielmodell (assets/ms) | Modell |
| Papier & Akten | heidi_karte | Heidis Postkarte | postkarte | it_postkarte | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Papier & Akten | heidis_karten | Heidis Karten | postkarte | it_postkarte | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Papier & Akten | hildes_antworten | Hildes Antworten | notizblock | it_notizblock | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Papier & Akten | jonas_karte | Jonas’ Karte | postkarte | it_postkarte | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Papier & Akten | kaugummipapier | Kaugummipapier | folie | it_folie | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | n3_lieferschein | Lieferschein | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | n3_ordner | Vegas’ Ordner | ordner | it_ordner | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Papier & Akten | nord_fahrkarte | Fahrkarte | fahrkarte | it_fahrkarte | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | ow_seiten |  | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | predigtmappe | Predigtmappe | ordner | it_ordner | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Papier & Akten | rechnung_durchschlag | Durchschlag der Steinmetzrechnung | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | rechnung_kuehnle | Rechnung Kühnle | zettel | it_blatt | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | umschlag7 | Brauner Umschlag | umschlag | it_umschlag | Blender-Eigenbau (item_bau.py) | Modell |
| Papier & Akten | wartenummer | Wartenummer 8 | fahrkarte | it_fahrkarte | Blender-Eigenbau (item_bau.py) | Modell |
| Schlüssel | autoschluessel | Autoschlüssel | autoschluessel | it_autoschluessel | Blender-Eigenbau (item_bau.py) | Modell |
| Schlüssel | baumhausschluessel | Kleiner Messingschlüssel | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | fuse | Schlüssel Sicherungsraum | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | key | Schlüssel zu Nr. 7 | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | n3_kapschluessel | Kapellenschlüssel | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | n3_pfarrschluessel | Pfarrhausschlüssel | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | plombe | Plombe aus Blech | plombe | it_plombe | Blender-Eigenbau (item_bau.py) | Modell |
| Schlüssel | ring_hufeisen | Schlüsselring mit Hufeisen | hufeisen | hufeisen | vorhandenes Spielmodell (assets/ms) | Modell |
| Schlüssel | schluesselteile | Schlüsselteile | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | spindschluessel | Schlüsselbund „3“ | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | villaschluessel | Schlüssel der Villa Seiler | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Schlüssel | zimmer7 | Schlüssel „ZIMMER 7“ | schluessel | ../ue/schluesselteil | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Sonstiges | alufolie | Alufolie | folie | it_folie | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | alupaeckchen | Päckchen in Alufolie | folie | it_folie | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | dienstnadel | Seilers Dienstnadel | dienstnadel | it_dienstnadel | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | kf_grinder | Grinder | grinder | it_grinder | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | kf_knolle | Knolle | knolle | it_knolle | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | kf_papes | Blättchen | papes | it_papes | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | kf_tips | Pappdeckel | tips | it_tips | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | lesebrille | Lesebrille | brille | it_brille | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Sonstiges | lucy_zigaretten | Lucys Zigaretten | zigaretten | it_zigaretten | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Sonstiges | nord_baer |  | teddy | it_teddy | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Sonstiges | nord_lantern |  | laterne | lantern1 | vorhandenes Spielmodell (assets/ms) | Modell |
| Sonstiges | ranzenriemen | Ranzenriemen | riemen | it_riemen | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | riegel_halb | Halber Riegel | riegel | it_riegel | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | schnalle_turm | Schnalle vom Turm | schnalle | it_schnalle | Blender-Eigenbau (item_bau.py) | Modell |
| Sonstiges | sicherung | Keramiksicherung | sicherung | it_sicherung | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | bergungsfunk | Funkgerät der Bergung | funk | it_funk | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | fotoalbum | Fotoalbum | album | it_album | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | heino | Heino-Kassette | kassette | it_kassette | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | n3_kassette_band | Kassette „Außenkamera“ | kassette | it_kassette | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | n3_kassette_peter | Kassette „Peter“ | kassette | it_kassette | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | pell_kassette | Kassette „Come home, W.“ | kassette | it_kassette | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | phone | Lucys Handy | handy | it_handy | Blender-Eigenbau (item_bau.py) | Modell |
| Ton & Foto | polaroid_heini | Polaroid Heini | polaroid | it_polaroid | Blender-Eigenbau (item_bau.py) | Modell |
| Ton & Foto | polaroid_kamera |  | kamera | w_kamera | vorhandenes Spielmodell (assets/ms) | Modell |
| Ton & Foto | sender | Grauer Kasten | funk | it_funk | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | tape | Lucys Tonband | rekorder | it_rekorder | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Ton & Foto | tonband_ast | Tonband · Kanal 3 | tonbandgeraet | ph_cassette_player | Poly Haven CC0 | Modell |
| Ton & Foto | zayn_kamera | Zayns Kinderkamera | kamera | w_kamera | vorhandenes Spielmodell (assets/ms) | Modell |
| Ton & Foto | zayn_kassette | Kassette „FÜR JONAS UND LUKE“ | kassette | it_kassette | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Werkzeug | brecheisen | Ein Brecheisen | brechstange | ../ue/brechstange | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Werkzeug | brechstange | Brechstange | brechstange | ../ue/brechstange | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Werkzeug | cleo_kreide | Weiße Kreide | kreide | it_kreide | Blender-Eigenbau (item_bau.py) | Modell |
| Werkzeug | drahtschneider | Drahtschneider | drahtschneider | ../ue/drahtschneider | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Werkzeug | jonas_messer | Jonas’ Taschenmesser | messer | messer | vorhandenes Spielmodell (assets/ms) | Modell |
| Werkzeug | lwo_kuli | Kugelschreiber mit Auge | kuli | it_kuli | vorhandenes Modell, verschlankt (item_opt.mjs) | Modell |
| Werkzeug | n3_brecheisen | Brecheisen | brechstange | ../ue/brechstange | UE-Import (Fab), Werkstoffe im Modul | Modell |
| Werkzeug | n3_glocke | Die Glocke | glocke | it_glocke | Blender-Eigenbau (item_bau.py) | Modell |
| Werkzeug | seitenschneider | Seitenschneider | zange | ph_pliers | Poly Haven CC0 | Modell |

## Weltmodelle und Kennzeichnung

- Welt: die Aufnahme-Objekte der Kapitel bleiben (jedes Kapitel baut seine Fundstücke selbst); Kennzeichnung nach `hervorhebung.js` (Kategorie `sammel` = Jadegrün, `wichtig` = Gold bei Schlüsseln/Sicherung/Brechstange/…, `glanz` = Kupfer für Glänzendes), Rand dezent, nie Neon.
- Neue Weltdarstellung der Inventar-Modelle (statt Kisten/Zeichnungen am Boden) ist **nicht** flächendeckend umgesetzt: nur dort, wo ein Kapitel das Modell ohnehin lädt (Batterie, Brechstange, Schlüsselteil, Laterne, Kerzen, Feuerzeug, Kamera, Album, Buch, Hufeisen …).

## Offen

- Fab-Downloads waren in der Browser-Pane nicht freigegeben (Navigation zu fab.com verweigert); stattdessen Poly Haven (CC0, API ohne Anmeldung) und Blender-Eigenbau.
- Weltmodelle je Fundstelle (Phase 2): pro Kapitel Fundstücke auf `it_*`-Modelle umstellen, inkl. Liegeausrichtung.

## Weltmodelle (Stand 10.10.2026 abends) - Modul `weltitems.js`

Regelbasiert (`WELT_REGELN`: Beschriftung der Klickflaeche, Gegenstand/Modell, laengste Kante in m, Lage `lie`/`stand`/`hang`). Bei Annaeherung (<= 30 m) entsteht das Modell an der Klickflaeche: stabilste Lage (kleinste Hoehe), Auflage per `solidGround`, deterministische Drehung, Klickbox auf Modellgroesse + Rand zugeschnitten, alte Platzhalter-Platten aus der Anzeige genommen (Ebene 7; ihr Sichtbarkeitszustand steuert das Modell), Kennzeichnung ueber `userData.hlObj` (hervorhebung.js).

Gesehen im Spiel (Bild `weltitems.png`): Fahrkarte, Postkarten, Polaroid/Foto, Laterne (liegend), Batterien (3), Funkgeraet, Akten (7), Zettel, Leiter; Kapitel 6: Heftseiten, Murmel, Kreide, Pfandflasche (erscheinen, sobald die Klickflaeche aktiv ist).
Behaelter-Funde (Briefkasten, Handschuhfach, Schublade, Aktenschrank): kein Weltmodell, das Modell zeigt die Aufheben-Darstellung beim Herausnehmen.
Bereits echte Weltmodelle der Kapitel bleiben (Teddy, Brecheisen, Kerze, Feuerzeug, Halsband/Handy per inventar3d).

Neue/ueberarbeitete Modelle (Blender, `app/tools/blender/item_bau.py`, Vorschau `modelle_blender_*.png`): Murmel (Glaskugel mit milchigem Kern und Farbspiralen), Kinderschuh (Klettverschluss-Sneaker: Textil, Zwischen-/Laufsohle mit Profil, Zehenkappe, Kragenpolster, Klettriemen, Schlaufe), Lampion (Harmonika-Papierlaterne, rot, Holzkappen, Drahtbuegel), Zettel/Brief/Umschlag (Woelbung, Knickfalte, aufgebogene Ecke, Lagen), Aktenmappe (2,2 cm), Rucksack.

Ketten-/Inventarpruefung (Laufzeit): alle 95 Schluessel haben Modell + Symbol (0 Fehler); Aufheben-Darstellung + Speichern/Laden (Fundorte, Items) fuer 8 Stichproben ok; reale Aufnahme per Taste E (Erreichbarkeit per Strahl): collar, nord_baer, ow_seiten, drahtschneider, ow_streich, lucy_zigaretten, heino, brechstange, sicherung, schluesselteile (Stuhl 8), fuse (Haken), leiter_amt ok; in der Probe nicht aufgenommen: Polaroid im Auto (der Strahl trifft zuerst Tuer/Nachbild-Ausloeser), wartenummer (Bedingung), Sand/Regal/Jonas' Lager (Kapitel-Zustand noetig).
