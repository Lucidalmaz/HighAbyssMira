(async () => { const W = ms => new Promise(r => setTimeout(r, ms)); const T = G.THREE; const res = {};
 const car = window.__lucy3.car(); const P1 = (G.PHOTOS || [])[1];
 res.have = { car: !!car, photos: !!P1, mesh: !!(P1 && P1.mesh) };
 if (!P1) return JSON.stringify(res);
 const m = P1.mesh; m.updateMatrixWorld(true); const wp = new T.Vector3(); m.getWorldPosition(wp); res.polaroidWorld = wp.toArray().map(v => +v.toFixed(2)); res.visible = m.visible; res.parent = m.parent && m.parent.type;
 res.carPos = car && car.position.toArray().map(v => +v.toFixed(2)); res.open = car && car.userData.open;
 // Collider und Occluder rund um das Foto
 res.cols = G.colliders.filter(c => c.minX > -9000 && c.maxX > wp.x - 4 && c.minX < wp.x + 4 && c.maxZ > wp.z - 4 && c.minZ < wp.z + 4).map(c => [c.minX, c.maxX, c.minZ, c.maxZ, c.top, c.base].map(n => +n.toFixed(2)));
 const B = new T.Box3(); res.occ = G.occluders.filter(o => { B.setFromObject(o); return B.max.x > wp.x - 3 && B.min.x < wp.x + 3 && B.max.z > wp.z - 3 && B.min.z < wp.z + 3; }).map(o => { B.setFromObject(o); return { n: o.name, vis: o.visible, box: B.min.toArray().concat(B.max.toArray()).map(v => +v.toFixed(2)), act: !!o.userData.action }; });
 res.ia = G.interactables.filter(o => { o.getWorldPosition(wp); return Math.hypot(wp.x - 1.9, wp.z + 37) < 4; }).map(o => { const p = new T.Vector3(); o.getWorldPosition(p); B.setFromObject(o); return { lab: typeof o.userData.label === 'function' ? o.userData.label() : o.userData.label, p: p.toArray().map(v => +v.toFixed(2)), size: B.getSize(new T.Vector3()).toArray().map(v => +v.toFixed(2)), vis: o.visible }; });
 // Strahlen: 8 Standpunkte x 3 Blickhöhen (Augenhöhe 1.7 / gebückt 1.0 / 1.4), Reichweite 2.7, Ziel = Foto (aus Kamera-Mitte); Treffer = erstes Objekt in interactables+occluders ist das Foto
 const tgt = new T.Vector3(); m.getWorldPosition(tgt);
 const test = (door) => { const out = []; const cx = 1.9, cz = -37;
   for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; let best = { hit: 0, n: 0, first: {} };
     for (const R of [1.6, 2.0, 2.4]) { const px = cx + Math.cos(a) * R, pz = cz + Math.sin(a) * R; if (G.colliders.some(c => c.top > 90 && c.minX > -9000 && px > c.minX && px < c.maxX && pz > c.minZ && pz < c.maxZ)) { continue; } // im Wagen-Collider: nicht begehbar
       let h = 0, n = 0; const first = {};
       for (const eye of [1.7, 1.45, 1.0]) for (const jx of [-.12, 0, .12]) { const o = new T.Vector3(px, eye, pz), t = tgt.clone().add(new T.Vector3(jx * (Math.sin(a)), 0, jx * (-Math.cos(a)))); const d = t.clone().sub(o); const dist = d.length(); if (dist > 2.7) continue; d.normalize(); n++; const rc = new T.Raycaster(o, d, 0, 2.7); const hits = rc.intersectObjects(G.interactables.concat(G.occluders), false); const f = hits[0]; const nm = f ? (f.object.userData.label === 'Polaroid nehmen' || (typeof f.object.userData.label === 'function' && f.object.userData.label() === 'Polaroid nehmen') ? 'FOTO' : (f.object.userData.label ? 'IA:' + (typeof f.object.userData.label === 'function' ? f.object.userData.label() : f.object.userData.label) : 'OCC:' + (f.object.name || f.object.geometry.type))) : 'nichts'; first[nm] = (first[nm] || 0) + 1; if (f && f.object.userData.label && (typeof f.object.userData.label === 'function' ? f.object.userData.label() : f.object.userData.label) === 'Polaroid nehmen') h++; }
       if (n && h / n >= best.hit / Math.max(1, best.n)) best = { hit: h, n, R, first }; }
     out.push(best); } return out; };
 G.player.pos.set(1.9 + 3, 0, -37 + 3); await W(500);
 res.closed = test(false);
 // Tür öffnen wie im Spiel (Auslöser der Türbox)
 const dm = car.userData.doorMesh; res.doorHasAction = !!(dm && dm.userData.action);
 if (dm && dm.userData.action && !car.userData.open) { dm.userData.action(); await W(1500); }
 res.open2 = car.userData.open; m.updateMatrixWorld(true); m.getWorldPosition(tgt); res.polaroidWorldOpen = tgt.toArray().map(v => +v.toFixed(2));
 res.openTest = test(true);
 // Aufheben pr�fen: Strahl auf die Klickfl�che, Aktion ausl�sen
 const box = G.interactables.find(o => typeof o.userData.label === 'function' && o.userData.label() === 'Polaroid nehmen'); res.boxFound = !!box; if (box) { box.userData.action(); await W(1200); res.picked = G.story.photos.has(1); res.photoCount = G.story.photos.size; }
 return JSON.stringify(res);
})()
