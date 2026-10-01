// =====================================================================  LEISTUNG (Modul „leistung“, Schluss-Leistungsprüfung 01.10.2026)
// Ganz zuletzt in der Modul-Reihenfolge: wirkt auf das, was alle anderen Module gebaut haben. Ändert nichts am Aussehen.
// 1) SHADER NIE IM LAUFENDEN BILD ÜBERSETZEN. Was erst im Spiel entsteht (Bewohnt-Deko beim Näherkommen, Figuren beim ersten Auftritt), brauchte neue
//    Shader-Programme – three.js übersetzt sie im Bild, in dem sie zum ersten Mal gezeichnet werden, und wartet darauf (gemessen: Nr. 7 betreten 7,4 s Standbild,
//    Zayn 4 × 0,3–0,55 s). Jetzt: (a) eine Hintergrund-Durchsicht der Szene (wenige hundert Knoten je Bild) findet neue Material-/Varianten-Paare, solange sie
//    noch versteckt sind, und übersetzt sie parallel (KHR_parallel_shader_compile); (b) taucht trotzdem etwas Unübersetztes im Bild auf, wird nur dieses
//    Teil ausgelassen, bis sein Programm fertig ist (wenige Bilder), statt das ganze Spiel anzuhalten. Nur für die Spielszene; Nachbearbeitung/Schatten unberührt.
const LST_NEU = !window.__lstAus; // Vergleichsmessung: window.__lstAus = true vor dem Laden schaltet 2–7 ab
const LST = { rigNext: new Set(), rigOk: false, nebelK: 2.41, on: true, mixer: LST_NEU, nebel: LST_NEU, sonde: LST_NEU, licht: LST_NEU, lichtOk: false, strahl: LST_NEU, q: [], qm: new Set(), busy: false, busyT: 0, stack: [], scanT: 0, init: false, skip: 0, comp: 0, compMs: 0, last: '',
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
  if (!LST.qm.has(o)) { LST.qm.add(o); LST.q.push(o); } m.__lsP = (m.__lsP || 0) + 1; o.__lsSig = sig; return false; }
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
    const m = o.material; if (Array.isArray(m)) { for (let i = 0; i < m.length; i++) if (m[i] && !lst_known(m[i], lst_sig(o, o.geometry))) lst_check(o, m[i]); }
    else if (!lst_known(m, lst_sig(o, o.geometry))) lst_check(o, m); }
}

// 2) UNSICHTBARE TIERE UND FIGUREN SELTENER ANIMIEREN. Die Basis rechnet Animationen ferner Figuren nur ~3× je Sekunde (Abschnitt 6). Was nah, aber
//    gerade außerhalb des Blickfelds ist (Ratten, Krähen, Katzen, Figuren hinter Luke – von der Blickfeld-Auslese für das Bild ausgeblendet), lief weiter
//    in jedem Bild. Jetzt ~10× je Sekunde; die Zeit wird aufgeholt (Abläufe und Ende-Ereignisse bleiben pünktlich). Sobald es ins Blickfeld kommt, wieder jedes Bild.
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
    const size = bb.isEmpty() ? 1 : bb.getBoundingSphere(sp).radius, R = glow ? RIGS.RG : THREE.MathUtils.clamp(size * 60, 28, RIGS.R);
    RIGS.known.set(r, { R, size }); L.push({ r, R, size }); }
  RIGS.list = L; LST.rigNext.clear();
  if (!LST.rigOk) { LST.rigOk = true; rigScan = () => {}; } // ab jetzt pflegt die Durchsicht die Liste
}

// 3) DUNKLE LICHTER WERFEN KEINEN SCHATTEN. three.js zeichnet das Schattenbild jedes Lichts mit Schatten in jedem Bild neu – auch wenn es gerade aus ist
//    (Taschenlampe aus: Stärke 0, trotzdem ein voller Szenendurchgang je Bild). Lichter mit Stärke 0 werden für dieses Bild übersprungen; geht die Lampe an,
//    entsteht ihr Schattenbild im selben Bild neu. Im Bild ändert sich nichts (ein Licht mit Stärke 0 trägt nichts bei).
function lst_schatten() {
  const sm = renderer.shadowMap, r0 = sm.render, L = [];
  let fr = 0;
  sm.render = function (lights, sc, cam) {
    const halb = LST.halbSchatten && (++fr & 1); // Prüfoption: Taschenlampen-Schatten nur jedes zweite Bild
    let dark = halb; for (let i = 0; i < lights.length && !dark; i++) { const l = lights[i]; if (!(l.intensity > 0) && l.shadow && l.shadow.autoUpdate) dark = true; }
    if (!dark) return r0.call(this, lights, sc, cam);
    L.length = 0; for (let i = 0; i < lights.length; i++) { const l = lights[i]; if ((l.intensity > 0 && !(halb && l === flashlight)) || !l.shadow || !l.shadow.autoUpdate) L.push(l); }
    return r0.call(this, L, sc, cam); };
}

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

WORLD_MODS.push(['Leistung', async () => {
  window.__leistung = { S: LST, NEB, preset(q) { settings.gfx = q; settings.fx = { ...GRAFIK_PRESET[q] }; applyQuality(); grafik_anwenden(); return q; }, sondeMs() { if (typeof fassaden_S === 'undefined' || !fassaden_S.probe) return -1; const c = camera.position; fassaden_probeAt(c.x, 1.7, c.z); const t = performance.now(); for (let i = 0; i < 6; i++) fassaden_probeFace(i); fassaden_S.probe.face = -1; return +((performance.now() - t) / 6).toFixed(2); }, get PERF_CULL() { return PERF_CULL; }, get RIGS() { return RIGS; }, get VCULL() { return VCULL; }, get DCULL() { return DCULL; }, // Testzugriff
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
WORLD_TICK.push(() => {
  if (!ui.ready) return;
  if (!LST.init) { LST.init = true; try { lst_seed(); } catch (e) { console.warn('Leistung: Bestand', e); LST.on = false; } try { lst_mixer(); } catch (e) { console.warn('Leistung: Animation', e); } try { lst_schatten(); } catch (e) { console.warn('Leistung: Schatten', e); } try { lst_nebel(); } catch (e) { console.warn('Leistung: Nebel', e); } try { lst_sonde(); } catch (e) { console.warn('Leistung: Sonde', e); } try { lst_licht(); } catch (e) { console.warn('Leistung: Licht', e); } try { lst_strahl(); } catch (e) { console.warn('Leistung: Strahl', e); } return; }
  if (!LST.on) return;
  lst_scan(); lst_flush();
});
