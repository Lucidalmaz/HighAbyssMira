(async () => { const B = window.__BW, E = B.E, P = E.player.pos, out = [];
  const V = new E.THREE.Vector3();
  const veh = window.__bewg.BEWG.veh.filter(r => r.cols.length && r.sicht && r.o.getWorldPosition(V).y > -20);
  const aufg = [];
  for (const r of veh) { const b = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9, base: 1e9, top: -1e9 }; for (const c of r.cols) { if (c.minX < -9000) continue; b.minX = Math.min(b.minX, c.minX); b.maxX = Math.max(b.maxX, c.maxX); b.minZ = Math.min(b.minZ, c.minZ); b.maxZ = Math.max(b.maxZ, c.maxZ); b.base = Math.min(b.base, c.base); b.top = Math.max(b.top, c.top); }
    aufg.push({ id: r.id, key: r.key, b }); }
  for (const a of aufg) for (const [fx, fz, fy, lab] of [[.5, .5, 0, 'Mitte unten'], [.25, .5, .3, 'Front innen'], [.5, .5, .8, 'Mitte hoch']]) {
    const b = a.b, x = b.minX + (b.maxX - b.minX) * fx, z = b.minZ + (b.maxZ - b.minZ) * fz;
    B.place(b.minX - 3, .02, z, 0); for (let i = 0; i < 5; i++) B.upd(1 / 30);
    P.set(x, b.base + fy, z); E.vel.set(0, 0, 0); E.setS(true, 0);
    const ov0 = B.overlap(P.x, P.y, P.z, 1.7).length;
    E.keys.KeyW = true; B.key('KeyW', true); let t = 0, moved = -1;
    for (let i = 0; i < 160; i++) { B.upd(1 / 30); t += 1 / 30; if (B.overlap(P.x, P.y, P.z, 1.7).filter(q => q.dep > .05).length === 0 && moved < 0 && i > 3) moved = t; }
    B.releaseAll(); const ov1 = B.overlap(P.x, P.y, P.z, 1.7).filter(q => q.dep > .05).length;
    out.push({ id: a.id, key: a.key, lab, ov0, ov1, tFrei: +moved.toFixed(2), end: [P.x, P.y, P.z].map(v => +v.toFixed(2)), inFoot: P.x > b.minX && P.x < b.maxX && P.z > b.minZ && P.z < b.maxZ }); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/freischieben.json', out);
})()
