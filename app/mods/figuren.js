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
    const info = (await figuren_list()).find(x => x.id === id); if (!info) return FIGUREN_ERSATZ[id] ? figuren_load(FIGUREN_ERSATZ[id]) : null; // Q-6: neue Figur noch nicht gebaut → Stellvertreter
    const g = await MSL.gl.loadAsync('assets/chars/' + id + '/model.glb'); const clips = {}; for (const a of g.animations) clips[a.name] = a;
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } }); figuren_q6Mat(g.scene); // Q-6: Haut, Augen, Haare
    return { scene: g.scene, clips, height: info.height, yaw: 0, motion: g.scene.userData.motion || (g.scene.children[0] && g.scene.children[0].userData.motion) || {} }; // motion: Clip-Daten aus tools/mocap_bake.mjs (Tempo, Schleife, Fußphase, Drehung)
  } catch (e) { console.warn('Figur ' + id, e); return null; } })();
  figuren_S.cache.set(id, p); return p;
}
// Q-6: Stellvertreter, solange die neuen Figuren (forge.html/cast.json) nicht gebaut sind
const FIGUREN_ERSATZ = { mira: 'dina_erw', voss: 'amt1', luke_erw: 'amt2', reuter: 'aydin' };
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
      edge = max(edge, .3 * smoothstep(.5, .2, fr)); // R-3: nur der Umriss zerfällt – Arme, Beine, Kopf lösen sich nie ganz auf (sah aus wie verschwundene Körperteile)
      float band = .82 + .18 * sin(vWP.y * 42. - uT * 4.5), film = .88 + .12 * sin(uT * 21. + sin(uT * 6.3) * 3.);
      vec3 col = (vec3(.42, .58, .9) * (.03 + .95 * fr) + vec3(.7, .8, .95) * lum * .3) * band * film * .5;
      if (edge < .03) discard;
      gl_FragColor = vec4(col * edge * uGhost, 1.);`); };
  m.forceSinglePass = true; // additiv ohne Tiefe: ein Durchgang sieht gleich aus. Sonst schaltet three.js bei beidseitigen Teilen (Haare, Kleidung) jedes Bild zweimal die Seite um (needsUpdate → Programmsuche/-übersetzung, Ruckler beim Auftritt der Nachbilder)
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
  const Q = { id, obj, mx, acts, cur: null, curK: null, ghost, doll, hide, last: new THREE.Vector3().setFromMatrixPosition(g.matrixWorld), fixed: !!clip, sit: false, g, h: T.height || 1.6, motion: T.motion || {}, gait, rig: figuren_rig(obj, figuren_animSet(T)), mv: figuren_mvNew(), look: null, bad: figuren_sperre(id), face: figuren_faceRig(obj, id) };
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
  br: Math.random() * 6, exert: 0, hy: 0, hyV: 0, hp: 0, hpV: 0, ey: 0, eyV: 0, ep: 0, epV: 0, lookW: 0, lw: 0, lwV: 0, acc: 0, ikT: Math.random() * .1, gL: 0, gR: 0, oL: 0, oLV: 0, oR: 0, oRV: 0, drop: 0, dropV: 0, seatY: null, px: 0, pz: 0, vis: false, autoLook: null, spricht: 0 }; }
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
  FIGUREN_EYEU.catch.value = typeof flashOn !== 'undefined' && flashOn ? .9 : .28; // Lichtpunkt in den Augen: Lampe des Spielers an/aus
  try { figuren_kinoFaces(dt); figuren_hundTick(dt); } catch (e) { console.warn('figuren Gesichter/Hund', e); }
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
      const lit = P.face && near ? figuren_lit(w) : false; if (P.face) figuren_autoBlick(P, V, dist, lit, edt); // Q-6: Blick zum Gesprächspartner / ins Licht
      if (P.look || V.autoLook || V.lw > .01) figuren_look(P, V, edt);
      if (near && !P.sit && dist < 9 && P.rig.legs.length === 2 && typeof colliders !== 'undefined') figuren_feet(P, V, edt, w, gy);
      if (near && P.sit && V.seatY !== null && P.rig.legs.length === 2) figuren_seatFeet(P, w);
      if (P.face && !P.ghost) figuren_face(P, V, edt, dist, lit); } catch (e) { console.warn('figuren Zusatzschicht', P.id, e); P.mv.off = true; }
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
function figuren_look(P, V, dt) { const r = P.rig, M = FIGUREN_MV; if (!r.head) return; let T = P.look || V.autoLook, want = P.look ? V.lookW : V.autoLook ? .85 : 0;
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
// =====================================================================  GESICHTER (Q-6, 01.10.2026): Haut, Augen, Blinzeln, Blick, Mikrobewegungen, Mimik, Mund
// Doku: app/story/audit/F3_stand_gesichter.md. Alle Menschen tragen CC-Köpfe; seit dem Neubau (forge.html Q-6) haben alle 36 Gesichtsformen (Lider, Blickrichtung der Lider,
// Brauen, Mimik, Mund), Erwachsene zusätzlich Augapfel-Knochen R_Eye/L_Eye (Kinder hatten sie schon). Fehlt etwas (Justin, Blechmann), schaltet sich der Teil je Figur ab.
// API: figuren_mimik(P, 'angst'|'trauer'|'erleichterung'|'misstrauen'|'wut'|'schmerz'|'erschoepft'|'leer'|null, gewicht = 1, dauer = 0 (0 = bis auf Widerruf))
//      figuren_sprich(P, sekunden, { amp = 1, pegel }) – Mund bewegt sich (pegel: Funktion → 0…1, z. B. Lautstärke der Sprachausgabe; sonst Silbenrhythmus)
//      figuren_mund(wer, sekunden, o) – dasselbe über den Sprechernamen der Untertitel ('VEGAS', 'HILDE' …); Untertitel mit Sprecher lösen es selbst aus.
//      Haken für die Sprachausgabe (X-1): stimmen_spielen ruft figuren_mund(wer, dauer, { pegel }) mit dem echten Pegel auf → Lippen folgen der Stimme.
//      figuren_gesicht(id) → Fähigkeiten der geladenen Figur ({ formen, blinzeln, augenknochen, mimik, mund })
//      P.autoBlick = false schaltet den automatischen Blick (Gesprächspartner/Lichtquelle) je Figur ab.
const FIGUREN_FACE_CH = ['Eye_Blink_L', 'Eye_Blink_R', 'Eye_Squint_L', 'Eye_Squint_R', 'Eye_Wide_L', 'Eye_Wide_R', 'Brow_Raise_Inner_L', 'Brow_Raise_Inner_R', 'Brow_Raise_Outer_L', 'Brow_Raise_Outer_R', 'Brow_Drop_L', 'Brow_Drop_R',
  'Mouth_Smile_L', 'Mouth_Smile_R', 'Mouth_Frown_L', 'Mouth_Frown_R', 'Mouth_Stretch_L', 'Mouth_Stretch_R', 'Mouth_Press_L', 'Mouth_Press_R', 'Nose_Sneer_L', 'Nose_Sneer_R', 'Cheek_Raise_L', 'Cheek_Raise_R', 'V_Open', 'V_Tight_O', 'V_Wide', 'V_Explosive'];
const FIGUREN_FACE_IX = Object.fromEntries(FIGUREN_FACE_CH.map((n, i) => [n, i]));
// Mimik (Werte ohne _L/_R gelten für beide Seiten) – bewusst klein: psychologischer Horror lebt von kleinen Ausdrücken
const FIGUREN_MIMIK = {
  angst: { Eye_Wide: .55, Brow_Raise_Inner: .7, Brow_Raise_Outer: .3, Mouth_Stretch: .3, V_Open: .1 },
  trauer: { Brow_Raise_Inner: .6, Mouth_Frown: .5, Eye_Squint: .18, Cheek_Raise: .08 },
  erleichterung: { Mouth_Smile: .26, Brow_Raise_Inner: .16, Cheek_Raise: .16, Eye_Squint: .12 },
  misstrauen: { Eye_Squint: .42, Brow_Drop: .38, Mouth_Press: .32, Nose_Sneer_L: .12, Brow_Raise_Outer_R: .18 },
  wut: { Brow_Drop: .65, Nose_Sneer: .32, Mouth_Press: .42, Eye_Squint: .28 },
  schmerz: { Eye_Squint: .55, Brow_Drop: .35, Brow_Raise_Inner: .3, Mouth_Stretch: .38, Nose_Sneer: .22 },
  erschoepft: { Eye_Squint: .22, Brow_Raise_Inner: .18, V_Open: .16, Mouth_Frown: .14, Eye_Blink: .18 },
  leer: {} };
const FIGUREN_MIMIK_V = {}; for (const [k, o] of Object.entries(FIGUREN_MIMIK)) { const v = new Float32Array(FIGUREN_FACE_CH.length); for (const [n, w] of Object.entries(o)) { if (FIGUREN_FACE_IX[n] !== undefined) v[FIGUREN_FACE_IX[n]] = w; else for (const s of ['_L', '_R']) if (FIGUREN_FACE_IX[n + s] !== undefined) v[FIGUREN_FACE_IX[n + s]] = w; } FIGUREN_MIMIK_V[k] = v; }
// Clip → Mimik, solange kein Modul selbst eine setzt
const FIGUREN_CLIP_MIMIK = { fear: 'angst', nervous: 'angst', run_panik: 'angst', ohren_zu: 'angst', alert: 'misstrauen', arme_verschraenkt: 'misstrauen', weinen: 'trauer', zusammensacken: 'trauer', zusammenrollen: 'trauer', zusammenbruch: 'trauer',
  augen_zu: 'trauer', facepalm: 'trauer', erschoepft: 'erschoepft', haende_knie: 'erschoepft', schwanken: 'erschoepft', walk_muede: 'erschoepft', talk_wut: 'wut', husten: 'schmerz' };
// Sie blinzeln nie und schauen nicht von selbst: die Behaltenen und Hilde „Nicht du“ – das Starren ist ihr Grusel
const FIGUREN_STARR = new Set(['graue', 'gezaehlt_j', 'gezaehlt_m', 'hilde_tot']);
const FIGUREN_EYEU = { catch: { value: .3 } };
function figuren_faceRig(obj, id) { const F = { ch: FIGUREN_FACE_CH.map(() => []), w: new Float32Array(FIGUREN_FACE_CH.length), ex: new Float32Array(FIGUREN_FACE_CH.length), n: 0, eyeM: [],
    starr: FIGUREN_STARR.has(id), blinkIn: .6 + Math.random() * 3.5, blinkT: -1, dbl: false, mim: null, mimW: 0, mimT: 0, talkT: 0, talkA: 1, pegel: null, mo: 0, ph: Math.random() * 100,
    microT: 2 + Math.random() * 5, microK: -1, microW: 0, microD: 1, sacT: 0, sy: 0, sp: 0, syV: 0, spV: 0, ty: 0, tp: 0, asym: (Math.random() - .5) * .22, glare: 0, autoT: 0 };
  obj.traverse(o => { const d = o.morphTargetDictionary; if (!o.isMesh || !d || !o.morphTargetInfluences) return;
    for (const [nm, i] of Object.entries(d)) { const n = nm.replace(/^.*\./, ''), k = FIGUREN_FACE_IX[n]; if (k !== undefined) { F.ch[k].push(o.morphTargetInfluences, i); F.n++; }
      const m = n.match(/^Eye_([LR])_Look_(L|R|Up|Down)$/); if (m) F.eyeM.push(o.morphTargetInfluences, i, m[2] === 'L' ? 0 : m[2] === 'R' ? 1 : m[2] === 'Up' ? 2 : 3); } });
  F.blink = F.ch[0].length > 0 && !F.starr; return F.n || F.eyeM.length ? F : null; }
function figuren_gesicht(id) { for (const g of figuren_S.embodied) { const P = g.userData.person; if (P && P.id === id) { const F = P.face, r = P.rig; return { formen: F ? F.n : 0, blinzeln: !!(F && F.blink), augenknochen: r.eyes.length, lidBlick: F ? F.eyeM.length / 3 : 0,
  mimik: !!(F && F.ch[6].length && F.ch[14].length), mund: !!(F && F.ch[24].length), starr: !!(F && F.starr) }; } } return null; }
function figuren_mimik(P, name, w = 1, dauer = 0) { const F = P && P.face; if (!F) return false; F.mim = name && FIGUREN_MIMIK_V[name] ? name : null; F.mimW = Math.max(0, Math.min(1.5, w)); F.mimT = dauer > 0 ? dauer : Infinity; return true; }
function figuren_sprich(P, sek, { amp = 1, pegel = null } = {}) { const F = P && P.face; if (!F || !F.ch[24].length) return false; F.talkT = Math.max(F.talkT, sek); F.talkA = amp; F.pegel = pegel; P.mv.spricht = sek; return true; }
// Sprechername (Untertitel) → Figuren-IDs; sonst: erstes Wort klein = ID
const FIGUREN_SPRECHER = { VEGAS: ['vegas'], 'LARS VEGAS': ['vegas'], HILDE: ['hilde'], GISELA: ['gisela'], LUCY: ['lucy', 'lucy_erw'], DINA: ['dina', 'dina_erw'], MAMA: ['mama'], MARION: ['mama'], 'FRAU AYDIN': ['aydin'],
  WOLTER: ['wolter'], 'GÜNTHER': ['guenther'], GUENTHER: ['guenther'], MAAS: ['guenther'], HOFER: ['polizist'], 'NACHSORGE 11': ['nachsorge11'], 'NACHSORGE 12': ['nachsorge12'], 'FRAU REUTER': ['reuter'], VOSS: ['voss'], ZAYN: ['zayn'], ROXY: ['roxy'], HEIDI: ['heidi'], MIKE: ['mike'], CLEO: ['cleo'], MIRA: ['mira'] };
// Pegel-Weg (stimmen.js ruft je Bild figuren_mund(stimme, pegel 0…1) auf): Lippen folgen der echten Stimme, 0 beendet
const FIGUREN_PEGEL = { wer: '', P: null, t: 0, v: 0 };
function figuren_mund(wer, sek, o) { if (o === undefined && typeof sek === 'number' && sek <= 1.01 && typeof stimmen_spielen === 'function') { const Q = FIGUREN_PEGEL; Q.v = sek;
    if (Q.wer !== wer || performance.now() - Q.t > 600) { Q.wer = wer; Q.t = performance.now(); Q.P = figuren_mund(wer, .3, { pegel: () => FIGUREN_PEGEL.v }); }
    const P = Q.P; if (P && P.face) { if (sek <= 0) { P.face.talkT = 0; P.face.pegel = null; } else { P.face.talkT = Math.max(P.face.talkT, .3); P.face.pegel = () => FIGUREN_PEGEL.v; P.mv.spricht = .5; } } return P; }
  o = o || {}; if (!wer) return null; const W = String(wer).replace(/<[^>]*>/g, '').trim().toUpperCase(), base = W.split(/[,(]/)[0].trim(); const ids = FIGUREN_SPRECHER[base] || FIGUREN_SPRECHER[W] || [base.toLowerCase().split(/\s+/)[0]];
  let best = null, bd = 14; const cam = camera.position, v = FIGUREN_MV.v; for (const g of figuren_S.embodied) { const P = g.userData.person; if (!P || !P.face || P.ghost || !ids.includes(P.id) || !g.visible) continue; v.setFromMatrixPosition(g.matrixWorld); const d = v.distanceTo(cam); if (d < bd) { bd = d; best = P; } }
  if (best) figuren_sprich(best, sek, o); else if (typeof kino_S !== 'undefined' && kino_S.fig) for (const k in kino_S.fig) { const K = kino_S.fig[k]; if (K && K.g && K.g.visible && ids.includes(K.id)) { K.sprichT = sek; return K; } }
  return best; }
// Untertitel mit Sprecher → Mund der nächsten passenden Figur (Gedanken „LUKE“/„DU“ haben keinen sichtbaren Mund)
subtitle = (o => function (t, ms, who) { try { if (who && !/^(LUKE|DU)$/i.test(String(who).trim())) { const T = String(t || '').replace(/<[^>]*>/g, ''); figuren_mund(who, Math.min((ms || 3000) / 1000 * .82, .25 + T.length * .062)); } } catch (e) {} return o(t, ms, who); })(subtitle);
// Werte (0…1) je Kanal setzen – mehrere Netze je Kanal
function figuren_faceWrite(F) { const W = F.w, C = F.ch; for (let k = 0; k < C.length; k++) { const a = C[k], w = W[k]; for (let j = 0; j < a.length; j += 2) a[j][a[j + 1]] = w; } }
function figuren_rauschen(x) { const i = Math.floor(x), f = x - i, h = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }; return h(i) + (h(i + 1) - h(i)) * f * f * (3 - 2 * f); }
// Je Bild (nahe Figuren): Blinzeln, Mikro-Mimik, Clip-/Modul-Mimik, Blendung, Mund, Sakkaden (Augen), Mikrobewegung des Kopfes
function figuren_face(P, V, dt, dist, lit) { const F = P.face, r = P.rig, M = FIGUREN_MV, W = F.w; if (!F) return; const t = figuren_S.T.value + F.ph;
  // Mimik-Ziel: Modul > Clip > Gangart > neutral
  if (F.mim && (F.mimT -= dt) <= 0) F.mim = null; const mk = F.mim || FIGUREN_CLIP_MIMIK[P.curK] || (P.gait === 'panik' ? 'angst' : P.gait === 'muede' ? 'erschoepft' : null), mv = mk ? FIGUREN_MIMIK_V[mk] : null, mw = F.mim ? F.mimW : .8;
  const kE = 1 - Math.exp(-dt * (mv ? 4.5 : 2.2)); for (let k = 0; k < W.length; k++) { let tg = mv ? mv[k] * mw : 0; if (k & 1) tg *= 1 - F.asym; else tg *= 1 + F.asym; F.ex[k] += (tg - F.ex[k]) * kE; }
  // Mikro-Mimik: alle paar Sekunden eine kleine Regung (Brauen, Lippen, Lider) – Leben im Gesicht
  if (!F.starr && (F.microT -= dt) <= 0) { F.microT = 2.5 + Math.random() * 6; F.microK = [6, 6, 2, 18, 12, 8][Math.floor(Math.random() * 6)]; F.microW = .06 + Math.random() * .1; F.microD = .5 + Math.random() * .9; F.microS = 0; }
  let micro = 0; if (F.microK >= 0) { F.microS = (F.microS || 0) + dt; const u = F.microS / F.microD; micro = u >= 1 ? 0 : Math.sin(u * Math.PI) * F.microW; if (u >= 1) F.microK = -1; }
  // Blinzeln: zufällig alle 2–6 s (Angst/Blendung häufiger), gelegentlich doppelt; schließen 75 ms, halten 30 ms, öffnen 160 ms
  let bl = 0; if (F.blink) { if (F.blinkT < 0) { F.blinkIn -= dt * (mk === 'angst' ? 1.7 : 1) * (F.glare > .3 ? 1.6 : 1); if (F.blinkIn <= 0) { F.blinkT = 0; F.dbl = Math.random() < .14; } }
    else { F.blinkT += dt; const b = F.blinkT; bl = b < .075 ? Math.sin(b / .075 * Math.PI / 2) : b < .105 ? 1 : b < .265 ? 1 - (x => x * x * (3 - 2 * x))((b - .105) / .16) : 0;
      if (b >= .265) { F.blinkT = -1; F.blinkIn = F.dbl ? .12 : 2 + Math.random() * 4; F.dbl = false; } } }
  // Blendung: Taschenlampe trifft das Gesicht → kneifen, Brauen runter, Blick kurz ins Licht
  F.glare += ((lit ? Math.max(0, 1 - dist / 7) : 0) - F.glare) * (1 - Math.exp(-dt * 3));
  // Mund: Sprachausgabe-Pegel oder Silbenrhythmus (~5 Silben/s, Wortpausen)
  let op = 0, wi = 0, ti = 0, ex = 0; if (F.talkT > 0) { F.talkT -= dt; const fade = Math.min(1, F.talkT * 4);
    if (F.pegel) { let p = 0; try { p = +F.pegel() || 0; } catch (e) { F.pegel = null; } F.mo += (Math.min(1, p) - F.mo) * (1 - Math.exp(-dt * 18)); op = F.mo * .62; wi = op * .3; ti = (1 - F.mo) * .12 * fade; }
    else { const s = t * 5.2, syl = Math.pow(Math.max(0, Math.sin(s * Math.PI * 2)), .7), gap = Math.min(1, Math.max(0, (figuren_rauschen(t * 1.6) - .22) / .2)); op = syl * gap * (.32 + .3 * figuren_rauschen(s)); wi = op * figuren_rauschen(t * 3.1 + 4) * .5; ti = (1 - syl) * gap * .22 * figuren_rauschen(t * 2.3 + 9); ex = syl < .08 && gap > .5 ? .25 : 0; }
    op *= F.talkA * fade; wi *= F.talkA * fade; ti *= F.talkA * fade; ex *= F.talkA * fade; } else F.mo = 0;
  for (let k = 0; k < W.length; k++) W[k] = F.ex[k];
  if (F.microK >= 0) { W[F.microK] += micro; W[F.microK + 1] += micro * (.7 + F.asym); }
  W[0] = Math.min(1, W[0] + bl * .98 + F.glare * .1); W[1] = Math.min(1, W[1] + bl * .98 + F.glare * .1); W[2] += F.glare * .45; W[3] += F.glare * .4; W[10] += F.glare * .2; W[11] += F.glare * .18;
  W[24] += op; W[26] += wi; W[25] += ti; W[27] += ex; for (let k = 0; k < W.length; k++) W[k] = Math.max(0, Math.min(1, W[k]));
  figuren_faceWrite(F);
  // Sakkaden: kleine, schnelle Augensprünge (beim Hinsehen klein, sonst ein ruhiges Umherschauen)
  const looking = !!(P.look || V.autoLook || V.lw > .05); if ((F.sacT -= dt) <= 0) { const big = !looking && !F.starr; F.sacT = big ? .9 + Math.random() * 2.4 : .35 + Math.random() * 1.4;
    const ty = (Math.random() - .5) * (big ? .5 : .08), tp = (Math.random() - .5) * (big ? .18 : .05); if (big && Math.abs(ty - F.ty) > .3 && F.blink && F.blinkT < 0 && Math.random() < .45) F.blinkIn = .02; F.ty = F.starr ? 0 : ty; F.tp = F.starr ? 0 : tp; }
  figuren_spr(F, 'sy', 'syV', F.ty, 38, dt); figuren_spr(F, 'sp', 'spV', F.tp, 38, dt);
  const eyY = (looking ? V.ey : 0) + F.sy, eyP = (looking ? V.ep : 0) + F.sp - (W[0] + W[1]) * .04;
  M.v3.set(Math.cos(V.yaw), 0, -Math.sin(V.yaw)); // Querachse (links)
  if (r.eyes.length && (Math.abs(F.sy) > 1e-4 || Math.abs(F.sp) > 1e-4)) for (let i = 0; i < r.eyes.length; i++) { const e = r.eyes[i]; e[0].getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, F.sy); M.q2.setFromAxisAngle(M.v3, -F.sp); M.q.multiply(M.q2); figuren_rotChain(e, M.pv, M.q); }
  const E = F.eyeM; for (let j = 0; j < E.length; j += 3) { const d = E[j + 2]; E[j][E[j + 1]] = Math.max(0, Math.min(1, d === 0 ? eyY / .45 : d === 1 ? -eyY / .45 : d === 2 ? eyP / .3 : -eyP / .3)); }
  // Mikrobewegung des Kopfes (langsames Pendeln, beim Sprechen leichtes Nicken) – nie bei den Starren
  if (r.headChain && !F.starr) { const ny = .014 * Math.sin(t * .37) + .009 * Math.sin(t * 1.13 + 2), np = .011 * Math.sin(t * .29 + 1) + op * .045, nr = .009 * Math.sin(t * .23 + 4);
    r.head.getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, ny); M.q2.setFromAxisAngle(M.v3, -np); M.q.multiply(M.q2); M.v.set(-M.v3.z, 0, M.v3.x); M.q2.setFromAxisAngle(M.v, nr); M.q.multiply(M.q2); figuren_rotChain(r.headChain, M.pv, M.q); } }
// Automatischer Blick: Gesprächspartner (beim Sprechen / im Gespräch nah), sonst kurz ins Licht, wenn die Taschenlampe trifft
function figuren_autoBlick(P, V, dist, lit, dt) { const F = P.face; if (!F || F.starr || P.ghost || P.doll || P.autoBlick === false || P.look) { V.autoLook = null; return; }
  const talk = typeof state !== 'undefined' && state.talking && dist < 4.5, own = P.mv.spricht > 0 && dist < 9; if (P.mv.spricht > 0) P.mv.spricht -= dt;
  if (talk || own) { V.autoLook = 'cam'; F.autoT = 0; return; }
  if (lit && dist < 9) { F.autoT += dt; V.autoLook = F.autoT < 1.6 ? 'cam' : null; return; } // ins Licht schauen, dann wieder weg (nicht starren)
  F.autoT = Math.max(0, F.autoT - dt * .5); V.autoLook = null; }
// Taschenlampe trifft die Figur (Kegel ~ 28°, bis 12 m)
function figuren_lit(w) { if (typeof flashOn === 'undefined' || !flashOn || (typeof state !== 'undefined' && state.blackout)) return false; const M = FIGUREN_MV; camera.getWorldDirection(M.v2); M.v.copy(w); M.v.y += 1.45; M.v.sub(camera.position); const d = M.v.length(); if (d > 12 || d < .2) return false; return M.v.dot(M.v2) / d > .88; }
// ---------- Materialien (einmal je Vorlage): Haut mit Poren-Relief und warmer Streuung, nasse Hornhaut mit Lichtpunkt, Tränenrand, Haare ohne Ausdünnen in der Ferne
function figuren_q6Mat(root) { root.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m || m.userData.q6) continue; m.userData.q6 = 1; const n = m.name || '';
  try { if (/std_skin_head/i.test(n)) figuren_hautMat(m, 1); else if (/std_skin_(body|arm|leg)/i.test(n)) figuren_hautMat(m, 0);
    else if (/std_cornea/i.test(n)) figuren_corneaMat(m, false); else if (/std_tearline/i.test(n)) figuren_corneaMat(m, true);
    else if (/std_eye_[lr]$/i.test(n)) { m.roughness = .34; m.envMapIntensity = .5; }
    else if (m.alphaTest > 0 && (/hair|lash|brow|beard|scalp|transparency|locken/i.test(n) || /hair|lash|brow|beard|scalp|locken/i.test(o.name))) figuren_haarMat(m);
    // Durchsichtig + beidseitig in einem Durchgang (wie die Basis für alles beim Laden): sonst schaltet three.js in jedem Bild zweimal die Seite um (needsUpdate → Programmsuche, Ruckler beim Auftritt)
    if (m.transparent && m.side === THREE.DoubleSide) m.forceSinglePass = true; } catch (e) { console.warn('figuren Material', n, e); } } }); }
function figuren_hautMat(m, face) { m.onBeforeCompile = sh => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
  #ifdef USE_MAP
  { vec2 pu = vMapUv * ${face ? '760.' : '420.'}; vec2 fw = fwidth(pu); float fade = 1. - smoothstep(.3, .85, max(fw.x, fw.y));
    if (fade > .01) { vec2 ip = floor(pu), fp = fract(pu); float h = 0.;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 c = ip + vec2(i, j); vec2 rr = fract(sin(vec2(dot(c, vec2(127.1, 311.7)), dot(c, vec2(269.5, 183.3)))) * 43758.5453); h = max(h, 1. - smoothstep(.0, .3, length(vec2(i, j) + rr - fp))); }
      h = -h * (.55 + .45 * fract(sin(dot(ip, vec2(12.9898, 78.233))) * 43758.5453)) * .00011 * fade;
      vec3 sx = dFdx(-vViewPosition), sy = dFdy(-vViewPosition), r1 = cross(sy, normal), r2 = cross(normal, sx); float det = dot(sx, r1) * faceDirection;
      vec3 gr = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2); normal = normalize(abs(det) * normal - gr); } }
  #endif`).replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
  reflectedLight.directDiffuse *= vec3(1.05, .965, .945); reflectedLight.indirectDiffuse *= vec3(1.035, .975, .96);`); };
  m.customProgramCacheKey = () => 'fig_haut' + face; m.needsUpdate = true; }
function figuren_corneaMat(m, tear) { m.transparent = true; m.depthWrite = false; m.blending = THREE.AdditiveBlending; m.color.setRGB(0, 0, 0); m.map = null; m.alphaMap = null; m.opacity = 1; m.roughness = tear ? .1 : .035; m.metalness = 0; m.envMapIntensity = tear ? .5 : 1.1; m.visible = true;
  m.onBeforeCompile = sh => { sh.uniforms.uCatch = FIGUREN_EYEU.catch; sh.fragmentShader = 'uniform float uCatch;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `{ vec3 vv = normalize(vViewPosition), rr = reflect(-vv, normal);
      float c1 = pow(max(dot(rr, normalize(vec3(.28, .32, 1.))), 0.), 1400.) * 5. * uCatch, fr = .02 + .98 * pow(1. - clamp(dot(normal, vv), 0., 1.), 5.);
      outgoingLight = (reflectedLight.directSpecular + reflectedLight.indirectSpecular * (.5 + fr)) * ${tear ? '.55' : '1.'} + vec3(c1 * ${tear ? '.25' : '1.'}); }
    #include <opaque_fragment>`); };
  m.customProgramCacheKey = () => 'fig_cornea' + (tear ? 't' : ''); m.needsUpdate = true; }
// Haarkarten, Wimpern, Brauen: Deckkraft mit der Mip-Stufe anheben – sonst dünnen sie in der Ferne aus, bis Haare „verschwinden“ (R-3)
function figuren_haarMat(m) { m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <alphatest_fragment>', `#ifdef USE_MAP
  { vec2 ts = vec2(textureSize(map, 0)); vec2 dx = dFdx(vMapUv * ts), dy = dFdy(vMapUv * ts); float lod = max(0., .5 * log2(max(dot(dx, dx), dot(dy, dy)))); diffuseColor.a *= 1. + lod * .3; }
  #endif
  #include <alphatest_fragment>`); }; m.customProgramCacheKey = () => 'fig_haar'; m.needsUpdate = true; }
// Kino-Figuren (kino.js klont figuren_load-Vorlagen ohne Bewegungsschicht): Blinzeln + Sakkaden + Mund auch dort
function figuren_kinoFaces(dt) { if (typeof kino_S === 'undefined' || !kino_S.fig) return; for (const k in kino_S.fig) { const K = kino_S.fig[k]; if (!K || !K.g || !K.g.visible || !K.obj) continue;
  if (K.q6 === undefined) { K.q6 = figuren_faceRig(K.obj, K.id) || null; if (K.q6) K.q6.starr = FIGUREN_STARR.has(K.id); }
  const F = K.q6; if (!F) continue; const W = F.w; W.fill(0); let bl = 0;
  if (F.blink) { if (F.blinkT < 0) { if ((F.blinkIn -= dt) <= 0) F.blinkT = 0; } else { F.blinkT += dt; const b = F.blinkT; bl = b < .075 ? Math.sin(b / .075 * Math.PI / 2) : b < .105 ? 1 : b < .265 ? 1 - (b - .105) / .16 : 0; if (b >= .265) { F.blinkT = -1; F.blinkIn = 2 + Math.random() * 4; } } }
  W[0] = W[1] = bl * .98; if (K.sprichT > 0) { K.sprichT -= dt; const t = figuren_S.T.value + F.ph, s = t * 5.2; W[24] = Math.pow(Math.max(0, Math.sin(s * Math.PI * 2)), .7) * .4 * Math.min(1, K.sprichT * 4); }
  figuren_faceWrite(F); } }
// ---------- Hund Bruno (Q-9 B-3 „kam falsch zurück“): styloo „Dog“ (Fab), game/assets/ms/hund/model.glb – braun umgefärbt, dünner weißer Ring in den Augen
// figuren_hund(eltern, x, z, { y = 0, ry = 0, s = .92, grau = false, an = null, ab = [0, .6], wandern = null }) → Promise<{ g, … } | null>
//   an: Figur-Gruppe, neben der er bleibt (Lage, Drehung, Sichtbarkeit folgen ihr; ab = Versatz [quer, vor] im Raum der Figur) – z. B. zu Zayns Füßen in Nimmerheim.
//   wandern: [[x, z], [x, z]] – geht ab und zu zwischen den Punkten hin und her (z. B. Tür ↔ Napf).
//   „Falsch“: bellt nie und gibt keinen Laut, atmet nicht (Ruhe-Clip steht still, zuckt selten), dreht Kopf und Hals eine Sekunde zu spät, zu gleichmäßig und zu weit nach Luke (bis 115°);
//   beim Gehen bleiben die Beine mitten im Schritt stehen, während der Körper weitergleitet.
const FIGUREN_HUNDE = [];
async function figuren_hund(parent, x, z, o = {}) { try {
  const src = await msModel('hund', 'model.glb'), sk = await figuren_skc(), m = sk(src), g = new THREE.Group(); g.name = 'Bruno'; g.userData.noCol = true;
  m.rotation.y = Math.PI; m.scale.setScalar(o.s || .92); g.add(m); g.position.set(x, o.y || 0, z); g.rotation.y = o.ry || 0; (o.an ? scene : parent || scene).add(g);
  m.traverse(c => { if (!c.isMesh) return; c.castShadow = true; c.receiveShadow = true; c.frustumCulled = false; if (o.grau) c.material = [].concat(c.material).map(q => { const k = q.clone(); k.color.setRGB(.5, .52, .55); return k; })[0]; });
  const mx = new THREE.AnimationMixer(m), acts = {}; for (const a of src.animations || []) acts[a.name] = mx.clipAction(a);
  g.updateMatrixWorld(true); let head = null, hz = -Infinity; m.traverse(b => { if (!b.isBone || !/^DEF-spine/.test(b.name)) return; const p = g.worldToLocal(b.getWorldPosition(new THREE.Vector3())); if (p.z > hz) { hz = p.z; head = b; } });
  const H = { g, m, mx, acts, cur: null, head, neck: head && head.parent && head.parent.isBone ? head.parent : null, an: o.an || null, ab: o.ab || [0, .6], wandern: o.wandern || null, wi: 0, walk: null,
    hy: 0, hyT: 0, lagT: 0, twT: 4 + Math.random() * 6, tw: 0, fr: 0, frT: .6, wT: 8 + Math.random() * 10 };
  const play = k => { const a = acts[k]; if (!a || H.cur === a) return; if (H.cur) H.cur.fadeOut(.3); a.reset().fadeIn(.3).play(); H.cur = a; }; H.play = play;
  play('iddle'); mx.update(.37); if (H.cur) H.cur.timeScale = 0; FIGUREN_HUNDE.push(H); return H; } catch (e) { console.warn('Hund Bruno', e); return null; } }
function figuren_hundTick(dt) { const M = FIGUREN_MV, cam = camera.position;
  for (const H of FIGUREN_HUNDE) { const g = H.g;
    if (H.an) { const A = H.an; let vis = A.visible; for (let p = A.parent; p && vis; p = p.parent) vis = p.visible; g.visible = vis && !!A.parent; if (!g.visible) continue;
      A.matrixWorld.decompose(M.p, M.q, M.s); const yaw = Math.atan2(2 * (M.q.w * M.q.y + M.q.x * M.q.z), 1 - 2 * (M.q.y * M.q.y + M.q.x * M.q.x)); g.position.set(M.p.x + Math.cos(yaw) * H.ab[0] + Math.sin(yaw) * H.ab[1], M.p.y, M.p.z - Math.sin(yaw) * H.ab[0] + Math.cos(yaw) * H.ab[1]); g.rotation.y = yaw; }
    let vis = g.visible; for (let p = g.parent; p && vis; p = p.parent) vis = p.visible; if (!vis) continue; const dx = cam.x - g.position.x, dz = cam.z - g.position.z, dist = Math.hypot(dx, dz); if (dist > 30) continue;
    // Gehen zwischen zwei Punkten mit „falschem“ Gang: Beine frieren mitten im Schritt ein, der Körper gleitet weiter
    if (H.wandern && !H.walk && (H.wT -= dt) <= 0) { H.wi = 1 - H.wi; H.walk = H.wandern[H.wi]; H.play('walk'); H.fr = 0; H.frT = .5 + Math.random() * .6; }
    if (H.walk) { const tx = H.walk[0] - g.position.x, tz = H.walk[1] - g.position.z, d = Math.hypot(tx, tz);
      if (d < .08) { H.walk = null; H.wT = 9 + Math.random() * 14; H.play('iddle'); } else { H.frT -= dt; if (H.frT <= 0) { H.fr = 1 - H.fr; H.frT = H.fr ? .18 + Math.random() * .3 : .45 + Math.random() * .7; }
        if (H.cur) H.cur.timeScale = H.fr ? 0 : 1; const sp = (H.fr ? .38 : .62) * Math.min(1, d * 2), want = Math.atan2(tx, tz); let dy = want - g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); g.rotation.y += Math.sign(dy) * Math.min(Math.abs(dy), dt * 1.4);
        g.position.x += Math.sin(g.rotation.y) * sp * dt; g.position.z += Math.cos(g.rotation.y) * sp * dt; } }
    else if (H.cur) { H.tw = Math.max(0, H.tw - dt); if ((H.twT -= dt) <= 0) { H.twT = 5 + Math.random() * 9; H.tw = .2 + Math.random() * .12; } H.cur.timeScale = H.tw > 0 ? 2.4 : 0; } // steht still, atmet nicht – nur ein kurzes Zucken
    H.mx.update(dt);
    // Kopf nach Luke: Ziel nur jede Sekunde neu (zu spät), gleichmäßige Drehung ohne Nachfedern, weiter als ein Hund kann
    if ((H.lagT -= dt) <= 0) { H.lagT = 1.1; let a = Math.atan2(dx, dz) - g.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); H.hyT = dist < 14 ? Math.max(-2, Math.min(2, a)) : 0; }
    const st = dt * .75; H.hy += Math.max(-st, Math.min(st, H.hyT - H.hy));
    if (H.head && Math.abs(H.hy) > 1e-3) { g.updateMatrixWorld(true); if (H.neck) { H.neck.getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, H.hy * .45); figuren_rotChain([H.neck], M.pv, M.q); }
      H.head.getWorldPosition(M.pv); M.q.setFromAxisAngle(M.up, H.hy * .55); figuren_rotChain([H.head], M.pv, M.q); } } }
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
window.__figuren = { S: figuren_S, MV: FIGUREN_MV, embody: figuren_embody, load: figuren_load, play: figuren_play, act: figuren_do, lookAt: figuren_lookAt, mimik: figuren_mimik, sprich: figuren_sprich, mund: figuren_mund, gesicht: figuren_gesicht, hund: figuren_hund, hunde: FIGUREN_HUNDE, stalker: () => stalker, show: async (id, x, z, ry = 0, ghost = false, o = {}) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); await figuren_embody(g, id, { ghost, ...o }); return g; } }; // Testzugang (Selbsttest)
