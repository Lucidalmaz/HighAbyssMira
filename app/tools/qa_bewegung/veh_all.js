// alle Fahrzeuge der Welt: je Fahrzeug hinteleportieren (Sichtbarkeit/Bau der Hitbox), dann 8 Richtungen Sprung-/Mantle-Test
(async () => { const B = window.__BW, E = B.E, r2 = B.r2; const t0 = performance.now(); const cfg = window.__BWCFG || {}; const V = new E.THREE.Vector3();
  const out = [];
  const recs = window.__bewg.BEWG.veh.slice();
  for (const r of recs) { r.o.getWorldPosition(V); if (V.y < -20 || V.y > 20) continue; const px = V.x, pz = V.z;
    B.place(px + 8, B.floorY(px + 8, pz, .4) + .02, pz, Math.PI / 2); for (let i = 0; i < 40; i++) B.upd(1 / 30);
    if (!r.cols.length || !r.sicht) { out.push({ id: r.id, key: r.key, info: r.info, pos: [px, V.y, pz].map(r2), runs: [], res: 'nicht gebaut/unsichtbar' }); continue; }
    const b = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9, base: 1e9, top: -1e9 };
    for (const c of r.cols) { if (c.minX < -9000) continue; b.minX = Math.min(b.minX, c.minX); b.maxX = Math.max(b.maxX, c.maxX); b.minZ = Math.min(b.minZ, c.minZ); b.maxZ = Math.max(b.maxZ, c.maxZ); b.base = Math.min(b.base, c.base); b.top = Math.max(b.top, c.top); }
    if (b.top < -1e8) { out.push({ id: r.id, key: r.key, info: r.info, pos: [px, V.y, pz].map(r2), runs: [], res: 'Kisten abgeschaltet' }); continue; }
    b.id = r.id; const rec = { id: r.id, key: r.key, info: r.info, b, pos: [px, V.y, pz].map(r2), runs: [] };
    for (let d = 0; d < 8; d++) for (const sprint of [false, true]) { if (sprint && d > 3) continue; rec.runs.push(B.sprungTest(b, d, { sprint })); }
    out.push(rec); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'veh_all') + '.json', { sek: (performance.now() - t0) / 1000, out });
})()
