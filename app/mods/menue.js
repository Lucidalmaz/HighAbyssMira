// =====================================================================  MENÜ-BÜHNE (Modul „menue“, R-20): das Hauptmenü als Visitenkarte des Spiels
// Hinter dem Menü läuft die ohnehin geladene Welt (kein eigenes Laden, keine Lichter): fünf Motive, langsame traumhafte Fahrt, Schnitt über Schwarz –
//   Ahornstraße/Nr. 7 · Laterne mit Fibel und Whiskey · Ortstafel hinter beschlagener Scheibe (∴ mit dem Finger) · Kapelle · Waldrand im Nebel.
// Leise Ereignisse: Kreidestriche (Fünfergruppen) entstehen von selbst, die Hausnummer zeigt kurz „17“, Whiskey landet auf der Laterne und dreht den Kopf
//   zur Kamera, die Laterne geht aus – danach führen nasse Abdrücke zur Fibel. 60 s ohne Eingabe: die Kamera geht auf Nr. 7 zu, die Tür steht einen Spalt offen.
// Fortschritt (Spielstand, ohne Vorgriff): nach Kapitel 1 Ortstafel „210“ und die Katze wartet vor der Tür von Nr. 7; ab Kapitel 3 steht der Neunte < 1 s am Lichtrand.
// Oberfläche (CSS in der Basis): Kreide-Titel (bröckelt, Kratzer, Wasserflimmern, selten ∴), Bleistift-Unterstreichung, Polaroid-Kapitel, Notizheft, Mitwirkende.
// Regentropfen auf der Scheibe: oberflaeche.js (#obRegen). Schnittstelle: menu.cam (Basis attractUpdate) · MZ · mz_credits(an).
const MZ_CREDITS = /*@@CREDITS@@*/null;
const MZ = { init: false, live: false, shot: null, si: -1, t: 0, cutT: -1, next: null, idle: 0, P: new THREE.Vector3(), L: new THREE.Vector3(), Q: new THREE.Quaternion(),
  m4: new THREE.Matrix4(), v: new THREE.Vector3(), r: new THREE.Vector3(), fov: 50, fov0: 0, mx: 0, my: 0, sx: 0, sy: 0, grp: null, o: {}, sndT: 45, fotos: {}, after1: false, after3: false,
  credOpen: false, credY: 0, credHold: 0, hoverT: 0, dust: [], dustT: 3, dustF: 0, wetT: 14, wet: 0, alienT: 50, cat: null, schild: false, fog: null };
const MZ_UP = new THREE.Vector3(0, 1, 0);
const mz_v = (x, y, z) => new THREE.Vector3(x, y, z);
const mz_ss = k => { k = Math.max(0, Math.min(1, k)); return k * k * (3 - 2 * k); };
const mz_play = (n, o) => { try { return Audio.ctx && Audio.ctx.state === 'running' ? Audio.play(n, o) : null; } catch (e) { return null; } };

// ---------------------------------------------------------------- Motive: a→b Kamera, la→lb Blickziel, T Sekunden
const MZ_SHOTS = [
  { id: 'nr7', fov: 46, T: 34, a: mz_v(16.6, 1.72, 3.4), b: mz_v(19.0, 1.62, 1.0), la: mz_v(23.9, 2.05, -12), lb: mz_v(24.0, 1.9, -12), start: () => mz_nr7(true), tick: (dt, t) => mz_nr7Tick(dt, t), end: () => mz_nr7(false) },
  { id: 'laterne', fov: 50, T: 34, a: mz_v(-14.6, 1.15, -1.6), b: mz_v(-15.5, 1.05, -.7), la: mz_v(-20, 2.55, 4.2), lb: mz_v(-20, 2.8, 4.3), start: () => mz_lat(true), tick: (dt, t) => mz_latTick(dt, t), end: () => mz_lat(false) },
  { id: 'ortstafel', fov: 52, T: 32, a: mz_v(-64.4, 1.42, 2.5), b: mz_v(-66.1, 1.38, 3.4), la: mz_v(-72.3, 1.75, 6.3), lb: mz_v(-72.6, 1.7, 6.0), start: () => mz_glas(true), tick: (dt, t) => mz_glasTick(dt, t), end: () => mz_glas(false) },
  { id: 'kapelle', fov: 44, T: 30, a: mz_v(-52.5, 1.5, 71.5), b: mz_v(-52.1, 1.7, 74.6), la: mz_v(-52.5, 4.2, 86.6), lb: mz_v(-52.5, 3.7, 86.6), tick: (dt, t) => { if (mz_once('glocke', t > 12)) mz_play('fx_glocke', { gain: .16, x: -52.5, y: 8, z: 86.6, ref: 14 }); } },
  { id: 'wald', fov: 50, T: 32, a: mz_v(29, 1.45, 85), b: mz_v(29.8, 1.4, 88), la: mz_v(28.5, 2.8, 104), lb: mz_v(30, 2.4, 104),
    start: () => { try { for (const V of wald_S.beasts) V.g.visible = false; } catch (e) {} },
    tick: (dt, t) => { if (MZ.after3 && mz_once('schatten', t > 15 && Math.random() < .004)) { try { if (beob_S.V) { beob_show([27.2, 0, 99]); MZ.o.beob = true; setTimeout(() => { try { beob_hide(); } catch (e) {} MZ.o.beob = false; }, 900); } } catch (e) {} }
      if (mz_once('knack', t > 9)) mz_play('fx_knarren_2', { gain: .4, x: 33, y: 3, z: 101, ref: 4 }); if (mz_once('reh', t > 21)) mz_play('fx_reh_1', { gain: .12, x: 10, y: 1, z: 125, ref: 6 }); } }];
// Leerlauf (60 s ohne Eingabe): auf Nr. 7 zu, die Tür geht einen Spalt auf
const MZ_IDLE = { id: 'naeher', fov: 44, T: 90, a: mz_v(21.3, 1.66, 2.5), b: mz_v(22.75, 1.6, -7.6), la: mz_v(22.95, 1.5, -12), lb: mz_v(22.85, 1.45, -12),
  tick: (dt, t) => { const k = mz_ss((t - 10) / 7) * .24; if (typeof door7 !== 'undefined' && k > 0) door7.pivot.rotation.y = Math.max(door7.cur, k);
    if (mz_once('tuer', t > 10.2)) mz_play('fx_knarren_3', { gain: .5, x: 22.6, y: 1.2, z: -11.9, ref: 2 }) || mz_play('doorCreak', { gain: .2, x: 22.6, y: 1.2, z: -11.9, ref: 2, dur: 2.2 }); } };
function mz_once(k, cond) { if (!cond || MZ.o['_' + k]) return false; MZ.o['_' + k] = true; return true; }

// ---------------------------------------------------------------- Kamera
function mz_shot(S) {
  if (MZ.shot && MZ.shot.end) try { MZ.shot.end(); } catch (e) { console.warn('Menü: Motiv-Ende', e); }
  for (const k in MZ.o) if (k[0] === '_') delete MZ.o[k];
  MZ.shot = S; MZ.t = 0; if (S.start) try { S.start(); } catch (e) { console.warn('Menü: Motiv ' + S.id, e); }
}
function mz_cam(dt, t) {
  const S = MZ.shot; if (!S) return; MZ.t += dt;
  try { if (S.tick) S.tick(dt, MZ.t); } catch (e) { if (!MZ.o.tickErr) { MZ.o.tickErr = 1; console.warn('Menü: ' + S.id, e); } }
  const k = Math.min(1, MZ.t / S.T), e = mz_ss(k) * .65 + k * .35; // sanft, steht aber nie
  MZ.P.lerpVectors(S.a, S.b, e); MZ.L.lerpVectors(S.la, S.lb, e);
  MZ.sx += (MZ.mx - MZ.sx) * Math.min(1, dt * 1.2); MZ.sy += (MZ.my - MZ.sy) * Math.min(1, dt * 1.2);
  MZ.v.subVectors(MZ.L, MZ.P).normalize(); MZ.r.crossVectors(MZ.v, MZ_UP).normalize();
  MZ.P.addScaledVector(MZ.r, MZ.sx * .2 + Math.sin(t * .21) * .05 + Math.sin(t * .47) * .02); MZ.P.y += -MZ.sy * .08 + Math.sin(t * .33 + 1) * .03;
  MZ.L.addScaledVector(MZ.r, Math.sin(t * .17 + 2) * .12); MZ.L.y += Math.sin(t * .13) * .06;
  MZ.m4.lookAt(MZ.P, MZ.L, MZ_UP); MZ.Q.setFromRotationMatrix(MZ.m4); MZ.fov = S.fov;
  player.pos.x = MZ.P.x; player.pos.z = MZ.P.z; player.yaw = Math.atan2(-MZ.v.x, -MZ.v.z); player.pitch = 0; // Auslese, Klang und Blickziele folgen der Menükamera
  // Schnitt über Schwarz: am Motivende oder auf Wunsch (Leerlauf an/aus)
  if (MZ.cutT < 0 && (MZ.t > S.T - 1.1 || MZ.next)) { MZ.cutT = 0; $('mzCut').classList.add('on'); }
  if (MZ.cutT >= 0) { MZ.cutT += dt; if (MZ.cutT > 1.15) { const n = MZ.next || MZ_SHOTS[MZ.si = (MZ.si + 1) % MZ_SHOTS.length]; MZ.next = null; MZ.cutT = -1; mz_shot(n); $('mzCut').classList.remove('on'); } }
}
function mz_camFn(cam) { if (!menu.attract || !MZ.live) return; cam.position.copy(MZ.P); cam.quaternion.copy(MZ.Q); if (Math.abs(cam.fov - MZ.fov) > .01) { cam.fov = MZ.fov; cam.updateProjectionMatrix(); } }

// ---------------------------------------------------------------- Motiv 1: Nr. 7 – Kreidestriche, Hausnummer „17“, Katze
function mz_nr7(an) {
  const O = MZ.o;
  if (an) {
    if (O.kreide) { O.kreideN = 0; O.kreideX.clearRect(0, 0, 512, 256); O.kreide.material.map.needsUpdate = true; O.kreide.visible = true; }
    if (!O.plate) { const c = mz_v(23.6, 2.6, -11.8); scene.traverse(m => { if (!O.plate && m.isMesh && m.geometry && m.geometry.type === 'BoxGeometry' && Math.abs(m.geometry.parameters.width - .3) < .005 && Math.abs(m.geometry.parameters.height - .225) < .005 && m.material && m.material.map && m.material.map.image && m.material.map.image.getContext) { m.getWorldPosition(MZ.v); if (MZ.v.distanceTo(c) < 2.2) O.plate = m; } });
      if (O.plate) { const src = O.plate.material.map, im = src.image, cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
        const sx = im.width / 256, sy = im.height / 192; x.fillStyle = '#1b3663'; x.fillRect(28 * sx, 32 * sy, 200 * sx, 112 * sy); x.fillStyle = 'rgba(234,230,218,.95)'; x.font = `bold ${Math.round(98 * sy)}px Arial`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('17', 128 * sx, 92 * sy);
        O.plate17 = new THREE.CanvasTexture(cv); O.plate17.colorSpace = src.colorSpace; O.plateOrig = src; } }
    MZ.cat = null; try { if (katzen_S.ok && katzen_S.ready) { const c = MZ_SHOTS[0].a;
      MZ.cat = MZ.after1 ? katzen_spawn({ x: 23.2, z: -11.35, ry: PI, pose: 'sit' }) : katzen_spawn({ x: 21.3, z: -6.3, pose: 'sit', sims: true, starrt: [c.x, 1.55, c.z] }); } } catch (e) { MZ.cat = null; }
  } else {
    if (O.kreide) O.kreide.visible = false; if (O.plate && O.plateOrig) O.plate.material.map = O.plateOrig;
    if (MZ.cat) { try { katzen_hide(MZ.cat); } catch (e) {} MZ.cat = null; }
  }
}
function mz_nr7Tick(dt, t) {
  const O = MZ.o;
  if (O.kreide) { const n = Math.max(0, Math.min(20, Math.floor((t - 4) / 1.25))); while (O.kreideN < n) { mz_strich(O.kreideX, O.kreideN++); O.kreide.material.map.needsUpdate = true;
    mz_play('ui_stift', { gain: .12, rate: rand(.55, .7), x: O.kreide.position.x, y: .1, z: O.kreide.position.z, ref: 1.6 }); } }
  if (O.plate && O.plate17) { const on = (t > 11 && t < 11.09) || (t > 11.3 && t < 11.37) || (t > 26 && t < 26.14); O.plate.material.map = on ? O.plate17 : O.plateOrig; }
}
function mz_strich(x, i) { // Kreide, Fünfergruppen: vier senkrecht, der fünfte quer – wie ein Kind auf nassem Asphalt
  const g = i / 5 | 0, j = i % 5, x0 = 42 + g * 116; let ax, ay, bx, by;
  if (j < 4) { ax = x0 + j * 19 + rand(-3, 3); ay = 58 + rand(-6, 6); bx = ax + rand(-5, 5); by = 200 + rand(-8, 6); } else { ax = x0 - 14; ay = 178 + rand(-6, 6); bx = x0 + 74; by = 76 + rand(-6, 6); }
  const L = Math.hypot(bx - ax, by - ay), n = L / 1.6 | 0;
  for (let s = 0; s <= n; s++) { const u = s / n, px = ax + (bx - ax) * u + Math.sin(u * 9 + i) * 1.2, py = ay + (by - ay) * u; x.fillStyle = `rgba(240,236,226,${rand(.35, .95) * (u < .05 || u > .95 ? .5 : 1)})`;
    for (let k = 0; k < 3; k++) x.fillRect(px + rand(-3.5, 3.5), py + rand(-1.5, 1.5), rand(1, 3.2), rand(1, 2.4)); }
}

// ---------------------------------------------------------------- Motiv 2: Laterne – Fibel im Lichtkegel, Whiskey, Licht aus, nasse Abdrücke
function mz_lat(an) {
  const O = MZ.o; O.L = O.L || lamps.find(l => Math.abs(l.g.position.x + 20) < .5 && l.g.position.z > 0) || null;
  if (O.fibel) O.fibel.visible = an; if (O.spur) O.spur.visible = false;
  if (an) { O.wk = null; O.lampMode = O.L ? O.L.mode : null; }
  else { if (O.L && O.lampMode) { O.L.mode = O.lampMode; O.L.dead = 0; } mz_whiskey(false); try { if (MZ.o.beob) beob_hide(); MZ.o.beob = false; } catch (e) {} }
}
function mz_whiskey(an) { const S = typeof whiskey_S !== 'undefined' ? whiskey_S : null; if (!S || !S.ready || !S.g) return null;
  if (!an) { if (MZ.o.wk) { S.g.visible = false; try { S.mx.stopAllAction(); } catch (e) {} S.cur = null; S.g.rotation.x = 0; MZ.o.wk = null; } return null; }
  const k = n => S.A[n] ? n : Object.keys(S.A).find(a => a.includes(n)) || Object.keys(S.A)[0];
  return MZ.o.wk = { S, fly: k('Fly'), idle: k('IdleLookAround'), t: 0, landed: false, hy: 0, roll: 0, from: mz_v(-6, 9, 13), ctrl: mz_v(-12, 9.8, 6.5), to: mz_v(-20, 5.3, 4.62) };
}
function mz_latTick(dt, t) {
  const O = MZ.o, cam = MZ.P;
  // Whiskey: fliegt ab 3 s ein, landet auf dem Laternenkopf, dreht später ruckartig den Kopf zur Kamera, legt ihn schief
  if (t > 3 && !O.wk && !O.wkDone) { O.wkDone = true; const W = mz_whiskey(true); if (W) { W.S.g.visible = true; whiskey_play(W.fly, .1); W.S.g.position.copy(W.from); try { Audio.flap(W.from.x, W.from.y, W.from.z); } catch (e) {} } }
  const W = O.wk; if (W) { const g = W.S.g; W.t += dt;
    if (!W.landed) { const u = Math.min(1, W.t / 3.4), q = 1 - (1 - u) * (1 - u), a = W.from, c = W.ctrl, b = W.to; const px = g.position.x, pz = g.position.z;
      g.position.set((1 - q) * (1 - q) * a.x + 2 * (1 - q) * q * c.x + q * q * b.x, (1 - q) * (1 - q) * a.y + 2 * (1 - q) * q * c.y + q * q * b.y, (1 - q) * (1 - q) * a.z + 2 * (1 - q) * q * c.z + q * q * b.z);
      if (u < .97) g.rotation.y = Math.atan2(g.position.x - px, g.position.z - pz); g.rotation.x = u < .8 ? -.12 : 0;
      if (u >= 1) { W.landed = true; W.lt = 0; whiskey_play(W.idle, .35); W.face = Math.atan2(cam.x - g.position.x, cam.z - g.position.z) + 1.35; mz_play('crow1', { gain: .32, rate: .78, x: g.position.x, y: g.position.y, z: g.position.z, ref: 5, delay: .5 }); } }
    else if (t > 25.5) { // Abgang: Flügelschlag, steigt auf und verschwindet im Nebel (erst unsichtbar, wenn weit weg – dann Schnitt)
      if (!W.left) { W.left = { u: 0, a: g.position.clone(), d: new THREE.Vector3(g.position.x - cam.x, 0, g.position.z - cam.z).normalize() }; whiskey_play(W.fly, .1); try { Audio.flap(g.position.x, g.position.y, g.position.z); } catch (e) {} }
      const L = W.left; L.u = Math.min(1, L.u + dt / 4.2); const q = L.u * L.u; g.position.set(L.a.x + L.d.x * 70 * q, L.a.y + 16 * q + 1.2 * L.u, L.a.z + L.d.z * 70 * q);
      g.rotation.y += whiskey_wrap(Math.atan2(L.d.x, L.d.z) - g.rotation.y) * Math.min(1, dt * 4); g.rotation.x = -.15; if (L.u >= 1) { g.visible = false; }
      try { W.S.mx.update(dt); } catch (e) {} return mz_latRest(t, O); }
    else { W.lt += dt; g.rotation.y += whiskey_wrap(W.face - g.rotation.y) * Math.min(1, dt * 5);
      const want = Math.max(-1.5, Math.min(1.5, whiskey_wrap(Math.atan2(cam.x - g.position.x, cam.z - g.position.z) - g.rotation.y)));
      const tgt = t < 10 ? 0 : t < 11.2 ? want * .45 : want; W.hy += (tgt - W.hy) * Math.min(1, dt * 16); W.roll += ((t > 12.6 ? .24 : 0) - W.roll) * Math.min(1, dt * 10); }
    try { W.S.mx.update(dt); if (W.landed) whiskey_headApply(W.hy, W.roll); } catch (e) {} }
  mz_latRest(t, O);
}
function mz_latRest(t, O) {
  // Licht aus (Wackelkontakt, Brummen), 1,4 s dunkel, dann wieder an: nasse Abdrücke führen aus dem Dunkel zur Fibel
  if (O.L) { if (mz_once('aus', t > 16)) { O.L.mode = 'dying'; O.L.dead = 0; try { Audio.buzz(O.L.wx, 5, O.L.wz); } catch (e) {} }
    if (mz_once('an', t > 18.6)) { O.L.mode = 'flicker'; if (O.spur) O.spur.visible = true;
      if (MZ.after3) try { if (beob_S.V) { beob_show([-22.7, 0, 5.5]); MZ.o.beob = true; } } catch (e) {} }
    if (MZ.o.beob && t > 19.15) { try { beob_hide(); } catch (e) {} MZ.o.beob = false; }
    if (mz_once('ok', t > 19.4)) { O.L.mode = O.lampMode || 'on'; O.L.dead = 0; } }
}

// ---------------------------------------------------------------- Motiv 3: Ortstafel durch die beschlagene Scheibe – jemand malt ∴ hinein
function mz_glas(an) {
  $('start').classList.toggle('mzGlas', an);
  if (an) { MZ.o.sig = -1; MZ.o.maskT = 0; mz_maske(0);
    if (MZ.after1 && !MZ.schild && typeof kino_schild === 'function') try { MZ.schild = kino_schild('210'); } catch (e) {} }
}
function mz_glasTick(dt, t) { const p = Math.max(0, Math.min(1, (t - 5) / 3.6)); MZ.o.maskT -= dt;
  if (MZ.o.maskT <= 0 && (p !== MZ.o.sig || t > 9)) { MZ.o.maskT = p > 0 && p < 1 ? .18 : 1.2; MZ.o.sig = p; mz_maske(p, t);
    if (p > 0 && p < 1 && mz_once('wisch', true)) mz_play('fx_laub_2', { gain: .05, rate: 2.2, pan: .4, dur: 1.2 }); } }
function mz_maske(p, t = 0) { // Beschlag als Maske für #mzFog: deckend = verschwommen; Fingerspuren und Tropfenbahnen frei
  const F = MZ.fog || (MZ.fog = (() => { const c = document.createElement('canvas'); c.width = 320; c.height = 180; return { c, x: c.getContext('2d'), runs: [...Array(9)].map(() => ({ x: rand(0, 320), y0: rand(-40, 120), v: rand(4, 11) })) }; })());
  const x = F.x, W = 320, H = 180; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, W, H);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-out'; x.lineCap = 'round';
  for (const r of F.runs) { const y = r.y0 + r.v * t; x.strokeStyle = 'rgba(0,0,0,.8)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(r.x, Math.max(0, y - 70)); x.quadraticCurveTo(r.x + 2, y - 30, r.x - 1, y); x.stroke(); }
  const cx = W * .7, cy = H * .42, s = 17, dots = [[cx, cy - s * .62], [cx - s * .72, cy + s * .48], [cx + s * .72, cy + s * .48]];
  dots.forEach(([dx, dy], i) => { const q = Math.max(0, Math.min(1, p * 3 - i)); if (q <= 0) return; x.fillStyle = 'rgba(0,0,0,.95)'; x.beginPath(); x.ellipse(dx, dy, 5.2 * q, 6 * q, .3, 0, 7); x.fill();
    const L = Math.min(26, Math.max(0, t - 6 - i) * 2.4); if (L > 1) { x.strokeStyle = 'rgba(0,0,0,.85)'; x.lineWidth = 1.8; x.beginPath(); x.moveTo(dx + .5, dy + 5); x.lineTo(dx + 1, dy + 5 + L); x.stroke(); x.beginPath(); x.arc(dx + 1, dy + 6 + L, 1.6, 0, 7); x.fill(); } });
  $('mzFog').style.setProperty('--mzMask', `url(${F.c.toDataURL()})`);
}

// ---------------------------------------------------------------- Kapitelwahl: Polaroids (freie Kapitel mit Blitzfoto aus der geladenen Welt, gesperrte unentwickelt)
const MZ_FOTO = { 1: [[20.3, 1.55, -3.6], [23.4, 1.45, -12]], 2: [[9.4, 1.35, 1.6], [9, 0, -1.3]], 3: [[-36, 1.75, 1.5], [0, 3, -2]], 4: [[-66.2, 1.45, 3.6], [-72.3, 1.75, 6.3]], 5: [[-49.5, 1.55, -3.5], [-47, 1.45, -12]], 6: [[29, 1.5, 86], [28.5, 2.6, 104]] };
function mz_polaroids() {
  const P = $('subPanel'); if (!P.querySelector('.chap #c1')) return; const rot = [-2.4, 1.6, -1.1, 2.2, -1.8, 1.2, -2.8], need = [];
  for (let n = 1; n <= 7; n++) { const b = $('c' + n); if (!b || b.querySelector('.mzPh')) continue; b.style.setProperty('--r', rot[n - 1] + 'deg');
    const ph = document.createElement('span'); ph.className = 'mzPh'; b.prepend(ph); b.onmouseenter = () => mz_hover('ui_seite');
    if (!b.disabled) { if (MZ.fotos[n]) ph.style.backgroundImage = `url(${MZ.fotos[n]})`; else if (MZ_FOTO[n]) need.push([n, ph]); } }
  if (need.length) mz_fotos(need);
}
function mz_fotos(list) { // dieselbe Kamera, dieselbe Auslese, dieselbe Nachbearbeitung wie im Spiel; danach sofort zurück (das Zwischenbild wird nie gezeigt)
  const cam = camera, p0 = cam.position.clone(), q0 = cam.quaternion.clone(), f0 = cam.fov, fi0 = flashlight.intensity, out = document.createElement('canvas'); out.width = 360; out.height = 296; const ox = out.getContext('2d');
  const frame = () => { sky.position.copy(cam.position); fogUniforms.camPos.value.copy(cam.position); PERF_CULL.t = 0; perfCullTick(0); try { rigFarHide(); vcullHide(); dcullHide(); composer.render(); } finally { rigFarShow(); } };
  try { for (const [n, ph] of list) { const [a, b] = MZ_FOTO[n]; cam.position.set(a[0], a[1], a[2]); cam.lookAt(b[0], b[1], b[2]); cam.fov = 58; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      flashRig.position.copy(cam.position); flashRig.quaternion.copy(cam.quaternion); flashRig.updateMatrixWorld(true); flashlight.intensity = 16; // Blitz
      fogUniforms.flP.value.copy(cam.position); fogUniforms.flD.value.set(0, 0, -1).applyQuaternion(cam.quaternion); fogUniforms.flK.value.set(16 / 18, Math.cos(flashlight.angle)); frame();
      const cv = renderer.domElement, Wd = cv.width, Hd = cv.height, sw = Math.min(Wd, Hd * 360 / 296), sh = sw * 296 / 360; ox.drawImage(cv, (Wd - sw) / 2, (Hd - sh) / 2, sw, sh, 0, 0, 360, 296);
      MZ.fotos[n] = out.toDataURL('image/jpeg', .85); ph.style.backgroundImage = `url(${MZ.fotos[n]})`; } }
  catch (e) { console.warn('Menü: Polaroids', e); }
  finally { cam.position.copy(p0); cam.quaternion.copy(q0); cam.fov = f0; cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); flashlight.intensity = fi0; fogUniforms.flK.value.set(0, 1); try { frame(); } catch (e) {} }
}

// ---------------------------------------------------------------- Mitwirkende (CREDITS.md, beim Bauen eingesetzt; „Verwendung im Spiel“ bleibt weg – sie verrät die Handlung)
function mz_credHTML() {
  const md = typeof MZ_CREDITS === 'string' ? MZ_CREDITS : '', e2 = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cl = s => e2(String(s).replace(/\s*\([^()]*`[^()]*\)/g, '').replace(/`[^`]*`/g, '').replace(/\(\s*[,;·]?\s*\)/g, '').replace(/,\s*\)/g, ')').replace(/\s+([,.;)])/g, '$1').replace(/\s{2,}/g, ' ').trim()).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  const BY = 'creativecommons.org/licenses/by/4.0/', ZERO = 'creativecommons.org/publicdomain/zero/1.0/';
  let h = `<div class="head"><div class="t1">HIGH ABYSS</div><div class="t2">MIRA</div><div class="t3">ein Spiel von <b>LUCIDWORKZ</b></div></div>`, cols = null, cc = false, skip = false, grid = false, list = false;
  const close = () => { if (grid) h += '</div>'; if (list) h += '</ul>'; grid = list = false; };
  for (const raw of md.split(/\r?\n/)) { const l = raw.trim();
    if (l.startsWith('## ')) { close(); const t = cl(l.slice(3)); skip = /nicht im Spiel/i.test(t); cc = /CC-?BY/i.test(t); cols = null; if (!skip) h += `<h3>${t}</h3>`; continue; }
    if (skip || !l || l.startsWith('# ')) continue;
    if (l.startsWith('|')) { const c = l.split('|').slice(1, -1).map(x => x.trim()); if (/^-+$/.test(c[0].replace(/:/g, ''))) continue;
      if (!cols) { cols = c; continue; } const w = c[cols.indexOf('Werk')] ?? c[0], a = c[cols.indexOf('Urheber')] ?? c[1], q = c[c.length - 1], zero = /^CC0/.test(w);
      if (!grid) { close(); h += '<div class="grid">'; grid = true; }
      h += `<div class="e"><div class="w">${cl(w)}</div><div class="a">von ${cl(a)}</div><div class="q">${cl(q)}</div><div class="l">${zero ? 'CC0 1.0 · ' + ZERO : cc ? 'CC BY 4.0 · ' + BY + ' · verändert' : ''}</div></div>`; continue; }
    if (l.startsWith('- ')) { if (!list) { close(); h += '<ul>'; list = true; } h += `<li>${cl(l.slice(2))}</li>`; continue; }
    close(); h += `<p class="note">${cl(l)}</p>`; }
  close(); if (!md) h += '<p class="note">Die Liste der Mitwirkenden steht in CREDITS.md.</p>';
  return h + '<div class="end">∴<small>Danke, dass du hingesehen hast.</small></div>';
}
function mz_credits(an) {
  let C = $('mzCred');
  if (an && !C) { C = document.createElement('div'); C.id = 'mzCred'; C.innerHTML = `<div class="roll" tabindex="0">${mz_credHTML()}</div><div class="bar"><span>MAUSRAD · PFEILTASTEN</span><button id="mzCredZu">ZURÜCK</button></div>`; $('start').appendChild(C);
    const R = C.querySelector('.roll'); R.addEventListener('wheel', () => { MZ.credHold = 4; }, { passive: true }); R.addEventListener('pointerdown', () => { MZ.credHold = 6; });
    $('mzCredZu').onclick = e => { e.stopPropagation(); menuSound(); mz_credits(false); }; C.onclick = e => e.stopPropagation(); }
  if (!C) return; C.classList.toggle('show', an); MZ.credOpen = an;
  if (an) { const R = C.querySelector('.roll'); R.scrollTop = 0; MZ.credY = 0; MZ.credHold = 2; R.focus({ preventScroll: true }); } else if ($('mCred')) $('mCred').focus({ preventScroll: true });
}

// ---------------------------------------------------------------- Oberfläche: Titel, Bleistift, Klang, Tastatur
function mz_hover(n = 'ui_stift') { const now = performance.now(); if (now - MZ.hoverT < 110) return; MZ.hoverT = now;
  if (!mz_play(n, { gain: n === 'ui_seite' ? .07 : .06, rate: rand(1.05, 1.3), dur: .3 })) mz_play('switch1', { gain: .05, rate: 1.7 });
  if (n === 'ui_stift' && Math.random() < .1) mz_play('fx_fluester_' + (1 + (Math.random() * 4 | 0)), { gain: .022, rate: rand(.92, 1.02), pan: Math.random() < .5 ? -.85 : .85, dur: 1.6 }); }
function mz_pencil(b) { const tn = [...b.childNodes].find(n => n.nodeType === 3 && n.textContent.trim()); if (!tn || b.querySelector('.mzT')) return;
  const sp = document.createElement('span'); sp.className = 'mzT'; b.insertBefore(sp, tn); sp.appendChild(tn); let d = `M0 ${rand(5, 7).toFixed(1)}`;
  for (let i = 1; i <= 4; i++) d += ` Q${i * 25 - 12} ${rand(3, 9).toFixed(1)} ${i * 25} ${rand(4.5, 7.5).toFixed(1)}`;
  sp.insertAdjacentHTML('beforeend', `<svg class="mzU" viewBox="0 0 100 12" preserveAspectRatio="none"><path pathLength="1" d="${d}"/><path pathLength="1" d="M6 ${rand(7, 9).toFixed(1)} Q50 ${rand(5, 10).toFixed(1)} 94 ${rand(6, 9).toFixed(1)}"/></svg>`); }
(function mz_dom() { try { // läuft beim Laden: Ebenen, Kreidetextur, Wasserfilter, Bleistiftstriche (nur Aussehen; IDs und Handler bleiben)
  const st = $('start'); if (!st) return; const cut = document.createElement('div'); cut.id = 'mzCut'; const fog = document.createElement('div'); fog.id = 'mzFog'; st.prepend(cut); st.prepend(fog);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
  svg.innerHTML = '<filter id="mzWater" x="-5%" y="-15%" width="110%" height="130%"><feTurbulence id="mzTurb" type="fractalNoise" baseFrequency="0.008 0.05" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>'; st.appendChild(svg);
  const c = document.createElement('canvas'); c.width = c.height = 190; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, 190); g.addColorStop(0, '#f4efe3'); g.addColorStop(1, '#d6cdb8'); x.fillStyle = g; x.fillRect(0, 0, 190, 190);
  for (let i = 0; i < 2600; i++) { x.fillStyle = Math.random() < .55 ? `rgba(40,36,30,${rand(.05, .26)})` : `rgba(255,255,255,${rand(.1, .5)})`; x.fillRect(Math.random() * 190, Math.random() * 190, rand(.6, 2.2), rand(.5, 1.4)); }
  x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(0,0,0,${rand(.3, .95)})`; x.fillRect(Math.random() * 190, Math.random() * 190, rand(.6, 1.8), rand(.6, 1.8)); }
  for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(0,0,0,${rand(.05, .25)})`; x.lineWidth = rand(.5, 1.5); const y = Math.random() * 190; x.beginPath(); x.moveTo(-5, y); x.lineTo(195, y + rand(-6, 6)); x.stroke(); }
  st.style.setProperty('--mzChalk', `url(${c.toDataURL('image/png')})`);
  const h1 = st.querySelector('h1'), m = h1 && h1.querySelector('.m'); if (m) { const s = document.createElement('span'); s.className = 'mzSig ob-fremd'; s.textContent = '∴'; m.appendChild(s); const d = document.createElement('canvas'); d.id = 'mzDust'; h1.appendChild(d); }
  st.querySelectorAll('#mainMenu button').forEach(mz_pencil);
} catch (e) { console.warn('Menü: Oberfläche', e); } })();
// R-27: Lesbarkeit (alle Schriften im Menü ≥ 14 px, Menüpunkte ≥ 22 px), Beta-Vermerk, einmaliger Hinweis – alles hier, damit die Basis unberührt bleibt
(function mz_r27() { try { const st = document.createElement('style'); st.id = 'mzR27'; st.textContent = `
  #start .sub { font-size: 16px; letter-spacing: .4em; color: #a99c80; } #start .dir { font-size: 17px; }
  #mainMenu button { font-size: 28px; padding-top: 9px; padding-bottom: 9px; } #mainMenu button small { font-size: 15px; letter-spacing: .24em; color: #8d7f66; }
  @media (max-height: 860px) { #mainMenu button { font-size: clamp(22px, 3.3vh, 28px); padding-top: .5vh; padding-bottom: .6vh; } #start .dir { font-size: 15px; } }
  #start .foot { font-size: 14px; color: #85795f; } #goText { font-size: 15px; }
  #subPanel .close button, #pause .pbtns button, .case button { font-size: 16px; } #subPanel .chap button small { font-size: 14px; }
  #mzCred .bar, #mzCred .bar button { font-size: 14px; }
  #start .mzBeta { margin: -22px 0 26px; font: 600 17px "Cormorant Garamond", Georgia, serif; letter-spacing: .3em; color: #d9b36c; text-shadow: 0 0 14px rgba(217,179,108,.3), 0 2px 4px #000; }
  #start .mzBeta b { color: #fff0cf; letter-spacing: .34em; border: 1px solid rgba(217,179,108,.7); padding: 2px 10px 1px; margin-right: 12px; }
  #mzHint { position: absolute; right: 36px; bottom: 64px; width: min(430px, 40vw); padding: 20px 24px 18px; z-index: 6; background: rgba(8,6,5,.9); border: 1px solid rgba(217,179,108,.5); box-shadow: 0 0 40px rgba(0,0,0,.8); color: #e3d9c2; font: 18px/1.5 "Cormorant Garamond", Georgia, serif; opacity: 0; transition: opacity .9s; }
  #mzHint.on { opacity: 1; } #mzHint h4 { margin: 0 0 8px; font: 600 16px "Cormorant Garamond", Georgia, serif; letter-spacing: .34em; color: #d9b36c; font-weight: 600; }
  #mzHint button { margin-top: 12px; background: none; border: 1px solid rgba(217,179,108,.6); color: #f0e6cc; font: 600 16px "Cormorant Garamond", Georgia, serif; letter-spacing: .3em; padding: 8px 20px; cursor: pointer; } #mzHint button:hover, #mzHint button:focus { background: rgba(142,29,21,.35); outline: none; }`;
  document.head.appendChild(st);
  const dir = $('start').querySelector('.dir'); if (dir) { const b = document.createElement('div'); b.className = 'mzBeta'; b.id = 'mzBeta'; dir.after(b); }
} catch (e) { console.warn('Menü: R-27 Oberfläche', e); } })();
function mz_beta() { // Vermerk unter dem Titel + einmaliger Hinweis (je Rechner, localStorage)
  const bld = typeof window.HAM_BUILD === 'string' ? window.HAM_BUILD : '', ts = window.HAM_TESTSTAND ? `Kapitel 1–${window.HAM_TESTSTAND}` : 'Kapitel 1–6';
  const B = $('mzBeta'); if (B) B.innerHTML = `<b>BETA</b>Testversion ${ts}${bld ? ' · Build ' + bld : ''}`;
  let seen = false; try { seen = !!localStorage.getItem('ham_beta_hinweis'); } catch (e) {} if (seen || $('mzHint')) return;
  const h = document.createElement('div'); h.id = 'mzHint'; h.innerHTML = `<h4>BETA · TESTVERSION</h4>Du spielst eine unfertige Testversion (${ts}). Es kann noch Fehler, fehlende Stimmen und ruckelnde Stellen geben. Jede Rückmeldung hilft.<br><button>VERSTANDEN</button>`;
  $('start').appendChild(h); const zu = () => { h.classList.remove('on'); try { localStorage.setItem('ham_beta_hinweis', '1'); } catch (e) {} setTimeout(() => h.remove(), 1000); };
  h.querySelector('button').onclick = e => { e.stopPropagation(); menuSound(); zu(); h.dataset.zu = 1; }; setTimeout(() => h.classList.add('on'), 1800); setTimeout(() => { if (!h.dataset.zu && h.isConnected) zu(); }, 26000); }
function mz_titel(dt) { // Kreide bröckelt, selten Wasserflimmern, sehr selten das Zeichen
  const h1 = $('start').querySelector('h1'), d = $('mzDust'); if (!h1 || !d) return;
  MZ.dustT -= dt; if (MZ.dustT < 0) { const burst = Math.random() < .18; MZ.dustT = rand(2, 5); const L = h1.querySelectorAll('.m i'), cr = d.getBoundingClientRect(); if (d.width !== Math.round(cr.width * .75)) { d.width = Math.round(cr.width * .75); d.height = Math.round(cr.height * .75); }
    const li = L[Math.random() * L.length | 0]; if (li && cr.width) { const r = li.getBoundingClientRect(); for (let i = 0, n = burst ? 12 : 1 + (Math.random() * 3 | 0); i < n; i++) MZ.dust.push({ x: (r.left - cr.left + rand(.15, .85) * r.width) * .75, y: (r.top - cr.top + rand(.55, .92) * r.height) * .75, vx: rand(-6, 6), vy: rand(4, 18), a: rand(.5, .9), s: rand(.7, 1.9), t: 0, T: rand(1.1, 2.1) }); } }
  if (MZ.dust.length) { MZ.dustF += dt; if (MZ.dustF > .033) { const x = d.getContext('2d'), f = MZ.dustF; MZ.dustF = 0; x.clearRect(0, 0, d.width, d.height);
    for (let i = MZ.dust.length - 1; i >= 0; i--) { const p = MZ.dust[i]; p.t += f; p.vy += 110 * f; p.x += p.vx * f; p.y += p.vy * f; if (p.t > p.T) { MZ.dust.splice(i, 1); continue; } x.fillStyle = `rgba(236,230,214,${p.a * (1 - p.t / p.T)})`; x.fillRect(p.x, p.y, p.s, p.s); }
    if (!MZ.dust.length) x.clearRect(0, 0, d.width, d.height); } }
  MZ.wetT -= dt; if (MZ.wetT < 0) { MZ.wetT = rand(16, 30); MZ.wet = 2.6; h1.classList.add('mzWet'); }
  if (MZ.wet > 0) { MZ.wet -= dt; const tb = document.getElementById('mzTurb'); if (tb) tb.setAttribute('seed', String(Math.floor(MZ.wet * 12))); if (MZ.wet <= 0) h1.classList.remove('mzWet'); }
  MZ.alienT -= dt; if (MZ.alienT < 0) { MZ.alienT = rand(45, 110); h1.classList.add('mzAlien'); setTimeout(() => h1.classList.remove('mzAlien'), 140); setTimeout(() => { h1.classList.add('mzAlien'); setTimeout(() => h1.classList.remove('mzAlien'), 60); }, 260); }
}
function mz_fokus(list, dir) { const L = list.filter(b => b.offsetParent !== null && !b.disabled); if (!L.length) return; let i = L.indexOf(document.activeElement); i = i < 0 ? (dir > 0 ? 0 : L.length - 1) : (i + dir + L.length) % L.length; L[i].focus(); }
function mz_init() {
  MZ.init = true; try { mz_beta(); } catch (e) { console.warn('Menü: Beta', e); }
  $('mainMenu').querySelectorAll('button').forEach(b => { mz_pencil(b); b.onmouseenter = () => mz_hover(); b.addEventListener('focus', () => mz_hover()); });
  { const oc = $('mChap').onclick; $('mChap').onclick = e => { oc(e); try { mz_polaroids(); } catch (er) { console.warn('Menü: Polaroids', er); } }; }
  if ($('mCred')) $('mCred').onclick = e => { e.stopPropagation(); menuSound(); mz_credits(true); };
  const wach = () => { MZ.idle = 0; if (MZ.shot === MZ_IDLE && MZ.t > 1.5 && MZ.cutT < 0) MZ.next = MZ_SHOTS[MZ.si = (MZ.si + 1) % MZ_SHOTS.length]; };
  addEventListener('mousemove', e => { MZ.mx = e.clientX / innerWidth * 2 - 1; MZ.my = e.clientY / innerHeight * 2 - 1; wach(); }, { passive: true });
  addEventListener('pointerdown', wach, { passive: true }); addEventListener('wheel', wach, { passive: true });
  addEventListener('keydown', e => { if (state.started || !$('start').classList.contains('show')) return; wach();
    if (MZ.credOpen) { const R = $('mzCred').querySelector('.roll'), pg = R.clientHeight * .8, st = { ArrowDown: 70, ArrowUp: -70, PageDown: pg, PageUp: -pg, Space: pg, End: 1e6, Home: -1e6 }[e.code];
      if (e.code === 'Escape') { e.preventDefault(); mz_credits(false); } else if (st) { e.preventDefault(); MZ.credHold = 5; R.scrollTop += st; MZ.credY = R.scrollTop; } return; }
    const P = $('subPanel'), a = document.activeElement, back = e.shiftKey || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowLeft';
    if (P.classList.contains('show')) { if (e.code === 'Escape') { const z = $('subClose'); if (z) { e.preventDefault(); z.click(); } return; }
      const tag = a && a.tagName, field = tag === 'SELECT' || (tag === 'INPUT' && a.type === 'range');
      if (e.code === 'Tab' || ((e.code === 'ArrowDown' || e.code === 'ArrowUp') && tag !== 'SELECT') || ((e.code === 'ArrowLeft' || e.code === 'ArrowRight') && !field)) { e.preventDefault(); mz_fokus([...P.querySelectorAll('button, input, select')], back ? -1 : 1); }
      return; }
    if (['Tab', 'ArrowDown', 'ArrowUp', 'KeyS', 'KeyW'].includes(e.code)) { e.preventDefault(); mz_fokus([...$('mainMenu').querySelectorAll('button')], back ? -1 : 1); } });
}

// ---------------------------------------------------------------- Start/Ende der Bühne
function mz_start() {
  MZ.live = true; MZ.fov0 = camera.fov; MZ.idle = 0; MZ.si = 0;
  try { const sv = loadSave(); MZ.after1 = !!(saveFlags.ch2 || (sv && (sv.chapter >= 2 || (sv.st && sv.st.ch1Done)))); MZ.after3 = !!(saveFlags.ch3 || (sv && sv.chapter >= 3)); } catch (e) {}
  menu.cam = (dt, t) => { if (!MZ.live) return false; mz_cam(dt, t); return true; }; setCamOverride(mz_camFn);
  mz_shot(MZ_SHOTS[0]); try { Audio.init(); Audio.setArea(false, false); } catch (e) {} // Electron: Menümusik, Regen und Wind ohne ersten Klick
}
function mz_stop() {
  MZ.live = false; if (MZ.shot && MZ.shot.end) try { MZ.shot.end(); } catch (e) {} MZ.shot = null; menu.cam = null; if (camOverride === mz_camFn) setCamOverride(null);
  camera.fov = MZ.fov0 || settings.fov; camera.updateProjectionMatrix(); $('start').classList.remove('mzGlas'); $('mzCut').classList.remove('on');
  if (MZ.schild) { MZ.schild = false; try { kino_schild('orig'); } catch (e) {} } // im Spiel setzt kino_persist „210“ wieder, wenn es stimmt
  if (MZ.grp) { scene.remove(MZ.grp); MZ.grp.traverse(o => { if (o.userData.mzEigen) { o.geometry.dispose(); [].concat(o.material).forEach(m => { if (m.map) m.map.dispose(); if (m.alphaMap && m.userData.mzEigen) m.alphaMap.dispose(); m.dispose(); }); } }); MZ.grp = null; }
}
function mz_tick(dt) {
  if (!menu.attract || state.started) return mz_stop();
  if (!$('start').classList.contains('show')) return; mz_titel(dt);
  if (MZ.credOpen) { const R = $('mzCred').querySelector('.roll'); if (MZ.credHold > 0) { MZ.credHold -= dt; MZ.credY = R.scrollTop; } else { MZ.credY += dt * 34; R.scrollTop = MZ.credY; } }
  const panel = $('subPanel').classList.contains('show') || MZ.credOpen; MZ.idle += dt;
  if (MZ.idle > 60 && !panel && MZ.shot !== MZ_IDLE && MZ.cutT < 0) MZ.next = MZ_IDLE;
  MZ.sndT -= dt; if (MZ.sndT < 0) { MZ.sndT = rand(38, 85); const s = Math.random() < .5 ? -1 : 1, r = Math.random(), n = k => 1 + (Math.random() * k | 0); // selten, leise, außerhalb des Bildes – nur Aufnahmen
    if (r < .3) mz_play('fx_knarren_' + [1, 4, 6][n(3) - 1], { gain: .1, pan: s * .8, rate: rand(.9, 1.05) }); else if (r < .5) mz_play('doorCreak', { gain: .09, pan: s * .7, offset: rand(0, .6), dur: 2 });
    else if (r < .65) mz_play('fx_fluester_' + n(4), { gain: .03, pan: s * .9, dur: 1.8 }); else if (r < .85) mz_play('fx_rabe_' + n(5), { gain: .08, pan: s * .6 }); else mz_play('fx_hund_' + n(4), { gain: .05, pan: s * .7, rate: .95 }); }
}

// ---------------------------------------------------------------- Laden: Requisiten der Bühne (alles vorhanden/zwischengespeichert, unsichtbar bis zum Auftritt; der Gesamt-Durchgang übersetzt die Shader)
WORLD_MODS.push(['Menü-Bühne', async () => {
  const G = MZ.grp = new THREE.Group(); G.name = 'menue'; scene.add(G); const O = MZ.o, eigen = m => { m.userData.mzEigen = true; return m; };
  { const c = document.createElement('canvas'); c.width = 512; c.height = 256; O.kreideX = c.getContext('2d'); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const m = eigen(new THREE.Mesh(new THREE.PlaneGeometry(1.3, .65), new THREE.MeshStandardMaterial({ map: t, transparent: true, color: 0xd6d2ca, roughness: .95, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })));
    m.rotation.set(-PI / 2, 0, -.44); m.position.set(18.3, .015, -.6); m.renderOrder = 2; m.visible = false; G.add(m); O.kreide = m; }
  try { const T = beob_texte(), mat = new THREE.MeshStandardMaterial({ alphaMap: T.fuss, color: 0x0d0e10, transparent: true, opacity: .62, depthWrite: false, roughness: .08, metalness: .05, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const sp = new THREE.Group(), a = [-22.9, .6], b = [-20.35, 3.25], dir = Math.atan2(b[0] - a[0], b[1] - a[1]), geo = new THREE.PlaneGeometry(.12, .145);
    for (let i = 0; i < 7; i++) { const u = i / 6, q = eigen(new THREE.Mesh(i ? geo : geo, mat)); q.rotation.set(-PI / 2, 0, dir + PI); q.position.set(a[0] + (b[0] - a[0]) * u + Math.cos(dir) * (i % 2 ? .07 : -.07), .012, a[1] + (b[1] - a[1]) * u - Math.sin(dir) * (i % 2 ? .07 : -.07)); q.renderOrder = 2; sp.add(q); }
    sp.visible = false; G.add(sp); O.spur = sp; } catch (e) { console.warn('Menü: Abdrücke', e); }
  try { const src = await msModel('w_buch', 'model.glb'), b = msFit(src.clone(true), .27, 'max'); b.updateMatrixWorld(true); let bb = new THREE.Box3().setFromObject(b); const s = bb.getSize(new THREE.Vector3());
    if (s.x < s.y && s.x <= s.z) b.rotation.z = PI / 2; else if (s.z < s.y && s.z < s.x) b.rotation.x = PI / 2; // die dünne Seite nach oben: die Fibel liegt flach
    b.traverse(m => { if (m.isMesh) { m.material = [].concat(m.material).map(x => { const c = x.clone(); c.userData.mzEigen = true; if (c.color) c.color.multiply(new THREE.Color(.62, .26, .2)); c.roughness = .38; return c; }); if (m.material.length === 1) m.material = m.material[0]; m.castShadow = true; m.receiveShadow = true; } });
    const F = new THREE.Group(); F.add(b); F.updateMatrixWorld(true); bb = new THREE.Box3().setFromObject(F); b.position.y -= bb.min.y; 
    F.position.set(-19.7, 0, 3.7); F.rotation.y = .6; F.visible = false; G.add(F); O.fibel = F; } catch (e) { console.warn('Menü: Fibel', e); }
}]);
WORLD_TICK.push(dt => { if (!MZ.init && ui.ready) { try { mz_init(); } catch (e) { console.warn('Menü', e); } }
  if (MZ.live) mz_tick(dt); else if (MZ.init && menu.attract && !state.started && ui.ready) mz_start(); });
window.__mz = { MZ, MZ_SHOTS, MZ_IDLE, mz_shot, mz_credits }; // Testzugriff (fehlt in der Veröffentlichung)
