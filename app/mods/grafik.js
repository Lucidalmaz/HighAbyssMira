// =====================================================================  GRAFIK (Modul „grafik“, Nutzer-Rückmeldung R-14 vom 01.10.2026, dazu Q-10)
// „Die komplette Grafik wirkt noch so glatt und generiert“ – zentraler Material- und Bildpass, ein Ort für alles:
// 1) OBERFLÄCHEN (alle MeshStandard-/MeshPhysicalMaterial, über THREE.ShaderChunk statt je Material → keine neuen Shader-Varianten):
//    Mikrostruktur (Detail-Normalen triplanar in Weltkoordinaten, nur nah), Rauheit schwankt (Fett, Abrieb), großflächige Farbschwankung
//    (bricht Kachelmuster), Schmutz in Vertiefungen (AO-Karte der Scans), abgestoßene Kanten, zweite gedrehte Abtastung großer Kachelflächen,
//    draußen Nässe (Oberseiten dunkel und glänzend, Laufspuren an Wänden, Spritzwasser am Sockel). Ausgenommen: Figuren (Skinning),
//    Durchsichtiges, Laub-Karten (nur Nässe). Die Böden aus gruen.js sind schon nass (eigene Pfützen) → Define HAM_BODEN, nur Detail.
//    Texturen: echte Scans (wet_asphalt/n = Mikronormalen, rust_sheet/orm.G = Schmutzmaske).
// 2) BILD: ein Pass direkt nach dem RenderPass (vor Bloom, vor dem Masken-Pass der Hervorhebung bleibt dieser unangetastet):
//    halbe Auflösung – Umgebungsverdeckung aus der Szenentiefe (8 Proben, Normale aus der Tiefe) + Lichtstreuung im Taschenlampenkegel
//    (12 Schritte, Rauschen in Weltkoordinaten) → tiefengewichtet hochskaliert und ins HDR-Bild gemischt. Im filmPass der Basis:
//    Linsenschmutz (Bloom × Schmutzmaske), leichtes Nachschärfen, Filmkorn nach Helligkeit, Farbsaum an/aus.
// 3) EINSTELLUNGEN: Zeile „Grafik-Details“ unter „Grafikqualität“ → Unterfenster (Voreinstellung Hoch/Mittel/Niedrig + Einzelschalter).
//    settings.fx = { det, ao, vol, dirt, ca, grain, sharp }. Ändert man die Grafikqualität, gilt wieder deren Voreinstellung.
// Testzugriff: window.__grafik = { G: GRAFIK, an(fx) }.
const GRAFIK_PRESET = { 0: { det: 0, ao: 0, vol: 0, dirt: 0, ca: 1, grain: .8, sharp: 0 }, 1: { det: 1, ao: 1, vol: 1, dirt: 1, ca: 1, grain: 1, sharp: .25 }, 2: { det: 1, ao: 1, vol: 1, dirt: 1, ca: 1, grain: 1, sharp: .35 } };
const GRAFIK = { u0: new THREE.Vector4(0, 1, 1, 0), u1: new THREE.Vector4(1.7, 1, 0, 0), tex: [null, null], wetK: 0, ready: false, pass: null, rt: null, mA: null, mB: null,
  sc: null, cam: null, on: false, v: new THREE.Vector3(), w: new THREE.Vector3(), noise: null, dirt: null, init: false };

// ---------------------------------------------------------------- 1) Oberflächen (Shader-Bausteine, vor dem Übersetzen aller Programme)
GRAFIK.tex[0] = msTex('wet_asphalt/n.jpg'); GRAFIK.tex[1] = msTex('rust_sheet/orm.jpg');
for (const k of ['standard', 'physical']) Object.assign(THREE.ShaderLib[k].uniforms, { hamG: { value: [GRAFIK.u0, GRAFIK.u1] }, hamT: { value: GRAFIK.tex } }); // Arrays: jede Material-Kopie teilt dieselben Vektoren/Texturen
THREE.ShaderChunk.lights_physical_pars_fragment = `#define HAM_SURF 1
uniform vec4 hamG[2]; uniform sampler2D hamT[2];
float hamGr(vec2 p){ return clamp((texture2D(hamT[1], p).g - .62) * 3.2, 0., 1.); }
vec4 hamMap(sampler2D m, vec2 uv){ vec4 a = texture2D(m, uv);
#if defined(OPAQUE) && !defined(USE_SKINNING)
  if (hamG[0].z > 0.) { vec4 b = texture2D(m, vec2(uv.y, -uv.x) * .613 + vec2(.37, .71));
    float k = smoothstep(2., 4., max(abs(uv.x), abs(uv.y))) * hamG[0].z;
    a = mix(a, b, k * smoothstep(.4, .75, hamGr(uv * .041) + dot(b.rgb - a.rgb, vec3(.6)))); }
#endif
  return a; }
` + THREE.ShaderChunk.lights_physical_pars_fragment;
THREE.ShaderChunk.map_fragment = THREE.ShaderChunk.map_fragment.replace('vec4 sampledDiffuseColor = texture2D( map, vMapUv );',
  `#ifdef HAM_SURF
	vec4 sampledDiffuseColor = hamMap( map, vMapUv );
#else
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
#endif`);
THREE.ShaderChunk.lights_physical_fragment = `#ifdef HAM_SURF
#if defined(OPAQUE) && !defined(USE_SKINNING) && !defined(USE_TRANSMISSION)
if (hamG[0].x + hamG[0].y + hamG[0].z > 0.) {
  vec3 hW = cameraPosition + (vec4(-vViewPosition, 0.) * viewMatrix).xyz, hN = normalize((vec4(nonPerturbedNormal, 0.) * viewMatrix).xyz), hA = abs(hN);
  float hD = length(vViewPosition);
  vec2 hP = hA.y > max(hA.x, hA.z) ? hW.xz : (hA.x > hA.z ? hW.zy : hW.xy);
  float hG = hamGr(hP * .37), hL = hamGr(hP * .043 + .29);
#ifndef USE_ALPHATEST
  if (hamG[0].y > 0.) { float s = hamG[1].x; vec3 bw = hA * hA; bw *= bw; bw /= bw.x + bw.y + bw.z;
    vec2 tX = texture2D(hamT[0], hW.zy * s).xy * 2. - 1., tY = texture2D(hamT[0], hW.xz * s).xy * 2. - 1., tZ = texture2D(hamT[0], hW.xy * s).xy * 2. - 1.;
    vec3 pw = bw.x * vec3(0., tX.y, tX.x) + bw.y * vec3(tY.x, 0., tY.y) + bw.z * vec3(tZ.x, tZ.y, 0.);
    normal = normalize(normal + (viewMatrix * vec4(pw, 0.)).xyz * hamG[0].y * .45 * (1. - smoothstep(2.5, 9., hD))); }
#endif
  float hV = hamG[0].z;
  roughnessFactor = clamp(roughnessFactor * (1. + (hG - .5) * .45 * hV), .04, 1.);
  diffuseColor.rgb *= 1. + (hL - .5) * .22 * hV;
#ifdef USE_AOMAP
  { float hO = texture2D(aoMap, vAoMapUv).r; diffuseColor.rgb *= mix(1., .7 + .3 * hO, hV * (.5 + .5 * hG)); roughnessFactor = min(1., roughnessFactor + (1. - hO) * .12 * hV); }
#endif
  { float hC = length(fwidth(nonPerturbedNormal)) / max(length(fwidth(vViewPosition)), 1e-4);
    float hE = smoothstep(9., 30., hC) * smoothstep(.35, .7, hG) * hamG[1].y * (1. - smoothstep(3., 7., hD));
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * (1.12 + .5 * metalnessFactor) + .02, hE * .5);
    roughnessFactor = mix(roughnessFactor, roughnessFactor * (1. - .4 * metalnessFactor), hE); }
#ifndef HAM_BODEN
  if (hamG[0].x > 0.) { float up = clamp(hN.y, 0., 1.), por = 1. - metalnessFactor;
    float hS = hamGr(vec2((hW.x + hW.z) * .9, hW.y * .06 + hG * .05));
    float wTop = smoothstep(.5, .92, up) * (.65 + .35 * smoothstep(.35, .7, hL)), wSide = (1. - up) * smoothstep(.45, .8, hS) * .7;
    float wBase = (1. - up) * (1. - smoothstep(0., .5 + .3 * hG, hW.y));
    float w = clamp(max(max(wTop, wSide), wBase), 0., 1.) * hamG[0].x;
    diffuseColor.rgb *= 1. - (.32 + .12 * wBase) * w * por;
    roughnessFactor = mix(roughnessFactor, roughnessFactor * .4, w); }
#endif
}
#endif
#endif
` + THREE.ShaderChunk.lights_physical_fragment;

// ---------------------------------------------------------------- 2) Bildpass: Verdeckung + Lichtstreuung (halbe Auflösung)
const GRAFIK_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const GRAFIK_FS_A = `uniform sampler2D tDepth, tNoise; uniform mat4 pInv, vInv; uniform vec4 P0, aoP, flPos, flDir, volP; varying vec2 vUv;
  vec3 vp(vec2 uv){ vec4 c = pInv * vec4(uv * 2. - 1., textureLod(tDepth, uv, 0.).x * 2. - 1., 1.); return c.xyz / c.w; }
  void main(){
    float d0 = textureLod(tDepth, vUv, 0.).x; vec3 P = vp(vUv); float dist = length(P);
    float j = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
    float ao = 1.;
    if (aoP.z > 0. && d0 < 1.) {
      vec3 pr = vp(vUv + vec2(P0.z, 0.)), pl = vp(vUv - vec2(P0.z, 0.)), pu = vp(vUv + vec2(0., P0.w)), pd = vp(vUv - vec2(0., P0.w));
      vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl, dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
      vec3 N = normalize(cross(dx, dy)); if (dot(N, P) > 0.) N = -N;
      float R = aoP.x, occ = 0.; vec2 sc = vec2(P0.x, P0.y) * .5 * R / max(-P.z, .05); sc = min(sc, vec2(.15));
      for (int i = 0; i < 8; i++) { float fi = (float(i) + j) / 8., a = j * 6.2832 + float(i) * 2.39996;
        vec3 v = vp(vUv + vec2(cos(a), sin(a)) * sc * (.12 + .88 * fi)) - P; float vv = dot(v, v);
        occ += max(0., dot(N, v) * inversesqrt(vv + 1e-4) - aoP.w) * (1. - smoothstep(R * R * .4, R * R * 1.6, vv)); }
      ao = mix(1., clamp(1. - aoP.y * occ / 8., 0., 1.), 1. - smoothstep(22., 55., dist));
    }
    float vol = 0.;
    if (flPos.w > 0.) {
      vec3 rd = P / max(dist, 1e-4); float tM = min(d0 < 1. ? dist : volP.y, volP.y), dt = tM / 12., acc = 0.;
      for (int i = 0; i < 12; i++) { float t = (float(i) + j) * dt; vec3 X = rd * t, L = X - flPos.xyz; float l2 = dot(L, L);
        float cone = smoothstep(flDir.w, volP.x, dot(L * inversesqrt(l2 + 1e-6), flDir.xyz));
        vec3 W = (vInv * vec4(X, 1.)).xyz; float n = textureLod(tNoise, W.xz * .21 + vec2(volP.z * .013, volP.z * .006), 0.).r * textureLod(tNoise, W.xy * .27 + vec2(0., volP.z * .035), 0.).g;
        acc += cone * (.3 + 1.6 * n) / (l2 + .6); }
      vol = acc * dt * flPos.w;
    }
    gl_FragColor = vec4(ao, vol, 0., -P.z);
  }`;
const GRAFIK_FS_B = `uniform sampler2D tDiffuse, tDepth, tHalf; uniform vec2 hpx; uniform vec4 K, nf; uniform vec3 flCol; varying vec2 vUv;
  void main(){
    vec4 c = texture2D(tDiffuse, vUv); float d = texture2D(tDepth, vUv).x;
    float z = nf.x * nf.y / (nf.y - d * (nf.y - nf.x)); /* Tiefe → Abstand entlang der Blickachse */
    vec2 s = vec2(0.); float ws = 0.;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec4 h = texture2D(tHalf, vUv + vec2(float(x), float(y)) * hpx * 1.25);
      float w = (x == 0 && y == 0 ? 1. : (x == 0 || y == 0 ? .7 : .5)) * exp(-abs(h.a - z) / max(z * .04, .02)); s += h.rg * w; ws += w; }
    s = ws > 1e-4 ? s / ws : texture2D(tHalf, vUv).rg;
    float l = dot(c.rgb, vec3(.2126, .7152, .0722));
    if (K.x > 0. && d < 1.) c.rgb *= mix(1., s.x, K.x * (1. - smoothstep(.6, 2.6, l)));
    c.rgb += flCol * s.y * K.y;
    gl_FragColor = c;
  }`;
function grafik_noise() { // weiches, kachelbares Rauschen (64², zwei Kanäle) für die Lichtstreuung
  const N = 64, a = [new Float32Array(N * N), new Float32Array(N * N)];
  for (const f of a) { for (let i = 0; i < f.length; i++) f[i] = Math.random();
    for (let r = 0; r < 3; r++) { const g = f.slice(); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let k = -2; k <= 2; k++) s += g[y * N + ((x + k + N) % N)] + g[((y + k + N) % N) * N + x]; f[y * N + x] = s / 10; } } }
  const d = new Uint8Array(N * N * 4); for (let i = 0; i < N * N; i++) { for (let c = 0; c < 2; c++) { const v = a[c][i]; d[i * 4 + c] = Math.max(0, Math.min(255, (v - .5) * 4.2 * 255 + 128)); } d[i * 4 + 3] = 255; }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}
function grafik_dirtTex() { // Linsenschmutz: Schlieren, Fingerabdruck-Bögen, Staub – nur dort sichtbar, wo helles Licht streut
  const W = 512, H = 288, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const px = Math.random() * W, py = Math.random() * H, r = 18 + Math.random() * 70, g = x.createRadialGradient(px, py, 0, px, py, r), a = .05 + Math.random() * .09;
    g.addColorStop(0, `rgba(255,248,235,${a})`); g.addColorStop(1, 'rgba(255,248,235,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(px, py, r, r * (.4 + Math.random() * .6), Math.random() * 3, 0, 7); x.fill(); }
  x.lineCap = 'round'; for (let i = 0; i < 5; i++) { const px = Math.random() * W, py = Math.random() * H; for (let k = 0; k < 9; k++) { x.strokeStyle = `rgba(255,250,240,${.025 + Math.random() * .02})`; x.lineWidth = 1.2; x.beginPath(); x.arc(px, py, 6 + k * 3.2, Math.random() * 2, 2 + Math.random() * 2.6); x.stroke(); } }
  for (let i = 0; i < 160; i++) { const px = Math.random() * W, py = Math.random() * H, r = .5 + Math.random() * 1.8; x.fillStyle = `rgba(255,255,255,${.1 + Math.random() * .25})`; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
  for (let i = 0; i < 4; i++) { const y0 = Math.random() * H; x.strokeStyle = 'rgba(255,250,240,.05)'; x.lineWidth = 6 + Math.random() * 10; x.beginPath(); x.moveTo(-20, y0); x.bezierCurveTo(W * .3, y0 + (Math.random() - .5) * 80, W * .6, y0 + (Math.random() - .5) * 80, W + 20, y0 + (Math.random() - .5) * 60); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace; return t;
}
function grafik_pass() {
  const U = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, { value: v }]));
  GRAFIK.noise = grafik_noise();
  GRAFIK.mA = new THREE.ShaderMaterial({ uniforms: U({ tDepth: null, tNoise: GRAFIK.noise, pInv: new THREE.Matrix4(), vInv: new THREE.Matrix4(), P0: new THREE.Vector4(), aoP: new THREE.Vector4(.55, 1.15, 1, .08),
    flPos: new THREE.Vector4(), flDir: new THREE.Vector4(), volP: new THREE.Vector4(.99, 16, 0, 0) }), vertexShader: GRAFIK_VS, fragmentShader: GRAFIK_FS_A, depthTest: false, depthWrite: false });
  GRAFIK.mB = new THREE.ShaderMaterial({ uniforms: U({ tDiffuse: null, tDepth: null, tHalf: null, hpx: new THREE.Vector2(), K: new THREE.Vector4(.85, .05, 0, 0), nf: new THREE.Vector4(.05, 110, 0, 0), flCol: new THREE.Color() }),
    vertexShader: GRAFIK_VS, fragmentShader: GRAFIK_FS_B, depthTest: false, depthWrite: false });
  GRAFIK.rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  GRAFIK.mB.uniforms.tHalf.value = GRAFIK.rt.texture;
  const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), GRAFIK.mA); q.frustumCulled = false; GRAFIK.sc = new THREE.Scene(); GRAFIK.sc.add(q); GRAFIK.q = q; GRAFIK.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { enabled: false, needsSwap: true, clear: false, renderToScreen: false, dispose() {},
    setSize(w, h) { GRAFIK.rt.setSize(Math.max(1, w >> 1), Math.max(1, h >> 1)); GRAFIK.mA.uniforms.P0.value.z = 2 / Math.max(1, w); GRAFIK.mA.uniforms.P0.value.w = 2 / Math.max(1, h);
      GRAFIK.mB.uniforms.hpx.value.set(1 / GRAFIK.rt.width, 1 / GRAFIK.rt.height); },
    render(r, write, read) {
      const A = GRAFIK.mA.uniforms, B = GRAFIK.mB.uniforms, cam = camera;
      A.tDepth.value = B.tDepth.value = read.depthTexture; B.tDiffuse.value = read.texture;
      A.pInv.value.copy(cam.projectionMatrixInverse); A.vInv.value.copy(cam.matrixWorld); const e = cam.projectionMatrix.elements; A.P0.value.x = e[0]; A.P0.value.y = e[5];
      B.nf.value.set(cam.near, cam.far, 0, 0); A.volP.value.z = performance.now() / 1000;
      // Taschenlampe in Kamerakoordinaten
      let k = 0; if (GRAFIK.fx.vol && flashlight.visible && flashlight.intensity > 0 && flashlight.parent) { k = Math.min(2, flashlight.intensity / 18);
        const V = GRAFIK.v.setFromMatrixPosition(flashlight.matrixWorld), T = GRAFIK.w.setFromMatrixPosition(flashlight.target.matrixWorld).sub(V).normalize();
        V.applyMatrix4(cam.matrixWorldInverse); T.transformDirection(cam.matrixWorldInverse);
        A.flPos.value.set(V.x, V.y, V.z, k); A.flDir.value.set(T.x, T.y, T.z, Math.cos(flashlight.angle)); A.volP.value.x = Math.cos(flashlight.angle * (1 - flashlight.penumbra * .85)); A.volP.value.y = Math.min(18, flashlight.distance || 18);
        B.flCol.value.copy(flashlight.color); }
      const hasD = !!read.depthTexture; // ohne Szenentiefe nur durchreichen
      A.flPos.value.w = hasD ? k : 0; B.K.value.y = hasD && k > 0 ? .05 * (.55 + .45 * GRAFIK.wetK) : 0; A.aoP.value.z = hasD && GRAFIK.fx.ao ? 1 : 0; B.K.value.x = hasD && GRAFIK.fx.ao ? .85 : 0;
      GRAFIK.q.material = GRAFIK.mA; r.setRenderTarget(GRAFIK.rt); r.render(GRAFIK.sc, GRAFIK.cam);
      GRAFIK.q.material = GRAFIK.mB; r.setRenderTarget(this.renderToScreen ? null : write); r.render(GRAFIK.sc, GRAFIK.cam);
    } };
}

// ---------------------------------------------------------------- 3) Einstellungen
function grafik_fx() { let f = null; try { f = settings.fx; if (!f || typeof f !== 'object') f = settings.fx = { ...GRAFIK_PRESET[settings.gfx ?? 2] }; } catch (e) { f = { ...GRAFIK_PRESET[2] }; } GRAFIK.fx = f; return f; }
function grafik_anwenden() {
  const f = grafik_fx(), u = filmPass.uniforms;
  GRAFIK.u0.y = f.det ? 1 : 0; GRAFIK.u0.z = f.det ? 1 : 0; GRAFIK.u1.y = f.det ? 1 : 0; // Nässe (u0.x) bleibt immer: alles draußen ist nass
  u.grainK.value = +f.grain || 0; u.caK.value = f.ca ? 1 : 0; u.sharp.value = +f.sharp || 0; u.dirtK.value = f.dirt && bloom.enabled ? .6 : 0;
  if (GRAFIK.pass) GRAFIK.pass.enabled = !!(f.ao || f.vol);
}
function grafik_menue() {
  const P = document.getElementById('subPanel'), s = document.getElementById('sGfx'); if (!P || !s || document.getElementById('sGrafik')) return;
  const row = document.createElement('div'); row.className = 'row'; row.innerHTML = '<span>Grafik-Details</span><span class="close" style="margin:0"><button id="sGrafik">ANPASSEN</button></span>';
  s.closest('.row').after(row);
  s.addEventListener('change', () => { settings.fx = { ...GRAFIK_PRESET[settings.gfx] }; saveSettings(); grafik_anwenden(); });
  document.getElementById('sGrafik').onclick = e => { e.stopPropagation(); menuSound(); grafik_detail(); };
}
function grafik_detail() {
  const f = grafik_fx(), cb = (id, v) => `<input type="checkbox" id="${id}" ${v ? 'checked' : ''}>`;
  showSub(`<div class="ptitle">GRAFIK</div>
  <div class="row"><span>Voreinstellung</span><select id="gPre">${[[2, 'Hoch'], [1, 'Mittel'], [0, 'Niedrig']].map(([v, n]) => `<option value="${v}" ${settings.gfx === v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
  <div class="row"><span>Oberflächendetail</span>${cb('gDet', f.det)}</div>
  <div class="row"><span>Umgebungsverdeckung</span>${cb('gAo', f.ao)}</div>
  <div class="row"><span>Lichtstreuung der Taschenlampe</span>${cb('gVol', f.vol)}</div>
  <div class="row"><span>Linsenschmutz</span>${cb('gDirt', f.dirt)}</div>
  <div class="row"><span>Farbsaum am Bildrand</span>${cb('gCa', f.ca)}</div>
  <div class="row"><span>Filmkorn</span><input type="range" min="0" max="1.5" step="0.05" value="${f.grain}" id="gGrain"></div>
  <div class="row"><span>Nachschärfen</span><input type="range" min="0" max="1" step="0.05" value="${f.sharp}" id="gSharp"></div>`);
  const $g = id => document.getElementById(id), save = () => { saveSettings(); grafik_anwenden(); };
  $g('gPre').onchange = ev => { settings.gfx = +ev.target.value; settings.fx = { ...GRAFIK_PRESET[settings.gfx] }; save(); applyQuality(); grafik_anwenden(); grafik_detail(); };
  for (const [id, k] of [['gDet', 'det'], ['gAo', 'ao'], ['gVol', 'vol'], ['gDirt', 'dirt'], ['gCa', 'ca']]) $g(id).onchange = ev => { f[k] = ev.target.checked ? 1 : 0; save(); };
  $g('gGrain').oninput = ev => { f.grain = +ev.target.value; save(); }; $g('gSharp').oninput = ev => { f.sharp = +ev.target.value; save(); };
  $g('subClose').onclick = e => { e.stopPropagation(); menuSound(); const m = document.getElementById('mSet'); if (m) m.click(); }; // zurück zu den Einstellungen
}

// ---------------------------------------------------------------- Einbindung
WORLD_MODS.push(['Grafik', async () => {
  // Böden aus gruen.js sind schon nass (eigene Pfützen/Laternenstreifen): dort keine zweite Nässe
  const seen = new Set(); scene.traverse(o => { if (!o.material) return; for (const m of [].concat(o.material)) { if (!m || seen.has(m)) continue; seen.add(m);
    if (m.isMeshStandardMaterial && m.onBeforeCompile && /gMode/.test(String(m.onBeforeCompile))) { m.defines = Object.assign(m.defines || {}, { HAM_BODEN: '' }); m.needsUpdate = true; } } });
  try { for (const r of [composer.renderTarget1, composer.renderTarget2]) if (!r.depthTexture) { r.depthTexture = new THREE.DepthTexture(r.width, r.height, THREE.UnsignedIntType); r.dispose(); } } catch (e) { console.warn('Grafik: keine Szenentiefe', e); }
  GRAFIK.pass = grafik_pass();
  const P = composer.passes, ir = P.findIndex(p => p.constructor && p.constructor.name === 'RenderPass'); composer.insertPass(GRAFIK.pass, ir >= 0 ? ir + 1 : 1);
  GRAFIK.dirt = grafik_dirtTex(); filmPass.uniforms.tDirt.value = GRAFIK.dirt;
  try { filmPass.uniforms.tBloom.value = bloom.renderTargetsHorizontal[0].texture; } catch (e) {}
  GRAFIK.mA.uniforms.tDepth.value = composer.renderTarget1.depthTexture; GRAFIK.mB.uniforms.tDepth.value = composer.renderTarget1.depthTexture;
  renderer.compileAsync(GRAFIK.sc, GRAFIK.cam); GRAFIK.q.material = GRAFIK.mB; renderer.compileAsync(GRAFIK.sc, GRAFIK.cam); GRAFIK.q.material = GRAFIK.mA; // im großen Übersetzungsdurchgang mit
  const mS = document.getElementById('mSet'); if (mS) mS.addEventListener('click', () => setTimeout(grafik_menue, 0));
  GRAFIK.ready = true;
}]);
WORLD_TICK.push((dt, t, indoor) => {
  if (!GRAFIK.ready) return;
  if (!GRAFIK.init) { GRAFIK.init = true; grafik_anwenden(); }
  GRAFIK.wetK += ((indoor ? 0 : 1) - GRAFIK.wetK) * Math.min(1, dt * 1.5); GRAFIK.u0.x = GRAFIK.wetK; GRAFIK.u0.w = t;
  const u = filmPass.uniforms, w = composer.renderTarget1.width, h = composer.renderTarget1.height; if (u.px.value.x !== 1 / w || u.px.value.y !== 1 / h) u.px.value.set(1 / w, 1 / h);
  if (u.dirtK.value > 0 && !bloom.enabled) u.dirtK.value = 0;
});
window.__grafik = { G: GRAFIK, an: fx => { Object.assign(grafik_fx(), fx || {}); grafik_anwenden(); return GRAFIK.fx; } }; // Testzugriff
