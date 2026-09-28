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
  const canvasTex = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
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
    const g = new T.BufferGeometry(), pos = [], nor = [], uv = []; let start = 0;
    buckets.forEach((B, k) => { if (!B.p.length) return; pos.push(...B.p); nor.push(...B.n); uv.push(...B.uv); g.addGroup(start, B.p.length / 3, k); start += B.p.length / 3; });
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
  const fasciaTx = canvasTex(1024, 96, (c, w, h) => { c.fillStyle = '#d9d2c2'; c.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(${90 + rand(0, 40)},${50 + rand(0, 20)},20,${rand(.05, .25)})`; c.fillRect(rand(0, w), rand(0, h), rand(4, 60), rand(20, h)); }
    c.fillStyle = '#8a1c14'; c.font = 'bold 58px Arial'; c.textAlign = 'center'; c.fillText('TANKSTELLE  KRANZ  ·  KFZ', w / 2, 68); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, h - 8, w, 8); });
  const fascia = new T.Mesh(new T.PlaneGeometry(11.6, 1.08), new T.MeshStandardMaterial({ map: fasciaTx, emissive: 0xffffff, emissiveMap: fasciaTx, emissiveIntensity: .0, roughness: .6 })); fascia.position.set(112, 3.2, 24.84); K.add(fascia);
  // Innen: Werkbank als Tresen, Regale, Kalender, Licht
  { const t = fit(metaltableS.clone(true), 3.2, 'x'); put(t, 110.3, 26, 0, 0, K); const s1 = fit(wardrobeS.clone(true), 1.95); put(s1, 108, 30.3, PI, 0, K); const s2 = fit(wardrobeS.clone(true), 1.95); put(s2, 116.3, 30.3, PI, 0, K);
    const tb = fit(trashS.clone(true), .7); put(tb, 117, 26.2, 1, 0, K); }
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
  const plateTx = canvasTex(512, 128, (c, w, h) => { c.fillStyle = '#6a5a44'; c.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(20,12,6,${rand(.1, .4)})`; c.fillRect(0, rand(0, h), w, rand(1, 4)); } c.fillStyle = '#e6dcc4'; c.font = 'bold 54px Arial'; c.textAlign = 'center'; c.fillText('SCHROTT · KRANZ', w / 2, 84); });
  decal(plateTx, 2, .5, 101.05, 2.4, -26.5, PI / 2, 0, { p: J });
  // Roter Kanister (Nebenaufgabe) neben dem Schrottauto
  const redCan = jerryS.clone(true); redCan.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd84030); } }); put(redCan, 133.6, -10.2, 1.1, 0, J); redCan.rotation.z = 1.45; redCan.position.y = .17;

  // ---------------------------------------------------------------- Straßensperre (x ≈ 146)
  const BK = R.block.g;
  for (const [x, z, r] of [[146, -5.25, PI / 2 + .05], [146.5, .05, PI / 2 - .04], [146.1, 5.3, PI / 2 + .09]]) put(barrierS.clone(true), x, z, r, 0, BK);
  { const mats4 = [[143.2, -3.6, .3], [143.5, -1.4, 1], [143.1, .9, 2], [143.6, 3.2, .5], [144.2, 6.4, 1.2]].map(([x, z, r]) => msM4(x, 0, z, r, 1)); mats4.push(msM4(142.1, .17, 2, .4, 1, 0, 1.52)); msInst(coneP, mats4).forEach(im => BK.add(im)); }
  { const rs = only(roadSignS, n => n === 'Road_Sign_01'); const g = fit(rs, 2.5); put(g, 144.4, -6.9, -PI / 2, 0, BK); }
  const blockTx = canvasTex(400, 520, (c, w, h) => { c.fillStyle = '#e8e2cf'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.textAlign = 'center'; c.font = 'bold 40px Arial'; c.fillText('SPERRGEBIET', w / 2, 70); c.font = '22px Arial';
    ['Durchfahrt und Betreten', 'verboten.', '', 'Anordnung des', 'Amtes für Rückführung', 'vom 31.10.1992', '', 'Zuwiderhandlungen werden', 'nicht verfolgt.'].forEach((l, i) => c.fillText(l, w / 2, 130 + i * 34));
    c.strokeStyle = 'rgba(120,10,10,.8)'; c.lineWidth = 5; c.beginPath(); c.moveTo(40, 470); c.lineTo(360, 440); c.stroke(); c.fillStyle = 'rgba(90,70,40,.25)'; c.fillRect(0, h - 90, w, 90); });
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

  // ---------------------------------------------------------------- Schrebergärten „Birkenhain e. V.“ (x −140 … −90, z 3 … 48)
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
  // Parzelle W2: Vogelscheuche im Gemüsebeet – trägt Kais Kinderjacke
  const scare = fit(scareS.clone(true), 2.15); put(scare, -121.2, 24.8, PI / 2, 0, A);
  // Parzelle W3: verwilderte Parzelle 7 (Wendt) mit Geräteschuppen
  { const s = fit(shedUtilS.clone(true), 2.7); put(s, -122.8, 36.2, -PI / 2, 0, A); }
  const p7Tx = canvasTex(256, 128, (c, w, h) => { c.fillStyle = '#5a4a36'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8ceb4'; c.font = 'bold 34px Georgia'; c.textAlign = 'center'; c.fillText('Parzelle 7', w / 2, 52); c.font = '24px Georgia'; c.fillText('Wendt', w / 2, 96); });
  decal(p7Tx, .5, .25, -116.9, 1.05, 36.2, PI / 2, 0, { p: A });
  // Parzelle E1: Picknicktisch, acht Teller
  { const p = fit(picnicS.clone(true), .78); put(p, -108, 13.2, .3, 0, A); const w = wbarS.clone(true); put(w, -104.5, 10.6, -1.2, 0, A); }
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
    note(20, 20, 220, 160, -.04, ['KLEINGARTENVEREIN', 'BIRKENHAIN e. V.', '', 'Parzellen 1–7 sind bis', '31.10. zu räumen.', 'Der Vorstand']); note(270, 30, 210, 140, .05, ['VERMISST', 'Ben Wendt, 10 J.', 'zuletzt gesehen:', 'Parzelle 7, 28.7.09']); note(60, 200, 190, 150, .03, ['Gartenfest', 'fällt aus.', '', 'Bitte keine Kinder', 'nach Einbruch der', 'Dunkelheit.']); note(290, 200, 190, 140, -.06, ['Wer hat die Laternen', 'wieder angezündet?', '— H. W.']); });
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
  const fhDoor = hit(1.2, 2.3, .35, -117.5, 1.6, -13 - 4.65, 'Klopfen', () => { Audio.knock(); toast(['Niemand öffnet. Hinter der Tür scharrt ein Hund. Dann nicht mehr.', 'Du klopfst. Oben knarrt ein Dielenbrett. Genau über dir.', 'Verschlossen. Am Klingelschild: BRANDT. Darunter, mit Kinderschrift: und Ben.'][Math.floor(rand(0, 3))], 4200); });
  { const b = fit(bikeS.clone(true), 1.75, 'max'); put(b, -121.6, -18.6, .3, 0, F); b.rotateX(PI / 2 - .1); b.position.y = .27; } // liegt auf der Seite im Matsch

  // ---------------------------------------------------------------- Die alte Villa (−125, 70) – Wahrzeichen, verschlossen
  const VG = R.villa.g;
  const villa = (() => { const o = villaS.clone(true); o.scale.setScalar(.011); o.updateMatrixWorld(true);
    const wall = sm('wall_damaged', 0x6f6c64, 1.2), roof = sm('road_asphalt', 0x5c616a, 1.4), plinth = sm('facade_concrete', 0x55534e), brick = sm('facade_brick', 0x5a4038), metal = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .5, metalness: .8 }), lglass = new T.MeshStandardMaterial({ color: 0x0a0c10, roughness: .2 });
    o.traverse(m => { if (m.isMesh) reUV(m, k => [2.4, 1.6, 2, 1.2, 1, 1][k], (n, y, name) => name === 'notGlass' ? 4 : name === 'glass' ? 5 : (n.y > .35 && y > 8.6) ? 1 : y < .85 ? 2 : (y > 12.6 && Math.abs(n.y) < .5) ? 3 : 0, [wall, roof, plinth, brick, metal, lglass]); });
    return o; })();
  const villaG = msGround(villa); put(villaG, -125, 70, PI, 0, VG); villaG.updateMatrixWorld(true);
  const vbb = new T.Box3().setFromObject(villaG);
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
  decal(chainTx, .5, .5, -125, 1.15, 56.9, PI, 0, { p: VG });

  // ================================================================= Bodennebel über den neuen Gebieten (gleiches Material wie im Ort)
  for (const [x, z, w, d] of [[120, -2, 78, 76], [-117, 18, 76, 110]]) for (const y of [.3, .85]) { const m = new T.Mesh(new T.PlaneGeometry(w, d), fogMat); m.rotation.x = -PI / 2; m.position.set(x, y, z); m.renderOrder = 2; scene.add(m); }

  // ================================================================= NEBENAUFGABEN
  // STORY-HOOK: Nebenaufgaben „Die Geldkassette“, „Der rote Kanister“ (Ost) · „Das Heft im Heu“, „Drei Laternen“ (West)
  story.side.ow_kasse = { title: 'Die Geldkassette', desc: 'Im Nachtschalter der Tankstelle Kranz steht eine Kassette mit Zahlenschloss.', state: 'hidden' };
  story.side.ow_kanister = { title: 'Der rote Kanister', desc: 'Der letzte Kunde der Tankstelle hat einen roten Kanister nie zurückgebracht.', state: 'hidden' };
  story.side.ow_heft = { title: 'Das Heft im Heu', desc: 'Im Pferdestall hat ein Kind geschlafen. Aus seinem Heft fehlen drei Seiten.', state: 'hidden' };
  story.side.ow_laternen = { title: 'Drei Laternen', desc: 'In der Laube liegt ein Zettel: Drei Laternen sollen brennen, „damit sie heimfinden“.', state: 'hidden' };
  const Q = OW.q = { kasse: false, kanisterHave: false, kanisterDone: false, pages: new Set(), heftSeen: false, heftDone: false, matches: false, lit: 0, laternDone: false, jacket: false, book: false };
  const item = (k, name, desc) => { if (!ITEMS[k]) { ITEMS[k] = { name, desc }; ICONS[k] = ICONS.paper; } addItem(k); };

  // ================================================================= ENTDECKBARES · OST
  // STORY-HOOK: Kassenbuch der Tankstelle Kranz endet am 31.10.2009 um 03:13
  const readBook = () => { Q.book = true; Audio.paper();
    openNote('Kassenbuch · Tankstelle Kranz', noteHand('30.10.2009 — Super 22,40 · Diesel 41,00 · Zigaretten\n31.10. 01:02 — Kaffee, Herr Albers. „Kann nicht schlafen.“\n31.10. 02:47 — niemand. Die Klingel ging trotzdem.\n<b>31.10. 03:13 — ein Junge, allein, barfuß. 10 Liter in einem roten Kanister.\nBezahlt mit einem Foto. Ich hab nicht gefragt, wofür er Benzin braucht.</b>\n\n') + '<i>Danach nur noch leere Zeilen. Auf der letzten Seite, andere Handschrift:</i>\n' + noteHand('Kassette: was vom Preisschild noch hängt. Von oben nach unten.\n— P. K.'), 'ow_kassenbuch', () => { sideStart('ow_kasse'); sideStart('ow_kanister'); }); };
  hit(1.1, .7, .5, 115.1, 1.3, 24.8, () => !Q.book ? 'Nachtschalter' : !Q.kasse ? 'Geldkassette öffnen' : 'Kassenbuch', () => {
    if (!Q.book) return readBook();
    if (Q.kasse) return readBook();
    let v = [0, 0, 0, 0];
    openPuzzle(`<h3>GELDKASSETTE</h3><p>Vier Rädchen. Die Zahlen sind abgegriffen.</p><div class="row" id="owW">${v.map((d, i) => `<button data-i="${i}" style="font:28px Georgia;min-width:52px">${d}</button>`).join('')}</div><div class="row" style="margin-top:14px"><button id="owOk">ÖFFNEN</button></div><p class="small">Auf dem Deckel eingeritzt: <i>P. K.</i></p>`, bx => {
      bx.querySelectorAll('#owW button').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.i; v[i] = (v[i] + 1) % 10; b.textContent = v[i]; Audio.flick(); });
      bx.querySelector('#owOk').onclick = e => { e.stopPropagation(); if (v.join('') === '0313') { closeOverlay(); Q.kasse = true; Audio.play('lockOpen', { gain: .6 }); Audio.play('metalOpen', { gain: .4, rate: 1.4, delay: .3 });
          setTimeout(() => openNote('In der Geldkassette', 'Kein Geld. Nur ein Polaroid und ein gefalteter Zettel.\n\nAuf dem Foto: ein Junge an der Zapfsäule, einen roten Kanister in der Hand. Das Gesicht ist verwackelt. Hinten drauf:\n' + noteHand('„Kai B., 31.10.09 – 03:13. Hat mit diesem Foto bezahlt.\nEs ist ein Foto von ihm selbst. Von morgen.“') + '\n\nDer Zettel:\n' + noteHand('Peter, wenn du das findest: Ich hab die Säulen abbauen lassen. Die kommen nachts und wollen tanken. Kinder tanken nicht. — Vater'), 'ow_kassette', () => sideDone('ow_kasse', 'Die Kassette war leer – bis auf ein Foto, das es nicht geben dürfte.')), 500); }
        else { Audio.beep(false); toast('Das Schloss hält. Irgendwo hinter dir klingelt die Ladenglocke. Einmal.', 3200); Audio.bell(112, 25); } };
    }); });
  // STORY-HOOK: Preistafel = Zahlencode 0-3-1-3
  hit(1, 3, 1, 99.2, 3.2, 8.2, 'Leuchtschild', () => { toast('TANKSTELLE KRANZ. Die Röhre summt. Auf der Preistafel hängen nur noch vier Ziffern: 0 … 3 … 1 … 3.', 5200); Audio.buzz(99.2, 4.5, 8.2); OW.signFlick = 2.5; });
  hit(5, 1.6, .4, 109.9, 1.75, 24.75, 'Schaufenster', () => toast(['Drinnen: leere Regale, ein Kalender. Oktober 2009. Der 31. ist rot umkringelt.', 'Auf dem Tresen stehen acht Pappbecher. Einer ist umgefallen.', 'Im Staub am Fenster: kleine Handabdrücke. Von innen.'][Math.floor(rand(0, 3))], 4200));
  hit(1.2, 2.2, .5, 113.35, 1.1, 24.7, 'Ladentür', () => { Audio.play('metalHit2', { gain: .3, rate: 1.2, x: 113, y: 1, z: 25, ref: 2 }); toast('Abgeschlossen. Hinter der Tür hängt ein Schild: „Komme gleich wieder.“ Der Staub darauf ist fingerdick.', 4000); });
  for (const x of [107, 115]) hit(1.4, .6, 4.4, x, .4, 15, () => Q.kanisterHave && !Q.kanisterDone ? 'Kanister abstellen' : 'Zapfinsel', () => {
    if (Q.kanisterHave && !Q.kanisterDone) { Q.kanisterDone = true; story.items = story.items.filter(k => k !== 'ow_kanister'); const j = jerryS.clone(true); j.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.set(0xd84030); } }); put(j, x + .2, 14.2, .4, .22, K);
      Audio.play('metalHit1', { gain: .4, x, y: .3, z: 15, ref: 2 }); OW.canopyDie = 3.5; setTimeout(() => { Audio.giggle(x - 2, 1, 11); subtitle('Aus dem Kanister tropft es. Kein Benzin. Wasser. Kalt, wie aus einem Brunnen.', 4800); OW.footsteps = { x: x, z: 13, t: 0 }; }, 1800);
      setTimeout(() => { story.lore.push({ key: 'ow_kanister', title: 'Der rote Kanister', html: 'Du hast den Kanister zurückgebracht. Aus ihm tropfte Wasser, kein Benzin. Kleine nasse Fußabdrücke führten von der Zapfinsel nach Osten – zur Sperre.' }); sideDone('ow_kanister', 'Zurückgebracht. Die Fußabdrücke führten zur Sperre.'); }, 4500); return; }
    toast('Vier abgeschnittene Bolzen, wo die Säulen standen. Jemand hat Kreidestriche daneben gemacht: acht Stück.', 4200); });
  hit(.7, .6, .6, 133.6, .3, -10.2, 'Roter Kanister', () => { if (Q.kanisterHave) return; Q.kanisterHave = true; redCan.visible = false; item('ow_kanister', 'Roter Kanister', 'Aus dem Schrott der Tankstelle Kranz. Innen schwappt etwas. Auf dem Griff, eingeritzt: KAI.');
    subtitle('Der Kanister ist nicht leer. Auf dem Griff, eingeritzt: KAI.', 4200); if (story.side.ow_kanister.state === 'hidden') sideStart('ow_kanister'); story.side.ow_kanister.desc = 'Bring den roten Kanister zurück zur Zapfinsel der Tankstelle.'; });
  hit(2.1, 1.4, 1.3, 120.4, .7, 28.2, 'Müllcontainer', () => { Audio.play('metalOpen', { gain: .35, rate: .9, x: 120, y: 1, z: 28, ref: 2 }); toast('Im Container: Kinderschuhe. Sieben Paar, ordentlich nebeneinander. Und ein einzelner.', 4200); });
  hit(3.5, 1.2, 3, 124.2, .6, 23.5, 'Reifenstapel', () => toast('Auf den Reifen, mit weißer Kreide gezählt: I II III IV V VI VII. Der achte Strich ist frisch.', 4200));
  hit(4.4, 1.6, 2, 122.5, .8, -14.5, 'Ausgebranntes Auto', () => toast('Auf dem Rücksitz: ein geschmolzener Kindersitz. Der Gurt ist noch geschlossen.', 4200));
  hit(4.5, 1.4, 2, 130.5, .7, -12.6, 'Schrottauto', () => { Audio.play('metalOpen', { gain: .3, rate: 1.1, x: 130, y: 1, z: -12, ref: 2 }); toast('Kofferraum: eine Decke, eine Taschenlampe ohne Batterien, ein Schulranzen. Name herausgeschnitten.', 4400); });
  hit(4.8, 2, 2.4, 133.2, 1, -25.2, 'Transporter', () => toast('An der Seite, unter Rost: AMT FÜR RÜCKF… Der Rest ist abgekratzt. Auf dem Boden der Ladefläche: acht Kinderdecken.', 4600)); // STORY-HOOK: Transporter des Amts
  hit(2.4, 2.6, 3, 99.6, 1.3, -26.5, 'Schrottbüro', () => { Audio.knock(); toast('Abgeschlossen. Durch den Spalt: ein Kalender von 1992. Jedes Datum ist durchgestrichen – bis zum 31. Oktober.', 4400); }); // STORY-HOOK: 1992
  hit(5, 1, 17, 146.2, .5, 0, 'Straßensperre', () => openNote('Aushang an der Betonsperre', 'Laminiert, vergilbt, mit Kabelbinder befestigt:\n\n<b>SPERRGEBIET</b>\nDurchfahrt und Betreten verboten.\nAnordnung des Amtes für Rückführung vom 31.10.1992.\n' + noteHand('Zuwiderhandlungen werden nicht verfolgt.') + '\n\nDarunter hat jemand mit Kuli geschrieben:\n' + noteHand('„Weil keiner zurückkommt, den man verfolgen könnte.“'), 'ow_sperre')); // STORY-HOOK: Amt/1992
  hit(4.5, 1.6, 2.2, 150.6, .8, 2.6, 'Ausgebranntes Auto', () => { Audio.radio(150.6, 2.6); setTimeout(() => say([['*Rauschen*', 1400], ['„…einunddreißig Komma eins null… wer das hört: nicht über die Sperre…“', 3600, 'AUTORADIO'], ['*Klick*', 700]]), 500); }); // STORY-HOOK: 31,10 MHz
  hit(2, 2.6, 1.2, 144.4, 1.3, -6.9, 'Verkehrsschild', () => toast('Einfahrt verboten. Jemand hat mit Filzstift daruntergeschrieben: AUSFAHRT AUCH.', 3600));

  // ================================================================= ENTDECKBARES · WEST
  // STORY-HOOK: Vogelscheuche trägt Kais Kinderjacke
  hit(1.3, 2.2, 1, -121.2, 1.1, 24.8, 'Vogelscheuche', () => { if (!Q.jacket) { Q.jacket = true; openNote('Die Vogelscheuche', 'Sie trägt eine Kinderjacke. Blau, abgewetzt, zu klein für einen Erwachsenen.\n\nIm Kragen, mit Filzstift:\n' + noteHand('KAI B.') + '\n\nDu hattest so eine Jacke. Du bist sicher, dass du so eine hattest.\nIn der Tasche steckt ein gefaltetes Blatt – aus einem Schulheft gerissen.', 'ow_jacke', () => owPage('jacke')); }
    else toast(['Die Jacke riecht nach Heu. Und nach dir.', 'Der Sackkopf ist dir zugewandt. Oder war er das vorher schon?'][Math.floor(rand(0, 2))], 3600); });
  const owPage = k => { if (Q.pages.has(k)) return; Q.pages.add(k); Audio.paper(); item('ow_seiten', 'Heftseiten', 'Aus einem Schulheft gerissen. Kinderschrift, mit Bleistift.');
    const txt = { jacke: '„…der Mann in Eisen sagt, ich darf nicht nach Hause. Da schläft schon einer in meinem Bett…“', schuppen: '„…ich wohne jetzt im Stall. Die Pferde sind weg, aber es riecht noch nach ihnen. Die Frau aus Nr. 7 bringt mir Brot…“', tor: '„…in dem großen Haus brennt ein Licht. Da oben wohnt die, die uns zählt…“' }[k];
    toast('Eine Heftseite: ' + txt, 6500); if (!Q.heftSeen) { if (story.side.ow_heft.state === 'hidden') sideStart('ow_heft'); story.side.ow_heft.desc = 'Seiten gefunden: ' + Q.pages.size + ' / 3. Bring sie zurück zum Schlafplatz im Stall.'; }
    else story.side.ow_heft.desc = `Seiten gefunden: ${Q.pages.size} / 3. Bring sie zurück zum Schlafplatz im Stall.`; updateSideInfo(); };
  // STORY-HOOK: Kinderschlafplatz im Heu
  hit(2, .6, 1.8, nestP.x, .3, nestP.z, () => Q.pages.size === 3 && !Q.heftDone ? 'Seiten ins Heft legen' : 'Schlafplatz im Heu', () => {
    if (Q.pages.size === 3 && !Q.heftDone) { Q.heftDone = true; story.items = story.items.filter(k => k !== 'ow_seiten'); Audio.paper();
      openNote('Das Heft im Heu', 'Die drei Seiten passen genau. Zusammen ergibt es einen Brief, ungelenk, mit Bleistift:\n\n' + noteHand('An Mama.\nDer Mann in Eisen sagt, ich darf nicht nach Hause. Da schläft schon einer in meinem Bett, und er heißt wie ich.\nIch wohne jetzt im Stall. Die Frau aus Nr. 7 bringt mir Brot.\nIn dem großen Haus brennt ein Licht. Da oben wohnt die, die uns zählt.\nIch bin nicht böse auf den anderen. Sag ihm, er soll meine Jacke behalten.\n— K.') + '\n\nAuf der Rückseite, ganz klein: <i>Sommer 2009</i>.', 'ow_heft', () => { sideDone('ow_heft', 'Ein Brief an eine Mutter. Unterschrieben mit K.'); setTimeout(() => { Audio.whisper(nestP.x, 1, nestP.z, 2); subtitle('<i>… danke …</i>', 2200); }, 1200); }); return; }
    if (!Q.heftSeen) { Q.heftSeen = true; openNote('Ein Schlafplatz', 'Jemand hat hier geschlafen. Eine Decke, ein Stoffhase, ein heruntergebrannter Kerzenstumpen. Das Heu ist in der Mitte eingedrückt – so groß wie ein Kind.\n\nUnter der Decke: ein Schulheft. Name ausgeradiert. Drei Seiten sind herausgerissen.\n\nDas Heu ist noch warm.', 'ow_nest', () => { sideStart('ow_heft'); story.side.ow_heft.desc = `Seiten gefunden: ${Q.pages.size} / 3. Bring sie zurück zum Schlafplatz im Stall.`; }); }
    else toast(Q.heftDone ? 'Der Hase liegt jetzt anders. Mit dem Gesicht zur Tür.' : 'Das Heft wartet. Drei Seiten fehlen.', 3600); });
  hit(1.6, 2.2, 2.6, -123.5, 1.1, 14, 'Alter Schuppen', () => { if (!Q.pages.has('schuppen')) { toast('Zwischen Spaten und Säcken klemmt ein Blatt Papier.', 2800); setTimeout(() => owPage('schuppen'), 900); } else toast('Werkzeug, Säcke, ein Kinderspaten. Alles sauber aufgereiht, als würde gleich jemand wiederkommen.', 3800); });
  hit(4.6, 2.2, .6, -125, 1.1, 56.6, () => Q.pages.has('tor') ? 'Eisentor' : 'Eisentor (Zettel)', () => { if (!Q.pages.has('tor')) { owPage('tor'); return; }
    Audio.play('ironDoor', { gain: .35, rate: 1.3, x: -125, y: 1, z: 57, ref: 3 }); toast('Kette und Schloss. Das Schloss ist neu. Hinter dem Tor: Kiesweg, keine Spur. Oben brennt ein einziges Fenster.', 4600); }); // STORY-HOOK: Villa zunächst verschlossen
  hit(30, 4.5, .4, -125, 3.9, 57.9, 'Die Villa', () => toast(['Die Villa der Familie von Hain. Seit 1975 unbewohnt, sagen sie. Das Licht oben brennt trotzdem jede Nacht.', 'Aus dem Schornstein steigt kein Rauch. Aber das Fenster ist beschlagen – von innen.'][Math.floor(rand(0, 2))], 4600)); // STORY-HOOK: Villa/„die uns zählt“
  hit(1.8, 1.4, 1.8, -108, .8, 35.5, 'Brunnen', () => { Audio.play('stones1', { gain: .4, x: -108, y: .5, z: 35.5, ref: 2 }); toast('Du lässt einen Kiesel fallen. Er schlägt nicht auf.', 2600); setTimeout(() => { Audio.drip(-108, -.5, 35.5); Audio.whisper(-108, 0, 35.5, 1.8); subtitle('<i>… Kai? Bist du das oben?</i>', 2600); }, 2400); }); // STORY-HOOK: Brunnen – Stimmen von unten (versunkene Stadt?)
  hit(2.2, 1, 2.2, -108, .5, 13.2, 'Picknicktisch', () => toast('Acht Teller, acht Gabeln. Auf jedem Teller liegt ein Kiesel. Auf dem achten zwei.', 3800));
  hit(1.9, 1.3, .2, -129, 1.35, 21.4, 'Schwarzes Brett', () => openNote('Schwarzes Brett · Kleingartenverein', '<b>Parzellen 1–7 sind bis 31.10. zu räumen.</b> — Der Vorstand\n\n<b>VERMISST</b>: Ben Wendt, 10 J., zuletzt gesehen Parzelle 7, 28.7.09\n\nGartenfest fällt aus. Bitte keine Kinder nach Einbruch der Dunkelheit.\n\n' + noteHand('Wer hat die Laternen wieder angezündet? — H. W.'), 'ow_brett')); // STORY-HOOK: Ben Wendt, Parzelle 7
  hit(2.6, 2.4, 2.6, -122.8, 1.2, 36.2, 'Parzelle 7', () => { Audio.knock(); toast('Schuppen von Parzelle 7, Wendt. Durch die Ritzen: eine Kinderschaukel, abmontiert, sorgfältig in Zeitung eingewickelt.', 4600); });
  hit(3.2, 2.6, 3.2, -107.2, 1.3, 25, () => Q.matches ? 'Laube' : 'Laube (Licht)', () => { if (!Q.matches) { Q.matches = true; Audio.play('doorCreak', { gain: .3, rate: 1.2, x: -107, y: 1, z: 25, ref: 2 });
      openNote('In der Laube', 'Drinnen brennt eine Petroleumlampe. Niemand da. Auf dem Tisch: eine Schachtel Streichhölzer und ein Zettel, mit Reißzwecke auf das Holz geheftet.\n\n' + noteHand('Wenn es dunkel wird, zündet die Laternen an, damit sie heimfinden.\nDrei. Immer drei.\n— H. W.'), 'ow_laube', () => { item('ow_streich', 'Streichhölzer', 'Aus der Laube. Die Schachtel ist feucht, aber es sind genug.'); sideStart('ow_laternen'); story.side.ow_laternen.desc = 'Zünde die drei Laternen in den Schrebergärten an (0 / 3).'; }); }
    else toast('Die Lampe in der Laube flackert. Auf dem zweiten Stuhl liegt ein Kissen, eingedrückt, als hätte eben noch jemand gesessen.', 4200); }); // STORY-HOOK: H. W. = Hilde Wendt
  lanternsQ.forEach((Lq, i) => hit(.6, .7, .6, Lq.x, .35, Lq.z, () => Lq.on ? 'Laterne' : Q.matches ? 'Laterne anzünden' : 'Laterne', () => {
    if (Lq.on) return toast('Die Flamme steht still. Kein Wind hier unten. Nur bei dir.', 3000);
    if (!Q.matches) return toast('Eine alte Sturmlaterne. Der Docht ist neu. Jemand wollte, dass sie brennt.', 3400);
    Lq.on = true; Q.lit++; Audio.play('switch1', { gain: .15, rate: 2 }); Audio.flick(); story.side.ow_laternen.desc = `Zünde die drei Laternen in den Schrebergärten an (${Q.lit} / 3).`;
    if (Q.lit < 3) toast(Q.lit === 1 ? 'Die Laterne brennt. Irgendwo im Garten knackt ein Zweig.' : 'Zwei. Hinter dir, auf dem Kies: leise Schritte. Sie bleiben stehen, als du dich umdrehst.', 4200);
    if (Q.lit === 2) for (let k = 0; k < 4; k++) setTimeout(() => { const g = flatDir(); Audio.stepAt(player.pos.x - g.x * 3.5, player.pos.z - g.z * 3.5, .3); }, 700 + k * 480);
    if (Q.lit === 3) { Q.laternDone = true; story.items = story.items.filter(k => k !== 'ow_streich'); OW.villaDark = 18; setTimeout(() => { Audio.slam(); subtitle('Oben in der Villa geht das Licht aus. Dann, auf dem Kiesweg zum Tor: Schritte. Kleine. Viele. Sie gehen nicht zu dir. Sie gehen heim.', 6500); }, 1400);
      setTimeout(() => sideDone('ow_laternen', 'Drei Laternen brennen. Die Schritte gingen zur Villa.'), 6000); story.lore.push({ key: 'ow_laternen', title: 'Drei Laternen', html: 'Hilde Wendt hat jede Nacht drei Laternen in den Schrebergärten angezündet, „damit sie heimfinden“. Als die dritte brannte, erlosch das Licht in der Villa. Kleine Schritte gingen auf das Tor zu.' }); } }));
  hit(4.4, 2.2, 4.4, -132, 1.1, -20.5, 'Traktor', () => toast('Der Schlüssel steckt. Der Tank ist leer, der Sitz nass. Auf dem Kotflügel, mit Kreide: ein Pfeil nach Osten. Zur Tankstelle.', 4400)); // STORY-HOOK: Verbindung Hof ↔ Tankstelle
  hit(1.9, .9, 1, -121.6, .45, -18.6, 'Fahrrad', () => toast('Ein rotes Damenrad. Am Gepäckträger ein Aufkleber, halb abgerissen: „L. B. – 4b“. Lenas Rad. Es stand nie hier. Es stand bei euch im Keller.', 5200)); // STORY-HOOK: Lenas Fahrrad
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
      const dS = dist2(100, 8); G.buzzT -= dt; if (dS < 14 && G.buzzT < 0) { G.buzzT = rand(2.5, 6); Audio.play('buzz', { gain: .12 * (1 - dS / 14), rate: rand(.9, 1.1), x: 99.6, y: 4.6, z: 8.2, ref: 2 }); }
      // Kiosk: bei Annäherung geht drinnen das Licht an – für einen Augenblick steht jemand hinter dem Tresen
      const Kk = G.kiosk; let kl = ch3dark ? 0 : (Math.random() < .02 ? .2 : 1);
      if (Kk.st === 'idle' && !Kk.done && calm() && dist2(112, 22) < 9 && lookAt(111, 1.6, 26.5, .85)) { Kk.st = 'dark'; Kk.t = 0; Kk.done = true; Audio.buzz(111, 3, 28); }
      if (Kk.st === 'dark') { Kk.t += dt; kl = 0; if (Kk.t > 1.4) { Kk.st = 'show'; Kk.t = 0; OW.sil.visible = true; Audio.bell(113, 25); } }
      else if (Kk.st === 'show') { Kk.t += dt; kl = Math.random() < .3 ? .4 : 1.2; if (Kk.t > .7) { Kk.st = 'gone'; Kk.t = 0; OW.sil.visible = false; kl = 0; Audio.stinger(false); } }
      else if (Kk.st === 'gone') { Kk.t += dt; kl = 0; if (Kk.t > 2.5) { Kk.st = 'idle'; toast('Das Licht im Kiosk ist wieder an. Der Tresen ist leer. Auf ihm liegt jetzt ein Pappbecher mehr.', 4200); } }
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

  OW.stats = { ms: Math.round(performance.now() - t0) };
  OW.dbg = { R, regions, barnRect, barnDoor, nestP, vbb, villaLit: !!villaLit, farmhouse };
  window.ausbau_ost_west_OW = OW; // Test-/Debug-Zugriff
  OW.on = true;
}]);
WORLD_TICK.push((dt, t, indoor) => { const OW = ausbau_ost_west_OW; if (OW.on && OW.tick) OW.tick(dt, t, indoor); });
