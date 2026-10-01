// X-6 (kiffen): Rohmodelle ansehen – Netze, Dreiecke, Materialien, Texturen, Maße
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import sharp from 'sharp';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
for (const f of process.argv.slice(2)) {
  const doc = await io.read(f); const R = doc.getRoot(); console.log('==== ' + f);
  let tri = 0; const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (const n of R.listNodes()) { const m = n.getMesh(); if (!m) continue; const W = n.getWorldMatrix();
    for (const p of m.listPrimitives()) { const pos = p.getAttribute('POSITION'), idx = p.getIndices(); const t = (idx ? idx.getCount() : pos.getCount()) / 3; tri += t;
      const a = []; for (let i = 0; i < pos.getCount(); i += Math.max(1, Math.floor(pos.getCount() / 3000))) { pos.getElement(i, a); const x = W[0] * a[0] + W[4] * a[1] + W[8] * a[2] + W[12], y = W[1] * a[0] + W[5] * a[1] + W[9] * a[2] + W[13], z = W[2] * a[0] + W[6] * a[1] + W[10] * a[2] + W[14]; [x, y, z].forEach((v, k) => { mn[k] = Math.min(mn[k], v); mx[k] = Math.max(mx[k], v); }); }
      console.log(`  node ${n.getName()} mesh ${m.getName()} tris ${t} verts ${pos.getCount()} mat ${p.getMaterial()?.getName()} attrs ${p.listSemantics().join(',')}`); } }
  console.log('  TOTAL tris', tri, 'size', mx.map((v, k) => (v - mn[k]).toFixed(3)).join(' x '), 'min', mn.map(v => v.toFixed(3)).join(','));
  for (const m of R.listMaterials()) console.log(`  mat ${m.getName()} col ${m.getBaseColorFactor().map(v => v.toFixed(2))} rough ${m.getRoughnessFactor()} metal ${m.getMetallicFactor()} alpha ${m.getAlphaMode()} ds ${m.getDoubleSided()} tex b:${!!m.getBaseColorTexture()} n:${!!m.getNormalTexture()} mr:${!!m.getMetallicRoughnessTexture()} e:${!!m.getEmissiveTexture()}`);
  for (const t of R.listTextures()) { let sz = '?'; try { const md = await sharp(Buffer.from(t.getImage())).metadata(); sz = md.width + 'x' + md.height + ' ' + md.format; } catch (e) {} console.log(`  tex ${t.getName()} ${t.getMimeType()} ${sz} ${(t.getImage().byteLength / 1024) | 0}KB`); }
  console.log('  anims', R.listAnimations().map(a => a.getName()).join(','), 'skins', R.listSkins().length, 'ext', R.listExtensionsUsed().map(e => e.extensionName).join(','));
}
