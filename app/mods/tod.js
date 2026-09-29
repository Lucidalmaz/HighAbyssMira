// =====================================================================  TOD (Modul „tod“): Sterben, Speicherpunkte, Wiederkehr
// Wo das Spiel tödlich ist, stirbt Luke sichtbar und hörbar – kein Schnitt ins Schwarze, sondern ein Körper, der nachgibt:
//   zombie     – der Zahn-Mann (Peter Kranz) packt das Gesicht, sagt „Bruder.“, reißt dich zu Boden, beißt. Ton dumpf, Herz hört auf.
//   rauch      – Rauchvergiftung: die Knie geben nach, die Kamera kippt seitlich auf den Boden, das Bild läuft zu.
//   gezaehlte  – die Gezählten (Kapitel 3): viele kleine Hände ziehen dich nach hinten hinunter.
// Danach der Todesbildschirm im Stil des Spiels (verkohltes Holz, Messing, getrocknetes Blut) und „Vom letzten Speicherpunkt fortsetzen“.
// Speicherpunkte: Kapitelanfänge, vor dem langen Gang, Flucht vor dem Rauch (Modul feuer), Messraum, vor den Gezählten.
// Jeder Speicherpunkt schreibt auch den Spielstand (saveGame) – in Kapitel 2 samt Fortschritt im Amt, damit „Weiterspielen“ dort weitermacht.
// Wiederkehr im laufenden Spiel: die Welt bleibt, wie sie ist (gelöste Rätsel, aufgehobene Dinge); nur die Gefahr wird zurückgesetzt (TOD_RESET).
const tod_S = { cp: null, dying: false, deaths: 0, anim: null, lp: null, pending: null, el: {}, seen: {}, vig0: 1, ca0: .012 };
const TOD_RESET = []; // (cpId, kind) => … – Module setzen ihre Gefahr zurück (feuer: Fass, Öl, Feuer, Rauch)
const TOD_LINES = {
  zombie: ['„Bruder“, sagt er. Mit einem Mund, der dafür nicht gemacht ist.', 'Er hat dich festgehalten, bis du aufgehört hast, dich zu wehren.', 'Seine Hände waren warm. Das war das Schlimmste.'],
  rauch: ['Irgendwo hinter dem Rauch war kalte Luft. Du hast sie nicht mehr gefunden.', 'Der Rauch war schneller als du.', 'Du hast nur kurz die Augen zugemacht.'],
  gezaehlte: ['Kleine, kalte Hände. So viele. Sie haben dich mitgezählt.', 'Sie haben dich nach unten gezogen. Einer hat gekichert.'],
  feuer: ['Die Hitze war eine Wand. Du bist trotzdem hineingegangen.'],
};
// ---------------------------------------------------------------- Aussehen (Todesbildschirm, Blut, Speicherpunkt-Anzeige)
{
  const css = document.createElement('style');
  css.textContent = `
  #todBlood { position: fixed; inset: 0; pointer-events: none; opacity: 0; background-size: cover; background-position: center; mix-blend-mode: multiply; }
  #todRed { position: fixed; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(ellipse 65% 60% at 50% 50%, rgba(90,0,0,0) 30%, rgba(90,4,2,.55) 70%, rgba(20,0,0,.95) 100%); }
  #todScreen { position: fixed; inset: 0; z-index: 57; display: none; align-items: center; justify-content: center; flex-direction: column; text-align: center; cursor: default;
    background: radial-gradient(ellipse 55% 50% at 50% 46%, rgba(40,6,4,.55), rgba(0,0,0,.97) 72%), #000; opacity: 0; transition: opacity 1.6s; }
  #todScreen.show { display: flex; } #todScreen.on { opacity: 1; }
  #todScreen .tt { font: 600 13px "Cormorant Garamond", Georgia, serif; letter-spacing: .6em; text-indent: .6em; color: var(--gold2, #8a6f45); margin-bottom: 18px; opacity: 0; transition: opacity 2s .4s; }
  #todScreen h1 { margin: 0; font: 400 clamp(38px, 5.4vw, 74px) "Cormorant Garamond", Georgia, serif; letter-spacing: .22em; text-indent: .22em; color: #b3261a;
    text-shadow: 0 0 28px rgba(160,20,10,.45), 0 2px 0 #1a0302; opacity: 0; transform: scale(1.04); filter: blur(6px); transition: opacity 2.4s .2s, transform 3s .2s, filter 2.4s .2s; }
  #todScreen .orn { width: 300px; height: 14px; margin: 24px auto 20px; background: var(--orn); opacity: 0; transition: opacity 2s 1s; }
  #todScreen .line { max-width: min(640px, 80vw); font: italic 22px/1.5 "Cormorant Garamond", Georgia, serif; color: #d9cdb2; opacity: 0; transition: opacity 2s 1.3s; }
  #todScreen .cp { margin-top: 34px; font: 12px "Special Elite", monospace; letter-spacing: .18em; color: #8e8169; opacity: 0; transition: opacity 1.6s 2s; }
  #todScreen .btns { margin-top: 18px; display: flex; gap: 18px; opacity: 0; transition: opacity 1.4s 2.2s; pointer-events: none; }
  #todScreen.on .tt, #todScreen.on h1, #todScreen.on .orn, #todScreen.on .line, #todScreen.on .cp, #todScreen.on .btns { opacity: 1; } #todScreen.on h1 { transform: none; filter: none; } #todScreen.on .btns { pointer-events: auto; }
  #todScreen button { position: relative; background: linear-gradient(180deg, rgba(201,163,106,.07), rgba(0,0,0,.25)); border: 1px solid rgba(201,163,106,.38); color: #e2d6b8; font: 600 13px "Cormorant Garamond", Georgia, serif;
    letter-spacing: .38em; text-indent: .38em; padding: 13px 30px; cursor: pointer; transition: all .25s; }
  #todScreen button:hover, #todScreen button:focus-visible { color: #fff4dc; border-color: var(--gold, #c9a36a); background: linear-gradient(180deg, rgba(201,163,106,.18), rgba(60,10,6,.3)); box-shadow: 0 0 22px rgba(201,163,106,.18); outline: none; }
  #todScreen button.sec { border-color: rgba(201,163,106,.18); color: #9a8c72; }
  #todScreen .keys { margin-top: 16px; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .4em; color: #6d6352; opacity: 0; transition: opacity 1.4s 2.6s; } #todScreen.on .keys { opacity: 1; }
  #todCp { position: absolute; right: 34px; bottom: 70px; display: flex; align-items: center; gap: 12px; opacity: 0; transform: translateY(6px); transition: opacity .8s, transform .8s; text-align: right; }
  #todCp.show { opacity: 1; transform: none; }
  #todCp i { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--gold, #c9a36a); border-top-color: transparent; animation: todSpin 1.4s linear infinite; box-shadow: 0 0 10px rgba(201,163,106,.3); }
  #todCp b { display: block; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .5em; color: var(--gold, #c9a36a); text-shadow: 0 0 2px #000, 0 0 8px #000; }
  #todCp span { display: block; font: 12px "Special Elite", monospace; letter-spacing: .08em; color: #cfc2a6; text-shadow: 0 0 2px #000, 0 0 8px #000; margin-top: 2px; }
  @keyframes todSpin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(css);
  const mk = (id, parent, before) => { const d = document.createElement('div'); d.id = id; if (before) parent.insertBefore(d, before); else parent.appendChild(d); return d; };
  const hud = document.getElementById('hud');
  tod_S.el.blood = mk('todBlood', document.body, hud); tod_S.el.red = mk('todRed', document.body, hud);
  tod_S.el.cp = mk('todCp', hud); tod_S.el.cp.innerHTML = '<div><b>SPEICHERPUNKT</b><span></span></div><i></i>';
  const scr = tod_S.el.screen = mk('todScreen', document.body);
  scr.innerHTML = '<div class="tt">HIGH ABYSS MIRA</div><h1>DU BIST GESTORBEN</h1><div class="orn"></div><div class="line"></div><div class="cp"></div>'
    + '<div class="btns"><button class="go">VOM LETZTEN SPEICHERPUNKT FORTSETZEN</button><button class="sec menu">HAUPTMENÜ</button></div><div class="keys">E · ENTER — FORTSETZEN</div>';
  scr.querySelector('.go').onclick = e => { e.stopPropagation(); todRespawn(); };
  scr.querySelector('.menu').onclick = e => { e.stopPropagation(); location.reload(); };
  // Blutspritzer: einmal auf eine Leinwand gemalt (Ränder dicht, Mitte frei)
  try { const c = document.createElement('canvas'); c.width = 960; c.height = 540; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 960, 540);
    const drop = (px, py, r, a) => { const g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, `rgba(95,6,4,${a})`); g.addColorStop(.7, `rgba(120,10,6,${a * .8})`); g.addColorStop(1, 'rgba(140,20,10,0)'); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); };
    for (let i = 0; i < 260; i++) { const a = Math.random() * 6.283, d = .55 + Math.random() * .6, px = 480 + Math.cos(a) * 560 * d, py = 270 + Math.sin(a) * 330 * d; drop(px, py, 4 + Math.random() * (d > .9 ? 70 : 26), .5 + Math.random() * .5); }
    for (let i = 0; i < 26; i++) { let px = Math.random() * 960, py = Math.random() < .5 ? Math.random() * 90 : 450 + Math.random() * 90; const w = 3 + Math.random() * 6; for (let k = 0; k < 40; k++) { drop(px, py, w, .7); py += 3 + Math.random() * 3; px += (Math.random() - .5) * 2; } }
    tod_S.el.blood.style.backgroundImage = `url(${c.toDataURL('image/jpeg', .8)})`; } catch (e) {}
}
addEventListener('keydown', e => { if (ui.overlay === 'todScreen' && tod_S.el.screen.classList.contains('on') && !e.repeat && (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space')) { e.preventDefault(); todRespawn(); } });

// ---------------------------------------------------------------- Speicherpunkte
// opts: { label, x, y, z, yaw, respawn: async fn, persist: false|true, quiet }
function todCheckpoint(id, label, opts = {}) {
  const P = player.pos, cp = { id, label, chapter: curChapter(), x: opts.x ?? P.x, y: opts.y ?? P.y, z: opts.z ?? P.z, yaw: opts.yaw ?? player.yaw, respawn: opts.respawn || null, persist: opts.persist !== false };
  tod_S.cp = cp; if (cp.persist) tod_S.persistCp = { id: cp.id, label, chapter: cp.chapter, x: cp.x, y: cp.y, z: cp.z, yaw: cp.yaw };
  try { saveGame(cp.chapter); } catch (e) {}
  if (!opts.quiet) todCpShow(label);
  return cp;
}
function todCpShow(label) { const el = tod_S.el.cp; el.querySelector('span').textContent = trX(label); el.classList.add('show'); clearTimeout(tod_S.cpT); tod_S.cpT = setTimeout(() => el.classList.remove('show'), 3200); }
// Fortschritt im Amt (Kapitel 2) für den Spielstand
function tod_ch2Snap() { return { a: !!ch2.archiveSolved, k: !!ch2.fuseKey, p: !!ch2.power, s: ch2.spiderPhase === 'gone', c: ch2.chase === 'done', r: ch2.read ? [...ch2.read] : [] }; }
function tod_ch2Apply(p) {
  if (!p) return;
  if (p.r && p.r.length) { ch2.read = new Set(p.r); ch2.boardHint = p.r.length >= 3; }
  ch2.archiveSeen = true;
  if (p.a && !ch2.archiveSolved) { ch2.archiveSolved = true; ch2.slots = ORDER.slice(); drawBoard(); archiveDrawer.position.z += .45; ch2.boardHint = true; }
  if (p.k || p.a) { ch2.fuseKey = true; fuseDoor.locked = false; if (!story.items.includes('fuse')) story.items.push('fuse'); }
  if (p.p && !ch2.power) { ch2.power = true; ch2.coverOpen = true; ch2.fuses = ch2.fuses.map(() => true); try { fuseLedUpdate(); } catch (e) {} spiderDoorIn.locked = false; spiderDoorIn.lockedText = ''; c2Lights.forEach(L => { L.k = 1; }); }
  if (p.s && ch2.spiderPhase !== 'gone') { ch2.spiderPhase = 'gone'; spiderDoorOut.locked = false; cocoon.scale.set(1, .6, 1); cocoon.material.color.set(0x8a8478); }
  if (p.c) { ch2.chase = 'done'; chaseDoor.shut = true; chaseDoor.set(false); chaseDoor.locked = true; ch2.tankSeen = false; }
}
MOD_SAVE.push(['tod', () => ({ cp: tod_S.persistCp || null, ch2: ch2.on ? tod_ch2Snap() : null, deaths: tod_S.deaths }), v => { tod_S.deaths = v.deaths || 0; tod_S.pending = v.cp ? v : null; }]);
// Weiterspielen in Kapitel 2: nach dem Kapitelstart den Fortschritt im Amt wiederherstellen und an den Speicherpunkt gehen
CH2_BEGIN.push(() => {
  const v = tod_S.pending; tod_S.pending = null;
  setTimeout(() => {
    if (v && v.cp && v.cp.chapter === 2 && v.ch2) {
      try { tod_ch2Apply(v.ch2); } catch (e) { console.warn('Speicherpunkt Amt', e); }
      const c = v.cp; if (c.id !== 'kapitel2') { player.pos.set(c.x, c.y, c.z); player.yaw = c.yaw; player.pitch = 0; vel.set(0, 0, 0); camY = c.y + 1.65; }
      tod_S.seen.k2 = true; tod_S.seen.gang = c.id === 'gang' || c.id === 'messraum' || c.id === 'flucht'; tod_S.seen.mess = c.id === 'messraum';
      if (c.id === 'gang' || c.id === 'flucht') setC2Objective('Die östliche Stahltür ist frei. Geh weiter.'); else if (c.id === 'messraum') setC2Objective('Der Messraum. Hier ist es passiert.');
      todCheckpoint(c.id === 'flucht' ? 'gang' : c.id, c.label, { quiet: true, x: c.x, y: c.y, z: c.z, yaw: c.yaw });
    } else { tod_S.seen.k2 = true; todCheckpoint('kapitel2', 'Kapitel 2 · Das achte Kind', { quiet: true }); }
  }, 0);
});

// ---------------------------------------------------------------- Sterben
function todMuffle(freq, sec = .5) {
  const A = Audio; if (!A.ctx || !A.out) return;
  if (!tod_S.lp) { try { const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 22000; lp.Q.value = .5; A.out.disconnect(); A.out.connect(lp); lp.connect(A.ctx.destination); tod_S.lp = lp; } catch (e) { return; } }
  const f = tod_S.lp.frequency, t = A.ctx.currentTime; f.cancelScheduledValues(t); f.setValueAtTime(f.value, t); f.exponentialRampToValueAtTime(Math.max(60, freq), t + Math.max(.05, sec));
}
// Einzelne Klänge (synthetisch – keine Aufnahme nötig)
const TOD_SND = {
  thud(v = 1) { const A = Audio; if (!A.ctx) return; const o = A.osc('sine', 90, 0, .6); o.frequency.exponentialRampToValueAtTime(34, A.ctx.currentTime + .3); A.env(o, .9 * v, .003, .45); const n = A.noise(false), lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; n.connect(lp); A.env(lp, .5 * v, .002, .18); n.stop(A.ctx.currentTime + .5); },
  bite() { const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime; for (let k = 0; k < 3; k++) { const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(700, 1500); bp.Q.value = 2.2; n.connect(bp); A.env(bp, .55, .002, rand(.05, .11), k * rand(.03, .07)); n.stop(t + .6); }
    A.play('woodCrack', { gain: .5, rate: rand(1.3, 1.7), lp: 1800, dur: .25 }); const o = A.osc('sawtooth', 70, 0, .3), lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 240; o.connect(lp); A.env(lp, .35, .01, .2); },
  cough(v = 1) { const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime, n = Math.random() < .5 ? 2 : 3;
    for (let k = 0; k < n; k++) { const d = k * rand(.2, .28); const s = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(650, 1100); bp.Q.value = .9; s.connect(bp); A.env(bp, .5 * v, .012, .16, d); s.stop(t + d + .5);
      const o = A.osc('sawtooth', rand(120, 160), d, .22), f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 3; o.frequency.setValueAtTime(rand(150, 175), t + d); o.frequency.exponentialRampToValueAtTime(95, t + d + .2); o.connect(f); A.env(f, .16 * v, .01, .18, d); } },
  gasp(v = .6) { const A = Audio; if (!A.ctx) return; const s = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; const t = A.ctx.currentTime; bp.frequency.setValueAtTime(900, t); bp.frequency.linearRampToValueAtTime(1800, t + .5); s.connect(bp); A.env(bp, .22 * v, .25, .35); s.stop(t + 1); },
  ring(on) { const A = Audio; if (!A.ctx) return; if (on && !tod_S.ring) { const o = A.ctx.createOscillator(); o.frequency.value = 3950; const g = A.ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(.022, A.ctx.currentTime + 2.5); o.connect(g); g.connect(A.ctx.destination); o.start(); tod_S.ring = { o, g }; }
    else if (!on && tod_S.ring) { const r = tod_S.ring; tod_S.ring = null; r.g.gain.setTargetAtTime(0, A.ctx.currentTime, .3); setTimeout(() => { try { r.o.stop(); } catch (e) {} }, 1500); } },
};
// Kamera während des Sterbens: aus der Blickhöhe im Moment des Todes, per Kurve je Art
const _todF = new THREE.Vector3();
function todCam(cam, dt) {
  const A = tod_S.anim; if (!A) return; A.t += dt; const t = A.t, B = A.base;
  const cur = (A.curve || (() => ({})))(t) || {}, h = cur.h ?? 1.65, sh = cur.shake || 0;
  _todF.set(-Math.sin(B.yaw), 0, -Math.cos(B.yaw));
  const back = cur.back || 0, side = cur.side || 0;
  cam.position.set(B.x - _todF.x * back + _todF.z * side + (Math.random() - .5) * sh, B.fy + h + (Math.random() - .5) * sh, B.z - _todF.z * back - _todF.x * side + (Math.random() - .5) * sh);
  cam.rotation.set((cur.pitch ?? B.pitch) + (Math.random() - .5) * sh * .6, B.yaw + (cur.yaw || 0), (cur.roll || 0) + (Math.random() - .5) * sh * .4, 'YXZ');
  if (A.onFrame) A.onFrame(t, dt);
}
const tod_ease = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k), tod_in = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k, tod_lerp = (a, b, k) => a + (b - a) * k;
// Die Arten zu sterben: Kamerakurve + Ablauf (Klänge, Figuren, Untertitel). Rückgabe: Dauer bis Schwarz (ms)
const TOD_ANIM = {
  zombie(A) {
    const Zm = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; if (Zm) Zm.mx.timeScale = 0;
    const B = A.base; ch2.chase = 'caught'; zombie.g.visible = true;
    const f = { x: -Math.sin(B.yaw), z: -Math.cos(B.yaw) }, zx = B.x + f.x * .62, zz = B.z + f.z * .62;
    zombie.g.position.set(zx, B.fy, zz); zombie.g.rotation.set(0, Math.atan2(B.x - zx, B.z - zz) - PI / 2, 0); zombie.arms.forEach(a => a.rotation.z = -1.9);
    Audio.scareSound('growl'); Audio.groan(zx, zz, true); glitchV = .6; shake = 0;
    A.curve = t => {
      if (t < .25) { const k = tod_ease(t / .25); return { h: 1.65 - .05 * k, back: .12 * k, pitch: tod_lerp(B.pitch, .08, k), shake: .06 }; }
      if (t < 1.75) return { h: 1.6, back: .12, pitch: .08 + Math.sin(t * 9) * .01, shake: .012, roll: Math.sin(t * 3) * .02 };
      if (t < 2.55) { const k = tod_in((t - 1.75) / .8); return { h: 1.6 - 1.32 * k, back: .12 + .5 * k, pitch: .08 + .8 * k, roll: .38 * k, shake: .02 + .05 * k }; }
      const bitePulse = [2.9, 3.35, 3.85, 4.3].reduce((s, b) => s + Math.max(0, 1 - Math.abs(t - b) * 7), 0);
      return { h: .28, back: .62, pitch: .88 + Math.sin(t * 2) * .03, roll: .38 + Math.sin(t * 1.3) * .04, shake: .012 + bitePulse * .09 };
    };
    A.onFrame = t => {
      const k = tod_in(Math.min(1, Math.max(0, (t - 1.75) / .8)));
      const px = B.x - f.x * .62 * k, pz = B.z - f.z * .62 * k; // der Körper folgt dir nach unten und beugt sich über dich
      zombie.g.position.set(tod_lerp(zx, px + f.x * .55, k), B.fy, tod_lerp(zz, pz + f.z * .55, k)); zombie.g.rotation.z = -1.05 * k + (t > 2.6 ? Math.sin(t * 13) * .05 : 0);
      tod_S.el.blood.style.opacity = Math.min(1, Math.max(0, (t - 2.55) / 1.4)); tod_S.el.red.style.opacity = Math.min(1, Math.max(0, (t - 2.2) / 2));
    };
    // Knochen nach dem Animations-Mixer (im Tick): Arme greifen nach dem Gesicht, der Kopf senkt sich über dich
    A.bones = t => { if (!Zm || !Zm.b) return; const k = tod_in(Math.min(1, Math.max(0, (t - 1.75) / .8))); Zm.zm.getWorldQuaternion(_tdq2); _tax.set(1, 0, 0).applyQuaternion(_tdq2);
      tod_bend(Zm.b.upperarm_l, _tax, -.45); tod_bend(Zm.b.upperarm_r, _tax, -.35); tod_bend(Zm.b.lowerarm_l, _tax, -.5); tod_bend(Zm.b.lowerarm_r, _tax, -.5); tod_bend(Zm.b.neck_01, _tax, .3 * k + (t > 2.7 ? Math.sin(t * 14) * .12 : 0)); tod_bend(Zm.b.head, _tax, .25 * k); };
    setTimeout(() => subtitle('<i>„Bruder.“</i>', 1500), 650);
    setTimeout(() => { Audio.groan(zx, zz, true); }, 1300);
    setTimeout(() => { TOD_SND.thud(1.2); Audio.play('woodFall1', { gain: .6, rate: .7 }); }, 2550);
    [2900, 3350, 3850, 4300].forEach((ms, i) => setTimeout(() => { TOD_SND.bite(); if (i === 0) todMuffle(900, .6); }, ms));
    setTimeout(() => todMuffle(260, 1.5), 3900);
    [2700, 3450, 4400, 5700].forEach(ms => setTimeout(() => Audio.heart(), ms));
    return 6400;
  },
  rauch(A) {
    const B = A.base, side = Math.random() < .5 ? -1 : 1;
    A.curve = t => {
      if (t < 1) { const k = tod_ease(t); return { h: 1.65 - .7 * k + Math.sin(t * 12) * .02 * (1 - k), pitch: tod_lerp(B.pitch, -.38, k), roll: side * .12 * k, shake: .01 }; }
      if (t < 2.6) { const s = t - 1; return { h: .95 + Math.sin(s * 2.1) * .03, pitch: -.38 - .15 * Math.sin(s * 1.3), roll: side * (.12 + Math.sin(s * 1.7) * .05), yaw: Math.sin(s * .9) * .08, shake: .004 }; }
      if (t < 3.5) { const k = tod_in((t - 2.6) / .9); return { h: .95 - .72 * k, pitch: tod_lerp(-.45, -.05, k), roll: side * tod_lerp(.15, 1.38, k), yaw: .08 * k, side: side * .35 * k, shake: .004 }; }
      return { h: .23, pitch: -.05, roll: side * 1.38, yaw: .08, side: side * .35, shake: t < 3.7 ? .03 : .002 };
    };
    A.onFrame = t => { filmPass.uniforms.vig.value = Math.max(filmPass.uniforms.vig.value, tod_lerp(1.6, 3.6, Math.min(1, t / 5))); renderer.domElement.style.filter = `blur(${Math.min(5, 1.5 + t * .7).toFixed(2)}px)`; };
    [0, 700, 1500, 2300].forEach((ms, i) => setTimeout(() => TOD_SND.cough(1 - i * .2), ms)); setTimeout(() => TOD_SND.gasp(.5), 2900);
    setTimeout(() => { TOD_SND.thud(.7); todMuffle(500, 1); TOD_SND.ring(true); }, 3500);
    [1200, 2300, 3600, 5000, 6700].forEach(ms => setTimeout(() => Audio.heart(), ms));
    setTimeout(() => todMuffle(180, 2), 4800);
    return 7200;
  },
  gezaehlte(A) {
    const B = A.base, list = typeof counted !== 'undefined' ? counted : [], f = { x: -Math.sin(B.yaw), z: -Math.cos(B.yaw) };
    Audio.scareSound('scream'); glitchV = 1;
    A.curve = t => { if (t < .7) { const k = tod_in(t / .7); return { h: 1.65 - 1.4 * k, back: .9 * k, pitch: tod_lerp(B.pitch, .7, k), roll: -.3 * k, shake: .05 }; }
      return { h: .25, back: .9, pitch: .7 + Math.sin(t * 3) * .05, roll: -.3 + Math.sin(t * 2) * .05, shake: .01 + (Math.sin(t * 17) > .7 ? .05 : 0) }; };
    const ring = list.slice(0, 5); ring.forEach((c, i) => { const a = Math.atan2(f.x, f.z) + (i - 2) * .55; c.f.visible = true; c.x = B.x - f.x * .9 + Math.sin(a) * .9; c.z = B.z - f.z * .9 + Math.cos(a) * .9; c.f.position.set(c.x, 0, c.z); c.f.lookAt(B.x - f.x * .9, 0, B.z - f.z * .9); c.f.rotation.x = .5; });
    for (let i = 0; i < 6; i++) setTimeout(() => { Audio.giggle(B.x + rand(-1, 1), .6, B.z + rand(-1, 1)); Audio.whisper(B.x + rand(-1, 1), .5, B.z + rand(-1, 1), 1.2); }, 300 + i * 450);
    setTimeout(() => { TOD_SND.thud(.9); todMuffle(700, .8); }, 700); setTimeout(() => todMuffle(220, 1.6), 2400);
    A.onFrame = t => { tod_S.el.red.style.opacity = Math.min(.8, t / 3); };
    [900, 1900, 3200].forEach(ms => setTimeout(() => Audio.heart(), ms));
    return 4200;
  },
};
TOD_ANIM.feuer = TOD_ANIM.rauch;
const _tpw = new THREE.Quaternion(), _tbw = new THREE.Quaternion(), _tdq = new THREE.Quaternion(), _tdq2 = new THREE.Quaternion(), _tax = new THREE.Vector3();
function tod_bend(b, axis, ang) { if (!b || !b.parent) return; b.parent.getWorldQuaternion(_tpw); b.getWorldQuaternion(_tbw); _tdq.setFromAxisAngle(axis, ang); b.quaternion.copy(_tpw.invert().multiply(_tdq).multiply(_tbw)); }
async function todDie(kind = 'zombie', opts = {}) {
  const S = tod_S; if (S.dying) return; S.dying = true; S.deaths++; S.kind = kind;
  state.talking = true; setScripted(() => true); vel.set(0, 0, 0);
  S.vig0 = filmPass.uniforms.vig.value; S.ca0 = filmPass.uniforms.ca.value; $('subtitle').style.opacity = 0;
  const base = { x: player.pos.x, fy: player.pos.y, z: player.pos.z, yaw: player.yaw, pitch: player.pitch };
  S.anim = { kind, t: 0, base, ...opts }; let dur = 4000;
  try { dur = (TOD_ANIM[kind] || TOD_ANIM.zombie)(S.anim); } catch (e) { console.warn('Tod', e); }
  setCamOverride(todCam); const tok = S.tok = (S.tok || 0) + 1;
  await wait(Math.max(0, dur - 1400)); if (tok !== S.tok || !S.dying) return; await fade(1, 1400); TOD_SND.ring(false);
  if (tok !== S.tok || !S.dying) return; todScreen(kind);
}
function todScreen(kind) {
  const S = tod_S, el = S.el.screen, L = TOD_LINES[kind] || TOD_LINES.zombie;
  el.querySelector('.line').textContent = trX(L[(S.deaths - 1) % L.length]);
  el.querySelector('.cp').textContent = S.cp ? trX('Letzter Speicherpunkt: ' + S.cp.label) : '';
  openOverlay('todScreen'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  Audio.stinger && Audio.stinger(false);
}
async function todRespawn() {
  const S = tod_S; if (!S.dying || S.respawning || !S.el.screen.classList.contains('show')) return; S.respawning = true; S.tok = (S.tok || 0) + 1;
  const el = S.el.screen; el.classList.remove('on'); $('fade').style.transition = 'none'; $('fade').style.opacity = 1;
  await wait(700); el.classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov');
  setCamOverride(null); setScripted(null); S.anim = null;
  filmPass.uniforms.vig.value = S.vig0; filmPass.uniforms.ca.value = S.ca0; renderer.domElement.style.filter = ''; S.el.blood.style.opacity = 0; S.el.red.style.opacity = 0; glitchV = 0; shake = 0;
  const Zm = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; if (Zm) Zm.mx.timeScale = 1;
  const cp = S.cp || { id: 'start', label: '', x: player.pos.x, y: 0, z: player.pos.z, yaw: player.yaw };
  // Gefahr zurücksetzen: der Zahn-Mann, dann die Module
  if (S.kind === 'zombie' || ch2.chase === 'caught') { zombie.g.visible = false; zombie.g.rotation.set(0, 0, 0); zombie.arms.forEach(a => a.rotation.z = -1.4); if (ch2.chase === 'caught') ch2.chase = 'idle'; gate.userData.holdT = 0; Audio.chaseMusic(false); }
  for (const f of TOD_RESET) { try { f(cp.id, S.kind); } catch (e) { console.warn('Wiederkehr', e); } }
  if (cp.respawn) { try { await cp.respawn(); } catch (e) { console.warn('Wiederkehr', e); } }
  else { player.pos.set(cp.x, cp.y, cp.z); player.yaw = cp.yaw; }
  player.pitch = 0; vel.set(0, 0, 0); camY = player.pos.y + 1.65; state.talking = false;
  todMuffle(22000, 1.2); lockPointer();
  await wait(500); S.dying = false; S.respawning = false; fade(0, 1600);
  if (cp.label) todCpShow(cp.label);
}
// ---------------------------------------------------------------- Tödliche Stellen im Grundspiel
// Kapitel 2: der Zahn-Mann fängt dich → Tod statt „Du kommst zu dir“
caught = async function () {
  if (ch2.chase !== 'run' && ch2.chase !== 'fire') return;
  ch2.caught++; Audio.chaseMusic(false); Audio.chaseLevel(0);
  await todDie('zombie');
};
// Kapitel 3: die Gezählten → Tod; Wiederkehr vor Nr. 7, die Jagd beginnt von vorn (wie bisher, nur ehrlich)
c3Caught = async function () {
  if (ch3.chase !== 'run') return; ch3.chase = 'caught'; ch3.caught++; Audio.chaseMusic(false);
  await todDie('gezaehlte');
};
TOD_RESET.push((id, kind) => {
  if (kind !== 'gezaehlte') return;
  counted.forEach(c => { c.f.visible = false; c.f.rotation.x = 0; });
});

WORLD_MODS.push(['Tod', async () => { window.__tod = { S: tod_S, die: todDie, respawn: todRespawn, checkpoint: todCheckpoint, reset: TOD_RESET, snap: tod_ch2Snap, apply: tod_ch2Apply }; }]);
WORLD_TICK.push((dt) => {
  try {
    const S = tod_S, P = player.pos, sn = S.seen;
    if (S.dying) { if (S.anim && S.anim.bones && zombie.g.visible) S.anim.bones(S.anim.t); return; }
    if (!state.started || menu.attract) return;
    // Speicherpunkte an Kapitelanfängen und vor gefährlichen Stellen (je einmal)
    if (!ch2.on && !ch3.on && !sn.k1) { sn.k1 = true; todCheckpoint('kapitel1', 'Kapitel 1 · Das Haus Nummer 7', { quiet: true }); }
    if (ch2.on && !sn.k2 && P.x > X - 5) { sn.k2 = true; todCheckpoint('kapitel2', 'Kapitel 2 · Das achte Kind'); }
    if (ch2.on && !sn.gang && ch2.spiderPhase === 'gone' && ch2.chase === 'idle' && P.x > X + 46.3 && P.x < X + 50 && Math.abs(P.z - Z) < 2) { sn.gang = true; todCheckpoint('gang', 'Der lange Gang', { x: X + 47.5, y: 0, z: Z, yaw: -PI / 2 }); }
    if (ch2.on && !sn.mess && ch2.chase === 'done' && P.x > X + 107.2 && P.x < X + 122) { sn.mess = true; todCheckpoint('messraum', 'Der Messraum', { x: X + 108.2, y: 0, z: Z, yaw: -PI / 2 }); }
    if (ch3.on && !sn.k3) { sn.k3 = true; sn.k2 = sn.gang = sn.mess = true; todCheckpoint('kapitel3', 'Kapitel 3 · Das Licht'); }
    if (ch3.on && ch3.chase === 'run' && !sn.c3) { sn.c3 = true;
      todCheckpoint('gezaehlte', 'Die Gezählten', { x: 29, y: 0, z: -4.6, yaw: PI / 2, persist: false, respawn: async () => { player.pos.set(29, 0, -4.6); player.yaw = PI / 2; setTimeout(() => { if (ch3.chase === 'caught') startC3Chase(); }, 2600); subtitle('Renn. Nicht stehen bleiben. Zum Licht.', 3600); } }); }
  } catch (e) { if (!tod_S.err) { tod_S.err = true; console.warn('Tod-Tick', e); } }
});
