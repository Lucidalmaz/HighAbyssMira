(async () => { const B = window.__BW, E = B.E, P = E.player.pos; const ev = (window.__k6 || window.__villa).ev; const out = {};
  const MS = ev('MOD_SAVE'); const tore = MS.find(e => e[0] === 'tore'), iap = MS.find(e => e[0] === 'iap');
  const gates = ev('gates');
  // Gartentor 0 öffnen (wie toggleGate), Briefkasten-Zustand aus strasse_S
  const g0 = gates[0]; ev('toggleGate(gates[0])'); const mb = ev('strasse_S.mbSt'); if (mb && mb[0]) { mb[0].st.open = true; mb[0].piv.rotation.x = 1.45; }
  const snap = tore[1](); out.snap = snap; out.gOpen = g0.open;
  // zurücksetzen und wiederherstellen
  g0.open = false; g0.piv.rotation.y = 0; Object.assign(g0.col, g0.saved); if (mb && mb[0]) { mb[0].st.open = false; mb[0].piv.rotation.x = 0; }
  tore[2](JSON.parse(JSON.stringify(snap))); out.nach = { gOpen: g0.open, ry: +g0.piv.rotation.y.toFixed(2), colMin: g0.col.minX, mb: mb && mb[0] ? [mb[0].st.open, +mb[0].piv.rotation.x.toFixed(2)] : null };
  // iap: Deckel/Schublade öffnen, Schlüssel sichern, zurücksetzen, wiederherstellen
  const I = window.__iap; const hit = ev('interactables').find(h => h.userData && h.userData.iap === 'deckel' && /Karteikasten/.test(String(typeof h.userData.label === 'function' ? h.userData.label() : h.userData.label)));
  if (hit) { const wp = hit.getWorldPosition(new E.THREE.Vector3()); B.place(wp.x + 1.2, B.floorY(wp.x + 1.2, wp.z, wp.y) + .02, wp.z, Math.PI / 2); for (let i = 0; i < 4; i++) B.upd(1 / 30);
    E.state.talking = false; E.ui.paused = false; hit.userData.action(); for (let i = 0; i < 30; i++) B.upd(1 / 30); const C = I.ctl.get(hit); out.iapOpen = C && C.open; const s2 = iap[1](); out.iapSnap = s2;
    hit.userData.action(); for (let i = 0; i < 30; i++) B.upd(1 / 30); out.iapZu = C && !C.open;
    iap[2](JSON.parse(JSON.stringify(s2))); for (let i = 0; i < 90; i++) B.upd(1 / 30); out.iapNach = C && [C.open, +C.k.toFixed(2)]; E.ui.paused = true; }
  else out.iap = 'kein Karteikasten gefunden';
  return B.dump('C:/Users/GIGABYTE/_qa_bew/out/save_test.json', out);
})()
