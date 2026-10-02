// =====================================================================  KINO (Modul „kino“): Kinosequenzen nach Fassung 3 (story_final.md, Abschnitt 5.5 „Kinosequenzen“, AP-10)
// Schnittstelle:
//   kino_play(id, opts?) → Promise, löst nach Ende/Überspringen auf. opts: { aufblenden: ms, nahtlos: true (ohne Schwarzblende beginnen), antwort: 'A'|'B'|'C', ... }
//   kino_def(id, shots, meta?) · kino_busy() · kino_karte(zeilen, opts?) → Promise (Endkarte Schreibmaschine, Zeile für Zeile je 2 s, auch außerhalb einer Sequenz)
//   kino_preload(set) · kino_blinzeln(dauer) · Testzugriff window.__kino: (play, def, seek, hold, skip, cam, free, info, fps)
//   meta: { name, skipAfter (Standard 3 s; Infinity = nicht überspringbar), nahtlos, offen (endet ohne Schwarz, Kamera bleibt beim Spieler), uebergabe (Blickrichtung
//          der letzten Einstellung wird die des Spielers), done(skipped), start(opts) }
// Einstellung (Daten): { dur, from, to, via, look, lookTo, lookVia, ease, fov, fovTo, roll, rollTo, hand, breathe, follow, frei, blick, blickT, shakes, lens, env, film,
//   fadeIn, black | white | card, lines: [[Text, Sprecher, s, ms?]], sfx: [[fn, s]], setup, tick(k, t, dt, sh), teardown, keepFlash }
//   from/to/look: [x,y,z] | Funktion(sh) → [x,y,z] | 'cam' (aktuelle Kamera) · frei: true = Spielerkamera (Kopf drehen möglich), blick: [x,y,z] zieht den Blick weich dorthin
//   lens: { at: [x,y,z] | fn, r, amt, to: { r, amt } } = Schärfentiefe-Anmutung (Fokuspunkt scharf, Rand weich; eigener, günstiger Nachbearbeitungs-Durchgang)
// Regeln (REGELN.md, PK-F): keine Lichter anlegen oder entfernen – nur Intensitäten vorhandener, beim Laden angelegter Lichter (VLights dieses Moduls, die Punktlicht-
// Reserve der Basis, die Taschenlampe, Laternen/Verandalampen über ihre Modi); Requisiten, Figuren-Klone und Texturen entstehen beim Laden und sind bis zum Einsatz
// unsichtbar; im Takt keine Zuweisungen neuer Objekte; nach jedem Schnitt PERF_CULL.t = 0; Luke nie von vorn (man sieht seinen Lichtkegel, seinen Schatten, eine Hand).
const kino_S = { on: false, id: null, def: null, i: -1, sh: null, t: 0, T: 0, li: 0, si: 0, skip: false, ending: false, res: null, sv: null, opts: null, ready: false, prevCam: null,
  fig: {}, obj: {}, act: [], env: null, film: null, lit: [], flash: null, pose: { p: new THREE.Vector3(), q: new THREE.Quaternion(), ok: false }, hold: false,
  v: new THREE.Vector3(), w: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Color(), q: new THREE.Quaternion(), q2: new THREE.Quaternion(),
  wPrev: new THREE.Vector3(), wOk: false, cp: new THREE.Vector3(), cw: new THREE.Vector3(), cvp: new THREE.Vector3(), cvw: new THREE.Vector3(), cs: false, fd: new THREE.Vector3(), tex: {}, ev: [], shk: [], lampFx: [], vl: [], lens: null, brumm: null, fps: { n: 0, t: 0, min: 999, lo: 0 } };
const KINO = {};
function kino_def(id, shots, meta = {}) { KINO[id] = Object.assign({ skipAfter: 3 }, meta, { id, shots, name: meta.name || id }); return KINO[id]; }
function kino_busy() { return kino_S.on; }
const kino_e = k => k * k * (3 - 2 * k); // weiche Kurve (PK-F)
const KINO_EASE = { smooth: kino_e, lin: k => k, in: k => k * k, out: k => 1 - (1 - k) * (1 - k), soft: k => k * k * k * (k * (k * 6 - 15) + 10), inout3: k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2 };
const kino_V = (x, y, z) => new THREE.Vector3(x, y, z);
const kino_cl = (v, a, b) => v < a ? a : v > b ? b : v;
const kino_ramp = (t, a, b) => kino_cl((t - a) / (b - a), 0, 1);

// ---------------------------------------------------------------- Aussehen: Endkarte (Schreibmaschine), Untertitel über den Balken, Polaroid, Lider
function kino_css() {
  if (typeof traum_css === 'function') traum_css(); if (document.getElementById('kinoCss')) return;
  const s = document.createElement('style'); s.id = 'kinoCss';
  s.textContent = `body.cine.kino #hud { opacity: 1 !important; z-index: 9; } body.cine.kino #subtitle { bottom: 3.2vh; }
  body.kino #questPop, body.kino #fearVig, body.kino #perf { opacity: 0 !important; }
  body.kino.kinoNoSkip #traumSkip { opacity: 0 !important; } body.kino.kinoFrei #traumBars::before { transform: translateY(-100%); } body.kino.kinoFrei #traumBars::after { transform: translateY(100%); }
  #kinoCard { position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; opacity: 0; transition: opacity .9s; }
  #kinoCard.on { opacity: 1; } #kinoCard p { margin: 0 0 14px; max-width: 820px; min-height: 1.5em; text-align: center; font: 21px/1.55 'Special Elite', 'Courier New', monospace; color: #d9cdb0; letter-spacing: .02em;
    text-shadow: 0 0 1px rgba(217,205,176,.5), 0 0 14px rgba(0,0,0,.9); white-space: pre-wrap; }
  #kinoCard p.t { font-size: 13px; letter-spacing: .38em; color: #c9a36a; margin-bottom: 30px; } #kinoCard p.k { font-size: 15px; color: #a89c82; margin-top: 8px; }
  #kinoCard p.s { font-size: 15px; color: #9a3a2e; letter-spacing: .12em; transform: rotate(-1.2deg); margin-top: 10px; }
  #kinoCard p i.cur { display: inline-block; width: .55em; height: 1.05em; margin-left: 2px; vertical-align: -2px; background: rgba(217,205,176,.75); animation: kinoCur 1s steps(1) infinite; font-style: normal; }
  @keyframes kinoCur { 50% { opacity: 0; } }
  #kinoPola { position: fixed; left: 50%; top: 47%; width: min(40vh, 70vw); aspect-ratio: 256 / 310; z-index: 10; pointer-events: none; perspective: 1400px; opacity: 0; transition: opacity 1.1s;
    transform: translate(-50%, -50%); } #kinoPola.on { opacity: 1; }
  #kinoPola .in { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 1.6s cubic-bezier(.45,.05,.3,1); transform: rotateZ(-3deg) rotateY(0deg); }
  #kinoPola.flip .in { transform: rotateZ(2deg) rotateY(180deg); }
  #kinoPola canvas { position: absolute; inset: 0; width: 100%; height: 100%; backface-visibility: hidden; box-shadow: 0 24px 60px rgba(0,0,0,.8); filter: sepia(.12) contrast(1.02); }
  #kinoPola canvas.back { transform: rotateY(180deg); }
  #kinoLid { position: fixed; inset: 0; z-index: 7; pointer-events: none; }
  #kinoLid::before, #kinoLid::after { content: ''; position: absolute; left: -5%; right: -5%; height: 52%; background: radial-gradient(ellipse 70% 120% at 50% 0%, #000 60%, rgba(0,0,0,.92) 80%, rgba(0,0,0,0) 100%);
    transition: transform .15s cubic-bezier(.55,0,.45,1); } #kinoLid::before { top: 0; transform: translateY(-104%); } #kinoLid::after { bottom: 0; transform: translateY(104%) scaleY(-1); }
  #kinoLid.zu::before { transform: translateY(0); } #kinoLid.zu::after { transform: translateY(0) scaleY(-1); }
  #kinoTear { position: fixed; inset: 0; z-index: 6; pointer-events: none; opacity: 0; transition: opacity 1.2s; background: radial-gradient(ellipse 95% 90% at 50% 50%, rgba(0,0,0,0) 62%, rgba(20,22,26,.22) 100%); backdrop-filter: blur(1.2px); }
  #kinoTear.on { opacity: 1; }`;
  document.head.appendChild(s);
  for (const id of ['kinoCard', 'kinoLid', 'kinoTear']) if (!document.getElementById(id)) { const c = document.createElement('div'); c.id = id; document.body.appendChild(c); }
  if (!document.getElementById('kinoPola')) { const p = document.createElement('div'); p.id = 'kinoPola'; p.innerHTML = '<div class="in"></div>'; document.body.appendChild(p); }
}
// Schreibmaschine: Zeile für Zeile, je 2 s; Anschlag leise hörbar. Zeilen: String oder { t, klein, stempel }. Rückgabe: Dauer in s
function kino_card(lines) { const c = $('kinoCard'); if (kino_S.tw) { kino_S.tw.stop = true; kino_S.tw = null; }
  if (!lines) { c.classList.remove('on'); return 0; }
  const L = lines.filter(x => x !== null && x !== undefined && x !== false).map(x => typeof x === 'string' ? { t: x } : x);
  c.innerHTML = L.map((l, i) => `<p class="${i === 0 ? 't' : l.stempel ? 's' : l.klein ? 'k' : ''}"></p>`).join(''); c.classList.add('on');
  const tw = kino_S.tw = { stop: false }, P = [...c.children];
  L.forEach((l, i) => { const txt = trX(l.t), at = .6 + i * 2; setTimeout(async () => { if (tw.stop) return; const p = P[i], n = txt.length, step = Math.min(.055, 1.5 / Math.max(1, n));
    for (let k = 1; k <= n; k++) { if (tw.stop) return; p.innerHTML = txt.slice(0, k).replace(/</g, '&lt;') + '<i class="cur"></i>'; if (txt[k - 1] !== ' ') kino_taste(l.stempel ? 1.8 : 1); await wait(step * 1000 * (l.stempel ? .5 : 1)); }
    if (l.stempel) kino_stempel(); p.innerHTML = txt.replace(/</g, '&lt;') + (i === L.length - 1 ? '<i class="cur"></i>' : ''); }, at * 1000); });
  return .6 + L.length * 2 + 2.6; }
// Endkarte außerhalb einer Sequenz (z. B. Kapitel 2 am Gully unter den Glockenschlägen): Schwarz, Karte, Promise nach Ende
async function kino_karte(lines, opts = {}) { kino_css(); const fd = $('fade'); fd.style.transition = 'opacity .6s'; fd.style.background = '#000'; fd.style.opacity = 1; document.body.classList.add('cine');
  const d = kino_card(lines); await wait((opts.dauer || d) * 1000); kino_card(null); await wait(900); if (!opts.bleiben) document.body.classList.remove('cine'); }
// Zeitgeber in Kinozeit (steht bei Pause still, verfällt beim Schnitt nicht – nur beim Ende)
function kino_after(sec, fn) { kino_S.ev.push([kino_S.T + sec, fn]); }
// Blinzeln: Lider schließen sich von oben und unten (0,15 s zu, 0,15 s auf) – das Spiel, nicht der Spieler
function kino_blinzeln(zu = .15, auf = .15, onZu) { kino_css(); const L = $('kinoLid'); L.style.setProperty('--d', zu + 's'); L.classList.add('zu'); kino_wimper();
  setTimeout(() => { try { onZu && onZu(); } catch (e) { console.warn('Kino: Blinzeln', e); } L.classList.remove('zu'); }, (zu + .02) * 1000); }

// ---------------------------------------------------------------- Klang (vorhandene Audio-Funktionen und Synth-Bausteine aus klang.js; alles über einen eigenen Bus)
function kino_bus() { const A = Audio; if (!A.ctx) return null; if (!kino_S.bus) { const g = A.ctx.createGain(); g.gain.value = 1; g.connect(A.master); if (A.musSend) g.connect(A.musSend); kino_S.bus = g; } return kino_S.bus; }
function kino_nz(A) { return A.noise(false); }
function kino_atem(v = .09, rate = 1, x, y, z) { // ein Atemzug: gefiltertes Rauschen, ein – aus
  const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = kino_nz(A), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 520 * rate; bp.Q.value = .8;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 1.1 / rate); g.gain.linearRampToValueAtTime(v * .15, t + 1.5 / rate); g.gain.linearRampToValueAtTime(v * .8, t + 2 / rate); g.gain.linearRampToValueAtTime(0, t + 3.2 / rate);
  n.connect(bp); bp.connect(g); g.connect(x !== undefined ? A.at(x, y, z, 1.2) : A.master); n.stop(t + 3.4 / rate); }
function kino_einatmen(v = .12, x, y, z, hoch = 1) { // Luftholen eines Kindes (Laterne auspusten, „tief Luft holen“)
  const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = kino_nz(A), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.1;
  bp.frequency.setValueAtTime(900 * hoch, t); bp.frequency.linearRampToValueAtTime(1700 * hoch, t + .55); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .45); g.gain.linearRampToValueAtTime(0, t + .62);
  n.connect(bp); bp.connect(g); g.connect(x !== undefined ? A.at(x, y, z, 2) : A.master); n.stop(t + .7); }
function kino_pusten(v = .1, x, y, z) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime + .05, n = kino_nz(A), lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.frequency.value = 1400;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .04); g.gain.exponentialRampToValueAtTime(.0005, t + .42); n.connect(lp); lp.connect(g); g.connect(x !== undefined ? A.at(x, y, z, 3) : A.master); n.stop(t + .5); }
function kino_cello(notes, t0 = 0, v = .05, cut = 900) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; const c = Audio.ctx; let t = c.currentTime + t0;
  for (const [n, d] of notes) { KI.bow(c, b, t, KN(n), d + .4, v, cut); t += d; } }
function kino_box(notes, t0 = 0, v = .06, rate = 1) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; const c = Audio.ctx; let t = c.currentTime + t0;
  notes.forEach((n, i) => { KI.box(c, b, t, KN(n) * rate, v); t += (.62 + i * .06) / Math.max(.4, rate); }); }
function kino_klavier(notes, t0 = 0, v = .12) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; const c = Audio.ctx; let t = c.currentTime + t0;
  for (const [n, d, len] of notes) { KI.piano(c, b, t, KN(n), v, len || 5); t += d; } }
function kino_streicher(n, dur, v = .03, t0 = 0, cut = 700) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; KI.bow(Audio.ctx, b, Audio.ctx.currentTime + t0, KN(n), dur, v, cut); }
function kino_vogel(x, y, z, n = 3) { if (Audio.vogel && Audio.vogel(x, y, z, n)) return; /* Aufnahme (Modul klang) */ const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, y, z, 6); let t = c.currentTime + rand(0, .3); const f0 = rand(2600, 3600);
  for (let i = 0; i < n; i++) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0 * rand(.9, 1.1), t); o.frequency.exponentialRampToValueAtTime(f0 * rand(1.25, 1.5), t + .07); o.frequency.exponentialRampToValueAtTime(f0 * .8, t + .13);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .015); g.gain.exponentialRampToValueAtTime(.0005, t + .15); o.connect(g); g.connect(d); o.start(t); o.stop(t + .17); t += rand(.16, .32); } }
function kino_amsel(x, y, z) { if (Audio.amsel && Audio.amsel(x, y, z)) return; /* Aufnahme (Modul klang) */ // die erste Amsel: flötende, absteigende Phrase mit Triller am Ende
  const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, y, z, 8); let t = c.currentTime + .05;
  const ph = [[1850, 2150, .16], [2400, 2250, .12], [2050, 1650, .22], [1700, 1900, .1], [2600, 2600, .05], [2700, 2500, .05], [2600, 2400, .05], [2750, 2450, .06]];
  for (const [f0, f1, d0] of ph) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d0);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.045, t + .02); g.gain.setValueAtTime(.04, t + d0 * .7); g.gain.exponentialRampToValueAtTime(.0004, t + d0 + .05); o.connect(g); g.connect(d); o.start(t); o.stop(t + d0 + .08); t += d0 + .035; } }
function kino_taube(x, y, z) { if (Audio.taube && Audio.taube(x, y, z)) return; /* Whiskeys Rabenkehle (Modul klang) */ // Taubenlaute (Whiskey bei Lucy): tiefes, rundes Gurren
  const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, y, z, 2); let t = c.currentTime;
  for (const [f, du] of [[420, .28], [380, .5], [440, .22], [360, .6]]) { const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), lf = c.createOscillator(), lg = c.createGain(); o.type = 'triangle'; o.frequency.value = f; lf.frequency.value = 22; lg.gain.value = f * .05; lf.connect(lg); lg.connect(o.frequency);
    lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .06); g.gain.linearRampToValueAtTime(0, t + du); o.connect(lp); lp.connect(g); g.connect(d); o.start(t); lf.start(t); o.stop(t + du + .05); lf.stop(t + du + .05); t += du + .08; } }
function kino_pling(x, y, z) { if (Audio.rabeTon && Audio.ctx && Audio.buf.fx_rabe_1) { const d = Audio.at(x, y, z, 3); Audio.rabeTon(1760, 0, .5, .1, d); Audio.rabeTon(1318, .24, .55, .08, d); return; } /* Whiskey ahmt die Mikrowelle nach */ const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, y, z, 3), t = c.currentTime; // Mikrowellen-Pling (Whiskeys Nachahmung)
  for (const [m, a] of [[1, 1], [2.02, .35], [3.9, .12]]) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.value = 1760 * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12 * a, t + .004); g.gain.exponentialRampToValueAtTime(.0004, t + 1.4); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1.5); } }
function kino_klapper(x, y, z, n = 1) { for (let i = 0; i < n; i++) Audio.play('woodHit3', { gain: .12, rate: 3.2, hp: 1200, dur: .06, delay: i * .09, x, y, z, ref: 1.5 }); } // Schnabelklappern
function kino_relais(x, y, z, v = .22) { Audio.play('switch1', { gain: v, rate: .62, hp: 400, x, y, z, ref: 4 }); Audio.play('metalHit2', { gain: v * .25, rate: 2.6, hp: 1500, dur: .08, delay: .02, x, y, z, ref: 4 }); }
function kino_kreide(x, y, z) { for (let i = 0; i < 3; i++) Audio.play(Audio.pick('scrape1', 'scrape3'), { gain: .16, rate: rand(2.4, 3), hp: 1800, dur: rand(.18, .3), delay: i * rand(.22, .34), x, y, z, ref: 1.5 }); }
function kino_trippeln(x, z, v = .06, n = 3) { for (let i = 0; i < n; i++) setTimeout(() => Audio.stepAt && Audio.stepAt(x + i * .18, z + rand(-.05, .05), v), i * 115); }
function kino_klingel(x, z) { if (Audio.ctx && Audio.buf.kb_spieluhr_A6) { for (let i = 0; i < 2; i++) Audio.play('kb_spieluhr_A6', { gain: .35, rate: .78, delay: i * .13, x, y: 1.1, z, ref: 25 }); return; } /* Glöckchen (Aufnahme) */ const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, 1.1, z, 25); for (let i = 0; i < 2; i++) { const t = c.currentTime + i * .13; for (const [m, a] of [[1, 1], [2.71, .4], [5.2, .15]]) { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 2080 * m; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05 * a, t + .003); g.gain.exponentialRampToValueAtTime(.0004, t + .9); o.connect(g); g.connect(d); o.start(t); o.stop(t + 1); } } } // Fahrradklingel, weit weg
function kino_kiesel(x, y, z) { Audio.play('stones1', { gain: .14, rate: rand(1.6, 2.1), dur: .5, hp: 700, x, y, z, ref: 1.2 }); }
function kino_stoff(v = .05) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = kino_nz(A), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .6;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .25); g.gain.linearRampToValueAtTime(v * .4, t + .6); g.gain.linearRampToValueAtTime(v, t + .9); g.gain.linearRampToValueAtTime(0, t + 1.5); n.connect(bp); bp.connect(g); g.connect(A.master); n.stop(t + 1.6); }
function kino_taste(v = 1) { if (Audio.ctx && Audio.buf.switch2) { Audio.play('switch2', { gain: .12 * v, rate: rand(1.4, 1.8), hp: 800, dest: Audio.master }); return; } /* Tastenklick (Aufnahme) */ const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = kino_nz(A), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = rand(2200, 3200); bp.Q.value = 2;
  g.gain.setValueAtTime(.05 * v, t); g.gain.exponentialRampToValueAtTime(.0005, t + .035); n.connect(bp); bp.connect(g); g.connect(A.master); n.stop(t + .05);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.value = 180; og.gain.setValueAtTime(.03 * v, t); og.gain.exponentialRampToValueAtTime(.0005, t + .04); o.connect(og); og.connect(A.master); o.start(t); o.stop(t + .05); }
function kino_stempel() { const A = Audio; if (!A.ctx) return; Audio.play('woodHit1', { gain: .35, rate: .8, lp: 900 }); }
function kino_wimper() { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = kino_nz(A), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 3; // nasser Wimpernschlag
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.07, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + .09); n.connect(bp); bp.connect(g); g.connect(A.master); n.stop(t + .12);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(300, t + .05); og.gain.setValueAtTime(.025, t); og.gain.exponentialRampToValueAtTime(.0004, t + .06); o.connect(og); og.connect(A.master); o.start(t); o.stop(t + .08); }
function kino_schlag(v = .9) { // einzelner tiefer Schlag wie eine Stahltür (kein Stinger)
  const A = Audio; if (!A.ctx) return; if (A.buf.fx_tief_2) { A.play('fx_tief_2', { gain: .8 * v }); Audio.play('metalSlam', { gain: .5 * v, rate: .55, lp: 700 }); return; } /* Aufnahme (Modul klang) */ const c = A.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(58, t); o.frequency.exponentialRampToValueAtTime(31, t + .9);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0005, t + 1.6); o.connect(g); g.connect(A.master); o.start(t); o.stop(t + 1.7);
  Audio.play('metalSlam', { gain: .5 * v, rate: .55, lp: 700 }); }
function kino_sub(v = 1) { const A = Audio; if (!A.ctx) return; if (A.buf.fx_tief_1) { A.play('fx_tief_1', { gain: .9 * v }); return; } /* Aufnahme (Modul klang) */ const c = A.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain(); o.frequency.setValueAtTime(40, t); o.frequency.exponentialRampToValueAtTime(26, t + 1.2); // 40 Hz, ein Schlag
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.3 * v, t + .006); g.gain.exponentialRampToValueAtTime(.0005, t + 1.8); o.connect(g); g.connect(A.master); o.start(t); o.stop(t + 1.9); }
function kino_herz(n = 3, bpm = 58, v = 1) { for (let i = 0; i < n; i++) setTimeout(() => Audio.play('heartbeat', { gain: 1.1 * v, offset: 0, dur: 1.05, lp: 260 }), i * 60000 / bpm); }
function kino_glocke(v = .75) { if (typeof leben_bellStrike === 'function') leben_bellStrike(v, false); } // einzelne Schläge der Kapellenglocke
// Brummen/Summen (Lichtschiff, Tank): eigene Oszillatoren am Kino-Bus, beim ersten Gebrauch der Sequenz angelegt, beim Ende gestoppt
function kino_brumm(level, sec = 1, f = 50) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, S = kino_S;
  if (!S.brumm) { if (level <= 0) return; const g = c.createGain(), lp = c.createBiquadFilter(); g.gain.value = 0; lp.type = 'lowpass'; lp.frequency.value = 240; lp.connect(g); g.connect(kino_bus() || A.master);
    const rb = A.buf[f < 45 ? 'amb_brumm' : 'amb_ufo']; if (rb) { const s = c.createBufferSource(), sg = c.createGain(); s.buffer = rb; s.loop = true; sg.gain.value = 1.3; s.connect(sg); sg.connect(g); s.start(0, Math.random() * rb.duration * .8); S.brumm = { g, os: [s], lp }; } // Aufnahme statt Oszillatoren (Modul klang)
    else { const os = [[f, 'sawtooth', .5], [f * 2.01, 'sine', .35], [f / 2, 'sine', .9], [f * 3.02, 'triangle', .08]].map(([fr, ty, a]) => { const o = c.createOscillator(), og = c.createGain(); o.type = ty; o.frequency.value = fr; og.gain.value = a; o.connect(og); og.connect(lp); o.start(); return o; });
    const lf = c.createOscillator(), lg = c.createGain(); lf.frequency.value = .23; lg.gain.value = 60; lf.connect(lg); lg.connect(lp.frequency); lf.start(); S.brumm = { g, os: os.concat(lf), lp }; } }
  const g = S.brumm.g.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(level * .22, t + Math.max(.02, sec)); }
function kino_brummAus() { const B = kino_S.brumm; if (!B || !Audio.ctx) return; const t = Audio.ctx.currentTime; B.g.gain.cancelScheduledValues(t); B.g.gain.setValueAtTime(B.g.gain.value, t); B.g.gain.linearRampToValueAtTime(0, t + .4); B.os.forEach(o => { try { o.stop(t + .5); } catch (e) {} }); kino_S.brumm = null; }
function kino_still(on, sec = 1.2) { // Stille: Welt und Betten (Regen, Wind) weg – Musik ist während der Sequenz ohnehin aus
  const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime, sv = kino_S.sv; if (!sv) return;
  for (const [n, v0] of [[A.world, sv.world], [A.bedTrim, sv.bed]]) if (n) { n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value, t); n.gain.linearRampToValueAtTime(on ? 0 : v0, t + sec); }
  if (A.rain) { A.rain.gain.cancelScheduledValues(t); A.rain.gain.setValueAtTime(A.rain.gain.value, t); A.rain.gain.linearRampToValueAtTime(on ? 0 : sv.rain, t + sec); } }
function kino_regen(k, sec = 1) { const A = Audio; if (!A.rain || !A.ctx) return; const t = A.ctx.currentTime; A.rain.gain.cancelScheduledValues(t); A.rain.gain.setValueAtTime(A.rain.gain.value, t); A.rain.gain.linearRampToValueAtTime(k, t + sec); }
// Tonabriss: alles für einen Moment weg (Kino-Bus, Welt, Regen, Brummen)
function kino_abriss(sec = .4) { const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime, m = A.master.gain; m.cancelScheduledValues(t); m.setValueAtTime(m.value, t); m.linearRampToValueAtTime(0, t + .03); m.setValueAtTime(0, t + sec); m.linearRampToValueAtTime(kino_S.sv ? kino_S.sv.master : 1, t + sec + .25); }

// ---------------------------------------------------------------- Linse: Schärfentiefe-Anmutung (Fokuspunkt scharf, Rand weich), ein eigener Durchgang vor dem Filmkorn
function kino_lensPass() { if (typeof ShaderPass === 'undefined' || !composer) return null;
  const p = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uAmt: { value: 0 }, uC: { value: new THREE.Vector2(.5, .5) }, uR: { value: .22 }, uAsp: { value: 1.7 }, uPx: { value: new THREE.Vector2(1 / 1600, 1 / 900) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt, uR, uAsp; uniform vec2 uC, uPx; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv - uC) * vec2(uAsp, 1.); float k = smoothstep(uR, uR + .42, length(d)) * uAmt;
        if (k < .02) { gl_FragColor = c; return; } vec3 s = c.rgb; float w = 1.;
        for (int i = 0; i < 16; i++) { float a = float(i) * 2.39996, r = sqrt((float(i) + .5) / 16.); vec2 o = vec2(cos(a), sin(a)) * r * k * 7.5 * uPx; vec3 x = texture2D(tDiffuse, vUv + o).rgb; float b = 1. + dot(x, vec3(.3, .5, .2)) * 1.5; s += x * b; w += b; }
        gl_FragColor = vec4(s / w, c.a); }` });
  const i = composer.passes.indexOf(filmPass); if (i < 0) return null; composer.insertPass(p, i); return p; }
function kino_lensSet(L, k, e) { const S = kino_S, P = S.lens; if (!P) return; if (!L) { P.uniforms.uAmt.value = 0; P.enabled = false; return; }
  const T = L.to, r = T && T.r !== undefined ? L.r + (T.r - L.r) * e : L.r, amt = T && T.amt !== undefined ? L.amt + (T.amt - L.amt) * e : L.amt;
  P.enabled = amt > .02; P.uniforms.uAmt.value = amt; P.uniforms.uR.value = r ?? .22; const cv = renderer.domElement; P.uniforms.uAsp.value = cv.width / Math.max(1, cv.height); P.uniforms.uPx.value.set(1 / cv.width * (cv.width / 1600), 1 / cv.height * (cv.height / 900));
  let at = L.at; if (typeof at === 'function') at = at(S.a); if (at) { if (Array.isArray(at)) S.a.set(at[0], at[1], at[2]); else if (at !== S.a) S.a.copy(at); S.a.project(camera); P.uniforms.uC.value.set(kino_cl(S.a.x * .5 + .5, 0, 1), kino_cl(S.a.y * .5 + .5, 0, 1)); }
  else P.uniforms.uC.value.set(L.c ? L.c[0] : .5, L.c ? L.c[1] : .5); }

// ---------------------------------------------------------------- Umgebung: Morgengrauen u. Ä. (je Bild nach update() gesetzt, danach wie vorher)
const KINO_ENV = {
  dawn: { fog: [0x8a8a8c, .02], sky: [0xb9a58e, 0x4a5a78, 1], hemi: [1.05, 0xa8b4cc, 0x3a342c], moon: [.45, 0xffd0aa], exp: 1.08, envI: .45 },
  morgen: { fog: [0x7d8590, .026], sky: [0x9aa0a8, 0x3c4a62, 1], hemi: [.95, 0x9aa8c0, 0x34302c], moon: [.3, 0xc8d4ea], exp: 1.12, envI: .4 },
  haze: { fog: [0x9a9088, .0075], sky: [0xcaa688, 0x4a5c80, 1], hemi: [1.25, 0xb0bcd0, 0x40362c], moon: [.6, 0xffcca4], exp: 1.12, envI: .5, far: 260 },
  white: { vig: .35, fog: [0xe8eaee, .016], sky: [0xf0f2f5, 0xf4f6f8, 1.4], hemi: [1.35, 0xffffff, 0xc8cace], moon: [0, 0xffffff], exp: .98, envI: .25 },
  vista: { fog: [0x0d1220, .011], far: 200 },
  nacht: { fog: [0x0b0f18, .022] },
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
  const cv = renderer.domElement; cv.style.transition = F && F.filterT !== undefined ? `filter ${F.filterT}s` : 'filter .25s'; cv.style.filter = F && F.filter ? F.filter : sv.filter; }

// ---------------------------------------------------------------- Figuren (aus figuren_load geklont, beim Laden vorbereitet): Clips mit weichen Übergängen, Blickziele, Gesten
const KINO_SIL = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 1, metalness: 0 }); // Gegenlicht: dunkler Stoff, keine Gesichter
// Knochen über Namen finden (CC „CC_Base_R_Upperarm“, Mixamo „mixamorig:RightArm“ …)
const KINO_BONE = { head: /^(head|headx)$/, neck: /^(neck|neckx|necktwist01|neck1|neck_01)$/, spine: /^(spine2|spine02|spine_02|spine_02x|spine1|spine01)$/, rArm: /^(rightarm|r_upperarm|upperarm_r|arm_stretchr|armr)$/, rFore: /^(rightforearm|r_forearm|lowerarm_r|forearm_stretchr|forearmr)$/,
  lArm: /^(leftarm|l_upperarm|upperarm_l|arm_stretchl|arml)$/, lFore: /^(leftforearm|l_forearm|lowerarm_l|forearm_stretchl|forearml)$/, rHand: /^(righthand|r_hand|hand_r|handr)$/, lHand: /^(lefthand|l_hand|hand_l|handl)$/, hips: /^(hips|hip|pelvis|rootx)$/,
  lThigh: /^(leftupleg|l_thigh|thigh_l|thigh_stretchl)$/, rThigh: /^(rightupleg|r_thigh|thigh_r|thigh_stretchr)$/, lCalf: /^(leftleg|l_calf|calf_l|leg_stretchl)$/, rCalf: /^(rightleg|r_calf|calf_r|leg_stretchr)$/, lFoot: /^(leftfoot|l_foot|foot_l|footl)$/, rFoot: /^(rightfoot|r_foot|foot_r|footr)$/ };
function kino_bones(o) { const m = {}; o.traverse(b => { if (!b.isBone) return; const n = b.name.replace(/^.*[:|]/, '').replace(/^mixamorig/i, '').replace(/^CC_Base_/i, '').replace(/_\d+$/, '').toLowerCase(); for (const k in KINO_BONE) if (!m[k] && KINO_BONE[k].test(n)) m[k] = b; }); return m; }
async function kino_mkFig(key, id) {
  try { const F = await figuren_load(id); if (!F) return null; const sk = await figuren_skc(), o = sk(F.scene); o.rotation.y = F.yaw || 0;
    const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; scene.add(g);
    const mats = []; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; mats.push([m, m.material]); } });
    const mx = new THREE.AnimationMixer(o), acts = {}; for (const [k, c] of Object.entries(F.clips)) acts[k] = mx.clipAction(c);
    const P = { key, id, g, obj: o, mx, acts, cur: null, mats, sil: false, doll: false, sit: false, bones: kino_bones(o), look: null, lookW: 0, lk: { y: 0, p: 0 }, pose: null, walkV: F.height > 1.5 ? 1.32 : 1.05, h: F.height || 1.7 };
    kino_S.fig[key] = P; kino_extraClips(P); return P; } catch (e) { console.warn('Kino: Figur ' + id, e); return null; }
}
// Zusätzliche Bewegungen aus der Werkstatt (assets/chars/<id>/kino.json: [AnimationClip.toJSON …]) – bestehende Figuren bleiben unberührt
async function kino_extraClips(P) { try { const r = await fetch('assets/chars/' + P.id + '/kino.json'); if (!r.ok) return; const L = await r.json();
  for (const j of L) { if (P.acts[j.name]) continue; const c = THREE.AnimationClip.parse(j); P.acts[c.name] = P.mx.clipAction(c); } } catch (e) {} } // Clips aus der Figur selbst (AP-MOCAP) haben Vorrang
function kino_play_(P, k, ts = 1, fade = .5, once = false) { if (!P) return; const a = P.acts[k] || P.acts.idle; if (!a) return; if (P.cur === a) { a.timeScale = ts; return; }
  const wA = a.enabled && a.isScheduled() ? a.getEffectiveWeight() : 0; a.reset(); if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity); a.setEffectiveWeight(1); a.play(); a.timeScale = ts;
  // P2: aus den aktuellen Gewichten überblenden (Summe 1 → keine Bindepose dazwischen, kein Hochspringen eines halb ausgeblendeten Clips)
  if (P.cur) for (const n in P.acts) { const b = P.acts[n]; if (b === a || !b.enabled || !b.isScheduled()) continue; const w = b.getEffectiveWeight(); if (fade > 0 && w > .001) { b.stopFading(); b._scheduleFading(fade, w, 0); } else b.stop(); }
  if (P.cur && fade > 0) a._scheduleFading(fade, wA, 1); P.cur = a; }
function kino_sil(P, on) { if (!P || P.sil === on) return; P.sil = on; for (const [m, mat] of P.mats) m.material = on ? KINO_SIL : mat; }
// Figur zeigen: Ort, Blickrichtung (rad), Bewegung; o: { sit, ts, t0, sil, look: [x,y,z] | Vector3 | 'cam', fade }
function kino_fig(key, x, y, z, ry, clip = 'idle', o = {}) { const P = kino_S.fig[key]; if (!P) return null; const g = P.g, war = g.visible && !!P.cur;
  g.position.set(x, y, z); g.rotation.set(o.rx || 0, ry, o.rz || 0); g.visible = true; kino_sil(P, !!o.sil);
  if (P.sit && !o.sit) { P.sit = false; P.obj.position.set(0, 0, 0); P.obj.scale.setScalar(1); }
  if (o.sit !== undefined && P.acts.sitzen && KINO_MOCAP_SITZ) { if (P.sit) { P.sit = false; P.obj.position.set(0, 0, 0); } kino_play_(P, 'sitzen', o.ts || 1, war ? .5 : 0); P.mx.update(o.t0 || .05); if (P.bones.hips) { g.updateMatrixWorld(true); P.bones.hips.getWorldPosition(kino_hp); g.position.y = o.sit + .08 - (kino_hp.y - g.position.y); } P.sitzClip = true; } // Hüfte knapp über der Sitzfläche: nichts schwebt, nichts steckt im Stuhl
  else if (o.sit !== undefined) { kino_play_(P, 'idle', 1, 0); P.mx.update(.3 + (o.t0 || 0)); g.updateMatrixWorld(true); if (typeof figuren_seat === 'function') { P.obj.position.set(0, 0, 0); figuren_seat({ g, obj: P.obj, mx: P.mx, doll: false, cur: P.cur, get sit() { return P.sit; }, set sit(v) { P.sit = v; } }, o.sit); P.cur = null; P.sit = true; } }
  else { kino_play_(P, clip, o.ts || 1, war ? (o.fade ?? .5) : 0); if (o.t0) P.mx.update(o.t0); }
  P.look = o.look || null; P.lookW = o.look ? 1 : 0; P.lk.y = P.lk.p = 0; P.pose = o.pose || null;
  if (!kino_S.act.includes(P)) kino_S.act.push(P); return P; }
const KINO_MOCAP_SITZ = false; // Motifect-Sitzen (kino.json „sitzen“) sitzt noch zu hoch/hinter der Lehne – bis AP-MOCAP „sit“ mit Fuß-IK liefert: prozedurale Sitzhaltung auf den Stühlen
function kino_figOff(key) { const P = kino_S.fig[key]; if (!P) return; P.g.visible = false; P.mimZ = null; P.ph = null; kino_sil(P, false); if (P.grau) kino_grau(P, false); P.look = null; P.pose = null; const i = kino_S.act.indexOf(P); if (i >= 0) kino_S.act.splice(i, 1); }
// Bone additiv um eine Weltachse drehen (nach dem Mixer): wirkt unabhängig von den Achsen des Skeletts
function kino_rotW(b, ax, ang) { if (!b || !ang) return; const S = kino_S, u = b.userData;
  // Knochen ohne Spur im laufenden Clip würden sich Bild für Bild weiterdrehen: beim ersten Eingriff je Bild auf die letzte Clip-Lage zurücksetzen
  if (u.kf !== S.frame) { u.kf = S.frame; if (!u.kQ0) { u.kQ0 = b.quaternion.clone(); u.kSet = new THREE.Quaternion(); } else if (u.kSet.equals(b.quaternion)) b.quaternion.copy(u.kQ0); else u.kQ0.copy(b.quaternion); } b.parent.getWorldQuaternion(S.q); S.q2.setFromAxisAngle(ax, ang); b.getWorldQuaternion(kino_S.qb || (kino_S.qb = new THREE.Quaternion()));
  S.qb.premultiply(S.q2); b.quaternion.copy(S.q.invert()).multiply(S.qb); b.updateMatrixWorld(true); u.kSet.copy(b.quaternion); }
const KINO_UP = new THREE.Vector3(0, 1, 0), kino_ax = new THREE.Vector3(), kino_fw = new THREE.Vector3(), kino_d = new THREE.Vector3(), kino_hp = new THREE.Vector3();
// Atmung: Brustkorb hebt sich (Wirbelsäule um die Querachse), Schultern gehen mit – Takt je Figur leicht verschieden
function kino_atmung(P) { const B = P.bones; if (!B.spine) return; P.at = (P.at || Math.random() * 6) ; const t = kino_S.T * (P.h > 1.5 ? 1.35 : 1.7) + P.at, a = Math.sin(t) * .5 + .5;
  P.g.getWorldDirection(kino_fw); kino_ax.crossVectors(kino_fw, KINO_UP).normalize(); kino_rotW(B.spine, kino_ax, -a * .018); if (B.neck) kino_rotW(B.neck, kino_ax, a * .012); }
// Kopf/Hals zum Blickziel drehen (begrenzt, geglättet), danach Gesten (P.pose(P, t) setzt Knochen additiv)
function kino_figPost(P, dt) { const B = P.bones, S = kino_S;
  if (P.look && B.head) { let L = P.look; if (L === 'cam') L = camera.position; else if (Array.isArray(L)) L = S.b.set(L[0], L[1], L[2]);
    B.head.getWorldPosition(kino_hp); kino_d.copy(L).sub(kino_hp); P.g.getWorldDirection(kino_fw); kino_fw.y = 0; kino_fw.normalize();
    const dh = Math.hypot(kino_d.x, kino_d.z) || 1e-3, yaw = Math.atan2(kino_fw.x * kino_d.z - kino_fw.z * kino_d.x, kino_fw.x * kino_d.x + kino_fw.z * kino_d.z), pit = Math.atan2(kino_d.y, dh);
    const k = 1 - Math.exp(-dt * 4.5); const hinten = Math.abs(yaw) > 1.9; // P2: Ziel hinter der Figur → Kopf zur Mitte statt von +72° auf −72° umzuschlagen
    P.lk.y += ((hinten ? 0 : kino_cl(-yaw, -1.25, 1.25)) * P.lookW - P.lk.y) * k; P.lk.p += ((hinten ? 0 : kino_cl(pit, -.6, .5)) * P.lookW - P.lk.p) * k;
    kino_rotW(B.neck, KINO_UP, P.lk.y * .4); kino_rotW(B.head, KINO_UP, P.lk.y * .6);
    kino_fw.applyAxisAngle(KINO_UP, P.lk.y); kino_ax.crossVectors(kino_fw, KINO_UP).normalize(); kino_rotW(B.neck, kino_ax, P.lk.p * .35); kino_rotW(B.head, kino_ax, P.lk.p * .65); }
  if (P.pose) try { P.pose(P, S.t, dt); } catch (e) { P.pose = null; console.warn('Kino: Geste', e); } }
// Geste: Arm zum Ziel heben (Oberarm/Unterarm um die Achse quer zur Zielrichtung), w = 0…1
// Knochen in eine Weltrichtung drehen (Richtung Knochen → Kindknochen), w = 0…1 – für Körperreaktionen auf Kräfte (R-4, CLAUDE.md §17)
function kino_richte(b, dir, w) { if (!b || !w) return; const c = b.children.find(o => o.isBone) || b.children[0]; if (!c) return; b.getWorldPosition(kino_hp); c.getWorldPosition(kino_fw); kino_fw.sub(kino_hp); const l = kino_fw.length(); if (l < 1e-5) return; kino_fw.divideScalar(l);
  kino_ax.crossVectors(kino_fw, dir); const s = kino_ax.length(); if (s < 1e-5) return; kino_ax.divideScalar(s); kino_rotW(b, kino_ax, Math.atan2(s, kino_fw.dot(dir)) * w); }
function kino_arm(P, side, target, w, bend = .35) { const B = P.bones, up = side === 'r' ? B.rArm : B.lArm, fo = side === 'r' ? B.rFore : B.lFore; if (!up || !w) return;
  up.getWorldPosition(kino_hp); kino_d.copy(target).sub(kino_hp).normalize(); fo.getWorldPosition(kino_fw); kino_fw.sub(kino_hp).normalize();
  kino_ax.crossVectors(kino_fw, kino_d); const s = kino_ax.length(); if (s < 1e-4) return; kino_ax.divideScalar(s); const ang = Math.atan2(s, kino_fw.dot(kino_d)) * w;
  kino_rotW(up, kino_ax, ang); if (fo) kino_rotW(fo, kino_ax, -bend * w * .5); }
// Gehen ohne Gleiten: Position mit Geschwindigkeit v, Schrittfrequenz passend (ts = v / Gehtempo des Clips)
function kino_gehen(P, x0, z0, x1, z1, t, v, clip = 'walk') { if (!P) return 1; const d = Math.hypot(x1 - x0, z1 - z0) || 1e-3, s = Math.min(d, Math.max(0, t) * v), k = s / d;
  P.g.position.x = x0 + (x1 - x0) * k; P.g.position.z = z0 + (z1 - z0) * k; P.g.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  if (k < 1) kino_play_(P, clip, v / P.walkV, .35); else kino_play_(P, 'idle', 1, .6); return k; }
const KINO_NORAY = () => {};
function kino_obj(key, o) { o.visible = false; o.userData.noCol = true; o.traverse(m => { m.userData.noCol = true; m.raycast = KINO_NORAY; }); scene.add(o); kino_S.obj[key] = o; return o; }
function kino_show(key, x, y, z, ry = 0) { const o = kino_S.obj[key]; if (!o) return null; if (x !== undefined) { o.position.set(x, y, z); o.rotation.y = ry; } o.visible = true; return o; }
function kino_hide(...keys) { for (const k of keys) { const o = kino_S.obj[k]; if (o) o.visible = false; } }
// Leuchtende Sprites (keine Lichter): Flamme, Schein – beim Laden angelegt
function kino_glowTex(kind) { return tex(cnv(128, (c, w) => { const g = c.createRadialGradient(w / 2, kind === 'flame' ? w * .62 : w / 2, 0, w / 2, kind === 'flame' ? w * .62 : w / 2, w / 2);
  if (kind === 'flame') { c.clearRect(0, 0, w, w); c.save(); c.translate(w / 2, w * .9); c.scale(.2, 1); const f = c.createRadialGradient(0, -w * .38, 0, 0, -w * .38, w * .5); f.addColorStop(0, 'rgba(255,255,255,1)'); f.addColorStop(.35, 'rgba(225,238,255,.85)'); f.addColorStop(.7, 'rgba(150,185,255,.25)'); f.addColorStop(1, 'rgba(120,160,255,0)');
    c.fillStyle = f; c.beginPath(); c.ellipse(0, -w * .38, w * .5, w * .45, 0, 0, 7); c.fill(); c.restore(); return; }
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(.6, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }), true); }
function kino_sprite(key, texture, color, size, fog = true, add = true) { const m = new THREE.SpriteMaterial({ map: texture, color, transparent: true, depthWrite: false, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, fog, opacity: 1 });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return kino_obj(key, s); }
// Papier-/Abdruck-Flächen (Decals erlaubt)
function kino_decal(key, canvas, w, h, o = {}) { const m = new (o.phys ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial)({ map: tex(canvas, true), transparent: true, depthWrite: false, roughness: o.rough ?? .9, metalness: o.metal ?? 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  polygonOffset: true, polygonOffsetFactor: -2, opacity: o.opacity ?? 1, color: o.color ?? 0xffffff });
  if (o.phys) { m.clearcoat = 1; m.clearcoatRoughness = .06; }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.receiveShadow = true; p.castShadow = !!o.cast; return kino_obj(key, p); }

// ---------------------------------------------------------------- Texturen (beim Laden gezeichnet)
function kino_tex_papa() { return cnv(512, (c, w) => { // Kinderzeichnung vor dem achten Stuhl: „PAPA + ICH“, signiert mit einem halben Mond
  c.fillStyle = '#e9e1cc'; c.fillRect(0, 0, w, w); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(90,70,40,${rand(.01, .05)})`; c.fillRect(rand(0, w), rand(0, w), rand(1, 3), rand(1, 3)); }
  const cray = (col, lw, pts) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { c.globalAlpha = .45; c.beginPath(); pts.forEach(([x, y], i) => { const X = x + rand(-2, 2), Y = y + rand(-2, 2); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); } c.globalAlpha = 1; };
  const grey = '#55585e', pink = '#b04a60', yel = '#d8a820';
  cray(grey, 7, [[150, 128], [206, 128], [206, 190], [150, 190], [150, 128]]); cray('#222', 4, [[158, 158], [198, 158]]); cray('#222', 5, [[160, 118], [178, 96], [196, 118]]); // Helm mit Sehschlitz und Zacken
  cray(grey, 8, [[178, 190], [178, 330]]); cray(grey, 7, [[130, 215], [226, 215]]); cray(grey, 7, [[178, 330], [148, 430]]); cray(grey, 7, [[178, 330], [210, 430]]);
  cray('#888', 5, [[130, 215], [118, 150]]); cray('#999', 4, [[112, 170], [112, 60]]);
  cray(pink, 6, [[330, 250], [330, 330]]); c.fillStyle = 'rgba(176,74,96,.35)'; c.beginPath(); c.moveTo(330, 280); c.lineTo(290, 380); c.lineTo(370, 380); c.fill(); cray(pink, 5, [[330, 280], [290, 380], [370, 380], [330, 280]]);
  c.strokeStyle = '#6a4a2a'; c.lineWidth = 5; c.beginPath(); c.arc(330, 228, 24, 0, 7); c.stroke();
  cray(pink, 5, [[306, 290], [226, 215]]); cray(pink, 5, [[312, 380], [305, 440]]); cray(pink, 5, [[350, 380], [356, 440]]);
  c.strokeStyle = yel; c.lineWidth = 5; c.beginPath(); c.arc(430, 80, 26, 0, 7); c.stroke(); for (let a = 0; a < 6.28; a += .8) cray(yel, 3, [[430 + Math.cos(a) * 34, 80 + Math.sin(a) * 34], [430 + Math.cos(a) * 48, 80 + Math.sin(a) * 48]]);
  c.fillStyle = '#b3261e'; c.font = 'bold 56px "Comic Sans MS", cursive'; c.save(); c.translate(70, 488); c.rotate(-.04); c.globalAlpha = .85; c.fillText('PAPA + ICH', 0, 0); c.restore();
  c.strokeStyle = '#3a3a8a'; c.lineWidth = 5; c.beginPath(); c.arc(452, 466, 20, -PI / 2, PI / 2); c.stroke(); }); } // halber Mond
function kino_tex_hand(big = 1) { return cnv(128, (c, w) => { c.clearRect(0, 0, w, w); c.fillStyle = 'rgba(235,245,250,.55)'; c.filter = 'blur(2px)';
  c.beginPath(); c.ellipse(64, 84, 26 * big, 30 * big, 0, 0, 7); c.fill(); [[34, 48, 9, 26, -.5], [48, 30, 8, 30, -.15], [64, 24, 8, 32, 0], [80, 30, 8, 30, .15], [100, 60, 8, 22, .8]].forEach(([x, y, rx, ry, a]) => { c.beginPath(); c.ellipse(64 + (x - 64) * big, 84 + (y - 84) * big, rx * big, ry * big, a, 0, 7); c.fill(); }); c.filter = 'none'; }); }
function kino_tex_shadow() { return cnv(256, (c, w) => { c.clearRect(0, 0, w, w); c.filter = 'blur(9px)'; c.fillStyle = 'rgba(0,0,0,.8)';
  c.beginPath(); c.ellipse(128, 84, 36, 44, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(40, 256); c.quadraticCurveTo(44, 150, 128, 134); c.quadraticCurveTo(212, 150, 216, 256); c.fill(); c.filter = 'none'; }); }
function kino_tex_wet() { return cnv(256, (c, w) => { c.clearRect(0, 0, w, w); const g = c.createRadialGradient(128, 128, 10, 128, 128, 124); g.addColorStop(0, 'rgba(20,24,30,.75)'); g.addColorStop(.7, 'rgba(20,24,30,.5)'); g.addColorStop(1, 'rgba(20,24,30,0)');
  c.fillStyle = g; for (let i = 0; i < 9; i++) { c.beginPath(); c.ellipse(128 + rand(-30, 30), 128 + rand(-30, 30), rand(60, 110), rand(50, 100), rand(0, 3), 0, 7); c.fill(); } }); }
function kino_tex_ring() { return cnv(256, (c, w) => { c.fillStyle = '#23231f'; c.fillRect(0, 0, w, w); for (let i = 0; i < 2000; i++) { c.fillStyle = `rgba(255,255,255,${rand(0, .06)})`; c.fillRect(rand(0, w), rand(0, w), 2, 2); }
  c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(w / 2, w / 2, w * .34, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; c.strokeStyle = '#3a3830'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, w / 2, w * .36, 0, 7); c.stroke(); }); }
// Hildes Lesebrille an der Perlenkette, ein Glas gesprungen (Aufsicht; Rückfall bis ein Modell da ist – im Bericht gemeldet)
function kino_tex_brille() { return cnv(1024, (c, w) => { c.clearRect(0, 0, w, w); const cx = w / 2, cy = w * .47;
  c.save(); c.translate(cx, cy); c.rotate(-.18);
  const lens = (x, crack) => { c.save(); c.translate(x, 0); c.beginPath(); c.ellipse(0, 0, 112, 84, 0, 0, 7);
    const g = c.createRadialGradient(-30, -26, 8, 0, 0, 120); g.addColorStop(0, 'rgba(200,210,220,.10)'); g.addColorStop(.6, 'rgba(90,100,110,.12)'); g.addColorStop(1, 'rgba(40,44,50,.3)'); c.fillStyle = g; c.fill();
    c.lineWidth = 13; c.strokeStyle = '#2a1d14'; c.stroke(); c.lineWidth = 3; c.strokeStyle = 'rgba(200,160,110,.55)'; c.beginPath(); c.ellipse(-3, -3, 106, 78, 0, 3.6, 5.6); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-44, -36, 24, 6, -.5, 0, 7); c.fill();
    if (crack) { c.strokeStyle = 'rgba(245,250,255,.85)'; c.lineWidth = 2.2; for (let i = 0; i < 9; i++) { let a = i / 9 * 6.28 + rand(-.2, .2), r = 0, px = 18, py = -10; c.beginPath(); c.moveTo(px, py);
        while (r < 110) { r += rand(14, 30); a += rand(-.35, .35); const nx = 18 + Math.cos(a) * r, ny = -10 + Math.sin(a) * r * .75; if (nx * nx / 12544 + ny * ny / 7056 > 1) break; c.lineTo(nx, ny); } c.stroke(); }
      c.beginPath(); c.arc(18, -10, 7, 0, 7); c.fillStyle = 'rgba(255,255,255,.6)'; c.fill(); }
    c.restore(); };
  lens(-128, false); lens(128, true);
  c.lineWidth = 12; c.strokeStyle = '#2a1d14'; c.beginPath(); c.moveTo(-18, -22); c.quadraticCurveTo(0, -44, 18, -22); c.stroke();
  c.lineWidth = 11; c.beginPath(); c.moveTo(-238, -18); c.lineTo(-340, 30); c.moveTo(238, -18); c.quadraticCurveTo(300, 60, 250, 120); c.stroke(); // Bügel, einer eingeklappt
  c.restore();
  // Perlenkette: an beiden Bügeln, in einem losen Bogen auf dem Asphalt
  const pts = []; for (let i = 0; i <= 60; i++) { const k = i / 60, a = -PI * .15 + k * PI * 1.25; pts.push([cx - 300 + Math.cos(a) * 280 + k * 520, cy + 210 + Math.sin(a) * 170 - k * 60]); }
  for (let i = 0; i < pts.length; i += 1) { const [x, y] = pts[i]; const g = c.createRadialGradient(x - 3, y - 3, 1, x, y, 10); g.addColorStop(0, '#fbf6ea'); g.addColorStop(.6, '#d8cdb8'); g.addColorStop(1, 'rgba(90,80,70,.9)');
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(x + 3, y + 4, 10, 0, 7); c.fill(); c.fillStyle = g; c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); } }); }
// Brille zeigen: Modell (mit Perlenkette), sonst das alte Bild
function kino_brille(x, z, ry) { const m = kino_S.obj.brilleM; if (m) { kino_show('brilleM', x, 0, z, ry); return m; } const b = kino_show('brille', x, .024, z); if (b) b.rotation.set(-PI / 2, 0, ry); return b; }
// Zeichnung von der Kellerwand: das Mädchen mit der Laterne, „LUKE, 9“
function kino_tex_zeichnung() { return cnv(512, (c, w) => { c.fillStyle = '#ddd2b6'; c.fillRect(0, 0, w, w); for (let i = 0; i < 700; i++) { c.fillStyle = `rgba(80,60,30,${rand(.01, .05)})`; c.fillRect(rand(0, w), rand(0, w), rand(1, 3), rand(1, 3)); }
  const cr = (col, lw, pts) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { c.globalAlpha = .45; c.beginPath(); pts.forEach(([x, y], i) => { const X = x + rand(-2, 2), Y = y + rand(-2, 2); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke(); } c.globalAlpha = 1; };
  c.fillStyle = 'rgba(40,40,70,.9)'; c.fillRect(0, 0, w, 150); cr('#222', 5, [[250, 150], [250, 330]]); cr('#222', 5, [[250, 330], [215, 440]]); cr('#222', 5, [[250, 330], [285, 440]]);
  c.strokeStyle = '#222'; c.lineWidth = 5; c.beginPath(); c.arc(250, 132, 26, 0, 7); c.stroke(); cr('#222', 5, [[250, 200], [320, 240]]); cr('#222', 5, [[250, 200], [190, 250]]);
  const g = c.createRadialGradient(330, 262, 4, 330, 262, 70); g.addColorStop(0, 'rgba(255,220,120,.95)'); g.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = g; c.fillRect(250, 190, 160, 160);
  cr('#b07020', 4, [[320, 240], [330, 245], [345, 290], [315, 290], [330, 245]]); cr('#222', 3, [[230, 128], [236, 128]]); cr('#222', 3, [[262, 128], [268, 128]]);
  c.fillStyle = '#1a1a1a'; c.font = '34px "Comic Sans MS", cursive'; c.save(); c.translate(300, 488); c.rotate(-.05); c.fillText('LUKE, 9', 0, 0); c.restore();
  c.fillStyle = 'rgba(150,150,150,.9)'; c.beginPath(); c.arc(256, 14, 6, 0, 7); c.fill(); }); }
function kino_tex_feder() { return cnv(256, (c, w) => { c.clearRect(0, 0, w, w); c.save(); c.translate(128, 250); c.rotate(-.05); // breite schwarze Feder, alt, am Kiel abgerissen
  c.strokeStyle = '#2a2622'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(6, -120, 0, -240); c.stroke();
  for (let i = 0; i < 90; i++) { const y = -10 - i * 2.5, L = 34 * Math.sin(Math.min(1, i / 70) * PI * .9) + 6; for (const s of [-1, 1]) { c.strokeStyle = `rgba(${14 + rand(0, 16)},${14 + rand(0, 14)},${18 + rand(0, 18)},${rand(.75, .95)})`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(s * 1, y); c.quadraticCurveTo(s * L * .6, y - 6, s * L * (i % 13 === 0 ? .7 : 1), y - 14 + rand(-3, 3)); c.stroke(); } }
  c.restore(); }); }
function kino_tex_band() { return cnv(512, (c, w) => { c.clearRect(0, 0, w, w); c.fillStyle = 'rgba(236,238,232,.92)'; c.fillRect(0, 170, w, 170); c.fillStyle = 'rgba(140,150,160,.25)'; for (let i = 0; i < 12; i++) c.fillRect(0, 175 + i * 14, w, 1);
  c.fillStyle = '#1d2a4a'; c.font = 'bold 64px "Courier New", monospace'; c.fillText('KRANZ, P.', 40, 268); c.font = '28px "Courier New", monospace'; c.fillText('K-1 · 1992', 44, 310);
  c.fillStyle = 'rgba(80,60,40,.25)'; for (let i = 0; i < 300; i++) c.fillRect(rand(0, w), rand(170, 340), rand(1, 4), rand(1, 3)); }); }
function kino_tex_brand() { return cnv(512, (c, w) => { c.clearRect(0, 0, w, w); c.filter = 'blur(1.2px)';
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, x = 256 + Math.cos(a) * 150, y = 256 + Math.sin(a) * 110, r = 38; const g = c.createRadialGradient(x, y, r * .55, x, y, r * 1.35);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.35, 'rgba(18,10,6,.92)'); g.addColorStop(.6, 'rgba(60,30,16,.6)'); g.addColorStop(1, 'rgba(60,30,16,0)'); c.fillStyle = g;
    if (i === 7) { c.save(); c.beginPath(); c.rect(x - 60, y - 60, 60, 120); c.clip(); c.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3); c.restore(); } else c.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3); }
  c.filter = 'none'; }); }
// ---------------------------------------------------------------- R-9 · Das graue Gesicht als echter Kopf (statt gemalter Fläche)
// Quelle: der NoEdge/CC-Kinderkopf des Graukinds (Figur „graukind“, Ordner kleine), in der Ruhepose eingebacken. Graue, wächserne Haut (Umgriff-Licht als
// Streulicht-Näherung, feine Adern an Schläfen/unter den Augen, feuchter Klarlack), schwarze glasige Augen, kein Mund (Bibel: Lippen per Geometrie zu Haut
// zugezogen, Farb-/Normalendetail dort ausgeblendet). Ursprung = Mitte zwischen den Augen, +z = Blickrichtung, Meter.
// Uniforms: uPlane (lokale z-Ebene, an der das Gesicht platt gedrückt wird – Tankglas), uMund (die Haut wölbt sich, wo der Mund wäre), uNass (Feuchte).
const KINO_GK = { uPlane: { value: 1 }, uMund: { value: 0 }, uNass: { value: 1 } };
function kino_gkHaut(map, nmap) {
  const m = new THREE.MeshPhysicalMaterial({ map: map || null, normalMap: nmap || null, color: 0xffffff, roughness: .5, metalness: 0, clearcoat: .6, clearcoatRoughness: .32, sheen: .4, sheenColor: new THREE.Color(.6, .62, .67), sheenRoughness: .5, envMapIntensity: .6 });
  const lp = THREE.ShaderChunk.lights_physical_pars_fragment.replace('vec3 irradiance = dotNL * directLight.color;', // Umgriff: Licht greift über die Schattengrenze, dort leicht warm (Haut, nicht Gips)
    'float gkW = saturate((dot(geometryNormal, directLight.direction) + .45) / 1.45); vec3 irradiance = mix(vec3(dotNL), gkW * vec3(1., .9, .87), .55) * directLight.color;');
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, KINO_GK);
    sh.vertexShader = 'attribute float aMask; varying float vMask; varying float vPress; varying vec3 vLoc; uniform float uPlane; uniform float uMund;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
        float gkOver = position.z - uPlane; vPress = clamp(gkOver / .005, 0., 1.); objectNormal = normalize(mix(objectNormal, vec3(0., 0., 1.), vPress * .9));`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vMask = aMask; vLoc = position; transformed += normal * aMask * uMund * .0026;
        if (gkOver > 0.) { transformed.z = uPlane + gkOver * .08; transformed.xy *= 1. + gkOver * 1.8; }`);
    sh.fragmentShader = 'varying float vMask; varying float vPress; varying vec3 vLoc; uniform float uNass;\n' +
      'float gkH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }\n' +
      'float gkN(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(mix(gkH(i), gkH(i + vec3(1., 0., 0.)), f.x), mix(gkH(i + vec3(0., 1., 0.)), gkH(i + vec3(1., 1., 0.)), f.x), f.y), mix(mix(gkH(i + vec3(0., 0., 1.)), gkH(i + vec3(1., 0., 1.)), f.x), mix(gkH(i + vec3(0., 1., 1.)), gkH(i + vec3(1., 1., 1.)), f.x), f.y), f.z); }\n' +
      sh.fragmentShader.replace('#include <lights_physical_pars_fragment>', lp)
      .replace('#include <map_fragment>', `#include <map_fragment>
        { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); l = mix(l, .5, vMask * .9);
          vec3 c = vec3(.55, .58, .62) * (.5 + l * .95);
          float v1 = 1. - smoothstep(.0, .05, abs(gkN(vLoc * 150.) - .5)), v2 = 1. - smoothstep(.0, .06, abs(gkN(vLoc * 70. + 3.1) - .5));
          float vm = smoothstep(.014, .045, abs(vLoc.x)) * smoothstep(-.012, .03, vLoc.y) + smoothstep(.016, .0, abs(vLoc.y + .014)) * smoothstep(.022, .05, abs(vLoc.x)) * .7;
          c = mix(c, vec3(.34, .37, .47), clamp(v1 * .6 + v2 * .4, 0., 1.) * vm * .6);
          c = mix(c, c * 1.17 + vec3(.035, .03, .03), vPress * .85); diffuseColor.rgb = c; }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        normal = normalize(mix(normal, nonPerturbedNormal, clamp(vMask * .85 + vPress * .6, 0., 1.)));`)
      .replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
        material.clearcoat *= uNass; material.clearcoatRoughness = clamp(material.clearcoatRoughness * (.45 + gkN(vLoc * 90.) * 1.1), .04, 1.);`); };
  m.customProgramCacheKey = () => 'kino_grauHaut'; return m; }
// Mund schließen (Bibel: kein Mund): p = Lagen im Gesichtsrahmen (Meter, Ursprung zwischen den Augen, +z vorn, Augenabstand 5,4 cm). Lippen und Mundhöhle werden auf eine
// glatte Hautfläche zwischen Oberlippen-Ansatz und Kinn gezogen (Profil des Kopfes: Mund bei y ≈ −0,98 Augenabstände). Rückgabe: Maske je Ecke (0…1)
// Ecken, die ein Teilnetz wirklich benutzt (CC-Figuren teilen sich Puffer: Kopf+Wimpern, beide Augen in einem)
function kino_benutzt(g) { const n = g.attributes.position.count, u = new Uint8Array(n); if (!g.index) { u.fill(1); return u; } const I = g.index.array; for (let i = 0; i < I.length; i++) u[I[i]] = 1; return u; }
function kino_mundZu(p, n, u) { const U = .054, zt = [], zb = [], bin = X => Math.max(0, Math.min(16, Math.round((X / U + .8) * 10)));
  for (let i = 0; i < n; i++) { if (u && !u[i]) continue; const X = p[i * 3], Y = p[i * 3 + 1] / U, Z = p[i * 3 + 2]; if (Z < 0) continue; const b = bin(X);
    if (Math.abs(Y + .8) < .045) zt[b] = Math.max(zt[b] ?? -1, Z); if (Math.abs(Y + 1.2) < .045) zb[b] = Math.max(zb[b] ?? -1, Z); }
  const fuell = A => { for (let i = 0; i < 17; i++) if (A[i] === undefined) { let d = 1; while (d < 17 && A[i - d] === undefined && A[i + d] === undefined) d++; A[i] = A[i - d] ?? A[i + d] ?? .02; } }; fuell(zt); fuell(zb);
  const mask = new Float32Array(n);
  for (let i = 0; i < n; i++) { if (u && !u[i]) continue; const X = p[i * 3], Y = p[i * 3 + 1] / U, Z = p[i * 3 + 2]; if (Z < -.3 * U) continue;
    const r = Math.hypot(X / U / .56, (Y + .98) / .24), m = 1 - kino_cl((r - .7) / .55, 0, 1); if (m <= 0) continue; const s = m * m * (3 - 2 * m);
    const t = kino_cl((-.8 - Y) / .4, 0, 1), b = bin(X), z = zt[b] + (zb[b] - zt[b]) * t + .02 * U * Math.sin(Math.PI * t);
    p[i * 3 + 2] = Z + ((Z > z - .12 * U ? z : z - .04 * U) - Z) * s; mask[i] = s; }
  return mask; }
// Gesichtsrahmen aus Kopf- und Augennetz (Geometrie-Raum): { E, x, up, f, k } – k = Meter je Einheit (Augenabstand 5,4 cm)
function kino_gesichtsRahmen(hp, hn, lp, ln, rp, rn, hu, lu, ru) { const T = THREE, v = new T.Vector3(), mitte = (p, n, u) => { const c = new T.Vector3(); let k = 0; for (let i = 0; i < n; i++) { if (u && !u[i]) continue; c.x += p[i * 3]; c.y += p[i * 3 + 1]; c.z += p[i * 3 + 2]; k++; } return c.divideScalar(Math.max(1, k)); };
  const L = mitte(lp, ln, lu), R = mitte(rp, rn, ru), E = L.clone().add(R).multiplyScalar(.5), ipd = L.distanceTo(R); if (!(ipd > 0)) return null;
  const bb = new T.Box3(); for (let i = 0; i < hn; i++) if (!hu || hu[i]) bb.expandByPoint(v.set(hp[i * 3], hp[i * 3 + 1], hp[i * 3 + 2])); const sz = bb.getSize(new T.Vector3());
  const ax = sz.x > sz.y ? (sz.x > sz.z ? 0 : 2) : (sz.y > sz.z ? 1 : 2), e = E.getComponent(ax), up = new T.Vector3().setComponent(ax, bb.max.getComponent(ax) - e < e - bb.min.getComponent(ax) ? 1 : -1);
  const x = L.clone().sub(R).normalize(); up.addScaledVector(x, -up.dot(x)).normalize(); const f = new T.Vector3().crossVectors(x, up);
  if (mitte(hp, hn, hu).sub(E).dot(f) > 0) { f.negate(); x.negate(); } return { E, x, up, f, k: .054 / ipd, L, R }; }
// Mundlose Fassung eines Figuren-Kopfnetzes (SkinnedMesh, Geometrie-Raum) – für die Behaltenen im Kino; null, wenn die Teile fehlen
function kino_mundlosGeo(H, EL, ER) { const T = THREE, ar = g => { const a = g.attributes.position, n = a.count, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = a.getX(i); p[i * 3 + 1] = a.getY(i); p[i * 3 + 2] = a.getZ(i); } return p; };
  const hp = ar(H.geometry), lp = ar(EL.geometry), rp = ar(ER.geometry), hn = hp.length / 3, hu = kino_benutzt(H.geometry), F = kino_gesichtsRahmen(hp, hn, lp, lp.length / 3, rp, rp.length / 3, hu, kino_benutzt(EL.geometry), kino_benutzt(ER.geometry)); if (!F) return null;
  const q = new Float32Array(hp.length), v = new T.Vector3(); for (let i = 0; i < hn; i++) { v.set(hp[i * 3] - F.E.x, hp[i * 3 + 1] - F.E.y, hp[i * 3 + 2] - F.E.z); q[i * 3] = v.dot(F.x) * F.k; q[i * 3 + 1] = v.dot(F.up) * F.k; q[i * 3 + 2] = v.dot(F.f) * F.k; }
  const z0 = q.slice(), m = kino_mundZu(q, hn, hu), g = H.geometry.clone(), P = g.attributes.position = g.attributes.position.clone(), N0 = g.attributes.normal ? g.attributes.normal.clone() : null;
  for (let i = 0; i < hn; i++) { if (!m[i]) continue; const dz = (q[i * 3 + 2] - z0[i * 3 + 2]) / F.k; P.setXYZ(i, hp[i * 3] + F.f.x * dz, hp[i * 3 + 1] + F.f.y * dz, hp[i * 3 + 2] + F.f.z * dz); }
  if (N0) { g.computeVertexNormals(); const N = g.attributes.normal; for (let i = 0; i < hn; i++) { const w = m[i]; v.set(N0.getX(i) + (N.getX(i) - N0.getX(i)) * w, N0.getY(i) + (N.getY(i) - N0.getY(i)) * w, N0.getZ(i) + (N.getZ(i) - N0.getZ(i)) * w).normalize(); N0.setXYZ(i, v.x, v.y, v.z); } g.setAttribute('normal', N0); }
  g.setAttribute('aMask', new T.BufferAttribute(m, 1)); return g; }
// Kopf bauen (einmal beim Laden, aus dem Graukind-Klon des Kinos). Rückgabe: Gruppe (unsichtbar, in kino_S.obj.grauKopf)
function kino_grauKopfBau() { const S = kino_S, P = S.fig.graukind, T = THREE; if (!P) return null;
  P.g.updateMatrixWorld(true); const src = {}; P.obj.traverse(o => { if (o.isMesh && o.material && !Array.isArray(o.material) && !src[o.material.name]) src[o.material.name] = o; });
  const H = src.Std_Skin_Head, EL = src.Std_Eye_L, ER = src.Std_Eye_R; if (!H || !EL || !ER) { console.warn('Kino: grauer Kopf – Teile fehlen'); return null; }
  const inv = new T.Matrix4().copy(P.obj.matrixWorld).invert(), v = new T.Vector3();
  const lies = o => { const M = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), N = new T.Matrix3().getNormalMatrix(M), g = o.geometry, n = g.attributes.position.count, p = new Float32Array(n * 3), nr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { v.fromBufferAttribute(g.attributes.position, i).applyMatrix4(M); p[i * 3] = v.x; p[i * 3 + 1] = v.y; p[i * 3 + 2] = v.z;
      if (g.attributes.normal) { v.fromBufferAttribute(g.attributes.normal, i).applyMatrix3(N).normalize(); nr[i * 3] = v.x; nr[i * 3 + 1] = v.y; nr[i * 3 + 2] = v.z; } }
    return { o, g, p, nr, n, u: kino_benutzt(g) }; };
  const mitte = A => { const c = new T.Vector3(); let k = 0; for (let i = 0; i < A.n; i++) { if (!A.u[i]) continue; c.x += A.p[i * 3]; c.y += A.p[i * 3 + 1]; c.z += A.p[i * 3 + 2]; k++; } return c.divideScalar(Math.max(1, k)); };
  const h = lies(H), el = lies(EL), er = lies(ER), L = mitte(el), R = mitte(er), E = L.clone().add(R).multiplyScalar(.5), ipd = L.distanceTo(R); if (!(ipd > 0)) return null;
  // Hochachse: längste Achse des Kopfnetzes, zur näheren Grenze hin (der Hals reicht weiter nach unten als der Scheitel nach oben)
  const bb = new T.Box3(); for (let i = 0; i < h.n; i++) if (h.u[i]) bb.expandByPoint(v.set(h.p[i * 3], h.p[i * 3 + 1], h.p[i * 3 + 2])); const sz = bb.getSize(new T.Vector3());
  const ax = sz.x > sz.y ? (sz.x > sz.z ? 0 : 2) : (sz.y > sz.z ? 1 : 2), e = E.getComponent(ax), up = new T.Vector3().setComponent(ax, bb.max.getComponent(ax) - e < e - bb.min.getComponent(ax) ? 1 : -1);
  const x = L.clone().sub(R).normalize(); up.addScaledVector(x, -up.dot(x)).normalize(); const f = new T.Vector3().crossVectors(x, up);
  if (mitte(h).sub(E).dot(f) > 0) { f.negate(); x.negate(); }
  const k = .054 / ipd; // Augenabstand eines Kindes
  const rahmen = (A, sc = 1, c0 = null) => { const p = A.p, nr = A.nr; let cx = 0, cy = 0, cz = 0; if (c0) { cx = c0.x; cy = c0.y; cz = c0.z; }
    for (let i = 0; i < A.n; i++) { v.set(p[i * 3] - E.x, p[i * 3 + 1] - E.y, p[i * 3 + 2] - E.z); let X = v.dot(x) * k, Y = v.dot(up) * k, Z = v.dot(f) * k; if (c0) { X = cx + (X - cx) * sc; Y = cy + (Y - cy) * sc; Z = cz + (Z - cz) * sc; } p[i * 3] = X; p[i * 3 + 1] = Y; p[i * 3 + 2] = Z;
      v.set(nr[i * 3], nr[i * 3 + 1], nr[i * 3 + 2]); nr[i * 3] = v.dot(x); nr[i * 3 + 1] = v.dot(up); nr[i * 3 + 2] = v.dot(f); } };
  rahmen(h);
  const mask = kino_mundZu(h.p, h.n, h.u);
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(h.p, 3)); if (H.geometry.index) geo.setIndex(H.geometry.index); if (H.geometry.attributes.uv) geo.setAttribute('uv', H.geometry.attributes.uv);
  geo.computeVertexNormals(); { const cn = geo.attributes.normal.array; for (let i = 0; i < h.n; i++) { const m = mask[i]; v.set(h.nr[i * 3] + (cn[i * 3] - h.nr[i * 3]) * m, h.nr[i * 3 + 1] + (cn[i * 3 + 1] - h.nr[i * 3 + 1]) * m, h.nr[i * 3 + 2] + (cn[i * 3 + 2] - h.nr[i * 3 + 2]) * m).normalize(); cn[i * 3] = v.x; cn[i * 3 + 1] = v.y; cn[i * 3 + 2] = v.z; } }
  geo.setAttribute('aMask', new T.BufferAttribute(mask, 1)); geo.computeBoundingSphere();
  const G = new T.Group(), add = (g, mat, ro) => { const m = new T.Mesh(g, mat); m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; if (ro) m.renderOrder = ro; G.add(m); return m; };
  const haut = add(geo, kino_gkHaut(H.material.map, H.material.normalMap));
  // Augen: schwarz, nass, spiegelnd – etwas größer als ein Kinderauge (Bibel: große schwarze Augen)
  const augeM = new T.MeshPhysicalMaterial({ color: 0x020203, roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.7 });
  for (const A of [el, er]) { const c = mitte(A); v.copy(c).sub(E); const c0 = new T.Vector3(v.dot(x) * k, v.dot(up) * k, v.dot(f) * k); rahmen(A, 1.1, c0);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(A.p, 3)); g.setAttribute('normal', new T.BufferAttribute(A.nr, 3)); if (A.g.index) g.setIndex(A.g.index); add(g, augeM); }
  // Lidschatten und Haare (Originalmaterial, gedunkelt und nass) – Haare lassen sich je Ort abschalten (G.userData.haar)
  const haar = [];
  for (const [nm, dunkel] of [['Std_Eye_Occlusion_L', 1], ['Std_Eye_Occlusion_R', 1], ['Scalp1_Transparency', .5], ['Default_Material_Transparency', .5]]) { const o = src[nm]; if (!o) continue; const A = lies(o); rahmen(A);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(A.p, 3)); g.setAttribute('normal', new T.BufferAttribute(A.nr, 3)); for (const a of ['uv', 'color']) if (o.geometry.attributes[a]) g.setAttribute(a, o.geometry.attributes[a]); if (o.geometry.index) g.setIndex(o.geometry.index);
    const mat = o.material.clone(); if (dunkel < 1 && mat.color) { mat.color.multiplyScalar(dunkel); mat.roughness = .35; } const m = add(g, mat, dunkel < 1 ? 2 : 1); if (dunkel < 1) haar.push(m); }
  G.userData.haar = haar; G.userData.haut = haut; kino_obj('grauKopf', G); return G; }
// Kopf zeigen: Lage, Blickziel (Vector3/Array), Maßstab
function kino_gkZeig(pos, ziel, sc = 1, haar = true) { const G = kino_S.obj.grauKopf; if (!G) return null; G.visible = true; G.position.copy(pos); G.scale.setScalar(sc); if (ziel) G.lookAt(Array.isArray(ziel) ? kino_S.b.set(...ziel) : ziel); for (const m of G.userData.haar) m.visible = haar; return G; }
// Porträt (beim Laden einmal gerendert): für Fernseher, Bilder und alle flachen Rückfälle (faceTexes.grey)
function kino_grauPortrait(W = 512, Hh = 614) { const S = kino_S, G = S.obj.grauKopf, T = THREE; if (!G || !renderer) return null;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const x = cv.getContext('2d'); let ok = false;
  G.visible = true; G.position.set(0, -400, 0); G.rotation.set(0, 0, 0); G.scale.setScalar(1); G.updateMatrixWorld(true); KINO_GK.uPlane.value = 1; KINO_GK.uMund.value = 0;
  const cam = new T.PerspectiveCamera(21, W / Hh, .02, 10); cam.position.set(0, -400 - .005, .62); cam.lookAt(0, -400 - .018, 0); cam.updateMatrixWorld();
  const L = [[pointPool[0], [-.32, .22, .5], .9, 0xe6ecf6], [pointPool[1], [.42, .1, -.25], .8, 0xbfd0ee]], keep = L.map(([l]) => [l.position.clone(), l.intensity, l.distance, l.color.clone()]);
  for (const [l, p, i, c] of L) { l.position.set(p[0], -400 + p[1], p[2]); l.intensity = i; l.distance = 4; l.color.setHex(c); }
  const rt = new T.WebGLRenderTarget(W, Hh, { type: T.UnsignedByteType }), px = new Uint8Array(W * Hh * 4), fd = scene.fog.density, cc = renderer.getClearColor(new T.Color()), ca = renderer.getClearAlpha(); scene.fog.density = 0;
  const hid = []; for (const c of scene.children) if (c.visible && c !== G && !c.isLight) { c.visible = false; hid.push(c); } const sau = renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate = false; const bg = scene.background; scene.background = null;
  try { renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(rt); renderer.clear(); renderer.render(scene, cam); renderer.readRenderTargetPixels(rt, 0, 0, W, Hh, px); ok = true; } catch (e) { console.warn('Kino: Porträt', e); }
  finally { renderer.shadowMap.autoUpdate = sau; for (const c of hid) c.visible = true; scene.background = bg; renderer.setRenderTarget(null); renderer.setClearColor(cc, ca); rt.dispose(); scene.fog.density = fd; L.forEach(([l], i) => { l.position.copy(keep[i][0]); l.intensity = keep[i][1]; l.distance = keep[i][2]; l.color.copy(keep[i][3]); }); G.visible = false; }
  if (!ok) return null; const im = x.createImageData(W, Hh), d = im.data, tm = c => Math.round(255 * Math.min(1, Math.pow(Math.max(0, c / 255 * 1.5 / (1 + c / 255 * 1.5) * 1.55), 1 / 2.2)));
  for (let yy = 0; yy < Hh; yy++) for (let xx = 0; xx < W; xx++) { const s = ((Hh - 1 - yy) * W + xx) * 4, o = (yy * W + xx) * 4; d[o] = tm(px[s]); d[o + 1] = tm(px[s + 1]); d[o + 2] = tm(px[s + 2]); d[o + 3] = px[s + 3]; }
  x.putImageData(im, 0, 0); return cv; }
// Flache Rückfälle (Gestalt-Gesichter, alter Tank-Ablauf, Kiffer-Bild): das gezeichnete „grey“ wird zum gerenderten Kopf – im dunklen Hof wie vorher
function kino_grauFlach(P) { if (typeof faceTexes === 'undefined' || !faceTexes.grey || !P) return; const c = faceTexes.grey.image; if (!c || !c.getContext) return; const x = c.getContext('2d'), W = c.width, H = c.height;
  x.clearRect(0, 0, W, H); const g = x.createRadialGradient(W / 2, H * .49, W * .22, W / 2, H * .49, W * .58); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.drawImage(P, 0, 0, W, H); faceTexes.grey.needsUpdate = true; }
// Luftblasen aus der Nase des Gesichts (Tank): steigen am Glas hoch, wackeln, zerplatzen oben
function kino_blasenTick(dt, emit, G) { const B = kino_S.blasen; if (!B) return; B.m.visible = true; const P = B.pos, v = kino_S.b;
  for (let i = 0; i < B.N; i++) { if (B.t[i] < 0) { if (emit && Math.random() < dt * 9) { v.set((Math.random() - .5) * .008, -.016, .03).applyMatrix4(G.matrixWorld); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z; B.t[i] = 0; } else { P[i * 3 + 1] = -999; continue; } }
    B.t[i] += dt; const a = B.t[i]; P[i * 3 + 1] += dt * (.05 + a * .22); P[i * 3] += Math.sin(a * 17 + i) * dt * .02; if (a > 1.6) { B.t[i] = -1; P[i * 3 + 1] = -999; } }
  B.m.geometry.attributes.position.needsUpdate = true; }
// Ton zum Fernsehgesicht: das Rauschen schwillt an und wird hohl (Bandpass wandert nach unten), darunter ein tiefes Brummen, das abbricht
function kino_tvTon(p) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, d = A.at(p.x, p.y, p.z, 2), n = kino_nz(A), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(3200, t); bp.frequency.exponentialRampToValueAtTime(700, t + .9); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .3); g.gain.setValueAtTime(.09, t + .9); g.gain.linearRampToValueAtTime(0, t + 1.05); n.connect(bp); bp.connect(g); g.connect(d); n.stop(t + 1.1);
  const o = c.createOscillator(), og = c.createGain(); o.frequency.value = 50; o.type = 'sawtooth'; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.06, t + .35); og.gain.setValueAtTime(.06, t + 1); og.gain.linearRampToValueAtTime(0, t + 1.03); o.connect(lp); lp.connect(og); og.connect(d); o.start(t); o.stop(t + 1.1); }
// Fernsehbild (Kapitel 1, Nr. 7 „HALLO LUKE“): das Gesicht taucht aus dem Schnee auf – Zeilenzittern, Tonnenwölbung, Zeilen, Rauschen, laufender Balken.
// c: 2D-Kontext (W×H), t: Zeit seit Beginn, k: 0…1 Sichtbarkeit. Zeichnet das komplette Bild.
function kino_tvGesicht(c, W, H, t, k) { const S = kino_S, P = S.gkTv || S.gkBild;
  if (!S.tvRausch) { const n = document.createElement('canvas'); n.width = 128; n.height = 96; S.tvRausch = n; const z = document.createElement('canvas'); z.width = W; z.height = H; const zx = z.getContext('2d');
    for (let y = 0; y < H; y += 3) { zx.fillStyle = 'rgba(0,0,0,.42)'; zx.fillRect(0, y + 2, W, 1); } const v = zx.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, W * .62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.85)'); zx.fillStyle = v; zx.fillRect(0, 0, W, H); S.tvMaske = z; }
  const N = S.tvRausch, nx = N.getContext('2d'), im = nx.createImageData(128, 96), dd = im.data; for (let i = 0; i < dd.length; i += 4) { const q = Math.random() * 255; dd[i] = dd[i + 1] = q * .92; dd[i + 2] = q; dd[i + 3] = 255; } nx.putImageData(im, 0, 0);
  c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#05070a'; c.fillRect(0, 0, W, H);
  c.globalAlpha = .9 - .62 * k; c.drawImage(N, 0, 0, W, H);
  if (P && k > 0) { const fw = H * .98 * P.width / P.height, roll = (t * 9) % H, flick = .86 + .14 * Math.sin(t * 61) * Math.sin(t * 17);
    c.globalCompositeOperation = 'screen';
    for (let y = 0; y < H; y += 2) { const ny = y / H * 2 - 1, wob = 1 + .07 * (1 - ny * ny), sh = Math.sin(y * .11 + t * 27) * 1.6 + (Math.abs(y - roll) < 7 ? (Math.random() - .5) * 9 : 0) + (Math.random() < .015 ? (Math.random() - .5) * 14 : 0);
      const w = fw * wob, sy = (y / H) * P.height; c.globalAlpha = k * flick * (Math.abs(y - roll) < 9 ? .7 : 1); c.drawImage(P, 0, sy, P.width, P.height / H * 2, (W - w) / 2 + sh, y, w, 2); }
    c.globalCompositeOperation = 'source-over'; }
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 1; c.fillStyle = 'rgb(205,220,255)'; c.fillRect(0, 0, W, H); c.globalCompositeOperation = 'source-over';
  const rb = ((t * .35) % 1.4 - .2) * H, g = c.createLinearGradient(0, rb - 18, 0, rb + 18); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.07)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, rb - 18, W, 36);
  c.drawImage(S.tvMaske, 0, 0); c.globalAlpha = 1; }

// ---------------------------------------------------------------- Ortstafel-Zusatzschild (strasse.js): „210“ in Kreide (K1, bleibt), „ALLE“ in Kinderschrift (nur im Bild)
function kino_schild(which) { const S = kino_S; if (!S.zus) { const hits = []; scene.traverse(o => { if (o.isMesh && Array.isArray(o.material) && o.geometry && o.geometry.parameters && Math.abs(o.geometry.parameters.width - .72) < .01 && Math.abs(o.position.x + 72.28) < .05 && Math.abs(o.position.z - 6.3) < .05) hits.push(o); }); S.zus = hits[0] || null; }
  const Z = S.zus; if (!Z) return false; const face = Z.material.findIndex(m => m && m.map && m.map.image && m.map.image.width === 512); if (face < 0) return false;
  if (!S.zusOrig) S.zusOrig = Z.material[face].map;
  if (!S.tex.schild) S.tex.schild = {};
  const mk = (k, draw) => { if (S.tex.schild[k]) return S.tex.schild[k]; const src = S.zusOrig.image, c = document.createElement('canvas'); c.width = src.width; c.height = src.height; const x = c.getContext('2d'); x.drawImage(src, 0, 0); draw(x, c.width, c.height);
    const t = new THREE.CanvasTexture(c); t.colorSpace = S.zusOrig.colorSpace; t.anisotropy = 8; t.wrapS = S.zusOrig.wrapS; t.wrapT = S.zusOrig.wrapT; t.repeat.copy(S.zusOrig.repeat); t.offset.copy(S.zusOrig.offset); S.tex.schild[k] = t; return t; };
  const chalk = (x, n) => { x.save(); x.fillStyle = 'rgba(58,56,52,.88)'; x.font = '62px Caveat, cursive'; x.translate(310, 198); x.rotate(-.05); x.fillText(n, 0, 0); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${rand(.2, .7)})`; x.fillRect(rand(-4, 70), rand(-50, 6), rand(1, 3), rand(1, 2)); } x.restore(); };
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
    ['kuhSk', async () => { if (!kino_S.kuhSk) { await kino_kuhBau(); kino_kuhFxBau(); } }],
    ['figuren3', async () => { if (typeof figuren_load === 'function') await Promise.all([['vegas', 'vegas'], ['lucyK', 'lucy_erw'], ['cleo', 'cleo']] /* Fassung 3 (AP-17): Cleo statt Dina/Heidi auf den Stühlen */.filter(([k]) => !kino_S.fig[k]).map(async ([k, id]) => { const P = await kino_mkFig(k, id); if (P && renderer.compileAsync) { P.g.visible = true; P.g.position.set(0, -300, 0); try { await renderer.compileAsync(P.g, camera, scene); } catch (e) {} P.g.visible = false; } })); }],
    ['stuhl', async () => { const src = await msFBX('chair', 'model.fbx', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }); for (let i = 0; i < 8; i++) { const o = msGround(msFit(src.clone(true), .92, 'y')); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); kino_obj('stuhl' + i, o); } }],
    ['kombi', async () => { const src = await msModel('car_dutch', 'model.glb'); const o = msGround(msFit(src.clone(true), 4.5, 'max')); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.material = [].concat(m.material).map(x => { const c = x.clone(); if (c.color) c.color.lerp(new THREE.Color(0x6a6e72), .55); return c; }); if (m.material.length === 1) m.material = m.material[0]; } }); kino_obj('kombi', o); }],
    ['kiesel', async () => { const g = await MSL.gl.loadAsync('assets/boulder/model.gltf'); for (let i = 0; i < 3; i++) { const o = msFit(g.scene.clone(true), .045 - i * .006, 'max'); const w = new THREE.Group(); const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()); o.position.sub(c); w.add(o); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); kino_obj('kiesel' + i, w); } }],
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
const KINO_SET_OF = { k3kuh: 'k3', k3: 'k3', k3a: 'k3', k3b: 'k3', k3c: 'k3', k3blinzeln: 'k3', k5: 'k5', k6: 'k6' };
function kino_preload(set) { const S = kino_S; S.sets = S.sets || {}; if (S.sets[set]) return S.sets[set];
  return S.sets[set] = (async () => { for (const [k, fn] of KINO_SETS[set] || []) { await kino_ld(k, fn); const o = S.obj[k]; if (o && renderer.compileAsync) { o.visible = true; try { await renderer.compileAsync(o, camera, scene); } catch (e) {} o.visible = false; } } })(); }

// ---------------------------------------------------------------- Laden: Figuren vorwärmen/klonen, Requisiten unsichtbar anlegen, Lichter mit Intensität 0
WORLD_MODS.push(['Kino', async () => {
  kino_css(); const S = kino_S, T = THREE, t0 = performance.now(), lap = n => { S.loadT.push(n + ' ' + Math.round(performance.now() - t0)); }; S.loadT = [];
  const casts = [['lucy', 'lucy_erw'], ['hilde', 'hilde'], ['zayn', 'zayn'], ['mike', 'mike'], ['roxy', 'roxy'], ['junge', 'gezaehlt_j'], ['maedchen', 'gezaehlt_m'], ['frau', 'aydin'],
    ['graukind', 'graukind'], ['echt', 'luke_echt'], ['graue', 'graue'], ['kopie', 'luke']]; // Vegas, Lucy (9), Dina, Heidi erst mit dem Kapitel-3-Satz (kino_preload('k3'))
  if (typeof figuren_load === 'function') await Promise.all(casts.map(([k, id]) => kino_mkFig(k, id)));
  lap('figuren');
  // Rabe (eigener Klon von Whiskeys Scan: der echte Whiskey bleibt, wo er ist)
  try { const src = await msModel('animal_crow', 'model.glb'), sk = await figuren_skc(), m = sk(src); m.scale.setScalar(1.45);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; o.material = [].concat(o.material).map(x => { const c = x.clone(); c.color = (c.color || new T.Color(1, 1, 1)).clone().multiplyScalar(.55); c.roughness = .45; return c; }); if (o.material.length === 1) o.material = o.material[0]; } });
    const g = new T.Group(); g.add(m); kino_obj('rabe', g); const mx = new T.AnimationMixer(m), A = {}; for (const c of src.animations || []) A[c.name.replace(/^.*\|/, '').replace(/^ANIM_Crow_/, '')] = mx.clipAction(c); S.rabe = { g, mx, A, cur: null, fl: null };
  } catch (e) { console.warn('Kino: Rabe', e); }
  const ld = kino_ld;
  await ld('laterne', () => kino_lantern('laterne', true));
  // Lichter: beim Laden mit Intensität 0 (virtuelle Lichter der Basis – sie wandern in die Punktlicht-Reserve, wenn sie nah genug sind)
  S.lucyLight = new VLight(0xffb060, 0, 7, 2); scene.add(S.lucyLight); // Laternenlicht K5
  S.rabeLight = new VLight(0xdfe9ff, 0, 7, 1.6); scene.add(S.rabeLight); // Whiskeys kaltes Licht K6
  S.coldLight = new VLight(0xdfe8ff, 0, 6, 2); scene.add(S.coldLight); // K1: das Kalte hinter der Kellerwand
  for (let i = 0; i < 2; i++) { const l = new VLight(0xffffff, 0, 8, 2); scene.add(l); S.vl.push(l); } // Führungs- und Aufhelllicht je Einstellung (Daten: licht)
  // Polaroid Zayn (K1): Bild nach oben, Rückseite Papier
  { const P = typeof PHOTOS !== 'undefined' ? PHOTOS.find(p => p.name === 'Zayn') : null, front = P && typeof polaroidCanvas === 'function' ? polaroidCanvas(P) : kino_polaBack('Zayn');
    const g = new T.Group(), mf = new T.MeshStandardMaterial({ map: tex(front, true), roughness: .55 }), mb = new T.MeshStandardMaterial({ map: tex(kino_polaBack(''), true), roughness: .8 });
    const a = new T.Mesh(new T.PlaneGeometry(.088, .107), mf), b = new T.Mesh(new T.PlaneGeometry(.088, .107), mb); a.rotation.x = -PI / 2; b.rotation.x = PI / 2; b.position.y = -.0005; a.receiveShadow = b.receiveShadow = true; g.add(a, b); kino_obj('pola', g); }
  // K1: nasse Stelle, wo Hilde stand · Lesebrille · Zeichnung von der Wand · Staub im Keller · Träne
  { const w = kino_decal('nass', kino_tex_wet(), 2.4, 2.4, { rough: .05 }); w.material.roughness = .04; w.material.metalness = .1; w.material.opacity = .5; w.rotation.x = -PI / 2; }
  { const b = kino_decal('brille', kino_tex_brille(), .34, .34, { rough: .45 }); b.rotation.x = -PI / 2; b.material.envMapIntensity = .8; }
  await ld('brilleM', async () => { // Hildes Lesebrille als Modell (Fab „Metal Round Glasses“, ms/brille) an einer Perlenkette, die in einem losen Bogen auf dem Asphalt liegt
    const src = await msModel('brille', 'model.glb'), o = msGround(msFit(src.clone(true), .13, 'max')); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    const g = new T.Group(); g.add(o); const pts = []; for (let i = 0; i <= 64; i++) { const k = i / 64, a = PI * (.08 + .84 * k); pts.push(new T.Vector3(-Math.cos(a) * .085, .0032, .02 + Math.sin(a) * .2 + Math.sin(k * 9) * .006)); }
    const kurve = new T.CatmullRomCurve3(pts), n = 78, perle = new T.InstancedMesh(new T.SphereGeometry(.0032, 10, 8), new T.MeshPhysicalMaterial({ color: 0xf1ebe0, roughness: .22, clearcoat: 1, clearcoatRoughness: .08, iridescence: .7, iridescenceIOR: 1.5, sheen: .4, sheenColor: new T.Color(.9, .85, .8) }), n);
    const M = new T.Matrix4(), v = new T.Vector3(); for (let i = 0; i < n; i++) { kurve.getPoint(i / (n - 1), v); M.makeTranslation(v.x, v.y, v.z); perle.setMatrixAt(i, M); } perle.castShadow = true; perle.receiveShadow = true; g.add(perle);
    kino_obj('brilleM', g); });
  { const z = new T.Mesh(new T.PlaneGeometry(.3, .3), new T.MeshStandardMaterial({ map: tex(kino_tex_zeichnung(), true), roughness: .95, side: T.DoubleSide })); z.castShadow = true; z.receiveShadow = true; kino_obj('zeichnung', z); }
  { const N = 220, pos = new Float32Array(N * 3), seed = new Float32Array(N * 3); for (let i = 0; i < N; i++) { seed[i * 3] = rand(-3.6, 3.6); seed[i * 3 + 1] = rand(.1, 2.3); seed[i * 3 + 2] = rand(.2, 6); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); const m = new T.Points(geo, new T.PointsMaterial({ color: 0xbfc4c8, size: .012, transparent: true, opacity: .55, depthWrite: false }));
    m.frustumCulled = false; S.dust = { m, pos, seed, N }; kino_obj('staub', m); }
  { const N = 90, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4); for (let i = 0; i < N; i++) { seed[i * 4] = rand(0, 6.28); seed[i * 4 + 1] = rand(.05, 1.4); seed[i * 4 + 2] = rand(0, 18); seed[i * 4 + 3] = rand(.6, 1.8); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); const m = new T.Points(geo, new T.PointsMaterial({ map: kino_glowTex('glow'), color: 0xfff0d8, size: .06, transparent: true, opacity: .9, depthWrite: false, blending: T.AdditiveBlending }));
    m.frustumCulled = false; S.strahlStaub = { m, pos, seed, N }; kino_obj('strahlStaub', m); } // Papier, Kreidestaub, Laub im Strahl
  // K2: Kinderzeichnung, Handabdrücke innen am Glas, Schatten auf dem Glas, ein Haar, Wasseroberfläche, Kanalring, Feder
  { const d = kino_decal('papa', kino_tex_papa(), .42, .42, { rough: .95 }); d.rotation.x = -PI / 2; }
  kino_decal('hand', kino_tex_hand(), .2, .2, { rough: .1, ds: true }); kino_decal('handL', kino_tex_hand(1.25), .26, .26, { rough: .1, ds: true });
  kino_decal('schatten', kino_tex_shadow(), 1.1, 1.1, { color: 0x000000, opacity: .75, ds: true }).material.blending = THREE.NormalBlending;
  { const h = new T.Mesh(new T.PlaneGeometry(.004, .24), new T.MeshStandardMaterial({ color: 0x3a2a1c, roughness: .6, side: T.DoubleSide })); kino_obj('haar', h); }
  { const w = new T.Mesh(new T.CircleGeometry(.86, 32), new T.MeshPhysicalMaterial({ color: 0x5f9a90, roughness: .04, metalness: 0, transparent: true, opacity: .45, side: T.DoubleSide })); w.rotation.x = -PI / 2; kino_obj('wasser', w); }
  { const r = new T.Mesh(new T.PlaneGeometry(1.5, 1.5), new T.MeshStandardMaterial({ map: tex(kino_tex_ring(), true), transparent: true, alphaTest: .5, roughness: 1, side: T.DoubleSide })); r.rotation.x = -PI / 2; kino_obj('ring', r); }
  // Leuchten: kalte, kerzengerade Flamme (Villafenster), weißes Pulsieren (Schacht), Whiskeys Licht, Träne
  S.tex.flame = kino_glowTex('flame'); S.tex.glow = kino_glowTex('glow');
  kino_sprite('flamme', S.tex.flame, 0xe8f0ff, 1.1, false).scale.set(.32, .9, 1); kino_sprite('flammeSchein', S.tex.glow, 0x9fb8ff, 2.2, false);
  kino_sprite('puls', S.tex.glow, 0xf4f8ff, 30, false); kino_sprite('veranda', S.tex.glow, 0xffb060, 1.6, true); kino_sprite('lampe', S.tex.glow, 0xfff0d8, .9, true); kino_sprite('rabeSchein', S.tex.glow, 0xcfe0ff, 1.4, true);
  kino_sprite('traene', S.tex.glow, 0xe8f2ff, .012, true).scale.set(.008, .013, 1); kino_sprite('ferne', S.tex.glow, 0xf2f6ff, 60, true);
  // K2: das graue Gesicht am Glas (dasselbe Gesicht wie der Rabe im Prolog – das Graukind), die Feder in der Kerbe, das Band „KRANZ, P.“ · K3: Brandkreise, Dampf
    kino_decal('feder', kino_tex_feder(), .09, .26, { rough: .5, ds: true });
  kino_decal('band', kino_tex_band(), .34, .09, { rough: .25, ds: true, phys: true });
  kino_decal('brand', kino_tex_brand(), .9, .9, { rough: .95 });
  // Linse (Schärfentiefe-Anmutung): einmal beim Laden übersetzen, dann aus
  try { S.lens = kino_lensPass(); if (S.lens) { S.lens.enabled = true; S.lensWarm = 3; } } catch (e) { console.warn('Kino: Linse', e); }
  // R-9: das graue Gesicht als echter Kopf (Prolog, Tank) und als gerendertes Porträt (Fernseher, flache Rückfälle)
  try { if (kino_grauKopfBau()) { const G = S.obj.grauKopf; if (renderer.compileAsync) { G.visible = true; G.position.set(0, -300, 0); try { await renderer.compileAsync(G, camera, scene); } catch (e) {} G.visible = false; }
      S.gkBild = kino_grauPortrait(); kino_grauFlach(S.gkBild); S.gkTv = kino_grauPortrait(192, 230); } } catch (e) { console.warn('Kino: grauer Kopf', e); }
  { const N = 26, pos = new Float32Array(N * 3), geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); // Luftblasen am Tankglas (aus der Nase des Gesichts)
    const m = new T.Points(geo, new T.PointsMaterial({ map: kino_glowTex('glow'), color: 0xe8f4ff, size: .012, transparent: true, opacity: .85, depthWrite: false })); m.frustumCulled = false; S.blasen = { m, pos, N, t: new Float32Array(N).fill(-1) }; kino_obj('blasen', m); }
  { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); // Beschlag am Glas: weicher Hof mit feinen Tropfen
    const g = x.createRadialGradient(128, 128, 20, 128, 128, 126); g.addColorStop(0, 'rgba(220,232,240,.0)'); g.addColorStop(.35, 'rgba(220,232,240,.32)'); g.addColorStop(.75, 'rgba(220,232,240,.16)'); g.addColorStop(1, 'rgba(220,232,240,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 420; i++) { const a = rand(0, 6.28), r = Math.sqrt(rand(.04, 1)) * 118, px = 128 + Math.cos(a) * r, py = 128 + Math.sin(a) * r * 1.15, s = rand(.6, 2.4); x.fillStyle = `rgba(240,248,255,${rand(.25, .6)})`; x.beginPath(); x.arc(px, py, s, 0, 7); x.fill(); }
    kino_decal('beschlag', c, .34, .4, { rough: .1, ds: true, opacity: 0 }); }
  kino_defs(); S.ready = true; lap('fertig');
}]);

// Einmalige Aufnahme (Polaroid „2043“, vorbereitet für K3): Blitzlicht über die Punktlicht-Reserve der Basis, danach alles zurück
function kino_polaBack(text) { const c = document.createElement('canvas'); c.width = 256; c.height = 310; const x = c.getContext('2d'); x.fillStyle = '#e6dfcd'; x.fillRect(0, 0, 256, 310);
  for (let i = 0; i < 1200; i++) { x.fillStyle = `rgba(80,60,30,${rand(.01, .05)})`; x.fillRect(rand(0, 256), rand(0, 310), 2, 2); }
  x.fillStyle = 'rgba(60,60,70,.85)'; x.font = '44px Caveat, cursive'; x.save(); x.translate(128, 170); x.rotate(-.06); x.textAlign = 'center'; x.fillText(text, 0, 0); x.restore(); return c; }

// ---------------------------------------------------------------- Abspielen
async function kino_play(id, opts = {}) {
  const S = kino_S, D = KINO[id]; if (!D) { console.warn('Kino: unbekannte Sequenz ' + id); return; } if (S.on) { console.warn('Kino: läuft schon (' + S.id + ')'); return; }
  kino_css(); $('subtitle').style.opacity = 0; if (typeof toastT !== 'undefined') { clearTimeout(toastT); $('toast').style.opacity = 0; } S.on = true; S.id = id; S.def = D; S.opts = opts; S.i = -1; S.sh = null; S.t = 0; S.T = 0; S.skip = false; S.ending = false;
  S.ev.length = 0; S.act.length = 0; S.lit.length = 0; S.flash = null; S.pose.ok = false; S.shk.length = 0; S.lampFx.length = 0; S.wOk = false; S.hold = false; S.fps.n = 0; S.fps.t = 0; S.fps.min = 999; S.fps.lo = 0;
  const A = Audio, fd = $('fade'), cv = renderer.domElement, nahtlos = opts.nahtlos ?? D.nahtlos;
  S.sv = { cine: document.body.classList.contains('cine'), fogC: scene.fog.color.getHex(), fogD: scene.fog.density, skyH: skyMat.uniforms.horizon.value.clone(), skyZ: skyMat.uniforms.zenith.value.clone(), skyDim: skyMat.uniforms.dim.value,
    gfC: fogUniforms.color.value.clone(), hemiC: hemi.color.clone(), hemiG: hemi.groundColor.clone(), moonC: moon.color.clone(), vig: filmPass.uniforms.vig.value, ca: filmPass.uniforms.ca.value, toe: filmPass.uniforms.toe.value,
    filter: cv.style.filter, filterT: cv.style.transition, far: camera.far, near: camera.near, yaw: player.yaw, pitch: player.pitch, pos: player.pos.clone(), talking: state.talking, scripted, cam: camOverride, inB: state.inBasement, indoorK,
    fadeBg: fd.style.background || '#000', world: A.world ? A.world.gain.value : 1, bed: A.bedTrim ? A.bedTrim.gain.value : .5, rain: A.rain ? A.rain.gain.value : 0, master: A.master ? A.master.gain.value : 1, sub: $('subtitle').style.opacity, glitch: glitchV, flashOn };
  if (A.mus && A.ctx) { const g = A.mus.duck.gain, t = A.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 1.6); } // adaptive Musik weicht
  state.talking = true; setScripted(() => true); glitchV = 0; shake = 0;
  S.onKey = e => { if (!S.on) return; if (e.code === 'Space') { e.preventDefault(); kino_skip(); } };
  S.onClick = e => { if (!S.on || e.button !== 0) return; kino_skip(); };
  addEventListener('keydown', S.onKey, true); addEventListener('pointerdown', S.onClick, true);
  document.body.classList.add('cine', 'kino'); document.body.classList.toggle('kinoNoSkip', D.skipAfter > 0); $('traumSkip') && ($('traumSkip').style.display = D.skipAfter === Infinity ? 'none' : '');
  if (!nahtlos) { if (+fd.style.opacity < .99) { fd.style.transition = 'opacity .7s'; fd.style.background = '#000'; fd.style.opacity = 1; await wait(750); } else fd.style.background = '#000'; }
  if (KINO_SET_OF[id]) await kino_preload(KINO_SET_OF[id]);
  if (D.start) { try { await D.start(opts); } catch (e) { console.warn('Kino: Start', e); } }
  if (!nahtlos) $('subtitle').style.opacity = 0; S.prevCam = camOverride; setCamOverride(kino_cam);
  const done = new Promise(r => { S.res = r; });
  kino_next(); if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
  await done;
}
function kino_skip() { const S = kino_S; if (!S.on || S.ending || S.skip) return; if (S.T < S.def.skipAfter) return; S.skip = true; }
function kino_resolve(v, sh) { if (v === 'cam') { const d = camera.getWorldDirection(kino_S.a); return [camera.position.x, camera.position.y, camera.position.z, d]; } return typeof v === 'function' ? v(sh) : v; }
function kino_next() {
  const S = kino_S, D = S.def; if (S.sh) { try { S.sh.teardown && S.sh.teardown(S.sh); } catch (e) { console.warn('Kino: Abbau', e); } }
  S.i++; S.t = 0; S.li = 0; S.si = 0; S.lit.length = 0; S.flash = null; S.wOk = false; for (const l of S.vl) l.intensity = 0; const sh = S.sh = D.shots[S.i] || null; if (!sh) { kino_finish(false); return; }
  if (sh.wenn && !sh.wenn(S.opts)) { S.sh = null; return kino_next(); }
  const fd = $('fade');
  if (typeof sh.card === 'function') sh._card = sh.card(S.opts); else sh._card = sh.card;
  if (sh._card && (sh.dur === 'auto' || !sh.dur)) sh._dur = kino_card(sh._card); else { sh._dur = sh.dur; kino_card(sh._card || null); }
  if (sh.black || sh._card) { fd.style.transition = `opacity ${sh.fadeOut ?? 500}ms`; fd.style.background = '#000'; fd.style.opacity = 1; }
  else if (sh.white) { fd.style.transition = `opacity ${sh.fadeOut ?? 60}ms`; fd.style.background = '#fff'; fd.style.opacity = 1; }
  else { fd.style.transition = `opacity ${sh.fadeIn ?? 0}ms`; fd.style.opacity = 0; }
  document.body.classList.toggle('kinoFrei', !!sh.frei);
  const EV = sh.env ? (typeof sh.env === 'string' ? KINO_ENV[sh.env] : sh.env) : null; kino_envApply(EV); kino_film(sh.film || (EV && EV.vig !== undefined ? { vig: EV.vig } : null));
  const f0 = sh.fov || S.sv.fovP || fov; if (!sh.frei && camera.fov !== f0) { camera.fov = f0; camera.updateProjectionMatrix(); }
  // Ausgangspunkte (einmal je Einstellung ausgewertet)
  const fr = kino_resolve(sh.from, sh); sh._from = fr ? kino_V(fr[0], fr[1], fr[2]) : null; if (fr && fr[3]) sh._fromDir = fr[3].clone();
  const to = kino_resolve(sh.to, sh); sh._to = to ? kino_V(to[0], to[1], to[2]) : sh._from;
  if (sh.look === 'cam') { const c = camera.position, d = camera.getWorldDirection(S.a); sh._look = kino_V(c.x + d.x * 6, c.y + d.y * 6, c.z + d.z * 6); }
  else sh._look = Array.isArray(sh.look) ? kino_V(...sh.look) : typeof sh.look === 'function' && sh.look.length === 1 ? kino_V(...sh.look(sh)) : null;
  const lt = kino_resolve(sh.lookTo, sh); sh._lookTo = lt ? kino_V(lt[0], lt[1], lt[2]) : null;
  sh._curve = sh.via && sh._from ? new THREE.CatmullRomCurve3([sh._from, ...sh.via.map(p => kino_V(...(typeof p === 'function' ? p(sh) : p))), sh._to], false, 'centripetal') : null;
  if (!sh._curve && !sh.path && !sh.gerade && sh._from && sh._to && sh._from.distanceTo(sh._to) > .15) { // Q-11: nie gerade Fahrten – ein leichter Bogen, weg vom Blickziel (Orbit-Gefühl)
    const d = sh._to.clone().sub(sh._from), L = d.length(), m = sh._from.clone().add(sh._to).multiplyScalar(.5), p = new THREE.Vector3(-d.z, 0, d.x).normalize(), tg = sh._look || sh._lookTo;
    const sg = tg && p.dot(tg.clone().sub(m)) > 0 ? -1 : 1; m.addScaledVector(p, sg * L * .09); m.y += L * .025; sh._curve = new THREE.CatmullRomCurve3([sh._from, m, sh._to], false, 'centripetal'); }
  S.cs = false;
  sh._lcurve = sh.lookVia && sh._look ? new THREE.CatmullRomCurve3([sh._look, ...sh.lookVia.map(p => kino_V(...p)), sh._lookTo || sh._look], false, 'centripetal') : null;
  sh._ease = KINO_EASE[sh.ease || 'smooth'] || kino_e;
  for (const s of sh.shakes || []) kino_after(s[0], () => kino_shake(s[1], s[2]));
  try { sh.setup && sh.setup(sh); } catch (e) { console.warn('Kino: Aufbau', e); }
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; S.pose.ok = false;
}
function kino_feder(x, vel, target, dt, om) { const S = kino_S; S.fd.copy(target).sub(x).multiplyScalar(om * om).addScaledVector(vel, -2 * om); vel.addScaledVector(S.fd, Math.min(dt, .05)); x.addScaledVector(vel, Math.min(dt, .05)); }
function kino_shake(amp, dur) { kino_S.shk.push({ a: amp, d: dur, t: 0 }); }
// Kamera je Bild (aus update(), vor Taschenlampe und Takt)
function kino_cam(cam, dt) {
  const S = kino_S; if (!S.on) return;
  try {
    if (S.hold) dt = 0;
    if (S.ending) { if (S.pose.ok) { cam.position.copy(S.pose.p); cam.quaternion.copy(S.pose.q); } return; }
    S.t += dt; S.T += dt;
    if (dt > 0) { const F = S.fps; F.n++; F.t += dt; }
    if (S.ev.length) for (let i = S.ev.length - 1; i >= 0; i--) if (S.T >= S.ev[i][0]) { const f = S.ev[i][1]; S.ev.splice(i, 1); try { f(); } catch (e) { console.warn('Kino: Zeitgeber', e); } }
    if (S.skip) { kino_finish(true); return; }
    if (S.T >= S.def.skipAfter && document.body.classList.contains('kinoNoSkip')) document.body.classList.remove('kinoNoSkip');
    let sh = S.sh; if (sh && S.t >= sh._dur) { kino_next(); sh = S.sh; if (!sh) return; }
    const L = sh.lines; while (L && S.li < L.length && S.t >= L[S.li][2]) { const [txt, who, , ms] = L[S.li++]; if (typeof txt === 'function' && !txt(S.opts)) continue; const tx = typeof txt === 'function' ? txt(S.opts) : txt; S.own = true; try { subtitle(tx, ms || Math.max(3400, Math.min(7000, (sh._dur - S.t) * 1000)), who || ''); } finally { S.own = false; } kino_sprecher(who, tx, ms); }
    const X = sh.sfx; while (X && S.si < X.length && S.t >= X[S.si][1]) { const f = X[S.si++][0]; try { typeof f === 'function' ? f(sh) : Audio.play(f, { gain: .5 }); } catch (e) { console.warn('Kino: Klang', e); } }
    const k = Math.min(1, S.t / sh._dur), e = sh._ease(k), v = S.v, w = S.w;
    if (sh.black || sh._card || sh.white) { if (S.pose.ok) { cam.position.copy(S.pose.p); cam.quaternion.copy(S.pose.q); } if (sh.tick) sh.tick(k, S.t, dt, sh); return; }
    // Spielerkamera (frei): der Spieler kann den Kopf drehen; blick zieht weich zu einem Punkt
    if (sh.frei) { if (sh.blick) { const bl = typeof sh.blick === 'function' ? sh.blick(S.a) : S.a.set(sh.blick[0], sh.blick[1], sh.blick[2]); const P = cam.position, dx = bl.x - P.x, dz = bl.z - P.z;
        let y1 = Math.atan2(-dx, -dz); while (y1 - player.yaw > PI) y1 -= 2 * PI; while (y1 - player.yaw < -PI) y1 += 2 * PI; const p1 = Math.atan2(bl.y - P.y, Math.hypot(dx, dz)), r = 1 - Math.exp(-dt * (sh.blickRate || 2.2));
        player.yaw += (y1 - player.yaw) * r; player.pitch += (p1 - player.pitch) * r; cam.rotation.set(player.pitch, player.yaw, 0, 'YXZ'); }
      { const fv = sh.fovTo ? (sh.fov || fov) + (sh.fovTo - (sh.fov || fov)) * e : sh.fov; if (fv && Math.abs(cam.fov - fv) > .001) { cam.fov = fv; cam.updateProjectionMatrix(); } }
      kino_camShake(cam, dt); if (sh.dy) cam.position.y += sh.dy(k, S.t); S.pose.p.copy(cam.position); S.pose.q.copy(cam.quaternion); S.pose.ok = true; kino_lensSet(sh.lens, k, e); if (sh.tick) sh.tick(k, S.t, dt, sh); return; }
    if (sh.path) sh.path(e, S.t, v, w, sh, k);
    else { if (sh._curve) sh._curve.getPoint(e, v); else v.lerpVectors(sh._from, sh._to, e);
      if (sh._lcurve) sh._lcurve.getPoint(e, w); else if (sh._lookTo && sh._look) w.lerpVectors(sh._look, sh._lookTo, e); else if (sh._look) w.copy(sh._look);
      else if (typeof sh.look === 'function') { const r = sh.look(w, e, S.t, sh); if (Array.isArray(r)) w.set(r[0], r[1], r[2]); else if (r && r.isVector3 && r !== w) w.copy(r); if (sh._lookTo) w.lerp(sh._lookTo, e); } // bewegtes Blickziel (Rückgabe Array/Vektor oder w selbst gesetzt)
      else if (sh._fromDir) w.copy(v).addScaledVector(sh._fromDir, 6); }
    if (sh.follow) { if (S.wOk) S.wPrev.lerp(w, 1 - Math.exp(-dt * sh.follow)); else { S.wPrev.copy(w); S.wOk = true; } w.copy(S.wPrev); }
    // Trägheit der Handkamera: Position und Blickpunkt folgen dem Ziel über eine kritisch gedämpfte Feder (beim Schnitt ohne Nachlauf)
    if (!S.cs || dt <= 0) { S.cp.copy(v); S.cw.copy(w); S.cvp.set(0, 0, 0); S.cvw.set(0, 0, 0); S.cs = true; }
    else { kino_feder(S.cp, S.cvp, v, dt, sh.traeg ?? 11); kino_feder(S.cw, S.cvw, w, dt, (sh.traeg ?? 11) * .8); v.copy(S.cp); w.copy(S.cw); }
    const h = sh.hand ?? .5, T = S.T; // ruhige Hand: kaum spürbares Atmen der Kamera (zwei langsame, sich überlagernde Schwingungen)
    v.x += (Math.sin(T * .9) * .006 + Math.sin(T * 2.3 + 1.7) * .0025) * h; v.y += (Math.sin(T * 1.3 + 1) * .005 + Math.sin(T * 3.1) * .0015) * h + (sh.breathe ? Math.sin(S.t * 1.7) * .012 * sh.breathe : 0); v.z += Math.sin(T * .7 + 2.1) * .004 * h;
    cam.position.copy(v); cam.up.set(0, 1, 0); cam.lookAt(w);
    const roll = sh.rollTo !== undefined ? (sh.roll || 0) + (sh.rollTo - (sh.roll || 0)) * e : (sh.roll || 0); cam.rotateZ(roll + Math.sin(T * .4) * .008 * h);
    const fv = sh.fovTo ? sh.fov + (sh.fovTo - sh.fov) * e : sh.fov; if (fv && Math.abs(cam.fov - fv) > .001) { cam.fov = fv; cam.updateProjectionMatrix(); }
    kino_camShake(cam, dt);
    S.pose.p.copy(cam.position); S.pose.q.copy(cam.quaternion); S.pose.ok = true;
    kino_lensSet(sh.lens, k, e);
    if (sh.tick) sh.tick(k, S.t, dt, sh);
  } catch (err) { console.error('Kino ' + S.id, err); kino_finish(true); }
}
function kino_camShake(cam, dt) { const L = kino_S.shk; if (!L.length) return; let a = 0; for (let i = L.length - 1; i >= 0; i--) { const s = L[i]; s.t += dt; if (s.t >= s.d) { L.splice(i, 1); continue; } const k = 1 - s.t / s.d; a += s.a * k * k; }
  if (a <= 0) return; const T = kino_S.T * 38; cam.position.x += (Math.sin(T * 1.3) + Math.sin(T * 2.9 + 1)) * .5 * a; cam.position.y += (Math.sin(T * 1.7 + 2) + Math.sin(T * 3.3)) * .5 * a; cam.rotateZ((Math.sin(T * 1.1 + 4)) * a * .6); cam.rotateX(Math.sin(T * 1.9 + .5) * a * .4); }
async function kino_finish(skipped) {
  const S = kino_S; if (!S.on || S.ending) return; S.ending = true; const fd = $('fade'), D = S.def;
  if (skipped) { $('subtitle').style.opacity = 0; fd.style.transition = 'opacity .3s'; fd.style.background = '#000'; fd.style.opacity = 1; await wait(320); }
  if (S.sh && S.sh.teardown) { try { S.sh.teardown(S.sh); } catch (e) { console.warn('Kino: Abbau', e); } } S.sh = null;
  if (D.done) { try { D.done(skipped, S.opts); } catch (e) { console.warn('Kino: Ende', e); } }
  for (const P of [...S.act]) kino_figOff(P.key); for (const k in S.obj) S.obj[k].visible = false; if (S.rabe) S.rabe.fl = null;
  kino_card(null); $('kinoPola').classList.remove('on', 'flip'); $('kinoLid').classList.remove('zu'); $('kinoTear').classList.remove('on');
  if (S.lucyLight) S.lucyLight.intensity = 0; if (S.rabeLight) S.rabeLight.intensity = 0; if (S.coldLight) S.coldLight.intensity = 0; for (const l of S.vl) l.intensity = 0;
  kino_lampFxEnde(); kino_lensSet(null); kino_brummAus(); S.lock = null;
  const uebergabe = D.uebergabe && S.pose.ok; if (uebergabe) { const d = camera.getWorldDirection(S.a); S.sv.yaw = Math.atan2(-d.x, -d.z); S.sv.pitch = Math.asin(kino_cl(d.y, -1, 1)); }
  kino_restore();
  const au = S.opts && S.opts.aufblenden; S.on = false; S.id = null; const r = S.res; S.res = null;
  if (D.offen && !skipped) { fd.style.transition = 'opacity 0ms'; fd.style.opacity = 0; } else if (au) { fd.style.transition = `opacity ${au}ms`; fd.style.opacity = 0; }
  if (r) r();
}
function kino_restore() {
  const S = kino_S, sv = S.sv, A = Audio, cv = renderer.domElement; if (!sv) return;
  removeEventListener('keydown', S.onKey, true); removeEventListener('pointerdown', S.onClick, true);
  kino_envApply(null); S.env = null; scene.fog.color.setHex(sv.fogC); scene.fog.density = sv.fogD; state.inBasement = sv.inB; indoorK = sv.indoorK;
  const u = filmPass.uniforms; u.vig.value = sv.vig; u.ca.value = sv.ca; u.toe.value = sv.toe; u.flash.value = 0; glitchV = sv.glitch; shake = 0; cv.style.filter = sv.filter; cv.style.transition = sv.filterT;
  camera.near = sv.near; camera.far = sv.far; camera.fov = fov; camera.updateProjectionMatrix();
  player.yaw = sv.yaw; player.pitch = sv.pitch; player.pos.copy(sv.pos); vel.set(0, 0, 0); flashOn = sv.flashOn;
  setCamOverride(sv.cam && sv.cam !== kino_cam ? sv.cam : null); setScripted(sv.scripted || null); state.talking = sv.talking;
  document.body.classList.remove('kino', 'kinoNoSkip', 'kinoFrei'); if (!sv.cine) document.body.classList.remove('cine'); if ($('traumSkip')) $('traumSkip').style.display = '';
  $('subtitle').style.opacity = 0; $('fade').style.background = sv.fadeBg; for (const k in keys) keys[k] = false;
  if (A.ctx) { const t = A.ctx.currentTime; if (A.mus) { const g = A.mus.duck.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(1, t + 2.5); }
    for (const [n, v0] of [[A.world, sv.world], [A.bedTrim, sv.bed], [A.rain, sv.rain], [A.master, sv.master]]) if (n) { n.gain.cancelScheduledValues(t); n.gain.setValueAtTime(n.gain.value, t); n.gain.linearRampToValueAtTime(v0, t + 1.2); } }
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; S.sv = null;
  if (typeof gedanken_S !== 'undefined') gedanken_S.cd = Math.max(gedanken_S.cd || 0, 6); // kein Gedanke direkt aus dem Schwarz heraus
  if (S.qp && S.qp.length) { const q = S.qp.splice(0); setTimeout(() => q.forEach(([k, t]) => questPop(k, t)), 2500); }
}
// Während einer Sequenz spricht nur das Kino: fremde Untertitel, Gedanken, Hinweise und Aufgaben-Einblendungen warten bzw. entfallen
subtitle = (o => function (t, ms, who) { if (kino_S.on && !kino_S.own) return; return o(t, ms, who); })(subtitle);
toast = (o => function (t, ms) { if (kino_S.on) return; return o(t, ms); })(toast);
questPop = (o => function (kind, text) { if (kino_S.on) { (kino_S.qp || (kino_S.qp = [])).push([kind, text]); return; } return o(kind, text); })(questPop); // nach der Sequenz nachgereicht
function kino_sag(txt, who, ms) { kino_S.own = true; try { subtitle(txt, ms || 3800, who || ''); } finally { kino_S.own = false; } kino_sprecher(who, txt, ms); }

// ---------------------------------------------------------------- Laternen je Einstellung: ausgeblasen (mit Nachglühen), Relais aus, zurück – nach der Sequenz wie vorher
function kino_lampe(L, how, t0 = 0) { const S = kino_S; let f = S.lampFx.find(x => x.L === L); if (!f) { f = { L, m0: L.mode, k: L.k ?? 1, em: L.bulbMat.emissive ? L.bulbMat.emissive.getHex() : undefined }; S.lampFx.push(f); } L.mode = 'kino'; f.how = how; f.t = -t0; f.k0 = f.k; return f; }
function kino_lampFxTick(dt) { const S = kino_S; if (!S.lampFx.length) return; let any = false;
  for (const f of S.lampFx) { const L = f.L; if (L.mode !== 'kino') continue; any = true; f.t += dt; const t = f.t; let k = f.k0;
    if (t >= 0) { if (f.how === 'pusten') k = t < .12 ? f.k0 * (1 - t / .12 * .75) : Math.max(0, .25 * Math.exp(-(t - .12) * 2.6)); // aus, der Draht glüht nach
      else if (f.how === 'relais') k = t < .05 ? f.k0 : 0; else if (f.how === 'an') k = t < .25 ? (Math.random() < .5 ? .2 : .9) : 1; else if (f.how === 'aus') k = 0; else if (f.how === 'puls') k = .55 + .45 * Math.sin(t * (f.rate || 3)); else if (f.how === 'hell') k = 1; }
    f.k = k; L.k = k; L.bulbMat.emissiveIntensity = 4 * k * (f.how === 'pusten' && t > .12 ? 1.8 : 1); L.cm.uniforms.opacity.value = .09 * (f.how === 'pusten' && t > .12 ? 0 : k); if (L.bulbMat.emissive && f.em !== undefined) L.bulbMat.emissive.setHex(f.how === 'pusten' && t > .12 ? 0xff5a18 : f.em); }
  if (any && typeof LP !== 'undefined') for (let i = 0; i < 10; i++) { const L = LP.order[i]; if (L) fogUniforms.lamps.value[i].set(L.wx, 0, L.wz, L.k); } }
function kino_lampFxEnde() { for (const f of kino_S.lampFx) { const L = f.L; L.mode = f.m0; if (f.em !== undefined) L.bulbMat.emissive.setHex(f.em); } kino_S.lampFx.length = 0; }
function kino_lamps(fn) { if (typeof lamps === 'undefined') return; for (const L of lamps) fn(L); }
function kino_lampNah(x, z) { let b = null, bd = 1e9; kino_lamps(L => { const d = Math.hypot(L.wx - x, L.wz - z); if (d < bd) { bd = d; b = L; } }); return b; }

// ---------------------------------------------------------------- Takt: Figuren, Umgebung, geliehene Lichter (keine Zuweisungen neuer Objekte)
function kino_tick(dt) {
  const S = kino_S; S.frame = (S.frame || 0) + 1; if (S.lensWarm > 0 && --S.lensWarm === 0 && S.lens && !S.on) S.lens.enabled = false;
  if (!S.on || S.ending) return; if (S.hold) dt = 0;
  for (let i = 0; i < S.act.length; i++) { const P = S.act[i]; if (P.g.visible && !P.sit) { P.mx.update(dt); P.g.updateMatrixWorld(true); kino_atmung(P); kino_figPost(P, dt); } if (P.g.visible && P.mimZ) kino_mimikTick(P, dt); }
  const R = S.rabe; if (R && R.g.visible) { R.mx.update(dt); if (R.fl) { const F = R.fl, g = R.g; F.t = Math.min(1, F.t + dt / F.dur); const k = F.t, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
      g.position.set(a * F.from.x + b * F.ctrl.x + c * F.to.x, a * F.from.y + b * F.ctrl.y + c * F.to.y, a * F.from.z + b * F.ctrl.z + c * F.to.z);
      const dx = F.to.x - F.from.x, dz = F.to.z - F.from.z; g.rotation.y = Math.atan2(dx, dz); if (F.t >= 1) { R.fl = null; kino_rabeClip('Landing', true); kino_after(.7, () => kino_rabeClip('IdleLookAround')); if (F.then) F.then(); } } }
  kino_envTick(); kino_lampFxTick(dt); if (S.lock) S.lock();
  if (S.lit.length) { const l = pointPool[2], L = S.lit[0]; l.position.copy(L.p); l.color.setHex(L.c); l.distance = L.d; l.decay = 2; l.intensity = L.i; }
  const F = S.flash; if (F) { flashRig.position.copy(F.p); S.a.copy(F.at).sub(F.p).normalize(); S.b.set(0, 0, -1); flashRig.quaternion.setFromUnitVectors(S.b, S.a); flashRig.updateMatrixWorld(); flashlight.intensity = F.i; bounce.intensity = 0;
    fogUniforms.flP.value.copy(F.p); fogUniforms.flD.value.copy(S.a); fogUniforms.flK.value.set(F.i / 18, Math.cos(flashlight.angle)); }
  else if (S.sh && !S.sh.keepFlash && !S.sh.frei) { flashlight.intensity = 0; bounce.intensity = 0; fogUniforms.flK.value.set(0, 1); }
}
WORLD_TICK.push(dt => { kino_tick(dt); kino_persist(dt); kino_kuhTick(dt); });
// Was eine Sequenz dauerhaft verändert, bleibt – auch nach dem Laden: „210“ auf der Ortstafel ab Kapitel 1-Ende
function kino_persist(dt) { const S = kino_S; S.pT = (S.pT || 0) - dt; if (S.pT > 0 || S.on) return; S.pT = 1.5;
  const after1 = state.ch1Done || state.ch2 || (typeof ch3 !== 'undefined' && ch3.on) || (typeof kap === 'function' && kap() >= 2);
  if (after1 && S.schild !== '210') kino_schild('210');
  const k = typeof kap === 'function' ? kap() : typeof curChapter === 'function' ? curChapter() : 1; if (k === 3 || k === 5 || k === 6) kino_preload('k' + k); }
function kino_rabeClip(k, once = false) { const R = kino_S.rabe; if (!R) return; const a = R.A[k]; if (!a || a === R.cur) return; a.reset(); if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity); a.fadeIn(.2).play(); if (R.cur) R.cur.fadeOut(.2); R.cur = a; }
function kino_rabeFly(from, to, dur, then) { const R = kino_S.rabe; if (!R) return; R.g.position.copy(from); R.g.visible = true; R.fl = { from: from.clone(), to: to.clone(), ctrl: new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + 2.5, (from.z + to.z) / 2), t: 0, dur, then }; kino_rabeClip('Fly'); }
function kino_rabeSitz(x, y, z, ry, clip = 'IdleLookAround') { const R = kino_S.rabe; if (!R) return null; R.g.position.set(x, y, z); R.g.rotation.set(0, ry, 0); R.g.visible = true; R.fl = null; kino_rabeClip(clip); return R; }
// Werte für Endkarten (Zähler, Vertrauen, Antwort) – mit Rückfall, solange die Module der anderen Pakete fehlen
function kino_trust() { if (typeof lwo_S !== 'undefined' && Number.isFinite(lwo_S.trust)) return lwo_S.trust; return story.lwo && Number.isFinite(story.lwo.trust) ? story.lwo.trust : 50; }
function kino_stufe() { if (typeof lwo_stufe === 'function') try { return lwo_stufe(); } catch (e) {} const t = kino_trust(); return t >= 70 ? 'hoch' : t < 30 ? 'miserabel' : 'mittel'; }
function kino_antwort(opts) { return (opts && opts.antwort) || (typeof ch3 !== 'undefined' && (ch3.answer || ch3.choice)) || 'B'; }
function kino_zaehler(k) { try {
  if (k === 'neben') return Object.values(story.side || {}).filter(q => q.state === 'done').length;
  if (k === 'polas') return story.photos ? story.photos.size : 0;
  if (k === 'zettel1') return typeof beob_S !== 'undefined' ? [...beob_S.given].filter(id => /^b_k1_/.test(id)).length : 0;
  if (k === 'seiten1') { const sb = typeof KAP_SAVE !== 'undefined' && KAP_SAVE.sammeln ? KAP_SAVE.sammeln.sb || [] : []; return sb.filter(id => /0?[123]$/.test(String(id))).length; }
} catch (e) {} return 0; }

// ---------------------------------------------------------------- Die Sequenzen (Fassung 3, Abschnitt 5.5), Koordinaten = Weltkoordinaten
function kino_defs() {
  kino_defK1(); kino_defK2(); kino_defK3(); kino_defK3b(); kino_defK3Abspann(); kino_defProlog(); kino_defVorbereitet();
}
// ======================================================== Kapitel 1
// Hildes Platz: auf der Straße unter der letzten brennenden Laterne vor Nr. 7 (Laterne 20 | 4,6; der Transporter parkt bei 14,6 | 3,3)
const KINO_H1 = { x: 22.8, z: 2.2 };
function kino_hildeSpot() { return kino_S.hildeSpot || KINO_H1; }
function kino_defK1() {
  const S = kino_S, H = KINO_H1;
  // Lukes Standort und die Achse Luke → Hilde (einmal zu Beginn festgelegt)
  const ax = () => { const A = S.k1h; return A; };
  const onAxis = (d, y) => sh => { const A = ax(); return [A.hx - A.ux * d, y, A.hz - A.uz * d]; };
  const ufoAt = (x, y, z) => { ufo.position.set(x, y, z); };
  const beam = (k) => { const U = ufo.userData; U.beam.uniforms.opacity.value = .5 * k * (.85 + Math.random() * .15); U.spot.intensity = 900 * k; U.motes.material.opacity = .8 * k; U.under.intensity = 30 + 30 * k; };
  const ufoTick = (dt, k) => { const U = ufo.userData; U.tick(dt, S.T + 100); U.dots.rotation.y += dt * .8; U.dots.children.forEach((d, i) => d.material.emissiveIntensity = Math.sin(S.T * 6 + i) > 0 ? 7 : 1);
    const mp = U.motes.geometry.attributes.position; for (let i = 0; i < mp.count; i++) { let y = mp.getY(i) + dt * 2.5 * (k || 1); if (y > 0) y -= 30; mp.setY(i, y); } mp.needsUpdate = true; };
  const hilde = () => S.fig.hilde;
  // Hilde im Strahl (R-4, CLAUDE.md §17): eine durchgehende Bahn mit echter Beschleunigung – erst auf die Zehen, dann lösen sich die Füße, sie steigt langsam
  // schneller, treibt dabei auf Luke zu und dreht sich wie etwas, das im Wasser hängt. Aus der Bahn: Hubbeschleunigung und Drehrate → Körperreaktion (kino_hildeStrahl)
  const hildeSetz = (x, y, z, yaw, L, dt) => { const P = hilde(); if (!P) return; const H = S.hl || (S.hl = { y: 0, vy: 0, ay: 0, yaw: 0, w: 0, L: 0, ok: false }), h = Math.max(dt, 1e-3);
    if (H.ok && dt > 0) { const vy = (y - H.y) / h, ay = (vy - H.vy) / h; H.ay += (ay - H.ay) * Math.min(1, dt * 10); H.vy = vy; const dw = yaw - H.yaw; H.w += (dw / h - H.w) * Math.min(1, dt * 8); } else if (!H.ok) { H.vy = 0; H.ay = 0; H.w = 0; }
    H.y = y; H.yaw = yaw; H.L = L; H.ok = true; const T = S.T; P.g.position.set(x, y, z); P.g.rotation.set(Math.sin(T * .9) * .05 * L, yaw, Math.sin(T * .7) * .06 * L); };
  const bahn = (T, dt) => { const A = ax(), L = kino_ramp(T, 11.2, 13.6); let y = 0;
    if (T > 11.2) y = .07 * kino_e(kino_ramp(T, 11.2, 13)); if (T > 13) { const s = T - 13; y = .07 + .02 * s + .012 * s * s; } // Fersen, Zehen, dann frei
    const d = 1.5 * kino_e(kino_ramp(T, 15, 20)), yaw = A.face + Math.sin(Math.max(0, T - 13) * .45) * .9 * kino_ramp(T, 13, 16);
    hildeSetz(A.hx - A.ux * d, y, A.hz - A.uz * d, yaw, L, dt); };
  const hildeBlick = v => kino_hildeKopf(v); // Fokus/Blick: ihr Kopf
  const brOrt = () => { const A = ax(); return [A.lx + A.ux * .9 + A.uz * .1, A.lz + A.uz * .9 - A.ux * .1]; }; // dort fiel die Brille
  kino_def('k1h', [
    // 0–6 · Spielerkamera frei: Hilde unter der letzten Laterne, sieht nach oben, dreht dann den Kopf zu Luke; der Blick wird sanft zu ihr gezogen
    { frei: true, dur: 6, keepFlash: true, blick: () => kino_S.a.set(ax().hx, 1.35, ax().hz), blickRate: .9,
      setup(sh) { const P = hilde(); if (P) { kino_fig('hilde', ax().hx, 0, ax().hz, ax().face + .6, 'idle', { look: [ax().hx, 18, ax().hz + .4] }); kino_mimik(P, { Brow_Raise_Inner: .35, Eye_Wide: .2 }); }
        kino_brumm(.7, 2); kino_regen(0, 2.5); S.ufo0 = ufo.position.clone(); beam(0); S.hl = null;
        kino_sag('Mitten auf der Straße steht jemand. Im Nachthemd. Frau Wendt?', '', 4600); },
      tick(k, t, dt) { ufoTick(dt, .2); const A = ax(), u = kino_e(Math.min(1, t / 6)); if (S.ufo0.y > -100) ufoAt(S.ufo0.x + (A.hx - 2 - S.ufo0.x) * u, S.ufo0.y + (21 - S.ufo0.y) * u, S.ufo0.z + (A.hz - .5 - S.ufo0.z) * u); else ufoAt(A.hx - 2, 21, A.hz - .5);
        const P = hilde(); if (!P) return; if (t > 2.6) { P.look = 'cam'; P.g.rotation.y += (ax().face - P.g.rotation.y) * (1 - Math.exp(-dt * .9)); } } },
    // 6–10 · Kamera übernimmt: langsame Fahrt auf Hilde zu, drei Meter bleiben. Die Laterne über ihr wird ausgeblasen – danach nur noch der schwache warme Schein der Scheibe
    { from: 'cam', to: onAxis(3.1, 1.62), look: 'cam', lookTo: sh => [ax().hx, 1.32, ax().hz], dur: 4, ease: 'soft', fov: 44, fovTo: 38, hand: .35, traeg: 6, lens: { at: sh => hildeBlick(kino_S.a), r: .2, amt: 0, to: { amt: .5 } },
      setup(sh) { const L = kino_lampNah(ax().hx, ax().hz); if (L) { kino_lampe(L, 'pusten', .9); kino_after(.95, () => { kino_einatmen(.1, L.wx, 5, L.wz); kino_pusten(.09, L.wx, 5, L.wz); }); }
        const A = ax(); S.vl[0].position.set(A.hx - 1.2, 4.2, A.hz - .6); S.vl[0].color.setHex(0xffc890); S.vl[0].distance = 7; S.vl[0].intensity = 0; // warmer Schein der Scheibe (Führungslicht)
        S.vl[1].position.set(A.hx + A.ux * .9, 1.9, A.hz + A.uz * .9); S.vl[1].color.setHex(0x9fb6de); S.vl[1].distance = 3.2; S.vl[1].intensity = .7; // Mond als Kante hinter ihr
        kino_after(.5, () => { const P = hilde(); if (P) { P.look = 'cam'; kino_mimik(P, { Brow_Raise_Inner: .45, Eye_Squint: .15, Mouth_Frown: .15 }); } }); kino_after(1.6, () => kino_sag('Du hast sie rausgelassen.', 'HILDE', 3000)); },
      tick(k, t, dt) { ufoTick(dt, .2); beam(.08 * kino_ramp(t, 1, 4)); S.vl[0].intensity = 1.8 * kino_ramp(t, .9, 2.4); } },
    // 10–14 · statisch, Lukes Puls: der Strahl fällt – weiß, dann warm, so hell, dass die Ränder ausbrennen (Belichtung gezügelt: sie bleibt lesbar); Papier und Staub steigen; erst die Fersen, dann die Zehen
    { from: onAxis(3.1, 1.62), to: onAxis(3.0, 1.6), look: sh => [ax().hx, 1.05, ax().hz], lookTo: sh => [ax().hx, 1.25, ax().hz], dur: 4, fov: 38, fovTo: 40, hand: .7, breathe: .6, lens: { at: sh => hildeBlick(kino_S.a), r: .22, amt: .45 },
      film: { vig: 1.8, ca: .006 }, env: { exp: 1.02, hemi: [.5, 0x6f82a8, 0x14161c] },
      setup(sh) { const D = S.strahlStaub; D.m.visible = true; kino_brumm(1.1, 2.5); kino_after(1.2, () => kino_box(['E5', 'D5', 'C5', 'B4', 'C5'], 0, .035, .96)); const P = hilde(); if (P) { P.pose = kino_hildeStrahl; kino_mimik(P, { Eye_Wide: .35, Brow_Raise_Inner: .55, Brow_Raise_Outer: .2 }); }
        S.vl[0].intensity = 0; kino_after(3.1, () => { const A = ax(); kino_stoff(.05); Audio.play('scrape1', { gain: .05, rate: 2.2, dur: .3, hp: 1500, x: A.hx, y: .05, z: A.hz, ref: 1.5 }); }); }, // die Zehen schleifen über den Asphalt
      tick(k, t, dt) { ufoTick(dt, 1); beam(kino_ramp(t, 0, 1.4)); ufo.userData.spot.intensity = 150 * kino_ramp(t, 0, 1.4); ufo.userData.beam.uniforms.opacity.value *= .4; const U = filmPass.uniforms; U.flash.value = .02 + .05 * kino_ramp(t, .5, 3.5);
        S.vl[1].intensity = 1.4; kino_staubTick(dt, ax().hx, ax().hz, 1 + t * .3); bahn(10 + t, dt); },
      teardown() { filmPass.uniforms.flash.value = 0; } },
    // 14–20 · Kamera folgt ihr nach oben, sehr langsam; sie treibt auf Luke zu, dreht sich im Licht, sieht ihn an. Geschrien, gegen das Brummen
    { from: onAxis(3.0, 1.6), to: onAxis(2.85, 1.5), look: () => { const v = hildeBlick(kino_S.w); v.y -= .5; return v; }, dur: 6, ease: 'soft', fov: 42, fovTo: 50, hand: .6, follow: 6, traeg: 9,
      lens: { at: () => hildeBlick(kino_S.a), r: .2, amt: .4 }, film: { vig: 1.7, ca: .005 }, env: { exp: 1.0, hemi: [.5, 0x6f82a8, 0x14161c] },
      lines: [['In den Keller! Unter der Erde sieht sie dich nicht!', 'HILDE', .6, 3000], ['Hinter die Bilder! Lucy!', 'HILDE', 3.4, 2600]],
      setup() { const P = hilde(); if (P) { P.pose = kino_hildeStrahl; P.look = 'cam'; kino_mimik(P, { Brow_Raise_Inner: .7, Eye_Wide: .3, V_Open: .25, Mouth_Stretch: .2 }); } },
      tick(k, t, dt) { ufoTick(dt, 1); beam(1); ufo.userData.spot.intensity = 150; ufo.userData.beam.uniforms.opacity.value *= .4; filmPass.uniforms.flash.value = .04 + .015 * Math.sin(t * 9); S.vl[1].intensity = 1.4; kino_staubTick(dt, ax().hx, ax().hz, 1.6); bahn(14 + t, dt); },
      teardown() { filmPass.uniforms.flash.value = 0; } },
    // 20–26 · ganz nah: sie kommt von unten ins Bild, auf Augenhöhe, und steigt an Lukes Gesicht vorbei; lächelt traurig, die Hand erreicht seine Wange nicht, eine Träne läuft nach oben. Sechs Sekunden Stille
    { path(e, t, v, w, sh) { const A = ax(); v.set(A.lx, 1.64, A.lz); const P = hilde(); if (P && P.bones.head) { P.g.updateMatrixWorld(true); P.bones.head.getWorldPosition(w); w.y += .02; if (t > 3.6) w.y += (t - 3.6) * .55; } else w.set(A.lx + A.ux, 1.7 + t * .3, A.lz + A.uz); },
      dur: 6, fov: 36, fovTo: 32, hand: .25, follow: 4, lens: { at: () => hildeBlick(kino_S.a), r: .16, amt: .6 }, film: { vig: 2, ca: .004, toe: .6 },
      lines: [['„Du hast sie rausgelassen“, flüstert sie. Dann lächelt sie. Traurig.', '', 1.4, 4200]],
      setup(sh) { kino_abriss(.05); kino_brumm(0, .05); const A = Audio; if (A.hum) A.hum(false); if (A.ctx && A.world) { const t = A.ctx.currentTime; A.world.gain.cancelScheduledValues(t); A.world.gain.setValueAtTime(0, t); }
        kino_regen(0, .05); if (Audio.ufoNear) Audio.ufoNear(0); kino_hide('strahlStaub'); beam(.1); ufo.userData.spot.intensity = 60; const P = hilde();
        if (P) { P.look = 'cam'; P.pose = (Q, tt, dd) => { kino_hildeStrahl(Q, tt, dd); kino_hildeHand(Q, tt); }; kino_mimik(P, { Mouth_Smile: .45, Brow_Raise_Inner: .55, Eye_Squint: .3, Cheek_Raise: .2 }); }
        kino_after(1.3, () => { const Q = hilde(); if (Q) Q.sprichT = 1.4; }); // sie flüstert
        kino_after(2.8, () => { const A2 = ax(); kino_atem(.14, 1.05, A2.lx + A2.ux * .3, 1.7, A2.lz + A2.uz * .3); }); kino_show('traene'); },
      tick(k, t, dt) { ufoTick(dt, .5); beam(.1); ufo.userData.spot.intensity = 60; const P = hilde(), A = ax(); if (!P) return; const y0 = 1.64 - 1.5;
        kino_S.lit[0] = kino_S.litH || (kino_S.litH = { p: kino_V(0, 0, 0), c: 0xffe2bc, d: 3, i: 0 }); kino_S.litH.p.set(A.lx + A.ux * .2 - A.uz * .35, 2.4, A.lz + A.uz * .2 + A.ux * .35); kino_S.litH.i = 1.7; // warmes Oberlicht der Scheibe, seitlich: Modellierung im Gesicht
        S.vl[1].position.set(A.lx + A.ux * 1.4, 2.2, A.lz + A.uz * 1.4); S.vl[1].color.setHex(0xaec4ea); S.vl[1].distance = 2.6; S.vl[1].intensity = 1.1; // kalte Kante von hinten
        const y = y0 + (t < 2.2 ? -.55 + t * .22 : -.066 + (t - 2.2) * .22 + Math.max(0, t - 4) * .45);
        hildeSetz(A.lx + A.ux * .68, y, A.lz + A.uz * .52, A.face + Math.sin(t * .5) * .08, 1, dt); P.g.rotation.x = -.08; kino_traene(P, t); },
      teardown() { kino_hide('traene'); } },
    // 26–28 · der Blick reißt nach oben: das Licht reißt sie hoch – Arme und Beine schlagen nach unten nach, dann ein heller Fleck, dann ist der Kegel leer. Weißblitz, ein Schlag wie eine Stahltür, ein Kind holt Luft
    { path(e, t, v, w) { const A = ax(); v.set(A.lx, 1.64, A.lz); const P = hilde(); const hy = P ? P.g.position.y + 1.45 : 3; w.set(A.lx + A.ux * .9, Math.min(hy, 1.64 + 8 * kino_e(Math.min(1, t / .5)) + t * 2), A.lz + A.uz * .9); }, dur: 2, fov: 46, hand: .2, follow: 9,
      shakes: [[.05, .025, .7]],
      setup() { const P = hilde(); if (P) { P.look = null; P.pose = kino_hildeStrahl; kino_mimik(P, { Eye_Wide: .6, Brow_Raise_Inner: .5, V_Open: .3 }); } S.k1hY = P ? P.g.position.y : 1.8; beam(1); },
      tick(k, t, dt) { ufoTick(dt, 1); beam(t < 1.1 ? 1 : 0); ufo.userData.spot.intensity = t < 1.1 ? 320 : 0; const P = hilde(), A = ax(); if (P) { hildeSetz(A.lx + A.ux * .68, S.k1hY + 1.2 * t + 9 * t * t, A.lz + A.uz * .52, A.face + t * 2.5, 1, dt); P.g.visible = t < 1.05; }
        filmPass.uniforms.flash.value = t > 1.05 && t < 1.16 ? 1 : 0; if (t > 1.05 && !S.k1hSchlag) { S.k1hSchlag = 1; kino_schlag(1); kino_after(.55, () => kino_einatmen(.13, undefined, undefined, undefined, .8)); } },
      teardown() { filmPass.uniforms.flash.value = 0; S.k1hSchlag = 0; kino_figOff('hilde'); S.hl = null; } },
    // 28–34 · zurück auf Straßenhöhe, Luke ist in die Knie gegangen: der Asphalt glänzt, die Lesebrille, ein Polaroid segelt herab – Zayn. Regen kommt zurück, im Osten eine Fahrradklingel
    { path(e, t, v, w) { const A = ax(), B = brOrt(); const dn = kino_e(Math.min(1, t / 1.1)); v.set(A.lx + A.ux * .12, 1.64 - .78 * dn + Math.sin(t * 2.1) * .01, A.lz + A.uz * .12); w.set(B[0], .02 + .9 * (1 - dn), B[1]); }, // R-4: die Brille fiel dort, wo das Licht sie an Luke vorbei hochriss – direkt vor seinen Knien
      dur: 6, fov: 40, fovTo: 30, hand: .9, breathe: .8, follow: 2.5, shakes: [[.4, .014, .8]], lens: { at: () => { const B = brOrt(); return kino_S.a.set(B[0], .02, B[1]); }, r: .16, amt: .6 }, env: { hemi: [.55, 0x6f82a8, 0x14161c], moon: [.55, 0x9fb2dc], exp: 1.7 },
      setup() { const A = ax(), B = brOrt(); kino_show('nass', A.hx, .021, A.hz); kino_brille(B[0], B[1], .7 + Math.atan2(A.ux, A.uz));
        kino_regen(.28, 2.5); kino_still(false, 2); S.polaDown = false; const U = ufo.userData; U.beam.uniforms.opacity.value = 0; U.spot.intensity = 0; U.motes.material.opacity = 0; U.tick(0, S.T);
        S.vl[0].position.set(B[0] + A.uz * .7, 1.1, B[1] - A.ux * .7); S.vl[0].color.setHex(0xa8badc); S.vl[0].distance = 2.6; S.vl[0].intensity = 1.6; /* Mond streift über die Gläser */ S.vl[1].position.set(A.hx, 2.2, A.hz); S.vl[1].color.setHex(0xffb878); S.vl[1].distance = 5; S.vl[1].intensity = .6; kino_after(4.2, () => kino_klingel(A.hx + 70, A.hz - 3)); },
      tick(k, t, dt) { const A = ax(), p = kino_S.obj.pola; if (t < 1.4) { p.visible = false; return; } p.visible = true; const u = Math.min(1, (t - 1.4) / 3.6), y = 3.2 * (1 - u) * (1 - u * .15) + .03 * u;
        const B = brOrt(); p.position.set(B[0] + A.ux * .35 - A.uz * .2 + .25 * (1 - u) + Math.sin(t * 3.1) * .08 * (1 - u), Math.max(.03, y), B[1] + A.uz * .35 + A.ux * .2 + Math.cos(t * 2.3) * .06 * (1 - u)); p.rotation.set((1 - u) * (.8 + Math.sin(t * 4) * .5), .3 + t * .25 * (1 - u), (1 - u) * Math.sin(t * 3.3) * .6);
        if (u >= 1 && !S.polaDown) { S.polaDown = true; if (Audio.paper) Audio.paper(); } } },
    // 34–40 · der Kegel hebt ab, tastet Nr. 9, die Hecke, Vegas’ Veranda ab und kommt zurück – wie eine Taschenlampe in einer Kinderhand
    { path(e, t, v, w) { const A = ax(); v.set(A.lx, 1.05 + .5 * kino_e(Math.min(1, t / 2)), A.lz); w.copy(ufo.position); w.y -= 3; }, dur: 6, fov: 50, hand: .8, follow: 1.6,
      setup() { const A = ax(); S.scan = [[50, -9], [44, 9], [-27, -9], [A.hx - A.ux * 3, A.hz - A.uz * 3]]; S.scanP = kino_V(A.hx, 0, A.hz); kino_brumm(.8, 1.5); if (Audio.hum) Audio.hum(true);
        kino_after(2.6, () => { const P = camera.position, d = camera.getWorldDirection(kino_S.a); kino_S.own = true; subtitle('Ich seh dich gleich …', 3200, 'DAS KIND'); kino_S.own = false;
          Audio.whisper(P.x - d.z * .3, P.y + .05, P.z + d.x * .3, 1.6); }); },
      tick(k, t, dt) { ufoTick(dt, 1); beam(.85 + .15 * Math.sin(t * 7)); const seg = Math.min(3, Math.floor(t / 1.5)), f = (t % 1.5) / 1.5, s = f < .35 ? f / .35 : 1, jit = Math.sin(t * 13) * .5 + Math.sin(t * 29) * .25;
        const [tx, tz] = S.scan[seg]; S.scanP.x += (tx + jit - S.scanP.x) * Math.min(1, dt * (1.5 + 5 * s)); S.scanP.z += (tz - S.scanP.z) * Math.min(1, dt * (1.5 + 5 * s)); ufo.position.set(S.scanP.x, 20 + Math.sin(t) * .3, S.scanP.z); } },
    // 40–44 · zurück an den Spieler: der Kegel streift einen Meter neben Luke den Boden
    { frei: true, dur: 4, keepFlash: true, blick: () => kino_S.a.set(ufo.position.x, .5, ufo.position.z), blickRate: 1.2,
      lines: [], // A-25: keine erzählenden Angst-Untertitel
      setup() { document.body.classList.remove('kinoFrei'); const A = ax(); S.scanP.set(A.lx + A.uz * 5, 0, A.lz - A.ux * 5); kino_brumm(.55, 2);
        kino_after(.4, () => { if (typeof questPop === 'function') { kino_S.qp = kino_S.qp || []; kino_S.qp.push(['FIBEL', 'Versteck dich vor dem Licht. Zurück in den Keller.']); } }); },
      tick(k, t, dt) { ufoTick(dt, 1); beam(.35); ufo.position.x += (S.scanP.x - ufo.position.x) * Math.min(1, dt * 1.4); ufo.position.z += (S.scanP.z - ufo.position.z) * Math.min(1, dt * 1.4); ufo.position.y = 20; } },
  ], { name: 'Hilde im Strahl', skipAfter: Infinity, nahtlos: true, offen: true, uebergabe: true,
    start() { // Achse Luke → Hilde; steht Luke weiter als 9 m weg, springt die Einstellung ab 6 s näher heran (Schnitt auf Bewegung)
      const P = player.pos, hx = H.x, hz = H.z; let dx = hx - P.x, dz = hz - P.z, d = Math.hypot(dx, dz); if (d < .5) { dx = -1; dz = 0; d = 1; } const ux = dx / d, uz = dz / d;
      S.k1h = { hx, hz, ux, uz, face: Math.atan2(-ux, -uz), lx: hx - ux * Math.min(d, 3.1), lz: hz - uz * Math.min(d, 3.1), d }; S.hildeSpot = { x: hx, z: hz };
      const sh1 = KINO.k1h.shots[1]; if (d > 9) { sh1.from = sh => { const A = kino_S.k1h; return [A.hx - A.ux * 7, 1.62, A.hz - A.uz * 7]; }; sh1.look = sh => { const A = kino_S.k1h; return [A.hx, 1.3, A.hz]; }; } else { sh1.from = 'cam'; sh1.look = 'cam'; }
      state.ufoOn = false; state.phase2 = true; if (typeof victim !== 'undefined') victim.visible = false; },
    done() { const U = ufo.userData; if (Audio.hum) Audio.hum(true); U.beam.uniforms.opacity.value = .5; U.spot.intensity = 900; state.ufoOn = true; state.finalScare = true; state.lookLine = true; state.p2t = 14.5; } });

  // ---- Abspann K1 · „Du hast sie rausgelassen“ (36 s, überspringbar nach 3 s) – danach Endkarte mit vier Zählern
  kino_def('k1', [
    // 0–7 · das Dorf von oben, alle Laternen aus, die Scheibe fort; bei 5 s geht als einzige Vegas’ Verandalampe wieder an, flackert, hält
    { from: [29, 16, 6], to: [20, 18, 2], look: [-22, 0, -7], lookTo: [-24, 0, -6.5], dur: 7, fov: 42, fadeIn: 1800, hand: .2, ease: 'soft', env: { fog: [0x141b2c, .018], hemi: [.55, 0x6f82a8, 0x14161c], moon: [.55, 0x9fb2dc], exp: 1.55 },
      setup(sh) { const v = kino_show('veranda', -27.1, 2.3, -11.95); v.material.opacity = 0; sh.porch = porchLights[0] ? porchLights[0].dead : true; if (porchLights[0]) porchLights[0].dead = true;
        kino_lamps(L => kino_lampe(L, 'aus')); kino_brumm(.6, .01); kino_brumm(0, 1); { const U = ufo.userData; U.beam.uniforms.opacity.value = 0; U.spot.intensity = 0; U.under.intensity = 0; U.motes.material.opacity = 0; U.tick(0, 0); } if (Audio.hum) Audio.hum(false); kino_regen(.55, 1.5); kino_after(2.2, () => Audio.play('dog', { gain: .06, rate: .92, x: -60, y: 1, z: 40, ref: 20, lp: 900 })); },
      tick(k, t) { const on = t > 5 ? (t < 5.5 ? (Math.sin(t * 60) > 0 ? 1 : .15) : 1) : 0; if (porchLights[0]) porchLights[0].dead = on < .5; kino_S.obj.veranda.material.opacity = .9 * on; },
      sfx: [[() => Audio.play('switch1', { gain: .35, rate: .7, x: -27.1, y: 2.3, z: -12, ref: 4 }), 5]],
      teardown(sh) { kino_hide('veranda'); if (porchLights[0]) porchLights[0].dead = sh.porch; } },
    // 7–14 · die nasse Stelle, wo Hilde stand; die Lesebrille. Drei kleine schnelle Schritte auf nassem Asphalt
    { from: sh => { const h = kino_hildeSpot(); return [h.x + .85, .4, h.z + .72]; }, to: sh => { const h = kino_hildeSpot(); return [h.x + .6, .3, h.z + .5]; }, look: sh => { const h = kino_hildeSpot(); return [h.x + .05, .04, h.z - .05]; },
      dur: 7, fov: 30, fovTo: 27, hand: .25, ease: 'soft', lens: { at: sh => { const h = kino_hildeSpot(); return kino_S.a.set(h.x + .02, .03, h.z - .05); }, r: .16, amt: .8 }, env: { fog: [0x121a2a, .02], hemi: [.5, 0x6f82a8, 0x14161c], moon: [.5, 0x9fb2dc], exp: 1.5 },
      setup() { const h = kino_hildeSpot(); kino_show('nass', h.x, .021, h.z); kino_brille(h.x + .02, h.z - .05, .7); kino_lamps(L => kino_lampe(L, 'aus'));
        kino_S.vl[0].position.set(h.x - .5, .9, h.z - .6); kino_S.vl[0].color.setHex(0x9fb0d4); kino_S.vl[0].distance = 2.2; kino_S.vl[0].intensity = .7; // Mondlicht als Streiflicht auf den Gläsern
        kino_katze(h); },
      sfx: [[() => { const h = kino_hildeSpot(); kino_trippeln(h.x - 3.2, h.z - 1.2, .05); }, 5]],
      teardown() { kino_hide('nass', 'brille', 'brilleM'); kino_katzeZurueck(); } },
    // 14–21 · Nr. 7, dunkel: im Wohnzimmer flackert das Licht einmal auf; auf dem Briefkasten sitzt Whiskey, nass, sieht zur Kellertreppe, dann in die Kamera
    { from: [22.6, 1.55, -3.0], to: [25.4, 1.45, -5.2], look: [25.2, 1.45, -12.8], lookTo: [28.3, 1.32, -6.95], dur: 7, fov: 40, fovTo: 32, hand: .35, ease: 'soft', env: { fog: [0x121a2a, .02], hemi: [.6, 0x6f82a8, 0x14161c], moon: [.65, 0x9fb2dc], exp: 1.85 },
      lens: { at: () => kino_S.t < 4 ? kino_S.a.set(25.2, 1.45, -12.8) : kino_S.a.set(28.35, 1.35, -6.9), r: .2, amt: .45 },
      lines: [['Im Wohnzimmer brennt kurz Licht. Aber niemand bewegt sich.', '', .9, 5200]],
      setup(sh) { kino_lamps(L => kino_lampe(L, 'aus')); const W = typeof whiskey_S !== 'undefined' && whiskey_S.g && whiskey_S.g.visible && Math.hypot(whiskey_S.g.position.x - 28.4, whiskey_S.g.position.z + 6.9) < 1.5 ? whiskey_S.g : null;
        sh.echt = W; if (!W) kino_rabeSitz(28.4, 1.2, -6.9, PI * .9, 'IdleLookAround'); sh.r0 = W ? W.rotation.y : 0;
        S.vl[0].position.set(27.2, 2.6, -4.6); S.vl[0].color.setHex(0xa8bce4); S.vl[0].distance = 7; S.vl[0].intensity = .9; },
      tick(k, t, dt, sh) { const on = t > 2.6 && t < 4.4 ? (t < 2.75 || (t > 3.1 && t < 3.25) ? .2 : 1) : 0; kino_S.lit[0] = kino_S.lit0 || (kino_S.lit0 = { p: kino_V(25.3, Y + 1.45, -16.5), c: 0xffa050, d: 9, i: 0 }); kino_S.lit0.i = 3.6 * on;
        if (typeof shade !== 'undefined') shade.material.emissiveIntensity = .7 * on;
        const g = sh.echt || (kino_S.rabe && kino_S.rabe.g); if (g) { const want = t < 4.6 ? PI * .95 : Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z); g.rotation.y += (want - g.rotation.y) * Math.min(1, dt * 3); } },
      sfx: [[() => Audio.play('switch1', { gain: .25, rate: .9, x: 25, y: 1.5, z: -15, ref: 2 }), 2.6], [() => Audio.play('buzz', { gain: .12, rate: .8, x: 25, y: 1.5, z: -15, ref: 2 }), 4.3],
        [() => { Audio.play('metalHit2', { gain: .09, rate: 3.4, hp: 2000, dur: .3, x: 28.4, y: 1, z: -6.9, ref: 1.5 }); setTimeout(() => Audio.play('metalHit2', { gain: .06, rate: 3.8, hp: 2200, dur: .2, x: 28.2, y: .1, z: -6.7, ref: 1.5 }), 420); }, 5.6]],
      teardown(sh) { if (typeof shade !== 'undefined') shade.material.emissiveIntensity = 0; if (sh.echt) sh.echt.rotation.y = sh.r0; kino_hide('rabe'); } },
    // 21–29 · Keller: die Wand wölbt sich wie nasses Papier; eine Reißzwecke springt heraus, eine Zeichnung segelt zu Boden – „LUKE, 9“. Ganz tief unten lacht ein Kind
    { from: [300, 1.5, 302], to: [300, .9, 298.5], look: [299.8, 1.25, 296], dur: 8, fov: 50, env: 'keller', hand: .3, ease: 'soft', lens: { at: [299.4, 1.3, 296.4], r: .3, amt: .35 },
      setup(sh) { const art = []; scene.traverse(o => { if (o.isMesh && B.wallArt && o.material === B.wallArt.material) art.push([o, o.scale.clone(), o.position.z]); }); sh.art = art; kino_S.obj.staub.visible = true;
        kino_S.coldLight.position.set(299.6, 1.4, 296.6); kino_S.zfall = null; },
      tick(k, t, dt, sh) { const s = 1 + .045 * kino_e(Math.min(1, t / 7)); for (const [o, sc, z0] of sh.art) { o.scale.set(sc.x * s, sc.y * s, sc.z); o.position.z = z0 + (s - 1) * .9; }
        kino_S.coldLight.intensity = .55 + .12 * Math.sin(t * 2.3) + .05 * Math.sin(t * 9.1); kino_S.lit[0] = kino_S.litK || (kino_S.litK = { p: kino_V(299.6, 1.5, 296.8), c: 0xdfe8ff, d: 7, i: 0 }); kino_S.litK.i = kino_S.coldLight.intensity * 1.6;
        const D = kino_S.dust, P = D.pos; for (let i = 0; i < D.N; i++) { const j = i * 3; D.seed[j + 2] -= dt * (.12 + (i % 7) * .02) * (.4 + k); if (D.seed[j + 2] < .05) D.seed[j + 2] = 6; P[j] = 300 + D.seed[j] + Math.sin(t * .7 + i) * .05; P[j + 1] = D.seed[j + 1] + Math.sin(t * .5 + i * 1.3) * .04; P[j + 2] = 296.2 + D.seed[j + 2]; }
        D.m.geometry.attributes.position.needsUpdate = true;
        const zg = kino_S.obj.zeichnung; if (t > 3.1) { const u = t - 3.1, f = Math.min(1, u / 2.6); zg.visible = true; zg.position.set(299.2 + Math.sin(u * 3.2) * .16 * (1 - f) + .1 * f, 1.62 - 1.57 * (f * f * (3 - 2 * f)), 296.35 + .35 * f);
          zg.rotation.set(-PI / 2 * f + Math.sin(u * 4) * .45 * (1 - f), Math.sin(u * 2.2) * .5 * (1 - f) + .3 * f, Math.sin(u * 3.7) * .35 * (1 - f)); if (f >= 1 && !kino_S.zfall) { kino_S.zfall = 1; if (Audio.paper) Audio.paper(); } } else { zg.visible = true; zg.position.set(299.2, 1.62, 296.36); zg.rotation.set(0, 0, .04); } },
      sfx: [[() => Audio.play('rumble', { gain: .25, rate: .6, lp: 300 }), .2], [() => Audio.play('metalHit2', { gain: .1, rate: 4, hp: 2500, dur: .12, x: 299.2, y: 1.7, z: 296.4, ref: 1.2 }), 3.05],
        [() => { Audio.play('giggle', { gain: .22, rate: .78, offset: .2, dur: 1.8, x: 300, y: -3, z: 294, ref: 2, lp: 1400 }); }, 5.2]],
      teardown(sh) { for (const [o, sc, z0] of sh.art || []) { o.scale.copy(sc); o.position.z = z0; } kino_hide('staub', 'zeichnung'); kino_S.coldLight.intensity = 0; } },
    // 29–33 · Ortsschild: neben der roten 211 frisch in Kreide 210
    { from: [-68.5, 1.8, 4.5], to: [-69.5, 2.0, 5.4], look: [-72.28, 1.55, 6.3], dur: 4, fov: 30, env: { exp: 1.9, fog: [0x121a2a, .02], hemi: [.5, 0x6f82a8, 0x14161c], moon: [.5, 0x9fb2dc] }, ease: 'soft', lens: { at: [-72.28, 1.55, 6.3], r: .22, amt: .4 },
      setup() { kino_schild('orig'); kino_regen(.35, 1); },
      sfx: [[() => { kino_schild('2'); kino_kreide(-72.2, 1.5, 6.3); }, .6], [() => kino_schild('21'), 1.15], [() => kino_schild('210'), 1.7], [() => kino_still(true, 1.4), 2.6]] },
    // 33–36 · Schwarz, dann die Endkarte (Schreibmaschine)
    { black: true, dur: 2.2, fadeOut: 900 },
    { card: () => ['KAPITEL 1 · KELLER BLEIBT ZU', 'Frau Wendt ist fort.', 'Du hast etwas aus dem Keller gelassen. Es hatte Lucys Stimme.', 'Hinter den Kinderzeichnungen ist es kalt. Und ganz weit unten lacht ein Kind.',
      { t: `Nebenaufgaben ${Math.min(18, kino_zaehler('neben'))} / 18 · Polaroids ${kino_zaehler('polas')} / 7 · Zettel mit drei Punkten ${kino_zaehler('zettel1')} / 2 · Lose Seiten ${kino_zaehler('seiten1')} / 3`, klein: true }], dur: 'auto', fadeOut: 600 },
  ], { name: 'Du hast sie rausgelassen', done() { kino_schild('210'); } });
}
// Aufruf aus der Basis (Stromausfall, sobald die Scheibe über dem Dorf ist): startet „Hilde im Strahl“, danach ending() wie bisher
function kino_hilde() { const S = kino_S; if (!S.ready || S.on || !KINO.k1h || !S.fig.hilde) return false; state.phase2 = true; kino_play('k1h').catch(e => console.error('Kino k1h', e)); return true; }
// Katze BÄRBEL (katzen.js): schiebt sich von rechts ins Bild, schnuppert an der Brille, setzt sich, starrt in den leeren Nebel links – danach wie vorher
function kino_katze(h) { if (typeof katzen_get !== 'function') return; try { const k = katzen_get('BÄRBEL'); if (!k) return; kino_S.katze = { k, on: k.on, x: k.x, z: k.z, st: k.st, stare: k.stare ? k.stare.clone() : null };
  const K = katzen_spawn({ name: 'BÄRBEL', x: h.x + 2.4, z: h.z + .6, ry: -PI / 2 }); if (!K) return; kino_after(1.6, () => katzen_goto(K, h.x + .5, h.z + .62, { dann: 'sit' }));
  kino_after(4.2, () => katzen_stare(K, [h.x - 5, .4, h.z - 3.5])); } catch (e) { console.warn('Kino: Katze', e); } }
function kino_katzeZurueck() { const C = kino_S.katze; if (!C) return; kino_S.katze = null; try { if (!C.on) katzen_hide(C.k); else { katzen_place(C.k, C.x, C.z, { pose: C.st === 'go' ? 'sit' : C.st }); katzen_stare(C.k, C.stare); } } catch (e) {} }
// Hildes Kopf (für Fokus und Blick)
function kino_hildeKopf(v) { const P = kino_S.fig.hilde; if (P && P.g.visible && P.bones.head) { P.g.updateMatrixWorld(true); P.bones.head.getWorldPosition(v); return v; } const h = kino_hildeSpot(); return v.set(h.x, 1.5, h.z); }
// Hilde im Strahl – Körperreaktion auf die Kraft des Lichts (R-4, CLAUDE.md §17): Arme schweben seitlich hoch wie im Wasser und sacken bei jedem Ruck nach oben nach
// (Trägheit, Feder mit Überschwingen), Beine hängen mit weichen Knien und pendeln nach, die Zehen zeigen nach unten, der Oberkörper wölbt sich leicht nach hinten,
// bei Drehung bleiben die Glieder zurück. Eingang: kino_S.hl (L = wie weit sie schon schwebt, ay = Hubbeschleunigung, w = Drehrate) aus hildeSetz.
const KINO_HV = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3());
function kino_hildeStrahl(P, t, dt) { const S = kino_S, H = S.hl, B = P.bones; if (!H || H.L <= .001) return; const Z = P.ph || (P.ph = { a: .1, av: 0, l: 0, lv: 0, s: 0, sv: 0 }), L = H.L, T = S.T, h = Math.min(dt, .05);
  const spr = (k, kv, tg, om, ze) => { Z[kv] += ((tg - Z[k]) * om * om - 2 * ze * om * Z[kv]) * h; Z[k] += Z[kv] * h; };
  const ay = kino_cl(H.ay, -4, 6);
  spr('a', 'av', .62 + .28 * Math.sin(T * .8) * .5 - ay * .11, 4.2, .3); // Abspreizen der Arme (rad)
  spr('l', 'lv', .18 + .08 * Math.sin(T * .7 + 1) - ay * .05, 3.4, .28); // Pendeln der Beine
  spr('s', 'sv', kino_cl(-H.w * .45, -.7, .7), 3, .4); // Drehung: die Glieder bleiben zurück
  const [fw, lf, dn, d1, d2, d3] = KINO_HV; P.g.getWorldDirection(fw); fw.y = 0; fw.normalize(); lf.crossVectors(KINO_UP, fw).normalize(); dn.set(0, -1, 0);
  const a = Z.a;
  for (const sd of [1, -1]) { const up = sd > 0 ? B.lArm : B.rArm, fo = sd > 0 ? B.lFore : B.rFore, ph = sd > 0 ? 0 : 1.7;
    d1.copy(dn).multiplyScalar(Math.cos(a + .08 * Math.sin(T * 1.1 + ph))).addScaledVector(lf, sd * Math.sin(a + .08 * Math.sin(T * 1.1 + ph))).addScaledVector(fw, .18 + Z.s * sd * .5 + .06 * Math.sin(T * .9 + ph)).normalize();
    kino_richte(up, d1, L * .85); d2.copy(d1).addScaledVector(KINO_UP, .35).addScaledVector(fw, .25).normalize(); kino_richte(fo, d2, L * .7); }
  for (const sd of [1, -1]) { const th = sd > 0 ? B.lThigh : B.rThigh, ca = sd > 0 ? B.lCalf : B.rCalf, ft = sd > 0 ? B.lFoot : B.rFoot, ph = sd > 0 ? 0 : 2.1, sw = Z.l * Math.sin(T * 1.3 + ph);
    d1.copy(dn).addScaledVector(fw, .1 + sw * .5 - Z.s * .2).addScaledVector(lf, sd * .07).normalize(); kino_richte(th, d1, L * .8);
    d2.copy(dn).addScaledVector(fw, -.32 - Z.l * .6 + sw * .2).addScaledVector(lf, sd * .03).normalize(); kino_richte(ca, d2, L * .8);
    d3.copy(dn).multiplyScalar(.85).addScaledVector(fw, .4).normalize(); kino_richte(ft, d3, kino_cl(H.L * 1.3, 0, 1) * .9); } // Zehen nach unten – auch schon beim Abheben
  if (B.spine) { d1.copy(KINO_UP).addScaledVector(fw, -.12 * L - kino_cl(ay, 0, 6) * .02).normalize(); kino_richte(B.spine, d1, .6); } }
// Mimik in Kinofiguren (Formen des Gesichts, wo vorhanden): kino_mimik(P, { Eye_Wide: .3, … }) – weich eingeblendet, über Blinzeln und Sprechen gelegt
function kino_mimik(P, o) { if (!P) return; if (typeof FIGUREN_FACE_IX === 'undefined' || !o) { P.mimZ = null; return; } const v = P.mimZ || new Float32Array(FIGUREN_FACE_CH.length); v.fill(0);
  for (const [n, w] of Object.entries(o)) { if (FIGUREN_FACE_IX[n] !== undefined) v[FIGUREN_FACE_IX[n]] = w; else for (const s of ['_L', '_R']) if (FIGUREN_FACE_IX[n + s] !== undefined) v[FIGUREN_FACE_IX[n + s]] = w; }
  P.mimZ = v; P.mimV = P.mimV || new Float32Array(v.length); }
function kino_mimikTick(P, dt) { const F = P.q6, Z = P.mimZ, V = P.mimV; if (!F || !Z || !V) return; const k = 1 - Math.exp(-dt * 3);
  for (let i = 0; i < Z.length; i++) { V[i] += (Z[i] - V[i]) * k; if (V[i] < .002) continue; const a = F.ch[i]; for (let j = 0; j < a.length; j += 2) a[j][a[j + 1]] = Math.max(a[j][a[j + 1]], V[i]); } }
// Sprecher → Kinofigur (Mund bewegt sich, solange die Zeile läuft; figuren.js liest sprichT)
const KINO_SPRECHER = { HILDE: ['hilde'], LUCY: ['lucy', 'lucyK'], VEGAS: ['vegas'], ZAYN: ['zayn'], ROXY: ['roxy'], MIKE: ['mike'], CLEO: ['cleo'] };
function kino_sprecher(who, txt, ms) { const k = String(who || '').replace(/<[^>]*>/g, '').trim().toUpperCase().split(/[ ·,(]/)[0], L = KINO_SPRECHER[k]; if (!L) return;
  for (const n of L) { const P = kino_S.fig[n]; if (P && P.g.visible) { P.sprichT = Math.min((ms || 3000) / 1000, String(txt).replace(/<[^>]*>/g, '').length * .062 + .3); return; } } }
// Hildes Hand hebt sich zu Lukes Wange und erreicht sie nicht
function kino_hildeHand(P, t) { const w = kino_ramp(t, 1.2, 3.2) * (1 - kino_ramp(t, 4.6, 5.8)); camera.getWorldDirection(kino_d); kino_S.b.copy(camera.position).addScaledVector(kino_d, .25); kino_ax.crossVectors(kino_d, KINO_UP).normalize(); kino_S.b.addScaledVector(kino_ax, .22); kino_S.b.y -= .12; kino_arm(P, 'r', kino_S.b, w * .5, .7); } // Richtung Wange, erreicht sie nicht
// Die Träne läuft nach oben: kleiner feuchter Glanz an der Wange, steigt zur Schläfe
function kino_traene(P, t) { const o = kino_S.obj.traene, B = P.bones.head; if (!o || !B) return; B.getWorldPosition(kino_hp); camera.getWorldDirection(kino_d);
  const u = kino_ramp(t, 2.4, 5.2); kino_ax.crossVectors(kino_d, KINO_UP).normalize(); o.position.copy(kino_hp).addScaledVector(kino_ax, .038).addScaledVector(kino_d, -.075); o.position.y += -.035 + u * .07;
  o.material.opacity = t > 2.2 && t < 5.4 ? .9 : 0; }
// Staub, Papier und Laub steigen im Strahl
function kino_staubTick(dt, cx, cz, sp) { const D = kino_S.strahlStaub; if (!D) return; D.m.visible = true; const P = D.pos, s = D.seed;
  for (let i = 0; i < D.N; i++) { const j = i * 4; s[j + 2] += dt * s[j + 3] * sp; if (s[j + 2] > 18) s[j + 2] -= 18; s[j] += dt * .6; P[i * 3] = cx + Math.cos(s[j]) * s[j + 1]; P[i * 3 + 1] = s[j + 2]; P[i * 3 + 2] = cz + Math.sin(s[j]) * s[j + 1]; }
  D.m.geometry.attributes.position.needsUpdate = true; }

// ======================================================== Kapitel 2 · Höhepunkt A „Bruder.“ (16 s), B „Das Gesicht im Glas“ (31 s), Abspann „Ihre Augen“ (31 s)
const KINO_K2_KARTE = false; // AP-16: die Endkarte Kap. 2 läuft am Gully unter den dreizehn Schlägen (uebergang.js ruft kino_karte(KINO_KARTE2()))
function KINO_KARTE2() { const E = typeof lwo_kapitelende === 'function' ? lwo_kapitelende(2) : null, z = E && E.zeile || (kino_stufe() === 'miserabel' ? 'Protokolliert.' : null);
  return ['KAPITEL 2 — ENDE · DAS ACHTE KIND', 'Du weißt es jetzt.', 'Sie auch.', '03:13.', z ? { t: z, klein: true } : null]; }
function kino_defK2() {
  const S = kino_S, X = C2.x, Z = C2.z, TK = { x: X + 118, y: 1.3, z: Z + 6 }, ST8 = { x: X + 118.6, z: Z + 5 };
  const SH3 = typeof uebergang3_S !== 'undefined' ? uebergang3_S.TOWN : { x: 9, z: -1.3 };
  // Stelle am Glas vor Lukes Augen (Linie Kamera → Tankmitte, Tankradius 0,9)
  const glas = (v, d) => { const c = camera.position; let dx = TK.x - c.x, dz = TK.z - c.z; const n = Math.hypot(dx, dz) || 1; dx /= n; dz /= n; return v.set(TK.x - dx * d, Math.min(1.75, Math.max(1.1, c.y)), TK.z - dz * d); };
  const tubes = () => (typeof c2Lights !== 'undefined' ? c2Lights.filter(L => L.tube && L.tube.position.x > X + 105 && L.tube.position.x < X + 123 && Math.abs(L.tube.position.z - Z) < 9) : []).sort((a, b) => a.tube.position.x - b.tube.position.x);
  // R-9: das graue Gesicht im Tank – kommt aus dem Wasser, presst sich ans Glas (platt, heller), atmet (Druck und Blasen), wo der Mund wäre, wölbt sich die Haut
  const tankKopf = dt => { const G = S.obj.grauKopf; if (!G) return; const t = S.T - (S.gkT0 || 0), u = kino_e(Math.min(1, t / .62)), atem = Math.sin(t * 1.9 - 1.2), p = S.gkP || (S.gkP = kino_V(0, 0, 0));
    const dGlas = .885, d = .45 + (dGlas - .014 - .45) * u + (u >= 1 ? .003 * atem : 0); glas(p, d); kino_gkZeig(p, camera.position, 1, true); G.rotateZ(.035 * Math.sin(t * .7)); G.rotateX(-.04 + .015 * Math.sin(t * 1.1));
    KINO_GK.uPlane.value = u >= .98 ? dGlas - d : 1; KINO_GK.uMund.value = kino_ramp(t, 1.1, 2.6) * (.6 + .4 * Math.sin(t * 3.1));
    const b = S.obj.beschlag; if (b) { b.visible = u > .9; glas(b.position, dGlas + .012); b.lookAt(camera.position); b.position.y -= .01; b.material.opacity = kino_cl((t - .7) / .8, 0, 1) * (.55 + .25 * Math.max(0, -atem)); }
    kino_blasenTick(dt, t > .7 && atem < -.5, G); };
  // ---- Teil B · „Das Gesicht im Glas“ – ab Lucys letzter Frage (Spielerkamera, nur in der Mitte weich zum Tank gezogen)
  kino_def('k2b', [
    { frei: true, dur: 4, keepFlash: true, // 0–4 · vier Neonröhren sterben von der Tür her, je eine Sekunde, jede ein Klack
      setup(sh) { sh.T = tubes(); sh.i = 0; S.k2bT = sh.T; for (const L of sh.T) L._m = L.mode; if (typeof tankFace !== 'undefined') tankFace.visible = false; },
      tick(k, t, dt, sh) { while (sh.i < Math.min(4, sh.T.length) && t > .35 + sh.i) { const L = sh.T[sh.i++]; L.mode = 'dying'; const p = L.tube.position; Audio.play('switch1', { gain: .4, rate: .55, x: p.x, y: 2.4, z: p.z, ref: 3 }); } } },
    { frei: true, dur: 3, keepFlash: true, // 4–7 · die Kette der Luke bewegt sich, ein Glied, noch eins; Staub rieselt; Brummen durch die Erde, das Wasser bekommt Ringe
      setup() { for (const L of S.k2bT || []) L.mode = 'off'; kino_brumm(.9, 1.6, 42); kino_show('wasser', TK.x, 2.26, TK.z); kino_S.obj.staub.visible = true;
        [.3, 1.4].forEach(d => kino_after(d, () => { Audio.play('metalHit1', { gain: .16, rate: .7, dur: .5, x: TK.x, y: 2.9, z: TK.z, ref: 2 }); Audio.play('scrape2', { gain: .08, rate: 1.3, dur: .4, x: TK.x, y: 2.9, z: TK.z, ref: 2 }); })); },
      tick(k, t, dt) { kino_rieseln(dt, TK.x, TK.z, 2.5); const w = kino_S.obj.wasser; w.scale.setScalar(1 + .015 * Math.sin(t * 9)); w.rotation.z = Math.sin(t * 5) * .03; } },
    { frei: true, dur: 3, keepFlash: true, blick: [TK.x, 1.45, TK.z], blickRate: 1.1, fov: 72, fovTo: 52, ease: 'soft', lens: { at: [TK.x, 1.4, TK.z], r: .25, amt: .35 }, // 7–10 · weich zum Tank gezogen; Lucy, Augen offen, Angst. Spieluhr ganz leise unter dem Brummen
      setup() { kino_box(['E5', 'D5', 'C5', 'B4', 'C5'], .2, .018, .97); }, tick(k, t, dt) { kino_rieseln(dt, TK.x, TK.z, 2.5); } },
    { frei: true, dur: 3, keepFlash: true, blick: [TK.x, 1.45, TK.z], blickRate: 3, fov: 52, fovTo: 40, film: { vig: 1.7, ca: .006 }, lens: { at: () => kino_S.obj.grauKopf ? kino_S.obj.grauKopf.position : kino_S.a.set(TK.x, 1.4, TK.z), r: .16, amt: .55 }, // 10–13 · das graue Gesicht kommt aus dem Wasser und presst sich von innen ans Glas, genau vor seinen Augen. Stille (R-9: echter Kopf, platt am Glas, atmet)
      setup(sh) { kino_brumm(0, .08); kino_still(true, .1); if (Audio.tankHum) Audio.tankHum(false); S.gkT0 = S.T; KINO_GK.uPlane.value = 1; KINO_GK.uMund.value = 0; tankKopf(0);
        S.vl[0].position.set(TK.x, .6, TK.z); S.vl[0].color.setHex(0xa9c4dc); S.vl[0].distance = 2.4; S.vl[0].intensity = 1.6; // kaltes Licht von unten aus dem Wasser
        S.vl[1].position.copy(camera.position).add(kino_V(0, .55, 0)); S.vl[1].color.setHex(0xdfe7f2); S.vl[1].distance = 3; S.vl[1].intensity = .8; // Streulicht der Taschenlampe von oben
        kino_after(.62, () => Audio.play('glass1', { gain: .26, rate: .42, lp: 900, x: TK.x, y: 1.4, z: TK.z, ref: 2 })); kino_after(1.9, () => kino_blasen(TK.x, 1.4, TK.z)); },
      tick(k, t, dt) { tankKopf(dt); } },
    { frei: true, dur: 1, keepFlash: true, lines: [['Mach die Augen zu!', 'LUCY · IM TANK', .05, 2400]], // 13–14 · Lucy reißt den Schlauch aus dem Mund (Blasen)
      setup() { kino_blasen(TK.x, 1.5, TK.z); if (typeof lenaFig !== 'undefined') lenaFig.rotation.z = .08; }, tick(k, t, dt) { tankKopf(dt); } },
    { frei: true, dur: 1, keepFlash: true, // 14–15 · Einblendung „Augen zu – Taste halten“ (sie wirkt hier nicht)
      setup() { if (typeof augenzu_frei === 'function') augenzu_frei({ wirkt: false, hinweis: 'Q halten – Augen zu' }); }, tick(k, t, dt) { tankKopf(dt); } },
    { black: true, dur: 9, fadeOut: 350, // 15–24 · Schwarz: kleine nackte Füße auf nassem Beton, um Luke herum, jede Runde näher; Atem am linken Ohr; die Spieluhr
      setup() { kino_hide('grauKopf', 'beschlag', 'blasen', 'wasser', 'staub'); KINO_GK.uPlane.value = 1; KINO_GK.uMund.value = 0; if (typeof tankFace !== 'undefined') tankFace.visible = false; if (typeof tankLight !== 'undefined') tankLight.intensity = 0; if (typeof lenaFig !== 'undefined') lenaFig.visible = false;
        const P = kino_S.sv.pos, fx = -Math.sin(kino_S.sv.yaw), fz = -Math.cos(kino_S.sv.yaw);
        for (let i = 0; i < 11; i++) { const a = Math.atan2(fx, fz) + PI * .9 - i * .6, r = 1.25 - i * .07; kino_after(.3 + i * .38, () => Audio.stepAt && Audio.stepAt(P.x + Math.sin(a) * r, P.z + Math.cos(a) * r, .1)); }
        const ohr = (d, v) => kino_after(d, () => kino_atem(v, 1.25, P.x + fz * .22, 1.62, P.z - fx * .22)); ohr(4.2, .14); ohr(6.2, .17);
        kino_after(4.3, () => { if (Audio.musicBox) Audio.musicBox(); kino_sag('Das hilft bei dir nicht, Bruder.', 'DAS KIND', 2600); });
        kino_after(7.1, () => kino_sag('Ich seh ja durch dich.', 'DAS KIND', 2400)); } },
    { frei: true, dur: 3, keepFlash: true, blick: [TK.x, 1.4, TK.z], blickRate: 1.4, fadeIn: 700, // 24–27 · die Augen gehen von selbst auf: der Tank ist leer, die Luke offen, im Schacht ein weißes Pulsieren
      setup() { if (typeof augenzu_oeffnen === 'function') { augenzu_oeffnen(); augenzu_sperre(); } kino_show('puls', TK.x, 7, TK.z).scale.set(6, 6, 1); kino_brumm(.5, .1, 42); kino_brumm(0, 2.8);
        const h = kino_show('hand', TK.x, 1.02, TK.z); glas(h.position, .87); h.position.y = 1.02; h.lookAt(TK.x, 1.02, TK.z); const l = kino_show('handL', TK.x, 1.36, TK.z); glas(l.position, .87); l.position.y = 1.36; l.position.x += .18; l.lookAt(TK.x, 1.36, TK.z); },
      tick(k, t) { kino_S.obj.puls.material.opacity = .25 + .35 * Math.pow(.5 + .5 * Math.sin(t * 2.2), 2); } },
    { frei: true, dur: 4, keepFlash: true, dy: (k, t) => -.78 * kino_e(Math.min(1, t / 1.3)), // 27–31 · Luke sinkt auf die Knie; innen am Glas ein Handabdruck in Kinderhöhe, daneben Lucys. Tropfen
      setup() { kino_still(true, .5); kino_stoff(.05); [1.2, 3.2].forEach(d => kino_after(d, () => Audio.drip(TK.x + .2, 2.2, TK.z))); },
      tick(k, t) { kino_S.obj.puls.material.opacity = .2 + .25 * Math.pow(.5 + .5 * Math.sin(t * 1.6), 2); }, teardown() { kino_hide('hand', 'handL', 'puls'); } },
  ], { name: 'Das Gesicht im Glas', skipAfter: Infinity, nahtlos: true, offen: true, uebergabe: true,
    done() { for (const L of kino_S.k2bT || []) L.mode = 'off'; if (typeof augenzu_sperre === 'function') augenzu_sperre(); if (typeof tankFace !== 'undefined') tankFace.visible = false; if (typeof lenaFig !== 'undefined') lenaFig.visible = false; } });

  // ---- Abspann „Ihre Augen“ (31 s): aus ihren Augen, Kreisfahrt um den Tank, Stuhl 8, Schacht
  const k2Luke = sh => { const P = kino_S.sv ? kino_S.sv.pos : player.pos; let dx = TK.x - P.x, dz = TK.z - P.z, d = Math.hypot(dx, dz); if (d < .5) { dx = 0; dz = 1; d = 1; } sh.lk = [P.x, P.z, dx / d, dz / d]; return sh.lk; };
  kino_def('k2', [
    { from: sh => { const [x, z, ux, uz] = k2Luke(sh); return [x - ux * 1.1, .95, z - uz * 1.1]; }, look: sh => [TK.x, 1.25, TK.z], dur: 3, fov: 62, breathe: 1, hand: 1.2, fadeIn: 400,
      film: { vig: 2.6, ca: .016, toe: .5, filter: 'grayscale(.75) contrast(1.08) brightness(.92)' },
      setup(sh) { const [x, z, ux, uz] = sh.lk; kino_S.flash = { p: kino_V(x, 1.35, z), at: kino_V(TK.x, 1.2, TK.z), i: 16 };
        const s = kino_show('schatten', TK.x - ux * .93, 1.35, TK.z - uz * .93); s.lookAt(x - ux * 1.1, 1.35, z - uz * 1.1); kino_atem(.12, .9); kino_box(['E5', 'D5', 'C5', 'B4', 'C5'], 0, .075, 1); },
      tick(k, t) { const s = kino_S.obj.schatten; s.scale.set(1 - .42 * kino_e(Math.min(1, t / 3)), 1, 1); s.material.opacity = .7; }, teardown() { kino_hide('schatten'); } },
    { white: true, dur: 3, // 3–6 · Weißblitz, Schwarz, Stille
      setup() { if (typeof lenaFig !== 'undefined') lenaFig.visible = false; kino_still(true, .1); if (Audio.tankHum) Audio.tankHum(false); },
      tick(k, t) { const f = $('fade'); if (t > .3 && !f.dataset.k2) { f.dataset.k2 = 1; f.style.transition = 'background-color .9s'; f.style.background = '#000'; } },
      teardown() { delete $('fade').dataset.k2; kino_still(false, 1.2); } },
    // 6–16 · Kreisfahrt um den Tank 200° → 260°: leer, das Wasser schwingt noch, innen zwei Handabdrücke, ein Haar sinkt
    { path(e, t, v, w) { const a = (200 + 60 * e) * PI / 180; v.set(TK.x + Math.cos(a) * 3.4, 1.5 + .1 * Math.sin(e * PI), TK.z + Math.sin(a) * 3.4); w.set(TK.x, 1.2 - .1 * e, TK.z); }, dur: 10, fov: 52, fovTo: 46, fadeIn: 900, ease: 'soft', hand: .3,
      lens: { at: [TK.x, 1.3, TK.z], r: .22, amt: .4 },
      setup() { const a = 232 * PI / 180, h = kino_show('hand', TK.x + Math.cos(a) * .87, 1.02, TK.z + Math.sin(a) * .87); h.lookAt(TK.x + Math.cos(a) * 3, 1.02, TK.z + Math.sin(a) * 3);
        const b = 222 * PI / 180, l = kino_show('handL', TK.x + Math.cos(b) * .87, 1.38, TK.z + Math.sin(b) * .87); l.lookAt(TK.x + Math.cos(b) * 3, 1.38, TK.z + Math.sin(b) * 3);
        kino_show('haar', TK.x + Math.cos(a) * .45, 2.0, TK.z + Math.sin(a) * .45); kino_show('wasser', TK.x, 2.26, TK.z); if (Audio.tankHum) Audio.tankHum(true); if (typeof tankLight !== 'undefined') tankLight.intensity = 2.2; },
      tick(k, t) { const O = kino_S.obj, hr = O.haar; hr.position.y = 2.0 - .95 * Math.min(1, t / 10); hr.rotation.set(Math.sin(t * .8) * .5, t * .3, .6 + Math.sin(t * .6) * .4);
        const w = O.wasser; w.rotation.set(-PI / 2 + Math.sin(t * 2.2) * .05 * Math.exp(-t * .25), 0, Math.cos(t * 1.9) * .04 * Math.exp(-t * .25)); w.position.y = 2.26 + Math.sin(t * 2.2) * .01 * Math.exp(-t * .25);
        if (typeof tankLight !== 'undefined') tankLight.intensity = 2.2 * (t < 2.2 ? 1 : t < 3.4 ? (Math.sin(t * 40) > .2 ? .2 : 1) : .35); },
      sfx: [[() => Audio.tankHum && Audio.tankHum(false), 2.2], [() => Audio.drip(TK.x + .3, 2.3, TK.z), 3.4], [() => Audio.drip(TK.x - .2, 2.2, TK.z + .3), 5.9], [() => Audio.drip(TK.x, 2.3, TK.z - .2), 8.3]],
      teardown() { kino_hide('hand', 'handL', 'haar', 'wasser'); if (typeof tankLight !== 'undefined') tankLight.intensity = 0; } },
    // 16–24 · Stuhl 8: „PAPA + ICH“, der halbe Mond; daneben die Feder in der Kerbe. Lucys Motiv auf dem Klavier, eine Phrase, ein Celloton
    { from: [ST8.x, .72, ST8.z - 1.6], to: [ST8.x, .55, ST8.z - .85], look: [ST8.x, .05, ST8.z - .48], lookTo: [ST8.x + .02, .55, ST8.z - .2], dur: 8, fov: 40, fovTo: 34, ease: 'soft', hand: .25,
      lens: { at: () => kino_S.a.set(ST8.x, kino_S.t < 4.5 ? .05 : .58, ST8.z - (kino_S.t < 4.5 ? .48 : .28)), r: .16, amt: .8 },
      setup() { const d = kino_show('papa', ST8.x, .006, ST8.z - .48); d.rotation.set(-PI / 2, 0, .08); const f = kino_show('feder', ST8.x + .05, .6, ST8.z - .27); f.rotation.set(0, 0, -.5);
        kino_klavier([['E5', .62], ['D5', .62], ['C5', .62], ['B4', .7], ['C5', 1, 7]], .5, .1); kino_cello([['C2', 5]], 3.6, .05, 600);
        S.vl[0].position.set(ST8.x + .4, 1.1, ST8.z - 1.1); S.vl[0].color.setHex(0xffd8a8); S.vl[0].distance = 3.5; S.vl[0].intensity = 4.4; // Führungslicht: die Arbeitslampe am Tank
        S.vl[1].position.set(ST8.x - .7, 1.6, ST8.z + .3); S.vl[1].color.setHex(0xa9bfdc); S.vl[1].distance = 3; S.vl[1].intensity = 1.4; }, // kalte Kante aus dem Tankraum (R-4: Stuhl 8 war zu dunkel)
      teardown() { kino_hide('papa', 'feder'); } },
    // 24–31 · Schacht über der Luke, Blick nach oben, steigend: ein runder Ausschnitt Nachthimmel, ein weißes Pulsieren, das langsamer wird. Noch keine Glocke
    { from: [SH3.x, -11, SH3.z], to: [SH3.x, -6.8, SH3.z], look: [SH3.x + .01, 20, SH3.z + .02], dur: 7, fov: 58, fovTo: 40, hand: .3, ease: 'soft',
      setup(sh) { const U = typeof uebergang3_S !== 'undefined' ? uebergang3_S : null; sh.cap = U && U.town ? U.town.cap.visible : null; if (U && U.town) U.town.cap.visible = false; sh.lid = U && U.lid ? U.lid.map(m => m.visible) : null; if (U && U.lid) U.lid.forEach(m => m.visible = false);
        kino_show('ring', SH3.x, -.03, SH3.z); kino_show('puls', SH3.x + 2, 46, SH3.z - 3).scale.set(30, 30, 1); S.vl[0].position.set(SH3.x + .3, -3.5, SH3.z + .2); S.vl[0].color.setHex(0xdfe8f6); S.vl[0].distance = 9; S.vl[0].intensity = 0; S.vl[1].position.set(SH3.x - .4, -9.5, SH3.z - .3); S.vl[1].color.setHex(0xffc890); S.vl[1].distance = 4; S.vl[1].intensity = .9; kino_brumm(.5, .1, 42); kino_brumm(0, 5); [1.5, 3.5, 5.5].forEach(d => kino_after(d, () => Audio.drip(SH3.x, -12, SH3.z))); },
      tick(k, t) { const p = kino_S.obj.puls, f = 2.6 - 1.4 * k; kino_S.pp = (kino_S.pp || 0) + (1 / 60) * f; p.material.opacity = .3 + .5 * Math.pow(.5 + .5 * Math.sin(t * f), 2) * (1 - .4 * k); S.vl[0].intensity = 2.4 * p.material.opacity; }, // das Pulsieren oben streicht kalt über die nassen Schachtwände
      teardown(sh) { const U = typeof uebergang3_S !== 'undefined' ? uebergang3_S : null; if (U && U.town && sh.cap !== null) U.town.cap.visible = sh.cap; if (U && U.lid && sh.lid) U.lid.forEach((m, i) => m.visible = sh.lid[i]); kino_hide('ring', 'puls'); } },
    { card: () => KINO_KARTE2(), dur: 'auto', fadeOut: 300, wenn: () => KINO_K2_KARTE },
  ], { name: 'Ihre Augen', skipAfter: 3 });

  // ---- Teil A · „Bruder.“ (16 s) – der Griff im langen Gang (Peter = Basis-Verfolger mit dem Modell aus innen_kapitel)
  const zg = () => typeof zombie !== 'undefined' ? zombie : null;
  // R-4: „Bruder.“ war fast schwarz – die heruntergefallene Taschenlampe liegt am Boden und strahlt Peter von unten an (Führungslicht), dazu ein schwaches kaltes Streulicht von der Gangdecke
  const k2aLicht = (k = 1) => { const A = S.k2a; kino_S.lit[0] = { p: kino_V(A.x - A.fx * .55, .3, A.z - A.fz * .55), c: 0xfff0d6, d: 4.5, i: 6 * k };
    S.vl[1].position.set(A.x - A.fx * 1.6 + A.fz * .5, 2.3, A.z - A.fz * 1.6 - A.fx * .5); S.vl[1].color.setHex(0x9fb2cc); S.vl[1].distance = 4; S.vl[1].intensity = 1.1 * k; };
  kino_def('k2a', [
    { path(e, t, v, w, sh) { const A = S.k2a; const j = kino_e(Math.min(1, t / .35)); v.set(A.x - A.fx * .35 * j, 1.62 - .12 * j, A.z - A.fz * .35 * j); w.set(A.x + A.fx * 3, 1.62 + 1.4 * j - t * .3, A.z + A.fz * 3); }, dur: 2, fov: 70, hand: 1.4, shakes: [[0, .03, .8]],
      setup() { const A = S.k2a; kino_S.flash = { p: kino_V(A.x + A.fx * .4, 1.2, A.z + A.fz * .4), at: kino_V(A.x + A.fx * 3, 1, A.z + A.fz * 3), i: 14 }; kino_atem(.16, 1.8);
        kino_after(.45, () => Audio.play('metalHit1', { gain: .35, rate: 1.4, x: A.x + A.fx, y: .1, z: A.z + A.fz, ref: 2 })); kino_after(.7, () => Audio.play('scrape3', { gain: .12, rate: 1.8, dur: 1.2, x: A.x + A.fx, y: .1, z: A.z + A.fz, ref: 2 })); },
      tick(k, t) { const A = S.k2a, F = kino_S.flash, u = Math.min(1, t / .5); F.p.set(A.x + A.fx * (.4 + .5 * u), 1.2 - 1.1 * u * u, A.z + A.fz * (.4 + .5 * u)); if (t > .5) { const a = (t - .5) * 2.4; F.at.set(F.p.x + Math.cos(a + A.a0) * 3, .6, F.p.z + Math.sin(a + A.a0) * 3); } } },
    { path(e, t, v, w) { const A = S.k2a, a = A.a0 + PI * e; v.set(A.x - A.fx * .35, 1.5, A.z - A.fz * .35); w.set(v.x + Math.cos(a) * 3, 1.55, v.z + Math.sin(a) * 3); if (e > .6) { const h = kino_peterKopf(kino_S.b); w.lerp(h, (e - .6) / .4); } }, dur: 3, fov: 64, hand: .9, ease: 'soft',
      film: { vig: 1.8 },
      setup() { const A = S.k2a, Zb = zg(); if (Zb) { Zb.g.visible = true; Zb.g.position.set(A.x - A.fx * 1.0, 0, A.z - A.fz * 1.0); Zb.g.rotation.set(0, Math.atan2(A.fx, A.fz) - PI / 2, 0); } if (!(typeof feuer_k2a === 'function' && feuer_k2a('nah'))) kino_zLangsam(true);
        kino_S.lit[0] = { p: kino_V(A.x - A.fx * .6, .35, A.z - A.fz * .6), c: 0xfff0d6, d: 4, i: 5.5 }; kino_after(1.2, () => kino_atem(.12, .7, A.x - A.fx * .8, 1.6, A.z - A.fz * .8)); } },
    { path(e, t, v, w) { const A = S.k2a; v.set(A.x - A.fx * .35, 1.5, A.z - A.fz * .35); kino_peterKopf(w); }, dur: 3, fov: 64, fovTo: 56, hand: .2, film: { vig: 2.6, ca: .01 }, shakes: [[0, .004, 3]], lens: { at: () => kino_peterKopf(kino_S.a), r: .15, amt: .6 },
      setup() { kino_still(true, .1); kino_S.k2aArme = 1; k2aLicht(); if (typeof feuer_k2a === 'function') feuer_k2a('haende'); }, tick() {} },
    { path(e, t, v, w) { const A = S.k2a; v.set(A.x - A.fx * .35, 1.5, A.z - A.fz * .35); kino_peterKopf(w); }, dur: 1, fov: 56, hand: .2, film: { vig: 2.6, ca: .01 }, lens: { at: () => kino_peterKopf(kino_S.a), r: .15, amt: .6 },
      lines: [['Bruder.', 'PETER', .1, 1800]], setup() { k2aLicht(); } },
    { path(e, t, v, w) { const A = S.k2a; v.set(A.x - A.fx * .52, 1.3, A.z - A.fz * .52); w.set(A.x - A.fx * 2, 1.2, A.z - A.fz * 2); }, dur: 3, fov: 80, hand: .4, film: { vig: 2.6, ca: .012, filter: 'brightness(.8)' },
      setup() { k2aLicht(.6); if (typeof feuer_k2a === 'function') feuer_k2a('druecken'); const A = S.k2a, b = kino_show('band', A.x - A.fx * .7, 1.28, A.z - A.fz * .7); b.lookAt(A.x, 1.28, A.z); b.scale.setScalar(.6); kino_herz(3, 46, .8); kino_brumm(.5, .8, 36); },
      tick(k, t, dt, sh) { if (typeof feuer_k2aHalt === 'function') feuer_k2aHalt(sh, t); const A = S.k2a, b = kino_S.obj.band, u = Math.min(1, t / 3); b.position.set(A.x - A.fx * (.7 - .12 * u), 1.34 - .14 * u, A.z - A.fz * (.7 - .12 * u)); }, teardown() { kino_hide('band'); kino_brumm(0, .3); } },
    { path(e, t, v, w) { const A = S.k2a, j = kino_e(Math.min(1, t / .6)); v.set(A.x - A.fx * (.35 - 1.1 * j), 1.5 - .3 * j, A.z - A.fz * (.35 - 1.1 * j)); w.set(A.x - A.fx * 2.5, .5, A.z - A.fz * 2.5); }, dur: 2, fov: 68, hand: 1.5, shakes: [[0, .05, .9]], wenn: () => !(typeof feuer_k2aTot === 'function' && feuer_k2aTot()), tick(k, t, dt, sh) { if (typeof feuer_k2aHalt === 'function') feuer_k2aHalt(sh, t); },
      setup() { kino_still(false, .3); kino_S.k2aArme = 0; const A = S.k2a, Zb = zg(); if (typeof feuer_k2a === 'function' && feuer_k2a('fass')) return; kino_zLangsam(false); if (typeof feuer_knock === 'function' && typeof FEU !== 'undefined' && Math.hypot(FEU.bx - A.x, FEU.bz - A.z) < 7) try { feuer_knock(); } catch (e) {}
        Audio.play('metalSlam', { gain: .5, rate: .6, x: A.x - A.fx * 1.5, y: .4, z: A.z - A.fz * 1.5, ref: 3 }); Audio.play('waterFlow', { gain: .15, rate: .6, dur: 1.6, x: A.x - A.fx * 1.8, y: .1, z: A.z - A.fz * 1.8, ref: 2 }); } },
    { path(e, t, v, w) { const A = S.k2a, d = kino_e(Math.min(1, t / .8)); v.set(A.x + A.fx * .75, 1.5 - .7 * d, A.z + A.fz * .75); w.set(A.x - A.fx * 1.3, .25, A.z - A.fz * 1.3); }, dur: 2, fov: 58, hand: .8, wenn: () => !(typeof feuer_k2aTot === 'function' && feuer_k2aTot()),
      setup() { const A = S.k2a, Zb = zg(); if (typeof feuer_k2a === 'function' && feuer_k2a('fall')) {} else if (Zb) { Zb.g.position.set(A.x - A.fx * 1.3, .22, A.z - A.fz * 1.3); Zb.g.rotation.set(0, Math.atan2(A.fx, A.fz) + PI / 2, PI / 2 * .95); }
        kino_S.lit[0] = { p: kino_V(A.x + A.fx * .1, .12, A.z + A.fz * .1), c: 0xfff0d6, d: 5, i: 1.8 }; kino_cello([['C2', 2.6]], .2, .06, 400); } },
  ], { name: 'Bruder.', skipAfter: Infinity, nahtlos: true,
    start() { const P = player.pos, fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); S.k2a = { x: P.x, z: P.z, fx, fz, a0: Math.atan2(fz, fx) }; },
    done() { kino_zLangsam(false); kino_S.k2aArme = 0; } });
}
function kino_peterKopf(v) { const Z = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; if (Z && Z.zm) { if (!Z.kinoB) Z.kinoB = kino_bones(Z.zm); if (Z.kinoB.head) return Z.kinoB.head.getWorldPosition(v); } const A = kino_S.k2a; return v.set(A.x - A.fx * .8, 1.7, A.z - A.fz * .8); }
// Peter: Gehbewegung fast anhalten, solange er Luke hält (innen_kapitel dreht sein Modell sonst im Laufschritt)
function kino_zLangsam(on) { const Z = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; if (!Z || !Z.mx || Z.eigen) return; for (const a of Z.mx._actions || []) a.timeScale = on ? .12 : 2.3; }
// Staub rieselt von der Decke (Tankraum)
function kino_rieseln(dt, cx, cz, top) { const D = kino_S.dust; if (!D) return; D.m.visible = true; const P = D.pos, s = D.seed;
  for (let i = 0; i < D.N; i++) { const j = i * 3; s[j + 1] -= dt * (.35 + (i % 5) * .08); if (s[j + 1] < .05) s[j + 1] = top; P[j] = cx + s[j] * .12 + Math.sin(i) * .1; P[j + 1] = s[j + 1]; P[j + 2] = cz + (s[j + 2] - 3) * .05; }
  D.m.geometry.attributes.position.needsUpdate = true; }
function kino_blasen(x, y, z) { const A = Audio; if (!A.ctx) return; const c = A.ctx; for (let i = 0; i < 9; i++) { const t = c.currentTime + i * rand(.04, .09), o = c.createOscillator(), g = c.createGain(), d = A.at(x, y, z, 2);
  o.frequency.setValueAtTime(rand(300, 600), t); o.frequency.exponentialRampToValueAtTime(rand(900, 1500), t + .05); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.06, t + .005); g.gain.exponentialRampToValueAtTime(.0004, t + .07); o.connect(g); g.connect(d); o.start(t); o.stop(t + .09); } }

// ======================================================== Kapitel 3 · Höhepunkt 1 „Blinde Kuh“ (24 s), 2 „Blinzeln“ (38 s), Abspann „Wie jeden Morgen“ (60 s)
function kino_defK3() {
  const S = kino_S;
  // ---- „Blinde Kuh“: Spielerkamera, ein Schnitt auf Bodenhöhe beim Aufschlag, Einblendung der Flanke (A-12: das dreifache „Scheiße“ gehört nicht mehr in die Sequenz)
  const K = () => S.kuh;
  const lampSeite = () => { const A = K(); const L = []; kino_lamps(l => { const dx = l.wx - A.lx, dz = l.wz - A.lz, d = Math.hypot(dx, dz); if (d < 60) L.push({ l, d, side: dx * A.rz - dz * A.rx }); }); L.sort((a, b) => a.d - b.d); return L; };
  kino_def('k3kuh', [
    { frei: true, dur: 4, keepFlash: true, // 0–4 · Laternen atmen, Summen fünfzig Hertz
      setup() { for (const o of lampSeite()) kino_lampe(o.l, 'puls').rate = 2.1; kino_brumm(.55, 1.5, 50); } },
    { frei: true, dur: 2, keepFlash: true, // 4–6 · erst die Laterne links, dann rechts, dann alle; das Summen setzt aus, absolute Stille. Oben, unsichtbar, beginnt der Sturz (Aufschlag genau bei 7,08 s)
      setup() { const L = lampSeite(), li = L.find(o => o.side > 0), re = L.find(o => o.side <= 0); if (!kino_kuhSturz(7.08)) kino_after(2.4, kino_kuhAlt);
        if (li) kino_after(.02, () => { kino_lampe(li.l, 'relais'); kino_relais(li.l.wx, 5, li.l.wz, .16); }); if (re) kino_after(.5, () => { kino_lampe(re.l, 'relais'); kino_relais(re.l.wx, 5, re.l.wz, .16); });
        kino_after(1, () => { for (const o of L) kino_lampe(o.l, 'aus'); kino_brumm(0, .03); kino_still(true, .05); kino_regen(0, .05); }); } },
    // 6–7,05 · Ruck nach oben (Steuerung weg): ein Fleck, der größer wird – der Blick folgt ihr nach unten; nur das Weiß der Senke streift sie. Fallgeräusch, ein Muhen aus großer Höhe
    { frei: true, dur: 1.05, keepFlash: true, blick: () => kino_S.a.copy(cowFx.g.position), blickRate: 7, shakes: [[0, .012, .6]],
      setup() { kino_fall(); kino_muh(); if (Audio.buf && Audio.buf.fx_boe_2) Audio.play('fx_boe_2', { gain: .35, rate: 1.4, hp: 300, dur: 1.1 });
        S.vl[1].color.setHex(0xdfe6f4); S.vl[1].distance = 7; S.vl[1].intensity = 2.2; },
      tick() { S.vl[1].position.copy(cowFx.g.position).add(kino_V(-1.5, 2.5, 1)); } },
    // 7,05–7,5 · Schnitt: Bodenhöhe, seitlich, 4 m neben Luke – der Aufschlag: Vorderhand, Körper, Kopf zuletzt; sie staucht, federt, Splitt und Wasser spritzen; ein Blitz aus der Senke
    { from: () => { const A = K(); return [A.cx + A.rx * 4.4 + A.fx * 1.5, .3, A.cz + A.rz * 4.4 + A.fz * 1.5]; }, look: () => { const A = K(); return [A.cx, .5, A.cz]; }, dur: .45, fov: 50, hand: .2,
      setup() { const A = K(); S.vl[1].position.set(A.cx - A.rx * 2, 3, A.cz - A.rz * 2); S.vl[1].intensity = 2.4; kino_after(.05, () => { const d = cowFx.dust; d.t = 0; for (let i = 0; i < d.v.length; i++) { d.p[i * 3] = A.cx; d.p[i * 3 + 1] = .2; d.p[i * 3 + 2] = A.cz; } }); },
      tick(k, t) { const F = S.kuhF, u = F && F.ph !== 'fall' ? F.ti : -1; filmPass.uniforms.flash.value = u >= 0 && u < .2 ? 1 - u / .2 : 0; }, teardown() { filmPass.uniforms.flash.value = 0; } },
    // 7,5–9 · zurück, Sicht zittert: Staub, Gischt im Regen, ein Bein zuckt einmal, ein Stück Ohrmarke klappert über den Asphalt; Lukes Keuchen
    { frei: true, dur: 1.5, keepFlash: true, shakes: [[0, .045, .8]], film: { vig: 1.5, ca: .01 }, blick: () => kino_S.a.set(K().cx, .6, K().cz), blickRate: 3.5,
      setup() { const A = K(); glitchV = .3; kino_atem(.14, 2.2); [0, .21, .38, .5].forEach((d, i) => kino_after(.25 + d, () => Audio.play('metalHit2', { gain: .08 - i * .015, rate: 3.6 + i * .2, hp: 1800, dur: .12, x: A.cx - A.rx * (1 + i * .3), y: 0, z: A.cz - A.rz * (1 + i * .3), ref: 1.5 }))); },
      tick(k, t, dt) { kino_kuhLage(); glitchV *= .96; } },
    // 9–13 · langsamer Schwenk zur Kuh, Luke geht zwei Schritte auf sie zu; die Laternen gehen wieder an, von der Kuh weg, das Pulsieren wird schneller. Dampf steigt aus ihr
    { frei: true, dur: 4, keepFlash: true, blick: () => kino_S.a.set(K().cx, .5, K().cz), blickRate: .9,
      setup(sh) { const A = K(), L = lampSeite().sort((a, b) => Math.hypot(a.l.wx - A.cx, a.l.wz - A.cz) - Math.hypot(b.l.wx - A.cx, b.l.wz - A.cz));
        L.forEach((o, i) => kino_after(.3 + i * .32, () => { const f = kino_lampe(o.l, 'puls'); f.rate = 3.4 + i * .25; kino_relais(o.l.wx, 5, o.l.wz, .1); })); kino_brumm(.25, 2.5, 50); kino_still(false, 3); kino_regen(.2, 3);
        kino_after(2.2, () => { const P = camera.position, d = camera.getWorldDirection(kino_S.a); kino_kiesel(P.x - d.x * 2, 0, P.z - d.z * 2); });
        const P = player.pos, dx = A.cx - P.x, dz = A.cz - P.z, d = Math.hypot(dx, dz) || 1, weg = Math.max(0, Math.min(1.3, d - 3.2)); sh.p0 = P.clone(); sh.p1 = P.clone().add(kino_V(dx / d * weg, 0, dz / d * weg)); sh.st = 0; },
      tick(k, t, dt, sh) { const u = kino_e(kino_ramp(t, .6, 3.4)); player.pos.lerpVectors(sh.p0, sh.p1, u); if (S.sv) S.sv.pos.copy(player.pos); // zwei zögernde Schritte; nach der Sequenz steht er dort
        const n = Math.floor(kino_ramp(t, .6, 3.4) * 3); if (n > sh.st && u < 1) { sh.st = n; Audio.stepAt && Audio.stepAt(player.pos.x, player.pos.z, .14); } } },
    { from: () => kino_flanke(.35, 1.1), to: () => kino_flanke(.25, .95), look: () => kino_flanke(0, 0), dur: 2, fov: 40, hand: .3, lens: { at: () => kino_S.a.set(...kino_flanke(0, 0)), r: .2, amt: .7 }, // 13–15 · Einblendung: die Flanke, sieben Kreise und ein halber achter, Rauch
      setup() { const f = kino_flanke(0, 0), b = kino_show('brand', f[0], f[1], f[2]); b.lookAt(f[0], f[1] + 1, f[2]); b.rotateZ(K().ry); S.vl[0].position.set(f[0] + .6, f[1] + 1.4, f[2] + .4); S.vl[0].color.setHex(0xffc890); S.vl[0].distance = 4; S.vl[0].intensity = 1.3; // Laterne als Führungslicht, kalte Kante vom Weiß der Senke
        S.vl[1].position.set(f[0] - .9, f[1] + .5, f[2] - .7); S.vl[1].color.setHex(0xc6d4ec); S.vl[1].distance = 3; S.vl[1].intensity = .7; } },
    { frei: true, dur: 9, keepFlash: true, // 15–24 · Luke steht. Ein Rabe landet auf der Kuh. Ein Auto springt an und fährt ohne Licht davon. Hinter der Telefonzelle raschelt es
      setup() { const A = K(); kino_hide('brand'); kino_sag('Blinde Kuh …', 'KINDERSTIMME', 2600); kino_box(['G5', 'E5'], .05, .05, 1); Audio.whisper(A.lx, 9, A.lz, 1.4);
        kino_after(1.3, () => { const P = camera.position, d = camera.getWorldDirection(kino_S.a); Audio.giggle(P.x - d.x * 1.2, 1.3, P.z - d.z * 1.2); });
        kino_after(2.2, () => { const top = K().top; if (typeof whiskey_setzen === 'function' && typeof whiskey_S !== 'undefined' && whiskey_S.g) { try { whiskey_setzen(A.cx, top, A.cz, () => kino_klapper(A.cx, top, A.cz)); } catch (e) {} } else { kino_rabeFly(kino_V(A.cx + 14, 12, A.cz - 10), kino_V(A.cx, top, A.cz), 2.2, () => kino_klapper(A.cx, top, A.cz)); } });
        kino_after(4.2, () => { Audio.play('carEngine', { gain: .1, rate: .9, dur: 5, x: A.cx - 70, y: 1, z: A.cz + 35, ref: 18, lp: 1200 }); });
        kino_after(7.2, () => { kino_trippeln(8.6, 8.2, .045); Audio.paper && setTimeout(() => Audio.paper(), 300); }); } },
  ], { name: 'Blinde Kuh', skipAfter: Infinity, nahtlos: true, offen: true, uebergabe: true,
    start() { const P = player.pos, fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), rx = -fz, rz = fx; let cx = P.x + rx * 4 + fx * 1.2, cz = P.z + rz * 4 + fz * 1.2; cz = Math.max(-3.4, Math.min(3.4, cz));
      S.kuh = { lx: P.x, lz: P.z, fx, fz, rx, rz, cx, cz, ry: Math.atan2(fx, fz), top: 1.2 }; if (typeof ch3 !== 'undefined') ch3.cowSeen = true; },
    done() { kino_hide('brand'); } });
}
// Aufruf aus lucy3.js (statt cowDrop): startet „Blinde Kuh“
function kino_kuh() { const S = kino_S; if (!S.ready || S.on || !KINO.k3kuh || typeof cowFx === 'undefined' || cowFx.done) return false; kino_play('k3kuh').catch(e => console.error('Kino k3kuh', e)); return true; }
// ---------------------------------------------------------------- „Blinde Kuh“ – Sturz und Aufprall mit Körper (R-4 / Nutzerwunsch 01.10.: Physik, Realismus, Logik des Aufpralls)
// Eigene Kuh mit Skelett (assets/cow/cow.glb, wie die Basis vorbereitet: 2,3 m, längs lokal +X, Kopf vorn): fällt mit Erdbeschleunigung aus der Höhe, kippt dabei um die
// Längsachse, Beine und Hals schlenkern passiv (Federn je Knochen); beim Aufschlag Stauchung, Rückprall, dann die gebrochene Lage der Basis (gleiche Knochen-Winkel),
// Splitt und Wasser spritzen mit Schwerkraft, Gischt im Regen, Riss im Asphalt, eine Lache, die langsam wächst; Dampf steigt aus dem warmen Körper.
// Die drei Untersuchungspunkte (kapitel3.js: Ohrmarke, Kopf, Flanke) sind sichtbar: gelbe Ohrmarke am Ohr (ein Stück liegt auf dem Asphalt), glatte Augenhöhlen, Brandkreise.
const KINO_KUH_BRUCH = { 'DEF-thigh.L': [1.1, .3, -.9], 'DEF-shin.L': [-1.6, 0, .4], 'DEF-foot.L': [.9, .5, 0], 'DEF-thigh.R': [-.7, -.4, 1.2], 'DEF-shin.R': [1.9, .2, 0], 'DEF-foot.R': [-.6, 0, .7],
  'DEF-front_thigh.L': [-1.2, .6, .8], 'DEF-front_shin.L': [1.7, 0, -.5], 'DEF-front_thigh.R': [.9, -.3, -1.3], 'DEF-front_shin.R': [-1.4, .4, 0], 'DEF-front_foot.R': [1.1, 0, 0],
  'DEF-spine.002': [.15, .25, 0], 'DEF-spine.003': [-.12, .3, .1], 'DEF-spine.008': [.5, .6, .3], 'DEF-spine.009': [.6, .5, .4], 'DEF-spine.010': [.5, .4, .3], 'DEF-spine.011': [.4, -.3, .2] }; // wie die Basis (FAB.cowPlatt)
async function kino_kuhBau() { const S = kino_S, T = THREE, src = await MSL.gl.loadAsync('assets/cow/cow.glb'), sk = await figuren_skc(), c = sk(src.scene);
  c.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.material = m.material.clone(); m.material.color.multiplyScalar(.82); m.material.roughness = .62; } }); // gescheckt und warm (die Basis dunkelt auf 0,5)
  msFit(c, 2.3, 'max'); let b = new T.Box3().setFromObject(c), sz = b.getSize(new T.Vector3()); if (sz.z > sz.x) { c.rotation.y = PI / 2; c.updateMatrixWorld(true); b = new T.Box3().setFromObject(c); }
  const bone = {}; c.traverse(o => { if (o.isBone) bone[o.name] = o; });
  // Kopf: Blatt der Wirbelkette, am weitesten vom Becken
  const pel = bone['DEF-pelvis.L'] || bone['DEF-spine'], v = new T.Vector3(), w = new T.Vector3(); let head = null, hd = -1; c.updateMatrixWorld(true); if (pel) pel.getWorldPosition(w);
  for (const [n, o] of Object.entries(bone)) if (/^DEF-spine/.test(n) && !o.children.some(q => q.isBone)) { o.getWorldPosition(v); const d = v.distanceTo(w); if (d > hd) { hd = d; head = o; } }
  if (head) { head.getWorldPosition(v); if (v.x < b.getCenter(w).x) { c.rotation.y += PI; c.updateMatrixWorld(true); b = new T.Box3().setFromObject(c); } } // Kopf nach +X (kapitel3.js erwartet ihn dort)
  c.position.sub(b.getCenter(new T.Vector3())); const W = new T.Group(); W.add(c); const G = new T.Group(); G.add(W); G.updateMatrixWorld(true);
  const knochen = Object.keys(KINO_KUH_BRUCH).filter(n => bone[n]).map(n => ({ b: bone[n], r0: bone[n].rotation.clone(), e: new T.Vector3(), ev: new T.Vector3(), ziel: new T.Vector3(...KINO_KUH_BRUCH[n]), n, ph: Math.random() * 6 }));
  // Augenhöhlen und Ohrmarke am Kopfknochen (aus den Ecken des Kopfes geschätzt: Augen auf ~40 % der Kopflänge, seitlich ganz außen, obere Hälfte)
  const sm = (() => { let r = null; c.traverse(o => { if (o.isSkinnedMesh && !r) r = o; }); return r; })();
  if (head && sm) { sm.skeleton.update(); const hi = sm.skeleton.bones.indexOf(head), P = sm.geometry.attributes.position, SI = sm.geometry.attributes.skinIndex, SW = sm.geometry.attributes.skinWeight, pts = [];
    for (let i = 0; i < P.count; i++) { let best = 0, bw = 0; for (let j = 0; j < 4; j++) { const wj = SW.getComponent(i, j); if (wj > bw) { bw = wj; best = SI.getComponent(i, j); } } if (best !== hi) continue; v.fromBufferAttribute(P, i); sm.applyBoneTransform(i, v); pts.push(v.clone().applyMatrix4(sm.matrixWorld)); }
    if (pts.length > 20) { const hb = new T.Box3().setFromPoints(pts), L = hb.max.x - hb.min.x, xe = hb.max.x - L * .58, sl = pts.filter(p => Math.abs(p.x - xe) < L * .08 && p.y > hb.min.y + (hb.max.y - hb.min.y) * .45);
      const inv = new T.Matrix4().copy(head.matrixWorld).invert(), mk = (key, cv, s, pos, nrm) => { const m = new T.Mesh(new T.PlaneGeometry(s, s), new T.MeshStandardMaterial({ map: tex(cv, true), transparent: true, depthWrite: false, roughness: .25, polygonOffset: true, polygonOffsetFactor: -3 }));
        m.position.copy(pos); m.lookAt(w.copy(pos).add(nrm)); m.updateMatrix(); m.applyMatrix4(inv); head.add(m); m.userData.noCol = true; return m; };
      const auge = cnv(64, (x, s) => { x.clearRect(0, 0, s, s); const g = x.createRadialGradient(32, 32, 2, 32, 32, 30); g.addColorStop(0, 'rgba(8,4,4,.98)'); g.addColorStop(.55, 'rgba(26,12,12,.95)'); g.addColorStop(.8, 'rgba(120,70,70,.55)'); g.addColorStop(1, 'rgba(120,70,70,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s); });
      for (const sd of [1, -1]) { const q = sl.filter(p => (p.z - hb.getCenter(w).z) * sd > 0); if (!q.length) continue; let e = q[0]; for (const p of q) if ((p.z - e.z) * sd > 0) e = p; mk('auge', auge, .07, e.clone(), new T.Vector3(0, .25, sd).normalize()); }
      const tag = cnv(128, (x, s) => { x.clearRect(0, 0, s, s); x.fillStyle = '#e6c21e'; x.beginPath(); x.roundRect(14, 30, 100, 76, 14); x.fill(); x.fillStyle = '#1d1d1d'; x.font = 'bold 22px Arial'; x.fillText('AYDIN', 28, 64); x.font = '18px Arial'; x.fillText('DE 0917', 26, 90); x.fillStyle = '#c9a516'; x.fillRect(56, 10, 16, 26); });
      const ohr = pts.filter(p => p.x < hb.min.x + L * .3 && p.y > hb.max.y - (hb.max.y - hb.min.y) * .35); if (ohr.length) { let o = ohr[0]; for (const p of ohr) if (p.z > o.z) o = p; S.kuhTag = mk('ohrmarke', tag, .09, o.clone().add(new T.Vector3(0, -.05, .03)), new T.Vector3(0, 0, 1)); } } }
  // Lage auf der Seite: so liegt sie nach dem Aufprall (Hubhöhe = halbe Dicke)
  G.rotation.set(PI / 2 - .12, 0, 0, 'YXZ'); G.updateMatrixWorld(true); const lb = new T.Box3().setFromObject(G); G.rotation.set(0, 0, 0);
  S.kuhSk = { G, W, knochen, lift: -lb.min.y + .02, top: lb.max.y }; return G; }
// Splitt und Wasser (Teilchen mit Schwerkraft), Gischt, Dampf; Riss und Lache bleiben nach der Sequenz liegen
function kino_kuhFxBau() { const S = kino_S, T = THREE, N = 150, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); for (let i = 0; i < N; i++) { const s = i % 2 ? .22 : .78; col[i * 3] = s; col[i * 3 + 1] = s * .98; col[i * 3 + 2] = s * (i % 2 ? .95 : 1.04); pos[i * 3 + 1] = -999; }
  const m = new T.Points(geo, new T.PointsMaterial({ size: .025, vertexColors: true, transparent: true, opacity: .95, depthWrite: false, map: kino_glowTex('glow') })); m.frustumCulled = false;
  const gi = []; for (let i = 0; i < 7; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: S.tex.glow, color: 0xc8ccd2, transparent: true, depthWrite: false, opacity: 0 })); sp.visible = false; gi.push(sp); scene.add(sp); }
  const rauch = tex(cnv(128, (x, s) => { x.clearRect(0, 0, s, s); x.filter = 'blur(6px)'; for (let i = 0; i < 26; i++) { const a = rand(0, 6.28), r = rand(0, 34), px = 64 + Math.cos(a) * r, py = 64 + Math.sin(a) * r * 1.3; x.fillStyle = `rgba(255,255,255,${rand(.05, .16)})`; x.beginPath(); x.arc(px, py, rand(10, 26), 0, 7); x.fill(); } }), true); // weicher, unregelmäßiger Dampf statt Lichtkugel
  const da = []; for (let i = 0; i < 12; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: rauch, color: 0xd8d6d0, transparent: true, depthWrite: false, opacity: 0 })); sp.visible = false; sp.userData = { ph: Math.random(), x: (Math.random() - .5) * 1.6, z: (Math.random() - .5) * .7 }; da.push(sp); scene.add(sp); }
  scene.add(m); m.visible = false;
  const riss = new T.Mesh(new T.PlaneGeometry(3.4, 3.4), new T.MeshStandardMaterial({ map: tex(cnv(512, (x, s) => { x.clearRect(0, 0, s, s); const g = x.createRadialGradient(256, 256, 30, 256, 256, 240); g.addColorStop(0, 'rgba(10,10,12,.55)'); g.addColorStop(.5, 'rgba(14,14,16,.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, s, s);
      x.strokeStyle = 'rgba(6,6,8,.9)'; x.lineCap = 'round'; for (let i = 0; i < 16; i++) { let a = i / 16 * 6.28 + rand(-.2, .2), r = rand(20, 50), px = 256 + Math.cos(a) * r, py = 256 + Math.sin(a) * r; x.lineWidth = rand(1.5, 4); x.beginPath(); x.moveTo(px, py); while (r < rand(150, 235)) { r += rand(12, 30); a += rand(-.3, .3); px = 256 + Math.cos(a) * r; py = 256 + Math.sin(a) * r; x.lineTo(px, py); x.lineWidth *= .9; } x.stroke(); }
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${rand(30, 70)},${rand(30, 66)},${rand(28, 60)},${rand(.3, .8)})`; const a = rand(0, 6.28), r = Math.pow(rand(0, 1), 2) * 200; x.fillRect(256 + Math.cos(a) * r, 256 + Math.sin(a) * r, rand(2, 6), rand(2, 5)); } }), true), transparent: true, depthWrite: false, roughness: .55, polygonOffset: true, polygonOffsetFactor: -2 }));
  riss.rotation.x = -PI / 2; riss.visible = false; riss.receiveShadow = true; riss.userData.noCol = true; scene.add(riss);
  const lache = typeof FAB !== 'undefined' && FAB.blood ? new T.Mesh(new T.PlaneGeometry(1, 1), FAB.blood.stain1) : null; if (lache) { lache.rotation.x = -PI / 2; lache.visible = false; lache.userData.noCol = true; scene.add(lache); }
  S.kuhFx = { m, pos, v: new Float32Array(N * 3), N, gi, da, riss, lache, t: -1 }; }
// Sturz beginnen: Aufschlag genau bei tAuf (Kinozeit); Höhe so, dass man sie fallen sieht
function kino_kuhSturz(tAuf) { const S = kino_S, A = S.kuh, K = S.kuhSk; if (!K || typeof cowFx === 'undefined') return false; cowFx.done = true; cowFx.t = -1; cowFx.ufoT = -1;
  cowFx.g.clear(); cowFx.g.add(K.G); K.G.position.set(0, 0, 0); K.G.rotation.set(0, 0, 0); K.W.scale.set(1, 1, 1); cowFx.g.rotation.set(0, A.ry + .6, 0); cowFx.g.userData.noCol = true;
  const y0 = 26, tf = Math.sqrt(2 * (y0 - K.lift) / 9.81); S.kuhF = { ph: 'fall', t0: tAuf - tf, tAuf, y0, tf, ti: 0, rx0: PI / 2 - .12 - 2.5, rz: .3 }; cowFx.g.position.set(A.cx, y0, A.cz);
  for (const k of K.knochen) { k.e.set(0, 0, 0); k.ev.set(0, 0, 0); k.b.rotation.copy(k.r0); } if (typeof cowHit !== 'undefined') cowHit.position.set(A.cx, .6, A.cz); return true; }
function kino_kuhTick(dt) { const S = kino_S, F = S.kuhF, K = S.kuhSk; if (!F || !K || F.ph === 'fertig' || S.hold && S.on) { kino_kuhFxTick(dt); return; } const A = S.kuh, T = S.T - F.t0, g = cowFx.g;
  if (F.ph === 'fall') { if (T < 0) { g.visible = false; return; } g.visible = true; const y = F.y0 - .5 * 9.81 * T * T, k = Math.min(1, T / F.tf);
    g.position.y = Math.max(K.lift, y); K.G.rotation.set(F.rx0 + 2.5 * k * k * (3 - 2 * k) + Math.sin(T * 2.3) * .08 * (1 - k), 0, F.rz * Math.sin(T * 1.7) * (1 - k * .7), 'YXZ'); // kippt um die Längsachse, kommt auf der Seite an
    for (const b of K.knochen) { const fl = /thigh|shin|foot/.test(b.n) ? .55 : .35, s = b.ph; b.e.set(Math.sin(T * 5.1 + s) * fl - .25 * k, Math.sin(T * 4.3 + s * 1.7) * fl * .6, Math.sin(T * 3.7 + s * 2.3) * fl * .5); b.b.rotation.set(b.r0.x + b.e.x, b.r0.y + b.e.y, b.r0.z + b.e.z); } // Beine und Hals schlenkern im Fallwind
    if (y <= K.lift) { F.ph = 'auf'; F.ti = 0; kino_kuhAufprall(); } return; }
  F.ti += Math.min(dt, .05); const t = F.ti, h = Math.min(dt, .033);
  // Stauchung und Rückprall (gedämpfte Feder), danach liegt sie
  const sq = Math.exp(-t * 7) * Math.cos(t * 26); K.W.scale.set(1 + .1 * sq, 1 - .16 * sq, 1 + .08 * sq); g.position.y = K.lift + Math.max(0, .14 * Math.exp(-t * 6) * Math.sin(t * 13));
  for (const b of K.knochen) { const om = 11, ze = .32; b.ev.addScaledVector(b.e.clone().sub(b.ziel).multiplyScalar(-om * om), h).addScaledVector(b.ev, -2 * ze * om * h); b.e.addScaledVector(b.ev, h); b.b.rotation.set(b.r0.x + b.e.x, b.r0.y + b.e.y, b.r0.z + b.e.z); }
  if (t > .45 && !F.zuck) { F.zuck = 1; const b = K.knochen.find(q => q.n === 'DEF-shin.R'); if (b) b.ev.x += 6; } // ein Bein zuckt einmal (Bibel 7,4–9)
  if (t > 2.2) { F.ph = 'fertig'; K.W.scale.set(1, 1, 1); g.position.y = K.lift; cowFx.t = 1; g.userData.noCol = false; if (typeof solidAdd === 'function') try { solidAdd(g); } catch (e) {} A.lage = 0; }
  kino_kuhFxTick(dt); }
// Rückfall ohne eigene Kuh: das Basis-Modell fällt (cowUpdate der Basis), verformt sich beim Aufprall
function kino_kuhAlt() { const A = kino_S.kuh; if (typeof cowFx === 'undefined' || !FAB.cow) return; cowFx.done = true; cowFx.g.clear(); cowFx.g.add(FAB.cow.clone()); cowFx.g.position.set(A.cx, 26, A.cz); cowFx.g.rotation.set(0, A.ry + .6, 0); cowFx.t = 0; cowFx.ufoT = -1; if (typeof cowHit !== 'undefined') cowHit.position.set(A.cx, .6, A.cz); }
function kino_kuhAufprall() { const S = kino_S, A = S.kuh, F = S.kuhFx; if (Audio.ctx) { kino_sub(1); if (Audio.buf.fx_tief_2) Audio.play('fx_tief_2', { gain: .7, rate: .8 }); kino_nass(A.cx, A.cz); Audio.play('stones1', { gain: .35, rate: .8, x: A.cx, y: .2, z: A.cz, ref: 4 }); if (typeof bigThud === 'function') bigThud(A.cx, A.cz);
    Audio.play('woodHit1', { gain: .25, rate: .5, lp: 700, delay: .03, x: A.cx, y: .3, z: A.cz, ref: 4 }); } // Knacken von Knochen, dumpf
  kino_shake(.06, .6); if (!F) return; F.t = 0; F.m.visible = true; const P = F.pos, V = F.v;
  for (let i = 0; i < F.N; i++) { const a = Math.random() * 6.28, sp = (i % 2 ? rand(1.5, 5.5) : rand(2, 7)); P[i * 3] = A.cx + Math.cos(a) * rand(.3, 1); P[i * 3 + 1] = .15; P[i * 3 + 2] = A.cz + Math.sin(a) * rand(.2, .6); V[i * 3] = Math.cos(a) * sp; V[i * 3 + 1] = rand(1.5, i % 2 ? 4.5 : 5.5); V[i * 3 + 2] = Math.sin(a) * sp * .7; }
  F.gi.forEach((s, i) => { s.material.map = rauch2(); s.visible = true; s.position.set(A.cx + rand(-1, 1), .4, A.cz + rand(-.6, .6)); s.userData.v = rand(.3, .9); s.material.opacity = .3; s.scale.setScalar(.6); });
  F.riss.visible = true; F.riss.position.set(A.cx, .012, A.cz); F.riss.rotation.z = A.ry; if (F.lache) { F.lache.visible = true; F.lache.position.set(A.cx - A.fx * .3 + A.rx * .25, .016, A.cz - A.fz * .3 + A.rz * .25); F.lache.scale.setScalar(.3); F.lache.rotation.z = rand(0, 6); }
  if (S.kuhTag) { const st = S.kuhStueck || (S.kuhStueck = S.kuhTag.clone()); st.scale.setScalar(.6); scene.add(st); st.position.set(A.cx - A.rx * 1.6, .012, A.cz - A.rz * 1.6); st.rotation.set(-PI / 2, 0, rand(0, 6)); st.visible = true; } } // ein Stück Ohrmarke liegt auf dem Asphalt
function rauch2() { const F = kino_S.kuhFx; return F && F.da[0] ? F.da[0].material.map : kino_S.tex.glow; } // Gischt mit derselben Dampftextur
function kino_kuhFxTick(dt) { const S = kino_S, F = S.kuhFx; if (!F || F.t < 0) return; F.t += dt; const t = F.t, A = S.kuh, P = F.pos, V = F.v;
  if (t < 3) { for (let i = 0; i < F.N; i++) { if (P[i * 3 + 1] <= .012 && V[i * 3 + 1] === 0) continue; V[i * 3 + 1] -= 9.81 * dt; P[i * 3] += V[i * 3] * dt; P[i * 3 + 1] += V[i * 3 + 1] * dt; P[i * 3 + 2] += V[i * 3 + 2] * dt;
      if (P[i * 3 + 1] < .012) { if (i % 2) { P[i * 3 + 1] = .012; V[i * 3] = V[i * 3 + 1] = V[i * 3 + 2] = 0; } else P[i * 3 + 1] = -999; } } F.m.geometry.attributes.position.needsUpdate = true; } // Splitt bleibt liegen, Wasser versickert
  F.gi.forEach(s => { if (!s.visible) return; s.position.y += s.userData.v * dt * .4; s.scale.setScalar(.6 + t * 1.3); s.material.opacity = Math.max(0, .3 * (1 - t / 3)); if (t > 3) s.visible = false; }); // Gischt
  if (F.lache) F.lache.scale.setScalar(.3 + 1.5 * Math.sqrt(Math.min(1, t / 40))); // „Unter ihr breitet sich das Blut immer noch aus.“
  const top = (S.kuhSk && S.kuhSk.top) || 1, k = Math.max(0, 1 - t / 150); // Dampf aus dem warmen Körper, zweieinhalb Minuten
  F.da.forEach((s, i) => { const u = s.userData; if (k <= 0) { s.visible = false; return; } s.visible = true; const q = (t * .18 + u.ph) % 1; s.position.set(A.cx + u.x * Math.cos(A.ry) + Math.sin(t * .7 + i) * .05, top * .85 + q * 1.4, A.cz - u.x * Math.sin(A.ry) + u.z); s.scale.setScalar(.3 + q * .9); s.material.opacity = .5 * Math.sin(q * PI) * k * kino_cl(t / 1.5, 0, 1); s.material.rotation = q * 1.4 + i; });
  if (t > 3) F.m.visible = t < 600; }
function kino_kuhLage() { const A = kino_S.kuh; if (!A || A.lage || typeof cowFx === 'undefined' || cowFx.t < 1 && !(kino_S.kuhF && kino_S.kuhF.ph !== 'fall')) return; A.lage = 1; // Lage kommt aus dem Sturz (kino_kuhTick); hier nur Oberkante und Hülle
  cowFx.g.updateMatrixWorld(true); try { const b = new THREE.Box3().setFromObject(cowFx.g); A.top = b.max.y; A.bb = b; } catch (e) {} }
function kino_flanke(d, h) { kino_kuhLage(); const A = kino_S.kuh, top = A.top || 1.2; return [A.cx - A.fx * d * .6 + A.rx * d * .8, top - .06 + h, A.cz - A.fz * d * .6 + A.rz * d * .8]; }
function kino_nass(x, z) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime + .03, n = kino_nz(A), lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(180, t + .5); // dumpf-nasser Aufschlag
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + .6); n.connect(lp); lp.connect(g); g.connect(A.at(x, .4, z, 4)); n.stop(t + .7); Audio.play('woodHit3', { gain: .3, rate: .55, lp: 1200, delay: .02, x, y: .3, z, ref: 4 }); }
function kino_fall() { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = kino_nz(A), lp = c.createBiquadFilter(), g = c.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(200, t); lp.frequency.exponentialRampToValueAtTime(1400, t + 1.1);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.25, t + 1.1); g.gain.linearRampToValueAtTime(0, t + 1.18); n.connect(lp); lp.connect(g); g.connect(A.master); n.stop(t + 1.3); }
function kino_muh() { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, o = c.createOscillator(), o2 = c.createOscillator(), f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(), g = c.createGain();
  o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.setValueAtTime(128, t); o.frequency.linearRampToValueAtTime(112, t + 1.05); o2.frequency.setValueAtTime(129.5, t); o2.frequency.linearRampToValueAtTime(113, t + 1.05);
  f1.type = 'bandpass'; f1.frequency.setValueAtTime(420, t); f1.frequency.linearRampToValueAtTime(760, t + .6); f1.Q.value = 3; f2.type = 'lowpass'; f2.frequency.value = 1600;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.04, t + .2); g.gain.linearRampToValueAtTime(.2, t + 1.1); g.gain.setValueAtTime(0, t + 1.12);
  o.connect(f1); o2.connect(f1); f1.connect(f2); f2.connect(g); g.connect(A.master); o.start(t); o2.start(t); o.stop(t + 1.2); o2.stop(t + 1.2); }

// ---- Nimmerheim (vorläufige Bühne, bis AP-17 den Ort baut): weißer Raum, acht Stühle im Kreis, die Behaltenen
const KINO_KREIS = ['hilde', 'zayn', 'mike', 'roxy', 'cleo', 'maedchen']; // Fassung 3 (AP-17, Kap. 3 UK 14): Zayn, Mike, Roxy, Hilde, Cleo, Grete (Kreisel) + Lucy; der achte Stuhl bleibt leer
function kino_buehne(M) { const S = kino_S; if (Array.isArray(M)) M = { x: M[0], z: M[1] }; /* weiss.js übergibt mitte: [x, z] – sonst NaN-Positionen im Kreis und in den Klängen */ return M || S.bu || { x: X3 + 4, z: Z3 }; }
function kino_kreisSetzen(M, r, stehen, nur) { const S = kino_S, a0 = S.bl ? Math.atan2(S.bl.fz, S.bl.fx) - PI / 2 : 0; KINO_KREIS.forEach((k, i) => { if (nur && !nur.includes(k)) return; const a = a0 + i / 8 * PI * 2, x = M.x + Math.cos(a) * r, z = M.z + Math.sin(a) * r, ry = Math.atan2(M.x - x, M.z - z);
  const st = S.obj['stuhl' + i], rs = stehen ? 5.1 : r + .08; if (st) { st.visible = !stehen || r > 4.4; st.position.set(M.x + Math.cos(a) * rs, 0, M.z + Math.sin(a) * rs); st.rotation.y = ry; } // Sitzfläche zur Mitte, Lehne außen
  if (stehen) kino_fig(k, x, 0, z, ry, 'idle', { look: 'cam', t0: i * .4 }); else kino_fig(k, x, 0, z, ry, 'idle', { sit: .47, t0: i * .4 }); kino_grau(S.fig[k], true); }); }
// Behaltene: grau, ohne Wärme (Farbe der Texturen gedämpft) – nach der Sequenz wieder normal (kino_figOff)
// Fassung R-4: echtes Grau (Textur entsättigt, kühl, wächsern), Augen schwarz und nass, kein Mund (Kopfnetz mundlos, Zähne/Zunge weg) – wie das Graukind
const KINO_AUGE = new THREE.MeshPhysicalMaterial({ color: 0x020203, roughness: .06, metalness: 0, clearcoat: 1, clearcoatRoughness: .02, envMapIntensity: 1.7 });
function kino_grauMat(x) { const c = x.clone(), ob = x.onBeforeCompile, ck = x.customProgramCacheKey ? x.customProgramCacheKey() : '';
  c.onBeforeCompile = (sh, r) => { if (ob) ob.call(c, sh, r); sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    { float l = dot(diffuseColor.rgb, vec3(.3, .59, .11)); diffuseColor.rgb = vec3(.56, .585, .625) * (.32 + l * 1.05); }`); };
  c.customProgramCacheKey = () => ck + '|kinoGrau'; if (c.color) c.color.setRGB(1, 1, 1); if (c.emissive) c.emissive.setRGB(0, 0, 0); if (c.roughness !== undefined) c.roughness = Math.min(c.roughness, .55); return c; }
function kino_grau(P, on) { if (!P) return;
  if (!P.grauM) { const by = {}; for (const [m] of P.mats) by[[].concat(m.material)[0].name] = m;
    const mund = by.Std_Skin_Head && by.Std_Eye_L && by.Std_Eye_R ? (() => { try { return kino_mundlosGeo(by.Std_Skin_Head, by.Std_Eye_L, by.Std_Eye_R); } catch (e) { console.warn('Kino: mundlos', e); return null; } })() : null;
    P.grauGeo = P.mats.map(([m]) => m === by.Std_Skin_Head && mund ? [m.geometry, mund] : null);
    P.grauM = P.mats.map(([m, mat]) => [].concat(mat).map(x => { const n = x.name || ''; if (/^std_eye_[lr]$/i.test(n)) return KINO_AUGE; if (/teeth|tongue|eyelash/i.test(n)) return null; if (/cornea|tearline|occlusion/i.test(n)) return x; return kino_grauMat(x); })); }
  P.mats.forEach(([m, mat], i) => { const g = P.grauM[i], gg = P.grauGeo[i]; m.visible = !(on && g[0] === null); m.material = on ? (Array.isArray(mat) ? g.map((x, j) => x || mat[j]) : g[0] || mat) : mat; if (gg) m.geometry = on ? gg[1] : gg[0]; }); P.grau = on; }
function kino_defK3b() {
  const S = kino_S, M = () => kino_buehne(S.opts && S.opts.mitte);
  const zu = (onZu, fuesse) => { kino_blinzeln(.15, .15, onZu); if (fuesse) { const m = M(); kino_after(.05, () => { for (let i = 0; i < 5; i++) Audio.stepAt && Audio.stepAt(m.x + Math.cos(i) * 2, m.z + Math.sin(i) * 2, .09); }); } };
  const schiffAtem = (rate, v = .06) => { const m = M(); kino_atem(v, rate, m.x, 6, m.z + 8); };
  kino_def('k3blinzeln', [
    { frei: true, dur: 3, env: 'white', keepFlash: false, // 0–3 · Luna, grau, vor ihm; die sieben ruhig auf den Stühlen, fünf Meter weg. Das Schiff atmet. Luna summt Miras Lied
      setup() { const m = M(); kino_kreisSetzen(m, 5, false); kino_fig('graue', m.x + S.bl.fx * 1.3, 0, m.z + S.bl.fz * 1.3, Math.atan2(-S.bl.fx, -S.bl.fz), 'idle', { look: 'cam' });
        { const a = Math.atan2(S.bl.fz, S.bl.fx) - PI / 2 + 7 / 8 * PI * 2, x = m.x + Math.cos(a) * 5, z = m.z + Math.sin(a) * 5; kino_fig('lucyK', x, 0, z, Math.atan2(m.x - x, m.z - z), 'idle', { sit: .47, pose: kino_haendeAugen }); }
        schiffAtem(.45); kino_after(3.5, () => schiffAtem(.45)); kino_summen(['E4', 'D4', 'C4', 'B3'], .4); },
      tick(k, t) { kino_flacker('lucyK', t); } },
    { frei: true, dur: 5, env: 'white', lines: [['Ich hab nicht geblinzelt. Das war nicht ich.', 'LUKE', 1.2, 3400]], // 3–8 · Blinzeln: die Stühle stehen einen Meter näher
      setup() { zu(() => kino_kreisSetzen(M(), 4, false)); }, tick(k, t) { kino_flacker('lucyK', t); } },
    { frei: true, dur: 5, env: 'white', lines: [['Guck mal. Ich mach die Augen zu, und du auch.', 'LUNA', 1.4, 3600]], // 8–13 · fünf stehen, drei Meter entfernt; das Mädchen mit dem Kreisel sitzt noch
      setup() { zu(() => { kino_kreisSetzen(M(), 3, true, ['hilde', 'zayn', 'mike', 'roxy', 'cleo']); }); kino_after(.1, () => Audio.giggle(M().x, 2, M().z + 6)); kino_streicher('A1', 18, .03, .5, 500);
        kino_after(2.2, () => schiffAtem(.7)); kino_after(3.6, () => schiffAtem(.8)); }, tick(k, t) { kino_flacker('lucyK', t); } },
    { frei: true, dur: 6, env: 'white', film: { vig: 1.6 }, lines: [['Wenn sie durch mich guckt, guckt sie auch weg, wenn ich wegguck. Mach die Augen –', 'LUKE', .6, 5000]], // 13–19 · anderthalb Meter, Hilde vorn; die Augen tränen
      setup() { zu(() => kino_kreisSetzen(M(), 1.5, true, ['hilde', 'zayn', 'mike', 'roxy', 'cleo']), true); $('kinoTear').classList.add('on'); kino_streicher('A#1', 6, .03, 0, 520); kino_herz(6, 60); kino_after(3.2, () => kino_herz(5, 96)); },
      tick(k, t) { kino_flacker('lucyK', t); const P = S.fig.maedchen; if (P) { P.pose = (Q, tt) => kino_arm(Q, 'l', camera.position, .6 * kino_ramp(tt, 0, 2), .2); } } },
    { frei: true, dur: 7, env: 'white', lines: [['Nicht loslassen. Und nicht die andere geben. Sieh mich an.', 'JUSTIN', 2.2, 4600]], // 19–26 · einen halben Meter: Zayn unter Lukes Kinn; fünf Hände heben sich, Handflächen nach oben
      setup() { zu(() => { kino_kreisSetzen(M(), .9, true, ['hilde', 'mike', 'roxy', 'cleo']); const m = M(), c = S.sv.pos; kino_fig('zayn', c.x + S.bl.fx * .5, 0, c.z + S.bl.fz * .5, Math.atan2(-S.bl.fx, -S.bl.fz), 'idle', { look: 'cam' }); });
        kino_still(true, .05); for (const k of ['hilde', 'zayn', 'mike', 'roxy', 'cleo']) { const P = S.fig[k]; if (P) P.pose = (Q, tt) => { kino_arm(Q, 'r', camera.position, .75 * kino_ramp(tt, .8, 3), .1); }; } },
      tick(k, t) { kino_flacker('lucyK', t); } },
    { frei: true, dur: 2, env: 'white', blick: () => kino_justinKopf(kino_S.a), blickRate: .8, // 26–28 · Justin ansehen
      setup() { kino_sag('Ansehen', '', 1800); } },
    { frei: true, dur: 6, env: 'white', lines: [['Das war Schummeln. Aber ich hab’s nicht gemerkt, wer.', 'LUNA', .8, 4200]], // 28–34 · Blinzeln – alle sitzen wieder, fünf Meter, die Hände im Schoß
      setup() { if (typeof augenzu_frei === 'function') augenzu_frei({ wirkt: true, hinweis: 'Q – Augen zu' }); zu(() => { for (const k of KINO_KREIS) { const P = S.fig[k]; if (P) P.pose = null; } kino_kreisSetzen(M(), 5, false); $('kinoTear').classList.remove('on'); });
        kino_after(.3, () => { if (typeof augenzu_sperre === 'function') augenzu_sperre(); }); kino_still(false, 1); schiffAtem(.45); kino_after(2, () => kino_herz(3, 70, .6)); }, tick(k, t) { kino_flacker('lucyK', t); } },
    { frei: true, dur: 4, env: 'white', // 34–38 · Lucy nimmt die Hände vom Gesicht, deutlicher als vorher; Whiskey klappert einmal
      setup() { const P = S.fig.lucyK; if (P) P.pose = null; kino_after(1.6, () => { const J = justin && justin.g; if (J) kino_klapper(J.position.x, 1.9, J.position.z); }); } },
  ], { name: 'Blinzeln', skipAfter: Infinity, nahtlos: true, offen: true, uebergabe: true,
    start(o) { const P = player.pos, fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); S.bl = { fx, fz }; S.bu = o && o.mitte ? { x: o.mitte[0], z: o.mitte[1] } : { x: P.x, z: P.z };
      if (justin && justin.g) { S.blJ = [justin.g.position.clone(), justin.g.rotation.y, justin.g.visible]; justin.g.visible = true; justin.g.position.set(P.x - fz * .9 - fx * .1, 0, P.z + fx * .9 - fz * .1); justin.g.rotation.y = Math.atan2(fx, fz); if (typeof jPlay === 'function') jPlay('idle', 0); } },
    done() { $('kinoTear').classList.remove('on'); for (const k in kino_S.fig) kino_S.fig[k].pose = null; const J = kino_S.blJ; if (J && justin && justin.g) { justin.g.position.copy(J[0]); justin.g.rotation.y = J[1]; justin.g.visible = J[2]; } kino_S.blJ = null; } });
}
function kino_justinKopf(v) { const J = justin && justin.g; return J ? v.set(J.position.x, 1.8, J.position.z) : v.set(0, 1.8, 0); }
function kino_haendeAugen(P, t) { const B = P.bones; if (!B.head) return; B.head.getWorldPosition(kino_S.b); P.g.getWorldDirection(kino_d); kino_S.b.addScaledVector(kino_d, .12); kino_arm(P, 'r', kino_S.b, .95, .9); kino_arm(P, 'l', kino_S.b, .95, .9); }
function kino_flacker(key, t) { const P = kino_S.fig[key]; if (!P || !P.g.parent) return; P.g.visible = Math.sin(t * 23) + Math.sin(t * 7.3) > -1.3 || Math.random() > .5; }
function kino_summen(notes, t0 = 0) { const b = kino_bus(); if (!b || typeof KI === 'undefined') return; const c = Audio.ctx; let t = c.currentTime + t0; for (const n of notes) { KI.flute(c, b, t, KN(n), .7, .025); t += .78; } }

// ---- Abspann „Wie jeden Morgen“ (60 s, überspringbar nach 3 s) – Justins Ruf je Antwort, Lucys Satz, Wolter-Satz je Vertrauensstufe, A-13
const KINO_RUF = { A: 'Luna! Ich bin da! Ich bleib da!', B: '… fünf … sechs …', C: 'Luna! Ich such dich! Hörst du? Ich such dich!' };
function KINO_KARTE3(opts) { const a = kino_antwort(opts), rh = typeof ch3 !== 'undefined' && ch3.armorHints ? ch3.armorHints.size : 0, E = typeof lwo_kapitelende === 'function' ? lwo_kapitelende(3) : null;
  const st = E && E.stempel || (kino_stufe() === 'miserabel' ? 'K-3: nicht geborgen. Noch nicht.' : null);
  const T = { A: ['Er ist bei ihr geblieben.', 'Sie sieht ihn nicht. Sie hört ihn rufen.'], B: ['Er spielt mit.', 'Sie zählt, und er zählt hinter ihr her.'], C: ['Er sucht jetzt laut.', 'Einmal hat sie ihn gesehen. Durch dich.'] }[a] || [];
  return ['KAPITEL 3 — ENDE · ICH KOMME', ...T, rh >= 3 ? { t: 'Er weiß jetzt, was er ausziehen muss.', klein: true } : null, 'Es wird hell.', st ? { t: st, stempel: true } : null]; }
function kino_defK3Abspann() {
  const S = kino_S, KR = { x: 4.2, z: .6 }; // Luke an der Kreuzung
  const kette = () => { const d = typeof doorOf !== 'undefined' && doorOf[3]; return d || null; };
  const shots = [
    // 0–6 · Nimmerheim: hinter Justin, Schulterhöhe, langsam zurückfahrend; er geht zwischen die Rippen ins Dunkel. Luna und die sieben halten sich die Augen zu
    { path(e, t, v, w) { const M = S.nh; v.set(M.x, 1.75, M.z - 1.2 - 2.4 * e); w.set(M.x, 1.4, M.z + 6); }, dur: 6, fov: 44, env: { fog: [0xe6e8ec, .007], sky: [0xf0f2f5, 0xf4f6f8, 1.4], hemi: [1.25, 0xffffff, 0xc8cace], moon: [0, 0xffffff], exp: .95, envI: .25 }, fadeIn: 1400, hand: .25, ease: 'soft', film: { vig: .5 },
      setup(sh) { const M = S.nh; S.bl = { fx: 0, fz: -1 }; kino_kreisSetzen({ x: M.x, z: M.z + 3 }, 5, false); for (const k of KINO_KREIS) { const P = S.fig[k]; if (P) P.pose = kino_haendeAugen; }
        kino_fig('graue', M.x + .6, 0, M.z + 1.6, PI, 'idle', { pose: kino_haendeAugen });
        if (justin && justin.g) { sh.j = [justin.g.position.clone(), justin.g.rotation.y, justin.g.visible]; justin.g.visible = true; justin.g.position.set(M.x, 0, M.z); justin.g.rotation.y = 0; if (typeof jPlay === 'function') jPlay('walk', 0); kino_helm(true); }
        const a = kino_antwort(S.opts); kino_after(.4, () => kino_sag('Vier. Fünf. Sechs.', 'LUNA', 2600)); kino_after(1.9, () => kino_sag(KINO_RUF[a] || KINO_RUF.B, 'JUSTIN', 2600)); kino_after(4.2, () => kino_sag('… sieben …', 'LUNA', 1800));
        for (let i = 0; i < 7; i++) kino_after(.3 + i * .72, () => Audio.play(Audio.pick('scrape1', 'scrape2'), { gain: .09 * (1 - i / 8), rate: .7, dur: .25, lp: 1600 })); },
      tick(k, t, dt, sh) { if (justin && justin.mixer) justin.mixer.update(dt); if (justin && justin.g) { justin.g.position.z = S.nh.z + t * 1.2; } const U = filmPass.uniforms; U.vig.value = .5 + 1.6 * kino_ramp(t, 2.5, 6); renderer.toneMappingExposure = (1.05 - .55 * kino_ramp(t, 2.5, 6)) * settings.bright; },
      teardown(sh) { if (sh.j && justin && justin.g) { justin.g.position.copy(sh.j[0]); justin.g.rotation.y = sh.j[1]; justin.g.visible = sh.j[2]; if (typeof jPlay === 'function') jPlay('idle', 0); } for (const k of [...KINO_KREIS, 'graue']) kino_figOff(k); for (let i = 0; i < 8; i++) kino_hide('stuhl' + i); } },
    { white: true, dur: 2, fadeOut: 500, setup() { kino_still(true, .2); } }, // 6–8 · Weiß, Stille
    // 8–16 · Kreuzung, Bodenhöhe, 40 cm neben Lukes Schuhen, Blick die Ahornstraße hinunter: die Laternen gehen aus, von Osten nach Westen, wie jeden Morgen. Nur die vor Nr. 1 nicht (A-13)
    { from: [KR.x + .35, .4, KR.z + .3], to: [KR.x + .3, .38, KR.z + .25], look: [-40, 1.8, -1.5], dur: 8, fov: 38, env: 'morgen', fadeIn: 1600, hand: .15, lens: { at: [KR.x - 1.5, .1, KR.z + .1], r: .35, amt: .35 },
      setup(sh) { kino_still(false, 2); kino_regen(0, .5); kino_fig('lucy', KR.x + .05, 0, KR.z - .62, -PI / 2 + .2, 'idle');
        const L = []; kino_lamps(l => { if (Math.abs(l.wz) < 6 && l.wx > -100 && l.wx < 150) { L.push(l); kino_lampe(l, 'hell'); } }); L.sort((a, b) => b.wx - a.wx); const n1 = kino_lampNah(-47, -6);
        L.forEach((l, i) => { if (l === n1) return; kino_after(.8 + i * .55, () => { kino_lampe(l, 'relais'); kino_relais(l.wx, 5, l.wz, .2); }); });
        const tn = .8 + L.indexOf(n1) * .55 + 1; if (n1) kino_after(tn, () => { kino_lampe(n1, 'pusten'); kino_einatmen(.07, n1.wx, 5, n1.wz); kino_pusten(.06, n1.wx, 5, n1.wz); });
        kino_after(2.4, () => kino_amsel(-18, 6, 14)); kino_after(6.2, () => kino_amsel(22, 7, -16)); } },
    // 16–22 · halbnah auf Lucy (Lukes Blick, nie Luke selbst): nass, in Lukes Jacke, sie hält seine Hand. Am Rand ihrer Iris ein dünner weißer Ring
    { from: [KR.x + .12, 1.68, KR.z + .02], to: [KR.x + .05, 1.66, KR.z + .04], look: [KR.x - .45, 1.55, KR.z - .05], dur: 6, fov: 34, env: 'morgen', hand: .3, lens: { at: () => kino_kopf('lucy', kino_S.a), r: .14, amt: .8 },
      lines: [['Guck nicht so. Ich bin’s.', 'LUCY', 2, 2900], ['<i>Nein. Hab ich mir eingebildet. Ich bin seit zwanzig Stunden wach.</i>', 'LUKE', 4.95, 3400]], // Story-Prüfung W-2: Midpoint-Stachel
      setup() { const P = kino_fig('lucy', KR.x - .45, 0, KR.z - .05, PI / 2 - .1, 'idle', { look: 'cam', pose: (Q, t) => kino_arm(Q, 'r', kino_S.b.set(camera.position.x, .95, camera.position.z + .1), .55, .3) }); kino_atem(.05, 1, KR.x - .4, 1.5, KR.z); kino_after(2.8, () => kino_atem(.06, .9));
        kino_after(2.15, () => { try { Audio.play('mb_spieluhr', { gain: .12, dur: 1.3, fadeIn: .25 }); } catch (e) {} }); } }, // W-2: unter Lucys Satz einen halben Takt lang leise die Spieluhr
    // 22–30 · Totale von der Tür von Nr. 3: die Tür geht auf, ohne Kette; Vegas, barfuß, eine Wolldecke über dem Arm, rennt über die Straße
    { from: [-27.2, 1.55, -10.3], to: [-26.2, 1.5, -9.2], look: [-24, 1.3, -6], lookTo: [KR.x - 12, 1.1, KR.z - 1], dur: 8, fov: 46, env: 'morgen', hand: .45, ease: 'soft', follow: 1.8,
      lines: [['Mädchen. Himmelherrgott. Du bist ja pitschnass.', 'VEGAS', 4.2, 3600]],
      setup(sh) { kino_fig('lucy', KR.x - .45, 0, KR.z - .05, -PI / 2, 'idle'); const d = kette(); sh.d = d ? [d, d.rotation.y] : null; Audio.play('doorOpen', { gain: .35, x: -28, y: 1.5, z: -12, ref: 3 });
        kino_fig('vegas', -28, 0, -11, .6, 'walk', { ts: 1.6 }); const v = kino_S.porch0 = porchLights[1] ? porchLights[1].dead : null; },
      tick(k, t, dt, sh) { if (sh.d && t < 1.2) sh.d[0].rotation.y = sh.d[1] - 1.3 * kino_e(t / 1.2); const P = kino_S.fig.vegas; if (!P) return; kino_gehen(P, -28, -11, KR.x - 1.4, KR.z - .3, t - .6, 2.4, 'walk');
        if (Math.floor(t * 2.6) !== kino_S.vst && t > .6) { kino_S.vst = Math.floor(t * 2.6); Audio.stepAt && Audio.stepAt(P.g.position.x, P.g.position.z, .12); } },
      teardown(sh) { if (sh.d) sh.d[0].rotation.y = sh.d[1]; } },
    // 30–36 · halbnah: Vegas wickelt Lucy in die Decke und hebt sie hoch, ächzend; sie hält Lukes Hand, bis es nicht mehr geht
    { from: [KR.x + .9, 1.5, KR.z + 1.4], to: [KR.x + .7, 1.55, KR.z + 1.2], look: [KR.x - .9, 1.35, KR.z - .1], dur: 6, fov: 38, env: 'morgen', hand: .4, lens: { at: () => kino_kopf('vegas', kino_S.a), r: .2, amt: .5 },
      lines: [['Wo warst du denn, im Gully?', 'VEGAS', 1.2, 2800], ['Fast.', 'LUCY', 4.3, 1600]],
      setup() { { const hug = kino_S.fig.vegas && kino_S.fig.vegas.acts.hug; kino_fig('vegas', KR.x - 1.15, 0, KR.z - .15, PI / 2, hug ? 'hug' : 'idle', { pose: hug ? null : (Q, t) => { kino_arm(Q, 'r', kino_kopf('lucy', kino_S.b), .7, .6); kino_arm(Q, 'l', kino_kopf('lucy', kino_S.b), .6, .6); } }); }
        kino_S.fig.vegas.look = null; kino_fig('lucy', KR.x - .75, 0, KR.z - .1, -PI / 2 + .3, kino_S.fig.lucy && kino_S.fig.lucy.acts.hug ? 'hug' : 'idle', { pose: (Q, t) => kino_arm(Q, 'r', kino_S.b.set(camera.position.x, 1.0, camera.position.z), .5 * (1 - kino_ramp(t, 3.5, 5.5)), .2) });
        kino_after(1.8, () => { kino_atem(.08, .7, KR.x - 1.1, 1.6, KR.z); kino_stoff(.06); }); },
      tick(k, t) { const L = kino_S.fig.lucy; if (L) { const u = kino_e(kino_ramp(t, 2, 3.6)); L.g.position.y = .14 * u; L.g.position.x = KR.x - .75 - .1 * u; L.g.rotation.z = -.08 * u; } } },
    // 36–40 · über Lukes Schulter (sein Blick) auf Lucy in Vegas’ Armen: Whiskey landet auf ihrer Schulter und gurrt wie eine Taube
    { from: [KR.x + .3, 1.66, KR.z + .5], to: [KR.x + .2, 1.66, KR.z + .45], look: [KR.x - .95, 1.72, KR.z - .1], dur: 4, fov: 36, env: 'morgen', hand: .3, lens: { at: () => kino_kopf('lucy', kino_S.a), r: .16, amt: .6 },
      lines: [['Hallo, du. Du hast ihn ja doch hergebracht.', 'LUCY', 1.8, 2800]],
      setup() { const L = kino_S.fig.lucy; if (L) { L.g.position.y = .14; L.look = kino_S.rabe ? kino_S.rabe.g.position : null; } const h = kino_kopf('lucy', kino_V(0, 0, 0)), c = camera.position, sx = h.z - c.z, sz = -(h.x - c.x), sl = Math.hypot(sx, sz) || 1; // R-4: auf der Schulter, die von der Kamera weg liegt – er verdeckt ihr Gesicht nicht
        const ziel = kino_V(h.x - sx / sl * .2, h.y - .2, h.z - sz / sl * .2); kino_rabeFly(kino_V(KR.x + 8, 7, KR.z - 6), ziel, 1.2, () => kino_taube(h.x, h.y, h.z));
        S.vl[1].position.set(h.x + .4, h.y + .6, h.z + .6); S.vl[1].color.setHex(0xdfe6f0); S.vl[1].distance = 2.5; S.vl[1].intensity = 1.4; } }, // Morgenlicht als Kante: der Rabe ist kein schwarzes Loch
    // 40–44 · Lukes Blick nach oben: Whiskey hüpft auf die Telefonzelle und sieht ihn an; das Mikrowellen-Pling
    { from: [KR.x, 1.66, KR.z], to: [KR.x + .05, 1.64, KR.z + .05], look: [8, 2.9, 7.2], dur: 4, fov: 40, env: 'morgen', hand: .5, lens: { at: [8, 2.9, 7.2], r: .2, amt: .4 },
      lines: [['… Ich hab dich auch vermisst.', 'LUKE', 2.1, 2600]],
      setup() { kino_rabeFly(kino_V(KR.x - .9, 1.7, KR.z), kino_V(8, 2.66, 7.2), .9, () => { const R = kino_S.rabe; if (R) R.g.rotation.y = Math.atan2(KR.x - 8, KR.z - 7.2); kino_pling(8, 2.7, 7.2); }); } },
    // 44–48 · Schwenk zur Bushaltestelle: der graue Kombi, Motor an, Licht aus; ein Satz je Vertrauen; er fährt ohne Licht davon
    { from: [KR.x, 1.66, KR.z], look: [7, 2.4, 8], lookTo: [4.2, 1.1, 49], dur: 4, fov: 40, fovTo: 20, env: { fog: [0x7d8590, .009], sky: [0x9aa0a8, 0x3c4a62, 1], hemi: [.95, 0x9aa8c0, 0x34302c], moon: [.3, 0xc8d4ea], exp: 1.12, envI: .4 }, hand: .35, ease: 'soft',
      setup() { const k = kino_show('kombi', 4.2, 0, 49.5, PI); const E = typeof lwo_kapitelende === 'function' ? lwo_kapitelende(3) : null, z = E && E.zeile || { hoch: '„Gute Nacht, Luke.“', miserabel: '„Gute Nacht, K-3.“' }[kino_stufe()] || '„Gute Nacht, Herr Brandt.“';
        Audio.play('carEngine', { gain: .08, rate: .8, dur: 4, x: 4.2, y: 1, z: 49.5, ref: 12, lp: 900 }); kino_after(2.2, () => kino_sag(z.replace(/[„“]/g, ''), 'WOLTER', 2400)); },
      tick(k, t) { const o = kino_S.obj.kombi; if (o && t > 3.2) o.position.z = 49.5 + (t - 3.2) * (t - 3.2) * 6; } },
    // 48–54 · Bodenhöhe hinter Luke, Blick auf seine Fersen: ein Kiesel rollt aus dem Nebel und bleibt an zwei anderen liegen. Klavier setzt ein
    { from: [KR.x - .2, .22, KR.z + 1.2], to: [KR.x - .15, .2, KR.z + 1.05], look: [KR.x, .03, KR.z + .35], dur: 6, fov: 34, env: 'morgen', hand: .15, lens: { at: [KR.x, .03, KR.z + .35], r: .12, amt: .85 },
      lines: [['Hast du gewartet? … Du hast gewartet.', 'LUKE', 3.4, 3600]],
      setup() { kino_hide('kombi'); S.vl[0].position.set(KR.x - .3, 1.1, KR.z + 1.1); S.vl[0].color.setHex(0xc8d2e4); S.vl[0].distance = 3; S.vl[0].intensity = 2.6; S.vl[1].position.set(KR.x + .8, .5, KR.z - .4); S.vl[1].color.setHex(0xffb878); S.vl[1].distance = 3; S.vl[1].intensity = 1; const b = [KR.x - .03, KR.z + .36]; kino_show('kiesel0', b[0], .018, b[1]); kino_show('kiesel1', b[0] + .02, .045, b[1] - .01); kino_show('kiesel2', b[0] + 1.6, .02, b[1] + .8);
        kino_klavier([['E4', .7], ['D4', .7], ['C4', .7], ['B3', .9], ['C4', 2, 8]], 2.2, .09); },
      tick(k, t) { const o = kino_S.obj.kiesel2; if (!o) return; const u = kino_e(kino_ramp(t, .4, 1.8)); o.position.set(KR.x - .03 + 1.6 * (1 - u), .02 + (u > .96 ? .05 * (u - .96) / .04 : 0), KR.z + .36 + .8 * (1 - u)); o.rotation.x = u * 9;
        if (u >= 1 && !kino_S.kiesDa) { kino_S.kiesDa = 1; kino_kiesel(KR.x, 0, KR.z + .36); kino_trippeln(KR.x + 1.5, KR.z + 2, .04); } }, teardown() { kino_S.kiesDa = 0; } },
    // 54–58 · Totale von oben über der Kreuzung, steigend, Blick nach Norden über den Wald: nur ganz hinten atmet noch ein schwacher weißer Schein
    { from: [KR.x, 6, KR.z - 8], to: [KR.x, 24, KR.z - 16], look: [KR.x, 4, 80], lookTo: [KR.x, 10, 200], dur: 4, fov: 50, env: 'haze', hand: .2, ease: 'soft',
      setup() { kino_show('ferne', 20, 18, 260).material.opacity = 0; }, tick(k, t) { kino_S.obj.ferne.material.opacity = .12 + .1 * Math.pow(.5 + .5 * Math.sin(t * 1.3), 2); } },
    { black: true, dur: 2, fadeOut: 900, setup() { kino_still(true, 1.5); } },
    { card: o => KINO_KARTE3(o), dur: 'auto', fadeOut: 600 },
  ];
  const meta = a => ({ name: 'Wie jeden Morgen', skipAfter: 3, antwort: a, start(o) { if (a && !o.antwort) o.antwort = a; kino_S.nh = { x: X3 + 4, z: Z3 }; return kino_preload('k3'); },
    done() { for (const k in kino_S.fig) kino_S.fig[k].pose = null; kino_hide('kombi', 'kiesel0', 'kiesel1', 'kiesel2', 'ferne'); } });
  kino_def('k3', shots, meta(null)); for (const a of ['A', 'B', 'C']) kino_def('k3' + a.toLowerCase(), shots, meta(a)); // Aufrufer weiss.js / Basis: k3a/k3b/k3c = Antwort A/B/C
}
function kino_kopf(key, v) { const P = kino_S.fig[key]; if (P && P.g.visible && P.bones.head) return P.bones.head.getWorldPosition(v); return v.set(0, 1.6, 0); }

// ======================================================== Prolog · Höhepunkt „Kum, Wîse“ (22 s, nicht überspringbar) – aus traum.js statt Shot 4
function kino_prolog() { const S = kino_S; if (!S.ready || S.on || typeof traum_S === 'undefined' || !traum_S.crow) return false; traum_S.kino = true;
  kino_play('kp', { nahtlos: true }).then(() => { traum_S.skip = true; traum_wake(); }).catch(e => { console.error('Kino kp', e); traum_wake(); }); return true; }
function kino_defProlog() {
  const S = kino_S, W = () => traum_S.crow, P = () => TRAUM_PERCH;
  const kopf = v => { const C = W(); if (!C) return v.set(0, 3, 0); if (!S.kpHead) C.g.traverse(b => { if (!S.kpHead && b.isBone && /head/i.test(b.name)) S.kpHead = b; }); return S.kpHead ? S.kpHead.getWorldPosition(v) : v.copy(C.g.position).add({ x: 0, y: .3, z: 0 }); };
  const nahe = (d, h, s) => sh => { W().g.updateMatrixWorld(true); kopf(S.b); return [S.b.x + d * S.kp.dx, S.b.y + h + .05, S.b.z + d * S.kp.dz]; };
  const drehe = (ang) => { const C = W(); if (C && S.kpHead) kino_rotW(S.kpHead, KINO_UP, ang); };
  const mix = dt => { const C = W(); if (!C) return; const p = P(); C.fl = null; C.g.visible = true; C.g.position.set(p.x, p.y, p.z); C.g.rotation.set(0, Math.atan2(S.kp.dx, S.kp.dz), 0); if (C.mx) C.mx.update(dt); C.g.updateMatrixWorld(true); }; // er bleibt auf der Laterne
  kino_def('kp', [
    { from: nahe(.58, .03), to: nahe(.52, .02), look: () => kopf(kino_V(0, 0, 0)).toArray(), dur: 5, fov: 30, roll: .05, rollTo: -.03, hand: .3, lens: { at: () => kopf(kino_S.a), r: .1, amt: .9 },
      lines: [['<i>Finde Lucy. Finde heraus, was mit diesem Dorf geschehen ist.</i>', 'DER RABE', .6, 4200]],
      setup() { kino_regen(.035, 2); if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', .3); kino_after(.6, () => { const p = W().g.position; Audio.whisper(p.x, p.y, p.z, 2); }); },
      tick(k, t, dt) { mix(dt); } },
    { from: nahe(.52, .02), to: nahe(.72, .04), look: () => kopf(kino_V(0, 0, 0)).toArray(), dur: 4, fov: 30, hand: .15, lens: { at: () => kopf(kino_S.a), r: .12, amt: .8 },
      lines: [['<i>Und finde heraus, wer du bist.</i>', 'DER RABE', .3, 3400]],
      setup() { if (typeof klang_S !== 'undefined' && klang_S.dreamG && Audio.ctx) { const g = klang_S.dreamG.gain, t = Audio.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(.12, t + 3); } kino_streicher('E3', 9, .022, .5, 800);
        kino_after(.3, () => { const p = W().g.position; Audio.whisper(p.x, p.y, p.z, 1.8); }); },
      tick(k, t, dt) { mix(dt); drehe(.25 * kino_e(Math.min(1, t / 2))); } }, // er senkt den Kopf, als lausche er nach hinten
    { from: nahe(.72, .04), to: nahe(.72, .04), look: () => kopf(kino_V(0, 0, 0)).toArray(), dur: 3, fov: 30, hand: .05, lens: { at: () => kopf(kino_S.a), r: .12, amt: .8 },
      setup() { kino_regen(0, .4); if (typeof klang_S !== 'undefined' && klang_S.dreamG && Audio.ctx) { const g = klang_S.dreamG.gain, t = Audio.ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + .4); }
        kino_after(.8, () => { kino_sag('<i>… sechzehn …</i>', '', 1800); const p = P(); Audio.whisper(p.x - 30, 1.2, p.z + 25, 1.1); }); },
      tick(k, t, dt) { mix(dt); drehe(.25 + .8 * kino_e(Math.min(1, t / 1.6))); } }, // weg von Luke, zur Laterne hin
    { from: nahe(.72, .04), to: nahe(.72, .04), look: () => kopf(kino_V(0, 0, 0)).toArray(), dur: 1.2, fov: 30, hand: .05, lens: { at: () => kopf(kino_S.a), r: .14, amt: .7 }, // 12,0–13,2 · Sprung: das Kindergesicht
      setup() { Audio.thump(P().x, P().y, P().z); kino_sub(.35); KINO_GK.uPlane.value = 1; KINO_GK.uMund.value = 0; S.kpF = kino_V(0, 0, 0); }, // R-9: echter Kopf des Graukinds, kindgroß verkleinert auf dem Rabenhals; kein Haar
      tick(k, t, dt) { mix(dt); const p = S.kpF; kopf(p); camera.getWorldDirection(kino_d); p.addScaledVector(kino_d, -.012); p.y -= .03; const G = kino_gkZeig(p, camera.position, .5, false); if (G) G.rotateZ(-.06 + .03 * Math.sin(t * 2));
        KINO_GK.uMund.value = .5 + .5 * Math.sin(t * 4.2); kino_S.lit[0] = kino_S.litKP || (kino_S.litKP = { p: kino_V(0, 0, 0), c: 0xe4ecf8, d: 2.5, i: 0 }); kino_S.litKP.p.copy(p).add(kino_V(0, -.35, 0)).addScaledVector(kino_d, -.15); kino_S.litKP.i = .45; /* schwach, von unten aus dem Laternenglas */ },
      teardown() { kino_hide('grauKopf'); KINO_GK.uMund.value = 0; } },
    { from: nahe(.72, .04), to: nahe(1.1, .15), look: () => kopf(kino_V(0, 0, 0)).toArray(), dur: 3.8, fov: 30, fovTo: 36, hand: .3, ease: 'soft', film: { vig: 1.8, filter: 'grayscale(.6) brightness(1.1) contrast(.9) blur(.8px)', filterT: 2.5 },
      lines: [['<i>Kum, Wîse.</i><span style="opacity:.62;font-size:.8em;font-style:normal"> – alt für „Komm, Wîse.“</span>', 'DER RABE', 1.3, 2600]],
      setup() { if (typeof whiskey_play === 'function') whiskey_play('IdleScratchWing', .2); kino_after(1.3, () => kino_kum(W().g.position)); }, tick(k, t, dt) { mix(dt); } },
    { from: nahe(1.1, .15), to: nahe(1.0, -1.25), look: () => kopf(kino_V(0, 0, 0)).toArray(), lookTo: () => { const p = P(); return [p.x, p.y - .25, p.z]; }, dur: 4, fov: 36, fovTo: 58, hand: .2, ease: 'in', film: { vig: 1.2, filter: 'grayscale(.6) brightness(1.3) contrast(.85) blur(1.4px)', filterT: 3 },
      setup() { kino_regen(.5, 3.5); const p = P(); const l = kino_show('lampe', p.x, p.y - .25, p.z); l.material.opacity = 0; kino_after(1.6, () => { for (let i = 0; i < 6; i++) setTimeout(() => Audio.ding && Audio.ding(.05), i * 650); }); },
      tick(k, t, dt) { mix(dt); const l = kino_S.obj.lampe, u = kino_ramp(t, .8, 3.6); l.material.opacity = .9 * u; l.scale.setScalar(.9 + 9 * u * u); // die Laterne wird weiß und füllt das Bild
        if (t > 2.6) { const f = $('fade'); f.style.transition = 'opacity 1.3s'; f.style.background = '#fff'; f.style.opacity = 1; } }, teardown() { kino_hide('lampe'); } },
    { white: true, dur: 1.2, fadeOut: 0 },
  ], { name: 'Kum, Wîse', skipAfter: Infinity, nahtlos: true,
    start() { const C = W(); S.kpHead = null; C.fl = null; const p = P(); S.lock = () => { const q = P(); C.fl = null; C.g.position.set(q.x, q.y, q.z); }; C.g.visible = true; C.g.position.set(p.x, p.y, p.z); // er sitzt auf der Laterne (Traum-Shot 3 hatte ihn zur Fibel hüpfen lassen)
      const b = typeof TRAUM_BOOK !== 'undefined' ? TRAUM_BOOK : { x: p.x + 1.3, z: p.z + 1.1 }; let dx = b.x - p.x, dz = b.z - p.z; const n = Math.hypot(dx, dz) || 1; S.kp = { dx: dx / n, dz: dz / n };
      C.g.rotation.set(0, Math.atan2(dx, dz), 0); if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', 0); },
    done() { kino_S.lock = null; if (kino_S.sv) kino_S.sv.fadeBg = '#fff'; } });
}
// „Kum, Wîse“: gehauchte Frauenstimme (Formant-Rauschen, zwei Silben), leise, nicht an Luke gerichtet
function kino_kum(p) { const A = Audio; if (!A.ctx) return; const c = A.ctx, d = p ? A.at(p.x + .6, p.y, p.z + .4, 1.5) : A.master;
  const silbe = (t0, dur, f1, f2, v) => { const n = kino_nz(A), a = c.createBiquadFilter(), b = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0; a.type = 'bandpass'; a.frequency.value = f1; a.Q.value = 7; b.type = 'bandpass'; b.frequency.value = f2; b.Q.value = 9;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .06); g.gain.setValueAtTime(v * .8, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(a); n.connect(b); a.connect(g); b.connect(g); g.connect(d); n.stop(t + dur + .1); };
  silbe(0, .08, 1800, 3200, .05); silbe(.07, .32, 380, 900, .09); silbe(.62, .1, 2600, 3600, .03); silbe(.7, .26, 330, 2300, .08); silbe(.98, .22, 450, 1900, .06); }

// ======================================================== Kapitel 4–6 (vorbereitet): Namen und Längen nach 5.5; Einstellungen folgen, wenn AP-19/21/23 die Orte gebaut haben
function kino_defVorbereitet() {
  // Kap. 4 „Noch nicht“ (70 s): Treppe mit der Sichtung, Porträt, Dachfenster, Handschuh auf den First, Kombi, Vegas deckt zu, zweiter Traum (traum_zweiter) – Anker K4 alt (H.x/1,2/H.z+1 → H.x/1,6/H.z+2,2)
  // Kap. 5 „Kein Echo“ (40 s, K5 nach 3 s überspringbar): Gitter, Lucy, Kranfahrt Kirchberg, Dachfenster erlischt, Geweih, drei Kratzer; Wiegenlied drei Töne
  // Kap. 6 „Gleich wieder da“ (80 s): Hochsitz, Whiskey nach Westen, leerer Pfahl, Fahrtenbuch, AG-21 je Stufe (lwo_kapitelende(6)), B-K6-07, Wolter, Hänschen; Celesta, Lukes Ruf, Annis Satz
  // Bis dahin laufen die Einstellungen der alten Fassung (PK-F) weiter, damit die Aufrufer (anwesen_hallEnd, kapitel5.js, kapitel6.js) unverändert funktionieren
  const S = kino_S, H = typeof ANW_HALL !== 'undefined' ? ANW_HALL : { x: -900, z: 900 };
  // ---- K4 · „Noch nicht“ – nach der Stimme in der Villa
  // R-4: Licht je Einstellung in der Halle – oben atmet das Licht (Quelle: die Lampe der Galerie), unten die beiden Stehlampen als warme Kante, kein Licht ohne Quelle
  const k4Licht = () => { S.vl[1].position.set(H.x + H.w / 2 - .7, 1.6, H.z - H.d / 2 + 1.2); S.vl[1].color.setHex(0xffa860); S.vl[1].distance = 7; S.vl[1].intensity = 1.6; };
  const k4Atem = t => { const A = typeof anwesen_S !== 'undefined' ? anwesen_S : null, b = .75 + .35 * Math.sin(t * 1.3); if (A && A.upLight) A.upLight.intensity = .9 * b;
    kino_S.lit[0] = kino_S.litU || (kino_S.litU = { p: kino_V(H.x, 5.6, H.z + 4.6), c: 0xfff0d8, d: 9, i: 0 }); kino_S.litU.i = 2.8 * b; S.vl[0].position.set(H.x, 3.2, H.z + 3.6); S.vl[0].color.setHex(0xfff0d8); S.vl[0].distance = 6; S.vl[0].intensity = 1.2 * b; };
  kino_def('k4', [
    // 0–5 · Totale, tief vom Hallenboden an der Tür: die eingebrochene Treppe steigt ins Dunkel, oben atmet das Licht. Langsame Fahrt auf die Treppe zu (R-4: mehr Produktion)
    { from: [H.x + 1.6, .55, H.z - 4.6], to: [H.x + 1.1, .75, H.z - 3.2], look: [H.x, 2.6, H.z + 4.6], lookTo: [H.x, 3.4, H.z + 4.8], dur: 5, fov: 46, fovTo: 42, fadeIn: 1400, ease: 'soft', hand: .25, env: { exp: 1.5 }, film: { vig: 1.6 },
      lens: { at: [H.x, 2.2, H.z + 3.6], r: .3, amt: .3 },
      setup() { k4Licht(); kino_still(true, 1.2); kino_regen(0, 1); }, tick(k, t) { k4Atem(t); },
      sfx: [[() => Audio.stepAt && Audio.stepAt(H.x - .4, H.z + 4.6, .5), 1.4], [() => Audio.stepAt && Audio.stepAt(H.x, H.z + 4.8, .45), 1.85], [() => Audio.stepAt && Audio.stepAt(H.x + .4, H.z + 4.7, .4), 2.3]] },
    // 5–12 · halbnah, Lukes Blick vom Fuß der Treppe hinauf: die Spieluhr – die eine Sichtung des Kapitels (02 D7): etwas Kleines geht oben über die Kante und ist weg
    { from: [H.x, 1.25, H.z + 1], to: [H.x, 1.55, H.z + 1.9], look: [H.x, 5.2, H.z + 4.8], lookTo: [H.x, 5.8, H.z + 4.8], dur: 7, fov: 44, fovTo: 36, ease: 'soft', hand: .45, breathe: .5, env: { exp: 1.5 }, film: { vig: 1.9 },
      lens: { at: [H.x + .2, 4.6, H.z + 4.4], r: .22, amt: .4 },
      setup() { k4Licht(); kino_after(.4, () => Audio.musicBox && Audio.musicBox()); },
      tick(k, t, dt, sh) { k4Atem(t + 5);
        if (t > 3.2 && sh && !sh.sicht && typeof beob_sichtung === 'function') { sh.sicht = 1; const z1 = H.z + (H.d || 12) / 2; try { beob_sichtung([H.x + .35, 1.05, z1 - 2.05], .95, { weg: [[H.x + .35, 1.05, z1 - 2.05], [H.x + .2, 1.9, z1 - 1.1], [H.x, 2.7, z1 - .35]] }); } catch (e) {}
          for (let i = 0; i < 6; i++) setTimeout(() => { try { Audio.stepAt && Audio.stepAt(H.x + .2, z1 - 1.2 + i * .15, .35); } catch (e) {} }, 120 + i * 140); } }, // AP-19: die eine Sichtung des Kapitels (02 D7)
      teardown() { const A = typeof anwesen_S !== 'undefined' ? anwesen_S : null; if (A && A.upLight) A.upLight.intensity = .9; } },
    // 12–19 · das Porträt: langsame Fahrt auf Miras Gesicht, die weiße Flamme in der Laterne; das Licht der Stehlampe streift über Firnis und Riss. Stille
    { from: [H.x - 5.4, 1.5, H.z + 1.1], to: [H.x - 6.15, 1.56, H.z + 1.45], look: [H.x - 6.88, 1.62, H.z + 1.5], lookTo: [H.x - 6.88, 1.8, H.z + 1.5], dur: 7, fov: 40, fovTo: 32, ease: 'soft', hand: .2, env: { exp: 1.5 }, film: { vig: 1.7 },
      lens: { at: [H.x - 6.88, 1.75, H.z + 1.5], r: .2, amt: .45 },
      setup() { kino_still(true, 1.5); kino_S.lit[0] = { p: kino_V(H.x - H.w / 2 + .7, 1.6, H.z + H.d / 2 - 1), c: 0xffa860, d: 8, i: 2.6 };
        S.vl[0].position.set(H.x - 5.6, 2.3, H.z + .4); S.vl[0].color.setHex(0xffc890); S.vl[0].distance = 3.2; S.vl[0].intensity = 1.6; kino_after(3.6, () => kino_streicher('E2', 4, .02, 0, 500)); }, teardown() { kino_still(false, 1); } },
    { from: [-127, 1.7, 50], to: [-126, 2.4, 53], dur: 9, fov: 44,
      look: sh => { const f = kino_villaFenster(); return [f.x, f.y + .4, f.z]; },
      setup(sh) { const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, R = OW && OW.dbg && OW.dbg.R; sh.reg = []; if (R) for (const k of ['villa', 'allot', 'wRoad']) if (R[k]) { sh.reg.push([R[k], R[k].g.visible]); R[k].g.visible = true; }
        const vb = OW && OW.vbb, fp = kino_villaFenster(); kino_show('flamme', fp.x, fp.y, fp.z); kino_show('flammeSchein', fp.x, fp.y, fp.z + .05); kino_S.obj.flamme.material.opacity = 0; kino_S.obj.flammeSchein.material.opacity = 0; sh.gable = vb ? kino_V(-125, vb.max.y + .05, (vb.min.z + vb.max.z) / 2) : kino_V(-125, 12.5, 70); },
      tick(k, t) { const f = t > 2 && t < 4 ? Math.min(1, (t - 2) / .15, (4 - t) / .25) : 0; kino_S.obj.flamme.material.opacity = f; kino_S.obj.flammeSchein.material.opacity = .45 * f; },
      sfx: [[sh => kino_rabeFly(kino_V(-110, 16, 58), sh.gable, 3.2), 4.6], [sh => Audio.caw(sh.gable.x, sh.gable.y, sh.gable.z), 8]],
      teardown(sh) { for (const [r, v] of sh.reg) r.g.visible = v; kino_hide('flamme', 'flammeSchein', 'rabe'); } },
    { black: true, dur: 23, fadeOut: 1600, setup() { if (typeof traum_zweiter === 'function') { try { traum_zweiter(); } catch (e) { console.warn('Kino: zweiter Traum', e); } } } }, // AP-19: der zweite Traum (02 E2), nur hier
  ], { name: 'Noch nicht', skipAfter: 3 });

  // ---- K5 · „Kein Echo“ – nach „Komm heim.“
  const waldZeigen = sh => { const W = typeof wald_S !== 'undefined' ? wald_S : null; sh.wald = []; if (W && W.chunks) for (const c of W.chunks) for (const m of c.meshes) sh.wald.push([m, m.visible]); };
  const waldTick = (sh, cx, cz) => { const W = typeof wald_S !== 'undefined' ? wald_S : null; if (!W || !W.chunks) return; for (const c of W.chunks) { const v = Math.hypot(c.x - cx, c.z - cz) < c.vis + 10; for (const m of c.meshes) m.visible = v; } };
  const waldAus = sh => { for (const [m, v] of sh.wald || []) m.visible = v; };
  // Fassung 3 (AP-21): „Nicht mal von meinem Namen“ – 40 s nach „Komm heim.“ (Tabelle Kap. 5): Gitter · durchs Gitter nach Süden · Kranfahrt Kirchberg · Waldrand · Rücken von Luke und Lucy · Schwarz
  kino_def('k5', [
    // 0–6 s: am Gitter, Blick in den Wald. Nichts bewegt sich. Zwei Sekunden völlige Stille, dann Lukes Atem, dann die Katze, die sich hinsetzt
    { from: [30, 1.5, 96.8], to: [30, 1.48, 97.1], look: [30, 1.4, 106], dur: 6, fov: 50, fadeIn: 900, hand: .2,
      setup(sh) { waldZeigen(sh); waldTick(sh, 30, 100); kino_still(true, .3); }, tick(k, t, dt, sh) { if (t > 2 && !sh.b) { sh.b = 1; kino_S.sv && kino_still(false, 2.5); kino_atem(.1, .8); } },
      sfx: [[() => kino_atem(.1, .8), 4.2], [() => { try { Audio.play('stepG1', { gain: .05, rate: 1.9, x: 29.4, y: .1, z: 97.3, ref: 1.5 }); } catch (e) {} }, 5.1]], teardown(sh) { waldAus(sh); } },
    // 6–14 s: von innen im Wald durch das Gitter nach Süden – Lukes Lichtkegel, dahinter Lucy mit der Sturmlaterne, Hänschen voraus; Whiskey landet auf dem Pfosten und schweigt
    { from: [31, 1.4, 101], to: [31, 1.2, 99.5], look: [30, 1.4, 92], dur: 8, fov: 48,
      setup(sh) { waldZeigen(sh); waldTick(sh, 30, 98); const P = kino_S.sv.pos; sh.lk = [P.x, P.z]; kino_S.flash = { p: kino_V(P.x, 1.5, P.z), at: kino_V(31.5, 1.2, 104), i: 14 };
        kino_fig('lucy', 30.4, 0, 86.5, 0, 'walk', { ts: .7 }); kino_show('laterne'); kino_show('lampe', P.x + .15, 1.45, P.z + .25);
        if (typeof katzen_kino === 'function') { try { katzen_kino('HÄNSCHEN', { x: 30.1, z: 89.5, bis: [29.6, 96.6], ab: .4, blick: [30, .4, 92] }); } catch (e) {} } },
      tick(k, t, dt, sh) { const L = kino_S.fig.lucy, z = 86.5 + 5 * Math.min(1, t / 7); if (L) { L.g.position.z = z; } const l = kino_S.obj.laterne; l.position.set(30.62, .72, z + .25); l.rotation.set(Math.sin(t * 3) * .12, 0, Math.sin(t * 2.4) * .1);
        kino_S.lucyLight.position.set(30.62, .9, z + .25); kino_S.lucyLight.intensity = 2.4 * (.94 + .06 * Math.sin(t * 11)); kino_S.lit[0] = kino_S.litL || (kino_S.litL = { p: kino_V(0, 0, 0), c: 0xffb060, d: 7, i: 0 }); kino_S.litL.p.copy(kino_S.lucyLight.position); kino_S.litL.i = kino_S.lucyLight.intensity;
        kino_S.obj.lampe.material.opacity = .75 + .1 * Math.sin(t * 9); },
      sfx: [[() => kino_rabeFly(kino_V(22, 9, 90), kino_V(28.05, 2.25, 98.02), 2.4, () => kino_rabeClip('IdleLookAround')), 3.4]],
      lines: [['„Großer.“', 'LUCY', 4.4, 3200]],
      teardown(sh) { waldAus(sh); kino_figOff('lucy'); kino_hide('laterne', 'lampe', 'rabe'); kino_S.lucyLight.intensity = 0; if (typeof katzen_kino === 'function') { try { katzen_kino(null); } catch (e) {} } } },
    // 14–24 s: Kranfahrt über Spielplatz und Kirchberg – Gedenkfeld, Kerzen aus, das Grab dunkel, die Rechnung auf dem Hügel (falls liegen gelassen); bei 20 s erlischt im Nordwesten das weiße Dachfenster; Wind nur über dem Dorf
    { from: [26, 3, 90], to: [10, 30, 70], look: [-40, 0, 40], lookTo: [-48, 0, 58], dur: 10, fov: 52, env: 'vista', hand: .2,
      setup() { const fp = kino_villaFenster(); kino_show('flamme', fp.x, fp.y, fp.z); kino_show('flammeSchein', fp.x, fp.y, fp.z + .05); kino_S.obj.flamme.material.opacity = 1; kino_S.obj.flammeSchein.material.opacity = .45; },
      tick(k, t) { const f = t < 6 ? 1 : Math.max(0, 1 - (t - 6) / .5); kino_S.obj.flamme.material.opacity = f; kino_S.obj.flammeSchein.material.opacity = .45 * f; },
      sfx: [[() => { try { Audio.play('wind3', { gain: .22, rate: .8, dur: 5, fadeIn: 1.5 }); } catch (e) {} }, 1]],
      teardown() { kino_hide('flamme', 'flammeSchein'); } },
    // 24–32 s: Waldrand im Osten, zwischen die Stämme – eine Sekunde lang etwas Hohes, dessen Kopf sich dreht, ohne dass der Hals mitgeht; ein Reh ruft, zu langsam
    { from: [60, 9, 94], to: [60.4, 8.8, 94.6], look: [70, 2, 119], dur: 8, fov: 32, hand: .15,
      setup(sh) { waldZeigen(sh); waldTick(sh, 66, 110); kino_show('hirsch', 70, 0, 119, -2.6); },
      tick(k, t) { const o = kino_S.obj.hirsch; o.visible = t > 2.4 && t < 3.6; const Hd = kino_S.hirschHead; if (Hd && kino_S.hirschQ) { Hd.quaternion.copy(kino_S.hirschQ); if (t > 2.6) Hd.rotateY(Math.min(1, (t - 2.6) / .8) * 1.9); } },
      sfx: [[() => kino_reh(64, 3, 118), 4.6]],
      teardown(sh) { waldAus(sh); kino_hide('hirsch'); if (kino_S.hirschHead && kino_S.hirschQ) kino_S.hirschHead.quaternion.copy(kino_S.hirschQ); } },
    // 32–34,5 s: Rücken von Luke und Lucy, zur Straße – Lucy hakt sich ein
    { from: [30.3, 1.7, 93.6], to: [30.3, 1.65, 92.8], look: [30.2, 1.3, 84], dur: 2.5, fov: 44, hand: .2,
      setup(sh) { kino_fig('kopie', 29.95, 0, 91.8, PI, 'walk', { ts: .8 }); kino_fig('lucy', 30.55, 0, 91.7, PI, 'walk', { ts: .8 }); kino_show('laterne'); },
      tick(k, t) { const z = 91.8 - 1.1 * t; for (const [key, x] of [['kopie', 29.95], ['lucy', 30.55]]) { const F = kino_S.fig[key]; if (F) F.g.position.set(x, 0, z - (key === 'lucy' ? .1 : 0)); }
        const l = kino_S.obj.laterne; l.position.set(30.8, .72, z - .2); kino_S.lucyLight.position.set(30.8, .9, z - .2); kino_S.lucyLight.intensity = 2.2; },
      lines: [['„Guck nicht. Ich guck für dich.“', 'LUCY', 1, 2600]] },
    // 34,5–36 s: Luke sieht sich einmal um – am Gitter, in Kinderhöhe, drei parallele Kratzer, frisch
    { from: [30, 1.62, 90], to: [30, 1.6, 90.4], look: [29.6, .9, 97.6], dur: 1.5, fov: 38,
      setup() { if (typeof K5 !== 'undefined' && K5.o.kratzer) K5.o.kratzer.visible = true; },
      teardown() { kino_figOff('kopie'); kino_figOff('lucy'); kino_hide('laterne'); kino_S.lucyLight.intensity = 0; } },
    // 36–40 s: Schwarz, Endkarte. Miras Wiegenlied, drei Töne, Spieluhr, richtig herum
    { black: true, dur: 4, fadeOut: 1400, setup() { kino_still(true, 3); kino_box(['E5', 'D5', 'C5'], .4, .05, 1); } },
  ], { name: 'Nicht mal von meinem Namen', skipAfter: 3 });

  // K6 „Gleich wieder da“ definiert kapitel6.js (k6_kinoDef) – die alte Fassung hier ist entfallen (R-4)
}

// Reh ruft (Kap. 5), zu langsam
function kino_reh(x, y, z) { if (Audio.deerBark) { try { Audio.deerBark(x, z); } catch (e) {} } }
// Dachfenster der Villa Seiler (Mansion-Scan aus ausbau_ost_west): vorn in der linken Gaube; ohne Hülle die Planwerte aus PK-F
function kino_villaFenster() { const S = kino_S; if (S.vlit === undefined) { S.vlit = null; scene.traverse(o => { if (!S.vlit && o.isMesh && o.geometry && o.geometry.parameters && Math.abs(o.geometry.parameters.width - 1.5) < .01 && Math.abs(o.geometry.parameters.height - 1.78) < .01 && o.material && o.material.emissive && o.material.emissiveIntensity > 1) S.vlit = o; }); }
  if (S.vlit) { const p = S.vlit.getWorldPosition(kino_S.a); return { x: p.x, y: p.y - .28, z: p.z - .06 }; }
  const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, vb = OW && OW.vbb; if (!vb) return { x: -125, y: 8.05, z: 66.2 };
  return { x: vb.min.x + (vb.max.x - vb.min.x) * .28, y: vb.min.y + 6.1, z: vb.min.z - .06 }; }
// Justins Helm (eigenes Teil am Skelett): abnehmen/aufsetzen
function kino_helm(on) { const S = kino_S; if (!justin || !justin.model) return null; if (!S.helm) { S.helm = []; justin.model.traverse(o => { if (o.isMesh && /helm|helmet/i.test(o.name + ' ' + (o.material && o.material.name || ''))) S.helm.push(o); }); }
  for (const m of S.helm) m.visible = on; return S.helm.length; }
// Augen: für einen Atemzug nur Weiß
function kino_eyes(key, white, amt = 1.4) { const P = kino_S.fig[key]; if (!P) return; if (!P.eyes) { P.eyes = []; for (const [m] of P.mats) { const mats = [].concat(m.material); mats.forEach(x => { if (x && /eye|auge|cornea|iris/i.test((x.name || '') + ' ' + m.name)) P.eyes.push(x); }); } }
  for (const x of P.eyes) { if (!x.userData.kinoE) x.userData.kinoE = [x.emissive ? x.emissive.getHex() : 0, x.emissiveIntensity || 0]; if (x.emissive) { x.emissive.setHex(white ? 0xffffff : x.userData.kinoE[0]); x.emissiveIntensity = white ? amt : x.userData.kinoE[1]; } } }

// ---------------------------------------------------------------- Testzugriff
window.__kino = { S: kino_S, play: (id, o) => kino_play(id, o), def: kino_def, busy: kino_busy, defs: KINO, skip: () => kino_skip(), schild: w => kino_schild(w), karte: (l, o) => kino_karte(l, o),
  hold: on => { kino_S.hold = !!on; }, // Standbild (Zeit steht) – für Kontaktbögen
  outage: () => startOutage(), // Kapitel 1: Stromausfall auslösen (Test)
  fig: (...a) => kino_fig(...a), figOff: k => kino_figOff(k), // Test: Figur zeigen
  kopf: k => { const P = kino_S.fig[k]; if (!P) return null; P.g.updateMatrixWorld(true); const o = {}; for (const n of ['hips', 'spine', 'head']) { const B = P.bones[n]; if (B) { const v = new THREE.Vector3(); B.getWorldPosition(v); o[n] = v.toArray().map(x => +x.toFixed(2)); } } return o; },
  seek: async t => { const S = kino_S; for (let m = 0; m < 600 && S.on && S.i < 0; m++) await wait(50); if (!S.on) return 'aus'; S.hold = false; let n = 0; while (S.on && S.T < t && n++ < 4000) { const dt = 1 / 30; update(dt, S.T); } S.hold = true; return S.id + ' ' + S.T.toFixed(2) + ' ' + S.i; },
  fps: () => { const F = kino_S.fps; return F.t > 0 ? Math.round(F.n / F.t) : 0; },
  cam: (p, l, f = 60) => { setCamOverride(cam => { cam.position.set(...p); cam.lookAt(...l); if (cam.fov !== f) { cam.fov = f; cam.updateProjectionMatrix(); } }); }, free: () => { setCamOverride(null); camera.fov = fov; camera.updateProjectionMatrix(); },
  info: () => ({ fenster: kino_villaFenster(), zus: !!kino_S.zus, schild: kino_S.schild, loadT: kino_S.loadT, figs: Object.keys(kino_S.fig), objs: Object.keys(kino_S.obj), rabe: !!kino_S.rabe, helm: kino_helm(true), lens: !!kino_S.lens, ready: kino_S.ready,
    clips: Object.fromEntries(Object.entries(kino_S.fig).map(([k, P]) => [k, Object.keys(P.acts)])), bones: Object.fromEntries(Object.entries(kino_S.fig).map(([k, P]) => [k, Object.keys(P.bones).length])) }),
  mats: key => { const P = kino_S.fig[key]; return P ? P.mats.map(([m]) => m.name + ':' + [].concat(m.material).map(x => x.name).join('/')) : null; } };
