// =====================================================================  GEISTER (Modul „geister“, 08.10.2026): EIN gemeinsamer Look für alle Erinnerungen
// Nutzer 08.10.: „Die Geister sollen alle sehr hochwertig und detailreich aussehen wie in einem Triple-A-Game – Aussehen, Animation, Effekte.“
// Ersetzt die flache additive Hülle (figuren_ghostMat/figuren_geistBau delegieren hierher). Alle Geister im Spiel laufen hier durch:
//   Echos (ECHO_CAST), Nachbilder an Orten (figuren_person: cleo, visionen, zayn; kapitel3 NB, lucy3, kapitel5), weiss.js (weiss_ghostify), die Mannequin-Geister der Basis (FAB.figs).
// Bausteine (Parameter: docs/gameplay/geister.md):
//  · Shader (EIN Programm „geist5“, onBeforeCompile auf MeshStandard; Klone je Figur teilen das Programm, nur die Uniforms sind je Figur):
//    Fresnel-Rand mit Farbverlauf (unten kalt-tief, oben blass), Dichte-Näherung (Kanten dicht, Körper durchscheinend, Hintergrund wird leicht abgedunkelt =
//    vormultiplizierte Mischung statt rein additiv), Innenstruktur aus der echten Albedo (entsättigt, kontrastarm – Falten/Kleidung bleiben lesbar), Licht der Szene
//    (Taschenlampe, Lampen) hellt den Geist auf, aufsteigende Schlieren lösen Ränder/Hände/Füße/Haarspitzen auf (nie ganze Glieder, R-3), weiches Ein-/Ausblenden als
//    Auflösung von unten nach oben mit schwacher Glutkante, Vertex-Wabern (Wellen von unten nach oben, Saum stärker), Flimmern, Sättigungsausgleich gegen die Entsättigung.
//  · Tiefen-Zwilling (wie bisher, jetzt mit demselben Wabern/Auflösen): nur die vorderste Fläche leuchtet.
//  · Nachbild: zeitversetzte zweite Silhouette (≈ 0,12 s, Ringpuffer der Knochenmatrizen, die 3 größten Hüllen je Figur, nur nah).
//  · Effekte (EIN Zeichenaufruf, instanziert): weicher Kontaktschatten, Bodennebel (gemeinsame Textur poolTex × Weltrauschen), aufsteigender Glimmer.
//  · Animation: Zeitlupe 0,72–0,85, Stocken 80–150 ms, Schleifensprung verdeckt (Flimmern + Nachbild), kein Gleiten (beim Gehen Tempo 1), Regie je Echo (Clips, Sprecher, Blicke).
//  · Echo-Start/-Ende: Linse (Farbsaum-Puls, Vignette, Korn/Bleichung), Entsättigung nur über film-Uniforms (gSat/gBl, kein neuer Pass), Staub-Lichtkegel,
//    Flackern der vorhandenen Lampen (vlights), Ton: Flüsterschicht (fx_fluester_*), Herzschlag (pz_herz_*), Druck (fx_tief_2), Ausatmen; Hall über raumklang.
// Testzugriff: __geister (S, stat(), echo(id), look(on), show(...)).
const GEIST = {
  G: { uT: figuren_S.T, uSat: { value: 1 }, uBl: { value: 0 }, uWav: { value: .011 }, uCA: { value: new THREE.Color(.20, .38, .86) }, uCB: { value: new THREE.Color(.80, .89, 1.0) }, uCC: { value: new THREE.Color(.48, .56, .72) } },
  L: { lag: .12, slow: [.72, .85], stock: [4, 9], stockMs: [.08, .15], flick: [2.5, 7], nbNah: 14, nbN: 3, nbMax: 6, fxR: 35, kegel: .06, satEcho: .45, blEcho: .38, vigEcho: .55, caPuls: .016 },
  list: [], str: new Map(), s0: { value: 0 }, now: 0, t: 0, ms: 0, fx: null, kegel: null, echo: null, look: { k: 0, want: 0, ca: 0, vig: null, caU: null }, lamps: [],
  slots: [], v: new THREE.Vector3(), q: new THREE.Quaternion(), sv: new THREE.Vector3(), n: { vis: 0, nb: 0, fx: 0 }, snd: false, wrap: 0, stock: 0,
};
// ---------------------------------------------------------------- GLSL (gemeinsam für Geist und Tiefen-Zwilling)
const GEIST_U = `uniform float uGhost, uT, uWav, uE, uMA, uSat; uniform vec4 uF, uK; uniform vec3 uCA, uCB, uCC;
// uF: x Fortschritt Auftritt/Abgang 0..1 · y Bodenhöhe (Welt) · z Körperhöhe m (0 = unbekannt: ohne Höhenwirkungen) · w Saat
// uK: x,z Mitte (Welt) · y Modus (0 Auftritt, 1 Abgang) · w Flimmern (Helligkeit)
float gh3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float gn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(gh3(i), gh3(i + vec3(1,0,0)), f.x), mix(gh3(i + vec3(0,1,0)), gh3(i + vec3(1,1,0)), f.x), f.y), mix(mix(gh3(i + vec3(0,0,1)), gh3(i + vec3(1,0,1)), f.x), mix(gh3(i + vec3(0,1,1)), gh3(i + vec3(1,1,1)), f.x), f.y), f.z); }
varying vec3 vWP;
`;
const GEIST_VS = `vec3 gWave(vec3 wp){ if (uF.z <= 0.) return vec3(0.); float h = clamp((wp.y - uF.y) / uF.z, 0., 1.), s = uF.w, k = uF.z / 1.7;
  float w1 = sin(wp.y * 4.2 - uT * 1.35 + s), w2 = sin(wp.y * 9.1 - uT * 2.3 + s * 1.7), a = uWav * k * (.3 + .7 * (1. - h));
  return vec3((w1 * .65 + w2 * .35) * a, sin(uT * .8 + s) * .004 * k, (cos(wp.y * 3.7 - uT * 1.1 + s * 2.3) * .7 + w2 * .3) * a); }
`;
const GEIST_PROJ = `vec4 gW = modelMatrix * vec4(transformed, 1.); gW.xyz += gWave(gW.xyz); vWP = gW.xyz;
  vec4 mvPosition = viewMatrix * gW; gl_Position = projectionMatrix * mvPosition;`;
const GEIST_DISS = `float gH = uF.z > 0. ? clamp((vWP.y - uF.y) / uF.z, -.2, 1.4) : .5;
  float gDn = gn3(vWP * 7.3 + uF.w) * .6 + gn3(vWP * 23. - uF.w) * .4, gP = clamp(uF.x, 0., 1.);
  float gD = (uK.y < .5 ? (gP * 1.6 - .3) - gH : gH - ((1. - gP) * 1.6 - .3)) + (gDn - .5) * .3;
  if (uF.z > 0. && gD < 0.) discard;`;
const GEIST_FS = `
  float gEmb = uF.z > 0. ? (1. - smoothstep(0., .07, gD)) * (1. - step(.999, gP)) : 0.;
  vec3 gN = normalize(normal), gV = normalize(vViewPosition);
  float gFr = pow(1. - clamp(abs(dot(gN, gV)), 0., 1.), 2.);
  vec3 gS = vWP * vec3(5.5, 1.35, 5.5) + vec3(0., -uT * .55, 0.) + uF.w;
  float gWn = gn3(gS) * .62 + gn3(gS * 2.7 + 3.1) * .38;
  float gExt = uF.z > 0. ? smoothstep(.8, 1.7, length(vWP.xz - uK.xz) / (.26 * uF.z / 1.7 + .04)) : 0.;
  float gTop = uF.z > 0. ? smoothstep(.88, 1.05, gH) : 0., gBot = uF.z > 0. ? 1. - smoothstep(0., .16, gH) : 0.;
  float gEro = clamp(gFr * .5 + gExt * .45 + gTop * .6 + gBot * .75 + uE * .3, 0., 1.);
  float gWisp = 1. - gEro * (1. - smoothstep(.28, .74, gWn)) * .93;
  float gAl = dot(diffuseColor.rgb, vec3(.299, .587, .114)); gAl = clamp(.5 + (sqrt(max(gAl, 0.)) - .55) * .6, 0., 1.);
  float gLit = dot(gl_FragColor.rgb, vec3(.299, .587, .114));
  vec3 gRim = mix(uCA, uCB, clamp(smoothstep(.2, .95, gFr) * .7 + clamp(gH, 0., 1.) * .3, 0., 1.));
  vec3 gCol = uCC * (.5 + 1.1 * gAl * (1. - uE)) * (.3 + .3 * (1. - gFr)) + gRim * gFr * 1.2 + vec3(.95, .97, 1.) * gEmb * 1.4;
  gCol *= (1. + min(gLit * 2.2, 1.4)) * uK.w;
  float gStr = uGhost <= 1. ? min(uGhost / .45, 1.) : 1. + (uGhost - 1.) * .3; gStr *= 1. - uE * .7;
  float gMA = uMA > .5 ? diffuseColor.a : 1.;
  float gL = dot(gCol, vec3(.299, .587, .114)); gCol = max(vec3(0.), gL + (gCol - gL) / max(uSat, .3));
  float gA = (mix(.1, .5, gFr) + .12 * gAl) * gWisp * (1. - uE * .6);
  gl_FragColor = vec4(gCol * gWisp * gStr * gMA * .55, clamp(gA * gStr * gMA, 0., .85));
  if (gl_FragColor.a + gl_FragColor.r + gl_FragColor.b < .004) discard;`;
// ---------------------------------------------------------------- Uniform-Bündel je Figur (Material-Klone teilen das Programm)
function geister_bundle(s) { return { s: s || null, uF: { value: new THREE.Vector4(1, 0, 0, Math.random() * 50) }, uK: { value: new THREE.Vector4(0, 0, 0, 1) }, uE: { value: 0 }, cache: new Map(), zc: new Map() }; }
GEIST.U0 = geister_bundle(null); // ohne Figur (z. B. Laterne in kapitel5): ohne Höhenwirkungen, Stärke = FAB.ghostU
const geister_s = B => B.s || (typeof FAB !== 'undefined' && FAB.ghostU) || GEIST.s0;
function geister_uni(sh, B, uMA) { const G = GEIST.G, U = sh.uniforms; U.uGhost = geister_s(B); U.uF = B.uF; U.uK = B.uK; U.uE = B.uE; U.uMA = uMA; U.uT = G.uT; U.uWav = G.uWav; U.uSat = G.uSat; U.uCA = G.uCA; U.uCB = G.uCB; U.uCC = G.uCC;
  sh.vertexShader = GEIST_U + GEIST_VS + sh.vertexShader.replace('#include <project_vertex>', GEIST_PROJ); }
// Geister-Material zu einem Quellmaterial (je Bündel zwischengespeichert)
function geister_mat(src, B = GEIST.U0) {
  if (!src) return src; if (src.userData && src.userData.geistOf) src = src.userData.geistOf;
  const C = B.cache; if (C.has(src)) return C.get(src);
  const m = new THREE.MeshStandardMaterial({ map: src.map || null, transparent: true, depthWrite: false, fog: false, side: src.side, alphaTest: src.alphaTest || 0, roughness: 1, metalness: 0 });
  m.blending = THREE.CustomBlending; m.blendEquation = THREE.AddEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; // vormultipliziert: leuchtet UND verdichtet
  const uMA = { value: src.transparent || src.alphaTest > 0 ? 1 : 0 }; m.userData.geistOf = src;
  m.onBeforeCompile = sh => { geister_uni(sh, B, uMA); sh.fragmentShader = GEIST_U + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + GEIST_DISS + GEIST_FS); };
  m.forceSinglePass = true; // ein Durchgang (sonst Seitenumschaltung je Bild bei beidseitigen Teilen → Programmsuche)
  m.customProgramCacheKey = () => 'geist5'; C.set(src, m); return m;
}
// Tiefen-Zwilling: schreibt nur Tiefe, mit demselben Wabern/Auflösen
function geister_tiefe(src, B) { const at = src.alphaTest || 0, map = at > 0 ? src.map || null : null, k = at + '|' + (map ? map.uuid : '');
  if (B.zc.has(k)) return B.zc.get(k);
  const m = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, map, alphaTest: at, side: THREE.FrontSide }), uMA = { value: 0 };
  m.onBeforeCompile = sh => { geister_uni(sh, B, uMA); sh.fragmentShader = GEIST_U + sh.fragmentShader.replace('#include <dithering_fragment>', GEIST_DISS + '\n#include <dithering_fragment>'); };
  m.customProgramCacheKey = () => 'geistZ5'; B.zc.set(k, m); return m; }
// ---------------------------------------------------------------- Bau: Figur (oder beliebiges Objekt) zum Geist machen
// o: { strength (Uniform {value}), g (Wurzelgruppe), h (Körperhöhe m, wenn keine Person), P (Person) }
function geister_bau(obj, o = {}) {
  const B = geister_bundle(o.strength || null), L = []; obj.traverse(m => { if (m.isMesh && !m.userData.geistZ && !m.userData.geistN) L.push(m); });
  for (const m of L) { const mats = [].concat(m.material), nm = (m.name || '') + ' ' + mats.map(x => x && x.name || '').join(' ');
    if (FIG_INNEN.test(nm) || mats.every(x => x && x.transparent && x.opacity < .5 && !(x.userData && x.userData.geistOf))) { m.visible = false; continue; }
    const src = mats[0] && mats[0].userData && mats[0].userData.geistOf ? mats[0].userData.geistOf : mats[0] || {};
    m.material = Array.isArray(m.material) ? m.material.map(x => geister_mat(x, B)) : geister_mat(m.material, B); m.castShadow = false; m.receiveShadow = false; m.renderOrder = 951; m.userData.noCol = true;
    if (m.userData.geistTw) continue; // schon ein Zwilling da (zweiter Bau)
    let z; const dm = geister_tiefe(src, B); if (m.isSkinnedMesh) { z = new THREE.SkinnedMesh(m.geometry, dm); z.bind(m.skeleton, m.bindMatrix); z.bindMode = m.bindMode; } else z = new THREE.Mesh(m.geometry, dm);
    if (m.morphTargetInfluences) { z.morphTargetInfluences = m.morphTargetInfluences; z.morphTargetDictionary = m.morphTargetDictionary; }
    z.position.copy(m.position); z.quaternion.copy(m.quaternion); z.scale.copy(m.scale); z.renderOrder = 950; z.frustumCulled = m.frustumCulled; z.castShadow = z.receiveShadow = false; z.name = (m.name || '') + '_tiefe';
    z.userData.noCol = true; z.userData.geistZ = true; m.userData.geistTw = z; if (m.parent) m.parent.add(z); }
  const old = GEIST.list.find(e => e.obj === obj); if (old) geister_weg(old);
  const e = { B, obj, g: o.g || null, P: o.P || null, h: o.h || null, nb: null, BA: null, rings: [], loc: 0, wasVis: false, p: 0, mode: 0, fl: 1, flT: 1 + Math.random() * 4, dip: 0, dipK: 1,
    st: 2 + Math.random() * 5, frz: 0, slow: GEIST.L.slow[0] + Math.random() * (GEIST.L.slow[1] - GEIST.L.slow[0]), lt: 0, boost: 0, near: false, dist: 1e9, vis: false, str: 0, H: 1.7, talkT: 0, base: null };
  obj.userData.geistE = e; GEIST.list.push(e); return B;
}
// Person (figuren_embody) mit ihrem Eintrag verbinden
function geister_person(P) { const e = P && P.obj && P.obj.userData.geistE; if (!e) return; e.P = P; e.g = P.g; e.h = P.h; }
function geister_weg(e) { const i = GEIST.list.indexOf(e); if (i >= 0) GEIST.list.splice(i, 1); for (const R of e.rings) R.on = false; if (e.nb) for (const n of e.nb) if (n.parent) n.parent.remove(n); e.nb = null; }
// ---------------------------------------------------------------- Nachbild: zeitversetzte zweite Silhouette (Ringpuffer der Knochenmatrizen)
function geister_ring(sk) { if (sk.__gRing) return sk.__gRing; const R = sk.__gRing = { buf: new Array(16).fill(null), t: new Float64Array(16).fill(-1e9), i: 0, on: false, last: -1 };
  const u0 = sk.update; sk.update = function () { u0.call(this); if (!R.on || R.last === GEIST.now) return; R.last = GEIST.now; const b = this.boneMatrices; let s = R.buf[R.i]; if (!s || s.length !== b.length) s = R.buf[R.i] = new Float32Array(b.length); s.set(b); R.t[R.i] = GEIST.now; R.i = (R.i + 1) % 16; };
  return R; }
function geister_nbBau(e) { e.nb = []; try {
  const L = []; e.obj.traverse(m => { if (m.isSkinnedMesh && m.visible && m.skeleton && !m.userData.geistZ && !m.userData.geistN) L.push(m); });
  L.sort((a, b) => b.geometry.attributes.position.count - a.geometry.attributes.position.count);
  e.BA = { s: e.B.s, uF: e.B.uF, uK: e.B.uK, uE: { value: 1 }, cache: new Map(), zc: new Map() };
  for (const m of L.slice(0, GEIST.L.nbN)) { const R = geister_ring(m.skeleton); if (!e.rings.includes(R)) e.rings.push(R);
    const sk = new THREE.Skeleton(m.skeleton.bones, m.skeleton.boneInverses);
    sk.update = function () { const tgt = GEIST.now - GEIST.L.lag; let best = -1, bt = -1e9, old = -1, ot = 1e18; for (let k = 0; k < 16; k++) { const t = R.t[k]; if (!R.buf[k]) continue; if (t <= tgt && t > bt) { bt = t; best = k; } if (t < ot) { ot = t; old = k; } }
      if (best < 0) best = old; if (best < 0) return; const s = R.buf[best], d = this.boneMatrices; if (s.length === d.length) d.set(s); else d.set(s.length > d.length ? s.subarray(0, d.length) : s); if (this.boneTexture) this.boneTexture.needsUpdate = true; };
    const mats = [].concat(m.material).map(x => geister_mat(x, e.BA)), n = new THREE.SkinnedMesh(m.geometry, Array.isArray(m.material) ? mats : mats[0]);
    n.bind(sk, m.bindMatrix); n.bindMode = m.bindMode; if (m.morphTargetInfluences) { n.morphTargetInfluences = m.morphTargetInfluences; n.morphTargetDictionary = m.morphTargetDictionary; }
    n.position.copy(m.position); n.quaternion.copy(m.quaternion); n.scale.copy(m.scale); n.renderOrder = 952; n.frustumCulled = false; n.castShadow = n.receiveShadow = false; n.visible = false;
    n.name = (m.name || '') + '_nachbild'; n.userData.noCol = true; n.userData.geistN = true; m.parent.add(n); e.nb.push(n); }
} catch (err) { console.warn('Geister: Nachbild', err); } }
// ---------------------------------------------------------------- Effekte am Boden und in der Luft: EIN instanzierter Zeichenaufruf
const GEIST_SLOTS = 8, GEIST_NEB = 5, GEIST_GLM = 36, GEIST_JE = 1 + GEIST_NEB + GEIST_GLM;
function geister_fxBau() {
  const base = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.setAttribute('position', base.attributes.position); g.setAttribute('uv', base.attributes.uv);
  const N = GEIST_SLOTS * GEIST_JE, a = new Float32Array(N * 4); let k = 0;
  for (let s = 0; s < GEIST_SLOTS; s++) { const put = ty => { a[k++] = s; a[k++] = ty; a[k++] = Math.random(); a[k++] = Math.random(); }; put(0); for (let i = 0; i < GEIST_NEB; i++) put(1); for (let i = 0; i < GEIST_GLM; i++) put(2); }
  g.setAttribute('aI', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = 0;
  const uS = Array.from({ length: GEIST_SLOTS }, () => new THREE.Vector4()), uS2 = Array.from({ length: GEIST_SLOTS }, () => new THREE.Vector4());
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uS: { value: uS }, uS2: { value: uS2 }, uT: GEIST.G.uT, tMask: { value: typeof poolTex !== 'undefined' ? poolTex : null }, uFogC: { value: new THREE.Color(.36, .42, .52) }, uMoteC: { value: new THREE.Color(.72, .82, 1.0) }, uSat: GEIST.G.uSat },
    vertexShader: `attribute vec4 aI; uniform vec4 uS[${GEIST_SLOTS}], uS2[${GEIST_SLOTS}]; uniform float uT; varying vec2 vUv; varying float vA, vTy, vFl, vRot; varying vec3 vWP;
      void main(){ int i = int(aI.x + .5); vec4 S = uS[i]; float str = uS2[i].x, sd = aI.z, s2 = aI.w; vTy = aI.y; vUv = uv; vRot = 0.;
        if (str < .003) { vA = 0.; vFl = 0.; vWP = vec3(0.); gl_Position = vec4(0., 0., -2., 1.); return; }
        float H = S.w, k = H / 1.7; vec3 c = S.xyz; vFl = S.y; vec3 wp;
        vec3 R = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), U = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        if (aI.y < .5) { wp = c + vec3(position.x * 1.15 * k, .012, position.y * 1.15 * k); vA = str * .5; }
        else if (aI.y < 1.5) { float a = sd * 6.2832 + uT * (.04 + .05 * s2), r = (.18 + .4 * fract(sd * 7.31)) * k, sz = (.8 + .7 * fract(sd * 3.7)) * k;
          vec3 Rh = normalize(vec3(R.x, 0., R.z) + vec3(1e-4, 0., 0.)); wp = c + vec3(cos(a) * r, (.16 + .1 * s2) * k, sin(a) * r) + Rh * position.x * sz + vec3(0., position.y * sz * .55, 0.);
          vA = str * (.55 + .45 * sin(uT * .6 + sd * 20.)); vRot = sd * 6.28 + uT * .07 * (s2 - .5); }
        else { float life = fract(uT * (.05 + .06 * fract(sd * 11.3)) + sd * 3.17), a = sd * 40. + life * (1.5 + 2. * s2), r = (.12 + .32 * fract(sd * 17.9)) * k * (1. + life * .5);
          vec3 ctr = c + vec3(cos(a) * r, life * H * 1.15, sin(a) * r) + vec3(sin(uT * 1.3 + sd * 9.), 0., cos(uT * 1.1 + sd * 7.)) * .03 * k; float sz = (.010 + .016 * fract(sd * 23.1)) * max(k, .5);
          wp = ctr + R * position.x * sz + U * position.y * sz; vA = str * sin(life * 3.14159) * (.55 + .45 * sin(uT * 4. + sd * 60.)); }
        vWP = wp; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`,
    fragmentShader: `uniform sampler2D tMask; uniform vec3 uFogC, uMoteC; uniform float uT, uSat; varying vec2 vUv; varying float vA, vTy, vFl, vRot; varying vec3 vWP;
      float gh3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float gn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(gh3(i), gh3(i + vec3(1,0,0)), f.x), mix(gh3(i + vec3(0,1,0)), gh3(i + vec3(1,1,0)), f.x), f.y), mix(mix(gh3(i + vec3(0,0,1)), gh3(i + vec3(1,0,1)), f.x), mix(gh3(i + vec3(0,1,1)), gh3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ if (vA < .002) discard;
        if (vTy < .5) { float r = length(vUv - .5) * 2., a = 1. - smoothstep(.12, 1., r); gl_FragColor = vec4(0., 0., 0., a * a * vA); return; } // Kontaktschatten
        if (vTy < 1.5) { vec2 d = vUv - .5; float cs = cos(vRot), sn = sin(vRot); vec2 q = vec2(d.x * cs - d.y * sn, d.x * sn + d.y * cs) + .5;
          float n = gn3(vec3(vWP.x * 2.2, vWP.y * 3. - uT * .12, vWP.z * 2.2)) * .65 + gn3(vWP * 5.7 + uT * .05) * .35;
          float a = texture2D(tMask, q).a * smoothstep(.32, .78, n) * smoothstep(vFl, vFl + .22, vWP.y) * vA * .3; // unten weich in den Boden (keine Schnittkante)
          vec3 c = uFogC; float l = dot(c, vec3(.299, .587, .114)); c = max(vec3(0.), l + (c - l) / max(uSat, .3)); gl_FragColor = vec4(c * a, a * .35); return; }
        float a = texture2D(tMask, vUv).a; a = a * a * vA * 2.2; vec3 c = uMoteC; float l = dot(c, vec3(.299, .587, .114)); c = max(vec3(0.), l + (c - l) / max(uSat, .3)); gl_FragColor = vec4(c * a, 0.); }` });
  const fx = new THREE.Mesh(g, mat); fx.frustumCulled = false; fx.renderOrder = 960; fx.name = 'Geister_Effekte'; fx.userData.noCol = true; scene.add(fx);
  GEIST.fx = { mesh: fx, g, uS, uS2 };
}
// Staub-Lichtkegel über einem Echo (kein Licht: leuchtende, langsam ziehende Staubschicht in einem offenen Kegel)
function geister_kegelBau() {
  const geo = new THREE.CylinderGeometry(.16, 1.25, 2.7, 40, 1, true); geo.translate(0, 1.35, 0);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    uniforms: { uStr: { value: 0 }, uT: GEIST.G.uT, uC: { value: new THREE.Color(.62, .7, .86) } },
    vertexShader: `varying vec3 vN, vWP; varying float vY; void main(){ vY = uv.y; vec4 w = modelMatrix * vec4(position, 1.); vWP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uStr, uT; uniform vec3 uC; varying vec3 vN, vWP; varying float vY;
      float gh3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float gn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(gh3(i), gh3(i + vec3(1,0,0)), f.x), mix(gh3(i + vec3(0,1,0)), gh3(i + vec3(1,1,0)), f.x), f.y), mix(mix(gh3(i + vec3(0,0,1)), gh3(i + vec3(1,0,1)), f.x), mix(gh3(i + vec3(0,1,1)), gh3(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){ if (uStr < .001) discard; vec3 V = normalize(cameraPosition - vWP); float f = pow(abs(dot(normalize(vN), V)), 1.6);
        float n = gn3(vec3(vWP.x * 3.1, vWP.y * 1.1 - uT * .12, vWP.z * 3.1)) * .55 + gn3(vWP * 8.3 + vec3(0., uT * .2, 0.)) * .45;
        float a = f * smoothstep(0., .55, vY) * (1. - smoothstep(.88, 1., vY)) * (.4 + .6 * n) * uStr; gl_FragColor = vec4(uC * a, 0.); }` });
  const k = new THREE.Mesh(geo, mat); k.position.set(0, -999, 0); k.renderOrder = 958; k.name = 'Geister_Lichtkegel'; k.userData.noCol = true; scene.add(k); GEIST.kegel = k; // weit unten: beim Laden übersetzt, nie gezeichnet
}
// ---------------------------------------------------------------- Bildlook über film-Uniforms (kein neuer Pass): Entsättigung, Bleichung/Korn
function geister_filmPatch() { try { const m = filmPass.material, u = filmPass.uniforms; if (u.gSat) return; let f = m.fragmentShader;
  const A = 'uniform float time, flash,', B2 = 'c = mix(vec3(l), c, .9);', C = 'c += g * .034 * grainK *';
  if (!f.includes(A) || !f.includes(B2)) { console.warn('Geister: filmPass unbekannt – Entsättigung über film-Uniforms aus'); return; }
  f = f.replace(A, 'uniform float gSat, gBl, time, flash,').replace(B2, `c = mix(vec3(l), c, .9 * gSat);
      if (gBl > 0.) { vec3 bb = mix(2. * c * l, 1. - 2. * (1. - c) * (1. - l), step(.5, l)); c = mix(c, mix(c, bb, .55), gBl); c = mix(c, c * vec3(.97, 1., 1.05), gBl * .5); } /* Modul geister: Bleichung (Silberrest) */`);
  if (f.includes(C)) f = f.replace(C, 'c += g * .034 * (1. + gBl * 1.3) * grainK *');
  u.gSat = GEIST.G.uSat; u.gBl = GEIST.G.uBl; m.fragmentShader = f; m.needsUpdate = true; } catch (e) { console.warn('Geister: filmPass', e); } }
// Vignette/Farbsaum als Zusatz auf den Wert, den andere Module setzen (kein Zurücksetzen fremder Werte)
function geister_add(slot, u, d) { if (!u) return; const S = GEIST.look; let r = S[slot]; if (!r) r = S[slot] = { set: NaN, base: u.value };
  if (u.value !== r.set) r.base = u.value; if (Math.abs(d) < 1e-5) { if (u.value === r.set) u.value = r.base; S[slot] = null; return; } u.value = r.base + d; r.set = u.value; }
// Erinnerungs-Look an/aus (figuren_memoryLook)
function geister_look(on) { const S = GEIST.look; if (on && S.want < 1) S.ca = Math.max(S.ca, GEIST.L.caPuls); else if (!on && S.want > 0) S.ca = Math.max(S.ca, GEIST.L.caPuls * .6); S.want = on ? 1 : 0; }
function geister_lookTick(dt) { const S = GEIST.look, L = GEIST.L; S.k += Math.sign(S.want - S.k) * Math.min(Math.abs(S.want - S.k), dt / (S.want > S.k ? 1.2 : 1.6));
  const e = S.k * S.k * (3 - 2 * S.k); S.ca *= Math.exp(-dt * 2.2); if (S.ca < 2e-4) S.ca = 0;
  GEIST.G.uSat.value = 1 - (1 - L.satEcho) * e; GEIST.G.uBl.value = L.blEcho * e;
  try { geister_add('vigR', filmPass.uniforms.vig, L.vigEcho * e); geister_add('caR', filmPass.uniforms.ca, S.ca + .0015 * e); } catch (err) {} }
// ---------------------------------------------------------------- Echo-Regie: Clips je Figur (Reihenfolge = FIGUREN_ECHO), Sprecher → Gesprächs-Clip, die anderen sehen hin
// base: Ruhe-Clip je Figur (beginnt er mit „sit“, gilt er nur für sitzend platzierte Figuren; stehend → idle-Variante) · sp: Sprecher → [Figur, Clip] · blick: Figur, zu der alle sehen · cam: [Text, Figur] sieht zu Luke
const GEIST_REGIE = {
  echo_kreuzung: { base: ['nervous', 'idle2', 'listen', 'idle3', 'nervous', 'listen', 'idle2', 'idle2'], blick: 7, sp: { 'VEGAS, 2009': [7, 'erklaeren'] } },
  echo_kueche: { base: ['sit', 'arme_verschraenkt', 'listen'], sp: { 'HILDE WENDT': [0, 'talk'], 'MANN VOM AMT': [1, 'erklaeren'] } },
  echo_kinderzimmer: { base: ['sit', 'listen'], blick: 0, sp: { 'MAMA': [0, 'talk'] } },
  echo_brand: { base: ['idle3'], sp: { 'ROXY, 8': [0, 'talk'] } },
  echo_archiv: { base: ['nachdenken', 'listen'] },
  echo_messraum: { base: ['sit', 'sit', 'sit', 'sit', 'sit', 'sit', 'weinen'], blick: 6, sp: { 'EIN MÄDCHEN': [0, 'talk'] } },
  echo_1975: { base: ['idle', 'nervous', 'idle2', 'idle3', 'idle'], blick: 0, sp: { 'LARS VEGAS, 9': [1, 'talk'], 'DER MANN IN EISEN': [0, 'talk'] } },
  echo_mira: { base: ['sit', 'idle', 'idle', 'idle', 'idle', 'idle', 'idle', 'idle'], cam: ['zu dir', 0] },
  echo_kanal_ritter: { base: ['idle'] }, echo_kanal_laterne: { base: ['nervous', 'idle2', 'idle'] }, echo_nord_grab: { base: ['nachdenken', 'arme_verschraenkt', 'idle2'] },
};
const geister_echoP = i => { const F = typeof echoFigs !== 'undefined' && echoFigs[i]; return F && F.visible && F.userData.person ? F.userData.person : null; };
function geister_clip(P, k) { if (!k) k = 'idle';
  if (P.sit) k = (k === 'talk' || k === 'erklaeren') && P.acts.sit_talk ? 'sit_talk' : /^sit/.test(k) && P.acts[k] ? k : 'sit'; // sitzend platziert: nur Sitz-Clips
  else if (/^sit/.test(k)) k = 'idle2';                                                                                        // stehend: nie ein Sitz-Clip in der Luft
  return P.acts[k] ? k : 'idle'; }
function geister_regie(E) { const R = GEIST_REGIE[E.id], X = GEIST.echo; if (!R || !X) return;
  for (let i = 0; i < E.figs.length; i++) { const P = geister_echoP(i); if (!P || P.doll) continue; const k = geister_clip(P, R.base[i]); if (!P.sit) P.fixed = true; figuren_play(P, k, false, { fade: .7 }); const e = P.obj.userData.geistE; if (e) e.base = k; }
  geister_blick(R.blick !== undefined ? R.blick : -1, .4); }
function geister_blick(idx, w) { const S = idx >= 0 ? geister_echoP(idx) : null; const E = GEIST.echo && GEIST.echo.E; if (!E) return;
  for (let i = 0; i < E.figs.length; i++) { const P = geister_echoP(i); if (!P || P === S) continue; figuren_lookAt(P, S && S.rig.head ? S.rig.head : null, w); } }
// Untertitel-Zeile während eines Echos (subShow-Haken): Sprecher spricht, die anderen sehen hin; „???“ = Flüstern direkt am Ohr
function geister_zeile(t, ms, who) { const X = GEIST.echo; if (!X || X.aus) return; const R = GEIST_REGIE[X.E.id] || {}; ms = Math.max(1500, ms || 3000);
  if (who === '???') geister_fluester(true);
  const sp = R.sp && who && R.sp[who]; if (sp) { const P = geister_echoP(sp[0]); if (P && !P.doll) { const e = P.obj.userData.geistE; figuren_play(P, geister_clip(P, sp[1]), false, { fade: .45 }); if (e) e.talkT = ms / 1000; geister_blick(sp[0], .6); X.blickT = ms / 1000; } }
  if (R.cam && String(t).includes(R.cam[0])) { const P = geister_echoP(R.cam[1]); if (P) figuren_lookAt(P, 'cam', .9); } }
// ---------------------------------------------------------------- Echo an/aus: Linse, Lampen, Kegel, Ton
function geister_echoAn(E) {
  let cx = 0, cz = 0; for (const f of E.figs) { cx += f[0]; cz += f[1]; } cx /= E.figs.length || 1; cz /= E.figs.length || 1;
  const fy = E.floor !== undefined ? E.floor : (E.at[1] > 1.2 ? Y : 0);
  GEIST.echo = { E, t: 0, whT: 1.4, cx, cz, fy, aus: false, ausT: 0, blickT: 0, surge: 1 };
  geister_look(true); GEIST.look.ca = Math.max(GEIST.look.ca, GEIST.L.caPuls * 1.3);
  // Lampen im Umkreis (vorhandene virtuelle Lichter, keine neuen)
  for (const o of GEIST.lamps) if (o.L.intensity === o.set) o.L.intensity = o.base; // vorheriges Echo noch im Ausklang: Lampen erst zurück
  GEIST.lamps.length = 0; try { for (const v of vlights) { if (!(v.intensity > .01)) continue; v.getWorldPosition(GEIST.v); if (Math.hypot(GEIST.v.x - cx, GEIST.v.z - cz) < 14 && Math.abs(GEIST.v.y - fy) < 6) GEIST.lamps.push({ L: v, base: v.intensity, set: NaN, d: {} }); } } catch (e) {}
  if (GEIST.kegel) { GEIST.kegel.position.set(cx, fy, cz); GEIST.kegel.scale.set(1, 1, 1); }
  // Ton: Herzschlag (zwei Schläge), Druck, Flüsterschicht startet im Takt
  try { if (Audio.ctx) { const h = typeof kl_pick === 'function' ? kl_pick('pz_herz_', 3) : null; if (h) Audio.play(h, { gain: .5, lp: 420, dur: 2.4 });
    if (typeof kl_has === 'function' && kl_has('fx_tief_2')) Audio.play('fx_tief_2', { gain: .18, rate: .78, lp: 320 }); } } catch (e) {}
}
function geister_echoAus() { const X = GEIST.echo; if (!X) return; X.aus = true; X.ausT = 0; geister_look(false);
  try { if (Audio.ctx && typeof Audio.atemEcht === 'function') Audio.atemEcht(.07, .9); } catch (e) {} }
function geister_fluester(nah) { try { if (!Audio.ctx || typeof kl_pick !== 'function') return; const n = kl_pick('fx_fluester_', 4); if (!n) return; const X = GEIST.echo;
  if (nah) { const c = camera.position, d = GEIST.sv; camera.getWorldDirection(d); Audio.play(n, { gain: .32, rate: rand(.92, 1.0), x: c.x - d.x * .6 + d.z * .35, y: c.y, z: c.z - d.z * .6 - d.x * .35, ref: 1, dur: 2.2 }); return; }
  if (!X) return; let x = X.cx, z = X.cz; const L = []; for (let i = 0; i < X.E.figs.length; i++) if (geister_echoP(i)) L.push(i); if (L.length) { const f = X.E.figs[L[Math.floor(Math.random() * L.length)]]; x = f[0]; z = f[1]; }
  Audio.play(n, { gain: rand(.08, .15), rate: rand(.86, 1.02), x: x + rand(-.3, .3), y: X.fy + 1.4, z: z + rand(-.3, .3), ref: 1.6, dur: rand(1.4, 2.4) }); } catch (e) {} }
function geister_echoTick(dt) { const X = GEIST.echo; if (!X) return; X.t += dt; X.surge = Math.max(0, X.surge - dt * .9); const k = GEIST.look.k;
  if (!X.aus && (X.whT -= dt) < 0) { X.whT = rand(2.4, 4.8); geister_fluester(false); }
  if (X.blickT > 0 && (X.blickT -= dt) <= 0) { const R = GEIST_REGIE[X.E.id]; geister_blick(R && R.blick !== undefined ? R.blick : -1, .4); }
  if (X.aus) X.ausT += dt;
  // Lampen: leises Flackern, am Anfang ein Aufbäumen; am Ende zurück auf den Wert, den die Lampe selbst hat
  for (let i = 0; i < GEIST.lamps.length; i++) { const o = GEIST.lamps[i], L = o.L; if (L.intensity !== o.set) o.base = L.intensity;
    const dip = flickDip(o.d, .25 + 3 * X.surge, dt, .07), f = dip ? .38 + .2 * Math.random() : 1 - (.05 + .05 * Math.sin(GEIST.t * 13 + i * 2.1)) * k; L.intensity = o.base * (1 - (1 - f) * k); o.set = L.intensity; }
  if (GEIST.kegel) GEIST.kegel.material.uniforms.uStr.value = GEIST.L.kegel * k * (.85 + .15 * Math.sin(GEIST.t * .7));
  if (X.aus && k <= .001) { for (const o of GEIST.lamps) if (o.L.intensity === o.set) o.L.intensity = o.base; GEIST.lamps.length = 0; if (GEIST.kegel) { GEIST.kegel.material.uniforms.uStr.value = 0; GEIST.kegel.position.y = -999; } GEIST.echo = null; } }
// ---------------------------------------------------------------- Takt
function geister_strTick(dt) { // Fortschritt je Stärke-Quelle: folgt dem Wert mit begrenzter Rate (Flimmer-Einbrüche bewegen die Auflösung kaum)
  for (const e of GEIST.list) { const u = geister_s(e.B); if (!GEIST.str.has(u)) GEIST.str.set(u, { p: 0, mode: 0 }); }
  for (const [u, T] of GEIST.str) { const tg = Math.max(0, Math.min(1, u.value / .9)), r = dt / .5, p0 = T.p; T.p += Math.sign(tg - T.p) * Math.min(Math.abs(tg - T.p), r); if (T.p < p0 - 1e-4) T.mode = 1; else if (T.p > p0 + 1e-4) T.mode = 0; } }
function geister_sichtbar(o) { for (let p = o, n = 0; p && n < 12; p = p.parent, n++) { if (!p.visible) return false; if (p === scene) return true; } return false; }
function geister_tick(dt) { const t0 = performance.now(); GEIST.now = t0 / 1000; GEIST.t += dt;
  if (typeof FAB !== 'undefined') { if (!GEIST.fab && FAB.ok) geister_fab(); if (FAB.ghostU) GEIST.s0.value = FAB.ghostU.value; } // s0: Rückfall, falls ein Material vor FAB.ghostU übersetzt wurde
  if (!GEIST.snd && typeof Audio !== 'undefined' && Audio.ctx && typeof klang_load === 'function') { GEIST.snd = true; for (const n of ['pz_herz_1', 'pz_herz_2', 'pz_herz_3', 'fx_tief_2']) klang_load(n).catch(() => {}); }
  geister_lookTick(dt); geister_echoTick(dt); geister_strTick(dt);
  const cam = camera.position, M = GEIST, sl = M.slots; sl.length = 0; M.n.vis = M.n.nb = 0;
  for (let i = M.list.length - 1; i >= 0; i--) { const e = M.list[i];
    if (!e.obj.parent) { geister_weg(e); continue; }
    const root = e.g || e.obj.parent, vis = geister_sichtbar(e.obj) && geister_sichtbar(root);
    if (!vis) { if (e.wasVis) { e.wasVis = false; e.loc = 0; for (const R of e.rings) R.on = false; if (e.nb) for (const n of e.nb) n.visible = false; } e.vis = false; continue; }
    if (!e.wasVis) { e.wasVis = true; e.loc = 0; }
    e.vis = true; M.n.vis++; e.loc = Math.min(1, e.loc + dt / 1.1);
    const me = root.matrixWorld.elements, oe = e.obj.matrixWorld.elements, cx = me[12], fy = me[13], cz = me[14], dist = Math.hypot(cx - cam.x, fy + .9 - cam.y, cz - cam.z); e.dist = dist;
    e.H = e.P ? (e.P.h || 1.6) * Math.hypot(oe[4], oe[5], oe[6]) : (e.h || 1.75) * Math.hypot(me[4], me[5], me[6]);
    const T = M.str.get(geister_s(e.B)) || { p: 1, mode: 0 }, p = Math.min(e.loc, T.p), mode = e.loc < 1 && e.loc < T.p ? 0 : T.mode;
    // Flimmern: langsames Atmen der Helligkeit, seltene Einbrüche
    if ((e.flT -= dt) < 0) { e.flT = rand(GEIST.L.flick[0], GEIST.L.flick[1]); e.dip = rand(.06, .14); e.dipK = rand(.55, .8); }
    if (e.dip > 0) e.dip -= dt; e.boost = Math.max(0, e.boost - dt * 2.5);
    e.fl = (e.dip > 0 ? e.dipK : 1) * (.94 + .06 * Math.sin(M.t * 1.7 + e.B.uF.value.w));
    // Zeit: Zeitlupe, Stocken, Schleifensprung verdecken; beim Gehen Tempo 1 (Schrittlänge passt zum Weg – kein Gleiten)
    const P = e.P; if (P && P.mx) { const mv = P.mv && (P.mv.moving || P.mv.spd > .15);
      if (e.frz > 0) e.frz -= dt; else if (!mv && (e.st -= dt) < 0) { e.st = rand(GEIST.L.stock[0], GEIST.L.stock[1]); e.frz = rand(GEIST.L.stockMs[0], GEIST.L.stockMs[1]); e.boost = .5; M.stock++; }
      P.mx.timeScale = mv ? 1 : e.frz > 0 ? 0 : e.slow;
      const a = P.cur; if (a && a.loop === THREE.LoopRepeat) { if (a.time < e.lt - .25) { e.dip = .12; e.dipK = .6; e.boost = .6; M.wrap++; } e.lt = a.time; }
      if (e.talkT > 0 && (e.talkT -= dt) <= 0 && e.base && P.curK !== e.base) figuren_play(P, e.base, false, { fade: .6 }); }
    const B = e.B; B.uF.value.x = p; B.uF.value.y = fy; B.uF.value.z = e.H; B.uK.value.set(cx, mode, cz, e.fl);
    // Nachbild nur nah und sichtbar
    const near = dist < GEIST.L.nbNah && p > .3 && M.n.nb < GEIST.L.nbMax && !(P && P.cur && P.cur.timeScale === 0); if (near && !e.nb && e.P) geister_nbBau(e); // höchstens nbMax Figuren, eingefrorene (weiss) ohne
    if (e.nb) { for (const R of e.rings) R.on = near; for (const n of e.nb) n.visible = near; if (near) M.n.nb++; if (e.BA) e.BA.uE.value = 1 - e.boost * .6; }
    const sv = geister_s(B).value, str = (sv <= 1 ? Math.min(sv / .45, 1) : 1) * p * e.fl; e.str = str;
    if (str > .01 && dist < GEIST.L.fxR) sl.push(e);
  }
  // Effekt-Plätze: die nächsten 8
  const F = M.fx; if (F) { sl.sort((a, b) => a.dist - b.dist); const n = Math.min(GEIST_SLOTS, sl.length);
    for (let s = 0; s < GEIST_SLOTS; s++) { if (s < n) { const e = sl[s], u = e.B.uF.value, k = e.B.uK.value; F.uS[s].set(k.x, u.y, k.z, e.H); F.uS2[s].set(e.str, 0, 0, 0); } else F.uS2[s].x = 0; }
    F.g.instanceCount = n ? GEIST_SLOTS * GEIST_JE : 0; M.n.fx = n; }
  M.ms = performance.now() - t0; }
// Mannequin-Geister der Basis (FAB.figs, Echo-Puppen ohne echte Besetzung) auf denselben Look umstellen
function geister_fab() { GEIST.fab = true; try { if (!FAB.figs) return; for (const F of FAB.figs) { if (F.g.userData.figMat !== echoMat) continue; const root = F.mx && F.mx.getRoot ? F.mx.getRoot() : null; if (!root || root.userData.geistE) continue;
  geister_bau(root, { g: F.g, h: 1.94 }); } } catch (e) { console.warn('Geister: Mannequins', e); } }
// ---------------------------------------------------------------- Einhängen
geister_filmPatch(); geister_fxBau(); geister_kegelBau();
{ const s0 = ECHO_CAST.start, e0 = ECHO_CAST.end;
  ECHO_CAST.start = async E => { try { geister_echoAn(E); } catch (e) { console.warn('Geister: Echo an', e); } if (s0) await s0(E); try { geister_regie(E); } catch (e) { console.warn('Geister: Regie', e); } };
  ECHO_CAST.end = E => { try { geister_echoAus(E); } catch (e) { console.warn('Geister: Echo aus', e); } return e0 ? e0(E) : undefined; }; }
if (typeof subShow === 'function') subShow = (o => function (t, ms, who) { try { geister_zeile(t, ms, who); } catch (e) {} return o.apply(this, arguments); })(subShow);
WORLD_MODS.push(['Geister', async () => { geister_fab(); }]);
WORLD_TICK.push(dt => geister_tick(Math.min(dt, .1)));
window.__geister = { S: GEIST, REGIE: GEIST_REGIE, look: on => geister_look(on),
  stat: () => ({ ms: +GEIST.ms.toFixed(3), list: GEIST.list.length, vis: GEIST.n.vis, nb: GEIST.n.nb, fx: GEIST.n.fx, stock: GEIST.stock, wrap: GEIST.wrap, sat: +GEIST.G.uSat.value.toFixed(2), lamps: GEIST.lamps.length, calls: renderer.info.render.calls, progs: renderer.info.programs.length }),
  echo: id => { const E = ECHOES.find(x => x.id === id); if (!E) return 'unbekannt'; echoSeen.delete(id); state.talking = false; playEcho(E); return 'ok'; }, // Testzugriff: Nachbild erneut abspielen
  halt: v => { if (typeof echoMat !== 'undefined') echoMat.opacity = v; } }; // Stärke aller Echo-Geister festhalten (0 … .32)
