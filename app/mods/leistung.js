// =====================================================================  LEISTUNG (Modul „leistung“, Schluss-Leistungsprüfung 01.10.2026)
// Ganz zuletzt in der Modul-Reihenfolge: wirkt auf das, was alle anderen Module gebaut haben. Ändert nichts am Aussehen.
// 1) SHADER NIE IM LAUFENDEN BILD ÜBERSETZEN. Was erst im Spiel entsteht (Bewohnt-Deko beim Näherkommen, Figuren beim ersten Auftritt), brauchte neue
//    Shader-Programme – three.js übersetzt sie im Bild, in dem sie zum ersten Mal gezeichnet werden, und wartet darauf (gemessen: Nr. 7 betreten 7,4 s Standbild,
//    Zayn 4 × 0,3–0,55 s). Jetzt: (a) eine Hintergrund-Durchsicht der Szene (wenige hundert Knoten je Bild) findet neue Material-/Varianten-Paare, solange sie
//    noch versteckt sind, und übersetzt sie parallel (KHR_parallel_shader_compile); (b) taucht trotzdem etwas Unübersetztes im Bild auf, wird nur dieses
//    Teil ausgelassen, bis sein Programm fertig ist (wenige Bilder), statt das ganze Spiel anzuhalten. Nur für die Spielszene; Nachbearbeitung/Schatten unberührt.
const LST_NEU = !window.__lstAus; // Vergleichsmessung: window.__lstAus = true vor dem Laden schaltet 2–7, 9 und 10 ab
const LST = { rigNext: new Set(), rigOk: false, nebelK: 2.41, on: true, mixer: LST_NEU, nebel: LST_NEU, sonde: LST_NEU, licht: LST_NEU, lichtOk: false, strahl: LST_NEU, sweite: LST_NEU, echo: LST_NEU, q: [], qm: new Set(), busy: false, busyT: 0, stack: [], scanT: 0, init: false, skip: 0, comp: 0, compMs: 0, last: '',
  root: null, R: renderer.properties };
// Varianten-Merkmal eines gezeichneten Teils (die Merkmale, für die three.js ein eigenes Programm braucht)
function lst_sig(o, g) { const ma = g.morphAttributes, mc = ma.position || ma.normal || ma.color;
  return (o.isSkinnedMesh ? 1 : 0) | (o.isInstancedMesh ? 2 : 0) | (o.instanceColor ? 4 : 0) | (o.morphTexture ? 8 : 0) | (g.attributes.tangent ? 16 : 0) | (ma.normal ? 32 : 0) | (ma.color ? 64 : 0) | ((mc ? mc.length : 0) << 8); }
function lst_known(m, sig) { if (m.__lsV !== m.version && (m.__lsN | 0) < 6) return false; // Material geändert (needsUpdate) → evtl. neues Programm (höchstens 6× je Material abwarten)
  if (m.__lsg === sig) return true; const a = m.__lsgs; if (a) for (let i = 0; i < a.length; i++) if (a[i] === sig) return true; return false; }
function lst_add(m, sig) { if (m.__lsV !== m.version) { if (m.__lsV !== undefined) { m.__lsN = (m.__lsN | 0) + 1; m.__lsg = undefined; m.__lsgs = null; } m.__lsV = m.version; }
  if (m.__lsg === undefined) { m.__lsg = sig; return; } if (m.__lsg === sig) return; (m.__lsgs || (m.__lsgs = [])).includes(sig) || m.__lsgs.push(sig); }
// Wurde das Material in seinem jetzigen Stand schon gezeichnet? (three.js merkt sich beim Zeichnen die Material-Version; nur übersetzt zählt nicht)
function lst_hat(m) { const P = LST.R.get(m); return !!P.currentProgram && P.__version === m.version; }
// Ein Teil prüfen: bekannt → true. Unbekannt mit fertigem Programm (anderswo übersetzt, gleiche Variante beim ersten Mal) → merken. Sonst vormerken.
function lst_check(o, m) { const g = o.geometry; if (!g) return true; const sig = lst_sig(o, g); if (lst_known(m, sig)) return !m.__lsP;
  if (m.__lsg === undefined && m.__lsV === undefined && lst_hat(m)) { lst_add(m, sig); return !m.__lsP; } // schon anderswo übersetzt (gleiche Variante beim ersten Mal)
  if (!LST.qm.has(o)) { if (o.isMesh) perfSinglePass(o); LST.qm.add(o); LST.q.push(o); } m.__lsP = (m.__lsP || 0) + 1; o.__lsSig = sig; return false; }
// Alles, was beim Laden in der Szene war, ist übersetzt (Gesamtdurchgang der Basis) → als bekannt eintragen
function lst_seed() { scene.traverse(o => { if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.material || !o.geometry) return; const sig = lst_sig(o, o.geometry);
  for (const m of [].concat(o.material)) if (m && LST.R.get(m).currentProgram) lst_add(m, sig); }); } // nur, was wirklich ein Programm hat
// Zeichnen abfangen: unübersetzte Teile in diesem Bild auslassen (nie im Bild übersetzen)
{ const rbd = renderer.renderBufferDirect;
  renderer.renderBufferDirect = function (cam, sc, geo, mat, obj, grp) {
    if (sc === scene && LST.init && LST.on && mat && !mat.isMeshDepthMaterial && !mat.isMeshDistanceMaterial && (mat.__lsP || !lst_known(mat, lst_sig(obj, geo))) && !lst_check(obj, mat)) { LST.skip++; return; }
    const r = rbd.call(this, cam, sc, geo, mat, obj, grp);
    if (!LST.lichtOk && LST.init && mat && mat.isMeshStandardMaterial) { try { lst_lichtPatch(LST.R.get(mat).currentProgram); } catch (e) { LST.lichtOk = true; console.warn('Leistung: Licht', e); } }
    return r; }; }
// Vorgemerktes parallel übersetzen (außerhalb des Bildes – compile() setzt den Render-Zustand zurück)
function lst_flush() {
  if (LST.busy) { if (performance.now() - LST.busyT > 30000) LST.busy = false; return; } // Sicherung: nie dauerhaft unsichtbar
  if (!LST.q.length) return;
  const objs = LST.q.splice(0, 12); for (const o of objs) LST.qm.delete(o); // kleine Portionen: das Anlegen der Programme selbst kostet je Stück 1–5 ms
  const root = LST.root || (LST.root = new THREE.Object3D()); root.traverse = cb => { for (const o of objs) cb(o); }; root.traverseVisible = () => {};
  LST.busy = true; LST.busyT = performance.now(); const t0 = LST.busyT;
  const done = () => { for (const o of objs) { const sig = o.__lsSig; for (const m of [].concat(o.material)) if (m) { lst_add(m, sig); if (m.__lsP) m.__lsP = 0; } }
    LST.comp += objs.length; LST.compMs = performance.now() - t0; LST.busy = false; };
  // Für den Nachbearbeitungs-Puffer übersetzen (wie der Gesamtdurchgang der Basis): für den Bildschirm wäre es eine andere Programm-Variante (Farbraum/Tonwert)
  const rt0 = renderer.getRenderTarget(); renderer.setRenderTarget(composer.renderTarget1);
  try { _compileAsync0(root, camera, scene).then(done, e => { console.warn('Leistung: Vorübersetzen', e); done(); }); } catch (e) { console.warn('Leistung: Vorübersetzen', e); done(); } finally { renderer.setRenderTarget(rt0); }
}
// Hintergrund-Durchsicht: ~600 Knoten je Bild (auch Unsichtbares – genau das soll vorher fertig werden). Sammelt nebenbei die Figuren-Skelette (siehe 8).
function lst_scan() {
  const S = LST.stack; if (!S.length) { if ((LST.scanT -= 1) > 0) return; LST.scanT = 20; S.push(scene); LST.rigNext.clear(); }
  for (let n = 600; n > 0 && S.length; n--) { const o = S.pop(), ch = o.children; for (let i = 0; i < ch.length; i++) S.push(ch[i]);
    if (o.isSkinnedMesh && o.skeleton && o.skeleton.bones.length) { const r = lst_rigRoot(o); if (r) LST.rigNext.add(r); }
    if (!S.length) { try { lst_rigs(); } catch (e) { console.warn('Leistung: Skelette', e); } }
    if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite) || !o.material || !o.geometry) continue;
    if (o.isMesh) perfSinglePass(o); // durchsichtig + beidseitig → ein Durchgang (wie die Basis beim Laden; deren Nachzügler-Runde braucht bis 6 s)
    const m = o.material; if (Array.isArray(m)) { for (let i = 0; i < m.length; i++) if (m[i] && !lst_known(m[i], lst_sig(o, o.geometry))) lst_check(o, m[i]); }
    else if (!lst_known(m, lst_sig(o, o.geometry))) lst_check(o, m); }
}

// 2) UNSICHTBARE TIERE UND FIGUREN SELTENER ANIMIEREN. Die Basis rechnet Animationen ferner Figuren nur ~3× je Sekunde (Abschnitt 6). Was nah, aber
//    gerade außerhalb des Blickfelds ist (Ratten, Krähen, Katzen, Figuren hinter Luke – von der Blickfeld-Auslese für das Bild ausgeblendet), lief weiter
//    in jedem Bild. Jetzt ~10× je Sekunde; die Zeit wird aufgeholt (Abläufe und Ende-Ereignisse bleiben pünktlich). Sobald es ins Blickfeld kommt, wieder jedes Bild.
// Sprites lassen sich ohne Raycaster.camera nicht treffen (three wirft sonst `null.matrixWorld` mitten in Boden-/Wandstrahlen der Module): dann überspringen
{ const sr = THREE.Sprite.prototype.raycast; THREE.Sprite.prototype.raycast = function (rc, hits) { if (rc.camera) sr.call(this, rc, hits); }; }
let LST_FR = 0;
function lst_mixer() {
  const mu = THREE.AnimationMixer.prototype.update;
  THREE.AnimationMixer.prototype.update = function (dt) {
    if (LST.mixer) { let out = false; for (let p = this.getRoot(); p && p.isObject3D; p = p.parent) if (p.__lstOut === LST_FR) { out = true; break; }
      if (out) { this.__lacc = (this.__lacc || 0) + dt; if (this.__lacc < .1) return this; dt = this.__lacc; this.__lacc = 0; return mu.call(this, dt); }
      if (this.__lacc) { dt += this.__lacc; this.__lacc = 0; } }
    return mu.call(this, dt); };
}
function lst_markOut() { LST_FR++; const h = RIGS.hid; for (let i = 0; i < h.length; i++) h[i].__lstOut = LST_FR; }

// 8) SKELETT-LISTE OHNE RUCKLER. Die Basis sammelte alle ~5 s die Figuren-Skelette mit einem Durchlauf über die ganze Szene (46 000 Objekte) und maß jede neue
//    Figur mit Box3.setFromObject – bei Figuren mit Skelett rechnet three.js dafür jeden Eckpunkt durch alle Knochen (100 000 Punkte je Figur; gemessen 7 % der
//    Rechenzeit beim Ankommen an der Kreuzung). Jetzt sammelt die Hintergrund-Durchsicht (1) die Skelette nebenbei, und die Größe kommt aus den Hüllen der
//    Formen in Ruhelage (gleiche Größenordnung, nur für die Ausblend-Entfernung gebraucht). Gleiche Regeln wie rigScan der Basis.
function lst_rigRoot(o) { const up = LST.up || (LST.up = new Set()); up.clear(); for (let p = o; p; p = p.parent) up.add(p); let r = o.skeleton.bones[0]; while (r && !up.has(r)) r = r.parent;
  if (!r || r === scene || r.parent === scene && r.children.length > 40) return null; return r; }
function lst_rigs() {
  const bb = LST.bb || (LST.bb = new THREE.Box3()), tb = LST.tb || (LST.tb = new THREE.Box3()), sp = LST.sp || (LST.sp = new THREE.Sphere()), L = [];
  for (const r of LST.rigNext) { let inS = false; for (let p = r; p; p = p.parent) if (p === scene) { inS = true; break; } if (!inS) continue;
    const k = RIGS.known.get(r); if (k) { L.push({ r, R: k.R, size: k.size }); continue; }
    let glow = false; bb.makeEmpty(); r.updateWorldMatrix(true, true);
    r.traverse(o => { if (o.material) for (const m of [].concat(o.material)) if (m && m.fog === false) glow = true;
      if (o.isMesh && o.geometry && o.geometry.attributes.position) { const g = o.geometry; if (!g.boundingBox) g.computeBoundingBox(); bb.union(tb.copy(g.boundingBox).applyMatrix4(o.matrixWorld)); } });
    const size = bb.isEmpty() ? 1 : bb.getBoundingSphere(sp).radius, R = glow ? RIGS.RG : THREE.MathUtils.clamp(size * 60, 48, RIGS.R); // 08.10. (Auftritt): Mindestweite 28 -> 48 m, sonst poppen kleine Tiere bei 36 % Sichtbarkeit weg
    RIGS.known.set(r, { R, size }); L.push({ r, R, size }); }
  for (let i = 0; i < L.length; i++) lst_kHook(L[i].r);
  RIGS.list = L; LST.rigNext.clear();
  if (!LST.rigOk) { LST.rigOk = true; rigScan = () => {}; } // ab jetzt pflegt die Durchsicht die Liste
}

// 14) KNOCHEN NUR NACHRECHNEN, WENN SIE SICH BEWEGT HABEN (08.10.). Die Basis (Abschnitt 5) rechnet Weltmatrizen nur für Bewegtes nach – Knochen aber immer
//    („bewegen sich fast immer“), und jedes Figurenteil (SkinnedMesh, bis 30 je Figur) kehrt seine Matrix jedes Bild um. Seit die Animationen ferner Figuren
//    nur noch 30/15/5× je Sekunde laufen (figuren.js, Basis 6, Abschnitt 2), stehen deren Knochen in den Bildern dazwischen still. Jetzt gilt in jeder
//    Skelett-Wurzel derselbe Vergleich wie für alles andere (Lage/Drehung/Größe gegen das letzte Bild), unbewegte Figurenteile behalten ihre Matrizen.
//    Ergebnis Zahl für Zahl gleich (gleiche Eingaben → gleiche Matrizen); ausdrückliche updateMatrixWorld(true)-Aufrufe rechnen weiter alles.
//    Dazu (Skelett): die Knochen-Textur wird nur neu gefüllt und hochgeladen, wenn sich eine Knochen-Weltmatrix geändert hat.
const LK = { on: LST_NEU, sk: LST_NEU, act: false, OBJ: THREE.Object3D.prototype.updateMatrixWorld, skip: 0, upd: 0 };
function lst_kAuto() { const s0 = scene.updateMatrixWorld; scene.updateMatrixWorld = function (f) { if (f) return s0.call(this, f); LK.act = true; try { return s0.call(this, f); } finally { LK.act = false; } }; } // nur der automatische Aufruf beim Zeichnen
function lst_kHook(r) { if (r.updateMatrixWorld === lst_kRoot) return; if (r.updateMatrixWorld !== LK.OBJ) return; r.updateMatrixWorld = lst_kRoot; } // nur Knoten mit der Standard-Logik (keine Kameras, keine Figurenteile mit eigener)
function lst_kRoot(force) { if (!LK.act) return LK.OBJ.call(this, force); lst_kUpd(this, !!force, true); } // ausdrückliche Aufrufe der Spiel-Logik: Standard (rechnet alles)
function lst_kMoved(o) { let c = o.__mc; // wie moved() der Basis (gleicher Zwischenspeicher)
  if (o.matrixAutoUpdate) { const p = o.position, q = o.quaternion, s = o.scale;
    if (c && c[0] === p.x && c[1] === p.y && c[2] === p.z && c[3] === q._x && c[4] === q._y && c[5] === q._z && c[6] === q._w && c[7] === s.x && c[8] === s.y && c[9] === s.z) return false;
    if (!c || c.length !== 10) c = o.__mc = new Float64Array(10);
    c[0] = p.x; c[1] = p.y; c[2] = p.z; c[3] = q._x; c[4] = q._y; c[5] = q._z; c[6] = q._w; c[7] = s.x; c[8] = s.y; c[9] = s.z; o.updateMatrix(); return true; }
  const e = o.matrix.elements; if (c && c.length === 16) { let same = true; for (let k = 0; k < 16; k++) if (c[k] !== e[k]) { same = false; break; } if (same) return false; }
  if (!c || c.length !== 16) c = o.__mc = new Float64Array(16); c.set(e); return true; }
function lst_kUpd(o, force, root) {
  const um = o.updateMatrixWorld;
  if (!root && um !== LK.OBJ && um !== lst_kRoot) { // eigene Logik (Figurenteile: Umkehrmatrix fürs Skinning, Kameras …)
    if (!(LK.on && o.isSkinnedMesh) || force || o.matrixWorldNeedsUpdate || lst_kMoved(o)) { o.updateMatrixWorld(force); return; }
    const ch = o.children; for (let i = 0; i < ch.length; i++) if (ch[i].matrixWorldAutoUpdate === true) lst_kUpd(ch[i], false, false); return; } // unbewegt: Weltmatrix und Umkehrung gelten weiter
  if (o.isBone && !LK.on) { o.updateMatrix(); force = true; } else if (lst_kMoved(o)) force = true;
  if (o.matrixWorldNeedsUpdate || force) { if (o.matrixWorldAutoUpdate) { if (o.parent) o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix); else o.matrixWorld.copy(o.matrix); } o.matrixWorldNeedsUpdate = false; force = true; }
  const ch = o.children; if (!ch.length) return;
  if (!o.visible) { o.__mwStale = true; return; } // unsichtbarer Zweig: wie Basis 5 (beim Wiedersichtbarwerden alles nach)
  if (o.__mwStale) { o.__mwStale = false; force = true; }
  for (let i = 0; i < ch.length; i++) { const c = ch[i]; if (c.matrixWorldAutoUpdate === true || force === true) lst_kUpd(c, force, false); } }
{ const su = THREE.Skeleton.prototype.update;
  THREE.Skeleton.prototype.update = function () { const B = this.bones, n = B.length;
    if (LK.sk) { let c = this.__mwc;
      if (c && c.length === n * 16) { let same = true; for (let i = 0; i < n && same; i++) { const b = B[i]; if (!b) continue; const e = b.matrixWorld.elements, o = i * 16; for (let k = 0; k < 16; k++) if (e[k] !== c[o + k]) { same = false; break; } }
        if (same) { LK.skip++; return; } }
      else c = this.__mwc = new Float64Array(n * 16);
      for (let i = 0; i < n; i++) { const b = B[i]; if (b) { const e = b.matrixWorld.elements, o = i * 16; for (let k = 0; k < 16; k++) c[o + k] = e[k]; } } }
    else this.__mwc = null;
    LK.upd++; return su.call(this); }; }

// 3) DUNKLE LICHTER WERFEN KEINEN SCHATTEN. three.js zeichnet das Schattenbild jedes Lichts mit Schatten in jedem Bild neu – auch wenn es gerade aus ist
//    (Taschenlampe aus: Stärke 0, trotzdem ein voller Szenendurchgang je Bild). Lichter mit Stärke 0 werden für dieses Bild übersprungen; geht die Lampe an,
//    entsteht ihr Schattenbild im selben Bild neu. Im Bild ändert sich nichts (ein Licht mit Stärke 0 trägt nichts bei).
function lst_schatten() {
  const sm = renderer.shadowMap, r0 = sm.render, L = [];
  let fr = 0;
  sm.render = function (lights, sc, cam) {
    const halb = LST.halbSchatten && (++fr & 1); // Prüfoption: Taschenlampen-Schatten nur jedes zweite Bild
    let dark = halb; for (let i = 0; i < lights.length && !dark; i++) { const l = lights[i]; if (!(l.intensity > 0) && l.shadow && l.shadow.autoUpdate) dark = true; }
    L.length = 0; for (let i = 0; i < lights.length; i++) { const l = lights[i]; if (!dark || (l.intensity > 0 && !(halb && l === flashlight)) || !l.shadow || !l.shadow.autoUpdate) L.push(l); }
    if (!LST.sweite || !this.autoUpdate || sc !== scene) return r0.call(this, L, sc, cam);
    // 9) Kegellichter, deren Schattenbild jetzt entsteht, einzeln: Gruppen und Figuren ganz außerhalb ihres Schattenkegels werden für diesen Durchgang nicht durchlaufen
    S1.length = 0; R1.length = 0; for (let i = 0; i < L.length; i++) { const l = L[i]; (l.isSpotLight && l.castShadow && (l.shadow.autoUpdate || l.shadow.needsUpdate) ? S1 : R1).push(l); }
    if (!S1.length) return r0.call(this, L, sc, cam);
    if (R1.length) r0.call(this, R1, sc, cam);
    for (let i = 0; i < S1.length; i++) { const l = S1[i]; let n = 0; try { n = lst_schattenAus(l); } catch (e) { LST.sweite = false; console.warn('Leistung: Schattenkegel', e); }
      try { One[0] = l; r0.call(this, One, sc, cam); } finally { for (let k = 0; k < n; k++) SH[k].visible = true; SH.length = 0; } }
  };
}
const S1 = [], R1 = [], One = [null], SH = [], SHS = new THREE.Sphere();
function lst_schattenAus(l) { l.shadow.updateMatrices(l); const fr = l.shadow.getFrustum(); let n = 0;
  for (const E of VCULL.list) { const o = E.o; if (E.r < 0 || !o.visible || !o.parent) continue; const e = o.matrixWorld.elements;
    SHS.center.set(E.c.x, E.c.y, E.c.z).applyMatrix4(o.matrixWorld); SHS.radius = E.r * Math.sqrt(Math.max(e[0] * e[0] + e[1] * e[1] + e[2] * e[2], e[4] * e[4] + e[5] * e[5] + e[6] * e[6], e[8] * e[8] + e[9] * e[9] + e[10] * e[10])) + .5;
    if (!fr.intersectsSphere(SHS)) { o.visible = false; SH.push(o); n++; } }
  for (const g of RIGS.list) { const r = g.r; if (!r.visible || !r.parent) continue; const e = r.matrixWorld.elements; SHS.center.set(e[12], e[13], e[14]); SHS.radius = g.size * 1.5 + 1.5;
    if (!fr.intersectsSphere(SHS)) { r.visible = false; SH.push(r); n++; } }
  return n; }

// 4) HINTER DEM NEBEL NICHTS DURCHLAUFEN. Die Basis blendet nur schwere Einzelmodelle (> 15 000 Dreiecke) jenseits des Nebels aus; alles andere –
//    Häuser, Zäune, Autos, ganze Innenräume anderer Häuser – wurde weiter durchlaufen, geprüft und gezeichnet, obwohl der Nebel (Dichte 0,034) dort
//    > 99,7 % schluckt. Jetzt: feste Einzelteile der Kleinteil-Auslese (Basis Abschnitt 8: normal beleuchtet, vernebelt, eigene Hülle) fallen für das Bild weg,
//    wenn ihre Hülle ganz hinter der 0,3-%-Sichtweite liegt (aus der aktuellen Nebeldichte berechnet: 71 m bei 0,034; dünnerer Nebel → weiter, ohne Nebel nie).
//    Nicht bei Blitzen (Himmel hell → ferne Umrisse sichtbar) und nicht in Bildern, in denen Mond-/Laternenschatten neu entstehen. Wie 6/7/8 der Basis:
//    nur für das Zeichnen, direkt nach dem Bild ist alles wieder da (über RIGS.hid / rigFarShow).
const NEB = { cx: 1e9, cy: 0, cz: 1e9, msrc: null, mesh: [], j: 0, R: 0, hid: 0 };
// Kandidaten: einzelne feste Teile der Kleinteil-Auslese (Basis 8) – ihre Hülle stimmt immer (eigene Form, eigene Weltmatrix). Ganze Gruppen nicht:
// deren Hüllen (Blickfeld-Auslese) veralten, wenn Module später Teile hineinhängen.
function neb_buildMesh() { NEB.msrc = DCULL.list; NEB.mesh = DCULL.list.map(E => ({ o: E.o, D: E, far: false })); NEB.j = 0; }
function neb_hide() {
  if (!LST.nebel || !scene.fog || !scene.fog.isFogExp2 || !(scene.fog.density > 0)) return;
  if (moon.shadow.needsUpdate || keyLight.shadow.needsUpdate || lampPool[0].shadow.needsUpdate || lampPool[1].shadow.needsUpdate) return;
  if (skyMat.uniforms.flash && skyMat.uniforms.flash.value > .01) return;
  const R = Math.min(LST.nebelK / scene.fog.density, camera.far); if (R >= camera.far) return;
  if (NEB.msrc !== DCULL.list) neb_buildMesh();
  const c = camera.matrixWorld.elements, cx = c[12], cy = c[13], cz = c[14], jump = R !== NEB.R || Math.abs(cx - NEB.cx) + Math.abs(cy - NEB.cy) + Math.abs(cz - NEB.cz) > 1.5; NEB.R = R; NEB.cx = cx; NEB.cy = cy; NEB.cz = cz; // Kamerasprung (Schnitt, Teleport) → alles sofort neu
  // Entscheidung laufend in Portionen (alle Kandidaten in ~10 Bildern), nach einem Sprung der Sichtweite/Kamera sofort für alle
  const nM = jump ? NEB.mesh.length : Math.ceil(NEB.mesh.length / 10);
  for (let k = 0; k < nM && NEB.mesh.length; k++) { const N = NEB.mesh[NEB.j++ % NEB.mesh.length], D = N.D, e = D.e, x = D.x, y = D.y, z = D.z;
    N.far = Math.hypot(e[0] * x + e[4] * y + e[8] * z + e[12] - cx, e[1] * x + e[5] * y + e[9] * z + e[13] - cy, e[2] * x + e[6] * y + e[10] * z + e[14] - cz) - D.R > R + 2; }
  // Ausblenden in jedem Bild (die Entscheidung gilt, bis die Portion wieder dran ist – 2 m Sicherheitsrand für die Bewegung in dieser Zeit)
  let n = 0; const hid = RIGS.hid;
  for (let k = 0; k < NEB.mesh.length; k++) { const N = NEB.mesh[k]; if (N.far && N.o.visible) { N.o.visible = false; hid.push(N.o); n++; } }
  NEB.hid = n;
}
function lst_nebel() { const dc0 = dcullHide; dcullHide = function () { dc0(); try { neb_hide(); } catch (e) { LST.nebel = false; console.warn('Leistung: Nebel', e); } if (LST.mixer) lst_markOut(); }; }

// 5) SPIEGEL-SONDE DER FENSTER (fassaden.js) BILLIGER. Alle ~18 m zeichnet die Sonde sechs Bilder lang je eine Würfelseite (128 × 128 Pixel) – jedes Mal die
//    ganze Szene wie ein volles Bild (Ruckler beim Gehen). Für die Sonde zählen nur große Formen: Teile unter einem Sonden-Pixel, Teile hinter dem Nebel und
//    ferne Figuren fallen für diese Seite weg (gleiche Regeln wie im Hauptbild). Die Spiegelung sieht gleich aus (was fehlt, wäre kleiner als ein Sondenpixel).
function lst_sonde() {
  if (typeof fassaden_probeFace !== 'function' || typeof fassaden_S === 'undefined') return;
  const f0 = fassaden_probeFace, hid = [];
  fassaden_probeFace = function (i) {
    const P = fassaden_S.probe; if (!LST.sonde || !P) return f0(i);
    hid.length = 0;
    const au = scene.matrixWorldAutoUpdate; scene.matrixWorldAutoUpdate = false; // Matrizen stehen vom letzten Bild (Sonde 1 Bild alt: unsichtbar)
    try { const p = P.cam.position, px = p.x, py = p.y, pz = p.z, R = scene.fog && scene.fog.isFogExp2 && scene.fog.density > 0 ? Math.min(1.7 / scene.fog.density, 80) : 80, K = 64; // 128 px, 90°; Sondenweite: Nebel lässt < 6 % durch (50 m bei 0,034), im Glas × Fresnel ≈ unsichtbar
      for (const E of DCULL.list) { const o = E.o; if (!o.visible) continue; const e = E.e, x = E.x, y = E.y, z = E.z;
        const d = Math.hypot(e[0] * x + e[4] * y + e[8] * z + e[12] - px, e[1] * x + e[5] * y + e[9] * z + e[13] - py, e[2] * x + e[6] * y + e[10] * z + e[14] - pz) - E.R;
        if (d > R || (d > .5 && E.R * K < d)) { o.visible = false; hid.push(o); } }
      for (const g of RIGS.list) { const r = g.r; if (!r.visible) continue; const m = r.matrixWorld.elements; if (Math.hypot(m[12] - px, m[14] - pz) > g.R) { r.visible = false; hid.push(r); } }
      return f0(i);
    } finally { scene.matrixWorldAutoUpdate = au; for (let k = 0; k < hid.length; k++) hid[k].visible = true; hid.length = 0; } };
}

// 6) LICHTWERTE NUR EINMAL JE PROGRAMM UND BILD HOCHLADEN. three.js lädt bei jedem Programmwechsel alle Lichtwerte (18 Lichter: Lage, Richtung, Farbe,
//    Kegel, Schattenmatrizen …) neu ins Programm – im Bild ~600 Wechsel × ~150 Werte (gemessen ~8 % der Bildzeit). Innerhalb eines Zeichenaufrufs
//    (renderer.render) sind diese Werte für alle Programme gleich, und ein Programm behält hochgeladene Werte. Darum: hat dieses Programm die Lichtwerte
//    dieses Zeichenaufrufs schon, entfällt das erneute Hochladen. Texturen (Schattenbilder) werden weiter jedes Mal gebunden. Im Bild ändert sich nichts.
const LICHT_IDS = new Set(['spotLights', 'pointLights', 'directionalLights', 'hemisphereLights', 'rectAreaLights', 'spotLightShadows', 'pointLightShadows', 'directionalLightShadows',
  'spotLightMatrix', 'directionalShadowMatrix', 'pointShadowMatrix', 'lightProbe', 'hamG']);
let LST_RC = 0;
function lst_licht() { const r0 = renderer.render; renderer.render = function (s, c) { LST_RC++; return r0.call(this, s, c); }; }
// Die (nicht exportierten) Uniform-Klassen von three.js an einem schon benutzten Programm finden und einmalig erweitern
function lst_lichtPatch(prog) {
  if (LST.lichtOk || !prog) return; const U = prog.getUniforms(); if (!U || !U.seq) return; const done = LST.lichtP || (LST.lichtP = new Set());
  if ((LST.lichtN = (LST.lichtN | 0) + 1) > 200) { LST.lichtOk = true; return; } // nicht ewig suchen
  for (const u of U.seq) { if (!LICHT_IDS.has(u.id)) continue; const P = Object.getPrototypeOf(u); if (!P || done.has(P) || P.__lstLicht || typeof P.setValue !== 'function') continue; done.add(P); P.__lstLicht = true;
    const s0 = P.setValue; P.setValue = function (gl, v, tex) { if (LST.licht && LICHT_IDS.has(this.id)) { if (this.__rc === LST_RC && this.__lv === v) return; this.__rc = LST_RC; this.__lv = v; } return s0.call(this, gl, v, tex); }; }
  if (done.size >= 2) LST.lichtOk = true; // Struktur- und Feld-Uniform gefunden
}
// 7) TASCHENLAMPEN-RÜCKSTREUUNG: der Strahl (14 m) prüfte in jedem Bild alle Verdecker der Welt. Jetzt nur die in der Nähe (Liste alle 2 m / 0,5 s neu,
//    mit Sicherheitsrand) – gleiches Ergebnis, weil alles Fernere den 14-m-Strahl nicht erreichen kann.
function lst_strahl() {
  if (typeof bray === 'undefined' || typeof occluders === 'undefined') return; const i0 = bray.intersectObjects.bind(bray), near = [], v = new THREE.Vector3(); let cx = 1e9, cz = 1e9, n = -1, t = 0;
  bray.intersectObjects = function (objs, rec, target) {
    if (objs !== occluders || !LST.strahl) return i0(objs, rec, target);
    const p = this.ray.origin; t--;
    if (n !== occluders.length || t <= 0 || Math.abs(p.x - cx) + Math.abs(p.z - cz) > 2) { n = occluders.length; t = 30; cx = p.x; cz = p.z; near.length = 0; const lim = this.far + 6;
      for (const o of occluders) { const g = o.geometry; if (!g || !o.parent) continue; if (!g.boundingSphere) g.computeBoundingSphere(); const s = g.boundingSphere; v.copy(s.center).applyMatrix4(o.matrixWorld);
        if (v.distanceTo(p) - s.radius * o.matrixWorld.getMaxScaleOnAxis() < lim) near.push(o); } }
    return i0(near, rec, target); };
}

// 10) NACHBILDER VORLADEN. Ein Nachbild besetzt beim Start bis zu acht echte Figuren (Kreuzung: sieben Kinder + Vegas) – bisher erst in dem Moment:
//    Figuren klonen, Erinnerungs-Materialien anlegen, Programme übersetzen, Texturen hochladen (gemessen an der Kreuzung bis 200 ms Standbild, 9–17 FPS
//    beim Ankommen). Jetzt: Kommt Luke einem noch nicht gesehenen Nachbild auf 45 m nahe, werden dessen Figuren unsichtbar im Hintergrund besetzt
//    (eine je Bild); die Shader-Wache (1) übersetzt ihre Programme, solange sie versteckt sind, und ihre Texturen werden einzeln (eine je Bild) hochgeladen.
//    Beim Start findet ECHO_CAST.start alles fertig vor (gleiche Besetzung → figuren_embody kehrt sofort zurück). Am Ablauf ändert sich nichts.
const ECP = { t: 0, id: null, busy: false, tex: [], seen: new WeakSet(), n: 0, ruhig: 0 };
function lst_echoVor(dt) {
  ECP.ruhig = dt > .04 ? 0 : ECP.ruhig + dt; // nur in ruhigen Phasen arbeiten (nicht zusammen mit dem Aufbau eines gerade betretenen Raums)
  if (ECP.tex.length && ECP.ruhig > .25) { try { renderer.initTexture(ECP.tex.shift()); ECP.n++; } catch (e) {} }
  if ((ECP.t -= dt) > 0) return; ECP.t = .5;
  if (ECP.busy || ECP.ruhig < 1 || state.talking || typeof FIGUREN_ECHO === 'undefined' || typeof echoAnchors === 'undefined' || typeof figuren_embody !== 'function') return;
  const p = player.pos; let best = null, bd = 45 * 45;
  for (const A of echoAnchors) { const E = A.E; if (echoSeen.has(E.id) || !FIGUREN_ECHO[E.id]) continue; const dx = E.at[0] - p.x, dz = E.at[2] - p.z, d = dx * dx + dz * dz; if (d < bd) { bd = d; best = E; } }
  if (!best || best.id === ECP.id) return;
  ECP.id = best.id; ECP.busy = true; lst_echoLaden(best).catch(e => console.warn('Leistung: Nachbild vorladen', e)).finally(() => { ECP.busy = false; });
}
async function lst_echoLaden(E) { const cast = FIGUREN_ECHO[E.id];
  for (let i = 0; i < E.figs.length && i < echoFigs.length; i++) { const F = echoFigs[i], f = E.figs[i]; if (!cast[i] || state.talking || F.visible) return; // läuft schon ein Nachbild: nichts anfassen
    const P = await figuren_embody(F, cast[i], { ghost: true, doll: f[3] < .45, clip: f[3] < .45 ? 'idle' : null });
    if (P && P.obj) P.obj.traverse(o => { if (o.material) for (const m of [].concat(o.material)) for (const k of ['map', 'alphaMap', 'normalMap']) { const t = m && m[k]; if (t && t.isTexture && !ECP.seen.has(t)) { ECP.seen.add(t); ECP.tex.push(t); } } });
    do await new Promise(r => requestAnimationFrame(r)); while (ECP.ruhig < .5 && !state.talking); }
}

// 15) STILLE ZWEIGE EINFRIEREN (08.10., Gras/Transparente/Matrizen-Agent). Die Basis (Abschnitt 5) vergleicht in jedem Bild Lage/Drehung/Größe JEDES sichtbaren
//    Knotens mit dem letzten Bild (gemessen an der Kreuzung: moved/upd/updateMatrixWorld ≈ 15 % der Rechenzeit) – auch von Häusern, Zäunen, Möbeln, die nie
//    bewegt werden. Jetzt: Ein Zweig (Hülle ≤ 20 m), in dem sich 4 s lang nichts bewegt hat und der keine Figur/Knochen/Kamera/Licht/eigene Matrix-Logik
//    enthält, wird eingefroren – der Durchlauf überspringt ihn. Wache: Zweige bis 10 m um Kamera und Luke werden JEDES Bild vollständig geprüft (Türen,
//    Schubladen, Schreckmomente: im selben Bild), alle übrigen reihum in höchstens 6 Bildern; jede Änderung (auch unsichtbarer Teile oder neu angehängter
//    Kinder über add/attach) taut den Zweig sofort auf und rechnet wie bisher. Bewegt sich ein Elternteil, wird der Zweig ebenfalls aufgetaut.
//    Gleiche Matrizen wie vorher (nichts wird geschätzt); ausdrückliche updateMatrixWorld(true)-Aufrufe rechnen weiter alles.
const MWF = { on: LST_NEU && !/nofreeze/.test(location.search), base: THREE.Object3D.prototype.updateMatrixWorld, now: 0, still: 4000, R: 10, maxR: 20, sweep: 6,
  units: [], cur: 0, tick: 0, chk: -1, tries: 0, box: new THREE.Box3(), sp: new THREE.Sphere(), n: 0, wake: 0, frz: 0, nodes: 0, nearN: 0 };
function mwf_moved(o) { let c = o.__mc; // wie moved() der Basis (gleicher Zwischenspeicher __mc)
  if (o.matrixAutoUpdate) { const p = o.position, q = o.quaternion, s = o.scale;
    if (c && c[0] === p.x && c[1] === p.y && c[2] === p.z && c[3] === q._x && c[4] === q._y && c[5] === q._z && c[6] === q._w && c[7] === s.x && c[8] === s.y && c[9] === s.z) return false;
    if (!c || c.length !== 10) c = o.__mc = new Float64Array(10);
    c[0] = p.x; c[1] = p.y; c[2] = p.z; c[3] = q._x; c[4] = q._y; c[5] = q._z; c[6] = q._w; c[7] = s.x; c[8] = s.y; c[9] = s.z; o.updateMatrix(); return true; }
  const e = o.matrix.elements; if (c && c.length === 16) { let same = true; for (let k = 0; k < 16; k++) if (c[k] !== e[k]) { same = false; break; } if (same) return false; }
  if (!c || c.length !== 16) c = o.__mc = new Float64Array(16); c.set(e); return true; }
// Durchlauf wie Basis 5; liefert true, wenn sich im Zweig etwas bewegt hat (oder er von oben mitbewegt wurde)
function mwf_upd(o, force) {
  if (o.updateMatrixWorld !== MWF.base) { o.updateMatrixWorld(force); o.__lm = MWF.now; return true; } // Kameras, Figuren, Skelett-Wurzeln: eigene Logik, gelten als bewegt
  let ch = force;
  if (o.isBone) { o.updateMatrix(); force = true; ch = true; } else if (mwf_moved(o)) { force = true; ch = true; }
  if (o.matrixWorldNeedsUpdate || force) { if (o.matrixWorldAutoUpdate) o.matrixWorld.multiplyMatrices(o.parent.matrixWorld, o.matrix); o.matrixWorldNeedsUpdate = false; force = true; ch = true; }
  const c = o.children;
  if (c.length) {
    if (!o.visible) o.__mwStale = true;
    else { if (o.__mwStale) { o.__mwStale = false; force = true; ch = true; }
      for (let i = 0; i < c.length; i++) { const k = c[i];
        if (k.__frz) { if (force) { k.__frz = false; MWF.wake++; mwf_upd(k, true); ch = true; } continue; }
        if (k.matrixWorldAutoUpdate === true || force === true) { if (mwf_upd(k, force)) ch = true; } } } }
  if (ch || o.__lm === undefined) o.__lm = MWF.now; else if (MWF.now - o.__lm > MWF.still && !(o.__mwNo > MWF.now)) mwf_try(o);
  return ch; }
// Einfrieren versuchen: nur kleine Zweige ohne Bewegliches mit eigener Logik
function mwf_try(o) {
  if (MWF.tries <= 0) return; MWF.tries--; // höchstens wenige je Bild (kein Ruckler, wenn nach dem Laden alles gleichzeitig still wird)
  let n = 0; const inner = [], S = [o];
  while (S.length) { const x = S.pop(); n++; if (x !== o && x.__frz) inner.push(x);
    if (x.isBone || x.isSkinnedMesh || x.isCamera || x.isLight || x.isInstancedMesh || x.isBatchedMesh || x.updateMatrixWorld !== MWF.base || n > 4000) { o.__mwNo = MWF.now + (o === x && x.isInstancedMesh ? 1e12 : 20000); return; } // Instanzen: Hülle wäre teuer zu messen, Gewinn klein
    const c = x.children; for (let i = 0; i < c.length; i++) S.push(c[i]); }
  const B = MWF.box.setFromObject(o); let x = o.matrixWorld.elements[12], y = o.matrixWorld.elements[13], z = o.matrixWorld.elements[14], r = 0;
  if (!B.isEmpty()) { B.getBoundingSphere(MWF.sp); x = MWF.sp.center.x; y = MWF.sp.center.y; z = MWF.sp.center.z; r = MWF.sp.radius; }
  if (r > MWF.maxR) { o.__mwNo = MWF.now + 60000; return; } // zu groß: die Kinder werden einzeln eingefroren
  for (const k of inner) k.__frz = false; // aufgehen im größeren Zweig
  MWF.base.call(o, true); o.traverse(mwf_moved); // alles (auch Unsichtbares) einmal exakt nachrechnen, Vergleichswerte anlegen
  o.__frz = true; const U = { o, x, y, z, r, n }; o.__frzU = U; MWF.units.push(U); MWF.frz++; }
// Wache: ganzer Zweig (auch unsichtbare Teile) gegen die gespeicherten Werte; Änderung → markieren (die Basis-Logik rechnet im selben Bild nach)
function mwf_verify(o) { let hit = false; const S = MWF.stk || (MWF.stk = []); S.length = 0; S.push(o);
  if (!o.children.length) { if (o.updateMatrixWorld !== MWF.base || o.isBone) return true; if (mwf_moved(o)) { o.matrixWorldNeedsUpdate = true; return true; } return false; }
  while (S.length) { const x = S.pop(); if (x.updateMatrixWorld !== MWF.base || x.isBone) { hit = true; continue; }
    if (mwf_moved(x)) { x.matrixWorldNeedsUpdate = true; hit = true; }
    const c = x.children; for (let i = 0; i < c.length; i++) S.push(c[i]); }
  return hit; }
function mwf_check() {
  const U = MWF.units; if (!U.length) return;
  const e = camera.matrixWorld.elements, cx = e[12], cy = e[13], cz = e[14], px = player.pos.x, py = player.pos.y + 1, pz = player.pos.z, R = MWF.R;
  let w = 0, nodes = 0, near = 0;
  for (let i = 0; i < U.length; i++) { const u = U[i]; if (!u.o.__frz || u.o.__frzU !== u) continue; if (!u.o.parent) { u.o.__frz = false; continue; } U[w++] = u; nodes += u.n;
    const rr = R + u.r, dx = u.x - cx, dy = u.y - cy, dz = u.z - cz, qx = u.x - px, qy = u.y - py, qz = u.z - pz;
    if (dx * dx + dy * dy + dz * dz < rr * rr || qx * qx + qy * qy + qz * qz < rr * rr) { near++; u.nf = MWF.tick; if (mwf_verify(u.o)) { u.o.__frz = false; u.o.__lm = MWF.now; MWF.wake++; } } }
  U.length = w; MWF.n = w; MWF.nodes = nodes; MWF.nearN = near; if (!w) return;
  // ferne Zweige reihum: alle in höchstens MWF.sweep Bildern
  let budget = Math.ceil(nodes / MWF.sweep);
  for (let k = 0; k < w && budget > 0; k++) { const u = U[MWF.cur++ % w]; if (u.nf === MWF.tick || !u.o.__frz) continue; budget -= u.n;
    if (mwf_verify(u.o)) { u.o.__frz = false; u.o.__lm = MWF.now; MWF.wake++; } } }
function lst_freeze() {
  if (!MWF.on) return;
  // Neu angehängte Kinder: eingefrorenen Vorfahren sofort auftauen (sonst stünde das Kind bis zur nächsten Wache im Nullpunkt)
  const add0 = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add = function (...a) { const r = add0.apply(this, a);
    if (MWF.on) { for (let i = 0; i < a.length; i++) if (a[i] && a[i].__frz) a[i].__frz = false; for (let p = this; p; p = p.parent) if (p.__frz) { p.__frz = false; p.__lm = MWF.now; MWF.wake++; break; } }
    return r; };
  const s0 = scene.updateMatrixWorld;
  scene.updateMatrixWorld = function (force) {
    if (force || !MWF.on || MWF.pause) return s0.call(this, force); // pause: Vergleichsmessung (Basis rechnet wie vorher; gemeinsamer Vergleichsspeicher hält alles stimmig)
    MWF.now = performance.now();
    if (MWF.chk !== MWF.tick) { MWF.chk = MWF.tick; MWF.tries = 150; try { mwf_check(); } catch (e) { MWF.on = false; for (const u of MWF.units) u.o.__frz = false; console.warn('Leistung: Einfrieren', e); return s0.call(this, force); } }
    if (mwf_moved(this) || this.matrixWorldNeedsUpdate) { this.matrixWorld.copy(this.matrix); this.matrixWorldNeedsUpdate = false; force = true; }
    const ch = this.children; for (let i = 0; i < ch.length; i++) { const c = ch[i];
      if (c.__frz) { if (force) { c.__frz = false; mwf_upd(c, true); } continue; }
      if (c.matrixWorldAutoUpdate === true || force === true) mwf_upd(c, !!force); } };
  MWF.off = () => { MWF.on = false; for (const u of MWF.units) u.o.__frz = false; MWF.units.length = 0; }; // Vergleichsmessung
  MWF.an = () => { MWF.on = true; };
}

WORLD_MODS.push(['Leistung', async () => {
  window.__leistung = { S: LST, NEB, ECP, LK, MWF, preset(q) { settings.gfx = q; settings.fx = { ...GRAFIK_PRESET[q] }; applyQuality(); grafik_anwenden(); return q; }, sondeMs() { if (typeof fassaden_S === 'undefined' || !fassaden_S.probe) return -1; const c = camera.position; fassaden_probeAt(c.x, 1.7, c.z); const t = performance.now(); for (let i = 0; i < 6; i++) fassaden_probeFace(i); fassaden_S.probe.face = -1; return +((performance.now() - t) / 6).toFixed(2); }, get PERF_CULL() { return PERF_CULL; }, get RIGS() { return RIGS; }, get VCULL() { return VCULL; }, get DCULL() { return DCULL; }, // Testzugriff
    zweigeTop(k = 25) { const out = []; scene.children.forEach((c, i) => { if (!c.visible) return; let n = 0, m = 0; const walk = o => { n++; if (o.isMesh) m++; if (!o.visible) return; for (const x of o.children) walk(x); }; walk(c);
      let nm = c.name; if (!nm) { const s = []; c.traverse(o => { if (s.length < 3 && o !== c && (o.name || (o.material && o.material.name))) s.push(o.name || o.material.name); }); nm = '?' + s.join('/'); } out.push([nm + '#' + i, n, m]); });
      return out.sort((a, b) => b[1] - a[1]).slice(0, k).map(x => x.join(':')).join(' '); },
    zweige() { let n = 0, b = 0, m = 0; const walk = o => { n++; if (o.isBone) b++; if (o.isMesh) m++; if (!o.visible) return; for (const c of o.children) walk(c); }; for (const c of scene.children) if (c.visible) walk(c); return { n, b, m }; },
    figuren() { const out = [], c = camera.position, w = new THREE.Vector3(); if (typeof figuren_S === 'undefined') return out;
      for (const g of figuren_S.embodied) { const P = g.userData.person; if (!P || !g.visible || !g.parent) continue; w.setFromMatrixPosition(g.matrixWorld); let ms = 0, tri = 0, mo = 0, bones = 0; const names = [];
        P.obj.traverse(o => { if (o.isBone) bones++; if (!o.isMesh) return; ms++; const gi = o.geometry; const t = (gi.index ? gi.index.count : gi.attributes.position.count) / 3; tri += t; if (gi.morphAttributes && gi.morphAttributes.position) mo++; names.push(o.name + ':' + (t / 1000).toFixed(1) + 'k' + (o.visible ? '' : '(h)')); });
        out.push({ id: P.id, d: +w.distanceTo(c).toFixed(1), ms, tri: Math.round(tri), mo, bones, names: names.join(' ') }); }
      return out.sort((a, b) => a.d - b.d); } };
}]);
WORLD_TICK.push(dt => {
  if (!ui.ready) return;
  if (!LST.init) { LST.init = true; try { lst_seed(); } catch (e) { console.warn('Leistung: Bestand', e); LST.on = false; } try { lst_mixer(); } catch (e) { console.warn('Leistung: Animation', e); } try { lst_schatten(); } catch (e) { console.warn('Leistung: Schatten', e); } try { lst_nebel(); } catch (e) { console.warn('Leistung: Nebel', e); } try { lst_sonde(); } catch (e) { console.warn('Leistung: Sonde', e); } try { lst_licht(); } catch (e) { console.warn('Leistung: Licht', e); } try { lst_strahl(); } catch (e) { console.warn('Leistung: Strahl', e); } try { lst_freeze(); } catch (e) { MWF.on = false; console.warn('Leistung: Einfrieren', e); } try { lst_kAuto(); } catch (e) { LK.on = false; console.warn('Leistung: Knochen', e); } return; }
  MWF.tick++;
  if (!LST.on) return;
  lst_scan(); lst_flush();
  if (LST.echo) { try { lst_echoVor(dt); } catch (e) { LST.echo = false; console.warn('Leistung: Nachbilder', e); } }
});
