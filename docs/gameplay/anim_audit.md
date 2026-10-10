# Lebewesen-Audit Animation/Optik (Stand 10.10.2026)

Messung: `__MW.rec` (Kopf-Becken-Vektor gegen Bewegungsrichtung, Kopf-Yaw relativ zum Koerper je Bild, Umdrehungen, Spruenge), Foto-Kontaktbogen je Typ (Studio-Licht, Nebel/Regen aus).

| Typ | Rueckwaerts/Seitwaerts | Kopf (Umdrehungen/Max) | Flackern | Optik | Status |
|---|---|---|---|---|---|
| Whiskey (Rabe) | war 89 Grad seitwaerts, jetzt 0 Grad | 0,43 / Blick bis 180 (Hals) | - | Fluegel Federlagen ok, Koerper etwas flach | behoben (0bc12b4) |
| Kino-Rabe / Traum-Rabe | 0 Grad (nutzt Whiskey-Modell) | - | - | wie Whiskey | ok |
| Kraehen (Dorf) | 0 Grad im Flug | 0,4 | - | Gefieder grau/flach | ok, Optik mittel |
| Katzen | 0 Grad | war 2,4-3,2 U/6 s, jetzt 0,03 | - | Fell 3x dichter/feiner, Schwanz buschiger | behoben (9342fae, 1198499) |
| Fuchs/Reh/Hirsch/Wolf/Schwein | Walk 0-1 Grad, Run ~29 (Clip-Gierung) | 0 | - | UE-Modelle, gut | ok |
| Ratten | 1-2 Grad | 0,1 | - | ok | ok |
| Fledermaeuse | 8-9 Grad (vorher 81-99) | - | - | ok | behoben (d1be2f2) |
| Hund Bruno | absichtlich "falscher" Gang | Kopf-Overlay ohne Aufaddieren | - | ok | ok |
| Kreaturen-Kopf, Whiskey-Kiefer, Beobachter-Kopf | - | anim_ueber (kein Aufaddieren) | - | - | gehaertet (0bc12b4) |
| Menschen (Kinder, Erwachsene) | - | 0-0,09 | kein Flackern gemessen | Gesichter ok; amt1/amt2 stilisiert | ok |
| Justin | - | 0 | - | schwarze Helmschale ausgeblendet | behoben (642b63b) |
| Lucy im Tank | - | - | - | Arme verschraenkt, schwebt, atmet | behoben (642b63b) |

Offen/ungeprueft: Spinnen (6 Arten), Hungrige/"Das Ding", Welpe, Zombie, Raben-Fluegel-Optik (Federn flach), Schwanzbehaarung Katzen (weiter duenn), Fussgleiten (Clip-Tempo je Tier).
