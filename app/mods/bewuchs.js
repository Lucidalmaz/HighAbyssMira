// =====================================================================  BEWUCHS (Modul „bewuchs“, R-11): Außenwelt und Wald dichter, lebendiger – jede Pflanze mit Grund
// Nutzer 01.10.2026: „mehr pflanzen und natürliche umgebungs elemente … viele stellen wirken noch sehr leer … der wald kann deutlich mehr wald elemente und bäume vertragen“.
// ORT (Kap. 1–5, beim Laden): Unkraut im Rinnstein, in Pflasterfugen, am Mauer- und Zaunfuß und im Mittelstreifen alter Kieseinfahrten · Trockengras an Weg-, Zaun- und
//   Mauerrändern · Farne an schattigen Nordwänden und in feuchten Ecken · Efeu an Mauern, Schuppen und Hausecken (verlassene Häuser bis zur Traufe), auf Gräbern und am
//   Boden verwilderter Gärten, Ranken an Zäunen · Büsche an Hausecken · nasses Laub in Windecken · Pilze in feuchten Winkeln · Moos auf Treppenstufen · Stümpfe gefällter Bäume.
//   Gründe: Vernachlässigung (BEWUCHS_VERWAHRLOST), Feuchte/Schatten (Nordseite, Ecken, Waldnähe), Jahreszeit (Oktober/November: Farne bräunen, Gras ist trocken, Laub liegt).
// WALD (Kap. 6, erst wenn der Wald frei ist – lädt dann nach): mehr Bäume in mehreren Größen (Jungwuchs, Kiefern, Laubbäume, tote Stämme stehend und liegend),
//   Farnkolonien, Himbeer-/Holunderdickicht, Stümpfe, Pilze, Laub an den Wegrändern, Felsen, Mondlicht durch Lücken im Kronendach (nur über Lichtung, Steinkreis, Weiher).
//   Wege (WALD_PATHS, TIEF_PATHS, Lukes Weg, Kinderspur), Story-Orte (wald_free/tief_free) und die Jagdflächen (Bus-Falle, Fraßstelle, Wrack, Bau) bleiben frei und lesbar.
// Technik: je Art EIN Satz Instanzen über gruen_lodSet (nah Scan-Detailstufe → fern Bildkarte → weg, Sichtkegel; gruen.js führt ihn nach), Wind und Ausweichen vor Luke
//   über den gemeinsamen Windzustand (gruen_wind/windVert, R-7). Efeu an Wänden erst nach dem Kollisionsaufbau (Wände per Strahl gesucht: Höhe, Lage, Ausrichtung).
//   Kollision: Bäume/Stümpfe/liegende Stämme als schmale Kisten (addCol), Büsche weich (gruen_softAdd). Scans: Megascans (Fab), siehe CREDITS.md.
// Schnittstelle: bewuchs_S.stats (Zahlen je Satz), __bewuchs am window (Testzugriff).
const bewuchs_S = { ready: false, sets: {}, stats: {}, wand: [], wandDone: false, wald: 0, waldSets: [], strahlen: [], t: 0, keep: null };
// Orte, an denen niemand mehr pflegt: [x, z, Radius, Stärke, Grund]
const BEWUCHS_VERWAHRLOST = [[50, -17, 10, .55, 'Nr. 9, vernagelt'], [-50, -17, 10, .5, 'Nr. 1, leer'], [-45, 76, 24, .45, 'Friedhof'], [-115, 25, 32, .55, 'Schrebergärten'],
  [-128, -24, 26, .45, 'Hof'], [-116, 62, 24, .65, 'die alte Villa'], [112, 32, 18, .5, 'Tankstelle'], [117, -21, 22, .6, 'Schrottplatz'], [31, 76, 13, .3, 'Spielplatz'],
  [0, -46, 10, .5, 'Straßensperre Süd'], [146, 7, 12, .45, 'Sperre Ost'], [0, 60, 50, .12, 'Kirchberg']];
function bewuchs_neglect(x, z) { let k = 0; for (const [a, b, r, f] of BEWUCHS_VERWAHRLOST) { const d = Math.hypot(x - a, z - b); if (d < r) k = Math.max(k, f * (1 - .5 * d / r)); } return k; }
// kleine Raster für Abstandsprüfungen (Story-Punkte, Stämme)
function bewuchs_grid(cs) { const m = new Map(); return { add(x, z, v = 1) { const k = Math.floor(x / cs) * 4096 + Math.floor(z / cs); let L = m.get(k); if (!L) m.set(k, L = []); L.push([x, z, v]); },
  near(x, z, r) { const i0 = Math.floor((x - r) / cs), i1 = Math.floor((x + r) / cs), j0 = Math.floor((z - r) / cs), j1 = Math.floor((z + r) / cs);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const L = m.get(i * 4096 + j); if (L) for (const [a, b] of L) if ((a - x) ** 2 + (b - z) ** 2 < r * r) return true; } return false; } }; }
const bewuchs_lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
// Wind für Wand-Efeu: kaum Ausschlag, Blätter zittern, kein Ausweichen (klebt an der Wand)
function bewuchs_windWand(mat) { mat.onBeforeCompile = sh => windVert(sh, 'max(position.y, 0.) * max(position.y, 0.) * .004', '.12', 0); mat.customProgramCacheKey = () => 'bewuchsWand'; mat.needsUpdate = true; return mat; }

// Megascans-Pflanze → Varianten für gruen_lodSet: [variante][stufe] = [{geo, mat}]. card = Stufe, die als Kreuzkarte gebaut wird; flatCard = flache Karte so lassen.
// prep(geo) formt jede Stufe um (z. B. an die Wand gedreht). Materialien getönt (Nacht), Wind wie die übrigen Pflanzen (ein Programm).
async function bewuchs_pflanze(key, id, vars, lods, rgb, wind, { card = -1, prep = null, wand = false } = {}) {
  const nm = (c, l) => `SM_${id}_Var${c}${l ? '_LOD' + l : ''}`, P = await gruen_bake(key, vars.split('').flatMap(c => lods.map(l => nm(c, l))));
  const mats = new Map(), mat = m => { if (!mats.has(m)) { const c = m.clone(); c.color.setRGB(...rgb); c.envMapIntensity = .3; c.side = THREE.DoubleSide;
    if (/Billboard/.test(c.name)) { c.normalMap = null; c.alphaTest = .45; } if (wand) bewuchs_windWand(c); else gruen_wind(c, wind); mats.set(m, c); } return mats.get(m); };
  const out = [];
  for (const c of vars) { const L = [];
    for (const l of lods) { const p = P[nm(c, l)]; if (!p) { L.length = 0; break; }
      let g = p.geo; if (!g.attributes.normal) g.computeVertexNormals(); if (prep) g = prep(g); g.computeBoundingBox(); g.translate(0, -g.boundingBox.min.y, 0); g.computeBoundingBox(); g.computeBoundingSphere();
      const q = { geo: g, mat: mat(p.mat) }; L.push([l === card ? gruen_card(q) : q]); }
    if (L.length) out.push(L); }
  return out; }
// Einfache Scans (eine Stufe, ganze Szene): Teile auf Fußpunkt (each: jedes Teil für sich, z. B. einzelne Pilze), flat: dünnste Achse nach oben, prep: eigene Umformung
async function bewuchs_scan(key, file, { prep = null, flat = false, each = false, dark = 1, wind = 0 } = {}) {
  const P = await msBake(key, file), bb = new THREE.Box3();
  if (flat) { for (const p of P) { p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); } const s = bb.getSize(new THREE.Vector3()), M = new THREE.Matrix4();
    if (s.x < s.y && s.x < s.z) M.makeRotationZ(Math.PI / 2); else if (s.z < s.y) M.makeRotationX(-Math.PI / 2); for (const p of P) p.geo.applyMatrix4(M); bb.makeEmpty(); }
  for (const p of P) { if (prep) p.geo = prep(p.geo); p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); }
  const mats = new Map();
  return P.map(p => { const b = each ? p.geo.boundingBox : bb, c = b.getCenter(new THREE.Vector3()); p.geo.translate(-c.x, -b.min.y, -c.z); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere();
    if (!mats.has(p.mat)) { const m = p.mat.clone(); if (m.color) m.color.multiplyScalar(dark); m.envMapIntensity = .3; if (wind) gruen_wind(m, wind); mats.set(p.mat, m); }
    const B = each ? p.geo.boundingBox : bb; return { geo: p.geo, mat: mats.get(p.mat), h: B.max.y - B.min.y, w: Math.max(B.max.x - B.min.x, B.max.z - B.min.z) }; }); }
// Satz anlegen/merken; neu bauen (Instanzzahl ändert sich) – alte Instanzen freigeben
function bewuchs_set(name, variants, o) { if (!variants || !variants.length) return null; const S = gruen_lodSet(name, variants, o); bewuchs_S.sets[name] = S; return S; }
function bewuchs_bau(S) { if (!S) return; S.meshes.flat(2).forEach(im => { im.removeFromParent(); im.dispose(); }); gruen_lodBuild(S); }
const bewuchs_add = (S, x, y, z, ry, s, sy, tilt, col, v = -1) => S && gruen_lodAdd(S, v >= 0 ? v : Math.floor(Math.random() * S.variants.length), x, y, z, ry, s, sy ?? s, tilt, col);

// Story-Punkte, Zeichen und Hinweise: dort nichts Hohes hin (Sichtbarkeit) – eigene Liste je Bau, die Lage kann sich je Kapitel ändern
function bewuchs_keepOut() {
  const G = bewuchs_grid(4), v = new THREE.Vector3();
  for (const m of interactables) { try { m.updateWorldMatrix(true, false); v.setFromMatrixPosition(m.matrixWorld); G.add(v.x, v.z); } catch (e) {} }
  if (typeof ZEICHEN_TAB !== 'undefined') for (const Z of ZEICHEN_TAB) { const p = Z.ray || Z.such || Z.boden; if (p) G.add(p[0], Z.boden ? p[1] : p[2]); }
  if (typeof ZEICHEN_WAND !== 'undefined') for (let k = -1; k <= 1; k++) G.add(ZEICHEN_WAND.x + k * ZEICHEN_WAND.w / 2.5, ZEICHEN_WAND.z);
  if (typeof HINTS !== 'undefined') for (const h of HINTS) if (h.x !== undefined) G.add(h.x, h.z);
  return G; }

// =====================================================================  ORT (Kapitel 1–5)
WORLD_MODS.push(['Bewuchs', async () => {
  if (typeof gruen_S === 'undefined' || !gruen_S.api) return; const T0 = performance.now(), S = bewuchs_S, PI2 = Math.PI * 2;
  window.__bewuchs = { S, wand: () => bewuchs_wandBau(), wald: () => bewuchs_wald() }; // Testzugriff
  // --- Modelle: neue Megascans (Unkraut, Trockengras, Farne, Efeu, Pilze) + vorhandene Scans (Laub, Moos, faulender Stumpf)
  const wandPrep = g => { g = g.clone().rotateX(Math.PI / 2); g.computeBoundingBox(); const b = g.boundingBox; return g.translate(-(b.min.x + b.max.x) / 2, 0, -b.min.z); }; // Blätter zeigen nach +z, Rücken an der Wand
  const load = (f, ...a) => f(...a).catch(e => { console.warn('Bewuchs: ' + a[0], e); return []; });
  const [UK, TG, LF, BF, EF, EW, RK, PZ, ST, LB, MO] = await Promise.all([
    load(bewuchs_pflanze, 'weeds', 'ujzjfexja', 'BDHK', [0, 1], [.52, .54, .42], .05),
    load(bewuchs_pflanze, 'drygrass', 'tbbqejqr', 'ACD', [0, 1, 2], [.6, .57, .46], .14, { card: 2 }),
    load(bewuchs_pflanze, 'ladyfern', 'wdvlditia', 'AGI', [1, 2], [.46, .48, .36], .07, { card: 2 }),
    load(bewuchs_pflanze, 'beechfern', 'vmkpdbeia', 'DGH', [1, 2, 3], [.46, .48, .36], .07, { card: 3 }),
    load(bewuchs_pflanze, 'ivy_ms', 'xfcnebhqx', 'AF', [1, 2, 3], [.42, .46, .38], .02),                                   // Bodendecker (flache Karte bleibt flach)
    load(bewuchs_pflanze, 'ivy_ms', 'xfcnebhqx', 'AE', [1, 2, 3], [.4, .44, .36], 0, { prep: wandPrep, wand: true }),          // an der Wand
    load(bewuchs_pflanze, 'ivy_ms', 'xfcnebhqx', 'CD', [1, 2], [.4, .44, .36], .012),                                       // Ranken (Zaun, Pfosten)
    load(bewuchs_scan, 'bolete', 'model.gltf', { dark: .8, each: true }), load(bewuchs_scan, 'w_stumprot', 'model.glb', { dark: 1 }),
    load(bewuchs_scan, 'w_leftleaves', 'model.glb', { dark: 1 }), load(bewuchs_scan, 'w_mosspatch', 'model.glb', { dark: 1, flat: true })]);
  // Pilze: jedes Teil ist ein eigener Pilz → Varianten; Laub/Moos/Stumpf: eine Variante aus allen Teilen
  const one = P => P.length ? [[P.map(p => ({ geo: p.geo, mat: p.mat }))]] : [], pilzV = PZ.map(p => [[{ geo: p.geo, mat: p.mat }]]);
  const sets = {
    uk: bewuchs_set('bw_unkraut', UK, { d: [5, 17] }), tg: bewuchs_set('bw_trockengras', TG, { d: [6, 20, 40], thin: 28 }),
    lf: bewuchs_set('bw_frauenfarn', LF, { d: [14, 36], shadow: [true, false] }), bf: bewuchs_set('bw_buchenfarn', BF, { d: [9, 20, 32], thin: 24 }),
    ef: bewuchs_set('bw_efeu', EF, { d: [10, 24, 40] }), ew: bewuchs_set('bw_efeuwand', EW, { d: [12, 30, 56] }), rk: bewuchs_set('bw_ranke', RK, { d: [10, 26] }),
    pz: bewuchs_set('bw_pilze', pilzV, { d: [13] }), st: bewuchs_set('bw_stumpf', ST.length ? [[ST.map(p => ({ geo: p.geo, mat: p.mat }))], ] : [], { d: [34], shadow: [true] }),
    lb: bewuchs_set('bw_laub', one(LB), { d: [24] }), mo: bewuchs_set('bw_moos', one(MO), { d: [18] }) };
  S.p = { stH: ST[0] ? ST[0].h : 1, stW: ST[0] ? ST[0].w : 1, lbW: LB[0] ? LB[0].w : 1, moW: MO[0] ? MO[0].w : 1, pzH: PZ.map(p => p.h) };
  const SH = gruen_S.lod.find(l => l.name === 'gestruepp'); S.gest = SH;
  // --- Hilfsdaten
  const KO = S.keep = bewuchs_keepOut(), O = gruen_O, cs = O.cs, occ = gruen_occ, n1 = (x, z) => gruen_n(x * .17 + 11, z * .17 - 7), n2 = (x, z) => gruen_n(x * .55 - 3, z * .55 + 5);
  const inHouse = (x, z, m = .3) => { for (const H of HOUSES) { const o = H.o; if (o && o.x !== undefined && Math.abs(x - o.x) < (o.w || 10) / 2 + m && Math.abs(z - o.z) < (o.d || 9) / 2 + m) return o; } return null; };
  const inside = (x, z) => indoorRects.some(r => x > r.x0 - .2 && x < r.x1 + .2 && z > (r.zb ?? r.z0) - .2 && z < (r.zf ?? r.z1) + .2);
  const hedge = (x, z) => gruen_S.hedges.some(([hx, z0, z1]) => Math.abs(x - hx) < 1.3 && z > z0 - .8 && z < z1 + .8);
  const autumn = (k, a, b) => bewuchs_lerp(a, b, Math.max(0, Math.min(1, k)));
  const FERN_G = [.95, 1.02, .9], FERN_B = [1.35, .92, .5], DRY_A = [1.05, 1, .86], DRY_B = [1.25, 1.06, .74], WEED_G = [.9, 1.02, .85], WEED_B = [1.2, 1.02, .7];
  const put = { // jede Art an einer Stelle; s = Größe (1 = Scan-Größe)
    weed: (x, y, z, s = 1) => bewuchs_add(sets.uk, x, y, z, Math.random() * PI2, s * (.75 + Math.random() * .7), null, .08, autumn(Math.random(), WEED_G, WEED_B)),
    dry: (x, y, z, s = 1) => bewuchs_add(sets.tg, x, y, z, Math.random() * PI2, s * (.8 + Math.random() * .6), s * (.75 + Math.random() * .7), .1, autumn(Math.random(), DRY_A, DRY_B)),
    fern: (x, y, z, s = 1, k = Math.random()) => bewuchs_add(sets.lf, x, y, z, Math.random() * PI2, s * (.55 + Math.random() * .45), null, .06, autumn(k, FERN_G, FERN_B)),
    bfern: (x, y, z, s = 1, k = Math.random()) => bewuchs_add(sets.bf, x, y, z, Math.random() * PI2, s * (.7 + Math.random() * .6), null, .06, autumn(k, FERN_G, FERN_B)),
    ivyG: (x, y, z, s = 1) => bewuchs_add(sets.ef, x, y, z, Math.random() * PI2, s * (.5 + Math.random() * .5), null, .03, autumn(Math.random() * .4, [.9, 1, .9], [1.1, .95, .75])),
    pilz: (x, y, z, n = 3) => { if (!sets.pz) return; for (let i = 0; i < n; i++) { const a = Math.random() * PI2, r = .05 + Math.random() * .22 * Math.sqrt(n); bewuchs_add(sets.pz, x + Math.cos(a) * r, y - .005, z + Math.sin(a) * r, Math.random() * PI2, .8 + Math.random() * .7, null, .2, autumn(Math.random(), [1, 1, 1], [.75, .7, .62])); } },
    leaf: (x, y, z, s = 1) => bewuchs_add(sets.lb, x, y - .02, z, Math.random() * PI2, s * (.5 + Math.random() * .6) / S.p.lbW, s * (.35 + Math.random() * .3) / S.p.lbW, .03, autumn(Math.random(), [.95, .9, .82], [1.15, .95, .7])),
    bush: (x, z, big) => { if (!SH) return; const v = Math.floor(Math.random() * SH.variants.length), bb = SH.variants[v][0][0].geo.boundingBox, s = Math.min(1.6, (big ? 1.2 + Math.random() * .8 : .7 + Math.random() * .5) / Math.max(.3, bb.max.y));
      gruen_lodAdd(SH, v, x, -.03, z, Math.random() * PI2, s, s, .05, bewuchs_lerp([.72, .7, .58], [1, .96, .84], Math.random())); gruen_softAdd(x, z, Math.min(1.1, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * s * .38)); } };
  S.put = put;
  const n0 = {}; for (const k in sets) n0[k] = sets[k] ? sets[k].items.length : 0;

  // --- 1) Gehwege: Rinnstein (Fuß des Bordsteins), Plattenfugen, hintere Gehwegkante – Unkraut in Grüppchen, dazwischen lange nichts
  try {
    const line = (x0, x1, fixed, alongX, y, p, sMul, kind) => { for (let a = x0; a < x1; a += .22 + Math.random() * .5) { const x = alongX ? a : fixed, z = alongX ? fixed : a;
      const g = n1(x, z) * .9 + bewuchs_neglect(x, z) * .8 - .42; if (g <= 0 || Math.random() > p * g * 2.2) continue;
      const k = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < k; i++) { const ox = alongX ? (Math.random() - .5) * .3 : (Math.random() - .5) * .05, oz = alongX ? (Math.random() - .5) * .05 : (Math.random() - .5) * .3;
        if (kind === 'dry' && Math.random() < .4) put.dry(x + ox, y, z + oz, .55 * sMul); else put.weed(x + ox, y, z + oz, sMul); } } };
    for (const s of [-1, 1]) for (const [a, b] of [[-77.5, -4.5], [4.5, 77.5]]) {
      line(a, b, s * 3.93, true, .015, .55, 1, 'weed');      // Rinnstein vor dem Bordstein: hier sammelt sich Erde
      line(a, b, s * 5.96, true, .14, .7, 1.1, 'dry');       // Gehweg an der Gartenkante
      for (let x = a; x < b; x += 1.0) if (Math.random() < .07 * (.6 + bewuchs_neglect(x, 0) * 3)) put.weed(x + (Math.random() - .5) * .2, .14, s * (4.25 + Math.random() * 1.5), .7); } // einzelne Rosetten in Plattenfugen
    for (const s of [-1, 1]) { line(-45.5, -6.5, s * 3.93, false, .015, .55, 1, 'weed'); line(-45.5, -6.5, s * 5.96, false, .14, .7, 1.1, 'dry'); } // Südstraße
    // Kieseinfahrten: Gras und Unkraut im Mittelstreifen und an den Rändern (die zugewachsene von Nr. 9 dicht)
    for (const [x0, x1, z0, z1] of gruen_S.gravel) { const along = (z1 - z0) > (x1 - x0), L = along ? z1 - z0 : x1 - x0, wild = bewuchs_neglect((x0 + x1) / 2, (z0 + z1) / 2) > .3;
      for (let t = .2; t < L - .2; t += .25 + Math.random() * .35) { const c = along ? (x0 + x1) / 2 : (z0 + z1) / 2, off = (Math.random() - .5) * .35;
        const x = along ? c + off : x0 + t, z = along ? z0 + t : c + off; if (Math.random() < (wild ? .9 : .45)) (Math.random() < .55 ? put.weed : put.dry)(x, .02, z, wild ? 1.1 : .8);
        if (wild && Math.random() < .5) put.dry(along ? x0 + Math.random() * (x1 - x0) : x, .02, along ? z : z0 + Math.random() * (z1 - z0), .8); } }
  } catch (e) { console.warn('Bewuchs: Gehwege', e); }

  // --- 2) Fuß von Mauern, Häusern, Schuppen, Grabsteinen und Zäunen (aus der Belegung von gruen.js): Unkraut, Trockengras, Farn im Schatten, Efeu, Pilze, Laub
  const wand = S.wand = [];
  try {
    const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let j = 1; j < O.nz - 1; j++) for (let i = 1; i < O.nx - 1; i++) {
      const k = j * O.nx + i, v = O.a[k]; if (v !== 0 && v !== 2) continue;
      let sx = 0, sz = 0, nS = 0, nF = 0, fx = 0, fz = 0; for (const [a, b] of N4) { const w = O.a[k + a + b * O.nx]; if (w === 3) { nS++; sx -= a; sz -= b; } else if (w === 1) { nF++; fx += a; fz += b; } }
      if (!nS && !nF) continue;
      const x = O.x0 + (i + .5) * cs + (Math.random() - .5) * .3, z = O.z0 + (j + .5) * cs + (Math.random() - .5) * .3;
      if (gruen_areaOf(x, z, 3) < 0 && gruen_fenceDist(x, z) > 9) continue;                                    // nur Ort und Ortsränder
      if (inside(x, z) || (v === 2 && Math.abs(z) < 3.6 && Math.abs(x) < 78)) continue; // keine Fahrbahn, nichts drinnen
      const neg = bewuchs_neglect(x, z), north = sz > 0, corner = nS >= 2, wald = gruen_fenceDist(x, z) < 6, g = n1(x, z) * .8 + n2(x, z) * .35 + neg * 1.1 - .45 + (wald ? .25 : 0);
      if (g <= 0) continue; const y = v === 2 ? .02 : 0, ko = KO.near(x, z, 1.5), nx = nS ? Math.sign(sx) : 0, nz = nS ? Math.sign(sz) : 0;
      if (nS) {
        if (Math.random() < .26 * g) put.weed(x + nx * .06, y, z + nz * .06, 1 + neg);
        if (!ko && Math.random() < .1 * g) put.dry(x + nx * .1, y, z + nz * .1, .8 + neg * .5);
        if (!ko && (north || corner || wald) && v === 0 && Math.random() < .07 * g * (corner ? 1.8 : 1)) put.fern(x + nx * .18, 0, z + nz * .18, .8 + neg * .4, Math.random() * .7 + (wald ? .3 : 0));
        if ((corner || north) && Math.random() < .018 * g * (1 + neg * 3)) put.pilz(x + nx * .12, y, z + nz * .12, 2 + Math.floor(Math.random() * 4));
        if (corner && !ko && Math.random() < .12 * g) put.leaf(x + nx * .2, y, z + nz * .2, .9 + neg);
        if (!ko && v === 0 && Math.random() < .045 * g * (1 + neg * 2)) wand.push([x, z, nx, nz, neg, !!inHouse(x, z, .8)]); // Efeu: Wand wird nach dem Kollisionsaufbau gesucht
        if (!ko && v === 0 && neg > .35 && Math.random() < .03 * g) put.ivyG(x + nx * .4, .01, z + nz * .4, .8 + neg);   // Grab, Mauer, verwilderter Garten: Efeu kriecht über den Boden
      } else if (nF && !hedge(x, z)) {                                                                            // Zaun: Ranken, Gras und Unkraut am Fuß
        if (Math.random() < .14 * g) put.weed(x, y, z, 1); if (!ko && Math.random() < .12 * g) put.dry(x, y, z, .9);
        if (!ko && (fx || fz) && Math.random() < .035 * g * (1 + neg * 2)) { const l = Math.hypot(fx, fz); fx /= l; fz /= l;                // Ranke direkt am Zaun, flach zum Zaun
          bewuchs_add(sets.rk, x + fx * .32, y, z + fz * .32, Math.atan2(fx, fz) + (Math.random() - .5) * .5, 1 + Math.random() * .5, .9 + Math.random() * .4, .04, bewuchs_lerp([.9, 1, .9], [1.1, .95, .78], Math.random())); }
      }
    }
  } catch (e) { console.warn('Bewuchs: Mauerfuß', e); }

  // --- 3) Verwilderte Flächen an verlassenen Orten (Garten von Nr. 9, Nr. 1, Villa, Gärten, Hof, Schrott, Friedhofsränder): Trockengras, Farn, Efeu, Büsche, Brennnessel-Ecken
  try {
    for (const [cx, cz, r, f] of BEWUCHS_VERWAHRLOST) { if (f < .25) continue; const n = Math.round(r * r * .55 * f);
      for (let t = 0; t < n; t++) { const a = Math.random() * PI2, d = Math.sqrt(Math.random()) * r, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        if (occ(x, z) !== 0 || inside(x, z) || inHouse(x, z, .4) || KO.near(x, z, 1.8)) continue; const g = n1(x, z) + n2(x, z) * .4 - .55 + f * .6; if (g <= 0) continue;
        const r0 = Math.random(); if (r0 < .45) put.dry(x, 0, z, 1 + g * .4); else if (r0 < .62) put.weed(x, 0, z, 1.4); else if (r0 < .72) put.fern(x, 0, z, .9, .4 + Math.random() * .6);
        else if (r0 < .8) put.ivyG(x, .01, z, 1); else if (r0 < .84 && occ(x + .8, z) === 0 && occ(x - .8, z) === 0) { put.bush(x, z, Math.random() < .5); gruen_markDisc(x, z, .6, 1); } } }
  } catch (e) { console.warn('Bewuchs: Verwilderung', e); }

  // --- 4) Häuser: Büsche an den Ecken (nicht vor Türen und Fenstern der Front), Laub unter der Dachrinne, Moos auf den Treppenstufen
  try {
    for (const H of HOUSES) { const o = H.o; if (!o || o.x === undefined || !o.w) continue; const neg = bewuchs_neglect(o.x, o.z), f = o.facing || 1;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const front = sz === f; if (front && neg < .3 && Math.random() < .6) continue;
        const x = o.x + sx * (o.w / 2 + .55 + Math.random() * .5), z = o.z + sz * (o.d / 2 + (front ? .5 : .35) + Math.random() * .4);
        if (occ(x, z) !== 0 || KO.near(x, z, 2)) continue; if (Math.random() < .7) put.bush(x, z, Math.random() < .5 + neg);
        if (Math.random() < .5) put.leaf(x + (Math.random() - .5), 0, z + (Math.random() - .5), 1); if (Math.random() < .5) put.fern(x - sx * .3, 0, z - sz * .2, .8, Math.random()); } }
    // Ortsbäume: das Laub liegt nicht nur als Fleck darunter, sondern als Haufen an der Stammseite im Windschatten
    for (const [tx, tz] of treeSpots) for (let i = 0; i < 2; i++) { const a = WIND.ang + Math.PI + (Math.random() - .5) * 1.4, d = .5 + Math.random() * 1.2, x = tx + Math.cos(a) * d, z = tz + Math.sin(a) * d; if (occ(x, z) >= 2 || KO.near(x, z, 1)) continue; put.leaf(x, 0, z, 1.2); }
    // Treppenstufen (Kisten ~1,8 × 0,22 × 1,1 vor den begehbaren Häusern): Moos in den Ecken der Trittfläche, Unkraut am Fuß
    if (sets.mo) scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.geometry || o.geometry.type !== 'BoxGeometry') return; const p = o.geometry.parameters;
      if (p.height < .15 || p.height > .26 || p.width < 1.2 || p.width > 2.2 || p.depth < .4 || p.depth > 1.3) return; o.updateWorldMatrix(true, false); const w = new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);
      if (w.y > .5 || w.y < 0 || gruen_areaOf(w.x, w.z, 2) < 0 || inside(w.x, w.z)) return; const top = w.y + p.height / 2 + .003;
      for (const sx of [-1, 1]) { if (Math.random() < .65) bewuchs_add(sets.mo, w.x + sx * (p.width / 2 - .14 - Math.random() * .1), top, w.z + (Math.random() - .5) * p.depth * .6, Math.random() * PI2, (.22 + Math.random() * .18) / S.p.moW, .4, 0, [1, 1, 1]);
        if (Math.random() < .6) put.weed(w.x + sx * (p.width / 2 + .04), 0, w.z + (Math.random() - .5) * p.depth, 1); } });
  } catch (e) { console.warn('Bewuchs: Häuser', e); }

  // --- 5) Waldrand am Weidezaun und am Nordzaun: Farne und Trockengras im Schatten der Bäume, Stümpfe gefällter Bäume in Gärten/Hof
  try {
    for (let t = 0; t < 5200; t++) { const x = gruen_OUT.x0 + Math.random() * (gruen_OUT.x1 - gruen_OUT.x0), z = gruen_OUT.z0 + Math.random() * (gruen_OUT.z1 - gruen_OUT.z0); const fd = gruen_fenceDist(x, z);
      if (fd > 7 || fd < .9 || occ(x, z) >= 2 || gruen_dustGap(x, z, 3) || KO.near(x, z, 1.5)) continue; const g = n1(x, z) - .35 + (7 - fd) / 14; if (g <= 0 || Math.random() > g * 1.4) continue;
      if (Math.random() < .55) put.fern(x, 0, z, 1, .3 + Math.random() * .7); else if (Math.random() < .6) put.dry(x, 0, z, 1.1); else put.bfern(x, 0, z, 1, Math.random()); }
    for (const [cx, cz, r, f] of BEWUCHS_VERWAHRLOST) { if (f < .4) continue; for (let t = 0, n = 0; t < 30 && n < 2; t++) { const a = Math.random() * PI2, d = r * (.3 + Math.random() * .6), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
      if (occ(x, z) !== 0 || KO.near(x, z, 2.5) || inside(x, z)) continue; bewuchs_add(sets.st, x, -.04, z, Math.random() * PI2, (.45 + Math.random() * .3) / S.p.stW, null, .04, [1, 1, 1]); addCol(x - .25, x + .25, z - .25, z + .25, .45); gruen_markDisc(x, z, .5, 3);
      put.pilz(x + .35, 0, z, 3); n++; } }
  } catch (e) { console.warn('Bewuchs: Waldrand', e); }

  for (const k in sets) if (sets[k]) bewuchs_bau(sets[k]); if (SH && SH.items.length) bewuchs_bau(SH);
  for (const k in sets) S.stats[k] = sets[k] ? sets[k].items.length - n0[k] : 0; S.stats.wandKand = wand.length;
  gruen_refreshAll(); try { renderer.compileAsync(gruen_R, camera, scene).catch(() => {}); } catch (e) {}
  S.stats.ms = Math.round(performance.now() - T0); S.ready = true;
}]);

// =====================================================================  EFEU AN WÄNDEN (nach dem Kollisionsaufbau: Wände per Strahl gegen die Kollisionskörper)
const _bwR = new THREE.Ray(), _bwO = new THREE.Vector3(), _bwD = new THREE.Vector3(), _bwH = new THREE.Vector3(), _bwN = new THREE.Vector3();
function bewuchs_strahl(x, y, z, dx, dz, maxD) { let best = null; const seen = new Set();
  for (const [qx, qz] of [[x, z], [x + dx * .6, z + dz * .6]]) for (const it of solidNear(qx, qz)) { if (seen.has(it)) continue; seen.add(it); if (it.soft || it.o.userData.gruen) continue; const bb = it.bb;
    if (y < bb.min.y || y > bb.max.y || Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) < .6) continue;
    _bwO.set(x, y, z).applyMatrix4(it.inv); _bwD.set(dx, 0, dz).transformDirection(it.inv); _bwR.set(_bwO, _bwD);
    const h = it.o.geometry.boundsTree && it.o.geometry.boundsTree.raycastFirst(_bwR, THREE.DoubleSide); if (!h) continue;
    _bwH.copy(h.point).applyMatrix4(it.mw); const d = Math.hypot(_bwH.x - x, _bwH.z - z); if (d > maxD || (best && d >= best.d)) continue;
    _bwN.copy(h.face.normal).transformDirection(it.mw); if (Math.abs(_bwN.y) > .35) continue; if (_bwN.x * dx + _bwN.z * dz > 0) _bwN.negate();
    best = { d, x: _bwH.x, z: _bwH.z, nx: _bwN.x, nz: _bwN.z, bb }; }
  return best; }
function bewuchs_wandBau() {
  const S = bewuchs_S, EW = S.sets.bw_efeuwand; if (!EW || S.wandDone) return; S.wandDone = true; let n = 0;
  const hs = EW.variants.map(V => V[0][0].geo.boundingBox.max.y), ws = EW.variants.map(V => V[0][0].geo.boundingBox.max.x - V[0][0].geo.boundingBox.min.x);
  const done = bewuchs_grid(1.2);
  for (const [x, z, nx, nz, neg, house] of S.wand) {
    const h0 = bewuchs_strahl(x, .5, z, -nx, -nz, 1.1); if (!h0 || done.near(h0.x, h0.z, house ? 1.4 : .9)) continue;
    let top = .5; for (const y of [1.2, 1.9, 2.6, 3.3]) { const h = bewuchs_strahl(x, y, z, -nx, -nz, 1.3); if (!h || Math.abs(h.d - h0.d) > .35) break; top = y; }
    const wallH = top + .3; if (wallH < 1.55) continue;                                                           // Grabsteine, Autos, Bänke: kein Wandefeu
    // Hausfront: nur an den Ecken und niedrig (Fenster bleiben frei); verlassene Häuser, Mauern, Schuppen: höher
    let maxH = Math.min(wallH - .15, 2.7);
    if (house) { const o = HOUSES.map(H => H.o).find(o => o && o.x !== undefined && Math.abs(h0.x - o.x) < (o.w || 10) / 2 + .8 && Math.abs(h0.z - o.z) < (o.d || 9) / 2 + .8); if (!o) continue;
      const ex = Math.abs(Math.abs(h0.x - o.x) - o.w / 2), ez = Math.abs(Math.abs(h0.z - o.z) - o.d / 2), corner = ex < 1.4 && ez < 1.4; // auf der Wand ist eins von beiden ≈ 0
      if (!corner && neg < .35) continue; maxH = neg > .35 ? Math.min(maxH, 2.6) : Math.min(maxH, 1.3); }
    const v = Math.floor(Math.random() * EW.variants.length), s = Math.min(maxH / hs[v], 1.5 / ws[v] * (.8 + Math.random() * .6)) * (.75 + Math.random() * .25);
    const ry = Math.atan2(h0.nx, h0.nz), off = .015 + Math.random() * .02;
    gruen_lodAdd(EW, v, h0.x + h0.nx * off, -.02, h0.z + h0.nz * off, ry, s, s, 0, bewuchs_lerp([.9, 1, .9], [1.15, .95, .78], Math.random() * .6), 1); n++; done.add(h0.x, h0.z);
    // Fuß der Ranke: Unkraut / Laub
    if (Math.random() < .6) S.put.weed(h0.x + h0.nx * .12, 0, h0.z + h0.nz * .12, 1); if (Math.random() < .25) S.put.leaf(h0.x + h0.nx * .3, 0, h0.z + h0.nz * .3, .7);
  }
  bewuchs_bau(EW); bewuchs_bau(S.sets.bw_unkraut); bewuchs_bau(S.sets.bw_laub); S.stats.efeuWand = n; gruen_refreshAll();
}

// =====================================================================  WALD (Kapitel 6): lädt nach, sobald der Wald frei ist
async function bewuchs_wald() {
  const S = bewuchs_S; if (S.wald || typeof WALD === 'undefined' || typeof TIEF === 'undefined') return; S.wald = 1; S.keep = bewuchs_keepOut(); /* Story-Punkte von Kapitel 6 sind jetzt da */ const T0 = performance.now(), PI2 = Math.PI * 2, sets = S.sets, put = S.put;
  const load = (f, ...a) => f(...a).catch(e => { console.warn('Bewuchs Wald: ' + a[0], e); return []; });
  // Bäume: Kiefer (jung bis alt), Laubbäume (Gruppen des Packs), toter Stamm stehend und liegend, Findling – Materialien teilt waldleben (Nacht, Wind)
  const lying = g => g.rotateZ(Math.PI / 2);
  const [pine, decid, snag, log, rock] = await Promise.all([load(wl_asset, 'pineb'), load(wl_asset, 'moretrees', { split: true }), load(bewuchs_scan, 'deadtree1', 'model.gltf', { dark: .5, wind: .0016 }),
    load(bewuchs_scan, 'deadtree1', 'model.gltf', { dark: .45, prep: lying }), load(bewuchs_scan, '../boulder', 'model.gltf', { dark: .75 })]);
  const lv = parts => [parts.map(p => ({ geo: p.geo, mat: p.mat })), parts.map(p => ({ geo: p.geo, mat: p.mat }))]; // nah mit Schatten, fern ohne
  const dec = decid.filter(G => G.h > 3).slice(0, 4);
  const TS = { pine: pine[0] ? bewuchs_set('bw_kiefer', [lv(pine[0].parts)], { d: [22, 62], shadow: [true, false] }) : null,
    dec: dec.length ? bewuchs_set('bw_laubbaum', dec.map(G => lv(G.parts)), { d: [22, 60], shadow: [true, false] }) : null,
    snag: snag.length ? bewuchs_set('bw_totholz', [lv(snag)], { d: [20, 48], shadow: [true, false] }) : null,
    log: log.length ? bewuchs_set('bw_liegend', [lv(log)], { d: [18, 46], shadow: [true, false] }) : null,
    rock: rock.length ? bewuchs_set('bw_fels', [lv(rock)], { d: [16, 48], shadow: [true, false] }) : null };
  S.waldSets = Object.values(TS).filter(Boolean);
  // freie Plätze: Wege, Story-Orte (wl_free), Lukes Weg und die Kinderspur (Kap. 6), Jagdflächen; Abstand zu vorhandenen Stämmen
  const lines = [...(typeof K6_WEG !== 'undefined' ? [K6_WEG] : []), ...(typeof K6_KINDERSPUR !== 'undefined' ? [K6_KINDERSPUR] : [])];
  const lineD = (x, z) => { let d = 1e9; for (const P of lines) for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz, k = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L)); d = Math.min(d, Math.hypot(x - ax - vx * k, z - az - vz * k)); } return d; };
  const ARENA = [[...(typeof K6_BUS !== 'undefined' ? K6_BUS.mitte : [61.2, 196.9]), 11], [1.5, 199.6, 7], [-13.2, 206.8, 6], [24.2, 196.4, 4], [TIEF.camp.x, TIEF.camp.z, 7], [TIEF.wreck.x, TIEF.wreck.z, 7], [WALD.clear.x, WALD.clear.z, WALD.clear.r + 1]];
  const arena = (x, z, m = 0) => ARENA.some(([a, b, r]) => Math.hypot(x - a, z - b) < r + m);
  const pathD = (x, z) => Math.min(wald_in(x, z) ? wald_pathDist(x, z) : 1e9, tief_in(x, z) ? tief_pathDist(x, z) : 1e9, lineD(x, z));
  const free = (x, z, r) => wl_free(x, z, Math.min(r, 2.6)) && pathD(x, z) > r && !arena(x, z, r * .5) && !(S.keep && S.keep.near(x, z, r * .7));
  const trunks = bewuchs_grid(3), v3 = new THREE.Vector3(), m4 = new THREE.Matrix4();
  for (const C of [...(wald_S.chunks || []), ...(tief_S.chunks || [])]) for (const m of C.meshes) { if (!m.isInstancedMesh) continue; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); if (m.geometry.boundingBox.max.y < 3) continue;
    for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, m4); v3.setFromMatrixPosition(m4); trunks.add(v3.x, v3.z); } }
  for (const c of colliders) if (c.maxX - c.minX < 1 && c.maxZ - c.minZ < 1 && c.minZ > WALD.z0 - 2) trunks.add((c.minX + c.maxX) / 2, (c.minZ + c.maxZ) / 2);
  const ZONES = [[WALD.x0 + 1.5, WALD.x1 - 1.5, WALD.z0 + 1.5, WALD.z1 - 1.5], [TIEF.x0 + 1.5, TIEF.x1 - 1.5, TIEF.z0 + 1.5, TIEF.z1 - 1.5]];
  const deep = z => Math.max(0, Math.min(1, (z - 115) / 140)), nF = (x, z) => gruen_n(x * .07 + 31, z * .07 - 13), nG = (x, z) => gruen_n(x * .23 - 9, z * .23 + 4);
  const each = (n, fn) => { for (const [x0, x1, z0, z1] of ZONES) { const N = Math.round(n * (x1 - x0) * (z1 - z0) / 1000); for (let t = 0, k = 0; t < N * 8 && k < N; t++) { const x = x0 + Math.random() * (x1 - x0), z = z0 + Math.random() * (z1 - z0); if (fn(x, z)) k++; } } };
  let nT = 0;
  // --- Bäume: in mehreren Größen, tiefer drin dichter und älter; jeder neue Stamm hält Abstand (kein Raster, keine Wand)
  const tree = (x, z) => { if (!free(x, z, 2.4) || trunks.near(x, z, 2.3 + Math.random() * .8)) return false; const dz = deep(z), r = Math.random(), young = Math.random() < .3 - dz * .12;
    if (r < .5 && TS.pine) bewuchs_add(TS.pine, x, -.08, z, Math.random() * PI2, (young ? 4 + Math.random() * 3 : 10 + Math.random() * 8 + dz * 3) / pine[0].h, null, .035, bewuchs_lerp([.8, .82, .78], [1, 1, .95], Math.random()));
    else if (r < .9 && TS.dec) { const v = Math.floor(Math.random() * dec.length); bewuchs_add(TS.dec, x, -.08, z, Math.random() * PI2, (young ? 3.5 + Math.random() * 2.5 : 6 + Math.random() * 5) / dec[v].h, null, .04, bewuchs_lerp([.75, .72, .66], [1, .92, .78], Math.random()), v); }
    else if (TS.snag) bewuchs_add(TS.snag, x, -.12, z, Math.random() * PI2, (young ? .45 : .7 + Math.random() * .5) * (1 + dz * .2), null, .09, bewuchs_lerp([.8, .8, .8], [1, .96, .9], Math.random()));
    else return false;
    const r0 = young ? .12 : .22; addCol(x - r0, x + r0, z - r0, z + r0); trunks.add(x, z); nT++; return true; };
  each(22, tree);
  // --- Liegende tote Stämme (über die man nicht steigt: schmale Kisten entlang des Stamms) und Stümpfe
  let nL = 0; if (TS.log) each(.8, (x, z) => { if (!free(x, z, 4.5)) return false; const a = Math.random() * PI2, L = log[0].w * .85, ca = Math.cos(a), sa = Math.sin(a);
    for (let k = -.45; k <= .45; k += .15) { const px = x + ca * L * k, pz = z - sa * L * k; if (!free(px, pz, 2.2) || trunks.near(px, pz, .8)) return false; }
    const s = .7 + Math.random() * .4; bewuchs_add(TS.log, x, -.06, z, a, s, null, .02, bewuchs_lerp([.75, .75, .72], [1, .95, .88], Math.random()));
    for (let k = -.45; k <= .45; k += .1) { const px = x + ca * L * s * k, pz = z - sa * L * s * k; addCol(px - .2, px + .2, pz - .2, pz + .2, .55); }
    put.pilz(x + ca * L * s * .2 + sa * .3, 0, z - sa * L * s * .2 + ca * .3, 4); if (Math.random() < .6) put.fern(x - sa * .8, 0, z - ca * .8, 1.1, Math.random()); nL++; return true; });
  let nS = 0; if (sets.bw_stumpf) each(1.5, (x, z) => { if (!free(x, z, 1.8) || trunks.near(x, z, 1.2)) return false; bewuchs_add(sets.bw_stumpf, x, -.05, z, Math.random() * PI2, (.5 + Math.random() * .5) / S.p.stW, null, .06, bewuchs_lerp([.8, .8, .8], [1, .95, .9], Math.random()));
    addCol(x - .25, x + .25, z - .25, z + .25, .5); if (Math.random() < .7) put.pilz(x + (Math.random() - .5) * .8, 0, z + (Math.random() - .5) * .8, 2 + Math.floor(Math.random() * 4)); nS++; return true; });
  let nR = 0; if (TS.rock) each(.9, (x, z) => { if (!free(x, z, 2.2)) return false; const s = (.7 + Math.random() * 1.3) / rock[0].w; bewuchs_add(TS.rock, x, -.15 - Math.random() * .2, z, Math.random() * PI2, s, s * (.6 + Math.random() * .4), .15, bewuchs_lerp([.7, .72, .7], [.95, .95, .9], Math.random()));
    const r0 = Math.min(.7, s * rock[0].w * .35); addCol(x - r0, x + r0, z - r0, z + r0, .6); trunks.add(x, z); nR++; return true; });
  // --- Unterwuchs: Farnkolonien (feucht, schattig, tiefer dichter, am Weiher), Himbeer-/Holunderdickicht in Flecken, Trockengras in lichten Stellen, Laub an den Wegrändern
  let nF0 = 0, nB = 0;
  each(90, (x, z) => { const pd = pathD(x, z); if (pd < 1.1 || !wl_free(x, z, 1.1) || arena(x, z, -2)) return false; const w = typeof tief_pond === 'function' && tief_pond(x, z, 6) ? .45 : 0, g = nF(x, z) + w + deep(z) * .25 - .45;
    if (g <= 0 || Math.random() > g * 1.8) return false; const k = nG(x, z) * .8 + Math.random() * .4; // Farbe je Kolonie: grün bis herbstbraun
    if (Math.random() < .62) put.fern(x, 0, z, 1 + deep(z) * .35, k); else put.bfern(x, 0, z, 1.1, k); nF0++; return true; });
  const gest = S.gest, pickB = () => { const n = gest.variants.length; return n >= 12 ? 4 + Math.floor(Math.random() * 8) : Math.floor(Math.random() * n); }; // Holunder/Himbeere (gruen: Spindel 0–3)
  if (gest) each(2.6, (x, z) => { if (!free(x, z, 2.6) || nF(x + 40, z) < .52) return false; const n = 2 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) { const a = Math.random() * PI2, r = Math.random() * 2.2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!free(px, pz, 2.2)) continue; const v = pickB(), bb = gest.variants[v][0][0].geo.boundingBox, s = Math.min(1.7, (1 + Math.random() * 1.1) / Math.max(.3, bb.max.y));
      gruen_lodAdd(gest, v, px, -.03, pz, Math.random() * PI2, s, s, .05, bewuchs_lerp([.66, .64, .54], [.95, .9, .78], Math.random())); gruen_softAdd(px, pz, Math.min(1.1, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * s * .38)); nB++; } return true; });
  each(7, (x, z) => { const pd = pathD(x, z); if (pd < 1.2 || !wl_free(x, z, 1.2) || nG(x - 20, z) < .55) return false; put.dry(x, 0, z, 1.2); return true; });
  each(9, (x, z) => { const pd = pathD(x, z); if (pd < .7 || pd > 2.4) return false; put.leaf(x, 0, z, 1.4 + Math.random()); if (Math.random() < .3) put.weed(x, 0, z, 1.3); return true; }); // Laub sammelt sich am Wegrand
  // --- bauen (geteilte Sätze neu, eigene Waldsätze)
  for (const k of ['bw_frauenfarn', 'bw_buchenfarn', 'bw_trockengras', 'bw_laub', 'bw_unkraut', 'bw_pilze', 'bw_stumpf']) bewuchs_bau(sets[k]); if (gest) bewuchs_bau(gest);
  for (const L of S.waldSets) bewuchs_bau(L);
  // --- Mondlicht durch Lücken im Kronendach: nur über Lichtung, Steinkreis und Weiher (dort ist das Dach offen), kaltblau, weich, ohne Lichtquelle (Streulicht im Nebel)
  try { bewuchs_strahlen([[WALD.clear.x, WALD.clear.z, 3.6], [TIEF.ring.x, TIEF.ring.z, 3], [TIEF.pond.x, TIEF.pond.z, 4.2], [WALD.clear.x + 4, WALD.clear.z - 3, 1.6]]); } catch (e) { console.warn('Bewuchs: Mondlicht', e); }
  Object.assign(S.stats, { waldBaeume: nT, waldLiegend: nL, waldStuempfe: nS, waldFelsen: nR, waldFarne: nF0, waldBuesche: nB, waldMs: Math.round(performance.now() - T0) });
  gruen_refreshAll(); try { renderer.compileAsync(gruen_R, camera, scene).catch(() => {}); } catch (e) {}
  S.wald = 2;
}
// Lichtschacht: offener Kegelstumpf, Kanten weich (Blickwinkel), oben und unten ausgeblendet, langsam ziehender Dunst; Stärke nach Abstand und Wald-Freigabe (uK)
function bewuchs_strahlen(list) {
  const md = new THREE.Vector3(.35, 1, .2); try { md.copy(moon.position).sub(moon.target.position).normalize(); if (md.y < .55) { md.y = .55; md.normalize(); } } catch (e) {}
  const uK = { value: 0 }, H = 15; bewuchs_S.uK = uK;
  for (const [x, z, r] of list) {
    const g = new THREE.CylinderGeometry(r * .8, r * 1.1, H, 24, 6, true); g.translate(0, H / 2, 0);
    const m = new THREE.ShaderMaterial({ uniforms: { uT: gruen_S.uT, uK, uH: { value: H } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      vertexShader: 'uniform float uH; varying float vY; varying vec3 vN, vV; varying vec3 vW; void main(){ vY = position.y / uH; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; vV = -mv.xyz; vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform float uT, uK; varying float vY; varying vec3 vN, vV; varying vec3 vW; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }\n' +
        'void main(){ float e = abs(dot(normalize(vN), normalize(vV))); e = e * e; float a = smoothstep(0., .22, vY) * (1. - smoothstep(.5, 1., vY)); float d = n(vec2(atan(vW.z, vW.x) * 3. + uT * .05, vY * 4. - uT * .12)) * .55 + .45;\n' +
        ' float far = 1. - smoothstep(30., 70., length(vV)); float near = smoothstep(1.5, 6., length(vV)); gl_FragColor = vec4(vec3(.55, .66, .86) * a * e * d * far * near * uK * .085, 1.); }' });
    const o = new THREE.Mesh(g, m); o.position.set(x, -.2, z); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), md); o.renderOrder = 3; o.userData.noCol = true; o.frustumCulled = true; o.visible = false; scene.add(o); bewuchs_S.strahlen.push(o); }
}

// ---- pro Bild: Wand-Efeu nach dem Kollisionsaufbau, Wald nachladen, Mondlicht
WORLD_TICK.push((dt, t, indoor) => {
  const S = bewuchs_S; if (!S.ready) return;
  if (!S.wandDone && SOL.items.length) { try { bewuchs_wandBau(); } catch (e) { console.warn('Bewuchs: Wandefeu', e); S.wandDone = true; } }
  if (!state.started || menu.attract) return;
  const frei = typeof wald_frei === 'function' && wald_frei();
  if (frei && !S.wald && typeof WL !== 'undefined' && WL.ready && wald_S.ready && tief_S.ready) bewuchs_wald().catch(e => { console.warn('Bewuchs: Wald', e); S.wald = 2; });
  // Waldsätze nur im freien Wald nachführen (älterer Spielstand nach Kapitel 6: wieder aus)
  if (S.wald === 2) { const on = frei && state.zone !== 'canal' && !state.inBasement;
    if (on !== S.waldOn) { S.waldOn = on; for (const L of S.waldSets) { const i = gruen_S.lod.indexOf(L); if (on && i < 0) gruen_S.lod.push(L); else if (!on && i >= 0) { gruen_S.lod.splice(i, 1); L.meshes.flat(2).forEach(im => { im.count = 0; im.visible = false; }); } } if (on) gruen_refreshAll(); } }
  if (S.uK) { const P = player.pos, inW = S.waldOn && !indoor && P.z > 95; S.uK.value += ((inW ? 1 : 0) - S.uK.value) * Math.min(1, dt * .6); const v = S.uK.value > .01; for (const o of S.strahlen) if (o.visible !== v) o.visible = v; }
});
