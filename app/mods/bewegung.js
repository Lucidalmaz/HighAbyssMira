// =====================================================================  BEWEGUNG & HITBOXEN (Nutzer 10.10.2026, Folgeauftrag 7)
// „Beim Draufspringen lande ich in Autos/Bussen und stecke fest“ – Ursache (Messung bewegung_audit.md): Fahrzeuge waren nur Netz-Kollision (SOL). Unterboden, Fenster (Glas ist nie fest) und Innenraum
// sind hohl: man lief unter das Auto, fiel durch die Scheiben in den Innenraum, und Hochziehen setzte auf Dachkanten, die nur ein Netz waren.
// Jetzt: jedes Fahrzeug (Quelle car_*, van_*, vans, tractor – Basis markiert sie über userData.msKey) bekommt eine vollflächige Höhenfeld-Hitbox: von oben je 15-cm-Zelle ein Strahl auf das echte Netz,
// die Zellen werden zu Kollisionskisten (AABB mit Oberkante = echte Dach-/Hauben-Höhe, Unterkante = Boden) zusammengefasst. Das Netz selbst zählt dann nicht mehr (noCol) – kein Hohlraum, nichts zum Hineinfallen,
// Dach/Haube/Kofferraum begehbar (Stufen ≤ 10 cm), Scheibenschräge wie eine Rampe. Bewegte/ein- und ausgeblendete Fahrzeuge werden nachgeführt (Verschiebung) bzw. neu gebaut (Drehung).
const BEWG = { veh: [], pend: [], t: 0, n: 0, log: [], rx: /^(car_neu|car_rusty|car_burned|car_dutch|car_amsedan|van_neu|vans\/|tractor)/, maxLen: 9.5, cell: .15, err: 0 };
{ const T = THREE, add = T.Object3D.prototype.add;
  T.Object3D.prototype.add = function () { const r = add.apply(this, arguments);
    for (let i = 0; i < arguments.length; i++) { const c = arguments[i]; if (c && c.userData && c.userData.msKey && BEWG.rx.test(c.userData.msKey) && !c.userData.__fzg) { c.userData.__fzg = 1; BEWG.pend.push({ o: c, age: 0 }); } }
    return r; }; }
const _bgR = new THREE.Vector3(), _bgD = new THREE.Vector3(), _bgRay = new THREE.Ray(), _bgInv = new THREE.Matrix4();
function bewegung_sichtbar(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; }
function bewegung_imSzene(o) { for (let p = o; p; p = p.parent) if (p === scene) return true; return false; }
function bewegung_noColVorfahr(o) { for (let p = o.parent; p; p = p.parent) if (p.userData && p.userData.noCol) return true; return false; }
// Netze, die zur Hülle gehören (sichtbar, deckend oder Glas, keine Innenausbau-/Aufkleber-Teile)
function bewegung_netze(root) { const out = []; root.updateMatrixWorld(true);
  root.traverse(m => { if (!m.isMesh || m.isSkinnedMesh || !m.geometry || !m.geometry.attributes.position) return; for (let p = m; p && p !== root.parent; p = p.parent) if (!p.visible || (p.userData && p.userData.noCol)) return;
    const mt = Array.isArray(m.material) ? m.material[0] : m.material; if (!mt || mt === hidden || mt.visible === false || mt.colorWrite === false || (mt.opacity !== undefined && mt.opacity < .05)) return;
    if (mt.blending === THREE.AdditiveBlending) return; const g = m.geometry; if (g.attributes.position.count < 6) return; if (!g.boundingBox) g.computeBoundingBox();
    const bb = g.boundingBox.clone().applyMatrix4(m.matrixWorld), s = bb.getSize(new THREE.Vector3()); if (Math.max(s.x, s.z) < .12 || s.y < .05) return; out.push({ m, bb }); });
  return out; }
// Höhenfeld: je Zelle (Mitte) der höchste Treffer von oben
function bewegung_hoehenfeld(root) { const L = bewegung_netze(root); if (!L.length) return null; const B = new THREE.Box3(); for (const l of L) B.union(l.bb);
  const sz = B.getSize(new THREE.Vector3()); if (Math.max(sz.x, sz.z) > BEWG.maxLen || sz.x * sz.z > 40 || sz.y < .5) return { zu_gross: sz.toArray() };
  const cs = BEWG.cell, nx = Math.ceil(sz.x / cs), nz = Math.ceil(sz.z / cs); if (nx * nz > 4000) return { zu_gross: sz.toArray() };
  for (const l of L) { const g = l.m.geometry; if (!g.boundsTree && g.computeBoundsTree) { try { g.computeBoundsTree(); } catch (e) {} } l.inv = l.m.matrixWorld.clone().invert(); }
  const H = new Float32Array(nx * nz).fill(-1e9), x0 = B.min.x, z0 = B.min.z, yTop = B.max.y + .5; let hits = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + (i + .5) * cs, z = z0 + (j + .5) * cs; let best = -1e9;
    for (const l of L) { const b = l.bb; if (x < b.min.x || x > b.max.x || z < b.min.z || z > b.max.z) continue; const g = l.m.geometry; if (!g.boundsTree) continue;
      _bgR.set(x, yTop, z).applyMatrix4(l.inv); _bgD.set(0, -1, 0).transformDirection(l.inv); _bgRay.set(_bgR, _bgD);
      const h = g.boundsTree.raycastFirst(_bgRay, THREE.DoubleSide); if (!h) continue; _bgR.copy(h.point).applyMatrix4(l.m.matrixWorld); if (_bgR.y > best) best = _bgR.y; }
    if (best > -1e8) { H[j * nx + i] = best; hits++; } }
  return { H, nx, nz, x0, z0, cs, base: B.min.y, top: B.max.y, hits }; }
// Zellen → Kisten: Spitzen (einzelne Antennen/Spiegel) kappen, Höhen auf 10 cm runden, in Läufen und dann in Blöcken zusammenfassen
function bewegung_kisten(F, ex) { const { H, nx, nz, x0, z0, cs, base } = F; const Q = new Float32Array(nx * nz).fill(-1);
  const at = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz) ? -1e9 : H[j * nx + i];
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let h = H[j * nx + i]; if (h < -1e8) continue;
    // Spitzen: höher als alle vier Nachbarn um > 25 cm und höchstens 2 Zellen breit → auf den Nachbarwert kappen
    const n = [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)]; const mx = Math.max(...n); if (h - mx > .25) h = Math.max(mx, base + .3);
    const t = Math.round((h - base) / .1) * .1; if (t < .3) continue; Q[j * nx + i] = t; }
  // Läufe entlang x
  const runs = []; for (let j = 0; j < nz; j++) { let i = 0; while (i < nx) { const t = Q[j * nx + i]; if (t < 0) { i++; continue; } let k = i + 1; while (k < nx && Math.abs(Q[j * nx + k] - t) < .001) k++; runs.push({ i0: i, i1: k, j0: j, j1: j + 1, t }); i = k; } }
  // Blöcke: Läufe mit gleichem x-Bereich und gleicher Höhe in aufeinanderfolgenden Reihen verschmelzen
  const open = new Map(), done = []; let lastJ = -1;
  for (const r of runs.sort((a, b) => a.j0 - b.j0 || a.i0 - b.i0)) { const key = r.i0 + ',' + r.i1 + ',' + r.t.toFixed(2), o = open.get(key);
    if (o && o.j1 === r.j0) { o.j1 = r.j1; } else { if (o) done.push(o); open.set(key, { ...r }); } }
  for (const o of open.values()) done.push(o);
  return done.map(b => ({ minX: x0 + b.i0 * cs, maxX: x0 + b.i1 * cs, minZ: z0 + b.j0 * cs, maxZ: z0 + b.j1 * cs, top: base + b.t, base: base - .05 })); }
function bewegung_bauen(rec) { const o = rec.o; const F = bewegung_hoehenfeld(o);
  rec.pool = (rec.pool || []).concat(rec.cols); for (const c of rec.cols) { c.minX = c.maxX = -9999; c.__tot = 1; } rec.cols = []; // nie aus colliders löschen (raumklang.js hält Indizes) – abschalten wie die Türen, Kisten wiederverwenden (sonst wächst colliders bei jedem Neubau)
  if (!F || F.zu_gross) { rec.info = F ? 'zu groß ' + F.zu_gross.map(v => v.toFixed(1)).join('×') : 'keine Netze'; rec.skip = true; return; }
  const boxes = bewegung_kisten(F); for (const b of boxes) { b.fzg = rec.id; const c = rec.pool.pop(); if (c) { Object.assign(c, b); delete c.__tot; delete c.__x0; delete c.__x1; rec.cols.push(c); } else { colliders.push(b); rec.cols.push(b); } }
  // Alte Ersatz-Kiste des Wagens (addCol ohne Höhe = 99 m, z. B. Lukes Leihwagen): Kiste liegt im Umriss des Fahrzeugs → entfernen, sonst Wand bis zum Himmel (nicht begehbar, Hochziehen unmöglich)
  { const ex = F.x0 - .6, ez = F.z0 - .6, fx = F.x0 + F.nx * F.cs + .6, fz = F.z0 + F.nz * F.cs + .6;
    for (let i = colliders.length - 1; i >= 0; i--) { const c = colliders[i]; if (c.fzg || c.minX < -9000 || c.top - c.base < 4 || c.minX < ex || c.maxX > fx || c.minZ < ez || c.maxZ > fz || c.maxX - c.minX < 1.2 || c.maxZ - c.minZ < 1.2) continue; c.minX = c.maxX = -9999; c.__tot = 1; } }
  rec.skip = false; rec.info = boxes.length + ' Kisten, Höhe ' + (F.top - F.base).toFixed(2) + ' m'; rec.hf = { nx: F.nx, nz: F.nz, hits: F.hits };
  o.userData.noCol = true; // das Netz zählt nicht mehr (hohl: Unterboden, Scheiben, Innenraum)
  rec.me = new Float32Array(o.matrixWorld.elements); rec.vis = true; rec.on = true; } // frische Kisten sind aktiv (war rec.on false, machte bewegung_aktiv(true) minX = undefined = NaN → Fahrzeug ohne Kollision)
function bewegung_aktiv(rec, on) { if (rec.on === on) return; rec.on = on; for (const c of rec.cols) { if (on) { c.minX = c.__x0; c.maxX = c.__x1; } else { c.__x0 = c.minX; c.__x1 = c.maxX; c.minX = c.maxX = -9999; } } }
function bewegung_ueberlappt(rec) { const P = player.pos; for (const c of rec.cols) { if (c.minX < -9000) continue; if (c.top <= P.y + .36 || c.base >= P.y + 1.7) continue; if (P.x + R > c.minX && P.x - R < c.maxX && P.z + R > c.minZ && P.z - R < c.maxZ) return true; } return false; }
let bewegung_id = 0;
function bewegung_tick(dt) {
  if (!SOL.items.length) return;
  BEWG.t += dt;
  for (let k = BEWG.pend.length - 1; k >= 0; k--) { const p = BEWG.pend[k]; p.age += dt; if (p.age < .6) continue; if (!bewegung_imSzene(p.o)) { if (p.age > 120) BEWG.pend.splice(k, 1); continue; }
    BEWG.pend.splice(k, 1); if (bewegung_noColVorfahr(p.o) || p.o.userData.noCol) continue;
    const rec = { id: ++bewegung_id, o: p.o, key: p.o.userData.msKey, cols: [], on: true, vis: false, t0: BEWG.t }; BEWG.veh.push(rec); rec.sicht = bewegung_sichtbar(p.o); if (rec.sicht) { try { bewegung_bauen(rec); } catch (e) { rec.info = 'Fehler ' + e.message; BEWG.err++; } } else rec.info = 'unsichtbar (noch nicht gebaut)'; }
  for (const rec of BEWG.veh) { const o = rec.o; if (rec.skip && rec.sicht === bewegung_sichtbar(o)) continue; const s = bewegung_sichtbar(o);
    if (!s) { if (rec.cols.length) bewegung_aktiv(rec, false); rec.sicht = false; continue; }
    if (!rec.sicht || !rec.cols.length) { rec.sicht = true; o.userData.noCol = false; try { bewegung_bauen(rec); bewegung_aktiv(rec, true); } catch (e) { rec.info = 'Fehler ' + e.message; BEWG.err++; } continue; }
    // Pose geändert?
    const e = o.matrixWorld.elements, m = rec.me; let rot = false, tr = false; for (let i = 0; i < 12; i++) if (Math.abs(e[i] - m[i]) > 1e-4) { rot = true; break; } for (let i = 12; i < 15; i++) if (Math.abs(e[i] - m[i]) > 1e-4) tr = true;
    if (rot || (tr && Math.abs(e[13] - m[13]) > .02)) { if (BEWG.t - (rec.rt || 0) > .4) { rec.rt = BEWG.t; o.userData.noCol = false; try { bewegung_bauen(rec); bewegung_aktiv(rec, true); } catch (er) { rec.info = 'Fehler ' + er.message; } } }
    else if (tr) { const dx = e[12] - m[12], dz = e[14] - m[14]; for (const c of rec.cols) { c.minX += dx; c.maxX += dx; c.minZ += dz; c.maxZ += dz; if (c.__x0 !== undefined) { c.__x0 += dx; c.__x1 += dx; } } rec.me.set(e);
      if (bewegung_ueberlappt(rec)) { // fährt in den Spieler: seitlich aus der Kiste schieben (nie hinein)
        const P = player.pos; let best = null; for (const c of rec.cols) { if (c.top <= P.y + .36 || c.base >= P.y + 1.7) continue; if (!(P.x + R > c.minX && P.x - R < c.maxX && P.z + R > c.minZ && P.z - R < c.maxZ)) continue;
          for (const [ax, v] of [['x', c.minX - R - .02], ['x', c.maxX + R + .02], ['z', c.minZ - R - .02], ['z', c.maxZ + R + .02]]) { const d = Math.abs(v - P[ax]); if (!best || d < best.d) best = { ax, v, d }; } }
        if (best) P[best.ax] = best.v; } }
  }
}
WORLD_TICK.push(dt => { try { bewegung_tick(dt); } catch (e) { if (!BEWG.errT) { BEWG.errT = 1; console.warn('bewegung', e); } } });
window.__bewg = { BEWG, rebuild: () => { for (const r of BEWG.veh) { r.o.userData.noCol = false; bewegung_bauen(r); } }, info: () => BEWG.veh.map(r => ({ id: r.id, key: r.key, info: r.info, cols: r.cols.length, on: r.on, sicht: r.sicht, pos: r.o.getWorldPosition(new THREE.Vector3()).toArray().map(v => +v.toFixed(1)) })) };

// =====================================================================  VOLUMEN FÜLLEN (Folgeauftrag 7: „keine Hohlräume, nirgends reinfallen, nirgends hineingebacken“)
// Ursache (Messung bewegung_audit.md): Netz-Kollision arbeitet an der OBERFLÄCHE. Steht der Körper (r = 0,3 m) ganz im Inneren eines geschlossenen Netzes (Fass, Kiste, Tonne: Wand ≥ 0,3 m entfernt),
// ist kein Treffer da – Sprung/Hochziehen „drüber“ landete IM Fass, und das Freischieben fand keine Überlappung. Lösung: kleine, wasserdichte Netze (Grundfläche ≤ 2,4 m, Höhe 0,35–2,2 m)
// werden von oben mit 8-cm-Strahlen durchlaufen (alle Treffer; Front-/Rückseite → feste Abschnitte, Hohlräume im Inneren bleiben frei). Nur Zellen, in denen die Körpermitte ganz im Festen steht
// (Nachbarn im Abstand 0,32 m – bei Netzen ≤ 1,5 m 0,16 m – fest auf Höhe knapp unter der Oberkante), werden zu Kollisionskisten bis zur echten Oberkante. Man steht auf dem Fass/der Kiste und kann nicht hinein.
const HOHL = { i: 0, cur: 0, pend: [], recs: [], t: 0, n: 0, geprueft: 0, err: 0, cache: new WeakMap() };
const _hR = new THREE.Vector3(), _hD = new THREE.Vector3(), _hRay = new THREE.Ray();
function hohl_geschlossen(g) { // wasserdicht = jede Kante gehört zu genau 2 Dreiecken (Eckpunkte nach Lage zusammengefasst)
  let c = HOHL.cache.get(g); if (c !== undefined) return c; c = false;
  try { const P = g.attributes.position, I = g.index, n = I ? I.count : P.count; if (n / 3 <= 5000 && n >= 12) { const vid = new Map(), id = k => { const q = Math.round(P.getX(k) * 2e4) + ',' + Math.round(P.getY(k) * 2e4) + ',' + Math.round(P.getZ(k) * 2e4); let v = vid.get(q); if (v === undefined) vid.set(q, v = vid.size); return v; };
      const E = new Map(); let ok = true; for (let t = 0; t < n; t += 3) { const a = id(I ? I.getX(t) : t), b = id(I ? I.getX(t + 1) : t + 1), d = id(I ? I.getX(t + 2) : t + 2);
        for (const [u, v] of [[a, b], [b, d], [d, a]]) { if (u === v) continue; const k = u < v ? u * 4194304 + v : v * 4194304 + u; E.set(k, (E.get(k) || 0) + 1); } }
      for (const v of E.values()) if (v & 1) { ok = false; break; } c = ok; } } catch (e) {}
  HOHL.cache.set(g, c); return c; }
function hohl_kandidat(it) { // billige Vorauswahl: Größe, Dreiecke, kein Fahrzeug
  if (it.soft || it.hohlDone) return false; const bb = it.bb, g = it.o.geometry; if (!g || !g.boundsTree) return false;
  const sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z, sy = bb.max.y - bb.min.y;
  if (sx < .3 || sz < .3 || sx > 2.4 || sz > 2.4 || sy < .35 || sy > 2.2) return false;
  if (it.o.userData && it.o.userData.msKey && BEWG.rx.test(it.o.userData.msKey)) return false;
  const tri = (g.index ? g.index.count : g.attributes.position.count) / 3; return tri <= 5000 && tri >= 12; } // teure Prüfung nur für niedrig aufgelöste Netze (Leistungs-Gate: ein 20-k-Netz kostete 100 ms in einem Bild)
function hohl_pruefen(it) {
  if (!hohl_kandidat(it)) { it.hohlDone = true; return; } it.hohlDone = true; const bb = it.bb, g = it.o.geometry;
  const sx = bb.max.x - bb.min.x, sz = bb.max.z - bb.min.z;
  if (!hohl_geschlossen(g)) return;
  const cs = Math.max(sx, sz) <= 1.5 ? .08 : .12, nx = Math.ceil(sx / cs), nz = Math.ceil(sz / cs), top = bb.max.y + .3, sgn = it.mw.determinant() < 0 ? -1 : 1;
  _hD.set(0, -1, 0).transformDirection(it.inv); const IV = new Array(nx * nz); let any = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { _hR.set(bb.min.x + (i + .5) * cs, top, bb.min.z + (j + .5) * cs).applyMatrix4(it.inv); _hRay.set(_hR, _hD);
    const hs = g.boundsTree.raycast(_hRay, THREE.DoubleSide); if (!hs || !hs.length) continue; hs.sort((a, b) => a.distance - b.distance); const iv = []; let y0 = null;
    for (const h of hs) { const d = h.face.normal.x * _hRay.direction.x + h.face.normal.y * _hRay.direction.y + h.face.normal.z * _hRay.direction.z; _hR.copy(h.point).applyMatrix4(it.mw);
      if (d * sgn < 0) { if (y0 === null) y0 = _hR.y; } else if (y0 !== null) { if (y0 - _hR.y > .02) iv.push([_hR.y, y0]); y0 = null; } }
    if (iv.length) { IV[j * nx + i] = iv; any++; } }
  if (any < 9) return;
  const has = (i, j, y) => { if (i < 0 || j < 0 || i >= nx || j >= nz) return false; const iv = IV[j * nx + i]; if (!iv) return false; for (const v of iv) if (y > v[0] && y < v[1]) return true; return false; };
  const r = Math.round((Math.max(sx, sz) <= 1.5 ? .16 : .32) / cs), dirs = [[r, 0], [-r, 0], [0, r], [0, -r], [r * .7, r * .7], [-r * .7, r * .7], [r * .7, -r * .7], [-r * .7, -r * .7]].map(a => [Math.round(a[0]), Math.round(a[1])]);
  const groups = new Map(); let nTief = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const iv = IV[j * nx + i]; if (!iv) continue;
    for (const v of iv) { const ys = v[1] - Math.min(.15, (v[1] - v[0]) * .5); let deep = true; for (const [a, b] of dirs) if (!has(i + a, j + b, ys)) { deep = false; break; }
      if (!deep) continue; nTief++; const t = Math.floor(v[1] / .1) * .1, b = Math.floor(v[0] / .2) * .2, key = t.toFixed(2) + '|' + b.toFixed(2); let L = groups.get(key); if (!L) groups.set(key, L = { t, b: Math.min(v[0], b), c: new Set() }); else L.b = Math.min(L.b, v[0]); L.c.add(j * nx + i); } }
  if (nTief < 4) return;
  const boxes = [];
  for (const L of groups.values()) { if (L.c.size < 3) continue; const used = new Set(), ks = [...L.c].sort((a, b) => a - b);
    for (const k0 of ks) { if (used.has(k0)) continue; const j = Math.floor(k0 / nx), i0 = k0 % nx; let i1 = i0; while (L.c.has(j * nx + i1 + 1) && !used.has(j * nx + i1 + 1) && (i1 + 1) % nx !== 0) i1++;
      let j1 = j; for (;;) { let all = true; for (let i = i0; i <= i1; i++) if (!L.c.has((j1 + 1) * nx + i) || used.has((j1 + 1) * nx + i)) { all = false; break; } if (!all) break; j1++; }
      for (let jj = j; jj <= j1; jj++) for (let i = i0; i <= i1; i++) used.add(jj * nx + i);
      boxes.push({ minX: bb.min.x + i0 * cs, maxX: bb.min.x + (i1 + 1) * cs, minZ: bb.min.z + j * cs, maxZ: bb.min.z + (j1 + 1) * cs, top: L.t, base: L.b - .02, hohl: 1 }); } }
  if (!boxes.length) return;
  const rec = { it, boxes, on: false, me: new Float32Array(it.mw.elements) }; HOHL.recs.push(rec); HOHL.n += boxes.length;
  const live = solidLive(it); if (live) hohl_an(rec, true);
}
function hohl_an(rec, on) { if (rec.on === on) return; rec.on = on; for (const b of rec.boxes) { if (on) { if (b.__x0 === undefined) { b.__x0 = b.minX; b.__x1 = b.maxX; colliders.push(b); } else { b.minX = b.__x0; b.maxX = b.__x1; } } else if (b.__x0 !== undefined) { b.minX = b.maxX = -9999; } } } // append-only wie die Türen
function hohl_tick(dt) {
  if (!SOL.items.length || typeof solidLive !== 'function') return;
  const P = player.pos, t1 = performance.now() + 1.5, A = HOHL.pend; let n = 0; HOHL.cool = (HOHL.cool || 0) - dt;
  while (HOHL.i < SOL.items.length && n++ < 3000) A.push(SOL.items[HOHL.i++]); // neue Netze einreihen
  for (let q = 0; q < 700 && A.length && performance.now() < t1; q++) { if (HOHL.cur >= A.length) HOHL.cur = 0; const it = A[HOHL.cur];
    if (it.hohlDone) { A[HOHL.cur] = A[A.length - 1]; A.pop(); continue; }
    const b = it.bb, dx = (b.min.x + b.max.x) / 2 - P.x, dz = (b.min.z + b.max.z) / 2 - P.z;
    if (dx * dx + dz * dz > 625) { HOHL.cur++; continue; } // nur im Umkreis von 25 m um den Spieler
    if (!hohl_kandidat(it)) { it.hohlDone = true; HOHL.geprueft++; A[HOHL.cur] = A[A.length - 1]; A.pop(); continue; }
    if (!HOHL.fast && (HOHL.cool > 0 || dt > .034)) break; // höchstens ein Netz je 60 ms, nicht bei langsamen Bildern (HOHL.fast = Testschalter)
    { const t = performance.now(); try { hohl_pruefen(it); } catch (e) { HOHL.err++; } const ms = performance.now() - t; HOHL.cool = ms > 8 ? .25 : .06; HOHL.ms = Math.max(HOHL.ms || 0, ms); }
    it.hohlDone = true; HOHL.geprueft++; A[HOHL.cur] = A[A.length - 1]; A.pop(); }
  HOHL.t += dt; if (HOHL.t < .6) return; HOHL.t = 0;
  for (let k = HOHL.recs.length - 1; k >= 0; k--) { const r = HOHL.recs[k]; let live = false; try { live = solidLive(r.it); } catch (e) {}
    let moved = false; for (let q = 0; q < 16; q++) if (Math.abs(r.it.me[q] - r.me[q]) > 1e-3) { moved = true; break; }
    if (moved) { hohl_an(r, false); HOHL.recs.splice(k, 1); r.it.hohlDone = false; r.it.hohlRe = (r.it.hohlRe || 0) + 1; if (r.it.hohlRe < 3) { try { hohl_pruefen(r.it); } catch (e) {} } continue; }
    hohl_an(r, live); }
}
WORLD_TICK.push(dt => { try { hohl_tick(dt); } catch (e) { if (!HOHL.errT) { HOHL.errT = 1; console.warn('hohl', e); } } });
window.__hohl = HOHL;
