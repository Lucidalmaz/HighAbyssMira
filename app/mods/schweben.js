// =====================================================================  SCHWEBEN (Nutzer 10.10.2026: „Immer noch viele Dinge schweben – neben Tischen, neben Regalen, auf dem Boden“)
// Zentrale Funktion auf_flaeche(obj, x, z): bestimmt per Strahl die Fläche UNTER dem Objekt (Tisch, Regal, Bank, Boden – gleich welches Modul es dort hingestellt hat,
// auch Modelle mit gespiegeltem Wickelsinn: Strahlen gegen beide Seiten) und setzt die Unterkante (Bounding-Box) darauf.
// schweben_pass(): läuft einmal je betretenem Raum (WORLD_TICK) über alle kleinen Standrequisiten (Bücher, Geschirr, Radios, Fernseher, Teddys …) und senkt, was
// sicher schwebt (Fläche 3–12 cm darunter gefunden), auf diese Fläche ab. Hängende Dinge (Bilder, Lampen, Uhren, Schilder, Laternen) und alles ohne gefundene
// Auflage bleiben unberührt (kein „Fallenlassen auf den Boden“, wenn der Tisch nur nicht erkannt wurde).
// Prüfung/Messung: __schweben.pruefen() (Entwicklungsfassung) liefert je Einheit Lücke/Auflage; Protokoll in __schweben.log.
const SCHW = { log: [], done: new Set(), keys: new Map(), seen: new Set(), n: 0, t: 0, stats: { geprueft: 0, gesenkt: 0 } };
const SCHW_STEHT = /^(w_buch|lbook|album|w_teller|w_becher|w_tasse|w_besteck|w_blech|w_thermos|w_telefon|w_kamera|w_brot|w_urne|w_funk|w_lighter|w_kette|w_spieluhr|w_alarm|w_jacke|w_schwert|w_papierlaterne|geschirr|radio|crt|rekorder|messer|jerrycan|trashbag|teddy|doll|toys_old|brille|candles|kiffen|it_|haybale|pallet|album|beutel|ph_|shed_|giraffe|mirror)/;
const SCHW_HAENGT = /(frame|clock|schild|lantern|lamp|curtain|window|door|cross_hang|polaroid|foto|papier|zettel|poster|mirror|w_papierlaterne|w_schwert)/i;
function schweben_index() {
  for (const [k, p] of MSL.cache) { if (SCHW.seen.has(k) || !p || typeof p.then !== 'function') continue; SCHW.seen.add(k);
    p.then(s => { if (!s || !s.traverse) return; const key = k.replace(/^fbx:/, '').split('/')[0]; s.traverse(m => { if (m.isMesh && m.geometry) SCHW.keys.set(m.geometry.uuid, key); }); }).catch(() => {}); }
}
const _sBox = new THREE.Box3(), _sRay = new THREE.Raycaster(), _sV = new THREE.Vector3(), _sDown = new THREE.Vector3(0, -1, 0);
function schweben_box(o, own) { const B = new THREE.Box3(); o.updateWorldMatrix(true, true); o.traverse(m => { if (!m.isMesh || m.isInstancedMesh || !m.geometry || !m.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); _sBox.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); B.union(_sBox); if (own) own.add(m); }); return B; }
function schweben_cache() { const out = []; scene.traverse(m => { if (!m.isMesh || !m.visible || m.isSkinnedMesh || !m.geometry || (m.userData && m.userData.noSupport)) return; const mt = [].concat(m.material)[0]; if (!mt || mt.visible === false || (mt.transparent && mt.opacity < .05)) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); if (m.isInstancedMesh) { out.push({ m, b: null }); return; }
    const b = new THREE.Box3().copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); if (b.max.x - b.min.x > 60 || b.max.z - b.min.z > 60) return; out.push({ m, b }); }); return out; }
// Kandidaten: sichtbare Meshes in der Nähe (Quader-Vorauswahl), Strahl mit beiden Seiten
function schweben_stuetze(obj, B, own, xs) {
  const ymin = B.min.y; let best = -Infinity, von = '', typ = '', sk = '';
  const cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2, sx = (B.max.x - B.min.x) / 4, sz = (B.max.z - B.min.z) / 4;
  const pts = xs || [[cx, cz], [cx - sx, cz - sz], [cx + sx, cz - sz], [cx - sx, cz + sz], [cx + sx, cz + sz]];
  if (!SCHW.cache) SCHW.cache = schweben_cache();
  const cands = [];
  for (const c of SCHW.cache) { if (own.has(c.m)) continue; if (c.b) { if (c.b.max.x < B.min.x - .05 || c.b.min.x > B.max.x + .05 || c.b.max.z < B.min.z - .05 || c.b.min.z > B.max.z + .05 || c.b.min.y > ymin + .13 || c.b.max.y < ymin - .6) continue; } cands.push([c.m, c.b ? c.b.max.y : null]); }
  const sides = new Map(); const restore = () => { for (const [mt, sd] of sides) mt.side = sd; };
  try {
    for (const [m, top] of cands) { for (const mt of [].concat(m.material)) if (mt && !sides.has(mt)) { sides.set(mt, mt.side); mt.side = THREE.DoubleSide; }
      for (const [x, z] of pts) { _sRay.set(_sV.set(x, ymin + .12, z), _sDown); _sRay.far = 1.5; const hs = _sRay.intersectObject(m, false); for (const h of hs) { if (h.instanceId !== undefined && h.object.isInstancedMesh && own.has(h.object)) continue; if (h.point.y <= ymin + .125 && h.point.y > best) { best = h.point.y; von = m.name || m.geometry.type; typ = m.geometry.type; sk = SCHW.keys.get(m.geometry.uuid) || ''; } } } }
  } finally { restore(); }
  return { y: best, von, typ, stuetzKey: sk };
}
// auf_flaeche(obj[, x, z], { apply = true, maxGap = .4 }) → { gap, y, von, gesenkt }: setzt die Unterkante von obj auf die Fläche darunter.
function auf_flaeche(obj, x, z, o = {}) {
  if (!o.keepCache) SCHW.cache = null;
  const own = new Set(), B = schweben_box(obj, own); if (B.isEmpty() || !isFinite(B.min.y)) return null;
  const s = schweben_stuetze(obj, B, own, (x !== undefined && z !== undefined && x !== null) ? [[x, z]] : null);
  if (!isFinite(s.y)) return { gap: null, y: null, von: '', typ: '', gesenkt: false };
  const gap = B.min.y - s.y; let gesenkt = false;
  if (o.apply !== false && gap > .01 && gap <= (o.maxGap ?? .4)) { const par = obj.parent, sc = par ? _sV.setFromMatrixScale(par.matrixWorld).y || 1 : 1; obj.position.y -= gap / sc; obj.updateMatrixWorld(true); gesenkt = true; }
  return { gap, y: s.y, von: s.von, typ: s.typ, gesenkt };
}
// Einheiten: kleinste Gruppe, die nur ein Modell dieses Schlüssels enthält
function schweben_einheiten(rect) {
  schweben_index(); const out = [], used = new Set(); const info = new Map();
  scene.traverse(m => { if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || !m.visible) return; const k = SCHW.keys.get(m.geometry.uuid); if (!k || !SCHW_STEHT.test(k) || SCHW_HAENGT.test(k)) return;
    if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); _sBox.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld); const cx = (_sBox.min.x + _sBox.max.x) / 2, cz = (_sBox.min.z + _sBox.max.z) / 2;
    if (rect && (cx < rect.x0 - .5 || cx > rect.x1 + .5 || cz < rect.z0 - .5 || cz > rect.z1 + .5)) return;
    let r = m; while (r.parent && r.parent !== scene) { const p = r.parent; let ok = true, n = 0; p.traverse(q => { if (q.isMesh) { n++; if (SCHW.keys.get(q.geometry.uuid) !== k) ok = false; } }); if (!ok || n > 14) break; r = p; }
    if (used.has(r)) return; used.add(r); out.push({ root: r, key: k }); });
  return out;
}
// Auflageflächen (Quader-Oberseiten) aller Meshes und aller Instanzen – für „daneben gestellt“-Funde
function schweben_flaechen() { const out = [], M = new THREE.Matrix4(), Bx = new THREE.Box3();
  scene.traverse(m => { if (!m.isMesh || !m.visible || m.isSkinnedMesh || !m.geometry) return; const mt = [].concat(m.material)[0]; if (!mt || mt.visible === false || (mt.transparent && mt.opacity < .05)) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
    const add = b => { const sx = b.max.x - b.min.x, sz = b.max.z - b.min.z; if (sx < .12 || sz < .12 || sx > 6 || sz > 6 || b.max.y < .12) return; out.push({ m, x0: b.min.x, x1: b.max.x, z0: b.min.z, z1: b.max.z, y1: b.max.y, y0: b.min.y }); };
    if (m.isInstancedMesh) { for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); add(Bx.copy(m.geometry.boundingBox).applyMatrix4(M).applyMatrix4(m.matrixWorld)); } }
    else add(Bx.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); });
  return out; }
function schweben_waende() { const out = [], Bx = new THREE.Box3(); scene.traverse(m => { if (!m.isMesh || m.isInstancedMesh || !m.visible || !m.geometry) return; const mt = [].concat(m.material)[0]; if (!mt || mt.visible === false) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); Bx.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld);
    const sx = Bx.max.x - Bx.min.x, sy = Bx.max.y - Bx.min.y, sz = Bx.max.z - Bx.min.z; if (sy >= 1.5 && (Math.min(sx, sz) <= .7 || sx > 3 && sz > 3 && false) && Math.max(sx, sz) >= 1.2) out.push({ x0: Bx.min.x, x1: Bx.max.x, z0: Bx.min.z, z1: Bx.max.z, y0: Bx.min.y, y1: Bx.max.y }); });
  return out; }
function schweben_amWand(B, Wd, ab = .18) { for (const w of Wd) { if (B.max.y < w.y0 || B.min.y > w.y1) continue; const dx = Math.max(w.x0 - B.max.x, 0, B.min.x - w.x1), dz = Math.max(w.z0 - B.max.z, 0, B.min.z - w.z1); if (Math.hypot(dx, dz) <= ab) return true; } return false; }
function schweben_pruefe(u, S, Wd) {
  const own = new Set(), B = schweben_box(u.root, own); if (B.isEmpty() || !isFinite(B.min.y)) return null;
  const ymin = B.min.y, cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2, hx = (B.max.x - B.min.x) / 2, hz = (B.max.z - B.min.z) / 2;
  const r = schweben_stuetze(u.root, B, own, null);
  if (!isFinite(r.y)) { const R = (typeof indoorRects !== 'undefined') ? indoorRects.find(q => cx > q.x0 && cx < q.x1 && cz > q.zb && cz < q.zf) : null; r.y = R ? R.y : 0; r.typ = 'Boden'; }
  const gap = ymin - r.y;
  const haengt = Wd ? schweben_amWand(B, Wd) : false;
  const base = { key: u.key, p: [+cx.toFixed(2), +ymin.toFixed(2), +cz.toFixed(2)], gap: gap === null ? null : +gap.toFixed(3), typ: r.typ || '' };
  if (gap !== null && gap <= .08 && gap >= -.05) return { ...base, k: 'gut' };
  if (gap !== null && gap < -.05) return { ...base, k: (haengt || (r.stuetzKey && SCHW_STEHT.test(r.stuetzKey))) ? (haengt ? 'haengt' : 'gut') : 'steckt', von: r.stuetzKey || '', dy: -gap };
  // seitlich neben einer Auflage? (Oberseite auf Höhe der Unterkante, waagerecht ≤ 70 cm entfernt)
  let best = null;
  for (const s of S) { if (own.has(s.m)) continue; if (s.y1 < ymin - .14 || s.y1 > ymin + .05) continue; if (s.y0 > ymin + .02) continue;
    const dxr = Math.max(s.x0 - cx, 0, cx - s.x1), dzr = Math.max(s.z0 - cz, 0, cz - s.z1), d = Math.hypot(dxr, dzr); if (d > .7) continue; if (!best || d < best.d) best = { s, d }; }
  if (best && best.d <= .02) return { ...base, k: 'gut', von: 'Rahmen' };
  if (haengt) return { ...base, k: 'haengt' };
  if (best && best.d > .6) return { ...base, k: 'ungeklaert', abstand: +best.d.toFixed(2) };
  if (best) { const s = best.s, ax = Math.min(hx * .5, (s.x1 - s.x0) / 2), az = Math.min(hz * .5, (s.z1 - s.z0) / 2);
    const nx = Math.min(Math.max(cx, s.x0 + ax), s.x1 - ax), nz = Math.min(Math.max(cz, s.z0 + az), s.z1 - az);
    return { ...base, k: 'neben', dx: nx - cx, dz: nz - cz, dy: s.y1 - ymin, abstand: +best.d.toFixed(2) }; }
  if (gap !== null && gap <= .15) return { ...base, k: 'schwebt', dy: -gap };
  return { ...base, k: 'ungeklaert' };
}
function schweben_verschiebe(root, dx, dy, dz) { root.updateWorldMatrix(true, false); const w0 = new THREE.Vector3().setFromMatrixPosition(root.matrixWorld), w1 = w0.clone().add(new THREE.Vector3(dx, dy, dz));
  if (root.parent) { const l0 = root.parent.worldToLocal(w0.clone()), l1 = root.parent.worldToLocal(w1.clone()); root.position.add(l1.sub(l0)); } else root.position.add(new THREE.Vector3(dx, dy, dz)); root.updateMatrixWorld(true); }
function schweben_pass(rect, opt = {}) {
  const res = { geprueft: 0, gesenkt: 0, versetzt: 0, gehoben: 0, zeilen: [] }; const S = schweben_flaechen(), Wd = schweben_waende(); SCHW.cache = schweben_cache();
  for (const u of schweben_einheiten(rect)) { const r = schweben_pruefe(u, S, Wd); res.geprueft++; if (!r) continue; res.zeilen.push([r.key, r.k, r.gap, ...r.p, r.typ, r.abstand || 0]);
    if (opt.apply === false || r.k === 'gut' || r.k === 'haengt' || r.k === 'ungeklaert') continue;
    const innen = (typeof indoorRects !== 'undefined') && indoorRects.some(q => r.p[0] > q.x0 && r.p[0] < q.x1 && r.p[2] > q.zb && r.p[2] < q.zf);
    if (!innen && (r.k === 'neben' || (r.k === 'schwebt' && /^(Plane|Circle|Boden|Ring|Shape)/.test(r.typ)))) continue; // draußen: Bordstein/Sockel/Platten sind keine Meshes mit Kollision → keine Eingriffe ohne echte Auflage
    const dx = r.dx || 0, dz = r.dz || 0; let dy = r.dy || 0; dy = Math.max(-.2, Math.min(.2, dy));
    if (r.k === 'steckt' && (dy > .12 || (Math.abs(r.p[0]) < 3 && Math.abs(r.p[2]) < 3) || r.p[1] < -1)) continue; // geparkte Dinge am Ursprung/unter der Welt nicht anfassen
    schweben_verschiebe(u.root, dx, dy, dz); SCHW.log.push([u.key, r.k, +dx.toFixed(2), +dy.toFixed(2), +dz.toFixed(2), r.p]); if (r.k === 'neben') res.versetzt++; else if (r.k === 'steckt') res.gehoben++; else res.gesenkt++;
    SCHW.cache = schweben_cache(); }
  SCHW.cache = null; SCHW.stats.geprueft += res.geprueft; SCHW.stats.gesenkt += res.gesenkt + res.versetzt + res.gehoben; return res;
}
// ---------------------------------------------------------------- Decals (Boden: Kreide-Pfeile, Blut, Spuren · Wand: Ritzschrift, Blut, Zettel)
// decal_auf_flaeche(mesh, cands): Boden-Decal per Strahl auf Bodenhöhe + 0,6 cm; Wand-Decal senkrecht auf die sichtbare Oberfläche + 0,4 cm (nicht in der Wand, nicht davor
// schwebend). Dazu Texturqualität: Anisotropie 8, Mipmaps, polygonOffset gegen Flimmern. Liefert { art, gap, zu } für die Audit-Tabelle.
const _dBs = new THREE.Sphere(), _dq = new THREE.Quaternion(), _dp = new THREE.Vector3(), _ds = new THREE.Vector3(), _dn = new THREE.Vector3(), _dRay = new THREE.Raycaster();
function schweben_istDecal(m) { if (!m.isMesh || m.isInstancedMesh || m.isSkinnedMesh || !m.visible || !m.geometry) return false; const t = m.geometry.type; if (t !== 'PlaneGeometry' && t !== 'CircleGeometry') return false; const mt = [].concat(m.material)[0]; return !!(mt && mt.map && mt.visible !== false); }
function schweben_decalKand() { const c = []; scene.traverse(m => { if (!m.isMesh || m.isSkinnedMesh || !m.visible || !m.geometry || schweben_istDecal(m)) return; const mt = [].concat(m.material)[0]; if (!mt || mt.visible === false || (mt.transparent && mt.opacity < .5) || mt.depthWrite === false) return; if (m.userData && m.userData.noCol && m.geometry.type === 'PlaneGeometry') return; c.push(m); }); return c; }
function decal_auf_flaeche(m, cands, o = {}) {
  m.updateWorldMatrix(true, false); m.matrixWorld.decompose(_dp, _dq, _ds); const pr = m.geometry.parameters || {}, w = (pr.width || (pr.radius || .5) * 2) * Math.abs(_ds.x), h = (pr.height || (pr.radius || .5) * 2) * Math.abs(_ds.y);
  if (Math.max(w, h) > 6 || Math.max(w, h) < .04) return null; _dn.set(0, 0, 1).applyQuaternion(_dq).normalize();
  const floor = Math.abs(_dn.y) > .8, wall = Math.abs(_dn.y) < .3; if (!floor && !wall) return null;
  const mt = [].concat(m.material)[0];
  if (mt.map) { const t = mt.map; if (t.anisotropy < 8) t.anisotropy = 8; if (t.generateMipmaps !== false && t.minFilter !== THREE.LinearMipmapLinearFilter && !t.isCompressedTexture) { t.minFilter = THREE.LinearMipmapLinearFilter; t.needsUpdate = true; } }
  if (!mt.polygonOffset) { mt.polygonOffset = true; mt.polygonOffsetFactor = -2; mt.polygonOffsetUnits = -2; }
  const sides = new Map(); for (const c of o.sides || []) sides.set(c, 1);
  const org = floor ? _dp.clone().add(new THREE.Vector3(0, .3, 0)) : _dp.clone().addScaledVector(_dn, .15), dir = floor ? new THREE.Vector3(0, -1, 0) : _dn.clone().negate();
  _dRay.set(org, dir); _dRay.far = floor ? .8 : .5; let hit = null;
  for (const c of cands) { if (c === m) continue;
    if (!c.isInstancedMesh) { const g = c.geometry; if (!g.boundingSphere) g.computeBoundingSphere(); if (g.boundingSphere) { _dBs.copy(g.boundingSphere).applyMatrix4(c.matrixWorld); if (_dBs.distanceToPoint(org) > _dRay.far + .1) continue; } } // 10.10.: Kugel-Vorprüfung (vorher alle Formen je Decal = 22 s Ladezeit)
    const mats = [].concat(c.material), sv = mats.map(q => q.side); mats.forEach(q => { q.side = THREE.DoubleSide; });
    const hs = _dRay.intersectObject(c, false); mats.forEach((q, i) => { q.side = sv[i]; }); for (const x of hs) { if (!hit || x.distance < hit.distance) hit = x; } }
  if (!hit) return { art: floor ? 'Boden' : 'Wand', gap: null, w, h };
  const goal = hit.point.clone().addScaledVector(floor ? new THREE.Vector3(0, 1, 0) : _dn, floor ? .006 : .004);
  const cur = _dp.clone(), delta = floor ? goal.y - cur.y : goal.clone().sub(cur).dot(_dn), gap = -delta + (floor ? .006 : .004);
  let moved = false;
  if (Math.abs(delta) > .004 && Math.abs(delta) < .07) { const wp = cur.clone(); if (floor) wp.y = goal.y; else wp.addScaledVector(_dn, delta); const lp = m.parent ? m.parent.worldToLocal(wp.clone()) : wp; m.position.copy(lp); m.updateMatrixWorld(true); moved = true; }
  return { art: floor ? 'Boden' : 'Wand', gap: +(gap).toFixed(3), moved, w, h };
}
function schweben_decals(rect, done) {
  const C = schweben_decalKand(), res = { n: 0, bewegt: 0, ohneFlaeche: 0, zeilen: [] }, list = [];
  scene.traverse(m => { if (!schweben_istDecal(m)) return; m.getWorldPosition(_dp); if (rect && (_dp.x < rect.x0 - .5 || _dp.x > rect.x1 + .5 || _dp.z < rect.z0 - .5 || _dp.z > rect.z1 + .5)) return; if (SCHW.decDone && SCHW.decDone.has(m)) return; list.push(m); });
  SCHW.decDone = SCHW.decDone || new WeakSet(); SCHW.decStats = SCHW.decStats || { n: 0, bewegt: 0 };
  let i = 0; const step = () => { const t0 = performance.now(); while (i < list.length && performance.now() - t0 < 6) { const m = list[i++]; m.getWorldPosition(_dp); const px = _dp.x, py = _dp.y, pz = _dp.z; const r = decal_auf_flaeche(m, C); if (!r) continue; SCHW.decDone.add(m); res.n++; if (r.gap === null) res.ohneFlaeche++; if (r.moved) { res.bewegt++; res.zeilen.push([r.art, +px.toFixed(1), +py.toFixed(2), +pz.toFixed(1), r.gap]); } }
    if (i < list.length) setTimeout(step, 16); else { SCHW.decStats.n += res.n; SCHW.decStats.bewegt += res.bewegt; if (done) done(res); } };
  step(); return res;
}
// Je betretenem Innenraum einmal (verzögert, damit die Räume fertig gebaut sind)
WORLD_TICK.push((dt, t, indoor) => { SCHW.t += dt; if (SCHW.t < 1.5) return; SCHW.t = 0;
  try { const P = player.pos; const R = (typeof indoorRects !== 'undefined') ? indoorRects.find(r => P.x > r.x0 && P.x < r.x1 && P.z > r.zb && P.z < r.zf) : null; if (!R) return;
    const id = Math.round(R.x0) + ',' + Math.round(R.zb); if (SCHW.done.has(id)) return;
    SCHW.done.add(id); setTimeout(() => { try { const rr = { x0: R.x0, x1: R.x1, z0: R.zb, z1: R.zf }; schweben_pass(rr, { apply: true }); schweben_decals(rr); } catch (e) { console.warn('schweben', e); } }, 2500); } catch (e) {} });
setInterval(schweben_index, 4000); // Modell→Schlüssel-Zuordnung laufend nachführen (Modelle laden asynchron)
window.__schweben = { index: schweben_index, decStats: () => SCHW.decStats, decals: schweben_decals, decal_auf_flaeche, pass: schweben_pass, auf_flaeche, einheiten: schweben_einheiten, log: SCHW.log, stats: SCHW.stats, done: SCHW.done,
  pruefen: rect => schweben_pass(rect, { apply: false }) };
// Außenwelt: Decals einmal nach dem Laden (Straße, Kreide, Blut, Zettel) – verzögert
(function wartenAufBereit() { if (!window.__ready) return setTimeout(wartenAufBereit, 1000); setTimeout(() => { try { schweben_decals(null); } catch (e) { console.warn('schweben decals', e); } }, 3000); })(); // erst nach dem Laden (vorher lief die Prüfung nach 25 s mitten im Ladevorgang)
