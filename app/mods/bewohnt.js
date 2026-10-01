// =====================================================================  BEWOHNT (Modul „bewohnt“, Q-8 „Bewohnt“-Prüfung, F3_extras.md / Premium-Auftrag Punkt 6)
// Jeder Innenraum der Kapitel 1–5 bekommt, was seine Bewohner zurückgelassen haben: Kleinkram, Textilien, Bücher, Geschirr, Bilder, Kabel, Flecken, Spinnweben.
// Jedes Stück hat einen Grund (Kommentar je Zeile, Übersicht in app/story/audit/F3_stand_innen.md). Nur Scan-Modelle (Fab/Megascans) und Papier-Abziehbilder.
// Technik: Aufbau erst beim Näherkommen/Betreten (einmal je Raum), Stücke als Instanzen je Modellteil, Abziehbilder/Kabel/Spinnweben zu einem Mesh je Material
// zusammengefasst; Platz wird per Strahl geprüft (freier Boden, ebene Ablage, Wand dahinter). Keine Stücke auf/vor Klickflächen (Kasten- und Sichtstrahl-Prüfung),
// nichts in Türen. Keine Lichter zur Laufzeit: nur die Stärke vorhandener Lichter/der Hemisphäre (LICHT_HAKEN) ändert sich.
const bw_S = { ready: false, t: 0, liste: [], halt: false, kits: new Map(), gebaut: new Map(), bau: null, log: {}, fehlt: new Set(), flammen: [], cob: null, pap: {} };
const BW_V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const BW_CAND = { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } };
const BW_TIRES = { tires2_u1_v1: { b: 'tires2_u1_v1_diffuse-sharpen.jpg', rough: .9 }, tires2_u2_v1: { b: 'tires2_u2_v1_diffuse-sharpen.jpg', rough: .9 }, tires2_u1_v2: { b: 'tires2_u1_v2_diffuse-sharpen.jpg', rough: .9 }, tires2_u2_v2: { b: 'tires2_u2_v2_diffuse-denoise.jpg', rough: .9 } };
// Modelle: [Schlüssel, { file, size, axis, spec, teil (Teil-Name), eins (nur erster Teil), aufrecht (längste Achse senkrecht) }]
const BW_KITS = {
  buch: ['w_buch', { file: 'model.glb', size: .22, axis: 'max' }], ordner: ['w_buch', { file: 'model.glb', size: .32, axis: 'max' }],
  buchL: ['lbook', { file: 'model.fbx', size: .23, axis: 'max', spec: { '*': { b: 'b.jpg', n: 'n.jpg', r: 'r.jpg', ao: 'ao.jpg' } } }],
  tasse: ['w_tasse', { file: 'model.glb', size: .09 }], becher: ['w_becher', { file: 'model.glb', size: .1 }], teller: ['w_teller', { file: 'model.glb', size: .22, axis: 'max' }],
  besteck: ['w_besteck', { file: 'model.glb', size: .19, axis: 'max' }], brot: ['w_brot', { file: 'model.glb', size: .1, axis: 'max' }], thermos: ['w_thermos', { file: 'model.glb', size: .3 }],
  gTasse: ['geschirr', { size: .08, teil: /^cup/ }], gTeller: ['geschirr', { size: .25, axis: 'max', teil: /^plate/ }], gKanne: ['geschirr', { size: .27, teil: /^coffee_flask/ }],
  gLoeffel: ['geschirr', { size: .17, axis: 'max', teil: /^spoon/ }], gGabel: ['geschirr', { size: .17, axis: 'max', teil: /^fork/ }],
  jacke: ['w_jacke', { file: 'model.fbx', size: .82, spec: { '*': { b: 'model.jpg', rough: .95, ds: true } } }],
  schirm: ['schirm', { file: 'model.fbx', size: .9, axis: 'max', aufrecht: true, spec: { '*': { color: 0x141414, rough: .42 } } }],
  brille: ['brille', { file: 'model.glb', size: .13, axis: 'max' }],
  ascher: ['kiffen/ascher', { file: 'model.glb', size: .12, axis: 'max' }], feuerzeug: ['w_lighter', { file: 'model.glb', size: .07, axis: 'max' }], kette: ['w_kette', { file: 'model.glb', size: .42, axis: 'max' }],
  laterneP: ['w_papierlaterne', { file: 'model.fbx', size: .3, teil: /Dupli/, eins: true }],
  eimer: ['trashcan', { size: .42 }], sack: ['trashbag', { size: .5 }], kanister: ['jerrycan', { size: .42 }],
  reifen: ['tires', { file: 'model.fbx', size: .75, axis: 'max', spec: BW_TIRES }],
  rahmen: ['frame_deco', { size: .42 }], rahmen2: ['frame_dmg', { size: .46 }],
  teddyR: ['teddy_retro', { file: 'model.fbx', size: .24, spec: { material0: { b: 'teddy-bear.jpg', color: 0xa89a88 }, material1: { b: 'teddy-bear1.jpg', color: 0xa89a88 } } }],
  urne: ['w_urne', { file: 'model.glb', size: .3 }],
  kerzeA: ['candles', { file: 'model.fbx', spec: BW_CAND, teil: /^Candle_small_used_low$/, size: .06 }], kerzeB: ['candles', { file: 'model.fbx', spec: BW_CAND, teil: /^Candle_large_small_used_low$/, size: .1 }],
  kerzeC: ['candles', { file: 'model.fbx', spec: BW_CAND, teil: /^Thin_candle_used_low$/, size: .16 }]
};

// ---------------------------------------------------------------------  Modelle laden (einmal), Teile normiert: Unterkante y = 0, Mitte x/z = 0, Größe in Metern
function bw_kit(name) {
  if (bw_S.kits.has(name)) return bw_S.kits.get(name);
  const [key, o] = BW_KITS[name] || []; if (!key) return Promise.resolve(null);
  const p = (async () => { try {
    const file = o.file || 'model.gltf', root = file.endsWith('.fbx') ? await msFBX(key, file, o.spec || {}) : (await msModel(key, file)).clone(true);
    root.updateMatrixWorld(true); const parts = [];
    root.traverse(m => { if (!m.isMesh || m.isSkinnedMesh) return; if (o.teil && !o.teil.test(m.name)) return; if (o.ohne && o.ohne.test(m.name)) return; if (o.eins && parts.length) return;
      parts.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material }); });
    if (!parts.length) throw new Error('keine Teile');
    const bb = new THREE.Box3(); parts.forEach(q => { q.geo.computeBoundingBox(); bb.union(q.geo.boundingBox); });
    const pre = new THREE.Matrix4(), sz0 = bb.getSize(BW_V());
    if (o.aufrecht && Math.max(sz0.x, sz0.z) > sz0.y) pre.makeRotationFromEuler(new THREE.Euler(sz0.z > sz0.x ? PI / 2 : 0, 0, sz0.x >= sz0.z ? PI / 2 : 0));
    bb.makeEmpty(); parts.forEach(q => { q.geo.applyMatrix4(pre); q.geo.computeBoundingBox(); bb.union(q.geo.boundingBox); });
    const sz = bb.getSize(BW_V()), s = (o.size || 1) / (o.axis === 'max' ? Math.max(sz.x, sz.y, sz.z) : sz[o.axis || 'y']);
    const mt = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2));
    const lb = new THREE.Box3(); parts.forEach(q => { q.geo.applyMatrix4(mt); q.geo.computeBoundingBox(); q.geo.computeBoundingSphere(); lb.union(q.geo.boundingBox); });
    return { name, parts, lb, sz: lb.getSize(BW_V()) };
  } catch (e) { console.warn('bewohnt: Modell ' + name, e); bw_S.fehlt.add(name); return null; } })();
  bw_S.kits.set(name, p); return p; }

// Gemeinsame Papier-Texturen (je eine; Wiederholung derselben Textur nie im selben Blickfeld verwenden)
function bw_papier(art) { if (bw_S.pap[art]) return bw_S.pap[art]; if (typeof kirchberg_papier !== 'function') return null; const P = kirchberg_papier; let t;
  if (art === 'zeitung') t = P({ w: 256, h: 340, bg: '#d8d0b6', flecken: 2, knick: true, zeilen: [['Der Laternenbote', 14, 42, 30, '#1c1c1c', 'Georgia, serif', 0]], fn: (x, w) => { x.fillStyle = 'rgba(30,30,30,.5)'; for (let r = 0; r < 20; r++) x.fillRect(14 + (r % 2) * 118, 66 + (r >> 1) * 26, 106, 5); x.fillStyle = 'rgba(40,40,40,.35)'; x.fillRect(132, 66, 108, 70); } });
  else if (art === 'zeitung2') t = P({ w: 256, h: 340, bg: '#cfc6aa', flecken: 3, zeilen: [['LICHTER ÜBER DEM', 14, 44, 24, '#1c1c1c', 'Georgia, serif', 0], ['KIRCHBERG?', 14, 72, 24, '#1c1c1c', 'Georgia, serif', 0]], fn: (x, w) => { x.fillStyle = 'rgba(30,30,30,.45)'; for (let r = 0; r < 16; r++) x.fillRect(14, 96 + r * 14, w - 28 - (r % 4) * 20, 5); } });
  else if (art === 'brief') t = P({ w: 256, h: 170, bg: '#e8e0cc', flecken: 1, zeilen: [['Wendt', 120, 96, 24, 'rgba(20,30,90,.85)'], ['Ahornstraße 7', 120, 124, 22, 'rgba(20,30,90,.85)']], fn: x => { x.strokeStyle = 'rgba(120,100,70,.35)'; x.strokeRect(190, 14, 50, 60); x.fillStyle = 'rgba(160,40,30,.35)'; x.fillRect(196, 20, 38, 48); } });
  else if (art === 'prospekt') t = P({ w: 256, h: 340, bg: '#e8e2d2', flecken: 1, zeilen: [['SONDERANGEBOT', 16, 50, 30, '#b01a14', 'Arial, sans-serif', 0], ['Kassler 4,80', 16, 110, 26, '#222', 'Arial, sans-serif', 0], ['Winterreifen', 16, 150, 26, '#222', 'Arial, sans-serif', 0]], fn: (x, w) => { x.fillStyle = 'rgba(200,160,40,.5)'; x.fillRect(16, 180, w - 32, 120); } });
  else if (art === 'zettel') t = P({ w: 200, h: 280, bg: '#efe9d8', lin: 'liniert', flecken: 1, tesa: true, zeilen: [['Grablichter 7', 58, 72, 30], ['Milch', 58, 102, 30], ['Brot (Zayn)', 58, 132, 30, 'rgba(28,38,92,.9)', null, -.03, 1]] });
  else if (art === 'zeichnung') t = P({ w: 256, h: 200, bg: '#f2eee2', flecken: 1, tesa: true, fn: (x, w, h) => { x.lineWidth = 4; x.lineCap = 'round'; const fig = (cx, s, col) => { x.strokeStyle = col; x.beginPath(); x.arc(cx, 120 - 40 * s, 12 * s, 0, 7); x.moveTo(cx, 132 - 40 * s); x.lineTo(cx, 150); x.moveTo(cx - 16 * s, 118); x.lineTo(cx + 16 * s, 118); x.moveTo(cx, 150); x.lineTo(cx - 10 * s, 178); x.moveTo(cx, 150); x.lineTo(cx + 10 * s, 178); x.stroke(); };
    fig(46, 1.2, '#8a3a2a'); fig(96, 1.25, '#2a3a6a'); fig(150, .9, '#b04a6a'); fig(196, .85, '#2a6a3a'); x.strokeStyle = '#d8a020'; x.beginPath(); x.arc(220, 40, 16, 0, 7); x.stroke(); x.fillStyle = 'rgba(240,180,40,.6)'; x.fill();
    x.fillStyle = '#3a3a3a'; x.font = '22px "Caveat", cursive'; x.fillText('MAMA PAPA LUCY LUKE', 16, 30); } });
  else if (art === 'blatt') t = P({ w: 256, h: 340, bg: '#ece6d6', lin: 'kariert', flecken: 2, zeilen: [['03:13', 20, 60, 30], ['||||| |||', 20, 110, 30], ['||||| ||||| ||', 20, 150, 30]] });
  else t = P({ w: 256, h: 340, bg: '#ddd4bb', flecken: 3, knick: true, fn: (x, w) => { x.fillStyle = 'rgba(30,30,30,.55)'; for (let r = 0; r < 14; r++) x.fillRect(20, 40 + r * 20, w - 40 - (r % 3) * 30, 4); } }); // Akte / Formular
  return bw_S.pap[art] = new THREE.MeshStandardMaterial({ map: t, roughness: .95, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }); }

// ---------------------------------------------------------------------  Raum-Aufbau: Werkzeuge mit Platzprüfung
async function bw_bauen(D) {
  const S = bw_S; if (S.gebaut.has(D.id)) return; const t0 = performance.now();
  const r = D.r(); if (!r) return; const y0 = D.y0 ?? 0, H = D.h ?? 2.6;
  const g = new THREE.Group(); g.name = 'bw_' + D.id; g.visible = false; scene.add(g);
  const LOG = { ok: 0, weg: [], los: 0 }; S.log[D.id] = LOG;
  const roomBox = new THREE.Box3(BW_V(r.x0 - .4, y0 - .6, r.z0 - .4), BW_V(r.x1 + .4, y0 + H + .5, r.z1 + .4));
  // Ziele für die Strahlen: sichtbare, feste Meshes im Raum (Sichtbarkeit nur am Objekt selbst – Raumgruppen sind beim Vorab-Bau oft noch aus)
  const ziele = [], klick = [], bb = new THREE.Box3(), kug = new THREE.Sphere(); scene.updateMatrixWorld();
  scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || !o.visible || o.userData.bw) return; const m0 = [].concat(o.material)[0]; if (!m0 || m0.visible === false) return;
    if (m0.transparent && (m0.depthWrite === false || m0.opacity < .6)) return; if (m0.blending === THREE.AdditiveBlending) return;
    if (!o.geometry || !o.geometry.attributes.position) return; const sp = o.isInstancedMesh ? (o.boundingSphere || (o.computeBoundingSphere(), o.boundingSphere)) : (o.geometry.boundingSphere || (o.geometry.computeBoundingSphere(), o.geometry.boundingSphere));
    if (!sp || !roomBox.intersectsSphere(kug.copy(sp).applyMatrix4(o.matrixWorld))) return; bb.setFromObject(o); if (bb.isEmpty() || !bb.intersectsBox(roomBox)) return; ziele.push({ o, bb: bb.clone() }); });
  for (const m of interactables) { if (!m || !m.isObject3D) continue; bb.setFromObject(m); if (bb.isEmpty() || !bb.intersectsBox(roomBox)) continue; klick.push(bb.clone().expandByScalar(.03)); }
  const tueren = (D.tueren ? D.tueren() : []) || [];
  const recs = [], lose = [], rc = new THREE.Raycaster(); rc.firstHitOnly = true;
  const DOWN = BW_V(0, -1, 0), tmpO = BW_V(), tmpD = BW_V(), ray = new THREE.Ray(), hitV = BW_V();
  // Strahl nach unten: höchste Fläche unter „von“ (Deko-Kästen zählen mit)
  const runter = (x, z, von) => { let best = null; tmpO.set(x, von, z); rc.set(tmpO, DOWN); rc.far = von - (y0 - .3);
    for (const t of ziele) { const b = t.bb; if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z || b.min.y > von) continue; const h = rc.intersectObject(t.o, false)[0]; if (h && (!best || h.point.y > best.y)) best = { y: h.point.y, deko: false }; }
    for (const q of recs) { const b = q.bb; if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z || b.max.y > von) continue; if (!best || b.max.y > best.y) best = { y: b.max.y, deko: true }; }
    return best; };
  // Strahl waagerecht: Abstand bis zur ersten Fläche (Deko-Kästen zählen mit)
  const quer = (x, y, z, dx, dz, far) => { tmpO.set(x, y, z); tmpD.set(dx, 0, dz); rc.set(tmpO, tmpD); rc.far = far; let d = Infinity;
    const lo = BW_V(Math.min(x, x + dx * far), y - .01, Math.min(z, z + dz * far)), hi = BW_V(Math.max(x, x + dx * far), y + .01, Math.max(z, z + dz * far)), sb = new THREE.Box3(lo, hi);
    for (const t of ziele) { if (!t.bb.intersectsBox(sb)) continue; const h = rc.intersectObject(t.o, false)[0]; if (h && h.distance < d) d = h.distance; }
    ray.set(tmpO, tmpD); for (const q of recs) if (ray.intersectBox(q.bb, hitV)) { const dd = hitV.distanceTo(tmpO); if (dd < d) d = dd; }
    return d; };
  const eul = new THREE.Euler(), quat = new THREE.Quaternion(), one = BW_V(1, 1, 1);
  // Matrix + Welt-Kasten für ein Stück (Unterkante auf y)
  const lage = (K, x, y, z, o) => { eul.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ'); quat.setFromEuler(eul); const s = o.s || 1;
    const m = new THREE.Matrix4().compose(BW_V(x, 0, z), quat, BW_V(s, s, s)); const b = K.lb.clone().applyMatrix4(m); m.elements[13] = y - b.min.y; b.translate(BW_V(0, y - b.min.y, 0)); return { m, bb: b }; };
  const innen = b => b.min.x > r.x0 - .02 && b.max.x < r.x1 + .02 && b.min.z > r.z0 - .02 && b.max.z < r.z1 + .02;
  const frei = (b, stapel) => { const k = b.clone().expandByScalar(-.01);
    for (const q of klick) if (q.intersectsBox(k)) return 'klick'; for (const [tx, tz, tr] of tueren) { const cx = Math.max(b.min.x, Math.min(tx, b.max.x)), cz = Math.max(b.min.z, Math.min(tz, b.max.z)); if (Math.hypot(cx - tx, cz - tz) < (tr || .9)) return 'tür'; }
    if (!stapel) for (const q of recs) if (q.bb.intersectsBox(k)) return 'deko'; return ''; };
  const fuss = b => { const ix = (b.max.x - b.min.x) * .18, iz = (b.max.z - b.min.z) * .18, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2; return [[cx, cz], [b.min.x + ix, b.min.z + iz], [b.max.x - ix, b.min.z + iz], [b.min.x + ix, b.max.z - iz], [b.max.x - ix, b.max.z - iz]]; };
  const spirale = (rr, n = Math.max(14, rr * rr * 40 | 0)) => { const a = [[0, 0]]; for (let i = 1; i <= n; i++) { const d = rr * Math.sqrt(i / n), w = i * 2.39996; a.push([Math.cos(w) * d, Math.sin(w) * d]); } return a; };
  const add = (K, pl, o, grund) => { const q = { K, m: pl.m, bb: pl.bb, col: o.col != null ? new THREE.Color(o.col) : null, fest: o.fest ?? (grund === 'boden' && K.sz.y > .35), grund, sagt: o.warum || '' }; recs.push(q); LOG.ok++; return q; };
  const nein = (name, why) => { LOG.weg.push(name + ':' + why); return null; };
  const hoch = () => Math.min(y0 + H - .06, y0 + 2.35);
  const c = {
    r, y0, H, g,
    // Boden (frei), Suche im Umkreis o.r
    async b(name, x, z, o = {}) { const K = await bw_kit(name); if (!K) return nein(name, 'modell'); let why = 'platz';
      for (const [dx, dz] of spirale(o.r ?? .4)) { const pl = lage(K, x + dx, y0, z + dz, o); if (!innen(pl.bb)) { why = 'rand'; continue; } const f = frei(pl.bb); if (f) { why = f; continue; }
        if (fuss(pl.bb).every(([px, pz]) => { const h = runter(px, pz, hoch()); return h && !h.deko && h.y < y0 + .035; })) return add(K, pl, o, 'boden'); why = 'belegt'; }
      return nein(name, why); },
    // Ablage (Tisch, Kommode, Regalboden …): ebene Fläche zwischen o.min und o.max, Suche im Umkreis o.r; o.von = Strahlstart (unter einem höheren Boden)
    async a(name, x, z, o = {}) { const K = await bw_kit(name); if (!K) return nein(name, 'modell'); let why = 'fläche'; const lo = o.min ?? y0 + .35, hi = o.max ?? y0 + 2.1;
      for (const [dx, dz] of spirale(o.r ?? .3)) { const px = x + dx, pz = z + dz, h = runter(px, pz, o.von ?? hoch()); if (!h || (h.deko && !o.stapel) || h.y < lo || h.y > hi) continue;
        const pl = lage(K, px, h.y, pz, o); if (!innen(pl.bb)) { why = 'rand'; continue; } const f = frei(pl.bb, o.stapel); if (f) { why = f; continue; }
        if (fuss(pl.bb).every(([qx, qz]) => { const k = runter(qx, qz, o.von ?? hoch()); return k && Math.abs(k.y - h.y) < .016; })) return add(K, pl, o, 'ablage'); why = 'kante'; }
      return nein(name, why); },
    // an der Wand (Bild, Jacke, Uhr): Seite W/O/S/N, t = Lage längs der Wand, yc = Mitte; o.at = Wandlage (Innenwände), Suche längs der Wand o.r
    async w(name, seite, t, yc, o = {}) { const K = await bw_kit(name); if (!K) return nein(name, 'modell');
      const nx = seite === 'W' ? 1 : seite === 'O' ? -1 : 0, nz = seite === 'S' ? 1 : seite === 'N' ? -1 : 0, ry = seite === 'S' ? 0 : seite === 'N' ? PI : seite === 'W' ? PI / 2 : -PI / 2;
      const wand = o.at ?? (seite === 'W' ? r.x0 : seite === 'O' ? r.x1 : seite === 'S' ? r.z0 : r.z1); const oo = Object.assign({}, o, { ry: ry + (o.dry || 0) }); let why = 'wand';
      for (const dt of [0, .15, -.15, .3, -.3, .45, -.45, .6, -.6].filter(v => Math.abs(v) <= (o.r ?? .3) + .001)) {
        const tt = t + dt, ax = nx ? wand : tt, az = nz ? wand : tt, pl0 = lage(K, ax, 0, az, oo), hw = (nx ? pl0.bb.max.z - pl0.bb.min.z : pl0.bb.max.x - pl0.bb.min.x) / 2 * .8, hh = (pl0.bb.max.y - pl0.bb.min.y) / 2 * .8;
        const ds = []; for (const [u, v] of [[0, 0], [-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]]) { const px = (nx ? wand + nx * .8 : tt + u), pz = (nz ? wand + nz * .8 : tt + u); ds.push(quer(nx ? px : px, yc + v, nz ? pz : pz, -nx, -nz, 1.3)); }
        const dmin = Math.min(...ds), dmax = Math.max(...ds); if (!isFinite(dmax) || dmax - dmin > .03 || dmin < .5) { why = dmin < .5 ? 'davor' : 'keine wand'; continue; }
        const surf = wand + nx * (.8 - dmin) + nz * (.8 - dmin), pl = lage(K, nx ? surf : tt, 0, nz ? surf : tt, oo);
        const dy = yc - (pl.bb.min.y + pl.bb.max.y) / 2; pl.m.elements[13] += dy; pl.bb.translate(BW_V(0, dy, 0));
        const back = nx > 0 ? pl.bb.min.x : nx < 0 ? pl.bb.max.x : nz > 0 ? pl.bb.min.z : pl.bb.max.z, sh = (nx || nz) * (surf - back) + .004;
        pl.m.elements[12] += nx * sh; pl.m.elements[14] += nz * sh; pl.bb.translate(BW_V(nx * sh, 0, nz * sh)); const f = frei(pl.bb); if (f) { why = f; continue; }
        return add(K, pl, o, 'wand'); }
      return nein(name, why); },
    // auf dem Boden an die Wand gelehnt/gestellt (Schirm, Säcke, Stapel): Rückseite an die gefundene Wandfläche
    async bw(name, seite, t, o = {}) { const K = await bw_kit(name); if (!K) return nein(name, 'modell');
      const nx = seite === 'W' ? 1 : seite === 'O' ? -1 : 0, nz = seite === 'S' ? 1 : seite === 'N' ? -1 : 0, wand = o.at ?? (seite === 'W' ? r.x0 : seite === 'O' ? r.x1 : seite === 'S' ? r.z0 : r.z1); let why = 'wand';
      const lean = o.lehnen ? { rx: nz ? -nz * o.lehnen : 0, rz: nx ? nx * o.lehnen : 0 } : {};
      for (const dt of [0, .2, -.2, .4, -.4, .6, -.6, .8, -.8].filter(v => Math.abs(v) <= (o.r ?? .6) + .001)) { const tt = t + dt;
        const d1 = quer(nx ? wand + nx * .8 : tt, y0 + .35, nz ? wand + nz * .8 : tt, -nx, -nz, 1.3), d2 = quer(nx ? wand + nx * .8 : tt, y0 + Math.min(1.1, K.sz.y * (o.s || 1) * .9), nz ? wand + nz * .8 : tt, -nx, -nz, 1.3);
        if (!isFinite(d1) || Math.abs(d1 - d2) > .04 || d1 < .45) { why = d1 < .45 ? 'davor' : 'keine wand'; continue; }
        const surf = wand + (nx + nz) * (.8 - d1), oo = Object.assign({ ry: o.ry ?? 0 }, o, lean), pl = lage(K, nx ? surf : tt, y0, nz ? surf : tt, oo);
        const back = nx > 0 ? pl.bb.min.x : nx < 0 ? pl.bb.max.x : nz > 0 ? pl.bb.min.z : pl.bb.max.z, sh = (nx || nz) * (surf - back) + .012;
        pl.m.elements[12] += nx * sh; pl.m.elements[14] += nz * sh; pl.bb.translate(BW_V(nx * sh, 0, nz * sh)); if (!innen(pl.bb)) { why = 'rand'; continue; } const f = frei(pl.bb); if (f) { why = f; continue; }
        if (fuss(pl.bb).every(([px, pz]) => { const h = runter(px, pz, hoch()); return h && !h.deko && h.y < y0 + .035; })) return add(K, pl, o, 'boden'); why = 'belegt'; }
      return nein(name, why); },
    // Stapel (Bücher, Akten, Teller): erstes Stück per b/a, weitere mit fester Höhe darauf
    async stapel(name, x, z, n, o = {}) { const K = await bw_kit(name); if (!K) return nein(name, 'modell'); const cols = o.cols || [null];
      const q0 = o.auf ? await c.a(name, x, z, Object.assign({}, o, { col: cols[0] })) : await c.b(name, x, z, Object.assign({}, o, { col: cols[0] })); if (!q0) return null;
      let y = q0.bb.max.y; const cx = (q0.bb.min.x + q0.bb.max.x) / 2, cz = (q0.bb.min.z + q0.bb.max.z) / 2;
      for (let i = 1; i < n; i++) { const oo = Object.assign({}, o, { ry: (o.ry || 0) + Math.sin(i * 2.7 + x) * .35, s: (o.s || 1) * (1 - (i % 3) * .06), col: cols[i % cols.length] }); const pl = lage(K, cx + Math.sin(i * 1.9) * .015, y, cz + Math.cos(i * 2.3) * .015, oo);
        if (pl.bb.max.y > y0 + H - .1) break; add(K, pl, oo, q0.grund); y = pl.bb.max.y; }
      return q0; },
    // fest gesetzt (Lage bekannt, z. B. auf dem Stuhlsitz oder im Kerzenkreis) – prüft nur Klickflächen/Türen
    async fix(name, x, y, z, o = {}) { const K = await bw_kit(name); if (!K) return nein(name, 'modell'); const pl = lage(K, x, y, z, o); const f = frei(pl.bb, true); if (f) return nein(name, f); return add(K, pl, o, 'fix'); },
    // Abziehbild: Schmutz/Wasserfleck/Wachs (Scan-Oberfläche mit Alpha); face 'floor' | 'ceil' | 'W'/'O'/'S'/'N' (Wand, auf der es liegt)
    fleck(key, w, h, x, y, z, face, rot = 0, tint = 0x6a5a48, op = .7) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), bw_fleckMat(key, tint, op)); if (face === 'floor') p.rotation.set(-PI / 2, 0, rot); else if (face === 'ceil') p.rotation.set(PI / 2, 0, rot);
      else p.rotation.set(0, { S: 0, N: PI, W: PI / 2, O: -PI / 2 }[face], rot, 'YXZ'); p.position.set(x, y, z); p.renderOrder = 1; lose.push(p); return p; },
    // Papier (Zeitung, Brief, Akte …) flach auf einer Fläche oder an der Wand
    papier(art, w, h, x, y, z, o = {}) { const m = bw_papier(art); if (!m) return null; const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.rotation.set(o.rx ?? -PI / 2, o.ry || 0, o.rz ?? Math.sin(x * 7.3 + z) * .6, 'YXZ'); p.position.set(x, y + (o.rx === 0 ? 0 : .004), z); lose.push(p); return p; },
    // Papier auf die höchste Fläche an (x, z) legen
    papierAuf(art, w, h, x, z, o = {}) { const k = runter(x, z, o.von ?? hoch()); if (!k || (o.min != null && k.y < o.min) || (o.max != null && k.y > o.max)) return nein('papier', 'fläche'); return c.papier(art, w, h, x, k.y + .002 * (o.lage || 1), z, o); },
    // Spinnweben (dasselbe Fab-Netz wie in Nr. 7), in Raumecken
    netz(x, y, z, ry, s = 1) { if (!bw_S.cob) return; const w = new THREE.Mesh(bw_S.cob.geometry, bw_S.cob.material); w.position.set(x, y, z); w.rotation.set(0, ry, Math.sin(x * 3.1 + z) * .3); w.scale.setScalar(.0105 * s); lose.push(w); },
    // Kabel: weiche Linie durch Punkte (Gummi), liegt auf dem Boden / hängt durch
    kabel(pts, rr = .006) { const cu = new THREE.CatmullRomCurve3(pts.map(p => BW_V(...p)), false, 'centripetal'); const geo = new THREE.TubeGeometry(cu, Math.max(8, pts.length * 10), rr, 5, false);
      const p = new THREE.Mesh(geo, bw_kabelMat()); lose.push(p); return p; },
    // brennende Kerze: Flamme (Sprite, flackert im Takt) auf einem Kerzenstück
    flamme(q) { if (!q || typeof kirchberg_flammeTex !== 'function') return; const b = q.bb, fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: kirchberg_flammeTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xffd8a0 }));
      fl.scale.set(.04, .075, 1); fl.position.set((b.min.x + b.max.x) / 2, b.max.y + .03, (b.min.z + b.max.z) / 2); fl.userData.bw = 1; g.add(fl); bw_S.flammen.push({ fl, g, seed: bw_S.flammen.length * 1.7 }); }
  };
  try { await D.bau(c); } catch (e) { console.warn('bewohnt: Raum ' + D.id, e); }
  // Sichtprüfung: Stücke, die den Blick von einem Standpunkt (Raummitte, Türen, Augenpunkte) auf eine Klickfläche verdecken, fallen weg
  // (nur wenn die Klickfläche von dort ohne Deko überhaupt zu sehen ist – Wände dazwischen zählen)
  const augen = D.augen ? D.augen() : [[(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2], ...tueren.map(t => [t[0], t[1]])];
  const sicht = (e, dir, L) => { rc.set(e, dir); rc.far = L; let d = L; const lo = e.clone().min(hitV.copy(dir).multiplyScalar(L).add(e)), hi = e.clone().max(hitV.copy(dir).multiplyScalar(L).add(e)), sb = new THREE.Box3(lo, hi).expandByScalar(.01);
    for (const t of ziele) { if (!t.bb.intersectsBox(sb)) continue; const h = rc.intersectObject(t.o, false)[0]; if (h && h.distance < d) d = h.distance; } return d; };
  for (const kb of klick) { const kc = kb.getCenter(BW_V()); for (const [ex, ez] of augen) { const e = BW_V(ex, y0 + 1.62, ez), dir = kc.clone().sub(e), L = dir.length(); if (L < .3 || L > 9) continue; dir.normalize(); ray.set(e, dir);
      const treffer = []; for (const q of recs) { if (q.weg) continue; const sb = q.bb.clone().expandByScalar(-.02); if (sb.isEmpty() || sb.intersectsBox(kb) || sb.containsPoint(e)) continue; if (ray.intersectBox(sb, hitV) && hitV.distanceTo(e) < L - .08) treffer.push(q); }
      if (!treffer.length) continue; const ein = ray.intersectBox(kb, hitV) ? hitV.distanceTo(e) : L; if (sicht(e, dir, ein) < ein - .05) continue; // ohnehin verdeckt
      for (const q of treffer) { q.weg = true; LOG.los++; LOG.weg.push(q.K.name + ':sicht'); } } }
  // Instanzen je Modell (fest/lose getrennt), lose Flächen je Material zu einem Mesh
  const gruppen = new Map(); for (const q of recs) { if (q.weg) continue; const k = q.K.name + (q.fest ? '|f' : ''); if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(q); }
  const gFest = new THREE.Group(), gLos = new THREE.Group(); gLos.userData.noCol = true; g.add(gFest, gLos); const weiss = new THREE.Color(1, 1, 1);
  for (const list of gruppen.values()) { const K = list[0].K, farbig = list.some(q => q.col), fest = list[0].fest;
    for (const p of K.parts) { const im = new THREE.InstancedMesh(p.geo, p.mat, list.length); list.forEach((q, i) => { im.setMatrixAt(i, q.m); if (farbig) im.setColorAt(i, q.col || weiss); });
      im.castShadow = fest || K.sz.y > .3; im.receiveShadow = true; im.computeBoundingSphere(); im.computeBoundingBox(); im.userData.bw = 1; (fest ? gFest : gLos).add(im); } }
  { const nach = new Map(); for (const p of lose) { p.updateMatrixWorld(true); const k = p.material.uuid; if (!nach.has(k)) nach.set(k, { mat: p.material, geos: [] }); const gg = (p.geometry.index ? p.geometry.toNonIndexed() : p.geometry.clone()).applyMatrix4(p.matrixWorld);
      for (const a of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv'].includes(a)) gg.deleteAttribute(a); if (!gg.attributes.uv) continue; nach.get(k).geos.push(gg); }
    for (const { mat, geos } of nach.values()) { const geo = geos.length > 1 ? mergeGeometries(geos) : geos[0]; if (!geo) continue; geo.computeBoundingSphere(); const me = new THREE.Mesh(geo, mat); me.receiveShadow = true; me.renderOrder = 1; me.userData.bw = 1; gLos.add(me); } }
  g.traverse(o => { o.userData.bw = 1; }); g.updateMatrixWorld(true);
  if (gFest.children.length && typeof solidAdd === 'function') try { solidAdd(gFest); } catch (e) { console.warn('bewohnt: Kollision ' + D.id, e); }
  try { g.visible = true; renderer.compile(g, camera, scene); } catch (e) {} g.visible = false;
  if (D.nachher) try { D.nachher(); } catch (e) { console.warn('bewohnt: nachher ' + D.id, e); }
  LOG.ms = Math.round(performance.now() - t0); LOG.inst = gFest.children.length + gLos.children.length; const E = { D, g }; S.gebaut.set(D.id, E); S.liste.push(E);
  console.log('[bewohnt] ' + D.id + ': ' + LOG.ok + ' Stücke, ' + LOG.weg.length + ' verworfen, ' + LOG.inst + ' Zeichenaufrufe, ' + LOG.ms + ' ms'); }
function bw_fleckMat(key, tint, op) { const k = 'f|' + key + tint + op; if (bw_S.pap[k]) return bw_S.pap[k]; const m = msSurfMat(key, { alpha: true, tint }); m.opacity = op; m.depthWrite = false; m.polygonOffsetFactor = -4; return bw_S.pap[k] = m; }
function bw_kabelMat() { return bw_S.pap.kabel || (bw_S.pap.kabel = (() => { const m = msSurfMat('rust_sheet', { tint: 0x1a1a1a, nrm: .3 }); m.roughness = .55; m.aoMap = null; return m; })()); }

// ---------------------------------------------------------------------  Räume: wer, was liegt herum, was ist kaputt, was zuletzt benutzt (F3_stand_innen.md)
const bw_kb = id => (typeof kirchberg_S !== 'undefined' && kirchberg_S.raeume && kirchberg_S.raeume[id]) || null;
const bw_kbRect = id => { const R = bw_kb(id); return R ? { x0: R.x0 + .1, x1: R.x1 - .1, z0: R.z0 + .1, z1: R.z1 - .1 } : null; };
const bw_kbTuer = id => { const R = bw_kb(id); return R && R.def.tuer ? [[R.def.tuer[0], R.def.tuer[1], 1.0]] : []; };
const bw_kbIn = id => typeof kirchberg_S !== 'undefined' && kirchberg_S.inRaum === id;
const bw_nah = (P, x, z, d) => (P.x - x) * (P.x - x) + (P.z - z) * (P.z - z) < d * d;
const bw_rNah = (P, r, d) => P.x > r.x0 - d && P.x < r.x1 + d && P.z > r.z0 - d && P.z < r.z1 + d;
const bw_grp = n => (bw_S.grp || (bw_S.grp = {}))[n] || (bw_S.grp[n] = scene.getObjectByName(n));
const BW_B1 = ['#6a2a22', '#2a3a5a', '#3a4a2a', '#5a4a30', '#7a6a50', '#2a2a2a', '#8a7a5a']; // Buchrücken, gedeckt
const bw_farben = (n, basis = BW_B1) => Array.from({ length: n }, (_, i) => basis[(i * 3 + 1) % basis.length]);
const BW_RAEUME = [
  // ================= Nr. 7 · Hilde Wendt (Amtsangestellte, Mutter von Zayn, zählt die Kinder). Sie ist in dieser Nacht an der Kreuzung gestorben – das Haus steht, wie sie es verlassen hat.
  { id: 'nr7', name: 'Nr. 7 (Hilde Wendt)', r: () => ({ x0: 20.2, x1: 31.8, z0: -21.8, z1: -12.2 }), y0: Y, h: 2.76,
    tueren: () => [[23, -12.2, .8], [23, -17, .75], [26, -14.4, .75], [29.5, -17, .75], [30, -21.8, .8]], augen: () => [[23, -14.6], [28.8, -14.6], [23, -19.4], [28.8, -19.4]],
    vorab: P => !state.inBasement && bw_rNah(P, { x0: 20, x1: 32, z0: -22, z1: -12 }, 9), aktiv: () => { const G = bw_grp('io_nr7'); return !!G && G.visible; },
    async bau(c) { const Yv = Y;
      // Wohnzimmer: Hildes Strickjacke hängt an der Haustür – sie ist ohne sie in den Regen gegangen; ihr Schirm lehnt daneben (nicht mitgenommen)
      await c.w('jacke', 'O', -13.2, Yv + 1.32, { at: 25.95, col: 0xb8a58a, r: .3 });
      c.papier('blatt', .15, .2, 22.13, Yv + 1.32, -12.2 - .014, { rx: 0, ry: PI, rz: .04 }); // ihre Strichliste neben dem Fenster: Fünfergruppen, jede Nacht
      await c.bw('schirm', 'N', 25.45, { lehnen: .12, r: .4 });
      // Tasse mit Teerand neben Hildes Stuhl am Fenster: sie hat hier nachts gesessen und gezählt
      await c.b('tasse', 21.95, -13.35, { ry: .6, r: .25 });
      // Laternenboten, gesammelt und gestapelt neben dem Sofa (sie hebt jede Ausgabe auf – Todesanzeigen, Vermisste)
      for (let i = 0; i < 4; i++) c.papierAuf(i % 2 ? 'zeitung' : 'zeitung2', .3, .4, 23.5 + i * .01, -16.55 + i * .01, { max: Yv + .2, lage: i + 1, rz: .1 + i * .35 });
      // ein Buch auf der Anrichte, Lesezeichen in der Mitte (Brillenetui fehlt: die Brille hatte sie auf der Straße)
      await c.a('buchL', 20.5, -15.05, { ry: .3, r: .2, min: Yv + .6, max: Yv + 1.1 });
      c.papier('zettel', .12, .17, 30.935, Yv + 1.45, -16.2, { rx: 0, ry: -PI / 2, rz: -.05 }); // Einkaufszettel am Kühlschrank: „Brot (Zayn)“ – sie kauft immer noch für ihn ein
      c.fleck('grime', .9, .45, 21.4, Yv + .45, -12.215, 'N', 0, 0x5a4a38, .7); // Kondenswasser läuft unter dem Fenster die Wand hinab
      c.netz(20.4, Yv + 1.3, -12.4, -PI / 4 + PI, .4);
      // Küche: das letzte Abendbrot – Teller mit Brotkante, Besteck, Tasse; der Stuhl daneben umgekippt: sie ist aufgesprungen
      const tl = await c.a('teller', 28.0, -14.95, { r: .25, min: Yv + .6, max: Yv + .95 }); if (tl) await c.a('brot', 28.02, -14.93, { stapel: true, r: .05, ry: 1.2, min: Yv + .6, max: Yv + 1 });
      await c.a('besteck', 28.3, -14.8, { ry: .9, r: .2, min: Yv + .6, max: Yv + .95 }); await c.a('tasse', 27.75, -15.2, { r: .2, min: Yv + .6, max: Yv + .95 });
      // Abgewaschenes Blechgeschirr auf der Arbeitsplatte, nie weggeräumt; die Thermoskanne für ihre Nachtschicht am Fenster
      await c.stapel('gTeller', 29.5, -12.5, 3, { auf: true, r: .35, min: Yv + .8, max: Yv + 1.05 }); await c.a('gKanne', 30.3, -12.48, { r: .3, min: Yv + .8, max: Yv + 1.05 });
      // Schlafzimmer: Wasserglas und aufgeschlagenes Buch neben dem Bett (Nachttisch gibt es nicht – sie stellt alles auf den Boden)
      await c.b('becher', 22.25, -21.25, { r: .25 }); await c.b('buch', 22.15, -20.7, { ry: 2.1, r: .3, col: '#5a3a2a' });
      await c.a('rahmen', 25.6, -19.2, { min: Yv + 1.4, max: Yv + 2.3, ry: -PI / 2 - .2, s: .75, r: .3 }); // gerahmtes Foto auf dem Schrank: Zayn mit sieben (das einzige, das noch steht)
      // Hauswirtschaftsraum: nasse Regenjacke am Haken, darunter Wasserfleck; Blecheimer
      await c.w('jacke', 'W', -17.75, Yv + 1.35, { at: 26.05, col: 0x3a4640, r: .3 });
      c.fleck('grime', .6, .5, 26.45, Yv + .005, -17.75, 'floor', .3, 0x3a3228, .75);
    } },
  // ================= Keller unter Nr. 7: das Ritual (Stuhl mit Riemen, Spielzeugkreis). Wer hat das Tonband aufgenommen? Es hängt an einem Kabel.
  { id: 'keller7', name: 'Keller Nr. 7', r: () => ({ x0: 295.15, x1: 304.85, z0: 296.15, z1: 303.85 }), y0: 0, h: 2.5, tueren: () => [[304.2, 302.5, 1.3]],
    vorab: P => bw_nah(P, 300, 300, 14), aktiv: () => { const G = bw_grp('io_keller'); return !!G && G.visible; },
    async bau(c) {
      c.kabel([[302.35, .77, 296.62], [302.45, .45, 296.4], [302.55, .015, 296.3], [303.6, .015, 296.22], [304.6, .02, 296.22], [304.78, .35, 296.2]]); // Tonband → Steckdose
      await c.fix('becher', 299.32, 0, 300.62, { ry: .4 }); // ein Blechbecher Wasser vor dem Stuhl – jemand hat dem Kind zu trinken gegeben
      await c.b('reifen', 297.6, 296.7, { r: .6, ry: .3 }); // alte Reifen: bevor hier das Ritual war, war es ein Keller
      await c.b('kette', 301.8, 303.25, { r: .4, ry: 1.1 }); // abgelegte Kette neben dem Eisenbett
      c.fleck('grime', 1.4, .8, 297.5, 2.0, 303.845, 'N', 0, 0x4a4032, .8); c.fleck('grime', 1.1, .9, 304.845, 1.7, 298.4, 'O', 0, 0x4a4032, .75); // Feuchtigkeit von draußen
      c.netz(295.4, 2.2, 296.4, PI / 4, .6); c.netz(304.6, 2.25, 303.6, -PI * .75, .5);
    } },
  // ================= Nr. 1 · Elternhaus Brandt: seit 2009 zu, Tücher über den Möbeln. Post kam weiter durch den Schlitz; niemand hat sie geöffnet.
  { id: 'nr1', name: 'Nr. 1 (Elternhaus)', r: () => ({ x0: -55.8, x1: -44.2, z0: -21.8, z1: -12.2 }), y0: Y, h: 2.76,
    tueren: () => [[-47, -12.2, .8], [-47, -17, .75], [-50, -14.4, .75], [-53, -17, .75]], augen: () => [[-47, -14.6], [-53, -14.6], [-53, -19.4], [-47, -19.4]],
    vorab: P => !state.inBasement && bw_rNah(P, { x0: -56, x1: -44, z0: -22, z1: -12 }, 9), aktiv: () => { const G = bw_grp('io_nr1'); return !!G && G.visible; },
    async bau(c) { const Yv = Y;
      // Wohnzimmer: Post unter dem Briefschlitz, Jahre alt, ungeöffnet
      for (let i = 0; i < 5; i++) c.papier(i % 3 === 2 ? 'prospekt' : 'brief', .2, .13, -47.45 + (i % 3) * .14 - .1, Yv + .016 + i * .0015, -12.75 - (i >> 1) * .12, { rz: .4 + i * .9 });
      await c.bw('schirm', 'N', -48.2, { lehnen: .12, r: .4 }); // Papas Schirm, seit 2009 an der Tür
      await c.stapel('buch', -46.5, -16.4, 5, { r: .45, cols: bw_farben(5) }); // Bücher, zum Einpacken gestapelt – nie eingepackt
      c.fleck('grime', 1.2, .9, -49.9 + .005, Yv + 2.3, -14.2, 'W', 0, 0x5a4a38, .7); // Wasserrand unter der Decke (Dach undicht seit Jahren)
      // Küche: zwei Teller im Abtropfgitter, seit Jahren trocken; ein Becher mit Kakaorand
      await c.stapel('gTeller', -54.9, -12.5, 2, { auf: true, r: .4, min: Yv + .8, max: Yv + 1.05 }); await c.a('gTasse', -55.35, -12.5, { r: .3, min: Yv + .8, max: Yv + 1.05 });
      // Kinderzimmer: Lukes Martinslaterne vom letzten Fest 2009 am Fußende – danach fiel das Laternenfest aus
      await c.b('laterneP', -51.3, -19.9, { r: .45, ry: .5, col: 0xf0d8a0 });
      c.papier('zeichnung', .3, .23, -51.95, Yv + 1.3, -21.8 + .014, { rx: 0, ry: 0, rz: -.04 }); // Kinderzeichnung: vier Strichmännchen und eine Laterne – MAMA PAPA LUCY LUKE
      await c.stapel('buch', -52.3, -18.25, 3, { r: .45, cols: ['#b03a2a', '#2a6ab0', '#d8b030'] }); // Kinderbücher neben dem Teppich
      // Elternschlafzimmer: Mamas Seite – Buch und Wasserglas auf dem Boden neben dem Bett
      await c.b('buchL', -45.95, -21.3, { ry: .7, r: .3 }); await c.b('becher', -45.9, -20.85, { r: .25 });
      c.netz(-44.4, Yv + 2.45, -21.6, -PI * .75, .6);
    } },
  // ================= Nr. 4 · Oma Erna Kranz (1934–2020), Zettel überall; riecht nach Mottenkugeln und Kaffee. Erdgeschoss.
  { id: 'nr4', name: 'Nr. 4 Erdgeschoss', r: () => bw_kbRect('nr4'), y0: 0, h: 2.75, tueren: () => [...bw_kbTuer('nr4'), [NR4.x - 1.6, NR4.z + .4, .8], [NR4.x - 5.25, NR4.z + 1.3, .9], [NR4.x + 3, NR4.z + .3, .8]],
    augen: () => [[NR4.x - 3, NR4.z + 2.5], [NR4.x + 3, NR4.z + 2.5], [NR4.x - 3, NR4.z - 2.5]],
    vorab: P => bw_kbIn('nr4') || bw_nah(P, NR4.haus.x, NR4.haus.z - 6, 12), aktiv: () => bw_kbIn('nr4'),
    async bau(c) { const X = NR4.x, Z = NR4.z, x0 = c.r.x0, x1 = c.r.x1, z0 = c.r.z0, z1 = c.r.z1;
      await c.bw('schirm', 'N', X - 4.0, { lehnen: .12, r: .4 }); // Omas Knirps neben der Haustür
      // Stube: Rosamunde-Pilcher-Romane neben dem Sessel (E-08), einer mit Eselsohr obenauf
      await c.stapel('buchL', X + 5.45, Z + 1.55, 4, { r: .4, cols: [null, '#c8b8a0', '#a8b8c8', '#d8a8a0'] });
      c.kabel([[X + 3.45, .62, Z + .22], [X + 3.52, .3, Z + .13], [X + 3.6, .012, Z + .13], [X + 4.5, .012, Z + .13], [X + 4.62, .3, Z + .11]]); // Fernseher → Steckdose
      // Küche: Kaffee (Blechkanne) und Geschirr auf der Arbeitsplatte, Besteck neben der Spüle; Brotdose
      await c.a('gKanne', x0 + 1.25, z0 + .42, { r: .3, min: .8, max: 1.05 }); await c.stapel('gTeller', x0 + 2.85, z0 + .42, 3, { auf: true, r: .35, min: .8, max: 1.05 });
      await c.a('besteck', x0 + 3.3, z0 + .45, { ry: .3, r: .3, min: .8, max: 1.05 });
      c.fleck('grime', 1.2, .7, x0 + .75, 1.35, z0 + .005, 'S', 0, 0x5a4630, .65); // Fettfilm über dem Herd
      c.netz(x1 - .2, 2.6, z0 + .2, -PI / 4, .55);
    }, nachher: () => bw_lampen('nr4') },
  // Nr. 4 oben: Lukes Jugendzimmer (2016) und Bad
  { id: 'nr4_og', name: 'Nr. 4 oben', r: () => bw_kbRect('nr4_og'), y0: 0, h: 2.45, tueren: () => [[NR4.og.x - 2.9, NR4.og.z + 1.2, .9], [NR4.og.x + 1.4, NR4.og.z + 1.2, .7]],
    vorab: P => !!(typeof kirchberg_S !== 'undefined' && kirchberg_S.inRaum && kirchberg_S.inRaum.startsWith('nr4')), aktiv: () => bw_kbIn('nr4_og'),
    async bau(c) { const O = NR4.og, a0 = c.r.x0, a1 = c.r.x1, b0 = c.r.z0, b1 = c.r.z1;
      await c.stapel('buch', a0 + 2.1, b1 - .45, 4, { r: .4, cols: ['#c83a2a', '#1a1a1a', '#e0d8c0', '#2a5a9a'] }); // Comics und Schulbücher, nie abgeholt
      c.kabel([[O.x + .45, .95, b0 + .18], [O.x + .55, .5, b0 + .14], [O.x + .6, .012, b0 + .16], [O.x + 1.1, .012, b0 + .14], [O.x + 1.2, .3, b0 + .11]]); // Fernseher → Steckdose
      await c.a('becher', a1 - .4, O.z - .7, { r: .3, min: .6, max: 1.0 }); // Zahnputzbecher im Bad
      c.fleck('grime', .9, .7, a1 - .6, 2.2, b0 + .005, 'S', 0, 0x4a4a3a, .6); // Stockfleck über der Dusche
    }, nachher: () => bw_lampen('nr4_og') },
  // Nr. 4 Keller: Pfandkisten, Einmachgläser – und Opa Kranz' Winterreifen von der Tankstelle
  { id: 'nr4_keller', name: 'Nr. 4 Keller', r: () => bw_kbRect('nr4_keller'), y0: 0, h: 2.3, tueren: () => [[NR4.keller.x - 2.4, NR4.keller.z + 2.1, 1.0]],
    vorab: P => !!(typeof kirchberg_S !== 'undefined' && kirchberg_S.inRaum && kirchberg_S.inRaum.startsWith('nr4')), aktiv: () => bw_kbIn('nr4_keller'),
    async bau(c) { const K = NR4.keller, d0 = c.r.z0;
      await c.b('reifen', K.x + 2.0, d0 + .55, { r: .5, ry: .4 }); // Winterreifen „KRANZ“, seit der Tankstelle hier
      await c.b('sack', K.x + 1.0, K.z + 1.7, { r: .5, col: 0x8a7a58 }); // Kartoffelsack
      c.fleck('grime', 1.3, .7, K.x + 1.5, 1.9, d0 + .005, 'S', 0, 0x3a3228, .8); c.netz(c.r.x1 - .2, 2.1, K.z + 2.3, -PI * .75, .7);
    }, nachher: () => bw_lampen('nr4_keller') },
  // ================= Giselas Küche und Stube: siebzehn Näpfe, alle Uhren auf 3:13, Hänschen (1958)
  { id: 'gisela', name: 'Giselas Haus', r: () => bw_kbRect('gisela'), y0: 0, h: 2.55, tueren: () => [...bw_kbTuer('gisela'), [KB_RAUM.gisela.x + 1, KB_RAUM.gisela.z + 1.6, .8]],
    augen: () => [[KB_RAUM.gisela.x - 2.2, KB_RAUM.gisela.z + 1.2], [KB_RAUM.gisela.x + 3, KB_RAUM.gisela.z]],
    vorab: P => bw_kbIn('gisela') || bw_nah(P, KB_HAUS.x, KB_HAUS.z + KB_HAUS.d / 2 + 1.6, 12), aktiv: () => bw_kbIn('gisela'),
    async bau(c) { const C = KB_RAUM.gisela, x0 = c.r.x0;
      // Näpfe auch drinnen, auf Zeitung – für die, die nachts durchs Küchenfenster kommen
      c.papier('zeitung', .36, .46, C.x - 3.35, .004, C.z + 1.55, { rz: .25 }); await c.fix('gTeller', C.x - 3.45, .006, C.z + 1.45, { s: .8 }); await c.fix('becher', C.x - 3.2, .006, C.z + 1.7, { col: 0xa8b0b0 });
      await c.w('jacke', 'S', C.x - 3.7, 1.35, { col: 0x6a7a5a, r: .45 }); // Strickjacke am Haken
      await c.b('sack', C.x - 3.9, C.z + .55, { r: .45, col: 0xb8a882 }); // Katzenstreu, Zehn-Kilo-Sack, angerissen
      await c.stapel('buch', C.x + 1.45, C.z - 2.9, 3, { r: .4, cols: ['#8a3a3a', '#3a5a3a', '#c8a860'] }); // Katzenkalender und Rätselhefte
      c.kabel([[C.x + 3.25, .62, c.r.z1 - .22], [C.x + 3.35, .3, c.r.z1 - .15], [C.x + 3.4, .012, c.r.z1 - .14], [C.x + 3.9, .012, c.r.z1 - .12], [C.x + 4.0, .3, c.r.z1 - .11]]); // Fernseher
      await c.w('rahmen2', 'W', C.z + 1.55, 1.55, { r: .3 }); // noch ein Foto von Hänschen in der Küche, über dem Herd
      c.fleck('grime', 1.0, .6, x0 + .005, .35, C.z + 1.7, 'W', 0, 0x4a3a28, .6); // Katzenschmutz am Sockel
    } },
  // ================= Pfarrhaus, Studierzimmer: Pfarrer Bernhard Voss, seit 1992 verschwunden; Gisela macht jeden Abend das Licht an
  { id: 'pfarrhaus', name: 'Pfarrhaus', r: () => bw_kbRect('pfarrhaus'), y0: 0, h: 2.8, tueren: () => bw_kbTuer('pfarrhaus'),
    vorab: P => bw_kbIn('pfarrhaus') || bw_nah(P, KB_PFARR.x, KB_PFARR.z + KB_PFARR.d / 2 + 1.7, 12), aktiv: () => bw_kbIn('pfarrhaus'),
    async bau(c) { const C = KB_RAUM.pfarrhaus, x1 = c.r.x1, z0 = c.r.z0, z1 = c.r.z1;
      await c.a('brille', C.x + 1.6, C.z + .55, { ry: .5, r: .2, min: .6, max: 1.0 }); // Voss' Lesebrille, zusammengeklappt – als käme er gleich wieder
      await c.a('buchL', C.x + .4, C.z + .78, { ry: -.3, r: .25, min: .6, max: 1.0 });
      await c.a('kerzeB', C.x + 1.3, C.z + .75, { r: .25, min: .6, max: 1.0 }); // Kerzenstummel für die Stromausfälle // Bibel, aufgeschlagen (Juni 1992)
      await c.a('ascher', C.x + 1.95, C.z + .7, { r: .2, min: .6, max: 1.0 }); // Pfeifenasche, 34 Jahre alt
      await c.bw('schirm', 'W', C.z + 2.2, { lehnen: .12, r: .4 }); // sein schwarzer Schirm an der Tür
      c.kabel([[C.x + 2.25, .9, C.z + .12], [C.x + 2.35, .45, C.z + .05], [C.x + 2.4, .012, C.z], [x1 - .1, .012, C.z - .45], [x1 - .02, .3, C.z - .5]]); // Radio → Steckdose
      await c.stapel('buch', C.x - .4, z0 + .55, 4, { r: .5, cols: ['#3a2a1a', '#2a2a3a', '#5a4a2a', '#1a1a1a'] }); // Predigtliteratur, aus dem Regal genommen, nie zurückgestellt
      for (const [x, z, ry] of [[c.r.x0 + .2, z0 + .2, PI / 4], [x1 - .2, z0 + .2, -PI / 4], [x1 - .2, z1 - .2, -PI * .75]]) c.netz(x, 2.65, z, ry, .55); // 34 Jahre Spinnweben in den Deckenecken
      c.fleck('grime', 1.4, 1.0, C.x + 1.2, 2.795, C.z + .4, 'ceil', .3, 0x3a3028, .6); // Ruß über der Glühbirne
    } },
  // ================= Kapelle St. Martin, innen: das Laternenfest fällt aus (Brandschutz) – die Laternen der Kinder stehen gesammelt an der Tür
  { id: 'kapelle', name: 'Kapelle innen', r: () => bw_kbRect('kapelle'), y0: 0, h: 6, tueren: () => bw_kbTuer('kapelle'),
    augen: () => [[KB_RAUM.kapelle.x, KB_RAUM.kapelle.z], [KB_RAUM.kapelle.x, KB_RAUM.kapelle.z + 5.3]],
    vorab: P => bw_kbIn('kapelle') || bw_nah(P, KB_KAP.x, 77.8, 12), aktiv: () => bw_kbIn('kapelle'),
    async bau(c) { const C = KB_RAUM.kapelle, x0 = c.r.x0, x1 = c.r.x1, z0 = c.r.z0, z1 = c.r.z1;
      // eingesammelte Martinslaternen in der Ecke links der Tür (Aushang: „Keine Laternen im Freien“)
      for (const [dx, dz, col] of [[.35, -.4, 0xf0c070], [.75, -.35, 0xe08a60], [.5, -.8, 0xb0c8e0]]) await c.b('laterneP', x0 + dx, z1 + dz, { r: .25, ry: dx * 4, col });
      // Gesangbücher auf den Bänken liegengeblieben
      for (const [dx, row, ry] of [[-1.3, 1, .4], [1.15, 2, -.3], [-2.1, 3, 1.2], [2.2, 4, .9]]) await c.a('buchL', C.x + dx, C.z + 3.6 - row * 1.35 + .05, { ry, r: .2, min: .3, max: .75 });
      // Votivkerzen vor der Madonna (sie brennen – jemand kommt noch)
      for (const [dx, dz, k] of [[.55, .55, 'kerzeA'], [.7, .35, 'kerzeB'], [.4, .75, 'kerzeA'], [.85, .7, 'kerzeC']]) { const q = await c.b(k, x0 + .6 + dx, z0 + .8 + dz, { r: .12 }); c.flamme(q); }
      await c.b('urne', C.x + .95, z1 - .55, { r: .4 }); // Opferstock an der Tür
      c.fleck('grime', .9, .7, C.x, .006, z0 + 1.25, 'floor', .4, 0xd8c8a0, .35); // Wachs auf dem Boden vor dem Altar
      for (const [x, z, ry] of [[x0 + .2, z0 + .2, PI / 4], [x1 - .2, z1 - .2, -PI * .75], [x0 + .2, z1 - .2, PI * .75]]) c.netz(x, 5.4, z, ry, 1.1);
    }, nachher: () => bw_lampen('kapelle') },
  // ================= Günthers Schuppen hinter der Tankstelle (Postbote Günther Maas, gelbe Regenjacke, „Zigaretten für schlechte Zeiten“)
  { id: 'schuppen', name: 'Günthers Schuppen', r: () => bw_kbRect('schuppen'), y0: 0, h: 2.5, tueren: () => bw_kbTuer('schuppen'),
    vorab: P => bw_kbIn('schuppen') || bw_nah(P, 102.4, -26.5, 12), aktiv: () => bw_kbIn('schuppen'),
    async bau(c) { const C = POST_RAUM.schuppen, x0 = c.r.x0, x1 = c.r.x1, z0 = c.r.z0;
      await c.w('jacke', 'W', C.z + .9, 1.35, { col: 0xe0b830, r: .5 }); // die zweite gelbe Regenjacke
      await c.a('thermos', x1 - .75, z0 + .42, { r: .25, min: .6, max: 1.0 }); await c.a('becher', x1 - .3, z0 + .5, { r: .2, min: .6, max: 1.0 }); // Kaffee für die Nachtrunde
      await c.a('ascher', x1 - .55, z0 + .5, { r: .35, min: .3, max: 1.1 }); // „Zigaretten für schlechte Zeiten“ – es gab viele
      await c.b('reifen', x0 + .5, C.z + .2, { r: .5 }); // REIFEN – KRANZ: der Schuppen gehörte zur Tankstelle
      await c.a('kette', x1 - .7, z0 + .4, { r: .35, min: .3, max: 1.1, ry: .6 }); // Fahrradkette zum Wechseln
      await c.b('kanister', x0 + .5, C.z + .95, { r: .45, ry: .4 }); // Benzinkanister von der Tankstelle Kranz
      for (let i = 0; i < 4; i++) c.papier('prospekt', .24, .32, C.x + .3 + (i % 2) * .05, .006 + i * .003, C.z - .4 + i * .02, { rz: .2 * i }); // Werbeprospekte, nach Jahren gebündelt
      c.kabel([[x1 - .45, .95, z0 + .2], [x1 - .3, .6, z0 + .14], [x1 - .12, .4, z0 + .12], [x1 - .1, 1.2, z0 + .12], [x1 - .1, 2.35, z0 + .3]]); // Radio → Leitung an der Wand hoch
    } },
  // ================= Nr. 9, Beobachtungsposten: Messstelle Kirchberg, Nachtdienst – hier wurde gewacht, gegessen, geraucht
  { id: 'posten', name: 'Nr. 9 Posten', r: () => bw_kbRect('posten'), y0: 0, h: 2.6, tueren: () => [],
    vorab: P => bw_kbIn('posten') || bw_nah(P, 50, -8, 14), aktiv: () => bw_kbIn('posten'),
    async bau(c) { const C = POST_RAUM.posten, z0 = c.r.z0, z1 = c.r.z1;
      await c.a('ascher', C.x - .25, z0 + .35, { r: .25, min: .6, max: 1.0 }); await c.a('feuerzeug', C.x - .1, z0 + .55, { r: .2, min: .6, max: 1.0, ry: .7 }); // lange Nächte
      await c.a('gTasse', C.x - .8, z0 + .6, { r: .2, min: .6, max: 1.0 });
      await c.w('jacke', 'N', C.x - 1.1, 1.35, { col: 0x3a3a38, r: .4 }); // Dienstjacke am Haken
      await c.bw('sack', 'N', C.x + 1.4, { r: .4, col: 0x2a2a2a }); // Müllsack mit leeren Dosen
      c.kabel([[C.x - .95, .95, z0 + .22], [C.x - 1.1, .5, z0 + .14], [C.x - 1.15, .012, z0 + .14], [c.r.x0 + .1, .012, z0 + .3], [c.r.x0 + .02, .3, z0 + .35]]); // Funk → Steckdose
      c.kabel([[C.x + 1.2, 1.3, z0 + .5], [C.x + 1.18, .6, z0 + .55], [C.x + .9, .012, z0 + .4], [C.x - .2, .012, z0 + .2]], .004); // Kamera-Kabel zum Tisch
    } },
  // ================= Nr. 3 · Vegas' Stube (Kap. 4): Alufolie, drei Funkgeräte, Mondlandung LÜGE; Bruno ist wieder da (frisst keinen Speck)
  { id: 'nr3', name: 'Nr. 3 (Vegas)', r: () => typeof VILLA_R !== 'undefined' ? { x0: VILLA_R.nr3.x0 + .1, x1: VILLA_R.nr3.x1 - .1, z0: VILLA_R.nr3.z0 + .1, z1: VILLA_R.nr3.z1 - .1 } : null, y0: 0, h: 2.6,
    tueren: () => [[-981, 860.9, 1.0]], augen: () => [[-981, 858]],
    vorab: () => typeof VILLA !== 'undefined' && VILLA.gebaut.has('nr3'), aktiv: () => typeof VILLA !== 'undefined' && VILLA.raum === 'nr3' && VILLA.g && VILLA.g.visible,
    async bau(c) { const R = c.r;
      await c.b('teller', R.x1 - .55, R.z1 - .45, { r: .4, col: 0xb8bcc0 }); // Brunos Napf – unangerührt (er frisst keinen Speck mehr)
      await c.stapel('ordner', R.x1 - .35, R.z0 + .35, 5, { r: .45, cols: ['#2a3a5a', '#5a2a2a', '#2a4a2a', '#4a4a4a', '#2a3a5a'] }); // Ordner „(hw)“: Gasleck 1975, Umspannwerk
      await c.bw('kanister', 'W', R.z0 + .5, { r: .6 }); await c.bw('kanister', 'W', R.z0 + 1.0, { r: .6, ry: .3 }); // Notvorrat Wasser
      await c.a('ascher', R.x1 - .35, 857.55, { r: .25, min: .9, max: 1.4 });
      await c.b('kette', R.x1 - .95, R.z1 - .4, { r: .35, ry: 2.2 }); // Brunos Kette – er braucht sie nicht mehr, er bleibt von allein
      // Kabelsalat: drei Funkgeräte auf der Kommode, eine Leitung zur Steckdose, eine Antenne durchs Fenster (Folie aufgeschnitten)
      c.kabel([[R.x1 - .3, 1.24, 856.5], [R.x1 - .1, 1.0, 856.3], [R.x1 - .02, .3, 856.1]]); c.kabel([[R.x1 - .3, 1.26, 857.2], [R.x1 - .05, 1.2, 856.8], [R.x1 - .03, .5, 856.2], [R.x1 - .03, .05, 855.6], [R.x1 - .6, .012, 855.2], [-978.55, .012, 855.16], [-978.55, .6, 855.13], [-978.55, .98, 855.13]], .005);
      // Wand der Wahrheit zwischen den Fenstern: Zeitungsausschnitte über Lichter am Himmel
      for (const [x, y, art, rz] of [[-981.3, 1.55, 'zeitung2', .06], [-980.75, 1.7, 'zeitung', -.05], [-981.05, 1.15, 'brief', .1], [-980.6, 1.25, 'zeitung2', -.12]]) c.papier(art, art === 'brief' ? .22 : .2, art === 'brief' ? .14 : .27, x, y, R.z0 + .012, { rx: 0, ry: 0, rz });
      c.fleck('grime', .9, .6, -979.3, .012, 860.25, 'floor', .4, 0x3a3028, .5); // Brunos Liegeplatz an der Tür
      if (typeof figuren_hund === 'function') figuren_hund(c.g, -979.3, 860.25, { y: c.y0, ry: Math.PI, wandern: [[-979.3, 860.25], [-979.3, 859.55]] }); // Q-9 B-3 / Q-6: Bruno ist wieder da – und falsch (figuren.js)
    } },
  // ================= Amt Ebene −2 (Bundesstelle für Rückführung, seit 2012 verlassen – Kalender März 2012): wer wartete, wer arbeitete
  { id: 'amt_tunnel', name: 'Amt · Tunnel/Wartebereich', r: () => ({ x0: C2.x + .2, x1: C2.x + 17.8, z0: C2.z - 1.84, z1: C2.z + 1.84 }), y0: 0, h: C2.h, tueren: () => [[C2.x, C2.z, 1], [C2.x + 18, C2.z, 1]],
    vorab: P => bw_rNah(P, { x0: C2.x, x1: C2.x + 18, z0: C2.z - 2, z1: C2.z + 2 }, 14), aktiv: () => bw_rNah(player.pos, { x0: C2.x, x1: C2.x + 18, z0: C2.z - 2, z1: C2.z + 2 }, 22),
    async bau(c) { const X = C2.x, Z = C2.z, zN = c.r.z1, zS = c.r.z0;
      await c.bw('schirm', 'N', X + 6.9, { lehnen: .15, r: .5 }); // vergessener Schirm am Wartebereich
      await c.b('teddyR', X + 1.55, zN - .3, { r: .4, ry: PI + .3 }); // ein Teddy neben dem ersten Wartestuhl: „Begleitpersonen warten im Wartebereich“
      c.papierAuf('zeitung', .3, .4, X + 3.85, zN - .25, { min: .3, max: .7, rz: .3 }); // Laternenbote vom Juli 2009 auf einem Stuhl
      await c.b('becher', X + 5.0, zN - .5, { r: .3 });
      c.kabel([[X + .3, C2.h - .06, zS + .05], [X + 9, C2.h - .07, zS + .05], [X + 11, C2.h - .35, zS + .08], [X + 13, C2.h - .07, zS + .05], [X + 17.7, C2.h - .06, zS + .05]], .012); // Kabelkanal, ein Stück heruntergerissen
      c.fleck('grime', 1.6, 1.1, X + 8.2, C2.h - .6, zS + .004, 'S', 0, 0x3a3a30, .75); c.fleck('grime', 1.2, .9, X + 2.2, C2.h - .5, zN - .004, 'N', 0, 0x3a3a30, .7); // Wasser drückt durch den Beton
    } },
  { id: 'amt_archiv', name: 'Amt · Archiv', r: () => ({ x0: C2.x + 18.2, x1: C2.x + 29.8, z0: C2.z - 5.8, z1: C2.z + 5.8 }), y0: 0, h: C2.h,
    tueren: () => [[C2.x + 18, C2.z, 1], [C2.x + 18, C2.z - 4.6, .8], [C2.x + 18, C2.z + 4.3, .8], [C2.x + 30, C2.z, 1]],
    vorab: P => bw_rNah(P, { x0: C2.x + 18, x1: C2.x + 30, z0: C2.z - 6, z1: C2.z + 6 }, 12), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 18, x1: C2.x + 30, z0: C2.z - 6, z1: C2.z + 6 }, 20),
    async bau(c) { const X = C2.x, Z = C2.z;
      await c.stapel('ordner', X + 22.6, Z + 5.3, 6, { r: .5, cols: ['#8a8a78', '#5a6a5a', '#a89a7a', '#8a8a78', '#6a6a5a', '#a89a7a'] }); // Akten, die nicht mehr in die Schränke passten
      await c.stapel('ordner', X + 27.2, Z + 5.25, 4, { r: .5, cols: ['#a89a7a', '#5a6a5a', '#8a8a78', '#6a6a5a'] });
      for (let i = 0; i < 5; i++) c.papier('akte', .21, .29, X + 21.2 + i * .23, .016 + i * .002, Z - .9 + Math.sin(i * 2.1) * .3, { rz: i * .9 }); // heruntergefallene Blätter vor dem Rollwagen
      await c.b('tasse', X + 29.4, Z - 2.6, { r: .4 }); // Kaffeetasse auf dem Boden neben der Ordnungstafel – Schimmelrand
      c.fleck('grime', 2.0, 1.2, X + 24, .012, Z + 1.2, 'floor', .2, 0x3a3428, .5); // ausgetretener Laufweg zwischen den Schränken
    } },
  { id: 'amt_kantine', name: 'Amt · Kantine', r: () => ({ x0: C2.x + 6.15, x1: C2.x + 17.85, z0: C2.z + 2.15, z1: C2.z + 7.85 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 18, C2.z + 4.3, .9]],
    vorab: P => bw_rNah(P, { x0: C2.x + 6, x1: C2.x + 18, z0: C2.z + 2, z1: C2.z + 8 }, 10), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 6, x1: C2.x + 18, z0: C2.z + 2, z1: C2.z + 8 }, 16),
    async bau(c) { const X = C2.x, Z = C2.z;
      // das letzte Mittagessen (März 2012): Blechteller mit Gabel, Becher – „Bitte Geschirr zurückbringen“ hat keiner mehr getan
      const kt = await c.a('gTeller', X + 10.5, Z + 5.0, { r: .5, min: .3, max: 1.0 }); if (kt) await c.a('gGabel', (kt.bb.min.x + kt.bb.max.x) / 2, (kt.bb.min.z + kt.bb.max.z) / 2, { stapel: true, r: .05, min: .3, max: 1.05, ry: .7 });
      await c.a('gTasse', X + 13.3, Z + 4.6, { r: .4, min: .3, max: 1.0 }); await c.a('gLoeffel', X + 9.9, Z + 5.35, { r: .4, min: .3, max: 1.0, ry: 2.1 });
      c.fleck('grime', .8, .6, X + 12, .012, Z + 4, 'floor', 1.2, 0x4a3a28, .55);
    } },
  { id: 'amt_registratur', name: 'Amt · Hängeregistratur', r: () => ({ x0: C2.x + 6.15, x1: C2.x + 17.85, z0: C2.z - 7.85, z1: C2.z - 2.15 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 18, C2.z - 4.6, .9]],
    vorab: P => bw_rNah(P, { x0: C2.x + 6, x1: C2.x + 18, z0: C2.z - 8, z1: C2.z - 2 }, 10), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 6, x1: C2.x + 18, z0: C2.z - 8, z1: C2.z - 2 }, 16),
    async bau(c) { const X = C2.x, Z = C2.z;
      await c.stapel('ordner', X + 8.2, Z - 7.4, 5, { r: .6, cols: ['#8a8a78', '#a89a7a', '#5a6a5a', '#8a8a78', '#a89a7a'] }); // aussortierte Mappen „Zyklen“
      for (let i = 0; i < 3; i++) c.papier('akte', .21, .29, X + 12.4 + i * .3, .016 + i * .002, Z - 4.9 + i * .1, { rz: 1 + i }); // Blätter aus einer Hängemappe
      c.fleck('grime', 1.2, .8, X + 15, C2.h - .5, Z - 7.845, 'S', 0, 0x3a3a30, .7);
    } },
  { id: 'amt_sicherung', name: 'Amt · Sicherungsraum', r: () => ({ x0: C2.x + 30.15, x1: C2.x + 35.85, z0: C2.z + 2.15, z1: C2.z + 7.85 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 33, C2.z + 2, .8], [C2.x + 31, C2.z + 8, .8]],
    vorab: P => bw_rNah(P, { x0: C2.x + 30, x1: C2.x + 36, z0: C2.z + 2, z1: C2.z + 8 }, 10), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 30, x1: C2.x + 36, z0: C2.z + 2, z1: C2.z + 8 }, 16),
    async bau(c) { const X = C2.x, Z = C2.z;
      c.kabel([[X + 30.2, 2.3, Z + 7.8], [X + 31.5, 2.32, Z + 7.8], [X + 32.6, 2.3, Z + 7.8], [X + 32.9, 1.9, Z + 7.8]], .01); // Hauptleitung zum Sicherungskasten
      c.fleck('grime', .9, .7, X + 33, 1.0, Z + 7.845, 'N', 0, 0x2a2622, .55); // Ruß unter dem Kasten (Kurzschluss)
    } },
  { id: 'amt_planung', name: 'Amt · Planungsraum', r: () => ({ x0: C2.x + 30.15, x1: C2.x + 37.85, z0: C2.z + 8.15, z1: C2.z + 13.85 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 31, C2.z + 8, .8]],
    vorab: P => bw_rNah(P, { x0: C2.x + 30, x1: C2.x + 38, z0: C2.z + 8, z1: C2.z + 14 }, 10), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 30, x1: C2.x + 38, z0: C2.z + 8, z1: C2.z + 14 }, 16),
    async bau(c) { const X = C2.x, Z = C2.z;
      await c.b('gTasse', X + 37.4, Z + 13.4, { r: .4 }); // Pinselbecher des Modellbauers
      for (let i = 0; i < 3; i++) c.papier('blatt', .21, .29, X + 31 + i * .35, .016, Z + 13.2 - i * .15, { rz: .5 + i }); // Skizzen der Häuser, Strichlisten
    } },
  { id: 'amt_pruef', name: 'Amt · Prüfraum 3', r: () => ({ x0: C2.x + 36.15, x1: C2.x + 45.85, z0: C2.z - 4.85, z1: C2.z + 4.85 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 36, C2.z, 1], [C2.x + 46, C2.z, 1]],
    vorab: P => bw_rNah(P, { x0: C2.x + 36, x1: C2.x + 46, z0: C2.z - 5, z1: C2.z + 5 }, 10), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 36, x1: C2.x + 46, z0: C2.z - 5, z1: C2.z + 5 }, 16),
    async bau(c) { const X = C2.x, Z = C2.z;
      c.fleck('grime', 1.4, .9, X + 41, .012, Z - 3.8, 'floor', .7, 0x3a3228, .5); c.netz(X + 45.6, 2.3, Z + 4.6, -PI * .75, .7); c.netz(X + 36.4, 2.3, Z - 4.6, PI / 4, .6);
    } },
  { id: 'amt_gang', name: 'Amt · Langer Gang', r: () => ({ x0: C2.x + 46.2, x1: C2.x + 105.8, z0: C2.z - 1.84, z1: C2.z + 1.84 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 46, C2.z, 1], [C2.x + 106, C2.z, 1]],
    vorab: P => bw_rNah(P, { x0: C2.x + 46, x1: C2.x + 106, z0: C2.z - 2, z1: C2.z + 2 }, 12), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 46, x1: C2.x + 106, z0: C2.z - 2, z1: C2.z + 2 }, 24),
    async bau(c) { const X = C2.x, zS = c.r.z0, zN = c.r.z1;
      c.kabel([[X + 46.4, C2.h - .06, zN - .05], [X + 70, C2.h - .06, zN - .05], [X + 72.5, C2.h - .4, zN - .08], [X + 75, C2.h - .06, zN - .05], [X + 105.6, C2.h - .06, zN - .05]], .012); // Kabelkanal
      for (const x of [54, 67, 81, 96]) c.fleck('grime', 1.2, .9, X + x, C2.h - .55, (x % 2 ? zS + .004 : zN - .004), x % 2 ? 'S' : 'N', 0, 0x3a3a30, .7); // Wasserläufe
    } },
  // ================= Zimmer 7 · Hilde Wendts Büro im Amt (hier zog sie 2009 die Kugel „WENDT, Z.“)
  { id: 'zimmer7', name: 'Amt · Zimmer 7', r: () => ({ x0: C2.x + 30.15, x1: C2.x + 35.85, z0: C2.z - 7.85, z1: C2.z - 2.15 }), y0: 0, h: C2.h, tueren: () => [[C2.x + 33, C2.z - 2, .9]],
    vorab: P => bw_rNah(P, { x0: C2.x + 30, x1: C2.x + 36, z0: C2.z - 8, z1: C2.z - 2 }, 10), aktiv: () => bw_rNah(player.pos, { x0: C2.x + 30, x1: C2.x + 36, z0: C2.z - 8, z1: C2.z - 2 }, 16),
    async bau(c) { const X = C2.x, Z = C2.z;
      await c.bw('schirm', 'N', X + 35.2, { lehnen: .12, r: .4 }); // Hildes Schirm – sie hat ihn am letzten Tag hier stehen lassen
      await c.stapel('ordner', X + 30.5, Z - 7.4, 4, { r: .5, cols: ['#a89a7a', '#5a6a5a', '#8a8a78', '#a89a7a'] }); // Vorgänge Zyklus 2009
      await c.b('eimer', X + 35.4, Z - 4.2, { r: .5, s: .8 }); // Papierkorb
      c.papierAuf('akte', .16, .16, X + 35.4, Z - 4.2, { min: .15, max: .45 }); // zerknülltes Blatt obenauf
      c.fleck('grime', 1.1, .8, X + 33, .012, Z - 6.2, 'floor', .3, 0x3a3228, .45);
    } }
];

// Lampen der Kirchberg-Räume (Nr. 4, Kapelle) tragen den Raum: nur Stärke anheben (einmal), keine neuen Lichter
function bw_lampen(id) { const R = bw_kb(id); if (!R || !R.licht || R.bwHell) return; R.bwHell = true; for (const L of R.licht) L.intensity *= id === 'kapelle' ? 1.8 : 1.4; }
// Vor dem Betreten fertig bauen (höchstens kurz warten, sonst im Hintergrund weiter)
async function bw_vorher(id, warte = 1500) { const S = bw_S; if (S.halt || S.gebaut.has(id)) return; const D = BW_RAEUME.find(d => d.id === id); if (!D) return;
  while (S.bau && S.bauId !== id) { try { await S.bau; } catch (e) {} } if (S.gebaut.has(id)) return;
  if (!S.bau) { S.bauId = id; S.bau = bw_bauen(D).catch(e => console.warn('bewohnt', id, e)).finally(() => { S.bau = null; S.bauId = null; }); }
  const p = S.bau; await (warte ? Promise.race([p, wait(warte)]) : p); }

// Kapelle außen: das schwarze Brett (Fensterfläche frei in der Luft neben der Kapelle) weg; die Klickfläche an die echte Ostflanke der Kapelle
function bw_kapelleAussen() { const K = typeof kirchberg_S !== 'undefined' ? kirchberg_S : null; if (!K || !K.fensterTex) return;
  let brett = null; scene.traverse(o => { if (o.isMesh && o.material && o.material.map === K.fensterTex && o.parent === scene) brett = o; }); if (brett) { brett.visible = false; bw_S.brettWeg = true; } }
function bw_kapelleHit() {
  const hit = interactables.find(m => m.userData && m.userData.label === 'Kapellenfenster (mit der Lampe)'); const ch = typeof ausbau_nord !== 'undefined' ? ausbau_nord.chapel : null; if (!hit || !ch) { bw_S.fensterHit = !hit ? 'keine Klickfläche' : 'keine Kapelle'; return; }
  ch.updateMatrixWorld(true); const cb = new THREE.Box3().setFromObject(ch), cc = cb.getCenter(BW_V()), rc = new THREE.Raycaster(); let best = null;
  const o = BW_V(hit.position.x, 2.2, hit.position.z), d = BW_V(cc.x - o.x, 0, cc.z - o.z).normalize(); rc.set(o, d); rc.far = 20;
  const h = rc.intersectObject(ch, true)[0]; if (h) best = { x: h.point.x - d.x * .3, z: h.point.z - d.z * .3 };
  if (best) { hit.position.set(best.x, 2.1, best.z); hit.rotation.y = Math.atan2(d.x, d.z); hit.scale.set(1.3, 1.2, 1); hit.updateMatrixWorld(true); bw_S.fensterHit = [+best.x.toFixed(2), +best.z.toFixed(2)]; } else bw_S.fensterHit = 'kein Treffer'; }

// ---------------------------------------------------------------------  Laden, Takt
WORLD_MODS.push(['Bewohnt (Q-8: Innenräume Kap. 1–5)', async () => {
  const S = bw_S;
  scene.traverse(o => { if (!S.cob && o.isMesh && o.material && o.material.transparent && o.material.map && o.material.color && o.material.color.getHex() === 0xd8d4c8 && o.geometry.type === 'BufferGeometry') S.cob = o; });
  try { bw_kapelleAussen(); } catch (e) { console.warn('bewohnt: Kapelle außen', e); }
  // Kirchberg-Räume: vor der Überblendung fertig bauen; Villa Nr. 3: im Bau der Villa (während ihrer Überblendung)
  if (typeof kirchberg_rein === 'function') { const alt = kirchberg_rein; kirchberg_rein = async function (id, o) { try { if (BW_RAEUME.some(d => d.id === id)) await bw_vorher(id); } catch (e) {} return alt(id, o); }; }
  if (typeof VILLA_BAU !== 'undefined' && VILLA_BAU.nr3) { const alt = VILLA_BAU.nr3; VILLA_BAU.nr3 = async R => { await alt(R); try { await bw_vorher('nr3', 2500); } catch (e) {} }; }
  S.ready = true;
  window.__bw = { S, R: BW_RAEUME, bau: id => { const h = S.halt; S.halt = false; const p = bw_vorher(id, 0); S.halt = h; return p; }, halt: on => { S.halt = !!on; }, info: () => ({ gebaut: [...S.gebaut.keys()], log: S.log, fehlt: [...S.fehlt], brett: !!S.brettWeg, hit: S.fensterHit }) }; // Testzugriff
}]);
WORLD_TICK.push((dt, t) => { const S = bw_S; if (!S.ready) return; S.t -= dt;
  for (let i = 0; i < S.liste.length; i++) { const E = S.liste[i], on = !!E.D.aktiv(); if (E.g.visible !== on) E.g.visible = on; }
  if (S.t <= 0) { S.t = .3; const P = player.pos;
    if (!S.kapOk && bw_nah(P, KB_KAP.x, 82, 30)) { S.kapOk = true; try { bw_kapelleHit(); } catch (e) { console.warn('bewohnt: Kapellenfenster', e); } }
    if (!S.halt && !S.bau && state.started) for (const D of BW_RAEUME) { if (S.gebaut.has(D.id)) continue; let v = false; try { v = D.vorab(P); } catch (e) {} if (v) { bw_vorher(D.id, 0); break; } } }
  for (let i = 0; i < S.flammen.length; i++) { const f = S.flammen[i]; if (!f.g.visible) continue; const k = .85 + Math.sin(t * 9 + f.seed) * .08 + Math.sin(t * 23 + f.seed * 2) * .06; f.fl.scale.set(.04 * k, .075 * k, 1); } });
// Fülllicht mit Quelle (visual_identity.md §2): Nr. 4 und Kapelle waren zu dunkel. Streulicht der brennenden Lampen/Kerzen und des Mondes durch die Fenster –
// nur die Hemisphäre (keine Lichter). Quellen: Omas Lampen brennen immer (Flur-Birne, Stehlampen), in der Kapelle die Kerzen; bei Stromausfall weniger.
if (typeof LICHT_HAKEN !== 'undefined') LICHT_HAKEN.push(() => { if (typeof kirchberg_S === 'undefined') return; const id = kirchberg_S.inRaum; if (!id) return;
  const k = id === 'kapelle' ? .22 : id === 'nr4' ? .2 : id === 'nr4_og' ? .16 : id === 'nr4_keller' ? .1 : 0; if (!k || !bw_S.gebaut.has(id)) return;   hemi.intensity += k * (state.outage ? .6 : 1); });
