// High Abyss Mira – Desktop-App (Electron). Lädt das Spiel aus dem Ordner "game" über ein eigenes app://-Protokoll,
// damit auch große Modelle und Sounds direkt als Dateien geladen werden können.
// Veröffentlicht (app.isPackaged): kein Menü, keine Entwicklerwerkzeuge/Neuladen-Tasten, keine Test-Schalter, nur eine Instanz.
// Immer: Warnungen und Fehler der Seite → <Benutzerdaten>/log.txt; Absturz/Hänger der Seite → deutscher Dialog mit „Neu laden“.
const { app, BrowserWindow, protocol, net, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const PACKAGED = app.isPackaged;
// Test-/Entwicklerschalter (--selftest, --steps, --root, --page, --udd, --angle, --out, --shot, --readyTimeout) gelten nur im Entwicklungsbetrieb
const argv = n => PACKAGED ? undefined : process.argv.find(a => a.startsWith('--' + n + '='))?.slice(n.length + 3);
const selftest = !PACKAGED && process.argv.includes('--selftest');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);
// Immer die starke Grafikkarte, keine Drosselung im Hintergrund
app.commandLine.appendSwitch('force_high_performance_gpu');
// Grafik-Übersetzer wählbar (Test): --angle=gl|vulkan|d3d11
const _ang = argv('angle'); if (_ang) app.commandLine.appendSwitch('use-angle', _ang);
app.commandLine.appendSwitch('ignore-gpu-blocklist');
// Übersetzte Shader-Programme zwischen den Starts behalten: Standard sind 6 MB Programm-Speicher – das Spiel hat ~500 Programme (> 25 MB), ohne mehr Platz wurde bei jedem Start fast alles neu übersetzt
app.commandLine.appendSwitch('gpu-program-cache-size-kb', String(256 * 1024));
app.commandLine.appendSwitch('gpu-disk-cache-size-kb', String(512 * 1024));
app.commandLine.appendSwitch('disable-renderer-backgrounding');
// Speicher: nach dem Laden gibt das Spiel ~3,5 GB Texturdaten frei (KTXF) – window.gc() räumt sie einmal sofort weg, statt auf die nächste große Bereinigung zu warten
app.commandLine.appendSwitch('js-flags', '--expose-gc');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required'); // Menümusik ohne ersten Klick
// Testläufe: Fenster außerhalb des Bildschirms, weiterhin gerendert (keine Verdeckungs-Drosselung)
if (selftest) app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

// --root=ORDNER: Spiel aus einem anderen Ordner laden (Testkopien); --udd=ORDNER: eigener Profilordner (parallele Testläufe)
const GAME = argv('root') ? path.resolve(argv('root')) : path.join(__dirname, 'game');
if (argv('udd')) app.setPath('userData', path.resolve(argv('udd')));

// ---- Protokoll: log.txt im Benutzerordner (bei > 1 MB beim Start nach log.old.txt verschoben)
let LOG = null;
function log(level, msg) {
  try {
    if (!LOG) { LOG = path.join(app.getPath('userData'), 'log.txt'); fs.mkdirSync(path.dirname(LOG), { recursive: true });
      try { if (fs.statSync(LOG).size > 1e6) fs.renameSync(LOG, path.join(path.dirname(LOG), 'log.old.txt')); } catch (e) {}
      fs.appendFileSync(LOG, `\n==== ${new Date().toISOString()} · High Abyss Mira ${app.getVersion()} · Electron ${process.versions.electron}${PACKAGED ? '' : ' · Entwicklung'} ====\n`); }
    fs.appendFileSync(LOG, `[${new Date().toISOString()}] ${level} ${String(msg).slice(0, 4000)}\n`);
  } catch (e) {}
}
process.on('uncaughtException', e => log('HAUPTPROZESS', e && e.stack || e));

// ---- Nur eine Instanz (nicht bei Selbsttests: die laufen parallel mit eigenen Profilen)
const single = selftest || app.requestSingleInstanceLock();
if (!single) app.quit();
else app.on('second-instance', () => { const w = BrowserWindow.getAllWindows()[0]; if (w) { if (w.isMinimized()) w.restore(); w.show(); w.focus(); } });

app.whenReady().then(() => {
  if (!single) return;
  if (PACKAGED) Menu.setApplicationMenu(null);
  const ROOT = path.resolve(GAME);
  protocol.handle('app', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(ROOT, rel));
    // nur Dateien INNERHALB des Spielordners (Trennzeichen nach dem Ordnernamen: „game2\…“ zählt nicht als „game\…“)
    if (!file.startsWith(ROOT + path.sep)) return new Response('verboten', { status: 403 });
    if (!fs.existsSync(file)) { console.warn('FEHLT: ' + rel); log('FEHLT', rel); return new Response('fehlt', { status: 404 }); }
    return net.fetch(pathToFileURL(file).toString());
  });
  const win = new BrowserWindow({
    width: 1600, height: 900, show: false, ...(selftest ? { x: -4000, y: -4000 } : {}), fullscreen: !selftest && !process.argv.includes('--window'),
    autoHideMenuBar: true, backgroundColor: '#000000', title: 'High Abyss Mira',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { backgroundThrottling: false, spellcheck: false, devTools: !PACKAGED },
  });
  win.once('ready-to-show', () => selftest ? win.showInactive() : win.show()); // Tests stehlen nicht den Fokus
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); return; }
    // Veröffentlicht: kein Neuladen (Strg+R, F5) und keine Entwicklerwerkzeuge (F12, Strg+Umschalt+I/J/C)
    const k = String(i.key).toLowerCase(), ctrl = i.control || i.meta;
    if (PACKAGED && (k === 'f5' || k === 'f12' || (ctrl && k === 'r') || (ctrl && i.shift && (k === 'i' || k === 'j' || k === 'c')))) e.preventDefault();
  });
  // Keine fremden Seiten, keine neuen Fenster
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) e.preventDefault(); });
  // Warnungen und Fehler der Seite ins Protokoll (immer)
  win.webContents.on('console-message', (ev, lvl, m, line, src) => {
    const level = ev && ev.level !== undefined ? ev.level : lvl, msg = ev && ev.message !== undefined ? ev.message : m;
    const n = typeof level === 'number' ? level : ({ verbose: 0, info: 1, warning: 2, error: 3 })[level] ?? 1;
    if (n >= 2) log(n >= 3 ? 'FEHLER' : 'WARNUNG', msg + (src || (ev && ev.sourceId) ? `  (${String((ev && ev.sourceId) || src).split('/').pop()}:${(ev && ev.lineNumber) || line})` : ''));
  });
  // Absturz oder Hänger der Seite: nachfragen statt schwarzer Bildschirm (Selbsttest: nur protokollieren)
  const ask = (msg, buttons) => dialog.showMessageBoxSync(win, { type: 'error', title: 'High Abyss Mira', message: msg, buttons, defaultId: 0, cancelId: buttons.length - 1, noLink: true });
  win.webContents.on('render-process-gone', (_e, d) => {
    log('ABSTURZ', `Seite beendet: ${d.reason} (Code ${d.exitCode})`); if (selftest || d.reason === 'clean-exit') return;
    if (restarting) { restarting = false; return; } // selbst beendet (Hänger → Neu laden)
    const r = ask(`Das Spiel wurde unerwartet beendet (${d.reason}).\n\nDein Spielstand bis zum letzten Speicherpunkt ist gesichert. Neu laden?`, ['Neu laden', 'Beenden']);
    if (r === 0) win.webContents.reload(); else app.quit();
  });
  let hung = false, restarting = false;
  win.on('unresponsive', () => {
    log('HÄNGT', 'Seite reagiert nicht'); if (selftest || hung) return; hung = true;
    const r = ask('Das Spiel reagiert nicht mehr.\n\nKurz warten – oder neu laden (Spielstand bis zum letzten Speicherpunkt bleibt erhalten)?', ['Warten', 'Neu laden', 'Beenden']);
    hung = false; if (r === 1) { restarting = true; win.webContents.forcefullyCrashRenderer(); win.webContents.reload(); } else if (r === 2) app.quit();
  });
  win.on('responsive', () => { if (hung) log('HÄNGT', 'Seite reagiert wieder'); });
  const t0 = Date.now();
  const page = argv('page') || 'index.html';
  win.loadURL('app://game/' + page);
  if (selftest && argv('loadprof')) { const d = win.webContents.debugger; try { d.attach('1.3'); d.sendCommand('Profiler.enable').then(() => d.sendCommand('Profiler.setSamplingInterval', { interval: 1000 })).then(() => d.sendCommand('Profiler.start')).catch(() => {}); } catch (e) {} } /* nur Selbsttest: --loadprof / --heapsample / Schritt „trace“ */
  if (selftest && argv('heapsample')) { const d = win.webContents.debugger; try { d.attach('1.3'); d.sendCommand('HeapProfiler.enable').then(() => d.sendCommand('HeapProfiler.startSampling', { samplingInterval: +argv('heapsample') })).catch(() => {}); } catch (e) {} } /* nur Selbsttest: --loadprof / --heapsample / Schritt „trace“ */
  if (selftest) {
    const out = argv('out') || path.join(app.getPath('temp'), 'ham_selftest');
    fs.mkdirSync(out, { recursive: true });
    const logs = [];
    win.webContents.on('console-message', (ev, lvl, m) => { const level = ev && ev.level !== undefined ? ev.level : lvl, msg = ev && ev.message !== undefined ? ev.message : m;
      if ((typeof level === 'number' ? level : ({ verbose: 0, info: 1, warning: 2, error: 3 })[level] ?? 1) >= 2) logs.push(msg); });
    let started = false; // mehrere wartende Abfragen dürfen die Schritte nur einmal starten (sonst laufen sie parallel mehrfach)
    const poll = setInterval(async () => {
      let ready = false; try { ready = await win.webContents.executeJavaScript('!!window.__ready'); } catch (e) {}
      if (ready || Date.now() - t0 > (+argv('readyTimeout') || 120000)) {
        clearInterval(poll); if (started) return; started = true;
        const info = await win.webContents.executeJavaScript('JSON.stringify({ready: !!window.__ready, stage: window.__stage, log: window.__log, info: window.__info})').catch(e => String(e));
        if (argv('loadprof')) { try { const d = win.webContents.debugger; const { profile } = await d.sendCommand('Profiler.stop'); fs.writeFileSync(path.join(out, 'load.cpuprofile'), JSON.stringify(profile)); d.detach(); } catch (e) { log('PROF', String(e)); } } /* nur Selbsttest: --loadprof / --heapsample / Schritt „trace“ */
        if (argv('heapsample')) { try { const d = win.webContents.debugger; const { profile } = await d.sendCommand('HeapProfiler.getSamplingProfile'); fs.writeFileSync(path.join(out, 'heap.heapprofile'), JSON.stringify(profile)); await d.sendCommand('HeapProfiler.stopSampling'); d.detach(); } catch (e) { log('HEAP', String(e)); } } /* nur Selbsttest: --loadprof / --heapsample / Schritt „trace“ */
        const live = argv('live'); // Dauerinstanz (--live=ORDNER): Schrittdateien aus ORDNER/in nacheinander ohne Neuladen, siehe docs/gameplay/TESTEN.md
        const runSteps = async (steps, res, out) => {
          for (const st of steps) {
            try { const p = win.webContents.executeJavaScript(st.js); res[st.name] = live ? await Promise.race([p, new Promise((_, rej) => setTimeout(() => rej('Schritt-Zeitlimit ' + (st.timeout || 120000) + ' ms'), st.timeout || 120000))]) : await p; } catch (e) { res[st.name] = 'FEHLER ' + e; }
            // Werkzeug-Seiten (tools/forge.html) liefern Dateien als "FILES:" + JSON [{path, b64}] zurück
            if (typeof res[st.name] === 'string' && res[st.name].startsWith('FILES:')) {
              const list = JSON.parse(res[st.name].slice(6)); for (const f of list) { fs.mkdirSync(path.dirname(f.path), { recursive: true }); fs.writeFileSync(f.path, Buffer.from(f.b64, 'base64')); }
              res[st.name] = list.map(f => f.path + ' (' + Math.round(f.b64.length * .75 / 1024) + ' KB)' + (f.note ? ' ' + f.note : ''));
            }
            if (st.trace) { const { contentTracing } = require('electron'); await contentTracing.startRecording({ included_categories: ['gpu', 'gpu.service', 'gpu.command_buffer', 'toplevel', 'v8', 'blink', 'disabled-by-default-gpu.service', 'viz', 'cc', 'benchmark', 'renderer.scheduler'] }); await new Promise(r => setTimeout(r, st.trace)); const tp = await contentTracing.stopRecording(path.join(out, st.name + '.trace.json')); } /* nur Selbsttest: --loadprof / --heapsample / Schritt „trace“ */
            if (st.heap) { // Speicher laut V8 (Heap + ArrayBuffer-Speicher) nach dem Schritt; "snap" schreibt zusätzlich einen Heap-Snapshot – nur Selbsttest
              const d = win.webContents.debugger; try { d.attach('1.3'); } catch (e) {}
              try { await d.sendCommand('HeapProfiler.collectGarbage'); const u = await d.sendCommand('Runtime.getHeapUsage'); const mb = v => v === undefined ? '?' : Math.round(v / 1048576);
                res[st.name + '_heap'] = `used=${mb(u.usedSize)}MB total=${mb(u.totalSize)}MB embedder=${mb(u.embedderHeapUsedSize)}MB backing=${mb(u.backingStorageSize)}MB`;
                if (st.heap === 'snap') { const fd = fs.openSync(path.join(out, st.name + '.heapsnapshot'), 'w'); const on = (_e, m, p) => { if (m === 'HeapProfiler.addHeapSnapshotChunk') fs.writeSync(fd, p.chunk); };
                  d.on('message', on); await d.sendCommand('HeapProfiler.enable'); await d.sendCommand('HeapProfiler.takeHeapSnapshot', { reportProgress: false }); d.removeListener('message', on); fs.closeSync(fd); }
              } catch (e) { res[st.name + '_heap'] = 'FEHLER ' + e; }
              try { d.detach(); } catch (e) {}
            }
            if (st.profile) { // CPU-Profil (Chrome DevTools-Format) über st.profile ms aufzeichnen
              const d = win.webContents.debugger; try { d.attach('1.3'); } catch (e) {}
              await d.sendCommand('Profiler.enable'); await d.sendCommand('Profiler.setSamplingInterval', { interval: 200 }); await d.sendCommand('Profiler.start');
              await new Promise(r => setTimeout(r, st.profile)); const { profile } = await d.sendCommand('Profiler.stop');
              fs.writeFileSync(path.join(out, st.name + '.cpuprofile'), JSON.stringify(profile)); d.detach();
            }
            await new Promise(r => setTimeout(r, st.wait || 1200));
            if (st.shot !== false) fs.writeFileSync(path.join(out, st.name + '.png'), (await win.webContents.capturePage()).toPNG());
            fs.writeFileSync(path.join(out, 'steps.json'), JSON.stringify(res, null, 1)); // Zwischenstand: bricht ein Lauf ab (Zeitlimit), bleiben die Ergebnisse bis hier
          }
          fs.writeFileSync(path.join(out, 'steps.json'), JSON.stringify(res, null, 1));
        };
        const stepsFile = argv('steps');
        if (stepsFile) { const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8')); await runSteps(steps, {}, out); }
        if (live) { await liveLoop(live, runSteps, logs, out, t0, info); return app.quit(); }
        await new Promise(r => setTimeout(r, 1500));
        const img = await win.webContents.capturePage();
        fs.writeFileSync(path.join(out, (argv('shot') || 'menu') + '.png'), img.toPNG());
        fs.writeFileSync(path.join(out, (argv('shot') || 'result') + '.json'), JSON.stringify({ seconds: (Date.now() - t0) / 1000, info, logs }, null, 1));
        app.quit();
      }
    }, 500);
  }
});
// Dauerinstanz für Tests (--live=ORDNER): beobachtet ORDNER/in/*.json, Ergebnisse nach ORDNER/out/<name>/, erledigte Dateien nach ORDNER/done/.
// Befehle: Datei ORDNER/in/reload.cmd (Seite neu laden), quit.cmd (beenden); Leerlauf-Ende nach --idle=<ms> (Standard 20 min). Status: ORDNER/status.json.
async function liveLoop(dir, runSteps, logs, out0, t0, info0) {
  const win = BrowserWindow.getAllWindows()[0]; dir = path.resolve(dir); const inD = path.join(dir, 'in'), outD = path.join(dir, 'out'), doneD = path.join(dir, 'done');
  for (const d of [inD, outD, doneD]) fs.mkdirSync(d, { recursive: true });
  const idle = +argv('idle') || 20 * 60 * 1000; let last = Date.now(), state = 'bereit', runs = 0;
  const status = extra => { try { fs.writeFileSync(path.join(dir, 'status.json'), JSON.stringify({ state, runs, pid: process.pid, idleSeconds: Math.round((Date.now() - last) / 1000), startSeconds: (Date.now() - t0) / 1000, ...extra })); } catch (e) {} };
  const waitReady = async () => { const t = Date.now(); while (Date.now() - t < (+argv('readyTimeout') || 120000)) { let r = false; try { r = await win.webContents.executeJavaScript('!!window.__ready'); } catch (e) {} if (r) return true; await new Promise(r => setTimeout(r, 500)); } return false; };
  fs.writeFileSync(path.join(out0, 'result.json'), JSON.stringify({ seconds: (Date.now() - t0) / 1000, info: info0, logs }, null, 1)); status();
  for (;;) {
    status(); await new Promise(r => setTimeout(r, 400));
    if (Date.now() - last > idle) { state = 'Leerlauf-Ende'; status(); return; }
    let files = []; try { files = fs.readdirSync(inD).filter(f => /\.(json|cmd)$/.test(f)).sort(); } catch (e) {}
    if (!files.length) continue;
    const f = files[0], src = path.join(inD, f), name = f.replace(/\.[^.]+$/, ''); last = Date.now();
    if (f === 'quit.cmd') { try { fs.renameSync(src, path.join(doneD, f)); } catch (e) {} state = 'beendet'; status(); return; }
    if (f.endsWith('.cmd')) { // reload.cmd
      state = 'lädt neu'; status(); try { fs.renameSync(src, path.join(doneD, f)); } catch (e) {}
      const t = Date.now(); win.webContents.reloadIgnoringCache(); await new Promise(r => setTimeout(r, 1500)); const ok = await waitReady();
      fs.writeFileSync(path.join(dir, 'reload.json'), JSON.stringify({ ok, seconds: (Date.now() - t) / 1000 })); state = ok ? 'bereit' : 'Neuladen-Zeitlimit'; last = Date.now(); continue;
    }
    state = 'läuft: ' + f; status(); const t = Date.now(), logFrom = logs.length, out = path.join(outD, name), res = {};
    fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
    let ok = true, err; try { const steps = JSON.parse(fs.readFileSync(src, 'utf8')); await runSteps(Array.isArray(steps) ? steps : steps.steps, res, out); } catch (e) { ok = false; err = String(e); }
    try { fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ ok, error: err, seconds: (Date.now() - t) / 1000, logs: logs.slice(logFrom) }, null, 1)); } catch (e) {}
    try { fs.renameSync(src, path.join(doneD, f)); } catch (e) { try { fs.unlinkSync(src); } catch (e2) {} }
    runs++; state = 'bereit'; last = Date.now();
  }
}
app.on('window-all-closed', () => app.quit());
