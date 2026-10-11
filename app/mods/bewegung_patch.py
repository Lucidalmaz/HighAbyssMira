# bewegung: Folgeauftrag 7 (Nutzer 10.10./11.10.) – Ducken mit Kollisionshöhe 0,9 m, Kriechen (0,65 m) durch Öffnungen ab 0,7 m,
# Hochziehen bis ~2,3 m (Sprung + Mantle in der Luft). Körperproben der Netz-Kollision folgen der Körperhöhe (sonst schiebt die Wand über dem Loch hinaus).
# Nur die genannten Zeilen der Basis werden ersetzt (assert je Ersatz); die Welt-Module tod.js/bewegung.js nutzen bodyProbes().

def _r(s, alt, neu, n=1):
    assert s.count(alt) == n, 'bewegung_patch: Stelle nicht gefunden (%d x): %s' % (s.count(alt), alt[:70])
    return s.replace(alt, neu)


def apply(s):
    # 1. Körperhöhe: Hocke 0,9 m, Kriechen 0,65 m; Körperproben (Kugeln r = R) folgen der Höhe
    s = _r(s, "let crouchK = 0, crouchZiel = false;\nconst bodyH = () => 1.7 - .55 * crouchK;",
           "let crouchK = 0, crouchZiel = false, crawlK = 0;\n"
           "const bodyH = () => 1.7 - .8 * crouchK - .25 * crawlK; // Stand 1,7 · Hocke 0,9 · Kriechen 0,65 (Öffnungen ab 0,7 m)\n"
           "const PROBES_STAND = [.62, 1.05, 1.5, 1.72]; // Knie, Hüfte, Brust, Kopf\n"
           "function bodyProbes() { const H = bodyH(); if (H >= 1.65) return PROBES_STAND; const t = H - .3; return t > .55 ? [Math.min(.45, t - .15), t] : [t]; } // Kugel r = R: Oberkante der obersten Probe = Körperhöhe")
    s = _r(s, "for (const h of [.62, 1.05, 1.5, 1.72]) { // Knie, Hüfte, Brust, Kopf (Kopf: nicht in Hängeschränke/Balken/Dachschrägen laufen)",
           "for (const h of bodyProbes()) { // Knie, Hüfte, Brust, Kopf (Kopf: nicht in Hängeschränke/Balken/Dachschrägen laufen); geduckt/kriechend: niedriger")
    # 2. Tempo: Kriechen noch langsamer
    s = _r(s, "(f < 0 ? FC.back : 1) * (1 - .5 * crouchK), len = Math.hypot(f, s);",
           "(f < 0 ? FC.back : 1) * (1 - .5 * crouchK - .3 * crawlK), len = Math.hypot(f, s);")
    # 3. Kriech-Zustand: bei Hocke und niedriger Decke voraus (< 0,9 m) tiefer; erst bei >= 0,97 m wieder Hocke
    s = _r(s, "crouchK += (tgt - crouchK) * Math.min(1, dt * (tgt ? 9 : 7)); if (crouchK < .002) crouchK = 0; }\n",
           "crouchK += (tgt - crouchK) * Math.min(1, dt * (tgt ? 9 : 7)); if (crouchK < .002) crouchK = 0;\n"
           "      { let tc = 0; if (crouchK > .6 && grounded && !mantle && !scripted) { const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); let cl = Infinity;\n"
           "          for (const d of [0, .3, .6]) cl = Math.min(cl, headCeiling(player.pos.x + fx * d, player.pos.y + .2, player.pos.z + fz * d) - player.pos.y);\n"
           "          tc = cl < (crawlK > .5 ? 1.0 : .96) ? 1 : 0; }\n"
           "        crawlK += (tc - crawlK) * Math.min(1, dt * 8); if (crawlK < .002) crawlK = 0; } }\n")
    s = _r(s, "const eye = gy + 1.65 - .62 * crouchK;", "const eye = gy + 1.65 - .8 * crouchK - .3 * crawlK;")
    # 4. Hochziehen in der Luft bis ~2,3 m: Sprungscheitel ~1,0 m + Hochziehen 1,45 m
    s = _r(s, "if (m && m.top - player.pos.y < 1.2) mantleStart(m);", "if (m && m.top - player.pos.y < 1.45) mantleStart(m);")
    # 5. Kanten: Standfläche nur noch r = 0,45·R (13,5 cm) statt 0,7·R (21 cm) um die Körpermitte – wer mit dem Schwerpunkt über der Kante ist, steht, sonst rutscht er ab (vorher schwebte man 21 cm über der Leere)
    s = _r(s, "let g = base; const px = player.pos.x, pz = player.pos.z, r = R * .7;", "let g = base; const px = player.pos.x, pz = player.pos.z, r = R * .45;")
    return s
