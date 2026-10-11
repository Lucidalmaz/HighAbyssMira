(async () => { const B = window.__BW, E = B.E, T = E.THREE; const ev = (window.__k6 || window.__villa).ev; const IA = ev('interactables'); const I = window.__iap; const out = [];
  const lab = h => { let l = h.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = ''; } return String(l); };
  const rx = /funkgerät abstimmen|radio einschalten|fernseher|code eingeben|radio$|rekorder|tonband|kassette/i; const seen = new Set();
  for (const h of IA) { const l = lab(h); if (!rx.test(l)) continue; const wp = h.getWorldPosition(new T.Vector3()); const k = l + wp.x.toFixed(0) + wp.z.toFixed(0); if (seen.has(k)) continue; seen.add(k);
    for (const a of [0, 1.57, 3.14, 4.71]) { const px = wp.x + Math.sin(a) * 1.0, pz = wp.z + Math.cos(a) * 1.0; if (B.overlap(px, B.floorY(px, pz, wp.y), pz, 1.7).length) continue; B.place(px, B.floorY(px, pz, wp.y) + .02, pz, a + Math.PI); break; }
    for (let i = 0; i < 20; i++) B.upd(1 / 30); E.state.talking = false; E.ui.paused = false; E.player.pitch = -.3;
    const n0 = I.G.act.length; const row = { l, pos: [wp.x, wp.y, wp.z].map(v => +v.toFixed(2)) };
    try { h.userData.action(); } catch (e) { row.err = String(e.message).slice(0, 80); }
    row.acts = I.G.act.map(t => [t.mode, t.axis, t.size && +t.size.toFixed(3)]);
    for (let i = 0; i < 24; i++) B.upd(1 / 30); row.rot = I.G.act.length; E.ui.paused = true; E.free(); out.push(row); }
  // Tastenfeld
  try { const kp = ev('typeof kpPress'); out.push({ kpPress: kp }); } catch (e) {}
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/device_test2.json', out);
})()
