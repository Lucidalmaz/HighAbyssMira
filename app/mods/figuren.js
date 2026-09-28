// =====================================================================  FIGUREN (Modul „figuren“): jede Person hat ihr eigenes Aussehen
// Quelle: app/tools/forge.html + cast.json (Figuren-Werkstatt) → game/assets/chars/<id>/model.glb, Liste game/assets/chars/chars.json
//   Kinder 2009: zayn roxy lucy luke luke_echt heidi dina mike cleo kleine · Erwachsene: mama hilde lucy_erw vegas amt1 amt2 lorenz aydin dina_erw polizist
//   Schreckgestalten: graue (die Kleine ohne Mund), hilde_tot, gezaehlt_j/_m (die Gezählten) · Justin: vorhandenes Paladin-Modell
// ERINNERUNGEN (Echos) – warum Luke sie sieht (story_final.md, „Nachhall“): Wo das Weiße jemanden nimmt oder zurückgibt, bleibt ein Abdruck.
//   Nur wer Justins Blut in sich trägt, sieht ihn – Luke ist aus diesem Blut gemacht; beim Berühren brennt die halbrunde Narbe in seiner Hand.
//   Darstellung deshalb bewusst schemenhaft: kaltes Leuchten, Filmflackern, Ränder lösen sich auf, das Bild wird blass – Erinnerung, kein Mensch aus Fleisch.
const figuren_S = { list: null, cache: new Map(), sk: null, ghost: new Map(), T: { value: 0 }, embodied: new Set(), ownFilter: false };
async function figuren_list() { if (!figuren_S.list) { try { figuren_S.list = await (await fetch('assets/chars/chars.json')).json(); } catch (e) { figuren_S.list = []; } } return figuren_S.list; }
async function figuren_load(id) {
  if (id === 'alter_mann') id = 'vegas'; // früherer Rollenname
  if (figuren_S.cache.has(id)) return figuren_S.cache.get(id);
  const p = (async () => { try {
    if (id === 'justin') { if (!justin.model || !justin.mixer) return null; const clips = {}; for (const [k, a] of Object.entries(justin.acts)) clips[k] = a.getClip(); return { scene: justin.model, clips, height: 1.94, yaw: 0 }; }
    const info = (await figuren_list()).find(x => x.id === id); if (!info) return null;
    const g = await MSL.gl.loadAsync('assets/chars/' + id + '/model.glb'); const clips = {}; for (const a of g.animations) clips[a.name] = a;
    g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; } });
    return { scene: g.scene, clips, height: info.height, yaw: 0 };
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
async function figuren_embody(g, id, { ghost = false, doll = false, clip = null, sit = null } = {}) {
  const P = g.userData.person; if (P && P.id === id && P.ghost === ghost && P.doll === doll) { if (clip && P.acts[clip] && P.cur !== P.acts[clip]) figuren_play(P, clip); return P; }
  const tok = (g.userData.personTok = (g.userData.personTok || 0) + 1);
  const T = await figuren_load(id); if (!T || tok !== g.userData.personTok) return null;
  const sk = await figuren_skc(), obj = sk(T.scene); obj.name = 'Person_' + id;
  if (ghost) obj.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(figuren_ghostMat) : figuren_ghostMat(o.material); o.castShadow = false; o.receiveShadow = false; } });
  const hide = P ? P.hide : []; if (P) { g.remove(P.obj); P.mx.stopAllAction(); }
  for (const c of g.children) if (c.visible && c !== obj) { hide.push(c); c.visible = false; }
  g.add(obj); g.userData.noCol = true;
  const mx = new THREE.AnimationMixer(obj), acts = {}; for (const [k, c] of Object.entries(T.clips)) acts[k] = mx.clipAction(c);
  const Q = { id, obj, mx, acts, cur: null, ghost, doll, hide, last: new THREE.Vector3().setFromMatrixPosition(g.matrixWorld), fixed: !!clip, sit: false, g };
  g.userData.person = Q; figuren_S.embodied.add(g);
  figuren_play(Q, clip || 'idle', true); mx.update(Math.random() * 4);
  if (sit !== null) figuren_seat(Q, sit);
  return Q;
}
function figuren_play(P, k, first) { const a = P.acts[k] || P.acts.idle || Object.values(P.acts)[0]; if (!a || a === P.cur) return; a.reset().play(); a.timeScale = .88 + Math.random() * .22; if (P.cur && !first) { a.fadeIn(.3); P.cur.fadeOut(.3); } P.cur = a; }
function figuren_release(g) { const P = g.userData.person; if (!P) return; g.remove(P.obj); P.mx.stopAllAction(); P.hide.forEach(c => c.visible = true); g.userData.person = null; figuren_S.embodied.delete(g); }
// Sitzen: Oberschenkel nach vorn, Unterschenkel nach unten, Hände in den Schoß (Drehungen um die Querachse der Figur, unabhängig vom Skelett)
function figuren_bones(obj) { const map = { Hip: 'Hips', L_Thigh: 'LeftUpLeg', R_Thigh: 'RightUpLeg', L_Calf: 'LeftLeg', R_Calf: 'RightLeg', L_Upperarm: 'LeftArm', R_Upperarm: 'RightArm', L_Forearm: 'LeftForeArm', R_Forearm: 'RightForeArm', Spine01: 'Spine1', L_Foot: 'LeftFoot', R_Foot: 'RightFoot' }, m = {};
  obj.traverse(o => { if (!o.isBone) return; const n = o.name.replace(/^mixamorig[:_]?/i, '').replace(/_\d+$/, ''), c = map[n] || n; if (!m[c]) m[c] = o; }); return m; }
function figuren_seat(P, seatY) { const g = P.g, b = figuren_bones(P.obj); if (!b.LeftUpLeg || !b.Hips) return; P.mx.stopAllAction(); P.cur = null;
  const s = P.doll ? 1 : 1 / Math.max(1e-3, g.scale.x); P.obj.scale.setScalar(s); g.updateMatrixWorld(true);
  const _pw = new THREE.Quaternion(), _bw = new THREE.Quaternion(), _d = new THREE.Quaternion(), ax = new THREE.Vector3(1, 0, 0).applyQuaternion(g.getWorldQuaternion(new THREE.Quaternion()));
  const bend = (bn, ang) => { if (!bn) return; bn.parent.getWorldQuaternion(_pw); bn.getWorldQuaternion(_bw); _d.setFromAxisAngle(ax, ang); bn.quaternion.copy(_pw.invert().multiply(_d).multiply(_bw)); bn.updateMatrixWorld(true); };
  bend(b.LeftUpLeg, -1.5); bend(b.RightUpLeg, -1.5); bend(b.LeftLeg, 1.45); bend(b.RightLeg, 1.45); bend(b.LeftFoot, .1); bend(b.RightFoot, .1);
  bend(b.LeftArm, -.6); bend(b.RightArm, -.6); bend(b.LeftForeArm, -.45); bend(b.RightForeArm, -.45); bend(b.Spine1, .1);
  // Becken auf die Sitzfläche: Weltlage der Hüfte messen und die Person innerhalb der Gruppe verschieben
  const hip = new THREE.Vector3(); b.Hips.getWorldPosition(hip); const gs = g.getWorldScale(new THREE.Vector3()).y || 1;
  P.obj.position.y += (seatY + .08 - hip.y) / gs; P.sit = true; }
// ---------- Besetzung der Erinnerungen (Reihenfolge = Figuren der Echo-Definition)
const FIGUREN_ECHO = {
  echo_kreuzung: ['roxy', 'lucy', 'mike', 'dina', 'luke', 'heidi', 'zayn', 'vegas'],
  echo_kueche: ['hilde', 'amt1', 'amt2'],
  echo_kinderzimmer: ['mama', 'luke'],
  echo_brand: ['roxy'],
  echo_archiv: ['amt2', 'hilde'],
  echo_messraum: ['lucy', 'dina', 'zayn', 'justin'],
  echo_1975: ['justin', 'mike', 'gezaehlt_j', 'gezaehlt_m', 'graue'],   // Lars Vegas mit 9 sieht aus wie sein Enkel Mike; das letzte Kind hat kein Gesicht
  echo_mira: ['kleine', 'lucy', 'roxy', 'zayn', 'mike', 'dina', 'heidi', 'luke'], // sieben Puppen mit den Gesichtern der Kinder, klein wie Spielzeug
  echo_kanal_ritter: ['justin'],
  echo_kanal_laterne: ['gezaehlt_m', 'gezaehlt_j', 'kleine'],
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
  if (kind === 'lena') return small ? 'kleine' : 'lucy_erw';
  if (kind === 'pale') return small ? (Math.random() < .5 ? 'gezaehlt_j' : 'gezaehlt_m') : (Math.random() < .5 ? 'amt1' : 'amt2');
  return null; }
FACE_HOOK.fn = (fig, kind) => { fig.userData.faceKind = kind; if (fig.userData.face && fig.userData.person) fig.userData.face.visible = false; };

WORLD_MODS.push(['Figuren', async () => {
  const L = await figuren_list(); if (!L.length) return;
  // Schreckgestalten und feste Figuren sofort, der Rest im Hintergrund
  await Promise.all(['graue', 'hilde_tot', 'gezaehlt_j', 'gezaehlt_m', 'luke_echt', 'lucy_erw', 'hilde', 'kleine', 'amt1', 'amt2', 'vegas', 'roxy', 'lucy', 'mike', 'dina', 'heidi', 'zayn', 'luke'].map(figuren_load));
  L.forEach(x => figuren_load(x.id));
  const E = (g, id, o) => figuren_embody(g, id, o).catch(e => console.warn('Figur', id, e));
  await Promise.all([E(grey, 'graue'), E(victim, 'hilde'), E(lenaFig, 'lucy_erw'), E(mira, 'kleine'), E(kidShadow, 'gezaehlt_m'), E(watcher, 'justin', { clip: 'idle' }),
    ...counted.map((c, i) => E(c.f, i % 2 ? 'gezaehlt_m' : 'gezaehlt_j'))]);
  // Sitzende: die sieben Kinder im Weißen, Hilde in Raum 2, die Gestalt auf dem Gurtstuhl im Keller
  const seatK = ['roxy', 'lucy', 'mike', 'dina', 'heidi', 'zayn', 'luke'];
  for (let i = 0; i < kids.length; i++) { kids[i].k.updateMatrixWorld(true); await E(kids[i].k, seatK[i % seatK.length], { sit: .52 }); }
  hilde.updateMatrixWorld(true); await E(hilde, 'hilde', { sit: .48 });
}]);
function figuren_tick(dt) {
  figuren_S.T.value += dt;
  // Gestalten mit gemaltem Gesicht (stalker, sitter): passende Person nachziehen, sobald sie sichtbar wird
  for (const F of FIGS) { if (!F.visible || !F.userData.face) continue; const k = F.userData.faceKind; if (k === undefined) continue; const small = F.scale.x < .8, key = k + '|' + small, P = F.userData.person;
    if (F.userData.faceKey !== key) { F.userData.faceKey = key; const want = figuren_faceWho(k, small); if (want) figuren_embody(F, want, F === sitter ? { sit: F.position.y + .45 } : {}); }
    if (P && F.userData.face.visible) F.userData.face.visible = false; }
  const cam = camera.position, w = figuren_tick.w || (figuren_tick.w = new THREE.Vector3());
  for (const g of figuren_S.embodied) { const P = g.userData.person; if (!P || !g.visible || !g.parent) continue;
    const s = P.doll ? 1 : 1 / Math.max(1e-3, g.scale.x); if (Math.abs(P.obj.scale.x - s) > 1e-4) P.obj.scale.setScalar(s); // echte Körpergröße, egal wie die alte Gestalt skaliert war
    w.setFromMatrixPosition(g.matrixWorld); if (Math.abs(w.x - cam.x) > 70 || Math.abs(w.z - cam.z) > 70) { P.last.copy(w); continue; }
    if (P.sit) continue;
    const mv = w.distanceTo(P.last) / Math.max(dt, 1e-3); P.last.copy(w);
    if (!P.fixed) { const want = mv > .5 && P.acts.walk ? 'walk' : 'idle'; if (!P.cur || P.cur !== P.acts[want]) figuren_play(P, want); if (P.acts.walk && P.cur === P.acts.walk) P.cur.timeScale = Math.min(2.2, Math.max(.6, mv / 1.3)); }
    P.mx.update(dt); }
}
function figuren_sync() {} // früher: Umschalten Kind/Erwachsener – jetzt feste Besetzung
WORLD_TICK.push(dt => figuren_tick(dt));
window.__figuren = { S: figuren_S, embody: figuren_embody, load: figuren_load, stalker: () => stalker, show: async (id, x, z, ry = 0, ghost = false) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g); await figuren_embody(g, id, { ghost }); return g; } }; // Testzugang (Selbsttest)
