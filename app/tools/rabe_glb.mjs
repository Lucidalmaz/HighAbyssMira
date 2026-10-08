// Rabe: neues Netz (Blender-Export mit Haut, rabe_bau3_rig.py) in die alte Krähendatei (animal_crow) setzen.
// Skelett, Knotenachsen und alle 17 Clips bleiben BIT-GLEICH (whiskey.js/traum.js/leben.js/hungrige.js nutzen Knochennamen, Achsen und Clipnamen).
// Dazu: Material (gleicher Typ wie vorher: MASK + KHR_materials_specular mit Textur → gleiches Shaderprogramm), Atlas-Texturen,
// Kiefer-Öffnungsachse als extras am Knochen „Queue-de-cheval-1“ (userData.oeffnen), zusätzlicher Clip „ANIM_Crow_Caw“ (Krächzen: Schnabel auf/zu, Verbeugung).
//   node tools/rabe_glb.mjs <alt.glb> <haut.glb> <atlas_farbe.png> <atlas_normal.png> <atlas_orm.png> <ziel.glb>
import fs from 'fs'; import path from 'path';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS, KHRMaterialsSpecular } from '@gltf-transform/extensions'; import { prune } from '@gltf-transform/functions';
const [ALT, HAUT, FARBE, NORMAL, ORM, ZIEL] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(ALT), neu = await io.read(HAUT);
const R = doc.getRoot(), RN = neu.getRoot();
const skin = R.listSkins()[0], jn = skin.listJoints().map(j => j.getName());
const nskin = RN.listSkins()[0], njn = nskin.listJoints().map(j => j.getName());
const map = njn.map(n => { const i = jn.indexOf(n); if (i < 0) throw new Error('Knochen fehlt: ' + n); return i; });
// Bindung prüfen: gleiche Ruhelage (inverse Bindematrizen gleich, bis auf Rundung)
{ const a = skin.getInverseBindMatrices().getArray(), b = nskin.getInverseBindMatrices().getArray(); let mx = 0;
  njn.forEach((n, k) => { const i = map[k]; for (let c = 0; c < 16; c++) mx = Math.max(mx, Math.abs(a[i * 16 + c] - b[k * 16 + c])); });
  console.log('Bindung: größte Abweichung', mx.toExponential(2)); if (mx > 1e-3) throw new Error('Ruhelage weicht ab'); }
const prim = R.listMeshes()[0].listPrimitives()[0], np_ = RN.listMeshes()[0].listPrimitives()[0];
const acc = (name, arr, type) => doc.createAccessor(name).setArray(arr).setType(type).setBuffer(R.listBuffers()[0]);
for (const s of prim.listSemantics()) prim.setAttribute(s, null);
const take = s => np_.getAttribute(s).getArray();
prim.setAttribute('POSITION', acc('POSITION', new Float32Array(take('POSITION')), 'VEC3'));
prim.setAttribute('NORMAL', acc('NORMAL', new Float32Array(take('NORMAL')), 'VEC3'));
prim.setAttribute('TANGENT', acc('TANGENT', new Float32Array(take('TANGENT')), 'VEC4'));
prim.setAttribute('TEXCOORD_0', acc('TEXCOORD_0', new Float32Array(take('TEXCOORD_0')), 'VEC2'));
const J = take('JOINTS_0'), J2 = new Uint16Array(J.length); for (let i = 0; i < J.length; i++) J2[i] = map[J[i]];
prim.setAttribute('JOINTS_0', acc('JOINTS_0', J2, 'VEC4'));
const Wt = take('WEIGHTS_0'); prim.setAttribute('WEIGHTS_0', acc('WEIGHTS_0', new Float32Array(Wt), 'VEC4'));
const ix = np_.getIndices().getArray(), nv = take('POSITION').length / 3;
const oi = prim.getIndices(); prim.setIndices(acc('indices', nv < 65536 ? new Uint16Array(ix) : new Uint32Array(ix), 'SCALAR')); if (oi) oi.dispose();
// Material
const mat = prim.getMaterial(); const img = (f, mime) => doc.createTexture(path.basename(f)).setImage(fs.readFileSync(f)).setMimeType(mime);
const tF = img(FARBE, 'image/png'), tN = img(NORMAL, 'image/png'), tO = img(ORM, 'image/png');
// winzige weiße Glanzkarte (die alte Datei hatte eine; ohne sie entstünde eine neue Shadervariante)
const weiss = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAFklEQVR4nGP8////fwY8gAmf5PBRAAAbbgQMid1tCwAAAABJRU5ErkJggg==', 'base64');
const tS = doc.createTexture('glanz').setImage(weiss).setMimeType('image/png');
mat.setBaseColorTexture(tF).setBaseColorFactor([1, 1, 1, 1]).setNormalTexture(tN).setMetallicRoughnessTexture(tO).setOcclusionTexture(tO)
  .setMetallicFactor(1).setRoughnessFactor(1).setAlphaMode('MASK').setAlphaCutoff(.42).setDoubleSided(false).setName('M_Rabe');
let sp = mat.getExtension('KHR_materials_specular'); if (!sp) { sp = doc.createExtension(KHRMaterialsSpecular).createSpecular(); mat.setExtension('KHR_materials_specular', sp); }
sp.setSpecularTexture(tS).setSpecularFactor(1).setSpecularColorFactor([.8, .86, 1.0]); // blauvioletter Federglanz in den Lichtern
// Kiefer: Öffnungsachse aus dem Clip EatSomething (stärkste Drehung gegen die Ruhe), als extras am Knochen
const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
const qinv = a => [-a[0], -a[1], -a[2], a[3]], qaa = (ax, an) => { const s = Math.sin(an / 2); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(an / 2)]; };
const node = n => R.listNodes().find(x => x.getName() === n);
const jaw = node('CROW_-Queue-de-cheval-1'), neck = node('CROW_-Neck'), head = node('CROW_-Head');
const anim = n => R.listAnimations().find(a => a.getName() === n);
function delta(an, nd) { // größte Drehung des Knotens im Clip gegen seine Ruhe → [Achse, Winkel, Zeit]
  const ch = anim(an).listChannels().find(c => c.getTargetNode() === nd && c.getTargetPath() === 'rotation'); const s = ch.getSampler(), T = s.getInput().getArray(), Q = s.getOutput().getArray(), q0 = nd.getRotation();
  let best = [null, 0, 0]; for (let k = 0; k < T.length; k++) { const q = [Q[k * 4], Q[k * 4 + 1], Q[k * 4 + 2], Q[k * 4 + 3]], d = qmul(qinv(q0), q); const w = Math.min(1, Math.abs(d[3])), an_ = 2 * Math.acos(w);
    if (an_ > best[1]) { const s_ = Math.sqrt(1 - w * w) || 1, sg = d[3] < 0 ? -1 : 1; best = [[d[0] / s_ * sg, d[1] / s_ * sg, d[2] / s_ * sg], an_, T[k]]; } } return best; }
const [jax, jan] = delta('ANIM_Crow_EatSomething', jaw); jaw.setExtras({ ...(jaw.getExtras() || {}), oeffnen: jax.map(x => +x.toFixed(5)), oeffnenMax: +jan.toFixed(3) });
console.log('Kiefer-Achse', jax.map(x => x.toFixed(3)), 'max', (jan * 57.3).toFixed(1) + '°');
const [nax, nan] = delta('ANIM_Crow_EatSomething', neck), [hax, han] = delta('ANIM_Crow_EatSomething', head);
// Clip „Caw“: Grundhaltung = IdleLookAround bei t=0 (alle Kanäle), dazu Kiefer auf/zu (3 Rufe) und Verbeugung bei jedem Ruf
if (!anim('ANIM_Crow_Caw')) {
  const src = anim('ANIM_Crow_IdleLookAround'), A = doc.createAnimation('ANIM_Crow_Caw'), buf = R.listBuffers()[0];
  const DUR = 1.6, N = 49, T = new Float32Array(N).map((_, i) => i * DUR / (N - 1));
  const ruf = t => { let v = 0; for (const c of [.18, .62, 1.08]) { const x = (t - c) / .13; v = Math.max(v, Math.exp(-x * x)); } return v; };
  const bow = t => { let v = 0; for (const c of [.2, .64, 1.1]) { const x = (t - c) / .22; v = Math.max(v, Math.exp(-x * x)); } return v; };
  for (const ch of src.listChannels()) {
    const nd = ch.getTargetNode(), p = ch.getTargetPath(), sm = ch.getSampler(), O = sm.getOutput().getArray(), n = p === 'rotation' ? 4 : 3, v0 = Array.from(O.slice(0, n));
    const out = new Float32Array(N * n);
    for (let k = 0; k < N; k++) { let v = v0;
      if (p === 'rotation' && nd === jaw) v = qmul(v0, qaa(jax, .62 * ruf(T[k])));
      else if (p === 'rotation' && nd === neck) v = qmul(v0, qaa(nax, nan * .28 * bow(T[k])));
      else if (p === 'rotation' && nd === head) v = qmul(v0, qaa(hax, -han * .12 * bow(T[k])));
      out.set(v, k * n); }
    const s2 = doc.createAnimationSampler().setInput(doc.createAccessor().setArray(T).setType('SCALAR').setBuffer(buf)).setOutput(doc.createAccessor().setArray(out).setType(n === 4 ? 'VEC4' : 'VEC3').setBuffer(buf)).setInterpolation('LINEAR');
    A.addSampler(s2).addChannel(doc.createAnimationChannel().setTargetNode(nd).setTargetPath(p).setSampler(s2)); }
}
await doc.transform(prune({ keepAttributes: true, keepLeaves: true, keepExtras: true }));
fs.mkdirSync(path.dirname(ZIEL), { recursive: true }); fs.writeFileSync(ZIEL, await io.writeBinary(doc));
const tri = ix.length / 3; console.log('fertig', ZIEL, (fs.statSync(ZIEL).size / 1e6).toFixed(1) + ' MB', 'Dreiecke', tri, 'Vertices', nv, 'Clips', R.listAnimations().length);
