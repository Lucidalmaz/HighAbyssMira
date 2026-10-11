(async () => { const B = window.__BW, E = B.E, r2 = B.r2; const cfg = window.__BWCFG || {}; const T = E.THREE;
  const ev = (window.__k6 || window.__villa).ev; const IA = ev('interactables');
  const nm = o => { const a = []; for (let p = o, i = 0; p && i < 4; p = p.parent, i++) a.push(p.name || p.type); return a.join('<'); };
  const labelOf = o => { let l = o.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = '?'; } return String(l == null ? '' : l); };
  const vis = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const PART = /drawer|schublade|door|tuer|tür|lid|deckel|flap|klappe|cdoor|griff|handle|hatch|trunk|boot|window|fenster|gate|tor\b|cover|panel|front/i;
  E.scene.updateMatrixWorld(true);
  // alle sichtbaren Netze mit Teilnamen einsammeln (Name des Netzes oder der direkten Eltern), Raster 4 m
  const grid = new Map(); const bb = new T.Box3(); const V = new T.Vector3();
  E.scene.traverse(o => { if (!o.isMesh || !o.geometry || o.isSkinnedMesh) return; const n1 = o.name || '', n2 = (o.parent && o.parent.name) || ''; const nn = n1 + ' ' + n2; if (!PART.test(nn)) return; if (!vis(o)) return;
    bb.setFromObject(o); if (bb.isEmpty()) return; const c = bb.getCenter(V); const k = Math.floor(c.x / 4) + ',' + Math.floor(c.z / 4); let L = grid.get(k); if (!L) grid.set(k, L = []); L.push({ o, n: nn.trim(), min: bb.min.clone(), max: bb.max.clone() }); });
  const out = [];
  for (const h of IA) { if (!h || !h.userData || typeof h.userData.action !== 'function' || !h.parent || !vis(h)) continue; const l = labelOf(h); if (cfg.rx && !new RegExp(cfg.rx, 'i').test(l + ' ' + nm(h))) continue;
    bb.setFromObject(h); if (bb.isEmpty()) continue; const c = bb.getCenter(V); const m = Array.isArray(h.material) ? h.material[0] : h.material; const hid = !!(m && (m === ev('hidden') || m.visible === false || m.opacity === 0 || m.colorWrite === false));
    const cand = []; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const L = grid.get((Math.floor(c.x / 4) + i) + ',' + (Math.floor(c.z / 4) + j)); if (!L) continue;
      for (const p of L) { const dx = Math.max(0, Math.max(bb.min.x - p.max.x, p.min.x - bb.max.x)), dy = Math.max(0, Math.max(bb.min.y - p.max.y, p.min.y - bb.max.y)), dz = Math.max(0, Math.max(bb.min.z - p.max.z, p.min.z - bb.max.z)); const d = Math.hypot(dx, dy, dz); if (d < .25) cand.push([r2(d), p.n.slice(0, 40), r2(p.max.x - p.min.x), r2(p.max.y - p.min.y), r2(p.max.z - p.min.z)]); } }
    cand.sort((a, b) => a[0] - b[0]);
    out.push({ label: l.slice(0, 40), name: nm(h), hid, pos: [c.x, c.y, c.z].map(r2), size: [bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z].map(r2), cand: cand.slice(0, 4) }); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/' + (cfg.name || 'parts') + '.json', out);
})()
