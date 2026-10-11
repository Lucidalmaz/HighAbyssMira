(async () => { const B = window.__BW, E = B.E, T = E.THREE; const ev = (window.__k6 || window.__villa).ev; const IA = ev('interactables'); const cfg = window.__BWCFG; const out = [];
  const lab = h => { let l = h.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = ''; } return String(l); };
  const rx = new RegExp(cfg.rx, 'i');
  for (const h of IA) { const l = lab(h); if (!rx.test(l)) continue; const wp = h.getWorldPosition(new T.Vector3()); const reg = new T.Box3().setFromCenterAndSize(wp, new T.Vector3(1.4, 1.4, 1.4)); const row = { l, pos: wp.toArray().map(v => +v.toFixed(2)), ms: [] };
    E.scene.traverse(m => { if (!m.isMesh || !m.geometry) return; for (let p = m; p; p = p.parent) if (!p.visible) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); if (!b.intersectsBox(reg)) return; const s = b.getSize(new T.Vector3()); if (Math.max(s.x, s.y, s.z) > 4) return;
      const ch = []; for (let p = m; p && ch.length < 4; p = p.parent) ch.push(p.name || p.type); row.ms.push({ tri: m.geometry.index ? m.geometry.index.count / 3 : m.geometry.attributes.position.count / 3, s: s.toArray().map(v => +v.toFixed(2)), c: b.getCenter(new T.Vector3()).toArray().map(v => +v.toFixed(2)), ch: ch.join('<'), mat: (Array.isArray(m.material) ? m.material[0] : m.material).name || '' }); });
    out.push(row); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/near.json', out); })()
