(async () => { const B = window.__BW, E = B.E, r2 = B.r2; const T = E.THREE; const cfg = window.__BWCFG; const out = [];
  const nm = o => { const a = []; for (let p = o, i = 0; p && i < 5; p = p.parent, i++) a.push(p.name || p.type); return a.join('<'); };
  for (const q of cfg.pts) { const [x, y, z, label] = q; let placed = false;
    for (const a of [0, 1.57, 3.14, 4.71]) { const px = x + Math.sin(a) * 2.2, pz = z + Math.cos(a) * 2.2; if (B.overlap(px, B.floorY(px, pz, y), pz, 1.7).length) continue; B.place(px, B.floorY(px, pz, y) + .02, pz, a + Math.PI); placed = true; break; }
    for (let i = 0; i < 40; i++) B.upd(1 / 30);
    const row = { label, pos: [x, y, z], placed, cand: [] }; const bb = new T.Box3(); const R = cfg.r || 1.3;
    E.scene.traverse(o => { if (!o.isMesh || !o.geometry || o.isSkinnedMesh) return; for (let p = o; p; p = p.parent) if (!p.visible) return;
      const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.visible === false || m.colorWrite === false) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      if (bb.max.x < x - R || bb.min.x > x + R || bb.max.z < z - R || bb.min.z > z + R || bb.max.y < y - R || bb.min.y > y + R) return;
      const s = bb.getSize(new T.Vector3()); const tri = o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
      row.cand.push({ n: nm(o).slice(0, 50), tri: Math.round(tri), s: [s.x, s.y, s.z].map(r2), c: [(bb.min.x + bb.max.x) / 2 - x, (bb.min.y + bb.max.y) / 2 - y, (bb.min.z + bb.max.z) / 2 - z].map(r2), mat: (m.name || m.type).slice(0, 24), inst: !!o.isInstancedMesh, vc: o.geometry.attributes.position.count }); });
    row.cand.sort((a, b) => Math.hypot(...a.c) - Math.hypot(...b.c)); row.cand = row.cand.slice(0, 8); out.push(row); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'inspect') + '.json', out);
})()
