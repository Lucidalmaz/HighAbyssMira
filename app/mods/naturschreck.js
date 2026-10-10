// =====================================================================  NATURSCHRECK (Modul „naturschreck“): leise Schreckmomente, wie sie die Welt von selbst hergibt
// Nutzer 07.10.: „echte subtile Schreckmomente, die natürlich vorkommen – eine Spinne seilt sich vor dein Gesicht ab, ein plötzlicher lauter Donnerschlag, ein Tier huscht vorbei,
// jemand steht plötzlich hinter dir … ohne dass es überladen, häufig oder generisch wirkt; nie zu oft wiederholt, nie zu zufällig.“
// Regeln (damit es natürlich bleibt):
//   · nur in ruhigen Momenten (Stress niedrig, keine Verfolgung, kein Gespräch, kein Film, keine Atempause, nicht nach einem Höhepunkt) – sonst zählt die Uhr nicht weiter;
//   · frühestens ~6 Minuten nach dem Start, danach alle 5–9 Minuten ruhiger Spielzeit höchstens einer, nie derselbe wie die letzten zwei;
//   · jeder Moment hat eigene Bedingungen des Ortes (Spinne nur drinnen unter einer Decke, Vogel nur an einem echten Busch, Donner nur bei Sturm-Himmel …);
//   · alles läuft durch die Regie (spannung_can/spannung_did): Mindestabstand je Familie, Gewöhnung, Kapitel-Dichte.
// Momente: spinneAb · blitzNah · netzGesicht · vogelBusch · dose · tuerZu · flasche · glasBruch · kratzen (Liste NS_M).
// Bewusst NICHT hier: Auftritte der Geschichtsfiguren (Justin, Vegas, Hilde …) – sie haben feste Dialoge und Auftrittsbedingungen in ihren Modulen.
const NS = { t: 0, tick: 0, next: rand(360, 480), calm: 0, ids: [], indoorT: 0, wasIndoor: false, spider: null, web: null, n: {}, log: [] };
const NS_GAP = { graukind: 1500, spinneab: 1500, blitznah: 1100, netzgesicht: 900, vogelbusch: 600, dosen: 700, tuerzu: 800, flasche: 900, glasbruch: 1000, kratzen: 800 }; // Mindestabstand je Familie in s (Regie SP_GAP)
if (typeof SP_GAP !== 'undefined') Object.assign(SP_GAP, NS_GAP);
const ns_fwd = () => (typeof schreck_fwd === 'function' ? schreck_fwd() : (() => { const d = new THREE.Vector3(); camera.getWorldDirection(d); d.y = 0; return d.normalize(); })());
function ns_ruhig() {
  if (typeof schreck_ok === 'function' && !schreck_ok()) return false;
  if (typeof SPN_S !== 'undefined' && SPN_S.active) return false;
  if (typeof spannung_traurig === 'function' && spannung_traurig()) return false;
  if (typeof SP !== 'undefined') { if (SP.stress > .4 || SP.chase || SP.t < SP.hushUntil || (SP.atem && SP.atem.offen) || SP.t - SP.peak < 100) return false; }
  if (Math.hypot(vel.x, vel.z) > 3.6) return false; // rennen: keine feinen Momente
  return true;
}
const ns_innen = () => !state.inBasement && !!indoorRect();
// ---------------------------------------------------------------- Spinne seilt sich vor deinem Gesicht ab
function ns_spinneBereit() { return typeof spiders !== 'undefined' && spiders && spiders.geometry && spiders.material; }
function ns_spinneStart() {
  const P = player.pos, f = ns_fwd(), cx = P.x + f.x * .95, cz = P.z + f.z * .95, ey = P.y + 1.6, ceil = headCeiling(cx, ey, cz);
  if (!isFinite(ceil) || ceil < ey + .55 || ceil > ey + 2.0) return false; // Decke 55 cm … 2 m über den Augen, sonst nichts
  if (typeof tod_blockiert === 'function' && tod_blockiert(cx, P.y, cz, null, .25) > 0) return false; // Schrank, Wand oder Balken genau dort: nichts
  if (camera.rotation.x < -.3 || camera.rotation.x > .6) return false; // Blick zum Boden oder steil zur Decke: man sähe sie nicht kommen
  const g = spiders.geometry, m = new THREE.InstancedMesh(g, spiders.material, 1); m.userData.noCol = true; m.frustumCulled = false; const c = new THREE.Color(.72, .69, .64); m.setColorAt(0, c);
  const th = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -1, 0)]), new THREE.LineBasicMaterial({ color: 0xc9c7bd, transparent: true, opacity: .38 })); th.frustumCulled = false; th.userData.noCol = true;
  m.visible = false; scene.add(m, th);
  NS.spider = { m, th, x: cx, z: cz, ceil: ceil - .04, yEye: ey - .08, t: 0, ph: 'fall', size: rand(1.6, 2.1), swing: rand(0, 6.28), exit: Math.random() < .35 ? 'floor' : 'up', y: ceil - .04, vy: 0, hang: rand(1.1, 1.7), run: 0, rx: 0, rz: 0, snd: false, ground: P.y };
  return true;
}
function ns_spinneTick(dt) {
  const S = NS.spider; if (!S) return; S.t += dt; S.age = (S.age || 0) + dt; const P = player.pos, m = S.m; if (typeof SPN_U !== 'undefined') SPN_U.uT.value += dt; let x = S.x, z = S.z, y = S.y, sw = 0;
  if (S.ph === 'fall') { // Fall an der Fadenseide: beschleunigt, kurz vor Augenhöhe weich abgefangen (der Faden spannt sich)
    if (!S.snd) { S.snd = true; ns_faden(); } S.vy -= 9 * dt; S.y += S.vy * dt; y = S.y; const rest = S.yEye;
    if (S.y <= rest + .22 && S.vy < 0) { S.vy *= Math.max(0, 1 - dt * 14); }
    if (S.y <= rest) { S.y = rest; y = rest; S.ph = 'hang'; S.t = 0; S.vy = 0; S.dip = .3; ns_schreck(); } }
  else if (S.ph === 'hang') { const k = S.t, sp = Math.exp(-k * 1.6) * (1 - Math.exp(-k * 12)); y = S.yEye + Math.sin(k * 7) * .06 * Math.exp(-k * 2.2) + Math.sin(k * 1.7) * .012; sw = Math.sin(k * 2.6 + S.swing) * .05 * sp;
    const d = Math.hypot(P.x - S.x, P.z - S.z), toward = vel.x * (S.x - P.x) + vel.z * (S.z - P.z);
    if (S.t > S.hang || d < .55 || (toward > 0 && d < .9)) { S.ph = S.exit === 'floor' || d < .7 ? 'drop' : 'up'; S.t = 0; S.vy = 0; if (S.ph === 'up') ns_faden(true); } }
  else if (S.ph === 'up') { S.vy += 14 * dt; S.y += S.vy * dt; y = S.y; if (S.y >= S.ceil) { ns_spinneEnde(); return; } } // zieht sich schnell an den Faden hinauf
  else if (S.ph === 'drop') { S.vy -= 9.8 * dt; S.y += S.vy * dt; y = S.y; const fl = S.ground + .03; if (S.y <= fl) { S.y = y = fl; S.ph = 'run'; S.t = 0; S.run = 1; const a = Math.atan2(S.z - P.z, S.x - P.x) + rand(-.6, .6); S.rx = Math.cos(a); S.rz = Math.sin(a); S.th.visible = false;
      Audio.play(Audio.pick('stepC2', 'stepC4'), { gain: .12, rate: 1.7, x: S.x, y: S.ground + .05, z: S.z, ref: 1.5 }); } }
  else if (S.ph === 'run') { const sp = S.stop ? 0 : 1.7 * Math.min(1, S.t * 3); S.x += S.rx * sp * dt; S.z += S.rz * sp * dt; x = S.x; z = S.z; y = S.ground + .03; if (S.t > 1.6) { ns_spinneEnde(); return; } if (!S.stop && colliders.some(c => c.top > .1 && S.x > c.minX - .1 && S.x < c.maxX + .1 && S.z > c.minZ - .1 && S.z < c.maxZ + .1)) { S.stop = true; S.t = Math.max(S.t, 1.15); } } // 08.10.: an der Wand nicht plötzlich weg, sondern kurz stehen und im Dunkeln verschwinden (Verkleinern) // läuft weg, bis eine Wand/Kante kommt
  // Darstellung
  const dx = P.x - x, dz = P.z - z, th = Math.atan2(-dz, dx), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, th, S.ph === 'run' ? 0 : .35 + sw * 2, 'YXZ')), kin = Math.min(1, S.age / .45), kout = S.ph === 'up' ? Math.max(0, Math.min(1, (S.ceil - S.y) / .4)) : S.ph === 'run' ? Math.max(0, Math.min(1, (1.6 - S.t) / .45)) : 1, sk = (kin * kin * (3 - 2 * kin)) * (kout * kout * (3 - 2 * kout)), s = S.size * (S.ph === 'run' ? .8 : 1) * Math.max(.001, sk); // 08.10.: taucht aus dem Deckenspalt auf / verschwindet im Spalt bzw. im Dunkeln (Verkleinern, organisch)
  const px = x + (S.ph === 'hang' ? Math.cos(th + 1.57) * sw : 0), pz = z + (S.ph === 'hang' ? -Math.sin(th + 1.57) * sw : 0), mat = new THREE.Matrix4().compose(new THREE.Vector3(px, S.ph === 'run' ? y : y - .06 * s, pz), q, new THREE.Vector3(s, s, s));
  m.setMatrixAt(0, mat); m.instanceMatrix.needsUpdate = true; m.visible = true;
  S.th.material.opacity = .38 * sk; if (S.th.visible) { const a = S.th.geometry.attributes.position; a.setXYZ(0, px, S.ceil, pz); a.setXYZ(1, px, y + .02 * s, pz); a.needsUpdate = true; S.th.geometry.computeBoundingSphere(); }
}
function ns_spinneEnde() { const S = NS.spider; if (!S) return; scene.remove(S.m, S.th); S.th.geometry.dispose(); S.th.material.dispose(); if (S.m.dispose) S.m.dispose(); NS.spider = null; }
function ns_faden(up) { const A = Audio; if (!A.ctx) return; const ctx = A.ctx, n = A.noise(false), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = up ? 7200 : 5200; n.connect(hp); A.env(hp, up ? .05 : .075, .004, up ? .16 : .26); n.stop(ctx.currentTime + .6); } // Seidenfaden: hohes, feines Zischen
function ns_schreck() { shake = Math.max(shake, .012); FEEL.dipV += .3; try { Audio.heart(); } catch (e) {} if (!NS.n.spGedanke && typeof gedanke === 'function' && Math.random() < .6) { NS.n.spGedanke = 1; setTimeout(() => gedanke('ns_spinne', 'Direkt vor meinem Gesicht. Hat sie eben noch an der Decke gesessen?', 4200, 2), 1300); } }
// ---------------------------------------------------------------- naher Donnerschlag
async function ns_blitzNah() {
  const rM = rand(45, 120); dir.lightT = Math.max(dir.lightT, rand(45, 80)); // kein zweiter Blitz gleich danach
  Audio.thunder(rM / 343, 1); const seq = flashSeq(1);
  for (const [v, ms] of seq) { skyMat.uniforms.flash.value = v; lightBoost = v; await wait(ms); }
  shake = Math.max(shake, .02); glitchV = Math.max(glitchV, .12);
}
// ---------------------------------------------------------------- Spinnweben im Gesicht
function ns_netzBild() {
  if (NS.webImg) return NS.webImg; const W = 1024, H = 1024, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d');
  const ln = (a, b, w, al) => { x.strokeStyle = `rgba(228,226,216,${al})`; x.lineWidth = w; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); };
  for (let k = 0; k < 3; k++) { // drei Fadenknäuel mit Speichen und Spiralfäden
    const cx = rand(250, 780), cy = rand(200, 700), R = rand(260, 420), n = 9 + Math.floor(rand(0, 6)), ang = [], rad = [];
    for (let i = 0; i < n; i++) { ang.push(rand(0, 6.28)); rad.push(R * rand(.55, 1.1)); }
    for (let i = 0; i < n; i++) ln([cx, cy], [cx + Math.cos(ang[i]) * rad[i], cy + Math.sin(ang[i]) * rad[i]], rand(.8, 1.8), rand(.18, .4));
    const ord = ang.map((a, i) => i).sort((p, q) => ang[p] - ang[q]);
    for (let r = .18; r < 1; r += rand(.1, .16)) for (let i = 0; i < n; i++) { const a = ord[i], b = ord[(i + 1) % n], pa = [cx + Math.cos(ang[a]) * rad[a] * r, cy + Math.sin(ang[a]) * rad[a] * r], pb = [cx + Math.cos(ang[b]) * rad[b] * r, cy + Math.sin(ang[b]) * rad[b] * r];
      const mx = (pa[0] + pb[0]) / 2 + rand(-6, 6), my = (pa[1] + pb[1]) / 2 + rand(-6, 6) + 7; x.strokeStyle = `rgba(228,226,216,${rand(.12, .3)})`; x.lineWidth = rand(.6, 1.2); x.beginPath(); x.moveTo(pa[0], pa[1]); x.quadraticCurveTo(mx, my, pb[0], pb[1]); x.stroke(); } }
  for (let i = 0; i < 26; i++) { const a = [rand(0, W), rand(0, H)], b = [a[0] + rand(-180, 180), a[1] + rand(-180, 180)]; ln(a, b, rand(.5, 1.4), rand(.1, .32)); }
  for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(210,208,196,${rand(.1, .45)})`; x.beginPath(); x.arc(rand(0, W), rand(0, H), rand(.8, 2.4), 0, 6.28); x.fill(); } // Staubflocken
  return NS.webImg = cv.toDataURL('image/png'); }
function ns_netz() {
  // 10.10.: kein flaches Netz-Overlay vor dem Bild mehr (Nutzer: keine Overlays) – nur Stoffgeräusch, Zucken und Gedanke
  shake = Math.max(shake, .012); FEEL.dipV += .22;
  if (Audio.ctx) { try { Audio.play('cloth1', { gain: .22, rate: rand(1.2, 1.5), hp: 900 }); } catch (e) {} const A = Audio, n = A.noise(false), hp = A.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200; n.connect(hp); A.env(hp, .045, .01, .3); n.stop(A.ctx.currentTime + .6); }
  if (!NS.n.netzG && typeof gedanke === 'function' && Math.random() < .5) { NS.n.netzG = 1; setTimeout(() => gedanke('ns_netz', 'Spinnweben. Lange hat hier keiner mehr gelüftet. Oder: jemand hat sich Mühe gegeben, dass es so aussieht.', 5200, 2), 2400); }
}
// ---------------------------------------------------------------- Vogel bricht aus dem Busch
function ns_busch() { // ein echter Busch (weiche Kollision) 2,2 … 5,5 m seitlich/vor dem Spieler
  const P = player.pos, f = ns_fwd(), best = []; for (const it of solidNear(P.x, P.z)) { if (!it.soft || !solidLive(it)) continue; const cx = (it.bb.min.x + it.bb.max.x) / 2, cz = (it.bb.min.z + it.bb.max.z) / 2, d = Math.hypot(cx - P.x, cz - P.z); if (d < 2.2 || d > 5.5 || it.bb.max.y < .5) continue;
    const c = ((cx - P.x) * f.x + (cz - P.z) * f.z) / d; if (c < -.2) continue; best.push([cx, cz, it.bb.max.y, d]); }
  return best.length ? best[Math.floor(Math.random() * best.length)] : null; }
function ns_vogel(b) {
  const [bx, bz, by] = b, P = player.pos, ax = bx - P.x, az = bz - P.z, al = Math.hypot(ax, az) || 1, ux = ax / al, uz = az / al, A = Audio;
  A.busch(bx, bz, 1); setTimeout(() => A.busch(bx, bz, .8), 140);
  setTimeout(() => { for (let i = 0; i < 4; i++) setTimeout(() => A.flap(bx + ux * (i * 1.4), by + i * 1.0, bz + uz * (i * 1.4)), i * 85);
    const v = kl_pick && kl_pick('fx_vogel_', 3); if (v) A.play(v, { gain: .55, vary: .1, x: bx + ux * 2, y: by + 1.5, z: bz + uz * 2, ref: 3 }); else A.caw(bx + ux * 2, by + 2, bz + uz * 2);
    shake = Math.max(shake, .01); FEEL.dipV += .18; }, 380); }
// ---------------------------------------------------------------- Dose/Mülleimer kippt hinter dir
function ns_dose() {
  const P = player.pos, f = ns_fwd(), a = rand(-1.2, 1.2), d = rand(5, 7.5), x = P.x - f.x * d - f.z * Math.sin(a) * d * .5, z = P.z - f.z * d + f.x * Math.sin(a) * d * .5, A = Audio;
  A.play(A.pick('metalHit1', 'metalHit2'), { gain: .85, rate: rand(.85, 1.05), x, y: .3, z, ref: 6 }); setTimeout(() => A.play('metalHit2', { gain: .4, rate: rand(1.1, 1.3), x: x + rand(-.6, .6), y: .1, z: z + rand(-.6, .6), ref: 5 }), rand(380, 520)); setTimeout(() => A.play('metalHit1', { gain: .2, rate: 1.5, x: x + rand(-1.2, 1.2), y: .1, z: z + rand(-1.2, 1.2), ref: 4 }), rand(900, 1200));
  shake = Math.max(shake, .008); FEEL.dipV += .12;
  if (Math.random() < .5 && typeof gedanke === 'function' && !NS.n.dosenG) { NS.n.dosenG = 1; setTimeout(() => gedanke('ns_dose', 'Eine Katze. Bestimmt eine Katze.', 3600, 2), 2200); } }
// ---------------------------------------------------------------- Tür fällt im Haus zu
function ns_tuer() {
  const P = player.pos, r = indoorRect(), f = ns_fwd(); let x = P.x - f.x * 7, z = P.z - f.z * 7; if (r) { x = Math.max(r.x0 + .5, Math.min(r.x1 - .5, x)); z = Math.max(r.zb + .5, Math.min(r.zf - .5, z)); }
  Audio.slam(x, 1.2, z); setTimeout(() => Audio.creak(.12, x, 1.2, z), 700); shake = Math.max(shake, .012); FEEL.dipV += .18; }
// ---------------------------------------------------------------- Flasche rollt im Wind über die Straße
function ns_flasche() {
  const P = player.pos, f = ns_fwd(), A = Audio, s = Math.random() < .5 ? 1 : -1, d0 = rand(7, 9), x0 = P.x - f.x * d0 - f.z * s * 6, z0 = P.z - f.z * d0 + f.x * s * 6, vx = f.z * s * 1.9 + f.x * .5, vz = -f.x * s * 1.9 + f.z * .5; let i = 0, t = 0;
  const step = () => { t += 1; const k = Math.min(1, t / 14), x = x0 + vx * t * .42, z = z0 + vz * t * .42; A.play(A.pick('glass1', 'glass1'), { gain: .09 + .08 * Math.sin(k * 3), rate: rand(.55, .75) + k * .12, hp: 900, x, y: .1, z, ref: 4 });
    if (t < 15) setTimeout(step, 150 + (1 - k) * 170 + rand(-30, 30)); else { A.play('glass1', { gain: .32, rate: rand(1.1, 1.3), x, y: .1, z, ref: 4 }); setTimeout(() => A.play('glass1', { gain: .12, rate: 1.6, x: x + .3, y: .1, z, ref: 4 }), 260); } }; step(); }
// ---------------------------------------------------------------- Glas bricht im Nebenraum
function ns_glas() {
  const P = player.pos, r = indoorRect(), f = ns_fwd(); let x = P.x - f.x * 6.5 + rand(-1.5, 1.5), z = P.z - f.z * 6.5 + rand(-1.5, 1.5); if (r) { x = Math.max(r.x0 + .4, Math.min(r.x1 - .4, x)); z = Math.max(r.zb + .4, Math.min(r.zf - .4, z)); }
  const A = Audio; A.play('glass1', { gain: .7, rate: rand(.9, 1.05), x, y: .6, z, ref: 5 }); setTimeout(() => A.play('glass1', { gain: .3, rate: rand(1.3, 1.6), x: x + rand(-.3, .3), y: .1, z: z + rand(-.3, .3), ref: 4 }), rand(160, 260));
  setTimeout(() => A.play('glass1', { gain: .12, rate: 1.9, x, y: .1, z, ref: 3 }), 640); shake = Math.max(shake, .008); FEEL.dipV += .12; }
// ---------------------------------------------------------------- Kratzen in der Wand, das plötzlich aufhört
function ns_kratzen() {
  const P = player.pos, f = ns_fwd(), s = Math.random() < .5 ? 1 : -1, x = P.x + f.x * 1.2 - f.z * s * 1.4, z = P.z + f.z * 1.2 + f.x * s * 1.4, A = Audio; let n = 0; const max = 9 + Math.floor(rand(0, 4));
  const tick = () => { n++; A.play('scrape1', { gain: .07 + .016 * n, rate: rand(1.8, 2.4), x, y: .5 + (n % 3) * .25, z, ref: 1.5, dur: rand(.12, .3) }); if (n < max) setTimeout(tick, Math.max(110, 420 - n * 36) + rand(-40, 40)); else setTimeout(() => { A.play('woodHit1', { gain: .09, rate: 1.7, x, y: .5, z, ref: 1.5 }); }, 520); }; tick(); }
// ---------------------------------------------------------------- Graues Kind steht plötzlich hinter dir (Kap. 3–5, selten)
// Es erscheint 6,5–8,5 m hinter Luke (außerhalb des Bildes, also ohne Poppen). Dreht sich Luke um, steht es still und sieht ihn ohne Gesicht an; leises Zählen, Stille.
// Es verschwindet, sobald Luke wegsieht oder die Augen schließt (sofort, nur außerhalb des Bildes) bzw. nach 3–5 s Ansehen / bei Annäherung (weich über auftritt.js).
const GK = { g: null, ph: null, t: 0, cnt: 0, building: false, hold: 0 };
function ns_gkBau() { if (GK.g || GK.building || typeof figuren_embody !== 'function') return; GK.building = true; const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; scene.add(g);
  figuren_embody(g, 'graue', { clip: 'idle' }).then(P => { if (P) { P.obj.traverse(o => { if (o.isMesh && /eye|cornea|iris|pupil|sclera|lash|brow/i.test((o.name || '') + ' ' + [].concat(o.material).map(m => m && m.name || '').join(' '))) o.visible = false; }); GK.g = g; } GK.building = false; }).catch(e => { GK.building = false; console.warn('Graukind hinter dir', e); }); }
function ns_gkStart() {
  if (!GK.g) { ns_gkBau(); return false; } if (GK.ph) return false;
  const P = player.pos, f = ns_fwd();
  for (let i = 0; i < 14; i++) { const a = Math.atan2(-f.x, -f.z) + rand(-.45, .45), d = rand(6.5, 8.5), x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d;
    if (typeof tod_blockiert === 'function' && (tod_blockiert(x, P.y, z, null, .5) > 0 || tod_blockiert((x + P.x) / 2, P.y, (z + P.z) / 2, null, .3) > 0)) continue;
    if (colliders.some(c => c.top > .1 && x > c.minX - .6 && x < c.maxX + .6 && z > c.minZ - .6 && z < c.maxZ + .6)) continue;
    if (typeof auftritt_imBild === 'function' && auftritt_imBild(x, P.y + 1, z, .8, .2, false)) continue; // nur außerhalb des Bildes einblenden
    GK.g.position.set(x, P.y, z); GK.g.rotation.set(0, Math.atan2(P.x - x, P.z - z), 0); GK.g.visible = true; GK.ph = 'wait'; GK.t = 0; GK.cnt = 2; return true; }
  return false; }
function ns_gkEnde() { if (GK.g) GK.g.visible = false; GK.ph = null; }
function ns_gkTick(dt) {
  if (!GK.ph || !GK.g) return; const P = player.pos, g = GK.g, f = ns_fwd(), dx = g.position.x - P.x, dz = g.position.z - P.z, d = Math.hypot(dx, dz) || 1, dot = (dx * f.x + dz * f.z) / d; GK.t += dt;
  if (GK.ph === 'wait') { if (GK.t > 40 || d > 18 || state.talking || (typeof schreck_ok === 'function' && !schreck_ok())) { ns_gkEnde(); return; }
    if (dot > .78 && d > 4) { GK.ph = 'seen'; GK.t = 0; GK.hold = rand(3.2, 5); GK.cnt = 1.2; GK.away = 0; if (typeof spannung_hush === 'function') spannung_hush(GK.hold + 2, .12); } return; }
  GK.cnt -= dt; if (GK.cnt <= 0 && Audio.whisper) { GK.cnt = rand(2, 2.8); Audio.whisper(g.position.x, 1, g.position.z, 1.3); }
  const zu = typeof augenzu_zu === 'function' && augenzu_zu(); GK.away = dot < .55 ? GK.away + dt : 0;
  if (zu || GK.away > .25) { ns_gkEnde(); return; }            // Wegsehen / Blinzeln: weg, ohne dass man es sieht
  if (GK.t > GK.hold || d < 3.6 || state.talking) { ns_gkEnde(); }  // sonst weich (Auftritt blendet aus, solange es im Bild ist)
}
// ---------------------------------------------------------------- Auswahl
const NS_M = [
  { id: 'graukindHinten', fam: 'graukind', w: 2, ok: () => { const k = typeof kap === 'function' ? kap() : 1; if (k < 3 || k > 5) return false; ns_gkBau(); return !!GK.g && !GK.ph && !ns_innen() && !state.inBasement && NS.t > 600; }, run: () => ns_gkStart() },
  { id: 'spinneAb', fam: 'spinneab', w: 3, ok: () => ns_innen() && NS.indoorT > 20 && ns_spinneBereit() && !NS.spider && !!indoorRect() && Math.hypot(vel.x, vel.z) > .5, run: () => ns_spinneStart() },
  { id: 'blitzNah', fam: 'blitznah', w: 2, ok: () => !state.inBasement && dir.lightT > 14 && (typeof nat === 'undefined' || !nat.calm || nat.calm < 1), run: () => { ns_blitzNah(); return true; } },
  { id: 'netzGesicht', fam: 'netzgesicht', w: 3, ok: () => ns_innen() && NS.indoorT > 12 && Math.hypot(vel.x, vel.z) > .6, run: () => { ns_netz(); return true; } },
  { id: 'vogelBusch', fam: 'vogelbusch', w: 3, ok: () => !ns_innen() && !state.inBasement && Math.hypot(vel.x, vel.z) > .5 && !!ns_busch(), run: () => { const b = ns_busch(); if (!b) return false; ns_vogel(b); return true; } },
  { id: 'dose', fam: 'dosen', w: 2, ok: () => !ns_innen() && !state.inBasement && Math.hypot(vel.x, vel.z) > .5, run: () => { ns_dose(); return true; } },
  { id: 'flasche', fam: 'flasche', w: 2, ok: () => !ns_innen() && !state.inBasement && Math.hypot(vel.x, vel.z) > .3 && (typeof state.zone === 'undefined' || state.zone !== 'canal') && Math.abs(player.pos.x) < 110 && Math.abs(player.pos.z) < 60, run: () => { ns_flasche(); return true; } },
  { id: 'glasBruch', fam: 'glasbruch', w: 2, ok: () => ns_innen() && NS.indoorT > 30, run: () => { ns_glas(); return true; } },
  { id: 'kratzen', fam: 'kratzen', w: 2, ok: () => ns_innen() && NS.indoorT > 15 && Math.hypot(vel.x, vel.z) < 1, run: () => { ns_kratzen(); return true; } },
  { id: 'tuerZu', fam: 'tuerzu', w: 2, ok: () => ns_innen() && NS.indoorT > 25 && (() => { const r = indoorRect(); return r && (r.x1 - r.x0) * (r.zf - r.zb) > 30; })(), run: () => { ns_tuer(); return true; } }];
if (typeof SP_GAP !== 'undefined') SP_GAP.tuerzu = SP_GAP.tuerzu || 800;
function ns_waehle() {
  const C = NS_M.filter(m => !NS.ids.slice(-2).includes(m.id) && m.ok() && (typeof spannung_can !== 'function' || spannung_can(m.fam, 'minor'))); if (!C.length) return null;
  let s = C.reduce((a, m) => a + m.w, 0), r = Math.random() * s; for (const m of C) { r -= m.w; if (r <= 0) return m; } return C[0]; }
WORLD_MODS.push(['Naturschreck', async () => {}]);
WORLD_TICK.push((dt, t) => {
  if (!state.started || menu.attract) return; ns_spinneTick(dt); ns_gkTick(dt); const inn = ns_innen(); if (inn) NS.indoorT += dt; else NS.indoorT = 0;
  NS.tick -= dt; if (NS.tick > 0) return; NS.tick = .5; NS.t += .5;
  if (NS.spider) return; if (!ns_ruhig()) return; NS.next -= .5; if (NS.next > 0) return;
  const m = ns_waehle(); if (!m) { NS.next = rand(15, 30); return; }
  if (m.run() === false) { NS.next = rand(8, 20); return; }
  if (typeof spannung_did === 'function') spannung_did(m.fam, 'minor'); if (typeof schreck_mark === 'function') schreck_mark(t); NS.ids.push(m.id); NS.log.push([Math.round(t), m.id]);
  const k = typeof kap === 'function' ? kap() : 1; NS.next = rand(300, 540) * (1 - .05 * Math.min(5, k - 1)); // spätere Kapitel etwas dichter
});
window.__ns = { S: NS, M: NS_M, busch: ns_busch, run: id => { const m = NS_M.find(x => x.id === id); return m ? m.run() : null; }, ruhig: ns_ruhig, gk: GK, gkStart: ns_gkStart }; // Testzugriff
