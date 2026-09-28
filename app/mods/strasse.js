// =====================================================================  MODUL „strasse“ – Ortskern-Straßenraum
// Ersetzt alle selbstgebauten Straßenobjekte im Ortskern durch Scans/Modelle aus der Bibliothek und füllt die Straße mit Entdeckbarem:
// Autos (inkl. Lucys Auto mit echter Tür, Geisterauto), Briefkästen (inkl. mailbox7 mit Klappe + Schlüssel), Holzmasten + Leitungen + Hausanschlüsse,
// Ortstafel, Verkehrsschilder, Absperrung, Telefonzelle, Hydranten, Mülltonnen/-säcke, Bordsteine, Straßenschutt/-schmutz, Kanaldeckel,
// Vermisstenzettel an Laternen und Masten, Post in den Briefkästen, liegengelassenes Spielzeug.
const strasse_S = { lenaPiv: null, lenaProxy: null, boothGlow: null, signGlow: [], info: {} };
WORLD_MODS.push(['Straßenraum', async () => {
  const S = strasse_S, T = THREE, V3 = (x, y, z) => new T.Vector3(x, y, z);
  window.__strasse = S; // nur Diagnose (Testläufe)
  const warn = e => { console.warn('strasse:', e && e.message || e); return null; };
  const safe = p => Promise.resolve(p).catch(warn);
  const ryFor = (dx, dz) => Math.atan2(dx, dz); // Modell-Front (+z) zeigt nach (dx, dz)
  const findNear = (x, y, z, r, pred = () => true) => msFind((m, bb) => bb.getCenter(new T.Vector3()).distanceTo(V3(x, y, z)) < r && pred(m, bb));
  const hitBox = (w, h, d, x, y, z, parent) => box(w, h, d, x, y, z, hidden, { cast: false, parent });
  const rc = new T.Raycaster();
  S.cat = {}; const reg = (cat, o) => { (S.cat[cat] = S.cat[cat] || []).push(...[].concat(o).filter(Boolean)); return o; };
  const { SimplifyModifier } = await import('three/addons/modifiers/SimplifyModifier.js');
  const simplify = (geo, keep) => { try { const g = new SimplifyModifier().modify(geo, Math.floor(geo.attributes.position.count * (1 - keep))); g.computeBoundingBox(); g.computeBoundingSphere(); return g; } catch (e) { warn(e); return geo; } };
  // Instanzen räumlich in Blöcke teilen (Frustum-Culling + Abstands-Ausblendung im WORLD_TICK)
  S.far = []; const chunkInst = (cat, parts, mats, size, maxD, opt) => { const buckets = new Map();
    for (const m of mats) { const e = m.elements, k = Math.floor(e[12] / size) + ',' + Math.floor(e[14] / size); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(m); }
    for (const list of buckets.values()) { const ims = msInst(parts, list, opt); reg(cat, ims); if (maxD) { const c = new T.Vector3(); list.forEach(m => c.add(new T.Vector3().setFromMatrixPosition(m))); c.divideScalar(list.length); S.far.push({ ims, c, d: maxD + size * .75 }); } } };
  const shown = o => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  const rayHit = (root, from, dir, far = 4) => { rc.set(from, dir); rc.far = far; return rc.intersectObject(root, true).find(h => { if (!shown(h.object)) return false; const mt = [].concat(h.object.material)[h.face && h.face.materialIndex || 0] || [].concat(h.object.material)[0]; return mt && mt.visible !== false && !mt.transparent && mt.name !== 'Glass' && mt.blending !== T.AdditiveBlending; }); };

  // ---------- Verwitterung: Laufspuren/Flecken aus dem Scan „wall_damaged“ (triplanar, Weltkoordinaten) + Spritzschmutz unten
  const stainT = msTex('wall_damaged/b.jpg', true);
  function weather(mat, o = {}) {
    const u = { tSt: { value: stainT }, uS: { value: o.scale ?? .5 }, uA: { value: o.amt ?? .5 }, uLow: { value: o.low ?? .55 }, uLA: { value: o.lowAmt ?? .55 }, uDirt: { value: new T.Color(o.dirt ?? 0x2e271c) } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStW; varying vec3 vStN;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
vStW = (modelMatrix * instanceMatrix * vec4(position, 1.)).xyz; vStN = mat3(modelMatrix * instanceMatrix) * normal;
#else
vStW = (modelMatrix * vec4(position, 1.)).xyz; vStN = mat3(modelMatrix) * normal;
#endif`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vStW; varying vec3 vStN; uniform sampler2D tSt; uniform float uS, uA, uLow, uLA; uniform vec3 uDirt;
float stL(vec2 p){ return dot(texture2D(tSt, p).rgb, vec3(.3, .59, .11)); }
float stGrime(){ vec3 w = abs(normalize(vStN)) + 1e-4; w /= (w.x + w.y + w.z); vec3 p = vStW * uS;
  float l = stL(p.zy) * w.x + stL(p.xz + .37) * w.y + stL(p.xy + .71) * w.z; return smoothstep(.5, .28, l); }`)
        .replace('#include <map_fragment>', `#include <map_fragment>
float stM = clamp(stGrime() * uA + (1. - smoothstep(.0, uLow, vStW.y)) * uLA, 0., .9);
diffuseColor.rgb = mix(diffuseColor.rgb, uDirt * (.55 + .45 * diffuseColor.rgb), stM);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .95, stM);')
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor *= 1. - stM * .85;');
    };
    mat.customProgramCacheKey = () => 'strasse_weather'; mat.needsUpdate = true; return mat;
  }
  const loadImg = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('Bild ' + src)); im.src = src; });
  async function recolor(path, size, fn, flipY) {
    const im = await loadImg('assets/ms/' + path), c = document.createElement('canvas'); c.width = c.height = size;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0, size, size);
    const d = x.getImageData(0, 0, size, size); fn(d.data, size); x.putImageData(d, 0, 0);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.flipY = flipY; return t;
  }
  const bakeObj = o => { o.updateMatrixWorld(true); const parts = []; o.traverse(m => { if (m.isMesh && m.visible) parts.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material, name: m.name }); }); return parts; };
  const toF32 = geo => { for (const k of Object.keys(geo.attributes)) { const a = geo.attributes[k]; if (a.array instanceof Float32Array && !a.isInterleavedBufferAttribute) continue;
    const n = a.count, s = a.itemSize, arr = new Float32Array(n * s); for (let i = 0; i < n; i++) { arr[i * s] = a.getX(i); if (s > 1) arr[i * s + 1] = a.getY(i); if (s > 2) arr[i * s + 2] = a.getZ(i); if (s > 3) arr[i * s + 3] = a.getW(i); }
    geo.setAttribute(k, new T.BufferAttribute(arr, s)); } return geo; };
  const canvasTex = (w, h, fn, srgb = true) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t; };
  const grain = (x, w, h, n, a) => { for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '60,48,30' : '255,250,235'},${rand(0, a)})`; x.fillRect(rand(0, w), rand(0, h), rand(1, 3), rand(1, 3)); } };

  // ---------- Laden (parallel)
  const SED = (paint, lights) => ({ Car_base_color: { b: 'Car_color.jpg', color: paint, rough: .38, metal: .55 }, Car_detail: { b: 'Car_details.jpg', rough: .8, metal: .1 },
    Glass: { color: 0x0b1013, rough: .05, metal: .7, transparent: true }, Car_number: { b: 'Car_Number.jpg', rough: .6 },
    Car_LightForward: { color: 0xcfcfc8, rough: .15, emissive: lights ? 0xfff0d0 : 0 }, Car_stopLight: { color: 0x4a0606, rough: .25, emissive: lights ? 0x500000 : 0 },
    Car_backLight: { color: 0x220505, rough: .25 }, Car_Turnlight_L: { color: 0x5a3208, rough: .3 }, Car_Turnlight_R: { color: 0x5a3208, rough: .3 }, '*': { color: 0x1c1c1c, rough: .7 } });
  const VAN = { 'Material #928': { n: 'van_undamaged_n.jpg', r: 'van_undamaged_roughness.jpg', m: 'van_undamaged_metallic.jpg', ao: 'van_AO.jpg' }, 'Material #925': { color: 0x333333 } };
  const MB = { Mailbox: { b: 'MailboxAlbedo.jpg', n: 'MailboxNormal.jpg', r: 'MailboxRough.jpg', m: 'MailboxMetal.jpg', ao: 'MailboxAO.jpg' }, MailboxFlap: { b: 'MailboxFlapAlbedo.jpg', n: 'MailboxFlapNormal.jpg', r: 'MailboxFlapRough.jpg', m: 'MailboxFlapMetal.jpg', ao: 'MailboxFlapAO.jpg' },
    MailboxFlag: { b: 'MailboxFlagAlbedo.jpg', n: 'MailboxFlagNormal.jpg', r: 'MailboxFlagRough.jpg', m: 'MailboxFlagMetal.jpg' } };
  const RS = { '*': { b: 'road_sign_pack_MAT_RoadSign_BaseColor.jpg', n: 'road_sign_pack_MAT_RoadSign_Normal.jpg', r: 'road_sign_pack_MAT_RoadSign_Roughness.jpg', m: 'road_sign_pack_MAT_RoadSign_Metallic.jpg', ao: 'road_sign_pack_MAT_RoadSign_AO.jpg' } };
  const BURN = { 'Material #26': { b: 'burnedsedan_d.jpg', n: 'burnedsedan_normal.jpg', r: 'burnedsedan_rough.jpg', m: 'burnedsedan_m.jpg', ao: 'burnedsedan_ao.jpg' }, 'Material #25': { color: 0x222222 } };
  const TOYS = { '*': { b: 'T_Toys_BaseColor.jpg', n: 'T_Toys_Normal.jpg', ao: 'T_Toys_ORM.jpg', rough: .75 } };
  const L = await Promise.all([
    safe(msFBX('car_amsedan', 'Car.fbx', SED(0x4f5f68, true))), safe(msFBX('car_amsedan', 'Car.fbx', SED(0x121416, true))), safe(msFBX('car_amsedan', 'Car.fbx', SED(0x3f1512, false))), safe(msFBX('car_amsedan', 'Car.fbx', SED(0x5e5c4a, false))),
    safe(msModel('car_dutch', 'model.glb')), safe(msModel('car_rusty', 'model.glb')), safe(msFBX('car_burned', 'model.fbx', BURN)), safe(msFBX('vans', 'model.fbx', VAN)),
    safe(msFBX('mailbox_cc0', 'model.fbx', MB)), safe(msFBX('poles_wood', 'wood_pole_03.fbx', {})), safe(msFBX('roadsigns', 'model.fbx', RS)), safe(msModel('parksign')),
    safe(msBake('hydrant')), safe(msBake('trashcan')), safe(msBake('trashbag')), safe(msBake('curbs')), safe(msBake('asphalt_debris')), safe(msModel('barrier_ms')), safe(msBake('cone_ms')),
    safe(msFBX('toys_old', 'model.fbx', TOYS)), safe(MSL.gl.loadAsync('assets/manhole/model.gltf')),
    // Transporter ohne Firmenaufdruck: Lack neu (dunkelgrau), Fenster/Leuchten/Reifen/Grill bleiben aus dem Original
    safe(recolor('vans/van_undamaged_d.jpg', 1024, (p, n) => {
      const keepR = [[0, 0, 150, 165], [140, 0, 560, 150], [12, 712, 112, 885], [298, 298, 398, 462], [578, 728, 722, 1012], [748, 606, 988, 714], [705, 510, 745, 570], [995, 510, 1024, 570], [160, 105, 212, 195], [445, 1000, 500, 1024], [828, 735, 905, 1005], [700, 0, 1024, 482], [270, 235, 335, 305]];
      const inR = new Uint8Array(n * n), dark = new Uint8Array(n * n), tmp = new Uint8Array(n * n);
      for (const [x0, y0, x1, y1] of keepR) for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) inR[y * n + x] = 1;
      for (let i = 0; i < n * n; i++) { const r = p[i * 4], g = p[i * 4 + 1], b = p[i * 4 + 2], Lm = .3 * r + .59 * g + .11 * b; dark[i] = Lm < 55 && !(b - r > 25) ? 1 : 0;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (((b - r > 30) && b > 60) || (mn > 150 && mx - mn < 50)) inR[i] = 0; }
      const morph = (src, dst, isMin) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { let v = isMin ? 1 : 0; for (let k = -2; k <= 2; k++) { const s = src[y * n + Math.min(n - 1, Math.max(0, x + k))]; v = isMin ? v & s : v | s; } dst[y * n + x] = v; }
        for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) { let v = isMin ? 1 : 0; for (let k = -2; k <= 2; k++) { const s = dst[Math.min(n - 1, Math.max(0, y + k)) * n + x]; v = isMin ? v & s : v | s; } src[y * n + x] = v; } };
      morph(dark, tmp, true); morph(dark, tmp, false);
      const G1 = Array.from({ length: 26 * 26 }, Math.random), G2 = Array.from({ length: 98 * 98 }, Math.random);
      const vn = (G, gs, x, y) => { const fx = x / n * (gs - 2), fy = y / n * (gs - 2), ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy, a = G[iy * gs + ix], b = G[iy * gs + ix + 1], c = G[(iy + 1) * gs + ix], d = G[(iy + 1) * gs + ix + 1]; return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty; };
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const i = y * n + x; if (inR[i] || dark[i]) continue; const k = .78 + .4 * (.75 * vn(G1, 26, x, y) + .25 * vn(G2, 98, x, y));
        p[i * 4] = 62 * k; p[i * 4 + 1] = 65 * k; p[i * 4 + 2] = 63 * k; }
    }, true)),
    // Hydrant nach deutscher Art: Körper rot, Kappe silbrig (statt weiß/blau)
    safe(recolor('hydrant/t0.jpg', 1024, p => { for (let i = 0; i < p.length; i += 4) { const r = p[i], g = p[i + 1], b = p[i + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), Lm = (.3 * r + .59 * g + .11 * b) / 255;
      if (b - r > 40 && b > 80) { const k = Math.min(1.25, Lm / .4); p[i] = 150 * k; p[i + 1] = 152 * k; p[i + 2] = 148 * k; }
      else if (mn > 110 && mx - mn < 45) { const k = Math.min(1.2, Lm / .78); p[i] = 138 * k; p[i + 1] = 22 * k; p[i + 2] = 16 * k; } } }, false)),
    // Parkverbotsschild → Gemeinde-Schild (deutscher Text auf dem gescannten Blech; die alte Schrift schimmert durch)
    safe((async () => { const im = await loadImg('assets/ms/parksign/t0.jpg'), n = 2048, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); x.drawImage(im, 0, 0, n, n);
      const plate = (x0, y0, w, h, rot) => { x.save(); x.translate(x0 + w / 2, y0 + h / 2); x.rotate(rot); x.translate(-w / 2, -h / 2);
        x.fillStyle = '#d9d8d2'; x.fillRect(0, 0, w, h); x.globalAlpha = .5; grain(x, w, h, 3000, .35); x.globalAlpha = 1;
        x.strokeStyle = '#b8201c'; x.lineWidth = w * .012; x.strokeRect(w * .03, h * .03, w * .94, h * .94);
        x.fillStyle = '#b8201c'; x.textAlign = 'center'; x.font = `bold ${w * .085}px Arial`; x.fillText('GEMEINDE LOST EYENGLESS', w / 2, h * .15);
        x.fillRect(w * .08, h * .19, w * .84, h * .012); x.font = `bold ${w * .15}px Arial`; x.fillText('NACHTRUHE', w / 2, h * .36);
        x.font = `bold ${w * .12}px Arial`; x.fillText('3 – 4 UHR', w / 2, h * .52); x.font = `${w * .075}px Arial`; x.fillText('Straße nicht betreten', w / 2, h * .66); x.fillText('Kinder im Haus behalten', w / 2, h * .77);
        x.font = `${w * .05}px Arial`; x.fillText('Der Bürgermeister', w / 2, h * .9); x.restore(); };
      plate(1250, 700, 675, 675, 0); plate(52, 380, 675, 675, Math.PI / 2);
      x.globalAlpha = .35; x.globalCompositeOperation = 'multiply'; x.drawImage(im, 1250, 700, 675, 675, 1250, 700, 675, 675); x.drawImage(im, 52, 380, 675, 675, 52, 380, 675, 675); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.flipY = false; t.anisotropy = 8; return t; })()),
  ]);
  const [sLena, sGhost, sRed, sBeige, dutchSrc, rustySrc, burnSrc, vanSrc, mbSrc, poleSrc, rsSrc, parkSrc, hydParts, canParts, bagParts, curbParts, debParts, barSrc, coneParts, toySrc, manholeG, vanTex, hydTex, parkTex] = L;
  S.info.loaded = L.map(v => v ? 1 : 0).join('');

  // =====================================================================  AUTOS
  // Selbstgebaute Karosserie ausblenden (Gruppe, Lichter, Tür-Klickfläche, Telefon, Foto bleiben erhalten)
  function stripCar(g, keep = []) {
    const dPiv = g.userData.door, dm = g.userData.doorMesh;
    for (const c of [...g.children]) {
      if (keep.includes(c) || c.isLight) continue;
      if (c === dPiv) { for (const d of dPiv.children) if (d !== dm) msHide(d); continue; }
      if (c.isMesh) msHide(c);
    }
    if (dm) { dm.material = hidden; dm.castShadow = false; }
  }
  // Limousine (car_amsedan) für eine car()-Gruppe (Front = lokal −x); Lack mit Laufspuren und Spritzschmutz, Glas dunkel
  // Deutsche Kennzeichen (Kfz-Schild „BH …“), Platzierung wie im Original-Atlas (Schrift mittig)
  const plateTex = txt => canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d6d4cc'; x.fillRect(0, 0, w, h); grain(x, w, h, 900, .15); x.fillStyle = '#1d3f9a'; x.fillRect(22, 196, 52, 120); x.fillStyle = '#e0c040'; x.beginPath(); x.arc(48, 232, 12, 0, 7); x.fill();
    x.fillStyle = '#fff'; x.font = 'bold 30px Arial'; x.textAlign = 'center'; x.fillText('D', 48, 298); x.fillStyle = '#111'; x.font = 'bold 118px Arial'; x.fillText(txt, 292, 300);
    x.strokeStyle = '#111'; x.lineWidth = 6; x.strokeRect(14, 186, 484, 140); });
  function fitSedan(o, lights, plate) {
    o.traverse(m => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true;
      for (const mt of [].concat(m.material)) { if (mt.name === 'Glass') { mt.opacity = .84; }
        if (mt.name === 'Car_base_color' && !mt.userData.w) { mt.userData.w = 1; weather(mt, { amt: .38, lowAmt: .6, low: .62, scale: .9 }); }
        if (mt.name === 'Car_number' && plate && !mt.userData.p) { mt.userData.p = 1; mt.map = plateTex(plate); mt.needsUpdate = true; }
        if (mt.name === 'Car_detail' && !mt.userData.w) { mt.userData.w = 1; weather(mt, { amt: .3, lowAmt: .55, low: .45, scale: .55 }); }
        if (lights && mt.name === 'Car_LightForward') mt.emissiveIntensity = 3.5; if (lights && mt.name === 'Car_stopLight') mt.emissiveIntensity = 1.4; } });
    o.scale.setScalar(4.55 / 212.53); o.rotation.y = -PI / 2; return reg('cars', msGround(o));
  }
  const clickOn = (g, w, h, d, label, fn) => interact(hitBox(w, h, d, 0, h / 2 + .1, 0, g), label, fn);
  const lockedTalk = (lines, x, z) => { let k = 0; return () => { Audio.play('metalHit2', { gain: .3, rate: 1.3, x, y: .8, z, ref: 2 }); toast(lines[k++ % lines.length], 4600); }; };
  const reTalk = (c, lines) => { const dm = c.userData.doorMesh; if (!dm) return; uninteract(dm); interact(dm, 'Autotür', lockedTalk(lines, c.position.x, c.position.z)); };

  // ---- Lucys Auto: echte Limousine, Fahrertür schwenkt nach außen, Handy + Foto auf den Sitzen, Scheinwerfer an
  // STORY-HOOK: Lucys Auto (Innenraum/Kennzeichen für spätere Story-Details)
  if (sLena) {
    stripCar(lenaCar, [lenaPhone, PHOTOS[1] && PHOTOS[1].mesh]);
    const car = fitSedan(sLena, true, 'BH·L 2310'); lenaCar.add(car); lenaCar.updateMatrixWorld(true); // STORY-HOOK: Kennzeichen = 23.10.
    let door = null; sLena.traverse(m => { if (m.isMesh && m.name === 'CDoor_FL') door = m; });
    if (door) {
      const inv = lenaCar.matrixWorld.clone().invert(), bb = new T.Box3().setFromObject(door).applyMatrix4(inv);
      const piv = new T.Group(); piv.position.set(bb.min.x + .06, 0, bb.max.z - .05); lenaCar.add(piv); piv.updateMatrixWorld(true); piv.attach(door);
      const dm = lenaCar.userData.doorMesh; piv.add(dm); dm.geometry = new T.BoxGeometry(bb.max.x - bb.min.x, bb.max.y - bb.min.y, .16);
      dm.position.set((bb.max.x - bb.min.x) / 2 - .06, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2 - piv.position.z); dm.rotation.set(0, 0, 0); dm.scale.set(1, 1, 1);
      S.lenaPiv = piv; S.lenaProxy = new T.Object3D(); lenaCar.userData.door = S.lenaProxy; // das Spiel tweent ry des Proxys → Tür schwenkt (gespiegelt) nach außen
      S.info.door = bb.min.toArray().concat(bb.max.toArray()).map(v => +v.toFixed(2));
    }
    // Sitzhöhen per Strahl (Handy auf den Beifahrersitz, Foto auf den Fahrersitz)
    const seat = (lx, lz) => { const h = rayHit(car, lenaCar.localToWorld(V3(lx, 1.1, lz)), V3(0, -1, 0), 1.1); return h ? lenaCar.worldToLocal(h.point.clone()).y : .55; };
    lenaPhone.position.set(-.12, seat(-.12, -.36) + .012, -.36); lenaPhone.rotation.set(0, .4, 0);
    if (PHOTOS[1] && PHOTOS[1].mesh) PHOTOS[1].mesh.position.set(.1, seat(.1, .36) + .01, .36);
    S.info.seats = [seat(-.12, -.36), seat(.1, .36), seat(.9, 0)].map(v => +v.toFixed(2));
  }
  // ---- Geisterauto (fährt einmal durch den Ort): fast schwarz, Scheinwerfer an
  if (sGhost) { stripCar(ghostCar); ghostCar.add(fitSedan(sGhost, true, 'BH·J 1312')); } // STORY-HOOK: Kennzeichen 1312
  // ---- Geparkte Autos: alle auf der Nordspur (Südspur = Bahn des Geisterautos bei z = −2), Front in Fahrtrichtung (+x)
  if (dutchSrc) { // verlassener Oldtimer (Scan) – das mitgescannte Pflasterstück wird rund um das Auto weggeschnitten
    stripCar(parkedA); parkedA.rotation.y = PI; parkedA.position.set(-37, 0, 3.15);
    dutchSrc.updateMatrixWorld(true); let dm = null; dutchSrc.traverse(o => { if (o.isMesh) dm = o; });
    const geo = toF32(dm.geometry.clone()); geo.applyMatrix4(dm.matrixWorld);
    const pos = geo.attributes.position, fb = new T.Box3(), v = new T.Vector3();
    { const xs = [], zs = []; for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y > .6 && y < 1.2) { xs.push(pos.getX(i)); zs.push(pos.getZ(i)); } } xs.sort((a, b) => a - b); zs.sort((a, b) => a - b);
      const q = (a, f) => a[Math.min(a.length - 1, Math.floor(a.length * f))]; fb.min.set(q(xs, .004), 0, q(zs, .004)); fb.max.set(q(xs, .996), 2, q(zs, .996)); }
    const idx = geo.index ? geo.index.array : Array.from({ length: pos.count }, (_, i) => i), keep = [], gy = [];
    for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2];
      const cx = (pos.getX(a) + pos.getX(b) + pos.getX(c)) / 3, cz = (pos.getZ(a) + pos.getZ(b) + pos.getZ(c)) / 3, my = Math.max(pos.getY(a), pos.getY(b), pos.getY(c));
      const inside = cx > fb.min.x + .02 && cx < fb.max.x - .02 && cz > fb.min.z + .02 && cz < fb.max.z - .02, under = cx > fb.min.x + .15 && cx < fb.max.x - .15 && cz > fb.min.z + .25 && cz < fb.max.z - .25;
      if (my < .06 && !under) { gy.push(my); continue; } if (!inside && my < .95) continue; keep.push(a, b, c); }
    geo.setIndex(keep); geo.computeBoundingBox(); geo.computeBoundingSphere();
    const mat = dm.material; if (mat.color) mat.color.multiplyScalar(.8);
    const m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true;
    gy.sort((a, b) => a - b); const g0 = gy.length ? gy[gy.length >> 1] : 0, c = fb.getCenter(new T.Vector3());
    m.position.set(-c.x, .024 - g0, -c.z); const w = new T.Group(); w.add(m); w.rotation.y = -PI / 2; parkedA.add(w); reg('cars', w);
    S.info.dutch = fb.getSize(new T.Vector3()).toArray().map(v => +v.toFixed(2)).concat([+g0.toFixed(3), keep.length / 3, idx.length / 3]);
    reTalk(parkedA, ['Abgeschlossen. Auf dem Fahrersitz: Laub. Als stünde er seit Jahren hier.', 'Moos wächst auf dem Dach. Hinter der Scheibe: ein Parkschein vom 5. August 2009.']);
  }
  if (sRed) { stripCar(parkedB); parkedB.rotation.y = PI; parkedB.position.set(36.5, 0, 3.1); parkedB.add(fitSedan(sRed, false, 'BH·HW 713'));
    reTalk(parkedB, ['Abgeschlossen. Innen beschlagen. Jemand hat darin geatmet.', 'Auf dem Rücksitz: ein Kindersitz. Der Gurt ist geschlossen. Niemand sitzt darin.']); }
  if (sBeige) { const g = new T.Group(); g.position.set(-49.5, 0, 3.1); g.rotation.y = PI; scene.add(g); g.add(fitSedan(sBeige, false, 'BH·AR 1992'));
    clickOn(g, 4.4, 1.3, 1.9, 'Auto', lockedTalk(['Abgeschlossen. Auf dem Armaturenbrett liegen sieben Kastanien in einer Reihe.', 'Die Motorhaube ist warm. Unter dem Wagen ist der Asphalt trocken – als wäre er eben erst gekommen.'], -49.5, 3.1)); }
  // ---- Transporter ohne Aufschrift vor der Telefonzelle – STORY-HOOK: Amt für Rückführung beobachtet die Straße
  if (vanSrc) { let dmg = null; vanSrc.traverse(m => { if (!m.isMesh) return; const mt = [].concat(m.material)[0]; if (/925/.test(mt.name)) dmg = m; else if (vanTex) { mt.map = vanTex; mt.needsUpdate = true; weather(mt, { amt: .4, lowAmt: .6, low: .7, scale: .45 }); } });
    if (dmg) dmg.parent.remove(dmg); vanSrc.scale.setScalar(4.9 / 377.9); vanSrc.rotation.y = ryFor(1, 0); const g = msGround(vanSrc); msPlace(g, 14.6, 0, 3.25, 0); reg('cars', g);
    clickOn(g, 4.9, 1.8, 2.05, 'Transporter', lockedTalk(['Keine Aufschrift. Die hinteren Scheiben sind von innen abgeklebt. Drinnen summt etwas – dann nicht mehr.', 'An der Tür ein Aufkleber, halb abgekratzt: „…ückführung · Außenst…“', 'Du legst das Ohr ans Blech. Drinnen atmet jemand, ganz ruhig. Im selben Takt wie du.'], 14.6, 3.25)); }
  // ---- Überwucherter Sportwagen an der Sperre (seit 2009) – STORY-HOOK: wer 2009 wegwollte, kam bis hier
  if (rustySrc) { const root = rustySrc.clone(true); const under = (o, n) => { for (let p = o; p; p = p.parent) if (p.name === n) return true; return false; }; const drop = [];
    root.traverse(o => { if (!o.isMesh) return; if (!under(o, 'Group002')) { drop.push(o); return; } const mt = o.material; if (mt.transparent) { mt.transparent = false; mt.alphaTest = .45; mt.depthWrite = true; mt.side = T.DoubleSide; } o.castShadow = true; o.receiveShadow = true; });
    drop.forEach(o => o.parent.remove(o)); const g = msGround(root); const w = new T.Group(); w.add(g); g.rotation.y = PI + .06; msPlace(w, -2.25, 0, -42.3, 0); reg('cars', w);
    clickOn(w, 2.1, 1.2, 4.2, 'Überwachsenes Auto', lockedTalk(['Efeu wächst durch die Lüftung. Auf dem Armaturenbrett: ein Parkschein, 5. August 2009, 03:13 Uhr.', 'Der Schlüssel steckt. Festgerostet – auf halber Drehung.'], -2.25, -42.3)); }
  // ---- Ausgebranntes Auto vor dem Brandhaus Nr. 5 (das einzige Wrack im Ortskern)
  if (burnSrc) { const drop = []; burnSrc.traverse(m => { if (m.isMesh && /25/.test([].concat(m.material)[0].name)) drop.push(m); }); drop.forEach(m => m.parent.remove(m));
    msFit(burnSrc, 4.4, 'z'); burnSrc.rotation.y = ryFor(-1, 0) + .14; const g = msGround(burnSrc); msPlace(g, -8.5, 0, -13.05, 0); reg('cars', g);
    clickOn(g, 4.6, 1.3, 2.2, 'Ausgebranntes Auto', lockedTalk(['Ausgebrannt bis aufs Blech. Auf dem Rücksitz: das Gestell eines Kindersitzes.', 'Die Asche im Fußraum ist weich und warm. Darin: der Abdruck einer kleinen Hand.'], -8.5, -13.05)); }

  // =====================================================================  BRIEFKÄSTEN (mailbox_cc0: Kasten mit Klappe und Fähnchen auf Holzpfosten)
  const bodies = msFind(m => !!(m.userData && m.userData.lid && m.userData.group)); // alle mailboxAt()-Kästen (Nr. 1, 2, 3, 4, 6, 7, 8, 9)
  const mbDefs = { // neue Stelle neben dem Gartentor (vor dem Zaun, außerhalb des Tor-Schwenkbereichs) + Inhalt
    '-25.4,-8.2': { at: [-26.55, -6.72, 0], who: 'Vegas', note: ['Post für L. Vegas', 'Eine Karte der Tierarztpraxis: <b>Impferinnerung für BRUNO – fällig seit 23.10.</b>\n\nAuf der Rückseite, mit Bleistift, in Kinderschrift:\n<span class="hand">„er ist jetzt bei uns. er friert nicht mehr.“</span>', 'strasse_mb3'] }, // STORY-HOOK: Bruno
    '52.6,-8.2': { at: [51.45, -6.72, 0], who: 'Nr. 9', note: ['Vergilbte Post · Nr. 9', 'Der Kasten ist vollgestopft. Werbung, Rechnungen – alles von 2009. Ganz unten ein Behördenbrief, nie geöffnet:\n\n<b>Amt für Rückführung · Außenstelle Lost Eyengless</b>\n„Terminerinnerung: Nachuntersuchung Ihres Kindes am Donnerstag, 6. August 2009, <b>03:00 Uhr</b>. Bitte bringen Sie das Kind barfuß. Begleitpersonen warten draußen.“', 'strasse_mb9'] }, // STORY-HOOK: Amt 2009
    '-52.6,8.2': { at: [-51.45, 6.72, PI], who: 'Nr. 2', note: ['Postkarte ohne Absender', 'Vorn: die Kreuzung von Lost Eyengless, bei Tag, im Sommer. Hinten kein Absender, nur ein Poststempel vom 23.10.2026 und ein Satz in runder Kinderschrift:\n\n<span class="hand">„Sind sie wieder da?“</span>', 'strasse_mb2'] }, // STORY-HOOK: Heidi
    '-30.6,8.2': { at: [-29.45, 6.72, PI], who: 'Nr. 4', empty: 'Leer. Nur feuchte Erde auf dem Boden des Kastens. Und ein Milchzahn.' },
    '19.4,8.2': { at: [20.55, 6.72, PI], who: 'Nr. 6', flag: true, note: ['Ausgehende Post', 'Die Fahne ist oben: ein Brief zum Abholen. Keine Briefmarke. Adresse in Wachsmalstift: <b>An Mama. Lost Eyengless.</b>\n\n<span class="hand">„mir geht es gut. hier ist es hell und warm. die anderen sind auch da. wir sind wieder vollzählig. komm nicht suchen.“</span>', 'strasse_mb6'] }, // STORY-HOOK: das Weiße
    '43.4,8.2': { at: [44.55, 6.72, PI], who: 'Nr. 8', note: ['Ein Brief an dich', 'Ein Umschlag, der hier nicht hingehört.\nEmpfänger: <b>Luke Brandt, Ahornstraße 1</b>\nAbsender: <b>Luke Brandt, Ahornstraße 1</b>\nPoststempel: 5. August 2009. Aufkleber der Post: <i>Empfänger unbekannt.</i>\n\nDer Umschlag ist zugeklebt. Du bringst es nicht über dich, ihn zu öffnen.', 'strasse_mb8'] }, // STORY-HOOK: das achte Kind
    '-49.2,-6.9': { at: [-48.45, -6.72, 0], who: 'Brandt', note: ['Post für Familie Brandt', 'Werbung. Eine Stromrechnung, ungeöffnet. Und ein grauer Umschlag ohne Briefmarke, persönlich eingeworfen:\n\n<b>Amt für Rückführung</b>\n„Einladung zur Nachuntersuchung – Lucy B. Das Erscheinen ist verpflichtend.“\n\nDatiert: 20. Oktober 2026. Drei Tage, bevor sie verschwand.', 'strasse_mb1'] }, // STORY-HOOK: Lucy / Amt
  };
  const envMat = new T.MeshStandardMaterial({ roughness: .95, side: T.DoubleSide, map: canvasTex(256, 160, (x, w, h) => { x.fillStyle = '#d8cfb6'; x.fillRect(0, 0, w, h); grain(x, w, h, 900, .25); x.strokeStyle = 'rgba(80,60,40,.35)'; x.beginPath(); x.moveTo(0, 0); x.lineTo(w / 2, h * .55); x.lineTo(w, 0); x.stroke();
    x.fillStyle = '#6a2a20'; x.fillRect(w - 46, 10, 34, 40); x.fillStyle = 'rgba(30,30,60,.7)'; x.font = '15px Caveat'; x.fillText('Lost Eyengless', 40, h - 40); x.fillRect(40, h - 30, 120, 2); }) });
  const isRibbon = c => c.isMesh && c.geometry && c.geometry.parameters && c.geometry.parameters.depth === .12 && c.geometry.parameters.width === .006;
  S.info.mailboxes = bodies.length;
  if (mbSrc) for (const body of bodies) {
    const g = body.userData.group, is7 = body === mailbox7, k = `${+g.position.x.toFixed(1)},${+g.position.z.toFixed(1)}`, def = mbDefs[k] || {};
    for (const c of [...g.children]) { if (c === keyMesh || c === body || (is7 && isRibbon(c))) continue; c.traverse(m => { if (m.isMesh) m.visible = false; }); }
    body.material = hidden; body.castShadow = false;
    if (!is7 && def.at) { g.position.set(def.at[0], 0, def.at[1]); g.rotation.y = def.at[2]; }
    const mb = mbSrc.clone(true); const gg = msGround(mb); g.add(gg); reg('mail', gg); gg.rotation.y = is7 ? 0 : rand(-.06, .06); g.updateMatrixWorld(true);
    let flap = null, flag = null; mb.traverse(m => { if (!m.isMesh) return; m.castShadow = true; m.receiveShadow = true; if (m.name === 'MailboxFlap') flap = m; if (m.name === 'MailboxFlag') flag = m; });
    if (!S.mbMatDone) { S.mbMatDone = 1; mb.traverse(m => { if (!m.isMesh) return; const mt = m.material; mt.metalnessMap = null; mt.metalness = m.name === 'MailboxFlag' ? .2 : .3; mt.roughness = .9; if (m.name === 'Mailbox') mt.color.set(0xa49c94); weather(mt, { amt: .55, lowAmt: .5, low: .5, scale: 1.4, dirt: 0x2a2218 }); }); }
    if (is7) mb.traverse(m => { if (m.isMesh && m.name === 'Mailbox') { m.material = m.material.clone(); m.material.color.set(0xc08878); } }); // Nr. 7: rostrot, wie bisher erkennbar
    const inv = g.matrixWorld.clone().invert(), fbb = new T.Box3().setFromObject(flap).applyMatrix4(inv);
    const piv = new T.Group(); piv.position.set(0, fbb.min.y + .006, (fbb.min.z + fbb.max.z) / 2); g.add(piv); piv.updateMatrixWorld(true); piv.attach(flap);
    body.userData.lid = piv; // mailbox7: das Spiel tweent userData.lid (rx 1.45) → die echte Klappe öffnet sich
    if (flag) { const fl = new T.Box3().setFromObject(flag).applyMatrix4(inv), fp = new T.Group(); fp.position.set((fl.min.x + fl.max.x) / 2, fl.min.y + .01, fl.min.z + .01); g.add(fp); fp.updateMatrixWorld(true); fp.attach(flag); if (!def.flag) fp.rotation.x = -PI / 2 + .1; }
    const bbx = new T.Box3().setFromObject(mb).applyMatrix4(inv), backZ = bbx.min.z, midY = (fbb.min.y + fbb.max.y) / 2;
    const fh = rayHit(mb, g.localToWorld(V3(0, midY, (fbb.min.z + backZ) / 2)), V3(0, -1, 0).applyQuaternion(g.quaternion), .4); const floorY = fh ? g.worldToLocal(fh.point.clone()).y : fbb.min.y + .01;
    if (is7) { keyMesh.position.set(.015, floorY + .006, fbb.min.z - .1);
      for (const c of [...g.children]) if (isRibbon(c)) { c.visible = true; c.position.set(.028, fbb.max.y - .075, fbb.max.z + .006); c.rotation.set(PI / 2, 0, .12); piv.attach(c); } // rotes Band klemmt in der Klappe
      S.info.mb7 = [floorY, fbb.min.y, fbb.max.y, fbb.min.z, fbb.max.z].map(v => +v.toFixed(3)); continue; }
    const hit = hitBox(.22, .34, fbb.max.z - backZ + .06, 0, midY + .02, (fbb.max.z + backZ) / 2, g);
    let letter = null; if (def.note) { letter = new T.Mesh(new T.PlaneGeometry(.1, .16), envMat); letter.rotation.set(-PI / 2, 0, rand(-.2, .2)); letter.position.set(0, floorY + .006, fbb.min.z - .12); g.add(letter); }
    const st = { open: false }, wx = g.position.x, wz = g.position.z;
    interact(hit, () => st.open ? 'Briefkasten schließen' : 'Briefkasten öffnen (' + (def.who || 'Nachbar') + ')', () => {
      st.open = !st.open; tween(piv, { rx: st.open ? 1.45 : 0 }, st.open ? .45 : .3); Audio.play(st.open ? 'metalOpen' : 'metalClose', { gain: .3, rate: 1.4, x: wx, y: 1.1, z: wz, ref: 2 });
      if (!st.open) return;
      if (letter && def.note) setTimeout(() => liftTo(letter, () => openNote(def.note[0], def.note[1], def.note[2]), true), 480);
      else if (def.empty) setTimeout(() => toast(def.empty, 4500), 450);
    });
  }

  // =====================================================================  STROMMASTEN + LEITUNGEN (Holzmast-Modell, Leitungen neu an die Isolatoren, Hausanschlüsse)
  const poleM4 = [], att = [];
  if (poleSrc) {
    for (const o of msFind((m, bb) => (m.material === M.wood || m.material === M.paint) && bb.max.x - bb.min.x > 100 && bb.max.y > 7.8 && bb.min.z > 6 && bb.max.z < 9.2)) msHide(o);
    for (const o of msFind((m, bb) => m.material === M.dark && bb.max.x - bb.min.x > 100 && bb.min.y > 6 && bb.min.z > 6 && bb.max.z < 9.2)) msHide(o);
    for (const [x] of poleSpots) msDropCols(x - .16, x + .16, 7.44, 7.76);
    poleSrc.traverse(m => { if (m.isMesh) { const o = [].concat(m.material)[0]; m.material = new T.MeshStandardMaterial({ map: o.map, normalMap: o.normalMap, roughness: .86, metalness: 0, color: 0xa89c90 }); } });
    poleSrc.scale.setScalar(8.7 / 1407.1); poleSrc.rotation.y = PI / 2; // Traverse quer zur Leitung (entlang z)
    const parts = bakeObj(poleSrc), base = new T.Box3();
    for (const p of parts) { const a = p.geo.attributes.position; for (let i = 0; i < a.count; i++) if (a.getY(i) < 1) base.expandByPoint(new T.Vector3().fromBufferAttribute(a, i)); }
    const bc = base.getCenter(new T.Vector3()); let minY = Infinity, maxY = -Infinity;
    for (const p of parts) { p.geo.computeBoundingBox(); minY = Math.min(minY, p.geo.boundingBox.min.y); maxY = Math.max(maxY, p.geo.boundingBox.max.y); }
    for (const p of parts) { p.geo.translate(-bc.x, -minY - .12, -bc.z); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); } maxY -= minY + .12;
    // Isolator-Spitzen: oberste Punkte, entlang der Traverse (z) gebündelt
    const tops = []; for (const p of parts) { const a = p.geo.attributes.position; for (let i = 0; i < a.count; i++) if (a.getY(i) > maxY - .07) tops.push([a.getX(i), a.getY(i), a.getZ(i)]); }
    tops.sort((a, b) => a[2] - b[2]); const cl = []; for (const q of tops) { const Lc = cl[cl.length - 1]; if (Lc && q[2] - Lc.z1 < .12) { Lc.n++; Lc.x += q[0]; Lc.z += q[2]; Lc.y = Math.max(Lc.y, q[1]); Lc.z1 = q[2]; } else cl.push({ n: 1, x: q[0], y: q[1], z: q[2], z1: q[2] }); }
    const ins = cl.filter(c => c.n > 2).map(c => V3(c.x / c.n, c.y - .02, c.z / c.n)); S.info.insulators = ins.map(v => v.toArray().map(n => +n.toFixed(2))); S.info.poleTop = +maxY.toFixed(2);
    poleSpots.forEach(([x, z], i) => { const flip = i % 3 === 1 ? PI : 0, m4 = new T.Matrix4().compose(V3(x, 0, z), new T.Quaternion().setFromEuler(new T.Euler(rand(-.014, .014), flip + rand(-.05, .05), rand(-.018, .018))), V3(1, 1, 1));
      poleM4.push(m4); att.push(ins.map(v => v.clone().applyMatrix4(m4)).sort((a, b) => a.z - b.z)); });
    S.poleIM = reg('poles', msInst(parts, poleM4, { shadow: true })); S.poleGeo = parts[0].geo;
    // Leitungen (durchhängend) + Hausanschlüsse; wireSpots (Krähen & Co.) neu
    const wires = [], wmat = new T.MeshStandardMaterial({ color: 0x101010, roughness: .45, metalness: .4 }); wireSpots.length = 0;
    const wire = (a, c, sag, spot = true, r = .011) => { const mid = a.clone().lerp(c, .5); mid.y -= sag * 2; if (spot) wireSpots.push([a.clone(), mid.clone(), c.clone()]); wires.push(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, mid, c), 28, r, 5, false)); };
    const nW = Math.min(3, ins.length);
    if (nW) for (let i = 0; i < att.length - 1; i++) for (let k = 0; k < nW; k++) { const A = att[i], C = att[i + 1]; const ka = Math.round(k * (A.length - 1) / Math.max(1, nW - 1)), kc = Math.round(k * (C.length - 1) / Math.max(1, nW - 1)); wire(A[ka], C[kc], rand(.42, .6)); }
    const poleAt = x => { const i = poleSpots.findIndex(p => Math.abs(p[0] - x) < .5); return i >= 0 && att[i].length ? att[i][Math.floor(att[i].length / 2)].clone().add(V3(0, -1.1, 0)) : null; };
    for (const [px, hx, hy, hz] of [[-57, -52.3, 5.55, 12.42], [-38, -30.5, 5.55, 12.42], [19, 19.5, 3.05, 12.42], [38, 43.8, 5.55, 12.42], [-38, -30.8, 5.55, -12.42], [19, 27.8, 2.95, -11.76], [-57, -51.5, 2.95, -11.76]]) { const a = poleAt(px); if (a) wire(a, V3(hx, hy, hz), .55, false, .008); }
    // Nr. 9 ist seit 2009 abgeklemmt: das Anschlusskabel hängt lose am Mast herab
    const a9 = poleAt(57); if (a9) wires.push(new T.TubeGeometry(new T.CatmullRomCurve3([a9, V3(57.25, 5.4, 7.1), V3(57.45, 2.4, 6.75), V3(57.3, .55, 6.6)]), 24, .008, 5, false));
    if (wires.length) { const wm = new T.Mesh(mergeGeometries(wires), wmat); scene.add(wm); reg('poles', wm); }
    try { for (const c of crows) { if (c.fly || c.gone || !wireSpots.length) continue; const [a, mid, cc] = wireSpots[Math.floor(rand(0, wireSpots.length))], tt = rand(.25, .75);
      c.g.position.copy(a.clone().multiplyScalar((1 - tt) ** 2).addScaledVector(mid, 2 * tt * (1 - tt)).addScaledVector(cc, tt * tt)).add(V3(0, .1, 0)); } } catch (e) { warn(e); }
  }

  // =====================================================================  SCHILDER: Ortstafel, Verkehrszeichen, Gemeinde-Schild, Absperrung
  const rsMesh = {}; if (rsSrc) { rsSrc.updateMatrixWorld(true); rsSrc.traverse(m => { if (m.isMesh) rsMesh[m.name] = m; }); }
  const signGeo = (name, poleOnly) => { const m = rsMesh[name]; if (!m) return null; const g = toF32(m.geometry.clone()); g.applyMatrix4(m.matrixWorld); g.scale(.01, .01, .01);
    const p = g.attributes.position, low = new T.Box3(); for (let i = 0; i < p.count; i++) if (p.getY(i) < .2) low.expandByPoint(new T.Vector3().fromBufferAttribute(p, i));
    const c = low.getCenter(new T.Vector3()), r = Math.max(low.max.x - low.min.x, low.max.z - low.min.z) / 2; g.translate(-c.x, 0, -c.z);
    if (poleOnly) { const idx = g.index ? g.index.array : Array.from({ length: p.count }, (_, i) => i), keep = [];
      for (let t = 0; t < idx.length; t += 3) { let ok = true; for (let j = 0; j < 3; j++) { const q = idx[t + j]; if (Math.hypot(p.getX(q), p.getZ(q)) > r * 1.35) ok = false; } if (ok) keep.push(idx[t], idx[t + 1], idx[t + 2]); } g.setIndex(keep); }
    g.computeBoundingBox(); g.computeBoundingSphere(); return { geo: g, mat: m.material, r, bottom: g.boundingBox.min.y, top: g.boundingBox.max.y }; };
  const roadSign = (name, x, z, ry, sink = .55, tilt = 0) => { const s = signGeo(name); if (!s) return null; const m = new T.Mesh(s.geo, s.mat); m.position.set(x, -s.bottom - sink, z); m.rotation.set(tilt, ry, rand(-.02, .02)); m.castShadow = true; m.receiveShadow = true; scene.add(m); return m; };
  // STORY-HOOK: Sperre im Süden – „Einfahrt verboten“ und „Wenden verboten“: raus geht es nicht, zurück auch nicht
  if (rsSrc) { roadSign('Road_Sign_01', 3.4, -44.55, 0); roadSign('Road_Sign_02', -4.4, -40.2, .08, .6, .03); roadSign('Road_Sign_06', 4.75, 4.72, PI / 2 + .1); }
  // Ortstafel „Lost Eyengless“ (Vorderseite gelb; Rückseite Ortsende, rot durchgestrichen) + Zusatzschild mit korrigierter Einwohnerzahl
  { for (const o of findNear(-72, 1.8, 6.2, 1.6, (m, bb) => bb.max.y - bb.min.y < 3 && !bb.isEmpty())) msHide(o);
    const plateMat = front => weather(new T.MeshStandardMaterial({ roughness: .5, metalness: .2, map: canvasTex(1024, 560, (x, w, h) => {
      x.fillStyle = '#e3b21f'; x.fillRect(0, 0, w, h); grain(x, w, h, 5000, .18); x.fillStyle = '#111';
      x.lineWidth = 16; x.strokeStyle = '#111'; x.beginPath(); x.roundRect(22, 22, w - 44, h - 44, 30); x.stroke();
      x.textAlign = 'center'; x.font = 'bold 150px Arial'; x.fillText('Lost Eyengless', w / 2, front ? 250 : 300);
      if (front) { x.font = 'bold 60px Arial'; x.fillText('Landkreis Hohen Abgrund', w / 2, 370); } else { x.strokeStyle = '#b3160f'; x.lineWidth = 58; x.beginPath(); x.moveTo(60, h - 70); x.lineTo(w - 60, 70); x.stroke(); }
    }) }), { amt: .22, lowAmt: 0, scale: .8 });
    const back = new T.MeshStandardMaterial({ color: 0x8a8c88, roughness: .6, metalness: .6 });
    const plate = new T.Mesh(new T.BoxGeometry(1.4, .77, .025), [back, back, back, back, plateMat(false), plateMat(true)]); plate.position.set(-72.3, 2.05, 6.3); plate.rotation.y = PI / 2; plate.castShadow = true; scene.add(plate);
    const zus = new T.Mesh(new T.BoxGeometry(.72, .3, .02), [back, back, back, back, weather(new T.MeshStandardMaterial({ roughness: .55, metalness: .1, map: canvasTex(512, 214, (x, w, h) => {
      x.fillStyle = '#ecebe4'; x.fillRect(0, 0, w, h); grain(x, w, h, 2000, .2); x.strokeStyle = '#111'; x.lineWidth = 8; x.strokeRect(10, 10, w - 20, h - 20); x.fillStyle = '#111'; x.textAlign = 'center'; x.font = 'bold 62px Arial'; x.fillText('Einwohner 214', w / 2, 128);
      x.strokeStyle = 'rgba(150,10,10,.9)'; x.lineWidth = 9; x.beginPath(); x.moveTo(248, 112); x.lineTo(470, 96); x.stroke(); x.fillStyle = 'rgba(150,10,10,.9)'; x.font = '64px Caveat'; x.fillText('211', 430, 196); }) }), { amt: .3, lowAmt: 0, scale: 1.3 }), back]);
    zus.position.set(-72.28, 1.47, 6.3); zus.rotation.y = PI / 2; zus.castShadow = true; scene.add(zus);
    const pole = signGeo('Road_Sign_03', true); if (pole) for (const dz of [-.52, .52]) { const m = new T.Mesh(pole.geo, pole.mat); m.position.set(-72.34, 2.4 - pole.top, 6.3 + dz); m.castShadow = true; scene.add(m); }
    for (const o of [plate, zus]) interact(o, 'Ortstafel', () => toast('Lost Eyengless. Darunter „Einwohner 214“ – durchgestrichen, 211. Ganz klein, mit Bleistift, frischer: 210.', 5200)); }
  // Gemeinde-Schild (Scan eines Parkschilds, Blech neu beschriftet) am Gehweg nahe der Kirchweg-Gasse – STORY-HOOK: die Gemeinde weiß Bescheid
  if (parkSrc && parkTex) { const o = parkSrc.clone(true); o.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.map = parkTex; m.material.needsUpdate = true; } }); const g = msGround(o); msPlace(g, -12.6, 0, 5.62, PI);
    interact(hitBox(.7, .6, .15, 0, 1.45, 0, g), 'Schild lesen', () => openNote('Schild der Gemeinde', '<b>GEMEINDE LOST EYENGLESS</b>\nNACHTRUHE 3 – 4 UHR\nStraße nicht betreten.\nKinder im Haus behalten.\n— Der Bürgermeister\n\nDas Schild ist neu, die Schrauben glänzen noch. Unter der Farbe schimmert eine ältere Schrift durch.', 'strasse_schild')); }
  // Absperrung an der Südstraße: Betonsperren (Scan) + Leitkegel statt roter Kiste
  if (barSrc) { for (const o of findNear(0, .7, -45.5, 3.3, (m, bb) => bb.max.y < 1.5 && bb.min.z > -46 && bb.max.z < -45)) msHide(o);
    const b1 = msGround(barSrc.clone(true)), b2 = msGround(barSrc.clone(true)); msPlace(b1, -1.55, 0, -45.35, .03); msPlace(b2, 1.9, 0, -46.05, -.06);
    if (coneParts) msInst(coneParts, [msM4(-3.3, 0, -44.2, .4), msM4(3.9, 0, -44.9, 1.2), msM4(.9, .17, -43.6, 0, 1, 0, PI / 2 - .05)], { shadow: true });
    interact(hitBox(8, 1, .8, 0, .5, -45.6), 'Absperrung', () => toast('Gesperrt. Kein Schild sagt, warum. Hinter den Blöcken verschwindet der Asphalt im Nebel – und irgendwo dahinter läuft ein Motor im Leerlauf.', 5200)); }

  // =====================================================================  TELEFONZELLE (gelbe Post-Zelle: Blech mit Rost-Scan, Glas mit Schmutz, Apparat, Zettel)
  { const g = booth.g, keep = [booth.phone, booth.handset, PHOTOS[2] && PHOTOS[2].mesh];
    for (const c of [...g.children]) if (c.isMesh && !keep.includes(c)) msHide(c);
    const yellow = weather(new T.MeshStandardMaterial({ color: 0xc9981f, roughness: 1, metalness: .35, normalMap: msTex('rust_sheet/n.jpg', false, 1), roughnessMap: msTex('rust_sheet/orm.jpg', false, 1) }), { amt: .85, lowAmt: .65, low: .9, dirt: 0x4a2c16, scale: 1.1 });
    yellow.userData.tile = 2;
    const grey = weather(new T.MeshStandardMaterial({ color: 0x3a3c3e, roughness: 1, metalness: .5, normalMap: msTex('rust_sheet/n.jpg', false, 1), roughnessMap: msTex('rust_sheet/orm.jpg', false, 1) }), { amt: .4, lowAmt: .3, dirt: 0x2a2018 }); grey.userData.tile = 2;
    const conc = msSurfMat('facade_concrete', { tint: 0x8a877e, rep: .6 });
    const P = (w, h, d, x, y, z, m) => box(w, h, d, x, y, z, m, { parent: g });
    P(1.18, .07, 1.18, 0, .035, 0, conc);
    for (const [x, z] of [[-.52, -.52], [.52, -.52], [-.52, .52], [.52, .52]]) P(.075, 2.36, .075, x, 1.25, z, yellow);
    P(1.14, .09, 1.14, 0, 2.47, 0, yellow); P(1.24, .05, 1.24, 0, 2.75, 0, grey);
    const signTex = canvasTex(512, 96, (x, w, h) => { x.fillStyle = '#f0c21e'; x.fillRect(0, 0, w, h); grain(x, w, h, 900, .2); x.fillStyle = '#111'; x.font = 'bold 66px Arial'; x.textAlign = 'center'; x.fillText('TELEFON', w / 2 + 30, 72);
      x.lineWidth = 9; x.strokeStyle = '#111'; x.beginPath(); x.arc(58, 50, 26, PI * .15, PI * .85, false); x.stroke(); x.fillRect(26, 58, 18, 14); x.fillRect(72, 58, 18, 14); });
    const signMat = new T.MeshStandardMaterial({ map: signTex, emissive: 0xffffff, emissiveMap: signTex, emissiveIntensity: 1.1, roughness: .5 }); S.signGlow.push(signMat);
    const band = new T.Mesh(new T.BoxGeometry(1.1, .22, 1.1), [signMat, signMat, yellow, yellow, signMat, signMat]); band.position.set(0, 2.61, 0); band.castShadow = true; g.add(band);
    P(1.0, 2.2, .025, 0, 1.2, -.515, yellow); // Rückwand zur Straße (Apparat innen)
    const glassTex = canvasTex(256, 512, (x, w, h) => { x.fillStyle = 'rgba(190,200,200,.16)'; x.fillRect(0, 0, w, h); const gr = x.createLinearGradient(0, h, 0, h * .55); gr.addColorStop(0, 'rgba(70,58,40,.75)'); gr.addColorStop(1, 'rgba(70,58,40,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(230,230,225,.35)'; x.lineWidth = 1; for (let i = 0; i < 40; i++) { const a = rand(0, w), b = rand(0, h); x.beginPath(); x.moveTo(a, b); x.lineTo(a + rand(-40, 40), b + rand(-20, 20)); x.stroke(); }
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(200,205,205,${rand(.05, .25)})`; x.beginPath(); x.arc(rand(0, w), rand(0, h * .8), rand(1, 3.5), 0, 7); x.fill(); } });
    const glassMat = new T.MeshStandardMaterial({ map: glassTex, transparent: true, depthWrite: false, roughness: .12, metalness: .2, side: T.DoubleSide, color: 0xc8d2d4 });
    const handTex = canvasTex(256, 512, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(215,220,220,.3)'; const hand = (cx, cy, s) => { x.beginPath(); x.ellipse(cx, cy, 16 * s, 20 * s, 0, 0, 7); x.fill(); for (let f = 0; f < 5; f++) { x.beginPath(); x.ellipse(cx - 18 * s + f * 9 * s, cy - 30 * s + Math.abs(f - 2) * 5 * s, 3.5 * s, 11 * s, (f - 2) * .15, 0, 7); x.fill(); } };
      hand(96, 300, .9); hand(150, 270, .9); x.font = '40px Caveat'; x.fillStyle = 'rgba(30,20,20,.8)'; x.fillText('03:13', 70, 120); x.fillStyle = 'rgba(40,40,40,.7)'; for (let i = 0; i < 8; i++) x.fillRect(60 + i * 14, 160, 4, 30); x.fillRect(58, 176, 112, 3); });
    const handMat = new T.MeshStandardMaterial({ map: handTex, transparent: true, depthWrite: false, side: T.DoubleSide, roughness: .5 });
    for (const [x, z, r] of [[0, .515, 0], [-.515, 0, PI / 2], [.515, 0, PI / 2]]) { const p = new T.Mesh(new T.PlaneGeometry(.97, 2.2), glassMat); p.position.set(x, 1.22, z); p.rotation.y = r; p.renderOrder = 3; g.add(p);
      for (const y of [.62, 1.85]) { const bar = P(r ? .03 : .97, .035, r ? .97 : .03, x, y, z, yellow); bar.castShadow = false; } }
    { const hp = new T.Mesh(new T.PlaneGeometry(.5, 1), handMat); hp.position.set(.1, 1.3, .505); hp.renderOrder = 4; g.add(hp); } // Kinderhände, „03:13“ und acht Striche, von innen an die Scheibe gemalt
    booth.phone.material = grey; booth.phone.castShadow = true;
    const face = new T.Mesh(new T.PlaneGeometry(.23, .33), new T.MeshStandardMaterial({ roughness: .5, metalness: .4, map: canvasTex(160, 230, (x, w, h) => { x.fillStyle = '#4a4d50'; x.fillRect(0, 0, w, h); grain(x, w, h, 500, .3);
      x.fillStyle = '#1d2a22'; x.fillRect(20, 16, 120, 34); x.fillStyle = '#8fd49a'; x.font = '15px monospace'; x.fillText('KARTE/MÜNZE', 26, 38); x.fillStyle = '#222'; x.fillRect(118, 62, 6, 34);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { x.fillStyle = '#c9c9c4'; x.fillRect(26 + c * 28, 104 + r * 26, 22, 20); x.fillStyle = '#222'; x.font = 'bold 13px Arial'; x.fillText('123456789*0#'[r * 3 + c], 33 + c * 28, 119 + r * 26); }
      x.fillStyle = '#111'; x.fillRect(110, 200, 36, 10); }) }));
    face.position.set(0, 1.4, -.369); g.add(face);
    booth.handset.material = new T.MeshStandardMaterial({ color: 0x0c0c0c, roughness: .35, metalness: .1 });
    { const pts = []; for (let i = 0; i <= 60; i++) { const k = i / 60; pts.push(V3(Math.cos(k * 50) * .012 + k * .07, -.12 - k * .2 + Math.sin(k * 3.2) * .03, Math.sin(k * 50) * .012 + k * .02)); }
      booth.handset.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, .004, 4), booth.handset.material)); }
    P(.56, .025, .26, 0, 1.11, -.37, grey);
    const noteTex = canvasTex(128, 170, (x, w, h) => { x.fillStyle = '#e8e2cf'; x.fillRect(0, 0, w, h); grain(x, w, h, 300, .2); x.fillStyle = 'rgba(25,30,70,.85)'; x.font = '17px Caveat'; ['Vegas 3 17', 'Wendt 7 03', 'Brandt 1 23', 'Pfarrhaus –', 'Arzt 110 ?', '', '0 31 10'].forEach((l, i) => x.fillText(l, 10, 26 + i * 21)); x.strokeStyle = 'rgba(150,20,20,.8)'; x.beginPath(); x.ellipse(40, 150, 32, 12, 0, 0, 7); x.stroke(); });
    const note = new T.Mesh(new T.PlaneGeometry(.12, .16), new T.MeshStandardMaterial({ map: noteTex, roughness: 1 })); note.position.set(-.25, 1.45, -.482); note.rotation.z = .06; g.add(note);
    // STORY-HOOK: Nummer 0 31 10 (= 31,10 MHz / Lucys Tag)
    interact(note, 'Zettel an der Wand', () => liftTo(note, () => openNote('Zettel in der Telefonzelle', 'Mit Klebeband an die Wand geklebt, Kuli auf kariertem Papier:\n\n<span class="hand">Vegas 3 17\nWendt 7 03\nBrandt 1 23\nPfarrhaus –\nArzt 110 ?\n\n<u>0 31 10</u></span>\n\nDie letzte Nummer ist rot eingekreist. Sie hat eine Ziffer zu wenig für einen Anschluss.', 'strasse_zelle')));
    const tube = new T.Mesh(new T.PlaneGeometry(.5, .08), new T.MeshStandardMaterial({ color: 0x222222, emissive: 0xfff2d0, emissiveIntensity: 2 })); tube.rotation.x = PI / 2; tube.position.set(0, 2.415, 0); g.add(tube); S.boothGlow = tube.material;
    const st = new T.Mesh(new T.PlaneGeometry(.3, .2), new T.MeshStandardMaterial({ roughness: .8, map: canvasTex(192, 128, (x, w, h) => { x.fillStyle = '#e9e6dc'; x.fillRect(0, 0, w, h); grain(x, w, h, 400, .3); x.fillStyle = '#b01a14'; x.fillRect(0, 0, w, 30); x.fillStyle = '#fff'; x.font = 'bold 20px Arial'; x.fillText('NOTRUF', 50, 22); x.fillStyle = '#111'; x.font = 'bold 22px Arial'; x.fillText('Polizei 110', 22, 64); x.fillText('Feuerwehr 112', 12, 98); }) }));
    st.position.set(-.18, 1.55, -.529); st.rotation.y = PI; g.add(st); }

  // =====================================================================  BORDSTEINE (Scan-Bordsteine statt Kisten), Rinnstein-Schmutz, Ölflecken, Bremsspuren, Straßenschutt
  if (curbParts) {
    for (const o of msFind((m, bb) => m.material === M.sidewalk && bb.max.y > .15 && bb.max.y < .17 && bb.max.x - bb.min.x > 100)) msHide(o);
    const Lc = curbParts.map(() => []), put = (x, z, ry) => Lc[Math.floor(rand(0, Lc.length))].push(msM4(x, rand(-.012, .004), z, ry + (Math.random() < .5 ? PI : 0) + rand(-.006, .006), new T.Vector3(1.0, 1.42, .95)));
    const run = (x0, z0, x1, z1) => { const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 1.045), ry = Math.atan2(-(z1 - z0), x1 - x0); for (let i = 0; i < n; i++) { const k = (i + .5) / n; put(x0 + (x1 - x0) * k, z0 + (z1 - z0) * k, ry); } };
    for (const s of [-1, 1]) { run(-78, s * 4.05, -4.1, s * 4.05); run(4.1, s * 4.05, 78, s * 4.05); }
    run(-4.1, 4.05, 4.1, 4.05); for (const s of [-1, 1]) run(s * 4.05, -46, s * 4.05, -4.15);
    curbParts.forEach((p, i) => { if (Lc[i].length) chunkInst('curbs', [{ geo: simplify(p.geo, .16), mat: p.mat }], Lc[i], 14, 70, { shadow: false }); });
    S.info.curbs = Lc.map(l => l.length);
  }
  { // Nasse, ölige Stellen: Scan „wet_asphalt“ mit weicher Fleckmaske (Rinnstein, unter den Autos)
    const blob = canvasTex(256, 256, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); for (let i = 0; i < 26; i++) { const cx = w / 2 + rand(-60, 60), cy = h / 2 + rand(-60, 60), r = rand(20, 70), g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(255,255,255,${rand(.25, .5)})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } }, false);
    const dm = new T.MeshStandardMaterial({ map: msTex('wet_asphalt/b.jpg', true), normalMap: msTex('wet_asphalt/n.jpg'), alphaMap: blob, transparent: true, depthWrite: false, color: 0x2c2824, roughness: .28, metalness: .1, polygonOffset: true, polygonOffsetFactor: -2 });
    const list = [], dec = (x, z, sx, sz, ry, y = .026) => list.push(new T.Matrix4().compose(V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)), V3(sx, 1, sz)));
    for (let i = 0; i < 64; i++) { const s = i % 2 ? 1 : -1, x = rand(-76, 76); if (Math.abs(x) < 5) continue; dec(x, s * rand(3.35, 3.75), rand(1.4, 2.6), rand(.45, .75), rand(-.08, .08) + (Math.random() < .5 ? PI : 0), .026 + i * .00002); }
    for (let i = 0; i < 16; i++) dec((i % 2 ? 1 : -1) * rand(3.3, 3.7), rand(-44, -7), rand(.45, .7), rand(1.4, 2.4), rand(-.08, .08), .026 + i * .00002);
    for (const [x, z] of [[-37, 3.15], [36.5, 3.1], [-49.5, 3.1], [14.6, 3.25], [1.9, -37], [-2.25, -42.3], [-8.5, -13.05]]) dec(x + rand(-.4, .4), z + rand(-.1, .1), 2.6, 1.3, rand(-.2, .2), .028);
    const geo = new T.PlaneGeometry(1, 1); geo.rotateX(-PI / 2); reg('decals', msInst([{ geo, mat: dm }], list, { shadow: false })); }
  { // Bremsspuren vor Lucys Auto: sie hat voll gebremst, kurz vor der Sperre – STORY-HOOK
    const sk = canvasTex(128, 1024, (x, w, h) => { x.clearRect(0, 0, w, h); for (const cx of [12, 116]) for (let y = 0; y < h; y += 2) { const a = Math.min(1, y / h * 1.6) * (.5 + .5 * Math.random()) * .75; x.fillStyle = `rgba(8,8,8,${a})`; x.fillRect(cx - 9 + Math.sin(y * .01) * 2, y, 18, 2); } });
    const m = new T.Mesh(new T.PlaneGeometry(1.62, 11), new T.MeshStandardMaterial({ map: sk, transparent: true, depthWrite: false, roughness: .45, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.rotation.x = -PI / 2; m.rotation.z = PI; m.position.set(1.9, .027, -32.2); scene.add(m); }
  if (debParts) { const Ld = debParts.map(() => []); // Straßenschutt: Asphaltbrocken im Rinnstein, an Schlaglöchern und an der Sperre
    const put = (x, z, s = 1) => Ld[Math.floor(rand(0, Ld.length))].push(msM4(x, .02, z, rand(0, 6.28), s * rand(.8, 2.2), rand(-.1, .1), rand(-.1, .1)));
    for (let i = 0; i < 70; i++) { const x = rand(-77, 77), s = Math.random() < .5 ? -1 : 1; if (Math.abs(x) < 4.5) continue; put(x, s * rand(3.55, 3.92)); }
    for (let i = 0; i < 22; i++) put(rand(-3.9, 3.9) * (Math.random() < .5 ? 1 : .3), rand(-46, -6));
    for (const [cx, cz, n] of [[-22, -1.4, 8], [31, 1.8, 7], [-61, -2.5, 7], [0, -44, 12], [58, -1, 6]]) for (let i = 0; i < n; i++) put(cx + rand(-.9, .9), cz + rand(-.6, .6), rand(1, 2));
    debParts.forEach((p, i) => { if (Ld[i].length) chunkInst('debris', [{ geo: simplify(p.geo, .2), mat: p.mat }], Ld[i], 16, 32, { shadow: false }); }); }

  // =====================================================================  HYDRANTEN, MÜLLTONNEN, MÜLLSÄCKE
  if (hydParts) { const mt = hydParts[0].mat.clone(); if (hydTex) { mt.map = hydTex; mt.needsUpdate = true; } const parts = hydParts.map(p => ({ geo: p.geo, mat: mt }));
    const spots = [[-44.3, 5.45, .4], [12.7, -5.45, 2.2], [63.4, 5.45, 1.1], [-4.62, -23.8, 4.1], [-66.8, -5.45, .2]];
    reg('hyd', msInst(parts, spots.map(([x, z, r]) => msM4(x, .14, z, r, 1.12)), { shadow: true })); // auf dem Gehweg (Oberkante 0,14)
    // Kreidestriche neben dem Hydranten an der Kreuzung – STORY-HOOK: Zählen (7 + 1)
    const ch = new T.Mesh(new T.PlaneGeometry(.6, .3), new T.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: .75, map: canvasTex(256, 128, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(235,228,205,.85)'; x.lineCap = 'round';
      for (let i = 0; i < 8; i++) { x.lineWidth = i === 7 ? 9 : 6; x.globalAlpha = i === 7 ? 1 : .55; x.beginPath(); x.moveTo(26 + i * 26, 22 + rand(-4, 4)); x.lineTo(24 + i * 26 + rand(-5, 5), 104 + rand(-4, 4)); x.stroke(); } }) }));
    ch.rotation.x = -PI / 2; ch.position.set(13.4, .145, -5.25); scene.add(ch);
    interact(hitBox(.5, .95, .5, 12.7, .62, -5.45), 'Hydrant', () => toast('Neben dem Hydranten: Kreidestriche. Sieben, vom Regen fast weggewaschen. Der achte ist frisch.', 5000)); }
  // Tonnen und Säcke am Streifen zwischen Gehweg und Zaun (außerhalb der Tor-Schwenkbereiche); vor Nr. 9 (verlassen): Säcke, umgekippte Tonne
  const canM = [], bagM = [], cs = V3(1.12, 1.42, 1.12);
  for (const [x, z] of [[-29.7, -6.62], [-45.4, -6.62], [24.7, -6.62], [48.2, -6.62], [47.55, -6.6], [-48.4, 6.62], [-26.4, 6.62], [-25.75, 6.6], [23.6, 6.62], [47.6, 6.62]]) canM.push(msM4(x, 0, z + rand(-.04, .04), rand(0, 6.28), cs));
  canM.push(msM4(46.8, .27, -6.45, .3, cs, 0, PI / 2));
  for (const [x, z, s, ry, tx] of [[-44.8, -6.55, 1, 0, 0], [-47.8, 6.55, .95, 0, 0], [24.25, 6.5, 1.05, 0, 0], [24.8, 6.7, .9, 0, 0], [46.1, -6.3, 1.05, 0, 0], [45.5, -6.65, .95, 0, 0], [45.9, -5.72, 1, 2.1, .45], [47.3, -5.7, .9, 4.2, 0]]) bagM.push(msM4(x, z > -6 && z < 6 ? .14 : 0, z, ry || rand(0, 6.28), s, tx, 0));
  if (canParts) reg('trash', msInst(canParts, canM, { shadow: true })); if (bagParts) reg('trash', msInst(bagParts, bagM, { shadow: true }));
  interact(hitBox(2.4, .9, 1.1, 46.4, .45, -6.3), 'Müll', () => toast('Seit Wochen holt niemand mehr etwas ab. Aus einem aufgerissenen Sack quellen Vermisstenzettel – nass, zerknüllt, alle mit Lucys Gesicht.', 5500)); // STORY-HOOK: jemand entfernt die Zettel

  // =====================================================================  KANALDECKEL (weitere Scans) + einer, unter dem es klopft
  if (manholeG) for (const [x, z] of [[-2.1, -38.5], [66, 1.3], [-12, -1.6]]) { const o = manholeG.scene.clone(); o.traverse(m => { if (m.isMesh) m.receiveShadow = true; }); const g = new T.Group(); g.add(o); g.position.set(x, .018, z); g.rotation.y = rand(0, 6); scene.add(g); }
  { let n = 0; interact(hitBox(1, .3, 1, 46, .15, .9), 'Gullydeckel', () => { n++; // STORY-HOOK: die Stadt unter dem Gully
    if (n === 1) { for (let i = 0; i < 3; i++) setTimeout(() => Audio.thump(46, -.5, .9), 600 + i * 420); setTimeout(() => Audio.play('scrape2', { gain: .35, x: 46, y: -.3, z: .9, ref: 2 }), 2200); setTimeout(() => toast('Von unten klopft es. Dreimal. Dann schabt etwas am Deckel entlang, einmal rundherum.', 5000), 700); }
    else toast(n === 2 ? 'Still. Nur Wasser, tief unten. Und ganz leise: Kinderstimmen, die zählen.' : 'Still.', 4200); }); }

  // =====================================================================  ZETTEL an Laternen und Masten (gebogenes Papier, zur Straße)
  const posterDefs = {
    lena: { draw: x => { x.fillStyle = '#111'; x.font = 'bold 44px Arial'; x.fillText('VERMISST', 16, 52); x.fillStyle = '#6a6a66'; x.fillRect(40, 70, 176, 150); x.fillStyle = 'rgba(30,30,30,.7)'; x.beginPath(); x.ellipse(128, 138, 38, 48, 0, 0, 7); x.fill(); x.fillRect(80, 180, 96, 40);
      x.fillStyle = '#111'; x.font = 'bold 26px Arial'; x.fillText('Lucy B., 24', 52, 256); x.font = '17px Arial'; x.fillText('seit 23. Oktober', 64, 282); x.fillText('zuletzt: Kreuzung Ahornstr.', 20, 306); x.fillText('Hinweise bitte an Fam. Brandt', 12, 330); },
      note: ['Zettel: VERMISST', 'Lucy B., 26 Jahre. Vermisst seit dem <b>23. Oktober</b>. Zuletzt gesehen an der Kreuzung Ahornstraße / Birkenweg.\n\nDarunter eure alte Festnetznummer. Dort geht seit Jahren niemand mehr ran.\n\nJemand hat mit Bleistift ein Datum dazugeschrieben: <span class="hand">31.10.</span>', 'strasse_p_lena'] }, // STORY-HOOK: Lucy
    bruno: { draw: x => { x.fillStyle = '#111'; x.font = 'bold 30px Arial'; x.fillText('HUND ENTLAUFEN', 8, 44); x.fillStyle = '#7a6a52'; x.fillRect(40, 60, 176, 130); x.fillStyle = 'rgba(40,28,18,.8)'; x.beginPath(); x.ellipse(120, 130, 60, 40, .2, 0, 7); x.fill();
      x.fillStyle = '#111'; x.font = 'bold 40px Arial'; x.fillText('BRUNO', 60, 236); x.font = '17px Arial'; x.fillText('braun, rotes Halsband', 40, 264); x.fillText('zuletzt beim Brandhaus Nr. 5', 14, 290); x.fillText('L. Vegas, Ahornstr. 3', 36, 316);
      x.fillStyle = '#ddd8c8'; x.fillRect(158, 334, 26, 28); },
      note: ['Zettel: HUND ENTLAUFEN', '<b>BRUNO</b>. Mischling, braun, rotes Halsband mit Messingmarke. Hört auf seinen Namen.\nZuletzt gesehen: beim abgebrannten Haus Nr. 5.\n— L. Vegas, Ahornstr. 3\n\nDie Abreißzettel mit der Nummer sind alle abgerissen. Bis auf einen.', 'strasse_p_bruno'] }, // STORY-HOOK: Bruno (Hinweis aufs Brandhaus)
    tim: { draw: (x, w) => { x.globalAlpha = .55; x.fillStyle = '#111'; x.font = 'bold 44px Arial'; x.fillText('VERMISST', 16, 52); x.fillStyle = '#8a8a86'; x.fillRect(40, 70, 176, 150); x.fillStyle = '#111'; x.font = 'bold 30px Arial'; x.fillText('MIKE K., 27', 58, 258); x.font = '18px Arial'; x.fillText('seit 12. Juli 2026', 40, 288); x.globalAlpha = 1;
      x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.moveTo(0, 300); x.lineTo(90, 320); x.lineTo(160, 290); x.lineTo(w, 330); x.lineTo(w, 362); x.lineTo(0, 362); x.fill(); x.globalCompositeOperation = 'source-over'; },
      note: ['Altes Plakat', 'Halb weggeweicht. VERMISST: <b>Mike K., 27 Jahre</b>. Seit dem 12. Juli 2026.\n\nÜber das alte Plakat hat jemand ein neues geklebt – und wieder abgerissen. Nur ein Streifen ist geblieben:\n<i>„… wieder da …“</i>', 'strasse_p_tim'] },
    fest: { draw: x => { x.fillStyle = '#2a3a6a'; x.fillRect(0, 0, 256, 70); x.fillStyle = '#f0e6c0'; x.font = 'bold 30px Georgia'; x.fillText('Laternenfest', 36, 46); x.fillStyle = '#111'; x.font = '18px Georgia'; x.fillText('der Grundschule', 60, 100); x.fillText('Fr. 31.10. · 18 Uhr', 50, 130); x.fillText('ab der Kreuzung', 60, 158);
      for (let i = 0; i < 8; i++) { x.fillStyle = i === 7 ? '#ffffff' : ['#e0a030', '#d05030', '#e0c040', '#c04060', '#e08030', '#d0a040', '#c05030'][i]; x.beginPath(); x.arc(30 + i * 28, 220 + Math.sin(i) * 10, 11, 0, 7); x.fill(); }
      x.save(); x.translate(128, 290); x.rotate(-.18); x.fillStyle = '#c01a14'; x.fillRect(-110, -26, 220, 50); x.fillStyle = '#fff'; x.font = 'bold 34px Arial'; x.textAlign = 'center'; x.fillText('FÄLLT AUS', 0, 12); x.restore(); },
      note: ['Plakat: Laternenfest', 'Laternenumzug der Grundschule Lost Eyengless, Freitag, 31.10., 18 Uhr ab der Kreuzung.\nQuer darüber ein Aufkleber: <b>FÄLLT AUS</b>.\n\nUnten hat ein Kind mit Wachsmalstift acht Laternen gemalt. Sieben sind bunt. Eine ist weiß.', 'strasse_p_fest'] },
    amt: { draw: x => { x.fillStyle = '#111'; x.font = 'bold 26px Georgia'; x.fillText('EINLADUNG', 50, 40); x.font = '18px Georgia'; x.fillText('Bürgerversammlung', 44, 74); x.font = 'italic 20px Georgia'; x.fillText('„Die Lichter', 60, 110); x.fillText('über dem Wald“', 48, 136); x.font = '16px Georgia'; x.fillText('Do. 19 Uhr · Gemeindesaal', 20, 170);
      x.fillStyle = '#d8d8d2'; x.fillRect(14, 196, 228, 150); x.fillStyle = '#222'; x.font = 'bold 13px Arial'; x.fillText('AMTLICHER AUSHANG', 56, 218); x.font = '13px Arial'; ['Die Veranstaltung entfällt.', 'Es besteht kein Anlass', 'zur Sorge.', '', 'Amt für Rückführung', 'Außenstelle Lost Eyengless'].forEach((l, i) => x.fillText(l, 26, 244 + i * 17)); },
      note: ['Plakat: Bürgerversammlung', 'Bürgerversammlung: <i>„Die Lichter über dem Wald“</i>. Donnerstag, 19 Uhr, Gemeindesaal.\n\nQuer darübergeklebt, auf grauem Amtspapier:\n<b>Die Veranstaltung entfällt. Es besteht kein Anlass zur Sorge.</b>\n— Amt für Rückführung, Außenstelle Lost Eyengless', 'strasse_p_amt'] }, // STORY-HOOK: Amt
  };
  const posterTex = {}; for (const [k, d] of Object.entries(posterDefs)) posterTex[k] = canvasTex(256, 362, (x, w, h) => { x.fillStyle = k === 'amt' ? '#e2dcc8' : '#e6e2d6'; x.fillRect(0, 0, w, h); grain(x, w, h, 1400, .22); d.draw(x, w, h);
    const g2 = x.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, 'rgba(90,70,40,0)'); g2.addColorStop(1, 'rgba(90,70,40,.35)'); x.globalCompositeOperation = 'source-atop'; x.fillStyle = g2; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
    x.fillStyle = 'rgba(200,200,190,.8)'; x.fillRect(w / 2 - 20, 0, 40, 10); x.fillRect(w / 2 - 20, h - 10, 40, 10); });
  const posters = [];
  // Mastoberfläche per Strahl vermessen (Breite + Vorderkante), Zettel als gebogenes Papier darumlegen; axis 'z': Strahlen entlang z, sonst entlang x
  const posterOn = (obj, x, z, face, key, axis = 'z', y = 1.55) => { if (!obj) return null; const hits = [];
    for (let d = -.3; d <= .3; d += .01) { const from = axis === 'z' ? V3(x + d, y, z + face * 2) : V3(x + face * 2, y, z + d), dir = axis === 'z' ? V3(0, 0, -face) : V3(-face, 0, 0); const h = rayHit(obj, from, dir, 4); if (h) hits.push([d, axis === 'z' ? h.point.z : h.point.x]); }
    if (hits.length < 3) return null; const r = Math.max(.04, (hits[hits.length - 1][0] - hits[0][0]) / 2), off = (hits[0][0] + hits[hits.length - 1][0]) / 2, front = face > 0 ? Math.max(...hits.map(h => h[1])) : Math.min(...hits.map(h => h[1]));
    const R = r + .004, th = Math.min(PI * 1.2, .24 / R), m = new T.Mesh(new T.CylinderGeometry(R, R, .34, 20, 1, true, -th / 2, th), new T.MeshStandardMaterial({ map: posterTex[key], roughness: .95, side: T.DoubleSide }));
    if (axis === 'z') { m.position.set(x + off, y + rand(-.12, .1), front - face * r); m.rotation.y = (face > 0 ? 0 : PI) + rand(-.25, .25); } else { m.position.set(front - face * r, y + rand(-.12, .1), z + off); m.rotation.y = (face > 0 ? PI / 2 : -PI / 2) + rand(-.25, .25); }
    m.rotation.z = rand(-.03, .03); m.receiveShadow = true; scene.add(m); const d = posterDefs[key]; interact(m, 'Zettel lesen', () => openNote(d.note[0], d.note[1], d.note[2])); posters.push(m); return m; };
  const lampAt = (x, z) => lamps.find(Lp => Lp.g && Math.abs(Lp.g.position.x - x) < .5 && Math.abs(Lp.g.position.z - z) < .5);
  for (const [x, z, k] of [[-40, -6.3, 'lena'], [-20, 6.3, 'bruno'], [20, 6.3, 'lena'], [40, -6.3, 'tim'], [60, 6.3, 'fest'], [-60, 6.3, 'lena']]) { const Lp = lampAt(x, z); if (Lp) posterOn(Lp.g, x, z, z > 0 ? -1 : 1, k); }
  { const Lp = lampAt(6.3, -22); if (Lp) posterOn(Lp.g, 6.3, -22, -1, 'lena', 'x'); }
  if (S.poleGeo) for (const [x, k] of [[-19, 'amt'], [38, 'bruno'], [-57, 'lena'], [57, 'fest']]) { const i = poleSpots.findIndex(p => Math.abs(p[0] - x) < .5); if (i < 0) continue;
    const tmp = new T.Mesh(S.poleGeo, new T.MeshBasicMaterial()); tmp.matrixAutoUpdate = false; tmp.matrix.copy(poleM4[i]); tmp.matrixWorld.copy(poleM4[i]); posterOn(tmp, x, 7.6, -1, k, 'z', 1.65); }
  S.info.posters = posters.length;

  // =====================================================================  SPIELZEUG (vor Türen und an der Straße liegengelassen – „eben noch benutzt“)
  if (toySrc) { toySrc.updateMatrixWorld(true);
    const toy = (n, size) => { let f = null; toySrc.traverse(m => { if (m.isMesh && m.name === n) f = m; }); if (!f) return null; const c = new T.Mesh(f.geometry, f.material), p = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3();
      f.matrixWorld.decompose(p, q, s); c.quaternion.copy(q); c.scale.copy(s); c.castShadow = true; c.receiveShadow = true; msFit(c, size, 'max'); return msGround(c); };
    const place = (n, size, x, y, z, ry, label, text, onUse) => { const o = toy(n, size); if (!o) return null; msPlace(o, x, y, z, ry); o.updateMatrixWorld(true); const b = new T.Box3().setFromObject(o), s = b.getSize(new T.Vector3());
      interact(hitBox(Math.max(.25, s.x + .1), Math.max(.2, s.y + .08), Math.max(.25, s.z + .1), x, y + s.y / 2, z), label, () => { toast(text, 4600); onUse && onUse(o); }); return o; };
    place('SM_ToyBunny', .3, -26.15, 0, -6.45, .3, 'Stoffhase', 'Ein Stoffhase, klatschnass. Er sitzt aufrecht, als hätte ihn jemand hingesetzt. Er schaut zur Kreuzung.');
    place('SM_Ball', .21, -30.2, 0, -3.72, 0, 'Ball', 'Ein alter Ball, rissig. Jemand hat mit Filzstift eine 8 daraufgemalt.');
    const tr = place('SM_ToyTrain', .26, 44.2, .14, 5.3, -PI / 2, 'Blechlok', 'Eine Blechlok. Der Aufziehschlüssel steckt. Du drehst ihn – sie rattert los, Richtung Kreuzung, und bleibt nach einem Meter stehen.', o => { if (o.userData.moved) return; o.userData.moved = true; tween(o, { pos: o.position.clone().add(V3(-1, 0, 0)) }, 2.4); Audio.play('switch2', { gain: .25, rate: 2.2, x: 44.2, y: .2, z: 5.3, ref: 2 }); });
    if (tr) tr.userData.noCol = true;
    place('SM_ToyRobot', .22, 22.8, .14, 5.72, PI + .4, 'Blechroboter', 'Ein Blechroboter. Die Augen sind rot nachgemalt – die Farbe ist noch nicht trocken.');
    const b1 = toy('SM_ToyCube_01a', .06), b2 = toy('SM_ToyCube_02a', .06); if (b1) msPlace(b1, -46.4, .14, -5.4, .5); if (b2) msPlace(b2, -46.28, .14, -5.3, 1.3); }
}]);
WORLD_TICK.push((dt, t, indoor) => {
  const S = strasse_S;
  if (S.far && (S.tk = (S.tk || 0) + 1) % 8 === 0) { const c = camera.position; for (const f of S.far) { const v = Math.hypot(f.c.x - c.x, f.c.z - c.z) < f.d; if (f.ims[0].visible !== v) f.ims.forEach(m => m.visible = v); } }
  if (S.lenaPiv && S.lenaProxy) S.lenaPiv.rotation.y = -S.lenaProxy.rotation.y;
  if (S.boothGlow) { const on = booth.light.intensity > .25; S.boothGlow.emissiveIntensity = on ? 2.2 : .03; for (const m of S.signGlow) m.emissiveIntensity = on ? 1.1 : .05; }
});
