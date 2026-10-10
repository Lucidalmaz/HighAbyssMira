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
// R-12: nie ein leeres Zimmer. Jedes Zimmer hat ein Motiv (Wohnzimmer, Küche, Schlafzimmer, Kinderzimmer, Flur) aus zwei Möbel-Karten,
// die beim Laden aus echten Scan-Möbeln gerendert werden (Rückwand + Möbel im Raum, Parallaxe). Licht nur mit Quelle (Hauslicht, Nachtlicht,
// Fernseher, Stehlampe, Röhre, Kerze), Jalousien als Behang, Fresnel: im flachen Winkel übernimmt die Spiegelung im Glas (fassaden_probe).
const fassaden_ROOM_VS = `
attribute vec3 aRight; attribute vec4 aRoom; attribute vec4 aWin; attribute float aFig; attribute vec2 aDeco;
varying vec3 vW; varying vec3 vR; varying vec3 vN; varying vec2 vUv2; flat varying vec4 vRoom; flat varying vec4 vWin; flat varying float vFig; flat varying vec2 vDeco;
#include <common>
#include <fog_pars_vertex>
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz; vR = normalize(mat3(modelMatrix) * aRight); vN = normalize(mat3(modelMatrix) * normal);
  vUv2 = uv; vRoom = aRoom; vWin = aWin; vFig = aFig; vDeco = aDeco;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const fassaden_ROOM_FS = `
uniform sampler2D tW0, tW1, tW2, tFloor, tCeil, tFig, tAtlas;
uniform float uLit, uFlash, uTime, uAmb, uAux;
uniform vec3 uLitCol, uFlashPos, uFlashDir;
uniform vec4 uFigVis;
varying vec3 vW; varying vec3 vR; varying vec3 vN; varying vec2 vUv2; flat varying vec4 vRoom; flat varying vec4 vWin; flat varying float vFig; flat varying vec2 vDeco;
#include <common>
#include <fog_pars_fragment>
float fh1(float n) { return fract(sin(n * 91.3458) * 43758.5453); }
vec3 fWall(vec2 p, float sd) {
  float k = fh1(sd + 3.1);
  vec3 c = k < .3 ? texture2D(tW0, p).rgb : (k < .8 ? texture2D(tW1, p).rgb : texture2D(tW2, p).rgb);
  return c * mix(vec3(1.), vec3(1.05, .95, .8), fh1(sd + 8.2));
}
float fSpot(vec3 hw) { vec3 f = hw - uFlashPos; float fd = length(f); return smoothstep(.82, .95, dot(f / fd, uFlashDir)) * 3.2 / (1.0 + fd * fd * .9); }
// Möbel-Karte (Atlas 8 × 2): q in Metern, x −1,6…1,6, y 0…2,5; row 0 = Rückwand, 1 = Möbel im Raum
vec4 fCard(vec2 q, float col, float row) {
  vec2 u = vec2(q.x / 3.2 + .5, q.y / 2.5);
  if (u.x < .004 || u.x > .996 || u.y < .004 || u.y > .996) return vec4(0.);
  return texture2D(tAtlas, vec2((col + u.x) * .125, (row + u.y) * .5));
}
vec3 fLight(vec3 hp, vec3 nn, vec3 L, vec3 lc, float lt, float kk, float lo) {
  vec3 tl = L - hp; float dl = length(tl);
  float ndl = max(dot(nn, tl / dl), 0.) * (1. - lo) + lo;
  return lc * lt * 4.0 / (1. + dl * dl * kk) * ndl;
}
void main() {
  vec3 V = normalize(vW - cameraPosition);
  // Von innen (Rückseite) gibt es kein Scheinzimmer: verwerfen → man sieht den echten Raum/die Straße
  float facing = -dot(V, normalize(vN));
  if (facing <= 0.) discard;
  vec3 d = vec3(dot(V, vR), V.y, -dot(V, vN));
  d.z = max(d.z, .02);
  float sd = floor(vRoom.x + .5), kind = floor(vRoom.z + .5), motif = floor(vDeco.x + .5);
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
  // Rückwand-Karte: Schrank, Regal, Fernseher, Bilder …
  float cOff = (fh1(sd + 12.3) - .5) * .5;
  if (t == tz && kind < 1.5 && motif > -.5) { vec4 cb = fCard(vec2(h.x - cOff, h.y), motif, 0.); col = mix(col, cb.rgb, cb.a); }
  if (t == tx && kind < 1.5 && motif > 5.5 && motif < 6.5) { vec4 cs = fCard(vec2(h.z * .8 - 1.6, h.y), motif, 0.); col = mix(col, cs.rgb, cs.a); }  // Nr. 9: auch die Seitenwände voller Striche
  // Licht im Zimmer – jede Helligkeit hat eine Quelle
  float mode = vRoom.y, lt = 0.; vec3 lc = uLitCol * mix(vec3(1.), vec3(1.1, .75, .55), fh1(sd + 6.6));
  vec3 L = vec3(fh1(sd + 5.3) * .8 - .4, rh - .45, max(1.3, dp * mix(.3, .6, fh1(sd + 2.2))));
  float kk = .5;
  if (mode < 1.5) lt = mode * uLit;                                                   // Hauslicht (Glühbirne)
  else if (mode < 2.5) { lt = .9; lc = vec3(.25, .38, 1.); L.y = .3; }                // Nachtlicht
  else if (mode < 3.5) { float fl = .55 + .22 * sin(uTime * 2.3 + sd) + .23 * step(.5, fh1(floor(uTime * 1.7 + sd))); // Fernseher: Szenenwechsel, kein Takt
    lt = uLit * .55 * fl; lc = vec3(.42, .55, 1.); L = vec3(cOff + .5, .95, dp - .5); kk = .9; }
  else if (mode < 4.5) { lt = uLit * .32; L = vec3(cOff + 1.15, 1.5, dp * .55); kk = .8; }  // Stehlampe, gedimmt
  else if (mode < 5.5) { lt = uLit * uAux * .8; lc = vec3(.72, .84, 1.); L = vec3(0., rh - .08, dp * .5); kk = .35; } // Röhre an der Decke (Küche Nr. 7)
  else { lt = uLit * .42 * (.86 + .08 * sin(uTime * 9. + sd) + .06 * sin(uTime * 23. + sd * 2.)); lc = vec3(1., .62, .3); L = vec3(cOff - .6, .45, dp - .4); kk = 1.4; } // Kerze
  if (kind > 1.5 && kind < 2.5) { lt = vRoom.y * uLit * (1.7 + .45 * sin(uTime * 13. + sin(uTime * 7.3) * 2.)); lc = vec3(1., .55, .22); L = vec3(.15, .28, .75); kk = 1.4; }
  vec3 amb = vec3(.012, .014, .02) * uAmb;
  vec3 fill = vec3(.02, .025, .036) * uAmb; // Laternen-/Mondlicht, das durchs Fenster fällt
  vec3 light = fLight(h, n, L, lc, lt, kk, .25);
  float e = min(min(hw - abs(h.x), h.y), min(rh - h.y, dp - h.z));
  float ao = .35 + .65 * smoothstep(0., .5, e);
  vec3 hwld = vW + V * t;
  vec3 c = col * (light + amb + fill * exp(-h.z * .6) * (n.y > .5 ? 1.3 : .7) + vec3(1., .93, .82) * uFlash * fSpot(hwld)) * ao;
  // Möbel im Raum (Sofa, Tisch, Bett …): zweite Karte in halber Tiefe – Parallaxe zur Rückwand
  if (motif > -.5 && ((kind < .5 && dp > 2.4) || (kind > 1.5 && kind < 2.5 && motif > 6.5))) {
    float zm = clamp(dp * .42, 1.05, 1.7), tm = zm * id.z;
    if (tm < t) { vec3 hm = p + d * tm; vec4 cm = fCard(vec2(hm.x - (motif > 6.5 ? 0. : cOff * .6 + (fh1(sd + 3.9) - .5) * .5), hm.y), motif, 1.);
      if (cm.a > .45 && abs(hm.x) < hw && hm.y < rh) {
        vec3 lm = fLight(hm, vec3(0., 0., -1.), L, lc, lt, kk, .15);
        c = cm.rgb * (lm + amb + fill * .8 + vec3(1., .93, .82) * uFlash * fSpot(vW + V * tm)) * .9; t = tm; } } }
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
  // Jalousie (heruntergelassen bis vDeco.y): Lamellen mit Gegenlicht aus dem Zimmer, Taschenlampe fängt sich darin
  if (vDeco.y > .01 && vUv2.y > 1. - vDeco.y) {
    float s = fract((1. - vUv2.y) * vWin.y / .046 + fh1(sd) * .3);
    float slat = smoothstep(0., .08, s) * (1. - smoothstep(.74, .86, s));
    vec3 back = lc * lt * .22;
    vec3 sc = vec3(.6, .56, .48) * (amb * 3. + fill + back + vec3(1., .93, .82) * uFlash * fSpot(vW) * .7) * (.65 + .35 * s);
    float rail = 1. - smoothstep(.0, .012, abs(vUv2.y - (1. - vDeco.y)) * vWin.y);
    c = mix(c, sc, max(slat * .93, rail));
  }
  // Glas: Staub am Rand; im flachen Winkel geht das Licht in die Spiegelung (Glas-Schicht darüber, Fresnel)
  float fr = pow(1. - clamp(facing, 0., 1.), 5.);
  vec2 q = abs(vUv2 - .5) * 2.;
  c *= (1. - .35 * smoothstep(.75, 1., max(q.x, q.y))) * (1. - fr);
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
  const roomU = { uFlash: { value: 0 }, uFlashPos: { value: new V3() }, uFlashDir: { value: new V3(0, 0, -1) }, uTime: { value: 0 }, uAmb: { value: 1 } };
  S.U = roomU;
  // R-12: Fensterglas spiegelt die echte Umgebung (eine gemeinsame Sonde je Straßenabschnitt, selten aufgefrischt) und trägt feinen Staub und Regen.
  // Das Glas ist eine reine Spiegel-/Glanzschicht (additiv) über Zimmer/Vorhang: Fresnel – senkrecht sieht man hinein, im flachen Winkel die Straße.
  const glassMat = fassaden_glass(fassaden_probeInit(), WU.tNoise, roomU.uTime);
  S.glassMat = glassMat;
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
  // Möbel-Karten für die Scheinzimmer (aus echten Scan-Möbeln gerendert, einmal beim Laden + einmal nach dem Nachladen der Texturen)
  const tAtlas = await fassaden_atlas().catch(e => { console.warn('Fassaden: Möbel-Karten', e); S.log.push('Möbel-Karten FEHLEN: ' + e); const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1); t.needsUpdate = true; return t; });
  const roomMat = litCol => {
    const u = { tW0: { value: tW0 }, tW1: { value: tW1 }, tW2: { value: tW2 }, tFloor: { value: tFloor }, tCeil: { value: tCeil }, tFig: { value: tFig }, tAtlas: { value: tAtlas },
      uLit: { value: 1 }, uAux: { value: 1 }, uLitCol: { value: new THREE.Color(litCol) }, uFigVis: { value: new THREE.Vector4(1, 1, 1, 1) }, ...roomU };
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
    9: { wall: 'planks', tint: 0xa8a49c, door: 'door1', roof: 'corr', casing: 0x9a958a, dirt: 1, cellar: null, backDoor: -2.2, skipWin: [3], motif: { 0: 6, 4: 1 } }, // R-12: „Hintertür (Scheibe)“ (post.js) – dort stand vorher ein Fenster
    2: { wall: 'brick', tint: 0xa89088, door: 0x8a4a3c, roof: 'shingle', roofTint: 0x948a84, casing: 0xb8b4aa, cellar: 'dark', motif: { 0: 1 } }, // Fenster 0: Küche mit Radio („Hinter dem Vorhang spielt ein Radio“)
    4: { wall: 'planks', tint: 0xb8ad96, door: 0x505c68, shut: 0x3a2a24, roof: 'tar', roofTint: 0x8f989a, casing: 0xd0ccc0, twitch: 0 },
    6: { wall: 'plaster', plasterKey: 'wall_damaged', tint: 0xa39a86, door: 0x6a5846, roof: 'tar', roofTint: 0xa09890, casing: 0xa8a49a, motif: { 3: 5 } }, // gedeckter Tisch (Hineinsehen): acht Teller, acht Gläser, Stühle zum Fenster
    8: { wall: 'brick', tint: 0x8c847c, door: 0x3c4a3a, roof: 'shingle', roofTint: 0x8a8e8a, casing: 0xc0bcb0, figs: { 3: 1.22 }, cellar: 'lit', motif: { 3: 3 } }, // Kind an der Scheibe
    15: { motif: { 0: 1 } }, 11: { motif: { 1: 0 } }, // Giselas Küchenfenster, Studierzimmer im Pfarrhaus
    7: { wall: 'planks', tint: 0xb09c72, roof: 'shingle', roofTint: 0xa09486, casing: 0xc8c0a8 },
    1: { wall: 'planks', tint: 0x8894a4, roof: 'shingle', roofTint: 0x929aa0, casing: 0xc4c4bc },
  };
  // R-12: Fenster der begehbaren Häuser genau dort, wo sie innen sind (innen_ort.js winIn: Lage, Höhe, Größe) – keine Fenster auf Zwischenwänden oder hinter der Kellertür.
  // f: Seite (v = vorn, h = hinten, l = links/−x), sy: Höhe wie innen (Rahmen-Scan × sy), motif: 0 Wohnz. 1 Küche 2 Schlafz. 3 Kinderz., light: Quelle im echten Raum
  const SHELL_WIN = {
    7: [{ x: -4.6, y: 1.85, f: 'v', sy: .72, motif: 0, light: 1, curt: 'both', fig: 1.74 }, // Wohnzimmer: Stehlampe; Hilde am Fenster
      { x: 1.4, y: 2.08, f: 'v', sy: .64, motif: 1, light: 5, curt: 'sheer' }, { x: 4.3, y: 2.08, f: 'v', sy: .64, motif: 1, light: 5, curt: 'sheer' }, // Küche: Röhre
      { x: -3, y: 1.85, f: 'h', sy: .72, motif: 2, light: 6, curt: 'sheer' }], // Schlafzimmer: die Kerze neben dem Bett
    1: [{ x: -1.2, y: 2.08, f: 'v', sy: .64, motif: 1, light: 0, curt: 'sheer' }, { x: 4.6, y: 1.85, f: 'v', sy: .72, motif: 0, light: 0, curt: 'sheer' },
      { x: 3, y: 1.85, f: 'h', sy: .72, motif: 2, light: 0, curt: 'sheer' },
      { x: -6, z: -1.5, y: 1.85, f: 'l', sy: .72, motif: 3, light: 2, curt: 'sheer' }], // Kinderzimmer: Nachtlicht „seit 2009“ (Seitenwand; die Rückwand ist innen zugestellt)
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
      S.pipes.push({ g, p: new V3(xw + s * .28, .13, zc), gu: new V3(xg, yg - .08, -zc * .55) }); // gu: Stelle, an der die volle Rinne überläuft (Tropfen)
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
    const addRoom = (mm, pw, ph, seed_, light, kind, figH, winW, winH, sill, offX, fig, motif = -1, blind = 0) => rooms.push({ mm, pw, ph, seed: seed_, light, kind, figH, winW, winH, sill, offX, fig, motif, blind });
    if (!o.hollow) {
      for (const m of kids) if (m.isMesh && m.material === M.wood && isBox(m, 1.1, 2.2, .1)) retire(m);
      const hasLit = lit.length > 0;
      if (boarded.length >= 3) sty.door = 'door1';
      if (sty.door === 'door1') {
        const sc = 2.09 / 1.9; const mm = m4(doorX - 1.055 * sc / 2, .45, d / 2 + .135 * sc, 0, sc);
        const dm = new THREE.Mesh(D1.geo, D1.mat); dm.applyMatrix4(mm); dm.castShadow = true; dm.receiveShadow = true; g.add(dm); hd.doorMesh = dm;
        addRoom(m4(doorX, .45 + 1.05, d / 2 + .006), 1.16, 2.1, hsh + .5, 0, 1, 0, 1.16, 2.1, 0, 0, 0, 4);
        for (const q of [-1, 1]) FB.box(casingMat, 2.3, .11, .05, m4(doorX + q * .64, .45 + 1.15, d / 2 + .025), true); FB.box(casingMat, 1.4, .12, .05, m4(doorX, 2.66, d / 2 + .025));
        if (boarded.length >= 3) for (const [yy, rz] of [[1.9, .09], [1.35, -.14], [.85, .05]]) FB.box(MAT.boards, 1.5, .18, .03, m4(doorX, .45 + yy, d / 2 + .27, 0, 1, 1, 1, 0, rz));
      } else {
        const dmat = D2.mat.clone(); dmat.color.set(sty.door); dmat.envMapIntensity = .5;
        const dm = new THREE.Mesh(D2.geo, dmat); dm.applyMatrix4(m4(doorX, .45, d / 2 + .046, 0, .95)); dm.castShadow = true; dm.receiveShadow = true; g.add(dm); hd.doorMesh = dm;
        addRoom(m4(doorX, .45 + 1.1, d / 2 + .004), 1.2, 2.12, hsh + .5, hasLit ? .55 : 0, 1, 0, 1.2, 2.12, 0, 0, 0, 4);
      }
      // R-12: Hintertür mit Scheibe (Nr. 9, post.js „Hintertür (Scheibe)“): Scan-Tür 1 mit Glas, dahinter dunkler Flur, Betonstufe
      if (sty.backDoor !== undefined) { const bx = sty.backDoor, sc = 2.09 / 1.9;
        const dm = new THREE.Mesh(D1.geo, D1.mat); dm.applyMatrix4(m4(bx + 1.055 * sc / 2, .45, -(d / 2 + .135 * sc), PI, sc)); dm.castShadow = true; dm.receiveShadow = true; g.add(dm);
        addRoom(m4(bx, .45 + 1.05, -(d / 2 + .006), PI), 1.16, 2.1, hsh + 1.5, 0, 1, 0, 1.16, 2.1, 0, 0, 0, 4);
        for (const q of [-1, 1]) FB.box(casingMat, 2.3, .11, .05, m4(bx + q * .64, .45 + 1.15, -(d / 2 + .025)), true); FB.box(casingMat, 1.4, .12, .05, m4(bx, 2.66, -(d / 2 + .025)));
        FB.box(MAT.concrete, 1.5, .45, .8, m4(bx, .225, -(d / 2 + .4))); FB.box(MAT.concrete, 1.5, .22, .32, m4(bx, .11, -(d / 2 + .96))); }
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
    const WL = [], SW = shell ? SHELL_WIN[shell] : null;
    if (SW) for (const s of SW) { const ry = s.f === 'v' ? 0 : s.f === 'h' ? PI : s.f === 'l' ? -PI / 2 : PI / 2;
      WL.push({ k: WL.length, x: s.f === 'l' ? -w / 2 : s.f === 'r' ? w / 2 : s.x, y: s.y, z: s.f === 'v' ? d / 2 : s.f === 'h' ? -d / 2 : (s.z ?? 0), ry, sx: .92, sy: s.sy, sh: s }); }
    else { const rows = floors === 2 ? [1.75, 4.35] : [1.85], fx = o.frontWins ?? [-w * .3, w * .3];
      const add = (x, y, z, ry) => WL.push({ k: WL.length, x, y, z, ry });
      for (const y of rows) { for (const wx of fx) add(wx, y, d / 2, 0); for (const wx of [-w * .25, w * .25]) add(wx, y, -d / 2, PI); for (const s of [-1, 1]) add(s * w / 2, y, 0, s * PI / 2); }
      if (floors === 2 && !o.frontWins) add(0, 4.35, d / 2, 0); }
    for (const m of kids) if (m.isMesh && m.geometry.type === 'BufferGeometry' && !m.geometry.parameters && (m.material === M.paint || m.material === M.glassDark || m.material === M.dark || m.material === M.wood || houseLit.includes(m.material))) retire(m);
    const frameM = [], curtR = [], curtRL = [], curtS = [], curtSL = [], curtSW = [];
    const isWood = sty.wall === 'planks';
    const surMat = isWood ? casingMat : MAT.concrete;
    const shutMat = sty.shut ? surf('planks_painted', 1, 1.2, { tint: sty.shut, nrm: 1.3 }) : null;
    const fh = v => { const s = Math.sin(v * 91.3458) * 43758.5453; return s - Math.floor(s); };
    const inhabited = lit.length > 0 && boarded.length === 0 && !o.hollow; // nur bewohnte Häuser zeigen Leben (Fernseher, Stehlampe)
    let closedShut = 0, extra = 0;
    for (const W of WL) {
      const k = W.k, sh = W.sh, isB = !sh && boarded.includes(k), isLit = sh ? sh.light === 1 : lit.includes(k) && !isB;
      if (!sh && garage && Math.abs(W.ry - Math.sign(garage) * PI / 2) < .01 && W.y < 3) continue; // hinter der Garage
      if (!sh && (sty.skipWin || []).includes(k)) continue; // an dieser Stelle ist eine Tür
      const wsx = W.sx ?? WS, wsy = W.sy ?? WS, wh = 2.031 * wsy, wwd = 1.275 * wsx; // Größe wie innen (begehbare Häuser) oder Standard 1,02 × 1,62 m
      const nx = Math.sin(W.ry), nz = Math.cos(W.ry);
      const Sx = W.x + nx * off, Sz = W.z + nz * off;
      const B = m4(Sx, W.y, Sz, W.ry);
      const at = (x, y, z, sx = 1, sy = sx, sz = sx, rz = 0) => B.clone().multiply(m4(x, y, z, 0, sx, sy, sz, 0, rz));
      const winRec = { house: hd, k, g, x: Sx, y: W.y, z: Sz, ry: W.ry, lit: isLit, boarded: isB, pw: wwd - .16, ph: wh - .1 };
      S.windows.push(winRec);
      // Silhouetten-Position des Spiels (Erscheinung am Fenster) hinter das neue Glas legen
      if (sh) { if (sh.light === 1) for (const q of litWindows) if (q.g === g) { q.x = Sx + nx * .012; q.y = W.y; q.z = Sz + nz * .012; q.ry = W.ry; } }
      else { const lw = litWindows.find(q => q.g === g && Math.abs(q.x - W.x) < .01 && Math.abs(q.y - W.y) < .01 && Math.abs(q.z - W.z) < .01);
        if (lw) { lw.x = Sx + nx * .012; lw.z = Sz + nz * .012; } }
      // Rahmen-Modell, Einfassung, Fensterbank
      frameM.push(at(0, -wh / 2, .05 + .042, wsx, wsy, WS));
      const cw = .12, ow = wwd / 2 - .03;
      for (const q of [-1, 1]) CB.box(surMat, wh + .04, cw, .05, at(q * (ow + cw / 2), 0, .025), true);
      CB.box(surMat, wwd + .2, .17, .065, at(0, wh / 2 + .07, .032)); CB.box(surMat, wwd + .26, .035, .1, at(0, wh / 2 + .165, .05));
      CB.box(isWood ? surMat : MAT.concrete, wwd + .22, .06, .14, at(0, -wh / 2 - .02, .07));
      // Glas (spiegelt, Staub, Regen)
      CB.add(glassMat, new THREE.PlaneGeometry(wwd - .16, wh - .1), at(0, 0, .058));
      // Zimmer dahinter: Motiv und Lichtquelle
      let light = isLit ? 1 : 0; if (sh) light = sh.light;
      const figH = sh ? (sh.fig || 0) : (sty.figs[k] || 0); let fig = 0;
      if (figH) { fig = hd.figSlots.length + 1; hd.figSlots.push({ k, win: winRec }); }
      const motif = sh ? sh.motif : (sty.motif && sty.motif[k] !== undefined) ? sty.motif[k] : W.y > 3 ? (fh(hsh + k * 2.7) < .6 ? 2 : 3) : (fh(hsh * .7 + k * 1.3) < .55 ? 0 : 1);
      const offX = rnd(-.3, .3); let blind = 0;
      // Fensterläden
      let shutClosed = false;
      if (shutMat) {
        const closed = !isLit && !isB && !sh && W.y > 3 && closedShut < 1 && rnd() < .5;
        if (closed) { closedShut++; shutClosed = true; for (const q of [-1, 1]) { const ajar = q > 0 ? .42 : 0; CB.box(shutMat, wh, wwd / 2, .035, at(q * (wwd / 2 + .01), 0, .17).multiply(m4(0, 0, 0, q * ajar)).multiply(m4(-q * wwd / 4, 0, 0)), true); } }
        else for (const q of [-1, 1]) { const broken = rnd() < .12; CB.box(shutMat, wh - .02, .46, .035, at(q * (ow + cw + .24), broken ? -.12 : 0, .02, 1, 1, 1, broken ? q * .22 : 0), true); }
      }
      // Bretter vor verlassenen Fenstern
      if (isB) for (const [yy, rz] of [[.35, .12], [-.05, -.08], [-.45, .16]]) CB.box(MAT.boards, wwd + .38, .17, .028, at(0, yy, .185, 1, 1, 1, rz + rnd(-.05, .05)));
      // Vorhänge / Jalousie – R-12: kein nacktes Fenster vor einem leeren Zimmer
      if (!isB) {
        let kind = 'none'; const r = rnd();
        if (sh) kind = sh.curt; else if (figH) kind = 'sheer'; else if (isLit) kind = r < .4 ? 'gap' : 'sheer'; else kind = r < .35 ? 'sheer' : r < .6 ? 'closed' : 'none';
        if (kind === 'none' && !shutClosed && fh(hsh * .37 + k * 1.91) < .5) { kind = 'blind'; blind = .3 + .6 * fh(hsh + k * 3.3); }
        // bewohnte Häuser: hier und da ein Fernseher (blaues Flackern) oder eine gedimmte Stehlampe – je Haus höchstens eins, nur unten
        if (!sh && !isLit && inhabited && W.y < 3 && extra < 1 && kind !== 'closed' && fh(hsh * 1.3 + k * 7.1) < .5) { light = fh(hsh + k * 5.9) < .55 ? 3 : 4; extra++; if (light === 3 && motif !== 0) blind = Math.min(blind, .3); }
        const top = wh / 2 - .08, hgt = wh - .2, litC = light === 1 || light === 2;
        if (kind === 'sheer' || kind === 'both') { const mm = at(sh ? 0 : rnd(-.03, .03), top, .03, 1, 1, 1).multiply(m4(0, 0, 0, 0, wwd - .12, hgt, .02)); if (litC) curtSL.push(mm); else { curtS.push(mm); curtSW.push(winRec); } }
        if (kind === 'gap' || kind === 'closed' || kind === 'both') { const pw = kind === 'gap' ? rnd(.26, .36) : kind === 'both' ? .3 : (wwd - .1) / 2 + .03;
          for (const q of [-1, 1]) (light === 1 ? curtRL : curtR).push(at(q * ((wwd - .12) / 2 - pw / 2), top, .026 - (kind === 'both' ? .006 : 0), 1, 1, 1).multiply(m4(0, 0, 0, 0, pw * (q > 0 ? 1 : -1), hgt, .025))); }
        winRec.curtain = kind;
      }
      addRoom(at(0, 0, .006), wwd - .08, wh - .04, (hsh * 7 + k * 13) % 997, light, 0, figH, wwd - .08, wh - .04, sh ? W.y - wh / 2 - .43 : W.y > 3 ? .8 : .55, offX, fig, motif, blind);
      winRec.light = light; winRec.motif = motif;
    }
    // Kellerfenster im Sockel (vorne links)
    if (!o.hollow && sty.cellar) {
      const cx = (o.frontWins ?? [-w * .3])[0], mm = m4(cx, .245, d / 2 + .07, 0);
      const at = (x, y, z, sx = 1, sy = sx, sz = sx, rz = 0) => mm.clone().multiply(m4(x, y, z, 0, sx, sy, sz, 0, rz));
      frameM.push(at(.305, 0, .02, .3, .3, .3, Math.PI / 2));
      CB.add(glassMat, new THREE.PlaneGeometry(.5, .28), at(0, 0, .045));
      addRoom(at(0, 0, .004), .56, .34, hsh + 11, sty.cellar === 'lit' ? 1.0 : 0, 2, 0, .56, .34, 1.75, 0, 0, sty.cellar === 'lit' ? 7 : -1); if (sty.cellar === 'lit') hd.cellarLit = true;
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
      const pos = [], nor = [], uvs = [], rgt = [], rm = [], wn = [], fg = [], dc = [], idx = [];
      const v = new V3(), nn = new V3(), rr = new V3(), nmat = new THREE.Matrix3();
      for (const R of rooms) { nmat.getNormalMatrix(R.mm); nn.set(0, 0, 1).applyMatrix3(nmat).normalize(); rr.set(1, 0, 0).applyMatrix3(nmat).normalize(); const b = pos.length / 3;
        for (const [ux, uy] of [[0, 0], [1, 0], [1, 1], [0, 1]]) { v.set((ux - .5) * R.pw, (uy - .5) * R.ph, 0).applyMatrix4(R.mm); pos.push(v.x, v.y, v.z); nor.push(nn.x, nn.y, nn.z); uvs.push(ux, uy); rgt.push(rr.x, rr.y, rr.z); rm.push(R.seed, R.light, R.kind, R.figH); wn.push(R.winW, R.winH, R.sill, R.offX); fg.push(R.fig); dc.push(R.motif, R.blind); }
        idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setAttribute('aRight', new THREE.Float32BufferAttribute(rgt, 3)); geo.setAttribute('aRoom', new THREE.Float32BufferAttribute(rm, 4)); geo.setAttribute('aWin', new THREE.Float32BufferAttribute(wn, 4)); geo.setAttribute('aFig', new THREE.Float32BufferAttribute(fg, 1)); geo.setAttribute('aDeco', new THREE.Float32BufferAttribute(dc, 2)); geo.setIndex(idx);
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
    a('aRight', [1, 0, 0]); a('aRoom', [sd, light, kind, 0]); a('aWin', [pw, ph, 0, 0]); a('aFig', [0]); a('aDeco', [-1, 0]);
    geo.applyMatrix4(mm); const nm = new THREE.Matrix3().getNormalMatrix(mm); const ar = geo.attributes.aRight; for (let i = 0; i < c; i++) { const v = new V3(1, 0, 0).applyMatrix3(nm).normalize(); ar.setXYZ(i, v.x, v.y, v.z); }
    mat.uniforms.uLit.value = 0; const mesh = new THREE.Mesh(geo, mat); mesh.userData.noCol = true; g.add(mesh); return mesh;
  }
  function fixUV(m, tile, vert) { const p = m.geometry.parameters; if (!p) return; const g2 = new THREE.BoxGeometry(p.width, p.height, p.depth); worldUV(g2, p.width, p.height, p.depth, tile); if (vert) { const uv = g2.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i)); } m.geometry = g2; }

  // ---------- Bewohnt/verlassen: Kram an jedem Haus (Scan-Modelle, instanziert): Stuhl auf der Veranda, Müllsäcke, Kanister, angelehnte Palette
  try {
    const norm = parts => { const b = new THREE.Box3(); parts.forEach(p => { p.geo.computeBoundingBox(); b.union(p.geo.boundingBox); }); const t = new M4().makeTranslation(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); parts.forEach(p => { p.geo = p.geo.clone().applyMatrix4(t); p.geo.computeBoundingBox(); p.geo.computeBoundingSphere(); }); return parts; };
    const fbxParts = async (key, spec, size) => { const o = await msFBX(key, 'model.fbx', spec); msFit(o, size, 'y'); o.updateMatrixWorld(true); const ps = []; o.traverse(m => { if (m.isMesh) ps.push({ geo: m.geometry.clone().applyMatrix4(m.matrixWorld), mat: m.material, name: m.name }); }); return norm(ps); };
    const [chP, bagP, canP, palP] = await Promise.all([fbxParts('chair', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg', color: 0x9a948c } }, .92),
      msBake('trashbag').then(norm), msBake('jerrycan').then(norm), msBake('pallet_ms').then(norm)]);
    const L = { ch: [], bag: [], can: [], pal: [] };
    const at = (hd, lx, ly, lz, lry, list, s = 1, rx = 0, rz = 0) => { const g = hd.g; g.updateMatrixWorld(true); const w = g.localToWorld(new V3(lx, ly, lz)), ry = g.rotation.y + lry; list.push(m4(w.x, w.y, w.z, ry, s, s, s, rx, rz)); };
    let k = 0;
    for (const hd of S.houses) { const o = hd.o, w = o.w ?? 11, d = o.d ?? 9, dx = hd.n === 7 ? H7.doorX - o.x : hd.n === 1 ? H1.doorX - o.x : (o.doorX ?? 0), h = Math.abs(Math.round(o.x * 7.3 + o.z * 13.1)); k++;
      const gx = hd.garage ? hd.garage.x : 99, side = [-1, 1].filter(q => Math.abs(q * (w / 2 - .7) - gx) > 2.2 && Math.abs(q * (w / 2 - .7) - dx) > 1.8);
      if (o.porch) at(hd, dx + (h % 2 ? 1 : -1) * .95, .35, d / 2 + .75, (h % 2 ? -1 : 1) * .5, L.ch);
      if (side[0] !== undefined) { const sx = side[0] * (w / 2 - .7); at(hd, sx, 0, d / 2 + .42, rand(0, 6), L.bag, rand(.85, 1.05)); at(hd, sx + side[0] * -.55, 0, d / 2 + .5, rand(0, 6), L.bag, rand(.75, .95));
        if (h % 3 === 0) at(hd, sx + side[0] * -1.05, 0, d / 2 + .35, rand(0, 6), L.can, .95); }
      if (side[1] !== undefined && h % 2 === 0) at(hd, side[1] * (w / 2 - .9), .6, d / 2 + .36, 0, L.pal, 1, PI / 2 - .24); }
    for (const [ps, list] of [[chP, L.ch], [bagP, L.bag], [canP, L.can], [palP, L.pal]]) if (ps && list.length) msInst(ps, list, { shadow: true }).forEach(im => im.userData.dress = 1);
    S.log.push('Hauskram: ' + L.ch.length + ' Stühle, ' + L.bag.length + ' Säcke, ' + L.can.length + ' Kanister, ' + L.pal.length + ' Paletten');
  } catch (e) { console.warn('Fassaden: Hauskram', e); }
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

  // ---------- R-12: Türspione (Messingring + Linse) an allen Haustüren – die Klopf-Texte sprechen vom Spion; Briefschlitz an Nr. 3 (Vegas), Klingelschild der Aydıns
  try {
    const probe = S.probe.rt.texture, brass = new THREE.MeshStandardMaterial({ color: 0xa8843f, metalness: 1, roughness: .36, envMap: probe, envMapIntensity: 1.3, name: 'fa_messing' });
    const dark = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .9 });
    S.brass = brass; S.spione = {};
    const rc = new THREE.Raycaster(), hitDoor = (hd, y) => { const o = hd.o, d = o.d ?? 9, dx = hd.lookFront.doorX; hd.g.updateMatrixWorld(true);
      const from = hd.g.localToWorld(new V3(dx, y, d / 2 + 1)), dir = hd.g.localToWorld(new V3(dx, y, d / 2 - 1)).sub(from).normalize();
      rc.set(from, dir); rc.far = 2.2; const dm = hd.doorMesh, side0 = dm.material.side, bt = dm.geometry.boundsTree; dm.material.side = THREE.DoubleSide; dm.geometry.boundsTree = null; /* Schlusstest: mit BVH/einseitig traf der Strahl keine Tür (0 Spione) – hier genau und zweiseitig */ const h = rc.intersectObject(dm, false)[0]; dm.material.side = side0; dm.geometry.boundsTree = bt; return h ? hd.g.worldToLocal(h.point.clone()) : null; };
    for (const hd of S.houses) { if (!hd.doorMesh) continue;
      const lp = hitDoor(hd, .45 + 1.5); if (!lp) { S.log.push('Türspion: keine Türfläche an ' + (hd.n || hd.o.x)); continue; }
      const sp = fassaden_spionBau(hd.g, lp.x, lp.y, lp.z + .001, 0, brass, (hd.lit ? .35 : 0) * (hd.o.lit && hd.o.lit.length ? 1 : 0)); sp.hd = hd; hd.detail.push(sp.g);
      if (hd.n) S.spione[hd.n] = sp; hd.spion = sp;
      if ([2, 4, 6, 8, 9].includes(hd.n) && typeof ritz_kratzer === 'function') { const ks = hitDoor(hd, .45 + .22); if (ks) { // „Am Türrahmen: kleine Kratzspuren, ganz unten.“ (Basis-Umsetzung)
        const f = ritz_kratzer(256, 288, { seed: 40 + hd.n, bueschel: 2, groesse: 70 }), km = new THREE.Mesh(new THREE.PlaneGeometry(.3, .34), new THREE.MeshStandardMaterial({ ...ritz_tex(f.c, f.b), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: .8 }));
        km.position.set(ks.x - .4, ks.y, ks.z + .003); km.userData.noCol = true; km.castShadow = false; hd.g.add(km); hd.detail.push(km); } }
      if (hd.n === 3) { const ls = hitDoor(hd, .45 + .95); if (ls) { const B = new Bag(); // Briefschlitz mit Messingklappe (anwesen.js: „Die Klappe vom Briefschlitz geht auf“)
        B.box(brass, .3, .075, .01, m4(ls.x, ls.y, ls.z + .005)); B.box(dark, .24, .02, .004, m4(ls.x, ls.y - .006, ls.z + .0105)); B.box(brass, .25, .028, .005, m4(ls.x, ls.y + .006, ls.z + .013, 0, 1, 1, 1, -.12)); for (const mesh of B.flush(hd.g, { cast: false })) hd.detail.push(mesh); } }
    }
    // Klingelschild am Bauernhaus (ausbau_ost_west.js: „Am Klingelschild: AYDIN. Darunter, mit Kinderschrift: und Dina.“)
    const farm = S.houses.find(h => h.o.x === -117.5 && h.o.z === -13);
    if (farm) { const c = document.createElement('canvas'); c.width = 128; c.height = 192; const x = c.getContext('2d');
      const gr = x.createLinearGradient(0, 0, 128, 192); gr.addColorStop(0, '#8a6a34'); gr.addColorStop(.5, '#b8944e'); gr.addColorStop(1, '#6a5028'); x.fillStyle = gr; x.fillRect(0, 0, 128, 192);
      for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(30,40,20,${rnd(.03, .12)})`; x.fillRect(rnd(0, 128), rnd(0, 192), rnd(1, 6), rnd(1, 4)); } // Grünspan, Fingerspuren
      x.fillStyle = '#e8e2d0'; x.fillRect(14, 22, 100, 62); x.strokeStyle = 'rgba(40,30,10,.6)'; x.lineWidth = 2; x.strokeRect(14, 22, 100, 62);
      x.fillStyle = '#1a1a1a'; x.font = 'bold 26px Georgia'; x.textAlign = 'center'; x.fillText('AYDIN', 64, 52);
      x.fillStyle = 'rgba(30,50,140,.9)'; x.font = '20px Caveat, cursive'; x.save(); x.translate(66, 76); x.rotate(-.08); x.fillText('und Dina', 0, 0); x.restore();
      x.fillStyle = 'rgba(0,0,0,.35)'; x.beginPath(); x.arc(64, 138, 26, 0, 7); x.fill();
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      const d = farm.o.d ?? 9, dx = farm.lookFront.doorX + .86;
      const pl = new THREE.Mesh(new THREE.BoxGeometry(.085, .128, .008), [dark, dark, dark, dark, new THREE.MeshStandardMaterial({ map: t, metalness: .55, roughness: .42, envMap: probe, envMapIntensity: .9 }), dark]);
      pl.position.set(dx, .45 + 1.18, d / 2 + .004); pl.castShadow = false; pl.userData.noCol = true; farm.g.add(pl); farm.detail.push(pl);
      const btn = new THREE.Mesh(new THREE.CylinderGeometry(.011, .012, .012, 18).rotateX(PI / 2), new THREE.MeshStandardMaterial({ color: 0xd8d0b8, roughness: .35 })); btn.position.set(dx, .45 + 1.18 - .035, d / 2 + .012); btn.userData.noCol = true; farm.g.add(btn); farm.detail.push(btn);
      S.log.push('Klingelschild Aydın'); }
    // Türspion-Text der Basis (Klopfen an Nr. 2/4/6/8/9): „Am Türspion bewegt sich etwas.“ → die Linse wird hell, dann verdeckt sie ein Auge
    if (typeof doorOf !== 'undefined') for (const [n, di] of Object.entries(doorOf)) { const f = di && di.userData.action; if (!f || !S.spione[n]) continue;
      di.userData.action = (...a) => { const b = lastLocked, r = f(...a); try { if (lastLocked !== b && /Türspion/.test(lockedLines[lastLocked])) fassaden_spion(+n); } catch (e) {} return r; }; }
    S.log.push('Türspione: ' + Object.keys(S.spione).length + ' (+' + (S.houses.filter(h => h.spion && !h.n).length) + ' ohne Nummer)');
  } catch (e) { console.warn('Fassaden: Türspione', e); }
  // ---------- R-12: Villa Seiler – statt schwarzer Flächen dunkle, eingerichtete Zimmer hinter spiegelndem Glas (das erleuchtete Fenster bleibt)
  try { const OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null;
    if (OW && OW.villaGlass && OW.villaGlass.length) { const vm = roomMat(0xffb070); vm.uniforms.uLit.value = 0; S.villaRoom = vm;
      OW.villaGlass.forEach((m, i) => { const g2 = m.geometry, c = g2.attributes.position.count, P = g2.parameters || { width: 1.5, height: 1.78 }, up = m.position.y > 5;
        const a = (nm, v) => g2.setAttribute(nm, new THREE.Float32BufferAttribute(Array.from({ length: c }, () => v).flat(), v.length));
        a('aRight', [1, 0, 0]); a('aRoom', [503 + i * 37, 0, 0, 0]); a('aWin', [P.width, P.height, up ? .9 : .7, 0]); a('aFig', [0]); a('aDeco', [up ? (i % 2 ? 2 : 4) : (i % 3 === 0 ? 1 : 0), i % 3 === 1 ? .6 : 0]);
        m.material = vm; m.userData.noCol = true;
        const gl = new THREE.Mesh(g2, glassMat); gl.position.z = .004; gl.renderOrder = 3; gl.userData.noCol = true; m.add(gl); });
      S.log.push('Villa: ' + OW.villaGlass.length + ' Fenster mit Zimmer'); } } catch (e) { console.warn('Fassaden: Villa-Fenster', e); }
  // ---------- R-12: anderes Glas der Welt spiegelt dieselbe Umgebung (Kiosk Kranz, Wartehäuschen, Telefonzelle)
  scene.traverse(o => { if (!o.isMesh) return; for (const mt of [].concat(o.material)) { if (!mt || !mt.isMeshStandardMaterial || mt.envMap) continue;
    const kiosk = mt.transparent && Math.abs(mt.opacity - .64) < .001 && mt.color && mt.color.getHex() === 0x18222a, stop = mt.transparent && Math.abs(mt.opacity - .42) < .001 && mt.color && mt.color.getHex() === 0x9aa6a8;
    if (kiosk || stop) { mt.envMap = S.probe.rt.texture; mt.envMapIntensity = 1.4; mt.needsUpdate = true; } } });
  // ---------- R-12: Nr. 1 Kinderzimmer – das Fenster mit dem Nachtlicht gibt es jetzt auch von innen (Seitenwand)
  try { await fassaden_innenKZ(); } catch (e) { console.warn('Fassaden: Kinderzimmerfenster innen', e); }
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
  // Spiegelungs-Sonde einmal ganz füllen (Ortsmitte); im Spiel folgt sie dem Spieler abschnittsweise
  try { fassaden_probeAt(0, 1.7, 0); } catch (e) { console.warn('Fassaden: Spiegelung', e); } // Seiten füllt der Takt nach dem Laden (vorher hier: 6 Würfelseiten → ~25 s blockierendes Shader-Übersetzen beim Laden)
  S.ready = true;
  S.log.push('Häuser: ' + S.houses.length + ', Fenster: ' + S.windows.length + ', Gestalten: ' + S.figs.length + ', ' + Math.round(performance.now() - T0) + ' ms');
  console.log('[Fassaden] ' + S.log.join(' | ')); window.fassaden_dbg = S.log; window.fassaden_S = S; // Debug-Zugriff für Tests
}
// =====================================================================  R-12: Spiegelung, Glas, Möbel-Karten, Türspion
// Spiegelungs-Sonde: EINE Würfelkamera für alle Scheiben, steht dort, wo der Spieler gerade auf der Straße ist (Straßenabschnitt),
// wird erst nach 18 m Weg oder 50 s neu aufgenommen – und dann je Bild nur eine der sechs Seiten (128 px, kein Schattenpass, Glas ausgeblendet).
function fassaden_probeInit() {
  const T = THREE, S = fassaden_S;
  const rt = new T.WebGLCubeRenderTarget(128, { type: T.HalfFloatType, generateMipmaps: false, minFilter: T.LinearFilter });
  const cam = new T.CubeCamera(.3, 80, rt); cam.coordinateSystem = renderer.coordinateSystem; cam.updateCoordinateSystem();
  S.probe = { rt, cam, face: -1, t: 0, x: 1e9, z: 1e9, mats: [], n: 0 };
  return rt.texture;
}
function fassaden_probeFace(i) {
  const P = fassaden_S.probe, r = renderer, prev = r.getRenderTarget(), au = r.shadowMap.autoUpdate;
  for (const m of P.mats) m.visible = false;
  r.shadowMap.autoUpdate = false;
  try { r.setRenderTarget(P.rt, i); r.render(scene, P.cam.children[i]); }
  finally { r.setRenderTarget(prev); r.shadowMap.autoUpdate = au; for (const m of P.mats) m.visible = true; }
  if (i === 5) { P.rt.texture.needsPMREMUpdate = true; P.n++; }
}
function fassaden_probeAt(x, y, z) { const P = fassaden_S.probe; P.cam.position.set(x, y, z); P.cam.updateMatrixWorld(true); P.x = x; P.z = z; P.t = 50; P.face = 0; }
function fassaden_probeTick(dt, indoor) {
  const P = fassaden_S.probe; if (!P || !window.__ready) return;
  if (P.face >= 0) { fassaden_probeFace(P.face); P.face = P.face < 5 ? P.face + 1 : -1; return; }
  if (indoor || state.inBasement) return;
  P.t -= dt; const c = camera.position;
  if (P.t < 0 || Math.hypot(c.x - P.x, c.z - P.z) > 18) fassaden_probeAt(c.x, 1.7, c.z);
}
// Fensterglas: reine Spiegel-/Glanzschicht (additiv): Fresnel aus der Sonde, Glanzlichter von Laternen und Taschenlampe,
// feiner Staub (an den Rändern und unten mehr, fängt das Licht), Regenperlen und ablaufende Tropfen (Normale), Nebel schluckt die Schicht mit
function fassaden_glass(envTex, tNoise, uTime) {
  const m = new THREE.MeshStandardMaterial({ color: 0x000000, roughness: .05, metalness: 0, envMap: envTex, envMapIntensity: 1.6, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, name: 'fa_glass' });
  m.onBeforeCompile = sh => {
    sh.uniforms.tNoise = tNoise; sh.uniforms.uTime = uTime;
    sh.vertexShader = 'varying vec2 vGU;\nvarying vec3 vGW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vGU = uv; vGW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform sampler2D tNoise; uniform float uTime; varying vec2 vGU; varying vec3 vGW; float gDirt; vec3 gRain;
float gh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 gDrops(vec2 q) {
  vec3 r = vec3(0.);
  vec2 g = q * 30.; vec2 id = floor(g); vec2 f = fract(g) - .5; float h = gh(id);
  if (h < .3) { vec2 o = (vec2(gh(id + 3.1), gh(id + 7.7)) - .5) * .45; vec2 dd = f - o; float rr = .1 + .2 * gh(id + 1.3); float k = 1. - dot(dd, dd) / (rr * rr);
    if (k > 0.) r = vec3(dd / rr, sqrt(k)); }
  float cx = q.x * 9., ci = floor(cx), hc = gh(vec2(ci, 2.3));
  if (hc > .5) { float sp = .05 + .12 * gh(vec2(ci, 5.1)), yb = fract(q.y * .5) * 2.;
    float yd = 2.1 - fract(uTime * sp + hc * 7.31) * 2.4;
    float xo = (fract(cx) - .5) / 9. + sin(q.y * 7. + hc * 20.) * .006;
    vec2 dd = vec2(xo, yb - yd) / .0075; float k = 1. - dot(dd, dd);
    if (k > 0.) r = vec3(dd, sqrt(k));
    else if (yb > yd && yb < yd + .22 && abs(xo) < .0018) r = vec3(xo / .0018 * .4, 0., .35 * (1. - (yb - yd) / .22)); }
  return r;
}
` + sh.fragmentShader
      .replace('#include <map_fragment>', `#include <map_fragment>
  { vec2 q = vec2(vGW.x + vGW.z, vGW.y);
    float n1 = texture2D(tNoise, vGU * vec2(.55, .9) + q * .23).g;
    vec2 e2 = abs(vGU - .5) * 2.;
    float edge = smoothstep(.55, 1., max(e2.x, e2.y)), bot = 1. - smoothstep(0., .32, vGU.y);
    gDirt = clamp((edge * .65 + bot * .6 + .12) * smoothstep(.2, .75, n1), 0., 1.);
    gRain = gDrops(q);
    diffuseColor.rgb = vec3(.30, .28, .24) * gDirt * .3; }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
  roughnessFactor = mix(.035, .45, gDirt) * (1. - .7 * gRain.z);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  if (gRain.z > .001) { vec3 q0 = dFdx(-vViewPosition), q1 = dFdy(-vViewPosition); vec2 st = vec2(vGW.x + vGW.z, vGW.y), s0 = dFdx(st), s1 = dFdy(st);
    vec3 N = normal, q1p = cross(q1, N), q0p = cross(N, q0), Tt = q1p * s0.x + q0p * s1.x, Bt = q1p * s0.y + q0p * s1.y;
    float det = max(dot(Tt, Tt), dot(Bt, Bt)), sc = det == 0. ? 0. : inversesqrt(det);
    normal = normalize(N + (Tt * gRain.x + Bt * gRain.y) * sc * .55); }`)
      .replace('#include <fog_fragment>', `#ifdef USE_FOG
  #ifdef FOG_EXP2
    float gFog = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float gFog = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb *= 1.0 - gFog;
#endif`);
  };
  m.customProgramCacheKey = () => 'fassaden_glass2';
  fassaden_S.probe.mats.push(m);
  return m;
}
// Möbel-Karten (Atlas 5 × 2 Felder à 256 px): je Motiv die Rückwand und die Möbel im Raum, orthografisch aus echten Scan-Möbeln gerendert.
// Spalten: 0 Wohnzimmer, 1 Küche, 2 Schlafzimmer, 3 Kinderzimmer, 4 Flur, 5 gedeckter Tisch (Nr. 6), 6 Strichwände (Nr. 9), 7 Keller: Kerze + Kinderstuhl (Nr. 8). Kein selbstgebautes Möbel – nur die Scans, die auch innen stehen.
async function fassaden_atlas() {
  const T = THREE, S = fassaden_S, CW = 256;
  const rt = new T.WebGLRenderTarget(CW * 8, CW * 2, { colorSpace: T.SRGBColorSpace, generateMipmaps: true, minFilter: T.LinearMipmapLinearFilter, magFilter: T.LinearFilter });
  rt.texture.anisotropy = 4;
  const sc = new T.Scene(); sc.add(new T.HemisphereLight(0xfff2e4, 0x3a3028, 1.5)); const dl = new T.DirectionalLight(0xfff0dc, 2.0); dl.position.set(-1.5, 3, 4); sc.add(dl);
  const cells = Array.from({ length: 16 }, () => { const g = new T.Group(); g.visible = false; sc.add(g); return g; });
  const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg` });
  const hutchSpec = tint => ({ 'Wood-1': { ...W_('Wood-1'), color: tint }, 'Wood-2': { ...W_('Wood-2'), color: tint }, 'Wood-3': { ...W_('Wood-3'), color: tint }, Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } });
  const bedSpec = b => ({ blanket: { b: 'blanket_color.jpg', n: 'blanket_nrm.jpg', r: 'blanket_rough.jpg', ds: 1, color: b }, mattress: { b: 'mattress_color.jpg', n: 'mattress_nrm.jpg', r: 'mattresss_rough.jpg', color: 0xb8b0a4 }, bed: { b: 'bed_color.jpg', n: 'bed_nrm.jpg', r: 'bed_Rough.jpg', m: 'bed_metalic.jpg' } });
  const chairSpec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
  const GL = async (k, f) => (await msModel(k, f)).clone(true), FBX = (k, spec) => msFBX(k, 'model.fbx', spec);
  const lowerCab = async (tint, h) => { const o = await FBX('dresser', hutchSpec(tint)); // wie innen_ort.js: Buffet ohne Aufsatz
    o.traverse(m => { if (!m.isMesh) return; m.geometry = m.geometry.clone(); const P = m.geometry.attributes.position;
      for (let i = 0; i < P.count; i++) if (P.getY(i) > 409.5) { P.setY(i, 405); P.setX(i, Math.min(267, Math.max(-288, P.getX(i)))); P.setZ(i, Math.min(123, Math.max(-114, P.getZ(i)))); }
      P.needsUpdate = true; m.geometry.computeBoundingBox(); m.geometry.computeBoundingSphere(); });
    msFit(o, h, 'y'); return o; };
  const safe = p => Promise.resolve(p).catch(e => { console.warn('Fassaden-Karte', e); S.log.push('Karte: Modell fehlt'); return null; });
  const [shelfW, crt, frD, frD2, frX, clock, clock2, lamp, table, radio, giraffe, shelf] = await Promise.all([GL('wardrobe'), GL('crt', 'model.glb'), GL('frame_deco'), GL('frame_deco'), GL('frame_dmg'), GL('wallclock'), GL('wallclock'), GL('floorlamp'), GL('metaltable'), GL('radio'), GL('giraffe'), GL('shelf')].map(safe));
  const [sofa, hutch, cab1, cab2, cab3, cab4, ch1, ch2, ch3, bed, crib, mirror, jacke, teddy] = await Promise.all([
    FBX('sofa', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0x8a7e72 } }), FBX('dresser', hutchSpec(0xd8cfb8)),
    lowerCab(0x8a7a64, .62), lowerCab(0xd8cfb8, .92), lowerCab(0x9a8a74, .78), lowerCab(0x7a6a58, .86),
    FBX('chair', chairSpec), FBX('chair', chairSpec), FBX('chair', chairSpec), FBX('hospbed', bedSpec(0xa8a098)),
    FBX('crib', { 'Material #2142147589': { b: '../planks_painted/b.jpg', n: '../planks_painted/n.jpg', r: '../planks_painted/orm.jpg', color: 0xcfc6b6 }, 'Material #2142147590': { b: '../hospbed/mattress_color.jpg', n: '../hospbed/mattress_nrm.jpg', color: 0xc8c0b0 }, 'Material #2142147602': { color: 0x2a2826, rough: .6 } }),
    FBX('mirror', { 'Mirror Border': { b: 'Gold_MIrror_Diffuse.png', n: 'Gold_Mirror_Normal.jpg', r: 'Gold_Mirror_Roughness.png', metal: 1, color: 0xc8b890 }, Mirror: { r: 'Mirror_Roughness.png', metal: 1, rough: .08, color: 0x9aa2aa } }),
    FBX('w_jacke', { '*': { b: 'model.jpg', rough: .95, ds: true } }), FBX('teddy_retro', { material0: { b: 'teddy-bear.jpg', color: 0xa89a88 }, material1: { b: 'teddy-bear1.jpg', color: 0xa89a88 } })].map(safe));
  // put: Größe (size/axis), Unterkante y, Mitte x, Tiefe z, Drehung ry → in Feld (col, row)
  const put = (o, col, row, x, y, z = 0, ry = 0, size = 0, axis = 'y') => { if (!o) return null; if (size) msFit(o, size, axis); const g = msGround(o); g.rotation.y = ry; g.position.set(x, y, z); cells[row * 8 + col].add(g); return g; };
  // 0 Wohnzimmer: Regal, Fernseher auf der Anrichte, Bild, Uhr – davor das Sofa (Rücken zum Fenster) und die Stehlampe
  put(shelfW, 0, 0, -1.05, 0, -.3, -PI / 2, 1.95); put(cab1, 0, 0, .45, 0, -.3); put(crt, 0, 0, .45, .62, -.25, -PI / 2, .42); /* QA 09.10.: crt-Bildschirm bei +x → zum Fenster */ put(frX, 0, 0, .45, 1.32, -.5, 0, .5, 'max'); put(clock, 0, 0, 1.3, 1.5, -.5, 0, .5, 'y');
  if (mirror) mirror.rotation.x = -PI / 2;
  put(sofa, 0, 1, -.2, 0, 0, PI, 2.0, 'x'); put(lamp, 0, 1, 1.3, 0, 0, 0, 1.62);
  // 1 Küche: Buffet, Unterschrank mit Radio, Uhr – davor Tisch und zwei Stühle
  put(hutch, 1, 0, -.95, 0, -.3, 0, 2.2); put(cab2, 1, 0, .55, 0, -.3); put(radio, 1, 0, .4, .92, -.25, 0, .24); put(clock2, 1, 0, .75, 1.55, -.5, 0, .42);
  put(table, 1, 1, 0, 0, 0, 0, .76); put(ch1, 1, 1, -.85, 0, 0, PI / 2, .92); put(ch2, 1, 1, .9, 0, .1, -PI / 2 + .25, .92);
  // 2 Schlafzimmer: Bett mit dem Kopfende an der Wand, Kommode, Bild darüber – davor ein Stuhl
  if (bed) { msFit(bed, 2.05, 'max'); bed.scale.z *= -1; } put(bed, 2, 0, -.35, 0, -.2); put(cab3, 2, 0, 1.15, 0, -.3); put(frD, 2, 0, -.35, 1.3, -.5, 0, .5, 'max');
  put(ch3, 2, 1, 1.1, 0, 0, -.6, .92);
  // 3 Kinderzimmer: Gitterbett mit Teddy, Wandbrett, Giraffe, Bild
  put(crib, 3, 0, -.65, 0, -.3, 0, .95); put(teddy, 3, 0, -.65, .5, -.2, .3, .26); put(shelf, 3, 0, .9, 1.05, -.4, 0, .9, 'x'); put(giraffe, 3, 0, 1.05, 0, -.3, -.4, .55); put(frD2, 3, 0, .4, 1.55, -.5, 0, .38, 'max');
  // 4 Flur: Spiegel über der Kommode, Jacke am Haken
  put(cab4, 4, 0, .5, 0, -.3); put(mirror, 4, 0, .5, .98, -.5, 0, .84, 'max'); put(jacke, 4, 0, -.75, .8, -.4, 0, .82);
  // 5 gedeckter Tisch (Nr. 6: „Acht Teller, acht Gläser. Alle Stühle sind zum Fenster gedreht“): Tisch, acht Gedecke, acht Stühle; diese Karte wird leicht von oben gesehen (Teller sind sonst nur Striche)
  try {
    const tbl = await GL('metaltable').catch(() => null); if (tbl) { msFit(tbl, .76, 'y'); const tg = msGround(tbl); tg.scale.set(1.7, 1, 1.25); tg.position.set(0, 0, 0); cells[8 + 5].add(tg); }
    const gedeck = async (x, z, flip) => { const pl = await bu_teil('w_teller', 'model.glb', /^Object_4$/, .24, { flach: true }), gl = await bu_teil('w_becher', 'model.glb', /./, .1);
      if (pl) { pl.position.set(x, .765, z); cells[8 + 5].add(pl); } if (gl) { gl.position.set(x + (flip ? -.2 : .2), .765, z + (flip ? -.1 : .1)); cells[8 + 5].add(gl); } };
    for (const x of [-.82, -.28, .28, .82]) { await gedeck(x, .26, false); await gedeck(x, -.26, true); }
    const chs = await Promise.all(Array.from({ length: 8 }, () => FBX('chair', chairSpec).catch(() => null)));
    [[-1.05, -.85, 0], [-.35, -.85, .08], [.35, -.85, -.06], [1.05, -.85, .1], [-.7, .85, PI + .1], [0, .85, PI - .06], [.7, .85, PI + .04], [-1.5, 0, .55]].forEach(([x, z, ry], i) => { if (chs[i]) { put(chs[i], 5, 1, x, 0, z, ry, .92); } });
    S.log.push('Karte gedeckt');
  } catch (e) { console.warn('Fassaden-Karte gedeckt', e); }
  // 6 Strichwände (Nr. 9: „An jeder Wand Striche, in Fünfergruppen. Tausende. Die letzte Gruppe hat nur drei“): Rückwand-Karte; die Seitenwände lesen dieselbe Karte (Shader)
  try {
    // 09.10.: statt 1024×800-Canvas (3 px/cm, körnig) echte Geometrie: jeder Strich ein schmaler, leicht verjüngter Streifen (Ritzspur), scharf bei jeder Nähe; gleiche Anordnung wie zuvor
    let sd = 9; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, cols = 24, rows = 17, list = [], K = 3.2 / 1024, P = [], C = [];
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) if (rnd() >= .22) list.push([q, r]);
    const strich = (x0, y0, x1, y1, w, a) => { const X0 = x0 * K - 1.6, Y0 = 2.5 - y0 * K, X1 = x1 * K - 1.6, Y1 = 2.5 - y1 * K, dx = X1 - X0, dy = Y1 - Y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2, t = .55, m = a;
      const ax = X0 + dx * .15, ay = Y0 + dy * .15, bx = X0 + dx * .85, by = Y0 + dy * .85, z = .004; // Sechseck: spitze Enden, Mitte voll breit
      P.push(X0, Y0, z, ax - nx, ay - ny, z, ax + nx, ay + ny, z,  ax - nx, ay - ny, z, bx - nx, by - ny, z, ax + nx, ay + ny, z,  ax + nx, ay + ny, z, bx - nx, by - ny, z, bx + nx, by + ny, z,  bx - nx, by - ny, z, X1, Y1, z, bx + nx, by + ny, z);
      for (let j = 0; j < 12; j++) C.push(.07, .06, .05, (j === 0 || j === 10 ? m * t : m)); };
    list.forEach(([q, r], idx) => { const gx = 22 + q * 41.5 + (rnd() - .5) * 5, gy = 70 + r * 40.5 + (rnd() - .5) * 5, isLast = idx === list.length - 1, k = isLast ? 3 : 4, al = .45 + rnd() * .45;   // die letzte Gruppe hat nur drei
      const lw = (1.8 + rnd() * 1.2) * K * 1.5; for (let i = 0; i < k; i++) strich(gx + i * 7.5 + (rnd() - .5) * 1.5, gy + (rnd() - .5) * 3, gx + i * 7.5 + (rnd() - .5) * 3, gy + 29 + (rnd() - .5) * 4, lw, al);
      if (!isLast) strich(gx - 4, gy + 24 + (rnd() - .5) * 3, gx + 33, gy + 4 + (rnd() - .5) * 3, lw, al); });
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute(P, 3)); sg.setAttribute('color', new T.Float32BufferAttribute(C, 4)); sg.computeVertexNormals(); sg.computeBoundingSphere();
    const q = new T.Mesh(sg, new T.MeshStandardMaterial({ vertexColors: true, transparent: true, roughness: .9, metalness: 0, side: T.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); q.userData.noCol = true; cells[6].add(q);
    S.log.push('Karte Strichwände');
  } catch (e) { console.warn('Fassaden-Karte Strichwände', e); }
  // 7 Keller (Nr. 8: „Unten brennt eine Kerze. Daneben ein Kinderstuhl. Er ist zur Wand gedreht“): niedriger Stuhl mit dem Rücken zum Fenster, Kerze auf dem Boden
  try {
    const kc = await FBX('chair', chairSpec).catch(() => null); if (kc) put(kc, 7, 1, -.32, 0, .05, PI + .15, .58);
    const ker = await bu_teil('candles', 'model.fbx', /^Candle_large_big_used_low$/, .2, { fbx: { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } } }).catch(() => null);
    if (ker) { ker.position.set(.15, 0, .1); cells[8 + 7].add(ker); }
  } catch (e) { console.warn('Fassaden-Karte Keller', e); }
  const cam = new T.OrthographicCamera(-1.6, 1.6, 2.5, 0, .1, 30); cam.position.set(0, 0, 10); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(true);
  const camT = new T.OrthographicCamera(-1.6, 1.6, 1.25, -1.25, .1, 30), pt = .25; camT.position.set(0, 1.25 + 10 * Math.sin(pt), 10 * Math.cos(pt)); camT.lookAt(0, 1.25, 0); camT.updateMatrixWorld(true);
  const draw = () => { const r = renderer, prev = r.getRenderTarget(), au = r.autoClear, cc = new T.Color(); r.getClearColor(cc); const ca = r.getClearAlpha();
    try { r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.autoClear = false;
      for (let i = 0; i < 16; i++) { if (!cells[i].children.length) continue; cells.forEach((g, j) => g.visible = j === i);
        rt.viewport.set((i % 8) * CW, Math.floor(i / 8) * CW, CW, CW); r.setRenderTarget(rt); r.render(sc, i === 13 ? camT : cam); } }
    finally { rt.viewport.set(0, 0, CW * 8, CW * 2); r.setRenderTarget(prev); r.autoClear = au; r.setClearColor(cc, ca); } };
  try { await Promise.race([Promise.allSettled(KTX.pending.slice()), wait(4000)]); } catch (e) {}
  draw(); S.atlasDraw = draw; S.atlasRT = rt; S.atlasT = [8, 25]; // Nachzeichnen, sobald alle Texturen da sind
  return rt.texture;
}
// Türspion: Messingrosette, Ring, gewölbte Linse; base = Schein aus dem Flur (nur bewohnte Häuser)
function fassaden_spionBau(par, x, y, z, ry, brass, base) {
  const S = fassaden_S, T = THREE;
  if (!S.spG) S.spG = { ring: new T.TorusGeometry(.0155, .0048, 8, 24), lens: new T.SphereGeometry(.0105, 16, 8, 0, PI * 2, 0, PI / 2).rotateX(PI / 2).scale(1, 1, .5), plate: new T.CylinderGeometry(.026, .026, .003, 24).rotateX(PI / 2) };
  const m = new T.MeshStandardMaterial({ color: 0x0a0c0e, roughness: .04, metalness: 0, emissive: 0xffb070, emissiveIntensity: base, envMap: S.probe.rt.texture, envMapIntensity: 1.6, name: 'fa_spion' });
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; par.add(g);
  const pl = new T.Mesh(S.spG.plate, brass); pl.position.z = .0015; g.add(pl);
  const ring = new T.Mesh(S.spG.ring, brass); ring.position.z = .004; g.add(ring);
  const lens = new T.Mesh(S.spG.lens, m); lens.position.z = .003; g.add(lens);
  g.traverse(o => { o.userData.noCol = true; o.castShadow = false; });
  return { g, m, base, t: -1 };
}
// „Am Türspion bewegt sich etwas“: Licht dahinter geht an, ein Schatten zieht vorbei, ein Auge verdeckt die Linse, kurzes Blinzeln, dann weg
function fassaden_spion(n) { const sp = fassaden_S.spione && fassaden_S.spione[n]; if (sp) sp.t = 0; }
function fassaden_spionKurve(T, base) {
  if (T < .35) return base + (1.4 - base) * T / .35;
  if (T < .6) return 1.4 * (1 - (T - .35) / .25);
  if (T < 1.7) return T > 1.15 && T < 1.24 ? .55 : .02;
  if (T < 2.1) return 1.4 * (T - 1.7) / .4;
  if (T < 3.4) return 1.4 + (base - 1.4) * (T - 2.1) / 1.3;
  return -1;
}
// Nr. 4 innen (Oma Erna): Zettel E-14 „Spion der Haustür“ – der Spion sitzt in der Haustür (Raumtür von kirchberg_raum, Scan-Tür 1)
function fassaden_spionNr4() {
  const S = fassaden_S; if (S.spionNr4 || (S.nr4Try || 0) > 30 || typeof nr4_S === 'undefined' || !nr4_S.R || typeof NR4 === 'undefined') return;
  S.nr4Try = (S.nr4Try || 0) + 1;
  const R = nr4_S.R, tx = NR4.x - 3; R.g.updateMatrixWorld(true);
  const rc = new THREE.Raycaster(new THREE.Vector3(tx, 1.56, R.z1 - 1.2), new THREE.Vector3(0, 0, 1), 0, 1.6);
  const hit = rc.intersectObject(R.g, true).find(h => h.object.isMesh && h.object.visible && !(h.object.material && h.object.material.transparent));
  if (!hit) return;
  S.spionNr4 = fassaden_spionBau(scene, tx, 1.56, hit.point.z - .001, PI, S.brass, .12); S.spionNr4.m.emissive.set(0x9fb2e6); // draußen: Mond/Laterne, kalt
  S.log.push('Türspion Nr. 4 innen gesetzt (' + hit.point.z.toFixed(2) + ')');
}
// Nr. 1, Kinderzimmer: Fenster in der Seitenwand (x −55,8) – wie innen_ort.js winIn: Scan-Rahmen, dahinter Nacht (blitzt bei Gewitter), Gardine
async function fassaden_innenKZ() {
  const T = THREE, S = fassaden_S, x = -55.8, zc = -18.5, yc = 1.85, sy = .72, H = 2.031 * sy;
  const g = new T.Group(); g.name = 'fa_innenKZ'; scene.add(g); S.innenKZ = g;
  const night = new T.MeshStandardMaterial({ color: 0x030507, roughness: .32, metalness: 0, emissive: 0x0a1018, emissiveIntensity: .8 }); S.nightIn = night;
  const gl = new T.Mesh(new T.PlaneGeometry(1.04, H - .12), night); gl.position.set(x + .004, yc, zc); gl.rotation.y = PI / 2; g.add(gl);
  const place = (o, minX, cy, top) => { g.add(o); o.updateMatrixWorld(true); const b = new T.Box3().setFromObject(o); o.position.x += minX - b.min.x; o.position.z += zc - (b.min.z + b.max.z) / 2; o.position.y += top !== undefined ? top - b.max.y : cy - (b.min.y + b.max.y) / 2; };
  const f = (await msModel('window')).clone(true); f.scale.set(.92, sy, 1); f.rotation.y = PI / 2; place(f, x + .003, yc);
  const c = await msFBX('curtain_sheer', 'model.fbx', { '*': { b: 'DefaultMaterial_Base_color.png', n: 'DefaultMaterial_Normal_DirectX.jpg', r: 'DefaultMaterial_Roughness.png', a: 'DefaultMaterial_Opacity.png', ds: 1, transparent: true, alphaTest: .02, flipN: true, color: 0xa8a296 } });
  c.scale.set(.0153, .0142 * (H + .25) / 1.55, .012); c.rotation.y = PI / 2; c.traverse(m => { if (m.isMesh) { m.material.depthWrite = false; m.castShadow = false; } }); place(c, x + .115, 0, yc + H / 2 + .13);
  // Nachtlicht „seit 2009“ unter dem Fenster: kleine Leuchte (derselbe Fab-Scan wie die Schreibtischlampe in Zimmer 7), Schirm leuchtet kaltblau.
  // Kein neues Licht: der Schein kommt über LICHT_HAKEN (Hemisphäre, nur solange man im Kinderzimmer steht).
  try { const L = msGround(msFit((await msModel('floorlamp')).clone(true), .34, 'y')); L.position.set(-55.5, .43, zc - .45); L.rotation.y = .4; g.add(L); L.updateMatrixWorld(true);
    const lb = new T.Box3().setFromObject(L);
    L.traverse(o => { if (!o.isMesh) return; const b = new T.Box3().setFromObject(o); if ((b.min.y + b.max.y) / 2 < lb.min.y + (lb.max.y - lb.min.y) * .55) return;
      o.material = [].concat(o.material).map(m => { const n = m.clone(); n.emissive = new T.Color(0x7f9cff); n.emissiveMap = n.map || null; n.emissiveIntensity = 1.1; return n; }); if (o.material.length === 1) o.material = o.material[0]; });
    if (typeof LICHT_HAKEN !== 'undefined') LICHT_HAKEN.push((dt, indoor) => { const P = player.pos; if (indoor && P.x > -55.9 && P.x < -50.1 && P.z > -21.9 && P.z < -17.1) hemi.intensity += .05; });
  } catch (e) { console.warn('Fassaden: Nachtlicht Nr. 1', e); }
  g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; o.userData.noCol = true; } });
  g.visible = false;
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
  U.uAmb.value = Math.min(4, Math.max(.6, hemi.intensity / .55)); // dunkle Zimmer bleiben als Zimmer lesbar – Streulicht folgt dem Ort (Nacht/Tag)
  fassaden_probeTick(dt, indoor);
  S.aT = (S.aT || 0) + dt; if (S.atlasT && S.atlasT.length && S.aT > S.atlasT[0]) { S.atlasT.shift(); try { S.atlasDraw(); } catch (e) { S.atlasT.length = 0; } }
  for (const h of S.houses) {
    const k = h.lit ? Math.max(0, h.lit.emissiveIntensity / 1.3) : 0;
    const ec = h.lit ? h.lit.emissive : null;
    if (h.room) { h.room.uniforms.uLit.value = k; if (ec) h.room.uniforms.uLitCol.value.copy(h.room.userData.col).multiply(ec); if (h.n === 7) h.room.uniforms.uAux.value = Math.max(0, tube.material.emissiveIntensity / 2.5); }
    const sp = h.spion; if (sp) { if (sp.t >= 0) { sp.t += dt; const I = fassaden_spionKurve(sp.t, sp.base * k); if (I < 0) sp.t = -1; else sp.m.emissiveIntensity = I; } else sp.m.emissiveIntensity = sp.base * k; }
    for (const m of h.curtainLit) { m.emissiveIntensity = m.userData.k * k; if (ec && h.n !== 1) m.emissive.copy(m.userData.col).multiply(ec); }
    if (h.spillMat) h.spillMat.opacity = .22 * k;
  }
  S.cullT = (S.cullT || 0) - dt;
  if (S.cullT < 0 && !S.off) { S.cullT = .3; const c = camera.position;
    for (const h of S.houses) { const on = Math.hypot(h.g.position.x - c.x, h.g.position.z - c.z) < 52; if (on !== h.detOn) { h.detOn = on; for (const m of h.detail) m.visible = on; } } }
  // Nr. 1 Kinderzimmer: Fenster von innen nur, wenn man im Haus ist; Blitze hellen die Nacht dahinter auf
  if (S.innenKZ) { const P = player.pos; S.innenKZ.visible = Math.abs(P.x + 50) < 7 && Math.abs(P.z + 17) < 6; if (S.innenKZ.visible) S.nightIn.emissiveIntensity = .8 + (skyMat.uniforms.flash ? skyMat.uniforms.flash.value : 0) * 9; }
  S.nr4T = (S.nr4T ?? 3) - dt; if (S.nr4T < 0) { S.nr4T = 2; if (!S.spionNr4) fassaden_spionNr4(); }
  if (indoor) return;
  // Gestalten: verschwinden, wenn man sie zu lange anleuchtet – und stehen irgendwann wieder da
  const P = player.pos, cam = camera.position, fwd = U.uFlashDir.value;
  for (const F of S.figs) {
    const wp = F.win.g.localToWorld(new THREE.Vector3(F.win.x, F.win.y, F.win.z)), d = wp.distanceTo(cam);
    const look = fwd.dot(wp.clone().sub(cam).normalize()) > .93 && d < 16 && U.uFlash.value > .5;
    if (F.target > .5 && look) { F.seen += dt; if (F.seen > 1.6) { F.target = 0; F.gone = rand(40, 80); Audio.whisper(wp.x, 1.7, wp.z, 1.4); } } else F.seen = Math.max(0, F.seen - dt * .5);
    if (F.target < .5) { F.gone -= dt; if (F.gone < 0 && (d > 22 || fwd.dot(wp.clone().sub(cam).normalize()) < .2)) F.target = 1; }
    F.vis += (F.target - F.vis) * Math.min(1, dt * (F.target > F.vis ? .6 : 2.2));
    // 10.10.: statt der flachen Schatten-Maske im Scheinzimmer ein echter 3D-Körper hinter dem Glas (fensterfigur.js); die Maske bleibt nur als Rückfall, falls die Figur nicht ladbar ist
    if (typeof ff_neu === 'function' && !F.ff3 && !F.ffFail && d < 26 && F.win.pw) {
      const W = F.win, nx = Math.sin(W.ry), nz = Math.cos(W.ry), id = ({ 3: 'gezaehlt_m', 5: 'mama', 7: 'hilde', 8: 'gezaehlt_j' })[F.n] || ['hilde', 'aydin', 'mama'][F.slot % 3];
      F.ff3 = ff_neu(W.g, W.x + nx * .058, W.y, W.z + nz * .058, W.ry, W.pw, W.ph, id, { warm: !!W.lit, tief: id === 'gezaehlt_j' ? .45 : .55 }); if (!F.ff3) F.ffFail = true; else F.hd.detail.push(F.ff3.quad); }
    if (F.ff3 && F.ff3.fail) { F.ffFail = true; F.ff3.ziel = 0; F.ff3 = null; }
    if (F.ff3) F.ff3.ziel = F.vis;
    const u = F.hd.room && F.hd.room.uniforms.uFigVis.value; if (u) u.setComponent(F.slot, F.ff3 ? 0 : F.vis);
  }
  // Zuckender Vorhang
  const T = S.twitch; if (T) { T.cool -= dt;
    const wp = new THREE.Vector3().setFromMatrixPosition(T.base).applyMatrix4(T.im.parent.matrixWorld), d = Math.hypot(wp.x - P.x, wp.z - P.z);
    if (T.t < 0 && T.cool < 0 && d < 7 && d > 2.5) { T.t = 0; T.cool = 70; }
    if (T.t >= 0) { T.t += dt; const e = T.t < .35 ? T.t / .35 : Math.max(0, 1 - (T.t - .9) / 1.4); const mm = T.base.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(.18 * e, 0, 0), new THREE.Quaternion(), new THREE.Vector3(1 - .55 * e, 1, 1))); T.im.setMatrixAt(T.i, mm); T.im.instanceMatrix.needsUpdate = true; if (T.t > 2.4) { T.t = -1; T.im.setMatrixAt(T.i, T.base); T.im.instanceMatrix.needsUpdate = true; } } }
  fassaden_tropfen(dt, P, indoor);
  // Tropfen aus den Fallrohren
  S.dripT -= dt; if (S.dripT < 0) { S.dripT = rand(.7, 2.2); for (const p of S.pipes) { const wp = p.g.localToWorld(p.p.clone()); if (Math.hypot(wp.x - P.x, wp.z - P.z) < 5) { Audio.drip(wp.x, .15, wp.z); break; } } }
}

// Überlaufende Dachrinnen: Tropfen fallen von der Traufe in den Regen (nur die drei nächsten Häuser im Umkreis von 16 m; alles beim ersten Aufruf angelegt, keine Allokation im Takt)
function fassaden_tropfen(dt, P, indoor) {
  const S = fassaden_S; let D = S.drops;
  if (!D) { const N = 36, pos = new Float32Array(N * 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xa8b6c8, transparent: true, opacity: .42, depthWrite: false })); m.frustumCulled = false; scene.add(m);
    D = S.drops = { m, pos, N, y: new Float32Array(N).fill(-1), v: new Float32Array(N), x: new Float32Array(N), z: new Float32Array(N), src: [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], ns: 0, sT: 0, spT: new Float32Array(3), tmp: new THREE.Vector3() };
    for (let i = 0; i < N; i++) pos[i * 6 + 1] = pos[i * 6 + 4] = -50; }
  D.m.visible = !indoor; if (indoor) return;
  D.sT -= dt; if (D.sT < 0) { D.sT = 1; D.ns = 0; let best = [1e9, 1e9, 1e9];
    for (const p of S.pipes) { const gp = p.g.position, d2 = (gp.x - P.x) ** 2 + (gp.z - P.z) ** 2; if (d2 > 900) continue; D.tmp.copy(p.gu); p.g.localToWorld(D.tmp); const dd = (D.tmp.x - P.x) ** 2 + (D.tmp.z - P.z) ** 2; if (dd > 256) continue;
      for (let k = 0; k < 3; k++) if (dd < best[k]) { for (let j = 2; j > k; j--) { best[j] = best[j - 1]; D.src[j].copy(D.src[j - 1]); } best[k] = dd; D.src[k].copy(D.tmp); break; } }
    for (let k = 0; k < 3; k++) if (best[k] < 1e9) D.ns = k + 1; }
  for (let k = 0; k < D.ns; k++) { D.spT[k] -= dt; if (D.spT[k] < 0) { D.spT[k] = rand(.18, .7) * (k + 1); // unregelmäßig wie echtes Tropfen
      for (let i = 0; i < D.N; i++) if (D.y[i] < 0) { const s = D.src[k]; D.x[i] = s.x + rand(-.05, .05); D.z[i] = s.z + rand(-.05, .05); D.y[i] = s.y; D.v[i] = rand(0, .6); break; } } }
  const pos = D.pos; for (let i = 0; i < D.N; i++) { if (D.y[i] < 0) continue; D.v[i] += 9.8 * dt; D.y[i] -= D.v[i] * dt;
    const o = i * 6; if (D.y[i] <= .02) { D.y[i] = -1; pos[o + 1] = pos[o + 4] = -50; continue; }
    const L = Math.min(.22, .02 + D.v[i] * .03); pos[o] = pos[o + 3] = D.x[i]; pos[o + 2] = pos[o + 5] = D.z[i]; pos[o + 1] = D.y[i]; pos[o + 4] = D.y[i] + L; }
  D.m.geometry.attributes.position.needsUpdate = true;
}
