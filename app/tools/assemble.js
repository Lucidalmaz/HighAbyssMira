// Baut das Spiel aus der Basis + allen Welt-Modulen zusammen.
//   node tools/assemble.js [ausgabe.html] [--release]   (Standard: ../game/index.html; Veröffentlichung: ../game/index.release.html)
// Basis: mods/_base_source_index.html (unverändertes Spiel). Danach alle mods/<bereich>_patch.py (def apply(s)) in Modul-Reihenfolge,
// dann jedes mods/<bereich>.js vor der Zeile // @@WELT-MODULE@@ – Reihenfolge laut BRIEF.md.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const APP = path.resolve(__dirname, '..'), MODS = path.join(APP, 'mods');
// Fassung 3 (AP-12): justin vor figuren (Nachbild-Klone übernehmen Material/Helm; Flicken werden beim Klonen entfernt)
// Fassung 3 (AP-16): amt nach zimmer7 (Kapitel 2, Ebene −2: neue Räume, Nadeldrucker, Lautsprecher, Nebenaufgaben – braucht innen_kapitel, lwo, beobachter, feuer)
// Fassung 3 (AP-18): neben3 (Kap.-3-Nebenaufgaben: Register, RH, Glocken-Joker, Kapelle/Pfarrhaus/Gisela/Peters Zimmer) und remise (Remise am Hof, Dina) nach karte
// Fassung 3 (AP-03): neu eingetragen (Dateien legen spätere APs an): katzen, kirchberg, post nach leben; villa nach anwesen; lwo vor beobachter; sammeln nach entdecker
// AP Q-8 „Bewohnt“: bewohnt ganz hinten (dekoriert die Innenräume aller vorherigen Module beim ersten Betreten; umhüllt kirchberg_rein und VILLA_BAU.nr3)
const ORDER = ['kapitel', 'teststand', 'ausbau_nord', 'ausbau_ost_west', 'strasse', 'gruen', 'fassaden', 'innen_ort', 'innen_kapitel', 'leben', 'katzen', 'kirchberg', 'post', 'nr4', 'zeichen', 'ausruestung', 'uebergang', 'fotos', 'album', 'geheimnisse', 'justin', 'figuren', 'albers', 'gedanken', 'whiskey', 'tausch', 'beutel', 'kiffen', 'visionen', 'anwesen', 'villa', 'wald', 'tiefwald', 'waldleben', 'hungrige', 'lwo', 'beobachter', 'zayn', 'cleo', 'schrecken', 'entdecker', 'sammeln', 'karte', 'neben3', 'neben4', 'remise','akte', 'klang', 'spannung', 'traum', 'weiss', 'kino', 'kapitel1', 'tod', 'feuer', 'augenzu', 'zimmer7', 'amt', 'lucy3', 'kapitel3', 'kamera', 'kapitel5', 'neben5', 'kapitel6', 'raender', 'bewohnt'];
// Veröffentlichung: --release (oder HAM_RELEASE=1) → ../game/index.release.html; die Test-index.html bleibt unberührt (parallele Selbsttests).
// Setzt window.IS_RELEASE (Basis: DEV = false → kein Story-Editor, keine F3-Messanzeige, keine Entwickler-Hinweise) und entfernt alle
// Testzugriffe: Zuweisungen an window.G, window.HAM_UI und window.__* – außer denen, die das Spiel selbst liest (Ladeanzeige, __traumWake).
const RELEASE = process.argv.includes('--release') || process.env.HAM_RELEASE === '1';
const OUT = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(APP, '..', 'game', RELEASE ? 'index.release.html' : 'index.html'));
const KEEP_HOOKS = new Set(['__ready', '__stage', '__log', '__t0', '__traumWake']);
const MARK = '// @@WELT-MODULE@@';
const PY = process.platform === 'win32' ? 'python' : 'python3';

let html = fs.readFileSync(path.join(MODS, '_base_source_index.html'), 'utf8');
if (!html.includes(MARK)) throw new Error('Marke fehlt in der Basis: ' + MARK);
const known = new Set(ORDER);
for (const f of fs.readdirSync(MODS)) {
  const m = f.match(/^([a-z0-9_]+?)(_patch\.py|\.js)$/);
  if (m && !known.has(m[1])) console.warn('Warnung: ' + f + ' ist nicht in der Modul-Reihenfolge und wird ignoriert');
}
const used = [];
for (const area of ORDER) {
  const patch = path.join(MODS, area + '_patch.py');
  if (fs.existsSync(patch)) {
    const tmp = path.join(require('os').tmpdir(), `ham_${process.pid}_${area}.html`);
    fs.writeFileSync(tmp, html);
    cp.execFileSync(PY, ['-c', 'import importlib.util,sys\nspec=importlib.util.spec_from_file_location("p",sys.argv[1]);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\np=sys.argv[2];s=open(p,encoding="utf-8").read();open(p,"w",encoding="utf-8").write(m.apply(s))', patch, tmp], { stdio: 'inherit' });
    html = fs.readFileSync(tmp, 'utf8'); fs.rmSync(tmp, { force: true });
    used.push(area + '_patch.py');
  }
  const mod = path.join(MODS, area + '.js');
  if (fs.existsSync(mod)) {
    const src = fs.readFileSync(mod, 'utf8');
    // Syntax vorab prüfen – ein kaputtes Modul würde sonst das ganze Modul-Script (und damit das Spiel) stoppen
    try { new (Object.getPrototypeOf(async function () {}).constructor)(src); } catch (e) { if (RELEASE) throw new Error(`Syntaxfehler in ${area}.js: ${e.message}`); console.warn(`!!! Syntaxfehler in ${area}.js – Modul ÜBERSPRUNGEN (nur Testbau): ${e.message}`); continue; }
    html = html.replace(MARK, () => src.replace(/\s*$/, '') + '\n' + MARK);
    used.push(area + '.js');
  }
}
// Einheitliche Zeilenenden wie in der Basis (Python-Patches liefern \n, die Module teils \r\n)
const crlf = /\r\n/.test(fs.readFileSync(path.join(MODS, '_base_source_index.html'), 'utf8').slice(0, 4000));
html = html.replace(/\r\n/g, '\n'); if (crlf) html = html.replace(/\n/g, '\r\n');
// Zwischenversion: HAM_TESTSTAND=<letztes Kapitel> → nach diesem Kapitel zeigt mods/teststand.js „Ende der Testversion“
if (process.env.HAM_TESTSTAND) html = html.replace('<head>', `<head>
<script>window.HAM_TESTSTAND = ${+process.env.HAM_TESTSTAND};</script>`);
if (RELEASE) {
  if (!html.includes('<head>')) throw new Error('Veröffentlichung: <head> fehlt');
  html = html.replace('<head>', '<head>\n<script>window.IS_RELEASE = true;</script>');
  const MS = '<script type="module">', at = html.indexOf(MS); if (at < 0) throw new Error('Veröffentlichung: Modul-Script fehlt');
  html = html.slice(0, at + MS.length) + '\nconst __devSink = {}; // Veröffentlichung: Testzugriffe landen hier statt am window' + html.slice(at + MS.length);
  const gone = new Map();
  html = html.replace(/\bwindow\.(__[A-Za-z0-9_]+|G|HAM_UI)(\s*=(?!=))/g, (all, name, eq) => { if (KEEP_HOOKS.has(name)) return all; gone.set(name, (gone.get(name) || 0) + 1); return '__devSink.' + name + eq; });
  // Was jetzt noch gelesen wird, ist undefined – erlaubt nur als reine Prüfung (if (window.G) …, window.__testMove && …), nie mit Zugriff dahinter
  const bad = []; for (const m of html.matchAll(/\bwindow\.(__[A-Za-z0-9_]+|G|HAM_UI)\b(\s*[.[(])?/g)) if (!KEEP_HOOKS.has(m[1]) && m[2]) bad.push(html.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' '));
  if (bad.length) throw new Error('Veröffentlichung: entfernte Testzugriffe werden noch benutzt:\n  ' + bad.join('\n  '));
  console.log(`Veröffentlichung: ${[...gone.values()].reduce((a, b) => a + b, 0)} Testzugriffe entfernt (${[...gone.keys()].join(', ')})`);
}
// Gesamtes Modul-Script (Basis + Module) auf Syntaxfehler prüfen – ein Fehler dort stoppt das ganze Spiel
{ const re = /<script type="module">([\s\S]*?)<\/script>/g; let m, i = 0;
  while ((m = re.exec(html))) { const tmp = path.join(require('os').tmpdir(), `ham_${process.pid}_${i++}.mjs`); fs.writeFileSync(tmp, m[1]);
    try { cp.execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }); } catch (e) { throw new Error('Syntaxfehler im zusammengesetzten Spiel:\n' + String(e.stderr).slice(0, 1500)); } finally { fs.rmSync(tmp, { force: true }); } } }
{ const tmp = OUT + '.tmp' + process.pid; fs.writeFileSync(tmp, html); fs.renameSync(tmp, OUT); } // atomar: laufende Kopien lesen nie eine halbe Datei
console.log(`Zusammengebaut (${used.length} Teile): ${used.join(', ')}\n→ ${OUT} (${(html.length / 1024).toFixed(0)} KB)`);
