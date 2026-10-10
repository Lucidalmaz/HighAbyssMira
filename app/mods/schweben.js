// =====================================================================  SCHWEBEN (Nutzer 10.10.2026: „Immer noch viele Dinge schweben – neben Tischen, neben Regalen, auf dem Boden“)
// Zentrale Funktion auf_flaeche(obj, x, z): bestimmt per Strahl die Fläche UNTER dem Objekt (Tisch, Regal, Bank, Boden – gleich welches Modul es dort hingestellt hat,
// auch Modelle mit gespiegeltem Wickelsinn: Strahlen gegen beide Seiten) und setzt die Unterkante (Bounding-Box) darauf.
// schweben_pass(): läuft einmal je betretenem Raum (WORLD_TICK) über alle kleinen Standrequisiten (Bücher, Geschirr, Radios, Fernseher, Teddys …) und senkt, was
// sicher schwebt (Fläche 3–12 cm darunter gefunden), auf diese Fläche ab. Hängende Dinge (Bilder, Lampen, Uhren, Schilder, Laternen) und alles ohne gefundene
// Auflage bleiben unberührt (kein „Fallenlassen auf den Boden“, wenn der Tisch nur nicht erkannt wurde).
// Prüfung/Messung: __schweben.pruefen() (Entwicklungsfassung) liefert je Einheit Lücke/Auflage; Protokoll in __schweben.log.
const SCHW = { log: [], done: new Set(), keys: new Map(), seen: new Set(), n: 0, t: 0, stats: { geprueft: 0, gesenkt: 0 } };
const SCHW_STEHT = /^(w_buch|lbook|album|w_teller|w_becher|w_tasse|w_besteck|w_blech|w_thermos|w_telefon|w_kamera|w_brot|w_urne|w_funk|w_lighter|w_kette|w_spieluhr|w_alarm|geschirr|radio|crt|rekorder|messer|jerrycan|trashbag|teddy|doll|toys_old|brille|candles|kiffen|it_)/;
const SCHW_HAENGT = /(frame|clock|mirror|schild|lantern|lamp|curtain|window|door|cross_hang|polaroid|foto|papier|zettel|poster)/i;
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
  const ymin = B.min.y; let best = -Infinity, von = '', typ = '';
  const cx = (B.min.x + B.max.x) / 2, cz = (B.min.z + B.max.z) / 2, sx = (B.max.x - B.min.x) / 4, sz = (B.max.z - B.min.z) / 4;
  const pts = xs || [[cx, cz], [cx - sx, cz - sz], [cx + sx, cz - sz], [cx - sx, cz + sz], [cx + sx, cz + sz]];
  if (!SCHW.cache) SCHW.cache = schweben_cache();
  const cands = [];
  for (const c of SCHW.cache) { if (own.has(c.m)) continue; if (c.b) { if (c.b.max.x < B.min.x - .05 || c.b.min.x > B.max.x + .05 || c.b.max.z < B.min.z - .05 || c.b.min.z > B.max.z + .05 || c.b.max.y > ymin + .13 || c.b.max.y < ymin - .6) continue; } cands.push([c.m, c.b ? c.b.max.y : null]); }
  const sides = new Map(); const restore = () => { for (const [mt, sd] of sides) mt.side = sd; };
  try {
    for (const [m, top] of cands) { for (const mt of [].concat(m.material)) if (mt && !sides.has(mt)) { sides.set(mt, mt.side); mt.side = THREE.DoubleSide; }
      for (const [x, z] of pts) { _sRay.set(_sV.set(x, ymin + .12, z), _sDown); _sRay.far = 1.5; const hs = _sRay.intersectObject(m, false); for (const h of hs) { if (h.instanceId !== undefined && h.object.isInstancedMesh && own.has(h.object)) continue; if (h.point.y <= ymin + .125 && h.point.y > best) { best = h.point.y; von = m.name || m.geometry.type; typ = m.geometry.type; } } } }
  } finally { restore(); }
  return { y: best, von, typ };
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
function schweben_pass(rect, opt = {}) {
  const res = { geprueft: 0, gesenkt: 0, gaps: [] }; SCHW.cache = schweben_cache();
  for (const u of schweben_einheiten(rect)) { const r = auf_flaeche(u.root, undefined, undefined, { apply: false, keepCache: true }); res.geprueft++; if (!r || r.gap === null) continue;
    res.gaps.push([u.key, +r.gap.toFixed(3), r.typ]);
    const bodenartig = /^(Plane|Circle|Ring|Shape)/.test(r.typ);   // Boden/Platte: nur kleine Lücken (< 10 cm) korrigieren – größere Lücken sind meist ein nicht erkannter Tisch
    if (opt.apply !== false && r.gap >= .03 && (bodenartig ? r.gap <= .1 : r.gap <= .12)) { const b0 = schweben_box(u.root).min.y; auf_flaeche(u.root, undefined, undefined, { apply: true, maxGap: .12, keepCache: true }); SCHW.cache = schweben_cache(); res.gesenkt++; SCHW.log.push([u.key, +r.gap.toFixed(3), r.von, +b0.toFixed(2)]); } }
  SCHW.cache = null; SCHW.stats.geprueft += res.geprueft; SCHW.stats.gesenkt += res.gesenkt; return res;
}
// ---------------------------------------------------------------- Decals (Boden: Kreide-Pfeile, Blut, Spuren · Wand: Ritzschrift, Blut, Zettel)
// decal_auf_flaeche(mesh, cands): Boden-Decal per Strahl auf Bodenhöhe + 0,6 cm; Wand-Decal senkrecht auf die sichtbare Oberfläche + 0,4 cm (nicht in der Wand, nicht davor
// schwebend). Dazu Texturqualität: Anisotropie 8, Mipmaps, polygonOffset gegen Flimmern. Liefert { art, gap, zu } für die Audit-Tabelle.
const _dq = new THREE.Quaternion(), _dp = new THREE.Vector3(), _ds = new THREE.Vector3(), _dn = new THREE.Vector3(), _dRay = new THREE.Raycaster();
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
  for (const c of cands) { if (c === m) continue; const mats = [].concat(c.material), sv = mats.map(q => q.side); mats.forEach(q => { q.side = THREE.DoubleSide; });
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
setTimeout(() => { try { schweben_decals(null); } catch (e) { console.warn('schweben decals', e); } }, 25000);
