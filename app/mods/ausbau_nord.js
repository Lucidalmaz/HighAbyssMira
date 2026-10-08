// =====================================================================  AUSBAU NORD · DER KIRCHBERG
// Kirchweg-Gasse (x ≈ −7) vom Ortskern hinauf zur Straße „Am Kirchberg“ (z ≈ 60). Nördlich der Straße: Kapelle mit Friedhof
// (Westen) und Spielplatz (Osten), südlich: Bushaltestelle und vier Häuser. Drei Nebenaufgaben, leise Schreckmomente.
// Alles Sichtbare sind Scans/Modelle aus assets/ms (Flächen = Scan-Oberflächen). Koordinaten: siehe mods/ausbau_nord_report.md
const ausbau_nord = {
  ok: false, names: new Set(), lights: new Set(), bear: 'grave', restored: false,
  kids: [], cand: [], quest: [], hits: {}, bus: { phase: 'idle', t: 0, near: 0, x: 80 },
  merry: null, swing: null, teddy: null, lantern: null, bell: false, figT: 45, crowT: 18, lampT: 9, gateZ: 0,
  eighth: null, echo: false, busArmed: 0,
};
WORLD_MODS.push(['Kirchberg', async () => { await ausbau_nord_build(); }]);
WORLD_TICK.push((dt, t, indoor) => { if (ausbau_nord.ok) ausbau_nord_tick(dt, t, indoor); });
for (let n = 1; n <= 6; n++) KAP_BEGIN[n].push(() => ausbau_nord_sperre());

// ---- kleine Werkzeuge
function ausbau_nord_rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Teile eines (bereits skalierten) Objekts mit eingebackener Transformation – für InstancedMesh
function ausbau_nord_parts(root, pred = () => true) {
  root.updateMatrixWorld(true); const out = [];
  root.traverse(o => { if (o.isMesh && o.visible && pred(o)) out.push({ geo: o.geometry.clone().applyMatrix4(o.matrixWorld), mat: o.material, name: o.name }); });
  return out;
}
// Einzelnes Teilnetz (per Name) aus einer FBX-Szene lösen – mit seiner Welt-Drehung/-Skalierung, ohne Verschiebung
function ausbau_nord_piece(root, name, s = 1) {
  root.updateMatrixWorld(true); const src = root.getObjectByName(name); if (!src) return null;
  const m = src.clone(); const q = new THREE.Quaternion(), sc = new THREE.Vector3(); src.matrixWorld.decompose(new THREE.Vector3(), q, sc);
  m.position.set(0, 0, 0); m.quaternion.copy(q); m.scale.copy(sc).multiplyScalar(s); return msGround(m);
}
// Dreiecke nach Material sortieren (der Kapellen-Scan hat pro Dreieck eine eigene Gruppe → sonst ~900 000 Zeichenaufrufe je Bild)
function ausbau_nord_regroup(geo) {
  if (!geo.index || geo.groups.length < 16) return geo;
  const src = geo.index.array, cnt = new Map();
  for (const g of geo.groups) cnt.set(g.materialIndex, (cnt.get(g.materialIndex) || 0) + g.count);
  const keys = [...cnt.keys()].sort((a, b) => a - b), off = new Map(); let o = 0; for (const k of keys) { off.set(k, o); o += cnt.get(k); }
  const dst = new src.constructor(o), at = new Map(off);
  for (const g of geo.groups) { const d = at.get(g.materialIndex); dst.set(src.subarray(g.start, g.start + g.count), d); at.set(g.materialIndex, d + g.count); }
  geo.setIndex(new THREE.BufferAttribute(dst, 1)); geo.clearGroups(); for (const k of keys) geo.addGroup(off.get(k), cnt.get(k), k);
  return geo;
}
// Scan lotrecht stellen: die Richtung, die auf allen Wandflächen senkrecht steht (kleinster Eigenvektor von Σ n·nᵀ), wird zu +Y
function ausbau_nord_level(mesh) {
  const g = mesh.geometry, p = g.attributes.position, ix = g.index, mw = mesh.matrixWorld, a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  let y0 = Infinity; for (let i = 0; i < p.count; i += 50) y0 = Math.min(y0, a.fromBufferAttribute(p, i).applyMatrix4(mw).y);
  const S = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], tri = ix ? ix.count / 3 : p.count / 3, I = k => ix ? ix.getX(k) : k;
  for (let t = 0; t < tri; t += 2) { a.fromBufferAttribute(p, I(t * 3)).applyMatrix4(mw); b.fromBufferAttribute(p, I(t * 3 + 1)).applyMatrix4(mw); c.fromBufferAttribute(p, I(t * 3 + 2)).applyMatrix4(mw);
    const cy = (a.y + b.y + c.y) / 3 - y0; if (cy < 1.5 || cy > 7) continue;
    n.subVectors(b, a).cross(c.sub(a)); const w = n.length(); if (w < 1e-8) continue; n.divideScalar(w); if (Math.abs(n.y) > .5) continue;
    const v = [n.x, n.y, n.z]; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S[i][j] += w * v[i] * v[j]; }
  // Jacobi-Eigenzerlegung (symmetrisch 3 × 3)
  const A = S.map(r => r.slice()), V = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let it = 0; it < 40; it++) { let pI = 0, q = 1; for (const [i, j] of [[0, 1], [0, 2], [1, 2]]) if (Math.abs(A[i][j]) > Math.abs(A[pI][q])) { pI = i; q = j; }
    if (Math.abs(A[pI][q]) < 1e-12) break; const th = (A[q][q] - A[pI][pI]) / (2 * A[pI][q]), tt = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), cs = 1 / Math.sqrt(tt * tt + 1), sn = tt * cs;
    for (let k = 0; k < 3; k++) { const x = A[k][pI], y = A[k][q]; A[k][pI] = cs * x - sn * y; A[k][q] = sn * x + cs * y; }
    for (let k = 0; k < 3; k++) { const x = A[pI][k], y = A[q][k]; A[pI][k] = cs * x - sn * y; A[q][k] = sn * x + cs * y; }
    for (let k = 0; k < 3; k++) { const x = V[k][pI], y = V[k][q]; V[k][pI] = cs * x - sn * y; V[k][q] = sn * x + cs * y; } }
  let m = 0; for (let k = 1; k < 3; k++) if (A[k][k] < A[m][m]) m = k;
  const up = new THREE.Vector3(V[0][m], V[1][m], V[2][m]).normalize(); if (up.y < 0) up.negate();
  if (up.y < .9) return new THREE.Quaternion(); // unplausibel → nichts drehen
  return new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(0, 1, 0));
}
// Höhe des mitgescannten Bodenstücks (Randzellen ohne Mauerwerk): gewähltes Quantil der Oberkanten
function ausbau_nord_groundTop(mesh, q = .35) {
  mesh.updateMatrixWorld(true); const p = mesh.geometry.attributes.position, v = new THREE.Vector3(), cells = new Map();
  for (let i = 0; i < p.count; i += 3) { v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld); const k = Math.round(v.x * 2) + ',' + Math.round(v.z * 2); const c = cells.get(k); if (c) { c[0] = Math.min(c[0], v.y); c[1] = Math.max(c[1], v.y); } else cells.set(k, [v.y, v.y]); }
  const tops = [...cells.values()].filter(c => c[1] - c[0] < .9).map(c => c[1]).sort((a, b) => a - b);
  return tops.length ? tops[Math.floor(tops.length * q)] : 0;
}
// Objekt auf Höhe/Größe bringen und mit der Unterkante auf y = 0 stellen (Mitte x/z = 0) – liefert Gruppe
function ausbau_nord_fit(o, size, axis = 'y') { msFit(o, size, axis); return msGround(o); }
// Ebene mit Scan-Oberfläche in Weltmetern (tile 2 m)
// Weiche, ausgefranste Ränder für flache Bodenflächen (Laub, Beete, Gräber): aE.x = Abstand zum Rand in m, Alpha steigt über ~45 cm mit Rauschen an (Nutzer 07.10., Foto 3: hartes Quadrat im Gras)
function boden_weich(geo, w, d) { const uv = geo.attributes.uv, e = new Float32Array(uv.count * 4); for (let i = 0; i < uv.count; i++) { e[i * 4] = uv.getX(i) * w; e[i * 4 + 1] = uv.getY(i) * d; e[i * 4 + 2] = w; e[i * 4 + 3] = d; } geo.setAttribute('aE', new THREE.BufferAttribute(e, 4)); return geo; } // aE = (x, y, Breite, Tiefe) in m: der Randabstand wird erst im Fragment gebildet (Minimum über Ecken-Werte wäre überall 0)
function boden_weichMat(mat, fe = .45) { const m = mat.clone(); m.transparent = true; m.depthWrite = false; m.polygonOffset = true; m.polygonOffsetFactor = -2; m.userData.tile = mat.userData.tile;
  m.onBeforeCompile = sh => { sh.vertexShader = 'attribute vec4 aE; varying vec4 vAE;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vAE = aE;');
    sh.fragmentShader = 'varying vec4 vAE;\nfloat bwH(vec2 p){ return fract(sin(dot(floor(p), vec2(127.1, 311.7))) * 43758.5453); }\nfloat bwN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(bwH(i), bwH(i + vec2(1,0)), f.x), mix(bwH(i + vec2(0,1)), bwH(i + vec2(1,1)), f.x), f.y); }\n'
      + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n { float bn = bwN(vMapUv * 7.) * .6 + bwN(vMapUv * 23.) * .4; diffuseColor.a *= smoothstep(0., ' + fe.toFixed(2) + ' * (.55 + .9 * bn), min(min(vAE.x, vAE.z - vAE.x), min(vAE.y, vAE.w - vAE.y)) + (bn - .5) * .12); if (diffuseColor.a < .01) discard; }'); };
  m.customProgramCacheKey = () => 'bodenweich' + fe; m.needsUpdate = true; return m; }
function ausbau_nord_surf(key, tint = 0xffffff, nrm = 1) { const m = msSurfMat(key, { tint, nrm }); m.userData.tile = 2; return m; }
// Kerze (Scan-Modell per Instanz) + Flamme/Licht/Lichtschein wie die Kerzen im Ort (flackern über candlesUpdate)
function ausbau_nord_flame(x, y, z, on, k = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); scene.add(g);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); flame.scale.set(.07 * k, .11 * k, 1); flame.position.y = .05 * k; g.add(flame);
  const light = new VLight(0xffa040, 1.1, 3.2, 2); light.position.y = .1; g.add(light);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshBasicMaterial({ map: poolTex, color: 0xff9a40, transparent: true, opacity: .35, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -PI / 2; pool.position.y = .012 - y; g.add(pool);
  const C = { g, flame, light, pool, seed: rand(0, 9), on: true }; candles.push(C); ausbau_nord_setFlame(C, on); return C;
}
function ausbau_nord_setFlame(C, on) { C.on = on; C.flame.visible = on; C.pool.visible = on; C.light.intensity = on ? 1.1 : 0; }
// Freie Bühne: keine Story-Sequenz, kein Menü, keine Verfolgung
function ausbau_nord_free() {
  return state.started && !state.talking && !ui.overlay && !state.ending && !state.inBasement && state.zone !== 'canal' && !state.ch2 && !state.scaring
    && !(state.outage && !ch3.on) && !(ch3.on && (ch3.part !== 'town' || ch3.chase === 'run' || ch3.lampsOff)) && !menu.attract;
}
function ausbau_nord_items() {
  if (ITEMS.nord_lantern) return;
  ITEMS.nord_lantern = { name: 'Grablaterne', desc: 'Die Laterne der Madonna. Die Flamme darin neigt sich nicht, egal wie du sie hältst.' };
  ITEMS.nord_baer = { name: 'Bärli', desc: 'Ein alter Teddy, nass vom Regen. Er saß auf der grünen Plane neben deinem Stein und sah nach unten.' };
  ICONS.nord_lantern = '<svg viewBox="0 0 24 24"><path d="M9 5h6M12 2v3M8 8h8l-1 10H9z"/><path d="M10 21h4"/><path d="M12 11c1.2 1.6 1.2 3 0 4c-1.2-1-1.2-2.4 0-4z"/></svg>';
  ICONS.nord_baer = '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="4"/><circle cx="7.8" cy="5.4" r="1.7"/><circle cx="16.2" cy="5.4" r="1.7"/><ellipse cx="12" cy="17.5" rx="5" ry="4.3"/></svg>';
}
function ausbau_nord_dropItem(k) { const i = story.items.indexOf(k); if (i >= 0) story.items.splice(i, 1); }
function ausbau_nord_save() { try { const N = ausbau_nord; localStorage.setItem('ham_nord', JSON.stringify({ names: [...N.names], lights: [...N.lights], bear: N.bear, lq: N.lq ? N.lq.state : 'hidden', ochs: N.ochs ? N.ochs.n : 0, plakat: N.plakat || 0, namesDone: !!N.namesDone })); } catch (e) {} }
// Papier/Schild als Textur-Ebene (Decal) – Text wird auf Leinwand gemalt
function ausbau_nord_paper(w, h, draw, px = 512) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w); draw(c.getContext('2d'), c.width, c.height);
  const t = tex(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .95, transparent: true, alphaTest: .05, polygonOffset: true, polygonOffsetFactor: -2 }));
}
// Aushang auf dem Rahmen eines Scan-Schilds (das alte Schild wird vorn und hinten überklebt)
function ausbau_nord_board(parts, x, z, ry, paper, y = 1.56) {
  msInst(parts, [msM4(x, 0, z, ry)], {}); const nx = Math.sin(ry), nz = Math.cos(ry);
  for (const s of [1, -1]) { const p = s > 0 ? paper : paper.clone(); p.position.set(x + nx * .042 * s, y, z + nz * .042 * s); p.rotation.y = s > 0 ? ry : ry + PI; scene.add(p); }
}
const ausbau_nord_hand = (x, t, px, py, size = 26, col = '#1c1a2e') => { x.font = `${size}px Caveat, cursive`; x.fillStyle = col; x.fillText(t, px, py); };

// ---- Basis-Umsetzung „Text gegen Welt“ (docs/gameplay/abgleich/basis_umsetzung.md): gemeinsame Bausteine, auch von den anderen Modulen genutzt (Funktionen werden hochgezogen, nur zur Bauzeit aufrufen)
const bu_S = { kp: null, pap: null };
// Handschrift-/Kreide-/Ritz-Abziehbild (Modul ritzschrift) als Ebene w × h m. draw(C, B, W, H, ppm) malt in Pixeln; B = Höhenrelief (null bei relief:false)
function bu_ritz(w, h, draw, o = {}) {
  const ppm = o.ppm ?? 400, W = Math.max(8, Math.round(w * ppm)), H = Math.max(8, Math.round(h * ppm)), c = document.createElement('canvas'), b = document.createElement('canvas'); c.width = b.width = W; c.height = b.height = H;
  const C = c.getContext('2d'), B = b.getContext('2d'); B.fillStyle = '#808080'; B.fillRect(0, 0, W, H); ritz_rs = ((o.seed ?? 1) * 2654435761 + 4242) >>> 0;
  draw(C, o.relief === false ? null : B, W, H, ppm);
  const T1 = new THREE.CanvasTexture(c); T1.colorSpace = THREE.SRGBColorSpace; T1.anisotropy = 8;
  const mo = { map: T1, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: o.pof ?? -4, polygonOffsetUnits: -4, roughness: o.rough ?? .95, metalness: 0 };
  if (o.relief !== false) { const T2 = new THREE.CanvasTexture(b); T2.anisotropy = 8; mo.bumpMap = T2; mo.bumpScale = o.bump ?? 1.6; }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial(mo)); m.renderOrder = 2; m.userData.noCol = true; return m; }
// Ebene auf eine Fläche legen: Punkt p, Normale n (zeigt zum Betrachter), „oben“ der Leinwand zeigt nach up; off = Abstand von der Fläche
function bu_an(m, p, n, up, off = .004) {
  const z = n.clone().normalize(), u = up || new THREE.Vector3(0, 1, 0), x = new THREE.Vector3().crossVectors(u, z); if (x.lengthSq() < 1e-6) x.set(1, 0, 0); x.normalize(); const y = new THREE.Vector3().crossVectors(z, x);
  m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); m.position.copy(p).addScaledVector(z, off); return m; }
// Strahl auf Objekte: liefert { p, n (zum Strahlursprung gewandt, Welt), o, d } oder null
function bu_strahl(objs, ox, oy, oz, dx, dy, dz, far = 6) {
  const list = [].concat(objs).filter(Boolean); list.forEach(o => o.updateMatrixWorld(true)); const rc = new THREE.Raycaster(new THREE.Vector3(ox, oy, oz), new THREE.Vector3(dx, dy, dz).normalize(), 0, far); rc.camera = camera; const h = rc.intersectObjects(list, true).find(q => !q.object.isSprite); if (!h) return null;
  const n = h.face ? h.face.normal.clone() : new THREE.Vector3(0, 1, 0), m4 = new THREE.Matrix4(); if (h.object.isInstancedMesh && h.instanceId !== undefined) { h.object.getMatrixAt(h.instanceId, m4); n.transformDirection(m4); }
  n.transformDirection(h.object.matrixWorld); if (n.dot(rc.ray.direction) > 0) n.negate(); return { p: h.point.clone(), n, o: h.object, d: h.distance }; }
// Scan-Modell holen: Klon, auf Größe gebracht, Unterkante y = 0, Mitte x/z = 0 (null bei Ladefehler)
async function bu_mod(key, file = 'model.glb', size = 0, axis = 'y') { try { const o = (await msModel(key, file)).clone(true); if (size) msFit(o, size, axis); const g = msGround(o); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g; } catch (e) { console.warn('basis_umsetzung: Modell ' + key, e); return null; } }
// Materialien eines Modells klonen und einfärben (color: Hex oder null; mul = Multiplikation mit der vorhandenen Farbe)
function bu_tint(o, color, { metal, rough, mul = false } = {}) { o.traverse(m => { if (!m.isMesh) return; m.material = [].concat(m.material).map(mt => { const c = mt.clone(); if (color !== null && color !== undefined) { if (mul) c.color.multiply(new THREE.Color(color)); else c.color.set(color); } if (metal !== undefined) c.metalness = metal; if (rough !== undefined) c.roughness = rough; return c; }); if (m.material.length === 1) m.material = m.material[0]; }); return o; }
// Astern (Kopf: Strahlenblüten mit gelber Mitte als Abziehbild-Ebene, Stiele als Röhren) – ein liegender Strauß, Köpfe zu +z, Stiele zu −z; Gruppe wird mit y-Drehung gestellt
function bu_asterTex(pal) { const k = 'aster' + pal; if (bu_S[k]) return bu_S[k]; const P = [['#6a4aa8', '#c8b6f0'], ['#a8487a', '#f2b8d6'], ['#b8b6cc', '#ffffff']][pal % 3], c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.translate(64, 64);
  for (let ring = 0; ring < 2; ring++) for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2 + ring * .11 + Math.sin(i * 7.3) * .03, L = 60 - ring * 11 - (i % 3) * 2, w = 4.6; x.save(); x.rotate(a); const g = x.createLinearGradient(0, 8, 0, L); g.addColorStop(0, ring ? P[0] : '#50388a'); g.addColorStop(.35, P[0]); g.addColorStop(1, P[1]); x.fillStyle = g; x.beginPath(); x.moveTo(-w * .45, 7); x.quadraticCurveTo(-w * 1.1, L * .55, 0, L); x.quadraticCurveTo(w * 1.1, L * .55, w * .45, 7); x.fill(); x.restore(); }
  x.fillStyle = '#d9a82a'; x.beginPath(); x.arc(0, 0, 9.5, 0, 7); x.fill(); x.fillStyle = '#a8701a'; x.beginPath(); x.arc(0, 0, 5, 0, 7); x.fill(); for (let i = 0; i < 24; i++) { x.fillStyle = `rgba(255,236,150,${.3 + .4 * Math.sin(i)})`; x.fillRect(Math.cos(i * 2.4) * 6.5, Math.sin(i * 2.4) * 6.5, 1.6, 1.6); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return bu_S[k] = t; }
function bu_strauss(x, y, z, ry, n = 9, seed = 1) {
  const R_ = ausbau_nord_rng(seed), g = new THREE.Group(), stems = [], mats = [0, 1, 2].map(i => new THREE.MeshStandardMaterial({ map: bu_asterTex(i), alphaTest: .45, side: THREE.DoubleSide, roughness: .7 }));
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x4f6c37, roughness: .75 });
  for (let i = 0; i < n; i++) { const a = (i / (n - 1) - .5) * 1.5 + (R_() - .5) * .25, L = .24 + R_() * .1, hx = Math.sin(a) * L, hz = Math.cos(a) * L, hy = .028 + R_() * .045 + (i % 2) * .018;
    const cur = new THREE.CatmullRomCurve3([new THREE.Vector3((R_() - .5) * .016 - hx * .45, .012, -.13), new THREE.Vector3((R_() - .5) * .014, .02 + R_() * .01, 0), new THREE.Vector3(hx * .55, hy * .7, hz * .55), new THREE.Vector3(hx, hy, hz)]);
    stems.push(new THREE.TubeGeometry(cur, 10, .0024 + R_() * .0006, 5)); const m = mats[i < n * .6 ? 0 : (i % 2 ? 1 : 2)], tilt = -.55 + (R_() - .5) * .5;
    for (const [sz, off, rr] of [[.078 + R_() * .014, .0, 0], [.058, .004, .5]]) { const pl = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), m); pl.rotation.set(-PI / 2 + tilt, rr + R_() * .6, 0, 'YXZ'); pl.position.set(hx, hy + off + .008, hz); pl.castShadow = false; pl.receiveShadow = true; pl.userData.noCol = true; g.add(pl); }
    if (i % 2 === 0) { const lf = new THREE.Mesh(new THREE.PlaneGeometry(.045, .012), new THREE.MeshStandardMaterial({ color: 0x57783c, side: THREE.DoubleSide, roughness: .7 })); lf.position.set(hx * .6, hy * .75 + .004, hz * .55); lf.rotation.set(-PI / 2 + .2, a * 1.3, 0, 'YXZ'); g.add(lf); } }
  const sm = new THREE.Mesh(mergeGeometries(stems), stemMat); sm.castShadow = false; sm.userData.noCol = true; g.add(sm);
  const tw = new THREE.Mesh(new THREE.TorusGeometry(.016, .0022, 6, 14), new THREE.MeshStandardMaterial({ color: 0x8a7248, roughness: .95 })); tw.rotation.x = PI / 2; tw.position.set(0, .02, .0); g.add(tw); tw.userData.noCol = true; // Bindfaden
  g.position.set(x, y, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) o.userData.noCol = true; }); return g; }
// Spaten (Stahlblatt mit Erde am Ende, Hülse, Holzschaft, D-Griff): Ursprung = Blattspitze, Schaft zeigt nach +y (Länge ~1,0 m)
function bu_spaten() {
  const g = new THREE.Group(), T = THREE, steel = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: .55, metalness: .72, side: T.DoubleSide });
  const sh = new T.Shape(); sh.moveTo(-.095, .27); sh.lineTo(-.098, .1); sh.bezierCurveTo(-.09, .035, -.04, .004, 0, 0); sh.bezierCurveTo(.04, .004, .09, .035, .098, .1); sh.lineTo(.095, .27); sh.lineTo(-.095, .27);
  const bg = new T.ExtrudeGeometry(sh, { depth: .0028, bevelEnabled: false, curveSegments: 10 }); { const P = bg.attributes.position, col = new Float32Array(P.count * 3), er = new T.Color(0x3a2a1a), st = new T.Color(0x7a746a), ru = new T.Color(0x6a4a30), c = new T.Color();
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i); P.setZ(i, P.getZ(i) + x * x * 1.7 + Math.max(0, y - .2) * .0); const k = Math.min(1, Math.max(0, (y - .05) / .1)); c.copy(er).lerp(st, k * (.7 + .3 * Math.sin(x * 70 + y * 40))); if (k > .8) c.lerp(ru, .25 + .2 * Math.sin(x * 33 - y * 51)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } bg.setAttribute('color', new T.BufferAttribute(col, 3)); bg.computeVertexNormals(); }
  const bl = new T.Mesh(bg, steel); bl.castShadow = true; g.add(bl);
  const hul = new T.Mesh(new T.CylinderGeometry(.021, .027, .11, 12), steel); hul.position.set(0, .3, .008); g.add(hul);
  const wc = document.createElement('canvas'); wc.width = 32; wc.height = 256; { const x = wc.getContext('2d'); x.fillStyle = '#a2845a'; x.fillRect(0, 0, 32, 256); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${60 + Math.random() * 40},${40 + Math.random() * 30},20,${.08 + Math.random() * .2})`; x.fillRect(Math.random() * 32, 0, .6 + Math.random() * 1.6, 256); } }
  const wt = new T.CanvasTexture(wc); wt.colorSpace = T.SRGBColorSpace; const wood = new T.MeshStandardMaterial({ map: wt, roughness: .78, metalness: 0 });
  const shf = new T.Mesh(new T.CylinderGeometry(.0165, .0175, .68, 10), wood); shf.position.set(0, .64, .008); g.add(shf);
  const grip = new T.Mesh(new T.CylinderGeometry(.0185, .0185, .17, 10), wood); grip.rotation.z = PI / 2; grip.position.set(0, .99, .008); g.add(grip); // T-Griff
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); return g; }
// Einzelnes Teilnetz aus einem Scan als Mesh: Welt-Matrix eingebacken, optional flach gelegt (dünnste Achse nach oben), auf Größe (größte Kante) gebracht, Mitte x/z = 0, Unterkante y = 0. o.fbx = Materialspec für FBX
async function bu_teil(key, file, nameRe, size, o = {}) {
  bu_S.teil = bu_S.teil || new Map(); const k = key + '|' + nameRe + '|' + size + '|' + (o.flach ? 1 : 0);
  if (!bu_S.teil.has(k)) bu_S.teil.set(k, (async () => { const src = o.fbx ? await msFBX(key, file, o.fbx) : await msModel(key, file); src.updateMatrixWorld(true); let m = null; src.traverse(q => { if (!m && q.isMesh && nameRe.test(q.name)) m = q; }); if (!m) return null;
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.computeBoundingBox(); let b = g.boundingBox, s = b.getSize(new THREE.Vector3());
    if (o.flach) { const ax = s.x <= s.y && s.x <= s.z ? 'x' : s.y <= s.z ? 'y' : 'z'; if (ax === 'x') g.rotateZ(PI / 2); else if (ax === 'z') g.rotateX(-PI / 2); g.computeBoundingBox(); b = g.boundingBox; s = b.getSize(new THREE.Vector3()); }
    g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); const sc = size / Math.max(s.x, s.y, s.z); g.scale(sc, sc, sc); g.computeBoundingBox(); g.computeBoundingSphere(); return { geo: g, mat: m.material }; })());
  const r = await bu_S.teil.get(k); if (!r) return null; const me = new THREE.Mesh(r.geo, r.mat); me.castShadow = true; me.receiveShadow = true; return me; }
// Kinderschuh (Größe 31, Klettverschluss, ~20 cm): Sohle, Obermaterial als Querschnitt-Loft (Ferse hoch, Zehenkappe flach), Klettband – Ursprung Fersenmitte, Spitze zeigt nach +z
function bu_kinderschuh(farbe = 0x2c4f9c) {
  const T = THREE, g = new T.Group(), N = 18, M = 14, L = .205;
  const curve = (tab, t) => { for (let i = 1; i < tab.length; i++) if (t <= tab[i][0]) { const a = tab[i - 1], b = tab[i], k = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; } return tab[tab.length - 1][1]; };
  const H = [[0, .068], [.2, .066], [.4, .05], [.6, .042], [.8, .034], [1, .006]], Wd = [[0, .03], [.3, .034], [.6, .04], [.85, .039], [1, .012]];
  const loft = (t0, t1, grow, skipTop) => { const pos = [], idx = [], rows = 10; for (let i = 0; i <= rows; i++) { const tt = t0 + (t1 - t0) * i / rows, z = tt * L, a = curve(Wd, tt) + grow, b = curve(H, tt) + grow; for (let j = 0; j <= M; j++) { const th = j / M * PI; pos.push(Math.cos(th) * a, .013 + Math.sin(th) * b, z); } }
    for (let i = 0; i < rows; i++) for (let j = 0; j < M; j++) { const a0 = i * (M + 1) + j, a1 = a0 + 1, b0 = a0 + M + 1, b1 = b0 + 1, tt = t0 + (t1 - t0) * i / rows; if (skipTop && tt < .3 && j >= 4 && j < 10) continue; idx.push(a0, b0, a1, a1, b0, b1); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return geo; };
  const fab = new T.MeshStandardMaterial({ color: farbe, roughness: .88, side: T.DoubleSide }), velcro = new T.MeshStandardMaterial({ color: 0xc8c8c4, roughness: .95, side: T.DoubleSide }), rub = new T.MeshStandardMaterial({ color: 0xdedcd4, roughness: .7 });
  const up = new T.Mesh(loft(0, 1, 0, true), fab), strap = new T.Mesh(loft(.4, .5, .003, false), velcro); g.add(up, strap);
  const sh = new T.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.034, 0, .036, .035, .033, .07); sh.bezierCurveTo(.031, .12, .043, .14, .041, .175); sh.bezierCurveTo(.039, .205, .012, .212, 0, .212); sh.bezierCurveTo(-.012, .212, -.039, .205, -.041, .175); sh.bezierCurveTo(-.043, .14, -.031, .12, -.033, .07); sh.bezierCurveTo(-.036, .035, -.034, 0, 0, 0);
  const sg = new T.ExtrudeGeometry(sh, { depth: .013, bevelEnabled: true, bevelSize: .002, bevelThickness: .002, bevelSegments: 2, curveSegments: 12 }); sg.rotateX(PI / 2); sg.translate(0, .013, 0); const sole = new T.Mesh(sg, rub); sole.position.set(0, 0, 0); g.add(sole);
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.userData.noCol = true; } }); g.userData.noCol = true; return g; }
// Grablicht-Becher, leer (rotes Kunststoffgefäß): Ursprung Boden
function bu_grablichtBecher() { const prof = [[0, 0], [.027, 0], [.0335, .075], [.0345, .0785], [.0325, .0775], [.0262, .004], [0, .004]], m = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 20), new THREE.MeshStandardMaterial({ color: 0xa81818, roughness: .22, metalness: 0, transparent: true, opacity: .88, side: THREE.DoubleSide })); m.castShadow = true; m.userData.noCol = true; return m; }
// verdorrte Grashalme (n Büschel à 5–7 Halme), liegen auf einer Fläche; ein Mesh
function bu_gras(spots, seed = 5) { const R_ = ausbau_nord_rng(seed), geos = []; for (const [x, y, z] of spots) { const nb = 5 + Math.floor(R_() * 3); for (let b = 0; b < nb; b++) { const L = .1 + R_() * .08, gp = new THREE.PlaneGeometry(.0042, L, 1, 5), P = gp.attributes.position; gp.translate(0, L / 2, 0);
      for (let i = 0; i < P.count; i++) { const yy = P.getY(i); P.setZ(i, yy * yy * 1.3 * (R_() > .5 ? 1 : 1)); P.setX(i, P.getX(i) * (1 - yy / L * .8)); } gp.rotateX(-PI / 2 + .12 + R_() * .35); gp.rotateY(R_() * 6.28); gp.translate(x + (R_() - .5) * .03, y + .004 + R_() * .004, z + (R_() - .5) * .03); geos.push(gp); } }
  const m = new THREE.Mesh(mergeGeometries(geos), new THREE.MeshStandardMaterial({ color: 0x8e9a52, roughness: .85, side: THREE.DoubleSide })); m.castShadow = false; m.userData.noCol = true; return m; }
// Pappkarton (Deckel mit Handschrift in Kuli), Ursprung Mitte Boden
function bu_karton(w, h, d, text, px = 70, farbe = '#b09870') {
  const T = THREE, cv = document.createElement('canvas'); cv.width = 512; cv.height = Math.round(512 * d / w); const x = cv.getContext('2d'); x.fillStyle = farbe; x.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${80 + Math.random() * 40},${60 + Math.random() * 30},30,${Math.random() * .1})`; x.fillRect(Math.random() * cv.width, Math.random() * cv.height, 2 + Math.random() * 30, 1 + Math.random() * 2); }
  x.fillStyle = 'rgba(20,22,60,.92)'; x.font = `${px}px Caveat, cursive`; x.textAlign = 'center'; const words = text.split(' '); let line = '', y = cv.height * .42, ls = [];
  for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (x.measureText(t).width > cv.width * .86 && line) { ls.push(line); line = wd; } else line = t; } ls.push(line); ls.forEach((l, i) => { x.save(); x.translate(cv.width / 2, y + i * px * .95); x.rotate(-.02 + i * .012); x.fillText(l, 0, 0); x.restore(); });
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; const side = new T.MeshStandardMaterial({ color: 0xa08a64, roughness: .95 }), top = new T.MeshStandardMaterial({ map: t, roughness: .95 });
  const g = new T.Group(), body = new T.Mesh(new T.BoxGeometry(w * .985, h * .75, d * .985), side), lid = new T.Mesh(new T.BoxGeometry(w, h * .3, d), [side, side, top, side, side, side]); body.position.y = h * .375; lid.position.y = h * .85; g.add(body, lid);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.userData.noCol = true; return g; }
// Streichholzschachtel (6 × 4 × 1,5 cm): Ursprung Mitte Boden
function bu_streichholz() { const T = THREE, cv = document.createElement('canvas'); cv.width = 192; cv.height = 128; const x = cv.getContext('2d'); x.fillStyle = '#d8b030'; x.fillRect(0, 0, 192, 128); x.fillStyle = '#a02018'; x.fillRect(0, 0, 192, 30); x.fillStyle = '#1a1a1a'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('ZÜNDHÖLZER', 96, 80); x.font = '16px Arial'; x.fillText('Sicherheits-Streichhölzer', 96, 108);
  const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; const side = new T.MeshStandardMaterial({ color: 0x8a6a40, roughness: .9 }), m = new T.Mesh(new T.BoxGeometry(.06, .015, .04), [side, side, new T.MeshStandardMaterial({ map: t, roughness: .8 }), side, side, side]); m.position.y = .0075; const g = new T.Group(); g.add(m); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData.noCol = true; return g; }
// Taschentuch (zerknittertes Stoffquadrat) mit Kuli-Schrift, darin ein Milchzahn: Ursprung Mitte Unterseite
function bu_taschentuch(text) { const T = THREE, cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d'); x.fillStyle = '#ece8dc'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(160,150,130,.5)'; x.lineWidth = 6; x.strokeRect(10, 10, 236, 236); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(150,130,100,${Math.random() * .08})`; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 256, 8 + Math.random() * 30, 0, 7); x.fill(); }
  x.fillStyle = 'rgba(24,30,120,.9)'; x.font = '40px Caveat, cursive'; x.textAlign = 'center'; x.save(); x.translate(128, 190); x.rotate(-.06); x.fillText(text, 0, 0); x.restore(); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  const g = new T.PlaneGeometry(.12, .12, 12, 12), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const u = P.getX(i), v = P.getY(i); P.setZ(i, .004 + Math.sin(u * 55 + v * 20) * .0035 + Math.sin(v * 70 - u * 15) * .003 + Math.exp(-((u + .01) ** 2 + (v - .035) ** 2) / .0004) * .006); } g.rotateX(-PI / 2); g.computeVertexNormals();
  const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: t, roughness: 1, side: T.DoubleSide })), zahn = new T.Mesh(new T.SphereGeometry(.0042, 10, 8), new T.MeshStandardMaterial({ color: 0xf0ecdc, roughness: .35 })); zahn.scale.set(1, .85, 1.1); zahn.position.set(-.01, .0092, -.035);
  const o = new T.Group(); o.add(m, zahn); o.traverse(q => { if (q.isMesh) { q.castShadow = true; q.receiveShadow = true; } }); o.userData.noCol = true; return o; }
// kleines Papieretikett fürs Einmachglas (Jahreszahl in Kuli)
function bu_etikett(text, leer) { const T = THREE, cv = document.createElement('canvas'); cv.width = 256; cv.height = 160; const x = cv.getContext('2d'); x.fillStyle = leer ? '#efe9d6' : '#e2d8bc'; x.fillRect(0, 0, 256, 160); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(110,90,50,${Math.random() * .12})`; x.beginPath(); x.arc(Math.random() * 256, Math.random() * 160, 4 + Math.random() * 20, 0, 7); x.fill(); }
  x.strokeStyle = 'rgba(70,50,30,.4)'; x.lineWidth = 3; x.strokeRect(6, 6, 244, 148); x.fillStyle = 'rgba(22,28,100,.92)'; x.font = '86px Caveat, cursive'; x.textAlign = 'center'; x.save(); x.translate(128, 110); x.rotate(-.04); x.fillText(text, 0, 0); x.restore(); const t = new T.CanvasTexture(cv); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
  const m = new T.Mesh(new T.PlaneGeometry(.075, .047), new T.MeshStandardMaterial({ map: t, roughness: .9, polygonOffset: true, polygonOffsetFactor: -3 })); m.userData.noCol = true; return m; }
// glatte Kiesel (Scan ‚boulder‘, auf Einheitsgröße normiert, Unterkante 0)
function bu_kieselTeile() { return bu_S.kp || (bu_S.kp = msBake('../boulder').then(parts => { const bb = new THREE.Box3(); parts.forEach(p => { p.geo = p.geo.clone(); p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); });
  const s = bb.getSize(new THREE.Vector3()), k = 1 / Math.max(s.x, s.y, s.z), c = bb.getCenter(new THREE.Vector3()); parts.forEach(p => { p.geo.translate(-c.x, -bb.min.y, -c.z); p.geo.scale(k, k, k); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); }); return parts; }).catch(e => { console.warn('basis_umsetzung: Kiesel', e); return null; })); }
// Kiesel setzen: list = [[x, y, z, Größe(m), ry, Höhenanteil]]; par = Gruppe (sonst Szene) – ein Instanzsatz je Modellteil
async function bu_kiesel(list, par, tint) { const P = await bu_kieselTeile(); if (!P || !list.length) return []; const q = new THREE.Quaternion(), e = new THREE.Euler();
  const mats = list.map(([x, y, z, s, ry = 0, fl = .62]) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.setFromEuler(e.set(0, ry, 0)), new THREE.Vector3(s * (1 + .2 * Math.sin(x * 91 + z * 17)), s * fl, s * (1 - .15 * Math.cos(x * 53 + z * 29)))));
  return P.map(p => { let mt = p.mat; if (tint !== undefined) { mt = mt.clone(); mt.color.multiply(new THREE.Color(tint)); } const im = new THREE.InstancedMesh(p.geo, mt, mats.length); mats.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); (par || scene).add(im); return im; }); }

async function ausbau_nord_build() {
  const N = ausbau_nord, R = ausbau_nord_rng(1312), r = (a, b) => a + R() * (b - a);
  const T0 = performance.now();
  // ---------------------------------------------------------------- Modelle parallel laden
  const kidSpec = f => ({ '*': f });
  const [chapelM, lampM, madreM, crossStoneM, crossIronM, fenceM, tombM, collM, lanternM, candlesM, slideM, merryM, swingM, toysM, signM,
    grave1P, grave2P, gwP, wall1P, wall2P, benchP, tree1P, tree3P, grass1P, grass2P, elderP, raspP, bushP, boulderP, stopS, giraffeS, teddyS, psignP, lattP] = await Promise.all([
    msFBX('chapel', 'model.fbx', Object.fromEntries(['u1_v1', 'u2_v1', 'u3_v1', 'u1_v2', 'u2_v2'].map(k => ['kaplicka_' + k, { b: 'kaplicka_' + k + '.jpg', rough: .92 }]))),
    msFBX('../lamp', 'model.fbx', kidSpec({ b: 'color.jpg', n: 'normal.jpg', rough: .55, metal: .7 })),
    msFBX('madre', 'model.fbx', kidSpec({ b: 'madrestatue_Color_4k.jpg', n: 'MadeStatue_normal_4k.jpg', ao: 'madrestatue_AO_4ks.jpg', color: 0xc8c4bc })),
    msFBX('cross_concil', 'model.fbx', { material0: { b: 'chlumec-cross.jpg' }, material1: { b: 'chlumec-cross1.jpg' } }),
    msFBX('cross_field', 'model.fbx', kidSpec({ color: 0x1b1a1a, rough: .55, metal: .75 })),
    msFBX('ironfence_cc0', 'model.fbx', kidSpec({ b: 'IronFenceAlbedo.jpg', n: 'IronFenceNormal.jpg', r: 'IronFenceRough.jpg', m: 'IronFenceMetal.jpg', ao: 'IronFenceAO.jpg', color: 0x8a8580, ds: true })),
    msFBX('tomb_cc0', 'model.fbx', kidSpec({ b: 'TomstoneAlbedo.jpg', n: 'TomstoneNormal.jpg', r: 'TomstoneRough.jpg', ao: 'TomstoneAO.jpg' })),
    msFBX('grave_coll', 'model.fbx', kidSpec({ b: 'Gravestones_2K_Albedo.jpg', n: 'Gravestones_2K_Normal.jpg', r: 'Gravestones_2K_Roughness.jpg', ao: 'Gravestones_2K_AO.jpg', color: 0xa8a49c })),
    msFBX('lantern1', 'model.fbx', { lantern: { b: 'lantern_and_bulb_lantern_BaseColor.1001.png', n: 'lantern_and_bulb_lantern_Normal.1001.jpg', r: 'lantern_and_bulb_lantern_Roughness.1001.jpg', m: 'lantern_and_bulb_lantern_Metallic.1001.jpg' },
      buln: { b: 'lantern_and_bulb_buln_BaseColor.1001.png', n: 'lantern_and_bulb_buln_Normal.1001.jpg', r: 'lantern_and_bulb_buln_Roughness.1001.jpg', emissive: 0xffa24a } }),
    msFBX('candles', 'model.fbx', { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg', color: 0xd8cfbf },
      Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg', color: 0xd8cfbf },
      Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } }),
    msFBX('slide', 'model.fbx', kidSpec({ b: 'Playground Slide_color.jpg', n: 'Playground Slide_normal.jpg', r: 'Playground Slide_roughness.jpg', m: 'Playground Slide_metallic.jpg', color: 0xb8b8b8 })),
    msFBX('roundabout', 'model.fbx', kidSpec({ b: 'roundabout_Base_color.jpg', n: 'roundabout_Normal_OpenGL.jpg', r: 'roundabout_Roughness.jpg', m: 'roundabout_Metallic.jpg', color: 0x8c8884 })),
    msFBX('../swings', 'model.fbx', kidSpec({ b: 'color.jpg', n: 'normal.jpg', r: 'rough.jpg', m: 'metal.jpg', color: 0x9c9690 })),
    msFBX('toys_old', 'model.fbx', kidSpec({ b: 'T_Toys_BaseColor.jpg', n: 'T_Toys_Normal.jpg', r: 'T_Toys_ORM.jpg', ao: 'T_Toys_ORM.jpg', color: 0x9a948c })),
    msFBX('roadsigns', 'model.fbx', kidSpec({ b: 'road_sign_pack_MAT_RoadSign_BaseColor.jpg', n: 'road_sign_pack_MAT_RoadSign_Normal.jpg', r: 'road_sign_pack_MAT_RoadSign_Roughness.jpg', m: 'road_sign_pack_MAT_RoadSign_Metallic.jpg' })),
    msBake('grave1'), msBake('grave2'), msBake('grave_weathered', 'model.glb'), msBake('stonewall1'), msBake('stonewall2'), msBake('../bench'),
    msBake('deadtree1'), msBake('deadtree3'), msBake('wildgrass1'), msBake('wildgrass2'), msBake('elderberry'), msBake('raspberry'), msBake('../deadshrubs'), msBake('../boulder'),
    msModel('busstop2', 'model.glb'), msModel('giraffe'), msModel('teddy_scan', 'model.glb'), msBake('parksign'), msBake('ironfence_ms'),
  ]);
  const tLoad = performance.now() - T0;

  // ---------------------------------------------------------------- Platz schaffen: alter Grenzgürtel im neuen Viertel, Lücke für den Kirchweg
  {
    const P = new THREE.Vector3(), m4 = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
    const lane = (x, z) => x > -10.8 && x < -3.2 && z > 5 && z < 60, district = (x, z) => x > -83 && x < 63 && z > 33.6 && z < 104;
    const cut = (im, test) => { let ch = false; for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m4); P.setFromMatrixPosition(m4); if (test(P.x, P.z)) { im.setMatrixAt(i, zero); ch = true; } } if (ch) { im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); } };
    for (const im of MS.trees || []) cut(im, (x, z) => lane(x, z) || district(x, z));
    scene.children.forEach(o => {
      if (!o.isInstancedMesh) return; const mt = [].concat(o.material)[0] || {};
      if (/xh0rah1iy/.test(mt.name || '')) cut(o, (x, z) => Math.abs(z - 32.4) < .5 && x > -9.45 && x < -3.3); // Weidezaun: Lücke für den Kirchweg
      else if (o.count === 6000 && mt.alphaTest > .3 && mt.alphaTest < .45) cut(o, (x, z) => x > -9 && x < -5 && z > 5.6 && z < 33); // Grasbüschel nicht auf dem Pflaster
    });
    scene.children.forEach(o => { if (o.isGroup && Math.abs(o.position.x + 7) < 3.2 && o.position.z > 6 && o.position.z < 33) { let dead = false; o.traverse(m => { if (m.isMesh && /vdknafgha/.test([].concat(m.material)[0]?.name || '')) dead = true; }); if (dead) o.visible = false; } });
    for (let i = treeSpots.length - 1; i >= 0; i--) if (lane(treeSpots[i][0], treeSpots[i][1])) treeSpots.splice(i, 1);
    msDropCols(-80.01, 80.01, 31.99, 33.01); // alte Nordgrenze (Kiste): Der Weidezaun selbst bleibt sichtbar und hält durch seine echte Form auf
  }

  // ---------------------------------------------------------------- Böden: Gasse, Straße, Gehwege, Wege
  const pave = ausbau_nord_surf('pavement', 0xa9a49a), gravel = ausbau_nord_surf('gravel', 0x9a948a), leaves = ausbau_nord_surf('../leaves', 0x8a8078, 1.2), dirt = ausbau_nord_surf('wet_asphalt', 0x6d6256, 1.3), tiles = ausbau_nord_surf('sidewalk_tiles', 0xa0a0a0), leavesW = boden_weichMat(leaves);
  plane(3.1, 48.9, -7, .024, 30.45, pave);                                    // Kirchweg-Gasse z 6 … 54.9
  plane(140, 7, -10, .02, 60, M.asphalt);                                     // Am Kirchberg
  for (let i = 0; i < 4; i++) { const cx = -80 + 17.5 + i * 35;               // Gehwege (Segmente < 80 m, damit sie begehbare Stufen sind)
    box(35, .14, 2, cx, .07, 55.5, M.sidewalk, { cast: false }); box(35, .16, .16, cx, .08, 56.45, M.sidewalk, { cast: false });
    box(35, .14, 2, cx, .07, 64.5, M.sidewalk, { cast: false }); box(35, .16, .16, cx, .08, 63.55, M.sidewalk, { cast: false }); }
  plane(3.4, 14.5, -52.5, .03, 73.9, gravel);                                 // Friedhof: Hauptweg vom Tor zur Kapelle
  plane(39, 2.2, -52.5, .031, 76.2, gravel);                                  // Querweg
  plane(2.2, 3, 27, .026, 65.9, gravel);                                      // Zugang Spielplatz (liegt unter dem Gehweg-Rand)
  plane(6.2, 3.2, 10, .022, 53.1, tiles);                                     // Boden der Haltestelle

  // Laternen im Stil des Ortes (Licht, Lichtkegel, Pool aus lamp(); sichtbar ist das Laternenmodell)
  {
    lampM.updateMatrixWorld(true); const lb = new THREE.Box3().setFromObject(lampM), ls = 5.45 / (lb.max.y - lb.min.y);
    for (const [x, z, ax, az, mode] of [[-4.45, 17, -1, 0, 'on'], [-9.55, 33.5, 1, 0, 'flicker'], [-4.45, 47.5, -1, 0, 'on'],
      [-70, 54.75, 0, 1, 'on'], [-50, 65.25, 0, -1, 'flicker'], [-30, 54.75, 0, 1, 'on'], [-10, 65.25, 0, -1, 'on'], [16, 54.75, 0, 1, 'on'], [31, 65.25, 0, -1, 'flicker'], [50, 54.75, 0, 1, 'off']]) {
      const L = lamp(x, z, ax, az, mode); L.nord = true;
      L.g.children.forEach(c => { if (c !== L.bulb && c !== L.cone) c.visible = false; });
      const m = lampM.clone(); m.scale.multiplyScalar(ls); m.position.y = -lb.min.y * ls; m.rotation.y = Math.atan2(-az, ax); L.g.add(m);
      m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      L.g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(m);
      if (ax) { m.position.x += ax > 0 ? -.08 - (bb.min.x - x) : .08 - (bb.max.x - x); m.position.z -= (bb.min.z + bb.max.z) / 2 - z; }
      else { m.position.z += az > 0 ? -.08 - (bb.min.z - z) : .08 - (bb.max.z - z); m.position.x -= (bb.min.x + bb.max.x) / 2 - x; }
      if (x === 50) N.deadLamp = L;
    }
  }

  // ---------------------------------------------------------------- Häuser (Südseite, Haustür zur Straße)
  const KNOCK = {
    11: ['Hinter der Tür läuft ein Radio. Ein Kinderlied, immer dieselbe Zeile.', 'Niemand öffnet. Aber drinnen wird leise die Kette vorgelegt.'],
    13: ['Die Praxis ist seit Jahren zu. Die Tür ist zugenagelt. Das Emailschild daneben ist blank geputzt.'],
    17: ['Eine Frauenstimme, direkt hinter dem Holz: „Nicht jetzt. Es ist noch nicht drei Uhr dreizehn.“', 'Du klopfst. Im Haus klopft es zurück – von unten. Aus dem Keller.', 'Nichts. Nur dein eigenes Klopfen, das im Haus nachhallt. Zu lange.'],
  };
  for (const h of [
    { n: 11, x: -60, z: 45, facing: 1, w: 11, d: 9, tint: 0x747c86, lit: [1], chimney: true, porch: true, shutters: M.dark },
    { n: 13, x: -38, z: 45.5, facing: 1, w: 10, d: 9, brick: true, lit: [], boarded: [0, 1, 6, 7, 12], chimney: true },
    { n: 15, x: 26, z: 45, facing: 1, w: 11, d: 9, tint: 0x8a8274, lit: [0, 4], porch: true, porchLight: true },
    { n: 17, x: 46, z: 45, facing: 1, w: 10, d: 9, tint: 0x66706c, floors: 1, H: 3.4, lit: [0], garage: 1 }]) {
    makeHouse(h);
    numberSign({ 11: 1, 13: 5, 15: 3 }[h.n] || h.n, h.x + .95, 2.2, h.z + h.d / 2 + .08, 0); // Am Kirchberg 1 (Pfarrhaus), 5 (Praxis Seiler), 3 (Gisela) – Fassung 3
    plane(1.4, 5, h.x, .027, h.z + h.d / 2 + 2.5, pave);
    const di = box(1.2, 2.3, .35, h.x, 1.6, h.z + h.d / 2 + .15, hidden, { cast: false }); let k = 0;
    if (h.n === 11 || h.n === 15) { uninteract(di); continue; } // kirchberg.js: Pfarrhaus / Giselas Küchenfenster
    interact(di, h.n === 13 ? 'Tür' : 'Klopfen', () => { if (h.n !== 13) Audio.knock(h.x, 1.3, h.z + h.d / 2 + .15); toast(KNOCK[h.n][k++ % KNOCK[h.n].length], 4200); }); // STORY-HOOK: Nachbarn am Kirchberg
  }

  // ---------------------------------------------------------------- Friedhof: Mauern, Zaun, Tor
  const blocked = [];
  const inst = (parts, list, o) => list.length ? msInst(parts, list, o) : [];
  {
    const W1 = [], W2 = [], F = [], w1len = 3.98, w2len = 3.1;
    const wall = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), a = -Math.atan2(z1 - z0, x1 - x0); let s = 0; const segs = [];
      while (s < L - .5) { const one = R() < .55, len = one ? w1len : w2len; segs.push([one, len]); s += len; }
      const k = L / s; let p = 0;
      for (const [one, len] of segs) { const c = (p + len * k / 2) / L, x = x0 + (x1 - x0) * c, z = z0 + (z1 - z0) * c;
        (one ? W1 : W2).push(msM4(x, -.02, z, a + r(-.015, .015), new THREE.Vector3(k * 1.04, r(.95, 1.12), r(.9, 1.1)))); p += len * k; } };
    wall(-73, 66.9, -54.4, 66.9); wall(-50.6, 66.9, -32, 66.9); wall(-73, 67.2, -73, 94);  // vorne (mit Tor), Westseite
    inst(wall1P, W1, {}); inst(wall2P, W2, {});
    // Eisenzaun Ost + hinten
    const fg = ausbau_nord_fit(fenceM, 1.45); const fb = new THREE.Box3().setFromObject(fg), fw = fb.max.x - fb.min.x; const fp = ausbau_nord_parts(fg);
    const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / fw)), a = -Math.atan2(z1 - z0, x1 - x0), k = L / (n * fw);
      for (let i = 0; i < n; i++) { const c = (i + .5) / n; F.push(msM4(x0 + (x1 - x0) * c, -.03, z0 + (z1 - z0) * c, a, new THREE.Vector3(k * 1.01, r(.97, 1.03), 1), 0, r(-.02, .02))); } };
    fence(-72.8, 94, -32.2, 94); fence(-32, 67.2, -32, 93.8);
    inst(fp, F, {});
    // Tor: zwei Eisenflügel, nach innen aufgeschwungen
    const gp = ausbau_nord_parts(ausbau_nord_fit(fenceM.clone(), 1.3));
    const gb = new THREE.Box3(); gp.forEach(p => { p.geo.computeBoundingBox(); gb.union(p.geo.boundingBox); }); const gw = gb.max.x - gb.min.x, gsx = 1.75 / gw;
    const G = []; for (const [hx, s] of [[-54.35, 1], [-50.65, -1]]) { // Scharnier an der Mauer, Flügel schwingt nach innen (+z)
      const m = new THREE.Matrix4().compose(new THREE.Vector3(hx, 0, 66.95), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, s > 0 ? -1.37 : PI + 1.37, 0)), new THREE.Vector3(gsx, 1, 1)).multiply(new THREE.Matrix4().makeTranslation(-gb.min.x, 0, 0));
      G.push(m); }
    inst(gp, G, {});
    // Friedhofstafel am Tor (Rahmen eines Scan-Schilds, Aushang als Papier darauf)
    const note = ausbau_nord_paper(.58, .44, (x, w, h) => { x.fillStyle = '#d9d1bd'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d1d1d'; x.textAlign = 'center';
      x.font = 'bold 34px Georgia'; x.fillText('FRIEDHOF', w / 2, 46); x.font = '20px Georgia'; x.fillText('LOST EYENGLESS · AM KIRCHBERG', w / 2, 74);
      x.fillRect(40, 88, w - 80, 2); x.font = '18px Georgia'; x.textAlign = 'left'; ['Das Tor wird bei Einbruch der', 'Dunkelheit geschlossen.', '', 'Gedenkfeld „Sommer 2009“', 'rechts, bei der Madonna.'].forEach((l, i) => x.fillText(l, 44, 118 + i * 24));
      ausbau_nord_hand(x, 'Zayn Roxy Lucy Mike Dina Heidi Luke', 44, h - 26, 24, '#27305a'); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(60,50,30,${R() * .12})`; x.fillRect(R() * w, R() * h, 2, 2); } });
    ausbau_nord_board(psignP, -48.9, 66.35, PI, note);
    const hit = box(.8, .7, .25, -48.9, 1.5, 66.35, hidden, { cast: false });
    interact(hit, 'Aushang lesen', () => openNote('Friedhof Lost Eyengless · Aushang', '<b>FRIEDHOFSORDNUNG</b>\nDas Tor wird bei Einbruch der Dunkelheit geschlossen.\nGrablichter bitte nicht unbeaufsichtigt brennen lassen.\n\n<b>GEDENKFELD „SOMMER 2009“</b>\nRechts hinter dem Tor, bei der Madonna.\nDie Gemeinde gedenkt ihrer Kinder.\n\nDarunter, mit Kugelschreiber, sieben Namen. Jemand hat sie so oft nachgezogen, dass das Papier durchgerieben ist:\n<span class="hand">Zayn · Roxy · Lucy · Mike · Dina · Heidi · Luke</span>\n\n<i>Die Kinder kamen zurück. Das weiß jeder im Ort. Warum also ein Gedenkfeld?</i>', 'nord_aushang', () => ausbau_nord_quest('names'))); // STORY-HOOK: Gedenkfeld für Kinder, die zurückkamen
    blocked.push([-73.5, -31.5, 66.3, 67.6], [-73.6, -72.4, 66.3, 94.6], [-73.5, -31.5, 93.4, 94.6], [-32.6, -31.4, 66.3, 94.6]);
  }

  // ---------------------------------------------------------------- Kapelle (Foto-Scan, 1866) mit Kerzenlicht hinter dem Gitter
  {
    chapelM.scale.setScalar(.01); let cm = null; chapelM.traverse(o => { if (o.isMesh && !cm) cm = o; });
    ausbau_nord_regroup(cm.geometry);                       // 445 000 Materialgruppen → 5 Zeichenaufrufe
    chapelM.updateMatrixWorld(true); chapelM.quaternion.premultiply(ausbau_nord_level(cm)); chapelM.updateMatrixWorld(true); // Scan lotrecht stellen (Wände senkrecht)
    const cb = new THREE.Box3().setFromObject(chapelM), cc = cb.getCenter(new THREE.Vector3());
    const gy = ausbau_nord_groundTop(cm, .35);              // Oberkante des mitgescannten Bodenstücks: großteils knapp unter der Wiese
    const g = new THREE.Group(); chapelM.position.set(-cc.x, -gy, -cc.z); g.add(chapelM); g.position.set(-52.5, 0, 86.6); g.rotation.y = PI; scene.add(g);
    N.chapelInfo = { gy: +gy.toFixed(3), size: cb.getSize(new THREE.Vector3()).toArray().map(v => +v.toFixed(2)) };
    chapelM.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    N.chapel = g; blocked.push([-60, -45, 79.3, 94]);
  }

  // ---------------------------------------------------------------- Gräber
  const graveMats = { g1: [], g2: [], tomb: [], c1: [], c2: [], c3: [], c4: [], gw: [] };
  const tombG = ausbau_nord_fit(tombM, 1); const tombP = ausbau_nord_parts(tombG);                  // Grundform 1 m hoch, Instanzen skalieren
  const collP = n => ausbau_nord_parts(ausbau_nord_piece(collM, n, .01));
  const coll = { c1: collP('Grave1'), c2: collP('Grave2'), c3: collP('Grave3'), c4: collP('Grave4') };
  const bedGeos = [], candleSpots = [];
  const addGrave = (type, x, z, ry, s = 1, bed = true) => {
    const list = graveMats[type]; if (!list) return;
    const sc = type === 'tomb' ? s : s; list.push(msM4(x, -.02, z, ry, sc, r(-.02, .02), r(-.025, .025)));
    blocked.push([x - .7, x + .7, z - 1.4, z + .5]);
    if (bed && type !== 'c1') { const b = new THREE.PlaneGeometry(.9, 1.7); boden_weich(b, .9, 1.7); planeUV(b, .9, 1.7, 2); b.rotateX(-PI / 2); b.rotateY(ry); b.translate(x - Math.sin(ry) * .95, .012 + R() * .004, z - Math.cos(ry) * .95); bedGeos.push(b); }
    if (R() < .38) candleSpots.push([x - Math.sin(ry) * .3 + r(-.25, .25), z - Math.cos(ry) * .3]);
  };
  // Besondere Gräber (Positionen fest, Texte weiter unten)
  const SPECIAL = [
    { id: 'kranz', type: 'g1', x: -66.3, z: 85.4, s: .78, title: 'Grabstein · Peter Kranz', html: '<b>PETER KRANZ</b>\n1965 – 1992\n„Heimgegangen in den Nebel“\n\nDas Grab ist nicht eingesunken wie die anderen. Die Erde darüber ist fest und glatt – als läge niemand darin.\n\nAuf dem Sockel, frisch mit Kreide: <span class="hand">1975 · 1992 · 2009 · 2026</span>' }, // STORY-HOOK: Peter Kranz (Vegas-Brief)
    { id: 'mira', type: 'gw', x: -63.2, z: 91.4, s: .82, title: 'Der älteste Stein', html: 'Der älteste Stein auf dem Friedhof, an der Kapellenmauer. Die Schrift ist fast ganz abgeschliffen.\n\nDu kannst nur noch lesen:\n<b>„… IRA · HAUSFRAU DES RITTERS …“</b>\nEin Geburtsjahr, das mit <b>13</b> beginnt. Das Sterbejahr ist nie eingemeißelt worden.\n\nDarunter, jünger: <i>„Sie ist nicht hier begraben. Sie kommt noch.“</i>' }, // STORY-HOOK: Mira = Justins Frau, Retterin aus der Zukunft (spätere Kapitel)
    { id: 'unbekannt', type: 'tomb', x: -70.6, z: 88.4, s: .82, title: 'Grabstein · ohne Namen', html: '<b>UNBEKANNTES KIND</b>\nzurückgekommen im August 1958\nheimgegangen im November 1961\n\nKein Name, nur eine Nummer, eingemeißelt wie in eine Akte: <b>08</b>.\n\nAuf der Rückseite, klein: ein Auge.' }, // STORY-HOOK: das achte Kind, Akte 08
    { id: 'brandt', type: 'g2', x: -61.5, z: 72.6, s: 1.02, title: 'Grabstein · Familie Brandt', html: '<b>FAMILIE BRANDT</b>\n\nEuer Familiengrab. Mamas Name steht darauf, ihre Jahreszahlen. Du warst nicht auf der Beerdigung. Du weißt nicht mehr, warum.\n\nDarunter ist Platz gelassen. Für zwei weitere Namen.\n\nIn das Moos hat jemand mit dem Finger geschrieben: <span class="hand">LUCY</span>. Den zweiten Platz hat er freigelassen.' }, // STORY-HOOK: Lukes Mutter, Lucy
  ];
  for (const S of SPECIAL) { addGrave(S.type, S.x, S.z, 0, S.s);
    const hit = box(1, 1.3, .8, S.x, .7, S.z - .2, hidden, { cast: false });
    interact(hit, 'Grabstein lesen', () => S.id === 'kranz' && kapAb(4) ? ausbau_nord_peter() : openNote(S.title, S.html, 'nord_grab_' + S.id)); }
  // feste Dinge zwischen den Gräbern (Bäume, Eisenkreuz, Bänke, Grabgitter) – dort entsteht kein Grab
  const occ = [[-71.8, -69.2, 91, 93.6], [-35.6, -32.6, 91.2, 94], [-71.4, -69, 67.4, 69.9], [-36.2, -33.8, 67.4, 69.9], [-67.4, -65, 76.9, 80.2], [-59.4, -57.2, 77.2, 78.4], [-47.8, -45.6, 77.2, 78.4], [-58.6, -55.8, 68.4, 71.9]];
  for (const S of SPECIAL) occ.push([S.x - 1.1, S.x + 1.1, S.z - 1.9, S.z + .7]);
  const free = (x, z) => !occ.some(([a, b, c, d]) => x + .55 > a && x - .55 < b && z + .4 > c && z - 1.8 < d);
  const pick = () => { const q = R(); return q < .26 ? 'g1' : q < .5 ? 'g2' : q < .7 ? 'tomb' : q < .84 ? 'c3' : q < .95 ? 'c2' : 'c1'; };
  const gen = (x, z) => { const gx = x + r(-.25, .25), gz = z + r(-.2, .2); if (!free(gx, gz) || R() < .1) return; const t = pick();
    addGrave(t, gx, gz, r(-.06, .06), t === 'tomb' ? r(.8, 1.02) : t === 'g1' ? r(.66, .8) : r(.9, 1.05)); occ.push([gx - .6, gx + .6, gz - 1.8, gz + .4]); };
  for (const z of [69.8, 72.6, 79.5, 82.4, 85.4, 88.4, 91.4]) for (let x = -71; x <= -56.2; x += 2.4) { if (z > 78.5 && x > -61.8) continue; if (Math.abs(x + 52.5) < 2.8) continue; gen(x, z); }
  for (const z of [79.5, 82.4, 85.4, 88.4, 91.4]) for (let x = -43.6; x <= -33.5; x += 2.4) gen(x, z);
  addGrave('gw', -34.2, 89.3, .1, .8);
  // Grab mit Gusseisen-Einfassung
  addGrave('g2', -57.2, 71.4, 0, .95);
  const graveInst = [...inst(grave1P, graveMats.g1, {}), ...inst(grave2P, graveMats.g2, {}), ...inst(gwP, graveMats.gw, {}), ...inst(tombP, graveMats.tomb, {})];
  for (const k of ['c1', 'c2', 'c3', 'c4']) graveInst.push(...inst(coll[k], graveMats[k], {}));
  // Grabbeete (flache Erde/Laub-Flächen, zusammengefasst)
  if (bedGeos.length) { const m = new THREE.Mesh(mergeGeometries(bedGeos), leavesW); m.receiveShadow = true; scene.add(m); }

  // ---- Das Gedenkfeld: sieben Kindergräber, eines offen (Aufgabe „Sieben Namen“ und „Ein Licht für jeden“)
  const KIDS = [
    { n: 'Zayn', t: '<b>ZAYN WENDT</b>\n† 28. Juli 2009\n\nDer Einzige, der offiziell nie zurückkam. Auf dem Grab liegen frische Astern.\nIns Moos am Sockel sind Striche gekratzt. Reihe um Reihe. Gezählt.' },          // STORY-HOOK: Hilde zählt
    { n: 'Roxy', t: '<b>ROXY</b>\n† 28. Juli 2009\n\nRoxy kam zurück. Das weiß jeder im Ort. Trotzdem steht ihr Name hier – und das Moos über den Buchstaben ist siebzehn Jahre alt.' },
    { n: 'Lucy', t: '<b>LUCY</b>\n† 28. Juli 2009\n\nDeine Schwester.\nDer Stein ist alt, aber jemand hat ihn sauber gewischt. Erst vor Kurzem – im Moos sind noch die Spuren von Fingern.' }, // STORY-HOOK: Lucy
    { n: 'Mike', t: '<b>MIKE</b>\n† 28. Juli 2009\n\nDarunter, viel später eingemeißelt und schief: <b>2026</b>.\nAls hätte man ihn ein zweites Mal begraben.' },
    { n: 'Dina', t: '<b>DINA</b>\n† 28. Juli 2009\n\nUm den Namen hat jemand mit Kreide Kreise gemalt. Viele. Einen in den anderen, immer kleiner, bis nur noch ein Punkt übrig ist.' },
    { n: 'Heidi', t: '<b>HEIDI</b>\n† 28. Juli 2009\n\nAn den Stein gelehnt: eine Postkarte ohne Absender, aufgeweicht vom Regen.\n<span class="hand">„Sind sie wieder da?“</span>' },
    { n: 'Luke', open: true, t: '<b>LUKE</b>\n† 28. Juli 2009\n\nDein Name.\nDer Stein ist neu, die Kanten scharf, als wäre er gestern gemeißelt worden.\n\nDas Grab davor ist offen. Frisch ausgehoben. Leer.\nDie Grube ist genau so lang wie du.', t1: '<b>LUKE</b>\n† 28. Juli 2009\n\nDein Name.\nDer Stein ist neu, die Kanten scharf, als wäre er gestern gemeißelt worden.\n\nDaneben eine grüne Friedhofsplane, mit Steinen beschwert, ein Spaten. Die Plane liegt straff. Darunter ist es tiefer als der Boden.' }, // STORY-HOOK: das leere Grab – Luke / der Ersatz
  ];
  {
    const tk = [];
    let faceZ = 0; for (const p of tombP) { const a = p.geo.attributes.position; for (let j = 0; j < a.count; j++) if (a.getY(j) > .5) faceZ = Math.min(faceZ, a.getZ(j)); } // Vorderseite der Platte
    KIDS.forEach((K, i) => {
      const x = -47 + i * 1.65 + (i === 6 ? .15 : r(-.08, .08)), z = 72.95 + (i === 6 ? 0 : r(-.07, .07)), ry = i === 6 ? 0 : r(-.05, .05), sc = i === 6 ? .74 : r(.66, .72);
      K.x = x; K.z = z; tk.push(msM4(x, -.03, z, ry, sc, 0, 0));
      // Name auf dem Stein (vorne, Richtung Süden)
      const plate = ausbau_nord_paper(.3, .19, (x2, w, h) => { x2.clearRect(0, 0, w, h); x2.textAlign = 'center';
        x2.fillStyle = i === 6 ? 'rgba(20,18,16,.85)' : 'rgba(25,22,18,.62)'; x2.font = `bold ${K.n.length > 5 ? 64 : 76}px Georgia`; x2.fillText(K.n.toUpperCase(), w / 2, h * .48);
        x2.font = '34px Georgia'; x2.fillText('† 28. 7. 2009', w / 2, h * .82); }, 384);
      plate.material.roughness = 1; plate.material.transparent = true; plate.material.depthWrite = false;
      plate.position.set(x + Math.sin(ry) * faceZ * sc, .45 * sc / .7, z + Math.cos(ry) * faceZ * sc - .006); plate.rotation.y = PI + ry; K.plate = plate; scene.add(plate);
      if (!K.open) { const b = new THREE.PlaneGeometry(.72, 1.25); boden_weich(b, .72, 1.25); planeUV(b, .72, 1.25, 2); b.rotateX(-PI / 2); b.translate(x, .014, z - .78); const bm = new THREE.Mesh(b, leavesW); bm.receiveShadow = true; scene.add(bm); }
      K.hit = box(.62, .62, .3, x, .46, z, hidden, { cast: false });
      interact(K.hit, 'Grabstein lesen', () => ausbau_nord_readKid(i));
      blocked.push([x - .6, x + .6, z - 1.7, z + .4]);
    });
    // neuer, heller Stein für Luke
    const kidP = tombP.map(p => ({ geo: p.geo, mat: p.mat })), kaiMat = tombP.map(p => { const m = p.mat.clone(); m.color = new THREE.Color(0xd8d4cc); return { geo: p.geo, mat: m }; });
    inst(kidP, tk.slice(0, 6), {}); inst(kaiMat, [tk[6]], {});
    { const x8 = KIDS[6].x + 2.02, z8 = 72.95; inst(kaiMat, [msM4(x8, -.03, z8, .02, .7, 0, 0)], {}); N.achter = { x: x8, z: z8 };      // der achte Stein: neu, glatt, ohne Namen („Sieben Namen. Acht Steine.“)
      const h8 = box(.62, .62, .3, x8, .46, z8, hidden, { cast: false }); interact(h8, 'Grabstein ansehen', () => toast('Ein achter Stein. Neu, glatt, ohne Namen. Kein Grab davor.', 4200)); blocked.push([x8 - .6, x8 + .6, z8 - 1.7, z8 + .4]); }
    N.kids = KIDS;
  }

  // ---- Basis-Umsetzung · Gedenkfeld und Gräber: was die Grabtexte behaupten, ist am Stein zu sehen (Astern, Kratzstriche im Moos, Kreidekreise, Postkarte, Meißelung)
  try {
    const stoneB = new THREE.Box3(); tombP.forEach(p => { p.geo.computeBoundingBox(); stoneB.union(p.geo.boundingBox); }); const stoneW = stoneB.max.x - stoneB.min.x, UP = new THREE.Vector3(0, 1, 0);
    const onStone = (i, w, h, draw, o = {}) => { const K = KIDS[i], m = bu_ritz(w, h, draw, o); m.position.copy(K.plate.position); m.quaternion.copy(K.plate.quaternion); m.translateZ(.007); m.translateX(o.dx || 0); m.translateY(o.dy || 0); scene.add(m); return m; };
    const mossProto = await bu_mod('w_mosspatch', 'model.glb', .5, 'max');
    const moos = (x, z, ry, k = 1) => { if (!mossProto) return null; const g = mossProto.clone(true); g.scale.multiplyScalar(k); g.position.set(x, .006, z); g.rotation.y = ry; g.traverse(o => { if (o.isMesh) { o.userData.noCol = true; o.castShadow = false; } }); scene.add(g); return g; };
    const flachBei = (x, z, w, h, draw, o = {}) => { const m = bu_ritz(w, h, draw, o); m.rotation.set(-PI / 2, 0, o.rz || 0, 'YXZ'); m.position.set(x, o.y ?? .05, z); scene.add(m); return m; };
    const zF = i => KIDS[i].plate.position.z;
    // Dina: Kreidekreise um den Namen, einer im anderen, immer kleiner, bis nur ein Punkt bleibt
    onStone(4, .5, .5, (C, B, W, H, ppm) => { const rm = Math.min(.22, stoneW * .69 / 2 - .03) * ppm, n = 9;
      for (let k = 0; k < n; k++) { const r = rm * Math.pow(1 - k / n, 1.25), cx = W / 2 + ritz_RN() * 4 + k * .6, cy = H / 2 + ritz_RN() * 4, pts = [];
        for (let a = 0; a < 25; a++) { const t = a / 24 * PI * 2 * 1.04 + k * .7; pts.push([cx + Math.cos(t) * r * (1 + ritz_RN() * .02), cy + Math.sin(t) * r * .88 * (1 + ritz_RN() * .02)]); } ritz_strich(C, null, pts, 22, 'kreide', ritz_R(.3, .6)); }
      C.fillStyle = 'rgba(240,238,230,.9)'; C.beginPath(); C.arc(W / 2, H / 2, 4, 0, 7); C.fill(); }, { ppm: 500, seed: 4, relief: false });
    // Mike: „2026“ viel später eingemeißelt, schief
    onStone(3, .34, .13, (C, B, W, H) => { ritz_zeile(C, B, '2026', W * .13, H * .76, H * .6, { stil: 'ritz', winkel: .08, alpha: 1, jit: 1.7 }); }, { ppm: 520, seed: 31, bump: 3.2, dy: -.17 });
    // Heidi: die aufgeweichte Postkarte ohne Absender, an den Stein gelehnt
    { const pc = ausbau_nord_paper(.148, .105, (x, w, h) => { x.fillStyle = '#d9d1b8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 14; i++) { const gx = Math.random() * w, gy = Math.random() * h, g = x.createRadialGradient(gx, gy, 0, gx, gy, 30 + Math.random() * 80); g.addColorStop(0, 'rgba(120,104,70,.28)'); g.addColorStop(1, 'rgba(120,104,70,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
        x.strokeStyle = 'rgba(60,50,40,.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(w * .56, 18); x.lineTo(w * .56, h - 18); x.stroke(); x.strokeRect(w - 74, 16, 52, 62); for (let k = 0; k < 4; k++) { x.beginPath(); x.moveTo(w * .62, h * .5 + k * 30); x.lineTo(w - 24, h * .5 + k * 30); x.stroke(); }
        ausbau_nord_hand(x, 'Sind sie', 28, 82, 44, 'rgba(34,40,92,.85)'); ausbau_nord_hand(x, 'wieder da?', 40, 132, 44, 'rgba(34,40,92,.8)');
        x.fillStyle = 'rgba(70,90,110,.22)'; for (let k = 0; k < 6; k++) { x.beginPath(); x.ellipse(Math.random() * w, Math.random() * h, 20 + Math.random() * 40, 6 + Math.random() * 14, Math.random() * 3, 0, 7); x.fill(); } }, 512);
      pc.material.alphaTest = .02; pc.material.roughness = .62; pc.geometry.dispose(); pc.geometry = new THREE.PlaneGeometry(.148, .105, 10, 6); { const P = pc.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const u = P.getX(i), v = P.getY(i); P.setZ(i, Math.sin(u * 38 + 1.3) * .0035 + Math.sin(v * 52) * .002 + Math.max(0, u - .045) * Math.max(0, v - .01) * .45); } pc.geometry.computeVertexNormals(); }
      const K = KIDS[5], ang = 1.18, L = .105; pc.userData.noCol = true; pc.position.set(K.x + .13, .014 + Math.sin(ang) * L / 2 + .002, zF(5) - Math.cos(ang) * L / 2 - .004); pc.rotation.set(-(PI / 2 - ang), PI - .18, .12, 'YXZ'); scene.add(pc); N.postkarte = pc; }
    // Zayn: frische Astern auf dem Grab; ins Moos am Sockel sind Striche gekratzt, Reihe um Reihe, gezählt
    { const Z = KIDS[0]; moos(Z.x - .04, zF(0) - .24, .4, 1);
      flachBei(Z.x - .04, zF(0) - .25, .5, .4, (C, B, W, H, ppm) => { let y = H * .17; for (let row = 0; row < 3; row++, y += H * .3) { let x = W * .08; for (let g = 0; g < 4 + (row === 2 ? -1 : 0); g++, x += W * .22) {
              for (let k = 0; k < 4; k++) ritz_strich(C, B, [[x + k * ppm * .017 + ritz_RN() * 1.5, y], [x + k * ppm * .017 + ritz_RN() * 2, y + ppm * .075 + ritz_RN() * 3]], 60, 'ritz', ritz_R(.75, 1)); ritz_strich(C, B, [[x - ppm * .01, y + ppm * .06], [x + ppm * .07, y + ppm * .01]], 60, 'ritz', ritz_R(.75, 1)); } } }, { ppm: 520, seed: 7, bump: 2.6, y: .06, rz: -.1 });
      scene.add(bu_strauss(Z.x + .17, .026, zF(0) - .72, -.1, 10, 1312)); }
    // Lucy: Spuren von Fingern im Moos (Wischspuren), frisch; Familie Brandt: LUCY mit dem Finger ins Moos geschrieben
    { const L = KIDS[2]; moos(L.x + .02, zF(2) - .24, 1.7, 1);
      flachBei(L.x + .02, zF(2) - .25, .46, .36, (C, B, W, H, ppm) => { for (let k = 0; k < 4; k++) { const x0 = W * (.2 + k * .17) + ritz_RN() * 3, pts = []; for (let t = 0; t <= 6; t++) pts.push([x0 + Math.sin(t * .9 + k) * ppm * .012, H * .72 - t * H * .1]); ritz_strich(C, B, pts, 150, 'ritz', ritz_R(.85, 1)); } }, { ppm: 480, seed: 11, bump: 3, y: .055 }); }
    const sp = SPECIAL.find(q => q.id === 'brandt'); if (sp) { const h0 = bu_strahl(graveInst, sp.x, .3, sp.z - 3, 0, 0, 1, 6), zf = h0 ? h0.p.z : sp.z - .12;
      moos(sp.x + .02, zf - .27, .9, 1.1); flachBei(sp.x + .02, zf - .27, .6, .3, (C, B, W, H) => { const sz = H * .55, w = ritz_breite('LUCY', sz); for (const dx of [0, 2.2]) { ritz_rs = 5150; ritz_zeile(C, B, 'LUCY', (W - w) / 2 + dx, H * .78, sz, { stil: 'ritz', jit: 1.6 }); } }, { ppm: 480, seed: 12, bump: 3, y: .058 }); }
    // Peter Kranz: frisch mit Kreide auf dem Sockel
    { const sp2 = SPECIAL.find(q => q.id === 'kranz'); let h0 = null; for (const y of [.14, .2, .26, .32]) { h0 = bu_strahl(graveInst, sp2.x, y, sp2.z - 3, 0, 0, 1, 6); if (h0) { h0.y = y; break; } }
      if (h0) { const m = bu_ritz(.5, .1, (C, B, W, H) => { const t = '1975  1992  2009  2026', sz = H * .56, w = ritz_breite(t, sz), k = Math.min(1, (W - 12) / w); ritz_zeile(C, null, t, (W - w * k) / 2, H * .72, sz * k, { stil: 'kreide', alpha: .92, winkel: -.012 }); }, { ppm: 520, seed: 1975, relief: false }); bu_an(m, h0.p, h0.n, UP, .006); m.position.y = h0.y; scene.add(m); } }
    // Unbekanntes Kind: „08“ eingemeißelt (vorn), auf der Rückseite ein Auge
    { const sp3 = SPECIAL.find(q => q.id === 'unbekannt'), f = bu_strahl(graveInst, sp3.x, .42, sp3.z - 3, 0, 0, 1, 6), b = bu_strahl(graveInst, sp3.x, .42, sp3.z + 3, 0, 0, -1, 6);
      if (f) { const m = bu_ritz(.3, .16, (C, B, W, H) => { const sz = H * .78, w = ritz_breite('08', sz); ritz_zeile(C, B, '08', (W - w) / 2, H * .88, sz, { stil: 'ritz', jit: .8 }); }, { ppm: 520, seed: 8, bump: 3.4 }); bu_an(m, f.p, f.n, UP, .006); scene.add(m); }
      if (b) { const m = bu_ritz(.14, .09, (C, B, W, H) => { const cx = W / 2, cy = H / 2; ritz_strich(C, B, [[cx - W * .42, cy], [cx - W * .2, cy - H * .3], [cx + W * .2, cy - H * .3], [cx + W * .42, cy]], 46, 'ritz', 1); ritz_strich(C, B, [[cx - W * .42, cy], [cx - W * .2, cy + H * .3], [cx + W * .2, cy + H * .3], [cx + W * .42, cy]], 46, 'ritz', 1);
          const pts = []; for (let a = 0; a <= 12; a++) pts.push([cx + Math.cos(a / 12 * 6.4) * H * .17, cy + Math.sin(a / 12 * 6.4) * H * .17]); ritz_strich(C, B, pts, 40, 'ritz', 1); ritz_strich(C, B, [[cx - 2, cy], [cx + 2, cy + 1]], 40, 'ritz', 1); }, { ppm: 700, seed: 9, bump: 3.4 }); bu_an(m, b.p, b.n, UP, .006); scene.add(m); } }
  } catch (e) { console.warn('Basis-Umsetzung Gedenkfeld', e); }

  // ---- Das offene Grab: Grube (Wände/Boden mit Erd-Scan), Tiefenmaske statt Loch im Boden, Erdhügel daneben
  {
    const K = KIDS[6], gx = K.x, gz = K.z - 1.12, W = .9, L = 1.95, D = 1.15;
    const pit = new THREE.Group(); pit.position.set(gx, 0, gz); scene.add(pit);
    const wallM = dirt, rO = -3;
    const addW = (w, h, d, x, y, z) => { const m = box(w, h, d, x, y, z, wallM, { parent: pit, cast: false }); m.renderOrder = rO; return m; };
    addW(W + .1, D, .05, 0, -D / 2, L / 2 + .025); addW(W + .1, D, .05, 0, -D / 2, -L / 2 - .025); addW(.05, D, L, W / 2 + .025, -D / 2, 0); addW(.05, D, L, -W / 2 - .025, -D / 2, 0);
    const floor = plane(W, L, 0, -D, 0, dirt, -PI / 2, 0, pit); floor.renderOrder = rO;
    const mask = new THREE.Mesh(new THREE.PlaneGeometry(W, L), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true })); mask.rotation.x = -PI / 2; mask.position.y = .004; mask.renderOrder = -2; pit.add(mask);
    // Erdhügel: verformte Fläche mit nasser Erde
    const mg = new THREE.SphereGeometry(1, 28, 14, 0, PI * 2, 0, PI / 2), mp = mg.attributes.position;
    for (let i = 0; i < mp.count; i++) { const x = mp.getX(i), y = mp.getY(i), z = mp.getZ(i), n = Math.sin(x * 9.1 + z * 4.3) * Math.sin(z * 7.7) * .09 + Math.sin(x * 23 + z * 19) * .03; mp.setXYZ(i, x * (1 + n * .4), Math.max(0, y * (.85 + n) - .02), z * (1 + n * .3)); }
    mg.computeVertexNormals(); const uv = mg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.2, uv.getY(i) * 1.1);
    const mound = new THREE.Mesh(mg, dirt); mound.scale.set(.62, .42, 1.15); mound.position.set(gx + 1.02, 0, gz + .05); mound.rotation.y = .06; mound.castShadow = true; mound.receiveShadow = true; scene.add(mound); N.mound = mound;
    addCol(gx - W / 2, gx + W / 2, gz - L / 2, gz + L / 2);   // in die Grube fällt man nicht – der Rand hält auf
    N.pit = { x: gx, z: gz }; blocked.push([gx - 1, gx + 1.8, gz - 1.3, gz + 1.3]);
  }

  // ---- Madonna mit der Laterne (Aufgabe „Ein Licht für jeden“)
  {
    const g = ausbau_nord_fit(madreM, 1.72); g.position.set(-42.05, 0, 74.75); g.rotation.y = PI; scene.add(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const hit = box(.8, 1.8, .7, -42.05, .9, 74.75, hidden, { cast: false });
    interact(hit, 'Madonna ansehen', () => openNote('Die Madonna am Gedenkfeld', 'Eine steinerne Madonna, die Hände gefaltet. Um ihre Handgelenke ist ein rotes Kinderhaarband geknotet, zweimal, fest.\n\nZu ihren Füßen ein laminierter Zettel:\n<span class="hand">Für unsere Sieben.\nWer ihnen ein Licht bringt,\nden vergessen sie nicht.\n— H. W.</span>\n\nDie Grablichter auf dem Gedenkfeld sind alle aus. Nur die Laterne zu ihren Füßen brennt.', 'nord_madonna', () => ausbau_nord_quest('lights'))); // STORY-HOOK: H. W. = Hilde Wendt
    const lg = ausbau_nord_fit(lanternM, .42); lg.position.set(-41.45, 0, 74.2); lg.rotation.y = .5; scene.add(lg);
    lg.traverse(o => { if (o.isMesh) { o.castShadow = true; if (o.material.name === 'buln') { o.material.emissiveMap = msTex('lantern1/lantern_and_bulb_buln_Emissive.1001.jpg', true); o.material.emissiveIntensity = 3; } } });
    const lf = ausbau_nord_flame(-41.45, .2, 74.2, true, .9); lf.light.color.set(0xffb060);
    const lhit = box(.35, .5, .35, -41.45, .25, 74.2, hidden, { cast: false });
    N.lantern = { g: lg, flame: lf, hit: lhit, home: lg.position.clone() };
    interact(lhit, () => ausbau_nord.lantern.taken ? '' : 'Laterne nehmen', () => ausbau_nord_takeLantern());
    // Basis-Umsetzung: das rote Kinderhaarband, zweimal um die gefalteten Handgelenke geknotet, und der laminierte Zettel zu ihren Füßen
    try {
      const FZ = 72.4; let best = null;
      for (let y = .8; y <= 1.4; y += .02) { const h = bu_strahl(g, -42.05, y, FZ, 0, 0, 1, 4); if (h && (!best || h.p.z < best.z - .004)) best = { y, z: h.p.z }; }
      if (best) {
        const wl = bu_strahl(g, -42.6, best.y, best.z + .05, 1, 0, 0, 1), wr = bu_strahl(g, -41.5, best.y, best.z + .05, -1, 0, 0, 1), halfW = wl && wr ? Math.min(.17, Math.max(.045, (wr.p.x - wl.p.x) / 2)) : .07, cx = wl && wr ? (wl.p.x + wr.p.x) / 2 : -42.05;
        const ribbon = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: 0xb01a20, roughness: .42, metalness: 0, side: THREE.DoubleSide }), ax = new THREE.Vector3(0, -.45, -.89).normalize();
        for (let k = 0; k < 2; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(1, .0065, 6, 28), mat); t.scale.set(halfW + .012 + k * .004, halfW * .62 + .012, .9); t.position.copy(ax).multiplyScalar(-.012 + k * .016); t.castShadow = true; ribbon.add(t); }
        const knot = new THREE.Mesh(new THREE.SphereGeometry(.012, 10, 8), mat); knot.scale.set(1.3, 1, 1); knot.position.set(.0, -(halfW * .62 + .012), 0); ribbon.add(knot);
        for (const [dx, L, rz] of [[-.006, .085, .12], [.008, .06, -.2]]) { const tail = new THREE.Mesh(new THREE.PlaneGeometry(.011, L, 1, 5), mat); const P = tail.geometry.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getY(i) * 60) * .004); tail.geometry.translate(0, -L / 2, 0); tail.position.set(dx, knot.position.y - .006, .004); tail.rotation.z = rz; ribbon.add(tail); }
        ribbon.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), ax); ribbon.position.set(cx, best.y + .01, best.z + .075); ribbon.traverse(o => { if (o.isMesh) o.userData.noCol = true; }); scene.add(ribbon); N.haarband = ribbon; }
      const bz = bu_strahl(g, -42.4, .12, FZ, 0, 0, 1, 4), zq = bz ? bz.p.z : 74.3, ang = 1.3, Lh = .17;
      const zet = ausbau_nord_paper(.125, Lh, (x, w, h) => { x.fillStyle = '#e8e2cf'; x.fillRect(0, 0, w, h); for (let i = 0; i < 30; i++) { x.fillStyle = `rgba(110,90,60,${Math.random() * .08})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 5 + Math.random() * 25, 0, 7); x.fill(); }
        ['Für unsere', 'Sieben.', 'Wer ihnen ein Licht', 'bringt, den vergessen', 'sie nicht.'].forEach((l, i) => ausbau_nord_hand(x, l, 26, 84 + i * 52, i < 2 ? 54 : 44, '#1c1a2e')); ausbau_nord_hand(x, '— H. W.', 190, h - 36, 46, '#1c1a2e'); }, 512);
      zet.material = new THREE.MeshPhysicalMaterial({ map: zet.material.map, roughness: .22, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, side: THREE.DoubleSide });  // laminiert: glänzende Folie
      const lam = new THREE.Mesh(new THREE.PlaneGeometry(.136, Lh + .011), new THREE.MeshPhysicalMaterial({ color: 0xf2f0ea, transparent: true, opacity: .55, roughness: .15, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })); // Folienrand
      const zg = new THREE.Group(); zg.add(lam, zet); zet.position.z = .0015; lam.position.z = .0005; zg.userData.noCol = true; zg.rotation.set(-(PI / 2 - ang), PI + .2, .08, 'YXZ'); zg.position.set(-42.42, Math.sin(ang) * Lh / 2 + .016, zq - Math.cos(ang) * Lh / 2 - .012); scene.add(zg); N.madonnaZettel = zg;
    } catch (e) { console.warn('Basis-Umsetzung Madonna', e); }
    blocked.push([-43, -40.8, 74, 76]);
  }

  // ---- Grablichter: sieben (aus) auf dem Gedenkfeld, dazu brennende Kerzen auf alten Gräbern
  {
    const pieces = n => ausbau_nord_parts(ausbau_nord_piece(candlesM, n, .01));
    const pillar = pieces('Candle_large_big_used_low'), holder = pieces('Steel_holder_candle_small_relief_low'), tea = pieces('Candle_small_used_low'), thin = pieces('Thin_candle_used_low001');
    const P1 = [], P2 = [], P3 = [];
    KIDS.forEach((K, i) => { const x = i === 6 ? K.x - .58 : K.x + .13, z = i === 6 ? K.z - .12 : K.z - .36; P1.push(msM4(x, 0, z, r(0, 6), 1.25));
      const C = ausbau_nord_flame(x, .155, z, false, .9); C.kid = i; N.cand.push(C);
      const hit = box(.26, .3, .26, x, .15, z, hidden, { cast: false }); C.hit = hit;
      interact(hit, () => C.on ? '' : story.items.includes('nord_lantern') ? 'Grablicht anzünden' : 'Grablicht', () => ausbau_nord_lightCandle(C)); });
    // Das achte Licht (erscheint erst am Ende) – auf nacktem Boden neben dem offenen Grab
    { const x = KIDS[6].x + 2.05, z = KIDS[6].z - .2; P1.push(msM4(x, -.2, z, 1, 1.25)); N.eighth = ausbau_nord_flame(x, .155, z, false, .9); N.eighthPos = [x, z]; N.eighthIdx = P1.length - 1; }
    candleSpots.forEach(([x, z], i) => { if (i % 2) { P2.push(msM4(x, 0, z, r(0, 6), 1.1)); ausbau_nord_flame(x, .025, z, true, .6); } else { P3.push(msM4(x, 0, z, r(0, 6), 1)); ausbau_nord_flame(x, .165, z, true, .75); } });
    // Kerzen im Inneren der Kapelle (hinter dem Gitter)
    N.pillar = inst(pillar, P1, { shadow: false }); inst(holder, P2, { shadow: false }); inst(tea, P2, { shadow: false }); inst(thin, P3, { shadow: false });
    // das achte Licht ist anfangs unsichtbar (Instanz im Boden versenkt)
  }

  // ---- Schmiedeeisernes Kreuz mit Haarbändern
  {
    let big = null, bv = 0; crossIronM.traverse(o => { if (o.isMesh) { o.geometry.computeBoundingBox(); const s = o.geometry.boundingBox.getSize(new THREE.Vector3()); const v = s.x * s.y * s.z; if (v > bv) { bv = v; big = o; } } });
    if (big) big.visible = false; // der Felsen gehört nicht aufs Grab
    const tmpB = new THREE.Box3(); crossIronM.updateMatrixWorld(true); crossIronM.traverse(o => { if (o.isMesh && o.visible) tmpB.expandByObject(o); });
    const cg = new THREE.Group(); cg.add(crossIronM); const hgt = tmpB.max.y - tmpB.min.y; crossIronM.scale.multiplyScalar(1.95 / hgt);
    crossIronM.updateMatrixWorld(true); const b2 = new THREE.Box3(); crossIronM.traverse(o => { if (o.isMesh && o.visible) b2.expandByObject(o); }); const c2 = b2.getCenter(new THREE.Vector3());
    crossIronM.position.set(-c2.x, -b2.min.y - .15, -c2.z); cg.position.set(-66.2, 0, 77.9); cg.rotation.y = .12; scene.add(cg); cg.traverse(o => { if (o.isMesh) o.castShadow = true; });
    // Basis-Umsetzung: acht Haarbänder an den Ranken – sieben ausgebleicht vom Regen, das achte neu und rot (fester Knoten)
    try { cg.updateMatrixWorld(true); const R2 = ausbau_nord_rng(8077), rib = new THREE.Group(); let n = 0;
      const cand = []; for (let cx = -66.9; cx <= -65.5; cx += .02) for (let cy = 1.05; cy <= 1.85; cy += .03) { const h = bu_strahl(cg, cx, cy, 75.4, 0, 0, 1, 4); if (h && Math.abs(h.n.y) < .85) cand.push(h); }
      for (let i = cand.length - 1; i > 0; i--) { const j = Math.floor(R2() * (i + 1)); [cand[i], cand[j]] = [cand[j], cand[i]]; }
      for (const h of cand) { if (n >= 8) break;
        if (rib.children.some(q => Math.abs(q.position.x - h.p.x) < .09 && Math.abs(q.position.y - h.p.y) < .14)) continue;
        const neu = n === 7, L = neu ? .17 : .1 + R2() * .08, col = neu ? 0xb2171d : [0x8a8884, 0x7e7c78, 0x94918a][n % 3], mat = new THREE.MeshStandardMaterial({ color: col, roughness: neu ? .4 : .92, side: THREE.DoubleSide }), band = new THREE.Group();
        const kn = new THREE.Mesh(new THREE.TorusGeometry(.011, .0045, 6, 12), mat); kn.rotation.y = PI / 2; band.add(kn); // Schlaufe um die Ranke
        for (const dx of [-.006, .006]) { const gp = new THREE.PlaneGeometry(.013, L * (dx < 0 ? 1 : .72), 1, 8), P = gp.attributes.position; gp.translate(0, -(L * (dx < 0 ? 1 : .72)) / 2 - .008, 0); for (let i = 0; i < P.count; i++) { const yy = -P.getY(i); P.setZ(i, Math.sin(yy * 38 + n) * .005 * Math.min(1, yy * 12)); P.setX(i, P.getX(i) + Math.sin(yy * 14 + n * 2) * .004 * yy * 8); } gp.computeVertexNormals(); const t = new THREE.Mesh(gp, mat); t.position.x = dx; t.rotation.z = dx * 3 + (R2() - .5) * .12; band.add(t); }
        band.position.copy(h.p); band.position.z -= .012; band.position.y += .004; band.rotation.y = (R2() - .5) * .5; rib.add(band); n++; }
      rib.traverse(o => { if (o.isMesh) { o.userData.noCol = true; o.castShadow = false; } }); scene.add(rib); N.haarbaender = n; if (n < 8) console.warn('Eisenkreuz: nur ' + n + ' Haarbänder gesetzt');
    } catch (e) { console.warn('Basis-Umsetzung Eisenkreuz', e); }
    const hit = box(.8, 1.9, .5, -66.2, .95, 77.9, hidden, { cast: false });
    interact(hit, 'Eisenkreuz', () => openNote('Das Eisenkreuz', 'Ein schmiedeeisernes Grabkreuz, fast zwei Meter hoch. Der Name darunter ist weggerostet.\n\nAn den Ranken hängen sieben ausgebleichte Haarbänder, vom Regen grau.\nEin achtes ist neu. Rot. Der Knoten ist noch fest.', 'nord_eisenkreuz')); // STORY-HOOK: acht Haarbänder
    blocked.push([-67.2, -65.2, 77, 78.8]);
  }

  // ---- Grabgitter um ein altes Grab (Scan-Gusseisen)
  {
    const L = [], s = 1.7, ex = -57.2, ez = 70.45; // Einfassung 1,02 × 2,04 m um das Grab (Stein am Kopfende bei z 71.4)
    for (const zz of [ez - 1.02, ez + 1.02]) L.push(msM4(ex - .51, 0, zz, 0, s));          // Modell beginnt bei x = 0 und läuft nach +x
    for (const xx of [ex - .51, ex + .51]) for (const zz of [ez + 1.02, ez]) L.push(msM4(xx, 0, zz, PI / 2, s)); // gedreht: läuft nach −z
    inst(lattP, L, {});
  }

  // ---- Bänke
  inst(benchP, [msM4(-58.3, 0, 77.75, 0), msM4(-46.7, 0, 77.75, 0), msM4(21.4, 0, 67.2, 0), msM4(44.2, 0, 67.2, 0)], {});

  // ---------------------------------------------------------------- Sühnekreuz an der Ecke Kirchweg / Am Kirchberg
  {
    // Steinkreuz aufrichten: der längste Arm (Schaft) zeigt nach unten
    const g0 = new THREE.Group(); g0.add(crossStoneM); crossStoneM.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(crossStoneM), c = bb.getCenter(new THREE.Vector3()); let far = null, fd = 0; const v = new THREE.Vector3();
    crossStoneM.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i += 7) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); const d = Math.hypot(v.x - c.x, v.y - c.y); if (d > fd) { fd = d; far = v.clone(); } } });
    const a = Math.atan2(far.y - c.y, far.x - c.x); crossStoneM.rotation.z += -PI / 2 - a;
    const g = ausbau_nord_fit(g0, 1.08); g.position.set(-10.7, -.1, 53.3); g.rotation.y = PI / 2 + .25; scene.add(g); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    // Basis-Umsetzung: Schwert, 1312 und die verwitterte Umschrift in den Stein geritzt; sieben glatte Kiesel in einer Reihe am Fuß, ein achter abseits
    try {
      const fz = bu_strahl(g, -8.0, .38, 53.3, -1, 0, 0, 3);
      if (fz) { const sw = (() => { const a = bu_strahl(g, fz.p.x + .5, .38, 52.9, 0, 0, 1, 1.2), b = bu_strahl(g, fz.p.x + .5, .38, 53.7, 0, 0, -1, 1.2); return a && b ? Math.abs(b.p.z - a.p.z) : .2; })(), w = Math.min(.3, Math.max(.12, sw * .86)), h = .5;
        const m = bu_ritz(w, h, (C, B, W, H, ppm) => { const cx = W / 2, bl = H * .5, sz = Math.min(W * .78, ppm * .36);
            ritz_strich(C, B, [[cx, H * .1], [cx + 3, bl]], sz, 'ritz', 1); ritz_strich(C, B, [[cx - W * .26, H * .3], [cx - 1, H * .31], [cx + W * .26, H * .3]], sz, 'ritz', 1); ritz_strich(C, B, [[cx - 1, H * .32], [cx - 1, H * .4]], sz, 'ritz', .9); ritz_strich(C, B, [[cx - 7, H * .41], [cx + 6, H * .41]], sz * .7, 'ritz', .9);
            ritz_strich(C, B, [[cx - 4, H * .1], [cx, H * .02], [cx + 4, H * .1]], sz, 'ritz', 1);
            const t = '1312', tz = Math.min(H * .15, (W - 10) / ritz_breite(t, 1)); ritz_zeile(C, B, t, (W - ritz_breite(t, tz)) / 2, H * .64, tz, { stil: 'ritz', jit: 1.3 });
            C.save(); C.translate(W * .1, H * .98); C.rotate(-PI / 2); ritz_zeile(C, B, 'BIS DASS ER DIE SEINE SELBST SUCHE', 0, 0, W * .15, { stil: 'ritz', alpha: .38, jit: 1.8 }); C.restore(); }, { ppm: 700, seed: 1312, bump: 3 });
        bu_an(m, fz.p, fz.n, new THREE.Vector3(0, 1, 0), .004); m.position.y = .62; scene.add(m); N.suehneRitz = m;
        const gz = fz.p.z, k0 = fz.p.x + .1, ks = []; for (let k = 0; k < 7; k++) ks.push([k0 + Math.sin(k * 2.1) * .012, 0, gz + (k - 3) * .105, .05 + .012 * Math.sin(k * 3.7), k * 1.3, .6]); ks.push([k0 + .26, 0, gz + .62, .054, 2.2, .6]);
        bu_kiesel(ks).then(() => {}); }
    } catch (e) { console.warn('Basis-Umsetzung Sühnekreuz', e); }
    const hit = box(.8, 1.1, .6, -10.7, .55, 53.3, hidden, { cast: false });
    interact(hit, 'Steinkreuz', () => openNote('Das Sühnekreuz', 'Ein altes Steinkreuz, schief und halb im Boden versunken. Solche Kreuze stellte man im Mittelalter auf – als Buße für einen Mord.\n\nIn den Stein geritzt, kaum noch zu erkennen: ein Schwert. Daneben eine Jahreszahl: <b>1312</b>.\n\nDarunter, in der Umschrift, noch lesbar: „… bis dass er die Seine selbst suche und finde.“\n\nAm Fuß liegen sieben glatte Kiesel in einer Reihe. Ein achter liegt ein Stück abseits, als wäre er weggerollt.', 'nord_suehnekreuz')); // STORY-HOOK: Justin, 1312
  }

  // ---------------------------------------------------------------- Kirchweg: Mauern, Wegweiser, Himmel und Hölle
  {
    const A = [], B = [];
    const run = (x, z0, z1) => { let z = z0; while (z < z1 - 1) { const one = R() < .5, len = one ? 3.98 : 3.1; (one ? A : B).push(msM4(x + r(-.05, .05), -.02, z + len / 2, PI / 2 + r(-.02, .02), new THREE.Vector3(1.02, r(.9, 1.05), r(.9, 1.05)))); z += len; } };
    run(-9.35, 9.5, 22.5); run(-9.35, 38, 49); run(-4.55, 22.5, 31.2); run(-4.55, 35, 44.5);
    inst(wall1P, A, {}); inst(wall2P, B, {});
    blocked.push([-9.9, -8.8, 9.5, 22.5], [-9.9, -8.8, 38, 49], [-5.1, -4, 22.5, 31.2], [-5.1, -4, 35, 44.5]);
    // Wegweiser am Beginn der Gasse
    const sign = ausbau_nord_paper(.58, .44, (x, w, h) => { x.fillStyle = '#1f3b2a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#d8d2c0'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
      x.fillStyle = '#e4dfcf'; x.textAlign = 'center'; x.font = 'bold 46px Georgia'; x.fillText('KIRCHWEG', w / 2, 76); x.font = '26px Georgia';
      ['↑ Friedhof · Kapelle', '↑ Am Kirchberg', '↑ Spielplatz'].forEach((l, i) => x.fillText(l, w / 2, 130 + i * 38));
      x.strokeStyle = '#7a1010'; x.lineWidth = 5; x.beginPath(); x.moveTo(140, 196); x.lineTo(375, 202); x.stroke(); ausbau_nord_hand(x, 'NICHT NACHTS', 170, 240, 34, '#9a1414'); });
    ausbau_nord_board(psignP, -9.45, 6.9, PI, sign);
    const sh = box(.7, .6, .2, -9.45, 1.5, 6.9, hidden, { cast: false });
    interact(sh, 'Wegweiser', () => toast('KIRCHWEG – zum Friedhof, zur Kapelle, zum Spielplatz. „Spielplatz“ ist durchgestrichen. Darunter, in Rot: NICHT NACHTS.', 5200));
    // Himmel und Hölle (Kreide, Kinderhand): sechs Reihen à 50 cm – 1 · 2 · 3 · 4/5 · 6 · 7/8; der Regen hat alles verwaschen, nur die Acht (mit LUKE) ist frisch nachgezogen
    const hop = bu_ritz(1.3, 3.2, (C, B, W, H, ppm) => {
      const c = .5 * ppm, rows = [[1], [2], [3], [4, 5], [6], [7, 8]], cells = []; let yb = H - .08 * ppm;
      rows.forEach(rw => { const y0 = yb - c; rw.forEach((n, j) => cells.push({ n, x0: W / 2 - rw.length * c / 2 + j * c, y0 })); yb = y0; });
      const j = () => ritz_RN() * c * .02;
      const zelle = (k, al) => { const { n, x0, y0 } = k, ln = (a, b, p2, q) => ritz_strich(C, null, [[a, b], [p2, q]], c * .42, 'kreide', al);
        ln(x0 + j(), y0 + j(), x0 + c + j(), y0 + j()); ln(x0 + c + j(), y0 + j(), x0 + c + j(), y0 + c + j()); ln(x0 + c + j(), y0 + c + j(), x0 + j(), y0 + c + j()); ln(x0 + j(), y0 + c + j(), x0 + j(), y0 + j());
        const sz = c * .52, t = String(n); ritz_zeile(C, null, t, x0 + c / 2 - ritz_breite(t, sz) / 2 + sz * .1, y0 + c * .7, sz, { stil: 'kreide', alpha: al }); };
      const k8 = cells.find(q => q.n === 8);
      cells.forEach(k => { if (k.n !== 8) zelle(k, k.n === 7 ? .86 : ritz_R(.6, .88)); });
      C.save(); C.globalCompositeOperation = 'destination-out';          // Regen, Schuhe, Jahre: Kreide ausgewaschen (unten stärker, die Sieben nur leicht)
      for (let i = 0; i < 1100; i++) { const px = ritz_R(0, W), py = ritz_R(0, H), r = ritz_R(1.5, 11) * ppm / 300, in8 = px > k8.x0 - c * .15 && px < k8.x0 + c * 1.15 && py > k8.y0 - c * .15 && py < k8.y0 + c * 1.15, in7 = px > k8.x0 - c * 1.15 && px < k8.x0 - c * .15 && py < k8.y0 + c * 1.15;
        if (in8) continue; const g = C.createRadialGradient(px, py, 0, px, py, r), a = ritz_R(.25, .8) * (in7 ? .3 : .55 + .6 * py / H); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); C.fillStyle = g; C.fillRect(px - r, py - r, r * 2, r * 2); }
      for (let i = 0; i < 38; i++) { const px = ritz_R(0, W), py = ritz_R(0, H), L = ritz_R(.1, .5) * ppm; if (px > k8.x0 - c * .2 && px < k8.x0 + c * 1.2 && py > k8.y0 - c * .2 && py < k8.y0 + c * 1.2) continue; C.strokeStyle = `rgba(0,0,0,${ritz_R(.12, .4)})`; C.lineWidth = ritz_R(2, 9) * ppm / 300; C.lineCap = 'round'; C.beginPath(); C.moveTo(px, py); C.lineTo(px + ritz_RN() * 6, py + L); C.stroke(); }
      C.restore();
      zelle(k8, .98); zelle(k8, .45);                                       // frisch nachgezogen: doppelte Spur
      const t = document.createElement('canvas'); t.width = Math.ceil(c); t.height = Math.ceil(c * .3); const tc = t.getContext('2d'), sz = c * .2, lw = ritz_breite('LUKE', sz); ritz_zeile(tc, null, 'LUKE', (t.width - lw) / 2, t.height * .8, sz, { stil: 'kreide', alpha: .95 });
      tc.globalCompositeOperation = 'source-in'; tc.fillStyle = 'rgb(214,92,80)'; tc.fillRect(0, 0, t.width, t.height); C.drawImage(t, k8.x0, k8.y0 + c * .7);  // klein, in Kinderschrift, rote Kreide
    }, { ppm: 360, seed: 8, relief: false });
    hop.rotation.x = -PI / 2; hop.rotation.z = PI; hop.position.set(-7.1, .032, 20.5); scene.add(hop);
    const hh = box(1.3, .15, 3.2, -7.1, .05, 20.5, hidden, { cast: false });
    interact(hh, 'Kreidezeichnung', () => openNote('Himmel und Hölle', 'Ein Hüpfspiel, mit Kreide aufs Pflaster gemalt. Der Regen hat fast alles weggewaschen.\n\nNur die Acht nicht. Die Acht ist frisch nachgezogen.\nUnd in der Acht, klein, in einer Kinderschrift, die du kennst:\n<span class="hand" style="color:#8a1010">LUKE</span>', 'nord_hupfspiel')); // STORY-HOOK: die Acht
    // Kreidepfeile den Weg hinauf (wie die Pfeile im Ort)
    for (const [x, z, ry] of [[-6.4, 12, -PI / 2], [-7.6, 29, -PI / 2 - .2], [-6.8, 43.5, -PI / 2 + .15], [-12.5, 58.5, PI], [-30, 58.2, PI], [-50.5, 62.2, PI + .75]]) chalkArrow(x, z, ry, .035);
  }

  // ---------------------------------------------------------------- Bushaltestelle „Kirchberg“ (Linie 7)
  {
    const src = stopS; const g = new THREE.Group(); const pick = ['Cube008', 'Cube008_1']; const found = [];
    src.updateMatrixWorld(true); src.traverse(o => { if (o.isMesh && pick.includes(o.name)) found.push(o); });
    const inner = new THREE.Group(); found.forEach(o => { const m = new THREE.Mesh(o.geometry, o.material); m.applyMatrix4(o.matrixWorld); inner.add(m); });
    const sg = msGround(inner); sg.position.set(10, 0, 53.15); sg.rotation.y = PI / 2; scene.add(sg);
    sg.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material.transparent || o.material.opacity < 1 || /glass/i.test(o.material.name)) { const m = o.material = o.material.clone(); m.transparent = true; m.opacity = .42; m.depthWrite = false; m.roughness = .18; m.color = new THREE.Color(0x9aa6a8); N.glass = N.glass || []; N.glass.push(o); } } });
    N.stop = sg;
    // Fahrplan im Wartehäuschen (Rückwand, innen)
    const tt = ausbau_nord_paper(.42, .6, (x, w, h) => { x.fillStyle = '#e9e4d2'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a3d8a'; x.fillRect(0, 0, w, 64); x.fillStyle = '#fff'; x.font = 'bold 40px Arial'; x.fillText('7', 22, 48); x.font = 'bold 26px Arial'; x.fillText('Kirchberg', 74, 44);
      x.fillStyle = '#222'; x.font = '19px Arial'; ['Richtung Kreisstadt', '', 'Mo–Fr   6:12  7:12  13:40  16:55', 'Sa         8:12', 'So        —', '', 'gültig ab 1. Juni 2009'].forEach((l, i) => x.fillText(l, 22, 104 + i * 30));
      ausbau_nord_hand(x, '03:13 nur für Kinder', 60, h - 60, 40, '#101a50'); x.strokeStyle = '#101a50'; x.lineWidth = 3; for (let k = 0; k < 3; k++) { x.beginPath(); x.moveTo(60, h - 48 + k * 6); x.lineTo(330, h - 50 + k * 6); x.stroke(); } }, 360);
    tt.position.set(8.4, 1.55, 51.98); scene.add(tt);
    const th = box(.6, .8, .3, 8.4, 1.55, 52.1, hidden, { cast: false });
    interact(th, 'Fahrplan lesen', () => { N.busArmed = Math.max(N.busArmed, 1); ausbau_nord_quest('plakat'); openNote('Fahrplan · Haltestelle Kirchberg', '<b>Linie 7</b> · Kirchberg → Kreisstadt\n\nMo–Fr früh und nachmittags je zwei\nSa vormittags\nSo kein Verkehr\n\nUnten, Kuli, dreimal unterstrichen:\n<span class="hand">03:13 – nur für Kinder</span>', 'nord_fahrplan', () => ausbau_nord_plakatCheck()); }); // STORY-HOOK: Linie 7, 03:13
    // Fahrkarte auf der Sitzbank
    const tk = ausbau_nord_paper(.075, .05, (x, w, h) => { x.fillStyle = '#eee6c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8201c'; x.fillRect(0, 0, w, 26); x.fillStyle = '#222'; x.font = 'bold 20px Arial'; x.fillText('KIND · EINFACH', 14, 60); x.font = '18px Arial'; x.fillText('28.07.2009  03:13', 14, 92); x.fillText('Kirchberg → ——', 14, 122); }, 256);
    tk.rotation.set(-PI / 2, 0, .4); tk.position.set(11.3, .468, 52.35); scene.add(tk); N.ticketMesh = tk;
    const kh = box(.3, .15, .3, 11.3, .47, 52.35, hidden, { cast: false });
    interact(kh, 'Fahrkarte', () => openNote('Eine Fahrkarte', 'Kinderfahrkarte, einfache Fahrt.\n\n<b>28.07.2009 · 03:13</b>\nvon: Lost Eyengless Kirchberg\nnach: ——\n\nDas Zielfeld ist leer. Nicht verwaschen. Nie bedruckt.\nDie Karte ist trocken. Alles andere hier ist nass.', 'nord_fahrkarte')); // STORY-HOOK: die Nacht vom 28. Juli
    // Haltestellenschild „H“ (Scan-Schild, gelbe Scheibe als Aufkleber)
    const sgp = ausbau_nord_piece(signM, 'Road_Sign_01', .01);
    if (sgp) { msFit(sgp, 2.55); const s2 = msGround(sgp); s2.position.set(6.3, 0, 56.3); s2.rotation.y = 0; scene.add(s2);
      s2.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(s2); N.hTop = b.max.y;
      const disc = ausbau_nord_paper(.5, .5, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = '#e9c21c'; x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 4, 0, 7); x.fill(); x.strokeStyle = '#1c5e2e'; x.lineWidth = 14; x.beginPath(); x.arc(w / 2, w / 2, w / 2 - 14, 0, 7); x.stroke();
        x.fillStyle = '#1c5e2e'; x.font = 'bold 250px Arial'; x.textAlign = 'center'; x.fillText('H', w / 2, w / 2 + 88); }, 512);
      const dy = b.max.y - .52; for (const s of [1, -1]) { const d = disc.clone(); d.position.set(6.3, dy, 56.3 + s * ((b.max.z - b.min.z) / 2 + .004)); d.rotation.y = s > 0 ? 0 : PI; d.scale.setScalar(1.17); scene.add(d); } }
    blocked.push([7, 13, 51.5, 57]);
  }

  // ---------------------------------------------------------------- Spielplatz
  {
    const cx = 31.5, cz = 74;
    const lg = new THREE.CircleGeometry(1, 40); lg.rotateX(-PI / 2); const lp = lg.attributes.position, lu = lg.attributes.uv;
    for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), z = lp.getZ(i), a = Math.atan2(z, x), k = i === 0 ? 1 : 1 + Math.sin(a * 5) * .06 + Math.sin(a * 11) * .03; lp.setXYZ(i, x * 13.5 * k, 0, z * 9.2 * k); lu.setXY(i, x * 13.5 * k / 2, z * 9.2 * k / 2); }
    { const ae = new Float32Array(lp.count * 4); for (let i = 0; i < lp.count; i++) { const x = lp.getX(i) / 13.5, z = lp.getZ(i) / 9.2, r = Math.hypot(x, z); ae[i * 4] = Math.max(0, (1 - r)) * 9.2; ae[i * 4 + 1] = 1e4; ae[i * 4 + 2] = 1e4; ae[i * 4 + 3] = 2e4; } lg.setAttribute('aE', new THREE.BufferAttribute(ae, 4)); } // (Randabstand, Rest sehr groß = nur x zählt)
    const lm = new THREE.Mesh(lg, leavesW); lm.position.set(cx, .021, cz); lm.receiveShadow = true; scene.add(lm);
    // Rutsche
    const sl = ausbau_nord_fit(slideM, 2.25); sl.position.set(24.3, 0, 76.4); sl.rotation.y = PI; scene.add(sl); sl.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    const sb = new THREE.Box3().setFromObject(sl);
    // Basis-Umsetzung: kleine nasse Handabdrücke auf dem Blech – sie führen hinauf, keine herunter
    try { const hits = []; for (let ix = 0; ix <= 16; ix++) for (let iz = 0; iz <= 34; iz++) { const h = bu_strahl(sl, sb.min.x + (sb.max.x - sb.min.x) * ix / 16, 3.5, sb.min.z + (sb.max.z - sb.min.z) * iz / 34, 0, -1, 0, 5); if (h && h.n.y > .55 && h.n.y < .93) hits.push(h.p); }
      if (hits.length > 12) { const n0 = hits.length, mx = hits.reduce((a, p) => a + p.x, 0) / n0, mz = hits.reduce((a, p) => a + p.z, 0) / n0, my = hits.reduce((a, p) => a + p.y, 0) / n0; let sxy = 0, szy = 0, syy = 0; hits.forEach(p => { sxy += (p.x - mx) * (p.y - my); szy += (p.z - mz) * (p.y - my); syy += (p.y - my) ** 2; }); const bx = sxy / (syy || 1), bz = szy / (syy || 1), y0 = Math.min(...hits.map(p => p.y)), y1 = Math.max(...hits.map(p => p.y));
        const tx = (() => { const c = document.createElement('canvas'); c.width = 128; c.height = 160; const x = c.getContext('2d'); x.filter = 'blur(1.4px)'; x.fillStyle = 'rgba(20,28,34,.9)'; x.beginPath(); x.ellipse(64, 110, 30, 34, 0, 0, 7); x.fill(); [[30, 62, 9, 30, -.35], [50, 40, 9.5, 36, -.1], [72, 36, 9.5, 38, .05], [93, 46, 9, 33, .25]].forEach(([fx, fy, rx, ry, a]) => { x.beginPath(); x.ellipse(fx + 6, fy + 12, rx, ry, a, 0, 7); x.fill(); }); x.beginPath(); x.ellipse(24, 112, 10, 22, -.9, 0, 7); x.fill();
          x.filter = 'none'; for (let i = 0; i < 14; i++) { x.fillStyle = 'rgba(20,28,34,.6)'; x.beginPath(); x.arc(30 + Math.random() * 70, 70 + Math.random() * 90, 1 + Math.random() * 2.2, 0, 7); x.fill(); } const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
        const pm = new THREE.MeshStandardMaterial({ map: tx, transparent: true, opacity: .8, roughness: .06, metalness: .15, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, envMapIntensity: 1.4 }), prints = new THREE.Group();
        for (let k = 0; k < 8; k++) { const y = y0 + (y1 - y0) * (.12 + k * .095), side = k % 2 ? 1 : -1, px = mx + bx * (y - my), pz = mz + bz * (y - my), h = bu_strahl(sl, px, 3.5, pz, 0, -1, 0, 5); if (!h || h.n.y > .95) continue;
          const up = new THREE.Vector3(0, 1, 0).addScaledVector(h.n, -h.n.y).normalize(), sd = new THREE.Vector3().crossVectors(up, h.n).normalize(), m = new THREE.Mesh(new THREE.PlaneGeometry(.075, .095), pm); if (side > 0) m.scale.x = -1;
          bu_an(m, h.p.clone().addScaledVector(sd, side * .075), h.n, up, .004); m.rotateZ(side * -.12 + (k % 3 - 1) * .07); m.renderOrder = 3; m.userData.noCol = true; prints.add(m); }
        scene.add(prints); N.rutscheHaende = prints; } } catch (e) { console.warn('Basis-Umsetzung Rutsche', e); }
    const sh = box(sb.max.x - sb.min.x, 1.2, sb.max.z - sb.min.z, (sb.min.x + sb.max.x) / 2, .6, (sb.min.z + sb.max.z) / 2, hidden, { cast: false });
    interact(sh, 'Rutsche', () => toast('Kleine, nasse Handabdrücke auf dem Blech. Sie führen hinauf. Keine führen herunter.', 4800));
    blocked.push([sb.min.x - .5, sb.max.x + .5, sb.min.z - .5, sb.max.z + .5]);
    // Karussell (dreht sich – manchmal ohne dich)
    const mm = ausbau_nord_fit(merryM, 2.05, 'x'); const piv = new THREE.Group(); piv.position.set(34, 0, 71.2); piv.add(mm); scene.add(piv);
    mm.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    N.merry = { piv, w: 0, auto: true, frozen: false, away: 0, creak: 0, told: false };
    const mh = box(2.1, .8, 2.1, 34, .4, 71.2, hidden, { cast: false });
    interact(mh, 'Karussell anstoßen', () => { const M_ = ausbau_nord.merry; M_.w = Math.min(2.2, M_.w + 1.1); M_.frozen = false; Audio.play('metalHit2', { gain: .25, rate: .7, x: 34, y: .5, z: 71.2, ref: 2 });
      if (!M_.told) { M_.told = true; setTimeout(() => toast('Es dreht sich. Und dreht sich. Viel länger, als es dürfte.', 4200), 2500); } });
    blocked.push([32.6, 35.4, 69.8, 72.6]);
    // Schaukel: Sitze mit Ketten vom Gerüst gelöst, damit sie schwingen können
    N.swing = ausbau_nord_swing(swingM, 40.6, 78.8, 0);
    // Spielzeug im Laub
    const toy = n => { const g = ausbau_nord_piece(toysM, n, .01); if (!g) return null; g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.userData.noCol = true; return g; };
    const put = (g, x, z, ry, rz = 0) => { if (!g) return; g.position.set(x, .02, z); g.rotation.set(0, ry, rz); scene.add(g); };
    put(toy('SM_Ball'), 35.9, 69.2, 0); put(toy('SM_ToyTrain'), 28.6, 79.6, 1.2, 0); put(toy('SM_ToyBunny'), 39.2, 80.3, 2.6, 1.45);
    const gir = giraffeS.clone(); gir.scale.setScalar(1.3); const gg = msGround(gir); gg.userData.noCol = true; gg.position.set(25.9, .02, 74.3); gg.rotation.y = -.7; scene.add(gg);
    const gh = box(.3, .3, .3, 25.9, .1, 74.3, hidden, { cast: false });
    interact(gh, 'Holzgiraffe', () => openNote('Eine Holzgiraffe', 'Abgeschabt, die Farbe fast ganz ab. Unten, eingebrannt: <b>D.</b>\n\nDina hatte so eine. Du erinnerst dich daran.\nDu erinnerst dich nicht, woher.', 'nord_giraffe')); // STORY-HOOK: Dina, Erinnerungen, die nicht Lukes sind
    // Spielzeug auf den Kindergräbern
    put(toy('SM_ToyBunny'), KIDS[1].x - .15, KIDS[1].z - .45, .4); put(toy('SM_ToyRobot'), KIDS[0].x - .2, KIDS[0].z - .42, -.3); put(toy('SM_ToyBoat'), KIDS[4].x - .15, KIDS[4].z - .5, .8);
    put(toy('SM_ToyCube_01a'), KIDS[5].x - .2, KIDS[5].z - .45, .3); put(toy('SM_ToyCube_02a'), KIDS[5].x - .08, KIDS[5].z - .56, 1.1); put(toy('SM_ToyTrain'), KIDS[3].x - .18, KIDS[3].z - .46, -.5);
    // Schild
    const ps = ausbau_nord_paper(.58, .44, (x, w, h) => { x.fillStyle = '#e8e2cf'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d5a2a'; x.fillRect(0, 0, w, 80); x.fillStyle = '#fff'; x.textAlign = 'center'; x.font = 'bold 50px Georgia'; x.fillText('SPIELPLATZ', w / 2, 58);
      x.fillStyle = '#222'; x.font = '21px Georgia'; ['Für Kinder bis 12 Jahre.', 'Benutzung auf eigene Gefahr.', 'Nach Einbruch der Dunkelheit', 'ist das Betreten verboten.'].forEach((l, i) => x.fillText(l, w / 2, 124 + i * 30));
      ausbau_nord_hand(x, 'sie spielen trotzdem', 150, h - 30, 34, '#a01818'); });
    ausbau_nord_board(psignP, 19.3, 66.2, PI, ps);
    const psh = box(.7, .6, .25, 19.3, 1.5, 66.2, hidden, { cast: false });
    interact(psh, 'Schild lesen', () => toast('SPIELPLATZ · Nach Einbruch der Dunkelheit ist das Betreten verboten. Darunter, in Rot: sie spielen trotzdem.', 5200));
    // Zettel auf der Bank (Aufgabe „Bärli“)
    const bn = ausbau_nord_paper(.16, .21, (x, w, h) => { x.fillStyle = '#e6dfc4'; x.fillRect(0, 0, w, h); ['BÄRLI IST', 'WEG!!', 'bitte wieder', 'auf die Bank'].forEach((l, i) => ausbau_nord_hand(x, l, 20, 70 + i * 62, 50, i < 2 ? '#8a1010' : '#1c1a2e')); }, 256);
    bn.rotation.set(-PI / 2, 0, -.3); bn.position.set(20.8, .595, 67.2); scene.add(bn);
    const bh = box(1.6, .7, .5, 21.4, .35, 67.2, hidden, { cast: false }); N.benchHit = bh;
    interact(bh, () => story.items.includes('nord_baer') ? 'Bärli auf die Bank setzen' : 'Zettel lesen', () => ausbau_nord_bench());
    blocked.push([18, 45, 64, 83]);
  }

  // ---- Bärli: sitzt am Rand der offenen Grube
  {
    const t = teddyS.clone(); const g = ausbau_nord_fit(t, .36); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); g.userData.noCol = true;
    const P0 = N.pit; g.position.set(P0.x + .05, .04, P0.z + .25); g.rotation.y = PI + .2; /* sitzt auf der Plane und sieht hinunter */ scene.add(g);
    const hit = box(.4, .45, .4, 0, .2, 0, hidden, { cast: false, parent: g });
    N.teddy = { g, hit, t: 0, seen: 0 };
    interact(hit, () => ausbau_nord.bear === 'bench' || ausbau_nord.bear === 'moved' ? 'Bärli' : 'Teddy aufheben', () => ausbau_nord_teddy());
  }

  // ---------------------------------------------------------------- Bäume, Sträucher, Gras, Felsen
  {
    for (const p of [...tree1P, ...tree3P]) { p.mat = p.mat.clone(); p.mat.side = THREE.DoubleSide; p.mat.color.setScalar(.62); }
    const TA = [], TB = [], spots = [[-12.2, 19.5, 1], [-1.9, 26.2, .9], [-12, 41, 1.1], [-2.2, 44, .95], [-67, 36.8, 1.1], [-47.5, 37.5, 1], [-24, 38, 1.2], [-17, 47, .9], [2.5, 49, 1],
      [18.5, 36.6, 1], [35, 36.3, 1.15], [55, 38.5, 1], [-70.5, 92.2, 1.2], [-34.2, 92.6, 1.05], [-70.2, 68.6, .95], [-35, 68.6, .9], [-24.5, 71, 1.1], [-13.5, 84, 1.25],
      [-2.5, 75.5, 1], [8.5, 90.5, 1.2], [-21, 92, 1], [19.2, 82.2, 1], [44.6, 83.6, 1.1], [30, 86.5, .95], [56.5, 67.5, 1.1], [-78, 67, 1.1], [5, 70, .85]];
    spots.forEach(([x, z, s], i) => { (i % 3 === 1 ? TB : TA).push(msM4(x, -.05, z, r(0, 6.28), s * (i % 3 === 1 ? .85 : 1.1), r(-.04, .04), r(-.04, .04))); treeSpots.push([x, z, s]); });
    inst(tree1P, TA, { shadow: true }); inst(tree3P, TB, { shadow: true });
    const isFree = (x, z) => !blocked.some(([a, b, c, d]) => x > a && x < b && z > c && z < d) && !(Math.abs(x + 7) < 2.1 && z < 57) && !(z > 54.2 && z < 65.8);
    const houseR = [[-66.5, -53.5, 40, 50.5], [-43.5, -32.5, 40.5, 51], [19.5, 32.5, 40, 50.5], [40.5, 56, 40, 50.5]];
    const freeH = (x, z) => isFree(x, z) && !houseR.some(([a, b, c, d]) => x > a && x < b && z > c && z < d) && !houseR.some(([a, b, c, d]) => Math.abs(x - (a + b) / 2) < .9 && z > d - .6 && z < 54.6);
    // Sträucher (weich: bremsen und rascheln)
    const E = { A: [], B: [], C: [] }, eParts = { A: elderP.filter(p => /VarE_LOD1$/.test(p.name)), B: elderP.filter(p => /VarG$/.test(p.name)), C: raspP.filter(p => /VarA$/.test(p.name)) };
    const shrubAt = (x, z, s) => { if (!freeH(x, z)) return; const k = R() < .4 ? 'A' : R() < .6 ? 'B' : 'C'; E[k].push(msM4(x, 0, z, r(0, 6.28), s * r(.8, 1.2))); };
    for (let x = -79; x < 58; x += r(2.2, 4.5)) { shrubAt(x, r(33.8, 36), 1.2); }                        // Rückseite der Gärten
    for (const hx of [-49, -27.5, 13.5, 36.2]) for (let z = 38; z < 53; z += r(1.8, 2.8)) shrubAt(hx + r(-.3, .3), z, 1);  // Grundstücksgrenzen
    for (let z = 8; z < 53; z += r(2.5, 4)) { shrubAt(-10.6 + r(-.3, .3), z, 1); shrubAt(-3.3 + r(-.3, .3), z, .9); }  // Gasse
    for (let x = -72; x < -33; x += r(2.5, 5)) { shrubAt(x, 67.9, .7); shrubAt(x, 93.2, .9); }            // Friedhofsmauer
    for (let z = 66.5; z < 95; z += r(2, 4)) { shrubAt(-74.2, z, 1); shrubAt(-31, z, .9); shrubAt(16.8, z + 2, 1); shrubAt(46.2, z, 1); }
    for (let i = 0; i < 30; i++) shrubAt(r(-29, 15), r(67, 97), r(.9, 1.4));                                  // Wiese
    for (const k of ['A', 'B', 'C']) inst(eParts[k].length ? eParts[k] : elderP.slice(0, 1), E[k], { shadow: true }).forEach(im => { addWind(im.material, .05); });
    // Gras (ohne Kollision)
    const gp = [/VarE_LOD2$/, /VarG_LOD2$/, /VarD_LOD2$/].map(re => grass1P.filter(p => re.test(p.name))).concat([/VarC$/, /VarB_LOD1$/].map(re => grass2P.filter(p => re.test(p.name))));
    const GL = gp.map(() => []); const tuft = (x, z, s = 1) => { if (!isFree(x, z) && R() < .8) return; if (Math.abs(x + 7) < 1.6 && z < 57) return; if (z > 56 && z < 64) return; GL[Math.floor(R() * GL.length)].push(msM4(x, 0, z, r(0, 6.28), s * r(.8, 1.3))); };
    for (let i = 0; i < 700; i++) { const x = r(-80, 60), z = r(33.5, 98); tuft(x, z); }
    for (let z = 6.5; z < 55; z += .55) { tuft(-8.75 + r(-.15, .1), z, .8); tuft(-5.25 + r(-.1, .15), z, .8); }
    for (let x = -72.5; x < -32; x += .5) { tuft(x, 67.45 + r(0, .3), .8); tuft(x, 66.3 - r(0, .2), .8); }
    GL.forEach((L, i) => { if (!L.length || !gp[i].length) return; const pp = gp[i].map(p => { const m = p.mat.clone(); m.side = THREE.DoubleSide; m.color = new THREE.Color(0x8a9278); addWind(m, .6); return { geo: p.geo, mat: m }; }); msInst(pp, L, { shadow: false }).forEach(im => im.userData.noCol = true); });
    // tote Büsche und Felsen
    const DS = [], BO = []; for (let i = 0; i < 18; i++) { const x = r(-78, 58), z = r(34, 97); if (freeH(x, z)) DS.push(msM4(x, 0, z, r(0, 6), r(1.3, 2))); }
    for (const [x, z, s] of [[-20, 78, 1.1], [3, 83, .8], [-27, 88.5, 1.3], [52, 72, 1], [-76, 56, .9], [58.5, 57, 1.2]]) BO.push(msM4(x, -.05, z, r(0, 6), s));
    inst(bushP.map(p => { const m = p.mat.clone(); m.alphaTest = .45; m.side = THREE.DoubleSide; return { geo: p.geo, mat: m }; }), DS, {}); inst(boulderP, BO, {});
  }

  // ---------------------------------------------------------------- Bodennebel über dem Kirchberg (gleicher Nebel wie im Ort)
  for (const y of [.25, .7, 1.25]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(150, 60), fogMat); m.rotation.x = -PI / 2; m.position.set(-10, y, 71.5); m.renderOrder = 2; scene.add(m); }

  // ---------------------------------------------------------------- Aufgaben (Nebenaufgaben im Tagebuch)
  story.side.nord_names = { title: 'Da fehlt eins', desc: 'Der Friedhof. Alle Grablichter aus, nur die Laterne der Madonna brennt. Das Gedenkfeld: sieben Namen. (0/7)', state: 'hidden' }; // AP-15: „Sieben Namen“ + „Ein Licht für jeden“ sind Schritte
  N.lq = { state: 'hidden', desc: '' }; // Schritt „Sieben Lichter“ von „Da fehlt eins“ (keine eigene Aufgabe mehr)
  story.side.nord_baer = { title: 'Ochs am Berg', desc: 'Auf der Spielplatzbank: „BÄRLI IST WEG!! … Bitte setzt ihn wieder auf die Bank, sonst findet er nicht heim.“', state: 'hidden' };
  try { await ausbau_nord_f3(N, psignP); } catch (e) { console.warn('Kirchberg F3 (AP-15)', e); }
  window.ausbau_nord = N;
  N.ok = true; N.tLoad = Math.round(tLoad); N.tBuild = Math.round(performance.now() - T0);
}

// Schaukel-Scan: Sitze samt Ketten aus dem Gesamtnetz lösen und an der Querstange aufhängen
function ausbau_nord_swing(src, x, z, ry) {
  const g0 = ausbau_nord_fit(src, 2.3); g0.updateMatrixWorld(true);
  let mesh = null; g0.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
  const root = new THREE.Group(); root.position.set(x, 0, z); root.rotation.y = ry; scene.add(root);
  if (!mesh) return null;
  const geo = (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingBox(); const bb = geo.boundingBox, W = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2;
  const pos = geo.attributes.position, nTri = pos.count / 3, sel = [[], [], []];
  for (let t = 0; t < nTri; t++) { let mx = 0, my = 0, mz = 0; for (let k = 0; k < 3; k++) { mx += pos.getX(t * 3 + k); my += pos.getY(t * 3 + k); mz += pos.getZ(t * 3 + k); } mx /= 3; my /= 3; mz /= 3;
    const seat = my < bb.min.y + H * .9 && Math.abs(mx - cx) < W * .36 && Math.abs(mz - cz) < .3; sel[seat ? (mx < cx ? 1 : 2) : 0].push(t); }
  const sub = list => { const g = new THREE.BufferGeometry(); for (const [n, a] of Object.entries(geo.attributes)) { const arr = new a.array.constructor(list.length * 3 * a.itemSize); list.forEach((t, j) => { for (let k = 0; k < 3 * a.itemSize; k++) arr[j * 3 * a.itemSize + k] = a.array[t * 3 * a.itemSize + k]; }); g.setAttribute(n, new THREE.BufferAttribute(arr, a.itemSize, a.normalized)); } return g; };
  const frame = new THREE.Mesh(sub(sel[0]), mesh.material); frame.castShadow = true; frame.receiveShadow = true; root.add(frame);
  const seats = [];
  for (const s of [1, 2]) { if (!sel[s].length) continue; const g = sub(sel[s]); g.computeBoundingBox(); const b = g.boundingBox; const px = (b.min.x + b.max.x) / 2, py = b.max.y, pz = (b.min.z + b.max.z) / 2;
    g.translate(-px, -py, -pz); const piv = new THREE.Group(); piv.position.set(px, py, pz); root.add(piv); const m = new THREE.Mesh(g, mesh.material); m.castShadow = true; piv.add(m); piv.userData.noCol = true; seats.push({ piv, a: 0, v: 0, drive: 0 }); }
  const hit = box(W * .8, 1.2, .7, x, .9, z, hidden, { cast: false });
  interact(hit, 'Schaukel anhalten', () => { const S = ausbau_nord.swing; S.seats.forEach(q => { q.v *= .1; q.drive = 0; }); S.hold = 12; toast(S.told ? 'Die Kette ist kalt. Jetzt.' : 'Du hältst die Kette fest. Sie ist warm. Als hätte gerade noch jemand darauf gesessen.', 4200); S.told = true; });
  return { root, seats, hold: 0, told: false, x, z, t: 0 };
}

// ---- Aufgaben-Logik
function ausbau_nord_quest(k) {
  if (k === 'lights') { const L = ausbau_nord.lq; if (L.state === 'hidden') L.state = 'active'; k = 'names'; }
  const q = story.side['nord_' + k]; if (!q || q.state !== 'hidden') return; if (typeof kirchberg_ab === 'function' && !kirchberg_ab('nord_' + k)) return; ausbau_nord.touched = true; sideStart('nord_' + k);
}
function ausbau_nord_readKid(i) {
  const N = ausbau_nord, K = N.kids[i]; const first = !N.names.has(i); N.names.add(i);
  if (first) ausbau_nord_quest('names');
  const q = story.side.nord_names, n = N.names.size;
  const zu = K.open && !kapAb(3); openNote(K.open && !zu ? 'Das offene Grab' : 'Grabstein · ' + K.n, zu ? K.t1 : K.t, 'nord_kind_' + K.n.toLowerCase() + (zu ? '_plane' : ''), () => {
    if (!first) return; ausbau_nord_save();
    if (K.open && first) setTimeout(() => subtitle('Ich lieg hier. Seit ich neun bin.', 3000, 'LUKE'), 600);
    if (n < 7) { ausbau_nord_fehltDesc(); subtitle(`${K.n}. (${n}/7)`, 2200); return; }
    N.namesDone = true; ausbau_nord_save(); ausbau_nord_fehltCheck();
    story.lore.push({ key: 'nord_gedenkfeld', title: 'Das Gedenkfeld', html: 'Sieben Kindergräber auf dem Friedhof am Kirchberg. Zayn, Roxy, Lucy, Mike, Dina, Heidi, Luke.\nAlle mit demselben Todestag: <b>28. Juli 2009</b>.\n\nSechs der Kinder kamen zurück. Trotzdem stehen ihre Namen hier.' }); // STORY-HOOK: Gedenkfeld / Ersatzkinder
    ausbau_nord_counting(K.x, K.z);
    if (kapAb(5)) ausbau_nord_echo(true); // Echo erst ab Kapitel 5 (PK-A A21) – sonst legt es ausbau_nord_sperre() beim Kapitelwechsel an
  });
}
// Gedenkfeld-Echo (PK-A A21, Text PK-G T12): erst ab Kapitel 5 und erst nach den sieben Namen
function ausbau_nord_echo(neu) {
  const N = ausbau_nord; if (N.echo || !N.pit) return; N.echo = true;
  const mk = () => { N.echoA = addEcho({ id: 'echo_nord_grab', at: [N.pit.x - .2, 1.1, N.pit.z - 1.6], title: 'Nachbild · Friedhof am Kirchberg, 1. November 2026', // STORY-HOOK: wer das Grab ausgehoben hat
    figs: [E_(N.pit.x - .95, N.pit.z + .1, 1.4, 1), E_(N.pit.x + .95, N.pit.z - .3, -1.6, 1.02), E_(N.pit.x - .1, N.pit.z - 1.35, 0, .58)],
    lines: [['Nacht. Zwei Männer in Mänteln heben eine Grube aus. Ihre Gesichter sind glatt und grau, wie Kinder Beamte malen.', 4600], ['„Tief genug?“', 2000, 'MANN VOM AMT?'], ['„Für ein Kind reicht es. Er ist ja eins. Ein bisschen.“', 3600, 'MANN VOM AMT?'],
      ['Ein Mädchen im weißen Kleid hält die Laterne. Ihr Gesicht ist grau wie Asche. Unter ihrer Stimme läuft leise eine Spieluhr.', 4800], ['„Er kommt. Ich hab ihn eingeladen.“', 3200, '???']] });
    if (neu) subtitle('Über der Grube schimmert etwas in der Luft.', 3600); ausbau_nord_sperre(); };
  if (neu) setTimeout(mk, 9000); else mk();
}
// Peters Grab ab Kapitel 4 (PK-A A39, Text PK-D K2-6): Folge von Peters Feuertod
function ausbau_nord_peter() {
  openNote('Grabstein · Peter Kranz', '<b>PETER KRANZ</b>\n1965 – 1992\n„Heimgegangen in den Nebel“\n\nDie Erde ist eingesunken. Über Nacht. Als hätte sich endlich jemand hingelegt.\n\nUnter der alten Kreide, frisch, in Kinderschrift: <span class="hand">HEIM</span>.', 'nord_grab_kranz_heim',
    () => { if (typeof gedanke === 'function') gedanke('nord_peter_heim', 'Onkel Peter. Ich hab dich heimgeschickt. Mit Mamas Feuerzeug.', 600, 3); });
}
// Kapitel-Sperren am Kirchberg: bei jedem Kapitelwechsel (KAP_BEGIN, Takt, Laden) – nie im Takt selbst allozieren
function ausbau_nord_sperre() {
  const N = ausbau_nord; if (!N.ok) return; const k5 = kapAb(5);
  if (k5 && !N.echo && (N.names.size >= 7 || story.lore.some(l => l.key === 'nord_gedenkfeld')) && !story.lore.some(l => l.key === 'echo_nord_grab')) ausbau_nord_echo(false);
  const A = N.echoA; if (!A || echoSeen.has('echo_nord_grab')) return; const i = interactables.indexOf(A.hit); A.s.visible = k5;
  if (k5 && i < 0) interactables.push(A.hit); else if (!k5 && i >= 0) interactables.splice(i, 1);
}
// Gänsehaut: Zählen am Gedenkfeld (nach dem siebten Namen)
async function ausbau_nord_counting(x, z) {
  const N = ausbau_nord; await wait(1600); state.talking = true; nat.calm = Math.max(nat.calm, 25);
  for (const C of candles) if (C.on && Math.hypot(C.g.position.x - x, C.g.position.z - z) < 30) { C.dim = true; ausbau_nord_setFlame(C, false); }
  Audio.flick();
  const W = ['… eins …', '… zwei …', '… drei …', '… vier …', '… fünf …', '… sechs …', '… sieben …'];
  for (let i = 0; i < 7; i++) { const K = N.kids[i]; Audio.whisper(K.x, .6, K.z, 1); subtitle(`<i>${W[i]}</i>`, 900); await wait(820); }
  await wait(1500); const f = flatDir(); Audio.whisper(player.pos.x - f.x * .9, 1.6, player.pos.z - f.z * .9, 1.6); subtitle('<i>… ach–</i>', 1200); glitchV = .35;
  await wait(1400); for (const C of candles) if (C.dim) { C.dim = false; ausbau_nord_setFlame(C, true); }
  state.talking = false; setTimeout(() => { subtitle('Sieben Namen. Acht Steine.', 2600, 'LUKE'); setTimeout(() => subtitle('Da fehlt eins.', 2200, 'LUKE'), 2900); }, 900);
}
function ausbau_nord_takeLantern() {
  const N = ausbau_nord, L = N.lantern; if (L.taken) return; ausbau_nord_items(); ausbau_nord_quest('lights');
  L.taken = true; uninteract(L.hit); ausbau_nord_setFlame(L.flame, false);
  liftTo(L.g, () => openNote('Die Grablaterne', 'Du nimmst die Laterne. Sie ist schwerer als gedacht, und warm.\n\nDie Flamme darin steht still. Sie neigt sich nicht, egal wie du die Laterne hältst.', 'nord_laterne', () => { addItem('nord_lantern'); ausbau_nord_fehltDesc(); }), false);
}
function ausbau_nord_lightCandle(C) {
  const N = ausbau_nord; if (C.on) return;
  if (!story.items.includes('nord_lantern')) { ausbau_nord_quest('lights'); return toast(N.lights.size ? 'Du hast nichts mehr, um es anzuzünden.' : 'Das Grablicht ist aus. Der Docht ist nass – als hätte es gerade erst jemand ausgedrückt.', 4200); }
  ausbau_nord_setFlame(C, true); N.lights.add(C.kid); Audio.play('switch1', { gain: .12, rate: 2.2, x: C.g.position.x, y: .2, z: C.g.position.z, ref: 1 }); uninteract(C.hit); ausbau_nord_save();
  const n = N.lights.size; ausbau_nord_fehltDesc();
  if (n < 7) { subtitle(`${N.kids[C.kid].n}. Das Licht brennt. (${n}/7)`, 2000); return; }
  ausbau_nord_eighthLight();
}
// Gänsehaut: das achte Licht
async function ausbau_nord_eighthLight() {
  const N = ausbau_nord; state.talking = true; nat.calm = Math.max(nat.calm, 25); await wait(1400);
  for (const C of N.cand) ausbau_nord_setFlame(C, false); Audio.play('wind3', { gain: .5, rate: 1.3, dur: 2.2, fadeIn: .4 });
  await wait(1800);
  const [x, z] = N.eighthPos; for (const im of N.pillar || []) { const m = new THREE.Matrix4(); im.getMatrixAt(N.eighthIdx, m); m.elements[13] = 0; im.setMatrixAt(N.eighthIdx, m); im.instanceMatrix.needsUpdate = true; }
  ausbau_nord_setFlame(N.eighth, true); Audio.play('switch1', { gain: .2, rate: 1.9, x, y: .2, z, ref: 1.5 }); Audio.giggle(x, .5, z);
  await wait(900); for (const C of N.cand) ausbau_nord_setFlame(C, true);
  state.talking = false; subtitle('Sieben Lichter. Und ein achtes, das du nicht angezündet hast.', 4600);
  N.lq.state = 'done'; ausbau_nord_save(); ausbau_nord_fehltCheck();
  story.lore.push({ key: 'nord_achtes_licht', title: 'Das achte Licht', html: 'Als das siebte Grablicht brannte, flammte daneben ein achtes auf. Auf nacktem Boden, neben dem offenen Grab.\n\nNiemand hat es angezündet.' }); // STORY-HOOK: das achte Kind
  ausbau_nord_dropItem('nord_lantern');
  setTimeout(() => { const L = N.lantern; L.g.visible = true; L.g.scale.setScalar(1); L.g.position.copy(L.home); L.g.rotation.set(0, .5, 0); ausbau_nord_setFlame(L.flame, true); L.back = true; }, 12000);
}
function ausbau_nord_teddy() {
  const N = ausbau_nord, T = N.teddy;
  if (N.bear === 'bench' || N.bear === 'moved') return toast(N.bear === 'moved' ? 'Er sitzt da, als hätte er dich erwartet.' : 'Bärli sitzt auf der Bank und schaut zur Straße.', 3600);
  ausbau_nord_items(); ausbau_nord_quest('baer'); N.bear = 'carried'; uninteract(T.hit);
  liftTo(T.g, () => openNote('Ein Teddy', 'Ein alter Teddy, nass vom Regen, die Knopfaugen stumpf. Er saß auf der grünen Plane neben dem Stein mit deinem Namen, als würde er hinuntersehen.\n\nAm Etikett, mit Kuli: <span class="hand">BÄRLI</span>', 'nord_teddy', () => { addItem('nord_baer'); story.side.nord_baer.desc = 'Bärli gehört auf die Bank am Spielplatz.'; ausbau_nord_save(); }), false);
}
function ausbau_nord_bench() {
  const N = ausbau_nord, T = N.teddy;
  if (!story.items.includes('nord_baer')) { ausbau_nord_quest('baer');
    return openNote('Ein Zettel auf der Bank', '<span class="hand">BÄRLI IST WEG!!\nEr ist braun und hat Knopfaugen.\nEr wollte nur zu den anderen.\nBitte setzt ihn wieder auf die Bank,\nsonst findet er nicht heim.</span>\n\nKeine Unterschrift. Eine Kinderschrift. Das Papier ist vergilbt und trocken, obwohl es seit Stunden regnet.', 'nord_zettel'); } // STORY-HOOK: wer sucht Bärli?
  ausbau_nord_dropItem('nord_baer'); N.bear = 'bench'; ausbau_nord_save();
  T.g.visible = true; T.g.scale.setScalar(1); T.g.position.set(21.05, .585, 67.35); T.g.rotation.set(0, 0, 0); T.g.userData.noCol = true; interact(T.hit, 'Bärli', () => ausbau_nord_teddy()); T.t = 0; T.seen = 0;
  Audio.paper(); if (N.ochs && N.ochs.n >= 10) { N.ochs.aktiv = false; sideDone('nord_baer', 'Bärli sitzt auf der Bank, Gesicht zur Straße. Er bleibt.'); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('R-ochs'); } catch (e) {} return; }
  if (N.ochs) { N.ochs.aktiv = true; N.ochs.t = 0; } T.g.rotation.y = PI; kirchberg_desc('nord_baer', 'Bärli sitzt auf der Bank. Dreh dich nicht weg. Oder doch.');
  setTimeout(() => Audio.giggle(40.6, 1, 78.8), 2500);
}

// ---- pro Bild
function ausbau_nord_tick(dt, t, indoor) {
  const N = ausbau_nord, P = player.pos, k = kap(); if (k !== N.kap) { N.kap = k; ausbau_nord_sperre(); }
  ausbau_nord_f3Tick(dt, P);
  if (!N.solid && typeof SOL !== 'undefined' && SOL.items.length) { N.solid = true; try { for (const g of N.glass || []) solidAdd(g, true); } catch (e) {} } // Glas der Haltestelle hält auf
  if (!N.restored && state.started) { N.restored = true; ausbau_nord_restore(); ausbau_nord_sperre(); }
  const near = P.z > 30 && P.x > -90 && P.x < 70, onLane = P.z > 4 && P.z < 58 && Math.abs(P.x + 7) < 6;
  // --- Karussell
  const M_ = N.merry; if (M_) { const d = Math.hypot(P.x - 34, P.z - 71.2);
    if (M_.auto && !M_.frozen && d < 17 && ausbau_nord_free()) M_.w += (.45 - M_.w) * Math.min(1, dt * .5);
    if (!M_.frozen && M_.w > .05 && flashOn && d < 16 && d > 2.5) { tmp.set(34 - camera.position.x, .5 - camera.position.y, 71.2 - camera.position.z).normalize(); if (fwd.dot(tmp) > .965) { M_.frozen = true; M_.w = 0; M_.auto = false; M_.away = 0; } } // im Lichtkegel: sofort still
    if (M_.frozen && d > 26) { M_.away += dt; if (M_.away > 40) { M_.frozen = false; M_.auto = true; } }
    M_.w *= 1 - dt * (M_.auto && !M_.frozen ? .02 : .12); M_.piv.rotation.y += M_.w * dt;
    if (M_.w > .12) { M_.creak -= dt * M_.w; if (M_.creak < 0) { M_.creak = 1.4; if (d < 30) Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .18 * Math.min(1, M_.w), rate: .55, x: 34, y: .4, z: 71.2, ref: 2 }); } } }
  // --- Schaukel: schwingt an, wenn niemand hinsieht
  const S = N.swing; if (S && S.seats.length) { const d = Math.hypot(P.x - S.x, P.z - S.z); S.hold = Math.max(0, S.hold - dt);
    tmp.set(S.x - camera.position.x, 1.2 - camera.position.y, S.z - camera.position.z).normalize(); const looking = fwd.dot(tmp) > .75;
    const q = S.seats[1] || S.seats[0];
    if (d < 20 && !looking && !S.hold && ausbau_nord_free()) q.drive = Math.min(1, q.drive + dt * .15); else q.drive = Math.max(0, q.drive - dt * (looking ? .08 : .3));
    if (typeof umwelt_pendel === 'function') for (const s of S.seats) { s.ziel = s === q ? q.drive * .7 : 0; s.halt = S.hold > 0; } // Pendel, Anstoßen, Wind, Kette: umwelt.js
    else for (const s of S.seats) { const push = s === q ? q.drive * .9 * Math.sign(s.v || 1) : 0; s.v += (-9.8 / 1.9 * Math.sin(s.a) + push * (Math.abs(s.a) < .15 ? 1 : 0)) * dt; s.v *= 1 - dt * .12; s.a += s.v * dt; s.piv.rotation.x = s.a;
      if (Math.abs(s.a) > .12 && Math.sign(s.v) !== Math.sign(s.lv || 0)) { if (d < 22) Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .12 * Math.min(1, Math.abs(s.a) * 2), rate: .8, x: S.x, y: 2, z: S.z, ref: 2 }); } s.lv = s.v; } }
  if (!near && !onLane) return;
  // T20: Paragraf vier – Gedanke am Gedenkfeld, sobald Luke die Einwilligungen aus Zimmer 7 bei sich hat
  if (!N.t20 && N.pit && Math.abs(P.x - N.pit.x) < 8 && Math.abs(P.z - N.pit.z) < 6 && story.items.includes('einwilligungen')) { N.t20 = true; if (typeof gedanke === 'function') gedanke('nord_paragraf4', 'Paragraf vier. Am Tag der Übergabe ein Gedenkstein. Sie haben uns begraben, bevor sie uns hergegeben haben.', 800, 3); }
  const free = ausbau_nord_free();
  // --- tote Laterne am Ende der Straße: kämpft sich ab und zu an
  if (N.deadLamp && N.deadLamp.mode === 'off' && !ch3.on && !state.outage) { N.lampT -= dt; if (N.lampT < 0) { N.lampT = rand(9, 22); const L = N.deadLamp; L.mode = 'flicker'; Audio.buzz(L.wx, 5, L.wz); setTimeout(() => { if (L.mode === 'flicker') L.mode = 'off'; }, rand(250, 700)); } }
  // --- Krähen auf der Kapelle
  N.crowT -= dt; if (N.crowT < 0) { N.crowT = rand(22, 48); if (Math.hypot(P.x + 52.5, P.z - 86) < 45) Audio.caw(-52.5 + rand(-3, 3), 11, 86 + rand(-3, 3)); }
  // --- Friedhofstor: einmal die Glocke
  if (!N.bell && P.z > 67.4 && P.z < 70 && Math.abs(P.x + 52.5) < 2 && free) { N.bell = true; setTimeout(() => { ausbau_nord_bellToll(); setTimeout(() => { try { crowFlock(); } catch (e) {} }, 1400); }, 500); }
  // --- Gestalt zwischen den Gräbern
  N.figT -= dt;
  if (N.figT < 0 && kapAb(3) && free && !dir.busy && !stalker.visible && P.x > -73 && P.x < -32 && P.z > 67.5 && P.z < 80 && nat.calm <= 0) {
    const f = flatDir(); const c = [[-68.5, 88.6], [-64, 91.8], [-40.4, 88.7], [-36.2, 85.6], [-43, 91.8], [-69.6, 83], [-38.6, 82.6]].filter(([x, z]) => { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); return d > 13 && d < 24 && (dx * f.x + dz * f.z) / d > .8; });
    if (c.length) { const [x, z] = c[Math.floor(Math.random() * c.length)]; setFace(stalker, Math.random() < .5 ? 'child' : 'pale'); stalker.position.set(x, 0, z); stalker.lookAt(P.x, 0, P.z); stalker.visible = true; dir.busy = true;
      dir.fig = { t: 0, seen: 0, crossing: false, dx: 0, dz: 0 }; N.figT = rand(120, 200); nat.calm = Math.max(nat.calm, 12); } else N.figT = 3;
  }
  // --- Der letzte Bus (Haltestelle)
  if (kapAb(3)) ausbau_nord_busTick(dt, P, free);
  // --- Bärli hat sich bewegt
  const T = N.teddy; if (T && N.ochs && N.ochs.aktiv && (N.bear === 'bench' || N.bear === 'moved')) ausbau_nord_ochsTick(dt, P, T); else if (T && N.bear === 'bench' && !N.ochs) { const d = Math.hypot(P.x - 21, P.z - 67.3); tmp.set(21 - camera.position.x, .7 - camera.position.y, 67.3 - camera.position.z).normalize(); const vis = fwd.dot(tmp) > .6 && d < 40;
    if (d > 9 && !vis) T.t += dt; else if (vis) T.t = 0;
    if (T.t > 4 && free) { N.bear = 'moved'; T.g.position.set(22.4, 0, 69.6); T.g.lookAt(P.x, 0, P.z); T.g.rotation.x = 0; T.g.rotation.z = 0; T.watch = true; T.seen = 0; ausbau_nord_save(); } }
  if (T && T.watch) { const d = Math.hypot(P.x - T.g.position.x, P.z - T.g.position.z); tmp.set(T.g.position.x - camera.position.x, .3 - camera.position.y, T.g.position.z - camera.position.z).normalize();
    if (fwd.dot(tmp) > .9 && d < 22) { T.seen += dt; if (T.seen > .5) { T.watch = false; subtitle('Bärli sitzt nicht mehr auf der Bank. Er sitzt im Laub. Und sieht dich an.', 4200); Audio.stinger(false); } } }
}
// Glocke (synthetisch, groß, weit)
function ausbau_nord_bellToll() {
  if (!Audio.ctx) return; if (Audio.glocke && Audio.glocke(-52.5, 11, 88, 138, 1, 14)) return; const d = Audio.at(-52.5, 11, 88, 14); // Aufnahme (Modul klang), sonst Synthese
  [[.5, .5, 7], [1, .9, 5.5], [1.19, .35, 4], [1.5, .3, 3.2], [2, .45, 2.6], [2.52, .15, 1.8], [3, .12, 1.4]].forEach(([m, a, dur]) => { const o = Audio.osc('sine', 138 * m, 0, dur + .2); Audio.env(o, a * .32, .004, dur, 0, d); });
  const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 3; n.connect(bp); Audio.env(bp, .12, .002, .15, 0, d); n.stop(Audio.ctx.currentTime + .5);
}
// Der letzte Bus: nur Licht und Klang, kein Fahrzeug
function ausbau_nord_busTick(dt, P, free) {
  const N = ausbau_nord, B = N.bus;
  if (B.phase === 'done') return;
  if (B.phase === 'idle') {
    const d = Math.hypot(P.x - 10, P.z - 54.8); if (d < 4.5) B.near += dt; else B.near = Math.max(0, B.near - dt * .5);
    if (N.busArmed) N.busArmed += dt;
    if (free && nat.calm <= 0 && (B.near > 5 || N.busArmed > 7) && d < 14) {
      B.phase = 'come'; B.t = 0; B.x = 78; nat.calm = Math.max(nat.calm, 30); dir.busy = true;
      if (!B.fl) { const mk = c => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: poolTex, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); s.scale.setScalar(.9); scene.add(s); return s; };
        B.fl = [mk(0xfff2d8), mk(0xfff2d8)]; B.light = new VLight(0xfff0d0, 0, 22, 1.6); scene.add(B.light); }
      if (Audio.ctx) { B.pan = Audio.at(B.x, .8, 58.3, 6, { dauer: 45 }); B.eng = Audio.play('carEngine', { loop: true, gain: 0, lp: 520, rate: .72, dest: B.pan }); if (B.eng) B.eng.g.gain.linearRampToValueAtTime(.9, Audio.ctx.currentTime + 5); }
    }
    return;
  }
  B.t += dt; const setPos = (x, c) => { B.x = x; B.fl.forEach((s, i) => { s.visible = true; s.position.set(x, .85, 58.3 + (i ? .75 : -.75)); s.material.color.set(c === 'r' ? 0xff2a18 : 0xfff2d8); s.scale.setScalar(c === 'r' ? .5 : .95); });
    B.light.position.set(c === 'r' ? x + 1 : x - 3, 1.2, 58.3); if (B.pan) Audio.setze(B.pan, x, .8, 58.3); };
  if (B.phase === 'come') { const k = Math.min(1, B.t / 11), e = 1 - Math.pow(1 - k, 2.2); setPos(78 + (13 - 78) * e, 'w'); B.light.intensity = 5 * Math.min(1, B.t / 2);
    if (k >= 1) { B.phase = 'stop'; B.t = 0; if (Audio.ctx) { const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 2500; n.connect(bp); Audio.env(bp, .22, .02, 1.2, 0, Audio.at(13, .6, 58.3, 4)); n.stop(Audio.ctx.currentTime + 2); } } }
  else if (B.phase === 'stop') {
    if (B.t > .8 && !B.s1) { B.s1 = true; Audio.play('metalOpen', { gain: .7, rate: .8, x: 10.5, y: 1.2, z: 57.6, ref: 3 }); subtitle('Zischen. Türen, die sich öffnen. Da ist kein Bus. Nur Licht.', 4200); }
    if (B.t > 2.6 && !B.s2) { B.s2 = true; const f = flatDir(); Audio.stepAt(P.x + f.z * .9, P.z - f.x * .9, .5); }
    if (B.t > 3.4 && !B.s3) { B.s3 = true; const f = flatDir(); Audio.stepAt(P.x - f.x * .7, P.z - f.z * .7, .45); }
    if (B.t > 5 && !B.s4) { B.s4 = true; Audio.play('metalClose', { gain: .6, rate: .8, x: 10.5, y: 1.2, z: 57.6, ref: 3 }); }
    if (B.t > 6) { B.phase = 'go'; B.t = 0; } }
  else if (B.phase === 'go') { const k = Math.min(1, B.t / 12), e = k * k; setPos(13 + (-90 - 13) * e, 'r'); B.light.intensity = 5 * (1 - k);
    if (B.eng && Audio.ctx && !B.fade) { B.fade = true; B.eng.g.gain.cancelScheduledValues(Audio.ctx.currentTime); B.eng.g.gain.setValueAtTime(.9, Audio.ctx.currentTime); B.eng.g.gain.linearRampToValueAtTime(0, Audio.ctx.currentTime + 11); }
    if (k >= 1) { B.phase = 'done'; B.fl.forEach(s => s.visible = false); B.light.intensity = 0; if (B.eng) B.eng.stop(.5); dir.busy = false; setTimeout(() => toast('Du bist nicht eingestiegen. Irgendetwas anderes schon.', 4200), 1200); } }
}
// Fortschritt nach „Weiterspielen“ wiederherstellen
function ausbau_nord_restore() {
  const N = ausbau_nord; if (N.touched) return;
  if (!['nord_names', 'nord_baer', 'nord_plakat', 'nord_strich'].some(k => story.side[k] && story.side[k].state !== 'hidden')) return;
  let d = null; try { d = JSON.parse(localStorage.getItem('ham_nord') || 'null'); } catch (e) {} if (!d) return;
  (d.names || []).forEach(i => N.names.add(i));
  if (d.lq && N.lq) N.lq.state = d.lq; N.namesDone = !!d.namesDone; N.plakat = d.plakat || 0; if (N.plakat) ausbau_nord_plakatAb(true); if (N.ochs && d.ochs) N.ochs.n = d.ochs;
  if (N.lq.state !== 'hidden') (d.lights || []).forEach(i => { const C = N.cand.find(c => c.kid === i); if (C) { ausbau_nord_setFlame(C, true); N.lights.add(i); uninteract(C.hit); } });
  if (N.lq.state === 'done' && N.eighth) ausbau_nord_setFlame(N.eighth, true);
  if (story.side.nord_baer.state === 'done' && N.teddy) { const T = N.teddy; N.bear = 'bench'; T.g.position.set(21.05, .585, 67.35); T.g.rotation.set(0, 0, 0); }
}

// =====================================================================  Fassung 3 (AP-15): Kapitel-1-Nebenaufgaben am Kirchberg
// „Da fehlt eins“ (Namen + Lichter als Schritte, Plane über der Grube bis Kap. 3) · „Ochs am Berg“ (Bärli rückt beim Wegsehen näher, Eisen ist frei) ·
// „Hinter dem ältesten Plakat“ (vier Plakatschichten, SB-03 hinter 1958) · „Der Strich ohne Namen“ (Praxis Seiler, Am Kirchberg 5: Messlatte, Kittel, Schaukasten AG-04)
function ausbau_nord_fehltDesc() { const N = ausbau_nord; const q = story.side.nord_names; if (!q || q.state === 'done') return;
  q.desc = `Das Gedenkfeld: Namen ${N.names.size}/7 · Grablichter ${N.lights.size}/7${N.namesDone && N.lq.state === 'done' ? '' : ' · die Laterne der Madonna brennt noch'}`; try { updateSideInfo(); } catch (e) {} }
function ausbau_nord_fehltCheck() { const N = ausbau_nord; ausbau_nord_fehltDesc(); if (!N.namesDone || N.lq.state !== 'done') return;
  sideDone('nord_names', 'Sieben Namen, acht Steine. Ein achtes Licht auf nacktem Boden. Da fehlt eins.');
  if (!story.lore.some(l => l.key === 'nord_achtes_licht')) story.lore.push({ key: 'nord_achtes_licht', title: 'Das achte Licht', html: 'Als das siebte Grablicht brannte, flammte daneben ein achtes auf. Auf nacktem Boden.\n\nNiemand hat es angezündet.' }); }
async function ausbau_nord_f3(N, psignP) {
  const T = THREE, hand = (x, t, px, py, size, col, rot = 0) => { x.save(); x.translate(px, py); x.rotate(rot); x.font = `${size}px Caveat, cursive`; x.fillStyle = col; x.fillText(t, 0, 0); x.restore(); };
  try { await document.fonts.load('30px Caveat'); } catch (e) {}
  // ---- Plane über Lukes Grube (bis Kap. 3): grüne Friedhofsplane, mit Steinen beschwert, Spaten daneben; Bärli sitzt darauf
  if (N.pit) { const P = N.pit;
    const tarp = ausbau_nord_paper(1.35, 2.45, (x, w, h) => { x.fillStyle = '#2f4a2c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${20 + Math.random() * 40},${50 + Math.random() * 40},${20 + Math.random() * 30},.35)`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      for (let i = 0; i < 22; i++) { const y0 = Math.random() * h, g = x.createLinearGradient(0, y0 - 18, 0, y0 + 18); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, `rgba(${Math.random() < .5 ? '0,0,0' : '160,190,150'},.16)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, y0 - 18, w, 36); } // Falten
      x.strokeStyle = 'rgba(210,210,190,.5)'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = 'rgba(220,210,170,.8)'; for (const [cx, cy] of [[22, 22], [w - 22, 22], [22, h - 22], [w - 22, h - 22], [w / 2, 22], [w / 2, h - 22]]) { x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.fill(); } // Ösen
      for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(60,45,25,${Math.random() * .25})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 3 + Math.random() * 16, 0, 7); x.fill(); } }, 256);
    tarp.material.transparent = false; tarp.material.alphaTest = 0; tarp.material.roughness = .55; tarp.rotation.x = -PI / 2; tarp.position.set(P.x, .03, P.z); tarp.renderOrder = 1; scene.add(tarp); N.tarp = tarp;
    N.tarpStones = new T.Group(); scene.add(N.tarpStones);
    try { const sp = bu_spaten(), sx = P.x + .98, sz = P.z + .5, hh = N.mound ? bu_strahl(N.mound, sx, 2, sz, 0, -1, 0, 4) : null, sy = hh ? hh.p.y : .25;  // Spaten im Erdhügel neben der Plane
      sp.position.set(sx, sy - .13, sz); sp.rotation.set(.11, 1.1, -.16, 'YXZ'); N.tarpStones.add(sp); N.spaten = sp; } catch (e) { console.warn('Basis-Umsetzung Spaten', e); }
    try { const r = await MSL.gl.loadAsync('assets/boulder/model.gltf'); const b = new T.Box3().setFromObject(r.scene), sz = Math.max(...b.getSize(new T.Vector3()).toArray());
      for (const [dx, dz, s] of [[-.6, -1.12, .2], [.6, -1.1, .17], [-.62, 1.1, .19], [.58, 1.13, .22], [.63, 0, .15], [-.64, .05, .16]]) { const k = r.scene.clone(true); k.scale.setScalar(s / sz); const g = msGround(k); g.position.set(P.x + dx, .02, P.z + dz); g.rotation.y = Math.random() * 6; g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); N.tarpStones.add(g); } } catch (e) { console.warn('Plane: Steine', e); }
    const hit = box(1.2, .3, 2.2, P.x, .15, P.z, hidden, { cast: false }); N.tarpHit = hit;
    interact(hit, 'Grüne Plane', () => { toast('Die Plane liegt straff. Ordentlich beschwert, Stein an Stein. Darunter ist es tiefer als der Boden.', 4200); setTimeout(() => subtitle('Wer beschwert eine Plane so ordentlich?', 3000, 'LUKE'), 900); ausbau_nord_quest('names'); }); }
  // ---- Spielhaus (Gartenhaus-Scan) mit Tafel, Kreide EISEN IST FREI am Schaukelgerüst, Kreidelinie OCHS AM BERG
  { const src = await msModel('shed_garden', 'model.glb').catch(() => null); if (src) { const o = src.clone(true); msFit(o, 2.2); const g = msGround(o); g.position.set(38.9, 0, 75.6); g.rotation.y = -2.3; g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(g); g.updateMatrixWorld(true); N.spielhaus = g;
      // Tafel an der Wand, die zum Karussell zeigt (Strahl vom Karussell aus)
      const rc = new T.Raycaster(new T.Vector3(34.6, 1.05, 71.4), new T.Vector3(38.9 - 34.6, 0, 75.6 - 71.4).normalize(), 0, 9); const h = rc.intersectObject(g, true)[0];
      if (h) { const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); n.y = 0; n.normalize(); if (n.dot(rc.ray.direction) > 0) n.negate();
        const taf = ausbau_nord_paper(.9, .62, (x, w, h2) => { x.fillStyle = '#1d2420'; x.fillRect(0, 0, w, h2); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(200,210,200,${Math.random() * .05})`; x.fillRect(Math.random() * w, Math.random() * h2, 6 + Math.random() * 30, 2); }
          x.strokeStyle = '#5a4630'; x.lineWidth = 16; x.strokeRect(8, 8, w - 16, h2 - 16); const c = 'rgba(232,230,220,.82)';
          hand(x, 'Ochs am Berg, eins, zwei, drei,', 40, 90, 44, c, -.01); hand(x, 'wer sich rührt, ist nicht mehr frei.', 40, 150, 44, c, .01); hand(x, 'Wer sich rührt, der muss zurück,', 40, 210, 44, c, -.015); hand(x, 'wer am Eisen hält, hat Glück.', 40, 270, 44, c, .005);
          x.fillStyle = 'rgba(240,238,230,.9)'; for (const [dx, dy] of [[0, 0], [-16, 26], [16, 26]]) { x.beginPath(); x.arc(w * .72 + dx, h2 - 70 + dy, 6, 0, 7); x.fill(); } // ∴
          x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .18})`; x.fillRect(Math.random() * w, Math.random() * h2, 40 + Math.random() * 80, 10 + Math.random() * 30); } }, 512);
        taf.material.transparent = false; taf.material.alphaTest = 0; taf.position.copy(h.point).addScaledVector(n, .012); taf.position.y = 1.1; taf.rotation.y = Math.atan2(n.x, n.z); scene.add(taf);
        const th = box(.9, .7, .3, taf.position.x, 1.1, taf.position.z, hidden, { cast: false });
        interact(th, 'Tafel am Spielhaus', () => openNote('Die Tafel am Spielhaus', '<span class="hand">Ochs am Berg, eins, zwei, drei,<br>wer sich rührt, ist nicht mehr frei.<br>Wer sich rührt, der muss zurück,<br>wer am Eisen hält, hat Glück.</span>\n\nKinderschrift, verwischt. Darunter, frischer: ∴', 'nord_tafel', () => { ausbau_nord_quest('baer'); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('R-ochs'); } catch (e) {} })); } } }
  { const kr = (w, h, draw) => { const m = ausbau_nord_paper(w, h, draw, 512); m.material.depthWrite = false; m.rotation.x = -PI / 2; m.userData.noCol = true; return m; };
    const eisen = kr(1.9, .38, (x, w, h) => { x.clearRect(0, 0, w, h); hand(x, 'EISEN IST FREI', 18, h * .72, 72, 'rgba(236,232,214,.85)', -.02); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 140; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .5})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 0, 7); x.fill(); } });
    eisen.position.set(40.6, .035, 77.4); eisen.rotation.z = PI; scene.add(eisen);
    const ochs = kr(3.2, .42, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(236,232,214,.75)'; x.lineWidth = 6; x.beginPath(); x.moveTo(6, h - 12); x.lineTo(w - 6, h - 16); x.stroke(); hand(x, 'EINS, ZWEI, DREI – OCHS AM BERG', 14, h * .6, 52, 'rgba(236,232,214,.82)');
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(0,0,0,${Math.random() * .55})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 8, 0, 7); x.fill(); } });
    ochs.position.set(24.6, .034, 69.1); scene.add(ochs);
    const eh = box(1.8, .2, .5, 40.6, .1, 77.4, hidden, { cast: false }); interact(eh, 'Kreide am Schaukelgerüst', () => toast('EISEN IST FREI. In Kreide, vor den Pfosten des Gerüsts. Die Buchstaben sind groß, als hätte jemand gewollt, dass man sie von weitem liest.', 4800)); }
  N.ochs = { aktiv: false, n: 0, t: 0, frei: 0, look: 0, sagte: false };
  // ---- Bushaltestelle: vier Plakatschichten (2009 · 1992 · 1975 · 1958), dahinter SB-03
  { const plak = (jahr, farbe, zeilen, ecke) => ausbau_nord_paper(.62, .86, (x, w, h) => { x.fillStyle = farbe; x.fillRect(0, 0, w, h); for (let i = 0; i < 1600; i++) { x.fillStyle = `rgba(80,60,30,${Math.random() * .07})`; x.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      x.fillStyle = '#1a1a1a'; x.textAlign = 'center'; x.font = 'bold 64px Georgia'; x.fillText('SOMMERFEST', w / 2, 96); x.font = 'bold 54px Georgia'; x.fillText(jahr, w / 2, 160); x.font = '28px Georgia'; zeilen.forEach((l, i) => x.fillText(l, w / 2, 230 + i * 38));
      for (let k = 0; k < 7; k++) { const cx = 70 + k * (w - 140) / 6, cy = h - 170; x.fillStyle = '#2a2420'; x.beginPath(); x.arc(cx, cy, 14, 0, 7); x.fill(); x.fillRect(cx - 12, cy + 12, 24, 50); x.fillStyle = '#e8a030'; x.beginPath(); x.arc(cx + 18, cy - 30, 10, 0, 7); x.fill(); x.strokeStyle = '#2a2420'; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + 10, cy + 20); x.lineTo(cx + 18, cy - 20); x.stroke(); }
      if (ecke) ecke(x, w, h);
      const g = x.createRadialGradient(w / 2, h / 2, w * .2, w / 2, h / 2, w * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(70,50,20,.45)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 26; i++) { x.fillStyle = 'rgba(0,0,0,.9)'; const ex = Math.random() < .5 ? 0 : w - 30 - Math.random() * 40; x.fillRect(ex, Math.random() * h, 20 + Math.random() * 50, 10 + Math.random() * 40); } }, 512);
    const P58 = plak('1958', '#d8c89a', ['Lampionumzug für die Kleinen'], (x, w, h) => { x.strokeStyle = '#a01818'; x.lineWidth = 5; x.beginPath(); x.arc(70 + 6 * (w - 140) / 6 + 20, h - 90, 16, 0, 7); x.arc(70 + 6 * (w - 140) / 6 - 12, h - 90, 16, 0, 7); x.stroke(); });
    const P75 = plak('1975', '#e2d4b0', ['Schützenkapelle · Lampions'], (x, w, h) => { const cx = 70 + 3 * (w - 140) / 6, cy = h - 170; x.fillStyle = '#6a4a2a'; x.beginPath(); x.arc(cx, cy - 2, 14.5, PI, 0); x.fill(); x.fillStyle = '#2a2420'; x.beginPath(); x.arc(cx + 3, cy - 3, 12, PI * 1.05, PI * 1.9); x.fill(); x.strokeStyle = '#efe2c4'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(cx - 3, cy - 15); x.lineTo(cx - 7, cy - 3); x.stroke(); }); // das Kind mit dem Scheitel (Schulfoto aus Nr. 4)
    const P92 = plak('1992', '#e8dcc0', ['Lampionumzug'], (x, w, h) => { x.fillStyle = '#e8e4d8'; x.fillRect(w - 160, h - 110, 130, 60); x.fillStyle = '#b01818'; x.fillRect(w - 102, h - 104, 6, 26); x.fillRect(w - 110, h - 96, 22, 6); });
    const P09 = plak('27. Juli 2009', '#f0e8d2', ['Lampions für die Kleinen', '(solange Vorrat reicht)']);
    const Z = 51.965, X = 11.15, Y = 1.32; const L = [[P58, 0, 0, 0], [P75, .02, -.01, .004], [P92, -.015, .012, .008], [P09, .01, .004, .012]];
    for (const [m, dx, dy, dz] of L) { m.position.set(X + dx, Y + dy, Z + dz); m.material.transparent = true; scene.add(m); } N.plakate = { P58, P75, P92, P09, X, Y, Z };
    N.plakatHit = box(.7, .95, .3, X, Y, Z + .1, hidden, { cast: false });
    interact(N.plakatHit, () => N.plakat ? 'Die Ritze hinter dem Plakat' : (N.plakatGelesen ? 'Das feuchte Plakat von 1958 ablösen' : 'Plakate lesen'), () => ausbau_nord_plakat()); }
  // ---- Praxis Dr. Seiler, Am Kirchberg 5 (Haus 13): Emailschild, Seitenfenster mit Messlatte und Kittel, Schaukasten (AG-04), Vermisstenplakat
  { const hx = -38, fz = 45.5 + 4.5; N.praxis = { hx, fz };
    const schild = ausbau_nord_paper(.42, .3, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#f2f0ea'); g.addColorStop(1, '#d8d4c8'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = '#1a2a5a'; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24);
      x.fillStyle = '#1a2a5a'; x.textAlign = 'center'; x.font = 'bold 44px Georgia'; x.fillText('Dr. med. Th. Seiler', w / 2, 110); x.font = '34px Georgia'; x.fillText('Allgemeinmedizin', w / 2, 168); x.font = 'italic 30px Georgia'; x.fillText('Vorsorge donnerstags', w / 2, 226);
      for (let i = 0; i < 14; i++) { x.fillStyle = `rgba(60,40,20,${Math.random() * .4})`; x.beginPath(); x.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 7, 0, 7); x.fill(); } }, 512);
    schild.material.transparent = false; schild.material.roughness = .3; schild.position.set(hx - 1.05, 1.55, fz + .07); scene.add(schild);
    interact(box(.5, .4, .2, hx - 1.05, 1.55, fz + .15, hidden, { cast: false }), 'Emailschild', () => { ausbau_nord_quest('strich'); toast('„Dr. med. Th. Seiler · Allgemeinmedizin · Vorsorge donnerstags.“ Das Emaille ist blank geputzt.', 4200); setTimeout(() => subtitle('Vorsorge donnerstags. Für was, hat er nicht dazugeschrieben.', 3400, 'LUKE'), 1500); });
    // Seitenfenster neben der Tür: Flur mit Messlatte, weißer Kittel am Haken (zwei Zustände für den Schreck)
    const flur = hakenPos => ausbau_nord_paper(.36, 1.1, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#07080a'); g.addColorStop(1, '#0e0d0c'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#3a2e22'; x.fillRect(w * .18, h * .08, w * .14, h * .84); x.fillStyle = '#c8b890'; for (let i = 0; i < 40; i++) { const y = h * .1 + i * (h * .8) / 40; x.fillRect(w * .18, y, w * (i % 5 ? .05 : .09), 2); }
      x.fillStyle = 'rgba(30,30,90,.9)'; x.font = '15px Caveat, cursive'; ['ROXY', 'HEIDI', 'MIKE', 'DINA', 'LUCY', 'LUKE B.', 'ZAYN'].forEach((n, i) => x.fillText(n, w * .34, h * .55 + i * 14 - (i % 3) * 3)); x.fillRect(w * .18, h * .49, w * .16, 2);
      x.fillStyle = '#6a6458'; for (let k = 0; k < 3; k++) x.fillRect(w * .6, h * .18 + k * h * .09, w * .1, 5); // Haken
      const hy = h * .18 + hakenPos * h * .09; x.fillStyle = 'rgba(214,210,196,.82)'; x.beginPath(); x.moveTo(w * .6, hy); x.lineTo(w * .82, hy + h * .08); x.lineTo(w * .86, hy + h * .5); x.lineTo(w * .48, hy + h * .52); x.lineTo(w * .5, hy + h * .08); x.fill();
      const v = x.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, h * .6); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.8)'); x.fillStyle = v; x.fillRect(0, 0, w, h); }, 256);
    const f0 = flur(0), f1 = flur(1); for (const f of [f0, f1]) { f.material.transparent = false; f.material.roughness = .12; f.material.metalness = .1; f.position.set(hx + 1.02, 1.55, fz + .075); scene.add(f); } f1.visible = false; N.flur = [f0, f1];
    const rahmen = await msModel('window').catch(() => null); if (rahmen) { const r = rahmen.clone(true); r.scale.set(.32, .58, .6); const g = msGround(r); g.position.set(hx + 1.02, .98, fz + .06); scene.add(g); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); }
    N.flurHit = box(.5, 1.2, .3, hx + 1.02, 1.55, fz + .2, hidden, { cast: false }); interact(N.flurHit, 'Durchs Flurfenster sehen', () => ausbau_nord_messlatte());
    // Schaukasten in der Gasse (Scan-Schild, Glas gesprungen, innen sauber) – AG-04 · Aushang A
    const aus = ausbau_nord_paper(.58, .44, (x, w, h) => { x.fillStyle = '#efece2'; x.fillRect(0, 0, w, h); x.fillStyle = '#222'; x.font = 'bold 22px Arial'; x.fillText('Bundesstelle für Rückführung', 24, 44); x.font = '17px Arial';
      ['Außenstelle Lost Eyengless (in Abwicklung)', '', 'Bürgersprechstunde donnerstags 14–16 Uhr', 'Ahornstraße 7, Eingang Keller', 'Bitte Einwilligung mitbringen.', 'Es besteht kein Anlass zur Sorge.'].forEach((l, i) => x.fillText(l, 24, 84 + i * 30));
      x.strokeStyle = '#333'; x.lineWidth = 2; x.beginPath(); x.ellipse(w - 50, h - 42, 16, 8, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(w - 50, h - 42, 3, 0, 7); x.fill(); hand(x, 'auch 2026', w - 190, 82, 30, 'rgba(20,30,110,.9)', -.05);
      x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(w * .1, 0); x.lineTo(w * .35, h * .5); x.lineTo(w * .3, h); x.moveTo(w * .35, h * .5); x.lineTo(w * .7, h * .62); x.stroke(); }, 512);
    ausbau_nord_board(psignP, -9.4, 49.2, PI / 2, aus);
    const vp = ausbau_nord_paper(.3, .42, (x, w, h) => { x.fillStyle = '#e8e2cc'; x.fillRect(0, 0, w, h); x.fillStyle = '#b01818'; x.textAlign = 'center'; x.font = 'bold 50px Arial'; x.fillText('VERMISST', w / 2, 64); x.fillStyle = '#6a5a4a'; x.fillRect(w * .25, 90, w * .5, h * .38); x.fillStyle = '#222'; x.font = 'bold 34px Arial'; x.fillText('ZAYN WENDT, 7 J.', w / 2, h * .66);
      x.font = '22px Arial'; x.fillText('seit 28.7.2009', w / 2, h * .72); x.fillText('Hinweise: 0 56 13 / 4 12 07', w / 2, h * .8); x.strokeStyle = 'rgba(20,30,100,.9)'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * .22, h * .79); x.lineTo(w * .82, h * .8); x.stroke(); hand(x, '0 56 13 / 7 03 13', w * .18, h * .9, 36, 'rgba(20,30,110,.9)', -.03);
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,230,.35)'); g.addColorStop(1, 'rgba(90,70,40,.3)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 384);
    vp.position.set(-9.33, 1.3, 50.05); vp.rotation.y = PI / 2; vp.rotation.z = .04; scene.add(vp);
    const sk = box(.3, 1, .9, -9.4, 1.5, 49.2, hidden, { cast: false }); interact(sk, 'Schaukasten', () => ausbau_nord_schaukasten()); }
  N.f3 = true;
}
// „Ochs am Berg“: Bärli bewegt sich nur, wenn Luke nicht hinsieht; hält Luke sich am Eisen (Schaukelgerüst) fest, rührt er sich nicht
const ausbau_nord_v = new THREE.Vector3();
function ausbau_nord_ochsTick(dt, P, T) { const N = ausbau_nord, O = N.ochs; if (O.n >= 10) return;
  const g = T.g, d = Math.hypot(P.x - g.position.x, P.z - g.position.z); if (d > 26) { O.t = 0; return; }
  ausbau_nord_v.set(g.position.x - camera.position.x, g.position.y + .2 - camera.position.y, g.position.z - camera.position.z).normalize(); const sieht = fwd.dot(ausbau_nord_v) > .55;
  const eisen = Math.hypot(P.x - 40.6, P.z - 78.8) < 1.9; // am Gerüst festhalten = in Reichweite der Pfosten
  if (sieht) { if (O.wartet) { O.wartet = false; if (O.n === 1 && !O.sagte) { O.sagte = true; subtitle('… Ich spiel mit einem Teddy Ochs am Berg.', 3000, 'LUKE'); } } O.t = 0; O.frei = 0; return; }
  if (eisen) { O.frei += dt; if (O.frei > 6 && !O.freiGesehen) { O.freiGesehen = true; if (typeof sammeln_fibel === 'function') try { sammeln_fibel('R-eisen'); sammeln_fibel('R-frei'); } catch (e) {} questPop('FIBEL', 'Eisen ist frei. Stand da. Stimmt.'); } return; }
  O.t += dt; if (O.t < 2.2 || d < 1.4) return; O.t = 0;
  // einen Schritt näher, auf eine Stelle, die Luke gerade nicht sieht
  const k = O.n === 9 ? 1 : .34, tx = g.position.x + (P.x - g.position.x) * k, tz = g.position.z + (P.z - g.position.z) * k, fx = O.n === 9 ? P.x + Math.sin(player.yaw) * -.55 : tx, fz = O.n === 9 ? P.z + Math.cos(player.yaw) * -.55 : tz;
  ausbau_nord_v.set(fx - camera.position.x, .2 - camera.position.y, fz - camera.position.z).normalize(); if (O.n < 9 && fwd.dot(ausbau_nord_v) > .35) return;
  let gy = 0; try { const s = solidGround(fx, 1.2, fz); if (s > -1 && s < 1) gy = Math.max(0, s); } catch (e) {}
  g.position.set(fx, gy + .01, fz); g.rotation.set(0, Math.atan2(P.x - fx, P.z - fz), 0); O.n++; O.wartet = true; N.bear = 'moved'; Audio.play('stones1', { gain: .04, rate: 3, dur: .15, x: fx, y: .1, z: fz, ref: 1 });
  if (O.n === 1 && !O.erst) { O.erst = true; setTimeout(() => subtitle('Ich spiel nicht mit einem Teddy Ochs am Berg. Ich bin sechsundzwanzig.', 3400, 'LUKE'), 400); }
  if (O.n >= 10) { g.rotation.set(PI / 2, player.yaw, 0); g.position.y = gy + .09; N.bear = 'feet'; interact(T.hit, 'Bärli aufheben', () => ausbau_nord_teddy()); } // liegt vor Lukes Füßen, Gesicht nach unten
  kirchberg_desc('nord_baer', `Bärli bewegt sich nur, wenn du nicht hinsiehst. (${O.n})`); ausbau_nord_save(); }
async function ausbau_nord_plakat() { const N = ausbau_nord; ausbau_nord_quest('plakat');
  if (N.plakat) return toast(typeof sammeln_hatSB === 'function' && sammeln_hatSB(3) ? 'Nur die Ritze. Die Seite ist in deiner Tasche.' : 'In der Ritze steckt ein gefaltetes Blatt.', 3000);
  if (!N.plakatGelesen) { N.plakatGelesen = true; openNote('Plakate an der Rückwand', 'Vier Schichten übereinander, jede feuchter als die darüber:\n\n<b>2009:</b> SOMMERFEST · 27. Juli · Lampions für die Kleinen (solange Vorrat reicht), sieben Kinder vorn.\n<b>1992:</b> SOMMERFEST · Lampionumzug, sieben Kinder, hinten ein VW-Bus mit Kirchenkreuz.\n<b>1975:</b> SOMMERFEST · Schützenkapelle · Lampions, sieben Kinder, eins mit dem Scheitel vom Schulfoto aus Nr. 4.\n<b>1958:</b> SOMMERFEST · Lampionumzug für die Kleinen, sieben Kinder, eins mit rotem Kinderrad.', 'nord_plakate',
      async () => { await say([['Achtundfünfzig. Fünfundsiebzig. Zweiundneunzig. Zweitausendneun.', 4200, 'LUKE']]); await wait(900); await say([['Siebzehn.', 1600, 'LUKE']]); await wait(700); await say([['Sieben Lampions. Solange Vorrat reicht.', 3000, 'LUKE']]); ausbau_nord_plakatCheck(); }); return; }
  N.plakat = 1; ausbau_nord_plakatAb(false); ausbau_nord_save(); Audio.paper(); toast('Das Plakat von 1958 löst sich nass und schwer. Dahinter, in einer Ritze im Beton: ein gefaltetes Blatt.', 4200); }
function ausbau_nord_plakatAb(still) { const N = ausbau_nord, P = N.plakate; if (!P) return; P.P58.visible = P.P75.visible = P.P92.visible = false; P.P09.visible = !!N.plakatZu; P.P09.scale.set(.55, .45, 1); P.P09.position.set(P.X + .16, P.Y + .22, P.Z + .012); P.P09.rotation.z = .35; ausbau_nord_sb03(); }
function ausbau_nord_sb03() { const N = ausbau_nord; if (typeof sammeln_platz !== 'function' || typeof sammeln_S === 'undefined' || !sammeln_S.orte) return; const P = N.plakate || { X: 11.15, Y: 1.32, Z: 51.965 };
  sammeln_platz('SB-03', N.plakat ? { x: P.X - .05, y: P.Y - .12, z: P.Z + .03, wand: 1, label: 'In der Ritze hinter dem Plakat' } : { x: P.X, y: -40, z: P.Z, wand: 1, label: 'In der Ritze hinter dem Plakat' }); }
function ausbau_nord_plakatCheck() { const N = ausbau_nord; const q = story.side.nord_plakat; if (!q || q.state === 'done') return; const sb = typeof sammeln_hatSB === 'function' && sammeln_hatSB(3);
  kirchberg_desc('nord_plakat', `Fahrplan, vier Plakate, die Ritze hinter 1958. ${sb ? 'Die Seite ist gefunden.' : ''}`);
  if (N.plakatGelesen && sb && story.lore.some(l => l.key === 'nord_fahrplan')) { sideDone('nord_plakat', 'Achtundfünfzig. Fünfundsiebzig. Zweiundneunzig. Zweitausendneun. Siebzehn.'); story.lore.push({ key: 'nord_siebzehn', title: 'Siebzehn', html: 'Vier Sommerfeste, vier Plakate, jedes siebzehn Jahre nach dem letzten. Sieben Lampions, solange Vorrat reicht.' }); } }
function ausbau_nord_messlatte() { const N = ausbau_nord; if (typeof kirchberg_ab === 'function' && !kirchberg_ab('nord_strich')) return toast('Durchs Flurfenster: ein dunkler Flur. Ein weißer Kittel am Haken. Sonst nichts.', 3000); // H-6: die Messlatte erst ab Kap. 4
  ausbau_nord_quest('strich');
  const an = typeof flashOn !== 'undefined' ? flashOn : true; if (!an) return toast('Hinter dem Glas ist es schwarz. Mit der Lampe vielleicht.', 2600);
  N.flurN = (N.flurN || 0) + 1;
  if (N.flurN === 1) { openNote('Die Messlatte', 'Durchs Flurfenster: eine Messlatte aus Holz, an die Wand geschraubt. Sieben Namen, alle mit „23.7.09“:\nROXY, HEIDI, MIKE, DINA, LUCY, LUKE B., ZAYN.\n\nEtwas abseits ein Strich ohne Namen. Nur: <b>6.8.09</b>.\n\nDaneben, am Haken, ein weißer Kittel.', 'nord_messlatte',
    () => { subtitle('Einer ohne Namen. Sechster August. … Das bin ich.', 3400, 'LUKE'); ausbau_nord_strichCheck(); }); return; }
  if (N.flurN === 2 && N.flur) { N.flur[0].visible = false; N.flur[1].visible = true; Audio.play('woodSqueak2', { gain: .08, rate: 1.6, x: N.praxis.hx + 1, y: 1.5, z: N.praxis.fz, ref: 1 }); return toast('Der Kittel hängt einen Haken weiter.', 3200); }
  toast('Die Messlatte. Der Strich ohne Namen. Der Kittel hängt, wo er hängt.', 3000); }
async function ausbau_nord_schaukasten() { const N = ausbau_nord; /* H-6: der Schaukasten (AG-04) bleibt in Kap. 1 und gehört nicht mehr zur Aufgabe „Der Strich ohne Namen“ */ if (N.ag04) return openNote('Schaukasten · Bürgersprechstunde', 'Bundesstelle für Rückführung, Außenstelle Lost Eyengless (in Abwicklung). Bürgersprechstunde donnerstags 14–16 Uhr, Ahornstraße 7, Eingang Keller. Bitte Einwilligung mitbringen. Es besteht kein Anlass zur Sorge.\n\nDarunter klein das Auge. Mit Kuli: <span class="hand">auch 2026</span>', 'nord_ag04');
  N.ag04 = true; if (typeof lwo_szene === 'function') { await lwo_szene('AG-04', { at: { x: -9.4, z: 49.2 }, radius: 9 }); } else { openNote('Schaukasten', 'Bundesstelle für Rückführung … Bürgersprechstunde donnerstags … Ahornstraße 7, Eingang Keller.', 'nord_ag04'); }
  if (typeof lwo_ereignis === 'function') try { lwo_ereignis('AG-04'); } catch (e) {} ausbau_nord_strichCheck(); }
function ausbau_nord_strichCheck() { const N = ausbau_nord; if (N.flurN) { const q = story.side.nord_strich; if (q && q.state !== 'done' && q.state !== 'hidden') { sideDone('nord_strich', 'Ein Bleistiftstrich ohne Namen, abseits der sieben. Nur „6.8.09“.'); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('D-strich'); } catch (e) {} } } }
function ausbau_nord_f3Tick(dt, P) { const N = ausbau_nord; if (!N.f3) return;
  if (!N.sb03Fix && typeof sammeln_S !== 'undefined' && sammeln_S.orte && sammeln_S.orte['SB-03']) { N.sb03Fix = true; ausbau_nord_sb03(); }
  if (N.plakat && N.sb03Fix && !N.plakatZu && typeof sammeln_hatSB === 'function' && sammeln_hatSB(3)) { ausbau_nord_plakatCheck(); // Schreck Stufe 1: das Plakat von 2009 blättert sich hinter Luke wieder zu
    const d = Math.hypot(P.x - 11.15, P.z - 52.4); ausbau_nord_v.set(11.15 - camera.position.x, 1.3 - camera.position.y, 51.97 - camera.position.z).normalize();
    if (d > 3 && d < 12 && fwd.dot(ausbau_nord_v) < -.2) { N.zuT = (N.zuT || 0) + dt; if (N.zuT > 2) { N.plakatZu = true; const Pl = N.plakate; Pl.P09.visible = true; Pl.P09.scale.set(1, 1, 1); Pl.P09.rotation.z = 0; Pl.P09.position.set(Pl.X + .01, Pl.Y + .004, Pl.Z + .012); if (Audio.ctx) { const pd = Audio.at(Pl.X, Pl.Y, Pl.Z, 1); if (!Audio.cut) for (let i = 0; i < 4; i++) { const n = Audio.noise(false), bp = Audio.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2000, 5000); bp.Q.value = 3; n.connect(bp); Audio.env(bp, .12, .01, .05, i * .05, pd); n.stop(Audio.ctx.currentTime + .5); } } Audio.play('woodSqueak1', { gain: .05, rate: 2, x: 11.15, y: 1.3, z: 52, ref: 1 }); } } else N.zuT = 0; }
  // Plane: bis Kapitel 3 (dann AG-16 / AP-18)
  const zu = !kapAb(3); if (N.tarp && N.tarp.visible !== zu) { N.tarp.visible = zu; N.tarpStones.visible = zu; if (N.tarpHit) { const i = interactables.indexOf(N.tarpHit); if (zu && i < 0) interactables.push(N.tarpHit); else if (!zu && i >= 0) interactables.splice(i, 1); } } }
