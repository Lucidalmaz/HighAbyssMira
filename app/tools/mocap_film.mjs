// AP-MOCAP: Filmstreifen ohne Grafikkarte/Electron – fertige Figur (model.glb) mit ihren Bewegungen in Node skinnen und als flach schattierte Dreiecke (SVG → PNG, sharp) zeichnen.
// Zwei Reihen je Clip: schräg vorn und genau seitlich; Boden-Raster; Fortbewegung (motion.speed) läuft über das Raster, damit Gleiten sichtbar wird; Fußmarken (rot = Fuß am Boden).
// Aufruf (in app/): node tools/mocap_film.mjs <model.glb> <ausgabeordner> [clip,clip,…] [--n=6] [--w=260] [--tri=1] [--tag=name_]
import fs from 'fs'; import path from 'path'; import sharp from 'sharp'; import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const args = process.argv.slice(2), opt = k => { const a = args.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : null; }, pos = args.filter(a => !a.startsWith('--'));
const [file, outDir, clipArg] = pos, n = +(opt('n') || 6), W = +(opt('w') || 260), Hh = Math.round(W * 1.5), tag = opt('tag') || '', stepT = +(opt('tri') || 1);
globalThis.window = globalThis; globalThis.self = globalThis;
// Texturen entfernen (Node kann keine Bilder dekodieren) → GLTFLoader liefert Skin-Meshes + Clips
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS), doc = await io.read(file); for (const t of doc.getRoot().listTextures()) t.dispose();
for (const e of doc.getRoot().listExtensionsUsed()) if (/basisu|webp|texture_transform/i.test(e.extensionName)) e.dispose();
const bin = await io.writeBinary(doc), g = await new Promise((res, rej) => new GLTFLoader().parse(bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength), '', res, rej));
const root = g.scene, motion = root.userData.motion || {}, clips = clipArg ? clipArg.split(',') : g.animations.map(a => a.name);
const meshes = []; root.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
const col = m => { const c = (m && m.color) ? m.color.clone() : new THREE.Color(.7, .7, .7); if (m && /skin|body|head|arm|leg/i.test(m.name || '')) c.setRGB(.86, .68, .58); return c; };
const mx = new THREE.AnimationMixer(root), cam = new THREE.PerspectiveCamera(30, W / Hh, .01, 100), light = new THREE.Vector3(.4, .8, .6).normalize(), v = new THREE.Vector3(), tmp = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
root.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(root), H = bb.max.y - bb.min.y;
// Fußknochen für Bodenkontakt-Marken
let feet = []; for (const re of [/^(l_foot|footl|leftfoot|mixamorigleftfoot)(_\d+)?$/i, /^(r_foot|footr|rightfoot|mixamorigrightfoot)(_\d+)?$/i]) { let h = null; root.traverse(o => { if (!h && re.test(o.name)) h = o; }); if (h) feet.push(h); }
function frame(offZ, yawRot, camYaw, fixedCam = false) { if (!fixedCam) { root.position.set(0, 0, offZ); root.rotation.y = yawRot; root.updateMatrixWorld(true);
  const c = new THREE.Vector3(0, H * .5, offZ), d = H * 2.4; cam.position.set(c.x + Math.sin(camYaw) * d, c.y + H * .15, c.z + Math.cos(camYaw) * d); cam.lookAt(c); cam.updateMatrixWorld(true); cam.updateProjectionMatrix(); }
  const tris = [];
  for (const m of meshes) { const G = m.geometry, I = G.index, P = G.attributes.position, cnt = I ? I.count : P.count, mats = [].concat(m.material), groups = G.groups.length ? G.groups : [{ start: 0, count: cnt, materialIndex: 0 }];
    const cache = new Map(); const get = i => { let r = cache.get(i); if (r) return r; m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld); r = [v.x, v.y, v.z]; cache.set(i, r); return r; };
    for (const gr of groups) { const mat = mats[gr.materialIndex] || mats[0]; if (mat && (mat.visible === false || (mat.transparent && mat.opacity < .3))) continue; const base = col(mat);
      for (let k = gr.start; k < gr.start + gr.count; k += 3 * stepT) { const a = get(I ? I.getX(k) : k), b = get(I ? I.getX(k + 1) : k + 1), cc = get(I ? I.getX(k + 2) : k + 2);
        tmp[0].fromArray(a); tmp[1].fromArray(b); tmp[2].fromArray(cc); const nrm = new THREE.Vector3().subVectors(tmp[1], tmp[0]).cross(new THREE.Vector3().subVectors(tmp[2], tmp[0])); if (nrm.lengthSq() < 1e-14) continue; nrm.normalize();
        const cen = tmp[0].clone().add(tmp[1]).add(tmp[2]).divideScalar(3), toCam = cam.position.clone().sub(cen); if (nrm.dot(toCam) < 0) nrm.negate();
        const sh = .35 + .65 * Math.max(0, nrm.dot(light)); const pts = tmp.map(p => { const q = p.clone().project(cam); return [((q.x + 1) / 2 * W).toFixed(1), ((1 - q.y) / 2 * Hh).toFixed(1), q.z]; });
        tris.push([ (pts[0][2] + pts[1][2] + pts[2][2]) / 3, `<polygon points="${pts[0][0]},${pts[0][1]} ${pts[1][0]},${pts[1][1]} ${pts[2][0]},${pts[2][1]}" fill="rgb(${Math.round(base.r * sh * 255)},${Math.round(base.g * sh * 255)},${Math.round(base.b * sh * 255)})"/>`]); } } }
  tris.sort((a, b) => b[0] - a[0]);
  // Boden-Raster (Linien alle 0,25 m)
  const lines = []; for (let x = -3; x <= 3; x += .25) for (const [p0, p1] of [[[x, 0, -3 + offZ - (offZ % .25)], [x, 0, 3 + offZ - (offZ % .25)]], [[-3, 0, x + offZ - (offZ % .25)], [3, 0, x + offZ - (offZ % .25)]]]) {
    const a = new THREE.Vector3(...p0).project(cam), b = new THREE.Vector3(...p1).project(cam); if (a.z > 1 || b.z > 1) continue; lines.push(`<line x1="${((a.x + 1) / 2 * W).toFixed(1)}" y1="${((1 - a.y) / 2 * Hh).toFixed(1)}" x2="${((b.x + 1) / 2 * W).toFixed(1)}" y2="${((1 - b.y) / 2 * Hh).toFixed(1)}" stroke="#5d636b" stroke-width="1"/>`); }
  const marks = feet.map(f => { f.getWorldPosition(v); const on = v.y < bb.min.y + .13; const q = v.clone(); q.y = 0; q.project(cam); return `<circle cx="${((q.x + 1) / 2 * W).toFixed(1)}" cy="${((1 - q.y) / 2 * Hh).toFixed(1)}" r="3" fill="${on ? '#e33' : '#39f'}"/>`; });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${Hh}"><rect width="${W}" height="${Hh}" fill="#3a3d42"/>${lines.join('')}${tris.map(t => t[1]).join('')}${marks.join('')}</svg>`; }
fs.mkdirSync(outDir, { recursive: true });
// Handposen-Modus (--posen=game/assets/anim/haende_rauchen.json): Ich-Hände mit den Mocap-Fingerhaltungen, Nahansicht von oben-vorn und von der Seite
if (opt('posen')) { const L = JSON.parse(fs.readFileSync(opt('posen'), 'utf8')), names = (opt('liste') || Object.keys(L.posen).join(',')).split(',');
  const bone = (K, j) => { let h = null; root.traverse(o => { if (!h && o.name.replace(/_\d+$/, '') === K + '_Hand' + (j === 'Hand' ? '' : j)) h = o; }); return h; };
  const rest = new Map(); root.traverse(o => rest.set(o, o.quaternion.clone()));
  const cur = L.kurven.rauchen, dec = K => { const b = Buffer.from(cur[K], 'base64'); return new Int16Array(b.buffer, b.byteOffset, b.byteLength / 2); }, CR = { L: dec('L'), R: dec('R') };
  const tiles = []; let col = 0;
  for (const nm of names) { for (const [o, q] of rest) o.quaternion.copy(q);
    for (const K of ['L', 'R']) L.gelenke.forEach((j, ji) => { const b = bone(K, j); if (!b) return; let v;
      if (/^t\d/.test(nm)) { const f = Math.min(cur.bilder - 1, Math.round(parseFloat(nm.slice(1)) * L.fps)), o = (f * L.gelenke.length + ji) * 4; v = [0, 1, 2, 3].map(c => CR[K][o + c] / 32767); } else v = L.posen[nm][K][ji];
      if (v && (ji > 0 || opt('handgelenk'))) b.quaternion.fromArray(v); });
    root.updateMatrixWorld(true); const hb = bone(opt('seite') || 'R', 'Middle1'), c = hb.getWorldPosition(new THREE.Vector3()), sz = .45;
    for (const [row, dir] of [[0, [0, 1, .15]], [1, [0, -1, .15]]]) { cam.position.copy(c).add(new THREE.Vector3(...dir).normalize().multiplyScalar(sz)); cam.lookAt(c); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
      tiles.push({ col, row, svg: frame(0, 0, null, true) }); }
    col++; }
  const comp = await Promise.all(tiles.map(async T => ({ input: await sharp(Buffer.from(T.svg)).png().toBuffer(), left: T.col * W, top: 22 + T.row * Hh })));
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * col}" height="22"><rect width="100%" height="22" fill="#222"/><text x="6" y="16" font-family="Arial" font-size="14" fill="#ddd">${names.join('   ·   ')}</text></svg>`; comp.push({ input: await sharp(Buffer.from(label)).png().toBuffer(), left: 0, top: 0 });
  const out = path.join(outDir, tag + 'haende.png'); await sharp({ create: { width: W * col, height: Hh * 2 + 22, channels: 3, background: '#222' } }).composite(comp).png().toFile(out); console.log(out); process.exit(0); }
for (const name of clips) { const clip = g.animations.find(a => a.name === name); if (!clip) { console.log('fehlt:', name); continue; } const m = motion[name] || {};
  mx.stopAllAction(); const act = mx.clipAction(clip); act.setLoop(THREE.LoopOnce, 1); act.clampWhenFinished = true; act.reset().play();
  const tiles = [];
  for (let i = 0; i < n; i++) { const t = opt('one') ? clip.duration * .45 : clip.duration * i / n; mx.setTime(t); const yawR = m.rm === 'turn' && m.root ? m.root.yaw[Math.min(m.root.yaw.length - 1, Math.round(t * 10))] : 0;
    for (const camYaw of opt('one') ? [.55] : [.55, Math.PI / 2]) tiles.push({ i, row: camYaw > 1 ? 1 : 0, svg: frame((m.speed || 0) * t, yawR, camYaw) }); }
  const comp = await Promise.all(tiles.map(async T => ({ input: await sharp(Buffer.from(T.svg)).png().toBuffer(), left: T.i * W, top: 22 + T.row * Hh })));
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * n}" height="22"><rect width="100%" height="22" fill="#222"/><text x="6" y="16" font-family="Arial" font-size="14" fill="#ddd">${tag}${name}  ${clip.duration.toFixed(2)} s  ${m.rm || ''}${m.speed ? '  v=' + m.speed.toFixed(2) + ' m/s' : ''}${m.slide !== undefined ? '  Rutschen ' + m.slide.toFixed(3) + ' m/s' : ''}${m.turn ? '  Drehung ' + Math.round(m.turn * 57.3) + '°' : ''}</text></svg>`;
  comp.push({ input: await sharp(Buffer.from(label)).png().toBuffer(), left: 0, top: 0 });
  const out = path.join(outDir, tag + name + '.png'); await sharp({ create: { width: W * n, height: (opt('one') ? Hh : Hh * 2) + 22, channels: 3, background: '#222' } }).composite(comp).png().toFile(out); console.log(out); }
