(async () => { const B = window.__BW, E = B.E, r2 = B.r2, P = E.player.pos; const out = { findArea: null, thick: [], thin: [], crawl: [] };
  // freie Fläche suchen: 14 x 14 m ohne Kisten/Netze (Außenbereich Straße)
  const free = (x, z) => { for (let dx = -7; dx <= 7; dx += 1) for (let dz = -7; dz <= 7; dz += 1) { if (B.overlap(x + dx, 0, z + dz, 1.7).length) return false; } return true; };
  let spot = null; for (const z0 of [2, 40, 90, -20, 130]) { for (let x = -120; x <= 120 && !spot; x += 8) if (free(x, z0)) spot = [x, z0]; if (spot) break; }
  out.findArea = spot; if (!spot) return B.dump('C:/Users/GIGABYTE/_qa_bew/out/synth.json', out);
  const [sx, sz] = spot; const col = (x0, x1, z0, z1, base, top) => { const c = { minX: x0, maxX: x1, minZ: z0, maxZ: z1, base, top, __synth: 1 }; E.colliders.push(c); return c; };
  const cleanup = () => { const C = E.colliders; for (let i = C.length - 1; i >= 0; i--) if (C[i].__synth) { C[i].minX = C[i].maxX = -9999; } };
  const WT = window.G.WORLD_TICK, WK = WT.slice();
  try {
    for (const h of [.4, .6, .8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6, 3.0]) { cleanup();
      const b = { minX: sx - .8, maxX: sx + .8, minZ: sz - .8, maxZ: sz + .8, base: 0, top: h }; col(b.minX, b.maxX, b.minZ, b.maxZ, 0, h);
      const res = []; for (const d of [0, 1, 2, 3]) { const r = B.sprungTest(b, d, {}); delete r.tr; res.push([r.cls, r.end, r.mantle]); }
      out.thick.push({ h, res }); }
    for (const h of [.6, .9, 1.2, 1.5, 1.8, 2.2]) { cleanup();
      const b = { minX: sx - 3, maxX: sx + 3, minZ: sz - .1, maxZ: sz + .1, base: 0, top: h }; col(b.minX, b.maxX, b.minZ, b.maxZ, 0, h);
      const res = []; for (const d of [0, 2]) { const r = B.sprungTest(b, d, {}); delete r.tr; res.push([r.cls, r.end, r.mantle]); }
      out.thin.push({ h, res }); }
    // Kante: Spieler steht mit der Körpermitte 0…30 cm außerhalb der Kante einer 1,0 m hohen Kiste – ab wann rutscht er ab?
    cleanup(); { const b = { minX: sx - .8, maxX: sx + .8, minZ: sz - .8, maxZ: sz + .8, base: 0, top: 1.0 }; col(b.minX, b.maxX, b.minZ, b.maxZ, 0, 1.0); out.kante = [];
      for (const off of [0, .05, .1, .15, .2, .25, .3, .4]) { B.place(sx, 1.02, sz, 0); P.set(b.maxX + off, 1.0, sz); E.vel.set(0, 0, 0); E.setS(true, 0); const WT = window.G.WORLD_TICK, WK = WT.slice(); WT.length = 0;
        try { for (let i = 0; i < 40; i++) B.upd(1 / 40); } finally { WK.forEach(f => WT.push(f)); } out.kante.push([off, r2(P.y), r2(P.x)]); } }
    cleanup();
  } finally { cleanup(); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/synth.json', out);
})()
