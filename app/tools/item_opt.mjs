// Inventar-Modelle verschlanken: Texturen <= 1024 px, Dreiecke <= Ziel, Teilmenge per Namensmuster; schreibt game/assets/ms/it_<id>/model.glb
//   node tools/item_opt.mjs   (Liste unten)
import fs from 'fs'; import path from 'path'; import sharp from 'sharp';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { prune, dedup, simplify, weld, normals } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
await MeshoptSimplifier.ready;
const ROOT = path.resolve('..', 'game', 'assets'); const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
// [id, Quelle (unter assets), Zieldreiecke, Textur-Max, Knotennamen-Muster (nur diese behalten) | null]
const LISTE = [
  ['lampe1', 'ue/lampe1/model.glb', 12000, 1024], ['lampe3', 'ue/lampe3/model.glb', 14000, 1024], ['sicherung', 'ue/sicherung/model.glb', 9000, 1024], ['lichtstein', 'ue/lichtstein/model.glb', 3100, 1024],
  ['album', 'ms/album/model.glb', 1500, 1024], ['rekorder', 'ms/rekorder/model.glb', 3000, 1024], ['brille', 'ms/brille/model.glb', 7000, 1024], ['teddy', 'ms/teddy_scan/model.glb', 14000, 1024, null, .05, true], ['funk', 'ms/w_funk/model.glb', 12000, 1024],
  ['kassette', 'ms/ph_portable_cassette_player/model.glb', 2400, 1024, /casette$/], ['postkarte', 'ms/ph_postcard_set_01/model.glb', 200, 1024, /postcard_01$/], ['ordner', 'ms/ph_binder_notebook/model.glb', 9100, 1024, /binder_notebook_closed/],
  ['notizblock', 'ms/ph_office_notepads/model.glb', 200, 1024, /yellow_pad|yellow_sheet/], ['a4', 'ms/ph_office_notepads/model.glb', 200, 1024, /a4_a$/], ['kuli', 'ms/ph_stationery_supplies/model.glb', 800, 1024, /pen_blue/],
  ['zigaretten', 'ms/ph_cigarette_pack/model.glb', 9000, 1024, /pack_main|pack_foil/], ['flasche', 'ms/ph_wine_bottles_01/model.glb', 3700, 1024, /burgundy/],
];
for (const [id, src, tris, tex, keep, err, reNorm] of LISTE) {
  const doc = await io.read(path.join(ROOT, src)); const root = doc.getRoot();
  if (keep) for (const n of root.listNodes()) { if (n.getMesh() && !keep.test(n.getName())) n.setMesh(null); }
  if (reNorm) for (const m of root.listMeshes()) for (const p of m.listPrimitives()) p.setAttribute('NORMAL', null); // Scan mit Flachnormalen: erst ohne Normalen verschweissen
  await doc.transform(prune(), dedup(), weld(reNorm ? { tolerance: 1e-5 } : {}));
  let t = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) t += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  if (t > tris) { const ratio = Math.max(.02, tris / t); await doc.transform(simplify({ simplifier: MeshoptSimplifier, ratio, error: err ?? .02, lockBorder: false })); }
  if (reNorm) await doc.transform(normals({ overwrite: true }));
  for (const tx of root.listTextures()) { const sz = tx.getSize(); if (!sz || Math.max(...sz) <= tex) continue;
    const buf = await sharp(Buffer.from(tx.getImage())).resize({ width: tex, height: tex, fit: 'inside' }).toFormat(tx.getMimeType() === 'image/png' ? 'png' : 'jpeg', { quality: 88 }).toBuffer(); tx.setImage(new Uint8Array(buf)); }
  await doc.transform(prune());
  let t2 = 0; for (const m of root.listMeshes()) for (const p of m.listPrimitives()) t2 += (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3;
  const out = path.join(ROOT, 'ms', 'it_' + id); fs.mkdirSync(out, { recursive: true }); await io.write(path.join(out, 'model.glb'), doc);
  console.log(id, Math.round(t), '->', Math.round(t2), 'Dreiecke', (fs.statSync(path.join(out, 'model.glb')).size / 1024) | 0, 'KB', root.listTextures().map(x => x.getSize().join('x')).join(' '));
}
