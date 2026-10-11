(async () => { const B = window.__BW, E = B.E, T = E.THREE; const ev = (window.__k6 || window.__villa).ev; const IA = ev('interactables'); const out = [];
  for (const h of IA) { if (!h.userData) continue; let l = h.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = '?'; } l = String(l);
    if (!/besteck|registratur|tresen|schublade|kommode|schrank|fach|truhe|kiste|koffer|tür|tor\b/i.test(l)) continue;
    const wp = h.getWorldPosition(new T.Vector3()); out.push([l.slice(0, 40), +wp.x.toFixed(1), +wp.y.toFixed(1), +wp.z.toFixed(1), h.userData.iap || '', h.userData.iapG ? 'G' : '', typeof h.userData.action === 'function' ? 'a' : '-']); }
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/find_sch.json', out); })()
