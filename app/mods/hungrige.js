// =====================================================================  DER HUNGRIGE (Modul „hungrige“): der Gestaltwandler in den Forbidden Dustwoods
// Kanon (story_final.md, „Der Hungrige“): In der Zyklusnacht 1992 holte Bergungstrupp 3 etwas aus der Senke, das sich hinstellte wie ein Hirsch.
// Es frisst den Nachhall – die Abdrücke, die das Licht hinterlässt (Lukes Erinnerungen) – und trägt die Tiere, die es gefressen hat, als Haut. Falsch:
// der Kopf sitzt nie richtig. Es lernt Stimmen aus den Abdrücken (Lucy, Seiler, Hofer) und kam 1992 mit Hofers Gesicht zurück. Es hasst Licht, und es
// fürchtet den Raben, der zu Mira gehört.
// Ablauf (jede Begegnung nur einmal, wird gespeichert): erst Tiere, die nicht stimmen (Reh rückwärts, Krähe mit Lucys Wort, Fuchs mit verdrehtem Kopf),
// dann die Fraßstelle mit Hofers Dienstbuch, Hirsch-Angriff, Heulen, das zu Funk wird, die Silhouette im tiefen Wald, Hofer selbst – und am Bau
// hinter dem Autowrack die Enthüllung: zwei Whiskeys, einer davon falsch. Der echte vertreibt ihn (Kapitel 6 · „Der Hungrige“).
// Garantierte Begegnungen mit gehäuteten Tieren („die Nackten“): am Hochsitz und am Amtsbus. Modelle: Unreal Animal Variety Pack (Reh, Krähe, Fuchs,
// Wolf, Hirsch), Deer Thing (Sketchfab, CC-BY) als wahre Gestalt, Megascans-Tierschädel, Fleisch/Organe und Blut aus dem Kuh-Sturz.
const HUNGRIGE = { spuren: { x: 1.5, z: 199.6 }, bau: { x: -13.2, z: 206.8 }, pfahl: { x: -13.9, z: 207.6 }, reh: { x: 14, z: 178.5 }, wolf: { x: 65, z: 199.5 }, dtYaw: PI / 2, dtH: 2.75 };
const HUNGRIGE_STUFEN = ['reh', 'kraehe', 'fuchs', 'spuren', 'hirsch', 'wolf_funk', 'blick', 'hofer', 'bau'];
// Reihenfolge in Kapitel 6 (PK-E): Dustwoods 1–3 · nach dem Hochsitz Hirsch · beim Bus Funk · Silhouette · Fraßstelle (Seite 1, Pflicht) · Hofer zwischen Fraßstelle und Wrack · Bau (Seite 2)
const HUNGRIGE_FOLGE = ['reh', 'kraehe', 'fuchs', 'hirsch', 'wolf_funk', 'blick', 'hofer'];
const hungrige_S = { ready: false, stage: 0, done: new Set(), ev: null, cool: 30, flesh: null, none: null, dt: null, cine: null, look: null, nackt: {}, fix: {}, finale: false, tries: 0, told: new Set(), epilog: false, ravA: null, ravB: null };
MOD_SAVE.push(['hungrige', () => ({ stage: hungrige_S.stage, done: [...hungrige_S.done], finale: hungrige_S.finale, epilog: hungrige_S.epilog }), // epilog: Kapitel 6 ganz zu Ende (Beobachter „d_zugesehen“ liest es)
  v => { const S = hungrige_S; S.stage = v.stage || 0; (v.done || []).forEach(k => S.done.add(k)); S.finale = !!v.finale; S.epilog = !!v.epilog; if (S.done.size && story.side.hungrige) { story.side.hungrige.state = S.finale ? 'done' : (S.done.has('fuchs') ? 'active' : 'hidden'); hungrige_desc(); } }]);
const hungrige_has = k => hungrige_S.done.has(k);
// Nur in Kapitel 6 (PK-A A6): wald_frei() aus wald.js. Stufen 1–3 nur in den Dustwoods (wald_in), 4–9 nur im tiefen Wald (tief_in).
function hungrige_ok() { return typeof wald_frei === 'function' && wald_frei() && typeof tief_ok === 'function' && tief_ok() && !dir.busy && !hungrige_S.ev && !hungrige_S.cine && !(typeof tief_S !== 'undefined' && (tief_S.fig || tief_S.follow)) && !hungrige_S.finale; }
function hungrige_dust(x, z) { return typeof wald_in === 'function' && wald_in(x, z); }
function hungrige_tief(x, z) { return typeof tief_in === 'function' && tief_in(x, z); }
function hungrige_inWald(x, z) { return (typeof wald_in === 'function' && wald_in(x, z)) || (typeof tief_in === 'function' && tief_in(x, z)); }
function hungrige_deep() { return typeof tief_S !== 'undefined' ? tief_S.k : 0; }
function hungrige_desc() {
  const q = story.side.hungrige; if (!q) return; const n = hungrige_S.done.size;
  if (hungrige_S.finale) q.desc = 'Der Wendigo hat sich gezeigt – und Whiskey hat ihn vertrieben. Er ist nicht tot. Aber er weiß jetzt, wem der Rabe gehört.';
  else if (hungrige_has('bau')) q.desc = 'Hofers letzte Seite: Es frisst die Bilder, die liegen bleiben. Es trägt Hofers Gesicht. Es hasst Licht und hat Angst vor dem Raben.';
  else if (hungrige_has('spuren')) q.desc = 'Ein Dienstbuch vom Amt neben einem angefressenen Reh: 1992 kam etwas aus der Senke, das keiner anfassen wollte. Es läuft noch hier herum. Begegnungen: ' + n + '.';
  else q.desc = 'Im Wald stimmt etwas mit den Tieren nicht. Ein Reh geht rückwärts, eine Krähe kennt Lucys Wort, ein Fuchs trägt den Kopf falsch. Begegnungen: ' + n + '.';
}
function hungrige_done(id, thought) {
  const S = hungrige_S; if (S.done.has(id)) return; S.done.add(id); const i = HUNGRIGE_STUFEN.indexOf(id); if (i >= 0) S.stage = Math.max(S.stage, i + 1);
  if (!story.side.hungrige) story.side.hungrige = { title: 'Der Hungrige', desc: '', state: 'hidden' };
  if (S.done.size >= 3 && story.side.hungrige.state === 'hidden') { hungrige_desc(); sideStart('hungrige'); } else hungrige_desc();
  if (thought && typeof gedanke === 'function') gedanke('hungrige_' + id, thought, 1400, 3);
  if (typeof saveGame === 'function') saveGame(curChapter());
}
// ---------------------------------------------------------------- Helfer: Platz vor dem Spieler zwischen den Bäumen, Blick, Licht, Knochen
const hungrige_V = new THREE.Vector3(), hungrige_Q = new THREE.Quaternion(), hungrige_E = new THREE.Euler();
// Freie Sicht von der Kamera auf (x, y, z)? Strahl gegen die Kollisionskörper (Bäume, Wände, Autos; Gras und Laub zählen nicht)
const hungrige_ray = new THREE.Ray(), hungrige_R2 = new THREE.Ray(), hungrige_W = new THREE.Vector3();
function hungrige_los(x, y, z) {
  const c = camera.position, dir = hungrige_W.set(x - c.x, y - c.y, z - c.z), L = dir.length(); if (L < .5) return true; dir.divideScalar(L); hungrige_ray.set(c, dir); const seen = new Set();
  for (let s = .5; s < L; s += 1.2) { for (const it of solidNear(c.x + dir.x * s, c.z + dir.z * s)) { if (seen.has(it)) continue; seen.add(it); if (it.soft || !solidLive(it) || !hungrige_ray.intersectsBox(it.bb)) continue;
    const bt = it.o.geometry && it.o.geometry.boundsTree; if (!bt) continue; hungrige_R2.copy(hungrige_ray).applyMatrix4(it.inv); const h = bt.raycastFirst(hungrige_R2, THREE.DoubleSide); if (!h) continue;
    if (h.point.applyMatrix4(it.mw).distanceTo(c) < L - .45) return false; } }
  return true;
}
function hungrige_spot(dMin, dMax, spread = .55, behind = false, h = .7) {
  const P = player.pos, f = flatDir(); if (behind) f.negate();
  for (let k = 0; k < 28; k++) { const a = Math.atan2(f.x, f.z) + rand(-spread, spread), d = rand(dMin, dMax), x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d;
    if (!hungrige_inWald(x, z) || leben_inHouse(x, z, 1.5) || !leben_free(x, z, .5, .9)) continue; if (typeof tief_pond === 'function' && tief_pond(x, z, 2)) continue;
    const sg = solidGround(x, .6, z), y = sg > -1 ? Math.max(0, sg) : 0; if (!behind && (!hungrige_los(x, y + h, z) || !hungrige_los(x, y + h * .45, z))) continue; return [x, y, z]; }
  return null;
}
function hungrige_facePlayer(V, k = 1) { const p = V.g.position, P = player.pos; V.g.rotation.y = leben_ang(V.g.rotation.y, Math.atan2(P.x - p.x, P.z - p.z), Math.min(1, k)); }
function hungrige_dist(V) { const p = V.g.position, P = player.pos; return Math.hypot(p.x - P.x, p.z - P.z); }
function hungrige_lit(V, dMax = 26, thr = .965, h = .7) { const p = V.g.position; return flashOn && !state.blackout && hungrige_dist(V) < dMax && leben_facing(p.x, p.y + h, p.z) > thr; }
function hungrige_seen(V, thr = .88, h = .7) { const p = V.g.position; return hungrige_dist(V) < 45 && leben_facing(p.x, p.y + h, p.z) > thr; }
function hungrige_bone(root, re) { let b = null; root.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; }
function hungrige_bones(root, re) { const L = []; root.traverse(o => { if (o.isBone && re.test(o.name)) L.push(o); }); return L; }
// Verdrehungen und Streckungen nach dem Mixer anwenden (der Mixer setzt die Knochen jedes Bild neu)
function hungrige_applyTwist(V) { if (!V.tw) return; for (const t of V.tw) { if (t.q) { hungrige_Q.identity().slerp(t.q, t.k); t.b.quaternion.copy(t.q0).multiply(hungrige_Q); } if (t.s) t.b.scale.set(t.s0.x * (1 + (t.s[0] - 1) * t.k), t.s0.y * (1 + (t.s[1] - 1) * t.k), t.s0.z * (1 + (t.s[2] - 1) * t.k)); } }
function hungrige_twist(V, b, ry, s) { if (!b) return null; const t = { b, q: ry ? new THREE.Quaternion().setFromEuler(hungrige_E.set(0, ry, 0)) : null, s: s || null, k: 0, q0: b.quaternion.clone(), s0: b.scale.clone() }; (V.tw = V.tw || []).push(t); return t; }
function hungrige_beast(key, s = 1) { const V = leben_beast(key, s); if (!V) return null; if (key === 'crow') V.m.rotation.y = PI / 2; V.g.visible = false; return V; }
function hungrige_off(V) { if (!V) return; V.g.visible = false; if (V.tw) for (const t of V.tw) { t.b.quaternion.copy(t.q0); t.b.scale.copy(t.s0); } V.tw = null; if (V.cur) V.cur.timeScale = 1; }
function hungrige_flesh() { // rohes Fleisch: Material aus dem Kuh-Sturz (Megascans-Fleischtextur), auf Tierhaut gelegt
  const S = hungrige_S; if (S.flesh) return S.flesh; let m = null; if (FAB.gore && FAB.gore.meat) FAB.gore.meat.traverse(o => { if (!m && o.isMesh) m = o.material; });
  S.flesh = m ? m.clone() : new THREE.MeshPhysicalMaterial({ color: 0x8a3a3a, roughness: .45, clearcoat: .8, clearcoatRoughness: .25 }); S.flesh.color.setRGB(.42, .17, .16); S.flesh.roughness = .28; if ('clearcoat' in S.flesh) { S.flesh.clearcoat = 1; S.flesh.clearcoatRoughness = .12; } S.flesh.side = THREE.DoubleSide; S.flesh.name = 'Nackt';
  S.none = S.none || new THREE.MeshBasicMaterial({ visible: false }); return S.flesh;
}
function hungrige_nackt(V) { // Fell und Federn weg, das Fleisch darunter: „die Nackten“
  const F = hungrige_flesh(); V.m.traverse(o => { if (!o.isMesh) return; const ms = [].concat(o.material); const out = ms.map(m => /fur|hair|feather/i.test(m.name || '') ? hungrige_S.none : F);
    o.material = Array.isArray(o.material) ? out : out[0]; o.castShadow = true; }); return V;
}
function hungrige_step(V, gain = .3) { const p = V.g.position; Audio.play(Audio.pick('stepG1', 'stepG2', 'stepG3'), { gain, rate: rand(.75, .95), x: p.x, y: .1, z: p.z, ref: 4 }); }
function hungrige_lucy(x, y, z, text, ms = 2200) { Audio.whisper(x, y, z, 1.6); subtitle('<i>' + text + '</i>', ms, 'LUCYS STIMME?'); }
// ---------------------------------------------------------------- Die wahre Gestalt (Deer Thing) und der Bau
async function hungrige_loadDT() {
  const S = hungrige_S; if (S.dt) return S.dt; if (S.dtP) return S.dtP; S.dtP = (async () => {
  try { const src = await msModel('wendigo', 'hirschding.glb'); const o = msGround(msFit(src.clone(true), HUNGRIGE.dtH, 'y')); o.rotation.y = HUNGRIGE.dtYaw;
    o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; const mats = [].concat(m.material).map(x => { const c = x.clone(); if (/eye/i.test(c.name || '')) { c.emissive = new THREE.Color(0x3a0a06); c.emissiveIntensity = 1.2; } c.roughness = Math.min(c.roughness ?? .6, .5); return c; }); m.material = Array.isArray(m.material) ? mats : mats[0]; } });
    const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; scene.add(g); S.dt = { g, o, t: 0 }; return S.dt; } catch (e) { console.warn('Hungrige: Hirschding', e); return null; } })(); return S.dtP;
}
function hungrige_dtHide() { const D = hungrige_S.dt; if (!D) return; D.g.visible = false; D.o.scale.setScalar(D.s0 || D.o.scale.x); D.g.scale.setScalar(1); D.g.rotation.set(0, 0, 0); }
// ---------------------------------------------------------------- Hofers Dienstbuch
const HUNGRIGE_SEITEN = {
  1: ['Dienstbuch Gefr. Hofer · Seite 1', 'Amt · Bergung 3 · Öffnung, Nacht zum 22. Juni 1992 · Gefr. Hofer\n\nBefehl wie immer: alles bergen, was aus der Senke kommt. Nicht ansehen, nicht ansprechen, nicht anfassen. Geborgen: drei Kühe ohne Augen (Roy, Roland, Rex), ein Hund, der rückwärts läuft und trotzdem ankommt. Und um drei etwas, das lag wie ein nasser Sack und sich hingestellt hat wie ein Hirsch, als die Lampen draufkamen.\nEs hat Seilers Stimme gemacht. Wort für Wort, was der drei Minuten vorher gefunkt hat. Seiler stand daneben und wurde weiß.\nKeiner wollte es anfassen. Ich hab’s angefasst. Es war warm wie ein Hund. Der Ami will es behalten.\n\nNachtrag: Anni nicht dabei. Diesmal ist keins rein und keins raus, der Pfarrer hat die Kinder in den Kapellenkeller gebracht und ist selber gegangen. Siebzehn Jahre. Nächstes Mal bin ich achtundsechzig.'], // Fassung 3: Wendigo-Dossier, Seite 1 (wortgleich)
  2: ['Dienstbuch Gefr. Hofer · letzte Seite', 'Ich weiß jetzt, was es isst. Kein Fleisch. Das Fleisch ist nur die Jacke: Reh, Krähe, Fuchs, was eben rumläuft. Es trägt sie falsch, der Kopf sitzt nie richtig, weil es nur die Vorderseite kennt.\nEs frisst, was bleibt, wenn das Licht jemanden holt oder zurückbringt. Die Bilder. Der Ami sagt Belichtung, Seiler sagt, nur ein Ritter sieht so was, und einer, der aus dem Ritter gemacht ist.\nAus den Bildern lernt es die Stimmen. Meine hat es gelernt, bevor ich es gemerkt habe.\nIch bin im Juni nicht aus der Senke zurückgekommen. <b>Es ist mit meinem Gesicht zurückgekommen.</b> Ich schreibe das mit seiner Hand.\n\nWer das liest: Es hasst Licht. Eine Lampe reicht, wenn man sie nicht senkt. Und es hat Angst vor dem Raben. Vor dem einen, der zu der Frau mit der Laterne gehört.\n— H.'] }; // Fassung 3: Seite 6 (wortgleich); Seiten 2–5: AP-23/24
function hungrige_seite(i) {
  const [t, txt] = HUNGRIGE_SEITEN[i], k = 'hungrige_seite_' + i, html = '<span class="hand">' + txt + '</span>', neu = !story.lore.some(l => l.key === k);
  if (neu) { Audio.paper(); story.lore.push({ key: k, title: 'Wendigo · ' + t, html }); } // Fassung 3: „Wendigo“ ab Hofers Seite 1
  // Fortschritt hängt am Stand (hungrige_has), nicht daran, ob die Seite neu war – ging der Rückruf verloren (Tod, Laden), holt ihn das nächste Lesen nach
  openNote(t, html, null, () => {
    if (i === 1) { if (!hungrige_has('spuren')) hungrige_done('spuren', 'Das war kein Wolf. Wölfe fressen. Das hier hat probiert.'); }
    else { if (!hungrige_has('bau')) hungrige_done('bau', 'Es frisst die Bilder. Die, die nur ich sehe. … Und ich bin ein einziger Abdruck, der herumläuft.'); hungrige_S.finT = 2.6; } }); // das Finale startet der Takt
}
// ---------------------------------------------------------------- Aufbau: Fraßstelle, Bau, Modelle
WORLD_MODS.push(['Wendigo (Dorfname: der Hungrige)', async () => {
  const S = hungrige_S, T = THREE;
  story.side.hungrige = story.side.hungrige || { title: 'Der Hungrige', desc: 'Im Wald stimmt etwas mit den Tieren nicht.', state: 'hidden' };
  const paper = new T.MeshStandardMaterial({ color: 0xcfc8b4, roughness: .92 }), page = (x, y, z, ry, i) => { const m = plane(.15, .21, x, y, z, paper, -PI / 2 + .12, ry); m.rotation.z = rand(-.3, .3);
    const hit = box(.6, .5, .6, x, y + .1, z, hidden, { cast: false }); interact(hit, () => i === 2 && !hungrige_has('spuren') ? '' : story.lore.some(l => l.key === 'hungrige_seite_' + i) ? 'Hofers Dienstbuch' : 'Eine Seite aus einem Dienstbuch', () => { if (i === 2 && !hungrige_has('spuren')) return; hungrige_seite(i); }); return m; }; // Seite 2 erst nach der Fraßstelle (Pflichtweg)
  const blood = (mat, x, z, s, rz, y = .045) => { if (!mat) return; const m = new T.Mesh(new T.PlaneGeometry(1, 1), mat); m.rotation.set(-PI / 2, 0, rz); m.position.set(x, y, z); m.scale.setScalar(s); m.receiveShadow = true; scene.add(m); };
  for (let i = 0; i < 80 && !(FAB.blood && FAB.gore); i++) await wait(250);
  const Bd = FAB.blood || {}, G = FAB.gore;
  const gore = (src, x, z, ry) => { if (!src) return; const o = src.clone ? src.clone() : src(); o.position.set(x, .02, z); o.rotation.set(rand(-.3, .3), ry, rand(-.3, .3)); scene.add(o); };
  // --- Fraßstelle auf dem Pfad zum Wrack: angefressenes Reh, Blut, Seite 1
  { const P = HUNGRIGE.spuren; blood(Bd.stain1, P.x, P.z, 2.2, .4); blood(Bd.stain2, P.x + 1.1, P.z - .6, 1.5, 2.1, .046); for (let i = 0; i < 7; i++) blood(Bd.spatter, P.x + rand(-2.4, 2.4), P.z + rand(-2, 2), rand(.8, 1.8), rand(0, 6), .047 + i * .0004);
    if (G) { gore(G.meat, P.x + 1.4, P.z + .9, rand(0, 6)); gore(G.kid, P.x - .9, P.z + 1.2, rand(0, 6)); gore(G.gut, P.x + .6, P.z - 1.3, 0); }
    page(P.x - 1.6, .06, P.z - 1.1, .7, 1); S.fix.spurenY = .06; }
  // --- Der Bau hinter dem Autowrack: Schädel auf dem Pfahl, Knochen, Blut, letzte Seite
  try { const P = HUNGRIGE.pfahl, parts = await msBake('fencepost'); let post = null, hTop = 0;
    for (const p of parts) { p.geo.computeBoundingBox(); const h = p.geo.boundingBox.max.y - p.geo.boundingBox.min.y; if (h > hTop) { hTop = h; post = p; } }
    if (post) { const m = new T.Mesh(post.geo, post.mat); m.position.set(P.x, -post.geo.boundingBox.min.y - .02, P.z); m.rotation.set(.05, .8, -.06); m.castShadow = true; m.receiveShadow = true; scene.add(m); S.fix.pfahlTop = post.geo.boundingBox.max.y - .02; }
    const sk = await msModel('wendigo', 'schaedel.glb'); const skull = msGround(msFit(sk.clone(true), .5, 'max')); skull.position.set(P.x, (S.fix.pfahlTop || 1.6) - .08, P.z); skull.rotation.set(.35, 2.2, .1); scene.add(skull); skull.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); S.skull = skull;
    const B = HUNGRIGE.bau; blood(Bd.stain2, B.x, B.z, 2.6, 1.3); blood(Bd.stain1, B.x - 1.2, B.z + 1, 1.8, 4.2, .046); for (let i = 0; i < 9; i++) blood(Bd.spatter, B.x + rand(-2.6, 2.6), B.z + rand(-2.2, 2.2), rand(.9, 2), rand(0, 6), .047 + i * .0004);
    if (G) { gore(G.ribs, B.x + 1.3, B.z - .8, rand(0, 6)); gore(G.meat, B.x - 1.4, B.z - 1.1, rand(0, 6)); gore(G.meat, B.x + .4, B.z + 1.5, rand(0, 6)); gore(G.kid, B.x - .3, B.z - 1.7, rand(0, 6)); gore(G.gut, B.x + 1.6, B.z + .7, 0); }
    page(B.x + 1.1, .06, B.z - .2, -.9, 2);
    if (typeof hintAdd === 'function') { hintAdd({ id: 'hungrige_spuren', x: HUNGRIGE.spuren.x, y: 0, z: HUNGRIGE.spuren.z, kind: 'geheim', near: 26, open: () => wald_frei() && !hungrige_has('spuren') }); hintAdd({ id: 'hungrige_bau', x: B.x, y: 0, z: B.z, kind: 'geheim', near: 24, open: () => wald_frei() && hungrige_has('spuren') && !hungrige_has('bau') }); }
  } catch (e) { console.warn('Hungrige: Bau', e); }
  // --- Hirsch ins Tierregister von leben.js (für leben_beast)
  try { if (typeof leben_S !== 'undefined' && leben_S.M && !leben_S.M.stag) { const sc = await msModel('animal_deerstag', 'model.glb'); leben_shrink(sc, 1024); leben_S.M.stag = { src: sc, clips: sc.animations || [] }; } } catch (e) { console.warn('Hungrige: Hirsch', e); }
  { const L = new VLight(0xdfe9ff, 0, 10, 1.6); L.position.set(0, -60, 0); scene.add(L); S.ravenL = L; } // Whiskeys Licht im Finale: jetzt anlegen, später nur Intensität
  S.ready = true;
}]);
// ---------------------------------------------------------------- Die Begegnungen (jede genau einmal, in dieser Reihenfolge freigeschaltet)
const HUNGRIGE_EV = {
  // 1) Ein Reh steht zwischen den Bäumen und sieht dich an. Dann geht es rückwärts in die Dunkelheit – ohne den Blick zu lösen.
  reh: { need: () => hungrige_dust(player.pos.x, player.pos.z), skip: () => hungrige_tief(player.pos.x, player.pos.z),
    start() { const sp = hungrige_spot(13, 19, .5); if (!sp) return false; const V = hungrige_beast('deer', 1); if (!V) return false;
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'IdleLookAround', 0); this.V = V; this.t = 0; this.seen = 0; this.ph = 'stare'; return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V); this.t += dt; leben_beastUpd(V, dt, 80); hungrige_facePlayer(V, dt * 2);
      if (this.ph === 'stare') { if (hungrige_seen(V, .9, .9)) this.seen += dt; if (this.seen > 1.6 || d < 9) { this.ph = 'back'; const P = player.pos, p = V.g.position, dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1; V.tx = p.x + dx / L * 40; V.tz = p.z + dz / L * 40; V.sp = 1.05; leben_play(V, 'Walk', .3, -1); Audio.twig(p.x, p.z); this.hT = 0; }
        else if (this.t > 40) return false; }
      else { leben_beastMove(V, dt, false); this.hT -= dt; if (this.hT < 0 && d < 30) { this.hT = .62; hungrige_step(V, .22); } if (d > 34 || this.t > 60 || (!hungrige_seen(V, .5) && d > 22)) return false; } return true; },
    end() { hungrige_off(this.V); hungrige_done('reh', 'Ein Reh geht nicht rückwärts. … Es hat mich angesehen. Die ganze Zeit, beim Rückwärtsgehen.'); } },
  // 2) Eine Krähe landet vor dir und sagt Lucys Wort. Dann fliegt sie – falsch herum – davon.
  // Kapitel 6: sie landet auf den Brotkrumen des Jungen und frisst sie (kapitel6.js: k6_krumeVorn / k6_krumenFressen) – „Die Spur ist weg.“
  kraehe: { need: () => hungrige_dust(player.pos.x, player.pos.z), skip: () => hungrige_tief(player.pos.x, player.pos.z),
    start() { const kr = typeof k6_krumeVorn === 'function' ? k6_krumeVorn() : null, sp = kr || hungrige_spot(5, 8, .4, false, .3); if (!sp) return false; this.krume = !!kr; const V = hungrige_beast('crow', 1.15); if (!V) return false;
      V.g.position.set(sp[0], sp[1] + 6, sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'Landing', 0, 1, true); Audio.flap(sp[0], sp[1] + 4, sp[2]); this.V = V; this.t = 0; this.ph = 'land'; this.said = false; return true; },
    tick(dt) { const V = this.V, p = V.g.position; this.t += dt; leben_beastUpd(V, dt, 60); hungrige_facePlayer(V, dt * 3);
      if (this.ph === 'land') { p.y += (V.ty - p.y) * Math.min(1, dt * 3.2); if (this.t > 1.1) { this.ph = 'sit'; leben_play(V, 'IdleLookAround', .3); p.y = V.ty; } }
      else if (this.ph === 'sit') { if (this.krume && !this.ate) { if (!this.eat0) { this.eat0 = this.t; leben_play(V, 'EatSomething', .2); } if (this.t - this.eat0 > 2.4) { this.ate = true; if (typeof k6_krumenFressen === 'function') k6_krumenFressen(p.x, p.z); leben_play(V, 'IdleLookAround', .3); } }
        if (!this.said && (!this.krume || this.ate) && this.t > (this.krume ? 4.6 : 2.4) && hungrige_seen(V, .8, .3)) { this.said = true; this.saidT = this.t; hungrige_lucy(p.x, p.y + .3, p.z, '„Großer …“', 2000); this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), PI); }
        if (this.tw) this.tw.k = Math.min(1, this.tw.k + dt * 1.2);
        if ((this.said && this.t > 6.5) || (this.said && this.t > this.saidT + 2 && hungrige_lit(V, 12, .985, .3)) || hungrige_dist(V) < 2.2) { this.ph = 'fly'; leben_play(V, 'TakeOff', .1, 1.2, true); Audio.flap(p.x, p.y + .5, p.z); Audio.caw(p.x, p.y + 1, p.z); this.ft = 0; const f = flatDir(); this.dir = new THREE.Vector3(-f.x, .55, -f.z).normalize(); }
        else if (this.t > 30) return false; }
      else { this.ft += dt; if (this.ft > .5) leben_play(V, 'Fly', .2, -1); p.addScaledVector(this.dir, dt * 7.5); if (this.ft > 4) return false; }
      hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('kraehe', '„Großer.“ Das ist Lucys Wort. Aus einem Krähenschnabel. … Irgendwas hier hat ihr zugehört.'); if (typeof k6_nachKraehe === 'function') k6_nachKraehe(!!this.ate); } },
  // 3) Ein Fuchs sitzt mit dem Rücken zu dir. Der Kopf sieht dich trotzdem an – um 180 Grad gedreht.
  fuchs: { need: () => hungrige_dust(player.pos.x, player.pos.z), skip: () => hungrige_tief(player.pos.x, player.pos.z),
    start() { const sp = hungrige_spot(8, 12, .45); if (!sp) return false; const V = hungrige_beast('fox', 1); if (!V) return false;
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.rotation.y += PI; V.g.visible = true; leben_play(V, 'IdleBreathe', 0); this.V = V; this.t = 0; this.lit = 0;
      this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), PI); if (this.tw) this.tw.k = 1; return true; },
    tick(dt) { const V = this.V; this.t += dt; leben_beastUpd(V, dt, 60); if (hungrige_lit(V, 20, .975, .35)) this.lit += dt;
      if (this.lit > 1.2 || hungrige_dist(V) < 3) { const p = V.g.position; Audio.growl(p.x, p.z, true); return false; } if (this.t > 35) return false; hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('fuchs', 'Der Kopf saß falsch. Umgedreht. Als hätte jemand den Fuchs angezogen und hinten den Reißverschluss vergessen.'); } },
  // 5) Ein Hirsch bricht aus dem Dunkel, stürmt auf dich zu, bleibt einen Meter vor dir stehen – und der Kopf dreht sich ohne den Hals.
  // Kapitel 6: nach dem Hochsitz (der nackte Rehbock oder weiter nördlich), vor der Fraßstelle
  hirsch: { need: () => hungrige_tief(player.pos.x, player.pos.z) && hungrige_deep() > .15 && (hungrige_has('nackt_reh') || player.pos.z > 183), skip: () => hungrige_has('spuren'),
    start() { const sp = hungrige_spot(24, 30, .3, false, 1.3); if (!sp) return false; const V = hungrige_beast('stag', 1.12); if (!V) return false;
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'IdleLookAround', 0); this.V = V; this.t = 0; this.ph = 'watch'; this.hT = 0; this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), PI); return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V), p = V.g.position; this.t += dt; leben_beastUpd(V, dt, 90);
      if (this.ph === 'watch') { hungrige_facePlayer(V, dt * 2); if ((hungrige_seen(V, .92, 1.2) && this.t > 1.5) || this.t > 12) { this.ph = 'run'; V.sp = 9; leben_play(V, 'Run', .15); Audio.deerBark ? Audio.deerBark(p.x, p.z) : Audio.grunt(p.x, p.z, true); leben_crowScare(p.x, p.z, 20); } }
      else if (this.ph === 'run') { const P = player.pos; V.tx = P.x; V.tz = P.z; leben_beastMove(V, dt); this.hT -= dt; if (this.hT < 0) { this.hT = .17; hungrige_step(V, .5); shake = Math.max(shake, .02); }
        if (d < 1.9) { this.ph = 'stop'; this.t = 0; leben_play(V, 'AntlersAttack', .08, 1, true); Audio.stinger(true); shake = .07; glitchV = .5; scareCount++; } }
      else if (this.ph === 'stop') { hungrige_facePlayer(V, dt * 6); if (this.t > 1.1) this.tw.k = Math.min(1, this.tw.k + dt * .9); if (this.t > 1.6 && !this.crk) { this.crk = true; Audio.crack(); }
        if (this.t > 2.8) { this.ph = 'gone'; cutLights(1100); Audio.growl(p.x, p.z, true); } }
      else { const f = flatDir(); p.addScaledVector(f, dt * 14); if (this.t > 3.6) return false; }
      hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('hirsch', 'Er ist vor mir stehen geblieben. Ein Meter. Und dann hat sich der Kopf gedreht – ohne den Hals.'); } },
  // 6) Ein Heulen aus dem Dunkeln, das mitten im Ton zu Funk wird: Hofers Stimme, 1992.
  // Kapitel 6: beim Amtsbus
  wolf_funk: { need: () => hungrige_tief(player.pos.x, player.pos.z) && (Math.hypot(player.pos.x - HUNGRIGE.wolf.x, player.pos.z - HUNGRIGE.wolf.z) < 40 || (typeof tief_has === 'function' && tief_has('tief_zettel_3'))), skip: () => hungrige_has('spuren'),
    start() { const sp = hungrige_spot(22, 30, .9, true); if (!sp) return false; this.p = sp; this.t = 0; this.st = 0; leben_howl(sp[0], sp[1] + .8, sp[2]); return true; },
    tick(dt) { this.t += dt; const [x, y, z] = this.p;
      if (this.st === 0 && this.t > 2.2) { this.st = 1; Audio.radio(x, z); glitchV = Math.max(glitchV, .35); subtitle('*Rauschen* „… Bergung drei … wir haben es … es steht auf wie ein –“', 3400, 'FUNK · 31,10 MHz'); }
      if (this.st === 1 && this.t > 6) { this.st = 2; subtitle('„… Hofer? Hofer, was ist mit deinem Gesicht –“', 3000, 'FUNK · 31,10 MHz'); Audio.whisper(x, 1.6, z, 1.2); }
      if (this.st === 2 && this.t > 9.4) { Audio.radio(x, z, true); Audio.twig(x, z); return false; } return true; },
    end() { hungrige_done('wolf_funk', 'Ein Wolf heult nicht auf 31,10 Megahertz. Das war Funk. Das war eine Stimme, die Heulen übt.'); } },
  // 7) Die wahre Gestalt, weit hinten zwischen den Stämmen. Aufrecht, zu groß. Wer sie anleuchtet, sieht nur Nebel.
  blick: { need: () => hungrige_tief(player.pos.x, player.pos.z) && hungrige_deep() > .3 && !!hungrige_S.dt, skip: () => hungrige_has('spuren'),
    start() { const sp = hungrige_spot(17, 23, .35, false, 1.9); if (!sp) return false; const D = hungrige_S.dt; D.g.position.set(sp[0], sp[1], sp[2]); D.g.rotation.y = Math.atan2(player.pos.x - sp[0], player.pos.z - sp[2]); D.g.visible = true; this.t = 0; this.seen = 0; this.sw = rand(0, 6); return true; },
    tick(dt) { const D = hungrige_S.dt, g = D.g; this.t += dt; this.sw += dt; g.rotation.y += Math.sin(this.sw * .7) * dt * .05;
      const p = g.position; if (leben_facing(p.x, p.y + 1.8, p.z) > .9 && hungrige_dist(D) < 40) this.seen += dt; if (this.seen > .6 && !this.sn) { this.sn = true; Audio.whisper(p.x, 1.8, p.z, 1.6); glitchV = Math.max(glitchV, .3); }
      if (hungrige_lit(D, 30, .975, 1.6) && this.seen > 1.5) { Audio.twig(p.x, p.z); Audio.treeCreak(p.x, p.z); scareCount++; return false; } if (hungrige_dist(D) < 7) { Audio.growl(p.x, p.z, true); glitchV = .6; return false; } if (this.t > 45) return false; return true; },
    end() { hungrige_dtHide(); hungrige_done('blick', 'Zu groß für einen Hirsch. Zu aufrecht. Und als das Licht draufkam, war da nur noch Nebel.'); } },
  // 8) Gefreiter Hofer. Uniform von damals, mit dem Rücken zu dir. Der Kopf dreht sich zu dir um – der Körper bleibt stehen.
  // Kapitel 6: zwischen Fraßstelle und Wrack
  hofer: { need: () => hungrige_has('spuren') && hungrige_tief(player.pos.x, player.pos.z) && player.pos.x < 0 && typeof figuren_embody === 'function', skip: () => hungrige_has('bau'),
    start() { const sp = hungrige_spot(11, 15, .35, false, 1.6); if (!sp) return false; const S = hungrige_S; if (!S.hoferG) { S.hoferG = new THREE.Group(); scene.add(S.hoferG); }
      const g = S.hoferG; g.position.set(sp[0], sp[1], sp[2]); g.rotation.y = Math.atan2(sp[0] - player.pos.x, sp[2] - player.pos.z); g.visible = true; this.t = 0; this.ph = 'wait'; this.P = null;
      figuren_embody(g, 'polizist', { clip: 'idle' }).then(P => { if (!P) { this.fail = true; return; } this.P = P; this.head = hungrige_bone(P.obj, /^(mixamorig)?Head$|Head$/i); }); return true; },
    tick(dt) { this.t += dt; if (this.fail) return false; const g = hungrige_S.hoferG, p = g.position, d = Math.hypot(p.x - player.pos.x, p.z - player.pos.z), f = leben_facing(p.x, p.y + 1.5, p.z);
      if (this.ph === 'wait') { if (f > .9 && d < 30) this.seen = (this.seen || 0) + dt; if (this.seen > 1.4) { this.ph = 'turn'; this.k = 0; Audio.crack(); } else if (this.t > 40) return false; }
      else if (this.ph === 'turn') { this.k = Math.min(1, this.k + dt * .55); if (this.k >= 1 && !this.sp) { this.sp = true; this.spT = this.t; Audio.whisper(p.x, 1.7, p.z, 1.8); subtitle('<i>„… Bergung drei … ich hab Hunger, Junge …“</i>', 3000, 'HOFER?'); }
        if (this.sp && ((flashOn && f > .975 && d < 20 && this.t > this.spT + 3) || d < 3.5 || this.t > this.spT + 9)) { this.ph = 'gone'; glitchV = .7; shake = .05; scareCount++; Audio.growl(p.x, p.z, true); cutLights(700); return false; } if (this.t > 60) return false; }
      if (this.head && this.k) { if (!this.base) this.base = this.head.quaternion.clone(); hungrige_Q.setFromEuler(hungrige_E.set(0, PI * this.k, 0)); this.head.quaternion.copy(this.base).multiply(hungrige_Q); } return true; },
    end() { const g = hungrige_S.hoferG; if (g) g.visible = false; hungrige_done('hofer', 'Eine Uniform vom Amt. Vom alten. Der Kopf hat sich zu mir gedreht, und der Körper ist stehen geblieben.'); } },
};
// ---------------------------------------------------------------- Garantierte Begegnungen: die Nackten (Hochsitz, Amtsbus)
const HUNGRIGE_NACKT = {
  // Ein Reh ohne Fell steht auf dem Pfad zum Hochsitz. Es kommt auf dich zu, langsam, Kopf schief. Licht drauf – es rennt.
  reh: { at: HUNGRIGE.reh, r: 15,
    start() { const sp = hungrige_spot(9, 13, .5); if (!sp) return false; const V = hungrige_beast('deer', 1.04); if (!V) return false; hungrige_nackt(V);
      V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; hungrige_facePlayer(V, 1); V.g.visible = true; leben_play(V, 'IdleLookAround', 0); this.V = V; this.t = 0; this.ph = 'look'; this.lit = 0; this.tw = hungrige_twist(V, hungrige_bone(V.m, /Head/), .9); this.tw && (this.tw.k = 1);
      Audio.whisper(sp[0], 1.2, sp[2], 1.4); glitchV = Math.max(glitchV, .25); return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V), p = V.g.position; this.t += dt; leben_beastUpd(V, dt, 60); hungrige_facePlayer(V, dt * 2.5);
      if (this.ph === 'look') { if (this.t > 2.2 && hungrige_seen(V, .85, .9)) { this.ph = 'come'; V.sp = .55; leben_play(V, 'Walk', .4, .55); this.hT = 0; } else if (this.t > 30) return false; }
      else if (this.ph === 'come') { V.tx = player.pos.x; V.tz = player.pos.z; leben_beastMove(V, dt, false); this.hT -= dt; if (this.hT < 0) { this.hT = 1.1; hungrige_step(V, .25); }
        if (hungrige_lit(V, 18, .96, .9)) this.lit += dt; else this.lit = Math.max(0, this.lit - dt);
        if (this.lit > 1.3 || d < 2.4) { this.ph = 'run'; V.sp = 8; const P = player.pos, dx = p.x - P.x, dz = p.z - P.z, L = Math.hypot(dx, dz) || 1; V.tx = p.x + dx / L * 50; V.tz = p.z + dz / L * 50; leben_play(V, 'Run', .15); Audio.grunt(p.x, p.z, true); this.hT = 0; scareCount++; if (d < 2.4) { shake = .06; glitchV = .5; } } }
      else { leben_beastMove(V, dt); this.hT -= dt; if (this.hT < 0) { this.hT = .2; hungrige_step(V, .35); } if (d > 40 || this.t > 60) return false; }
      hungrige_applyTwist(V); return true; },
    end() { hungrige_off(this.V); hungrige_done('nackt_reh', 'Kein Fell. Nur Fleisch, nass, als wär es gerade erst … angezogen worden. Und es kam auf mich zu wie ein Hund, der seinen Namen hört.'); } },
  // Ein Wolf ohne Fell liegt neben dem Amtsbus wie tot. Er steht auf, wenn du nah bist. Wer wegsieht, hat ihn danach näher.
  wolf: { at: HUNGRIGE.wolf, r: 13,
    start() { const B = HUNGRIGE.wolf; let sp = null; for (let k = 0; k < 20 && !sp; k++) { const x = B.x + rand(-7, 7), z = B.z + rand(-7, 7); if (Math.hypot(x - player.pos.x, z - player.pos.z) < 5 || !leben_free(x, z, .5, .9)) continue; const sg = solidGround(x, .6, z); sp = [x, sg > -1 ? Math.max(0, sg) : 0, z]; }
      if (!sp) return false; const V = hungrige_beast('wolf', 1.2); if (!V) return false; hungrige_nackt(V); V.g.position.set(sp[0], sp[1], sp[2]); V.ty = sp[1]; V.g.rotation.y = rand(0, 6.28); V.g.visible = true; leben_play(V, 'Rest', 0); V.mx.update(2); this.V = V; this.t = 0; this.ph = 'lie'; this.away = 0; this.jumps = 0; return true; },
    tick(dt) { const V = this.V, d = hungrige_dist(V), p = V.g.position, f = leben_facing(p.x, p.y + .5, p.z); this.t += dt; leben_beastUpd(V, dt, 60);
      if (this.ph === 'lie') { if (d < 6.5 && f > .6) { this.ph = 'rise'; this.t = 0; leben_play(V, 'RestToGoBackUp', .1, 1, true); Audio.groan(p.x, p.z, false); glitchV = Math.max(glitchV, .3); } else if (this.t > 90) return false; }
      else if (this.ph === 'rise') { hungrige_facePlayer(V, dt * 1.5); if (this.t > 1.9) { this.ph = 'stare'; leben_play(V, 'IdleAggressive', .3); Audio.growl(p.x, p.z, false); this.t = 0; } }
      else if (this.ph === 'stare') { hungrige_facePlayer(V, dt * 4); if (f < .35 && d < 20) this.away += dt; else if (this.away > .5 && f > .8) { this.away = 0; const P = player.pos, k = Math.max(0, 1 - 2.6 / (d || 1)); p.x = P.x + (p.x - P.x) * k * .62; p.z = P.z + (p.z - P.z) * k * .62; hungrige_step(V, .4); Audio.growl(p.x, p.z, true); glitchV = Math.max(glitchV, .4); shake = Math.max(shake, .02); }
        if (d < 2.6) { this.ph = 'bite'; this.t = 0; leben_play(V, 'JumpBite', .05, 1, true); Audio.stinger(true); scareCount++; shake = .08; glitchV = .7; setTimeout(() => cutLights(900), 450); } else if (this.t > 75) return false; }
      else if (this.ph === 'bite') { hungrige_facePlayer(V, dt * 6); if (this.t > 1.35) return false; }
      return true; },
    end() { hungrige_off(this.V); hungrige_done('nackt_wolf', 'Er lag da wie tot. Ohne Fell, ohne Haut fast. Und jedes Mal, wenn ich weggesehen hab, war er näher. … Was hier im Wald wohnt, hat keine Eile.'); } },
};
// ---------------------------------------------------------------- Kapitel 6 · Die Enthüllung: zwei Whiskeys, und der echte vertreibt den Hungrigen
function hungrige_raven(mirror) { const V = hungrige_beast('crow', 1.45); if (!V) return null; V.m.traverse(o => { if (!o.isMesh) return; o.castShadow = true; o.material = [].concat(o.material).map(x => { const c = x.clone(); c.color = (c.color || new THREE.Color(1, 1, 1)).clone().multiplyScalar(.55); c.roughness = .45; return c; }); if (o.material.length === 1) o.material = o.material[0]; });
  if (typeof whiskey_ring === 'function') try { whiskey_ring(V.m, false); } catch (e) {} // AP-08: eiserner Ring am linken Lauf – beim gespiegelten Nachbild sitzt er dadurch rechts
  if (mirror) V.g.scale.x = -1; return V; }
function hungrige_flyTo(V, to, dur, apex = 3) { const from = V.g.position.clone(); V.fl = { from, to: to.clone(), ctrl: new THREE.Vector3((from.x + to.x) / 2, Math.max(from.y, to.y) + apex, (from.z + to.z) / 2), t: 0, dur }; leben_play(V, 'Fly', .15); }
const _hfA = new THREE.Vector3(), _hfB = new THREE.Vector3(), _hfP = new THREE.Vector3(); // keine Allokation im Takt
function hungrige_flyTick(V, dt) { const F = V.fl; if (!F) return false; F.t += dt; const k = Math.min(1, F.t / F.dur), a = _hfA.lerpVectors(F.from, F.ctrl, k), b = _hfB.lerpVectors(F.ctrl, F.to, k), p = _hfP.lerpVectors(a, b, k);
  const dx = p.x - V.g.position.x, dz = p.z - V.g.position.z; if (dx * dx + dz * dz > 1e-6) V.g.rotation.y = Math.atan2(dx, dz); V.g.position.copy(p); if (k >= 1) { V.fl = null; return true; } return false; }
async function hungrige_finale() {
  const S = hungrige_S, W = new THREE.Vector3(), wait_ = wait; if (S.finale || S.cine || S.finBusy) return; S.finBusy = true; // Spielzeit: steht bei Pause
  try { await hungrige_finaleRun(S, W, wait_); } catch (e) { console.error('Hungrige: Finale', e); }
  finally { S.finBusy = false; if (S.cine) { try { hungrige_off(S.cine.A); hungrige_off(S.cine.B); hungrige_dtHide(); } catch (e) {} S.cine = null; state.talking = false; dir.busy = false; lightBoost = 0; if (S.ravenL) S.ravenL.intensity = 0; if (typeof whiskey_S !== 'undefined' && whiskey_S.g) whiskey_S.g.visible = true; hungrige_finaleSkip(); }
    if (typeof k6_feuerzeug === 'function' && S.finale) k6_feuerzeug(false); } // Fehler mitten im Finale: Feuerzeug weg, Lampe an – der Epilog startet trotzdem
}
// Finale nicht spielbar (Modell fehlt, Fehler mitten drin): Aufgabe trotzdem abschließen – nie eine offene Nebenaufgabe ohne Weg
function hungrige_finaleSkip() { const S = hungrige_S; if (S.finale) return; S.finale = true; try { sideDone('hungrige', 'Der Wendigo hat sich gezeigt – und Whiskey hat ihn vertrieben.'); hungrige_desc(); } catch (e) {} }
async function hungrige_finaleRun(S, W, wait_) {
  const D = await hungrige_loadDT(); if (!D) return hungrige_finaleSkip();
  if (state.talking || ui.overlay) { S.finT = 1.5; return; } // der Takt versucht es gleich noch einmal
  const P = HUNGRIGE.pfahl, B = HUNGRIGE.bau, top = (S.fix.pfahlTop || 1.6) + .38; const A = S.ravA || hungrige_raven(false), Bv = S.ravB || hungrige_raven(true); S.ravB = null; if (!A || !Bv) { hungrige_off(A); hungrige_off(Bv); return hungrige_finaleSkip(); } // Bv wird verwandelt: nie wiederverwenden
  const C = S.cine = { A, B: Bv, t: 0, look: new THREE.Vector3(P.x, top, P.z), lookK: 2, light: null, dt: D, ph: 'in' };
  state.talking = true; dir.busy = true; if (hungrige_S.ev) { try { hungrige_S.ev.end(); } catch (e) {} hungrige_S.ev = null; }
  const real = typeof whiskey_S !== 'undefined' && whiskey_S.g; if (real) real.visible = false;
  C.light = S.ravenL; // beim Laden angelegt (Intensität 0) – folgt dem Raben im Takt, kein neues Licht zur Laufzeit
  // 1) Whiskey fliegt über dich hinweg und landet auf dem Pfahl
  const f = flatDir(); A.g.position.set(player.pos.x - f.x * 9, 5.5, player.pos.z - f.z * 9); A.g.visible = true; hungrige_flyTo(A, W.set(P.x, top, P.z), 2.6, 2.5); Audio.flap(player.pos.x, 3, player.pos.z); setTimeout(() => Audio.caw(P.x, top, P.z), 900);
  await wait_(2700); leben_play(A, 'Landing', .1, 1, true); await wait_(700); leben_play(A, 'IdleLookAround', .3);
  await say([['Whiskey. … Du bist mir nachgeflogen.', 2400, 'LUKE']]);
  // Kapitel 6: kurz bevor der zweite landet, stirbt die Lampe – Peters Feuerzeug (Taste E, kapitel6.js)
  if (typeof k6_lampeStirbt === 'function') { try { await k6_lampeStirbt(); } catch (e) { console.warn('Kapitel6: Feuerzeug', e); } }
  // 2) Ein zweiter landet – spiegelverkehrt, ohne zu atmen: links vom Pfahl (aus Lukes Sicht), im Lichtkreis des Feuerzeugs
  let sp = null; { const lx = P.x - player.pos.x, lz = P.z - player.pos.z, ll = Math.hypot(lx, lz) || 1, x = P.x + lz / ll * 1.5 - lx / ll * .5, z = P.z - lx / ll * 1.5 - lz / ll * .5, g = solidGround(x, .6, z);
    if (leben_free(x, z, .3, .5)) sp = [x, g > -1 ? Math.max(0, g) : 0, z]; }
  sp = sp || hungrige_spot(2.2, 3.6, 1.1, false, 1.2) || [B.x + 2.6, Math.max(0, solidGround(B.x + 2.6, .6, B.z + .8)), B.z + .8]; const bx = sp[0], bz = sp[2], by = sp[1]; Bv.g.position.set(bx + 6, 4, bz + 5); Bv.g.visible = true; hungrige_flyTo(Bv, W.set(bx, by, bz), 2, 1.5); C.look.set(bx, by + .4, bz);
  await wait_(2100); leben_play(Bv, 'IdleLookAround', 0); Bv.mx.update(.3); if (Bv.cur) Bv.cur.timeScale = 0;
  await say([['… Zwei. Da sind zwei.', 2200, 'LUKE']]);
  C.look.set((P.x + bx) / 2, top * .6, (P.z + bz) / 2);
  hungrige_lucy(bx, by + .3, bz, '„Großer …“', 2200); await wait_(1400); Audio.play('crow2', { gain: .8, rate: .7, x: P.x, y: top, z: P.z, ref: 5 }); leben_play(A, 'Hop', .1, 1, true); await wait_(1300);
  await say([['Der linke atmet nicht. … Der linke hat noch nie geatmet.', 3000, 'LUKE']]);
  // 3) Der falsche dreht den Kopf. Dann reißt er auf.
  C.look.set(bx, by + .5, bz); const head = hungrige_bone(Bv.m, /Head/), neck = hungrige_bone(Bv.m, /Neck/), spine = hungrige_bone(Bv.m, /Spine/), feathers = hungrige_bones(Bv.m, /Wing(Left|Right)[A-H]|Feather/);
  const tHead = hungrige_twist(Bv, head, PI), tNeck = hungrige_twist(Bv, neck, 0, [1.4, 3.8, 1.4]), tSpine = hungrige_twist(Bv, spine, 0, [1.7, 2.6, 1.3]); const tF = feathers.map(b => hungrige_twist(Bv, b, 0, [.02, .02, .02]));
  C.ph = 'twist'; Audio.crack(); await wait_(1400);
  C.ph = 'morph'; C.t = 0; Audio.groan(bx, bz, true); scareCount++; glitchV = .6; shake = .05; Audio.stinger(true);
  const flesh = hungrige_flesh(); setTimeout(() => Bv.m.traverse(o => { if (o.isMesh) o.material = flesh; }), 1500); setTimeout(() => Audio.crack(), 900); setTimeout(() => Audio.crack(), 2100); setTimeout(() => Audio.screech(), 2400);
  C.morph = { tHead, tNeck, tSpine, tF }; await wait_(3000);
  // 4) Die wahre Gestalt steigt aus dem Vogel
  D.g.position.set(bx, by, bz); D.g.rotation.y = Math.atan2(player.pos.x - bx, player.pos.z - bz); D.s0 = D.o.scale.x; D.g.scale.setScalar(.06); D.g.visible = true; C.ph = 'rise'; C.t = 0; Audio.groan(bx, bz, true); glitchV = .8; shake = .09;
  await wait_(1500); Bv.g.visible = false; C.look.set(bx, by + 1.7, bz); state.flashFail = Math.max(state.flashFail, .9);
  await say([['Nein. Nein, nein –', 1800, 'LUKE']]);
  C.ph = 'come'; C.t = 0; Audio.thump(bx, .5, bz); await wait_(1700); Audio.thump(bx, .5, bz); await wait_(900);
  // 5) Whiskey greift an: Kreis, drei Stöße, und Licht – der Hungrige weicht und flieht
  C.ph = 'attack'; C.t = 0; C.dive = 0; leben_play(A, 'TakeOff', .1, 1.2, true); Audio.flap(P.x, top, P.z); Audio.caw(P.x, top + 1, P.z);
  await wait_(500); hungrige_flyTo(A, W.set(bx + 5, by + 5.5, bz - 4), 1.6, 3); await wait_(1650);
  for (let i = 0; i < 3; i++) { C.dive = i + 1; const from = A.g.position.clone(); hungrige_flyTo(A, W.set(D.g.position.x, by + 1.9, D.g.position.z), .9, .2); leben_play(A, 'FlyingAttack', .05, 1.3, true); Audio.screech(); Audio.gust(1.2);
    await wait_(950); C.recoil = 1; shake = Math.max(shake, .05 + i * .02); glitchV = Math.max(glitchV, .35); Audio.growl(D.g.position.x, D.g.position.z, true); if (i < 2) { hungrige_flyTo(A, W.set(from.x + rand(-2, 2), by + 5, from.z + rand(-2, 2)), 1.1, 2.5); await wait_(1150); } }
  C.ph = 'flash'; C.t = 0; Audio.crack(); Audio.thunder(.1, 1); lightBoost = 1.2; skyMat && skyMat.uniforms && (skyMat.uniforms.flash.value = .8);
  await say([['Kalt. Kerzengerade. Wie Mamas Kerze.', 3200, 'LUKE']]); // Fassung 3: Wendigo-Dossier 1.11
  C.ph = 'flee'; C.t = 0; Audio.growl(D.g.position.x, D.g.position.z, true); Audio.treeCreak(D.g.position.x + 3, D.g.position.z - 3); setTimeout(() => Audio.twig(D.g.position.x, D.g.position.z), 500); setTimeout(() => Audio.twig(D.g.position.x + 4, D.g.position.z + 2), 1100);
  await wait_(2800); hungrige_dtHide(); hungrige_flyTo(A, W.set(P.x, top, P.z), 1.8, 3); await wait_(1900); leben_play(A, 'Landing', .1, 1, true); await wait_(600); leben_play(A, 'IdleLookAround', .3); C.look.set(P.x, top, P.z);
  await say([['Er hat ihn vertrieben. Nicht ich – er.', 2600, 'LUKE'], ['„Er gehörte meiner Frau. Er findet immer heim. Zu ihr.“ … Das hat der Ritter gesagt.', 3800, 'LUKE'], ['Und der Wendigo weiß, wem du gehörst, Whiskey. Deshalb hat er Angst.', 3400, 'LUKE']]);
  // 6) Ende: Kapitel 6 – der echte Whiskey sitzt auf dem Pfahl und fliegt gleich voraus (Epilog, kapitel6.js); sonst fliegt der Rabe auf
  if (typeof k6_nachFinale === 'function') { const at = A.g.position.clone(); hungrige_off(A); hungrige_off(Bv); if (real) real.visible = true; k6_nachFinale(at); }
  else { leben_play(A, 'TakeOff', .1, 1.2, true); Audio.flap(P.x, top, P.z); hungrige_flyTo(A, W.set(P.x - 8, 9, P.z - 12), 2.2, 4); await wait_(2300); hungrige_off(A); hungrige_off(Bv); if (real) real.visible = true; }
  S.cine = null; S.finale = true; state.talking = false; dir.busy = false; lightBoost = 0; if (S.ravenL) S.ravenL.intensity = 0; if (skyMat && skyMat.uniforms) skyMat.uniforms.flash.value = 0;
  story.lore.push({ key: 'hungrige_enthuellung', title: 'Zwei Raben', html: 'Zwei Raben am Bau hinter dem Wrack. Der zweite atmete nicht und war spiegelverkehrt – und er sagte „Großer“ mit Lucys Stimme. Dann riss er auf: die Federn fielen, der Hals wurde lang, und aus dem Vogel stieg das, was Bergungstrupp 3 im Juni 1992 aus der Senke geholt hat.\n\nWhiskey hat ihn vertrieben. Mit Licht, das er nicht selbst hat: Es gehört der Frau, der er gehört. Der Wendigo ist nicht tot. Aber er weiß jetzt, wem der Rabe gehört.' });
  sideDone('hungrige', 'Der Wendigo hat sich gezeigt – und Whiskey hat ihn vertrieben.'); hungrige_desc(); // kein Popup mehr: Kapitel 6 endet mit dem Epilog (PK-E, kapitel6.js)
  if (typeof gedanke === 'function') gedanke('hungrige_finale', 'Whiskey gehört zu ihr. Zu der Frau mit der Laterne. … Sie kommt noch. Und der Wendigo hat es vor mir gewusst.', 6000, 3);
  if (typeof saveGame === 'function') saveGame(curChapter());
}
function hungrige_cineTick(dt) {
  const C = hungrige_S.cine; if (!C) return; C.t += dt; const A = C.A, B = C.B, D = C.dt;
  // Blick des Spielers sanft auf das Geschehen
  if (C.look) { const dx = C.look.x - camera.position.x, dz = C.look.z - camera.position.z, dy = C.look.y - camera.position.y, yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz));
    let d = yaw - player.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); const k = Math.min(1, dt * C.lookK); player.yaw += d * k; player.pitch += (pitch - player.pitch) * k; }
  for (const V of [A, B]) { if (!V.g.visible) continue; if (V.fl) hungrige_flyTick(V, dt); leben_beastUpd(V, dt, 200); }
  if (B.g.visible && !B.fl) B.g.rotation.y = leben_ang(B.g.rotation.y, Math.atan2(player.pos.x - B.g.position.x, player.pos.z - B.g.position.z) + (C.ph === 'in' ? 0 : 0), Math.min(1, dt * 2));
  if (C.ph === 'twist' && C.morph === undefined && B.tw) { for (const t of B.tw) if (t.q) t.k = Math.min(1, t.k + dt * .8); }
  if (C.ph === 'morph' && C.morph) { const M = C.morph, k = Math.min(1, C.t / 2.8), j = k > .3 ? Math.sin(C.t * 41) * .06 * k : 0; M.tHead.k = 1; M.tNeck.k = THREE.MathUtils.smoothstep(k, .1, .9) + j; M.tSpine.k = THREE.MathUtils.smoothstep(k, .25, 1) + j; for (const t of M.tF) t.k = THREE.MathUtils.smoothstep(k, .05, .55);
    B.g.position.y += Math.sin(C.t * 37) * .004 * k; B.g.rotation.z = Math.sin(C.t * 23) * .08 * k; glitchV = Math.max(glitchV, .25 * k); }
  if (B.g.visible) hungrige_applyTwist(B);
  if (D && D.g.visible) { const g = D.g;
    if (C.ph === 'rise') { const k = Math.min(1, C.t / 1.4), e = k < .7 ? k / .7 * .55 : .55 + (k - .7) / .3 * .45, jit = Math.sin(C.t * 53) * .04 * (1 - k) + Math.sin(C.t * 17) * .02; g.scale.setScalar(Math.max(.06, e + jit)); g.rotation.z = Math.sin(C.t * 19) * .07 * (1 - k); g.rotation.x = Math.sin(C.t * 13) * .05 * (1 - k); }
    else { g.scale.setScalar(1 + Math.sin(C.t * 2.3) * .012); g.rotation.z = Math.sin(C.t * 1.7) * .02; g.rotation.x = 0;
      const P = player.pos, dx = P.x - g.position.x, dz = P.z - g.position.z, L = Math.hypot(dx, dz) || 1; g.rotation.y = leben_ang(g.rotation.y, Math.atan2(dx, dz) + Math.sin(C.t * 9) * .12, Math.min(1, dt * 3));
      if (C.ph === 'come' && L > 3.2) { g.position.x += dx / L * dt * .75; g.position.z += dz / L * dt * .75; }
      if (C.recoil) { C.recoil = 0; g.position.x -= dx / L * 1.1; g.position.z -= dz / L * 1.1; g.rotation.z = .25; }
      if (C.ph === 'flee') { g.position.x -= dx / L * dt * 7; g.position.z -= dz / L * dt * 7; g.position.y -= dt * .35; g.rotation.y += dt * 1.4; } }
    C.look.set(g.position.x, g.position.y + 1.7 * g.scale.x, g.position.z); if (C.ph === 'attack' || C.ph === 'flash') C.look.lerp(A.g.position, .35); }
  // Whiskeys Licht: wächst mit jedem Stoß, blendet beim dritten
  if (C.light) { C.light.position.set(A.g.position.x, A.g.position.y + .25, A.g.position.z); const want = C.ph === 'attack' ? 1.5 + (C.dive || 0) * 2.2 : C.ph === 'flash' ? 9 : C.ph === 'flee' ? 4 : 0; C.light.intensity += (want - C.light.intensity) * Math.min(1, dt * 3); }
  if (C.ph === 'flash') { lightBoost = Math.max(0, 1.2 - C.t * .35); if (skyMat && skyMat.uniforms) skyMat.uniforms.flash.value = Math.max(0, .8 - C.t * .4); } else if (C.ph === 'flee') lightBoost = Math.max(0, lightBoost - dt * .4);
}
// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  const S = hungrige_S; if (!S.ready || !state.started || menu.attract || !wald_frei()) return; // Kapitel 1–5: nichts (PK-A A6)
  if (S.cine) { hungrige_cineTick(dt); return; }
  // Finale (wieder) anstoßen: Bau gelesen, Finale fehlt – auch nach Tod, Laden oder verlorenem Rückruf; nur in der Nähe des Baus
  if (hungrige_has('bau') && !S.finale && !S.finBusy) { S.finT = (S.finT ?? 2) - dt; const B = HUNGRIGE.bau;
    if (S.finT <= 0) { S.finT = 3; if (Math.hypot(player.pos.x - B.x, player.pos.z - B.z) < 28 && !S.ev) hungrige_finale(); } }
  if (S.ev) { let on = true; try { on = S.ev.tick(dt); } catch (e) { console.warn('Hungrige', S.ev.id, e); on = false; } if (!on) { try { S.ev.end(); } catch (e) { console.warn('Hungrige Ende', e); } S.ev = null; S.cool = hungrige_dust(player.pos.x, player.pos.z) ? rand(16, 28) : rand(35, 55); } return; } // Kapitel 6: dichter, der Weg ist kurz
  if (!S.corpse && typeof leben_S !== 'undefined' && leben_S.ready && leben_S.M && leben_S.M.deer) { S.corpse = true; try { const V = leben_beast('deer', 1); const Q = HUNGRIGE.spuren; V.g.position.set(Q.x + .4, Math.max(0, solidGround(Q.x + .4, .6, Q.z + .3)), Q.z + .3); V.g.rotation.y = 2.3; V.g.visible = true;
      leben_play(V, 'Death', 0, 1, true); V.mx.update(6); V.m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); S.corpseV = V; } catch (e) { console.warn('Hungrige: Kadaver', e); } }
  const P = player.pos; if (!hungrige_inWald(P.x, P.z) || S.finale) return;
  // Garantierte Begegnungen an festen Orten
  for (const [id, N] of Object.entries(HUNGRIGE_NACKT)) { if (hungrige_has('nackt_' + id)) continue; if (Math.hypot(P.x - N.at.x, P.z - N.at.z) > N.r || !hungrige_ok() || !leben_S.ready) continue;
    if ((S.nacktT || 0) > t) continue; const ev = Object.assign({ id: 'nackt_' + id }, N); if (ev.start()) { S.ev = ev; return; } S.nacktT = t + 4; }
  // Gestaffelte Begegnungen
  S.cool -= dt; if (S.cool > 0 || !hungrige_ok() || !leben_S.ready) return;
  if (!S.dt && !S.dtP && hungrige_tief(P.x, P.z)) hungrige_loadDT();
  // nächste Begegnung: die erste nicht erlebte in HUNGRIGE_FOLGE, die an diesem Ort noch dran ist (skip: Ort/Zeitpunkt verpasst – übersprungen, nicht erledigt)
  let id = null; for (const k of HUNGRIGE_FOLGE) { if (S.done.has(k)) continue; const e = HUNGRIGE_EV[k]; if (e.skip && e.skip()) continue; id = k; break; }
  const E = id && HUNGRIGE_EV[id]; if (!E || !E.need()) { S.cool = 3; return; }
  const ev = Object.assign({ id }, E); if (ev.start()) S.ev = ev; else S.cool = 6;
});
// Kapitel 6 beginnt (kapitel6.js): Wesen, Raben und Material jetzt anlegen und vorwärmen – nie mitten in einer Szene laden oder klonen
async function hungrige_prep() {
  const S = hungrige_S; S.cool = Math.min(S.cool, 12); hungrige_flesh();
  try { if (!S.ravA && typeof leben_S !== 'undefined' && leben_S.ready && leben_S.M && leben_S.M.crow) { S.ravA = hungrige_raven(false); S.ravB = hungrige_raven(true); } } catch (e) { console.warn('Hungrige: Raben', e); }
  const D = await hungrige_loadDT();
  try { const L = [D && D.g, S.ravA && S.ravA.g, S.ravB && S.ravB.g].filter(Boolean); L.forEach(g => { g.visible = true; g.position.set(HUNGRIGE.bau.x, -40, HUNGRIGE.bau.z); });
    if (renderer.compileAsync) await renderer.compileAsync(scene, camera); L.forEach(g => g.visible = false); } catch (e) { console.warn('Hungrige: Vorwärmen', e); }
}
window.__hungrige = { S: hungrige_S, EV: HUNGRIGE_EV, N: HUNGRIGE_NACKT, start: id => { const S = hungrige_S; if (S.ev) return false; const E = HUNGRIGE_EV[id] || HUNGRIGE_NACKT[id]; const ev = Object.assign({ id }, E); if (ev.start()) { S.ev = ev; return true; } return false; },
  finale: () => hungrige_finale(), seite: i => hungrige_seite(i), dt: () => hungrige_loadDT(), prep: () => hungrige_prep() }; // Testzugriff
