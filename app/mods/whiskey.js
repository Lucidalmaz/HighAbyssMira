// =====================================================================  WHISKEY (Modul „whiskey“, Fassung 3 AP-08): Miras Rabe Wîse, der Luke durch alle sechs Kapitel begleitet
// Echtes, gerigtes Modell (animal_crow), dunkler und größer als die Dorfkrähen, fast weiße Augen, am LINKEN Fuß ein eiserner Ring (Turm über Abgrund).
// Wach spricht er NIE einen Satz: nur Geräusche, Nachahmungen (whiskey_mimic, vorhandene Aufnahmen, leicht verstimmt, Tiefpass) und die drei alten
// Wörter „Kum!“, „Such!“ und einmal „Luna.“ (Dossier 83). Er geht nie unter die Erde. Nach W-13 (Miras Licht) kein Tausch, keine Nachahmung außer „Bedauerlich.“.
// Vier Gänge (S.mood): eitel (putzt sich) · beleidigt (klaut, dreht den Rücken zu, teurer) · handel (Kopf schief, Blick auf die Jackentasche) · still (Grusel-Signal).
// Stationen (WHISKEY_ST): when() = aktiv, done() = erledigt; die letzte aktive gilt (kapitel6.js und anwesen.js nutzen dieselbe Liste).
// Tausch: Anbieten-Menü und Glänzendes liegen im Modul „tausch“ (tausch.js, direkt danach in ORDER); hier nur, was der Rabe tut.
// Schnittstelle für Kapitel-APs (ohne eigenen Bau): whiskey_ort(id, x, z, y) · whiskey_blick(x, y, z, s) · whiskey_mimic(key) · whiskey_gag() ·
//   whiskey_schacht() K2-2 · whiskey_fluch() K3-0 · whiskey_schreibgeste() W-07 · whiskey_ersterLaut() W-08 · whiskey_w09/w10/w11(pos) · whiskey_suchBild(pos) ·
//   whiskey_kellertreppe(pos, unten) K4-6 · whiskey_zoll() K4-1 · whiskey_papasMarke() K4-4 · whiskey_kombi(pos) K5-2 · whiskey_w12(pos) · whiskey_bringt(pos) W-14 ·
//   whiskey_luna() W-15 · whiskey_bedauerlich() · whiskey_thermosdeckel() K6-1 · whiskey_ring(model, rechts) (Ring am Fuß, auch für hungrige_raven).
const whiskey_S = { ready: false, g: null, m: null, mx: null, A: {}, cur: null, st: null, mode: 'gone', fl: null, idleT: 2, met: new Set(), seen: new Set(), named: false, hit: null, trade: false, jHit: null, jAsked: false,
  mood: 'eitel', ignored: 0, said: new Set(), stolen: [], help: 0, ring: false, light: false, vegas_taufe: false, hatSchluessel: false, chip: false, // AP-03
  flags: new Set(), speck: 0, gag: {}, fluch: 0, // AP-08: erledigte Szenen, Speck-Besuche (K1-4), Vogel-Gag je Kapitel (A-28), Flüche an der Kreuzung (K3-0)
  head: null, hy: 0, hyT: 0, hr: 0, hrT: 0, sacT: 0, body: 0, turn: null, puff: 0, breath: 0, look: null, lookT: 0, beak: null, beakOn: false, ringM: null,
  near: false, passT: 0, helpSig: '', helpT: 0, helpLvl: 0, helpChk: 0, stT: 0, left: null, ride: null, tired: false, base: 1.45 };
const WHISKEY_ORTE = { gisela: null, kombi: null }; // von späteren APs gesetzt (Giselas Zaunpfahl AP-15, Kombi AP-06): whiskey_ort(id, x, z, y)
function whiskey_ort(id, x, z, y) { WHISKEY_ORTE[id] = x === undefined ? null : [x, z, y]; }
const whiskey_k = () => (typeof kap === 'function' ? kap() : 1);
const whiskey_lore = k => story.lore.some(l => l.key === k);
const whiskey_d = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z);
function whiskey_unten() { const P = player.pos; return state.inBasement || P.x > 250 || (ch2.on && whiskey_k() === 2) || state.zone === 'canal'; } // unter der Erde: nie
function whiskey_sb(n) { // Stundenbuch-Seite gefunden? (sammeln.js, AP-11)
  try { if (typeof sammeln_hatSB === 'function') return !!sammeln_hatSB(n); const L = (typeof sammeln_S !== 'undefined' && sammeln_S.sb) || (typeof KAP_SAVE !== 'undefined' && KAP_SAVE.sammeln && KAP_SAVE.sammeln.sb) || [];
    return L.has ? L.has(n) || L.has('SB-' + String(n).padStart(2, '0')) : L.includes(n) || L.includes('SB-' + String(n).padStart(2, '0')); } catch (e) { return false; } }
const whiskey_k5 = () => typeof k5 !== 'undefined' && k5.on ? k5.beat : '';
const whiskey_k6 = () => typeof K6 !== 'undefined' && K6.on ? K6.beat : '';
// ---------------------------------------------------------------- Stationen
// at: [x, z] Sitzplatz (Oberfläche per Strahl) · hover/y: feste Höhe · pos(): bewegter Sitzplatz (Justins Hand/Schulter) · mood: erzwungener Gang
// talk: Klick (Text = Lukes Gedanke, Funktion = Szene) · look: [x, z] Blickziel · help: Hilfestufen 1–3 (83 §4) · near(): Szene bei Annäherung
const WHISKEY_ST = [
  // ---- Kapitel 1
  { id: 'start', at: [-44.2, 3.4], when: () => whiskey_k() === 1 && state.started && !state.hasKey && !whiskey_S.hatSchluessel && story.main <= 1, done: () => story.main >= 2 || (whiskey_S.met.has('start') && whiskey_d(-44.2, 3.4) > 30),
    talk: () => whiskey_k1Start() },
  { id: 'auto', prio: true, at: [-72.3, 6.3], y: 2.47, when: () => whiskey_k() === 1 && state.started && whiskey_S.hatSchluessel, done: () => !whiskey_S.hatSchluessel, mood: 'handel',
    talk: () => whiskey_w03(), near: d => { if (d < 4.6 && !whiskey_S.flags.has('w02a')) whiskey_w02a(); } },
  { id: 'briefkasten', at: [28.4, -6.9], when: () => whiskey_k() === 1 && state.started && !state.hasKey && story.main >= 1, done: () => state.hasKey, peck: true,
    talk: 'Er pickt am Briefkasten von Nr. 7. Immer wieder, genau an der Klappe. … Okay. Ich hab verstanden.',
    help: [null, () => whiskey_pick(3), () => whiskey_k15()] },
  { id: 'vegas_k1', at: [-27.3, -10.6], when: () => whiskey_k() === 1 && state.hasKey && !whiskey_S.flags.has('w01') && !state.phase2, done: () => whiskey_S.flags.has('w01'),
    talk: () => whiskey_w01(), label: 'Den Vogel wegscheuchen', labelFlag: 'w01' },
  { id: 'speck', at: [-27.3, -10.6], when: () => whiskey_speckAktiv(), done: () => whiskey_S.speck >= 3,
    near: d => whiskey_speckNah(d) },
  { id: 'scheune', pos: () => whiskey_scheune(), when: () => whiskey_k() === 1 && state.started && !whiskey_sb(1) && whiskey_d(-142, -28) < 32 && !(whiskey_S.flags.has('w04') && whiskey_d(-142, -28) > 40), done: () => whiskey_sb(1),
    look: [-143.05, -29.33], quiet: true, near: d => { if (d < 7 && !whiskey_S.flags.has('w04')) whiskey_w04(); } },
  { id: 'gisela', pos: () => WHISKEY_ORTE.gisela, when: () => whiskey_k() === 1 && !!WHISKEY_ORTE.gisela && !whiskey_S.flags.has('kuli'), done: () => whiskey_S.flags.has('kuli'),
    talk: () => whiskey_kanonGisela() },
  { id: 'villa_tor', at: [-128.6, 57], when: () => whiskey_k() === 1 && whiskey_d(-125, 57) < 34 && !whiskey_S.flags.has('villa_tor'), done: () => whiskey_S.flags.has('villa_tor') && whiskey_d(-125, 57) > 36,
    near: d => { if (d < 14 && !whiskey_S.flags.has('villa_tor')) { whiskey_S.flags.add('villa_tor'); setTimeout(() => whiskey_mimic('kinderlachen', { leise: true }), 900); } } },
  { id: 'nordzaun', at: [27.98, 98.02], when: () => whiskey_k() === 1 && whiskey_d(30, 97) < 30, done: () => false, mood: 'still', look: [30, 112] },
  { id: 'warten', at: [28.4, -6.9], when: () => whiskey_k() === 1 && state.hasKey && !state.ch1Done && (whiskey_S.flags.has('w01') || state.inBasement || state.outage || state.phase2) && !whiskey_speckAktiv(), done: () => state.ch1Done,
    talk: 'Er sitzt auf dem Briefkasten und sieht zur Tür. Er wartet. Auf mich?', mood: () => (state.outage || state.phase2) ? 'still' : '' },
  // ---- Kapitel 2 (nur oben: Geländer von Nr. 7 und der Gullyrand)
  { id: 'nr7', at: [26, -11.4], when: () => state.ch1Done && whiskey_k() <= 2 && !ch2.on, done: () => false, look: [30, -21.8],
    talk: 'Da ist er wieder. Auf dem Geländer von Nr. 7. Er schaut zur Kellertür, nicht zu mir.' },
  { id: 'schacht', at: [9.7, -1.3], y: .12, when: () => whiskey_k() === 3 && ch3.part === 'town' && !ch3.met && !whiskey_S.flags.has('k2_2'), done: () => whiskey_S.flags.has('k2_2'),
    near: d => { if (d < 3.2) whiskey_schacht(); } },
  // ---- Kapitel 3
  { id: 'handschuh', pos: () => whiskey_justinHand(), when: () => whiskey_k() === 3 && ch3.met && ch3.part === 'town' && !whiskey_S.jAsked && justin.g.visible && whiskey_d(justin.g.position.x, justin.g.position.z) < 9, done: () => whiskey_S.jAsked,
    near: d => { if (d < 7 && whiskey_S.mode === 'ride' && !state.talking) whiskey_w06(); } },
  { id: 'vegas', at: [-27.3, -10.6], when: () => whiskey_k() === 3 && ch3.part === 'town' && ch3.met, done: () => whiskey_S.trade,
    talk: () => whiskey_kanonVegas() },
  { id: 'gedenkfeld', at: [-48.65, 72.95], when: () => whiskey_k() === 3 && ch3.part === 'town' && ch3.met, done: () => whiskey_lore('cleo_gedenk') || whiskey_S.met.has('gedenkfeld'),
    talk: 'Whiskey sitzt auf einem Grabstein ohne Namen. Dem achten. Jemand hat den Namen weggekratzt, bis der Stein weiß war.' },
  { id: 'funk', at: [5.4, -6.6], when: () => whiskey_k() === 3 && ch3.part === 'town' && ch3.met && !ch3.radio && whiskey_S.helpLvl >= 1 && whiskey_d(5.4, -6.6) < 30, done: () => ch3.radio,
    help: [null, () => whiskey_mimic('funk'), () => whiskey_funk3110()], helpR: 30 },
  { id: 'laternen', at: [-20, 4.6], y: 5.28, when: () => whiskey_k() === 3 && ch3.part === 'town' && ch3.radio && !ch3.lampsOff && whiskey_S.helpLvl >= 1, done: () => ch3.lampsOff,
    help: [null, () => whiskey_hin(-40, -4.6, 5.28), () => whiskey_mimic('kinderlachen', { at: [-20, 4.8, 4.6] })], helpR: 60 },
  { id: 'senke', pos: () => whiskey_justinSchulter(), when: () => whiskey_k() === 3 && ch3.part === 'white' && justin.g.visible, done: () => false, mood: 'still', ride: true },
  // ---- Kapitel 4 (die Villa-Szenen W-09 … W-11 spielen über Funktionen, die AP-19 aufruft)
  { id: 'vegas_k4', at: [-27.3, -10.6], when: () => whiskey_k() === 4 && !whiskey_S.flags.has('k4_4'), done: () => whiskey_S.flags.has('k4_4'),
    talk: () => whiskey_papasMarke() },
  { id: 'villa_tor4', at: [-128.6, 57], when: () => whiskey_k() === 4 && whiskey_S.flags.has('k4_4') && whiskey_d(-125, 57) < 40 && !(typeof anwesen_S !== 'undefined' && anwesen_S.open), done: () => false },
  // ---- Kapitel 5
  { id: 'k5_veranda', at: [-27.3, -10.6], when: () => whiskey_k() === 5 && ['intro', 'veranda', 'fenster', 'kamera'].includes(whiskey_k5()) && !whiskey_S.flags.has('k5_0x'), done: () => whiskey_S.flags.has('k5_0x'),
    mood: 'beleidigt', near: d => whiskey_k50(d) },
  { id: 'k5_fenster', at: [-51.2, -11.75], y: 1.12, when: () => whiskey_k() === 5 && whiskey_k5() === 'schleife' && (k5.runde || 1) < 3, done: () => (k5.runde || 1) >= 3, look: [-51.2, -14],
    mood: () => (k5.runde || 1) >= 2 ? 'still' : '' },
  { id: 'stall', at: [-140.5, -28], when: () => whiskey_k() === 5 && ['stall', 'augenauf'].includes(whiskey_k5()), done: () => false, look: [-138.2, -30.1], near: d => whiskey_w12nah(d),
    mood: () => whiskey_S.flags.has('w12_still') ? 'still' : '' },
  // ---- Kapitel 6 (bis W-13; danach führt kapitel6.js ihn zum Hochsitz)
  { id: 'gitter', at: [27.98, 98.02], when: () => whiskey_k() === 6 && whiskey_k6() === 'gitter', done: () => false, look: [30, 110], mood: 'still' }, // AP-23: am Gitter still – „Du sagst gar nichts. Das ist neu.“
  { id: 'baumhausdach', at: [-22, 141], when: () => whiskey_k() === 6 && !whiskey_S.trade && !whiskey_S.light && whiskey_d(-22, 141) < 32, done: () => whiskey_S.trade,
    talk: () => whiskey_kanonBaumhaus(), near: d => { if (d < 10 && !whiskey_S.flags.has('deckel')) whiskey_deckelHin(); } },
  { id: 'lager', at: [81.3, 233.2], when: () => whiskey_k() === 6 && !whiskey_S.light && whiskey_d(80.5, 233) < 22 && !whiskey_S.flags.has('k6_3'), done: () => whiskey_S.flags.has('k6_3'),
    talk: () => whiskey_k63(), label: 'Den Müsliriegel teilen', labelFlag: 'k6_3' },
  { id: 'busdach', at: [65, 199.5], when: () => whiskey_k() === 6 && !whiskey_S.light && whiskey_d(65, 199.5) < 30 && !['bau', 'epilog', 'hochsitz', 'oben', 'ende'].includes(whiskey_k6()), done: () => false, mood: 'still' }];
// ---------------------------------------------------------------- Modell, Animation, Flug
// Oberseite des höchsten festen Körpers unter (x, z) – Laternenkopf, Briefkasten, Geländer, Grabstein
function whiskey_perch(x, z) {
  let top = 0; const ray = new THREE.Ray(), o = new THREE.Vector3(), d = new THREE.Vector3(), w = new THREE.Vector3();
  for (const it of solidNear(x, z)) { const bb = it.bb; if (x < bb.min.x || x > bb.max.x || z < bb.min.z || z > bb.max.z || it.soft || !solidLive(it) || bb.max.y > 9) continue;
    o.set(x, bb.max.y + .5, z).applyMatrix4(it.inv); d.set(0, -1, 0).transformDirection(it.inv); ray.set(o, d); const h = it.o.geometry.boundsTree.raycastFirst(ray, THREE.DoubleSide);
    if (h) { w.copy(h.point).applyMatrix4(it.mw); if (w.y > top) top = w.y; } }
  return top;
}
function whiskey_play(k, fade = .25, once = false, ts = 1) { const S = whiskey_S, a = S.A[k]; if (!a) return; a.timeScale = ts; if (a === S.cur) return; a.reset();
  if (once) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } else { a.setLoop(THREE.LoopRepeat, Infinity); if (/^Idle|^Eat/.test(k)) { a.time = Math.random() * a.getClip().duration; a.timeScale = ts * rand(.88, 1.12); } } a.fadeIn(fade).play(); if (S.cur) S.cur.fadeOut(fade); S.cur = a; } // Q-1: keine identischen Schleifen
function whiskey_caw(o = {}) { const S = whiskey_S, g = S.g; if (!g || S.mood === 'still' || S.tired || whiskey_stumm()) return; Audio.play(Math.random() < .75 ? 'crow1' : 'crow2', { gain: o.gain ?? .7, rate: .78, vary: .06, obj: g, doppler: true, ref: 5 }); }
function whiskey_stumm() { return (typeof K6 !== 'undefined' && K6.on && K6.sil > .5) || (typeof SP !== 'undefined' && SP.silent > .5); } // Stille-Zonen (Kap. 6): Whiskey stumm
// Flug: Bogen (quadratische Bézierkurve), schnell ab, langsam an (Landen mit Abbremsen), Körper neigt sich mit
function whiskey_fly(to, then) {
  const S = whiskey_S, from = S.g.position.clone(), dist = from.distanceTo(to), apex = Math.max(from.y, to.y) + Math.min(8, 2 + dist * .25);
  S.fl = { from, to: to.clone(), ctrl: new THREE.Vector3((from.x + to.x) / 2, apex, (from.z + to.z) / 2), t: 0, dur: Math.max(1.6, dist / 7.5), then, land: false };
  S.mode = 'take'; S.tt = .45; S.turn = null; S.fl.hold = .14; whiskey_play('TakeOff', .08, true, rand(1.1, 1.3)); if (dist > 3) { whiskey_caw({ gain: .5 }); Audio.flap(from.x, from.y + .2, from.z); } whiskey_noHit();
}
function whiskey_noHit() { const S = whiskey_S; if (!S.hit) return; uninteract(S.hit); S.hit.position.set(0, -50, 0); }
function whiskey_leave() { const S = whiskey_S; if (!S.g || S.mode === 'gone') return; whiskey_noHit(); S.ride = null; const p = S.g.position; whiskey_fly(new THREE.Vector3(p.x + rand(-25, 25), p.y + 18, p.z + rand(-25, 25)), () => { S.g.visible = false; S.mode = 'gone'; }); }
// Sofort an einen Ort (für Szenen, die ein Kapitel-AP startet): landet sichtbar aus der Luft
function whiskey_setzen(x, y, z, then) { const S = whiskey_S; if (!S.g) return; S.ride = null; if (!S.g.visible || S.mode === 'gone') { S.g.position.set(x + rand(-12, 12), y + 12, z + rand(-12, 12)); S.g.visible = true; }
  whiskey_fly(new THREE.Vector3(x, y, z), () => { S.mode = 'perch'; S.idleT = 1.2; then && then(); }); }
function whiskey_hin(x, z, y) { whiskey_setzen(x, y ?? whiskey_perch(x, z), z); } // Hilfe: zum nächsten Ort fliegen
// Blickziel (auch für andere Module: „Whiskey schaut nach rechts“): s Sekunden, danach wieder Luke
function whiskey_blick(x, y, z, s = 4) { const S = whiskey_S; S.look = S.look || new THREE.Vector3(); S.look.set(x, y, z); S.lookT = s; }
// Eiserner Ring am Lauf (linkes Bein; rechts = das falsche Nachbild am Bau). Klein, dunkel, abgegriffen – ein Detail am Modell, kein eigenes Objekt in der Welt.
function whiskey_ring(model, rechts = false) {
  let link = null, foot = null; model.traverse(o => { if (!o.isBone) return; const n = o.name; if (/(^|-)L-HorseLink$/.test(n) && !rechts) link = o; if (/(^|-)R-HorseLink$/.test(n) && rechts) link = o; });
  if (!link) return null; foot = link.children.find(c => c.isBone) || null; let root = model; while (root.parent) root = root.parent; root.updateMatrixWorld(true);
  const dir = foot ? foot.position.clone() : new THREE.Vector3(0, 1, 0), len = dir.length() || 1; dir.normalize();
  const ws = new THREE.Vector3(); link.getWorldScale(ws); const k = 1 / (ws.x || 1);
  const mat = new THREE.MeshStandardMaterial({ color: 0x2c2724, roughness: .55, metalness: .85 });
  const r = new THREE.Mesh(new THREE.TorusGeometry(.0105 * k, .0032 * k, 6, 14), mat); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir); r.position.copy(dir).multiplyScalar(len * .45); r.castShadow = false; link.add(r);
  return r; }
// Glanz im Schnabel (Autoschlüssel, Deckel …): ein kleiner Lichtfunke (Sprite), folgt dem Kopf
function whiskey_beakTex() { return tex(cnv(64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,250,235,1)'); g.addColorStop(.18, 'rgba(255,236,190,.85)'); g.addColorStop(.5, 'rgba(255,220,160,.12)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);
  c.strokeStyle = 'rgba(255,248,230,.7)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(w / 2, 6); c.lineTo(w / 2, w - 6); c.moveTo(6, w / 2); c.lineTo(w - 6, w / 2); c.stroke(); }), true); }
// Schnabelspitze im Kopfknochen-Raum (einmal aus dem Modell gemessen): der am weitesten nach vorn liegende Punkt, der fast nur am Kopf hängt – dort hält er den Glanz
function whiskey_beakTip() { const S = whiskey_S; let sk = null; S.m.traverse(o => { if (o.isSkinnedMesh && !sk) sk = o; }); if (!sk || !S.head) return null;
  // Nutzer 02.10.: „Items im Schnabel schweben“ – vorher Suche entlang einer geschätzten Blickrichtung in der aktuellen Pose (Modell ist um 90° gedreht → falsche Seite, 28 cm daneben).
  // Jetzt posenunabhängig in der Ruhelage: Kopfpunkte (Gewicht ≥ 0,6 am Kopfknochen) in den Knochenraum (boneInverse · bindMatrix) – der vom Knochen am weitesten entfernte ist die
  // Schnabelspitze; gehalten wird 30 % davor, zwischen den Schnabelhälften.
  try { const bi = sk.skeleton.bones.indexOf(S.head), si = sk.geometry.attributes.skinIndex, sw = sk.geometry.attributes.skinWeight, pos = sk.geometry.attributes.position; if (bi < 0 || !si) return null;
    const M = new THREE.Matrix4().multiplyMatrices(sk.skeleton.boneInverses[bi], sk.bindMatrix), v = new THREE.Vector3(), best = new THREE.Vector3(); let bd = -1;
    for (let i = 0; i < si.count; i++) { let w = 0; for (let c = 0; c < 4; c++) if (si.getComponent(i, c) === bi) w += sw.getComponent(i, c); if (w < .6) continue;
      v.fromBufferAttribute(pos, i).applyMatrix4(M); const d = v.lengthSq(); if (d > bd) { bd = d; best.copy(v); } }
    if (bd <= 0) return null; return best.multiplyScalar(.7); } catch (e) { return null; } }
// ---------------------------------------------------------------- Nachahmungen (83 §3): vorhandene Aufnahme an der Rabenposition, leicht verstimmt (rate .92), Tiefpass
const WHISKEY_STIMMEN = { vegas: 'WHISKEY (MIT VEGAS’ STIMME)', luke: 'WHISKEY (MIT DEINER STIMME)', wolter: 'WHISKEY (MIT WOLTERS STIMME)', frau: 'WHISKEY (EINE FRAUENSTIMME)', hilde: 'WHISKEY (MIT HILDES STIMME)' };
const WHISKEY_MIMIC = {
  himmelherrgott: { v: 'vegas', t: 'Himmelherrgott!', taufe: true }, junge: { v: 'vegas', t: 'Junge.', taufe: true, einmal: true }, funk3110: { v: 'vegas', t: '… einunddreißig-zehn.', taufe: true },
  scheisse: { v: 'luke', t: 'Scheiße!' }, super: { v: 'luke', t: 'Super. Ganz toll.' }, bedauerlich: { v: 'wolter', t: 'Das ist bedauerlich.' }, bedauerlich_kurz: { v: 'wolter', t: 'Bedauerlich.' },
  hilde: { v: 'hilde', t: '… sieben. Acht.', einmal: true }, kum: { v: 'frau', t: 'Kum!', alt: 'Komm!', wort: true }, such: { v: 'frau', t: 'Such!', wort: true }, luna: { v: 'frau', t: 'Luna.', wort: true, einmal: true },
  pling: { s: 1 }, klingelton: { s: 1 }, kinderlachen: { s: 1 }, fahrrad: { s: 1 }, wecker: { s: 1 }, glocke: { s: 1 }, knurren: { s: 1 }, funk: { s: 1 }, wiegenlied: { s: 1 }, fauchen: { s: 1 },
  rehschrecken: { s: 1 }, grunzen: { s: 1 }, netzbrummen: { s: 1 }, ruestung: { s: 1 }, kuli: { s: 1 }, schrei: { s: 1 }, autotuer: { s: 1 }, standgas: { s: 1 }, telefonzelle: { s: 1 }, gurren: { s: 1 } };
// Klang-Ziel: Tiefpass → Raumposition des Raben (null = außer Hörweite)
function whiskey_dest(at, lp = 2600, dauer = 3) { const A = Audio; if (!A.ctx) return null; const g = whiskey_S.g, d = at ? A.at(at[0], at[1] + .25, at[2], 4) : A.at(g.position.x, g.position.y + .25, g.position.z, 4, { obj: g, h: .25, dauer }); if (A.cut) return null;
  const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; f.Q.value = .5; f.connect(d); return f; }
function whiskey_ton(f, t0, dur, peak, dest, type = 'sine', att = .006) { if (Audio.rabeTon && Audio.rabeTon(f * .92, t0, dur, peak, dest)) return null; // Rabenkehle (Modul klang), sonst Oszillator
  const o = Audio.osc(type, f * .92, t0, dur + .1); Audio.env(o, peak, att, dur, t0, dest); return o; }
function whiskey_klang(key, at) {
  const A = Audio, g = whiskey_S.g, p = at || [g.position.x, g.position.y, g.position.z], o = at ? { rate: .92, lp: 2600, x: p[0], y: p[1] + .2, z: p[2], ref: 4 } : { rate: .92, lp: 2600, obj: g, h: .2, doppler: true, ref: 4 };
  const D = (s) => whiskey_dest(at, 2600, s);
  switch (key) {
    case 'pling': { const d = D(); if (!d) return; whiskey_ton(1318, 0, .6, .09, d); whiskey_ton(1760, .24, .6, .07, d); break; } // Oma Ernas Mikrowelle
    case 'klingelton': { const d = D(5); if (!d) return; for (let b = 0; b < 3; b++) for (let i = 0; i < 16; i++) { whiskey_ton(i % 2 ? 1180 : 960, b * 1.3 + i * .045, .05, .07, d, 'triangle', .002); } break; } // Wählscheibentelefon
    case 'telefonzelle': { const d = D(); if (!d) return; for (let b = 0; b < 2; b++) { whiskey_ton(440, b * .6, .4, .08, d); whiskey_ton(480, b * .6, .4, .08, d); } break; }
    case 'autotuer': { const d = D(); if (!d) return; for (let i = 0; i < 6; i++) whiskey_ton(740, i * .42, .18, .07, d, 'sine', .004); break; } // Warnsummen der offenen Autotür
    case 'fahrrad': { const d = D(); if (!d) return; [0, .2, .55].forEach((t0, i) => { whiskey_ton(2093, t0, i === 2 ? .9 : .22, .08, d); whiskey_ton(2093 * 2.76, t0, i === 2 ? .5 : .12, .02, d); }); break; }
    case 'wecker': { const d = D(); if (!d) return; for (let i = 0; i < 34; i++) whiskey_ton(i % 2 ? 2350 : 2250, i * .042, .035, .05, d, 'square', .002); break; }
    case 'glocke': { const d = D(28); if (!d) return; const at3 = [0, 1.6, 3.2], at13 = [...Array(13)].map((_, i) => 6.4 + i * 1.6); for (const t0 of [...at3, ...at13]) { whiskey_ton(311, t0, 1.4, .06, d); whiskey_ton(311 * 2.4, t0, .8, .025, d); } break; }
    case 'wiegenlied': { const d = D(); if (!d) return; [659, 587, 523, 494, 523].forEach((f, i) => { const osc = whiskey_ton(f * 2, i * .46, .38, .05, d, 'sine', .03); try { A.lfo(5.5, 9, osc.frequency); } catch (e) {} }); break; } // gepfiffen E D C H C, bricht ab
    case 'netzbrummen': { const d = D(); if (!d) return; whiskey_ton(50, 0, 2.2, .06, d, 'sawtooth', .2); whiskey_ton(100, 0, 2.2, .03, d, 'sine', .2); break; }
    case 'funk': { A.play('switch2', { ...o, gain: .35, rate: 1.1 }); const d = D(); if (!d) return; const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = 1.2; n.connect(bp); A.env(bp, .12, .01, .5, 0, d); n.stop(A.ctx.currentTime + 1);
      whiskey_ton(1000, .75, .14, .05, d, 'square', .004); break; } // Knacken, Rauschen, Quittungston
    case 'fauchen': { const d = D(); if (!d) return; const n = A.noise(false), hp = A.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800; n.connect(hp); A.env(hp, .14, .03, .6, 0, d); n.stop(A.ctx.currentTime + 1); break; }
    case 'kinderlachen': A.play('giggle', { ...o, rate: 1.38, gain: .32, offset: rand(0, .8), dur: 1.4, hp: 300 }); break;
    case 'knurren': A.play('undead1', { ...o, rate: .52, lp: 620, gain: .45, dur: 1.2 }); break;
    case 'rehschrecken': A.play('dog', { ...o, rate: 1.2, lp: 1500, gain: .45, dur: .32 }); A.play('dog', { ...o, rate: 1.16, lp: 1500, gain: .4, dur: .3, delay: .9 }); break;
    case 'grunzen': A.play('undead3', { ...o, rate: .5, lp: 520, gain: .45, dur: .7 }); break;
    case 'ruestung': for (let i = 0; i < 3; i++) A.play(A.pick('keys1', 'keys2'), { ...o, rate: .6, gain: .28, delay: i * .55, lp: 1800 }); A.play('metalHit2', { ...o, rate: .7, gain: .12, delay: 1.1 }); break;
    case 'kuli': A.play('switch1', { ...o, rate: 2.4, gain: .22 }); A.play('switch1', { ...o, rate: 2.5, gain: .2, delay: .22 }); break;
    case 'standgas': A.play('carEngine', { ...o, rate: .8 * .92, lp: 800, gain: .4, dur: 2.6, fadeIn: .3 }); break;
    case 'schrei': A.play('crow2', { ...o, rate: .5, lp: 3200, gain: 1, dur: 1.3 }); A.play('crow1', { ...o, rate: .56, lp: 2400, gain: .6, delay: .3, dur: 1 }); break; // kein Krächzen: ein Laut, den Luke noch nie gehört hat
    case 'gurren': A.play('crow1', { ...o, rate: .42, lp: 700, gain: .35, dur: .5 }); A.play('crow1', { ...o, rate: .4, lp: 650, gain: .3, delay: .45, dur: .45 }); break; // Taubenlaut (nur bei Kindern und Lucy)
  }
}
// Stimme in Rabenmund: kurzer, bandbegrenzter Krähenlaut in Silben – klingt nach Wort, nie sauber (Sprachausgabe X-1 ersetzt ihn später: stimmen_spielen)
function whiskey_stimme(M, key, at) {
  const A = Audio, g = at ? { position: { x: at[0], y: at[1], z: at[2] } } : whiskey_S.g, silben = Math.max(1, Math.round(M.t.replace(/[^aeiouäöüAEIOUÄÖÜ]/g, '').length * .8)), r = { vegas: .92, luke: 1.05, wolter: .86, frau: 1.25, hilde: 1.12 }[M.v] || 1;
  if (typeof stimmen_spielen === 'function') { try { if (stimmen_spielen('whiskey_' + key, [g.position.x, g.position.y, g.position.z])) return; } catch (e) {} }
  for (let i = 0; i < Math.min(silben, 6); i++) A.play('crow1', { rate: r * .92 * rand(.97, 1.04) * 1.4, lp: 1900, hp: 420, gain: .42, dur: .16, delay: i * .19, ...(at ? { x: at[0], y: at[1] + .25, z: at[2] } : { obj: g, h: .25 }), ref: 4 });
}
function whiskey_mimic(key, o = {}) {
  const S = whiskey_S, M = WHISKEY_MIMIC[key]; if (!M || !S.g) return false;
  if (S.light && !(key === 'luna' || (key === 'bedauerlich_kurz' && !S.said.has('nachW13')))) return false; // nach Miras Licht (02 E4): nur „Bedauerlich.“ einmal, dann „Luna.“
  if (M.taufe && !S.vegas_taufe) return key === 'himmelherrgott' ? whiskey_mimic('autotuer', o) : false; // ohne Taufe keine Vegas-Stimme (Nr. 25 springt ein)
  if (M.einmal && S.said.has(key)) return false;
  if ((S.mood === 'still' || whiskey_stumm()) && !o.force) return false;
  if (!o.at && (!S.g.visible || whiskey_unten())) return false;
  if (M.einmal) S.said.add(key); if (S.light && key === 'bedauerlich_kurz') S.said.add('nachW13');
  const p = o.at || null;
  if (M.s) whiskey_klang(key, p); else whiskey_stimme(M, key, p);
  if (M.t && !o.stumm) subtitle(`„${M.t}“` + (M.alt ? `<span style="opacity:.62;font-size:.8em;font-style:normal"> – alt für „${M.alt}“</span>` : ''), Math.max(M.alt ? 2400 : 1800, M.t.length * 90), WHISKEY_STIMMEN[M.v]); // Nutzer 02.10.: altes Wort übersetzen
  if (!o.at && S.mode === 'perch' && !o.still) { whiskey_play(M.s ? 'IdleLookAround' : 'EatSomething', .15); S.idleT = 1.4; S.puff = Math.max(S.puff, .5); }
  return true;
}
// Vogel-Gag rationieren (A-28): nach einem Dreier höchstens einmal je Kapitel der Lacher vom Raben
function whiskey_gag() { const S = whiskey_S, k = whiskey_k(); if (S.gag[k]) return false; S.gag[k] = 1; return true; }
// ---------------------------------------------------------------- Gänge (S.mood) und Gefahr
function whiskey_gefahr() {
  const P = player.pos; if (state.phase2 || (state.outage && !state.ch1Done && whiskey_k() === 1)) return true;
  if (ch2.chase === 'run' || ch3.chase === 'run' || stalker.visible) return true;
  if (grey.visible && Math.hypot(grey.position.x - P.x, grey.position.z - P.z) < 45) return true;
  if (hunt.on && whiskey_k() === 3) return true;
  if (whiskey_stumm()) return true;
  if (typeof lwo_gefahr === 'function') { try { if (lwo_gefahr()) return true; } catch (e) {} } // AP-05/06: Agenten, Blechmänner in der Nähe
  return false;
}
function whiskey_moodTick(dt) {
  const S = whiskey_S, st = S.st; let want = S.moodPick || 'eitel';
  const f = st && st.mood ? (typeof st.mood === 'function' ? st.mood() : st.mood) : '';
  if (f) want = f; else if (S.ignored >= 2) want = 'beleidigt';
  if (whiskey_gefahr() || S.forceStill > 0) want = 'still';
  if (S.forceStill > 0) S.forceStill -= dt;
  if (want !== S.mood) { const was = S.mood; S.mood = want; S.idleT = Math.min(S.idleT, .4);
    if (want === 'still' && was !== 'still') { whiskey_play('IdleLookAround', .35); if (S.cur) S.cur.timeScale = .04; } // er hört auf, sich zu bewegen
    if (was === 'still') { if (S.cur) S.cur.timeScale = 1; S.sacT = 0; } }
}
// ---------------------------------------------------------------- Klauen (K1-6): dreimal ignoriert → das zuletzt Aufgehobene, an der nächsten Station wieder da
const WHISKEY_NIE = new Set(['fibel', 'key', 'fuse', 'sicherung', 'zimmer7', 'villaschluessel', 'schluesselteile', 'feuerzeug', 'mamas_kerze', 'brechstange', 'drahtschneider', 'baumhausschluessel', 'autoschluessel', 'miras_ring', 'polaroid_kamera', 'buch', 'einwilligungen', 'lampe1', 'lampe2', 'lampe3', 'batterie', 'jonas_karte', 'nord_lantern', 'cleo_kreide']);
function whiskey_klau() {
  const S = whiskey_S; let what = null;
  if (typeof tausch_klaubar === 'function') what = tausch_klaubar(); // zuerst etwas Glänzendes aus der Tasche
  if (!what) for (let i = story.items.length - 1; i >= 0; i--) { const k = story.items[i]; if (!WHISKEY_NIE.has(k) && ITEMS[k]) { what = { item: k, name: ITEMS[k].name }; break; } }
  if (!what && FLASH.spare >= 3) what = { bat: 1, name: 'Batterie' }; // Zoll, nie die letzte
  if (!what) return false;
  if (what.item) story.items = story.items.filter(k => k !== what.item); if (what.bat) FLASH.spare -= 1;
  S.stolen.push(what); S.ignored = 0; S.moodPick = 'eitel'; whiskey_play('EatSomething', .1); whiskey_caw();
  toast('Whiskey hat etwas mitgenommen.', 3000); return true;
}
function whiskey_zurueck(x, y, z) { // an der nächsten Station: ordentlich in die Mitte gelegt
  const S = whiskey_S; if (!S.stolen.length || typeof tausch_drop !== 'function') return; const w = S.stolen.shift();
  tausch_drop(x, y, z, w, `Da liegt ${w.name.startsWith('Batterie') ? 'die Batterie' : '„' + w.name + '“'}. Ordentlich in die Mitte gelegt.`); }
// ---------------------------------------------------------------- Hilfesystem (83 §4): Stufe 1 nach ~4 min, dann je 3 min – nie die Lösung
function whiskey_helpSig() { return story.main + '|' + story.lore.length + '|' + story.items.length + '|' + (ch3.radio ? 1 : 0) + (ch3.lampsOff ? 1 : 0) + (state.hasKey ? 1 : 0) + '|' + whiskey_k5() + whiskey_k6() + '|' + whiskey_k(); }
function whiskey_helpTick(dt) {
  const S = whiskey_S; S.helpChk -= dt; if (S.helpChk > 0) return; S.helpChk = 1;
  const sig = whiskey_helpSig(); if (sig !== S.helpSig) { S.helpSig = sig; S.helpT = 0; S.helpLvl = 0; return; }
  if (state.talking || ui.overlay || whiskey_unten()) return; S.helpT += 1;
  const lvl = S.helpT > 600 ? 3 : S.helpT > 420 ? 2 : S.helpT > 240 ? 1 : 0; if (lvl <= S.helpLvl) return; S.helpLvl = lvl; S.help = Math.max(S.help, lvl);
  const st = S.st; if (!st || !st.help || S.mode === 'gone') return; const f = st.help[lvl - 1]; if (f) try { f(); } catch (e) { console.warn('Whiskey Hilfe', e); }
}
function whiskey_pick(n) { const S = whiskey_S; let i = 0; const peck = () => { if (!S.g.visible || S.mode !== 'perch') return; whiskey_play('EatSomething', .08, true, 1.4); Audio.play('woodHit1', { gain: .12, rate: 2.2, x: S.g.position.x, y: S.g.position.y, z: S.g.position.z, ref: 2 }); if (++i < n) setTimeout(peck, 420); else setTimeout(() => { i = 0; if (n === 3) setTimeout(() => { S.idleT = 1; }, 900); }, 1400); }; peck(); }
// ---------------------------------------------------------------- Szenen Kapitel 1
function whiskey_k1Start() { const S = whiskey_S; if (S.met.has('start')) return whiskey_ansehen(); S.met.add('start');
  subtitle('<i>Ein Rabe. Groß, schwarz, die Augen fast weiß. Der aus meinem Traum. Er sieht mich an, als hätte er auf mich gewartet.</i>', 4600, 'LUKE');
  setTimeout(() => { if (!state.talking) { subtitle('Du. Du warst im Traum. Du hast geredet.', 2600, 'LUKE'); setTimeout(() => { whiskey_mimic('gurren'); /* Gag-Budget H-1: das Pling gehört Nr. 4 */ setTimeout(() => subtitle('Okay. Hab ich mir eingebildet.', 2400, 'LUKE'), 1800); }, 2800); } }, 4800); } // K1-1
// W-02 (Teil 1): Annäherung an das Ortsschild – Fibel-Notiz über den Ring
function whiskey_w02a() { const S = whiskey_S; S.flags.add('w02a'); if (!whiskey_lore('whiskey_ring')) story.lore.push({ key: 'whiskey_ring', title: 'Der Ring am Fuß', html: '<span class="hand">Beringt. Ein Turm, darunter ein Strich wie ein Abgrund. Wer beringt einen Raben?</span>' });
  questPop('ABENTEUERFIBEL', 'Der Ring am Fuß'); whiskey_blick(player.pos.x, 1.4, player.pos.z, 3); }
// W-03 / K1-2: Autoschlüssel gegen Einkaufswagenchip (Anbieten-Menü, Kanon-Tausch)
function whiskey_w03() {
  const S = whiskey_S; if (!S.flags.has('w03a')) { S.flags.add('w03a'); state.talking = true;
    say([['Gib den her.', 1800, 'LUKE']]).then(async () => { whiskey_play('IdleScratchWing', .2); await wait(1400); await say([['Ich mein’s ernst. Das ist ein Leihwagen.', 2400, 'LUKE']]); whiskey_hop(1); await wait(900); whiskey_hop(-1); state.talking = false;
      whiskey_blick(player.pos.x, .9, player.pos.z, 5); S.hrT = .5; setTimeout(() => { S.hrT = 0; }, 2600); }); return; }
  if (typeof tausch_kanon !== 'function') return;
  tausch_kanon({ titel: 'Der Rabe mit dem Autoschlüssel', stimmung: 'Er hat deinen Autoschlüssel im Schnabel. Der Anhänger glänzt. Er sieht auf deine Hosentasche. Dann auf dich. Dann wieder auf die Tasche.',
    gibt: { n: 'Autoschlüssel', d: 'Dein Leihwagen. Der Anhänger glänzt nass.', i: 'key' }, will: 'chip',
    ab: { kaugummipapier: 'Er lässt es fallen. Verächtlich.', kronkorken: 'Er prüft ihn mit dem Schnabel. Dreht ihn. Lässt ihn fallen.' }, sonst: 'Er sieht nicht mal hin.',
    ok: () => { S.hatSchluessel = false; S.chip = true; S.flags.add('w03');
      modItem('autoschluessel', 'Autoschlüssel', 'Dein Leihwagen am Ortsschild. Ein bisschen Rabenspucke am Anhänger.', 'key'); addItem('autoschluessel');
      if (typeof strasse_autoZu === 'function') try { strasse_autoZu(); } catch (e) {} // Innenlicht und Türsummen aus (AP-13/14)
      setTimeout(async () => { state.talking = true; await say([['Ein Einkaufswagenchip. Du hast mich um einen Einkaufswagenchip erpresst.', 3600, 'LUKE'], ['<i>Ich hab gerade mit einem Vogel gehandelt. Und ich hab verloren.</i>', 3600, 'LUKE']]); state.talking = false; }, 600);
      setTimeout(() => { const L = [...lamps].sort((a, b) => Math.hypot(a.wx - S.g.position.x, a.wz - S.g.position.z) - Math.hypot(b.wx - S.g.position.x, b.wz - S.g.position.z))[0]; if (L) whiskey_hin(L.wx, L.wz, 5.28); }, 1800); } });
}
function whiskey_hop(side) { const S = whiskey_S; if (!S.g || S.mode !== 'perch') return; whiskey_play('Hop', .08, true, 1.3); const a = S.g.rotation.y + side * PI / 2; S.hopTo = { x: S.g.position.x + Math.sin(a) * .35, z: S.g.position.z + Math.cos(a) * .35, t: 0 }; }
// W-03-Hilfe nach zwei Minuten: Gedanke
function whiskey_w03Hilfe(dt) { const S = whiskey_S; if (!S.hatSchluessel || !S.flags.has('w03a') || S.flags.has('w03h')) return; S.w03T = (S.w03T || 0) + dt; if (S.w03T > 120 && whiskey_d(-72.3, 6.3) < 12 && !state.talking) { S.flags.add('w03h'); subtitle('<i>Der guckt auf meine Hosentasche wie Lucy früher auf die Kasse vom Kiosk.</i>', 4600, 'LUKE'); } }
function whiskey_autoVerloren() { const S = whiskey_S; if (!S.hatSchluessel || whiskey_lore('whiskey_auto') || whiskey_d(-72.3, 6.3) < 60) return; story.lore.push({ key: 'whiskey_auto', title: 'Autoschlüssel', html: '<span class="hand">Autoschlüssel: bei einem Vogel.</span>' }); }
// K1-5: Putzen (Hilfe Stufe 3 am Briefkasten)
function whiskey_k15() { const S = whiskey_S; if (S.flags.has('k1_5')) return; S.flags.add('k1_5'); whiskey_play('IdleScratchWing', .2); state.talking = true;
  setTimeout(async () => { await say([['Ja. Ja, ich hab’s verstanden. Du musst nicht so tun, als wär ich hier der Langsamste.', 4200, 'LUKE']]); whiskey_pick(1); await wait(1400); await say([['… Okay. Bin ich.', 2000, 'LUKE']]); state.talking = false; }, 2600); }
// W-01 / W-02 (Teil 2): Vegas tauft ihn. Brunos Knurren kommt vom Raben.
async function whiskey_w01() {
  const S = whiskey_S; if (S.flags.has('w01') || state.talking) return; S.flags.add('w01'); state.talking = true; whiskey_mimic('knurren', { force: true });
  const V = (t, ms) => [t, ms, 'LARS VEGAS (HINTER DER TÜR)'], L = (t, ms) => [t, ms, 'LUKE'];
  const lines = [V('„Lass den Vogel in Ruhe, Junge. Das ist Whiskey. Sitzt jeden Abend auf meinem Geländer, wenn ich einen trink. Gehört keinem.“', 5200), L('Whiskey.', 1400),
    V('„Nach Papas Flasche. Ich war neun. Der Vogel ist älter als ich. Der saß schon ’75 auf der Laterne, als die Blechmänner kamen.“', 5600), L('Raben werden keine fünfzig.', 2200),
    V('„Der auch nicht. Der wird gar nichts. Der ist einfach.“', 3200)];
  try { if (typeof albers_whiskey === 'function') await albers_whiskey(lines, { still: true }); else await say(lines); } catch (e) { console.warn('Whiskey W-01', e); }
  S.named = true; S.vegas_taufe = true; state.talking = false; Audio.play('crow1', { gain: .7, rate: .95, x: S.g.position.x, y: S.g.position.y, z: S.g.position.z, ref: 5 }); // es klingt nach einem Lachen
  if (!whiskey_lore('whiskey_name')) story.lore.push({ key: 'whiskey_name', title: 'Whiskey', html: '<span class="hand">Whiskey. Vegas sagt, er heißt so, seit Vegas neun war. Vegas sagt viel.</span>' });
  questPop('ABENTEUERFIBEL', 'Whiskey');
}
function whiskey_w02b() { const S = whiskey_S; S.flags.add('w02'); state.talking = true;
  say([['Ein Ring. Aus Eisen. Da ist was drin … ein Turm. Über einem Loch. Wer beringt einen Raben mit einem Turm?', 4800, 'LUKE']]).then(() => { state.talking = false; });
  const l = story.lore.find(x => x.key === 'whiskey_ring'), html = '<span class="hand">Beringt. Ein Turm, darunter ein Strich wie ein Abgrund. Wer beringt einen Raben?</span>\n\n' + whiskey_ringSkizze();
  if (l) l.html = html; else story.lore.push({ key: 'whiskey_ring', title: 'Der Ring am Fuß', html }); questPop('ABENTEUERFIBEL', 'Skizze: der Ring'); }
function whiskey_ringSkizze() { // Bleistiftskizze in der Fibel: Ring mit Turm über Abgrund
  return '<svg viewBox="0 0 220 120" style="width:220px;height:120px;display:block;margin:6px 0 0 8px" fill="none" stroke="#2b2a33" stroke-width="1.6" stroke-linecap="round"><ellipse cx="70" cy="60" rx="46" ry="30"/><ellipse cx="70" cy="60" rx="34" ry="21" stroke-width="1"/>'
    + '<path d="M62 52v-14h4v-4h4v4h4v14"/><path d="M54 64c6-3 26-3 32 0M58 70c4-5 20-5 24 0" stroke-width="1.2"/><path d="M130 30c20 2 40 14 52 34" stroke-dasharray="3 4" stroke-width="1"/><text x="136" y="92" font-family="Caveat" font-size="20" fill="#1e2b5c" stroke="none">links!</text></svg>'; }
// K1-4 „Speck um elf“ (W-04b): drei Besuche an Vegas’ Tür
// Ein Besuch zählt, wenn Luke nach der Taufe weg war (> 18 m, im Takt gemerkt) und wieder an die Tür kommt: zweiter Besuch Speck, dritter Nudelsieb
function whiskey_speckAktiv() { const S = whiskey_S; return whiskey_k() === 1 && S.flags.has('w01') && S.speck < 3 && (S.speckWeg || S.speckBusy) && !state.phase2 && !state.outage && whiskey_d(-28, -12.35) < 14; }
function whiskey_speckNah(d) { const S = whiskey_S; if (!S.speckWeg || d > 6 || S.speckBusy) return; S.speckBusy = true; S.speck++; if (S.speck === 1) whiskey_speck1(); else whiskey_speck3(); }
async function whiskey_speck1() {
  const S = whiskey_S; state.talking = true; const V = (t, ms) => [t, ms, 'LARS VEGAS (HINTER DER TÜR)'], L = (t, ms) => [t, ms, 'LUKE'];
  const lines = [V('„Nachts kommen die. Da muss einer wach sein.“', 3000), async () => { whiskey_play('EatSomething', .08, true, 1.2); Audio.play('woodHit2', { gain: .15, rate: 1.6, x: -28, y: 1.2, z: -12.3 }); await wait(700);
      Audio.chains(-28, 1.2, -12.3); Audio.play(Audio.pick('woodSlam1', 'woodSlam2'), { gain: .8, x: -28, y: 1.2, z: -12.3, ref: 3 }); await wait(300); },
    V('„Himmelherrgott!“', 1600), async () => { const L_ = [...lamps].sort((a, b) => Math.hypot(a.wx + 28, a.wz + 12) - Math.hypot(b.wx + 28, b.wz + 12))[0]; if (L_) whiskey_hin(L_.wx, L_.wz, 5.28); await wait(2400); whiskey_mimic('himmelherrgott', { force: true }); await wait(1800); },
    V('„Du hast nichts gesehen.“', 2000), L('Ich hab gar nichts gesehen.', 2000), async () => { whiskey_play('EatSomething', .1); await wait(900); },
    V('„Speck ist Speck. Der Vogel kriegt keinen. Das ist keine Verschwörung, das ist Prinzip.“', 4400), L('<i>Er hat die Kompression falsch. Wer bringt einem Vogel Kompression bei?</i>', 3600)];
  try { if (typeof albers_whiskey === 'function') await albers_whiskey(lines); else await say(lines.filter(l => Array.isArray(l))); } catch (e) { console.warn('Whiskey Speck', e); }
  state.talking = false; S.speckWeg = false; S.speckBusy = false; }
// ---------------------------------------------------------------- Vegas' Speckfalle am Küchenfenster (Nr. 3): gusseiserne Pfanne mit Speckstreifen, ein Nudelsieb (Lochblech) umgedreht darüber – darauf sitzt der Rabe (K1-4, dritter Besuch)
function whiskey_pfanneBau() { const T = THREE, g = new T.Group(), eisen = new T.MeshStandardMaterial({ color: 0x232325, metalness: .85, roughness: .52 }), eisenR = new T.MeshStandardMaterial({ color: 0x2c2926, metalness: .8, roughness: .8 });
  // Pfanne (Ø 24 cm): Boden, schräg ansteigende Wand, umgelegter Rand, Gießschnauzen an beiden Seiten, Stiel mit Aufhängeloch; Innenseite mit eingebranntem Fett
  const prof = [[0, 0], [.088, 0], [.097, .004], [.112, .024], [.122, .042], [.1255, .046], [.1245, .0485], [.118, .0485], [.1155, .046], [.106, .03], [.092, .01], [.084, .0068], [0, .0068]].map(p => new T.Vector2(p[0], p[1]));
  const bodenFett = new T.MeshStandardMaterial({ color: 0x141312, metalness: .5, roughness: .32 }), wanne = new T.Mesh(new T.LatheGeometry(prof, 40), eisen); wanne.castShadow = wanne.receiveShadow = true; g.add(wanne);
  const innen = new T.Mesh(new T.CircleGeometry(.0875, 36), bodenFett); innen.rotation.x = -PI / 2; innen.position.y = .0072; g.add(innen);
  const stielS = new T.Shape(); stielS.moveTo(0, -.0125); stielS.lineTo(.17, -.0095); stielS.absarc(.17, 0, .0095, -PI / 2, PI / 2, false); stielS.lineTo(0, .0125); stielS.lineTo(0, -.0125);
  const loch = new T.Path(); loch.absarc(.177, 0, .0042, 0, PI * 2, true); stielS.holes.push(loch);
  const stiel = new T.Mesh(new T.ExtrudeGeometry(stielS, { depth: .006, bevelEnabled: true, bevelSize: .0008, bevelThickness: .0008, bevelSegments: 1, curveSegments: 12 }), eisen); stiel.rotation.x = -PI / 2; stiel.rotation.z = 0; stiel.position.set(.118, .043, 0); stiel.rotation.y = 0; g.add(stiel);
  stiel.rotation.x = PI / 2; stiel.position.set(.118, .0475, .003); // Stiel liegt waagerecht, leicht angehoben
  const niet = new T.Mesh(new T.CylinderGeometry(.0042, .0042, .012, 8), eisenR); niet.position.set(.127, .0475, 0); g.add(niet);
  for (const s of [-1, 1]) { const sn = new T.Mesh(new T.ConeGeometry(.012, .016, 8, 1, true, 0, PI), eisen); sn.position.set(0, .045, s * .1245); sn.rotation.set(0, s > 0 ? 0 : PI, PI / 2); } // Schnauzen weggelassen (nur Wulst)
  // Speck: drei Streifen, rosa/weiß gestreift, leicht gewellt, in der Pfanne
  const speck = new T.MeshStandardMaterial({ map: kirchberg_tex(kirchberg_cnv(128, 32, (x, w, h) => { x.fillStyle = '#e9d8c4'; x.fillRect(0, 0, w, h); const sz = [['#b7584a', 3], ['#d98a78', 4], ['#c26a58', 2], ['#e9d8c4', 3], ['#a64a3e', 4]]; let y = 0; for (let k = 0; k < 14; k++) { const [c, t] = sz[k % 5]; x.fillStyle = c; x.fillRect(0, y, w, t * 1.1); y += t * 1.1; } for (let i = 0; i < 80; i++) { x.fillStyle = `rgba(80,30,20,${Math.random() * .25})`; x.fillRect(Math.random() * w, Math.random() * h, 3, 1); } })), roughness: .45 });
  for (const [dx, dz, ry, L] of [[-.02, -.03, .15, .11], [.015, .01, -.1, .105], [-.01, .045, .25, .1]]) { const sg = new T.PlaneGeometry(L, .022, 14, 2), P = sg.attributes.position; for (let i = 0; i < P.count; i++) P.setZ(i, Math.sin(P.getX(i) * 60) * .0022 + .0016); sg.computeVertexNormals();
    const st = new T.Mesh(sg, speck); st.rotation.set(-PI / 2, 0, ry); st.position.set(dx, .0085, dz); st.material.side = T.DoubleSide; g.add(st); }
  g.userData.noCol = true; g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); return g; }
// Nudelsieb: Halbkugel aus Lochblech (Löcher als Alphamaske, 6-mm-Raster), Fußring oben, zwei seitliche Griffe, Randring – umgedreht, Rand liegt auf dem Pfannenrand
function whiskey_siebBau() { const T = THREE, g = new T.Group(), R = .135;
  const lochTex = (() => { const c = document.createElement('canvas'); c.width = 256; c.height = 256; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#000'; for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { x.beginPath(); x.arc((i + (j % 2 ? .5 : 0) + .5) * 16, (j + .5) * 16, 4.6, 0, 7); x.fill(); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(10, 3.2); return t; })();
  const blech = new T.MeshStandardMaterial({ color: 0xaeb2b6, metalness: .95, roughness: .34, side: T.DoubleSide, alphaMap: lochTex, alphaTest: .5, transparent: false });
  const dom = new T.Mesh(new T.SphereGeometry(R, 40, 14, 0, PI * 2, 0, PI / 2 * .92), blech); dom.castShadow = true; g.add(dom);
  const vollM = new T.MeshStandardMaterial({ color: 0xaeb2b6, metalness: .95, roughness: .3 });
  const rand = new T.Mesh(new T.TorusGeometry(R * Math.sin(PI / 2 * .92), .0032, 8, 48), vollM); rand.rotation.x = PI / 2; rand.position.y = R * Math.cos(PI / 2 * .92); g.add(rand);
  const fuss = new T.Mesh(new T.TorusGeometry(.036, .0042, 8, 24), vollM); fuss.rotation.x = PI / 2; fuss.position.y = R - .003; g.add(fuss);
  const kappe = new T.Mesh(new T.CircleGeometry(.036, 24), vollM); kappe.rotation.x = -PI / 2; kappe.position.y = R + .0008; g.add(kappe);
  const ry = R * Math.sin(PI / 2 * .92), yh = R * Math.cos(PI / 2 * .92);
  for (const s of [-1, 1]) { const gr = new T.Mesh(new T.TorusGeometry(.03, .0038, 8, 20, PI), vollM); gr.position.set(s * (ry + .008), yh + .004, 0); gr.rotation.set(0, PI / 2, s > 0 ? -PI / 2 : PI / 2); g.add(gr); const bl = new T.Mesh(new T.BoxGeometry(.016, .002, .02), vollM); bl.position.set(s * (ry - .002), yh + .0, 0); g.add(bl); }
  g.userData.noCol = true; g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); return g; }
// Falle auf die Fensterbank von Nr. 3 setzen: Höhe der Bank per Strahl (die Bank liegt als Kiste unter dem Fenster, fassaden.js), Sieb liegt auf dem Pfannenrand
function whiskey_falleSetzen() { const S = whiskey_S; if (S.falle) return S.falle; try { const T = THREE, p = whiskey_pfanneBau(), sb = whiskey_siebBau(), rc = new T.Raycaster(), cx = -25.0; rc.camera = camera; let best = null;
    scene.updateMatrixWorld(true); for (const z of [-12.12, -12.08, -12.16, -12.04]) { rc.set(new T.Vector3(cx, 1.5, z), new T.Vector3(0, -1, 0)); rc.far = 1.5; const h = rc.intersectObjects(scene.children, true).find(q => q.object.isMesh && q.object.visible && !q.object.isSprite && (!q.object.material || !q.object.material.transparent || q.object.material.opacity > .5)); if (h && h.point.y > .7 && h.point.y < 1.45) { best = { y: h.point.y, z }; break; } }
    const y = best ? best.y : 1.0, z = best ? best.z : -12.12; p.position.set(cx, y, z); p.rotation.y = -.5; sb.position.set(cx, y + .0485, z); sb.rotation.y = .4; scene.add(p, sb); p.visible = sb.visible = false; S.falle = { p, sb, y, z, top: y + .0485 + .135 + .006 }; } catch (e) { console.warn('Whiskey: Falle', e); S.falle = { fehler: true, top: 1.18, z: -12.2 }; }
  return S.falle; }
function whiskey_speck3() { const S = whiskey_S, F = whiskey_falleSetzen(); whiskey_setzen(-25, F.top ? F.top + .015 : 1.18, F.z ?? -12.2, () => whiskey_play('IdleScratchWing', .2));
  setTimeout(() => subtitle('<i>Eine Pfanne am gekippten Küchenfenster, ein Nudelsieb drüber. Und auf dem Sieb: der Vogel.</i>', 4400, 'LUKE'), 2600);
  setTimeout(() => { S.speck = 3; S.speckWeg = false; S.speckBusy = false; }, 14000); }
// W-04 „Über dem Lager“
function whiskey_scheune() { const R = typeof OW !== 'undefined' && OW.dbg && OW.dbg.barnRect; return R ? [R.x0 + .55, 2.95, (R.z0 + R.z1) / 2 + .4] : [-144.7, 2.95, -27.6]; } // über dem Blatt im Heu (SB-01, sammeln.js)
function whiskey_w04() { const S = whiskey_S; S.flags.add('w04'); S.forceStill = 0; state.talking = true;
  say([['Da ist das Zeichen. Von deinem Ring. Hier schläft jemand.', 3200, 'LUKE'], ['… Hier schläft jemand seit sehr langer Zeit.', 3000, 'LUKE']]).then(() => { state.talking = false; }); }
// K1-7 / 02 I3: Giselas LWO-Kuli gegen den Deckel der Katzenfutterdose (Ort setzt AP-15 mit whiskey_ort('gisela', …))
function whiskey_kanonGisela() {
  if (typeof tausch_kanon !== 'function') return; const S = whiskey_S;
  tausch_kanon({ titel: 'Der Kuli vom Fensterbrett', stimmung: 'Er hat den Kugelschreiber vom Fensterbrett, bevor du ihn hattest. Er hält ihn fest und sieht auf die Futterdose in deiner Hand.',
    gibt: { n: 'Kugelschreiber mit Auge', d: 'Grau, ein Auge auf dem Clip. Nicht Giselas.', i: 'paper' }, will: 'dosendeckel', ab: { kaugummipapier: 'Er lässt es fallen.' }, sonst: 'Er dreht den Kopf weg.',
    ok: () => { S.flags.add('kuli'); modItem('lwo_kuli', 'Kugelschreiber mit Auge', 'Grau, ein Auge auf dem Clip. Lag auf Giselas Fensterbrett. Whiskey wollte ihn nur gegen den Dosendeckel hergeben.', 'paper'); addItem('lwo_kuli');
      if (typeof kirchberg_kuli === 'function') try { kirchberg_kuli(); } catch (e) {} setTimeout(() => subtitle('„Sag ich doch. Der Vogel kriegt nix. Der nimmt sich.“', 3600, 'GISELA'), 900); } });
}
// ---------------------------------------------------------------- Kapitel 2 und 3
// W-05: Schrei an der ersten Stufe (Tick), K2-2 „Oben wartet einer“
async function whiskey_schacht() {
  const S = whiskey_S; if (S.flags.has('k2_2') || state.talking) return; S.flags.add('k2_2'); state.talking = true; whiskey_caw({ gain: 1 });
  try { await say([['SCHEISSE!', 1400, 'LUKE']]); await wait(600); whiskey_mimic('scheisse', { force: true }); await wait(1900); await say([['… Das war jetzt neu.', 2200, 'LUKE']]); whiskey_play('IdleScratchWing', .2); }
  finally { state.talking = false; }
  const tr = typeof lwo_S !== 'undefined' ? lwo_S.trust : story.lwo ? story.lwo.trust : 50; if (tr < 30) setTimeout(() => { subtitle('„Wer da?“', 1800, 'EINE MÄNNERSTIMME IM NEBEL'); whiskey_S.forceStill = 6; }, 2400);
}
// K3-0: dreimal „Scheiße“ an der Kreuzung – beim dritten Mal sagt er es gleichzeitig (Aufruf aus lucy3/Basis, wenn Luke flucht)
function whiskey_fluch() { const S = whiskey_S; if (whiskey_k() !== 3 || S.flags.has('k3_0')) return false; S.fluch++; if (S.fluch < 3) return false; S.flags.add('k3_0'); whiskey_mimic('scheisse', { stumm: true });
  setTimeout(() => subtitle('Das ist mein Wort. Such dir ein eigenes.', 2800, 'LUKE'), 1300); return true; }
// W-06: Justins Handschuh
function whiskey_justinHand() { const j = justin.g, a = j.rotation.y; return [j.position.x + Math.cos(a) * .42 + Math.sin(a) * .28, 1.06, j.position.z - Math.sin(a) * .42 + Math.cos(a) * .28]; }
function whiskey_justinSchulter() { const j = justin.g, a = j.rotation.y; return [j.position.x - Math.cos(a) * .24, 1.86, j.position.z + Math.sin(a) * .24]; }
async function whiskey_w06() {
  const S = whiskey_S; if (S.jAsked) return; S.jAsked = true; state.talking = true; Audio.play('woodHit1', { gain: .1, rate: 2.8, x: S.g.position.x, y: S.g.position.y, z: S.g.position.z, ref: 2 }); // Schnabelklappern
  try { await wait(900); await say([['„Wîse. Du alter Dieb.“', 2600, 'JUSTIN'], ['Der heißt Whiskey.', 2000, 'LUKE'], ['„Euer Nachbar glaubt, er hat ihn getauft. Der Vogel hat sich den Namen ausgesucht. Er gehörte meiner Frau.“', 5200, 'JUSTIN']]);
    whiskey_mimic('gurren', { force: true }); S.puff = 1; // macht sich klein, wie bei Kindern
    if (whiskey_lore('feder_stuhl8') || whiskey_lore('sb04') || whiskey_sb(4)) await say([['<i>Eine Rabenfeder im Helmband. Wie die unten am Stuhl. Dann warst du das, da unten.</i>', 4200, 'LUKE']]);
    await say([['„Er findet immer heim. Zu ihr.“', 2800, 'JUSTIN']]); }
  finally { state.talking = false; }
  const i = story.lore.findIndex(l => l.key === 'whiskey_justin'), e = { key: 'whiskey_justin', title: 'Whiskey', html: 'Justin nennt ihn Wîse. Er gehörte seiner Frau. „Er findet immer heim. Zu ihr.“' }; if (i >= 0) story.lore[i] = e; else story.lore.push(e);
  S.flags.add('w06'); setTimeout(() => subtitle('<i>Er redet von ihr, als wäre sie nicht tot. Als würde sie noch kommen.</i>', 4200, 'LUKE'), 900);
}
// W-07 Teil 1, Stufe 3: Vegas hat es gesagt, der Vogel erinnert nur daran
function whiskey_funk3110() { if (whiskey_mimic('funk3110')) setTimeout(() => subtitle('Das hat er aufgeschnappt. Bei Vegas. Natürlich.', 3200, 'LUKE'), 2200); else whiskey_mimic('funk'); }
// W-07 Teil 2: zwei krumme Striche in den Staub (lucy3.js ruft das nach zwei falschen Sendungen oder drei Minuten)
function whiskey_schreibgeste() { const S = whiskey_S; whiskey_setzen(5.4, 1.12, -6.6, () => { whiskey_pick(2); Audio.play('scrape1', { gain: .1, rate: 2.2, x: 5.4, y: 1.1, z: -6.6, ref: 2, dur: .4 });
    setTimeout(() => { subtitle('Schreiben. Ja. Danke. Ich kann auch selber –', 2800, 'LUKE'); whiskey_play('IdleScratchWing', .2); }, 1600); }); }
// W-08: nach Nimmerheim der erste Laut (A-28: in Kap. 3 kein Mikrowellen-Pling – das Gurren trägt den Moment)
function whiskey_ersterLaut() { whiskey_mimic('gurren', { force: true }); }
// Vegas-Tausch Kapitel 3: kleiner Messingschlüssel gegen eine Batterie (Cleos Kiste)
function whiskey_kanonVegas() {
  const S = whiskey_S; if (S.trade) return toast('Whiskey putzt sich. Der Schlüssel ist weg – er hat ihn dir gegeben, und er bereut nichts.', 3600);
  if (typeof tausch_kanon !== 'function') return;
  tausch_kanon({ titel: 'Ein kleiner Messingschlüssel', stimmung: 'Er hat etwas im Schnabel: einen kleinen Messingschlüssel. Er legt den Kopf schief. Er will tauschen – gegen etwas, das glänzt.',
    gibt: { n: 'Kleiner Messingschlüssel', d: 'In den Bart ist ein „C“ gefeilt.', i: 'key' }, will: 'batterie', ab: { kaugummipapier: 'Das Kaugummipapier fällt runter.', lesebrille: 'Die Lesebrille setzt er sich nicht auf. Obwohl man es kurz denkt.' }, sonst: 'Er prüft es. Er will etwas anderes.',
    ok: () => { S.trade = true; addItem('baumhausschluessel'); toast('Du hältst ihm eine Batterie hin. Er nimmt sie, prüft sie mit dem Schnabel – und lässt einen kleinen Messingschlüssel in deine Hand fallen.', 5200);
      setTimeout(() => subtitle('Du bist ein Hehler mit Federn.', 2600, 'LUKE'), 1600); } }); // STORY-HOOK: Schlüssel zu Cleos Kiste im Baumhaus
}
// ---------------------------------------------------------------- Kapitel 4 (Aufrufe aus villa.js/anwesen.js, AP-19)
// W-09: der Klingelton vom Fenster, dann „Himmelherrgott!“ aus dem Garten
async function whiskey_w09(fenster, garten) { const S = whiskey_S; if (S.flags.has('w09')) return; S.flags.add('w09'); const [x, y, z] = fenster; whiskey_setzen(x, y, z); await wait(2200);
  whiskey_mimic('klingelton', { force: true }); await wait(7000); whiskey_mimic('himmelherrgott', { force: true, at: garten || [x + 6, 1.5, z - 6] }); }
function whiskey_w09Ende() { whiskey_play('IdleScratchWing', .2); setTimeout(() => { subtitle('Das war knapp. Das war so knapp, und du hast es absichtlich knapp gemacht.', 3800, 'LUKE'); setTimeout(() => whiskey_mimic('klingelton', { force: true }), 4000); }, 900); }
// W-10: der Handschuh (Galerie, still; dann ein Schlag)
function whiskey_w10(galerie, hand) { const S = whiskey_S; S.flags.add('w10'); if (galerie) { S.g.visible = true; S.fl = null; S.mode = 'perch'; S.g.position.set(...galerie); S.forceStill = 40; }
  return { schlag: () => { S.forceStill = 0; if (hand) whiskey_fly(new THREE.Vector3(...hand), () => whiskey_leave()); S.flags.add('handschuh'); } }; }
// W-11: Miras Ring auf dem Schreibtisch – „Kum!“ aus dem Arbeitszimmer
function whiskey_w11(tisch) { const S = whiskey_S; if (S.flags.has('w11')) return; S.flags.add('w11'); const [x, y, z] = tisch; S.g.visible = true; S.fl = null; S.mode = 'perch'; S.g.position.set(x, y, z);
  S.forceStill = 0; whiskey_mimic('kum', { force: true }); return { ring: () => { S.ring = true; modItem('miras_ring', 'Miras Ring', 'Ein halber Mond, klein, für eine Frauenhand. Whiskey hat ihn gebracht. Er passt in meine Narbe, als wär die Narbe dafür gemacht. Sie ist dafür gemacht.', 'key'); addItem('miras_ring'); } }; }
function whiskey_suchBild(pos) { whiskey_setzen(...pos, () => { whiskey_pick(3); setTimeout(() => whiskey_mimic('such', { force: true }), 1500); }); }
// K4-6: oben am Treppengeländer, schreit; klopft durch die Decke; hört auf, wenn im Glas etwas sich bewegt
function whiskey_kellertreppe(pos, unten) { const S = whiskey_S; if (pos) { whiskey_setzen(...pos); if (!S.flags.has('k4_6')) { S.flags.add('k4_6'); setTimeout(() => whiskey_mimic('schrei', { force: true }), 1200); } }
  clearInterval(S.klopf); if (unten) S.klopf = setInterval(() => { if (!S.g.visible) return; Audio.play('woodHit1', { gain: .5, rate: 1.4, x: S.g.position.x, y: S.g.position.y, z: S.g.position.z, ref: 3 }); }, 3200); }
function whiskey_zoll() { const S = whiskey_S; addBattery(3); S.flags.add('k4_1'); setTimeout(() => subtitle('„Der nimmt Zoll. Seit fünfundsiebzig.“', 3000, 'LARS VEGAS'), 800); } // K4-1: vier gereicht, drei fallen vor die Füße
// K4-4 „Papas Marke“: der rostige Kronkorken, daneben der Einkaufswagenchip (02 I3)
async function whiskey_papasMarke() {
  const S = whiskey_S; if (S.flags.has('k4_4') || state.talking) return; S.flags.add('k4_4'); state.talking = true; whiskey_setzen(-25, 1.18, -12.3); await wait(2200); whiskey_play('EatSomething', .1, true);
  Audio.play('metalHit1', { gain: .12, rate: 2.4, x: -25, y: 1.1, z: -12.3, ref: 2 }); await wait(900);
  const V = (t, ms) => [t, ms, 'LARS VEGAS'];
  const lines = [V('„… Das ist Papas Marke. Die hat er immer auf der Veranda getrunken. Ich hab den Vogel nach der Flasche genannt.“', 5600), async () => { await wait(2400); },
    V('„Wo hast du den her, du Mistvieh.“', 2600), async () => { whiskey_play('IdleScratchWing', .2); await wait(1200); }, ['Er tauscht. Er hat den Chip die ganze Zeit behalten, um ihn gegen was Besseres zu tauschen.', 4200, 'LUKE']];
  try { if (typeof albers_whiskey === 'function') await albers_whiskey(lines); else await say(lines.filter(l => Array.isArray(l))); } finally { state.talking = false; }
  S.chip = false; if (typeof tausch_gib === 'function') tausch_gib('chip', 1, true); if (!whiskey_lore('whiskey_papa')) story.lore.push({ key: 'whiskey_papa', title: 'Papas Marke', html: 'Ein Kronkorken, rostig, eine Marke, die es seit Jahrzehnten nicht mehr gibt. Vegas hat ihn lange gehalten.\n\nDaneben lag, wie zufällig, mein Einkaufswagenchip.\n\n<span class="hand">Er hebt auf, was man ihm gibt. Auch wenn’s nur ein Chip ist.</span>' });
  if (typeof neben4_marke === 'function') neben4_marke(); // AP-20: Nebenaufgabe „Papas Marke“ (Fibel, Chip am Schlüsselbund)
}
// ---------------------------------------------------------------- Kapitel 5
function whiskey_k50(d) { const S = whiskey_S; if (S.flags.has('k5_0') || d > 9 || state.talking) return; S.flags.add('k5_0'); S.moodPick = 'beleidigt';
  setTimeout(() => { Audio.play('woodHit2', { gain: .22, rate: 1.5, x: -25, y: 1.2, z: -12.6, ref: 3 }); /* Gag-Budget H-1: kein „Himmelherrgott!“ in Kap. 5 */ setTimeout(() => { whiskey_play('EatSomething', .1, true); Audio.play('woodHit2', { gain: .1, rate: 1.8, x: -27.2, y: 1.2, z: -11.2 }); }, 2200);
    setTimeout(() => { Audio.play('stones1', { gain: .16, rate: 1.3, x: -28, y: .2, z: -25, ref: 3 }); whiskey_blick(-28, .3, -25, 6); S.flags.add('k5_0x'); }, 9000); }, 1200); }
function whiskey_kombi(pos) { const S = whiskey_S; whiskey_setzen(...pos, () => { whiskey_pick(3); setTimeout(() => whiskey_mimic('bedauerlich', { force: true }), 5200); }); } // K5-2 (Dialog: lwo.js)
function whiskey_w12nah(d) { const S = whiskey_S; if (d < 40 && !S.flags.has('w12_pfiff')) { S.flags.add('w12_pfiff'); whiskey_mimic('wiegenlied', { force: true }); }
  const P = player.pos; if (S.flags.has('w12_pfiff') && !S.flags.has('w12_kum') && P.x < -120 && P.x > -134 && P.z < -24 && P.z > -40) { S.flags.add('w12_kum'); whiskey_mimic('kum', { force: true }); setTimeout(() => whiskey_hin(-138.2, -30.1, 3.3), 1400); }
  if (S.flags.has('w12_kum') && !S.flags.has('w12_still') && d < 6) { S.flags.add('w12_still'); // von der Dachluke segelt eine lose Seite aufs Brett: SB-10 (Platz über sammeln.js)
    if (typeof sammeln_platz === 'function' && typeof sammeln_hatSB === 'function' && !sammeln_hatSB(10)) setTimeout(() => { const f = flatDir(); try { sammeln_platz('SB-10', { x: P.x + f.x * 1.1, z: P.z + f.z * 1.1, y: .2, label: 'Eine lose Seite, die Ecke eingeknickt' }); } catch (e) {} if (Audio.paper) Audio.paper(); Audio.flap(S.g.position.x, S.g.position.y, S.g.position.z); }, 2200); } }
function whiskey_w12(pos) { whiskey_S.flags.add('w12_still'); if (pos) whiskey_setzen(...pos); } // AP-21: im Stall, still, macht sich klein
// ---------------------------------------------------------------- Kapitel 6
function whiskey_thermosdeckel() { whiskey_S.flags.add('k6_1'); } // K6-1 (AG-18, lwo.js): er hat den Deckel
function whiskey_deckelHin() { const S = whiskey_S; S.flags.add('deckel'); if (typeof tausch_drop !== 'function' || !S.g) return; const p = S.g.position; tausch_drop(player.pos.x + (p.x - player.pos.x) * .15, Math.max(0, solidGround(player.pos.x, .6, player.pos.z)), player.pos.z + (p.z - player.pos.z) * .15, { ware: 'thermosdeckel', name: 'Thermoskannendeckel' }, 'Wolters Thermoskannendeckel. Er hat ihn dir vor die Füße gelegt.'); }
function whiskey_kanonBaumhaus() {
  if (typeof tausch_kanon !== 'function') return; const S = whiskey_S;
  tausch_kanon({ titel: 'Der Schlüssel auf dem Baumhausdach', stimmung: 'Der kleine Messingschlüssel liegt zwischen seinen Füßen. Er sieht auf den grauen Deckel. Den, den er dir selbst gebracht hat.',
    gibt: { n: 'Kleiner Messingschlüssel', d: 'In den Bart ist ein „C“ gefeilt.', i: 'key' }, will: 'thermosdeckel', sonst: 'Er will den Deckel. Nur den.',
    ok: () => { S.trade = true; addItem('baumhausschluessel'); setTimeout(() => subtitle('Du hast mir die Bezahlung selber mitgebracht. Das ist … das ist Geldwäsche.', 4200, 'LUKE'), 900); } });
}
async function whiskey_k63() { // „Der halbe Riegel“ – der einzige Lacher zwischen Fraßstelle und Bau
  const S = whiskey_S; if (S.flags.has('k6_3') || state.talking) return; S.flags.add('k6_3'); state.talking = true;
  try { await say([['<i>Der letzte Müsliriegel. Haselnuss. Zerbröselt.</i>', 2800, 'LUKE'], ['Sag’s keinem. Vegas denkt, ich hab dich im Griff.', 3200, 'LUKE']]); whiskey_play('EatSomething', .1, true); await wait(1800); whiskey_mimic('junge', { force: true }); await wait(2000); }
  finally { state.talking = false; } }
function whiskey_bedauerlich() { const S = whiskey_S; if (!S.light || S.said.has('nachW13') || state.talking) return false; state.talking = true; if (!whiskey_mimic('bedauerlich', { force: true })) { state.talking = false; return false; } S.said.add('nachW13');
  setTimeout(async () => { await say([['Wo hast du DAS her? Nein. Nicht. Lass das.', 3000, 'LUKE']]); S.said.delete('nachW13'); whiskey_mimic('bedauerlich_kurz', { force: true }); S.said.add('nachW13'); await wait(1600); subtitle('<i>Der Kiefernzapfen trifft nicht.</i>', 2400); Audio.play('woodHit3', { gain: .2, rate: 1.5, x: S.g.position.x + 1, y: .3, z: S.g.position.z }); state.talking = false; }, 2600);
  return true; }
function whiskey_bringt(pos) { const S = whiskey_S; if (pos) whiskey_setzen(...pos); Audio.flap(S.g.position.x, S.g.position.y, S.g.position.z); setTimeout(() => Audio.paper && Audio.paper(), 900); } // W-14 (SB-12, kapitel6.js)
function whiskey_luna() { const S = whiskey_S; if (S.said.has('luna')) return false; if (S.g) { S.forceStill = 0; whiskey_blick(S.g.position.x - 30, S.g.position.y, S.g.position.z, 8); } return whiskey_mimic('luna', { force: true }); } // W-15, einmal im ganzen Spiel
// ---------------------------------------------------------------- Ansehen (ohne Szene): Lukes Blick, nie ein Satz des Raben
const WHISKEY_BLICKE = { eitel: ['Er putzt sich. Erst links, dann rechts, dann sieht er mich an. Dann noch mal links.', 'Er tut, als wäre ich nicht da. Er macht das gut.'],
  beleidigt: ['Er dreht mir den Rücken zu. Demonstrativ.', 'Er sieht an mir vorbei. Das hat er sich von Vegas abgeguckt.'],
  handel: ['Er legt den Kopf schief und sieht auf meine Jackentasche. Wie jemand, der eine Rechnung prüft.', 'Er klappert leise mit dem Schnabel. Das heißt wohl: Ich höre.'],
  still: ['Er bewegt sich nicht. Kein Laut. Der Kopf gerade.', 'Er ist still. Seit wann ist der Vogel still?'] };
function whiskey_ansehen() { const S = whiskey_S, L = WHISKEY_BLICKE[S.mood] || WHISKEY_BLICKE.eitel; subtitle('<i>' + L[(S.blickI = ((S.blickI || 0) + 1)) % L.length] + '</i>', 3800, 'LUKE'); }
function whiskey_label() { const S = whiskey_S, st = S.st, n = S.named ? 'Whiskey' : 'Rabe'; if (!st) return n;
  if (st.label && !S.flags.has(st.labelFlag)) return st.label;
  if (st.id === 'auto' && S.flags.has('w03a')) return n + ' · etwas anbieten';
  if (typeof tausch_moeglich === 'function' && tausch_moeglich() && (S.met.has(st.id) || typeof st.talk !== 'string')) return n + ' · tauschen';
  return n; }
function whiskey_klick() {
  const S = whiskey_S, st = S.st; if (!st || (S.mode !== 'perch' && S.mode !== 'ride') || state.talking) return;
  S.ignored = 0; if (S.moodPick === 'beleidigt') S.moodPick = 'eitel'; if (S.mood !== 'still') whiskey_caw({ gain: .5 });
  if (typeof st.talk === 'function') { const r = st.talk(); if (r !== false) return; }
  if (typeof st.talk === 'string' && !S.met.has(st.id)) { S.met.add(st.id); subtitle('<i>' + st.talk + '</i>', Math.max(3600, st.talk.length * 50), 'LUKE'); return; }
  if (whiskey_k() === 1 && S.flags.has('w01') && !S.flags.has('w02') && whiskey_d(S.g.position.x, S.g.position.z) < 4.5) return whiskey_w02b();
  if (typeof tausch_moeglich === 'function' && tausch_moeglich()) return tausch_offen();
  whiskey_ansehen();
}
// ---------------------------------------------------------------- Spielstand
MOD_SAVE.push(['whiskey', () => { const S = whiskey_S; return { met: [...S.met], trade: S.trade, named: S.named, mood: S.mood, ignored: S.ignored, said: [...S.said], stolen: S.stolen.slice(), help: S.help, ring: S.ring, light: S.light, vegas_taufe: S.vegas_taufe,
    hatSchluessel: S.hatSchluessel, chip: S.chip, flags: [...S.flags], speck: S.speck, gag: S.gag, jAsked: S.jAsked }; },
  v => { const S = whiskey_S; (v.met || []).forEach(m => S.met.add(m)); S.trade = !!v.trade || story.items.includes('baumhausschluessel') || story.lore.some(l => l.key === 'cleo_baumhaus'); S.named = !!v.named || S.trade;
    if (['eitel', 'beleidigt', 'handel', 'still'].includes(v.mood)) S.mood = v.mood; S.ignored = +v.ignored || 0; (v.said || []).forEach(k => S.said.add(k)); S.stolen = Array.isArray(v.stolen) ? v.stolen.slice() : [];
    S.help = +v.help || 0; S.ring = !!v.ring; S.light = !!v.light; S.vegas_taufe = !!v.vegas_taufe || S.named; S.hatSchluessel = !!v.hatSchluessel; S.chip = !!v.chip; // ältere Stände ohne die neuen Felder behalten die Standardwerte
    (v.flags || []).forEach(f => S.flags.add(f)); S.speck = +v.speck || 0; S.gag = v.gag && typeof v.gag === 'object' ? v.gag : {}; S.jAsked = !!v.jAsked || S.flags.has('w06') || story.lore.some(l => l.key === 'whiskey_justin');
    if (S.vegas_taufe) S.flags.add('w01'); S.g && (S.g.visible = false); S.mode = 'gone'; S.st = null; S.left = null; }]);
// Neues Spiel: der Rabe hat den Autoschlüssel (W-03), in Lukes Taschen liegen Einkaufswagenchip und Kaugummipapier (tausch.js)
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { const S = whiskey_S; S.hatSchluessel = true; S.chip = false; S.flags.clear(); S.speck = 0; S.named = false; S.vegas_taufe = false; S.trade = false; S.light = false; S.said.clear(); S.stolen = []; S.jAsked = false; S.gag = {}; S.fluch = 0; } return r; })(beginGame);
WORLD_MODS.push(['Whiskey', async () => {
  const S = whiskey_S; modItem('baumhausschluessel', 'Kleiner Messingschlüssel', 'Von Whiskey, gegen etwas Glänzendes getauscht. In den Bart ist ein „C“ gefeilt.', 'key');
  try {
    const src = await msModel('animal_crow', 'model.glb'), sk = (await import('three/addons/utils/SkeletonUtils.js')).clone, m = sk(src);
    m.rotation.y = PI / 2; // das Modell schaut entlang +X: wie die Dorfkrähen (leben.js) drehen, damit der Kopf in Flugrichtung zeigt
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false;
      o.material = [].concat(o.material).map(x => { const c = x.clone(); c.color = (c.color || new THREE.Color(1, 1, 1)).clone().multiplyScalar(.5); c.roughness = .42; if ('sheen' in c) { c.sheen = .35; c.sheenColor = new THREE.Color(0x3a4a7a); } return c; }); if (o.material.length === 1) o.material = o.material[0]; } // blauer Schimmer im Licht
      if (o.isBone && /(^|-)Head$/.test(o.name)) S.head = o; });
    const inner = new THREE.Group(); inner.add(m); inner.scale.setScalar(S.base); S.m = inner;
    const g = new THREE.Group(); g.rotation.order = 'YXZ'; g.add(inner); g.visible = false; g.userData.noCol = true; scene.add(g); S.g = g;
    S.mx = new THREE.AnimationMixer(m); for (const c of src.animations || []) { if (/_RM$/.test(c.name)) continue; S.A[c.name.replace(/^.*\|/, '').replace(/^ANIM_[A-Za-z]+_/, '')] = S.mx.clipAction(c); }
    S.ringM = whiskey_ring(m, false);
    const beak = new THREE.Sprite(new THREE.SpriteMaterial({ map: whiskey_beakTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .9 })); beak.scale.setScalar(.09); beak.visible = false; scene.add(beak); S.beak = beak;
    S.hit = box(.8, .8, .8, 0, -50, 0, hidden, { cast: false });
    interact(S.hit, () => whiskey_label(), () => whiskey_klick()); uninteract(S.hit);
    // R-2: Glanz im Schnabel als echtes Metallmodell mit Glitzerpunkten und Schein (hervorhebung.js); Umrandung nur für den Glanz, nie für den Raben
    if (typeof glanz_neu === 'function') { S.glz = glanz_neu({ size: .075, ry: 0 }); S.glz.g.visible = false; scene.add(S.glz.g); }
    S.hit.userData.hl = () => S.hatSchluessel && S.glz && S.glz.g.visible ? 'glanz' : 'aus'; S.hit.userData.hlObj = () => S.hatSchluessel && S.glz ? S.glz.key : null;
    S.ready = true;
  } catch (e) { console.warn('Whiskey', e); }
}]);
// ---------------------------------------------------------------- Takt
const whiskey_q1 = new THREE.Quaternion(), whiskey_q2 = new THREE.Quaternion(), whiskey_q3 = new THREE.Quaternion(), whiskey_v1 = new THREE.Vector3(), whiskey_v2 = new THREE.Vector3(), whiskey_v3 = new THREE.Vector3();
function whiskey_headApply(yaw, roll) { // Kopf um die Welt-Hochachse drehen (unabhängig von den Achsen des Knochens) und schief legen
  const S = whiskey_S, h = S.head; if (!h || !h.parent) return; h.updateWorldMatrix(true, false); h.getWorldQuaternion(whiskey_q1); h.parent.getWorldQuaternion(whiskey_q2);
  whiskey_q3.setFromAxisAngle(whiskey_v1.set(0, 1, 0), yaw); whiskey_q1.premultiply(whiskey_q3);
  if (roll) { const a = S.g.rotation.y + yaw; whiskey_q3.setFromAxisAngle(whiskey_v1.set(Math.sin(a), 0, Math.cos(a)), roll); whiskey_q1.premultiply(whiskey_q3); }
  h.quaternion.copy(whiskey_q2.invert().multiply(whiskey_q1)); }
const whiskey_wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
function whiskey_perchTick(dt, t) {
  const S = whiskey_S, g = S.g, P = player.pos, st = S.st, still = S.mood === 'still';
  // Blickziel: Szene > Station > Luke
  let tx = P.x, ty = camera.position.y, tz = P.z; if (S.lookT > 0 && S.look) { S.lookT -= dt; tx = S.look.x; ty = S.look.y; tz = S.look.z; } else if (st && st.look && (still || Math.random() < .002 || S.lookSt)) { tx = st.look[0]; tz = st.look[1]; ty = 1; S.lookSt = S.lookSt || still; }
  if (!still && S.lookSt && Math.random() < .004) S.lookSt = false;
  const dx = tx - g.position.x, dz = tz - g.position.z; let want = Math.atan2(dx, dz); if (S.mood === 'beleidigt' && S.lookT <= 0) want += PI * .92; // Rücken zukehren
  const diff = whiskey_wrap(want - g.rotation.y);
  // Körper: kleine Winkel bleiben, große Drehungen in einem Hüpfer (Rabenart), still: gar nicht mehr zum Spieler drehen
  if (S.turn) { S.turn.t += dt / .28; const k = Math.min(1, S.turn.t); g.rotation.y = S.turn.a + whiskey_wrap(S.turn.b - S.turn.a) * (k * k * (3 - 2 * k)); if (k >= 1) S.turn = null; }
  else if (!still && Math.abs(diff) > 1.05 && S.mode === 'perch') { S.turn = { a: g.rotation.y, b: want, t: 0 }; whiskey_play('Hop', .06, true, 1.4); S.idleT = Math.max(S.idleT, .8); }
  // Hüpfer zur Seite (W-03)
  if (S.hopTo) { S.hopTo.t += dt / .35; const k = Math.min(1, S.hopTo.t); g.position.x += (S.hopTo.x - g.position.x) * k; g.position.z += (S.hopTo.z - g.position.z) * k; if (k >= 1) S.hopTo = null; }
  // Kopf: ruckartige Blicksprünge (Sakkaden) zum Ziel, dazwischen neugierige Seitenblicke; handel: Kopf schief
  S.sacT -= dt; if (S.sacT <= 0) { S.sacT = still ? 99 : rand(.35, 1.5); const aim = Math.max(-1.15, Math.min(1.15, diff)); S.hyT = still ? Math.max(-.6, Math.min(.6, diff)) : Math.random() < .72 ? aim + rand(-.18, .18) : rand(-1.2, 1.2);
    S.hrT = S.mood === 'handel' ? (Math.random() < .7 ? .48 : .12) * (Math.random() < .5 ? 1 : -1) : (!still && Math.random() < .25 ? rand(-.35, .35) : 0); }
  // Nutzer 02.10.: „Kopf dreht durch und spinnt“ – gemessen bis 1,45 rad in einem Bild. Jetzt: Ziel begrenzt (±0,95 rad gegen den Körper), Kopf mit Höchstgeschwindigkeit
  // (Rabe: schnell, aber sichtbar – 9 rad/s) und kurzem Abbremsen; während der Körper hüpft-dreht, hält der Kopf die Richtung (kein Gegendrehen).
  S.hyT = Math.max(-.95, Math.min(.95, S.hyT)); if (S.turn) S.hyT = 0;
  const vmax = (still ? 2.2 : 9) * dt, dh = S.hyT - S.hy; S.hy += Math.sign(dh) * Math.min(Math.abs(dh), vmax, .16, Math.abs(dh) * Math.min(1, dt * 24)); S.hr += (S.hrT - S.hr) * Math.min(1, dt * 8);
  // Gefieder: aufplustern (nach dem Landen, beim Putzen, in Kälte) und leiser Atem
  S.puff = Math.max(0, S.puff - dt * .45); S.breath += dt * (still ? 1.6 : 2.6); if (S.setz > 0) { S.setz = Math.max(0, S.setz - dt * 2.8); S.m.position.y = -.035 * Math.sin((1 - S.setz) * PI) * S.setz; } // Q-1: Gewicht beim Aufsetzen
  const b = S.base * (1 + .012 * Math.sin(S.breath)) , pf = 1 + .08 * Math.sin(Math.min(1, S.puff) * PI);
  S.m.scale.set(b * pf, b * (1 + .03 * (pf - 1)), b * pf);
  g.rotation.x += (0 - g.rotation.x) * Math.min(1, dt * 6); g.rotation.z += ((S.tired ? .16 : 0) - g.rotation.z) * Math.min(1, dt * 2);
  // Leerlauf je Gang (still sperrt Putzen und Hüpfen)
  S.idleT -= dt; if (S.idleT < 0 && !S.turn) { S.idleT = rand(2.2, 5.2) * (S.tired ? 1.8 : 1);
    const opts = still ? ['IdleLookAround'] : S.tired ? ['IdleLookAround', 'IdleLookAround', 'IdleScratchWing'] : st && st.peck ? ['EatSomething', 'EatSomething', 'IdleLookAround'] :
      S.mood === 'eitel' ? ['IdleScratchWing', 'IdleScratchWing', 'IdleLookAround', 'IdleStretchWings'] : S.mood === 'beleidigt' ? ['IdleScratchWing', 'IdleLookAround', 'Hop'] :
      S.mood === 'handel' ? ['EatSomething', 'IdleLookAround', 'Hop', 'IdleLookAround'] : ['IdleLookAround', 'IdleScratchWing', 'Hop', 'IdleStretchWings', 'EatSomething'];
    const k = opts[Math.floor(Math.random() * opts.length)]; if (!still) { whiskey_play(S.A[k] ? k : 'IdleLookAround', .3, k === 'Hop', k === 'Hop' ? 1.3 : S.tired ? .6 : 1); if (k === 'IdleScratchWing' || k === 'IdleStretchWings') S.puff = Math.max(S.puff, .7); }
    const d = Math.hypot(P.x - g.position.x, P.z - g.position.z); if (d < 14 && Math.random() < .35 && !(st && st.quiet)) whiskey_caw(); }
}
WORLD_TICK.push((dt, t) => {
  const S = whiskey_S; if (!S.ready || !state.started || menu.attract) return; const P = player.pos, g = S.g;
  if (S.speck >= 1 && whiskey_k() === 1) { const F = whiskey_falleSetzen(); if (F.p && !F.p.visible) F.p.visible = F.sb.visible = true; } else if (S.falle && S.falle.p && S.falle.p.visible && (S.speck < 1 || whiskey_k() !== 1)) S.falle.p.visible = S.falle.sb.visible = false; // Vegas’ Pfanne unter dem Sieb steht ab dem zweiten Besuch am Fenster
  // nach Miras Licht (W-13): einen Tag nur ein Rabe – müde, schief, kein Tausch
  if (!S.light && typeof hungrige_S !== 'undefined' && hungrige_S.finale && whiskey_k() >= 6) { S.light = true; S.tired = true; }
  S.tired = S.light && whiskey_k() >= 6 && !S.said.has('luna');
  // Station wählen (4× je Sekunde)
  S.stT -= dt; if (S.stT <= 0 && !whiskey_unten()) { S.stT = .25; let st = null; if (!(S.light && whiskey_k() >= 6)) { let best = 1e9, cur = 1e9; // Wahl: Pflichtstation (prio) vor allem, sonst die Luke nächste – die aktuelle behält 12 m Vorsprung
      for (const s of WHISKEY_ST) { let ok = false; try { ok = s.when() && !s.done(); } catch (e) {} if (!ok) continue; if (s.prio) { st = s; best = -1; break; }
        const pp = s.pos ? s.pos() : s.at, d = pp ? whiskey_d(pp[0], s.pos ? pp[2] : pp[1]) : 1e8; if (s === S.st) cur = d; if (d < best) { best = d; st = s; } }
      if (S.st && st !== S.st && best !== -1 && cur < 1e9 && cur < best + 12) st = S.st; } // unter der Erde: er bleibt, wo er ist
    if (st !== S.st && S.mode !== 'take' && S.mode !== 'fly' && (!st || S.left !== st)) {
      const was = S.st; S.st = st; uninteract(S.hit); S.ride = null; S.moodPick = st && typeof tausch_moeglich === 'function' && Math.random() < .4 ? 'handel' : 'eitel'; S.lookSt = false;
      if (st) { const pp = st.pos ? st.pos() : null; const to = pp ? new THREE.Vector3(pp[0], pp[1], pp[2]) : new THREE.Vector3(st.at[0], st.hover ?? st.y ?? whiskey_perch(st.at[0], st.at[1]), st.at[1]);
        if (S.mode === 'gone' || !g.visible || g.position.distanceTo(to) > 150) { g.position.set(to.x + rand(-18, 18), to.y + 14, to.z + rand(-18, 18)); g.visible = true; } // weit weg (Nimmerheim, Villa-Halle): aus der Luft kommen
        whiskey_fly(to, () => { S.mode = st.ride || st.pos ? 'ride' : 'perch'; S.idleT = 1.5; S.puff = 1; if (!interactables.includes(S.hit)) interactables.push(S.hit); whiskey_zurueck(to.x + .3, null, to.z + .2); }); }
      else if (g.visible && was) whiskey_leave(); } }
  if (!g.visible) { S.beak.visible = false; if (S.glz) S.glz.g.visible = false; return; }
  const far = Math.hypot(P.x - g.position.x, P.z - g.position.z) > 70;
  // Flug
  if (S.fl) { const F = S.fl; if (F.hold > 0) { F.hold -= dt; S.m.position.y = -.025 * Math.sin(Math.min(1, F.hold / .14) * PI); } else { S.m.position.y = 0; F.t = Math.min(1, F.t + dt / F.dur); } /* Q-1: Ducken vor dem Absprung */ const u = .25 * F.t + .75 * (1 - (1 - F.t) * (1 - F.t)), a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u; // schnell ab, langsam an
    const nx = a * F.from.x + b * F.ctrl.x + c * F.to.x, ny = a * F.from.y + b * F.ctrl.y + c * F.to.y, nz = a * F.from.z + b * F.ctrl.z + c * F.to.z;
    const dx = nx - g.position.x, dz = nz - g.position.z, dy = ny - g.position.y, h = Math.hypot(dx, dz); if (h > 1e-4) { const ny_ = Math.atan2(dx, dz), yr = whiskey_wrap(ny_ - g.rotation.y) / Math.max(dt, 1e-3); g.rotation.y = ny_; g.rotation.z += (Math.max(-.6, Math.min(.6, -yr * .35)) - g.rotation.z) * Math.min(1, dt * 5); } // in die Kurve legen
    g.rotation.x += (Math.max(-.5, Math.min(.5, -Math.atan2(dy, h + 1e-3) * .8)) * (F.t > .85 ? -.6 : 1) - g.rotation.x) * Math.min(1, dt * 8); g.position.set(nx, ny, nz); // Nase in Flugrichtung, beim Landen aufgerichtet
    if (S.mode === 'take') { S.tt -= dt; if (S.tt < 0) { S.mode = 'fly'; whiskey_play('Fly', .2); } }
    else if (F.t > .8 && !F.land) { F.land = true; whiskey_play('Landing', .12, true, rand(.95, 1.15)); if (!far) { const q = g.position; Audio.flap(q.x, q.y, q.z); setTimeout(() => Audio.flap(q.x, q.y, q.z), 170); } } // bremsende Flügelschläge
    else if (F.t < .8 && !F.land && F.dur > 2.4) { const want = Math.sin(t * .9 + F.dur) > .35 ? 'Glide' : 'Fly'; if (S.cur !== S.A[want]) whiskey_play(want, .4); }
    if (F.t >= 1) { S.fl = null; S.mode = 'perch'; S.puff = 1; S.setz = 1; g.rotation.z = 0; whiskey_play('IdleLookAround', .3); if (F.then) F.then(); } }
  else if (S.mode === 'perch' || S.mode === 'ride') {
    if (S.mode === 'ride' && S.st && S.st.pos) { const p = S.st.pos(); if (p) g.position.set(p[0], p[1], p[2]); }
    whiskey_moodTick(dt); whiskey_perchTick(dt, t);
    S.hit.position.set(g.position.x, g.position.y + .25, g.position.z);
    const d = Math.hypot(P.x - g.position.x, P.z - g.position.z), st = S.st;
    if (st && !S.seen.has(st.id) && d < 9 && !state.talking && !st.quiet && +document.getElementById('subtitle').style.opacity < .05) { S.seen.add(st.id); whiskey_caw(); } // erste Sichtung
    if (st && st.near && !state.talking && !ui.overlay) { try { st.near(d); } catch (e) { console.warn('Whiskey ' + st.id, e); } }
    // Ignorieren zählen (K1-6): nah vorbei (< 5 m), wieder weg (> 9 m), ohne ihn anzusprechen – beim vierten Mal fehlt etwas
    if (S.mood !== 'still' && !state.talking && st && !st.ride) { if (d < 5 && !S.near) { S.near = true; S.passT = 0; } else if (S.near) { S.passT += dt; if (d > 9) { S.near = false; if (S.passT < 25) { S.ignored++; if (S.ignored >= 4 && whiskey_k() !== 2) whiskey_klau(); else if (S.ignored >= 2) S.moodPick = 'beleidigt'; } } } }
  }
  if (S.flags.has('w01') && S.speck < 3 && !S.speckBusy && whiskey_k() === 1 && whiskey_d(-28, -12.35) > 18) S.speckWeg = true;
  // Kapitel-2-Schrei an der ersten Stufe (W-05): Station nr7 und Luke steigt in den Keller
  if (S.st && S.st.id === 'nr7' && state.inBasement && !S.flags.has('w05')) { S.flags.add('w05'); whiskey_mimic('schrei', { force: true }); setTimeout(() => subtitle('<i>Er kommt nicht mit runter. Kluger Vogel.</i>', 3200, 'LUKE'), 2600); }
  if (S.st && S.st.id === 'auto') { whiskey_w03Hilfe(dt); } else if (S.hatSchluessel && (S.stT === .25)) whiskey_autoVerloren();
  // K6-1: das Gitter geht auf → „Such!“ vom Ast
  if (whiskey_k() === 6 && whiskey_k6() === 'krumen' && !S.flags.has('k6_such') && g.visible && !S.fl) { S.flags.add('k6_such'); whiskey_setzen(30.4, whiskey_perch(30.4, 106) + 2.4, 106, () => whiskey_mimic('such', { force: true })); }
  // nach W-13 die eine Ausnahme: auf dem Rückweg „Bedauerlich.“ (spätestens 30 s nach dem Epilog-Start, wenn er in Lukes Nähe sitzt)
  if (S.light && !S.said.has('nachW13') && whiskey_k6() === 'epilog' && S.mode === 'perch' && Math.hypot(P.x - g.position.x, P.z - g.position.z) < 9 && !state.talking) { S.bedT = (S.bedT || 0) + dt; if (S.bedT > 20) whiskey_bedauerlich(); }
  whiskey_helpTick(dt);
  // Glanz im Schnabel (Autoschlüssel W-03)
  const beakOn = S.hatSchluessel && !far; // auch im Flug: er trägt ihn weiter im Schnabel (vorher verschwand er beim Auffliegen) S.beak.visible = beakOn && !S.glz; if (S.glz) S.glz.g.visible = beakOn;
  if (!far) { S.mx.update(dt * (S.tired ? .7 : 1));
    // Clips, die den Kopf selbst bewegen (Umschauen, Putzen, Strecken, Picken, Hüpfen): Blicksteuerung weich ausblenden – sonst addieren sich beide Drehungen (Kopf „spinnt“)
    const cn = S.cur && S.cur.getClip ? S.cur.getClip().name : '', eigen = /LookAround|Scratch|Stretch|Eat|Hop|Landing|TakeOff/.test(cn);
    S.hw = (S.hw ?? 1) + ((eigen ? .25 : 1) - (S.hw ?? 1)) * Math.min(1, dt * 5);
    if (S.head && (S.mode === 'perch' || S.mode === 'ride')) whiskey_headApply(S.hy * S.hw, S.hr * S.hw);
    if (S.beakL === undefined) S.beakL = whiskey_beakTip(); // posenunabhängig: einmal genügt (auch im Flug und auf der Schulter)
    if (beakOn && S.head) { S.head.getWorldPosition(whiskey_v3); const a = g.rotation.y + S.hy; S.beak.position.set(whiskey_v3.x + Math.sin(a) * .11, whiskey_v3.y - .015, whiskey_v3.z + Math.cos(a) * .11); S.beak.material.opacity = .55 + .35 * Math.abs(Math.sin(t * 2.3));
      if (S.glz) { if (S.beakL) { S.glz.g.position.copy(S.beakL); S.head.localToWorld(S.glz.g.position); } else S.glz.g.position.set(whiskey_v3.x + Math.sin(a) * .155, whiskey_v3.y - .03, whiskey_v3.z + Math.cos(a) * .155); S.glz.g.rotation.set(0, a + PI / 2, .3 + .1 * Math.sin(t * 2.7) + S.hr * .5, 'YXZ'); } } } // Schlüssel quer im Schnabel, pendelt leicht mit dem Kopf
});
window.__whiskey = { S: whiskey_S, ST: WHISKEY_ST, klick: () => whiskey_klick(), mimic: (k, o) => whiskey_mimic(k, o), setzen: (x, y, z) => whiskey_setzen(x, y, z), w01: () => whiskey_w01(), schacht: () => whiskey_schacht(), luna: () => whiskey_luna(), bedauerlich: () => whiskey_bedauerlich(), gefahr: () => whiskey_gefahr(), blick: (x, y, z, s) => whiskey_blick(x, y, z, s) }; // Testzugriff
