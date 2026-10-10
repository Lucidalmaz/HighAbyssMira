# Lebewesen-Audit Animation/Optik (Stand 10.10.2026, 2. Durchgang)

Messung: `__MW.rec` (Kopf-Becken-Vektor gegen Bewegungsrichtung, Kopf-Yaw relativ zum Koerper je Bild, Umdrehungen, Spruenge), Stuetzfuss-Schlupf-Messung je Tempo-Faktor, Foto-Kontaktboegen (Studio-Licht, Nebel/Regen aus). Werkzeuge: `C:\Users\GIGABYTE\_anim\` (go2.sh, studio.js, natv.js, catturn.js, spin.js, sp3.js, cpl.js).

| Typ | Rueckwaerts/Seitwaerts | Kopf (Umdr./Spruenge) | Flackern | Gleiten | Optik | Status |
|---|---|---|---|---|---|---|
| Whiskey (Rabe) | war 89 Grad seitwaerts -> 0 | Blick gemessen max 110 Grad (IdleLookAround) -> Kopf/Hals-Amplitude im Clip auf 62 % (~70 Grad); Ueberlagerung <= 54 Grad | - | - | Fluegel: Schwingen x1,26, Decken x1,2 verbreitert (194 Federn): dichter Faecher, Vorher/Nachher-Foto im Spiellicht (Fly vorn/seitlich, Glide) | behoben 0bc12b4 67cf7ce eb91565 |
| Kino-/Traum-Rabe | 0 Grad | - | - | - | wie Whiskey | ok |
| Kraehen | 0 Grad im Flug | 0,4 | - | - | Fluegelfedern verbreitert (120 Federn) | ok 67cf7ce |
| Katzen | 0 Grad | war 2,4-3,2 U/6 s -> 0,03 | - | Schritt auf der Stelle nur bei Koerperdrehung (gewollt) | Fell ~3x dichter/feiner, Schwanz buschig; Sitzpose im Foto natuerlich | behoben 9342fae 1198499 7fe26d2 |
| Fuchs/Reh/Hirsch/Wolf/Schwein | Walk 0-1 Grad; Run: Mittel der Koerpergierung -3..0 Grad, +-9 Grad = natuerliches Schaukeln (kein Defekt, Messung der 29 Grad war Bewegungs-Artefakt der Hueftknochen) | 0 | - | Clip-Tempo = Wegtempo (timeScale-Kopplung, gemessen: ts = v/(nat*Skala)) | UE-Modelle, im Foto gut | behoben 7fe26d2 |
| Welpe (Wolf .48) | wie Wolf | - | - | wie Wild | ok | ok |
| Hungrige (Tier-Modelle) | wie Wild (gleiche Modelle, Verdrehungen mit Basis-Quaternion, keine Aufaddierung) | - | - | wie Wild | gewollt entstellt | ok |
| Geschaelter Wolf / "Das Ding" | Blick +Z gemessen (0 Grad); Clip "flucht" laeuft absichtlich rueckwaerts (Rueckzug vor der Lampe) | Rastung 20 Grad gewollt, anim_ueber | - | speed aus Clip-Meta | gewollt | ok / bewusst |
| Spinnen (6 Arten) | Modell blickt -Z, Helden/Netz-Halter drehen korrekt (gemessen) | - | - | Stuetzfuss-Schlupf: winkel 6 %, kreuz 4 %, vogel 11 %, nosferatu 11 %; huntsman war 69 % -> Gang der Hauswinkelspinne 15-26 %, wolf war 67-71 % -> Gang der Kreuzspinne 9-24 % | Fotos huntsman/wolf/vogel ok | behoben eb91565 |
| Ratten | 1-2 Grad | 0,1 | - | - | ok | ok |
| Fledermaeuse | 8-9 Grad | - | - | - | ok | behoben d1be2f2 |
| Hund Bruno | absichtlich "falscher" Gang | ohne Aufaddieren | - | gewollt | ok | ok |
| Zombie (Kap. 2, zombie_p7) | im Bild: laeuft frontal auf die Kamera zu, Blickvektor (1,0) = Richtung zum Spieler (1,0) | Kopf-Blick auf Kamera (pz_look) | - | Clip run, timeScale 0,8 bei 2,3 m/s | Foto im Gang: aufrecht, Arme schwingen, geschaelte Haut ok; Griff-QTE ausgeloest ('Losreissen', 'Bruder'); Zustandskette fall -> nick -> burn laeuft fehlerfrei (Flammen im Bild nicht gesehen: Todes-Fade) | ok, Brennen nur Zustand belegt |
| Menschen | - | 0-0,09 | keins | Walk-timeScale = Tempo (figuren_loco) | Gesichter im Foto sauber (Kinder, Mira, Mama, Hilde, Gisela, Graukind); amt1: Hals ueberlappte Kragen/Krawatte (Wulst) -> Hals x0,82, Krawatte/Kragen frei (Foto); amt2 unveraendert (duenn, ok) | Mikro-Schicht neu (Gewichtsverlagerung, Kopfrauschen); amt1 behoben eb91565, kein Neu-Modellieren (Blender startet in dieser Umgebung nicht, Exit 0xC0E90002) |
| Justin | - | 0 | - | - | schwarze Helmschale ausgeblendet | behoben 642b63b |
| Lucy im Tank | - | - | - | - | Arme verschraenkt, schwebt, atmet | behoben 642b63b |

## 3. Durchgang (10.10.2026 abends) - Belege im Bild/Messung

Bilder: `docs/gameplay/fotos_1010/`. Messwerkzeuge: `C:/Users/GIGABYTE/_anim/` (flk_lib.js/flk_tour.js Flacker-Recorder, beastnat.js/gait.js Wild-Gangart, seam.js/pops.js Mocap-Naht und Ausreisser, cap_lib.js/seq_tpl.js Bewegungs-Kontaktboegen, mkrb.py Raben-Vergleich).

| Punkt | Messung / Bild | Ergebnis | Commit |
|---|---|---|---|
| Rabenfluegel (Whiskey, Kraehe) | Vorher (0ccf7e7) / Nachher (Endwerte 6fd1536) im Spiellicht: Fly vorn/seitlich/oben/unten, Glide, Sitz, Landung (`rabe_*_vorher_nachher.png`, `rabe_fluegel_detail.png`) | Fingerfedern an den Spitzen mit Aufbiegung, Faecher dichter, Gefieder dunkler/violetter; Spitzenaufbiegung im Frontalbild sichtbar | 6fd1536 (Modell), Belege hier |
| Flackern Geister/Echos/Menschen Kap. 2-6 | 8 s Ruhe + Tour zu 8 Figuren je Kapitel: Sichtbarkeits-Toggles/s je Figur/Geist/Auftritt + Staerke-Einbrueche | Sichtbarkeits-Toggles: 0 (alle Kapitel). Einbrueche der Geist-Staerke (Flimmern auf 0,5-0,7 fuer 60-140 ms): 14 je 8 s bei 9 Geistern, nachher 0 (weiches, flaches Atmen 0,86-0,94 ueber 220-400 ms, Intervall 6-14 s) | b9a09a0 |
| Amt-Figur 2 | Forge-Bilder + Spielbild (`amt2_neu.png`) | Spy-Cartoon (duenn, grob, Riesenhaende) durch Buerosachbearbeiter ersetzt (ow3-Koerper, MN-Kopf, Brille, dunkle Strickjacke, 70 k Dreiecke wie die anderen Erwachsenen) | 787b014 |
| Brennender Zombie Kap. 2 | Brandszene per Testhooks (Peter faellt, Oel, Feuerzeug, QTE-Autopilot): 6 Bilder (`zombie_brennt.png`) | Flammen am Koerper (Emitter an Wirbelsaeule/Armen/Beinen/Kopf) sichtbar, Verkohlung 0 bis 1 in 9 s, Flammenwand + Rauch; Zustandskette burn/escape laeuft | kein Mangel |
| Menschen-Animationen | Kontaktboegen idle/walk/talk/greifen/sit/alert fuer lucy_erw und zayn (`anim_*.png`); Mocap-Pruefung 4 Figuren x 62 Clips | Gehen/Stehen/Sitzen/Sprechen/Greifen ohne Spruenge sichtbar; Naht der Schleifen-Clips <= 1 Grad; zwei Einzelbild-Ausreisser (Unterarm 23-24 Grad: walk_vorsicht 1,4 s, hug 4,0 s) beim Laden geglaettet | 787b014 |
| Wild-Gleiten | `gait.js`: je Art und Tempo 0,4-9,5 m/s (Gangart, timeScale, Gleiten = v / (natuerliches Tempo x timeScale) - 1) | 0 % Gleiten bei allen Tempi (Fuchs 17 % erst bei 9,5 m/s, im Spiel nie erreicht); Ursache vorher: Walk-Clip bei Rueckzugs-/Fluchtbefehl mit 5,5 m/s (nur 2,3-faches Abspieltempo erlaubt), RunBite nicht gekoppelt, Gangart nur vom Modul gewaehlt | b9a09a0 |
| Fenster-Gestalten Kap. 1 (Nutzer) | `fenster_vorher_nachher.png`, `fenster_ereignis_3d.png` aus 2,2/3/6/12 m | flache Silhouette (Kopf mitten im Fenster, durch die Scheibe) ersetzt durch echten 3D-Koerper hinter dem Glas (Portal-Zeichnung), Brustung verdeckt den Rumpf, Atmen und Blick zur Kamera | 6edbc9b |
| Graues Gesicht (Nutzer) | Fernseher Nr. 7 ohne Portraet (Luke-Gedanke + Fibel `k1_tv_gesicht`), Tank-Gesicht/Rabenhals-Kopf/Nachbild-Leinwand/Netz-Overlay entfernt | keine flachen/eingeschnittenen Gesichter mehr | 83c1f17 |
| Soak | 90 s, 5 Tierarten mit wechselnden Tempi (Kap. 6) | Heap +16 MB, 0 Fehler/Warnungen | - |
