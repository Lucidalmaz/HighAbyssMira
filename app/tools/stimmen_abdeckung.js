// Abdeckungsmessung Sprachausgabe: jede Fundstelle eines Textes im Spielcode (Ausgabe von HAM_Stimmen\spiel\extrahiere.js: zeilen_alle.json)
// wird mit der Zuordnung der Spielseite (mods/stimmen.js: st_finde, Manifest game/assets/stimmen/manifest.json) verglichen.
//   node tools/stimmen_abdeckung.js <zeilen_alle.json> [manifest.json] [--md ausgabe.md]
// Ergebnis: je Sprecher/Grund Zahl der Fundstellen, vertont ja/nein; Rueckgabe 1, wenn eine als gesprochen erkannte Zeile keine Stimme findet.
const fs = require('fs'), path = require('path'), vm = require('vm');
const mdIx = process.argv.indexOf('--md'), args = process.argv.slice(2).filter((a, i) => !a.startsWith('--') && process.argv[i + 1] !== '--md');
const alle = JSON.parse(fs.readFileSync(args[0], 'utf8'));
const man = JSON.parse(fs.readFileSync(args[1] || path.join(__dirname, '..', '..', 'game', 'assets', 'stimmen', 'manifest.json'), 'utf8'));
const SRC = fs.readFileSync(path.join(__dirname, '..', 'mods', 'stimmen.js'), 'utf8');
const sb = { console: { log() {}, warn() {}, error() {} }, performance, setTimeout, clearTimeout, setInterval: () => 0, Promise, Object, Math, Array, Float32Array, Set, JSON, String, Date,
  settings: {}, saveSettings() {}, WORLD_MODS: [], WORLD_TICK: [], state: {}, ui: {}, camera: { position: {} }, renderer: {}, document: { getElementById: () => null }, addEventListener() {},
  Audio: {}, gtAfter() {}, gtCancel() {}, readMs: () => 0, trX: x => x, subMin: 0, subQ: [], subShow() {}, subtitle() {}, fetch: async () => ({ ok: true, json: async () => man }) };
sb.window = sb; vm.createContext(sb); vm.runInContext(SRC + '\n;this.__ST = ST; this.__finde = st_finde;', sb);
(async () => {
  for (const f of sb.WORLD_MODS) await f[1](); await new Promise(r => setTimeout(r, 50));
  if (!sb.__ST.man) { console.error('Manifest nicht geladen'); process.exit(2); }
  const norm = t => String(t == null ? '' : t).replace(/<[^>]*>/g, '').replace(/[„“”"‚‘»«]/g, '').replace(/\s+/g, ' ').trim();
  const nach = {}, fehl = [], seen = new Set();
  const add = (g, e, v) => { const k = g + (v ? ' | vertont' : ' | OHNE Stimme'); (nach[k] = nach[k] || []).push(e); };
  for (const e of alle) {
    const key = e.mod + '|' + e.who + '|' + norm(e.text); if (seen.has(key)) continue; seen.add(key);   // eindeutige Text x Sprecher je Modul
    const g = e.grund ? e.grund.replace(/ \(.*/, '') : 'gesprochen';
    if (g !== 'gesprochen' && !/^ohne_besetzung/.test(g)) { add(g, e, false); continue; }
    if (/^\(/.test(norm(e.text)) && g !== 'gesprochen') { add('regie_klammer', e, false); continue; }
    const ids = sb.__finde(e.text, e.who || ''), v = !!(ids && ids.length);
    if (!v && g === 'gesprochen' && /\([^)]*\)/.test(norm(e.text))) { add('regie_klammer', e, false); continue; }   // Regieanweisung in der Zeile: bewusst stumm (baue_spiel.py / fertig_einsetzen.py)
    if (g === 'gesprochen' && /^\(.*\)$/.test(norm(e.text))) { add('regie_klammer', e, v); continue; }
    if (g === 'gesprochen' && !v && e.key && sb.__ST.man.k[e.key]) { add('gesprochen', e, true); continue; }       // nur ueber Hook-Schluessel
    add(g === 'gesprochen' ? 'gesprochen' : g, e, v);
    if (!v && g === 'gesprochen') fehl.push(e);
  }
  const L = [], zeile = (k, a) => { L.push(`| ${k.split(' | ')[0]} | ${k.split(' | ')[1]} | ${a.length} |`); };
  L.push('| Gruppe | Stimme | Fundstellen |', '|---|---|---|');
  for (const k of Object.keys(nach).sort()) zeile(k, nach[k]);
  console.log(L.join('\n'));
  if (process.argv.includes('--detail')) for (const k of Object.keys(nach).sort()) if (/OHNE/.test(k) && !/^(erzaehlung|gedanke)/.test(k)) {
    console.log('\n== ' + k); for (const e of nach[k]) console.log('  ', e.mod, e.zeile, '|', e.who, '|', norm(e.text).slice(0, 80).replace(/\n/g, ' ')); }
  console.log('\nGesprochene Zeilen ohne Stimme:', fehl.length);
  for (const e of fehl) console.log('  ', e.mod, e.zeile, '|', e.who, '|', norm(e.text).slice(0, 90));
  if (mdIx > 0) fs.writeFileSync(process.argv[mdIx + 1], L.join('\n') + '\n');
  process.exit(fehl.length ? 1 : 0);
})();
