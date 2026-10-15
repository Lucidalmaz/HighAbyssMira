// =====================================================================  ZUSAMMENFÜHREN (Modul „merge“, Leistung 15.10.2026)
// Ein Fahrzeug (Sketchfab/Fab-Sedan) besteht aus 92–94 Einzelmeshes mit je eigenem Material = 70+ Zeichenaufrufe je Wagen (gemessen: ≈ 25 µs je statischem
// opakem Mesh, Hauptthread-gebunden). Dieses Modul legt für „Modellwurzeln“ (Gruppen mit 25–400 Meshes ohne Figuren/Instanzen/Lichter) aus allen statischen,
// opaken Teilen gleicher Material-Signatur je EIN zusammengeführtes Mesh an (Geometrie in der Wurzel-Lokalstruktur, Kind der Wurzel).
// Die Originale bleiben unverändert im Szenengraphen (Kollision, Klick, Logik, Strahltests sehen nichts): nur im Zeichenaufruf (zwischen rigFarHide und
// rigFarShow der Hauptschleife) werden die Originale ausgeblendet und das zusammengeführte Mesh eingeblendet – und nur, wenn die Gültigkeitsprüfung besteht
// (alle Teile sichtbar, gleiches Elternteil, gleiche Lage relativ zur Wurzel, gleiche Material-Werte, gleiche Schattenmarken). Sonst zeichnen die Originale wie vorher.
// Ausgeschlossen: Teile mit Namen Tür/Haube/Klappe/Rad/Lenk/Griff/Spiegel, Glas/Leuchten/emissiv/transparent, Skinning, Instanzen, eigene onBeforeRender-Haken,
// negative Determinante, Kleinteile der Schatten-Diät (SMALL_T/SMALL_M). Aus: ?nomerge. Testzugriff window.__mrg.
const MRG = { on: !/nomerge/.test(location.search), units: [], seen: new WeakSet(), q: [], scanT: 0, scanI: 0, t: 0, n: 0, hid: [], stat: { units: 0, members: 0, merged: 0, invalid: 0, active: 0 } };
const MRG_SKIP = /door|hood|bonnet|trunk|boot|tailgate|lid\b|flap|wheel|tire|tyre|steer|handle|mirror|drawer|glass|window|light|lamp|lens|screen|wiper/i;
const MRG_V = new THREE.Vector3(), MRG_M = new THREE.Matrix4(), MRG_N = new THREE.Matrix3(), MRG_INV = new THREE.Matrix4();
function mrg_state(m, o) { const c = m.color, e = m.emissive; o[0] = c ? c.r : 0; o[1] = c ? c.g : 0; o[2] = c ? c.b : 0; o[3] = e ? e.r : 0; o[4] = e ? e.g : 0; o[5] = e ? e.b : 0; o[6] = m.emissiveIntensity ?? 0; o[7] = m.roughness ?? 0;
  o[8] = m.metalness ?? 0; o[9] = m.opacity; o[10] = m.transparent ? 1 : 0; o[11] = m.side; o[12] = m.alphaTest || 0; o[13] = m.envMapIntensity ?? 0; o[14] = m.visible ? 1 : 0; o[15] = m.depthWrite ? 1 : 0; return o; }
function mrg_maps(m) { return [m.map, m.normalMap, m.roughnessMap, m.metalnessMap, m.aoMap, m.emissiveMap, m.alphaMap, m.envMap, m.bumpMap, m.lightMap]; }
function mrg_sig(m) { const s = mrg_state(m, new Float64Array(16)), mp = mrg_maps(m).map(t => t ? (t.source ? t.source.uuid : t.uuid) + '@' + t.repeat.x + ',' + t.repeat.y + ',' + t.offset.x + ',' + t.offset.y + ',' + t.rotation : '');
  return [m.type, Array.from(s).join(','), mp.join('|'), m.vertexColors ? 1 : 0, m.flatShading ? 1 : 0, m.alphaToCoverage ? 1 : 0, m.polygonOffset ? 1 : 0, m.customProgramCacheKey ? m.customProgramCacheKey() : '', m.userData && m.userData.w ? 'w' : '',
    Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') ? 'oc' + m.onBeforeCompile.toString().length : '', m.defines ? JSON.stringify(m.defines) : ''].join('#'); }
function mrg_ok(m, smallSet) {
  if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || m.isBatchedMesh || !m.visible || m.frustumCulled === false) return false; const mt = m.material;
  if (!mt || Array.isArray(mt) || !(mt.isMeshStandardMaterial || mt.isMeshLambertMaterial || mt.isMeshPhongMaterial) || mt.isShaderMaterial || mt.transparent || mt.opacity < 1 || !mt.visible || mt.alphaTest > 0 || mt.alphaHash || mt.wireframe) return false;
  if (mt.emissive && mt.emissiveIntensity > 0 && (mt.emissive.r + mt.emissive.g + mt.emissive.b) > 0) return false;
  if (MRG_SKIP.test(m.name || '') || MRG_SKIP.test(mt.name || '')) return false;
  if (m.onBeforeRender !== THREE.Object3D.prototype.onBeforeRender || m.onAfterRender !== THREE.Object3D.prototype.onAfterRender || m.customDepthMaterial || m.customDistanceMaterial) return false;
  const g = m.geometry; if (!g || !g.attributes.position || !g.attributes.normal || g.attributes.position.isInterleavedBufferAttribute || (g.morphAttributes && Object.keys(g.morphAttributes).length) || g.attributes.skinIndex) return false;
  if (g.groups && g.groups.length > 1) return false; if (Math.abs(m.matrixWorld.determinant()) < 1e-12) return false; return true; }
function mrg_cnt(n) { let c = 0, bad = false; n.traverse(x => { if (x.isMesh) c++; if (x.isLight || x.isCamera || x.isSkinnedMesh || x.isInstancedMesh || x.isSprite) bad = true; }); return [c, bad]; }
MRG.nx = new WeakMap();
function mrg_walk(n, d, out) { if (MRG.seen.has(n) || n.isMesh || n.isLight || d > 5 || !n.visible) return; if ((MRG.nx.get(n) || 0) > MRG.t) return; MRG.nx.set(n, MRG.t + 90); const [c, bad] = mrg_cnt(n); // Wurzel = höchste Ebene mit 25–400 Meshes ohne Figuren/Instanzen/Lichter
  if (c >= 25 && c <= 400 && !bad) { out.push(n); return; } if (c > 400 || bad) for (const k of n.children) mrg_walk(k, d + 1, out); }
function mrg_bake(R) {
  MRG.seen.add(R); const small = new Set(); try { for (const m of SMALL_T) small.add(m); for (const m of SMALL_M) small.add(m); } catch (e) {}
  if (R.matrixWorld.determinant() <= 0) return; MRG_INV.copy(R.matrixWorld).invert(); const parts = new Map();
  R.traverse(m => { if (!mrg_ok(m, small)) return; const g = m.geometry, mt = m.material;
    const key = mrg_sig(mt) + '|' + m.castShadow + m.receiveShadow + '|' + m.renderOrder + '|' + m.layers.mask + '|' + Object.keys(g.attributes).sort().join(',') + (g.index ? 'i' : 'n');
    let P = parts.get(key); if (!P) parts.set(key, P = { mat: mt, list: [] }); P.list.push(m); });
  const unit = { R, groups: [], nodes: new Set(), dead: false, bad: 0, t0: performance.now() }; let members = 0, merged = 0;
  for (const P of parts.values()) { if (P.list.length < 2) continue;
    let nv = 0, ni = 0; for (const m of P.list) { const g = m.geometry; nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    if (nv > 400000) continue; const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), hasUv = P.list.every(m => m.geometry.attributes.uv), uv = hasUv ? new Float32Array(nv * 2) : null, idx = new Uint32Array(ni);
    let vo = 0, io = 0;
    for (const m of P.list) { const g = m.geometry, a = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv; MRG_M.multiplyMatrices(MRG_INV, m.matrixWorld); MRG_N.getNormalMatrix(MRG_M); const flip = MRG_M.determinant() < 0;
      for (let i = 0; i < a.count; i++) { MRG_V.fromBufferAttribute(a, i).applyMatrix4(MRG_M); pos[(vo + i) * 3] = MRG_V.x; pos[(vo + i) * 3 + 1] = MRG_V.y; pos[(vo + i) * 3 + 2] = MRG_V.z;
        MRG_V.fromBufferAttribute(nn, i).applyMatrix3(MRG_N).normalize(); nor[(vo + i) * 3] = MRG_V.x; nor[(vo + i) * 3 + 1] = MRG_V.y; nor[(vo + i) * 3 + 2] = MRG_V.z; if (uv) { uv[(vo + i) * 2] = u.getX(i); uv[(vo + i) * 2 + 1] = u.getY(i); } }
      { const n = g.index ? g.index.count : a.count; for (let i = 0; i < n; i += 3) { const i0 = g.index ? g.index.getX(i) : i, i1 = g.index ? g.index.getX(i + 1) : i + 1, i2 = g.index ? g.index.getX(i + 2) : i + 2; idx[io++] = i0 + vo; idx[io++] = (flip ? i2 : i1) + vo; idx[io++] = (flip ? i1 : i2) + vo; } }
      vo += a.count; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    const Mg = new THREE.Mesh(geo, P.mat); const f = P.list[0]; Mg.name = 'mrg'; Mg.castShadow = f.castShadow; Mg.receiveShadow = f.receiveShadow; Mg.renderOrder = f.renderOrder; Mg.layers.mask = f.layers.mask;
    Mg.matrixAutoUpdate = false; Mg.visible = false; Mg.raycast = () => {}; Mg.userData.noCol = true; Mg.userData.noCull = true; Mg.userData.mrg = true;
    R.add(Mg); Mg.matrixWorld.copy(R.matrixWorld); Mg.matrixWorldNeedsUpdate = true;
    const G2 = { Mg, list: P.list, par: P.list.map(m => m.parent), mat: P.list.map(m => m.material), cs: f.castShadow, st: P.list.map(m => mrg_state(m.material, new Float64Array(16))), mp: P.list.map(m => mrg_maps(m.material)) };
    const nodes = new Set(); for (const m of P.list) for (let p = m; p && p !== R; p = p.parent) nodes.add(p); G2.nodeList = [...nodes]; G2.nTRS = G2.nodeList.map(mrg_trs);
    unit.groups.push(G2); members += P.list.length; merged++; }
  if (!unit.groups.length) return;
  MRG.units.push(unit); MRG.stat.units++; MRG.stat.members += members; MRG.stat.merged += merged; }
function mrg_trs(n) { if (n.matrixAutoUpdate) { const p = n.position, q = n.quaternion, s = n.scale; return new Float64Array([p.x, p.y, p.z, q._x, q._y, q._z, q._w, s.x, s.y, s.z]); } return new Float64Array(n.matrix.elements); }
function mrg_valid(G2) {
  const nl = G2.nodeList, tr = G2.nTRS;
  for (let i = 0; i < nl.length; i++) { const n = nl[i], c = tr[i]; if (!n.visible) return false;
    if (n.matrixAutoUpdate) { const p = n.position, q = n.quaternion, s = n.scale; if (c[0] !== p.x || c[1] !== p.y || c[2] !== p.z || c[3] !== q._x || c[4] !== q._y || c[5] !== q._z || c[6] !== q._w || c[7] !== s.x || c[8] !== s.y || c[9] !== s.z) return false; }
    else { const e = n.matrix.elements; if (c.length !== 16) return false; for (let k = 0; k < 16; k++) if (c[k] !== e[k]) return false; } }
  const tmp = MRG.tmp || (MRG.tmp = new Float64Array(16));
  { const L = G2.list;
    for (let i = 0; i < L.length; i++) { const m = L[i]; if (!m.visible || m.parent !== G2.par[i] || m.material !== G2.mat[i] || m.castShadow !== G2.cs) return false;
      const s = mrg_state(m.material, tmp), c = G2.st[i]; for (let k = 0; k < 16; k++) if (s[k] !== c[k]) return false;
      const mp = G2.mp[i]; if (m.material.map !== mp[0] || m.material.normalMap !== mp[1] || m.material.roughnessMap !== mp[2] || m.material.envMap !== mp[7]) return false; } }
  return true; }
function mrg_pre() {
  if (!MRG.on) return; const cx = camera.position.x, cz = camera.position.z; MRG.stat.active = 0;
  for (const U of MRG.units) { if (U.dead) continue; const R = U.R; if (!R.parent) { U.dead = true; continue; }
    const e = R.matrixWorld.elements, dx = e[12] - cx, dz = e[14] - cz; if (dx * dx + dz * dz > 140 * 140) continue;
    let any = false;
    for (const G2 of U.groups) { if (mrg_valid(G2)) { any = true; G2.bad = 0; MRG.stat.active++; for (const m of G2.list) { m.visible = false; MRG.hid.push(m); } G2.Mg.visible = true; MRG.vis.push(G2.Mg); } else G2.bad = (G2.bad | 0) + 1; }
    if (!any) { if (++U.bad > 240) { U.dead = true; mrg_drop(U); MRG.stat.invalid++; } } else U.bad = 0; } }
MRG.vis = [];
function mrg_post() { for (const m of MRG.hid) m.visible = true; MRG.hid.length = 0; for (const Mg of MRG.vis) Mg.visible = false; MRG.vis.length = 0; }
function mrg_drop(U) { for (const G2 of U.groups) { if (G2.Mg.parent) G2.Mg.parent.remove(G2.Mg); G2.Mg.geometry.dispose(); } try { MRG.seen.delete(U.R); setTimeout(() => { MRG.retry = (MRG.retry || 0) + 1; }, 0); } catch (e) {} }
if (MRG.on) {
  const hide0 = rigFarHide, show0 = rigFarShow;
  rigFarHide = function () { try { mrg_pre(); } catch (e) { MRG.on = false; mrg_post(); console.warn('Zusammenführen', e); } return hide0.apply(this, arguments); };
  rigFarShow = function () { try { mrg_post(); } catch (e) {} return show0.apply(this, arguments); };
  WORLD_MODS.push(['Zusammenführen', async () => {}]);
  WORLD_TICK.push((dt, t, indoor) => { if (!MRG.on || !state.started) return; MRG.t += dt;
    if (MRG.q.length) { if (MRG.t > MRG.nextT) { MRG.nextT = MRG.t + .1; const R = MRG.q.shift(); try { if (R.parent) mrg_bake(R); } catch (e) { console.warn('Zusammenführen: Bau', e); MRG.seen.add(R); } } return; }
    { const K = scene.children, out = []; for (let i = 0; i < 3 && K.length; i++) { const k = K[MRG.scanI++ % K.length]; try { mrg_walk(k, 0, out); } catch (e) {} }
      for (const R of out) if (!MRG.q.includes(R)) { const e = R.matrixWorld.elements, dx = e[12] - camera.position.x, dz = e[14] - camera.position.z; if (dx * dx + dz * dz < 160 * 160) MRG.q.push(R); } } });
  MRG.nextT = 0;
  window.__mrg = { MRG, cnt: mrg_cnt, walk: mrg_walk, ok: mrg_ok, off() { MRG.on = false; mrg_post(); }, an() { MRG.on = true; } };
}
