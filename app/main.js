// High Abyss Mira – Desktop-App (Electron). Lädt das Spiel aus dem Ordner "game" über ein eigenes app://-Protokoll,
// damit auch große Modelle und Sounds direkt als Dateien geladen werden können.
const { app, BrowserWindow, protocol, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true } }]);
// Immer die starke Grafikkarte, keine Drosselung im Hintergrund
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
// Testläufe: Fenster außerhalb des Bildschirms, weiterhin gerendert (keine Verdeckungs-Drosselung)
if (process.argv.includes('--selftest')) app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

const argv = n => process.argv.find(a => a.startsWith('--' + n + '='))?.slice(n.length + 3);
// --root=ORDNER: Spiel aus einem anderen Ordner laden (Testkopien); --udd=ORDNER: eigener Profilordner (parallele Testläufe)
const GAME = argv('root') ? path.resolve(argv('root')) : path.join(__dirname, 'game');
if (argv('udd')) app.setPath('userData', path.resolve(argv('udd')));
const selftest = process.argv.includes('--selftest');

app.whenReady().then(() => {
  protocol.handle('app', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '');
    const file = path.normalize(path.join(GAME, rel));
    if (!file.startsWith(GAME)) return new Response('verboten', { status: 403 });
    if (!fs.existsSync(file)) { console.warn('FEHLT: ' + rel); return new Response('fehlt', { status: 404 }); }
    return net.fetch(pathToFileURL(file).toString());
  });
  const win = new BrowserWindow({
    width: 1600, height: 900, show: false, ...(process.argv.includes('--selftest') ? { x: -4000, y: -4000 } : {}), fullscreen: !selftest && !process.argv.includes('--window'),
    autoHideMenuBar: true, backgroundColor: '#000000', title: 'High Abyss Mira',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: { backgroundThrottling: false, spellcheck: false },
  });
  win.once('ready-to-show', () => selftest ? win.showInactive() : win.show()); // Tests stehlen nicht den Fokus
  win.webContents.on('before-input-event', (e, i) => {
    if (i.type === 'keyDown' && i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  const t0 = Date.now();
  const page = process.argv.find(a => a.startsWith('--page='))?.slice(7) || 'index.html';
  win.loadURL('app://game/' + page);
  if (selftest) {
    const out = process.argv.find(a => a.startsWith('--out='))?.slice(6) || path.join(app.getPath('temp'), 'ham_selftest');
    fs.mkdirSync(out, { recursive: true });
    const logs = [];
    win.webContents.on('console-message', (_e, level, msg) => { if (level >= 2) logs.push(msg); });
    const poll = setInterval(async () => {
      let ready = false; try { ready = await win.webContents.executeJavaScript('!!window.__ready'); } catch (e) {}
      if (ready || Date.now() - t0 > 120000) {
        clearInterval(poll);
        const info = await win.webContents.executeJavaScript('JSON.stringify({ready: !!window.__ready, stage: window.__stage, log: window.__log, info: window.__info})').catch(e => String(e));
        const stepsFile = process.argv.find(a => a.startsWith('--steps='))?.slice(8);
        if (stepsFile) {
          const steps = JSON.parse(fs.readFileSync(stepsFile, 'utf8')); const res = {};
          for (const st of steps) {
            try { res[st.name] = await win.webContents.executeJavaScript(st.js); } catch (e) { res[st.name] = 'FEHLER ' + e; }
            await new Promise(r => setTimeout(r, st.wait || 1200));
            if (st.shot !== false) fs.writeFileSync(path.join(out, st.name + '.png'), (await win.webContents.capturePage()).toPNG());
          }
          fs.writeFileSync(path.join(out, 'steps.json'), JSON.stringify(res, null, 1));
        }
        await new Promise(r => setTimeout(r, 1500));
        const img = await win.webContents.capturePage();
        fs.writeFileSync(path.join(out, (process.argv.find(a => a.startsWith('--shot='))?.slice(7) || 'menu') + '.png'), img.toPNG());
        fs.writeFileSync(path.join(out, (process.argv.find(a => a.startsWith('--shot='))?.slice(7) || 'result') + '.json'), JSON.stringify({ seconds: (Date.now() - t0) / 1000, info, logs }, null, 1));
        app.quit();
      }
    }, 500);
  }
});
app.on('window-all-closed', () => app.quit());
