// AP-MOCAP: Motion-Capture-Bewegungen in fertige Figuren backen – nur die Bewegungen, Aussehen (Netze, Texturen, Haare, Kleidung) bleibt Byte für Byte gleich.
//   Quelle der Einstellungen: tools/cast.json → "mocap" (Quellen, Clip-Sätze je Figurentyp, Figur → Sätze). Kern: tools/mocap.mjs.
//   Schreibt game/assets/chars/<id>/model.glb UND model.glb.ktx.glb (gleiche Knoten; KTX-Texturen bleiben, kein Neukodieren).
//   Drehungen als normierte 16-Bit-Werte (glTF erlaubt das für Animationen, three.js dekodiert es), Schlüssel reduziert (≤ 0,1° Drehung, ≤ 0,03 % der Knochenlänge).
//   Clip-Metadaten (Tempo m/s, Schleife, Fußphase, Drehwinkel + Wurzelkurve) → Szene-extras.motion (im Spiel: gltf.scene.userData.motion).
// Aufruf (in app/): node tools/mocap_bake.mjs <id …|all> [--dry] [--only=walk,idle] [--no-ktx] [--info]
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import * as THREE from 'three'; import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'; import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { family, canonMap, bindRest, retarget, reduce, bodyFrame, prepSource } from './mocap.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), CHARS = path.resolve(HERE, '..', '..', 'game', 'assets', 'chars');
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k)); return a ? (a.includes('=') ? a.split('=')[1] : true) : null; };
const C = JSON.parse(fs.readFileSync(path.join(HERE, 'cast.json'), 'utf8')), MC = C.mocap;
// FBXLoader/GLTFLoader brauchen im Node ein paar Browser-Namen (Texturen werden hier nie gebraucht)
globalThis.window = globalThis; globalThis.self = globalThis; if (!globalThis.document) globalThis.document = { createElementNS: () => ({ style: {}, addEventListener() {}, removeEventListener() {}, setAttribute() {} }), createElement: () => ({ style: {}, getContext: () => null, addEventListener() {} }) };
const warn = console.warn; console.warn = (...a) => { if (!/FBXLoader|THREE\.|ImageBitmap|texture/i.test(String(a[0]))) warn(...a); };
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

// ---------- Quellen laden (einmal je Datei)
const srcCache = new Map();
function loadSrc(key) { if (srcCache.has(key)) return srcCache.get(key); const rel = MC.src[key] || C.src[key]; if (!rel) throw new Error('Quelle fehlt: ' + key);
  const file = path.resolve(HERE, rel), b = fs.readFileSync(file); let root, anims;
  if (/\.fbx$/i.test(file)) { root = new FBXLoader().parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), ''); anims = root.animations; }
  else throw new Error('nur FBX: ' + file);
  const r = { root, anims, file, ...prepSource(root) }; srcCache.set(key, r); return r; }

// ---------- Ziel: Skelett der fertigen Figur aus dem glTF-Dokument nachbauen (ohne Netze/Texturen)
function buildTarget(doc) { const R = doc.getRoot(), joints = new Set(R.listSkins().flatMap(s => s.listJoints())), map = new Map(), top = new THREE.Group();
  const mk = n => { const o = joints.has(n) ? new THREE.Bone() : new THREE.Object3D(); o.name = n.getName(); o.position.fromArray(n.getTranslation()); o.quaternion.fromArray(n.getRotation()); o.scale.fromArray(n.getScale()); o.userData.gn = n; map.set(n, o); n.listChildren().forEach(c => { if (!c.getMesh() || c.listChildren().length) o.add(mk(c)); }); return o; };
  for (const s of R.listScenes()) s.listChildren().forEach(c => top.add(mk(c)));
  top.updateMatrixWorld(true); return { root: top, map, joints }; }

// ---------- Clip in das Dokument schreiben (vorhandenen gleichnamigen ersetzen)
function writeClip(doc, name, res, nodeOf) { const R = doc.getRoot(), buf = R.listBuffers()[0];
  for (const a of R.listAnimations()) if (a.getName() === name) { a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(s => s.dispose()); a.dispose(); }
  const A = doc.createAnimation(name); let bytes = 0; const inCache = new Map();
  for (const t of res.tracks) { const gn = nodeOf(t.node); if (!gn) continue;
    const q = t.path === 'quaternion', L = q ? 0 : Math.max(1e-4, t.node.position.length()); const r = reduce(t.times, t.values, q ? 4 : 3, q ? 0.0017 : Math.max(3e-5, L * 3e-4));
    const tk = Array.from(r.times).join(','); let inp = inCache.get(tk); if (!inp) { inp = doc.createAccessor().setType('SCALAR').setArray(r.times).setBuffer(buf); inCache.set(tk, inp); bytes += r.times.byteLength; }
    let out; if (q) { const I = new Int16Array(r.values.length); for (let i = 0; i < I.length; i++) I[i] = Math.round(Math.max(-1, Math.min(1, r.values[i])) * 32767); out = doc.createAccessor().setType('VEC4').setArray(I).setNormalized(true).setBuffer(buf); bytes += I.byteLength; }
    else { out = doc.createAccessor().setType('VEC3').setArray(r.values).setBuffer(buf); bytes += r.values.byteLength; }
    const s = doc.createAnimationSampler().setInput(inp).setOutput(out).setInterpolation('LINEAR'); A.addSampler(s);
    A.addChannel(doc.createAnimationChannel().setTargetNode(gn).setTargetPath(q ? 'rotation' : 'translation').setSampler(s)); }
  return bytes; }

// Accessoren ohne Verwendung (alte, ersetzte Bewegungen) entfernen
const pruneAcc = doc => { let n = 0; for (const a of doc.getRoot().listAccessors()) if (!a.listParents().some(p => p.propertyType !== 'Root')) { a.dispose(); n++; } return n; };
// ---------- Figur backen
async function bakeFig(id) { const sets = MC.figs[id]; if (!sets) { console.log(id + ': kein Mocap-Satz'); return; }
  const f = path.join(CHARS, id, 'model.glb'), fk = f + '.ktx.glb'; const doc = await io.read(f), T = buildTarget(doc);
  const clips = {}; for (const s of sets) Object.assign(clips, MC.sets[s]);
  const only = opt('only') ? String(opt('only')).split(',') : null, tfam = family(T.root), tmap = canonMap(T.root, tfam);
  if (opt('info')) { const fr = bodyFrame(tmap); console.log(id, tfam, 'Knochen', [...tmap.keys()].length, 'oben', fr.up.toArray(), 'links', fr.left.toArray()); }
  const done = {}, motion = {}; let bytes = 0;
  for (const [name, [sk, o = {}]] of Object.entries(clips)) { if (only && !only.includes(name)) continue;
    try { const S = loadSrc(sk), clip = typeof o.clip === 'number' ? S.anims[o.clip] : o.clip ? S.anims.find(a => a.name === o.clip) : S.anims[0]; if (!clip) throw new Error('Clip fehlt in ' + sk);
      const res = retarget({ root: S.root, clip, fam: S.fam }, { root: T.root, fam: tfam }, { fps: 30, rm: o.rm || 'fix', loop: o.loop !== false, trim: o.trim, autoLoop: o.autoLoop, minLoop: o.minLoop, fingers: o.fingers, up: o.up, ik: opt('noik') ? false : o.ik });
      done[name] = res; motion[name] = res.meta;
      console.log(`  ${id}/${name}: ${S.fam}${S.hadBind ? '(Binde)' : ''}→${tfam} ${res.duration.toFixed(2)}s ${res.tracks.length} Spuren${res.meta.speed ? ' v=' + res.meta.speed.toFixed(2) + 'm/s' : ''}${Math.abs(res.meta.turn) > .2 ? ' Drehung ' + (res.meta.turn * 57.3).toFixed(0) + '°' : ''} Bilder ${res.meta.frames}`); if (opt('meta')) console.log('    ', JSON.stringify({ ...res.meta, root: undefined }));
    } catch (e) { console.log(`  ${id}/${name}: FEHLER ${e.message}`); } }
  if (opt('dry')) return { done, T };
  const idx = new Map(doc.getRoot().listNodes().map((n, i) => [n, i]));
  for (const [name, res] of Object.entries(done)) bytes += writeClip(doc, name, res, o => o.userData.gn);
  // Clips, die in keinem Satz der Figur mehr stehen (verworfene Quellen), entfernen – alle alten Namen (idle/walk/look/nervous/phone/window…) sind in den Sätzen enthalten
  const dropOld = d => { if (only) return []; const out = []; for (const a of d.getRoot().listAnimations()) if (!clips[a.getName()]) { out.push(a.getName()); a.listChannels().forEach(c => c.dispose()); a.listSamplers().forEach(x => x.dispose()); a.dispose(); } return out; };
  const dropped = dropOld(doc); if (dropped.length) console.log(`${id}: entfernt ${dropped.join(', ')}`);
  pruneAcc(doc); const sc = doc.getRoot().listScenes()[0], ex = sc.getExtras() || {}; if (ex.motion) for (const k of Object.keys(ex.motion)) if (!clips[k]) delete ex.motion[k]; ex.motion = Object.assign(ex.motion || {}, motion); sc.setExtras(ex);
  if (opt('out')) { const od = path.join(String(opt('out')), id); fs.mkdirSync(od, { recursive: true }); fs.writeFileSync(path.join(od, 'model.glb'), await io.writeBinary(doc)); fs.writeFileSync(path.join(od, 'motion.json'), JSON.stringify(motion)); console.log(`${id}: Probe → ${od} (Bewegungsdaten ${(bytes / 1024).toFixed(0)} KB)`); return { done, T }; }
  const before = fs.statSync(f).size; fs.writeFileSync(f, await io.writeBinary(doc));
  console.log(`${id}: ${Object.keys(done).length} Clips, Bewegungsdaten ${(bytes / 1024).toFixed(0)} KB, model.glb ${(before / 1e6).toFixed(1)} → ${(fs.statSync(f).size / 1e6).toFixed(1)} MB`);
  // KTX-Fassung: gleiche Knoten (Reihenfolge) → gleiche Bewegungen hineinschreiben
  if (!opt('no-ktx') && fs.existsSync(fk)) { const dk = await io.read(fk), nk = dk.getRoot().listNodes(), n0 = doc.getRoot().listNodes();
    if (nk.length !== n0.length || nk.some((n, i) => n.getName() !== n0[i].getName())) console.log(`${id}: KTX-Fassung hat andere Knoten – übersprungen (node tools/ktx.mjs neu laufen lassen)`);
    else { const byIdx = o => nk[idx.get(o.userData.gn)]; for (const [name, res] of Object.entries(done)) writeClip(dk, name, res, byIdx);
      dropOld(dk); pruneAcc(dk); const s2 = dk.getRoot().listScenes()[0], e2 = s2.getExtras() || {}; if (e2.motion) for (const k of Object.keys(e2.motion)) if (!clips[k]) delete e2.motion[k]; e2.motion = Object.assign(e2.motion || {}, motion); s2.setExtras(e2);
      const b2 = fs.statSync(fk).size; fs.writeFileSync(fk, await io.writeBinary(dk)); console.log(`${id}: model.glb.ktx.glb ${(b2 / 1e6).toFixed(1)} → ${(fs.statSync(fk).size / 1e6).toFixed(1)} MB`); } }
  // Figurenliste (chars.json): Clip-Namen nachführen
  const lf = path.join(CHARS, 'chars.json'), L = JSON.parse(fs.readFileSync(lf, 'utf8')), e = L.find(x => x.id === id);
  if (e) { e.clips = doc.getRoot().listAnimations().map(a => a.getName()); fs.writeFileSync(lf, JSON.stringify(L, null, 1)); }
  return { done, T }; }

const MAIN = /mocap_bake\.mjs$/.test(process.argv[1] || ''), ids = MAIN ? args.filter(a => !a.startsWith('--')) : []; const list = ids[0] === 'all' ? Object.keys(MC.figs) : ids;
for (const id of list) { const t0 = Date.now(); try { await bakeFig(id); } catch (e) { console.log(id + ': FEHLER ' + (e.stack || e)); } console.log(`  (${((Date.now() - t0) / 1000).toFixed(0)} s)`); }
export { bakeFig, loadSrc, buildTarget };
