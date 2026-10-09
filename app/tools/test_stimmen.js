// Node-Test für app/mods/stimmen.js (ohne Spielinstanz): künstliches Manifest, Mock-AudioContext (Dateigröße = Dauer in ms).
// Aufruf: node tools/test_stimmen.js   (Rückgabe 1 bei Fehler)
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'mods', 'stimmen.js'), 'utf8');
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('FEHLER: ' + m); } else console.log('ok: ' + m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

function bauen(manifest, opts = {}) {
  const subs = [], starts = [], stops = [], T0 = Date.now();
  const node = () => { const n = { gain: { value: 1, cancelScheduledValues() {}, setValueAtTime() {}, linearRampToValueAtTime() {}, setTargetAtTime() {} }, frequency: { value: 0 }, Q: { value: 0 }, connect() { return n; }, disconnect() {}, positionX: { value: 0 }, positionY: { value: 0 }, positionZ: { value: 0 }, fftSize: 0, getFloatTimeDomainData(d) { d.fill(0); } }; return n; };
  const ctx = { get currentTime() { return (Date.now() - T0) / 1000; }, state: 'running', createGain: node, createBiquadFilter: node, createWaveShaper: node, createPanner: node, createAnalyser: node,
    createBufferSource() { const n = node(); n.playbackRate = { value: 1 }; n.start = (t, o) => starts.push({ buf: n.buffer, t, o }); n.stop = () => stops.push(n); return n; },
    decodeAudioData: async ab => { if (opts.decodeFail) throw new Error('decode'); return { duration: ab.byteLength / 1000 }; } };
  const sb = { console: { log() {}, warn() {}, error() {} }, performance, setTimeout, clearTimeout, setInterval: (f, t) => setInterval(f, t).unref(), Promise, Object, Math, Array, Float32Array, Set, JSON, String, Date,
    settings: { stimmen: true, stimmenVol: 1 }, saveSettings() {}, WORLD_MODS: [], WORLD_TICK: [], state: { started: true, talking: false }, ui: { paused: false, overlay: false },
    camera: { position: { x: 0, y: 1.6, z: 0 } }, renderer: { domElement: {} }, document: { getElementById: () => null, createElement: () => ({ style: {} }), body: { appendChild() {} }, pointerLockElement: null },
    addEventListener(t, f) { (sb._ev[t] = sb._ev[t] || []).push(f); }, _ev: {},
    Audio: { ctx, master: node(), world: node(), at: () => node(), init() {} },
    gtAfter: (d, f) => setTimeout(f, d), gtCancel: h => clearTimeout(h), readMs: () => 100, trX: x => x, subMin: 0, subQ: [],
    subShow(t, ms, who) { subs.push([t, ms, who]); }, subtitle(t, ms, who) { sb.subShow(t, ms, who); },
    fetch: async url => { if (/manifest/.test(url)) return opts.noManifest ? { ok: false } : { ok: true, json: async () => manifest };
      const f = url.replace('assets/stimmen/', ''), id = f.replace('.opus', ''); if (opts.missing && opts.missing.includes(f)) return { ok: false, status: 404 };
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(((manifest && manifest.z && manifest.z[id]) ? manifest.z[id][1] : 1) * 1000) }; } };
  sb.window = sb; vm.createContext(sb); vm.runInContext(SRC + '\n;this.__ST = ST; this.__say = say;', sb);
  return { sb, subs, starts, stops, ctx };
}
const M = { v: 1, wer: { DU: 'luke', LUCY: 'lucy', JUSTIN: 'justin', ZAYN: 'zayn', WENDIGO: 'a+b' },
  z: { x1: ['x1.opus', 0.6, 'luke', ''], x2: ['x2.opus', 0.4, 'lucy', 'funk'], x3: ['x3.opus', 0.5, 'justin', ''], x4: ['x4.opus', 3, 'lucy', ''], w1: ['w1.opus', .3, 'a', ''], w2: ['w2.opus', .3, 'b', ''], m: ['m.opus', .3, 'mira', '', 1.2] },
  t: { 'Hallo Welt': ['x1', 'x2', 'x3'], 'Lang': ['x4'], 'Wendig': ['w1', 'w2'], 'Kaputt': ['nix'] }, k: { traum_a: 'x3', mira_summen: 'm', schicht: ['w1', 'w2'] } };
const start = async (man, o) => { const w = bauen(man, o); for (const f of w.sb.WORLD_MODS) await f[1](); await sleep(30); return w; };

(async () => {
  let w = await start(M); const S = w.sb.__ST, fi = (t, who) => w.sb.window.__stimmen.finde(t, who);
  ok(S.man && Object.keys(S.man.z).length === 7, 'Manifest geladen');
  ok(JSON.stringify(fi('Hallo Welt', 'LUCY')) === '["x2"]', 'Sprecher LUCY -> x2');
  ok(JSON.stringify(fi('„Hallo <i>Welt</i>“', 'DU')) === '["x1"]', 'Normalisierung (Tags/Anführungszeichen), DU -> luke');
  ok(fi('Hallo Welt', 'ZAYN') === null, 'Zayn ohne Aufnahme -> stumm, kein Fehler');
  ok(fi('Hallo Welt', 'UNBEKANNT') === null, 'unbekannter Sprecher -> stumm');
  ok(JSON.stringify(fi('Wendig', 'WENDIGO')) === '["w1","w2"]', 'gestapelte Stimmen (a+b)');
  ok(fi('Kaputt', '') === null && fi('Nichts', '') === null, 'Text auf fehlende ID / unbekannter Text -> null');
  ok(w.sb.window.__stimmen.dauer('Lang', '') === 3, 'Dauer aus Manifest');
  w.sb.subShow('Lang', 1000, ''); ok(w.subs.at(-1)[1] >= 3350, 'direktes subShow: Untertitel-Dauer an Stimme angepasst (' + w.subs.at(-1)[1] + ' ms)');
  await sleep(80); ok(w.starts.length >= 1, 'Stimme startet bei subShow');
  w.subs.length = 0; w.starts.length = 0; w.stops.length = 0;
  const p = w.sb.__say([['Lang', 100, ''], ['Hallo Welt', 100, 'DU']]);
  await sleep(150); ok(w.subs[0] && w.subs[0][1] >= 3600, 'say(): Untertitel >= Stimmdauer + Reserve (' + (w.subs[0] && w.subs[0][1]) + ' ms)');
  w.sb._ev.keydown.forEach(f => f({ code: 'Enter', repeat: false })); await sleep(120);
  ok(w.stops.length >= 1, 'Enter: laufende Stimme wird gestoppt'); ok(w.subs.length >= 2, 'Enter: nächste Zeile sofort');
  w.sb._ev.keydown.forEach(f => f({ code: 'KeyX', repeat: false }));
  ok(await Promise.race([p.then(() => 1), sleep(1500).then(() => 0)]) === 1, 'X: say() endet (kein Hängen)');
  const big = { v: 1, wer: { DU: 'luke' }, z: {}, t: {}, k: {} }; for (let i = 0; i < 300; i++) { big.z['i' + i] = ['i' + i + '.opus', .1, 'luke', '']; big.t['T' + i] = ['i' + i]; }
  w = await start(big); for (let i = 0; i < 300; i++) await w.sb.window.__stimmen.spiele('T' + i, 'DU'); await sleep(50);
  const nb = Object.keys(w.sb.__ST.buf).length, nl = Object.keys(w.sb.__ST.lade).length;
  ok(nb <= 41, 'dekodierte Puffer begrenzt (' + nb + ' von 300)'); ok(nl === 0, 'keine hängenden Lade-Promises (' + nl + ')');
  for (const [name, man, o] of [['leeres Manifest', {}, {}], ['Manifest ohne t', { z: { a: ['a.opus', 1, 'luke', ''] } }, {}], ['Manifest 404', null, { noManifest: true }], ['Datei 404', M, { missing: ['x4.opus'] }], ['Decodierfehler', M, { decodeFail: true }]]) {
    let err = null, t0 = Date.now(); try { const q = await start(man, o); t0 = Date.now(); await q.sb.__say([['Lang', 50, ''], ['Hallo Welt', 50, 'LUCY'], ['Gedanke', 50, 'LUKE']]); q.sb.subShow('Lang', 500, ''); q.sb.subShow('x'); q.sb.window.__stimmen.dauer('Lang', ''); await sleep(60); } catch (e) { err = e; }
    ok(!err, name + ': kein Fehler' + (err ? ' (' + err.message + ')' : '')); ok(Date.now() - t0 < 3000, name + ': say() hängt nicht'); }
  w = await start(M);
  ok(w.sb.stimmen_spielen('traum_a', [1, 1, 1]) === true, 'Hook traum_a'); ok(w.sb.stimmen_spielen('gibts_nicht') === false, 'unbekannter Hook -> false (Rückfall-Klang)');
  ok(w.sb.stimmen_spielen('schicht', null) === true, 'Hook mit Schicht (2 Ids)'); await sleep(80); ok(w.starts.length >= 3, 'Hook-Stimmen starten (' + w.starts.length + ')');
  console.log(fails ? '\n' + fails + ' FEHLER' : '\nalle Tests bestanden'); process.exit(fails ? 1 : 0);
})();
