(async () => { const B = window.__BW, E = B.E, T = E.THREE; const ev = (window.__k6 || window.__villa).ev; const IA = ev('interactables'); const cfg = window.__BWCFG; const out = [];
  const lab = h => { let l = h.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = ''; } return String(l); };
  const rx = new RegExp(cfg.rx, 'i'); const seen = new Set();
  for (const h of IA) { const l = lab(h); if (!rx.test(l)) continue; const wp = h.getWorldPosition(new T.Vector3()); const k = l + wp.x.toFixed(0) + wp.z.toFixed(0); if (seen.has(k)) continue; seen.add(k);
    const hb = new T.Box3().setFromObject(h); if (hb.isEmpty()) continue; const reg = hb.clone().expandByScalar(.25); const row = { l, pos: [wp.x, wp.y, wp.z].map(v => +v.toFixed(2)), hsize: hb.getSize(new T.Vector3()).toArray().map(v => +v.toFixed(2)), meshes: [] };
    E.scene.traverse(m => { if (!m.isMesh || !m.geometry || !m.geometry.index || m.isSkinnedMesh) return; for (let p = m; p; p = p.parent) if (!p.visible) return; const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox();
      const b = g.boundingBox.clone().applyMatrix4(m.matrixWorld); if (!b.intersectsBox(reg)) return; const tri = g.index.count / 3; if (tri > 60000 || tri < 20) return;
      const P = g.attributes.position, I = g.index, vid = new Map(), par = []; const id = q => { const key = Math.round(P.getX(q) * 500) + ',' + Math.round(P.getY(q) * 500) + ',' + Math.round(P.getZ(q) * 500); let v = vid.get(key); if (v === undefined) { v = par.length; vid.set(key, v); par.push(v); } return v; };
      const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
      const tv = []; for (let t = 0; t < tri; t++) { const a = id(I.getX(t * 3)), c = id(I.getX(t * 3 + 1)), d = id(I.getX(t * 3 + 2)); tv.push([a, c, d]); par[find(a)] = find(c); par[find(c)] = find(d); }
      const comp = new Map(); const v = new T.Vector3(); for (let t = 0; t < tri; t++) { const r = find(tv[t][0]); let c = comp.get(r); if (!c) comp.set(r, c = { n: 0, bb: new T.Box3() }); c.n++; for (let kk = 0; kk < 3; kk++) { v.fromBufferAttribute(P, I.getX(t * 3 + kk)).applyMatrix4(m.matrixWorld); c.bb.expandByPoint(v); } }
      const cs = [...comp.values()].filter(c => reg.intersectsBox(c.bb)).map(c => { const s = c.bb.getSize(new T.Vector3()); return { n: c.n, s: [s.x, s.y, s.z].map(w => +w.toFixed(3)) }; });
      row.meshes.push({ name: (m.name || '') + '<' + ((m.parent && m.parent.name) || ''), tri, ncomp: comp.size, near: cs.length, small: cs.filter(c => Math.max(...c.s) < .14).length, comps: cs.sort((a, b) => b.n - a.n).slice(0, 6) }); });
    out.push(row); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/comp_inspect.json', out);
})()
