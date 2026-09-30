// =====================================================================  FIGUREN (Modul „figuren“): jede Person hat ihr eigenes Aussehen
// Quelle: app/tools/forge.html + cast.json (Figuren-Werkstatt) → game/assets/chars/<id>/model.glb, Liste game/assets/chars/chars.json
//   Kinder 2009: zayn roxy lucy luke luke_echt heidi dina mike cleo graukind (Asset-Ordner „kleine“) · Erwachsene: mama hilde lucy_erw vegas amt1 amt2 aydin dina_erw polizist (Lorenz gestrichen, Fassung 3)
//   Schreckgestalten: graue (das Graukind ohne Mund), hilde_tot, gezaehlt_j/_m (die Behaltenen) · Justin: vorhandenes Paladin-Modell
// NACHBILDER (Fassung 3, Kern §2) – warum Luke sie sieht: Wo das Lichtschiff jemanden nimmt oder zurückgibt, brennt sich ein Bild ein.
//   Sehen kann es nur, wer lange in Nimmerheim war oder aus so jemandem gemacht ist – Luke ist aus Justins Hand gemacht; beim Berühren brennt die halbrunde Narbe.
//   Darstellung deshalb bewusst schemenhaft: kaltes Leuchten, Filmflackern, Ränder lösen sich auf, das Bild wird blass – Erinnerung, kein Mensch aus Fleisch.
const figuren_S = { list: null, cache: new Map(), sk: null, ghost: new Map(), T: { value: 0 }, embodied: new Set(), ownFilter: false };
async function figuren_list() { if (!figuren_S.list) { try { figuren_S.list = await (await fetch('assets/chars/chars.json')).json(); } catch (e) { figuren_S.list = []; } } return figuren_S.list; }
async function figuren_load(id) {
  if (id === 'alter_mann') id = 'vegas'; // früherer Rollenname
  if (id === 'graukind') id = 'kleine'; // Fassung 3: Schlüssel „graukind“, der Asset-Ordner heißt noch „kleine“
  if (figuren_S.cache.has(id)) return figuren_S.cache.get(id);
  const p = (async () => { try {
    if (id === 'justin') { if (!justin.model || !justin.mixer) return null; const clips = {}; for (const [k, a] of Object.entries(justin.acts)) clips[k] = a.getClip(); return { scene: justin.model, clips, height: 1.94, yaw: 0 }; }
    const info = (await figuren_list()).find(x => x.id === id); if (!info) return null;
    const g = await MSL.gl.loadAsync('assets/chars/' + id + '/model.glb'); const clips = {}; for (const a of g.animations) clips[a.name] = a;
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    return { scene: g.scene, clips, height: info.height, yaw: 0, motion: g.scene.userData.motion || (g.scene.children[0] && g.scene.children[0].userData.motion) || {} }; // motion: Clip-Daten aus tools/mocap_bake.mjs (Tempo, Schleife, Fußphase, Drehung)
  } catch (e) { console.warn('Figur ' + id, e); return null; } })();
  figuren_S.cache.set(id, p); return p;
}
async function figuren_skc() { if (!figuren_S.sk) figuren_S.sk = (await import('three/addons/utils/SkeletonUtils.js')).clone; return figuren_S.sk; }
// Kompatibel zu älteren Modulen (albers.js): Klon auf Zielhöhe, Füße auf 0
async function figuren_clone(F, height) {
  const sk = await figuren_skc(), o = sk(F.scene); o.scale.multiplyScalar(height / (F.height || height)); o.rotation.y = F.yaw || 0;
  const w = new THREE.Group(); w.add(o); w.userData.noCol = true; w.userData.clips = F.clips; return w;
}
// ---------- Erinnerungs-Material: schemenhaft, kalt leuchtend, flackernd, an den Rändern zerfallend
function figuren_ghostMat(src) {
  if (figuren_S.ghost.has(src)) return figuren_S.ghost.get(src);
  const m = new THREE.MeshStandardMaterial({ map: src.map || null, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: src.side, alphaTest: src.alphaTest || 0 });
  m.onBeforeCompile = sh => { sh.uniforms.uGhost = FAB.ghostU || { value: 0 }; sh.uniforms.uT = figuren_S.T;
    sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.)).xyz;');
    sh.fragmentShader = 'uniform float uGhost, uT; varying vec3 vWP;\nfloat gh3(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }\nfloat gn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(gh3(i), gh3(i + vec3(1,0,0)), f.x), mix(gh3(i + vec3(0,1,0)), gh3(i + vec3(1,1,0)), f.x), f.y), mix(mix(gh3(i + vec3(0,0,1)), gh3(i + vec3(1,0,1)), f.x), mix(gh3(i + vec3(0,1,1)), gh3(i + vec3(1,1,1)), f.x), f.y), f.z); }\n'
      + sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      float fr = pow(1. - abs(dot(normalize(normal), normalize(vViewPosition))), 2.);
      float lum = dot(diffuseColor.rgb, vec3(.3, .59, .11));
      float n = gn3(vWP * 6. + vec3(0., uT * .45, uT * .2)) * .65 + gn3(vWP * 19. - vec3(0., uT * 1.3, 0.)) * .35;
      float edge = smoothstep(.66, .38, n * .8 + fr * .5) * (.55 + .45 * smoothstep(.2, .7, gn3(vWP * 2.3 + uT * .15)));
      float band = .82 + .18 * sin(vWP.y * 42. - uT * 4.5), film = .88 + .12 * sin(uT * 21. + sin(uT * 6.3) * 3.);
      vec3 col = (vec3(.42, .58, .9) * (.03 + .95 * fr) + vec3(.7, .8, .95) * lum * .3) * band * film * .5;
      if (edge < .03) discard;
      gl_FragColor = vec4(col * edge * uGhost, 1.);`); };
  m.customProgramCacheKey = () => 'figuren_ghost2'; figuren_S.ghost.set(src, m); return m;
}
// ---------- Person in eine vorhandene Gestalt (Gruppe) setzen: alte Teile (Kapseln, Puppe, gemaltes Gesicht) ausblenden
// ghost: Erinnerung · doll: mit der Gruppe skalieren (Puppen im Weißen) · clip: feste Bewegung · sit: Sitzhöhe (Weltlage y)
// gait (AP-MOCAP): Gangart der automatischen Fortbewegung – null (normal) · 'vorsicht' · 'muede' · 'panik' · 'alt' · 'zombie' (Clips z_*)
async function figuren_embody(g, id, { ghost = false, doll = false, clip = null, sit = null, gait = null } = {}) {
  const P = g.userData.person; if (P && P.id === id && P.ghost === ghost && P.doll === doll) { if (gait !== null) P.gait = gait; if (clip && P.acts[clip] && P.cur !== P.acts[clip]) figuren_play(P, clip); return P; }
  const tok = (g.userData.personTok = (g.userData.personTok || 0) + 1);
  const T = await figuren_load(id); if (!T || tok !== g.userData.personTok) return null;
  const sk = await figuren_skc(), obj = sk(T.scene); obj.name = 'Person_' + id;
  if (id === 'justin' && typeof justin_nachbildKlon === 'function') justin_nachbildKlon(obj); // AP-12: Nachbilder ohne Flicken, ohne Gesicht/Haar
  if (ghost) obj.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(figuren_ghostMat) : figuren_ghostMat(o.material); o.castShadow = false; o.receiveShadow = false; } });
  const hide = P ? P.hide : []; if (P) { g.remove(P.obj); P.mx.stopAllAction(); }
  for (const c of g.children) if (c.visible && c !== obj) { hide.push(c); c.visible = false; }
  g.add(obj); g.userData.noCol = true;
  const mx = new THREE.AnimationMixer(obj), acts = {}; for (const [k, c] of Object.entries(T.clips)) acts[k] = mx.clipAction(c);
  const Q = { id, obj, mx, acts, cur: null, curK: null, ghost, doll, hide, last: new THREE.Vector3().setFromMatrixPosition(g.matrixWorld), fixed: !!clip, sit: false, g, h: T.height || 1.6, motion: T.motion || {}, gait, rig: figuren_rig(obj, figuren_animSet(T)), mv: figuren_mvNew(), look: null, bad: figuren_sperre(id) };
  g.userData.person = Q; figuren_S.embodied.add(g);
  figuren_play(Q, clip || 'idle', true); mx.update(0);
  if (sit !== null) figuren_seat(Q, sit);
  return Q;
}
// P2 Sperrliste: Clips, die nach Übertragung + Glättung (tools/mocap_glatt.mjs) noch Drehsprünge > 30 rad/s zeigen (tools/mocap_check.mjs), spielen einen sicheren Rückfall-Clip
const FIGUREN_SPERRE = { '*': { gestik: 'talk', klopfen: 'idle', getup_floor: 'idle', walk_vorsicht: 'walk' },
  vegas: { schleichen: 'walk', turn_180: 'turn_l', sit_down: 'sit', stand_up: 'idle', getup: 'idle', aufheben: 'idle', window: 'idle2', window_lean: 'idle2', run_panik: 'run' } };
function figuren_sperre(id) { const o = Object.assign({}, FIGUREN_SPERRE['*'], FIGUREN_SPERRE[id]); return o; }
// Clip wechseln (AP-MOCAP): immer weich überblenden (≥ 0,3 s, nie hart), Fortbewegung fußsynchron (Phase des linken Fußes bleibt), Einmal-Clips (motion.loop = false) halten das letzte Bild.
// o: { fade, ts, once } – bestehende Aufrufe figuren_play(P, k) / figuren_play(P, k, true) bleiben gültig.
// P2: Überblenden aus den AKTUELLEN Gewichten (Summe bleibt 1 → nie Bindepose/T-Pose dazwischen, kein Hochspringen eines halb ausgeblendeten Clips);
// kehrt ein noch ausblendender Schleifen-Clip zurück, läuft er an seiner Stelle weiter statt von vorn. Gesperrte Clips (Sicherheitsnetz, P.bad) → Rückfall-Clip.
function figuren_play(P, k, first, o) { let key = P.acts[k] ? k : P.acts.idle ? 'idle' : Object.keys(P.acts)[0]; if (P.bad && P.bad[key] && P.acts[P.bad[key]]) key = P.bad[key]; const a = P.acts[key]; if (!a || a === P.cur) return;
  const M = P.motion || {}, m = M[key], prev = P.cur, mc = prev && M[P.curK], d = a.getClip().duration, once = o && o.once !== undefined ? o.once : !!(m && m.loop === false);
  const wA = !first && a.enabled && a.isScheduled() ? a.getEffectiveWeight() : 0, keep = wA > .02 && !once;
  if (!keep) a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.enabled = true; a.paused = false;
  if (!keep && !first && prev && m && mc && m.rm === 'lin' && mc.rm === 'lin' && m.phaseL !== undefined && mc.phaseL !== undefined) { const ph = (prev.time / prev.getClip().duration - mc.phaseL + 2) % 1; a.time = ((ph + m.phaseL) % 1) * d; } // gleicher Schritt
  else if (first && !once) a.time = Math.random() * d; // Gruppen nicht im Gleichtakt
  a.timeScale = o && o.ts ? o.ts : m && m.rm === 'lin' ? 1 : .92 + Math.random() * .14; a.setEffectiveWeight(1); a.play();
  const fade = Math.max(.3, (o && o.fade) || (m && mc && m.rm === 'lin' && mc.rm === 'lin' ? .35 : .5));
  if (prev && !first && typeof a._scheduleFading === 'function') { for (const n in P.acts) { const b = P.acts[n]; if (b === a || !b.enabled || !b.isScheduled()) continue; const w = b.getEffectiveWeight(); if (w > .001) { b.stopFading(); b._scheduleFading(fade, w, 0); } else b.stop(); } // auch pausierte (beendete Einmal-Clips mit Endbild)
    a._scheduleFading(fade, wA, 1); }
  else if (prev && !first) a.crossFadeFrom(prev, fade, false);
  else for (const n in P.acts) { const b = P.acts[n]; if (b !== a && b.isScheduled()) b.stop(); }
  P.cur = a; P.curK = key; if (P.mv) { P.mv.once = once; P.mv.clipT = 0; } }
// Geste/Einmal-Clip abspielen und danach von selbst zur Fortbewegung/Ruhe zurück (then: Clip-Name danach, sonst automatisch)
function figuren_do(P, k, { then = null, fade = .45, ts = null } = {}) { if (!P || !P.acts[k]) return false; P.mv.shot = k; P.mv.then = then; figuren_play(P, k, false, { once: true, fade, ts }); return true; }
// Blickziel: Vector3 | Object3D | 'cam' | 'auto' (Spieler, wenn nah und vorn) | null; w = Gewicht 0…1
function figuren_lookAt(P, target, w = 1) { if (!P) return; P.look = target; P.mv.lookW = target ? w : 0; }
function figuren_motion(P, k) { return (P && P.motion && P.motion[k]) || null; }
function figuren_release(g) { const P = g.userData.person; if (!P) return; g.remove(P.obj); P.mx.stopAllAction(); P.hide.forEach(c => c.visible = true); g.userData.person = null; figuren_S.embodied.delete(g); }
// Sitzen: Oberschenkel nach vorn, Unterschenkel nach unten, Hände in den Schoß (Drehungen um die Querachse der Figur, unabhängig vom Skelett)
function figuren_bones(obj) { const map = { Hip: 'Hips', L_Thigh: 'LeftUpLeg', R_Thigh: 'RightUpLeg', L_Calf: 'LeftLeg', R_Calf: 'RightLeg', L_Upperarm: 'LeftArm', R_Upperarm: 'RightArm', L_Forearm: 'LeftForeArm', R_Forearm: 'RightForeArm', Spine01: 'Spine1', L_Foot: 'LeftFoot', R_Foot: 'RightFoot' }, m = {};
  obj.traverse(o => { if (!o.isBone && !(o.type === 'Object3D' && o.children.length)) return; const n = o.name.replace(/^mixamorig[:_]?/i, '').replace(/_\d+$/, ''), c = map[n] || n; if (!m[c]) m[c] = o; }); return m; }
function figuren_seat(P, seatY) { if (P.acts && P.acts.sit && P.mv) return figuren_seatClip(P, seatY); const g = P.g, b = figuren_bones(P.obj); if (!b.LeftUpLeg || !b.Hips) return; P.mx.update(0); const snap = []; P.obj.traverse(o => { if (o.isBone || o.type === 'Object3D') snap.push([o, o.quaternion.clone(), o.position.clone()]); }); P.mx.stopAllAction(); P.cur = null; for (const [o, q, p] of snap) { o.quaternion.copy(q); o.position.copy(p); }
  const s = P.doll ? 1 : 1 / Math.max(1e-3, g.scale.x); P.obj.scale.setScalar(s); g.updateMatrixWorld(true);
  const _pw = new THREE.Quaternion(), _bw = new THREE.Quaternion(), _d = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const bend = (bn, ang) => { if (!bn) return; bn.parent.getWorldQuaternion(_pw); bn.getWorldQuaternion(_bw); _d.setFromAxisAngle(ax, ang); bn.quaternion.copy(_pw.invert().multiply(_d).multiply(_bw)); bn.updateMatrixWorld(true); };
  bend(b.LeftUpLeg, -1.5); bend(b.RightUpLeg, -1.5); bend(b.LeftLeg, 1.45); bend(b.RightLeg, 1.45); bend(b.LeftFoot, .1); bend(b.RightFoot, .1);
  bend(b.LeftArm, -.35); bend(b.RightArm, -.35); bend(b.LeftForeArm, -.7); bend(b.RightForeArm, -.7); bend(b.Spine1, .12);
  // Becken auf die Sitzfläche: Weltlage der Hüfte messen und die Person innerhalb der Gruppe verschieben
  const hip = new THREE.Vector3(); b.Hips.getWorldPosition(hip); const gs = g.getWorldScale(new THREE.Vector3()).y || 1;
  P.obj.position.y += (seatY + .08 - hip.y) / gs; P.sit = true; }
// Sitzen mit echter Bewegung (Mocap 'sit'): Clip läuft weiter (Atmen, Gewicht verlagern), Becken auf die Sitzfläche. Stoppt jemand den Mischer, startet der Tick den Clip neu.
function figuren_seatClip(P, seatY) { const g = P.g; figuren_play(P, 'sit', !P.cur); P.fixed = true; P.sit = true; P.mv.seatY = seatY;
  const s = P.doll ? 1 : 1 / Math.max(1e-3, g.scale.x); P.obj.scale.setScalar(s); P.obj.position.set(0, 0, 0); P.mx.update(0); if (P.cur) { P.cur.setEffectiveWeight(1); P.cur.stopFading(); } P.mx.update(0);
  g.updateMatrixWorld(true); const h = P.rig.hips; if (!h) return; h.getWorldPosition(FIGUREN_MV.v); const gs = g.getWorldScale(FIGUREN_MV.v2).y || 1;
  P.obj.position.y = (seatY + .08 - FIGUREN_MV.v.y) / gs; }
// ---------- Besetzung der Erinnerungen (Reihenfolge = Figuren der Echo-Definition)
const FIGUREN_ECHO = {
  echo_kreuzung: ['roxy', 'lucy', 'mike', 'dina', 'luke', 'heidi', 'zayn', 'vegas'],
  echo_kueche: ['hilde', 'amt1', 'amt2'],
  echo_kinderzimmer: ['mama', 'luke'],
  echo_brand: ['roxy'],
  echo_archiv: ['amt2', 'hilde'],
  echo_messraum: ['lucy', 'dina', 'zayn', 'justin'],
  echo_1975: ['justin', 'mike', 'gezaehlt_j', 'gezaehlt_m', 'graue'],   // Lars Vegas mit 9 sieht aus wie sein Enkel Mike; das letzte Kind hat kein Gesicht
  echo_mira: ['graukind', 'lucy', 'roxy', 'zayn', 'mike', 'dina', 'heidi', 'luke'], // sieben Puppen mit den Gesichtern der Kinder, klein wie Spielzeug
  echo_kanal_ritter: ['justin'],
  echo_kanal_laterne: ['gezaehlt_m', 'gezaehlt_j', 'graukind'],
  echo_nord_grab: ['amt1', 'amt2', 'luke_echt'],
};
// Einzelne Gestalt als Erinnerung besetzen (cleo.js, visionen.js, zayn.js)
async function figuren_person(F, id, opt = {}) { try { await figuren_embody(F, id, { ghost: true, ...opt }); } catch (e) { console.warn('figuren_person', e); } }
// Bild wird blass, solange eine Erinnerung läuft (Erinnerung, keine Gegenwart)
function figuren_memoryLook(on) { const c = renderer.domElement; if (on) { if (!c.style.filter) { c.style.transition = 'filter .9s'; c.style.filter = 'saturate(.42) sepia(.16) contrast(1.06) brightness(1.04)'; figuren_S.ownFilter = true; } }
  else if (figuren_S.ownFilter) { c.style.filter = ''; figuren_S.ownFilter = false; } }
ECHO_CAST.start = async E => { const cast = FIGUREN_ECHO[E.id]; figuren_memoryLook(true); if (!cast) return;
  await Promise.all(E.figs.map((f, i) => cast[i] ? figuren_embody(echoFigs[i], cast[i], { ghost: true, doll: f[3] < .45, clip: f[3] < .45 ? 'idle' : null }) : null)); };
ECHO_CAST.end = () => figuren_memoryLook(false);
// ---------- Schreckgestalten: gemaltes Gesicht → echte Person (die Größe entscheidet Kind oder Erwachsener)
function figuren_faceWho(kind, small) {
  if (kind === 'wendt') return 'hilde_tot'; if (kind === 'grey') return 'graue'; if (kind === 'child') return 'luke_echt';
  if (kind === 'lena') return small ? 'graukind' : 'lucy_erw';
  if (kind === 'pale') return small ? (Math.random() < .5 ? 'gezaehlt_j' : 'gezaehlt_m') : (Math.random() < .5 ? 'amt1' : 'amt2');
  return null; }
FACE_HOOK.fn = (fig, kind) => { fig.userData.faceKind = kind; if (fig.userData.face && fig.userData.person) fig.userData.face.visible = false; };

WORLD_MODS.push(['Figuren', async () => {
  const L = await figuren_list(); if (!L.length) return;
  // Schreckgestalten und feste Figuren sofort, der Rest im Hintergrund
  await Promise.all(['graue', 'hilde_tot', 'gezaehlt_j', 'gezaehlt_m', 'luke_echt', 'lucy_erw', 'hilde', 'graukind', 'amt1', 'amt2', 'vegas', 'roxy', 'lucy', 'mike', 'dina', 'heidi', 'zayn', 'luke'].map(figuren_load));
  L.forEach(x => figuren_load(x.id));
  const E = (g, id, o) => figuren_embody(g, id, o).catch(e => console.warn('Figur', id, e));
  await Promise.all([E(grey, 'graue'), E(victim, 'hilde'), E(lenaFig, 'lucy_erw'), E(graukind, 'graukind'), E(kidShadow, 'gezaehlt_m'), E(watcher, 'justin', { clip: 'idle' }),
    ...counted.map((c, i) => E(c.f, i % 2 ? 'gezaehlt_m' : 'gezaehlt_j'))]);
  // Sitzende: die sieben Kinder in Nimmerheim, Hilde in Raum 2, die Gestalt auf dem Gurtstuhl im Keller
  const seatK = ['roxy', 'lucy', 'mike', 'dina', 'heidi', 'zayn', 'luke'];
  for (let i = 0; i < kids.length; i++) { kids[i].k.updateMatrixWorld(true); await E(kids[i].k, seatK[i % seatK.length], { sit: .52 }); }
  hilde.updateMatrixWorld(true); await E(hilde, 'hilde', { sit: .48 });
}]);
// =====================================================================  BEWEGUNGSSCHICHT (AP-MOCAP, Q-10/Q-11): Mocap-Clips + prozedurale Schicht darüber
// Doku: app/story/audit/F3_stand_mocap.md. Pro Figur (P = g.userData.person):
//  · Fortbewegung automatisch aus der Bewegung der Gruppe g: Tempo (kritisch gedämpft geglättet) → Ruhe/Gehen/Laufen; Abspieltempo = Weg-Tempo / Clip-Tempo (kein Gleiten, kein Moonwalk);
//    Wechsel fußsynchron (Phase), Überblenden ≥ 0,3 s. Gangart P.gait ('vorsicht' | 'muede' | 'panik' | 'alt' | 'zombie').
//  · Blickrichtung: dreht jemand g im Stand um mehr als 60°, spielt ein Dreh-Clip (turn_l/turn_r/turn_180) und dreht die Figur mit dessen Wurzelkurve; sonst Feder.
//  · Ruhe: Varianten (idle/idle2/idle3) wechseln zufällig; Einmal-Clips (figuren_do) kehren von selbst zurück.
//  · Additiv: Atmung (Brustkorb, nach Laufen schneller/tiefer), Blick (Augen zuerst, dann Kopf/Hals; Hals ≤ 60°, Federn), Fuß-IK auf Treppen/Kanten (Kisten-Kollision + solidGround).
//  · Kosten: keine Allokationen im Tick; nah (< 12 m, im Bild) jedes Bild alles, mittel bis 30 m Mischer 30 Hz ohne IK, weit/außer Bild 5–15 Hz.
const FIGUREN_MV = { v: new THREE.Vector3(), v2: new THREE.Vector3(), v3: new THREE.Vector3(), v4: new THREE.Vector3(), v5: new THREE.Vector3(), p: new THREE.Vector3(), pv: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), // pv: Drehpunkt (figuren_setW benutzt v5)
  q: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion(), m: new THREE.Matrix4(), s: new THREE.Vector3(), fr: new THREE.Frustum(), pm: new THREE.Matrix4(), sph: new THREE.Sphere(),
  A: new THREE.Vector3(), B: new THREE.Vector3(), C: new THREE.Vector3(), T: new THREE.Vector3(), B2: new THREE.Vector3(), T2: new THREE.Vector3(), pole: new THREE.Vector3(), qa: new THREE.Quaternion(), qb: new THREE.Quaternion(), qf: new THREE.Quaternion(),
  n: 0, near: 0, ik: 0, ms: 0, flip: 0 };
// Knochen einer Figur (alle Skelettfamilien der Werkstatt: Character Creator, Auto-Rig Pro, Mixamo, Unreal); auch Knoten ohne Skin (CC-Oberschenkel sind im GLB leere Knoten)
const FIGUREN_RIGRE = { hips: /^(hips|hip|rootx|pelvis)$/, chest: /^(spine2|spine02|spine_02x|spine_05|spine_03|chest)$/, neck: /^(neck|neckx|necktwist01|neck1|neck_01)$/, head: /^(head|headx)$/,
  lArm: /^(leftarm|l_upperarm|arm_stretchl|upperarm_l)$/, rArm: /^(rightarm|r_upperarm|arm_stretchr|upperarm_r)$/, lFore: /^(leftforearm|l_forearm|forearm_stretchl|lowerarm_l)$/, rFore: /^(rightforearm|r_forearm|forearm_stretchr|lowerarm_r)$/,
  lHand: /^(lefthand|l_hand|handl|hand_l)$/, rHand: /^(righthand|r_hand|handr|hand_r)$/, lSh: /^(leftshoulder|l_clavicle|shoulderl|clavicle_l)$/, rSh: /^(rightshoulder|r_clavicle|shoulderr|clavicle_r)$/,
  lUp: /^(leftupleg|l_thigh|thigh_stretchl|thigh_l)$/, rUp: /^(rightupleg|r_thigh|thigh_stretchr|thigh_r)$/, lLeg: /^(leftleg|l_calf|leg_stretchl|calf_l)$/, rLeg: /^(rightleg|r_calf|leg_stretchr|calf_r)$/,
  lFoot: /^(leftfoot|l_foot|footl|foot_l)$/, rFoot: /^(rightfoot|r_foot|footr|foot_r)$/, lToe: /^(lefttoebase|l_toebase|toes_01l|ball_l)$/, rToe: /^(righttoebase|r_toebase|toes_01r|ball_r)$/, lEye: /^(l_eye|lefteye|eye_l)$/, rEye: /^(r_eye|righteye|eye_r)$/ };
// anim: Namen der Knoten mit Spuren in den Clips. Wahl je Rolle (P2): animierter Knoten > äußerster gleichnamiger Knoten (CC-Kinder: Hilfsketten „Head > Head > Head“, sonst dreht die Zusatzschicht
// einen unbewegten Hilfsknochen und summiert sich Bild für Bild auf → Kopf dreht sich) > Skin-Gelenk („head_70“ neben „mixamorigHead_1“)
function figuren_rig(obj, anim) { const r = {}, desc = (b, a) => { for (let p = b && b.parent; p; p = p.parent) if (p === a) return true; return false; };
  const better = (o, b) => { const ao = !!(anim && anim.has(o.name)), ab = !!(anim && anim.has(b.name)); if (ao !== ab) return ao; if (desc(b, o)) return true; if (desc(o, b)) return false; return o.isBone && !b.isBone; };
  obj.traverse(o => { if (o.isMesh || o === obj) return; const n = o.name.replace(/^.*[:|]/, '').replace(/^mixamorig/i, '').replace(/^CC_Base_/i, '').replace(/_\d+$/, '').toLowerCase();
    for (const k in FIGUREN_RIGRE) if (FIGUREN_RIGRE[k].test(n) && (!r[k] || better(o, r[k]))) r[k] = o; });
  // Mitbewegte Knochen bei additiven Drehungen: Knochen, die anatomisch folgen, aber im Szenengraph KEINE Kinder sind (flache Auto-Rig-Pro-Skelette der Tony-Figuren)
  const follow = (root, list) => { const out = [root]; for (const b of list) if (b && b !== root && !out.some(a => desc(b, a))) out.push(b); return out; };
  if (r.chest) r.chestChain = follow(r.chest, [r.neck, r.head, r.lSh, r.rSh, r.lArm, r.rArm, r.lFore, r.rFore, r.lHand, r.rHand]);
  if (r.neck) r.neckChain = follow(r.neck, [r.head, r.lEye, r.rEye]);
  if (r.head) r.headChain = follow(r.head, [r.lEye, r.rEye]);
  r.legs = [[r.lUp, r.lLeg, r.lFoot, r.lToe], [r.rUp, r.rLeg, r.rFoot, r.rToe]].filter(L => L[0] && L[1] && L[2]);
  // Augen als Formen (Tony-Körper mit CC-Kopf: Eye_L_Look_L …) statt Knochen
  r.eyes = [r.lEye, r.rEye].filter(Boolean).map(e => [e]); // Augenknochen (je eine Kette mit einem Glied, im Takt ohne Allokation)
  r.eyeM = []; obj.traverse(o => { const d = o.morphTargetDictionary; if (!o.isMesh || !d) return; for (const [nm, i] of Object.entries(d)) { const m = nm.match(/Eye_([LR])_Look_(L|R|Up|Down)$/); if (m) r.eyeM.push([o, i, m[2]]); } });
  // P2: Grundlage (Ruhe) aller Knoten, die die Zusatzschicht verändert – vor jedem Mischer-Schritt zurückgesetzt, damit sich nichts aufsummiert (Knoten ohne Spur im Clip: Augen, Hilfsknochen, Fuß-IK-Lagen)
  const set = new Set([...(r.chestChain || []), ...(r.neckChain || []), ...(r.headChain || []), r.lEye, r.rEye, ...r.legs.flat()].filter(Boolean)); r.base = [...set].map(o => [o, o.quaternion.clone(), o.position.clone()]);
  // Kopf: Blickrichtung/Oben im Kopfknochen-Raum und Ruhe-Lage Kopf gegen Brustkorb (Sicherheitsnetz); Figur schaut in der Ruhe nach +z
  obj.updateMatrixWorld(true); const q0 = new THREE.Quaternion(), qo = new THREE.Quaternion(), tv = new THREE.Vector3(), ts = new THREE.Vector3(); obj.matrixWorld.decompose(tv, qo, ts); qo.invert();
  const wq = b => { const q = new THREE.Quaternion(); b.matrixWorld.decompose(tv, q, ts); return q.premultiply(qo); };
  if (r.legs.length === 2) { const mi = obj.matrixWorld.clone().invert(); r.ankle = Math.min(...r.legs.map(L => L[2].getWorldPosition(tv).applyMatrix4(mi).y)); } // Knöchelhöhe über dem Boden (Ruhe, Figurraum)
  if (r.chest) r.cF = new THREE.Vector3(0, 0, 1).applyQuaternion(wq(r.chest).invert()); // Brustkorb-Blickrichtung im Knochenraum (Blick-Grenze relativ zum Oberkörper)
  if (r.head) { q0.copy(wq(r.head)).invert(); r.hF = new THREE.Vector3(0, 0, 1).applyQuaternion(q0); r.hU = new THREE.Vector3(0, 1, 0).applyQuaternion(q0); if (r.chest) r.hcRest = wq(r.chest).invert().multiply(wq(r.head)); }
  return r; }
function figuren_rest(r) { for (const [o, q, p] of r.base) { o.quaternion.copy(q); o.position.copy(p); } }
// Knoten mit Spuren in den Clips (einmal je Vorlage)
function figuren_animSet(T) { if (!T.anim) { T.anim = new Set(); for (const k in T.clips) for (const t of T.clips[k].tracks) T.anim.add(t.name.slice(0, t.name.lastIndexOf('.'))); } return T.anim; }
function figuren_mvNew() { return { init: false, yaw: 0, yawV: 0, spd: 0, spdV: 0, moving: false, run: false, turn: null, turnT: 0, turnY0: 0, turnD: 0, idleT: 4 + Math.random() * 8, once: false, clipT: 0, shot: null, then: null,
  br: Math.random() * 6, exert: 0, hy: 0, hyV: 0, hp: 0, hpV: 0, ey: 0, eyV: 0, ep: 0, epV: 0, lookW: 0, lw: 0, lwV: 0, acc: 0, ikT: Math.random() * .1, gL: 0, gR: 0, oL: 0, oLV: 0, oR: 0, oRV: 0, drop: 0, dropV: 0, seatY: null, px: 0, pz: 0, vis: false }; }
// Kritisch gedämpfte Feder (implizit, stabil bei großen dt): s[k] Wert, s[kv] Geschwindigkeit
function figuren_spr(s, k, kv, target, w, dt) { const f = 1 + 2 * dt * w, oo = w * w, hoo = dt * oo, hhoo = dt * hoo, di = 1 / (f + hhoo), x = s[k], v = s[kv]; s[k] = (f * x + dt * v + hhoo * target) * di; s[kv] = (v + hoo * (target - x)) * di; }
const figuren_wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
// Knochen auf Weltlage setzen (Position optional) – lokale Werte aus der Weltmatrix der Eltern
function figuren_setW(o, pos, quat) { const M = FIGUREN_MV; M.m.copy(o.parent.matrixWorld); M.m.decompose(M.v5, M.q3, M.s); M.q3.invert();
  o.quaternion.copy(M.q3).multiply(quat); if (pos) { M.m.invert(); o.position.copy(pos).applyMatrix4(M.m); } o.updateMatrixWorld(true); }
// Kette um einen Drehpunkt (Welt) drehen: jeder Knoten in list wird mitgeführt (flache Skelette), Kinder folgen von selbst
function figuren_rotChain(list, pivot, q) { const M = FIGUREN_MV; for (const b of list) { b.matrixWorld.decompose(M.p, M.q2, M.s); M.p.sub(pivot).applyQuaternion(q).add(pivot); M.q2.premultiply(q); figuren_setW(b, M.p, M.q2); } }
// Bodenhöhe unter einem Fuß: Kisten-Kollision (Stufen, Kanten) und begehbare Flächen (solidGround: Treppen, Veranden). null = nichts Höheres/Tieferes gefunden
function figuren_ground(x, y, z) { let g = -Infinity;
  for (const c of colliders) if (c.top > g && c.top <= y + .45 && c.top >= y - .5 && x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) g = c.top;
  if (typeof solidGround === 'function') { try { const sg = solidGround(x, y + .05, z); if (sg > g && sg <= y + .45 && sg >= y - .5) g = sg; } catch (e) {} }
  return g === -Infinity ? null : g; }
// Zweigelenk-IK für ein Bein: Fußgelenk um dy (Welt, nach oben) versetzen, Knie in seiner Ebene, Fußdrehung bleibt
function figuren_legIK(L, dy) { const M = FIGUREN_MV, [U, K, F] = L; U.matrixWorld.decompose(M.A, M.qa, M.s); K.matrixWorld.decompose(M.B, M.qb, M.s); F.matrixWorld.decompose(M.C, M.qf, M.s);
  M.T.copy(M.C).addScaledVector(M.up, dy); const a = M.A.distanceTo(M.B), b = M.B.distanceTo(M.C); M.v.copy(M.T).sub(M.A); let d = M.v.length(); if (d < 1e-5 || a < 1e-5 || b < 1e-5) return;
  d = Math.min(Math.max(d, Math.abs(a - b) + 1e-4), (a + b) * .9995); M.v.normalize(); M.pole.copy(M.B).sub(M.A); M.pole.addScaledVector(M.v, -M.pole.dot(M.v)); if (M.pole.lengthSq() < 1e-10) return; M.pole.normalize();
  const cA = (a * a + d * d - b * b) / (2 * a * d), sA = Math.sqrt(Math.max(0, 1 - cA * cA)); M.B2.copy(M.A).addScaledVector(M.v, a * cA).addScaledVector(M.pole, a * sA); M.T2.copy(M.A).addScaledVector(M.v, d);
  M.v2.copy(M.B).sub(M.A).normalize(); M.v3.copy(M.B2).sub(M.A).normalize(); M.q.setFromUnitVectors(M.v2, M.v3);
  M.v2.copy(M.C).sub(M.B).applyQuaternion(M.q).normalize(); M.v3.copy(M.T2).sub(M.B2).normalize(); M.q2.setFromUnitVectors(M.v2, M.v3);
  M.qa.premultiply(M.q); figuren_setW(U, null, M.qa); M.qb.premultiply(M.q).premultiply(M.q2); figuren_setW(K, M.B2, M.qb); figuren_setW(F, M.T2, M.qf); } // Zehen hängen in allen Skeletten am Fuß
// Welche Clips für Gehen/Laufen/Ruhe (Gangart)
const FIGUREN_GAIT = { null: ['walk', 'run', 'idle'], vorsicht: ['walk_vorsicht', 'run', 'alert'], muede: ['walk_muede', 'walk', 'erschoepft'], panik: ['walk_vorsicht', 'run_panik', 'nervous'], alt: ['walk', 'walk', 'idle'], zombie: ['z_walk', 'z_run', 'z_idle'] };
const FIGUREN_IDLES = ['idle', 'idle2', 'idle3'];
function figuren_locoClip(P, want) { const G = FIGUREN_GAIT[P.gait] || FIGUREN_GAIT.null, k0 = want === 'walk' ? G[0] : want === 'run' ? G[1] : G[2], k = P.bad && P.bad[k0] ? P.bad[k0] : k0; return P.acts[k] ? k : P.acts[want] ? want : 'idle'; }
function figuren_tick(dt) {
  figuren_S.T.value += dt; const M = FIGUREN_MV, t0 = performance.now(); M.n = M.near = M.ik = 0;
  // Gestalten mit gemaltem Gesicht (stalker, sitter): passende Person nachziehen, sobald sie sichtbar wird
  for (const F of FIGS) { if (!F.visible || !F.userData.face) continue; const k = F.userData.faceKind; if (k === undefined) continue; const small = F.scale.x < .8, key = k + '|' + small, P = F.userData.person;
    if (F.userData.faceKey !== key) { F.userData.faceKey = key; const want = figuren_faceWho(k, small); if (want) figuren_embody(F, want, F === sitter ? { sit: F.position.y + .45 } : {}); }
    if (P && F.userData.face.visible) F.userData.face.visible = false; }
  const cam = camera.position, w = M.v4; M.pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); M.fr.setFromProjectionMatrix(M.pm);
  for (const g of figuren_S.embodied) { const P = g.userData.person; if (!P || !g.visible || !g.parent) { if (P) P.mv.vis = false; continue; }
    const s = P.doll ? 1 : 1 / Math.max(1e-3, g.scale.x); if (Math.abs(P.obj.scale.x - s) > 1e-4) P.obj.scale.setScalar(s); // echte Körpergröße, egal wie die alte Gestalt skaliert war
    w.setFromMatrixPosition(g.matrixWorld); const dx = w.x - cam.x, dz = w.z - cam.z, dist = Math.hypot(dx, dz); if (dist > 70) { P.last.copy(w); P.mv.vis = false; continue; }
    const V = P.mv, wsc = P.doll ? g.getWorldScale(M.s).x : 1; M.n++;
    // Blickrichtung der Gruppe (Welt) und Tempo (kritisch gedämpft)
    g.matrixWorld.decompose(M.p, M.q, M.s); M.v.set(0, 0, 1).applyQuaternion(M.q); const gy = Math.atan2(M.v.x, M.v.z);
    const jump = Math.hypot(w.x - P.last.x, w.z - P.last.z), first = !V.init || !V.vis || jump > 1.5; V.vis = true;
    const mv = first ? 0 : jump / Math.max(dt, 1e-3); P.last.copy(w);
    if (first) { V.init = true; V.yaw = gy; V.yawV = 0; V.spd = mv; V.spdV = 0; } else figuren_spr(V, 'spd', 'spdV', Math.min(mv, 8), 9, dt);
    M.sph.center.copy(w); M.sph.center.y += .9; M.sph.radius = 1.3; const inView = M.fr.intersectsSphere(M.sph), near = inView && dist < 12;
    // Takt je Entfernung (LOD)
    V.acc += dt; const step = near ? 0 : inView ? (dist < 30 ? 1 / 30 : 1 / 15) : 1 / 5; if (V.acc < step) continue; const edt = V.acc; V.acc = 0; if (near) M.near++;
    // Sitzende mit Clip: Clip halten (falls jemand den Mischer gestoppt hat)
    if (P.sit) { if (P.mv.seatY !== null && P.acts.sit && (!P.cur || !P.cur.isRunning())) { P.cur = null; figuren_play(P, 'sit', true); } if (!P.mv.seatY && P.mv.seatY !== 0) { continue; } }
    else if (!P.fixed) { try { figuren_loco(P, V, edt, gy, wsc); } catch (e) { console.warn('figuren_loco', e); P.fixed = true; } }
    else { figuren_spr(V, 'yaw', 'yawV', V.yaw + figuren_wrap(gy - V.yaw), 9, edt); if (first) V.yaw = gy;
      const m = P.motion && P.motion[P.curK]; if (m && m.rm === 'lin' && m.speed && P.cur && V.spd > .1) P.cur.timeScale = Math.min(1.7, Math.max(.55, V.spd / (m.speed * wsc))); } // feste Geh-Clips: Schrittlänge passt zum Weg
    // Einmal-Clip zu Ende → zurück (Geste von figuren_do)
    if (V.shot && P.cur && P.curK === V.shot && P.cur.time >= P.cur.getClip().duration - .45) { const nx = V.then || (P.fixed ? 'idle' : figuren_locoClip(P, V.moving ? (V.run ? 'run' : 'walk') : 'idle')); V.shot = null; figuren_play(P, nx, false, { fade: .45 }); }
    // sichtbare Drehung: Person innerhalb der Gruppe um (Feder-Blickrichtung − Gruppenrichtung) drehen
    if (!P.sit) P.obj.rotation.y = figuren_wrap(V.yaw - gy);
    figuren_rest(P.rig); // P2: Zusatzschicht des letzten Bildes zurücknehmen (sonst summieren sich Knoten ohne Clip-Spur auf: drehende Augen/Köpfe)
    P.mx.update(edt);
    if (!near && !(inView && dist < 20)) continue;
    if (P.mv.off) continue; // Zusatzschicht nach einem Fehler für diese Figur aus (nie das Spiel anhalten)
    try { P.obj.updateMatrixWorld(true);
      figuren_breath(P, V, edt);
      if (P.look || V.lw > .01) figuren_look(P, V, edt);
      if (near && !P.sit && dist < 9 && P.rig.legs.length === 2 && typeof colliders !== 'undefined') figuren_feet(P, V, edt, w, gy);
      if (near && P.sit && V.seatY !== null && P.rig.legs.length === 2) figuren_seatFeet(P, w); } catch (e) { console.warn('figuren Zusatzschicht', P.id, e); P.mv.off = true; }
    if (near || dist < 20) figuren_guard(P, V);
  }
  M.ms = performance.now() - t0;
}
// P2 Sicherheitsnetz (je Bild, ohne Allokation): Kopf gegen Brustkorb > 100° gegenüber der Ruhe oder NaN → erst die Zusatzschicht für dieses Bild weglassen,
// liegt es am Clip selbst: Clip für diese Figur sperren und sofort auf den Rückfall-Clip (Gehen/Stehen) – nie ein verdrehter Kopf im Bild.
function figuren_guard(P, V) { const r = P.rig; if (!r.head || !r.chest || !r.hcRest) return; const M = FIGUREN_MV;
  const bad = () => { r.chest.matrixWorld.decompose(M.p, M.qa, M.s); r.head.matrixWorld.decompose(M.p, M.qb, M.s); if (!Number.isFinite(M.p.x + M.p.y + M.p.z + M.qb.w)) return true; M.qa.invert().multiply(M.qb); return 2 * Math.acos(Math.min(1, Math.abs(M.qa.dot(r.hcRest)))) > 1.75; };
  if (!bad()) return; M.flip = (M.flip || 0) + 1; figuren_rest(r); P.mx.update(0); P.obj.updateMatrixWorld(true); if (!bad()) return;
  const k = P.curK, m = P.motion && P.motion[k], fb = m && m.rm === 'lin' ? figuren_locoClip(P, 'walk') : 'idle'; if (!P.acts[fb] || fb === k) return;
  if (!P.bad) P.bad = {}; P.bad[k] = fb; console.warn('figuren: Clip gesperrt (Kopf-Grenze)', P.id, k, '→', fb); if (V.shot === k) V.shot = null;
  figuren_play(P, fb, true); P.mx.update(0); P.obj.updateMatrixWorld(true); }
// Sitzen: Füße nie durch den Boden (Stuhl niedriger als in der Aufnahme) → Beine per IK anheben, Knie beugen sich mehr
function figuren_seatFeet(P, w) { const L = P.rig.legs, M = FIGUREN_MV; if (P.rig.ankle === undefined) return;
  const sc = P.obj.matrixWorld.getMaxScaleOnAxis(); for (let i = 0; i < 2; i++) { L[i][2].getWorldPosition(M.v); const lift = w.y + P.rig.ankle * sc - M.v.y; if (lift > .005) figuren_legIK(L[i], Math.min(.35, lift)); } }
// Fortbewegung: Ruhe ↔ Gehen ↔ Laufen, Abspieltempo aus dem Weg-Tempo, Dreh-Clips im Stand, Ruhe-Varianten
function figuren_loco(P, V, dt, gy, wsc) { const Mo = P.motion || {};
  const wk = figuren_locoClip(P, 'walk'), rk = figuren_locoClip(P, 'run'), wv = ((Mo[wk] && Mo[wk].speed) || 1.25) * wsc, rv = ((Mo[rk] && Mo[rk].speed) || wv * 2) * wsc;
  if (V.moving ? V.spd < .1 : V.spd > .22) { V.moving = !V.moving; if (!V.moving) V.idleT = 6 + Math.random() * 10; }
  if (V.moving && rk !== wk) V.run = V.run ? V.spd > (wv + rv) * .44 : V.spd > (wv + rv) * .56; else V.run = false;
  if (V.shot) { figuren_spr(V, 'yaw', 'yawV', V.yaw + figuren_wrap(gy - V.yaw), 6, dt); return; }
  if (V.moving) { V.turn = null; const k = V.run ? rk : wk, cv = V.run ? rv : wv; if (P.curK !== k) figuren_play(P, k); if (P.cur) P.cur.timeScale = Math.min(V.run ? 2 : 1.7, Math.max(.55, V.spd / cv)); // Laufen darf schneller takten (Kinder-Jog 1,1 m/s) – sonst gleiten die Füße
    figuren_spr(V, 'yaw', 'yawV', V.yaw + figuren_wrap(gy - V.yaw), V.run ? 7 : 9, dt); if (V.run) V.exert = Math.min(1, V.exert + dt * .08); return; }
  V.exert = Math.max(0, V.exert - dt * .03);
  // Drehen auf der Stelle
  const diff = figuren_wrap(gy - V.yaw);
  if (V.turn) { const m = Mo[V.turn], a = P.acts[V.turn]; const t = a ? a.time : 99, c = m && m.root && m.root.yaw;
    if (c && a && P.curK === V.turn && t < m.dur - .05) { const f = Math.min(c.length - 1.001, t * 10), i = Math.floor(f), yv = c[i] + (c[i + 1] - c[i]) * (f - i); V.yaw = V.turnY0 + yv * V.turnD; V.yawV = 0; return; }
    V.turn = null; V.yaw = V.turnY0 + (m ? m.turn * V.turnD : diff); figuren_play(P, figuren_idleKey(P), false, { fade: .45 }); }
  if (Math.abs(diff) > 1.05 && !P.gait) { const k = Math.abs(diff) > 2.4 && P.acts.turn_180 && !(P.bad && P.bad.turn_180) ? 'turn_180' : diff > 0 ? 'turn_l' : 'turn_r', m = Mo[k];
    const k2 = m && Math.sign(m.turn) !== Math.sign(diff) && k === 'turn_180' ? (diff > 0 ? 'turn_l' : 'turn_r') : k, m2 = Mo[k2];
    if (P.acts[k2] && m2 && m2.turn && Math.sign(m2.turn) === Math.sign(diff)) { const k = k2, m = m2; V.turn = k; V.turnY0 = V.yaw; V.turnD = Math.abs(diff / m.turn) * Math.sign(diff * m.turn); V.turnD = Math.sign(V.turnD) * Math.min(1.35, Math.max(.65, Math.abs(V.turnD))); figuren_play(P, k, false, { fade: .3, once: true }); return; } }
  figuren_spr(V, 'yaw', 'yawV', V.yaw + diff, 5, dt);
  // Ruhe (Varianten)
  const ik = figuren_idleKey(P); if (!FIGUREN_IDLES.includes(P.curK) && !(P.gait && P.curK === ik)) figuren_play(P, ik, false, { fade: .5 });
  if ((V.idleT -= dt) < 0) { V.idleT = 7 + Math.random() * 12; const L = P.gait ? [ik] : FIGUREN_IDLES.filter(k => P.acts[k] && k !== P.curK); if (L.length) figuren_play(P, L[Math.floor(Math.random() * L.length)], false, { fade: .9 }); } }
function figuren_idleKey(P) { if (P.gait) return figuren_locoClip(P, 'idle'); return FIGUREN_IDLES.includes(P.curK) ? P.curK : 'idle'; }
// Atmung: Brustkorb hebt sich um die Querachse (Schultern, Arme, Kopf folgen), Hals gleicht aus – nach Laufen schneller und tiefer
function figuren_breath(P, V, dt) { const r = P.rig; if (!r.chest || !r.chestChain) return; const M = FIGUREN_MV, kid = (P.h || 1.6) < 1.5;
  V.br += dt * (kid ? 1.9 : 1.55) * (1 + V.exert * 1.4); const a = (Math.sin(V.br) * .5 + .5) * (.012 + V.exert * .02);
  P.g.matrixWorld.decompose(M.p, M.q, M.s); M.v.set(1, 0, 0).applyQuaternion(M.q); M.q.setFromAxisAngle(M.v, -a); r.chest.getWorldPosition(M.v2); figuren_rotChain(r.chestChain, M.v2, M.q);
  if (r.neckChain) { M.q.setFromAxisAngle(M.v, a * .7); r.neck.getWorldPosition(M.v2); figuren_rotChain(r.neckChain, M.v2, M.q); } }
// Blick: Ziel in Kopfhöhe; Augen schnell (≤ 25°), Kopf/Hals langsam (Hals + Kopf ≤ 60° seitlich, 35° hoch/runter); hinter der Figur: nicht hinsehen
function figuren_look(P, V, dt) { const r = P.rig, M = FIGUREN_MV; if (!r.head) return; let T = P.look, want = V.lookW;
  if (T === 'cam' || T === 'auto') { M.T.copy(camera.position); if (T === 'auto') { r.head.getWorldPosition(M.v); if (M.v.distanceTo(M.T) > 5) want = 0; } }
  else if (T && T.isObject3D) T.getWorldPosition(M.T); else if (T && T.isVector3) M.T.copy(T); else want = 0;
  r.head.getWorldPosition(M.v); M.v2.copy(M.T).sub(M.v); const yaw = V.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), lx = Math.cos(yaw), lz = -Math.sin(yaw);
  const hf = M.v2.x * fx + M.v2.z * fz, hl = M.v2.x * lx + M.v2.z * lz, ty = Math.atan2(hl, hf), tp = Math.atan2(M.v2.y, Math.hypot(hf, hl)), behind = Math.abs(ty) > 1.9; if (behind) want = 0;
  figuren_spr(V, 'lw', 'lwV', want, 4, dt); const W = Math.max(0, Math.min(1, V.lw));
  // P2: Zielrichtung des Kopfes relativ zum Körper, harte Grenzen (seitlich ±60°, −26°/+34°); Ziel hinter der Figur: Richtung einfrieren und ausblenden (kein Umschlagen von +60° auf −60°)
  if (!behind) { figuren_spr(V, 'hy', 'hyV', Math.max(-1.05, Math.min(1.05, ty)), 5.5, dt); figuren_spr(V, 'hp', 'hpV', Math.max(-.45, Math.min(.6, tp)), 5.5, dt); }
  if (W < .002) return;
  // Blickrichtung, die der Clip dem Kopf gerade gibt → Zusatzdrehung = Ziel − Clip (kürzester Weg), so bleibt die Summe innerhalb der Grenzen, egal wie weit sich der Clip-Kopf schon dreht
  r.head.matrixWorld.decompose(M.pv, M.qa, M.s); M.v5.copy(r.hF).applyQuaternion(M.qa); const yc = Math.atan2(M.v5.x * lx + M.v5.z * lz, M.v5.x * fx + M.v5.z * fz), pc = Math.asin(Math.max(-1, Math.min(1, M.v5.y)));
  let fy = V.hy; if (r.cF) { r.chest.matrixWorld.decompose(M.pv, M.qb, M.s); M.v5.copy(r.cF).applyQuaternion(M.qb); const cy = Math.atan2(M.v5.x * lx + M.v5.z * lz, M.v5.x * fx + M.v5.z * fz); fy = cy + Math.max(-1.05, Math.min(1.05, figuren_wrap(V.hy - cy))); } // höchstens 60° gegen den Oberkörper (dreht der Clip den Rumpf, z. B. beim Umdrehen)
  const dy = Math.max(-1.3, Math.min(1.3, figuren_wrap(fy - yc))) * W, dp = Math.max(-.8, Math.min(.8, V.hp - pc)) * W;
  const ey = Math.max(-.45, Math.min(.45, (ty - V.hy) * W)), ep = Math.max(-.3, Math.min(.3, (tp - V.hp) * W)); figuren_spr(V, 'ey', 'eyV', behind ? 0 : ey, 28, dt); figuren_spr(V, 'ep', 'epV', behind ? 0 : ep, 28, dt);
  M.v3.set(lx, 0, lz); // Querachse (links)
  if (r.neckChain) { r.neck.getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, dy * .4); M.q2.setFromAxisAngle(M.v3, -dp * .35); M.q.multiply(M.q2); figuren_rotChain(r.neckChain, M.pv, M.q); }
  if (r.headChain) { r.head.getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, dy * .6); M.q2.setFromAxisAngle(M.v3, -dp * .65); M.q.multiply(M.q2); figuren_rotChain(r.headChain, M.pv, M.q); }
  for (let i = 0; i < r.eyes.length; i++) { const e = r.eyes[i]; e[0].getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, V.ey); M.q2.setFromAxisAngle(M.v3, -V.ep); M.q.multiply(M.q2); figuren_rotChain(e, M.pv, M.q); }
  if (r.eyeM.length) for (const [o, i, d] of r.eyeM) o.morphTargetInfluences[i] = Math.max(0, Math.min(1, d === 'L' ? V.ey / .45 : d === 'R' ? -V.ey / .45 : d === 'Up' ? V.ep / .3 : -V.ep / .3)); }
// Fuß-IK: Boden unter jedem Fuß (10 Hz abgetastet, gefedert); Becken sinkt auf den tieferen Fuß, der höhere Fuß wird angehoben
function figuren_feet(P, V, dt, w, gy) { const r = P.rig, M = FIGUREN_MV, L = r.legs;
  if ((V.ikT -= dt) <= 0) { V.ikT = .05; /* P2: 20 Hz (vorher 10 Hz: Fuß tauchte beim Betreten einer Stufe bis 10 cm ein) */ for (let i = 0; i < 2; i++) { const F = L[i][2]; F.getWorldPosition(M.v); const g = figuren_ground(M.v.x, w.y, M.v.z); const o = g === null ? 0 : Math.max(-.4, Math.min(.45, g - w.y)); if (i) V.gR = o; else V.gL = o; } }
  figuren_spr(V, 'oL', 'oLV', V.gL, V.gL > V.oL ? 24 : 14, dt); figuren_spr(V, 'oR', 'oRV', V.gR, V.gR > V.oR ? 24 : 14, dt); // hinauf schneller als hinab
  const drop = Math.min(V.oL, V.oR); figuren_spr(V, 'drop', 'dropV', drop, 12, dt);
  if (Math.abs(V.oL) < .004 && Math.abs(V.oR) < .004 && Math.abs(V.drop) < .004) { if (P.obj.position.y !== 0 && !P.sit) P.obj.position.y = 0; return; }
  M.ik++; const gs = P.g.getWorldScale(M.s).y || 1; P.obj.position.y = V.drop / gs;
  // Welt schon mit neuer Höhe rechnen: Füße relativ anheben (Differenz zum Becken-Versatz)
  P.obj.updateMatrixWorld(true);
  for (let i = 0; i < 2; i++) { const lift = (i ? V.oR : V.oL) - V.drop; if (lift > .003) figuren_legIK(L[i], lift); } }
// ---------- Ich-Hände (AP-MOCAP): echte Finger- und Handgelenkbewegung aus Handschuh-Mocap (Rokoko „Smoking 01“) für assets/ms/haende (Detective_Hands)
// Daten: assets/anim/haende_rauchen.json (tools/mocap_haende.mjs). Posen: halten · zug · heben · senken · klopfen · locker · anfang; Kurve 'rauchen' (61,9 s, 15 Bilder/s).
// figuren_handPose(hände, pose, gewicht, { seite: 'L'|'R'|'beide', t: Sekunden (nur Kurve), handgelenk: false }) → true, wenn gesetzt. Nach dem Mischer aufrufen (setzt lokale Drehungen, gewichtet).
const FIGUREN_HAND = { lib: null, p: null, q: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion() };
function figuren_handLib() { if (!FIGUREN_HAND.p) FIGUREN_HAND.p = fetch('assets/anim/haende_rauchen.json').then(r => r.json()).then(j => {
    for (const c of Object.values(j.kurven || {})) for (const K of ['L', 'R']) if (typeof c[K] === 'string') { const b = atob(c[K]), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); c[K] = new Int16Array(u.buffer); }
    FIGUREN_HAND.lib = j; return j; }).catch(e => { console.warn('Hände-Posen', e); return null; }); return FIGUREN_HAND.p; }
function figuren_handPose(hands, pose, w = 1, { seite = 'beide', t = 0, handgelenk = false } = {}) { const L = FIGUREN_HAND.lib; if (!L || !hands) { figuren_handLib(); return false; }
  let B = hands.userData.handBones; if (!B) { B = hands.userData.handBones = {}; for (const K of ['L', 'R']) B[K] = L.gelenke.map(j => { let hit = null; hands.traverse(o => { if (!hit && o.name.replace(/_\d+$/, '') === K + '_Hand' + (j === 'Hand' ? '' : j)) hit = o; }); return hit; }); }
  const H = FIGUREN_HAND, J = L.gelenke.length, cur = L.kurven[pose], P = !cur && (typeof pose === 'string' ? L.posen[pose] : pose); if (!cur && !P) return false;
  for (const K of seite === 'beide' ? ['L', 'R'] : [seite]) { const bones = B[K];
    for (let j = handgelenk ? 0 : 1; j < J; j++) { const b = bones[j]; if (!b) continue;
      if (cur) { const A = cur[K], n = cur.bilder, f = Math.max(0, Math.min(n - 1.001, t * L.fps)), i = Math.floor(f), k = f - i, o1 = (i * J + j) * 4, o2 = ((i + 1) * J + j) * 4;
        H.q.set(A[o1] / 32767, A[o1 + 1] / 32767, A[o1 + 2] / 32767, A[o1 + 3] / 32767); H.q2.set(A[o2] / 32767, A[o2 + 1] / 32767, A[o2 + 2] / 32767, A[o2 + 3] / 32767); H.q.slerp(H.q2, k).normalize(); }
      else { const v = P[K] && P[K][j]; if (!v) continue; H.q.set(v[0], v[1], v[2], v[3]); }
      if (w >= .999) b.quaternion.copy(H.q); else b.quaternion.slerp(H.q, Math.max(0, w)); } }
  return true; }
function figuren_sync() {} // früher: Umschalten Kind/Erwachsener – jetzt feste Besetzung
WORLD_TICK.push(dt => figuren_tick(dt));
window.__figuren = { S: figuren_S, MV: FIGUREN_MV, embody: figuren_embody, load: figuren_load, play: figuren_play, act: figuren_do, lookAt: figuren_lookAt, stalker: () => stalker, show: async (id, x, z, ry = 0, ghost = false, o = {}) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); await figuren_embody(g, id, { ghost, ...o }); return g; } }; // Testzugang (Selbsttest)
