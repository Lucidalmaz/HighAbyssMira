// 1) Unsichtbare Wände: AABB-Hitboxen, an deren Rand keine sichtbare Geometrie ist.
// 2) Lecks: begehbare Stellen, an denen der Körper trotz neuer Kollision in Sichtbares ragt (nicht erfasste Objekte).
(async () => {
  const T = G.THREE, R = .3, t0 = performance.now(), tgt = { point: new T.Vector3(), distance: 0 }, lp = new T.Vector3(), wp = new T.Vector3();
  const near = (x, y, z, rad) => { for (const it of G.solidNear(x, z)) { const bb = it.bb; if (x + rad < bb.min.x || x - rad > bb.max.x || z + rad < bb.min.z || z - rad > bb.max.z || y + rad < bb.min.y || y - rad > bb.max.y) continue; if (!G.solidLive(it)) continue;
      lp.set(x, y, z).applyMatrix4(it.inv); const r = it.o.geometry.boundsTree.closestPointToPoint(lp, tgt, 0, rad / it.sc); if (r && wp.copy(r.point).applyMatrix4(it.mw).distanceTo(lp.set(x, y, z)) < rad) return it; } return null; };
  // sichtbare, aber nicht erfasste Meshes (transparent/Glas) zusätzlich als Info
  const out = { items: G.SOL.items.length, invisible: [], ms: 0 };
  for (const c of G.colliders) {
    if (c.minX < -5000 || c.maxX - c.minX > 60 || c.maxZ - c.minZ > 60) continue;
    const y0 = Math.max(c.base, -.5) + .25, y1 = Math.min(c.top, c.base + 2.2) - .05; if (y1 <= y0) continue;
    let n = 0, ok = 0; const pts = [];
    for (const [ax, az, bx, bz] of [[c.minX, c.minZ, c.maxX, c.minZ], [c.minX, c.maxZ, c.maxX, c.maxZ], [c.minX, c.minZ, c.minX, c.maxZ], [c.maxX, c.minZ, c.maxX, c.maxZ]]) {
      const L = Math.hypot(bx - ax, bz - az), k = Math.max(1, Math.round(L / .5));
      for (let i = 0; i <= k; i++) { const x = ax + (bx - ax) * i / k, z = az + (bz - az) * i / k; for (const y of [y0, (y0 + y1) / 2, y1]) { n++; if (near(x, y, z, .3)) ok++; else if (pts.length < 2) pts.push([+x.toFixed(1), +y.toFixed(1), +z.toFixed(1)]); } } }
    if (ok / n < .6) out.invisible.push({ cov: +(ok / n).toFixed(2), box: [c.minX, c.maxX, c.minZ, c.maxZ, c.base, c.top].map(v => +v.toFixed(2)), pts });
  }
  out.ms = Math.round(performance.now() - t0);
  return JSON.stringify(out);
})()
