// =====================================================================  KLANG (Modul „klang“): Musik je Ort, Tierstimmen der Jahreszeit, Schritte je Untergrund, Türen, Gegenstände
// Musik: eigens komponierte Stücke, beim Start einmalig im Hintergrund zu Audiospuren gerendert (OfflineAudioContext – kostet zur Laufzeit nichts).
// Leitmotiv ist Lucys Spieluhr (E – D – C – H – C). Jedes Stück hat seinen Ort; beim Ortswechsel blendet die Musik langsam über.
// Regel: nie überladen, nie tot still. Musik ist leise und hat Luft; dazwischen trägt die Umgebung (Regen, Wind, Tiere).
// Novembernacht, Regen: keine Grillen – dafür Waldkauz, Fuchs, Krähen, ferne Hunde, tropfende Dachrinnen, knackendes Totholz.
const klang_S = { pending: [], tracks: {}, rendering: false, menu: null, menuG: null, dream: null, area: 'ort', areaT: 0, ambT: 10 };
const KN = n => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n), i = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (i + (m[3] - 4) * 12) / 12); };
// ---------------------------------------------------------------- Instrumente (für jeden Kontext, auch offline)
const KI = {
  ir(c, sec, dec) { const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, dec) * (i < 600 ? i / 600 : 1); } return b; },
  chain(c, wet = .45, sec = 5.5) { const dry = c.createGain(), comp = c.createDynamicsCompressor(), master = c.createGain(); comp.threshold.value = -18; comp.ratio.value = 3; master.gain.value = .9;
    const conv = c.createConvolver(); conv.buffer = KI.ir(c, sec, 2.6); const wg = c.createGain(); wg.gain.value = wet; dry.connect(comp); dry.connect(conv); conv.connect(wg); wg.connect(comp); comp.connect(master); master.connect(c.destination); return dry; },
  env(c, t, a, peak, d, hold = 0) { const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(.0001, t + a + hold + d); return g; },
  osc(c, type, f, t, dur) { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(t + dur + .05); return o; },
  // Klavier: Obertöne mit eigener Abklingzeit, leichter Anschlag
  piano(c, out, t, f, v = .3, len = 5) { [[1, 1, len], [2, .42, len * .6], [3, .2, len * .4], [4.02, .09, len * .3], [5.05, .05, len * .2]].forEach(([m, a, d]) => { const o = KI.osc(c, 'sine', f * m * (1 + (m - 1) * .0007), t, d + .1), g = KI.env(c, t, .006, v * a, d); o.connect(g); g.connect(out); });
    const n = c.createBufferSource(); n.buffer = KI.noise(c); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(4000, f * 6); const g = KI.env(c, t, .002, v * .05, .05); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + .12); },
  // Spieluhr: helle Zinke, unharmonischer Oberton, kurzer metallischer Anschlag
  box(c, out, t, f, v = .12) { [[1, 1, 2.6], [2, .3, 1.4], [5.93, .12, .5]].forEach(([m, a, d]) => { const o = KI.osc(c, 'sine', f * m, t, d), g = KI.env(c, t, .003, v * a, d); o.connect(g); g.connect(out); }); },
  bell(c, out, t, f, v = .2, d = 7) { [[1, 1], [2.01, .5], [2.76, .35], [4.07, .18], [5.4, .1]].forEach(([m, a], i) => { const o = KI.osc(c, 'sine', f * m, t, d), g = KI.env(c, t, .004, v * a, d * (1 - i * .15)); o.connect(g); g.connect(out); }); },
  // Fläche: je Ton zwei verstimmte Sägezähne durch einen weichen Tiefpass, langsames Ein- und Ausblenden
  pad(c, out, t, fs, dur, v = .05, cut = 900) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = .3; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(4, dur * .35)); g.gain.setValueAtTime(v, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur); lp.connect(g); g.connect(out);
    for (const f of fs) for (const d of [-.006, .006]) { const o = KI.osc(c, 'sawtooth', f * (1 + d), t, dur); o.connect(lp); } },
  // Chor „oh“: Sägezahn mit Vibrato durch drei Formanten
  choir(c, out, t, fs, dur, v = .05) { const sum = c.createGain(); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 3); g.gain.setValueAtTime(v, t + dur - 3); g.gain.linearRampToValueAtTime(0, t + dur); g.connect(out);
    for (const [ff, q, a] of [[520, 8, 1], [900, 9, .6], [2500, 12, .18]]) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q; const bg = c.createGain(); bg.gain.value = a; sum.connect(bp); bp.connect(bg); bg.connect(g); }
    for (const f of fs) for (const d of [-.004, 0, .005]) { const o = KI.osc(c, 'sawtooth', f * (1 + d), t, dur), lf = KI.osc(c, 'sine', 4.6 + Math.random() * .8, t, dur), lg = c.createGain(); lg.gain.value = f * .006; lf.connect(lg); lg.connect(o.frequency); o.connect(sum); } },
  // gestrichene Saite (Cello/Bratsche): langsamer Bogen, Vibrato, Tiefpass
  bow(c, out, t, f, dur, v = .06, cut = 1100) { const o = KI.osc(c, 'sawtooth', f, t, dur), lf = KI.osc(c, 'sine', 5.2, t, dur), lg = c.createGain(); lg.gain.value = f * .005; lf.connect(lg); lg.connect(o.frequency);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(2.2, dur * .4)); g.gain.setValueAtTime(v, t + dur * .75); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(lp); lp.connect(g); g.connect(out); },
  // Flöte, gehaucht
  flute(c, out, t, f, dur, v = .05) { const o = KI.osc(c, 'sine', f, t, dur), lf = KI.osc(c, 'sine', 5, t, dur), lg = c.createGain(); lg.gain.value = f * .004; lf.connect(lg); lg.connect(o.frequency);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .25); g.gain.setValueAtTime(v * .85, t + dur - .3); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g); g.connect(out);
    const n = c.createBufferSource(); n.buffer = KI.noise(c); n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6; const ng = c.createGain(); ng.gain.value = .25; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t); n.stop(t + dur + .05); },
  // Glasharmonika: zwei fast gleiche Sinus, Schwebung
  glass(c, out, t, f, dur, v = .05) { for (const d of [0, .0035]) { const o = KI.osc(c, 'sine', f * (1 + d), t, dur), g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .5); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(out); } },
  // Cembalo-artig gezupft
  pluck(c, out, t, f, v = .08, d = 1.6) { const o = KI.osc(c, 'sawtooth', f, t, d), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 9, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + d * .6); const g = KI.env(c, t, .003, v, d); o.connect(lp); lp.connect(g); g.connect(out); },
  knock(c, out, t, v = .2) { const n = c.createBufferSource(); n.buffer = KI.noise(c); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; const g = KI.env(c, t, .002, v, .12); n.connect(lp); lp.connect(g); g.connect(out); n.start(t); n.stop(t + .2);
    const o = KI.osc(c, 'sine', 95, t, .15), og = KI.env(c, t, .002, v * .8, .12); o.connect(og); og.connect(out); },
  drone(c, out, t, fs, dur, v = .05) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 6); g.gain.setValueAtTime(v, t + dur - 6); g.gain.linearRampToValueAtTime(0, t + dur); lp.connect(g); g.connect(out);
    for (const f of fs) for (const d of [0, .003]) { const o = KI.osc(c, 'triangle', f * (1 + d), t, dur); o.connect(lp); } },
  wind(c, out, t, dur, v = .03) { const n = c.createBufferSource(); n.buffer = KI.noise(c); n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(300, t);
    for (let k = 0; k < dur; k += 4) bp.frequency.linearRampToValueAtTime(250 + Math.random() * 500, t + k); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .3); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + dur); },
  noise(c) { if (c._nz) return c._nz; const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return c._nz = b; },
};
const KL_MOTIV = ['E5', 'D5', 'C5', 'B4', 'C5']; // Lucys Spieluhr
// ---------------------------------------------------------------- Die Stücke: [Name, Länge s, Stufe, Ort, Lautstärke, Bau]
const KL_PIECES = [
  ['menue', 76, null, null, .9, (c, o, w) => { KI.drone(c, o, 0, [KN('A1'), KN('E2')], 76, .05); KI.wind(c, o, 0, 76, .025);
    [['A2', 'C3', 'E3'], ['F2', 'A2', 'C3'], ['D2', 'F2', 'A2'], ['E2', 'G#2', 'B2'], ['A2', 'C3', 'E3']].forEach((ch, i) => KI.pad(c, o, i * 13, ch.map(KN), 15, .03, 700));
    KI.bell(c, o, .5, KN('A2'), .12, 9); KI.bell(c, o, 39, KN('E2'), .1, 9);
    let t = 3; for (let rep = 0; rep < 3; rep++) { const det = 1 - rep * .012; KL_MOTIV.forEach((n, i) => { KI.box(c, o, t, KN(n) * det, .1 - rep * .02); t += .62 + i * .06 + rep * .08; }); t += 4.5 + rep; }
    KI.choir(c, o, 26, [KN('A3'), KN('C4'), KN('E4')], 22, .03); KI.choir(c, o, 50, [KN('F3'), KN('A3'), KN('D4')], 20, .026);
    [['A4', 60], ['G4', 62.2], ['E4', 64.6], ['A3', 68]].forEach(([n, tt]) => KI.piano(c, o, tt, KN(n), .16, 6)); }],
  ['ort', 64, 'calm', 'ort', .85, (c, o) => { KI.pad(c, o, 0, [KN('A2'), KN('E3')], 30, .018, 500); KI.pad(c, o, 30, [KN('F2'), KN('C3')], 32, .016, 480);
    [['A3', 1], ['E4', 5], ['C4', 9.5], ['B3', 14], ['A3', 20], ['E4', 26], ['D4', 29.5], ['C4', 33], ['B3', 36.5], ['C4', 40], ['G3', 48], ['A3', 53]].forEach(([n, t]) => KI.piano(c, o, t, KN(n), .14, 6)); }],
  ['unruhe', 44, 'uneasy', null, .8, (c, o) => { KI.bow(c, o, 0, KN('A1'), 40, .05, 700); KI.bow(c, o, 6, KN('Bb1'), 30, .035, 600); KI.bow(c, o, 14, KN('E5') * 2, 20, .006, 5000);
    KI.piano(c, o, 21, KN('A1'), .22, 8); KI.piano(c, o, 21.02, KN('Bb1'), .16, 8); KI.glass(c, o, 30, KN('F6'), 9, .012); }],
  ['friedhof', 62, 'calm', 'friedhof', .85, (c, o) => { [['D3', 'F3', 'A3'], ['Bb2', 'D3', 'F3'], ['G2', 'Bb2', 'D3'], ['A2', 'C#3', 'E3']].forEach((ch, i) => KI.choir(c, o, i * 14, ch.map(KN), 17, .03));
    for (let t = 1; t < 60; t += 13) KI.bell(c, o, t, KN('D3'), .09, 10); KI.flute(c, o, 30, KN('A4'), 3, .018); KI.flute(c, o, 33.5, KN('F4'), 4, .016); }],
  ['wald', 66, 'calm', 'wald', .85, (c, o) => { KI.drone(c, o, 0, [KN('D2'), KN('A2')], 66, .045); KI.wind(c, o, 0, 66, .03);
    for (let t = 4; t < 62; t += 5 + Math.random() * 6) KI.knock(c, o, t, .06 + Math.random() * .05);
    [['D5', 12, 1.6], ['F5', 13.8, 1.2], ['E5', 15.2, 2.4], ['C5', 18, 3], ['D5', 34, 2], ['A4', 36.2, 1.6], ['C5', 38, 1.4], ['D5', 39.6, 4]].forEach(([n, t, d]) => KI.flute(c, o, t, KN(n), d, .026));
    KI.bow(c, o, 44, KN('D3'), 18, .02, 900); }],
  ['amt', 54, 'uneasy', 'amt', .8, (c, o) => { for (let t = 0; t < 52; t += 1.8) { const s = KI.osc(c, 'sine', 44, t, .6), g = KI.env(c, t, .01, .12, .5); s.connect(g); g.connect(o); }
    KI.bell(c, o, 2, KN('C#2'), .1, 12); KI.bell(c, o, 24, KN('G2'), .08, 12); KI.glass(c, o, 10, KN('C#6'), 12, .008); KI.glass(c, o, 11, KN('D6'), 10, .007); KI.drone(c, o, 0, [KN('C#1') * 2], 54, .04); }],
  ['kanal', 60, 'calm', 'kanal', .85, (c, o) => { KI.drone(c, o, 0, [KN('A1'), KN('E2')], 60, .03);
    [['A5', 4], ['C6', 6.5], ['D6', 9], ['E6', 11.5], ['C6', 15], ['A5', 19], ['G5', 23], ['E5', 27], ['G5', 32], ['A5', 36], ['D6', 42], ['C6', 46], ['A5', 50]].forEach(([n, t]) => KI.glass(c, o, t, KN(n), 5, .02)); }],
  ['villa', 50, 'calm', 'villa', .8, (c, o) => { const beat = 60 / 64; let t = 1; const mel = ['E5', 'D5', 'C5', 'B4', 'C5', null, 'E5', 'A4', null, 'D5', 'C5', 'B4', 'A4', 'G#4', 'A4', null];
    for (let bar = 0; bar < 16; bar++) { const bass = ['A2', 'E2', 'D2', 'E2'][bar % 4]; KI.pluck(c, o, t, KN(bass), .07, 1.8); KI.pluck(c, o, t + beat, KN(bass) * 1.5, .035, .9); KI.pluck(c, o, t + beat * 2, KN(bass) * 2, .03, .9);
      const n = mel[bar]; if (n) KI.pluck(c, o, t + beat * .02, KN(n) * (bar > 11 ? .985 : 1), .06, 2.2); t += beat * 3; }
    KL_MOTIV.forEach((n, i) => KI.box(c, o, t + .5 + i * .7, KN(n) * .97, .05)); }],
  ['weiss', 54, 'calm', 'weiss', .8, (c, o) => { KI.pad(c, o, 0, [KN('A4'), KN('E5'), KN('B5')], 54, .014, 3000); KI.choir(c, o, 8, [KN('E5'), KN('A5')], 30, .015);
    KL_MOTIV.forEach((n, i) => KI.glass(c, o, 20 + i * 2.2, KN(n), 4, .02)); }],
  ['traum', 64, null, null, .9, (c, o) => { KI.pad(c, o, 0, [KN('A3'), KN('E4'), KN('C5')], 64, .02, 2400); KI.wind(c, o, 0, 64, .02); KI.drone(c, o, 0, [KN('A1')], 64, .04);
    let t = 6; for (let rep = 0; rep < 2; rep++) { KL_MOTIV.forEach((n, i) => { KI.box(c, o, t, KN(n) * (1 - rep * .02), .07); t += .9 + i * .1; }); t += 9; }
    KI.choir(c, o, 22, [KN('A3'), KN('E4')], 26, .02); KI.bell(c, o, 50, KN('A2'), .1, 10); }]];
async function klang_render(name) {
  const P = KL_PIECES.find(p => p[0] === name); if (!P || klang_S.tracks[name]) return klang_S.tracks[name]; const sr = 32000, c = new OfflineAudioContext(2, Math.ceil(sr * (P[1] + 5)), sr);
  const o = KI.chain(c, name === 'amt' ? .35 : .5, name === 'kanal' || name === 'weiss' ? 7 : 5.5); P[5](c, o); const b = await c.startRendering(); klang_S.tracks[name] = b; return b;
}
// Nacheinander im Hintergrund rendern (Menü und Traum zuerst), dann in die Musikauswahl einreihen
async function klang_renderAll() {
  const S = klang_S; if (S.rendering) return; S.rendering = true;
  for (const P of [KL_PIECES[0], KL_PIECES.find(p => p[0] === 'traum'), ...KL_PIECES.filter(p => p[0] !== 'menue' && p[0] !== 'traum')]) {
    try { const b = await klang_render(P[0]); if (P[2]) S.pending.push([P[2], { b, gain: P[4] * .8, name: P[0], area: P[3] }]); } catch (e) { console.warn('Klang: ' + P[0], e); }
    await new Promise(r => setTimeout(r, 400)); }
}
// ---------------------------------------------------------------- Wo bin ich? (Musik- und Klangorte)
function klang_area() {
  const P = player.pos;
  if (state.zone === 'canal') return 'kanal'; if (ch3.on && ch3.part === 'white') return 'weiss';
  if (state.inBasement || P.x > 250) return 'amt'; if (P.x < -800) return 'villa';
  if (P.x < -104 && P.x > -146 && P.z > 46 && P.z < 92) return 'villa';
  if (P.z > 97 && P.x > -44 && P.x < 114) return 'wald';
  if (Math.hypot(P.x + 48, P.z - 80) < 24) return 'friedhof';
  return 'ort';
}
// Untergrund unter den Füßen (für die Schritte)
function klang_surface(indoor) {
  const P = player.pos; if (state.zone === 'canal') return 'water'; if (state.inBasement || P.x > 250) return 'hard';
  if (indoor) return 'wood'; if (P.y > 1.2) return 'wood'; // Baumhaus, Treppen
  if (P.z > 97 && P.x > -44 && P.x < 114) return 'leaves';
  if (P.x < -104 && P.x > -146 && P.z > 46 && P.z < 92) return 'gravel';
  return isWalk(P.x, P.z) ? 'wet' : null; // null: wie bisher (Gras)
}
// ---------------------------------------------------------------- Tiere und Umgebung (synthetisch, wo keine Aufnahme da ist)
Object.assign(Audio, {
  owlPair(x, z) { if (!this.ctx) return; const d = this.at(x, 9, z, 12), t0 = this.ctx.currentTime; // Waldkauz: Männchen „huu … hu-hu-huuu“, das Weibchen antwortet „ke-wick“
    const hoot = (t, f, dur) => { const o = this.osc('sine', f, t, dur), g = this.ctx.createGain(), tt = t0 + t; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(.22, tt + .08); g.gain.setValueAtTime(.22, tt + dur - .15); g.gain.linearRampToValueAtTime(0, tt + dur); o.frequency.setValueAtTime(f, tt); o.frequency.linearRampToValueAtTime(f * .93, tt + dur); this.lfo(7, 5, o.frequency); o.connect(g); g.connect(d); };
    hoot(0, 440, .75); hoot(3.1, 420, .2); hoot(3.35, 420, .2); hoot(3.65, 440, 1.3);
    if (Math.random() < .6) { const d2 = this.at(x + rand(-30, 30), 7, z + rand(-30, 30), 10), t = t0 + 6; const o = this.osc('sawtooth', 1500, 6, .35), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1900; bp.Q.value = 3; o.frequency.setValueAtTime(1300, t); o.frequency.linearRampToValueAtTime(2100, t + .12); o.frequency.linearRampToValueAtTime(1500, t + .3); o.connect(bp); this.env(bp, .07, .01, .28, 6, d2); } },
  fox(x, z) { if (!this.ctx) return; const d = this.at(x, .6, z, 8), t = this.ctx.currentTime; // Fuchsschrei: heiser, fast menschlich
    const o = this.osc('sawtooth', 700, 0, .9); o.frequency.setValueAtTime(620, t); o.frequency.linearRampToValueAtTime(1050, t + .18); o.frequency.linearRampToValueAtTime(560, t + .8); this.lfo(38, 30, o.frequency);
    const bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 1.2; o.connect(bp); this.env(bp, .16, .03, .8, 0, d);
    const n = this.noise(false), hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500; n.connect(hp); this.env(hp, .05, .02, .7, 0, d); n.stop(t + 1); },
  deerBark(x, z) { if (!this.ctx) return; const d = this.at(x, 1, z, 8), t = this.ctx.currentTime; for (let k = 0; k < 2; k++) { const n = this.noise(false), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 2; n.connect(bp); this.env(bp, .35, .01, .22, k * .9, d); n.stop(t + 2);
      const o = this.osc('sawtooth', 190, k * .9, .25), lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); this.env(lp, .08, .01, .2, k * .9, d); } },
  twig(x, z) { if (!this.ctx) return; const d = this.at(x, .2, z, 3), n = this.noise(false), hp = this.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800; n.connect(hp); this.env(hp, .5, .001, .03, 0, d); if (Math.random() < .6) this.env(hp, .3, .001, .02, .06, d); n.stop(this.ctx.currentTime + .3); },
  gutter(x, z) { if (!this.ctx) return; for (let k = 0; k < 6 + Math.random() * 6; k++) setTimeout(() => this.drip(x + rand(-.2, .2), rand(1.5, 3.5), z + rand(-.2, .2)), k * rand(260, 700)); },
  pickup(key) { if (!this.ctx) return; if (/schluessel|key|kreide|murmel/.test(key)) this.play(this.pick('keys1', 'keys2', 'keys3'), { gain: .25, rate: rand(1.1, 1.3) }); else this.play(this.pick('items1', 'items2'), { gain: .3, vary: .06 }); },
  doorSound(open, x, z) { if (!this.ctx) return; const o = { x, y: 1.2, z, ref: 3 };
    if (open) { this.play('woodMisc1', { gain: .35, rate: 1.2, ...o }); this.play('doorCreak', { gain: .28, rate: rand(.85, 1.05), offset: rand(0, .4), dur: rand(1.1, 1.7), delay: .08, ...o }); }
    else { this.play('doorCreak', { gain: .18, rate: rand(1.1, 1.3), dur: .5, ...o }); this.play(this.pick('woodClose1', 'woodClose2'), { gain: .5, delay: .38, ...o }); } },
});
// Schritte: nasser Asphalt, Laub, Kies, Wasser – zusätzlich zu Holz, Beton und Gras
{ const base = Audio.step.bind(Audio); Audio.step = function (s) { if (!this.ctx) return;
    if (s === 'wet') { this.play(this.pick('stepWet1', 'stepWet2', 'stepWet3'), { gain: .34, vary: .07, varyGain: .25 }); if (Math.random() < .12) this.play('waterLoop', { gain: .06, offset: rand(0, 3), dur: .25, rate: 1.3, hp: 600 }); return; }
    if (s === 'water') { this.play(this.pick('stepWet1', 'stepWet2', 'stepWet3'), { gain: .42, vary: .1, rate: .85 }); this.play('waterLoop', { gain: .14, offset: rand(0, 4), dur: .35, rate: rand(.9, 1.2) }); return; }
    if (s === 'leaves') { this.play(this.pick('stepG1', 'stepG2', 'stepG3'), { gain: .32, vary: .12, varyGain: .3 }); const n = this.noise(false), bp = this.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2500, 4200); bp.Q.value = .8; n.connect(bp); this.env(bp, .05, .01, .16); n.stop(this.ctx.currentTime + .3);
      if (Math.random() < .05) this.twig(player.pos.x + rand(-.4, .4), player.pos.z + rand(-.4, .4)); return; }
    if (s === 'gravel') { this.play(this.pick('stepC1', 'stepC3', 'stepC5'), { gain: .3, vary: .1, rate: .9 }); this.play('stones1', { gain: .08, offset: rand(0, 1.2), dur: .18, rate: rand(1.3, 1.6), hp: 1200 }); return; }
    return base(s); }; }
// ---------------------------------------------------------------- Umgebung je Ort
function klang_ambient() {
  const P = player.pos, A = klang_S.area, a = rand(0, 6.28), far = (d0, d1) => { const d = rand(d0, d1); return [P.x + Math.cos(a) * d, P.z + Math.sin(a) * d]; }, r = Math.random();
  if (A === 'amt' || A === 'kanal') { if (r < .5) { const [x, z] = far(4, 14); Audio.drip(x, rand(1, 2.5), z); } else if (r < .7) { const [x, z] = far(10, 25); Audio.play('metalHit1', { gain: .08, rate: rand(.5, .7), x, y: 1, z, ref: 6 }); } return; }
  if (A === 'weiss') return;
  if (A === 'wald') { if (r < .22) Audio.owlPair(...far(18, 40)); else if (r < .34) Audio.fox(...far(20, 45)); else if (r < .56) { const [x, z] = far(6, 16); Audio.twig(x, z); if (Math.random() < .5) setTimeout(() => Audio.twig(x + .5, z + .3), rand(300, 900)); }
    else if (r < .7) Audio.caw(...(([x, z]) => [x, rand(5, 9), z])(far(15, 35))); else if (r < .82) Audio.treeCreak(...far(8, 20)); else if (r < .9) Audio.deerBark(...far(25, 50)); else Audio.flap(...(([x, z]) => [x, 4, z])(far(6, 12))); return; }
  if (A === 'friedhof') { if (r < .35) Audio.caw(...(([x, z]) => [x, 7, z])(far(10, 30))); else if (r < .6) Audio.owlPair(...far(25, 50)); else if (r < .75) Audio.gust(rand(3, 5)); return; }
  if (A === 'villa') { if (r < .25) Audio.owlPair(...far(20, 45)); else if (r < .4) { Audio.play('woodSqueak1', { gain: .12, rate: .7, x: -125, y: 6, z: 70, ref: 6 }); } else if (r < .55) Audio.caw(-125 + rand(-8, 8), 14, 70 + rand(-8, 8)); return; }
  // Ort: Dachrinnen, ferne Hunde, Waldkauz, Krähen, Totholz, selten ein Zug in der Ferne
  if (r < .22) { const [x, z] = far(4, 12); Audio.gutter(x, z); } else if (r < .38) Audio.owlPair(...far(40, 80)); else if (r < .52) Audio.bark(...far(60, 110), Math.random() < .3);
  else if (r < .64) Audio.caw(...(([x, z]) => [x, 8, z])(far(20, 50))); else if (r < .76) Audio.treeCreak(...far(10, 30)); else if (r < .82) Audio.fox(...far(50, 90)); else if (r < .85) Audio.trainHorn();
}
// ---------------------------------------------------------------- Menümusik
function klang_menu(on) {
  const S = klang_S, A = Audio; if (!A.ctx || A.ctx.state !== 'running') return;
  if (on && !S.menu && S.tracks.menue) { const g = A.ctx.createGain(); g.gain.value = 0; g.connect(A.master); const src = A.ctx.createBufferSource(); src.buffer = S.tracks.menue; src.loop = true; src.connect(g); src.start();
    g.gain.linearRampToValueAtTime(.8 * (settings.music ?? 1), A.ctx.currentTime + 3); S.menu = src; S.menuG = g; }
  else if (!on && S.menu) { const t = A.ctx.currentTime, g = S.menuG, s = S.menu; g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 2.5); try { s.stop(t + 2.6); } catch (e) {} S.menu = null; }
}
function klang_dream(on) { // Traummusik (Intro)
  const S = klang_S, A = Audio; if (!A.ctx) return;
  if (on && !S.dream && S.tracks.traum) { const g = A.ctx.createGain(); g.gain.value = 0; g.connect(A.master); const src = A.ctx.createBufferSource(); src.buffer = S.tracks.traum; src.connect(g); src.start(); g.gain.linearRampToValueAtTime(.85, A.ctx.currentTime + 2); S.dream = src; S.dreamG = g; }
  else if (!on && S.dream) { const t = A.ctx.currentTime; S.dreamG.gain.cancelScheduledValues(t); S.dreamG.gain.setValueAtTime(S.dreamG.gain.value, t); S.dreamG.gain.linearRampToValueAtTime(0, t + 1.5); try { S.dream.stop(t + 1.6); } catch (e) {} S.dream = null; }
}
// Türen: Grundspiel ruft Audio.doorSound (Öffnen/Schließen verschieden)
// Gegenstände: Aufheben klingt
addItem = (orig => key => { const had = story.items.includes(key); orig(key); if (!had) Audio.pickup(key); })(addItem);
WORLD_MODS.push(['Klang', async () => { window.klang_ambient = klang_ambient; }]);
WORLD_TICK.push(dt => {
  const S = klang_S; if (!Audio.ctx) return;
  if (!S.rendering && Audio.ctx.state === 'running') klang_renderAll();
  if (S.pending.length && Audio.mus) for (const [lv, tr] of S.pending.splice(0)) Audio.mus.tracks[lv].push(tr); // fertige Stücke in die Musikauswahl
  const menuOn = !state.started && $('start').classList.contains('show') && !S.intro; klang_menu(menuOn);
  if (!state.started) return;
  S.areaT -= dt; if (S.areaT < 0) { S.areaT = 1; const a = klang_area(); if (a !== S.area) { S.area = a; S.areaSince = 0; } S.areaSince = (S.areaSince || 0) + 1;
    const M = Audio.mus; if (M && M.cur && M.cur.area && M.cur.area !== S.area && S.areaSince > 4) { M.cur.stop(6); M.cur = null; M.rest = 3; } } // Ort gewechselt: langsam über
  S.ambT -= dt; if (S.ambT < 0) { S.ambT = rand(8, 20); if (!state.talking && !ui.overlay) try { klang_ambient(); } catch (e) {} }
});
window.__klang = { S: klang_S, area: () => klang_area(), surface: i => klang_surface(i), render: n => klang_render(n) }; // Testzugriff
