// R-11 Vegetation: Megascans-Pflanzen (Fab, gltf „tier_2“) nach game/assets/ms/<schlüssel>/ übernehmen – gleiche Form wie elderberry/wildgrass2:
// (3D-Scans ohne Bildkarte – Pilze, Stumpf, Stamm – deckend, alle Bilder jpg.)
// model.gltf + model.bin, t0 Normalen (1K jpg), t1 ORT (1K jpg), t2 Farbe+Alpha (2K png), t3/t4 Bildkarte (1K png); Alpha als Maske, kein Metall, keine Okklusion.
// Danach: node tools/ktx.mjs  (KTX2 + ktx2.json). Aufruf: node tools/_r11_import.mjs
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import sharp from 'sharp';
const HERE = path.dirname(fileURLToPath(import.meta.url)), MS = path.resolve(HERE, '..', '..', 'game', 'assets', 'ms');
const SRC = 'C:/Users/GIGABYTE/HAM_FabDownloads/v19_vegetation/x';
const MAP = { farn: 'ladyfern', buchenfarn: 'beechfern', efeu: 'ivy_ms', trockengras: 'drygrass', unkraut: 'weeds', pilze: 'bolete' }; // stumpf (Broken Stump): nur „UEFN – Reference only“ lizenziert → nicht übernehmen // totbaum (qlEtl) liegt schon als ms/deadtree1 vor
for (const [dir, key] of Object.entries(MAP)) {
  const d = path.join(SRC, dir); if (!fs.existsSync(d)) continue; const gf = fs.readdirSync(d).find(f => /_tier_2\.gltf$/.test(f)); if (!gf) { console.log('fehlt noch:', dir); continue; }
  const g = JSON.parse(fs.readFileSync(path.join(d, gf), 'utf8')), out = path.join(MS, key); fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(path.join(d, g.buffers[0].uri), path.join(out, 'model.bin')); g.buffers[0].uri = 'model.bin';
  const plant = g.materials.some(m => /Billboard/.test(m.name)); // Pflanzen: Farbe mit Alpha (png); 3D-Scans (Pilze, Stumpf, Stamm): alles jpg, deckend
  for (let i = 0; i < g.images.length; i++) { const src = path.join(d, g.images[i].uri), name = plant && (/_B\./.test(src) || /Billboard/.test(src)) ? `t${i}.png` : `t${i}.jpg`, sz = /Billboard/.test(src) ? 1024 : /_B\./.test(src) ? 2048 : 1024;
    let s = sharp(src).resize({ width: sz, height: sz, fit: 'inside', kernel: 'lanczos3' }); s = name.endsWith('.jpg') ? s.jpeg({ quality: 90 }) : s.png({ compressionLevel: 9 });
    await s.toFile(path.join(out, name)); g.images[i] = { uri: name }; }
  for (const m of g.materials) { if (plant) { m.alphaMode = 'MASK'; m.alphaCutoff = .5; } else { delete m.alphaMode; m.doubleSided = false; } delete m.occlusionTexture; m.pbrMetallicRoughness.metallicFactor = 0; if (/Billboard/.test(m.name)) m.pbrMetallicRoughness.roughnessFactor = .8; }
  fs.writeFileSync(path.join(out, 'model.gltf'), JSON.stringify(g)); console.log('ok', dir, '→ ms/' + key, g.nodes.length, 'Knoten');
}
