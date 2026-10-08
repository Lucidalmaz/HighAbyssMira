// =====================================================================  BEDIENUNG (Modul „bedienung“, Auftrag 08.10.2026; 09.10.: echte Modelle statt prozeduralem Baukasten)
// Geräte, die der Spieler anfasst – jetzt aus echten Scans/Modellen (Texturen ≤ 2k, KTX2 über tools/ktx.mjs; Quellen siehe CREDITS.md):
//   Tastenfeld Kellertür (Kap. 1)   Keypad Door Lock (plaggy, CC-BY)      assets/ms/bed_keypad/  – Eingabe im Overlay #keypad (Tafel aus den Texturen des Modells), LED-Rückmeldung über Emission
//   Sicherungskasten (Kap. 2)       Quixel Megascans „Electrical Boxes“    assets/ms/bed_elec/    – Verteilertafel als Wandgerät; sechs Kipphebel (nur Hebel, keine Schilder) folgen ch2.fuses
//   Funkgerät (Kap. 3)              Military Radio (Camille Barral)        assets/ms/bed_funk/    – auf dem Funkkasten; Abstimmen/Rätsel bleiben im Overlay (lucy3.js)
//   Notentriegelung (Kap. 2): baut feuer.js selbst; sie nimmt ihre Metallteile aus BED.mat('stahl'/'messing'/'bakelit').
// Grundsatz: nur DARSTELLUNG und Bedienkomfort – Codes, Reihenfolgen, Logik und Rätsel-Hinweise der Module bleiben unberührt. Keine generierten Schilder/Schriften.
const BED = { _m: {}, _t: {}, k1: null, sic: null, funkB: null };
function bed_rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bed_cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); if (f) f(x, w, h); return c; }
function bed_tex(c, srgb = true, rep) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
// Normalkarte aus Höhenkarte (Rot-Kanal), Sobel, OpenGL-Konvention
function bed_normal(src, k = 2) { const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, out = bed_cv(w, h), o = out.getContext('2d'), im = o.createImageData(w, h), o8 = im.data;
  const H = (x, y) => d[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    o8[i] = (-dx / l * .5 + .5) * 255; o8[i + 1] = (dy / l * .5 + .5) * 255; o8[i + 2] = (1 / l * .5 + .5) * 255; o8[i + 3] = 255; }
  o.putImageData(im, 0, 0); return out; }

function bed_bürste(seed, W = 512, Hh = 512, o = {}) { // → { map, height, rough } als Leinwände
  const r = bed_rng(seed), base = o.base || [170, 173, 172];
  const map = bed_cv(W, Hh, (x, w, h) => { x.fillStyle = `rgb(${base})`; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = r() < .5 ? 255 : 0, y = r() * h, l = 30 + r() * 260, x0 = r() * w; x.fillStyle = `rgba(${v},${v},${v},${.03 + r() * .07})`; x.fillRect(x0, y, l, 1 + (r() < .15 ? 1 : 0)); if (x0 + l > w) x.fillRect(x0 - w, y, l, 1); }
    // Schmutz, Fingerfett, Wischspuren; Ränder dunkler (Dreck sammelt sich an den Kanten)
    for (let i = 0; i < 26; i++) { const cx = r() * w, cy = r() * h, rr = 10 + r() * 46, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(60,48,36,${.06 + r() * .1})`); g.addColorStop(1, 'rgba(60,48,36,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    const eg = x.createLinearGradient(0, 0, 0, h); eg.addColorStop(0, 'rgba(20,16,12,.28)'); eg.addColorStop(.12, 'rgba(20,16,12,0)'); eg.addColorStop(.88, 'rgba(20,16,12,0)'); eg.addColorStop(1, 'rgba(20,16,12,.34)'); x.fillStyle = eg; x.fillRect(0, 0, w, h);
    const eh = x.createLinearGradient(0, 0, w, 0); eh.addColorStop(0, 'rgba(20,16,12,.3)'); eh.addColorStop(.1, 'rgba(20,16,12,0)'); eh.addColorStop(.9, 'rgba(20,16,12,0)'); eh.addColorStop(1, 'rgba(20,16,12,.3)'); x.fillStyle = eh; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(255,255,255,${.1 + r() * .22})`; x.lineWidth = .6; x.beginPath(); const sx = r() * w, sy = r() * h, a = r() * 6.28, l = 8 + r() * 60; x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke(); } }); // Kratzer
  const height = bed_cv(W, Hh, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); const r2 = bed_rng(seed + 7);
    for (let i = 0; i < 2600; i++) { const v = r2() < .5 ? 255 : 0, y = r2() * h, l = 30 + r2() * 260, x0 = r2() * w; x.fillStyle = `rgba(${v},${v},${v},${.05 + r2() * .1})`; x.fillRect(x0, y, l, 1); if (x0 + l > w) x.fillRect(x0 - w, y, l, 1); } });
  const rough = bed_cv(W, Hh, (x, w, h) => { x.fillStyle = '#7c7c7c'; x.fillRect(0, 0, w, h); const r3 = bed_rng(seed + 3);
    for (let i = 0; i < 1400; i++) { const v = r3() < .5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${.03 + r3() * .06})`; x.fillRect(r3() * w, r3() * h, 20 + r3() * 200, 1); }
    for (let i = 0; i < 22; i++) { const cx = r3() * w, cy = r3() * h, rr = 12 + r3() * 40, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(210,210,210,.35)'); g.addColorStop(1, 'rgba(210,210,210,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); } });
  return { map, height, rough }; }

function bed_tx() { const T = BED._t; if (T.stahl) return T; const b = bed_bürste(11); T.stahl = { map: bed_tex(b.map, true), normal: bed_tex(bed_normal(b.height, 1.6), false), rough: bed_tex(b.rough, false) }; return T; }
// geteilte Materialien (nur noch für feuer.js/Notentriegelung und die Hebel; entstehen erst beim ersten Zugriff)
BED.mat = function (n) { const M = BED._m; if (M[n]) return M[n]; const S = THREE.MeshStandardMaterial;
  switch (n) {
    case 'stahl': { const T = bed_tx(); M[n] = new S({ color: 0xffffff, map: T.stahl.map, normalMap: T.stahl.normal, normalScale: new THREE.Vector2(.5, .5), roughnessMap: T.stahl.rough, roughness: .62, metalness: .92 }); break; }
    case 'bakelit': M[n] = new S({ color: 0x120c09, roughness: .3, metalness: .05 }); break;
    case 'messing': M[n] = new S({ color: 0xb08a3c, roughness: .3, metalness: .95 }); break;
    default: throw new Error('BED.mat ' + n);
  } return M[n]; };

// ---------------------------------------------------------------- Klick-Geräusche (nur echte Aufnahmen)
BED.klick = function (art = 'taste', o = {}) { try { if (!Audio.ctx) return; const v = () => 1 + (Math.random() - .5) * .16;
  if (art === 'taste') Audio.play('switch1', { gain: o.gain ?? .22, rate: 2.5 * v(), offset: 0, dur: .11, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'loeschen') Audio.play('switch1', { gain: o.gain ?? .22, rate: 1.7 * v(), offset: 0, dur: .13, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'gesperrt') Audio.play('metalHit2', { gain: o.gain ?? .1, rate: 2.2, dur: .09, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'falsch') { Audio.play('buzz', { gain: o.gain ?? .3, rate: 1.1, dur: .5, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 }); Audio.play('metalHit2', { gain: .12, rate: 1.9, dur: .1, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 }); }
  else if (art === 'kipp') Audio.play(Math.random() < .5 ? 'switch1' : 'switch2', { gain: o.gain ?? .3, rate: 1.4 * v(), dur: .25, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'klappe') Audio.play('metalOpen', { gain: o.gain ?? .5, rate: 1.25, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'dreh') Audio.play('keys2', { gain: o.gain ?? .12, rate: 2.2 * v(), dur: .09, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  } catch (e) {} };

// ---------------------------------------------------------------- gemeinsame Hilfen
const bed_pos = (parent, o) => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.userData.noCol = true; } }); parent.add(o); return o; };
// Modell bauen: Rückseite auf z = 0, Mitte in x/y = 0 (Gruppe schaut nach +z); size = Höhe (axis 'y') oder größte Kante ('max')
function bed_mitte(o, size, axis) { msFit(o, size, axis); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3()); o.position.set(-c.x, -c.y, -bb.min.z); const g = new THREE.Group(); g.add(o); return g; }

// ================================================================= TASTENFELD (Kellertür, Kap. 1) – Keypad Door Lock
// Das flache Kästchen keypadMesh bleibt als unsichtbare Klickfläche (Logik; die Szenen färben es rot/grün) – das Modell sitzt davor.
// Rückmeldung: grüne/rote Kontrollleuchte über die Emission-Textur des Modells (zwei Karten: nur grün / nur rot), Aufleuchten bei jedem Tastendruck.
async function bed_kapitel1() { if (BED.k1 || typeof keypadMesh === 'undefined' || typeof kapitel1_kpPress !== 'function') return;
  const km = keypadMesh, p = km.position, TX = n => msTex('bed_keypad/' + n, true);
  const o = await msFBX('bed_keypad', 'model.fbx', { '*': { b: 'b.jpg', n: 'n.jpg', r: 'r.jpg', m: 'm.jpg' } }); if (BED.k1) return;
  const mt = []; o.traverse(m => { if (m.isMesh) mt.push(m.material); });
  const gruen = TX('e_gruen.jpg'), rot = TX('e_rot.jpg'); for (const m of mt) { m.emissive.set(0xffffff); m.emissiveMap = gruen; m.emissiveIntensity = .8; m.metalness = Math.min(m.metalness, .6); m.needsUpdate = true; }
  const g = bed_mitte(o, .22, 'y'); g.position.set(p.x, p.y, p.z - .028); scene.add(g); bed_pos(g, g.children[0]);
  const kp = BED.k1 = { g, msg: null, msgT: 0, flash: 0 };
  km.material.visible = false; km.castShadow = false; km.userData.hlObj = g;
  km.userData.label = () => state.cellarOpen ? 'In den Keller' : 'Code eingeben';
  const orig = kpPress, at = { x: p.x, y: p.y, z: p.z };
  kpPress = function (k) { const busy = performance.now() < kpBusy || ui.overlay !== 'keypad', v0 = kpValue; let ok = null; const ob = Audio.beep; Audio.beep = a => { ok = a; };
    try { orig(k); } finally { Audio.beep = ob; }
    if (busy) return;
    if (k === 'OK') { if (ok === true) { kp.msg = 'ok'; kp.msgT = 4; BED.klick('taste', at); } else { kp.msg = 'err'; kp.msgT = 1.3; BED.klick('falsch', at); } }
    else if (k === 'C') BED.klick('loeschen', at);
    else if (kpValue !== v0) BED.klick('taste', at);
    else BED.klick('gesperrt', at);
    kp.flash = 1; };
  WORLD_TICK.push((dt) => { const em = km.material.emissive, szene = em.r > .6 && em.g < .4; // Szene (dritter Fehlversuch) färbt das Kästchen rot
    if (kp.msgT > 0) { kp.msgT -= dt; if (kp.msgT <= 0) kp.msg = null; } kp.flash = Math.max(0, kp.flash - dt * 4);
    const err = szene || kp.msg === 'err', blink = szene ? ((performance.now() / 380 | 0) & 1) : 1;
    for (const m of mt) { m.emissiveMap = err ? rot : gruen; m.emissiveIntensity = (err ? 1.6 * blink : (kp.msg === 'ok' || state.cellarOpen ? 1.5 : .8)) * (1 + kp.flash * .9); } }); }
WORLD_TICK.push(() => { if (!BED.k1 && !BED._k1try && typeof keypadMesh !== 'undefined' && typeof camera !== 'undefined' && camera.position.distanceTo(keypadMesh.position) < 16) { BED._k1try = true; bed_kapitel1().catch(e => console.warn('Bedienung: Tastenfeld', e)); } });

// Eingabefenster: Tastenblock als Bild aus den Texturen des Modells (Tasten 0·1·3 sauber, übrige verstaubt – dieselbe Rätselhilfe wie am Gerät); „*“ = C, „#“ = OK.
{ const st = document.createElement('style'); st.id = 'bedcss'; st.textContent = `
  #keypad .box { background: none !important; border: 0 !important; box-shadow: none !important; padding: 0 !important; width: 300px; }
  #keypad .box::before, #keypad .box::after { content: none !important; display: none !important; }
  #kpDisplay { background: #0b120d !important; font: 700 34px "Share Tech Mono", "Consolas", "Courier New", monospace !important; border-radius: 5px !important; margin-bottom: 12px !important; box-shadow: inset 0 0 18px rgba(0,0,0,.95), 0 0 0 2px #1d1f1d !important; }
  #keypad .grid { display: grid !important; grid-template-columns: repeat(3, 71px) !important; grid-template-rows: repeat(4, 71px) !important; column-gap: 11px !important; row-gap: 12px !important; width: 300px; height: 379px; box-sizing: border-box;
    padding: 29px 0 0 32px; background: url(assets/ms/bed_keypad/tafel.jpg) 0 0 / 100% 100% no-repeat; border-radius: 8px; box-shadow: 0 30px 80px rgba(0,0,0,.9), 0 0 0 1px #000; }
  #keypad button { background: transparent !important; color: transparent !important; font-size: 0 !important; border: 0 !important; border-radius: 3px !important; padding: 0 !important; width: 71px !important; height: 71px !important; box-shadow: none !important; cursor: pointer; text-shadow: none !important; filter: none; transition: background .08s; }
  #keypad button:hover { background: rgba(255,255,255,.10) !important; }
  #keypad button:active { background: rgba(0,0,0,.28) !important; box-shadow: inset 0 0 0 3px rgba(0,0,0,.25) !important; }
  #keypad .hint { color: #cfc8b4; } `; document.head.appendChild(st); }

// ================================================================= SICHERUNGSKASTEN (Kap. 2, Amt) – Quixel „Electrical Boxes“ (Verteilertafel)
// Die Tafel (1,29 × 1,62 m, ein Scan) steht als Wandgerät dort, wo das flache Basis-Kästchen hing (Front nach −z, in den Raum). Sechs Kipphebel auf den beiden breiten Kästen
// folgen ch2.fuses (an = Hebel nach oben, Kontrollleuchte der Basis darüber); Basis-Kasten und -Klappe bleiben unsichtbar als Klickfläche (Klappe gilt als offen).
const BED_HEBEL = [[-.30, .975, .193], [-.19, .975, .193], [-.08, .975, .193], [.23, .975, .180], [.36, .975, .180], [.49, .975, .180]]; // x, y, z des Deckels im Modell (Meter)
BED.sicherung = async function () { if (BED.sic || typeof fusePanel === 'undefined' || typeof fuseCover === 'undefined' || typeof ch2 === 'undefined') return; BED.sic = { hebel: [] };
  const fp = fusePanel.position, S = BED.sic, s = 1.1, src = await msModel('bed_elec', 'model.gltf'), o = src.clone(true);
  const root = new THREE.Group(); root.position.set(fp.x, fp.y - 1.5, fp.z + .06); root.rotation.y = Math.PI; scene.add(root); S.root = root; // lokal +z = in den Raum (−z der Welt), x gespiegelt
  o.scale.multiplyScalar(s); bed_pos(root, o);
  fusePanel.material = new THREE.MeshBasicMaterial({ visible: false }); fuseCover.material = fusePanel.material; fusePanel.castShadow = fuseCover.castShadow = false; ch2.coverOpen = true;
  fuseCover.userData.label = () => 'Sicherungen schalten'; fusePanel.userData.label = fuseCover.userData.label; fusePanel.userData.hlObj = fuseCover.userData.hlObj = root;
  // Hebel: schlichte Metallteile (Sockel, Stange, Knauf), auf die Deckel der beiden breiten Kästen gesetzt
  const metall = new THREE.MeshStandardMaterial({ color: 0x8d908d, roughness: .4, metalness: .92 }), knauf = BED.mat('bakelit'), sock = new THREE.CylinderGeometry(.03, .032, .012, 18), stg = new THREE.CylinderGeometry(.0065, .0075, .085, 10), kn = new THREE.SphereGeometry(.0135, 12, 9);
  sock.rotateX(Math.PI / 2); stg.rotateX(Math.PI / 2); stg.translate(0, 0, .0425);
  BED_HEBEL.forEach(([x, y, z], i) => { const pv = new THREE.Group(); pv.position.set(x * s, y * s, z * s + .006); root.add(pv);
    const b = new THREE.Mesh(sock, metall); b.position.z = -.002; pv.add(b); const arm = new THREE.Group(); pv.add(arm); const st2 = new THREE.Mesh(stg, metall), k = new THREE.Mesh(kn, knauf); k.position.z = .088; arm.add(st2, k);
    for (const m of [b, st2, k]) { m.castShadow = true; m.userData.noCol = true; } S.hebel.push({ pv: arm, last: undefined });
    const L = typeof fuseLeds !== 'undefined' && fuseLeds[i]; if (L) { const w = new THREE.Vector3(x * s, (y + .085) * s, z * s + .004); root.localToWorld(w); L.position.copy(w); L.geometry = BED._lg || (BED._lg = (() => { const lg = new THREE.CylinderGeometry(.013, .014, .01, 14); lg.rotateX(Math.PI / 2); return lg; })()); } });
  S.tick = (dt) => { if (!ch2.fuses) return; S.hebel.forEach((H, i) => { const an = ch2.fuses[i], ziel = an ? -.55 : .55; H.pv.rotation.x += (ziel - H.pv.rotation.x) * Math.min(1, dt * 14);
    if (H.last !== an) { if (H.last !== undefined) BED.klick('kipp', { x: fp.x, y: fp.y, z: fp.z }); else H.pv.rotation.x = ziel; H.last = an; } }); };
  return S; };
WORLD_TICK.push((dt) => { if (BED.sic && BED.sic.tick) return BED.sic.tick(dt); if (!BED.sic && !BED._sicTry && typeof fusePanel !== 'undefined' && typeof camera !== 'undefined' && camera.position.distanceTo(fusePanel.position) < 22) { BED._sicTry = true; BED.sicherung().catch(e => { BED.sic = null; console.warn('Bedienung: Sicherungskasten', e); }); } });

// Villa (Kühlraum, Kap. 4): dieselbe Verteilertafel verkleinert statt des aufgemalten Kastens (die Fassungen bedient das Overlay von villa.js)
WORLD_TICK.push(() => { if (BED._vil || typeof VILLA === 'undefined' || !VILLA.o || !VILLA.o.kasten || typeof camera === 'undefined' || camera.position.distanceTo(VILLA.o.kasten.position) > 30) return; BED._vil = true;
  const dk = VILLA.o.kasten; msModel('bed_elec', 'model.gltf').then(src => { const o = src.clone(true); o.scale.multiplyScalar(.5); const g = new THREE.Group(); bed_pos(g, o);
    g.position.set(dk.position.x + .03, dk.position.y - .4, dk.position.z); g.rotation.y = -Math.PI / 2; (dk.parent || scene).add(g); dk.visible = false; }).catch(e => console.warn('Bedienung: Villa-Kasten', e)); });

// ================================================================= FUNKGERÄT (Kap. 3, Stadtwerke-Umspannhäuschen) – Military Radio
// Das Gerät liegt auf dem Funkkasten (radioBox bleibt Klickfläche und Unterbau); das aufgeklebte Amtsschild der Basis ist ausgeblendet. Das Modell ist ein Stück – keine beweglichen Knöpfe.
BED.funk = async function () { if (BED.funkB || typeof radioBox === 'undefined') return; BED.funkB = {};
  const p = radioBox.position, o = await msFBX('bed_funk', 'model.fbx', { '*': { b: 'b.jpg', n: 'n.jpg', r: 'orm.jpg', m: 'orm.jpg', ao: 'orm.jpg' } }), g = new THREE.Group();
  scene.traverse(m => { if (m.isMesh && m.geometry.type === 'PlaneGeometry' && Math.abs(m.position.x - p.x) < .05 && Math.abs(m.position.y - .75) < .05 && Math.abs(m.position.z - (p.z + .21)) < .03) m.visible = false; });
  msFit(o, .30, 'max'); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o), c = bb.getCenter(new THREE.Vector3()); o.position.set(-c.x, -bb.min.y, -c.z); g.add(o); bed_pos(g, o);
  g.position.set(p.x, p.y + .55 + .002, p.z); g.rotation.y = BED.funkRy ?? 0; scene.add(g); BED.funkB.g = g;
  radioBox.userData.label = () => (typeof ch3 !== 'undefined' && ch3.radio) ? 'Funkgerät (Rauschen)' : 'Funkgerät abstimmen'; radioBox.userData.hlObj = g; };
WORLD_TICK.push(() => { if (!BED.funkB && !BED._funkTry && typeof radioBox !== 'undefined' && typeof camera !== 'undefined' && camera.position.distanceTo(radioBox.position) < 24) { BED._funkTry = true; BED.funk().catch(e => { BED.funkB = null; console.warn('Bedienung: Funkgerät', e); }); } });

window.__bed = BED; // Testzugriff (Release entfernt window.__*)
