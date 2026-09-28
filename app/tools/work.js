// Private Testkopie des Spiels für einen Bereich (parallel zu anderen), ohne die Assets zu kopieren.
//   node tools/work.js make <bereich> [patch.py] [modul.js]  -> work/<bereich>/ (index.html = game/index_base.html + Patch + Modul vor // @@WELT-MODULE@@)
//   node tools/work.js run  <bereich> <steps.json> <ausgabeordner> [timeoutSek] [seite, z. B. 'preview.html?a=ms/door1' oder '...&f=fbx&file=Car.fbx']  -> Selbsttest mit Screenshots (eigenes Profil, stiehlt keinen Fokus)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const APP = path.resolve(__dirname, '..'), GAME = path.join(APP, 'game');
const [cmd, area, a1, a2, a3] = process.argv.slice(2);
if (!area || !/^[a-z0-9_]+$/.test(area)) { console.error('Bereichsname fehlt/ungültig'); process.exit(1); }
const W = path.join(APP, 'work', area);
if (cmd === 'make') {
  fs.mkdirSync(W, { recursive: true });
  for (const d of ['assets', 'vendor']) { const l = path.join(W, d); if (!fs.existsSync(l)) fs.symlinkSync(path.join(GAME, d), l, 'junction'); } // Windows: Junction, sonst Symlink
  for (const f of fs.readdirSync(GAME)) { const p = path.join(GAME, f); if (fs.statSync(p).isFile() && !/^index(_base)?\.html$/.test(f)) fs.copyFileSync(p, path.join(W, f)); }
  // Basis ohne die übrigen Welt-Module (build.js schreibt sie), damit das getestete Modul nicht doppelt drin ist
  const base = path.join(GAME, 'index_base.html'); let html = fs.readFileSync(fs.existsSync(base) ? base : path.join(GAME, 'index.html'), 'utf8');
  if (a1 && a1 !== '-') { const tmp = path.join(W, '_in.html'), out = path.join(W, '_out.html'); fs.writeFileSync(tmp, html);
    cp.execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', `import importlib.util,sys\nspec=importlib.util.spec_from_file_location('p',r'''${path.resolve(a1)}''');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)\ns=open(r'''${tmp}''',encoding='utf-8').read();s=m.apply(s);open(r'''${out}''','w',encoding='utf-8').write(s)`], { stdio: 'inherit' });
    html = fs.readFileSync(out, 'utf8'); }
  if (a2 && a2 !== '-') { const mark = '// @@WELT-MODULE@@'; if (!html.includes(mark)) throw new Error('Marke fehlt'); const src = fs.readFileSync(path.resolve(a2), 'utf8'); html = html.replace(mark, () => src + '\n' + mark); }
  fs.writeFileSync(path.join(W, 'index.html'), html); console.log('Testkopie bereit:', W);
} else if (cmd === 'run') {
  const steps = path.resolve(a1), out = path.resolve(a2), to = (+a3 || 300) * 1000, page = process.argv[7];
  // Höchstens 3 Spielinstanzen gleichzeitig (RAM/VRAM): Slot-Sperrdateien, veraltete (>12 min) werden übernommen
  const L = path.join(APP, 'work', '_locks'); fs.mkdirSync(L, { recursive: true }); let slot = null;
  const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  for (let tries = 0; !slot && tries < 2400; tries++) {
    for (const n of ['slot0', 'slot1', 'slot2']) { const f = path.join(L, n); try { if (fs.existsSync(f) && Date.now() - fs.statSync(f).mtimeMs > 12 * 60e3) fs.rmSync(f, { force: true }); fs.writeFileSync(f, area + ' ' + process.pid, { flag: 'wx' }); slot = f; break; } catch (e) {} }
    if (!slot) sleep(1000);
  }
  process.on('exit', () => { try { slot && fs.rmSync(slot, { force: true }); } catch (e) {} });
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const electron = require(path.join(APP, 'node_modules', 'electron')); // Pfad zur Electron-Programmdatei (alle Plattformen)
  const r = cp.spawnSync(electron, [APP, '--selftest', '--window', `--root=${W}`, `--udd=${path.join(APP, 'work', '_udd_' + area)}`, `--out=${out}`, `--steps=${steps}`, ...(page ? [`--page=${page}`] : [])], { timeout: to, stdio: 'ignore' });
  const sj = path.join(out, 'steps.json'), rj = path.join(out, 'result.json');
  console.log(fs.existsSync(sj) ? fs.readFileSync(sj, 'utf8') : 'KEINE steps.json (Absturz/Timeout?)');
  if (fs.existsSync(rj)) { const r2 = JSON.parse(fs.readFileSync(rj, 'utf8')); console.log('Ladezeit s:', r2.seconds, '\nFehler/Warnungen:', JSON.stringify((r2.logs || []).filter(x => !/Security|FBXLoader/.test(x)).slice(0, 40), null, 1)); }
} else console.error('make | run');
