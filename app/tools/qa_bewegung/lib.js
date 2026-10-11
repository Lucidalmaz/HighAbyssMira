(() => {
if (window.__BW && window.__BW.v === 14) return 'BW schon';
const EVH = window.__k6 || window.__villa; if (!EVH) return 'kein Testhaken';
const E = EVH.ev(`({ vel, R, player, keys, state, ui, colliders, SOL, solidNear, solidLive, indoorRects, scene, camera, THREE, groundAt, headCeiling, ceilingAt, update, mantleTarget, solidGround, mantleGround,
  get grounded() { return grounded; }, get vy() { return vy; }, get mantle() { return mantle; }, get crouchK() { return crouchK; }, get scripted() { return scripted; },
  setS(g, v) { grounded = g; vy = v; mantle = null; jumpQueued = false; crouchK = 0; crawlK = 0; crouchZiel = false; FEEL.ax = FEEL.az = 0; FEEL.ext = true; },
  setCrouch(z) { crouchZiel = !!z; }, bodyH() { return bodyH(); },
  free() { try { if (scripted) setScripted(null); } catch (e) {} try { setCamOverride(null); } catch (e) {} try { if (window.__kino && __kino.busy && __kino.busy()) __kino.skip(); } catch (e) {}
    try { if (ui.overlay) closeAllOverlays(); } catch (e) {} state.talking = false; try { if (typeof tod_S !== 'undefined') { tod_S.dying = false; tod_S.respawning = false; tod_S.zurueck = false; } } catch (e) {} mantle = null; } })`);
const T = E.THREE, P = E.player.pos, R = E.R;
const BW = window.__BW = { v: 14, E, log: [] }; if (window.__hohl) window.__hohl.fast = true; // Testschalter: Hohlraum-Füller ohne Takt
const r2 = v => Math.round(v * 100) / 100;
let SIMT = 5000;
const key = (code, down) => { const p = E.ui.paused; E.ui.paused = false; try { window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code === 'Space' ? ' ' : code, bubbles: true })); } finally { E.ui.paused = p; } };
BW.key = key;
const upd = dt => { E.ui.paused = false; try { E.update(dt, SIMT += dt); } catch (e) { BW.updErr = (BW.updErr || 0) + 1; if (BW.updErr < 4) BW.log.push('upd ' + e.message); } E.ui.paused = true; };
BW.upd = upd;
function releaseAll() { for (const k of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'Space', 'ControlLeft', 'KeyC']) { if (E.keys[k]) key(k, false); E.keys[k] = false; } }
BW.releaseAll = releaseAll;
// Boden unter (x,z) bei yRef wie das Spiel (Kisten + feste Netze + Innenboden)
function floorY(x, z, yRef) { let g = 0; for (const r of E.indoorRects) if (x > r.x0 && x < r.x1 && z > r.zb && z < r.zf) { g = r.y; break; }
  for (const c of E.colliders) if (c.minX > -9000 && c.top > g && c.top <= yRef + .4 && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) g = c.top;
  let sg = -Infinity; try { sg = E.solidGround(x, yRef + .2, z); } catch (e) {} return sg > g ? sg : g; }
BW.floorY = floorY;
function place(x, y, z, yaw) { releaseAll(); E.free(); P.set(x, y, z); E.vel.set(0, 0, 0); E.setS(false, 0); E.player.yaw = yaw; E.player.pitch = 0; for (let i = 0; i < 25; i++) { upd(.02); if (i === 0) { P.set(x, y, z); E.vel.set(0, 0, 0); } } }
BW.place = place;
// Überlappung des Körpers an Pos mit Kisten / festen Netzen (wie solidPush/colHit) → Liste
const _a = new T.Vector3(), _b = new T.Vector3(), _c = new T.Vector3(), _tg = { point: new T.Vector3(), distance: 0, faceIndex: 0 };
function overlap(x, y, z, bodyH = 1.7) { const out = [];
  for (const c of E.colliders) { if (c.minX < -9000 || c.top <= y + .36 || c.base >= y + bodyH) continue; if (x + R > c.minX && x - R < c.maxX && z + R > c.minZ && z - R < c.maxZ) { const dep = Math.min(x + R - c.minX, c.maxX - (x - R), z + R - c.minZ, c.maxZ - (z - R)); out.push({ k: 'col', dep: r2(dep), fzg: c.fzg || 0, b: [c.minX, c.maxX, c.minZ, c.maxZ, c.base, c.top].map(r2) }); } }
  for (const it of E.solidNear(x, z)) { const bb = it.bb; if (it.soft || x + R < bb.min.x || x - R > bb.max.x || z + R < bb.min.z || z - R > bb.max.z || y + 1.8 < bb.min.y || y + .37 > bb.max.y || !E.solidLive(it)) continue;
    for (const h of [.62, 1.05, 1.5]) { const cy = y + h; if (cy + R < bb.min.y || cy - R > bb.max.y) continue; _a.set(x, cy, z).applyMatrix4(it.inv);
      const r = it.o.geometry.boundsTree.closestPointToPoint(_a, _tg, 0, (R - .02) / it.sc); if (!r) continue; _b.copy(r.point).applyMatrix4(it.mw); if (_b.y < y + .37 || _b.distanceTo(_c.set(x, cy, z)) >= R - .02) continue;
      { const ch = []; for (let p = it.o, q = 0; p && q < 4; p = p.parent, q++) ch.push(p.name || p.type); out.push({ k: 'sol', dep: r2(R - _b.distanceTo(_c)), n: it.o.name || it.o.parent && it.o.parent.name || '?', h, bb: [bb.min.x, bb.max.x, bb.min.y, bb.max.y, bb.min.z, bb.max.z].map(r2), ch: ch.join('<'), tri: it.o.geometry.index ? it.o.geometry.index.count / 3 : 0 }); } break; } }
  return out; }
BW.overlap = overlap;
// kann man sich von hier aus bewegen? (je eine Richtung 0,6 s laufen, auch Springen) → größte Entfernung
function beweglich(dirs = 4) { const x0 = P.x, y0 = P.y, z0 = P.z; let best = 0; const yaw0 = E.player.yaw;
  for (let k = 0; k < dirs; k++) { P.set(x0, y0, z0); E.vel.set(0, 0, 0); E.setS(true, 0); E.player.yaw = yaw0 + k * Math.PI * 2 / dirs; E.keys.KeyW = true; key('KeyW', true);
    for (let i = 0; i < 30; i++) { if (i === 15) { key('Space', true); key('Space', false); } upd(1 / 40); } E.keys.KeyW = false; key('KeyW', false); best = Math.max(best, Math.hypot(P.x - x0, P.z - z0)); if (best > .9) break; }
  P.set(x0, y0, z0); E.vel.set(0, 0, 0); E.setS(true, 0); return r2(best); }
BW.beweglich = beweglich;
// ---------------------------------------------------------------- Sprung-/Mantle-Test auf eine Box (Footprint + Oberkante)
const DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0], [.7071, .7071], [.7071, -.7071], [-.7071, -.7071], [-.7071, .7071]];
function sprungTest(box, di, opt = {}) {
  const [dx, dz] = DIRS[di], cx = (box.minX + box.maxX) / 2, cz = (box.minZ + box.maxZ) / 2;
  const hx = (box.maxX - box.minX) / 2, hz = (box.maxZ - box.minZ) / 2;
  const tEdge = Math.min(Math.abs(dx) > 1e-6 ? hx / Math.abs(dx) : 1e9, Math.abs(dz) > 1e-6 ? hz / Math.abs(dz) : 1e9);
  const st0 = opt.start || 3.2; let start = tEdge + st0, sx = cx - dx * start, sz = cz - dz * start;
  const yw = Math.atan2(-dx, -dz); // forward = (−sin yaw, −cos yaw) = (dx, dz)
  const g0 = floorY(sx, sz, box.base + .3);
  const res = { di, sprint: !!opt.sprint, start: [r2(sx), r2(sz)], g0: r2(g0) };
  if (!opt.__r) { for (const alt of [3.2, 2.2, 1.7]) { const L = alt - .35, n = Math.ceil(L / .25); const s2 = tEdge + alt, ax = cx - dx * s2, az = cz - dz * s2, ag = floorY(ax, az, box.base + .3); let ok = true, why = '';
      for (let i = 0; i <= n && ok; i++) { const k = i / n * L, x = ax + dx * k, z = az + dz * k; const o = overlap(x, floorY(x, z, ag + .3), z, 1.7).filter(q => !(q.fzg && q.fzg === box.id)); if (o.length) { ok = false; why = 'Anlauf blockiert bei ' + r2(k) + ' m (Start ' + alt + '): ' + JSON.stringify(o[0]).slice(0, 100); } }
      if (ok) { opt = Object.assign({}, opt, { start: alt, __r: 1 }); return sprungTest(box, di, opt); } else res.why = why; }
    res.cls = 'n/a'; return res; }
  place(sx, g0 + .02, sz, yw);
  const WT = window.G.WORLD_TICK, WK = WT.slice(); WT.length = 0; try {
  res.settled = [r2(P.x), r2(P.y), r2(P.z)];
  E.keys.KeyW = true; key('KeyW', true); if (opt.sprint) { E.keys.ShiftLeft = true; key('ShiftLeft', true); }
  const jumpAt = opt.jumpAt ?? 1.1; let tG = 0, jumped = false, t = 0, maxY = P.y, mant = false, tJ = null;
  const dt = 1 / 40;
  for (let i = 0; i < 240; i++) { t += dt;
    const along = (P.x - cx) * dx + (P.z - cz) * dz;
    if (!jumped && along > -tEdge - jumpAt) { key('Space', true); key('Space', false); jumped = true; tJ = t; }
    upd(dt); maxY = Math.max(maxY, P.y); if (E.mantle) mant = true; if (opt.trace && i % 2 === 0) (res.tr = res.tr || []).push([+t.toFixed(2), r2(P.x), r2(P.y), r2(P.z), E.grounded ? 1 : 0, r2(E.vy), E.mantle ? E.mantle.art : 0]);
    if (jumped && E.grounded && !E.mantle && Math.abs(E.vy) < 1e-3 && t - tJ > .25) { if (!tG) tG = t; if (t - tG > .02) break; } }
  releaseAll();
  for (let i = 0; i < 40; i++) upd(dt);
  const px = P.x, pz = P.z, py = P.y;
  res.end = [r2(px), r2(py), r2(pz)]; res.maxY = r2(maxY); res.mantle = mant; res.grounded = E.grounded;
  const inFoot = px > box.minX - .15 && px < box.maxX + .15 && pz > box.minZ - .15 && pz < box.maxZ + .15;
  res.inFoot = inFoot; res.dTop = r2(py - box.top);
  const ov = overlap(px, py, pz, E.bodyH()); res.ov = ov.length ? ov.slice(0, 3) : 0;
  const gh = floorY(px, pz, py + .3); res.gh = r2(gh); const tief = ov.filter(q => q.dep > .1);
  let cls;
  if (tief.length) cls = 'STECKT';
  else if (inFoot && py < gh - .1) cls = 'IM_OBJEKT';
  else if (inFoot && py > box.base + .15) cls = 'oben';
  else cls = 'unten';
  if (cls === 'STECKT') { const mv = beweglich(); res.mv = mv; if (mv >= .4) cls = 'streift'; }
  if (cls === 'IM_OBJEKT') { const mv = beweglich(); res.mv = mv; cls = mv < .4 ? 'GEFANGEN' : 'innen_frei'; }
  if (cls === 'oben' || cls === 'unten') { const mv = beweglich(); res.mv = mv; if (mv < .4) cls = 'GEFANGEN'; }
 
  res.cls = cls; } finally { WK.forEach(f => WT.push(f)); } return res; }
BW.sprungTest = sprungTest;
BW.dump = (p, obj) => { const s = JSON.stringify(obj); return 'FILES:' + JSON.stringify([{ path: p, b64: btoa(unescape(encodeURIComponent(s))), note: Math.round(s.length / 1024) + ' KB' }]); };
BW.r2 = r2;
return 'BW geladen';
})()
