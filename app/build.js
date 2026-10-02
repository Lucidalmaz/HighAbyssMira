// Kopiert das Spiel (Standard: ../game aus dem Repo, sonst Umgebungsvariable HAM_SRC) in die App und stellt alle Online-Quellen auf lokale Dateien um.
// Vorher: node tools/assemble.js baut ../game/index.html aus mods/_base_source_index.html + allen Welt-Modulen.
const fs = require('fs'), path = require('path');
const SRC = process.env.HAM_SRC ? path.resolve(process.env.HAM_SRC) : path.join(__dirname, '..', 'game');
const OUT = process.env.HAM_OUT ? path.resolve(process.env.HAM_OUT) : path.join(__dirname, 'game'); // HAM_OUT: Testkopie woanders hin (z. B. HAM_SLIM=1 prüfen, ohne app/game anzufassen)
// Nicht mehr löschen und neu kopieren: laufende Spielfenster (Selbsttests) verlören sonst mitten im Lauf ihre Dateien. Nur Geändertes wird kopiert
// (Größe/Zeitstempel). Vollständig neu: HAM_CLEAN=1 node build.js
// Veröffentlichung: node build.js --release (oder HAM_RELEASE=1) nimmt ../game/index.release.html (tools/assemble.js --release) und lässt die
// Werkzeug-Seiten (preview.html, index_base.html) weg. Danach wieder `node build.js` für die Entwicklungsfassung (npm run release macht das selbst).
// Aufräumen: Dateien in app/game, die es in der Quelle nicht mehr gibt, werden gelöscht (nicht mit HAM_KEEP=1). Sicherung: fehlt die Quelle
// oder wäre mehr als ein Viertel betroffen, wird nichts gelöscht (erzwingen: HAM_PRUNE_FORCE=1). Fremde .tmp<pid>-Dateien laufender Kopien bleiben.
const RELEASE = process.argv.includes('--release') || process.env.HAM_RELEASE === '1';
const VERSION = require('./package.json').version;
if (process.env.HAM_CLEAN) fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
// R-25: Veröffentlichung (oder HAM_SLIM=1 zum Prüfen – nicht während fremder Selbsttests) ohne ungenutzte Assets und ohne Originale, deren KTX-Fassung
// das Spiel lädt (Liste: tools/release_auslassen.js). Sie werden in app/game entfernt; der nächste normale `node build.js` kopiert sie wieder.
const SKIP = RELEASE || process.env.HAM_SLIM === '1' ? new Set([...require('./tools/release_auslassen.js').auslassen(SRC).keys()].map(r => path.resolve(OUT, r))) : null;
const want = new Set(); // alles, was diese Kopie in app/game erwartet
const copy = (a, b) => { const st = fs.statSync(a);
  if (st.isDirectory()) { fs.mkdirSync(b, { recursive: true }); for (const f of fs.readdirSync(a)) copy(path.join(a, f), path.join(b, f)); return; }
  if (SKIP && SKIP.has(path.resolve(b))) { try { fs.rmSync(b); } catch (e) {} return; }
  want.add(path.resolve(b));
  try { const t = fs.statSync(b); if (t.size === st.size && t.mtimeMs >= st.mtimeMs) return; } catch (e) {}
  const tmp = b + '.tmp' + process.pid; fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, tmp); fs.renameSync(tmp, b); };
for (const f of ['sounds.js', 'sounds_extra.js', 'justin.js']) if (fs.existsSync(path.join(SRC, f))) copy(path.join(SRC, f), path.join(OUT, f));
if (fs.existsSync(path.join(SRC, 'assets'))) copy(path.join(SRC, 'assets'), path.join(OUT, 'assets'));
if (fs.existsSync(path.join(SRC, 'audio'))) copy(path.join(SRC, 'audio'), path.join(OUT, 'audio')); // Klang: Musik, Betten, Geräusche (Opus, bei Bedarf geladen – Modul klang)
// Three.js und Schriften lokal
copy(path.join(__dirname, 'node_modules/three/build'), path.join(OUT, 'vendor/three/build'));
copy(path.join(__dirname, 'node_modules/three/examples/jsm'), path.join(OUT, 'vendor/three/examples/jsm'));
copy(path.join(__dirname, 'vendor/fonts'), path.join(OUT, 'vendor/fonts'));
copy(path.join(__dirname, 'node_modules/three-mesh-bvh/build/index.module.js'), path.join(OUT, 'vendor/three-mesh-bvh/index.module.js'));
if (!RELEASE) copy(path.join(__dirname, 'tools/preview.html'), path.join(OUT, 'preview.html'));
// Online-Quellen → lokale Dateien. index.html = Spiel mit allen Welt-Modulen; index_base.html = Basis ohne Module (für tools/work.js)
const localize = file => {
  let html = fs.readFileSync(file, 'utf8');
  const rep = (a, b) => { if (!html.includes(a)) throw new Error('Nicht gefunden: ' + a); html = html.split(a).join(b); };
  rep('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js', './vendor/three/build/three.module.js');
  rep('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/', './vendor/three/examples/jsm/');
  rep('"three/addons/": "./vendor/three/examples/jsm/"', '"three/addons/": "./vendor/three/examples/jsm/",\n  "three-mesh-bvh": "./vendor/three-mesh-bvh/index.module.js"');
  html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
  html = html.replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link href="vendor/fonts/fonts.css" rel="stylesheet">');
  return html.replace('<head>', `<head>\n<script>window.IS_APP = true; window.HAM_VERSION = ${JSON.stringify(VERSION)};</script>`); // Version: einzige Quelle package.json
};
const put = (f, txt) => { want.add(path.resolve(f)); const tmp = f + '.tmp' + process.pid; fs.writeFileSync(tmp, txt); fs.renameSync(tmp, f); };
const index = path.join(SRC, RELEASE ? 'index.release.html' : 'index.html');
if (RELEASE && !fs.existsSync(index)) throw new Error('Veröffentlichung: erst node tools/assemble.js --release (fehlt: ' + index + ')');
put(path.join(OUT, 'index.html'), localize(index));
if (!RELEASE) put(path.join(OUT, 'index_base.html'), localize(path.join(__dirname, 'mods', '_base_source_index.html')));
// Verwaiste Dateien entfernen (sicher, siehe oben)
if (!process.env.HAM_KEEP) {
  const all = [], walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else all.push(path.resolve(p)); } };
  walk(OUT); const root = path.resolve(OUT) + path.sep;
  const orphans = all.filter(f => f.startsWith(root) && !want.has(f) && !/\.tmp\d+$/.test(f));
  if (!fs.existsSync(path.join(SRC, 'assets'))) console.warn('Aufräumen übersprungen: Quelle ohne assets (' + SRC + ')');
  else if (orphans.length > all.length / 4 && !process.env.HAM_PRUNE_FORCE) console.warn(`Aufräumen übersprungen: ${orphans.length} von ${all.length} Dateien wären betroffen (HAM_PRUNE_FORCE=1 erzwingt)`);
  else if (orphans.length && process.env.HAM_PRUNE_DRY) console.log(`Aufräumen (Probe): ${orphans.length} Dateien:\n  ` + orphans.map(f => path.relative(OUT, f)).join('\n  '));
  else if (orphans.length) {
    for (const f of orphans) { try { fs.rmSync(f); } catch (e) { console.warn('Nicht gelöscht:', f, e.message); } }
    const prune = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) if (e.isDirectory()) prune(path.join(d, e.name)); if (d !== OUT && !fs.readdirSync(d).length) fs.rmdirSync(d); };
    prune(OUT); console.log(`Aufgeräumt: ${orphans.length} verwaiste Dateien` + (orphans.length <= 12 ? ' (' + orphans.map(f => path.relative(OUT, f)).join(', ') + ')' : ''));
  }
}
if (SKIP) console.log(`Ausgelassen (tools/release_auslassen.js): ${SKIP.size} Dateien`);
console.log((RELEASE ? 'Veröffentlichung ' : 'Spiel ') + VERSION + ' kopiert:', fs.readdirSync(OUT).join(', '));
