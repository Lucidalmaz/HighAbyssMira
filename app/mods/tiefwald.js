// =====================================================================  TIEFWALD (Modul „tiefwald“): Der tiefe Wald hinter den Forbidden Dustwoods
// Hinter Zayns Hütte ist der alte Nordzaun eingedrückt (x 39,6…44,4). Dahinter wird der Wald immer dichter und dunkler (x −22…92, z 156…266):
// Nebel und Mondlicht hängen an der Tiefe (ENV_DARK), Totholz, umgestürzte Stämme, Gestrüpp, Laub, Nebelschwaden, fallende Blätter, Augen im Dunkeln.
// Roter Faden: Jonas hat von 2009 bis 2016 vierzig Mal nach seinem Bruder Zayn gesucht und dabei die rote Wolle seiner Mutter von Baum zu Baum gespannt.
//   Fünf Zettel: Zaunlücke · Hochsitz · Amtsbus · Steinkreis · Weiher (Nebenaufgabe N6-5 „Vierzig Mal“; AP-24: Kerben am Leiterholm, Landeplatz-Andeutung mit Messplakette,
//   Blechschild „Probe T“ am Steg, Wahl festhalten/loslassen, „Für Samstag.“).
// Außerdem: Wolfsrudel am Steinkreis (friedlich, wenn der Welpe befreit ist), Wildschweinrotte am Bus (N6-6 „Vorrat. Nicht anfassen.“: Graben mit E halten, Z-06, drei Batterien),
//   Autowrack, Jonas' Lager (Karte + Batterie), eine Schaukel, die nicht stillhält, zwei Rehe. Schreckmomente: siehe tief_* unten.
const TIEF = { x0: -22, x1: 92, z0: 156, z1: 266, stand: { x: 14, z: 178.5 }, bus: { x: 65, z: 199.5 }, dig: { x: 60.5, z: 204.5 }, ring: { x: 15, z: 225, r: 5.2, acht: null }, // acht: der umgefallene achte Stein (N6-3)
  pond: { x: 51.5, z: 255.5, rx: 8, rz: 6 }, jetty: { x0: 44, z0: 248, x1: 48.4, z1: 252.2 }, swing: { x: 82, z: 177 }, wreck: { x: -10, z: 204.5 }, camp: { x: 80.5, z: 233 } };
TIEF.ring.acht = (a => ({ x: TIEF.ring.x + Math.cos(a) * TIEF.ring.r, z: TIEF.ring.z + Math.sin(a) * TIEF.ring.r, ry: -a, a }))(7 / 8 * Math.PI * 2 + .2); // AP-24: sieben stehen, der achte liegt
const TIEF_PATHS = [ // die ersten vier bilden den Weg mit dem roten Faden
  [[42, 152], [42, 158], [37, 165], [28, 172], [19, 176.5]],
  [[19, 176.5], [27, 184], [40, 189], [52, 193], [59, 196.5]],
  [[59, 196.5], [55, 205], [45, 212], [33, 217], [22, 222]],
  [[22, 222], [27, 231], [35, 240], [44, 248]],
  [[37, 165], [55, 168], [70, 172], [79, 176]],
  [[40, 189], [22, 196], [6, 200], [-5, 203]],
  [[33, 217], [55, 224], [70, 229], [77, 232]]];
const tief_S = { ready: false, chunks: [], chunkT: 0, inside: false, k: 0, fogSet: false, wolves: [], boars: [], deer: [], eyes: [], ambT: 5, told: new Set(), lit: 0,
  swingW: 1, swingStop: 0, figs: [], eighth: null, thread: null, threadEnd: null, face: null, faceT: -1, busy: false, climbing: false, behind: null, runner: null, follow: null, pondLight: null,
  charged: false, lunged: false, rooted: false, leaves: null, mist: null, off: false, statics: [], hid: [], keep: new Set() };
// Stille-Zonen (Regie: spannung.js / kapitel6.js): dort keine Tierlaute
const tief_still = () => typeof spannung_silent === 'function' && spannung_silent();
const tief_has = k => story.lore.some(l => l.key === k);
function tief_in(x, z, m = 0) { return x > TIEF.x0 - m && x < TIEF.x1 + m && z > TIEF.z0 - m && z < TIEF.z1 + m; }
function tief_pathDist(x, z) { let d = 1e9; for (const P of TIEF_PATHS) for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz, k = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L));
  d = Math.min(d, Math.hypot(x - ax - vx * k, z - az - vz * k)); } return d; }
function tief_pond(x, z, m = 0) { const P = TIEF.pond; return ((x - P.x) / (P.rx + m)) ** 2 + ((z - P.z) / (P.rz + m)) ** 2 < 1; }
function tief_onJetty(x, z) { const J = TIEF.jetty, vx = J.x1 - J.x0, vz = J.z1 - J.z0, L = Math.hypot(vx, vz), k = ((x - J.x0) * vx + (z - J.z0) * vz) / (L * L); if (k < -.1 || k > 1.05) return false;
  return Math.abs((x - J.x0) * vz - (z - J.z0) * vx) / L < .75; }
function tief_free(x, z, pathR = 2.6) { if (tief_pathDist(x, z) < pathR || tief_pond(x, z, 2.5)) return false;
  for (const [p, r] of [[TIEF.stand, 4.5], [TIEF.bus, 6], [TIEF.dig, 3], [TIEF.ring, TIEF.ring.r + 3], [TIEF.swing, 3.8], [TIEF.wreck, 4.5], [TIEF.camp, 5.5]]) if (Math.hypot(x - p.x, z - p.z) < r) return false; return true; }
function tief_note(t) { return '<span class="hand">' + t + '</span>'; }
function tief_ok() { return wald_frei() && state.started && !state.talking && !state.ending && !ui.overlay && !menu.attract && !scripted && !(typeof hunt !== 'undefined' && hunt.on); }
// Papier mit Bleistiftzeilen (Kinderhand, nicht lesbar – der Text steht im Zettel selbst): Zettel am Pfahl, am Stein, am Steg
function tief_blatt() { if (tief_S.blatt) return tief_S.blatt; const T = THREE;
  tief_S.blatt = new T.MeshStandardMaterial({ roughness: .95, side: T.DoubleSide, map: tex(cnv(256, (c, w) => { c.fillStyle = '#d8cfb6'; c.fillRect(0, 0, w, w); for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(120,96,60,${rand(.02, .09)})`; c.beginPath(); c.arc(rand(0, w), rand(0, w), rand(4, 30), 0, 7); c.fill(); }
    c.strokeStyle = 'rgba(46,42,40,.6)'; c.lineCap = 'round'; c.lineWidth = 2.4; for (let l = 0; l < 7; l++) { let x = 22 + rand(0, 6); const y = 40 + l * 28; c.beginPath(); c.moveTo(x, y); while (x < w - 30 - (l === 6 ? 90 : 0)) { x += rand(5, 14); c.quadraticCurveTo(x - 4, y + rand(-12, 8), x, y + rand(-4, 4)); if (Math.random() < .14) { x += rand(6, 12); c.moveTo(x, y + rand(-2, 2)); } } c.stroke(); }
    c.fillStyle = 'rgba(60,48,30,.18)'; c.fillRect(0, 0, w, 6); c.fillRect(0, w - 6, w, 6); }), true) }); return tief_S.blatt; }
// Kindersitz (Gruppe 1/2): Schale mit Polster, Seitenflügel, Rückenlehne, Gurte mit Schloss. Ursprung: Mitte der Sitzfläche am Boden, Blick (Lehne hinten) nach +z. Maße in Metern, ein Kindersitz ist ca. 0,36 breit, 0,5 hoch.
function tief_kindersitz(stoff, kunst, metall, alt = 0) { const T = THREE, g = new T.Group();
  const rb = (w, h, d, r, mat, x, y, z, rx = 0) => { const sh = new T.Shape(), a = w / 2 - r, b = d / 2 - r; sh.moveTo(-a, -d / 2); sh.lineTo(a, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -b); sh.lineTo(w / 2, b); sh.quadraticCurveTo(w / 2, d / 2, a, d / 2); sh.lineTo(-a, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, b); sh.lineTo(-w / 2, -b); sh.quadraticCurveTo(-w / 2, -d / 2, -a, -d / 2);
    const ge = new T.ExtrudeGeometry(sh, { depth: h - r * .8, bevelEnabled: true, bevelSize: r * .4, bevelThickness: r * .4, bevelSegments: 2, curveSegments: 4 }); ge.rotateX(-PI / 2); ge.translate(0, r * .4, 0);
    const m = new T.Mesh(ge, mat); m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  rb(.38, .14, .34, .05, kunst, 0, .02, 0); // Wanne
  rb(.32, .06, .27, .04, stoff, 0, .15, .01); // Sitzpolster
  rb(.34, .44, .09, .04, kunst, 0, .12, -.17, -.2); // Lehnenschale (leicht nach hinten geneigt)
  rb(.27, .36, .05, .03, stoff, 0, .17, -.115, -.2); // Lehnenpolster
  for (const sx of [-1, 1]) rb(.05, .24, .13, .02, kunst, sx * .185, .17, -.1, -.1); // Seitenflügel
  for (const sx of [-1, 1]) { const st = new T.Mesh(new T.BoxGeometry(.034, .36, .004), metall.gurt); st.position.set(sx * .075, .33, -.075); st.rotation.x = -.62; st.castShadow = false; g.add(st); } // Schultergurte
  const bu = new T.Mesh(new T.BoxGeometry(.06, .035, .018), metall.schloss); bu.position.set(0, .2, .07); g.add(bu);
  for (const sx of [-1, 1]) { const st = new T.Mesh(new T.BoxGeometry(.034, .004, .22), metall.gurt); st.position.set(sx * .075, .185, -.02); g.add(st); } // Beckengurte
  g.rotation.z = alt; return g; }
// ---- Amtsbus: Wagen öffnen und einrichten. Koordinaten im Wagen (Gruppe o): x seitlich (+x = Fahrerseite, links), y hoch, z längs (+z vorn, Kühler; −z hinten, Heck), Ursprung Bodenmitte.
function tief_busW(x, y, z) { const g = tief_S.busG, T = THREE; if (!g) return new T.Vector3(TIEF.bus.x, y, TIEF.bus.z); g.updateMatrixWorld(true); return g.localToWorld(new T.Vector3(x, y, z)); }
// Aus dem Scan: den zweiten (unbeschädigten) Wagen entfernen, Heckscheibe und Windschutzscheibe herausnehmen (Dreiecke im Fensterrahmen), Innenseiten sichtbar
function tief_vanOeffnen(van) { const T = THREE; van.updateMatrixWorld(true); const v = new T.Vector3(), rm = [];
  van.traverse(m => { if (!m.isMesh) return; if (m.name === 'Object016') { rm.push(m); return; } const g = m.geometry, P = g.attributes.position; if (g.index || P.count % 3) return; // Rahmen in FBX-Koordinaten (Breite x ±77, Höhe y 0…139, Länge z −192 … +186; Heck bei z<0)
    const inWin = (x, y, z) => (Math.abs(x) < 58 && y > 90 && y < 130 && z < -170) || (Math.abs(x) < 62 && y > 84 && y < 132 && z > 95 && z < 175), keep = [];
    for (let i = 0; i < P.count; i += 3) { let all = true; for (let k = 0; k < 3; k++) { v.fromBufferAttribute(P, i + k).applyMatrix4(m.matrixWorld); if (!inWin(v.x, v.y, v.z)) { all = false; break; } } if (!all) keep.push(i); }
    const ng = new T.BufferGeometry(); for (const name of Object.keys(g.attributes)) { const A = g.attributes[name], arr = new A.array.constructor(keep.length * 3 * A.itemSize); keep.forEach((i, j) => { for (let k = 0; k < 3 * A.itemSize; k++) arr[j * 3 * A.itemSize + k] = A.array[i * A.itemSize + k]; }); ng.setAttribute(name, new T.BufferAttribute(arr, A.itemSize, A.normalized)); }
    m.geometry = ng; for (const mt of [].concat(m.material)) { mt.side = T.DoubleSide; } });
  for (const m of rm) m.removeFromParent(); }
// Das Innere: Laderaum mit sieben Kindersitzen, Hofers Spind, Fahrerhaus mit Armaturenbrett, Fahrtenbuch
async function tief_busInnen(o) { const T = THREE, FY = .5, g = new T.Group(); g.name = 'busInnen'; g.userData.noCol = true; o.add(g);
  const dark = new T.MeshStandardMaterial({ color: 0x22201e, roughness: .85, metalness: .2, side: T.DoubleSide }), stoff = new T.MeshStandardMaterial({ color: 0x1d2536, roughness: .96 }), kunst = new T.MeshStandardMaterial({ color: 0x2b2d31, roughness: .55 });
  const metall = { gurt: new T.MeshStandardMaterial({ color: 0x35373a, roughness: .9 }), schloss: new T.MeshStandardMaterial({ color: 0x9a9a98, roughness: .3, metalness: .9 }) };
  const rb = (w, h, d, r, mat, x, y, z) => { const sh = new T.Shape(), a = w / 2 - r, bb = d / 2 - r; sh.moveTo(-a, -d / 2); sh.lineTo(a, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -bb); sh.lineTo(w / 2, bb); sh.quadraticCurveTo(w / 2, d / 2, a, d / 2); sh.lineTo(-a, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, bb); sh.lineTo(-w / 2, -bb); sh.quadraticCurveTo(-w / 2, -d / 2, -a, -d / 2);
    const ge = new T.ExtrudeGeometry(sh, { depth: Math.max(.002, h - r * .8), bevelEnabled: true, bevelSize: r * .4, bevelThickness: r * .4, bevelSegments: 2, curveSegments: 4 }); ge.rotateX(-PI / 2); ge.translate(0, r * .4, 0); const m = new T.Mesh(ge, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
  // Boden: Riffelblech, hinten und im Fahrerhaus
  { const fl = msSurfMat('corrugated', { tint: 0x4a4744 }); fl.userData.tile = 1; fl.side = T.DoubleSide; const f = box(1.92, .03, 3.6, 0, FY - .015, -.9, fl, { parent: g, cast: false }); f.receiveShadow = true; const f2 = box(1.92, .03, 1.3, 0, FY + .01, 1.5, dark, { parent: g, cast: false }); f2.receiveShadow = true; }
  // Sieben Kindersitze: hinten drei, davor vier, alle nach vorn, einer umgekippt; auf dem mittleren hinteren klebt das Z, daneben Jonas’ Zettel
  const zTex = tex(cnv(128, (c, w) => { c.fillStyle = '#c9c0a4'; c.beginPath(); c.moveTo(6, 8); c.lineTo(w - 4, 4); c.lineTo(w - 7, w - 10); c.lineTo(w - 30, w - 4); c.lineTo(10, w - 6); c.closePath(); c.fill();
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(90,70,40,${rand(.03, .14)})`; c.fillRect(rand(0, w), rand(0, w), rand(2, 18), rand(1, 4)); }
    c.strokeStyle = '#161412'; c.lineWidth = 11; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(30, 32); c.lineTo(94, 28); c.lineTo(36, 98); c.lineTo(98, 94); c.stroke(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(31, 30); c.lineTo(92, 26); c.stroke();
    c.fillStyle = 'rgba(60,50,35,.5)'; c.beginPath(); c.moveTo(w - 30, w - 4); c.lineTo(w - 7, w - 10); c.lineTo(w - 24, w - 28); c.closePath(); c.fill(); }), true);
  const zMat = new T.MeshStandardMaterial({ map: zTex, roughness: .6, transparent: true, alphaTest: .02, polygonOffset: true, polygonOffsetFactor: -2 });
  const seats = []; const rows = [[-1.95, [-.5, 0, .5]], [-1.0, [-.72, -.24, .24, .72]]]; let n = 0;
  for (const [sz, xs] of rows) for (const sx of xs) { n++; const st = tief_kindersitz(stoff, kunst, metall); st.position.set(sx + rand(-.02, .02), FY, sz + rand(-.03, .03)); st.rotation.y = rand(-.07, .07);
    if (n === 6) { st.rotation.set(0, .3, 1.35); st.position.set(sx + .1, FY + .2, sz); } // einer liegt auf der Seite
    g.add(st); seats.push(st); if (n === 2) { const lz = new T.Mesh(new T.PlaneGeometry(.15, .15), zMat); lz.position.set(0, .3, -.272); lz.rotation.set(-.2, PI, .06); lz.userData.noCol = true; st.add(lz); }
    if (n === 1) { const zp = new T.Mesh(new T.PlaneGeometry(.12, .17), tief_blatt()); zp.position.set(.02, .29, -.272); zp.rotation.set(-.2, PI, .1); zp.userData.noCol = true; st.add(zp); } }
  // Fahrerhaus: Armaturenbrett, Lenkrad, zwei Sitze
  { rb(1.9, .1, .5, .04, dark, 0, .93, 1.45); rb(.5, .16, .22, .05, dark, .42, 1.02, 1.36); // Armaturenbrett mit Instrumentenhaube
    const lr = new T.Mesh(new T.TorusGeometry(.19, .014, 8, 24), dark); lr.position.set(.42, .9, 1.12); lr.rotation.x = 1.0; g.add(lr); for (const aa of [0, 2.1, 4.2]) { const sp = new T.Mesh(new T.BoxGeometry(.012, .17, .012), dark); sp.position.set(.42, .9, 1.12); sp.rotation.set(1.0, 0, aa); g.add(sp); }
    for (const sx of [.42, -.42]) { rb(.5, .14, .5, .06, stoff, sx, FY + .32, .75); const lh = rb(.5, .62, .12, .05, stoff, sx, FY + .4, .52); lh.rotation.x = -.14; rb(.24, .2, .1, .04, stoff, sx, FY + 1.0, .44); } }
  // Fahrtenbuch auf dem Armaturenbrett, in einer Klarsichthülle
  try { const src = await msModel('w_buch', 'model.glb'), bk = msGround(msFit(src.clone(true), .24, 'max')); bk.position.set(-.3, 1.0, 1.52); bk.rotation.set(-.12, .5, 0); bk.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.add(bk);
    const sl = new T.Mesh(new T.BoxGeometry(.3, .004, .24), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .2, roughness: .06, clearcoat: 1, depthWrite: false })); sl.position.set(-.3, 1.06, 1.52); sl.rotation.set(-.12, .5, 0); sl.userData.noCol = true; g.add(sl); } catch (e) { console.warn('Tiefwald: Fahrtenbuch', e); }
  tief_S.busInnen = true; }
WORLD_MODS.push(['Der tiefe Wald', async () => {
  const S = tief_S, T = THREE, q = new T.Quaternion(), e = new T.Euler(), m4 = (x, y, z, ry, s, tx = 0, tz = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), q.setFromEuler(e.set(tx, ry, tz, 'YXZ')), new T.Vector3(s, s, s));
  const n0 = scene.children.length; // alles ab hier gehört zum tiefen Wald (Kapitel-Sperre: wald_huelle)
  const [t1, t3, fence, elder, rasp, wg1, wg2, shr] = await Promise.all([msBake('deadtree1'), msBake('deadtree3'), msBake('fencepost'), msBake('elderberry'), msBake('raspberry'), msBake('wildgrass1'), msBake('wildgrass2'), msBake('../deadshrubs').catch(() => [])]);
  const dark = parts => parts.map(p => { const mat = p.mat.clone(); mat.side = T.DoubleSide; mat.color.setScalar(.36); return { ...p, mat }; });
  const T1 = dark(t1), T3 = dark(t3), low = () => { try { return settings.gfx === 0 ? .82 : 1; } catch (e) { return 1; } }; // settings entsteht erst nach den Modulen
  const chunk = (parts, list, shadow, vis = 46, sh = 20) => { if (!parts.length || !list.length) return; const cells = new Map(), v = new T.Vector3();
    for (const m of list) { v.setFromMatrixPosition(m); const k = Math.floor(v.x / 20) + ',' + Math.floor(v.z / 20); let c = cells.get(k); if (!c) cells.set(k, c = { x: 0, z: 0, n: 0, L: [] }); c.L.push(m); c.x += v.x; c.z += v.z; c.n++; }
    for (const c of cells.values()) { const meshes = msInst(parts, c.L, { shadow }); S.chunks.push({ x: c.x / c.n, z: c.z / c.n, meshes, vis: vis * low(), sh: shadow ? sh : 0 }); } };
  // --- Bäume: dichter als vorn (4 m Raster), größer, dunkler; dahinter ein Gürtel, durch den keiner kommt
  const A = [], B = [];
  for (let gx = TIEF.x0 - 12; gx <= TIEF.x1 + 12; gx += 4) for (let gz = TIEF.z0 + 1.5; gz <= TIEF.z1 + 12; gz += 4) {
    const x = gx + rand(-1.6, 1.6), z = gz + rand(-1.6, 1.6); if (z < TIEF.z0 + 1.2) continue;
    if (tief_in(x, z)) { if (!tief_free(x, z) || Math.random() < .05) continue; if (Math.abs(x - TIEF.x0) < 1.3 || Math.abs(x - TIEF.x1) < 1.3 || Math.abs(z - TIEF.z1) < 1.3) continue; }
    else { if (tief_in(x, z, 1.3)) continue; if (z < 171 && (x < -24 || x > 94)) continue; }
    if (tief_in(x, z) && Math.random() < .38) { WL_SLOTS.push([x, z]); continue; } // Platz für lebende Bäume (Modul waldleben)
    const deep = Math.min(1, Math.max(0, (z - 160) / 80)); (Math.random() < .5 ? A : B).push(m4(x, -.1, z, rand(0, 6.28), rand(.95, 1.45) + deep * .35, rand(-.08, .08), rand(-.08, .08)));
  }
  chunk(T1, A, true); chunk(T3, B, true); S.nTrees = A.length + B.length;
  // --- Umgestürzte Stämme (liegende Totholz-Scans) abseits der Wege: Hindernisse, über die man steigen oder um die man herum muss
  const LOGS = []; for (let i = 0; i < 400 && LOGS.length < 34; i++) { const x = rand(TIEF.x0 + 3, TIEF.x1 - 3), z = rand(TIEF.z0 + 5, TIEF.z1 - 3); if (tief_pathDist(x, z) < 7.5 || !tief_free(x, z)) continue;
    LOGS.push(m4(x, .22, z, rand(0, 6.28), rand(.75, 1.05), PI / 2 - rand(.02, .1), rand(-.2, .2))); }
  chunk(T3, LOGS, true, 42, 16);
  // --- Unterholz, Gestrüpp, Gras: je tiefer, desto dichter
  const eA = elder.filter(p => /VarG_LOD1$/.test(p.name)), eR = rasp.filter(p => /VarB_LOD1$/.test(p.name)), gA = wg1.filter(p => /VarG_LOD1$/.test(p.name)), gB = wg2.filter(p => /VarB_LOD1$/.test(p.name));
  const dS = shr.filter(p => /VarD$|VarB$/.test(p.name)), SH = [], SR = [], G1 = [], G2 = [], DS = [];
  for (let i = 0; i < 3400; i++) { const x = rand(TIEF.x0 + 1, TIEF.x1 - 1), z = rand(TIEF.z0 + 1, TIEF.z1 - 1); if (tief_pathDist(x, z) < 1.5 || tief_pond(x, z, .6)) continue;
    let near = false; for (const p of [TIEF.stand, TIEF.bus, TIEF.ring, TIEF.camp, TIEF.wreck]) if (Math.hypot(x - p.x, z - p.z) < 3.2) near = true; if (near) continue;
    const deep = (z - TIEF.z0) / (TIEF.z1 - TIEF.z0), r = Math.random(); if (Math.random() > .55 + deep * .45) continue;
    if (r < .26) SH.push(m4(x, 0, z, rand(0, 6.28), rand(.8, 1.35))); else if (r < .42) SR.push(m4(x, 0, z, rand(0, 6.28), rand(.9, 1.4))); else if (r < .5 && dS.length && DS.length < 240) DS.push(m4(x, 0, z, rand(0, 6.28), rand(.7, 1.1)));
    else (r < .76 ? G1 : G2).push(m4(x, 0, z, rand(0, 6.28), rand(.8, 1.5))); }
  chunk(eA, SH, false, 40); chunk(eR, SR, false, 38); chunk(gA, G1, false, 32); chunk(gB, G2, false, 32); chunk(dS, DS, false, 30);
  // Schilf um den Weiher
  const REED = []; for (let i = 0; i < 160; i++) { const a = rand(0, 6.28), P = TIEF.pond, k = rand(1.0, 1.35), x = P.x + Math.cos(a) * P.rx * k, z = P.z + Math.sin(a) * P.rz * k; if (tief_onJetty(x, z) || Math.hypot(x - TIEF.jetty.x0, z - TIEF.jetty.z0) < 1.6) continue; REED.push(m4(x, 0, z, rand(0, 6.28), rand(1.2, 1.9))); }
  chunk(gB.length ? gB : gA, REED, false, 36);
  // --- Grenzzaun (West, Nord, Ost) wie vorn: sichtbar, alt, schief
  { const F = [], run = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 3.05), a = Math.atan2(-(z1 - z0), x1 - x0);
      for (let i = 0; i < n; i++) { const k = i * 3.05 / L; F.push(m4(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k, a, 1, rand(-.05, .05), rand(-.06, .06))); } };
    run(TIEF.x0, TIEF.z0, TIEF.x0, TIEF.z1); run(TIEF.x0, TIEF.z1, TIEF.x1, TIEF.z1); run(TIEF.x1, TIEF.z1, TIEF.x1, TIEF.z0); chunk(fence, F, true, 50, 20);
    // die eingedrückte Stelle im alten Nordzaun: ein Feld liegt flach im Laub
    const lie = m4(42, .08, 157.2, .15, 1, -PI / 2 + .12, 0); chunk(fence, [lie], false, 50); }
  // --- Boden: Waldboden, Laubflecken, Schlamm am Weiher
  try { const ff = msSurfMat('../forestfloor', { tint: 0x3e3830 }); ff.userData.tile = 4; const p = plane(TIEF.x1 - TIEF.x0 + 30, TIEF.z1 - TIEF.z0 + 26, (TIEF.x0 + TIEF.x1) / 2, .013, (TIEF.z0 + TIEF.z1) / 2 + 6, ff); p.receiveShadow = true; } catch (e) { console.warn('Tiefwald: Boden', e); }
  try { const lv = msSurfMat('../leaves', { tint: 0x6a5846 }); lv.userData.tile = 2.5; lv.transparent = false;
    for (let i = 0; i < 70; i++) { const x = rand(TIEF.x0 + 2, TIEF.x1 - 2), z = rand(TIEF.z0 + 2, TIEF.z1 - 2); if (tief_pond(x, z, 1)) continue; const s = rand(3, 8), m = plane(s, s * rand(.6, 1), x, .016 + i * .00002, z, lv, -PI / 2, rand(0, 6.28)); m.receiveShadow = true; } } catch (e) { console.warn('Tiefwald: Laub', e); }
  // --- Weiher: schwarzes, stilles Wasser; Steg
  { const P = TIEF.pond, g = new T.CircleGeometry(1, 48); g.rotateX(-PI / 2); g.scale(P.rx, 1, P.rz);
    const water = new T.Mesh(g, new T.MeshStandardMaterial({ color: 0x06090b, roughness: .06, metalness: .8, envMapIntensity: .4 })); water.position.set(P.x, .03, P.z); water.receiveShadow = true; water.userData.noCol = true; scene.add(water); S.water = water;
    const mud = new T.Mesh(new T.RingGeometry(1, 1.25, 48), new T.MeshStandardMaterial({ color: 0x1c1712, roughness: .95 })); mud.rotation.x = -PI / 2; mud.scale.set(P.rx, P.rz, 1); mud.position.set(P.x, .02, P.z); mud.userData.noCol = true; scene.add(mud);
    const J = TIEF.jetty, len = Math.hypot(J.x1 - J.x0, J.z1 - J.z0) + .6, ang = Math.atan2(J.x1 - J.x0, J.z1 - J.z0), wood = msSurfMat('planks_painted', { tint: 0x3a3028 }); wood.userData.tile = 1;
    const deck = box(1.1, .09, len, (J.x0 + J.x1) / 2, .24, (J.z0 + J.z1) / 2, wood); deck.rotation.y = ang;
    for (const k of [0, .5, 1]) for (const s of [-1, 1]) { const px = J.x0 + (J.x1 - J.x0) * k + Math.cos(ang) * .5 * s, pz = J.z0 + (J.z1 - J.z0) * k - Math.sin(ang) * .5 * s; box(.1, .9, .1, px, .2, pz, wood); }
    S.postEnd = [J.x1 + Math.cos(ang) * .5, J.z1 - Math.sin(ang) * .5];
    // fernes Licht über dem Wasser (vom Hochsitz aus zu sehen): führt tiefer hinein
    const gl = new T.Sprite(new T.SpriteMaterial({ map: poolTex, color: 0xbfd2ff, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, fog: false })); gl.scale.set(3.2, 3.2, 1); gl.position.set(P.x, 1.6, P.z); scene.add(gl); S.pondLight = gl;
    // AP-24 (N6-5): Blechschild am Stegpfosten – das erste ehrliche Schild vom Amt (das Gesicht aus dem Wasser entfällt: der Schreck ist jetzt der Zug, Stufe 2)
    const bs = new T.Mesh(new T.PlaneGeometry(.34, .2), new T.MeshStandardMaterial({ roughness: .45, metalness: .7, map: tex(cnv(256, (c, w) => { c.fillStyle = '#7d8580'; c.fillRect(0, 0, w, w); for (let i = 0; i < 50; i++) { c.fillStyle = `rgba(90,50,20,${rand(.1, .35)})`; c.beginPath(); c.arc(rand(0, w), rand(0, w), rand(2, 12), 0, 7); c.fill(); }
      c.fillStyle = '#161616'; c.textAlign = 'center'; c.font = 'bold 28px Arial'; c.fillText('BfR · AST 7', w / 2, 62); c.font = 'bold 32px Arial'; c.fillText('PROBE T', w / 2, 104); c.font = '24px Arial'; c.fillText('nicht bergen · zieht', w / 2, 144); }), true) }));
    bs.material.map.repeat.set(1, .62); bs.material.map.offset.set(0, .38); bs.position.set(S.postEnd[0] - Math.sin(ang) * .07, .5, S.postEnd[1] - Math.cos(ang) * .07); bs.rotation.y = ang + PI; scene.add(bs); }
  // --- Stämme für die Wolle: Mitte und Radius der Totholz-Scans in 1,1 m Modellhöhe (aus den Scans gemessen: deadtree1 (.03|.10) r .19 · deadtree3 (.02|.17) r .24), je Instanz mit Maßstab und Neigung
  const TR = []; { const v = new T.Vector3(), sc = new T.Vector3(), qq = new T.Quaternion(), ps = new T.Vector3();
    for (const [Lst, cx, cz, r] of [[A, .03, .10, .19], [B, .02, .17, .24]]) for (const m of Lst) { m.decompose(ps, qq, sc); v.set(cx, 1.1, cz).applyMatrix4(m); TR.push({ x: v.x, y: v.y, z: v.z, r: r * sc.x }); } }
  // --- Der rote Faden: Jonas hat die Wolle von Stamm zu Stamm gespannt (je Stamm zweimal herum geschlungen); wo am Weg kein Stamm steht, hält ein Pfahl. Am Ende hängt sie ins Wasser.
  { const route = []; for (let i = 0; i < 4; i++) for (const p of TIEF_PATHS[i]) if (!route.length || Math.hypot(p[0] - route[route.length - 1][0], p[1] - route[route.length - 1][1]) > .1) route.push(p);
    route.push([TIEF.jetty.x1, TIEF.jetty.z1]);
    const pts = []; for (let i = 0; i < route.length - 1; i++) { const [ax, az] = route[i], [bx, bz] = route[i + 1], L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 5)), nx = (bz - az) / L, nz = -(bx - ax) / L;
      for (let k = 0; k < n; k++) { const t = k / n, off = i === route.length - 2 ? .5 : 1.3; pts.push([ax + (bx - ax) * t + nx * off, az + (bz - az) * t + nz * off, nx, nz]); } }
    const end = route[route.length - 1]; pts.push([end[0] + .35, end[1] + .1, 0, 0]);
    const stakeMat = new T.MeshStandardMaterial({ color: 0x2e241a, roughness: .9 });
    // 1) Anker: erst der Zaunpfahl mit dem ersten Zettel, dann je Wegpunkt der nächste Stamm auf der Wegseite (min. 3,2 m Abstand zum vorigen), sonst ein Pfahl
    const anchors = [{ x: 39.8, y: 1.05, z: 156.3, r: .055, post: true, fence: true }]; let prev = anchors[0];
    for (let i = 0; i < pts.length - 2; i++) { const [px, pz, nx, nz] = pts[i]; if (pz < 158) continue; let best = null, bd = 1e9;
      for (const t of TR) { const dx = t.x - px, dz = t.z - pz, d = Math.hypot(dx, dz); if (d > 6 || (dx * nx + dz * nz) < -.3 || t.y > 1.7 || t.y < .9) continue; if (d < bd) { bd = d; best = t; } }
      if (best && Math.hypot(best.x - prev.x, best.z - prev.z) < 3.2) continue; if (best && best === prev) continue;
      let a = best; if (!a) { if (Math.hypot(px - prev.x, pz - prev.z) < 3.2) continue; a = { x: px, y: 1.25, z: pz, r: .03, post: true }; } anchors.push(a); prev = a; }
    const [sx, sz] = pts[pts.length - 2]; anchors.push({ x: sx, y: 1.0, z: sz, r: .02, post: true, last: true });
    // 2) Steht zwischen zwei Ankern noch ein anderer Stamm im Weg, wird die Wolle auch um ihn geschlungen
    const blocker = (a, b) => { const vx = b.x - a.x, vz = b.z - a.z, L2 = vx * vx + vz * vz; for (const t of TR) { if (t === a || t === b) continue; const k = ((t.x - a.x) * vx + (t.z - a.z) * vz) / L2; if (k < .08 || k > .92) continue; const y = a.y + (b.y - a.y) * k; if (Math.abs(y - t.y) > .9) continue;
        if (Math.hypot(t.x - a.x - vx * k, t.z - a.z - vz * k) < t.r + .07) return t; } return null; };
    const chain = [anchors[0]]; for (let i = 1; i < anchors.length; i++) { const stack = [anchors[i]]; let guard = 0; while (stack.length && guard++ < 12) { const b = stack[stack.length - 1], a = chain[chain.length - 1], bl = blocker(a, b); if (bl && !stack.includes(bl) && !chain.includes(bl)) stack.push(bl); else chain.push(stack.pop()); } }
    // 3) Pfähle (nur wo kein Stamm steht) und Wolle
    for (const a of chain) if (a.post && !a.fence) { const h = a.last ? 1.0 : 1.5; box(a.last ? .035 : .06, h, a.last ? .035 : .06, a.x, h / 2, a.z, stakeMat, { cast: false }); }
    const segs = [], up = new T.Vector3(0, 0, 1), dirv = new T.Vector3();
    for (let i = 0; i < chain.length - 1; i++) { const a = chain[i], b = chain[i + 1], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, ax = a.x + ux * (a.r + .012), az = a.z + uz * (a.r + .012), bx = b.x - ux * (b.r + .012), bz = b.z - uz * (b.r + .012);
      const n = Math.max(4, Math.ceil(L / 1.1)), sag = Math.min(.34, .04 + .02 * L), pt = t => new T.Vector3(ax + (bx - ax) * t, a.y + (b.y - a.y) * t - sag * Math.sin(t * PI), az + (bz - az) * t);
      for (let k = 0; k < n; k++) segs.push([pt(k / n), pt((k + 1) / n)]); }
    { const a = chain[chain.length - 1], bx = end[0] + .35, bz = end[1] + .1; for (let k = 0; k < 3; k++) { const t0 = k / 3, t1 = (k + 1) / 3; segs.push([new T.Vector3(a.x + (bx - a.x) * t0, .95 - t0 * 1.1, a.z + (bz - a.z) * t0), new T.Vector3(a.x + (bx - a.x) * t1, .95 - t1 * 1.1, a.z + (bz - a.z) * t1)]); } }
    const woolMat = new T.MeshStandardMaterial({ color: 0x9a1212, emissive: 0x3a0404, roughness: .9 });
    const cg = new T.CylinderGeometry(.0075, .0075, 1, 5, 1); cg.translate(0, .5, 0); cg.rotateX(PI / 2);
    const im = new T.InstancedMesh(cg, woolMat, segs.length);
    segs.forEach(([a, b], i) => { dirv.copy(b).sub(a); const L = dirv.length(); im.setMatrixAt(i, new T.Matrix4().compose(a, new T.Quaternion().setFromUnitVectors(up, dirv.normalize()), new T.Vector3(1, 1, L))); });
    im.castShadow = false; im.userData.noCol = true; im.userData.noCull = true; im.computeBoundingSphere(); scene.add(im); S.thread = im; S.threadN = segs.length; S.threadSegs = segs;
    // 4) Wicklungen: zweimal um jeden Stamm (und um den Zaunpfahl am Anfang)
    const wr = chain.filter(a => !a.last && !(a.post && !a.fence)); const tg = new T.TorusGeometry(1, .04, 5, 20); tg.rotateX(PI / 2);
    const ri = new T.InstancedMesh(tg, woolMat, wr.length * 2), qa = new T.Quaternion(), ea = new T.Euler(), pa = new T.Vector3(), sa = new T.Vector3();
    wr.forEach((a, i) => { for (let k = 0; k < 2; k++) { const R = a.r + .012 + k * .002; ri.setMatrixAt(i * 2 + k, new T.Matrix4().compose(pa.set(a.x, a.y + (k ? .045 : -.02), a.z), qa.setFromEuler(ea.set(rand(-.1, .1), rand(0, 6), rand(-.1, .1))), sa.set(R, R, R))); } });
    ri.castShadow = false; ri.userData.noCol = true; ri.computeBoundingSphere(); scene.add(ri);
    // 5) Der frisch nachgeknotete Knoten (Gedanke tief_knoten): heller, kleiner Knoten mit zwei losen Enden an dem Stamm, der (46 | 212,8) am nächsten steht
    { let best = null, bd = 1e9; for (const a of chain) { if (a.post || a.last) continue; const d = Math.hypot(a.x - 46, a.z - 212.8); if (d < bd) { bd = d; best = a; } }
      if (best && bd < 9) { S.knotAt = [best.x, best.z]; const g = new T.Group(), fm = new T.MeshStandardMaterial({ color: 0xc92424, emissive: 0x4a0808, roughness: .85 }), toP = Math.atan2(46 - best.x, 212.8 - best.z);
        const ring = new T.Mesh(new T.TorusGeometry(best.r + .016, .0085, 5, 20), fm); ring.rotation.x = PI / 2; ring.position.y = .02; g.add(ring);
        const kn = new T.Mesh(new T.SphereGeometry(.02, 8, 6), fm); kn.position.set(Math.sin(toP) * (best.r + .02), .02, Math.cos(toP) * (best.r + .02)); kn.scale.set(1.1, .8, 1); g.add(kn);
        for (const s of [-1, 1]) { const e = new T.Mesh(new T.CylinderGeometry(.005, .004, .09, 4), fm); e.position.set(Math.sin(toP + s * .09) * (best.r + .03), -.02, Math.cos(toP + s * .09) * (best.r + .03)); e.rotation.set(.3 * s, 0, .25 * s); g.add(e); }
        g.position.set(best.x, best.y, best.z); g.userData.noCol = true; scene.add(g); } } }
  const note = (x, y, z, label, fn, w = .5, h = .5, d = .5) => { const hit = box(w, h, d, x, y, z, hidden, { cast: false }); interact(hit, label, fn); return hit; };
  // --- 1) Zaunlücke: Zettel in einer Klarsichthülle am Pfahl
  { plane(.16, .2, 39.8, 1.1, 156.25, tief_blatt(), 0, 0); { const sl = new T.Mesh(new T.PlaneGeometry(.18, .225), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .2, roughness: .06, clearcoat: 1, side: T.DoubleSide, depthWrite: false })); sl.position.set(39.8, 1.1, 156.255); sl.userData.noCol = true; scene.add(sl); } note(39.8, 1.1, 156.3, () => tief_has('tief_zettel_1') ? 'Jonas’ Zettel' : 'Zettel am Zaunpfahl', () => tief_zettel(1)); }
  // --- 2) Hochsitz: vier Pfosten, Plattform in 3,1 m, Leiter; Blechdose an der Leiter
  { const H = TIEF.stand, y = 3.1, wood = msSurfMat('planks_painted', { tint: 0x4a3e32 }); wood.userData.tile = 1;
    for (const [dx, dz] of [[-.85, -.85], [.85, -.85], [-.85, .85], [.85, .85]]) box(.16, y + 1.1, .16, H.x + dx, (y + 1.1) / 2, H.z + dz, wood, { collide: true });
    box(2, .1, 2, H.x, y - .05, H.z, wood, { cast: true });
    for (const [dx, dz, w, d] of [[0, .95, 2, .06], [-.95, 0, .06, 2], [.95, 0, .06, 2]]) box(w, .9, d, H.x + dx, y + .45, H.z + dz, wood);
    box(.6, .9, .06, H.x - .7, y + .45, H.z - .95, wood); box(.6, .9, .06, H.x + .7, y + .45, H.z - .95, wood);
    const roof = box(2.4, .06, 2.4, H.x, y + 1.95, H.z, wood); roof.rotation.x = -.12; for (const [dx, dz] of [[-1.05, -1.05], [1.05, -1.05], [-1.05, 1.05], [1.05, 1.05]]) box(.07, 1.9, .07, H.x + dx, y + .95, H.z + dz, wood);
    const lad = new T.Group(); lad.position.set(H.x, 0, H.z - 1.55); lad.rotation.x = -.28; scene.add(lad);
    for (const s of [-.28, .28]) box(.07, 3.4, .07, s, 1.7, 0, wood, { parent: lad }); for (let k = 0; k < 10; k++) box(.6, .045, .06, 0, .3 + k * .32, 0, wood, { parent: lad });
    { const kb = new T.Mesh(new T.PlaneGeometry(.066, 1.5), new T.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: .9, polygonOffset: true, polygonOffsetFactor: -4, map: tex(cnv(512, (c, w) => { c.clearRect(0, 0, w, w); // AP-24: vierzig Kerben im linken Holm, die ersten krumm, die letzten gerade, die letzte tiefer
        for (let i = 0; i < 40; i++) { const y = 500 - i * 12.2, k = 1 - i / 39, d = i === 39 ? 5 : 2.6; c.strokeStyle = i === 39 ? 'rgba(18,12,8,.95)' : 'rgba(200,176,138,.8)'; c.lineWidth = d; c.beginPath(); c.moveTo(w * .15, y + k * rand(-5, 5)); c.lineTo(w * .85, y + k * rand(-7, 7)); c.stroke(); } }), true) }));
      kb.position.set(.28, 1.25, -.038); kb.rotation.y = PI; lad.add(kb); }
    msModel('w_barrel', 'model.glb').then(src => { const o = msGround(msFit(src.clone(true), .15, 'y')); o.position.set(H.x + .36, .82, H.z - 1.8); o.rotation.set(-.28, .4, 0); scene.add(o); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.material = m.material.clone(); m.material.color.setRGB(.55, .55, .6); } }); }).catch(() => {}); // Jonas' Blechdose, mit Draht an der Leiter
    note(H.x + .36, .9, H.z - 1.8, () => tief_has('tief_zettel_2') ? 'Jonas’ Blechdose' : 'Blechdose an der Leiter', () => tief_zettel(2), .3, .3, .3);
    note(H.x, 1.1, H.z - 1.8, () => player.pos.y > 1.5 ? '' : 'Hochsitz hinaufsteigen', () => tief_climb(true), 1, 2.2, .5);
    note(H.x, y + .7, H.z - .6, () => player.pos.y > 1.5 ? 'Hinuntersteigen' : '', () => tief_climb(false), 1.4, .8, .5); S.standY = y; }
  // --- 3) Der Amtsbus: überwuchert, eingesunken, mitten im Wald ohne Weg
  try { const van = await msFBX('vans', 'model.fbx', { '*': { b: 'van_damaged_d.jpg', n: 'van_damaged_n.jpg', r: 'van_damaged_roughness.jpg', m: 'van_damaged_metallic.jpg', rough: 1, color: 0x8a8478 } });
    tief_vanOeffnen(van); // nur ein Wagen (der Scan enthält zwei), Heck- und Frontscheibe fehlen: man sieht in den Laderaum und ins Fahrerhaus
    const o = msGround(msFit(van, 5.3, 'max')); o.position.set(TIEF.bus.x, -.18, TIEF.bus.z); o.rotation.set(0, .5, .05); msPlace(o, TIEF.bus.x, -.18, TIEF.bus.z, .5); o.rotation.z = .05; S.busG = o; o.updateMatrixWorld(true);
    try { await tief_busInnen(o); } catch (e) { console.warn('Tiefwald: Bus innen', e); } } catch (e) { console.warn('Tiefwald: Bus', e); }
  { const sign = new T.Mesh(new T.PlaneGeometry(1.4, .45), new T.MeshStandardMaterial({ roughness: .7, metalness: .5, map: tex(cnv(512, (c, w) => { c.fillStyle = '#6c7a72'; c.fillRect(0, 0, w, w); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(90,50,20,${rand(.1, .4)})`; c.beginPath(); c.arc(rand(0, w), rand(0, w), rand(3, 30), 0, 7); c.fill(); }
      c.fillStyle = '#e4e0d4'; c.font = 'bold 50px Arial'; c.textAlign = 'center'; c.fillText('AMT FÜR RÜCKFÜHRUNG', w / 2, 96); c.font = '38px Arial'; c.fillText('FAHRDIENST · LOST EYENGLESS', w / 2, 150); }), true) }));
    sign.material.map.repeat.set(1, .32); sign.material.map.offset.set(0, .68); sign.position.set(TIEF.bus.x - 2.6, .09, TIEF.bus.z - 2.2); sign.rotation.set(-PI / 2 + .1, 0, .6); scene.add(sign);
    note(TIEF.bus.x - 2.6, .3, TIEF.bus.z - 2.2, 'Blechschild im Laub', () => toast('AMT FÜR RÜCKFÜHRUNG · FAHRDIENST · LOST EYENGLESS. Das Schild ist abgefallen – oder abgerissen. Der Bus steht hier, als wäre er zwischen die Bäume gefahren, die damals noch nicht da waren.', 5600), 1.4, .4, .6);
    { const w = tief_busW(-.35, 1.3, -3.1); note(w.x, w.y, w.z, () => tief_has('tief_zettel_3') ? 'Jonas’ Zettel im Bus' : 'In den Bus sehen', () => tief_zettel(3), 1.4, 1.4, 2.2); } // Blick durch die Heckscheibe auf die Kindersitze
    { const w = tief_busW(0, 1.25, 2.95); note(w.x, w.y, w.z, 'Fahrtenbuch am Armaturenbrett', () => tief_fahrtenbuch(), 2.2, 1.2, 2.2); } // Blick durch die Frontscheibe aufs Armaturenbrett
    // aufgewühlte Erde (die Rotte gräbt hier)
    const dirt = new T.Mesh(new T.CircleGeometry(1.3, 20), new T.MeshStandardMaterial({ color: 0x241a12, roughness: 1 })); dirt.rotation.x = -PI / 2; dirt.position.set(TIEF.dig.x, .018, TIEF.dig.z); dirt.userData.noCol = true; scene.add(dirt);
    note(TIEF.dig.x, .3, TIEF.dig.z, () => tief_has('tief_rotte') ? '' : tief_S.rooted ? 'Aufgewühlte Erde durchsuchen' : 'Aufgewühlte Erde', () => tief_dig(), 1.6, .5, 1.6); }
  // --- 4) Der Steinkreis: neun Findlinge, verkohlte Feuerstelle, sieben Stöckchenmänner – und ein achter, der tiefer hängt
  try { const rock = await msModel('../boulder', 'model.gltf'), R = TIEF.ring;
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2 + .2, liegt = i === 7, o = msGround(msFit(rock.clone(true), liegt ? 1.1 : rand(1.2, 1.5), 'max')); o.scale.y *= liegt ? .5 : 1.3; // AP-24 (N6-3): sieben stehen, der achte liegt umgefallen im Moos
      msPlace(o, R.x + Math.cos(a) * R.r, liegt ? -.16 : -.1, R.z + Math.sin(a) * R.r, liegt ? -a : rand(0, 6.28)); }
    for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28, o = msGround(msFit(rock.clone(true), .32, 'max')); msPlace(o, R.x + Math.cos(a) * .7, -.03, R.z + Math.sin(a) * .7, rand(0, 6)); }
    const ash = new T.Mesh(new T.CircleGeometry(.62, 16), new T.MeshStandardMaterial({ color: 0x0e0c0a, roughness: 1 })); ash.rotation.x = -PI / 2; ash.position.set(R.x, .02, R.z); ash.userData.noCol = true; scene.add(ash);
    const twig = msSurfMat('bark', { tint: 0x6a5a48 }), wool = new T.MeshBasicMaterial({ color: 0x5a4a3a });
    const stick = (s) => { const g = new T.Group(); const b = (w, h, d, x, y, z, rz = 0) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), twig); m.position.set(x, y, z); m.rotation.z = rz; m.castShadow = true; g.add(m); return m; };
      b(.035, .62, .035, 0, 0, 0); b(.5, .03, .03, 0, .14, 0, .12); b(.03, .34, .03, -.07, -.44, 0, .25); b(.03, .34, .03, .07, -.44, 0, -.25);
      const hd = new T.Mesh(new T.TorusGeometry(.08, .014, 5, 10), twig); hd.position.y = .4; g.add(hd);
      const str = new T.Mesh(new T.CylinderGeometry(.004, .004, 6, 3), wool); str.position.y = 3.48; g.add(str); g.scale.setScalar(s); g.userData.noCol = true; return g; };
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + .45, g = stick(rand(.9, 1.1)); g.position.set(R.x + Math.cos(a) * 3.3, rand(2.1, 2.5), R.z + Math.sin(a) * 3.3); g.rotation.y = rand(0, 6.28); scene.add(g); S.figs.push({ g, ph: rand(0, 6), y0: g.position.y }); }
    const g8 = stick(.72); g8.position.set(R.x - .4, 1.45, R.z - 2.2); scene.add(g8); S.eighth = { g: g8, ph: 0, y0: 1.45, home: g8.position.clone() }; S.figs.push(S.eighth);
    const tag = new T.Mesh(new T.PlaneGeometry(.07, .05), paperMat); tag.position.set(0, -.05, .03); g8.add(tag);
    note(R.x - .4, 1.4, R.z - 2.2, () => tief_has('tief_achter') ? 'Der achte Stöckchenmann' : 'Der achte Stöckchenmann – er hängt tiefer', () => tief_achter(), .6, 1, .6);
    { const zx = R.x + Math.cos(.2) * (R.r - .74) + .1, zz = R.z + Math.sin(.2) * (R.r - .74) - .3, blatt = tief_blatt(); // am Fuß des ersten stehenden Steins, die eine Ecke unter einem faustgroßen Stein
      const bl = plane(.15, .21, zx, .026, zz, blatt, -PI / 2 + .04, .5); bl.rotation.z = .12; bl.receiveShadow = true;
      const sm = msGround(msFit(rock.clone(true), .2, 'max')); sm.scale.y *= .62; sm.position.set(zx + .06, -.012, zz + .05); sm.rotation.y = rand(0, 6); sm.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(sm);
      note(zx, .25, zz, () => tief_has('tief_zettel_4') ? 'Jonas’ Zettel am Stein' : 'Zettel unter einem Stein', () => tief_zettel(4), .7, .5, .7); }
    // drei heruntergebrannte Kerzen auf den Findlingen – jemand war gerade hier (flackern wie die Grablichter)
    if (typeof ausbau_nord_flame === 'function') for (const i of [1, 3, 5]) { const a = i / 8 * PI * 2 + .2; ausbau_nord_flame(R.x + Math.cos(a) * (R.r - 1.3), .07, R.z + Math.sin(a) * (R.r - 1.3), true, .8); }
    // AP-24 (N6-5, Suche 29): Andeutung Landeplatz – im Kreis ist der Boden glatt und glasig, Moos in Rosetten aus je drei Punkten, eine Messplakette am Stein
    { const gl = new T.Mesh(new T.CircleGeometry(R.r - 1.2, 40), new T.MeshStandardMaterial({ color: 0x25231f, roughness: .1, metalness: .4, transparent: true, opacity: .6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 }));
      gl.rotation.x = -PI / 2; gl.position.set(R.x, .015, R.z); gl.userData.noCol = true; scene.add(gl);
      const ros = new T.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4, map: tex(cnv(64, (c, w) => { c.clearRect(0, 0, w, w); c.fillStyle = 'rgba(70,96,44,.95)'; for (const [x, y] of [[32, 18], [18, 42], [46, 42]]) { c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); } }), true) });
      const rg = new T.PlaneGeometry(.16, .16); rg.rotateX(-PI / 2); const im = new T.InstancedMesh(rg, ros, 36), m = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3(1, 1, 1);
      for (let i = 0; i < 36; i++) { const a = rand(0, 6.28), r = R.r + rand(-.9, .9); q.setFromAxisAngle(new T.Vector3(0, 1, 0), rand(0, 6.28)); sc.setScalar(rand(.7, 1.3)); im.setMatrixAt(i, m.compose(v.set(R.x + Math.cos(a) * r, .02, R.z + Math.sin(a) * r), q, sc)); }
      im.userData.noCol = true; im.computeBoundingSphere(); scene.add(im);
      const a2 = 2 / 8 * PI * 2 + .2, px = R.x + Math.cos(a2) * (R.r - .72), pz = R.z + Math.sin(a2) * (R.r - .72);
      const pl = new T.Mesh(new T.PlaneGeometry(.2, .12), new T.MeshStandardMaterial({ roughness: .35, metalness: .75, map: tex(cnv(256, (c, w) => { c.fillStyle = '#8f9493'; c.fillRect(0, 0, w, w); c.fillStyle = 'rgba(80,40,20,.35)'; for (let i = 0; i < 30; i++) c.fillRect(rand(0, w), rand(0, w), rand(2, 14), rand(2, 8));
        c.fillStyle = '#1e1e1e'; c.textAlign = 'center'; c.font = 'bold 30px Arial'; c.fillText('AST 7 · MESSPUNKT K', w / 2, 70); c.font = '24px Arial'; c.fillText('Magnetik abweichend', w / 2, 118); c.fillText('nicht graben', w / 2, 152); }), true) }));
      pl.material.map.repeat.set(1, .7); pl.material.map.offset.set(0, .3); pl.position.set(px, .62, pz); pl.rotation.y = Math.atan2(R.x - px, R.z - pz); scene.add(pl);
      note(px + (R.x - px) * .06, .62, pz + (R.z - pz) * .06, () => tief_has('tief_plakette') ? 'Die Messplakette' : 'Eine Plakette am Stein', () => tief_plakette(), .45, .4, .45); }
    // Wrack und Lager bekommen Felsen/Feuerstelle aus demselben Scan
    const C = TIEF.camp; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, o = msGround(msFit(rock.clone(true), .28, 'max')); msPlace(o, C.x - 1.2 + Math.cos(a) * .55, -.03, C.z + .8 + Math.sin(a) * .55, rand(0, 6)); }
  } catch (e) { console.warn('Tiefwald: Steinkreis', e); }
  // --- 5) Weiher: letzter Zettel am Stegpfosten, Stein werfen
  { const J = TIEF.jetty, ang = Math.atan2(J.x1 - J.x0, J.z1 - J.z0), ix = -Math.cos(ang), iz = Math.sin(ang), th = ang - PI / 2; // an die Innenseite des letzten Pfostens, in einer Hülle
    const pp = plane(.11, .15, S.postEnd[0] + ix * .056, .42, S.postEnd[1] + iz * .056, tief_blatt(), 0, th); pp.castShadow = false;
    const sl = new T.Mesh(new T.PlaneGeometry(.125, .165), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .2, roughness: .06, clearcoat: 1, side: T.DoubleSide, depthWrite: false })); sl.position.set(S.postEnd[0] + ix * .058, .42, S.postEnd[1] + iz * .058); sl.rotation.y = th; sl.userData.noCol = true; scene.add(sl); }
  note(S.postEnd[0], .7, S.postEnd[1], () => tief_has('tief_zettel_5') ? 'Das Ende der Wolle' : 'Hier endet die Wolle', () => tief_zettel(5), .5, .9, .5);
  note(TIEF.jetty.x1 + .3, .5, TIEF.jetty.z1 + .3, 'Einen Stein ins Wasser werfen', () => tief_stein(), .9, .6, .9);
  // --- Nebenorte: Schaukel, Autowrack, Jonas' Lager
  { const W = TIEF.swing, wood = msSurfMat('planks_painted', { tint: 0x3e342a }); wood.userData.tile = 1;
    box(.22, 4, .22, W.x - 1.4, 2, W.z, M.wood, { collide: true }); box(.22, 4, .22, W.x + 1.4, 2, W.z, M.wood, { collide: true }); box(3.2, .16, .16, W.x, 3.7, W.z, M.wood);
    const piv = new T.Group(); piv.position.set(W.x, 3.62, W.z); scene.add(piv); for (const s of [-.25, .25]) box(.025, 2.9, .025, s, -1.45, 0, M.wood, { parent: piv, cast: false });
    box(.62, .05, .22, 0, -2.9, 0, wood, { parent: piv }); S.swingPiv = piv;
    note(W.x, 1, W.z, () => tief_S.swingStop > 0 ? '' : 'Die Schaukel anhalten', () => tief_schaukel(), 1.2, 1.2, .8); }
  try { const car = await msModel('car_rusty', 'model.glb'); const o = msGround(msFit(car.clone(true), 4.3, 'max')); msPlace(o, TIEF.wreck.x, -.22, TIEF.wreck.z, 1.9); o.rotation.z = -.06;
    o.traverse(m => { if (m.isMesh && m.material) { m.material = [].concat(m.material).map(x => { const c = x.clone(); if (c.color) c.color.multiplyScalar(.55); return c; }); if (m.material.length === 1) m.material = m.material[0]; } });
    note(TIEF.wreck.x + .33, 1, TIEF.wreck.z - .44, () => tief_has('tief_wrack') ? 'Der Beifahrersitz' : 'Das Autowrack durchsuchen', () => tief_wrack(), .8, 1, .8); } catch (e) { console.warn('Tiefwald: Wrack', e); } // AP-24: kleiner (Beifahrersitz) – der große Kasten verdeckte das Handschuhfach (kapitel6.js) und den Rekorder (neben6.js)
  { const C = TIEF.camp, TX = 81.3, TZ = 233.2; // das eingefallene Zelt: eine Firststange (Whiskey sitzt bei kapitel6 / whiskey.js auf ihr: x 81,3, z 233,2), vorn auf einem Stützstock, hinten auf den Boden gesackt
    const rinde = msSurfMat('bark', { tint: 0x8a7a66 }); for (const k of ['map', 'normalMap', 'roughnessMap', 'aoMap']) if (rinde[k]) { rinde[k] = rinde[k].clone(); rinde[k].repeat.set(.25, 1.2); rinde[k].needsUpdate = true; }
    const hF = 1.12, hB = .46, z0 = TZ - 1.55, z1 = TZ + 1.5, ridge = z => hF + (hB - hF) * (z - z0) / (z1 - z0);
    const pole = (x0, y0, z0_, x1, y1, z1_, r) => { const L = Math.hypot(x1 - x0, y1 - y0, z1_ - z0_), g = new T.CylinderGeometry(r * .8, r, L, 8, 1); const m = new T.Mesh(g, rinde); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0_ + z1_) / 2);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(x1 - x0, y1 - y0, z1_ - z0_).normalize()); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
    pole(TX, ridge(z0) + .02, z0, TX, ridge(z1) + .02, z1, .026); // First
    pole(TX + .05, 0, z0 + .12, TX, ridge(z0 + .12) - .02, z0 + .12, .024).rotation.x += .1; // Stützstock vorn
    const cl = tex(cnv(256, (c, w) => { c.fillStyle = '#4a5740'; c.fillRect(0, 0, w, w); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${rand(20, 90) | 0},${rand(40, 100) | 0},${rand(20, 60) | 0},${rand(.04, .16)})`; c.fillRect(rand(0, w), rand(0, w), rand(1, 4), rand(1, 14)); }
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(30,24,16,${rand(.05, .22)})`; c.beginPath(); c.arc(rand(0, w), rand(w * .6, w), rand(6, 26), 0, 7); c.fill(); } const g = c.createLinearGradient(0, w * .7, 0, w); g.addColorStop(0, 'rgba(40,30,18,0)'); g.addColorStop(1, 'rgba(40,30,18,.55)'); c.fillStyle = g; c.fillRect(0, w * .7, w, w * .3); }), true);
    const canvas = new T.MeshStandardMaterial({ map: cl, roughness: .95, side: T.DoubleSide });
    for (const sd of [-1, 1]) { const NU = 20, NV = 8, g = new T.PlaneGeometry(1, 1, NU, NV), pa = g.attributes.position;
      for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) { const k = j * (NU + 1) + i, u = i / NU, v = j / NV, z = z0 + .1 + (z1 - z0 - .2) * u, h = ridge(z), wd = 1.05 - .35 * u, fold = Math.sin(u * 9 + sd * 1.7 + v * 2.2) * .05 * Math.sin(v * PI) + Math.sin(u * 23 + v * 5) * .012;
        pa.setXYZ(k, TX + sd * (wd * Math.pow(v, .95) + fold * .6), Math.max(.015, h * Math.pow(1 - v, 1.3) - .12 * Math.sin(v * PI) * (1 - u * .4) + fold * .5 * (1 - v)), z); pa.setX(k, pa.getX(k) + sd * .01 * 0); }
      g.computeVertexNormals(); const m = new T.Mesh(g, canvas); m.castShadow = true; m.receiveShadow = true; scene.add(m); }
    const tins = new T.MeshStandardMaterial({ color: 0x7a6e60, roughness: .45, metalness: .8 }); for (let i = 0; i < 5; i++) { const c = new T.Mesh(new T.CylinderGeometry(.04, .04, .11, 10), tins); c.position.set(C.x - 1.2 + rand(-1, 1), .05, C.z + 1.8 + rand(-.4, .4)); c.rotation.z = Math.random() < .5 ? PI / 2 : 0; c.castShadow = true; scene.add(c); }
    note(C.x, .5, C.z, () => tief_has('tief_lager') ? 'Jonas’ Lager' : 'Ein eingefallenes Zelt', () => tief_lager(), 2.2, 1, 2.6); }
  // --- Nebelschwaden und fallende Blätter (nur in der Nähe des Spielers, laufen mit)
  { const n = 220, g = new T.BufferGeometry(), pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { pos[i * 3] = rand(-16, 16); pos[i * 3 + 1] = rand(0, 9); pos[i * 3 + 2] = rand(-16, 16); } g.setAttribute('position', new T.BufferAttribute(pos, 3));
    const leafTex = tex(cnv(64, (c, w) => { c.clearRect(0, 0, w, w); c.translate(w / 2, w / 2); c.rotate(.6); c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, 0, 11, 24, 0, 0, 7); c.fill(); c.fillRect(-1, 18, 2, 10); }), true);
    const lf = new T.Points(g, new T.PointsMaterial({ map: leafTex, color: 0x7a5634, size: .11, alphaTest: .5, transparent: false, depthWrite: true })); lf.frustumCulled = false; lf.visible = false; lf.userData.noCol = true; scene.add(lf); S.leaves = lf;
    const m = 46, mg = new T.BufferGeometry(), mp = new Float32Array(m * 3); for (let i = 0; i < m; i++) { mp[i * 3] = rand(-22, 22); mp[i * 3 + 1] = rand(.2, 1.3); mp[i * 3 + 2] = rand(-22, 22); } mg.setAttribute('position', new T.BufferAttribute(mp, 3));
    const mist = new T.Points(mg, new T.PointsMaterial({ map: typeof fogTex !== 'undefined' ? fogTex : poolTex, color: 0x7a8898, size: 4.2, transparent: true, opacity: .09, depthWrite: false })); mist.frustumCulled = false; mist.visible = false; mist.userData.noCol = true; scene.add(mist); S.mist = mist; }
  // --- Augen im Dunkeln: vier Paare, verschwinden im Lampenlicht
  { const em = new T.MeshBasicMaterial({ color: 0xffcf7a, fog: false }); for (let i = 0; i < 4; i++) { const g = new T.Group(); for (const s of [-1, 1]) { const b = new T.Mesh(new T.SphereGeometry(.022, 6, 4), em); b.position.x = s * .06; g.add(b); } g.visible = false; g.userData.noCol = true; scene.add(g); S.eyes.push({ g, t: rand(5, 20), on: 0 }); } }
  // --- Hinweise für den Kinderblick
  if (typeof hintAdd === 'function') { const H = (id, p, open) => hintAdd({ id, x: p.x, y: 0, z: p.z, kind: 'story', near: 34, open: () => wald_frei() && open() });
    H('tief_1', { x: 39.8, z: 156.3 }, () => !tief_has('tief_zettel_1')); H('tief_2', TIEF.stand, () => !tief_has('tief_zettel_2')); H('tief_3', TIEF.bus, () => !tief_has('tief_zettel_3')); H('tief_4', TIEF.ring, () => !tief_has('tief_zettel_4'));
    H('tief_5', { x: S.postEnd[0], z: S.postEnd[1] }, () => !tief_has('tief_zettel_5')); H('tief_dig', TIEF.dig, () => tief_S.rooted && !tief_has('tief_rotte'));
    hintAdd({ id: 'tief_lager', x: TIEF.camp.x, y: 0, z: TIEF.camp.z, kind: 'geheim', near: 30, open: () => wald_frei() && !tief_has('tief_lager') }); hintAdd({ id: 'tief_wrack', x: TIEF.wreck.x, y: 0, z: TIEF.wreck.z, kind: 'geheim', near: 30, open: () => wald_frei() && !tief_has('tief_wrack') }); }
  story.side.tief_faden = { title: 'Vierzig Mal', desc: 'Hinter Zayns Hütte ist der Zaun eingedrückt. Zwischen den Bäumen dahinter: rote Wolle, von Stamm zu Stamm gespannt.', state: 'hidden' };
  story.side.tief_rotte = { title: 'Vorrat. Nicht anfassen.', desc: 'Am alten Bus wühlen Wildschweine im Boden. Irgendetwas haben sie gerochen.', state: 'hidden' };
  modItem('jonas_karte', 'Jonas’ Karte', 'Mit Kuli auf Karopapier: der Wald, die Wege, fünf Kreuze. Am Weiher: „ENDE“.', 'paper');
  S.statics = scene.children.slice(n0);
  S.ready = true;
}]);
// ---------------------------------------------------------------- Tiere (nach dem Laden von leben.js)
function tief_beasts() {
  const S = tief_S, L = leben_S; if (!L || !L.M || !L.M.wolf || !L.root) return false; const R = TIEF.ring;
  for (let i = 0; i < 3; i++) { const W = leben_beast('wolf', rand(1.05, 1.18)); if (!W) continue; W.a = i * 2.1; W.r = rand(15, 20); W.dir = i % 2 ? 1 : -1; W.g.position.set(R.x + Math.cos(W.a) * W.r, 0, R.z + Math.sin(W.a) * W.r); W.st = 'roam'; W.t = rand(2, 6); W.off = (i - 1) * 2.6; W.cool = 0; W.lit = 0; leben_play(W, 'Walk', 0); S.wolves.push(W); }
  if (L.M.pig) for (let i = 0; i < 3; i++) { const B = leben_beast('pig', i === 0 ? 1.05 : rand(.72, .85)); if (!B) continue;
    B.m.traverse(o => { if (o.isMesh && o.material) { o.material = [].concat(o.material).map(x => { const c = x.clone(); if (c.color) c.color.setRGB(.2, .15, .11); c.roughness = 1; return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
    B.home = [TIEF.dig.x + rand(-2, 2), TIEF.dig.z + rand(-2, 2)]; B.g.position.set(B.home[0], 0, B.home[1]); B.g.rotation.y = rand(0, 6.28); B.st = 'root'; B.t = rand(1, 4); leben_play(B, 'SniffleforFood', 0); S.boars.push(B); }
  if (L.M.deer) for (let i = 0; i < 2; i++) { const D = leben_beast('deer', rand(.95, 1.05)); if (!D) continue; D.home = [TIEF.camp.x - 12 + rand(-4, 4), TIEF.camp.z - 14 + rand(-4, 4)]; D.g.position.set(D.home[0], 0, D.home[1]); D.st = 'graze'; D.t = rand(1, 5); leben_play(D, 'IdleGraze', 0); S.deer.push(D); }
  return true;
}
// ---------------------------------------------------------------- Klänge, die es noch nicht gab
Object.assign(Audio, {
  grunt(x, z, loud, g) { if (!this.ctx) return; const d = this.at(x, .5, z, loud ? 6 : 4, g ? { obj: g, h: .5 } : undefined); if (this.cut) return; for (let k = 0; k < (loud ? 2 : 3); k++) { const n = this.noise(false), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(260, 420); bp.Q.value = 1.6; n.connect(bp); this.env(bp, loud ? .5 : .22, .01, .16, k * .21, d); n.stop(this.ctx.currentTime + 1.2); }
    if (loud) { const o = this.osc('sawtooth', 820, .1, .7), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 1.4; o.frequency.setValueAtTime(700, this.ctx.currentTime + .1); o.frequency.linearRampToValueAtTime(1500, this.ctx.currentTime + .35); o.frequency.linearRampToValueAtTime(900, this.ctx.currentTime + .75); o.connect(bp); this.env(bp, .22, .02, .6, .1, d); } },
  growl(x, z, loud, g) { if (!this.ctx) return; this.play('dog', { gain: loud ? .55 : .26, rate: loud ? .42 : .5, x, y: .6, z, ref: 3, dur: loud ? 1.1 : .7, lp: 900, obj: g, h: .6 }); },
});
// ---------------------------------------------------------------- Die Zettel
const TIEF_ZETTEL = {
  1: ['Suche Nr. 1 · 30. Juli 2009', 'Ich hab Mamas rote Wolle genommen. Die ganze Rolle.\nIch binde sie an die Bäume, damit ich zurückfinde. Und damit Zayn sie findet, falls er rausläuft. Rot sieht man auch nachts.\n\nWenn du das liest und nicht Zayn bist: Geh nach Hause.\n— Jonas W., 9'],
  2: ['Suche Nr. 6 · Oktober 2009', 'Vom Hochsitz sieht man ein Licht. Hinten, wo der Wald aufhört.\nAber er hört da nicht auf. Ich bin zwei Stunden gelaufen und er hört nicht auf.\n\nMama weiß nicht, dass ich hier bin. Sie zählt jede Nacht die Kinder auf der Kreuzung. Ich sitz daneben, damit sie nicht allein zählt.\n— J.'],
  3: ['Suche Nr. 17 · März 2011', 'Ein Bus vom Amt. Mitten im Wald. Es gibt keinen Weg hierher, und die Bäume um ihn rum sind älter als der Bus.\nDrinnen sieben Kindersitze. Auf einem klebt ein Z. Ich hab es abgemacht und in die Tasche gesteckt.\n\nIch hab Mama nichts gesagt. Sie geht jeden Morgen ins Amt. Wenn ich frage, was sie da macht, sagt sie: Das Amt gibt es nicht.\n— J.'],
  4: ['Suche Nr. 29 · Juli 2013', 'Die Stöckchenmänner. Sieben hängen im Kreis. Die hat keiner von uns gemacht.\nIch hab sie jedes Mal gezählt. Vier Jahre lang sieben.\n\nHeute waren es acht.\nDer achte hängt tiefer. Als wäre er kleiner. Oder als wäre er für einen, der noch wächst.\n— J.'],
  5: ['Suche Nr. 40 · 23. Juli 2016', 'Hier hört die Wolle auf. Die Rolle ist leer. Der Wald nicht.\n\nIch hör auf zu suchen, Zayn. Nicht weil ich dich vergessen hab. Mama sagt, wir müssen weiterleben. Ich weiß nicht, wie das geht, ohne dass es sich anfühlt wie Vergessen.\n\nIch lass das Ende ins Wasser hängen. Falls du da unten bist: zieh dran. Dann weiß ich es.\n— Jonas'],
};
function tief_zettel(i) {
  const k = 'tief_zettel_' + i, [t, txt] = TIEF_ZETTEL[i];
  if (tief_has(k)) return openNote(t, tief_note(txt));
  story.lore.push({ key: k, title: 'Vierzig Mal · ' + t, html: tief_note(txt) }); Audio.paper(); sideStart('tief_faden');
  const n = [1, 2, 3, 4, 5].filter(j => tief_has('tief_zettel_' + j)).length;
  if (i < 5) story.side.tief_faden.desc = `Jonas hat seinen Bruder vierzig Mal in diesem Wald gesucht. Die rote Wolle führt tiefer hinein. Zettel: ${n} / 5.`;
  openNote(t, tief_note(txt), null, () => tief_zettelNach(i, n));
  if (i === 5) return tief_weiher();
  const G = { 1: ['tief_z1', 'Jonas. Neun Jahre alt, allein, mit einem Wollknäuel gegen einen ganzen Wald.'], 2: ['tief_z2', 'Ein Licht, hinten, wo der Wald aufhört … Vom Hochsitz müsste man es sehen.'],
    3: ['tief_z3', 'Ein Bus vom Amt. Sieben Sitze. Mitten im Wald, wo keine Straße hinführt. Wer ist damit gefahren – und wohin?'], 4: ['tief_z4', 'Für einen, der noch wächst. … Ich war dreizehn. Ich bin gewachsen.'] }[i];
  if (G && typeof gedanke === 'function') gedanke(G[0], G[1], 1200, 3);
  if (typeof saveGame === 'function') saveGame(curChapter());
}
// AP-24 (N6-5): Lukes Zeilen nach den Zetteln – „Geh ich nicht“, die vierzig Kerben am Hochsitz, und auf halbem Weg der Satz, der der Aufgabe den Namen gibt
async function tief_zettelNach(i, n) { const S = tief_S; if (S.told.has('zn' + i)) return; S.told.add('zn' + i); await wait(500);
  if (i === 1) await say([['Bin ich nicht. Geh ich nicht. Tut mir leid, Jonas.', 3200, 'LUKE']]);
  if (i === 2) { await say([['<i>In den linken Holm der Leiter sind Kerben geschnitten. Eine pro Suche. Die ersten krumm, die letzten gerade. Du zählst mit dem Finger.</i>', 5200], ['Vierzig. Und die letzte hat er richtig reingehauen.', 3200, 'LUKE']]); }
  if (n === 3 && i < 5 && !S.told.has('vierzig')) { S.told.add('vierzig'); await wait(1500); await say([['Vierzig Mal war er hier. Und ich seh ihn nicht einmal. Der Wald hat jede Suche aufgegessen.', 4600, 'LUKE']]); } }
function tief_plakette() { // AP-24 (N6-5, Suche 29): Andeutung Landeplatz – als Witz gemeint
  const h = 'Eine Plakette aus Blech, mit zwei Nieten in den Stein geschlagen. Die Steine sind älter als alles im Dorf. Im Kreis ist der Boden glatt und glasig, als wäre Sand einmal geschmolzen. Das Moos wächst in kleinen Rosetten aus je drei Punkten.\n\n<b>AST 7 · Messpunkt K · Magnetik abweichend · nicht graben</b>';
  if (!tief_has('tief_plakette')) { story.lore.push({ key: 'tief_plakette', title: 'Messpunkt K', html: h }); openNote('Eine Plakette am Stein', h, null, () => setTimeout(() => subtitle('Ein Landeplatz. Für Hubschrauber, bevor’s Hubschrauber gab.', 3400, 'LUKE'), 400)); } else openNote('Messpunkt K', h); }
function tief_fahrtenbuch() {
  const t = 'Fahrtenbuch', h = 'Ein Fahrtenbuch in einer Klarsichthülle, aufgequollen. Die ersten Seiten 1958, gleiche Handschrift bis zum Schluss.\n\nLetzte Eintragung:\n<b>28.07.2009 · 23:40 · Verschwunden: 7</b>\n<b>05.08.2009 · 03:13 · Rückgeführt: 6 · Offen: 1</b>\nGez. Dr. T. Seiler\n\nDarunter, mit Bleistift, eine andere Hand: <i>„Drei Uhr dreizehn. Sie kommt noch.“</i>';
  if (typeof hungrige_S !== 'undefined' && hungrige_S.epilog) return openNote(t, h + '\n\nDarunter, frisch, mit Bleistift, in einer kleinen, geraden Schrift: <span class="hand">„Offen: 1. Und einer, der es nie war.“</span>'); // Kap. 6 nach dieser Nacht (AP-23)
  if (!tief_has('tief_fahrtenbuch')) { story.lore.push({ key: 'tief_fahrtenbuch', title: 'Das Fahrtenbuch des Amtes', html: h }); if (typeof gedanke === 'function') gedanke('tief_fb', 'Seiler hat es selbst unterschrieben. Sieben verschwunden, sechs zurück. „Offen: 1“ – als wäre Zayn eine Zahl, die nicht aufgeht.', 1500, 3); }
  openNote(t, h);
}
// ---------------------------------------------------------------- Hochsitz: hinauf/hinunter (wie Cleos Leiter)
function tief_climb(up) {
  const S = tief_S, H = TIEF.stand, y = S.standY || 3.1; if (S.climbing || (up && player.pos.y > 1.5) || (!up && player.pos.y < 1.5)) return; S.climbing = true; state.talking = true; let t = 0;
  const from = player.pos.clone(), bot = new THREE.Vector3(H.x, 0, H.z - 2.2), top = new THREE.Vector3(H.x, y, H.z - .3);
  Audio.play('woodSqueak1', { gain: .3, rate: .85 });
  setScripted(dt => { t += dt; const p = player.pos;
    if (t < .4) p.lerpVectors(from, up ? bot : top, t / .4);
    else if (t < 2.6) { const k = (t - .4) / 2.2, kk = up ? k : 1 - k; p.set(H.x, y * kk, H.z - 2.2 + 1.9 * kk); if (Math.floor(t * 3) !== Math.floor((t - dt) * 3)) Audio.play('woodSqueak1', { gain: .12, rate: rand(.85, 1.15) }); }
    else { p.copy(up ? top : bot); S.climbing = false; state.talking = false; if (up) tief_obenAngekommen(); return false; } });
}
function tief_obenAngekommen() {
  if (typeof k6_oben === 'function' && k6_oben()) return; // Kapitel 6, Epilog: oben schläft der Junge – keine Gestalt, kein Gedanke ans Licht
  const S = tief_S; if (!S.told.has('stand')) { S.told.add('stand'); setTimeout(() => { if (typeof gedanke === 'function') gedanke('tief_stand', 'Da hinten. Ein Licht über dem Wasser. Jonas hatte recht.', 0, 3); }, 1800);
    // Schreckmoment: unten an der Leiter steht jemand und sieht herauf
    setTimeout(() => { if (player.pos.y > 2) tief_figur(TIEF.stand.x + 1.5, TIEF.stand.z - 10, 'pale', .62, true); }, 6500); } // ein Kind, unten zwischen den Bäumen, sieht herauf
}
// ---------------------------------------------------------------- N6-6 · „Vorrat. Nicht anfassen.“: Erde durchsuchen (E halten), wenn die Rotte weg ist (Licht oder die Scheinwerfer der Falle)
function tief_dig() {
  const S = tief_S; if (tief_has('tief_rotte')) return;
  if (!S.rooted) { sideStart('tief_rotte'); return toast('Hier haben Wildschweine gewühlt. Solange die Rotte da ist, kommst du nicht an die Stelle – sie verteidigen, was sie gefunden haben. Licht vertreibt sie vielleicht.', 5200); }
  if (S.dig) return; S.dig = { t: 0 }; if (!S.told.has('digTip')) { S.told.add('digTip'); toast('Graben: E halten.', 2200); }
}
function tief_digTick(dt, P) { const S = tief_S, D = S.dig; if (!D) return; const I = $('sideInfo');
  if (!keys.KeyE || Math.hypot(P.x - TIEF.dig.x, P.z - TIEF.dig.z) > 2.6 || state.talking) { S.dig = null; I.textContent = ''; return; }
  D.t += dt; if (Math.floor(D.t * 2.5) !== Math.floor((D.t - dt) * 2.5)) Audio.play('scrape2', { gain: .14, rate: rand(1.3, 1.7), x: TIEF.dig.x, y: .1, z: TIEF.dig.z });
  I.textContent = '▮'.repeat(Math.ceil(D.t / 2.4 * 8)).padEnd(8, '▯'); if (D.t >= 2.4) { S.dig = null; I.textContent = ''; tief_digFund(); } }
function tief_digFund() {
  if (tief_has('tief_rotte')) return; const S = tief_S;
  story.lore.push({ key: 'tief_rotte', title: 'Vorrat. Nicht anfassen.', html: 'Eine rostige Dose, von Hauern zerkratzt. Darin, in eine Zeitungsseite vom März 2012 gewickelt: zwei Batterien und ein Zettel: <span class="hand">„Vorrat. Nicht anfassen. — J.“</span>\n\nDie Zeitungsseite: „Bundesstelle schließt – Dank an die treuen Mitarbeiter“. Hilde mit Blumenstrauß. Jonas hat seine Batterien in seine Mutter gewickelt.\n\nUnter den beiden eine dritte Batterie, neuer, mit drei parallelen Kratzern. Die ist nicht von Jonas.' });
  addBattery(3); if (typeof sammeln_z === 'function') try { sammeln_z(6, true); } catch (e) {} // Z-06 als Fibel-Seite
  sideDone('tief_rotte', 'Jonas’ Vorrat: zwei Batterien in Hildes Zeitungsseite. Und eine dritte, mit drei Kratzern. Jemand hat dazugelegt.'); Audio.play('metalHit1', { gain: .2, rate: 1.7 });
  openNote('Eine Blechdose', 'Rostig, von Hauern zerkratzt. Darin, in eine Zeitungsseite vom März 2012 gewickelt: zwei Batterien. Und ein Zettel: <span class="hand">„Vorrat. Nicht anfassen. — J.“</span>\n\nDie Zeitungsseite ist aus dem Laternenboten: <b>Bundesstelle schließt – Dank an die treuen Mitarbeiter</b>. Das Foto: Hilde mit einem Blumenstrauß. Sie lächelt nicht.\n\nJonas hat seine Batterien in seine Mutter gewickelt.\n\nUnter den beiden liegt eine dritte. Neuer. Mit drei parallelen Kratzern.\n\nEntschuldige, Jonas.', null, async () => {
    await wait(1200); const koeder = typeof K6 !== 'undefined' && (K6.v11 || K6.falleAn); // „Köder“ erst, wenn Luke das Wort gehört hat (V-11 oder die Falle)
    await say([['Das Amt hat Batterien, die Schweine haben Batterien, und du hast auch welche, wer immer du bist. Ich bin der ' + (koeder ? 'bestversorgte Köder' : 'bestversorgte Idiot') + ' im Landkreis.', 5400, 'LUKE']]);
    const F = S.boars.find(B => B.st === 'gone' && B !== S.boars[0]); if (F) { const P = player.pos, f = flatDir(); F.g.position.set(P.x - f.x * 3.2 + f.z * 1.2, 0, P.z - f.z * 3.2 - f.x * 1.2); F.g.visible = true; F.st = 'flee'; F.sp = 3.4; F.tx = F.g.position.x - f.x * 30; F.tz = F.g.position.z - f.z * 30; leben_play(F, 'Run', .15); Audio.grunt(F.g.position.x, F.g.position.z, false, F.g);
      setTimeout(() => subtitle('<i>Hinter dir trägt ein Frischling die leere Dose davon.</i>', 3000), 600); } }); // Humor: der Frischling mit der Dose
}
// ---------------------------------------------------------------- Der achte Stöckchenmann
function tief_achter() {
  const S = tief_S; if (tief_has('tief_achter')) return openNote('Der achte Stöckchenmann', 'Am Hals ein Pappschild, mit Wolle festgebunden:\n\n<b>08 · L.</b>');
  story.lore.push({ key: 'tief_achter', title: 'Der achte Stöckchenmann', html: 'Sieben Stöckchenmänner hängen im Steinkreis. Der achte hängt tiefer – für einen, der noch wächst. Am Hals ein Pappschild: <b>08 · L.</b>\n\nL. Wie Luke? Oder wie Lucy?' });
  Audio.play('woodCrack', { gain: .25, rate: 1.4, x: S.eighth.g.position.x, y: S.eighth.g.position.y, z: S.eighth.g.position.z, ref: 2 }); openNote('Der achte Stöckchenmann', 'Kleiner als die anderen. Die Zweige sind frischer, die Wolle ist rot. Am Hals ein Pappschild, mit Wolle festgebunden:\n\n<b>08 · L.</b>\n\nL.\nWie Luke.');
  S.behind = { armed: true, t: 0 }; if (typeof gedanke === 'function') gedanke('tief_achter', '08 · L. Seit 2013 hängt er hier. Für einen, der noch wächst. … Warum denk ich sofort an mich?', 1500, 3);
}
// ---------------------------------------------------------------- Weiher: das Ende der Wolle (N6-5, Suche 40) – Blechschild, zwei Rucke, Wahl: festhalten (Stufe 2) oder loslassen; dann „Für Samstag.“
async function tief_weiher() {
  const S = tief_S; if (S.pondDone) return; S.pondDone = true;
  const wait_ = ms => new Promise(r => setTimeout(r, ms)); await wait_(900); while (ui.overlay) await wait_(200);
  let fest = true; state.talking = true; try { // try/finally: state.talking wird immer zurückgesetzt
  await say([['<i>Am Pfosten des Stegs ein Blechschild: „BfR · AST 7 · Probe T · nicht bergen · zieht“.</i>', 4400], ['Das Amt hat ein Schild für einen Teich. Das ist das erste ehrliche Schild, das ich von denen seh.', 4400, 'LUKE']]);
  await say([['Du nimmst das Ende der Wolle in die Hand. Es verschwindet im schwarzen Wasser.', 4200], ['Es ist straff gespannt.', 2400]]);
  Audio.creak(.25, S.postEnd[0], .5, S.postEnd[1]); shake = .02; await wait_(900); Audio.play('waterLoop', { gain: .25, offset: 1, dur: 1.2, rate: .7, x: TIEF.pond.x, y: 0, z: TIEF.pond.z, ref: 4 });
  await say([['Ein Ruck. Von unten. Einmal. Zweimal.', 3200]]);
  if (typeof k6_wahl === 'function' && typeof K6 !== 'undefined' && K6.wahl) { state.talking = false; const w = await k6_wahl(['Festhalten.', 'Loslassen.'], 15000); state.talking = true; fest = w !== 1; }
  if (fest) { // Stufe 2: der Zug reißt Luke auf die Knie, die Wolle reißt
    scareCount++; Audio.play('waterLoop', { gain: .45, offset: 2, dur: .8, rate: .55, x: TIEF.pond.x, y: 0, z: TIEF.pond.z, ref: 4 }); Audio.creak(.4, S.postEnd[0], .5, S.postEnd[1]); shake = .14; glitchV = .5; player.pitch = Math.max(-1, player.pitch - .5);
    const y0 = camY; camY = .95; setTimeout(() => { camY = y0; }, 1400); Audio.heart();
    if (S.thread) { S.thread.count = S.threadN - 3; S.thread.instanceMatrix.needsUpdate = true; }
    await say([['Der Zug reißt dich auf die Knie. Dann gibt die Wolle nach.', 3600], ['Das Ende ist abgerissen.', 2600]]); }
  else { if (S.thread) { S.thread.count = S.threadN - 3; S.thread.instanceMatrix.needsUpdate = true; } await say([['Du lässt los. Die Wolle gleitet ins Schwarze, lautlos. Keine Welle.', 4200]]); }
  await wait_(900); await say([['Du knotest den Rest der Rolle an den Pfosten. Fest. Zweimal rum.', 3600], ['Für Samstag.', 2200, 'LUKE']]);
  } finally { state.talking = false; }
  story.lore.push({ key: 'tief_weiher', title: 'Vierzig Mal', html: 'Am Weiher endet Jonas’ Wolle. Er hat das Ende ins Wasser gehängt: „Falls du da unten bist: zieh dran.“\n\nEs hat gezogen. Zweimal. ' + (fest ? 'Ich hab festgehalten, bis sie gerissen ist.' : 'Ich hab losgelassen.') + ' Den Rest der Rolle hab ich an den Pfosten geknotet.\n\n<span class="hand">Jonas kommt Samstag. Ich zeig ihm, dass jemand gezogen hat.</span>' });
  sideDone('tief_faden', 'Am Weiher endet die Wolle. Jonas hat vierzig Mal gesucht. Und jemand hat gezogen.'); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('J-15'); } catch (e) {}
  if (typeof gedanke === 'function') gedanke('tief_weiher', 'Jonas hat nie erfahren, ob jemand zieht. … „Vielleicht wird man vergessen, wenn sie anfangen, ohne einen weiterzuleben.“ Er hat nicht vergessen. Er hat nur aufgehört.', 3000, 3);
}
function tief_stein() {
  Audio.play('stones1', { gain: .2, rate: 1.4 }); if (tief_S.stein) return toast('Du wirfst noch einen. Wieder nichts. Kein Aufschlag, keine Welle.', 3000); tief_S.stein = true;
  setTimeout(() => { Audio.giggle(TIEF.pond.x, -2, TIEF.pond.z); subtitle('<i>Kein Platschen. Keine Welle. Nur, sehr weit unten, ganz leise: ein Kind, das „Hier!“ ruft.</i>', 4800); }, 2600);
  if (!tief_has('tief_stein')) story.lore.push({ key: 'tief_stein', title: 'Der Weiher hat keinen Grund', html: 'Ein Stein fällt ins Wasser – und kommt nie unten an. Ganz weit unten ruft ein Kind: „Hier!“' });
}
// ---------------------------------------------------------------- Schaukel, Wrack, Lager
function tief_schaukel() {
  const S = tief_S; if (S.swingStop > 0) return; S.swingStop = 3.2; S.swingW = 0; Audio.creak(.2, TIEF.swing.x, 3.6, TIEF.swing.z);
  setTimeout(() => { const W = TIEF.swing; Audio.whisper(W.x, 1.2, W.z, 1.2); subtitle('<i>Ganz nah an deinem Ohr, ein Kind: „Noch mal!“</i>', 2600); Audio.giggle(W.x + .5, 1, W.z); S.swingW = 1.8; shake = .03; }, 3000);
  if (!tief_has('tief_schaukel')) story.lore.push({ key: 'tief_schaukel', title: 'Die Schaukel im Wald', html: 'Eine Schaukel zwischen zwei Holzpfosten, tief im Wald. Sie schwingt ohne Wind. Wer sie anhält, hört: „Noch mal!“' });
}
function tief_wrack() {
  const h = 'Auf dem Beifahrersitz, vom Regen gewellt, eine Kinderzeichnung: eine große Frau in einem langen, dunklen Kleid. In der Hand eine Laterne, deren Flamme gerade nach oben steht. An ihrem Rock halten sich sieben kleine Strichkinder fest.\n\nDarunter, in Erwachsenenschrift, fast weggewischt:\n<span class="hand">„Sie kommt noch.“</span>';
  if (!tief_has('tief_wrack')) { story.lore.push({ key: 'tief_wrack', title: 'Die Frau mit der Laterne', html: h }); if (typeof gedanke === 'function') gedanke('tief_wrack', 'Die Frau mit der Laterne. „Sie kommt noch.“ Genau das steht auf dem ältesten Stein am Kirchberg. … Wer?', 1500, 3); }
  openNote('Die Zeichnung im Wrack', h);
}
function tief_lager() {
  if (tief_has('tief_lager')) return openNote('Jonas’ Karte', tief_karte());
  story.lore.push({ key: 'tief_lager', title: 'Jonas’ Lager', html: 'Ein eingefallenes Zelt, Konservendosen, eine Feuerstelle. Jonas hat hier übernachtet – mit dreizehn, vierzehn. In der Zeltplane: eine Karte des Waldes, fünf Kreuze.' });
  addItem('jonas_karte'); addBattery(1); openNote('Jonas’ Karte', tief_karte());
  if (typeof gedanke === 'function') gedanke('tief_lager', 'Er hat hier geschlafen. Allein, mitten im Wald, mit dreizehn. Und ich hab ihn nie gefragt, wie es ihm geht.', 1500, 3);
}
function tief_karte() { return 'Mit Kuli auf Karopapier, oft radiert. Unten der Zaun, „LOCH“. Dann eine gestrichelte Linie, rot nachgemalt:\n\n<b>✕ HOCHSITZ</b> („Licht!“) → <b>✕ BUS</b> („Amt!!“) → <b>✕ KREIS</b> („nicht zählen“) → <b>✕ WEIHER</b> („ENDE“)\n\nAm Rand: <i>Schweine am Bus. Wölfe am Kreis – nicht rennen, Lampe an. Links ein Auto. Rechts eine Schaukel („nicht anhalten!“).</i>'; }
// ---------------------------------------------------------------- Schreckmomente
// Gestalt, die nur kurz dasteht: verschwindet, wenn man sie ansieht (ausgeliehen: die Gestalt des Grundspiels, solange der Regisseur sie nicht braucht)
function tief_figur(x, z, face = 'pale', scale = 1, stinger = false) {
  if (dir.busy || !stalker) return false; setFace(stalker, face); stalker.scale.setScalar(scale); stalker.position.set(x, 0, z); stalker.visible = true; dir.busy = true;
  tief_S.fig = { t: 0, seen: 0, stinger }; return true;
}
function tief_figurWeg() { stalker.visible = false; stalker.scale.setScalar(1); dir.busy = false; tief_S.fig = null; }
const _tfw = new THREE.Vector3(), _tft = new THREE.Vector3();
WORLD_TICK.push((dt, t) => {
  const S = tief_S; if (!S.ready || !state.started || menu.attract) return;
  // Kapitel 1–5: gesperrt – kein Tick, alles unsichtbar (vom Ort aus liegt der tiefe Wald ohnehin hinter dem Nebel)
  if (!wald_frei()) { if (!S.off) { S.off = true; wald_huelle(S, false); for (const V of [...S.wolves, ...S.boars, ...S.deer]) V.g.visible = false; for (const E of S.eyes) { E.g.visible = false; E.on = 0; } if (S.fogSet) { ENV_DARK = 0; S.fogSet = false; S.k = 0; } } return; }
  if (S.off) { S.off = false; wald_huelle(S, true); S.chunkT = 0; }
  const P = player.pos, inside = tief_in(P.x, P.z, 2), near = P.z > 140 && P.x > TIEF.x0 - 25 && P.x < TIEF.x1 + 25;
  // Blöcke nach Kameraabstand
  S.chunkT -= dt; if (S.chunkT < 0) { S.chunkT = .25; const cx = camera.position.x, cz = camera.position.z; for (const c of S.chunks) { const d = Math.hypot(c.x - cx, c.z - cz), v = near && d < c.vis; for (const m of c.meshes) { m.visible = v; m.castShadow = d < c.sh; } } }
  if (!S.beastsOk && typeof leben_S !== 'undefined' && leben_S.ready) S.beastsOk = tief_beasts() || (S.beastTry = (S.beastTry || 0) + 1) > 3;
  // Tiefe → Dunkelheit und Nebel (nur hier; beim Verlassen zurück)
  const k = inside ? Math.max(0, Math.min(1, (P.z - 160) / 70)) : 0; S.k += (k - S.k) * Math.min(1, dt * 1.5);
  if (S.k > .005 && state.zone !== 'canal') { ENV_DARK = S.k * .45; scene.fog.density = .034 * (1 + S.k * .75); S.fogSet = true; }
  else if (S.fogSet) { ENV_DARK = 0; if (state.zone !== 'canal') scene.fog.density = .034; S.fogSet = false; S.k = 0; }
  if (inside !== S.inside) { S.inside = inside; if (inside && !S.told.has('in')) { S.told.add('in'); sideStart('tief_faden'); if (typeof gedanke === 'function') gedanke('tief_rein', 'Hier waren wir nie. Nicht mal wir. … Die Wolle führt tiefer rein.', 600, 3);
      // Schreckmoment: Krähen brechen über dir aus den Bäumen
      setTimeout(() => { for (let i = 0; i < 5; i++) setTimeout(() => Audio.flap(P.x + rand(-4, 4), rand(4, 8), P.z + rand(-4, 4)), i * 90); Audio.caw(P.x, 7, P.z + 3); Audio.caw(P.x - 2, 6, P.z - 2); shake = .03; scareCount++; }, 5200); } }
  // Schaukel, Stöckchenmänner, fernes Licht, Blätter, Nebel
  if (near) {
    if (S.swingPiv && typeof umwelt_pendel === 'function') { if (S.swingStop > 0) S.swingStop -= dt; if (S.swingW > 1) S.swingW = Math.max(1, S.swingW - dt * .05); } // Pendel, Anstoßen, Knarren: umwelt.js (Ziel .42 · swingW)
    else if (S.swingPiv) { if (S.swingStop > 0) S.swingStop -= dt; S.swingPiv.rotation.x = Math.sin(t * 1.3) * .42 * S.swingW; if (S.swingW > 1) S.swingW = Math.max(1, S.swingW - dt * .05);
      const ds = Math.hypot(P.x - TIEF.swing.x, P.z - TIEF.swing.z); if (Math.sign(Math.cos(t * 1.3)) !== S.swLast) { S.swLast = Math.sign(Math.cos(t * 1.3)); if (ds < 20 && S.swingW > .2) Audio.creak(.06, TIEF.swing.x, 3.6, TIEF.swing.z); } }
    for (const f of S.figs) { f.g.rotation.y += Math.sin(t * .4 + f.ph) * .004; f.g.position.y = f.y0 + Math.sin(t * .7 + f.ph) * .03; }
    if (S.pondLight) { const dp = Math.hypot(P.x - TIEF.pond.x, P.z - TIEF.pond.z), want = !tief_has('tief_weiher') && (P.y > 2.5 || (dp < 40 && dp > 12)) ? .5 + Math.sin(t * 1.7) * .12 : 0; S.pondLight.material.opacity += (want - S.pondLight.material.opacity) * Math.min(1, dt * 2); }
    const lvOn = inside || wald_in(P.x, P.z); S.leaves.visible = lvOn; S.mist.visible = lvOn;
    if (lvOn) { S.leaves.position.set(P.x, 0, P.z); S.mist.position.set(P.x, 0, P.z); const a = S.leaves.geometry.attributes.position, arr = a.array; for (let i = 0; i < arr.length; i += 3) { arr[i + 1] -= dt * (.35 + (i % 7) * .05); arr[i] += Math.sin(t * .8 + i) * dt * .25; if (arr[i + 1] < 0) { arr[i + 1] = rand(6, 9); arr[i] = rand(-16, 16); arr[i + 2] = rand(-16, 16); } } a.needsUpdate = true;
      S.mist.material.opacity = .06 + S.k * .08; }
  }
  // Weiher: kein Hineinlaufen (Rückmeldung statt unsichtbarer Wand)
  if (tief_pond(P.x, P.z, -.4) && !tief_onJetty(P.x, P.z) && S.lastP) { P.x = S.lastP.x; P.z = S.lastP.z; vel.set(0, 0, 0); if ((S.wetT || 0) <= 0) { S.wetT = 6; toast('Das Wasser ist eiskalt und fällt gleich am Rand steil ab. Keinen Schritt weiter.', 3200); Audio.play('waterLoop', { gain: .12, offset: rand(0, 3), dur: .4 }); } }
  if (S.wetT > 0) S.wetT -= dt; if (!S.lastP) S.lastP = new THREE.Vector3(); S.lastP.copy(P);
  if (!near) { for (const V of [...S.wolves, ...S.boars, ...S.deer]) V.g.visible = false; return; }
  const ok = tief_ok(), spd = Math.hypot(vel.x, vel.z), lit = (V, maxD = 24) => { const p = V.g.position, d = Math.hypot(p.x - P.x, p.z - P.z); return flashOn && d < maxD && leben_facing(p.x, p.y + .6, p.z) > .965; };
  // --- Wölfe: umkreisen den Steinkreis; lauern dir nach; Licht treibt sie zurück; wer ihnen zu nah kommt, den springt einer an (außer der Welpe ist frei)
  const calm = tief_has('wald_welpe') || story.lore.some(l => l.key === 'wald_welpe'), R = TIEF.ring;
  for (const W of S.wolves) { W.g.visible = true; leben_beastUpd(W, dt, 70); const p = W.g.position, d = Math.hypot(p.x - P.x, p.z - P.z); W.cool -= dt;
    if (W.st === 'roam') { if (W.howl > 0) W.howl -= dt; else { W.a += dt * .07 * W.dir; W.tx = R.x + Math.cos(W.a) * W.r; W.tz = R.z + Math.sin(W.a) * W.r; W.sp = 1.3; leben_beastMove(W, dt); leben_play(W, 'Walk', .4); }
      W.t -= dt; if (W.t < 0) { W.t = rand(12, 26); if (d < 60 && Math.random() < .45 && !tief_still()) { leben_play(W, 'Howl', .3, 1, true); leben_howl(p.x, p.y + .8, p.z); W.howl = 2.5; } }
      if (d < 22 && W.cool <= 0 && ok) { W.st = 'stalk'; if (!S.told.has('wolf')) { S.told.add('wolf'); if (typeof gedanke === 'function') gedanke('tief_wolf', calm ? 'Die Wölfe. Sie kommen nicht näher. … Erkennen sie mich? Wegen des Welpen?' : 'Wölfe. Drei. Nicht rennen. Nicht rennen. Lampe drauf.', 200, 3); } } }
    else if (W.st === 'stalk') { const want = calm ? 12 : 8, ax = p.x - P.x, az = p.z - P.z, al = Math.hypot(ax, az) || 1; W.tx = P.x + ax / al * want - az / al * W.off; W.tz = P.z + az / al * want + ax / al * W.off; W.sp = spd > 3 ? 4.5 : 2.2;
      const arrived = leben_beastMove(W, dt, false); W.g.rotation.y = leben_ang(W.g.rotation.y, Math.atan2(P.x - p.x, P.z - p.z), Math.min(1, dt * 4)); leben_play(W, arrived ? (calm ? 'IdleBreathe' : 'IdleAggressive') : 'Walk', .3);
      W.t -= dt; if (W.t < 0 && !calm) { W.t = rand(2.5, 5); if (!tief_still()) Audio.growl(p.x, p.z, false, W.g); }
      if (lit(W)) W.lit += dt; else W.lit = Math.max(0, W.lit - dt);
      if (W.lit > 1.1) { W.st = 'back'; W.cool = 18; W.lit = 0; const bl = Math.hypot(ax, az) || 1; W.tx = p.x + ax / bl * 14; W.tz = p.z + az / bl * 14; W.sp = 5; leben_play(W, 'Run', .15); Audio.growl(p.x, p.z, false, W.g); }
      else if (!calm && !S.lunged && d < 5.2 && ok) { S.lunged = true; W.st = 'lunge'; W.sp = 9.5; leben_play(W, 'RunBite', .1); }
      else if (d > 34 || !ok) W.st = 'roam'; }
    else if (W.st === 'lunge') { const ax = p.x - P.x, az = p.z - P.z, al = Math.hypot(ax, az) || 1; W.tx = P.x + ax / al * 1.3; W.tz = P.z + az / al * 1.3;
      if (leben_beastMove(W, dt) || d < 1.5) { scareCount++; Audio.growl(p.x, p.z, true, W.g); Audio.scareSound('growl'); shake = .14; glitchV = .5; filmPass.uniforms.flash.value = .5; setTimeout(() => filmPass.uniforms.flash.value = 0, 120); Audio.heart();
        leben_play(W, 'Bite', .05, 1, true); for (const O of S.wolves) { O.st = 'back'; O.cool = 30; const bx = O.g.position.x - P.x, bz = O.g.position.z - P.z, bl = Math.hypot(bx, bz) || 1; O.tx = O.g.position.x + bx / bl * 16; O.tz = O.g.position.z + bz / bl * 16; O.sp = 5.5; }
        W.tx = p.x + ax / al * 16; W.tz = p.z + az / al * 16; setTimeout(() => leben_play(W, 'Run', .1), 500); if (typeof gedanke === 'function') gedanke('tief_biss', 'Er hat nicht zugebissen. Er hätte gekonnt. … Das war eine Warnung.', 2500, 3); } }
    else if (W.st === 'back') { if (leben_beastMove(W, dt)) { W.st = 'roam'; leben_play(W, 'Walk', .3); } } }
  // --- Wildschweine: wühlen am Bus; zu nah → einer stürmt los; Licht → die Rotte flieht; danach ist die Stelle frei (AP-24: auch, wenn in AG-19 die Scheinwerfer der Blechmänner aufflammen)
  const falleLicht = typeof K6 !== 'undefined' && !!K6.falle && (K6.falle.ph === 'zu' || K6.falle.ph === 'netz' || K6.falle.ph === 'fertig');
  for (const B of S.boars) { B.g.visible = B.st !== 'gone'; if (B.st === 'gone') { B.t -= dt; if (B.t < 0 && Math.hypot(P.x - TIEF.dig.x, P.z - TIEF.dig.z) > 45) { B.g.position.set(B.home[0], 0, B.home[1]); B.st = 'root'; } continue; }
    leben_beastUpd(B, dt, 60); const p = B.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
    if (B.st === 'root') { B.t -= dt; if (B.t < 0) { B.t = rand(2, 5); const r = Math.random(); leben_play(B, r < .6 ? 'SniffleforFood' : r < .8 ? 'IdleLookAround' : 'Chew', .4); if (d < 30 && !tief_still()) Audio.grunt(p.x, p.z, false); }
      if (d < 26 && ok) sideStart('tief_rotte');
      if (lit(B, 18)) B.lit = (B.lit || 0) + dt; else B.lit = Math.max(0, (B.lit || 0) - dt);
      if (B.lit > 1.3 || (d < 7 && ok) || falleLicht) { const charge = !S.charged && d < 7; S.charged = S.charged || charge; S.rooted = true;
        for (const O of S.boars) { if (O.st !== 'root') continue; const ax = O.g.position.x - P.x, az = O.g.position.z - P.z, al = Math.hypot(ax, az) || 1; O.tx = O.g.position.x + ax / al * 36; O.tz = O.g.position.z + az / al * 36; O.sp = 6.5; O.st = 'flee'; leben_play(O, 'Run', .15); }
        if (charge) { B.st = 'charge'; const ax = P.x - p.x, az = P.z - p.z, al = Math.hypot(ax, az) || 1; B.tx = P.x + ax / al * 9 + az / al * 1.1; B.tz = P.z + az / al * 9 - ax / al * 1.1; B.sp = 8.5; leben_play(B, 'Run', .1); Audio.grunt(p.x, p.z, true, B.g); B.hit = false; } } }
    else if (B.st === 'charge') { if (!B.hit && d < 1.9) { B.hit = true; scareCount++; Audio.scareSound('growl'); Audio.grunt(p.x, p.z, true, B.g); shake = .12; filmPass.uniforms.flash.value = .4; setTimeout(() => filmPass.uniforms.flash.value = 0, 100); Audio.heart(); if (typeof gedanke === 'function') gedanke('tief_keiler', 'Das war knapp. Einen halben Meter. … Die Stelle am Bus ist jetzt frei.', 2000, 3); }
      if (leben_beastMove(B, dt)) { B.st = 'flee'; const ax = p.x - P.x, az = p.z - P.z, al = Math.hypot(ax, az) || 1; B.tx = p.x + ax / al * 30; B.tz = p.z + az / al * 30; } }
    else if (B.st === 'flee') { if (leben_beastMove(B, dt) || d > 50) { B.st = 'gone'; B.t = 150; } } }
  tief_digTick(dt, P);
  // AP-24 (N6-5, Stufe 1): an einer Stelle ist die Wolle frisch nachgeknotet – von kleinen Händen
  if (!S.told.has('knoten') && tief_has('tief_zettel_1') && Math.hypot(P.x - (S.knotAt ? S.knotAt[0] : 46), P.z - (S.knotAt ? S.knotAt[1] : 212.8)) < 3.6 && ok) { S.told.add('knoten'); if (typeof gedanke === 'function') gedanke('tief_knoten', 'Hier ist die Wolle nachgeknotet. Frisch. Ein kleiner Knoten, zweimal rum. So knotet ein Kind.', 200, 3); }
  // --- Rehe am Lager
  for (const D of S.deer) { if (D.st === 'gone') { D.g.visible = false; D.t -= dt; if (D.t < 0 && Math.hypot(P.x - D.home[0], P.z - D.home[1]) > 45) { D.g.position.set(D.home[0], 0, D.home[1]); D.st = 'graze'; } continue; }
    D.g.visible = true; leben_beastUpd(D, dt, 60); const p = D.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
    if (D.st === 'graze') { D.t -= dt; if (D.t < 0) { D.t = rand(3, 8); leben_play(D, Math.random() < .7 ? 'IdleGraze' : 'IdleLookAround', .4); }
      if (d < 16 && (lit(D, 22) || spd > 3.2 || d < 6)) { D.st = 'flee'; D.sp = 7; const a = Math.atan2(p.x - P.x, p.z - P.z) + rand(-.4, .4); D.tx = p.x + Math.sin(a) * 35; D.tz = p.z + Math.cos(a) * 35; leben_play(D, 'Run', .15); if (Audio.deerBark && !tief_still()) Audio.deerBark(p.x, p.z, D.g); } }
    else if (D.st === 'flee') { if (leben_beastMove(D, dt) || d > 45) { D.st = 'gone'; D.t = rand(60, 120); } } }
  if (!inside) return;
  // --- Augen im Dunkeln (je tiefer, desto öfter)
  camera.getWorldDirection(_tfw);
  for (const E of S.eyes) { if (E.on > 0) { E.on -= dt; E.g.lookAt(camera.position); E.g.scale.y = (t * 3 + E.ph) % 4 < .12 ? .15 : 1; const d = Math.hypot(E.g.position.x - P.x, E.g.position.z - P.z);
      _tft.copy(E.g.position).sub(camera.position).normalize(); if (d < 9 || (flashOn && _tfw.dot(_tft) > .97 && d < 26) || E.on <= 0) { E.g.visible = false; E.on = 0; E.t = rand(14, 40) * (1.4 - S.k); if (d < 26) { Audio.twig(E.g.position.x, E.g.position.z); Audio.flap && Math.random() < .3 && Audio.flap(E.g.position.x, 1, E.g.position.z); } } continue; }
    E.t -= dt; if (E.t < 0 && S.k > .15 && ok) { const a = Math.atan2(_tfw.x, _tfw.z) + (Math.random() < .5 ? -1 : 1) * rand(.35, 1.1), dd = rand(14, 24), x = P.x + Math.sin(a) * dd, z = P.z + Math.cos(a) * dd;
      if (!tief_in(x, z)) { E.t = 3; continue; } E.g.position.set(x, rand(.45, 1.1), z); E.g.visible = true; E.on = rand(4, 9); E.ph = rand(0, 4); } }
  // --- Gestalt (Hochsitz, Läufer)
  if (S.fig) { const F = S.fig; F.t += dt; stalker.lookAt(P.x, stalker.position.y, P.z); _tft.copy(stalker.position).add(new THREE.Vector3(0, 1.2 * stalker.scale.y, 0)).sub(camera.position); const dd = _tft.length(); _tft.normalize();
    if (F.run) { stalker.position.x += F.dx * 5 * dt; stalker.position.z += F.dz * 5 * dt; if (Math.floor(F.t * 5) !== F.st) { F.st = Math.floor(F.t * 5); Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .35, x: stalker.position.x, y: 0, z: stalker.position.z, ref: 3 }); } }
    if (_tfw.dot(_tft) > .97) F.seen += dt; if (F.seen > .3 || dd < 6 || F.t > (F.run ? 4 : 14)) { if (F.seen > .3) { if (F.stinger) { Audio.scareSound('violin'); glitchV = .6; } else Audio.stinger(false); scareCount++; } tief_figurWeg(); } }
  // --- Der achte Stöckchenmann: wer den Kreis verlässt und sich umdreht …
  if (S.behind && S.behind.armed) { const R2 = TIEF.ring, d = Math.hypot(P.x - R2.x, P.z - R2.z), G8 = S.eighth;
    if (!S.behind.placed && d > 8 && ok) { S.behind.placed = true; S.behind.t = 0; const f = new THREE.Vector3(_tfw.x, 0, _tfw.z).normalize(); G8.g.position.set(P.x - f.x * .9, camera.position.y - .15, P.z - f.z * .9); G8.y0 = G8.g.position.y; Audio.whisper(P.x - f.x, 1.6, P.z - f.z, 1.4); }
    else if (S.behind.placed) { S.behind.t += dt; _tft.copy(G8.g.position).sub(camera.position).normalize(); G8.g.lookAt(camera.position.x, G8.g.position.y, camera.position.z);
      if (_tfw.dot(_tft) > .45) { S.behind.armed = false; scareCount++; Audio.scareSound('violin'); Audio.stinger(true); glitchV = .8; shake = .06; setTimeout(() => { G8.g.position.copy(G8.home); G8.y0 = G8.home.y; }, 650); }
      else if (S.behind.t > 12) { S.behind.armed = false; G8.g.position.copy(G8.home); G8.y0 = G8.home.y; } } }
  // --- Zufall, je tiefer desto öfter: Schritte hinter dir, eine Gestalt zwischen den Bäumen, Flüstern, Geräusche
  if (S.follow) { const F = S.follow; F.t -= dt; F.step -= dt * (spd > 1 ? 1 : 0);
    if (F.step < 0 && spd > 1) { F.step = .55; const f = new THREE.Vector3(_tfw.x, 0, _tfw.z).normalize(); setTimeout(() => Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .3, x: P.x - f.x * 3.5, y: 0, z: P.z - f.z * 3.5, ref: 3 }), 260); }
    if (spd < .3) F.still += dt; else F.still = 0;
    if (F.still > 1.2 || F.t < 0) { if (F.still > 1.2) { const f = new THREE.Vector3(_tfw.x, 0, _tfw.z).normalize(); Audio.play('stepG2', { gain: .35, x: P.x - f.x * 2.5, y: 0, z: P.z - f.z * 2.5, ref: 3 }); setTimeout(() => { Audio.whisper(P.x - f.x * 1.2, 1.6, P.z - f.z * 1.2, 1.6); scareCount++; }, 900); } S.follow = null; } }
  if (ok && !S.fig && !S.follow) { S.ambT -= dt; if (S.ambT < 0) { S.ambT = rand(6, 14) * (1.3 - S.k * .5); const a = rand(0, 6.28), dd = rand(8, 26), x = P.x + Math.cos(a) * dd, z = P.z + Math.sin(a) * dd, r = Math.random();
    const reg = typeof spannung_ask === 'function', ask = (f, c = 'amb', o) => !reg || spannung_ask(f, c, o); // die Regie (Modul spannung) entscheidet über Budget, Abstände, Stille
    if (r < .22) { if (ask('twig')) Audio.twig(x, z); } else if (r < .34) { if (ask('treeCreak')) Audio.treeCreak(x, z); } else if (r < .44) { if (ask('owl')) Audio.owlPair ? Audio.owlPair(P.x + Math.cos(a) * dd * 2, P.z + Math.sin(a) * dd * 2) : Audio.owl(x, z); }
    else if (r < .5) { if (ask('crow')) Audio.caw(x, rand(4, 8), z); } else if (r < .58) { if (ask('grunt')) Audio.grunt(x, z, false); }
    else if (r < .64 && S.k > .3) { if (ask('whisper', 'minor')) Audio.whisper(x, 1.5, z, 1.4); } else if (r < .68 && S.k > .6) { if (ask('giggle', 'minor')) Audio.giggle(x, 1, z); }
    else if (r < .76 && S.k > .25 && (S.lastScare || 0) < t - 70) { if (ask('steps', 'minor', { behind: true })) { S.lastScare = t; S.follow = { t: 9, step: .3, still: 0 }; } }
    else if (r < .84 && S.k > .35 && (S.lastScare || 0) < t - 70 && (!reg || spannung_can('figure', 'major'))) { const f = new THREE.Vector3(_tfw.x, 0, _tfw.z).normalize(), side = Math.random() < .5 ? 1 : -1, dd2 = rand(16, 22), cx = P.x + f.x * dd2 - f.z * side * 9, cz = P.z + f.z * dd2 + f.x * side * 9;
      if (tief_in(cx, cz) && tief_figur(cx, cz, ['pale', 'grey', 'lena'][Math.floor(Math.random() * 3)], .95)) { S.lastScare = t; S.fig.run = true; S.fig.dx = f.z * side; S.fig.dz = -f.x * side; if (reg) spannung_did('figure', 'major'); } } } }
});
MOD_SAVE.push(['tiefwald', () => ({ swing: !!tief_S.stein }), v => { tief_S.stein = !!v.swing; if (tief_has('tief_weiher')) { tief_S.pondDone = true; if (tief_S.thread) { tief_S.thread.count = tief_S.threadN - 3; tief_S.thread.instanceMatrix.needsUpdate = true; } } if (tief_has('tief_rotte')) tief_S.rooted = true; }]);
window.__tief = { S: tief_S, T: TIEF, paths: TIEF_PATHS, zettel: i => tief_zettel(i), climb: u => tief_climb(u), achter: () => tief_achter(), dig: () => tief_dig(), lager: () => tief_lager(), wrack: () => tief_wrack(), schaukel: () => tief_schaukel(), stein: () => tief_stein() }; // Testzugriff
