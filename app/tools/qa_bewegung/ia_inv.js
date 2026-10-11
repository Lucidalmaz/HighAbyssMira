(async () => { const B = window.__BW, E = B.E, r2 = B.r2, P = E.player.pos; const cfg = window.__BWCFG || {}; const t0 = performance.now(), budget = (cfg.budget || 85) * 1000;
  const ev = (window.__k6 || window.__villa).ev; const T = E.THREE;
  let S = window.__IAINV;
  const nm = o => { const a = []; for (let p = o, i = 0; p && i < 4; p = p.parent, i++) a.push(p.name || p.type); return a.join('<'); };
  const labelOf = o => { let l = o.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = '?'; } return String(l == null ? '' : l); };
  const visible = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  if (!S || S.kap !== cfg.kap || cfg.reset) {
    const IA = ev('interactables'); const hidden = ev('hidden'); const list = []; const seen = new Set(); const V = new T.Vector3();
    for (const o of IA) { if (!o || !o.userData || typeof o.userData.action !== 'function' || !o.parent) continue; o.getWorldPosition(V); const l = labelOf(o); if (cfg.rx && !new RegExp(cfg.rx, 'i').test(l + ' ' + nm(o))) continue; const k = l + '|' + V.x.toFixed(1) + '|' + V.z.toFixed(1) + '|' + V.y.toFixed(1); if (seen.has(k)) continue; seen.add(k);
      if (cfg.box && (V.x < cfg.box[0] || V.x > cfg.box[1] || V.z < cfg.box[2] || V.z > cfg.box[3])) continue;
      const m = Array.isArray(o.material) ? o.material[0] : o.material;
      list.push({ o, label: l, pos: [V.x, V.y, V.z], name: nm(o), hiddenMat: !!(m && (m === hidden || m.visible === false || m.opacity === 0 || m.colorWrite === false)), vis: visible(o), isMesh: !!o.isMesh }); }
    list.sort((a, b) => (Math.floor(a.pos[0] / 30) - Math.floor(b.pos[0] / 30)) || (Math.floor(a.pos[2] / 30) - Math.floor(b.pos[2] / 30)) || a.pos[0] - b.pos[0]);
    S = window.__IAINV = { kap: cfg.kap, list, i: 0, rows: [], t: 0 }; }
  const A = ev('Audio'); const snds = []; const oPlay = A.play; A.play = function (n) { try { snds.push(typeof n === 'string' ? n : '?'); } catch (e) {} return oPlay.apply(this, arguments); };
  const oStep = A.step; const DANGER = /schlaf|speicher|kapitel\s*\d|nach hause|heimfahren|fahr heim|aufgeben|beenden|spielstand|abspann|ende\b|sterben|neu starten/i;
  const snap = (cx, cy, cz, R) => { const m = new Map(); const V = new T.Vector3(); E.scene.updateMatrixWorld(true);
    E.scene.traverse(o => { if (o === E.scene || o.isLight || o.isCamera) return; const e = o.matrixWorld.elements; if (Math.abs(e[12] - cx) > R || Math.abs(e[14] - cz) > R || Math.abs(e[13] - cy) > R + 2) return; m.set(o, { e: Float32Array.from(e), v: visible(o) }); }); return m; };
  const diff = (a) => { const out = { n: 0, maxT: 0, maxR: 0, top: [], vis: 0 }; const arr = [];
    for (const [o, s] of a) { const e = o.matrixWorld.elements; let dt = Math.hypot(e[12] - s.e[12], e[13] - s.e[13], e[14] - s.e[14]);
      // Drehung: Winkel zwischen Basisvektoren
      let dr = 0; for (const k of [0, 4, 8]) { const x0 = s.e[k], y0 = s.e[k + 1], z0 = s.e[k + 2], x1 = e[k], y1 = e[k + 1], z1 = e[k + 2]; const l0 = Math.hypot(x0, y0, z0) || 1, l1 = Math.hypot(x1, y1, z1) || 1; const c = (x0 * x1 + y0 * y1 + z0 * z1) / (l0 * l1); dr = Math.max(dr, Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI); }
      const v1 = visible(o); if (v1 !== s.v) out.vis++;
      if (dt > .02 || dr > 2) { out.n++; arr.push([dt, dr, nm(o)]); out.maxT = Math.max(out.maxT, dt); out.maxR = Math.max(out.maxR, dr); } }
    arr.sort((x, y) => (y[0] + y[1] * .02) - (x[0] + x[1] * .02)); out.top = arr.slice(0, 3).map(x => [r2(x[0]), Math.round(x[1]), x[2]]); return out; };
  const colAct = (cx, cz, R) => { let n = 0, hi = 0; for (const c of E.colliders) { if (c.minX < -9000) continue; if (c.maxX < cx - R || c.minX > cx + R || c.maxZ < cz - R || c.minZ > cz + R) continue; n++; hi += c.top - c.base > 1 ? 1 : 0; } return [n, hi]; };
  try {
    while (S.i < S.list.length && performance.now() - t0 < budget) { const it = S.list[S.i++]; const row = { label: it.label, name: it.name, pos: it.pos.map(r2), hiddenMat: it.hiddenMat, vis: it.vis };
      if (!it.vis) { row.res = 'unsichtbar'; S.rows.push(row); continue; }
      if (DANGER.test(it.label)) { row.res = 'übersprungen (Gefahr)'; S.rows.push(row); continue; }
      const [x, y, z] = it.pos; const ang = Math.random() * 6.28; const px = x + Math.cos(ang) * 1.3, pz = z + Math.sin(ang) * 1.3;
      const f0 = B.floorY(px, pz, y + .3); B.place(px, f0 + .02, pz, Math.atan2(x - px, z - pz) + Math.PI);
      const before = snap(x, y, z, 5); const L0 = it.o.userData.label; const l0 = labelOf(it.o); const c0 = colAct(x, z, 5); snds.length = 0;
      E.state.talking = false; E.ui.paused = false; let err = null; const tA = performance.now();
      try { const r = it.o.userData.action(); if (r && r.then) r.catch(e => {}); } catch (e) { err = String(e.message || e).slice(0, 100); }
      for (let k = 0; k < 36; k++) { B.upd(1 / 30); await new Promise(r => setTimeout(r, 22)); }
      E.ui.paused = true; const l1 = labelOf(it.o); const d = diff(before); const c1 = colAct(x, z, 5); const ov = E.ui.overlay || null;
      const toast = (document.getElementById('toast') || {}).textContent || ''; const sub = (document.getElementById('subtitle') || {}).textContent || '';
      row.res = 'ok'; row.err = err; row.move = d.n; row.maxT = r2(d.maxT); row.maxR = Math.round(d.maxR); row.top = d.top; row.vis2 = d.vis; row.l1 = l1 !== l0 ? l1 : null; row.col = [c0, c1].map(a => a.join('/')).join('→'); row.overlay = ov; row.snd = [...new Set(snds)].slice(0, 4); row.toast = String(toast).slice(0, 60);
      row.shift = r2(Math.hypot(P.x - px, P.z - pz)); try { const I = window.__iap; if (I) { const C = I.ctl.get(it.o); row.iap = it.o.userData.iap ? (C ? { typ: C.typ, part: (C.part.name || '?') + '<' + ((C.part.parent && C.part.parent.parent && C.part.parent.parent.name) || ''), k: +C.k.toFixed(2), open: C.open, rattle: C.rattle, passage: C.passage } : 'kein Teil') : null; } } catch (e) {} S.rows.push(row);
      E.free(); try { ev('closeAllOverlays()'); } catch (e) {} E.state.talking = false; if (row.shift > 6) { B.place(px, f0 + .02, pz, 0); } }
  } finally { A.play = oPlay; E.ui.paused = true; }
  const done = S.i >= S.list.length;
  if (done || cfg.dumpAlways) return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'ia') + '.json', { n: S.list.length, i: S.i, rows: S.rows });
  return 'läuft ' + S.i + '/' + S.list.length;
})()
