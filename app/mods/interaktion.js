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
  if (/zettel|foto|polaroid|akte |notiz|brief|lesen|ansehen|\bkarte\b|plakat|schild|tafel|grab|stein|kreuz|aushang|code|funk|radio|telefon|spion|fahrkarte|kalender|uhr\b|frage|leuchten|sehen|schauen|durchsuchen|untersuchen/.test(s)) return null;
  if (/schublade|kommode|registratur|besteck/.test(s)) return 'schublade';
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
    const auf = hc.x > b.min.x - .3 && hc.x < b.max.x + .3 && hc.y > b.min.y - .15 && hc.y < b.max.y + .15 && hc.z > b.min.z - .3 && hc.z < b.max.z + .3;
    if (typ === 'tuer') { ok = auf && st < .25 && ((s.y > 1.5 && s.y < 2.7 && sh > .5 && sh < 1.7) || (s.y > 1.8 && s.y < 3.1 && sh > 2.4 && sh < 4.4)); score = -s.x * s.y * s.z; } // Tür oder Garagentor (3–4 m)
    else if (typ === 'schublade') { ok = auf && s.y > .04 && s.y < .5 && sh > .22 && sh < 1.4 && st > .02 && st < .75; score = -s.x * s.y * s.z; }
    else if (typ === 'deckel') { ok = auf && s.y < .3 && s.x > .22 && s.z > .22 && s.x < 2 && s.z < 2; score = -Math.abs(cen.y - hb.max.y); }
    else if (typ === 'klappe') { ok = auf && st < .1 && sh > .12 && sh < .8 && s.y > .08 && s.y < .8; score = -s.x * s.y * s.z; }
    else if (typ === 'auto') { ok = ex.containsPoint(cen) && /door-(front|rear)|cdoor/i.test(r.n) && !/interior|glass|trim|window/i.test(r.n); score = -Math.hypot(cen.x - pp.x, cen.z - pp.z); }
    if (!ok) continue; if (!best || score > best.sc) best = { r, sc: score }; }
  return best ? best.r : null; }
// Steuerung anlegen: Drehpunkt (pivot) an Kante, Teil hineinhängen (Weltlage bleibt)
function iap_wurzel(h) { // größtes Netz in der Klickfläche → oberste Gruppe unter der Szene (Fahrzeug), nie ein Sammelknoten
  const hb = IAP_B.setFromObject(h).clone().expandByScalar(.2); let best = null;
  for (const r of iap_nah(hb, .2)) { const c = r.b.getCenter(IAP_V2); if (!hb.containsPoint(c)) continue; const v = r.s.x * r.s.y * r.s.z; if (!best || v > best.v) best = { o: r.o, v }; }
  if (!best) return null; let n = best.o; while (n.parent && n.parent !== scene && n.parent.children.length < 40) n = n.parent; if (n === scene) return null;
  const sz = IAP_B.setFromObject(n).getSize(new THREE.Vector3()); if (Math.max(sz.x, sz.z) > 7.5 || sz.y > 4) return null; return n; } // zu groß = Gebäude: nie das ganze Haus bewegen
function iap_anlegen(h, typ, spieler) {
  const rec = iap_teil(h, typ);
  if (!rec && (typ === 'auto' || typ === 'tuer')) { const w = iap_wurzel(h); if (w) { const C = { h, typ, part: w, open: false, k: 0, ziel: 0, dur: .5, ang: 0, mode: 'wippen', rattle: 0, key: '', passage: false, rz: w.rotation.z, rx: w.rotation.x, ry: w.rotation.y, ax: 'z' };
      const wp = h.getWorldPosition(new THREE.Vector3()); C.key = iap_label(h) + '|' + wp.x.toFixed(1) + '|' + wp.y.toFixed(1) + '|' + wp.z.toFixed(1); IAP.ctl.set(h, C); IAP.stat.attach++; return C; } }
  if (!rec) { IAP.stat.miss++; return null; } const part = rec.o, b = rec.b, par = part.parent; if (!par) return null;
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
  const wp = h.getWorldPosition(new THREE.Vector3()); C.key = iap_label(h) + '|' + wp.x.toFixed(1) + '|' + wp.y.toFixed(1) + '|' + wp.z.toFixed(1);
  IAP.ctl.set(h, C); IAP.stat.attach++; return C; }
function iap_setze(C, k) { if (C.mode === 'wippen') return; if (C.mode === 'dreh') C.piv.rotation[C.ax] = C.ang * k; else C.piv.position.copy(C.p0).addScaledVector(C.ldir, C.dist * k); }
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
  if (C.typ === 'tuer' || C.typ === 'auto') { iap_rattle(C); iap_snd(h, C.typ === 'auto' ? 'metalHit2' : 'doorCreak', { gain: .35, rate: 1.15 }); return true; }
  if (C.open) { iap_start(C, false); iap_snd(h, C.typ === 'schublade' ? 'woodClose1' : (C.typ === 'deckel' ? 'woodClose2' : 'metalClose'), { gain: .45 }); return false; } // schließen: Text/Fund nicht wiederholen
  iap_start(C, true); iap_snd(h, C.typ === 'schublade' ? 'woodSqueak1' : (C.typ === 'deckel' ? 'woodSqueak2' : 'metalOpen'), { gain: .45 }); return true; }
function iap_haengen() { // neue Klickflächen verdrahten (nur Typen, die eine Bewegung bekommen können)
  if (window.__iapAus) return; // Testschalter: ohne Interaktionsbewegung messen (Vorher-Werte)
  for (const h of interactables) { if (!h || IAP.seen.has(h) || !h.userData || typeof h.userData.action !== 'function') continue; IAP.seen.add(h); const typ = iap_typ(iap_label(h)); if (!typ) continue;
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
IAP.f = { teil: iap_teil, nah: iap_nah, typ: iap_typ, index: iap_index };
// Spielstand: Gartentore (gates der Basis) und Briefkästen (strasse.js) – vorher nach dem Laden wieder zu
MOD_SAVE.push(['tore', () => { try { return { g: gates.map(g => g.open ? 1 : 0), m: (typeof strasse_S !== 'undefined' && strasse_S.mbSt ? strasse_S.mbSt.filter(q => q.st.open).map(q => q.k) : []) }; } catch (e) { return null; } },
  v => { try { if (!v) return; (v.g || []).forEach((o, i) => { const g = gates[i]; if (!g || !!o === g.open) return; g.open = !!o; g.piv.rotation.y = g.open ? -1.45 * g.facing : 0; if (g.open) g.col.minX = g.col.maxX = -9999; else Object.assign(g.col, g.saved); });
      if (typeof strasse_S !== 'undefined' && strasse_S.mbSt) for (const q of strasse_S.mbSt) if ((v.m || []).includes(q.k)) { q.st.open = true; q.piv.rotation.x = 1.45; } } catch (e) {} }]);
window.__iap = IAP;
