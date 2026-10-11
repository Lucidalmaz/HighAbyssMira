// Raum-Detail-Modelle (Poly Haven, CC0): aus <Quelle>/<id>/model.gltf â†’ game/assets/ms/rd_<id>/model.glb (Dreiecke begrenzt, Texturen <= 1024 px)
//   node tools/raum_opt.mjs <Quellordner> <id> [<id> ...]    Dreiecke je Modell: Standard 6000, MÃ¶bel 12000 (Muster unten)
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { prune, dedup, simplify, weld, getBounds } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const [SRC, ...ids] = process.argv.slice(2);
const BIG = /chair|sofa|armchair|table|bed|cabinet|shelf|shelves|desk|rack|cart|clock|commode|wheelchair|stove|generator|drawer|bookshelf|barrel|truck/i;
for (const id of ids) { try {
  const src = path.join(SRC, id, 'model.gltf'); if (!fs.existsSync(src)) { console.log('FEHLT', id); continue; }
  const doc = await io.read(src); const root = doc.getRoot();
  await doc.transform(prune(), dedup(), weld());
  let t = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) t += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  const bd0 = getBounds(root.listScenes()[0]), ext0 = Math.max(bd0.max[0] - bd0.min[0], bd0.max[1] - bd0.min[1], bd0.max[2] - bd0.min[2]);
  // Dreiecksbudget nach Größe (Leistungs-Gate: Räume dürfen die Bildsumme kaum erhöhen)
  const budget = BIG.test(id) ? (ext0 > 1.4 ? 3200 : 2200) : ext0 < .35 ? 600 : ext0 < .7 ? 1100 : ext0 < 1.2 ? 1800 : 3000;
  if (t > budget) await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio: Math.max(.03, budget / t), error: .01, lockBorder: false }));
  const bd = getBounds(root.listScenes()[0]), ext = Math.max(bd.max[0] - bd.min[0], bd.max[1] - bd.min[1], bd.max[2] - bd.min[2]); const TEX = ext < .9 || /clock|lamp|vase|frame/i.test(id) ? 512 : 1024; // kleine Dinge 512 px (Grafikspeicher), Möbel 1024
  for (const tx of root.listTextures()) { const sz = tx.getSize(); if (!sz || Math.max(...sz) <= TEX) continue;
    const buf = await sharp(Buffer.from(tx.getImage())).resize({ width: TEX, height: TEX, fit: 'inside' }).toFormat(tx.getMimeType() === 'image/png' ? 'png' : 'jpeg', { quality: 88 }).toBuffer(); tx.setImage(new Uint8Array(buf)); }
  await doc.transform(prune());
  let t2 = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) t2 += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  const out = path.resolve('..', 'game', 'assets', 'ms', 'rd_' + id); fs.mkdirSync(out, { recursive: true });
  const info = path.join(SRC, id, 'info.json'); if (fs.existsSync(info)) fs.copyFileSync(info, path.join(out, 'info.json'));
  await io.write(path.join(out, 'model.glb'), doc);
  console.log(id, Math.round(t), '->', Math.round(t2), 'Dreiecke', (fs.statSync(path.join(out, 'model.glb')).size / 1024) | 0, 'KB', root.listTextures().map(x => { const s = x.getSize(); return s ? s.join('x') : '?'; }).join(' '));
} catch (e) { console.log('FEHLER', id, String(e.message).slice(0, 80)); } }
