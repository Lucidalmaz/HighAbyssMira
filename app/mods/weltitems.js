// =====================================================================  WELTITEMS (Modul „weltitems“, Nutzerauftrag 10.10.2026, Punkt 7)
// Fundstücke in der Welt sind echte Modelle (dieselben wie im Inventar, Modul inventar3d), kein Brett/keine Platte mehr:
//   · Regeln (WELT_REGELN): Beschriftung der Klickfläche → Gegenstandsschlüssel/Modell, längste Kante in Metern, Lage ('lie' = liegend auf der stabilsten Seite,
//     'stand' = wie gebaut aufrecht, 'hang' = hängt/steckt, Größe wie angegeben), Zusätze {n, yMax, yMin, alt}.
//   · Bei Annäherung (≤ 30 m) entsteht das Modell an der Klickfläche, auf der Fläche darunter (solidGround), in stabiler Lage, deterministisch gedreht.
//   · Alte Platzhalter (dünne Platten/Quader/Zylinder innerhalb der Klickfläche) werden aus der Anzeige genommen (Ebene 7: nicht gezeichnet, nicht angeklickt, kein Schatten),
//     ihr Sichtbarkeitszustand steuert weiter das neue Modell (nimmt ein Modul die Platte weg, verschwindet auch das Modell).
//   · Klickfläche wird auf das Modell zugeschnitten (+ Rand), Kennzeichnung per hervorhebung.js (userData.hlObj = Modell).
// Testzugriff: __welt (S, rec(m), regeln, scan()).
const WELT = { recs: new Map(), skip: new Map(), t: 0, scanT: 0, busy: 0, n: 0, ms: 0, v: new THREE.Vector3(), b: new THREE.Box3(), b2: new THREE.Box3(), q: new THREE.Quaternion(), idx: 0 };
// [Regex auf die Beschriftung, Gegenstandsschlüssel oder Modell-Id, längste Kante (m), Lage, Zusätze]
const WELT_REGELN = [
  [/^(Foto aufheben|Polaroid nehmen|Polaroid|Polaroid an der Kerze)$/i, 'polaroid', .1, 'lie'],
  [/^Fahrkarte$/i, 'nord_fahrkarte', .1, 'lie'],
  [/Postkarte im Gras|Geburtstagskarte/i, 'heidi_karte', .15, 'lie'],
  [/^Laterne nehmen$/i, 'nord_lantern', .3, 'stand'],
  [/^(Drei )?Batterien$/i, 'batterie', .05, 'lie', { n: 3 }],
  [/^Funkgerät$/i, 'bergungsfunk', .22, 'lie'],
  [/^Leiter nehmen$/i, 'leiter_amt', 1.9, 'stand'],
  [/Seite aus einem Dienstbuch|Heftseite|Loser Sockelstein|ein Blatt$|Seite, an einen Nagel/i, 'ow_seiten', .2, 'lie'],
  [/Umschlag, gestempelt/i, 'umschlag7', .24, 'lie'],
  [/^Zettel$/i, 'da10', .19, 'lie', { yMax: 1.0 }],
  [/Murmel/i, 'murmel', .022, 'lie'],
  [/Stück Kreide/i, 'cleo_kreide', .09, 'lie'],
  [/Pfandflasche/i, 'pfandflasche', .3, 'lie'],
  [/^Hildes Brotdose$/i, 'cleo_dose', .17, 'stand'],
  [/^Das Dienstbuch$/i, 'buch', .24, 'lie'],
  [/^Fotoalbum$/i, 'fotoalbum', .32, 'lie'],
  [/^(Die )?Spieluhr$/i, 'lucys_spieluhr', .12, 'stand'],
  [/^Akte (Roxy|Lucy|Mike|Dina|Heidi|Zayn|Luke)/i, 'akte', .32, 'lie'],
  [/^Kassettenrekorder$/i, 'tape', .26, 'lie'],
  [/^Schlüssel am Haken$/i, 'zimmer7', .1, 'hang', { keepOld: true }],
  [/^Ordner .?2009.?$/i, 'n3_ordner', .32, 'stand'],
  [/Alter Rucksack nehmen|Wanderrucksack nehmen/i, 'rucksack', .5, 'stand'],
  [/^Eine Pfandflasche$/i, 'pfandflasche', .3, 'lie'],
  [/Seitenschneider/i, 'seitenschneider', .2, 'lie'],
  [/^Das Funkgerät nehmen$/i, 'bergungsfunk', .22, 'lie'],
  [/Mamas Kerze|Kerze nehmen/i, 'mamas_kerze', .17, 'stand'],
  [/Handy nehmen|Handy aufheben/i, 'phone', .13, 'lie'],
  [/Schlüssel (nehmen|aufheben)|Schlüsselbund/i, 'key', .1, 'lie'],
  [/^Hofers Dienstbuch$/i, 'buch', .2, 'lie'],
  [/^Jonas.? Blechdose$/i, 'blechdose', .15, 'stand'],
  [/Lichtstein/i, 'geh_lichtstein', .06, 'lie'],
  [/Kassette (mitnehmen|aufheben)/i, 'n3_kassette_band', .11, 'lie'],
  [/Teddy aufheben|Teddy nehmen/i, 'teddy', .3, 'stand'],
];
const WELT_PRIM = /^(Plane|Box|Cylinder|Sphere|Torus|Lathe|Circle|Capsule)Geometry$/;
function welt_label(m) { let l = m.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = ''; } return String(l == null ? '' : l).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(); }
function welt_chain(o) { for (let p = o; p; p = p.parent) { if (p.visible === false) return false; if (p === scene) return true; } return false; }
function welt_hash(x, z) { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); }
function welt_regel(l, m, by) {
  for (const R of WELT_REGELN) { if (!R[0].test(l)) continue; const o = R[4] || {}; if (o.yMax != null && by > o.yMax) continue; if (o.yMin != null && by < o.yMin) continue; return R; }
  return null; }
// kleine, dünne Platzhalter innerhalb der Klickfläche einsammeln (nur Grundkörper; echte Modelle bleiben)
function welt_alte(m, bb) {
  const out = [], X = WELT.b2.copy(bb).expandByScalar(.1); let echt = 0;
  scene.traverse(o => { if (!o.isMesh || o === m || !o.geometry || o.isInstancedMesh || o.isSkinnedMesh || (o.material && o.material.visible === false)) return; if (o.layers.mask === 1 << 7) return; if (interactables.includes(o)) return;
    if (!welt_chain(o)) return; o.updateWorldMatrix(true, false); const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); const B = WELT.b.copy(g.boundingBox).applyMatrix4(o.matrixWorld);
    const sz = B.getSize(WELT.v); if (Math.max(sz.x, sz.y, sz.z) > .9) return; B.getCenter(WELT.v); if (!X.containsPoint(WELT.v)) return;
    if (WELT_PRIM.test(g.type) && (g.type === 'PlaneGeometry' || Math.min(sz.x, sz.y, sz.z) < .12 || Math.max(sz.x, sz.y, sz.z) < .6)) out.push(o); else echt++; });
  return { out, echt }; }
async function welt_bau(m, R, label) {
  const S = WELT, [, key, size, lage, opt = {}] = R; if (typeof inv3d_lade !== 'function') return null;
  m.updateWorldMatrix(true, false); const g0 = m.geometry; if (g0 && !g0.boundingBox) g0.computeBoundingBox();
  const bb = new THREE.Box3().copy(g0 ? g0.boundingBox : new THREE.Box3(new THREE.Vector3(-.1, -.1, -.1), new THREE.Vector3(.1, .1, .1))).applyMatrix4(m.matrixWorld), c = bb.getCenter(new THREE.Vector3());
  const alte = welt_alte(m, bb); if (alte.echt && !opt.force && !opt.keepOld) return { rec: 'echt' }; // an dieser Stelle steht schon ein echtes Modell
  const M = await inv3d_lade(key); if (!M) return null;
  // Lage: 'lie' → die Ausrichtung mit der geringsten Höhe (stabil), sonst wie gebaut
  const G = new THREE.Group(); G.add(M); G.updateMatrixWorld(true);
  if (lage === 'lie') { const cand = [[0, 0, 0], [Math.PI / 2, 0, 0], [-Math.PI / 2, 0, 0], [0, 0, Math.PI / 2], [0, 0, -Math.PI / 2], [Math.PI, 0, 0]]; let best = null;
    for (const r of cand) { M.rotation.set(r[0], r[1], r[2]); G.updateMatrixWorld(true); const h = S.b.setFromObject(G).getSize(S.v).y; if (!best || h < best[0] - 1e-4) best = [h, r]; }
    M.rotation.set(best[1][0], best[1][1], best[1][2]); }
  G.updateMatrixWorld(true); const bm = S.b.setFromObject(G), sz = bm.getSize(new THREE.Vector3()), k = size / Math.max(sz.x, sz.y, sz.z, 1e-6);
  const yaw = lage === 'hang' ? 0 : welt_hash(c.x, c.z) * Math.PI * 2; const W = new THREE.Group(); W.add(G); G.scale.setScalar(k); G.rotation.y = 0; W.rotation.y = yaw; W.updateMatrixWorld(true);
  const b2 = new THREE.Box3().setFromObject(W), mid = b2.getCenter(new THREE.Vector3()), low = b2.min.y;
  // Auflage: Fläche unter der Klickfläche; sonst Unterkante der Klickfläche (nie unter 0)
  let fy = Math.max(0, bb.min.y); try { const sg = solidGround(c.x, bb.max.y + .15, c.z); if (Number.isFinite(sg) && sg >= bb.min.y - .4 && sg <= bb.max.y + .25) fy = sg; } catch (e) {}
  if (lage === 'hang' || lage === 'stand' && (bb.max.y - bb.min.y) > 1.3) fy = c.y - (b2.max.y - b2.min.y) / 2 + (low - b2.min.y); // hängend/hoch: Mitte der Klickfläche
  const copies = Math.max(1, opt.n || 1), root = new THREE.Group(); root.name = 'Fundstück_' + key;
  for (let i = 0; i < copies; i++) { const W2 = i ? W.clone(true) : W; W2.position.set(c.x - mid.x + (i ? (i === 1 ? .045 : -.045) : 0), fy - low, c.z - mid.z + (i ? (i === 1 ? -.03 : .03) : 0)); if (i) W2.rotation.y = yaw + i * 1.3; root.add(W2); }
  root.traverse(o => { if (o.isMesh) { o.castShadow = size > .12; o.receiveShadow = true; o.frustumCulled = true; const fx = x => { if (x && x.fog === false) x.fog = true; }; Array.isArray(o.material) ? o.material.forEach(fx) : fx(o.material); } });
  const par = m.parent || scene; par.updateWorldMatrix(true, false);
  if (par !== scene) { // in die lokale Lage des Elternknotens umrechnen (Kapitelgruppen blenden damit mit aus)
    const inv = new THREE.Matrix4().copy(par.matrixWorld).invert(); root.applyMatrix4(inv); par.add(root); } else scene.add(root);
  root.updateMatrixWorld(true);
  try { renderer.compileAsync(root, camera, scene); } catch (e) {}
  // Klickfläche zuschneiden (nur Quader ohne gedrehten/skalierten Elternknoten)
  const fin = new THREE.Box3().setFromObject(root), fs = fin.getSize(new THREE.Vector3()), fc = fin.getCenter(new THREE.Vector3());
  try { if (g0 && g0.type === 'BoxGeometry' && !alte.out.includes(m) && !m.userData.weltFix && !(m.parent && Math.abs(m.parent.getWorldScale(new THREE.Vector3()).x - 1) > 1e-3)) {
      const nw = Math.max(.26, fs.x + .12), nh = Math.max(.2, fs.y + .1), nd = Math.max(.26, fs.z + .12), cur = bb.getSize(new THREE.Vector3());
      if (nw < cur.x * .9 || nh < cur.y * .9 || nd < cur.z * .9) { const p = g0.parameters, sx = Math.min(m.scale.x, nw / p.width), sy = Math.min(m.scale.y, nh / p.height), sz2 = Math.min(m.scale.z, nd / p.depth);
        const wp = new THREE.Vector3(fc.x, Math.max(fc.y, m.getWorldPosition(new THREE.Vector3()).y - cur.y / 2 + nh / 2), fc.z); m.parent && m.parent.worldToLocal(wp); m.scale.set(sx, sy, sz2); m.position.copy(wp); m.userData.weltFix = 1; m.updateMatrixWorld(true); } } } catch (e) {}
  for (const o of alte.out) { if (opt.keepOld) break; o.userData.weltAlt = o.layers.mask; o.layers.set(7); } // nicht mehr gezeichnet/angeklickt; o.visible steuert weiter das Modell
  // die Klickfläche selbst ist oft die sichtbare Platte (Foto, Akte): Anzeige abschalten, Klickbarkeit bleibt
  if (!opt.keepOld && m.material && m.material.visible !== false && g0 && WELT_PRIM.test(g0.type) && Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z) < .9) { m.userData.weltMat = m.material; m.material = hidden; }
  m.userData.hlObj = root;
  return { rec: 1, root, alte: opt.keepOld ? [] : alte.out, key, label }; }
function welt_scan() {
  const S = WELT, IA = interactables, cam = camera.position; const n = IA.length; if (!n) return; let todo = 0;
  for (let k = 0; k < n && todo < 6; k++) { const i = (S.idx + k) % n, m = IA[i]; if (!m || S.recs.has(m)) continue; const skipT = S.skip.get(m); if (skipT && skipT > S.t) continue;
    if (!m.geometry) { S.skip.set(m, S.t + 60); continue; }
    m.updateWorldMatrix(true, false); const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); g.boundingBox.getCenter(S.v).applyMatrix4(m.matrixWorld); const d = Math.hypot(S.v.x - cam.x, S.v.z - cam.z); if (d > 30) { S.skip.set(m, S.t + 3); continue; }
    const l = welt_label(m); if (!l) { S.skip.set(m, S.t + 2.5); continue; } const R = welt_regel(l, m, S.v.y); if (!R) { S.skip.set(m, S.t + 40); continue; }
    S.recs.set(m, { pend: true }); todo++; S.busy++;
    welt_bau(m, R, l).then(r => { S.busy--; if (r && r.root) S.recs.set(m, r); else { S.recs.set(m, { none: 1, why: r && r.rec }); } }).catch(e => { S.busy--; S.recs.set(m, { none: 1, err: 1 }); console.warn('weltitems', R[1], e); }); }
  S.idx = (S.idx + 17) % Math.max(1, n); }
function welt_tick(dt) {
  const S = WELT, t0 = performance.now(); S.t += dt;
  if ((S.scanT -= dt) <= 0) { S.scanT = .7; try { welt_scan(); } catch (e) { if (!S.err) { S.err = 1; console.warn('weltitems scan', e); } } }
  if ((S.syncT = (S.syncT || 0) - dt) <= 0) { S.syncT = .25; const cam = camera.position;
    for (const [m, r] of S.recs) { if (!r.root) continue; let vis;
      if (r.alte.length) { vis = false; for (const o of r.alte) if (o.visible !== false && welt_chain(o)) { vis = true; break; } if (!vis && !r.alte.some(o => o.parent)) vis = false; }
      else vis = welt_chain(m) && interactables.includes(m) && welt_label(m) !== '';
      if (vis) { r.root.getWorldPosition(S.v); if (Math.hypot(S.v.x - cam.x, S.v.z - cam.z) > 60) vis = false; }
      if (r.root.visible !== vis) r.root.visible = vis; } }
  S.ms = performance.now() - t0; }
WORLD_TICK.push(dt => { try { welt_tick(Math.min(dt, .1)); } catch (e) { if (!WELT.err2) { WELT.err2 = 1; console.warn('weltitems', e); } } });
window.__welt = { S: WELT, regeln: WELT_REGELN, scan: welt_scan, label: welt_label, rec: m => WELT.recs.get(m), stat: () => { let n = 0, no = 0, pend = 0; for (const r of WELT.recs.values()) { if (r.root) n++; else if (r.pend) pend++; else no++; } return { models: n, none: no, pend, ia: interactables.length, ms: +WELT.ms.toFixed(3) }; } };
