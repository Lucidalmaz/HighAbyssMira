// =====================================================================  AUFTRITT / ABGANG (Modul „auftritt“, 08.10.2026)
// Gemeinsamer Hilfsbaustein: alles, was ins Bild kommt und wieder geht (Rabe, Krähen, Fledermäuse, Katzen, Ratten, Figuren, Kreaturen, Erscheinungen,
// UFO …), taucht nie sichtbar auf oder verschwindet nie sichtbar. Zwei Schichten:
//  1) auftritt_reg(g, opts): macht die Sichtbarkeit einer Wurzelgruppe „weich“. Wer g.visible = true/false setzt, bekommt – nur wenn die Gruppe gerade
//     im Bild (Blickfeld + vor der Nebelgrenze) ist – eine Überblendung (Dither-Fade über alphaHash, ohne Sortier-/Z-Flackern, Schatten faden mit);
//     außerhalb des Bildes schaltet es sofort (wie bisher). Die Module müssen nichts ändern. Zusätzlich fängt ein Sprung-Wächter Positionssprünge
//     einer sichtbaren Gruppe ab (blendet am neuen Ort neu ein, statt zu springen).
//  2) Flug-/Wegpunkt-Bausteine: auftritt_fernpunkt (Anflugpunkt außer Sicht), auftritt_abgangsziel (Abflugpunkt hinter der Nebelgrenze),
//     auftritt_imBild (Test), auftritt_nebel (Sichtweite), auftritt_weg (erst entfernen, wenn außer Sicht).
// Testzugriff: window.__auf (S, log, stat, report(), imBild(x,y,z)).
function auftritt_S() {
  const w = window; if (w.__auf) return w.__auf;
  return (w.__auf = { recs: [], log: [], stat: { pop: 0, jump: 0, flick: 0, fadeIn: 0, fadeOut: 0, hart: 0 }, frame: 0, t: 0, v: new THREE.Vector3(), v2: new THREE.Vector3(), mi: new THREE.Matrix4(), logOn: true,
    reg: (g, o) => auftritt_reg(g, o), imBild: (x, y, z, r) => auftritt_imBild(x, y, z, r), nebel: () => auftritt_nebel(), report: () => auftritt_report() });
}
// Sichtweite durch den Nebel in m (ab hier 97 % Nebelfarbe, nichts mehr erkennbar)
function auftritt_nebel() { const f = scene.fog; if (!f) return 1e9; const d = f.density != null ? f.density : 0; return d > 1e-5 ? 1.87 / d : 1e9; }
// Ist ein Punkt (Kugel mit Radius r) im Bild? Blickfeld mit Rand `pad` (Anteil) und vor der Nebelgrenze (nebel = true).
function auftritt_imBild(x, y, z, r = 1.2, pad = .18, nebel = true) {
  const S = auftritt_S(), v = S.v, cam = camera;
  v.set(x, y, z).applyMatrix4(S.mi.copy(cam.matrixWorld).invert()); // Kamera-Raum: -z = vorn
  const vz = -v.z, p = cam.projectionMatrix.elements;
  if (vz + r < .05) return false;                                  // hinter der Kamera
  if (nebel) { const d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); if (d - r > auftritt_nebel()) return false; }
  const zz = Math.max(vz, .1), tx = 1 / p[0], ty = 1 / p[5], ang = r / zz;
  return Math.abs(v.x) / zz - ang < tx * (1 + pad) && Math.abs(v.y) / zz - ang < ty * (1 + pad);
}
// Anflugpunkt für ein Wesen, das zu (zx, zy, zz) kommt: außer Sicht (hinter dem Spieler / seitlich außerhalb des Bildes / jenseits des Nebels), von oben.
// o.min = bevorzugter Mindestabstand zur Kamera (Standard 34 m), o.hoch = Höhe über dem Ziel (Standard 5–12 m), o.r = Radius des Wesens.
function auftritt_fernpunkt(zx, zy, zz, o = {}) {
  const c = camera.position, r = o.r ?? 1.5, nd = auftritt_nebel(), out = new THREE.Vector3();
  const radii = [o.min ?? 34, Math.min(nd + 6, 90), 22];
  const hd = new THREE.Vector3(); camera.getWorldDirection(hd); const back = Math.atan2(-hd.x, -hd.z);   // Richtung hinter dem Spieler
  for (const R of radii) for (let i = 0; i < 18; i++) {
    const a = back + (Math.random() - .5) * (i < 9 ? 2.2 : 6.28), d = R + Math.random() * 10, h = (o.hoch ?? (5 + Math.random() * 7));
    out.set(c.x + Math.sin(a) * d, Math.max(zy, c.y) + h, c.z + Math.cos(a) * d);
    if (!auftritt_imBild(out.x, out.y, out.z, r, .3, !o.ohneNebel)) return out; }
  return out.set(c.x + Math.sin(back) * 60, Math.max(zy, c.y) + 12, c.z + Math.cos(back) * 60);
}
// Abflugziel, von (px, py, pz) aus gesehen vom Spieler weg: jenseits der Nebelgrenze, hoch (Wesen fliegt weiter, bis es nicht mehr zu sehen ist)
function auftritt_abgangsziel(px, py, pz, o = {}) {
  const c = camera.position, nd = o.dist ?? Math.min(auftritt_nebel() + 14, 96); let dx = px - c.x, dz = pz - c.z, l = Math.hypot(dx, dz);
  if (l < .5) { const hd = new THREE.Vector3(); camera.getWorldDirection(hd); dx = hd.x; dz = hd.z; l = Math.hypot(dx, dz) || 1; }
  const a = Math.atan2(dx, dz) + (Math.random() - .5) * (o.streu ?? .9);
  return new THREE.Vector3(c.x + Math.sin(a) * nd, py + (o.steigen ?? 14 + Math.random() * 8), c.z + Math.cos(a) * nd);
}
// „Erst entfernen, wenn außer Sicht“: ruft fertig() beim ersten Bild, in dem die Gruppe nicht mehr im Bild ist (oder nach max Sekunden); wirkt über Zeitschleife
function auftritt_weg(g, fertig, max = 12) {
  const S = auftritt_S(); S.weg = S.weg || [];
  S.weg.push({ g, fertig, t: 0, max });
}

// Aktion ausführen, sobald die Gruppe wirklich unsichtbar ist (z. B. nach dem Wegsetzen unter die Erde): sofort, wenn sie es schon ist
function auftritt_wenn_weg(g, fn) { const r = g && g.__auf; if (!r || !r.real) { fn(); return; } const S = auftritt_S(); (S.nach = S.nach || []).push({ r, fn }); }

// ---- weiche Sichtbarkeit -------------------------------------------------------------
function auftritt_reg(g, o = {}) {
  if (!g || g.__auf) return g && g.__auf; const S = auftritt_S();
  const rec = { g, name: o.name || g.name || ('grp' + S.recs.length), real: g.visible, want: g.visible, a: g.visible ? 1 : 0, ein: o.ein ?? .8, aus: o.aus ?? .7, r: o.r ?? 1.5, nebel: o.nebel !== false,
    mats: [], lights: [], prepped: false, scanT: 0, scans: 0, last: new THREE.Vector3(), has: false, fresh: false, off: !!o.off, tog: -9, step: 0 };
  g.__auf = rec;
  try { Object.defineProperty(g, 'visible', { configurable: true, enumerable: true, get() { return rec.real; }, set(v) { auftritt_set(rec, !!v); } }); }
  catch (e) { console.warn('Auftritt: reg', e); return null; }
  S.recs.push(rec); if (!rec.off) { try { auftritt_prep(rec); } catch (e) { console.warn('Auftritt: prep', e); } } return rec;
}
// Gruppe anmelden oder – wenn schon angemeldet – ein neu hineingehängtes Modell sofort vorbereiten (vor dem ersten Zeigen)
function auftritt_neu(g, o) { const r = g.__auf || auftritt_reg(g, o); if (r) { auftritt_prep(r); if (r.real && r.prepped) auftritt_apply(r, r.a); } return r; }
function auftritt_pos(rec, v) { const g = rec.g; if (g.parent) g.updateWorldMatrix(true, false); return v.setFromMatrixPosition(g.matrixWorld); }
function auftritt_cloneMat(src) {
  const c = src.clone(); if (src.onBeforeCompile && src.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile) c.onBeforeCompile = src.onBeforeCompile;
  if (Object.prototype.hasOwnProperty.call(src, 'customProgramCacheKey')) c.customProgramCacheKey = src.customProgramCacheKey;
  if (src.defines) c.defines = Object.assign({}, src.defines);
  return c;
}
// Materialien/Lichter einmal vorbereiten (eigene Kopien je Wurzelgruppe – Klone teilen sonst Material): undurchsichtige per alphaHash (Dither), durchsichtige per Deckkraft
function auftritt_prep(rec) {
  const g = rec.g, map = new Map(); let n = 0;
  g.traverse(o => {
    if (o.isLight) return;                                            // Lichter steuern die Module selbst (Stärke wird laufend gesetzt)
    if (!o.material || o.__aufM === o.material) return; if (!(o.isMesh || o.isPoints || o.isLine || o.isSprite)) return;
    const conv = src => {
      if (!src) return src; if (map.has(src)) return map.get(src);
      // Nur undurchsichtige Standard-Materialien werden per Dither (alphaHash) überblendet. Durchsichtige (Geister, Glanz, Sprites) treiben ihre Deckkraft selbst
      // und eigene Shader-Materialien kennen alphaHash nicht: beide bleiben unberührt (kein Klon, das Modul steuert sie weiter selbst).
      if (src.transparent || !(src.isMeshBasicMaterial || src.isMeshStandardMaterial || src.isMeshLambertMaterial || src.isMeshPhongMaterial || src.isMeshToonMaterial || src.isMeshMatcapMaterial)) { map.set(src, src); return src; }
      const c = auftritt_cloneMat(src); c.alphaHash = true; c.opacity = 1; rec.mats.push({ m: c, base: 1, hash: true });
      map.set(src, c); return c; };
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material); o.__aufM = o.material; n++;
  });
  if (rec.mats.length) rec.prepped = true; return n;
}
function auftritt_apply(rec, a) {
  for (const it of rec.mats) it.m.opacity = a;
}
// Dinge aus der Basis und aus Modulen, die ihre Gruppen nicht selbst anmelden (alle 3 s geprüft, idempotent)
function auftritt_basis() {
  const R = (g, n, o) => { try { if (g && g.isObject3D && !g.__auf) auftritt_reg(g, Object.assign({ name: n }, o)); } catch (e) { console.warn('Auftritt: basis ' + n, e); } };
  try { R(stalker, 'Graukind', { ein: .3, aus: .3 }); } catch (e) {}
  try { R(watcher, 'Beobachter-Statue', { ein: .4, aus: .35, r: 1.2 }); } catch (e) {}
  try { R(grey, 'Kichernde', { ein: .22, aus: .3, r: .8 }); } catch (e) {}
  try { R(victim, 'Frau im Nachthemd', { ein: .6, aus: .6 }); } catch (e) {}
  try { R(justin.g, 'Justin', { ein: .6, aus: .6, r: 1.2 }); } catch (e) {}
}
// Lichtschiff (UFO): erscheint nie plötzlich – blendet aus der Ferne ein (3 s; beim Kuh-Auftakt 1,2 s), und blendet beim Abzug aus; die Kamera-Ferne wird nur solange
// angehoben, wie das Schiff weiter als 110 m ist (sonst schneidet die Ferne-Ebene den Rumpf ab, und er "klappt" ins Bild).
function auftritt_ufo() {
  if (typeof ufo === 'undefined') return; const S = auftritt_S(), H = S.ufo || (S.ufo = { on: false, far: 0 });
  if (!ufo.__auf) { ufo.visible = false; auftritt_reg(ufo, { name: 'Lichtschiff', ein: 3, aus: 2.5, r: 9, nebel: false }); H.on = false; }
  const da = ufo.position.y > -400;
  if (da && !H.on) { H.on = true; ufo.__auf.ein = (typeof cowFx !== 'undefined' && cowFx.ufoT >= 0) ? 1.2 : 3; ufo.visible = true; }
  else if (!da && H.on) { H.on = false; ufo.visible = false; }
  if (!auftritt_kino()) {
    const want = ufo.__auf.real ? Math.max(110, camera.position.distanceTo(ufo.position) + 14) : 110;
    if ((want > 111 || H.far) && (camera.far === 110 || camera.far === H.far)) { if (Math.abs(camera.far - want) > .5) { camera.far = want; camera.updateProjectionMatrix(); } H.far = want > 111 ? want : 0; }
  }
}
function auftritt_log(S, rec, ev, extra) { if (!S.logOn) return; const L = S.log; L.push({ t: +S.t.toFixed(2), n: rec.name, ev, a: +rec.a.toFixed(2), ...extra }); if (L.length > 600) L.splice(0, 200); }
function auftritt_kino() { return typeof kino_S !== 'undefined' && !!kino_S.on; } // im Kino-Schnitt zeigen/verbergen Szenen ihre Sachen selbst (Schnitt, Einblende)
function auftritt_set(rec, v) {
  const S = auftritt_S(), was = rec.want; rec.want = v; const kn = auftritt_kino();
  if (v === rec.real && (v || rec.a <= 0)) return;
  if (v) {
    if (rec.real) return;                                             // war noch im Ausblenden -> der Takt blendet wieder auf
    if (rec.tog > 0 && S.t - rec.tog < .5) { S.stat.flick++; auftritt_log(S, rec, 'flackern'); }
    rec.tog = S.t;
    if (!rec.prepped && !rec.off) auftritt_prep(rec);
    rec.real = true; rec.a = rec.prepped && !rec.off && !kn ? 0 : 1; rec.fresh = !kn; if (rec.prepped) auftritt_apply(rec, rec.a);
  } else {
    if (!was && rec.real) return;                                     // blendet schon aus
    if (rec.tog > 0 && S.t - rec.tog < .5) { S.stat.flick++; auftritt_log(S, rec, 'flackern'); }
    rec.tog = S.t;
    const p = auftritt_pos(rec, S.v2), inV = auftritt_imBild(p.x, p.y, p.z, rec.r, .15, rec.nebel);
    if (rec.off || kn || !rec.prepped || rec.a <= .02 || !inV) {            // nicht fadbar oder ausser Sicht: sofort
      if (inV && rec.a > .05) { S.stat.pop++; auftritt_log(S, rec, 'POP-aus'); }
      rec.real = false; rec.a = 0; rec.fresh = false; return; }
    // im Bild: weiter sichtbar, der Takt blendet aus und schaltet dann ab
  }
}
function auftritt_tick(dt) {
  const S = auftritt_S(); S.frame++; S.t += dt; const kn = auftritt_kino();
  try { auftritt_ufo(); } catch (e) { if (!S.eu) { S.eu = 1; console.warn('Auftritt: UFO', e); } }
  if ((S.bT = (S.bT || 0) - dt) <= 0) { S.bT = 3; auftritt_basis(); }
  for (let i = 0; i < S.recs.length; i++) {
    const rec = S.recs[i], g = rec.g;
    // späte Modelle (Figuren laden nach): gelegentlich nachrüsten
    if (!rec.off && (rec.scanT -= dt) <= 0) { rec.scans++; rec.scanT = rec.scans < 5 ? .6 : rec.prepped ? 4 + (i % 5) : .5; const was = rec.mats.length; auftritt_prep(rec); if (rec.mats.length !== was && rec.real) auftritt_apply(rec, rec.a); }
    if (!rec.real) { rec.has = false; continue; }
    if (kn) { if (rec.want) { if (rec.a < 1) { rec.a = 1; if (rec.prepped) auftritt_apply(rec, 1); } rec.fresh = false; } else { rec.real = false; rec.a = 0; } continue; }
    const p = auftritt_pos(rec, S.v), inV = auftritt_imBild(p.x, p.y, p.z, rec.r, .15, rec.nebel);
    // Sprung-Wächter
    let jumped = false;
    if (rec.has) { const st = rec.last.distanceTo(p); rec.step = st; if (st > Math.max(2.2, 12 * dt * 2.2) && rec.a > .02) { jumped = true; S.stat.jump++; auftritt_log(S, rec, 'SPRUNG', { d: +st.toFixed(1), inV }); } }
    rec.last.copy(p); rec.has = true;
    if (rec.prepped && !rec.off) {
      if (rec.fresh) { rec.fresh = false; if (!inV) { rec.a = 1; auftritt_apply(rec, 1); auftritt_log(S, rec, 'zeigen-aussen'); continue; } S.stat.fadeIn++; auftritt_log(S, rec, 'einblenden', { d: +p.distanceTo(camera.position).toFixed(1) }); }
      if (jumped) { if (rec.want) { if (inV) { rec.a = 0; S.stat.fadeIn++; } } else { rec.real = false; rec.a = 0; S.stat.hart++; auftritt_log(S, rec, 'hart-aus(Sprung)'); continue; } }
      if (rec.want) { if (rec.a < 1) { rec.a = inV ? Math.min(1, rec.a + dt / rec.ein) : 1; auftritt_apply(rec, rec.a); } }
      else { rec.a = inV ? Math.max(0, rec.a - dt / rec.aus) : 0; auftritt_apply(rec, rec.a); if (rec.a <= 0) { rec.real = false; rec.has = false; auftritt_log(S, rec, 'ausgeblendet'); } }
    } else if (!rec.want) { rec.real = false; rec.a = 0; }
  }
  if (S.nach && S.nach.length) for (let i = S.nach.length - 1; i >= 0; i--) { const W = S.nach[i]; if (!W.r.real) { S.nach.splice(i, 1); try { W.fn(); } catch (e) {} } }
  if (S.weg && S.weg.length) for (let i = S.weg.length - 1; i >= 0; i--) { const W = S.weg[i]; W.t += dt; const p = auftritt_pos({ g: W.g }, S.v);
    if (W.t > W.max || !auftritt_imBild(p.x, p.y, p.z, 1.5, .2, true)) { S.weg.splice(i, 1); try { W.fertig(); } catch (e) { console.warn('Auftritt: weg', e); } } }
}
function auftritt_report() { const S = auftritt_S(); return { stat: Object.assign({}, S.stat), recs: S.recs.length, prepped: S.recs.filter(r => r.prepped).length, log: S.log.slice(-60) }; }
WORLD_TICK.push((dt) => { try { auftritt_tick(Math.min(dt, .1)); } catch (e) { if (!auftritt_S().err) { auftritt_S().err = 1; console.warn('Auftritt: Takt', e); } } });
