(async () => { const B = window.__BW, E = B.E, T = E.THREE; const cfg = window.__BWCFG; const out = [];
  const tgt = new T.Vector3(...cfg.t); const rc = new T.Raycaster();
  for (const a of [0, 1.57, 3.14, 4.71]) { const o = new T.Vector3(tgt.x + Math.sin(a) * 1.5, tgt.y + .2, tgt.z + Math.cos(a) * 1.5); const d = tgt.clone().sub(o).normalize(); rc.set(o, d); rc.far = 3;
    const hs = rc.intersectObjects(E.scene.children, true).filter(h => h.object.isMesh && h.object.visible && h.object.material !== undefined && !(h.object.userData && h.object.userData.hidden));
    out.push({ a, o: o.toArray().map(v => +v.toFixed(2)), hits: hs.slice(0, 3).map(h => ({ d: +h.distance.toFixed(2), p: h.point.toArray().map(v => +v.toFixed(3)), n: h.face ? h.face.normal.toArray().map(v => +v.toFixed(2)) : null, tri: h.object.geometry.index ? h.object.geometry.index.count / 3 : -1, nm: h.object.name || (h.object.parent && h.object.parent.name) || '', op: h.object.material && h.object.material.opacity })) }); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/ray.json', out); })()
