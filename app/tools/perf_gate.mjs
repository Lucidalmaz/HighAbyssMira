// LEISTUNGS-GATE (Nutzer 10.10.2026: „es darf danach nicht wieder schlechter werden“).
// Misst gegen die Dauerinstanz (C:\Users\GIGABYTE\_live.sh: Instanz „normal“) und vergleicht mit app/tools/perf_baseline.json.
//   node app/tools/perf_gate.mjs                  Instanz neu laden (frischer Zustand), alles messen, vergleichen; Exit 1 bei Überschreitung
//   node app/tools/perf_gate.mjs --no-reload      ohne Neuladen (Ladezeit = aktuelle Seite, „Neues Spiel“-Messung entfällt falls schon gestartet)
//   node app/tools/perf_gate.mjs --write-baseline schreibt die Messwerte dieses Laufs als neue Referenz (nur nach bewusster Verbesserung!)
//   node app/tools/perf_gate.mjs --cold           vorher Instanz beenden, GPU-/Shader-Cache des Testprofils leeren, frisch starten (kalte Ladezeit)
//   node app/tools/perf_gate.mjs --start          startet die Instanz, falls keine läuft (sonst Abbruch mit Hinweis)
// Regel: Jeder Block (Requisiten, Räume, Wendigo, Items, Modelle …) muss dieses Gate vor Commit/Release bestehen. Siehe docs/gameplay/performance_budget.md.
import fs from 'fs';
import os from 'os';
import path from 'path';
import cp from 'child_process';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = process.env.USERPROFILE || os.homedir();
const LIVE_ROOT = path.join(HOME, '_live');
const LIVE_SH = path.join(HOME, '_live.sh').replace(/\\/g, '/');
const BASELINE = path.join(HERE, 'perf_baseline.json');
const LAST = path.join(HERE, 'perf_last.json');
const args = new Set(process.argv.slice(2));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const bash = c => cp.spawnSync('bash', ['-c', c], { encoding: 'utf8' });

// ---------- feste Messpunkte (Reihenfolge ist Teil des Vertrags: Villa/Amt zuletzt, weil sie Kapitelauslöser berühren können)
// (x, y, z, Blick x, y, z) – Werte aus den bisherigen Messläufen (_int1_steps.json, _abn56_fps.json)
const PT = [
  ['kreuzung', 4, 0, -1, 40, 1.5, -1],
  ['strasse', -30, 0, 1, 40, 1.5, -2],
  ['nr7_innen', 24, .43, -13.4, 25.2, .9, -16.3],
  ['wald', 20, 0, 170, 20, 1.5, 150],
  ['villa', -917, 0, 900, -913, 1.5, 900],
  ['amt', 620, 0, -2600, 640, 1.5, -2600],
];

// ---------- Toleranzen: Grenze = Referenz * (1 + rel) + abs
const TOL = {
  load_s: { rel: .5, abs: 10, unit: 's', label: 'Ladezeit bis spielbar' },            // streut mit dem GPU-Shader-Cache (warm 72–95 s, nach Shader-Änderung bis 250 s)
  load_modules_s: { rel: .5, abs: 10, unit: 's', label: 'Modulphase' },
  load_gfx_s: { rel: .8, abs: 10, unit: 's', label: 'Grafik vorbereiten + Hochladen' },
  ng_p95: { rel: .6, abs: 8, unit: 'ms', label: 'erste 60 s Neues Spiel: p95' },       // enthält Intro/Aufwachen; Läufe streuen 36–61 ms
  ng_worst: { rel: 1, abs: 150, unit: 'ms', label: 'erste 60 s Neues Spiel: längster Stand' },
  ng_over100: { rel: 1, abs: 6, unit: '', label: 'erste 60 s: Bilder > 100 ms' },
  heap_mb: { rel: .15, abs: 150, unit: 'MB', label: 'JS-Heap' },
  vram_mb: { rel: .06, abs: 250, unit: 'MB', label: 'Grafikspeicher (GPU-Prozess, dediziert)' },
  tex_mb: { rel: .1, abs: 100, unit: 'MB', label: 'Texturspeicher (Schätzung)' },
  textures: { rel: .2, abs: 100, unit: '', label: 'Texturen (renderer.info)' },            // hängt vom Zeitpunkt der Hochlade-/Dedup-Durchgänge ab (±500)
  geometries: { rel: .5, abs: 100, unit: '', label: 'Geometrien (renderer.info)' },        // 4 700–7 700 je nach Dedup-Durchgang
  programs: { rel: .02, abs: 8, unit: '', label: 'Shader-Programme' },
  recompiles: { rel: 0, abs: 15, unit: '', label: 'Shader-Neukompilierungen nach Spielstart' }, // Ziel 0 (offen, siehe leistung_1010.md); Gate: nicht mehr als Referenz + 15
};
for (const [n] of PT) {
  TOL[n + '_p95'] = { rel: .2, abs: 14, unit: 'ms', label: n + ': p95 (Dauer)' };
  TOL[n + '_worst'] = { rel: 1, abs: 120, unit: 'ms', label: n + ': schlechtestes Bild (Ankunft+Dauer)' };
  TOL[n + '_calls'] = { rel: .1, abs: 40, unit: '', label: n + ': Zeichenaufrufe' };
  TOL[n + '_vram'] = { rel: .1, abs: 200, unit: 'MB', label: n + ': Grafikspeicher' };
  TOL[n + '_tris'] = { rel: .12, abs: 30000, unit: '', label: n + ': Dreiecke' };
}

// ---------- Dauerinstanz ansprechen
const cur = () => (fs.existsSync(path.join(LIVE_ROOT, 'current')) ? fs.readFileSync(path.join(LIVE_ROOT, 'current'), 'utf8').trim() : '');
const statusOf = d => { try { return JSON.parse(fs.readFileSync(path.join(d, 'status.json'), 'utf8')); } catch (e) { return {}; } };
async function ensureInstance() {
  let name = process.env.LIVE || cur() || 'normal1'; let dir = path.join(LIVE_ROOT, name);
  if (args.has('--cold')) {
    bash(`bash ${LIVE_SH} stop`); await sleep(2000);
    for (const p of ['_ham_testprofil']) for (const s of ['GPUCache', 'DawnCache', 'Code Cache', 'ShaderCache', 'GrShaderCache']) fs.rmSync(path.join(HOME, p, s), { recursive: true, force: true });
    console.log('kalt: Shader-/GPU-Cache des Testprofils geleert');
  }
  const ok = () => /bereit|läuft/.test(statusOf(dir).state || '');
  if (!ok()) {
    if (!args.has('--start') && !args.has('--cold')) { console.error('Keine laufende Dauerinstanz. Start: bash ~/_live.sh start normal (oder --start).'); process.exit(2); }
    console.log('starte Instanz …'); const r = bash(`bash ${LIVE_SH} start normal`); console.log((r.stdout || '').trim());
    name = cur() || name; dir = path.join(LIVE_ROOT, name);
    if (!ok()) { console.error('Instanz nicht bereit'); process.exit(2); }
  }
  return dir;
}
async function runSteps(dir, name, steps, timeoutS = 900) {
  const inD = path.join(dir, 'in'), outD = path.join(dir, 'out', name);
  fs.rmSync(outD, { recursive: true, force: true });
  fs.writeFileSync(path.join(inD, name + '.tmp'), JSON.stringify(steps)); fs.renameSync(path.join(inD, name + '.tmp'), path.join(inD, name + '.json'));
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutS * 1000) { if (fs.existsSync(path.join(outD, 'result.json'))) break; await sleep(500); }
  if (!fs.existsSync(path.join(outD, 'result.json'))) throw new Error('Lauf ' + name + ' ohne Ergebnis');
  const res = JSON.parse(fs.readFileSync(path.join(outD, 'steps.json'), 'utf8'));
  for (const k in res) { if (typeof res[k] === 'string' && res[k].startsWith('FEHLER')) throw new Error(name + '/' + k + ': ' + res[k]); }
  return res;
}
// Grafikspeicher des Spiels (dediziert, Windows-Zähler „GPU Process Memory“ je Prozess; größter Electron-Prozess)
function vramMB() {
  const r = cp.spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(HERE, 'perf_gate_vram.ps1')], { encoding: 'utf8' }); const v = parseInt((r.stdout || '').trim(), 10); return Number.isFinite(v) && v > 0 ? v : null;
}
const step = (name, js, wait = 100, timeout) => ({ name, js, shot: false, wait, ...(timeout ? { timeout } : {}) });

async function main() {
  const dir = await ensureInstance();
  const lib = fs.readFileSync(path.join(HERE, 'perf_gate_page.js'), 'utf8');
  const M = {}; const info = { start: new Date().toISOString(), instanz: path.basename(dir) };

  // 1) Neu laden (frischer Zustand) → Ladezeit
  if (!args.has('--no-reload')) {
    const rj = path.join(dir, 'reload.json'); fs.rmSync(rj, { force: true });
    fs.writeFileSync(path.join(dir, 'in', 'reload.tmp'), ''); fs.renameSync(path.join(dir, 'in', 'reload.tmp'), path.join(dir, 'in', 'reload.cmd'));
    const t0 = Date.now(); while (!fs.existsSync(rj) && Date.now() - t0 < 600000) await sleep(500);
    if (!fs.existsSync(rj)) throw new Error('Neuladen ohne Ergebnis'); info.reload = JSON.parse(fs.readFileSync(rj, 'utf8'));
    if (!info.reload.ok) throw new Error('Neuladen-Zeitlimit');
  }
  // Ladeprotokoll: __log hat „Phase @12.3s“ je Abschnitt
  const L = await runSteps(dir, 'pg_log_' + Date.now(), [step('log', 'JSON.stringify({ log: window.__log || [], started: !!G.state.started })')]);
  const lg = JSON.parse(L.log); const at = re => { const e = lg.log.find(s => re.test(s)); return e ? +/@([\d.]+)s/.exec(e)[1] : null; };
  const fertig = at(/^Fertig @/), erstes = at(/^Grafik vorbereiten @/), letzteMod = at(/^Kollision @/);
  M.load_s = fertig; M.load_modules_s = letzteMod !== null ? +(letzteMod - (at(/^Kirchberg @/) ?? 4)).toFixed(1) : null;
  M.load_gfx_s = fertig !== null && erstes !== null ? +(fertig - erstes).toFixed(1) : null;
  info.stages = Object.fromEntries(['Modelle laden', 'Kirchberg', 'Ausbau Ost/West', 'Fassaden', 'Leistung', 'Kollision', 'Grafik vorbereiten', 'Erstes Bild fertig', 'Texturen hochladen', 'Schatten vorbereiten', 'Fertig'].map(k => { const e = lg.log.find(x => x.startsWith(k + ' @')); return [k, e ? +/@([\d.]+)s/.exec(e)[1] : null]; }));

  // 2) Messbibliothek + Neues Spiel: erste 60 s (Sampler läuft ab Installation, Spiel startet sofort)
  const gestartet = lg.started;
  await runSteps(dir, 'pg_lib_' + Date.now(), [step('lib', lib)]);
  if (!gestartet) {
    const R = await runSteps(dir, 'pg_ng_' + Date.now(), [step('ng', `(async () => { const pg = __pg; window.__errs = []; addEventListener('error', e => __errs.push(String(e.message)));
      window.__testMove = true; const st = document.getElementById('start'); st && st.classList.remove('show'); G.menu && (G.menu.attract = false); document.body.classList.remove('menu');
      await pg.W(8000); /* wie im Betrieb: Menü steht einige Sekunden, bevor „Neues Spiel“ geklickt wird (Nachbilder/Programme übersetzen dort) */ const i0 = pg.mark(), p0 = pg.info().programs, la = pg.progLater(); G.beginGame(); await pg.W(60000); const s = pg.stat(i0);
      return JSON.stringify({ s, newPrograms: pg.info().programs - p0, later: pg.progLater() - la, heap: pg.heapMB() }); })()`, 100, 120000)]);
    const n = JSON.parse(R.ng); M.ng_p95 = n.s.p95; M.ng_worst = n.s.worst; M.ng_over100 = n.s.over100; info.newGame = n;
    // Intro/Gespräch beenden, damit die Messpunkte nicht von einer Sequenz blockiert werden
    await runSteps(dir, 'pg_ng2_' + Date.now(), [step('clean', `(async () => { const s = document.getElementById('introSeq'); s && s.classList.remove('show'); G.state.talking = false; try { if (window.__kino && __kino.busy()) { __kino.S.T = 99; __kino.skip(); } } catch (e) {} await __pg.W(3000); return 'ok'; })()`)]);
  } else info.newGame = 'übersprungen (Spiel lief schon)';

  // 3) Messpunkte
  const prog0 = JSON.parse((await runSteps(dir, 'pg_p0_' + Date.now(), [step('p', 'JSON.stringify({ p: __pg.info().programs, l: __pg.progLater() })')])).p);
  const pts = [];
  for (const [n, x, y, z, lx, ly, lz] of PT) {
    const r = await runSteps(dir, 'pg_pt_' + n + '_' + Date.now(), [step(n, `(async () => { return JSON.stringify(await __pg.point(${JSON.stringify(n)}, ${x}, ${y}, ${z}, ${lx}, ${ly}, ${lz})); })()`, 100, 120000)]);
    const p = JSON.parse(r[n]); pts.push(p);
    p.vramMB = vramMB(); M[n + '_vram'] = p.vramMB;
    M[n + '_p95'] = p.steady.p95; M[n + '_worst'] = Math.max(p.arrival.worst, p.steady.worst); M[n + '_calls'] = p.calls; M[n + '_tris'] = p.tris;
  }
  info.points = pts;
  const fin = JSON.parse((await runSteps(dir, 'pg_fin_' + Date.now(), [step('f', `(() => { const i = __pg.info(), t = __pg.texMB(); return JSON.stringify({ i, tex: t, heap: __pg.heapMB(), later: __pg.progLater(), errs: (window.__errs || []).length }); })()`)])).f);
  M.vram_mb = vramMB(); M.heap_mb = fin.heap; M.tex_mb = fin.tex.mb; M.textures = fin.i.textures; M.geometries = fin.i.geometries; M.programs = fin.i.programs;
  M.recompiles = Math.max(0, fin.i.programs - prog0.p) + Math.max(0, fin.later - prog0.l);
  info.fin = fin;

  fs.writeFileSync(LAST, JSON.stringify({ info, metrics: M }, null, 1));
  report(M, info);
}

function report(M, info) {
  if (args.has('--write-baseline')) {
    const metrics = {}; for (const k in M) if (M[k] !== null) metrics[k] = { value: M[k], ...TOL[k] };
    fs.writeFileSync(BASELINE, JSON.stringify({ geschrieben: info.start, hinweis: 'Referenz des Leistungs-Gates; nur nach bewusster, gemessener Verbesserung neu schreiben (perf_gate.mjs --write-baseline).', metrics }, null, 1));
    console.log('Referenz geschrieben: ' + BASELINE); return;
  }
  if (!fs.existsSync(BASELINE)) { console.error('Keine Referenz (perf_baseline.json). Erst: --write-baseline'); process.exit(2); }
  const B = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).metrics; const rows = []; let bad = 0;
  for (const k of Object.keys(B)) {
    const b = B[k], v = M[k]; const tol = TOL[k] || b; const lim = +(b.value * (1 + (tol.rel ?? b.rel ?? 0)) + (tol.abs ?? b.abs ?? 0)).toFixed(1);
    const fail = v === null || v === undefined ? true : v > lim; if (fail) bad++;
    rows.push([fail ? 'FEHLER' : 'ok', (tol.label || k).slice(0, 46).padEnd(46), String(b.value).padStart(9), String(v ?? '–').padStart(9), String(lim).padStart(9), tol.unit || '']);
  }
  console.log('\nLEISTUNGS-GATE  (Referenz ' + fs.statSync(BASELINE).mtime.toISOString().slice(0, 16) + ')');
  console.log(['     ', 'Messwert'.padEnd(46), 'Referenz'.padStart(9), 'jetzt'.padStart(9), 'Grenze'.padStart(9)].join('  '));
  for (const r of rows) console.log(r.join('  '));
  console.log(bad ? `\nGATE NICHT BESTANDEN: ${bad} Wert(e) über der Grenze.` : '\nGATE BESTANDEN.');
  process.exit(bad ? 1 : 0);
}
main().catch(e => { console.error('perf_gate: ' + (e && e.stack || e)); process.exit(2); });
