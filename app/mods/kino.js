// =====================================================================  KINO (Modul „kino“): eine Kinosequenz nach jedem Kapitel (story_final.md, PK-F)
// Schnittstelle (produktion_welle2.md §1.2):
//   kino_play(id, opts?) → Promise, löst nach Ende/Überspringen auf.  id ∈ 'k1','k2','k3a','k3b','k3c','k4','k5','k6'
//   kino_def(id, shots, meta?) → registriert/überschreibt eine Sequenz (Tests) · kino_busy() → true während einer Sequenz
//   Nach dem Auflösen: HUD, Nebel, Kamera, Eingabe, Musik und Blickrichtung wie vorher – das Bild bleibt SCHWARZ (#fade = 1), denn jede Sequenz
//   endet auf Schwarz. Wer danach ins Spiel zurückkehrt, blendet selbst auf (fade(0, …)); opts.aufblenden = ms lässt kino_play selbst aufblenden.
// Machart wie der Prolog (traum.js): setCamOverride übernimmt die Kamera, body.cine blendet das HUD aus und fährt die Balken (#traumBars) ein,
// Untertitel über subtitle(), Karten auf Schwarz in eigenem Textfeld (Georgia, wie die Kapitel-Intros). Überspringen: Klick oder Leertaste
// (k2 und k5 erst nach 3 s). Einstellung: { from, to, look, lookTo, dur, fov, roll, lines: [[Text, Sprecher, s]], sfx: [[fn, s]], setup(), teardown(), tick() }.
// Regeln (REGELN.md, PK-F): keine Lichter anlegen oder entfernen – nur Intensitäten vorhandener, beim Laden angelegter Lichter (VLights, die Punktlicht-
// Reserve der Basis, die Taschenlampe); alle Requisiten, Figuren-Klone und Texturen entstehen beim Laden und sind bis zum Einsatz unsichtbar;
// im Takt keine Zuweisungen; nach jedem Schnitt PERF_CULL.t = 0; Luke nie von vorn (PK-0.6): man sieht nur seinen Lichtkegel, seinen Schatten, Lucys Hand in seiner.
const kino_S = { on: false, id: null, def: null, i: -1, sh: null, t: 0, T: 0, li: 0, si: 0, skip: false, ending: false, res: null, sv: null, opts: null, ready: false, prevCam: null,
  fig: {}, obj: {}, act: [], env: null, film: null, lit: [], flash: null, pose: { p: new THREE.Vector3(), q: new THREE.Quaternion(), ok: false },
  v: new THREE.Vector3(), w: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Color(), tex: {}, dbg: null, ev: [] };
const KINO = {};
function kino_def(id, shots, meta = {}) { KINO[id] = { id, shots, skipAfter: meta.skipAfter ?? 0, name: meta.name || id }; return KINO[id]; }
function kino_busy() { return kino_S.on; }
const kino_e = k => k * k * (3 - 2 * k); // weiche Kurve (PK-F)
const kino_V = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- Aussehen: Karte auf Schwarz, Untertitel über den Balken, Polaroid-Einblendung
function kino_css() {
  if (typeof traum_css === 'function') traum_css(); if (document.getElementById('kinoCss')) return;
  const s = document.createElement('style'); s.id = 'kinoCss';
  s.textContent = `body.cine.kino #hud { opacity: 1 !important; z-index: 9; } body.cine.kino #subtitle { bottom: 3.2vh; }
  body.kino #questPop, body.kino #fearVig, body.kino #perf { opacity: 0 !important; }
  body.kino.kinoNoSkip #traumSkip { opacity: 0 !important; }
  #kinoCard { position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; opacity: 0; transition: opacity 1.2s; }
  #kinoCard.on { opacity: 1; } #kinoCard p { margin: 0 0 12px; max-width: 760px; text-align: center; font: 22px/1.6 Georgia, serif; color: #d9cdb0; opacity: 0; transition: opacity 1.4s; }
  #kinoCard p.t { font-size: 12px; letter-spacing: .4em; color: #c9a36a; margin-bottom: 26px; } #kinoCard p.on { opacity: 1; }
  #kinoPola { position: fixed; left: 50%; top: 47%; width: min(40vh, 70vw); aspect-ratio: 256 / 310; z-index: 10; pointer-events: none; perspective: 1400px; opacity: 0; transition: opacity 1.1s;
    transform: translate(-50%, -50%); } #kinoPola.on { opacity: 1; }
  #kinoPola .in { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 1.6s cubic-bezier(.45,.05,.3,1); transform: rotateZ(-3deg) rotateY(0deg); }
  #kinoPola.flip .in { transform: rotateZ(2deg) rotateY(180deg); }
  #kinoPola canvas { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.8); filter: sepia(.12) contrast(1.02); }
  #kinoPola canvas.back { transform: rotateY(180deg); }`;
  document.head.appendChild(s);
  if (!document.getElementById('kinoCard')) { const c = document.createElement('div'); c.id = 'kinoCard'; document.body.appendChild(c); }
  if (!document.getElementById('kinoPola')) { const p = document.createElement('div'); p.id = 'kinoPola'; p.innerHTML = '<div class="in"></div>'; document.body.appendChild(p); }
}
function kino_card(lines) { const c = $('kinoCard'); if (!lines) { c.classList.remove('on'); return; }
  c.innerHTML = lines.map((l, i) => `<p class="${i === 0 ? 't' : ''}">${trX(l)}</p>`).join(''); c.classList.add('on');
  [...c.children].forEach((p, i) => kino_after(.35 + i * 1.1, () => p.classList.add('on'))); }
// Zeitgeber in Kinozeit (steht bei Pause still, verfällt beim Schnitt nicht – nur beim Ende)
function kino_after(sec, fn) { kino_S.ev.push([kino_S.T + sec, fn]); }

// ---------------------------------------------------------------- Klang (nur vorhandene Audio-Funktionen und Synth-Bausteine aus klang.js)
function kino_bus() { const A = Audio; if (!A.ctx) return null; if (!kino_S.bus) { const g = A.ctx.createGain(); g.gain.value = 1; g.connect(A.master); if (A.musSend) g.connect(A.musSend); kino_S.bus = g; } return kino_S.bus; }
function kino_atem(v = .09, rate = 1, x, y, z) { // ein Atemzug: gefiltertes Rauschen, ein – aus
  const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = A.noise(false), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 520 * rate; bp.Q.value = .8;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 1.1 / rate); g.gain.linearRampToValueAtTime(v * .15, t + 1.5 / rate); g.gain.linearRampToValueAtTime(v * .8, t + 2 / rate); g.gain.linearRampToValueAtTime(0, t + 3.2 / rate);
  n.connect(bp); bp.connect(g); g.connect(x !== undefined ? A.at(x, y, z, 1.2) : A.master); n.stop(t + 3.4 / rate); }
function kino_cello(notes, t0 = 0) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; const c = Audio.ctx; let t = c.currentTime + t0;
  for (const [n, d] of notes) { KI.bow(c, b, t, KN(n), d + .4, .05, 900); t += d; } }
function kino_box(notes, t0 = 0, v = .06) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; const c = Audio.ctx; let t = c.currentTime + t0;
  notes.forEach((n, i) => { KI.box(c, b, t, KN(n), v); t += .62 + i * .06; }); }
function kino_vogel(x, y, z, n = 3) { const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, y, z, 6); let t = c.currentTime + rand(0, .3); const f0 = rand(2600, 3600);
  for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0 * rand(.9, 1.1), t); o.frequency.exponentialRampToValueAtTime(f0 * rand(1.25, 1.5), t + .07); o.frequency.exponentialRampToValueAtTime(f0 * .8, t + .13);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .015); g.gain.exponentialRampToValueAtTime(.0005, t + .15); o.connect(g); g.connect(d); o.start(t); o.stop(t + .17); t += rand(.16, .32); } }
function kino_reh(x, y, z) { // ein Reh ruft – zu langsam
  const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, d = A.at(x, y, z, 14), o = c.createOscillator(), bp = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o.frequency.setValueAtTime(330, t); o.frequency.exponentialRampToValueAtTime(150, t + 2.6); bp.type = 'bandpass'; bp.frequency.value = 800; bp.Q.value = 1.4;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .45); g.gain.linearRampToValueAtTime(.1, t + 1.8); g.gain.exponentialRampToValueAtTime(.0005, t + 2.9); o.connect(bp); bp.connect(g); g.connect(d); o.start(t); o.stop(t + 3); }
function kino_kreide(x, y, z) { for (let i = 0; i < 3; i++) Audio.play(Audio.pick('scrape1', 'scrape3'), { gain: .16, rate: rand(2.4, 3), hp: 1800, dur: rand(.18, .3), delay: i * rand(.22, .34), x, y, z, ref: 1.5 }); }
function kino_stoff(v = .05) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = A.noise(false), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .6;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .25); g.gain.linearRampToValueAtTime(v * .4, t + .6); g.gain.linearRampToValueAtTime(v, t + .9); g.gain.linearRampToValueAtTime(0, t + 1.5); n.connect(bp); bp.connect(g); g.connect(A.master); n.stop(t + 1.6); }
function kino_glocke(v = .75) { if (typeof leben_bellStrike === 'function') leben_bellStrike(v, false); } // einzelne Schläge der Kapellenglocke – nie die ganze Folge 3 + 13 (die gehört P6)
function kino_still(on, sec = 1.2) { // Stille: Welt und Betten (Regen, Wind) weg – Musik ist während der Sequenz ohnehin aus
  const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime, sv = kino_S.sv; if (!sv) return;
  for (const [n, v0] of [[A.world, sv.world], [A.bedTrim, sv.bed]]) if (n) { n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value, t); n.gain.linearRampToValueAtTime(on ? 0 : v0, t + sec); } }
function kino_regen(k) { if (Audio.rain && Audio.ctx) Audio.rain.gain.setTargetAtTime(k, Audio.ctx.currentTime, 1); }

// ---------------------------------------------------------------- Umgebung: Morgengrauen u. Ä. (je Bild nach update() gesetzt, danach wie vorher)
const KINO_ENV = {
  dawn: { fog: [0x8a7f78, .024], sky: [0xc09a7e, 0x3a4c70, 1], hemi: [1.15, 0xa8b4cc, 0x40362c], moon: [.55, 0xffc9a0], exp: 1.12, envI: .5 },
  haze: { fog: [0x9a9088, .0075], sky: [0xcaa688, 0x4a5c80, 1], hemi: [1.25, 0xb0bcd0, 0x40362c], moon: [.6, 0xffcca4], exp: 1.12, envI: .5, far: 260 },
  white: { fog: [0xe8eaee, .05], sky: [0xf0f2f5, 0xf4f6f8, 1.4], hemi: [1.5, 0xffffff, 0xd8dade], moon: [0, 0xffffff], exp: 1.05, envI: .2 },
  vista: { fog: [0x0d1220, .011], far: 200 },
  keller: { basement: true },
};
function kino_envApply(E) { // beim Schnitt: Nebel/Himmel setzen (Takt hält die Lichter)
  const S = kino_S, sv = S.sv; S.env = E || null;
  scene.fog.color.setHex(E && E.fog ? E.fog[0] : sv.fogC); scene.fog.density = E && E.fog ? E.fog[1] : sv.fogD;
  const U = skyMat.uniforms; if (E && E.sky) { U.horizon.value.setHex(E.sky[0]); U.zenith.value.setHex(E.sky[1]); U.dim.value = E.sky[2]; } else { U.horizon.value.copy(sv.skyH); U.zenith.value.copy(sv.skyZ); U.dim.value = sv.skyDim; }
  if (E && E.fog) fogUniforms.color.value.setHex(E.fog[0]).multiplyScalar(1.3); else fogUniforms.color.value.copy(sv.gfC);
  hemi.color.copy(sv.hemiC); hemi.groundColor.copy(sv.hemiG); moon.color.copy(sv.moonC);
  if (E && E.hemi) { hemi.color.setHex(E.hemi[1]); hemi.groundColor.setHex(E.hemi[2]); } if (E && E.moon) moon.color.setHex(E.moon[1]);
  const far = E && E.far || sv.far; if (camera.far !== far) { camera.far = far; camera.updateProjectionMatrix(); }
  state.inBasement = E && E.basement !== undefined ? E.basement : sv.inB;
  if (E && E.basement !== undefined) indoorK = E.basement ? 1 : 0;
}
function kino_envTick() { const E = kino_S.env; if (!E) return;
  if (E.fog) { scene.fog.density = E.fog[1]; scene.fog.color.setHex(E.fog[0]); }
  if (E.hemi) hemi.intensity = E.hemi[0]; if (E.moon) moon.intensity = E.moon[0]; if (E.exp) renderer.toneMappingExposure = E.exp * settings.bright; if (E.envI !== undefined) scene.environmentIntensity = E.envI; }
function kino_film(F) { const S = kino_S, sv = S.sv, u = filmPass.uniforms; S.film = F || null;
  u.vig.value = F && F.vig !== undefined ? F.vig : sv.vig; u.ca.value = F && F.ca !== undefined ? F.ca : sv.ca; u.toe.value = F && F.toe !== undefined ? F.toe : sv.toe;
  const cv = renderer.domElement; cv.style.transition = 'filter .25s'; cv.style.filter = F && F.filter ? F.filter : sv.filter; }

// ---------------------------------------------------------------- Figuren (aus figuren_load geklont, beim Laden vorbereitet) und Requisiten
const KINO_SIL = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 1, metalness: 0 }); // Gegenlicht: dunkler Stoff, keine Gesichter
async function kino_mkFig(key, id) {
  try { const F = await figuren_load(id); if (!F) return null; const sk = await figuren_skc(), o = sk(F.scene); o.rotation.y = F.yaw || 0;
    const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; scene.add(g);
    const mats = []; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; mats.push([m, m.material]); } });
    const mx = new THREE.AnimationMixer(o), acts = {}; for (const [k, c] of Object.entries(F.clips)) acts[k] = mx.clipAction(c);
    const P = { key, id, g, obj: o, mx, acts, cur: null, mats, sil: false, doll: false, sit: false };
    kino_S.fig[key] = P; return P; } catch (e) { console.warn('Kino: Figur ' + id, e); return null; }
}
function kino_play_(P, k, ts = 1) { if (!P) return; const a = P.acts[k] || P.acts.idle; if (!a) return; if (P.cur === a) { a.timeScale = ts; return; } a.reset().play(); a.timeScale = ts; if (P.cur) { a.fadeIn(.35); P.cur.fadeOut(.35); } P.cur = a; }
function kino_sil(P, on) { if (!P || P.sil === on) return; P.sil = on; for (const [m, mat] of P.mats) m.material = on ? KINO_SIL : mat; }
// Figur zeigen: Ort, Blickrichtung (rad), Bewegung; sit = Sitzhöhe (Welt-y) wie figuren_seat
function kino_fig(key, x, y, z, ry, clip = 'idle', o = {}) { const P = kino_S.fig[key]; if (!P) return null; const g = P.g;
  g.position.set(x, y, z); g.rotation.set(o.rx || 0, ry, o.rz || 0); g.visible = true; kino_sil(P, !!o.sil);
  if (P.sit && !o.sit) { P.sit = false; P.obj.position.set(0, 0, 0); P.obj.scale.setScalar(1); }
  if (o.sit !== undefined) { g.updateMatrixWorld(true); if (typeof figuren_seat === 'function') { P.obj.position.set(0, 0, 0); figuren_seat({ g, obj: P.obj, mx: P.mx, doll: false, cur: P.cur, get sit() { return P.sit; }, set sit(v) { P.sit = v; } }, o.sit); P.cur = null; P.sit = true; } }
  else { kino_play_(P, clip, o.ts || 1); if (o.t0) P.mx.update(o.t0); }
  if (!kino_S.act.includes(P)) kino_S.act.push(P); return P; }
function kino_figOff(key) { const P = kino_S.fig[key]; if (!P) return; P.g.visible = false; kino_sil(P, false); const i = kino_S.act.indexOf(P); if (i >= 0) kino_S.act.splice(i, 1); }
function kino_obj(key, o) { o.visible = false; o.userData.noCol = true; o.traverse(m => { m.userData.noCol = true; }); scene.add(o); kino_S.obj[key] = o; return o; }
function kino_show(key, x, y, z, ry = 0) { const o = kino_S.obj[key]; if (!o) return null; if (x !== undefined) { o.position.set(x, y, z); o.rotation.y = ry; } o.visible = true; return o; }
function kino_hide(...keys) { for (const k of keys) { const o = kino_S.obj[k]; if (o) o.visible = false; } }
// Leuchtende Sprites (keine Lichter): Flamme, Schein – beim Laden angelegt
function kino_glowTex(kind) { return tex(cnv(128, (c, w) => { const g = c.createRadialGradient(w / 2, kind === 'flame' ? w * .62 : w / 2, 0, w / 2, kind === 'flame' ? w * .62 : w / 2, w / 2);
  if (kind === 'flame') { c.clearRect(0, 0, w, w); c.save(); c.translate(w / 2, w * .9); c.scale(.2, 1); const f = c.createRadialGradient(0, -w * .38, 0, 0, -w * .38, w * .5); f.addColorStop(0, 'rgba(255,255,255,1)'); f.addColorStop(.35, 'rgba(225,238,255,.85)'); f.addColorStop(.7, 'rgba(150,185,255,.25)'); f.addColorStop(1, 'rgba(120,160,255,0)');
    c.fillStyle = f; c.beginPath(); c.ellipse(0, -w * .38, w * .5, w * .45, 0, 0, 7); c.fill(); c.restore(); return; }
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }), true); }
function kino_sprite(key, texture, color, size, fog = true) { const m = new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog, opacity: 1 });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return kino_obj(key, s); }
// Papier-/Abdruck-Flächen (Decals erlaubt)
function kino_decal(key, canvas, w, h, o = {}) { const m = new THREE.MeshStandardMaterial({ map: tex(canvas, true), transparent: true, depthWrite: false, roughness: o.rough ?? .9, metalness: 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  polygonOffset: true, polygonOffsetFactor: -2, opacity: o.opacity ?? 1, color: o.color ?? 0xffffff });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; return kino_obj(key, p); }

// ---------------------------------------------------------------- Texturen (beim Laden gezeichnet)
function kino_tex_papa() { return cnv(512, (c, w) => { // Kinderzeichnung vor dem achten Stuhl: „PAPA + ICH“
  c.fillStyle = '#e9e1cc'; c.fillRect(0, 0, w, w); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(90,70,40,${rand(.01, .05)})`; c.fillRect(rand(0, w), rand(0, w), rand(1, 3), rand(1, 3)); }
  const cray = (col, lw, pts) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { c.globalAlpha = .45; c.beginPath(); pts.forEach(([x, y], i) => { const X = x + rand(-2, 2), Y = y + rand(-2, 2); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); } c.globalAlpha = 1; };
  const grey = '#55585e', pink = '#b04a60', yel = '#d8a820';
  cray(grey, 7, [[150, 128], [206, 128], [206, 190], [150, 190], [150, 128]]); cray('#222', 4, [[158, 158], [198, 158]]); // Helm mit Sehschlitz
  cray(grey, 8, [[178, 190], [178, 330]]); cray(grey, 7, [[130, 215], [226, 215]]); cray(grey, 7, [[178, 330], [148, 430]]); cray(grey, 7, [[178, 330], [210, 430]]);
  cray('#888', 5, [[130, 215], [118, 150]]); cray('#999', 4, [[112, 170], [112, 60]]); // Schwert
  cray(pink, 6, [[330, 250], [330, 330]]); c.fillStyle = 'rgba(176,74,96,.35)'; c.beginPath(); c.moveTo(330, 280); c.lineTo(290, 380); c.lineTo(370, 380); c.fill(); cray(pink, 5, [[330, 280], [290, 380], [370, 380], [330, 280]]);
  cray('#6a4a2a', 6, [[330, 226], [330, 226]]); c.strokeStyle = '#6a4a2a'; c.lineWidth = 5; c.beginPath(); c.arc(330, 228, 24, 0, 7); c.stroke();
  cray(pink, 5, [[306, 290], [226, 215]]); cray(pink, 5, [[312, 380], [305, 440]]); cray(pink, 5, [[350, 380], [356, 440]]); // Hand in Hand
  cray(yel, 5, [[420, 70], [420, 70]]); c.strokeStyle = yel; c.lineWidth = 5; c.beginPath(); c.arc(430, 80, 26, 0, 7); c.stroke(); for (let a = 0; a < 6.28; a += .8) cray(yel, 3, [[430 + Math.cos(a) * 34, 80 + Math.sin(a) * 34], [430 + Math.cos(a) * 48, 80 + Math.sin(a) * 48]]);
  c.fillStyle = '#b3261e'; c.font = 'bold 56px "Comic Sans MS", cursive'; c.save(); c.translate(70, 488); c.rotate(-.04); c.globalAlpha = .85; c.fillText('PAPA + ICH', 0, 0); c.restore(); }); }
function kino_tex_hand() { return cnv(128, (c, w) => { c.clearRect(0, 0, w, w); c.fillStyle = 'rgba(235,245,250,.55)'; c.filter = 'blur(2px)';
  c.beginPath(); c.ellipse(64, 84, 26, 30, 0, 0, 7); c.fill(); [[34, 48, 9, 26, -.5], [48, 30, 8, 30, -.15], [64, 24, 8, 32, 0], [80, 30, 8, 30, .15], [100, 60, 8, 22, .8]].forEach(([x, y, rx, ry, a]) => { c.beginPath(); c.ellipse(x, y, rx, ry, a, 0, 7); c.fill(); }); c.filter = 'none'; }); }
function kino_tex_shadow() { return cnv(256, (c, w) => { c.clearRect(0, 0, w, w); c.filter = 'blur(9px)'; c.fillStyle = 'rgba(0,0,0,.8)';
  c.beginPath(); c.ellipse(128, 84, 36, 44, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(40, 256); c.quadraticCurveTo(44, 150, 128, 134); c.quadraticCurveTo(212, 150, 216, 256); c.fill(); c.filter = 'none'; }); }
function kino_tex_wet() { return cnv(256, (c, w) => { c.clearRect(0, 0, w, w); const g = c.createRadialGradient(128, 128, 10, 128, 128, 124); g.addColorStop(0, 'rgba(20,24,30,.75)'); g.addColorStop(.7, 'rgba(20,24,30,.5)'); g.addColorStop(1, 'rgba(20,24,30,0)');
  c.fillStyle = g; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(128 + rand(-30, 30), 128 + rand(-30, 30), rand(60, 110), rand(50, 100), rand(0, 3), 0, 7); c.fill(); } }); }
function kino_tex_ring() { return cnv(256, (c, w) => { c.fillStyle = '#23231f'; c.fillRect(0, 0, w, w); for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(255,255,255,${rand(0, .06)})`; c.fillRect(rand(0, w), rand(0, w), 2, 2); }
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(w / 2, w / 2, w * .34, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#3a3830'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, w / 2, w * .36, 0, 7); c.stroke(); }); }
function kino_polaBack(text) { const c = document.createElement('canvas'); c.width = 256; c.height = 310; const x = c.getContext('2d'); x.fillStyle = '#e6dfcd'; x.fillRect(0, 0, 256, 310);
  for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(80,60,30,${rand(.01, .05)})`; x.fillRect(rand(0, 256), rand(0, 310), 2, 2); }
  x.fillStyle = 'rgba(60,60,70,.85)'; x.font = '44px Caveat, cursive'; x.save(); x.translate(128, 170); x.rotate(-.06); x.textAlign = 'center'; x.fillText(text, 0, 0); x.restore(); return c; }
// Ortstafel-Zusatzschild (strasse.js): aus der vorhandenen Textur ableiten – „210“ in Kreide (K1, bleibt), „ALLE“ in Kinderschrift (K3C, nur im Bild)
function kino_schild(which) { const S = kino_S; if (!S.zus) { const hits = []; scene.traverse(o => { if (o.isMesh && Array.isArray(o.material) && o.geometry && o.geometry.parameters && Math.abs(o.geometry.parameters.width - .72) < .01 && Math.abs(o.position.x + 72.28) < .05 && Math.abs(o.position.z - 6.3) < .05) hits.push(o); }); S.zus = hits[0] || null; }
  const Z = S.zus; if (!Z) return false; const face = Z.material.findIndex(m => m && m.map && m.map.image && m.map.image.width === 512); if (face < 0) return false;
  if (!S.zusOrig) S.zusOrig = Z.material[face].map;
  if (!S.tex.schild) S.tex.schild = {};
  const mk = (k, draw) => { if (S.tex.schild[k]) return S.tex.schild[k]; const src = S.zusOrig.image, c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); draw(x, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = S.zusOrig.colorSpace; t.anisotropy = 8; t.wrapS = S.zusOrig.wrapS; t.wrapT = S.zusOrig.wrapT; t.repeat.copy(S.zusOrig.repeat); t.offset.copy(S.zusOrig.offset); S.tex.schild[k] = t; return t; };
  const chalk = (x, n) => { x.save(); x.fillStyle = 'rgba(238,236,228,.93)'; x.font = '62px Caveat, cursive'; x.translate(318, 196); x.rotate(-.05); x.fillText(n, 0, 0); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${rand(.2, .7)})`; x.fillRect(rand(-4, 70), rand(-50, 6), rand(1, 3), rand(1, 2)); } x.restore(); };
  const t = which === '210' ? mk('210', x => chalk(x, '210')) : which === '21' ? mk('21', x => chalk(x, '21')) : which === '2' ? mk('2', x => chalk(x, '2'))
    : which === 'alle' ? mk('alle', x => { chalk(x, '210'); x.strokeStyle = 'rgba(120,20,20,.85)'; x.lineWidth = 7; x.beginPath(); x.moveTo(376, 170); x.lineTo(478, 150); x.moveTo(300, 178); x.lineTo(372, 160); x.stroke();
      x.fillStyle = 'rgba(40,60,160,.9)'; x.font = 'bold 58px "Comic Sans MS", cursive'; x.save(); x.translate(56, 204); x.rotate(.05); x.fillText('ALLE', 0, 0); x.restore(); }) : S.zusOrig;
  Z.material[face].map = t; Z.material[face].needsUpdate = true; S.schild = which; return true; }

// ---------------------------------------------------------------- Requisiten je Kapitel (im Hintergrund geladen, danach unsichtbar vorkompiliert)
const kino_ld = async (key, fn) => { try { return await fn(); } catch (e) { console.warn('Kino: ' + key, e); return null; } };
async function kino_lantern(key, lit) { const spec = { lantern: { b: 'lantern_and_bulb_lantern_BaseColor.1001.png', n: 'lantern_and_bulb_lantern_Normal.1001.jpg', r: 'lantern_and_bulb_lantern_Roughness.1001.jpg', m: 'lantern_and_bulb_lantern_Metallic.1001.jpg' }, buln: { b: 'lantern_and_bulb_buln_BaseColor.1001.png', rough: .2 } };
  const o = await msFBX('lantern1', 'model.fbx', spec); const g = msGround(msFit(o, .36, 'y')); g.traverse(m => { if (m.isMesh && m.material.name === 'buln') { m.material = m.material.clone(); m.material.emissive = new THREE.Color(lit ? 0xffb060 : 0); m.material.emissiveIntensity = lit ? 3 : 0; } }); kino_obj(key, g); }
const KINO_SETS = {
  k3: [['schwert', async () => { const T = THREE, S = kino_S, s = (await msModel('w_schwert', 'model.glb')).clone(true); msFit(s, 1.15, 'max'); const g = new T.Group(); const b = new T.Box3().setFromObject(s), c = b.getCenter(new T.Vector3()); s.position.sub(c); g.add(s);
      s.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); const sz = b.getSize(new T.Vector3()); S.swordAxis = sz.x > sz.y ? (sz.x > sz.z ? 'x' : 'z') : sz.y > sz.z ? 'y' : 'z'; kino_obj('schwert', g); }],
    ['laterneAus', () => kino_lantern('laterneAus', false)],
    ['wiese', async () => { const T = THREE, S = kino_S, W = new T.Group(), cx = X3 + 42, cz = Z3 + 46;
      const gm = msSurfMat('lawn1', { tint: 0xb8b8a8, rep: 18 }); const ground = new T.Mesh(new T.PlaneGeometry(70, 70), gm); ground.rotation.x = -PI / 2; ground.position.set(cx, .02, cz); ground.receiveShadow = true; W.add(ground);
      const bs = await msBake('w_birke', 'lod.glb'); let hB = 0; for (const p of bs) { p.geo.computeBoundingBox(); hB = Math.max(hB, p.geo.boundingBox.max.y); }
      const sc = hB > 0 ? 11 / hB : 1, L = []; for (const [dx, dz] of [[-6, 4], [-2.5, 8], [3, 6], [7, 10], [-9, 12], [0, 15], [5, 17], [-5, 19], [10, 20], [-12, 6], [12, 13], [2, 24], [-3, 29], [8, 28]]) L.push(msM4(cx + dx + rand(-.8, .8), 0, cz + dz + rand(-.8, .8), rand(0, 6.28), sc * rand(.85, 1.15)));
      for (const p of bs) { const m = new T.InstancedMesh(p.geo, p.mat, L.length); L.forEach((M, i) => m.setMatrixAt(i, M)); m.castShadow = true; m.receiveShadow = true; m.computeBoundingSphere(); m.userData.noCull = true; W.add(m); }
      const gr = await msBake('wildgrass1'); if (gr.length) { const G = []; for (let i = 0; i < 260; i++) G.push(msM4(cx + rand(-20, 20), 0, cz + rand(-6, 34), rand(0, 6.28), rand(.8, 1.3))); gr.forEach(p => { const m = new T.InstancedMesh(p.geo, p.mat, G.length); G.forEach((M, i) => m.setMatrixAt(i, M)); m.receiveShadow = true; m.computeBoundingSphere(); m.userData.noCull = true; W.add(m); }); }
      S.wiese = { cx, cz }; kino_obj('wiese', W); }],
    ['lampion', async () => { const T = THREE, o = await msFBX('w_papierlaterne', 'model.fbx', {}); const g = msGround(msFit(o, 14, 'y')); const mats = []; g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.material = [].concat(m.material).map(x => { const c = x.clone(); c.emissive = new T.Color(0xffc27a); c.emissiveIntensity = 1.6; if (c.map) c.emissiveMap = c.map; mats.push(c); return c; }); if (m.material.length === 1) m.material = m.material[0]; } }); kino_S.lampionMats = mats; kino_obj('lampion', g); }]],
  k5: [['hirsch', async () => { const S = kino_S, src = await msModel('wendigo', 'hirschding.glb'); const o = msGround(msFit(src.clone(true), 2.75, 'y')); o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; } });
      let head = null; o.traverse(b => { if (!head && b.isBone && /head/i.test(b.name)) head = b; }); S.hirschHead = head; S.hirschQ = head ? head.quaternion.clone() : null; kino_obj('hirsch', o); }]],
  k6: [['jacke', async () => { const o = await msFBX('w_jacke', 'model.fbx', { '*': { b: 'model.jpg', rough: .95 } }); const g = msGround(msFit(o, .62, 'y')); kino_obj('jacke', g); }]],
};
const KINO_SET_OF = { k3a: 'k3', k3b: 'k3', k3c: 'k3', k5: 'k5', k6: 'k6' };
function kino_preload(set) { const S = kino_S; S.sets = S.sets || {}; if (S.sets[set]) return S.sets[set];
  return S.sets[set] = (async () => { for (const [k, fn] of KINO_SETS[set] || []) { await kino_ld(k, fn); const o = S.obj[k]; if (o && renderer.compileAsync) { o.visible = true; try { await renderer.compileAsync(o, camera, scene); } catch (e) {} o.visible = false; } } })(); }

// ---------------------------------------------------------------- Laden: Figuren vorwärmen/klonen, Requisiten unsichtbar anlegen
WORLD_MODS.push(['Kino', async () => {
  kino_css(); const S = kino_S, T = THREE, t0 = performance.now(), lap = n => { S.loadT.push(n + ' ' + Math.round(performance.now() - t0)); }; S.loadT = [];
  // Figuren (figuren.js hat sie beim Laden schon geholt – hier nur klonen)
  const casts = [['lucy', 'lucy_erw'], ['hilde', 'hilde'], ['zayn', 'zayn'], ['mike', 'mike'], ['roxy', 'roxy'], ['junge', 'gezaehlt_j'], ['maedchen', 'gezaehlt_m'], ['frau', 'aydin'],
    ['kleine', 'kleine'], ['echt', 'luke_echt'], ['graue', 'graue'], ['kopie', 'luke']];
  if (typeof figuren_load === 'function') await Promise.all(casts.map(([k, id]) => kino_mkFig(k, id)));
  lap('figuren');
  // Rabe (eigener Klon von Whiskeys Scan: der echte Whiskey bleibt, wo er ist)
  try { const src = await msModel('animal_crow', 'model.glb'), sk = await figuren_skc(), m = sk(src); m.scale.setScalar(1.45);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.material = [].concat(o.material).map(x => { const c = x.clone(); c.color = (c.color || new T.Color(1, 1, 1)).clone().multiplyScalar(.55); c.roughness = .45; return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
    const g = new T.Group(); g.add(m); kino_obj('rabe', g); const mx = new T.AnimationMixer(m), A = {}; for (const c of src.animations || []) A[c.name.replace(/^.*\|/, '')] = mx.clipAction(c); S.rabe = { g, mx, A, cur: null, fl: null };
  } catch (e) { console.warn('Kino: Rabe', e); }
  const ld = kino_ld;
  // Sturmlaterne (lantern1, Vegas' Laterne, vom Ort ohnehin geladen): Lucy in K5
  await ld('laterne', () => kino_lantern('laterne', true));
  S.lucyLight = new VLight(0xffb060, 0, 7, 2); scene.add(S.lucyLight); // Laternenlicht K5 (beim Laden mit 0)
  S.rabeLight = new VLight(0xdfe9ff, 0, 7, 1.6); scene.add(S.rabeLight); // Whiskeys kaltes Licht K6
  S.coldLight = new VLight(0xdfe8ff, 0, 6, 2); scene.add(S.coldLight); // K1: das Kalte hinter der Kellerwand
  // Schwere Requisiten (Birkenwiese, Riesenlaterne, Hirschding, Jacke) erst im jeweiligen Kapitel im Hintergrund – spart Grafikspeicher (kino_preload)
  // Polaroid Zayn (K1): Bild nach oben, Rückseite Papier
  { const P = typeof PHOTOS !== 'undefined' ? PHOTOS.find(p => p.name === 'Zayn') : null, front = P && typeof polaroidCanvas === 'function' ? polaroidCanvas(P) : kino_polaBack('Zayn');
    const g = new T.Group(), mf = new T.MeshStandardMaterial({ map: tex(front, true), roughness: .55 }), mb = new T.MeshStandardMaterial({ map: tex(kino_polaBack(''), true), roughness: .8 });
    const a = new T.Mesh(new T.PlaneGeometry(.088, .107), mf), b = new T.Mesh(new T.PlaneGeometry(.088, .107), mb); a.rotation.x = -PI / 2; b.rotation.x = PI / 2; b.position.y = -.0005; a.receiveShadow = b.receiveShadow = true; g.add(a, b); kino_obj('pola', g); }
  // K1: nasse Stelle, wo Hilde stand · Staub im Keller · Kälte hinter der Wand
  { const w = kino_decal('nass', kino_tex_wet(), 2.4, 2.4, { rough: .05 }); w.material.roughness = .04; w.material.metalness = .1; w.rotation.x = -PI / 2; }
  { const N = 220, pos = new Float32Array(N * 3), seed = new Float32Array(N * 3); for (let i = 0; i < N; i++) { seed[i * 3] = rand(-3.6, 3.6); seed[i * 3 + 1] = rand(.1, 2.3); seed[i * 3 + 2] = rand(.2, 6); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); const m = new T.Points(geo, new T.PointsMaterial({ color: 0xbfc4c8, size: .012, transparent: true, opacity: .55, depthWrite: false }));
    m.frustumCulled = false; S.dust = { m, pos, seed, N }; kino_obj('staub', m); }
  // K2: Kinderzeichnung, Handabdruck innen am Glas, Schatten auf dem Glas, ein Haar, Wasseroberfläche, Kanalring
  { const d = kino_decal('papa', kino_tex_papa(), .42, .42, { rough: .95 }); d.rotation.x = -PI / 2; }
  kino_decal('hand', kino_tex_hand(), .2, .2, { rough: .1, ds: true });
  kino_decal('schatten', kino_tex_shadow(), 1.1, 1.1, { color: 0x000000, opacity: .75, ds: true }).material.blending = THREE.NormalBlending;
  { const h = new T.Mesh(new T.PlaneGeometry(.004, .24), new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: .6, side: T.DoubleSide })); kino_obj('haar', h); }
  { const w = new T.Mesh(new T.CircleGeometry(.86, 32), new T.MeshPhysicalMaterial({ color: 0x5f9a90, roughness: .04, metalness: 0, transparent: true, opacity: .45, side: T.DoubleSide })); w.rotation.x = -PI / 2; kino_obj('wasser', w); }
  { const r = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshStandardMaterial({ map: tex(kino_tex_ring(), true), transparent: true, alphaTest: .5, roughness: 1, side: T.DoubleSide })); r.rotation.x = -PI / 2; kino_obj('ring', r); }
  // Leuchten: kalte, kerzengerade Flamme (Villafenster), weißes Pulsieren (Schacht), Whiskeys Licht
  S.tex.flame = kino_glowTex('flame'); S.tex.glow = kino_glowTex('glow');
  kino_sprite('flamme', S.tex.flame, 0xe8f0ff, 1.1, false).scale.set(.32, .9, 1); kino_sprite('flammeSchein', S.tex.glow, 0x9fb8ff, 2.2, false);
  kino_sprite('puls', S.tex.glow, 0xf4f8ff, 30, false); kino_sprite('veranda', S.tex.glow, 0xffb060, 1.6, true); kino_sprite('lampe', S.tex.glow, 0xfff0d8, .9, true); kino_sprite('rabeSchein', S.tex.glow, 0xcfe0ff, 1.4, true);
  kino_defs(); S.ready = true; lap('fertig');
}]);

// Einmalige Aufnahme (beim ersten Start von k3b, solange das Bild noch schwarz ist – nie sichtbar gerendert): Blitzlicht über die Punktlicht-Reserve der Basis, danach alles zurück
function kino_foto2043() {
  const S = kino_S, cv = document.createElement('canvas'); cv.width = 256; cv.height = 310; const x = cv.getContext('2d'); x.fillStyle = '#ece6d6'; x.fillRect(0, 0, 256, 310);
  const G = S.fig.graue, K = S.fig.kopie, J = justin && justin.g; let ok = false;
  if (G && K && J && renderer) {
    const bx = X3 + 4.6, bz = Z3, jp = J.position.clone(), jr = J.rotation.y, jv = J.visible;
    J.position.set(bx, 0, bz + .15); J.rotation.y = -PI / 2; J.visible = true; if (justin.acts.idle) { justin.acts.idle.reset().play(); justin.mixer.update(1.2); }
    kino_fig('graue', bx - .7, 0, bz + .75, -PI / 2 + .25); G.mx.update(.8); kino_fig('kopie', bx - .75, 0, bz - .65, -PI / 2 - .2); K.mx.update(1.7);
    const cam = new THREE.PerspectiveCamera(34, 1, .05, 40); cam.position.set(X3 + .9, 1.25, Z3 + .1); cam.lookAt(bx - .3, .95, bz); cam.updateMatrixWorld();
    const pl = pointPool[0], p0 = pl.position.clone(), i0 = pl.intensity, d0 = pl.distance, c0 = pl.color.clone(); pl.position.set(X3 + 1.1, 1.5, Z3 + .4); pl.intensity = 9; pl.distance = 14; pl.color.setHex(0xfff4e6);
    const rt = new THREE.WebGLRenderTarget(320, 320, { type: THREE.UnsignedByteType }), px = new Uint8Array(320 * 320 * 4), fogD = scene.fog.density;
    scene.fog.density = .01; scene.updateMatrixWorld(true);
    try { renderer.setRenderTarget(rt); renderer.render(scene, cam); renderer.readRenderTargetPixels(rt, 0, 0, 320, 320, px); ok = true; } finally { renderer.setRenderTarget(null); rt.dispose(); scene.fog.density = fogD;
      pl.position.copy(p0); pl.intensity = i0; pl.distance = d0; pl.color.copy(c0); J.position.copy(jp); J.rotation.y = jr; J.visible = jv; kino_figOff('graue'); kino_figOff('kopie'); }
    if (ok) { const im = x.createImageData(320, 320), d = im.data, tm = v => { v = v / 255 * 1.35; v = v / (1 + v) * 1.55; return Math.round(255 * Math.min(1, Math.pow(Math.max(0, v), 1 / 2.2))); };
      for (let yy = 0; yy < 320; yy++) for (let xx = 0; xx < 320; xx++) { const s = ((319 - yy) * 320 + xx) * 4, o = (yy * 320 + xx) * 4; d[o] = tm(px[s]); d[o + 1] = tm(px[s + 1]); d[o + 2] = tm(px[s + 2]); d[o + 3] = 255; }
      const tmp = document.createElement('canvas'); tmp.width = tmp.height = 320; tmp.getContext('2d').putImageData(im, 0, 0); x.drawImage(tmp, 16, 16, 224, 224); }
  }
  if (!ok) { x.fillStyle = '#f0f0f2'; x.fillRect(16, 16, 224, 224); x.fillStyle = '#2b2b30'; x.fillRect(150, 70, 30, 150); x.fillStyle = '#8a8c90'; x.fillRect(80, 130, 20, 90); x.fillStyle = '#5a4030'; x.fillRect(110, 125, 22, 95); }
  const vg = x.createRadialGradient(128, 128, 70, 128, 128, 170); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(40,30,20,.35)'); x.fillStyle = vg; x.fillRect(16, 16, 224, 224);
  return { front: cv, back: kino_polaBack('2043') };
}

// ---------------------------------------------------------------- Abspielen
async function kino_play(id, opts = {}) {
  const S = kino_S, D = KINO[id]; if (!D) { console.warn('Kino: unbekannte Sequenz ' + id); return; } if (S.on) { console.warn('Kino: läuft schon (' + S.id + ')'); return; }
  kino_css(); $('subtitle').style.opacity = 0; if (typeof toastT !== 'undefined') { clearTimeout(toastT); $('toast').style.opacity = 0; } S.on = true; S.id = id; S.def = D; S.opts = opts; S.i = -1; S.sh = null; S.t = 0; S.T = 0; S.skip = false; S.ending = false; S.ev.length = 0; S.act.length = 0; S.lit.length = 0; S.flash = null; S.pose.ok = false;
  const A = Audio, fd = $('fade'), cv = renderer.domElement;
  S.sv = { cine: document.body.classList.contains('cine'), fogC: scene.fog.color.getHex(), fogD: scene.fog.density, skyH: skyMat.uniforms.horizon.value.clone(), skyZ: skyMat.uniforms.zenith.value.clone(), skyDim: skyMat.uniforms.dim.value,
    gfC: fogUniforms.color.value.clone(), hemiC: hemi.color.clone(), hemiG: hemi.groundColor.clone(), moonC: moon.color.clone(), vig: filmPass.uniforms.vig.value, ca: filmPass.uniforms.ca.value, toe: filmPass.uniforms.toe.value,
    filter: cv.style.filter, filterT: cv.style.transition, far: camera.far, near: camera.near, yaw: player.yaw, pitch: player.pitch, pos: player.pos.clone(), talking: state.talking, scripted, cam: camOverride, inB: state.inBasement, indoorK,
    fadeBg: fd.style.background || '#000', world: A.world ? A.world.gain.value : 1, bed: A.bedTrim ? A.bedTrim.gain.value : .5, sub: $('subtitle').style.opacity, glitch: glitchV };
  // Musik weicht: adaptive Musik (Zustand bleibt, nur leise), Betten bleiben
  if (A.mus && A.ctx) { const g = A.mus.duck.gain, t = A.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 1.6); }
  state.talking = true; setScripted(() => true); glitchV = 0; shake = 0;
  // Überspringen: Klick/Leertaste (k2/k5 erst nach 3 s)
  S.onKey = e => { if (!S.on) return; if (e.code === 'Space' || e.code === 'Escape' && false) { e.preventDefault(); kino_skip(); } };
  S.onClick = e => { if (!S.on || e.button !== 0) return; kino_skip(); };
  addEventListener('keydown', S.onKey, true); addEventListener('pointerdown', S.onClick, true);
  document.body.classList.add('cine', 'kino'); document.body.classList.toggle('kinoNoSkip', D.skipAfter > 0);
  if (+fd.style.opacity < .99) { fd.style.transition = 'opacity .7s'; fd.style.background = '#000'; fd.style.opacity = 1; await wait(750); }
  else { fd.style.background = '#000'; }
  if (KINO_SET_OF[id]) await kino_preload(KINO_SET_OF[id]);
  if (id === 'k3b' && !S.pola2043) { try { S.pola2043 = kino_foto2043(); } catch (e) { console.warn('Kino: Foto 2043', e); } await wait(60); }
  $('subtitle').style.opacity = 0; S.prevCam = camOverride; setCamOverride(kino_cam);
  const done = new Promise(r => { S.res = r; });
  kino_next(); if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
  await done;
}
function kino_skip() { const S = kino_S; if (!S.on || S.ending || S.skip) return; if (S.T < S.def.skipAfter) return; S.skip = true; }
function kino_next() {
  const S = kino_S, D = S.def; if (S.sh) { try { S.sh.teardown && S.sh.teardown(S.sh); } catch (e) { console.warn('Kino: Abbau', e); } }
  S.i++; S.t = 0; S.li = 0; S.si = 0; S.lit.length = 0; S.flash = null; const sh = S.sh = D.shots[S.i] || null; if (!sh) { kino_finish(false); return; }
  const fd = $('fade');
  // Zielbild: Schwarz (Karte), Weiß, oder Kamera
  if (sh.black || sh.card) { fd.style.transition = `opacity ${sh.fadeOut ?? 500}ms`; fd.style.background = '#000'; fd.style.opacity = 1; }
  else if (sh.white) { fd.style.transition = 'opacity 60ms'; fd.style.background = '#fff'; fd.style.opacity = 1; }
  else { fd.style.transition = `opacity ${sh.fadeIn ?? 0}ms`; fd.style.opacity = 0; }
  if (sh.card) kino_card(sh.card); else kino_card(null);
  kino_envApply(sh.env ? (typeof sh.env === 'string' ? KINO_ENV[sh.env] : sh.env) : null); kino_film(sh.film || null);
  if (camera.fov !== (sh.fov || fov)) { camera.fov = sh.fov || fov; camera.updateProjectionMatrix(); }
  sh._from = sh.from ? kino_V(...(typeof sh.from === 'function' ? sh.from(sh) : sh.from)) : null; sh._to = sh.to ? kino_V(...(typeof sh.to === 'function' ? sh.to(sh) : sh.to)) : sh._from;
  sh._look = Array.isArray(sh.look) ? kino_V(...sh.look) : typeof sh.look === 'function' && sh.look.length === 1 ? kino_V(...sh.look(sh)) : null; sh._lookTo = sh.lookTo ? kino_V(...sh.lookTo) : null;
  try { sh.setup && sh.setup(sh); } catch (e) { console.warn('Kino: Aufbau', e); }
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; S.pose.ok = false;
}
// Kamera je Bild (aus update(), vor Taschenlampe und Takt)
function kino_cam(cam, dt) {
  const S = kino_S; if (!S.on) return;
  try {
    if (S.ending) { if (S.pose.ok) { cam.position.copy(S.pose.p); cam.quaternion.copy(S.pose.q); } return; }
    S.t += dt; S.T += dt;
    if (S.ev.length) for (let i = S.ev.length - 1; i >= 0; i--) if (S.T >= S.ev[i][0]) { const f = S.ev[i][1]; S.ev.splice(i, 1); try { f(); } catch (e) { console.warn('Kino: Zeitgeber', e); } }
    if (S.skip) { kino_finish(true); return; }
    if (S.T >= S.def.skipAfter && document.body.classList.contains('kinoNoSkip')) document.body.classList.remove('kinoNoSkip');
    let sh = S.sh; if (sh && S.t >= sh.dur) { kino_next(); sh = S.sh; if (!sh) return; }
    // Zeilen und Geräusche
    const L = sh.lines; while (L && S.li < L.length && S.t >= L[S.li][2]) { const [txt, who, , ms] = L[S.li++]; S.own = true; try { subtitle(txt, ms || Math.max(3400, Math.min(7000, (sh.dur - S.t) * 1000)), who || ''); } finally { S.own = false; } }
    const X = sh.sfx; while (X && S.si < X.length && S.t >= X[S.si][1]) { const f = X[S.si++][0]; try { typeof f === 'function' ? f(sh) : Audio.play(f, { gain: .5 }); } catch (e) { console.warn('Kino: Klang', e); } }
    const k = Math.min(1, S.t / sh.dur), e = kino_e(k), v = S.v, w = S.w;
    if (sh.black || sh.card || sh.white) { if (S.pose.ok) { cam.position.copy(S.pose.p); cam.quaternion.copy(S.pose.q); } if (sh.tick) sh.tick(k, S.t, dt, sh); return; }
    if (sh.path) sh.path(e, S.t, v, w, sh, k); else { v.lerpVectors(sh._from, sh._to, e); if (sh._lookTo) w.lerpVectors(sh._look, sh._lookTo, e); else if (sh._look) w.copy(sh._look); else if (typeof sh.look === 'function') sh.look(w, e, S.t, sh); }
    const h = sh.hand ?? .5; // ruhige Hand: kaum spürbares Atmen der Kamera
    v.x += Math.sin(S.T * .9) * .006 * h; v.y += Math.sin(S.T * 1.3 + 1) * .005 * h + (sh.breathe ? Math.sin(S.t * 1.7) * .012 : 0);
    cam.position.copy(v); cam.up.set(0, 1, 0); cam.lookAt(w); cam.rotateZ((sh.roll || 0) + Math.sin(S.T * .4) * .008 * h);
    if (sh.fov && cam.fov !== sh.fov) { cam.fov = sh.fov; cam.updateProjectionMatrix(); }
    S.pose.p.copy(cam.position); S.pose.q.copy(cam.quaternion); S.pose.ok = true;
    if (sh.tick) sh.tick(k, S.t, dt, sh);
  } catch (err) { console.error('Kino ' + S.id, err); kino_finish(true); }
}
async function kino_finish(skipped) {
  const S = kino_S; if (!S.on || S.ending) return; S.ending = true; const fd = $('fade');
  if (skipped) { $('subtitle').style.opacity = 0; fd.style.transition = 'opacity .3s'; fd.style.background = '#000'; fd.style.opacity = 1; await wait(320); }
  if (S.sh && S.sh.teardown) { try { S.sh.teardown(S.sh); } catch (e) { console.warn('Kino: Abbau', e); } } S.sh = null;
  const D = S.def; if (D.done) { try { D.done(skipped); } catch (e) { console.warn('Kino: Ende', e); } }
  for (const P of [...S.act]) kino_figOff(P.key); for (const k in S.obj) S.obj[k].visible = false; if (S.rabe) S.rabe.fl = null;
  kino_card(null); $('kinoPola').classList.remove('on', 'flip');
  if (S.lucyLight) S.lucyLight.intensity = 0; if (S.rabeLight) S.rabeLight.intensity = 0; if (S.coldLight) S.coldLight.intensity = 0;
  kino_restore();
  const au = S.opts && S.opts.aufblenden; S.on = false; S.id = null; const r = S.res; S.res = null;
  if (au) { fd.style.transition = `opacity ${au}ms`; fd.style.opacity = 0; }
  if (r) r();
}
function kino_restore() {
  const S = kino_S, sv = S.sv, A = Audio, cv = renderer.domElement; if (!sv) return;
  removeEventListener('keydown', S.onKey, true); removeEventListener('pointerdown', S.onClick, true);
  kino_envApply(null); S.env = null; scene.fog.color.setHex(sv.fogC); scene.fog.density = sv.fogD; state.inBasement = sv.inB; indoorK = sv.indoorK;
  const u = filmPass.uniforms; u.vig.value = sv.vig; u.ca.value = sv.ca; u.toe.value = sv.toe; u.flash.value = 0; glitchV = sv.glitch; shake = 0; cv.style.filter = sv.filter; cv.style.transition = sv.filterT;
  camera.near = sv.near; camera.far = sv.far; camera.fov = fov; camera.updateProjectionMatrix();
  player.yaw = sv.yaw; player.pitch = sv.pitch; player.pos.copy(sv.pos); vel.set(0, 0, 0);
  setCamOverride(sv.cam && sv.cam !== kino_cam ? sv.cam : null); setScripted(sv.scripted || null); state.talking = sv.talking;
  document.body.classList.remove('kino', 'kinoNoSkip'); if (!sv.cine) document.body.classList.remove('cine');
  $('subtitle').style.opacity = 0; $('fade').style.background = sv.fadeBg; for (const k in keys) keys[k] = false;
  if (A.ctx) { const t = A.ctx.currentTime; if (A.mus) { const g = A.mus.duck.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(1, t + 2.5); }
    for (const [n, v0] of [[A.world, sv.world], [A.bedTrim, sv.bed]]) if (n) { n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value, t); n.gain.linearRampToValueAtTime(v0, t + 1.2); } }
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; S.sv = null;
  if (typeof gedanken_S !== 'undefined') gedanken_S.cd = Math.max(gedanken_S.cd || 0, 6); // kein Gedanke direkt aus dem Schwarz heraus
  if (S.qp && S.qp.length) { const q = S.qp.splice(0); setTimeout(() => q.forEach(([k, t]) => questPop(k, t)), 2500); }
}
// Während einer Sequenz spricht nur das Kino: fremde Untertitel, Gedanken, Hinweise und Aufgaben-Einblendungen warten bzw. entfallen
subtitle = (o => function (t, ms, who) { if (kino_S.on && !kino_S.own) return; return o(t, ms, who); })(subtitle);
toast = (o => function (t, ms) { if (kino_S.on) return; return o(t, ms); })(toast);
questPop = (o => function (kind, text) { if (kino_S.on) { (kino_S.qp || (kino_S.qp = [])).push([kind, text]); return; } return o(kind, text); })(questPop); // nach der Sequenz nachgereicht

// ---------------------------------------------------------------- Takt: Figuren, Umgebung, geliehene Lichter (keine Zuweisungen)
function kino_tick(dt) {
  const S = kino_S; if (!S.on || S.ending) return;
  for (let i = 0; i < S.act.length; i++) { const P = S.act[i]; if (P.g.visible && !P.sit) P.mx.update(dt); }
  const R = S.rabe; if (R && R.g.visible) { R.mx.update(dt); if (R.fl) { const F = R.fl, g = R.g; F.t = Math.min(1, F.t + dt / F.dur); const k = F.t, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
      g.position.set(a * F.from.x + b * F.ctrl.x + c * F.to.x, a * F.from.y + b * F.ctrl.y + c * F.to.y, a * F.from.z + b * F.ctrl.z + c * F.to.z);
      const dx = F.to.x - F.from.x, dz = F.to.z - F.from.z; g.rotation.y = Math.atan2(dx, dz); if (F.t >= 1) { R.fl = null; kino_rabeClip('Landing', true); kino_after(.7, () => kino_rabeClip('IdleLookAround')); } } }
  kino_envTick();
  // geliehenes Punktlicht der Basis-Reserve: Position/Farbe/Stärke für diese Einstellung (Reserve-Platz 2)
  if (S.lit.length) { const l = pointPool[2], L = S.lit[0]; l.position.copy(L.p); l.color.setHex(L.c); l.distance = L.d; l.decay = 2; l.intensity = L.i; }
  // Taschenlampe an Lukes Stelle (K2: sein Lichtkegel auf dem Tank; K5: sein Licht ins Gitter)
  const F = S.flash; if (F) { flashRig.position.copy(F.p); S.a.copy(F.at).sub(F.p).normalize(); S.b.set(0, 0, -1); flashRig.quaternion.setFromUnitVectors(S.b, S.a); flashRig.updateMatrixWorld(); flashlight.intensity = F.i; bounce.intensity = 0;
    fogUniforms.flP.value.copy(F.p); fogUniforms.flD.value.copy(S.a); fogUniforms.flK.value.set(F.i / 18, Math.cos(flashlight.angle)); }
  else if (S.sh && !S.sh.keepFlash) { flashlight.intensity = 0; bounce.intensity = 0; fogUniforms.flK.value.set(0, 1); }
}
WORLD_TICK.push(dt => { kino_tick(dt); kino_persist(dt); });
// Was eine Sequenz dauerhaft verändert, bleibt – auch nach dem Laden: „210“ auf der Ortstafel ab Kapitel 1-Ende
function kino_persist(dt) { const S = kino_S; S.pT = (S.pT || 0) - dt; if (S.pT > 0 || S.on) return; S.pT = 1.5;
  const after1 = state.ch1Done || state.ch2 || (typeof ch3 !== 'undefined' && ch3.on) || (typeof kap === 'function' && kap() >= 2);
  if (after1 && S.schild !== '210') kino_schild('210');
  const k = typeof kap === 'function' ? kap() : typeof curChapter === 'function' ? curChapter() : 1; if (k === 3 || k === 5 || k === 6) kino_preload('k' + k); }
function kino_rabeClip(k, once = false) { const R = kino_S.rabe; if (!R) return; const a = R.A[k]; if (!a || a === R.cur) return; a.reset(); if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity); a.fadeIn(.2).play(); if (R.cur) R.cur.fadeOut(.2); R.cur = a; }
function kino_rabeFly(from, to, dur) { const R = kino_S.rabe; if (!R) return; R.g.position.copy(from); R.g.visible = true; R.fl = { from: from.clone(), to: to.clone(), ctrl: new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + 2.5, (from.z + to.z) / 2), t: 0, dur }; kino_rabeClip('Flying'); if (!R.A.Flying) kino_rabeClip('TakeOff'); }
function kino_lamps(fn) { if (typeof lamps === 'undefined') return; for (const L of lamps) fn(L); }

// ---------------------------------------------------------------- Die acht Sequenzen (PK-F), Koordinaten = Weltkoordinaten
function kino_defs() {
  const S = kino_S, X = C2.x, Z = C2.z, H = typeof ANW_HALL !== 'undefined' ? ANW_HALL : { x: -900, z: 900 }, TK = { x: X + 118, y: 1.3, z: Z + 6 };
  const SH3 = typeof uebergang3_S !== 'undefined' ? uebergang3_S.TOWN : { x: 9, z: -1.3 };
  // ---- K1 · „Du hast sie rausgelassen“ – nach Hilde im Strahl
  kino_def('k1', [
    { from: [29, 16, 6], to: [20, 18, 2], look: [-22, 0, -7], dur: 7, fov: 46, fadeIn: 1800, hand: .2, env: { fog: [0x0d1220, .021] },
      setup(sh) { const v = kino_show('veranda', -27.1, 2.3, -11.95); v.material.opacity = .95; sh.porch = porchLights[0] ? porchLights[0].dead : true; if (porchLights[0]) porchLights[0].dead = false; if (typeof Audio.hum === 'function') Audio.hum(false); kino_regen(.5); },
      sfx: [[() => { kino_hide('veranda'); if (porchLights[0]) { porchLights[0].dead = true; Audio.play('switch1', { gain: .5, rate: .7, x: -27.1, y: 2.3, z: -12, ref: 4 }); } }, 5]],
      teardown(sh) { kino_hide('veranda'); if (porchLights[0]) porchLights[0].dead = sh.porch; } },
    { from: [14.7, .42, 3.4], to: [14.4, .36, 2.75], look: [14.05, .05, 1.55], dur: 7, fov: 46,
      setup() { kino_show('nass', 14, .012, 1.5); const p = kino_show('pola', 14.35, 3.4, 2.1); p.rotation.set(.8, .3, .4); },
      tick(k, t) { const p = kino_S.obj.pola; if (t < 2) { p.position.y = 3.4; p.visible = false; return; } p.visible = true; const u = Math.min(1, (t - 2) / 3.2), y = 3.4 * (1 - u) * (1 - u * .15) + .004 * u;
        p.position.set(14.3 - .2 * u + Math.sin(t * 3.1) * .07 * (1 - u), Math.max(.004, y), 1.95 - .2 * u + Math.cos(t * 2.3) * .05 * (1 - u)); p.rotation.set((1 - u) * (.8 + Math.sin(t * 4) * .5), .3 + t * .25 * (1 - u), (1 - u) * Math.sin(t * 3.3) * .6);
        if (u >= 1 && !kino_S.polaDown) { kino_S.polaDown = true; if (Audio.paper) Audio.paper(); } },
      teardown() { kino_S.polaDown = false; } },
    { from: [24, 1.6, -4], to: [26, 1.55, -7.4], look: [24.4, 1.5, -13], dur: 7, fov: 48, lines: [['Im Wohnzimmer brennt kurz Licht. Aber niemand bewegt sich.', '', .9, 5600]],
      tick(k, t) { const on = t > 2.6 && t < 4.4 ? (t < 2.75 || (t > 3.1 && t < 3.25) ? .2 : 1) : 0; kino_S.lit[0] = kino_S.lit0 || (kino_S.lit0 = { p: kino_V(25.3, Y + 1.45, -16.5), c: 0xffa050, d: 9, i: 0 }); kino_S.lit0.i = 3.6 * on;
        if (typeof shade !== 'undefined') shade.material.emissiveIntensity = .7 * on; },
      sfx: [[() => Audio.play('switch1', { gain: .25, rate: .9, x: 25, y: 1.5, z: -15, ref: 2 }), 2.6], [() => Audio.play('buzz', { gain: .12, rate: .8, x: 25, y: 1.5, z: -15, ref: 2 }), 4.3]],
      teardown() { if (typeof shade !== 'undefined') shade.material.emissiveIntensity = 0; } },
    { from: [300, 1.5, 302], to: [300, .9, 298.5], look: [299.8, 1.25, 296], dur: 8, fov: 54, env: 'keller', hand: .3,
      setup(sh) { const art = []; scene.traverse(o => { if (o.isMesh && B.wallArt && o.material === B.wallArt.material) art.push([o, o.scale.clone(), o.position.z]); }); sh.art = art; kino_S.obj.staub.visible = true;
        kino_S.coldLight.position.set(299.6, 1.4, 296.6); },
      tick(k, t, dt, sh) { const s = 1 + .04 * kino_e(Math.min(1, t / 7)); for (const [o, sc, z0] of sh.art) { o.scale.set(sc.x * s, sc.y * s, sc.z); o.position.z = z0 + (s - 1) * .8; }
        kino_S.coldLight.intensity = .55 + .12 * Math.sin(t * 2.3) + .05 * Math.sin(t * 9.1); kino_S.lit[0] = kino_S.litK || (kino_S.litK = { p: kino_V(299.6, 1.5, 296.8), c: 0xdfe8ff, d: 7, i: 0 }); kino_S.litK.i = kino_S.coldLight.intensity * 1.6;
        const D = kino_S.dust, P = D.pos; for (let i = 0; i < D.N; i++) { const j = i * 3; D.seed[j + 2] -= dt * (.12 + (i % 7) * .02) * (.4 + k); if (D.seed[j + 2] < .05) D.seed[j + 2] = 6; P[j] = 300 + D.seed[j] + Math.sin(t * .7 + i) * .05; P[j + 1] = D.seed[j + 1] + Math.sin(t * .5 + i * 1.3) * .04; P[j + 2] = 296.2 + D.seed[j + 2]; }
        D.m.geometry.attributes.position.needsUpdate = true; },
      sfx: [[() => Audio.play('rumble', { gain: .25, rate: .6, lp: 300 }), .2], [() => Audio.giggle(300, -3, 294), 5]],
      teardown(sh) { for (const [o, sc, z0] of sh.art || []) { o.scale.copy(sc); o.position.z = z0; } kino_hide('staub'); kino_S.coldLight.intensity = 0; } },
    { from: [-68.9, 1.7, 4.9], to: [-69.6, 1.8, 5.5], look: [-72.28, 1.55, 6.3], dur: 4.5, fov: 30, env: { exp: 1.9 },
      setup() { kino_schild('orig'); },
      sfx: [[() => { kino_schild('2'); kino_kreide(-72.2, 1.5, 6.3); }, .8], [() => kino_schild('21'), 1.35], [() => kino_schild('210'), 1.9]] },
    { card: ['KAPITEL 1 — ENDE · DAS HAUS NUMMER 7', 'Frau Wendt ist fort.', 'Du hast etwas aus dem Keller gelassen. Es hatte Lucys Stimme.'], dur: 8.5, fadeOut: 900,
      setup() { kino_still(true, 1.5); } },
  ], { name: 'Du hast sie rausgelassen', done() { kino_schild('210'); } });

  // ---- K2 · „Ich seh ja durch dich“ – nach dem Finale im Messraum
  const k2Luke = sh => { const P = kino_S.sv ? kino_S.sv.pos : player.pos; let dx = TK.x - P.x, dz = TK.z - P.z, d = Math.hypot(dx, dz); if (d < .5) { dx = 0; dz = 1; d = 1; } sh.lk = [P.x, P.z, dx / d, dz / d]; return sh.lk; };
  kino_def('k2', [
    { from: sh => { const [x, z, ux, uz] = k2Luke(sh); return [x - ux * 1.1, .95, z - uz * 1.1]; }, look: sh => [TK.x, 1.25, TK.z], dur: 3.2, fov: 62, breathe: true, hand: 1.2, fadeIn: 400,
      film: { vig: 2.6, ca: .016, toe: .5, filter: 'grayscale(.75) contrast(1.08) brightness(.92)' },
      setup(sh) { const [x, z, ux, uz] = sh.lk; kino_S.flash = { p: kino_V(x, 1.5, z), at: kino_V(TK.x, 1.2, TK.z), i: 16 };
        const s = kino_show('schatten', TK.x - ux * .93, 1.35, TK.z - uz * .93); s.lookAt(x - ux * 1.1, 1.35, z - uz * 1.1); kino_atem(.12, .9); if (Audio.musicBox) Audio.musicBox(); },
      tick(k, t) { const s = kino_S.obj.schatten; s.scale.set(1 - .42 * kino_e(Math.min(1, t / 3)), 1, 1); s.material.opacity = .7; } , teardown() { kino_hide('schatten'); } },
    { white: true, dur: 3,
      setup() { if (typeof lenaFig !== 'undefined') lenaFig.visible = false; kino_still(true, .1); Audio.tankHum && Audio.tankHum(false); },
      tick(k, t) { const f = $('fade'); if (t > .45 && !f.dataset.k2) { f.dataset.k2 = 1; f.style.transition = 'background-color 1.1s'; f.style.background = '#000'; } },
      teardown() { delete $('fade').dataset.k2; kino_still(false, 1.2); } },
    { path(e, t, v, w) { const a = (200 + 60 * e) * PI / 180; v.set(TK.x + Math.cos(a) * 2.4, 1.35, TK.z + Math.sin(a) * 2.4); w.set(TK.x, 1.3, TK.z); }, dur: 10, fov: 50, fadeIn: 900,
      setup() { const a = 230 * PI / 180, h = kino_show('hand', TK.x + Math.cos(a) * .88, 1.42, TK.z + Math.sin(a) * .88); h.lookAt(TK.x + Math.cos(a) * 3, 1.42, TK.z + Math.sin(a) * 3);
        kino_show('haar', TK.x + Math.cos(a) * .55, 2.0, TK.z + Math.sin(a) * .55); kino_show('wasser', TK.x, 2.26, TK.z); if (typeof tankLight !== 'undefined') { kino_S.tl = tankLight.intensity; }
        if (Audio.tankHum) Audio.tankHum(true); },
      tick(k, t) { const O = kino_S.obj, hr = O.haar; hr.position.y = 2.0 - .9 * Math.min(1, t / 10); hr.rotation.set(Math.sin(t * .8) * .5, t * .3, .6 + Math.sin(t * .6) * .4);
        const w = O.wasser; w.rotation.set(-PI / 2 + Math.sin(t * 2.2) * .05 * Math.exp(-t * .25), 0, Math.cos(t * 1.9) * .04 * Math.exp(-t * .25)); w.position.y = 2.26 + Math.sin(t * 2.2) * .01 * Math.exp(-t * .25);
        if (typeof tankLight !== 'undefined') tankLight.intensity = 2.2 * (t < 3 ? 1 : t < 5 ? (Math.random() < .3 ? .2 : 1) : .45); },
      sfx: [[() => Audio.tankHum && Audio.tankHum(false), 2.2], [() => Audio.drip(TK.x + .3, 2.3, TK.z), 3.4], [() => Audio.drip(TK.x - .2, 2.2, TK.z + .3), 5.9], [() => Audio.drip(TK.x, 2.3, TK.z - .2), 8.3]],
      teardown() { kino_hide('hand', 'haar', 'wasser'); if (typeof tankLight !== 'undefined') tankLight.intensity = .9; } },
    { from: [X + 118.6, .75, Z + 3.35], to: [X + 118.6, .58, Z + 4.1], look: [X + 118.6, .05, Z + 4.62], lookTo: [X + 118.6, .2, Z + 4.75], dur: 8, fov: 44,
      setup() { const d = kino_show('papa', X + 118.6, .006, Z + 4.52); d.rotation.set(-PI / 2, 0, .08); kino_cello([['E3', 1.1], ['D3', 1.1], ['C3', 1.1], ['B2', 1.2], ['C3', 2.4]], .6); } },
    { from: [SH3.x, -11, SH3.z], to: [SH3.x, -6.8, SH3.z], look: [SH3.x + .01, 20, SH3.z + .02], dur: 7, fov: 58, hand: .3,
      setup(sh) { const U = typeof uebergang3_S !== 'undefined' ? uebergang3_S : null; sh.cap = U && U.town ? U.town.cap.visible : null; if (U && U.town) U.town.cap.visible = false; sh.lid = U && U.lid ? U.lid.map(m => m.visible) : null; if (U && U.lid) U.lid.forEach(m => m.visible = false);
        kino_show('ring', SH3.x, -.03, SH3.z); kino_show('puls', SH3.x + 2, 46, SH3.z - 3); },
      tick(k, t) { const p = kino_S.obj.puls; p.material.opacity = .35 + .5 * Math.pow(.5 + .5 * Math.sin(t * 2.4), 2); },
      sfx: [[() => kino_glocke(.8), .6], [() => kino_glocke(.8), 1.9], [() => kino_glocke(.8), 3.2], [() => kino_glocke(.85), 7]],
      teardown(sh) { const U = typeof uebergang3_S !== 'undefined' ? uebergang3_S : null; if (U && U.town && sh.cap !== null) U.town.cap.visible = sh.cap; if (U && U.lid && sh.lid) U.lid.forEach((m, i) => m.visible = sh.lid[i]); kino_hide('ring', 'puls'); } },
    { card: ['KAPITEL 2 — ENDE · DAS ACHTE KIND', 'Du weißt es jetzt.', 'Sie auch.', '03:13.'], dur: 7, fadeOut: 300 },
  ], { name: 'Ich seh ja durch dich', skipAfter: 3 });

  // ---- K3A · „Das Siegel“ – Morgengrauen, Silhouetten im Gegenlicht
  const bare = [['hilde', -2.2, -1.4, .4], ['zayn', -1.1, .9, .9], ['mike', 1.3, .2, -.5], ['roxy', 2.4, -1.6, 2.6], ['junge', -3.4, 1.9, 1.2], ['maedchen', .3, -2.8, 3.4], ['frau', 3.6, 1.6, -1.9]];
  const bareOn = (sil = true) => { let i = 0; for (const [k, x, z, ry] of bare) kino_fig(k, x, 0, z, ry, 'idle', { sil, t0: i++ * .7 }); };
  const bareOff = () => { for (const [k] of bare) kino_figOff(k); };
  kino_def('k3a', [
    { from: [0, 14, 18], to: [0, 9, 10], look: [0, 0, 0], dur: 8, fov: 50, env: 'dawn', fadeIn: 2200, hand: .2,
      setup() { bareOn(); kino_lamps(L => { L._m = L.mode; L.mode = 'off'; }); kino_regen(0); },
      sfx: [[() => kino_vogel(-12, 6, -8), 1.5], [() => kino_vogel(14, 7, 10, 4), 4.2], [() => kino_vogel(-6, 5, 16, 2), 6.6]] },
    { from: [.6, .3, 1.2], to: [.3, .5, .6], look: [0, .6, 0], dur: 8, fov: 42, env: 'dawn', hand: .3,
      setup() { const s = kino_show('schwert', 0, .42, 0); s.rotation.set(0, .5, 0); if (S.swordAxis === 'x') s.rotation.z = PI / 2 - .08; else if (S.swordAxis === 'z') s.rotation.x = PI / 2 - .08; else s.rotation.x = PI - .08; bareOn(); },
      sfx: [[() => Audio.gust && Audio.gust(3), .5], [() => kino_vogel(-10, 6, -12), 5]] },
    { from: [-26.5, 1.6, -9.5], to: [-26.8, 1.6, -9.9], look: [-27.8, 1.5, -12.4], dur: 10, fov: 44, env: 'dawn',
      setup() { const A = typeof albers_S !== 'undefined' ? albers_S : null; if (A && A.fig) { A.fig.visible = true; A.fig.position.set(A.door.x + .15, .45, A.door.z + .35); A.fig.rotation.y = .5; if (A.act.idle) A.act.idle.play(); } kino_S.lit[0] = { p: kino_V(-28, 1.9, -12.3), c: 0xffb070, d: 4, i: .9 }; },
      tick(k, t, dt) { const A = typeof albers_S !== 'undefined' ? albers_S : null; if (A && A.fig && A.mx) { A.mx.update(dt); A.fig.rotation.y = .5 - .9 * kino_e(Math.min(1, Math.max(0, (t - 5) / 2))); } },
      lines: [['„Mike!“', 'LARS VEGAS', 1.2, 3200], ['„… Zayn?“', 'LARS VEGAS', 5.6, 3800]],
      teardown() { const A = typeof albers_S !== 'undefined' ? albers_S : null; if (A && A.fig) A.fig.visible = false; } },
    { from: [-6.6, 1.05, 6.9], to: [-6.45, 1.02, 6.7], look: [0, .9, 0], dur: 10, fov: 40, env: 'dawn',
      setup() { bareOn(); kino_fig('lucy', -6.1, 0, 6.2, PI * .75, 'idle', { sit: .2 }); kino_fig('kleine', 9, 0, -15, -.4, 'idle'); const l = kino_show('laterneAus', 9.25, .55, -14.8); l.rotation.set(0, 0, .06); },
      lines: [['„… sechs, sieben … acht.“', 'LUCY', 3.2, 4800]], sfx: [[() => kino_atem(.05, 1.1), 2.2]] },
    { black: true, dur: 4, fadeOut: 1400, setup() { kino_still(true, 2); } },
  ], { name: 'Das Siegel', done() { bareOff(); kino_lamps(L => { if (L._m !== undefined) { L.mode = L._m; delete L._m; } }); } });

  // ---- K3B · „Die Regel“
  kino_def('k3b', [
    { from: [X3 + 38, 1.4, Z3 + 3], to: [X3 + 40, 1.2, Z3 + 1], look: [X3 + 42, .6, Z3], dur: 8, fov: 50, fadeIn: 1200,
      setup(sh) { const g = justin.g; sh.j = [g.position.clone(), g.rotation.y, g.visible]; g.visible = true; g.position.set(X3 + 39.4, 0, Z3 + .5); g.rotation.y = PI / 2; if (typeof jPlay === 'function') jPlay('walk', 0); },
      tick(k, t, dt, sh) { const g = justin.g; if (justin.mixer) justin.mixer.update(dt); if (t < 3.2) { g.position.x = X3 + 39.4 + 1.8 * (t / 3.2); g.position.z = Z3 + .5 * (1 - t / 3.2); }
        else { if (!sh.st) { sh.st = 1; if (typeof jPlay === 'function') jPlay('idle', .4); } g.position.y = -3.2 * kino_e(Math.min(1, (t - 3.6) / 4)); } },
      sfx: [[() => Audio.screech && Audio.screech(), 3.8], [() => Audio.giggle(X3 + 42, .5, Z3), 5.4]],
      lines: [['„Eins … zwei …“', 'DAS KIND', 6.1, 2600]],
      teardown(sh) { const g = justin.g; g.position.copy(sh.j[0]); g.rotation.y = sh.j[1]; g.visible = sh.j[2]; if (typeof jPlay === 'function') jPlay('idle', 0); } },
    { white: true, dur: 2, setup() { $('fade').style.transition = 'opacity .8s'; } },
    { from: [.4, .25, .8], to: [.4, .26, .78], look: [1.2, 6, -2.2], lookTo: [1.6, 6.4, -2.8], dur: 10, fov: 60, env: 'dawn', fadeIn: 1600, hand: .15,
      setup(sh) { kino_lamps(L => { L._m = L.mode; L.mode = 'on'; }); sh.near = []; kino_lamps(L => sh.near.push([Math.hypot(L.wx, L.wz), L])); sh.near.sort((a, b) => a[0] - b[0]); sh.oi = 0;
        kino_fig('lucy', 1.15, .05, .55, -PI / 2, 'idle', { rx: -PI / 2 }); kino_regen(0); },
      tick(k, t, dt, sh) { const n = Math.min(sh.near.length, Math.floor((t - 1.2) / 1.1)); while (sh.oi < n) { const L = sh.near[sh.oi++][1]; L.mode = 'off'; Audio.buzz(L.wx, 5, L.wz); } },
      sfx: [[() => kino_atem(.07, .9, 1.1, .3, .5), 1], [() => kino_atem(.07, .9, 1.1, .3, .5), 5], [() => kino_vogel(-9, 6, -10), 3]] },
    { black: true, dur: 7, fadeOut: 400,
      setup() { const P = $('kinoPola'), inn = P.querySelector('.in'), f = kino_S.pola2043; inn.innerHTML = ''; if (f) { f.front.className = 'front'; f.back.className = 'back'; inn.append(f.front, f.back); } P.classList.remove('flip'); P.classList.add('on'); if (Audio.paper) Audio.paper(); },
      sfx: [[() => { $('kinoPola').classList.add('flip'); if (Audio.paper) Audio.paper(); }, 3.6], [() => $('kinoPola').classList.remove('on'), 6.2]],
      teardown() { $('kinoPola').classList.remove('on'); } },
    { from: [1.12, .62, .25], to: [1.12, .58, .3], look: [1.12, .12, .1], dur: 5, fov: 26, env: 'dawn', fadeIn: 500, hand: .1,
      setup() { kino_fig('lucy', 1.15, .05, .55, -PI / 2, 'idle', { rx: -PI / 2 }); },
      tick(k, t) { kino_eyes('lucy', t > 1.6 && t < 3.4); }, teardown() { kino_eyes('lucy', false); } },
    { black: true, dur: 2.2, fadeOut: 300 },
  ], { name: 'Die Regel', done() { kino_lamps(L => { if (L._m !== undefined) { L.mode = L._m; delete L._m; } }); kino_eyes('lucy', false); } });

  // ---- K3C · „Such mich“
  const chair8 = { x: X3 + 37, z: Z3 };
  kino_def('k3c', [
    { from: [X3 + 40, 1.5, Z3 + 3], to: [X3 + 39.4, 1.55, Z3 + 2.4], look: [X3 + 37.4, 1.1, Z3 - .2], dur: 10, fov: 46, fadeIn: 1400,
      setup(sh) { const g = justin.g; sh.j = [g.position.clone(), g.rotation.y, g.visible]; g.visible = true; g.position.set(chair8.x + .9, 0, chair8.z - .7); g.rotation.y = PI * .92; if (typeof jPlay === 'function') jPlay('idle', 0);
        const s = kino_show('schwert', chair8.x, .58, chair8.z); s.rotation.set(0, 0, 0); if (S.swordAxis === 'y') s.rotation.z = PI / 2; else if (S.swordAxis === 'z') s.rotation.y = PI / 2; sh.helm = kino_helm(false); },
      tick(k, t, dt) { if (justin.mixer) justin.mixer.update(dt); },
      lines: [['„Eins. Zwei. Drei …“', 'JUSTIN', 1.4, 5200]],
      sfx: [[() => { for (let i = 0; i < 7; i++) { const a = i / 8 * PI * 2; Audio.whisper(X3 + 42 + Math.cos(a) * 5, 1, Z3 + Math.sin(a) * 5, 2.4); } }, 2.4]],
      teardown(sh) { const g = justin.g; g.position.copy(sh.j[0]); g.rotation.y = sh.j[1]; g.visible = sh.j[2]; kino_hide('schwert'); kino_helm(true); } },
    { from: [X3 + 44.2, 1.0, Z3 - 1.6], to: [X3 + 44.3, 1.0, Z3 - 1.2], look: [X3 + 42.2, .85, Z3 + .4], dur: 8, fov: 38,
      setup(sh) { if (typeof mira !== 'undefined') { sh.mira = mira.visible; mira.visible = false; } kino_fig('kleine', X3 + 42.3, 0, Z3 + .4, PI * .6, 'idle'); },
      tick(k, t) { const P = kino_S.fig.kleine; if (!P) return; if (t > 3.2) { kino_play_(P, 'walk', 1.9); P.g.rotation.y = PI * .15; P.g.position.x = X3 + 42.3 + (t - 3.2) * .6; P.g.position.z = Z3 + .4 + (t - 3.2) * 1.9; } },
      sfx: [[() => Audio.giggle(X3 + 42.3, 1, Z3 + .4), 1], [() => Audio.giggle(X3 + 42.6, 1, Z3 + 2), 3.3]],
      lines: [['„… Siebzehn.“', 'JUSTIN', 4.8, 3000]],
      teardown(sh) { if (typeof mira !== 'undefined' && sh.mira !== undefined) mira.visible = sh.mira; kino_figOff('kleine'); } },
    { path(e, t, v, w, sh) { const W = kino_S.wiese || { cx: X3 + 42, cz: Z3 + 46 }; v.set(W.cx + .6, 1.6, W.cz - 3 + 7 * e); w.set(W.cx + .1, 1.4, W.cz + 3 + 9 * e); }, dur: 10, fov: 46, env: 'white', fadeIn: 2000,
      setup(sh) { const W = kino_S.wiese || { cx: X3 + 42, cz: Z3 + 46 }; kino_show('wiese'); const g = justin.g; sh.j = [g.position.clone(), g.rotation.y, g.visible]; g.visible = true; g.position.set(W.cx, 0, W.cz + 1); g.rotation.y = 0; if (typeof jPlay === 'function') jPlay('walk', 0); kino_helm(false); },
      tick(k, t, dt) { const W = kino_S.wiese || { cx: X3 + 42, cz: Z3 + 46 }; if (justin.mixer) justin.mixer.update(dt); justin.g.position.z = W.cz + 1 + t * 1.05; justin.g.position.x = W.cx + Math.sin(t * .4) * .6; },
      lines: [['„Ich komme.“', 'JUSTIN', 1.5, 3000], ['„Danke, Luke.“', 'JUSTIN', 6.2, 3400]],
      sfx: [[() => Audio.gust && Audio.gust(3), 1]],
      teardown(sh) { const g = justin.g; g.position.copy(sh.j[0]); g.rotation.y = sh.j[1]; g.visible = sh.j[2]; if (typeof jPlay === 'function') jPlay('idle', 0); kino_helm(true); kino_hide('wiese'); } },
    { from: [X3 + 42, .5, Z3 + 46], to: [X3 + 42, .4, Z3 + 45.6], look: [X3 + 42.4, 22, Z3 + 50], dur: 6, fov: 60, env: 'white',
      setup() { kino_show('wiese'); kino_show('lampion', X3 + 42.4, 26, Z3 + 50); },
      tick(k, t) { const o = kino_S.obj.lampion; o.position.y = 26 - 9 * kino_e(Math.min(1, t / 6)); const f = t < 3.2 ? 1 : Math.max(0, 1 - (t - 3.2) / 1.6); for (const m of kino_S.lampionMats || []) m.emissiveIntensity = 1.6 * f * (.94 + .06 * Math.sin(t * 7)); },
      teardown() { kino_hide('lampion', 'wiese'); for (const m of kino_S.lampionMats || []) m.emissiveIntensity = 1.6; } },
    { from: [0, 3, 12], to: [0, 2.6, 10.5], look: [0, 1, 0], dur: 6, fov: 46, env: 'dawn', fadeIn: 1400,
      setup() { bareOn(false); kino_fig('lucy', -.5, 0, 3.2, PI, 'idle'); kino_fig('echt', .25, 0, 3.25, PI, 'idle'); kino_lamps(L => { L._m = L.mode; L.mode = 'off'; }); },
      sfx: [[() => kino_vogel(-10, 6, 12), 1], [() => kino_vogel(12, 7, -6), 3.5]] },
    { from: [-68.8, 1.75, 4.8], to: [-69.5, 1.85, 5.4], look: [-72.2, 1.55, 6.3], dur: 4, fov: 34, env: 'dawn',
      setup() { kino_schild('alle'); } },
    { black: true, dur: 1.8, fadeOut: 900 },
  ], { name: 'Such mich', done() { bareOff(); kino_figOff('lucy'); kino_figOff('echt'); kino_lamps(L => { if (L._m !== undefined) { L.mode = L._m; delete L._m; } }); kino_schild('210'); kino_helm(true); } });

  // ---- K4 · „Noch nicht“ – nach der Stimme in der Villa
  kino_def('k4', [
    { from: [H.x, 1.2, H.z + 1], to: [H.x, 1.6, H.z + 2.2], look: [H.x, 5.8, H.z + 4.8], dur: 8, fov: 50, fadeIn: 1200,
      tick(k, t) { const A = typeof anwesen_S !== 'undefined' ? anwesen_S : null, b = .75 + .35 * Math.sin(t * 1.3); if (A && A.upLight) A.upLight.intensity = .9 * b;
        kino_S.lit[0] = kino_S.litU || (kino_S.litU = { p: kino_V(H.x, 5.6, H.z + 4.6), c: 0xfff0d8, d: 9, i: 0 }); kino_S.litU.i = 2.6 * b; }, env: { exp: 1.5 },
      sfx: [[() => Audio.stepAt && Audio.stepAt(H.x - .4, H.z + 4.6, .5), 1.2], [() => Audio.stepAt && Audio.stepAt(H.x, H.z + 4.8, .45), 1.65], [() => Audio.stepAt && Audio.stepAt(H.x + .4, H.z + 4.7, .4), 2.1], [() => Audio.musicBox && Audio.musicBox(), 3]],
      teardown() { const A = typeof anwesen_S !== 'undefined' ? anwesen_S : null; if (A && A.upLight) A.upLight.intensity = .9; } },
    { from: [H.x - 5.7, 1.6, H.z + 1.5], to: [H.x - 6.1, 1.55, H.z + 1.5], look: [H.x - 6.88, 1.5, H.z + 1.5], dur: 7, fov: 40, env: { exp: 1.5 },
      setup() { kino_still(true, 1.5); kino_S.lit[0] = { p: kino_V(H.x - H.w / 2 + .7, 1.6, H.z + H.d / 2 - 1), c: 0xffa860, d: 8, i: 2.4 }; }, teardown() { kino_still(false, 1); } },
    { from: [-127, 1.7, 50], to: [-126, 2.4, 53], look: [-125, 8, 66], dur: 9, fov: 44,
      setup(sh) { const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, R = OW && OW.dbg && OW.dbg.R; sh.reg = []; if (R) for (const k of ['villa', 'allot', 'wRoad']) if (R[k]) { sh.reg.push([R[k], R[k].g.visible]); R[k].g.visible = true; }
        const vb = OW && OW.vbb, fp = kino_villaFenster(); kino_show('flamme', fp.x, fp.y, fp.z); kino_show('flammeSchein', fp.x, fp.y, fp.z + .05); kino_S.obj.flamme.material.opacity = 0; kino_S.obj.flammeSchein.material.opacity = 0; sh.gable = vb ? kino_V(-125, vb.max.y + .05, (vb.min.z + vb.max.z) / 2) : kino_V(-125, 12.5, 70); },
      tick(k, t) { const f = t > 2 && t < 4 ? Math.min(1, (t - 2) / .15, (4 - t) / .25) : 0; kino_S.obj.flamme.material.opacity = f; kino_S.obj.flammeSchein.material.opacity = .45 * f; },
      sfx: [[sh => kino_rabeFly(kino_V(-110, 16, 58), sh.gable, 3.2), 4.6], [sh => Audio.caw(sh.gable.x, sh.gable.y, sh.gable.z), 8]],
      teardown(sh) { for (const [r, v] of sh.reg) r.g.visible = v; kino_hide('flamme', 'flammeSchein', 'rabe'); } },
    { black: true, dur: 6, fadeOut: 1600 },
  ], { name: 'Noch nicht' });

  // ---- K5 · „Kein Echo“ – nach „Komm heim.“
  const waldZeigen = sh => { const W = typeof wald_S !== 'undefined' ? wald_S : null; sh.wald = []; if (W && W.chunks) for (const c of W.chunks) for (const m of c.meshes) sh.wald.push([m, m.visible]); };
  const waldTick = (sh, cx, cz) => { const W = typeof wald_S !== 'undefined' ? wald_S : null; if (!W || !W.chunks) return; for (const c of W.chunks) { const v = Math.hypot(c.x - cx, c.z - cz) < c.vis + 10; for (const m of c.meshes) m.visible = v; } };
  const waldAus = sh => { for (const [m, v] of sh.wald || []) m.visible = v; };
  kino_def('k5', [
    { from: [30, 1.5, 96.8], to: [30, 1.48, 97.1], look: [30, 1.4, 106], dur: 6, fov: 50, fadeIn: 900, hand: .2,
      setup(sh) { waldZeigen(sh); waldTick(sh, 30, 100); kino_still(true, .3); }, tick(k, t, dt, sh) { if (t > 2 && !sh.b) { sh.b = 1; kino_S.sv && kino_still(false, 2.5); kino_atem(.1, .8); } },
      sfx: [[() => kino_atem(.1, .8), 4.2]], teardown(sh) { waldAus(sh); } },
    { from: [31, 1.4, 101], to: [31, 1.2, 99.5], look: [30, 1.4, 92], dur: 8, fov: 48,
      setup(sh) { waldZeigen(sh); waldTick(sh, 30, 98); const P = kino_S.sv.pos; sh.lk = [P.x, P.z]; kino_S.flash = { p: kino_V(P.x, 1.5, P.z), at: kino_V(31.5, 1.2, 104), i: 14 };
        kino_fig('lucy', 30.4, 0, 86.5, 0, 'walk', { ts: .7 }); kino_show('laterne'); kino_show('lampe', P.x + .15, 1.45, P.z + .25); },
      tick(k, t, dt, sh) { const L = kino_S.fig.lucy, z = 86.5 + 5 * Math.min(1, t / 7); if (L) { L.g.position.z = z; } const l = kino_S.obj.laterne; l.position.set(30.62, .72, z + .25); l.rotation.set(Math.sin(t * 3) * .12, 0, Math.sin(t * 2.4) * .1);
        kino_S.lucyLight.position.set(30.62, .9, z + .25); kino_S.lucyLight.intensity = 2.4 * (.94 + .06 * Math.sin(t * 11)); kino_S.lit[0] = kino_S.litL || (kino_S.litL = { p: kino_V(0, 0, 0), c: 0xffb060, d: 7, i: 0 }); kino_S.litL.p.copy(kino_S.lucyLight.position); kino_S.litL.i = kino_S.lucyLight.intensity;
        kino_S.obj.lampe.material.opacity = .75 + .1 * Math.sin(t * 9); },
      lines: [['„Großer.“', 'LUCY', 4.4, 3200]],
      teardown(sh) { waldAus(sh); kino_figOff('lucy'); kino_hide('laterne', 'lampe'); kino_S.lucyLight.intensity = 0; } },
    { from: [26, 3, 90], to: [10, 30, 70], look: [-40, 0, 40], lookTo: [-48, 0, 58], dur: 10, fov: 52, env: 'vista', hand: .2,
      setup() { const fp = kino_villaFenster(); kino_show('flamme', fp.x, fp.y, fp.z); kino_show('flammeSchein', fp.x, fp.y, fp.z + .05); kino_S.obj.flamme.material.opacity = 1; kino_S.obj.flammeSchein.material.opacity = .45; },
      tick(k, t) { const f = t < 6 ? 1 : Math.max(0, 1 - (t - 6) / .5); kino_S.obj.flamme.material.opacity = f; kino_S.obj.flammeSchein.material.opacity = .45 * f; },
      teardown() { kino_hide('flamme', 'flammeSchein'); } },
    { from: [60, 9, 94], to: [60.4, 8.8, 94.6], look: [70, 2, 119], dur: 8, fov: 32, hand: .15,
      setup(sh) { waldZeigen(sh); waldTick(sh, 66, 110); kino_show('hirsch', 70, 0, 119, -2.6); },
      tick(k, t) { const o = kino_S.obj.hirsch; o.visible = t > 2.4 && t < 3.6; const Hd = kino_S.hirschHead; if (Hd && kino_S.hirschQ) { Hd.quaternion.copy(kino_S.hirschQ); if (t > 2.6) Hd.rotateY(Math.min(1, (t - 2.6) / .8) * 1.9); } },
      sfx: [[() => kino_reh(64, 3, 118), 4.6]],
      teardown(sh) { waldAus(sh); kino_hide('hirsch'); if (kino_S.hirschHead && kino_S.hirschQ) kino_S.hirschHead.quaternion.copy(kino_S.hirschQ); } },
    { black: true, dur: 8, fadeOut: 1400, setup() { kino_still(true, 3); } },
  ], { name: 'Kein Echo', skipAfter: 3 });

  // ---- K6 · „Der Morgen“ – nach dem Epilog auf dem Hochsitz
  kino_def('k6', [
    { black: true, dur: 8, lines: [['Du machst die Augen erst auf, als du unten bist.', '', 1.2, 6200]],
      sfx: [[() => kino_stoff(.06), .5], [() => kino_atem(.06, 1.25), 1.6], [() => Audio.flap && Audio.flap(kino_S.sv.pos.x + .5, 2, kino_S.sv.pos.z), 3.4], [() => kino_atem(.05, 1.25), 4.8], [() => kino_stoff(.04), 6.4]] },
    { from: [15.6, 1.2, 174.6], to: [15.2, 2.1, 175.2], look: [14, 3.3, 177.6], lookTo: [14, 3.7, 177.8], dur: 8, fov: 46, env: 'dawn', fadeIn: 1400,
      setup() { const HS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 }; kino_fig('echt', HS.x + .1, 3.1, HS.z - .92, PI, 'idle', { sit: 3.1 }); const j = kino_show('jacke', HS.x + .1, 3.2, HS.z - .98, PI); j.rotation.set(-.12, PI, 0);
        const R = kino_S.rabe, rx = HS.x - .95, ry = 4.02, rz = HS.z + .2; if (R) { R.g.position.set(rx, ry, rz); R.g.rotation.y = -1.2; R.g.visible = true; kino_rabeClip('IdleLookAround'); } kino_show('rabeSchein', rx, ry + .25, rz); kino_S.rabeLight.position.set(rx, ry + .25, rz); },
      tick(k, t) { const f = Math.max(0, 1 - t / 7), o = kino_S.obj.rabeSchein; kino_S.rabeLight.intensity = 1.6 * f; o.material.opacity = .8 * f; kino_S.lit[0] = kino_S.litR || (kino_S.litR = { p: kino_V(0, 0, 0), c: 0xdfe9ff, d: 7, i: 0 }); kino_S.litR.p.copy(o.position); kino_S.litR.i = 1.6 * f; },
      sfx: [[() => kino_vogel(6, 8, 184), 2], [() => kino_vogel(24, 9, 170, 4), 5.5]] },
    { from: [14, 21, 180], to: [13.4, 21.4, 178.8], look: [-8, 3, 60], dur: 10, fov: 42, env: 'haze', hand: .2,
      setup() { kino_lamps(L => { L._m = L.mode; L.mode = 'on'; }); kino_S.k6i = 0; },
      tick(k, t) { const n = Math.floor((t - 2) / .9); if (typeof lamps !== 'undefined') while (kino_S.k6i < Math.min(n, lamps.length)) lamps[kino_S.k6i++].mode = 'off'; },
      sfx: [[() => kino_vogel(8, 9, 186), .8], [() => kino_vogel(22, 10, 172, 4), 3], [() => kino_vogel(-4, 8, 180), 6.4]] },
    { from: [-12.2, 1.5, 205.2], to: [-12.6, 1.45, 205.8], look: [-13.9, 1.3, 207.6], dur: 8, fov: 38, env: 'dawn',
      setup(sh) { const H = typeof hungrige_S !== 'undefined' ? hungrige_S : null; sh.sk = H && H.skull ? H.skull.visible : null; if (H && H.skull) H.skull.visible = false; },
      sfx: [[() => kino_reh(-4, 2, 214), 3.5]] },
    { black: true, dur: 8, fadeOut: 1400, setup() { kino_still(true, 3); } },
  ], { name: 'Der Morgen', done() { kino_lamps(L => { if (L._m !== undefined) { L.mode = L._m; delete L._m; } }); kino_figOff('echt'); } });
}
// Dachfenster der Villa Seiler (Mansion-Scan aus ausbau_ost_west): vorn in der linken Gaube; ohne Hülle die Planwerte aus PK-F
function kino_villaFenster() { const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, vb = OW && OW.vbb; if (!vb) return { x: -125, y: 8.05, z: 66.2 };
  const w = vb.max.x - vb.min.x, h = vb.max.y - vb.min.y; return { x: vb.min.x + w * (kino_S.dachX ?? .36), y: vb.min.y + h * (kino_S.dachY ?? .78), z: vb.min.z + (kino_S.dachZ ?? .9) }; }
// Justins Helm (eigenes Teil am Skelett): für Ende C abnehmen
function kino_helm(on) { const S = kino_S; if (!justin || !justin.model) return null; if (!S.helm) { S.helm = []; justin.model.traverse(o => { if (o.isMesh && /helm|helmet/i.test(o.name + ' ' + (o.material && o.material.name || ''))) S.helm.push(o); }); }
  for (const m of S.helm) m.visible = on; return S.helm.length; }
// Augen: für einen Atemzug nur Weiß (K3B)
function kino_eyes(key, white) { const P = kino_S.fig[key]; if (!P) return; if (!P.eyes) { P.eyes = []; for (const [m] of P.mats) { const mats = [].concat(m.material); mats.forEach(x => { if (x && /eye|auge|cornea|iris/i.test((x.name || '') + ' ' + m.name)) P.eyes.push(x); }); } }
  for (const x of P.eyes) { if (!x.userData.kinoE) x.userData.kinoE = [x.emissive ? x.emissive.getHex() : 0, x.emissiveIntensity || 0]; if (x.emissive) { x.emissive.setHex(white ? 0xffffff : x.userData.kinoE[0]); x.emissiveIntensity = white ? 1.4 : x.userData.kinoE[1]; } } }

// ---------------------------------------------------------------- Testzugriff
window.__kino = { S: kino_S, play: (id, o) => kino_play(id, o), def: kino_def, busy: kino_busy, defs: KINO, skip: () => kino_skip(), schild: w => kino_schild(w),
  cam: (p, l, f = 60) => { setCamOverride(cam => { cam.position.set(...p); cam.lookAt(...l); if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }); }, free: () => { setCamOverride(null); camera.fov = fov; camera.updateProjectionMatrix(); },
  info: () => ({ vbb: typeof ausbau_ost_west_OW !== 'undefined' && ausbau_ost_west_OW.vbb ? [ausbau_ost_west_OW.vbb.min.toArray().map(v => +v.toFixed(2)), ausbau_ost_west_OW.vbb.max.toArray().map(v => +v.toFixed(2))] : null, zus: !!kino_S.zus, schild: kino_S.schild, loadT: kino_S.loadT, figs: Object.keys(kino_S.fig), objs: Object.keys(kino_S.obj), rabe: !!kino_S.rabe, pola: !!kino_S.pola2043, helm: kino_helm(true), sword: kino_S.swordAxis, ready: kino_S.ready }),
  mats: key => { const P = kino_S.fig[key]; return P ? P.mats.map(([m]) => m.name + ':' + [].concat(m.material).map(x => x.name).join('/')) : null; } };
