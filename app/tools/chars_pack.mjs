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
  // Q-6: Netze mit Gesichtsformen dürfen nicht vereinfacht werden (Lider/Mund würden zerfallen) – nach gltfpack prüfen, sonst Original behalten
  const faceTris = d => d.getRoot().listMeshes().flatMap(m => m.listPrimitives().filter(p => p.listTargets().length).map(p => p.getIndices() ? p.getIndices().getCount() : 0)).join(',');
  if (t0 > MAX * 1.05) { const r = (MAX / t0).toFixed(3), tmp = f + '.tmp.glb', ft = faceTris(doc);
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'gltfpack@0.21.0', '-i', f, '-o', tmp, '-si', r, '-kn', '-km'], { stdio: 'ignore', shell: process.platform === 'win32' });
    if (fs.existsSync(tmp)) { const d2 = await io.read(tmp); if (faceTris(d2) === ft) { fs.renameSync(tmp, f); doc = d2; } else { fs.unlinkSync(tmp); console.log(c.id + ': gltfpack hätte das Gesicht vereinfacht – unverändert'); } } }
  const clips = doc.getRoot().listAnimations().map(a => a.getName());
  list.push({ id: c.id, name: c.name, height: c.height, clips, tris: Math.round(tris(doc)) });
  console.log(c.id, Math.round(t0), '→', Math.round(tris(doc)), 'Dreiecke,', (fs.statSync(f).size / 1e6).toFixed(1), 'MB,', clips.join('/')); }
// Figuren außerhalb der Besetzung (Blechmann aus F.buildBlech) bleiben in der Liste
try { for (const x of JSON.parse(fs.readFileSync(path.join(DIR, 'chars.json'), 'utf8'))) if (!list.some(y => y.id === x.id) && fs.existsSync(path.join(DIR, x.id, 'model.glb'))) list.push(x); } catch (e) {}
fs.writeFileSync(path.join(DIR, 'chars.json'), JSON.stringify(list, null, 1));
console.log('chars.json:', list.length, 'Figuren');
