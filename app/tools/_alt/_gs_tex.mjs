// Gesichter (Q-6): Textur eines Materials aus einer Figur speichern
import fs from 'fs'; import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const [f, re, out] = process.argv.slice(2); const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(f);
for (const m of doc.getRoot().listMaterials()) if (new RegExp(re).test(m.getName())) { const t = m.getBaseColorTexture(); if (t) { const p = out + '_' + m.getName() + (t.getMimeType() === 'image/png' ? '.png' : '.jpg'); fs.writeFileSync(p, t.getImage()); const s = t.getSize(); console.log(p, s); } const n = m.getNormalTexture(); if (n) console.log(' normal', m.getName(), n.getSize(), 'rough', m.getRoughnessFactor()); }
