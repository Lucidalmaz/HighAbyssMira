// =====================================================================  AUSBAU OST/WEST (Bereich ausbau_ost_west)
// OST „Landstraße“: Straße nach Osten, verlassene Tankstelle Kranz, Schrottplatz mit Wendehammer, Straßensperre bei x≈146.
// WEST „Schrebergärten & Hof“: Schotterweg, Kleingartenanlage, Hof mit begehbarem Pferdestall, Remise, Bauernhaus, die alte Villa (−125, 70).
// Alles aus Scans/Modellen der Bibliothek; Flächen/Wände mit Megascans-Oberflächen. Gruppen werden auf Entfernung ausgeblendet (Leistung).
const ausbau_ost_west_OW = { on: false };
WORLD_MODS.push(['Ausbau Ost/West', async () => {
  const OW = ausbau_ost_west_OW, T = THREE, V3 = T.Vector3, t0 = performance.now();
  // ---------------------------------------------------------------- Werkzeuge
  const regions = [];
  const region = (name, x0, x1, z0, z1, far = 62) => { const g = new T.Group(); g.name = 'ow_' + name; scene.add(g); const r = { g, x0, x1, z0, z1, far, vis: true }; regions.push(r); return r; };
  const R = {
    eRoad: region('eRoad', 78, 160, -8, 8, 85), station: region('station', 95, 130, 4, 34), junk: region('junk', 92, 142, -34, -4), block: region('block', 138, 160, -14, 14),
    wRoad: region('wRoad', -160, -78, -8, 8, 85), allot: region('allot', -142, -88, 4, 48), villa: region('villa', -146, -104, 46, 90, 70), farm: region('farm', -152, -108, -48, -6),
  };
  const regAt = (x, z) => regions.find(r => r !== R.eRoad && r !== R.wRoad && x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) || (x > 0 ? R.eRoad : R.wRoad);
  const par = (x, z, p) => p || regAt(x, z).g;
  const shade = (o, cast = true) => { o.traverse(m => { if (m.isMesh) { m.castShadow = cast; m.receiveShadow = true; } }); return o; };
  const put = (o, x, z, ry = 0, y = 0, p) => { o.position.set(x, y, z); o.rotation.y = ry; par(x, z, p).add(o); return shade(o); };
  const fit = (o, size, axis = 'y') => msGround(msFit(o, size, axis));
  const gl = async (key, file) => (await msModel(key, file)).clone(true);
  const matCache = new Map();
  const sm = (key, tint = 0xffffff, nrm = 1) => { const k = key + '|' + tint + '|' + nrm; if (!matCache.has(k)) { const m = msSurfMat(key, { tint, nrm }); m.envMapIntensity = .35; matCache.set(k, m); } return matCache.get(k); };
  // flache Bodenfläche mit Scan-Oberfläche (2 × 2 m je Kachel)
  const flat = (key, w, d, x, z, o = {}) => { const g = new T.PlaneGeometry(w, d); planeUV(g, w, d, o.tile ?? 2);
    const m = new T.Mesh(g, o.mat || sm(key, o.tint ?? 0xffffff, o.nrm ?? 1)); m.rotation.set(-PI / 2, 0, o.ry || 0); m.position.set(x, o.y ?? .022, z); m.receiveShadow = true; par(x, z, o.p).add(m); return m; };
  // Wand/Platte als Kiste mit Scan-Oberfläche (erlaubt: Wände mit Megascans-Oberfläche)
  const wbox = (key, w, h, d, x, y, z, o = {}) => { const g = new T.BoxGeometry(w, h, d); worldUV(g, w, h, d, o.tile ?? 2);
    const m = new T.Mesh(g, o.mat || sm(key, o.tint ?? 0xffffff, o.nrm ?? 1)); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; m.castShadow = o.cast !== false; m.receiveShadow = true; par(x, z, o.p).add(m); return m; };
  const hit = (w, h, d, x, y, z, label, action) => { const m = box(w, h, d, x, y, z, hidden, { cast: false }); interact(m, label, action); return m; };
  const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const draw = () => fn(c.getContext('2d'), w, h); if (typeof echt_an === 'function') echt_an(draw); else draw(); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; }; // QA-Art 09.10.: Schrift auf Schildern/Zetteln mit Farbband/Druck/Schablone (ritzschrift) statt glatter Arial
  const decal = (tx, w, h, x, y, z, ry = 0, rx = 0, o = {}) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tx, transparent: true, alphaTest: .05, roughness: .9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, ...(o.mat || {}) }));
    m.rotation.set(rx, ry, 0, 'YXZ'); m.position.set(x, y, z); m.renderOrder = 1; par(x, z, o.p).add(m); return m; };
  const glow = (color, size, x, y, z, p) => { const s = new T.Sprite(new T.SpriteMaterial({ map: poolTex, color, transparent: true, depthWrite: false, blending: T.AdditiveBlending, fog: true })); s.scale.set(size, size, 1); s.position.set(x, y, z); par(x, z, p).add(s); return s; };
  const pool = (color, size, x, z, op = .35, p) => { const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: poolTex, color, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false })); m.rotation.x = -PI / 2; m.position.set(x, .06, z); par(x, z, p).add(m); return m; };
  const vlight = (color, i, d, x, y, z) => { const l = new VLight(color, i, d, 2); l.position.set(x, y, z); scene.add(l); return l; };
  const emiss = (color, i) => new T.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: i });
  const noteHand = s => `<span class="hand">${s}</span>`;
  const calm = () => state.started && !state.talking && !ui.overlay && !state.ending && !state.inBasement && state.zone !== 'canal' && ch3.chase !== 'run' && ch2.chase !== 'run' && !(ch3.on && ch3.part !== 'town');
  const lookAt = (x, y, z, dot = .9) => { tmp.set(x, y, z).sub(camera.position); const d = tmp.length(); tmp.normalize(); return fwd.dot(tmp) > dot ? d : 0; };
  // Box-Projektion: neue UVs in Weltmetern (für Modelle ohne Texturen) und Aufteilung in Materialgruppen
  const reUV = (mesh, tile, classify, mats) => {
    mesh.updateMatrixWorld(true); const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    const P = src.attributes.position, N = src.attributes.normal, mw = mesh.matrixWorld, srcMats = [].concat(mesh.material);
    const grpOf = i => { for (const G of src.groups) if (i >= G.start && i < G.start + G.count) return G.materialIndex; return 0; };
    const a = new V3(), b = new V3(), c = new V3(), n = new V3(), buckets = mats.map(() => ({ p: [], n: [], uv: [] }));
    for (let i = 0; i < P.count; i += 3) {
      a.fromBufferAttribute(P, i).applyMatrix4(mw); b.fromBufferAttribute(P, i + 1).applyMatrix4(mw); c.fromBufferAttribute(P, i + 2).applyMatrix4(mw);
      n.subVectors(c, b).cross(new V3().subVectors(a, b)).normalize(); const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      const k = classify(n, (a.y + b.y + c.y) / 3, srcMats[grpOf(i)] ? srcMats[grpOf(i)].name : '', a, b, c), B = buckets[k], tl = typeof tile === 'function' ? tile(k) : tile;
      for (let j = 0; j < 3; j++) { B.p.push(P.getX(i + j), P.getY(i + j), P.getZ(i + j)); if (N) B.n.push(N.getX(i + j), N.getY(i + j), N.getZ(i + j));
        const v = j === 0 ? a : j === 1 ? b : c; const u = ay >= ax && ay >= az ? [v.x, v.z] : ax >= az ? [v.z, v.y] : [v.x, v.y]; B.uv.push(u[0] / tl, u[1] / tl); }
    }
    // Flach kopieren statt push(...B.p): große Modelle (Remise) hätten sonst hunderttausende Argumente → Stapelüberlauf
    const g = new T.BufferGeometry(), pos = [], nor = [], uv = [], add = (dst, src) => { for (let i = 0; i < src.length; i++) dst.push(src[i]); }; let start = 0;
    buckets.forEach((B, k) => { if (!B.p.length) return; add(pos, B.p); add(nor, B.n); add(uv, B.uv); g.addGroup(start, B.p.length / 3, k); start += B.p.length / 3; });
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); if (nor.length) g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); else g.computeVertexNormals(); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    mesh.geometry = g; mesh.material = mats;
  };
  // Laterne wie im Ort: lamp() + das echte Laternenmodell (Fab) statt Rohr und Kasten
  const lampSrc = (() => { for (const L of lamps) { const m = L.g.children.find(c => c !== L.bulb && c !== L.cone && c.visible && !c.isMesh); if (m) return m; } for (const L of lamps) { const m = L.g.children.find(c => c !== L.bulb && c !== L.cone && c.visible); if (m) return m; } return null; })();
  const owLamp = (x, z, ax, az, mode = 'on') => {
    const L = lamp(x, z, ax, az, mode);
    if (lampSrc) { L.g.children.forEach(c => { if (c !== L.bulb && c !== L.cone) c.visible = false; });
      const m = lampSrc.clone(); m.position.set(0, lampSrc.position.y, 0); m.rotation.set(0, Math.atan2(-az, ax), 0); L.g.add(shade(m));
      L.g.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(m);
      if (ax) { m.position.x += ax > 0 ? -.08 - (bb.min.x - x) : .08 - (bb.max.x - x); m.position.z -= (bb.min.z + bb.max.z) / 2 - z; }
      else { m.position.z += az > 0 ? -.08 - (bb.min.z - z) : .08 - (bb.max.z - z); m.position.x -= (bb.min.x + bb.max.x) / 2 - x; } }
    return L;
  };

  // ---------------------------------------------------------------- Modelle laden (parallel)
  stage('Ausbau Ost/West: Modelle');
  const TX = k => 'road_sign_pack_MAT_RoadSign_' + k + '.jpg';
  const [barrierS, coneP, dumpS, tiresS, jerryS, burnedS, junkS, palletsS, palletS, gasSignS, roadSignS, shedOldS, shedUtilS, shedGarS, fenceS, wellS, picnicS, wbarS, scareS, hayP, tractorS, bikeS, barnS, remiseS, villaS, lanternS, candleS, toysS, vanS, stoneS, ironS, poleS, debrisS, metaltableS, shelfS, wardrobeS, door1S, trashS] = await Promise.all([
    msModel('barrier_ms'), msBake('cone_ms'), msFBX('dumpster', 'model.fbx', { '*': { b: 'Dumpster_Bake1_PBR StoA_Diffuse.jpg', n: 'Dumpster_Bake1_PBR StoA_Normal.jpg', rough: .8 } }),
    msFBX('tires', 'model.fbx', { tires2_u1_v1: { b: 'tires2_u1_v1_diffuse-sharpen.jpg', rough: .9 }, tires2_u2_v1: { b: 'tires2_u2_v1_diffuse-sharpen.jpg', rough: .9 }, tires2_u1_v2: { b: 'tires2_u1_v2_diffuse-sharpen.jpg', rough: .9 }, tires2_u2_v2: { b: 'tires2_u2_v2_diffuse-denoise.jpg', rough: .9 } }),
    msModel('jerrycan'),
    msFBX('car_burned', 'model.fbx', { 'Material #26': { b: 'burnedcrossover_d.jpg', n: 'burnedcrossover_normal.jpg', r: 'burnedcrossover_r.jpg', rough: 1, ds: true }, 'Material #25': { b: 'burnedsedan_d.jpg', n: 'burnedsedan_normal.jpg', r: 'burnedsedan_rough.jpg', rough: 1, ds: true } }),
    msFBX('car_junk', 'model.fbx', { '*': { b: 'JUNKCAR1_SUBSTANCE_Material__9077_BaseColo.jpg', n: 'JUNKCAR1_SUBSTANCE_Material__9077_Normal.jpg', ao: 'JUNKCAR1_SUBSTANCE_Material__9077_Occlusio.jpg', rough: .85, ds: true } }),
    msModel('pallets_ms'), msModel('pallet_ms'),
    msFBX('gas_signs', 'model.fbx', { '*': { b: 'OldGasStationSign.jpg', rough: .7 } }),
    msFBX('roadsigns', 'model.fbx', { '*': { b: TX('BaseColor'), n: TX('Normal'), r: TX('Roughness'), rough: 1 } }),
    msModel('shed_old'), msModel('shed_util'), msModel('shed_garden', 'model.glb'),
    msFBX('fence_dirty', 'model.fbx', {}), msFBX('well', 'model.fbx', {}), msModel('picnic', 'model.glb'), msModel('wheelbarrow_ms'),
    msFBX('scarecrow', 'model.fbx', { Scarecrow: { b: 'Scarecrow_Scarecrow_BaseColor.jpg', n: 'Scarecrow_Scarecrow_Normal.jpg', r: 'Scarecrow_Scarecrow_Roughness.jpg' }, Wheat: { b: 'Scarecrow_Wheat_BaseColor.jpg', n: 'Scarecrow_Wheat_Normal.jpg', ds: true } }),
    msBake('haybale'), msModel('tractor', 'model.glb'), msModel('bicycle'), msModel('barn_horse'), msFBX('barn_old', 'model.fbx', {}), msFBX('mansion', 'model.fbx', {}),
    msFBX('lantern1', 'model.fbx', { lantern: { b: 'lantern_and_bulb_lantern_BaseColor.1001.png', n: 'lantern_and_bulb_lantern_Normal.1001.jpg', r: 'lantern_and_bulb_lantern_Roughness.1001.jpg', m: 'lantern_and_bulb_lantern_Metallic.1001.jpg' }, buln: { b: 'lantern_and_bulb_buln_BaseColor.1001.png', rough: .2 } }),
    msFBX('candles', 'model.fbx', { Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', r: 'Extra_for_candles_Roughness.jpg' } }),
    msFBX('toys_old', 'model.fbx', { '*': { b: 'T_Toys_BaseColor.jpg', n: 'T_Toys_Normal.jpg' } }),
    msFBX('vans', 'model.fbx', { '*': { b: 'van_damaged_d.jpg', n: 'van_damaged_n.jpg', r: 'van_damaged_roughness.jpg', m: 'van_damaged_metallic.jpg', rough: 1 } }),
    msModel('stonewall1'), msModel('ironfence_ms'), msFBX('poles_wood', 'wood_pole_03.fbx'), msModel('asphalt_debris'), msModel('metaltable'), msModel('shelf'), msModel('wardrobe'), msModel('door1'), msModel('trashbag'),
  ]);
  stage('Ausbau Ost/West: Aufbau');
  const byName = (root, pred) => { const out = []; root.traverse(m => { if (m.isMesh && pred(m.name)) out.push(m); }); return out; };
  const only = (root, pred) => { const o = root.clone(true); const del = []; o.traverse(m => { if (m.isMesh && !pred(m.name)) del.push(m); }); del.forEach(m => m.parent.remove(m)); return o; };

  // ================================================================= OST · LANDSTRASSE
  // Asphalt: nahtlos an die Ortsstraße (x 78 … 158), UV weiterlaufend
  { const g = new T.PlaneGeometry(80, 8); planeUV(g, 80, 8, 5); const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) + 156 / 5);
    const m = new T.Mesh(g, M.asphalt); m.rotation.x = -PI / 2; m.position.set(118, .02, 0); m.receiveShadow = true; R.eRoad.g.add(m); }
  { const b = new Batch(); for (let x = 80; x < 150; x += 6) if (Math.random() < .8) b.box(2.6, .012, .14, lineMat, mtx(x, .03, rand(-.04, .04), rand(-.02, .02))); b.flush(R.eRoad.g); }
  // Gehwege laufen noch bis zur Tankstelle bzw. zum Schrottplatz, dann Schotterbankett
  box(19, .14, 2, 87.5, .07, 5, M.sidewalk, { cast: false, parent: R.eRoad.g }); box(19, .16, .16, 87.5, .08, 4.05, M.sidewalk, { cast: false, parent: R.eRoad.g });
  box(24, .14, 2, 90, .07, -5, M.sidewalk, { cast: false, parent: R.eRoad.g }); box(24, .16, .16, 90, .08, -4.05, M.sidewalk, { cast: false, parent: R.eRoad.g });
  flat('gravel', 18, 1.8, 137, 4.9, { tint: 0x8a8578 }); flat('gravel', 44, 1.8, 124, -4.9, { tint: 0x8a8578, p: R.eRoad.g }); flat('gravel', 18, 1.8, 137 + 18, -4.9, { tint: 0x8a8578 });
  for (let i = 0; i < 7; i++) decal(msTex('grime/b.png', true), rand(1.5, 3.5), rand(1, 2.5), rand(84, 150), .031, rand(-3.5, 3.5), 0, -PI / 2, { p: R.eRoad.g, mat: { color: 0x1a1612, opacity: .7 } }).rotation.z = rand(0, 6);

  // ---------------------------------------------------------------- Tankstelle Kranz (x 97 … 128, z 4 … 31)
  flat('sidewalk_tiles', 30, 26.9, 112, 17.5, { tint: 0x8c8a84, tile: 3, y: .024, p: R.station.g });
  for (let i = 0; i < 9; i++) decal(msTex('grime/b.png', true), rand(1.5, 4), rand(1.5, 4), rand(99, 126), .036, rand(6, 29), 0, -PI / 2, { p: R.station.g, mat: { color: 0x14110e, opacity: .8 } }).rotation.z = rand(0, 6);
  for (const [ox, oz, s] of [[107, 14.6, 1.6], [115, 15.4, 1.3], [111, 22.5, 2.2], [120, 11, 1.1]]) decal(msTex('oel/b.png', true), s * rand(.9, 1.2), s * rand(.8, 1.1), ox, .037, oz, 0, -PI / 2, { p: R.station.g, mat: { color: 0x3a342c, opacity: .9 } }).rotation.z = rand(0, 6); // echte Ölflecken (Megascans „Oil Stain“) unter den Zapfinseln
  // Kiosk: Wände mit Scan-Putz, großes Schaufenster, Tür, Nachtschalter
  const KW = 'wall_damaged', KT = 0xa29e94, K = R.station.g;
  wbox(KW, 12, 3.3, .25, 112, 1.65, 30.875, { tint: KT, p: K }); wbox(KW, .25, 3.3, 6, 106.125, 1.65, 28, { tint: KT, p: K }); wbox(KW, .25, 3.3, 6, 117.875, 1.65, 28, { tint: KT, p: K });
  const fw = (x0, x1, y0, y1) => wbox(KW, x1 - x0, y1 - y0, .25, (x0 + x1) / 2, (y0 + y1) / 2, 25, { tint: KT, p: K });
  fw(106, 107.4, 0, 3.3); fw(107.4, 112.4, 0, .95); fw(107.4, 112.4, 2.55, 3.3); fw(112.4, 112.8, 0, 3.3); fw(112.8, 113.9, 2.02, 3.3); fw(113.9, 114.6, 0, 3.3); fw(114.6, 115.6, 0, 1.02); fw(114.6, 115.6, 1.58, 3.3); fw(115.6, 118, 0, 3.3);
  wbox('facade_concrete', 12.7, .32, 6.8, 112, 3.46, 28, { tint: 0x77746e, p: K }); flat('sidewalk_tiles', 11.5, 5.5, 112, 28, { y: .03, tint: 0x5a5854, p: K });
  const glassK = new T.MeshStandardMaterial({ color: 0x18222a, roughness: .08, metalness: .4, transparent: true, opacity: .64, envMapIntensity: 1.2 });
  const shopWin = new T.Mesh(new T.BoxGeometry(5, 1.6, .03), glassK); shopWin.position.set(109.9, 1.75, 25); K.add(shopWin);
  const hatchWin = new T.Mesh(new T.BoxGeometry(1, .56, .03), glassK); hatchWin.position.set(115.1, 1.3, 25.02); K.add(hatchWin);
  wbox('rust_sheet', 1.1, .05, .34, 115.1, 1.03, 24.8, { p: K });
  { const d = fit(door1S.clone(true), 1.98); d.scale.x *= 1.05 / Math.max(.01, new T.Box3().setFromObject(d).getSize(new V3()).x); put(d, 113.35, 25.02, 0, 0, K); }
  // Leuchtband über dem Kiosk (Schrift auf rostigem Blech)
  const fasciaTx = (typeof echt_an === 'function' ? f => echt_an(f, 'schablone') : f => f())(() => canvasTex(1024, 96, (c, w, h) => { c.fillStyle = '#d9d2c2'; c.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(${90 + rand(0, 40)},${50 + rand(0, 20)},20,${rand(.05, .25)})`; c.fillRect(rand(0, w), rand(0, h), rand(4, 60), rand(20, h)); }
    c.fillStyle = '#8a1c14'; c.font = 'bold 58px Arial'; c.textAlign = 'center'; c.fillText('TANKSTELLE  KRANZ  ·  KFZ', w / 2, 68); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, h - 8, w, 8); })); // Blechschild: aufgemalte Schablonenschrift mit Abplatzern
  const fascia = new T.Mesh(new T.PlaneGeometry(11.6, 1.08), new T.MeshStandardMaterial({ map: fasciaTx, emissive: 0xffffff, emissiveMap: fasciaTx, emissiveIntensity: .0, roughness: .6 })); fascia.position.set(112, 3.2, 24.84); K.add(fascia);
  // Innen: Werkbank als Tresen, Regale, Kalender, Licht
  { const t = fit(metaltableS.clone(true), 3.2, 'x'); put(t, 110.3, 26, 0, 0, K); const s1 = fit(wardrobeS.clone(true), 1.95); put(s1, 108, 30.49, PI / 2, 0, K); const s2 = fit(wardrobeS.clone(true), 1.95); put(s2, 116.3, 30.49, PI / 2, 0, K);
    const tb = fit(trashS.clone(true), .7); put(tb, 117, 26.2, 1, 0, K); }
  // Kiosk belebt: Stuhl hinter dem Tresen, Röhrenfernseher, Ware in den Regalen (Kanister, Grablichter, Spielzeug), Paletten, Müllsäcke
  { const n0 = K.children.length, rcK = new T.Raycaster(), topAt = (o, x, z, from) => { o.updateMatrixWorld(true); rcK.set(new V3(x, from, z), new V3(0, -1, 0)); rcK.far = 1.2; const h = rcK.intersectObject(o, true)[0]; return h ? h.point.y : null; };
    const partOf = (src, name, s) => { src.updateMatrixWorld(true); let m = null; src.traverse(q => { if (q.isMesh && q.name === name) m = q; }); if (!m) return null; const g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.computeBoundingBox(); const b = g.boundingBox;
      g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); g.scale(s, s, s); g.computeBoundingBox(); g.computeBoundingSphere(); return shade(new T.Mesh(g, m.material)); };
    const counter = K.children.find(o => Math.abs(o.position.x - 110.3) < .01 && Math.abs(o.position.z - 26) < .01), shelves = K.children.filter(o => Math.abs(o.position.z - 30.49) < .01 && (Math.abs(o.position.x - 108) < .01 || Math.abs(o.position.x - 116.3) < .01));
    const ch = await msFBX('chair', 'model.fbx', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }); put(fit(ch, .92), 110.9, 27.0, PI + .35, 0, K);
    if (counter) { const ty = topAt(counter, 109.2, 26, 1.5); if (ty) { const tv = fit((await msModel('crt', 'model.glb')).clone(true), .36); put(tv, 109.2, 26.02, PI / 2 + .25, ty, K); /* QA 09.10.: crt-Bildschirm bei +x – vorher zur Seitenwand */ } }
    for (const sh of shelves) { const x0 = sh.position.x, lv = [.9, 1.5, 2.1].map(f => topAt(sh, x0, 30.45, f)).filter((y, i, a) => y !== null && a.indexOf(y) === i).sort((a, b) => a - b);
      if (!lv.length) continue; const low = lv[0], mid = lv[1] ?? low, top = lv[2] ?? mid;
      if (x0 < 112) { put(fit(jerryS.clone(true), .42), x0 - .4, 30.35, .2, low, K); put(fit(jerryS.clone(true), .4), x0 + .35, 30.3, -.25, low, K);
        for (let i = 0; i < 6; i++) { const c = partOf(candleS, ['Candle_large_small_new', 'Candle_large_big_new', 'Candle_small_new001', 'Candle_large_small_new001', 'Candle_thin_new', 'Candle_small_new'][i], .01); if (c) put(c, x0 - .55 + i * .2, 30.3 + (i % 2) * .08, rand(0, 6), mid, K); } }
      else { for (const [n, dx, r] of [['SM_ToyRobot', -.4, .3], ['SM_ToyBoat', .05, -.4], ['SM_ToyTrain', .45, .2]]) { const t = partOf(toysS, n, .01); if (t) put(t, x0 + dx, 30.3, PI + r, mid, K); }
        for (let i = 0; i < 4; i++) { const c = partOf(candleS, ['Candle_large_small_used_low', 'Thin_candle_used_low', 'Candle_large_big_used_low', 'Candle_small_used_low'][i], .01); if (c) put(c, x0 - .45 + i * .3, 30.3, rand(0, 6), top, K); }
        put(fit(trashS.clone(true), .55), x0 + .1, 30.25, 2.2, low, K); } }
    const pl = palletS; for (let i = 0; i < 3; i++) put(fit(pl.clone(true), .14), 113.4 + rand(-.05, .05), 30.05, rand(-.08, .08) + (i % 2) * .05, i * .145, K);
    put(fit(trashS.clone(true), .72), 106.75, 29.9, .4, 0, K); put(fit(trashS.clone(true), .6), 107.35, 30.35, 2.3, 0, K);
    // alles Neue je Material zu einem Mesh zusammenfassen (wenige Draw Calls)
    { const items = K.children.slice(n0), by = new Map(); K.updateMatrixWorld(true);
      for (const it of items) it.traverse(m => { if (!m.isMesh) return; const mat = [].concat(m.material)[0]; let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(m.matrixWorld);
        for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.uv || !g.attributes.normal) return; g.morphAttributes = {}; g.clearGroups();
        if (!by.has(mat)) by.set(mat, []); by.get(mat).push(g); m.userData.owMerged = 1; });
      items.forEach(it => { let all = true; it.traverse(m => { if (m.isMesh && !m.userData.owMerged) all = false; }); if (all) K.remove(it); });
      for (const [mat, geos] of by) { const g = geos.length > 1 ? mergeGeometries(geos) : geos[0]; if (!g) continue; g.computeBoundingSphere(); const m = new T.Mesh(g, mat); m.castShadow = m.receiveShadow = true; m.userData.dress = 1; K.add(m); } } }
  const calTx = canvasTex(256, 360, (c, w, h) => { c.fillStyle = '#e8e2d2'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a1a14'; c.font = 'bold 26px Arial'; c.textAlign = 'center'; c.fillText('OKTOBER 2009', w / 2, 38); c.font = '16px Arial'; c.fillStyle = '#333';
    for (let d = 1; d <= 31; d++) { const col = (d + 2) % 7, row = Math.floor((d + 2) / 7); c.fillText(String(d), 24 + col * 34, 80 + row * 44); } c.strokeStyle = '#b01010'; c.lineWidth = 4; c.beginPath(); c.arc(24 + ((31 + 2) % 7) * 34, 74 + Math.floor(33 / 7) * 44, 17, 0, 7); c.stroke(); c.font = 'italic 18px Georgia'; c.fillStyle = '#b01010'; c.fillText('sie kommen', w / 2, h - 30); });
  decal(calTx, .5, .7, 111.5, 1.9, 30.72, PI, 0, { p: K });
  const tubeK = new T.Mesh(new T.PlaneGeometry(2.2, .14), emiss(0xdff2ff, 2.2)); tubeK.rotation.x = PI / 2; tubeK.position.set(111, 3.28, 28); K.add(tubeK);
  const kioskLight = vlight(0xd8ecff, 1.6, 7, 111, 2.8, 28);
  // Kassenbuch (offen, im Nachtschalter)
  const bookTx = canvasTex(512, 340, (c, w, h) => { c.fillStyle = '#d8cfb8'; c.fillRect(0, 0, w, h); c.fillStyle = '#b8ad94'; c.fillRect(w / 2 - 3, 0, 6, h); c.strokeStyle = 'rgba(60,70,120,.35)'; for (let y = 30; y < h; y += 18) { c.beginPath(); c.moveTo(10, y); c.lineTo(w - 10, y); c.stroke(); }
    c.fillStyle = 'rgba(30,30,70,.8)'; c.font = '15px Caveat, cursive'; for (let y = 44, i = 0; y < h - 20; y += 18, i++) { c.fillText(['30.10. Super 22,40', '30.10. Diesel 41,00', '31.10. Normal 18,10', '31.10. 01:02 Zig.', '31.10. 02:47 —', '31.10. 03:13 KIND', '', ''][i % 8] || '', 16, y); }
    c.fillStyle = 'rgba(120,10,10,.75)'; c.font = 'bold 26px Caveat, cursive'; c.fillText('03:13', w / 2 + 40, 120); });
  const book = decal(bookTx, .42, .28, 115.1, 1.065, 24.82, 0, -PI / 2, { p: K }); book.rotation.z = .12;
  // Tankdach, Säulen, Zapfinseln (Zapfsäulen wurden abmontiert)
  wbox('planks_painted', 17.2, .62, 10.2, 111, 4.72, 15, { tint: 0xbdb6a6, tile: 1.5, p: K });
  wbox('rust_sheet', 17.26, .14, 10.26, 111, 4.52, 15, { tint: 0xa8483a, p: K, cast: false });
  for (const x of [107, 115]) { wbox('facade_concrete', .45, 4.4, .45, x, 2.2, 15, { tint: 0x8a8680, p: K }); wbox('facade_concrete', 1.3, .22, 4.4, x, .11, 15, { tint: 0x7a7670, p: K }); }
  const outTx = canvasTex(256, 320, (c, w, h) => { c.fillStyle = '#e4dcc6'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = 'bold 34px Arial'; c.textAlign = 'center'; c.fillText('AUSSER', w / 2, 90); c.fillText('BETRIEB', w / 2, 132); c.font = '20px Arial'; c.fillText('seit 1.11.2009', w / 2, 190); c.fillStyle = 'rgba(80,60,30,.3)'; c.fillRect(0, h - 70, w, 70); });
  for (const x of [107, 115]) decal(outTx, .3, .38, x, 1.45, 15.235, 0, 0, { p: K });
  const canopyTubes = [[104, 13], [104, 17], [111, 13], [111, 17], [118, 13], [118, 17]].map(([x, z]) => { const m = new T.Mesh(new T.PlaneGeometry(1.5, .13), emiss(0xe6f4ff, 2.6)); m.rotation.x = PI / 2; m.position.set(x, 4.39, z); K.add(m); return m; });
  const canopyLights = [vlight(0xdcecff, 2.2, 11, 107, 4, 15), vlight(0xdcecff, 2.2, 11, 115, 4, 15)];
  const canopyPools = [pool(0xcfe4ff, 11, 107, 15, .22, K), pool(0xcfe4ff, 11, 115, 15, .22, K)];
  for (const [x, z, r] of [[106.5, 17.6, .3], [115.6, 12.3, 2.1]]) { const j = jerryS.clone(true); put(j, x, z, r, .22, K); }
  // QA-Art 09.10.: der Platz unter dem Tankdach war bis auf zwei Kanister leer – abgesperrte Zapfinseln (Leitkegel, umgekippter Kegel), ein Reifenstapel am Kiosk, Müllsäcke an der Säule; alles vorhandene Scan-Modelle, nichts auf den Laufwegen
  try { msInst(coneP, [msM4(107, .22, 12.95, .4, 1), msM4(107.15, .22, 17.05, 1.3, 1), msM4(115, .22, 17.0, 2.2, 1), msM4(114.3, .17, 18.2, .9, 1, 0, 1.52)]).forEach(im => K.add(im));
    put(fit(tiresS.clone(true), 1.5, 'max'), 104.6, 23.4, 2.6, 0, K); put(fit(trashS.clone(true), .62), 115.6, 15.9, 1.2, .22, K); put(fit(trashS.clone(true), .5), 116.0, 15.3, 3.1, 0, K);
    put(fit(palletS.clone(true), .14), 119.3, 19.4, .35, 0, K); } catch (e) { console.warn('QA-Art Tankstelle', e); }
  // Altes Leuchtschild an der Straße: eigener Aufdruck auf dem gescannten Blech
  const signImg = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = 'assets/ms/gas_signs/OldGasStationSign.jpg'; });
  const signTx = canvasTex(1024, 512, (c, w, h) => { if (signImg) c.drawImage(signImg, 0, 0, w, h); else { c.fillStyle = '#ccc'; c.fillRect(0, 0, w, h); }
    c.fillStyle = '#dcd8cc'; c.fillRect(22, 22, 336, 336); c.fillStyle = '#8e1f16'; c.textAlign = 'center'; c.font = 'bold 74px Arial'; c.fillText('TANK', 190, 118); c.fillText('STELLE', 190, 206); c.font = 'bold 82px Arial'; c.fillText('KRANZ', 190, 312);
    c.fillStyle = '#e4e0d6'; c.fillRect(478, 30, 326, 322); c.fillStyle = '#1b1b1b'; c.font = 'bold 34px Arial'; c.textAlign = 'left';
    const rows = [['SUPER', '0', ',', '', ''], ['NORMAL', '', ',', '3', ''], ['DIESEL', '1', ',', '', '3']];
    rows.forEach((r, i) => { const y = 110 + i * 92; c.fillText(r[0], 494, y); c.font = 'bold 48px Arial'; [r[1], r[2], r[3], r[4]].forEach((d, k) => { const x = 660 + k * 34; if (d && d !== ',') { c.fillStyle = '#f0ede4'; c.fillRect(x - 4, y - 42, 32, 50); c.fillStyle = '#1b1b1b'; c.fillText(d, x, y); } else if (d === ',') c.fillText(',', x + 6, y); else { c.strokeStyle = 'rgba(0,0,0,.25)'; c.strokeRect(x - 4, y - 42, 32, 50); } }); c.font = 'bold 34px Arial'; }); });
  const signMat = new T.MeshStandardMaterial({ map: signTx, emissive: 0xffffff, emissiveMap: signTx, emissiveIntensity: .9, roughness: .6 });
  const gasSign = only(gasSignS, n => n === 'OldGasSign'); gasSign.traverse(m => { if (m.isMesh) m.material = signMat; });
  const gasSignG = fit(gasSign, 5.6); put(gasSignG, 99.2, 8.2, PI / 2, 0, K);
  const signLight = vlight(0xff5a3a, 1.4, 8, 100.2, 4.6, 8.2), signGlow = glow(0xff6040, 4.5, 99.6, 4.6, 8.2, K);
  // Container, Reifen, Paletten am Kiosk
  { const d = fit(dumpS.clone(true), 1.3); put(d, 120.4, 28.2, PI / 2, 0, K); const tr = fit(tiresS.clone(true), 4.2, 'max'); put(tr, 124.2, 23.5, .7, 0, K);
    const p1 = palletsS.clone(true); put(p1, 120.6, 31.8, .1, 0, K); const p2 = palletsS.clone(true); put(p2, 122.2, 31.6, -.15, 0, K); }

  // ---------------------------------------------------------------- Schrottplatz & Wendehammer (x 95 … 140, z −32 … −4)
  const J = R.junk.g;
  flat('asphalt_road2', 7, 9, 106, -8.5, { tint: 0x7a7a78, p: J }); flat('wet_asphalt', 21, 18, 105.5, -21, { tint: 0x8a8274, tile: 3, y: .021, p: J }); flat('gravel', 24, 24, 128, -20, { tint: 0x6a6660, tile: 2.5, y: .02, p: J });
  for (let i = 0; i < 10; i++) decal(msTex('grime/b.png', true), rand(1.5, 4), rand(1.5, 4), rand(97, 139), .03, rand(-31, -10), 0, -PI / 2, { p: J, mat: { color: 0x0e0c0a, opacity: .85 } }).rotation.z = rand(0, 6);
  const CF = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(-(z1 - z0), x1 - x0); wbox('corrugated', L, 2.3, .06, (x0 + x1) / 2, 1.15, (z0 + z1) / 2, { ry: a, tint: 0x8c8880, tile: 2.3, p: J });
    for (let k = 0; k <= L; k += 3.05) wbox('rust_sheet', .1, 2.45, .1, x0 + (x1 - x0) * k / L, 1.22, z0 + (z1 - z0) * k / L, { p: J }); };
  CF(116, -8, 140, -8); CF(116, -32, 140, -32); CF(140, -32, 140, -8); CF(116, -32, 116, -24.6); CF(116, -19.4, 116, -8);
  // offene Torflügel
  wbox('corrugated', 2.6, 2.2, .06, 117.3, 1.12, -25.6, { ry: -.35, tint: 0x807c74, tile: 2.2, p: J }); wbox('corrugated', 2.6, 2.2, .06, 117.1, 1.12, -18.1, { ry: .55, tint: 0x807c74, tile: 2.2, p: J });
  const burned = { cross: only(burnedS, n => n === 'default002'), sedan: only(burnedS, n => n === 'default001') };
  const carAt = (src, len, x, z, ry, p) => { const c = fit(src.clone(true), len, 'max'); return put(c, x, z, ry, 0, p); };
  carAt(burned.sedan, 4.4, 122.5, -14.5, 1.35, J); carAt(junkS, 4.5, 130.5, -12.6, .18, J);
  { const v = only(vanS, n => n === 'Object016'); carAt(v, 4.9, 133.2, -25.2, -.45, J); }
  { const t1 = fit(tiresS.clone(true), 3.4, 'max'); put(t1, 125.2, -29.4, 2.2, 0, J); const t2 = fit(tiresS.clone(true), 3, 'max'); put(t2, 137.4, -18.6, 4.1, 0, J);
    const d = fit(dumpS.clone(true), 1.3); put(d, 137.6, -29.8, PI / 2 + .1, 0, J); const pp = palletsS.clone(true); put(pp, 119, -30.6, .4, 0, J);
    for (let i = 0; i < 4; i++) { const p = palletS.clone(true); put(p, 137.2 + rand(-.1, .1), -10.6, rand(-.2, .2), i * .145, J); } }
  { const s = fit(shedUtilS.clone(true), 2.8); put(s, 99.6, -26.5, PI / 2, 0, J); }
  const plateTx = (typeof echt_an === 'function' ? f => echt_an(f, 'schablone') : f => f())(() => canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#6a5a44'; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(20,12,6,${rand(.1, .4)})`; c.fillRect(0, rand(0, h), w, rand(1, 4)); } c.fillStyle = '#e6dcc4'; c.font = 'bold 54px Arial'; c.textAlign = 'center'; c.fillText('SCHROTT · KRANZ', w / 2, 84); })); // aufgemalt (Schablone)
  decal(plateTx, 2, .5, 101.05, 2.4, -26.5, PI / 2, 0, { p: J });
  // Roter Kanister (Nebenaufgabe) neben dem Schrottauto
  const redCan = jerryS.clone(true); redCan.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd84030); } }); put(redCan, 133.6, -10.2, 1.1, 0, J); redCan.rotation.z = 1.45; redCan.position.y = .17;

  // ---------------------------------------------------------------- Straßensperre (x ≈ 146)
  const BK = R.block.g;
  for (const [x, z, r] of [[146, -5.25, PI / 2 + .05], [146.5, .05, PI / 2 - .04], [146.1, 5.3, PI / 2 + .09]]) put(barrierS.clone(true), x, z, r, 0, BK);
  { const mats4 = [[143.2, -3.6, .3], [143.5, -1.4, 1], [143.1, .9, 2], [143.6, 3.2, .5], [144.2, 6.4, 1.2]].map(([x, z, r]) => msM4(x, 0, z, r, 1)); mats4.push(msM4(142.1, .17, 2, .4, 1, 0, 1.52)); msInst(coneP, mats4).forEach(im => BK.add(im)); }
  { const rs = only(roadSignS, n => n === 'Road_Sign_01'); const g = fit(rs, 2.5); put(g, 144.4, -6.9, -PI / 2, 0, BK); }
  const blockTx = canvasTex(400, 520, (c, w, h) => { c.fillStyle = '#e8e2cf'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.textAlign = 'center'; c.font = 'bold 40px Arial'; c.fillText('SPERRGEBIET', w / 2, 70); c.font = '22px Arial';
    ['Durchfahrt und Betreten', 'verboten.', '', 'Anordnung des', 'Amtes für Rückführung', 'vom 13.07.1992', '', 'Zuwiderhandlungen werden', 'nicht verfolgt.'].forEach((l, i) => c.fillText(l, w / 2, 130 + i * 34));
    c.strokeStyle = 'rgba(120,10,10,.8)'; c.lineWidth = 5; c.beginPath(); c.moveTo(40, 416); c.lineTo(360, 410); c.stroke(); c.fillStyle = 'rgba(24,30,110,.85)'; c.font = '30px Caveat, cursive'; c.textAlign = 'left'; c.fillText('Weil keiner zurückkommt,', 36, 452); c.fillText('den man verfolgen könnte.', 44, 486); c.textAlign = 'center'; c.fillStyle = 'rgba(90,70,40,.25)'; c.fillRect(0, h - 90, w, 90); });
  decal(blockTx, .42, .55, 146.2, .6, .1, -PI / 2, 0, { p: BK });
  carAt(burned.cross, 4.3, 150.6, 2.6, 2.05, BK); carAt(burned.sedan, 4.4, 153.8, -2.9, .9, BK);
  for (let i = 0; i < 5; i++) { const d = debrisS.clone(true); put(d, rand(147.5, 156), rand(-5, 5), rand(0, 6), 0, BK); }
  // Laternen & Strommasten (Holzmasten mit Querträger, Leitungen weiter nach Osten)
  const eLamps = [owLamp(86, 6.3, 0, -1, 'on'), owLamp(104, -6.3, 0, 1, 'flicker'), owLamp(128, 6.3, 0, -1, 'on'), owLamp(141, -6.3, 0, 1, 'on')];
  const poleAt = (x, z) => { const p = fit(poleS.clone(true), 8.6); put(p, x, z, PI / 2, 0); addCol(x - .16, x + .16, z - .16, z + .16); return p; };
  { const px = [95, 114, 133, 152]; px.forEach(x => poleAt(x, 7.6)); const wires = [], all = [76, ...px];
    for (let i = 0; i < all.length - 1; i++) for (const o of [-.9, 0, .9]) { const a = new V3(all[i], 8.08, 7.6 + o), c = new V3(all[i + 1], 8.08, 7.6 + o), mid = a.clone().lerp(c, .5); mid.y -= .9; wires.push(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, mid, c), 16, .015, 4, false)); }
    const wm = new T.Mesh(mergeGeometries(wires), M.dark); R.eRoad.g.add(wm); }

  // ================================================================= WEST · SCHOTTERWEG, SCHREBERGÄRTEN, HOF, VILLA
  // Asphalt bricht ab, dann Schotter
  { const g = new T.PlaneGeometry(5, 8); planeUV(g, 5, 8, 5); const m = new T.Mesh(g, M.asphalt); m.rotation.x = -PI / 2; m.position.set(-80.5, .02, 0); m.receiveShadow = true; R.wRoad.g.add(m); }
  box(4, .14, 2, -80, .07, 5, M.sidewalk, { cast: false, parent: R.wRoad.g }); box(4, .14, 2, -80, .07, -5, M.sidewalk, { cast: false, parent: R.wRoad.g });
  flat('gravel', 72, 6.4, -119, 0, { tint: 0x9a9486, tile: 2.2, y: .021, p: R.wRoad.g });
  flat('wet_asphalt', 70, 1.6, -119, 2.2, { tint: 0x7c7466, y: .023, p: R.wRoad.g }); flat('wet_asphalt', 70, 1.4, -119, -2.4, { tint: 0x7c7466, y: .023, p: R.wRoad.g });
  for (let i = 0; i < 8; i++) decal(msTex('grime/b.png', true), rand(1.2, 2.6), rand(1, 2), rand(-150, -84), .032, rand(-2.5, 2.5), 0, -PI / 2, { p: R.wRoad.g, mat: { color: 0x0c0b09, opacity: .6 } }).rotation.z = rand(0, 6);
  const wLamps = [owLamp(-86, 6.3, 0, -1, 'on'), owLamp(-111, 5.4, 0, -1, 'flicker'), owLamp(-122.5, -5.4, 0, 1, 'on')];
  { const px = [-95, -111 + 3, -130, -149]; px.forEach(x => poleAt(x, 7.6)); const wires = [], all = [-76, ...px];
    for (let i = 0; i < all.length - 1; i++) for (const o of [-.9, 0, .9]) { const a = new V3(all[i], 8.08, 7.6 + o), c = new V3(all[i + 1], 8.08, 7.6 + o), mid = a.clone().lerp(c, .5); mid.y -= .9; wires.push(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, mid, c), 16, .015, 4, false)); }
    R.wRoad.g.add(new T.Mesh(mergeGeometries(wires), M.dark)); }

  // ---------------------------------------------------------------- Schrebergärten „Lost Eyengless e. V.“ (x −140 … −90, z 3 … 48)
  const A = R.allot.g;
  flat('gravel', 3.2, 44, -115, 25.2, { tint: 0x8a857a, p: A }); flat('gravel', 30, 2.4, -128, 19.4, { tint: 0x8a857a, p: A });
  flat('wet_asphalt', 3, 8.5, -115, 50.6, { tint: 0x746e62, p: R.villa.g }); flat('wet_asphalt', 13, 2.6, -120.2, 55.4, { tint: 0x746e62, p: R.villa.g }); flat('wet_asphalt', 3, 6.2, -125.5, 59.4, { tint: 0x746e62, p: R.villa.g });
  // Beete (dunkle Erde) und Parzellen-Zäune an der Wegseite
  for (const [x0, z0] of [[-126, 9], [-126, 20.5], [-126, 31.5], [-112, 9], [-112, 20.5], [-112, 31.5]]) for (let k = 0; k < 3; k++) if (Math.random() < .8) flat('bark', 1.3, 6.2, x0 + 1.8 + k * 2.6 + (x0 > -120 ? 0 : 0), z0 + 4, { tint: 0x4a3a2c, y: .018, p: A });
  { // Zaun: gescannte Latten (Holz-Scan per Box-Projektion) – nur Wegseite und Außenkanten, Pforten offen
    const f = fenceS.clone(true); f.updateMatrixWorld(true); const planks = sm('planks_painted', 0x8a8a7c); f.traverse(m => { if (m.isMesh) reUV(m, 90, () => 0, [planks]); });
    const fg = fit(f, 1.05); fg.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(fg), segL = bb.max.x - bb.min.x;
    const parts = []; fg.traverse(m => { if (m.isMesh) parts.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material[0] || m.material }); });
    const M4 = []; const run = (x0, z0, x1, z1, gaps = []) => { const L = Math.hypot(x1 - x0, z1 - z0), a = Math.atan2(-(z1 - z0), x1 - x0), n = Math.floor(L / segL);
      for (let i = 0; i < n; i++) { const k = (i + .5) * segL / L, cx = x0 + (x1 - x0) * k, cz = z0 + (z1 - z0) * k; if (gaps.some(([gx, gz]) => Math.hypot(cx - gx, cz - gz) < segL * .7)) continue; M4.push(msM4(cx, 0, cz, a, 1, rand(-.03, .03), rand(-.05, .05))); } };
    run(-117, 8, -117, 18.3, [[-117, 13]]); run(-117, 20.6, -117, 29.3, [[-117, 25]]); run(-117, 31.6, -117, 40, [[-117, 36]]);
    run(-113, 8, -113, 18.3, [[-113, 13]]); run(-113, 20.6, -113, 29.3, [[-113, 25]]); run(-113, 31.6, -113, 40, [[-113, 36]]);
    run(-127.5, 8, -117, 8); run(-113, 8, -102.5, 8); run(-127.5, 40, -117, 40); run(-113, 40, -102.5, 40);
    msInst(parts, M4).forEach(im => A.add(im));
  }
  // Parzelle W1: alter Schuppen mit offenen Türen, Schubkarre
  { const s = fit(shedOldS.clone(true), 2.9); put(s, -123.5, 14, -PI / 2, 0, A); const w = wbarS.clone(true); put(w, -119.4, 10.2, .6, 0, A); }
  // Parzelle W2: Vogelscheuche im Gemüsebeet – trägt Lukes Kinderjacke
  const scare = fit(scareS.clone(true), 2.15); put(scare, -121.2, 24.8, PI / 2, 0, A);
  // Parzelle W3: verwilderte Parzelle 7 (Wendt) mit Geräteschuppen
  { const s = fit(shedUtilS.clone(true), 2.7); put(s, -122.8, 36.2, -PI / 2, 0, A); OW.shedP7 = s; }
  const p7Tx = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#5a4a36'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8ceb4'; c.font = 'bold 34px Georgia'; c.textAlign = 'center'; c.fillText('Parzelle 7', w / 2, 52); c.font = '24px Georgia'; c.fillText('Wendt', w / 2, 96); });
  decal(p7Tx, .5, .25, -116.9, 1.05, 36.2, PI / 2, 0, { p: A });
  // Parzelle E1: Picknicktisch, acht Teller
  { const p = fit(picnicS.clone(true), .78); put(p, -108, 13.2, .3, 0, A); OW.picnic = p; const w = wbarS.clone(true); put(w, -104.5, 10.6, -1.2, 0, A); }
  // Parzelle E2: die Laube mit Licht
  const laube = fit(shedGarS.clone(true), 3.1); put(laube, -107.2, 25, -PI / 2, 0, A);
  const laubeLight = vlight(0xffb468, 1.8, 6, -107.2, 1.8, 25), laubeGlow = glow(0xffa050, 3.2, -108.6, 1.5, 25, A), laubePool = pool(0xffa050, 5, -110.3, 25, .3, A);
  laube.traverse(m => { if (m.isMesh) { const mm = [].concat(m.material); if (mm.some(x => /Glass/i.test(x.name))) m.material = new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffb060, emissiveIntensity: 1.2, transparent: true, opacity: .85 }); } });
  // Parzelle E3: Brunnen
  const well = (() => { const w = wellS.clone(true); w.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(w), H = bb.max.y - bb.min.y, y0 = bb.min.y;
    const stone = sm('wall_damaged', 0x8a857c), wood = sm('planks_painted', 0x5e5042);
    w.traverse(m => { if (m.isMesh) reUV(m, k => k ? 60 : 110, (n, y) => y < y0 + H * .43 ? 0 : 1, [stone, wood]); }); return w; })(); // unten Stein, oben Holz
  const wellG = fit(well, 2.9); put(wellG, -108, 35.5, .4, 0, A);
  // Vereinsplatz: Schwarzes Brett
  const boardTx = canvasTex(512, 384, (c, w, h) => { c.fillStyle = '#3a2e22'; c.fillRect(0, 0, w, h); const note = (x, y, rw, rh, r, lines) => { c.save(); c.translate(x, y); c.rotate(r); c.fillStyle = '#ddd4bc'; c.fillRect(0, 0, rw, rh); c.fillStyle = '#222'; c.font = '15px Georgia'; lines.forEach((l, i) => c.fillText(l, 10, 24 + i * 19)); c.fillStyle = '#9a1a12'; c.beginPath(); c.arc(rw / 2, 6, 5, 0, 7); c.fill(); c.restore(); };
    note(20, 20, 220, 160, -.04, ['KLEINGARTENVEREIN', 'LOST EYENGLESS e. V.', '', 'Parzellen 1–7 sind bis', '31.10. zu räumen.', 'Der Vorstand']); note(270, 30, 210, 140, .05, ['VERMISST', 'Zayn Wendt, 7 J.', 'zuletzt gesehen:', 'Kreuzung, 28.7.09']); note(60, 200, 190, 150, .03, ['Gartenfest', 'fällt aus.', '', 'Bitte keine Kinder', 'nach Einbruch der', 'Dunkelheit.']); note(290, 200, 190, 140, -.06, ['Wer hat die Laternen', 'ausgeblasen?', '— H. W.']); });
  wbox('planks_painted', 1.8, 1.2, .08, -129, 1.35, 21.3, { tint: 0x6a5a48, p: A }); decal(boardTx, 1.7, 1.12, -129, 1.35, 21.35, 0, 0, { p: A, mat: { transparent: false, depthWrite: true, alphaTest: 0 } });
  for (const x of [-129.85, -128.15]) wbox('planks_painted', .1, 1.9, .1, x, .95, 21.25, { tint: 0x4a3e32, p: A });
  // Laternen der Nebenaufgabe (zunächst aus)
  const lanternsQ = [[-118.2, 22.8], [-110.2, 16.4], [-118.4, 33.4]].map(([x, z]) => { const g = fit(lanternS.clone(true), .42); put(g, x, z, rand(0, 6), 0, A);
    let bulb = null; g.traverse(m => { if (m.isMesh && /buln|bulb/i.test(m.name + [].concat(m.material)[0].name)) bulb = m; }); if (bulb) { bulb.material = bulb.material.clone(); bulb.material.emissive = new T.Color(0xffa040); bulb.material.emissiveIntensity = 0; }
    const L = vlight(0xffa050, 0, 5, x, .5, z); const gw = glow(0xffa040, 1.4, x, .35, z, A); gw.visible = false; return { g, bulb, L, gw, x, z, on: false }; });

  // ---------------------------------------------------------------- Hof: Pferdestall (begehbar), Remise, Bauernhaus
  const F = R.farm.g;
  flat('wet_asphalt', 4, 11, -126, -8.6, { tint: 0x7c7466, p: F }); flat('wet_asphalt', 36, 28, -130, -29, { tint: 0x8a8070, tile: 3, y: .02, p: F });
  for (let i = 0; i < 8; i++) decal(msTex('grime/b.png', true), rand(1.5, 3.5), rand(1.5, 3), rand(-146, -114), .03, rand(-42, -16), 0, -PI / 2, { p: F, mat: { color: 0x0c0a08, opacity: .75 } }).rotation.z = rand(0, 6);
  // Stall: Scan-Szene, Maßstab 3,5, Schornstein-Fragment und die Hälfte der Fässer entfernt
  const SC = 3.5, barnC = new V3(-13.15, 1.0, 9.65);
  const barn = barnS.clone(true); { const del = []; let nb = 0; barn.traverse(m => { if (!m.isMesh) return; if (/^duvar(7|14|15|16|17|18|19|20)$/.test(m.name)) del.push(m); if (/Barrel/i.test(m.name) && nb++ % 2) del.push(m); }); del.forEach(m => m.parent.remove(m)); }
  barn.scale.setScalar(SC); barn.position.set(-barnC.x * SC, -barnC.y * SC + .02, -barnC.z * SC);
  const barnW = new T.Group(); barnW.add(barn); put(barnW, -142, -28, PI, 0, F); barnW.updateMatrixWorld(true);
  barn.traverse(m => { if (m.isMesh) { m.material.envMapIntensity = .3; if (/duvar/.test(m.name)) m.castShadow = false; } });
  const bw = (x, y, z) => barn.localToWorld(new V3(x, y, z));
  const barnDoor = bw(-14.24, 1.0, 10.25), barnIn = bw(-13.15, 1.0, 9.65), nestP = bw(-12.85, 1.01, 10.03);
  const barnRect = (() => { const a = bw(-14.1, 1, 8.66), b = bw(-12.21, 1, 10.64); return { x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z) }; })();
  // Schlafplatz eines Kindes im Heu
  let hayMat = null; barn.traverse(m => { if (m.isMesh && /Fresh_Harvest/.test(m.material.name)) hayMat = m.material; });
  const nest = new T.Mesh(new T.CircleGeometry(1.1, 20), hayMat ? hayMat.clone() : sm('bark', 0xb8a070)); nest.rotation.x = -PI / 2; nest.position.set(nestP.x, .045, nestP.z); F.add(nest);
  const blanketTx = msTex('wallpaper_fabric/b.jpg', true); const blanket = new T.Mesh(new T.PlaneGeometry(1.25, .8), new T.MeshStandardMaterial({ map: blanketTx, color: 0x7a4a4a, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 }));
  blanket.rotation.set(-PI / 2, 0, .4); blanket.position.set(nestP.x + .1, .06, nestP.z); F.add(blanket);
  const bunny = fit(only(toysS, n => n === 'SM_ToyBunny'), .32); put(bunny, nestP.x - .45, nestP.z + .25, 2.2, .04, F); bunny.rotation.z = .5;
  const candleUsed = fit(only(candleS, n => /^(Candle_small_used_low|Steel_holder_candle_small_relief_low)$/.test(n)), .05); put(candleUsed, nestP.x + .6, nestP.z - .35, 0, .03, F);
  // Stall-Laterne, schwingend
  const barnLantern = new T.Group(); { const p = bw(-13.15, 1.9, 9.65); barnLantern.position.set(p.x, p.y - .3, p.z); F.add(barnLantern); const l = fit(lanternS.clone(true), .38); l.position.y = -.55; barnLantern.add(shade(l));
    l.traverse(m => { if (m.isMesh && /buln/i.test([].concat(m.material)[0].name)) { m.material = m.material.clone(); m.material.emissive = new T.Color(0xff9a40); m.material.emissiveIntensity = 3; } }); }
  const barnLight = vlight(0xffa050, 2.2, 8, barnIn.x, 2.2, barnIn.z);
  // Remise (offene Scheune) mit gescannten Planken per Box-Projektion
  const remise = (() => { const o = remiseS.clone(true); o.scale.setScalar(.01); o.updateMatrixWorld(true); const planks = sm('planks_painted', 0x6e5e4c), rust = sm('rust_sheet', 0x9a8a7a);
    o.traverse(m => { if (m.isMesh) reUV(m, 1.6, (n, y, name) => /Metal/.test(name) ? 1 : 0, [planks, rust]); }); return o; })();
  const remG = msGround(remise); put(remG, -124, -40.5, PI / 2, 0, F);
  { const M4 = [[-129, -33.4, .2], [-127.3, -33.6, 1.2], [-125.6, -33.3, 2.6], [-128.2, -33.5, .9, 1.25], [-126.4, -33.4, 2, 1.25], [-120.5, -36, 1.4]].map(([x, z, r, y = 0]) => msM4(x, y, z, r, 1)); msInst(hayP, M4).forEach(im => F.add(im)); }
  { const t = tractorS.clone(true); t.traverse(m => { if (m.isMesh) m.material.envMapIntensity = .3; }); put(t, -132, -20.5, .7, -.02, F); }
  { const w = wbarS.clone(true); put(w, -137.5, -19, 2.4, 0, F); }
  // Bauernhaus (makeHouse, Kisten-Hitbox wie die anderen Häuser); das Fassaden-Team veredelt alle HOUSES
  const farmhouse = makeHouse({ x: -117.5, z: -13, facing: -1, w: 11, d: 9, H: 6, tint: 0x8d877c, lit: [4], chimney: true, porch: true, porchLight: false, shutters: M.dark, boarded: [1] });
  const fhDoor = hit(1.2, 2.3, .35, -117.5, 1.6, -13 - 4.65, 'Klopfen', () => { Audio.knock(-117.5, 1.3, -13 - 4.65); toast(['Niemand öffnet. Hinter der Tür scharrt ein Hund. Dann nicht mehr.', 'Du klopfst. Oben knarrt ein Dielenbrett. Genau über dir.', 'Verschlossen. Am Klingelschild: AYDIN. Darunter, mit Kinderschrift: und Dina.'][Math.floor(rand(0, 3))], 4200); });
  { const b = fit(bikeS.clone(true), 1.75, 'max'); put(b, -121.6, -18.6, .3, 0, F); b.rotateX(PI / 2 - .1); b.position.y = .27; OW.rad = b; b.traverse(m => { if (m.isMesh) { m.material = [].concat(m.material).map(mt => { const k = mt.clone(); k.color.multiply(new T.Color(0xff5c48)); return k; }); if (m.material.length === 1) m.material = m.material[0]; } }); } // liegt auf der Seite im Matsch; rotes Damenrad

  // ---------------------------------------------------------------- Die alte Villa (−125, 70) – Wahrzeichen, verschlossen
  const VG = R.villa.g;
  const villa = (() => { const o = villaS.clone(true); o.scale.setScalar(.011); o.updateMatrixWorld(true);
    const wall = sm('wall_damaged', 0x6f6c64, 1.2), roof = sm('road_asphalt', 0x5c616a, 1.4), plinth = sm('facade_concrete', 0x55534e), brick = sm('facade_brick', 0x5a4038), metal = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .5, metalness: .8 }), lglass = new T.MeshStandardMaterial({ color: 0x0a0c10, roughness: .2 });
    o.traverse(m => { if (m.isMesh) reUV(m, k => [2.4, 1.6, 2, 1.2, 1, 1][k], (n, y, name) => name === 'notGlass' ? 4 : name === 'glass' ? 5 : (n.y > .35 && y > 8.6) ? 1 : y < .85 ? 2 : (y > 12.6 && Math.abs(n.y) < .5) ? 3 : 0, [wall, roof, plinth, brick, metal, lglass]); });
    return o; })();
  const villaG = msGround(villa); put(villaG, -125, 70, PI, 0, VG); villaG.updateMatrixWorld(true);
  const vbb = new T.Box3().setFromObject(villaG); OW.villa = villaG; OW.vbb = vbb; // Modul anwesen
  // Fenster: dunkles Glas hinter den Rahmen, ein einziges erleuchtetes Fenster (per Strahl an die Fassade gesetzt)
  const vray = new T.Raycaster(), vMeshes = []; villaG.traverse(m => { if (m.isMesh) vMeshes.push(m); });
  const vq = new T.Quaternion(); villa.getWorldQuaternion(vq);
  const vwin = (a, ly, face, w, h, mat) => { // Modellmaße in m (Maßstab 0,01); face: 'front' (+z) | 'side' (+x) | 'lside' (−x)
    const nL = face === 'front' ? new V3(0, 0, 1) : face === 'side' ? new V3(1, 0, 0) : new V3(-1, 0, 0);
    const pM = face === 'front' ? new V3(a, ly, 12) : new V3(face === 'side' ? 12 : -12, ly, a), off = face === 'front' ? new V3(.2, .28, 0) : new V3(0, .28, .2);
    const o = villa.localToWorld(pM.clone().add(off).divideScalar(.01)), n = nL.clone().applyQuaternion(vq);
    vray.set(o, n.clone().negate()); vray.far = 30; const h1 = vray.intersectObjects(vMeshes, false)[0]; if (!h1) return null;
    const c = villa.localToWorld(pM.clone().divideScalar(.01)); c.addScaledVector(n, new V3().subVectors(h1.point, c).dot(n) + .012);
    const m = new T.Mesh(new T.PlaneGeometry(w, h), mat); m.position.copy(c); m.lookAt(c.clone().add(n)); VG.add(m); return m; };
  const vGlass = new T.MeshStandardMaterial({ color: 0x06080b, roughness: .08, metalness: .5, envMapIntensity: 1.4 });
  const litMatV = M.winLit.clone(); litMatV.emissiveIntensity = 1.4;
  const vWins = []; for (const lx of [-4.72, 4.72]) for (const ly of [2.1, 6.1]) vWins.push([lx, ly, 'front']); for (const lz of [.47, -3.85]) for (const ly of [2.1, 6.1]) { vWins.push([lz, ly, 'side']); vWins.push([lz, ly, 'lside']); }
  let villaLit = null; const villaGlass = [];
  for (const [a, b, f] of vWins) { const lit = a === 4.72 && b === 6.1 && f === 'front'; const m = vwin(a, b, f, 1.5, 1.78, lit ? litMatV : vGlass); if (m) { if (lit) villaLit = m; else villaGlass.push(m); } }
  OW.villaGlass = villaGlass; // Fassung 3 (AP-15): winkendes Fenster (anwesen.js)
  const vLitPos = villaLit ? villaLit.position.clone() : new V3(-130, 7, 60);
  const villaLight = vlight(0xffb070, 1.6, 7, vLitPos.x, vLitPos.y, vLitPos.z - 1.2), villaGlow = glow(0xffa060, 4, vLitPos.x, vLitPos.y, vLitPos.z - .3, VG);
  const villaSil = new T.Mesh(new T.PlaneGeometry(.75, .95), new T.MeshBasicMaterial({ map: silTex, color: 0x000000, transparent: true, opacity: 0, depthWrite: false }));
  if (villaLit) { villaSil.position.copy(villaLit.position).add(new V3(0, -.12, -.01)); villaSil.quaternion.copy(villaLit.quaternion); villaSil.position.addScaledVector(new V3(0, 0, 1).applyQuaternion(villaLit.quaternion), .006); VG.add(villaSil); }
  // Gartenmauer (bemooster Stein-Scan) mit verschlossenem Eisentor
  { const sw = stoneS.clone(true); const swG = fit(sw, 1.4); swG.updateMatrixWorld(true); const sb = new T.Box3().setFromObject(swG), sL = sb.max.x - sb.min.x;
    const parts = []; swG.traverse(m => { if (m.isMesh) parts.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material }); }); const M4 = [];
    const run = (x0, x1, z) => { for (let x = x0 + sL / 2; x <= x1 - sL / 2 + .01; x += sL * .97) M4.push(msM4(x, -.05, z, rand(-.02, .02) + (Math.random() < .5 ? 0 : PI), 1)); };
    run(-146, -127.6, 57); run(-122.4, -104, 57); msInst(parts, M4).forEach(im => VG.add(im)); }
  const gate = (() => { const g = fit(ironS.clone(true), 2.1); g.updateMatrixWorld(true); const s = new T.Box3().setFromObject(g).getSize(new V3()); g.scale.x *= 4.6 / Math.max(s.x, .1); put(g, -125, 57, 0, 0, VG); return g; })();
  const chainTx = canvasTex(128, 128, (c, w) => { c.clearRect(0, 0, w, w); c.strokeStyle = '#6a6a66'; c.lineWidth = 7; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(20 + i * 18, 64 + (i % 2) * 4, 11, 7, .3, 0, 7); c.stroke(); } c.fillStyle = '#b8a060'; c.fillRect(52, 70, 26, 30); });
  OW.gate = gate; OW.chain = decal(chainTx, .5, .5, -125, 1.15, 56.9, PI, 0, { p: VG });

  // ================================================================= Bodennebel über den neuen Gebieten (gleiches Material wie im Ort)
  for (const [x, z, w, d] of [[120, -2, 78, 76], [-117, 18, 76, 110]]) for (const y of [.3, .85]) { const m = new T.Mesh(new T.PlaneGeometry(w, d), fogMat); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.renderOrder = 2; scene.add(m); }

  // ================================================================= NEBENAUFGABEN
  // STORY-HOOK: Nebenaufgaben „Die Geldkassette“, „Der rote Kanister“ (Ost) · „Das Heft im Heu“, „Drei Laternen“ (West)
  story.side.ow_kasse = { title: 'Die Geldkassette', desc: 'Im Nachtschalter der Tankstelle Kranz steht eine Kassette mit Zahlenschloss.', state: 'hidden' };
  story.side.ow_kanister = { title: 'Kinder tanken nicht', desc: 'Der letzte Kunde der Tankstelle hat einen roten Kanister nie zurückgebracht.', state: 'hidden' }; // Fassung 3: Kap. 5 (AP-22)
  story.side.ow_heft = { title: 'Das Heft im Heu', desc: 'Im Pferdestall hat ein Kind geschlafen. Aus seinem Heft fehlen drei Seiten.', state: 'hidden' };
  story.side.ow_laternen = { title: 'Drei Laternen', desc: 'In der Laube liegt ein Zettel: Drei Laternen sollen brennen, „damit sie heimfinden“.', state: 'hidden' };
  const Q = OW.q = { kasse: false, kanisterHave: false, kanisterDone: false, pages: new Set(), heftSeen: false, heftDone: false, matches: false, lit: 0, laternDone: false, jacket: false, book: false };
  const item = (k, name, desc) => { if (!ITEMS[k]) { ITEMS[k] = { name, desc }; ICONS[k] = ICONS.paper; } addItem(k); };

  // ================================================================= ENTDECKBARES · OST
  // STORY-HOOK: Kassenbuch der Tankstelle Kranz endet am 31.10.2009 um 03:13
  const readBook = () => ausbau_ost_west_schalter(Q); // Fassung 3 (AP-15, „Zapfsäule 3“): Bon, dann Mikes Schichtbuch
  OW.Q = Q;
  hit(1.1, .7, .5, 115.1, 1.3, 24.8, () => !Q.book ? 'Nachtschalter' : !Q.kasse ? 'Geldkassette öffnen' : 'Kassenbuch', () => {
    if (!Q.book) return readBook();
    if (Q.kasse) return readBook();
    let v = [0, 0, 0, 0];
    openPuzzle(`<h3>GELDKASSETTE</h3><p>Vier Rädchen. Die Zahlen sind abgegriffen.</p><div class="row" id="owW">${v.map((d, i) => `<button data-i="${i}" style="font:28px Georgia;min-width:52px">${d}</button>`).join('')}</div><div class="row" style="margin-top:14px"><button id="owOk">ÖFFNEN</button></div><p class="small">Auf dem Deckel eingeritzt: <i>P. K.</i></p>`, bx => {
      bx.querySelectorAll('#owW button').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.i; v[i] = (v[i] + 1) % 10; b.textContent = v[i]; Audio.flick(); });
      bx.querySelector('#owOk').onclick = e => { e.stopPropagation(); if (v.join('') === '0313') { closeOverlay(); Q.kasse = true; Audio.play('lockOpen', { gain: .6, x: 115.1, y: 1.1, z: 24.8, ref: 2 }); Audio.play('metalOpen', { gain: .4, rate: 1.4, delay: .3, x: 115.1, y: 1.1, z: 24.8, ref: 2 });
          setTimeout(() => openNote('In der Geldkassette', 'Kein Geld. Nur ein Polaroid und ein gefalteter Zettel.\n\nAuf dem Foto: ein Junge an der Zapfsäule, einen roten Kanister in der Hand. Das Gesicht ist verwackelt. Hinten drauf:\n' + noteHand('„Luke B., 31.10.09 – 03:13. Hat mit diesem Foto bezahlt.\nEs ist ein Foto von ihm selbst. Blaue Augen.\nDer Junge, der seit August bei Marion wohnt, hat braune.“') + '\n\nDer Zettel:\n' + noteHand('Peter, wenn du das findest: Ich hab die Säulen abbauen lassen. Die kommen nachts und wollen tanken. Kinder tanken nicht. — Vater'), 'ow_kassette', () => { ausbau_ost_west_zapfCheck(); /* QA K1/2: schloss die Nebenaufgabe vorzeitig ab, obwohl noch vier der fünf Spuren fehlten */ }), 500); }
        else { Audio.beep(false); Q.kw = (Q.kw || 0) + 1; toast(Q.kw >= 3 ? 'Das Schloss hält. Draußen am Leuchtschild hängen vier Ziffern. Und im Schaufenster ist ein Tag rot umkringelt.' : 'Das Schloss hält. Irgendwo hinter dir klingelt die Ladenglocke. Einmal.', Q.kw >= 3 ? 4600 : 3200); Audio.bell(112, 25); } };
    }); });
  // STORY-HOOK: Preistafel = Zahlencode 0-3-1-3
  hit(1, 3, 1, 99.2, 3.2, 8.2, 'Leuchtschild', () => { toast('TANKSTELLE KRANZ. Die Röhre summt. Auf der Preistafel hängen nur noch vier Ziffern: 0 … 3 … 1 … 3.', 5200); Audio.buzz(99.2, 4.5, 8.2); OW.signFlick = 2.5; });
  hit(5, 1.6, .4, 109.9, 1.75, 24.75, 'Schaufenster', () => toast(['Drinnen: Regale mit Kanistern, Grablichtern und Spielzeug, ein Kalender. Oktober 2009. Der 31. ist rot umkringelt.', 'Auf dem Tresen stehen acht Pappbecher. Einer ist umgefallen.', 'Im Staub am Fenster: kleine Handabdrücke. Von innen.'][Math.floor(rand(0, 3))], 4200));
  hit(1.2, 2.2, .5, 113.35, 1.1, 24.7, 'Ladentür', () => { Audio.play('metalHit2', { gain: .3, rate: 1.2, x: 113, y: 1, z: 25, ref: 2 }); toast('Abgeschlossen. An der Tür hängt ein Schild: „Komme gleich wieder.“ Der Staub darauf ist fingerdick.', 4000); });
  for (const x of [107, 115]) hit(1.4, .6, 4.4, x, .4, 15, () => Q.kanisterHave && !Q.kanisterDone ? 'Kanister abstellen' : 'Zapfinsel', () => {
    if (Q.kanisterHave && !Q.kanisterDone) { Q.kanisterDone = true; story.items = story.items.filter(k => k !== 'ow_kanister'); const j = jerryS.clone(true); j.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd84030); } }); put(j, x + .2, 14.2, .4, .22, K);
      Audio.play('metalHit1', { gain: .4, x, y: .3, z: 15, ref: 2 }); OW.canopyDie = 3.5; setTimeout(() => { Audio.giggle(x - 2, 1, 11); subtitle('Aus dem Kanister tropft es. Kein Benzin. Wasser. Kalt, wie aus einem Brunnen.', 4800); OW.footsteps = { x: x, z: 13, t: 0 }; }, 1800);
      setTimeout(() => { story.lore.push({ key: 'ow_kanister', title: 'Der rote Kanister', html: 'Du hast den Kanister zurückgebracht. Aus ihm tropfte Wasser, kein Benzin. Kleine nasse Fußabdrücke führten von der Zapfinsel nach Osten – zur Sperre.' }); sideDone('ow_kanister', 'Zurückgebracht. Die Fußabdrücke führten zur Sperre.'); }, 4500); return; }
    toast('Vier abgeschnittene Bolzen, wo die Säulen standen. Jemand hat Kreidestriche daneben gemacht: acht Stück.', 4200); });
  hit(.7, .6, .6, 133.6, .3, -10.2, 'Roter Kanister', () => { if (Q.kanisterHave) return; Q.kanisterHave = true; redCan.visible = false; item('ow_kanister', 'Roter Kanister', 'Aus dem Schrott der Tankstelle Kranz. Innen schwappt etwas. Auf dem Griff, eingeritzt: LUKE.');
    subtitle('Der Kanister ist nicht leer. Auf dem Griff, eingeritzt: LUKE.', 4200); if (story.side.ow_kanister.state === 'hidden' && kapAb(5)) sideStart('ow_kanister'); story.side.ow_kanister.desc = 'Bring den roten Kanister zurück zur Zapfinsel der Tankstelle.'; });
  hit(2.1, 1.4, 1.3, 120.4, .7, 28.2, 'Müllcontainer', () => { Audio.play('metalOpen', { gain: .35, rate: .9, x: 120, y: 1, z: 28, ref: 2 }); toast('Im Container: Kinderschuhe. Sieben Paar, ordentlich nebeneinander. Und ein einzelner.', 4200); });
  hit(3.5, 1.2, 3, 124.2, .6, 23.5, 'Reifenstapel', () => toast('Auf den Reifen, mit weißer Kreide gezählt: I II III IV V VI VII. Der achte Strich ist frisch.', 4200));
  hit(4.4, 1.6, 2, 122.5, .8, -14.5, 'Ausgebranntes Auto', () => toast('Auf dem Rücksitz: ein geschmolzener Kindersitz. Der Gurt ist noch geschlossen.', 4200));
  hit(4.5, 1.4, 2, 130.5, .7, -12.6, 'Schrottauto', () => { Audio.play('metalOpen', { gain: .3, rate: 1.1, x: 130, y: 1, z: -12, ref: 2 }); toast('Kofferraum: eine Decke, eine Taschenlampe ohne Batterien, ein Schulranzen. Name herausgeschnitten.', 4400); });
  // Transporter: siehe ausbau_ost_west_f3 („Sieben Kindersitze“)
  // Schrottbüro: eigener Schuppen am Wendehammer (ausbau_ost_west_f3); der Geräteschuppen hier ist Günthers Schuppen (post.js)
  hit(1.6, 1.1, 17, 146.3, .55, 0, 'Straßensperre', () => openNote('Aushang an der Betonsperre', 'Laminiert, vergilbt, mit Kabelbinder befestigt:\n\n<b>SPERRGEBIET</b>\nDurchfahrt und Betreten verboten.\nAnordnung des Amtes für Rückführung vom 13.07.1992.\n' + noteHand('Zuwiderhandlungen werden nicht verfolgt.') + '\n\nDarunter hat jemand mit Kuli geschrieben:\n' + noteHand('„Weil keiner zurückkommt, den man verfolgen könnte.“'), 'ow_sperre')); // STORY-HOOK: Amt/1992
  hit(4.5, 1.6, 2.2, 150.6, .8, 2.6, 'Ausgebranntes Auto', () => { Audio.radio(150.6, 2.6); setTimeout(() => say([['*Rauschen*', 1400], ['„…einunddreißig Komma eins null… wer das hört: nicht über die Sperre…“', 3600, 'AUTORADIO'], ['*Klick*', 700]]), 500); }); // STORY-HOOK: 31,10 MHz
  hit(2, 2.6, 1.2, 144.4, 1.3, -6.9, 'Verkehrsschild', () => toast('Einfahrt verboten. Jemand hat mit Filzstift daruntergeschrieben: AUSFAHRT AUCH.', 3600));

  // ================================================================= ENTDECKBARES · WEST
  // STORY-HOOK: Vogelscheuche trägt Lukes Kinderjacke
  hit(1.3, 2.2, 1, -121.2, 1.1, 24.8, 'Vogelscheuche', () => { const k5 = kapAb(5); if (!Q.jacket || !Q.pages.has('jacke')) { Q.jacket = true; openNote('Die Vogelscheuche', 'Sie trägt eine Kinderjacke. Blau, abgewetzt, zu klein für einen Erwachsenen.\n\nIm Kragen, mit Filzstift:\n' + noteHand('LUKE B.') + '\n\nDu hattest so eine Jacke. Du bist sicher, dass du so eine hattest.' + '\nIn der Tasche steckt ein gefaltetes Blatt – aus einem Schulheft gerissen.', 'ow_jacke', () => { if (k5) owPage('jacke'); else ausbau_ost_west_seite1(); }); }
    else toast(['Die Jacke riecht nach Heu. Und nach dir.', 'Der Sackkopf ist dir zugewandt. Oder war er das vorher schon?'][Math.floor(rand(0, 2))], 3600); });
  const owPage = k => { if (Q.pages.has(k)) return; Q.pages.add(k); Audio.paper(); item('ow_seiten', 'Heftseiten', 'Aus einem Schulheft gerissen. Kinderschrift, mit Bleistift.');
    const txt = { jacke: '„…das Mädchen sagt, ich darf nicht nach Hause. Da schläft schon einer in meinem Bett…“', schuppen: '„…wenn sie nicht hinsieht, darf ich runter in den Stall. Die Pferde sind weg, aber es riecht noch nach ihnen…“', tor: '„…in dem großen Haus brennt ein Licht. Da oben wohnt der Doktor, der uns vermessen hat…“' }[k];
    toast('Eine Heftseite: ' + txt, 6500); const q = story.side.ow_heft; if (q.state === 'done') return; if (q.state === 'hidden') sideStart('ow_heft'); // AP-25: Seiten 2–3 ab Kap. 3, Heft im Stall ab Kap. 5
    q.desc = `Seiten gefunden: ${Q.pages.size} / 3. ` + (Q.heftSeen ? 'Bring sie zurück zum Schlafplatz im Stall.' : 'Sie gehören dem Kind, das im Stall am Hof schläft. Das Heft hat es bei sich – wenn es wieder da ist, lege ich sie zurück.'); updateSideInfo(); };
  // STORY-HOOK: Kinderschlafplatz im Heu
  hit(2, .6, 1.8, nestP.x, .3, nestP.z, () => Q.pages.size === 3 && !Q.heftDone ? 'Seiten ins Heft legen' : 'Schlafplatz im Heu', () => {
    if (Q.pages.size === 3 && !Q.heftDone) { Q.heftDone = true; story.items = story.items.filter(k => k !== 'ow_seiten'); Audio.paper();
      openNote('Das Heft im Heu', 'Die drei Seiten passen genau. Zusammen ergibt es einen Brief, ungelenk, mit Bleistift:\n\n' + noteHand('An Mama.\nDas Mädchen sagt, ich darf nicht nach Hause. Da schläft schon einer in meinem Bett, und er heißt wie ich.\nWenn sie nicht hinsieht, darf ich runter in den Stall. Die Frau aus Nr. 7 stellt Brot hin. Sie sieht mich nicht.\nIn dem großen Haus brennt ein Licht. Da oben wohnt der Doktor, der uns vermessen hat.\nIch bin nicht böse auf den anderen. Sag ihm, er soll meine Jacke behalten.\n— L.') + '\n\nAuf der Rückseite, ganz klein: <i>Sommer 2009</i>.', 'ow_heft', () => { sideDone('ow_heft', 'Ein Brief an eine Mutter. Unterschrieben mit L.'); setTimeout(() => { Audio.whisper(nestP.x, 1, nestP.z, 2); subtitle('<i>… danke …</i>', 2200); }, 1200); }); return; }
    if (!kapAb(5)) return openNote('Ein Schlafplatz', 'Jemand hat hier geschlafen. Eine Decke, ein Stoffhase, ein heruntergebrannter Kerzenstumpen. Das Heu ist in der Mitte eingedrückt – so groß wie ein Kind.\n\nDas Heu ist noch warm.', 'ow_nest');
    if (!Q.heftSeen) { Q.heftSeen = true; openNote('Ein Schlafplatz', 'Jemand hat hier geschlafen. Eine Decke, ein Stoffhase, ein heruntergebrannter Kerzenstumpen. Das Heu ist in der Mitte eingedrückt – so groß wie ein Kind.\n\nUnter der Decke: ein Schulheft. Name ausgeradiert. Drei Seiten sind herausgerissen.\n\nDas Heu ist noch warm.', 'ow_nest', () => { sideStart('ow_heft'); story.side.ow_heft.desc = `Seiten gefunden: ${Q.pages.size} / 3. Bring sie zurück zum Schlafplatz im Stall.`; }); }
    else toast(Q.heftDone ? 'Der Hase liegt jetzt anders. Mit dem Gesicht zur Tür.' : 'Das Heft wartet. Drei Seiten fehlen.', 3600); });
  hit(1.6, 2.2, 2.6, -123.5, 1.1, 14, 'Alter Schuppen', () => { if (kapAb(3) && !Q.pages.has('schuppen')) { toast('Zwischen Spaten und Säcken klemmt ein Blatt Papier. Im Schuppen liegt noch mehr – sieh noch einmal hin.', 4200); setTimeout(() => owPage('schuppen'), 900); } else if (!story.items.includes('drahtschneider')) { addItem('drahtschneider'); Audio.play('metalHit1', { gain: .35, rate: 1.4, x: -123.5, y: 1, z: 14, ref: 2 }); toast('Zwischen den Spaten, an einem Nagel: ein Drahtschneider. Die Griffe sind mit Kinderpflastern umwickelt.', 4400); }
    else toast('Werkzeug, Säcke, ein Kinderspaten. Alles sauber aufgereiht, als würde gleich jemand wiederkommen.', 3800); });
  hit(4.6, 2.2, .6, -125, 1.1, 56.6, () => Q.pages.has('tor') || !kapAb(3) ? 'Eisentor' : 'Eisentor (Zettel)', () => { if (kapAb(3) && !Q.pages.has('tor')) { owPage('tor'); return; }
    if (OW.gateOpen) return toast('Das Tor steht offen. Der Kies dahinter ist unberührt – bis auf deine Spuren.', 3200);
    if (kap() === 1 && typeof anwesen_f3Schloesser === 'function' && !anwesen_F3.schloesser) { Audio.play('ironDoor', { gain: .3, rate: 1.3, x: -125, y: 1, z: 57, ref: 3 }); toast('Eine Kette mit acht Vorhängeschlössern. Eines ist neuer als die anderen. Dahinter: Kiesweg, keine Spur.', 4200); anwesen_f3Schloesser(); return; }
    if (story.items.includes('drahtschneider') && kapAb(4)) { OW.gateOpen = true; Audio.play('metalHit2', { gain: .5, rate: .8, x: -125, y: 1, z: 57, ref: 3 }); Audio.play('ironDoor', { gain: .5, rate: .9, delay: .6, x: -125, y: 1, z: 57, ref: 4 });
      OW.chain.visible = false; msHide(OW.gate); const pv = new T.Group(); pv.position.set(-127.3, 0, 57); pv.userData.noCol = true; const leaf = OW.gate.clone(true); leaf.visible = true; leaf.position.set(2.3, 0, 0); leaf.rotation.set(0, 0, 0); pv.add(leaf); VG.add(pv);
      tween(pv, { ry: -1.2 }, 2.4); toast('Die Kette gibt nach. Das Tor schwingt von selbst auf – langsam, als hätte jemand dahinter gewartet.', 4800); return; } // STORY-HOOK: Villa-Gelände geöffnet
    Audio.play('ironDoor', { gain: .35, rate: 1.3, x: -125, y: 1, z: 57, ref: 3 }); toast('Kette und Schloss. Das Schloss ist neu, die Kette dünn und rostig. Hinter dem Tor: Kiesweg, keine Spur. Oben brennt ein einziges Fenster.', 4600); }); // STORY-HOOK: Villa zunächst verschlossen
  hit(30, 4.5, .4, -125, 3.9, 57.9, 'Die Villa', () => toast(['Die Villa Seiler. Der alte Amtsarzt ist 2019 darin gestorben, allein. Seitdem brennt oben jede Nacht ein Licht.', 'Aus dem Schornstein steigt kein Rauch. Aber das Fenster ist beschlagen – von innen.'][Math.floor(rand(0, 2))], 4600)); // STORY-HOOK: Villa/„die uns zählt“
  hit(1.8, 1.4, 1.8, -108, .8, 35.5, 'Brunnen', () => { if (!kapAb(3)) return ausbau_ost_west_brunnen(); if (kapAb(3)) { Audio.drip(-108, -.5, 35.5); setTimeout(() => { Audio.whisper(-108, 0, 35.5, 1.8); subtitle('<i>„Hasen … Hasen …“</i>', 2600); }, 1400); return; }
    Audio.play('stones1', { gain: .4, x: -108, y: .5, z: 35.5, ref: 2 }); toast('Du lässt einen Kiesel fallen. Er schlägt nicht auf.', 2600); setTimeout(() => { Audio.drip(-108, -.5, 35.5); Audio.whisper(-108, 0, 35.5, 1.8); subtitle('<i>… Luke? Bist du das oben?</i>', 2600); }, 2400); }); // STORY-HOOK: Brunnen – Stimmen von unten (versunkene Stadt?)
  hit(2.2, 1, 2.2, -108, .5, 13.2, 'Picknicktisch', () => toast('Acht Teller, acht Gabeln. Auf jedem Teller liegt ein Kiesel. Auf dem achten zwei.', 3800));
  hit(1.9, 1.3, .2, -129, 1.35, 21.4, 'Schwarzes Brett', () => openNote('Schwarzes Brett · Kleingartenverein', '<b>Parzellen 1–7 sind bis 31.10. zu räumen.</b> — Der Vorstand\n\n<b>VERMISST</b>: Zayn Wendt, 7 J., zuletzt gesehen Kreuzung, 28.7.09, 23:41\n\nGartenfest fällt aus. Bitte keine Kinder nach Einbruch der Dunkelheit.\n\n' + noteHand('Wer hat die Laternen ausgeblasen? — H. W.'), 'ow_brett')); // STORY-HOOK: Zayn Wendt, Parzelle 7
  hit(2.6, 2.4, 2.6, -122.8, 1.2, 36.2, () => Q.matches ? 'Hildes Laube · Parzelle 7' : 'Hildes Laube (Parzelle 7)', () => { if (!Q.matches) { Q.matches = true; Audio.play('doorCreak', { gain: .3, rate: 1.2, x: -122.8, y: 1, z: 36.2, ref: 2 });

      openNote('Hildes Laube · Parzelle 7', 'Eine Petroleumlampe, Streichhölzer, und ein Zettel, mit Reißzwecke auf das Holz geheftet:\n\n' + noteHand('Drei. Immer drei.'), 'ow_laube', () => { item('ow_streich', 'Streichhölzer', 'Aus der Laube. Die Schachtel ist feucht, aber es sind genug.'); kirchberg_start('ow_laternen'); ausbau_ost_west_warmDesc(); }); }
    else toast('Hildes Laube. Die Petroleumlampe brennt klein. Auf dem zweiten Stuhl ein Kissen, eingedrückt.', 4200); }); // Parzelle 7 = Hilde Wendt
  lanternsQ.forEach((Lq, i) => hit(.6, .7, .6, Lq.x, .35, Lq.z, () => Lq.on ? 'Laterne' : Q.matches ? 'Laterne anzünden' : 'Laterne', () => {
    if (Lq.on) return toast('Die Flamme steht still. Kein Wind hier unten. Nur bei dir.', 3000);
    if (!Q.matches) return toast('Eine alte Sturmlaterne. Der Docht ist neu. Jemand wollte, dass sie brennt.', 3400);
    Lq.on = true; Q.lit++; Audio.play('switch1', { gain: .15, rate: 2 }); Audio.flick(); ausbau_ost_west_warmDesc();
    if (Q.lit < 3) toast(Q.lit === 1 ? 'Die Laterne brennt. Irgendwo im Garten knackt ein Zweig.' : 'Zwei. Hinter dir, auf dem Kies: leise Schritte. Sie bleiben stehen, als du dich umdrehst.', 4200);
    if (Q.lit === 2) for (let k = 0; k < 4; k++) setTimeout(() => { const g = flatDir(); Audio.stepAt(player.pos.x - g.x * 3.5, player.pos.z - g.z * 3.5, .3); }, 700 + k * 480);
    if (Q.lit === 3) { Q.laternDone = true; story.items = story.items.filter(k => k !== 'ow_streich'); OW.villaDark = 18; setTimeout(() => { Audio.slam(-125, 2, 64); subtitle('Oben in der Villa geht das Licht aus. Dann, auf dem Kiesweg zum Tor: Schritte. Kleine. Viele. Sie gehen nicht zu dir. Sie gehen heim.', 6500); }, 1400);
      setTimeout(() => ausbau_ost_west_warmCheck(), 6000); story.lore.push({ key: 'ow_laternen', title: 'Drei Laternen', html: 'Hilde Wendt hat jede Nacht drei Laternen in den Schrebergärten angezündet, „damit sie heimfinden“. Als die dritte brannte, erlosch das Licht in der Villa. Kleine Schritte gingen auf das Tor zu.' }); } }));
  hit(4.4, 2.2, 4.4, -132, 1.1, -20.5, 'Traktor', () => toast('Der Schlüssel steckt. Der Tank ist leer, der Sitz nass. Auf dem Kotflügel, mit Kreide: ein Pfeil nach Osten. Zur Tankstelle.', 4400)); // STORY-HOOK: Verbindung Hof ↔ Tankstelle
  hit(1.9, .9, 1, -121.6, .45, -18.6, 'Fahrrad', () => toast('Ein rotes Damenrad. Am Gepäckträger ein Aufkleber, halb abgerissen: „L. B. – 4b“. Lucys Rad. Es stand nie hier. Es stand bei euch im Keller.', 5200)); // STORY-HOOK: Lucys Fahrrad
  hit(8, 2, 3, -125, 1, -33.4, 'Heuballen', () => toast('In einen Ballen hat jemand eine Mulde gegraben. Kindergroß. Darin: acht Kieselsteine, im Kreis gelegt.', 4200));
  hit(1.4, 2.3, 3, barnDoor.x + .4, 1.15, barnDoor.z, 'Stalltür', () => toast('Innen hängt eine Laterne, die brennt. Über dem Eingang, eingeschnitzt: 1312. Darunter, frischer: 2026.', 4400)); // STORY-HOOK: 1312/2026

  // ================================================================= GÄNSEHAUT-MOMENTE & LEBEN (pro Bild)
  const hl = [-1, 1].map(s => { const sp = glow(0xfff0d0, 2.2, 170, .75, s * .75, R.block.g); sp.material.opacity = 0; return sp; });
  const G = OW.g = { lights: { st: 'idle', t: 0, done: 0 }, kiosk: { st: 'idle', t: 0, done: false }, scrape: { done: false, t: 0, n: 0 }, scare: { t: 0, n: 0, away: 0, ry0: scare.rotation.y }, villa: { st: 'idle', t: 0 }, barn: { t: 0, done: false }, buzzT: 0, windT: 3, dogT: 20, owlT: 12, flick: 0, canopyK: 1, tubeT: 0 };
  const scareBase = scare.rotation.y;
  OW.signFlick = 0; OW.canopyDie = 0; OW.villaDark = 0; OW.footsteps = null;
  const fp = []; // nasse Fußabdrücke (Kanister-Aufgabe)
  const footTx = canvasTex(64, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(20,30,40,.8)'; c.beginPath(); c.ellipse(32, 80, 13, 30, 0, 0, 7); c.fill(); for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(20 + i * 6, 38 - Math.abs(i - 2) * 3, 4, 0, 7); c.fill(); } });
  const dist2 = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z);
  OW.tick = (dt, t, indoor) => {
    const P = player.pos;
    // Sichtbarkeit nach Entfernung (Nebel verschluckt ohnehin alles ab ~50 m)
    for (const r of regions) { const dx = Math.max(r.x0 - P.x, 0, P.x - r.x1), dz = Math.max(r.z0 - P.z, 0, P.z - r.z1), d = Math.hypot(dx, dz); const v = d < r.far + (r.vis ? 6 : 0); if (v !== r.vis) { r.vis = v; r.g.visible = v; } }
    const east = R.station.vis || R.junk.vis || R.block.vis, west = R.allot.vis || R.villa.vis || R.farm.vis;
    const ch3dark = ch3.on && ch3.lampsOff;
    if (east) {
      // Leuchtschild: unruhig, summt; Tankdach-Röhren flackern
      G.flick -= dt; if (G.flick < 0) { G.flick = rand(.04, Math.random() < .1 ? 1.2 : .25); G.sk = Math.random() < .22 ? rand(0, .2) : rand(.75, 1); }
      let sk = G.sk ?? 1; if (OW.signFlick > 0) { OW.signFlick -= dt; sk = Math.random() < .5 ? 0 : 1.3; } if (ch3dark || state.outage && !ch3.on) sk *= .15;
      signMat.emissiveIntensity = .9 * sk; signLight.intensity = 1.4 * sk; signGlow.material.opacity = .9 * sk;
      G.tubeT -= dt; if (G.tubeT < 0) { G.tubeT = rand(.05, .4); G.tubeK = Math.random() < .12 ? 0 : 1; }
      let ck = OW.canopyDie > 0 ? (OW.canopyDie -= dt, Math.random() < .15 ? 1 : 0) : 1; if (ch3dark) ck = 0;
      canopyTubes.forEach((m, i) => { m.material.emissiveIntensity = 2.6 * ck * (i === 3 ? G.tubeK : 1); }); canopyLights.forEach(l => l.intensity = 2.2 * ck); canopyPools.forEach(p => p.material.opacity = .22 * ck);
      const dS = dist2(100, 8); G.buzzT -= dt; if (dS < 14 && G.buzzT < 0) { G.buzzT = rand(2.5, 6); Audio.play('buzz', { gain: .12, rate: rand(.9, 1.1), x: 99.6, y: 4.6, z: 8.2, ref: 2 }); }
      // Kiosk: bei Annäherung geht drinnen das Licht an – für einen Augenblick steht jemand hinter dem Tresen
      const Kk = G.kiosk; let kl = ch3dark ? 0 : (Math.random() < .02 ? .2 : 1);
      if (Kk.st === 'idle' && !Kk.done && calm() && dist2(112, 22) < 9 && lookAt(111, 1.6, 26.5, .85)) { Kk.st = 'dark'; Kk.t = 0; Kk.done = true; Audio.buzz(111, 3, 28); }
      if (Kk.st === 'dark') { Kk.t += dt; kl = 0; if (Kk.t > 1.4) { Kk.st = 'show'; Kk.t = 0; OW.sil.visible = true; Audio.bell(113, 25); } }
      else if (Kk.st === 'show') { Kk.t += dt; kl = Math.random() < .3 ? .4 : 1.2; if (Kk.t > .7) { Kk.st = 'gone'; Kk.t = 0; OW.sil.visible = false; kl = 0; Audio.stinger(false); } }
      else if (Kk.st === 'gone') { Kk.t += dt; kl = 0; if (Kk.t > 2.5) { Kk.st = 'idle'; if (OW.becherNeu) OW.becherNeu.visible = true; toast('Das Licht im Kiosk ist wieder an. Der Tresen ist leer. Auf ihm liegt jetzt ein Pappbecher mehr.', 4200); } }
      kioskLight.intensity = 1.6 * kl; tubeK.material.emissiveIntensity = 2.2 * kl;
      // Scheinwerfer im Nebel hinter der Sperre
      const Lh = G.lights; Lh.t += dt;
      if (Lh.st === 'idle' && Lh.done < 2 && calm() && !Audio.eng && P.x > 128 && Math.abs(P.z) < 12 && fwd.x > .75 && Lh.t > (Lh.done ? 90 : 4)) { Lh.st = 'come'; Lh.t = 0; Lh.x = 176; Audio.engine(true, Lh.x, 0); }
      if (Lh.st === 'come') { Lh.x = Math.max(158.5, Lh.x - dt * 4.2); Audio.engine(true, Lh.x, 0); hl.forEach((s, i) => { s.position.set(Lh.x, .75, (i ? 1 : -1) * .8); s.material.opacity = Math.min(1, Lh.t / 2); });
        if (Lh.x <= 158.6) { Lh.st = 'stand'; Lh.t = 0; } }
      else if (Lh.st === 'stand') { hl.forEach(s => s.material.opacity = Lh.t > 3 ? (Math.random() < .5 ? 0 : 1) : 1); if (Lh.t > 3.8) { Lh.st = 'off'; Lh.t = 0; hl.forEach(s => s.material.opacity = 0); Audio.engine(false); Audio.play('carDoor', { gain: .5, x: 159, y: 1, z: 1, ref: 4, delay: .8 });
          setTimeout(() => { subtitle('Eine Autotür. Dann nichts mehr. Kein Motor, keine Schritte. Nur der Nebel, der dichter wird.', 5000); }, 1400); } }
      else if (Lh.st === 'off' && Lh.t > 2) { Lh.st = 'idle'; Lh.t = 0; Lh.done++; if (Lh.done === 1) { const L = eLamps[3]; const pm = L.mode; L.mode = 'off'; Audio.buzz(L.wx, 5, L.wz); setTimeout(() => { if (L.mode === 'off') L.mode = pm; }, 6000); } }
      // Schrottplatz: etwas schleift außen am Wellblech entlang und folgt dir
      const Sc = G.scrape; if (!Sc.done && calm() && P.x > 117 && P.x < 139 && P.z < -9 && P.z > -31) { Sc.t -= dt; if (Sc.t < 0) { Sc.t = rand(.5, .9); Sc.n++; const zx = Math.min(139, Math.max(117, P.x + 3)); Audio.play(Audio.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .5, rate: rand(.6, .8), x: zx, y: 1, z: -32.5, ref: 3 }); if (Math.random() < .3) Audio.play('metalSheet', { gain: .2, rate: .7, x: zx, y: 1.5, z: -32.5, ref: 3 });
          if (Sc.n > 9) { Sc.done = true; Audio.play('metalHit1', { gain: .7, x: zx, y: 1.2, z: -32.2, ref: 3, delay: .6 }); setTimeout(() => subtitle('Stille. Dann, direkt hinter dem Blech, ein Klopfen. Auf Höhe deines Gesichts.', 4200), 900); } } }
      // Wind rüttelt am Wellblech
      G.windT -= dt; if (G.windT < 0) { G.windT = rand(6, 14); if (dist2(128, -20) < 26) Audio.play('metalSheet', { gain: .12, rate: rand(.5, .7), x: rand(117, 139), y: 1.5, z: Math.random() < .5 ? -8 : -32, ref: 4 }); }
      // Fußabdrücke nach der Kanister-Aufgabe: erscheinen nacheinander Richtung Osten
      if (OW.footsteps) { const Fs = OW.footsteps; Fs.t += dt; if (Fs.t > .55 && fp.length < 40) { Fs.t = 0; const n = fp.length, x = Fs.x + 1 + n * .72, z = Fs.z - 1 + (n % 2 ? .18 : -.18) - Math.min(9, n * .25);
          if (x < 145) { const d = decal(footTx, .16, .3, x, .03, z, 0, -PI / 2, { p: R.eRoad.g, mat: { color: 0xffffff, opacity: .8 } }); d.rotation.z = -PI / 2; fp.push(d); Audio.stepAt(x, z, .12); } else OW.footsteps = null; } }
    }
    if (west) {
      // Laube, Laternen, Stall-Laterne: lebendiges, warmes Flackern
      const f = .85 + Math.sin(t * 9.3) * .06 + Math.sin(t * 23.1) * .05 + (Math.random() < .03 ? -.3 : 0);
      laubeLight.intensity = 1.8 * f; laubeGlow.material.opacity = .8 * f; laubePool.material.opacity = .3 * f;
      lanternsQ.forEach(L => { if (L.on) { L.L.intensity = 1.2 * f; L.gw.visible = true; L.gw.material.opacity = .7 * f; if (L.bulb) L.bulb.material.emissiveIntensity = 3 * f; } });
      barnLantern.rotation.z = Math.sin(t * .9) * .05 + (G.barn.sway || 0) * Math.sin(t * 3.1); barnLantern.rotation.x = Math.sin(t * .7) * .04; if (G.barn.sway) G.barn.sway = Math.max(0, G.barn.sway - dt * .08);
      barnLight.intensity = 2.2 * f;
      // Vogelscheuche: dreht sich, wenn du nicht hinsiehst
      const S = G.scare, sx = -121.2, sz = 24.8, ds = dist2(sx, sz);
      if (ds < 26 && calm()) { const seen = lookAt(sx, 1.6, sz, .6); if (!seen) S.away += dt; else { S.away = 0; S.turned = false; }
        if (S.away > 4 && S.n < 4 && ds > 5 && !S.turned) { S.turned = true; S.n++; const a = Math.atan2(P.x - sx, P.z - sz) - PI / 2; scare.rotation.y = scareBase + Math.atan2(Math.sin(a - scareBase), Math.cos(a - scareBase)) * Math.min(1, .35 + S.n * .22); Audio.play('woodSqueak2', { gain: .08, rate: .6, x: sx, y: 1.5, z: sz, ref: 2 }); } }
      // Villa: Silhouette im einzigen Fenster, das Licht geht aus, wenn du am Tor bist
      const Vi = G.villa, dv = dist2(-125, 57); let vk = 1;
      if (OW.villaDark > 0) { OW.villaDark -= dt; vk = 0; }
      if (Vi.st === 'idle' && calm() && dv < 24 && dv > 12 && lookAt(vLitPos.x, vLitPos.y, vLitPos.z, .93)) { Vi.st = 'sil'; Vi.t = 0; }
      if (Vi.st === 'sil') { Vi.t += dt; villaSil.material.opacity = Math.min(.9, Vi.t / 1.5); if (dv < 11 || Vi.t > 14) { Vi.st = 'out'; Vi.t = 0; villaSil.material.opacity = 0; Audio.buzz(vLitPos.x, vLitPos.y, vLitPos.z); } }
      else if (Vi.st === 'out') { Vi.t += dt; vk = 0; if (Vi.t > 2.2 && !Vi.slam) { Vi.slam = true; Audio.play(Audio.pick('woodSlam1', 'woodSlam2'), { gain: .8, rate: .8, x: -125, y: 2, z: 64, ref: 6 }); } if (Vi.t > 22) { Vi.st = 'rest'; Vi.t = 0; Vi.slam = false; } }
      else if (Vi.st === 'rest') { Vi.t += dt; if (dv > 45) Vi.st = 'idle'; }
      const vf = vk * (.95 + Math.sin(t * 2.1) * .04);
      litMatV.emissiveIntensity = 1.4 * vf; villaLight.intensity = 1.6 * vf; villaGlow.material.opacity = .85 * vf;
      // Stall: beim ersten Betreten raschelt das Heu, die Laterne schwingt, draußen kichert ein Kind
      const Bn = G.barn, inB = P.x > barnRect.x0 && P.x < barnRect.x1 && P.z > barnRect.z0 && P.z < barnRect.z1;
      if (inB && !Bn.done && calm()) { Bn.t += dt; if (Bn.t > 3.5) { Bn.done = true; Bn.sway = .35; Audio.play('scrape2', { gain: .35, rate: .5, x: nestP.x, y: .5, z: nestP.z, ref: 2 }); setTimeout(() => Audio.play('scrape4', { gain: .3, rate: .45, x: nestP.x, y: .8, z: nestP.z + 1, ref: 2 }), 700);
        setTimeout(() => Audio.giggle(barnDoor.x + 3, 1, barnDoor.z - 1), 2600); setTimeout(() => subtitle('Draußen, vor der Stalltür: ein Kichern. Dann rennt etwas Kleines über den Hof.', 4200), 3000); for (let k = 0; k < 6; k++) setTimeout(() => Audio.stepAt(barnDoor.x + 3 + k * 1.6, barnDoor.z - 1 + k, .22), 3200 + k * 190); } }
      // Ferne Geräusche: Hund am Hof, Eule an der Villa
      G.dogT -= dt; if (G.dogT < 0) { G.dogT = rand(30, 70); if (R.farm.vis) Audio.bark(-150, -40, Math.random() < .5); }
      G.owlT -= dt; if (G.owlT < 0) { G.owlT = rand(25, 55); if (R.villa.vis || R.allot.vis) Audio.owl(rand(-140, -110), rand(70, 90)); }
    }
  };
  // Silhouette hinter dem Kiosk-Tresen
  OW.sil = new T.Mesh(new T.PlaneGeometry(.8, 1.05), new T.MeshBasicMaterial({ map: silTex, color: 0x000000, transparent: true, opacity: .92, depthWrite: false })); OW.sil.position.set(111.4, 1.55, 27.2); OW.sil.visible = false; K.add(OW.sil);

  try { const bc = { T, K, A, F, J, R, put, fit, hit, decal, canvasTex, wbox, sm, lanternS, vlight, glow, barnDoor, barnIn, laube }; await ausbau_ost_west_bu_ost(OW, bc); await ausbau_ost_west_bu_west(OW, bc); } catch (e) { console.warn('Basis-Umsetzung Ost/West', e); }
  try { await ausbau_ost_west_f3(OW, { Q, hit, put, fit, carAt, only, vanS, shedOldS, jerryS, lanternS, candleS, toysS, hayMat, barnRect, barnDoor, J, A, F, T, canvasTex, decal, glow, vlight, sm }); } catch (e) { console.warn('Ost/West F3 (AP-15)', e); }
  OW.stats = { ms: Math.round(performance.now() - t0) };
  OW.dbg = { R, regions, barnRect, barnDoor, nestP, vbb, villaLit: !!villaLit, farmhouse };
  window.ausbau_ost_west_OW = OW; // Test-/Debug-Zugriff
  OW.on = true;
}]);
WORLD_TICK.push((dt, t, indoor) => { const OW = ausbau_ost_west_OW; if (OW.on && OW.tick) OW.tick(dt, t, indoor); if (OW.on && OW.f3) ausbau_ost_west_f3Tick(dt, t); });

// =====================================================================  Fassung 3 (AP-15): Kapitel-1-Nebenaufgaben Ost/West
// 15 „Zapfsäule 3“ (Nachtschalter: Bon, Mikes Schichtbuch, Kassette 0313; Z-02; Günthers Schuppen) · 17 „Sieben Kindersitze“ (zwei Transporter, Klopfen zählt die Klopfer,
// Lampion-Kiste, Schrottbüro mit Kalender 1992) · 19 „Die Kreise sind von unten“ (Frau Aydın am Küchenfenster Nr. 8, Dina in der Scheune, Rätsel „Laterne, Laterne“,
// „Augen zu“ gezeigt, Dinas Zeichnung, Justins Lager mit Fundamentstein, W-04, SB-01) · 20 „Da oben war es warm“ (Roxys Laube, Heft, Fisch, Brunnen, Hildes Laube, Beete, Nachbild).
function ausbau_ost_west_schalter(Q) { const OW = ausbau_ost_west_OW; kirchberg_start('ow_kasse', { x: 112, z: 20 });
  if (!Q.bon) { Q.bon = true; Audio.play('machine1', { gain: .25, rate: 2.2, dur: 1.4, x: 115.1, y: 1.1, z: 24.9, ref: 2 }); if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {}
    setTimeout(() => openNote('Ein Bon', 'Thermopapier, noch warm. Die Kasse hat ihn gedruckt, als du an den Schalter getreten bist.\n\n<span style="font-family:\'Special Elite\',monospace">TANKSTELLE KRANZ · 03:13\n1× Laterne · 0,00 €\nVielen Dank für Ihren Besuch.\nBeehren Sie uns bald wieder.</span>', 'ow_bon', () => ausbau_ost_west_zapfCheck()), 1500); return; }
  Q.book = true; Audio.paper();
  openNote('Mikes Schichtbuch', '<span class="hand">10.7. – Nix los. Opa war da mit Pfand, einunddreißig Flaschen, will Batterien dafür. Hab gesagt, wir sind keine Bank.<br>11.7. – Wieder das Licht überm Wald. Opa sagt, nachts abschließen und nicht rausgucken.<br>12.7., nachts, kurz nach drei – Kind an Säule 3. Barfuß. Hat eine Laterne. Ruft meinen Namen.</span><br><span class="hand" style="transform:rotate(-3deg)">Sie hat bis siebzehn gezählt.</span>', 'ow_schichtbuch',
    () => { subtitle('Mike ist rausgegangen.', 2400, 'LUKE'); ausbau_ost_west_zapfCheck(); }); }
function ausbau_ost_west_zapfCheck() { const Q = ausbau_ost_west_OW.Q; if (!Q) return; const z02 = typeof sammeln_hatZ === 'function' && sammeln_hatZ(2), sch = typeof post_S !== 'undefined' && post_S.steps.schuppen, pol = story.photos && story.photos.has(2);
  const n = [Q.bon, Q.book, z02, sch, pol, Q.kasse].filter(Boolean).length; kirchberg_desc('ow_kasse', `Bon, Schichtbuch, die Zeitung über der Kasse, das Polaroid an Säule 3, der Schuppen hinter der Tankstelle, die Geldkassette (Code: Leuchtschild). (${n}/6)`);
  if (n >= 6) kirchberg_fertig('ow_kasse', 'Kind an Säule 3. Barfuß. Hat eine Laterne. Mike ist rausgegangen. Die Kassette war leer – bis auf ein Foto, das es nicht geben dürfte.'); }
// ---- Brunnen (Kap. 1/2): hineinrufen, Antwort eine Sekunde zu spät
async function ausbau_ost_west_brunnen() { if (state.talking) return; kirchberg_start('ow_laternen'); const OW = ausbau_ost_west_OW; state.talking = true;
  try { const a = await kirchberg_wahl(['„Hallo?“', '„Roxy?“', '„Lucy?“']); if (a < 0) return; const x = -108, z = 35.5;
    if (a === 0) { await wait(1000); Audio.whisper(x, -.4, z, 1.4); subtitle('<i>„Hallo?“</i>', 1800, 'KINDERSTIMME'); }
    else if (a === 1) { await wait(1400); Audio.drip(x, -.6, z); subtitle('Stille. Unten ein Plätschern.', 2400); }
    else { await wait(1100); Audio.whisper(x, -.4, z, 1.2); subtitle('<i>„Luke.“</i>', 1800, 'KINDERSTIMME'); try { Audio.musicBox && Audio.musicBox(x, -.6, z); } catch (e) {} await wait(2600); await say([['Ich hab Lucy gesagt. Es hat Luke gesagt. Und drunter wieder diese Spieluhr.', 4200, 'LUKE']]); OW.brunnen = true; if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {} }
    if (a !== 2 && !OW.brunnenH) OW.brunnenH = true; story.lore.some(l => l.key === 'ow_brunnen') || (OW.brunnen && story.lore.push({ key: 'ow_brunnen', title: 'Der Brunnen', html: 'Ich hab „Lucy“ hineingerufen. Unten hat es „Luke“ gesagt. Eine Sekunde zu spät. Darunter die Spieluhr.' }));
  } finally { state.talking = false; ausbau_ost_west_warmCheck(); } }
function ausbau_ost_west_seite1() { const OW = ausbau_ost_west_OW, Q = OW.Q; if (!Q || Q.pages.has('jacke')) return; Q.pages.add('jacke'); Audio.paper();
  if (!ITEMS.ow_seiten) { ITEMS.ow_seiten = { name: 'Heftseite', desc: 'Aus einem Schulheft gerissen. Kinderschrift, mit Bleistift.' }; ICONS.ow_seiten = ICONS.paper; } addItem('ow_seiten');
  openNote('Eine Heftseite', '<span class="hand">An Mama. Das Mädchen sagt, ich darf nicht nach Hause. Wenn sie nicht hinsieht, darf ich runter in den Stall. Die Frau aus Nr. 7 stellt Brot hin. Sie sieht mich nicht.</span>', 'ow_seite1', () => { kirchberg_start('ow_heft'); kirchberg_desc('ow_heft', 'Eine Heftseite aus der Jacke der Vogelscheuche. Im Stall am Hof: ein warmer Schlafplatz.'); }); }
function ausbau_ost_west_warmDesc() { const OW = ausbau_ost_west_OW, Q = OW.Q || {}; kirchberg_desc('ow_laternen', `Roxys Laube, der Brunnen, Hildes Garten und drei Laternen am Weg (${Q.lit || 0}/3).`); }
function ausbau_ost_west_warmCheck() { const OW = ausbau_ost_west_OW, Q = OW.Q || {}; ausbau_ost_west_warmDesc(); if (OW.roxyHeft && OW.brunnen && Q.laternDone) kirchberg_fertig('ow_laternen', 'Roxy ist im Juni selbst gegangen, weil sie sich an einen warmen Ort erinnerte. Die Lampen brennen noch.'); }

async function ausbau_ost_west_f3(OW, c) {
  const T = c.T, Q = c.Q; OW.f3 = { t: 0 };
  // ================= „Sieben Kindersitze“: zweiter Transporter, Klopfen, Kiste im Kofferraum, Schrottbüro mit Kalender von 1992
  const v2 = c.carAt(c.only(c.vanS, n => n === 'Object016'), 4.9, 127.4, -20.2, .35, c.J);
  // Blender-Modelle (tiefwald.js tief_busEinbau): im ersten Transporter Innenausbau und sieben festgeschraubte Kindersitze, Heckscheibe zerschlagen (Blick hinein);
  // die Sitze erst, wenn „Sieben Kindersitze“ offen ist (vorher ist die Ladefläche abgedeckt)
  try { let t1 = null; c.J.traverse(o => { if (!t1 && o.isGroup && o.children.length === 1 && Math.abs(o.position.x - 133.2) < .01 && Math.abs(o.position.z + 25.2) < .01) t1 = o; });
    if (t1 && typeof tief_busEinbau === 'function') { tief_vanFenster(t1, true, false);
      tief_busEinbau(t1, 4.9 / 5.3, { kipp: -1, var: 'cabacba' }).then(B => { OW.f3.sitzeG = B.sitze; B.sitze.visible = !(typeof kirchberg_ab === 'function' && !kirchberg_ab('ow_transp')); }).catch(e => console.warn('Transporter innen', e)); } } catch (e) { console.warn('Transporter innen', e); }
  const bueroS = c.fit(c.shedOldS.clone(true), 2.6); c.put(bueroS, 112.6, -29.2, 0, 0, c.J);
  try { // Basis-Umsetzung: der Kalender von 1992 an der Rückwand, Juli: jeder Tag durchgestrichen bis zum 13.
    bueroS.updateMatrixWorld(true); let h = null; for (const y of [1.5, 1.25, 1.75]) { h = bu_strahl(bueroS, 112.6, y, -24.5, 0, 0, -1, 8); if (h) break; }
    const cv = document.createElement('canvas'); cv.width = 320; cv.height = 440; const x = cv.getContext('2d'); x.fillStyle = '#e4dcc4'; x.fillRect(0, 0, 320, 440); x.fillStyle = '#3a5a3a'; x.fillRect(0, 0, 320, 130); x.fillStyle = '#c8c0a8'; x.beginPath(); x.moveTo(30, 108); x.lineTo(110, 40); x.lineTo(190, 100); x.lineTo(240, 60); x.lineTo(300, 110); x.lineTo(300, 125); x.lineTo(30, 125); x.fill();
    x.fillStyle = '#6a1a14'; x.font = 'bold 34px Georgia'; x.textAlign = 'center'; x.fillText('JULI 1992', 160, 172); x.font = '15px Arial'; x.fillStyle = '#333'; ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].forEach((d, i) => x.fillText(d, 28 + i * 44, 200));
    for (let d = 1; d <= 31; d++) { const col = (d + 1) % 7, row = Math.floor((d + 1) / 7), px = 28 + col * 44, py = 232 + row * 40; x.fillStyle = col > 4 ? '#8a1a14' : '#222'; x.font = '19px Arial'; x.fillText(String(d), px, py);
      if (d <= 13) { x.strokeStyle = 'rgba(14,14,40,.85)'; x.lineWidth = 2.6; x.beginPath(); x.moveTo(px - 14, py + 6); x.lineTo(px + 14, py - 17 + Math.random() * 3); x.stroke(); x.beginPath(); x.moveTo(px - 13, py - 15); x.lineTo(px + 13, py + 5 + Math.random() * 3); x.stroke(); } }
    x.strokeStyle = 'rgba(160,20,16,.9)'; x.lineWidth = 3.4; x.beginPath(); x.ellipse(28 + ((13 + 1) % 7) * 44, 232 + Math.floor(14 / 7) * 40 - 6, 21, 17, .1, 0, 7); x.stroke();
    for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(100,80,50,${Math.random() * .08})`; x.beginPath(); x.arc(Math.random() * 320, Math.random() * 440, 4 + Math.random() * 24, 0, 7); x.fill(); }
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const m = new T.Mesh(new T.PlaneGeometry(.34, .47), new T.MeshStandardMaterial({ map: t, roughness: .9 })); const p = h ? h.p : new T.Vector3(112.6, 1.5, -30.4), n = h ? h.n : new T.Vector3(0, 0, 1);
    bu_an(m, p, n, new T.Vector3(0, 1, 0), .012); m.rotateZ(.03); m.userData.noCol = true; c.J.add(m); OW.f3.kalender = m; } catch (e) { console.warn('Basis-Umsetzung Schrottbüro-Kalender', e); }
  const owSpaeter = () => typeof kirchberg_ab === 'function' && !kirchberg_ab('ow_transp'); // H-6 (Story-Prüfung): „Sieben Kindersitze“ erst ab Kap. 3
  c.hit(2.8, 2.6, 2.4, 112.6, 1.3, -29.2, 'Schrottbüro', () => { if (owSpaeter()) return toast('Abgeschlossen. Ein Schrottbüro, Wellblech, ein Kalender hinter Glas.', 2600); kirchberg_start('ow_transp', { x: 128, z: -22 }); Audio.knock(112.6, 1.3, -29.2); OW.f3.kal = true; toast('Abgeschlossen. An der Brettwand hängt ein Kalender von 1992. Jedes Datum ist durchgestrichen – bis zum 13. Juli.', 4600); ausbau_ost_west_transpCheck(); });
  c.hit(4.8, 2, 2.4, 133.2, 1, -25.2, 'Erster Transporter', () => { if (owSpaeter()) return toast('Ein alter Transporter. Die Ladefläche ist mit einer Plane zugebunden.', 2600); kirchberg_start('ow_transp', { x: 128, z: -22 }); OW.f3.sitze = true;
    openNote('Der erste Transporter', 'Unter dem Rost an der Seite: BUNDESSTELLE FÜR RÜCKF… Das Auge halb abgekratzt.\n\nAuf der Ladefläche: sieben festgeschraubte Kindersitze mit Messingschildern. Eines ist abgekratzt bis zum Glanz, nur der Rand eines C ist geblieben.\n\nEine Kiste, der Deckel weiß überstrichen. Mit schräger Lampe liest man die Schrift darunter: <b>SEHEN · BERGEN · SCHWEIGEN</b>.', 'ow_transporter1', () => ausbau_ost_west_transpCheck()); });
  c.hit(2.2, 1.8, 1.4, 127.4 + Math.sin(.35) * 2.6, 1, -20.2 + Math.cos(.35) * 2.6, () => owSpaeter() ? 'Transporter' : OW.f3.klopfAn ? 'Klopfen' : 'Zweiter Transporter (es klopft)', () => owSpaeter() ? toast('Ein zweiter Transporter. Still.', 2200) : ausbau_ost_west_klopf());
  c.hit(1.6, 1.2, 1, 127.4 - Math.sin(.35) * 2.6, .9, -20.2 - Math.cos(.35) * 2.6, 'Kofferraum', () => owSpaeter() ? toast('Der Kofferraum klemmt.', 2000) : ausbau_ost_west_kiste());
  // ================= „Die Kreise sind von unten“: Frau Aydın (Nr. 8, Küchenfenster), Dina (Scheune), Justins Lager
  OW.f3.nr8 = { x: 46 - 3, y: 1.75, z: 17 - 4.5 - .05 };
  c.hit(1.4, 1.5, .6, OW.f3.nr8.x, 1.7, OW.f3.nr8.z - .3, () => OW.f3.aydin ? 'Frau Aydın' : 'Küchenfenster (Licht)', () => ausbau_ost_west_aydin());
  OW.f3.aydinLicht = new VLight(0xffc080, .2, 5, OW.f3.nr8.x, 1.8, OW.f3.nr8.z + .6); scene.add(OW.f3.aydinLicht);
  const R = c.barnRect, zc = (R.z0 + R.z1) / 2; OW.f3.lager = { x: R.x0 + .7, z: zc + .45 };
  // Justins Lager unter dem Heuboden: Strohmulde (unten zu Staub, oben frisch), Blechdose Rüstungsöl, Schleifstein mit daumentiefer Mulde, Laternenhaken ohne Laterne, Fundamentstein mit Turm über Abgrund
  { const L = OW.f3.lager; const mulde = new T.Mesh(new T.CircleGeometry(.9, 22), c.hayMat ? c.hayMat.clone() : c.sm('bark', 0xb8a070)); mulde.rotation.x = -PI / 2; mulde.scale.set(1, 1.4, 1); mulde.position.set(L.x + .35, .05, L.z); mulde.material.color && mulde.material.color.multiplyScalar(.8); scene.add(mulde);
    const staub = msSurfMat('grime', { alpha: true, tint: 0x6a5a40 }); staub.opacity = .7; const sd = new T.Mesh(new T.PlaneGeometry(1.4, 1.9), staub); sd.rotation.x = -PI / 2; sd.position.set(L.x + .35, .055, L.z); sd.userData.noCol = true; scene.add(sd);
    const dose = await kirchberg_mod('w_becher', 'model.glb', .13); if (dose) { dose.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.25, .23, .2); m.material.metalness = .8; m.material.roughness = .5; } }); kirchberg_setze(dose, L.x + .2, .06, L.z - .75, .4); }
    try { const r = await MSL.gl.loadAsync('assets/boulder/model.gltf'); const b = new T.Box3().setFromObject(r.scene), sz = Math.max(...b.getSize(new T.Vector3()).toArray());
      const stein = r.scene.clone(true); stein.scale.setScalar(.34 / sz); const sg = msGround(stein); sg.position.set(L.x + .95, .02, L.z - .6); sg.rotation.y = 1.1; scene.add(sg); // Schleifstein
      const fund = r.scene.clone(true); fund.scale.set(1.05 / sz, .5 / sz, .8 / sz); const fg = msGround(fund); fg.position.set(L.x - .05, -.12, L.z + .75); scene.add(fg); fg.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); OW.f3.fund = fg; } catch (e) {}
    // Turm über dem Abgrund, in den Fundamentstein geritzt (Abziehbild, nur im Streiflicht deutlich) – dasselbe Zeichen rußschwarz im Balken darüber
    const turm = kirchberg_tex(kirchberg_cnv(256, 256, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = 'rgba(30,24,18,.8)'; x.lineWidth = 7; x.lineCap = 'round'; x.beginPath(); x.moveTo(w * .38, w * .62); x.lineTo(w * .38, w * .22); x.lineTo(w * .45, w * .22); x.lineTo(w * .45, w * .16); x.lineTo(w * .52, w * .16); x.lineTo(w * .52, w * .22); x.lineTo(w * .62, w * .22); x.lineTo(w * .62, w * .62); x.stroke();
      x.beginPath(); x.moveTo(w * .12, w * .62); x.lineTo(w * .88, w * .62); x.stroke(); x.beginPath(); x.moveTo(w * .3, w * .7); x.quadraticCurveTo(w * .5, w * .95, w * .7, w * .7); x.stroke(); }));
    kirchberg_decal(turm, .36, .36, L.x - .05, .33, L.z + .38, PI, { alpha: true });
    kirchberg_decal(turm, .5, .5, R.x0 + .06, 2.6, zc + .4, PI / 2, { alpha: true, rough: .6 });
    kirchberg_hit(1.8, .9, 2.2, L.x + .3, .45, L.z, 'Ein Lager im Heu', () => ausbau_ost_west_lager()); }
  // Dina (26, Augenbinde) – versteckt im Heu, bis Luke sie im Dunkeln findet; Frau Aydın am Fenster
  OW.f3.dinaVerst = [[R.x1 - .8, R.z0 + .9], [R.x1 - .7, R.z1 - 1], [(R.x0 + R.x1) / 2 + .6, R.z1 - .7]]; OW.f3.dinaI = 0;
  OW.f3.summ = { t: 0, next: 0 };
  // ================= „Da oben war es warm“: Roxys Laube (Parzelle 5) – alle Lampen an, zur Senke gedreht; Heft, Goldfischglas; Hildes Beete; Nachbild zwischen den Beeten
  { const lx = -107.2, lz = 25, senke = Math.atan2(-100 - lx, 45 - lz);
    for (const [dx, dz, s] of [[-1.2, -1.1, .4], [1.3, -1.2, .36], [-1.3, 1.2, .42], [1.25, 1.1, .38], [0, -1.55, .34]]) { const g = c.fit(c.lanternS.clone(true), s); c.put(g, lx + dx, lz + dz, senke + rand(-.2, .2), 0, c.A);
      g.traverse(m => { if (m.isMesh && /buln|bulb/i.test(m.name + [].concat(m.material)[0].name)) { m.material = m.material.clone(); m.material.emissive = new T.Color(0xffb060); m.material.emissiveIntensity = 2.4; } }); c.glow(0xffa850, .9, lx + dx, s * .7, lz + dz, c.A); }
    OW.f3.roxyL = c.vlight(0xffb068, 2.2, 8, lx, 1.3, lz); // Petroleum, Solar, Taschenlampen – ein gemeinsamer Schein (beim Laden angelegt, konstant)
    c.hit(.9, .8, .9, lx + .6, .5, 22.55, 'Roxys Heft', () => ausbau_ost_west_roxyHeft());
    // Goldfischglas (Glas + Wasser, der Fisch als kleines Leuchtbild): „Du heißt jetzt Fisch.“
    const glas = new T.Mesh(new T.SphereGeometry(.13, 20, 14), new T.MeshStandardMaterial({ color: 0xd8e8e0, roughness: .05, metalness: 0, transparent: true, opacity: .22, depthWrite: false })); glas.position.set(lx - .6, .95, lz - .8); glas.userData.noCol = true; scene.add(glas);
    const wasser = new T.Mesh(new T.SphereGeometry(.12, 20, 10, 0, PI * 2, PI * .35, PI * .65), new T.MeshStandardMaterial({ color: 0x5a7a70, roughness: .1, transparent: true, opacity: .35, depthWrite: false })); wasser.position.copy(glas.position); wasser.userData.noCol = true; scene.add(wasser);
    const fisch = new T.Sprite(new T.SpriteMaterial({ map: kirchberg_tex(kirchberg_cnv(64, 32, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#e8781c'; x.beginPath(); x.ellipse(28, 16, 18, 8, 0, 0, 7); x.fill(); x.beginPath(); x.moveTo(44, 16); x.lineTo(60, 6); x.lineTo(60, 26); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.arc(18, 14, 2, 0, 7); x.fill(); })), transparent: true, depthWrite: false })); fisch.scale.set(.05, .025, 1); fisch.position.copy(glas.position); scene.add(fisch); OW.f3.fisch = { s: fisch, c: glas.position.clone(), a: 0, zu: 0 };
    c.hit(.4, .4, .4, lx - .6, .95, lz - .8, 'Goldfischglas', () => { OW.f3.fischGesehen = true; subtitle('Wer füttert den?', 2000, 'LUKE'); setTimeout(() => subtitle('Du heißt jetzt Fisch. Das ist wenigstens ehrlich.', 3200, 'LUKE'), 2600); kirchberg_start('ow_laternen', { x: lx, z: lz }); });
    // Hildes Beete an Parzelle 7: Kinderportionen, Namensstöcke ZAYN, ROXY, MIKE; das Beet LUCY frisch gegossen
    const px = -119.6, pz = 38.2; const beet = boden_weichMat(c.sm('../forestfloor', 0x3e3226), .5); for (let i = 0; i < 4; i++) { const bg = boden_weich(new T.PlaneGeometry(.8, 2.2), .8, 2.2), b = new T.Mesh(bg, beet); b.rotation.x = -PI / 2; b.position.set(px + i * 1.05, .024, pz); b.userData.noCol = true; scene.add(b); // Erde, Ränder fransen aus (kein hartes Quadrat)
      const n = ['ZAYN', 'ROXY', 'MIKE', 'LUCY'][i]; const st = kirchberg_decal(kirchberg_papier({ w: 128, h: 48, bg: '#c8b890', zeilen: [[n, 10, 36, 30, '#1a1a1a', '"Caveat", cursive', 0]] }), .16, .06, px + i * 1.05, .3, pz + 1.12, 0); }
    try { const parts = await msBake('w_clover', 'model.glb'); if (parts.length) { const bb = new T.Box3(); for (const q of parts) { q.geo.computeBoundingBox(); bb.union(q.geo.boundingBox); } const sz = bb.getSize(new T.Vector3()), k0 = .3 / Math.max(sz.x, sz.z), M4 = []; // Gemüse in zwei Reihen je Beet (Kohlrabi/Möhrengrün): echtes Pflanzenmodell, klein und unregelmäßig
      for (let i = 0; i < 4; i++) for (let r = 0; r < 2; r++) for (let j = 0; j < 7; j++) if (Math.random() > .12) M4.push(msM4(px + i * 1.05 + (r ? .17 : -.17) + (Math.random() - .5) * .08, .02 - bb.min.y * k0, pz - .95 + j * .32 + (Math.random() - .5) * .1, Math.random() * 6.28, k0 * (.7 + Math.random() * .7)));
      msInst(parts, M4, { shadow: false }).forEach(im => { im.userData.noCol = true; scene.add(im); }); } } catch (e) { console.warn('Beetpflanzen', e); }
    { const n = kirchberg_decal(kirchberg_tex(kirchberg_cnv(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 4, 32, 32, 32); g.addColorStop(0, 'rgba(20,14,8,.55)'); g.addColorStop(1, 'rgba(20,14,8,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); })), .8, 2, px + 3.15, .03, pz, 0, { rx: -PI / 2, alpha: true }); } // nass
    c.hit(4.2, .6, 2.4, px + 1.6, .3, pz, 'Hildes Beete', () => { toast('Möhren, Kohlrabi, Radieschen – in Kinderportionen. Namensstöcke: ZAYN, ROXY, MIKE. Das Beet LUCY ist frisch gegossen.', 5000); setTimeout(() => subtitle('Gemüse für Kinder, die nicht mehr zum Essen kommen.', 3200, 'LUKE'), 2400); OW.f3.beete = true; kirchberg_start('ow_laternen'); });
    // Nachbild zwischen den Beeten (ersetzt die Figur aus schrecken.js „garten“): Juni, warm, Grillen – Roxy dreht Lampen zur Senke
    if (typeof addEcho === 'function' && typeof E_ === 'function') OW.f3.echo = addEcho({ id: 'echo_roxy_juni', at: [-114.2, 1.1, 29.2], title: 'Nachbild · Schrebergärten, Juni 2026', figs: [E_(-113.6, 28.6, -2.2, 1)],
      lines: [['Juni, warm, Grillen. Eine junge Frau mit schwarzen Haaren dreht Lampen zur Senke, eine nach der anderen.', 5200], ['„Gleich. Ich hab nur noch den Fisch.“', 2800, 'ROXY'], ['Sie lacht und geht los, zur Straße, ohne Schuhe.', 3600], ['Regen. Die Lampen brennen noch.', 3000]] });
  }
}
async function ausbau_ost_west_klopf() { const OW = ausbau_ost_west_OW, K = OW.f3; kirchberg_start('ow_transp', { x: 128, z: -22 }); if (state.talking) return;
  const vp = [127.4 + Math.sin(.35) * 2.6, 1, -20.2 + Math.cos(.35) * 2.6]; Audio.play('metalHit2', { gain: .35, rate: 1.1, x: vp[0], y: 1, z: vp[2], ref: 2 }); K.klopfN = (K.klopfN || 0) + 1; K.klopfT = 1.4; K.klopfAn = true; }
function ausbau_ost_west_antwort(n) { const OW = ausbau_ost_west_OW, K = OW.f3, vp = [127.4 - Math.sin(.35) * 2.6, 1, -20.2 - Math.cos(.35) * 2.6];
  if (n >= 3) K.m3 = true; if (n === 2) K.m2 = true;
  if (n <= 1) { subtitle('Stille.', 1600); if (K.m3 && K.m2 && !K.kichern) { K.kichern = true; setTimeout(() => { Audio.giggle(133.2, 1, -25.2); if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {} setTimeout(() => subtitle('Tontechniker-Regel eins: Wenn du ein Geräusch nicht erklären kannst, hast du das Mikro falsch gestellt. Regel zwei: Es gibt kein Mikro.', 6000, 'LUKE'), 2400); }, 1600); } return; }
  for (let i = 0; i < n; i++) setTimeout(() => Audio.play('woodHit2', { gain: .28, rate: .85, x: vp[0], y: .8, z: vp[2], ref: 2 }), 300 + i * 340); }
function ausbau_ost_west_kiste() { const OW = ausbau_ost_west_OW, K = OW.f3; kirchberg_start('ow_transp'); if (!K.hebel) { K.hebel = true; Audio.play('metalHit1', { gain: .3, rate: 1.4, x: 127.4 - Math.sin(.35) * 2.6, y: .9, z: -20.2 - Math.cos(.35) * 2.6, ref: 2 }); return toast('Der Hebel klemmt.', 1800); }
  K.kiste = true; Audio.play('metalOpen', { gain: .35, rate: 1.1, x: 127.4 - Math.sin(.35) * 2.6, y: .9, z: -20.2 - Math.cos(.35) * 2.6, ref: 2 });
  openNote('Kiste im Kofferraum', 'Stempel: <b>EINGEZOGEN · SOMMERFEST 2009 · 7 STK.</b>, darunter das Auge.\n\nSieben gefaltete Papierlampions mit Namenszetteln: ROXY, HEIDI, MIKE, DINA, LUCY, LUKE, ZAYN.\nObenauf ein achter, ungefaltet, ohne Zettel. Das Papier ist warm.', 'ow_lampions',
    () => { subtitle('Die haben die Lampions eingesammelt. Wie Beweisstücke.', 3200, 'LUKE'); ausbau_ost_west_transpCheck(); }); }
function ausbau_ost_west_transpCheck() { const K = ausbau_ost_west_OW.f3; const n = [K.sitze, K.kiste, K.kal, K.m3 || K.m2].filter(Boolean).length; kirchberg_desc('ow_transp', `Zwei Transporter, das Klopfen, eine Kiste, das Schrottbüro. (${n}/4)`);
  if (n >= 4) kirchberg_fertig('ow_transp', 'Sieben Sitze, sieben Kinder, 2009. Sechs kamen zurück. SEHEN · BERGEN · SCHWEIGEN.'); }
// ---- Frau Aydın (Nr. 8): Päckchen in Alufolie für Dina
async function ausbau_ost_west_aydin() { const OW = ausbau_ost_west_OW, K = OW.f3; if (state.talking || kap() !== 1) return; state.talking = true; K.fensterAuf = true; const A = 'FRAU AYDIN';
  try { if (!K.aydin) { K.aydin = true; kirchberg_start('ow_kreise', { x: 46, z: 10 });
      await say([['„Luke! Lucys Luke! Komm her, du bist dünn.“', 3000, A], ['„Sie ist aus der Klinik weg, oğlum. Sie sagt, sie macht die Augen zu, bis es vorbei ist. Sie ist in der Scheune.“', 5600, A], ['„Das hier ist für sie. Sie isst nichts, was nicht in Alufolie ist.“', 3800, A]]);
      const a = await kirchberg_wahl(['„Was soll ich ihr sagen?“', '„Warum Alufolie?“']);
      if (a === 0) await say([['„Sag nicht ‚wie geht’s‘. Sag, was du siehst. Sie kann nicht sehen, aber sie will wissen.“', 4800, A]]); else await say([['„Vegas hat auch Alufolie. Der isst sie nicht, der klebt sie an die Tür. Jeder ist irgendwie verrückt hier, ja?“', 5200, A]]);
      modItem('alupaeckchen', 'Päckchen in Alufolie', 'Für Dina. Warm. „Die Alufolie bringst du zurück, die ist von meiner Mutter.“', 'paper'); addItem('alupaeckchen');
      await say([['„Die Alufolie bringst du zurück, die ist von meiner Mutter.“', 3200, A]]); kirchberg_desc('ow_kreise', 'Frau Aydın: Dina ist in der Scheune am Hof. Das Päckchen ist für sie.'); }
    else if (K.zeichnung && !K.folieZurueck) { K.folieZurueck = true; story.items = story.items.filter(k => k !== 'alufolie');
      await say([['„Du hast als Kind bei uns die Fensterbank vollgeschmiert. Mit Kreide. Kreise. Dina hat es dir beigebracht. Oder du ihr.“', 5800, A]]); ausbau_ost_west_kreiseCheck(); }
    else await say([['„Geh zu ihr. Sie ist in der Scheune. Und sag, was du siehst.“', 3200, A]]);
  } finally { state.talking = false; setTimeout(() => { K.fensterAuf = false; }, 1500); } }
// ---- Dina in der Scheune: Rätsel „Laterne, Laterne“ (Lampe aus, dem Summen folgen), dann Päckchen, Augen zu (gezeigt), Zeichnung
function ausbau_ost_west_inScheune() { const R = ausbau_ost_west_OW.dbg && ausbau_ost_west_OW.dbg.barnRect, P = player.pos; return R && P.x > R.x0 && P.x < R.x1 && P.z > R.z0 && P.z < R.z1; }
function ausbau_ost_west_summen(x, z, laut) { const A = Audio; if (!A.ctx) return; const d = A.at(x, .9, z, 3); const noten = [392, 392, 392, 330, 294, 294, 294, 262, 330, 392, 440, 392]; // „Laterne, Laterne, Sonne, Mond und Sterne“ (gesummt)
  noten.forEach((f, i) => { const o = A.osc('triangle', f * .5, i * .38, .42); A.env(o, .05 * laut, .08, .34, i * .38, d); const o2 = A.osc('sine', f, i * .38, .42); A.env(o2, .025 * laut, .08, .34, i * .38, d); try { A.lfo(5, 3, o.frequency); } catch (e) {} }); }
async function ausbau_ost_west_dinaFund() { const OW = ausbau_ost_west_OW, K = OW.f3; if (K.dinaGefunden || state.talking) return; K.dinaGefunden = true; state.talking = true; const D = 'DINA';
  try { subtitle('„Hier. Du Trampel.“', 2200, D); await wait(2300); if (K.dina) { const [x, z] = OW.f3.dinaVerst[OW.f3.dinaI]; K.dina.g.position.set(x, 0, z); K.dina.g.visible = true; }
    story.items = story.items.filter(k => k !== 'alupaeckchen'); modItem('alufolie', 'Alufolie', 'Von Frau Aydıns Mutter. Zurückbringen.', 'paper'); addItem('alufolie');
    const fr = [['„Heu. Viel Heu.“', '„Heu. Gut.“'], ['„Ein Balken mit einem Raben.“', '„Der ist oft da.“'], ['„Du. Mit Augenbinde.“', '„Weiß ich.“']];
    for (let r = 0; r < 3; r++) { const opts = [fr[r][0], ['„Wie geht’s dir?“', '„Nichts. Es ist dunkel.“', '„Ich weiß nicht.“'][r]]; const a = await kirchberg_wahl(r % 2 ? opts.reverse() : opts); const ok = (r % 2 ? 1 : 0) === a;
      await say([[ok ? fr[r][1] : '„Sag, was du siehst.“', 1800, D]]); if (!ok) r--; }
    // „Augen zu“ – gezeigt, keine Taste (02 H1): kalte Hand, Schwarzbild, nackte Füße, Atem
    await say([['„Zu.“', 1200, D]]); await fade(1, 250); Audio.play('rain1', { gain: .15, dur: 6 }); await wait(1400);
    for (let i = 0; i < 6; i++) { const P = player.pos; setTimeout(() => Audio.stepAt(P.x - 3 + i * .45, P.z + .6, .14), i * 520); } await wait(3400); Audio.whisper(player.pos.x + .3, 1.3, player.pos.z + .3, 1.6); await wait(1800);
    for (let i = 0; i < 4; i++) setTimeout(() => Audio.stepAt(player.pos.x + 1 + i * .6, player.pos.z + 1.4 + i * .5, .12), i * 480); await wait(2400); await fade(0, 700);
    await say([['„Augen zu. Dann siehst du nichts. Dann sieht sie nichts. Fair.“', 3800, D], ['Wer war das?', 1600, 'LUKE'], ['„Nicht sie. Der Junge. Kommt, wenn keiner guckt.“', 3200, D], ['„Den Eisernen sieht sie nie. Der schläft da hinten. Manchmal.“', 3600, D]]);
    openNote('Dinas Zeichnung', 'Wachsmalkreide auf Packpapier: Sieben Kreise, in jedem eine kleine Flamme, jeder mit einem Strich nach oben wie ein Stiel. Vier sind durchgestrichen, jeder anders: dünn, dick, doppelt, zittrig. Keine Straße, keine Häuser.', 'ow_dina_zeichnung',
      async () => { await say([['„Die Kreise sind von unten.“', 2200, D], ['Sieht aus wie Spiegeleier am Stiel.', 2400, 'LUKE']]); await wait(1000); await say([['„Du auch.“', 1400, D]]); await wait(700);
        await say([['„Ich hab die Transporter gesehen. Sieben Sitze. Ich zähl nicht gern. Ich hab trotzdem gezählt.“', 4600, D]]); K.zeichnung = true; if (!ITEMS.dina_zeichnung) modItem('dina_zeichnung', 'Dinas Zeichnung', 'Sieben Kreise mit Flamme und Stiel. Vier durchgestrichen.', 'paper'); addItem('dina_zeichnung'); ausbau_ost_west_kreiseCheck(); });
  } finally { state.talking = false; } }
function ausbau_ost_west_lager() { const OW = ausbau_ost_west_OW, K = OW.f3; kirchberg_start('ow_kreise'); K.lager = true;
  openNote('Ein Lager im Heu', 'Unter dem Heuboden eine Strohmulde, unten zu Staub zerfallen, oben frisch. Eine Blechdose Rüstungsöl, ranzig. Ein Schleifstein mit einer daumentiefen Mulde. Ein Laternenhaken ohne Laterne.\n\nIm Heu ein Fundamentstein. Darauf, eingeritzt: ein Turm über einem Abgrund.', 'ow_justinlager',
    () => { subtitle('Jemand, der ein Schwert schärft. In Dinas Scheune. Ich frag Frau Aydın lieber nicht.', 4200, 'LUKE'); ausbau_ost_west_kreiseCheck(); }); }
function ausbau_ost_west_kreiseCheck() { const K = ausbau_ost_west_OW.f3, sb = typeof sammeln_hatSB === 'function' && sammeln_hatSB(1); kirchberg_desc('ow_kreise', `Dina finden, ihr sagen, was du siehst, das Lager unter dem Heuboden, die Alufolie zurück. ${sb ? '' : '(Da liegt noch ein Blatt.)'}`);
  if (K.zeichnung && K.lager && K.folieZurueck && sb) kirchberg_fertig('ow_kreise', 'Jemand in Eisen schläft seit langem auf diesem Hof, und der Rabe gehört zu seinem Zeichen. Die Kreise sind von unten.'); }
async function ausbau_ost_west_roxyHeft() { const OW = ausbau_ost_west_OW; kirchberg_start('ow_laternen', { x: -107, z: 25 }); OW.roxyHeft = true;
  const s = ['Die Lampen sind für sie. Damit sie weiß, dass ich komme. Ich lass sie an, auch wenn Lars meckert.', 'Seit Mama im Heim ist, ist es im Haus so kalt. Heizung auf fünf und trotzdem kalt. Da oben war es warm. Ich weiß das noch. Sonst weiß ich fast nichts mehr, aber das weiß ich.', 'Wenn ich gehe, mach ich Licht. Richtig Licht. Damit sie mich findet und nicht die anderen.', '<i>(andere Tinte)</i> Fisch füttern!!! Wie heißt der noch.'];
  openNote('Roxys Heft', s.map(t => `<span class="hand">${t}</span>`).join('<br><br>'), 'ow_roxy_heft', () => { subtitle('Roxy hat ihr eigenes Haus angezündet.', 3000, 'LUKE'); if (!story.lore.some(l => l.key === 'ow_roxy')) story.lore.push({ key: 'ow_roxy', title: 'Roxy', html: 'Roxy ist im Juni selbst gegangen, weil sie sich an einen warmen Ort erinnerte. Die Lampen in ihrer Laube brennen noch, alle zur Senke gedreht.' }); ausbau_ost_west_warmCheck(); }); }
async function ausbau_ost_west_figuren() { const OW = ausbau_ost_west_OW, K = OW.f3; if (K.figTry || typeof lwo_neueFigur !== 'function' || typeof LWO === 'undefined' || !LWO.ready) return; K.figTry = true;
  const A = await kirchberg_figur('aydin', { id: 'aydin', speed: .8, stride: 1 }); if (A) { kirchberg_clip(A, A.acts.window_lean ? 'window_lean' : 'idle'); const W = K.nr8; A.g.position.set(W.x, .14, W.z + .34); A.g.rotation.y = PI; /* 08.10.: Foto 4 (nur Kopf im Fenster): Figur stand zu tief, Schultern lagen hinter der Fensterbank – 22 cm höher, 4 cm weiter ins Haus */ A.g.visible = false; lwo_blick(A, 'luke'); K.aydinF = A; }
  const D = await kirchberg_figur('dina_erw', { id: 'dina_erw', speed: .6, stride: .9 }); if (D) { D.g.visible = false; K.dina = D; lwo_blick(D, null); // Augenbinde: dunkles Stoffband um den Kopf (Stoff-Scan)
    if (D.head) { const m = new THREE.MeshStandardMaterial({ map: msTex('wallpaper_fabric/b.jpg', true), color: 0x2a2224, roughness: 1, side: THREE.DoubleSide }); const band = new THREE.Mesh(new THREE.CylinderGeometry(.095, .098, .045, 20, 1, true), m); const s = 1 / (D.head.getWorldScale(new THREE.Vector3()).x || 1); band.scale.setScalar(s); band.position.set(0, .085 * s, .01 * s); band.userData.noCol = true; D.head.add(band); } } }
function ausbau_ost_west_f3Tick(dt, t) { const OW = ausbau_ost_west_OW, K = OW.f3; if (!K) return; K.t += dt;
  if (!K.figTry && typeof LWO !== 'undefined' && LWO.ready) ausbau_ost_west_figuren();
  if (!K.sb01 && typeof sammeln_S !== 'undefined' && sammeln_S.orte && sammeln_S.orte['SB-01'] && typeof sammeln_platz === 'function') { K.sb01 = true; const L = K.lager; sammeln_platz('SB-01', { x: L.x + .2, y: .09, z: L.z - .62, label: 'Unter der Öldose · ein Blatt' }); } // AP-11: SB-01 zu Justins Lager
  // Frau Aydın: am Fenster, solange Luke nah ist (Kap. 1), Fensterlicht weich
  if (K.aydinF) { const d = Math.hypot(player.pos.x - K.nr8.x, player.pos.z - K.nr8.z), an = kap() === 1 && (K.fensterAuf || d < 7) && !state.inBasement; if (K.aydinF.g.visible !== an) K.aydinF.g.visible = an; }
  if (K.aydinLicht) K.aydinLicht.intensity += (((K.fensterAuf || K.aydinF && K.aydinF.g.visible) ? 1.1 : .2) - K.aydinLicht.intensity) * Math.min(1, dt * 2);
  // Klopf-Antwort nach der Pause
  if (K.sitzeG) { const an = !(typeof kirchberg_ab === 'function' && !kirchberg_ab('ow_transp')); if (K.sitzeG.visible !== an) K.sitzeG.visible = an; } // Kindersitze im ersten Transporter ab „Sieben Kindersitze“
  if (K.klopfT > 0) { K.klopfT -= dt; if (K.klopfT <= 0) { const n = K.klopfN; K.klopfN = 0; ausbau_ost_west_antwort(n); ausbau_ost_west_transpCheck(); } }
  // Goldfisch schwimmt zur Glaswand, wenn Luke kommt
  if (K.fisch) { const F = K.fisch, d = Math.hypot(player.pos.x - F.c.x, player.pos.z - F.c.z); F.a += dt * (d < 2.5 ? .4 : 1.1); const r = d < 2.5 ? .02 : .07; F.s.position.set(F.c.x + Math.cos(F.a) * r, F.c.y - .01 + Math.sin(t * 1.3) * .015, F.c.z + Math.sin(F.a) * r); }
  // Dina: Rätsel „Laterne, Laterne“ – nur Kap. 1, nach Frau Aydın; mit Lampe flieht sie ins Heu, ohne Lampe summt sie (räumlich, lauter beim Näherkommen)
  if (kap() === 1 && K.aydin && !K.dinaGefunden && ausbau_ost_west_inScheune() && !state.talking) { const S = K.summ; S.t += dt; const [x, z] = K.dinaVerst[K.dinaI], d = Math.hypot(player.pos.x - x, player.pos.z - z);
    if (!S.start) { S.start = true; S.t = 0; kirchberg_desc('ow_kreise', 'Dina ist in der Scheune. Irgendwo im Heu.'); }
    if (flashOn) { if (d < 6 && !S.floh) { S.floh = true; Audio.play('stones1', { gain: .05, rate: 3.2, dur: .4, x, y: .3, z, ref: 2 }); K.dinaI = (K.dinaI + 1) % K.dinaVerst.length; } }
    else { S.floh = false; if ((S.next -= dt) < 0) { S.next = 5.2; ausbau_ost_west_summen(x, z, 1); } if (d < 1.3) ausbau_ost_west_dinaFund(); }
    const h = S.t > 110 ? 5 : S.t > 90 ? 4 : S.t > 75 ? 3 : S.t > 60 ? 2 : S.t > 30 ? 1 : 0; if (h > (S.hilfe || 0)) { S.hilfe = h;
      if (h === 1) subtitle('Mit Lampe rennt sie weg.', 2600, 'LUKE'); else if (h === 2) subtitle('Ohne Lampe summt sie. Hört man, woher?', 3000, 'LUKE'); else if (h === 3) { const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw); subtitle((((x - player.pos.x) * rx + (z - player.pos.z) * rz) > 0 ? 'Rechts von mir. ' : 'Links von mir. ') + (d < 4 ? 'Nah.' : 'Noch ein Stück.'), 2400, 'LUKE'); } else if (h === 4) subtitle('„' + (d < 3 ? 'Wärmer.' : 'Kalt.') + '“', 1600, 'DINA'); else if (h === 5) ausbau_ost_west_dinaFund(); } /* QA K1/2: Stufe 3 wurde nie vergeben; Stufe 5 sprach „Hier. Du Trampel.“ doppelt (dinaFund spricht es selbst) */ }
  if (K.dina && K.dina.g.visible && (kap() !== 1 || !ausbau_ost_west_inScheune() && Math.hypot(player.pos.x - K.dina.g.position.x, player.pos.z - K.dina.g.position.z) > 25)) { /* bleibt in der Scheune sitzen */ }
}
// AP-25 · „Das Heft im Heu“ (Kap. 1/3/5): gefundene Seiten und Heft-Stand speichern – sonst fehlen die Kap.-1-/3-Seiten in Kap. 5 und der Faden beginnt nach dem Laden neu
MOD_SAVE.push(['ow_heft', () => { const Q = ausbau_ost_west_OW.Q; return Q ? { pages: [...Q.pages], seen: !!Q.heftSeen, done: !!Q.heftDone, jacke: !!Q.jacket } : null; },
  v => { const Q = ausbau_ost_west_OW.Q; if (!v || !Q) return; (v.pages || []).forEach(p => Q.pages.add(p)); Q.heftSeen = !!v.seen; Q.heftDone = !!v.done; Q.jacket = !!v.jacke; }]);

// =====================================================================  Basis-Umsetzung „Text gegen Welt“ – Ost (Tankstelle, Sperre, Schrottplatz) · docs/gameplay/abgleich/basis_umsetzung.md
// Was die Texte der Orte behaupten, ist sichtbar: Geldkassette, acht Pappbecher, Handabdrücke am Fenster, „Komme gleich wieder“, Bolzen + Kreidestriche, Reifenzählung, Verkehrsschild
async function ausbau_ost_west_bu_ost(OW, c) {
  try { await document.fonts.load('40px Caveat'); } catch (e) {}
  const T = c.T, V3 = T.Vector3, K = c.K, UPZ = new V3(0, 0, 1), UP = new V3(0, 1, 0), R2 = ausbau_nord_rng(2009);
  const mk = (fn, label) => { try { return fn(); } catch (e) { console.warn('Basis-Umsetzung Ost: ' + label, e); return null; } };
  // ---- Acht Pappbecher auf dem Tresen (einer umgefallen); der neunte kommt, wenn im Kiosk das Licht wieder angeht
  mk(() => {
    const counter = K.children.find(o => Math.abs(o.position.x - 110.3) < .01 && Math.abs(o.position.z - 26) < .01), th = counter ? bu_strahl(counter, 111.2, 1.8, 26, 0, -1, 0, 2) : null, ty = th ? th.p.y : .93;
    const prof = [[0, 0], [.026, 0], [.0375, .095], [.0394, .0985], [.0385, .1008], [.0364, .0975], [.0262, .004], [0, .004]], geo = new T.LatheGeometry(prof.map(([r, y]) => new V3(r, y, 0)), 28);
    const tx = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#e9e5d9'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#a82a22'; x.fillRect(0, 128 * (1 - .40), 256, 14); x.fillRect(0, 128 * (1 - .17), 256, 6);
      x.fillStyle = '#6a3a1c'; for (let i = 0; i < 4; i++) x.fillRect(i * 64 + 22, 128 * (1 - .34) + 6, 20, 14); x.fillStyle = 'rgba(80,60,40,.25)'; x.fillRect(0, 70, 256, 58); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; })();
    const mat = new T.MeshStandardMaterial({ map: tx, roughness: .8, side: T.DoubleSide }), cups = new T.Group();
    for (let i = 0; i < 8; i++) { const m = new T.Mesh(geo, mat), x = 109.78 + i * .26 + (R2() - .5) * .05, z = 25.96 + Math.sin(i * 2.3) * .13;
      if (i === 4) { m.rotation.set(0, R2() * 6, PI / 2 + .12); m.position.set(x, ty + .039, z); } else { m.position.set(x, ty, z); m.rotation.y = R2() * 6; }
      m.castShadow = true; m.userData.noCol = true; cups.add(m); }
    const neu = new T.Mesh(geo, mat); neu.position.set(110.62, ty, 26.38); neu.rotation.y = 1.3; neu.visible = false; neu.userData.noCol = true; neu.castShadow = true; cups.add(neu); OW.becherNeu = neu; K.add(cups); OW.becher = cups; }, 'Becher');
  // ---- Handabdrücke im Staub am Schaufenster (von innen, Kinderhöhe)
  mk(() => {
    const W = 2048, H = 656, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'), rr = (a, b) => a + R2() * (b - a);
    x.fillStyle = 'rgba(150,146,132,.20)'; x.fillRect(0, 0, W, H); for (let i = 0; i < 260; i++) { const px = rr(0, W), py = rr(0, H), r = rr(20, 140), g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(150,144,128,${rr(.03, .1)})`); g.addColorStop(1, 'rgba(150,144,128,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); }
    x.globalCompositeOperation = 'destination-out'; const hand = (px, py, rot, s, mir) => { if (typeof ECHT !== 'undefined' && ECHT.img.handblut) { x.save(); x.translate(px, py); x.filter = 'blur(1.2px)'; echt_hand(x, 0, -4, 80 * s, '#000', .85, rot, mir, 'blut'); x.restore(); return; } x.save(); x.translate(px, py); x.rotate(rot); x.scale(mir ? -s : s, s); x.filter = 'blur(1.2px)'; x.fillStyle = 'rgba(0,0,0,.85)'; x.beginPath(); x.ellipse(0, 12, 17, 20, 0, 0, 7); x.fill();
      [[-14, -14, 4.6, 14, -.28], [-5, -22, 4.8, 17, -.08], [5, -23, 4.8, 18, .05], [14, -17, 4.4, 15, .24]].forEach(([fx, fy, rx, ry, a]) => { x.beginPath(); x.ellipse(fx, fy, rx, ry, a, 0, 7); x.fill(); }); x.beginPath(); x.ellipse(-19, 10, 5, 12, -.9, 0, 7); x.fill(); x.restore(); };
    for (const [px, py, rot, s] of [[640, 560, .1, 1.5], [720, 520, -.15, 1.45], [676, 440, .05, 1.4], [1450, 575, -.1, 1.5], [1530, 500, .2, 1.5], [1488, 400, 0, 1.4], [980, 590, .3, 1.35]]) hand(px, py, rot, s, px > 1000);
    x.lineWidth = 16; x.lineCap = 'round'; x.strokeStyle = 'rgba(0,0,0,.35)'; for (const [x0, y0, x1, y1] of [[600, 610, 640, 470], [1440, 620, 1470, 470], [940, 600, 1010, 520]]) { x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); }
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const d = c.decal(t, 5, 1.6, 109.9, 1.75, 25.03, PI, 0, { p: K, mat: { roughness: .95 } }); d.renderOrder = 0; d.userData.noCol = true; }, 'Handabdrücke');
  // ---- Geldkassette auf dem Brett des Nachtschalters (Blech, Tragegriff, Zahlenschloss mit vier Rädchen, „P. K.“ im Deckel)
  mk(() => {
    const g = new T.Group(), by = 1.055, cx = 115.38, cz = 24.8, steel = new T.MeshStandardMaterial({ color: 0x8a8a84, roughness: .45, metalness: .8 });
    const body = c.wbox('rust_sheet', .27, .1, .19, cx, by + .05, cz, { tint: 0x4d5f52, tile: .5, p: K }), lid = c.wbox('rust_sheet', .276, .042, .196, cx, by + .121, cz, { tint: 0x435447, tile: .5, p: K });
    const seam = new T.Mesh(new T.BoxGeometry(.274, .004, .194), new T.MeshStandardMaterial({ color: 0x1c1f1c, roughness: .8 })); seam.position.set(cx, by + .1, cz); K.add(seam);
    const arch = new T.Mesh(new T.TorusGeometry(.04, .0042, 6, 16, PI), steel); arch.position.set(cx, by + .142, cz); arch.scale.set(1, .8, 1); K.add(arch);
    for (const s of [-1, 1]) { const h = new T.Mesh(new T.BoxGeometry(.03, .022, .008), steel); h.position.set(cx + s * .085, by + .1, cz + .098); K.add(h); }
    const lt = (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const x = cv.getContext('2d'); x.fillStyle = '#6c6c66'; x.fillRect(0, 0, 256, 96); x.strokeStyle = '#2a2a28'; x.lineWidth = 5; x.strokeRect(3, 3, 250, 90); const dg = ['7', '2', '5', '1'];
      for (let i = 0; i < 4; i++) { x.fillStyle = '#121212'; x.fillRect(16 + i * 58, 14, 50, 68); x.fillStyle = '#d8d4c4'; x.font = 'bold 44px Arial'; x.textAlign = 'center'; x.fillText(dg[i], 41 + i * 58, 62); x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(16 + i * 58, 14, 50, 12); for (let k = 0; k < 8; k++) { x.fillStyle = 'rgba(0,0,0,.45)'; x.fillRect(16 + i * 58, 18 + k * 8, 3, 3); } }
      const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; })();
    const lock = new T.Mesh(new T.PlaneGeometry(.1, .0375), new T.MeshStandardMaterial({ map: lt, roughness: .5, metalness: .6 })); lock.rotation.y = PI; lock.position.set(cx, by + .06, cz - .0975); K.add(lock);
    const pk = bu_ritz(.1, .05, (C, B, W, H) => { const sz = H * .62, w = ritz_breite('P. K.', sz); ritz_zeile(C, B, 'P. K.', (W - w) / 2, H * .78, sz, { stil: 'ritz', jit: 1.2 }); }, { ppm: 800, seed: 17, bump: 3 });
    bu_an(pk, new V3(cx - .03, by + .1425, cz - .03), UP, UPZ, .0006); K.add(pk);
    g.add(body, lid); OW.kassette = { body, lid }; }, 'Kassette');
  // ---- Schild „Komme gleich wieder.“ an der Ladentür (Pappe, Faden, Staub fingerdick)
  mk(() => {
    const door = K.children.find(o => Math.abs(o.position.x - 113.35) < .02 && Math.abs(o.position.z - 25.02) < .02), h = door ? bu_strahl(door, 113.35, 1.55, 22.5, 0, 0, 1, 4) : null, p = h ? h.p : new V3(113.35, 1.55, 24.98), n = h ? h.n : new V3(0, 0, -1);
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 340; const x = cv.getContext('2d'); x.fillStyle = '#b8a888'; x.fillRect(0, 0, 512, 340); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${90 + R2() * 40},${70 + R2() * 30},40,${R2() * .12})`; x.fillRect(R2() * 512, R2() * 340, 2 + R2() * 20, 1 + R2() * 3); }
    x.strokeStyle = 'rgba(40,30,20,.5)'; x.lineWidth = 6; x.strokeRect(14, 14, 484, 312); x.fillStyle = '#1a1814'; x.font = 'bold 74px Caveat, cursive'; x.textAlign = 'center'; x.fillText('Komme gleich', 256, 110); x.fillText('wieder.', 256, 190);
    x.beginPath(); x.arc(256, 262, 44, 0, 7); x.fillStyle = '#e8e2d0'; x.fill(); x.strokeStyle = '#1a1814'; x.lineWidth = 4; x.stroke(); x.beginPath(); x.moveTo(256, 262); x.lineTo(256, 232); x.moveTo(256, 262); x.lineTo(276, 270); x.stroke(); // Uhr zum Verstellen
    const dust = x.getImageData(0, 0, 512, 340); x.globalAlpha = 1; for (let i = 0; i < 700; i++) { const px = R2() * 512, py = R2() * 340, r = 10 + R2() * 46, g = x.createRadialGradient(px, py, 0, px, py, r), top = 1 - py / 340; g.addColorStop(0, `rgba(138,132,120,${(.12 + .3 * top) * R2()})`); g.addColorStop(1, 'rgba(138,132,120,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); }
    x.fillStyle = 'rgba(140,134,122,.75)'; x.fillRect(8, 0, 496, 20); void dust;           // Staubkante oben
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const m = new T.Mesh(new T.PlaneGeometry(.26, .172), new T.MeshStandardMaterial({ map: t, roughness: .95 }));
    bu_an(m, p.clone().add(new V3(0, -.0, 0)), n, UP, .012); m.rotateZ(.04); m.position.y = 1.55; m.userData.noCol = true; K.add(m); const st = new T.Mesh(new T.BoxGeometry(.003, .09, .003), new T.MeshStandardMaterial({ color: 0x2a2620 })); st.position.copy(m.position).add(new V3(0, .126, 0)); st.position.addScaledVector(n, -.004); K.add(st); OW.ladenSchild = m; }, 'Schild');
  // ---- Zapfinseln: vier abgeschnittene Bolzen am Sockel der Zapfsäule, daneben acht Kreidestriche
  mk(() => {
    const rust = new T.MeshStandardMaterial({ color: 0x9a7452, roughness: .6, metalness: .6, emissive: 0x1a0e06 }), geos = [], grime = msSurfMat('grime', { alpha: true, tint: 0x14110e });
    for (const ix of [107, 115]) { const bx = ix, bz = 13.9, y0 = .22;
      for (const [dx, dz] of [[-.14, -.09], [.14, -.09], [-.14, .09], [.14, .09]]) { const w = new T.CylinderGeometry(.04, .04, .006, 14).translate(dx, y0 + .003, dz), nt = new T.CylinderGeometry(.03, .03, .024, 6).translate(dx, y0 + .018, dz), st = new T.CylinderGeometry(.017, .018, .06, 8).translate(dx, y0 + .06, dz); geos.push(w, nt, st); }
      const fp = new T.Mesh(new T.PlaneGeometry(.56, .34), new T.MeshStandardMaterial({ map: grime.map, color: 0x0e0c0a, transparent: true, opacity: .55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: .6 })); fp.rotation.x = -PI / 2; fp.position.set(bx, y0 + .002, bz); fp.userData.noCol = true; K.add(fp); // Ölfleck, wo die Säule stand
      const ch = bu_ritz(.5, .15, (C, B, W, H, ppm) => { for (let g2 = 0; g2 < 2; g2++) { const gx = W * (.12 + g2 * .46), n = g2 ? 3 : 4; for (let k = 0; k < n; k++) ritz_strich(C, null, [[gx + k * ppm * .045 + ritz_RN() * 2, H * .2], [gx + k * ppm * .045 + ritz_RN() * 3, H * .82]], 54, 'kreide', ritz_R(.7, .95)); if (!g2) ritz_strich(C, null, [[gx - ppm * .03, H * .72], [gx + ppm * .2, H * .26]], 54, 'kreide', .85); } }, { ppm: 560, seed: 8 + ix, relief: false });
      bu_an(ch, new V3(bx + .12, y0 + .001, bz + .55), UP, UPZ, .0008); K.add(ch); }
    const bm = new T.Mesh(mergeGeometries(geos), rust); bm.castShadow = true; bm.userData.noCol = true; K.add(bm); }, 'Bolzen');
  // ---- Reifenstapel: I II III IV V VI VII mit weißer Kreide, der achte Strich frisch
  mk(() => {
    const tr = K.children.find(o => Math.abs(o.position.x - 124.2) < .02 && Math.abs(o.position.z - 23.5) < .02); if (!tr) return;
    let hit = null; for (let ox = 121.4; ox <= 127; ox += .35) for (const oy of [.25, .45, .65, .9, 1.15]) { const h = bu_strahl(tr, ox, oy, 17.5, 0, 0, 1, 9); if (h && Math.abs(h.n.y) < .6 && h.n.z < -.35 && (!hit || h.p.z < hit.p.z - .02)) hit = h; }
    if (!hit) { console.warn('Basis-Umsetzung Reifen: kein Treffer'); return; }
    const m = bu_ritz(.62, .14, (C, B, W, H) => { const t = 'I II III IV V VI VII', sz = H * .62, w = ritz_breite(t, sz), k = Math.min(1, (W * .78) / w); ritz_zeile(C, null, t, W * .05, H * .74, sz * k, { stil: 'kreide', alpha: .85, winkel: -.01 });
        ritz_strich(C, null, [[W * .9, H * .2], [W * .9 + 3, H * .8]], sz * k * 1.05, 'kreide', 1); }, { ppm: 600, seed: 7, relief: false });
    bu_an(m, hit.p, hit.n, UP, .02); K.add(m); OW.reifenKreide = m; console.warn('DIAG Reifen', hit.p.x.toFixed(2), hit.p.y.toFixed(2), hit.p.z.toFixed(2), hit.n.x.toFixed(2), hit.n.y.toFixed(2), hit.n.z.toFixed(2)); }, 'Reifen');
  // ---- Verkehrsschild an der Sperre: Zusatzschild mit Filzstift „AUSFAHRT AUCH.“
  mk(() => {
    const BK = c.R.block.g, sg = BK.children.find(o => Math.abs(o.position.x - 144.4) < .02 && Math.abs(o.position.z + 6.9) < .02); if (!sg) return;
    let h = null; for (const y of [1.5, 1.3, 1.7, 1.9]) { h = bu_strahl(sg, 140, y, -6.9, 1, 0, 0, 8); if (h) { h.y = y; break; } }
    const px = h ? h.p.x : 144.4, cv = document.createElement('canvas'); cv.width = 512; cv.height = 160; const x = cv.getContext('2d'); x.fillStyle = '#e8e6de'; x.fillRect(0, 0, 512, 160); for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(${90 + R2() * 60},${60 + R2() * 20},30,${R2() * .08})`; x.beginPath(); x.arc(R2() * 512, R2() * 160, 3 + R2() * 20, 0, 7); x.fill(); }
    x.strokeStyle = '#26262a'; x.lineWidth = 8; x.strokeRect(5, 5, 502, 150); x.fillStyle = 'rgba(14,14,20,.92)'; x.font = 'bold 84px Caveat, cursive'; x.textAlign = 'center'; x.save(); x.translate(256, 112); x.rotate(-.025); x.fillText('AUSFAHRT AUCH.', 0, 0); x.restore();
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const m = new T.Mesh(new T.PlaneGeometry(.5, .156), new T.MeshStandardMaterial({ map: t, roughness: .45, metalness: .3, side: T.DoubleSide }));
    m.position.set(px - .02, 1.78, -6.9); m.rotation.y = -PI / 2; m.castShadow = true; BK.add(m);
    for (const dz of [-.18, .18]) { const b = new T.Mesh(new T.BoxGeometry(.012, .02, .02), new T.MeshStandardMaterial({ color: 0x555550, metalness: .8, roughness: .5 })); b.position.set(px - .008, 1.78 + .0, -6.9 + dz); BK.add(b); }
    OW.zusatzschild = m; }, 'Verkehrsschild');
}

// =====================================================================  Basis-Umsetzung „Text gegen Welt“ – West (Schrebergärten, Hof): Picknicktisch, Hildes Laube, Heuballen, Stalltür, Traktor
async function ausbau_ost_west_bu_west(OW, c) {
  const T = c.T, V3 = T.Vector3, A = c.A, F = c.F, UP = new V3(0, 1, 0), UPZ = new V3(0, 0, 1), R2 = ausbau_nord_rng(1312), rr = (a, b) => a + R2() * (b - a);
  try { await document.fonts.load('40px Caveat'); } catch (e) {}
  const mk = async (fn, label) => { try { return await fn(); } catch (e) { console.warn('Basis-Umsetzung West: ' + label, e); return null; } };
  const chairSpec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
  // ---- Picknicktisch (Parzelle E1): acht Teller, acht Gabeln; auf jedem Teller ein Kiesel, auf dem achten zwei
  await mk(async () => {
    const p = OW.picnic; if (!p) return; const rot = p.rotation.y; p.rotation.y = 0; p.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(p), sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z; p.rotation.y = rot; p.updateMatrixWorld(true);
    const cx = p.position.x, cz = p.position.z, longX = sx >= sz, Ll = Math.max(sx, sz), Ls = Math.min(sx, sz), th = bu_strahl(p, cx, 3, cz, 0, -1, 0, 4), top = th ? th.p.y : .75, sp = Math.min(.5, Ll * .21), vv = Math.min(.25, Ls * .17), cs = Math.cos(rot), sn = Math.sin(rot);
    const W = (u, v) => { const lx = longX ? u : v, lz = longX ? v : u; return [cx + lx * cs + lz * sn, cz - lx * sn + lz * cs]; };
    const pebbles = []; let n = 0;
    for (let side = 0; side < 2; side++) for (let k = 0; k < 4; k++, n++) { const u = (k - 1.5) * sp, v = (side ? 1 : -1) * vv, [x, z] = W(u, v), pl = await bu_teil('w_teller', 'model.glb', /^Object_4$/, .22, { flach: true }), fk = await bu_teil('w_besteck', 'model.glb', /^fork/, .17, { flach: true });
      if (pl) { pl.position.set(x, top, z); pl.rotation.y = rr(0, 6); A.add(pl); pl.userData.noCol = true; }
      if (fk) { const [fx, fz] = W(u + (side ? .165 : -.165), v), vx = longX ? sn : cs, vz = longX ? cs : -sn; fk.position.set(fx, top, fz); fk.rotation.y = Math.atan2(vx, vz) + rr(-.1, .1); fk.userData.noCol = true; A.add(fk); }
      pebbles.push([x + rr(-.012, .012), top + .0055, z + rr(-.012, .012), .042 + rr(0, .008), rr(0, 6), .6]); if (n === 7) pebbles.push([x + .03, top + .0085, z - .02, .036, rr(0, 6), .6]); }
    await bu_kiesel(pebbles, A); OW.picnicDeck = n; }, 'Picknick');
  // ---- Hildes Laube (Parzelle 7): Zettel mit Reißzwecke, Petroleumlampe (brennt klein), Streichhölzer, Bank mit Schuhkarton „Nächte“, Blechdose, zwei Stühle (auf dem zweiten ein eingedrücktes Kissen)
  await mk(async () => {
    const s = OW.shedP7; if (!s) return; s.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(s), X0 = bb.max.x, z0 = 36.2, wood = (w, h, d, x, y, z, ry = 0) => { const m = c.wbox('planks_painted', w, h, d, x, y, z, { tint: 0x6e5f4c, tile: 1.1, p: A, ry }); m.userData.noCol = false; return m; };
    // Bank an der Wand: Sitzbrett + zwei Böcke
    const bx = X0 + .36, bz = z0 - .55; wood(.34, .045, 1.5, bx, .44, bz); for (const dz of [-.6, .6]) { wood(.05, .42, .3, bx, .21, bz + dz); wood(.34, .03, .05, bx, .1, bz + dz); }
    const bt = bu_strahl(A, bx, 1, bz, 0, -1, 0, 2); const sy = bt ? bt.p.y : .465;
    // Schuhkarton „Nächte“ (Deckel mit Filzstiftschrift), Streichholzschachtel, Petroleumlampe
    const sk = (() => { const g = new T.Group(), cardM = new T.MeshStandardMaterial({ color: 0xb09870, roughness: .95 }), cv = document.createElement('canvas'); cv.width = 512; cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = '#b4a078'; x.fillRect(0, 0, 512, 256); for (let i = 0; i < 300; i++) { x.fillStyle = `rgba(${80 + R2() * 40},${60 + R2() * 30},30,${R2() * .1})`; x.fillRect(R2() * 512, R2() * 256, 2 + R2() * 30, 1 + R2() * 2); }
      x.strokeStyle = 'rgba(70,50,30,.4)'; x.lineWidth = 3; x.strokeRect(18, 18, 476, 220); x.fillStyle = 'rgba(14,12,10,.92)'; x.font = 'bold 110px Caveat, cursive'; x.textAlign = 'center'; x.save(); x.translate(256, 150); x.rotate(-.03); x.fillText('Nächte', 0, 0); x.restore();
      const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const lid = new T.Mesh(new T.BoxGeometry(.33, .045, .19), [cardM, cardM, new T.MeshStandardMaterial({ map: t, roughness: .95 }), cardM, cardM, cardM]), base = new T.Mesh(new T.BoxGeometry(.318, .1, .178), cardM);
      base.position.y = .05; lid.position.y = .1225; g.add(base, lid); g.traverse(m => { m.castShadow = true; m.userData.noCol = true; }); return g; })();
    sk.position.set(bx, sy, bz + .08); sk.rotation.y = PI / 2 + .08; A.add(sk);
    const mb = (() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const x = cv.getContext('2d'); x.fillStyle = '#d8b030'; x.fillRect(0, 0, 128, 64); x.fillStyle = '#a02018'; x.fillRect(0, 0, 128, 14); x.fillStyle = '#1a1a1a'; x.font = 'bold 20px Arial'; x.textAlign = 'center'; x.fillText('ZÜNDHÖLZER', 64, 44); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace;
      const side = new T.MeshStandardMaterial({ color: 0x8a6a40, roughness: .9 }), m = new T.Mesh(new T.BoxGeometry(.056, .015, .037), [side, side, new T.MeshStandardMaterial({ map: t, roughness: .8 }), side, side, side]); m.castShadow = true; m.userData.noCol = true; return m; })();
    mb.position.set(bx + .03, sy + .0075, bz + .62); mb.rotation.y = .5; A.add(mb);
    const lamp = c.fit(c.lanternS.clone(true), .3); lamp.position.set(bx, sy, bz + .45); lamp.traverse(m => { if (m.isMesh) { m.castShadow = true; if (/buln|bulb/i.test(m.name + [].concat(m.material)[0].name)) { m.material = m.material.clone(); m.material.emissive = new T.Color(0xffa040); m.material.emissiveIntensity = 1.6; } } }); lamp.userData.noCol = true; A.add(lamp);
    const L = c.vlight(0xffa860, 1.1, 5.5, bx, sy + .2, bz + .45), gl = c.glow(0xffa040, .7, bx, sy + .12, bz + .45, A); OW.hildeLampe = { L, gl, lamp };
    WORLD_TICK.push((dt, t) => { if (!OW.hildeLampe) return; const f = .86 + Math.sin(t * 8.1) * .06 + Math.sin(t * 21) * .05 + (Math.random() < .02 ? -.2 : 0), on = OW.hildeLampe.on !== false; L.intensity = on ? 1.1 * f : 0; gl.visible = on; });
    // Blechdose unter der Bank
    const dose = await bu_mod('w_blech', 'model.glb', .2, 'max'); if (dose) { dose.position.set(bx + .02, 0, bz - .35); dose.rotation.y = 1.1; dose.userData.noCol = true; A.add(dose); }
    // zwei Stühle mit dem Gesicht zur Wand; auf dem zweiten ein Kissen, eingedrückt
    const ch = [await msFBX('chair', 'model.fbx', chairSpec).catch(() => null), await msFBX('chair', 'model.fbx', chairSpec).catch(() => null)];
    const spots = [[X0 + 1.3, z0 - .15, -PI / 2 + .12], [X0 + 1.25, z0 + .62, -PI / 2 - .2]];
    ch.forEach((o, i) => { if (!o) return; const g = c.fit(o, .92), [x, z, ry] = spots[i]; g.position.set(x, 0, z); g.rotation.y = ry; A.add(g); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      if (i === 1) { const st = bu_strahl(g, x, 1.6, z, 0, -1, 0, 3), ky = st ? st.p.y : .46, kg = new T.BoxGeometry(.36, .07, .36, 10, 2, 10), P = kg.attributes.position;
        for (let j = 0; j < P.count; j++) { const px = P.getX(j), pz = P.getZ(j), py = P.getY(j), r2 = px * px + pz * pz; if (py > 0) P.setY(j, py - .042 * Math.exp(-r2 / .006) + .012 * Math.exp(-r2 / .05)); const e = Math.max(Math.abs(px), Math.abs(pz)) / .18; P.setX(j, px * (1 - .06 * e * e * (py < 0 ? 1 : .4))); }
        kg.computeVertexNormals(); const km = new T.Mesh(kg, c.sm('wallpaper_fabric', 0x7a3c34)); km.position.set(x, ky + .035, z); km.rotation.y = ry + .3; km.castShadow = true; km.userData.noCol = true; A.add(km); OW.hildeKissen = km; } });
    // Zettel mit Reißzwecke: „Drei. Immer drei.“
    const zh = bu_strahl(s, X0 + 3, 1.45, z0 + 1.15, -1, 0, 0, 6);
    if (zh) { const zt = (() => { const cv = document.createElement('canvas'); cv.width = 260; cv.height = 340; const x = cv.getContext('2d'); x.fillStyle = '#e8e2cf'; x.fillRect(0, 0, 260, 340); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(110,90,60,${R2() * .08})`; x.beginPath(); x.arc(R2() * 260, R2() * 340, 5 + R2() * 26, 0, 7); x.fill(); }
        x.fillStyle = '#1c1e3a'; x.font = '62px Caveat, cursive'; x.textAlign = 'center'; x.fillText('Drei.', 130, 150); x.fillText('Immer drei.', 130, 232); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; })();
      const pm = new T.Mesh(new T.PlaneGeometry(.13, .17), new T.MeshStandardMaterial({ map: zt, roughness: .95, side: T.DoubleSide })); const pg = pm.geometry.attributes.position; for (let j = 0; j < pg.count; j++) pg.setZ(j, Math.sin(pg.getX(j) * 40) * .002 + Math.max(0, -pg.getY(j) - .04) * .12 * (pg.getX(j) > 0 ? 1 : .3)); pm.geometry.computeVertexNormals();
      bu_an(pm, zh.p, zh.n, UP, .004); pm.rotateZ(.05); pm.userData.noCol = true; A.add(pm);
      const pin = new T.Mesh(new T.SphereGeometry(.0085, 10, 6, 0, PI * 2, 0, PI / 2), new T.MeshStandardMaterial({ color: 0xb02a22, roughness: .35, metalness: .3 })); pin.position.copy(zh.p).addScaledVector(zh.n, .0075).add(new V3(0, .06, 0)); pin.quaternion.setFromUnitVectors(UP, zh.n); pin.userData.noCol = true; A.add(pin); OW.hildeZettel = pm; } }, 'Hildes Laube');
  // ---- Roxys Laube (Parzelle E2): Roxys Heft liegt aufgeschlagen auf einem Hocker
  await mk(async () => {
    const x = -107.2 + .6, z = 22.55, y0 = 0, hk = c.wbox('planks_painted', .42, .4, .42, x, y0 + .2, z, { tint: 0x74634e, tile: 1, p: A, ry: .3 });
    const bk = await msFBX('lbook', 'model.fbx', { '*': { b: 'b.jpg', n: 'n.jpg', r: 'r.jpg', ao: 'ao.jpg' } }); msFit(bk, .24, 'max'); const g = msGround(bk); g.position.set(x, y0 + .4, z); g.rotation.y = .6; g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.userData.noCol = true; } }); A.add(g); OW.roxyHeftModell = g; }, 'Roxys Heft');
  // ---- Heuballen: eine kindgroße Mulde auf dem obersten Ballen, darin acht Kiesel im Kreis
  await mk(async () => {
    let best = null; for (const [x, z] of [[-128.2, -33.5], [-126.4, -33.4], [-127.3, -33.6], [-125.6, -33.3]]) { const h = bu_strahl(F, x, 3.2, z, 0, -1, 0, 6); if (h && h.n.y > .5 && h.p.y < 1.45 && (!best || h.p.y > best.p.y)) best = h; }
    if (!best) return;
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'), g = x.createRadialGradient(128, 128, 20, 128, 128, 124); g.addColorStop(0, 'rgba(40,28,10,.8)'); g.addColorStop(.7, 'rgba(60,44,18,.55)'); g.addColorStop(1, 'rgba(60,44,18,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) { const a = R2() * 6.3, r = 50 + R2() * 70; x.strokeStyle = `rgba(${150 + R2() * 60},${120 + R2() * 50},50,${.2 + R2() * .4})`; x.lineWidth = 1.5; x.beginPath(); x.moveTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); x.lineTo(128 + Math.cos(a + .4) * (r + 14), 128 + Math.sin(a + .4) * (r + 14)); x.stroke(); }
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; const m = new T.Mesh(new T.PlaneGeometry(.78, .78), new T.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: 1 })); bu_an(m, best.p, best.n, UPZ, .01); m.userData.noCol = true; F.add(m);
    const ks = []; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; ks.push([best.p.x + Math.cos(a) * .17, best.p.y + .012, best.p.z + Math.sin(a) * .17, .05 + rr(0, .01), rr(0, 6), .6]); } await bu_kiesel(ks, F); OW.heuMulde = m; }, 'Heuballen');
  // ---- Stalltür: über dem Eingang, eingeschnitzt: 1312, darunter, frischer, 2026 (Schnitzbrett im Sturz)
  await mk(async () => {
    const d = c.barnDoor, inn = c.barnIn, out = new V3(d.x - inn.x, 0, d.z - inn.z).normalize(), ry = Math.atan2(out.x, out.z), y = 2.55;
    const br = c.wbox('planks_painted', 1.2, .3, .06, d.x + out.x * .12, y, d.z + out.z * .12, { tint: 0x6c5b46, tile: 1.1, p: F, ry });
    const m = bu_ritz(1.1, .26, (C, B, W, H) => { ritz_zeile(C, B, '1312', W * .1, H * .46, H * .4, { stil: 'ritz', alpha: .8, jit: 1.1 }); ritz_zeile(C, B, '2026', W * .1 + 6, H * .92, H * .42, { stil: 'ritz', alpha: 1, jit: 1.1 }); }, { ppm: 520, seed: 1312, bump: 3.4 });
    bu_an(m, new V3(d.x + out.x * .15, y, d.z + out.z * .15), out, UP, .006); m.userData.noCol = true; F.add(m); OW.stallZahlen = m; OW.stallBrett = br; }, 'Stalltür');
  // ---- Traktor: Kreidepfeil nach Osten auf dem Kotflügel
  await mk(async () => {
    const tr = F.children.find(o => Math.abs(o.position.x + 132) < .02 && Math.abs(o.position.z + 20.5) < .02); if (!tr) return; tr.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(tr), cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; let best = null;
    for (let a = 0; a < 6.28; a += .26) for (const r of [.7, 1.0, 1.3]) { const h = bu_strahl(tr, cx + Math.cos(a) * r, bb.max.y + .5, cz + Math.sin(a) * r, 0, -1, 0, 4); if (h && h.n.y > .7 && h.p.y > .6 && h.p.y < 1.1) { const sc = Math.hypot(h.p.x - cx, h.p.z - cz) + h.p.y + (h.p.x > cx ? .5 : 0); if (!best || sc > best.sc) best = { h, sc }; } }
    if (!best) return;
    const m = bu_ritz(.42, .22, (C, B, W, H) => { ritz_strich(C, null, [[W * .1, H * .5], [W * .85, H * .5 + ritz_RN() * 2]], 60, 'kreide', .9); ritz_strich(C, null, [[W * .62, H * .16], [W * .88, H * .5]], 60, 'kreide', .9); ritz_strich(C, null, [[W * .62, H * .84], [W * .88, H * .5]], 60, 'kreide', .9); }, { ppm: 520, seed: 77, relief: false });
    bu_an(m, best.h.p, best.h.n, new V3(0, 0, -1), .004); m.userData.noCol = true; F.add(m); OW.traktorPfeil = m; }, 'Traktor');
}
