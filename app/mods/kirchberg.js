// =====================================================================  KIRCHBERG (Modul „kirchberg“, AP-15 Fassung 3)
// Gisela Rieke, Am Kirchberg 3 (N-01/N-02): Haus 15 aus ausbau_nord.js, Küchenfenster, Napfbrett (18 Näpfe, 17 Namen), rotes Kinderrad von 1958,
// Nebenaufgabe 9 „Siebzehn Näpfe“ (vier Katzen einsammeln – Katzen aus katzen.js, AP-09; kleiner Tausch Kuli ↔ Dosendeckel mit Whiskey, AP-08).
// Pfarrhaus, Am Kirchberg 1 (N-05, Nebenaufgabe 11 „Laternenfest fällt aus“): Licht im Studierzimmer, Rad mit Kindersitz, Gemeindebrief, Aushang,
// Liederzettel, Kapellenfenster (acht Felder, von außen nur Umrisse), Martinsnische hinter dem Gitter, Glocke von drinnen (Schreck Stufe 2).
// Innenräume (je eigener Raum weit außerhalb, Überblendung wie anwesen_enterHall): Giselas Küche/Stube, Pfarrhaus-Studierzimmer, Kapelle innen –
// eingerichtet und bewohnt, gesperrt bis Kap. 3 (Giselas Tür, Pfarrhaus, Kapellengitter; AP-18 schließt auf: kirchberg_oeffne(id)).
// Außerdem: gemeinsame Werkzeuge für post.js und nr4.js (Papier-Texturen, Abziehbilder, Modelle setzen, Innenraum-Bau, Betreten/Verlassen,
// Figuren über das LWO-Figurensystem mit Blinzeln/Blick/Atmung) und das Register der 21 Kapitel-1-Nebenaufgaben (neue Namen, AP-15).
// Keine Lichter zur Laufzeit: alle VLights entstehen beim Laden (Raumlicht konstant, Fensterlicht mit 0 angelegt und nur in der Stärke geändert).
const kirchberg_S = { ready: false, steps: {}, katzen: {}, raeume: {}, inRaum: null, offen: {}, F: {}, figTry: false, t: 0, flags: {}, naepfe: [], kuli: false };
const KB_HAUS = { x: 26, z: 45, w: 11, d: 9 };         // Haus 15 (ausbau_nord.js) = Am Kirchberg 3
const KB_PFARR = { x: -60, z: 45, w: 11, d: 9 };       // Haus 11 = Am Kirchberg 1, Pfarrhaus
const KB_KAP = { x: -52.5, z: 86.6 };                  // Kapelle St. Martin (Scan, Tür nach Süden)
// Innenräume weit außerhalb der Welt (x < 250: gilt als „innen“, nicht als Untergrund), je 40 m Abstand
const KB_RAUM = { gisela: { x: -1440, z: 1400 }, pfarrhaus: { x: -1440, z: 1440 }, kapelle: { x: -1480, z: 1400 } };

// ---------------------------------------------------------------------  Werkzeuge (auch für post.js, nr4.js)
function kirchberg_cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; echt_an(() => fn(c.getContext('2d'), w, h)); return c; }
function kirchberg_tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
let kirchberg_rs = 1312; function kirchberg_r(a = 0, b = 1) { kirchberg_rs = (kirchberg_rs * 16807) % 2147483647; return a + (b - a) * (kirchberg_rs / 2147483647); } // fester Zufall
// Papier mit Handschrift: o = { w, h (Pixel), bg, lin: 'kariert'|'liniert'|null, zeilen: [[text, x, y, px, farbe?, font?, rot?]], flecken, tesa, knick }
function kirchberg_papier(o) {
  return kirchberg_tex(kirchberg_cnv(o.w || 512, o.h || 384, (x, w, h) => {
    const bg = o.bg || '#ece3cb'; papierScan(x, w, h, bg); // echtes Papier (Faser, Knitter, Schmutz aus dem Scan)
    if (o.lin === 'kariert') { x.strokeStyle = 'rgba(70,110,160,.22)'; x.lineWidth = 1; for (let i = 14; i < w; i += 18) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); } for (let i = 14; i < h; i += 18) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } }
    else if (o.lin === 'liniert') { x.strokeStyle = 'rgba(70,110,160,.25)'; for (let i = 44; i < h; i += 30) { x.beginPath(); x.moveTo(0, i); x.lineTo(w, i); x.stroke(); } x.strokeStyle = 'rgba(190,60,60,.3)'; x.beginPath(); x.moveTo(52, 0); x.lineTo(52, h); x.stroke(); }
    const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(80,55,20,.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h); // vergilbter Rand
    for (let i = 0; i < (o.flecken ?? 3); i++) { const cx = kirchberg_r() * w, cy = kirchberg_r() * h, r = 8 + kirchberg_r() * 40, gg = x.createRadialGradient(cx, cy, r * .6, cx, cy, r); gg.addColorStop(0, 'rgba(140,100,50,.06)'); gg.addColorStop(.9, 'rgba(120,80,30,.16)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gg; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); } // Kaffeeränder
    if (o.knick) { x.strokeStyle = 'rgba(60,40,20,.18)'; x.lineWidth = 2; x.beginPath(); x.moveTo(0, h / 2 + 3); x.lineTo(w, h / 2 - 3); x.stroke(); x.strokeStyle = 'rgba(255,255,255,.2)'; x.beginPath(); x.moveTo(0, h / 2 + 5); x.lineTo(w, h / 2 - 1); x.stroke(); }
    for (const z of o.zeilen || []) { const [t, zx, zy, px, farbe, font, rot] = z; x.save(); x.translate(zx, zy); x.rotate((rot ?? (kirchberg_r() - .5) * .03)); x.fillStyle = farbe || 'rgba(28,38,92,.9)'; x.font = `${px || 34}px ${font || '"Caveat", "Segoe Print", cursive'}`; x.fillText(t, 0, 0);
      if (z[7]) { x.strokeStyle = x.fillStyle; x.lineWidth = Math.max(1.5, (px || 34) / 16); const tw = x.measureText(t).width; for (let k = 0; k < z[7]; k++) { x.beginPath(); x.moveTo(0, 6 + k * 5); x.lineTo(tw, 4 + k * 5 + (kirchberg_r() - .5) * 3); x.stroke(); } } x.restore(); } // Unterstreichung durchs Papier
    if (o.tesa) { x.fillStyle = 'rgba(235,225,190,.55)'; x.save(); x.translate(w / 2, 10); x.rotate(-.04); x.fillRect(-w * .18, -12, w * .36, 34); x.restore(); }
    if (o.fn) o.fn(x, w, h);
  }));
}
// Flaches Abziehbild (Papier, Schild, Kreide, Schmutz): ry = Blickrichtung der Fläche (0 → +z), rx für liegende Dinge (−π/2 = Boden)
function kirchberg_decal(map, w, h, x, y, z, ry = 0, o = {}) {
  const m = new THREE.MeshStandardMaterial({ map, transparent: !!o.alpha, alphaTest: o.alpha ? .06 : 0, depthWrite: !o.alpha, roughness: o.rough ?? .92, metalness: 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3, emissive: o.emi ? 0xffffff : 0x000000, emissiveMap: o.emi ? map : null, emissiveIntensity: o.emi || 0 });
  const me = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); me.position.set(x, y, z); me.rotation.set(o.rx || 0, ry, o.rz || 0, 'YXZ'); me.receiveShadow = true; me.castShadow = !!o.cast; me.userData.noCol = true;
  (o.parent || scene).add(me); return me; }
// Scan-Modell: Klon, auf Größe, Unterkante auf 0, Mitte auf x/z = 0 (Gruppe)
async function kirchberg_mod(key, file = 'model.gltf', size = 0, axis = 'y') { try { const src = await msModel(key, file); const o = src.clone(true); if (size) msFit(o, size, axis); const g = msGround(o);
  g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g; } catch (e) { console.warn('Kirchberg: Modell ' + key, e); return null; } }
async function kirchberg_fbx(key, spec, size = 0, axis = 'y', file = 'model.fbx') { try { const o = await msFBX(key, file, spec); if (size) msFit(o, size, axis); const g = msGround(o); g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return g; } catch (e) { console.warn('Kirchberg: FBX ' + key, e); return null; } }
function kirchberg_setze(o, x, y, z, ry = 0, par) { if (!o) return null; o.position.set(x, y, z); o.rotation.y = ry; (par || scene).add(o); o.updateMatrixWorld(true); return o; }
function kirchberg_hit(w, h, d, x, y, z, label, fn) { const m = box(w, h, d, x, y, z, hidden, { cast: false }); m.userData.noCol = true; if (label) interact(m, label, fn); return m; }
function kirchberg_an(m, an) { if (!m) return; const i = interactables.indexOf(m); if (an && i < 0) interactables.push(m); else if (!an && i >= 0) interactables.splice(i, 1); }
function kirchberg_mat(key, tint = 0xffffff, tile = 2, nrm = 1) { const m = msSurfMat(key, { tint, nrm }); m.userData.tile = tile; return m; }
// Handschrift-Notiz (Fibel/Lore): Text mit \n, class „hand“
function kirchberg_notiz(title, text, lore, onClose) { openNote(title, `<span class="hand">${text.replace(/\n/g, '<br>')}</span>`, lore, onClose); }
// Oberfläche per Strahl von oben (Tischplatte, Fensterbank …)
const kirchberg_rc = new THREE.Raycaster();
function kirchberg_top(obj, x, z, from = 4, fb = 0) { if (!obj) return fb; obj.updateMatrixWorld(true); kirchberg_rc.set(new THREE.Vector3(x, from, z), new THREE.Vector3(0, -1, 0)); kirchberg_rc.far = 8; const h = kirchberg_rc.intersectObject(obj, true)[0]; return h ? h.point.y : fb; }
function kirchberg_boden(x, z, von = 3) { try { const g = solidGround(x, von, z); return g > -2 ? Math.max(0, g) : 0; } catch (e) { return 0; } }
// Dialog mit Antworten (Tasten 1…n) – nutzt die Auswahl des LWO-Moduls, sonst die erste Antwort
async function kirchberg_wahl(opts) { if (typeof lwo_wahl === 'function' && typeof LWO !== 'undefined' && LWO.wahlEl) return lwo_wahl(opts, { abbruch: () => !state.started }); return 0; }
async function kirchberg_sag(F, zeilen) { for (const [t, ms, who] of zeilen) { const d = Math.max(ms || 0, 1300 + t.length * 48); if (F && typeof lwo_sprich === 'function' && who && who !== 'LUKE') lwo_sprich(F, d * .9); subtitle(t, d + 250, who || ''); await wait(d); } }

// ---------------------------------------------------------------------  Innenräume (je ein eigener Raum weit draußen; Tür = Überblendung)
// def: { id, x, z, w, d, h, wand, wandTint, boden, bodenTint, decke, waende: [[axis, fixed, a, b, gaps]], raus: { x, z, yaw } (Welt), rein: { x, z, yaw } (Raum), tuer: [x, z, ry] (Raum),
//        klang: 'small'|'church', label }
function kirchberg_raum(def) {
  const x0 = def.x - def.w / 2, x1 = def.x + def.w / 2, z0 = def.z - def.d / 2, z1 = def.z + def.d / 2, H = def.h || 2.7;
  const wm = kirchberg_mat(def.wand || 'wallpaper_old', def.wandTint ?? 0xc8bca8, def.wandTile || 1.6), fm = kirchberg_mat(def.boden || 'floor_wood', def.bodenTint ?? 0x7a624c, def.bodenTile || 1.4), cm = kirchberg_mat(def.decke || 'wall_plaster', def.deckeTint ?? 0x8a867e, 2);
  fm.roughness = .75; const boden = plane(def.w, def.d, def.x, .002, def.z, fm), decke = box(def.w + .4, .2, def.d + .4, def.x, H + .1, def.z, cm, { cast: false });
  const gapS = def.tuerWand === 's' ? [{ at: def.tuer[0], w: 1.1 }] : [], gapN = def.tuerWand === 'n' ? [{ at: def.tuer[0], w: 1.1 }] : [];
  wall('x', z0, x0, x1, H, wm, gapS, .2); wall('x', z1, x0, x1, H, wm, gapN, .2); wall('z', x0, z0, z1, H, wm, [], .2); wall('z', x1, z0, z1, H, wm, [], .2);
  for (const w of def.waende || []) wall(w[0], w[1], w[2], w[3], H, w[5] || wm, w[4] || [], .12);
  // Fußleisten (dunkles Holz, Scan-Oberfläche) – die Wand endet nicht im Nichts
  const leiste = kirchberg_mat('planks_painted', 0x3a2c22, 1); for (const [ax, f, a, b] of [['x', z0 + .11, x0, x1], ['x', z1 - .11, x0, x1], ['z', x0 + .11, z0, z1], ['z', x1 - .11, z0, z1]]) { if (ax === 'x') box(b - a, .09, .02, (a + b) / 2, .045, f, leiste, { cast: false }); else box(.02, .09, b - a, f, .045, (a + b) / 2, leiste, { cast: false }); }
  indoorRects.push({ x0, x1, zb: z0, zf: z1, y: 0 });
  const R = { def, x0, x1, z0, z1, H, wm, fm, cm, boden, decke, g: new THREE.Group(), licht: [] }; R.g.name = 'kb_raum_' + def.id; scene.add(R.g);
  // Tür von innen (Scan-Tür, geschlossen) = Weg nach draußen
  if (def.tuer) { const [tx, tz, tr] = def.tuer; kirchberg_mod('door1', 'model.gltf', 2.08).then(d => { if (d) { d.position.set(tx, 0, tz); d.rotation.y = tr; R.g.add(d); } });
    R.tuerHit = kirchberg_hit(1.2, 2.2, .5, tx, 1.1, tz, def.rausLabel || 'Hinausgehen', () => kirchberg_raus()); }
  kirchberg_S.raeume[def.id] = R; return R; }
// R-6: Treppe mit Logik (auch für Keller Nr. 7, innen_ort.js). Lauf entlang z vom Fuß zA zum Kopf zB, n Stufen gleicher Steigung bis zum Podest auf y1:
// Tritt- und Setzstufen, zwei Wangen, Geländer an der offenen Seite (offen: 'x0' | 'x1'), Podest (Tiefe podest, hinter zB). Ist die Decke im Weg (loch: [x0, x1, z0, z1]),
// wird sie um den Durchbruch neu in Stücken gebaut (decke: das alte Deckenmesh, wird ausgeblendet) und darüber ein Treppenschacht mit Deckel gesetzt.
// begehbar: jede Stufe ist eine Kollisionsstufe (Stufenhöhe < 0,36 m), Geländer und Schacht halten; sonst nur die ersten zwei Stufen, der Rest sperrt (Klickfläche führt weiter).
function kirchberg_treppe(o) { const T = THREE, par = o.par || scene, s = Math.sign(o.zB - o.zA), n = o.n, rise = (o.y1 - o.y0) / (n + 1), run = Math.abs(o.zB - o.zA) / n, w = o.x1 - o.x0, xm = (o.x0 + o.x1) / 2, mat = o.mat, wm = o.matWange || mat;
  const B = (bw, bh, bd, x, y, z, m, rx) => { const b = box(bw, bh, bd, x, y, z, m, { parent: par }); if (rx) b.rotation.x = rx; return b; };
  for (let i = 1; i <= n; i++) { const y = o.y0 + i * rise, za = o.zA + s * (i - 1) * run, zb = o.zA + s * i * run, zc = (za + zb) / 2;
    B(w - .1, .045, run + .025, xm, y - .0225, zc - s * .0125, mat); B(w - .1, rise - .045, .025, xm, y - .045 - (rise - .045) / 2, za + s * .0125, mat); // Trittstufe (mit Überstand), Setzstufe
    if (o.begehbar || i <= 2) addCol(o.x0, o.x1, Math.min(za, zb), Math.max(za, zb), y); }
  const zK = o.zB, yK = o.y1 - rise, L = Math.hypot(n * run, n * rise), ang = Math.atan2(n * rise, n * run) * -s, zm = (o.zA + zK) / 2, ym = o.y0 + (n * rise) / 2 - .02;
  for (const x of [o.x0 + .03, o.x1 - .03]) B(.05, .26, L + .1, x, ym, zm, wm, ang); // Wangen
  if (o.podest) { const zp = o.zB + s * o.podest / 2; B(w, .2, o.podest, xm, o.y1 - .1, zp, mat); addCol(o.x0, o.x1, Math.min(o.zB, o.zB + s * o.podest), Math.max(o.zB, o.zB + s * o.podest), o.y1); }
  if (!o.begehbar) { const za = o.zA + s * 2 * run, zb = o.zB + s * (o.podest || 0); addCol(o.x0, o.x1, Math.min(za, zb), Math.max(za, zb), 99); }
  // Geländer: Pfosten unten/oben, Handlauf parallel zur Steigung (0,9 m über den Stufenkanten), Stäbe alle ~0,45 m
  if (o.offen) { const xg = o.offen === 'x0' ? o.x0 + .03 : o.x1 - .03, gm = o.matGelaender || wm, hl = .9, zf = o.zA + s * .15, yf = o.y0 + rise, zt = o.zB - s * .1, yt = o.y1 - rise * .5;
    const zEnd = o.handlaufBis ?? zt, yEnd = yf + (yt - yf) * Math.abs(zEnd - zf) / Math.max(.01, Math.abs(zt - zf));
    B(.07, hl + .05, .07, xg, yf + (hl + .05) / 2 - .02, zf, gm); const Lh = Math.hypot(zEnd - zf, yEnd - yf);
    B(.05, .06, Lh, xg, (yf + yEnd) / 2 + hl, (zf + zEnd) / 2, gm, Math.atan2(yEnd - yf, Math.abs(zEnd - zf)) * -s);
    const k = Math.max(2, Math.round(Math.abs(zEnd - zf) / .45)); for (let j = 1; j < k; j++) { const zz = zf + (zEnd - zf) * j / k, yy = yf + (yEnd - yf) * j / k; B(.025, hl, .025, xg, yy + hl / 2, zz, gm); }
    if (o.begehbar) { const dx = o.offen === 'x0' ? -.1 : .1; addCol(xg + dx - .05, xg + dx + .05, Math.min(o.zA, o.zB), Math.max(o.zA, o.zB), 99); } } // Geländerkiste 10 cm nach außen: die ganze Stufenbreite ist begehbar (vorher blockierte die Randspur)
  // Deckendurchbruch + Schacht
  if (o.loch && o.decke) { const D = o.decke; D.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(D), dm = D.material, [lx0, lx1, lz0, lz1] = o.loch, yc = (bb.min.y + bb.max.y) / 2, h = bb.max.y - bb.min.y;
    msHide ? msHide(D) : (D.visible = false); const P = (x0, x1, z0, z1) => { if (x1 - x0 > .01 && z1 - z0 > .01) box(x1 - x0, h, z1 - z0, (x0 + x1) / 2, yc, (z0 + z1) / 2, dm, { cast: false, parent: par }); };
    P(bb.min.x, lx0, bb.min.z, bb.max.z); P(lx1, bb.max.x, bb.min.z, bb.max.z); P(lx0, lx1, bb.min.z, lz0); P(lx0, lx1, lz1, bb.max.z);
    const sh = o.schachtH || 2.4, ys = bb.min.y + sh / 2, sm = o.schachtMat || dm, t = .1;
    box(t, sh, lz1 - lz0 + 2 * t, lx0 - t / 2, ys, (lz0 + lz1) / 2, sm, { parent: par }); box(t, sh, lz1 - lz0 + 2 * t, lx1 + t / 2, ys, (lz0 + lz1) / 2, sm, { parent: par });
    box(lx1 - lx0, sh, t, (lx0 + lx1) / 2, ys, lz0 - t / 2, sm, { parent: par }); box(lx1 - lx0, sh, t, (lx0 + lx1) / 2, ys, lz1 + t / 2, sm, { parent: par });
    box(lx1 - lx0 + 2 * t, t, lz1 - lz0 + 2 * t, (lx0 + lx1) / 2, bb.min.y + sh + t / 2, (lz0 + lz1) / 2, sm, { parent: par, cast: false });
    if (o.begehbar) { const b0 = bb.min.y - .05; addCol(lx0 - t, lx0, lz0, lz1, 99, b0); addCol(lx1, lx1 + t, lz0, lz1, 99, b0); addCol(lx0, lx1, lz0 - t, lz0, 99, b0); addCol(lx0, lx1, lz1, lz1 + t, 99, b0); } }
  return { rise, run }; }
// Raumlicht: Glühbirne/Kerze mit sichtbarer Quelle (Modell/Emission); VLight beim Laden, Stärke konstant
function kirchberg_licht(R, color, i, dist, x, y, z) { if (R) { i *= 1.7; dist *= 1.25; } const L = new VLight(color, i, dist, 2); /* Innenräume: Lampen tragen den Raum (Quelle sichtbar) */ L.position.set(x, y, z); scene.add(L); if (R) R.licht.push(L); return L; }
async function kirchberg_rein(id, o = {}) { const R = kirchberg_S.raeume[id]; if (!R || state.talking) return; const S = kirchberg_S; state.talking = true;
  Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .35, rate: .8 }); Audio.creak(.3);
  try { await fade(1, 700); S.back = { x: player.pos.x, z: player.pos.z, yaw: player.yaw };
    const p = R.def.rein; player.pos.set(p.x, 0, p.z); player.yaw = p.yaw; player.pitch = 0; if (typeof vel !== 'undefined') vel.set(0, 0, 0); if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
    S.inRaum = id; if (R.def.onRein) try { R.def.onRein(); } catch (e) { console.warn(e); } await wait(250); await fade(0, 800); }
  finally { state.talking = false; if (+$('fade').style.opacity > 0) fade(0, 400); }
  Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .35, rate: .9 }); }
async function kirchberg_raus() { const S = kirchberg_S, R = S.raeume[S.inRaum]; if (!R || state.talking) return; state.talking = true; Audio.creak(.25);
  try { await fade(1, 600); const p = R.def.raus; player.pos.set(p.x, 0, p.z); player.yaw = p.yaw; player.pitch = 0; if (typeof vel !== 'undefined') vel.set(0, 0, 0); if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
    S.inRaum = null; await wait(200); await fade(0, 800); } finally { state.talking = false; if (+$('fade').style.opacity > 0) fade(0, 400); }
  Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .5, rate: 1 }); }
// Innenraum-Sperren (Kap. 3 ff.); AP-18: kirchberg_oeffne('gisela'|'pfarrhaus'|'kapelle')
function kirchberg_oeffne(id) { kirchberg_S.offen[id] = true; }
function kirchberg_offen(id) { if (kirchberg_S.offen[id]) return true; if (id === 'gisela') return kapAb(3); return false; } // Pfarrhaus: Schlüssel von Gisela (Kap. 3), Kapelle: Vegas' Schlüssel (Kap. 3) – schließt AP-18 auf

// Kleinkram für bewohnte Räume (Q-8): Bücher, Tassen, Teller, Gläser, Kerzenstummel, Zeitungen, Teppich – alles Scan-Modelle bzw. Papier-Abziehbilder
// liste: [[art, x, y, z, ry?, s?], …] art: buch|stapel|tasse|teller|glas|zeitung|teppich|kerze|teddy
async function kirchberg_kram(par, liste) { const T = THREE, M = {};
  const lade = async (k, f, s, ax) => { if (!M[k]) M[k] = await kirchberg_mod(k, f, s, ax); return M[k]; };
  for (const [art, x, y, z, ry = kirchberg_r(0, 6), s = 1] of liste) { let o = null;
    if (art === 'buch' || art === 'stapel') { const b = await lade('w_buch', 'model.glb', .22, 'max'); if (!b) continue; const n = art === 'stapel' ? 3 + (kirchberg_r() * 3 | 0) : 1; o = new T.Group();
      for (let i = 0; i < n; i++) { const c = b.clone(true); c.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setHSL(kirchberg_r(), kirchberg_r(.15, .45), kirchberg_r(.2, .45)); } }); c.position.y = i * .045; c.rotation.y = kirchberg_r(-.3, .3); c.scale.setScalar(kirchberg_r(.8, 1.1)); o.add(c); } }
    else if (art === 'tasse') { const b = await lade('w_tasse', 'model.glb', .09); if (b) o = b.clone(true); }
    else if (art === 'teller') { const b = await lade('w_teller', 'model.glb', .22, 'max'); if (b) o = b.clone(true); }
    else if (art === 'glas') { const b = await lade('w_becher', 'model.glb', .12); if (b) o = b.clone(true); }
    else if (art === 'teddy') { const b = await lade('teddy_scan', 'model.glb', .28); if (b) o = b.clone(true); }
    else if (art === 'zeitung') { o = kirchberg_decal(kirchberg_papier({ w: 256, h: 340, bg: '#dcd4bc', flecken: 2, zeilen: [['Der Laternenbote', 16, 44, 30, '#222', 'Georgia, serif', 0]], fn: (x, w, h) => { x.fillStyle = 'rgba(40,40,40,.55)'; for (let r = 0; r < 18; r++) x.fillRect(16 + (r % 2) * 116, 70 + (r >> 1) * 28, 104, 6); } }), .3 * s, .4 * s, x, y + .004, z, ry, { rx: -PI / 2, parent: par }); continue; }
    else if (art === 'teppich') { const m = msSurfMat('wallpaper_fabric', { tint: 0x8a6a58 }); m.userData.tile = .8; m.roughness = 1; const d = new T.Mesh(new T.PlaneGeometry(2.2 * s, 1.5 * s), m); d.rotation.set(-PI / 2, 0, ry); d.position.set(x, .006, z); d.receiveShadow = true; d.userData.noCol = true; par.add(d); continue; }
    if (!o) continue; o.position.set(x, y, z); o.rotation.y = ry; if (s !== 1 && art !== 'buch' && art !== 'stapel') o.scale.multiplyScalar(s); o.userData.noCol = true; par.add(o); } }
// Deckenlampe mit Glühbirne (Quelle sichtbar: leuchtende Birne am Kabel), VLight beim Laden, konstant
function kirchberg_birne(R, x, y, z, i = 1.2, color = 0xffc080) { const T = THREE; const k = new T.Mesh(new T.CylinderGeometry(.004, .004, .45, 5), new T.MeshStandardMaterial({ color: 0x111111 })); k.position.set(x, y + .22, z); k.userData.noCol = true;
  const b = new T.Mesh(new T.SphereGeometry(.045, 12, 8), new T.MeshStandardMaterial({ color: 0x222222, emissive: color, emissiveIntensity: 2.6 })); b.position.set(x, y - .02, z); b.userData.noCol = true; (R ? R.g : scene).add(k, b); return kirchberg_licht(R, color, i, 6.5, x, y - .15, z); }
// ---------------------------------------------------------------------  Figuren (Gisela, Günther): LWO-Figurensystem (Gehen ohne Gleiten, Blinzeln, Blick, Atmung)
async function kirchberg_figur(key, def) { if (kirchberg_S.F[key]) return kirchberg_S.F[key]; if (typeof lwo_neueFigur !== 'function') return null;
  const F = await lwo_neueFigur(key, def); if (!F) return null; kirchberg_S.F[key] = F;
  try { await renderer.compileAsync(F.g, camera, scene); } catch (e) {} return F; }
// Standbewegung auf einen anderen Clip legen (z. B. „window_lean“ statt „idle“): das LWO-System mischt nur idle/look/nervous/phone
function kirchberg_clip(F, name) { if (!F || !F.acts[name]) return; if (!F.idle0) F.idle0 = F.acts.idle; const a = F.acts[name]; if (F.acts.idle === a) return; F.acts.idle.setEffectiveWeight(0); F.acts.idle = a; a.setEffectiveWeight(1); }

// ---------------------------------------------------------------------  Kapitel-1-Nebenaufgaben: Register (21 Schlüssel, davon 18 in Kap. 1 – H-6, KB_SPAETER; AP-15 Abnahme „keine alte Bezeichnung sichtbar“)
// Schlüssel → [Titel, Startbeschreibung]. Vorhandene Schlüssel werden umbenannt, fehlende angelegt (Zustand bleibt, Speicherstand speichert nur state/desc).
const KB_K1 = {
  home: ['Flocke', 'Der Hundenapf vor Nr. 1. Du kennst den Namen nicht.'],
  bruno: ['Schnalle zu', 'Vegas, Nr. 3: Bruno ist weg. „Guck bei Reuters, wo das Haus war.“'],
  seven: ['Sieben Kerzen', 'Vor jedem Polaroid eine Kerze im Einmachglas. Weiße Kreidepfeile führen in die Welt.'],
  call: ['Da unten ist nicht Lucy', 'Die Telefonzelle an der Kreuzung.'],
  nr4_oma: ['Für den Fall, dass du kommst', 'Nr. 4, Omas Haus. Überall Zettel.'],
  k1_karten: ['Sind sie wieder da?', 'Nr. 2: Der Briefkasten quillt über. Karten liegen im Gras.'],
  k1_butter: ['Butterbrotpapier', 'Nr. 9 ist vernagelt. Im Astloch glimmt etwas Rotes.'],
  car: ['Elf Anrufe', 'Lucys Auto an der Südsperre. Fahrertür offen, Schlüssel steckt.'],
  kb_naepfe: ['Siebzehn Näpfe', 'Am Kirchberg 3. Vier Katzen sind weg: Anni, Zayn, Grete, Keiner.'],
  nord_names: ['Da fehlt eins', 'Der Friedhof. Alle Grablichter aus, nur die Laterne der Madonna brennt.'],
  kb_fest: ['Laternenfest fällt aus', 'Die Kapelle ist verschlossen. Hinter der Tür Kerzenlicht.'],
  nord_baer: ['Ochs am Berg', 'Auf der Spielplatzbank: „BÄRLI IST WEG!!“'],
  nord_plakat: ['Hinter dem ältesten Plakat', 'Bushaltestelle Kirchberg, Linie 7.'],
  nord_strich: ['Der Strich ohne Namen', 'Am Kirchberg 5, Praxis Dr. Seiler. Durchs Flurfenster eine Messlatte.'],
  ow_kasse: ['Zapfsäule 3', 'Tankstelle Kranz. Über der Kasse brennt eine einzige Röhre.'],
  post_brief: ['Empfänger unbekannt verzogen', 'Eine Fahrradklingel im Nebel.'],
  ow_transp: ['Sieben Kindersitze', 'Schrottplatz am Wendehammer. Aus einem Transporter klopft es.'],
  gruen_wild: ['Wildschaden, 1992', 'Der Nordzaun. Absperrgitter und ein Schild.'],
  ow_kreise: ['Die Kreise sind von unten', 'Nr. 8, Frau Aydın am Küchenfenster: Dina ist in der Scheune.'],
  ow_laternen: ['Da oben war es warm', 'Schrebergärten. In einer Laube brennen alle Lampen.'],
  anw_fenster: ['Das winkende Fenster', 'Das Tor der Villa Seiler. Acht Schlösser.'],
};
// H-6 (Story-Prüfung): drei Nebenaufgaben ohne Kapitel-1-Bezug starten erst später. Schlüssel und Spielstand bleiben; ein alter Stand, in dem sie schon laufen, bleibt gültig.
// („Hinter dem ältesten Plakat“ und „Sind sie wieder da?“ bleiben in Kap. 1: SB-03 ist eine Kap.-1-Seite, Heidis Karten gehören laut R-1 nach Kap. 1.)
const KB_SPAETER = { nord_strich: 4, ow_transp: 3, anw_fenster: 3 };
function kirchberg_ab(k) { const a = KB_SPAETER[k]; if (!a) return true; const q = story.side[k]; if (q && q.state !== 'hidden') return true; return typeof kapAb === 'function' ? kapAb(a) : kap() >= a; }
function kirchberg_register() { for (const [k, [title, desc]] of Object.entries(KB_K1)) { const q = story.side[k], kp = KB_SPAETER[k] || 1; if (q) { q.title = title; if (q.state === 'hidden') q.desc = desc; q.kap = kp; } else story.side[k] = { title, desc, state: 'hidden', kap: kp }; }
  // Schritte statt eigener Aufgaben (Namen, 11): Lichter gehören zu „Da fehlt eins“, Laternen zu „Da oben war es warm“
  if (story.side.nord_lights) { kirchberg_S.nordLights = story.side.nord_lights; delete story.side.nord_lights; }
  // nicht in Kapitel 1: „Der rote Kanister“ (Kap. 5, „Kinder tanken nicht“), „Acht Schlösser“ (Kap. 4) – bleiben unsichtbar, bis ihr Kapitel sie startet
}
function kirchberg_k1(k) { return story.side[k]; }
function kirchberg_start(k, karte) { const q = story.side[k]; if (!q || !kirchberg_ab(k)) return; if (karte && !q.karte) q.karte = karte; if (q.state === 'hidden') sideStart(k); }
function kirchberg_fertig(k, desc) { const q = story.side[k]; if (q && q.state !== 'done') sideDone(k, desc); }
function kirchberg_desc(k, desc) { const q = story.side[k]; if (q && q.state !== 'done') { q.desc = desc; try { updateSideInfo(); } catch (e) {} } }

// ---------------------------------------------------------------------  Giselas Haus (außen): Napfbrett, Kinderrad, Regentonne, Küchenfenster
const KB_KATZEN = { ANNI: { spur: 'kiesel', pos: [10.2, null, 53.6], text: 'Unter dem Wartehäuschen: drei Kiesel übereinander.' },
  ZAYN: { spur: 'kratzer', pos: [-55.95, .62, 76.05], ry: PI / 2, text: 'An der Kapellenmauer, in Kinderhöhe: drei Kratzer im Putz.' },
  GRETE: { spur: null, text: 'Im Spielhaus, an der Tafel, unter dem Reim: ∴ in Kreide.' },
  KEINER: { spur: 'bonbon', pos: [-6.5, null, 49.5], text: 'Ein Bonbonpapier. Eukalyptus-Menthol. Ausgeleckt, zum Dreieck gefaltet.' } };
const KB_NAPF_NAMEN = ['ANNI', 'ZAYN', 'GRETE', 'KEINER', 'HÄNSCHEN', 'LUNA', 'PETER', 'LISBETH', 'FRITZ', 'MARIE', 'JAKOB', 'KATHRIN', 'VEIT', 'BÄRBEL', 'ROXY', 'MIKE', 'LUCY', ''];
async function kirchberg_giselaAussen() {
  const S = kirchberg_S, H = KB_HAUS, fz = H.z + H.d / 2; // Hausfront z 49.5
  // Küchenfenster (links vorn): Glas aus fassaden.js suchen – dort steht Gisela, dort geht das Fenster auf
  let W = null; if (typeof fassaden_S !== 'undefined') for (const w of fassaden_S.windows) { if (w.y > 3) continue; const c = w.g.localToWorld(new THREE.Vector3(w.x, w.y, w.z)); if (Math.abs(c.x - (H.x - 3.3)) < 1 && Math.abs(c.z - fz) < .6) W = { c, w }; }
  S.fenster = W ? { x: W.c.x, y: W.c.y, z: W.c.z + .02 } : { x: H.x - 3.3, y: 1.75, z: fz + .08 };
  const F0 = S.fenster;
  // Licht hinter der Gardine (warm, 40 W): beim Laden angelegt, Stärke steigt, wenn Gisela das Fenster aufmacht
  S.fLicht = kirchberg_licht(null, 0xffb46a, .25, 5, F0.x, F0.y + .1, F0.z + .7);
  // offener Fensterflügel (Scan-Fensterrahmen) – erst sichtbar, wenn sie aufmacht
  { const f = await kirchberg_mod('window', 'model.gltf', 1.3); if (f) { const piv = new THREE.Group(); piv.position.set(F0.x + .52, F0.y - .62, F0.z + .02); f.position.set(-.52, 0, 0); f.scale.set(.8, 1, .5); piv.add(f); piv.visible = false; scene.add(piv); S.fluegel = piv; } }
  // Napfbrett im Vorgarten: Brett (Planken-Scan) mit 18 Näpfen (Tellerscan als Blechnapf), Namen in weißer Lackfarbe
  { const bx = H.x - .4, bz = fz + 3.1, len = 5.4; const brett = kirchberg_mat('planks_painted', 0x5a4a3c, 1);
    box(len, .05, .32, bx, .21, bz, brett, { cast: true }); for (const s of [-1, 0, 1]) box(.07, .21, .28, bx + s * (len / 2 - .2), .1, bz, brett, { cast: true });
    const namen = kirchberg_tex(kirchberg_cnv(1024, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.font = '26px "Caveat", cursive'; x.textAlign = 'center';
      KB_NAPF_NAMEN.forEach((n, i) => { const cx = (i + .5) * w / 18; x.fillStyle = 'rgba(236,232,220,.92)'; x.save(); x.translate(cx, 40); x.rotate((kirchberg_r() - .5) * .08); x.fillText(n, 0, 0); x.restore(); }); }));
    const nm = kirchberg_decal(namen, len, .32 * .06 / .06 * .2, bx, .215, bz + .161, 0, { alpha: true }); nm.scale.y = .9;
    const top = kirchberg_decal(kirchberg_tex(kirchberg_cnv(8, 8, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 8, 8); })), .01, .01, bx, -5, bz); top.visible = false;
    const napf = await kirchberg_mod('w_teller', 'model.glb', .19, 'max');
    if (napf) { napf.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.62, .62, .6); m.material.metalness = .6; m.material.roughness = .45; } });
      for (let i = 0; i < 18; i++) { const n = napf.clone(true); const x = bx - len / 2 + (i + .5) * len / 18; kirchberg_setze(n, x + kirchberg_r(-.02, .02), .235, bz + kirchberg_r(-.03, .03), kirchberg_r(0, 6)); n.userData.noCol = true; if (i === 17) S.napf18 = n; else if (i === 0) n.traverse(m => { if (m.isMesh) m.material = m.material.clone(), m.material.color.setRGB(.8, .66, .18); }); } } // Annis Napf ist gelb
    S.brettHit = kirchberg_hit(len, .4, .5, bx, .25, bz, () => S.steps.liste ? 'Napfbrett · achtzehn Näpfe' : 'Napfbrett', () => kirchberg_napfbrett());
    S.brett = { x: bx, z: bz, len }; }
  // Das rote Kinderrad von 1958, am Zaunpfosten angekettet, Sattel trocken (Fahrrad-Scan 0,55, rot)
  { const b = await kirchberg_mod('bicycle', 'model.gltf', .66); if (b) { b.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); if (m.material.color && !/tire|rubber|reifen/i.test(m.material.name || m.name)) m.material.color.lerp(new THREE.Color(0xa01c14), .72); m.material.roughness = Math.min(1, (m.material.roughness ?? .6) + .15); } });
      try { b.add(kirchberg_stuetz(kirchberg_radFrame(b))); } catch (e) { console.warn('Kirchberg: Stützräder', e); } kirchberg_setze(b, H.x + 3.9, 0, fz + 5.55, PI / 2 - .12); S.rad = b; b.rotation.z = .05; }
    kirchberg_hit(1, .8, .5, H.x + 3.9, .45, fz + 5.55, 'Rotes Kinderrad', () => kirchberg_notiz('Ein Kinderfahrrad', 'Klein, rot, Stützräder, Vollgummireifen. Mit einer Kette am Zaunpfosten angeschlossen.\nDie Klingel fehlt. Das Schutzblech ist geputzt, die Reifen sind hart.\n\nDer Sattel ist trocken. Überall regnet es, nur hier nicht.', 'kb_rad')); }
  // Regentonne in der Ecke (Fass-Scan), drei Kratzer am Rand, ein Kiesel
  { const t = await kirchberg_mod('w_barrel', 'model.glb', .95); if (t) kirchberg_setze(t, H.x - 5.1, 0, fz + .75, .4); S.tonne = [H.x - 5.1, fz + .75];
    if (typeof beob_spur === 'function') { beob_spur('kratzer', { pos: [H.x - 4.83, .78, fz + 1.02], ry: .9, w: .08, h: .12, k: [1, 2, 3, 4, 5] }); } }
  // Zwei Katzen auf dem Zaun starren in die Ecke neben der Regentonne (Blickziel für katzen.js); Whiskey setzt sich auf den Pfahl (83, K1-7)
  if (typeof whiskey_ort === 'function') whiskey_ort('gisela', H.x - 4.2, fz + 5.6, 1.25);
  // Klopfen an der Haustür / am Küchenfenster
  S.tuerHit = kirchberg_hit(1.2, 2.3, .5, H.x, 1.6, fz + .3, () => kirchberg_offen('gisela') ? 'Eintreten' : 'Klopfen', () => kirchberg_klopfen());
  S.fensterHit = kirchberg_hit(1.3, 1.4, .5, F0.x, F0.y, F0.z + .25, () => S.steps.gespraech ? 'Küchenfenster' : 'Ans Küchenfenster klopfen', () => kirchberg_klopfen(true));
  // Lichterkette an der Katzentreppe (nur Emission, kein Licht): kleine warme Punkte an der Hauswand
  { const pts = []; for (let i = 0; i < 26; i++) { const u = i / 25; pts.push(new THREE.Vector3(H.x + 3.2 + u * 1.6, .4 + u * 3.3, fz + .06 + Math.sin(i * 1.7) * .02)); }
    const geo = new THREE.BufferGeometry().setFromPoints(pts); const m = new THREE.PointsMaterial({ color: 0xffc27a, size: .05, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending });
    const p = new THREE.Points(geo, m); p.userData.noCol = true; scene.add(p); S.kette = m; }
}
async function kirchberg_klopfen(fenster) {
  const S = kirchberg_S; if (state.talking) return;
  if (kirchberg_offen('gisela') && !fenster) return kirchberg_rein('gisela');
  if (!kapAb(1) || kap() !== 1) { Audio.knock(); return toast(kap() >= 3 ? 'Drinnen brennt Licht. Niemand kommt.' : 'Niemand öffnet. Im Fenster sitzen drei Katzen wie Buchstützen.', 3600); }
  if (S.steps.gespraech) return kirchberg_giselaNachfrage();
  state.talking = true; Audio.knock(); kirchberg_start('kb_naepfe', { x: KB_HAUS.x, z: KB_HAUS.z + 6 });
  try {
    await wait(1400); subtitle('„Er ist noch nicht heim. Er war doch nur kurz Laterne laufen.“', 3600, 'EINE FRAUENSTIMME'); await wait(3400);
    kirchberg_fensterAuf(true); await wait(900);
    const F = S.F.gisela;
    await kirchberg_sag(F, [['Die sehen was. Ich seh nix. Sie?', 2600, 'GISELA'], ['Ich seh eine Regentonne.', 1800, 'LUKE'], ['Dann sind Sie so blind wie ich. Wollen Sie einen Kaffee? Der Vogel kriegt keinen.', 3400, 'GISELA'],
      ['Du bist der Brandt-Junge. Sag nix. Du hast das Kinn von deiner Oma und den Gang von jemand, dem die Schuhe nicht gehören.', 5200, 'GISELA'],
      ['Vier sind weg. Immer wenn es so nebelt, laufen die weg und setzen sich irgendwo hin und glotzen.', 4200, 'GISELA'],
      ['Bring sie mir. Die Anni, den Zayn, die Grete und den Keiner. Der Keiner ist der Dünne. Der heißt so, weil keiner gesagt hat, wie er heißt.', 5600, 'GISELA']]);
    const a = await kirchberg_wahl(['„Und die anderen?“', '„Wer ist Hänschen?“']);
    if (a === 1) { await kirchberg_sag(F, [['Er war doch nur kurz Laterne laufen.', 2600, 'GISELA']]); kirchberg_fensterAuf(false, .5); }
    else await kirchberg_sag(F, [['Die anderen sitzen, wo sie hingehören. Der Hänschen geht, wohin er will.', 3400, 'GISELA']]);
    S.steps.gespraech = 1; if (typeof gedanke === 'function') gedanke('kb_keiner', 'Ich bin hergekommen, um meine Schwester zu suchen, und mein erster Auftrag ist ein Kater namens Keiner. Läuft.', 900, 3);
    kirchberg_desc('kb_naepfe', 'Gisela Rieke, Am Kirchberg 3: Anni, Zayn, Grete und Keiner zurückbringen. Wo eine Katze hinstarrt, liegt etwas.');
    kirchberg_katzenAn(); kirchberg_save();
  } finally { state.talking = false; }
}
async function kirchberg_giselaNachfrage() { const S = kirchberg_S, F = S.F.gisela; state.talking = true; kirchberg_fensterAuf(true);
  try { const n = kirchberg_zurueck();
    if (S.steps.liste) { const a = await kirchberg_wahl(['„Der Mann mit den Handschuhen?“', '„Das Pfarrhaus?“', '„Luna?“', '(Nichts. Gute Nacht.)']);
      if (a === 0) await kirchberg_sag(F, [['Der saß an dem Tisch da. Hat die Handschuhe beim Kaffee angelassen. Meine Mutter fand das unhöflich. Und dann hat sie unterschrieben.', 6000, 'GISELA']]);
      else if (a === 1) await kirchberg_sag(F, [['Der ist nicht tot. Der ist im Nebel. Das ist ein Unterschied, den ihr Städter nicht kennt. Ich mach ihm jeden Abend das Licht an. Zwölf Euro im Monat, der Herr Pfarrer.', 7000, 'GISELA']]);
      else if (a === 2) await kirchberg_sag(F, [['Der älteste Name im Buch vom Pfarrer. Frag den Pfarrer.', 3000, 'GISELA']]);
      else await kirchberg_sag(F, [['Nachts kommt hier keiner rein, nicht mal ich.', 2600, 'GISELA']]); }
    else await kirchberg_sag(F, [[n ? `Noch ${4 - n}. Die sitzen irgendwo und glotzen. Guck, wo die hingucken.` : 'Die Anni, der Zayn, die Grete, der Keiner. Guck, wo die hingucken.', 3400, 'GISELA']]);
  } finally { state.talking = false; kirchberg_fensterAuf(false, 2.5); } }
function kirchberg_fensterAuf(auf, nach = 0) { const S = kirchberg_S; setTimeout(() => { S.fAuf = auf; if (auf) { Audio.play('woodSqueak1', { gain: .3, rate: 1.2, x: S.fenster.x, y: S.fenster.y, z: S.fenster.z, ref: 2 }); if (S.F.gisela) S.F.gisela.g.visible = true; }
  else Audio.play('woodClose2', { gain: .25, rate: 1.3, x: S.fenster.x, y: S.fenster.y, z: S.fenster.z, ref: 2 }); }, nach * 1000); }
// ---- Katzen einsammeln (katzen.js): Anni, Zayn, Grete, Keiner – jede starrt auf eine Beobachter-Spur
function kirchberg_zurueck() { return ['ANNI', 'ZAYN', 'GRETE', 'KEINER'].filter(n => kirchberg_S.katzen[n] === 'heim').length; }
function kirchberg_katzenAn() { if (typeof katzen_get !== 'function') return; const S = kirchberg_S;
  for (const n of Object.keys(KB_KATZEN)) { const k = katzen_get(n); if (!k || S.katzen[n] === 'heim') continue;
    katzen_klick(k, () => katzen_S.carry === k ? '' : 'Katze hochheben · ' + n.charAt(0) + n.slice(1).toLowerCase(), () => kirchberg_katzeNehmen(n)); } }
function kirchberg_katzeNehmen(n) { const S = kirchberg_S, k = katzen_get(n), D = KB_KATZEN[n]; if (!k || state.talking) return;
  if (!S.steps.gespraech) return toast(n === 'KEINER' ? 'Ein grauer, struppiger Kater. Er sieht nicht dich an. Er sieht die Straße hinunter.' : 'Die Katze sieht dich nicht an. Sie sieht auf etwas, das du nicht siehst.', 3800);
  if (katzen_S.carry && katzen_S.carry !== k) return toast('Eine Katze reicht. Die andere Hand braucht die Lampe.', 2600);
  const ziel = k.stare ? [k.stare.x, k.stare.y, k.stare.z] : null; katzen_fauch(k, ziel, true); // faucht in ihre Ecke, nicht auf Luke
  setTimeout(() => { katzen_tragen(k); S.katzen[n] = 'getragen'; S.traegt = n; if (k.klick) uninteract(k.klick);
    subtitle(D.text, 4200); setTimeout(() => subtitle(n === 'ZAYN' ? 'Ein Kater namens Zayn, der nicht runterkommt. Jonas würde durchdrehen.' : n === 'KEINER' ? 'Wer faltet Bonbonpapier? Grundschullehrer. Und … das hier.' : 'Du hast da gerade nichts gesehen. Ich auch nicht. Wir haben beide nichts gesehen.', 3800, 'LUKE'), 4300);
    if (n === 'KEINER') S.keinerT = 9; // Slapstick: klettert ihm unterwegs auf den Kopf – Lampe aus (Stufe 1)
    kirchberg_desc('kb_naepfe', `Katzen zurück: ${kirchberg_zurueck()}/4. ${n.charAt(0) + n.slice(1).toLowerCase()} zurück an den Napf bringen.`); }, 550); }
function kirchberg_katzeAbsetzen() { const S = kirchberg_S, n = S.traegt; if (!n) return; const k = katzen_get(n); if (!k) return; const B = S.brett, i = KB_NAPF_NAMEN.indexOf(n);
  const x = B.x - B.len / 2 + (i + .5) * B.len / 18; katzen_absetzen(k, x, B.z + .45); S.katzen[n] = 'heim'; S.traegt = null; k.stare = null; k.heim = { x, z: B.z + .6, r: 3 };
  Audio.play('stones1', { gain: .05, rate: 3, dur: .2 }); const c = kirchberg_zurueck(); kirchberg_desc('kb_naepfe', `Katzen zurück: ${c}/4.`);
  if (c === 1) setTimeout(() => kirchberg_lawine(), 1600);
  if (c === 4) setTimeout(() => kirchberg_naepfeFinale(), 1200); kirchberg_save(); }
// S-03 Katzenlawine am Gartentor (einmal)
async function kirchberg_lawine() { const S = kirchberg_S; if (S.steps.lawine) return; S.steps.lawine = 1;
  const g = ['LUNA', 'FRITZ', 'VEIT'].map(katzen_get).filter(Boolean); for (const k of g) if (k.on) katzen_goto(k, player.pos.x + rand(-.7, .7), player.pos.z + rand(-.7, .7), { lauf: true, frei: true, dann: 'sit' });
  await wait(900); subtitle('„Nicht die Lampe beißen, Junge, die ist nicht aus Wurst.“', 3400, 'GISELA');
  await wait(3200); const e = [KB_HAUS.x - 5.1, .3, KB_HAUS.z + KB_HAUS.d / 2 + .75]; for (const k of g) { katzen_stare(k, e); } Audio.play('stones1', { gain: .12, rate: 2.2, x: e[0], y: 0, z: e[2], ref: 2 });
  setTimeout(() => { for (const k of g) katzen_stare(k, null); }, 5000); }
async function kirchberg_naepfeFinale() { const S = kirchberg_S; if (S.steps.liste || state.talking) return; state.talking = true; kirchberg_fensterAuf(true); const F = S.F.gisela;
  try { await kirchberg_sag(F, [['Damit du die anderen dreizehn nicht auch noch verwechselst.', 3000, 'GISELA']]);
    Audio.paper(); kirchberg_listeNotiz();
    await kirchberg_sag(F, [['Und die hier. Für den Weg.', 2000, 'GISELA']]); modItem('futterdose', 'Katzenfutterdose', 'Rind in Soße. Der Deckel glänzt.', 'paper'); addItem('futterdose'); if (typeof tausch_gib === 'function') tausch_gib('dosendeckel', 1, true);
    await kirchberg_sag(F, [['Den hat der mit den Handschuhen verloren. Achtundfünfzig. Schreibt noch.', 3800, 'GISELA']]);
    S.steps.liste = 1; S.kuliAuf = true; kirchberg_kuliZeigen(true);
    // Whiskey hat den Kuli, bevor Luke ihn hat (K1-6, 02 I3) – er gibt ihn nur gegen den Dosendeckel (whiskey.js, Station „gisela“)
    setTimeout(() => { if (!S.kuli) { kirchberg_kuliZeigen(false); subtitle('Ein Flattern. Der Kuli ist weg. Auf dem Zaunpfahl sitzt der Rabe und hält ihn im Schnabel.', 4200); } }, 2200);
    S.steps.naepfe18 = 1; kirchberg_fertig('kb_naepfe', 'Siebzehn Namen, achtzehn Näpfe. Der letzte ist leer, und sie weiß nicht mehr, für wen.');
    story.lore.push({ key: 'kb_achtzehn', title: 'Achtzehn Näpfe', html: 'Siebzehn Namen, achtzehn Näpfe. Der letzte ist leer, und sie weiß nicht mehr, für wen.' }); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('N-01'); } catch (e) {}
  } finally { state.talking = false; kirchberg_fensterAuf(false, 3); kirchberg_save(); } }
function kirchberg_listeNotiz() { openNote('Giselas Katzenliste', '<span class="hand">ANNI – rot, dick, frisst nur aus dem gelben Napf.<br>ZAYN – schwarz, jung, klettert überall hoch, kommt nicht runter.<br>GRETE – schwarz, alt, ein Ohr eingerissen, kratzt, wenn man sie Gretchen nennt.<br>KEINER – grau, dünn, weint nachts. Nicht anfassen, außer man muss.<br>HÄNSCHEN – braun getigert, der Älteste. Das Ohr eingerissen, das war die Grete. Sitzt auf dem Fahrrad.<br>LUNA – weiß, ein grauer Fleck, kommt nur zu Kindern.<br>PETER – rot, fett, beißt. Seit 92 hier, sagt der Lars, das ist unmöglich, sag ich.<br>LISBETH, FRITZ, MARIE, JAKOB, KATHRIN, VEIT, BÄRBEL – die Alten. Namen vom Pfarrer. Fressen alles.<br>ROXY, MIKE, LUCY – die drei von dieses Jahr. Zugelaufen. Die Lucy kratzt. Passt.</span><br><br><i>Rückseite, Einkaufszettel:</i> <span class="hand">Katzenstreu. Kerzen. Zwiebeln. Glühbirne 40 W für den Pfarrer.</span>', 'kb_katzenliste',
  () => { if (kirchberg_S.steps.lucy) return; kirchberg_S.steps.lucy = 1; (async () => { await wait(500); await kirchberg_sag(kirchberg_S.F.gisela, [['Sie haben eine Katze nach meiner Schwester benannt.', 2600, 'LUKE'], ['Die ist mir zugelaufen, am Tag, als das Plakat kam. Die suchen sich den Namen selber aus, ich hab da nix zu melden.', 5200, 'GISELA']]); })(); }); }
function kirchberg_kuliZeigen(an) { const S = kirchberg_S; if (!S.kuliM) return; S.kuliM.visible = an; kirchberg_an(S.kuliHit, an); }
function kirchberg_kuli() { kirchberg_S.kuli = true; kirchberg_kuliZeigen(false); kirchberg_save(); } // von whiskey.js nach dem Tausch
function kirchberg_napfbrett() { const S = kirchberg_S;
  if (!S.steps.liste) return toast('Ein Brett mit Näpfen, jeder mit einem Namen in weißer Lackfarbe. ANNI. ZAYN. GRETE. KEINER. HÄNSCHEN …', 4600);
  openNote('Das Napfbrett', 'Siebzehn Namen in weißer Lackfarbe, von Hand, in den Jahren verschieden dick.\n\nAchtzehn Näpfe.\n\nDer letzte hat keinen Namen. Er ist sauber gespült. Er ist immer sauber gespült.', 'kb_napfbrett'); }

// ---------------------------------------------------------------------  Kapelle St. Martin (außen): Aushang, Liederzettel, Fenster, Martinsnische; Pfarrhaus (außen)
async function kirchberg_kapelleAussen() {
  const S = kirchberg_S, K = KB_KAP, tz = 79.05; // Kapellentür (Südseite)
  // Aushang an der Tür (oben Laserdruck, darunter vergilbt, Kuli von Gisela, Schreibmaschine Voss) – mit dem Auge unter dem Stempel
  const aushang = kirchberg_papier({ w: 420, h: 600, bg: '#efe9da', flecken: 2, tesa: true, zeilen: [
    ['Das Laternenfest fällt', 30, 70, 30, '#111', '"Arial", sans-serif', 0], ['in diesem Jahr aus', 30, 104, 30, '#111', '"Arial", sans-serif', 0], ['(Brandschutz).', 30, 138, 30, '#111', '"Arial", sans-serif', 0],
    ['Die Gemeinde bittet um Verständnis.', 30, 182, 20, '#222', '"Arial", sans-serif', 0], ['Keine Laternen im Freien.', 30, 208, 20, '#222', '"Arial", sans-serif', 0],
    ['Seit 1958 alle siebzehn', 40, 300, 34, 'rgba(30,40,110,.9)'], ['Jahre. Rechnet mal nach.', 40, 338, 34, 'rgba(30,40,110,.9)', null, -.02, 1],
    ['Bibelstunde donnerstags fällt bis auf', 30, 470, 17, 'rgba(40,36,30,.8)', '"Special Elite", "Courier New", monospace', 0], ['Weiteres aus. Der Pfarrer ist donnerstags', 30, 492, 17, 'rgba(40,36,30,.8)', '"Special Elite", "Courier New", monospace', 0],
    ['beim Schach.            B. Voss, Pfr.', 30, 514, 17, 'rgba(40,36,30,.8)', '"Special Elite", "Courier New", monospace', 0]],
    fn: (x, w, h) => { x.strokeStyle = 'rgba(120,30,30,.55)'; x.lineWidth = 3; x.beginPath(); x.arc(w - 90, 230, 42, 0, 7); x.stroke(); x.beginPath(); x.ellipse(w - 90, 232, 18, 9, 0, 0, 7); x.stroke(); x.fillStyle = 'rgba(120,30,30,.55)'; x.beginPath(); x.arc(w - 90, 232, 4, 0, 7); x.fill(); // Stempel mit Auge
      x.fillStyle = 'rgba(130,110,60,.18)'; x.fillRect(0, 420, w, h - 420); } });
  kirchberg_decal(aushang, .42, .6, K.x + .95, 1.5, tz - .02, PI, { rz: .02 });
  kirchberg_hit(.6, .8, .4, K.x + .95, 1.5, tz - .2, 'Aushang lesen', () => kirchberg_aushang());
  // Liederzettel am Gitter der Martinsnische
  const lied = kirchberg_papier({ w: 300, h: 420, bg: '#e9e3cf', zeilen: [['Laterne, Laterne', 26, 50, 30, '#222', 'Georgia, serif', 0], ['Sonne, Mond und Sterne', 26, 86, 22, '#333', 'Georgia, serif', 0], ['brenne auf, mein Licht,', 26, 116, 22, '#333', 'Georgia, serif', 0], ['brenne auf, mein Licht,', 26, 146, 22, '#333', 'Georgia, serif', 0], ['aber nur meine liebe', 26, 176, 22, '#333', 'Georgia, serif', 0], ['Laterne nicht.', 26, 206, 22, '#333', 'Georgia, serif', 0], ['— Strophe des Dorfes: —', 26, 262, 17, '#555', 'Georgia, serif', 0], ['bei Nacht die Lampe aus,', 26, 292, 20, '#333', 'Georgia, serif', 0], ['dann findet sie kein Haus.', 26, 318, 20, '#333', 'Georgia, serif', 0]] });
  // Martinsnische: an der Westwand der Kapelle, hinter einem Eisengitter (Scan-Zaunstück); Martin + Bettler: Heiligenfigur-Scan als Ersatz (fehlendes Asset)
  const nx = K.x - 5.2, nz = 80.6;
  { try { const bs = kirchberg_bildstock(nx, nz + .3); scene.add(bs); S.martin = bs; const L = kirchberg_licht(null, 0xffa860, .55, 4.2, nx, 1.7, nz - .2); S.martinLicht = L; } catch (e) { console.warn('Kirchberg: Martinsnische', e); } // Grablicht in der Nische (Licht beim Laden angelegt)
    const g = await kirchberg_mod('ironfence_ms', 'model.gltf', 1.25); if (g) { kirchberg_setze(g, nx, 0, nz - .75, 0); S.gitter = g; }
    kirchberg_decal(lied, .2, .28, nx + .35, 1.05, nz - .82, PI, { rz: -.05 });
    kirchberg_hit(1.4, 2.2, .6, nx, 1.1, nz - .6, 'Martinsnische', () => kirchberg_nische()); }
  // Kapellenfenster, acht Felder (von außen nur Umrisse – das Glas ist innen dunkel); Textur wird in Kap. 3 von innen wiederverwendet
  S.fensterTex = kirchberg_fensterTex(false); S.fensterTexInnen = kirchberg_fensterTex(true);
  kirchberg_decal(S.fensterTex, .9, 1.9, K.x + 3.05, 2.3, 80.35, PI, { rough: .3 });
  kirchberg_hit(1, 2, .6, K.x + 3.05, 2, 80, 'Kapellenfenster (mit der Lampe)', () => kirchberg_fenster());
  // warmer Kerzenschein hinter der Tür (VLight beim Laden; geht beim Schreck aus = Stärke 0)
  S.kerzen = kirchberg_licht(null, 0xffa050, .9, 5, K.x, 1.2, tz + 1.4);
  // Glocke von drinnen: Auslöser vor der Tür
  S.kapTuer = kirchberg_hit(1.4, 2.4, .5, K.x, 1.2, tz - .3, () => kirchberg_offen('kapelle') ? 'Kapelle betreten' : 'Kapellentür', () => kirchberg_kapTuer());
}
function kirchberg_fensterTex(innen) {
  const F = ['Ein Stern fällt.', 'Ein Kind mit Laterne geht in ein Licht, sechs Kinder hinterher.', 'Eine Frau mit Laterne führt sechs heraus.', 'Die Frau geht allein hinein.', 'Zwei Hände, darüber ein Riss im Himmel.', 'Ein Mann in Rüstung allein am Rand.', 'Drei kleine weiße Gestalten im Schnee.', 'Ein Laternenzug, das ganze Dorf.'];
  return kirchberg_tex(kirchberg_cnv(256, 540, (x, w, h) => { x.fillStyle = innen ? '#0d0a08' : '#060606'; x.fillRect(0, 0, w, h);
    const cols = innen ? [['#6a3a18', '#c9a040'], ['#1c2e5a', '#b88a30'], ['#4a2a18', '#d0b060'], ['#2a3a5a', '#caa050'], ['#5a1a14', '#e0d0a0'], ['#3a3a3a', '#6a6a6a'], ['#e8e8e0', '#9aa0a8'], ['#5a3a10', '#e0a040']] : null;
    for (let i = 0; i < 8; i++) { const r = Math.floor(i / 2), c = i % 2, fx = 18 + c * 114, fy = 18 + r * 128, fw = 106, fh = 118;
      if (innen) { const g = x.createLinearGradient(fx, fy, fx + fw, fy + fh); g.addColorStop(0, cols[i][0]); g.addColorStop(1, cols[i][1]); x.fillStyle = g; x.globalAlpha = i === 5 ? .45 : .8; x.fillRect(fx, fy, fw, fh); x.globalAlpha = 1; }
      x.strokeStyle = innen ? '#1a1410' : 'rgba(150,140,120,.45)'; x.lineWidth = 7; x.strokeRect(fx, fy, fw, fh);
      x.strokeStyle = innen ? 'rgba(20,14,10,.9)' : 'rgba(160,150,130,.32)'; x.lineWidth = 3; x.beginPath(); // Umriss der Szene (Bleiruten)
      const cx = fx + fw / 2, cy = fy + fh / 2;
      if (i === 0) { x.moveTo(cx + 30, fy + 12); x.lineTo(cx - 10, cy + 20); x.moveTo(cx - 18, cy + 16); x.arc(cx - 14, cy + 22, 8, 0, 7); }
      else if (i === 1 || i === 2 || i === 7) { for (let k = 0; k < (i === 7 ? 9 : 7); k++) { const px = fx + 12 + k * (fw - 24) / (i === 7 ? 8 : 6); x.moveTo(px, fy + fh - 12); x.lineTo(px, cy + 6); x.arc(px, cy, 5, PI / 2, PI / 2 + 6.28); } x.moveTo(cx, fy + 14); x.arc(cx, fy + 26, 12, -PI / 2, 3 * PI / 2); }
      else if (i === 3) { x.moveTo(cx, fy + fh - 12); x.lineTo(cx, cy); x.arc(cx, cy - 6, 6, PI / 2, PI / 2 + 6.28); x.moveTo(fx + 14, fy + 20); x.quadraticCurveTo(cx, fy - 4, fx + fw - 14, fy + 20); }
      else if (i === 4) { x.moveTo(fx + 20, cy + 30); x.lineTo(cx - 6, cy + 4); x.moveTo(fx + fw - 20, cy + 30); x.lineTo(cx + 6, cy + 4); x.moveTo(fx + 30, fy + 20); x.lineTo(cx, fy + 34); x.lineTo(fx + fw - 30, fy + 18); }
      else if (i === 5) { x.moveTo(fx + 20, fy + fh - 12); x.lineTo(fx + 20, cy - 6); x.rect(fx + 12, cy - 30, 16, 24); }
      else if (i === 6) { for (let k = 0; k < 3; k++) { const px = fx + 30 + k * 24; x.moveTo(px, fy + fh - 16); x.lineTo(px, cy + 12); x.arc(px, cy + 6, 5, PI / 2, PI / 2 + 6.28); } x.moveTo(fx + fw - 20, fy + fh - 12); x.lineTo(fx + fw - 20, cy - 10); }
      x.stroke(); }
    if (!innen) { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.05)'); x.fillStyle = g; x.fillRect(0, 0, w, h); } })); }
async function kirchberg_aushang() { const S = kirchberg_S; kirchberg_start('kb_fest', { x: KB_KAP.x, z: 78 }); S.steps.aushang = 1;
  openNote('Aushang an der Kapellentür', 'Das Laternenfest fällt in diesem Jahr aus (Brandschutz). Die Gemeinde bittet um Verständnis. Keine Laternen im Freien.\n\n<i>Ohne Unterschrift. Unter dem Stempel: ein Auge.</i>\n\n<span class="hand">Seit 1958 alle siebzehn Jahre. Rechnet mal nach.</span>\n\n<span style="font-family:\'Special Elite\',monospace;font-size:.85em">Bibelstunde donnerstags fällt bis auf Weiteres aus. Der Pfarrer ist donnerstags beim Schach. B. Voss, Pfr.</span>', 'kb_aushang', () => kirchberg_festCheck()); }
function kirchberg_nische() { const S = kirchberg_S; kirchberg_start('kb_fest'); S.steps.nische = 1;
  openNote('Die Martinsnische', 'Hinter einem Eisengitter, im Stein: Sankt Martin zu Pferd, das Schwert erhoben, der Mantel halb. Davor der Bettler. Dem Bettler fehlt ein Arm.\n\nAm Gitter ein Liederzettel: <b>„Laterne, Laterne“</b> – und darunter die Strophe des Dorfes:\n<i>bei Nacht die Lampe aus, / dann findet sie kein Haus.</i>', 'kb_nische',
    () => { kirchberg_sag(null, [['Das Lied bringt Kindern bei, dass man abends die Lampe ausmacht. Mit Reim. Clever. Und gruselig.', 4200, 'LUKE']]).then(() => { if (!S.steps.halb) { S.steps.halb = 1; setTimeout(() => subtitle('Der Bettler hat keinen Arm. Sankt Martin hat nur den halben Mantel. Hier kriegt keiner was Ganzes.', 4200, 'LUKE'), 900); } }); kirchberg_festCheck(); }); }
function kirchberg_fenster() { const S = kirchberg_S; kirchberg_start('kb_fest'); S.steps.fenster = 1;
  const an = typeof flashOn !== 'undefined' ? flashOn : true;
  if (!an) return toast('Schwarzes Glas. Ohne Licht siehst du nur dich selbst darin.', 3000);
  openNote('Das Kapellenfenster', 'Acht Felder. Von außen sind nur die Umrisse der Bleiruten zu lesen, das Glas ist innen dunkel:\n\nEin Stern fällt. · Ein Kind mit Laterne geht in ein Licht, sechs Kinder hinterher. · Eine Frau mit Laterne führt sechs heraus. · Die Frau geht allein hinein. · Zwei Hände, darüber ein Riss im Himmel. · Ein Mann in Rüstung allein am Rand, sein Glas matter als alles andere. · Drei kleine weiße Gestalten im Schnee halten ihm etwas hin. · Ein Laternenzug, das ganze Dorf.', 'kb_kapellenfenster',
    () => { subtitle('Der steht am Rand wie einer, der zu spät gekommen ist.', 3800, 'LUKE'); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('kb_fenster'); } catch (e) {} kirchberg_festCheck(); }); }
async function kirchberg_kapTuer() { const S = kirchberg_S; if (kirchberg_offen('kapelle')) return kirchberg_rein('kapelle');
  kirchberg_start('kb_fest'); if (S.steps.glocke || kap() !== 1) return toast('Verschlossen. Hinter der Tür Kerzenlicht.', 2600);
  // Schreck Stufe 2 (`kapelle`): die Glocke schlägt einmal im Turm, dann einmal von drinnen, direkt hinter der Tür; das Kerzenlicht geht aus
  S.steps.glocke = 1; state.talking = true; Audio.knock(); await wait(1600);
  if (typeof ausbau_nord_bellToll === 'function') ausbau_nord_bellToll(); await wait(3600);
  if (Audio.ctx && Audio.glocke && Audio.glocke(KB_KAP.x, 1.4, 79.6, 345, .55, 2)) {} /* echte Glocke (VSCO), gestimmt */ else if (Audio.ctx) { const d = Audio.at(KB_KAP.x, 1.4, 79.6, 2); [[1, .5, 3], [2, .35, 2.2], [2.76, .18, 1.4]].forEach(([m, a, dur]) => { const o = Audio.osc('sine', 690 * m, 0, dur + .2); Audio.env(o, a * .35, .002, dur, 0, d); }); }
  await wait(250); const L = S.kerzen, i0 = L.intensity; for (let k = 0; k < 8; k++) { L.intensity = i0 * (1 - k / 8) * (k % 2 ? .6 : 1); await wait(60); } L.intensity = 0;
  state.talking = false; if (typeof spannung_mark === 'function') try { spannung_mark('welt2'); } catch (e) {}
  setTimeout(() => { kirchberg_festCheck(); }, 500); }
function kirchberg_festCheck() { const S = kirchberg_S, st = S.steps; const n = ['aushang', 'nische', 'fenster', 'rad', 'gemeindebrief'].filter(k => st[k]).length + (typeof sammeln_hatSB === 'function' && sammeln_hatSB(2) ? 1 : 0);
  kirchberg_desc('kb_fest', `Aushang, Kapellenfenster, Sühnekreuz, Martinsnische, Pfarrhaus. (${n}/6)`);
  if (n >= 6) { kirchberg_fertig('kb_fest', 'Das Fest fällt aus, alle siebzehn Jahre. Auf dem Bußkreuz steht 1312. Der Pfarrer verschwand 1992 – sein Rad wird gepflegt.');
    story.lore.push({ key: 'kb_pfarrer_rad', title: 'Der Pfarrer mit dem Rad', html: 'Pfarrer Bernhard Voss, Am Kirchberg 1. Seit 1992 verschwunden. Im Studierzimmer brennt jeden Abend Licht. Sein Rad hat pralle Reifen und hinten einen Kindersitz.' }); } }
// ---------------------------------------------------------------------  Werkstatt Kap. 1 (Text gegen Welt): Korbgeflecht, Kindersitz, Schild, Mappe, Kuli – kleine Requisiten aus mehreren Teilen mit echten Oberflächen
// Flechtwerk (Rattan): senkrechte Stäbe, waagerechte Bänder im Wechsel über/unter, Maserung, Schmutz – Farbe und Höhenrelief aus derselben Zeichnung
function kirchberg_flechtTex(farbe = '#b08a52', dunkel = '#5a3d1c') {
  const S = kirchberg_S; if (S.flecht) return S.flecht; const W = 512, H = 512, nS = 10, rows = 40, sw = W / nS, rh = H / rows;
  const zeichne = (x, f0, f1, f2, tief) => { x.fillStyle = f0; x.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) for (let s = 0; s < nS; s++) { const oben = (r + s) % 2 === 0, px = s * sw, py = r * rh; // oben: Band liegt über dem Stab
      if (oben) { const g = x.createLinearGradient(0, py, 0, py + rh); g.addColorStop(0, f2); g.addColorStop(.5, f1); g.addColorStop(1, f2); x.fillStyle = g; x.fillRect(px - 1, py + 1, sw + 2, rh - 2); }
      else { const g = x.createLinearGradient(px, 0, px + sw, 0); g.addColorStop(0, f2); g.addColorStop(.5, f1); g.addColorStop(1, f2); x.fillStyle = g; x.fillRect(px + sw * .12, py, sw * .76, rh); } }
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${tief ? '255,255,255' : '40,24,8'},${.04 + kirchberg_r() * .08})`; const l = 3 + kirchberg_r() * 14; if (kirchberg_r() < .5) x.fillRect(kirchberg_r() * W, kirchberg_r() * H, l, 1); else x.fillRect(kirchberg_r() * W, kirchberg_r() * H, 1, l); } };
  const c = kirchberg_cnv(W, H, (x) => { zeichne(x, dunkel, farbe, '#8a6638', false); const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(30,18,6,0)'); g.addColorStop(1, 'rgba(30,18,6,.28)'); x.fillStyle = g; x.fillRect(0, 0, W, H); // Grund dunkler, nach unten verschmutzt
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(60,44,22,${.03 + kirchberg_r() * .05})`; x.beginPath(); x.arc(kirchberg_r() * W, kirchberg_r() * H, 6 + kirchberg_r() * 26, 0, 7); x.fill(); } });
  const b = kirchberg_cnv(W, H, (x) => zeichne(x, '#101010', '#e8e8e8', '#9a9a9a', true));
  const map = kirchberg_tex(c), bump = new THREE.CanvasTexture(b); for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  return S.flecht = { map, bump }; }
// Korb: Eimerform mit schrägem Rand (hinten hoch, vorn niedrig), z = Fahrtrichtung. Gibt Geometrie des Mantels und die Randkurve zurück
function kirchberg_korbGeo(w, l, hVorn, hHinten, n = 64, m = 14) {
  const pos = [], uv = [], idx = [], rim = [], e = 4.2, sg = v => Math.sign(v) * Math.pow(Math.abs(v), 2 / e);
  for (let j = 0; j <= m; j++) { const t = j / m; for (let i = 0; i <= n; i++) { const a = i / n * PI * 2, cx = sg(Math.cos(a)), cz = sg(Math.sin(a)), r = (.86 + .14 * Math.sin(t * PI * .5)) * (1 + .035 * Math.sin(t * PI));
      const z = cz * l / 2 * r, hh = hVorn + (hHinten - hVorn) * Math.min(1, Math.max(0, (l / 2 - z) / l)); // schräger Rand
      const p = [cx * w / 2 * r, t * hh, z]; pos.push(...p); uv.push(i / n * 4.2, t * hh * 9); if (j === m) rim.push(new THREE.Vector3(...p)); } }
  for (let j = 0; j < m; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  // Boden: Scheibe mit kleinem Rand
  const bp = [0, 0, 0], bu = [.5, .5], bi = []; for (let i = 0; i <= n; i++) { const a = i / n * PI * 2, cx = sg(Math.cos(a)), cz = sg(Math.sin(a)); bp.push(cx * w / 2 * .86, 0, cz * l / 2 * .86); bu.push(.5 + cx * .5, .5 + cz * .5); if (i < n) bi.push(0, i + 2, i + 1); }
  const gb = new THREE.BufferGeometry(); gb.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); gb.setAttribute('uv', new THREE.Float32BufferAttribute(bu, 2)); gb.setIndex(bi); gb.computeVertexNormals();
  return { mantel: g, boden: gb, rim }; }
// Gurtband zwischen zwei Punkten (flaches Band, Kanten mit Naht), in der Gruppe g
function kirchberg_band(g, a, b, breit, mat, dick = .004) { const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) return null; const m = new THREE.Mesh(new THREE.BoxGeometry(breit, dick, L), mat); m.position.copy(a).addScaledVector(d, .5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d.normalize()); m.castShadow = true; m.userData.noCol = true; g.add(m); return m; }
// Fahrrad-Kindersitz aus Korbgeflecht (Rattan, Chromstreben, Fußrasten, Dreipunktgurt – geschlossen) auf dem Gepäckträger. bike = Gruppe aus kirchberg_mod (noch nicht gesetzt, Welt = lokal).
// Rückgabe: { seat, fwd (Fahrtrichtung in bike-lokal), ... }
function kirchberg_radFrame(bike) { // Fahrrad-Scan (Gruppe, noch ungedreht, Welt = lokal): Längsachse, Fahrtrichtung (Lenker = höchste Punkte), Hinterachse, Radius
  if (bike.userData.radF) return bike.userData.radF; const T = THREE; bike.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(bike), sz = bb.getSize(new T.Vector3()), lang = sz.x > sz.z ? 'x' : 'z', quer = lang === 'x' ? 'z' : 'x', H = sz.y;
  const v = new T.Vector3(), pts = []; bike.traverse(m => { if (!m.isMesh) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 3) { v.fromBufferAttribute(P, i).applyMatrix4(m.matrixWorld); pts.push([v.y, v[lang]]); } });
  pts.sort((p, q) => q[0] - p[0]); const top = pts.slice(0, Math.max(8, pts.length * .02 | 0)), mt = top.reduce((a, p) => a + p[1], 0) / top.length, mid = (bb.min[lang] + bb.max[lang]) / 2, vorn = mt > mid ? 1 : -1;
  const hinten = vorn > 0 ? bb.min[lang] : bb.max[lang], r = H * .34, achse = hinten + vorn * r, cl = bb.getCenter(new T.Vector3()), fwd = new T.Vector3(); fwd[lang] = vorn;
  const achsePunkt = new T.Vector3(); achsePunkt[lang] = achse; achsePunkt[quer] = cl[quer]; achsePunkt.y = r;
  return bike.userData.radF = { bb, lang, quer, H, vorn, hinten, r, achse, cl, fwd, achsePunkt }; }
// Rohr suchen: waagerechte Strahlen quer zum Rad bei Längsposition mx, Höhen y0…y1 – liefert die Höhe des Treffers, der y0 am nächsten liegt, und den Abstand von der Mittelebene
function kirchberg_rohrQuer(bike, F, mx, yWunsch, y0, y1) { const T = THREE, rc = new T.Raycaster(), o = new T.Vector3(), d = new T.Vector3(); bike.updateMatrixWorld(true); let best = null; d[F.quer] = -1;
  for (let y = y0; y <= y1; y += .01) { o[F.lang] = mx; o[F.quer] = F.cl[F.quer] + .5; o.y = y; rc.set(o, d); rc.far = 1; const h = rc.intersectObject(bike, true)[0]; if (!h) continue; const lat = .5 - h.distance; if (Math.abs(lat) > .09) continue; if (!best || Math.abs(y - yWunsch) < Math.abs(best.y - yWunsch)) best = { y, lat }; }
  return best; }
// Fahrrad-Kindersitz aus Korbgeflecht (Rattan, Chromstreben, Fußrasten, Dreipunktgurt – geschlossen) auf dem Gepäckträger. bike = Gruppe aus kirchberg_mod (noch nicht gesetzt, Welt = lokal).
function kirchberg_kindersitz(bike) {
  const T = THREE, F = kirchberg_radFrame(bike), { bb, lang, quer, H, vorn, hinten, r, achse, cl, fwd } = F;
  const ptRack = new T.Vector3(); ptRack[lang] = achse; ptRack[quer] = cl[quer]; ptRack.y = 0; ptRack[lang] = achse - vorn * .05; const pS = ptRack.clone(); pS[lang] = achse - vorn * .14; const yRack = Math.max(.7, Math.min(.84, kirchberg_top(bike, pS.x, pS.z, 1.0, H * .7)));
  const rig = new T.Group(); rig.userData.noCol = true; // lokale Achsen: +z = Fahrtrichtung, +y oben, +x links
  rig.position.set(ptRack.x, yRack + .015, ptRack.z); rig.rotation.y = Math.atan2(fwd.x, fwd.z); bike.add(rig);
  const fl = kirchberg_flechtTex(), mat = new T.MeshStandardMaterial({ map: fl.map, bumpMap: fl.bump, bumpScale: 2.2, roughness: .86, side: T.DoubleSide, color: 0xc8b090 }); mat.map.repeat.set(1, 1);
  const w = .34, l = .37, hV = .15, hH = .4, K = kirchberg_korbGeo(w, l, hV, hH), korb = new T.Mesh(K.mantel, mat), boden = new T.Mesh(K.boden, mat); korb.castShadow = korb.receiveShadow = true; rig.add(korb, boden); boden.position.y = .002;
  // Randwulst (Rattanrolle) und zweiter Bindering weiter unten
  const cur = new T.CatmullRomCurve3(K.rim, true), rimM = new T.MeshStandardMaterial({ color: 0x7a5530, roughness: .7, map: fl.map, bumpMap: fl.bump, bumpScale: 1.2 }), rand1 = new T.Mesh(new T.TubeGeometry(cur, 120, .0125, 8, true), rimM); rand1.castShadow = true; rig.add(rand1);
  const unten = K.rim.map(p => new T.Vector3(p.x * .93, .045, p.z * .93)), rand2 = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(unten, true), 100, .007, 6, true), rimM); rig.add(rand2);
  // Gestell: zwei verchromte Rohrbügel längs unter dem Boden, vorn und hinten quer, Befestigungsplatte auf dem Gepäckträger
  const chrom = new T.MeshStandardMaterial({ color: 0x8e9296, metalness: 1, roughness: .34 }), rohr = (a, b, rad) => { const d = b.clone().sub(a), q = new T.Mesh(new T.CylinderGeometry(rad, rad, d.length(), 10), chrom); q.position.copy(a).addScaledVector(d, .5); q.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); q.castShadow = true; rig.add(q); return q; };
  for (const s of [-1, 1]) { rohr(new T.Vector3(s * .105, -.012, -l / 2 + .02), new T.Vector3(s * .105, -.012, l / 2 - .02), .0085); rohr(new T.Vector3(s * .105, -.012, l / 2 - .02), new T.Vector3(s * .165, .1, l / 2 - .02), .0075); rohr(new T.Vector3(s * .105, -.012, -l / 2 + .02), new T.Vector3(s * .165, .12, -l / 2 + .03), .0075); }
  rohr(new T.Vector3(-.105, -.012, 0), new T.Vector3(.105, -.012, 0), .007);
  { const p = new T.Mesh(new T.BoxGeometry(.22, .006, .14), new T.MeshStandardMaterial({ color: 0x2a2c2e, metalness: .7, roughness: .5 })); p.position.set(0, -.018, 0); rig.add(p); }
  // Fußrasten: Haltestange seitlich nach unten, Trittbrett mit Gummischlaufe
  const gummi = new T.MeshStandardMaterial({ color: 0x1c1c1e, roughness: .9 });
  for (const s of [-1, 1]) { rohr(new T.Vector3(s * .17, .02, .12), new T.Vector3(s * .205, -.165, .165), .006); const tr = new T.Mesh(new T.BoxGeometry(.06, .012, .11), new T.MeshStandardMaterial({ color: 0x24262a, roughness: .6, metalness: .3 })); tr.position.set(s * .222, -.172, .165); rig.add(tr);
    const sl = new T.Mesh(new T.TorusGeometry(.03, .004, 6, 14, PI), gummi); sl.position.set(s * .222, -.166, .2); sl.rotation.set(0, PI / 2, PI / 2); rig.add(sl); }
  // Dreipunktgurt, geschlossen: zwei Schultergurte vom Rücken zum Schloss in der Mitte, zwei Beckengurte von den Seiten; Schloss mit roter Taste
  const stoff = new T.MeshStandardMaterial({ color: 0x2c3036, roughness: .95 }), P = (x, y, z) => new T.Vector3(x, y, z), sc = P(0, .115, .05);
  for (const s of [-1, 1]) { kirchberg_band(rig, P(s * .075, hH - .035, -l / 2 + .045), P(s * .07, .14, -l / 2 + .075), .026, stoff); kirchberg_band(rig, P(s * .07, .14, -l / 2 + .075), P(s * .045, .105, -.02), .026, stoff, .006); kirchberg_band(rig, P(s * .045, .105, -.02), P(s * .012, .12, .05), .026, stoff, .006);
    kirchberg_band(rig, P(s * .155, .095, -.05), P(s * .08, .115, .02), .025, stoff, .006); kirchberg_band(rig, P(s * .08, .115, .02), P(s * .015, .125, .05), .025, stoff, .006); }
  { const sch = new T.Mesh(new T.BoxGeometry(.05, .02, .045), new T.MeshStandardMaterial({ color: 0x1a1b1d, roughness: .45, metalness: .35 })); sch.position.copy(sc); sch.position.y += .01; rig.add(sch);
    const tast = new T.Mesh(new T.BoxGeometry(.022, .008, .022), new T.MeshStandardMaterial({ color: 0xb8231a, roughness: .45 })); tast.position.copy(sc); tast.position.y += .024; rig.add(tast);
    for (const s of [-1, 1]) { const z = new T.Mesh(new T.BoxGeometry(.02, .004, .035), chrom); z.position.set(s * .03, sc.y + .01, sc.z + .015); rig.add(z); } }
  // Schmutz: Spinnweben/Staub nicht nötig – Gebrauchsspuren als Wachstuch: helles Kissen im Rücken (blaues Frottee)
  { const ks = new T.Mesh(new T.BoxGeometry(.25, .22, .028, 8, 8, 1), new T.MeshStandardMaterial({ map: kirchberg_tex(kirchberg_cnv(128, 128, (x, w, h) => { x.fillStyle = '#6a7f9e'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(235,238,244,.55)'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) if ((i + j) % 2 === 0) x.fillRect(i * 16, j * 16, 16, 16); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(40,50,70,${kirchberg_r() * .12})`; x.fillRect(kirchberg_r() * w, kirchberg_r() * h, 2, 1); } })), roughness: 1 })); ks.position.set(0, .2, -l / 2 + .045); ks.rotation.x = -.14; ks.castShadow = true; rig.add(ks); }
  rig.traverse(m => { if (m.isMesh) { m.userData.noCol = true; } });
  return { rig, F, yRack, w, l, hH }; }
// Emaille-Schild „Pfarramt St. Martin“ an der Querstange des Herrenrads (Schmutz, Absplitterungen, zwei Kabelbinder)
function kirchberg_schild() {
  const t = kirchberg_tex(kirchberg_cnv(512, 160, (x, w, h) => { const r = 14, rr = (a, b, c, d, rad) => { x.beginPath(); x.moveTo(a + rad, b); x.arcTo(a + c, b, a + c, b + d, rad); x.arcTo(a + c, b + d, a, b + d, rad); x.arcTo(a, b + d, a, b, rad); x.arcTo(a, b, a + c, b, rad); x.closePath(); };
    x.clearRect(0, 0, w, h); rr(2, 2, w - 4, h - 4, r); x.fillStyle = '#e9e5d6'; x.fill(); x.strokeStyle = '#1f2f5c'; x.lineWidth = 7; rr(14, 14, w - 28, h - 28, 8); x.stroke();
    x.fillStyle = '#1f2f5c'; x.textAlign = 'center'; x.font = 'bold 60px "Arial Narrow", Arial, sans-serif'; x.fillText('PFARRAMT', w / 2, 82); x.font = 'bold 34px "Arial Narrow", Arial, sans-serif'; x.fillText('ST. MARTIN', w / 2, 126);
    x.globalCompositeOperation = 'source-atop'; for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(${40 + kirchberg_r() * 30},${30 + kirchberg_r() * 20},20,${.05 + kirchberg_r() * .18})`; x.beginPath(); x.arc(kirchberg_r() * w, kirchberg_r() * h, 1 + kirchberg_r() * 6, 0, 7); x.fill(); }
    for (let i = 0; i < 7; i++) { x.fillStyle = '#2a2a2a'; x.beginPath(); x.arc(kirchberg_r() * w, kirchberg_r() * h, 1.5 + kirchberg_r() * 3, 0, 7); x.fill(); } // Absplitterungen bis aufs Blech
    x.globalCompositeOperation = 'source-over'; }));
  const g = new THREE.Group(), pl = new THREE.Mesh(new THREE.PlaneGeometry(.13, .04), new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: .3, roughness: .3, metalness: .15, side: THREE.DoubleSide })); g.add(pl); pl.castShadow = true;
  const bind = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: .6 }); for (const s of [-1, 1]) { const b = new THREE.Mesh(new THREE.TorusGeometry(.0105, .0016, 5, 12), bind); b.position.set(s * .045, .015, 0); b.rotation.y = PI / 2; g.add(b); }
  g.userData.noCol = true; return g; }
// Ledermappe (zugeknöpft): gerundeter Deckel, Lederkorn, Naht, Lasche mit Messingknopf; Gummispanner vom Gepäckträger darüber
function kirchberg_mappe() {
  const T = THREE, W = 384, H = 300, tx = kirchberg_tex(kirchberg_cnv(W, H, (x) => { x.fillStyle = '#4a2c18'; x.fillRect(0, 0, W, H); for (let i = 0; i < 4200; i++) { x.fillStyle = `rgba(${kirchberg_r() < .5 ? '20,10,4' : '120,80,48'},${.04 + kirchberg_r() * .1})`; x.beginPath(); x.arc(kirchberg_r() * W, kirchberg_r() * H, .7 + kirchberg_r() * 1.6, 0, 7); x.fill(); }
    const g = x.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * .65); g.addColorStop(0, 'rgba(120,80,40,.25)'); g.addColorStop(1, 'rgba(10,6,2,.45)'); x.fillStyle = g; x.fillRect(0, 0, W, H); // an den Kanten abgegriffen/dunkel
    x.strokeStyle = 'rgba(210,180,120,.65)'; x.setLineDash([7, 5]); x.lineWidth = 2; x.strokeRect(14, 14, W - 28, H - 28); x.setLineDash([]); }));
  tx.wrapS = tx.wrapT = T.ClampToEdgeWrapping; const lm = new T.MeshStandardMaterial({ map: tx, roughness: .62, metalness: .02 }), gr = new T.Group();
  const body = new T.Mesh(new T.BoxGeometry(.34, .26, .034, 1, 1, 1), lm); body.castShadow = true; gr.add(body);
  const laschen = new T.Mesh(new T.BoxGeometry(.075, .1, .004), lm); laschen.position.set(0, -.085, .019); gr.add(laschen);
  const knopf = new T.Mesh(new T.CylinderGeometry(.011, .011, .006, 14), new T.MeshStandardMaterial({ color: 0xb08a3a, metalness: 1, roughness: .3 })); knopf.rotation.x = PI / 2; knopf.position.set(0, -.115, .024); gr.add(knopf);
  const kante = new T.Mesh(new T.BoxGeometry(.346, .266, .01), new T.MeshStandardMaterial({ color: 0x2c180c, roughness: .8 })); kante.position.z = -.012; gr.add(kante); // Rücken/Kante dunkler
  gr.userData.noCol = true; return gr; }
// Stützräder: zwei kleine Gummirollen auf Haltern links und rechts am Hinterrad des roten Kinderrads (Giselas Zaunpfosten, 1958)
function kirchberg_stuetz(info) { const T = THREE; // info: Ergebnis von kirchberg_radFrame
  const rad = new T.MeshStandardMaterial({ color: 0x1a1a1a, roughness: .88 }), stahl = new T.MeshStandardMaterial({ color: 0x8a8d90, metalness: 1, roughness: .38 }), rot = new T.MeshStandardMaterial({ color: 0x9a1812, roughness: .6, metalness: .3 });
  const g = new T.Group(); g.userData.noCol = true; g.position.copy(info.achsePunkt); g.rotation.y = Math.atan2(info.fwd.x, info.fwd.z);
  for (const s of [-1, 1]) { const arm = new T.Mesh(new T.CylinderGeometry(.0045, .0045, .15, 8), stahl); arm.position.set(s * .075, -.02, 0); arm.rotation.z = s * (PI / 2 - .32); g.add(arm); // schräger Arm
    const st = new T.Mesh(new T.CylinderGeometry(.0042, .0042, .055, 8), stahl); st.position.set(s * .145, -.145, 0); g.add(st);
    const lauf = new T.Mesh(new T.CylinderGeometry(.045, .045, .028, 20), rad); lauf.rotation.z = PI / 2; lauf.position.set(s * .152, -(info.r - .045) + .0, 0); g.add(lauf);
    const nabe = new T.Mesh(new T.CylinderGeometry(.034, .034, .03, 16), rot); nabe.rotation.z = PI / 2; nabe.position.set(s * .152, lauf.position.y, 0); g.add(nabe); }
  return g; }
// Pfarrhaus-Herrenrad: Schild an der Hauptstange (zur Hausseite hin lesbar) und die Ledermappe unter dem Gummispanner auf dem Vordergepäckträger. ry = Drehung, mit der das Rad gesetzt wird.
function kirchberg_radZubehoer(bike, ry) { const T = THREE, F = kirchberg_radFrame(bike), { lang, quer, H, vorn, r, cl, bb } = F;
  // welche Querseite zeigt nach Welt +z (zur Straße/zum Betrachter)?
  const seiteVonQuer = s => { const e = new T.Vector3(); e[quer] = s; e.applyAxisAngle(new T.Vector3(0, 1, 0), ry); return e.z; }, side = seiteVonQuer(1) >= seiteVonQuer(-1) ? 1 : -1;
  const mx = cl[lang] + vorn * .0, rt = kirchberg_rohrQuer(bike, F, mx, H * .5, H * .26, H * .8), yT = rt ? rt.y : H * .6, rad = rt ? Math.abs(rt.lat) : .0;
  const schild = kirchberg_schild(); const sp = new T.Vector3(); sp[lang] = mx; sp[quer] = cl[quer] + side * (rad + .026); sp.y = yT - .012; schild.position.copy(sp);
  schild.rotation.y = quer === 'x' ? (side > 0 ? PI / 2 : -PI / 2) : (side > 0 ? 0 : PI); schild.rotation.z = .05; bike.add(schild);
  // Mappe auf dem Vordergepäckträger (liegt flach, Verschlusslasche zeigt zur Straße), Gummispanner quer darüber
  const aV = new T.Vector3(); aV[lang] = (vorn > 0 ? bb.max[lang] : bb.min[lang]) - vorn * r; aV[quer] = cl[quer]; const yR = Math.max(.66, Math.min(.86, kirchberg_top(bike, aV.x, aV.z, 1.1, H * .72)));
  const mp = kirchberg_mappe(); mp.rotation.x = -PI / 2; mp.position.copy(aV); mp.position.y = yR + .018; mp.rotation.z = (quer === 'x' ? PI / 2 : 0); bike.add(mp);
  const gum = new T.MeshStandardMaterial({ color: 0x141414, roughness: .8 }), grp = new T.Group(); grp.userData.noCol = true;
  for (const d of [-.06, .06]) { const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(); for (const v of [a, b, c]) { v[lang] = aV[lang] + vorn * d; } a[quer] = cl[quer] - .15; b[quer] = cl[quer]; c[quer] = cl[quer] + .15; a.y = yR + .004; b.y = yR + .042; c.y = yR + .004;
    kirchberg_band(grp, a, b, .012, gum, .004); kirchberg_band(grp, b, c, .012, gum, .004); }
  bike.add(grp); return { schild, mappe: mp, side }; }

// ---------------------------------------------------------------------  Martinsnische: Sankt Martin zu Pferd als Steinrelief (Höhenfeld → echte Verschiebung + Normalen), Bettler mit abgebrochenem Arm
// Gezeichnet als Schichten (Höhenstufen), weich gerundet, dann Gravur (Falten, Mähne, Kettenhemd, Fugen). Farbe: Sandstein mit Verwitterung und Regenspuren.
function kirchberg_blob(c, pts, closed = true) { // glatte Kurve durch Stützpunkte (Mittelpunkt-Quadratik)
  const n = pts.length; c.beginPath(); const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], m0 = mid(pts[n - 1], pts[0]); c.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], m = mid(p, q); c.quadraticCurveTo(p[0], p[1], m[0], m[1]); } c.closePath(); }
function kirchberg_martinRelief(W = 512, H = 640) {
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; }, hc = mk(), h = hc.getContext('2d'), tmp = mk(), t = tmp.getContext('2d'), sx = W / 640, sy = H / 800;
  h.fillStyle = 'rgb(46,46,46)'; h.fillRect(0, 0, W, H); h.scale(sx, sy);
  const schicht = (pts, lv, blur = 7, close = true) => { t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, W, H); t.fillStyle = '#000'; t.fillRect(0, 0, W, H); t.scale(sx, sy); t.fillStyle = `rgb(${lv},${lv},${lv})`; kirchberg_blob(t, pts, close); t.fill();
    h.save(); h.setTransform(1, 0, 0, 1, 0, 0); h.globalCompositeOperation = 'lighten'; h.filter = `blur(${blur * sx}px)`; h.drawImage(tmp, 0, 0); h.restore(); };
  const kreis = (cx, cy, r, lv, blur = 6) => { t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, W, H); t.fillStyle = '#000'; t.fillRect(0, 0, W, H); t.scale(sx, sy); t.fillStyle = `rgb(${lv},${lv},${lv})`; t.beginPath(); t.arc(cx, cy, r, 0, 7); t.fill(); h.save(); h.setTransform(1, 0, 0, 1, 0, 0); h.globalCompositeOperation = 'lighten'; h.filter = `blur(${blur * sx}px)`; h.drawImage(tmp, 0, 0); h.restore(); };
  const stab = (a, b, w, lv, blur = 3) => { t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, W, H); t.fillStyle = '#000'; t.fillRect(0, 0, W, H); t.scale(sx, sy); t.strokeStyle = `rgb(${lv},${lv},${lv})`; t.lineCap = 'round'; t.lineWidth = w; t.beginPath(); t.moveTo(a[0], a[1]); t.lineTo(b[0], b[1]); t.stroke(); h.save(); h.setTransform(1, 0, 0, 1, 0, 0); h.globalCompositeOperation = 'lighten'; h.filter = `blur(${blur * sx}px)`; h.drawImage(tmp, 0, 0); h.restore(); };
  // Sockel / Boden
  schicht([[10, 770], [10, 742], [320, 734], [630, 742], [630, 790], [320, 796]], 70, 5);
  // Pferd (blickt nach links, Schritt, ein Vorderhuf angehoben): ferne Beine, Rumpf, Hals, Kopf, nahe Beine, Schweif
  schicht([[414, 546], [452, 542], [458, 600], [450, 646], [452, 700], [460, 742], [426, 744], [428, 700], [424, 648], [418, 600]], 86, 3);                 // hinteres fernes Bein
  schicht([[302, 552], [338, 548], [340, 604], [334, 646], [338, 700], [346, 740], [310, 742], [308, 700], [306, 650], [300, 604]], 88, 3);                 // vorderes fernes Bein
  schicht([[238, 462], [262, 410], [304, 372], [372, 366], [440, 372], [500, 376], [534, 410], [548, 470], [536, 522], [492, 548], [420, 556], [338, 558], [270, 546], [240, 510]], 110, 13); // Rumpf (Widerrist, Kruppe)
  schicht([[262, 430], [236, 372], [214, 312], [202, 262], [220, 236], [248, 244], [270, 276], [292, 326], [312, 376], [316, 424]], 118, 12); // Hals mit Kamm
  schicht([[212, 258], [172, 280], [134, 322], [110, 360], [106, 378], [128, 384], [158, 360], [196, 322], [226, 290], [236, 262]], 128, 8); // Kopf
  schicht([[104, 372], [124, 388], [138, 372], [118, 360]], 134, 3);                                                                // Nüstern/Maul
  schicht([[216, 250], [220, 218], [238, 240]], 130, 3);                                                                            // Ohr
  schicht([[484, 470], [540, 474], [560, 532], [560, 604], [546, 640], [540, 700], [546, 742], [506, 744], [506, 700], [510, 650], [498, 614], [474, 560]], 120, 5); // hinteres nahes Bein
  schicht([[248, 520], [292, 524], [302, 566], [284, 604], [246, 626], [208, 634], [176, 646], [158, 660], [148, 646], [166, 622], [206, 604], [228, 584], [236, 556]], 122, 5); // vorderes nahes Bein, angehoben
  schicht([[160, 652], [180, 640], [192, 658], [178, 682], [152, 686], [146, 670]], 118, 3);                                           // Huf (angehoben)
  schicht([[534, 396], [588, 450], [606, 560], [594, 670], [572, 700], [566, 620], [572, 540], [540, 470]], 98, 6);                // Schweif
  // Sattel(decke) und Zaumzeug
  schicht([[326, 372], [430, 370], [440, 396], [428, 440], [400, 450], [340, 446], [316, 410]], 138, 5);
  // Martin: Bein im Steigbügel, Tunika, Oberkörper, Kopf mit Helm, erhobener Schwertarm, linke Hand mit dem Mantelstück
  schicht([[350, 424], [394, 436], [350, 500], [324, 548], [320, 590], [284, 594], [282, 556], [304, 500], [330, 450]], 150, 6);
  schicht([[322, 420], [300, 340], [302, 284], [334, 262], [378, 262], [408, 286], [412, 350], [410, 420], [426, 450], [312, 456]], 162, 9);    // Oberkörper mit Tunikasaum
  kreis(348, 214, 36, 176, 7);                                                                                                       // Kopf
  schicht([[308, 214], [310, 176], [348, 160], [390, 176], [392, 212], [378, 202], [348, 194], [322, 204]], 190, 4);               // Helm
  stab([392, 290], [444, 240], 28, 170, 6); stab([444, 240], [474, 192], 24, 172, 6);                                              // rechter Arm erhoben
  kreis(477, 186, 16, 178, 4);                                                                                                       // Faust
  stab([477, 186], [556, 52], 10, 192, 2); stab([452, 204], [506, 168], 9, 194, 2); kreis(470, 192, 8, 196, 2);                    // Schwert
  stab([314, 296], [276, 344], 24, 168, 5); stab([276, 344], [244, 396], 22, 170, 5); kreis(240, 404, 14, 174, 3);                  // linker Arm gesenkt
  // Mantel: hinten wehend (gerade Schnittkante), das abgeschnittene Stück in der linken Hand
  schicht([[398, 276], [438, 290], [472, 330], [498, 384], [524, 440], [516, 482], [496, 470], [478, 494], [452, 466], [432, 480], [418, 430], [406, 360]], 138, 6);
  schicht([[232, 408], [270, 402], [282, 450], [272, 508], [250, 538], [220, 504], [214, 444]], 144, 6);
  // Bettler (kniet, nur ein Arm): Kapuzenmantel, Kopf, rechter Arm hoch zum Stoff, links Bruchstelle der Schulter
  schicht([[106, 580], [146, 570], [170, 604], [176, 670], [186, 716], [196, 744], [170, 752], [150, 740], [132, 752], [112, 740], [92, 752], [70, 738], [60, 750], [50, 700], [56, 640], [68, 604]], 134, 6);
  schicht([[176, 726], [212, 724], [230, 736], [220, 750], [186, 752]], 128, 3);                                                         // nackter Fuß
  kreis(118, 538, 24, 150, 5); schicht([[88, 548], [92, 508], [120, 498], [146, 514], [148, 552], [132, 530], [110, 530]], 160, 4);
  stab([152, 590], [198, 548], 17, 150, 4); stab([198, 548], [228, 516], 15, 154, 4); kreis(232, 512, 11, 156, 3);
  schicht([[62, 600], [88, 594], [86, 628], [68, 642], [52, 628]], 128, 4);                                                           // Schulter links: der Arm ist abgebrochen
  // Gravur
  const g = (fn) => { h.save(); h.setTransform(1, 0, 0, 1, 0, 0); h.scale(sx, sy); h.filter = `blur(${1.1 * sx}px)`; fn(h); h.restore(); };
  g(c => { c.strokeStyle = 'rgba(0,0,0,.42)'; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = 2.6; const lin = (a) => { c.beginPath(); c.moveTo(a[0][0], a[0][1]); for (let i = 1; i < a.length; i++) c.lineTo(a[i][0], a[i][1]); c.stroke(); };
    for (let k = 0; k < 8; k++) lin([[222 + k * 7, 248 + k * 9], [204 + k * 8, 300 + k * 10], [196 + k * 7, 352 + k * 8]]);              // Mähne
    lin([[128, 326], [152, 330], [172, 316]]); c.beginPath(); c.arc(166, 301, 2.6, 0, 7); c.stroke(); lin([[116, 372], [128, 378]]);        // Maul, Auge, Nüstern
    lin([[214, 262], [190, 318], [136, 360]]);                                                                                         // Zaumzeug (Stirnriemen, Nasenband)
    lin([[130, 376], [196, 420], [262, 456], [326, 396]]); c.lineWidth = 1.6; lin([[130, 376], [200, 428], [262, 462], [330, 404]]);     // Zügel zu Martins Hand
    c.lineWidth = 2.4; lin([[536, 470], [572, 540], [578, 640]]); lin([[548, 456], [588, 534], [594, 650]]); lin([[540, 470], [566, 600]]);   // Schweifsträhnen
    lin([[326, 392], [338, 440]]); lin([[432, 394], [424, 440]]);                                                                     // Sattelkanten
    lin([[322, 296], [360, 288], [402, 298]]); lin([[318, 326], [360, 318], [408, 328]]); lin([[316, 356], [360, 348], [410, 358]]); lin([[316, 388], [362, 380], [410, 390]]); // Ringpanzer
    lin([[316, 440], [370, 448], [420, 440]]); lin([[330, 448], [334, 456]]);                                                         // Tunikasaum
    lin([[332, 210], [348, 220], [366, 210]]); c.beginPath(); c.arc(336, 204, 1.9, 0, 7); c.arc(362, 204, 1.9, 0, 7); c.stroke();      // Gesicht
    lin([[478, 186], [534, 84]]); c.lineWidth = 1.8; lin([[472, 192], [454, 204]]);                                                   // Schwertgrat
    c.lineWidth = 2.6; lin([[410, 296], [424, 380], [432, 470]]); lin([[428, 292], [458, 370], [470, 480]]); lin([[446, 300], [488, 380], [508, 470]]); lin([[470, 336], [512, 430]]); // Mantelfalten (fallen von der Schulter)
    lin([[236, 414], [246, 470], [240, 520]]); lin([[252, 410], [262, 480]]);
    lin([[98, 584], [112, 654], [102, 730]]); lin([[134, 576], [146, 654], [156, 724]]); lin([[96, 548], [118, 560], [142, 548]]); lin([[142, 590], [160, 640]]);   // Bettler: Falten, Gesicht
    c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.4)'; lin([[58, 602], [74, 610], [64, 626], [80, 634]]); c.strokeStyle = 'rgba(0,0,0,.6)'; lin([[56, 604], [70, 616], [60, 630], [76, 640]]); }); // Bruchkante
  // Körnung (Sandstein) im Höhenfeld
  { const id = h.getImageData(0, 0, W, H), d = id.data; for (let i = 0; i < d.length; i += 4) { const nz = (kirchberg_r() - .5) * 9; d[i] = Math.max(0, Math.min(255, d[i] + nz)); } h.putImageData(id, 0, 0); }
  // Farbe + Normalen aus dem Höhenfeld
  const id = h.getImageData(0, 0, W, H), hd = id.data, ht = new Float32Array(W * H); for (let i = 0; i < W * H; i++) ht[i] = hd[i * 4] / 255;
  const blur2 = new Float32Array(W * H); // grobe Mittelung (Kavität = Höhe unter Umgebung)
  { const tmpA = new Float32Array(W * H), R = 6; for (let y = 0; y < H; y++) { let s = 0; for (let x = -R; x <= R; x++) s += ht[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmpA[y * W + x] = s / (2 * R + 1); s += ht[y * W + Math.min(W - 1, x + R + 1)] - ht[y * W + Math.max(0, x - R)]; } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -R; y <= R; y++) s += tmpA[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { blur2[y * W + x] = s / (2 * R + 1); s += tmpA[Math.min(H - 1, y + R + 1) * W + x] - tmpA[Math.max(0, y - R) * W + x]; } } }
  const col = mk(), cx = col.getContext('2d'), nm = mk(), nx = nm.getContext('2d'), ci = cx.createImageData(W, H), ni = nx.createImageData(W, H), cd = ci.data, nd = ni.data, S = 3.4;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, l = ht[Math.max(0, i - 1)], r = ht[Math.min(W * H - 1, i + 1)], u = ht[Math.max(0, i - W)], d = ht[Math.min(W * H - 1, i + W)];
    let gx = (r - l) * S * 6, gy = (d - u) * S * 6, nxv = -gx, nyv = gy, nzv = 1; const L = Math.hypot(nxv, nyv, nzv); nd[i * 4] = (nxv / L * .5 + .5) * 255; nd[i * 4 + 1] = (nyv / L * .5 + .5) * 255; nd[i * 4 + 2] = (nzv / L * .5 + .5) * 255; nd[i * 4 + 3] = 255;
    const hv = ht[i], cav = Math.max(0, blur2[i] - hv) * 4.5, regen = Math.sin(x * .9 + Math.sin(y * .013) * 3) * .5 + .5, dirty = Math.max(0, (y / H - .55)) * .35 + (kirchberg_r() < .002 ? .2 : 0);
    const base = 168 + hv * 52 - cav * 90 - dirty * 60 + (regen > .93 ? -7 : 0) + (kirchberg_r() - .5) * 16; cd[i * 4] = Math.max(0, base * 1.0); cd[i * 4 + 1] = Math.max(0, base * .955); cd[i * 4 + 2] = Math.max(0, base * .86 - (hv < .3 ? 6 : 0) + (y > H * .92 ? -8 : 0)); cd[i * 4 + 3] = 255; }
  cx.putImageData(ci, 0, 0); nx.putImageData(ni, 0, 0);
  return { color: col, normal: nm, height: hc }; }

// Giselas LWO-Kuli: grauer Metallkugelschreiber mit Clip; auf dem Clip das eingeprägte Zeichen (Auge über einer Flamme, im Kreis). Liegt auf der Fensterbank, Ursprung = tiefster Punkt
function kirchberg_kuliBau() { const T = THREE, g = new T.Group(), grau = new T.MeshStandardMaterial({ color: 0x7a7d82, metalness: .85, roughness: .36 }), dunkel = new T.MeshStandardMaterial({ color: 0x25272a, metalness: .6, roughness: .5 });
  const prof = [[.0, 0], [.0012, .0], [.0028, .006], [.0042, .014], [.0058, .026], [.0066, .042], [.0068, .12], [.0073, .126], [.0073, .131], [.0066, .134], [.0062, .136], [.0058, .146], [.0, .146]].map(p => new T.Vector2(p[0], p[1]));
  const leib = new T.Mesh(new T.LatheGeometry(prof, 20), grau); leib.rotation.z = -PI / 2; leib.position.set(-.073, .0075, 0); leib.castShadow = true; g.add(leib); // Spitze bei +x
  const spitze = new T.Mesh(new T.CylinderGeometry(.0009, .0005, .004, 8), dunkel); spitze.rotation.z = PI / 2; spitze.position.set(-.073 + .0001 - .0, .0075, 0); spitze.position.x = .0 + .0; spitze.position.x = -.073 - .0015; g.add(spitze);
  const ring = new T.Mesh(new T.CylinderGeometry(.0072, .0072, .006, 20), dunkel); ring.rotation.z = PI / 2; ring.position.set(-.073 + .124, .0075, 0); g.add(ring);                                 // Rille nahe dem Drücker
  const druecker = new T.Mesh(new T.CylinderGeometry(.0042, .0046, .014, 12), grau); druecker.rotation.z = PI / 2; druecker.position.set(-.073 + .1425, .0075, 0); g.add(druecker);
  const clip = new T.Mesh(new T.BoxGeometry(.048, .0014, .0068), grau); clip.position.set(-.073 + .1, .0075 + .0078, 0); clip.castShadow = true; g.add(clip); // Clip, liegt oben auf
  const kopf = new T.Mesh(new T.CylinderGeometry(.0058, .0058, .002, 18), grau); kopf.position.set(-.073 + .12, .0075 + .0078, 0); g.add(kopf);
  const zeichen = new T.MeshStandardMaterial({ map: kirchberg_tex(kirchberg_cnv(128, 128, (x, w) => { x.fillStyle = '#7a7d82'; x.fillRect(0, 0, w, w); x.strokeStyle = '#1c1d1f'; x.lineWidth = 6; x.beginPath(); x.arc(64, 64, 52, 0, 7); x.stroke(); x.beginPath(); x.ellipse(64, 50, 26, 13, 0, 0, 7); x.stroke(); x.fillStyle = '#1c1d1f'; x.beginPath(); x.arc(64, 50, 7, 0, 7); x.fill();
    x.beginPath(); x.moveTo(64, 112); x.quadraticCurveTo(46, 94, 64, 70); x.quadraticCurveTo(82, 94, 64, 112); x.fill(); })), metalness: .8, roughness: .4 });
  const med = new T.Mesh(new T.CircleGeometry(.0052, 20), zeichen); med.rotation.x = -PI / 2; med.position.set(-.073 + .12, .0075 + .0078 + .0011, 0); g.add(med); med.rotation.z = PI / 2;
  g.rotation.z = 0; g.userData.noCol = true; g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); return g; }

// Martinsnische: Bildstock aus Sandstein (Sockel, Rückwand, Bogenrahmen, Satteldach) mit dem Steinrelief „Sankt Martin zu Pferd, Mantelteilung“ (echte Verschiebung, 3,5 cm Relieftiefe). Blickt nach −z (zur Eisengitter-Seite).
function kirchberg_bildstock(x, z) { const T = THREE, g = new T.Group(), stein = kirchberg_mat('wall_damaged', 0x938a78, 1.1), steinD = kirchberg_mat('wall_damaged', 0x6f6759, 1.1), R = kirchberg_martinRelief(512, 640);
  const ex = (shape, depth, mat) => { const m = new T.Mesh(new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 2, curveSegments: 28 }), mat); m.castShadow = m.receiveShadow = true; return m; };
  const rahmen = new T.Shape(); rahmen.moveTo(-.8, 0); rahmen.lineTo(.8, 0); rahmen.lineTo(.8, 2.2); rahmen.lineTo(-.8, 2.2); rahmen.lineTo(-.8, 0);
  const loch = new T.Path(); loch.moveTo(-.55, .4); loch.lineTo(.55, .4); loch.lineTo(.55, 1.38); loch.absarc(0, 1.38, .55, 0, PI, false); loch.lineTo(-.55, .4); rahmen.holes.push(loch);
  const fr = ex(rahmen, .3, stein); fr.position.z = 0; g.add(fr);
  const rueck = new T.Mesh(new T.BoxGeometry(1.64, 2.2, .2), steinD); rueck.position.set(0, 1.1, -.12); rueck.castShadow = rueck.receiveShadow = true; g.add(rueck);
  const sockel = new T.Mesh(new T.BoxGeometry(1.84, .4, .78), stein); sockel.position.set(0, .2 - .0, .12); sockel.castShadow = sockel.receiveShadow = true; g.add(sockel);
  const plinth = new T.Mesh(new T.BoxGeometry(1.84, .5, .78), stein); plinth.position.set(0, -.25, .12); plinth.castShadow = plinth.receiveShadow = true; g.add(plinth);
  const sims = new T.Mesh(new T.BoxGeometry(1.7, .08, .42), stein); sims.position.set(0, .44, .09); g.add(sims); // Fensterbank der Nische
  for (const s of [-1, 1]) { const d = new T.Mesh(new T.BoxGeometry(1.2, .1, .72), stein); d.position.set(s * .5, 2.5, .08); d.rotation.z = -s * .55; d.castShadow = true; g.add(d); }
  const first = new T.Mesh(new T.BoxGeometry(.14, .12, .74), steinD); first.position.set(0, 2.84, .08); g.add(first);
  const gie = new T.Mesh(new T.BoxGeometry(1.66, .16, .02), steinD); gie.position.set(0, 2.2, .3); g.add(gie);
  // Relief: Verschiebungsfläche
  const col = new T.CanvasTexture(R.color), nor = new T.CanvasTexture(R.normal), hei = new T.CanvasTexture(R.height); col.colorSpace = T.SRGBColorSpace; for (const t of [col, nor, hei]) t.anisotropy = 8;
  const pm = new T.MeshStandardMaterial({ map: col, normalMap: nor, normalScale: new T.Vector2(1.3, 1.3), displacementMap: hei, displacementScale: .045, displacementBias: -.012, roughness: .96 });
  const rel = new T.Mesh(new T.PlaneGeometry(1.02, 1.275, 150, 190), pm); rel.position.set(0, 1.08, -.012); rel.castShadow = false; rel.receiveShadow = true; rel.userData.noCol = true; g.add(rel);
  // Moos und Schmutz am Sockel
  const sch = new T.Mesh(new T.PlaneGeometry(1.7, .5), msSurfMat('grime', { alpha: true, tint: 0x3a4a30 })); sch.material.opacity = .65; sch.position.set(0, .22, .52); sch.userData.noCol = true; g.add(sch);
  g.position.set(x, .5, z); g.rotation.y = PI; return g; }

async function kirchberg_pfarrAussen() {
  const S = kirchberg_S, P = KB_PFARR, fz = P.z + P.d / 2; // Vorbau (Veranda) z 49.5 … 51.1
  // schwarzes Herrenrad mit prallen Reifen im Vorbau, Ledermappe im Gepäckträgergummi (Kindersitz: fehlendes Asset → Obstkiste/Korb-Ersatz nicht sichtbar, Text)
  const b = await kirchberg_mod('bicycle', 'model.gltf', 1.02); if (b) { b.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); if (m.material.color) m.material.color.lerp(new THREE.Color(0x121212), .75); } });
    const RY = .08; try { kirchberg_kindersitz(b); kirchberg_radZubehoer(b, RY); } catch (e) { console.warn('Kirchberg: Kindersitz/Schild/Mappe', e); } // Korbsitz mit Gurt, Emaille-Schild, Ledermappe unter dem Gummispanner (Text: „Hinten ein Kindersitz …“)
    kirchberg_setze(b, P.x - 1.05, .35, fz + .55, RY); S.pfarrRad = b; }
  kirchberg_hit(1.8, 1.2, .8, P.x - 1.2, .9, fz + .55, 'Herrenrad', async () => { S.steps.rad = 1; kirchberg_start('kb_fest', { x: P.x, z: fz + 3 });
    openNote('Ein Herrenrad', 'Schwarz, alt, gepflegt. Die Reifen sind prall. Hinten ein Kindersitz aus Korbgeflecht, der Gurt geschlossen. Im Gepäckträgergummi eine Ledermappe, zugeknöpft.\n\nAn der Stange ein Schild: <i>Pfarramt St. Martin</i>.', 'kb_pfarrrad', () => { subtitle('Wer pumpt einem Toten die Reifen?', 3000, 'LUKE'); kirchberg_festCheck(); }); });
  // vergilbter Gemeindebrief im Vorbau (auf der Bank / am Boden)
  const brief = kirchberg_papier({ w: 360, h: 500, bg: '#e6dcc0', knick: true, zeilen: [['GEMEINDEBRIEF', 30, 60, 34, '#333', 'Georgia, serif', 0], ['St. Martin · Sommer 1992', 30, 96, 20, '#444', 'Georgia, serif', 0], ['Kinderfreizeit', 30, 170, 26, '#222', 'Georgia, serif', 0], ['„Ein paar Tage in die Berge“', 30, 204, 19, '#333', 'Georgia, serif', 0], ['Abfahrt am Pfarrhaus.', 30, 232, 18, '#333', 'Georgia, serif', 0], ['Anmeldung bei Pfarrer Voss.', 30, 258, 18, '#333', 'Georgia, serif', 0], ['Keine Laternen einpacken. B. V.', 40, 420, 22, 'rgba(70,70,70,.8)', null, -.04]] });
  kirchberg_decal(brief, .21, .29, P.x + 1.1, .372, fz + .7, 0, { rx: -PI / 2, rz: .4 });
  kirchberg_hit(.4, .3, .4, P.x + 1.1, .45, fz + .7, 'Vergilbter Gemeindebrief', () => { S.steps.gemeindebrief = 1; kirchberg_start('kb_fest');
    openNote('Gemeindebrief St. Martin, Sommer 1992', 'Kinderfreizeit „Ein paar Tage in die Berge“, Abfahrt am Pfarrhaus, Anmeldung bei Pfarrer Voss. Der Bus ist gemietet, die Kinder bringen nur Schlafsack und Laune mit.\n\n<i>Am Rand, Bleistift:</i> <span class="hand">Keine Laternen einpacken. B. V.</span>', 'kb_gemeindebrief', () => kirchberg_festCheck()); });
  // Licht im Studierzimmer: das Fenster ist in ausbau_nord.js als erleuchtet angelegt (lit: [1]); Giselas 40 W
  S.pfarrTuer = kirchberg_hit(1.2, 2.3, .5, P.x, 1.6, fz + .3, () => kirchberg_offen('pfarrhaus') ? 'Pfarrhaus aufschließen' : 'Klopfen', () => { if (kirchberg_offen('pfarrhaus')) return kirchberg_rein('pfarrhaus'); Audio.knock();
    toast(kap() === 1 ? 'Niemand öffnet. Hinter der Glastür im Flur brennt Licht, im Studierzimmer auch. Drinnen tickt eine Uhr.' : 'Abgeschlossen. Das Licht im Studierzimmer brennt.', 4200); kirchberg_start('kb_fest'); });
}

// ---------------------------------------------------------------------  Innenräume: Giselas Küche/Stube, Pfarrhaus-Studierzimmer, Kapelle innen (Kap. 3 ff.)
async function kirchberg_innen() {
  const S = kirchberg_S, T = THREE;
  const chairSpec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
  const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg` });
  const hutchSpec = tint => ({ 'Wood-1': { ...W_('Wood-1'), color: tint }, 'Wood-2': { ...W_('Wood-2'), color: tint }, 'Wood-3': { ...W_('Wood-3'), color: tint }, Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } });
  const candleSpec = { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } };
  const sheerSpec = tint => ({ '*': { b: 'DefaultMaterial_Base_color.png', n: 'DefaultMaterial_Normal_DirectX.jpg', r: 'DefaultMaterial_Roughness.png', a: 'DefaultMaterial_Opacity.png', ds: 1, transparent: true, alphaTest: .02, flipN: true, color: tint } });
  const put = (o, x, y, z, ry, par) => kirchberg_setze(o, x, y, z, ry, par);
  const nacht = () => new T.MeshStandardMaterial({ color: 0x030507, roughness: .3, emissive: 0x0a1018, emissiveIntensity: .7 });
  const fenster = async (R, x, z, ry, yc = 1.55) => { const gl = new T.Mesh(new T.PlaneGeometry(1, 1.25), nacht()); gl.position.set(x, yc, z); gl.rotation.y = ry; R.g.add(gl);
    const f = await kirchberg_mod('window', 'model.gltf', 1.4); if (f) { f.scale.x *= .85; put(f, x - Math.sin(ry) * .01, yc - .7, z - Math.cos(ry) * .01, ry, R.g); }
    const c = await kirchberg_fbx('curtain_sheer', sheerSpec(0xd0c8b8)); if (c) { c.scale.set(.0153, .012, .012); c.traverse(m => { if (m.isMesh) { m.material.depthWrite = false; m.castShadow = false; } }); msFit(c, 1.6, 'y'); put(c, x + Math.sin(ry) * .12, yc - .82, z + Math.cos(ry) * .12, ry, R.g); } };
  const schmutz = async (R, w, h, x, y, z, ry, rx = 0, tint = 0x7a6a50, op = .75) => { const m = msSurfMat('grime', { alpha: true, tint }); m.opacity = op; const d = new T.Mesh(new T.PlaneGeometry(w, h), m); d.position.set(x, y, z); d.rotation.set(rx, ry, 0, 'YXZ'); d.renderOrder = 1; d.userData.noCol = true; R.g.add(d); };
  const kerzenSrc = await msFBX('candles', 'model.fbx', candleSpec).catch(() => null);
  const kerze = (R, name, x, y, z, s = .01, brennt = true) => { if (!kerzenSrc) return; kerzenSrc.updateMatrixWorld(true); let m = null; kerzenSrc.traverse(q => { if (q.isMesh && q.name === name) m = q; }); if (!m) return;
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld); g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); g.scale(s, s, s); g.computeBoundingBox();
    const k = new T.Mesh(g, m.material); k.position.set(x, y, z); k.castShadow = true; k.userData.noCol = true; R.g.add(k);
    if (brennt) { const fl = new T.Sprite(new T.SpriteMaterial({ map: kirchberg_flammeTex(), transparent: true, depthWrite: false, blending: T.AdditiveBlending, color: 0xffd8a0 })); fl.scale.set(.045, .08, 1); fl.position.set(x, y + g.boundingBox.max.y + .035, z); R.g.add(fl); S.flammen.push(fl); } };
  S.flammen = [];

  // ================= Giselas Küche und Stube (9 × 7 m): alle Uhren auf 03:13, ein Kindergedeck von 1958, siebzehn Futterdosen auf dem Kühlschrank
  { const C = KB_RAUM.gisela, H = KB_HAUS, R = kirchberg_raum({ id: 'gisela', x: C.x, z: C.z, w: 9, d: 7, h: 2.55, wand: 'wallpaper_deco', wandTint: 0xb8a684, boden: 'floor_worn', bodenTint: 0x8a7a64,
      waende: [['z', C.x + 1, C.z - 3.5, C.z + 3.5, [{ at: C.z + 1.6, w: 1.1 }]]], tuer: [C.x - 2.5, C.z + 3.4, PI], tuerWand: 'n', rein: { x: C.x - 2.5, z: C.z + 2.4, yaw: 0 }, raus: { x: H.x, z: H.z + H.d / 2 + 1.6, yaw: 0 }, rausLabel: 'Hinaus in den Vorgarten' });
    const x0 = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1, g = R.g;
    // Küche (links): Buffet, Unterschränke, Tisch mit Wachstuch, drei Stühle, Kühlschrank mit 17 Futterdosen, Herd
    const buf = await kirchberg_fbx('dresser', hutchSpec(0xd8cdb2), 2.1); if (buf) put(buf, x0 + .4, 0, C.z - 1.3, PI / 2, g);
    const tisch = await kirchberg_mod('metaltable', 'model.gltf', 0); if (tisch) { tisch.scale.set(.36, .82, .82); const tg = put(tisch, C.x - 2.2, 0, C.z - .2, 0, g); S.gTisch = tg; }
    const tischY = S.gTisch ? kirchberg_top(S.gTisch, C.x - 2.2, C.z - .2, 3, .78) : .78;
    // Wachstuch (Stoff-Scan, kariert eingefärbt) als Tischdecke
    { const m = msSurfMat('wallpaper_fabric', { tint: 0xb8c8a8 }); m.userData.tile = .6; const d = plane(1.5, 1.05, C.x - 2.2, tischY + .004, C.z - .2, m); d.userData.noCol = true; g.add(d); }
    for (const [dx, dz, ry] of [[-.8, 0, PI / 2], [.8, .05, -PI / 2 + .2], [0, .78, PI + .15]]) { const c = await kirchberg_fbx('chair', chairSpec, .92); if (c) put(c, C.x - 2.2 + dx, 0, C.z - .2 + dz, ry, g); }
    // Gedeck für ein Kind von 1958: Blechteller, Blechbecher, ein Stück Brot
    { const t = await kirchberg_mod('w_teller', 'model.glb', .2, 'max'); if (t) { t.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.66, .66, .62); m.material.metalness = .7; m.material.roughness = .4; } }); put(t, C.x - 2.2, tischY, C.z + .2, 0, g); }
      const b = await kirchberg_mod('w_becher', 'model.glb', .1); if (b) put(b, C.x - 1.98, tischY, C.z + .12, .5, g);
      const br = await kirchberg_mod('w_brot', 'model.glb', .11, 'max'); if (br) put(br, C.x - 2.2, tischY + .015, C.z + .2, 1.1, g);
      kirchberg_hit(.5, .3, .4, C.x - 2.2, tischY + .1, C.z + .2, 'Kindergedeck', () => kirchberg_notiz('Ein Gedeck', 'Blechteller, Blechbecher, ein Stück Brot. Alles von damals.\nDas Brot ist frisch.')); }
    // Kühlschrank (Emaille-Scan) mit Dosenturm, Herd daneben (Kiste mit Scan-Oberfläche; kein Modell im Katalog)
    { const em = new T.MeshStandardMaterial({ map: msTex('wall_plaster/b.jpg', true), normalMap: msTex('wall_plaster/n.jpg'), color: 0xd8d0bc, roughness: .42, metalness: .05 }); em.normalScale.set(.35, .35);
      box(.62, 1.52, .62, x0 + .38, .76, z1 - 1.1, em, { collide: true, parent: g }); box(.03, .3, .03, x0 + .71, 1.1, z1 - .9, new T.MeshStandardMaterial({ color: 0xaaa8a0, metalness: 1, roughness: .35 }), { parent: g });
      box(.62, .88, .6, x0 + .38, .44, z1 - 1.9, em, { collide: true, parent: g });
      const dose = await kirchberg_mod('w_becher', 'model.glb', .1); if (dose) { const sorten = [0xb8342a, 0x2a5a9a, 0xd8b030, 0x3a8a4a, 0x8a3a8a, 0xe0e0d8, 0xc86a20]; for (let i = 0; i < 17; i++) { const d = dose.clone(true); d.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setHex(sorten[i % 7]); m.material.metalness = .5; } });
        put(d, x0 + .3 + (i % 3) * .12 - .12 + ((i / 3 | 0) % 2) * .06, 1.52 + (i / 3 | 0) * .1, z1 - 1.1 + ((i % 2) - .5) * .12, i, g); } }
      kirchberg_hit(.7, 2.1, .7, x0 + .38, 1, z1 - 1.1, 'Kühlschrank', () => kirchberg_notiz('Ein Turm aus Dosen', 'Auf dem Kühlschrank: siebzehn Katzenfutterdosen, siebzehn verschiedene Sorten. Jede mit einem Etikett, Kuli:\nANNI. ZAYN. GRETE. KEINER. HÄNSCHEN. LUNA …')); }
    // Uhren, alle auf 03:13 (Wanduhr-Scan) · Kalender von 1958 · Fernsehzeitung
    { const u = await kirchberg_mod('wallclock', 'model.gltf', .75); if (u) put(u, x0 + .12, 1.45, C.z + .4, PI / 2, g);
      const u2 = await kirchberg_mod('wallclock', 'model.gltf', .45); if (u2) put(u2, C.x + 1.12, 1.62, C.z - 1.9, PI / 2, g);
      kirchberg_hit(.3, .8, .8, x0 + .2, 1.8, C.z + .4, 'Uhr', () => toast('Drei Uhr dreizehn. Alle Uhren im Haus. Das Pendel schwingt.', 3000)); }
    // Stube (rechts): Sofa, Sessel, Fernseher, Stehlampe, Bilder, Katzenkörbe
    const sofa = await kirchberg_fbx('sofa', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0x7a8a6a } }, 2.0, 'x'); if (sofa) put(sofa, C.x + 3, 0, z0 + .55, 0, g);
    const tv = await kirchberg_mod('crt', 'model.glb', .52); if (tv) put(tv, C.x + 3, .45, z1 - .45, PI, g);
    { const k = await kirchberg_fbx('dresser', hutchSpec(0x9a8a70), .45); if (k) put(k, C.x + 3, 0, z1 - .42, PI, g); }
    const sl = await kirchberg_mod('floorlamp', 'model.gltf', 1.6); if (sl) put(sl, x1 - .45, 0, z0 + .45, 0, g);
    kirchberg_licht(R, 0xffb870, 1.2, 6, x1 - .45, 1.5, z0 + .5); kirchberg_licht(R, 0xffc080, 1.4, 6.5, C.x - 2.2, 2.2, C.z - .2); // Stehlampe, Küchenlampe (40 W)
    for (const [fx, fz, key] of [[C.x + 2.2, z0 + .12, 'frame_deco'], [C.x + 3.6, z0 + .12, 'frame_dmg'], [x1 - .12, C.z + .6, 'frame_deco']]) { const f = await kirchberg_mod(key, 'model.gltf', .55); if (f) put(f, fx, 1.45, fz, fx === x1 - .12 ? -PI / 2 : 0, g); }
    // Bild von Hänschen, 1958 (Sepia, Kinderrad) über dem Sofa
    { const b = kirchberg_papier({ w: 256, h: 320, bg: '#c8b48a', flecken: 1, fn: (x, w, h) => { x.fillStyle = '#6a5436'; x.fillRect(18, 18, w - 36, h - 70); const gg = x.createLinearGradient(0, 18, 0, h - 52); gg.addColorStop(0, '#b89e70'); gg.addColorStop(1, '#5a4428'); x.fillStyle = gg; x.fillRect(22, 22, w - 44, h - 78); x.fillStyle = '#2a1e12'; x.beginPath(); x.arc(w / 2, 110, 26, 0, 7); x.fill(); x.fillRect(w / 2 - 28, 134, 56, 90); x.strokeStyle = '#2a1e12'; x.lineWidth = 5; x.beginPath(); x.arc(w / 2 - 50, 230, 22, 0, 7); x.arc(w / 2 + 50, 230, 22, 0, 7); x.stroke();
        x.fillStyle = 'rgba(40,30,20,.85)'; x.font = '26px "Caveat", cursive'; x.fillText('Hans, 6 · 1958', 40, h - 22); } });
      kirchberg_decal(b, .32, .4, C.x + 2.9, 1.55, z0 + .115, 0, { parent: g }); kirchberg_hit(.4, .5, .3, C.x + 2.9, 1.55, z0 + .25, 'Foto über dem Sofa', () => kirchberg_notiz('Ein Foto', 'Ein kleiner Junge auf einem roten Rad mit Stützrädern. Er lacht mit offenem Mund.\n\nHinten, Bleistift: Hans, 6 · 1958.')); }
    await fenster(R, C.x - 2.2, z0 + .11, 0); await fenster(R, C.x + 3, z1 - .11, PI);
    await schmutz(R, 1.6, 1, C.x - 3.6, 2.54, C.z + 2, 0, PI / 2);
    await kirchberg_kram(g, [['teppich', C.x + 3, 0, C.z - 1.6, .1, 1], ['zeitung', C.x - 2.5, tischY, C.z - .45, .3, .6], ['tasse', C.x - 1.9, tischY, C.z - .5], ['stapel', x1 - .4, 0, C.z + 2.9], ['stapel', C.x + 1.4, 0, z0 + .4], ['glas', x0 + .4, .92, z1 - 1.9], ['teddy', C.x + 2.2, .48, z0 + .5, .4, .8]]); await schmutz(R, 1.2, .7, x0 + .2, .5, C.z - 2.5, PI / 2); await schmutz(R, 2, 1.2, C.x + 3, .004, C.z + .5, 0, -PI / 2, 0x5a4a38, .5);
    S.raeume.gisela.ok = true; }

  // ================= Pfarrhaus: Studierzimmer (8 × 6 m), Schreibtisch mit Predigtmappe, Regale, 40-W-Birne, Glastür zum Flur
  { const C = KB_RAUM.pfarrhaus, P = KB_PFARR, R = kirchberg_raum({ id: 'pfarrhaus', x: C.x, z: C.z, w: 8, d: 6, h: 2.8, wand: 'wallpaper_fabric', wandTint: 0x8a8070, boden: 'floor_wood', bodenTint: 0x5a4432,
      tuer: [C.x - 2.8, C.z + 2.9, PI], tuerWand: 'n', rein: { x: C.x - 2.8, z: C.z + 1.9, yaw: 0 }, raus: { x: P.x, z: P.z + P.d / 2 + 1.7, yaw: 0 }, rausLabel: 'Hinaus' });
    const x0 = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1, g = R.g;
    for (let i = 0; i < 3; i++) { const s = await kirchberg_mod('wardrobe', 'model.gltf', 2.1); if (s) put(s, x0 + 1 + i * 1.65, 0, z0 + .32, -PI / 2, g); } // Fab „wardrobe“: Vorderseite +x, Breite entlang z → mit -PI/2 steht sie breit an der Nordwand (vorher 0 = quer, 1,5 m tief in den Raum)
    const buch = await kirchberg_mod('w_buch', 'model.glb', .24, 'max'); if (buch) { for (let i = 0; i < 26; i++) { const b = buch.clone(true); b.rotation.z = PI / 2 + kirchberg_r(-.08, .08); put(b, x0 + .55 + (i % 9) * .1 + (i / 9 | 0) * 1.65, .45 + (i % 3) * .43, z0 + .3, kirchberg_r(-.1, .1), g); } }
    const tisch = await kirchberg_mod('metaltable', 'model.gltf', 0); if (tisch) { tisch.scale.set(.46, .82, .8); S.pTisch = put(tisch, C.x + 1.2, 0, C.z + .4, 0, g); }
    const ty = S.pTisch ? kirchberg_top(S.pTisch, C.x + 1.2, C.z + .4, 3, .78) : .78;
    { const c = await kirchberg_fbx('chair', chairSpec, .95); if (c) put(c, C.x + 1.2, 0, C.z + 1.05, PI + .2, g); }
    { const r = await kirchberg_mod('radio', 'model.gltf', .38, 'max'); if (r) { r.traverse(m => { if (m.name === 'tubes') m.visible = false; }); put(r, C.x + 2.1, ty, C.z + .25, -.3, g); } }
    { const m = await kirchberg_mod('w_buch', 'model.glb', .32, 'max'); if (m) { m.traverse(q => { if (q.isMesh) { q.material = q.material.clone(); q.material.color.setRGB(.28, .18, .1); } }); put(m, C.x + .9, ty, C.z + .35, .2, g); S.predigt = m; }
      S.predigtHit = kirchberg_hit(.5, .3, .5, C.x + .9, ty + .1, C.z + .35, 'Predigtmappe', () => kirchberg_notiz('Eine Predigtmappe', 'Zwölf Predigten, sauber abgeheftet. Die dreizehnte fehlt. Im Rücken ein Zettel:\nDie 13. liegt, wo die Toten stehen.', 'kb_predigtmappe')); }
    { const l = await kirchberg_mod('floorlamp', 'model.gltf', 1.55); if (l) put(l, C.x + 2.9, 0, C.z + 1.2, 0, g); }
    kirchberg_licht(R, 0xffc27a, 1.5, 6.5, C.x + 1.2, 2.5, C.z + .4); // die 40-W-Birne, die Gisela jeden Abend anmacht
    { const u = await kirchberg_mod('wallclock', 'model.gltf', .8); if (u) put(u, x1 - .12, 1.4, C.z - 1.2, -PI / 2, g); }
    { const f = await kirchberg_mod('frame_deco', 'model.gltf', .7); if (f) put(f, x1 - .12, 1.45, C.z + .8, -PI / 2, g); }
    await fenster(R, C.x + 1.2, z1 - .11, PI);
    await schmutz(R, 1.4, 1, C.x - 1, 2.79, C.z, 0, PI / 2);
    await kirchberg_kram(g, [['teppich', C.x + .6, 0, C.z + .6, .05, 1.1], ['stapel', C.x + 1.7, ty, C.z + .55], ['tasse', C.x + .5, ty, C.z + .15], ['stapel', x0 + .5, 0, z1 - .5], ['stapel', x0 + 1.2, 0, z1 - .4], ['zeitung', C.x - 1.2, 0, C.z + 1.5, .9, .8]]); await schmutz(R, 1.8, 1.2, C.x + 1.2, .004, C.z + .9, 0, -PI / 2, 0x4a3a2a, .45);
    S.raeume.pfarrhaus.ok = true; }

  // ================= Kapelle innen (7 × 13 m, 6 m hoch): Bankreihen (Parkbank-Scan), Altar, Kerzen, acht Fensterfelder von innen, Gesangbücher
  { const C = KB_RAUM.kapelle, K = KB_KAP, R = kirchberg_raum({ id: 'kapelle', x: C.x, z: C.z, w: 7, d: 13, h: 6, wand: 'wall_plaster', wandTint: 0x9a948a, wandTile: 2.4, boden: 'floor_worn', bodenTint: 0x6a6258, decke: 'planks_painted', deckeTint: 0x4a3c30,
      tuer: [C.x, C.z + 6.4, PI], tuerWand: 'n', rein: { x: C.x, z: C.z + 5.3, yaw: 0 }, raus: { x: K.x, z: 77.8, yaw: PI }, rausLabel: 'Hinaus auf den Friedhof' });
    const x0 = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1, g = R.g;
    const bank = await kirchberg_mod('parkbench', 'model.glb', 1.6, 'x'); if (bank) { for (let r = 0; r < 6; r++) for (const s of [-1, 1]) { const b = bank.clone(true); put(b, C.x + s * 1.75, 0, C.z + 3.6 - r * 1.35, PI, g); } }
    const altar = await kirchberg_fbx('dresser', hutchSpec(0x6a5040), 1.05); if (altar) put(altar, C.x, 0, z0 + .7, 0, g);
    for (const [dx, h] of [[-.55, .012], [.55, .012], [-.3, .009], [.3, .009]]) kerze(R, 'Candle_large_small_used_low', C.x + dx, 1.05, z0 + .72, h);
    for (let i = 0; i < 14; i++) kerze(R, i % 2 ? 'Candle_large_small_used_low' : 'Candle_small_used_low', x0 + .4 + (i % 7) * .18, .02 + (i > 6 ? .0 : 0), z0 + 2.2 + (i > 6 ? .25 : 0), .008, i % 3 !== 0);
    kirchberg_licht(R, 0xffa050, 2.2, 9, C.x, 1.6, z0 + 1.2); kirchberg_licht(R, 0xff9a48, 1.2, 6, x0 + 1, .8, z0 + 2.3);
    // acht Fensterfelder von innen (dieselbe Zeichnung wie außen, farbig; RH-6 auf Feld 7 in Kap. 3, AP-18)
    kirchberg_decal(S.fensterTexInnen, 1.3, 2.75, x1 - .105, 3.3, C.z - 1.5, -PI / 2, { parent: g, emi: .35, rough: .25 });
    kirchberg_hit(.4, 3, 1.5, x1 - .3, 3, C.z - 1.5, 'Kapellenfenster', () => openNote('Das Kapellenfenster, von innen', 'Acht Felder. Farbig, von innen. Im sechsten ein Mann in Rüstung, allein am Rand, sein Glas matter als alles andere.', 'kb_fenster_innen'));
    { const st = await kirchberg_fbx('madre', { '*': { b: 'madrestatue_Color_4k.jpg', n: 'MadeStatue_normal_4k.jpg', ao: 'madrestatue_AO_4ks.jpg', color: 0xc8c4bc } }, 1.5); if (st) put(st, x0 + .6, 0, z0 + .8, PI / 4, g); }
    { const kr = await kirchberg_fbx('cross_hang', { '*': { color: 0x3a2e24, rough: .8 } }, 1.6); if (kr) put(kr, C.x, 2.2, z0 + .15, 0, g); }
    await schmutz(R, 2.4, 1.6, x0 + .105, 1.2, C.z, PI / 2, 0, 0x6a5a40, .6); await schmutz(R, 3, 2, C.x, .004, C.z + 1, 0, -PI / 2, 0x4a4032, .4);
    S.raeume.kapelle.ok = true; }
}
function kirchberg_flammeTex() { if (kirchberg_S.flTex) return kirchberg_S.flTex; return kirchberg_S.flTex = kirchberg_tex(kirchberg_cnv(32, 64, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * .7, 1, w / 2, h * .6, h * .5); g.addColorStop(0, 'rgba(255,245,210,1)'); g.addColorStop(.35, 'rgba(255,170,60,.85)'); g.addColorStop(1, 'rgba(255,90,10,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(w / 2, h * .6, w * .4, h * .45, 0, 0, 7); x.fill(); })); }

// ---------------------------------------------------------------------  Speicherstand
function kirchberg_save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(curChapter()); } catch (e) {} }
MOD_SAVE.push(['kirchberg', () => ({ steps: kirchberg_S.steps, katzen: kirchberg_S.katzen, kuli: kirchberg_S.kuli, offen: kirchberg_S.offen, inRaum: kirchberg_S.inRaum }),
  v => { const S = kirchberg_S; if (!v || typeof v !== 'object') return; Object.assign(S.steps, v.steps || {}); Object.assign(S.katzen, v.katzen || {}); S.kuli = !!v.kuli; Object.assign(S.offen, v.offen || {}); S.inRaum = v.inRaum || null; S.nachLaden = true; }]);

// ---------------------------------------------------------------------  Laden
WORLD_MODS.push(['Kirchberg (Gisela, Pfarrhaus, Kapelle)', async () => {
  const S = kirchberg_S; kirchberg_register();
  try { await document.fonts.load('30px Caveat'); await document.fonts.load('20px "Special Elite"'); } catch (e) {}
  await kirchberg_giselaAussen(); await kirchberg_kapelleAussen(); await kirchberg_pfarrAussen();
  // der LWO-Kuli zwischen den Näpfen (Auge auf dem Clip) – erst nach Giselas Liste, Whiskey schnappt ihn weg
  { const k = kirchberg_kuliBau(); kirchberg_setze(k, S.fenster.x + .3, S.fenster.y - .6, S.fenster.z + .12, .3); k.visible = false; S.kuliM = k;
    S.kuliHit = kirchberg_hit(.4, .3, .3, S.fenster.x + .3, S.fenster.y - .55, S.fenster.z + .2, 'Kugelschreiber', () => subtitle('Bevor du zugreifst, ist er weg. Der Rabe.', 2600)); kirchberg_an(S.kuliHit, false); }
  try { await kirchberg_innen(); } catch (e) { console.warn('Kirchberg: Innenräume', e); }
  if (typeof KAP_BEGIN !== 'undefined') for (let k = 1; k <= 6; k++) KAP_BEGIN[k].push(() => kirchberg_kapitel());
  S.ready = true; window.__kirchberg = { S, rein: kirchberg_rein, raus: kirchberg_raus, oeffne: kirchberg_oeffne, klopfen: kirchberg_klopfen, katzeNehmen: kirchberg_katzeNehmen, absetzen: kirchberg_katzeAbsetzen, finale: kirchberg_naepfeFinale }; // Testzugriff
}]);
// Kapitelwechsel: Katzen-Klicks (katzen.js verteilt die Katzen je Kapitel neu), Beobachter-Spuren der vier Ecken (nur Kap. 1)
function kirchberg_kapitel() { const S = kirchberg_S;
  if (kap() === 1 && !S.spuren && typeof beob_spur === 'function') { S.spuren = true;
    const A = KB_KATZEN; beob_spur('kiesel', { pos: [A.ANNI.pos[0], kirchberg_boden(A.ANNI.pos[0], A.ANNI.pos[2]), A.ANNI.pos[2]], k: [1] });
    beob_spur('kratzer', { pos: A.ZAYN.pos, ry: A.ZAYN.ry, k: [1] }); beob_spur('bonbon', { pos: [A.KEINER.pos[0], kirchberg_boden(A.KEINER.pos[0], A.KEINER.pos[2]) + .005, A.KEINER.pos[2]], k: [1] }); }
  if (S.steps.gespraech) setTimeout(kirchberg_katzenAn, 300); }
WORLD_TICK.push((dt, t) => {
  const S = kirchberg_S; if (!S.ready) return; S.t += dt;
  if (!S.figTry && typeof LWO !== 'undefined' && LWO.ready) { S.figTry = true; kirchberg_figuren(); }
  if (S.nachLaden && state.started) { S.nachLaden = false; kirchberg_kapitel(); if (S.steps.liste && !S.kuli) kirchberg_kuliZeigen(false); }
  // Gisela am Küchenfenster: lehnt sich heraus, wenn das Fenster offen ist; Blick auf Luke; Fensterlicht weich
  const F = S.F.gisela, auf = !!S.fAuf; S.fk = (S.fk || 0) + ((auf ? 1 : 0) - (S.fk || 0)) * Math.min(1, dt * 2.5);
  if (S.fLicht) S.fLicht.intensity = .25 + S.fk * 1.1; if (S.fluegel) { S.fluegel.visible = S.fk > .02; S.fluegel.rotation.y = S.fk * 1.25; }
  if (F) { const vis = (S.fk > .05 && kap() === 1 && !S.inRaum) || (!!S.zaun && !S.inRaum); if (F.g.visible !== vis) F.g.visible = vis; } // S.zaun: Gisela am Zaun (AP-20, „Siebzehn Näpfe“ Kap. 4)
  if (S.kette) S.kette.opacity = .75 + Math.sin(t * 1.3) * .08 + Math.sin(t * 7.1) * .03;
  for (let i = 0; i < (S.flammen ? S.flammen.length : 0); i++) { const f = S.flammen[i]; f.scale.y = .08 * (1 + Math.sin(t * 11 + i * 2.3) * .08 + Math.sin(t * 23 + i) * .05); }
  // Katze tragen: am Napfbrett absetzen; Keiner klettert auf den Kopf (Lampe aus, drei Sekunden)
  if (S.traegt) { const B = S.brett, P = player.pos; if (Math.hypot(P.x - B.x, P.z - (B.z + .8)) < 3.2 && !S.absetzHit) { S.absetzHit = true; kirchberg_katzeAbsetzen(); setTimeout(() => { S.absetzHit = false; }, 1500); }
    if (S.keinerT > 0 && S.traegt === 'KEINER') { S.keinerT -= dt; if (S.keinerT <= 0) kirchberg_keinerKopf(); } }
});
async function kirchberg_keinerKopf() { if (typeof flashOn === 'undefined' || state.talking) return; const war = flashOn; subtitle('Keiner klettert dir auf den Kopf. Die Lampe rutscht dir aus der Hand –', 2600);
  if (war) flashOn = false; await wait(3000); const f = typeof flatDir === 'function' ? flatDir() : { x: 0, z: -1 };
  Audio.play('stones1', { gain: .2, rate: 2.4, x: player.pos.x - f.x * 3, y: 0, z: player.pos.z - f.z * 3, ref: 2 }); await wait(700); if (war && !flashOn) flashOn = true; subtitle('Nichts. Ein Kiesel, irgendwo.', 2200); }
async function kirchberg_figuren() { const S = kirchberg_S;
  const G = await kirchberg_figur('gisela', { id: 'gisela', speed: .7, stride: .92, hunch: .06 });
  if (G) { kirchberg_clip(G, G.acts.window_lean ? 'window_lean' : 'idle'); const W = S.fenster; G.g.position.set(W.x - .05, W.y - 1.42, W.z - .3); /* lehnt sich aus dem Fenster: Beine in der Hauswand, Oberkörper draußen */ G.g.rotation.y = 0; G.g.visible = false; lwo_blick(G, 'luke'); } }
