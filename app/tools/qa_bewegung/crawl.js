(async () => { const B = window.__BW, E = B.E, r2 = B.r2, P = E.player.pos; const out = { findArea: null, rows: [] };
  const ev = (window.__k6 || window.__villa).ev;
  const free = (x, z) => { for (let dx = -5; dx <= 5; dx += 1) for (let dz = -5; dz <= 5; dz += 1) { if (B.overlap(x + dx, 0, z + dz, 1.7).length) return false; } return true; };
  let spot = null; for (const z0 of [2, 40, 90, -20, 130]) { for (let x = -120; x <= 120 && !spot; x += 8) if (free(x, z0)) spot = [x, z0]; if (spot) break; }
  out.findArea = spot; if (!spot) return B.dump('C:/Users/GIGABYTE/_qa_bew/out/crawl.json', out);
  const [sx, sz] = spot, T = E.THREE; const cleanup = () => { const C = E.colliders; for (let i = C.length - 1; i >= 0; i--) if (C[i].__synth) { C[i].minX = C[i].maxX = -9999; } if (window.__synthMesh) { for (const m of window.__synthMesh) m.parent && m.parent.remove(m); const S = E.SOL.items; for (let i = S.length - 1; i >= 0; i--) if (S[i].o.__synth) { for (const l of S[i].cells || []) { const k = l.indexOf(S[i]); if (k >= 0) l.splice(k, 1); } S.splice(i, 1); } window.__synthMesh = []; } };
  window.__synthMesh = window.__synthMesh || [];
  const WT = window.G.WORLD_TICK;
  const run = (hh, mode) => { cleanup();
    const W = 4, hw = .5; // Wand 4 m breit (x), 0,3 m dick (z), Loch 1 m breit
    const segs = [[sx - W / 2, sx - hw, 0, 3], [sx + hw, sx + W / 2, 0, 3], [sx - hw, sx + hw, hh, 3]];
    if (mode === 'col') for (const s of segs) E.colliders.push({ minX: s[0], maxX: s[1], minZ: sz - .15, maxZ: sz + .15, base: s[2], top: s[3], __synth: 1 });
    else { for (const s of segs) { const m = new T.Mesh(new T.BoxGeometry(s[1] - s[0], s[3] - s[2], .3), new T.MeshStandardMaterial({ color: 0x808080 })); m.position.set((s[0] + s[1]) / 2, (s[2] + s[3]) / 2, sz); m.__synth = 1; E.scene.add(m); m.updateMatrixWorld(true); window.__synthMesh.push(m); ev('solidAdd').call(null, m, true); } }
    B.place(sx, .02, sz - 2.6, Math.PI);
    const WK = WT.slice(); WT.length = 0; const tr = []; let minEye = 9, maxCrawl = 0, maxCrouch = 0;
    try { E.keys.ControlLeft = true; B.key('ControlLeft', true); E.keys.KeyW = true; B.key('KeyW', true);
      for (let i = 0; i < 400; i++) { B.upd(1 / 40); const cr = ev('crawlK'), ck = ev('crouchK'); maxCrawl = Math.max(maxCrawl, cr); maxCrouch = Math.max(maxCrouch, ck); minEye = Math.min(minEye, E.camera.position.y - P.y);
        if (P.z > sz + 1.5 && i > 20) break; } }
    finally { B.releaseAll(); WK.forEach(f => WT.push(f)); }
    const res = { hh, mode, end: [r2(P.x), r2(P.y), r2(P.z)], durch: P.z > sz + 1.0, maxCrawl: r2(maxCrawl), maxCrouch: r2(maxCrouch), minEye: r2(minEye) };
    // zurück: ebenfalls durch (Rückweg)
    return res; };
  for (const hh of [.55, .6, .65, .7, .75, .8, .9, 1.0, 1.2]) for (const mode of ['col', 'mesh']) out.rows.push(run(hh, mode));
  cleanup();
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/crawl.json', out);
})()
