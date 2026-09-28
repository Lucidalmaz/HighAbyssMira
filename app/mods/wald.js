// =====================================================================  WALD (Modul „wald“): Forbidden Dustwoods – der Wald hinter dem Spielplatz
// Nördlich des Spielplatzes (x −40…110, z 99…156). Eingang: Lücke im Nordzaun bei x 26–34 (gruen.js lässt dort den Zaun weg).
// Dicht, tot, lebendig: Totholz-Scans in Blöcken (≤ 1000 Instanzen je Block → echte Kollision), Unterholz (weich: bremst, raschelt), Findlinge, Laub.
// Grenze: Weidezaun + Dickicht (sichtbar, keine unsichtbaren Wände). Wege sind freigeschlagen und mit Laub/Schlamm markiert.
// Tiere (echte, gerigte Modelle aus leben.js): Rehe und ein Hirsch auf der Lichtung · ein Fuchs mit einem Kinderschuh · Wölfe und ein Welpe in einer Drahtschlinge.
// Orte: Zayns Hütte (Modul zayn) · Cleos Baumhaus (Modul cleo) · das Waldschild. Aufgaben: „Die Schlinge“ (Drahtschneider), „Die Lichtung“ (leise sein).
const WALD = { x0: -40, x1: 110, z0: 99, z1: 156, hut: { x: 58, z: 149.5 }, tree: { x: -22, z: 141 }, den: { x: 74, z: 129.5 }, wolf: { x: 96, z: 146.5 }, clear: { x: 4, z: 113, r: 8 } };
const WALD_PATHS = [ // freigeschlagene Wege (Polylinien)
  [[30, 96], [29.5, 104], [27, 111], [21, 118], [18.5, 124], [23, 130], [31, 134], [41, 138], [50, 142.5], [57, 146.8]],
  [[21, 118], [13, 115], [6, 113]], [[18.5, 124], [8, 128], [-4, 133], [-15, 138], [-21, 139.3]],
  [[41, 138], [52, 135], [64, 131.5], [72, 130]], [[57, 146.8], [70, 147], [82, 148], [93, 147]]];
const wald_S = { chunks: [], chunkT: 0, ready: false, beasts: [], deer: [], fox: null, wolves: [], pup: null, shoe: null, t: 0, ambT: 6, inside: false, told: new Set() };
function wald_in(x, z) { return x > WALD.x0 && x < WALD.x1 && z > WALD.z0 && z < WALD.z1; }
function wald_pathDist(x, z) { let d = 1e9; for (const P of WALD_PATHS) for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], vx = bx - ax, vz = bz - az, L = vx * vx + vz * vz, k = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / L));
  d = Math.min(d, Math.hypot(x - ax - vx * k, z - az - vz * k)); } return d; }
function wald_free(x, z) { // Platz für einen Baum?
  if (wald_pathDist(x, z) < 2.4) return false; const C = WALD.clear; if (Math.hypot(x - C.x, z - C.z) < C.r) return false;
  for (const [p, r] of [[WALD.hut, 5.5], [WALD.tree, 3.2], [WALD.den, 4], [WALD.wolf, 5.5]]) if (Math.hypot(x - p.x, z - p.z) < r) return false; return true; }
WORLD_MODS.push(['Forbidden Dustwoods', async () => {
  const S = wald_S, T = THREE, m4 = (x, y, z, ry, s, tx = 0, tz = 0) => new T.Matrix4().compose(new T.Vector3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(tx, ry, tz)), new T.Vector3(s, s, s));
  const [t1, t3, fence, elder, rasp, wg1, wg2] = await Promise.all([msBake('deadtree1'), msBake('deadtree3'), msBake('fencepost'), msBake('elderberry'), msBake('raspberry'), msBake('wildgrass1'), msBake('wildgrass2')]);
  for (const p of [...t1, ...t3]) { p.mat = p.mat.clone(); p.mat.side = T.DoubleSide; p.mat.color.setScalar(.5); }
  // Blöcke von 20 m: jeder Block wird nach Kameraabstand ein-/ausgeblendet (vis) und wirft nur nah Schatten (sh) – der Nebel verschluckt ohnehin alles ab ~50 m
  const chunk = (parts, list, shadow, vis = 56, sh = 24) => { const cells = new Map(), v = new T.Vector3();
    for (const m of list) { v.setFromMatrixPosition(m); const k = Math.floor(v.x / 20) + ',' + Math.floor(v.z / 20); let c = cells.get(k); if (!c) cells.set(k, c = { x: 0, z: 0, n: 0, L: [] }); c.L.push(m); c.x += v.x; c.z += v.z; c.n++; }
    for (const c of cells.values()) { const meshes = msInst(parts, c.L, { shadow }); S.chunks.push({ x: c.x / c.n, z: c.z / c.n, meshes, vis, sh: shadow ? sh : 0 }); } };
  // --- Bäume: dicht im Wald, noch dichter als Gürtel hinter dem Grenzzaun
  const A = [], B = [];
  for (let gx = WALD.x0 - 12; gx <= WALD.x1 + 12; gx += 4.3) for (let gz = WALD.z0 + .5; gz <= WALD.z1 + 14; gz += 4.3) {
    const x = gx + rand(-1.7, 1.7), z = gz + rand(-1.7, 1.7), ins = wald_in(x, z);
    if (ins) { if (!wald_free(x, z) || Math.random() < .12) continue; if (Math.abs(x - WALD.x0) < 1.3 || Math.abs(x - WALD.x1) < 1.3 || Math.abs(z - WALD.z1) < 1.3) continue; }
    else { if (z < WALD.z0 + 1) continue; if (x > WALD.x0 - 1.3 && x < WALD.x1 + 1.3 && z < WALD.z1 + 1.3) continue; }
    (Math.random() < .55 ? A : B).push(m4(x, -.1, z, rand(0, 6.28), rand(.85, 1.55), rand(-.07, .07), rand(-.07, .07)));
  }
  chunk(t1, A, true); chunk(t3, B, true); S.nTrees = A.length + B.length;
  // Der Baum für Cleos Baumhaus: groß, gerade
  chunk(t1, [m4(WALD.tree.x, -.1, WALD.tree.z + 1.2, .4, 1.9)], true);
  // --- Unterholz (weich), Gras
  const eA = elder.filter(p => /VarG_LOD1$/.test(p.name)), eR = rasp.filter(p => /VarB_LOD1$/.test(p.name)), gA = wg1.filter(p => /VarG_LOD1$/.test(p.name)), gB = wg2.filter(p => /VarB_LOD1$/.test(p.name)), SH = [], SR = [], G1 = [], G2 = []; // leichte Detailstufen der Scans
  for (let i = 0; i < 1100; i++) { const x = rand(WALD.x0 + 1, WALD.x1 - 1), z = rand(WALD.z0 + 1, WALD.z1 - 1); const pd = wald_pathDist(x, z); if (pd < 1.6) continue;
    if (Math.hypot(x - WALD.hut.x, z - WALD.hut.z) < 4.5 || Math.hypot(x - WALD.tree.x, z - WALD.tree.z) < 2.5) continue;
    const r = Math.random(); if (r < .28) SH.push(m4(x, 0, z, rand(0, 6.28), rand(.7, 1.2))); else if (r < .45) SR.push(m4(x, 0, z, rand(0, 6.28), rand(.8, 1.3))); else (r < .72 ? G1 : G2).push(m4(x, 0, z, rand(0, 6.28), rand(.8, 1.4))); }
  if (eA.length) chunk(eA, SH, false, 42); if (eR.length) chunk(eR, SR, false, 40); if (gA.length) chunk(gA, G1, false, 34); if (gB.length) chunk(gB, G2, false, 34);
  // --- Grenzzaun (West, Ost, Nord) – sichtbar, alt, schief
  { const F = []; const run = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(L / 3.05), a = Math.atan2(-(z1 - z0), x1 - x0);
      for (let i = 0; i < n; i++) { const k = i * 3.05 / L; F.push(m4(x0 + (x1 - x0) * k, 0, z0 + (z1 - z0) * k, a, 1, rand(-.05, .05), rand(-.06, .06))); } };
    run(WALD.x0, 98.2, WALD.x0, WALD.z1); run(WALD.x0, WALD.z1, WALD.x1, WALD.z1); run(WALD.x1, WALD.z1, WALD.x1, 98.2);
    chunk(fence, F, true, 60, 26); } // jedes Zaunfeld vollständig (alle Teile des Scans)
  // --- Boden: Waldboden-Flecken, Laub auf den Wegen, Findlinge
  try { const ff = msSurfMat('forestfloor', { tint: 0x5a5046 }); ff.userData.tile = 4; const p = plane(WALD.x1 - WALD.x0 + 30, WALD.z1 - WALD.z0 + 24, (WALD.x0 + WALD.x1) / 2, .012, (WALD.z0 + WALD.z1) / 2 + 10, ff); p.receiveShadow = true;
    const ext = plane(260, 60, 35, -.004, 188, M.grass); ext.receiveShadow = true; } catch (e) { console.warn('Wald: Boden', e); }
  try { const rock = await msModel('../boulder', 'model.gltf'); for (let i = 0; i < 26; i++) { const x = rand(WALD.x0 + 3, WALD.x1 - 3), z = rand(WALD.z0 + 3, WALD.z1 - 3); if (wald_pathDist(x, z) < 3 || !wald_free(x, z)) continue;
      const o = msGround(msFit(rock.clone(true), rand(.6, 1.6), 'max')); o.position.set(x, -.08, z); o.rotation.y = rand(0, 6.28); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(o); }
    // Der Kreidestein (Zayns Spur) am Weg
    const cs = msGround(msFit(rock.clone(true), 1.1, 'max')); cs.position.set(16.6, -.05, 123.8); cs.rotation.y = .8; scene.add(cs); S.chalkStone = cs; } catch (e) { console.warn('Wald: Felsen', e); }
  // --- Schild am Eingang
  { const post = box(.1, 1.7, .1, 27.2, .85, 99.3, M.wood, { collide: true }); const sign = new T.Mesh(new T.PlaneGeometry(1.1, .55), new T.MeshStandardMaterial({ roughness: .9, map: tex(cnv(512, (c, w) => {
      c.fillStyle = '#5a4a36'; c.fillRect(0, 0, w, w); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(0,0,0,${rand(.05, .2)})`; c.fillRect(0, rand(0, w / 2), w, rand(1, 4)); }
      c.fillStyle = '#e8e0cc'; c.font = 'bold 44px Georgia'; c.textAlign = 'center'; c.fillText('FORSTBEZIRK NORD', w / 2, 70); c.font = '34px Georgia'; c.fillText('Betreten verboten', w / 2, 118); c.fillText('Einsturzgefahr · Totholz', w / 2, 160);
      c.save(); c.translate(w / 2, 222); c.rotate(-.06); c.fillStyle = '#b02a20'; c.font = 'bold 40px "Comic Sans MS", cursive'; c.fillText('FORBIDDEN DUSTWOODS', 0, 0); c.restore(); }), true) }));
    sign.material.map.repeat.set(1, .5); sign.material.map.offset.set(0, .5); sign.position.set(27.2, 1.5, 99.24); sign.rotation.y = PI; scene.add(sign);
    const hit = box(1.2, .7, .3, 27.2, 1.5, 99.3, hidden, { cast: false });
    interact(hit, 'Schild lesen', () => { if (!story.lore.some(l => l.key === 'wald_schild')) story.lore.push({ key: 'wald_schild', title: 'Forbidden Dustwoods', html: 'Ein Forstschild, Betreten verboten. Darüber, in roter Kinderschrift: FORBIDDEN DUSTWOODS.\n\nSo habt ihr ihn genannt. Weil hier der Staub nie nass wird, egal wie lange es regnet.' });
      openNote('Forbidden Dustwoods', 'FORSTBEZIRK NORD · Betreten verboten · Einsturzgefahr, Totholz.\n\nDarüber, mit roter Farbe, in Kinderschrift: <b>FORBIDDEN DUSTWOODS</b>.\n\nSo habt ihr ihn genannt, damals. Weil hier der Staub nie nass wird, egal wie lange es regnet. Keiner durfte rein. Alle wollten.'); }); }
  // --- Zayns Hütte: Bretterhütte mit Blechdach (Innenraum; Inhalt im Modul zayn)
  { const H = WALD.hut, w = 3.4, d = 3.8, h = 2.45, x0 = H.x - w / 2, x1 = H.x + w / 2, z0 = H.z - d / 2, z1 = H.z + d / 2;
    const pl = msSurfMat('planks_painted', { tint: 0x5a5046 }); pl.userData.tile = 1.1; const fl = msSurfMat('floor_worn', { tint: 0x4a4038 }); fl.userData.tile = 1;
    const roofM = msSurfMat('corrugated', { tint: 0x6a5a4a }); roofM.side = T.DoubleSide;
    wall('x', z0, x0, x1, h, pl, [{ at: H.x - .6, w: .95 }], .12, 1.95); wall('x', z1, x0, x1, h, pl, [], .12); wall('z', x0, z0, z1, h, pl, [], .12); wall('z', x1, z0, z1, h, pl, [{ at: H.z + .6, w: .7 }], .12, 1.9);
    box(.12, .9, .7, x1, .45, H.z + .6, pl, { collide: true }); // Fensterbrüstung
    plane(w, d, H.x, .03, H.z, fl); const roof = box(w + .6, .06, d + .6, H.x, h + .08, H.z, roofM, { cast: true }); roof.rotation.x = .08;
    indoorRects.push({ x0, x1, zb: z0, zf: z1, y: 0 }); S.hutRect = { x0, x1, z0, z1 };
    const L = new VLight(0xffb070, 0, 4, 2); L.position.set(H.x + .8, 1.2, H.z + 1.2); scene.add(L); S.hutLight = L; }
  // --- Cleos Baumhaus: Plattform in 2,2 m Höhe, Geländer, Dach, Strickleiter (Inhalt im Modul cleo)
  { const P = WALD.tree, y = 2.2, pl = msSurfMat('planks_painted', { tint: 0x6a5a48 }); pl.userData.tile = 1; const roofM = msSurfMat('corrugated', { tint: 0x5e564c }); roofM.side = T.DoubleSide;
    const floor = box(2.6, .14, 2.6, P.x, y - .07, P.z, pl, { collide: false });
    for (const [x, z, w_, d_] of [[P.x, P.z + 1.25, 2.6, .08], [P.x - 1.25, P.z, .08, 2.6], [P.x + 1.25, P.z, .08, 2.6]]) box(w_, .8, d_, x, y + .4, z, pl, { collide: false });
    box(.9, .8, .08, P.x - .85, y + .4, P.z - 1.25, pl, { collide: false }); box(.9, .8, .08, P.x + .85, y + .4, P.z - 1.25, pl, { collide: false });
    for (const [px, pz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) box(.09, 2.2, .09, P.x + px, y + 1.1, P.z + pz, pl, { collide: false });
    const roof = box(3, .05, 3, P.x, y + 2.25, P.z, roofM, { cast: true }); roof.rotation.z = .1;
    for (const [px] of [[-.3], [.3]]) box(.04, y, .04, P.x + px, y / 2, P.z - 1.4, M.wood, { collide: false }); // Strickleiter (Seile)
    for (let k = 0; k < 7; k++) box(.66, .035, .05, P.x, .3 + k * .3, P.z - 1.4, M.wood, { collide: false });
    S.treeY = y; }
  // --- Tiere
  try { await wald_beasts(); } catch (e) { console.warn('Wald: Tiere', e); }
  // --- Hinweise für den Kinderblick
  if (typeof hintAdd === 'function') { hintAdd({ id: 'wald_welpe', x: WALD.wolf.x, y: 0, z: WALD.wolf.z, kind: 'geheim', near: 40, open: () => !story.lore.some(l => l.key === 'wald_welpe') });
    hintAdd({ id: 'wald_hirsch', x: WALD.clear.x, y: 0, z: WALD.clear.z, kind: 'geheim', near: 40, open: () => !story.lore.some(l => l.key === 'wald_hirsch') }); }
  story.side.wald_welpe = { title: 'Die Schlinge', desc: 'Irgendwo im Osten der Dustwoods jault etwas. Hoch, dünn, verzweifelt.', state: 'hidden' };
  story.side.wald_hirsch = { title: 'Die Lichtung', desc: 'Auf einer Lichtung grasen Rehe. Sie fliehen vor Licht und schnellen Schritten.', state: 'hidden' };
  S.ready = true;
}]);
// ---------------------------------------------------------------- Tiere
async function wald_beasts() {
  const S = wald_S, L = leben_S; if (!L || !L.M || !L.skc || !L.root) { S.noBeasts = true; return; }
  try { if (!L.M.stag) { const sc = await msModel('animal_deerstag', 'model.glb'); leben_shrink(sc, 1024); L.M.stag = { src: sc, clips: sc.animations || [] }; } } catch (e) { console.warn('Wald: Hirsch', e); }
  const C = WALD.clear;
  for (let i = 0; i < 3; i++) { const V = leben_beast(i === 0 && L.M.stag ? 'stag' : 'deer', rand(.95, 1.08)); if (!V) continue; V.home = [C.x + rand(-4, 4), C.z + rand(-4, 4)]; V.g.position.set(V.home[0], 0, V.home[1]); V.g.rotation.y = rand(0, 6.28);
    V.g.visible = true; V.st = 'graze'; V.t = rand(1, 5); V.stag = i === 0; leben_play(V, 'IdleGraze', 0); S.deer.push(V); }
  const F = leben_beast('fox', 1); if (F) { F.g.position.set(WALD.den.x - 9, 0, WALD.den.z - 6); F.g.visible = true; F.st = 'wait'; F.t = 0; leben_play(F, 'IdleLookAround', 0); S.fox = F;
    const shoe = wald_shoe(); shoe.position.set(0, .28, .38); shoe.rotation.set(0, PI / 2, 0); shoe.scale.setScalar(.8); F.g.add(shoe); S.shoe = shoe; if (story.lore.some(l => l.key === 'zayn_spur_schuh')) shoe.removeFromParent(); }
  for (let i = 0; i < 2; i++) { const W = leben_beast('wolf', rand(1.05, 1.15)); if (!W) continue; W.g.position.set(WALD.wolf.x + (i ? 3 : -3.5), 0, WALD.wolf.z - 3 + i); W.g.visible = true; W.st = 'guard'; W.t = rand(2, 6); leben_play(W, 'IdleBreathe', 0); S.wolves.push(W); }
  const pup = leben_beast('wolf', .48); if (pup) { pup.g.position.set(WALD.wolf.x, 0, WALD.wolf.z); pup.g.rotation.y = -2.2; pup.g.visible = true; pup.st = 'caught'; leben_play(pup, 'IdleLookAround', 0); S.pup = pup; if (story.lore.some(l => l.key === 'wald_welpe')) { pup.st = 'gone'; pup.g.visible = false; }
    const snare = new THREE.Mesh(new THREE.TorusGeometry(.18, .008, 6, 24), new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: .4, metalness: .9 })); snare.rotation.x = PI / 2; snare.position.set(WALD.wolf.x + .25, .18, WALD.wolf.z); scene.add(snare); S.snare = snare;
    const pole = box(.06, .7, .06, WALD.wolf.x + .5, .35, WALD.wolf.z + .1, M.wood, { collide: false });
    const hit = box(1.2, .8, 1.2, WALD.wolf.x, .4, WALD.wolf.z, hidden, { cast: false });
    interact(hit, () => story.lore.some(l => l.key === 'wald_welpe') ? 'Die offene Schlinge' : 'Der Welpe in der Schlinge', () => wald_pup()); }
  S.beasts = [...S.deer, ...(S.fox ? [S.fox] : []), ...S.wolves, ...(S.pup ? [S.pup] : [])];
}
// Kinderschuh (klein, Stoff und Gummi) – gehört zu Zayns Spur
applySave = (o => d => { o(d); const S = wald_S, has = k => story.lore.some(l => l.key === k);
  if (has('wald_welpe') && S.pup) { S.pup.st = 'gone'; S.pup.g.visible = false; }
  if (has('zayn_spur_schuh') && S.shoe) S.shoe.removeFromParent(); })(applySave);
function wald_shoe() {
  const g = new THREE.Group(), cloth = new THREE.MeshStandardMaterial({ color: 0x2a3a6a, roughness: .9 }), sole = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: .8 }), lace = new THREE.MeshStandardMaterial({ color: 0xc02020, roughness: .7 });
  const s = new THREE.Mesh(new THREE.BoxGeometry(.075, .025, .19), sole); s.position.y = .012; g.add(s);
  const b = new THREE.Mesh(new THREE.CapsuleGeometry(.036, .1, 4, 10), cloth); b.rotation.x = PI / 2; b.scale.set(1, 1, .75); b.position.set(0, .045, .015); g.add(b);
  const h = new THREE.Mesh(new THREE.CylinderGeometry(.034, .036, .06, 10), cloth); h.position.set(0, .07, -.055); g.add(h);
  for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.BoxGeometry(.05, .006, .008), lace); l.position.set(0, .08 - k * .006, .02 + k * .025); g.add(l); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData.noCol = true; return g;
}
function wald_pup() {
  const S = wald_S; if (story.lore.some(l => l.key === 'wald_welpe')) return toast('Die Schlinge liegt offen im Laub. Von den Wölfen keine Spur – aber du weißt, dass sie da sind.', 3600);
  sideStart('wald_welpe');
  if (!story.items.includes('drahtschneider')) { story.side.wald_welpe.desc = 'Ein Wolfswelpe hängt in einer Drahtschlinge. Mit bloßen Händen bekommst du den Draht nicht auf.'; return toast('Ein Wolfswelpe. Der Draht hat sich um sein Hinterbein gezogen, er zittert. Hinter dir knurrt es, tief und leise. Mit bloßen Händen bekommst du den Draht nicht auf.', 5200); }
  Audio.play('metalHit2', { gain: .3, rate: 1.9 }); if (S.snare) S.snare.visible = false;
  story.lore.push({ key: 'wald_welpe', title: 'Die Schlinge', html: 'Ein Wolfswelpe in einer Drahtschlinge. Du hast sie aufgeschnitten. Die Wölfe haben zugesehen und nichts getan.\n\nIn den Draht war ein Taschenmesser gewickelt. In den Griff geritzt: <b>JONAS W.</b>\nZayns großer Bruder war hier. Irgendwann. Er hat gesucht.' });
  sideDone('wald_welpe', 'Der Welpe ist frei. Im Draht: ein Taschenmesser mit dem Namen JONAS W.');
  if (S.pup) { S.pup.st = 'free'; S.pup.tx = WALD.wolf.x + 14; S.pup.tz = WALD.wolf.z - 4; S.pup.sp = 3.2; leben_play(S.pup, 'Run', .15); }
  S.wolves.forEach((W, i) => { W.st = 'leave'; W.t = 2 + i * .6; });
  setTimeout(() => { leben_howl(WALD.wolf.x + 10, 1, WALD.wolf.z); setTimeout(() => leben_howl(WALD.wolf.x + 14, 1, WALD.wolf.z - 3), 1400); }, 1600);
  openNote('Ein Taschenmesser', 'Im Draht der Schlinge steckt ein Taschenmesser, rostig, zugeklappt. In den Griff hat jemand mit der Spitze geritzt:\n\n<b>JONAS W.</b>\n\nJonas. Zayns großer Bruder. Dein bester Freund, damals. Er war hier draußen – irgendwann nach 2009. Er hat seinen Bruder gesucht. Allein.');
  if (typeof gedanke === 'function') gedanke('wald_jonas', 'Jonas hat ihn gesucht. Hier draußen, allein. Und ich? Ich war da schon in der Stadt und hab nicht mal angerufen.', 6000, 3);
}
WORLD_TICK.push((dt, t) => {
  const S = wald_S; if (!S.ready || !state.started || menu.attract) return; const P = player.pos, near = P.z > 88 && P.x > WALD.x0 - 20 && P.x < WALD.x1 + 20;
  S.chunkT -= dt; if (S.chunkT < 0) { S.chunkT = .25; const cx = camera.position.x, cz = camera.position.z; for (const c of S.chunks) { const d = Math.hypot(c.x - cx, c.z - cz), v = d < c.vis; for (const m of c.meshes) { m.visible = v; m.castShadow = d < c.sh; } } }
  const inside = wald_in(P.x, P.z); if (inside !== S.inside) { S.inside = inside; if (inside && !S.told.has('in')) { S.told.add('in'); if (typeof gedanke === 'function') gedanke('wald_rein', 'Forbidden Dustwoods. Hier durfte keiner rein. Wir sind trotzdem rein. Jeden Sommer.', 800, 2); } }
  if (S.noBeasts && leben_S.ready && !S.beastTry) { S.beastTry = true; S.noBeasts = false; wald_beasts().catch(e => console.warn('Wald: Tiere', e)); }
  for (const V of S.beasts) if (V.st !== 'gone') V.g.visible = near; // weit weg: nicht zeichnen
  if (!near) return;
  // Geräusche: Totholz knackt, ferne Krähen, ein Käuzchen, manchmal Stille
  if (inside && !state.talking) { S.ambT -= dt; if (S.ambT < 0) { S.ambT = rand(5, 13); const a = rand(0, 6.28), d = rand(8, 22), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d, r = Math.random();
    if (r < .35) Audio.treeCreak(x, z); else if (r < .55) Audio.caw(x, rand(4, 8), z); else if (r < .7) Audio.owl(x, z); else if (r < .85) Audio.stepAt(x, z, .18); else Audio.flap(x, 3, z); } }
  const spd = Math.hypot(vel.x, vel.z);
  // Rehe: grasen; Licht, Laufen oder Nähe → aufmerksam, dann Flucht. Wer langsam und im Dunkeln kommt, dem sieht der Hirsch nach.
  for (const D of S.deer) { if (D.st === 'gone') { D.t -= dt; if (D.t < 0 && Math.hypot(P.x - WALD.clear.x, P.z - WALD.clear.z) > 45) { D.g.position.set(D.home[0], 0, D.home[1]); D.g.visible = true; D.st = 'graze'; leben_play(D, 'IdleGraze', .3); } continue; }
    leben_beastUpd(D, dt, 70); const p = D.g.position, d = Math.hypot(p.x - P.x, p.z - P.z), lit = flashOn && d < 26 && leben_facing(p.x, p.y + .9, p.z) > .96;
    if (D.st === 'graze') { D.t -= dt; if (D.t < 0) { D.t = rand(3, 8); leben_play(D, Math.random() < .7 ? 'IdleGraze' : 'IdleChew', .4); }
      if (d < 20 && (lit || spd > 3.2 || d < 4.5)) { D.st = 'flee'; D.sp = 7; const a = Math.atan2(p.x - P.x, p.z - P.z) + rand(-.5, .5); D.tx = p.x + Math.sin(a) * 40; D.tz = p.z + Math.cos(a) * 40; leben_play(D, 'Run', .15); if (d < 14) sideStart('wald_hirsch'); }
      else if (D.stag && d < 7.5 && !flashOn && spd < 3 && !story.lore.some(l => l.key === 'wald_hirsch')) { D.st = 'look'; D.t = 4; leben_play(D, 'IdleLookAround', .3); } }
    else if (D.st === 'look') { D.g.rotation.y = leben_ang(D.g.rotation.y, Math.atan2(P.x - p.x, P.z - p.z), Math.min(1, dt * 2)); D.t -= dt;
      if (D.t < 0) { D.st = 'lead'; D.tx = WALD.tree.x + 3; D.tz = WALD.tree.z - 4; D.sp = 1.3; leben_play(D, 'WalkGraze', .4); sideStart('wald_hirsch');
        story.lore.push({ key: 'wald_hirsch', title: 'Die Lichtung', html: 'Du bist leise gekommen, im Dunkeln. Der Hirsch hat dich angesehen – lange, ohne Angst. Dann ist er nach Westen gegangen, langsam, als sollst du folgen.' });
        sideDone('wald_hirsch', 'Der Hirsch ist nach Westen gegangen. Zu einem Baum, der größer ist als alle anderen.'); if (typeof gedanke === 'function') gedanke('wald_hirsch', 'Er hat keine Angst. Er wartet, dass ich mitkomme.', 500, 3); } }
    else if (D.st === 'lead') { if (leben_beastMove(D, dt) || d > 40) { D.st = 'gone'; D.g.visible = false; D.t = 120; } }
    else if (D.st === 'flee') { leben_beastMove(D, dt); if (d > 45 || !leben_free(p.x + Math.sin(D.g.rotation.y) * 1.5, p.z + Math.cos(D.g.rotation.y) * 1.5, .7, .4)) { D.st = 'gone'; D.g.visible = false; D.t = rand(60, 120); } } }
  // Fuchs: trägt den Schuh. Kommt man näher, läuft er zu seinem Bau, lässt den Schuh fallen und verschwindet im Unterholz
  const F = S.fox; if (F) { leben_beastUpd(F, dt, 60); const p = F.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
    if (F.st === 'wait') { F.t -= dt; if (F.t < 0) { F.t = rand(2, 5); leben_play(F, Math.random() < .6 ? 'IdleLookAround' : 'Walk', .3); } F.g.rotation.y = leben_ang(F.g.rotation.y, Math.atan2(P.x - p.x, P.z - p.z), Math.min(1, dt));
      if (d < 13) { F.st = 'run'; F.tx = WALD.den.x; F.tz = WALD.den.z - 1.2; F.sp = 3.4; leben_play(F, 'Run', .15); } }
    else if (F.st === 'run') { if (leben_beastMove(F, dt)) { F.st = 'drop'; F.t = 1.2; leben_play(F, 'IdleLookAround', .2); } }
    else if (F.st === 'drop') { F.t -= dt; if (F.t < 0) { wald_dropShoe(); F.st = 'hide'; F.tx = WALD.den.x + 6; F.tz = WALD.den.z + 7; F.sp = 4; leben_play(F, 'Run', .15); } }
    else if (F.st === 'hide') { if (leben_beastMove(F, dt) || d > 40) { F.st = 'gone'; F.g.visible = false; } }
    if (F.st !== 'drop' && F.st !== 'gone' && Math.hypot(P.x - WALD.den.x, P.z - WALD.den.z) < 4 && S.shoe && S.shoe.parent === F.g) wald_dropShoe(); } // wer zuerst am Bau ist, findet den Schuh trotzdem
  // Wölfe: bewachen den Welpen. Näher als 9 m: sie knurren und kommen einen Schritt. Nach der Befreiung ziehen sie ab.
  for (const W of S.wolves) { leben_beastUpd(W, dt, 70); const p = W.g.position, d = Math.hypot(p.x - P.x, p.z - P.z);
    if (W.st === 'guard') { W.g.rotation.y = leben_ang(W.g.rotation.y, Math.atan2(P.x - p.x, P.z - p.z), Math.min(1, dt * 2)); W.t -= dt;
      if (d < 9 && W.t < 0) { W.t = rand(2.5, 4); Audio.play('dog', { gain: .25, rate: .55, x: p.x, y: .6, z: p.z, ref: 3, dur: .7 }); leben_play(W, 'IdleLookAround', .2); sideStart('wald_welpe'); }
      else if (W.t < 0) { W.t = rand(4, 9); if (d < 45 && Math.random() < .3) { leben_play(W, 'Howl', .3, 1, true); leben_howl(p.x, p.y + .8, p.z); } else leben_play(W, 'IdleBreathe', .4); } }
    else if (W.st === 'leave') { W.t -= dt; if (W.t < 0) { W.st = 'go'; W.tx = WALD.wolf.x + 18; W.tz = WALD.wolf.z - 6; W.sp = 3; leben_play(W, 'Run', .2); } }
    else if (W.st === 'go') { if (leben_beastMove(W, dt)) { W.st = 'gone'; W.g.visible = false; } } }
  const pup = S.pup; if (pup) { leben_beastUpd(pup, dt, 50); if (pup.st === 'caught') { pup.t = (pup.t || 0) - dt; if (pup.t < 0 && Math.hypot(P.x - pup.g.position.x, P.z - pup.g.position.z) < 30) { pup.t = rand(3, 7); Audio.play('dog', { gain: .1, rate: 1.9, x: pup.g.position.x, y: .3, z: pup.g.position.z, ref: 2, dur: .35 }); } }
    else if (pup.st === 'free') { if (leben_beastMove(pup, dt)) { pup.st = 'gone'; pup.g.visible = false; } } }
});
function wald_dropShoe() {
  const S = wald_S; if (!S.shoe || S.shoe.parent === scene) return; S.shoe.removeFromParent(); S.shoe.position.set(WALD.den.x - .3, .02, WALD.den.z - 1.6); S.shoe.rotation.set(0, .7, .12); S.shoe.scale.setScalar(1); scene.add(S.shoe);
  if (typeof zayn_shoeDropped === 'function') zayn_shoeDropped(S.shoe);
}
window.__wald = { S: wald_S, W: WALD, paths: WALD_PATHS }; // Testzugriff
