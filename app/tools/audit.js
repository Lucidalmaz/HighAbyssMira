// Hitbox-Prüfung: überall, wo der Spieler stehen kann, darf sein Körper (Radius R, 3 Höhen) nichts Sichtbares schneiden.
(async () => {
  const T = G.THREE, { computeBoundsTree } = await import('three-mesh-bvh');
  T.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  const R = .3, cols = G.colliders, rects = G.indoorRects, t0 = performance.now();
  const skip = o => { for (let p = o; p; p = p.parent) { if (!p.visible) return true; if (p === G.canal.root) return true; } return false; };
  const items = [], big = [], B = 2, grid = new Map(), gk = (i, j) => i * 100003 + j;
  G.scene.updateMatrixWorld(true);
  const addItem = (o, mw, idx) => {
    const bb = o.geometry.boundingBox.clone().applyMatrix4(mw), s = bb.getSize(new T.Vector3());
    if (s.y < .12 || Math.max(s.x, s.z) < .12) return; // Bodenflächen, Decals, Kleinkram
    const it = { o, idx, bb, inv: mw.clone().invert(), sc: Math.cbrt(Math.abs(mw.determinant())) }; items.push(it);
    for (let i = Math.floor((bb.min.x - R) / B); i <= Math.floor((bb.max.x + R) / B); i++) for (let j = Math.floor((bb.min.z - R) / B); j <= Math.floor((bb.max.z + R) / B); j++) {
      const k = gk(i, j); let l = grid.get(k); if (!l) grid.set(k, l = []); l.push(it); } };
  G.scene.traverse(o => {
    if (!o.isMesh || o.isSkinnedMesh || skip(o)) return;
    const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.visible === false) return;
    if (m.transparent && (m.opacity < .6 || m.depthWrite === false)) return;
    if (m.blending === T.AdditiveBlending) return;
    const g = o.geometry; if (!g.attributes.position || g.attributes.position.count < 3) return;
    if (!g.boundingBox) g.computeBoundingBox();
    if (o.isInstancedMesh && o.count > 400) { big.push((o.name || o.parent?.name || '?') + ' x' + o.count); return; }
    if (!g.boundsTree) try { g.computeBoundsTree(); } catch (e) { return; }
    if (o.isInstancedMesh) { const im = new T.Matrix4(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, im); addItem(o, im.clone().premultiply(o.matrixWorld), i); } }
    else addItem(o, o.matrixWorld, -1);
  });
  const floorAt = (x, z) => { const r = rects.find(r => x > r.x0 && x < r.x1 && z > r.zb && z < r.zf); return r ? r.y : 0; };
  const standable = (x, z, y) => { for (const c of cols) { if (c.top <= y + .36 || c.base >= y + 1.7) continue; if (x + R > c.minX && x - R < c.maxX && z + R > c.minZ && z - R < c.maxZ) return false; } return true; };
  const lp = new T.Vector3(), tgt = { point: new T.Vector3(), distance: 0 };
  const hitAt = (x, y, z) => { const l = grid.get(gk(Math.floor(x / B), Math.floor(z / B))); if (!l) return null;
    for (const it of l) { const bb = it.bb; if (x + R < bb.min.x || x - R > bb.max.x || z + R < bb.min.z || z - R > bb.max.z || y + 1.7 < bb.min.y || y + .2 > bb.max.y) continue;
      for (const h of [.35, 1.0, 1.55]) { const wy = y + h; if (wy < bb.min.y - R || wy > bb.max.y + R) continue;
        lp.set(x, wy, z).applyMatrix4(it.inv); const r = it.o.geometry.boundsTree.closestPointToPoint(lp, tgt, 0, (R - .04) / it.sc);
        if (r && r.distance * it.sc < R - .04) return it; } }
    return null; };
  const zones = [{ n: 'Stadt', x0: -110, x1: 110, z0: -55, z1: 55, seeds: [[0, 0], ...rects.map(r => [(r.x0 + r.x1) / 2, (r.zb + r.zf) / 2])] }];
  for (const z of (window.__auditZones || [])) zones.push(z);
  const out = { items: items.length, big, cols: cols.length, zones: [] }, byItem = new Map(), S = .3;
  for (const Z of zones) {
    const nx = Math.round((Z.x1 - Z.x0) / S), nz = Math.round((Z.z1 - Z.z0) / S), seen = new Uint8Array(nx * nz), q = [];
    let reach = 0, edge = [];
    for (const [sx, sz] of Z.seeds) { const i = Math.round((sx - Z.x0) / S), j = Math.round((sz - Z.z0) / S); if (i < 0 || j < 0 || i >= nx || j >= nz) continue; const x = Z.x0 + i * S, z = Z.z0 + j * S; if (!seen[i * nz + j] && standable(x, z, floorAt(x, z))) { seen[i * nz + j] = 1; q.push(i * nz + j); } }
    while (q.length) {
      const k = q.pop(), i = Math.floor(k / nz), j = k % nz, x = Z.x0 + i * S, z = Z.z0 + j * S, y = floorAt(x, z); reach++;
      if ((i === 0 || j === 0 || i === nx - 1 || j === nz - 1) && edge.length < 5) edge.push([+x.toFixed(1), +z.toFixed(1)]);
      const it = hitAt(x, y, z);
      if (it) { const key = it.o.uuid + ':' + it.idx; let e = byItem.get(key); if (!e) byItem.set(key, e = { it, n: 0, at: [] }); e.n++; if (e.at.length < 2) e.at.push([+x.toFixed(1), +y.toFixed(2), +z.toFixed(1)]); }
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue; const kk = a * nz + b; if (seen[kk]) continue; const xx = Z.x0 + a * S, zz = Z.z0 + b * S;
        if (Math.abs(floorAt(xx, zz) - y) > .5) continue; seen[kk] = 1; if (standable(xx, zz, floorAt(xx, zz))) q.push(kk); }
    }
    out.zones.push({ n: Z.n, reach, edge });
  }
  const desc = e => { const o = e.it.o, bb = e.it.bb, c = bb.getCenter(new T.Vector3()), s = bb.getSize(new T.Vector3()); const names = []; for (let p = o; p && p !== G.scene; p = p.parent) if (p.name) names.push(p.name);
    const m = Array.isArray(o.material) ? o.material[0] : o.material, gp = o.geometry.parameters;
    return { n: e.n, at: e.at, names: names.slice(0, 3).join('<'), geo: o.geometry.type + (gp ? ' ' + Object.values(gp).slice(0, 3).map(v => typeof v === 'number' ? +v.toFixed(2) : '').join('x') : ''), idx: e.it.idx,
      mat: (m.name || '') + '#' + (m.color ? m.color.getHexString() : '') + (m.map ? '+tex' : ''), c: c.toArray().map(v => +v.toFixed(1)), s: s.toArray().map(v => +v.toFixed(2)), ud: Object.keys(o.userData).join(',') }; };
  out.leaks = [...byItem.values()].sort((a, b) => b.n - a.n).map(desc);
  out.ms = Math.round(performance.now() - t0);
  return JSON.stringify(out);
})()
