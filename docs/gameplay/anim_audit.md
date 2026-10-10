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
