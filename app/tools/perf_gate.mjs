// LEISTUNGS-GATE (Nutzer 10.10.2026: „es darf danach nicht wieder schlechter werden“).
// Misst gegen die Dauerinstanz (C:\Users\GIGABYTE\_live.sh: Instanz „normal“) und vergleicht mit app/tools/perf_baseline.json.
//   node app/tools/perf_gate.mjs                  Instanz neu laden (frischer Zustand), alles messen, vergleichen; Exit 1 bei Überschreitung
//   node app/tools/perf_gate.mjs --no-reload      ohne Neuladen (Ladezeit = aktuelle Seite, „Neues Spiel“-Messung entfällt falls schon gestartet)
//   node app/tools/perf_gate.mjs --write-baseline schreibt die Messwerte dieses Laufs als neue Referenz (nur nach bewusster Verbesserung!)
//   node app/tools/perf_gate.mjs --cold           vorher Instanz beenden, GPU-/Shader-Cache des Testprofils leeren, frisch starten (kalte Ladezeit)
//   node app/tools/perf_gate.mjs --start          startet die Instanz, falls keine läuft (sonst Abbruch mit Hinweis)
//   node app/tools/perf_gate.mjs --runs=1         nur ein Messlauf (Entwicklung; Standard sind 3 Läufe mit Median nach einem Vorlauf)
//   node app/tools/perf_gate.mjs --no-quiet       ohne Ruhe-Erkennung (Standard: warten, bis CPU-Fremdlast < 15 % und kein blender/ktx-Prozess läuft, max. 10 min)
// STABILITÄT (12.10.2026): (1) Ruhe-Erkennung vor jedem Lauf, (2) ein ungemessener Vorlauf (Neuladen) wärmt GPU-Shader-Cache und Dateicache, (3) drei Messläufe, verglichen wird der MEDIAN
// je Messgröße; ein Lauf, in dem währenddessen Fremdlast auftrat, wird einmal wiederholt.
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
const argNum = (n, d) => { const a = process.argv.slice(2).find(x => x.startsWith('--' + n + '=')); return a ? +a.split('=')[1] : d; };

// ---------- Ruhe-Erkennung: Fremdlast = CPU-Zeit aller Prozesse außer dem Spiel (electron) / Leerlauf, in % der Gesamtleistung
const BLOCKER = /^(blender|blender-launcher|ktx|toktx|basisu|ktx2-encoder|ffmpeg|whisper|piper|tts)(\.exe)?$/i;
// Schwelle 22 %: der dauerhafte Hintergrund dieses Rechners (Gigabyte Control Center ≈ 6 %, Claude-Oberfläche ≈ 4 %, Messwerkzeug selbst ≈ 2 %) liegt bei 11–16 %, die Vorgabe „< 15 %“
// ließ sich nie 30 s halten (gemessen 12.10.: 10 min Wartezeit je Lauf ohne Ergebnis). Fremdlast = alles außer Spiel, Messwerkzeug und WMI.
const NOISE_MAX = 22, QUIET_S = 30, QUIET_MAX_MIN = 10;
function externalLoad() {
  const r = cp.spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command',
    "$c=(Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors; $p=Get-CimInstance Win32_PerfFormattedData_PerfProc_Process | Where-Object { $_.Name -ne '_Total' -and $_.Name -ne 'Idle' -and $_.Name -notmatch '^electron' -and $_.Name -notmatch '^(powershell|node|conhost|WmiPrvSE)' }; " +
    "$s=($p | Measure-Object PercentProcessorTime -Sum).Sum; Write-Output ([math]::Round($s/$c,1).ToString([cultureinfo]::InvariantCulture))"], { encoding: 'utf8' });
  const v = parseFloat(String(r.stdout || '').trim());
  const procs = cp.spawnSync('tasklist', ['/fo', 'csv', '/nh'], { encoding: 'utf8' }).stdout || '';
  const blockers = [...new Set(procs.split(/\r?\n/).map(l => (l.split('","')[0] || '').replace(/"/g, '')).filter(n => BLOCKER.test(n)))];
  return { cpu: Number.isFinite(v) ? v : 0, blockers };
}
async function waitQuiet(label) {
  if (args.has('--no-quiet')) return { waited: 0, quiet: null };
  const t0 = Date.now(); let okSince = null, last = null;
  for (;;) {
    last = externalLoad(); const ruhig = last.cpu < NOISE_MAX && !last.blockers.length;
    if (ruhig) { if (okSince === null) okSince = Date.now(); if (Date.now() - okSince >= QUIET_S * 1000) return { waited: Math.round((Date.now() - t0) / 1000), quiet: true, cpu: last.cpu }; }
    else okSince = null;
    if (Date.now() - t0 > QUIET_MAX_MIN * 60000) { console.log(`  [${label}] Rechner nicht ruhig nach ${QUIET_MAX_MIN} min (Fremdlast ${last.cpu} %, ${last.blockers.join(',') || 'keine Blocker'}): messe trotzdem, Lauf gilt als „unruhig“`); return { waited: Math.round((Date.now() - t0) / 1000), quiet: false, cpu: last.cpu, blockers: last.blockers }; }
    await sleep(2000);
  }
}
const median = a => { const s = a.filter(v => v !== null && v !== undefined && Number.isFinite(v)).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[s.length >> 1] : +((s[s.length / 2 - 1] + s[s.length / 2]) / 2).toFixed(1)) : null; };

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

// Neustart des Prozesses statt Seiten-Neuladen: ein Neuladen nach einer Spielsitzung läuft mit dem alten Renderer-Speicher (4–5 GB) im Hintergrund an und braucht bei 15 GB
// Arbeitsspeicher 140–250 s statt 70–90 s (gemessen 12.10.). Ein frischer Prozess gibt den Speicher sofort frei und entspricht dem echten Start.
async function restartInstance(dir) {
  const t0 = Date.now(); bash(`bash ${LIVE_SH} stop`); await sleep(3000);
  for (let i = 0; i < 30; i++) { const l = cp.spawnSync('tasklist', ['/fo', 'csv', '/nh'], { encoding: 'utf8' }).stdout || ''; if (!/"electron\.exe"/i.test(l)) break; await sleep(1000); }
  const r = bash(`bash ${LIVE_SH} start normal`); let st = statusOf(dir);
  for (let i = 0; i < 90 && !/bereit|läuft/.test(st.state || ''); i++) { await sleep(2000); st = statusOf(dir); } // status.json wird nach der Ausgabe von „bereit“ noch nachgeführt
  if (!/bereit|läuft/.test(st.state || '')) throw new Error('Neustart: Instanz nicht bereit: ' + (r.stdout || '').slice(-200));
  return { ok: true, seconds: +((Date.now() - t0) / 1000).toFixed(1), start: st.startSeconds, mode: 'neustart' };
}
async function reloadPage(dir) {
  if (!args.has('--reload-mode')) return restartInstance(dir);
  const rj = path.join(dir, 'reload.json'); fs.rmSync(rj, { force: true });
  fs.writeFileSync(path.join(dir, 'in', 'reload.tmp'), ''); fs.renameSync(path.join(dir, 'in', 'reload.tmp'), path.join(dir, 'in', 'reload.cmd'));
  const t0 = Date.now(); while (!fs.existsSync(rj) && Date.now() - t0 < 900000) await sleep(500);
  if (!fs.existsSync(rj)) throw new Error('Neuladen ohne Ergebnis'); const r = JSON.parse(fs.readFileSync(rj, 'utf8'));
  if (!r.ok) throw new Error('Neuladen-Zeitlimit'); return r;
}
async function measureOnce(dir, lib) {
  const M = {}; const info = { start: new Date().toISOString(), instanz: path.basename(dir), noise: [] };
  const noisy = tag => { if (args.has('--no-quiet')) return; const l = externalLoad(); info.noise.push([tag, l.cpu, l.blockers.join(',')]); };

  // 1) Neu laden (frischer Zustand) → Ladezeit
  if (!args.has('--no-reload')) info.reload = await reloadPage(dir);
  noisy('nach Neuladen');
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
    noisy('Neues Spiel'); const n = JSON.parse(R.ng); M.ng_p95 = n.s.p95; M.ng_worst = n.s.worst; M.ng_over100 = n.s.over100; info.newGame = n;
    // Intro/Gespräch beenden, damit die Messpunkte nicht von einer Sequenz blockiert werden
    await runSteps(dir, 'pg_ng2_' + Date.now(), [step('clean', `(async () => { const s = document.getElementById('introSeq'); s && s.classList.remove('show'); G.state.talking = false; try { if (window.__kino && __kino.busy()) { __kino.S.T = 99; __kino.skip(); } } catch (e) {} await __pg.W(3000); return 'ok'; })()`)]);
  } else info.newGame = 'übersprungen (Spiel lief schon)';

  // 3) Messpunkte
  const prog0 = JSON.parse((await runSteps(dir, 'pg_p0_' + Date.now(), [step('p', 'JSON.stringify({ p: __pg.info().programs, l: __pg.progLater() })')])).p);
  const pts = [];
  for (const [n, x, y, z, lx, ly, lz] of PT) {
    const r = await runSteps(dir, 'pg_pt_' + n + '_' + Date.now(), [step(n, `(async () => { return JSON.stringify(await __pg.point(${JSON.stringify(n)}, ${x}, ${y}, ${z}, ${lx}, ${ly}, ${lz})); })()`, 100, 120000)]);
    const p = JSON.parse(r[n]); pts.push(p);
    p.vramMB = vramMB(); M[n + '_vram'] = p.vramMB; noisy(n);
    M[n + '_p95'] = p.steady.p95; M[n + '_worst'] = Math.max(p.arrival.worst, p.steady.worst); M[n + '_calls'] = p.calls; M[n + '_tris'] = p.tris;
  }
  info.points = pts;
  const fin = JSON.parse((await runSteps(dir, 'pg_fin_' + Date.now(), [step('f', `(() => { const i = __pg.info(), t = __pg.texMB(); return JSON.stringify({ i, tex: t, heap: __pg.heapMB(), later: __pg.progLater(), errs: (window.__errs || []).length }); })()`)])).f);
  M.vram_mb = vramMB(); M.heap_mb = fin.heap; M.tex_mb = fin.tex.mb; M.textures = fin.i.textures; M.geometries = fin.i.geometries; M.programs = fin.i.programs;
  M.recompiles = Math.max(0, fin.i.programs - prog0.p) + Math.max(0, fin.later - prog0.l);
  info.fin = fin;
  return { M, info };
}

async function main() {
  const dir = await ensureInstance();
  const lib = fs.readFileSync(path.join(HERE, 'perf_gate_page.js'), 'utf8');
  const runs = args.has('--no-reload') ? 1 : argNum('runs', 3);
  const all = []; const meta = { start: new Date().toISOString(), runs, quiet: [] };
  if (!args.has('--no-reload') && !args.has('--no-warmup') && runs > 1) {
    // ungemessener Vorlauf: warmer GPU-Shader-Cache, Dateicache, JIT – verfälscht sonst den ersten Messlauf
    const q = await waitQuiet('Vorlauf'); meta.quiet.push(q); console.log(`Vorlauf (Neuladen, nicht gemessen) … Ruhe: ${q.quiet === null ? 'aus' : q.quiet ? 'ok nach ' + q.waited + ' s' : 'NICHT erreicht'}`);
    const t0 = Date.now(); await reloadPage(dir); console.log(`  Vorlauf fertig nach ${Math.round((Date.now() - t0) / 1000)} s`);
  }
  for (let i = 1; i <= runs; i++) {
    let tries = 0;
    for (;;) {
      const q = await waitQuiet('Lauf ' + i); meta.quiet.push(q);
      console.log(`Messlauf ${i}/${runs} … Ruhe: ${q.quiet === null ? 'aus' : q.quiet ? 'ok nach ' + q.waited + ' s (Fremdlast ' + q.cpu + ' %)' : 'NICHT erreicht'}`);
      const t0 = Date.now(); const r = await measureOnce(dir, lib);
      const post = args.has('--no-quiet') ? { cpu: 0, blockers: [] } : externalLoad(); r.info.fremdlastNach = post; const nmax = Math.max(post.cpu, ...r.info.noise.map(x => x[1])); r.info.noiseMax = nmax;
      console.log(`  Lauf ${i} fertig nach ${Math.round((Date.now() - t0) / 1000)} s: Ladezeit ${r.M.load_s} s, Kreuzung p95 ${r.M.kreuzung_p95} ms, Grafikspeicher ${r.M.vram_mb} MB (Fremdlast danach ${post.cpu} %${post.blockers.length ? ', ' + post.blockers.join(',') : ''})`);
      if ((nmax >= 32 || post.blockers.length || r.info.noise.some(x => x[2])) && tries < 2 && !args.has('--no-quiet')) { tries++; console.log(`  gestört (Fremdlast bis ${nmax} % während des Laufs${post.blockers.length ? ', ' + post.blockers.join(',') : ''}) → Lauf wird wiederholt (${tries}/2)`); continue; }
      all.push(r); break;
    }
  }
  const keys = [...new Set(all.flatMap(r => Object.keys(r.M)))];
  const M = {}; for (const k of keys) M[k] = median(all.map(r => r.M[k]));
  const info = { ...all[all.length - 1].info, meta, runs: all.map(r => ({ M: r.M, start: r.info.start, stages: r.info.stages, newGame: r.info.newGame, fremdlastNach: r.info.fremdlastNach, noiseMax: r.info.noiseMax })) };
  fs.writeFileSync(LAST, JSON.stringify({ info, metrics: M }, null, 1));
  report(M, info, all);
}

function report(M, info, all = []) {
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
    const einzel = all.length > 1 ? '  [' + all.map(r => r.M[k] ?? '–').join(' / ') + ']' : '';
    rows.push([fail ? 'FEHLER' : 'ok', (tol.label || k).slice(0, 46).padEnd(46), String(b.value).padStart(9), String(v ?? '–').padStart(9), String(lim).padStart(9), (tol.unit || '').padEnd(3) + einzel]);
  }
  console.log('\nLEISTUNGS-GATE  (Referenz ' + fs.statSync(BASELINE).mtime.toISOString().slice(0, 16) + ')');
  console.log(`(Median aus ${all.length} Lauf/Läufen; Einzelwerte in eckigen Klammern)`);
  console.log(['     ', 'Messwert'.padEnd(46), 'Referenz'.padStart(9), 'Median'.padStart(9), 'Grenze'.padStart(9)].join('  '));
  for (const r of rows) console.log(r.join('  '));
  console.log(bad ? `\nGATE NICHT BESTANDEN: ${bad} Wert(e) über der Grenze.` : '\nGATE BESTANDEN.');
  process.exit(bad ? 1 : 0);
}
main().catch(e => { console.error('perf_gate: ' + (e && e.stack || e)); process.exit(2); });
