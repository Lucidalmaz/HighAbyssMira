// =====================================================================  KLANG (Modul „klang“): Musik je Ort, Tierstimmen der Jahreszeit, Schritte je Untergrund, Türen, Gegenstände
// Musik: eigens komponierte Stücke, beim Start einmalig im Hintergrund zu Audiospuren gerendert (OfflineAudioContext – kostet zur Laufzeit nichts).
// Leitmotiv ist Lucys Spieluhr (E – D – C – H – C). Jedes Stück hat seinen Ort; beim Ortswechsel blendet die Musik langsam über.
// Regel: nie überladen. Musik ist leise und hat Luft; dazwischen trägt die Umgebung (Regen, Wind, Tiere) – und oft einfach Stille.
// Novembernacht, Regen: keine Grillen, keine Frösche – dafür Waldkauz, Fuchs, Rehe, ferne Hunde, tropfende Dachrinnen, knackendes Totholz.
// Jeder Ort hat seine Klangidentität (Haus: Holz, Rohre, Strom, Fenster · Keller: Wasser, Rohre, Metall, Beton-Hall · Wald: Wind, Laub, Äste, Tiere).
// Alle Umgebungsereignisse fragen vorher die Regie (Modul spannung): Budget je Minute, Abstand je Familie, Stille nach Schrecken.
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
    KI.choir(c, o, 22, [KN('A3'), KN('E4')], 26, .02); KI.bell(c, o, 50, KN('A2'), .1, 10); }],
  // Lauern (Keller Nr. 7): tiefer Grund, einzelne tropfende Zupftöne, eine ferne Glocke – und drei Töne der Spieluhr, die abbrechen
  ['lauern', 52, 'uneasy', 'keller', .8, (c, o) => { KI.drone(c, o, 0, [KN('D1') * 2, KN('Eb2')], 52, .05); KI.bow(c, o, 4, KN('D2'), 40, .025, 500);
    for (let t = 6; t < 46; t += 5 + Math.random() * 5) KI.pluck(c, o, t, KN(['D5', 'Eb5', 'A4'][Math.floor(Math.random() * 3)]), .02, 2.4);
    KI.bell(c, o, 14, KN('Eb3'), .06, 10); KI.glass(c, o, 26, KN('D6'), 12, .008); KL_MOTIV.slice(0, 3).forEach((n, i) => KI.box(c, o, 38 + i * 1.3, KN(n) * .94, .035)); }],
  // Gefahr (Schleife, jeder Ort): Herzschlag-Puls aus Pauke und Subbass, zwei reibende Celli (A/B), die sich nach oben schieben, Col-legno-Klopfen, hohes Glas
  ['gefahr', 48, 'danger', null, .85, (c, o) => { const beat = .8;
    for (let k = 0; k * beat < 47.5; k++) { const t = k * beat; KI.knock(c, o, t, k % 2 ? .09 : .17); if (k % 2 === 0) { const s = KI.osc(c, 'sine', 52, t, .7), g = KI.env(c, t, .005, .24, .55); s.frequency.setValueAtTime(52, t); s.frequency.exponentialRampToValueAtTime(37, t + .4); s.connect(g); g.connect(o); } }
    KI.bow(c, o, 0, KN('A1'), 48, .05, 600); KI.bow(c, o, 0, KN('Bb1'), 48, .04, 600); KI.bow(c, o, 8, KN('E2'), 40, .03, 900); KI.bow(c, o, 18, KN('F2'), 30, .025, 1100);
    for (let t = 3; t < 44; t += 2.4 + Math.random() * 1.6) KI.pluck(c, o, t, KN(['A3', 'Bb3', 'E4'][Math.floor(Math.random() * 3)]), .03, .5);
    KI.glass(c, o, 20, KN('Bb5'), 14, .01); KI.glass(c, o, 22, KN('A5'), 14, .01); KI.bow(c, o, 30, KN('A4'), 16, .012, 4000); }]];
async function klang_render(name) {
  const P = KL_PIECES.find(p => p[0] === name); if (!P || klang_S.tracks[name]) return klang_S.tracks[name]; const sr = 32000, c = new OfflineAudioContext(2, Math.ceil(sr * (P[1] + (P[2] === 'danger' ? 0 : 5))), sr); // Gefahr läuft als Schleife: ohne Ausklang
  const o = KI.chain(c, name === 'amt' ? .35 : .5, name === 'kanal' || name === 'weiss' ? 7 : 5.5); P[5](c, o); const b = await c.startRendering(); klang_level(b); klang_S.tracks[name] = b; return b;
}
// Lautheit angleichen: jedes Stück auf dieselbe mittlere Lautstärke (RMS 0,042), Spitzen nie über 0,7 – kein Ort zu leise, keiner zu laut
function klang_level(b) {
  let sq = 0, pk = 0, n = 0; for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i += 4) { const v = d[i]; sq += v * v; n++; const a = v < 0 ? -v : v; if (a > pk) pk = a; } }
  const rms = Math.sqrt(sq / Math.max(1, n)); if (rms < 1e-5) return; const k = Math.min(.042 / rms, .7 / Math.max(pk, 1e-4), 4);
  for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= k; }
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
  if (state.inBasement || P.x > 250) return Math.hypot(P.x - B.x, P.z - B.z) < 60 ? 'keller' : 'amt'; if (P.x < -800) return 'villa';
  if (P.x < -104 && P.x > -146 && P.z > 46 && P.z < 92) return 'villa';
  if (P.z > 97 && P.x > -44 && P.x < 114) return 'wald';
  if (Math.hypot(P.x + 48, P.z - 80) < 24) return 'friedhof';
  return 'ort';
}
// Hall des Ortes (Audio.setRoom): Wohnräume klein, Keller/Amt Beton, Villa/Kanal Halle, draußen kurz – an den Fraßstellen gar keiner
function klang_reverb() {
  const P = player.pos; if (typeof spannung_silent === 'function' && spannung_silent()) return 'dead';
  if (state.zone === 'canal' || P.x < -800) return 'hall'; if (state.inBasement || P.x > 250) return 'concrete';
  if (ch3.on && ch3.part === 'white') return 'hall'; return isIndoor() ? 'small' : 'out';
}
// ---------------------------------------------------------------- Böden (Schritte des Spielers und aller anderen: Audio.stepAt fragt hier nach)
// [x0, x1, z0, z1, Belag] – erster Treffer zählt (Teppich vor dem Raum)
const KL_FLOORS = [[20.9, 24.1, -16.1, -13.9, 'carpet'], // Nr. 7: Teppich vor dem Sofa
  [20, 26, -17, -12, 'wood'], [26, 32, -17, -12, 'tile'], [20, 26, -22, -17, 'carpet'], [26, 32, -22, -17, 'tile'], // Nr. 7: Wohnzimmer (Dielen), Küche, Schlafzimmer, Hauswirtschaftsraum
  [-56, -50, -17, -12, 'tile'], [-50, -44, -17, -12, 'wood'], [-56, -50, -22, -17, 'wood'], [-50, -44, -22, -17, 'carpet'], // Nr. 1: Küche, Wohnzimmer, Kinderzimmer (lose Diele), Eltern
  [106, 118, 25, 31, 'tile'], [97, 128, 4, 31, 'hard'], // Kiosk (Fliesen), Tankstelle (Betonplatten)
  [43.6, 48.8, 247.6, 252.6, 'wood']]; // Steg am Weiher
// Amt (Kapitel 2) je Raum ab C2.x: Tunnel nass, Archiv Linoleum, Sicherungsraum/Spinnenraum Beton, langer Gang Linoleum, Messraum Beton mit Gitterrost am Tank
const KL_AMT = [[0, 18, 'wet'], [18, 30, 'tile'], [30, 46, 'hard'], [46, 106, 'tile'], [106, 122, 'hard']];
function klang_floor(x, z) {
  if (x > 250) { if (Math.hypot(x - B.x, z - B.z) < 60) return 'hard'; const d = x - C2.x; if (Math.hypot(x - C2.x - 118, z - C2.z - 6) < 2.4) return 'metal';
    for (const A of KL_AMT) if (d >= A[0] && d < A[1]) return A[2]; return 'hard'; }
  for (const F of KL_FLOORS) if (x > F[0] && x < F[1] && z > F[2] && z < F[3]) return F[4];
  if (x < -800) return 'wood'; // Villa Seiler, Halle
  if (typeof WALD !== 'undefined' && Math.abs(x - WALD.hut.x) < 1.8 && Math.abs(z - WALD.hut.z) < 2) return 'wood'; // Zayns Hütte
  if (z > 97 && x > -44 && x < 114) return 'leaves';
  if (x < -104 && x > -146 && z > 46 && z < 92) return 'gravel';
  return isWalk(x, z) ? 'wet' : 'grass';
}
// Untergrund unter den Füßen des Spielers
function klang_surface(indoor) {
  const P = player.pos; if (state.zone === 'canal') return 'water';
  if (P.y > 1.2 && !state.inBasement && typeof WALD !== 'undefined' && (Math.hypot(P.x - WALD.tree.x, P.z - WALD.tree.z) < 3 || (typeof TIEF !== 'undefined' && Math.hypot(P.x - TIEF.stand.x, P.z - TIEF.stand.z) < 3))) return 'wood'; // Baumhaus, Hochsitz
  const f = state.inBasement && P.x < 250 ? 'hard' : klang_floor(P.x, P.z);
  if (indoor && !state.inBasement && (f === 'wet' || f === 'grass' || f === 'leaves' || f === 'gravel')) return 'wood'; // andere Innenräume (Treppen …)
  return f;
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
// Schritte je Belag: Holzdielen, Teppich, Fliesen, Beton, Gitterrost, nasser Asphalt, Wasser, Laub, Kies, Gras.
// Ohne x/z: der Spieler selbst; mit x/z: jemand anderes an dieser Stelle (Audio.stepAt – Schritte hinter dir klingen auf dem richtigen Boden).
function klang_step(s, v = 1, x, z) {
  const A = Audio; if (!A.ctx) return; const at = x !== undefined, P = at ? { x, y: .05, z, ref: 2 } : {}, pk = (...n) => A.pick(...n);
  if (s === 'wood') { A.play(pk('stepW1', 'stepW2', 'stepW3', 'stepW4'), { gain: .45 * v, vary: .08, varyGain: .25, ...P }); if (Math.random() < .1) A.play(pk('woodSqueak1', 'woodSqueak2'), { gain: .18 * v, vary: .1, delay: .05, ...P }); }
  else if (s === 'carpet') A.play(pk('stepW1', 'stepW2', 'stepW3', 'stepW4'), { gain: .22 * v, rate: .85, lp: 650, vary: .06, varyGain: .2, ...P }); // gedämpft
  else if (s === 'tile') A.play(pk('stepC1', 'stepC2', 'stepC4', 'stepC6'), { gain: .3 * v, rate: 1.12, hp: 220, vary: .06, varyGain: .2, ...P }); // hart, hell
  else if (s === 'metal') { A.play(pk('stepC2', 'stepC5'), { gain: .28 * v, vary: .06, ...P }); A.play(pk('metalHit1', 'metalHit2'), { gain: .05 * v, rate: rand(1.7, 2.2), dur: .3, hp: 900, ...P }); }
  else if (s === 'wet') { A.play(pk('stepWet1', 'stepWet2', 'stepWet3'), { gain: .34 * v, vary: .07, varyGain: .25, ...P }); if (Math.random() < .12) A.play('waterLoop', { gain: .06 * v, offset: rand(0, 3), dur: .25, rate: 1.3, hp: 600, ...P }); }
  else if (s === 'water') { A.play(pk('stepWet1', 'stepWet2', 'stepWet3'), { gain: .42 * v, vary: .1, rate: .85, ...P }); A.play('waterLoop', { gain: .14 * v, offset: rand(0, 4), dur: .35, rate: rand(.9, 1.2), ...P }); }
  else if (s === 'leaves') { A.play(pk('stepG1', 'stepG2', 'stepG3'), { gain: .32 * v, vary: .12, varyGain: .3, ...P }); const d = at ? A.at(x, .05, z, 2) : A.world;
    if (!at || !A.cut) { const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2500, 4200); bp.Q.value = .8; n.connect(bp); A.env(bp, .05 * v, .01, .16, 0, d); n.stop(A.ctx.currentTime + .3); }
    if (!at && Math.random() < .05) A.twig(player.pos.x + rand(-.4, .4), player.pos.z + rand(-.4, .4)); }
  else if (s === 'gravel') { A.play(pk('stepC1', 'stepC3', 'stepC5'), { gain: .3 * v, vary: .1, rate: .9, ...P }); A.play('stones1', { gain: .08 * v, offset: rand(0, 1.2), dur: .18, rate: rand(1.3, 1.6), hp: 1200, ...P }); }
  else if (s === 'grass') A.play(pk('stepG1', 'stepG2', 'stepG3'), { gain: .32 * v, vary: .1, varyGain: .3, lp: 5000, ...P });
  else A.play(pk('stepC1', 'stepC2', 'stepC3', 'stepC4', 'stepC5', 'stepC6'), { gain: .38 * v, vary: .08, varyGain: .25, ...P }); // Beton
}
Audio.step = function (s) { if (this.ctx) klang_step(s || 'grass', 1); };
Audio.stepSound = klang_step; Audio.surfaceAt = (x, z) => klang_floor(x, z); Audio.roomHint = () => klang_reverb();
// ---------------------------------------------------------------- Umgebung je Ort
// Auswahl nach Gewicht, aber nur unter den Familien, die die Regie gerade zulässt: [Gewicht, Familie, Funktion]
function klang_roll(list) {
  const can = typeof spannung_can === 'function', ok = can ? list.filter(e => spannung_can(e[1], 'amb')) : list; if (!ok.length) return false;
  let r = Math.random() * ok.reduce((s, e) => s + e[0], 0); for (const e of ok) { r -= e[0]; if (r <= 0) { if (e[2]() !== false && can) spannung_did(e[1], 'amb'); return true; } } return false;
}
function klang_ambient() {
  const P = player.pos, A = klang_S.area, a = rand(0, 6.28), far = (d0, d1) => { const d = rand(d0, d1); return [P.x + Math.cos(a) * d, P.z + Math.sin(a) * d]; }, W = Audio;
  const R = !state.inBasement && typeof indoorRect === 'function' ? indoorRect() : null; if (R) return klang_inside(R, far);
  if (A === 'keller') return klang_roll([ // Keller Nr. 7: Wasser, Rohre, Metall, Beton – und manchmal das Haus darüber
    [4, 'drip', () => { const [x, z] = far(3, 9); for (let i = 0, n = 2 + Math.floor(rand(0, 4)); i < n; i++) setTimeout(() => W.drip(x + rand(-.1, .1), rand(1.6, 2.4), z), i * rand(500, 1100)); }],
    [2, 'pipe', () => klang_pipe(...far(3, 7), 2.2)], [1.5, 'water', () => { const [x, z] = far(4, 9); W.play('waterFlow', { gain: rand(.03, .06), rate: rand(.8, 1), offset: rand(0, 4), dur: rand(2, 4), fadeIn: .6, lp: 700, x, y: 2.3, z, ref: 2 }); }],
    [1.2, 'metal', () => { const [x, z] = far(7, 14); W.play('metalHit1', { gain: rand(.05, .08), rate: rand(.45, .6), lp: 1500, x, y: 1, z, ref: 4 }); }],
    [.6, 'above', () => { for (let i = 0; i < 3 + Math.floor(rand(0, 3)); i++) W.play(W.pick('stepW1', 'stepW2', 'stepW3', 'stepW4'), { gain: .1, rate: .8, lp: 380, delay: i * rand(.55, .7), x: P.x + rand(-4, 4), y: 4, z: P.z + rand(-4, 4), ref: 3 }); }]]);
  if (A === 'amt') return klang_roll([ // Amt: Neonröhren, Lüftung, Tropfen, ferne Türen, Blech
    [3, 'drip', () => { const [x, z] = far(4, 12); W.drip(x, rand(1, 2.4), z); }], [1.5, 'metal', () => { const [x, z] = far(10, 22); W.play('metalHit1', { gain: .07, rate: rand(.5, .7), lp: 1800, x, y: 1, z, ref: 6 }); }],
    [1.2, 'vent', () => W.play(W.pick('air1', 'air2'), { gain: rand(.04, .07), rate: rand(.7, .9), dur: rand(3, 5), fadeIn: 1.2, lp: 700, offset: rand(0, 2) })],
    [1, 'buzz', () => { const [x, z] = far(3, 8); W.play('buzz', { gain: .12, rate: rand(.9, 1.1), dur: rand(.6, 1.4), x, y: 2.4, z, ref: 2 }); }],
    [.6, 'door', () => { const [x, z] = far(18, 30); W.play(W.pick('door1', 'door2', 'door3', 'door4', 'door5'), { gain: .12, rate: rand(.8, .95), lp: 900, x, y: 1.2, z, ref: 4 }); }]]);
  if (A === 'kanal') return klang_roll([[3, 'drip', () => { const [x, z] = far(4, 12); W.drip(x, rand(1, 2.5), z); }], [1.5, 'water', () => { const [x, z] = far(6, 14); W.play('waterLoop', { gain: .08, offset: rand(0, 4), dur: rand(1.5, 3), fadeIn: .5, x, y: 0, z, ref: 3 }); }],
    [1, 'metal', () => { const [x, z] = far(10, 25); W.play('metalHit1', { gain: .08, rate: rand(.5, .7), x, y: 1, z, ref: 6 }); }]]);
  if (A === 'weiss') return false;
  if (A === 'wald' && typeof WL !== 'undefined' && WL.ready) return false; // im Wald spricht das Modul waldleben (sonst doppelt)
  if (A === 'wald') return klang_roll([[2, 'owl', () => W.owlPair(...far(25, 50))], [1, 'twig', () => W.twig(...far(8, 18))], [1, 'treeCreak', () => W.treeCreak(...far(10, 25))], [.5, 'deer', () => W.deerBark(...far(35, 60))]]);
  if (A === 'friedhof') return klang_roll([[2, 'owl', () => W.owlPair(...far(25, 50))], [1, 'crow', () => W.caw(...(([x, z]) => [x, 7, z])(far(12, 30)))], [1, 'treeCreak', () => W.treeCreak(...far(8, 20))], [.8, 'gust', () => W.gust(rand(3, 5))]]);
  if (A === 'villa') return klang_roll([[2, 'owl', () => W.owlPair(...far(25, 50))], [1.5, 'creak', () => W.play('woodSqueak1', { gain: .1, rate: rand(.6, .75), lp: 2200, x: -125 + rand(-5, 5), y: 6, z: 70, ref: 6 })],
    [.8, 'crow', () => W.caw(-125 + rand(-8, 8), 14, 70 + rand(-8, 8))], [1, 'gutter', () => W.gutter(-125 + rand(-6, 6), 62)]]);
  // Ort: Dachrinnen, ferne Hunde, Waldkauz, Totholz, selten ein Fuchs oder ein Zug in der Ferne (Krähen schlafen nachts – nur aufgeschreckt)
  return klang_roll([[3, 'gutter', () => W.gutter(...far(4, 12))], [1.5, 'owl', () => W.owlPair(...far(40, 80))], [1.4, 'bark', () => W.bark(...far(60, 110), Math.random() < .3)],
    [1.2, 'treeCreak', () => W.treeCreak(...far(10, 30))], [.5, 'crow', () => W.caw(...(([x, z]) => [x, 8, z])(far(25, 50)))], [.5, 'fox', () => W.fox(...far(50, 90))], [.25, 'train', () => W.trainHorn()]]);
}
// Rohre in der Wand: zwei bis vier trockene Metallticks (Wärmedehnung), gelegentlich rauscht Wasser nach
function klang_pipe(x, z, y = 2.4) { const W = Audio; for (let i = 0, n = 2 + Math.floor(rand(0, 3)); i < n; i++) W.play('metalHit1', { gain: rand(.02, .035), rate: rand(2.5, 3.2), hp: 1500, dur: .2, delay: i * rand(.18, .5), x: x + i * .3, y, z, ref: 1.5 });
  if (Math.random() < .3) W.play('waterFlow', { gain: .03, rate: 1.2, offset: rand(0, 4), dur: rand(1.2, 2), fadeIn: .3, lp: 600, delay: 1.2, x, y, z, ref: 1.5 }); }
// Im Haus: welches Gebäude? Nr. 7 (bewohnt: Strom, Rohre), Nr. 1 (verlassen: Mäuse, Zugluft), Hütte (Blechdach), Villa (Halle, oben knarrt es)
function klang_inside(R, far) {
  const W = Audio, P = player.pos, sp = () => [rand(R.x0 + .4, R.x1 - .4), rand(R.zb + .4, R.zf - .4)], edge = () => Math.random() < .5 ? [rand(R.x0, R.x1), Math.random() < .5 ? R.zb + .15 : R.zf - .15] : [Math.random() < .5 ? R.x0 + .15 : R.x1 - .15, rand(R.zb, R.zf)];
  const kind = R.x0 < -800 ? 'villa' : Math.abs(R.x0 - 20) < .5 ? 'nr7' : Math.abs(R.x0 + 56) < .5 ? 'nr1' : 'huette';
  const creak = [2.5, 'creak', () => { const [x, z] = sp(); W.play(W.pick('woodSqueak1', 'woodSqueak2'), { gain: rand(.06, .12), rate: rand(.45, .7), lp: 1600, x, y: Math.random() < .5 ? 3 : .5, z, ref: 2 }); }];
  const settle = [3, 'settle', () => { const [x, z] = edge(); W.play(W.pick('woodHit1', 'woodHit2'), { gain: rand(.025, .05), rate: rand(2, 2.6), lp: 2500, x, y: rand(1, 3), z, ref: 1.5 }); }];
  const outside = [2, 'outside', () => { const a = rand(0, 6.28), d = rand(40, 90), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d; Math.random() < .5 ? W.owlPair(x, z) : W.bark(x, z, false); }]; // dumpf durch die Wand
  const win = [1.2, 'window', () => { const [x, z] = edge(); W.play('glass1', { gain: .04, rate: rand(1.4, 1.8), hp: 1500, x, y: 1.5, z, ref: 1.5 }); if (Math.random() < .5) W.play('glass1', { gain: .03, rate: rand(1.5, 1.9), hp: 1500, delay: rand(.1, .25), x, y: 1.5, z, ref: 1.5 }); }];
  const mouse = [2, 'critter', () => { const [x, z] = edge(); for (let i = 0, n = 2 + Math.floor(rand(0, 3)); i < n; i++) W.play(W.pick('scrape1', 'scrape2', 'scrape3', 'scrape4'), { gain: .03, rate: rand(2.4, 3), hp: 1500, dur: .3, delay: i * rand(.2, .5), x, y: .2, z, ref: 1.5 }); }];
  if (kind === 'nr7') return klang_roll([creak, settle, outside, win, [2, 'pipe', () => klang_pipe(...edge())], [1, 'water', () => { const [x, z] = edge(); W.play('waterFlow', { gain: .035, rate: 1.1, offset: rand(0, 4), dur: rand(2, 3.5), fadeIn: .5, lp: 650, x, y: 2, z, ref: 1.5 }); }]]);
  if (kind === 'nr1') return klang_roll([[3.5, 'creak', creak[2]], settle, mouse, outside, [2, 'window', win[2]]]);
  if (kind === 'villa') return klang_roll([[3, 'creak', creak[2]], settle, [1, 'pipe', () => klang_pipe(...edge(), 3)], win, [.7, 'upstairs', () => { for (let i = 0; i < 3; i++) W.play(W.pick('stepW1', 'stepW2', 'stepW3', 'stepW4'), { gain: .12, rate: .8, lp: 500, delay: i * rand(.6, .8), x: R.x0 + rand(2, 12), y: 6.2, z: rand(R.zb + 2, R.zf - 2), ref: 3 }); }]]);
  return klang_roll([[2, 'settle', () => W.play('metalHit2', { gain: .02, rate: rand(2.6, 3.2), hp: 1800, dur: .2, x: P.x + rand(-1.5, 1.5), y: 2.5, z: P.z + rand(-1.5, 1.5), ref: 1.5 })], [1.5, 'critter', mouse[2]], [3, 'outside', outside[2]], [1, 'creak', creak[2]]]);
}
// ---------------------------------------------------------------- Raumklang: Kühlschrank und Neonröhre in Nr. 7 (Strom), Lüftung im Amt – nur im jeweiligen Gebäude, beim Verlassen ausgeblendet
// Klänge beim ersten Bedarf berechnet (je 1–2 s, als Schleife ohne Naht: ganze Perioden)
function klang_bufs() { const c = Audio.ctx, sr = c.sampleRate, mk = (sec, f) => { const b = c.createBuffer(1, Math.floor(sr * sec), sr), d = b.getChannelData(0); let lp = 0; for (let i = 0; i < d.length; i++) { const t = i / sr; lp = lp * .97 + (Math.random() * 2 - 1) * .03; d[i] = f(t, lp); } return b; };
  const P2 = 2 * Math.PI;
  Audio.buf.klFridge = mk(2, (t, n) => .3 * Math.sin(P2 * 50 * t) + .5 * Math.sin(P2 * 100 * t) + .18 * Math.sin(P2 * 150 * t) + .08 * Math.sin(P2 * 200 * t) + n * 1.6); // Kompressor: 50-Hz-Brummen, Rumpeln
  Audio.buf.klTube = mk(1, (t, n) => .45 * Math.sin(P2 * 100 * t) + .2 * Math.sin(P2 * 200 * t) + .12 * Math.sin(P2 * 300 * t) + (Math.sin(P2 * 100 * t) > .96 ? (Math.random() * 2 - 1) * .25 : 0)); // Neonröhre: 100 Hz + Knistern
  for (const B of KL_BEDS) if (B.lp && Audio.prefilter) Audio.prefilter(B.buf, B.lp); // Schleifen nie mit Echtzeit-Tiefpass (siehe Audio.prefilter)
}
const KL_BEDS = [
  { id: 'kuehl', buf: 'klFridge', x: 31.3, y: 1.2, z: -16.4, ref: 1.2, gain: .05, lp: 380, cycle: true, on: () => klang_inH(20) && !state.outage },
  { id: 'roehre', buf: 'klTube', x: 29, y: 3.1, z: -14.5, ref: 1, gain: .012, lp: 3000, on: () => klang_inH(20) && !state.outage && typeof kitchenLight !== 'undefined' && !kitchenLight.userData.dead && kitchenLight.intensity > .5 },
  { id: 'luft', buf: 'air1', gain: .035, lp: 500, rate: .7, on: () => klang_S.area === 'amt' }]; // Lüftung (ohne Ort: überall im Amt)
function klang_inH(x0) { const R = !state.inBasement && typeof indoorRect === 'function' ? indoorRect() : null; return !!R && Math.abs(R.x0 - x0) < .5; }
function klang_beds() {
  const S = klang_S, A = Audio, t = A.ctx.currentTime; if (!S.bufs) { S.bufs = true; try { klang_bufs(); } catch (e) { console.warn('Klang: Raumklang', e); } }
  for (const B of KL_BEDS) { let want = !!B.on() && !(typeof spannung_hushed === 'function' && spannung_hushed());
    if (B.cycle) { B.ct = (B.ct ?? rand(20, 60)) - 1; if (B.ct < 0) { B.run = !B.run; B.ct = B.run ? rand(60, 150) : rand(30, 90); if (want && B.x !== undefined) { // Kühlschrank springt an (Klick) / schaltet ab (Schütteln)
          if (B.run) A.play('switch1', { gain: .05, rate: .6, lp: 1500, x: B.x, y: B.y, z: B.z, ref: 1 }); else { A.play('woodHit2', { gain: .04, rate: 1.4, lp: 900, x: B.x, y: B.y, z: B.z, ref: 1 }); A.play('glass1', { gain: .02, rate: 1.6, hp: 1500, delay: .1, x: B.x, y: B.y + .5, z: B.z, ref: 1 }); } } }
      want = want && B.run; }
    if (want && !B.h && A.buf[B.buf]) { B.h = A.play(B.buf, { loop: true, gain: 0, lp: B.lp, rate: B.rate || 1, dest: B.x !== undefined ? A.at(B.x, B.y, B.z, B.ref) : A.world }); if (B.h) B.h.g.gain.setTargetAtTime(B.gain, t, .8); }
    else if (!want && B.h) { B.h.stop(1.2); B.h = null; } }
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
// Funk Kanal 3 (F3 AP-06, LWO): Rauschsperre-Klack, Band 320–2900 Hz, darin eine verzerrte „Stimme“ als Silbenhüllkurve, am Ende Klack.
// art: 'funk' (Blechmann-Gerät, mit x/z räumlich) · 'handy' (Lukes Handy, enger, im Ohr) · 'band' (Lautsprecher im Amt: Wolter-Band, etwas tiefer, Hall der Ebene)
function klang_funk(sec = 2.5, o = {}) { const A = Audio, c = A.ctx; if (!c) return; const t = c.currentTime, art = o.art || 'funk';
  let dest = A.world; if (o.x !== undefined) { dest = A.at(o.x, o.y ?? 1.3, o.z, o.ref || 2.2); if (A.cut) return; }
  const out = c.createGain(); out.gain.value = art === 'handy' ? .5 : .75; out.connect(dest);
  const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = art === 'handy' ? 450 : 320; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = art === 'handy' ? 3200 : art === 'band' ? 2400 : 2900;
  const pk = c.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = art === 'band' ? 1100 : 1700; pk.gain.value = 7; pk.Q.value = 1.2; hp.connect(lp); lp.connect(pk); pk.connect(out);
  const hiss = A.noise(true), hg = c.createGain(); hg.gain.setValueAtTime(0, t); hg.gain.linearRampToValueAtTime(art === 'band' ? .035 : .07, t + .05); hg.gain.setValueAtTime(art === 'band' ? .035 : .07, t + sec); hg.gain.linearRampToValueAtTime(0, t + sec + .12); hiss.connect(hg); hg.connect(hp);
  // „Stimme“: Rauschen durch wandernde Formanten, Silben 5–7 pro Sekunde, kleine Pausen
  const v = A.noise(true), f1 = c.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5; const vg = c.createGain(); vg.gain.value = 0; v.connect(f1); f1.connect(vg); vg.connect(hp);
  let k = t + .12; while (k < t + sec - .1) { const d = .09 + Math.random() * .12; f1.frequency.setValueAtTime((art === 'band' ? 500 : 650) + Math.random() * 900, k); vg.gain.setValueAtTime(0, k); vg.gain.linearRampToValueAtTime(Math.random() < .12 ? 0 : .5 + Math.random() * .4, k + d * .3); vg.gain.linearRampToValueAtTime(.05, k + d); k += d + (Math.random() < .15 ? .18 : .02); }
  // Rauschsperre: Klack am Anfang und am Ende (Blechmann-Gerät, Handy knackt)
  for (const t0 of [0, sec + .1]) { const n = A.noise(false), bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2400; bp.Q.value = 2; const g = c.createGain(); g.gain.setValueAtTime(0, t + t0); g.gain.linearRampToValueAtTime(.35, t + t0 + .004); g.gain.exponentialRampToValueAtTime(.001, t + t0 + .06); n.connect(bp); bp.connect(g); g.connect(out); n.stop(t + t0 + .1); }
  hiss.stop(t + sec + .3); v.stop(t + sec + .3); }
WORLD_MODS.push(['Klang', async () => { window.klang_ambient = klang_ambient; }]);
WORLD_TICK.push(dt => {
  const S = klang_S; if (!Audio.ctx) return;
  if (!S.rendering && Audio.ctx.state === 'running') klang_renderAll();
  if (S.pending.length && Audio.mus) for (const [lv, tr] of S.pending.splice(0)) Audio.mus.tracks[lv].push(tr); // fertige Stücke in die Musikauswahl
  const menuOn = !state.started && $('start').classList.contains('show') && !S.intro; klang_menu(menuOn);
  if (!state.started) return;
  S.areaT -= dt; if (S.areaT < 0) { S.areaT = 1; const a = klang_area(); if (a !== S.area) { S.area = a; S.areaSince = 0; } S.areaSince = (S.areaSince || 0) + 1;
    const M = Audio.mus; if (M && M.cur && M.cur.area && M.cur.area !== S.area && S.areaSince > 4) { M.cur.stop(6); M.cur = null; M.rest = rand(8, 16); } // Ort gewechselt: langsam aus, kurz Stille
    try { Audio.setRoom(klang_reverb()); klang_beds(); } catch (e) { console.warn('Klang: Raum', e); } }
  S.ambT -= dt; if (S.ambT < 0) { S.ambT = rand(7, 16); if (!state.talking && !ui.overlay && !menu.attract) try { klang_ambient(); } catch (e) { console.warn('Klang: Umgebung', e); } } // die Regie entscheidet, ob es wirklich klingt
});
window.__klang = { S: klang_S, area: () => klang_area(), surface: i => klang_surface(i), floor: (x, z) => klang_floor(x, z), reverb: () => klang_reverb(), render: n => klang_render(n), beds: KL_BEDS }; // Testzugriff
