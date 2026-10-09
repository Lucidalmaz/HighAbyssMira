(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); const T = G.THREE; const out = {}; const v = new T.Vector3();
 const E_ = (x, z, ry = 0, s = 1) => [x, z, ry, s];
 const E = id => G.ECHOES.find(e => e.id === id);
 // Bett im Kinderzimmer: Oberflaeche per Strahl
 G.player.pos.set(-48, .43, -17); await W(1500);
 const g = []; for (let z = -22.0; z <= -19.2; z += .35) { const r = []; for (let x = -52.2; x <= -49.6; x += .35) { const t = window.__echo.scan(x, z, .43, 1.2); r.push(t === null ? '.' : t.toFixed(2)); } g.push('z' + z.toFixed(2) + ' ' + r.join(' ')); } out.bettK = g;
 // Sitz: Stuhl Kueche (27.3,-14.95)
 out.kuecheSitz = window.__echo.sitzAn(27.3, -14.95, .43, { ry: 1.69 }); out.kuecheSitz2 = window.__echo.sitzAn(27.3, -14.95, .43, {});
 out.treppe = [[22.3, 12.43], [22.3, 12.3], [22.3, 12.2]].map(([x, z]) => [x, z, window.__echo.scan(x, z, 0, 1.0)]);
 out.ring = {}; for (const [n, x, z, y0] of [['kueche', 27.3, -14.95, .43], ['kinderstuhl', -50.55, -17.58, .43]]) out.ring[n] = [0,1,2,3,4,5,6,7].map(k => { const a = k * Math.PI / 4; const t = window.__echo.scan(x + Math.sin(a) * .22, z + Math.cos(a) * .22, y0, 1.4); return [+(a).toFixed(2), t === null ? null : +t.toFixed(2)]; });
 // Zeitverlauf der Huefte
 const run = async (id, px, pz, fl, idxs) => { G.player.pos.set(px + 2.5, fl, pz + 2.5); await W(800); const e = E(id); __look(e.at[0], .9, e.at[2]); await W(300);
   e.figs.forEach((f, i) => { const F = window.__echo.figs[i]; F.position.set(f[0], fl, f[1]); F.rotation.y = f[2]; F.scale.setScalar(f[3]); F.visible = true; });
   await window.__echo.cast.start(e); const res = {};
   for (const t of [0, 400, 1200, 3000, 6000]) { if (t) await W(t === 400 ? 400 : t === 1200 ? 800 : t === 3000 ? 1800 : 3000); __look(e.at[0], .9, e.at[2]);
     idxs.forEach(i => { const F = window.__echo.figs[i], P = F.userData.person; if (!P) return; P.obj.updateMatrixWorld(true); const h = P.rig.hips; h.getWorldPosition(v); const L = P.rig.legs[0].map(b => { b.getWorldPosition(v); return +v.y.toFixed(3); }); h.getWorldPosition(v); (res[i] = res[i] || []).push({ t, hip: +v.y.toFixed(3), legs: L, clipT: P.cur ? +P.cur.time.toFixed(2) : null, clip: P.curK, oy: +P.obj.position.y.toFixed(3), seatY: P.mv.seatY }); }); }
   window.__echo.figs.forEach(F => F.visible = false); window.__echo.cast.end(e); return res; };
 out.messraum = await run('echo_messraum', 715.8, -2597.6, 0, [0, 3, 4]);
 out.kueche = await run('echo_kueche', 28.8, -16.2, .43, [0]);
 out.kinder = await run('echo_kinderzimmer', -52, -20, .43, [0]);
 return JSON.stringify(out);
})()
