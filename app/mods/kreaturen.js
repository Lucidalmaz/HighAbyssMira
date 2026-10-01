// =====================================================================  KREATUREN (Q-1, CLAUDE.md §19–§22): Fleisch, Skelette, Bewegung und Laute der Wendigo-Formen
// Was hier lebt (nur Aussehen, Bewegung, Ton – die Begegnungs- und Questlogik bleibt in hungrige.js / kapitel6.js):
//  · kr_fleischMat / kr_haut: gemeinsame Designsprache aller Geschälten – Muskelfasern (Fab „Muscle Tissue“, clacydarch, CC-BY) dreiplanar, Sehnen, Adern,
//    nasse Oberfläche (Rauheit wechselt fleckig), Blut dunkler in den Falten, Licht dringt rötlich um die Kanten (Wrap-Beleuchtung als Subsurface-Anmutung),
//    eingesunkene Rippen, durchstoßende Wirbel, eine asymmetrische Wunde mit Knochen darin.
//  · kr_hirschding: die wahre Gestalt mit echtem Skelett und eigenen Clips (tools/kreaturen.mjs: aufrecht auf zwei Hinterläufen, „zwei Tritte je Schritt“, Sturm auf allen vieren,
//    Rückwärtsflucht mit falsch knickenden Sprunggelenken, Arm vors Gesicht, Aufstieg aus dem Haufen, Schrei, Packen). Kein Atem – nur Zucken. Kopf dreht ohne Hals, in Rasten.
//  · kr_wolf: der Geschälte Wolf („Grimhound“, DM-913, CC-BY) mit Clips unter den alten Namen (Rest, RestToGoBackUp, IdleAggressive, Walk, Run, JumpBite, Death …) – er atmet schwer und nass, lahmt vorn rechts.
//  · Bewegungsschicht: Abspieltempo = Wegtempo (kein Gleiten), Hirschding im 9-Bilder-Takt, Laufen/Lauern/Sturm/Flucht aus dem Jagdzustand (K6J) und dem Höhepunkt gewählt.
//  · Audio.wendigo(art, x, y, z, gain): Laute aus echten Aufnahmen (Sonniss GDC; tools/klang_wendigo.py) – Knochen, nasse Schritte, Atem, Knurren, Ruf, reißendes Fleisch, Schnüffeln, Hufe.
const KR = { Q2: new THREE.Quaternion(), Q3: new THREE.Quaternion(), an: false, tex: null, mats: {}, dt: null, dtP: null, wolf: null, live: new Set(), V: new THREE.Vector3(), Q: new THREE.Quaternion(), E: new THREE.Euler(), M: new THREE.Matrix4(), snd: false };
// ---------------------------------------------------------------- Fleisch-Shader (MeshStandardMaterial erweitern)
const KR_GLSL_NOISE = `float krH(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float krNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(krH(i), krH(i + vec3(1,0,0)), f.x), mix(krH(i + vec3(0,1,0)), krH(i + vec3(1,1,0)), f.x), f.y), mix(mix(krH(i + vec3(0,0,1)), krH(i + vec3(1,0,1)), f.x), mix(krH(i + vec3(0,1,1)), krH(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
// o: { mus: Muskelanteil 0…1, scale: Faser-Kachel je Meter, veins, wet, wrap, sss: [r,g,b], rib: [Tiefe, Abstand, zMin, zMax, yMin, yMax], ridge: [Höhe, Abstand, zMin, zMax],
//      wound: [x, y, z, r], seam: [Halbbreite, zMin, zMax, ySchwelle] (Fuchs: die Naht auf dem Rücken), bump }
function kr_fleischMat(base, o = {}, key = 'kr') { const T = KR.tex, m = base ? base.clone() : new THREE.MeshStandardMaterial({ color: 0x6a2420, roughness: .4 });
  if (!m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) { /* Physical (Rabe M_Crow) + Fleisch + Grafik-Bausteine sprengten 16 Textureinheiten – Shader ungültig */ const n = new THREE.MeshStandardMaterial({ map: m.map || null, color: m.color ? m.color.clone() : new THREE.Color(.5, .2, .2), roughness: .45 }); m.dispose && m.dispose(); return kr_fleischMat(n, o, key); }
  const U = { krMus: { value: T && T.mus }, krHoe: { value: T && T.hoe }, krSeh: { value: T && T.seh }, krBind: { value: new THREE.Matrix4() }, krS: { value: 1 },
    krP: { value: new THREE.Vector4(o.scale ?? 3.2, T ? (o.mus ?? .9) : 0, o.veins ?? .6, o.wet ?? .8) }, krSss: { value: new THREE.Color(...(o.sss || [.55, .06, .04])) }, krWrap: { value: o.wrap ?? .55 },
    krRib: { value: new THREE.Vector4(...(o.rib || [0, .06, 0, 0]).slice(0, 4)) }, krRibY: { value: new THREE.Vector2(...(o.rib ? o.rib.slice(4, 6) : [0, 0])) },
    krRidge: { value: new THREE.Vector4(...(o.ridge || [0, .07, 0, 0])) }, krW: { value: new THREE.Vector4(...(o.wound || [0, -99, 0, .001])) }, krSeam: { value: new THREE.Vector4(...(o.seam || [0, 0, 0, 2])) }, krBump: { value: o.bump ?? 1 }, krAll: { value: o.nass ?? 0 } };
  m.metalnessMap = null; m.metalness = 0; m.aoMap = null; /* Schlusstest: drei Fleisch-Texturen + volle PBR-Sätze + Schatten > 16 Textureinheiten („Trying to use 16 texture units“) – Fleisch braucht weder Metall- noch AO-Karte */
  m.userData.krU = U; m.name = (m.name || '') + '·Fleisch';
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>
uniform mat4 krBind; uniform float krS; uniform vec4 krRib; uniform vec2 krRibY; uniform vec4 krRidge; varying vec3 vKrO; varying vec3 vKrN; varying float vKrRib; varying float vKrRidge;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{ vec3 krO = (krBind * vec4(transformed, 1.)).xyz; vec3 krN = normalize(mat3(krBind) * objectNormal); vKrO = krO; vKrN = krN; float d = 0.;
  float inR = step(krRib.z, krO.z) * step(krO.z, krRib.w) * step(krRibY.x, krO.y) * step(krO.y, krRibY.y); float fl = smoothstep(.35, .8, abs(krN.x)) * inR;
  float rib = .5 + .5 * cos(6.2832 * krO.z / max(krRib.y, .01)); vKrRib = fl * smoothstep(.55, 1., rib); d -= krRib.x * fl * (1. - rib);
  float inZ = step(krRidge.z, krO.z) * step(krO.z, krRidge.w); float top = smoothstep(.55, .9, krN.y) * (1. - smoothstep(.015, .045, abs(krO.x))) * inZ;
  float sp = pow(max(0., cos(6.2832 * krO.z / max(krRidge.y, .01))), 6.); vKrRidge = top * sp; d += krRidge.x * top * sp;
  transformed += objectNormal * d / krS; }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform sampler2D krMus; uniform sampler2D krHoe; uniform sampler2D krSeh; uniform vec4 krP; uniform vec3 krSss; uniform float krWrap; uniform vec4 krW; uniform vec4 krSeam; uniform float krBump; uniform float krAll;
varying vec3 vKrO; varying vec3 vKrN; varying float vKrRib; varying float vKrRidge;
${KR_GLSL_NOISE}
void krWrapLight(IncidentLight L, vec3 n, vec3 dc, inout ReflectedLight R){ float nl = dot(n, L.direction); float w = max(0., (nl + krWrap) / (1. + krWrap)) - max(0., nl); R.directDiffuse += L.color * dc * krSss * w * 1.6; }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
vec3 krKw = pow(abs(vKrN), vec3(4.)); krKw /= (krKw.x + krKw.y + krKw.z + 1e-4); vec2 krA = vKrO.zy * krP.x, krB = vKrO.xz * krP.x, krC = vKrO.xy * krP.x;
vec3 krMu = texture2D(krMus, krA).rgb * krKw.x + texture2D(krMus, krB).rgb * krKw.y + texture2D(krMus, krC).rgb * krKw.z;
float krHo = texture2D(krHoe, krA).r * krKw.x + texture2D(krHoe, krB).r * krKw.y + texture2D(krHoe, krC).r * krKw.z;
vec3 krSe = texture2D(krSeh, krA * .7).rgb * krKw.x + texture2D(krSeh, krB * .7).rgb * krKw.y + texture2D(krSeh, krC * .7).rgb * krKw.z;
float krN1 = krNoise(vKrO * 9.), krN2 = krNoise(vKrO * 23. + 7.);
float krMask = krP.y;
if (krSeam.x > 0.) { float lat = abs(vKrO.x), hw = krSeam.x * (.55 + .9 * krN1) * smoothstep(krSeam.y, krSeam.y + .06, vKrO.z) * (1. - smoothstep(krSeam.z - .06, krSeam.z, vKrO.z)); krMask = max(krMask, (1. - smoothstep(hw * .7, hw, lat)) * step(krSeam.w, vKrN.y)); }
float krWd = distance(vKrO, krW.xyz) / krW.w * (.8 + .4 * krN1), krWm = 1. - smoothstep(.75, 1., krWd);
vec3 krFl = krMu * mix(.8, 1.3, krHo) * 1.55;
krFl = mix(krFl, krFl * vec3(.5, .14, .11), (1. - krHo) * .5);
float krVe = smoothstep(.955, .99, 1. - abs(krN2 * 2. - 1.)) * krP.z; krFl = mix(krFl, vec3(.09, .025, .06), krVe * .75);
krFl = mix(krFl, krSe * vec3(.95, .86, .78), clamp(vKrRidge * 1.2 + vKrRib * .45, 0., 1.));
diffuseColor.rgb = mix(diffuseColor.rgb, krFl, krMask);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.16, .015, .012), krWm);
diffuseColor.rgb = mix(diffuseColor.rgb, krSe * vec3(.9, .82, .72) * (.6 + .4 * step(.5, fract(vKrO.y * 22.))), krWm * (1. - smoothstep(.25, .55, krWd)));
float krWet = max(max(krMask, krWm), krAll);`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, mix(.14, .55, smoothstep(.3, .8, krN1)) * mix(.8, 1.2, krHo), krP.w * krWet);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{ vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float hx = dFdx(krHo), hy = dFdy(krHo); vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
  vec3 gr = sign(det) * (hx * r1 + hy * r2) * krBump * .02 * krWet; normal = normalize(abs(det) * normal - gr); }`)
      .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );').join('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight ); krWrapLight( directLight, geometryNormal, material.diffuseColor, reflectedLight );')); };
  m.customProgramCacheKey = () => 'krFleisch' + (o.seam ? 'N' : '') ; m.needsUpdate = true; return m; }
// Haut einer Kreatur auf Fleisch umstellen: jedes Netz bekommt seine eigene Bind-Matrix (Modellraum in Metern), Fell/Federn verschwinden oder bleiben (Naht)
function kr_haut(root, o, keepFur = false) { const none = KR.none || (KR.none = new THREE.MeshBasicMaterial({ visible: false })); root.updateMatrixWorld(true);
  root.traverse(m => { if (!m.isMesh) return; const ms = [].concat(m.material); const out = ms.map(x => { if (!keepFur && /fur|hair|feather/i.test(x.name || '') && !/Dreadhound/.test(x.name || '')) return none; if (/eye|teeth|Hair/i.test(x.name || '')) return x;
      const f = kr_fleischMat(x, o); const B = m.isSkinnedMesh ? m.bindMatrix : m.matrix; f.userData.krU.krBind.value.copy(B); f.userData.krU.krS.value = new THREE.Vector3().setFromMatrixColumn(B, 0).length() || 1; return f; });
    m.material = Array.isArray(m.material) ? out : out[0]; }); return root; }
// Lage eines Knochens im Modellraum (Bindepose) – für Wunde/Halsring
function kr_knochenOrt(root, re) { let p = null; root.traverse(m => { if (p || !m.isSkinnedMesh) return; const S = m.skeleton; S.bones.forEach((b, i) => { if (!p && re.test(b.name)) p = new THREE.Vector3().setFromMatrixPosition(KR.M.copy(S.boneInverses[i]).invert()); }); }); return p; }
// Formen (gemeinsame Sprache, eigene Akzente): Werte in Metern im Modellraum (y oben, +z vorn, +x links)
const KR_FORM = {
  // Geschältes Reh: fast nur Muskel, eingesunkene Rippen, Wirbel stoßen durch, links am Schulterblatt eine offene Wunde mit Knochen
  reh: { mus: .94, scale: 6, veins: .7, wet: .9, wrap: .6, rib: [.012, .055, -.28, .3, .55, 1.02], ridge: [.024, .065, -.55, .4], wound: [.13, .86, .36, .1], bump: .6 },
  // Geschälter Wolf: eigenes Fleisch des Modells bleibt sichtbar, darüber Nässe, Adern, offene Flanke rechts mit Rippen
  wolf: { mus: .45, scale: 5, veins: .55, wet: .85, wrap: .5, wound: [-.15, .58, -.05, .13], bump: .8, nass: .7 },
  // Hirschding: sein Knochen-/Fleischbild bleibt, nur Nässe, Adern, rote Lichtkanten
  hd: { mus: 0, veins: .35, wet: .75, wrap: .7, sss: [.5, .08, .05], bump: .4, nass: .65 },
  // der falsche Rabe beim Aufreißen
  rabe: { mus: 1, scale: 9, veins: .8, wet: 1, wrap: .6, bump: 1.4 },
  // Fuchs: „hinten den Reißverschluss vergessen“ – Fell bleibt, auf dem Rücken klafft eine nasse Naht
  fuchs: { mus: 0, scale: 7, veins: .5, wet: .9, wrap: .4, seam: [.022, -.2, .27, .35], bump: 1 },
};
function kr_form(V, art) { if (!V || V.krForm === art || !KR.tex) return false; const o = Object.assign({}, KR_FORM[art]);
  if (art === 'hals' || art === 'hals_k') { const p = kr_knochenOrt(V.m, /Neck2$|-Neck2$/) || kr_knochenOrt(V.m, /Neck/); if (!p) return false; Object.assign(o, { mus: 0, scale: art === 'hals_k' ? 12 : 4, veins: .5, wet: 1, wrap: .5, wound: [p.x, p.y, p.z, art === 'hals_k' ? .045 : .16], bump: .8 }); }
  kr_haut(V.m, o, art === 'fuchs' || art === 'hals' || art === 'hals_k'); V.krForm = art; return true; }
// ---------------------------------------------------------------- Laden (erst wenn Kapitel 6 läuft – nie mitten in einer Szene)
async function kr_tex() { if (KR.tex) return KR.tex; const L = new THREE.TextureLoader(), ld = async (f, srgb) => { const t = await L.loadAsync('assets/ms/wendigo/' + f); t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  try { const [mus, hoe, seh] = await Promise.all([ld('muskel_faser.jpg', true), ld('muskel_hoehe.jpg'), ld('sehne.jpg', true)]); KR.tex = { mus, hoe, seh }; } catch (e) { console.warn('Kreaturen: Fleischtexturen', e); } return KR.tex; }
async function kr_laden() { if (KR.an) return; KR.an = true; await kr_tex(); kr_klang();
  try { const src = await msModel('wendigo', 'wolf_geschaelt.glb'); KR.wolf = { src, clips: src.animations || [], meta: (src.userData && src.userData.motion) || {} }; } catch (e) { console.warn('Kreaturen: Geschälter Wolf fehlt – Rückfall Tierpaket', e); }
  try { const V = KR.wolf && kr_wolf(); if (V) { V.g.visible = true; V.g.position.set(player.pos.x, -60, player.pos.z); if (renderer.compileAsync) await renderer.compileAsync(V.g, camera, scene); V.g.visible = false; KR.live.delete(V); scene.remove(V.g); } } catch (e) { console.warn('Kreaturen: Vorwärmen', e); } // Shader vorab, kein Ruckler beim ersten Auftritt
  try { await kr_hirschding(); } catch (e) { console.warn('Kreaturen: Hirschding', e); } }
async function kr_hirschding() { if (KR.dt) return KR.dt; if (KR.dtP) return KR.dtP; KR.dtP = (async () => { await kr_tex();
  const src = await msModel('wendigo', 'hirschding_rig.glb'), sk = await figuren_skc(), o = sk(src);
  o.traverse(m => { if (!m.isMesh) return; m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false;
    m.material = [].concat(m.material).map(x => { if (/eye/i.test(x.name || '')) { const c = x.clone(); c.emissive = new THREE.Color(0x6a1c08); c.emissiveIntensity = 1.6; c.roughness = .95; c.metalness = 0; c.color.multiplyScalar(.5); return c; } // Glut hinter Milchglas
      if (/teeth/i.test(x.name || '')) { const c = x.clone(); c.roughness = .5; c.metalness = 0; return c; } const c = x.clone(); c.metalness = 0; return c; });
    if (m.material.length === 1) m.material = m.material[0]; });
  kr_haut(o, KR_FORM.hd, true); const mx = new THREE.AnimationMixer(o), A = {}; for (const c of src.animations || []) A[c.name] = mx.clipAction(c);
  const head = o.getObjectByName('head'); KR.dt = { o, mx, A, meta: (src.userData && src.userData.motion) || {}, cur: null, name: '', acc: 0, v: 0, jv: 0, lp: new THREE.Vector3(), jp: new THREE.Vector3(), head, hy: 0, kill: 0, kills: 0, mT: -1, Q: new THREE.Quaternion() };
  kr_spiel(KR.dt, 'stehen', 0); mx.update(.01); return KR.dt; })(); return KR.dtP; }
function kr_spiel(K, name, fade = .2, once = false) { const a = K.A[name]; if (!a || K.name === name) return a; a.reset(); a.timeScale = 1; const m = K.meta[name] || {};
  if (once || m.loop === false) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else a.setLoop(THREE.LoopRepeat, Infinity);
  if (fade > 0 && K.cur) { a.fadeIn(fade).play(); K.cur.fadeOut(fade); } else { if (K.cur) K.cur.stop(); a.play(); } K.cur = a; K.name = name; return a; }
// Geschälter Wolf als Tier im Format von leben_beast (V.A/V.cur/V.mx – leben_play, leben_beastMove, leben_beastUpd funktionieren unverändert)
function kr_wolf() { const B = KR.wolf; if (!B || typeof leben_S === 'undefined' || !leben_S.skc) return null; const m = leben_S.skc(B.src);
  m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } }); if (KR.tex) kr_haut(m, KR_FORM.wolf, true);
  const g = new THREE.Group(); g.add(m); g.visible = false; g.userData.noCol = true; scene.add(g); const mx = new THREE.AnimationMixer(m);
  const V = { g, m, mx, A: leben_anims(mx, B.clips), cur: null, st: 'off', t: 0, tx: 0, tz: 0, sp: 0, gy: 0, ty: 0, skip: false, kr: 'wolf', krForm: 'wolf', meta: B.meta, lp: new THREE.Vector3(), v: 0, atemT: 1, mT: -1 };
  leben_play(V, 'IdleBreathe', 0); KR.live.add(V); return V; }
// hungrige_nackt (Geschältes Reh): Fleisch statt des alten Einheitsmaterials; true = erledigt
function kr_nackt(V) { if (!V || !KR.tex) return false; if (V.kr) return true; kr_form(V, 'reh'); V.krReh = true; V.lp = new THREE.Vector3(); V.v = 0; V.mT = -1; KR.live.add(V); return true; }
function kr_rabeFleisch() { return KR.tex ? kr_fleischMat(null, KR_FORM.rabe) : null; }
// ---------------------------------------------------------------- Laute (Aufnahmen; tools/klang_wendigo.py)
const KR_KLANG = { knochen: 6, schritt: 6, atem: 3, knurr: 4, ruf: 3, fleisch: 3, schnueff: 2, huf: 4, stoehn: 3 };
function kr_klang() { if (KR.snd || typeof klang_load !== 'function' || !Audio.ctx) return; KR.snd = true; for (const [k, n] of Object.entries(KR_KLANG)) for (let i = 1; i <= n; i++) klang_load('wd_' + k + '_' + i); }
Audio.wendigo = function (art, x, y, z, gain = .6, o = {}) { if (!this.ctx) return false; const n = KR_KLANG[art]; if (!n) return false; const ok = []; for (let i = 1; i <= n; i++) if (this.buf['wd_' + art + '_' + i]) ok.push(i); if (!ok.length) return false;
  let i = ok[Math.floor(Math.random() * ok.length)]; if (ok.length > 1 && i === KR['last_' + art]) i = ok[(ok.indexOf(i) + 1) % ok.length]; KR['last_' + art] = i;
  this.play('wd_' + art + '_' + i, Object.assign({ gain, vary: .06, varyGain: .1, x, y, z, ref: o.ref || 3 }, o)); return true; };
function kr_ton(art, x, y, z, gain, alt, o) { if (Audio.wendigo && Audio.wendigo(art, x, y, z, gain, o)) return; if (alt) alt(); }
// ---------------------------------------------------------------- Bewegungsschicht
const KR_LOK = { gehen: 1, lauern: 1, sturm: 1, flucht: 1, Walk: 1, Run: 1 };
function kr_dtTick(dt) { const D = typeof hungrige_S !== 'undefined' ? hungrige_S.dt : null, K = D && D.kr; if (!K) return; if (!D.g.visible) { K.acc = 0; K.lp.copy(D.g.position); return; }
  const C = hungrige_S.cine, J = typeof K6J !== 'undefined' ? K6J : null, p = D.g.position; let want = 'stehen', speed = 0, step9 = false, fade = .2;
  { const d = Math.hypot(p.x - K.lp.x, p.z - K.lp.z) / Math.max(dt, 1e-3); K.lp.copy(p); K.v += (Math.min(d, 9) - K.v) * Math.min(1, dt * 5); }
  if (J) { const d = Math.hypot(J.p.x - K.jp.x, J.p.z - K.jp.z) / Math.max(dt, 1e-3); K.jp.copy(J.p); K.jv += (Math.min(d, 9) - K.jv) * Math.min(1, dt * 5); if (J.kills > K.kills) { K.kills = J.kills; K.kill = .9; } }
  if (K.kill > 0) { K.kill -= dt; want = 'packen'; fade = 0; }
  else if (C && C.dt === D) { const ph = C.ph; if (ph === 'rise') { want = 'aufstieg'; step9 = true; fade = 0; } else if (ph === 'come') { want = 'gehen'; speed = K.v; } else if (ph === 'flee') { want = 'flucht'; speed = K.v; step9 = true; } else if (ph === 'flash') want = 'schrei'; else if ((C.recoilT || 0) > .05) want = 'zurueck'; else want = 'stehen'; }
  else if (J && J.aktiv && /lauern|sturm|flucht/.test(J.st)) { step9 = true; speed = K.jv; if (J.st === 'sturm') want = speed > 2.6 ? 'sturm' : 'lauern'; else if (J.st === 'flucht') want = (J.fleeT || 0) < .55 ? 'zurueck' : 'flucht'; else want = speed > .12 ? (speed > 2.2 ? 'sturm' : 'lauern') : 'stehen'; }
  if (K.force) { want = K.force; speed = K.forceV || 0; step9 = false; } // Testzugriff (__kr.zeige)
  const a = kr_spiel(K, want, step9 ? 0 : fade); const m = K.meta[want] || {};
  if (a && KR_LOK[want] && m.speed) a.timeScale = THREE.MathUtils.clamp(speed / Math.abs(m.speed), .25, 2.2); else if (a && want === 'aufstieg') a.timeScale = 2; else if (a) a.timeScale = 1;
  // Film mit fehlenden Bildern: Skelett nur 9-mal je Sekunde weiterstellen (Jagd, Aufstieg, Flucht); sonst flüssig
  K.acc += dt; if (step9 && K.acc < 1 / 9) return; K.mx.update(K.acc); K.acc = 0;
  // Kopf dreht ohne Hals zu Luke – in Rasten (≈ 20°), nicht beim Sturm
  if (K.head && want !== 'sturm' && want !== 'aufstieg') { const cam = camera.position, yaw = Math.atan2(cam.x - p.x, cam.z - p.z) - D.g.rotation.y; let d = Math.atan2(Math.sin(yaw), Math.cos(yaw)); d = THREE.MathUtils.clamp(d, -1.4, 1.4);
    const r = Math.round(d / .35) * .35; if (Math.abs(r - K.hy) > .01) { K.hy = r; if (D.g.visible && Math.hypot(cam.x - p.x, cam.z - p.z) < 14) kr_ton('knochen', p.x, 2.2, p.z, .25, null, { obj: D.g, h: 2.2 }); }
    K.head.parent.updateWorldMatrix(true, false); K.head.updateWorldMatrix(false, false); K.head.getWorldQuaternion(KR.Q2); K.Q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, K.hy); KR.Q2.premultiply(K.Q);
    K.head.parent.getWorldQuaternion(KR.Q3).invert(); K.head.quaternion.copy(KR.Q3.multiply(KR.Q2)); } }
// Geschälte (Wolf, Reh): Abspieltempo = Wegtempo, Atem hörbar, Reh lahmt hinten links
function kr_tierTick(dt) { for (const V of KR.live) { if (!V.g.visible) { V.lp.copy(V.g.position); continue; } const p = V.g.position, cam = camera.position, dc = Math.hypot(p.x - cam.x, p.z - cam.z);
  const d = Math.hypot(p.x - V.lp.x, p.z - V.lp.z) / Math.max(dt, 1e-3); V.lp.copy(p); V.v += (Math.min(d, 10) - V.v) * Math.min(1, dt * 5);
  if (V.kr === 'wolf' && V.cur) { const nm = V.cur === V.A.Walk ? 'Walk' : V.cur === V.A.Run ? 'Run' : null; if (nm && V.meta[nm]) V.cur.timeScale = THREE.MathUtils.clamp(V.v / V.meta[nm].speed, .2, 2.2);
    const atmet = V.cur === V.A.IdleAggressive || V.cur === V.A.IdleBreathe || V.cur === V.A.Walk; if (atmet && dc < 11) { V.atemT -= dt; if (V.atemT < 0) { V.atemT = V.cur === V.A.IdleAggressive ? 1.6 : 2.4; kr_ton('atem', p.x, .6, p.z, V.cur === V.A.IdleAggressive ? .32 : .2, null, { obj: V.g, h: .6 }); } } }
  if (V.krReh && V.cur && V.mx.time !== V.mT && dc < 30) { V.mT = V.mx.time; const bL = V.krLeg || (V.krLeg = V.m.getObjectByName('DeerDoe_-L-Calf') || null); if (bL && V.v > .1) { KR.Q.setFromAxisAngle(KR.V.set(1, 0, 0), .35 + .2 * Math.sin(V.mx.time * 6)); bL.quaternion.multiply(KR.Q); } } } }
// ---------------------------------------------------------------- Das Lichtschiff (Bibel §2: „Von unten: Rippen, eine dünne leuchtende Haut, innen ein Licht wie eine riesige Flamme. Von nahem: gewachsene Rippen, Haut, die atmet.“)
// Der Blech-Untertasse des Grundspiels (Nieten, Panelfugen, Lichtschlitze) werden Haut und Rippen gegeben: dieselbe Silhouette, dieselben Lichter/Strahlen (kino.js, kapitel1.js),
// aber eine warme, von innen durchleuchtete Membran zwischen gewachsenen, ungleichen Knochenrippen; die Haut wölbt sich zwischen den Rippen und atmet langsam.
const KR_LS = { u: { uT: { value: 0 }, uRibs: { value: 26 }, uGlow: { value: 1 } }, an: false };
async function kr_lichtschiff() { if (typeof ufo === 'undefined' || KR_LS.an) return; const hull = ufo.children.find(o => o.isMesh && o.geometry.type === 'LatheGeometry'); if (!hull) return; KR_LS.an = true;
  const dome = ufo.children.find(o => o.isMesh && o.geometry.type === 'SphereGeometry'), band = ufo.children.find(o => o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.radiusTop > 7);
  const U = KR_LS.u, mk = (em = 0xffc58a) => { const haut = new THREE.MeshStandardMaterial({ color: 0x4a2c24, roughness: .42, metalness: 0, emissive: em, emissiveIntensity: 1, side: THREE.FrontSide });
  haut.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
    sh.vertexShader = 'uniform float uT, uRibs; varying float vRib; varying vec3 vLs;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      { float a = atan(transformed.z, transformed.x), r = length(transformed.xz); float rb = abs(sin(a * uRibs * .5 + sin(r * 1.7) * .25)); vRib = rb; vLs = transformed;
        float br = .55 + .45 * sin(uT * .62 + r * .35); transformed += objectNormal * rb * (.05 + .05 * br) * smoothstep(.8, 2.6, r) * (1. - smoothstep(6.9, 7.3, r)); }`);
    sh.fragmentShader = 'uniform float uT, uGlow; varying float vRib; varying vec3 vLs;\n' + KR_GLSL_NOISE + '\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      float lsN = krNoise(vLs * 1.7), lsV = smoothstep(.97, .995, 1. - abs(krNoise(vLs * 2.6 + 3.) * 2. - 1.)) * .55; diffuseColor.rgb *= .65 + .5 * lsN; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.12, .03, .03), lsV * .7);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      { float thin = pow(vRib, 1.6), br = .7 + .3 * sin(uT * .62 + length(vLs.xz) * .35), under = vLs.y < .2 ? 1.35 : .8;
        totalEmissiveRadiance = emissive * (.08 + .95 * thin) * br * under * (1. - lsV * .8) * (.7 + .5 * lsN) * (1.35 - .6 * smoothstep(1.5, 7., length(vLs.xz))) * uGlow; }`); };
  haut.customProgramCacheKey = () => 'lichtschiffHaut'; return haut; }; hull.material = mk(); if (dome) { dome.material = mk(0xffe2b8); dome.material.emissive.multiplyScalar(3); } /* die Kuppel pulsiert über ufo.userData.tick (emissiveIntensity) */ if (band) band.visible = false; if (ufo.userData.dots) ufo.userData.dots.visible = false;
  // gewachsene Rippen: entlang des Rumpfprofils, ungleich dick, an den Enden spitz, leicht gekrümmt – ein Netz, ein Zeichenaufruf
  try { const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js'); const prof = hull.geometry.parameters.points.filter(p => p.x > .85 && !(p.y < -.85 && p.x < 2.3)), L = [], R = U.uRibs.value;
    for (let i = 0; i < R; i++) { const a = (i + .5) / R * Math.PI * 2 + Math.sin(i * 7.3) * .03, th = .08 + .05 * (.5 + .5 * Math.sin(i * 3.1)), pts = prof.map((p, k) => { const w = Math.sin(k * 1.9 + i) * .04; return new THREE.Vector3(Math.cos(a + w * .05) * (p.x + .05), p.y + .04 + w, Math.sin(a + w * .05) * (p.x + .05)); });
      const c = new THREE.CatmullRomCurve3(pts), G = new THREE.TubeGeometry(c, 60, th, 7, false), P = G.attributes.position, v = new THREE.Vector3(), cp = new THREE.Vector3();
      for (let k = 0; k < P.count; k++) { const u = Math.floor(k / 8) / 60, tp = Math.min(1, Math.min(u, 1 - u) * 6) ** .7; c.getPointAt(Math.min(1, u), cp); v.fromBufferAttribute(P, k).sub(cp).multiplyScalar(.15 + .85 * tp).add(cp); P.setXYZ(k, v.x, v.y, v.z); } G.computeVertexNormals(); L.push(G); }
    { const ring = new THREE.TorusGeometry(7.22, .17, 8, 160); ring.rotateX(Math.PI / 2); ring.translate(0, -.03, 0); L.push(ring); }
    const knochen = new THREE.MeshStandardMaterial({ color: 0xcdbca2, roughness: .62, metalness: 0, map: KR.tex ? KR.tex.seh : null, emissive: 0x5a3a24, emissiveIntensity: .25 });
    const ribs = new THREE.Mesh(mergeGeometries(L.map(g => g.index ? g.toNonIndexed() : g)), knochen); ribs.castShadow = true; hull.add(ribs); KR_LS.ribs = ribs; } catch (e) { console.warn('Lichtschiff: Rippen', e); } }
// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt) => { if (KR_LS.an && typeof ufo !== 'undefined' && ufo.position.y > -500) KR_LS.u.uT.value += dt; if (!state.started || menu.attract) return; if (!KR.an) { if (typeof wald_frei === 'function' && wald_frei()) kr_laden(); return; }
  try { kr_dtTick(dt); } catch (e) { console.warn('Kreaturen: Hirschding', e); KR.dt = null; if (typeof hungrige_S !== 'undefined' && hungrige_S.dt) hungrige_S.dt.kr = null; }
  try { kr_tierTick(dt); } catch (e) { console.warn('Kreaturen: Tiere', e); KR.live.clear(); } });
WORLD_MODS.push(['Kreaturen (Fleisch, Skelette, Wendigo-Laute, Lichtschiff)', async () => { try { await kr_tex(); await kr_lichtschiff(); } catch (e) { console.warn('Kreaturen: Lichtschiff', e); } window.__kr = { KR, LS: KR_LS, laden: () => kr_laden(), hd: () => kr_hirschding(), wolf: () => kr_wolf(), zeige: (n, v) => { if (KR.dt) { KR.dt.force = n; KR.dt.forceV = v || 0; } } }; }]);
