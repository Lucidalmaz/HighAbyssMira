(async () => { const MODE = window.__surveyMode || 'new'; const W = ms => new Promise(r => setTimeout(r, ms)); const T = G.THREE; const out = [];
 const C2 = G.C2, C3 = G.C3; const SK = window.__echo.SK;
 const list = G.ECHOES.slice();
 const have = id => list.some(e => e.id === id);
 const E_ = (x, z, ry = 0, s = 1) => [x, z, ry, s];
 const PI = Math.PI;
 if (!have('echo_k3_klar')) list.push({ id: 'echo_k3_klar', at: [33, 1.1, 69.4], figs: [E_(33.4, 70.4, 0, .58), E_(34.8, 70.6, -.6, .58), E_(33.9, 69.6, .3, .58)], lines: [] });
 if (!have('echo_k3_treppe6')) list.push({ id: 'echo_k3_treppe6', at: [22, 1.1, 12.2], figs: [E_(22.3, 12.6, PI, .52), E_(19.5, 8, -PI / 2, .56), E_(20.5, 8, -PI / 2, .57), E_(21.5, 8, -PI / 2, .55), E_(18.4, 8, -PI / 2, 1.14)], lines: [] });
 if (!have('echo_roxy_juni')) list.push({ id: 'echo_roxy_juni', at: [-114.2, 1.1, 29.2], figs: [E_(-113.6, 28.6, -2.2, 1)], lines: [] });
 const ground = (x, y, z) => { let g = -Infinity; for (const c of G.colliders) if (c.top > g && c.top <= y + .45 && c.top >= y - .5 && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ && c.top < 90) g = c.top; try { const s = G.solidGround(x, y + .05, z); if (s > g && s <= y + .45 && s >= y - .5) g = s; } catch (e) {} return g === -Infinity ? null : g; };
 const bone = (o, re) => { let r = []; o.traverse(b => { if ((b.isBone || b.type === 'Object3D') && re.test(b.name)) r.push(b); }); return r; };
 const v = new T.Vector3();
 for (const E of list) {
   const ent = { id: E.id, at: E.at, figs: [] };
   try {
     G.state.talking = false; G.echoSeen && 0;
     const px = E.at[0], pz = E.at[2];
     G.player.pos.set(px + 2.5, E.at[1] > 1.2 ? .43 : 0, pz + 2.5); await W(900); __look(E.at[0], .9, E.at[2]); await W(300);
     const fl = E.floor !== undefined ? E.floor : (E.at[1] > 1.2 ? .43 : 0);
     E.figs.forEach((f, i) => { const F = window.__echo.figs[i]; F.position.set(f[0], fl, f[1]); F.rotation.y = f[2]; F.scale.setScalar(f[3]); F.visible = true; });
     const t0 = performance.now();
     if (MODE === 'old') { const cast = window.__echo.FE[E.id]; if (cast) await Promise.race([Promise.all(E.figs.map((f, i) => cast[i] ? __figuren.embody(window.__echo.figs[i], cast[i], { ghost: true, doll: f[3] < .45, clip: f[3] < .45 ? 'idle' : null }) : null)), W(30000)]); }
     else if (window.__echo.cast.start) await Promise.race([window.__echo.cast.start(E), W(30000)]);
     ent.castMs = Math.round(performance.now() - t0);
     __look(E.at[0], .9, E.at[2]); await W(2500);
     E.figs.forEach((f0, i) => { let f = f0; const F = window.__echo.figs[i]; const P = F.userData.person; F.updateMatrixWorld(true);
       const fx = F.position.x, fz = F.position.z, fry = F.rotation.y; f = [fx, fz, fry, f[3]]; const r = { i, pos: [fx, fz].map(n => +n.toFixed(2)), ry: +fry.toFixed(2), s: f[3], id: P && P.id, clip: P && P.curK, sit: P && P.sit, drop: P && +(P.mv.drop || 0).toFixed(3), oy: P && +P.obj.position.y.toFixed(3) };
       let footY = null, hipY = null, headY = null, hx = null, hz = null, legs = null;
       if (P && P.obj) { P.obj.updateMatrixWorld(true); const bs = []; P.obj.traverse(b => { if (b.isBone) bs.push(b); });
         const feet = bs.filter(b => /foot|toe/i.test(b.name)); let mn = 1e9; feet.forEach(b => { b.getWorldPosition(v); if (v.y < mn) mn = v.y; }); if (feet.length) footY = mn;
         const h = P.rig && P.rig.hips; if (h) { h.getWorldPosition(v); hipY = v.y; hx = v.x; hz = v.z; } if (P.rig && P.rig.legs && P.rig.legs[0]) { legs = P.rig.legs[0].map(b => { b.getWorldPosition(v); return +v.y.toFixed(2); }); } const hd = bs.find(b => /head$/i.test(b.name)); if (hd) { hd.getWorldPosition(v); headY = v.y; } }
       else { const B = new T.Box3().setFromObject(F); footY = B.min.y; headY = B.max.y; hipY = footY + (B.max.y - B.min.y) * .5; }
       r.legs = legs; r.hipXZ = hx === null ? null : [+hx.toFixed(2), +hz.toFixed(2)]; r.foot = footY === null ? null : +footY.toFixed(3); r.hip = hipY === null ? null : +hipY.toFixed(3); r.head = headY === null ? null : +headY.toFixed(3); r.Fy = +F.position.y.toFixed(3);
       const g0 = ground(f[0], fl + .1, f[1]), gh = ground(f[0], F.position.y + .5, f[1]); r.gnd = g0 === null ? null : +g0.toFixed(3); r.gndHigh = gh === null ? null : +gh.toFixed(3);
       // Wand-Collider im Umkreis (senkrechte Kästen, deren Spanne die Körperhöhe schneidet)
       const rad = .22 * Math.max(.6, f[3]); const walls = []; for (const c of G.colliders) { if (c.top > 90 && c.base < -50) continue; if (c.minX < -9000) continue; const wallLike = c.top > fl + .9 && (c.base === undefined || c.base < fl + .5); if (!wallLike) continue; const cx = Math.max(c.minX, Math.min(f[0], c.maxX)), cz = Math.max(c.minZ, Math.min(f[1], c.maxZ)); if (Math.hypot(cx - f[0], cz - f[1]) < rad) walls.push([c.minX, c.maxX, c.minZ, c.maxZ, c.top, c.base].map(n => +n.toFixed(2))); }
       if (walls.length) r.walls = walls.slice(0, 3);
       // nächster Stuhl (Messraum)
       if (SK) { let b = null, bd = 9; SK.forEach((k, j) => { const d = Math.hypot(k.x - f[0], k.z - f[1]); if (d < bd) { bd = d; b = j; } }); r.chair = b === null ? null : { j: b, d: +bd.toFixed(2) }; }
       const dx = E.at[0] - f[0], dz = E.at[2] - f[1]; r.faceErr = +(Math.abs(Math.atan2(Math.sin(Math.atan2(dx, dz) - f[2]), Math.cos(Math.atan2(dx, dz) - f[2]))) * 57.3).toFixed(0);
       ent.figs.push(r); });
     if (window.__echo.cast.end) window.__echo.cast.end(E);
   } catch (e) { ent.err = String(e && e.stack || e).slice(0, 300); }
   window.__echo.figs.forEach(F => F.visible = false);
   out.push(ent);
 }
 return JSON.stringify(out);
})()
