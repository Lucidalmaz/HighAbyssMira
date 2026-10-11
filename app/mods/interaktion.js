// =====================================================================  INTERAKTIONS-PHYSIK (Nutzer 11.10.2026, Folgeauftrag 10)
// „Wenn du ein Auto aufmachst oder eine Tür aufmachst, dass die Tür dann auch aufgeht und sich bewegt … alles, was du anfasst, soll sich wirklich bewegen.“
// Messung (docs/gameplay/interaktion_audit.md): die meisten Klickflächen sind unsichtbare Kästen über dem Modell und lösen nur Text, Ton oder Notiz aus – das Teil darunter (Schublade, Deckel, Tür, Autotür)
// bleibt stehen. Dieses Modul hängt sich an jede Klickfläche eines mechanischen Typs, die noch keine eigene Bewegung hat (Beschriftung „öffnen/schließen“ = Modul animiert selbst),
// sucht das echte Bauteil darunter (dünne Front/Platte/Türblatt, Autotür nach Name) und bewegt es an einem Drehpunkt (Tür, Klappe, Deckel) bzw. Gleitweg (Schublade) mit weicher Kurve.
//   · Schublade: gleitet 30 cm zum Spieler (Tiefe ≈ 60–80 %), E erneut = schließen (ohne Text/Fund zu wiederholen), Zustand wird gespeichert.
//   · Deckel/Klappe: kippt um die Hinterkante bzw. Unterkante 75–80°. Tür ohne „öffnen“ in der Beschriftung (verschlossen): rüttelt an der Klinke, Autotür ebenso (Scharnier am Vorderrand).
//   · Durchgangstür (Hinaus, Treppe, Kellertür …): schwingt 80° auf, Original-Aktion (Überblendung/Teleport) folgt nach 0,3 s, danach fällt die Tür leise wieder zu.
//   · Kollision folgt: bewegte Netze werden von der Netz-Kollision (SOL, solidLive) pro Bild neu vermessen; Animationen ticken nur, solange sie laufen (keine Dauerlast).
// Was kein Bauteil findet (Klickfläche über einem Gesamtnetz, z. B. Hauswand), bleibt unverändert und steht im Audit als „kein Teil“.
const IAP = { ctl: new Map(), act: [], idx: null, idxT: -99, idxX: 0, idxZ: 0, seen: new WeakSet(), scanT: 0, pend: [], stat: { attach: 0, miss: 0, press: 0 } };
const IAP_V = new THREE.Vector3(), IAP_V2 = new THREE.Vector3(), IAP_B = new THREE.Box3();
function iap_label(h) { let l = h.userData.label; try { if (typeof l === 'function') l = l(); } catch (e) { l = ''; } return String(l == null ? '' : l); }
function iap_typ(l) { const s = l.toLowerCase();
  if (/öffnen|schließen|schliessen|aufmachen|zumachen|aufschieben|aufstellen/.test(s)) return null; // Modul animiert selbst
  if (/unter dem tresen/.test(s)) return null; // Schublade ohne sichtbares Möbelteil (nur Klickfläche auf der Theke)
  if (/schublade|registratur|kommode/.test(s) && !/zettel|foto|polaroid|notiz|brief|lesen|ansehen|schild/.test(s)) return 'schublade'; // „… durchsuchen“ an Möbeln: Schublade gleitet auf
  if (/zettel|foto|polaroid|akte |notiz|brief|lesen|ansehen|\bkarte\b|plakat|schild|tafel|grab|stein|kreuz|aushang|code|funk|radio|telefon|spion|fahrkarte|kalender|uhr\b|frage|leuchten|sehen|schauen|durchsuchen|untersuchen/.test(s)) return null;
  if (/schublade|kommode|registratur/.test(s)) return 'schublade'; // „Besteck“ liegt lose (kein Möbel mit Schubladen)
  if (/kofferraum|deckel|truhe|geldkassette|kinderkiste|zigarrenkiste|karteikasten|gully|container|kiste/.test(s)) return 'deckel';
  if (/handschuhfach|klappe/.test(s)) return 'klappe';
  if (/^auto$|autotür|ausgebranntes auto|überwachsenes auto|schrottauto|^transporter|erster transporter|wrack/.test(s)) return 'auto';
  if (/(^|[^a-zäöüß])(haus|keller|hinter|vorder|west|ost|nord|süd|seiten|neben|stall|schuppen|kapellen|laden|stahl|garagen|eisen|garten|zimmer|küchen|bad|gitter|metall|brand|schiebe|innen|außen|bunker|villa)?\s?(tür|tuer|tor)\b|^hinaus|^hinein(?!sehen)/.test(s)) return 'tuer';
  return null; }
// Netz-Verzeichnis (4-m-Zellen): sichtbare Netze mit Weltquader; alle 25 s neu (Räume entstehen später)
function iap_index() { // nur Netze im Umkreis von 18 m um den Spieler (Ursprung der Netze): kein Ruckler beim ersten E
  const t = performance.now(), P = player.pos; if (IAP.idx && t - IAP.idxT < 25000 && Math.hypot(P.x - IAP.idxX, P.z - IAP.idxZ) < 6) return IAP.idx; IAP.idxT = t; IAP.idxX = P.x; IAP.idxZ = P.z;
  const G = new Map(); scene.updateMatrixWorld(true);
  scene.traverse(o => { if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position) return; const e = o.matrixWorld.elements; if (Math.abs(e[12] - P.x) > 18 || Math.abs(e[14] - P.z) > 18) return;
    if (o.geometry.attributes.position.count > 250000) return;
    for (let p = o; p; p = p.parent) if (!p.visible) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m === hidden || m.visible === false || m.colorWrite === false || (m.opacity !== undefined && m.opacity < .05)) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), s = b.getSize(new THREE.Vector3()); if (Math.max(s.x, s.y, s.z) > 6) return;
    const rec = { o, b, s, n: ((o.name || '') + ' ' + ((o.parent && o.parent.name) || '')).trim() };
    for (let i = Math.floor(b.min.x / 4); i <= Math.floor(b.max.x / 4); i++) for (let j = Math.floor(b.min.z / 4); j <= Math.floor(b.max.z / 4); j++) { const k = i + ',' + j; let L = G.get(k); if (!L) G.set(k, L = []); L.push(rec); } });
  IAP.idx = G; return G; }
function iap_nah(b, m) { const G = iap_index(), out = new Set();
  for (let i = Math.floor((b.min.x - m) / 4); i <= Math.floor((b.max.x + m) / 4); i++) for (let j = Math.floor((b.min.z - m) / 4); j <= Math.floor((b.max.z + m) / 4); j++) { const L = G.get(i + ',' + j); if (L) for (const r of L) out.add(r); }
  return out; }
// Bauteil unter der Klickfläche finden (Typ-Form + Überdeckung); null = kein Teil
function iap_teil(h, typ) {
  const hb = IAP_B.setFromObject(h).clone(); if (hb.isEmpty()) return null; const hc = hb.getCenter(new THREE.Vector3()), ex = hb.clone().expandByScalar(.14), pp = player.pos; let best = null;
  for (const r of iap_nah(ex, .25)) {
    const b = r.b, s = r.s, cen = b.getCenter(IAP_V2);
    const sh = Math.max(s.x, s.z), st = Math.min(s.x, s.z); let ok = false, score = 0;
    // Klickfläche liegt auf dem Teil (Mitte der Klickfläche im Teil, 12 cm Toleranz) – außer Autotür: Teil liegt in der (großen) Klickfläche
    const tol = typ === 'tuer' ? .55 : .3, auf = hc.x > b.min.x - tol && hc.x < b.max.x + tol && hc.y > b.min.y - (typ === 'deckel' ? .4 : .15) && hc.y < b.max.y + (typ === 'deckel' ? .4 : .15) && hc.z > b.min.z - tol && hc.z < b.max.z + tol;
    if (typ === 'tuer') { ok = auf && st < .4 && ((s.y > 1.5 && s.y < 2.7 && sh > .5 && sh < 1.7) || (s.y > 1.8 && s.y < 3.1 && sh > 2.4 && sh < 4.4)); score = -s.x * s.y * s.z; } // Tür oder Garagentor (3–4 m)
    else if (typ === 'schublade') { ok = auf && s.y > .04 && s.y < .5 && sh > .22 && sh < 1.4 && st > .02 && st < .75; score = -s.x * s.y * s.z; }
    else if (typ === 'deckel') { ok = auf && s.y < .3 && s.x > .22 && s.z > .22 && s.x < 2 && s.z < 2; score = -Math.abs(cen.y - hb.max.y); }
    else if (typ === 'klappe') { ok = auf && st < .1 && sh > .12 && sh < .8 && s.y > .08 && s.y < .8; score = -s.x * s.y * s.z; }
    else if (typ === 'auto') { ok = ex.containsPoint(cen) && /door-(front|rear)|cdoor/i.test(r.n) && !/interior|glass|trim|window/i.test(r.n); score = -Math.hypot(cen.x - pp.x, cen.z - pp.z); }
    if (!ok) continue; if (!best || score > best.sc) best = { r, sc: score }; }
  return best ? best.r : null; }
// Bauteil heraustrennen (Folgeauftrag 10, Nacharbeit): ist Tür/Deckel/Schublade/Klappe Teil eines größeren Netzes (Gebäude, Möbel, Armaturenbrett), werden die Dreiecke, die
// ganz in der Klickfläche (leicht erweitert) liegen, in ein eigenes Netz kopiert (gleiche Matrix, gleiches Material) und im Original zu Nulldreiecken entwertet (Index im Platz geändert:
// BVH und Draw bleiben gültig, keine Neuberechnung des Baums). Geteilte Geometrie (Klone) wird vorher kopiert, außer sie ist riesig (> 120 k Dreiecke) – dann wird nicht getrennt.
const IAP_TV = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const IAP_REGION = { 'Kapellentür': [-53.85, .12, 81.45, -52.85, 2.1, 81.72] }; // gemessen (kap_dbg): Türblatt der Kapelle
function iap_trenne(h, typ) {
  let hb = IAP_B.setFromObject(h).clone(); if (hb.isEmpty()) return null;
  { const r = IAP_REGION[iap_label(h)]; if (r && Math.abs((hb.min.x + hb.max.x) / 2 - (r[0] + r[3]) / 2) < 3 && Math.abs((hb.min.z + hb.max.z) / 2 - (r[2] + r[5]) / 2) < 4) hb = new THREE.Box3(new THREE.Vector3(r[0], r[1], r[2]), new THREE.Vector3(r[3], r[4], r[5])); } const reg = hb.clone().expandByScalar(typ === 'tuer' ? .06 : .04); if (typ === 'deckel') reg.min.y = Math.max(reg.min.y, hb.max.y - Math.max(.18, Math.min(.35, (hb.max.y - hb.min.y) * .3))); const regW = reg.clone().expandByScalar(.0); if (IAP.dbg) IAP.dbg.push({ hit: [hb.min.x, hb.min.y, hb.min.z, hb.max.x, hb.max.y, hb.max.z].map(v => +v.toFixed(2)), cand: 0 });
  const mw = new THREE.Matrix4(); let best = null; const cand = [];
  scene.updateMatrixWorld(true);
  scene.traverse(m => { if (!m.isMesh || m === h || m.isSkinnedMesh || m.isInstancedMesh || !m.geometry || !m.geometry.index || !m.geometry.attributes.position) return;
    for (let p = m; p; p = p.parent) if (!p.visible) return; const mt = Array.isArray(m.material) ? m.material[0] : m.material; if (!mt || mt === hidden || mt.visible === false || mt.colorWrite === false || mt.blending === THREE.AdditiveBlending) return;
    const g = m.geometry; if (!g.boundingBox) g.computeBoundingBox(); const b = g.boundingBox.clone().applyMatrix4(m.matrixWorld); if (!b.intersectsBox(reg)) return;
    if (g.index.count / 3 < 30) return; cand.push(m); });
  for (const m of cand) { const g = m.geometry, P = g.attributes.position, I = g.index, n = I.count / 3, sel = []; mw.copy(m.matrixWorld);
    const mn = new THREE.Vector3(1e9, 1e9, 1e9), mx = new THREE.Vector3(-1e9, -1e9, -1e9);
    for (let t = 0; t < n; t++) { let ok = true, cx = 0, cy = 0, cz = 0, ext = 0; for (let k = 0; k < 3; k++) { const v = IAP_TV[k].fromBufferAttribute(P, I.getX(t * 3 + k)).applyMatrix4(mw); cx += v.x; cy += v.y; cz += v.z; if (!reg.containsPoint(v)) ok = false; }
      if (!ok) { // große Dreiecke einer Gesamtmasse: Schwerpunkt in der Region und Dreieck nicht größer als die Region
        ext = Math.max(IAP_TV[0].distanceTo(IAP_TV[1]), IAP_TV[1].distanceTo(IAP_TV[2]), IAP_TV[2].distanceTo(IAP_TV[0])); if (ext > .6 || !reg.containsPoint(IAP_V.set(cx / 3, cy / 3, cz / 3))) continue; } if (I.getX(t * 3) === I.getX(t * 3 + 1) && I.getX(t * 3) === I.getX(t * 3 + 2)) continue; sel.push(t); for (let k = 0; k < 3; k++) { mn.min(IAP_TV[k]); mx.max(IAP_TV[k]); } }
    if (IAP.dbg) IAP.dbg.push({ n: (m.name || '') + '<' + ((m.parent && m.parent.name) || ''), tri: n, sel: sel.length, s: [mx.x - mn.x, mx.y - mn.y, mx.z - mn.z].map(v => +v.toFixed(2)), reg: [reg.min.x, reg.min.y, reg.min.z, reg.max.x, reg.max.y, reg.max.z].map(v => +v.toFixed(2)) });
    if (sel.length < 8) continue; const sx = mx.x - mn.x, sy = mx.y - mn.y, sz = mx.z - mn.z, sh = Math.max(sx, sz), st = Math.min(sx, sz); let ok = false;
    if (typ === 'tuer') ok = sy > 1.2 && sh > .45 && st < .55; else if (typ === 'schublade') ok = (sy > .04 && sy < .6 && sh > .2 && sh < 1.5) || (sy > 1.2 && sh > .45 && st < .45); else if (typ === 'deckel') ok = sy < .6 && sh > .2 && sh < 2.2; else if (typ === 'klappe') ok = sh > .12 && sh < 1 && sy > .06 && !/door|tuer|panel|console|seat/i.test((m.name || '') + (m.parent ? m.parent.name : ''));
    if (ok && (!best || sel.length > best.sel.length)) best = { m, sel, mn: mn.clone(), mx: mx.clone() }; }
  if (!best) return null; const m = best.m; let g = m.geometry;
  const shared = []; scene.traverse(o => { if (o !== m && o.isMesh && o.geometry === g) shared.push(o); });
  if (shared.length) { if (g.index.count / 3 > 120000) return null; g = m.geometry = g.clone(); try { if (g.computeBoundsTree) g.computeBoundsTree(); } catch (e) {} }
  const I = g.index, P = g.attributes.position; const map = new Map(), ni = [], order = [];
  for (const t of best.sel) for (let k = 0; k < 3; k++) { const v = I.getX(t * 3 + k); let q = map.get(v); if (q === undefined) { q = order.length; map.set(v, q); order.push(v); } ni.push(q); }
  const ng = new THREE.BufferGeometry();
  for (const name of Object.keys(g.attributes)) { const a = g.attributes[name]; if (a.isInterleavedBufferAttribute) continue; const arr = new a.array.constructor(order.length * a.itemSize); for (let i = 0; i < order.length; i++) for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.array[order[i] * a.itemSize + c]; ng.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize, a.normalized)); }
  ng.setIndex(ni); ng.computeBoundingBox(); ng.computeBoundingSphere();
  for (const t of best.sel) { const v = I.getX(t * 3); I.setX(t * 3 + 1, v); I.setX(t * 3 + 2, v); } I.needsUpdate = true; // Nulldreiecke im Original
  let mat = m.material; if (Array.isArray(mat)) { const cnt = {}; for (const t of best.sel) { const gr = (g.groups || []).find(q => t * 3 >= q.start && t * 3 < q.start + q.count); const mi = gr ? gr.materialIndex : 0; cnt[mi] = (cnt[mi] || 0) + 1; } let bi = 0, bc = -1; for (const k in cnt) if (cnt[k] > bc) { bc = cnt[k]; bi = +k; } mat = mat[bi] || mat[0]; } // Material der überwiegenden Gruppe
  const nm = new THREE.Mesh(ng, mat); nm.name = 'iap_teil'; nm.castShadow = m.castShadow; nm.receiveShadow = m.receiveShadow; nm.layers.mask = m.layers.mask;
  nm.position.copy(m.position); nm.quaternion.copy(m.quaternion); nm.scale.copy(m.scale); m.parent.add(nm); nm.updateMatrixWorld(true);
  if (mat.side === THREE.FrontSide) { mat.side = THREE.DoubleSide; mat.needsUpdate = true; } // Rückseite des herausgetrennten Teils sichtbar (Innenseite der Tür)
  try { solidAdd(nm, true); } catch (e) {}
  const b = new THREE.Box3().setFromObject(nm), s2 = b.getSize(new THREE.Vector3()); IAP.stat.split = (IAP.stat.split || 0) + 1;
  return { o: nm, b, s: s2, n: 'iap_teil<' + (m.name || '') }; }
// Handschuhfach-Klappe: das Armaturenbrett-Modell hat kein Fach – Deckel (gleiches Material wie das nächste Innenraum-Netz) plus schwarzes Fach dahinter, an die Klickfläche gesetzt
function iap_klappe(h, spieler) {
  const hb = IAP_B.setFromObject(h).clone(); const c = hb.getCenter(new THREE.Vector3()), sz = hb.getSize(new THREE.Vector3());
  let mat = null, par = null, bestD = 1e9; scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.boundingBox || !o.parent) return; const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m === hidden || m.visible === false) return;
    const b = new THREE.Box3().copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); const d = b.distanceToPoint(c); if (d < bestD) { bestD = d; mat = m; par = o.parent; } });
  if (!mat || bestD > .6 || !par) return null;
  const ax = Math.abs(spieler.x - c.x) >= Math.abs(spieler.z - c.z), w = Math.min(.55, Math.max(.3, ax ? sz.z : sz.x)), hh = Math.min(.3, Math.max(.15, sz.y)), d = .022;
  const g = new THREE.Group(); const nrm = ax ? new THREE.Vector3(Math.sign(spieler.x - c.x) || 1, 0, 0) : new THREE.Vector3(0, 0, Math.sign(spieler.z - c.z) || 1);
  const fach = new THREE.Mesh(new THREE.PlaneGeometry(w * .94, hh * .9), new THREE.MeshBasicMaterial({ color: 0x050505 })); fach.userData.noCol = true;
  const lid = new THREE.Mesh(new THREE.BoxGeometry(ax ? d : w, hh, ax ? w : d), mat); lid.name = 'iap_klappe'; lid.castShadow = true; lid.receiveShadow = true;
  const pos = c.clone().addScaledVector(nrm, .012); lid.position.copy(pos); fach.position.copy(c); fach.lookAt(c.clone().add(nrm)); par.worldToLocal(lid.position); par.worldToLocal(fach.position);
  fach.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), nrm.clone().transformDirection(par.matrixWorld.clone().invert())); par.add(fach); par.add(lid); par.updateMatrixWorld(true); lid.updateMatrixWorld(true);
  try { solidAdd(lid, true); } catch (e) {}
  const b = new THREE.Box3().setFromObject(lid); IAP.stat.klappe = (IAP.stat.klappe || 0) + 1; return { o: lid, b, s: b.getSize(new THREE.Vector3()), n: 'iap_klappe' }; }
// Steuerung anlegen: Drehpunkt (pivot) an Kante, Teil hineinhängen (Weltlage bleibt)
function iap_wurzel(h) { // größtes Netz in der Klickfläche → oberste Gruppe unter der Szene (Fahrzeug), nie ein Sammelknoten
  const hb = IAP_B.setFromObject(h).clone().expandByScalar(.2); let best = null;
  for (const r of iap_nah(hb, .2)) { const c = r.b.getCenter(IAP_V2); if (!hb.containsPoint(c)) continue; const v = r.s.x * r.s.y * r.s.z; if (!best || v > best.v) best = { o: r.o, v }; }
  if (!best) return null; let n = best.o; while (n.parent && n.parent !== scene && n.parent.children.length < 40) n = n.parent; if (n === scene) return null;
  let sz = IAP_B.setFromObject(n).getSize(new THREE.Vector3()); if (Math.max(sz.x, sz.z) > 7.5 || sz.y > 4) { n = best.o; sz = IAP_B.setFromObject(n).getSize(new THREE.Vector3()); if (Math.max(sz.x, sz.z) > 7.5 || sz.y > 4) return null; } return n; } // zu groß = Gebäude: nie das ganze Haus bewegen
function iap_anlegen(h, typ, spieler) {
  let rec = iap_teil(h, typ); if (!rec && typ !== 'auto') { try { rec = iap_trenne(h, typ); } catch (e) { console.warn('iap_trenne', e); } }
  if (!rec && typ === 'klappe') { try { rec = iap_klappe(h, spieler); } catch (e) { console.warn('iap_klappe', e); } }
  if (!rec && (typ === 'auto' || typ === 'tuer')) { const w = iap_wurzel(h); if (w) { const C = { h, typ, part: w, open: false, k: 0, ziel: 0, dur: .5, ang: 0, mode: 'wippen', rattle: 0, key: '', passage: false, rz: w.rotation.z, rx: w.rotation.x, ry: w.rotation.y, ax: 'z' };
      const wp = h.getWorldPosition(new THREE.Vector3()); C.key = iap_label(h) + '|' + wp.x.toFixed(1) + '|' + wp.y.toFixed(1) + '|' + wp.z.toFixed(1); IAP.ctl.set(h, C); IAP.stat.attach++; return C; } }
  if (!rec) { IAP.stat.miss++; return null; } const part = rec.o, b = rec.b, par = part.parent; if (!par) return null; if (typ === 'schublade' && rec.s.y > 1.2) typ = 'tuer'; // hohes Blatt (Registratur-Tür) schwenkt
  const C = { h, typ, part, open: false, k: 0, ziel: 0, dur: .5, ang: 0, ax: 'y', dist: 0, dir: new THREE.Vector3(), mode: 'dreh', rattle: 0, key: '', passage: false };
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, thinX = rec.s.x < rec.s.z; // dünne Achse = Normale der Front/Platte
  const px = spieler.x, pz = spieler.z; let hx = cx, hz = cz, hy = b.min.y;
  if (typ === 'schublade') { const ax = Math.abs(px - cx) >= Math.abs(pz - cz); C.mode = 'gleit'; C.dir.set(ax ? (Math.sign(px - cx) || 1) : 0, 0, ax ? 0 : (Math.sign(pz - cz) || 1)); const dm = ax ? rec.s.x : rec.s.z; C.dist = Math.min(.34, dm > .38 ? dm * .7 : .3); C.dur = .42; }
  else if (typ === 'tuer' || typ === 'auto') { // senkrechte Achse; Scharnier: Auto = Vorderrand, Tür = Rand rechts vom Spieler; Freikante weg vom Spieler (Tür) bzw. nach außen (Auto)
    const side = thinX ? (px - cx >= 0 ? 1 : -1) : (pz - cz >= 0 ? 1 : -1); let endMax;
    if (typ === 'auto') { const f = IAP_V.set(0, 0, 1).transformDirection(par.matrixWorld); endMax = (thinX ? f.z : f.x) >= 0; } else endMax = thinX ? side < 0 : side > 0;
    hx = thinX ? cx : (endMax ? b.max.x : b.min.x); hz = thinX ? (endMax ? b.max.z : b.min.z) : cz; const r = endMax ? -1 : 1; // Freikante liegt relativ zum Scharnier bei r
    const want = typ === 'auto' ? side : -side; // gewünschte Seite der Freikante entlang der Normalen
    C.ang = -(thinX ? -want * r : want * r) * (typ === 'auto' ? 1.15 : 1.4); C.dur = typ === 'auto' ? .55 : .5; // Vorzeichen per Messung (weg < 0 = Freikante weicht vom Spieler)
    const q = String(h.userData.iapA0 || ''); // Durchgangstür = Original-Aktion wechselt den Raum (Kirchberg-/Nr.-4-Räume, Keller, Versetzen), nicht bloß Text
    C.passage = typ === 'tuer' && (/^(hinaus|hinein)(?!sehen)/i.test(iap_label(h)) || /kirchberg_(rein|raus|betreten)|nr4_wechsel|enterBasement|leaveBasement|raumWechsel|villa_(rein|raus|betreten)|uebergang/i.test(q)); }
  else if (typ === 'deckel') { const useX = Math.abs(px - cx) > Math.abs(pz - cz); // Spieler steht eher in x: Hinterkante = gegenüberliegende x-Kante, Achse z
    hx = useX ? (px > cx ? b.min.x : b.max.x) : cx; hz = useX ? cz : (pz > cz ? b.min.z : b.max.z); hy = b.max.y - .01; C.ax = useX ? 'z' : 'x'; C.dur = .5;
    C.ang = useX ? (px > cx ? 1 : -1) * 1.3 : (pz > cz ? -1 : 1) * 1.3; }
  else if (typ === 'klappe') { const useX = Math.abs(px - cx) > Math.abs(pz - cz); hx = useX ? (px > cx ? b.max.x : b.min.x) : cx; hz = useX ? cz : (pz > cz ? b.max.z : b.min.z); hy = b.min.y; C.ax = useX ? 'z' : 'x'; C.dur = .4;
    C.ang = useX ? (px > cx ? -1 : 1) * 1.4 : (pz > cz ? 1 : -1) * 1.4; }
  const piv = new THREE.Group(); piv.name = 'iap_pivot'; par.add(piv); par.updateMatrixWorld(true);
  if (C.mode === 'dreh') { IAP_V.set(hx, hy, hz); par.worldToLocal(IAP_V); piv.position.copy(IAP_V); }
  piv.updateMatrixWorld(true); piv.attach(part); C.piv = piv; C.p0 = piv.position.clone();
  if (C.mode === 'gleit') { const o = par.getWorldPosition(new THREE.Vector3()), t = o.clone().add(C.dir); par.worldToLocal(o); par.worldToLocal(t); C.ldir = t.sub(o).normalize(); }
  if (typ === 'deckel' && /gully/i.test(iap_label(h))) { const hm = new THREE.Mesh(new THREE.CircleGeometry(Math.max(rec.s.x, rec.s.z) * .46, 28), new THREE.MeshBasicMaterial({ color: 0x040404, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); hm.rotation.x = -Math.PI / 2; hm.position.set(cx, b.min.y + .02, cz); hm.visible = false; hm.userData.noCol = true; scene.add(hm); C.hole = hm; } // Schacht unter dem angehobenen Gullydeckel
  const wp = h.getWorldPosition(new THREE.Vector3()); C.key = iap_label(h) + '|' + wp.x.toFixed(1) + '|' + wp.y.toFixed(1) + '|' + wp.z.toFixed(1);
  IAP.ctl.set(h, C); IAP.stat.attach++; return C; }
function iap_setze(C, k) { if (C.hole) C.hole.visible = k > .03; if (C.mode === 'wippen') return; if (C.mode === 'dreh') C.piv.rotation[C.ax] = C.ang * k; else C.piv.position.copy(C.p0).addScaledVector(C.ldir, C.dist * k); }
const iap_ease = x => x * x * (3 - 2 * x);
function iap_start(C, auf) { C.ziel = auf ? 1 : 0; C.open = !!auf; if (!IAP.act.includes(C)) IAP.act.push(C); }
function iap_rattle(C) { C.rattle = 1; C.rt = 0; if (!IAP.act.includes(C)) IAP.act.push(C); }
function iap_tick(dt) {
  for (let i = IAP.act.length - 1; i >= 0; i--) { const C = IAP.act[i]; let fertig = true;
    if (C.rattle && C.mode === 'wippen') { C.rt += dt; const k = C.rt / 1.1; if (k >= 1) { C.rattle = 0; C.part.rotation.z = C.rz; C.part.rotation.x = C.rx; C.part.rotation.y = C.ry ?? C.part.rotation.y; } else { fertig = false; const a = Math.sin(k * Math.PI * 6) * Math.exp(-k * 3.5); if (C.typ === 'tuer') C.part.rotation.y = C.ry + a * .03; else { C.part.rotation.z = C.rz + a * .014; C.part.rotation.x = C.rx + a * .006; } } }
    else if (C.rattle) { C.rt += dt; const k = C.rt / .55; if (k >= 1) { C.rattle = 0; iap_setze(C, iap_ease(C.k)); } else { fertig = false; C.piv.rotation[C.ax] = Math.sin(k * Math.PI * 5) * Math.exp(-k * 3.2) * .05 * Math.sign(C.ang || 1) * (C.typ === 'auto' ? .6 : 1); } }
    if (!C.rattle) { const d = C.ziel - C.k; if (Math.abs(d) > 1e-4) { const st = dt / C.dur; C.k = d > 0 ? Math.min(C.ziel, C.k + st) : Math.max(C.ziel, C.k - st * 1.15); iap_setze(C, iap_ease(C.k)); fertig = Math.abs(C.ziel - C.k) < 1e-4; if (fertig) { C.k = C.ziel; iap_setze(C, C.ziel); } }
      else if (C.passage && C.open) { C.stayT = (C.stayT || 0) + dt; if (C.stayT > 2.2) { C.stayT = 0; iap_start(C, false); fertig = false; } else fertig = false; } }
    if (fertig && !C.rattle) IAP.act.splice(i, 1); } }
function iap_snd(h, n, o = {}) { try { const p = h.getWorldPosition(IAP_V2); Audio.play(n, Object.assign({ gain: .5, x: p.x, y: p.y, z: p.z, ref: 2 }, o)); } catch (e) {} }
// E auf eine Klickfläche: Bewegung auslösen. Rückgabe false = Original-Aktion nicht ausführen (Schließen); 'spaet' = nach der Schwenkzeit ausführen
function iap_press(h) {
  const typ = h.userData.iap; if (!typ) return true; let C = IAP.ctl.get(h); if (C === undefined) { C = iap_anlegen(h, typ, player.pos); if (!C) IAP.ctl.set(h, null); }
  if (!C) { if (typ === 'tuer' || typ === 'auto') { try { FEEL.dipV += .22; shake = Math.max(shake, .008); iap_snd(h, 'doorCreak', { gain: .3, rate: 1.1 }); } catch (e) {} } return true; } IAP.stat.press++; // kein Bauteil: Griff-Ruck an der Kamera + Ton
  if (C.typ === 'tuer' && C.passage) { if (!C.open) { iap_start(C, true); iap_snd(h, 'doorOpen', { gain: .5 }); return 'spaet'; } return true; }
  if (C.typ === 'auto' && C.mode === 'dreh' && h.userData.iapOffen) { // von der Story freigegebener Wagen: Tür klappt wirklich auf (Scharnier vorn, 66°), zweites E schließt
    iap_start(C, !C.open); iap_snd(h, 'carDoor', { gain: .55, rate: C.open ? 1 : .9 }); return true; }
  if (C.typ === 'tuer' || C.typ === 'auto') { iap_rattle(C); iap_snd(h, C.typ === 'auto' ? 'metalHit2' : 'doorCreak', { gain: .35, rate: 1.15 }); return true; }
  if (C.open) { iap_start(C, false); iap_snd(h, C.typ === 'schublade' ? 'woodClose1' : (C.typ === 'deckel' ? 'woodClose2' : 'metalClose'), { gain: .45 }); return false; } // schließen: Text/Fund nicht wiederholen
  iap_start(C, true); iap_snd(h, C.typ === 'schublade' ? 'woodSqueak1' : (C.typ === 'deckel' ? 'woodSqueak2' : 'metalOpen'), { gain: .45 }); return true; }
function iap_haengen() { // neue Klickflächen verdrahten (nur Typen, die eine Bewegung bekommen können)
  if (window.__iapAus) return; // Testschalter: ohne Interaktionsbewegung messen (Vorher-Werte)
  for (const h of interactables) { if (!h || IAP.seen.has(h) || !h.userData || typeof h.userData.action !== 'function') continue; IAP.seen.add(h); const typ = iap_typ(iap_label(h));
    if (!typ && IAP_GERAET_RX.test(iap_label(h))) { const ga = h.userData.action; h.userData.iapG = 1; h.userData.action = function () { try { const r = iap_geraetWurzel(h); if (r) { const n = iap_geraetBedienen(h, r); if (n) iap_snd(h, 'switch1', { gain: .35, rate: 1.2 }); } } catch (e) { console.warn('iap_geraet', e); } return ga.apply(this, arguments); }; continue; }
    if (!typ) continue;
    const a0 = h.userData.action, l0 = h.userData.label; h.userData.iap = typ; h.userData.iapA0 = a0; h.userData.iapL0 = l0;
    h.userData.action = function () { let go = true; try { go = iap_press(h); } catch (e) { console.warn('iap', e); } if (go === 'spaet') { const a = arguments, t = this; setTimeout(() => { try { a0.apply(t, a); } catch (e) { console.error('Aktion ' + iap_label(h), e); } }, 300); return; } if (go) return a0.apply(this, arguments); };
    if (typ !== 'tuer' && typ !== 'auto') h.userData.iapAnz = function () { const C = IAP.ctl.get(h); return C && C.open ? 'Schließen' : null; }; } }
WORLD_TICK.push(dt => { try { if (IAP.act.length) iap_tick(dt); IAP.scanT -= dt; if (IAP.scanT <= 0) { IAP.scanT = 1.5; iap_haengen(); } } catch (e) { if (!IAP.errT) { IAP.errT = 1; console.warn('interaktion', e); } } });
// Spielstand: offene Schubladen/Deckel/Klappen (Schlüssel = Beschriftung + Lage der Klickfläche); beim Laden verzögert angewendet, sobald die Klickfläche existiert
MOD_SAVE.push(['iap', () => { try { const o = []; for (const C of IAP.ctl.values()) if (C && C.open && C.typ !== 'tuer' && C.typ !== 'auto') o.push(C.key); return o; } catch (e) { return null; } },
  v => { if (Array.isArray(v)) IAP.pend = v.slice(); }]);
WORLD_TICK.push(dt => { if (!IAP.pend.length) return; IAP.pendT = (IAP.pendT || 0) - dt; if (IAP.pendT > 0) return; IAP.pendT = 2;
  for (const h of interactables) { if (!IAP.pend.length) break; const typ = h.userData && h.userData.iap; if (!typ) continue; const wp = h.getWorldPosition(IAP_V2); if (Math.abs(wp.x - player.pos.x) > 14 || Math.abs(wp.z - player.pos.z) > 14) continue; const key = iap_label(h) + '|' + wp.x.toFixed(1) + '|' + wp.y.toFixed(1) + '|' + wp.z.toFixed(1);
    const i = IAP.pend.indexOf(key); if (i < 0) continue; IAP.pend.splice(i, 1); let C = IAP.ctl.get(h); if (C === undefined) { C = iap_anlegen(h, typ, player.pos); IAP.ctl.set(h, C || null); } if (C) { C.open = true; C.ziel = 1; C.k = 1; iap_setze(C, 1); } } });
IAP.aus = () => { window.__iapAus = true; for (const h of interactables) { const u = h.userData; if (u && u.iapA0) { u.action = u.iapA0; delete u.iapA0; delete u.iapAnz; } } }; // Testschalter: Vorher-Zustand (ohne Interaktionsbewegung)
IAP.f = { trenne: iap_trenne, teil: iap_teil, nah: iap_nah, typ: iap_typ, index: iap_index };
// Spielstand: Gartentore (gates der Basis) und Briefkästen (strasse.js) – vorher nach dem Laden wieder zu
MOD_SAVE.push(['tore', () => { try { return { g: gates.map(g => g.open ? 1 : 0), m: (typeof strasse_S !== 'undefined' && strasse_S.mbSt ? strasse_S.mbSt.filter(q => q.st.open).map(q => q.k) : []) }; } catch (e) { return null; } },
  v => { try { if (!v) return; (v.g || []).forEach((o, i) => { const g = gates[i]; if (!g || !!o === g.open) return; g.open = !!o; g.piv.rotation.y = g.open ? -1.45 * g.facing : 0; if (g.open) g.col.minX = g.col.maxX = -9999; else Object.assign(g.col, g.saved); });
      if (typeof strasse_S !== 'undefined' && strasse_S.mbSt) for (const q of strasse_S.mbSt) if ((v.m || []).includes(q.k)) { q.st.open = true; q.piv.rotation.x = 1.45; } } catch (e) {} }]);

// =====================================================================  GERÄTE (Folgeauftrag 10, Nacharbeit): Drehknöpfe drehen, Tasten drücken ein, Tastenfeld wippt
// Funkgerät/Röhrenradio/CRT/Tastenfeld sind je ein Netz mit zusammenhängenden Teilen (Knöpfe, Tasten als eigene Komponenten). Beim ersten Bedienen werden die Komponenten per Dreiecks-Zusammenhang
// herausgetrennt (wie iap_trenne; Original-Dreiecke zu Nulldreiecken) und einzeln bewegt: Drehknopf um seine Achse (kleinste Ausdehnung), Taste ein Stück hinein.
const IAP_G = { cache: new WeakMap(), act: [] };
function iap_komponenten(m) { // → [{ tris: [Dreieck…], bb: Box3 (Welt) }]
  const g = m.geometry, P = g.attributes.position, I = g.index, n = (I ? I.count : P.count) / 3; if (n > 120000) return [];
  const idx = k => I ? I.getX(k) : k, vid = new Map(), par = []; const id = q => { const key = Math.round(P.getX(q) * 1000) + ',' + Math.round(P.getY(q) * 1000) + ',' + Math.round(P.getZ(q) * 1000); let v = vid.get(key); if (v === undefined) { v = par.length; vid.set(key, v); par.push(v); } return v; };
  const find = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }; const tv = [];
  for (let t = 0; t < n; t++) { const a = id(idx(t * 3)), c = id(idx(t * 3 + 1)), d = id(idx(t * 3 + 2)); tv.push(a); par[find(a)] = find(c); par[find(c)] = find(d); }
  const comp = new Map(), v = new THREE.Vector3(); m.updateWorldMatrix(true, false);
  for (let t = 0; t < n; t++) { const r = find(tv[t]); let c = comp.get(r); if (!c) comp.set(r, c = { tris: [], bb: new THREE.Box3() }); c.tris.push(t); for (let k = 0; k < 3; k++) { v.fromBufferAttribute(P, idx(t * 3 + k)).applyMatrix4(m.matrixWorld); c.bb.expandByPoint(v); } }
  return [...comp.values()]; }
function iap_abloesen(m, tris) { // Dreiecke tris aus Netz m in ein neues Netz (gleiche Matrix) kopieren; im Original zu Nulldreiecken machen
  let g = m.geometry; const shared = []; scene.traverse(o => { if (o !== m && o.isMesh && o.geometry === g) shared.push(o); }); if (shared.length) { g = m.geometry = g.clone(); try { if (g.computeBoundsTree) g.computeBoundsTree(); } catch (e) {} }
  const P = g.attributes.position, I = g.index; const idx = k => I ? I.getX(k) : k; const map = new Map(), order = [], ni = [];
  for (const t of tris) for (let k = 0; k < 3; k++) { const vtx = idx(t * 3 + k); let q = map.get(vtx); if (q === undefined) { q = order.length; map.set(vtx, q); order.push(vtx); } ni.push(q); }
  const ng = new THREE.BufferGeometry();
  for (const name of Object.keys(g.attributes)) { const a = g.attributes[name]; if (a.isInterleavedBufferAttribute) continue; const arr = new a.array.constructor(order.length * a.itemSize); for (let i = 0; i < order.length; i++) for (let c = 0; c < a.itemSize; c++) arr[i * a.itemSize + c] = a.array[order[i] * a.itemSize + c]; ng.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize, a.normalized)); }
  ng.setIndex(ni); ng.computeBoundingBox(); ng.computeBoundingSphere();
  if (I) { for (const t of tris) { const v0 = I.getX(t * 3); I.setX(t * 3 + 1, v0); I.setX(t * 3 + 2, v0); } I.needsUpdate = true; }
  else { for (const t of tris) for (let k = 1; k < 3; k++) { P.setXYZ(t * 3 + k, P.getX(t * 3), P.getY(t * 3), P.getZ(t * 3)); } P.needsUpdate = true; }
  const mat = Array.isArray(m.material) ? m.material[0] : m.material; const nm = new THREE.Mesh(ng, mat); nm.name = 'iap_geraet'; nm.castShadow = m.castShadow; nm.receiveShadow = m.receiveShadow;
  nm.position.copy(m.position); nm.quaternion.copy(m.quaternion); nm.scale.copy(m.scale); m.parent.add(nm); nm.updateMatrixWorld(true); nm.userData.noCol = true; return nm; }
function iap_geraetTeile(root) { // Knöpfe und Tasten eines Geräts (einmal je Wurzel)
  let L = IAP_G.cache.get(root); if (L) return L; L = []; IAP_G.cache.set(root, L); const meshes = []; root.traverse(m => { if (m.isMesh && !m.isSkinnedMesh && !m.isInstancedMesh && m.geometry) meshes.push(m); });
  for (const m of meshes) { const comps = iap_komponenten(m); if (comps.length < 3) continue; let big = 0; for (const c of comps) big = Math.max(big, c.tris.length);
    for (const c of comps) { const s = c.bb.getSize(new THREE.Vector3()), mx = Math.max(s.x, s.y, s.z), mn = Math.min(s.x, s.y, s.z), n = c.tris.length; if (n === big && comps.length > 1) continue; if (mx > .07 || n < 24) continue;
      const knob = mx >= .015 && mn <= .75 * mx && n >= 250; const taste = !knob && mx <= .035 && n >= 24; if (!knob && !taste) continue;
      const axis = s.x <= s.y && s.x <= s.z ? 'x' : (s.y <= s.z ? 'y' : 'z'); L.push({ m, c, knob, axis, ctr: c.bb.getCenter(new THREE.Vector3()), size: mx }); } }
  // abgetrennt wird erst bei Bedienung (Kosten), hier nur gemerkt
  return L; }
function iap_geraetBau(t) { if (t.part) return t.part; const nm = iap_abloesen(t.m, t.c.tris); const par = nm.parent, piv = new THREE.Group(); piv.name = 'iap_gpivot'; par.add(piv); par.updateMatrixWorld(true);
  const p = t.ctr.clone(); par.worldToLocal(p); piv.position.copy(p); piv.updateMatrixWorld(true); piv.attach(nm); t.piv = piv; t.p0 = piv.position.clone(); t.r0 = piv.rotation.clone(); t.part = nm;
  try { solidAdd(nm, true); } catch (e) {} return nm; }
// Bedienung: n = Anzahl der betätigten Teile (Tasten: nächstgelegene zum Blickpunkt)
function iap_geraetBedienen(h, root) {
  const L = iap_geraetTeile(root); if (!L.length) return 0; const ray = new THREE.Raycaster(); ray.setFromCamera({ x: 0, y: 0 }, camera); const pt = new THREE.Vector3(); const hb = IAP_B.setFromObject(h); if (!ray.ray.intersectBox(hb.clone().expandByScalar(.05), pt)) hb.getCenter(pt);
  const knoepfe = L.filter(t => t.knob).sort((a, b) => a.ctr.distanceTo(pt) - b.ctr.distanceTo(pt)).slice(0, 2), tasten = L.filter(t => !t.knob).sort((a, b) => a.ctr.distanceTo(pt) - b.ctr.distanceTo(pt)).slice(0, 1); let n = 0;
  for (const t of knoepfe) { iap_geraetBau(t); t.dir = (t.dir || 1) * -1; t.a0 = t.piv.rotation[t.axis]; t.a1 = t.a0 + t.dir * 1.4; t.k = 0; t.mode = 'dreh'; if (!IAP_G.act.includes(t)) IAP_G.act.push(t); n++; }
  for (const t of tasten) { iap_geraetBau(t); t.k = 0; t.mode = 'druck'; if (!IAP_G.act.includes(t)) IAP_G.act.push(t); n++; }
  return n; }
function iap_geraetTick(dt) { for (let i = IAP_G.act.length - 1; i >= 0; i--) { const t = IAP_G.act[i]; t.k = Math.min(1, t.k + dt / (t.mode === 'dreh' ? .4 : .22)); const e = iap_ease(t.k);
    if (t.mode === 'wipp') { const w = Math.sin(t.k * Math.PI); t.piv.rotation.x = t.r0.x - (t.ky || 0) * .03 * w; t.piv.rotation.y = t.r0.y + (t.kx || 0) * .03 * w; t.piv.position.copy(t.p0).z += 0; }
    else if (t.mode === 'dreh') t.piv.rotation[t.axis] = t.a0 + (t.a1 - t.a0) * e; else { const d = Math.sin(t.k * Math.PI) * .004; const nrm = new THREE.Vector3(t.axis === 'x' ? 1 : 0, t.axis === 'y' ? 1 : 0, t.axis === 'z' ? 1 : 0); t.piv.position.copy(t.p0).addScaledVector(nrm, -d * (t.sgn || 1)); }
    if (t.k >= 1) { if (t.mode === 'druck') t.piv.position.copy(t.p0); if (t.mode === 'wipp') { t.piv.rotation.x = t.r0.x; t.piv.rotation.y = t.r0.y; } IAP_G.act.splice(i, 1); } } }
function iap_geraetWurzel(h) { const hb = IAP_B.setFromObject(h).clone().expandByScalar(.35); let best = null, bd = 1e9; scene.traverse(o => { const k = o.userData && o.userData.msKey; if (!k || !/bed_funk|bed_keypad|^radio|crt\/|rekorder|w_telefon/.test(k)) return; const b = IAP_B2.setFromObject(o); if (b.isEmpty() || !b.intersectsBox(hb)) return; const d = b.getCenter(IAP_V2).distanceTo(hb.getCenter(IAP_V)); if (d < bd) { bd = d; best = o; } }); return best; }
const IAP_B2 = new THREE.Box3();
const IAP_GERAET_RX = /funkgerät|funkkasten|radio|fernseher|rekorder|kassettenrekorder|tonband/i;
WORLD_TICK.push(dt => { try { if (IAP_G.act.length) iap_geraetTick(dt); } catch (e) { if (!IAP_G.errT) { IAP_G.errT = 1; console.warn('iap_geraet', e); } } });
// Tastenfeld Kellertür: die Platte mit den Tasten wippt zur gedrückten Taste (3 × 4 Raster) und drückt ein
(function () { let plate = null, tried = 0; const keyPos = { 1: [-1, -1.5], 2: [0, -1.5], 3: [1, -1.5], 4: [-1, -.5], 5: [0, -.5], 6: [1, -.5], 7: [-1, .5], 8: [0, .5], 9: [1, .5], 0: [0, 1.5] };
  const find = () => { let root = null; scene.traverse(o => { if (!root && o.userData && o.userData.msKey === 'bed_keypad/model.fbx') root = o; }); if (!root) return null; const L = iap_geraetTeile(root); const big = []; root.traverse(m => { if (m.isMesh && m.geometry) { const cs = iap_komponenten(m); for (const c of cs) { const s = c.bb.getSize(new THREE.Vector3()); if (s.x > .09 && s.y > .1 && Math.min(s.x, s.y, s.z) < .03 && c.tris.length > 100 && s.y < .2) big.push({ m, c }); } } });
    if (!big.length) return null; big.sort((a, b) => a.c.tris.length - b.c.tris.length); const t = { m: big[0].m, c: big[0].c, axis: 'z', ctr: big[0].c.bb.getCenter(new THREE.Vector3()) }; iap_geraetBau(t); return t; };
  let alt = null; const wrapped = function (d) { try { if (!plate && tried++ < 3) plate = find(); if (plate) { const k = keyPos[d] || [0, 0]; plate.k = 0; plate.mode = 'wipp'; plate.kx = k[0]; plate.ky = k[1]; if (!IAP_G.act.includes(plate)) IAP_G.act.push(plate); } } catch (e) {} return alt.apply(this, arguments); };
  // andere Module setzen kpPress später neu (bedienung.js, kapitel1.js): alle 1,5 s die aktuelle Fassung einhängen
  setInterval(() => { try { if (typeof kpPress === 'function' && kpPress !== wrapped) { alt = kpPress; kpPress = wrapped; } } catch (e) {} }, 1500);
})();

IAP.G = IAP_G;
window.__iap = IAP;
