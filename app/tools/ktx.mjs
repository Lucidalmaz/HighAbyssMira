// Texturen für die Grafikkarte komprimieren (KTX2/UASTC → auf der Karte BC7): ~4× weniger Grafikspeicher bei praktisch gleicher Optik.
// Vorher belegten die Texturen unkomprimiert ~11 GB bei 8 GB Grafikspeicher → ständiges Auslagern, Ruckler.
//   Bilder  game/assets/**/*.jpg|png  →  <datei>.ktx2  (vertikal gespiegelt wie beim TextureLoader)
//   Modelle game/assets/**/*.glb|gltf →  <datei>.ktx.glb (eingebettete Texturen als KHR_texture_basisu)
//   Liste   game/assets/ktx2.json     (das Spiel nimmt nur, was hier steht; fehlt etwas, lädt es das Original)
// Arbeitet schrittweise: nur neue/geänderte Dateien. Die erzeugten Dateien stehen in .gitignore (npm run ktx erzeugt sie neu).
// Aufruf: node tools/ktx.mjs [--force]
import fs from 'fs'; import path from 'path'; import os from 'os'; import { fork } from 'child_process'; import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url)), GAME = path.resolve(HERE, '..', '..', 'game'), ASSETS = path.join(GAME, 'assets');
const rel = f => path.relative(GAME, f).split(path.sep).join('/');
const OPT = { isUASTC: true, generateMipmap: true, needSupercompression: true, uastcLDRQualityLevel: 1, enableDebug: false };

async function decoder() {
  const sharp = (await import('sharp')).default;
  // Über 2048 px (Unreal-Exporte mit 4096²) auf 2048 verkleinern: der Encoder schafft höchstens ~12 Mio. Pixel, und 2048 ist auch in der Hand noch ein Vielfaches der Bildschirmauflösung
  return async buf => { let s = sharp(buf); const m = await s.metadata(); if (Math.max(m.width, m.height) > 2048) s = s.resize({ width: 2048, height: 2048, fit: 'inside', kernel: 'lanczos3' });
    const { data, info } = await s.ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { data: new Uint8Array(data), width: info.width, height: info.height }; };
}
const fits = (w, h) => w >= 4 && h >= 4 && w % 4 === 0 && h % 4 === 0; // Blockformate brauchen Vielfache von 4

async function doImage(f, dec, enc) {
  const src = fs.readFileSync(f), im = await dec(src); if (!fits(im.width, im.height)) return 'übersprungen (Größe ' + im.width + '×' + im.height + ')';
  const out = await enc(src, { ...OPT, isYFlip: true, imageDecoder: dec });
  fs.writeFileSync(f + '.ktx2', out); return (src.length / 1e6).toFixed(1) + ' → ' + (out.length / 1e6).toFixed(1) + ' MB';
}
async function doModel(f, dec, enc) {
  const { NodeIO, VertexLayout } = await import('@gltf-transform/core'); const { ALL_EXTENSIONS, KHRTextureBasisu } = await import('@gltf-transform/extensions');
  // Eckpunktdaten getrennt lassen wie im Original (verschränkt bricht z. B. mergeVertices/SimplifyModifier im Straßenmodul)
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).setVertexLayout(VertexLayout.SEPARATE), doc = await io.read(f); let n = 0, skip = 0;
  for (const t of doc.getRoot().listTextures()) {
    const img = t.getImage(); if (!img || !['image/jpeg', 'image/png'].includes(t.getMimeType())) continue;
    const im = await dec(img); if (!fits(im.width, im.height)) { skip++; continue; }
    t.setImage(await enc(img, { ...OPT, isYFlip: false, imageDecoder: dec })).setMimeType('image/ktx2'); if (t.getURI()) t.setURI(t.getURI().replace(/\.(jpe?g|png)$/i, '.ktx2')); n++;
  }
  if (!n) return 'keine passenden Texturen' + (skip ? ` (${skip} übersprungen)` : '');
  doc.createExtension(KHRTextureBasisu).setRequired(true);
  fs.writeFileSync(f + '.ktx.glb', await io.writeBinary(doc)); return n + ' Texturen' + (skip ? `, ${skip} übersprungen` : '');
}

async function worker(list) {
  const dec = await decoder(), { encodeToKTX2 } = await import('ktx2-encoder');
  for (const f of list) {
    const t0 = Date.now(); let msg;
    try { msg = /\.(glb|gltf)$/i.test(f) ? await doModel(f, dec, encodeToKTX2) : await doImage(f, dec, encodeToKTX2); } catch (e) { msg = 'FEHLER ' + (e && e.message || e); }
    process.send({ f: rel(f), msg, s: (Date.now() - t0) / 1000 });
  }
}

function walk(d, out = []) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p, out); else out.push(p); } return out; }

async function main() {
  const force = process.argv.includes('--force'), all = walk(ASSETS);
  const srcs = all.filter(f => /\.(jpe?g|png)$/i.test(f) || (/\.(glb|gltf)$/i.test(f) && !/\.ktx\.glb$/i.test(f)));
  const outOf = f => /\.(glb|gltf)$/i.test(f) ? f + '.ktx.glb' : f + '.ktx2';
  const todo = srcs.filter(f => force || !fs.existsSync(outOf(f)) || fs.statSync(outOf(f)).mtimeMs < fs.statSync(f).mtimeMs);
  // Große Dateien zuerst verteilen, damit alle Kerne gleich lange arbeiten
  todo.sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  const N = Math.max(1, Math.min(todo.length, os.cpus().length - 2)), parts = Array.from({ length: N }, () => []); todo.forEach((f, i) => parts[i % N].push(f));
  console.log(`KTX2: ${todo.length} von ${srcs.length} Dateien umwandeln, ${N} Prozesse`);
  let done = 0; const t0 = Date.now();
  await Promise.all(parts.filter(p => p.length).map(p => new Promise((res, rej) => {
    const c = fork(fileURLToPath(import.meta.url), ['--worker'], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    c.on('message', m => { if (m === 'ready') return c.send(p); done++; console.log(`[${done}/${todo.length}] ${m.f}: ${m.msg} (${m.s.toFixed(1)} s)`); });
    c.on('exit', code => code ? rej(new Error('Prozess endete mit ' + code)) : res());
  })));
  // Liste: nur fertige, aktuelle Dateien
  const images = srcs.filter(f => !/\.(glb|gltf)$/i.test(f) && fs.existsSync(f + '.ktx2') && fs.statSync(f + '.ktx2').mtimeMs >= fs.statSync(f).mtimeMs).map(rel);
  const models = srcs.filter(f => /\.(glb|gltf)$/i.test(f) && fs.existsSync(f + '.ktx.glb') && fs.statSync(f + '.ktx.glb').mtimeMs >= fs.statSync(f).mtimeMs).map(rel);
  fs.writeFileSync(path.join(ASSETS, 'ktx2.json'), JSON.stringify({ images, models }));
  console.log(`KTX2 fertig in ${((Date.now() - t0) / 60000).toFixed(1)} min: ${images.length} Bilder, ${models.length} Modelle → assets/ktx2.json`);
}

if (process.argv.includes('--worker')) { process.on('message', async list => { await worker(list); process.exit(0); }); process.send('ready'); }
else main().catch(e => { console.error(e); process.exit(1); });
