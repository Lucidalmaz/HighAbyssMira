// Figuren aus der Figuren-Werkstatt (tools/forge.html → game/assets/chars/<id>/model.glb) verdichten und die Figurenliste schreiben.
//  - gltfpack: Geometrie auf höchstens ~45 000 Dreiecke je Figur vereinfachen (optisch gleich), Namen/Materialien bleiben
//  - game/assets/chars/chars.json: id, Name, Größe (m), Bewegungen – das Spiel lädt nur, was hier steht
// Aufruf: node tools/chars_pack.mjs
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DIR = path.resolve(HERE, '..', '..', 'game', 'assets', 'chars'), CAST = JSON.parse(fs.readFileSync(path.join(HERE, 'cast.json'), 'utf8'));
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), MAX = 45000, list = [];
const tris = doc => doc.getRoot().listMeshes().reduce((s, m) => s + m.listPrimitives().reduce((a, p) => a + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0), 0);
for (const c of CAST.cast) { const f = path.join(DIR, c.id, 'model.glb'); if (!fs.existsSync(f)) { console.log('fehlt:', c.id); continue; }
  let doc = await io.read(f); const t0 = tris(doc);
  if (t0 > MAX * 1.05) { const r = (MAX / t0).toFixed(3), tmp = f + '.tmp.glb';
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'gltfpack@0.21.0', '-i', f, '-o', tmp, '-si', r, '-kn', '-km'], { stdio: 'ignore', shell: process.platform === 'win32' });
    fs.renameSync(tmp, f); doc = await io.read(f); }
  const clips = doc.getRoot().listAnimations().map(a => a.getName());
  list.push({ id: c.id, name: c.name, height: c.height, clips, tris: Math.round(tris(doc)) });
  console.log(c.id, Math.round(t0), '→', Math.round(tris(doc)), 'Dreiecke,', (fs.statSync(f).size / 1e6).toFixed(1), 'MB,', clips.join('/')); }
fs.writeFileSync(path.join(DIR, 'chars.json'), JSON.stringify(list, null, 1));
console.log('chars.json:', list.length, 'Figuren');
