// Baut das Spiel aus der Basis + allen Welt-Modulen zusammen.
//   node tools/assemble.js [ausgabe.html]   (Standard: ../game/index.html)
// Basis: mods/_base_source_index.html (unverändertes Spiel). Danach alle mods/<bereich>_patch.py (def apply(s)) in Modul-Reihenfolge,
// dann jedes mods/<bereich>.js vor der Zeile // @@WELT-MODULE@@ – Reihenfolge laut BRIEF.md.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const APP = path.resolve(__dirname, '..'), MODS = path.join(APP, 'mods');
const ORDER = ['ausbau_nord', 'ausbau_ost_west', 'strasse', 'gruen', 'fassaden', 'innen_ort', 'innen_kapitel', 'leben'];
const OUT = path.resolve(process.argv[2] || path.join(APP, '..', 'game', 'index.html'));
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
    try { new (Object.getPrototypeOf(async function () {}).constructor)(src); } catch (e) { throw new Error(`Syntaxfehler in ${area}.js: ${e.message}`); }
    html = html.replace(MARK, () => src.replace(/\s*$/, '') + '\n' + MARK);
    used.push(area + '.js');
  }
}
// Einheitliche Zeilenenden wie in der Basis (Python-Patches liefern \n, die Module teils \r\n)
const crlf = /\r\n/.test(fs.readFileSync(path.join(MODS, '_base_source_index.html'), 'utf8').slice(0, 4000));
html = html.replace(/\r\n/g, '\n'); if (crlf) html = html.replace(/\n/g, '\r\n');
fs.writeFileSync(OUT, html);
console.log(`Zusammengebaut (${used.length} Teile): ${used.join(', ')}\n→ ${OUT} (${(html.length / 1024).toFixed(0)} KB)`);
