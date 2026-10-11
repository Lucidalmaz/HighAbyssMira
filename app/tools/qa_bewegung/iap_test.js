(async () => { const B = window.__BW, E = B.E, P = E.player.pos, r2 = B.r2; const I = window.__iap, T = E.THREE; const cfg = window.__BWCFG || {};
  const ev = (window.__k6 || window.__villa).ev; const IA = ev('interactables'); const out = [];
  const lab = h => { let l = h.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = '?'; } return String(l); };
  const list = IA.filter(h => h.userData && h.userData.iap); const seen = new Set();
  const V = new T.Vector3(), Q = new T.Quaternion();
  for (const h of list) { const wp = h.getWorldPosition(new T.Vector3()); const k = lab(h) + wp.x.toFixed(1) + wp.z.toFixed(1); if (seen.has(k)) continue; seen.add(k);
    if (cfg.box && (wp.x < cfg.box[0] || wp.x > cfg.box[1] || wp.z < cfg.box[2] || wp.z > cfg.box[3])) continue;
    const typ = h.userData.iap; const row = { label: lab(h).slice(0, 30), typ, pos: [wp.x, wp.y, wp.z].map(r2) };
    // Spieler 1.4 m vor die Klickfläche (Seite mit freiem Boden)
    let placed = false; for (const a of [0, 1.57, 3.14, 4.71]) { const px = wp.x + Math.sin(a) * 1.4, pz = wp.z + Math.cos(a) * 1.4; if (B.overlap(px, B.floorY(px, pz, wp.y), pz, 1.7).length) continue; B.place(px, B.floorY(px, pz, wp.y) + .02, pz, a + Math.PI); placed = true; break; }
    if (!placed) { row.res = 'kein Standplatz'; out.push(row); continue; }
    for (let i = 0; i < 4; i++) B.upd(1 / 30); // Verzeichnis um den Spieler
    const rec = I.f.teil(h, typ); row.teil = rec ? (rec.n.slice(0, 24) + ' ' + [rec.s.x, rec.s.y, rec.s.z].map(r2).join('x')) : null;
    E.state.talking = false; E.ui.paused = false; const snds = []; const A = ev('Audio'), op = A.play; A.play = function (n) { snds.push(n); return op.apply(this, arguments); };
    try { h.userData.action(); } catch (e) { row.err = String(e.message).slice(0, 80); }
    const C = I.ctl.get(h); row.ctl = C ? (C.mode + ':' + C.typ) : 'kein Teil';
    const corners = o => { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox, out = []; o.updateWorldMatrix(true, false); for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) out.push(new T.Vector3(x, y, z).applyMatrix4(o.matrixWorld)); return out; };
    const part = C && C.mode !== 'wippen' ? C.part : null; const c0 = part ? corners(part) : null;
    let maxA = 0, maxT = 0; const o = C ? (C.mode === 'wippen' ? C.part : C.piv) : null; const p0 = o ? o.position.clone() : null;
    for (let i = 1; i <= 36; i++) { B.upd(1 / 30); await new Promise(r => setTimeout(r, 8)); if (o) { maxA = Math.max(maxA, Math.abs(o.rotation.x), Math.abs(o.rotation.y), Math.abs(o.rotation.z)); maxT = Math.max(maxT, o.position.distanceTo(p0)); } }
    E.ui.paused = true; if (part) { for (let i = 0; i < 12; i++) B.upd(1 / 30); const c1 = corners(part); const d = c0.map((p, i) => p.distanceTo(c1[i])); row.fix = d.filter(v => v < .04).length; row.dmax = +Math.max(...d).toFixed(2); const m0 = c0.reduce((a, p) => a.add(p), new T.Vector3()).multiplyScalar(1 / 8), m1 = c1.reduce((a, p) => a.add(p), new T.Vector3()).multiplyScalar(1 / 8); const dv = m1.clone().sub(m0), pv = new T.Vector3(P.x, 0, P.z).sub(new T.Vector3(m0.x, 0, m0.z)); row.weg = +(dv.x * pv.x + dv.z * pv.z).toFixed(2); }
    row.rotMax = o ? +(maxA * 57.3).toFixed(1) : null; row.shift = o ? +maxT.toFixed(2) : null; row.k = C ? +C.k.toFixed(2) : null; row.open = C ? C.open : null;
    if (C && (C.mode === 'gleit' || (C.mode === 'dreh' && C.typ !== 'tuer' && C.typ !== 'auto'))) { E.ui.paused = false; try { h.userData.action(); } catch (e) {} for (let i = 1; i <= 30; i++) { B.upd(1 / 30); await new Promise(r => setTimeout(r, 8)); } E.ui.paused = true; row.k2 = +C.k.toFixed(2); row.open2 = C.open; }
    row.snd = [...new Set(snds)].slice(0, 3); A.play = op; E.free(); E.state.talking = false; out.push(row); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'iap_test') + '.json', out);
})()
