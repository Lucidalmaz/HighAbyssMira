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
  for (const c of rec.cols) { const i = colliders.indexOf(c); if (i >= 0) colliders.splice(i, 1); } rec.cols = [];
  if (!F || F.zu_gross) { rec.info = F ? 'zu groß ' + F.zu_gross.map(v => v.toFixed(1)).join('×') : 'keine Netze'; rec.skip = true; return; }
  const boxes = bewegung_kisten(F); for (const b of boxes) { b.fzg = rec.id; colliders.push(b); rec.cols.push(b); }
  rec.skip = false; rec.info = boxes.length + ' Kisten, Höhe ' + (F.top - F.base).toFixed(2) + ' m'; rec.hf = { nx: F.nx, nz: F.nz, hits: F.hits };
  o.userData.noCol = true; // das Netz zählt nicht mehr (hohl: Unterboden, Scheiben, Innenraum)
  rec.me = new Float32Array(o.matrixWorld.elements); rec.vis = true; }
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
