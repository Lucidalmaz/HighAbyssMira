(async () => { const B = window.__BW, E = B.E, r2 = B.r2; const cfg = window.__BWCFG || {}; const t0 = performance.now(); const budget = (cfg.budget || 90) * 1000;
  let S = window.__BWOBJ; if (!S || S.kap !== cfg.kap) {
    const list = []; const seen = new Set();
    for (const c of E.colliders) { if (c.fzg || c.minX < -9000) continue; const w = c.maxX - c.minX, d = c.maxZ - c.minZ, h = c.top - Math.max(0, c.base); if (c.top > 50 || w > 9 || d > 9 || h < .5 || c.base > .6 || w < .3 || d < .3) continue;
      const k = [c.minX, c.maxX, c.minZ, c.maxZ].map(v => Math.round(v * 5)).join(); if (seen.has(k)) continue; seen.add(k); list.push({ src: 'col', minX: c.minX, maxX: c.maxX, minZ: c.minZ, maxZ: c.maxZ, base: Math.max(0, c.base), top: c.top }); }
    const sn = new Set();
    for (const it of E.SOL.items) { if (sn.has(it) || it.soft) continue; sn.add(it); const bb = it.bb; const w = bb.max.x - bb.min.x, d = bb.max.z - bb.min.z, h = bb.max.y - bb.min.y;
      if (w > 9 || d > 9 || w < .3 || d < .3 || h < .5 || h > 4 || bb.min.y > .6 || bb.min.y < -.5 || !E.solidLive(it)) continue;
      const nm = (it.o.name || (it.o.parent && it.o.parent.name) || '?'); if (/^gruen|blatt|leaf|gras|grass|busch|bush/i.test(nm)) continue;
      const k = [bb.min.x, bb.max.x, bb.min.z, bb.max.z].map(v => Math.round(v * 5)).join(); if (seen.has(k)) continue; seen.add(k);
      list.push({ src: 'sol', n: nm, minX: bb.min.x, maxX: bb.max.x, minZ: bb.min.z, maxZ: bb.max.z, base: Math.max(0, bb.min.y), top: bb.max.y }); }
    if (cfg.max && list.length > cfg.max) { const st = list.length / cfg.max, l2 = []; for (let i = 0; i < cfg.max; i++) l2.push(list[Math.floor(i * st)]); list.length = 0; l2.forEach(x => list.push(x)); }
    list.sort((a, b) => (Math.floor((a.minX + a.maxX) / 40) - Math.floor((b.minX + b.maxX) / 40)) || (Math.floor((a.minZ + a.maxZ) / 40) - Math.floor((b.minZ + b.maxZ) / 40)) || (a.minX - b.minX));
    S = window.__BWOBJ = { kap: cfg.kap, list, i: 0, res: [] }; }
  const dirs = cfg.dirs || [0, 1, 2, 3];
  while (S.i < S.list.length && performance.now() - t0 < budget) { const b = S.list[S.i++]; const rec = { src: b.src, n: b.n, b: [b.minX, b.maxX, b.minZ, b.maxZ, b.base, b.top].map(r2), runs: [] };
    const cx = (b.minX + b.maxX) / 2, cz = (b.minZ + b.maxZ) / 2;
    if (!S.lw || Math.hypot(S.lw[0] - cx, S.lw[1] - cz) > 22) { S.lw = [cx, cz]; B.place(cx, B.floorY(cx, cz, b.base + .3) + .02, cz, 0); for (let q = 0; q < 70; q++) B.upd(1 / 30); }
    for (const d of dirs) { const x = B.sprungTest(b, d, {}); delete x.tr; rec.runs.push([x.cls, x.end, x.why ? 1 : 0, x.mv ?? null, x.ov || 0]); }
    if (rec.runs.every(r => r[0] === 'n/a')) { for (const d of [4, 5, 6, 7]) { const x = B.sprungTest(b, d, {}); delete x.tr; rec.runs.push([x.cls, x.end, x.why ? 1 : 0, x.mv ?? null, x.ov || 0]); } rec.alt = 1; } // alternative Anlaufrichtungen (Diagonalen)
    S.res.push(rec); }
  const done = S.i >= S.list.length;
  if (done || cfg.dumpAlways) return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'obj') + '.json', { n: S.list.length, i: S.i, res: S.res });
  return 'läuft ' + S.i + '/' + S.list.length;
})()
