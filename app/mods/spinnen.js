// =====================================================================  SPINNEN (Modul „spinnen“, Nutzer-Rückmeldung 07.10.2026: Spinnenraum im Amt, Kapitel 2)
// „Die Spinnen sehen scheiße aus, bessere Animation, Sound, Wackel- und Farbeffekte, das Abschüttelsystem muss funktionieren, logisch und spaßig sein – und das Spiel geht nicht mehr weiter.“
// Ursache des Stillstands (Basis, alt): Der Wechsel in die Schüttelphase kam, bevor alle 2400 Spinnen erschienen waren (ab da wurde nicht mehr nachgespawnt), die Endbedingung verlangte aber
//   ch2.spawned >= SPN → nie erfüllt; das Lampenflackern setzte glitchV jedes Bild neu → Verzerrung blieb für immer. Mausschütteln zählte nur mit Zeigersperre.
// Neu:
//  · Ablauf mit Sicherungen: Spawnen läuft in beiden Phasen weiter; Ende = alles gespawnt UND keine Spinne am Boden UND keine auf dem Bild; Selbsthilfe nach 40 s, hartes Ende nach 75 s;
//    Rettung/Abbruch (spn_abbruch) setzt alles zurück; Bild-, Ton- und Lichtzustand werden am Ende immer sauber zurückgesetzt.
//  · Schwarm: das Spinnenmodell des Spiels (Fab) mit Beinen im Vertex-Shader (Tetrapodengang, Körperwippen), Pausen/Ruckeln/Wellenlinien, Blickrichtung = Laufrichtung, Wände/Decke → Boden,
//    dazu sechs echte, skelettanimierte Vogelspinnen (Fab, Laufanimation), die auf Luke zuhalten.
//  · Auf dem Bild: echte 3D-Spinnen (dieselben, gleiche Beinanimation) krabbeln über die „Linse“, werden beim Schütteln mit Schwung abgeschleudert (statt flacher SVG-Silhouetten).
//  · Schütteln: Maus wild bewegen (auch ohne Zeigersperre) oder A/D abwechselnd hämmern → „Wucht“ lädt, ab Schwelle schleudert jeder Stoß mehrere Spinnen weg (Ton, Ruck, Blitz);
//    Anzeige „Befall“/„Wucht“ unten. Mehr Befall = dunkleres Bild, Herzschlag, Atem, Farbsaum, Verzerrung (alles proportional und am Ende weg).
//  · Ton: synthetisierter Spinnen-Lauf (Klickfolgen + Scharren, Schleife), räumlich über Spinnen in Luke-Nähe, Stoffrascheln beim Schütteln, Atem und Herzschlag nach Befall; nichts Lautes.
//  · Licht: defekte Leuchtstoffröhre (Aussetzer, Dunkelphasen, kaltweiß) statt Regenbogenfarben.
// 08.10.2026: alle Spinnen sind jetzt eigene Blender-Modelle in sechs Arten (SPN_ARTEN, unten): Schwarm/Bild = Hauswinkelspinne, große Schwarmspinnen gemischt
//   (Riesenkrabbenspinne, Wolfsspinne, Nosferatu-Spinne, Hauswinkelspinne, Vogelspinne), Spinnenraum/Keller (FAB.spiders) ersetzt, Netze (leben.js) = Kreuzspinnen.
// Testzugriff: __spinnen (am window).
const SPN_V = new THREE.Vector3();
const SPN_S = { ready: false, camActive: 0, heroN: 0, token: 0, active: false, pt: 0, acc: 0, camN: 36, cam: [], heroes: [], hud: null, charge: 0, power: 0, cool: 0, shT: 0, assistT: 0, load: 0, heartT: 0, breathT: 0, rustT: 0, fl: { t: 0, k: 1 },
  vig0: 1, ca0: .003, saved: false, kx: 0, ky: 0, lastKey: '', flip: 0, ext: .075, sndOn: false, snd: null, burstT: 0, hitSnd: 0 };
const SPN_U = { uT: { value: 0 } };
const spn_clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------------------------------------------------------------- Arten (08.10.2026, Nutzer: „keine Fixierung auf Vogelspinnen – gruselig, realistisch, Vielfalt, keine zwei gleich“)
// Eigene Arbeit (Blender, app/tools/blender/spinnen_bau.py): sechs Arten mit Skelett (8 Beine × Coxa–Trochanter–Femur–Patella–Tibia–Metatarsus–Tarsus,
// Taster, Cheliceren) und den Clips idle · walk · lauern · zucken; Texturen gebacken (Zeichnung, Chitin, Haarstriche), Haarkarten „haar“ (nur Nahmodell).
// Dateien assets/ms/spinnen/<art>.glb (Nahmodell 11–13 k Dreiecke + Haar), <art>_lo.glb (≈ 4 k), winkel_xs.glb (Schwarm, ≈ 1,5 k).
// spann: Beinspannweite im Spiel (m) · stride/cyc/cl: Gehzyklus aus dem Bau (Schrittlänge in Prosoma-Längen, Bilder bei 30 fps, Prosomalänge im Modell in m)
const SPN_ARTEN = {
  winkel:    { n: 'Hauswinkelspinne', spann: [.07, .1],   stride: 1.0, cyc: 18, cl: .008 },
  nosferatu: { n: 'Nosferatu-Spinne', spann: [.05, .07],  stride: .75, cyc: 24, cl: .0075 },
  huntsman:  { n: 'Riesenkrabbenspinne', spann: [.12, .17], stride: 1.5, cyc: 16, cl: .0125, gang: 'winkel', gangF: .55 }, // 10.10.: eigener Gehclip rutschte >= 68 % -> Gang der Hauswinkelspinne (gleiches Skelett), Stuetzfuss-Schlupf 15 %
  kreuz:     { n: 'Kreuzspinne',      spann: [.045, .06], stride: .6,  cyc: 26, cl: .0062 },
  wolf:      { n: 'Wolfsspinne',      spann: [.06, .085], stride: .9,  cyc: 16, cl: .0095, gang: 'kreuz', gangF: .55 }, // dito: Gang der Kreuzspinne, Schlupf 9 %
  vogel:     { n: 'Vogelspinne',      spann: [.16, .21],  stride: .6,  cyc: 34, cl: .024 } };
const SPN_SRC = new Map(), SPN_HAAR = [];
// Quelle einer Art laden (einmal): Skalierungs- und Glieder-Positionsspuren entfernen (Knochen-Skalierung bleibt frei für die Variation je Tier), Materialien aufbereiten
function spn_art(art, res = '') { const key = art + (res ? '_' + res : ''); if (SPN_SRC.has(key)) return SPN_SRC.get(key);
  const p = (async () => { const sc = await msModel('spinnen', key + '.glb'), clips = {};
    for (const c of sc.animations || []) { c.tracks = c.tracks.filter(t => !/\.scale$/.test(t.name) && (!/\.position$/.test(t.name) || /^(body|abdomen)\./.test(t.name))); clips[c.name] = c; }
    { const G = SPN_ARTEN[art] && SPN_ARTEN[art].gang; if (G) { try { const d = await spn_art(G, res); if (d.clips.walk) clips.walk = d.clips.walk; } catch (e) { console.warn('Spinnen: Spenderclip', e); } } }
    sc.traverse(o => { if (!o.isMesh) return; o.receiveShadow = false;
      if (/^haar/.test(o.name)) { const m = o.material; m.alphaTest = .42; m.transparent = false; m.depthWrite = true; m.side = THREE.DoubleSide; m.userData.spnNeu = true; o.castShadow = false; }
      else { o.material = spn_hautNeu(o.material); o.castShadow = true; } });
    sc.updateMatrixWorld(true); const sz = new THREE.Box3().setFromObject(sc).getSize(new THREE.Vector3());
    return { scene: sc, clips, ext: Math.max(sz.x, sz.z) || .1 }; })();
  SPN_SRC.set(key, p); return p; }
// Haut: die gebackenen Karten (Albedo, Normal, Rauheit) + Samtglanz der Behaarung, dünner Chitin-Klarlack, schwaches Eigenlicht aus der Albedo (im Dunkeln lesbar)
function spn_hautNeu(src) { if (src.userData && src.userData.spnNeu) return src;
  const m = new THREE.MeshPhysicalMaterial({ map: src.map, normalMap: src.normalMap, roughnessMap: src.roughnessMap, roughness: 1, metalness: 0,
    sheen: .55, sheenRoughness: .5, sheenColor: new THREE.Color(.3, .26, .21), clearcoat: .14, clearcoatRoughness: .42,
    emissive: new THREE.Color(.16, .13, .1), emissiveMap: src.map || null, emissiveIntensity: src.map ? .12 : 0 });
  if (src.normalScale) m.normalScale.copy(src.normalScale); if (m.map) m.map.anisotropy = 8; m.name = src.name; m.userData.spnNeu = true; return m; }
// Ein Tier: eigener Klon mit eigener Größe, Beinlänge, Hinterleib, Färbung, Tempo – keine zwei gleich. o: { spann, res, bauch, ton }
async function spn_neu(art, o = {}) { const A = SPN_ARTEN[art], src = await spn_art(art, o.res || ''), { clone } = await import('three/addons/utils/SkeletonUtils.js');
  const g = clone(src.scene), spann = o.spann || rand(A.spann[0], A.spann[1]), k = spann / src.ext; g.scale.setScalar(k); g.userData.noCol = true;
  const B = {}; g.traverse(b => { if (b.isBone) B[b.name] = b; });
  const lf = rand(.92, 1.1); for (const s of 'LR') for (let i = 1; i <= 4; i++) { const b = B[s + i + '_coxa']; if (b) b.scale.setScalar(lf * rand(.97, 1.03)); }
  if (B.abdomen) B.abdomen.scale.setScalar(o.bauch || rand(.86, 1.22));
  const v = o.ton || rand(.8, 1.16), col = new THREE.Color(v * rand(.95, 1.06), v * rand(.95, 1.04), v * rand(.9, 1.05)), mats = new Map(), haar = [];
  g.traverse(m => { if (!m.isMesh) return; if (!mats.has(m.material)) { const c = m.material.clone(); c.color.multiply(col); mats.set(m.material, c); } m.material = mats.get(m.material); if (/^haar/.test(m.name)) haar.push(m); });
  for (const h of haar) SPN_HAAR.push({ m: h, root: g });
  const mx = new THREE.AnimationMixer(g), acts = {}; for (const n in src.clips) acts[n] = mx.clipAction(src.clips[n]);
  const v1 = A.stride * A.cl * k / (.55 * A.cyc / 30) * (A.gangF || 1); // Körpergeschwindigkeit (m/s) bei timeScale 1, Füße stehen in der Stützphase (gangF: Spenderclip, gemessen)
  return { g, mx, acts, art, k, v1, spann }; }
// Starre Pose für Instanzen (Schwarm, Bildschirm): Gehpose einbacken, Haut-Attribute entfernen, glatt schattieren (Normalen über Nähte gemittelt), auf ext normieren, Kopf → +X
async function spn_starr(art, res, ext = .125) { const src = await spn_art(art, res), { clone } = await import('three/addons/utils/SkeletonUtils.js');
  const cl = clone(src.scene), mx = new THREE.AnimationMixer(cl), clip = src.clips.walk || src.clips.idle; mx.clipAction(clip).play(); mx.setTime(clip.duration * .27); cl.updateMatrixWorld(true);
  let sm = null; cl.traverse(o => { if (o.isSkinnedMesh && !/^haar/.test(o.name) && !sm) sm = o; }); if (!sm) return null; sm.skeleton.update();
  const g = sm.geometry.clone(), pos = g.attributes.position, v = new THREE.Vector3(); for (let i = 0; i < pos.count; i++) { sm.getVertexPosition(i, v); pos.setXYZ(i, v.x, v.y, v.z); }
  g.deleteAttribute('skinIndex'); g.deleteAttribute('skinWeight'); if (g.attributes.tangent) g.deleteAttribute('tangent');
  { const BU = await import('three/addons/utils/BufferGeometryUtils.js'), p0 = new THREE.BufferGeometry(); p0.setAttribute('position', pos.clone()); if (g.index) p0.setIndex(g.index.clone());
    const pm = BU.mergeVertices(p0, 1e-6); pm.computeVertexNormals(); const nm = new Map(), PP = pm.attributes.position, NN = pm.attributes.normal, key = (x, y, z) => Math.round(x * 1e6) + ',' + Math.round(y * 1e6) + ',' + Math.round(z * 1e6);
    for (let i = 0; i < PP.count; i++) nm.set(key(PP.getX(i), PP.getY(i), PP.getZ(i)), i);
    const n = new Float32Array(pos.count * 3); for (let i = 0; i < pos.count; i++) { const j = nm.get(key(pos.getX(i), pos.getY(i), pos.getZ(i))); if (j != null) { n[i * 3] = NN.getX(j); n[i * 3 + 1] = NN.getY(j); n[i * 3 + 2] = NN.getZ(j); } }
    g.setAttribute('normal', new THREE.BufferAttribute(n, 3)); }
  g.computeBoundingBox(); const bb = g.boundingBox, sz = bb.getSize(new THREE.Vector3()), k = ext / Math.max(sz.x, sz.z); g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); g.scale(k, k, k); g.rotateY(-PI / 2); // Kopf (−z) → +X
  g.computeBoundingBox(); g.computeBoundingSphere(); const mat = sm.material.clone(); mat.color.setRGB(1, 1, 1); return { geo: g, mat }; }
// Die vier Spinnen der Basis (Spinnenraum Amt: Vogelspinne, Riesenkrabbenspinne, Wolfsspinne; Keller: Hauswinkelspinne) – statt des einen Fab-Modells
async function spn_fabErsetzen() { if (typeof FAB === 'undefined' || !FAB.spiders || !FAB.spiders.length) return;
  const plan = ['vogel', 'huntsman', 'wolf', 'winkel'], gr = { vogel: .2, huntsman: .17, wolf: .13, winkel: .1 };
  for (let i = 0; i < FAB.spiders.length; i++) { const S = FAB.spiders[i], art = plan[i % plan.length], n = await spn_neu(art, { spann: gr[art] * rand(.9, 1.1) });
    for (const c of [...S.g.children]) S.g.remove(c); S.g.add(n.g); try { S.mx.stopAllAction(); } catch (e) {}
    S.mx = n.mx; S.acts = n.acts; S.acts.walk.timeScale = spn_clamp(.18 / n.v1, .4, 4); S.acts.idle.timeScale = rand(.8, 1.2); S.acts.idle.play(); S.mx.update(rand(0, 3)); S.cur = S.acts.idle; S.art = art; } }

// ---------------------------------------------------------------- Beine im Vertex-Shader (Instanzen): Tetrapodengang, Hubbewegung, Körperwippen
function spn_beine(mat, ext) {
  const r0 = (ext * .15).toFixed(4), r1 = (ext * .36).toFixed(4), am = (ext * .07).toFixed(4), hb = (ext * .1).toFixed(4), bb = (ext * .025).toFixed(4);
  mat.onBeforeCompile = sh => { sh.uniforms.uSpT = SPN_U.uT;
    sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      float spNv = 1. - abs(dot(normalize(vViewPosition), normalize(normal)));
      totalEmissiveRadiance += vec3(.42, .46, .56) * pow(spNv, 3.0) * .3;`); // kalter Randglanz: im dunklen Raum bleibt die Silhouette lesbar, Chitin glänzt
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSpT;\nfloat spH(float n){ return fract(sin(n * 12.9898) * 43758.5453); }')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
      float spPh = spH(float(gl_InstanceID)) * 6.2831; float spSd = .8 + .45 * spH(float(gl_InstanceID) + 7.);
      #else
      float spPh = 0.; float spSd = 1.;
      #endif
      float spR = length(transformed.xz); float spLeg = smoothstep(${r0}, ${r1}, spR); float spA = atan(transformed.z, transformed.x);
      float spW = uSpT * 18. * spSd + spPh + spA * 2.;
      vec2 spTg = vec2(-transformed.z, transformed.x) / max(spR, .0008);
      transformed.xz += spTg * sin(spW) * spLeg * ${am};
      transformed.y += max(0., cos(spW)) * spLeg * ${hb};
      transformed.y += abs(sin(uSpT * 18. * spSd + spPh)) * ${bb};`); };
  mat.customProgramCacheKey = () => 'spn_beine'; mat.needsUpdate = true; }

// ---------------------------------------------------------------- Ton: Spinnenlauf synthetisiert (Klickfolgen aus Beinspitzen + leises Scharren), als Schleife und räumliche Einzelstücke
function spn_buffer() {
  const c = Audio.ctx, sr = c.sampleRate, n = Math.floor(sr * 6), b = c.createBuffer(1, n, sr), d = b.getChannelData(0);
  for (let r = 0; r < 150; r++) { let t = Math.random() * 5.8; const nt = 3 + Math.floor(Math.random() * 10), gap = .028 + Math.random() * .045, a0 = .22 + Math.random() * .6, f = 2400 + Math.random() * 3800;
    for (let k = 0; k < nt; k++) { const tt = t + k * gap * (1 + (Math.random() - .5) * .4), a = a0 * (1 - k / (nt + 2)) * (.55 + Math.random() * .45), i0 = Math.floor(tt * sr), len = Math.floor(sr * (.003 + Math.random() * .009));
      let y1 = 0, y2 = 0; const w = 2 * Math.PI * f * (1 + (Math.random() - .5) * .3) / sr, rr = .93, c1 = 2 * rr * Math.cos(w), c2 = -rr * rr;
      for (let i = 0; i < len && i0 + i < n; i++) { const y = (Math.random() * 2 - 1) * .35 + c1 * y1 + c2 * y2; y2 = y1; y1 = y; d[i0 + i] += y * a * Math.exp(-i / (len * .35)); } } }
  let lp = 0; for (let i = 0; i < n; i++) { const t = i / sr, am = Math.pow(Math.max(0, Math.sin(t * 2 * Math.PI * 9.3) * Math.sin(t * 2 * Math.PI * 1.7 + 1)), 2), x = Math.random() * 2 - 1; lp += (x - lp) * .5; d[i] += (x - lp) * am * .06; }
  let pk = 0; for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i])); const g = .85 / (pk || 1), fade = Math.floor(sr * .06);
  for (let i = 0; i < n; i++) { let k = g; if (i < fade) k *= i / fade; else if (i > n - fade) k *= (n - i) / fade; d[i] *= k; }
  return b; }
const spn_snd = {
  start(level) { const A = Audio; if (!A.ctx || !A.buf) return; if (!A.buf.spn_skit) A.buf.spn_skit = spn_buffer();
    if (!this.h) { this.h = A.play('spn_skit', { loop: true, gain: 0, offset: Math.random() * 3 }); this.lv = 0; } this.set(level); },
  set(level) { if (!this.h || !this.h.g) return; this.lv = level; try { this.h.g.gain.setTargetAtTime(level * .55, Audio.ctx.currentTime, .35); } catch (e) {} },
  stop() { if (this.h) { try { this.h.stop(.8); } catch (e) {} this.h = null; } },
  at(x, y, z, v = .25) { const A = Audio; if (!A.ctx || !A.buf || !A.buf.spn_skit) return; A.play('spn_skit', { gain: v, rate: rand(.9, 1.25), offset: rand(0, 5.2), dur: rand(.25, .6), x, y, z, ref: 1.6 }); } };
function spn_wumms(power = 1) { const A = Audio; if (!A.ctx) return; // Schleudern: Stoff, kurzer Luftzug, dumpfer Aufprall am Körper – leise genug, nie schrill
  try { A.play('pz_stoff', { gain: .22 + .12 * power, rate: rand(1.1, 1.5) }); if (A.buf.pk_stoff) A.play('pk_stoff', { gain: .18, rate: rand(1.1, 1.4), delay: .02 }); } catch (e) {}
  try { const o = A.osc('sine', 130, 0, .22); o.frequency.exponentialRampToValueAtTime(52, A.ctx.currentTime + .2); A.env(o, .09 + .05 * power, .004, .2); } catch (e) {} }

// ---------------------------------------------------------------- Anzeige
function spn_hud(on) {
  const S = SPN_S; if (!S.hud) {
    const css = document.createElement('style'); css.textContent = `#spnHud{position:fixed;left:50%;bottom:24vh;transform:translateX(-50%);z-index:9;pointer-events:none;text-align:center;font-family:'Special Elite',Georgia,serif;color:#e8dcc4;opacity:0;transition:opacity .6s;width:min(520px,86vw)}
      #spnHud.on{opacity:1} #spnHud .t{letter-spacing:.38em;font-size:15px;text-shadow:0 0 8px #000;margin-bottom:10px} #spnHud .l{font-size:11px;letter-spacing:.3em;opacity:.72;display:flex;justify-content:space-between;text-shadow:0 0 6px #000}
      #spnHud .bar{height:8px;background:rgba(0,0,0,.6);border:1px solid rgba(232,220,196,.28);margin:5px 0 9px;position:relative;box-shadow:0 0 12px rgba(0,0,0,.7)} #spnHud .bar i{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#7a241d,#d8503a);box-shadow:0 0 10px rgba(216,80,58,.5)}
      #spnHud .bar.p i{background:linear-gradient(90deg,#8a7a3a,#f2dc78);box-shadow:0 0 10px rgba(242,220,120,.45)} #spnHud .h{font-size:12px;opacity:.8;margin-top:4px;text-shadow:0 0 6px #000;letter-spacing:.05em}`;
    document.head.appendChild(css); const d = document.createElement('div'); d.id = 'spnHud';
    d.innerHTML = '<div class="t">SCHÜTTLE SIE AB</div><div class="l"><span>BEFALL</span></div><div class="bar"><i id="spnL"></i></div><div class="l"><span>WUCHT</span></div><div class="bar p"><i id="spnP"></i></div><div class="h">Maus wild hin- und herreißen · oder A und D abwechselnd hämmern</div>';
    document.body.appendChild(d); S.hud = d; S.hl = d.querySelector('#spnL'); S.hp = d.querySelector('#spnP'); }
  S.hud.classList.toggle('on', !!on); }

// ---------------------------------------------------------------- Eingabe: Maus (auch ohne Zeigersperre) und A/D
function spn_eingabe() {
  const S = SPN_S;
  document.addEventListener('mousemove', e => { if (ch2.spiderPhase !== 'shake') { S.kx = e.clientX; S.ky = e.clientY; return; }
    let dx = e.movementX, dy = e.movementY; if (!(document.pointerLockElement) || dx === undefined) { dx = e.clientX - S.kx; dy = e.clientY - S.ky; } S.kx = e.clientX; S.ky = e.clientY;
    const m = Math.abs(dx) + Math.abs(dy); if (m < 700) S.inp = (S.inp || 0) + m; }, true);
  document.addEventListener('keydown', e => { if (ch2.spiderPhase !== 'shake' || e.repeat) return; const k = e.code;
    if (k === 'KeyA' || k === 'KeyD' || k === 'ArrowLeft' || k === 'ArrowRight') { const side = (k === 'KeyA' || k === 'ArrowLeft') ? 'L' : 'R'; S.inp = (S.inp || 0) + (side !== S.lastKey ? 190 : 80); S.lastKey = side; } }, true); }

// ---------------------------------------------------------------- Spinnen auf dem Bild (3D, Kamera-Raum)
function spn_camSpawn(big) { const S = SPN_S, c = S.cam.find(q => !q.on); if (!c) return null;
  const side = Math.floor(rand(0, 4)), e = 1.15; c.u = side === 0 ? -e : side === 1 ? e : rand(-.9, .9); c.v = side === 2 ? -e : side === 3 ? e : rand(-.8, .8);
  c.tu = rand(-.6, .6); c.tv = rand(-.5, .5); c.sp = rand(.22, .6); c.h = Math.atan2(c.tv - c.v, c.tu - c.u); c.sc = big ? rand(1.4, 2.0) : rand(.5, 1.25); c.z = rand(.42, .78); c.ph = rand(0, 6); c.on = true; c.fl = 0; c.pause = 0; c.t = rand(1.2, 3.4); c.grip = rand(.5, 1.2);
  return c; }
function spn_camUpdate(dt, t) {
  const S = SPN_S, M = S.camMesh, asp = camera.aspect, hh0 = Math.tan(camera.fov * Math.PI / 360); let n = 0, aktiv = 0; const m4 = spM, q = spQ, qf = S.qFlat, qh = S.qH, pos = spP, sc = SPN_V;
  for (let i = 0; i < S.camN; i++) { const c = S.cam[i];
    if (!c.on) { m4.makeScale(0, 0, 0); M.setMatrixAt(i, m4); continue; }
    if (c.fl > 0) { // abgeschleudert: nach außen und in den Raum, kleiner, dreht sich
      c.fl += dt; c.u += c.fu * dt; c.v += c.fv * dt; c.z += dt * 2.6; c.h += c.spin * dt; c.sc *= Math.max(0, 1 - dt * 2.2); if (c.fl > .6 || c.sc < .05) { c.on = false; m4.makeScale(0, 0, 0); M.setMatrixAt(i, m4); continue; } }
    else { aktiv++;
      c.t -= dt; if (c.t < 0) { c.pause = Math.random() < .35 ? rand(.12, .5) : 0; c.t = rand(.8, 2.6); c.tu = spn_clamp(c.u + rand(-.9, .9), -.95, .95); c.tv = spn_clamp(c.v + rand(-.8, .8), -.85, .85); }
      c.pause = Math.max(0, c.pause - dt); const want = Math.atan2(c.tv - c.v, c.tu - c.u) + Math.sin(t * 5 + c.ph) * .35; let df = want - c.h; df = Math.atan2(Math.sin(df), Math.cos(df)); c.h += df * Math.min(1, dt * 7);
      const sp = c.pause > 0 ? 0 : c.sp * (.7 + .3 * Math.sin(t * 9 + c.ph)); c.u += Math.cos(c.h) * sp * dt / asp; c.v += Math.sin(c.h) * sp * dt; }
    const hh = hh0 * c.z; pos.set(c.u * asp * hh, c.v * hh, -c.z); qh.setFromAxisAngle(S.zAx, c.h + S.flip); q.copy(qh).multiply(qf); sc.setScalar(c.sc); m4.compose(pos, q, sc); M.setMatrixAt(i, m4); n++; }
  M.instanceMatrix.needsUpdate = true; M.visible = n > 0; S.camActive = aktiv; return aktiv; }
function spn_schleudern(n) { const S = SPN_S, list = S.cam.filter(c => c.on && !c.fl).sort((a, b) => b.sc - a.sc); let k = 0;
  for (const c of list) { if (k >= n) break; c.fl = .001; const a = Math.atan2(c.v, c.u) + rand(-.5, .5), v = rand(1.6, 3.4); c.fu = Math.cos(a) * v; c.fv = Math.sin(a) * v; c.spin = rand(-14, 14); k++; }
  return k; }

// ---------------------------------------------------------------- Große Spinnen im Schwarm (skelettanimiert): gemischte Arten, jede anders groß/gefärbt/schnell
async function spn_helden() { const S = SPN_S; if (S.heroes.length) return;
  const plan = ['huntsman', 'wolf', 'nosferatu', 'winkel', 'huntsman', 'vogel', 'wolf', 'nosferatu', 'winkel', 'huntsman', 'wolf', 'nosferatu', 'vogel', 'winkel'],
    gr = { huntsman: [.15, .2], wolf: [.1, .14], nosferatu: [.08, .11], winkel: [.1, .13], vogel: [.17, .22] };
  for (let i = 0; i < plan.length; i++) { const art = plan[i]; let n; try { n = await spn_neu(art, { spann: rand(...gr[art]) }); } catch (e) { console.warn('Spinnen: Art', art, e); continue; }
    const g = new THREE.Group(); g.add(n.g); g.visible = false; g.userData.noCol = true; scene.add(g); try { auftritt_reg(g, { name: 'Spinne(Held)', ein: .3, aus: .3, r: .5 }); } catch (e) {}
    const sp = Math.min(rand(.5, .9), n.v1 * 4.5), w = n.acts.walk; w.timeScale = sp / n.v1; w.play(); n.mx.update(rand(0, 2)); S.heroes.push({ g, mx: n.mx, on: false, x: 0, z: 0, dir: 0, sp, t: 0, art }); } }
function spn_heldStart() { const S = SPN_S; let k = 0; for (const h of S.heroes) { h.on = true; h.g.visible = true; const side = Math.floor(rand(0, 4)); h.x = side === 0 ? X + 36.6 : side === 1 ? X + 45.4 : rand(X + 37, X + 45); h.z = side === 2 ? Z - 4.5 : side === 3 ? Z + 4.5 : rand(Z - 4.5, Z + 4.5); h.t = 1 + k++ * .6; h.g.position.set(h.x, 0, h.z); h.g.visible = false; } }
function spn_heldUpdate(dt) { const S = SPN_S, P = player.pos; let n = 0;
  for (const h of S.heroes) { if (!h.on) continue; h.t -= dt; if (h.t > 0) { continue; } h.g.visible = true; n++;
    const dx = P.x - h.x, dz = P.z - h.z, d = Math.hypot(dx, dz) || .01; h.dir = Math.atan2(dx, dz); let df = h.dir + PI - h.g.rotation.y; df = Math.atan2(Math.sin(df), Math.cos(df)); h.g.rotation.y += Math.sign(df) * Math.min(Math.abs(df), dt * 3);
    if (Math.abs(df) < .6) { h.x += Math.sin(h.dir) * h.sp * dt; h.z += Math.cos(h.dir) * h.sp * dt; } h.g.position.set(h.x, .01, h.z); h.mx.update(dt);
    if (d < .55) { h.on = false; h.g.visible = false; const c = spn_camSpawn(true); if (c) { c.sc = rand(1.6, 2.2); } ch2.onPlayer += 3; shake = Math.max(shake, .012); Audio.heart(); } else if (Math.random() < dt * 1.5) spn_snd.at(h.x, .1, h.z, .3); }
  S.heroN = S.heroes.filter(h => h.on).length; return n; }

// ---------------------------------------------------------------- Schwarm am Boden
function spn_spawn(i) { const d = spData[i], r = Math.random(); d.hidden = false; d.on = true; d.ph = rand(0, 6.2); d.pause = 0; d.pt = rand(.2, 1.4); d.s = rand(.45, 1.0); d.sp = rand(.8, 2.0); d.h = 0; d.mode = 0;
  if (r < .3) { d.x = X + 44 + rand(-.5, .5); d.z = Z - 3.8 + rand(-.5, .5); d.y = rand(.2, 1.5); d.vy = rand(.6, 1.4); }                                  // aus dem Kokon
  else if (r < .62) { const side = Math.floor(rand(0, 4)); d.x = side === 0 ? X + 36.2 : side === 1 ? X + 45.8 : rand(X + 36.2, X + 45.8); d.z = side === 2 ? Z - 4.8 : side === 3 ? Z + 4.8 : rand(Z - 4.8, Z + 4.8); d.y = rand(.05, 2.1); d.vy = rand(.5, 1.2); } // von den Wänden
  else { d.x = rand(X + 36.5, X + 45.5); d.z = rand(Z - 4.6, Z + 4.6); d.y = C2.h - .05; d.vy = rand(.9, 2.4); }                                                     // von der Decke
  d.x0 = d.x; d.z0 = d.z; }
function spn_lampen(dt, t) { const S = SPN_S, L = spiderLight; if (!(ch2.lampsCrazy > 0)) return; S.fl.t -= dt;
  if (S.fl.t <= 0) { const r = Math.random(); if (r < .2) { S.fl.k = 0; S.fl.t = Math.random() < .3 ? rand(.5, 1.1) : rand(.05, .3); glitchV = Math.max(glitchV, .22); } else if (r < .5) { S.fl.k = rand(.12, .5); S.fl.t = rand(.03, .12); } else { S.fl.k = 1; S.fl.t = rand(.18, .9); } }
  L.k = S.fl.k * 1.35 * (1 + Math.sin(t * 47) * .08); L.l.color.setRGB(.84, .93, 1); L.tube.material.emissive.copy(L.l.color); }

function spn_update(dt, t) {
  const S = SPN_S; SPN_U.uT.value = t; if (!S.ready) return; spn_lampen(dt, t);
  const ph = ch2.spiderPhase;
  if (ph !== 'swarm' && ph !== 'shake') { if (S.active && ph !== 'lock') spn_aufraeumen(); return; }
  dt = Math.min(dt, .05); S.pt += dt; const P = player.pos; S.active = true;
  if (!S.saved) { S.saved = true; S.vig0 = filmPass.uniforms.vig.value; S.ca0 = filmPass.uniforms.ca.value; }
  // --- nachspawnen (beide Phasen – früher nur im Schwarm: Endbedingung nie erreichbar)
  if (ch2.spawned < SPN) { S.acc += dt * (S.pt < 1.6 ? 150 : 430); while (S.acc >= 1 && ch2.spawned < SPN) { S.acc -= 1; spn_spawn(ch2.spawned++); } }
  spiders.count = Math.max(1, ch2.spawned); spiders.visible = true;
  // --- Schwarm bewegen
  let alive = 0, near = 0, nx = 0, nz = 0, nd = 1e9; const hitP = ph === 'swarm' ? .5 : .3;
  for (let i = 0; i < ch2.spawned; i++) { const d = spData[i];
    if (!d.on) { if (!d.hidden) { d.hidden = true; spM.makeScale(0, 0, 0); spiders.setMatrixAt(i, spM); } continue; }
    alive++; const dx = P.x - d.x, dz = P.z - d.z, dist = Math.hypot(dx, dz) || .001, hx = dx / dist, hz = dz / dist;
    d.pt -= dt; if (d.pt < 0) { d.pause = Math.random() < .14 ? rand(.12, .45) : 0; d.pt = rand(.35, 1.5); } if (d.pause > 0) d.pause -= dt;
    const wob = (Math.sin(t * 6.5 + d.ph) * .5 + Math.sin(t * 2.7 + d.ph * 2) * .3) * (dist > 1.2 ? 1 : .4), sp = d.pause > 0 ? 0 : d.sp * (dist < 2.4 ? 1.45 : 1) * (.8 + .2 * Math.sin(t * 11 + d.ph));
    const vx = hx * sp - hz * wob * sp * .55, vz = hz * sp + hx * wob * sp * .55; d.x += vx * dt; d.z += vz * dt; if (d.y > .02) d.y = Math.max(.02, d.y - dt * d.vy * (dist < 3 ? 1.5 : .6));
    if (sp > .01) { const want = Math.atan2(-vz, vx); let df = want - d.h; df = Math.atan2(Math.sin(df), Math.cos(df)); d.h += df * Math.min(1, dt * 9); }
    if (dist < nd) { nd = dist; nx = d.x; nz = d.z; }
    if (dist < .42) { d.on = false; ch2.onPlayer++; S.hitSnd++; if (S.camActive < S.camN - 2 && Math.random() < hitP) spn_camSpawn(false); }
    else { spQ.setFromAxisAngle(spUp, d.h + S.flip); spP.set(d.x, d.y, d.z); SPN_V.setScalar(d.s); spM.compose(spP, spQ, SPN_V); spiders.setMatrixAt(i, spM); } }
  spiders.instanceMatrix.needsUpdate = true;
  if (ph === 'swarm') { if (ch2.onPlayer >= 70) { ch2.spiderPhase = 'shake'; S.shT = 0; spn_hud(true); try { lockPointer(); } catch (e) {} Audio.heart(); subtitle('Sie sind auf dir. <b>Schüttle sie ab!</b>', 3200); setC2Objective('SCHÜTTLE SIE AB — Maus wild bewegen oder A und D abwechselnd hämmern'); } }
  spn_heldUpdate(dt);
  const camN = spn_camUpdate(dt, t);
  // --- Befall und Schütteln
  const aliveTot = alive + (S.heroN || 0), load = spn_clamp(camN / 18, 0, 1); S.load += (load - S.load) * Math.min(1, dt * 6);
  if (ch2.spiderPhase === 'shake') { S.shT += dt;
    const inp = S.inp || 0; S.inp = 0; S.charge += inp; S.charge *= Math.exp(-dt * 1.5); S.power = spn_clamp(S.charge / 700, 0, 1.5); S.cool -= dt;
    if (S.charge > 520 && S.cool <= 0) { const n = 2 + Math.floor(S.power * 2.2), got = spn_schleudern(n); S.charge -= 380; S.cool = .15; if (got) { spn_wumms(S.power); shake = Math.max(shake, .018 + .01 * S.power); glitchV = Math.max(glitchV, .3); filmPass.uniforms.flash.value = Math.max(filmPass.uniforms.flash.value, .08);
        for (const d of spData) { if (!d.on) continue; if (Math.hypot(d.x - P.x, d.z - P.z) < 1.3) { d.on = false; } } } }
    // Selbsthilfe: nach 40 s fallen sie von allein ab (nie hängen bleiben); hartes Ende nach 75 s
    if (S.shT > 40) { S.assistT -= dt; if (S.assistT <= 0) { S.assistT = .3; spn_schleudern(1); if (S.shT > 52) for (const d of spData) if (d.on && Math.hypot(d.x - P.x, d.z - P.z) < 2.2) d.on = false; } }
    if (S.shT > 75) { for (const d of spData) d.on = false; ch2.spawned = SPN; for (const h of S.heroes) { h.on = false; h.g.visible = false; } spn_schleudern(99); }
    if (S.hl) { S.hl.style.width = (S.load * 100).toFixed(0) + '%'; S.hp.style.width = spn_clamp(S.charge / 520, 0, 1) * 100 + '%'; }
    if (ch2.spawned >= SPN && aliveTot === 0 && camN === 0 && !S.cam.some(c => c.on)) { spn_ende(); return; } }
  // --- Bild- und Tonwirkung nach Befall
  const L = S.load, pulse = Math.max(0, Math.sin(t * (6 + 5 * L)));
  filmPass.uniforms.vig.value = S.vig0 * (1 + .55 * L); filmPass.uniforms.ca.value = S.ca0 + .0022 * L * (.4 + .6 * pulse);
  glitchV = Math.max(glitchV, .012 + .055 * L); shake = Math.max(shake, .0025 + .007 * L);
  spn_snd.set(spn_clamp(alive / 500, 0, 1) * .7 + L * .5 + (alive > 0 ? .08 : 0));
  S.rustT -= dt; if (S.rustT <= 0 && nd < 7) { S.rustT = rand(.09, .22) / (.4 + spn_clamp(alive / 400, 0, 1)); spn_snd.at(nx, .05, nz, .22 + .2 * L); }
  if (L > .12) { S.heartT -= dt; if (S.heartT <= 0) { S.heartT = 1.15 - .55 * L; Audio.heart(); } S.breathT -= dt; if (S.breathT <= 0 && L > .45) { S.breathT = rand(2.4, 3.6); try { Audio.play(Audio.pick('pz_keuch', 'pz_atem'), { gain: .1 + .14 * L, rate: .95 + .2 * L }); } catch (e) {} } }
  if (S.hitSnd > 0) { try { Audio.play('pz_stoff', { gain: .05 + .02 * Math.min(S.hitSnd, 4), rate: rand(1.5, 2), dur: .18 }); } catch (e) {} S.hitSnd = 0; }
}
function spn_aufraeumen() { const S = SPN_S; S.active = false; S.saved && (filmPass.uniforms.vig.value = S.vig0, filmPass.uniforms.ca.value = S.ca0); S.saved = false; spn_hud(false); spn_snd.stop();
  for (const c of S.cam) c.on = false; if (S.camMesh) S.camMesh.visible = false; for (const h of S.heroes) { h.on = false; h.g.visible = false; } S.charge = 0; S.power = 0; S.load = 0; S.camActive = 0; S.heroN = 0; S.inp = 0; }
async function spn_ende() { const S = SPN_S; if (S.ending) return; S.ending = true; spn_aufraeumen(); glitchV = 0; shake = 0; ch2.lampsCrazy = 0; filmPass.uniforms.glitch.value = 0;
  try { Audio.play('pz_atem', { gain: .3, rate: .85 }); } catch (e) {} try { await spidersGone(); } finally { S.ending = false; } }
function spn_abbruch() { const S = SPN_S; S.token++; spn_aufraeumen(); S.acc = 0; S.pt = 0; S.shT = 0; spiders.visible = false; for (const d of spData) { d.on = false; d.hidden = false; } ch2.spawned = 0; ch2.onPlayer = 0; ch2.removed = 0; ch2.lampsCrazy = 0;
  try { spiderLight.k = 1; spiderLight.l.color.set(0xffe0b0); spiderLight.tube.material.emissive.set(0xffe0b0); } catch (e) {} glitchV = 0;
  if (ch2.spiderPhase === 'lock' || ch2.spiderPhase === 'swarm' || ch2.spiderPhase === 'shake') { ch2.spiderPhase = 'idle'; spiderDoorIn.locked = false; spiderDoorIn.lockedText = ''; } }

// ---------------------------------------------------------------- Ablauf
async function spn_event() { const S = SPN_S; const tk = ++S.token, ok = () => S.token === tk && ch2.spiderPhase !== 'idle';
  try { if (typeof klang_load === 'function') ['pz_stoff', 'pk_stoff', 'pz_keuch', 'pz_atem', 'wd_fleisch'].forEach(n => klang_load(n)); } catch (e) {}
  ch2.spiderPhase = 'lock'; spiderDoorIn.set(false); spiderDoorIn.locked = true; spiderDoorIn.lockedText = 'Zu. Von außen. Etwas hat den Riegel vorgeschoben.';
  Audio.slam(spiderDoorIn.m.position.x, 1.2, spiderDoorIn.m.position.z); shake = .05; setC2Objective('Die Tür ist zu.');
  S.acc = 0; S.pt = 0; S.shT = 0; S.charge = 0; S.inp = 0; S.fl.t = 0; S.ending = false;
  await wait(1400); if (!ok()) return; ch2.lampsCrazy = 1; Audio.buzz(X + 41, 2.3, Z); subtitle('Das Licht. Es … atmet.', 3000); spn_snd.start(.06);
  await wait(3300); if (!ok()) return; subtitle('Etwas bewegt sich in den Wänden.', 2800); spn_snd.set(.2); shake = Math.max(shake, .008); try { await spn_helden(); } catch (e) { console.warn('Spinnen: Vogelspinnen', e); }
  await wait(2300); if (!ok()) return; // der Kokon reißt auf
  cocoon.scale.set(1.15, 1.1, 1.15); shake = Math.max(shake, .06); glitchV = Math.max(glitchV, .4); try { Audio.play('wd_fleisch', { gain: .22, rate: .8, x: X + 44, y: 1.3, z: Z - 3.8, ref: 2 }); } catch (e) {}
  ch2.spiderPhase = 'swarm'; ch2.spiderT = 0; ch2.onPlayer = 0; ch2.shake = 0; ch2.spawned = 0; ch2.removed = 0; for (const d of spData) { d.on = false; d.hidden = false; } for (const c of S.cam) c.on = false; S.heroN = 0; S.camActive = 0;
  spiders.visible = true; spiders.count = 1; spn_heldStart(); spn_snd.start(.3);
  subtitle('Aus den Ritzen. Aus der Decke. Aus dem Kokon. <b>Tausende.</b>', 3600); setC2Objective('Sie kommen. Halt durch.'); }

// Haut: dunkles Chitin mit Fellglanz (sheen), feiner Haarstruktur (erzeugte Normalkarte), leichtem Eigenlicht (damit Fell und Streifen im Dunkeln lesbar bleiben) – für ALLE Spinnen im Spiel
function spn_haarNormal() { const S = SPN_S; if (S.haarN) return S.haarN; const n = 256, h = new Float32Array(n * n), r = Math.random;
  for (let k = 0; k < 5200; k++) { let x = r() * n, y = r() * n; const a = (r() - .5) * .5 + Math.PI / 2, len = 10 + r() * 38, v = .4 + r() * .6; for (let t = 0; t < len; t++) { x += Math.cos(a + Math.sin(t * .15 + k) * .12); y += Math.sin(a + Math.sin(t * .15 + k) * .12); const ix = ((x % n) + n) % n | 0, iy = ((y % n) + n) % n | 0; h[iy * n + ix] = Math.max(h[iy * n + ix], v * (1 - t / len * .5)); } }
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), id = x.createImageData(n, n);
  for (let j = 0; j < n; j++) for (let i2 = 0; i2 < n; i2++) { const l = h[j * n + (i2 + n - 1) % n], rr = h[j * n + (i2 + 1) % n], u = h[((j + n - 1) % n) * n + i2], d = h[((j + 1) % n) * n + i2], o = (j * n + i2) * 4;
    id.data[o] = 128 + (l - rr) * 120; id.data[o + 1] = 128 + (u - d) * 120; id.data[o + 2] = 255; id.data[o + 3] = 255; }
  x.putImageData(id, 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 7); t.anisotropy = 4; return S.haarN = t; }
function spn_haut(map, o = {}) { const S = SPN_S; if (map) map.anisotropy = Math.max(map.anisotropy || 1, 8);
  const m = new THREE.MeshPhysicalMaterial({ map, color: o.color ?? 0xcabdae, roughness: .56, metalness: 0, sheen: 1, sheenRoughness: .36, sheenColor: new THREE.Color(.64, .58, .5), clearcoat: .24, clearcoatRoughness: .38, normalMap: spn_haarNormal(), normalScale: new THREE.Vector2(.8, .8) });
  if (map) { m.emissive = new THREE.Color(.2, .16, .12); m.emissiveMap = map; m.emissiveIntensity = o.eigen ?? .32; } return m; }
function spn_allePflegen() { const S = SPN_S, tauscht = new Map(); // alle Spinnen im Spiel (Vogelspinnen in Räumen/Keller, Kreuzspinnen an Netzen, die abseilende) bekommen dieselbe Haut
  const tausche = o => { if (!o.isMesh || !o.material || !o.material.map || o.material.isMeshPhysicalMaterial || (o.material.userData && o.material.userData.spnNeu)) return; /* neue Arten haben ihre Haut schon */ const m = o.material; if (!tauscht.has(m)) tauscht.set(m, spn_haut(m.map, { color: m === (S.tarOrig) ? 0xcabdae : 0xc0b2a2 })); o.material = tauscht.get(m); };
  if (typeof FAB !== 'undefined' && FAB.spiders) for (const sp of FAB.spiders) sp.g.traverse(tausche);
  if (typeof leben_S !== 'undefined') { for (const w of leben_S.webs || []) if (w.g) w.g.traverse(tausche); if (leben_S.drop && leben_S.drop.g) leben_S.drop.g.traverse(tausche); } }
// Die echte Vogelspinne des Spiels (Fab, skelettanimiert im Spinnenraum/Keller) als starre Instanz-Geometrie: Skin entfernt, Eckpunkte verschweißt und glatt geschattet, Beine laufen im Shader.
// Neu (08.10.): Schwarm = Hauswinkelspinne „xs“ (≈ 1,5 k Dreiecke × 2400), Spinnen auf dem Bild = „lo“ (≈ 4 k, eigene Karten 512²)
async function spn_modell() { const S = SPN_S;
  try { const xs = await spn_starr('winkel', 'xs'), lo = await spn_starr('winkel', 'lo'); if (xs && lo) { spiders.geometry = xs.geo; spiders.material = xs.mat; S.camGeo = lo.geo; S.camMat = lo.mat; S.ext = .125; return true; } }
  catch (e) { console.warn('Spinnen: neue Schwarmform', e); }
  return false; } // Rückfall: Schwarm behält die einfache Kugelform der Basis (die alten FBX-Spinnen werden nicht mehr geladen)
WORLD_MODS.push(['Spinnen', async () => { const S = SPN_S;
  try { try { await Promise.all(Object.keys(SPN_ARTEN).map(a => spn_art(a))); await spn_fabErsetzen(); } catch (e) { console.warn('Spinnen: Arten', e); }
    let ok = false; try { ok = await spn_modell(); } catch (e) { console.warn('Spinnen: Modell', e); }
    const g = spiders.geometry; g.computeBoundingBox(); const bb = g.boundingBox; if (!ok) S.ext = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) || .075; spn_beine(spiders.material, S.ext); spiders.instanceMatrix.setUsage(THREE.DynamicDrawUsage); spiders.userData.noCol = true;
    { const c = new THREE.Color(); for (let i = 0; i < SPN; i++) { const v = .5 + Math.random() * .55; c.setRGB(v, v * (.92 + Math.random() * .1), v * (.86 + Math.random() * .12)); spiders.setColorAt(i, c); } spiders.instanceColor.needsUpdate = true; }
    S.qFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), PI / 2); S.qH = new THREE.Quaternion(); S.zAx = new THREE.Vector3(0, 0, 1);
    const cm = (S.camMat || spiders.material).clone(); cm.depthTest = false; cm.depthWrite = false; cm.transparent = true; if (cm.map) { cm.emissiveIntensity = S.camMat ? .3 : .55; } spn_beine(cm, S.ext);
    const M = S.camMesh = new THREE.InstancedMesh(S.camGeo || g, cm, S.camN); M.frustumCulled = false; M.renderOrder = 1000; M.visible = false; M.userData.noCol = true; M.instanceMatrix.setUsage(THREE.DynamicDrawUsage); camera.add(M);
    for (let i = 0; i < S.camN; i++) { S.cam.push({ on: false }); const m = new THREE.Matrix4().makeScale(0, 0, 0); M.setMatrixAt(i, m); }
    try { spn_allePflegen(); } catch (e) { console.warn('Spinnen: Haut', e); }
    S.flip = 0; spn_eingabe(); S.ready = true; } catch (e) { console.warn('Spinnen: Aufbau', e); }
  try { TOD_RESET.push(() => { if (['lock', 'swarm', 'shake'].includes(ch2.spiderPhase)) spn_abbruch(); }); } catch (e) {}
  window.__spinnen = { S, spiders, FAB, ARTEN: SPN_ARTEN, neu: (a, o) => spn_neu(a, o), haar: SPN_HAAR, heldStart: () => spn_heldStart(), helden: () => spn_helden(), start: () => spiderEvent(), abbruch: () => spn_abbruch(), ende: () => spn_ende(), schleudern: n => spn_schleudern(n || 3), eingabe: v => { S.inp = (S.inp || 0) + v; }, flip: v => { S.flip = v; } }; // Testzugriff
}]);
WORLD_TICK.push(() => { try { const S = SPN_S; if (S.ready && S.active && ch2.spiderPhase !== 'swarm' && ch2.spiderPhase !== 'shake' && ch2.spiderPhase !== 'lock') spn_aufraeumen(); } catch (e) {}
  // Haarkarten nur in der Nähe (< 3,5 m): weiter weg sind sie kleiner als ein Bildpunkt und kosten nur Zeichenzeit
  if ((SPN_S.hT = (SPN_S.hT | 0) + 1) % 8 === 0) { const c = camera.position; for (const h of SPN_HAAR) { h.root.getWorldPosition(SPN_V); const on = SPN_V.distanceToSquared(c) < 12.25; if (h.m.visible !== on) h.m.visible = on; } } });
