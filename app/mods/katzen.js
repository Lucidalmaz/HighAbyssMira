// =====================================================================  KATZEN (Modul „katzen“, AP-09 Fassung 3, Überarbeitung 08.10.: Fell, Augen, Individuen): Giselas siebzehn Katzen und der Kater Hänschen
// Ein Tiermodell (Fab „Cat long haired“, Sean4297, CC-BY; aufbereitet in game/assets/ms/katze/model.glb: 56 statt 972 Knochen, Gehzyklus + eigene Posen). Aufbau der Datei: tools/katzen_fell.mjs
// (größerer Kopf/Hals, ~6 k Dreiecke Haarkarten `haar` je Körperregion mit Atlas aus tools/katzen_strands.py, Schnurrhaare `bart`, Augen 12 % größer). Farbe/Muster aus EINER Shader-Funktion für Haut und
// Haarkarten (Maske in der roughnessMap: Detail · weiße Partien · rosa Haut): Makrele, klassisch, Flecken, Siam-Abzeichen, Smoke (helle Unterwolle), Schildpatt/Dreifarbig/Kuh, Narben, verklebtes Fell;
// Augen im Shader (Schlitzpupille, Iris, trübe Augen je Seite); Haarlänge je Katze (kLen), Proportionen je Katze (bau). Halsband im Fell + Namensschild (Filzstift) als Decal.
// Keine Lichter: die Augen leuchten über Emission (Tapetum) und eine Reflexkarte (Textur der eyePairs), wenn die Lampe trifft.
//
// Regeln (Dossier „Wie die Katzen den Beobachter zeigen“): 1 Starren (Kopf + Ohren auf den Beobachter < 15 m, Kopf folgt Sprüngen mit 0,5 s, kein
// Blinzeln) · 2 Folgen (nicht sitzende Katzen trotten 2–3 m hinter seiner Spur) · 3 Fauchen (Beobachter < 4 m von hinten an Luke; ab Kap. 3 bei
// stehendem Luke < 3 m; immer in seine Richtung, nie auf Luke; in Nr. 1 faucht der Kater nie) · 4 Augen als Lichtquelle · 5 Weggehen (vor Luna,
// Behaltenen, brennenden Nachbildern).
//
// Schnittstelle für andere Module (kirchberg.js, kapitel5.js, kapitel6.js, beobachter.js …) – alles optional, per typeof prüfen:
//   katzen_spawn(opts) → Katze        opts: { name, fell, groesse ('S'|'M'|'L' oder Zahl), x, z, y?, ry?, pose ('sit'|'loaf'|'sleep'|'stand'),
//                                            starrt: [x,y,z]|null, heim: [x,z,r]|null, streunen: bool, zahm: bool, lichtscheu: bool, sims: bool (auf Mauer/Sims setzen) }
//   katzen_get(name) · katzen_place(k, x, z, {y, ry, pose}) · katzen_stare(k, [x,y,z]|null) · katzen_goto(k, x, z, {lauf, dann, y}) · katzen_jumpTo(k, x, y, z, dann)
//   katzen_tragen(k) / katzen_absetzen(k, x, z) (Luke trägt: linke Hand, kein Rennen, kein Springen/Klettern, Lampe bleibt) · katzen_fauch(k, [x,y,z]|null)
//   katzen_angst(x, z, r, sek) (Regel 5: alle Katzen im Umkreis/Raum gehen weg) · katzen_schnurren(k, an) · katzen_arm(k, obj3d, [dx,dy,dz]) (auf einem Arm)
//   katzen_klick(k, label, fn) (Interaktion) · katzen_S.nachRegie.push(fn(kap)) (nach der Verteilung je Kapitel, z. B. heimgebrachte Katzen an den Napf) · katzen_regie(an) (automatische Verteilung je Kapitel an/aus) · katzen_hide(k) · katzen_S.flags (gespeichert)
//   katzen_kater5(modus, opts): 'uebergabe' (Gisela gibt ihn, Luke trägt ihn kurz, dann folgt er) · 'folgen' · 'schwelle' {x,z,ry} (setzt sich, geht
//     nicht weiter) · 'tisch' {x,y,z} · 'zurueck' {x,z} (bleibt stehen, sieht zurück) · 'starren' {x,y,z} · 'schnurren' {an} · 'nr1' {x,z,ry, ecke:[x,y,z]}
//     · 'graukind' {x,z,ry} (Buckel, Fauchen ohne Ziel) · 'gitter' {x,z,ry, punkt:[x,y,z]} · 'vegas' {x,y,z,ry} · 'frei'
//   katzen_baerbelPapier(x, z) – AG-02: BÄRBEL leckt das Butterbrotpapier ab und setzt sich wieder vor die Hecke
//   katzen_kino(name, {x, z, bis, ab, dann, blick}) / katzen_kino(null) – Auftritt in einer Kinosequenz (kino.js, Abspann Kap. 1: BÄRBEL an Hildes Brille)
//   Blickziel Beobachter: beob_pos() aus beobachter.js (wenn vorhanden) → {x,y,z}; Testbetrieb: katzen_S.simBeob (Vector3).
const katzen_S = { ok: false, src: null, clips: null, sk: null, cats: [], byName: {}, regie: true, kapSeen: 0, flags: {}, kater: { mode: 'aus', o: {} },
  beob: new THREE.Vector3(), beobOk: false, beobPrev: new THREE.Vector3(), beobApp: 0, trail: [], ptrail: [], carry: null, still: 0, hissCd: 0, angst: [], tick: 0,
  simBeob: null, geo: null, nachRegie: [], U: { t: { value: 0 } }, prof: { n: 0, acc: 0, max: 0 } };
const katzen_V = [0, 1, 2, 3, 4, 5, 6, 7].map(() => new THREE.Vector3()), katzen_Q = [0, 1, 2, 3, 4].map(() => new THREE.Quaternion()), katzen_E = new THREE.Euler();
const katzen_AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const katzen_M4 = new THREE.Matrix4();
// Felle (lineare Farben). Muster pat: 0 Makrele (Querstreifen) · 1 klassisch (Wirbel an der Flanke, Rückenstreifen) · 2 Flecken · 3 fast einfarbig.
// base = Grundfarbe · stripe = Zeichnung · sa = Zeichnungsstärke · white = Anteil der weißen Partien der Vorlage (Socken, Latz, Schnauze) · allWhite = ganz weiß ·
// cal = Flecken (calA / calB) · orig = Hautfarbe der Vorlage (braun getigert) · dull = struppig · rough · det = Detailkontrast · len = Haarlänge 0–1 (Haarkarten schrumpfen zur Wurzel)
// point = Abzeichen (Siam: Gesicht, Ohren, Beine, Schwanz) · root = Wurzelfarbe der Haare (Smoke: heller Flaum) · rootK = deren Stärke · pink = Nase/Ballen/Innenohr · tint = Helligkeit/Farbstich · bart = Schnurrhaare
const katzen_c = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const KATZEN_FELLE = {
  rot_klassisch: { base: katzen_c(0xc2742f), stripe: katzen_c(0x7c3a14), sa: .8, pat: 1, white: .18, rough: .78, det: .75, len: .55, pink: katzen_c(0xd98a74), bart: [.95, .92, .85] },
  rot_makrele: { base: katzen_c(0xe0a35c), stripe: katzen_c(0xa8541f), sa: .7, pat: 0, white: .5, rough: .78, det: .75, len: .5, pink: katzen_c(0xe09a86), bart: [.97, .95, .9] },
  rot_weiss: { base: katzen_c(0xd0782f), stripe: katzen_c(0x8a4416), sa: .45, pat: 0, white: 1, rough: .78, det: .7, len: .5, pink: katzen_c(0xe0907c), bart: [.97, .95, .9] },
  schwarz_zart: { base: katzen_c(0x131110), stripe: katzen_c(0x0a0909), sa: .25, pat: 3, white: .55, whiteCol: katzen_c(0xd9d4c8), rough: .6, det: .6, len: .35, pink: katzen_c(0x6a4a46), root: katzen_c(0x2a2220), rootK: .35, bart: [.9, .88, .82] },
  schwarz_alt: { base: katzen_c(0x171412), stripe: katzen_c(0x0a0908), sa: .3, pat: 0, white: 0, rough: .66, det: .6, len: .45, dull: .3, pink: katzen_c(0x4a3636), root: katzen_c(0x4a423c), rootK: .5, bart: [.78, .76, .72] },
  schwarzweiss: { base: katzen_c(0x100e0d), stripe: katzen_c(0x080707), sa: .2, pat: 3, white: 1, rough: .66, det: .6, len: .4, pink: katzen_c(0xd98a80), bart: [.95, .93, .88] },
  kuh: { base: katzen_c(0xe6e1d6), stripe: katzen_c(0xe6e1d6), sa: 0, pat: 3, white: 1, cal: 1, calA: katzen_c(0x141211), calB: katzen_c(0x141211), rough: .72, det: .6, len: .4, pink: katzen_c(0xdc948a), bart: [.97, .96, .92] },
  grau_klassisch: { base: katzen_c(0x8a867e), stripe: katzen_c(0x2a2724), sa: .9, pat: 1, white: .2, rough: .78, det: .8, len: .6, pink: katzen_c(0x9a7a74), bart: [.9, .9, .88] },
  grau_flecken: { base: katzen_c(0x8f8a80), stripe: katzen_c(0x35312c), sa: .9, pat: 2, white: .35, rough: .74, det: .8, len: .3, pink: katzen_c(0xb08882), bart: [.93, .92, .9] },
  smoke: { base: katzen_c(0x4a4a4c), stripe: katzen_c(0x2a2a2c), sa: .3, pat: 3, white: .1, rough: .66, det: .7, len: .85, root: katzen_c(0xcfd0d2), rootK: .9, pink: katzen_c(0x6c5656), bart: [.88, .88, .9] },
  blau: { base: katzen_c(0x5f6670), stripe: katzen_c(0x4a5058), sa: .25, pat: 3, white: 0, rough: .6, det: .5, len: .32, pink: katzen_c(0x6e5c60), tint: [1.04, 1.04, 1.06], bart: [.88, .9, .94] },
  siam: { base: katzen_c(0xe8dcc6), stripe: katzen_c(0xcdbb9e), sa: .3, pat: 3, white: 0, point: katzen_c(0x3a2a22), pt: 1, rough: .7, det: .5, len: .3, pink: katzen_c(0x5a403c), bart: [.95, .93, .88] },
  schildpatt: { base: katzen_c(0x14110f), stripe: katzen_c(0x0a0908), sa: .3, pat: 3, white: 0, cal: 1, calA: katzen_c(0xc0662a), calB: katzen_c(0x14110f), rough: .72, det: .75, len: .5, pink: katzen_c(0xb07a6e), bart: [.88, .84, .78] },
  dreifarbig: { base: katzen_c(0xdcd6c8), stripe: katzen_c(0xdcd6c8), sa: 0, white: 1, cal: 1, calA: katzen_c(0xb4642a), calB: katzen_c(0x151210), pat: 3, rough: .76, det: .75, len: .45, pink: katzen_c(0xd9887a), bart: [.97, .95, .9] },
  weiss_fleck: { base: katzen_c(0xe8e4dc), stripe: katzen_c(0xe8e4dc), sa: 0, white: 1, allWhite: 1, spot: katzen_c(0x6f6c68), pat: 3, rough: .78, det: .55, len: .55, pink: katzen_c(0xe0a0a0), bart: [.98, .97, .95] },
  struppig: { base: katzen_c(0x5a564f), stripe: katzen_c(0x2c2925), sa: .35, pat: 0, white: .3, whiteCol: katzen_c(0x8a857a), dull: 1, mat: 1, rough: .94, det: 1.3, len: .3, pink: katzen_c(0x8a6a64), root: katzen_c(0x2a2622), rootK: .3, bart: [.7, .68, .62] },
  braun_getigert: { base: katzen_c(0x6b4a2c), stripe: katzen_c(0x2b1c10), sa: 0, orig: 1, white: .55, rough: .8, det: .5, len: .8, pink: katzen_c(0xa07060), bart: [.9, .86, .78] } };
// Alias der alten Namen (andere Module / gespeicherte Spiele)
Object.assign(KATZEN_FELLE, { rot: KATZEN_FELLE.rot_klassisch, schwarz: KATZEN_FELLE.schwarz_alt, grau_getigert: KATZEN_FELLE.grau_klassisch });
// Giselas Liste: Name · Fell · Größe · Körper · Halsband · Augen (Iris-Farbe, linear) · Pupille pup (0 Schlitz … 1 rund; runder = niedlicher) · Besonderheiten. Die meisten sind niedlich,
// wenige „Gruselkatzen“ (sparsam: KEINER, GRETE, FRITZ, LUNA, HÄNSCHEN): Narben (narben), trübe Augen (trueb), verklebtes/struppiges Fell, mager (duenn), gleißende Schlitzpupillen.
// bau [Breite, Höhe, Länge] ±: jede Katze hat eigene Proportionen · laenge überschreibt die Haarlänge des Fells · zeichnung/tint: kleine Abweichungen derselben Fellart
const KATZEN_LISTE = [
  { name: 'ANNI', fell: 'rot_klassisch', gr: 'L', dick: 1, bau: [1.05, 1, .98], band: 0xb08a1a, iris: [.9, .62, .16], pup: .5, laenge: .6 },
  { name: 'ZAYN', fell: 'schwarz_zart', gr: 'S', jung: 1, bau: [.96, 1.02, .96], band: 0x1f3f7a, iris: [.85, .8, .12], pup: .62, laenge: .35 },
  { name: 'GRETE', fell: 'schwarz_alt', gr: 'M', alt: 1, ohr: 'R', bau: [.98, .96, 1.04], band: 0x8a1c1c, iris: [.5, .78, .2], pup: .14, trueb: [.9, 0], narben: ['nase', 'wange'], laenge: .45 },
  { name: 'KEINER', fell: 'struppig', gr: 'M', duenn: 1, bau: [.94, 1, 1.05], band: 0x3a3a3a, iris: [.7, .78, .28], pup: .08, trueb: [0, .75], narben: ['flanke'], laenge: .3 },
  { name: 'HÄNSCHEN', fell: 'braun_getigert', gr: 'L', schwer: 1, alt: 1, ohr: 'L', bau: [1.06, 1, 1.02], band: 0x5a3a22, iris: [.85, .55, .16], pup: .22, narben: ['auge'], laenge: .8 },
  { name: 'LUNA', fell: 'weiss_fleck', gr: 'S', fleck: 'kopf', bau: [.97, 1, .98], band: 0xc8c8c8, iris: [.36, .6, .9], pup: .12, trueb: .15, laenge: .55 },
  { name: 'PETER', fell: 'rot_makrele', gr: 'L', dick: 1, bau: [1.04, 1.02, 1], band: 0x2d5a2d, iris: [.88, .58, .15], pup: .55, laenge: .5 },
  { name: 'LISBETH', fell: 'schildpatt', gr: 'M', alt: 1, bau: [1.02, .98, 1.02], band: 0x6a2a5a, iris: [.9, .72, .16], pup: .4, laenge: .55 },
  { name: 'FRITZ', fell: 'grau_klassisch', gr: 'L', alt: 1, bau: [1.03, 1.02, 1.04], band: 0x8a1c1c, iris: [.62, .78, .2], pup: .2, narben: ['auge'], laenge: .6 },
  { name: 'MARIE', fell: 'dreifarbig', gr: 'S', alt: 1, bau: [1, .98, .96], band: 0x1f3f7a, iris: [.88, .66, .14], pup: .46, laenge: .45 },
  { name: 'JAKOB', fell: 'smoke', gr: 'M', alt: 1, weiss: .5, bau: [1.02, 1, 1.02], band: 0xb08a1a, iris: [.6, .8, .22], pup: .35, laenge: .85 },
  { name: 'KATHRIN', fell: 'schwarzweiss', gr: 'M', alt: 1, bau: [1, 1, 1], band: 0x2d5a2d, iris: [.82, .72, .14], pup: .45, laenge: .4 },
  { name: 'VEIT', fell: 'rot_weiss', gr: 'M', alt: 1, bau: [1, 1.02, .98], band: 0x1f3f7a, iris: [.9, .6, .16], pup: .42, laenge: .5 },
  { name: 'BÄRBEL', fell: 'kuh', gr: 'M', alt: 1, bau: [1.03, .98, 1], band: 0x8a1c1c, iris: [.55, .8, .2], pup: .5, laenge: .4 },
  { name: 'ROXY', fell: 'grau_flecken', gr: 'S', jung: 1, bau: [.94, 1.03, 1.04], band: 0xa04070, iris: [.55, .85, .22], pup: .6, laenge: .3 },
  { name: 'MIKE', fell: 'blau', gr: 'S', jung: 1, bau: [1.02, .98, .98], band: 0xb08a1a, iris: [.45, .85, .25], pup: .58, laenge: .32 },
  { name: 'LUCY', fell: 'siam', gr: 'S', jung: 1, bau: [.95, 1.04, 1.02], band: 0x1f7a6a, iris: [.28, .55, 1.0], pup: .55, laenge: .3 }];
const KATZEN_GR = { S: .86, M: 1, L: 1.12 };
// Rastlage (Ruhelage des Modells in m): Halsband, Augen, Ohrspitzen – aus den Knochen des Modells (katzen_rest)
const KATZEN_STATIC = new Set(['sit', 'loaf', 'sleep', 'stand', 'hiss', 'crouch', 'carry', 'leap']), KATZEN_OB = ['spine1', 'neck2', 'head', 'jaw', 'earL', 'earR', 'tail1', 'tail2', 'tail3', 'tail4'];
const KATZEN_WALK = .85; // m/s bei timeScale 1 (gemessen: Fußgeschwindigkeit im Stand des Gehzyklus)

// ---------------------------------------------------------------- Laden
WORLD_MODS.push(['Katzen', async () => {
  const S = katzen_S;
  try { S.sk = (await import('three/addons/utils/SkeletonUtils.js')).clone; S.src = await msModel('katze', 'model.glb'); } catch (e) { console.warn('katzen: Modell fehlt', e); return; }
  S.clips = {}; for (const c of S.src.animations || []) S.clips[c.name] = c;
  S.root = new THREE.Group(); S.root.name = 'katzen'; S.root.userData.noCol = true; scene.add(S.root);
  katzen_rest(); try { await document.fonts.load('40px Caveat'); } catch (e) {}
  for (const d of KATZEN_LISTE) katzen_make(d);
  // Luke trägt eine Katze: Rennen und Springen/Klettern sperren (vor dem Spiel-Listener abfangen)
  addEventListener('keydown', e => { if (!S.carry) return; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') { keys[e.code] = false; e.stopImmediatePropagation(); } }, true);
  window.__katzen = katzen_debug();
  S.ok = true;
}]);
WORLD_TICK.push((dt, t, indoor) => { if (katzen_S.ok) katzen_tick(dt, t, indoor); });
MOD_SAVE.push(['katzen', () => ({ flags: katzen_S.flags, kater: katzen_S.kater.mode }), v => { if (!v) return; katzen_S.flags = v.flags && typeof v.flags === 'object' ? v.flags : {}; if (typeof v.kater === 'string') katzen_S.kater.mode = v.kater === 'folgen' || v.kater === 'aus' ? v.kater : 'aus'; }]);

// Ruhelage-Punkte aus dem Skelett des Modells
function katzen_rest() {
  const S = katzen_S, v0 = new THREE.Vector3(); let sk = null; S.src.traverse(o => { if (o.isSkinnedMesh && o.name === 'fell') sk = o.skeleton; });
  const piv = n => { const i = sk.bones.findIndex(b => b.name === n); return i < 0 ? new THREE.Vector3() : new THREE.Vector3().setFromMatrixPosition(katzen_M4.copy(sk.boneInverses[i]).invert()); };
  const neck = piv('neck'), neck2 = piv('neck2'), head = piv('head'), eL = piv('earL'), eR = piv('earR');
  const n = neck2.clone().sub(neck).normalize(), c = neck.clone().lerp(neck2, .45);
  S.R = { neck, neck2, head, colC: c, colN: n, earL: eL, earR: eR, spine2: piv('spine2'), eyeL: [0, 0, 0], eyeR: [0, 0, 0] };
  // Gesichtsachsen in Bind-Lage: Kopfdrehung in der Stand-Pose (Modellraum) zurückrechnen – die Bind-Lage des Modells ist nicht die Ruhelage
  const bones = {}; S.src.traverse(o => { if (o.isBone) bones[o.name] = o; }); const mx = new THREE.AnimationMixer(S.src); mx.clipAction(S.clips.stand).play(); mx.setTime(0);
  const hq = new THREE.Quaternion(); for (const b of ['hips', 'spine1', 'spine2', 'chest', 'neck', 'neck2', 'head']) hq.multiply(bones[b].quaternion); const hqi = hq.clone().invert(); mx.stopAllAction(); mx.uncacheRoot(S.src);
  S.R.fwd = new THREE.Vector3(0, -.12, 1).normalize().applyQuaternion(hqi); S.R.up = new THREE.Vector3(0, 1, 0).applyQuaternion(hqi);
  let eg = null; S.src.traverse(o => { if (o.isSkinnedMesh && o.name === 'augen') eg = o.geometry; });
  const ec = new THREE.Vector3(); if (eg) { const E = eg.attributes.position; for (let i = 0; i < E.count; i++) ec.add(v0.fromBufferAttribute(E, i)); ec.divideScalar(E.count); } else ec.copy(head).addScaledVector(S.R.fwd, .04);
  if (eg) { const A = eg.attributes.position, q = [[0, 0, 0, 0], [0, 0, 0, 0]]; for (let i = 0; i < A.count; i++) { const sd = A.getX(i) > 0 ? 0 : 1; q[sd][0] += A.getX(i); q[sd][1] += A.getY(i); q[sd][2] += A.getZ(i); q[sd][3]++; } S.R.eyeL = [q[0][0] / q[0][3], q[0][1] / q[0][3], q[0][2] / q[0][3]]; S.R.eyeR = [q[1][0] / q[1][3], q[1][1] / q[1][3], q[1][2] / q[1][3]]; }
  S.R.eyeC = ec; S.R.spot = head.clone().addScaledVector(S.R.up, .042).addScaledVector(S.R.fwd, .012);
  // Kehle: tiefster Punkt des Halsbands (für das Namensschild)
  let geo = null, fsk = null; S.src.traverse(o => { if (o.isSkinnedMesh && o.name === 'fell') { geo = o.geometry; fsk = o.skeleton; } });
  // Eingerissenes Ohr: Punkt am Außenrand des Ohrs (Bind-Lage)
  S.R.notch = {}; for (const side of ['L', 'R']) { const bi = fsk.bones.findIndex(b => b.name === 'ear' + side), piv = side === 'L' ? eL : eR, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight, Pp = geo.attributes.position, ear = [];
    for (let i = 0; i < Pp.count; i++) for (let j = 0; j < 4; j++) if (SI.getComponent(i, j) === bi && SW.getComponent(i, j) > .5) { ear.push(new THREE.Vector3().fromBufferAttribute(Pp, i)); break; }
    let tip = 0; for (const e of ear) tip = Math.max(tip, e.distanceTo(piv)); let best = null, bs = -1; for (const e of ear) { const dd = e.distanceTo(piv) / (tip || 1); if (dd < .55 || dd > .85) continue; const o = Math.abs(e.x - head.x); if (o > bs) { bs = o; best = e; } }
    S.R.notch[side] = best ? [best.x, best.y, best.z, .0065] : [0, 0, 0, 0]; }
  const P = geo.attributes.position, v = v0, up = new THREE.Vector3(0, 1, 0).addScaledVector(n, -n.y).normalize(); let best = null, bs = 1e9;
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).sub(c); const along = v.dot(n); if (Math.abs(along) > .004) continue; const r = v.clone().addScaledVector(n, -along); if (r.length() > .07) continue; const s = r.dot(up); if (s < bs) { bs = s; best = v.clone().add(c); } }
  { const fp = new Float32Array(P.count * 3); for (let i = 0; i < P.count; i++) { fp[i * 3] = P.getX(i); fp[i * 3 + 1] = P.getY(i); fp[i * 3 + 2] = P.getZ(i); } S.R.fellP = fp; } S.R.fellI = geo.index ? geo.index.array : null; S.R.throat = best || c.clone().addScaledVector(up, -.03);
  S.R.throatN = S.R.throat.clone().sub(c).addScaledVector(n, -S.R.throat.clone().sub(c).dot(n)).normalize();
}

// ---------------------------------------------------------------- Material: Fell im Shader
// Eine Farbfunktion für Haut UND Haarkarten (gleiche Zeichnung: Muster hängt am Wurzelpunkt im Ruhezustand, vKR). vKT: Lage entlang der Haarkarte (0 Wurzel … 1 Spitze; Haut = 1).
const KATZEN_GLSL = `
uniform vec3 kBase, kStripe, kWhiteCol, kCalA, kCalB, kSpotCol, kColCol, kColC, kColN, kRootC, kPink, kTint, kPoint; uniform vec3 kSc[12]; uniform vec4 kSpot, kNotch;
uniform float kSA, kWhite, kAllWhite, kCal, kOrig, kDull, kDet, kSeed, kColOn, kColW, kTuch, kPat, kPt, kMat, kScarW, kRootK;
varying vec3 vKR; varying float vKT;
float kH(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float kN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
  return mix(mix(mix(kH(i), kH(i + vec3(1,0,0)), f.x), mix(kH(i + vec3(0,1,0)), kH(i + vec3(1,1,0)), f.x), f.y), mix(mix(kH(i + vec3(0,0,1)), kH(i + vec3(1,0,1)), f.x), mix(kH(i + vec3(0,1,1)), kH(i + vec3(1,1,1)), f.x), f.y), f.z); }
float kSeg(vec3 p, vec3 a, vec3 b){ vec3 ab = b - a; float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-8), 0., 1.); return length(p - a - ab * t); }
float katzenNarbe(){ if (kScarW <= 0.) return 0.; float d = 1.; for (int i = 0; i < 3; i++) for (int j = 0; j < 3; j++) d = min(d, kSeg(vKR, kSc[i * 4 + j], kSc[i * 4 + j + 1])); d += (kN(vKR * 300. + kSeed) - .5) * .0016; return 1. - smoothstep(kScarW * .5, kScarW, d); }
vec3 katzenFarbe(vec3 tex, vec4 m){
  float det = clamp(m.r * 2., .25, 1.9), W = m.g, pink = m.b; vec3 p = vKR * 30.;
  float n1 = kN(p * 1.7 + kSeed), n2 = kN(p * .7 + kSeed * 2.3);
  float leg = smoothstep(.15, .09, vKR.y), tail = smoothstep(-.2, -.25, vKR.z);
  float rings = sin(vKR.y * 140. + n1 * 2.2), tr = sin(vKR.z * 150. + vKR.y * 60. + n1 * 2.), st;
  if (kPat < .5) { float bands = sin(vKR.z * 105. + n1 * 2.6 + vKR.y * 24.); float band = mix(mix(bands, rings, leg), tr, tail); st = smoothstep(.15, .8, band * .5 + .5 + (n2 - .5) * .6); }
  else if (kPat < 1.5) { vec2 c = vec2(vKR.z - .02, vKR.y - .2); float sw = sin(length(vec2(c.x * .9, c.y * 1.4)) * 82. + n1 * 3.4 + abs(vKR.x) * 36.); float band = mix(mix(sw, rings, leg), tr, tail);
    float spine = (1. - smoothstep(.004, .016, abs(vKR.x))) * smoothstep(.17, .24, vKR.y); st = max(smoothstep(.25, .9, band * .5 + .5 + (n2 - .5) * .5), spine * .9); }
  else if (kPat < 2.5) { float sp = kN(p * 1.2 + kSeed * 1.7); st = smoothstep(.6, .66, sp) * (1. - .35 * smoothstep(.72, .8, sp)); st = max(st, leg * smoothstep(.2, .9, rings * .5 + .5) * .7); st = max(st, tail * smoothstep(.3, .9, tr * .5 + .5)); }
  else st = smoothstep(.55, .95, n2) * .4;
  vec3 fur = mix(kBase, kStripe, st * kSA);
  float cp = kN(p * .33 + kSeed * 3.1) * .7 + kN(p * .9 + kSeed) * .3;
  fur = mix(fur, kCalA, kCal * smoothstep(.56, .6, cp)); fur = mix(fur, kCalB, kCal * smoothstep(.4, .36, cp));
  fur = mix(fur, tex, kOrig);
  float pt = max(max(smoothstep(.15, .09, vKR.y), smoothstep(-.17, -.24, vKR.z)), smoothstep(.17, .21, vKR.z) * smoothstep(.15, .2, vKR.y)) + (n1 - .5) * .25; fur = mix(fur, kPoint, kPt * clamp(pt, 0., 1.));
  fur *= mix(1., det, kDet);
  fur *= kTint;
  vec3 wc = kWhiteCol * (.82 + .22 * det);
  fur = mix(fur, wc, clamp(W * kWhite + kAllWhite * (1. - pink), 0., 1.) * (kCal > .5 ? smoothstep(.36, .4, cp) * smoothstep(.6, .56, cp) + W : 1.));
  float sd = distance(vKR, kSpot.xyz) + (n1 - .5) * .014; float sw2 = max(kSpot.w, .0001); fur = mix(fur, kSpotCol * (.8 + .25 * det), step(.0001, kSpot.w) * smoothstep(sw2, sw2 * .6, sd));
  fur = mix(fur, kPink, pink * .85);
  fur *= 1. - kDull * .32 * smoothstep(.45, .75, kN(p * 2.4 + 7.));
  fur *= 1. - kMat * .5 * smoothstep(.42, .66, kN(p * 3.3 + 11.)); // verklebte Strähnen: dunkle, fettige Partien
  // Haarkarten: Tiefe (Wurzel dunkler) und Wurzelfarbe (Smoke: helle Unterwolle)
  float rt = 1. - smoothstep(0., .7, vKT); fur = mix(fur, kRootC, kRootK * rt); fur *= mix(.82, 1., smoothstep(0., .55, vKT));
  float sc = katzenNarbe(); fur = mix(fur, mix(fur, vec3(.62, .5, .47), .6) + kPink * .1, sc);
  vec3 q = vKR - kColC; float al = dot(q, kColN); float rr = length(q - kColN * al);
  float cb = kColOn * step(abs(al), kColW) * step(rr, .062);
  vec3 cc = kColCol * (.75 + .35 * kN(p * 7.)); if (kTuch > .5) cc *= .7 + .3 * step(.5, fract((vKR.x + vKR.y) * 180.));
  fur = mix(fur, cc, cb);
  return fur;
}`;
// Narben als Strecken im Ruhezustand (glTF-Koordinaten: +x links, +y oben, +z nach vorn); Anker aus den Knochen und Augen des Modells (katzen_rest)
function katzen_narben(namen) {
  const R = katzen_S.R, A = v => Array.isArray(v) ? v : [v.x, v.y, v.z], s = [], pu = (A, B, cen) => { const q = [A, B]; q.cen = cen; s.push(q); }, far = [9, 9, 9], sd = Math.random() < .5 ? 1 : -1, eye = A(sd > 0 ? R.eyeL : R.eyeR), head = A(R.head), sp2 = A(R.spine2), up = [0, 1, 0], fw = [0, 0, 1], add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  for (const n of namen || []) {
    if (n === 'auge') { const c = add(add(eye, fw, -.004), [sd * .002, 0, 0]); pu(add(c, up, .034), add(add(c, up, -.016), [sd * .008, 0, .002]), head); }
    else if (n === 'nase') { const c = add(add(head, fw, .05), up, .006); pu(add(c, [1, 0, 0], .026 * sd), add(add(c, [1, 0, 0], -.014 * sd), up, -.014), head); }
    else if (n === 'wange') { const c = add(add(head, fw, .026), up, -.016), x = sd * .036; pu([x, c[1] + .014, c[2] - .004], [x, c[1] - .02, c[2] + .016], head); }
    else if (n === 'flanke') { const c = sp2, x = sd * .066; for (let i = 0; i < 3; i++) pu([x, c[1] - .01, c[2] + .05 - i * .014], [x, c[1] - .085, c[2] + .02 - i * .014], [0, c[1] - .05, c[2]]); } }
  // jede Narbe = Linienzug aus 4 Punkten, die auf die Haut gelegt werden: Punkt der Sehne nach außen schieben und den nächsten Hautpunkt nehmen (folgt der Krümmung)
  const P = R.fellP, I = R.fellI, hit = (o, dr) => { let bt = 1e9; for (let t = 0; t < I.length; t += 3) { const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3, e1 = [P[b] - P[a], P[b + 1] - P[a + 1], P[b + 2] - P[a + 2]], e2 = [P[c] - P[a], P[c + 1] - P[a + 1], P[c + 2] - P[a + 2]],
      h = [dr[1] * e2[2] - dr[2] * e2[1], dr[2] * e2[0] - dr[0] * e2[2], dr[0] * e2[1] - dr[1] * e2[0]], det = e1[0] * h[0] + e1[1] * h[1] + e1[2] * h[2]; if (Math.abs(det) < 1e-12) continue; const f = 1 / det, sv = [o[0] - P[a], o[1] - P[a + 1], o[2] - P[a + 2]], u = f * (sv[0] * h[0] + sv[1] * h[1] + sv[2] * h[2]); if (u < 0 || u > 1) continue;
      const qv = [sv[1] * e1[2] - sv[2] * e1[1], sv[2] * e1[0] - sv[0] * e1[2], sv[0] * e1[1] - sv[1] * e1[0]], v = f * (dr[0] * qv[0] + dr[1] * qv[1] + dr[2] * qv[2]); if (v < 0 || u + v > 1) continue; const tt = f * (e2[0] * qv[0] + e2[1] * qv[1] + e2[2] * qv[2]); if (tt > 0 && tt < bt) bt = tt; }
    return bt < 1e8 ? [o[0] + dr[0] * bt, o[1] + dr[1] * bt, o[2] + dr[2] * bt] : null; };
  const nn = (p, o, l) => { const org = [p[0] + o[0] / l * .06, p[1] + o[1] / l * .06, p[2] + o[2] / l * .06], h = hit(org, [-o[0] / l, -o[1] / l, -o[2] / l]); return h || p; };
  const out = [], far4 = [far, far, far, far];
  for (const q of s.slice(0, 3)) { const cen = q.cen, pts = []; for (let i = 0; i < 4; i++) { const t = i / 3, p = [q[0][0] + (q[1][0] - q[0][0]) * t, q[0][1] + (q[1][1] - q[0][1]) * t, q[0][2] + (q[1][2] - q[0][2]) * t], o = [p[0] - cen[0], p[1] - cen[1], p[2] - cen[2]], l = Math.hypot(...o) || 1; pts.push(nn(p, o, l)); } out.push(pts); }
  while (out.length < 3) out.push(far4); return out.flat();
}
const V3k = a => new THREE.Vector3(...(a || [0, 0, 0]));
function katzen_fellMat(src, d) {
  const F = KATZEN_FELLE[d.fell] || KATZEN_FELLE.grau_klassisch, R = katzen_S.R;
  const m = src.clone(); m.metalnessMap = null; m.metalness = 0; m.roughness = F.rough; m.color.setRGB(1, 1, 1); m.name = 'katzen_fell_' + d.name;
  const notch = d.ohr ? R.notch[d.ohr] : [0, 0, 0, 0], sc = katzen_narben(d.narben), j = () => 1 + (Math.random() - .5) * .1, ti = F.tint || [1, 1, 1];
  const u = m.userData.ku = { kBase: { value: V3k(F.base) }, kStripe: { value: V3k(F.stripe) }, kWhiteCol: { value: V3k(F.whiteCol || [.86, .84, .8]) }, kCalA: { value: V3k(F.calA) }, kCalB: { value: V3k(F.calB) },
    kSpotCol: { value: V3k(F.spot) }, kSpot: { value: d.fleck && F.spot ? new THREE.Vector4(R.spot.x, R.spot.y, R.spot.z, .03) : new THREE.Vector4(0, 0, 0, 0) /* Vector4() hat w = 1 → Fleck-Radius 1 m = ganzer Körper in Fleckfarbe */ }, kNotch: { value: new THREE.Vector4(...notch) },
    kSA: { value: F.sa || 0 }, kWhite: { value: d.weiss != null ? d.weiss : F.white || 0 }, kAllWhite: { value: F.allWhite || 0 }, kCal: { value: F.cal || 0 }, kOrig: { value: F.orig || 0 }, kPat: { value: F.pat || 0 },
    kDull: { value: (F.dull || 0) + (d.alt ? .25 : 0) }, kDet: { value: F.det || .7 }, kSeed: { value: Math.random() * 40 }, kColOn: { value: 1 }, kColW: { value: d.tuch ? .012 : .0048 }, kTuch: { value: d.tuch ? 1 : 0 },
    kColCol: { value: new THREE.Color(d.band || 0x5a3a22) }, kColC: { value: R.colC.clone() }, kColN: { value: R.colN.clone() },
    kRootC: { value: V3k(F.root || F.base) }, kRootK: { value: F.rootK || 0 }, kPink: { value: V3k(F.pink || [.5, .22, .22]) }, kTint: { value: new THREE.Vector3(ti[0] * j(), ti[1] * j(), ti[2] * j()) }, kPoint: { value: V3k(F.point) }, kPt: { value: F.pt || 0 }, kMat: { value: F.mat || 0 },
    kSc: { value: sc.map(V3k) }, kScarW: { value: d.narben && d.narben.length ? .0017 : 0 } };
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vKR; varying float vKT;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vKR = position; vKT = 1.;');
    sh.fragmentShader = KATZEN_GLSL + '\n' + sh.fragmentShader
      .replace('#include <map_fragment>', '#include <map_fragment>\n vec4 kM = texture2D(roughnessMap, vRoughnessMapUv);\n if (kNotch.w > 0. && distance(vKR, kNotch.xyz) < kNotch.w) discard;\n diffuseColor.rgb = katzenFarbe(diffuseColor.rgb, kM);')
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness * (.92 + .16 * clamp(1. - kM.r, 0., 1.));'); };
  m.customProgramCacheKey = () => 'katzen_fell_2'; return m;
}
// Haarkarten (Netz `haar`, aus tools/katzen_fell.mjs): gleiche Farbfunktion wie die Haut (Maske und Hautfarbe über die Haut-UV TEXCOORD_1, Muster über den Wurzelpunkt _root),
// Länge je Katze (kLen: Karte schrumpft zur Wurzel), Ränder der Karte laufen aus (_card), Narben schneiden das Fell weg. EIN zusätzliches Programm für alle Katzen (Cache-Schlüssel),
// die Uniforms der Haut werden geteilt (Umfärben wirkt auf beide).
function katzen_hairMat(src, d, fm) {
  const m = src.clone(); m.name = 'katzen_haar_' + d.name; m.color.setRGB(1, 1, 1); m.metalness = 0; m.roughness = .88; m.side = THREE.DoubleSide; m.alphaTest = .32; m.transparent = false; m.normalMap = null;
  const fu = fm.userData.ku, F = KATZEN_FELLE[d.fell] || KATZEN_FELLE.grau_klassisch;
  const u = Object.assign({}, fu, { kColOn: { value: 0 }, kLen: { value: d.laenge != null ? d.laenge : F.len != null ? F.len : .5 }, kMask: { value: fm.roughnessMap }, kSkin: { value: fm.map } }); m.userData.ku = u;
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vKR; varying vec2 vKUv, vKC; varying float vKT; attribute vec3 _root; attribute vec2 uv1, _card; uniform float kLen;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = _root + (position - _root) * kLen; vKR = _root; vKUv = uv1; vKC = _card; vKT = _card.y;');
    sh.fragmentShader = 'uniform sampler2D kMask, kSkin; varying vec2 vKUv, vKC;\n' + KATZEN_GLSL + '\n' + sh.fragmentShader
      .replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n normal *= faceDirection;') // Karten von beiden Seiten gleich beleuchten (Haut-Normale)
      .replace('#include <map_fragment>', '#include <map_fragment>\n vec4 kM = texture2D(kMask, vKUv); float kLum = clamp(dot(diffuseColor.rgb, vec3(.333)) * 1.9, 0., 1.4);\n diffuseColor.rgb = katzenFarbe(texture2D(kSkin, vKUv).rgb, kM) * (.62 + .7 * kLum);\n diffuseColor.a *= mix(1., smoothstep(0., .28, vKC.x) * smoothstep(0., .28, 1. - vKC.x), .92);\n if (kScarW > 0. && katzenNarbe() > .4) discard;\n if (kMat > .5) diffuseColor.a *= step(.38, kN(vKR * 120. + vec3(vKC.x * 3., 0., 0.) + kSeed));'); };
  m.customProgramCacheKey = () => 'katzen_haar_2'; return m;
}
// Augen: Iris im Shader (Fasern, heller Kragen um die Pupille, dunkler Limbusring), senkrechte Schlitzpupille (kPup: 0 Schlitz … 1 rund), kein Weiß der Lederhaut (Katzen zeigen keins),
// Tapetum: glimmt über Emission in der Irisfarbe, wenn die Lampe trifft (katzen_eyes). Trübe Augen (kTrub) für die Gruselkatzen: milchig-blaugrau, Pupille verwaschen.
const KATZEN_EYE_GLSL = `
uniform vec3 kIris; uniform vec2 kTrub; uniform float kPup, kESeed; varying float kSide;
float eH(vec2 p){ p = fract(p * vec2(.1031, .1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
float eN(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(eH(i), eH(i + vec2(1,0)), f.x), mix(eH(i + vec2(0,1)), eH(i + vec2(1,1)), f.x), f.y); }
vec3 katzenAuge(vec2 uv, out float glow){
  vec2 e = uv - .5; float r = length(e), an = atan(e.y, e.x);
  float pw = mix(.034, .105, kPup), ph = mix(.215, .13, kPup * kPup);
  float pd = length(vec2(e.x / pw, e.y / ph)); float pupil = 1. - smoothstep(.86, 1.02, pd);
  float fib = eN(vec2(an * 9., r * 14. + kESeed)) * .6 + eN(vec2(an * 23., r * 30. + kESeed * 2.)) * .4;
  float collar = smoothstep(.06, .17, r);
  vec3 col = mix(kIris * 1.0, kIris * .5, collar) * (.7 + .55 * fib);
  col = mix(col, kIris * vec3(.5, .7, .45) * .55, smoothstep(.2, .3, r) * .6);
  float limb = smoothstep(.27, .36, r); col = mix(col, vec3(.02, .015, .012), limb * .85);
  col = mix(col, vec3(.045, .03, .025), smoothstep(.34, .42, r));
  col = mix(col, vec3(.005), pupil);
  float tr = mix(kTrub.y, kTrub.x, kSide); float milk = tr * (.55 + .4 * eN(uv * 18. + kESeed)); col = mix(col, vec3(.52, .6, .62) * (.8 + .3 * eN(uv * 40.)), milk * (1. - smoothstep(.34, .44, r) * .5));
  glow = (1. - pupil) * (1. - limb * .8) * (.55 + .6 * fib) * (1. - tr * .85);
  return col;
}`;
function katzen_eyeMat(src, d) { const m = src.clone(); m.name = 'katzen_auge_' + d.name; m.color.setRGB(1, 1, 1); m.roughness = .05; m.metalness = 0; m.emissiveMap = null;
  const I = d.iris || [1, .85, .4], tr = d.trueb != null ? (Array.isArray(d.trueb) ? d.trueb : [d.trueb, d.trueb]) : [0, 0];
  m.emissive = new THREE.Color(Math.min(1, I[0] * 1.1), Math.min(1, I[1] * 1.1), Math.min(1, I[2] * 1.1)); m.emissiveIntensity = 0;
  const u = m.userData.ku = { kIris: { value: new THREE.Vector3(I[0], I[1], I[2]) }, kPup: { value: d.pup != null ? d.pup : .3 }, kTrub: { value: new THREE.Vector2(tr[0], tr[1]) }, kESeed: { value: Math.random() * 30 } };
  m.onBeforeCompile = sh => { Object.assign(sh.uniforms, u); sh.vertexShader = 'varying float kSide;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n kSide = position.x > 0. ? 1. : 0.;'); sh.fragmentShader = KATZEN_EYE_GLSL + '\n' + sh.fragmentShader
    .replace('#include <map_fragment>', 'float kGlow = 0.; diffuseColor.rgb = katzenAuge(vMapUv, kGlow);')
    .replace('#include <emissivemap_fragment>', 'totalEmissiveRadiance *= kGlow;'); };
  m.customProgramCacheKey = () => 'katzen_auge_1'; return m; }
// Namensschild (Filzstift auf hellem Leder)
function katzen_tagTex(name, band) { const c = document.createElement('canvas'); c.width = 192; c.height = 64; const x = c.getContext('2d');
  const col = new THREE.Color(band || 0x5a3a22); x.fillStyle = '#' + col.getHexString(); x.fillRect(0, 0, 192, 64);
  x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * 192, Math.random() * 64, 1 + Math.random() * 3, 1);
  x.fillStyle = '#d9d0bb'; x.beginPath(); x.moveTo(26, 8); x.lineTo(166, 8); x.quadraticCurveTo(178, 32, 166, 56); x.lineTo(26, 56); x.quadraticCurveTo(14, 32, 26, 8); x.fill();
  x.fillStyle = 'rgba(90,70,40,.25)'; for (let i = 0; i < 60; i++) x.fillRect(20 + Math.random() * 150, 10 + Math.random() * 44, 1, 1);
  x.fillStyle = '#b8b2a0'; x.beginPath(); x.arc(32, 32, 4, 0, 7); x.fill();
  x.fillStyle = '#16141a'; x.font = `${name.length > 7 ? 30 : 36}px Caveat, cursive`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name, 100, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

// ---------------------------------------------------------------- Eine Katze bauen
function katzen_make(d) {
  const S = katzen_S, m = S.sk(S.src); const g = new THREE.Group(); g.name = 'katze_' + d.name; g.userData.noCol = true; g.add(m); S.root.add(g);
  const k = { name: d.name, d, g, m, B: {}, A: {}, cur: null, curK: '', mx: new THREE.AnimationMixer(m), on: false, st: 'aus', t: 0, x: 0, z: 0, y: 0, gy: 0, ry: 0, sp: 0, tsp: 0,
    tx: 0, tz: 0, ty: null, then: 'sit', lauf: false, stare: null, heim: null, streunen: false, zahm: true, lichtscheu: false, perch: 0, jump: null, look: { y: 0, p: 0, gy: 0, gp: 0, has: false, pend: new THREE.Vector3(), pendT: 0, goal: new THREE.Vector3(), lastSet: new THREE.Vector3(1e9, 0, 0) },
    ear: { t: rand(1, 5), k: 0, side: 1, flat: 0 }, tail: { ph: rand(0, 6), amp: .12, flick: 0 }, breath: rand(0, 6), blinkT: rand(2, 6), blink: 0, hissT: 0, hissDir: null, purr: null, shine: 0,
    acc: 0, lod: 0, far: true, idleT: rand(3, 9), gyT: 0, freeT: 0, arm: null, klick: null, avoid: null, avoidT: 0, sniff: 0, lastLit: 0, curioT: rand(20, 60), follow: false, tripT: 0, thrT: 0, noHiss: false };
  m.traverse(o => { if (o.isBone) k.B[o.name] = o; });
  const del = []; let haarM = null, bartM = null; m.traverse(o => { if (!o.isMesh) return; if (o.name === 'haar') { haarM = o; return; } if (o.name === 'bart') { bartM = o; return; }
    o.frustumCulled = true; o.castShadow = o.name === 'fell'; o.receiveShadow = true;
    if (o.name === 'fell') { o.material = katzen_fellMat(o.material, d); k.fell = o; }
    else if (o.name === 'augen') { o.material = katzen_eyeMat(o.material, d); k.eyeM = o.material; k.eyeMesh = o; o.castShadow = false; }
    else if (o.name === 'zaehne') { k.teeth = o; o.visible = false; o.castShadow = false; }
    if (o.geometry) { o.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .2, 0), .55); } });
  del.forEach(o => o.parent.remove(o));
  if (haarM) { if (k.fell && haarM.geometry.attributes._root) { haarM.material = katzen_hairMat(haarM.material, d, k.fell.material); haarM.castShadow = false; haarM.receiveShadow = true; haarM.frustumCulled = true; haarM.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .2, 0), .55); k.haar = haarM; } else haarM.parent.remove(haarM); }
  if (bartM) { const F = KATZEN_FELLE[d.fell] || {}; bartM.material = bartM.material.clone(); bartM.material.color.setRGB(...(F.bart || [.92, .9, .84])); bartM.material.emissive = bartM.material.color.clone().multiplyScalar(.28); bartM.castShadow = false; bartM.receiveShadow = false; bartM.frustumCulled = true; bartM.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, .2, 0), .55); k.bart = bartM; }
  for (const n of ['walk', 'stand', 'sit', 'groom', 'loaf', 'sleep', 'hiss', 'crouch', 'leap', 'carry']) if (S.clips[n]) { const a = k.mx.clipAction(S.clips[n]); a.setLoop(THREE.LoopRepeat, Infinity); k.A[n] = a; }
  // Körperbau: dick / dünn / schwer (Knochen-Skalierung bleibt, die Animation setzt nur Lage und Drehung)
  const sc = (n, x, y, z) => { if (k.B[n]) k.B[n].scale.set(x, y, z); };
  if (d.dick) { sc('belly', 1.3, 1.18, 1.1); sc('spine2', 1.12, 1.04, 1); sc('hips', 1.08, 1, 1); }
  if (d.schwer) { sc('belly', 1.18, 1.1, 1.05); sc('spine2', 1.06, 1.02, 1); }
  if (d.duenn) { sc('spine1', .86, .96, 1); sc('hips', .9, 1, 1); sc('belly', .8, .85, 1); }
  k.bellyS = k.B.belly ? k.B.belly.scale.clone() : new THREE.Vector3(1, 1, 1);
  const size = typeof d.gr === 'number' ? d.gr : KATZEN_GR[d.gr] || 1; k.size = size * (d.jung ? .96 : 1); k.bau = d.bau || [1, 1, 1]; g.scale.set(k.size * k.bau[0], k.size * k.bau[1], k.size * k.bau[2]);
  // Augenreflex (Textur der eyePairs): eine Karte vor den Augen, folgt dem Kopf – zeigt in dieselbe Richtung wie der Kopf
  const R = S.R, head = k.B.head;
  if (head && typeof eyeTex !== 'undefined') { const em = new THREE.MeshBasicMaterial({ map: eyeTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color: new THREE.Color(.8, 1, .5).multiplyScalar(1.4), toneMapped: false });
    const e = new THREE.Mesh(new THREE.PlaneGeometry(.068, .034), em); e.position.copy(R.eyeC).sub(R.head).addScaledVector(R.fwd, .014); const yA = R.up.clone().addScaledVector(R.fwd, -R.up.dot(R.fwd)).normalize(); e.quaternion.setFromRotationMatrix(katzen_M4.makeBasis(new THREE.Vector3().crossVectors(yA, R.fwd), yA, R.fwd)); e.renderOrder = 5; e.frustumCulled = false; head.add(e); k.eye = e; k.eyeMat = em; }
  // Namensschild an der Kehle (am Hals-Knochen)
  const nb = k.B.neck2 || k.B.neck; if (nb) { const tm = new THREE.MeshStandardMaterial({ map: katzen_tagTex(d.name, d.band), roughness: .7, transparent: true, alphaTest: .3, polygonOffset: true, polygonOffsetFactor: -2 });
    const tg = new THREE.Mesh(new THREE.PlaneGeometry(.03, .01), tm); const base = nb === k.B.neck2 ? R.neck2 : R.neck; tg.position.copy(R.throat).sub(base).addScaledVector(R.throatN, .0045);
    const zA = R.throatN.clone(), yA = R.colN.clone().addScaledVector(zA, -R.colN.dot(zA)).normalize(), xA = new THREE.Vector3().crossVectors(yA, zA); tg.quaternion.setFromRotationMatrix(katzen_M4.makeBasis(xA, yA, zA)); nb.add(tg); k.tag = tg; }
  k.ob = KATZEN_OB.map(n => k.B[n]).filter(Boolean); k.baseQ = k.ob.map(() => new THREE.Quaternion()); k.fadeT = 0; k.cached = false;
  k.play = (n, fade = .3, ts = 1) => { const a = k.A[n]; if (!a) return; a.timeScale = ts; if (a === k.cur) return; if (fade > 0) fade = Math.max(.25, fade); k.fadeT = fade + .1; a.reset().play(); if (k.cur) { a.crossFadeFrom(k.cur, fade, false); } k.cur = a; k.curK = n; };
  k.play('sit', 0); k.mx.update(rand(0, 1));
  try { auftritt_reg(g, { name: 'Katze_' + d.name, r: .6 }); } catch (e) {} g.visible = true; g.position.set(0, -500, 0); // beim Laden sichtbar (Shader werden vorab übersetzt), weit unten
  katzen_S.cats.push(k); katzen_S.byName[d.name] = k; return k;
}

// ---------------------------------------------------------------- Schnittstelle
function katzen_get(name) { return katzen_S.byName[String(name).toUpperCase()] || null; }
function katzen_spawn(o = {}) {
  const S = katzen_S; if (!S.ok) return null; let k = o.name ? katzen_get(o.name) : S.cats.find(c => !c.on); if (!k) return null;
  if (o.fell || o.groesse) { katzen_recolor(k, o.fell, o.groesse); }
  k.on = true; k.arm = null; k.stare = o.starrt ? new THREE.Vector3(...o.starrt) : null; k.heim = o.heim ? { x: o.heim[0], z: o.heim[1], r: o.heim[2] || 4 } : { x: o.x, z: o.z, r: 3.5 };
  k.streunen = !!o.streunen; k.zahm = o.zahm !== false; k.lichtscheu = !!o.lichtscheu; k.follow = !!o.folgt; k.noHiss = false; k.avoid = null;
  katzen_place(k, o.x, o.z, { y: o.y, ry: o.ry != null ? o.ry : o.starrt ? Math.atan2(o.starrt[0] - o.x, o.starrt[2] - o.z) : rand(0, 6.28), pose: o.pose || 'sit', sims: o.sims });
  return k;
}
function katzen_recolor(k, fell, gr) { if (fell && KATZEN_FELLE[fell]) { const F = KATZEN_FELLE[fell], u = k.fell.material.userData.ku, V = a => (a || [0, 0, 0]);
    u.kBase.value.set(...V(F.base)); u.kStripe.value.set(...V(F.stripe)); u.kSA.value = F.sa || 0; u.kWhite.value = F.white || 0; u.kAllWhite.value = F.allWhite || 0; u.kCal.value = F.cal || 0; u.kOrig.value = F.orig || 0; u.kPat.value = F.pat || 0;
    u.kDull.value = F.dull || 0; u.kDet.value = F.det || .7; u.kCalA.value.set(...V(F.calA)); u.kCalB.value.set(...V(F.calB)); u.kRootC.value.set(...V(F.root || F.base)); u.kRootK.value = F.rootK || 0; u.kPink.value.set(...V(F.pink || [.5, .22, .22]));
    u.kPoint.value.set(...V(F.point)); u.kPt.value = F.pt || 0; u.kMat.value = F.mat || 0; u.kTint.value.set(...(F.tint || [1, 1, 1])); k.fell.material.roughness = F.rough; if (k.haar) k.haar.material.userData.ku.kLen.value = F.len != null ? F.len : .5; }
  if (gr) { k.size = typeof gr === 'number' ? gr : KATZEN_GR[gr] || 1; k.g.scale.set(k.size * k.bau[0], k.size * k.bau[1], k.size * k.bau[2]); } }
function katzen_place(k, x, z, o = {}) {
  k.x = x; k.z = z; k.ry = o.ry != null ? o.ry : k.ry; let y = o.y;
  if (y == null) { y = katzen_ground(x, z, .3); if (o.sims) { const top = katzen_perchY(x, z, 2.2); if (top > .25) { y = top; k.perch = top; } } }
  k.y = k.gy = y; k.perch = y > .3 ? y : 0; k.st = o.pose || 'sit'; k.t = rand(4, 12); k.sp = 0; k.jump = null;
  k.g.position.set(x, y, z); k.g.rotation.y = k.ry; k.play(k.st === 'stand' ? 'stand' : k.st, 0); k.g.visible = true; }
function katzen_hide(k) { k.on = false; k.st = 'aus'; k.g.visible = false; auftritt_wenn_weg(k.g, () => { if (!k.on) k.g.position.y = -500; }); /* 08.10.: erst nach dem Ausblenden wegsetzen */ if (k.klick) { uninteract(k.klick); k.klick.position.y = -50; } katzen_schnurren(k, false); if (katzen_S.carry === k) katzen_S.carry = null; }
function katzen_stare(k, p) { if (!k) return; k.stare = p ? (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])) : null; }
function katzen_goto(k, x, z, o = {}) { if (!k) return; k.tx = x; k.tz = z; k.ty = o.y != null ? o.y : null; k.lauf = !!o.lauf; k.frei = !!o.frei; k.then = o.dann || 'sit'; k.onArrive = o.fertig || null; if (k.st !== 'jump') { k.st = 'go'; } }
function katzen_jumpTo(k, x, y, z, dann = 'sit') { if (!k || !k.on) return; const d = Math.hypot(x - k.x, z - k.z);
  if (d > 1.2) { const a = Math.atan2(x - k.x, z - k.z); katzen_goto(k, x - Math.sin(a) * .55, z - Math.cos(a) * .55, { dann: 'jump', frei: true }); k.jTo = [x, y, z, dann]; return; }
  k.jTo = [x, y, z, dann]; katzen_jumpStart(k); }
function katzen_tragen(k) { if (!k) return; const S = katzen_S; if (S.carry && S.carry !== k) katzen_absetzen(S.carry); S.carry = k; k.st = 'carry'; k.arm = null; k.play('carry', .25); k.jump = null; keys.ShiftLeft = keys.ShiftRight = false;
  if (k.stare) katzen_fauch(k, k.stare, true); } // Beim Anheben: kurzes Fauchen in die Ecke, nicht auf Luke
function katzen_absetzen(k, x, z) { const S = katzen_S; if (!k) k = S.carry; if (!k) return; if (S.carry === k) S.carry = null;
  const f = flatDir(); const px = x != null ? x : player.pos.x + f.x * .7 - f.z * .25, pz = z != null ? z : player.pos.z + f.z * .7 + f.x * .25;
  katzen_place(k, px, pz, { ry: Math.atan2(f.x, f.z) + rand(-.8, .8), pose: 'stand' }); k.st = 'stand'; k.t = rand(.6, 1.4); k.stare = null; }
function katzen_arm(k, obj, off = [0, 0, 0]) { if (!k) return; k.arm = obj ? { obj, off: new THREE.Vector3(...off) } : null; if (obj) { k.st = 'arm'; k.play('carry', .3); } else { k.st = 'stand'; k.t = 1; } }
function katzen_klick(k, label, fn) { if (!k) return; if (!k.klick) { k.klick = new THREE.Mesh(new THREE.BoxGeometry(.3, .3, .5), hidden); k.klick.position.set(0, .2, 0); k.g.add(k.klick); } if (fn) interact(k.klick, label, () => fn(k)); else uninteract(k.klick); }
function katzen_regie(an) { katzen_S.regie = !!an; }
function katzen_schnurren(k, an) { // Schnurren: echte Aufnahme (Schleife, Wikimedia Commons, gemeinfrei), räumlich an der Katze
  if (!k) return; if (!an) { k.purrWant = false; if (k.purr) { try { k.purr.h.stop(1.2); } catch (e) {} try { Audio.frei(k.purr.d); } catch (e) {} k.purr = null; } return; }
  if (k.purr || !Audio.ctx || !Audio.started) return; k.purrWant = true;
  if (!Audio.buf.fx_katze_schnurr) { if (typeof klang_load === 'function') klang_load('fx_katze_schnurr').then(b => { if (b && k.purrWant && !k.purr) katzen_schnurren(k, true); }); return; } // erst beim ersten Bedarf geladen
  const p = k.g.position, d = Audio.at(p.x, p.y + .2, p.z, 1.2, { obj: k.g, h: .2, dauer: 1e9 }), h = Audio.loop('fx_katze_schnurr', { gain: .5, fadeIn: .8, dest: d }); if (!h) return;
  k.purr = { h, d }; if (Math.random() < .5) Audio.katze('miau', undefined, undefined, undefined, k.g, .6); }
// Fauchen (Regel 3): Körper und Kopf in seine Richtung, Buckel, Ohren flach, Maul auf – nie auf Luke. ziel = null → ohne Richtung (Graukind, Kap. 5)
function katzen_fauch(k, ziel, kurz = false) {
  if (!k || !k.on) return false; if (k.noHiss && !k.forceHiss) return false; if (katzen_in1(k.x, k.z) && k === katzen_get('HÄNSCHEN') && !k.forceHiss) return false; // in Nr. 1 faucht der Kater nie
  k.hissDir = ziel ? (ziel.isVector3 ? ziel.clone() : new THREE.Vector3(ziel[0], ziel[1], ziel[2])) : null; k.hissT = kurz ? 1.1 : rand(1.8, 2.6);
  if (k.st !== 'carry' && k.st !== 'arm') { k.stPrev = k.st === 'hiss' ? k.stPrev : k.st; k.st = 'hiss'; k.play('hiss', .12); if (k.hissDir) k.turnTo = Math.atan2(k.hissDir.x - k.x, k.hissDir.z - k.z); }
  if (k.teeth) k.teeth.visible = true; const p = k.g.position; try { leben_hiss(p.x, p.y + .2, p.z); } catch (e) {} return true; }
// Regel 5: Luna, Behaltene, brennende Nachbilder – alle Katzen im Umkreis (und im selben Raum) stehen auf und gehen
function katzen_angst(x, z, r = 8, sek = 20) { const S = katzen_S, rm = leben_inHouse(x, z, 0);
  S.angst.push({ x, z, r, t: sek }); for (const k of S.cats) { if (!k.on || k.st === 'carry' || k.st === 'arm') continue; const d = Math.hypot(k.x - x, k.z - z); if (d < r || (rm && leben_inHouse(k.x, k.z, 0) === rm)) katzen_leave(k, x, z, r); } }
function katzen_leave(k, x, z, r) { let best = null, bs = -1e9; for (let i = 0; i < 12; i++) { const a = Math.atan2(k.x - x, k.z - z) + rand(-1.1, 1.1), dd = r + rand(3, 7), px = x + Math.sin(a) * dd, pz = z + Math.cos(a) * dd;
    if (leben_inHouse(px, pz, .3) && !leben_inHouse(k.x, k.z, 0)) continue; const sc = Math.hypot(px - x, pz - z) - Math.hypot(px - k.x, pz - k.z) * .3 + (katzen_free(px, pz) ? 5 : 0); if (sc > bs) { bs = sc; best = [px, pz]; } }
  if (!best) return; k.stare = null; k.avoid = { x, z, r: r + 2 }; k.avoidT = 25; if (k.st === 'sit' || k.st === 'loaf' || k.st === 'sleep') { k.st = 'rise'; k.t = rand(.25, .5); k.play('stand', .35); k.leaveTo = best; } else katzen_goto(k, best[0], best[1], { lauf: true, dann: 'sit' }); }

// Kinosequenzen (kino.js): katzen_kino('baerbel', { x, z, bis: [x, z], ab: sek, dann: 'sitzen'|'liegen', blick: [x, y, z] }) · katzen_kino(null) = zurück
function katzen_kino(name, o = {}) { const S = katzen_S;
  if (!name) { const K = S.kino; S.kino = null; if (K && K.k) { if (K.prev) katzen_place(K.k, K.prev.x, K.prev.z, { y: K.prev.y, ry: K.prev.ry, pose: 'sit' }); else katzen_hide(K.k); K.k.stare = K.prev ? K.prev.stare : null; } return; }
  const k = katzen_get(name === 'baerbel' ? 'BÄRBEL' : name); if (!k) return; S.kino = { k, prev: k.on ? { x: k.x, z: k.z, y: k.y, ry: k.ry, stare: k.stare } : null };
  const ry = o.bis ? Math.atan2(o.bis[0] - o.x, o.bis[1] - o.z) : o.ry || 0; katzen_spawn({ name: k.name, x: o.x, z: o.z, ry, pose: 'stand', zahm: true }); k.stare = null;
  setTimeout(() => { if (S.kino && S.kino.k === k && o.bis) katzen_goto(k, o.bis[0], o.bis[1], { dann: 'sniff', frei: true, fertig: () => setTimeout(() => { if (S.kino && S.kino.k === k) { k.st = o.dann === 'liegen' ? 'loaf' : 'sit'; k.play(k.st, .6); k.t = 99; if (o.blick) katzen_stare(k, o.blick); } }, 1400) }); }, (o.ab || 0) * 1000); }
// AG-02 (lwo.js): BÄRBEL steht auf, geht zum Butterbrotpapier, leckt es gründlich ab und setzt sich wieder vor die Hecke („Behördenstulle“)
function katzen_baerbelPapier(x, z) { const k = katzen_get('BÄRBEL'); if (!k) return;
  if (!k.on) katzen_spawn({ name: 'BÄRBEL', x: x + 1.2, z: z + .4, pose: 'sit' });
  const back = { x: k.x, z: k.z, ry: k.ry, stare: k.stare ? k.stare.clone() : null }; k.stare = null; k.hold = null;
  const a = Math.atan2(k.x - x, k.z - z), px = x + Math.sin(a) * .2, pz = z + Math.cos(a) * .2;
  katzen_goto(k, px, pz, { frei: true, dann: 'sniff', fertig: () => { k.turnTo = Math.atan2(x - k.x, z - k.z); k.sniff = 1; k.lick = 4.5; k.t = 4.8;
    setTimeout(() => { if (!k.on) return; k.lick = 0; katzen_goto(k, back.x, back.z, { frei: true, dann: 'sit', fertig: () => { k.ry = back.ry; if (back.stare) katzen_stare(k, back.stare); } }); }, 5000); } }); }
// ---------------------------------------------------------------- Kater Hänschen (Kap. 5/6)
function katzen_kater5(modus, o = {}) {
  const S = katzen_S, k = katzen_get('HÄNSCHEN'); if (!k) return null; const K = S.kater; K.mode = modus; K.o = o; k.forceHiss = false;
  if (!k.on) { const f = flatDir(); katzen_spawn({ name: 'HÄNSCHEN', x: o.x != null ? o.x : player.pos.x + f.x * 2, z: o.z != null ? o.z : player.pos.z + f.z * 2, pose: 'sit' }); }
  k.tuch = true; k.fell.material.userData.ku.kTuch.value = 1; k.fell.material.userData.ku.kColW.value = .012; k.fell.material.userData.ku.kColCol.value.set(0x7a1818);
  switch (modus) {
    case 'uebergabe': katzen_tragen(k); k.stare = null; setTimeout(() => { if (S.kater.mode === 'uebergabe') { katzen_absetzen(k); k.st = 'sitFoot'; k.t = rand(2, 3.5); S.kater.mode = 'folgen'; } }, (o.sek || 6) * 1000); break;
    case 'folgen': k.stare = null; k.noHiss = false; if (k.st === 'carry') katzen_absetzen(k); k.st = 'stand'; k.t = .5; break;
    case 'schwelle': case 'nr1': case 'gitter': case 'vegas': k.stare = o.ecke || o.punkt ? new THREE.Vector3(...(o.ecke || o.punkt)) : null; if (k.st === 'carry') S.carry = null;
      if (Math.hypot(k.x - o.x, k.z - o.z) > 8 || !k.on) katzen_place(k, o.x, o.z, { y: o.y, ry: o.ry, pose: 'sit' }); else katzen_goto(k, o.x, o.z, { y: o.y, dann: 'sit' }); k.hold = { x: o.x, z: o.z, ry: o.ry != null ? o.ry : k.ry }; break;
    case 'tisch': katzen_jumpTo(k, o.x, o.y, o.z, 'sit'); break;
    case 'zurueck': k.back = { x: o.x, z: o.z, t: o.sek || 2.2 }; break;
    case 'starren': k.stare = o.x != null ? new THREE.Vector3(o.x, o.y || .3, o.z) : null; break;
    case 'schnurren': katzen_schnurren(k, o.an !== false); break;
    case 'graukind': k.hold = { x: o.x != null ? o.x : k.x, z: o.z != null ? o.z : k.z, ry: o.ry != null ? o.ry : k.ry }; katzen_place(k, k.hold.x, k.hold.z, { ry: k.hold.ry, pose: 'stand' }); k.forceHiss = true; katzen_fauch(k, null); k.hissT = o.sek || 3.2; break;
    case 'frei': k.hold = null; k.stare = null; K.mode = 'aus'; katzen_schnurren(k, false); k.st = 'stand'; k.t = 1; break;
  }
  return k;
}

// ---------------------------------------------------------------- Hilfen
function katzen_ground(x, z, yTop = .3) { try { const g = solidGround(x, yTop, z); if (g > -1 && g < yTop + .4) return Math.max(0, g); } catch (e) {} return 0; } // höchste feste Fläche in [yTop − 0,8; yTop + 0,37], sonst Boden 0
function katzen_perchY(x, z, yTop) { try { const y = leben_probe(x, z, yTop, .25, .6); return isFinite(y) ? y : 0; } catch (e) { return 0; } }
function katzen_free(x, z) { try { return leben_free(x, z, .26, .13) && !leben_inHouse(x, z, .2); } catch (e) { return true; } }
function katzen_in1(x, z) { return x > -56 && x < -44 && z > -22 && z < -12.1; }
function katzen_angDiff(a, b) { const d = b - a; return Math.atan2(Math.sin(d), Math.cos(d)); }
function katzen_ang(a, b, k) { let d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * Math.min(1, k); }
function katzen_zone() { try { return leben_zone() === 'town'; } catch (e) { return !state.inBasement; } }
function katzen_beobPos() { const S = katzen_S; if (S.simBeob) { S.beob.copy(S.simBeob); return true; }
  if (typeof beob_pos === 'function') { try { const p = beob_pos(); if (p && isFinite(p.x) && isFinite(p.z)) { S.beob.set(p.x, isFinite(p.y) ? p.y : 0, p.z); return true; } } catch (e) {} } return false; }

// ---------------------------------------------------------------- Regie: Verteilung je Kapitel (abschaltbar mit katzen_regie(false), z. B. durch kirchberg.js)
function katzen_auto(kp) {
  const S = katzen_S; for (const k of S.cats) if (k.on && k !== S.carry) katzen_hide(k);
  if (kp === 2 || kp >= 6) return; // Kap. 2 unter der Erde, Kap. 6 Kirchberg gesperrt (Kater nur über katzen_kater5)
  const G = [26, 51.2]; // Vorgarten Am Kirchberg 3 (Haus 15)
  const garten = (n, x, z, o = {}) => katzen_spawn({ name: n, x: G[0] + x, z: G[1] + z, heim: [G[0] + x * .5, G[1] + .6, 4.5], streunen: true, ...o });
  if (kp === 1) {
    katzen_spawn({ name: 'HÄNSCHEN', x: -47.6, z: -8.7, sims: true, starrt: [-49.6, .15, -9.7] });          // Mäuerchen vor Nr. 1, starrt in die Ecke neben dem Gartentor
    katzen_spawn({ name: 'BÄRBEL', x: 48.6, z: -7.1, starrt: [46.9, .5, -9.3] });                          // Bordstein unter der Laterne vor Nr. 9, starrt in die Hecke
    katzen_spawn({ name: 'PETER', x: 23.4, z: -6.6, heim: [23.4, -6.6, 3], streunen: true });              // vor Nr. 7
    katzen_spawn({ name: 'ANNI', x: 10.4, z: 52.4, sims: true, starrt: [10.2, .05, 53.6] });                // Bank der Bushaltestelle, sieht unter das Wartehäuschen
    katzen_spawn({ name: 'ZAYN', x: -54.4, z: 66.9, sims: true, starrt: [-56, .6, 76] });                   // oben auf dem Friedhofstor, sieht zur Kapellenmauer
    katzen_spawn({ name: 'GRETE', x: 34.6, z: 71.4, sims: true, starrt: [37.2, .4, 74.2] });                // Karussell, sieht zum Spielhaus
    katzen_spawn({ name: 'KEINER', x: -10.7, z: 53.3, sims: true, starrt: [-6.5, .05, 49.5] });             // Sockel des Sühnekreuzes, sieht die Straße hinunter
    // „Im Fenster sitzen drei Katzen wie Buchstützen“ (kirchberg.js, Klopfen): LUNA, LISBETH, MARIE sitzen auf der Fensterbank von Giselas Küchenfenster und sehen auf die Straße
    { const wx = 22.7, wz = 49.64; let sy = katzen_perchY(wx, wz, 1.7); if (!(sy > .85 && sy < 1.5)) sy = 1.08;
      [['LUNA', -.5, 0], ['LISBETH', 0, .12], ['MARIE', .5, -.1]].forEach(([n, dx, ry]) => { const k = katzen_spawn({ name: n, x: wx + dx, z: wz, y: sy, ry, pose: 'sit', starrt: [wx + dx + ry * 8, 1.05, wz + 7] }); if (k) { k.hold = { x: wx + dx, z: wz, ry }; k.perch = sy; k.zahm = true; } }); }
    garten('FRITZ', 3.1, -.6); garten('JAKOB', 2.2, 1.1, { pose: 'loaf' });
    garten('KATHRIN', -1.2, 1.3); garten('VEIT', 4.2, .9); garten('ROXY', 5.5, -.3); garten('MIKE', -5, -.2); garten('LUCY', .2, -1.1);
  } else {
    garten('HÄNSCHEN', -1.5, -.8, { pose: 'sleep' }); garten('LUNA', -2.4, -.4); garten('LISBETH', 1.2, .3, { pose: 'loaf' }); garten('FRITZ', 3.1, -.6); garten('MARIE', -3.6, .8, { pose: 'sleep' });
    garten('JAKOB', 2.2, 1.1, { pose: 'loaf' }); garten('KATHRIN', -1.2, 1.3); garten('VEIT', 4.2, .9); garten('BÄRBEL', -4.4, 1.6); garten('PETER', 5.4, 1.6, { pose: 'loaf' });
    katzen_spawn({ name: 'ROXY', x: 4, z: -4.5, heim: [2, -4, 9], streunen: true, zahm: false }); katzen_spawn({ name: 'MIKE', x: -18, z: 5.2, heim: [-16, 5, 9], streunen: true, zahm: false });
    katzen_spawn({ name: 'LUCY', x: 30, z: 5, heim: [30, 5, 8], streunen: true, zahm: false });
    if (kp === 3) { const z0 = 52.2; ['GRETE', 'KEINER', 'ZAYN', 'ANNI'].forEach((n, i) => katzen_spawn({ name: n, x: 22.2 + i * .75, z: z0, sims: true, starrt: [10, .6, 56.5] })); } // vier auf dem Zaun, starren hinter die Bushaltestelle
    else if (kp === 4) { katzen_spawn({ name: 'KEINER', x: 2.6, z: -2.4, starrt: [4.6, .1, -3.6] }); ['GRETE', 'ZAYN', 'ANNI'].forEach((n, i) => garten(n, -5 + i * 4.5, -1.4)); }
    else ['GRETE', 'KEINER', 'ZAYN', 'ANNI'].forEach((n, i) => garten(n, -5 + i * 4.5, -1.4));
    if (kp === 5 && S.kater.mode === 'aus') { katzen_hide(katzen_get('HÄNSCHEN')); katzen_spawn({ name: 'HÄNSCHEN', x: -50, z: -9.3, starrt: [-50, .8, -12.2] }); } // sitzt vor Nr. 1 und starrt die Tür an
  }
}

// ---------------------------------------------------------------- Takt
function katzen_tick(dt, t, indoor) {
  const S = katzen_S, t0 = performance.now(); S.tick++; S.U.t.value = t;
  if (!S.ready) { S.wait = (S.wait || 0) + dt; if (!(SOL.items.length || S.wait > 8)) return; S.ready = true; for (const k of S.cats) if (!k.on) { k.g.visible = false; } }
  const kp = typeof kap === 'function' ? kap() : 1;
  if (S.regie && state.started && kp !== S.kapSeen) { S.kapSeen = kp; katzen_auto(kp); for (const f of S.nachRegie) { try { f(kp); } catch (e) { console.warn('katzen: nachRegie', e); } } if (S.kater.mode === 'folgen' && (kp === 5)) katzen_kater5('folgen'); }
  const town = katzen_zone() && state.started, P = player.pos;
  // Beobachter
  S.beobOk = town && katzen_beobPos();
  if (S.beobOk) { const d = S.beob.distanceTo(P), dp = S.beobPrev.distanceTo(P); S.beobApp = S.beobApp * .9 + (dp - d) / Math.max(dt, .001) * .1; S.beobPrev.copy(S.beob);
    const tl = S.trail; if (!tl.length || Math.hypot(tl[tl.length - 1].x - S.beob.x, tl[tl.length - 1].z - S.beob.z) > .5) { const e = tl.length > 40 ? tl.shift() : new THREE.Vector3(); e.copy(S.beob); tl.push(e); } }
  // Lukes Spur (für den Kater)
  { const pt = S.ptrail; if (!pt.length || Math.hypot(pt[pt.length - 1].x - P.x, pt[pt.length - 1].z - P.z) > .45) { const e = pt.length > 60 ? pt.shift() : new THREE.Vector3(); e.set(P.x, P.y, P.z); pt.push(e); } }
  const spd = Math.hypot(vel.x, vel.z); S.still = spd < .2 ? S.still + dt : 0;
  // Regel 3: Fauchen – Beobachter nähert sich Luke von hinten (< 4 m); ab Kap. 3 bei stehendem Luke < 3 m
  S.hissCd -= dt;
  if (S.beobOk && S.hissCd < 0) { const dx = S.beob.x - P.x, dz = S.beob.z - P.z, d = Math.hypot(dx, dz), f = flatDir(), behind = (dx * f.x + dz * f.z) / (d || 1) < -.25;
    if ((d < 4 && behind && S.beobApp > .15) || (kp >= 3 && S.still > 2 && d < 3)) { let n = 0; for (const k of S.cats) { if (!k.on || k.far || n >= 2 || k.st === 'jump') continue; if (Math.hypot(k.x - P.x, k.z - P.z) > 16) continue; if (katzen_fauch(k, S.beob)) n++; } if (n) S.hissCd = rand(7, 11); } }
  // Regel 5 automatisch: das Graukind (stalker) ist sichtbar
  if (typeof stalker !== 'undefined' && stalker.visible) { S.stT = (S.stT || 0) - dt; if (S.stT < 0) { S.stT = 3; katzen_angst(stalker.position.x, stalker.position.z, 12, 20); } }
  for (let i = S.angst.length - 1; i >= 0; i--) { S.angst[i].t -= dt; if (S.angst[i].t < 0) S.angst.splice(i, 1); }
  // Katzen
  const cam = camera.position; camera.getWorldDirection(katzen_V[7]); const cf = katzen_V[7];
  const lampOn = flashOn && !state.blackout && flashlight.intensity > .5;
  for (const k of S.cats) {
    if (!k.on) continue;
    if (!town && k.st !== 'carry') { if (k.g.visible) k.g.visible = false; continue; }
    const dx = k.x - cam.x, dz = k.z - cam.z, d = Math.hypot(dx, dz), inFront = (dx * cf.x + dz * cf.z) > -2.5;
    const vis = d < 48 || k.st === 'carry'; if (k.g.visible !== vis) k.g.visible = vis; k.far = !vis; if (!vis && k.st !== 'go' && !k.hold && !(S.kater.mode === 'folgen' && k.name === 'HÄNSCHEN')) continue;
    // Nähe-Stufen: Augen-Mesh (< 8 m), Namensschild (< 4 m), Schattenwurf (< 12 m, Taschenlampe/Laternen) – sonst nur das Fell (ein Draw Call)
    const near = k.st === 'carry' || k.st === 'arm'; if (k.haar) k.haar.visible = near || d < 15; if (k.bart) k.bart.visible = near || d < 5; if (k.eyeMesh) k.eyeMesh.visible = near || d < 8; if (k.tag) k.tag.visible = near || d < 4; if (k.fell) k.fell.castShadow = !near && d < 12;
    k.lod = k.st === 'carry' ? 0 : d < 22 ? 0 : d < 36 ? 1 : 2;
    katzen_brain(k, dt, t, d, lampOn, kp);
    katzen_move(k, dt);
    // Animation nur in Sichtweite (weiter weg seltener), dann die Überlagerungen (Kopf, Ohren, Schwanz, Atmung)
    k.acc += dt; const step = k.lod === 0 ? 0 : k.lod === 1 ? .05 : .12;
    k.fadeT -= dt;
    if (vis && inFront && k.acc >= step) { // ruhende Pose (sitzen, liegen …) nach dem Überblenden: Mischer sparen, nur die überlagerten Knochen zurücksetzen
      const ob = k.ob; if (KATZEN_STATIC.has(k.curK) && k.fadeT <= 0 && k.cached) { for (let i = 0; i < ob.length; i++) ob[i].quaternion.copy(k.baseQ[i]); }
      else { k.mx.update(k.acc); const ol = k.ovLast; /* 10.10.: schrieb der Mixer den Knochen nicht neu, steht noch unsere letzte Ueberlagerung darin -> auf die gemerkte Mixer-Pose zurueck (sonst Kopf dreht sich Bild fuer Bild weiter) */ for (let i = 0; i < ob.length; i++) { const q = ob[i].quaternion; if (ol && ol[i] && k.cached && q.angleTo(ol[i]) < 1e-7) q.copy(k.baseQ[i]); else k.baseQ[i].copy(q); } k.cached = true; }
      k.acc = 0; if (k.lod < 2 && !(k.fadeT > 0)) { k.ovW = Math.min(1, (k.ovW || 0) + dt * 3.5); katzen_overlay(k, dt, t, d); const ol = k.ovLast || (k.ovLast = ob.map(() => new THREE.Quaternion())); for (let i = 0; i < ob.length; i++) { const q = ob[i].quaternion; if (k.ovW < 1) { const c0 = katzen_Q[0].copy(q); q.copy(k.baseQ[i]).slerp(c0, k.ovW); } const a = q.angleTo(k.baseQ[i]); if (a > 1.3) { const c0 = katzen_Q[0].copy(q); q.copy(k.baseQ[i]).slerp(c0, 1.3 / a); } /* 10.10.: Ueberlagerung nie > 75 Grad von der Mixer-Pose (Kopf-Kreisel) */ ol[i].copy(q); } } else { k.ovLast = null; if (k.fadeT > 0) k.ovW = 0; } }
    katzen_eyes(k, dt, d, lampOn, cam);
  }
  const ms = performance.now() - t0; S.prof.acc += ms; S.prof.n++; if (ms > S.prof.max) S.prof.max = ms;
}

// Verhalten: Zustände sitzen · liegen · schlafen · putzen · stehen · gehen · springen · starren · fauchen · weggehen · getragen · Kater folgt
function katzen_brain(k, dt, t, dCam, lampOn, kp) {
  const S = katzen_S, P = player.pos, dp = Math.hypot(k.x - P.x, k.z - P.z); k.t -= dt;
  if (k.avoidT > 0) { k.avoidT -= dt; if (k.avoidT <= 0) k.avoid = null; }
  switch (k.st) {
    case 'carry': { const f = flatDir(); // linke Hand, an der Kamera: bleibt unten links im Bild, auch beim Blick nach unten; Körper quer vor Luke
      katzen_V[4].set(-.24, -.36, -.62).applyQuaternion(camera.quaternion) /* AP-21: höher im Bild, die Ich-Hände (kapitel5.js) tragen ihn */.add(camera.position); k.x = katzen_V[4].x; k.y = katzen_V[4].y - .12; k.z = katzen_V[4].z; k.ry = Math.atan2(f.x, f.z) - 1.25; k.g.position.set(k.x, k.y, k.z); k.g.rotation.y = k.ry;
      if (k.hissT > 0) { k.hissT -= dt; if (k.teeth) k.teeth.visible = k.hissT > 0; } return; }
    case 'arm': if (k.arm) { const o = k.arm.obj; o.updateWorldMatrix(true, false); katzen_V[0].copy(k.arm.off).applyMatrix4(o.matrixWorld); k.x = katzen_V[0].x; k.y = katzen_V[0].y; k.z = katzen_V[0].z; k.g.position.copy(katzen_V[0]); o.getWorldQuaternion(katzen_Q[0]); katzen_E.setFromQuaternion(katzen_Q[0], 'YXZ'); k.ry = katzen_E.y + PI / 2; k.g.rotation.y = k.ry; } return;
    case 'hiss': k.hissT -= dt; if (k.turnTo != null) { k.ry = katzen_ang(k.ry, k.turnTo, dt * 7); }
      if (k.hissT <= 0) { if (k.teeth) k.teeth.visible = false; k.turnTo = null; k.hissDir = null; k.forceHiss = false; const back = k.stPrev || 'sit'; k.st = back === 'go' || back === 'jump' ? 'stand' : back; k.t = rand(1.5, 3); k.play(k.st === 'stand' ? 'stand' : k.st === 'stare' ? 'sit' : k.st, .5); } return;
    case 'rise': if (k.t < 0) { if (k.leaveTo) { katzen_goto(k, k.leaveTo[0], k.leaveTo[1], { lauf: true, dann: 'sit' }); k.leaveTo = null; } else { k.st = 'stand'; k.t = rand(.5, 1.5); } } return;
    case 'jump': return; // katzen_move führt den Bogen
  }
  // Kater: folgt Luke (Kap. 5) – auf dem Boden, 3 m Abstand, bleibt an Schwellen sitzen, sieht an Laternen zurück
  if (k === katzen_get('HÄNSCHEN') && S.kater.mode === 'folgen' && k.st !== 'go' && !k.hold) {
    if (k.back) { k.back.t -= dt; k.stare = katzen_V[6].set(k.back.x, .5, k.back.z); if (k.back.t < 0) { k.back = null; k.stare = null; } return; }
    const pt = S.ptrail; let tgt = null; for (let i = pt.length - 1; i >= 0; i--) if (Math.hypot(pt[i].x - P.x, pt[i].z - P.z) > 2.8) { tgt = pt[i]; break; }
    if (k.st === 'sitFoot') { if (k.t > 0 && dp < 1.5) return; k.st = 'stand'; }
    if (k.thrT > 0) { k.thrT -= dt; return; } // sitzt in einer Tür
    if (tgt && dp > 3.4) { const inNow = !!leben_inHouse(k.x, k.z, 0), inT = !!leben_inHouse(tgt.x, tgt.z, 0); if (inNow !== inT && Math.random() < .004) { k.thrT = rand(3, 7); k.st = 'sit'; k.play('sit', .4); return; }
      if (dp > 20 && (dCam > 12 || k.far)) { let back = null; for (let i = pt.length - 1; i >= 0; i--) { const dd = Math.hypot(pt[i].x - P.x, pt[i].z - P.z); if (dd > 5 && dd < 10) { back = pt[i]; break; } if (dd > 10) break; } if (!back) { const f = flatDir(); back = katzen_V[6].set(P.x - f.x * 5, 0, P.z - f.z * 5); } katzen_place(k, back.x, back.z, { pose: 'stand' }); }
      katzen_goto(k, tgt.x, tgt.z, { lauf: dp > 6, dann: 'stand' }); return; }
    if (k.st === 'stand' && k.t < 0) { k.st = 'sit'; k.play('sit', .5); k.t = rand(3, 8); } return;
  }
  if (k.hold && k.st !== 'go') { if (Math.hypot(k.x - k.hold.x, k.z - k.hold.z) > .4) { katzen_goto(k, k.hold.x, k.hold.z, { dann: 'sit' }); return; } k.ry = katzen_ang(k.ry, k.hold.ry, dt * 2); if (k.st !== 'sit' && k.st !== 'hiss') { k.st = 'sit'; k.play('sit', .5); } return; }
  // Regel 5: Ort meiden
  if (k.avoid && k.st !== 'go' && Math.hypot(k.x - k.avoid.x, k.z - k.avoid.z) < k.avoid.r) { katzen_leave(k, k.avoid.x, k.avoid.z, k.avoid.r); return; }
  // Luke: Abstand halten (zahm: nur wenn er rennt oder sehr nah kommt), neugierig, wenn er still steht
  if (k.st !== 'go' && !k.stare) { const run = Math.hypot(vel.x, vel.z) > 3.4;
    if ((!k.zahm && dp < 2.8) || (run && dp < 3.2) || dp < .75) { const a = Math.atan2(k.x - P.x, k.z - P.z) + rand(-.6, .6), r = rand(2.5, 4.5), x = k.x + Math.sin(a) * r, z = k.z + Math.cos(a) * r;
      if (katzen_free(x, z)) { if (k.perch > .3) katzen_jumpTo(k, x, katzen_ground(x, z), z, 'sit'); else { katzen_goto(k, x, z, { lauf: run || !k.zahm, dann: 'stand' }); } k.lookP = true; return; } }
    k.curioT -= dt; if (k.zahm && k.curioT < 0 && S.still > 3 && dp < 7 && dp > 1.6 && k.perch < .3 && !S.carry) { k.curioT = rand(40, 110); const a = Math.atan2(k.x - P.x, k.z - P.z), x = P.x + Math.sin(a) * .95, z = P.z + Math.cos(a) * .95; if (katzen_free(x, z)) { katzen_goto(k, x, z, { dann: 'sniff' }); return; } } }
  // Licht: lichtscheue Katzen gehen drei Schritte weg, wenn angeleuchtet
  if (k.lichtscheu && lampOn && dp < 9 && k.st !== 'go') { const f = leben_facing(k.x, k.y + .2, k.z); if (f > .97) { k.lastLit += dt; if (k.lastLit > .4) { k.lastLit = -3; const a = Math.atan2(k.x - P.x, k.z - P.z) + rand(-1, 1); katzen_goto(k, k.x + Math.sin(a) * .9, k.z + Math.cos(a) * .9, { dann: 'sit' }); return; } } }
  // Regel 2: nicht sitzende Katze folgt der Spur des Beobachters (2–3 m dahinter)
  if (S.beobOk && k.follow && k.st !== 'sit' && S.trail.length > 6) { const tl = S.trail, e = tl[Math.max(0, tl.length - 6)]; if (Math.hypot(e.x - k.x, e.z - k.z) > 2.5 && k.st !== 'go') { katzen_goto(k, e.x, e.z, { dann: 'sniff' }); return; } }
  // Leerlauf: sitzen, putzen, liegen, schlafen, strecken, ein paar Schritte, auf Mauern springen
  if (k.stare) { if (k.st !== 'sit' && k.st !== 'stand' && k.st !== 'go') { k.st = 'sit'; k.play('sit', .5); } return; }
  if (k.t > 0) return;
  switch (k.st) {
    case 'sniff': k.st = 'stand'; k.t = rand(.8, 2); return;
    case 'sit': { const r = Math.random();
      if (r < .22) { k.st = 'groom'; k.play('groom', .45, rand(.85, 1.1)); k.t = rand(3, 7); if (k.teeth) k.teeth.visible = false; }
      else if (r < .4 && !k.perch) { k.st = 'loaf'; k.play('loaf', .9); k.t = rand(15, 40); }
      else if (r < .75 && k.streunen) katzen_wander(k); else { k.t = rand(4, 10); } return; }
    case 'groom': k.st = 'sit'; k.play('sit', .45); k.t = rand(4, 10); return;
    case 'loaf': if (Math.random() < .45) { k.st = 'sleep'; k.play('sleep', 1.2); k.t = rand(20, 60); } else { k.st = 'sit'; k.play('sit', .8); k.t = rand(3, 8); } return;
    case 'sleep': k.st = 'loaf'; k.play('loaf', 1.2); k.t = rand(6, 15); return;
    case 'stand': if (k.streunen && Math.random() < .55) katzen_wander(k); else { k.st = 'sit'; k.play('sit', .5); k.t = rand(5, 12); } return;
  }
}
function katzen_wander(k) { const h = k.heim || { x: k.x, z: k.z, r: 3 };
  // Mauer, Fensterbank, Zaun in der Nähe? (wo glaubhaft: 0,4–1,6 m hoch, oben frei)
  if (Math.random() < .3) { for (let i = 0; i < 6; i++) { const a = rand(0, 6.28), r = rand(.8, 2.6), x = k.x + Math.sin(a) * r, z = k.z + Math.cos(a) * r; if (Math.hypot(x - h.x, z - h.z) > h.r + 1.5) continue;
      const y = katzen_perchY(x, z, 1.7); if (y > .38 && y < 1.65 && katzen_perchOk(x, y, z)) { katzen_jumpTo(k, x, y, z, Math.random() < .5 ? 'sit' : 'loaf'); return; } } }
  if (k.perch > .3) { for (let i = 0; i < 6; i++) { const a = rand(0, 6.28), r = rand(.6, 1.4), x = k.x + Math.sin(a) * r, z = k.z + Math.cos(a) * r; if (katzen_free(x, z)) { katzen_jumpTo(k, x, katzen_ground(x, z), z, 'stand'); return; } } k.t = rand(6, 12); return; }
  for (let i = 0; i < 8; i++) { const a = rand(0, 6.28), r = Math.sqrt(Math.random()) * h.r, x = h.x + Math.sin(a) * r, z = h.z + Math.cos(a) * r; if (Math.hypot(x - k.x, z - k.z) < .8 || !katzen_free(x, z)) continue;
    try { if (!leben_pathR(k.x, k.z, x, z, .18, .14)) continue; } catch (e) {} katzen_goto(k, x, z, { dann: Math.random() < .35 ? 'sniff' : 'sit' }); return; }
  k.t = rand(4, 8); }
function katzen_perchOk(x, y, z) { try { return leben_free(x, z, y + .22, .12); } catch (e) { return true; } }
function katzen_jumpStart(k) { const [x, y, z] = k.jTo; k.st = 'jump'; k.jump = { ph: 'crouch', t: 0, x0: k.x, y0: k.y, z0: k.z, x, y, z, dur: .32 + Math.hypot(x - k.x, z - k.z) * .12 + Math.abs(y - k.y) * .14, then: k.jTo[3] }; k.play('crouch', .18); k.turnTo = Math.atan2(x - k.x, z - k.z); }

// Bewegung: weiche Wege (Drehrate begrenzt, Tempo nach Kurve), Bodenhöhe, Sprungbogen; Gehzyklus passend zum Tempo (kein Gleiten)
function katzen_move(k, dt) {
  const S = katzen_S;
  if (k.st === 'jump' && k.jump) { const J = k.jump; J.t += dt; if (k.turnTo != null) k.ry = katzen_ang(k.ry, k.turnTo, dt * 10);
    if (J.ph === 'crouch') { if (J.t > .3) { J.ph = 'air'; J.t = 0; k.play('leap', .1); } }
    else if (J.ph === 'air') { const u = Math.min(1, J.t / J.dur), h = (.2 + Math.max(0, J.y - J.y0) * .4) * 4 * u * (1 - u); k.x = J.x0 + (J.x - J.x0) * u; k.z = J.z0 + (J.z - J.z0) * u; k.y = J.y0 + (J.y - J.y0) * u + h;
      if (u >= 1) { J.ph = 'land'; J.t = 0; k.y = J.y; k.play('crouch', .08); const p = k.g.position; try { Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain: .07, rate: 1.9, x: p.x, y: p.y, z: p.z, ref: 1.5 }); } catch (e) {} } }
    else if (J.t > .22) { k.jump = null; k.perch = J.y > .3 ? J.y : 0; k.gy = k.y; k.turnTo = null; const n = J.then === 'loaf' ? 'loaf' : J.then === 'stand' ? 'stand' : 'sit'; k.st = n; k.t = rand(3, 9); k.play(n, .35); }
    k.g.position.set(k.x, k.y, k.z); k.g.rotation.y = k.ry; return; }
  if (k.st === 'go') { const dx = k.tx - k.x, dz = k.tz - k.z, d = Math.hypot(dx, dz), want = Math.atan2(dx, dz);
    let diff = want - k.ry; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const vmax = (k.lauf ? 1.15 : .5) * k.size * (k.d.alt ? .85 : 1) * (k.d.dick ? .9 : 1), turnSlow = Math.max(.15, Math.cos(Math.min(1.5, Math.abs(diff))));
    k.tsp = d < .35 ? Math.max(.08, d) * vmax / .35 : vmax * turnSlow; k.sp += (k.tsp - k.sp) * Math.min(1, dt * 3.2);
    k.ry += Math.sign(diff) * Math.min(Math.abs(diff), dt * (k.lauf ? 4.2 : 2.6));
    const nx = k.x + Math.sin(k.ry) * k.sp * dt, nz = k.z + Math.cos(k.ry) * k.sp * dt;
    k.freeT -= dt; if (k.freeT < 0) { k.freeT = .25; k.blocked = !k.frei && !katzen_free(k.x + Math.sin(k.ry) * .28, k.z + Math.cos(k.ry) * .28) && !leben_inHouse(k.tx, k.tz, 0); }
    if (k.blocked && d > .6) { k.bT = (k.bT || 0) + dt; if (k.bT > .8) { k.bT = 0; k.st = 'stand'; k.t = rand(.5, 1.2); k.play('stand', .3); return; } } else { k.x = nx; k.z = nz; k.bT = 0; }
    k.gyT -= dt; if (k.gyT < 0) { k.gyT = .2; const g = k.ty != null && d < .5 ? k.ty : katzen_ground(k.x, k.z, k.y + .05); if (g - k.y > .24 && k.ty == null) { k.x -= Math.sin(k.ry) * .06; k.z -= Math.cos(k.ry) * .06; k.blocked = true; } else k.gy = g; } k.y += (k.gy - k.y) * Math.min(1, dt * 8); k.perch = 0;
    if (k.sp > .03) k.play('walk', .3, Math.max(.35, k.sp / (KATZEN_WALK * k.size))); else if (k.curK === 'walk') k.play('stand', .3);
    if (d < .12 || (d < .4 && k.sp < .1)) { k.sp = 0; const n = k.then; if (n === 'jump' && k.jTo) { katzen_jumpStart(k); } else { k.st = n === 'sniff' ? 'sniff' : n === 'sit' ? 'sit' : n === 'loaf' ? 'loaf' : 'stand'; k.t = n === 'sniff' ? rand(1.2, 2.6) : rand(2, 6); k.play(k.st === 'sniff' ? 'stand' : k.st, .45); k.sniff = n === 'sniff' ? 1 : 0; }
      if (k.onArrive) { const f = k.onArrive; k.onArrive = null; try { f(k); } catch (e) {} } }
  } else if (k.turnTo != null && k.st !== 'hiss') k.ry = katzen_ang(k.ry, k.turnTo, dt * 3);
  // Kopf zu weit gedreht → Körper nachdrehen, aber mit Schritten auf der Stelle (kein Drehen ohne Fußarbeit)
  if (k.st === 'sit' || k.st === 'stand') { const L = k.look; if (L.has && Math.abs(L.gy) > 1.25) { k.turnAcc = (k.turnAcc || 0) + dt; if (k.turnAcc > .8) { k.ry += Math.sign(L.gy) * Math.min(dt * 1.5, Math.abs(L.gy) - .6); } } else k.turnAcc = 0; }
  const yr = katzen_angDiff(k.ryPrev == null ? k.ry : k.ryPrev, k.ry) / Math.max(dt, .001); k.ryPrev = k.ry; k.yawRate = yr;
  if (k.st !== 'go' && k.st !== 'jump' && k.st !== 'carry' && k.st !== 'arm' && k.st !== 'hiss' && Math.abs(yr) > .35) { if (k.curK !== 'walk') { k.stepBack = k.curK; k.play('walk', .25, .5); } k.stepT = .35; }
  else if (k.stepT > 0) { k.stepT -= dt; if (k.stepT <= 0 && k.stepBack && k.curK === 'walk' && k.st !== 'go') { k.play(k.stepBack === 'walk' ? 'stand' : k.stepBack, .35); k.stepBack = null; } }
  k.g.position.set(k.x, k.y, k.z); k.g.rotation.y = k.ry;
}

// ---------------------------------------------------------------- Überlagerungen nach dem Mischer: Blick (0,5 s Verzögerung bei Sprüngen), Ohren, Schwanz, Atmung
function katzen_chainQ(k, names, out) { out.identity(); for (const n of names) { const b = k.B[n]; if (b) out.multiply(b.quaternion); } return out; }
function katzen_rotBone(k, b, parentQ, axis, ang) { if (!b || !ang) return; const R = katzen_Q[2].setFromAxisAngle(axis, ang), pi = katzen_Q[3].copy(parentQ).invert(); b.quaternion.premultiply(pi.multiply(R).multiply(parentQ)); }
const KATZEN_NECK = ['hips', 'spine1', 'spine2', 'chest', 'neck'], KATZEN_TAIL = ['hips'], KATZEN_HEAD = ['hips', 'spine1', 'spine2', 'chest', 'neck', 'neck2', 'head'];
function katzen_overlay(k, dt, t, dCam) {
  const S = katzen_S, L = k.look, P = player.pos;
  // Blickziel: fest (Skript/Spur) · Beobachter < 15 m (Regel 1) · Fauchziel · Luke, wenn nah und neugierig · sonst keines
  let tg = null; if (k.hissDir) tg = k.hissDir; else if (k.stare) tg = k.stare; else if (S.beobOk && k.st !== 'go' && k.st !== 'sleep' && Math.hypot(S.beob.x - k.x, S.beob.z - k.z) < 15) tg = S.beob;
  else if (k.st !== 'sleep' && Math.hypot(P.x - k.x, P.z - k.z) < 4.5) tg = katzen_V[5].set(P.x, P.y + 1.2, P.z);
  if (tg) { if (tg.distanceTo(L.lastSet) > .6) { L.lastSet.copy(tg); L.pend.copy(tg); L.pendT = L.has ? .5 : 0; } else L.pend.copy(tg); // Sprung → 0,5 s später
    if (L.pendT > 0) L.pendT -= dt; else { L.goal.copy(L.pend); L.has = true; } } else L.has = false;
  let wy = 0, wp = 0; if (L.has) { const hx = k.x + Math.sin(k.ry) * .2 * k.size, hz = k.z + Math.cos(k.ry) * .2 * k.size, hy = k.y + (k.st === 'sit' ? .3 : .24) * k.size;
    const dx = L.goal.x - hx, dz = L.goal.z - hz, dy = L.goal.y - hy; let a = Math.atan2(dx, dz) - k.ry; a = Math.atan2(Math.sin(a), Math.cos(a)); wy = Math.max(-1.45, Math.min(1.45, a)); wp = Math.max(-.6, Math.min(.5, Math.atan2(dy, Math.hypot(dx, dz)))); L.gy = a; }
  if (k.sniff > 0) { wp = -.55; } if (k.lick > 0) { k.lick -= dt; wp = -.62 + Math.sin(t * 9) * .08; if (k.teeth) k.teeth.visible = false; }
  // ohne Ziel: kurze Blicke in die Umgebung (Mikrobewegung), Kopf federt kritisch gedämpft mit leichtem Nachschwingen (Q-11)
  if (!L.has && k.sniff <= 0 && k.lick <= 0 && k.st !== 'sleep' && k.st !== 'go') { k.glT = (k.glT || 0) - dt; if (k.glT < 0) { k.glT = rand(1.8, 5.5); k.glY = Math.random() < .3 ? 0 : rand(-.75, .75); k.glP = rand(-.18, .12); } wy = k.glY || 0; wp = k.glP || 0; }
  const w = L.has ? 11 : 6, z = .72, ddt = Math.min(dt, .05); L.vy = (L.vy || 0) + (w * w * (wy - L.y) - 2 * z * w * (L.vy || 0)) * ddt; L.y += L.vy * ddt; L.vp = (L.vp || 0) + (w * w * (wp - L.p) - 2 * z * w * (L.vp || 0)) * ddt; L.p += L.vp * ddt;
  // Gewichtsverlagerung im Stand/Sitz: langsames Wiegen der Wirbelsäule
  if (k.st === 'sit' || k.st === 'stand' || k.st === 'sniff') { k.sway = (k.sway || rand(0, 6)) + dt * .9; const hq0 = katzen_Q[1].copy(k.B.hips.quaternion); katzen_rotBone(k, k.B.spine1, hq0, katzen_AX.z, Math.sin(k.sway) * .03); }
  const pq = katzen_chainQ(k, KATZEN_NECK, katzen_Q[0]);
  if (Math.abs(L.y) > .001 || Math.abs(L.p) > .001) { katzen_rotBone(k, k.B.neck2, pq, katzen_AX.y, L.y * .42); const pq2 = pq.multiply(k.B.neck2.quaternion);
    const R = katzen_Q[4].setFromAxisAngle(katzen_AX.y, L.y * .58).multiply(katzen_Q[2].setFromAxisAngle(katzen_AX.x, -L.p)), pi = katzen_Q[3].copy(pq2).invert(); k.B.head.quaternion.premultiply(pi.multiply(R).multiply(pq2)); }
  // Ohren: nach vorn beim Starren, zucken im Leerlauf (zufällig, auf Geräusche), flach beim Fauchen (Pose)
  const E = k.ear; E.t -= dt; if (E.t < 0) { E.t = k.stare || L.has ? rand(4, 9) : rand(1.5, 6); E.k = 1; E.side = Math.random() < .5 ? 1 : -1; }
  if (E.k > 0) E.k = Math.max(0, E.k - dt * 5); const tw = Math.sin(E.k * PI) * .5;
  if (tw > .01 && k.st !== 'hiss') { const hq = katzen_chainQ(k, KATZEN_HEAD, katzen_Q[1]); if (E.side > 0) katzen_rotBone(k, k.B.earL, hq, katzen_AX.z, -tw); else katzen_rotBone(k, k.B.earR, hq, katzen_AX.z, tw); }
  // Schwanz: wandernde Welle; beim Starren zuckt die Spitze; beim Gehen höher und ruhiger
  const T = k.tail, stare = !!(k.stare || L.has); T.ph += dt * (stare ? 5.5 : k.st === 'go' ? 3 : 1.6); const amp = k.st === 'hiss' || k.st === 'carry' ? 0 : k.st === 'sleep' ? .03 : stare ? .22 : k.st === 'go' ? .14 : .1;
  // Feder-Pendel: Drehung und Tempowechsel des Körpers schwingen im Schwanz nach (Trägheit), darüber die eigene Welle
  { const ddt = Math.min(dt, .05), acc = ((k.sp || 0) - (T.spPrev || 0)) / Math.max(dt, .001); T.spPrev = k.sp || 0;
    const ty = -(k.yawRate || 0) * .28, tp = Math.max(-.5, Math.min(.5, -acc * .35)); T.v = (T.v || 0) + (38 * (ty - (T.s || 0)) - 4.2 * (T.v || 0)) * ddt; T.s = (T.s || 0) + T.v * ddt; T.vp = (T.vp || 0) + (30 * (tp - (T.p || 0)) - 3.6 * (T.vp || 0)) * ddt; T.p = (T.p || 0) + T.vp * ddt; }
  if (amp > 0 || Math.abs(T.s) > .002 || Math.abs(T.p) > .002) { const s = k.st === 'carry' ? 0 : 1, tq = katzen_chainQ(k, KATZEN_TAIL, katzen_Q[1]); katzen_rotBone(k, k.B.tail1, tq, katzen_AX.x, T.p * .5 * s); tq.multiply(k.B.tail1.quaternion);
    katzen_rotBone(k, k.B.tail2, tq, katzen_AX.y, (Math.sin(T.ph) * amp * .5 + T.s * .5) * s); tq.multiply(k.B.tail2.quaternion);
    katzen_rotBone(k, k.B.tail3, tq, katzen_AX.y, (Math.sin(T.ph - .8) * amp + T.s * .8) * s); tq.multiply(k.B.tail3.quaternion); katzen_rotBone(k, k.B.tail4, tq, katzen_AX.y, (Math.sin(T.ph - 1.6) * amp * 1.5 + T.s) * s); }
  // Atmung (Bauch), im Schlaf langsamer und tiefer
  k.breath += dt * (k.st === 'sleep' ? 2.6 : k.st === 'go' ? 7 : 4.2); const br = 1 + Math.sin(k.breath) * (k.st === 'sleep' ? .05 : .025); if (k.B.belly) k.B.belly.scale.set(k.bellyS.x * br, k.bellyS.y * br, k.bellyS.z);
  if (k.sniff > 0) k.sniff = Math.max(0, k.sniff - dt * (k.lick > 0 ? 0 : .5));
  if (k.lick > 0 && k.B.jaw) { const jq = katzen_chainQ(k, KATZEN_HEAD, katzen_Q[1]); katzen_rotBone(k, k.B.jaw, jq, katzen_AX.x, Math.max(0, Math.sin(t * 9)) * .22); } // Lecken: Maul auf/zu im Takt
}

// ---------------------------------------------------------------- Augen (Regel 4): Reflex, wenn die Lampe trifft; im Dunkeln schwach – das Einzige, was man sieht
function katzen_eyes(k, dt, d, lampOn, cam) {
  if (!k.eye) return; const P = katzen_V[1]; k.eye.getWorldPosition(P); const tx = cam.x - P.x, ty = cam.y - P.y, tz = cam.z - P.z, l = Math.hypot(tx, ty, tz) || 1;
  k.eye.getWorldDirection(katzen_V[2]); const face = (katzen_V[2].x * tx + katzen_V[2].y * ty + katzen_V[2].z * tz) / l; const f = Math.max(0, Math.min(1, (face - .35) / .5));
  let lit = 0; if (lampOn && d < 30) { camera.getWorldDirection(katzen_V[3]); const c = -(katzen_V[3].x * tx + katzen_V[3].y * ty + katzen_V[3].z * tz) / l; lit = Math.max(0, Math.min(1, (c - .86) / .1)) * Math.min(1, 26 / (d + 2)); }
  const dark = state.blackout || !lampOn ? .22 : .06; // ohne Lampe glimmen sie schwach (Mond, Laternen)
  // Blinzeln nur im Leerlauf – wer starrt, blinzelt nicht (Regel 1)
  k.blinkT -= dt; if (k.blinkT < 0) { k.blinkT = rand(3, 9); if (!k.stare && !k.look.has) k.blink = .16; } if (k.blink > 0) k.blink -= dt;
  const sleep = k.st === 'sleep' ? 0 : 1, target = (lit * 1.25 + dark) * f * sleep * (k.blink > 0 ? 0 : 1);
  k.shine += (target - k.shine) * Math.min(1, dt * 10); k.eyeMat.opacity = Math.min(1, k.shine); k.eye.visible = k.shine > .01;
  const s = 1 + Math.max(0, d - 6) * .07; k.eye.scale.set(Math.min(2.6, s), Math.min(2.6, s) * (k.blink > 0 ? .15 : 1), 1);
  if (k.eyeM) k.eyeM.emissiveIntensity = lit * f * 1.6 + .05; }

// ---------------------------------------------------------------- Testzugriff (Selbsttests; im Veröffentlichungsbau entfernt)
function katzen_debug() { return { S: katzen_S, spawn: katzen_spawn, get: katzen_get, place: katzen_place, stare: katzen_stare, goto: katzen_goto, jump: katzen_jumpTo, fauch: katzen_fauch, angst: katzen_angst,
  tragen: katzen_tragen, absetzen: katzen_absetzen, kater5: katzen_kater5, kino: katzen_kino, papier: katzen_baerbelPapier, py: katzen_perchY, auto: katzen_auto, regie: katzen_regie, hide: katzen_hide, beob: v => { katzen_S.simBeob = v ? new THREE.Vector3(v[0], v[1], v[2]) : null; } }; }
