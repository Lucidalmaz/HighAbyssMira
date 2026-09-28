// =====================================================================  FASSADEN (Modul „fassaden“)
// Alle Hausaußenseiten (HOUSES, auch neue aus dem Ausbau) + die begehbaren Häuser Nr. 7 und Nr. 1:
// Scan-Planken / Putz / Klinker mit Schmutz- und Wasserlauf-Shader, Teerpappe-Dächer mit Moos, Wellblech,
// Scan-Fenster mit Innenraum-Illusion (Zimmer hinter der Scheibe, Taschenlampe leuchtet hinein), Vorhänge,
// Silhouetten (aus dem echten Mannequin-Modell gerendert), Scan-Türen, Rolltore, Veranden, Schornsteine,
// Regenrinnen + Fallrohre, Emaille-Hausnummern, Kellerfenster, kleine Entdeckungen.
const fassaden_S = { houses: [], windows: [], figs: [], pipes: [], twitch: null, U: null, ready: false, dripT: 2, figT: 0, log: [] };
WORLD_MODS.push(['Fassaden', async () => { await fassaden_build(); }]);
WORLD_TICK.push((dt, t, indoor) => { if (fassaden_S.ready) fassaden_tick(dt, t, indoor); });

// ---- Innenraum-Illusion („interior mapping“): ein Zimmer hinter jeder Scheibe, ohne Geometrie
const fassaden_ROOM_VS = `
attribute vec3 aRight; attribute vec4 aRoom; attribute vec4 aWin; attribute float aFig;
varying vec3 vW; varying vec3 vR; varying vec3 vN; varying vec2 vUv2; flat varying vec4 vRoom; flat varying vec4 vWin; flat varying float vFig;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vR = normalize(mat3(modelMatrix) * aRight); vN = normalize(mat3(modelMatrix) * normal);
  vUv2 = uv; vRoom = aRoom; vWin = aWin; vFig = aFig;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const fassaden_ROOM_FS = `
uniform sampler2D tW0, tW1, tW2, tFloor, tCeil, tFig;
uniform float uLit, uFlash, uTime;
uniform vec3 uLitCol, uFlashPos, uFlashDir;
uniform vec4 uFigVis;
varying vec3 vW; varying vec3 vR; varying vec3 vN; varying vec2 vUv2; flat varying vec4 vRoom; flat varying vec4 vWin; flat varying float vFig;
#include <common>
#include <fog_pars_fragment>
float fh1(float n) { return fract(sin(n * 91.3458) * 43758.5453); }
vec3 fWall(vec2 p, float sd) {
  float k = fh1(sd + 3.1);
  vec3 c = k < .3 ? texture2D(tW0, p).rgb : (k < .8 ? texture2D(tW1, p).rgb : texture2D(tW2, p).rgb);
  return c * mix(vec3(1.), vec3(1.05, .95, .8), fh1(sd + 8.2));
}
float fSpot(vec3 hw) { vec3 f = hw - uFlashPos; float fd = length(f); return smoothstep(.82, .95, dot(f / fd, uFlashDir)) * 3.2 / (1.0 + fd * fd * .9); }
void main() {
  vec3 V = normalize(vW - cameraPosition);
  vec3 d = vec3(dot(V, vR), V.y, -dot(V, vN));
  d.z = max(d.z, .02);
  float sd = floor(vRoom.x + .5), kind = floor(vRoom.z + .5);
  bool hall = kind > .5 && kind < 1.5;
  float hw = hall ? .8 : (kind > 2.5 ? 1.6 : mix(1.3, 2.1, fh1(sd)));
  float rh = kind > 1.5 ? 2.15 : 2.5;
  float dp = hall ? 5.0 : (kind > 2.5 ? 5.5 : mix(2.6, 4.2, fh1(sd + 1.7)));
  vec3 p = vec3((vUv2.x - .5) * vWin.x + vWin.w, vWin.z + vUv2.y * vWin.y, 0.);
  p.x = clamp(p.x, -hw + .01, hw - .01);
  vec3 id = 1. / d;
  float tx = ((d.x > 0. ? hw : -hw) - p.x) * id.x;
  float ty = ((d.y > 0. ? rh : 0.) - p.y) * id.y;
  float tz = dp * id.z;
  float t = min(min(tx, ty), tz);
  vec3 h = p + d * t, n, col;
  bool wallHit = false;
  if (t == tz) { col = fWall(vec2(h.x, h.y) * .5, sd); n = vec3(0., 0., -1.); wallHit = true; }
  else if (t == tx) { col = fWall(vec2(h.z * sign(d.x), h.y) * .5, sd); n = vec3(-sign(d.x), 0., 0.); wallHit = true; }
  else if (d.y < 0.) { col = texture2D(tFloor, h.xz * .45).rgb * .75; n = vec3(0., 1., 0.); }
  else { col = texture2D(tCeil, h.xz * .5).rgb * .7; n = vec3(0., -1., 0.); }
  if (kind > 1.5) col = texture2D(tCeil, (wallHit ? vec2(h.x + h.z, h.y) : h.xz) * .4).rgb * vec3(.55, .5, .45); // Keller/Garage: roher Putz
  if (wallHit && h.y < .1 && kind < 1.5) col = vec3(.09, .06, .04); // Fußleiste
  // Licht im Zimmer
  float lt = vRoom.y > 1.5 ? .9 : vRoom.y * uLit; vec3 lc;
  lc = vRoom.y > 1.5 ? vec3(.25, .38, 1.) : uLitCol * mix(vec3(1.), vec3(1.1, .75, .55), fh1(sd + 6.6));
  vec3 L = kind > 1.5 && kind < 2.5 ? vec3(.15, .28, .75) : vec3(fh1(sd + 5.3) * .8 - .4, vRoom.y > 1.5 ? .3 : rh - .45, max(1.3, dp * mix(.3, .6, fh1(sd + 2.2))));
  if (kind > 1.5 && kind < 2.5) { lt *= 1.7 + .45 * sin(uTime * 13. + sin(uTime * 7.3) * 2.); lc = vec3(1., .55, .22); }
  vec3 tl = L - h; float dl = length(tl);
  float ndl = max(dot(n, tl / dl), 0.) * .75 + .25;
  vec3 light = lc * lt * 4.0 / (1. + dl * dl * (kind > 1.5 ? 1.4 : .5)) * ndl;
  float e = min(min(hw - abs(h.x), h.y), min(rh - h.y, dp - h.z));
  float ao = .35 + .65 * smoothstep(0., .5, e);
  vec3 hwld = vW + V * t;
  vec3 c = col * (light + vec3(.010, .012, .018) + vec3(1., .93, .82) * uFlash * fSpot(hwld)) * ao;
  // Gestalt im Zimmer (Maske aus dem echten Mannequin gerendert)
  if (vFig > .5) {
    float vis = vFig < 1.5 ? uFigVis.x : (vFig < 2.5 ? uFigVis.y : (vFig < 3.5 ? uFigVis.z : uFigVis.w));
    float fz = mix(.3, .55, fh1(sd + 7.7)), tf = fz * id.z;
    if (vis > .005 && tf < t) {
      vec3 hf = p + d * tf; float fh = vRoom.w;
      float fx = (fh1(sd + 9.1) - .5) * .45;
      vec2 fu = vec2((hf.x - fx) / (fh * .5) + .5, hf.y / fh);
      if (fu.x > 0. && fu.x < 1. && fu.y > 0. && fu.y < 1.) {
        float pose = step(.5, fh1(sd + 4.4));
        float m = texture2D(tFig, vec2((fu.x + pose) * .5, fu.y)).r * vis;
        vec3 fc = vec3(.006, .006, .007) + vec3(.36, .35, .33) * uFlash * fSpot(vW + V * tf) * .11;
        c = mix(c, fc, m);
      }
    }
  }
  // Glas: Staub am Rand, Himmel spiegelt sich im flachen Winkel
  float fr = pow(1. - clamp(-dot(V, vN), 0., 1.), 3.);
  vec2 q = abs(vUv2 - .5) * 2.;
  c *= 1. - .35 * smoothstep(.75, 1., max(q.x, q.y));
  #ifdef USE_FOG
  c = mix(c, fogColor * 1.6, fr * .55);
  #endif
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
  #include <fog_fragment>
}`;

async function fassaden_build() {
  const T0 = performance.now(), S = fassaden_S, V3 = THREE.Vector3, Q = THREE.Quaternion, M4 = THREE.Matrix4;
  const { clone: skClone } = await import('three/addons/utils/SkeletonUtils.js');
  let seed = 7331; const rnd = (a = 0, b = 1) => { seed = (seed * 16807) % 2147483647; return a + (b - a) * (seed - 1) / 2147483646; };
  const m4 = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx, rx = 0, rz = 0) => new M4().compose(new V3(x, y, z), new Q().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new V3(sx, sy, sz));
  // Verkleinerte Kopie einer Scan-Textur (für Innenräume/Rauschen – spart Grafikspeicher)
  const small = async (path, size = 512, srgb = true) => {
    const blob = await (await fetch('assets/' + path)).blob();
    const bmp = await createImageBitmap(blob, { resizeWidth: size, resizeHeight: size, resizeQuality: 'high', imageOrientation: 'flipY' });
    const t = new THREE.Texture(bmp); t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
  };
  // Scan-Oberfläche als neues Material. uv = Weltmeter je UV-Einheit der Geometrie, tm = Weltmeter je Texturkachel
  const surf = (key, uv, tm, o = {}) => {
    const kx = uv / tm * (o.ax ?? 1), ky = uv / tm * (o.ay ?? 1);
    const tx = (p, srgb) => { const t = msTex(key + '/' + p, srgb).clone(); t.repeat.set(kx, ky); if (o.rot) { t.center.set(.5, .5); t.rotation = o.rot; } return t; };
    const orm = tx('orm.jpg');
    const m = new THREE.MeshStandardMaterial({ map: tx('b.jpg', true), normalMap: tx('n.jpg'), roughnessMap: orm, aoMap: orm, color: o.tint ?? 0xffffff, roughness: o.rough ?? 1, metalness: o.metal ?? 0 });
    if (o.metal) m.metalnessMap = orm;
    m.aoMapIntensity = .8; m.normalScale.set(o.nrm ?? 1, o.nrm ?? 1); m.envMapIntensity = o.env ?? .55; m.name = 'fa_' + key; return m;
  };

  // ---------- Assets
  const [winP, door2P, door1P, retro, sheer, ghost, TX] = await Promise.all([
    msBake('window'), msBake('door2'), msBake('door1'),
    msFBX('curtain_retro', 'model.fbx', { '*': { b: 'curtainroom_01_-_Default_BaseColor.jpg', n: 'curtainroom_01_-_Default_Normal.jpg', r: 'curtainroom_01_-_Default_Roughness.jpg', ds: true } }),
    msFBX('curtain_sheer', 'model.fbx', { '*': { b: 'DefaultMaterial_Base_color.png', a: 'DefaultMaterial_Opacity.png', n: 'DefaultMaterial_Normal_DirectX.jpg', r: 'DefaultMaterial_Roughness.png', ds: true, transparent: true, alphaTest: .02, flipN: true } }),
    MSL.gl.loadAsync('assets/ghost/ghost.glb').catch(e => { console.warn('Fassaden: Mannequin', e); return null; }),
    Promise.all([small('ms/wallpaper_old/b.jpg'), small('ms/wallpaper_deco/b.jpg'), small('ms/wallpaper_fabric/b.jpg'), small('ms/floor_worn/b.jpg'), small('ms/wall_plaster/b.jpg'), small('ms/wall_damaged/b.jpg', 512, false), small('forestfloor/b.jpg', 512), small('ms/curtain_retro/curtainroom_01_-_Default_BaseColor.jpg', 48)])
  ]);
  const [tW0, tW1, tW2, tFloor, tCeil, tNoise, tMoss, retroGlow] = TX;
  const before = new Set(); scene.traverse(o => before.add(o));
  S.swapped = []; S.retired = []; S.added = [];
  const swap = (m, mat) => { S.swapped.push([m, m.material, mat]); m.material = mat; };

  // ---------- Schmutz, Wasserläufe, Nässe, Moos (Shader-Zusatz für Wände und Dächer)
  const WU = { tNoise: { value: tNoise }, tMoss: { value: tMoss } };
  const weather = (m, o = {}) => {
    const u = { faBase: { value: o.base ?? 0 }, faEave: { value: o.eave ?? 6 }, faAmt: { value: o.amt ?? .7 }, faStreak: { value: o.streak ?? .6 }, faMoss: { value: o.moss ?? .5 }, faRoof: { value: o.roof ? 1 : 0 }, faWet: { value: o.wet ?? .55 } };
    m.userData.fa = u;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u, WU);
      sh.vertexShader = 'varying vec3 vFaW;\nvarying vec3 vFaN;\n' + sh.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
        vec4 faP = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          faP = instanceMatrix * faP;
        #endif
        vFaW = (modelMatrix * faP).xyz; vFaN = normalize(mat3(modelMatrix) * objectNormal);`);
      sh.fragmentShader = 'uniform sampler2D tNoise, tMoss;\nuniform float faBase, faEave, faAmt, faStreak, faMoss, faRoof, faWet;\nvarying vec3 vFaW;\nvarying vec3 vFaN;\nfloat faWetK = 0.0;\n' + sh.fragmentShader
        .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 faN = normalize(vFaN);
          float faU = vFaW.x + vFaW.z;
          float big = texture2D(tNoise, vec2(faU, vFaW.y) * .037 + .13).g;
          float fine = texture2D(tNoise, vec2(faU, vFaW.y) * .41).g;
          if (faRoof < .5) {
            float st = texture2D(tNoise, vec2(faU * .19, vFaW.y * .035)).g;
            float st2 = texture2D(tNoise, vec2(faU * .53 + .31, vFaW.y * .013)).r;
            float yy = vFaW.y - faBase;
            float ground = 1. - smoothstep(.25, 1.1 + big * .8, yy);
            float eave = smoothstep(faEave - 1.8, faEave - .05, vFaW.y);
            float streak = smoothstep(.40, .75, st * (.5 + .9 * st2)) * (.3 + .7 * eave + .5 * ground);
            float dirt = clamp(ground * (.55 + .6 * big) + streak * faStreak + eave * .35 * big, 0., 1.) * faAmt;
            vec3 dc = mix(vec3(.44, .40, .33), vec3(.30, .37, .22), ground * faMoss * smoothstep(.3, .65, fine));
            diffuseColor.rgb *= mix(vec3(1.), dc, dirt);
            diffuseColor.rgb *= .84 + .32 * big;
            faWetK = clamp(ground * .9 + streak * .6, 0., 1.) * faWet;
          } else {
            float up = clamp(faN.y * 1.4, 0., 1.);
            float low = 1. - smoothstep(0., 2.2, vFaW.y - faBase);
            float mm = smoothstep(.52, .78, big * .75 + fine * .35 + low * .3) * faMoss * up;
            vec3 moss = texture2D(tMoss, vFaW.xz * .42).rgb * vec3(.7, .85, .55);
            diffuseColor.rgb = mix(diffuseColor.rgb, moss, mm);
            diffuseColor.rgb *= .78 + .4 * big;
            faWetK = faWet * (1. - mm * .6) * (.6 + .4 * up);
          }
        }`)
        .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
          roughnessFactor = mix(roughnessFactor, .16, faWetK);`);
    };
    m.customProgramCacheKey = () => 'fassaden_weather'; m.needsUpdate = true; return m;
  };

  // ---------- Materialbibliothek
  const MAT = {
    brickFor: tint => weather(surf('wall_brick', 1.4, 2, { tint, ay: 2, nrm: 1.3 }), { amt: .75, streak: .7 }),
    planksFor: (tint, uv) => weather(surf('planks_painted', uv, 1.5, { tint, nrm: 1.4 }), { amt: .8, streak: .75 }),
    plasterFor: (tint, uv, key = 'wall_plaster') => weather(surf(key, uv, 2.2, { tint, nrm: 1.2 }), { amt: .9, streak: .9, moss: .7 }),
    casing: tint => surf('planks_painted', 1, 1.5, { tint, nrm: 1.2 }),
    casingV: tint => surf('planks_painted', 1, 1.5, { tint, nrm: 1.2 }),
    concrete: surf('wall_damaged', 1, 2, { tint: 0x9a968e }),
    boards: surf('floor_wood', 1, 2, { tint: 0x8a857c, nrm: 1.4 }),
    deck: surf('floor_wood', 1, 2, { tint: 0x77726a, nrm: 1.4 }),
    corr: surf('corrugated', 1, 2, { tint: 0xa8a8a8, metal: .55, rough: 1, env: .6, rot: Math.PI / 2 }),
    corrFlat: surf('corrugated', 1, 2, { tint: 0xa0a0a0, metal: .55, env: .6 }),
    zinc: surf('rust_sheet', 1, 1, { tint: 0x9a968f, metal: .6, env: .9 }),
    garage: surf('garagedoor', 1, 2, { tint: 0x8c8c8c, metal: .4, env: .8 }),
    enamel: null,
  };
  weather(MAT.corr, { roof: true, moss: .35, wet: .7 }); weather(MAT.corrFlat, { roof: true, moss: .5, wet: .7, base: 2 });
  const shingleFor = tint => { const tx = (p, srgb) => msTex('shed_util/' + p, srgb).clone();
    const m = new THREE.MeshStandardMaterial({ map: tx('t0.jpg', true), normalMap: tx('t2.jpg'), roughnessMap: tx('t1.jpg'), color: tint, roughness: 1, metalness: 0, name: 'fa_shingle' });
    m.normalScale.set(1.4, 1.4); m.envMapIntensity = .75; return weather(m, { roof: true, moss: 1, wet: .8 }); };
  // Dachfläche: U entlang des Firsts, V hangaufwärts (Schindelreihen laufen parallel zum First)
  function slabUV(m, tile) { const g2 = m.geometry.clone(), p = g2.attributes.position, uv = g2.attributes.uv, s = Math.sign(m.position.x) || 1;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getZ(i) / tile, -s * p.getX(i) / tile); uv.needsUpdate = true; m.geometry = g2; }
  const tarFor = tint => weather(surf('road_asphalt', 1, .6, { tint, nrm: 1.1, env: .7 }), { roof: true, moss: .85, wet: .75 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: .05, metalness: .85, transparent: true, opacity: .28, depthWrite: false, envMapIntensity: 1.4, name: 'fa_glass' });
  const roomU = { uFlash: { value: 0 }, uFlashPos: { value: new V3() }, uFlashDir: { value: new V3(0, 0, -1) }, uTime: { value: 0 } };
  S.U = roomU;
  // Silhouetten-Maske aus dem echten (gescannten) Mannequin: zwei Posen nebeneinander
  let tFig = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); tFig.needsUpdate = true;
  if (ghost) {
    const rt = new THREE.WebGLRenderTarget(512, 512); const sc = new THREE.Scene(); const white = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const fig = skClone(ghost.scene); fig.traverse(o => { if (o.isMesh) { o.material = white; o.frustumCulled = false; } }); sc.add(fig);
    const idle = ghost.animations.find(a => /idle/i.test(a.name)) || ghost.animations[0];
    const mx = new THREE.AnimationMixer(fig); if (idle) { mx.clipAction(idle).play(); mx.update(.9); }
    const prevRT = renderer.getRenderTarget(), prevAuto = renderer.autoClear, cc = new THREE.Color(); renderer.getClearColor(cc); const ca = renderer.getClearAlpha();
    renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.autoClear = false;
    for (let i = 0; i < 2; i++) {
      fig.rotation.y = i ? .75 : .12; fig.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(fig, true), c = bb.getCenter(new V3()), hh = (bb.max.y - bb.min.y) * 1.01;
      const cam = new THREE.OrthographicCamera(-hh / 4, hh / 4, hh / 2, -hh / 2, .1, 50); cam.position.set(c.x, c.y, c.z + 10); cam.lookAt(c.x, c.y, c.z);
      rt.viewport.set(i * 256, 0, 256, 512); renderer.setRenderTarget(rt); renderer.render(sc, cam);
    }
    renderer.setRenderTarget(prevRT); renderer.autoClear = prevAuto; renderer.setClearColor(cc, ca);
    tFig = rt.texture;
  }
  S.dbg = { tFig };
  const roomMat = litCol => {
    const u = { tW0: { value: tW0 }, tW1: { value: tW1 }, tW2: { value: tW2 }, tFloor: { value: tFloor }, tCeil: { value: tCeil }, tFig: { value: tFig },
      uLit: { value: 1 }, uLitCol: { value: new THREE.Color(litCol) }, uFigVis: { value: new THREE.Vector4(1, 1, 1, 1) }, ...roomU };
    return new THREE.ShaderMaterial({ uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), u), vertexShader: fassaden_ROOM_VS, fragmentShader: fassaden_ROOM_FS, fog: true, name: 'fa_room' });
  };
  // Vorhänge: nur das Stoffteil der Scan-Modelle, auf Einheitsgröße gebracht (Aufhängung oben in der Mitte)
  const bakeOne = (root, pred) => { root.updateMatrixWorld(true); let out = null; root.traverse(o => { if (!out && o.isMesh && pred(o)) out = { geo: o.geometry.clone().applyMatrix4(o.matrixWorld), mat: [].concat(o.material)[0] }; }); return out; };
  const unit = geo => { geo.computeBoundingBox(); const b = geo.boundingBox, s = b.getSize(new V3()), c = b.getCenter(new V3()); geo.translate(-c.x, -b.max.y, -c.z); geo.scale(1 / s.x, 1 / s.y, 1 / Math.max(s.z, 1e-3)); geo.computeBoundingSphere(); return geo; };
  const RC = bakeOne(retro, o => /plane/i.test(o.name)) || bakeOne(retro, () => true), SC = bakeOne(sheer, () => true);
  unit(RC.geo); unit(SC.geo);
  RC.mat.envMapIntensity = .3; RC.mat.color.set(0xb0a090);
  SC.mat.alphaMap = null; SC.mat.alphaTest = 0; SC.mat.transparent = true; SC.mat.depthWrite = false; SC.mat.envMapIntensity = .2; SC.mat.opacity = .42; SC.mat.color.set(0xb8b2a6); SC.mat.needsUpdate = true;
  const litCurtain = (base, k, em) => { const m = base.clone(); m.emissive = new THREE.Color(1, .66, .38); m.userData.col = m.emissive.clone(); m.emissiveMap = em || base.map; m.emissiveIntensity = k; m.userData.k = k; return m; };
  // Fenster-, Tür-Modelle
  const WIN = winP[0], WS = .8, WH = 2.031 * WS, WWD = 1.275 * WS; // Fenster 1,02 × 1,62 m
  WIN.mat.envMapIntensity = .5;
  const winMats = [0xffffff, 0xd8d4cc, 0xb8b0a4].map(c => { const m = WIN.mat.clone(); m.color.set(c); return m; });
  const D2 = door2P[0], D1 = door1P[0];
  // Tür 2 zerlegen: Zarge (bleibt stehen) und Flügel (drehen sich) – für die begehbaren Häuser
  const split = (geo, pred) => { const idx = geo.index.array, pos = geo.attributes.position, A = [], B = [], v = new V3();
    for (let i = 0; i < idx.length; i += 3) { let cx = 0, cy = 0; for (let j = 0; j < 3; j++) { v.fromBufferAttribute(pos, idx[i + j]); cx += v.x / 3; cy += v.y / 3; } (pred(cx, cy) ? A : B).push(idx[i], idx[i + 1], idx[i + 2]); }
    const a = geo.clone(), b = geo.clone(); a.setIndex(A); b.setIndex(B); return [a, b]; };
  const [D2frame, D2leaf] = split(D2.geo, (x, y) => Math.abs(x) > .615 || y > 2.245);

  // ---------- Hilfen: Geometrie-Sammler je Haus
  class Bag { constructor() { this.m = new Map(); }
    add(mat, geo, mm) { if (mm) geo.applyMatrix4(mm); if (!this.m.has(mat)) this.m.set(mat, []); this.m.get(mat).push(geo); return geo; }
    box(mat, w, h, d, mm, vert = false) { const g = new THREE.BoxGeometry(w, h, d); worldUV(g, w, h, d, 1); if (vert) g.rotateZ(Math.PI / 2); return this.add(mat, g, mm); } // vert: Länge w steht senkrecht, Maserung folgt
    flush(parent, o = {}) { const out = []; for (const [mat, list] of this.m) { const mesh = new THREE.Mesh(mergeGeometries(list, false), mat); mesh.castShadow = o.cast ?? true; mesh.receiveShadow = true; if (o.noCol) mesh.userData.noCol = true; parent.add(mesh); out.push(mesh); } this.m.clear(); return out; } }
  const retire = m => { if (!m) return; msHide(m); m.userData.noCol = true; S.retired.push(m); };
  const isBox = (m, w, h, d) => m.geometry.type === 'BoxGeometry' && Math.abs(m.geometry.parameters.width - w) < .01 && Math.abs(m.geometry.parameters.height - h) < .01 && (d === undefined || Math.abs(m.geometry.parameters.depth - d) < .01);
  const sidingMap = sidingCanv.map;

  // ---------- Hausweise Gestaltung
  const STY = {
    3: { wall: 'planks', tint: 0x93a08c, door: 0x7f8f78, shut: 0x2c3a2e, roof: 'shingle', roofTint: 0x9aa096, casing: 0xc8c4b8, figs: { 1: 1.78 }, cellar: 'dark' },
    9: { wall: 'planks', tint: 0xa8a49c, door: 'door1', roof: 'corr', casing: 0x9a958a, dirt: 1, cellar: null },
    2: { wall: 'brick', tint: 0xa89088, door: 0x8a4a3c, roof: 'shingle', roofTint: 0x948a84, casing: 0xb8b4aa, cellar: 'dark' },
    4: { wall: 'planks', tint: 0xb8ad96, door: 0x505c68, shut: 0x3a2a24, roof: 'tar', roofTint: 0x8f989a, casing: 0xd0ccc0, twitch: 0 },
    6: { wall: 'plaster', plasterKey: 'wall_damaged', tint: 0xa39a86, door: 0x6a5846, roof: 'tar', roofTint: 0xa09890, casing: 0xa8a49a },
    8: { wall: 'brick', tint: 0x8c847c, door: 0x3c4a3a, roof: 'shingle', roofTint: 0x8a8e8a, casing: 0xc0bcb0, figs: { 3: 1.22 }, cellar: 'lit' },
    7: { wall: 'planks', tint: 0xb09c72, roof: 'shingle', roofTint: 0xa09486, casing: 0xc8c0a8, figs: { 1: 1.74 } },
    1: { wall: 'planks', tint: 0x8894a4, roof: 'shingle', roofTint: 0x929aa0, casing: 0xc4c4bc, night: [3] },
  };
  const lookups = []; // Interaktionen: [house, k, label, action]
  const litHouses = [];
  const shellOf = g => (typeof s7 !== 'undefined' && g === s7.g) ? 7 : (typeof s1 !== 'undefined' && g === s1.g) ? 1 : 0;
  let houseIdx = 0;
  for (const HS of HOUSES) {
    const { g, o } = HS; houseIdx++;
    const shell = shellOf(g), n = shell || o.n || 0;
    if (o.hollow && !shell) { S.log.push('begehbares Haus ohne Kennung übersprungen: ' + o.x + ',' + o.z); continue; }
    const w = o.w ?? 11, d = o.d ?? 9, H = o.H ?? 6, rh = o.rh ?? 2.6, ov = .45, off = shell ? .2 : 0, floors = o.floors ?? 2;
    const lit = o.lit || [], boarded = o.boarded || [], garage = o.garage || 0, doorX = shell ? (shell === 7 ? H7.doorX : H1.doorX) - o.x : (o.doorX ?? 0);
    const hsh = Math.abs(Math.round(o.x * 7.3 + o.z * 13.1));
    const sty = Object.assign({ wall: o.brick ? 'brick' : (hsh % 3 === 1 ? 'plaster' : 'planks'), tint: o.tint ?? 0x9a968c, door: [0x6a5a4a, 0x4a5a50, 0x5a4a4a][hsh % 3], roof: ['shingle', 'tar', 'shingle'][hsh % 3], roofTint: 0x9a9a98, casing: 0xc0bcb0, figs: {}, cellar: hsh % 2 ? 'dark' : null }, STY[n] || {});
    if (o.brick) sty.wall = 'brick';
    const hd = { g, o, n, sty, lit: houseLit[HOUSES.indexOf(HS)] || null, curtainLit: [], spill: [], figSlots: [], detail: [] }; S.houses.push(hd);
    g.updateMatrixWorld(true);
    const kids = [...g.children];
    // --- Wände
    const wallMesh = new Set();
    g.traverse(m => { if (m.isMesh && m.material && m.material.map === sidingMap) wallMesh.add(m); });
    if (shell) { const x0 = o.x - w / 2 - 1, x1 = o.x + w / 2 + 1, z0 = o.z - d / 2 - 1, z1 = o.z + d / 2 + 1;
      scene.traverse(m => { if (m.isMesh && m.material && m.material.map === sidingMap && !wallMesh.has(m)) { const b = new THREE.Box3().setFromObject(m), c = b.getCenter(new V3()); if (c.x > x0 && c.x < x1 && c.z > z0 && c.z < z1) wallMesh.add(m); } }); }
    const wallTile = sty.wall === 'brick' ? 1.4 : 2;
    const facade = sty.wall === 'brick' ? MAT.brickFor(sty.tint) : sty.wall === 'plaster' ? MAT.plasterFor(sty.tint, 2, sty.plasterKey) : MAT.planksFor(sty.tint, 2);
    facade.userData.fa.faEave.value = H; facade.userData.fa.faAmt.value = (sty.dirt ?? .75);
    let garageMat = null;
    for (const m of kids) if (m.isMesh && m.material === M.brick && !isBox(m, .9, 3.2, .9)) wallMesh.add(m);
    for (const m of wallMesh) {
      if (garage && isBox(m, 4.2, 3, 6.5)) { garageMat = garageMat || weather(surf('wall_damaged', m.material.userData.tile || 2, 2.2, { tint: 0xa8a296 }), { amt: 1, streak: 1, moss: .8, eave: 3 }); swap(m, garageMat); continue; }
      swap(m, facade);
    }
    // Giebel der begehbaren Häuser bündig mit der dicken Außenwand
    if (shell) for (const m of kids) if (m.isMesh && m.geometry.type === 'ShapeGeometry') { m.position.z = Math.sign(m.position.z) * (d / 2 + off + .004); m.scale.x = (w / 2 + off) / (w / 2); }
    // --- Dach
    const a = Math.atan2(rh, w / 2), L = (w / 2 + ov) / Math.cos(a), DZ = d + ov * 2;
    const roofMat = sty.roof === 'corr' ? MAT.corr : sty.roof === 'tar' ? tarFor(sty.roofTint) : shingleFor(sty.roofTint);
    if (roofMat.userData.fa && roofMat !== MAT.corr) roofMat.userData.fa.faBase.value = H - .3;
    const RB = new Bag();
    for (const m of kids) {
      if (!m.isMesh) continue;
      if (m.material === M.roof) { swap(m, roofMat); m.castShadow = true; if (sty.roof === 'shingle') slabUV(m, 1.6); }
      else if (m.material === M.dark && isBox(m, .18, .18)) retire(m); // First wird neu gedeckt
      else if (m.material === M.paint && isBox(m, .12, .22)) retire(m); // Traufbretter neu
    }
    const casingMat = MAT.casing(sty.casing);
    for (const s of [-1, 1]) {
      const slab = new M4().compose(new V3(s * Math.cos(a) * L / 2, H + rh - Math.sin(a) * L / 2 + .07, 0), new Q().setFromEuler(new THREE.Euler(0, 0, -s * a)), new V3(1, 1, 1));
      if (sty.roof === 'tar') { // Teerpappe in überlappenden Bahnen
        const sw = .95, stp = .82, th = .014; let top = L / 2;
        for (let i = 0; top > -L / 2 + .03 && i < 40; i++) {
          const lo = Math.max(top - sw, -L / 2), wdt = top - lo, xc = (top + lo) / 2;
          const geo = new THREE.BoxGeometry(wdt, th, DZ + .04); worldUV(geo, wdt, th, DZ + .04, 1);
          const uv = geo.attributes.uv, du = rnd(0, 4), dv = rnd(0, 4); for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) + du, uv.getY(k) + dv);
          RB.add(roofMat, geo, slab.clone().multiply(m4(s * xc, .07 + th / 2 + .003, 0, 0, 1, 1, 1, 0, s * .026)));
          top -= stp;
        }
        // Firstabdeckung
        RB.box(roofMat, .32, .02, DZ + .08, slab.clone().multiply(m4(-s * (L / 2 - .15), .07 + .032, 0)));
      }
      if (sty.roof !== 'tar') RB.box(MAT.zinc, .34, .025, DZ + .06, slab.clone().multiply(m4(-s * (L / 2 - .14), .085, 0))); // Firstblech
      // Ortgang-Bretter an den Giebeln, Traufbrett, Rinne
      for (const q of [-1, 1]) RB.box(casingMat, L + .04, .2, .035, slab.clone().multiply(m4(0, -.03, q * (DZ / 2 + .018))));
      const eave = new V3(s * L / 2, -.07, 0).applyMatrix4(slab);
      RB.box(casingMat, .035, .2, DZ + .07, m4(eave.x + s * .01, eave.y - .02, 0));
      const gut = new THREE.CylinderGeometry(.075, .075, DZ + .05, 12, 1, true, -Math.PI / 2, Math.PI); gut.rotateX(Math.PI / 2);
      RB.add(MAT.zinc, gut, m4(eave.x + s * .1, eave.y - .09, 0, 0, 1, 1, 1, 0, 0));
      // Fallrohr: an der Hausecke herunter (bei Garage an die freie Ecke)
      const zc = (s === Math.sign(garage) || (s < 0) === (hsh % 2 === 0)) ? -(d / 2 + off - .3) : (d / 2 + off - .3);
      const xw = s * (w / 2 + off + .07), xg = eave.x + s * .1, yg = eave.y - .12;
      const curve = new THREE.CatmullRomCurve3([new V3(xg, yg, zc), new V3(xg, yg - .18, zc), new V3((xg + xw) / 2, yg - .45, zc), new V3(xw, yg - .75, zc), new V3(xw, 1.2, zc), new V3(xw, .42, zc), new V3(xw + s * .08, .2, zc), new V3(xw + s * .26, .13, zc)], false, 'centripetal', .5);
      const pipe = new THREE.TubeGeometry(curve, 48, .048, 8, false);
      RB.add(MAT.zinc, pipe);
      for (const yy of [yg - 1.2, 2.2, .9]) RB.box(MAT.zinc, .04, .05, .12, m4(xw - s * .04, yy, zc)); // Rohrschellen
      S.pipes.push({ g, p: new V3(xw + s * .28, .13, zc) });
    }
    // Schornstein
    for (const m of kids) if (m.isMesh && isBox(m, .9, 3.2, .9)) {
      const sm = weather(surf('wall_brick', 1.4, 2, { tint: 0x7a6a64, ay: 2, nrm: 1.3 }), { amt: 1, streak: 1, eave: m.position.y + 1.6, base: m.position.y - 1.6, moss: 0 });
      swap(m, sm); RB.box(MAT.concrete, 1.06, .09, 1.06, m4(m.position.x, m.position.y + 1.645, m.position.z));
      RB.box(MAT.zinc, .5, .03, .5, m4(m.position.x, m.position.y + 1.95, m.position.z)); for (const [qx, qz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) RB.box(MAT.zinc, .03, .26, .03, m4(m.position.x + qx, m.position.y + 1.8, m.position.z + qz));
    }
    RB.flush(g);
    // --- Veranda
    const px = doorX;
    for (const m of kids) if (m.isMesh) {
      if (isBox(m, 2.6, .35, 1.6)) { swap(m, MAT.deck); fixUV(m, 1); }
      else if (isBox(m, 2.9, .1, 1.9)) { swap(m, MAT.corrFlat); fixUV(m, 1); m.rotation.x = .07; }
      else if (isBox(m, .12, 2.4, .12) && m.material === M.paint) { swap(m, MAT.casingV(sty.casing)); fixUV(m, 1, true); }
      else if (m.geometry.type === 'SphereGeometry' && m.material.emissiveIntensity > 3) { const cord = new THREE.Mesh(new THREE.CylinderGeometry(.008, .008, .42, 5), MAT.zinc); cord.position.copy(m.position); cord.position.y += .24; cord.userData.noCol = true; g.add(cord); }
    }
    // --- Tür (nicht begehbare Häuser)
    const FB = new Bag(), CB = new Bag();
    const rooms = []; // Innenraum-Flächen (Fenster, Türglas, Keller, Garage)
    const addRoom = (mm, pw, ph, seed_, light, kind, figH, winW, winH, sill, offX, fig) => rooms.push({ mm, pw, ph, seed: seed_, light, kind, figH, winW, winH, sill, offX, fig });
    if (!o.hollow) {
      for (const m of kids) if (m.isMesh && m.material === M.wood && isBox(m, 1.1, 2.2, .1)) retire(m);
      const hasLit = lit.length > 0;
      if (boarded.length >= 3) sty.door = 'door1';
      if (sty.door === 'door1') {
        const sc = 2.09 / 1.9; const mm = m4(doorX - 1.055 * sc / 2, .45, d / 2 + .135 * sc, 0, sc);
        const dm = new THREE.Mesh(D1.geo, D1.mat); dm.applyMatrix4(mm); dm.castShadow = true; dm.receiveShadow = true; g.add(dm);
        addRoom(m4(doorX, .45 + 1.05, d / 2 + .006), 1.16, 2.1, hsh + .5, 0, 1, 0, 1.16, 2.1, 0, 0, 0);
        for (const q of [-1, 1]) FB.box(casingMat, 2.3, .11, .05, m4(doorX + q * .64, .45 + 1.15, d / 2 + .025), true); FB.box(casingMat, 1.4, .12, .05, m4(doorX, 2.66, d / 2 + .025));
        if (boarded.length >= 3) for (const [yy, rz] of [[1.9, .09], [1.35, -.14], [.85, .05]]) FB.box(MAT.boards, 1.5, .18, .03, m4(doorX, .45 + yy, d / 2 + .27, 0, 1, 1, 1, 0, rz));
      } else {
        const dmat = D2.mat.clone(); dmat.color.set(sty.door); dmat.envMapIntensity = .5;
        const dm = new THREE.Mesh(D2.geo, dmat); dm.applyMatrix4(m4(doorX, .45, d / 2 + .046, 0, .95)); dm.castShadow = true; dm.receiveShadow = true; g.add(dm);
        addRoom(m4(doorX, .45 + 1.1, d / 2 + .004), 1.2, 2.12, hsh + .5, hasLit ? .55 : 0, 1, 0, 1.2, 2.12, 0, 0, 0);
      }
      // Podest und Stufen (Beton) – oder Stufe vor der Veranda
      if (o.porch) FB.box(MAT.concrete, 1.3, .17, .34, m4(px, .085, d / 2 + 1.6 + .17));
      else { FB.box(MAT.concrete, 1.8, .45, .9, m4(doorX, .225, d / 2 + .45)); FB.box(MAT.concrete, 1.8, .3, .32, m4(doorX, .15, d / 2 + .9 + .16)); FB.box(MAT.concrete, 1.8, .15, .32, m4(doorX, .075, d / 2 + 1.22 + .16)); }
    }
    // --- Begehbare Türen (Nr. 7 / Nr. 1): Scan-Tür, Drehpunkt/Kollision/Interaktion bleiben
    if (shell) {
      const D = shell === 7 ? door7 : door1, z = (shell === 7 ? s7 : s1).zf;
      const sx = 1.2 / 1.23, sy = 2.18 / 2.245;
      const leafMat = D2.mat.clone(); leafMat.color.set(shell === 7 ? 0x9a8a70 : 0x7a8a9a);
      swap(D.leaf, hidden); D.pivot.children.forEach(c => { if (c !== D.leaf && c.isMesh) retire(c); });
      const lf = new THREE.Mesh(D2leaf, leafMat); lf.position.set(1.2 / 2 + .003, .43, 0); lf.scale.set(sx, sy, .8); lf.castShadow = true; lf.receiveShadow = true; D.pivot.add(lf);
      const fr = new THREE.Mesh(D2frame, leafMat); fr.position.set(doorX + o.x, .43, z + .2 + .04); fr.scale.set(sx, sy, 1); fr.castShadow = true; scene.add(fr);
      // dunkler Flur hinter der Tür, falls sie offen steht? – nicht nötig, dahinter liegt das echte Haus
    }
    // --- Fenster
    const WL = [];
    { const rows = floors === 2 ? [1.75, 4.35] : [1.85], fx = o.frontWins ?? [-w * .3, w * .3];
      const add = (x, y, z, ry) => WL.push({ k: WL.length, x, y, z, ry });
      for (const y of rows) { for (const wx of fx) add(wx, y, d / 2, 0); for (const wx of [-w * .25, w * .25]) add(wx, y, -d / 2, PI); for (const s of [-1, 1]) add(s * w / 2, y, 0, s * PI / 2); }
      if (floors === 2 && !o.frontWins) add(0, 4.35, d / 2, 0); }
    for (const m of kids) if (m.isMesh && m.geometry.type === 'BufferGeometry' && !m.geometry.parameters && (m.material === M.paint || m.material === M.glassDark || m.material === M.dark || m.material === M.wood || houseLit.includes(m.material))) retire(m);
    const frameM = [], curtR = [], curtRL = [], curtS = [], curtSL = [], curtSW = [];
    const isWood = sty.wall === 'planks';
    const surMat = isWood ? casingMat : MAT.concrete;
    const shutMat = sty.shut ? surf('planks_painted', 1, 1.2, { tint: sty.shut, nrm: 1.3 }) : null;
    let closedShut = 0;
    for (const W of WL) {
      const k = W.k, isLit = lit.includes(k) && !boarded.includes(k), isB = boarded.includes(k);
      if (garage && Math.abs(W.ry - Math.sign(garage) * PI / 2) < .01 && W.y < 3) continue; // hinter der Garage
      const nx = Math.sin(W.ry), nz = Math.cos(W.ry);
      const Sx = W.x + nx * off, Sz = W.z + nz * off, yb = W.y - WH / 2;
      const B = m4(Sx, W.y, Sz, W.ry);
      const at = (x, y, z, sx = 1, sy = sx, sz = sx, rz = 0) => B.clone().multiply(m4(x, y, z, 0, sx, sy, sz, 0, rz));
      const winRec = { house: hd, k, g, x: Sx, y: W.y, z: Sz, ry: W.ry, lit: isLit, boarded: isB };
      S.windows.push(winRec);
      // Silhouetten-Position des Spiels (Erscheinung am Fenster) hinter das neue Glas legen
      const lw = litWindows.find(q => q.g === g && Math.abs(q.x - W.x) < .01 && Math.abs(q.y - W.y) < .01 && Math.abs(q.z - W.z) < .01);
      if (lw) { lw.x = Sx + nx * .012; lw.z = Sz + nz * .012; }
      // Rahmen-Modell, Einfassung, Fensterbank
      frameM.push(at(0, -WH / 2, .05 + .042, WS));
      const cw = .12, ow = WWD / 2 - .03;
      for (const q of [-1, 1]) CB.box(surMat, WH + .04, cw, .05, at(q * (ow + cw / 2), 0, .025), true);
      CB.box(surMat, WWD + .2, .17, .065, at(0, WH / 2 + .07, .032)); CB.box(surMat, WWD + .26, .035, .1, at(0, WH / 2 + .165, .05));
      CB.box(isWood ? surMat : MAT.concrete, WWD + .22, .06, .14, at(0, -WH / 2 - .02, .07));
      // Glas
      CB.add(glassMat, new THREE.PlaneGeometry(WWD - .16, WH - .1), at(0, 0, .058));
      // Zimmer dahinter
      let light = isLit ? 1 : 0; if ((sty.night || []).includes(k)) light = 2;
      const figH = sty.figs[k] || 0; let fig = 0;
      if (figH) { fig = hd.figSlots.length + 1; hd.figSlots.push({ k, win: winRec }); }
      addRoom(at(0, 0, .006), WWD - .08, WH - .04, (hsh * 7 + k * 13) % 997, light, 0, figH, WWD - .08, WH - .04, W.y > 3 ? .8 : .55, rnd(-.3, .3), fig);
      // Fensterläden
      if (shutMat) {
        const closed = !isLit && !isB && W.y > 3 && closedShut < 1 && rnd() < .5;
        if (closed) { closedShut++; for (const q of [-1, 1]) { const ajar = q > 0 ? .42 : 0; CB.box(shutMat, WH, WWD / 2, .035, at(q * (WWD / 2 + .01), 0, .17).multiply(m4(0, 0, 0, q * ajar)).multiply(m4(-q * WWD / 4, 0, 0)), true); } }
        else for (const q of [-1, 1]) { const broken = rnd() < .12; CB.box(shutMat, WH - .02, .46, .035, at(q * (ow + cw + .24), broken ? -.12 : 0, .02, 1, 1, 1, broken ? q * .22 : 0), true); }
      }
      // Bretter vor verlassenen Fenstern
      if (isB) for (const [yy, rz] of [[.35, .12], [-.05, -.08], [-.45, .16]]) CB.box(MAT.boards, WWD + .38, .17, .028, at(0, yy, .185, 1, 1, 1, rz + rnd(-.05, .05)));
      // Vorhänge
      if (!isB) {
        let kind = 'none'; const r = rnd();
        if (figH) kind = 'sheer'; else if (isLit) kind = r < .4 ? 'gap' : 'sheer'; else kind = r < .35 ? 'sheer' : r < .6 ? 'closed' : 'none';
        const top = WH / 2 - .08, hgt = WH - .2;
        if (kind === 'sheer') { const mm = at(rnd(-.03, .03), top, .03, 1, 1, 1).multiply(m4(0, 0, 0, 0, WWD - .12, hgt, .02)); if (isLit || light === 2) curtSL.push(mm); else { curtS.push(mm); curtSW.push(winRec); } }
        else if (kind !== 'none') { const pw = kind === 'gap' ? rnd(.26, .36) : (WWD - .1) / 2 + .03;
          for (const q of [-1, 1]) (isLit ? curtRL : curtR).push(at(q * ((WWD - .12) / 2 - pw / 2), top, .026, 1, 1, 1).multiply(m4(0, 0, 0, 0, pw * (q > 0 ? 1 : -1), hgt, .025))); }
        winRec.curtain = kind;
      }
      // Lichtschein auf dem Boden vor beleuchteten Erdgeschossfenstern
    }
    // Kellerfenster im Sockel (vorne links)
    if (!o.hollow && sty.cellar) {
      const cx = (o.frontWins ?? [-w * .3])[0], mm = m4(cx, .245, d / 2 + .07, 0);
      const at = (x, y, z, sx = 1, sy = sx, sz = sx, rz = 0) => mm.clone().multiply(m4(x, y, z, 0, sx, sy, sz, 0, rz));
      frameM.push(at(.305, 0, .02, .3, .3, .3, Math.PI / 2));
      CB.add(glassMat, new THREE.PlaneGeometry(.5, .28), at(0, 0, .045));
      addRoom(at(0, 0, .004), .56, .34, hsh + 11, sty.cellar === 'lit' ? 1.0 : 0, 2, 0, .56, .34, 1.75, 0, 0); if (sty.cellar === 'lit') hd.cellarLit = true;
      hd.cellar = { x: cx, y: .245, z: d / 2 + .07, lit: sty.cellar === 'lit' };
    }
    // Rahmen (Instanzen), Einfassungen, Glas
    if (frameM.length) { const im = new THREE.InstancedMesh(WIN.geo, winMats[hsh % 3], frameM.length); frameM.forEach((mm, i) => im.setMatrixAt(i, mm)); im.castShadow = false; im.receiveShadow = true; im.computeBoundingSphere(); g.add(im); hd.detail.push(im); }
    for (const mesh of CB.flush(g, { cast: false })) { hd.detail.push(mesh); if (mesh.material === glassMat) { mesh.renderOrder = 3; mesh.userData.noCol = true; } }
    FB.flush(g);
    // Vorhang-Instanzen
    const houseLitK = hd.lit ? hd.lit.emissiveIntensity / 1.3 : 1;
    const inst = (geo, mat, list, ro = 0) => { if (!list.length) return null; const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach((mm, i) => im.setMatrixAt(i, mm)); im.castShadow = false; im.receiveShadow = true; im.renderOrder = ro; im.userData.noCol = true; im.computeBoundingSphere(); g.add(im); hd.detail.push(im); return im; };
    inst(RC.geo, RC.mat, curtR); hd.sheer = inst(SC.geo, SC.mat, curtS, 1); hd.sheerWins = curtSW;
    if (curtRL.length) { const cm = litCurtain(RC.mat, .55, retroGlow); hd.curtainLit.push(cm); inst(RC.geo, cm, curtRL); }
    if (curtSL.length) { const cm = litCurtain(SC.mat, n === 1 ? .16 : .12); cm.opacity = .3; if (n === 1) { cm.emissive.setRGB(.4, .55, 1); cm.opacity = .42; } hd.curtainLit.push(cm); hd.sheerLit = inst(SC.geo, cm, curtSL, 1); }
    // Zimmer-Flächen (ein Mesh je Haus)
    if (rooms.length) {
      const pos = [], nor = [], uvs = [], rgt = [], rm = [], wn = [], fg = [], idx = [];
      const v = new V3(), nn = new V3(), rr = new V3(), nmat = new THREE.Matrix3();
      for (const R of rooms) { nmat.getNormalMatrix(R.mm); nn.set(0, 0, 1).applyMatrix3(nmat).normalize(); rr.set(1, 0, 0).applyMatrix3(nmat).normalize(); const b = pos.length / 3;
        for (const [ux, uy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { v.set((ux - .5) * R.pw, (uy - .5) * R.ph, 0).applyMatrix4(R.mm); pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uvs.push(ux, uy); rgt.push(rr.x, rr.y, rr.z); rm.push(R.seed, R.light, R.kind, R.figH); wn.push(R.winW, R.winH, R.sill, R.offX); fg.push(R.fig); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setAttribute('aRight', new THREE.Float32BufferAttribute(rgt, 3)); geo.setAttribute('aRoom', new THREE.Float32BufferAttribute(rm, 4)); geo.setAttribute('aWin', new THREE.Float32BufferAttribute(wn, 4)); geo.setAttribute('aFig', new THREE.Float32BufferAttribute(fg, 1)); geo.setIndex(idx);
      const rmMat = roomMat([0xffc890, 0xffb070, 0xffd8a8][hsh % 3]); rmMat.uniforms.uLit.value = houseLitK; rmMat.userData.col = rmMat.uniforms.uLitCol.value.clone();
      const mesh = new THREE.Mesh(geo, rmMat); mesh.userData.noCol = true; mesh.receiveShadow = false; g.add(mesh); hd.room = rmMat; hd.detail.push(mesh);
    }
    // Lichtschein
    if (hd.spill.length) { const sm = new THREE.MeshBasicMaterial({ map: fassaden_glowTex(), color: 0xffb070, transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }); hd.spillMat = sm;
      const geos = hd.spill.map(mm => new THREE.PlaneGeometry(2.6, 2.2).rotateX(-PI / 2).applyMatrix4(mm)); const mesh = new THREE.Mesh(mergeGeometries(geos), sm); mesh.userData.noCol = true; mesh.renderOrder = 2; g.add(mesh); }
    // --- Garagentor (Scan-Rolltor) – Nr. 9 steht einen Spalt offen
    if (garage) {
      const gx = garage * (w / 2 + 2.2);
      for (const m of kids) if (m.isMesh) { if (m.geometry.type === 'PlaneGeometry' && Math.abs(m.geometry.parameters.width - 3.2) < .01) retire(m); else if (isBox(m, 4.6, .15, 7)) { swap(m, MAT.corrFlat); fixUV(m, 1); } }
      const gap = n === 9 ? .17 : 0, GB = new Bag();
      GB.box(MAT.garage, 3.15, 2.42 - gap, .05, m4(gx, gap + (2.42 - gap) / 2, d / 2 + .03));
      GB.box(MAT.concrete, 3.6, .28, .12, m4(gx, 2.56, d / 2 + .06)); for (const q of [-1, 1]) GB.box(MAT.concrete, 2.42, .22, .12, m4(gx + q * 1.69, 1.21, d / 2 + .06), true);
      GB.box(MAT.zinc, 3.1, .06, .08, m4(gx, 2.47, d / 2 + .08));
      GB.flush(g);
      if (gap) { addRoomLate(g, m4(gx, .2, d / 2 + .006), 3.1, .4, hsh + 23, 0, 3, roomMat(0xff5040)); hd.garageGap = { x: gx, z: d / 2 }; }
      hd.garage = { x: gx, z: d / 2 };
    }
    // --- Hausnummer (Emaille statt gemalt) – wird unten global ersetzt
    hd.lookFront = { doorX, d, off };
    litHouses.push(hd);
  }
  // Zimmer für einzelne Sonderflächen (z. B. Garagenspalt)
  function addRoomLate(g, mm, pw, ph, sd, light, kind, mat) {
    const geo = new THREE.PlaneGeometry(pw, ph); const c = geo.attributes.position.count, a = (n, v) => geo.setAttribute(n, new THREE.Float32BufferAttribute(Array.from({ length: c }, () => v).flat(), v.length));
    a('aRight', [1, 0, 0]); a('aRoom', [sd, light, kind, 0]); a('aWin', [pw, ph, 0, 0]); a('aFig', [0]);
    geo.applyMatrix4(mm); const nm = new THREE.Matrix3().getNormalMatrix(mm); const ar = geo.attributes.aRight; for (let i = 0; i < c; i++) { const v = new V3(1, 0, 0).applyMatrix3(nm).normalize(); ar.setXYZ(i, v.x, v.y, v.z); }
    mat.uniforms.uLit.value = 0; const mesh = new THREE.Mesh(geo, mat); mesh.userData.noCol = true; g.add(mesh); return mesh;
  }
  function fixUV(m, tile, vert) { const p = m.geometry.parameters; if (!p) return; const g2 = new THREE.BoxGeometry(p.width, p.height, p.depth); worldUV(g2, p.width, p.height, p.depth, tile); if (vert) { const uv = g2.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); } m.geometry = g2; }

  // ---------- Hausnummern: Emaille-Schilder (Ziffer aus dem Original übernommen)
  const rustImg = await new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = 'assets/ms/rust_sheet/b.jpg'; });
  const plates = msFind(m => m.geometry.type === 'PlaneGeometry' && Math.abs(m.geometry.parameters.width - .32) < .001 && Math.abs(m.geometry.parameters.height - .32) < .001 && m.material.map && m.material.map.image && m.material.map.image.getContext && Math.abs(m.material.metalness - .3) < .01);
  for (const pm of plates) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 192; const x = c.getContext('2d');
    x.fillStyle = '#1b3663'; x.fillRect(0, 0, 256, 192);
    if (rustImg) { x.globalCompositeOperation = 'multiply'; x.globalAlpha = .5; x.drawImage(rustImg, rnd(0, 1500), rnd(0, 1500), 420, 315, 0, 0, 256, 192); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
    x.strokeStyle = 'rgba(232,228,214,.95)'; x.lineWidth = 8; x.beginPath(); x.roundRect(13, 13, 230, 166, 18); x.stroke();
    const src = pm.material.map.image, t2 = document.createElement('canvas'); t2.width = 128; t2.height = 128; const tx = t2.getContext('2d'); tx.drawImage(src, 0, 0, 128, 128);
    const id = tx.getImageData(0, 0, 128, 128); for (let i = 0; i < id.data.length; i += 4) { const l = id.data[i]; id.data[i + 3] = Math.max(0, Math.min(255, (l - 60) * 2.2)); id.data[i] = 234; id.data[i + 1] = 230; id.data[i + 2] = 218; } tx.putImageData(id, 0, 0);
    x.drawImage(t2, 0, 30, 128, 70, 30, 34, 196, 107);
    if (rustImg) for (let k = 0; k < 7; k++) { const ex = rnd() < .5 ? rnd(4, 40) : rnd(216, 252), ey = rnd(4, 188); x.save(); x.beginPath(); x.ellipse(ex, ey, rnd(4, 13), rnd(3, 9), rnd(0, 3), 0, 7); x.clip(); x.drawImage(rustImg, rnd(0, 1800), rnd(0, 1800), 60, 60, ex - 15, ey - 15, 30, 30); x.restore(); }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: .32, metalness: .1, envMapIntensity: .8 });
    const geo = new THREE.BoxGeometry(.3, .225, .012);
    const plate = new THREE.Mesh(geo, mat); plate.position.copy(pm.position); plate.rotation.copy(pm.rotation); plate.translateZ(-.004);
    // Kollidiert die alte Position mit einem neuen Fenster? → über die Tür
    const wp = plate.getWorldPosition(new V3());
    for (const W of S.windows) { const c2 = W.g.localToWorld(new V3(W.x, W.y, W.z)); const r = new V3(Math.cos(W.ry), 0, -Math.sin(W.ry)).transformDirection(W.g.matrixWorld);
      const dx = (wp.clone().sub(c2)).dot(r), dy = wp.y - c2.y, dist = wp.distanceTo(c2);
      if (dist < 1.6 && Math.abs(dx) < WWD / 2 + .32 && Math.abs(dy) < WH / 2 + .25) { const hd = W.house; const dw = hd.g.localToWorld(new V3(hd.lookFront.doorX, 2.95, hd.lookFront.d / 2 + hd.lookFront.off + .02)); plate.position.set(dw.x, dw.y, dw.z); S.log.push('Hausnummer verlegt: ' + hd.n); break; } }
    pm.parent.add(plate); retire(pm);
  }
  // ---------- Brandruine Nr. 5: verkohlte Planken statt Farbfläche
  const burnt = msFind((m, b) => m.material && m.material.color && m.material.color.getHex() === 0x0c0a09 && b.max.x < -8 && b.min.x > -18 && b.min.z > -23 && b.max.z < -12);
  if (burnt.length) { const bm = surf('planks_painted', 1, 1.2, { tint: 0x2a2622, nrm: 1.6 }); for (const m of burnt) { swap(m, bm); if (m.geometry.parameters) fixUV(m, 1); } }

  // ---------- Entdeckungen
  const figTexts = {
    3: [['Hinter dem Vorhang steht jemand. Ganz still.', 2600], ['Du hebst die Hand. Die Gestalt hebt ihre – einen Atemzug zu spät.', 3600]],
    7: [['Im Wohnzimmer der Wendt steht jemand am Fenster.', 2600], ['Die Lippen bewegen sich. Sie zählt. Bei acht hört sie auf.', 3600]],
    8: [['Ein Kind. Es drückt die Stirn an die Scheibe.', 2600], ['Das Glas beschlägt – auf deiner Seite.', 3200]],
  };
  const hdOf = n => S.houses.find(h => h.n === n);
  const hitBox = (hd, x, y, z, ry, w_, h_, label, act) => { const b = box(w_, h_, .35, x, y, z, hidden, { parent: hd.g, cast: false }); b.rotation.y = ry; interact(b, label, act); return b; };
  for (const hd of S.houses) {
    hd.figSlots.forEach((sl, i) => {
      const W = sl.win, nx = Math.sin(W.ry), nz = Math.cos(W.ry);
      const F = { hd, slot: i, win: W, vis: 1, target: 1, seen: 0, away: 0, gone: 0, n: hd.n, set(v) { this.target = v; } };
      S.figs.push(F);
      if (W.y < 3) hitBox(hd, W.x + nx * .3, W.y, W.z + nz * .3, W.ry, 1.1, 1.6, 'Hinsehen', () => {
        // STORY-HOOK: Gestalten hinter den Fenstern (Nr. 3 / Nr. 7 / Nr. 8) – später mit „Echos“ verknüpfen
        if (F.vis < .5) return toast('Nur der Vorhang. Er bewegt sich noch.');
        say(figTexts[hd.n] || [['Hinter dem Vorhang steht jemand.', 2800]]); F.target = 0; F.gone = rand(45, 90); const p = hd.g.localToWorld(new V3(W.x, W.y, W.z)); Audio.whisper(p.x, 1.7, p.z);
      });
    });
  }
  const lookAt = (n, k, label, act) => { const hd = hdOf(n); if (!hd) return; const W = S.windows.find(q => q.house === hd && q.k === k); if (!W || W.y > 3) return; const nx = Math.sin(W.ry), nz = Math.cos(W.ry); hitBox(hd, W.x + nx * .3, W.y, W.z + nz * .3, W.ry, 1.1, 1.6, label, act); };
  // STORY-HOOK: Kinderzimmer Nr. 1 – Nachtlicht „seit 2009“
  lookAt(1, 3, 'Hineinsehen', () => say([['Euer altes Kinderzimmer. Das Nachtlicht brennt.', 2800], ['Es brennt, seit ihr ausgezogen seid. Jemand wechselt die Birne.', 3400]]));
  // STORY-HOOK: Radio 31,10 MHz
  lookAt(2, 0, 'Hineinsehen', () => { say([['Hinter dem Vorhang spielt ein Radio. Kein Sender – nur Atmen.', 3200], ['Auf der Skala: 31,10.', 2400]]); const p = hdOf(2).g.position; Audio.whisper(p.x, 1.6, p.z + (hdOf(2).o.facing > 0 ? 4.6 : -4.6), 2.6); });
  lookAt(6, 3, 'Hineinsehen', () => say([['Ein gedeckter Tisch. Acht Teller, acht Gläser.', 2800], ['Alle Stühle sind zum Fenster gedreht. Zu dir.', 3200]]));
  // STORY-HOOK: Zählstriche (Hilde Wendts Zählbuch?)
  lookAt(9, 0, 'Durch die Bretter spähen', () => say([['Zwischen den Brettern: ein leeres Zimmer.', 2600], ['An jeder Wand Striche, in Fünfergruppen. Tausende. Die letzte Gruppe hat nur drei.', 3800]]));
  for (const hd of S.houses) {
    if (hd.garageGap) { const G = hd.garageGap; hitBox(hd, G.x, .5, G.z + .3, 0, 3, 1, 'Unter das Tor leuchten', () => { say([['Unter dem Tor: kalte Luft, Ölgeruch.', 2600], ['Etwas Kleines wird langsam ins Dunkle zurückgezogen. Ein Kinderschuh?', 3600]]); const p = hd.g.localToWorld(new V3(G.x, .2, G.z - 1)); Audio.slide && Audio.slide(p.x, p.z); }); }
    else if (hd.garage) { const G = hd.garage; hitBox(hd, G.x, 1.3, G.z + .3, 0, 3, 2.4, 'Garagentor', () => { toast('Abgeschlossen. Drinnen tropft etwas. Im Takt deines Herzens.'); const p = hd.g.localToWorld(new V3(G.x, 1, G.z - 1)); for (let i = 0; i < 4; i++) setTimeout(() => Audio.drip(p.x, 1, p.z), i * 700); }); }
    if (hd.cellar) { const C = hd.cellar; hitBox(hd, C.x, .5, C.z + .35, 0, .9, 1, 'Kellerfenster', () => {
      // STORY-HOOK: Kerze im Keller von Nr. 8 / Zählen im Keller
      if (C.lit) say([['Unten brennt eine Kerze. Daneben ein Kinderstuhl.', 2800], ['Er ist zur Wand gedreht. Wie zur Strafe.', 3000]]);
      else { say([['Aus dem Kellerfenster zieht kalte Luft.', 2400], ['Unten zählt jemand. Leise. Er ist bei dreihundertzwölf.', 3400]]); const p = hd.g.localToWorld(new V3(C.x, 0, C.z - 1)); Audio.whisper(p.x, .3, p.z); } }); }
  }
  // Ein Vorhang, der zuckt, wenn man vorbeigeht (Nr. 4, vorne)
  for (const hd of [hdOf(4), hdOf(3), hdOf(9)]) { if (S.twitch || !hd || !hd.sheer) continue; const i = hd.sheerWins.findIndex(W => W.y < 3 && Math.abs(W.ry) < .01); if (i < 0) continue; const mm = new M4(); hd.sheer.getMatrixAt(i, mm); S.twitch = { im: hd.sheer, i, base: mm, t: -1, cool: 0, n: hd.n }; }
  scene.traverse(o => { if (o.isMesh && !before.has(o) && !o.userData.noColHit) S.added.push(o); });
  S.toggle = on => { S.off = !on; S.houses.forEach(h => h.detOn = undefined); for (const o of S.added) o.visible = on; for (const [m, a, b] of S.swapped) m.material = on ? b : a; for (const m of S.retired) m.visible = !on; };
  S.ready = true;
  S.log.push('Häuser: ' + S.houses.length + ', Fenster: ' + S.windows.length + ', Gestalten: ' + S.figs.length + ', ' + Math.round(performance.now() - T0) + ' ms');
  console.log('[Fassaden] ' + S.log.join(' | ')); window.fassaden_dbg = S.log; window.fassaden_S = S; // Debug-Zugriff für Tests
}
// weicher Lichtfleck (Licht, keine Zeichnung)
function fassaden_glowTex() {
  if (fassaden_S.glow) return fassaden_S.glow;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 40, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return fassaden_S.glow = t;
}
function fassaden_tick(dt, t, indoor) {
  const S = fassaden_S, U = S.U;
  flashRig.getWorldPosition(U.uFlashPos.value); U.uFlashDir.value.set(0, 0, -1).applyQuaternion(flashRig.quaternion).normalize();
  U.uFlash.value = Math.max(0, flashlight.intensity / 14); U.uTime.value = t;
  for (const h of S.houses) {
    const k = h.lit ? Math.max(0, h.lit.emissiveIntensity / 1.3) : 0;
    const ec = h.lit ? h.lit.emissive : null;
    if (h.room) { h.room.uniforms.uLit.value = k; if (ec) h.room.uniforms.uLitCol.value.copy(h.room.userData.col).multiply(ec); }
    for (const m of h.curtainLit) { m.emissiveIntensity = m.userData.k * k; if (ec && h.n !== 1) m.emissive.copy(m.userData.col).multiply(ec); }
    if (h.spillMat) h.spillMat.opacity = .22 * k;
  }
  S.cullT = (S.cullT || 0) - dt;
  if (S.cullT < 0 && !S.off) { S.cullT = .3; const c = camera.position;
    for (const h of S.houses) { const on = Math.hypot(h.g.position.x - c.x, h.g.position.z - c.z) < 52; if (on !== h.detOn) { h.detOn = on; for (const m of h.detail) m.visible = on; } } }
  if (indoor) return;
  // Gestalten: verschwinden, wenn man sie zu lange anleuchtet – und stehen irgendwann wieder da
  const P = player.pos, cam = camera.position, fwd = U.uFlashDir.value;
  for (const F of S.figs) {
    const wp = F.win.g.localToWorld(new THREE.Vector3(F.win.x, F.win.y, F.win.z)), d = wp.distanceTo(cam);
    const look = fwd.dot(wp.clone().sub(cam).normalize()) > .93 && d < 16 && U.uFlash.value > .5;
    if (F.target > .5 && look) { F.seen += dt; if (F.seen > 1.6) { F.target = 0; F.gone = rand(40, 80); Audio.whisper(wp.x, 1.7, wp.z, 1.4); } } else F.seen = Math.max(0, F.seen - dt * .5);
    if (F.target < .5) { F.gone -= dt; if (F.gone < 0 && (d > 22 || fwd.dot(wp.clone().sub(cam).normalize()) < .2)) F.target = 1; }
    F.vis += (F.target - F.vis) * Math.min(1, dt * (F.target > F.vis ? .6 : 2.2));
    const u = F.hd.room && F.hd.room.uniforms.uFigVis.value; if (u) u.setComponent(F.slot, F.vis);
  }
  // Zuckender Vorhang
  const T = S.twitch; if (T) { T.cool -= dt;
    const wp = new THREE.Vector3().setFromMatrixPosition(T.base).applyMatrix4(T.im.parent.matrixWorld), d = Math.hypot(wp.x - P.x, wp.z - P.z);
    if (T.t < 0 && T.cool < 0 && d < 7 && d > 2.5) { T.t = 0; T.cool = 70; }
    if (T.t >= 0) { T.t += dt; const e = T.t < .35 ? T.t / .35 : Math.max(0, 1 - (T.t - .9) / 1.4); const mm = T.base.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(.18 * e, 0, 0), new THREE.Quaternion(), new THREE.Vector3(1 - .55 * e, 1, 1))); T.im.setMatrixAt(T.i, mm); T.im.instanceMatrix.needsUpdate = true; if (T.t > 2.4) { T.t = -1; T.im.setMatrixAt(T.i, T.base); T.im.instanceMatrix.needsUpdate = true; } } }
  // Tropfen aus den Fallrohren
  S.dripT -= dt; if (S.dripT < 0) { S.dripT = rand(.7, 2.2); for (const p of S.pipes) { const wp = p.g.localToWorld(p.p.clone()); if (Math.hypot(wp.x - P.x, wp.z - P.z) < 5) { Audio.drip(wp.x, .15, wp.z); break; } } }
}
