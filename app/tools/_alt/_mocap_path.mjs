// AP-MOCAP: Elternkette von Knoten einer Figur
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS); const [id, ...names] = process.argv.slice(2);
const doc = await io.read('../game/assets/chars/' + id + '/model.glb'), R = doc.getRoot(); const par = new Map(); for (const n of R.listNodes()) for (const c of n.listChildren()) par.set(c, n);
const re = new RegExp(names.join('|'));
for (const n of R.listNodes()) if (re.test(n.getName())) { const p = []; let x = par.get(n); while (x) { p.push(x.getName()); x = par.get(x); } console.log(n.getName(), '<-', p.slice(0, 6).join(' <- ')); }
