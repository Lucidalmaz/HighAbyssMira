// =====================================================================  INNENRÄUME ORT (Modul innen_ort)
// Haus Nr. 7 (Hilde Wendt), Haus Nr. 1 (Elternhaus) und der Keller unter Nr. 7:
// gebaute Möbel-Kisten → Scan-Modelle (Sofa, Stühle, Eisenbetten, Küchenbuffet, Regale, Röhrenfernseher, Stehlampe,
// Pendeluhr auf 03:13, Röhrenradio, Bilderrahmen, viktorianischer Spiegel, Kinderbett, Puppe, Spielzeug, Kerzen, Vorhänge,
// Fenster, Werkbank, Müllsäcke …). Alle Story-Objekte (Zeitung, Kalender, Kühlschrankzettel, Fotos + Kerzen, Spieluhr,
// Schublade, Kleiderschrank, Fotoalbum, Kellertür, Tastenfeld, Tonband) bleiben funktionsfähig und an plausibler Stelle.
// Jeder Raum bekommt Entdeckbares. Stellen für die überarbeitete Story sind mit „STORY-HOOK“ markiert.
const innen_ort_S = { ready: false };
WORLD_MODS.push(['Innenräume (Nr. 7, Nr. 1, Keller)', async () => {
  const S = innen_ort_S, T = THREE, V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
  const t0 = performance.now();

  // ------------------------------------------------------------------ Werkzeuge
  scene.updateMatrixWorld(true);
  const bx = new T.Box3();
  // Alle Meshes in den drei Bereichen (für das gezielte Ersetzen der alten Kisten)
  const REG = [[19.5, 32.5, -22.5, -11.5], [-56.5, -43.5, -22.5, -11.5], [294, 306, 295, 305]];
  const pool = [];
  scene.traverse(o => { if (!o.isMesh) return; bx.setFromObject(o); if (bx.isEmpty()) return; const c = bx.getCenter(V()), s = bx.getSize(V());
    if (s.x < 9 && s.z < 9 && REG.some(r => c.x > r[0] && c.x < r[1] && c.z > r[2] && c.z < r[3])) pool.push({ m: o, c, s }); });
  const nr = (a, b, tol) => Math.abs(a - b) < tol;
  const find = (x, y, z, sz, tol = .035) => pool.filter(e => nr(e.c.x, x, tol) && nr(e.c.y, y, tol) && nr(e.c.z, z, tol) && (!sz || (nr(e.s.x, sz[0], tol) && nr(e.s.y, sz[1], tol) && nr(e.s.z, sz[2], tol)))).map(e => e.m);
  const unOcc = m => { const i = occluders.indexOf(m); if (i >= 0) occluders.splice(i, 1); };
  const hide = m => { if (m) { msHide(m); unOcc(m); } };
  S.miss = [];
  const hideAt = (x, y, z, sz, tol) => { const r = find(x, y, z, sz, tol); if (!r.length) S.miss.push([x, y, z].join(',')); r.forEach(hide); return r; };
  const bbox = o => { o.updateMatrixWorld(true); return new T.Box3().setFromObject(o); };
  // Modell in Gruppe hüllen, drehen, an Kanten/Mitte ausrichten, Unterkante auf y (oder Mitte yc / Oberkante top)
  const put = (o, p, parent) => {
    const g = new T.Group(); g.add(o);
    if (p.s !== undefined) { if (typeof p.s === 'number') o.scale.multiplyScalar(p.s); else o.scale.multiply(V(...p.s)); }
    if (p.rx) o.rotation.x += p.rx; if (p.rz) o.rotation.z += p.rz;
    g.rotation.y = p.ry || 0; const b = bbox(g);
    let dx = (p.x ?? 0) - (b.min.x + b.max.x) / 2, dz = (p.z ?? 0) - (b.min.z + b.max.z) / 2;
    if (p.minX !== undefined) dx = p.minX - b.min.x; if (p.maxX !== undefined) dx = p.maxX - b.max.x;
    if (p.minZ !== undefined) dz = p.minZ - b.min.z; if (p.maxZ !== undefined) dz = p.maxZ - b.max.z;
    let dy = (p.y ?? 0) - b.min.y; if (p.yc !== undefined) dy = p.yc - (b.min.y + b.max.y) / 2; if (p.top !== undefined) dy = p.top - b.max.y;
    g.position.set(dx, dy, dz); (parent || scene).add(g);
    g.traverse(m => { if (m.isMesh) { m.castShadow = p.shadow !== false; m.receiveShadow = true; } });
    g.updateMatrixWorld(true); return g;
  };
  // Höhe einer Oberfläche (Sitzfläche, Regalboden, Matratze …) per Strahl von oben
  const rc = new T.Raycaster();
  const surfY = (obj, x, z, from = 3, fallback = Y) => { obj.updateMatrixWorld(true); rc.set(V(x, from, z), V(0, -1, 0)); rc.far = 6; const h = rc.intersectObject(obj, true)[0]; return h ? h.point.y : fallback; };
  const meshes = o => { const r = []; o.traverse(m => { if (m.isMesh) r.push(m); }); return r; };
  const firstMesh = (o, re) => meshes(o).find(m => !re || re.test(m.name)) || meshes(o)[0];
  // Texturen (einmal laden, Wiederholung per Klon – teilt sich den Grafikspeicher)
  const TL0 = new T.TextureLoader(), tBase = new Map();
  const tLoad = (path, srgb) => { const k = path + '|' + srgb; if (!tBase.has(k)) tBase.set(k, TL0.loadAsync('assets/ms/' + path).then(t => { t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; return t; })); return tBase.get(k); };
  const tRep = async (path, srgb, rx = 1, ry = rx) => { const t = (await tLoad(path, srgb)).clone(); t.repeat.set(rx, ry); t.needsUpdate = true; return t; };
  const surf = async (key, { rx = 1, ry = rx, tint = 0xffffff, alpha = false, nrm = 1, rough = 1, roughMap = true, side = T.FrontSide } = {}) => {
    const m = new T.MeshStandardMaterial({ map: await tRep(key + (alpha ? '/b.png' : '/b.jpg'), true, rx, ry), normalMap: await tRep(key + '/n.jpg', false, rx, ry), color: tint, roughness: rough, side });
    if (roughMap) m.roughnessMap = await tRep(key + '/orm.jpg', false, rx, ry);
    m.normalScale.set(nrm, nrm);
    if (alpha) { m.transparent = true; m.alphaTest = .04; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -4; }
    return m; };
  // weiche Randmaske (nur Alpha – sichtbar bleibt der Scan)
  const softMask = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 6, 64, 64, 63); g.addColorStop(0, '#fff'); g.addColorStop(.5, '#aaa'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    x.globalCompositeOperation = 'multiply'; for (let i = 0; i < 26; i++) { const r = rand(6, 22), px = rand(10, 118), py = rand(10, 118), gg = x.createRadialGradient(px, py, 0, px, py, r); gg.addColorStop(0, '#555'); gg.addColorStop(1, '#fff'); x.fillStyle = gg; x.fillRect(px - r, py - r, r * 2, r * 2); } return new T.CanvasTexture(c); })();
  const decMats = new Map();
  const decMat = async (key, tint = 0xffffff, op = 1) => { const k = key + tint + op; if (!decMats.has(k)) { const g = key === 'grime'; const m = await surf(key, { alpha: true, tint, rx: g ? .38 : 1, ry: g ? .38 : 1 });
    if (g) { for (const t of [m.map, m.normalMap, m.roughnessMap]) if (t) t.offset.set(.31, .44); m.alphaMap = softMask; } m.opacity = op; decMats.set(k, m); } return decMats.get(k); };
  // Abziehbild (Schmutz, Wasserflecken, Blut): face = Richtung, in die die Fläche zeigt
  const decal = async (par, key, w, h, x, y, z, face, rot = 0, tint, op) => {
    const p = new T.Mesh(new T.PlaneGeometry(w, h), await decMat(key, tint, op));
    if (face === 'floor') p.rotation.set(-PI / 2, 0, rot); else if (face === 'ceil') p.rotation.set(PI / 2, 0, rot);
    else p.rotation.set(0, { '+z': 0, '-z': PI, '+x': PI / 2, '-x': -PI / 2 }[face], rot, 'YXZ');
    p.position.set(x, y, z); p.renderOrder = 1; p.receiveShadow = true; par.add(p); return p; };
  // Farbe entsättigen (gleiches Möbel, anderes Haus)
  const desat = (o, sat) => o.traverse(m => { if (!m.isMesh) return; [].concat(m.material).forEach(mt => { if (mt.userData.ioDesat) return; mt.userData.ioDesat = 1;
    mt.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\n{ float ioL = dot(diffuseColor.rgb, vec3(.299, .587, .114)); diffuseColor.rgb = mix(vec3(ioL), diffuseColor.rgb, ${sat.toFixed(2)}); }`); };
    mt.customProgramCacheKey = () => 'io_desat' + sat.toFixed(2); mt.needsUpdate = true; }); });
  const FBX = (k, spec, f) => msFBX(k, f || 'model.fbx', spec);
  const GL = async (k, f) => (await msModel(k, f)).clone(true);
  // Einzelne Teile aus Sammel-Modellen (Kerzen, Spielzeug) herauslösen: Boden-Mitte auf 0
  const part = (src, name, s) => { src.updateMatrixWorld(true); const m = meshes(src).find(q => q.name === name); if (!m) return null;
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); g.scale(s, s, s); g.computeBoundingBox(); g.computeBoundingSphere();
    const r = new T.Mesh(g, m.material); r.name = name; r.castShadow = true; r.receiveShadow = true; return r; };
  const vls = []; // eigene Lichter (werden mit dem Raum aus-/eingeblendet)
  const light = (par, color, i, d, x, y, z) => { const L = new VLight(color, i, d, 2); L.position.set(x, y, z); scene.add(L); vls.push({ L, par, base: i }); return L; };
  const G7 = new T.Group(), G1 = new T.Group(), GB = new T.Group(); G7.name = 'io_nr7'; G1.name = 'io_nr1'; GB.name = 'io_keller'; scene.add(G7, G1, GB);
  const onceFlags = {};

  // ------------------------------------------------------------------ Modelle vorladen (parallel)
  const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg` });
  const hutchSpec = tint => ({ 'Wood-1': { ...W_('Wood-1'), color: tint }, 'Wood-2': { ...W_('Wood-2'), color: tint }, 'Wood-3': { ...W_('Wood-3'), color: tint }, Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } });
  const bedSpec = (blanket = 0xffffff) => ({ blanket: { b: 'blanket_color.jpg', n: 'blanket_nrm.jpg', r: 'blanket_rough.jpg', ds: 1, color: blanket }, mattress: { b: 'mattress_color.jpg', n: 'mattress_nrm.jpg', r: 'mattresss_rough.jpg', color: 0xb8b0a4 }, bed: { b: 'bed_color.jpg', n: 'bed_nrm.jpg', r: 'bed_Rough.jpg', m: 'bed_metalic.jpg' } });
  const chairSpec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
  const sheerSpec = tint => ({ '*': { b: 'DefaultMaterial_Base_color.png', n: 'DefaultMaterial_Normal_DirectX.jpg', r: 'DefaultMaterial_Roughness.png', a: 'DefaultMaterial_Opacity.png', ds: 1, transparent: true, alphaTest: .02, flipN: true, color: tint } });
  const retroSpec = { '*': { b: 'curtainroom_01_-_Default_BaseColor.jpg', n: 'curtainroom_01_-_Default_Normal.jpg', r: 'curtainroom_01_-_Default_Roughness.jpg', ds: 1, color: 0x9a8a80 } };
  const candleSpec = { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } };
  const toySpec = { '*': { b: 'T_Toys_BaseColor.jpg', n: 'T_Toys_Normal.jpg', r: 'T_Toys_ORM.jpg', ao: 'T_Toys_ORM.jpg' } };
  await msFBX('chair', 'model.fbx', chairSpec); // FBX-Lader anlegen
  await Promise.all([
    ...['wardrobe', 'floorlamp', 'wallclock', 'radio', 'frame_dmg', 'frame_deco', 'shelf', 'metaltable', 'trashbag', 'window', 'door1', 'jerrycan', 'giraffe'].map(k => msModel(k).catch(e => console.warn('innen_ort Modell ' + k, e))),
    msModel('crt', 'model.glb').catch(e => console.warn('innen_ort Modell crt', e)), msModel('teddy_scan', 'model.glb').catch(e => console.warn('innen_ort Modell teddy_scan', e)),
    ...['sofa', 'hospbed', 'dresser', 'mirror', 'crib', 'doll', 'curtain_retro', 'curtain_sheer', 'candles', 'toys_old'].map(k => msFBX(k, 'model.fbx', {}).catch(e => console.warn('innen_ort Modell ' + k, e)))]);
  S.tLoad = Math.round(performance.now() - t0);

  // ------------------------------------------------------------------ gemeinsame Bausteine
  const shelfModel = async (par, p) => put(await GL('wardrobe'), p, par);          // offenes Holzregal 1,95 m
  const chair = async (par, p) => { const c = await FBX('chair', chairSpec); msFit(c, .92, 'y'); return put(c, p, par); };
  const trashbag = async (par, p) => put(await GL('trashbag'), p, par);
  // Unterschrank: das Küchenbuffet ohne Aufsatz (Aufsatz wird in die Arbeitsplatte „eingeklappt“ → exakte Kollision, keine Kanten)
  const lowerCab = async (tint = 0xffffff, sat = 1, h = .92) => { const o = await FBX('dresser', hutchSpec(tint));
    o.traverse(m => { if (!m.isMesh) return; m.geometry = m.geometry.clone(); const P = m.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) if (P.getY(i) > 409.5) { P.setY(i, 405); P.setX(i, Math.min(267, Math.max(-288, P.getX(i)))); P.setZ(i, Math.min(123, Math.max(-114, P.getZ(i)))); }
      P.needsUpdate = true; m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); });
    if (sat < 1) desat(o, sat); msFit(o, h, 'y'); return o; };
  const hutch = async (tint = 0xffffff, sat = 1, h = 2.2) => { const o = await FBX('dresser', hutchSpec(tint)); if (sat < 1) desat(o, sat); msFit(o, h, 'y'); return o; };
  const bed = async (par, blanket, s, p, mirror = false) => { const o = await FBX('hospbed', bedSpec(blanket)); o.scale.set(mirror ? -s : s, s, -s); return put(o, p, par); };
  // Pendeluhr: Zeiger fest auf 03:13, das Pendel schwingt trotzdem
  const clocks = [];
  const clock = async (par, p, text) => {
    const o = await GL('wallclock'); o.updateMatrixWorld(true); const ctr = V(.05, 71.9, 5.08), byName = {}; meshes(o).forEach(m => byName[m.name] = m);
    const tip = m => { const P = m.geometry.attributes.position, v = V(); let best = 0, ang = 0; for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); const dx = v.x - ctr.x, dy = v.y - ctr.y, d = dx * dx + dy * dy; if (d > best) { best = d; ang = Math.atan2(dx, dy); } } return ang; };
    const hand = (m, target) => { if (!m) return; const cur = tip(m), piv = new T.Group(); piv.position.copy(ctr); o.add(piv); o.updateMatrixWorld(true); piv.updateMatrixWorld(true); piv.attach(m); piv.rotation.z = -(target - cur); };
    hand(byName.defaultMaterial_1, 13 / 60 * PI * 2); hand(byName.defaultMaterial_2, (3 + 13 / 60) / 12 * PI * 2);
    let pend = null; if (byName.defaultMaterial_3) { pend = new T.Group(); pend.userData.ioDyn = true; pend.position.set(-.7, 54.1, 1.8); o.add(pend); o.updateMatrixWorld(true); pend.updateMatrixWorld(true); pend.attach(byName.defaultMaterial_3); }
    o.scale.setScalar(.01); const g = put(o, p, par); const body = byName.defaultMaterial_4 || firstMesh(o);
    interact(body, 'Pendeluhr', () => { toast(text, 5200); const q = body.getWorldPosition(new THREE.Vector3()); Audio.play('woodHit3', { gain: .12, rate: .5, x: q.x, y: q.y, z: q.z, ref: 2 }); });
    const c = { g, pend, ph: rand(0, 6), tk: 0, pos: bbox(g).getCenter(V()) }; clocks.push(c); return c; };
  // Bilderrahmen (leer – die Bilder fehlen)
  const frame = async (par, key, p) => put(await GL(key), p, par);
  // Fenster von innen: Scan-Rahmen, dahinter Nacht (blitzt bei Gewitter auf), davor Gardine (und ggf. Vorhänge)
  const nightMats = [];
  const nightMat = () => { const m = new T.MeshStandardMaterial({ color: 0x030507, roughness: .32, metalness: 0, emissive: 0x0a1018, emissiveIntensity: .8 }); nightMats.push(m); return m; };
  const winIn = async (par, x, wallZ, face, { yc = 1.85, sy = .72, curt = 'sheer', tint = 0xd8d2c4 } = {}) => {
    const dir = face === '-z' ? -1 : 1, ry = face === '-z' ? PI : 0, H = 2.03 * sy;
    const glass = new T.Mesh(new T.PlaneGeometry(1.04, H - .12), nightMat()); glass.position.set(x, yc, wallZ + dir * .004); glass.rotation.y = ry; par.add(glass);
    const f = await GL('window'); f.scale.set(.92, sy, 1); const gf = put(f, { x, yc, ...(dir < 0 ? { maxZ: wallZ - .003 } : { minZ: wallZ + .003 }), ry }, par);
    const top = yc + H / 2 + .13;
    if (curt === 'sheer' || curt === 'both') { const c = await FBX('curtain_sheer', sheerSpec(tint)); c.scale.set(.0153, .0142 * (H + .25) / 1.55, .012);
      meshes(c).forEach(m => { m.material.depthWrite = false; m.castShadow = false; });
      put(c, { x, top, ...(dir < 0 ? { maxZ: wallZ - .115 } : { minZ: wallZ + .115 }), ry }, par); }
    if (curt === 'both' || curt === 'retro') for (const s of [-1, 1]) { const c = await FBX('curtain_retro', retroSpec);
      meshes(c).forEach(m => { if (m.name === 'Cylinder001' || m.name === 'Torus026') m.parent.remove(m); });
      c.scale.set(.0055, .0152 * (H + .25) / 1.45, .012); put(c, { x: x + s * .72, top: top - .02, ...(dir < 0 ? { maxZ: wallZ - .21 } : { minZ: wallZ + .21 }), ry }, par); }
    return gf; };
  // Kerzen (aus dem Kerzen-Set); lit = brennt (Flamme + Licht)
  const candleSrc = await FBX('candles', candleSpec);
  const flames = [];
  const candle = (par, name, x, y, z, lit = true, s = .01) => {
    const c = part(candleSrc, name, s); if (!c) return null; c.position.set(x, y, z); c.rotation.y = rand(0, 6); par.add(c); c.updateMatrixWorld(true);
    if (lit) { const top = y + c.geometry.boundingBox.max.y; const fl = new T.Sprite(new T.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
      fl.scale.set(.05, .085, 1); fl.position.set(x, top + .035, z); par.add(fl); flames.push({ fl, seed: rand(0, 9), L: null }); }
    return c; };
  // Fotos der Kinder: Hildes Kerzen sind jetzt echte, heruntergebrannte Stumpenkerzen (Flamme, Licht und Auslöschen bleiben)
  for (const i of [3, 4, 5, 6]) { const C = PHOTOS[i] && PHOTOS[i].candle; if (!C || !C.g) continue; C.g.children.forEach(ch => { if (ch.isMesh && ch.geometry.type === 'CylinderGeometry') ch.visible = false; });
    const cm = part(candleSrc, 'Candle_large_small_used_low', .01); if (!cm) continue; cm.rotation.y = rand(0, 6); C.g.add(cm); const h = cm.geometry.boundingBox.max.y; C.flame.position.y = h + .03; C.light.position.y = h + .09; }
  const cobSrc = pool.map(e => e.m).find(m => m.material && m.material.transparent && m.material.map && m.material.color && m.material.color.getHex() === 0xd8d4c8 && m.geometry.type === 'BufferGeometry');
  // QA-Art 09.10.: alle Netze waren Klone EINER Netzform, immer genau im 45°-Winkel in der Ecke – jetzt jede Form des Fab-Sets, Lage/Größe/Neigung je Netz leicht anders, manche Ecken bleiben frei
  const cobGeos = []; if (cobSrc) scene.traverse(o => { if (o.isMesh && o.material === cobSrc.material && !cobGeos.includes(o.geometry)) cobGeos.push(o.geometry); });
  const web = (par, x, y, z, ry, s = 1) => { if (!cobSrc || (s < .9 && Math.random() < .2)) return; const w = cobSrc.clone(); if (cobGeos.length > 1) w.geometry = cobGeos[Math.floor(rand(0, cobGeos.length))];
    w.position.set(x + rand(-.06, .06), y - rand(0, .18), z + rand(-.06, .06)); w.rotation.set(rand(-.12, .12), ry + rand(-.22, .22), rand(-.35, .35)); w.scale.setScalar(.0105 * s * rand(.8, 1.15)); par.add(w); };

  // =====================================================================  HAUS NR. 7 – HILDE WENDT
  // ---------- Wohnzimmer (x 20.2…25.9, z −16.9…−12.2)
  hideAt(21, .68, -15.3, [2.4, .45, .95]); hideAt(21, .98, -15.8, [2.4, .6, .25]); hideAt(23.3, .64, -15.1, [1.2, .42, .7]);
  hideAt(21.3, .73, -12.6, [1.4, .6, .5]); hideAt(21.3, 1.41, -12.62, [1, .75, .55]); hideAt(25.3, 1.18, -16.5, [.05, 1.5, .05]); shade.visible = false;
  hideAt(20.35, 1.38, -13.6, [.3, 1.9, 1.2]); for (const y of [.93, 1.38, 1.83, 2.28]) hideAt(20.4, y, -13.6);
  const sofa = await FBX('sofa', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0xa09488 } }); msFit(sofa, 2.0, 'x');
  const gSofa = put(sofa, { x: 24.8, minZ: -16.87, y: Y }, G7);
  // Fernseh-Regal an der Front (rechts der Haustür), Röhrenfernseher im Mittelfach
  const gTVs = await shelfModel(G7, { x: 24.72, maxZ: -12.21, y: Y, ry: PI / 2 });
  const midY = surfY(gTVs, 24.72, -12.47, Y + 1.6), lowY = surfY(gTVs, 24.72, -12.47, Y + .8), topY = surfY(gTVs, 24.72, -12.47, Y + 2.6);
  const crt = await GL('crt', 'model.glb'); crt.scale.setScalar(1.45); const gTV = put(crt, { x: 24.66, z: -12.5, y: midY, ry: PI / 2 }, G7);
  { const b = bbox(gTV); tvScreen.position.set((b.min.x + b.max.x) / 2, b.min.y + (b.max.y - b.min.y) * .535, b.min.z - .004); tvScreen.scale.set(.42 / .8, .31 / .58, 1);
    tvLight.position.set(tvScreen.position.x, tvScreen.position.y, tvScreen.position.z - .8); }
  // Dinas Foto + Kerze: im Regal neben dem Fernseher (Hildes kleiner Altar)
  PHOTOS[3].mesh.position.set(25.2, midY + .006, -12.5); PHOTOS[3].candle.g.position.set(24.2, midY, -12.48);
  { const f = await GL('frame_deco'); f.rotation.x = -.22; f.scale.setScalar(.55); put(f, { x: 24.45, maxZ: -12.28, y: lowY, ry: PI }, G7);
    const f2 = await GL('frame_dmg'); f2.rotation.x = -.18; f2.scale.setScalar(.6); put(f2, { x: 25.05, maxZ: -12.3, y: lowY, ry: PI + .05 }, G7); }
  const toysSrc = await FBX('toys_old', toySpec);
  const toy = (name, par, x, y, z, ry, s = .01) => { const t = part(toysSrc, name, s); if (!t) return null; t.position.set(x, y, z); t.rotation.y = ry; par.add(t); return t; };
  const robot = toy('SM_ToyRobot', G7, 25.18, topY, -12.47, PI + .35); toy('SM_ToyBoat', G7, 24.35, topY, -12.5, PI - .5);
  if (robot) interact(robot, 'Blechroboter', () => toast('Ein Blechroboter. Auf der Unterseite, mit rotem Nagellack: ZAYN. Kein Staub darauf – als hätte ihn jemand erst heute Nacht hingestellt.', 5600)); // STORY-HOOK: Zayn Wendt
  // Stehlampe am Fenster (trägt das Wohnzimmerlicht), Hildes Stuhl mit Blick auf die Kreuzung
  const gLamp = put(await GL('floorlamp'), { x: 20.58, z: -13.35, y: Y, ry: .6 }, G7);
  let shadeMat = null; { const ms = meshes(gLamp).map(m => ({ m, y: bbox(m).max.y })).sort((a, b) => b.y - a.y); const sm = ms[0].m; shadeMat = sm.material.clone(); shadeMat.emissive = new T.Color(0xffa050); shadeMat.emissiveMap = shadeMat.map; shadeMat.emissiveIntensity = .55; sm.material = shadeMat; }
  livingLight.position.set(20.58, Y + 1.42, -13.35);
  const gWChair = await chair(G7, { x: 21.45, z: -13.05, y: Y, ry: .18 });
  interact(firstMesh(gWChair), 'Stuhl am Fenster', () => toast('Hildes Stuhl. Er steht so, dass man durch die Gardine genau auf die Kreuzung sieht. Auf dem Fensterbrett: Striche in Fünfergruppen. Hunderte.', 6200)); // STORY-HOOK: Hilde zählt die Kinder
  zbook.position.set(21.45, surfY(gWChair, 21.45, -13.05, 2) + .025, -13.05); zbook.rotation.y = .4;
  // Zeitung liegt jetzt aufgeschlagen auf dem Sofa
  newspaper.position.set(24.25, surfY(gSofa, 24.25, -16.05) + .012, -16.05);
  // Teppich (Scan-Stoff statt Einfarbfläche), Pendeluhr, leere Bilderrahmen
  { const rug = find(22.5, .43, -15, [3.2, 0, 2.2])[0]; if (rug) { rug.material = await surf('wallpaper_fabric', { rx: 1.6, ry: 1.1, tint: 0x8a7064, nrm: .6 }); rug.position.set(24.2, Y + .004, -14.3); } }
  await clock(G7, { minX: 20.21, z: -15.35, yc: Y + 1.9, ry: PI / 2 }, 'Drei Uhr dreizehn. Die Zeiger sind festgerostet. Das Pendel schwingt trotzdem.');
  const gFr1 = await frame(G7, 'frame_dmg', { x: 24.2, minZ: -16.89, yc: Y + 1.62, rz: .07 });
  await frame(G7, 'frame_deco', { x: 25.33, minZ: -16.89, yc: Y + 1.72, rz: -.05, s: .78 });
  try { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 320; const x = cv.getContext('2d'); x.filter = 'blur(7px)'; x.fillStyle = 'rgba(238,230,208,.55)'; x.fillRect(26, 30, 204, 260); x.filter = 'none'; for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(238,230,208,${Math.random() * .06})`; x.fillRect(Math.random() * 256, Math.random() * 320, 30, 3); }
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; const fl = new T.Mesh(new T.PlaneGeometry(.58, .72), new T.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, roughness: 1 })); fl.position.set(24.2, Y + 1.62, -16.893); fl.userData.noCol = true; fl.renderOrder = 1; G7.add(fl); } catch (e) { console.warn('Basis-Umsetzung Rahmenfleck', e); }
  interact(firstMesh(gFr1), 'Leerer Bilderrahmen', () => toast('Der Rahmen ist leer. Dahinter ein hellerer Fleck auf der Tapete – das Bild hing hier jahrelang. Jemand hat es vor Kurzem abgenommen.', 5600));
  const gWin7 = await winIn(G7, 21.4, -12.2, '-z', { curt: 'both' });
  try { // Basis-Umsetzung: Hildes Striche auf dem Fensterbrett (Fünfergruppen, Hunderte)
    const sy = surfY(gWin7, 21.4, -12.33, Y + 1.25, Y + 1.0), m = bu_ritz(1.0, .11, (C, B, W, H, ppm) => { let n = 0; for (let row = 0; row < 2; row++) for (let g = 0; g < 21 && n < 41; g++, n++) { const gx = W * .03 + g * ppm * .0455 + (row ? ppm * .02 : 0), gy = H * (row ? .56 : .08), al = ritz_R(.55, 1);
          for (let k = 0; k < 4; k++) ritz_strich(C, B, [[gx + k * ppm * .0065 + ritz_RN(), gy + ritz_RN()], [gx + k * ppm * .0065 + ritz_RN() * 1.3, gy + ppm * .036 + ritz_RN()]], 26, 'ritz', al); ritz_strich(C, B, [[gx - ppm * .004, gy + ppm * .029], [gx + ppm * .028, gy + ppm * .005]], 26, 'ritz', al); } }, { ppm: 1100, seed: 5, bump: 2.4 });
    m.rotation.set(-PI / 2, 0, 0); m.position.set(21.4, sy + .002, -12.325); G7.add(m); } catch (e) { console.warn('Basis-Umsetzung Fensterbrett', e); }
  await decal(G7, 'grime', 1.8, .9, 22.1, Y + .45, -16.893, '+z', 0, 0x807060, .8);
  await decal(G7, 'grime', 1.4, 1.4, 25.2, 3.196, -12.9, 'ceil', 1.2, 0x7a6a50, .7);
  await decal(G7, 'grime', 1.0, 1.6, 25.893, Y + 2.1, -12.8, '-x', 0, 0x807060, .6);
  web(G7, 25.72, Y + 2.55, -16.72, PI / 4, .8); web(G7, 20.4, Y + 2.5, -16.7, -PI / 4, .7); web(G7, 25.72, Y + 2.2, -12.4, -PI / 4, .5);

  // ---------- Küche (x 26.1…31.8, z −16.9…−12.2)
  hideAt(29, .89, -12.55, [5.6, .92, .7]); hideAt(29, 1.38, -12.55, [5.6, .05, .74]); hideAt(28.3, .8, -15, [1.2, .75, .8]); hideAt(27.4, .88, -15, [.45, .9, .45]); hideAt(29.2, .88, -15, [.45, .9, .45]);
  // Kühlschrank: kein Modell im Katalog → Emaille-Oberfläche (Scan) + Schmutz
  // QA M-14: Kühlschrank als Blender-Modell (ms/kuehlschrank_nr7: Emaille-Korpus, Gefrierfachtür, Chromgriff, Alterung); Box + Canvas-/Scan-Emaille bleiben nur als Rückfall
  let kuehlModell = null; try { kuehlModell = await msModel('kuehlschrank_nr7', 'model.glb').then(m => m.clone(true)); } catch (e) { kuehlModell = null; }
  if (kuehlModell) { const fr = find(31.4, 1.43, -16.4, [.9, 2, .8])[0]; if (fr) hide(fr); kuehlModell.position.set(31.4, Y, -16.4); kuehlModell.rotation.y = -PI / 2; kuehlModell.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); G7.add(kuehlModell); }
  else {
  { const fr = find(31.4, 1.43, -16.4, [.9, 2, .8])[0]; if (fr) { fr.material = new T.MeshStandardMaterial({ map: await tRep('wall_plaster/b.jpg', true, .5, 1), normalMap: await tRep('wall_plaster/n.jpg', false, .5, 1), color: 0xd4ccbb, roughness: .42, metalness: .05 }); fr.material.normalScale.set(.4, .4); } }
  }
  await decal(G7, 'grime', .8, 1.2, 30.945, Y + .6, -16.35, '-x', PI, 0x6a5a48, .9);
  if (!kuehlModell) { const hm = new T.MeshStandardMaterial({ color: 0xa8a8a0, metalness: 1, roughness: .38 }), h = new T.Mesh(new T.BoxGeometry(.035, .34, .03), hm); h.position.set(30.93, Y + 1.2, -16.07); h.castShadow = true; G7.add(h);
    const sm = new T.Mesh(new T.PlaneGeometry(.8, .01), new T.MeshBasicMaterial({ color: 0x1a1814 })); sm.position.set(30.946, Y + 1.58, -16.4); sm.rotation.y = -PI / 2; G7.add(sm); }
  let cabW = 0;
  for (let i = 0; i < 4; i++) { const c = await lowerCab(0xd8cfb8, .3); const g = put(c, { minX: 26.12 + i * cabW, maxZ: -12.21, y: Y, ry: PI }, G7); if (!cabW) { const b = bbox(g); cabW = b.max.x - b.min.x; } }
  const topK7 = Y + .92;
  const radio = await GL('radio'); meshes(radio).forEach(m => { if (m.name === 'tubes') m.parent.remove(m); });
  const gRadio = put(radio, { x: 27.95, maxZ: -12.24, y: topK7, ry: PI / 2 }, G7); gRadio.traverse(m => { if (m.isMesh) m.castShadow = false; });
  try { const tu = firstMesh(gRadio, /tuner/); if (tu) { const b = bbox(tu), c0 = b.getCenter(V()), h = bu_strahl(tu, c0.x, c0.y, c0.z - 1, 0, 0, 1, 2), p = h ? h.p : c0, n = h ? h.n : V(0, 0, -1);
      const tm = new T.Mesh(new T.PlaneGeometry(.052, .017), new T.MeshStandardMaterial({ color: 0xd8cfae, transparent: true, opacity: .8, roughness: .25, polygonOffset: true, polygonOffsetFactor: -3 })); bu_an(tm, p, n, V(0, 1, 0), .004); tm.rotateZ(.35); tm.userData.noCol = true; G7.add(tm);
      const t2 = tm.clone(); bu_an(t2, p.clone().add(V(.0, .006, 0)), n, V(0, 1, 0), .0052); t2.rotateZ(-.5); G7.add(t2); } } catch (e) { console.warn('Basis-Umsetzung Radio-Klebeband', e); }
  let radioN = 0;
  interact(firstMesh(gRadio, /case/), 'Radio einschalten', async () => { // STORY-HOOK: Radio 31,10 MHz
    if (state.talking) return; const p = bbox(gRadio).getCenter(V()); Audio.radio(p.x, p.z); Audio.play('switch1', { gain: .4, x: p.x, y: p.y, z: p.z, ref: 1.5 });
    if (radioN++) return toast('Nur Rauschen. Die Nadel zittert auf 31,10.', 3600);
    state.talking = true; await say([['*Rauschen*', 1500], ['Die Skala steht auf 31,10. Jemand hat den Knopf mit Klebeband festgeklebt.', 3600], ['„… drei … eins … drei …“', 2600, 'RADIO'], ['„… sieben … und eins …“', 2600, 'RADIO'], ['*Klick*', 800]]); state.talking = false; });
  // Tisch (Metall), ein Stuhl am Tisch, einer umgeworfen – Kratzspuren Richtung Kellertür
  { const t = await GL('metaltable'); t.scale.set(.4, .88, 1); put(t, { x: 28.2, z: -14.95, y: Y }, G7); }
  await chair(G7, { x: 27.3, z: -14.95, y: Y, ry: PI / 2 + .12 });
  { const c = await FBX('chair', chairSpec); msFit(c, .92, 'y'); c.rotation.x = -PI / 2 + .06; const g = put(c, { x: 29.75, z: -14.35, y: Y, ry: -2.3 }, G7);
    try { const k = bu_ritz(.7, 6.5, (C, B, W, H, ppm) => { for (let i = 0; i < 4; i++) { const x0 = W * (.2 + i * .19) + ritz_RN() * 3, pts = []; for (let t = 0; t <= 14; t++) pts.push([x0 + Math.sin(t * .5 + i * 2) * 3 + t * .8 * (i - 1.5), H * .96 - t * H * .066]); ritz_strich(C, B, pts.slice(0, 7 + (i * 3) % 6), 90, 'ritz', ritz_R(.75, 1)); ritz_strich(C, B, pts.slice(8), 90, 'ritz', ritz_R(.4, .8)); } }, { ppm: 200, seed: 21, bump: 2.2 });
      k.rotation.set(-PI / 2, 0, 0); k.position.set(29.85, Y + .006, -17.65); G7.add(k); } catch (e) { console.warn('Basis-Umsetzung Kratzer', e); }
    interact(firstMesh(g), 'Umgekippter Stuhl', () => toast('Umgekippt. Die Stuhlbeine haben helle Kratzer in die Dielen gezogen – in Richtung Kellertür.', 5000)); }
  const bag1 = await trashbag(G7, { x: 31.42, z: -13.35, y: Y, ry: .5 }); await trashbag(G7, { x: 31.46, z: -13.95, y: Y, ry: 2.1, s: .85 });
  try { const R_ = ausbau_nord_rng(31); for (let i = 0; i < 7; i++) { const b = bu_grablichtBecher(), x = 31.42 + (R_() - .5) * .3, z = -13.35 + (R_() - .5) * .3; b.position.set(x, surfY(bag1, x, z, Y + 1.5, Y + .75), z); b.rotation.set(R_() > .5 ? 1.2 + R_() * .5 : (R_() - .5) * .5, R_() * 6, R_() * 2); G7.add(b); }
    const sh = bu_kinderschuh(0x2c4f9c); sh.position.set(31.5, surfY(bag1, 31.5, -13.55, Y + 1.5, Y + .75) + .006, -13.55); sh.rotation.set(0, 2.2, .18); G7.add(sh); } catch (e) { console.warn('Basis-Umsetzung Müllsack', e); }
  interact(firstMesh(bag1), 'Müllsäcke', () => toast('Prall gefüllt, süßlicher Geruch. Obenauf: sieben leere Grablicht-Packungen. Und ein Kinderschuh, Größe 31.', 5400));
  FAB.flies.forEach(f => { if (nr(f.c.x, 29.8, .05) && nr(f.c.z, -16.5, .05)) f.c.set(31.4, Y + .75, -13.6); });
  await winIn(G7, 27.4, -12.2, '-z', { yc: 2.08, sy: .64 }); await winIn(G7, 30.3, -12.2, '-z', { yc: 2.08, sy: .64 });
  await decal(G7, 'grime', 1.6, 1.1, 31.1, Y + .004, -13.7, 'floor', .7, 0x5a4a38, .9); await decal(G7, 'grime', 1.2, 1.0, 30.4, Y + .004, -16.2, 'floor', 2.2, 0x5a4a38, .7);
  await decal(G7, 'grime', 2.4, .55, 28.4, Y + 1.25, -12.206, '-z', 0, 0x6a5a40, .7);
  await decal(G7, 'grime', 1.3, 1.3, 28.3, 3.196, -15.0, 'ceil', .4, 0x7a6a50, .6);
  web(G7, 31.62, Y + 2.5, -12.4, -PI / 4, .7); web(G7, 26.3, Y + 2.55, -16.7, PI / 4, .6);

  // ---------- Schlafzimmer (x 20.2…25.9, z −21.8…−17.1)
  hideAt(21.2, .68, -20.7, [2, .5, 2.2]); hideAt(21.2, .93, -21.8, [2, .8, .15]); hideAt(25, 1.53, -21.5, [1.6, 2.2, .6]);
  const gBed7 = await bed(G7, 0xa8a098, .009, { x: 21.42, minZ: -21.77, y: Y });
  try { const by = surfY(gBed7, 21.42, -20.3, Y + 1.5, Y + .6), cv = document.createElement('canvas'); cv.width = 256; cv.height = 512; const x = cv.getContext('2d'), R_ = ausbau_nord_rng(7);
    const foot = (px, py, rot, mir) => { x.save(); x.translate(px, py); x.rotate(rot); x.scale(mir ? -1 : 1, 1); x.filter = 'blur(1.2px)'; x.fillStyle = 'rgba(92,80,62,.62)'; x.beginPath(); x.ellipse(0, 18, 15, 26, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(2, 52, 11, 11, 0, 0, 7); x.fill();
      [[-16, -12, 5], [-8, -20, 5.4], [1, -23, 5.2], [10, -19, 4.8], [17, -10, 4.2]].forEach(([tx, ty, r]) => { x.beginPath(); x.arc(tx, ty - 6, r, 0, 7); x.fill(); }); x.restore(); };
    foot(70, 420, .08, false); foot(150, 330, .05, true); foot(78, 220, -.05, false); foot(148, 120, .1, true);
    const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const pr = new T.Mesh(new T.PlaneGeometry(.32, .64), new T.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: 1 })); pr.rotation.set(-PI / 2, 0, PI); pr.position.set(21.42, by + .004, -20.25); pr.userData.noCol = true; G7.add(pr);
    const gr = bu_gras([[21.3, by, -20.78], [21.5, by, -20.45], [21.34, by, -19.98], [21.46, by, -19.6]], 9); G7.add(gr); } catch (e) { console.warn('Basis-Umsetzung Bett Nr. 7', e); }
  interact(firstMesh(gBed7, /blanket/), 'Bett', () => toast('Die Decke ist zurückgeschlagen, als wäre sie mitten in der Nacht aufgestanden. Auf dem Laken: kleine, trockene Fußabdrücke. Barfuß. Grashalme darin, die hier nirgends wachsen.', 5600));
  // Zayns Kinderbett – Hilde hat es nie weggegeben
  const crib = await FBX('crib', { 'Material #2142147589': { b: '../planks_painted/b.jpg', n: '../planks_painted/n.jpg', r: '../planks_painted/orm.jpg', color: 0xcfc6b6 }, 'Material #2142147590': { b: '../hospbed/mattress_color.jpg', n: '../hospbed/mattress_nrm.jpg', color: 0xc8c0b0 }, 'Material #2142147602': { color: 0x2a2826, rough: .6 } });
  crib.scale.setScalar(.024); const gCrib = put(crib, { x: 24.9, minZ: -21.76, y: Y }, G7);
  const cribTop = surfY(gCrib, 24.9, -21.4, Y + .75);
  const gFrB = await frame(G7, 'frame_deco', { x: 24.9, minZ: -21.79, yc: Y + 1.85, rz: .04, s: .7 });
  interact(firstMesh(gFrB), 'Bilderrahmen', () => toast('Leer. Auf der Rückwand, mit Bleistift: „Zayn, 7. Sommer 2009.“ Darunter, frischer: „Er kommt zurück.“', 5600)); // STORY-HOOK
  await winIn(G7, 23, -21.8, '+z', { tint: 0xc8c0b0 });
  // Eine Kerze brennt neben dem Bett – niemand ist im Haus
  { const c = candle(G7, 'Candle_large_big_used_low001', 22.38, Y, -21.5); const L = light(G7, 0xffa048, 1.0, 3.6, 22.38, Y + .3, -21.4); flames[flames.length - 1].L = L;
    candle(G7, 'Big_Wax_leak_low', 22.5, Y + .001, -21.3, false);
    if (c) interact(c, 'Kerze', () => toast('Frisch angezündet. Das Wachs ist noch weich. Du bist allein im Haus. Oder?', 4200)); }
  await decal(G7, 'grime', 1.6, 1.2, 24.9, Y + 1.0, -21.793, '+z', 0, 0x6a5a48, .7);
  await decal(G7, 'grime', 1.2, 1.2, 21.3, 3.196, -18.4, 'ceil', 2.1, 0x7a6a50, .6);
  web(G7, 25.72, Y + 2.5, -21.62, -PI / 4 + PI / 2, .7); web(G7, 20.4, Y + 2.5, -17.3, PI / 4 + PI, .6);

  // ---------- Hauswirtschaftsraum mit Kellertür (x 26.1…31.8, z −21.8…−17.1)
  hideAt(27, .88, -21.4, [.7, .9, .7]); hideAt(27.8, .88, -21.4, [.7, .9, .7]); hideAt(31.6, 1.53, -19.5, [.4, 2.2, 1.6]);
  hideAt(31.6, .83, -19); hideAt(31.6, 1.33, -19.6); hideAt(31.6, 1.83, -19); hideAt(31.6, 2.33, -19.6);
  const gBench = put(await GL('metaltable'), { minX: 26.12, z: -19.95, y: Y, ry: PI / 2 }, G7);
  const benchTop = surfY(gBench, 26.42, -19.9, Y + 1.5);
  for (const [n, dz, dx] of [['Candle_large_small_new001', 0, 0], ['Candle_large_big_new', .12, .1], ['Candle_small_new001', -.1, .12], ['Candle_large_small_new', .05, -.12], ['Candle_thin_new', -.18, -.05], ['Candle_large_small_used_low', .25, .05]])
    candle(G7, n, 26.42 + dx, benchTop, -19.4 + dz, false);
  try { const kt = bu_karton(.42, .07, .3, 'für die Kinder – jede Nacht eins', 62); kt.position.set(26.5, benchTop, -20.2); kt.rotation.y = PI / 2 + .07; G7.add(kt); } catch (e) { console.warn('Basis-Umsetzung Karton', e); }
  { const hot = new T.Mesh(new T.BoxGeometry(.5, .2, .5), hidden); hot.position.set(26.42, benchTop + .1, -19.35); G7.add(hot);
    interact(hot, 'Grablichter', () => toast('Grablichter. Dutzende. Alle schon einmal angezündet und wieder ausgeblasen. Auf dem Karton, in Hildes Schrift: „für die Kinder – jede Nacht eins“.', 5800)); }
  const gCan = put(await GL('jerrycan'), { x: 26.45, z: -21.25, y: Y, ry: 1.3 }, G7);
  try { const sm = bu_streichholz(); sm.position.set(26.85, Y + .002, -21.05); sm.rotation.y = .6; G7.add(sm); } catch (e) { console.warn('Basis-Umsetzung Streichhölzer', e); }
  interact(firstMesh(gCan), 'Kanister', () => toast('Benzin, halb leer. Daneben eine Schachtel Streichhölzer. Wollte sie etwas verbrennen?', 4600)); // STORY-HOOK: Brand Haus Nr. 5 (Dez. 2009)?
  const gShUT = await shelfModel(G7, { maxX: 31.79, z: -19.35, y: Y, ry: PI });
  { const l = surfY(gShUT, 31.5, -19.35, Y + .8), m = surfY(gShUT, 31.5, -19.35, Y + 1.6);
    put(await GL('jerrycan'), { x: 31.5, z: -18.95, y: l, ry: -.3, s: .9 }, G7); put(await GL('jerrycan'), { x: 31.52, z: -19.7, y: l, ry: .2, s: .85 }, G7);
    candle(G7, 'Candle_large_big_used_low', 31.45, m, -19.0, false); candle(G7, 'Thin_candle_used_low', 31.5, m, -19.25, false); candle(G7, 'Candle_large_small_used_low002', 31.42, m, -19.6, false); }
  await trashbag(G7, { x: 31.25, z: -17.55, y: Y, ry: 1.1, s: .9 });
  // Kellertür: gescannte, beschlagene Holztür mit Gitterfenster (folgt Öffnen und Rütteln der alten Tür), dahinter Schwärze
  { const d = await GL('door1'); d.scale.set(1.1 / 1.055, 2.2 / 1.9, 1); meshes(d).forEach(m => { m.material = m.material.clone(); m.material.color.setHex(0x8a7c6c); });
    d.position.set(0, -1.1, 0); cellarDoor.add(d); cellarDoor.material = hidden;
    { // Der Türscan hat ein echtes Loch (fehlende Bohlen, unten rechts) – dahinter stand Tapete/Schwärze („großer schwarzer Fleck“, Foto 7). Deckende Holzrückwand hinter dem Scan, mit Ausschnitt nur am Gitterfenster (dort bleibt die Schwärze), dreht mit der Tür.
      const sh = new T.Shape(); sh.moveTo(-.54, -1.09); sh.lineTo(.54, -1.09); sh.lineTo(.54, 1.09); sh.lineTo(-.54, 1.09); sh.closePath();
      const hl = new T.Path(), hw = .45, hb = .35, ht = .99, rr = .05; hl.moveTo(-hw + rr, hb); hl.lineTo(hw - rr, hb); hl.quadraticCurveTo(hw, hb, hw, hb + rr); hl.lineTo(hw, ht - rr); hl.quadraticCurveTo(hw, ht, hw - rr, ht); hl.lineTo(-hw + rr, ht); hl.quadraticCurveTo(-hw, ht, -hw, ht - rr); hl.lineTo(-hw, hb + rr); hl.quadraticCurveTo(-hw, hb, -hw + rr, hb); sh.holes.push(hl);
      const bm = await surf('floor_wood', { rx: .55, ry: .55, tint: 0x5a4a3a }), back = new T.Mesh(new T.ShapeGeometry(sh), bm); back.position.set(.55, 0, .04); back.receiveShadow = true; cellarDoor.add(back); }
    const sc = find(30, .93, -21.77, [.9, .6, 0])[0]; if (sc) { cellarDoor.updateMatrixWorld(true); cellarDoor.attach(sc); sc.position.z += .035; if (typeof ritz_kratzer === 'function') { const f = ritz_kratzer(576, 384, { seed: 9, bueschel: 5, groesse: 100 }); sc.material = new T.MeshStandardMaterial({ ...ritz_tex(f.c, f.b), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: .8, metalness: 0 }); } } // Krallenspuren als echte Rillen mit Relief, nicht als leuchtende Linien
    const vp = new T.Mesh(new T.PlaneGeometry(1.08, 2.18), new T.MeshBasicMaterial({ color: 0x010101 })); vp.position.set(30, Y + 1.1, -21.805); /* hinter der RÜCKSEITE des Türscans (Scan z −21,96…−21,745): bei −21,797 lag die Ebene vor den eingesunkenen Bohlen und zeichnete die große schwarze Fläche auf die Tür (Foto 7) */ G7.add(vp); }
  await decal(G7, 'blood_hv', 1.5, .8, 30.0, Y + .005, -21.05, 'floor', PI / 2 + .15, 0xf0d0c8, .75);
  await decal(G7, 'blood_hs', .55, .55, 30.55, Y + .006, -20.55, 'floor', .5, 0xf0d0c8, .8); // verschmierte Hand (Megascans „Hand Smear“) neben der Spur zur Kellertür
  await decal(G7, 'grime', 1.4, 1.2, 30.1, Y + .004, -20.9, 'floor', 1.1, 0x5a4a38, .9);
  await decal(G7, 'grime', 1.4, 1.0, 26.105, Y + .5, -21.0, '+x', 0, 0x6a5a48, .8);
  web(G7, 31.62, Y + 2.5, -21.62, -PI / 4 + PI / 2, .8); web(G7, 26.3, Y + .5, -21.62, PI / 4, .45);

  // =====================================================================  HAUS NR. 1 – ELTERNHAUS
  // ---------- Wohnzimmer mit Tüchern über den Möbeln (x −49.9…−44.2, z −16.9…−12.2)
  const sheetMat = new T.MeshStandardMaterial({ map: await tRep('curtain_sheer/DefaultMaterial_Base_color.png', true, 1.4, 1.4), normalMap: M.cloth.normalMap, color: 0xc4beb2, roughness: 1, side: T.DoubleSide });
  const sheets = [find(-44.7, .85, -15.2, [1.07, .87, 2.46])[0], find(-48.7, .92, -16.2, [1.27, 1.02, 1.27])[0], find(-46.8, 1.05, -16.55, [1.57, 1.27, .67])[0]];
  sheets.forEach(m => { if (m) m.material = sheetMat; }); ghost.material = sheetMat; // die Laken-Gestalt sieht aus wie die Tücher
  // 10.10.: statt der verbeulten Boxen echte Tücher (Cloth-Simulation über Sofa, Sessel, Kommode; Blender: tools/blender/laken_bau.py)
  try { const lg = await msModel('laken', 'laken.glb'), pick = n => { let r = null; lg.traverse(o => { if (o.isMesh && o.name === n) r = o; }); return r; };
    ['laken_sofa', 'laken_sessel', 'laken_kommode'].forEach((n, i) => { const p = pick(n), m = sheets[i]; if (p && m) { if (m.geometry.dispose) m.geometry.dispose(); m.geometry = p.geometry.clone(); m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); m.userData.laken = true; m.castShadow = true; m.receiveShadow = true; } }); } catch (e) { console.warn('Tücher-Modell', e); }
  const moveSheet = (m, nx, nz) => { if (!m) return; const ox = m.position.x, oz = m.position.z, c = colliders.find(c => nr((c.minX + c.maxX) / 2, ox, .03) && nr((c.minZ + c.maxZ) / 2, oz, .03) && c.top > 50);
    if (c) { c.minX += nx - ox; c.maxX += nx - ox; c.minZ += nz - oz; c.maxZ += nz - oz; } m.position.x = nx; m.position.z = nz; };
  moveSheet(sheets[2], -48.55, -16.55); moveSheet(sheets[1], -49.15, -15.45); // vorher stand der Schrank genau vor der Tür (x −47)
  familyPhoto.position.x = -44.215;
  { const f = await GL('frame_deco'); f.rotation.z = PI / 2; f.scale.setScalar(.84); put(f, { maxX: -44.205, z: -14.3, yc: Y + 1.55, ry: -PI / 2 }, G1); }
  await clock(G1, { x: -48.45, minZ: -16.89, yc: Y + 1.98 }, 'Auch hier: 3:13. Mama hat die Uhr nie wieder aufgezogen. Das Pendel schwingt trotzdem.');
  put(await GL('floorlamp'), { x: -49.45, z: -12.7, y: Y, ry: 2.2, rz: .025 }, G1);
  if (sheets[0]) { const tb = await GL('teddy_scan', 'model.glb'); msFit(tb, .3, 'y'); const top = surfY(sheets[0], -44.72, -14.55, 2); const g = put(tb, { x: -44.72, z: -14.55, y: top - .01, ry: PI / 2 + .25 }, G1);
    g.traverse(m => { if (m.isMesh) m.castShadow = false; });
    interact(firstMesh(g), 'Teddy', () => toast('Lucys Teddy. Ein Ohr ist mit rotem Faden angenäht – Lucys erste Naht, mit neun. Staub liegt hier überall. Nur nicht auf ihm.', 5600)); }
  // Bild verkehrt herum (mit dem Gesicht zur Wand)
  { const f = await GL('frame_dmg'); const g = put(f, { x: -45.25, minZ: -16.89, yc: Y + 1.68, ry: PI, rz: .06 }, G1);
    const b = bbox(g), bk = new T.Mesh(new T.PlaneGeometry(.44, .64), await surf('floor_wood', { rx: .25, ry: .35, tint: 0x6a5846 })); bk.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.max.z - .012); bk.rotation.z = .06; G1.add(bk);
    interact(bk, 'Verkehrt aufgehängtes Bild', () => toast('Das Bild hängt verkehrt herum, mit dem Gesicht zur Wand. Auf der Rückseite, in Mamas Schrift: „Nicht umdrehen. Er erkennt sich sonst.“', 5800)); } // STORY-HOOK
  await winIn(G1, -45.4, -12.2, '-z', { tint: 0xa8a296 });
  await decal(G1, 'grime', 1.6, 1.6, -47.2, 3.196, -14.2, 'ceil', .5, 0x6a5a48, .8);
  await decal(G1, 'grime', 2.0, .8, -46.8, Y + .4, -16.893, '+z', 0, 0x5a4a38, .8);
  web(G1, -49.72, Y + 2.5, -16.72, PI / 4, .9); web(G1, -44.38, Y + 2.45, -12.4, -PI / 4 + PI, .8); web(G1, -48.6, Y + 1.2, -16.4, 0, .5); web(G1, -49.45, Y + 1.72, -12.72, 1, .45);

  // ---------- Küche (x −55.8…−50.1, z −16.9…−12.2)
  hideAt(-53, .8, -14.8, [1.4, .75, .9]); hideAt(-54, .88, -14.8, [.45, .9, .45]); hideAt(-52, .88, -14.8, [.45, .9, .45]); hideAt(-53.4, .89, -12.55, [3.8, .92, .65]);
  { let w = 0; for (let i = 0; i < 2; i++) { const g = put(await lowerCab(0xffffff, 1), { minX: -55.78 + i * w, maxZ: -12.21, y: Y, ry: PI }, G1); if (!w) { const b = bbox(g); w = b.max.x - b.min.x; } } }
  const cupMat = await surf('planks_painted', { rx: .4, ry: .35, tint: 0x8fa4b4 });
  { const hb = [find(-54.4, 2.28, -12.85, [.8, .7, .3])[0], find(-54.39, 2.28, -12.69, [.78, .68, .03])[0]]; hb.forEach(m => { if (m) m.material = cupMat; });
    // 10.10.: Hängeschrank als Modell (Blender: tools/blender/haengeschrank_bau.py), Rückseite an der Wand (die Box hing 0,5 m davor in der Luft)
    try { const hs = (await msModel('haengeschrank', 'haengeschrank.glb')).clone(true); put(hs, { x: -54.4, maxZ: -12.21, y: Y + 1.52, ry: PI }, G1); hb.forEach(m => { if (m) m.visible = false; }); } catch (e) { console.warn('Hängeschrank', e); } }
  PHOTOS[5].candle.g.position.y = Y + .92;
  const gHutch = put(await hutch(0xffffff, 1, 2.2), { minX: -55.79, z: -15.6, y: Y, ry: PI / 2 }, G1);
  { const b = bbox(gHutch), hot = new T.Mesh(new T.BoxGeometry(.4, .5, 1.1), hidden); hot.position.set(b.max.x - .25, Y + 1.25, (b.min.z + b.max.z) / 2); G1.add(hot);
    interact(hot, 'Küchenbuffet', () => toast('Mamas Rezeptkarten, alle für vier Personen. Auf jeder ist die „4“ durchgestrichen und eine „3“ darübergeschrieben. Nur auf den ältesten nicht.', 6000)); // STORY-HOOK: das vierte Gesicht
    const sy = surfY(gHutch, b.max.x - .2, (b.min.z + b.max.z) / 2, Y + 1.6); candle(G1, 'Candle_large_big_used_low', b.max.x - .2, sy, -15.9, false); candle(G1, 'Thin_candle_used_low001', b.max.x - .22, sy, -15.35, false); }
  { const t = await GL('metaltable'); t.scale.set(.4, .88, 1); const g = put(t, { x: -53, z: -14.8, y: Y }, G1); const top = surfY(g, -53.3, -14.8, Y + 1.5);
    album.position.y = top + .03; PHOTOS[5].mesh.position.y = top + .006; }
  await chair(G1, { x: -53.95, z: -14.85, y: Y, ry: PI / 2 - .1 }); await chair(G1, { x: -52.55, z: -14.0, y: Y, ry: PI + .25 });
  await winIn(G1, -51.2, -12.2, '-z', { yc: 2.08, sy: .64, tint: 0xa8a296 });
  await decal(G1, 'grime', 1.8, .6, -54.2, Y + 1.25, -12.206, '-z', 0, 0x6a5a40, .7);
  await decal(G1, 'grime', 1.4, 1.2, -52.8, Y + .004, -15.6, 'floor', 2.2, 0x5a4a38, .8);
  web(G1, -55.62, Y + 2.5, -16.72, PI / 4, .8); web(G1, -50.28, Y + 2.5, -16.72, -PI / 4, .7); web(G1, -53.0, Y + .45, -15.0, .3, .4);

  // ---------- Kinderzimmer (x −55.8…−50.1, z −21.8…−17.1)
  hideAt(-55.4, .65, -19.6, [.9, .45, 1.9]); hideAt(-50.6, .65, -19.6, [.9, .45, 1.9]); hideAt(-53, 1.73, -21.75, [1.4, .08, .3]);
  const gBedL = await bed(G1, 0xc8a0a0, .0072, { x: -55.18, minZ: -21.77, y: Y });
  const gBedK = await bed(G1, 0xa0aec8, .0072, { x: -50.74, minZ: -21.77, y: Y }, true);
  { const top = surfY(gBedK, -50.74, -20.55, Y + 1.4); PHOTOS[4].mesh.position.set(-50.74, top + .006, -20.55); PHOTOS[4].candle.g.position.set(-51.48, Y, -21.45); }
  const gSh = put(await GL('shelf'), { x: -53.15, minZ: -21.79, yc: Y + 1.25 }, G1);
  { const sTop = surfY(gSh, -53.15, -21.68, Y + 2); musicBox.position.set(-53.35, sTop + .06, -21.69); const mbMat = await surf('floor_wood', { rx: .1, tint: 0x7a4a34, rough: .7 });
    musicBox.material = mbMat; mbLidPiv.children.forEach(m => { if (m.isMesh) m.material = mbMat; });
    const gi = await GL('giraffe'); put(gi, { x: -52.85, z: -21.68, y: sTop, ry: .5 }, G1); }
  const gBun = toy('SM_ToyBunny', G1, -55.2, surfY(gBedL, -55.2, -21.35, Y + 1.4), -21.35, .25);
  if (gBun) interact(gBun, 'Stoffhase', () => toast('Lucys Stoffhase. Ein Auge fehlt. Ihr habt euch darum gestritten, das weißt du noch. Nicht mehr, wer von euch gewonnen hat.', 5600));
  toy('SM_ToyTrain', G1, -53.95, Y, -19.8, .9); toy('SM_ToyCube_01a', G1, -52.6, Y, -18.75, .4); toy('SM_ToyCube_02a', G1, -52.48, Y, -18.62, 1.1);
  const ball = toy('SM_Ball', G1, -55.05, Y, -20.85, 0); if (ball) { ball.userData.noCol = true; ball.userData.ioDyn = true; ball.geometry.translate(0, -.1, 0); ball.position.y = Y + .1; }
  S.ball = ball ? { m: ball, from: ball.position.clone(), to: V(-53.3, Y + .1, -18.2), t: -1, inT: 0 } : null;
  if (ball) interact(ball, 'Ball', () => { if (S.ball.t < 1) return toast('Ein alter Gummiball, halb unter Lucys Bett.', 3000);
    toast('Er ist zu dir gerollt. Langsam. Als hätte ihn jemand angestoßen, der unter Lucys Bett liegt.', 5200); Audio.giggle(-55.1, .6, -20.9); });
  await decal(G1, 'grime', 1.3, 1.3, -53.0, 3.196, -19.5, 'ceil', 1.3, 0x6a5a48, .7);
  await decal(G1, 'grime', 1.2, .9, -54.9, Y + .004, -18.6, 'floor', .4, 0x5a4a38, .7);
  web(G1, -55.62, Y + 2.5, -17.28, PI / 4 + PI, .7); web(G1, -50.28, Y + 2.45, -17.28, -PI / 4 + PI, .6); web(G1, -52.95, Y + .35, -21.62, 0, .35);

  // ---------- Elternschlafzimmer (x −49.9…−44.2, z −21.8…−17.1)
  hideAt(-47, .68, -20.8, [1.6, .5, 2.1]); hideAt(-47, .88, -21.85, [1.6, .9, .12]); hideAt(-44.74, 1.05, -18.6, [.1, .02, .02]); hide(wardrobe1); hideAt(-44.12, 1.93, -20.3, [0, 1.4, .6]);
  const gBedP = await bed(G1, 0xb0a8a0, .009, { x: -47.02, minZ: -21.77, y: Y });
  try { const px = -46.62, pz = -21.3, py = surfY(gBedP, px, pz, Y + 1.5, Y + .75), tt = bu_taschentuch('Luke, 7'); tt.position.set(px, py + .002, pz); tt.rotation.y = .5; G1.add(tt); } catch (e) { console.warn('Basis-Umsetzung Milchzahn', e); }
  interact(firstMesh(gBedP, /blanket/), 'Bett', () => toast('Nur eine Seite ist benutzt. Auf dem Kissen der anderen: ein Milchzahn in einem Taschentuch. Mit Kuli: „Luke, 7“.', 5400)); // STORY-HOOK
  // Kommode (Unterschrank des Buffets) mit flacher Schublade unter der Platte – die alte Kiste bleibt unsichtbare Klickfläche
  dresser.material = hidden; if (dresser.userData.col) dresser.userData.col.minX = dresser.userData.col.maxX = -9999; unOcc(dresser);
  const gKom = put(await lowerCab(0xffffff, 1, .9), { maxX: -44.21, z: -18.6, y: Y, ry: -PI / 2 }, G1);
  { const b = bbox(gKom), front = b.min.x + .03, dx = (front + .215) - (-44.55); drawer.geometry = new T.BoxGeometry(.43, .07, .96); drawer.geometry.translate(dx, 0, 0);
    drawer.position.y = Y + .83; drawer.material = new T.MeshStandardMaterial({ map: msTex('dresser/T_Wood-1_BaseColor.jpg', true), normalMap: msTex('dresser/T_Wood-1_Normal.jpg'), roughness: .8 }); }
  // Kleiderschrank: offenes Holzregal + Tür (Scan-Holz), Mamas Kleid hängt darin
  const gWr = await shelfModel(G1, { minX: -49.89, z: -20.45, y: Y });
  { const b = bbox(gWr), H = b.max.y - Y, D = b.max.z - b.min.z; wPiv.position.set(b.max.x + .006, Y, b.min.z); wPiv.rotation.y = 0;
    wLeaf.geometry = new T.BoxGeometry(.03, H - .04, D); wLeaf.position.set(.015, (H - .04) / 2 + .02, D / 2); wLeaf.material = await surf('floor_wood', { rx: .55, ry: .8, tint: 0x8a6a52 });
    wPiv.children.forEach(m => { if (m !== wLeaf && m.isMesh) m.position.set(.04, 1.05, D - .1); });
    try { const mk = async (c0) => { const o = await msFBX('w_jacke', 'model.fbx', { '*': { b: 'model.jpg', rough: .95, ds: true, color: c0 } }); msFit(o, .98, 'y'); return o; };
      for (const [dz, col, ry] of [[-.3, 0x6a6258, PI / 2 + .1], [.05, 0x4a4540, PI / 2 - .08]]) put(await mk(col), { x: b.min.x + .27, z: -20.45 + dz, top: b.max.y - .1, ry }, G1);
      const sh = bu_kinderschuh(0x3a5ca8), sy = surfY(gWr, b.min.x + .14, -20.2, b.min.y + .8, Y + .02); sh.position.set(b.min.x + .13, sy + .004, -20.1); sh.rotation.y = -PI / 2 + .3; G1.add(sh); } catch (e) { console.warn('Basis-Umsetzung Mäntel', e); }
    for (const [dz, col] of [[.36, 0x5a4a44]]) { const c = await FBX('curtain_sheer', { '*': { b: 'DefaultMaterial_Base_color.png', n: 'DefaultMaterial_Normal_DirectX.jpg', r: 'DefaultMaterial_Roughness.png', ds: 1, flipN: true, color: col } });
      c.scale.set(.0042, .0082, .006); put(c, { x: b.min.x + .27, z: -20.45 + dz, top: b.max.y - .07, ry: PI / 2 + rand(-.15, .15) }, G1); } }
  // 10.10.: Garderobe am Haken – die drei aus Zylindern/Kapseln gebauten Mäntel durch echte Jacken-Scans ersetzen (Haken und Brett bleiben)
  try { const alt = []; scene.traverse(g => { if (g.isGroup && g.children.length === 12 && Math.abs(g.position.x + 44.26) < .03 && Math.abs(g.position.y - 2.22) < .05 && g.position.z < -19.8 && g.position.z > -20.8) alt.push(g); });
    if (alt.length) { const seen = new Set(); alt.forEach(g => { g.visible = false; });
      const zs = [-20.57, -20.29, -20.01], cols = [0x9fb2ae, 0xa89878, 0x7d9482];
      for (let i = 0; i < 3; i++) { const o = await msFBX('w_jacke', 'model.fbx', { '*': { b: 'model.jpg', rough: .95, ds: true, color: cols[i] } }); msFit(o, .98 - i * .03, 'y'); put(o, { x: -44.36, z: zs[i], top: 2.21, ry: -PI / 2 + (i - 1) * .08 }, G1); } } } catch (e) { console.warn('Garderobe Jacken', e); }
  // Viktorianischer Spiegel
  const mir = await FBX('mirror', { 'Mirror Border': { b: 'Gold_MIrror_Diffuse.png', n: 'Gold_Mirror_Normal.jpg', r: 'Gold_Mirror_Roughness.png', metal: 1, color: 0xc8b890 }, Mirror: { r: 'Mirror_Roughness.png', metal: 1, rough: .08, color: 0x9aa2aa } });
  mir.rotation.x = -PI / 2; msFit(mir, .84, 'max'); const gMir = put(mir, { maxX: -44.21, z: -20.35, yc: Y + 1.6, ry: -PI / 2 }, G1); gMir.traverse(m => { if (m.isMesh) m.castShadow = false; });
  { const b = bbox(gMir), face = new T.Mesh(new T.PlaneGeometry(.26, .32), new T.MeshBasicMaterial({ map: faceTexes.pale, transparent: true, opacity: 0, depthWrite: false, color: 0x8a8a8a }));
    face.userData.ioDyn = true; face.position.set(b.min.x - .004, (b.min.y + b.max.y) / 2 + .03, (b.min.z + b.max.z) / 2); face.rotation.y = -PI / 2; G1.add(face); S.mirFace = face;
    interact(firstMesh(gMir), 'In den Spiegel sehen', () => { toast('Dein Gesicht. Braune Augen. Du blinzelst – das Spiegelbild einen Herzschlag später.', 5000); // STORY-HOOK: Augenfarbe
      if (!onceFlags.mir) { onceFlags.mir = 1; setTimeout(() => { S.mirT = .22; Audio.whisper(b.min.x, Y + 1.6, (b.min.z + b.max.z) / 2, 1.1); }, 1600); } }); }
  await winIn(G1, -47, -21.8, '+z', { tint: 0xa8a296 });
  await decal(G1, 'grime', 1.5, 1.5, -46.5, 3.196, -19.2, 'ceil', .9, 0x6a5a48, .8);
  await decal(G1, 'grime', 1.2, .9, -44.207, Y + .45, -20.9, '-x', 0, 0x5a4a38, .7);
  web(G1, -49.72, Y + 2.5, -21.62, PI / 4 + PI / 2, .8); web(G1, -44.38, Y + 2.5, -17.28, -PI / 4 + PI, .7); web(G1, -49.45, Y + 1.9, -21.2, .5, .4);

  // =====================================================================  KELLER (B)
  const beamMat = await surf('floor_wood', { rx: 4, ry: .15, tint: 0x8a7a68 }), stepMat = await surf('floor_wood', { rx: .6, ry: .3, tint: 0x8a7a68 });
  for (const x of [296, 298.6, 301.2, 303.8]) find(x, 2.38, 300, [.2, .25, 8]).forEach(m => m.material = beamMat);
  // R-6: Kellertreppe mit Logik – statt acht massiver Klötze, die mitten im Raum 0,7 m unter der Decke enden: offene Holztreppe an der Ostwand (11 Stufen à 22,5 cm,
  // Fuß im Süden, Kopf im Norden wie bisher), Podest oben, Deckendurchbruch mit Schacht, Geländer zur Raumseite, oben die Kellertür (Klickfläche „Nach oben gehen“). Begehbar.
  for (let i = 0; i < 8; i++) hideAt(B.x + 4.2, .11 * (i + 1), B.z + 3.7 - i * .3 - .8, [1.2, .22 * (i + 1), .3]);
  { const ci = colliders.findIndex(c => c.minX === B.x + 3.6 && c.maxX === B.x + 5 && c.minZ === B.z - .2 && c.maxZ === B.z + 3.2); if (ci >= 0) colliders.splice(ci, 1); }
  if (typeof kirchberg_treppe === 'function') { let deckeK = null;
    scene.traverse(o => { const P = o.isMesh && o.geometry && o.geometry.parameters; if (!deckeK && P && P.width === 10.4 && P.depth === 8.4 && Math.abs(o.position.x - B.x) < .01 && Math.abs(o.position.z - B.z) < .01) deckeK = o; });
    find(303.8, 2.38, 300, [.2, .25, 8]).forEach(hide); // der östliche Balken läge im Durchbruch → endet jetzt an den Wechseln
    kirchberg_treppe({ par: GB, x0: B.x + 3.68, x1: B.x + 4.88, zA: B.z + 2.97, zB: B.z, y0: 0, y1: 2.7, n: 11, podest: .9, offen: 'x0', mat: stepMat, matWange: beamMat, begehbar: true,
      decke: deckeK, loch: [B.x + 3.55, B.x + 4.95, B.z - .9, B.z + 3.45], schachtH: 2.6, schachtMat: M.block }); // Durchbruch am Fuß 45 cm länger: beim Runtergehen stieß die Kopfkugel an die Deckenkante (unsichtbare Wand auf den unteren Stufen)
    box(.2, .25, 3.0, B.x + 3.8, 2.38, B.z - 2.5, beamMat, { parent: GB }); box(.2, .25, .55, B.x + 3.8, 2.38, B.z + 3.925, beamMat, { parent: GB });
    box(2.4, .25, .2, B.x + 3.75, 2.38, B.z - 1.0, beamMat, { parent: GB }); box(2.4, .25, .2, B.x + 3.75, 2.38, B.z + 3.55, beamMat, { parent: GB }); // Wechsel hinter dem Durchbruch (vorher über den unteren Stufen: Kopf stieß an → unsichtbare Wand)
    { const d = await GL('door1'); d.scale.set(1 / 1.055, 2.05 / 1.9, 1); meshes(d).forEach(m => { m.material = m.material.clone(); m.material.color.setHex(0x8a7c6c); }); put(d, { x: B.x + 4.28, minZ: B.z - .89, y: 2.7 }, GB); }
    if (typeof stairs !== 'undefined') { stairs.position.set(B.x + 4.28, 3.75, B.z - .75); stairs.scale.set(.9, 1, .3); stairs.updateMatrixWorld(true); } }
  else for (let i = 0; i < 8; i++) find(B.x + 4.2, .11 * (i + 1), B.z + 3.7 - i * .3 - .8, [1.2, .22 * (i + 1), .3]).forEach(m => { m.visible = true; m.material = stepMat; });
  // Stuhl mit Riemen (Riemen bleiben, sitzen jetzt am echten Stuhl)
  hideAt(299, .5, 300, [.6, .06, .6]); hideAt(299, .9, 299.7, [.6, .8, .06]); for (const sx of [298.73, 299.27]) for (const sz of [299.73, 300.27]) hideAt(sx, .25, sz, [.05, .5, .05]);
  const gBC = await chair(GB, { x: 299, z: 300, y: 0 });
  { const b = bbox(gBC), seat = surfY(gBC, 299, 300.05, 1.2, .47), w = b.max.x - b.min.x;
    const st = find(299, .62, 299.9, [.64, .04, .08])[0]; if (st) { st.position.set(299, .74, b.min.z + .035); st.scale.x = (w + .03) / .64; }
    const armR = [];
    for (const [sx, s] of [[298.72, -1], [299.28, 1]]) { const m = find(sx, .56, 300, [.08, .04, .5])[0]; if (m) { m.position.set(299 + s * (w / 2 - .01), seat + .02, 300.12); m.scale.z = .75; armR.push([m, s]); } }
    // Echte Gurtbänder statt Gummi-Balken (Nutzer 08.10., Foto 9: „Gurt als flacher Balken diagonal durch die Lehne“): Lederband mit Naht, Metallschnalle und Nieten;
    // zugezogen liegt es an der Lehne bzw. über der Sitzfläche, nach dem Schreck (userData.gurtAuf) hängt es lose herab.
    try { const leder = new T.MeshStandardMaterial({ color: 0x2b1d13, roughness: .5, metalness: .04 }), stahl = new T.MeshStandardMaterial({ color: 0xa8a49a, roughness: .35, metalness: .9 });
      const band = (pts, bw, up) => { const cur = new T.CatmullRomCurve3(pts.map(p => V(...p)), false, 'catmullrom', .3), n = 22, G = []; for (let i = 0; i < n; i++) { const a = cur.getPoint(i / n), c = cur.getPoint((i + 1) / n), d = c.clone().sub(a), L = d.length();
          const g = new T.BoxGeometry(bw, .007, L * 1.04), m4 = new T.Matrix4().lookAt(a, c, up); m4.setPosition(a.clone().add(c).multiplyScalar(.5)); g.applyMatrix4(m4); G.push(g); }
        const m = new T.Mesh(mergeGeometries(G), leder); m.castShadow = false; return m; };
      const schnalle = (x, y, z, ry, wd) => { const g = new T.Group(), fr = (bx, by, bz, px, pz) => { const m = new T.Mesh(new T.BoxGeometry(bx, by, bz), stahl); m.position.set(px, 0, pz); return m; };
        g.add(fr(wd + .012, .006, .008, 0, -.022), fr(wd + .012, .006, .008, 0, .022), fr(.008, .006, .052, -(wd / 2 + .004), 0), fr(.008, .006, .052, wd / 2 + .004, 0), fr(.004, .005, .046, 0, 0)); g.position.set(x, y, z); g.rotation.y = ry; return g; };
      const pit = (parent, x, y, z) => { const m = new T.Mesh(new T.CylinderGeometry(.006, .006, .004, 8), stahl); m.position.set(x, y, z); parent.add(m); };
      const par = st ? st.parent : GB, wb = .075, zr = b.min.z + .045, yr = .74, xl = 299 - w / 2 + .012, xr = 299 + w / 2 - .012, len = w / 2 - .09, K = new T.Group(), bk = schnalle(299, yr + .003, zr + .004, 0, wb);
      bk.rotation.x = PI / 2; K.add(bk); // Brustgurt: an den Lehnenpfosten befestigt, vorn über der Lehne zusammengeschnallt
      for (const sx of [-1, 1]) { const gi = new T.Group(); gi.position.set(sx < 0 ? xl : xr, yr, zr); // Drehpunkt = Pfosten
        gi.add(band([[0, 0, 0], [-sx * len * .5, -.006, .004], [-sx * len, 0, .002]], wb, V(0, 0, 1))); pit(gi, 0, .005, 0); pit(gi, -sx * .03, .005, 0); K.userData[sx < 0 ? 'L' : 'R'] = gi; K.add(gi); }
      K.userData.gurtAuf = () => { const L = K.userData.L, R = K.userData.R; L.rotation.z = -1.38; R.rotation.z = 1.38; L.position.y -= .03; R.position.y -= .03; bk.rotation.set(PI / 2, 0, .05); bk.position.set(xl + .006, yr - .03 - len - .02, zr + .006); };
      par.add(K);
      armR.forEach(([m, s], i) => { m.visible = false; m.material = hidden; const gx = 299 + s * (w / 2 - .01), z0 = 300.12 - .19, z1 = 300.12 + .19, A = new T.Group(); A.position.set(gx, seat + .02, z0);
        const bd = band([[0, 0, 0], [0, .003, .12], [0, .003, .25], [0, 0, z1 - z0]], wb * .8, V(0, 1, 0)); A.add(bd); A.add(schnalle(0, .006, (z1 - z0) * .6, PI / 2, wb * .8)); pit(A, 0, .006, .02);
        A.userData.gurtAuf = () => { A.rotation.z = s * 1.45; A.position.x += s * .035; A.position.y -= .045; A.rotation.x = .12; }; par.add(A); });
      if (st) { st.visible = false; st.material = hidden; } K.name = 'gurtstuhl'; } catch (e) { console.warn('Gurtbänder', e); }
    try { const m = bu_ritz(.3, .12, (C, B, W, H, ppm) => { for (let k = 0; k < 7; k++) ritz_strich(C, B, [[W * .05 + k * ppm * .0295 + ritz_RN(), H * .1], [W * .05 + k * ppm * .0295 + ritz_RN() * 1.4, H * .86]], 34, 'ritz', ritz_R(.75, 1));
        ritz_strich(C, B, [[W * .86, H * .06], [W * .86 + 2, H * .9]], 56, 'ritz', 1); ritz_strich(C, B, [[W * .86 + 3, H * .08], [W * .86 + 4, H * .88]], 40, 'ritz', 1); }, { ppm: 900, seed: 8, bump: 3.2 });   // sieben Striche, der achte tiefer und frischer
      m.rotation.set(-PI / 2, 0, 0); m.position.set(299, seat + .002, 300.22); GB.add(m); } catch (e) { console.warn('Basis-Umsetzung Stuhlstriche', e); }
    interact(firstMesh(gBC), 'Stuhl', () => toast('In die Sitzfläche sind Striche geritzt. Sieben. Daneben ein achter – tiefer, frischer.', 5000)); } // STORY-HOOK: das achte Kind
  // Tisch mit Tonbandgerät (Tischplatte exakt auf alter Höhe → Band, Foto, Kerze bleiben liegen)
  hideAt(302, .38, 296.7, [1.4, .75, .7]);
  put(await GL('metaltable'), { x: 302.0, maxZ: 296.92, y: 0, s: [1, .88, 1] }, GB);
  try { let echt = true, rd; try { rd = await GL('rekorder', 'model.glb'); } catch (e) { echt = false; rd = await GL('radio'); } if (!echt) meshes(rd).forEach(m => { if (m.name === 'tubes' || m.name === 'wires') m.parent.remove(m); }); if (echt) { rd.updateMatrixWorld(true); const ms = []; rd.traverse(m => { if (m.isMesh) { const bb = new T.Box3().setFromObject(m), sz = bb.getSize(new T.Vector3()); ms.push({ m, bb, v: sz.x * sz.y * sz.z, c: bb.getCenter(new T.Vector3()), d: Math.max(sz.x, sz.y, sz.z) }); } });
      ms.sort((p, q) => q.v - p.v); const hp = ms[0]; if (hp) for (const e of ms) if (e.c.distanceTo(hp.c) > hp.d * 1.2) e.m.parent && e.m.parent.remove(e.m); /* verirrte Teile (Knöpfe der Quelle) weg */ const kb = new T.Box3(); rd.traverse(m => { if (m.isMesh && m.visible) kb.expandByObject(m); }); const ks = kb.getSize(new T.Vector3()); rd.scale.multiplyScalar(.3 / Math.max(ks.x, ks.y, ks.z)); } else msFit(rd, .27, 'y'); /* echter Kassettenrekorder (Fab, Ryptimal Games, CC-BY) */ const gtp = put(rd, { x: B.x + 2, z: B.z - 3.25, y: .83 - .075, ry: -PI / 2 }, GB); B.tape.material = hidden; gtp.traverse(m => { if (m.isMesh) m.castShadow = false; }); S.tapeGerat = gtp; // Kassettenrekorder (Scan Radio statt Kiste)
    const kt = new T.Mesh(new T.BoxGeometry(.105, .016, .068), new T.MeshStandardMaterial({ color: 0x1a1a1c, roughness: .5 })); kt.position.set(B.x + 2.36, .763, B.z - 3.05); kt.rotation.y = .3; GB.add(kt); } catch (e) { console.warn('Basis-Umsetzung Kassettenrekorder', e); B.tape.material = await surf('rust_sheet', { rx: .25, ry: .12, tint: 0xa09890 }); }
  // Regal mit Einmachgläsern
  hideAt(295.25, .95, 302, [.35, 1.9, 1.6]); hideAt(295.25, .95, 301.99, [.35, 1.9, 1.6]); hideAt(295.25, .95, 301.98, [.35, 1.9, 1.6]);
  const gJar = await shelfModel(GB, { minX: 295.11, z: 302.0, y: 0 });
  { const lv = [surfY(gJar, 295.4, 302, .8), surfY(gJar, 295.4, 302, 1.6), surfY(gJar, 295.4, 302, 2.45)];
    const jars = pool.filter(e => e.m.geometry.type === 'CylinderGeometry' && nr(e.c.x, 295.3, .05) && e.m.material.transparent).map(e => e.m);
    jars.forEach((j, i) => j.position.set(295.36 + (i % 2) * .05, lv[Math.floor(i / 4) % 3] + .08, 301.45 + (i % 4) * .36));
    try { const ev = jars.filter((j, i) => i % 2 === 0).slice(0, 4); ['1975', '1992', '2009', '2026'].forEach((jr, i) => { const j = ev[i]; if (!j) return; j.geometry.computeBoundingBox(); const r = (j.geometry.parameters && j.geometry.parameters.radiusTop) || .045, e = bu_etikett(jr, i === 3); e.position.set(j.position.x + r * 1.0 + .0035, j.position.y, j.position.z); e.rotation.y = PI / 2; GB.add(e); }); } catch (e) { console.warn('Basis-Umsetzung Gläser', e); }
    if (jars[0]) { const hot = new T.Mesh(new T.BoxGeometry(.4, 1.9, 1.5), hidden); hot.position.set(295.35, 1.0, 302); GB.add(hot);
      interact(hot, 'Einmachgläser', () => toast('Einmachgläser, beschriftet mit Jahreszahlen: 1975. 1992. 2009. Das letzte ist leer. Das Etikett ist schon beschriftet: 2026.', 6000)); } } // STORY-HOOK: 17-Jahres-Zyklus
  // Sieben Spielsachen im Kreis um den Stuhl, dazwischen Kerzen
  { const names = ['SM_ToyBunny', 'SM_ToyRobot', 'SM_ToyBoat', 'SM_ToyCube_01a', 'SM_Ball', 'SM_ToyTrain', 'SM_ToyCube_02a']; let first = null;
    names.forEach((n, i) => { const a = i / 7 * PI * 2 + .3, x = 299 + Math.sin(a) * 1.05, z = 300.05 + Math.cos(a) * 1.05; const t = toy(n, GB, x, 0, z, Math.atan2(299 - x, 300.05 - z)); if (t && !first) first = t; });
    const cn = ['Candle_large_big_used_low', 'Candle_large_small_used_low', 'Thin_candle_used_low', 'Candle_large_small_used_low002', 'Candle_small_used_low', 'Thin_candle_used_low001', 'Candle_large_big_used_low001'];
    cn.forEach((n, i) => { const a = (i + .5) / 7 * PI * 2 + .3, x = 299 + Math.sin(a) * .9, z = 300.05 + Math.cos(a) * .9; candle(GB, n, x, 0, z, i % 2 === 0); });
    candle(GB, 'Big_Wax_leak_low', 299.35, .001, 300.8, false); candle(GB, 'Small_wax_leak_low001', 298.3, .001, 299.6, false);
    S.circleL = light(GB, 0xffa048, 1.2, 4.2, 299, .35, 300.05);
    if (first) interact(first, 'Spielzeug', () => toast('Sieben Spielsachen, im Kreis um den Stuhl gestellt. Alle schauen zum Stuhl. Die Kerzen dazwischen brennen. Wer hat sie angezündet?', 6000)); }
  await trashbag(GB, { x: 296.0, z: 303.3, y: 0, ry: .7 }); await trashbag(GB, { x: 296.65, z: 303.5, y: 0, ry: 2.4, s: .8 });
  { const f = await GL('frame_dmg'); f.rotation.x = -.2; put(f, { minX: 295.13, z: 299.35, y: 0, ry: PI / 2 }, GB); }
  await decal(GB, 'blood_s1', 1.5, 1.5, 299, .005, 300.05, 'floor', .6, 0xf0d0c8, .85);
  await decal(GB, 'blood_hv', 2.2, .9, 299.2, .006, 298.3, 'floor', PI / 2 + .25, 0xf0d0c8, .8);
  await decal(GB, 'blood_s2', 1.2, 1.4, 295.105, 1.15, 298.5, '+x', 0, 0xf0d0c8, .75);
  await decal(GB, 'grime', 2.4, 1.2, 300.5, .6, 303.895, '-z', 0, 0x5a4a38, .9);
  await decal(GB, 'grime', 1.8, 1.8, 302.5, 2.495, 298.5, 'ceil', 2, 0x5a4a38, .8);
  web(GB, 295.4, 2.2, 301.2, PI / 4, .7); web(GB, 304.6, .6, 303.5, -PI / 4, .5); web(GB, 300.2, 2.3, 296.3, 0, .6);

  // =====================================================================  BELEBT: zusätzliche Einrichtung (nur Scan-Modelle), damit kein Raum leer wirkt
  // Laufwege bleiben frei: Nr. 7 Haustür x 23 → Schlafzimmer (x 23, z −17) / Küche (x 26, z −14) / HWR (x 29,5, z −17); Nr. 1 entsprechend x −47 / −53 / z −14,5.
  const rug = async (par, x, z, w, h, rot, tint, y = Y) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), await surf('wallpaper_fabric', { rx: w / 1.3, ry: h / 1.3, tint, nrm: .5 }));
    m.material.polygonOffset = true; m.material.polygonOffsetFactor = -2; m.material.polygonOffsetUnits = -2; m.rotation.set(-PI / 2, 0, rot); m.position.set(x, y + .014, z); m.receiveShadow = true; par.add(m); return m; };
  const teddySrc = await FBX('teddy_retro', { material0: { b: 'teddy-bear.jpg', color: 0xb8aa98 }, material1: { b: 'teddy-bear1.jpg', color: 0xb8aa98 } }).catch(() => null);
  const trashcan = async (par, p) => put(await GL('trashcan'), p, par);
  // ---------- Nr. 7 Wohnzimmer: Anrichte unter der Pendeluhr, Bild an der Trennwand, ausgetretener Laufweg
  { const g = put(await lowerCab(0xd8cfb8, .55, .86), { minX: 20.21, z: -15.35, y: Y, ry: PI / 2 }, G7); const top = surfY(g, 20.5, -15.35, Y + 1.6);
    candle(G7, 'Candle_large_small_used_low001', 20.45, top, -15.85, false); candle(G7, 'Thin_candle_used_low002', 20.52, top, -15.68, false);
    const f = await GL('frame_deco'); f.rotation.x = -.2; f.scale.setScalar(.5); put(f, { minX: 20.24, z: -14.95, y: top, ry: PI / 2 }, G7);
    interact(firstMesh(g), 'Anrichte', () => toast('In der Schublade: Streichhölzer, Gummibänder, ein Stapel Trauerkarten. Alle unbeschrieben. Und sieben Kinderlöffel, sauber poliert.', 5400)); } // STORY-HOOK: sieben Kinder
  await frame(G7, 'frame_dmg', { maxX: 25.89, z: -15.3, yc: Y + 1.62, ry: -PI / 2, rz: -.08, s: .8 });
  await decal(G7, 'grime', 1.2, 3.2, 23.0, Y + .004, -14.6, 'floor', 0, 0x4a3a2a, .55);
  web(G7, 20.4, Y + .45, -16.72, PI / 4, .45);
  // ---------- Nr. 7 Küche: Buffet an der Rückwand, Mülleimer
  { const g = put(await hutch(0xa89e8c, .3, 2.1), { x: 27.12, minZ: -16.88, y: Y }, G7); const b = bbox(g), sy = surfY(g, 27.12, b.max.z - .12, Y + 1.3);
    candle(G7, 'Candle_large_big_used_low', 26.8, sy, b.max.z - .15, false); candle(G7, 'Candle_small_used_low', 27.45, sy, b.max.z - .14, false);
    // in den Fächern: Grablichter in Reihen, sauber abgezählt (Hilde: „jede Nacht eins“)
    const zc = -16.88 + .2, lv = [...new Set([Y + 2.05, Y + 1.8, Y + 1.55].map(f => +surfY(g, 27.12, zc, f, -1).toFixed(3)))].filter(y => y > sy + .15);
    const nm = ['Candle_large_small_new', 'Candle_large_big_new', 'Candle_small_new001', 'Candle_large_small_new001', 'Candle_small_new', 'Candle_large_small_used_low', 'Candle_small_used_low001'];
    lv.forEach((y, r) => { for (let i = 0; i < 7; i++) candle(G7, nm[(i + r) % 7], 26.72 + i * .135, y, zc + (i % 2) * .03, false); }); }
  await trashcan(G7, { x: 31.38, z: -14.75, y: Y, ry: 1.2 });
  // ---------- Nr. 7 Schlafzimmer: Kleiderschrank, Stuhl vor dem Kinderbett (darauf ein alter Teddy, der hineinsieht), Teppich
  put(await hutch(0x8a7a68, .6, 2.15), { maxX: 25.89, z: -19.25, y: Y, ry: -PI / 2 }, G7);
  { const c = await FBX('chair', chairSpec); msFit(c, .92, 'y'); const g = put(c, { x: 24.55, z: -20.35, y: Y, ry: PI + .28 }, G7);
    if (teddySrc) { const tb = teddySrc.clone(true); msFit(tb, .34, 'y'); const seat = surfY(g, 24.55, -20.3, Y + 1.2); const gt = put(tb, { x: 24.55, z: -20.32, y: seat - .01, ry: PI + .28 }, G7);
      interact(firstMesh(gt), 'Teddy auf dem Stuhl', () => toast('Jemand hat den Stuhl vor das Kinderbett gestellt und den Teddy daraufgesetzt. Zum Aufpassen. Er ist warm, als hätte ihn gerade noch jemand gehalten.', 5600)); } }
  await rug(G7, 23.2, -19.1, 1.9, 1.3, .06, 0x544440);
  // ---------- Nr. 7 Hauswirtschaftsraum: angelehnte Palette, Mülleimer
  { const p = await GL('pallet_ms'); p.rotation.x = -PI / 2 + .22; put(p, { x: 27.3, maxZ: -17.12, y: Y }, G7); }
  await trashcan(G7, { x: 28.3, z: -21.5, y: Y, ry: 2.4 });
  await decal(G7, 'grime', 1.5, 1.1, 28.2, Y + .004, -18.6, 'floor', 2.6, 0x4a3a2a, .7);
  // ---------- Nr. 1 Kinderzimmer: Kommode, Stuhl zur Ecke gedreht, Teppich, verstreutes Spielzeug
  { const g = put(await lowerCab(0xe8e0d0, .8, .8), { minX: -55.79, z: -18.45, y: Y, ry: PI / 2 }, G1); const top = surfY(g, -55.5, -18.45, Y + 1.5);
    toy('SM_ToyBoat', G1, -55.45, top, -18.8, PI / 2 + .3); candle(G1, 'Candle_small_used_low', -55.5, top, -18.05, false);
    const f = await GL('frame_deco'); f.rotation.x = -.2; f.scale.setScalar(.45); put(f, { minX: -55.76, z: -18.45, y: top, ry: PI / 2 }, G1); }
  { const c = await FBX('chair', chairSpec); msFit(c, .74, 'y'); const g = put(c, { x: -50.55, z: -17.58, y: Y, ry: PI / 4 + PI }, G1);
    interact(firstMesh(g), 'Kinderstuhl', () => toast('Dein alter Stuhl. Er steht in der Ecke, zur Wand gedreht – wie damals, zur Strafe. Du weißt nicht mehr, was du getan hattest. Nur, dass Mama geweint hat.', 5600)); } // STORY-HOOK: Lukes Kindheit
  await rug(G1, -53.1, -19.2, 1.8, 1.25, -.08, 0x4c5058);
  toy('SM_ToyCube_01a', G1, -51.9, Y, -19.9, 2.1); toy('SM_ToyRobot', G1, -52.2, Y, -20.6, PI - .6);
  // ---------- Nr. 1 Elternschlafzimmer: Stehlampe, Stuhl, Bild an der Trennwand, Teppich
  put(await GL('floorlamp'), { x: -49.5, z: -17.5, y: Y, ry: .8 }, G1);
  await chair(G1, { x: -48.75, z: -18.35, y: Y, ry: PI / 2 + .5 });
  await frame(G1, 'frame_deco', { x: -45.3, maxZ: -17.11, yc: Y + 1.65, ry: PI, rz: .05, s: .72 });
  await rug(G1, -47.0, -18.55, 2.0, 1.2, .03, 0x5a4c46);
  // ---------- Nr. 1 Küche: Unterschrank mit altem Fernseher, Wandbord, Mülleimer + Säcke
  { const g = put(await lowerCab(0xffffff, 1), { x: -54.45, minZ: -16.89, y: Y }, G1); const top = surfY(g, -54.45, -16.6, Y + 1.6);
    const tv = await GL('crt', 'model.glb'); tv.scale.setScalar(1.25); put(tv, { x: -54.6, z: -16.58, y: top, ry: .12 }, G1); candle(G1, 'Candle_large_small_used_low002', -53.98, top, -16.55, false); }
  { const g = put(await GL('shelf'), { x: -51.35, minZ: -16.89, yc: Y + 1.55 }, G1); const sTop = surfY(g, -51.35, -16.78, Y + 2.2);
    candle(G1, 'Candle_large_big_used_low001', -51.6, sTop, -16.78, false); candle(G1, 'Thin_candle_used_low', -51.15, sTop, -16.8, false); }
  await trashcan(G1, { x: -50.48, z: -16.5, y: Y, ry: .4 }); await trashbag(G1, { x: -51.05, z: -16.35, y: Y, ry: 1.9, s: .8 });
  await decal(G1, 'grime', 1.0, 1.0, -50.8, Y + .004, -16.3, 'floor', 1.4, 0x4a3a2a, .8);
  // ---------- Keller: Eisenbett mit Riemen an der Südwand, angelehnte Palette, Kanister, Mülleimer
  { const g = await bed(GB, 0x8a8278, .0085, { x: 300.6, maxZ: 303.93, y: 0, ry: PI / 2 });
    try { const b = bbox(g), cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, lx = (b.max.x - b.min.x) >= (b.max.z - b.min.z), my = surfY(g, cx, cz, 1.6, .5), lw = Math.min(.9, lx ? b.max.z - b.min.z : b.max.x - b.min.x) - .04, leder = new T.MeshStandardMaterial({ color: 0x6a4428, roughness: .5 }), schnalle = new T.MeshStandardMaterial({ color: 0xc4c4bc, metalness: 1, roughness: .3 });
      const L0 = lx ? b.min.x : b.min.z, L1 = lx ? b.max.x : b.max.z;
      for (const f of [.16, .3, .86]) { const st = new T.Group(), band = new T.Mesh(new T.BoxGeometry(lx ? .06 : lw, .012, lx ? lw : .06), leder), sc = new T.Mesh(new T.BoxGeometry(.04, .02, .04), schnalle); sc.position.set(lx ? 0 : lw * .36, .008, lx ? lw * .36 : 0); st.add(band, sc); const q = L0 + (L1 - L0) * f; st.position.set(lx ? q : cx, my + .008, lx ? cz : q); st.traverse(o => { if (o.isMesh) { o.castShadow = true; o.userData.noCol = true; } }); GB.add(st); } } catch (e) { console.warn('Basis-Umsetzung Riemen', e); }
    interact(firstMesh(g, /mattress/) || firstMesh(g), 'Eisenbett', () => toast('Ein Eisenbett im Keller. Die Matratze ist fleckig und nach der Mitte zu durchgelegen – von einem Kind. An den Pfosten: Lederriemen, sehr kurz eingestellt.', 5800)); // STORY-HOOK
    const top = surfY(g, 300.2, 303.4, 1.4, .5); toy('SM_ToyBunny', GB, 301.1, top, 303.45, PI + .4); }
  { const p = await GL('pallet_ms'); p.rotation.z = -(PI / 2 - .24); put(p, { minX: 295.12, z: 297.3, y: 0 }, GB); }
  put(await GL('jerrycan'), { x: 304.3, z: 300.3, y: 0, ry: 2.2 }, GB); put(await GL('jerrycan'), { x: 304.35, z: 299.85, y: 0, ry: 1.1, s: .9 }, GB);
  await trashcan(GB, { x: 304.3, z: 296.55, y: 0, ry: .7 });
  web(GB, 304.6, 2.2, 296.4, -PI / 4, .6); web(GB, 295.4, .5, 303.6, PI / 4, .5);

  // ------------------------------------------------------------------ Puppe (Nr. 7, Schlafzimmer): dreht den Kopf, wenn man wegsieht – und wandert
  { const src = await FBX('doll', { Body: { b: 'body_diff.png', n: 'body_norm.png', r: 'body_rough.png', color: 0xb4aca4 }, Cloth: { b: 'cloth_diff.png', n: 'cloth_norm.png', r: 'cloth_rough.png', ds: 1, color: 0x8a8276 },
      Hair: { b: 'hair_diff.png', n: 'hair_norm.png', ds: 1, color: 0x5e5048 }, Eye: { b: 'eye_diff.png', color: 0xd0d0d0 }, Knife: { b: 'knife_diff.png', m: 'knife_metallic.jpg', r: 'knife_rough.jpg' } });
    src.updateMatrixWorld(true); const headRe = /^(Head|Eyeball|Eyelash|Eyebrow|Hair_Top|Hair_Front|Hair_Side)/, buckets = new Map();
    src.traverse(m => { if (!m.isMesh || /Rabbit_Ear|Hair_Band/.test(m.name)) return; const mat = [].concat(m.material)[0], pt = headRe.test(m.name) ? 'h' : 'b', k = pt + mat.uuid;
      let g = m.geometry.clone().applyMatrix4(m.matrixWorld); if (g.index) g = g.toNonIndexed(); g.morphAttributes = {}; g.clearGroups();
      for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(a)) g.deleteAttribute(a); if (!g.attributes.uv) return; if (!g.attributes.normal) g.computeVertexNormals();
      if (!buckets.has(k)) buckets.set(k, { pt, mat, geos: [] }); buckets.get(k).geos.push(g); });
    const root = new T.Group(), head = new T.Group(), pv = V(3.5, 176, 5); head.position.copy(pv); root.add(head); let bodyMesh = null;
    for (const { pt, mat, geos } of buckets.values()) { const geo = mergeGeometries(geos); if (!geo) continue; const mesh = new T.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
      if (pt === 'h') { geo.translate(-pv.x, -pv.y, -pv.z); head.add(mesh); } else { root.add(mesh); if (!bodyMesh || /Cloth/.test(mat.name)) bodyMesh = mesh; } }
    root.scale.setScalar(.56 / 297); const holder = new T.Group(); holder.add(root); G7.add(holder); holder.userData.noCol = true; holder.userData.ioDyn = true;
    const bedTop = surfY(gBed7, 21.3, -21.25, Y + 1.3);
    const spots = [[24.9, cribTop, -21.4, -.4], [21.25, bedTop, -21.3, .37], [22.66, Y, -17.42, .15]];
    const D = S.doll = { holder, head, spots, stage: 0, seen: 0, seenPos: 0, away: false, moved: false, lastYaw: 0, creak: 0, said: {} };
    D.place = i => { const [x, y, z, ry] = spots[i]; holder.position.set(x, y, z); holder.rotation.y = ry; head.rotation.set(0, 0, 0); };
    D.place(0);
    if (bodyMesh) interact(bodyMesh, 'Puppe', () => toast('Porzellan, kalt und feucht. Am Handgelenk ein Namensband aus dem Krankenhaus: „Wendt, Zayn“. Das Messer in ihrer Hand ist echt.', 5800)); } // STORY-HOOK: Zayn / die Puppe

  // ------------------------------------------------------------------ jedes Bild: Sichtbarkeit, Uhr, Puppe, Ball, Kerzen, Fenster
  const R7 = { x0: 20.1, x1: 26, zb: -21.9, zf: -17 }; // Schlafzimmer Nr. 7
  const KZ = { x0: -55.9, x1: -50, zb: -21.9, zf: -17 }; // Kinderzimmer Nr. 1
  const inR = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.zb - m && z < r.zf + m;
  const tv = V(), fw = V();
  S.tick = (dt, t) => {
    const P = player.pos, cam = camera.position;
    G7.visible = !state.inBasement && inR(s7, P.x, P.z, door7.open ? 16 : .9);
    G1.visible = !state.inBasement && inR(s1, P.x, P.z, door1.open ? 16 : .9);
    GB.visible = Math.abs(P.x - B.x) < 25 && Math.abs(P.z - B.z) < 25;
    for (const v of vls) v.L.visible = v.par.visible;
    camera.getWorldDirection(fw);
    // Stehlampe: Schirm glüht mit dem Wohnzimmerlicht (Flackern, Stromausfall)
    if (shadeMat) shadeMat.emissiveIntensity = livingLight.userData.dead ? 0 : Math.max(0, livingLight.intensity) / 4 * .6;
    // Pendel + Ticken
    for (const c of clocks) { if (!c.g.parent.visible) continue; const a = Math.sin(t * 5.6 + c.ph) * .075; if (c.pend) c.pend.rotation.z = a;
      c.tk -= dt; if (c.tk < 0) { c.tk = .56; const d = cam.distanceTo(c.pos); if (d < 6) Audio.play('woodHit3', { gain: .045 * (1 - d / 6), rate: (c.tick = !c.tick) ? 2.7 : 3.1, x: c.pos.x, y: c.pos.y, z: c.pos.z, ref: 1 }); } }
    // Kerzen flackern
    for (const f of flames) { if (!f.fl.parent.visible) continue; const k = .82 + Math.sin(t * 9 + f.seed) * .09 + Math.sin(t * 23 + f.seed * 2) * .07 + (Math.random() < .03 ? -.3 : 0); f.fl.scale.set(.05 * k, .085 * k, 1); if (f.L) f.L.intensity = 1.0 * k; }
    if (S.circleL) S.circleL.intensity = state.blackout ? .15 : 1.2 * (.85 + Math.sin(t * 7) * .08 + Math.sin(t * 17.3) * .05);
    // Fenster: Nacht draußen, bei Blitzen hell
    const fl = skyMat.uniforms.flash ? skyMat.uniforms.flash.value : 0; for (const m of nightMats) m.emissiveIntensity = .8 + fl * 9;
    // Spiegel: für einen Moment ein anderes Gesicht
    if (S.mirFace) { if (S.mirT > 0) { S.mirT -= dt; S.mirFace.material.opacity = S.mirT > 0 ? .32 : 0; } }
    // Ball im Kinderzimmer rollt dir entgegen
    const Bl = S.ball; if (Bl && G1.visible) { if (Bl.t < 0) { if (inR(KZ, P.x, P.z)) { Bl.inT += dt; if (Bl.inT > 1.4) { Bl.t = 0; Audio.play('scrape2', { gain: .12, rate: 1.7, x: Bl.from.x, y: .5, z: Bl.from.z, ref: 2 }); } } else Bl.inT = 0; }
      else if (Bl.t < 1) { const k0 = Bl.t; Bl.t = Math.min(1, Bl.t + dt / 2.8); const e = 1 - Math.pow(1 - Bl.t, 2.2), e0 = 1 - Math.pow(1 - k0, 2.2); Bl.m.position.lerpVectors(Bl.from, Bl.to, e);
        const d = Bl.to.clone().sub(Bl.from), L = d.length(); d.normalize(); Bl.m.rotateOnWorldAxis(V(d.z, 0, -d.x), (e - e0) * L / .1); } }
    // Puppe
    const D = S.doll; if (D && G7.visible) {
      const hp = D.holder.position; tv.set(hp.x - cam.x, hp.y + .35 - cam.y, hp.z - cam.z); const dist = tv.length(); tv.normalize();
      const inView = fw.dot(tv) > .8 && dist < 11, inRoom = inR(R7, P.x, P.z);
      const yawTo = Math.atan2(cam.x - hp.x, cam.z - hp.z) - D.holder.rotation.y; let rel = Math.atan2(Math.sin(yawTo), Math.cos(yawTo)); rel = Math.max(-1.15, Math.min(1.15, rel));
      if (!inView) { if (Math.abs(rel - D.head.rotation.y) > .35) D.moved = true; D.head.rotation.y = rel; D.head.rotation.z = -rel * .22; D.head.rotation.x = .12; }
      else { if (D.moved && dist < 7) { D.moved = false; if (D.creak <= 0) { D.creak = 6; Audio.play('woodSqueak1', { gain: .14, rate: 1.9, x: hp.x, y: hp.y + .4, z: hp.z, ref: 1.5 }); } }
        if (dist < 6) D.seen += dt; }
      D.creak -= dt;
      if (D.seen > 1.2 && !inRoom && !inView && D.stage < 2 && dist > 3) { D.stage++; D.place(D.stage); D.seen = 0; D.away = true; }
      if (D.away && inView && dist < 7) { D.away = false; if (!D.said[D.stage]) { D.said[D.stage] = 1; subtitle(D.stage === 1 ? '<i>Die Puppe sitzt jetzt auf dem Bett. Eben lag sie noch im Kinderbett.</i>' : '<i>Sie steht in der Tür. Und sieht dir nach.</i>', 4200); Audio.stinger(false); } }
    }
  };
  // ------------------------------------------------------------------ statische Teile je Bereich zusammenfassen (gleiches Material → ein Mesh, weniger Draw Calls)
  const keyOf = (m, o) => [m.type, m.map && m.map.source.uuid, m.map && [m.map.repeat.x, m.map.repeat.y, m.map.offset.x, m.map.offset.y].join(), m.normalMap && m.normalMap.source.uuid, m.roughnessMap && m.roughnessMap.source.uuid,
    m.metalnessMap && m.metalnessMap.source.uuid, m.aoMap && m.aoMap.source.uuid, m.alphaMap && m.alphaMap.uuid, m.emissiveMap && m.emissiveMap.uuid, m.color && m.color.getHex(), m.roughness, m.metalness, m.side, m.transparent, m.opacity, m.depthWrite, m.alphaTest,
    m.emissive && m.emissive.getHex(), m.emissiveIntensity, m.polygonOffset, m.normalScale && m.normalScale.x, m.customProgramCacheKey ? m.customProgramCacheKey() : '', o.castShadow, o.renderOrder].join('|');
  const staticMerge = G => {
    G.updateMatrixWorld(true); const buckets = new Map(), victims = []; let n0 = 0;
    G.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh) return; n0++;
      for (let p = o; p && p !== G; p = p.parent) if (p.userData.ioDyn || !p.visible) return;
      if (interactables.includes(o)) return; const mats = [].concat(o.material); if (mats.some(m => !m || m.visible === false)) return;
      if ((o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) > 90000) return; // schwere Einzelstücke bleiben indiziert (Speicher)
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); if (!g.attributes.normal) g.computeVertexNormals();
      g.applyMatrix4(o.matrixWorld); const flip = o.matrixWorld.determinant() < 0;
      const P = g.attributes.position, cnt = P.count, uv = g.attributes.uv;
      const grps = g.groups.length ? g.groups : [{ start: 0, count: cnt, materialIndex: 0 }];
      for (const gr of grps) { const mat = mats[gr.materialIndex] || mats[0], st = gr.start, n = Math.min(gr.count, cnt - st); if (n < 3) continue;
        const sub = new T.BufferGeometry(), cut = (a, k) => { const arr = new Float32Array(n * k); for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) arr[i * k + j] = a && j < a.itemSize ? a.getComponent(st + i, j) : 0; return arr; };
        const pos = cut(P, 3), nor = cut(g.attributes.normal, 3), tex = cut(uv, 2);
        if (flip) for (let i = 0; i + 2 < n; i += 3) for (const [arr, k] of [[pos, 3], [nor, 3], [tex, 2]]) for (let j = 0; j < k; j++) { const a = (i + 1) * k + j, b = (i + 2) * k + j, t = arr[a]; arr[a] = arr[b]; arr[b] = t; }
        sub.setAttribute('position', new T.BufferAttribute(pos, 3)); sub.setAttribute('normal', new T.BufferAttribute(nor, 3)); sub.setAttribute('uv', new T.BufferAttribute(tex, 2));
        const k = keyOf(mat, o); if (!buckets.has(k)) buckets.set(k, { mat, cast: o.castShadow, ro: o.renderOrder, geos: [] }); buckets.get(k).geos.push(sub); }
      victims.push(o); });
    victims.forEach(o => o.parent && o.parent.remove(o));
    for (const { mat, cast, ro, geos } of buckets.values()) { const geo = geos.length > 1 ? mergeGeometries(geos) : geos[0]; if (!geo) continue; geo.computeBoundingBox(); geo.computeBoundingSphere();
      const m = new T.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; m.renderOrder = ro; m.name = 'io_merged'; G.add(m); }
    return n0 + ' → ' + (n0 - victims.length + buckets.size); };
  S.merge = [staticMerge(G7), staticMerge(G1), staticMerge(GB)];
  S.info = { merge: S.merge, ms: Math.round(performance.now() - t0), loadMs: S.tLoad, miss: S.miss, nr7: meshes(G7).length, nr1: meshes(G1).length, keller: meshes(GB).length };
  S.ready = true; window.__innen_ort = S; // nur für Selbsttests lesbar
}]);
WORLD_TICK.push((dt, t, indoor) => { const S = innen_ort_S; if (!S.ready) return; try { S.tick(dt, t, indoor); } catch (e) { if (!S.err) { S.err = 1; console.warn('innen_ort tick', e); } } });
// Fülllicht mit Quelle (AP Welt/Licht, visual_identity.md): Nachts fällt kaltes Mond-/Laternenlicht durch die Fenster von Nr. 7 und Nr. 1 – die Räume lesen sich als Räume,
// ohne Taschenlampe bleibt es dunkel genug für den Horror. Nur Intensität der vorhandenen Hemisphäre (keine Lichter); im Keller (keine Fenster) nichts.
if (typeof LICHT_HAKEN !== 'undefined') LICHT_HAKEN.push((dt, indoor, rect) => { if (!rect || state.inBasement) return; const x = player.pos.x, z = player.pos.z, h7 = inRect(s7, x, z); if (!h7 && !inRect(s1, x, z)) return; hemi.intensity += (h7 ? .11 : .08) * (state.outage ? .6 : 1) * (1 - ENV_DARK * .6); }); // Raumrechtecke sind je Zimmer eigene Objekte → Hausgrenzen prüfen
