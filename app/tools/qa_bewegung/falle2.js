// Falle v2: Erreichbarkeit per Flutfüllung in beide Richtungen (Folgeauftrag 7).
//  F = von der Startzelle aus erreichbar (Aufstieg <= 1,5 m, Abstieg beliebig), R = von dort aus wieder zur Startzelle zurückkehrbar (umgekehrte Kanten).
//  F \ R = Fallen (hineingelangt, nicht wieder heraus). Freie Zellen außerhalb F = nicht erreichbare Bereiche (geschlossene Räume, Zäune, Außenwelt) – nach Komponenten gelistet.
(async () => { const B = window.__BW, E = B.E, P = E.player.pos, r2 = B.r2; const cfg = window.__BWCFG || {}; const t0 = performance.now();
  if (cfg.seed) { B.place(cfg.seed[0], B.floorY(cfg.seed[0], cfg.seed[1], .4) + .02, cfg.seed[1], 0); for (let i = 0; i < 20; i++) B.upd(1 / 30); }
  const [x0, x1, z0, z1] = cfg.box; const cs = cfg.cs || .5; const nx = Math.ceil((x1 - x0) / cs), nz = Math.ceil((z1 - z0) / cs);
  const free = new Uint8Array(nx * nz), fl = new Float32Array(nx * nz), F = new Uint8Array(nx * nz), R = new Uint8Array(nx * nz), comp = new Int32Array(nx * nz).fill(-1);
  const WT = window.G.WORLD_TICK, WK = WT.slice(); WT.length = 0;
  const veh = (window.__bewg ? window.__bewg.BEWG.veh : []).filter(r => r.cols.length && r.sicht).map(r => { const b = { minX: 1e9, maxX: -1e9, minZ: 1e9, maxZ: -1e9 }; for (const c of r.cols) { if (c.minX < -9000) continue; b.minX = Math.min(b.minX, c.minX); b.maxX = Math.max(b.maxX, c.maxX); b.minZ = Math.min(b.minZ, c.minZ); b.maxZ = Math.max(b.maxZ, c.maxZ); } return b; });
  const rects = E.indoorRects.map(r => [r.x0, r.x1, r.zb, r.zf]);
  try {
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + (i + .5) * cs, z = z0 + (j + .5) * cs; const y = B.floorY(x, z, .4); fl[j * nx + i] = y; free[j * nx + i] = B.overlap(x, y, z, 1.7).length ? 0 : 1; }
    let si = Math.floor((P.x - x0) / cs), sj = Math.floor((P.z - z0) / cs); if (!(si >= 0 && sj >= 0 && si < nx && sj < nz && free[sj * nx + si])) { // nächste freie Zelle zum Start
      let best = 1e9; for (let j = Math.max(0, sj - 6); j < Math.min(nz, sj + 7); j++) for (let i = Math.max(0, si - 6); i < Math.min(nx, si + 7); i++) if (free[j * nx + i]) { const d = (i - si) ** 2 + (j - sj) ** 2; if (d < best) { best = d; var bi = i, bj = j; } } if (best < 1e9) { si = bi; sj = bj; } }
    const N8 = []; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (a || b) N8.push([a, b]);
    let nF = 0, nR = 0;
    // vorwärts
    { const q = [[si, sj]]; F[sj * nx + si] = 1; while (q.length) { const [i, j] = q.pop(); nF++; for (const [a, b] of N8) { const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue; const m = nj * nx + ni; if (F[m] || !free[m]) continue; if (fl[m] - fl[j * nx + i] > 1.5) continue; F[m] = 1; q.push([ni, nj]); } } }
    // rückwärts: Zelle a kann nach b gehen, wenn fl[b] - fl[a] <= 1,5
    { const q = [[si, sj]]; R[sj * nx + si] = 1; while (q.length) { const [i, j] = q.pop(); nR++; for (const [a, b] of N8) { const ni = i + a, nj = j + b; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue; const m = nj * nx + ni; if (R[m] || !free[m]) continue; if (fl[j * nx + i] - fl[m] > 1.5) continue; R[m] = 1; q.push([ni, nj]); } } }
    // Komponenten: (a) Fallen = F und nicht R; (b) nicht erreichbar = frei und nicht F
    const lab = (pred, name) => { const out = []; comp.fill(-1); let id = 0; for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; if (comp[k] >= 0 || !pred(k)) continue; const q = [[i, j]]; comp[k] = id; let n = 0, mnx = 1e9, mxx = -1e9, mnz = 1e9, mxz = -1e9, fy = 0;
        while (q.length) { const [ci, cj] = q.pop(); n++; fy += fl[cj * nx + ci]; mnx = Math.min(mnx, ci); mxx = Math.max(mxx, ci); mnz = Math.min(mnz, cj); mxz = Math.max(mxz, cj); for (const [a, b] of N8) { const ni = ci + a, nj = cj + b; if (ni < 0 || nj < 0 || ni >= nx || nj >= nz) continue; const m = nj * nx + ni; if (comp[m] >= 0 || !pred(m)) continue; comp[m] = id; q.push([ni, nj]); } }
        const bb = [x0 + mnx * cs, x0 + (mxx + 1) * cs, z0 + mnz * cs, z0 + (mxz + 1) * cs], cx = (bb[0] + bb[1]) / 2, cz = (bb[2] + bb[3]) / 2;
        out.push({ art: name, area: r2(n * cs * cs), bb: bb.map(r2), floorY: r2(fy / n), inRect: rects.some(r => cx > r[0] && cx < r[1] && cz > r[2] && cz < r[3]), nearV: veh.some(v => cx > v.minX - 1 && cx < v.maxX + 1 && cz > v.minZ - 1 && cz < v.maxZ + 1) }); id++; }
      return out.sort((a, b) => b.area - a.area); };
    const traps = lab(k => F[k] && !R[k], 'Falle'), unreach = lab(k => free[k] && !F[k], 'nicht erreichbar');
    let nFree = 0; for (let k = 0; k < free.length; k++) nFree += free[k];
    return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'falle') + '.json', { box: cfg.box, cs, cells: nx * nz, frei: nFree, vorwaerts_m2: r2(nF * cs * cs), rueckwaerts_m2: r2(nR * cs * cs), start: [P.x, P.z].map(r2), sek: r2((performance.now() - t0) / 1000), fallen: traps.slice(0, 60), unerreichbar: unreach.slice(0, 60), nFallen: traps.length, nUnerreichbar: unreach.length });
  } finally { WK.forEach(f => WT.push(f)); }
})()
