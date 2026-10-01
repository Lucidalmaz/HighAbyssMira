// =====================================================================  RAUMKLANG (Modul „raumklang“, R-19): jeder Ton kommt von seiner Quelle
// Vorbilder: RE2/RE7/Village, The Last of Us Part II, Alien: Isolation. Ersetzt Audio.at/Audio.play der Basis (gleiche Aufrufe, gleiche Rückgaben).
// Jede Welt-Quelle: Panner (HRTF nah/wichtig, sonst Equal-Power) → Tiefpass (Luft + Verdeckung) → Pegel (Verdeckung) → Welt-Bus (Hall des Hörer-Raums)
//   [+ Hall des Quell-Raums, wenn der ein anderer ist: das Haus klingt nach Haus, auch wenn Luke draußen steht].
// Entfernung: inverse Kurve (≈ 1/r) je Typ – leise (Rascheln: 1 m, fällt schneller), normal, laut (Telefon), sehr_laut (Glocke, Donner).
// Verdeckung: Strecke Hörer→Quelle gegen die Kollisionsboxen (Wände, geschlossene Türen, Autos – offene Türen sind keine Box). Ist sie zu, wird ein Weg
//   um die nächste Ecke/Türkante gesucht (Beugung): der Ton kommt dann von dort, weiter und dumpfer – Schritte im Gang „kommen um die Ecke“.
// Bewegte Quellen (obj: Object3D oder Vektor) folgen jedes Bild ohne Allokation; Doppler nur auf Wunsch (schnelle Quellen). Stimmenbudget mit Vorrang:
//   ist es voll, weicht die leiseste/fernste Stimme mit kurzer Blende (keine harten Aussetzer); Unhörbares wird gar nicht erst angelegt.
// Neue Klänge: Audio.at('name', obj | [x, y, z] | {x, y, z}, { typ: 'leise'|'normal'|'laut'|'sehr_laut', gain, h, loop, doppler, wichtig, … play-Optionen })
//   (alias Audio.quelle). Alte Form Audio.at(x, y, z, ref, o) liefert wie bisher den Panner (Eingang der Kette); Audio.play(name, { x, y, z, ref, obj, typ }).
//   Audio.setze(panner, x, y, z) verschiebt eine Quelle, Audio.frei(panner) gibt eine lange Quelle frei (sonst endet sie mit ihrem Klang).
const RK_TYP = { leise: [1, 1.6, 30], normal: [2.5, 1, 120], laut: [6, 1, 300], sehr_laut: [15, .85, 800] }; // [Bezugsabstand m, Abfall, Hörweite m]
const RK_HALL = { small: .3, concrete: .5, hall: .45, out: .14 }; // Hallanteil je Raum (wie Audio.setRoom)
const RK_O = Object.freeze({});
const RK = { on: true, live: [], vox: [], maxVoices: 32, maxH: 14, hEnd: new Float64Array(48), hi: 0, liveH: 0,
  cell: 6, grid: new Map(), gn: 0, pend: [], pendT: 0, hb: null, stamp: new Uint32Array(4096), st: 1, fb: null, v: null, ev: 0,
  R1: { fa: -1, fb: -1, ta: 2, tb: -1 }, R2: { fa: -1, fb: -1, ta: 2, tb: -1 }, n: { neu: 0, stumm: 0, weg: 0, verdeckt: 0, gebeugt: 0, evals: 0 } };
function rk_typ(o, ref) { const t = o && o.typ && RK_TYP[o.typ]; if (t) return t; return ref <= 1.6 ? RK_TYP.leise : ref <= 4 ? RK_TYP.normal : ref <= 10 ? RK_TYP.laut : RK_TYP.sehr_laut; }
const rk_dg = (d, ref, roll) => ref / (ref + roll * (Math.max(d, ref) - ref)); // inverse Abstandskurve (wie PannerNode 'inverse')
// ---------------------------------------------------------------- Kollisionsraster (nur hohe Boxen; offene Türen liegen bei −9999 und werden mit ihrer „Heimat“ eingetragen, sobald sie einmal zu waren)
function rk_gridAdd(i) { const c = colliders[i]; if (c.minX < -9000) { RK.pend.push(i); return; } if (c.top < 1.1) return; // niedrig (Bank, Bordstein, Zaunsockel): verdeckt nichts Hörbares
  const s = RK.cell, x0 = Math.floor(c.minX / s), x1 = Math.floor(c.maxX / s), z0 = Math.floor(c.minZ / s), z1 = Math.floor(c.maxZ / s); if ((x1 - x0 + 1) * (z1 - z0 + 1) > 600) return; // riesige Bodenplatten o. ä.
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const k = (ix + 4096) * 8192 + iz + 4096; let L = RK.grid.get(k); if (!L) RK.grid.set(k, L = []); L.push(i); } }
function rk_grid() { const n = colliders.length; if (RK.gn === n) return; if (RK.stamp.length < n) { const s = new Uint32Array(n * 2); RK.stamp = s; RK.st = 1; } while (RK.gn < n) rk_gridAdd(RK.gn++); }
function rk_pend() { const P = RK.pend; for (let i = P.length - 1; i >= 0; i--) if (colliders[P[i]].minX > -9000) { const k = P[i]; P[i] = P[P.length - 1]; P.pop(); rk_gridAdd(k); } }
// Summe der Wandgewichte auf der Strecke a→b (Abbruch über lim). R.fa/R.fb: erste Box von a bzw. von b aus (für die Beugung).
// Gewicht je Box nach ihrer Breite: Baumstamm ≈ 0,1 · Tür ≈ 0,75 · Wand/Auto 1. Steckt a oder b in der Box (Quelle im Schrank, an der Tür), zählt sie nicht.
function rk_seg(ax, ay, az, bx, by, bz, lim, R) {
  R.fa = R.fb = -1; R.ta = 2; R.tb = -1; const s = RK.cell, x0 = Math.floor(Math.min(ax, bx) / s), x1 = Math.floor(Math.max(ax, bx) / s), z0 = Math.floor(Math.min(az, bz) / s), z1 = Math.floor(Math.max(az, bz) / s);
  if ((x1 - x0 + 1) * (z1 - z0 + 1) > 900) return 0; if (++RK.st > 4e9) { RK.stamp.fill(0); RK.st = 1; }
  const st = RK.st, S = RK.stamp, C = colliders, dx = bx - ax, dz = bz - az; let W = 0;
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) { const L = RK.grid.get((ix + 4096) * 8192 + iz + 4096); if (!L) continue;
    for (let j = 0; j < L.length; j++) { const i = L[j]; if (S[i] === st) continue; S[i] = st; const c = C[i]; if (c.minX < -9000) continue;
      let t0 = 0, t1 = 1;
      if (dx > -1e-9 && dx < 1e-9) { if (ax <= c.minX || ax >= c.maxX) continue; } else { let u = (c.minX - ax) / dx, v = (c.maxX - ax) / dx; if (u > v) { const w = u; u = v; v = w; } if (u > t0) t0 = u; if (v < t1) t1 = v; if (t0 >= t1) continue; }
      if (dz > -1e-9 && dz < 1e-9) { if (az <= c.minZ || az >= c.maxZ) continue; } else { let u = (c.minZ - az) / dz, v = (c.maxZ - az) / dz; if (u > v) { const w = u; u = v; v = w; } if (u > t0) t0 = u; if (v < t1) t1 = v; if (t0 >= t1) continue; }
      if (t0 < 1e-4 || t1 > .9999) continue;
      const y = ay + (by - ay) * (t0 + t1) * .5; if (y < c.base || y > c.top) continue;
      const e = Math.max(c.maxX - c.minX, c.maxZ - c.minZ), hh = Math.min(c.top, 6) - Math.max(c.base, 0); W += Math.min(1, Math.max(.1, (e - .3) / 1.2)) * Math.min(1, Math.max(.35, hh / 2.2)); // Kiste < Wand
      if (t0 < R.ta) { R.ta = t0; R.fa = i; } if (t1 > R.tb) { R.tb = t1; R.fb = i; } if (W > lim) return W; } }
  return W; }
// Verdeckung + Beugung für eine Quelle r vom Hörer (lx, ly, lz) aus: setzt r.loss (dB), r.lpO (Hz), r.d (Weglänge), r.vx/vy/vz (woher der Ton kommt)
function rk_occ(r, lx, ly, lz) {
  const sx = r.x, sy = r.y, sz = r.z, d0 = Math.max(.05, Math.hypot(sx - lx, sy - ly, sz - lz)); r.vx = sx; r.vy = sy; r.vz = sz; r.d = d0; r.loss = 0; r.lpO = 22000; r.via = false;
  if (sy <= -10 || state.zone === 'canal') return; RK.n.evals++;
  const R = RK.R1, W = rk_seg(lx, ly, lz, sx, sy, sz, 3, R); if (W < .25) { if (W > 0) { r.loss = W * 8; r.lpO = 22000 * Math.pow(.25, W); } return; }
  let best = W <= 1 ? 12 * W : 12 + 6 * (W - 1); best = Math.min(30, best); let lp = Math.max(150, 20000 * Math.pow(.03, Math.min(W, 1)) / Math.pow(2, Math.max(0, W - 1)));
  RK.n.verdeckt++; const fa = R.fa, fb = R.fb, my = (ly + sy) * .5, R2 = RK.R2; let cx = 0, cz = 0, bl = 0, ok = false;
  for (let k = 0; k < 2; k++) { const i = k ? fb : fa; if (i < 0 || (k && i === fa)) continue; const c = colliders[i];
    for (let q = 0; q < 4; q++) { const qx = q & 1 ? c.maxX + .4 : c.minX - .4, qz = q & 2 ? c.maxZ + .4 : c.minZ - .4;
      const w1 = rk_seg(lx, ly, lz, qx, my, qz, .35, R2); if (w1 > .35) continue; const w2 = rk_seg(qx, my, qz, sx, sy, sz, .35, R2); if (w2 > .35) continue;
      const ax = qx - lx, az = qz - lz, bx = sx - qx, bz = sz - qz, l1 = Math.max(.05, Math.hypot(ax, az)), l2 = Math.max(.05, Math.hypot(bx, bz));
      const th = Math.acos(Math.max(-1, Math.min(1, (ax * bx + az * bz) / (l1 * l2)))) / Math.PI, L = l1 + l2 + Math.abs(sy - ly) * .3;
      const loss = 2 + 10 * th + 12 * (w1 + w2), cmp = loss + 20 * Math.log10(Math.max(1, L / d0));
      if (cmp < best) { best = cmp; ok = true; cx = qx; cz = qz; bl = L; r.loss = loss; lp = 20000 * Math.exp(-3 * th) / (1 + w1 + w2); } } }
  if (ok) { RK.n.gebeugt++; const l1 = Math.max(.05, Math.hypot(cx - lx, cz - lz)); r.vx = lx + (cx - lx) / l1 * bl; r.vz = lz + (cz - lz) / l1 * bl; r.vy = sy; r.d = bl; r.via = true; r.lpO = lp; }
  else { r.loss = best; r.lpO = lp; } }
// Hall-Raum eines Quellorts, wenn er nicht der des Hörers ist (sonst null: dann gilt Audio.room über den Welt-Bus)
function rk_kind(s, x) { const A = Audio; if (s === A.lsp) return null; if (x > 250) return 'concrete'; if (x < -800) return 'hall'; return s === 'o' ? 'out' : 'small'; }
function rk_fb(k) { const A = Audio; if (!A.revs || !A.revs[k]) return null; if (!RK.fb) RK.fb = {}; let g = RK.fb[k]; if (!g) { g = RK.fb[k] = A.ctx.createGain(); g.connect(A.revs[k].conv); } return g; }
function rk_send(r, k, now) { const A = Audio;
  if (!k) { if (r.send && r.sk) { r.send.gain.setTargetAtTime(0, now, .3); r.sk = null; } return; }
  const v = RK_HALL[k] * Math.min(2.2, Math.sqrt(Math.max(1, r.d / r.ref)));
  if (!r.send) { r.send = A.ctx.createGain(); r.send.gain.value = 0; r.og.connect(r.send); }
  if (r.sk !== k) { try { r.send.disconnect(); } catch (e) {} const fb = rk_fb(k); if (fb) r.send.connect(fb); r.sk = k; }
  r.send.gain.setTargetAtTime(v, now, now - r.t0 < .05 ? .005 : .3); }
// Werte auf die Knoten: Luftdämpfung (Tiefpass mit der Entfernung) und Verdeckung; Panner an die Stelle, von der der Ton kommt
function rk_apply(r, now, glatt) { const fAir = 20000 / (1 + Math.pow(r.d / 25, 1.3)), f = Math.max(120, Math.min(fAir, r.lpO)), g = r.mute ? 0 : Math.pow(10, -r.loss / 20), P = r.p;
  if (glatt) { if (Math.abs(f - r.fz) > r.fz * .04) { r.lp.frequency.setTargetAtTime(f, now, .07); r.fz = f; } if (Math.abs(g - r.gz) > .01) { r.og.gain.setTargetAtTime(g, now, .07); r.gz = g; } }
  else { r.lp.frequency.value = f; r.og.gain.value = g; r.fz = f; r.gz = g; }
  if (P.positionX) { P.positionX.value = r.vx; P.positionY.value = r.vy; P.positionZ.value = r.vz; } else P.setPosition(r.vx, r.vy, r.vz); r.wx = r.vx; r.wy = r.vy; r.wz = r.vz; }
function rk_hCount(now) { let n = RK.liveH; const H = RK.hEnd; for (let i = 0; i < H.length; i++) if (H[i] > now) n++; return n; }
function rk_pos(r) { const o = r.obj; if (o.isObject3D) { o.getWorldPosition(RK.v); r.x = RK.v.x; r.y = RK.v.y + r.h; r.z = RK.v.z; } else { r.x = o.x; r.y = (o.y || 0) + r.h; r.z = o.z; } }
// Räumliche Quelle anlegen. Gibt den Panner zurück (Eingang); Audio.cut = true heißt: nicht zu hören (unter der Erde ↔ oben, außer Hörweite)
function rk_at(x, y, z, ref, o = RK_O) {
  const A = Audio, c = A.ctx, now = c.currentTime, rf = ref || (o.typ && RK_TYP[o.typ] ? RK_TYP[o.typ][0] : 3), T = rk_typ(o, rf), cam = camera.position, lebt = !!(o.obj || o.loop || o.dauer > 1.5);
  if (!RK.v) RK.v = new THREE.Vector3();
  const r = { p: null, lp: null, og: null, send: null, sk: null, x, y: y ?? 1, z, h: o.h || 0, obj: o.obj || null, ref: rf, roll: o.rolloff ?? T[1], max: T[2], d: 1, loss: 0, lpO: 22000, via: false,
    vx: 0, vy: 0, vz: 0, wx: 0, wy: 0, wz: 0, fz: 0, gz: 0, hrtf: false, end: 0, on: false, ev: 0, t0: now, src: null, rate0: 1, dop: !!o.doppler, ld: -1, lt: 0, pr: 1, wichtig: !!o.wichtig };
  if (r.obj) rk_pos(r);
  const p = c.createPanner(); r.p = p; p._rk = r; p.distanceModel = 'inverse'; p.refDistance = rf; p.rolloffFactor = r.roll; p.maxDistance = 10000;
  const d = Math.hypot(r.x - cam.x, r.y - cam.y, r.z - cam.z); A.cut = false;
  if (r.y > -10 && A.lsp !== undefined) { const s = A.space(r.x, r.z); if ((s === 'u') !== (A.lsp === 'u') || (d > r.max && !lebt)) A.cut = true; r.s = s; } else r.s = A.lsp;
  if (A.cut) { RK.n.stumm++; p.panningModel = 'equalpower'; p.connect(A.sink); if (p.positionX) { p.positionX.value = r.x; p.positionY.value = r.y; p.positionZ.value = r.z; } return p; }
  const lp = r.lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = .5; const og = r.og = c.createGain(); p.connect(lp); lp.connect(og); og.connect(A.world);
  rk_occ(r, cam.x, cam.y, cam.z); rk_apply(r, now, false); rk_send(r, rk_kind(r.s, r.x), now);
  r.hrtf = (r.d < 16 || r.wichtig) && rk_hCount(now) < RK.maxH; p.panningModel = r.hrtf ? 'HRTF' : 'equalpower';
  r.pr = rk_dg(r.d, rf, r.roll) * Math.pow(10, -r.loss / 20); RK.n.neu++;
  if (lebt) rk_live(r, now + Math.min(o.dauer || 3, 1e9));
  else if (r.hrtf) { RK.hEnd[RK.hi] = now + 2.5; RK.hi = (RK.hi + 1) % RK.hEnd.length; } // kurze HRTF-Stimmen: Ring der Endzeiten
  return p; }
// Quelle in die Liste der laufend nachgeführten (bewegt, lang oder Schleife); end = Zeitpunkt, ab dem sie vergessen wird
function rk_live(r, end) { r.end = end; if (r.on) return; r.on = true; r.ev = 0; RK.live.push(r); if (r.hrtf) RK.liveH++; }
function rk_drop(r) { if (!r) return; try { r.p.disconnect(); } catch (e) {} r.end = 0; }
// Nachführen einer Quelle (alle ~0,15 s, bewegte Quellen öfter): Verdeckung, Luft, HRTF/Equal-Power mit Hysterese, Quell-Hall, Doppler
function rk_eval(r, now, cam) {
  let k = null; if (r.y > -10) { const s = Audio.space(r.x, r.z); r.s = s; r.mute = (s === 'u') !== (Audio.lsp === 'u'); if (!r.mute) k = rk_kind(s, r.x); } // unter der Erde ↔ oben: stumm
  rk_occ(r, cam.x, cam.y, cam.z); rk_apply(r, now, true); rk_send(r, k, now);
  if (r.hrtf && r.d > 22) { r.hrtf = false; r.p.panningModel = 'equalpower'; RK.liveH--; }
  else if (!r.hrtf && (r.d < 14 || r.wichtig) && rk_hCount(now) < RK.maxH) { r.hrtf = true; r.p.panningModel = 'HRTF'; RK.liveH++; }
  if (r.dop && r.src) { const dt = now - r.lt; if (r.ld >= 0 && dt > .02) { const vr = Math.max(-40, Math.min(40, (r.d - r.ld) / dt)); r.src.playbackRate.setTargetAtTime(r.rate0 * 343 / (343 + vr), now, .12); } r.ld = r.d; r.lt = now; }
  r.pr = rk_dg(r.d, r.ref, r.roll) * (r.gz > 0 ? r.gz : 0); }
// Stimmenbudget: Platz frei? Sonst weicht die leiseste laufende Stimme (kurze Blende), wenn die neue deutlich wichtiger ist
function rk_slot(pr, now) { const V = RK.vox; for (let i = V.length - 1; i >= 0; i--) if (V[i].end < now) { V[i] = V[V.length - 1]; V.pop(); }
  if (V.length < RK.maxVoices) return true; let m = 0; for (let i = 1; i < V.length; i++) if (V[i].pr < V[m].pr) m = i;
  if (pr <= V[m].pr * 1.15) return false; const w = V[m]; try { w.g.gain.cancelScheduledValues(now); w.g.gain.setTargetAtTime(0, now, .025); w.src.stop(now + .15); } catch (e) {} V[m] = V[V.length - 1]; V.pop(); RK.n.weg++; return true; }
Object.assign(Audio, {
  // Zentrale API (neu) und alte Form: Audio.at(x, y, z, ref, o) → Panner · Audio.at('name', obj|[x,y,z]|{x,y,z}, o) → spielt räumlich (Rückgabe wie play)
  at(a, b, c, d, e) { if (typeof a === 'string') return this.quelle(a, b, c); return rk_at(a, b, c, d, e); },
  quelle(name, ziel, o = RK_O) { const q = Object.assign({}, o); if (!q.typ && q.ref === undefined) q.typ = 'normal';
    if (ziel && (ziel.isObject3D || (o.folgen && ziel.x !== undefined))) q.obj = ziel; else if (Array.isArray(ziel)) { q.x = ziel[0]; q.y = ziel[1]; q.z = ziel[2]; } else if (ziel) { q.x = ziel.x; q.y = ziel.y; q.z = ziel.z; }
    if (q.dauer === undefined && q.obj) q.dauer = 2; return this.play(name, q); },
  setze(p, x, y, z) { const r = p && p._rk; if (!r) { if (p && p.positionX) { p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z; } return; } r.x = x; r.y = y; r.z = z; if (!r.via && r.p.positionX) { r.p.positionX.value = x; r.p.positionY.value = y; r.p.positionZ.value = z; } },
  frei(p) { const r = p && p._rk; if (r) r.end = Math.min(r.end, this.ctx.currentTime + .5); },
  play(name, o = RK_O) {
    const b = this.buf && this.buf[name]; if (!b) return null; const ctx = this.ctx, now = ctx.currentTime;
    const sp = (o.x !== undefined || o.obj) && o.pan === undefined; let pd = null, r = null, pr = o.gain ?? 1;
    if (sp) { pd = rk_at(o.x, o.y ?? 1, o.z, o.ref, o); if (this.cut) return null; r = pd._rk; pr *= r.pr * (o.wichtig ? 3 : 1); if (pr < .0015 && !o.loop && !o.obj) { rk_drop(r); RK.n.stumm++; return null; } }
    else if (o.dest && o.dest._rk) { r = o.dest._rk; pr *= r.pr; }
    else pr *= 2; // ohne Ort (Luke selbst, Oberfläche, Musik): Vorrang
    if (!o.loop && !rk_slot(pr, now)) { if (pd) rk_drop(r); return null; }
    const t = now + (o.delay || 0);
    let lp = o.lp, bb = b; if (o.loop && lp) { const pf = this.buf[name + '@' + lp]; if (pf) bb = pf; else this.prefilter(name, lp); lp = 0; } // Schleife: nie mit Echtzeit-Tiefpass (siehe prefilter)
    const src = ctx.createBufferSource(); src.buffer = bb; src.loop = !!o.loop; if (o.loop && o.loopStart) { src.loopStart = o.loopStart; src.loopEnd = o.loopEnd || b.duration; }
    src.playbackRate.value = (o.rate || 1) * (o.vary ? rand(1 - o.vary, 1 + o.vary) : 1);
    let node = src;
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; node.connect(f); node = f; }
    if (o.hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = o.hp; node.connect(f); node = f; }
    const g = ctx.createGain(), v = (o.gain ?? 1) * (o.varyGain ? rand(1 - o.varyGain, 1 + o.varyGain) : 1);
    if (o.fadeIn) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + o.fadeIn); } else g.gain.setValueAtTime(v, t);
    if (o.dur && !o.loop) { const fo = Math.min(.4, o.dur * .3); g.gain.setValueAtTime(v, t + o.dur - fo); g.gain.linearRampToValueAtTime(0, t + o.dur); }
    node.connect(g);
    if (o.pan !== undefined) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(o.dest || this.world); }
    else g.connect(pd || o.dest || this.world);
    src.start(t, o.offset || 0, o.loop ? undefined : (o.dur ? o.dur + .05 : undefined));
    const end = o.loop ? Infinity : t + (o.dur || Math.max(.05, (bb.duration - (o.offset || 0)) / src.playbackRate.value)) + .1;
    if (!o.loop) { this.voices = (this.voices || 0) + 1; src.onended = () => { this.voices--; }; RK.vox.push({ g, src, pr, end }); }
    if (r) { r.src = src; r.rate0 = src.playbackRate.value; if (o.loop || r.obj || end - now > 1.5) rk_live(r, end); else if (r.on) r.end = Math.max(r.end, end); }
    return { src, g, stop: (f = .3) => { try { g.gain.setTargetAtTime(0, ctx.currentTime, f / 3); src.stop(ctx.currentTime + f + .1); } catch (e) {} if (r) r.end = Math.min(r.end, ctx.currentTime + f + .2); } };
  },
  // ---- Welt-Quellen der Basis, die bisher ohne Ort klangen: optional mit Position (ohne = wie bisher, z. B. Luke selbst)
  slam(x, y, z) { if (!this.ctx) return; if (x === undefined) { this.play(this.pick('woodSlam1', 'woodSlam2', 'woodSlam3'), { gain: 1, vary: .06 }); const o = this.osc('sine', 70, 0, .6); this.env(o, .4, .003, .4); return; }
    const P = { x, y: y ?? 1.2, z, typ: 'laut' }; this.play(this.pick('woodSlam1', 'woodSlam2', 'woodSlam3'), { gain: 1, vary: .06, ...P }); const d = this.at(x, P.y, z, 6); if (!this.cut) { const o = this.osc('sine', 70, 0, .6); this.env(o, .4, .003, .4, 0, d); } },
  knock(x, y, z) { if (!this.ctx) return; const P = x === undefined ? {} : { x, y: y ?? 1.3, z, ref: 3 }; for (let i = 0; i < 3; i++) this.play(this.pick('woodHit1', 'woodHit2', 'woodHit3'), { gain: .7, vary: .06, delay: i * .29 + rand(0, .04), ...P }); },
  creak(v = .22, x, y, z) { if (!this.ctx) return; const P = x === undefined ? {} : { x, y: y ?? 1.2, z, ref: 2.5 }; this.play('doorCreak', { gain: v * 1.8, rate: rand(.8, 1.05), offset: rand(0, .6), dur: rand(1.4, 2.4), ...P }); },
  intercomClick(x, y, z) { if (!this.ctx) return; const P = x === undefined ? {} : { x, y: y ?? 1.6, z, ref: 2 }; this.play('switch2', { gain: .6, ...P }); const d = x === undefined ? undefined : this.at(x, P.y, z, 2); if (d && this.cut) return;
    const n = this.noise(false), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1; n.connect(bp); this.env(bp, .15, .003, .12, .05, d); n.stop(this.ctx.currentTime + .4); },
});
// Telefon/Spieluhr/Klavier/Tank: Fassung aus klang.js mit Ort (ohne Ort: Hörer am Ohr, Luke spielt selbst …)
{ const ring0 = Audio.ring, mb0 = Audio.musicBox, pn0 = Audio.pianoNote, tank0 = Audio.tankHum;
  Object.assign(Audio, {
    // Die Telefonzelle klingelt dort, wo sie steht: v = Lautstärke an der Zelle (die Entfernung macht der Raumklang). Ohne Ort: Freizeichen im Hörer / Handy.
    ring(v, x, y, z) { if (!this.ctx || v < .005) return; if (x === undefined || v < .03 || !(this.buf && this.buf.fx_telefon)) return ring0.call(this, v);
      this.play('fx_telefon', { gain: Math.min(.8, v * 7), x, y: y ?? 1.9, z, ref: 4, typ: 'laut', wichtig: true }); },
    musicBox(x, y, z) { if (!this.ctx) return; if (x === undefined || !(this.buf && this.buf.mb_spieluhr)) return mb0.call(this); this.play('mb_spieluhr', { gain: .75, x, y: y ?? 1, z, ref: 1.5, wichtig: true }); },
    pianoNote(k, x, y, z) { if (!this.ctx) return; if (x === undefined || !(this.buf && this.buf['pn_' + k])) return pn0.call(this, k); this.play('pn_' + k, { gain: .7, x, y: y ?? 1, z, ref: 2.5 }); },
    tankHum(on, x, y, z) { if (!this.ctx) return; if (x === undefined) return tank0.call(this, on);
      if (on && !this.tankN) { const P = { x, y: y ?? 1, z, ref: 3 }; const l = this.loop('machine1', { gain: .25, fadeIn: 2, lp: 1200, ...P }); this.tankN = { l };
        const bub = () => { if (!this.tankN) return; if (this.buf.waterLoop) this.play('waterLoop', { gain: rand(.03, .05), offset: rand(0, 3), dur: rand(.2, .4), rate: rand(1.2, 1.5), hp: 400, ...P, ref: 1.5 }); setTimeout(bub, rand(1200, 3200)); }; bub(); }
      else if (!on && this.tankN) { if (this.tankN.l) this.tankN.l.stop(1); this.tankN = null; } },
    // Motor: die Quelle wird verschoben (statt den Panner direkt zu setzen – die Verdeckung rechnet mit)
    engine(on, x, z) { if (!this.ctx) return;
      if (on && !this.eng) { const p = this.at(x, .6, z, 5, { obj: null, dauer: 1e9 }); if (this.cut) return; const l = this.play('carEngine', { loop: true, gain: .8, lp: 900, dest: p }); if (l) this.eng = { p, l }; }
      else if (!on && this.eng) { this.eng.l.stop(.5); this.eng = null; }
      else if (this.eng) this.setze(this.eng.p, x, .6, z); },
  }); }
// Fernseher in Nr. 7: das Rauschen kommt aus dem Gerät (die Basis regelt nur noch an/aus)
function rk_tv() { const A = Audio; if (RK.tvOk || !A.tv || typeof tvScreen === 'undefined' || A.lsp === undefined || A.lsp === 'u') return; RK.tvOk = true;
  try { tvScreen.updateMatrixWorld(true); const q = tvScreen.getWorldPosition(new THREE.Vector3()), p = rk_at(q.x, q.y, q.z, 1.2, { loop: true, dauer: 1e9 }); if (A.cut) { RK.tvOk = false; return; }
    p._rk.end = Infinity; const t = A.ctx.createGain(); t.gain.value = .6; A.tv.disconnect(); A.tv.connect(t); t.connect(p); A.tvAt = p; } catch (e) { console.warn('Raumklang: TV', e); } }
WORLD_MODS.push(['Raumklang', async () => { RK.maxVoices = Math.max(32, (typeof AUDIO_MIX !== 'undefined' ? AUDIO_MIX.voices : 22) + 10); }]);
WORLD_TICK.push(dt => {
  const A = Audio; if (!A.ctx || !RK.on || typeof colliders === 'undefined') return; rk_grid();
  const now = A.ctx.currentTime, cam = camera.position, L = RK.live; RK.pendT -= dt; if (RK.pendT < 0) { RK.pendT = 2; rk_pend(); if (!RK.tvOk) rk_tv(); }
  if (RK.fb && A.world) { const w = A.world.gain.value; for (const k in RK.fb) if (Math.abs(RK.fb[k].gain.value - w) > .01) RK.fb[k].gain.value = w; } // Rausch-/Kiffen-Blende gilt auch für fremden Hall
  let budget = 8;
  for (let i = L.length - 1; i >= 0; i--) { const r = L[i];
    if (now > r.end) { if (r.hrtf) RK.liveH--; r.on = false; r.obj = null; r.src = null; L[i] = L[L.length - 1]; L.pop(); continue; }
    if (r.obj) { const ox = r.x, oz = r.z, oy = r.y; rk_pos(r); if (!r.via && (Math.abs(r.x - ox) + Math.abs(r.y - oy) + Math.abs(r.z - oz) > .005)) { const P = r.p; if (P.positionX) { P.positionX.value = r.x; P.positionY.value = r.y; P.positionZ.value = r.z; } r.wx = r.x; r.wy = r.y; r.wz = r.z; } }
    else if (!r.via && r.p.positionX) { const px = r.p.positionX.value, pz = r.p.positionZ.value; if (Math.abs(px - r.wx) > .02 || Math.abs(pz - r.wz) > .02) { r.x = px; r.y = r.p.positionY.value; r.z = pz; r.wx = px; r.wz = pz; } } // jemand hat den Panner direkt verschoben (alte Module)
    if (now >= r.ev && budget > 0) { budget--; r.ev = now + (r.obj ? .1 : .18) + Math.random() * .04; rk_eval(r, now, cam); } }
});
window.__raumklang = { RK, typ: RK_TYP, seg: (ax, ay, az, bx, by, bz) => { rk_grid(); return rk_seg(ax, ay, az, bx, by, bz, 9, { fa: -1, fb: -1, ta: 2, tb: -1 }); },
  probe(x, y, z) { rk_grid(); const c = camera.position, r = { x, y, z }; rk_occ(r, c.x, c.y, c.z); return { d: +r.d.toFixed(2), loss: +r.loss.toFixed(1), lp: Math.round(r.lpO), via: r.via, v: [+r.vx.toFixed(2), +r.vz.toFixed(2)] }; },
  stats: () => ({ live: RK.live.length, vox: RK.vox.length, liveH: RK.liveH, h: rk_hCount(Audio.ctx ? Audio.ctx.currentTime : 0), zellen: RK.grid.size, boxen: RK.gn, offen: RK.pend.length, n: RK.n }) }; // Testzugriff
