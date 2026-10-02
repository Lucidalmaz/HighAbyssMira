// =====================================================================  KLANG (Modul „klang“): Klangbetten je Ort, Musik, Einzelgeräusche – aus echten Aufnahmen
// Quellen (CREDITS.md): Sonniss GDC Game Audio Bundles (lizenzfrei), VSCO 2 Community Edition (CC0, Instrumente), die CC0-Aufnahmen aus sounds.js.
// Dateien: game/audio/*.ogg (Opus), gebaut von app/tools/klang_bau.py + klang_bau2.py – erst bei Bedarf geladen (fetch + decodeAudioData), nichts steckt im HTML.
// Grundsätze: jedes Geräusch hat eine Quelle und einen Grund · Stille ist Gestaltungsmittel · Musik nur, wo sie einen Moment trägt (Fund, Verlust, Jagd, Kapitelende),
// dazwischen lange Pausen · Leitmotiv ist Lucys Spieluhr (E – D – C – H – C): mal Spieluhr, mal Klavier, mal Streicher.
// Klangbetten je Ort (Regen auf Asphalt, Rinnstein, Dachtraufe, ferner Wind, Stromleitung · Raumton, Küchenuhr, Regen hinter dem Fenster · Keller: Tropfen, Luftzug ·
// Amt: Lüftung, Tunnel, Brummen · Wald: Regen auf Laub · Nimmerheim: luftige Fläche) werden weich überblendet und laufen über hushG (Regie: plötzliche Stille).
// Alle Umgebungsereignisse fragen vorher die Regie (Modul spannung): Budget je Minute, Abstand je Familie, Stille nach Schrecken.
const klang_S = { pending: [], tracks: {}, rendering: false, loading: {}, missing: [], beds: {}, menu: null, menuG: null, dream: null, area: 'ort', areaT: 0, ambT: 10 };
const KN = n => { const m = /^([A-G])(#|b)?(-?\d)$/.exec(n), i = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0); return 440 * Math.pow(2, (i + (m[3] - 4) * 12) / 12); };
// ---------------------------------------------------------------- Instrumente (für jeden Kontext, auch offline)
// Instrumente aus echten Samples (VSCO 2 CE): KI.* nimmt den nächstliegenden Ton der Bank (game/audio/kb_*.ogg) und verschiebt ihn per playbackRate.
// Lange Töne: überlappende Einsätze mit weicher Überblendung. Ohne geladene Bank die alte Synthese (Rückfall).
const KL_BANK = { klavier: ['A2', 'E3', 'A3', 'E4', 'A4', 'E5', 'A5'], cello: ['A2', 'E3'], bass: ['A1', 'E2'], bratsche: ['A3', 'E4'], geige: ['A4', 'E5'], harfe: ['A2', 'A3', 'A4', 'A5'], spieluhr: ['E6', 'A6'], glocke: ['D4', 'A4'] };
const KI = {
  smp(c, out, t, bank, f, v, dur, a = .005, r = .5, cut) { const B = Audio.buf, L = KL_BANK[bank]; if (!B || !L || !(f > 0)) return false; let best = null, bd = 99;
    for (const n of L) { const b = B['kb_' + bank + '_' + n]; if (!b) continue; const d = Math.abs(Math.log2(f / KN(n))); if (d < bd) { bd = d; best = [b, KN(n)]; } } if (!best) return false;
    const b = best[0], rate = f / best[1], len = b.duration / rate, hold = dur === undefined ? len : dur; let dest = out;
    if (cut) { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.connect(out); dest = lp; }
    for (let s = 0; ; s += Math.max(1, len - 2.4)) { const src = c.createBufferSource(), g = c.createGain(), t0 = t + s, first = s === 0, last = s + len >= hold + r;
      src.buffer = b; src.playbackRate.value = rate; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(v, t0 + (first ? Math.max(.003, a) : 2));
      if (!last) { g.gain.setValueAtTime(v, t0 + len - 2.4); g.gain.linearRampToValueAtTime(0, t0 + len - .3); } else if (dur !== undefined) { g.gain.setValueAtTime(v, Math.max(t0 + .01, t + hold)); g.gain.linearRampToValueAtTime(0, t + hold + r); }
      src.connect(g); g.connect(dest); src.start(t0, first ? 0 : .7 * Math.min(1, rate)); src.stop(last ? Math.min(t0 + len, t + hold + r) + .05 : t0 + len); if (last) break; }
    return true; },
  ir(c, sec, dec) { const n = Math.floor(c.sampleRate * sec), b = c.createBuffer(2, n, c.sampleRate); for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, dec) * (i < 600 ? i / 600 : 1); } return b; },
  chain(c, wet = .45, sec = 5.5) { const dry = c.createGain(), comp = c.createDynamicsCompressor(), master = c.createGain(); comp.threshold.value = -18; comp.ratio.value = 3; master.gain.value = .9;
    const conv = c.createConvolver(); conv.buffer = KI.ir(c, sec, 2.6); const wg = c.createGain(); wg.gain.value = wet; dry.connect(comp); dry.connect(conv); conv.connect(wg); wg.connect(comp); comp.connect(master); master.connect(c.destination); return dry; },
  env(c, t, a, peak, d, hold = 0) { const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); if (hold) g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(.0001, t + a + hold + d); return g; },
  osc(c, type, f, t, dur) { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(t + dur + .05); return o; },
  // Klavier: Obertöne mit eigener Abklingzeit, leichter Anschlag
  piano(c, out, t, f, v = .3, len = 5) { if (KI.smp(c, out, t, 'klavier', f, v * 1.6, len, .003, 1.2)) return; [[1, 1, len], [2, .42, len * .6], [3, .2, len * .4], [4.02, .09, len * .3], [5.05, .05, len * .2]].forEach(([m, a, d]) => { const o = KI.osc(c, 'sine', f * m * (1 + (m - 1) * .0007), t, d + .1), g = KI.env(c, t, .006, v * a, d); o.connect(g); g.connect(out); });
    const n = c.createBufferSource(); n.buffer = KI.noise(c); const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(4000, f * 6); const g = KI.env(c, t, .002, v * .05, .05); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + .12); },
  // Spieluhr: helle Zinke, unharmonischer Oberton, kurzer metallischer Anschlag
  box(c, out, t, f, v = .12) { if (KI.smp(c, out, t, 'spieluhr', f * 2, v * 3)) return; [[1, 1, 2.6], [2, .3, 1.4], [5.93, .12, .5]].forEach(([m, a, d]) => { const o = KI.osc(c, 'sine', f * m, t, d), g = KI.env(c, t, .003, v * a, d); o.connect(g); g.connect(out); }); },
  bell(c, out, t, f, v = .2, d = 7) { if (KI.smp(c, out, t, 'glocke', f, v * 1.5, d, .003, 2)) return; [[1, 1], [2.01, .5], [2.76, .35], [4.07, .18], [5.4, .1]].forEach(([m, a], i) => { const o = KI.osc(c, 'sine', f * m, t, d), g = KI.env(c, t, .004, v * a, d * (1 - i * .15)); o.connect(g); g.connect(out); }); },
  // Fläche: je Ton zwei verstimmte Sägezähne durch einen weichen Tiefpass, langsames Ein- und Ausblenden
  pad(c, out, t, fs, dur, v = .05, cut = 900) { if (fs.every(f => KI.smp(c, out, t, f < 200 ? 'cello' : f < 500 ? 'bratsche' : 'geige', f, v * 3, dur, Math.min(4, dur * .35), 3, Math.max(cut * 2, 1500)))) return; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = .3; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(4, dur * .35)); g.gain.setValueAtTime(v, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur); lp.connect(g); g.connect(out);
    for (const f of fs) for (const d of [-.006, .006]) { const o = KI.osc(c, 'sawtooth', f * (1 + d), t, dur); o.connect(lp); } },
  // Chor „oh“: Sägezahn mit Vibrato durch drei Formanten
  choir(c, out, t, fs, dur, v = .05) { if (fs.every(f => KI.smp(c, out, t, f < 500 ? 'bratsche' : 'geige', f, v * 3, dur, 3, 3, 3000))) return; const sum = c.createGain(); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 3); g.gain.setValueAtTime(v, t + dur - 3); g.gain.linearRampToValueAtTime(0, t + dur); g.connect(out);
    for (const [ff, q, a] of [[520, 8, 1], [900, 9, .6], [2500, 12, .18]]) { const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = ff; bp.Q.value = q; const bg = c.createGain(); bg.gain.value = a; sum.connect(bp); bp.connect(bg); bg.connect(g); }
    for (const f of fs) for (const d of [-.004, 0, .005]) { const o = KI.osc(c, 'sawtooth', f * (1 + d), t, dur), lf = KI.osc(c, 'sine', 4.6 + Math.random() * .8, t, dur), lg = c.createGain(); lg.gain.value = f * .006; lf.connect(lg); lg.connect(o.frequency); o.connect(sum); } },
  // gestrichene Saite (Cello/Bratsche): langsamer Bogen, Vibrato, Tiefpass
  bow(c, out, t, f, dur, v = .06, cut = 1100) { if (KI.smp(c, out, t, f < 90 ? 'bass' : f < 250 ? 'cello' : f < 500 ? 'bratsche' : 'geige', f, v * 3, dur, Math.min(2.2, dur * .4), Math.min(2, dur * .25), Math.max(cut * 2, 1200))) return; const o = KI.osc(c, 'sawtooth', f, t, dur), lf = KI.osc(c, 'sine', 5.2, t, dur), lg = c.createGain(); lg.gain.value = f * .005; lf.connect(lg); lg.connect(o.frequency);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(2.2, dur * .4)); g.gain.setValueAtTime(v, t + dur * .75); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(lp); lp.connect(g); g.connect(out); },
  // Flöte, gehaucht
  flute(c, out, t, f, dur, v = .05) { if (KI.smp(c, out, t, f < 500 ? 'bratsche' : 'geige', f, v * 2.5, dur, .25, .4, 3500)) return; const o = KI.osc(c, 'sine', f, t, dur), lf = KI.osc(c, 'sine', 5, t, dur), lg = c.createGain(); lg.gain.value = f * .004; lf.connect(lg); lg.connect(o.frequency);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .25); g.gain.setValueAtTime(v * .85, t + dur - .3); g.gain.linearRampToValueAtTime(0, t + dur); o.connect(g); g.connect(out);
    const n = c.createBufferSource(); n.buffer = KI.noise(c); n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 6; const ng = c.createGain(); ng.gain.value = .25; n.connect(bp); bp.connect(ng); ng.connect(g); n.start(t); n.stop(t + dur + .05); },
  // Glasharmonika: zwei fast gleiche Sinus, Schwebung
  glass(c, out, t, f, dur, v = .05) { if (KI.smp(c, out, t, 'geige', f, v * 2.5, dur, .6, 1.5, 5000)) return; for (const d of [0, .0035]) { const o = KI.osc(c, 'sine', f * (1 + d), t, dur), g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .5); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(out); } },
  // Cembalo-artig gezupft
  pluck(c, out, t, f, v = .08, d = 1.6) { if (KI.smp(c, out, t, 'harfe', f, v * 3)) return; const o = KI.osc(c, 'sawtooth', f, t, d), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 9, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + d * .6); const g = KI.env(c, t, .003, v, d); o.connect(lp); lp.connect(g); g.connect(out); },
  knock(c, out, t, v = .2) { const n = c.createBufferSource(); n.buffer = KI.noise(c); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500; const g = KI.env(c, t, .002, v, .12); n.connect(lp); lp.connect(g); g.connect(out); n.start(t); n.stop(t + .2);
    const o = KI.osc(c, 'sine', 95, t, .15), og = KI.env(c, t, .002, v * .8, .12); o.connect(og); og.connect(out); },
  drone(c, out, t, fs, dur, v = .05) { if (fs.every(f => KI.smp(c, out, t, 'bass', f, v * 3, dur, 5, 5, 400))) return; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 180; const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 6); g.gain.setValueAtTime(v, t + dur - 6); g.gain.linearRampToValueAtTime(0, t + dur); lp.connect(g); g.connect(out);
    for (const f of fs) for (const d of [0, .003]) { const o = KI.osc(c, 'triangle', f * (1 + d), t, dur); o.connect(lp); } },
  wind(c, out, t, dur, v = .03) { const n = c.createBufferSource(); n.buffer = KI.noise(c); n.loop = true; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.4; bp.frequency.setValueAtTime(300, t);
    for (let k = 0; k < dur; k += 4) bp.frequency.linearRampToValueAtTime(250 + Math.random() * 500, t + k); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .3); g.gain.linearRampToValueAtTime(0, t + dur); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); n.stop(t + dur); },
  noise(c) { if (c._nz) return c._nz; const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return c._nz = b; },
};
const KL_MOTIV = ['E5', 'D5', 'C5', 'B4', 'C5']; // Lucys Spieluhr
// ---------------------------------------------------------------- Musik: Stücke aus echten Instrumenten (Klavier, Streicher, Harfe, Glockenspiel als Spieluhr), vorab gerendert
// [Datei, Stufe, Ort, Lautstärke] – menue/traum spielen eigene Wege (Menü, Einstieg); gefahr ist eine nahtlose Schleife. Dateien auf −24 LUFS (gefahr −22).
const KL_MUSIK = [['mu_menue', null, null, 1.28], ['mu_traum', null, null, 1.28], ['mu_ort', 'calm', 'ort', 1.20], ['mu_unruhe', 'uneasy', null, 1.20], ['mu_friedhof', 'calm', 'friedhof', 1.20],
  ['mu_wald', 'calm', 'wald', 1.20], ['mu_amt', 'uneasy', 'amt', 1.20], ['mu_kanal', 'calm', 'kanal', 1.20], ['mu_villa', 'calm', 'villa', 1.20], ['mu_weiss', 'calm', 'weiss', 1.20],
  ['mu_lauern', 'uneasy', 'keller', 1.20], ['mu_gefahr', 'danger', null, 1.12]];
MUSIC.rest.calm = [80, 180]; MUSIC.firstRest = [40, 90]; MUSIC.uneasy = .3; // Musik kommt etwas öfter und früher (vorher zu leise/zu selten gehört), Pausen bleiben
// Einzelgeräusche und Instrumente: klein, früh geladen. Betten lädt klang_betten beim Betreten eines Ortes, die Jagdmusik lädt mit.
const KL_EINZEL = ['ui_stift', 'ui_seite', 'cue_fund', 'cue_verlust', 'cue_ende', 'mb_spieluhr', 'st_klein_1', 'st_klein_2', 'st_klein_3', 'st_gross_1', 'st_gross_2',
  'sc_screech', 'sc_scream', 'sc_violin', 'sc_growl', 'sc_whisper', 'sc_static', 'fx_tief_1', 'fx_tief_2', 'fx_atem', 'fx_telefon', 'fx_rauschen', 'fx_glocke',
  ...[1, 2, 3, 4, 5, 6, 7, 8].map(i => 'fx_tropfen_' + i), ...[1, 2, 3].map(i => 'fx_reh_' + i), ...[1, 2, 3, 4].map(i => 'fx_hund_' + i), ...[1, 2, 3, 4, 5, 6, 7].map(i => 'fx_knarren_' + i),
  ...[1, 2, 3, 4].map(i => 'fx_fluester_' + i), ...'CDEFGAH'.split('').map(k => 'pn_' + k),
  ...Object.entries(KL_BANK).flatMap(([k, L]) => L.map(n => 'kb_' + k + '_' + n)), 'mu_jagd', 'mu_jagd_hoch', 'amb_ufo',
  'fx_amsel_1', 'fx_amsel_2', 'fx_amsel_3', 'fx_vogel_1', 'fx_vogel_2', 'fx_vogel_3', 'fx_rabe_1', 'fx_rabe_2', 'fx_rabe_3', 'fx_rabe_4', 'fx_rabe_5',
  'fx_mikrowelle', 'fx_wecker', 'fx_ohrklingeln', 'amb_alarm', 'mu_feuer_a', 'mu_feuer_b',
  ...[1, 2, 3, 4].map(i => 'fx_boe_' + i), ...[1, 2, 3, 4, 5, 6].map(i => 'fx_busch_' + i), ...[1, 2, 3, 4].map(i => 'fx_laub_' + i), ...[1, 2].map(i => 'fx_kette_' + i), ...[1, 2].map(i => 'fx_quietsch_' + i)]; // R-7/R-8 Umwelt
// Schleifen (Betten, Gefahr, Jagd) tragen je 0,25 s Rand – Opus verfälscht die ersten/letzten Millisekunden; hier abgeschnitten, damit die Naht nicht klickt
function kl_trim(b) { const k = Math.round(.25 * b.sampleRate), n = b.length - 2 * k; if (n <= 0) return b; const o = Audio.ctx.createBuffer(b.numberOfChannels, n, b.sampleRate);
  for (let ch = 0; ch < b.numberOfChannels; ch++) o.copyToChannel(b.getChannelData(ch).subarray(k, k + n), ch); return o; }
function klang_load(name) { const A = Audio, S = klang_S; if (A.buf[name]) return Promise.resolve(A.buf[name]); if (S.loading[name]) return S.loading[name];
  return S.loading[name] = fetch('audio/' + name + '.ogg').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(ab => A.ctx.decodeAudioData(ab))
    .then(b => { if (name.startsWith('amb_') || name === 'mu_gefahr' || name.startsWith('mu_jagd')) b = kl_trim(b); A.buf[name] = b; return b; }).catch(e => { S.missing.push(name); console.warn('Klang fehlt: ' + name, e && e.message); return null; }); }
function klang_render(name) { return klang_load(name.startsWith('mu_') ? name : 'mu_' + name); } // (Testzugriff, alter Name)
// Nacheinander im Hintergrund laden (Menü und Traum zuerst), dann in die Musikauswahl einreihen
async function klang_renderAll() {
  const S = klang_S; if (S.rendering) return; S.rendering = true;
  for (const P of KL_MUSIK.slice(0, 2)) { const b = await klang_load(P[0]); if (b) S.tracks[P[0].slice(3)] = b; }
  for (let i = 0; i < KL_EINZEL.length; i += 6) await Promise.all(KL_EINZEL.slice(i, i + 6).map(klang_load));
  for (const P of KL_MUSIK.slice(2)) { const b = await klang_load(P[0]); if (!b) continue; S.tracks[P[0].slice(3)] = b; if (P[1]) S.pending.push([P[1], { b, gain: P[3], name: P[0].slice(3), area: P[2] }]); }
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
    A.laub(at ? x : player.pos.x, at ? z : player.pos.z, .7 * v); // echte Laubaufnahme statt erzeugtem Rauschen
    if (!at && Math.random() < .05) A.twig(player.pos.x + rand(-.4, .4), player.pos.z + rand(-.4, .4)); }
  else if (s === 'gravel') { A.play(pk('stepC1', 'stepC3', 'stepC5'), { gain: .3 * v, vary: .1, rate: .9, ...P }); A.play('stones1', { gain: .08 * v, offset: rand(0, 1.2), dur: .18, rate: rand(1.3, 1.6), hp: 1200, ...P }); }
  else if (s === 'grass') A.play(pk('stepG1', 'stepG2', 'stepG3'), { gain: .32 * v, vary: .1, varyGain: .3, lp: 5000, ...P });
  else A.play(pk('stepC1', 'stepC2', 'stepC3', 'stepC4', 'stepC5', 'stepC6'), { gain: .38 * v, vary: .08, varyGain: .25, ...P }); // Beton
}
Audio.step = function (s) { if (this.ctx) klang_step(s || 'grass', 1); };
// ---------------------------------------------------------------- Aufnahmen statt Synthese: gleiche Namen (andere Module rufen sie), echte Quellen.
// Fehlt eine Datei (noch nicht geladen), spielt die alte Fassung – synthetische Tierstimmen/Signale ohne Aufnahme bleiben stumm (lieber Stille als ein falscher Ton).
const KL_ALT = {}; for (const k of ['stinger', 'scareSound', 'screech', 'whisper', 'musicBox', 'pianoNote', 'chaseMusic', 'hum', 'drip', 'thump', 'tape', 'radio', 'chime', 'bell']) KL_ALT[k] = Audio[k];
for (const k of ['stinger', 'scareSound', 'screech', 'whisper', 'musicBox', 'pianoNote', 'drip', 'thump', 'tape', 'radio', 'bell']) KL_ALT[k] = function () {}; // Aufnahme noch nicht geladen/fehlt: still statt erzeugtem Ersatzgeräusch (Synthese klang „komisch“); chaseMusic/hum/chime behalten ihren Weg
const kl_has = n => !!(Audio.buf && Audio.buf[n]);
function kl_pick(p, n) { const L = []; for (let i = 1; i <= n; i++) if (kl_has(p + i)) L.push(p + i); return L.length ? Audio.pick(...L) : null; }
const kl_mv = () => typeof settings !== 'undefined' ? settings.music ?? 1 : 1;
Object.assign(Audio, {
  klBus() { if (!this.klB) { this.klB = this.ctx.createGain(); this.klB.connect(this.master); } return this.klB; }, // Stinger/Momente: trocken (Hall eingerechnet)
  // Musikalischer Moment (fund · verlust · ende): duckt die laufende Musik, höchstens alle 25 s
  cue(name, v = .6) { if (!this.ctx || !kl_has('cue_' + name)) return null; const t = this.ctx.currentTime; if (t - (this.cueAt || -99) < 25) return null; this.cueAt = t;
    this.duck(this.buf['cue_' + name].duration * .7); return this.play('cue_' + name, { gain: v * kl_mv(), dest: this.klBus() }); },
  stinger(big) { if (!this.ctx) return; const n = big ? kl_pick('st_gross_', 2) : kl_pick('st_klein_', 3); if (!n) return KL_ALT.stinger.call(this, big);
    const t = this.ctx.currentTime; if (!big && t - (this.lastStinger || -99) < AUDIO_MIX.stingerGap) return; this.lastStinger = t; this.duck(big ? 6 : 3.5);
    this.play(n, { gain: big ? .9 : .5, vary: .03, dest: this.klBus() }); },
  scareSound(kind) { if (!this.ctx) return; const n = 'sc_' + (kind === 'whisperBurst' ? 'whisper' : kind); if (!kl_has(n)) return KL_ALT.scareSound.call(this, kind); this.duck(5); this.play(n, { gain: .95, dest: this.klBus() }); },
  screech() { if (!this.ctx) return; if (!kl_has('sc_screech')) return KL_ALT.screech.call(this); this.duck(4); this.play('sc_screech', { gain: .85, dest: this.klBus() }); },
  whisper(x, y, z, dur = 2.2) { if (!this.ctx) return; const n = kl_pick('fx_fluester_', 4); if (!n) return KL_ALT.whisper.call(this, x, y, z, dur); const t = this.ctx.currentTime;
    if (t < (this.whisperUntil || 0)) return; this.whisperUntil = t + dur + AUDIO_MIX.whisperGap;
    this.play(n, { gain: .5, vary: .05, varyGain: .15, x, y, z, ref: 2, dur: Math.min(dur + .5, this.buf[n].duration) }); },
  musicBox() { if (!this.ctx) return; if (!kl_has('mb_spieluhr')) return KL_ALT.musicBox.call(this); this.play('mb_spieluhr', { gain: .75, dest: this.world }); },
  pianoNote(k) { if (!this.ctx) return; if (!kl_has('pn_' + k)) return KL_ALT.pianoNote.call(this, k); this.play('pn_' + k, { gain: .7, dest: this.world }); },
  drip(x, y, z) { if (!this.ctx) return; const n = kl_pick('fx_tropfen_', 8); if (!n) return KL_ALT.drip.call(this, x, y, z); this.play(n, { gain: rand(.2, .38), vary: .06, x, y, z, ref: 1.6 }); },
  thump(x, y, z) { if (!this.ctx) return; if (!kl_has('fx_tief_1')) return KL_ALT.thump.call(this, x, y, z); this.play('fx_tief_1', { gain: .7, vary: .05, x, y, z, ref: 3 }); },
  owl() {}, owlPair() {}, fox() {}, trainHorn() {},
  deerBark(x, z) { if (!this.ctx) return; const n = kl_pick('fx_reh_', 3); if (n) this.play(n, { gain: .4, vary: .05, x, y: 1, z, ref: 8, lp: 3500 }); },
  twig(x, z) { if (!this.ctx) return; this.play('woodCrack', { gain: rand(.1, .18), rate: rand(1.6, 2.3), hp: 900, dur: .35, x, y: .2, z, ref: 3 }); },
  bark(x, z, cut) { if (!this.ctx) return; const n = kl_pick('fx_hund_', 4); if (!n) return this.play('dog', { gain: .5, vary: .08, x, y: .6, z, ref: 6 }); this.play(n, { gain: .55, vary: .04, x, y: .6, z, ref: 6, dur: cut ? rand(.5, .8) : undefined }); },
  gutter(x, z) { if (!this.ctx) return; for (let k = 0, n = 3 + Math.floor(rand(0, 4)); k < n; k++) setTimeout(() => this.drip(x + rand(-.2, .2), rand(1.6, 3.2), z + rand(-.2, .2)), k * rand(350, 900)); },
  tape(on) { if (!this.ctx) return; if (!kl_has('fx_rauschen')) return KL_ALT.tape.call(this, on); if (on && !this.tapeL) this.tapeL = this.loop('fx_rauschen', { gain: .05, fadeIn: .3, dest: this.master }); else if (!on && this.tapeL) { this.tapeL.stop(1); this.tapeL = null; } },
  radio(x, z, off) { if (!this.ctx) return; if (!kl_has('fx_rauschen')) return KL_ALT.radio.call(this, x, z, off); if (this.radioL) { this.radioL.stop(.3); this.radioL = null; } if (off) return;
    const h = this.radioL = this.loop('fx_rauschen', { gain: .3, fadeIn: .3, x, y: 1, z, ref: 3 }); setTimeout(() => { if (this.radioL === h && h) { h.stop(.4); this.radioL = null; } }, 6400); },
  // Telefon: im Hörer das Freizeichen (425 Hz wie in Deutschland, leise, schmal); die Zelle selbst klingelt mit einer echten Glocke
  ring(v) { if (!this.ctx || v < .005) return; if (v < .03 || !kl_has('fx_telefon')) { const o = this.osc('sine', 425, 0, 1.1), g = this.ctx.createGain(), t = this.ctx.currentTime;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * .5, t + .02); g.gain.setValueAtTime(v * .5, t + 1); g.gain.linearRampToValueAtTime(0, t + 1.05); o.connect(g); g.connect(this.master); return; }
    this.play('fx_telefon', { gain: Math.min(.8, v * 7) }); },
  // Aufgabe notiert: Bleistift im Notizbuch. Fund/gelöst: ein kurzer musikalischer Moment (sonst die Seite)
  chime(kind) { if (!this.ctx) return; if (kind === 'quest') { if (kl_has('ui_stift')) this.play('ui_stift', { gain: .3, vary: .05 }); else KL_ALT.chime.call(this); return; }
    if (this.cue('fund', .55)) return; if (kl_has('ui_seite')) this.play('ui_seite', { gain: .3, vary: .05 }); else KL_ALT.chime.call(this); },
  beep(ok) { if (!this.ctx) return; this.play('switch2', { gain: .16, rate: ok ? 1.7 : 1.15, hp: 500 }); const o = this.osc('sine', ok ? 1850 : 330, .005, .3), lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; o.connect(lp); this.env(lp, ok ? .02 : .035, .004, ok ? .07 : .2); },
  bell(x, z) { if (!this.ctx) return; if (!kl_has('kb_spieluhr_A6')) return KL_ALT.bell.call(this, x, z); for (let i = 0; i < 3; i++) this.play(i % 2 ? 'kb_spieluhr_E6' : 'kb_spieluhr_A6', { gain: .22, rate: rand(.96, 1.02), delay: i * rand(.09, .14), x, y: 2.4, z, ref: 3 }); },
  tankHum(on) { if (!this.ctx) return; if (on && !this.tankN) { const l = this.loop('machine1', { gain: .25, fadeIn: 2, lp: 1200 }); this.tankN = { l };
      const bub = () => { if (!this.tankN) return; if (this.buf.waterLoop) this.play('waterLoop', { gain: rand(.03, .05), offset: rand(0, 3), dur: rand(.2, .4), rate: rand(1.2, 1.5), hp: 400 }); setTimeout(bub, rand(1200, 3200)); }; bub(); }
    else if (!on && this.tankN) { if (this.tankN.l) this.tankN.l.stop(1); this.tankN = null; } },
  // Verfolgung: echte Trommeln und Streicher (Schleife), obere Schicht (Geigen-Cluster) über chaseLevel
  chaseMusic(on) { if (!this.ctx) return; if (!kl_has('mu_jagd')) return KL_ALT.chaseMusic.call(this, on); const t = this.ctx.currentTime;
    if (on && !this.chase) { const g = this.ctx.createGain(), lvl = this.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.75 * kl_mv(), t + 1.2); g.connect(this.master); lvl.gain.value = 0; lvl.connect(g);
      const a = this.ctx.createBufferSource(); a.buffer = this.buf.mu_jagd; a.loop = true; a.connect(g); const nodes = [a];
      if (this.buf.mu_jagd_hoch) { const b = this.ctx.createBufferSource(); b.buffer = this.buf.mu_jagd_hoch; b.loop = true; b.connect(lvl); nodes.push(b); }
      for (const n of nodes) n.start(t + .05); this.chase = { g, lvl, nodes }; }
    else if (!on && this.chase) { const c = this.chase; this.chase = null; c.g.gain.cancelScheduledValues(t); c.g.gain.setValueAtTime(c.g.gain.value, t); c.g.gain.linearRampToValueAtTime(0, t + 1.5); setTimeout(() => c.nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 1800); } },
  // Lichtschiff: aufgenommenes elektrisches Dröhnen statt Oszillatoren; ufoNear regelt weiter humNear
  hum(on) { if (!this.ctx) return; if (!kl_has('amb_ufo')) return KL_ALT.hum.call(this, on); if (this.humNode && !on) KL_ALT.hum.call(this, false); const t = this.ctx.currentTime;
    if (!this.ufoL) { if (!on) return; const near = this.ctx.createGain(); near.gain.value = .4; near.connect(this.master); this.humNear = near; this.ufoL = this.loop('amb_ufo', { gain: 0, dest: near }); if (!this.ufoL) return; }
    this.humOn = on; const g = this.ufoL.g.gain; g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(on ? .8 : 0, t + (on ? 5 : 3)); },
  // Kirchen-/Kapellenglocke: aufgenommene Röhrenglocke (VSCO), auf den Schlagton gestimmt, darunter leise der Summton; false = keine Aufnahme da
  glocke(x, y, z, f = 138, gain = 1, ref = 14, damp) { if (!this.ctx || !kl_has('kb_glocke_A4') || !kl_has('kb_glocke_D4')) return false; const d = this.at(x, y, z, ref); if (this.cut) return true;
    const lo = f * 2 < 360, b = lo ? 'kb_glocke_D4' : 'kb_glocke_A4'; this.play(b, { gain: .9 * gain, rate: f * 2 / (lo ? 293.66 : 440), dur: damp ? .8 : undefined, dest: d });
    const o = this.osc('sine', f, 0, damp ? 1 : 8); this.env(o, .1 * gain, .02, damp ? .6 : 7, 0, d); return true; },
  // Whiskey (Rabe) ahmt Geräte nach: echter Rabenlaut, per Abspielrate zur Zieltonhöhe geschoben und schmal gefiltert – der Ton hat eine Kehle, keinen Oszillator
  rabeTon(f, t0, dur, peak, dest) { const n = kl_pick('fx_rabe_', 5); if (!n || !this.ctx) return false; const c = this.ctx, t = c.currentTime + t0, b = this.buf[n], r = Math.min(2.2, Math.max(.6, f / 900)), L = Math.max(.08, dur);
    const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(); src.buffer = b; src.playbackRate.value = r; bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 4;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak * 7, t + .012); g.gain.setValueAtTime(peak * 7, t + L * .7); g.gain.linearRampToValueAtTime(0, t + L);
    src.connect(bp); bp.connect(g); g.connect(dest || this.world); src.start(t, Math.random() * Math.max(0, b.duration - L * r - .05)); src.stop(t + L + .05); return true; },
  // Vögel (Aufnahmen): Singvogel-Rufe, die erste Amsel; Taubenlaut = Whiskeys Rabenkehle
  vogel(x, y, z, n = 3) { const k = kl_pick('fx_vogel_', 3); if (!k || !this.ctx) return false; this.play(k, { gain: .45, vary: .05, x, y, z, ref: 6 }); if (n > 3) { const k2 = kl_pick('fx_vogel_', 3); this.play(k2, { gain: .35, vary: .05, delay: rand(.6, 1.1), x, y, z, ref: 6 }); } return true; },
  amsel(x, y, z) { const k = kl_pick('fx_amsel_', 3); if (!k || !this.ctx) return false; this.play(k, { gain: .6, x, y, z, ref: 8 }); return true; },
  taube(x, y, z) { if (!this.ctx || !kl_has('fx_rabe_1')) return false; const d = this.at(x, y, z, 2); let t = 0; for (const [f, du] of [[420, .28], [380, .5], [440, .22], [360, .6]]) { this.rabeTon(f, t, du, .09, d); t += du + .04; } return true; },
  // Ohrklingeln nach Schlag/Knall: schmalbandiges Rauschen um 3,3 kHz, weich ein- und ausgeblendet (statt Sinus bei 4 kHz)
  ohrklingeln(v = 1) { if (!this.ctx || !kl_has('fx_ohrklingeln')) return null; return this.play('fx_ohrklingeln', { gain: .9 * v, dest: this.master }); },
  phraseCalm() { return null; }, phraseUneasy() { return null; }, phraseDanger() { return null; }, // keine Synth-Phrasen: ohne Aufnahme lieber Stille
});
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
  if (A === 'wald') return klang_roll([[1.2, 'twig', () => W.twig(...far(8, 18))], [1, 'treeCreak', () => W.treeCreak(...far(10, 25))], [.5, 'deer', () => W.deerBark(...far(35, 60))], [.6, 'gust', () => W.gust(rand(3, 5))]]);
  if (A === 'friedhof') return klang_roll([[1, 'treeCreak', () => W.treeCreak(...far(8, 20))], [.8, 'gust', () => W.gust(rand(3, 5))], [.4, 'bark', () => W.bark(...far(70, 120), true)]]);
  if (A === 'villa') return klang_roll([[1.5, 'creak', () => W.play('woodSqueak1', { gain: .1, rate: rand(.6, .75), lp: 2200, x: -125 + rand(-5, 5), y: 6, z: 70, ref: 6 })],
    [1, 'gutter', () => W.gutter(-125 + rand(-6, 6), 62)]]);
  // Ort: Dachrinnen, ferne Hunde, Totholz, Böen (Regen, Rinnstein und Wind trägt das Bett; Krähen schlafen nachts – nur aufgeschreckt)
  return klang_roll([[3, 'gutter', () => W.gutter(...far(4, 12))], [1.2, 'bark', () => W.bark(...far(60, 110), Math.random() < .3)], [1.2, 'treeCreak', () => W.treeCreak(...far(10, 30))], [.8, 'gust', () => W.gust(rand(3, 5))]]);
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
  const outside = [2, 'outside', () => { const a = rand(0, 6.28), d = rand(40, 90), x = P.x + Math.cos(a) * d, z = P.z + Math.sin(a) * d; W.bark(x, z, false); }]; // dumpf durch die Wand
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
  { id: 'kuehl', buf: 'amb_kuehl', x: 31.3, y: 1.2, z: -16.4, ref: 1.2, gain: .4, cycle: true, on: () => klang_inH(20) && !state.outage },
  { id: 'roehre', buf: 'klTube', x: 29, y: 3.1, z: -14.5, ref: 1, gain: .012, lp: 3000, on: () => klang_inH(20) && !state.outage && typeof kitchenLight !== 'undefined' && !kitchenLight.userData.dead && kitchenLight.intensity > .5 }]; // Lüftung im Amt: Klangbett amb_lueftung
function klang_inH(x0) { const R = !state.inBasement && typeof indoorRect === 'function' ? indoorRect() : null; return !!R && Math.abs(R.x0 - x0) < .5; }
function klang_beds() {
  const S = klang_S, A = Audio, t = A.ctx.currentTime; if (!S.bufs) { S.bufs = true; try { klang_bufs(); } catch (e) { console.warn('Klang: Raumklang', e); } }
  for (const B of KL_BEDS) { let want = !!B.on() && !(typeof spannung_hushed === 'function' && spannung_hushed());
    if (B.cycle) { B.ct = (B.ct ?? rand(20, 60)) - 1; if (B.ct < 0) { B.run = !B.run; B.ct = B.run ? rand(60, 150) : rand(30, 90); if (want && B.x !== undefined) { // Kühlschrank springt an (Klick) / schaltet ab (Schütteln)
          if (B.run) A.play('switch1', { gain: .05, rate: .6, lp: 1500, x: B.x, y: B.y, z: B.z, ref: 1 }); else { A.play('woodHit2', { gain: .04, rate: 1.4, lp: 900, x: B.x, y: B.y, z: B.z, ref: 1 }); A.play('glass1', { gain: .02, rate: 1.6, hp: 1500, delay: .1, x: B.x, y: B.y + .5, z: B.z, ref: 1 }); } } }
      want = want && B.run; }
    if (want && !A.buf[B.buf] && B.buf.startsWith('amb_')) klang_load(B.buf);
    if (want && !B.h && A.buf[B.buf]) { B.h = A.play(B.buf, { loop: true, gain: 0, lp: B.lp, rate: B.rate || 1, dest: B.x !== undefined ? A.at(B.x, B.y, B.z, B.ref) : A.world }); if (B.h) B.h.g.gain.setTargetAtTime(B.gain, t, .8); }
    else if (!want && B.h) { B.h.stop(1.2); B.h = null; } }
}
// ---------------------------------------------------------------- Klangbetten je Ort: Schleifen aus Aufnahmen, weich überblendet; unbenutzte nach 20 s Stille angehalten
// [Datei, Pegel] – Dateien auf −24 LUFS, Pegel relativ; Weg: Bett → bedBus (Sprache duckt) → hushG (Regie) → bedTrim → master
const KL_ORT_BETT = {
  ort: [['amb_regen', .85], ['amb_rinne', .2], ['amb_dach', .18], ['amb_wind', .32], ['amb_leitung', .08]],
  friedhof: [['amb_regen', .7], ['amb_wind', .5], ['amb_dach', .1]],
  villa: [['amb_regen', .7], ['amb_wind', .45], ['amb_dach', .18]],
  wald: [['amb_wald', .75], ['amb_wind', .55], ['amb_regen', .22]],
  innen: [['amb_raum', .45], ['amb_regen_innen', .6], ['amb_wind', .04]],
  nr7: [['amb_raum', .3], ['amb_kueche', .4], ['amb_regen_innen', .5]],
  keller: [['amb_keller', .75], ['amb_brumm', .15]],
  amt: [['amb_lueftung', .5], ['amb_tunnel', .4], ['amb_brumm', .25]],
  kanal: [['amb_kanal', .65], ['amb_wassertunnel', .45]],
  weiss: [['amb_weiss', .5], ['amb_weiss2', .15]] };
function klang_bettOrt() { if (typeof state === 'undefined' || !state.started) return null; const a = klang_S.area;
  if (a === 'keller' || a === 'amt' || a === 'kanal' || a === 'weiss') return a;
  const R = !state.inBasement && typeof indoorRect === 'function' ? indoorRect() : null; if (R) return Math.abs(R.x0 - 20) < .5 ? 'nr7' : 'innen';
  return KL_ORT_BETT[a] ? a : 'ort'; }
function klang_betten() {
  const S = klang_S, A = Audio; if (!A.ctx || !A.hushG) return; const t = A.ctx.currentTime, ort = klang_bettOrt(), want = {};
  if (ort) for (const [n, v] of KL_ORT_BETT[ort]) { want[n] = v; if (!S.beds[n]) S.beds[n] = { h: null, v: 0, idle: 0 }; }
  if (!S.bedBus) { S.bedBus = A.ctx.createGain(); S.bedBus.connect(A.hushG); }
  for (const n in S.beds) { const B = S.beds[n], v = (want[n] || 0) * klang_windMul(n) * (typeof regen_bett === 'function' ? regen_bett(n) : 1); // R-24: Regen-Schichten spielt regen.js (je Oberfläche, mit Richtung)
    if (v && !B.h) { const b = A.buf[n]; if (!b) { klang_load(n); continue; } B.h = A.play(n, { loop: true, gain: 0, dest: S.bedBus, offset: rand(0, b.duration * .9) }); B.v = 0; if (!B.h) continue; }
    if (!B.h) continue;
    if (Math.abs(v - B.v) > .001) { B.v = v; B.h.g.gain.setTargetAtTime(v, t, v > 0 ? 1.6 : 1.1); }
    B.idle = v ? 0 : B.idle + 1; if (B.idle > 20) { B.h.stop(.5); B.h = null; B.v = 0; } }
  if (!S.bedsOn && Object.values(S.beds).some(B => B.h)) { S.bedsOn = true; A.beds2 = true; // die alten Regen-/Windschleifen und der Dauerton weichen den Betten
    try { A.rain.disconnect(); A.wind.disconnect(); if (A.drone) A.drone.gain.value = 0; } catch (e) {}
    if (A.bsm) { A.bsm.stop(3); if (A.bsm2) A.bsm2.stop(3); A.bsm = A.bsm2 = null; } }
  // Sprache und Gedanken: Betten −4 dB, Musik weicht (Gespräch regelt die Basis selbst, Gedanken-Untertitel hier)
  const el = typeof $ === 'function' ? $('subtitle') : null, sub = !!el && +el.style.opacity > .5, talk = !!state.talking || sub;
  if (talk !== S.bedTalk) { S.bedTalk = talk; S.bedBus.gain.setTargetAtTime(talk ? .63 : 1, t, talk ? .25 : 1.5); }
  const M = A.mus; if (M && !state.talking && sub !== S.subDuck) { S.subDuck = sub; M.talk.gain.setTargetAtTime(sub ? MUSIC.talk : 1, t, sub ? .3 : 1.5); } }
// ---------------------------------------------------------------- Wind (R-8): EIN Windzustand mit dem Bild (Basis: WIND.k, gust). Das Bett „ferner Wind“ atmet mit,
// die Stromleitung singt in der Böe, Wind heult und pfeift um Hausecken (drinnen gedämpft durch Wand und Fenster), Gras und Kronen rauschen je nach Bewuchs.
// Böen: Einzelstöße aus einer Aufnahme (nasse Straße, Laub, Bäume) von der Luvseite; jede hörbare Böe ist auch sichtbar (windStoss in der Basis).
function klang_windMul(n) { if (typeof WIND === 'undefined') return 1; if (n === 'amb_wind') return .65 + .45 * WIND.k; if (n === 'amb_leitung') return .6 + 1.6 * gust; return 1; }
const KL_WIND = { amb_heulen: { h: null, v: 0, idle: 0 }, amb_kronen: { h: null, v: 0, idle: 0 } };
function klang_windOrt() { // [Heulen, Gras/Kronen, Tiefpass Hz] je Ort
  const a = klang_S.area, ort = klang_bettOrt();
  if (!ort || ort === 'amt' || ort === 'kanal' || ort === 'weiss') return [0, 0, 12000];
  if (ort === 'keller') return [.1, 0, 280]; if (ort === 'nr7' || ort === 'innen') return [.38, .04, 520];
  if (a === 'wald') return [.22, 1, 12000]; if (a === 'friedhof') return [.5, .55, 12000]; if (a === 'villa') return [.55, .5, 12000];
  const P = player.pos, fd = typeof gruen_fenceDist === 'function' ? gruen_fenceDist(P.x, P.z) : 30; // am Waldrand rauscht es in den Kronen
  return [.6, .2 + .6 * Math.max(0, 1 - fd / 22), 12000]; }
function klang_wind(dt) {
  const S = klang_S, A = Audio; if (!A.ctx || !A.hushG || !S.bedBus || typeof WIND === 'undefined') return;
  S.windT = (S.windT || 0) - dt; if (S.windT > 0) return; S.windT = .2; const t = A.ctx.currentTime;
  if (!S.windLP) { S.windLP = A.ctx.createBiquadFilter(); S.windLP.type = 'lowpass'; S.windLP.frequency.value = 12000; S.windLP.connect(S.bedBus); }
  const [hl, kr, lp] = klang_windOrt(), k = WIND.k, howl = Math.pow(Math.max(0, (k - .42) / .85), 1.3); // Heulen erst bei kräftigem Wind
  S.windLP.frequency.setTargetAtTime(lp, t, .5);
  for (const n in KL_WIND) { const B = KL_WIND[n], v = n === 'amb_heulen' ? hl * howl * .55 : kr * (.12 + .5 * k);
    if (v > .005 && !B.h) { const b = A.buf[n]; if (!b) { klang_load(n); continue; } B.h = A.play(n, { loop: true, gain: 0, dest: S.windLP, offset: rand(0, b.duration * .9) }); B.v = 0; if (!B.h) continue; }
    if (!B.h) continue; if (Math.abs(v - B.v) > .002) { const up = v > B.v; B.v = v; B.h.g.gain.setTargetAtTime(v, t, up ? .7 : 1.1); }
    B.idle = v > .005 ? 0 : B.idle + 1; if (B.idle > 100) { B.h.stop(.5); B.h = null; B.v = 0; } }
}
// Umwelt-Geräusche (R-7): Busch beim Durchlaufen, Laub beim Rennen, Schaukelkette und -quietschen – Aufnahmen, sonst Ersatz aus dem Grundspiel
Object.assign(Audio, {
  busch(x, z, v = 1) { if (!this.ctx) return; const t = this.ctx.currentTime; if (t - (this.buschAt || 0) < .16) return; this.buschAt = t; const n = kl_pick('fx_busch_', 6);
    if (!n) return this.play(this.pick('stepG1', 'stepG2', 'stepG3'), { gain: .3 * v, rate: rand(1.1, 1.3), x, y: .6, z, ref: 2 });
    this.play(n, { gain: .2 + .35 * v, vary: .08, varyGain: .2, x, y: .7, z, ref: 2 }); },
  laub(x, z, v = 1) { const n = kl_pick('fx_laub_', 4); if (n && this.ctx) this.play(n, { gain: .22 * v, vary: .1, varyGain: .25, x, y: .1, z, ref: 2 }); },
  kette(x, y, z, v = 1) { if (!this.ctx) return; const n = kl_pick('fx_kette_', 4); if (n) this.play(n, { gain: Math.min(.5, .1 + .4 * v), vary: .06, x, y, z, ref: 2.5 }); else this.play(this.pick('keys1', 'keys2'), { gain: .2 * v, rate: rand(.55, .7), x, y, z, ref: 2 }); },
  quietsch(x, y, z, v = 1) { if (!this.ctx) return; const n = kl_pick('fx_quietsch_', 4); if (n) this.play(n, { gain: Math.min(.4, .04 + .36 * v), vary: .05, x, y, z, ref: 2.5 }); else this.play(this.pick('woodSqueak1', 'woodSqueak2'), { gain: .12 * v, rate: .8, x, y, z, ref: 2 }); },
});
// Böe: Einzelstoß aus der Aufnahme, von der Luvseite (Stereo nach Windrichtung), über hushG (Stille-Zonen); nie zwei innerhalb von 10 s; ohne Aufnahme der alte Weg
{ const alt = Audio.gust; Audio.gust = function (dur) { if (!this.ctx) return; const n = kl_pick('fx_boe_', 4); if (!n || typeof WIND === 'undefined') return alt.call(this, dur);
    const t = this.ctx.currentTime; if (t - (this.gustAt || -99) < 10) return; this.gustAt = t; windStoss(Math.max(dur, 3.5) * .9);
    const indoor = this.area !== 'o', P = player.pos, pan = Math.max(-.8, Math.min(.8, (-WIND.dx * -fwd.z + -WIND.dz * fwd.x) * .7));
    this.play(n, { gain: rand(.65, .95) * (indoor ? .28 : 1), rate: rand(.9, 1.06), lp: indoor ? 500 : undefined, pan, dest: this.hushG });
    if (!indoor && Math.random() < .35 && (typeof spannung_ask !== 'function' || spannung_ask('treeCreak', 'amb'))) this.treeCreak(P.x + rand(-12, 12), P.z + rand(-12, 12)); }; }
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
    try { Audio.setRoom(klang_reverb()); klang_beds(); klang_betten(); } catch (e) { console.warn('Klang: Raum', e); } }
  try { klang_wind(dt); } catch (e) { if (!S.windErr) { S.windErr = 1; console.warn('Klang: Wind', e); } }
  S.ambT -= dt; if (S.ambT < 0) { S.ambT = rand(7, 16); if (!state.talking && !ui.overlay && !menu.attract) try { klang_ambient(); } catch (e) { console.warn('Klang: Umgebung', e); } } // die Regie entscheidet, ob es wirklich klingt
});
window.__klang = { betten: KL_ORT_BETT, bettOrt: () => klang_bettOrt(), load: n => klang_load(n), S: klang_S, area: () => klang_area(), surface: i => klang_surface(i), floor: (x, z) => klang_floor(x, z), reverb: () => klang_reverb(), render: n => klang_render(n), beds: KL_BEDS }; // Testzugriff
