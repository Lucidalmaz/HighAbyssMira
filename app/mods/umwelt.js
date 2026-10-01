// =====================================================================  UMWELT (Modul „umwelt“, R-7/R-8): Umgebungsphysik und Luft
// Alles hängt am EINEN Windzustand der Basis (WIND, gust, windStoss; Pflanzen über windVert) – derselbe, den klang.js hört:
// · Schaukeln: Pendel (Kette/Seil, Länge aus dem Modell), Anstoßen durch Luke (Stoß entlang der Schwingrichtung: Luke ist schwer, der Sitz leicht),
//   Ausschwingen mit Dämpfung, der Wind drückt mit; die Kette klirrt beim Stoß und quietscht an den Umkehrpunkten. Die Antriebe der Geschichte
//   (Reifenschaukel Nr. 2, Spielplatz, Waldschaukel) pumpen nur Energie nach – sie schwingen weiter von allein, bleiben aber anstoßbar.
//   Neu: das Schaukelgerüst im Vorgarten von Nr. 2 (bisher starr) – Sitze samt Ketten aus dem Scan gelöst.
// · Blätter: einzelne Blätter aus dem Laub-Scan (w_leaves, Zygomir), instanziert, Bahn ganz im Vertex-Shader (Fall, Pendeln, Taumeln, Luftweg
//   WIND.fx/fz); sie landen, liegen, rutschen in kräftigen Böen weiter (WIND.gx/gz) und verblassen. Nur nahe Luke. Quellen: Laubbäume, Hecken,
//   in Böen vom Boden aufgewirbelt, beim Rennen durchs Laub.
// · Luft: Schwebeteilchen (drinnen Staub, draußen Sprühregen-Tröpfchen und Fasern), nur sichtbar im Lampenkegel und unter Laternen.
// · Atem in der Kälte (R-22: nur beim Ausatmen, nur im Licht, organisch zerfasernd) und Dampf aus vier Gullys – weiche Wölkchen, vom Wind verweht, nur im Licht zu sehen.
// Keine Speicheranforderungen pro Bild: feste Puffer, Ringbelegung, Aktualisierungsbereiche.
const umwelt_S = { ok: false, t: 0, swings: [], reg: {}, regT: 0, leaf: null, motes: null, puff: null, src: [], near: null, nearN: 0, nearW: 0, nearT: 0, acc: 0, accG: 0,
  kickT: 0, breathT: 2, steamT: 0, px: new THREE.Vector2(), stats: {} };
const UMW_GULLY = [[-30, .6], [46, .9], [-2.1, -38.5], [66, 1.3]]; // Kanaldeckel mit warmer Luft darunter (der am Treffpunkt 9/−1,3 gehört Kapitel 3)
const umwelt_fr = x => x - Math.floor(x);

// ---------------------------------------------------------------- Schaukeln
// Pendel registrieren: o.piv dreht um seine x-Achse (rotation.x > 0 schwingt nach lokal −z), L Ketten-/Seillänge (m), w halbe Sitzbreite
function umwelt_schaukel(o, L, w, opt = {}) {
  const piv = o.piv; piv.updateWorldMatrix(true, false); const P = new THREE.Vector3().setFromMatrixPosition(piv.matrixWorld), q = new THREE.Quaternion(); if (piv.parent) piv.parent.getWorldQuaternion(q); q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), piv.rotation.y)); // Gier des Drehpunkts (Reihenfolge YXZ)
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(q), s = new THREE.Vector3(1, 0, 0).applyQuaternion(q), fl = Math.hypot(f.x, f.z) || 1, sl = Math.hypot(s.x, s.z) || 1;
  Object.assign(o, { L, w, px: P.x, py: P.y, pz: P.z, fx: f.x / fl, fz: f.z / fl, sx: s.x / sl, sz: s.z / sl, a: piv.rotation.x || 0, v: o.v || 0, ziel: o.ziel || 0, halt: false, ph: rand(0, 6.28), lv: 0, hitT: 0, seil: false, damp: .12 }, opt);
  umwelt_S.swings.push(o); return o; }
// Ein Schritt: Schwerkraft, Wind, Geschichts-Antrieb (Energie nachpumpen), Festhalten, Stoß mit Luke, Geräusche
function umwelt_pendel(S, dt, P) {
  const g = 9.81, L = S.L, ca = Math.cos(S.a);
  let acc = -g / L * Math.sin(S.a);
  const wd = WIND.dx * S.fx + WIND.dz * S.fz; acc += (wd * WIND.k * WIND.k * .5 + gust * .55 * Math.sin(WIND.t * 1.9 + S.ph) * (.4 + Math.abs(wd))) / L; // der Wind drückt den leichten Sitz
  if (S.ziel > 0 && !S.halt) { const A = Math.acos(Math.max(-1, Math.min(1, ca - L * S.v * S.v / (2 * g)))); acc += Math.max(-.6, Math.min(.6, (S.ziel - A) * 2)) * (S.v >= 0 ? 1 : -1); }
  S.v += acc * dt; S.v *= Math.exp(-(S.halt ? 4 : S.damp) * dt); S.a = Math.max(-1.25, Math.min(1.25, S.a + S.v * dt));
  // Stoß: Sitz (Versatz entlang f, Höhe) gegen Luke – Luke ist schwer, der Sitz prallt ab oder wird mitgenommen
  S.hitT -= dt; const sl = L * Math.sin(S.a), sy = S.py - L * Math.cos(S.a), dx = P.x - S.px, dz = P.z - S.pz, along = dx * S.fx + dz * S.fz, side = dx * S.sx + dz * S.sz;
  if (Math.abs(side) < S.w + .28 && sy > P.y + .05 && sy < P.y + 1.65) { const e = sl - along;
    if (Math.abs(e) < .36) { const pv = vel.x * S.fx + vel.z * S.fz, c = Math.max(.3, L * Math.cos(S.a)), sv = c * S.v;
      if ((sv - pv) * (e >= 0 ? 1 : -1) < 0) { const nv = pv - (sv - pv) * .2, dv = Math.abs(nv - sv); S.v = nv / c; vel.x -= S.fx * (nv - sv) * .05; vel.z -= S.fz * (nv - sv) * .05;
        if (dv > .3 && S.hitT <= 0) { S.hitT = .3; const hx = S.px + S.fx * sl, hz = S.pz + S.fz * sl; if (S.seil) Audio.play(Audio.pick('woodHit1', 'woodHit3'), { gain: Math.min(.35, dv * .15), rate: rand(.5, .65), x: hx, y: sy, z: hz, ref: 2 }); else Audio.kette(hx, sy + .6, hz, Math.min(1, dv / 2)); } } } }
  // Umkehrpunkt: Kette quietscht / Seil knarrt am Ast – nur bei Schwung
  if ((S.v >= 0) !== (S.lv >= 0) && Math.abs(S.a) > .1) { const d = Math.hypot(dx, dz), amp = Math.min(1, Math.abs(S.a) * 1.6);
    if (d < 24) { if (S.seil) Audio.play('doorCreak', { gain: .1 * amp, rate: rand(.8, 1.05), offset: rand(0, .6), dur: rand(1, 1.5), x: S.px, y: S.py, z: S.pz, ref: 2.5 }); else Audio.quietsch(S.px, S.py - .2, S.pz, amp); } }
  S.lv = S.v; S.piv.rotation.x = S.a; }
// Schaukel-Scan in Gerüst + frei hängende Sitze (samt Ketten) teilen – wie ausbau_nord_swing, aber für ein schon platziertes Modell (Weltkoordinaten)
function umwelt_schaukelTeilen(holder) {
  holder.updateMatrixWorld(true); let mesh = null, n = 0; holder.traverse(o => { if (o.isMesh) { n++; if (!mesh) mesh = o; } }); if (!mesh || n > 1 || !mesh.visible) return []; // nur ein Netz (wie der Spielplatz-Scan)
  const geo = (mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()).applyMatrix4(mesh.matrixWorld); geo.computeBoundingBox();
  const bb = geo.boundingBox, W = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y, D = bb.max.z - bb.min.z, alongX = W >= D, cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2, Wl = alongX ? W : D;
  const pos = geo.attributes.position, nTri = pos.count / 3, sel = [[], [], []];
  for (let t = 0; t < nTri; t++) { let mx = 0, my = 0, mz = 0; for (let k = 0; k < 3; k++) { mx += pos.getX(t * 3 + k); my += pos.getY(t * 3 + k); mz += pos.getZ(t * 3 + k); } mx /= 3; my /= 3; mz /= 3;
    const u = alongX ? mx - cx : mz - cz, v = alongX ? mz - cz : mx - cx, seat = my < bb.min.y + H * .9 && Math.abs(u) < Wl * .36 && Math.abs(v) < .3; sel[seat ? (u < 0 ? 1 : 2) : 0].push(t); }
  if (!sel[1].length && !sel[2].length) return [];
  const sub = list => { const g = new THREE.BufferGeometry(); for (const [n, a] of Object.entries(geo.attributes)) { const arr = new a.array.constructor(list.length * 3 * a.itemSize); list.forEach((t, j) => { for (let k = 0; k < 3 * a.itemSize; k++) arr[j * 3 * a.itemSize + k] = a.array[t * 3 * a.itemSize + k]; }); g.setAttribute(n, new THREE.BufferAttribute(arr, a.itemSize, a.normalized)); } return g; };
  const frame = new THREE.Mesh(sub(sel[0]), mesh.material); frame.castShadow = true; frame.receiveShadow = true; scene.add(frame); mesh.visible = false;
  const out = [];
  for (const s of [1, 2]) { if (!sel[s].length) continue; const g = sub(sel[s]); g.computeBoundingBox(); const b = g.boundingBox, px = (b.min.x + b.max.x) / 2, py = b.max.y, pz = (b.min.z + b.max.z) / 2;
    g.translate(-px, -py, -pz); g.computeBoundingBox(); g.computeBoundingSphere(); const piv = new THREE.Group(); piv.position.set(px, py, pz); piv.rotation.order = 'YXZ'; if (!alongX) piv.rotation.y = PI / 2; piv.userData.noCol = true; scene.add(piv);
    if (!alongX) g.rotateY(-PI / 2); const m = new THREE.Mesh(g, mesh.material); m.castShadow = true; m.userData.noCol = true; piv.add(m);
    out.push({ piv, L: Math.max(.6, (py - b.min.y) * .92), w: Math.max(.2, (alongX ? b.max.x - b.min.x : b.max.z - b.min.z) / 2) }); }
  return out; }
// Alle Schaukeln der Welt einsammeln, sobald ihre Module sie gebaut haben
function umwelt_schaukelnSuchen() {
  const R = umwelt_S.reg;
  if (!R.reifen && typeof swing !== 'undefined' && swing.piv) R.reifen = umwelt_schaukel(swing, 3.2, .45, { seil: true, ziel: .32, damp: .09 });
  if (!R.nord && typeof ausbau_nord !== 'undefined' && ausbau_nord.swing && ausbau_nord.swing.seats) { R.nord = true;
    for (const q of ausbau_nord.swing.seats) { const m = q.piv.children[0]; if (!m || !m.geometry) continue; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; umwelt_schaukel(q, Math.max(.6, -b.min.y * .92), Math.max(.2, (b.max.x - b.min.x) / 2)); } }
  if (!R.tief && typeof tief_S !== 'undefined' && tief_S.swingPiv) R.tief = umwelt_schaukel({ piv: tief_S.swingPiv }, 2.9, .31, { damp: .1 });
  if (!R.nr2) { R.nr2 = true; const h = scene.children.find(o => !o.isMesh && o.visible && Math.abs(o.position.x + 58.8) < .02 && Math.abs(o.position.z - 10.2) < .02 && o.children.length === 1);
    if (h) try { for (const s of umwelt_schaukelTeilen(h)) umwelt_schaukel({ piv: s.piv }, s.L, s.w); } catch (e) { console.warn('umwelt: Schaukel Nr. 2', e); } }
}
function umwelt_schaukelnTick(dt, P) {
  const S = umwelt_S, R = S.reg;
  // Reifenschaukel: läuft von allein (Geschichte) – leben.js hält sie an (mitten im Schwung stehen bleiben; post.js: „schwingt nicht mehr“)
  if (R.reifen) { const H = typeof leben_S !== 'undefined' ? leben_S.swingHold : null, sw = R.reifen;
    sw.ziel = .32 * (1 + .25 * Math.sin(S.t * .13)); sw.halt = false; sw.frei = true;
    if (H) { H.t += dt; if (H.a === 0 && H.dur > 100) { sw.ziel = 0; sw.halt = true; } else if (H.t < H.dur) { sw.a = H.a; sw.v = 0; sw.frei = false; sw.piv.rotation.x = H.a; } else leben_S.swingHold = null; } }
  if (R.tief) { R.tief.ziel = typeof tief_S !== 'undefined' ? .42 * tief_S.swingW : 0; R.tief.halt = typeof tief_S !== 'undefined' && tief_S.swingStop > 0 && tief_S.swingW === 0; }
  for (const sw of S.swings) { if (sw.frei === false) continue; const d2 = (sw.px - P.x) ** 2 + (sw.pz - P.z) ** 2; if (d2 > 2025 && !sw.ziel) continue; umwelt_pendel(sw, dt, P); }
}

// ---------------------------------------------------------------- Blätter (GPU): echte Fallblatt-Bewegung, die CPU setzt nur Start und Landung (R-7/R-8, R-23)
// Zwei Fallarten wie in der Natur (nach Form/Saat): 65 % Pendelgleiten (Blatt gleitet seitlich hin und her, kippt an den Umkehrpunkten hoch und bremst dort –
// Formwiderstand: flach langsam, mittig schnell –, die Gleitebene dreht sich langsam, kurzes Flattern um die Längsachse), 35 % Taumeln (Rotation um die Querachse,
// fällt schneller, driftet). Böen schieben ungleichmäßig (Luftweg WIND.fx/fz + Turbulenz mit gust). Landen flach auf dem Boden, werden nass (dunkler, glänzender),
// liegen still oder werden von kräftigen Böen weitergeschoben – rutschen und kippen dabei in halben Überschlägen und kommen flach zur Ruhe. Rückseite heller,
// im Gegenlicht einer Laterne scheint das Blatt durch. Ein- und Ausblenden per Raster (kein Aufploppen). Tönung je Baumart (Ortsbäume braun/ocker,
// Waldlaub gelb/orange, Pfaffenhütchen-Hecken rosa-rot).
const UMW_LEAF_VS = `attribute vec4 aA, aB, aC, aD, aE; uniform float uT; uniform vec2 uW, uG; uniform vec4 lamps[10]; uniform vec4 windV; varying float vWet, vFade; varying vec3 vTr, vTint;
mat3 lRot(vec3 a, float g){ a = normalize(a); float c = cos(g), s = sin(g), t = 1. - c;
  return mat3(t * a.x * a.x + c, t * a.x * a.y + s * a.z, t * a.x * a.z - s * a.y, t * a.x * a.y - s * a.z, t * a.y * a.y + c, t * a.y * a.z + s * a.x, t * a.x * a.z + s * a.y, t * a.y * a.z - s * a.x, t * a.z * a.z + c); }
`;
// aA: Start x, y, z, t0 · aB: Luftweg beim Start (x, z), Saat, Landezeit τ · aC: Landeplatz x, z, Bodenweg bei der Landung · aD: Größe, Aufwurf U, Boden-y, gelandet · aE: Tönung
// Dieselben Formeln laufen in umwelt_blattY/umwelt_blattH (CPU, Landezeit und Landeplatz) – bei Änderungen beide Seiten anpassen.
function umwelt_leafMat(src) {
  const m = src.clone(); m.side = THREE.DoubleSide; m.transparent = false; m.alphaTest = 0; if (m.color) m.color.setRGB(.62, .6, .56); m.envMapIntensity = .25; m.roughness = Math.max(m.roughness ?? .8, .72); // eigene Tönung (waldleben dunkelt das geteilte Material schon ab)
  const L = umwelt_S.leafU = { uT: { value: 0 }, uW: { value: new THREE.Vector2() }, uG: { value: new THREE.Vector2() }, lamps: fogUniforms.lamps, windV };
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, L);
    sh.vertexShader = UMW_LEAF_VS + sh.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      float lTau = uT - aA.w, lTl = aB.w, lS = aB.z, lTc = clamp(lTau, 0., lTl), lLand = smoothstep(lTl - .25, lTl, lTau);
      bool lTum = fract(lS * 3.3) > .65; float lOm = 2.2 + fract(lS * 5.7) * 1.6, lPh = lOm * lTc + lS * 6.28, lGa = lS * 40. + (lTum ? 0. : lTc * (fract(lS * 9.1) - .5) * .6);
      vec2 lGd = vec2(cos(lGa), sin(lGa)); vec3 lQ = vec3(-lGd.y, 0., lGd.x);
      mat3 lR = lTum ? lRot(lQ, lTc * (5. + fract(lS * 11.) * 5.) + lS * 6.) * lRot(vec3(0., 1., 0.), lS * 6.28)
                     : lRot(lQ, (.45 + fract(lS * 2.9) * .45) * sin(lPh)) * lRot(vec3(lGd.x, 0., lGd.y), .18 * sin(lTc * 17. + lS * 30.) * min(1., lTc)) * lRot(vec3(0., 1., 0.), lS * 6.28 + lGa);
      vec2 lSk = aD.w > .5 ? (uG - aC.zw) * (.6 + fract(lS * 5.3) * .8) : vec2(0.); float lSl = length(lSk), lQc = lSl * 1.3;
      float lCart = 3.14159 * (floor(lQc) + smoothstep(0., 1., fract(lQc)));
      vec3 lAx = lSl > .001 ? vec3(-lSk.y, 0., lSk.x) / lSl : vec3(1., 0., 0.);
      mat3 lF = lRot(lAx, lCart) * lRot(vec3(0., 1., 0.), lS * 6.28 + lSl * .8) * lRot(vec3(1., 0., 0.), (fract(lS * 7.) - .5) * .25);
      objectNormal = normalize(mix(lR * objectNormal, lF * objectNormal, lLand));`).replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec3 p = transformed * aD.x; float vm = lTum ? .8 + lS * .4 : .55 + lS * .35, B = lTum ? 0. : vm / (2. * lOm);
        float y = aA.y + aD.y * .55 * (1. - exp(-lTc / .55)) - vm * lTc - B * (sin(2. * lPh) - sin(2. * lS * 6.28));
        vec2 h = aA.xz + (uW - aB.xy) * (.55 + fract(lS * 7.13) * .4) + (lTum ? vec2(cos(lS * 40.), sin(lS * 40.)) * .35 * lTc : lGd * (.32 + fract(lS * 4.3) * .25) * (sin(lPh) - sin(lS * 6.28)))
          + vec2(sin(lTc * 1.3 + aA.x * .7) - sin(aA.x * .7), cos(lTc * 1.1 + aA.z * .6) - cos(aA.z * .6)) * .3 * windV.w;
        if (aD.w > .5) { h = aC.xy + lSk; y = aD.z + .012 + sin(3.14159 * fract(lQc)) * .03 * step(.001, lSl); } else y = max(y, aD.z + .012);
        transformed = mix(lR * p, lF * p, lLand) + vec3(h.x, y, h.y);
        float life = lTl + 24. + lS * 16.; vFade = smoothstep(0., .6, lTau) * (1. - smoothstep(life - 6., life, lTau)); vWet = .15 + .85 * smoothstep(lTl, lTl + 3., lTau) * step(.5, aD.w); vTint = aE.rgb;
        vec3 V = normalize(transformed - cameraPosition); vTr = vec3(0.);
        for (int i = 0; i < 10; i++){ vec4 Lp = lamps[i]; if (Lp.w < .02) continue; vec3 e = vec3(Lp.x, 4.6, Lp.z) - transformed; float d2 = dot(e, e); vTr += vec3(1., .62, .3) * Lp.w * pow(max(0., dot(V, e * inversesqrt(d2))), 3.) * 1.1 / (1. + d2 * .05); } }`);
    sh.fragmentShader = 'varying float vWet, vFade; varying vec3 vTr, vTint;\nfloat uHs(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n' + sh.fragmentShader
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (uHs(gl_FragCoord.xy) > vFade) discard;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= vTint; if (!gl_FrontFacing) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.3, .59, .11))) * vec3(1.06, 1., .82), .35) * 1.18;
        diffuseColor.rgb *= mix(1., .55, vWet);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .36, vWet);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * vTr * (1. - .6 * vWet);'); };
  m.customProgramCacheKey = () => 'umweltBlatt2'; return m; }
// CPU-Spiegel der Shader-Bahn (Landezeit und Landeplatz)
function umwelt_blattY(y0, U, s, t) { const tum = umwelt_fr(s * 3.3) > .65, om = 2.2 + umwelt_fr(s * 5.7) * 1.6, vm = tum ? .8 + s * .4 : .55 + s * .35, B = tum ? 0 : vm / (2 * om);
  return y0 + U * .55 * (1 - Math.exp(-t / .55)) - vm * t - B * (Math.sin(2 * (om * t + s * 6.28)) - Math.sin(2 * s * 6.28)); }
const umwelt_H = { x: 0, z: 0 };
function umwelt_blattH(i, t) { const L = umwelt_S.leaf, s = L.s[i], x0 = L.x0[i], z0 = L.z0[i], dk = .55 + umwelt_fr(s * 7.13) * .4, tum = umwelt_fr(s * 3.3) > .65, om = 2.2 + umwelt_fr(s * 5.7) * 1.6;
  let x = x0 + (WIND.fx - L.w0x[i]) * dk, z = z0 + (WIND.fz - L.w0z[i]) * dk;
  if (tum) { x += Math.cos(s * 40) * .35 * t; z += Math.sin(s * 40) * .35 * t; }
  else { const ga = s * 40 + t * (umwelt_fr(s * 9.1) - .5) * .6, A = (.32 + umwelt_fr(s * 4.3) * .25) * (Math.sin(om * t + s * 6.28) - Math.sin(s * 6.28)); x += Math.cos(ga) * A; z += Math.sin(ga) * A; }
  x += (Math.sin(t * 1.3 + x0 * .7) - Math.sin(x0 * .7)) * .3 * gust; z += (Math.cos(t * 1.1 + z0 * .6) - Math.cos(z0 * .6)) * .3 * gust; umwelt_H.x = x; umwelt_H.z = z; return umwelt_H; }
// Einzelne Blätter aus dem Scan lösen: Inseln des Netzes (Union-Find über die Dreiecke), typische Größe, dünnste Achse nach oben, auf 1 m normiert
async function umwelt_blattFormen() {
  const sc = await msModel('w_leaves', 'model.glb'); let best = null;
  sc.traverse(o => { if (o.isMesh && o.geometry.index && (!best || o.geometry.attributes.position.count < best.geometry.attributes.position.count)) best = o; }); // das kleinere Netz: lose Blätter (das große ist der Haufen)
  if (!best) return null; const g = best.geometry, Pp = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, I = g.index, n = Pp.count, par = new Int32Array(n);
  for (let i = 0; i < n; i++) par[i] = i; const f = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
  for (let t = 0; t < I.count; t += 3) { const a = f(I.getX(t)), b = f(I.getX(t + 1)); par[b] = a; par[f(I.getX(t + 2))] = a; }
  const isl = new Map(); for (let t = 0; t < I.count; t += 3) { const r = f(I.getX(t)); let L = isl.get(r); if (!L) isl.set(r, L = []); L.push(t); }
  const cand = []; for (const tris of isl.values()) { if (tris.length < 6) continue; const b = new THREE.Box3(); for (const t of tris) for (let k = 0; k < 3; k++) b.expandByPoint(new THREE.Vector3().fromBufferAttribute(Pp, I.getX(t + k)));
    const s = b.getSize(new THREE.Vector3()); cand.push({ tris, b, s, m: Math.max(s.x, s.y, s.z) }); }
  if (!cand.length) return null; cand.sort((a, b) => a.m - b.m); const pick = [.45, .55, .65, .75].map(q => cand[Math.min(cand.length - 1, Math.floor(cand.length * q))]);
  return pick.map(c => { const thin = c.s.x < c.s.y && c.s.x < c.s.z ? 0 : c.s.z < c.s.y ? 2 : 1, ctr = c.b.getCenter(new THREE.Vector3()), k = 1 / c.m, map = new Map(), pos = [], nor = [], uv = [], idx = [];
    const rot = (x, y, z) => thin === 1 ? [x, y, z] : thin === 2 ? [x, z, -y] : [-y, x, z]; // eigentliche Drehung: dünnste Achse → y
    for (const t of c.tris) for (let q = 0; q < 3; q++) { const v = I.getX(t + q); if (!map.has(v)) { map.set(v, pos.length / 3); pos.push(...rot((Pp.getX(v) - ctr.x) * k, (Pp.getY(v) - ctr.y) * k, (Pp.getZ(v) - ctr.z) * k)); nor.push(...(N ? rot(N.getX(v), N.getY(v), N.getZ(v)) : [0, 1, 0])); uv.push(U ? U.getX(v) : 0, U ? U.getY(v) : 0); } idx.push(map.get(v)); }
    const G = new THREE.InstancedBufferGeometry(); G.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); G.setIndex(idx);
    return G; }).concat([best.material]); }
function umwelt_blattBau(parts) {
  const mat = umwelt_leafMat(parts.pop()), per = 40, n = parts.length * per, F = () => new Float32Array(n);
  const L = umwelt_S.leaf = { N: n, per, meshes: [], next: 0, t0: F().fill(-1e5), tl: F(), s: F(), x0: F(), z0: F(), w0x: F(), w0z: F(), land: new Uint8Array(n).fill(1) };
  for (const G of parts) { G.instanceCount = per; for (const k of ['aA', 'aB', 'aC', 'aD', 'aE']) { const a = new THREE.InstancedBufferAttribute(new Float32Array(per * 4), 4); a.setUsage(THREE.DynamicDrawUsage); G.setAttribute(k, a); }
    for (let j = 0; j < per; j++) G.attributes.aA.setW(j, -1e5);
    G.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4); const m = new THREE.Mesh(G, mat); m.frustumCulled = false; m.receiveShadow = true; m.userData.noCol = true; m.name = 'umwelt_blaetter'; scene.add(m); L.meshes.push(m); }
}
let umwelt_j = 0; // Instanz im Netz der Blattform (i % Formen); ohne Rückgabe-Array, damit nichts angelegt wird
function umwelt_attr(i) { const L = umwelt_S.leaf; umwelt_j = Math.floor(i / L.meshes.length); return L.meshes[i % L.meshes.length].geometry.attributes; }
function umwelt_markAttr(A, j) { for (const a of [A.aA, A.aB, A.aC, A.aD, A.aE]) { a.addUpdateRange(j * 4, 4); a.needsUpdate = true; } }
function umwelt_boden(x, z) { let g = 0; try { const s = solidGround(x, .3, z); if (s > g && s < .65) g = s; } catch (e) {} return g; }
function umwelt_drin(x, z) { for (const r of indoorRects) if (x > r.x0 - .2 && x < r.x1 + .2 && z > r.zb - .2 && z < r.zf + .2) return true; return false; }
// Herbstfarben je Baumart (multipliziert auf die Scan-Farben): 0 Ortsbaum braun/ocker, 1 Waldlaub gelb/orange, 2 Pfaffenhütchen rosa-rot, 3 Bodenlaub (gemischt, dunkler)
const UMW_TINT = [[[.95, .78, .58], [.8, .68, .52]], [[1.08, .92, .55], [1.05, .7, .42]], [[1.1, .62, .6], [.98, .5, .45]], [[.82, .7, .55], [.7, .6, .5]]];
// Ein Blatt starten; Landezeit per Halbierung auf der Shader-Bahn (y fällt nach dem Aufwurf monoton)
function umwelt_blatt(x, y, z, U, size, art = 0) {
  const L = umwelt_S.leaf; if (!L) return; let i = -1; for (let k = 0; k < L.N; k++) { const c = (L.next + k) % L.N; if (umwelt_S.t > L.t0[c] + L.tl[c] + 41) { i = c; break; } } if (i < 0) return; L.next = (i + 1) % L.N;
  const s = Math.random(), sp = .5 + WIND.k * 3.4, dk = .55 + umwelt_fr(s * 7.13) * .4, fl = Math.max(.3, (y + U * .6) / .75);
  const gy = umwelt_boden(x + WIND.dx * sp * dk * fl, z + WIND.dz * sp * dk * fl);
  let a = 0, b = 60; for (let k = 0; k < 26; k++) { const m = (a + b) * .5; if (umwelt_blattY(y, U, s, m) > gy) a = m; else b = m; } const tau = Math.max(.05, b);
  L.t0[i] = umwelt_S.t; L.tl[i] = tau; L.s[i] = s; L.x0[i] = x; L.z0[i] = z; L.w0x[i] = WIND.fx; L.w0z[i] = WIND.fz; L.land[i] = 0;
  const T = UMW_TINT[art] || UMW_TINT[0], q = Math.random(), A = umwelt_attr(i), j = umwelt_j;
  A.aA.setXYZW(j, x, y, z, umwelt_S.t); A.aB.setXYZW(j, WIND.fx, WIND.fz, s, tau); A.aC.setXYZW(j, 0, 0, 0, 0); A.aD.setXYZW(j, size, U, gy, 0);
  A.aE.setXYZW(j, T[0][0] + (T[1][0] - T[0][0]) * q, T[0][1] + (T[1][1] - T[0][1]) * q, T[0][2] + (T[1][2] - T[0][2]) * q, 0); umwelt_markAttr(A, j); }
// Landung: Landeplatz (dieselbe Bahn wie im Shader) und Bodenweg festhalten; Boden an der echten Stelle; drinnen gelandet (ins Haus geweht) → verschwindet
function umwelt_landen(i) {
  const L = umwelt_S.leaf, h = umwelt_blattH(i, L.tl[i]), x = h.x, z = h.z; L.land[i] = 1; const A = umwelt_attr(i), j = umwelt_j;
  if (umwelt_drin(x, z)) { L.t0[i] = -1e5; A.aA.setW(j, -1e5); umwelt_markAttr(A, j); return; }
  A.aC.setXYZW(j, x, z, WIND.gx, WIND.gz); A.aD.setZ(j, umwelt_boden(x, z)); A.aD.setW(j, 1); umwelt_markAttr(A, j); }
// Quellen in der Nähe (alle 1 s): [x, z, yMin, yMax, Gewicht, Art] – kahle Ortsbäume (letzte Blätter), Laubbäume im Wald (keine Kiefern), Pfaffenhütchen-Hecken
function umwelt_quellen() {
  const S = umwelt_S; S.src.length = 0;
  for (const [x, z] of (typeof treeSpots !== 'undefined' ? treeSpots : [])) S.src.push([x, z, 3, 7, .3, 0]);
  if (typeof WL !== 'undefined' && WL.treePts) for (const [x, z] of WL.treePts) S.src.push([x, z, 3, 8, 1, 1]);
  if (typeof gruen_S !== 'undefined') for (const [hx, z0, z1] of gruen_S.hedges) for (let z = z0 + 1; z < z1; z += 3) S.src.push([hx, z, .7, 1.6, .2, 2]);
  S.near = new Int32Array(Math.max(1, S.src.length)); }
// Liegt hier Laub? Unter Bäumen und an Hecken (≤ 4 m), im Rinnstein des Ortskerns, im Laubwald
function umwelt_laubHier(x, z) {
  const S = umwelt_S; if (Math.abs(Math.abs(z) - 3.7) < .45 && Math.abs(x) < 76) return true;
  if (typeof klang_floor === 'function' && klang_floor(x, z) === 'leaves') return true;
  for (let k = 0; k < S.nearN; k++) { const q = S.src[S.near[k]]; if ((q[0] - x) ** 2 + (q[1] - z) ** 2 < 16) return true; } return false; }
function umwelt_blaetterTick(dt, P, aussen, sp) {
  const S = umwelt_S, L = S.leaf; if (!L) return; const U = S.leafU; U.uT.value = S.t; U.uW.value.set(WIND.fx, WIND.fz); U.uG.value.set(WIND.gx, WIND.gz);
  for (let i = 0; i < L.N; i++) if (!L.land[i] && S.t >= L.t0[i] + L.tl[i]) umwelt_landen(i);
  if (!aussen) return;
  S.nearT -= dt; if (S.nearT < 0) { S.nearT = 1; S.nearN = 0; S.nearW = 0; S.nearD = 99;
    for (let k = 0; k < S.src.length; k++) { const q = S.src[k], d2 = (q[0] - P.x) ** 2 + (q[1] - P.z) ** 2; if (d2 < 576) { S.near[S.nearN++] = k; S.nearW += q[4]; S.nearD = Math.min(S.nearD, Math.sqrt(d2)); } } }
  // Ablösen von Bäumen und Hecken: kaum in der Flaute, viele in der Böe (Stiel reißt unter Last)
  S.acc += Math.min(4, S.nearW * .2) * (.08 + .45 * WIND.base * WIND.base + 1.9 * gust * gust) * dt;
  while (S.acc >= 1 && S.nearN) { S.acc -= 1; const q = S.src[S.near[Math.floor(Math.random() * S.nearN)]]; umwelt_blatt(q[0] + rand(-2.2, 2.2), rand(q[2], q[3]), q[1] + rand(-2.2, 2.2), 0, rand(.07, .12), q[5]); }
  if (!S.nearN) S.acc = 0;
  // Böe: Laub vom Boden aufgewirbelt – nur von der Luvseite und nur dort, wo Laub liegt
  S.accG += Math.max(0, gust - .35) * 3 * dt;
  while (S.accG >= 1) { S.accG -= 1; const a = rand(-6, 6), r = rand(3, 9), x = P.x - WIND.dx * r - WIND.dz * a, z = P.z - WIND.dz * r + WIND.dx * a; if (!umwelt_drin(x, z) && umwelt_laubHier(x, z)) umwelt_blatt(x, umwelt_boden(x, z) + .03, z, rand(1, 2.4), rand(.07, .11), 3); }
  // Rennen durchs Laub: nur wo Laub liegt
  S.kickT -= dt; if (sp > 3.2 && S.kickT < 0 && umwelt_laubHier(P.x, P.z)) { S.kickT = rand(.14, .28);
    const n = 1 + Math.floor(Math.random() * 2); for (let k = 0; k < n; k++) umwelt_blatt(P.x + vel.x * .08 + rand(-.3, .3), P.y + .03, P.z + vel.z * .08 + rand(-.3, .3), rand(.8, 1.6), rand(.07, .1), 3); if (Math.random() < .5 && Audio.laub) Audio.laub(P.x, P.z, .8); }
}

// ---------------------------------------------------------------- Licht für Teilchen: Taschenlampenkegel (fogUniforms.flP/flD/flK) + die zehn nächsten Laternen
const UMW_LIGHT = `uniform vec3 flP, flD; uniform vec2 flK; uniform vec4 lamps[10]; uniform float uAmb;
vec3 uLicht(vec3 w, float nah){ vec3 q = w - flP; float l = length(q), c = dot(q / max(l, 1e-3), flD);
  vec3 col = vec3(1., .93, .82) * flK.x * smoothstep(flK.y, mix(flK.y, 1., .6), c) / (1. + l * l * .09) * smoothstep(nah * .4, nah, l) * 2.2;
  for (int i = 0; i < 10; i++){ vec4 L = lamps[i]; if (L.w < .02) continue; vec3 e = w - vec3(L.x, 4.6, L.z); col += vec3(1., .62, .28) * L.w * .9 / (1. + dot(e, e) * .25); }
  return col + vec3(.55, .6, .7) * uAmb; }
`;
function umwelt_lichtU() { return { flP: fogUniforms.flP, flD: fogUniforms.flD, flK: fogUniforms.flK, lamps: fogUniforms.lamps, uAmb: umwelt_S.amb || (umwelt_S.amb = { value: .04 }) }; }
// Schwebeteilchen: ein Feld um die Kamera (9 × 5 × 9 m, gefaltet), Bewegung ganz im Shader
function umwelt_motesBau() {
  const N = 1400, a = new Float32Array(N * 4); for (let i = 0; i < N * 4; i++) a[i] = Math.random();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('aS', new THREE.BufferAttribute(a, 4));
  const U = Object.assign(umwelt_lichtU(), { uT: { value: 0 }, uIn: { value: 0 }, uOn: { value: 0 }, uW: { value: new THREE.Vector2() }, uC: { value: new THREE.Vector3() }, uPx: { value: 600 }, windP });
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: UMW_LIGHT + `uniform float uT, uIn, uOn, uPx; uniform vec2 uW; uniform vec3 uC; uniform vec4 windP[6]; attribute vec4 aS; varying vec3 vCol; varying float vA;
      void main(){ const vec3 B = vec3(9., 5., 9.); float k = aS.w, drop = step(.45, k) * (1. - uIn);
        // Brownsche Bewegung: je Teilchen drei unharmonische Schwingungen mit eigenen Frequenzen/Phasen (langsame, ziellose Drift, nie im Gleichtakt)
        vec3 fq = .05 + .12 * fract(aS.wzy * vec3(13.1, 7.7, 5.3)), ph = aS.xyz * 40.;
        vec3 d = (sin(uT * fq + ph) * .32 + sin(uT * fq * 2.13 + ph.yzx) * .16 + sin(uT * fq * 4.37 + ph.zxy) * .08) * vec3(1., .55, 1.);
        vec3 p = aS.xyz * B + d - vec3(0., uT * mix(mix(.012, .006, uIn), 1.4 + k, drop), 0.) + (1. - uIn) * vec3(uW.x, 0., uW.y) * mix(.85, 1., drop);
        vec3 rel = mod(p - uC + B * .5, B) - B * .5, w = uC + rel;
        // Luke verdrängt die Luft: an seiner Spur (windP, gedämpft federnd) weicht der Staub aus, wirbelt hoch und kreiselt zurück
        for (int i = 0; i < 6; i++){ vec4 Q = windP[i]; if (abs(Q.z) < .002) continue; vec2 e = w.xz - Q.xy; float f = exp(-dot(e, e) / .8) * Q.z * (1. - drop);
          w += vec3(e.x * .3 - e.y * .22, .18 * smoothstep(1.6, 0., w.y - uC.y + 1.6), e.y * .3 + e.x * .22) * f; }
        vec4 mv = viewMatrix * vec4(w, 1.);
        float px = uPx * mix(.0025, .004, fract(k * 13.)) / max(.2, -mv.z);
        vCol = uLicht(w, .6); vA = (1. - smoothstep(.36, .5, max(abs(rel.x) / B.x, max(abs(rel.y) / B.y, abs(rel.z) / B.z)))) * uOn * mix(1., .6, drop) * min(1., px);
        gl_Position = projectionMatrix * mv; gl_PointSize = clamp(px, 1., 5.); }`,
    fragmentShader: `varying vec3 vCol; varying float vA; void main(){ float r = length(gl_PointCoord - .5), a = vA * smoothstep(.5, .1, r); gl_FragColor = vec4(min(vCol, vec3(1.6)) * a * .55, a); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.noCol = true; p.renderOrder = 6; p.name = 'umwelt_luft'; scene.add(p); umwelt_S.motes = { p, U }; }
// Wölkchen (Atem, Gully-Dampf): Ring aus 96, Start/Geschwindigkeit/Größe je Teilchen, Bahn und Licht im Shader
function umwelt_puffBau() {
  const N = 96, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  for (const k of ['aO', 'aV', 'aP', 'aW']) { const a = new THREE.BufferAttribute(new Float32Array(N * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); }
  for (let i = 0; i < N; i++) { g.attributes.aO.setW(i, -1e5); g.attributes.aV.setW(i, 1); }
  const U = Object.assign(umwelt_lichtU(), { uT: { value: 0 }, uW: { value: new THREE.Vector2() }, uPx: { value: 600 }, windV });
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: UMW_LIGHT + `uniform float uT, uPx; uniform vec2 uW; uniform vec4 windV; attribute vec4 aO, aV, aP, aW; varying vec3 vCol; varying float vA, vS, vU, vR;
      void main(){ float age = uT - aO.w, u = age / aV.w; if (u < 0. || u > 1.) { gl_Position = vec4(2., 2., 2., 1.); gl_PointSize = 0.; vA = 0.; return; }
        // Dampf: steigt warm auf und wird langsamer; oben greift der Wind immer stärker (Fahne biegt sich und reißt ab), dazu Verwirbelung
        vec3 w = aO.xyz + aV.xyz * (1. - exp(-age * 1.2)) / 1.2 + vec3(0., aP.w * age * (1. - .3 * u), 0.) + vec3(uW.x - aW.x, 0., uW.y - aW.y) * (.25 + .9 * u) * min(1., age)
          + vec3(sin(age * 1.9 + aW.z * 31.), 0., cos(age * 1.6 + aW.z * 17.)) * .12 * u * (1. + 2. * windV.w);
        vec4 mv = viewMatrix * vec4(w, 1.); float sz = mix(aP.x, aP.y, sqrt(u));
        vCol = uLicht(w, .12); vA = aP.z * smoothstep(0., .15, u) * pow(1. - u, 1.4); vS = aW.z; vU = u + .5 * windV.w * u; vR = aW.w;
        gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uPx * sz / max(.1, -mv.z), 1., 256.); }`,
    fragmentShader: `varying vec3 vCol; varying float vA, vS, vU, vR;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
      float fb(vec2 p){ return n(p) * .55 + n(p * 2.03 + 7.1) * .3 + n(p * 4.1 + 3.7) * .15; }
      void main(){ if (vA < .002) discard; vec2 c = gl_PointCoord - .5; float cr = cos(vR), sr = sin(vR); c = mat2(cr, -sr, sr, cr) * c;
        vec2 wq = c * 2.2 + vec2(fb(c * 1.8 + vS * 9. + vU * .9), fb(c * 1.8 - vS * 7. - vU * .7)) * 1.1; // Wirbel
        float d = fb(wq * 1.6 + vS * 5.), rad = smoothstep(.5, .1, length(c) * (1. + .4 * (d - .5)));
        float a = vA * rad * smoothstep(.25 + .3 * min(vU, 1.2), .7 + .1 * min(vU, 1.2), d); // reißt mit Alter und Wind auf
        if (a < .002) discard; gl_FragColor = vec4(min(vCol, vec3(1.4)), a); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.noCol = true; p.renderOrder = 7; p.name = 'umwelt_woelkchen'; scene.add(p); umwelt_S.puff = { p, U, N, next: 0, g }; }
function umwelt_puff(x, y, z, vx, vy, vz, life, s0, s1, al, rise) {
  const Q = umwelt_S.puff; if (!Q) return; const i = Q.next; Q.next = (i + 1) % Q.N; const A = Q.g.attributes;
  A.aO.setXYZW(i, x, y, z, umwelt_S.t); A.aV.setXYZW(i, vx, vy, vz, life); A.aP.setXYZW(i, s0, s1, al, rise); A.aW.setXYZW(i, WIND.fx, WIND.fz, Math.random(), rand(0, 6.28));
  for (const a of [A.aO, A.aV, A.aP, A.aW]) { a.addUpdateRange(i * 4, 4); a.needsUpdate = true; } }
// ---------------------------------------------------------------- Atem (R-22): selten und begründet – nur beim Ausatmen, nur draußen in der Kälte und nur, wo Licht ihn
// lesbar macht (Lampenkegel, Laterne, Gegenlicht). Ein Ausatmen = 5–9 weiche Teilchen über 0,35–0,55 s mit Rauschdichte (weiche Ränder, Wirbel, feine Fäden),
// vor dem Mund knapp unter der Bildmitte; schneller Anstoß, bremst, steigt etwas, zieht mit dem Wind (WIND) und zerfasert in 0,8–1,4 s. Die Teilchen liegen in der
// Welt (dreht Luke sich, bleibt der Hauch zurück). Rhythmus: ruhig alle 3,5–5 s; nach Rennen/Schreck schneller und kräftiger, beruhigt sich über ~15 s.
// Abschaltbar: settings.atem === false (oder Kopfbewegung aus).
function umwelt_atemBau() {
  const N = 40, g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  for (const k of ['aO', 'aV', 'aP', 'aW']) { const a = new THREE.BufferAttribute(new Float32Array(N * 4), 4); a.setUsage(THREE.DynamicDrawUsage); g.setAttribute(k, a); }
  for (let i = 0; i < N; i++) { g.attributes.aO.setW(i, -1e5); g.attributes.aV.setW(i, 1); }
  const U = Object.assign(umwelt_lichtU(), { uT: { value: 0 }, uW: { value: new THREE.Vector2() }, uPx: { value: 600 } });
  const m = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: `uniform vec3 flP, flD; uniform vec2 flK; uniform vec4 lamps[10]; uniform float uAmb, uT, uPx; uniform vec2 uW; attribute vec4 aO, aV, aP, aW; varying vec3 vCol; varying float vA, vS, vU, vR;
      void main(){ float age = uT - aO.w, u = age / aV.w; if (u < 0. || u > 1.) { gl_Position = vec4(2., 2., 2., 1.); gl_PointSize = 0.; vA = 0.; return; }
        float dr = aW.w, sd = aP.w; vec3 w = aO.xyz + aV.xyz * (1. - exp(-age * dr)) / dr + vec3(0., .09 * pow(age, 1.5), 0.) + vec3(uW.x - aW.x, 0., uW.y - aW.y) * .55 * smoothstep(0., .7, age)
          + vec3(sin(age * 6.3 + sd * 21.), sin(age * 4.7 + sd * 13.) * .6, cos(age * 5.9 + sd * 17.)) * .018 * age;
        vec4 mv = viewMatrix * vec4(w, 1.); float sz = mix(aP.x, aP.y, 1. - (1. - u) * (1. - u));
        vec3 q = w - flP; float l = length(q), c = dot(q / max(l, 1e-3), flD); vec3 V = normalize(w - cameraPosition);
        vec3 col = vec3(1., .94, .85) * flK.x * smoothstep(flK.y - .25, mix(flK.y, 1., .3), c) * .9; // Lampenkegel von hinten: gedämpft
        for (int i = 0; i < 10; i++){ vec4 L = lamps[i]; if (L.w < .02) continue; vec3 e = vec3(L.x, 4.6, L.z) - w; float d2 = dot(e, e), ph = .5 + 2.6 * pow(max(0., dot(V, e * inversesqrt(d2))), 6.);
          col += vec3(1., .63, .3) * L.w * ph * 1.4 / (1. + d2 * .06); } // Laterne: Vorwärtsstreuung, im Gegenlicht leuchtet der Hauch auf
        vCol = col + vec3(.6, .65, .75) * uAmb; vU = u; vS = sd; vR = aW.z;
        vA = aP.z * smoothstep(0., .14, u) * pow(1. - u, 1.3) * smoothstep(.1, .32, -mv.z);
        gl_Position = projectionMatrix * mv; gl_PointSize = clamp(uPx * sz / max(.1, -mv.z), 1., 180.); }`,
    fragmentShader: `varying vec3 vCol; varying float vA, vS, vU, vR;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1., 0.)), f.x), mix(h(i + vec2(0., 1.)), h(i + vec2(1., 1.)), f.x), f.y); }
      float fb(vec2 p){ return n(p) * .55 + n(p * 2.03 + 7.1) * .3 + n(p * 4.1 + 3.7) * .15; }
      void main(){ if (vA < .002) discard; vec2 c = gl_PointCoord - .5; float cr = cos(vR), sr = sin(vR); c = mat2(cr, -sr, sr, cr) * c;
        vec2 wq = c * 2.6 + vec2(fb(c * 2.2 + vS * 9. + vU * 1.3), fb(c * 2.2 - vS * 7. - vU)) * .9;
        float d = fb(wq * 1.8 + vS * 5.), st = n(vec2(c.x * 2.5, c.y * 11.) + vS * 13. + vU * 2.);
        float rad = smoothstep(.5, .08, length(c) * (1. + .35 * (d - .5)));
        float a = vA * rad * smoothstep(.28 + .3 * vU, .72 + .12 * vU, d * .8 + st * .3);
        if (a < .002) discard; gl_FragColor = vec4(min(vCol, vec3(1.3)), a); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.noCol = true; p.renderOrder = 8; p.name = 'umwelt_atem'; scene.add(p);
  umwelt_S.atem = { p, U, N, next: 0, g, E: 0, T: 2, ex: 0, exK: 0, emT: 0 }; }
// Wie gut würde man den Hauch sehen? (0 … 1) – Lampe an, Laterne nah, oder Tag
function umwelt_atemLicht() {
  let v = Math.min(1, fogUniforms.flK.value.x * 1.3); const c = camera.position;
  for (const L of fogUniforms.lamps.value) { if (L.w < .02) continue; const d2 = (L.x - c.x) ** 2 + (L.z - c.z) ** 2; v = Math.max(v, L.w * (1 - Math.min(1, d2 / 110))); }
  return Math.max(v, umwelt_S.amb ? umwelt_S.amb.value * 2 : 0); }
function umwelt_atemTick(dt, aussen, sp) {
  const A = umwelt_S.atem; if (!A) return; A.U.uT.value = umwelt_S.t; A.U.uW.value.set(WIND.fx, WIND.fz);
  // Anstrengung: Rennen und Angst heben sie, sie klingt langsam ab (~15 s)
  const fe = typeof fear !== 'undefined' ? fear.v || 0 : 0; A.E = Math.max(fe * .8, Math.min(1, A.E + (sp > 3.2 ? dt * .3 : -dt * .065)));
  A.T -= dt; if (A.T < 0) { A.T = rand(3.5, 5) * (1 - A.E * .6);
    const an = typeof settings === 'undefined' || (settings.atem !== false && settings.bob !== false), lt = umwelt_atemLicht();
    if (aussen && an && !state.talking && !ui.overlay && lt > .06) { A.ex = .35 + .2 * A.E; A.exK = Math.min(1, lt) * (.75 + .35 * A.E); A.emT = 0; } }
  if (A.ex <= 0) return; A.ex -= dt; A.emT -= dt; if (A.emT > 0) return; A.emT = rand(.045, .075);
  const c = camera.position, f = fwd, fl = Math.hypot(f.x, f.z) || 1, fx = f.x / fl, fz = f.z / fl, i = A.next, g = A.g.attributes; A.next = (i + 1) % A.N;
  const v0 = (.75 + .55 * A.E) * rand(.8, 1.15), life = rand(.8, 1.4) * (1 + .15 * A.E);
  g.aO.setXYZW(i, c.x + fx * .1 + rand(-.015, .015), c.y - .16 + rand(-.01, .01), c.z + fz * .1 + rand(-.015, .015), umwelt_S.t);
  g.aV.setXYZW(i, fx * v0 + vel.x * .85 + rand(-.12, .12), -.22 * v0 + rand(-.05, .06), fz * v0 + vel.z * .85 + rand(-.12, .12), life);
  g.aP.setXYZW(i, rand(.035, .05), rand(.2, .3) * (1 + .3 * A.E), rand(.09, .14) * A.exK, Math.random());
  g.aW.setXYZW(i, WIND.fx, WIND.fz, rand(0, 6.28), rand(2.8, 3.6));
  for (const a of [g.aO, g.aV, g.aP, g.aW]) { a.addUpdateRange(i * 4, 4); a.needsUpdate = true; } }
function umwelt_luftTick(dt, P, indoor, aussen, sp) {
  const S = umwelt_S, on = state.started && !menu.attract && !(typeof ch3 !== 'undefined' && ch3.on && ch3.part === 'white') ? 1 : 0;
  if (S.motes) { const U = S.motes.U; U.uT.value = S.t; U.uW.value.set(WIND.fx, WIND.fz); U.uC.value.copy(camera.position); const inn = indoor || state.inBasement ? 1 : 0;
    U.uIn.value += (inn - U.uIn.value) * Math.min(1, dt * 1.5); U.uOn.value += (on - U.uOn.value) * Math.min(1, dt); }
  if (!S.puff) return; S.puff.U.uT.value = S.t; S.puff.U.uW.value.set(WIND.fx, WIND.fz);
  umwelt_atemTick(dt, aussen, sp);
  // Dampf aus den Gullys (warme Kanalluft in der Novembernacht)
  S.steamT -= dt; if (S.steamT < 0 && aussen) { S.steamT = .32;
    for (const [x, z] of UMW_GULLY) { const d2 = (x - P.x) ** 2 + (z - P.z) ** 2; if (d2 > 1600 || Math.random() < .25) continue; umwelt_puff(x + rand(-.25, .25), .05, z + rand(-.25, .25), rand(-.05, .05), rand(.25, .4), rand(-.05, .05), rand(3, 4.5), .22, rand(1, 1.5), .07, .32); } }
}

WORLD_MODS.push(['Umwelt', async () => {
  const S = umwelt_S; window.__umwelt = S; // Testzugriff
  S.api = { stoss: d => windStoss(d), wind: () => ({ k: WIND.k, gust, dx: WIND.dx, dz: WIND.dz, tr: WIND.tr.map(c => +c.a.toFixed(2)) }), vel: () => vel, licht: on => { flashOn = on; }, blatt: (x, y, z, U) => umwelt_blatt(x, y, z, U || 0, .1) };
  try { umwelt_motesBau(); } catch (e) { console.warn('umwelt: Schwebeteilchen', e); }
  try { umwelt_puffBau(); } catch (e) { console.warn('umwelt: Dampf', e); }
  try { umwelt_atemBau(); } catch (e) { console.warn('umwelt: Atem', e); }
  try { const parts = await umwelt_blattFormen(); if (parts && parts.length > 1) umwelt_blattBau(parts); } catch (e) { console.warn('umwelt: Blätter', e); }
  try { umwelt_quellen(); umwelt_schaukelnSuchen(); } catch (e) { console.warn('umwelt: Schaukeln', e); }
  S.ok = true; S.stats = { blaetter: S.leaf ? S.leaf.N : 0, schaukeln: S.swings.length, quellen: S.src.length };
}]);
const umwelt_V2 = new THREE.Vector2();
WORLD_TICK.push((dt, t, indoor) => {
  const S = umwelt_S; if (!S.ok) return; dt = Math.min(dt, .05); S.t += dt;
  const P = player.pos, sp = Math.hypot(vel.x, vel.z), aussen = state.started && !indoor && !state.inBasement && state.zone !== 'canal' && P.x < 250 && P.x > -800 && !(typeof ch3 !== 'undefined' && ch3.on && ch3.part === 'white') && !menu.attract;
  S.regT -= dt; if (S.regT < 0) { S.regT = 2; try { umwelt_schaukelnSuchen(); } catch (e) {} if (S.amb) S.amb.value = typeof kap === 'function' && kap() === 4 ? .4 : .04;
    renderer.getDrawingBufferSize(umwelt_V2); const px = umwelt_V2.y * .5 / Math.tan(camera.fov * PI / 360); if (S.motes) S.motes.U.uPx.value = px; if (S.puff) S.puff.U.uPx.value = px; if (S.atem) S.atem.U.uPx.value = px; }
  umwelt_schaukelnTick(dt, P);
  umwelt_blaetterTick(dt, P, aussen, sp);
  umwelt_luftTick(dt, P, indoor, aussen, sp);
});
