// =====================================================================  REGEN (Modul „regen“, R-24): Dauerregen nach Alan Wake 2 / RDR2 / TLOU2 / RE Village – und billig, weil er immer da ist
// Ersetzt den CPU-Nieselregen der Basis (rain: 2600 Linien, jedes Bild 2600 Lagen auf der CPU gerechnet und hochgeladen). rain.m ist jetzt das neue Netz
// (gleiche Schalter für die anderen Module: visible, material.opacity = Schauer aus leben.js, scale ≈ 0 im Traum).
// · Schlieren: 10 000 Tropfen in zwei Tiefenschichten – nah (24 × 24 × 12 m) einzeln, fern (72 × 72 × 20 m) als Schleier – in EINEM Zeichenaufruf.
//   Lage nur aus der Zeit im Shader: Fallgeschwindigkeit je Tropfengröße 4,2–7,5 m/s, seitlich der Luftweg des Windes (WIND.fx/fz, derselbe wie Laub und
//   Sprühregen in umwelt.js), leichte Verwirbelung, um die Kamera gefaltet. Keine CPU-Arbeit je Tropfen, keine Allokation.
//   Bewegungsunschärfe: Schlierenlänge = Relativgeschwindigkeit (Tropfen − Kamera) × Belichtung → wer rennt, dem schlägt der Regen schräg entgegen;
//   Breite nie unter ~1 Pixel, die Helligkeit wird dafür verdünnt (ferne Tropfen werden zum Schleier statt zu flimmern).
//   Sichtbar nur im Licht: Laternen (Vorwärtsstreuung – im Gegenlicht hell), Taschenlampenkegel (Rückstreuung), sonst nur ein Hauch Mond.
// · Verdeckung: Höhenkarte von oben, 64 × 64 Zellen à 0,5 m um Luke (ringförmig adressiert, Float-Textur), gefüllt per BVH-Strahl auf die
//   sichtbaren festen Körper (SOL der Basis) – nahe Zellen zuerst, höchstens 0,2 ms je Bild. Unter Dach, Vordach, Wartehäuschen, Auto, Laternenkopf
//   kein Regen; unter Baumkronen nur durchfallende Tropfen (in Böen mehr). Die Karte kennt auch die Oberfläche (Asphalt, Pfütze, Blech, Holz, Laub …).
// · Aufschläge: 1400 Kronen + Ringe auf der Oberfläche der Karte im 18-m-Feld um Luke (Pfütze: großer Ring, Blech: hohe Krone, Gras/Laub: fast nichts),
//   zweiter Zeichenaufruf. Die Regenringe IN den Pfützen bleiben die von gruen.js; die Tropfen der Dachrinnen die von fassaden.js (hier nur ans Licht gekoppelt).
// · Ton: Regenschichten je Oberfläche um den Hörer aus Sonniss-Aufnahmen – Asphalt, Laub, tropfende Stadt (Pfützen/Blech/Holz), Dach über dir,
//   Traufe, Fallrohr, drinnen gedämpft. Pegel und Richtung (Stereo) aus derselben Karte, lauter in Böen und Schauern. Das Modul übernimmt diese Betten
//   von klang.js (regen_bett), sie laufen über denselben Bettbus (Sprache duckt, Regie-Stille) – nichts doppelt.
// · Kamera: nur wer nach oben in den offenen Regen sieht, bekommt vereinzelt Tropfen an den Bildrand (DOM mit backdrop-filter, kein Render-Durchgang).
// Testzugriff: window.__regen (stats, ab(alt) = alter CPU-Regen zum Vergleich).
const RG = { N: 64, C: .5, budget: .2, map: null, tex: null, spiral: null, pcx: 1e9, pcz: 1e9, cur: 0, solN: -1, dirty: 0, upT: 0, trees: null, treeN: -1, mats: new Map(),
  U: null, m: null, sp: null, alt: null, altN: 0, frame: 0, drawnF: -9, t: 0, prev: new THREE.Vector3(1e9, 0, 0), camV: new THREE.Vector3(), aktiv: false, schauer: 0, traum: false,
  ms: 0, cells: 0, cellMs: 0, hitFace: null, gy: 0, v: new THREE.Vector3(), v2: new THREE.Vector2(), resT: 0, pipes: null, pipeT: 0,
  snd: { on: false, L: null, T: 0, ziel: {}, pan: {}, e: null }, lens: null, lensT: 1, vis: 0 };
const _rgR = new THREE.Ray(), _rgV = new THREE.Vector3();
// ---------------------------------------------------------------- Shader
const RG_GLSL = `uniform float uT, uExp, uWK, uGust, uInt, uGain, uFogD, uAmb; uniform vec3 uCam, uCamV, flP, flD; uniform vec2 flK, uRes; uniform vec4 uWind, uMapP, uRect, lamps[10];
uniform sampler2D uMap;
float rh(float n){ return fract(sin(n) * 43758.5453123); }
// Karte: x = Oberfläche (hier landet der Regen), y = Boden darunter, z = Art (0 offen, 1 Dach, 2 dichte Krone, 3 lichte Krone), w = Belag; ungültig → offen
vec4 rgKarte(vec2 p){ vec2 c = floor(p / uMapP.x); if (uMapP.w < .5) return vec4(-999., -999., 0., 0.);
  vec4 m = texelFetch(uMap, ivec2(mod(c, uMapP.y)), 0); float cz = floor(m.b / 64.);
  if (m.a != c.x || cz != c.y) return vec4(-999., -999., 0., 0.);
  float q = m.b - cz * 64., ty = floor(q / 4.); return vec4(m.r, m.g, q - ty * 4., ty); }
// Licht am Tropfen (vd: Richtung Tropfen → Auge): Laternen strahlen nach unten, im Gegenlicht leuchten Tropfen auf (Vorwärtsstreuung);
// die Taschenlampe kommt von hinten (Rückstreuung, Tropfen glitzern im Kegel); sonst nur ein Hauch kaltes Mondlicht
vec3 rgLicht(vec3 w, vec3 vd){ vec3 q = w - flP; float l = length(q), c = dot(q / max(l, 1e-3), flD);
  vec3 col = vec3(1., .93, .82) * flK.x * smoothstep(flK.y, mix(flK.y, 1., .55), c) * 3.4 / (1. + l * l * .12);
  for (int i = 0; i < 10; i++){ vec4 L = lamps[i]; if (L.w < .02) continue; vec3 e = w - vec3(L.x, 4.9, L.z); float d2 = dot(e, e), il = inversesqrt(d2 + 1e-4);
    float down = smoothstep(.15, .75, -e.y * il), fw = max(dot(e * il, vd), 0.);
    col += vec3(1., .62, .28) * L.w * (down * (.45 + 6. * pow(fw, 14.) + 1.1 * fw * fw) + .05) * 2.4 / (1. + d2 * .22); }
  return col + vec3(.5, .6, .75) * uAmb * .7; }
void rgWeg(){ gl_Position = vec4(0., 0., -2., 1.); }
`;
const RG_VS = RG_GLSL + `attribute vec4 aS; varying vec3 vCol; varying vec2 vQ;
void main(){
  vCol = vec3(0.); vQ = vec2(0.);
  float lay = floor(aS.w), r = fract(aS.w), nah = 1. - lay;
  float B = mix(72., 24., nah), H = mix(20., 12., nah);
  // Fallgeschwindigkeit: ganzzahlige Umläufe je 600 s (uT läuft modulo 600 ohne Sprung)
  float n = floor(mix(mix(126., 210., nah), mix(225., 375., nah), rh(r * 91.7 + 3.1))), v = H * n / 600., s = (v - 4.2) / 3.3;
  float y = uCam.y - mix(6., 3.5, nah) + mod(aS.y * H - v * uT, H), zyk = floor(aS.y - v * uT / H);
  float w1 = 6.2831853 * floor(mix(90., 360., rh(r * 13.1 + 7.))) / 600., w2 = 6.2831853 * floor(mix(70., 300., rh(r * 5.9 + 1.))) / 600.;
  float p1 = w1 * uT + r * 40., p2 = w2 * uT + r * 23., amp = (.03 + .12 * uWK) * (.5 + rh(r * 5.3));
  vec2 tur = vec2(sin(p1), cos(p2)) * amp, tv = vec2(cos(p1) * w1, -sin(p2) * w2) * amp;
  vec2 xz = aS.xz * B + uWind.zw + tur; xz = uCam.xz + mod(xz - uCam.xz + B * .5, B) - B * .5;
  vec3 P = vec3(xz.x, y, xz.y); vec2 dc = P.xz - uCam.xz;
  if (nah < .5 && max(abs(dc.x), abs(dc.y)) < 11.) { rgWeg(); return; }
  if (P.x > uRect.x && P.x < uRect.y && P.z > uRect.z && P.z < uRect.w) { rgWeg(); return; }
  vec4 K = rgKarte(P.xz); float top = K.x < -900. ? uMapP.z : K.x, flo = K.y < -900. ? uMapP.z : K.y, tr = 1.;
  if (P.y < top) { float pass = K.z > 2.5 ? .5 : K.z > 1.5 ? .18 : 0.; pass = min(1., pass + uGust * .3 * step(1.5, K.z));
    if (rh(r * 71.3 + zyk * 1.13) > pass || P.y < flo) { rgWeg(); return; } tr = 1.5; }
  vec3 Vr = vec3(uWind.x + tv.x, -v, uWind.y + tv.y) - uCamV;
  vec4 c0 = projectionMatrix * viewMatrix * vec4(P, 1.), c1 = projectionMatrix * viewMatrix * vec4(P - Vr * uExp, 1.);
  if (c0.w < .3 || c1.w < .3) { rgWeg(); return; }
  vec2 h = uRes * .5, d = (c1.xy / c1.w - c0.xy / c0.w) * h; float len = length(d);
  vec2 dir = len > .01 ? d / len : vec2(0., 1.), nr = vec2(-dir.y, dir.x);
  float wT = mix(.0011, .003, s) * 2.2 * h.y * projectionMatrix[1][1] / c0.w, wP = max(wT, mix(1.7, 1.15, nah)), cov = wT / wP, lk = (wP + 1.) / (len + wP + 1.);
  float dist = c0.w, a = uInt * uGain * cov * mix(.35, 1., lk) * exp(-pow(uFogD * dist, 2.)) * tr * smoothstep(.5, 1.4, dist) * mix(.5, 1., nah);
  vCol = rgLicht(P, normalize(uCam - P)) * a;
  if (max(vCol.r, max(vCol.g, vCol.b)) < .0015) { rgWeg(); return; }
  vec4 c = mix(c0, c1, position.y); c.xy += (nr * position.x + dir * (position.y * 2. - 1.)) * wP * .5 / h * c.w;
  gl_Position = c; vQ = position.xy; }`;
const RG_FS = `varying vec3 vCol; varying vec2 vQ;
void main(){ float a = exp(-vQ.x * vQ.x * 2.5) * (.55 + .45 * smoothstep(1., .25, vQ.y)); gl_FragColor = vec4(vCol * a, 1.); }`;
// Aufschläge: je Instanz eine Krone (aufrecht zur Kamera) und ein Ring (flach), Lage je Zyklus neu gewürfelt, fest in der Welt
const RG_SVS = RG_GLSL + `uniform float uGainS; attribute vec4 aS; varying vec3 vCol, vQ; varying float vA, vS;
void main(){
  vCol = vec3(0.); vQ = vec3(0.); vA = 0.; vS = 0.;
  float per = mix(.32, .7, aS.w), cyc = uT / per + aS.z * 17.3, id = floor(cyc), ph = fract(cyc);
  if (ph > .42) { rgWeg(); return; } float a = ph / .42;
  if (rh(id * 5.71 + aS.x * 3.3) > uInt * .8 + .1) { rgWeg(); return; }
  vec2 hp = vec2(rh(id * 1.37 + aS.x * 91.3), rh(id * 2.71 + aS.y * 57.1)) * 18.;
  vec2 xz = uCam.xz + mod(hp - uCam.xz + 9., 18.) - 9.; float r0 = length(xz - uCam.xz);
  if (r0 < .45 || r0 > 9. || (xz.x > uRect.x && xz.x < uRect.y && xz.y > uRect.z && xz.y < uRect.w)) { rgWeg(); return; }
  vec4 K = rgKarte(xz); float top = K.x < -900. ? uMapP.z : K.x, ty = K.w;
  if (K.z > 1.5) { if (rh(id * 3.1 + aS.y) > .25 + uGust * .3) { rgWeg(); return; } top = K.y < -900. ? uMapP.z : K.y; ty = 2.; }
  float cH = .035, rR = .06, rK = .18, cK = 1.;
  if (ty == 1. || ty == 2.) { if (rh(id * 7.7 + aS.z) > .3) { rgWeg(); return; } cH = .013; rK = 0.; cK = .45; }
  else if (ty == 3. || ty == 9.) { cH = .028; rR = .15; rK = 1.1; cK = .7; }
  else if (ty == 5.) { cH = .055; rR = .035; rK = .1; cK = 1.4; }
  else if (ty == 4.) { cH = .02; rK = .05; }
  else if (ty == 6.) { cH = .028; rK = .12; }
  vec3 P = vec3(xz.x, top + .006, xz.y), W; float q = position.z;
  if (q < .5) { vec3 tc = uCam - P; vec2 sd = normalize(vec2(-tc.z, tc.x) + 1e-5); W = P + vec3(sd.x, 0., sd.y) * position.x * cH * 1.6 + vec3(0., position.y * cH * 2.2, 0.); }
  else { if (rK < .01) { rgWeg(); return; } W = P + vec3(position.x, 0., position.y) * rR; }
  float dist = distance(uCam, P), k = uGainS * uInt * exp(-pow(uFogD * dist, 2.)) * smoothstep(9., 4.5, dist) * (q < .5 ? cK : rK);
  vCol = rgLicht(P + vec3(0., .04, 0.), normalize(uCam - P)) * k;
  if (max(vCol.r, max(vCol.g, vCol.b)) < .0015) { rgWeg(); return; }
  vQ = position; vA = a; vS = id * .131 + aS.x * 7.;
  gl_Position = projectionMatrix * viewMatrix * vec4(W, 1.); }`;
const RG_SFS = `varying vec3 vCol, vQ; varying float vA, vS;
float rh(float n){ return fract(sin(n) * 43758.5453123); }
void main(){ float m = 0.;
  if (vQ.z < .5) {
    // Krone: fünf Tröpfchen auf Wurfparabeln, am Anfang eine kurze Säule
    for (int j = 0; j < 5; j++){ float f = float(j), sx = (f - 2.) * .4 + (rh(vS + f) - .5) * .3, up = .7 + rh(vS * 3. + f) * .5;
      vec2 c = vec2(sx * vA, max(0., up * vA * 2. - 2.3 * vA * vA)), e = (vQ.xy - c) * vec2(1., 1.5); m += exp(-dot(e, e) * 160.); }
    m += exp(-vQ.x * vQ.x * 70.) * smoothstep(0., .12, vA) * (1. - smoothstep(.08, .4, vA)) * smoothstep(.85, 0., vQ.y) * .8;
    m *= 1. - vA; }
  else { float r = length(vQ.xy), rr = vA * .95; m = exp(-pow((r - rr) / (.035 + .08 * vA), 2.)) * pow(1. - vA, 2.5) * step(r, 1.); }
  gl_FragColor = vec4(vCol * m, 1.); }`;
function regen_bau() {
  const L = typeof umwelt_lichtU === 'function' ? umwelt_lichtU() : { flP: fogUniforms.flP, flD: fogUniforms.flD, flK: fogUniforms.flK, lamps: fogUniforms.lamps, uAmb: { value: .04 } };
  const N = RG.N; RG.map = new Float32Array(N * N * 4).fill(NaN);
  const tex = RG.tex = new THREE.DataTexture(RG.map, N, N, THREE.RGBAFormat, THREE.FloatType); tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  const U = RG.U = Object.assign(L, { uT: { value: 0 }, uExp: { value: .042 }, uWK: { value: .3 }, uGust: { value: 0 }, uInt: { value: 1 }, uGain: { value: 1 }, uGainS: { value: .8 }, uFogD: { value: .034 },
    uCam: { value: new THREE.Vector3() }, uCamV: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2(1600, 900) }, uWind: { value: new THREE.Vector4() },
    uMapP: { value: new THREE.Vector4(RG.C, N, 0, 1) }, uRect: { value: new THREE.Vector4(1, 0, 1, 0) }, uMap: { value: tex } });
  // Spirale: Zellversätze nach Abstand (nahe Zellen zuerst)
  const a = []; for (let i = -N / 2; i < N / 2; i++) for (let j = -N / 2; j < N / 2; j++) a.push([i, j, i * i + j * j]); a.sort((p, q) => p[2] - q[2]);
  RG.spiral = new Int16Array(a.length * 2); a.forEach((p, k) => { RG.spiral[k * 2] = p[0]; RG.spiral[k * 2 + 1] = p[1]; });
  // Schlieren: 4800 nah + 5200 fern, ein Quad je Tropfen (instanziert)
  const NN = 4800, NF = 5200, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]), 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
  const s = new Float32Array((NN + NF) * 4); for (let i = 0; i < NN + NF; i++) { s[i * 4] = Math.random(); s[i * 4 + 1] = Math.random(); s[i * 4 + 2] = Math.random(); s[i * 4 + 3] = (i < NN ? 0 : 1) + Math.random() * .999; }
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(s, 4)); g.instanceCount = NN + NF;
  const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: RG_VS, fragmentShader: RG_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }); // Quads im Bildraum: Umlaufsinn je nach Schlierenrichtung
  mat.opacity = .12; // leben.js schreibt hier den Schauer hinein (.12 + .09 × Stärke)
  const m = RG.m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 8; m.name = 'regen'; m.userData.noCol = true; m.onBeforeRender = () => { RG.drawnF = RG.frame; };
  // Aufschläge: 1400 Instanzen, je Krone + Ring
  const NS = 1400, gs = new THREE.InstancedBufferGeometry();
  gs.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0, -1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1]), 3)); gs.setIndex([0, 1, 2, 2, 1, 3, 4, 5, 6, 6, 5, 7]);
  const ss = new Float32Array(NS * 4); for (let i = 0; i < ss.length; i++) ss[i] = Math.random(); gs.setAttribute('aS', new THREE.InstancedBufferAttribute(ss, 4)); gs.instanceCount = NS;
  const ms = RG.sp = new THREE.Mesh(gs, new THREE.ShaderMaterial({ uniforms: U, vertexShader: RG_SVS, fragmentShader: RG_SFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  ms.frustumCulled = false; ms.renderOrder = 8; ms.name = 'regen_aufschlag'; ms.userData.noCol = true; m.add(ms);
  // alten CPU-Regen der Basis ablösen (bleibt für den Vergleich erhalten)
  RG.alt = rain.m; RG.altN = rain.N; scene.remove(rain.m); scene.add(m); rain.m = m; rain.N = 0;
}
// ---------------------------------------------------------------- Höhenkarte von oben (Verdeckung, Oberfläche, Belag)
// Belag: 0 hart (Asphalt/Platten) · 1 Gras/Erde · 2 Laub · 3 Pfütze · 4 Kies · 5 Blech/Metall · 6 Holz · 7 Stein/Dach · 8 Glas/Kunststoff · 9 Wasser
const RG_BODEN = { wet: 0, hard: 0, tile: 0, carpet: 0, grass: 1, leaves: 2, gravel: 4, metal: 5, wood: 6, water: 9 };
function regen_art(it, face) { const o = it.o; let m = o.material; if (Array.isArray(m)) m = m[(face && face.materialIndex) || 0] || m[0];
  let t = RG.mats.get(m); if (t !== undefined) return t;
  const s = ((m && m.name) || '') + ' ' + ((m && m.map && m.map.name) || '') + ' ' + (o.name || '') + ' ' + ((o.parent && o.parent.name) || '');
  t = /glas|window|fenster|scheibe|plexi/i.test(s) ? 8 : /wood|plank|holz|bench|bank|board|timber|deck|crate|kiste|palette/i.test(s) ? 6
    : /metal|rust|iron|steel|blech|corr|zinc|chrom|alu|car|auto|vehic|truck|van|tonne|bin|lamp|pole|sign|schild|container|busstop/i.test(s) || (m && m.metalness > .45) ? 5
    : /leaf|leaves|foliage|hedge|ivy|bush|laub|hecke|tree|baum|bark|rinde|trunk|branch|stamm|twig/i.test(s) ? 2 : 7;
  RG.mats.set(m, t); return t; }
function regen_strahl(it, x, y, z) { _rgR.origin.set(x, y, z).applyMatrix4(it.inv); _rgR.direction.set(0, -1, 0).transformDirection(it.inv);
  const h = it.o.geometry.boundsTree.raycastFirst(_rgR, THREE.DoubleSide); if (!h) return -999; RG.hitFace = h.face; return _rgV.copy(h.point).applyMatrix4(it.mw).y; }
// Baumkronen (Ortsbäume, Laubwald, tote Bäume): Raster 6 m, einmal angelegt (neu, wenn sich die Listen ändern)
function regen_baeume() {
  const T = new Map(), add = (x, z, r, top, dicht) => { const k = (Math.floor(x / 6) + 2048) * 4096 + Math.floor(z / 6) + 2048; let L = T.get(k); if (!L) T.set(k, L = []); L.push(x, z, r, top, dicht); };
  let n = 0;
  if (typeof treeSpots !== 'undefined') for (const [x, z, s] of treeSpots) { const k = Math.min(1.4, Math.max(.7, s || 1)); add(x, z, 2.7 * k, 7 * k, 0); n++; }
  if (typeof WL !== 'undefined' && WL.treePts) for (const [x, z] of WL.treePts) { add(x, z, 3.2, 8.5, 1); n++; }
  if (typeof leben_S !== 'undefined' && leben_S.treePts) for (const [x, z, h, s] of leben_S.treePts) { add(x, z, Math.min(3, 1.6 * (s || 1)), h || 6, 0); n++; }
  RG.trees = T; RG.treeN = n; }
function regen_krone(x, z) { let top = -1, dicht = 0; const ix = Math.floor(x / 6) + 2048, iz = Math.floor(z / 6) + 2048;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = RG.trees.get((ix + a) * 4096 + iz + b); if (!L) continue;
    for (let i = 0; i < L.length; i += 5) { const dx = x - L[i], dz = z - L[i + 1], d = Math.sqrt(dx * dx + dz * dz), w = Math.sin(Math.atan2(dz, dx) * 3 + L[i] * 1.7) * .12 + Math.sin(Math.atan2(dz, dx) * 5 + L[i + 1]) * .08;
      const r = L[i + 2] * (1 + w); if (d > r) continue; if (L[i + 3] > top) top = L[i + 3]; if (L[i + 4] && d < r * .8) dicht = 1; } }
  return top < 0 ? 0 : (RG.kTop = top, dicht ? 2 : 3); }
function regen_pfuetze(x, z) { const L = typeof gruen_S !== 'undefined' && gruen_S.pudList; if (!L) return false;
  for (const p of L) { const dx = x - p[0], dz = z - p[2], hr = Math.max(p[4], p[5]) * .5; if (dx * dx + dz * dz > hr * hr) continue;
    const c = Math.cos(p[3]), s = Math.sin(p[3]), u = (dx * c - dz * s) / (p[4] * .5), v = (dx * s + dz * c) / (p[5] * .5); if (u * u + v * v < .75) return true; }
  return false; }
function regen_zelle(cx, cz, i) {
  const C = RG.C, x = (cx + .5) * C, z = (cz + .5) * C, M = RG.map; let top = -999, flo = -999, kind = 0, type = -1;
  if (typeof solidNear === 'function') { const L = solidNear(x, z);
    for (let j = 0; j < L.length; j++) { const it = L[j], bb = it.bb; if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z || bb.max.y <= top || it.soft || !it.o.geometry.boundsTree || !solidLive(it)) continue;
      const y = regen_strahl(it, x, bb.max.y + .2, z); if (y > top) { top = y; type = regen_art(it, RG.hitFace); } } }
  const g0 = RG.gy;
  if (top > g0 + 1.2) kind = type === 2 ? 3 : 1; // Dach, Vordach, Auto, Laternenkopf: darunter fällt nichts (Äste eines Baums: lichte Krone)
  else { // am Boden: Belag des Bodens (Bordstein, Platten zählen als Boden), Pfützen; Baumkrone darüber?
    if (type !== 5 && type !== 6 && type !== 8) type = RG_BODEN[typeof klang_floor === 'function' ? klang_floor(x, z) : 'wet'] ?? 0;
    if (regen_pfuetze(x, z)) type = 3;
    const k = RG.trees ? regen_krone(x, z) : 0; if (k) { flo = top; top = RG.kTop; kind = k; } }
  M[i] = top; M[i + 1] = flo; M[i + 2] = cz * 64 + Math.max(0, type) * 4 + kind; M[i + 3] = cx; }
function regen_karte() {
  const P = camera.position, C = RG.C, N = RG.N, M = RG.map, O = RG.spiral, n = O.length / 2;
  if (typeof SOL !== 'undefined' && Math.abs(SOL.items.length - RG.solN) > 20) { RG.solN = SOL.items.length; M.fill(NaN); RG.cur = 0; RG.dirty = 1; } // Körper neu angelegt/nachgeladen
  const tn = (typeof treeSpots !== 'undefined' ? treeSpots.length : 0) + (typeof WL !== 'undefined' && WL.treePts ? WL.treePts.length : 0) + (typeof leben_S !== 'undefined' && leben_S.treePts ? leben_S.treePts.length : 0);
  if (tn !== RG.treeN) { regen_baeume(); RG.treeN = tn; M.fill(NaN); RG.cur = 0; }
  const pcx = Math.floor(P.x / C), pcz = Math.floor(P.z / C); if (pcx !== RG.pcx || pcz !== RG.pcz) { RG.pcx = pcx; RG.pcz = pcz; RG.cur = 0; }
  if (RG.cur >= n) return; const t0 = performance.now(); let k = RG.cur, done = 0;
  for (; k < n; k++) { const cx = pcx + O[k * 2], cz = pcz + O[k * 2 + 1], i = ((((cz % N) + N) % N) * N + (((cx % N) + N) % N)) * 4;
    if (M[i + 3] === cx && Math.floor(M[i + 2] / 64) === cz) continue;
    regen_zelle(cx, cz, i); done++;
    if ((done & 3) === 0 && performance.now() - t0 > RG.budget) { k++; break; } }
  RG.cur = k; if (done) { RG.dirty = 1; RG.cells += done; RG.cellMs = RG.cellMs * .9 + (performance.now() - t0) / done * .1; } }
function regen_lies(x, z) { const C = RG.C, N = RG.N, cx = Math.floor(x / C), cz = Math.floor(z / C), i = ((((cz % N) + N) % N) * N + (((cx % N) + N) % N)) * 4, M = RG.map;
  return M[i + 3] === cx && Math.floor(M[i + 2] / 64) === cz ? i : -1; }
// ---------------------------------------------------------------- Ton: Schichten je Oberfläche um den Hörer
const RG_SCHICHT = ['amb_regen', 'amb_wald', 'amb_regen_tropf', 'amb_regen_veranda', 'amb_dach', 'amb_rinne', 'amb_regen_innen'];
const RG_EIGEN = new Set(RG_SCHICHT);
// klang.js fragt je Bett: spielt das Regen-Modul diese Schicht selbst? (dann 0 – nichts doppelt)
function regen_bett(n) { return RG.snd.on && RG_EIGEN.has(n) ? 0 : 1; }
function regen_basis(ort, n) { const KB = ort && typeof KL_ORT_BETT !== 'undefined' && KL_ORT_BETT[ort]; if (!KB) return 0; for (const [m, v] of KB) if (m === n) return v; return 0; }
// Umgebung aus der Karte (Radius 9 m): Anteile je Belag mit Schwerpunkt (für die Stereorichtung), Dach über dem Kopf, Krone über dem Kopf, Traufe
function regen_umgebung(P, feet) {
  const e = RG.snd.e || (RG.snd.e = { w: new Float32Array(6), x: new Float32Array(6), z: new Float32Array(6), dach: 0, krone: 0, traufe: 99 }), C = RG.C, M = RG.map;
  e.w.fill(0); e.x.fill(0); e.z.fill(0); e.dach = 0; e.krone = 0; let nD = 0, dR = 99, dO = 99; const G = [0, 1, 2, 3, 0, 4, 5, 0, 4, 3]; // Belag → Gruppe: hart, weich, Laub, Pfütze, Blech/Glas, Holz
  const cx0 = Math.floor(P.x / C), cz0 = Math.floor(P.z / C), R = 18;
  for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const d2 = a * a + b * b; if (d2 > R * R) continue; const cx = cx0 + a, cz = cz0 + b, N = RG.N, i = ((((cz % N) + N) % N) * N + (((cx % N) + N) % N)) * 4;
    if (M[i + 3] !== cx || Math.floor(M[i + 2] / 64) !== cz) continue; const q = M[i + 2] - cz * 64, ty = Math.floor(q / 4), kind = q - ty * 4, d = Math.sqrt(d2) * C;
    if (d2 <= 9) { nD++; if (kind === 1 && M[i] > feet + 1.7) e.dach++; if (kind >= 2) e.krone += kind === 2 ? 1 : .5; }
    const hoch = kind === 1 && M[i] > feet + 2; if (hoch) { if (d < dR) dR = d; } else if (d < dO) dO = d;
    const w = (kind === 1 ? (M[i] > feet + 3 ? .35 : .8) : 1) / (1 + d * .45), gi = kind >= 2 ? 2 : G[ty] ?? 0, s = d > .01 ? w / d : 0;
    e.w[gi] += kind >= 2 ? w * (kind === 2 ? 1.5 : 1) : w; e.x[gi] += a * C * s; e.z[gi] += b * C * s; }
  e.dach /= Math.max(1, nD); e.krone /= Math.max(1, nD); e.traufe = e.dach > .5 ? dO : dR; return e; }
function regen_klang(dt, indoor) {
  const A = Audio, KS = typeof klang_S !== 'undefined' ? klang_S : null; if (!A.ctx || !KS || !KS.bedBus || !state.started) return;
  const S = RG.snd; if (!S.L) { S.L = {}; for (const n of RG_SCHICHT) { const p = A.ctx.createStereoPanner(); p.connect(KS.bedBus); S.L[n] = { h: null, p, v: 0, idle: 0 }; } S.on = true; }
  S.T -= dt; if (S.T > 0) return; S.T = .25;
  const ort = typeof klang_bettOrt === 'function' ? klang_bettOrt() : null, Z = S.ziel, PN = S.pan, P = camera.position, feet = player.pos.y;
  for (const n of RG_SCHICHT) { Z[n] = 0; PN[n] = 0; }
  const I = (RG.aktiv ? 1 : RG.traum ? .2 : 0) * (1 + .6 * RG.schauer) * (1 + .35 * (typeof gust !== 'undefined' ? gust : 0));
  if (!indoor) RG.draussen = RG.aktiv; // drinnen zählt, ob es draußen zuletzt geregnet hat (Kap. 5 nach dem Regen, Villa bei Tag: still)
  if (ort === 'innen' || ort === 'nr7') Z.amb_regen_innen = regen_basis(ort, 'amb_regen_innen') * (RG.aktiv || RG.draussen !== false ? 1 : 0) * (1 + .4 * RG.schauer);
  else if (I > 0 && RG.map) {
    const R0 = Math.max(regen_basis(ort, 'amb_regen'), regen_basis(ort, 'amb_wald')); if (R0 > 0) {
      const e = regen_umgebung(P, feet), W = e.w, sum = W[0] + W[1] + W[2] + W[3] + W[4] + W[5] + 1e-4, sh = k => W[k] / sum;
      const me = camera.matrixWorld.elements, rx = me[0], rz = me[2], pan = k => { const s = W[k] > 1e-4 ? (e.x[k] * rx + e.z[k] * rz) / W[k] : 0; return Math.max(-.7, Math.min(.7, s * 1.3)); };
      const aussen = R0 * I * (1 - .35 * e.dach), g = typeof gust !== 'undefined' ? gust : 0;
      Z.amb_regen = aussen * (sh(0) + .6 * sh(1) + .5 * sh(5) + .4 * sh(4)) * 1.05; PN.amb_regen = pan(0);
      Z.amb_wald = aussen * (sh(2) * 1.1 + .45 * sh(1)) * (1 + .5 * g); PN.amb_wald = pan(2);
      Z.amb_regen_tropf = aussen * (.1 + .9 * sh(3) + .8 * sh(4) + .4 * sh(5) + .5 * e.krone) * .8; PN.amb_regen_tropf = (pan(3) * W[3] + pan(4) * W[4]) / (W[3] + W[4] + 1e-4);
      Z.amb_regen_veranda = R0 * I * e.dach * .95;
      Z.amb_dach = R0 * I * Math.max(0, 1 - e.traufe / 5) * .38;
      // Fallrohr: das nächste (fassaden.js) gluckert, mit Richtung
      if (typeof fassaden_S !== 'undefined' && fassaden_S.pipes.length) { if (!RG.pipes || RG.pipes.length !== fassaden_S.pipes.length) RG.pipes = fassaden_S.pipes.map(p => { const v = p.g.localToWorld(p.p.clone()); return [v.x, v.z]; });
        let bd = 1e9, bx = 0, bz = 0; for (const [x, z] of RG.pipes) { const d2 = (x - P.x) ** 2 + (z - P.z) ** 2; if (d2 < bd) { bd = d2; bx = x; bz = z; } }
        if (bd < 196) { const d = Math.sqrt(bd); Z.amb_rinne = R0 * I * .55 / (1 + bd * .06); PN.amb_rinne = d > .3 ? Math.max(-.8, Math.min(.8, ((bx - P.x) * rx + (bz - P.z) * rz) / d * .8)) : 0; } } } }
  const t = A.ctx.currentTime;
  for (const n of RG_SCHICHT) { const B = S.L[n], v = Z[n];
    if (v > .004 && !B.h) { const b = A.buf[n]; if (!b) { if (typeof klang_load === 'function') klang_load(n); continue; } B.h = A.play(n, { loop: true, gain: 0, dest: B.p, offset: rand(0, b.duration * .9) }); B.v = 0; if (!B.h) continue; }
    if (!B.h) continue;
    if (Math.abs(v - B.v) > .002) { B.h.g.gain.setTargetAtTime(v, t, v > B.v ? .5 : .8); B.v = v; }
    B.p.pan.setTargetAtTime(PN[n], t, .6);
    B.idle = v > .004 ? 0 : B.idle + 1; if (B.idle > 80) { B.h.stop(.5); B.h = null; B.v = 0; } } }
// ---------------------------------------------------------------- Tropfen auf der „Linse“: nur wer in den offenen Regen hinaufsieht
function regen_linse(dt, offen) {
  let L = RG.lens; if (!L) { const box = document.createElement('div'); box.id = 'regenLinse'; box.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;overflow:hidden';
    const st = document.createElement('style'); st.textContent = '#regenLinse i{position:absolute;display:block;border-radius:50% 50% 46% 54%/56% 56% 44% 44%;opacity:0;will-change:transform,opacity;'
      + '-webkit-backdrop-filter:blur(2.4px) brightness(1.16) saturate(1.1);backdrop-filter:blur(2.4px) brightness(1.16) saturate(1.1);'
      + 'background:radial-gradient(circle at 36% 30%,rgba(255,250,240,.22),rgba(255,255,255,0) 30%),radial-gradient(circle at 50% 62%,rgba(0,0,0,0) 55%,rgba(10,14,20,.18) 100%);'
      + 'box-shadow:inset 0 -2px 3px rgba(255,255,255,.12),0 0 1px rgba(255,255,255,.1)}';
    document.head.appendChild(st); document.body.appendChild(box); L = RG.lens = [];
    for (let i = 0; i < 4; i++) { const el = document.createElement('i'); box.appendChild(el); L.push({ el, t: -1, life: 0, x: 0, y: 0, s: 0, slide: 0 }); } }
  const dir = camera.getWorldDirection(RG.v), up = dir.y;
  const want = offen && up > .3 && state.started && !ui.overlay && !menu.attract && !state.talking;
  if (want) { RG.lensT -= dt * (up - .25) * 3 * Math.min(1.6, .8 + RG.schauer); if (RG.lensT < 0) { RG.lensT = rand(.7, 1.8); const D = L.find(d => d.t < 0);
    if (D) { const side = Math.random(); D.x = side < .5 ? rand(4, 96) : side < .75 ? rand(1, 16) : rand(84, 99); D.y = side < .5 ? rand(2, 24) : rand(8, 62); D.s = rand(14, 34); D.life = rand(2.6, 5); D.t = 0; D.slide = rand(6, 30);
      const el = D.el; el.style.width = D.s + 'px'; el.style.height = D.s * rand(.9, 1.15) + 'px'; el.style.left = D.x + '%'; el.style.top = D.y + '%'; } } }
  for (const D of L) { if (D.t < 0) continue; D.t += dt * (want ? 1 : 2.5); const u = D.t / D.life; if (u >= 1) { D.t = -1; D.el.style.opacity = 0; continue; }
    D.el.style.opacity = (Math.min(1, D.t / .12) * (1 - u * u) * .9).toFixed(3); D.el.style.transform = 'translateY(' + (D.slide * u * u).toFixed(1) + 'px)'; } }
// ---------------------------------------------------------------- Takt
function regen_tick(dt, indoor) {
  const U = RG.U, m = RG.m, P = camera.position; RG.frame++;
  if (rain.m !== m) return; // Vergleich: alter Regen aktiv
  // Schauer (leben.js schreibt die alte Deckkraft), Traum (Skalierung ≈ 0)
  RG.schauer = Math.max(0, Math.min(1, (m.material.opacity - .12) / .09)); RG.traum = m.scale.x < .01; RG.sp.visible = !RG.traum;
  // Drinnen (Wohnhäuser im Ort): draußen vor dem Fenster regnet es weiter, im Zimmer nie
  const R = indoor && !state.inBasement && state.zone !== 'canal' && typeof indoorRect === 'function' ? indoorRect() : null;
  if (R && R.x0 > -800 && R.x0 < 250) { m.visible = true; U.uRect.value.set(R.x0 - .3, R.x1 + .3, R.zb - .3, R.zf + .3); } else U.uRect.value.set(1, 0, 1, 0);
  RG.aktiv = RG.frame - RG.drawnF <= 3 && !RG.traum;
  RG.t = (RG.t + dt) % 600; U.uT.value = RG.t;
  // Kamerageschwindigkeit (Relativbewegung der Schlieren); Sprünge (Teleport, Schnitt) zählen nicht
  if (dt > 0) { const vx = (P.x - RG.prev.x) / dt, vy = (P.y - RG.prev.y) / dt, vz = (P.z - RG.prev.z) / dt;
    if (vx * vx + vy * vy + vz * vz < 225) RG.camV.lerp(RG.v.set(vx, vy, vz), Math.min(1, dt * 10)); else RG.camV.set(0, 0, 0); }
  RG.prev.copy(P); U.uCam.value.copy(P); U.uCamV.value.copy(RG.camV);
  const sp = .5 + WIND.k * 3.4; U.uWind.value.set(WIND.dx * sp, WIND.dz * sp, ((WIND.fx % 72) + 72) % 72, ((WIND.fz % 72) + 72) % 72);
  U.uWK.value = WIND.k; U.uGust.value = typeof gust !== 'undefined' ? gust : 0; U.uInt.value = .85 + .4 * RG.schauer; U.uFogD.value = scene.fog && scene.fog.density !== undefined ? scene.fog.density : .034;
  RG.gy = player.pos.y < .7 ? 0 : player.pos.y; U.uMapP.value.z = RG.gy;
  RG.resT -= dt; if (RG.resT < 0) { RG.resT = 1; renderer.getDrawingBufferSize(RG.v2); U.uRes.value.copy(RG.v2); }
  if (m.visible || RG.aktiv) { regen_karte(); RG.upT -= dt; if (RG.dirty && RG.upT < 0) { RG.upT = .1; RG.dirty = 0; RG.tex.needsUpdate = true; } }
  // Dachrinnen-Tropfen (fassaden.js) im Licht sichtbar statt immer gleich hell
  RG.vis -= dt; if (RG.vis < 0) { RG.vis = .25; const D = typeof fassaden_S !== 'undefined' && fassaden_S.drops; if (D && D.m) { const L0 = LP.order[0], d2 = L0 ? (L0.wx - P.x) ** 2 + (L0.wz - P.z) ** 2 : 1e9;
    D.m.material.opacity = .1 + .32 * Math.min(1, (L0 ? L0.k : 0) * 30 / (30 + d2) + (fogUniforms.flK.value.x > 0 ? .7 : 0)); } }
  try { regen_klang(dt, indoor); } catch (e) { if (!RG.kErr) { RG.kErr = 1; console.warn('Regen: Ton', e); } }
  let offen = RG.aktiv && !indoor; if (offen) { const i = regen_lies(P.x, P.z); if (i >= 0 && RG.map[i] > P.y - .2) offen = false; }
  regen_linse(dt, offen);
}
WORLD_MODS.push(['Regen', async () => {
  try { regen_bau(); } catch (e) { console.warn('Regen: Aufbau – alter Regen bleibt', e); RG.m = null; }
  window.__regen = { RG, stats: () => ({ ms: +RG.ms.toFixed(3), zellen: RG.cells, zelleMs: +RG.cellMs.toFixed(4), aktiv: RG.aktiv, schauer: +RG.schauer.toFixed(2), baeume: RG.treeN, mats: RG.mats.size,
      ton: RG.snd.L ? Object.fromEntries(RG_SCHICHT.map(n => [n, [+(RG.snd.L[n].v || 0).toFixed(3), +(RG.snd.pan[n] || 0).toFixed(2)]])) : null }),
    ab: alt => { if (!RG.m || !RG.alt) return; const a = !!alt; if (a && rain.m === RG.m) { scene.remove(RG.m); scene.add(RG.alt); rain.m = RG.alt; rain.N = RG.altN; } else if (!a && rain.m === RG.alt) { scene.remove(RG.alt); scene.add(RG.m); rain.m = RG.m; rain.N = 0; } },
    rain: () => rain, zelle: (x, z) => { const i = regen_lies(x, z); if (i < 0) return null; const M = RG.map, cz = Math.floor(M[i + 2] / 64), q = M[i + 2] - cz * 64, ty = Math.floor(q / 4); return { top: M[i], boden: M[i + 1], art: q - ty * 4, belag: ty }; } }; // Testzugriff
}]);
WORLD_TICK.push((dt, t, indoor) => { if (!RG.m) return; const a = performance.now(); regen_tick(dt, indoor); RG.ms = RG.ms * .97 + (performance.now() - a) * .03; });
