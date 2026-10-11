(async () => { const B = window.__BW, E = B.E, P = E.player.pos, r2 = B.r2; const out = {};
  const WT = window.G.WORLD_TICK, WK = WT.slice();
  const run = (label, keysAir, sprint) => { B.place(-100, .02, 6, -Math.PI / 2); WT.length = 0;
    try { E.keys.KeyW = true; B.key('KeyW', true); if (sprint) { E.keys.ShiftLeft = true; B.key('ShiftLeft', true); } for (let i = 0; i < 40; i++) B.upd(1 / 40);
      const x0 = P.x, z0 = P.z; B.key('Space', true); B.key('Space', false); let apex = 0, t = 0, lat = 0;
      for (const k of keysAir) { E.keys[k] = true; B.key(k, true); }
      for (let i = 0; i < 120; i++) { B.upd(1 / 40); t += 1 / 40; apex = Math.max(apex, P.y); if (E.grounded && i > 4) break; }
      out[label] = { apex: r2(apex), t: r2(t), dx: r2(P.x - x0), dz: r2(P.z - z0) }; }
    finally { B.releaseAll(); WK.forEach(f => WT.push(f)); } };
  run('gehen_gerade', [], false); run('gehen_D', ['KeyD'], false); run('gehen_A', ['KeyA'], false); run('sprint_gerade', [], true); run('sprint_D', ['KeyD'], true); run('gehen_S_bremsen', ['KeyS'], false);
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/aircontrol.json', out);
})()
