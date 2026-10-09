// =====================================================================  WELT-MODUL · innen_kapitel
// Kapitel 2 (Amt für Rückführung, Ebene −2), Kapitel 3 („Das Weiße“) und der Gully-Einstieg zur versunkenen Stadt.
// Selbstgebaute Möbel/Requisiten werden versteckt (samt Kisten-Hitbox) und durch Scan-Modelle ersetzt;
// Wände/Stahlflächen bekommen Megascans-Oberflächen; Blut, Schleifspuren, Nässe, Akten, Kinderzeichnungen erzählen.
// Alle Rätsel-Objekte (Akten, Ordnungstafel, Schublade, Sicherungskasten, Klavier, Uhr, Karte, Abgrund) bleiben dieselben Meshes.
const innen_kapitel_S = { ok: false, t: 0, inst: {} };
WORLD_MODS.push(['Innenräume Kapitel 2 und 3', async () => {
  const S = innen_kapitel_S, V = THREE.Vector3, PI2 = Math.PI * 2;
  const { clone: SKC } = await import('three/addons/utils/SkeletonUtils.js');
  const XA = C2.x, ZA = C2.z, XW = C3.x, ZW = C3.z;
  window.__ik = S; const before = new Set(scene.children); S.hidden = [];

  // ------------------------------------------------------------------ Werkzeuge
  // Modell laden → Geometrien mit eingebackener Transformation, normiert (Unterkante y = 0, Mitte x/z = 0, Größe in Metern)
  async function kit(src, size, axis = 'y') {
    let root;
    if (src.fbx) root = await msFBX(src.fbx, src.file || 'model.fbx', src.spec || {});
    else root = (await msModel(src.gltf, src.file || 'model.gltf')).clone(true);
    root.updateMatrixWorld(true);
    const parts = []; root.traverse(m => { if (m.isMesh && !m.isSkinnedMesh) parts.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material, name: m.name }); });
    const bb = new THREE.Box3(); parts.forEach(p => { p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); });
    const sz = bb.getSize(new V()), cur = axis === 'max' ? Math.max(sz.x, sz.y, sz.z) : sz[axis], s = size / cur;
    const mt = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2));
    parts.forEach(p => { p.geo.applyMatrix4(mt); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); if (p.mat) [].concat(p.mat).forEach(m => { m.envMapIntensity = .6; }); });
    const K = { parts, size: sz.multiplyScalar(s), list: [], name: src.gltf || src.fbx }; return K;
  }
  // Materialvariante (z. B. weiß gestrichen fürs Weiße)
  const variant = (K, fn) => ({ parts: K.parts.map(p => ({ geo: p.geo, name: p.name, mat: Array.isArray(p.mat) ? p.mat.map(m => fn(m, p.name)) : fn(p.mat, p.name) })), size: K.size, list: [], name: K.name + '*', noShadow: K.noShadow });
  const _mv = new V();
  function minY(K, m) { let y = Infinity; for (const p of K.parts) { const P = p.geo.attributes.position, st = Math.max(1, Math.floor(P.count / 1500)); for (let i = 0; i < P.count; i += st) { _mv.fromBufferAttribute(P, i).applyMatrix4(m); if (_mv.y < y) y = _mv.y; } } return y; }
  function aabb(K, m) { const b = new THREE.Box3(); for (const p of K.parts) { const P = p.geo.attributes.position, st = Math.max(1, Math.floor(P.count / 1500)); for (let i = 0; i < P.count; i += st) b.expandByPoint(_mv.fromBufferAttribute(P, i).applyMatrix4(m)); } return b; }
  // Platzieren (gesammelt, am Ende als InstancedMesh je Bereich). Kippung: rx/rz lokal, danach Drehung ry.
  // x/z = Mitte der Grundfläche, y = Unterkante; minX/maxX/minZ/maxZ richten die Grundfläche an einer Wand aus.
  function put(K, x, z, o = {}) {
    const { ry = 0, s = 1, sv = null, rx = 0, rz = 0, y = 0 } = o;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ'));
    const m = new THREE.Matrix4().compose(new V(), q, sv ? sv.clone().multiplyScalar(s) : new V(s, s, s)), b = aabb(K, m);
    let px = x - (b.min.x + b.max.x) / 2, pz = z - (b.min.z + b.max.z) / 2;
    if (o.minX !== undefined) px = o.minX - b.min.x; if (o.maxX !== undefined) px = o.maxX - b.max.x; if (o.minZ !== undefined) pz = o.minZ - b.min.z; if (o.maxZ !== undefined) pz = o.maxZ - b.max.z;
    m.setPosition(px, y - b.min.y, pz); K.list.push(m); if (!kits.includes(K)) kits.push(K); return m;
  }
  // Höhe einer Ablagefläche eines platzierten Modells (Strahl von oben, ab Höhe from)
  function surfY(K, m, x, z, from = 3) { const g = new THREE.Group(); for (const p of K.parts) g.add(new THREE.Mesh(p.geo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))); g.applyMatrix4(m); g.updateMatrixWorld(true);
    const h = new THREE.Raycaster(new V(x, from, z), new V(0, -1, 0)).intersectObject(g, true)[0]; return h ? h.point.y : 0; }
  const kits = [];
  function flushKits() {
    for (const K of kits) { const groups = new Map(); for (const m of K.list) { const e = m.elements, key = Math.round(e[12] / 12) + ',' + Math.round(e[14] / 150); if (!groups.has(key)) groups.set(key, []); groups.get(key).push(m); }
      for (const list of groups.values()) (S.inst[K.name] = S.inst[K.name] || []).push(...msInst(K.parts, list, { shadow: !K.noShadow })); }
  }
  // Region: alle Meshes im Rechteck (einmal gesammelt)
  scene.updateMatrixWorld(true);
  const regionMeshes = []; { const bb = new THREE.Box3(), c = new V(); scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; bb.setFromObject(o); if (bb.isEmpty()) return; bb.getCenter(c);
    if ((c.x > 595 && c.x < 730 && c.z > -2615 && c.z < -2585) || (c.x < -540 && c.x > -610 && c.z > -2615 && c.z < -2585)) regionMeshes.push({ o, c: c.clone(), s: bb.getSize(new V()) }); }); }
  const find = pred => regionMeshes.filter(r => pred(r.o, r.c, r.s)).map(r => r.o);
  const near = (c, x, y, z, e = .06) => Math.abs(c.x - x) < e && Math.abs(c.y - y) < e && Math.abs(c.z - z) < e;
  function hide(o) { if (!o) return; msHide(o); S.hidden.push(o); const i = occluders.indexOf(o); if (i >= 0) occluders.splice(i, 1); }
  // Box-UVs in Weltmetern (für Scan-Oberflächen auf bestehenden Kisten)
  function retex(m, mat, tile = 1.5) { const p = m.geometry.parameters; if (p && p.width !== undefined && !m.geometry.userData.ikUV) { worldUV(m.geometry, p.width, p.height, p.depth, tile); m.geometry.attributes.uv.needsUpdate = true; m.geometry.userData.ikUV = true; } m.material = mat; }
  // Unsichtbare Klickfläche + Text
  function spot(x, y, z, w, h, d, label, fn) { const b = box(w, h, d, x, y, z, hidden, { cast: false }); interact(b, label, fn); return b; }
  const note = (title, html, key, after) => () => openNote(title, html, key ? 'ik_' + key : undefined, after);
  // Flache Ebenen (Decals, Papiere) je Material zusammengefasst → wenige Draw Calls
  const batch = new Batch(); let dSeq = 0;
  function flat(mat, x, z, w, h, rot = 0, y = .012) { const g = new THREE.PlaneGeometry(w, h); batch.add(g, mat, new THREE.Matrix4().compose(new V(x, y + (dSeq++ % 23) * .0004, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, rot, 0, 'YXZ')), new V(1, 1, 1))); }
  // Wand-Decal: ry = Blickrichtung der Fläche (0 → +z, π → −z, π/2 → +x, −π/2 → −x), rz = Drehung in der Fläche
  function onWall(mat, x, y, z, w, h, ry, rz = 0) { const g = new THREE.PlaneGeometry(w, h); if (mat.userData.tileU) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * w / mat.userData.tileU + x * .37); } batch.add(g, mat, new THREE.Matrix4().compose(new V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, rz, 'YXZ')), new V(1, 1, 1))); }
  let rs = 7; const R = (a, b) => { rs = (rs * 16807) % 2147483647; return a + (b - a) * (rs / 2147483647); }; // reproduzierbarer Zufall

  // ------------------------------------------------------------------ Materialien
  const T = (p, srgb, rep) => msTex(p, srgb, rep);
  const steelMat = (tint, nrm = .35, metal = .12) => { const m = new THREE.MeshStandardMaterial({ map: T('corrugated/b.jpg', true), normalMap: T('rust_sheet/n.jpg'), roughnessMap: T('corrugated/orm.jpg'), color: tint, metalness: metal, roughness: 1 }); m.normalScale.set(nrm, nrm); return m; };
  // QA M-6 (Notlösung): glatter, abgenutzter Lack für die Aktenschränke (Albedo aus rust_sheet aufgehellt, ms/lack_grau) statt Wellblech mit senkrechten Rippen
  const lackMat = (tint, nrm = .1, metal = .1) => { const m = new THREE.MeshStandardMaterial({ map: T('lack_grau/b.jpg', true), normalMap: T('rust_sheet/n.jpg'), roughnessMap: T('rust_sheet/orm.jpg'), color: tint, metalness: metal, roughness: .85 }); m.normalScale.set(nrm, nrm); return m; };
  const rustMat = msSurfMat('rust_sheet', { tint: 0xd8cfc6 });
  const cabinetMat = lackMat(0xc8cdc0), cabinetDark = lackMat(0x5a5e56, .08), panelMat = steelMat(0xb0b4aa, .25, .15), machineMat = steelMat(0x7f877b, .3, .15);
  const decal = (key, tint, rough) => { const m = msSurfMat(key, { alpha: true, tint }); if (rough !== undefined) { m.roughnessMap = null; m.roughness = rough; } return m; };
  const bloodFresh = decal('blood_s2', 0xb8a4a4, .12), bloodDrops = decal('blood_s1', 0xb09a9a, .2), bloodSmear = decal('blood_hv', 0xa08888, .35);
  const bloodOld = decal('blood_s1', 0x6a4a40, .8), bloodOldS = decal('blood_s2', 0x5a3c34, .75);
  const damp = new THREE.MeshStandardMaterial({ color: 0x100e0b, roughness: .35, metalness: .05, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, alphaMap: (() => { const t = tex(cnv(512, (x, w) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, w);
    for (let i = 0; i < 2200; i++) { const px = rand(0, w), top = w * (.42 + .16 * Math.sin(px * .021) + .08 * Math.sin(px * .067) + rand(-.05, .05)), py = rand(top, w), a = Math.pow((py - top) / (w - top), .7) * .13; x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.arc(px, py, rand(5, 20), 0, 7); x.fill(); }
    for (let i = 0; i < 30; i++) { const px = rand(0, w), y0 = rand(w * .1, w * .45), g = x.createLinearGradient(0, y0, 0, w); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.28)'); x.fillStyle = g; x.fillRect(px, y0, rand(1.5, 4), w); } }), false); t.wrapS = THREE.RepeatWrapping; return t; })() });
  damp.userData.tileU = 2;
  const puddleMat = new THREE.MeshStandardMaterial({ map: T('blood_hv/b.png', true), color: 0x2a2d2e, roughness: .06, metalness: .2, transparent: true, opacity: .8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, envMapIntensity: 1.6 });
  const soot = new THREE.MeshStandardMaterial({ map: T('blood_s2/b.png', true), color: 0x1c1a17, roughness: .9, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, alphaTest: .02 });
  const whiteGrime = new THREE.MeshStandardMaterial({ map: T('blood_hv/b.png', true), color: 0x7a7876, roughness: .9, transparent: true, opacity: .35, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  // Papier: Akten, Formulare, Kinderzeichnungen (Canvas, auf echten Oberflächen)
  function paperCanvas(kind, seed) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 362; const x = c.getContext('2d'); let k = seed * 7 + 1; const r = (a, b) => { k = (k * 16807) % 2147483647; return a + (b - a) * (k / 2147483647); };
    papierScan(x, 256, 362, kind === 'kid' ? '#ece6d6' : ['#d8d0b8', '#d3cbb3', '#ddd6c0'][seed % 3], { dreck: kind === 'kid' ? .2 : .4 }); // echtes Papier
    for (let i = 0; i < 3; i++) { const g = x.createRadialGradient(r(0, 256), r(0, 362), 0, r(0, 256), r(0, 362), r(40, 140)); g.addColorStop(0, `rgba(120,90,40,${r(.05, .18)})`); g.addColorStop(1, 'rgba(120,90,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 362); }
    if (kind === 'kid') { // Kinderzeichnung: Buntstift
      x.lineCap = 'round'; x.lineWidth = 4; const cols = ['#c02020', '#2040c0', '#208030', '#101010', '#d08010'];
      if (seed === 3) { // Stuhlkreis mit Licht: acht Stühle im Kreis, der achte durchgestrichen und noch einmal hingemalt
        x.strokeStyle = '#d08010'; x.lineWidth = 4; x.beginPath(); x.arc(128, 62, 26, 0, 7); x.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.beginPath(); x.moveTo(128 + Math.cos(a) * 34, 62 + Math.sin(a) * 34); x.lineTo(128 + Math.cos(a) * 48, 62 + Math.sin(a) * 48); x.stroke(); }
        x.fillStyle = 'rgba(255,225,110,.35)'; x.beginPath(); x.moveTo(128, 90); x.lineTo(40, 250); x.lineTo(216, 250); x.fill();
        const chair = (cx, cy, col) => { x.strokeStyle = col; x.lineWidth = 3; x.strokeRect(cx - 8, cy - 5, 16, 11); x.beginPath(); x.moveTo(cx - 8, cy - 5); x.lineTo(cx - 8, cy - 20); x.moveTo(cx + 8, cy - 5); x.lineTo(cx + 8, cy - 20); x.moveTo(cx - 8, cy - 15); x.lineTo(cx + 8, cy - 15); x.moveTo(cx - 6, cy + 6); x.lineTo(cx - 6, cy + 17); x.moveTo(cx + 6, cy + 6); x.lineTo(cx + 6, cy + 17); x.stroke(); };
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + .3, cx = 128 + Math.cos(a) * 92, cy = 262 + Math.sin(a) * 38; if (i === 7) { chair(cx, cy, '#2040c0'); x.strokeStyle = '#101010'; x.lineWidth = 5; x.beginPath(); x.moveTo(cx - 17, cy - 22); x.lineTo(cx + 17, cy + 20); x.moveTo(cx + 17, cy - 22); x.lineTo(cx - 17, cy + 20); x.stroke(); chair(cx + 3, cy + 4, '#c02020'); } else chair(cx, cy, cols[i % 4]); }
        x.fillStyle = '#101010'; x.font = '26px Caveat'; x.fillText('hier', 100, 346); }
      else if (seed % 3 === 0) { x.strokeStyle = '#d08010'; x.beginPath(); x.arc(200, 60, 26, 0, 7); x.stroke(); for (let i = 0; i < 8; i++) { const sx = 30 + i * 26; x.strokeStyle = cols[i % 5]; x.beginPath(); x.arc(sx, 200, 9, 0, 7); x.moveTo(sx, 209); x.lineTo(sx, 250); x.moveTo(sx, 250); x.lineTo(sx - 8, 280); x.moveTo(sx, 250); x.lineTo(sx + 8, 280); x.moveTo(sx - 12, 225); x.lineTo(sx + 12, 225); x.stroke(); } x.fillStyle = '#101010'; x.font = '30px Caveat'; x.fillText('wir 8', 90, 330); }
      else if (seed % 3 === 1) { x.strokeStyle = '#101010'; x.beginPath(); x.ellipse(128, 110, 80, 22, 0, 0, 7); x.stroke(); x.strokeStyle = '#e8e8f0'; x.lineWidth = 14; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(90 + i * 18, 130); x.lineTo(70 + i * 28, 320); x.stroke(); } x.lineWidth = 4; x.strokeStyle = '#2040c0'; x.beginPath(); x.arc(128, 300, 10, 0, 7); x.stroke(); x.fillStyle = '#c02020'; x.font = '28px Caveat'; x.fillText('DAS LICHT', 60, 40); }
      else { x.strokeStyle = '#404040'; x.lineWidth = 6; x.beginPath(); x.moveTo(90, 120); x.lineTo(90, 300); x.moveTo(60, 170); x.lineTo(120, 170); x.moveTo(90, 300); x.lineTo(70, 340); x.moveTo(90, 300); x.lineTo(110, 340); x.stroke(); x.beginPath(); x.arc(90, 100, 22, 0, 7); x.stroke(); x.lineWidth = 3; x.strokeStyle = '#2040c0'; x.beginPath(); x.arc(170, 240, 10, 0, 7); x.moveTo(170, 250); x.lineTo(170, 290); x.moveTo(170, 262); x.lineTo(125, 175); x.stroke(); x.fillStyle = '#101010'; x.font = '26px Caveat'; x.fillText('der eiserne Mann', 40, 40); }
      return c; }
    x.fillStyle = '#222'; x.font = 'bold 13px Courier New'; x.fillText('BUNDESSTELLE FÜR RÜCKFÜHRUNG', 18, 30); if (typeof amt_auge === 'function') amt_auge(x, 226, 26, 11, 'rgba(34,34,34,.8)'); x.font = '10px Courier New'; x.fillText('Außenstelle Lost Eyengless · Ebene −2', 18, 44); x.fillRect(18, 50, 220, 1.5);
    x.fillText(['Az. R-2009/0' + (seed % 8 + 1), 'Vermessungsprotokoll · Sommer 2009', 'Formblatt 8 · Rückführung', 'Laufzettel'][seed % 4], 18, 66);
    if (seed % 4 === 0) { x.fillStyle = '#2a2622'; x.fillRect(176, 60, 58, 72); x.fillStyle = '#4a443c'; x.beginPath(); x.arc(205, 88, 13, 0, 7); x.fill(); x.fillRect(190, 104, 30, 28); }
    for (let i = 0; i < 17; i++) { const y = 84 + i * 14; if (r(0, 1) < .15) continue; x.fillStyle = `rgba(30,30,30,${r(.55, .85)})`; x.fillRect(18, y, r(60, seed % 4 === 0 ? 150 : 215), 5); }
    if (seed % 4 === 2) { x.strokeStyle = '#333'; x.lineWidth = 1; for (let i = 0; i < 6; i++) x.strokeRect(18, 110 + i * 26, 220, 22); }
    const st = ['RÜCKLÄUFER', 'RÜCKGEFÜHRT', 'VERTRAULICH', 'NICHT ZURÜCKGEFÜHRT', 'ZYKLUS 2009'][seed % 5];
    x.save(); x.translate(r(110, 150), r(270, 310)); x.rotate(r(-.4, .2)); x.strokeStyle = 'rgba(150,20,20,.75)'; x.lineWidth = 3; x.font = 'bold 17px Arial'; const tw = x.measureText(st).width; x.strokeRect(-tw / 2 - 8, -17, tw + 16, 30); x.fillStyle = 'rgba(150,20,20,.75)'; x.textAlign = 'center'; x.fillText(st, 0, 5); x.restore();
    if (seed % 3 === 1) { x.strokeStyle = 'rgba(80,50,20,.35)'; x.lineWidth = 6; x.beginPath(); x.arc(r(60, 200), r(90, 300), 26, 0, 7); x.stroke(); }
    return c;
  }
  const paperMats = [0, 1, 2, 3, 4, 5].map(i => new THREE.MeshStandardMaterial({ map: tex(paperCanvas('doc', i), true), color: 0xa8a08c, roughness: 1, side: THREE.DoubleSide }));
  const kidMats = [0, 1, 2, 3].map(i => new THREE.MeshStandardMaterial({ map: tex(paperCanvas('kid', i), true), roughness: .95, side: THREE.DoubleSide }));
  const papers = (x, z, n, spread, y = .006) => { for (let i = 0; i < n; i++) flat(paperMats[Math.floor(R(0, 6))], x + R(-spread, spread), z + R(-spread, spread) * .7, .21, .297, R(0, PI2), y); };
  // Fotografie (unscharf, sepia) für Rahmen
  function photoMat(kind) { const c = cnv(256, (x, w) => { x.fillStyle = kind === 'white' ? '#f2f2f0' : '#3a3024'; x.fillRect(0, 0, w, w); if (kind === 'white') { const g = x.createRadialGradient(w / 2, w / 2, 10, w / 2, w / 2, w * .7); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d8d6d0'); x.fillStyle = g; x.fillRect(0, 0, w, w); x.filter = 'blur(6px)'; x.fillStyle = 'rgba(120,110,100,.18)'; x.beginPath(); x.arc(128, 100, 30, 0, 7); x.fill(); x.fillRect(96, 128, 64, 128); x.filter = 'none'; return; }
      const g = x.createLinearGradient(0, 0, 0, w); g.addColorStop(0, '#9a8a6a'); g.addColorStop(1, '#5a4c38'); x.fillStyle = g; x.fillRect(12, 12, w - 24, w - 24); x.filter = 'blur(2.5px)';
      for (let i = 0; i < 8; i++) { const px = 34 + i * 27, s = i === 7 ? .9 : .8 + (i % 3) * .06; x.fillStyle = i === 7 ? '#2a241c' : '#3a3028'; x.beginPath(); x.arc(px, 132 - s * 22, 10 * s, 0, 7); x.fill(); x.fillRect(px - 11 * s, 132 - s * 12, 22 * s, 80); }
      x.filter = 'none'; x.fillStyle = 'rgba(240,235,220,.85)'; x.beginPath(); x.arc(34 + 7 * 27, 110, 12, 0, 7); x.fill(); }); return new THREE.MeshStandardMaterial({ map: tex(c, true), roughness: .35 }); }

  // ------------------------------------------------------------------ Modelle
  const [kTable, kShelf, kWard, kBag, kCan, kCrt, kRadio, kFrameD, kFrameG, kLamp, kClock, kDoor] = await Promise.all([
    kit({ gltf: 'metaltable' }, 3.0, 'x'), kit({ gltf: 'shelf' }, .85, 'x'), kit({ gltf: 'wardrobe' }, 1.95), kit({ gltf: 'trashbag' }, .68, 'x'), kit({ gltf: 'trashcan' }, .59),
    kit({ gltf: 'crt', file: 'model.glb' }, .37, 'x'), kit({ gltf: 'radio' }, .23), kit({ gltf: 'frame_dmg' }, .69), kit({ gltf: 'frame_deco' }, .9), kit({ gltf: 'floorlamp' }, 1.6), kit({ gltf: 'wallclock' }, 1.05), kit({ gltf: 'door1' }, 2.02)]);
  const [kChair, kBed, kDresser, kCrib] = await Promise.all([
    kit({ fbx: 'chair', spec: { '*': { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } } }, .93),
    kit({ fbx: 'hospbed', spec: { blanket: { b: 'blanket_color.jpg', n: 'blanket_nrm.jpg', r: 'blanket_rough.jpg', ds: true }, mattress: { b: 'mattress_color.jpg', n: 'mattress_nrm.jpg', r: 'mattresss_rough.jpg' }, bed: { b: 'bed_color.jpg', n: 'bed_nrm.jpg', r: 'bed_Rough.jpg', m: 'bed_metalic.jpg' } } }, 1.95, 'z'),
    kit({ fbx: 'dresser', spec: { 'Wood-1': { b: 'T_Wood-1_BaseColor.jpg', n: 'T_Wood-1_Normal.jpg', r: 'T_Wood-1_Roughness.jpg', ao: 'T_Wood-1_Ao.jpg' }, 'Wood-2': { b: 'T_Wood-2_BaseColor.jpg', n: 'T_Wood-2_Normal.jpg', r: 'T_Wood-2_Roughness.jpg', ao: 'T_Wood-2_Ao.jpg' }, 'Wood-3': { b: 'T_Wood-3_BaseColor.jpg', n: 'T_Wood-3_Normal.jpg', r: 'T_Wood-3_Roughness.jpg', ao: 'T_Wood-3_Ao.jpg' }, Metal: { b: 'T_Metal_BaseColor.jpg', n: 'T_Metal_Normal.jpg', r: 'T_Metal_Roughness.jpg', m: 'T_Metal_Metallic.jpg' } } }, 2.0),
    kit({ fbx: 'crib', spec: { 'Material #2142147589': { b: '../planks_painted/b.jpg', n: '../planks_painted/n.jpg', r: '../planks_painted/orm.jpg', color: 0xe8e2d6 }, 'Material #2142147590': { b: '../hospbed/mattress_color.jpg', n: '../hospbed/mattress_nrm.jpg', color: 0xd8d0c0 }, 'Material #2142147602': { color: 0x2a2826, rough: .6 } } }, 1.25, 'x')]); // QA-Art 09.10.: weißes Kinderbett war einfarbig (Plastik) – jetzt abgegriffener Lack-Scan wie Zayns Bett in Nr. 7
  for (const K of [kBag, kCan, kCrt, kRadio, kFrameD, kFrameG, kShelf]) K.noShadow = true;
  const BED = new V(.7, 1, 1); // Eisenbett schmaler (Einzelbett)
  // Fürs Weiße: gleiche Formen, hell und leicht überstrahlt
  const whiten = (tint = 0xeceae4, keepMap = false, em = 0x18191c) => (m, name) => { const n = m.clone(); if (!keepMap) n.map = null; n.color = new THREE.Color(tint); n.emissive = new THREE.Color(em); n.metalness = Math.min(n.metalness, .2); return n; };
  const kChairW = variant(kChair, whiten(0xe6e4de)), kBedW = variant(kBed, (m, name) => { const n = whiten(0xf0efea)(m); if (m.name === 'bed') { n.roughness = .55; } return n; });
  const kDresserD = variant(kDresser, m => { const n = m.clone(); n.color = new THREE.Color(0x76726a); return n; });
  const kChairK = variant(kChair, (m) => { const n = m.clone(); n.emissive = new THREE.Color(0x0e0d0c); return n; });
  const lit = (K, em = 0x121212) => variant(K, m => { const n = m.clone(); n.emissive = new THREE.Color(em); return n; });
  const kWardW = lit(kWard, 0x1a1816), kDresserW = lit(kDresser, 0x161616), kFrameW = variant(kFrameD, whiten(0xe8e6e0)), kCrtW = lit(kCrt, 0x0a0a0a), kRadioW = lit(kRadio, 0x141210), kLampW = lit(kLamp, 0x181512), kClockW = lit(kClock, 0x1a1410), kShelfW = lit(kShelf, 0x161412), kCanW = lit(kCan, 0x141414), kTableW = lit(kTable, 0x121212);

  // ================================================================== KAPITEL 2 · AMT FÜR RÜCKFÜHRUNG
  const zS = ZA - 1.85, zN = ZA + 1.85; // Innenflächen der Gangwände
  const screens = []; // Röhrenmonitore mit Rauschen
  // ---------- Tunnel (x 600–618)
  { // Rohre, Stützen: Rost-Scan statt Farbe
    find((o, c) => o.material === M.rust && c.x < 618.5 && c.x > 599).forEach(o => retex(o, rustMat, 1.2));
    // Pfütze: unregelmäßige, spiegelnde Nässe statt Quadrat
    find((o, c) => o.material && o.material.color && o.material.color.getHex() === 0x0c0f10 && near(c, XA + 7, .02, ZA + .4, .2)).forEach(hide);
    flat(puddleMat, XA + 7, ZA + .3, 3.2, 2.2, .4, .02); flat(puddleMat, XA + 11.5, ZA - .6, 1.8, 1.2, 2.2, .02); flat(puddleMat, XA + 15.6, ZA + 1.1, 1.3, 1, 1, .02);
    for (let x = XA + 1.5; x < XA + 17; x += R(2.2, 3.4)) { onWall(damp, x, .22, zS + .01, R(1.8, 2.8), R(.45, .6), 0, R(-.05, .05)); onWall(damp, x + 1.2, .2, zN - .01, R(1.6, 2.6), R(.4, .55), Math.PI, R(-.05, .05)); }
    // Die Tür, durch die Luke gekommen ist (Westwand) – echte Tür, Kinderzeichnungen drumherum
    { // einzeln statt als Instanz, damit sie sich bewegen kann: sie steht offen, wenn Luke aus dem Gang kommt, und fällt dann zu (Modul uebergang)
      const dm = put(kDoor, 0, ZA, { ry: Math.PI / 2, minX: XA + .155 }); kDoor.list.pop();
      const dg = new THREE.Group(); for (const p of kDoor.parts) { const mm = new THREE.Mesh(p.geo, p.mat); mm.castShadow = mm.receiveShadow = true; dg.add(mm); }
      dg.applyMatrix4(dm); scene.add(dg); innen_kapitel_S.westDoor = dg; }
    [[ZA - 1.2, 1.45, 0], [ZA - 1.55, .95, 1], [ZA + 1.15, 1.35, 2], [ZA + 1.5, .85, 0], [ZA - .95, .7, 2]].forEach(([z, y, k], i) => onWall(kidMats[k], XA + .158 + i * .001, y, z, .26, .36, Math.PI / 2, R(-.15, .15)));
    spot(XA + .35, 1.1, ZA, .3, 2, 1.2, 'Die Tür', note('Die Tür', 'Von dieser Seite hat sie keine Klinke. Nur Kratzspuren, knapp über dem Boden – so hoch, wie ein Kind reicht.\n\nRingsum, mit Reißzwecken: Zeichnungen. Sieben Kinder an einer Kreuzung. Auf einer sind es acht.\n\n<span class="hand">Jemand hat sie von innen aufgehängt.</span>', 'tuer'));
    // Kreidestriche: gezählte Jahre
    const chalk = new THREE.MeshStandardMaterial({ map: tex(cnv(512, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = 'rgba(225,222,210,.8)'; x.lineWidth = 5; x.lineCap = 'round'; let px = 20, py = 60;
      for (let g = 0; g < 17; g++) { for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(px + i * 11, py + rand(-3, 3)); x.lineTo(px + i * 11 + rand(-3, 3), py + 70); x.stroke(); } x.beginPath(); x.moveTo(px - 6, py + 50); x.lineTo(px + 44, py + 16); x.stroke(); px += 72; if (px > 460) { px = 20; py += 110; } }
      x.font = '64px Caveat'; x.fillStyle = 'rgba(225,222,210,.85)'; x.fillText('+ 1', 380, 470); }), true), transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -4 });
    onWall(chalk, XA + 5.5, 1.25, zN - .012, 1.3, 1.3, Math.PI);
    spot(XA + 5.5, 1.25, zN - .2, 1.3, 1.2, .4, 'Kreidestriche', note('Kreidestriche', 'Fünfergruppen, sauber gezogen. Siebzehn Gruppen – und ganz unten, mit anderer Hand: <b>+ 1</b>.\n\nSiebzehn Jahre. Und einer mehr.', 'striche'));
    // Aushang neben dem Schild
    onWall(new THREE.MeshStandardMaterial({ map: tex(paperCanvas('doc', 3), true), roughness: .95 }), XA + 17.84, 1.45, ZA - 1.0, .24, .34, -Math.PI / 2, .04);
    spot(XA + 17.7, 1.45, ZA - 1.0, .2, .4, .35, 'Laufzettel', note('Laufzettel · Ebene −2', 'RÜCKFÜHRUNG NR. 6 – ZUSTELLUNG VERSPÄTET\nÜbergabe: Kreuzung, <b>Mittwoch, in der Nacht</b>.\nBegleitung: <i>Subjekt EISEN</i> (nicht ansprechen, nicht aufhalten, nicht berühren).\n\nEmpfang quittiert: ________\n\n<span class="hand">Nr. 6. Deine Nummer. Und niemand hat quittiert, dass ich angekommen bin.</span>', 'laufzettel'));
    // Müll, umgekippter Stuhl, verlorene Akten
    put(kBag, XA + 12.3, 0, { ry: .4, minZ: zS + .02 }); put(kBag, XA + 12.95, 0, { ry: 2.1, s: .8, minZ: zS + .3 }); put(kBag, XA + 13.6, 0, { ry: 4, s: .9, minZ: zS + .02 });
    put(kChair, XA + 9.6, ZA + 1.2, { ry: 1.9, rz: Math.PI / 2 });
    papers(XA + 15.5, ZA + .2, 5, .8); papers(XA + 10, ZA + .6, 3, .6);
  }

  // ---------- Archiv (x 618–630, z ±6)
  {
    // Aktenschränke: Stahlkorpus mit Scan-Oberfläche (kein Modell im Katalog – die Korpusse sind echte Blechkisten)
    const cabs = find((o, c, s) => o.material === M.metal && c.x > 618 && c.x < 630 && Math.abs(s.y - 2.2) < .05 && Math.abs(s.x - 1) < .05);
    cabs.forEach(o => retex(o, cabinetMat, 1.1));
    find((o, c, s) => o.material === M.dark && c.x > 618 && c.x < 630 && s.y < .05).forEach(o => retex(o, cabinetDark, 1));
    retex(archiveDrawer, lackMat(0xb4bba8), 1.1);
    // Griffe, Namensschilder, Griffmulden (Instanzen); die unterste Schublade des ersten Schranks trägt ihre eigenen
    const hGeo = new THREE.BoxGeometry(.16, .025, .035), lGeo = new THREE.PlaneGeometry(.11, .05), gGeo = new THREE.BoxGeometry(.9, .02, .012);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x9a9a92, metalness: .9, roughness: .35 }), labelMat = new THREE.MeshStandardMaterial({ map: tex(cnv(128, (x, w) => { x.fillStyle = '#d8d0b8'; x.fillRect(0, 0, w, w); x.fillStyle = '#333'; for (let i = 0; i < 3; i++) x.fillRect(12, 30 + i * 30, rand(50, 100), 10); }), true), roughness: .9 });
    const hm = [], lm = [], gm = [];
    cabs.forEach(o => { const north = o.position.z < ZA, f = north ? 1 : -1, fz = o.position.z + f * .25, rq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, north ? 0 : Math.PI, 0));
      for (let d = 0; d < 4; d++) { const y = .325 + d * .55; if (!north) gm.push(msM4(o.position.x, y - .025, fz - .006, 0)); if (o.position.x < XA + 20.5 && north && d === 0) continue;
        hm.push(msM4(o.position.x, y + .07, fz + f * .018, 0)); lm.push(new THREE.Matrix4().compose(new V(o.position.x, y + .17, fz + f * .004), rq, new V(1, 1, 1))); } });
    [[hGeo, handleMat, hm, true], [lGeo, labelMat, lm, false], [gGeo, cabinetDark, gm, false]].forEach(([g, m, L, sh]) => { const im = new THREE.InstancedMesh(g, m, L.length); L.forEach((x, i) => im.setMatrixAt(i, x)); im.castShadow = sh; im.receiveShadow = true; im.computeBoundingSphere(); im.name = 'archiv_beschlag'; scene.add(im); }); // 09.10.: moebel.js ersetzt die Kästen durch ms/aktenschrank (Flügeltüren, eigener Griff) und blendet diese Schubladen-Beschläge dann aus
    { const h = new THREE.Mesh(hGeo, handleMat); h.position.set(0, .095, .258); archiveDrawer.add(h); const l = new THREE.Mesh(lGeo, labelMat); l.position.set(0, .195, .242); archiveDrawer.add(l); }
    // Tisch: zwei alte Werkbänke zusammengeschoben
    hide(find((o, c) => o.material === M.wood && near(c, XA + 24, .4, ZA, .05))[0]);
    const t1 = put(kTable, XA + 24, 0, { ry: 0, maxZ: ZA }), tTop = surfY(kTable, t1, XA + 24.3, ZA - .2); put(kTable, XA + 24, 0, { ry: Math.PI, minZ: ZA });
    files.forEach(f => f.position.y = tTop + .004);
    flat(paperMats[2], XA + 22.35, ZA + .1, .21, .297, .9, tTop + .003); flat(paperMats[4], XA + 25.6, ZA - .15, .21, .297, 2.5, tTop + .003);
    put(kChair, XA + 22.6, ZA - 1.05, { ry: .15 }); put(kChair, XA + 25.9, ZA - 1.2, { ry: -.5 }); put(kChair, XA + 20.2, ZA + 1.8, { ry: 1.2, rx: -Math.PI / 2 });
    // Regal an der Westwand mit Überwachungsmonitor, Säcke mit Aktenschnipseln
    const w1 = put(kWard, 0, ZA - 2.65, { ry: 0, minX: XA + 18.17 }); const wy = surfY(kWard, w1, XA + 18.5, ZA - 2.65, .6); // AP-16: Platz für die Tür zur Hängeregistratur (z − 4,6)
    screens.push(put(kCrt, XA + 18.5, ZA - 2.65, { ry: 0, y: wy }));
    put(kBag, XA + 19.3, ZA - 3.55, { ry: 1 }); put(kBag, XA + 18.8, ZA + 1.4, { ry: 3, s: .85 }); put(kBag, XA + 29.3, 0, { ry: 2, s: .9, minZ: ZA - 5.3 });
    put(kCan, XA + 29.4, ZA + 3.3, { ry: .3 });
    // Gruppenfoto an der Westwand
    put(kFrameG, 0, ZA + 3.2, { ry: Math.PI / 2, y: 1.2, minX: XA + 18.155 });
    const ph = plane(.4, .58, XA + 18.18, 1.2 + .345, ZA + 3.2, photoMat('group'), 0, Math.PI / 2);
    interact(ph, 'Gruppenfoto', note('Gruppenfoto · Sommerfest 2009', 'Kinder an der Kreuzung, in einer Reihe. Du zählst: <b>acht</b>.\n\nDas achte Kind steht ganz rechts, ein Mädchen im weißen Kleid. Ihr Gesicht ist mit weißem Lack übermalt – sorgfältig, wie man ein Etikett überklebt.\n\nAuf der Rückseite, Schreibmaschine: <i>„Belegfoto. B anwesend. Auswahl bestätigt. Sieben Lampions ausgegeben.“</i>', 'gruppenfoto'));
    for (let x = XA + 19; x < XA + 29; x += R(2.5, 3.5)) onWall(damp, x, .22, ZA + 5.84, R(1.8, 2.6), R(.4, .55), Math.PI);
    papers(XA + 21, ZA - 3.8, 7, 1.2); papers(XA + 27, ZA + 3.6, 6, 1.2); papers(XA + 19.5, ZA + .5, 3, .5);
    flat(soot, XA + 20, ZA - 4.7, .9, 1.3, 0, .01); // Staub und Abrieb vor der leergeräumten Schublade
  }

  // ---------- Durchgang und Sicherungsraum (x 630–636)
  {
    retex(fusePanel, panelMat, 1); retex(fuseCover, panelMat, 1); retex(fuseDoor.leaf, rustMat, 1.3);
    const warn = new THREE.MeshStandardMaterial({ map: tex(cnv(256, (x, w) => { x.fillStyle = '#d8c020'; x.fillRect(0, 0, w, w); x.fillStyle = '#111'; x.beginPath(); x.moveTo(128, 30); x.lineTo(230, 200); x.lineTo(26, 200); x.closePath(); x.fill(); x.fillStyle = '#d8c020'; x.beginPath(); x.moveTo(128, 62); x.lineTo(204, 186); x.lineTo(52, 186); x.closePath(); x.fill(); x.fillStyle = '#111'; x.beginPath(); x.moveTo(136, 90); x.lineTo(110, 142); x.lineTo(130, 142); x.lineTo(118, 178); x.lineTo(150, 124); x.lineTo(130, 124); x.closePath(); x.fill(); x.font = 'bold 26px Arial'; x.textAlign = 'center'; x.fillText('VORSICHT', 128, 238); }), true), roughness: .6 });
    onWall(warn, XA + 33.55, 2.25, ZA + 7.85 - .012, .18, .18, Math.PI);
    const chalk2 = new THREE.MeshStandardMaterial({ map: tex(cnv(512, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = 'rgba(230,226,212,.85)'; x.font = '46px Caveat'; x.fillText('Fang nie mit dem an,', 20, 200); x.fillText('der schon leuchtet.', 40, 260); x.strokeStyle = 'rgba(230,226,212,.8)'; x.lineWidth = 4; x.beginPath(); x.moveTo(60, 300); x.lineTo(420, 290); x.stroke(); }), true), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    onWall(chalk2, XA + 34.6, 1.55, ZA + 7.85 - .012, .9, .9, Math.PI);
    // Werkbank mit Röhrenradio, Monitor, Stuhl, Wandbord
    const wb = put(kTable, 0, ZA + 5.0, { ry: Math.PI / 2, s: .9, minX: XA + 30.17 }), tt = surfY(kTable, wb, XA + 30.5, ZA + 4.3); S.sichBankY = tt; // AP-16: Funkgerät (AG-06) und Batterien liegen darauf
    screens.push(put(kCrt, XA + 30.47, ZA + 4.15, { ry: -.08, y: tt }));
    screens.push(put(kCrt, XA + 30.47, ZA + 5.65, { ry: .1, y: tt, s: .95 }));
    put(kChair, XA + 31.5, ZA + 4.7, { ry: -Math.PI / 2 - .35 });
    put(kCan, XA + 31.8, ZA + 2.55, { ry: 1 }); // AP-16: an der Ostwand steht jetzt das Kühlregal
    flat(paperMats[1], XA + 30.62, ZA + 6.25, .21, .297, 1.4, tt + .003);
    spot(XA + 30.62, tt + .05, ZA + 6.25, .3, .1, .35, 'Wartungsbuch', note('Wartungsbuch · Notstrom Ebene −2', '<span class="hand">13.07.1992 – Ausfall 03:13. Kreise 2 + 5. Neu verdrahtet.\n28.07.2009 – Ausfall 03:13. Alle Kreise. Lampen „atmen“. Anordnung: niemand berührt den Kasten allein.\n05.08.2009 – Ausfall 03:13. Die Lampen gingen erst wieder an, als der Junge durch die Tür war.\n\n23.10.2026 – </span>\n\nDer letzte Eintrag hat kein Ende. Nur ein langer Strich, der vom Papier rutscht.', 'wartung'));
    spot(XA + 30.47, tt + .18, ZA + 4.9, .4, .4, 2.0, 'Überwachungsmonitore', () => { try { Audio.flick(); Audio.whisper(XA + 30.5, 1, ZA + 4.9, 1.6); } catch (e) {} toast('Zwei Bilder, grau und körnig. Links: der lange Gang. Am Ende steht jemand und sieht in die Kamera. Rechts: acht Stühle. Auf dem achten sitzt ein Junge. Du blinzelst – leer.', 6200); });
    papers(XA + 33.5, ZA + 4.5, 3, .8); flat(soot, XA + 33, ZA + 7.3, 1.2, .9, 0, .01);
    flat(puddleMat, XA + 31.2, ZA - 1.2, 1.1, .8, .6, .02); papers(XA + 34.2, ZA + .9, 2, .4);
  }

  // ---------- Spinnenraum (x 636–646, z ±5)
  const webGeos = []; let cobMat = null;
  find((o) => o.material && o.material.transparent && o.material.alphaTest === .12 && o.material.color && o.material.color.getHex() === 0xd8d4c8).forEach(o => { if (!webGeos.includes(o.geometry)) webGeos.push(o.geometry); cobMat = o.material; });
  function web(x, y, z, ry, s = 1, rz = 0, rx = 0) { if (!cobMat) return; const m = new THREE.Mesh(webGeos[Math.floor(R(0, webGeos.length))], cobMat); m.scale.setScalar(.0105 * s); m.position.set(x, y, z); m.rotation.set(rx, ry, rz, 'YXZ'); m.renderOrder = 2; scene.add(m); return m; }
  // Netz an der Kante Wand/Decke (Wand bei z = wz bzw. x = wx; dir = Richtung in den Raum)
  // QA-Art 09.10.: Kantennetze standen als gleich hohe Reihe im festen Abstand – jetzt Höhe, Abstand zur Wand, Neigung und Größe je Netz verschieden, gut ein Fünftel fällt aus (rand statt R: der reproduzierbare Zufall der Räume bleibt unverändert)
  const edgeWeb = (x, wz, dir, s = .85, h = C2.h) => { const rz = R(-.25, .25); if (Math.random() < .22) return; return web(x + rand(-.5, .5), h - rand(.14, .42), wz + dir * rand(.12, .3), (dir > 0 ? 0 : Math.PI) + rand(-.2, .2), s * rand(.75, 1.2), rz, -Math.PI / 4 + rand(-.25, .2)); };
  const edgeWebX = (wx, z, dir, s = .85, h = C2.h) => { const rz = R(-.25, .25); if (Math.random() < .22) return; return web(wx + dir * rand(.12, .3), h - rand(.14, .42), z + rand(-.5, .5), (dir > 0 ? Math.PI / 2 : -Math.PI / 2) + rand(-.2, .2), s * rand(.75, 1.2), rz, -Math.PI / 4 + rand(-.25, .2)); };
  {
    find((o, c) => o.material && o.material.isMeshBasicMaterial && o.material.transparent && o.material.map && c.x > 636 && c.x < 646 && c.y > 1).forEach(hide); // gezeichnete Netze
    { const fl = find((o, c) => o.material === M.ash && c.x > 636 && c.x < 646)[0]; if (fl) fl.material = msSurfMat('wall_damaged', { tint: 0x55514a, rep: 5 }); } // Boden: Beton-Scan statt Rauschen
    find((o, c, s) => o.material === M.wood && c.x > 636.5 && c.x < 645.5 && s.y < .6).forEach(hide); // Kisten (zufällig platziert)
    put(kBed, XA + 41.4, 0, { ry: Math.PI / 2, sv: BED, minZ: ZA - 4.83 }); // Eisenbett an der Wand, blutige Matratze
    put(kBag, XA + 45.2, 0, { ry: 1.1, maxZ: ZA + 4.83 }); put(kBag, XA + 44.5, 0, { ry: 2.8, s: .85, maxZ: ZA + 4.83 }); put(kBag, 0, ZA + 3.6, { ry: .2, s: .75, maxX: XA + 45.83 });
    put(kChair, XA + 38.6, ZA + 3.2, { ry: 2.4, rx: Math.PI / 2 });
    put(kCan, XA + 36.8, 0, { ry: 0, rz: Math.PI / 2, minZ: ZA - 4.8 });
    for (let i = 0; i < 4; i++) { edgeWeb(XA + 37.2 + i * 2.5 + R(-.4, .4), ZA - 4.85, 1, R(.7, 1)); edgeWeb(XA + 37.6 + i * 2.4 + R(-.4, .4), ZA + 4.85, -1, R(.7, 1)); }
    for (const z of [ZA - 3.4, ZA - 2, ZA + 2.2, ZA + 3.5]) { edgeWebX(XA + 36.15, z, 1, R(.6, .9)); edgeWebX(XA + 45.85, z, -1, R(.6, .9)); }
    web(XA + 40.5, .55, ZA - 4.55, 0, .55); web(XA + 42.4, .5, ZA - 4.6, 0, .5);
    flat(soot, XA + 41, ZA, 4.5, 3.5, .3, .012); flat(bloodOldS, XA + 41.2, ZA - 3.2, .9, 1.5, 1.5, .014);
    // Peters Zelle (W2-P5, PK-D K2-4): Türschilder, tausendfach „ICH WEISS ES JETZT“, Strichliste seit 1992, Tafel (erst nach dem Schwarm lesbar), Fluchtplan
    { const rs0 = rs, pc = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; echt_an(() => fn(c.getContext('2d'), w, h)); return c; }; // QA M-15: Schrift über echt_an (Druck-/Papierwirkung wie überall)
      const dMat = (c, r = .9, m = 0) => new THREE.MeshStandardMaterial({ map: tex(c, true), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: r, metalness: m });
      const grime = (x, w, h, n, a) => { for (let i = 0; i < n; i++) { const g = x.createRadialGradient(R(0, w), R(0, h), 0, R(0, w), R(0, h), R(10, 70)); g.addColorStop(0, `rgba(60,44,28,${R(a * .4, a)})`); g.addColorStop(1, 'rgba(60,44,28,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } };
      // Emailleschild (alt, abgeplatzt) und darunter ein jüngeres Schild, getippt, mit Klebeband
      // QA M-15: Emailleschild als Blender-Modell (ms/schild_pruefraum, Schrift als Geometrie); die Canvas-Fassung bleibt nur als Notfall, falls das Modell fehlt
      const pruefSchild = await msModel('schild_pruefraum', 'model.glb').then(m => m.clone(true)).catch(() => null);
      if (pruefSchild) { pruefSchild.position.set(XA + 35.84, 1.86, ZA - 1.38); pruefSchild.rotation.y = -Math.PI / 2; pruefSchild.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } }); scene.add(pruefSchild); }
      else onWall(dMat(pc(512, 160, (x, w, h) => { x.fillStyle = '#ddd6c4'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a2d2c'; x.lineWidth = 7; x.strokeRect(12, 12, w - 24, h - 24);
        x.fillStyle = '#232625'; x.textAlign = 'center'; x.font = 'bold 62px Arial'; x.fillText('PRÜFRAUM 3', w / 2, 84); x.font = '25px Arial'; x.fillText('Unterscheidung Original / Rückläufer', w / 2, 126);
        for (let i = 0; i < 16; i++) { const px = R(0, w), py = i < 6 ? (i % 2 ? R(0, 16) : R(h - 16, h)) : R(0, h), r = R(3, 11); x.fillStyle = '#1b1a18'; x.beginPath(); x.ellipse(px, py, r, r * R(.6, 1), R(0, 3), 0, 7); x.fill(); x.fillStyle = 'rgba(120,70,30,.5)'; x.beginPath(); x.arc(px + R(-2, 2), py + r, r * .8, 0, 7); x.fill(); }
        grime(x, w, h, 10, .22); }), .4, .15), XA + 35.842, 1.86, ZA - 1.38, .5, .156, -Math.PI / 2);
      onWall(dMat(pc(512, 128, (x, w, h) => { x.fillStyle = '#e4dcc6'; x.fillRect(24, 14, w - 48, h - 28); grime(x, w, h, 5, .12); x.fillStyle = '#1e1c1a'; x.textAlign = 'center'; x.font = 'bold 30px "Courier New"'; x.fillText('KRANZ, P. · Rückläufer', w / 2, 58); x.font = '24px "Courier New"'; x.fillText('verwahrt seit 11/1992', w / 2, 92);
        x.fillStyle = 'rgba(200,190,150,.55)'; x.save(); x.translate(40, 24); x.rotate(-.5); x.fillRect(-26, -9, 64, 18); x.restore(); x.save(); x.translate(w - 40, h - 24); x.rotate(-.5); x.fillRect(-38, -9, 64, 18); x.restore(); })), XA + 35.84, 1.6, ZA - 1.38, .44, .11, -Math.PI / 2, .025);
      spot(XA + 35.7, 1.72, ZA - 1.38, .15, .5, .6, 'Türschild', note('Prüfraum 3', 'Ein Emailleschild, an den Kanten abgeplatzt: <b>PRÜFRAUM 3 · Unterscheidung Original / Rückläufer</b>\n\nDarunter, jünger, mit Klebeband angeklebt: <i>„KRANZ, P. · Rückläufer · verwahrt seit 11/1992“</i>\n\n<span class="hand">Kranz. So hieß Mama, bevor sie Brandt hieß.</span>', 'pruefraum_schild'));
      // Kratzspuren: an allen Wänden, tausendfach – mit Fingernägeln, Löffelstielen, irgendwas
      const rMat = (f, r = .95) => new THREE.MeshStandardMaterial({ ...ritz_tex(f.c, f.b), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: r, metalness: 0 }); // Abziehbild mit Höhenrelief (Modul ritzschrift)
      const scr = [0, 1, 2].map(i => rMat(ritz_flaeche(1024, 704, { seed: 41 + i * 7, zeilen: 30, min: 22, max: 52, text: 'ICH WEISS ES JETZT' }))); // von Hand geritzt (Strichschrift, nie abgeschnitten)
      for (const [cx, k] of [[XA + 37.8, 0], [XA + 41, 1], [XA + 44.2, 2]]) { onWall(scr[k], cx, 1.18, ZA + 4.838, 3.2, 2.2, Math.PI); onWall(scr[(k + 1) % 3], cx, 1.18, ZA - 4.838, 3.2, 2.2, 0); }
      for (const [cz, k] of [[ZA - 2.85, 0], [ZA + 2.85, 2]]) { onWall(scr[k], XA + 45.838, 1.18, cz, 3.9, 2.2, -Math.PI / 2); onWall(scr[(k + 1) % 3], XA + 36.162, 1.18, cz, 3.9, 2.2, Math.PI / 2); }
      // Strichliste über dem Bett: Tage in Fünfergruppen, Jahr für Jahr, von 1992 bis heute – die letzte Gruppe ist nicht fertig
      { const w = 1024, h = 512, c = document.createElement('canvas'), b = document.createElement('canvas'); c.width = b.width = w; c.height = b.height = h; const C = c.getContext('2d'), B = b.getContext('2d'); B.fillStyle = '#808080'; B.fillRect(0, 0, w, h); ritz_rs = 991;
        let px = 8, py = 30; const YR = [1992, 1995, 1998, 2001, 2004, 2007, 2010, 2013, 2016, 2019, 2022, 2026]; // Jahreszahlen und Striche mit der Ritz-Schrift (Fünfergruppen, die letzte nicht fertig)
        for (let row = 0; row < 12; row++, py += 40, px = 8) { ritz_zeile(C, B, String(YR[row]), px, py + 24, 19, { stil: 'ritz', alpha: .9 }); px += 62;
          for (let g = 0; g < 22 && px < w - 36; g++, px += 42) { const last = row === 11 && g >= 12; if (last && g > 12) break; const n = last ? 3 : 4, al = ritz_R(.6, 1);
            for (let k = 0; k < n; k++) ritz_strich(C, B, [[px + k * 7 + ritz_RN() * 1.2, py + ritz_R(0, 4)], [px + k * 7 + ritz_RN() * 2, py + 30 + ritz_R(-3, 2)]], 36, 'ritz', al);
            if (!last) ritz_strich(C, B, [[px - 4, py + 24], [px + 27, py + 6]], 36, 'ritz', al); } }
        onWall(rMat({ c, b }, .95), XA + 41.4, 1.62, ZA - 4.83, 2.3, 1.15, 0, .01); }
      // Die Tafel (kanonisch) – bis zum Schwarm unter einem dichten Gespinst, danach lesbar
      const board = plane(1.3, .85, XA + 39.1, 1.55, ZA + 4.829, new THREE.MeshStandardMaterial({ roughness: .92, map: tex(pc(768, 502, (x, w, h) => { x.fillStyle = '#1c201e'; x.fillRect(0, 0, w, h); rs = 4242;
        for (let i = 0; i < 26; i++) { const g = x.createRadialGradient(R(0, w), R(0, h), 0, R(0, w), R(0, h), R(40, 160)); g.addColorStop(0, `rgba(200,200,190,${R(.03, .08)})`); g.addColorStop(1, 'rgba(200,200,190,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
        x.strokeStyle = '#3a3129'; x.lineWidth = 14; x.strokeRect(7, 7, w - 14, h - 14); ritz_rs = 777;
        const kz = (t, px, py, sz) => { const k = Math.min(1, (w - 70 - px) / ritz_breite(t, sz)); ritz_zeile(x, null, t, px, py, sz * k, { stil: 'kreide', alpha: ritz_R(.78, .95), winkel: ritz_RN() * .012 }); }; // Kreide in Druckbuchstaben, nie über den Rand
        kz('Original B., Luke', 44, 112, 40); kz('(Vermessung Frühjahr 2009):', 44, 160, 30); kz('starke Spinnenangst.', 84, 214, 38);
        ritz_strich(x, null, [[40, 246], [w * .5, 242 + ritz_RN() * 3], [w - 60, 248]], 30, 'kreide', .8);
        kz('Rückläufer 08', 44, 322, 40); kz('(Sommer 2009):', 44, 370, 30); kz('keine Reaktion. Lacht.', 84, 428, 36); }), true) }), 0, Math.PI);
      board.userData.noCol = true; S.pruefTafel = board;
      const cover = S.pruefCover = plane(1.42, .97, XA + 39.1, 1.55, ZA + 4.815, new THREE.MeshStandardMaterial({ transparent: true, depthWrite: false, roughness: 1, map: tex(pc(512, 350, (x, w, h) => { x.clearRect(0, 0, w, h); rs = 5151;
        for (let i = 0; i < 60; i++) { const g = x.createRadialGradient(R(40, w - 40), R(30, h - 30), 0, R(40, w - 40), R(30, h - 30), R(40, 130)); g.addColorStop(0, 'rgba(150,146,136,.5)'); g.addColorStop(1, 'rgba(150,146,136,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
        x.strokeStyle = 'rgba(228,224,214,.55)'; for (let i = 0; i < 420; i++) { x.lineWidth = R(.4, 1.3); x.beginPath(); const a = R(0, 6.3), cx = R(0, w), cy = R(0, h), l = R(30, 200); x.moveTo(cx, cy); x.quadraticCurveTo(cx + R(-20, 20), cy + R(-20, 20), cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); }
        for (let k = 0; k < 7; k++) { const cx = R(60, w - 60), cy = R(60, h - 60); for (let r = 6; r < 70; r += R(5, 9)) { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke(); } } }), true) }), 0, Math.PI);
      cover.userData.noCol = true; cover.renderOrder = 3;
      spot(XA + 39.1, 1.55, ZA + 4.55, 1.3, .9, .3, 'Tafel', () => { if (ch2.spiderPhase !== 'gone') { toast('Eine Tafel an der Wand, dicht zugesponnen. Darunter Kreide – nicht zu lesen.', 3800); return; }
        openNote('Tafel · Prüfraum 3', 'Kreide auf Schiefer, sauber, wie für eine Schulklasse:\n\n<span class="hand">Original B., Luke (Vermessung Frühjahr 2009): starke Spinnenangst.\nRückläufer 08 (Sommer 2009): keine Reaktion. Lacht.</span>', 'ik_pruef_tafel'); }); // Fassung 3 (AP-16): Lukes Sätze kommen nach dem Schwarm (amt_nachSpinnen)
      // Fluchtplan an der Osttür (Hilfe 1 für den langen Gang)
      onWall(dMat(pc(420, 560, (x, w, h) => { x.fillStyle = '#ece6d2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1f6a3a'; x.fillRect(0, 0, w, 74); x.fillStyle = '#f4f1e6'; x.textAlign = 'center'; x.font = 'bold 30px Arial'; x.fillText('FLUCHTPLAN', w / 2, 36); x.font = 'bold 20px Arial'; x.fillText('EBENE −2', w / 2, 62);
        x.strokeStyle = '#2b2b28'; x.lineWidth = 3; const rooms = [[20, 150, 50, 40], [70, 135, 50, 70], [120, 150, 30, 40], [150, 140, 50, 60], [200, 160, 150, 20], [350, 130, 50, 80]]; rooms.forEach(([a, b, c, d]) => x.strokeRect(a, b, c, d));
        x.fillStyle = '#c42016'; x.beginPath(); x.arc(175, 170, 8, 0, 7); x.fill(); x.font = 'bold 14px Arial'; x.fillText('SIE SIND HIER', 175, 232); x.lineWidth = 7; x.strokeStyle = '#c42016'; x.beginPath(); x.moveTo(350, 150); x.lineTo(350, 190); x.stroke();
        x.fillStyle = '#1f6a3a'; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(214 + i * 28, 164); x.lineTo(228 + i * 28, 170); x.lineTo(214 + i * 28, 176); x.fill(); }
        x.fillStyle = '#1f1f1c'; x.textAlign = 'left'; x.font = 'bold 21px Arial'; x.fillText('Brandschutztür Messraum:', 26, 300); x.font = '21px Arial'; x.fillText('Notentriegelung nur bei', 26, 332); x.fillText('Brandalarm.', 26, 362);
        x.fillStyle = '#c42016'; x.fillRect(26, 392, 36, 36); x.fillStyle = '#f4f1e6'; x.font = 'bold 26px Arial'; x.fillText('!', 38, 420); x.fillStyle = '#1f1f1c'; x.font = '15px Arial'; x.fillText('Brandalarm öffnet die Tür', 74, 406); x.fillText('an der Notentriegelung (rot).', 74, 424);
        grime(x, w, h, 14, .25); x.fillStyle = 'rgba(255,255,255,.09)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w * .5, 0); x.lineTo(0, h * .6); x.fill(); }), .3, .05), XA + 45.838, 1.5, ZA + 1.42, .42, .56, -Math.PI / 2);
      spot(XA + 45.7, 1.5, ZA + 1.42, .15, .6, .5, 'Fluchtplan', note('Fluchtplan Ebene −2', 'Hinter zerkratztem Plexiglas, vergilbt. Ein roter Punkt: <b>Sie sind hier</b>. Nach Osten ein langer Gang, ganz am Ende ein dicker roter Strich.\n\n<b>Brandschutztür Messraum: Notentriegelung nur bei Brandalarm.</b>\n\n<span class="hand">Nur bei Brandalarm. Na gut. Hoffentlich brennt es nie.</span>', 'pruef_fluchtplan'));
      rs = rs0; // der reproduzierbare Zufall der übrigen Räume bleibt wie vorher
    }
    // Kokon: eingesponnener Körper, kopfüber an der Decke (Figurenmodell, Pose eingebacken, aufgequollen, knotig)
    try {
      const gl = S.ghostGL = await MSL.gl.loadAsync('assets/ghost/ghost.glb'); const root = SKC(gl.scene), clip = gl.animations.find(a => /idle/i.test(a.name)) || gl.animations[0];
      const mx = new THREE.AnimationMixer(root); if (clip) { mx.clipAction(clip).play(); mx.update(2.2); } root.updateMatrixWorld(true);
      const silk = new THREE.MeshStandardMaterial({ color: 0x8e8878, roughness: .95, normalMap: T('curtain_sheer/DefaultMaterial_Normal_DirectX.jpg', false, 3) }); silk.normalScale.set(1.4, 1.4);
      const g = new THREE.Group(), hv = new V();
      root.traverse(o => { if (!o.isSkinnedMesh) return; o.skeleton.update(); const geo = o.geometry.clone(), P = geo.attributes.position;
        for (let i = 0; i < P.count; i++) { hv.fromBufferAttribute(P, i); o.applyBoneTransform(i, hv); P.setXYZ(i, hv.x, hv.y, hv.z); }
        geo.deleteAttribute('skinIndex'); geo.deleteAttribute('skinWeight'); geo.applyMatrix4(o.matrixWorld); geo.computeVertexNormals();
        const acc = new Map(), key = i => Math.round(P.getX(i) * 500) + ',' + Math.round(P.getY(i) * 500) + ',' + Math.round(P.getZ(i) * 500), N = geo.attributes.normal;
        for (let i = 0; i < P.count; i++) { const k = key(i), a = acc.get(k) || [0, 0, 0]; a[0] += N.getX(i); a[1] += N.getY(i); a[2] += N.getZ(i); acc.set(k, a); }
        const out = new Float32Array(P.count * 3);
        for (let i = 0; i < P.count; i++) { const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1, x = P.getX(i), y = P.getY(i), z = P.getZ(i), d = .065 + .04 * Math.sin(x * 23 + y * 17) * Math.sin(z * 19 - y * 11); out[i * 3] = x + a[0] / l * d; out[i * 3 + 1] = y + a[1] / l * d; out[i * 3 + 2] = z + a[2] / l * d; }
        P.array.set(out); P.needsUpdate = true; geo.computeVertexNormals(); const m = new THREE.Mesh(geo, silk); m.castShadow = true; m.receiveShadow = true; g.add(m); });
      const b0 = new THREE.Box3().setFromObject(g); g.scale.setScalar(1.72 / (b0.max.y - b0.min.y)); g.rotation.x = Math.PI; // kopfüber
      const piv = new THREE.Group(); piv.add(g); piv.updateMatrixWorld(true); const b1 = new THREE.Box3().setFromObject(g), c1 = b1.getCenter(new V()); g.position.set(-c1.x, -b1.max.y, -c1.z);
      piv.position.set(cocoon.position.x, C2.h - .04, cocoon.position.z); scene.add(piv); S.cocoon = { piv, g, silk };
      cocoon.visible = false; // Kapsel bleibt als Referenz für das Skript (spidersGone) erhalten
      for (let i = 0; i < 5; i++) web(cocoon.position.x + R(-.25, .25), R(1.1, 2.3), cocoon.position.z + R(-.2, .2), R(0, 3), R(.7, 1.2), R(-.5, .5));
    } catch (e) { console.warn('innen_kapitel Kokon', e); }
  }

  // ---------- Der lange Gang (x 646–706): Hindernisse → Gerümpel aus echten Modellen, neue Ausweich-Kisten für den Verfolger
  {
    obstacles.forEach(hide); find((o, c, s) => o.material === M.metal && c.x > 655 && c.x < 692 && s.x > 3).forEach(hide); // Kisten und schräge Blechregale
    const grille = rustMat.clone(); grille.alphaMap = tex(cnv(256, (x, w) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, w); x.fillStyle = '#fff'; for (let i = 0; i < 6; i++) x.fillRect(i * w / 6 + 6, 0, 12, w); x.fillRect(0, 0, w, 16); x.fillRect(0, w / 2 - 8, w, 16); }), false);
    grille.alphaTest = .5; grille.side = THREE.DoubleSide; grille.transparent = false; grille.metalness = .6; retex(gate, grille, 1);
    for (const D of [spiderDoorIn, spiderDoorOut, chaseDoor]) retex(D.m, rustMat, 1.2);
    const pieces = []; const P = (K, x, z, o) => { const m = put(K, x, z, o); pieces.push({ K, m, x }); };
    const X = XA, tH = kTable.size.y * .72;
    P(kBed, X + 52, 0, { ry: Math.PI / 2 + .06, sv: BED, minZ: zS + .02 }); P(kBag, X + 53.6, 0, { ry: .5, minZ: zS + .02 }); P(kBag, X + 50.5, 0, { ry: 2, s: .8, minZ: zS + .02 });                         // 1 Eisenbett
    P(kTable, X + 57, 0, { ry: Math.PI + .05, s: .72, maxZ: zN - .02 }); P(kBag, X + 56.4, 0, { ry: 1, s: .7, maxZ: zN - .08 }); P(kChair, X + 58.4, zN - 1.0, { ry: -2, rz: Math.PI / 2 });           // 2 Werkbank
    P(kWard, X + 62, 0, { ry: Math.PI / 2 + .06, rx: Math.PI / 2, minZ: zS + .02 }); P(kCan, X + 60.6, 0, { ry: 2, minZ: zS + .6 });                                                                   // 3 Regal auf der Seite
    P(kDresserD, X + 66.5, 0, { ry: Math.PI - .05, maxZ: zN - .02 }); P(kBag, X + 65.5, zN - .95, { ry: .3, s: .9 }); P(kBag, X + 67.6, zN - .9, { ry: 1.7, s: .8 });                                   // 4 Buffet
    P(kTable, X + 71, 0, { ry: -.08, s: .72, rx: Math.PI / 2, minZ: zS + .05 }); P(kCrt, X + 70.1, zS + 1.0, { ry: 2.4, rz: .35 });                                                                     // 5 Werkbank als Barrikade
    P(kBed, X + 75, 0, { ry: -Math.PI / 2 - .1, sv: BED, maxZ: zN - .02 }); P(kBag, X + 76.7, 0, { ry: .9, s: .9, maxZ: zN - .05 });                                                                  // 6 Eisenbett
    P(kWard, X + 79.4, 0, { ry: -Math.PI / 2, minZ: zS + .02 }); P(kWard, X + 81.6, 0, { ry: Math.PI / 2 + .15, rx: Math.PI / 2, minZ: zS + .02 }); P(kBag, X + 80.6, zS + 1.0, { ry: 2.2, s: .8 });   // 7 Regale
    P(kCan, X + 84, 0, { ry: .2, maxZ: zN - .02 }); P(kCan, X + 84.7, 0, { ry: 1.2, rz: Math.PI / 2, maxZ: zN - .08 }); P(kBag, X + 85.4, 0, { ry: 2.6, maxZ: zN - .02 }); P(kBag, X + 83.3, zN - .75, { ry: 3.6, s: .85 }); // 8 Tonnen
    P(kDresserD, X + 89, 0, { ry: Math.PI / 2 + .12, rx: -Math.PI / 2, minZ: zS + .02 }); P(kChair, X + 90.6, zS + .5, { ry: 1.3 });                                                                    // 9 Buffet auf dem Rücken
    P(kTable, X + 93.4, 0, { ry: Math.PI - .04, s: .72, maxZ: zN - .02 }); P(kWard, X + 95.5, 0, { ry: Math.PI / 2, maxZ: zN - .02 }); P(kCrt, X + 93.1, zN - .28, { ry: -Math.PI + .3, y: tH }); /* QA 09.10.: crt-Bildschirm bei +x – vorher zur Nordwand */   // 10 Werkbank, Regal
    P(kBed, X + 98, 0, { ry: Math.PI / 2, sv: BED, rz: Math.PI / 2, minZ: zS + .02 }); P(kBag, X + 99.8, 0, { ry: .7, minZ: zS + .02 });                                                             // 11 Bett auf der Seite
    P(kBag, X + 101.4, 0, { ry: 1.2, maxZ: zN - .02 }); P(kBag, X + 102.1, 0, { ry: 2.9, s: .9, maxZ: zN - .1 }); P(kCan, X + 102.9, 0, { ry: .4, maxZ: zN - .02 }); P(kChair, X + 101.7, zN - 1.1, { ry: .8, rx: -Math.PI / 2 }); // 12
    // Verfolger-Ausweichen: Grundflächen der neuen Stapel (eigene Liste; die Spieler-Kollision kommt aus den echten Meshes)
    obstacles.length = 0; const groups = new Map();
    for (const p of pieces) { const b = aabb(p.K, p.m); if (b.max.y < .35) continue; const key = Math.round((p.x - XA - 52) / 4.6); const g = groups.get(key); if (g) g.union(b); else groups.set(key, b); }
    for (const b of groups.values()) obstacles.push({ userData: { col: { minX: b.min.x, maxX: b.max.x, minZ: Math.max(zS, b.min.z), maxZ: Math.min(zN, b.max.z) } }, position: new V((b.min.x + b.max.x) / 2, 0, (b.min.z + b.max.z) / 2) });
    S.obst = obstacles.map(o => o.userData.col);
    // Schleifspur vom Spinnenraum bis zum Messraum
    for (let x = XA + 47, i = 0; x < XA + 105; x += R(1.6, 2.6), i++) flat(i % 3 ? bloodOldS : bloodFresh, x, ZA + Math.sin(x * .21) * .35 + R(-.1, .1), R(.35, .6), R(1.2, 2), Math.PI / 2 + R(-.25, .25), .013);
    flat(bloodSmear, XA + 104.5, ZA + .2, 1.6, 1.1, 1.2, .015);
    onWall(bloodSmear, XA + 105.84, 1.1, ZA - 1.4, .8, .7, -Math.PI / 2, .3); // Handabdrücke neben der Stahltür
    for (let x = XA + 48; x < XA + 105; x += R(3, 5)) { const s = Math.floor(x) % 2; onWall(damp, x, .22, s ? zS + .01 : zN - .01, R(1.6, 2.6), R(.4, .6), s ? 0 : Math.PI, R(-.05, .05)); }
    papers(XA + 60, ZA, 4, 1.2); papers(XA + 78.5, ZA - .3, 3, 1); papers(XA + 92, ZA + .2, 4, 1.1);
    for (let i = 0; i < 9; i++) (i % 2 ? edgeWeb(XA + 48 + i * 6.5 + R(-1, 1), zS, 1, R(.6, .9)) : edgeWeb(XA + 48 + i * 6.5 + R(-1, 1), zN, -1, R(.6, .9)));
  }

  // ---------- Messraum (x 706–722, z ±8)
  {
    find((o, c, s) => (o.material === M.metal || o.material === M.rubber) && c.x > 707 && c.x < 720 && Math.abs(c.z - ZA) > 4 && Math.abs(c.z - ZA) < 5.5 && s.y < .85 && !(s.x > 2)).forEach(hide);
    // Fassung 3 (AP-16): acht Stühle im Kreis (Mitte X + 115,8 | Z + 2,4), Stuhl 8 bleibt bei X + 118,6 | Z + 5 (Kinosequenz „Ihre Augen“), alle zur Mitte; Namensschilder auf die Lehnen
    { const MC = { x: XA + 115.8, z: ZA + 2.4 }, a8 = Math.atan2(5 - 2.4, 118.6 - 115.8), r8 = Math.hypot(118.6 - 115.8, 5 - 2.4); S.stuhlKreis = [];
      for (let i = 0; i < 8; i++) { const a = a8 + (i === 7 ? 0 : (i + 1) * Math.PI / 4), cx = MC.x + Math.cos(a) * r8, cz = MC.z + Math.sin(a) * r8, ry = Math.atan2(MC.x - cx, MC.z - cz); put(kChair, cx, cz, { ry: ry + R(-.05, .05) }); S.stuhlKreis.push({ x: cx, z: cz, ry }); }
      const tags = find((o, c, s) => o.geometry.type === 'PlaneGeometry' && Math.abs(c.y - 1.35) < .02 && c.x > 707 && c.x < 720 && s.x < .35).sort((a, b) => (a.position.z - b.position.z) * 100 + (a.position.x - b.position.x));
      tags.forEach((o, i) => { const k = S.stuhlKreis[i] || S.stuhlKreis[7]; o.position.set(k.x - Math.sin(k.ry) * .235, .82, k.z - Math.cos(k.ry) * .235); o.rotation.set(-.12, k.ry + Math.PI, 0, 'YXZ'); });
      if (typeof amt_S !== 'undefined' && amt_S.feder) { const k = S.stuhlKreis[7]; amt_S.feder.position.set(k.x - Math.sin(k.ry) * .21, .78, k.z - Math.cos(k.ry) * .21); amt_S.feder.rotation.set(0, k.ry + Math.PI, .5, 'YXZ'); } }
    retex(machine, machineMat, 1.2);
    find((o, c, s) => o.material === M.metal && Math.abs(c.x - (XA + 118)) < .05 && Math.abs(s.x - 2.2) < .05).forEach(o => retex(o, rustMat, 1.1)); // Tanksockel
    // Klavier (kein Modell im Katalog): aufrechtes Klavier aus Holz-Scan-Platten; die alte Kiste bleibt unsichtbar als Klickfläche
    msHide(piano); msHide(find((o, c) => o.material === M.paint && near(c, XA + 111.8, 1.02, ZA + 7.3, .05))[0]);
    { const wood = msSurfMat('floor_wood', { tint: 0x3e2a20 }); wood.roughness = .42; wood.userData.tile = .8; const px = XA + 111.8, wz = ZA + 7.85;
      const keys = new THREE.MeshStandardMaterial({ roughness: .3, map: tex((() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 64; const x = c.getContext('2d'); x.fillStyle = '#ddd3bc'; x.fillRect(0, 0, 1024, 64); const n = 36, kw = 1024 / n; x.strokeStyle = '#7a705e'; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * kw, 0); x.lineTo(i * kw, 64); x.stroke(); } x.fillStyle = '#141210'; for (let i = 0; i < n - 1; i++) { const m = i % 7; if (m === 2 || m === 6) continue; x.fillRect((i + 1) * kw - kw * .3, 0, kw * .6, 40); } for (let i = 0; i < 6; i++) { x.fillStyle = 'rgba(60,40,20,.25)'; x.fillRect(rand(0, 1000), rand(40, 60), rand(10, 40), 4); } return c; })(), true) });
      [[1.5, 1.24, .36, px, .62, wz - .18, wood], [1.56, .035, .4, px, 1.2575, wz - .2, wood], [1.5, .07, .3, px, .695, wz - .51, wood], [1.42, .022, .15, px, .741, wz - .58, keys], [1.42, .16, .03, px, .81, wz - .375, wood],
        [.07, .66, .3, px - .715, .33, wz - .51, wood], [.07, .66, .3, px + .715, .33, wz - .51, wood], [.62, .025, .12, px, .98, wz - .43, wood]].forEach(([w, h, d, x, y, z, m]) => box(w, h, d, x, y, z, m));
      noteSheet.scale.setScalar(.55); noteSheet.position.set(px, 1.14, wz - .4); noteSheet.rotation.set(-.24, Math.PI, 0, 'YXZ'); }
    // Untersuchungsliege, Monitor auf der Maschine, Müll
    put(kBed, 0, ZA - 5.6, { ry: Math.PI, sv: BED, maxX: XA + 121.83 });
    screens.push(put(kCrt, XA + 120.6, ZA + .25, { ry: Math.PI, y: 1.8 }));
    { const tm = put(kTable, XA + 113.2, 0, { ry: Math.PI, minZ: ZA - 7.83 }), ty = surfY(kTable, tm, XA + 113, ZA - 7.55);
      screens.push(put(kCrt, XA + 112.4, ZA - 7.55, { ry: -Math.PI / 2 - .06, y: ty })); screens.push(put(kCrt, XA + 113.2, ZA - 7.55, { ry: -Math.PI / 2 + .05, y: ty, s: .92 }));
      put(kChair, XA + 112.9, ZA - 6.75, { ry: Math.PI + .3 }); flat(paperMats[0], XA + 114.1, ZA - 7.5, .21, .297, .3, ty + .003); flat(paperMats[5], XA + 111.7, ZA - 7.45, .21, .297, -.2, ty + .004);
      spot(XA + 112.8, ty + .2, ZA - 7.55, 1.4, .45, .5, 'Monitore', () => { try { Audio.flick(); } catch (e) {} toast('Auf beiden Schirmen derselbe Raum: dieser hier. Acht Stühle, ein Tank, ein Klavier. Und vor den Monitoren ein Junge, der auf Monitore sieht. Du hebst die Hand. Er nicht.', 6400); }); }
    for (const [z, y, k] of [[ZA - 5.6, 1.35, 0], [ZA - 4.9, 1.05, 1], [ZA - 4.2, 1.45, 2], [ZA - 3.4, 1.15, 3], [ZA - 2.6, 1.4, 1]]) onWall(kidMats[k], XA + 106.16, y, z, .26, .36, Math.PI / 2, R(-.12, .12));
    spot(XA + 106.3, 1.25, ZA - 4.1, .25, .7, 3.2, 'Zeichnungen', note('Zeichnungen an der Wand', 'Mit Tesafilm an den Putz geklebt, in Augenhöhe eines Kindes. Sieben verschiedene Handschriften.\n\nAlle zeigen dasselbe: einen Kreis aus Stühlen, darüber ein Licht. Auf einer steht ein achter Stuhl, durchgestrichen, dann wieder hingemalt.\n\n<span class="hand">Hier haben sie gewartet.</span>', 'zeichnungen'));
    put(kCan, XA + 107, ZA - 7.2, { ry: .8 }); put(kBag, 0, ZA + 3.2, { ry: .3, maxX: XA + 121.83 });
    papers(XA + 113, ZA - 2, 6, 2.5); papers(XA + 119, ZA - 5, 4, 1);
    for (let x = XA + 107; x < XA + 121; x += R(2.5, 3.5)) { onWall(damp, x, .22, ZA - 7.84, R(1.8, 2.6), R(.4, .55), 0); onWall(damp, x + 1, .22, ZA + 7.84, R(1.8, 2.6), R(.4, .55), Math.PI); }
    // Der achte Stuhl (ohne Namen): altes Blut darunter
    flat(bloodOld, XA + 118.6, ZA + 5.1, 1.1, 1.1, .7, .013); flat(bloodOldS, XA + 118.9, ZA + 4.2, .5, 1.4, .2, .014);
    flat(bloodDrops, XA + 114, ZA + .5, 1.6, 1.6, 2, .013); flat(soot, XA + 118, ZA + 6, 3.2, 3.2, .4, .011);
    // Plan an der Wand
    put(kFrameG, 0, ZA + 4.2, { ry: Math.PI / 2, y: 1.15, minX: XA + 106.155 });
    const plan = plane(.4, .58, XA + 106.18, 1.15 + .345, ZA + 4.2, new THREE.MeshStandardMaterial({ roughness: .8, map: tex(cnv(256, (x, w) => { x.fillStyle = '#d6cfb8'; x.fillRect(0, 0, w, w); x.strokeStyle = '#2a2a2a'; x.lineWidth = 2; x.beginPath(); x.arc(128, 140, 70, 0, 7); x.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; x.fillStyle = i === 4 ? '#8a1010' : '#2a2a2a'; x.beginPath(); x.arc(128 + Math.cos(a) * 70, 140 + Math.sin(a) * 70, 10, 0, 7); x.fill(); } x.fillStyle = '#2a2a2a'; x.font = 'bold 16px Courier New'; x.textAlign = 'center'; x.fillText('PROTOKOLL SIEBZEHN', 128, 34); x.font = '12px Courier New'; x.fillText('Anordnung · Zyklus 17', 128, 52); x.fillStyle = '#8a1010'; x.fillText('Platz 8: bleibt frei', 128, 244); }), true) }), 0, Math.PI / 2);
    interact(plan, 'Plan an der Wand', note('Protokoll SIEBZEHN · Anordnung', 'Acht Plätze im Kreis. Sieben sind mit Bleistift nummeriert. Der achte ist rot umrandet.\n\n<i>„Platz 8 bleibt frei. Er wird mitgebracht.“</i>\n\nDarunter, mit Kugelschreiber: <span class="hand">von wem?</span>', 'plan'));
    for (let i = 0; i < 6; i++) (i % 2 ? edgeWeb(XA + 107.5 + i * 2.6, ZA - 7.85, 1, R(.7, 1)) : edgeWeb(XA + 107.5 + i * 2.6, ZA + 7.85, -1, R(.7, 1))); edgeWebX(XA + 106.15, ZA - 6, 1, .8); edgeWebX(XA + 121.85, ZA + 6.5, -1, .8);
  }

  // ================================================================== KAPITEL 3 · IM WEISSEN
  {
    // Eingang: leerer Rahmen, ein Stuhl mit dem Gesicht zur Ecke
    put(kFrameW, XW + 4.6, 0, { ry: 0, y: 1.25, minZ: ZW - 2.845 });
    const pw = plane(.53, .77, XW + 4.6, 1.25 + .45, ZW - 2.845 + .02, photoMat('white'), 0, 0);
    interact(pw, 'Leerer Rahmen', note('Ein Rahmen', 'Das Foto darin ist weiß. Nicht vergilbt, nicht ausgeblichen – <b>weiß</b>, als hätte jemand zu lange hineingesehen.\n\nWenn du blinzelst, steht für einen Moment eine Familie darauf. Vier Menschen. Der Junge darauf sieht aus wie du. Er ist es nicht.', 'rahmenweiss'));
    put(kChairW, XW + .75, ZW + 2.3, { ry: -Math.PI * .75 });
    flat(whiteGrime, XW + 4, ZW, 4, 3, .5, .012);

    // Kinderzimmer (x +8…+20): Eisenbett statt Kiste, Wandbord statt Nachttisch, Babybett, Regal, Fernseher
    find((o, c) => near(c, XW + 10.5, .25, ZW - 4.6) || near(c, XW + 10.5, .56, ZW - 4.6) || near(c, XW + 12, .35, ZW - 5.5)).forEach(hide);
    const bedM = put(kBedW, XW + 10.5, 0, { ry: Math.PI, sv: BED, minZ: ZW - 5.83 });
    r1Items.karte.m.position.set(XW + 10.3, surfY(kBedW, bedM, XW + 10.3, ZW - 4.2) + .012, ZW - 4.2);
    const shM = put(kShelfW, XW + 12.05, 0, { ry: 0, y: .62, minZ: ZW - 5.845 });
    r1Items.spieluhr.m.position.set(XW + 12.1, surfY(kShelfW, shM, XW + 12.1, ZW - 5.75, 1.5) + .06, ZW - 5.75); r1Items.spieluhr.m.rotation.y = .25;
    r1Items.spieluhr.m.material = (() => { const m = msSurfMat('floor_wood', { tint: 0x9a6a48 }); m.emissive = new THREE.Color(0x100a06); return m; })();
    put(kCrib, XW + 16.6, 0, { ry: 0, minZ: ZW - 5.83 });
    spot(XW + 16.6, .5, ZW - 5.45, 1.25, .8, .7, 'Babybett', note('Ein Babybett', 'Viel zu klein für einen Neunjährigen. Mama hat es nie weggegeben – „für später“, hat sie gesagt.\n\nDas Laken hat eine Mulde, noch warm. Als hätte gerade eben jemand darin gelegen. Jemand sehr Kleines.\n\n<span class="hand">Wer hat hier geschlafen, bevor du kamst?</span>', 'babybett'));
    // STORY-HOOK: Babybett – das „gemachte“ achte Kind (das Kind: „Ich habe ihn gemacht“)
    const w2 = put(kWardW, 0, ZW + 4.2, { ry: 0, minX: XW + 8.165 }); put(kCrtW, XW + 8.5, ZW + 4.2, { ry: 0, y: surfY(kWardW, w2, XW + 8.5, ZW + 4.2, .6) });
    spot(XW + 8.6, .3, ZW + 4.2, .45, .45, .5, 'Fernseher', () => { toast('Der Fernseher ist aus. In der schwarzen Scheibe spiegelt sich das Zimmer – mit einem Kind auf dem Bett. Du drehst dich um. Das Bett ist leer.', 5200); try { Audio.whisper(XW + 10.5, 1, ZW - 4.6, 1.2); } catch (e) {} });
    put(kChairW, XW + 14.2, ZW - 3.6, { ry: 2.23 });
    put(kFrameW, 0, ZW + 3.4, { ry: -Math.PI / 2, y: 1.3, maxX: XW + 19.845 });
    const fam = plane(.53, .77, XW + 19.845 - .02, 1.3 + .45, ZW + 3.4, photoMat('white'), 0, -Math.PI / 2);
    interact(fam, 'Familienfoto', note('Familienfoto', 'Mama, Lucy, ein Junge mit Sommersprossen. Sommer 2008.\n\nDas Gesicht des Jungen ist hell geworden, als stünde er zu nah am Blitz. Je länger du hinsiehst, desto weniger ist davon übrig.', 'familienfoto'));
    put(kLampW, XW + 19.4, ZW - 5.35, { ry: .4 });
    // Schrank (K3-6): Küchenschrank an der Nordwand; Spalt, Atmen und „leer beim Hinsehen“ macht weiss.js
    { const m = put(kDresserW, XW + 14.4, 0, { ry: Math.PI, maxZ: ZW + 5.83 }); S.schrank = aabb(kDresserW, m); }
    flat(kidMats[0], XW + 13.8, ZW - 1.5, .26, .36, .4, .012); flat(kidMats[2], XW + 14.3, ZW - 1.2, .26, .36, -.7, .012);

    // Küche (x +20…+32): Tisch, Stühle, Küchenbuffet, Regulator-Uhr, Radio
    find((o, c) => (o.material === M.wood && c.x > XW + 24.5 && c.x < XW + 27.5 && Math.abs(c.z - (ZW + 3.6)) < .6) || near(c, XW + 30.8, .9, ZW + 5.3)).forEach(hide);
    msDropCols(XW + 25.09, XW + 26.91, ZW + 3.09, ZW + 4.11);
    put(kTableW, XW + 26, ZW + 3.6, { ry: 0, sv: new V(.58, 1.02, 1.62) });
    { const cm = put(kChairK, XW + 26, ZW + 4.62, { ry: Math.PI }); S.seatK = surfY(kChairK, cm, XW + 26, ZW + 4.55, .8); } put(kChairK, XW + 25.5, ZW + 2.2, { ry: .25 }); put(kChairK, XW + 24.3, ZW + 3.7, { ry: Math.PI / 2 - .2 });
    const dM = put(kDresserW, XW + 30.6, 0, { ry: Math.PI, maxZ: ZW + 5.83 });
    put(kRadioW, XW + 30.6, ZW + 5.45, { ry: Math.PI / 2, y: surfY(kDresserW, dM, XW + 30.6, ZW + 5.45, 1.2) });
    spot(XW + 30.6, 1.0, ZW + 5.45, .5, .3, .5, 'Radio', () => toast('Hildes Radio. Die Nadel steht auf 31,10. Aus dem Lautsprecher: nur das Ticken einer Uhr, die nicht tickt.', 4800));
    { // Uhr: Regulator an der Wand, das Rätsel-Zifferblatt sitzt auf seinem Zifferblatt
      put(kClockW, XW + 26, 0, { ry: Math.PI, y: 2.02 - kClock.size.y * .64, maxZ: ZW + 5.84 });
      wallClock.scale.setScalar(.36); wallClock.position.set(XW + 26, 2.02, ZW + 5.84 - kClock.size.z - .006); }
    put(kLampW, XW + 21.2, ZW + 5.2, { ry: 1 }); put(kCanW, XW + 28.8, ZW + 5.4, { ry: .5 });
    put(kFrameW, XW + 22.9, 0, { ry: Math.PI, y: 1.3, maxZ: ZW + 5.845 });
    const ben = plane(.53, .77, XW + 22.9, 1.3 + .45, ZW + 5.845 - .02, photoMat('white'), 0, Math.PI);
    interact(ben, 'Foto von Zayn', note('Zayn, 7', 'Ein Junge mit Zahnlücke und viel zu großem Fußballtrikot. Unten am Rand, in Hildes Schrift: <i>„Zayn, Juli 2009. Kommt wieder.“</i>\n\nDas „wieder“ ist durchgestrichen. Dann neu geschrieben. Dann wieder durchgestrichen. Siebzehn Mal.', 'ben'));
    flat(whiteGrime, XW + 26, ZW + 3.6, 3.2, 2.6, .2, .012);

    // Der Hohe Abgrund: acht weiße Stühle, alte Blutspur von der Tür bis zum Rand des Lichts, Zeichnungen
    find((o, c, s) => o.material === M.metal && c.x > XW + 35 && c.x < XW + 49 && s.y < .75).forEach(hide);
    const kChairR3 = variant(kChairW, m => m); // eigene Instanzen ('chair**'): weiss.js blendet die Stühle erst in Raum 3, Teil 2 ein
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI2, cx = XW + 42 + Math.cos(a) * 5.1, cz = ZW + Math.sin(a) * 5.1; const cm = put(kChairR3, cx, cz, { ry: Math.atan2(XW + 42 - cx, ZW - cz) }); if (i === 0) S.seatW = surfY(kChairR3, cm, cx - Math.cos(a) * .05, cz - Math.sin(a) * .05, .8); }
    for (let x = XW + 32.6, i = 0; x < XW + 38.8; x += R(.5, .9), i++) flat(i % 2 ? bloodOld : bloodOldS, x, ZW + R(-.25, .25) + Math.sin(i) * .2, R(.35, .6), R(.35, .8), R(0, 6), .013);
    for (let i = 0; i < 8; i++) { if (i === 4) continue; const a = i / 8 * PI2; flat(kidMats[i % 3], XW + 42 + Math.cos(a) * 4.1, ZW + Math.sin(a) * 4.1, .26, .36, -a + Math.PI / 2 + R(-.3, .3), .012); }
    const kd = plane(.3, .42, XW + 38.2, .013, ZW + .1, new THREE.MeshStandardMaterial({ map: tex(paperCanvas('kid', 2), true), roughness: .95, emissive: 0x111111 }), -Math.PI / 2, -Math.PI / 2 + .1);
    interact(kd, 'Zeichnung vor dem leeren Stuhl', note('Vor dem achten Stuhl', 'Buntstift, sorgfältig. Ein großer Mann aus grauem Eisen, daneben ein kleiner Junge mit braunen Augen. Sie halten sich an der Hand.\n\nDarunter, in Kinderschrift: <b>PAPA + ICH</b>.\n\nDas Papier ist so alt, dass es an den Rändern zu Staub zerfällt.', 'papaich')); S.papaich = kd;
    // STORY-HOOK: Zeichnung „PAPA + ICH“ – das achte Kind, aus Justin gemacht
  }

  // ================================================================== GULLY · Einstieg zur versunkenen Stadt
  {
    const glowTex = tex(cnv(256, (x, w) => { x.clearRect(0, 0, w, w); const c = w / 2, g = x.createRadialGradient(c, c, w * .215, c, c, w * .5); g.addColorStop(0, 'rgba(255,180,100,0)'); g.addColorStop(.06, 'rgba(255,190,110,.95)'); g.addColorStop(.22, 'rgba(255,170,90,.32)'); g.addColorStop(1, 'rgba(255,160,80,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), true);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -6 }));
    glow.rotation.x = -Math.PI / 2; glow.position.set(9, .03, -1.3); glow.renderOrder = 3; glow.visible = false; scene.add(glow);
    const light = new VLight(0xffa860, 0, 6, 2); light.position.set(9, .35, -1.3); scene.add(light);
    const N = 26, pos = new Float32Array(N * 3), vel = []; for (let i = 0; i < N; i++) { vel.push([R(-.08, .08), R(.25, .55), R(-.08, .08), R(0, 3)]); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const steam = new THREE.Points(sg, new THREE.PointsMaterial({ map: tex(cnv(64, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,230,200,.5)'); g.addColorStop(1, 'rgba(255,230,200,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), true), color: 0xffe2c8, size: .42, transparent: true, opacity: .0, depthWrite: false }));
    steam.frustumCulled = false; steam.visible = false; steam.userData.noCol = true; scene.add(steam);
    S.gully = { glow, light, steam, pos, vel, k: 0 };
  }

  // ------------------------------------------------------------------ abschließen
  // ------------------------------------------------------------------ Röhrenmonitore: Schnee, Zeilen, Flackern
  { const nc = cnv(128, (x, w) => { const d = x.createImageData(w, w); for (let i = 0; i < w * w; i++) { const v = Math.random() * 200 * (.6 + .4 * Math.sin(i / w * .9)); d.data[i * 4] = v * .85; d.data[i * 4 + 1] = v * .95; d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; } x.putImageData(d, 0, 0); for (let y = 0; y < w; y += 3) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, y, w, 1); } });
    const nt = tex(nc, true); nt.repeat.set(.5, .5); const sm = new THREE.MeshBasicMaterial({ map: nt, color: 0x9fb0b8 }); S.snow = { nt, sm };
    const sw = kCrt.size.z * .66, sh = kCrt.size.y * .6, q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0));
    for (const m of screens) batch.add(new THREE.PlaneGeometry(sw, sh), sm, m.clone().multiply(new THREE.Matrix4().compose(new V(kCrt.size.x / 2 + .004, kCrt.size.y * .57, 0), q, new V(1, 1, 1)))); }
  // ------------------------------------------------------------------ Figuren: die sieben Kinder und Frau Wendt sitzen (Knochen gebeugt), der Verfolger wird ein gehäuteter Körper
  const _pw = new THREE.Quaternion(), _bw = new THREE.Quaternion(), _d = new THREE.Quaternion(), _q0 = new THREE.Quaternion();
  const bend = (b, axis, ang) => { if (!b) return; b.parent.getWorldQuaternion(_pw); b.getWorldQuaternion(_bw); _d.setFromAxisAngle(axis, ang); b.quaternion.copy(_pw.invert().multiply(_d).multiply(_bw)); };
  const bonesOf = g => { const b = {}; g.traverse(o => { if (o.isBone) b[o.name] = o; }); return b; };
  S.bend = bend; S.bonesOf = bonesOf;
  // Sitzhaltung einmal berechnen (lokale Drehungen), danach jedes Bild nach dem Mixer setzen
  function seat(g, seatY, arms) { const F = (FAB.figs || []).find(f => f.g === g); if (!F) return; g.updateMatrixWorld(true); const b = bonesOf(g); if (!b.thigh_l) return;
    const ax = new V(1, 0, 0).applyQuaternion(g.getWorldQuaternion(_q0));
    const pel = b.pelvis.getWorldPosition(new V()); const hipH = pel.y - g.position.y;
    bend(b.thigh_l, ax, -1.5); bend(b.thigh_r, ax, -1.5); bend(b.calf_l, ax, 1.45); bend(b.calf_r, ax, 1.45); bend(b.foot_l, ax, .1); bend(b.foot_r, ax, .1);
    bend(b.upperarm_l, ax, -arms); bend(b.upperarm_r, ax, -arms); bend(b.lowerarm_l, ax, -arms * .7); bend(b.lowerarm_r, ax, -arms * .7); bend(b.spine_02, ax, .12);
    const keep = ['thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'spine_02'].map(n => [b[n], b[n].quaternion.clone()]);
    g.position.y = seatY + .03 - hipH * .93; S.sit.push({ g, keep }); }
  S.sit = [];
  if (S.seatW) kids.forEach(K => seat(K.k, S.seatW, .55));
  if (S.seatK) { hilde.position.z = ZW + 4.55; seat(hilde, S.seatK, .72); }
  try { // Verfolger: statt Kapseln ein Körper ohne Haut, vornübergebeugt, die Arme nach vorn
    const gl = S.ghostGL, zm = SKC(gl.scene), mt = p => { const t = MSL.tl.load('assets/gore/' + p); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; };
    const flesh = new THREE.MeshStandardMaterial({ map: mt('meat_color.jpg'), normalMap: mt('meat_normal.jpg'), roughnessMap: mt('meat_rough.jpg'), color: 0x4a302c, roughness: .42, metalness: .05 }); flesh.map.colorSpace = THREE.SRGBColorSpace; flesh.map.repeat.set(1.5, 1.5); flesh.normalScale.set(1.6, 1.6);
    zm.traverse(o => { if (o.isMesh) { o.material = flesh; o.castShadow = true; o.frustumCulled = false; } });
    const zb = new THREE.Box3().setFromObject(zm); zm.scale.setScalar(1.92 / (zb.max.y - zb.min.y)); zm.position.y = -zb.min.y * zm.scale.x; zm.rotation.y = Math.PI / 2;
    zombie.g.children.forEach(c => c.visible = false); zombie.g.add(zm);
    const mx = new THREE.AnimationMixer(zm), wc = gl.animations.find(a => /walk/i.test(a.name)); if (wc) { const a = mx.clipAction(wc); a.timeScale = 2.3; a.play(); }
    S.zombie = { zm, mx, b: bonesOf(zm) };
  } catch (e) { console.warn('innen_kapitel Verfolger', e); }
  batch.flush(scene, false);
  flushKits();
  S.added = scene.children.filter(c => !before.has(c));
  S.toggle = v => { S.added.forEach(o => o.visible = v); S.hidden.forEach(o => o.visible = !v); };
  S.ok = true;
}]);

const _ikAx = new THREE.Vector3(), _ikQ = new THREE.Quaternion();
// Pro Bild: Gully-Licht in Kapitel 3, Kokon reißt auf, Kanal-Leiter, Flimmern
WORLD_TICK.push((dt, t) => {
  const S = innen_kapitel_S; if (!S.ok) return; S.t += dt; const P = player.pos;
  // Gully: warmes Licht und Dunst aus den Schlitzen, sobald Justin da ist (Kapitel 3, Straße)
  const G = S.gully; if (G) {
    const want = ch3.on && ch3.part === 'town' && ch3.met ? 1 : 0; G.k += (want - G.k) * Math.min(1, dt * .8);
    const on = G.k > .01 && Math.abs(P.x - 9) < 40 && Math.abs(P.z + 1.3) < 40; G.glow.visible = G.steam.visible = on;
    const fl = .82 + Math.sin(t * 2.3) * .08 + Math.sin(t * 7.1) * .05; G.light.intensity = on ? 2.2 * G.k * fl : 0; G.glow.material.opacity = .7 * G.k * fl;
    if (on) { const p = G.pos; for (let i = 0; i < G.vel.length; i++) { const v = G.vel[i]; v[3] += dt; const a = v[3] % 3.2; p[i * 3] = 9 + v[0] * a * 3 + Math.sin(t + i) * .05; p[i * 3 + 1] = .05 + v[1] * a; p[i * 3 + 2] = -1.3 + v[2] * a * 3; }
      G.steam.geometry.attributes.position.needsUpdate = true; G.steam.material.opacity = .1 * G.k; }
  }
  // Kokon: pendelt leicht; nach dem Schwarm aufgerissen und leer
  const K = S.cocoon; if (K && Math.abs(P.x - K.piv.position.x) < 30 && Math.abs(P.z - K.piv.position.z) < 30) {
    K.piv.rotation.z = Math.sin(t * .6) * .035; K.piv.rotation.x = Math.sin(t * .43) * .025;
    if (!K.torn && ch2.spiderPhase === 'gone') { K.torn = true; K.g.scale.multiply(new THREE.Vector3(.8, .55, .8)); K.silk.color.set(0x8a8478); }
  }
  // Monitor-Schnee (nur in Kapitel 2)
  if (S.snow && ch2.on) { S.snow.nt.offset.set(Math.random(), Math.random()); S.snow.sm.color.setScalar(.55 + Math.random() * .12 + (Math.random() < .03 ? .3 : 0)); }
  // Sitzende Figuren (nach dem Animations-Mixer): Beine und Arme in Sitzhaltung
  if (S.sit && Math.abs(P.x - C3.x - 30) < 40 && Math.abs(P.z - C3.z) < 30) for (const s of S.sit) if (s.g.visible) for (const [b, q] of s.keep) b.quaternion.copy(q);
  // Verfolger: Laufanimation, vornübergebeugt, Arme greifen nach vorn
  const Z = S.zombie; if (Z && zombie.g.visible && !Z.eigen) { Z.mx.update(dt); const ax = _ikAx.set(1, 0, 0).applyQuaternion(Z.zm.getWorldQuaternion(_ikQ)); S.bend(Z.b.spine_02, ax, .45); S.bend(Z.b.upperarm_l, ax, -1.25); S.bend(Z.b.upperarm_r, ax, -1.1); S.bend(Z.b.neck_01, ax, -.35); }
  // Kanal: sichtbare Leiter am Ausstieg (statt nur einer unsichtbaren Klickfläche), kaltes Licht von oben
  if (!S.ladder && canal.loaded) { S.ladder = true;
    try { const wood = canal.root.children.find(o => o.isInstancedMesh && o.count === 24 && [].concat(o.material)[0].name === 'MI_WoodRaw_02'), rope = canal.root.children.find(o => o.isInstancedMesh && o.count === 24 && [].concat(o.material)[0].name === 'MI_OldRope_01' && o.geometry.boundingBox && o.geometry.boundingBox.max.y > 2);
      const x = canal.spawn.x + 1.2, z = canal.spawn.z, gy = (typeof canalGroundY === 'function' && canalGroundY(x, canal.spawn.y + .5, z)) ?? canal.spawn.y;
      for (const src of [wood, rope]) { if (!src) continue; const m = new THREE.Mesh(src.geometry, src.material); m.position.set(x, gy, z); m.rotation.set(-.1, -Math.PI / 2, 0, 'YXZ'); m.scale.set(1, 1.7, 1); m.castShadow = true; m.userData.noCol = true; scene.add(m); }
      const l = new VLight(0x9fb8d8, 1.4, 7, 2); l.position.set(x, gy + 4.5, z); scene.add(l);
    } catch (e) { console.warn('innen_kapitel Leiter', e); } }
});
// Fülllicht Amt (AP Welt/Licht): brennt eine Röhre in der Nähe, hellt ihr Streulicht von Decke und Wänden den Raum leicht auf (Hemisphäre, keine Lichter).
// Ohne Strom/bei toten Röhren bleibt es schwarz – Licht nur mit Quelle.
if (typeof LICHT_HAKEN !== 'undefined') LICHT_HAKEN.push(() => { if (!ch2.on || !state.inBasement) return; const P = camera.position; if (Math.abs(P.x - C2.x) > 260 || Math.abs(P.z - C2.z) > 260) return; let f = 0;
  for (let i = 0; i < c2Lights.length; i++) { const L = c2Lights[i], dx = L.l.position.x - P.x, dz = L.l.position.z - P.z, d2 = dx * dx + dz * dz; if (d2 < 81 && L.l.intensity > 0) f = Math.max(f, Math.min(1, L.l.intensity / L.base) * (1 - d2 / 81)); }
  hemi.intensity += .13 * f; });
