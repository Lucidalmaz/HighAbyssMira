(async () => { const B = window.__BW, E = B.E, P = E.player.pos, r2 = B.r2; const out = []; const ev = (window.__k6 || window.__villa).ev; const doors = ev('doors');
  const WT = window.G.WORLD_TICK, WK = WT.slice();
  for (let i = 0; i < doors.length; i++) { const D = doors[i]; if (!D.saved || D.col.__tot) { out.push({ i, res: 'ohne Kiste' }); continue; } const c = D.saved; const alongX = (c.maxX - c.minX) >= (c.maxZ - c.minZ);
    const mx = (c.minX + c.maxX) / 2, mz = (c.minZ + c.maxZ) / 2; const row = { i, locked: !!D.locked, winkel: Math.round(Math.abs(D.openAngle) * 57.3), pos: [r2(mx), r2(mz)] };
    for (const mode of ['offen', 'zu']) {
      if (mode === 'offen') { D.set(true); D.cur = D.openAngle; D.pivot.rotation.y = D.openAngle; } else { D.set(false); D.cur = 0; D.pivot.rotation.y = 0; }
      E.scene.updateMatrixWorld(true); const sx = alongX ? mx : mx - 1.6, sz = alongX ? mz - 1.6 : mz; const yaw = alongX ? Math.PI : -Math.PI / 2;
      B.place(sx, B.floorY(sx, sz, .3) + .02, sz, yaw); for (let q = 0; q < 90; q++) B.upd(1 / 30); WT.length = 0; E.keys.KeyW = true; B.key('KeyW', true); const p0 = [P.x, P.z];
      try { for (let k = 0; k < 120; k++) B.upd(1 / 40); } finally { B.releaseAll(); WK.forEach(f => WT.push(f)); }
      const d = alongX ? P.z - p0[1] : P.x - p0[0]; row[mode] = r2(Math.abs(d)); }
    row.res = 'ok'; row.durchOffen = row.offen > 2.6; row.gesperrtZu = row.zu < 1.6; out.push(row);
    D.set(false); D.cur = 0; D.pivot.rotation.y = 0; }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/door_k1.json', out);
})()
