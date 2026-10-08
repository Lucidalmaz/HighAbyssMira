// =====================================================================  KARTE (Modul „karte“, Fassung 3 · Zusatzwunsch X-2, mit AP-11 abgestimmt): Fibel-Reiter „KARTE“
// Lukes Bleistiftkarte auf Karopapier, aus den echten Weltdaten gezeichnet (HOUSES, Bodenflächen, feste Körper aus SOL, Laternen, Waldwege),
// einmal je Blatt und Kapitel beim ersten Öffnen (nie im Tick). Nebel des Unbekannten: Besuchsraster je Blatt im Spielstand, Abtastung 2× pro Sekunde.
// Blätter: Dorf · Ebene −2 (ab Kap. 2) · Villa (ab Kap. 4, sobald ein Modul „villa“ steht; Grenzen mit karte_blatt('villa', {x0,x1,z0,z1}) setzbar) · Wald (Kap. 6).
// Nützlich: Lukes Position (Bleistiftpfeil) · Nadeln für bekannte offene Nebenaufgaben (Ort, an dem Luke davon erfuhr, oder q.karte = {x, z}) ·
//   eigene Markierungen mit Notiz (Klick) · Ziel ein-/ausblendbar (settings.karteZiel) · Taste M öffnet die Karte.
// Gruselschicht (nur, was Luke gesehen hat): Lucys blaue Kreispfeile (Kap. 1, Weg Briefkasten Nr. 7 → Kirchweg → Haltestelle) · Hildes rote Kerzen an
//   gefundenen Polaroids · Lunas weiße Kreide „ICH KOMME“ quer übers Dorf (erscheint von selbst ab Kap. 3) · ∴ an gefundenen Beobachter-Zetteln ·
//   die Einwohnerzahl ändert sich (214 → 211 → 210) · im Wald bleiben die Fraßstellen leer.
// Schnittstelle: karte_markierung(x, z, art, text) (z. B. Kreide aus tausch.js: art 'kreide') · karte_blatt(id, grenzen) · karte_oeffnen(blatt)
// Spielstand: 'karte' = { g: { blatt: base64 }, m: [[blatt, x, z, text, art]…], p: { questKey: [blatt, x, z] } }
const karte_S = { g: {}, dims: {}, m: [], p: {}, t: 0, ink: {}, inkKap: {}, paper: {}, comp: null, compKey: '', blatt: null, view: { z: 1, x: 0, y: 0 }, ready: false, open: false };
const KARTE_BL = [
  { id: 'dorf', titel: 'LOST EYENGLESS', x0: -166, x1: 174, z0: -60, z1: 106, s: 7.5, zelle: 3, r: 16, ab: 1 },
  { id: 'amt', titel: 'EBENE −2', x0: 572, x1: 738, z0: -2626, z1: -2574, s: 15, zelle: 1.5, r: 7, ab: 2 },
  { id: 'villa', titel: 'VILLA SEILER', x0: -945, x1: -855, z0: 855, z1: 945, s: 26, zelle: 1, r: 6, ab: 4, bereit: () => typeof villa_S !== 'undefined' || typeof VILLA !== 'undefined' },
  { id: 'wald', titel: 'FORBIDDEN DUSTWOODS', x0: -64, x1: 134, z0: 96, z1: 292, s: 12, zelle: 3, r: 11, ab: 6 },
];
const KARTE_LEER = [{ x: 1.5, z: 199.6, r: 9 }, { x: -13.2, z: 206.8, r: 11 }]; // Fraßstelle und Bau: „Der Wald hat kein Echo“ – hier bleibt das Blatt weiß
const KARTE_PAD = 120;
const KARTE_CPU = { willReadFrequently: true }; // Zeichenflächen der Karte im Arbeitsspeicher, nicht im knappen Grafikspeicher
const karte_bl = id => KARTE_BL.find(b => b.id === id);
const karte_korn = (dichte, farbe, seed) => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d', KARTE_CPU), R = karte_rng(seed || 7); x.fillStyle = farbe;
  for (let i = 0; i < 65536 * dichte; i++) x.fillRect(R() * 256, R() * 256, 1.2 + R() * .8, 1.2 + R() * .8); return c; };
function karte_blatt(id, g) { const b = karte_bl(id); if (b && g) { Object.assign(b, g); delete karte_S.ink[id]; karte_dims(b); } return b; }
function karte_dims(b) { const gw = Math.ceil((b.x1 - b.x0) / b.zelle), gh = Math.ceil((b.z1 - b.z0) / b.zelle); const d = karte_S.dims[b.id];
  if (!d || d[0] !== gw || d[1] !== gh) { karte_S.dims[b.id] = [gw, gh]; const alt = karte_S.g[b.id]; karte_S.g[b.id] = new Uint8Array(gw * gh); if (alt && alt.length === gw * gh) karte_S.g[b.id].set(alt); } }
KARTE_BL.forEach(karte_dims);
const karte_frei = b => kapAb(b.ab) && (!b.bereit || b.bereit());
const karte_drin = (b, x, z) => x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1;
function karte_blattAn(x, z) { for (const id of ['amt', 'villa']) { const b = karte_bl(id); if (karte_drin(b, x, z)) return b; }
  const w = karte_bl('wald'), d = karte_bl('dorf'); if (z > 100 && karte_drin(w, x, z)) return w; return karte_drin(d, x, z) ? d : karte_drin(w, x, z) ? w : null; }
const karte_rng = seed => { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
// ---------------------------------------------------------------------  Besuchsraster (Tick: höchstens 2× pro Sekunde, keine Allokationen)
function karte_aufdecken(b, x, z, r) {
  const g = karte_S.g[b.id], [gw, gh] = karte_S.dims[b.id], c = b.zelle, i0 = Math.max(0, Math.floor((x - r - b.x0) / c)), i1 = Math.min(gw - 1, Math.floor((x + r - b.x0) / c)),
    j0 = Math.max(0, Math.floor((z - r - b.z0) / c)), j1 = Math.min(gh - 1, Math.floor((z + r - b.z0) / c)); let neu = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const cx = b.x0 + (i + .5) * c, cz = b.z0 + (j + .5) * c; if ((cx - x) * (cx - x) + (cz - z) * (cz - z) > r * r) continue;
    if (b.id === 'wald') { let leer = false; for (const L of KARTE_LEER) if ((cx - L.x) * (cx - L.x) + (cz - L.z) * (cz - L.z) < L.r * L.r) leer = true; if (leer) continue; }
    const k = j * gw + i; if (!g[k]) { g[k] = 1; neu++; } }
  if (neu) karte_S.compKey = ''; return neu;
}
const karte_gesehen = (b, x, z) => { const [gw, gh] = karte_S.dims[b.id], i = Math.floor((x - b.x0) / b.zelle), j = Math.floor((z - b.z0) / b.zelle); return i >= 0 && j >= 0 && i < gw && j < gh && karte_S.g[b.id][j * gw + i] === 1; };
function karte_tick(dt) {
  const S = karte_S; if (!S.ready || !state.started) return; S.t -= dt; if (S.t > 0) return; S.t = .5;
  const P = player.pos, b = karte_blattAn(P.x, P.z); if (!b) return; const innen = typeof indoorRects !== 'undefined' && indoorRects.some(r => P.x > r.x0 && P.x < r.x1 && P.z > r.zb && P.z < r.zf);
  karte_aufdecken(b, P.x, P.z, innen ? Math.min(b.r, 7) : b.r);
}
// ---------------------------------------------------------------------  Bleistift
function karte_linie(x, R, pts, o = {}) { // pts in Bildpunkten; zwei Züge, leichter Bogen, Überstand an den Ecken (Skizzenstrich)
  const w = o.w || 2.2, a = o.a ?? .78, col = o.col || '42,40,46', P = o.zu ? pts.concat([pts[0]]) : pts, os = o.ueber ?? 2.5;
  for (let pass = 0; pass < (o.zuege || 2); pass++) {
    x.beginPath(); x.lineWidth = pass ? w * .6 : w; x.strokeStyle = `rgba(${col},${pass ? a * .42 : a})`; const j = pass ? 1.3 : .5;
    for (let i = 0; i < P.length - 1; i++) { const [ax, ay] = P[i], [bx, by] = P[i + 1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); if (L < .3) continue;
      const ux = dx / L, uy = dy / L, e = Math.min(os, L * .15) * R(), f = Math.min(os, L * .15) * R(), bow = (R() - .5) * Math.min(L * .025, 2.4);
      x.moveTo(ax - ux * e + (R() - .5) * j, ay - uy * e + (R() - .5) * j); x.quadraticCurveTo((ax + bx) / 2 - uy * bow, (ay + by) / 2 + ux * bow, bx + ux * f + (R() - .5) * j, by + uy * f + (R() - .5) * j); }
    x.stroke(); }
}
function karte_poly(x, pts) { x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.closePath(); }
function karte_schraff(x, R, pts, o = {}) { // Schraffur in einer Fläche: parallele, leicht zitternde Striche
  let mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9; for (const [px, py] of pts) { mnx = Math.min(mnx, px); mny = Math.min(mny, py); mxx = Math.max(mxx, px); mxy = Math.max(mxy, py); }
  x.save(); karte_poly(x, pts); x.clip(); const d = o.d || 6, ang = o.ang ?? -.8, ca = Math.cos(ang), sa = Math.sin(ang), cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, rad = Math.hypot(mxx - mnx, mxy - mny) / 2 + 4;
  x.lineWidth = o.w || 1.3; x.strokeStyle = `rgba(${o.col || '42,40,46'},${o.a ?? .32})`; x.beginPath();
  for (let t = -rad; t <= rad; t += d * (.8 + R() * .4)) { const px = cx - sa * t, py = cy + ca * t, s0 = -rad * (.86 + R() * .14), s1 = rad * (.86 + R() * .14);
    x.moveTo(px + ca * s0, py + sa * s0); x.lineTo(px + ca * s1 + (R() - .5) * 1.5, py + sa * s1 + (R() - .5) * 1.5); }
  x.stroke(); if (o.kreuz) { o.kreuz = 0; karte_schraff(x, R, pts, { ...o, ang: ang + 1.35, a: (o.a ?? .32) * .8 }); } x.restore();
}
function karte_baum(x, R, cx, cy, r, o = {}) { // Krone als Wolkenlinie, Schatten unten rechts, Stamm als Punkt
  const n = Math.max(6, Math.min(17, Math.round(r / 2.6) + 5)), rot = R() * 6.28, pts = [];
  for (let i = 0; i < n; i++) { const a = rot + i / n * 6.283; pts.push([cx + Math.cos(a) * r * (.84 + R() * .12), cy + Math.sin(a) * r * (.84 + R() * .12), a]); }
  x.beginPath(); pts.forEach((p, i) => { const q = pts[(i + 1) % n], am = (p[2] + (i + 1 === n ? q[2] + 6.283 : q[2])) / 2, rr = r * (1.12 + R() * .14);
    if (!i) x.moveTo(p[0], p[1]); x.quadraticCurveTo(cx + Math.cos(am) * rr, cy + Math.sin(am) * rr, q[0], q[1]); }); x.closePath();
  x.fillStyle = o.fuell || 'rgba(236,228,206,.5)'; x.fill(); x.lineWidth = o.w || 1.6; x.strokeStyle = `rgba(42,40,46,${o.a ?? .7})`; x.stroke();
  x.lineWidth = 1.1; x.strokeStyle = `rgba(42,40,46,${(o.a ?? .7) * .42})`; x.beginPath(); // Schatten unten rechts: kurze Striche innerhalb der Krone
  for (let a = .15; a < 1.75; a += .22) { const ca = Math.cos(a), sa = Math.sin(a), r0 = r * (.35 + R() * .15), r1 = r * .86; x.moveTo(cx + ca * r0 - sa * 2, cy + sa * r0 + ca * 2); x.lineTo(cx + ca * r1, cy + sa * r1); } x.stroke();
  if (r > 5) { x.fillStyle = 'rgba(42,40,46,.7)'; x.beginPath(); x.arc(cx + (R() - .5) * 1.5, cy + (R() - .5) * 1.5, Math.max(1.3, r * .08), 0, 7); x.fill(); }
}
function karte_hand(x, text, px, py, size, o = {}) { // Lukes Handschrift (Caveat), Bleistift; o.rot, o.col, o.align
  x.save(); x.translate(px, py); x.rotate(o.rot || 0); x.font = `${o.fett ? '700 ' : ''}${size}px Caveat, "Segoe Print", cursive`; x.textAlign = o.align || 'center'; x.textBaseline = 'middle';
  if (o.halo !== false) { x.lineWidth = size * .22; x.strokeStyle = o.halo || 'rgba(232,224,202,.85)'; x.lineJoin = 'round'; x.strokeText(text, 0, 0); }
  x.fillStyle = o.col || 'rgba(44,42,50,.88)'; x.fillText(text, 0, 0); if (o.nach) { x.globalAlpha = .35; x.fillText(text, .8, .5); } x.restore();
}
// ---------------------------------------------------------------------  Weltdaten → Tinte (einmal je Blatt und Kapitel)
function karte_huelle(P) { P.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up); }
function karte_fuss(geo, mw) { // Grundriss eines Körpers: Hülle der 8 Ecken seines Quaders, dazu die beiden waagerechten Kantenlängen
  if (!geo.boundingBox) geo.computeBoundingBox(); const bb = geo.boundingBox, e = mw.elements, P = [];
  for (let i = 0; i < 8; i++) { const lx = i & 1 ? bb.max.x : bb.min.x, ly = i & 2 ? bb.max.y : bb.min.y, lz = i & 4 ? bb.max.z : bb.min.z;
    P.push([e[0] * lx + e[4] * ly + e[8] * lz + e[12], e[2] * lx + e[6] * ly + e[10] * lz + e[14]]); }
  const ax = [[e[0], e[1], e[2], bb.max.x - bb.min.x], [e[4], e[5], e[6], bb.max.y - bb.min.y], [e[8], e[9], e[10], bb.max.z - bb.min.z]].map(([a, b, c, l]) => ({ h: Math.hypot(a, c) * l, v: Math.abs(b) / (Math.hypot(a, b, c) || 1) }));
  ax.sort((p, q) => p.v - q.v); return { hull: karte_huelle(P), l1: Math.max(ax[0].h, ax[1].h), l2: Math.min(ax[0].h, ax[1].h) };
}
function karte_texKey() { const m = new Map(); try { for (const [k, t] of MSL.cache) if (t && t.source) m.set(t.source, k); } catch (e) {} return m; }
function karte_flaechenArt(m, tk) {
  if (m === M.asphalt) return 'strasse'; if (m === M.sidewalk) return 'weg'; if (m === M.grass || m === M.floor) return null;
  const n = ((m.name || '') + ' ' + (m.map && m.map.source && tk.get(m.map.source) || '')).toLowerCase();
  if (/lawn|grass|floor|planks|carpet|wallpaper|tile_bath/.test(n)) return null;
  if (/asphalt|road/.test(n)) return 'strasse'; if (/sidewalk|pavement|paving|cobble|curb|concrete|slab/.test(n)) return 'weg';
  if (/gravel|soil|dirt|mud|path|trampled|harvest|forest|leaves|sand|earth|moss/.test(n)) return 'pfad'; return 'flaeche';
}
function karte_sammeln(b) { // alles, was im Blatt liegt, als einfache Formen (Weltmeter)
  const T = THREE, D = { flach: { strasse: [], weg: [], pfad: [], flaeche: [] }, koerper: [], haeuser: [] }, tk = karte_texKey(), bb = new T.Box3(), sz = new T.Vector3(), innen = typeof indoorRects !== 'undefined' ? indoorRects : [];
  const stack = [scene]; while (stack.length) { const o = stack.pop(); if (o.userData.noCol && o !== scene) continue; for (const c of o.children) stack.push(c); if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh) continue;
    const m = Array.isArray(o.material) ? o.material[0] : o.material; if (!m || m.visible === false || m.transparent || m.isMeshBasicMaterial || m.blending === T.AdditiveBlending || m.isShaderMaterial) continue;
    const g = o.geometry; if (!g || !g.attributes.position) continue; if (!g.boundingBox) g.computeBoundingBox(); bb.copy(g.boundingBox).applyMatrix4(o.matrixWorld); bb.getSize(sz);
    if (sz.y > .3 || Math.max(sz.x, sz.z) < 1.2 || Math.max(sz.x, sz.z) > 175 || bb.min.y < -.3 || bb.max.y > .7) continue; if (bb.max.x < b.x0 || bb.min.x > b.x1 || bb.max.z < b.z0 || bb.min.z > b.z1) continue;
    const art = karte_flaechenArt(m, tk); if (!art) continue; const f = karte_fuss(g, o.matrixWorld); D.flach[art].push(f.hull); }
  const H = (typeof HOUSES !== 'undefined' ? HOUSES : []).filter(h => h.o && h.o.x !== undefined && karte_drin(b, h.o.x, h.o.z)).map(h => ({ ...h.o, w: h.o.w ?? 11, d: h.o.d ?? 9, facing: h.o.facing ?? 1 }));
  D.haeuser = H; const inHaus = (x, z) => H.find(h => Math.abs(x - h.x) < h.w / 2 + .2 && Math.abs(z - h.z) < h.d / 2 + .2);
  if (typeof SOL !== 'undefined') for (const it of SOL.items) { const q = it.bb; if (q.max.x < b.x0 || q.min.x > b.x1 || q.max.z < b.z0 || q.min.z > b.z1) continue; let frei = true; for (let p = it.o; p; p = p.parent) if (p.userData.noCol) { frei = false; break; } if (!frei) continue; // ferne Regionen sind unsichtbar geschaltet – gezeichnet wird trotzdem
    const cx = (q.min.x + q.max.x) / 2, cz = (q.min.z + q.max.z) / 2, h = q.max.y - q.min.y; let name = it.o.name || ''; for (let p = it.o.parent; p && !name; p = p.parent) name = p.name || '';
    if (/io_merged|^ow_(junk|station|block|farm|allot|villa|eroad|wroad)|merged/i.test(name) && Math.max(q.max.x - q.min.x, q.max.z - q.min.z) > 4) { D.koerper.push({ art: 'haufen', it, cx, cz }); continue; }
    const hs = inHaus(cx, cz); const ir = innen.find(r => cx > r.x0 && cx < r.x1 && cz > r.zb && cz < r.zf);
    if (hs && !ir) continue; // Körper des Hauses selbst (Dach, Wände) zeichnet das Haus
    if (q.min.y > (ir ? 1.9 : 1.6) && !it.soft) continue; // Dächer, Lampenköpfe, Überhänge
    const f = karte_fuss(it.o.geometry, it.mw); let art;
    let gruen = false; for (let p = it.o; p; p = p.parent) if (p.name === 'gruen' || p.name === 'wald') { gruen = true; break; }
    if (gruen && f.l2 < .5 && f.l1 > 1.1) art = 'zaun';
    else if (gruen && f.l1 > 2.2 && f.l1 / Math.max(f.l2, .1) > 2.2) art = 'hecke';
    else if ((it.inst || !name) && h > (it.inst ? 2.2 : 3) && f.l1 > .8 && f.l1 < 9.5 && f.l2 / f.l1 > .45) art = 'baum'; // instanzierte hohe Körper sind Bäume (Straßen-, Garten-, Grenzbäume)
    else if (it.soft || gruen || /tree|bush|shrub|fern|plant|hedge|ivy|leaf|foliage|conifer|pine|birch|oak|baum|busch/i.test(name)) art = f.l1 > 1.3 ? 'baum' : 'kraut';
    else if (/car|vehicle|truck|van|tractor|bus\b|wagen/i.test(name)) art = 'auto';
    else if (f.l2 < .5 && f.l1 > 1.1) art = h > 1.9 ? 'wand' : 'zaun';
    else if (f.l1 * f.l2 > 22 && h > 2.3) art = 'bau';
    else if (Math.max(f.l1, f.l2) < .22 || f.l1 > 10) continue; else art = 'ding'; // zusammengeführte Riesenhüllen nicht als Kasten zeichnen
    D.koerper.push({ art, hull: f.hull, cx, cz, r: f.l1 / 2, l1: f.l1, l2: f.l2, h, innen: !!ir, name, soft: it.soft, inst: it.inst }); }
  return D;
}
function karte_tinte(b) { // Blatt zeichnen: Bodenflächen (Vereinigung + Kontur), Körper, Häuser, Laternen, Wege
  const t0 = performance.now(), D = karte_sammeln(b), tS = performance.now(), s = b.s, W = Math.ceil((b.x1 - b.x0) * s), Hh = Math.ceil((b.z1 - b.z0) * s), R = karte_rng(b.id.length * 7777 + 13);
  const X = x => (b.x1 - x) * s, Y = z => (b.z1 - z) * s, pt = p => [X(p[0]), Y(p[1])]; // Blick von oben, Norden (Wald) oben – nicht gespiegelt zur Laufrichtung
  const c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d', KARTE_CPU);
  const tmp = document.createElement('canvas'); tmp.width = W; tmp.height = Hh; const tx = tmp.getContext('2d', KARTE_CPU);
  { x.strokeStyle = 'rgba(42,40,46,.32)'; x.lineWidth = 1; x.beginPath(); const n = W * Hh / (b.id === 'wald' ? 2600 : 5200);
    for (let i = 0; i < n; i++) { const px = R() * W, py = R() * Hh, r = 3 + R() * 3; for (let k = -1; k <= 1; k++) { x.moveTo(px + k * r * .5, py); x.lineTo(px + k * r * .9 + (R() - .5) * 1.5, py - r * (.8 + R() * .5)); } } x.stroke(); }
  // 1) Bodenflächen: Maske je Art, Kontur über Verschieben (verbundene Straßen ohne Nähte), Füllung als Punkte/Kies
  const flach = (liste, o) => { if (!liste.length) return; tx.clearRect(0, 0, W, Hh); tx.globalCompositeOperation = 'source-over'; tx.fillStyle = '#000'; for (const h of liste) { karte_poly(tx, h.map(pt)); tx.fill(); }
    const mask = document.createElement('canvas'); mask.width = W; mask.height = Hh; mask.getContext('2d', KARTE_CPU).drawImage(tmp, 0, 0); karte_S.tmpM = mask;
    if (o.fuell) { tx.globalCompositeOperation = 'source-in'; tx.fillStyle = o.fuell; tx.fillRect(0, 0, W, Hh); tx.globalCompositeOperation = 'source-over'; x.drawImage(tmp, 0, 0); }
    if (o.punkte) { tx.clearRect(0, 0, W, Hh); tx.fillStyle = tx.createPattern(karte_korn(1.6 / (o.dichte || 260) * 42, `rgba(42,40,46,${o.punkte})`, o.dichte), 'repeat'); tx.fillRect(0, 0, W, Hh);
      tx.globalCompositeOperation = 'destination-in'; tx.drawImage(mask, 0, 0); tx.globalCompositeOperation = 'source-over'; x.drawImage(tmp, 0, 0); }
    if (o.rand) { tx.clearRect(0, 0, W, Hh); const d = o.rand; for (let k = 0; k < 8; k++) { const a = k / 8 * 6.283; tx.drawImage(mask, Math.cos(a) * d, Math.sin(a) * d); }
      tx.globalCompositeOperation = 'source-in'; tx.fillStyle = `rgba(42,40,46,${o.ra || .8})`; tx.fillRect(0, 0, W, Hh); tx.globalCompositeOperation = 'destination-out'; tx.drawImage(mask, 0, 0);
      tx.globalCompositeOperation = 'source-over'; x.drawImage(tmp, 0, 0); } mask.width = mask.height = 0; };
  flach(D.flach.flaeche, { punkte: .16, dichte: 520, rand: 1.2, ra: .32 });
  flach(D.flach.pfad, { punkte: .2, dichte: 220 });
  flach(D.flach.weg, { fuell: 'rgba(232,225,205,.9)', rand: 1.3, ra: .55 });
  flach(D.flach.strasse, { fuell: 'rgba(214,208,192,.95)', punkte: .12, dichte: 900, rand: 1.9, ra: .85 });
  // Waldwege (Polylinien der Module) als gestrichelte Doppellinie
  const wege = b.id === 'wald' ? [].concat(typeof WALD_PATHS !== 'undefined' ? WALD_PATHS : [], typeof TIEF_PATHS !== 'undefined' ? TIEF_PATHS : []) : [];
  for (const wg of wege) { const P = wg.map(pt); for (const off of [-1, 1]) { x.save(); x.setLineDash([9, 7]); karte_linie(x, R, P.map((p, i) => { const q = P[Math.min(i + 1, P.length - 1)], o2 = P[Math.max(i - 1, 0)], dx = q[0] - o2[0], dy = q[1] - o2[1], L = Math.hypot(dx, dy) || 1; return [p[0] - dy / L * off * 1.1 * s, p[1] + dx / L * off * 1.1 * s]; }), { w: 1.5, a: .55, zuege: 1 }); x.restore(); } }
  if (b.id === 'wald' && typeof TIEF !== 'undefined' && TIEF.pond) { const p = TIEF.pond, cx = X(p.x), cy = Y(p.z); x.save(); x.beginPath(); x.ellipse(cx, cy, p.rx * s, p.rz * s, .1, 0, 7); x.fillStyle = 'rgba(220,214,198,.9)'; x.fill(); x.clip();
    x.strokeStyle = 'rgba(42,40,46,.35)'; x.lineWidth = 1.2; for (let yy = cy - p.rz * s; yy < cy + p.rz * s; yy += 7) { x.beginPath(); for (let xx = cx - p.rx * s; xx < cx + p.rx * s; xx += 6) x.lineTo(xx, yy + Math.sin(xx * .15 + yy) * 1.6); x.stroke(); } x.restore();
    karte_linie(x, R, Array.from({ length: 28 }, (_, i) => [cx + Math.cos(i / 28 * 6.283) * p.rx * s, cy + Math.sin(i / 28 * 6.283) * p.rz * s]), { zu: 1, w: 2, a: .75, ueber: 0 }); }
  const tF = performance.now();
  // 2) Körper: Kraut, Bäume, Zäune, Dinge, Autos, Haufen, Bauten (Bauten zuletzt, damit sie verdecken)
  const K = D.koerper, nach = a => K.filter(k => k.art === a);
  x.strokeStyle = 'rgba(42,40,46,.45)'; x.lineWidth = 1.1; x.beginPath(); for (const k of nach('kraut')) { const cx = X(k.cx), cy = Y(k.cz), r = Math.max(2.2, k.r * s * .7); for (let i = -1; i <= 1; i++) { x.moveTo(cx + i * r * .55, cy + r * .4); x.lineTo(cx + i * r * .75 + (R() - .5), cy - r * .5); } } x.stroke();
  for (const k of nach('haufen')) { const e = k.it.mw.elements, pos = k.it.o.geometry.attributes.position, n = pos.count, step = Math.max(1, Math.floor(n / 2600)); x.fillStyle = 'rgba(42,40,46,.2)';
    for (let i = 0; i < n; i += step) { const lx = pos.getX(i), ly = pos.getY(i), lz = pos.getZ(i), wx = e[0] * lx + e[4] * ly + e[8] * lz + e[12], wy = e[1] * lx + e[5] * ly + e[9] * lz + e[13], wz = e[2] * lx + e[6] * ly + e[10] * lz + e[14]; if (wy > 3) continue; x.fillRect(X(wx) - .9, Y(wz) - .9, 1.8, 1.8); } }
  for (const k of nach('ding')) { const P = k.hull.map(pt); karte_poly(x, P); x.fillStyle = 'rgba(236,229,209,.55)'; x.fill(); karte_linie(x, R, P, { zu: 1, w: k.innen ? 1.3 : 1.2, a: k.innen ? .62 : .5, zuege: 1, ueber: 1 }); }
  for (const k of nach('zaun')) { const P = k.hull.map(pt); let a = P[0], bb2 = P[0], d = 0; for (const p of P) for (const q of P) { const dd = Math.hypot(p[0] - q[0], p[1] - q[1]); if (dd > d) { d = dd; a = p; bb2 = q; } }
    karte_linie(x, R, [a, bb2], { w: 1.5, a: .7 }); const n = Math.max(1, Math.round(d / (1.6 * s))); x.beginPath(); x.lineWidth = 1.2; x.strokeStyle = 'rgba(42,40,46,.6)';
    for (let i = 0; i <= n; i++) { const t = i / n, px = a[0] + (bb2[0] - a[0]) * t, py = a[1] + (bb2[1] - a[1]) * t, ux = (bb2[0] - a[0]) / d, uy = (bb2[1] - a[1]) / d; x.moveTo(px - uy * 3, py + ux * 3); x.lineTo(px + uy * 3, py - ux * 3); } x.stroke(); }
  for (const k of nach('wand')) { const P = k.hull.map(pt); karte_poly(x, P); x.fillStyle = 'rgba(46,43,48,.78)'; x.fill(); karte_linie(x, R, P, { zu: 1, w: 1.4, a: .7, zuege: 1, ueber: 1.5 }); }
  for (const k of nach('auto')) { const P = k.hull.map(pt); karte_poly(x, P); x.fillStyle = 'rgba(232,225,205,.8)'; x.fill(); karte_linie(x, R, P, { zu: 1, w: 1.6, a: .72, ueber: 1.5 }); karte_schraff(x, R, P, { d: 3.6, a: .28, ang: .6 }); }
  for (const k of nach('hecke')) { const P = k.hull.map(pt), Q = []; for (let i = 0; i < P.length; i++) { const a = P[i], c2 = P[(i + 1) % P.length], L = Math.hypot(c2[0] - a[0], c2[1] - a[1]) || 1, n2 = Math.max(1, Math.round(L / 7));
      for (let j = 0; j < n2; j++) { const t = j / n2, ux = (c2[0] - a[0]) / L, uy = (c2[1] - a[1]) / L, bump = (j % 2 ? 2.2 : -.4) + R() * 1.2; Q.push([a[0] + (c2[0] - a[0]) * t + uy * bump, a[1] + (c2[1] - a[1]) * t - ux * bump]); } }
    karte_poly(x, Q); x.fillStyle = 'rgba(232,225,205,.7)'; x.fill(); karte_schraff(x, R, Q, { d: 3.2, a: .22, ang: .9 }); karte_linie(x, R, Q, { zu: 1, w: 1.4, a: .62, zuege: 1, ueber: 0 }); }
  const schatten = P => { const S2 = P.map(p => [p[0] + 7, p[1] + 9]); karte_schraff(x, R, karte_huelle(P.concat(S2)), { d: 3, a: .3, ang: .7, w: 1 }); };
  for (const k of nach('bau')) schatten(k.hull.map(pt));
  for (const h of D.haeuser) schatten([[h.x - h.w / 2, h.z - h.d / 2], [h.x + h.w / 2, h.z - h.d / 2], [h.x + h.w / 2, h.z + h.d / 2], [h.x - h.w / 2, h.z + h.d / 2]].map(pt));
  const baeume = nach('baum').sort((p, q) => q.cz - p.cz); for (const k of baeume) karte_baum(x, R, X(k.cx), Y(k.cz), Math.max(3, Math.min(k.r, 7) * s * .9), { a: b.id === 'wald' ? .62 : .72 });
  for (const k of nach('bau')) { const P = k.hull.map(pt); karte_poly(x, P); x.fillStyle = 'rgba(234,227,207,.96)'; x.fill(); karte_schraff(x, R, P, { d: 5.5, a: .3, ang: -.75, kreuz: k.h > 7 });
    karte_linie(x, R, P, { zu: 1, w: 2.6, a: .85, ueber: 4 }); }
  const tK = performance.now();
  // 3) Häuser aus HOUSES: Grundriss, First, halbes Dach schraffiert, Tür; begehbare (hohle) Häuser als Grundriss mit Innenwänden
  for (const h of D.haeuser) { const hw = h.w / 2, hd = h.d / 2, P = [[h.x - hw, h.z - hd], [h.x + hw, h.z - hd], [h.x + hw, h.z + hd], [h.x - hw, h.z + hd]].map(pt);
    x.save(); karte_poly(x, P); x.fillStyle = h.hollow ? 'rgba(236,229,210,.35)' : 'rgba(236,229,210,.97)'; x.fill(); x.restore();
    if (!h.hollow) { const hx = [[h.x, h.z - hd], [h.x - hw, h.z - hd], [h.x - hw, h.z + hd], [h.x, h.z + hd]].map(pt); karte_schraff(x, R, hx, { d: 4.2, a: .34, ang: Math.PI / 2 + (R() - .5) * .06 });
      karte_linie(x, R, [pt([h.x, h.z - hd - .3]), pt([h.x, h.z + hd + .3])], { w: 1.8, a: .8 });
      if (h.chimney) { const cx = h.x + h.w * .28 * (h.facing > 0 ? 1 : -1), cz = h.z - h.d * .2 * (h.facing > 0 ? 1 : -1); const Q = [[cx - .45, cz - .45], [cx + .45, cz - .45], [cx + .45, cz + .45], [cx - .45, cz + .45]].map(pt); karte_poly(x, Q); x.fillStyle = 'rgba(46,43,48,.6)'; x.fill(); } }
    karte_linie(x, R, P, { zu: 1, w: 2.8, a: .88, ueber: 5 });
    const dz = h.z + h.facing * (hd + .05), dx = h.x + (h.doorX !== undefined && h.hollow ? h.doorX - h.x : (h.facing > 0 ? 1 : -1) * (h.doorX ?? 0)); const d0 = pt([dx - .6, dz]), d1 = pt([dx + .6, dz]);
    x.save(); x.strokeStyle = 'rgba(236,229,210,1)'; x.lineWidth = 4; x.beginPath(); x.moveTo(d0[0], d0[1]); x.lineTo(d1[0], d1[1]); x.stroke(); x.restore();
    x.beginPath(); x.strokeStyle = 'rgba(42,40,46,.6)'; x.lineWidth = 1.2; x.arc(d0[0], d0[1], 1.2 * s, h.facing > 0 ? Math.PI : 0, h.facing > 0 ? Math.PI * 1.5 : Math.PI * .5, false); x.stroke();
    if (h.garage) { const gx = h.x + h.garage * (hw + 2.2) * (h.facing > 0 ? 1 : -1), gz = h.z + (hd - 3.25) * (h.facing > 0 ? 1 : -1); const G = [[gx - 2.1, gz - 3.25], [gx + 2.1, gz - 3.25], [gx + 2.1, gz + 3.25], [gx - 2.1, gz + 3.25]].map(pt);
      karte_poly(x, G); x.fillStyle = 'rgba(234,227,207,.95)'; x.fill(); karte_schraff(x, R, G, { d: 4.8, a: .26, ang: .8 }); karte_linie(x, R, G, { zu: 1, w: 2, a: .8, ueber: 3 }); } }
  // Innenwände der begehbaren Häuser obenauf (die Hauswand hat die Innenfläche aufgehellt)
  for (const k of K) if (k.innen && (k.art === 'wand' || k.art === 'zaun')) { const P = k.hull.map(pt); karte_poly(x, P); x.fillStyle = 'rgba(46,43,48,.8)'; x.fill(); }
  // 4) Laternen: Kreis mit Strahlen (die Laternen zählen in dieser Geschichte)
  if (typeof lamps !== 'undefined') for (const L of lamps) { const p = L.g ? L.g.position : L.position; if (!p || !karte_drin(b, p.x, p.z)) continue; const cx = X(p.x), cy = Y(p.z);
    x.beginPath(); x.arc(cx, cy, 3.4, 0, 7); x.fillStyle = 'rgba(236,229,210,1)'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = 'rgba(42,40,46,.85)'; x.stroke();
    x.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283 + .3; x.moveTo(cx + Math.cos(a) * 5.5, cy + Math.sin(a) * 5.5); x.lineTo(cx + Math.cos(a) * 8.5, cy + Math.sin(a) * 8.5); } x.lineWidth = 1; x.stroke(); }
  // Körnung: Graphit ist nie ganz geschlossen
  x.save(); x.globalCompositeOperation = 'destination-out'; x.globalAlpha = .28; x.fillStyle = x.createPattern(karte_korn(.017, '#000', 11), 'repeat'); x.fillRect(0, 0, W, Hh); x.restore();
  tmp.width = tmp.height = 0; karte_S.ms = Math.round(performance.now() - t0); karte_S.prof = { daten: Math.round(tS - t0), boden: Math.round(tF - tS), koerper: Math.round(tK - tF), n: D.koerper.length }; return c;
}
// ---------------------------------------------------------------------  Papier (einmal je Blatt): Karopapier, Knicke, Kaffeefleck, Klebeband, Kopf in Lukes Hand
function karte_papier(b, W, Hh) {
  const PW = W + KARTE_PAD * 2, PH = Hh + KARTE_PAD * 2, c = document.createElement('canvas'); c.width = PW; c.height = PH; const x = c.getContext('2d', KARTE_CPU), R = karte_rng(b.id.charCodeAt(0) * 911 + 3);
  const E = []; const n = 60; for (let i = 0; i <= n; i++) E.push([18 + (PW - 36) * i / n, 16 + R() * 6]); for (let i = 0; i <= n; i++) E.push([PW - 18 - R() * 6, 18 + (PH - 36) * i / n]);
  for (let i = n; i >= 0; i--) E.push([18 + (PW - 36) * i / n, PH - 16 - R() * 7]); for (let i = n; i >= 0; i--) E.push([16 + R() * 5, 18 + (PH - 36) * i / n]);
  x.save(); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 26; x.shadowOffsetY = 10; karte_poly(x, E); x.fillStyle = b.id === 'wald' ? '#ddd0b0' : '#e6dcc2'; x.fill(); x.restore();
  x.save(); karte_poly(x, E); x.clip();
  // Papier: echter Megascans-Scan („Dirty Papers“: Faser, Knitter, Altersflecken) statt Verlauf; nur der Randton (Vergilbung) bleibt als Hauch darüber
  papierScan(x, PW, PH, b.id === 'wald' ? '#dccfae' : '#e8dfc6', { dreck: .55 });
  let g = x.createRadialGradient(PW * .5, PH * .46, PW * .28, PW / 2, PH / 2, PW * .78); g.addColorStop(0, 'rgba(185,164,123,0)'); g.addColorStop(1, 'rgba(150,124,80,.5)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  // Karo (5 mm), blass blau, wie in einem Schulheft
  const k = 34; x.lineWidth = 1; x.strokeStyle = 'rgba(80,110,160,.17)'; x.beginPath(); for (let px = 24 + R() * k; px < PW; px += k) { x.moveTo(px, 0); x.lineTo(px + 2, PH); } for (let py = 20 + R() * k; py < PH; py += k) { x.moveTo(0, py); x.lineTo(PW, py + 1.5); } x.stroke();
  if (typeof echt_fleck === 'function') for (let i = 0; i < 3; i++) echt_fleck(x, R() * PW, R() * PH, PW * (.18 + R() * .25), 'rgb(120,92,52)', .1 + R() * .12, R() * 6.28); // Wasserränder aus dem Feuchtescan
  // Knicke (einmal längs, einmal quer gefaltet): heller Grat, dunkle Kehle, abgeriebenes Karo
  for (const [ax, ay, bx, by] of [[PW * .5 + (R() - .5) * 20, 0, PW * .5 + (R() - .5) * 20, PH], [0, PH * .5 + (R() - .5) * 16, PW, PH * .5 + (R() - .5) * 16]]) {
    const vx = bx - ax, vy = by - ay, L = Math.hypot(vx, vy), nx = -vy / L, ny = vx / L; g = x.createLinearGradient(ax - nx * 26, ay - ny * 26, ax + nx * 26, ay + ny * 26);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.46, 'rgba(90,65,35,.13)'); g.addColorStop(.5, 'rgba(60,40,20,.22)'); g.addColorStop(.53, 'rgba(255,250,235,.35)'); g.addColorStop(1, 'rgba(255,250,235,0)'); x.fillStyle = g;
    x.save(); x.beginPath(); x.moveTo(ax - nx * 26, ay - ny * 26); x.lineTo(bx - nx * 26, by - ny * 26); x.lineTo(bx + nx * 26, by + ny * 26); x.lineTo(ax + nx * 26, ay + ny * 26); x.closePath(); x.fill(); x.restore(); }
  // Kaffeefleck (Ring mit Trockenrand, ein zweiter halber daneben)
  const kf = (cx, cy, r, a0, a1, al) => { x.save(); x.beginPath(); for (let i = 0; i <= 60; i++) { const a = a0 + (a1 - a0) * i / 60, rr = r * (1 + Math.sin(a * 5 + cx) * .025 + (R() - .5) * .02); i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.lineWidth = 9; x.strokeStyle = `rgba(120,72,28,${al * .35})`; x.filter = 'blur(2px)'; x.stroke(); x.filter = 'none'; x.lineWidth = 2.2; x.strokeStyle = `rgba(100,58,20,${al})`; x.stroke(); x.restore(); };
  const kx = PW * (.12 + R() * .1), ky = PH * (.72 + R() * .12); x.save(); g = x.createRadialGradient(kx, ky, 10, kx, ky, 105); g.addColorStop(0, 'rgba(140,90,40,.1)'); g.addColorStop(.9, 'rgba(130,80,35,.16)'); g.addColorStop(1, 'rgba(130,80,35,0)'); x.fillStyle = g; x.beginPath(); x.arc(kx, ky, 105, 0, 7); x.fill(); x.restore();
  kf(kx, ky, 100, 0, 6.2, .5); kf(kx + 120, ky - 40, 96, 2.2, 4.6, .32);
  // Randschatten, Vergilbung, Radierspuren
  g = x.createLinearGradient(0, 0, PW, 0); g.addColorStop(0, 'rgba(90,60,20,.2)'); g.addColorStop(.05, 'rgba(90,60,20,0)'); g.addColorStop(.95, 'rgba(90,60,20,0)'); g.addColorStop(1, 'rgba(90,60,20,.24)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  g = x.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, 'rgba(90,60,20,.16)'); g.addColorStop(.06, 'rgba(90,60,20,0)'); g.addColorStop(.94, 'rgba(90,60,20,0)'); g.addColorStop(1, 'rgba(90,60,20,.2)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
  for (let i = 0; i < 5; i++) { const px = R() * PW, py = R() * PH; x.save(); x.translate(px, py); x.rotate(R() * 3); g = x.createRadialGradient(0, 0, 2, 0, 0, 60); g.addColorStop(0, 'rgba(70,65,70,.07)'); g.addColorStop(1, 'rgba(70,65,70,0)'); x.fillStyle = g; x.scale(2.2, .6); x.beginPath(); x.arc(0, 0, 60, 0, 7); x.fill(); x.restore(); }
  x.restore();
  // Klebeband an zwei Ecken
  for (const [cx, cy, r] of [[70, 44, -.6], [PW - 76, PH - 40, -.55]]) { x.save(); x.translate(cx, cy); x.rotate(r); x.fillStyle = 'rgba(236,228,196,.62)'; x.shadowColor = 'rgba(0,0,0,.18)'; x.shadowBlur = 3; x.beginPath(); x.moveTo(-70, -17); for (let i = 0; i <= 6; i++) x.lineTo(70 + (R() - .5) * 5, -17 + i * 34 / 6); x.lineTo(-70, 17); for (let i = 6; i >= 0; i--) x.lineTo(-70 + (R() - .5) * 5, -17 + i * 34 / 6); x.fill();
    x.strokeStyle = 'rgba(160,150,120,.25)'; x.lineWidth = 1; for (let i = -60; i < 70; i += 9) { x.beginPath(); x.moveTo(i, -16); x.lineTo(i + 3, 16); x.stroke(); } x.restore(); }
  return c;
}
// Bleistift haftet nur auf dem Zahn des Papiers: Tinte mit dem Kornscan (kreideKorn) maskiert, einmal je Blatt; darunter der unmaskierte Strich schwach (Graphit zieht ins Papier)
function karte_stiftKorn(id, ink) { const S = karte_S.stift || (karte_S.stift = {}); if (S[id] && S[id].k === ink) return S[id].c;
  const c = document.createElement('canvas'); c.width = ink.width; c.height = ink.height; const x = c.getContext('2d', KARTE_CPU); x.drawImage(ink, 0, 0);
  try { kreideKorn(x, c.width, c.height, 128); x.globalCompositeOperation = 'destination-over'; x.globalAlpha = .5; x.drawImage(ink, 0, 0); } catch (e) { x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.drawImage(ink, 0, 0); }
  S[id] = { k: ink, c }; return c; }
// ---------------------------------------------------------------------  Zusammensetzen (beim Öffnen und nach Änderungen – nie im Tick)
function karte_maske(b, W, Hh) { // Nebel: Raster weich hochskaliert, körnig ausgefranst
  const [gw, gh] = karte_S.dims[b.id], G = karte_S.g[b.id], sm = document.createElement('canvas'); sm.width = gw + 2; sm.height = gh + 2; const sx = sm.getContext('2d', KARTE_CPU), id = sx.createImageData(gw + 2, gh + 2);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) if (G[j * gw + i]) { const px = gw - 1 - i + 1, py = gh - 1 - j + 1, k = (py * (gw + 2) + px) * 4; id.data[k + 3] = 255; } // gespiegelt wie die Tinte
  sx.putImageData(id, 0, 0); const m = document.createElement('canvas'); m.width = W; m.height = Hh; const mx = m.getContext('2d', KARTE_CPU); mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = 'high';
  const cw = W / gw, ch = Hh / gh, md = document.createElement('canvas'); md.width = (gw + 2) * 4; md.height = (gh + 2) * 4; const dx = md.getContext('2d', KARTE_CPU); dx.imageSmoothingEnabled = true; dx.filter = 'blur(3px)'; dx.drawImage(sm, 0, 0, md.width, md.height);
  mx.drawImage(md, -cw, -ch, W + 2 * cw, Hh + 2 * ch);
  mx.globalCompositeOperation = 'destination-out'; mx.globalAlpha = .55; mx.fillStyle = mx.createPattern(karte_korn(.06, '#000', 99), 'repeat'); mx.fillRect(0, 0, W, Hh); mx.globalAlpha = 1; mx.globalCompositeOperation = 'source-over';
  return m;
}
function karte_welt2px(b, x, z) { return [(b.x1 - x) * b.s + KARTE_PAD, (b.z1 - z) * b.s + KARTE_PAD]; }
function karte_px2welt(b, px, py) { return [b.x1 - (px - KARTE_PAD) / b.s, b.z1 - (py - KARTE_PAD) / b.s]; }
function karte_comp(b) {
  const key = b.id + '|' + kap() + '|' + karte_S.m.length + '|' + JSON.stringify(karte_S.p).length + '|' + (settings.karteZiel !== false) + '|' + Math.round(player.pos.x) + ',' + Math.round(player.pos.z) + ',' + Math.round(player.yaw * 20) + '|' + (story.photos ? story.photos.size : 0) + '|' + karte_S.m.map(m => m[3]).join();
  if (karte_S.comp && karte_S.compKey === key) return karte_S.comp;
  if (!karte_S.ink[b.id] || karte_S.inkKap[b.id] !== kap()) { karte_S.ink[b.id] = karte_tinte(b); karte_S.inkKap[b.id] = kap(); }
  const ink = karte_S.ink[b.id], W = ink.width, Hh = ink.height; if (!karte_S.paper[b.id]) karte_S.paper[b.id] = karte_papier(b, W, Hh);
  const pap = karte_S.paper[b.id], c = karte_S.comp && karte_S.comp.width === pap.width && karte_S.comp.height === pap.height ? karte_S.comp : document.createElement('canvas'); c.width = pap.width; c.height = pap.height; const x = c.getContext('2d', KARTE_CPU);
  x.drawImage(pap, 0, 0);
  const t = document.createElement('canvas'); t.width = W; t.height = Hh; const tx = t.getContext('2d', KARTE_CPU); tx.drawImage(karte_maske(b, W, Hh), 0, 0); tx.globalCompositeOperation = 'source-in'; tx.drawImage(karte_stiftKorn(b.id, ink), 0, 0);
  x.save(); x.globalCompositeOperation = 'multiply'; x.drawImage(t, KARTE_PAD, KARTE_PAD); x.restore(); t.width = t.height = 0;
  karte_ueber(b, x); karte_S.comp = c; karte_S.compKey = key; return c;
}
// ---------------------------------------------------------------------  Beschriftung und Überlagerungen (nur Bekanntes)
function karte_orte(b) { // [x, z, Text, Größe, Drehung, Bedingung]
  if (b.id === 'dorf') { const L = [[-2, 1.2, 'Ahornstraße', 34, 0], [-6.5, 31, 'Kirchweg', 28, Math.PI / 2], [4, 7.5, 'Kreuzung', 26, -.08], [-52.5, 94, 'Kapelle', 30, .04], [-40, 72, 'Friedhof', 30, -.05],
      [31, 76.5, 'Spielplatz', 30, .06], [10, 57.8, 'Haltestelle', 24, 0], [-10.7, 50.6, 'Kreuz', 22, .1], [112, 32, 'Tankstelle', 32, -.04], [117, -21, 'Schrott', 28, .05], [150, 7.5, 'Sperre', 28, -.1], [0, -49.5, 'Sperre (Süd)', 26, .04],
      [-120, 31, 'Schrebergärten', 30, .03], [-127, -30.5, 'Hof', 32, -.05], [-125, 56, 'die alte Villa', 30, .04], [-72, 9.5, 'Ortsschild', 22, -.06], [30, 102.5, 'Nordzaun', 24, .02], [-2, 58.5, 'Am Kirchberg', 26, 0]];
    const nr = { '26,-17': '7', '-50,-17': '1' }, wer = { 1: 'wir', 3: 'Vegas', 4: 'Oma Erna', 7: 'Hilde', 8: 'Aydın', 2: 'Winter' };
    for (const h of (typeof HOUSES !== 'undefined' ? HOUSES : [])) { const o = h.o; if (!o || o.x === undefined) continue; const n = o.n ?? nr[o.x + ',' + o.z]; if (n === undefined) continue; L.push([o.x, o.z, (wer[n] ? n + ' · ' + wer[n] : 'Nr. ' + n), 22, (o.facing > 0 ? .02 : -.03)]); }
    return L; }
  if (b.id === 'wald') return [[4, 116, 'Lichtung', 28, .04], [58, 154.5, 'Zayns Hütte', 26, 0], [14, 183.5, 'Hochsitz', 28, -.05], [65, 205, 'der Bus', 26, .06], [51.5, 263, 'Weiher', 30, 0], [15, 232, 'Steinkreis', 26, -.04], [-8, 196, 'Wrack', 24, .03]];
  if (b.id === 'amt') { const L = []; if (typeof Z7 !== 'undefined') L.push([(Z7.x0 + Z7.x1) / 2, Z7.z1 + 1.5, 'Zimmer 7', 26, 0]); if (typeof C2 !== 'undefined') L.push([C2.x + 4, C2.z - 5, 'Treppe', 22, 0]); return L; }
  return [];
}
function karte_ueber(b, x) {
  const R = karte_rng(4242 + kap()), s = b.s, W2 = (px, pz) => karte_welt2px(b, px, pz), k = kap();
  // Kopf: Titel, Einwohnerzahl (ändert sich), Nordpfeil, Maßstab
  karte_hand(x, b.titel, 150, 96, 84, { align: 'left', rot: -.02, fett: true, halo: false, nach: true });
  x.save(); x.strokeStyle = 'rgba(44,42,50,.8)'; x.lineWidth = 2.2; x.beginPath(); x.moveTo(150, 136); x.bezierCurveTo(300, 128, 520, 140, 150 + b.titel.length * 40, 132); x.moveTo(170, 144); x.bezierCurveTo(320, 138, 500, 147, 140 + b.titel.length * 38, 141); x.stroke(); x.restore();
  if (b.id === 'dorf') { karte_hand(x, 'Einw. 214', 176, 180, 38, { align: 'left', halo: false }); x.save(); x.strokeStyle = 'rgba(150,30,25,.8)'; x.lineWidth = 2.4; x.beginPath(); x.moveTo(168, 183); x.lineTo(320, 176); x.stroke(); x.restore();
    karte_hand(x, '211', 338, 178, 42, { align: 'left', halo: false, col: 'rgba(150,30,25,.85)' });
    if (k >= 2) { x.save(); x.strokeStyle = 'rgba(44,42,50,.75)'; x.lineWidth = 2; x.beginPath(); x.moveTo(332, 183); x.lineTo(392, 173); x.stroke(); x.restore(); karte_hand(x, '210', 404, 181, 44, { align: 'left', halo: false, col: 'rgba(70,70,74,.9)', rot: .04 }); }
    if (k >= 5) { x.save(); x.strokeStyle = 'rgba(44,42,50,.55)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(468, 164); x.lineTo(474, 194); x.stroke(); x.restore(); } }
  const PW = x.canvas.width, PH = x.canvas.height; x.save(); x.translate(PW - 150, 150); x.rotate(.03); x.strokeStyle = 'rgba(44,42,50,.85)'; x.fillStyle = 'rgba(44,42,50,.8)'; x.lineWidth = 2.4;
  x.beginPath(); x.moveTo(0, 50); x.lineTo(0, -52); x.stroke(); x.beginPath(); x.moveTo(0, -60); x.lineTo(-13, -30); x.lineTo(0, -38); x.closePath(); x.fill(); x.beginPath(); x.moveTo(0, -60); x.lineTo(13, -30); x.lineTo(0, -38); x.stroke(); x.restore();
  karte_hand(x, 'N', PW - 150, 60, 42, { halo: false }); const sb = 50 * s, sy = PH - 70; x.save(); x.strokeStyle = 'rgba(44,42,50,.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(PW - 140 - sb, sy); x.lineTo(PW - 140, sy);
  for (let i = 0; i <= 5; i++) { const px = PW - 140 - sb + sb * i / 5; x.moveTo(px, sy - (i % 5 ? 5 : 10)); x.lineTo(px, sy + 3); } x.stroke(); x.restore(); karte_hand(x, '50 m', PW - 140 - sb / 2, sy - 26, 28, { halo: false });
  // Ortsnamen und Hausnummern in Lukes Schrift – nur, wo er schon war
  for (const [ox, oz, text, size, rot] of karte_orte(b)) { if (!karte_gesehen(b, ox, oz)) continue; const [px, py] = W2(ox, oz); karte_hand(x, text, px, py, size, { rot }); }
  // Hildes Kerzen (rote Tinte) an gefundenen Polaroids
  if (b.id === 'dorf' && typeof PHOTOS !== 'undefined' && story.photos) PHOTOS.forEach((P, i) => { if (!story.photos.has(i) || !P.candle) return; const [px, py] = W2(P.candle[0], P.candle[2]); karte_kerze(x, px, py, R); });
  // Lucys blaue Kreispfeile (Kap. 1): Briefkasten Nr. 7 → Ahornstraße → Kirchweg → Haltestelle, gegen die weißen Kinderpfeile
  if (b.id === 'dorf' && k === 1) { const W = [[28.4, -5.2], [16, -4.2], [3, -3.8], [-6.6, 4], [-6.8, 16], [-6.9, 28], [-6.8, 40], [-5, 51], [4, 55]];
    for (let i = 0; i < W.length - 1; i++) { const [ax, az] = W[i], [bx, bz] = W[i + 1]; if (!karte_gesehen(b, ax, az)) continue; const [p0x, p0y] = W2(ax, az), [p1x, p1y] = W2(bx, bz); karte_kreispfeil(x, p0x, p0y, p1x, p1y, R); } }
  // ∴ an gefundenen Beobachter-Zetteln (nicht Lukes Hand: gedrückt, dreieckig, dunkel)
  if (typeof BEOB_ORTE !== 'undefined' && typeof beob_S !== 'undefined' && beob_S.found) for (const o of BEOB_ORTE) { if (!beob_S.found.has(o.id) || !karte_drin(b, o.x, o.z)) continue; const [px, py] = W2(o.x, o.z);
    x.fillStyle = 'rgba(28,26,34,.9)'; for (const [dx, dy] of [[0, -7], [-7, 5], [7, 5]]) { x.beginPath(); x.arc(px + dx + 16, py + dy - 14, 3.6, 0, 7); x.fill(); } }
  // Lunas weiße Kreide „ICH KOMME“ quer übers Dorf (ab Kap. 3; war vorher nicht da, niemand hat sie hingeschrieben)
  if (b.id === 'dorf' && k >= 3) karte_kreide(x, b, R);
  // Wald: die leeren Stellen – Luke hat angesetzt und nicht weitergezeichnet
  if (b.id === 'wald') for (const L of KARTE_LEER) { let nah = false; for (let a = 0; a < 6.28; a += .5) if (karte_gesehen(b, L.x + Math.cos(a) * (L.r + 3), L.z + Math.sin(a) * (L.r + 3))) nah = true; if (!nah) continue;
    const [px, py] = W2(L.x, L.z); x.save(); x.strokeStyle = 'rgba(44,42,50,.45)'; x.lineWidth = 1.4; x.setLineDash([3, 8]); x.beginPath(); x.arc(px, py, L.r * s * .8, 0, 5.1); x.stroke(); x.restore(); karte_hand(x, '?', px, py, 40, { halo: false, col: 'rgba(44,42,50,.55)' }); }
  // Nadeln für offene, bekannte Nebenaufgaben
  for (const [key, v] of Object.entries(karte_S.p)) { const q = story.side[key]; if (!q || q.state !== 'active' || v[0] !== b.id) continue; const [px, py] = W2(v[1], v[2]); karte_nadel(x, px, py); }
  // Ziel (Einstellung)
  if (settings.karteZiel !== false && typeof HINTS !== 'undefined') for (const h of HINTS) { if (h.kind !== 'story' || !karte_drin(b, h.x, h.z)) continue; let o = false; try { o = h.open(); } catch (e) {} if (!o) continue;
    const [px, py] = W2(h.x, h.z); x.save(); x.strokeStyle = 'rgba(160,28,22,.8)'; x.lineWidth = 2.6; x.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * 7, rr = 26 + i * .25; i ? x.lineTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * .8) : x.moveTo(px + Math.cos(a) * rr, py + Math.sin(a) * rr * .8); } x.stroke(); x.restore(); }
  // eigene Markierungen (und Kreide aus dem Tausch)
  for (const m of karte_S.m) { if (m[0] !== b.id) continue; const [px, py] = W2(m[1], m[2]); karte_marke(x, px, py, m[3], m[4], R); }
  // Luke: Bleistiftpfeil
  const P = player.pos; if (karte_drin(b, P.x, P.z) && karte_blattAn(P.x, P.z) === b) { const [px, py] = W2(P.x, P.z), fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw), a = Math.atan2(-fz, -fx); // Bild: x gespiegelt, z nach oben
    x.save(); x.translate(px, py); x.rotate(a); x.strokeStyle = 'rgba(30,28,34,.95)'; x.fillStyle = 'rgba(30,28,34,.9)'; x.lineWidth = 3.2; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-30, 1); x.quadraticCurveTo(-6, -2, 14, 0); x.stroke(); x.beginPath(); x.moveTo(24, 0); x.lineTo(6, -11); x.lineTo(10, 0); x.lineTo(6, 11); x.closePath(); x.fill();
    x.lineWidth = 1.4; x.beginPath(); x.moveTo(-30, 1); x.lineTo(-38, -7); x.moveTo(-30, 1); x.lineTo(-38, 9); x.stroke(); x.restore(); karte_hand(x, 'ich', px + 22, py + 30, 26, { col: 'rgba(30,28,34,.9)' }); }
}
function karte_kerze(x, px, py, R) { x.save(); x.translate(px, py); x.rotate((R() - .5) * .2); x.strokeStyle = 'rgba(150,25,20,.85)'; x.lineWidth = 1.8; x.beginPath(); x.rect(-4, -4, 8, 16); x.stroke();
  x.beginPath(); x.moveTo(0, -5); x.quadraticCurveTo(6, -12, 0, -20); x.quadraticCurveTo(-6, -12, 0, -5); x.stroke(); x.restore(); }
function karte_kreispfeil(x, ax, ay, bx, by, R) { // Lucys Zeichen: Pfeil mit Kreis am Schaft, blauer Kuli
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy); if (L < 20) return; const ux = dx / L, uy = dy / L, sx = ax + ux * L * .2, sy = ay + uy * L * .2, ex = ax + ux * Math.min(L * .7, 90), ey = ay + uy * Math.min(L * .7, 90);
  x.save(); x.strokeStyle = 'rgba(28,48,150,.82)'; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath(); x.moveTo(sx, sy); x.lineTo(ex, ey); x.moveTo(ex, ey); x.lineTo(ex - ux * 12 - uy * 8, ey - uy * 12 + ux * 8); x.moveTo(ex, ey); x.lineTo(ex - ux * 12 + uy * 8, ey - uy * 12 - ux * 8); x.stroke();
  x.beginPath(); x.arc(sx + ux * 14, sy + uy * 14, 7 + R(), 0, 6.1); x.stroke(); x.restore(); }
function karte_nadel(x, px, py) { x.save(); x.strokeStyle = 'rgba(40,40,40,.8)'; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px + 10, py - 26); x.stroke(); x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(px + 4, py + 2, 9, 4, .3, 0, 7); x.fill();
  const g = x.createRadialGradient(px + 8, py - 32, 1, px + 11, py - 29, 11); g.addColorStop(0, '#ff9a88'); g.addColorStop(.55, '#b0180e'); g.addColorStop(1, '#4d0804'); x.fillStyle = g; x.beginPath(); x.arc(px + 11, py - 29, 10, 0, 7); x.fill(); x.restore(); }
function karte_marke(x, px, py, text, art, R) {
  if (art === 'kreide') { x.save(); x.strokeStyle = 'rgba(250,250,246,.97)'; x.shadowColor = 'rgba(40,36,34,.9)'; x.shadowBlur = 2.5; x.shadowOffsetX = 1; x.shadowOffsetY = 1.5; x.lineWidth = 5; x.lineCap = 'round'; x.beginPath(); x.moveTo(px - 12, py - 12); x.lineTo(px + 12, py + 12); x.moveTo(px + 12, py - 12); x.lineTo(px - 12, py + 12); x.stroke(); x.restore();
    if (text) karte_hand(x, text, px + 18, py - 20, 30, { align: 'left', col: 'rgba(252,252,248,1)', halo: 'rgba(55,50,46,.8)' }); return; }
  x.save(); x.strokeStyle = 'rgba(160,28,22,.9)'; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath(); x.moveTo(px - 10, py - 11); x.lineTo(px + 11, py + 10); x.moveTo(px + 10, py - 10); x.lineTo(px - 11, py + 11); x.stroke(); x.restore();
  if (text) karte_hand(x, text, px + 16, py - 18, 28, { align: 'left', col: 'rgba(150,26,20,.92)', rot: -.04 });
}
function karte_kreide(x, b, R) { // weiße Kreide auf Papier: dicke, gebrochene Striche mit grauem Rand; „ICH KOMME“ + siebzehn Striche an der Kreuzung
  const [ax, ay] = karte_welt2px(b, 118, -14), [bx, by] = karte_welt2px(b, -112, 26), L = Math.hypot(bx - ax, by - ay), rot = Math.atan2(by - ay, bx - ax);
  const k = document.createElement('canvas'); k.width = x.canvas.width; k.height = x.canvas.height; const kx = k.getContext('2d', KARTE_CPU);
  kx.save(); kx.translate((ax + bx) / 2, (ay + by) / 2); kx.rotate(rot); kx.font = `700 ${Math.round(L / 4.6)}px Caveat, cursive`; kx.scale(1, 1.25); kx.textAlign = 'center'; kx.textBaseline = 'middle'; kx.fillStyle = '#fbfbf7'; kx.fillText('ICH KOMME', 0, 0); kx.restore();
  const [cx, cy] = karte_welt2px(b, 3, 2); kx.strokeStyle = '#fbfbf7'; kx.lineWidth = 5; kx.lineCap = 'round'; kx.beginPath();
  for (let g = 0; g < 4; g++) { const ox = cx - 120 + g * 64; for (let i = 0; i < 4; i++) { kx.moveTo(ox + i * 11, cy + 40); kx.lineTo(ox + i * 11 + (R() - .5) * 3, cy + 78); } kx.moveTo(ox - 6, cy + 72); kx.lineTo(ox + 42, cy + 46); } kx.moveTo(cx + 140, cy + 40); kx.lineTo(cx + 141, cy + 78); kx.stroke();
  kx.globalCompositeOperation = 'destination-out'; kx.fillStyle = kx.createPattern(karte_korn(.09, 'rgba(0,0,0,.8)', 31), 'repeat'); kx.fillRect(0, 0, k.width, k.height);
  x.save(); x.shadowColor = 'rgba(60,54,48,.85)'; x.shadowBlur = 2.5; x.shadowOffsetX = 1.5; x.shadowOffsetY = 2; x.globalAlpha = .97; x.drawImage(k, 0, 0); x.drawImage(k, 0, 0); x.restore(); k.width = k.height = 0;
}
// ---------------------------------------------------------------------  Fibel-Reiter „KARTE“: Ansicht, Zoom, Verschieben, Markierungen
function karte_reiter(B) {
  const P = player.pos, hier = karte_blattAn(P.x, P.z), frei = KARTE_BL.filter(karte_frei); if (!karte_S.blatt || !frei.includes(karte_bl(karte_S.blatt))) karte_S.blatt = (hier && frei.includes(hier) ? hier : frei[0]).id;
  if (hier && frei.includes(hier) && !karte_S.gewechselt && ui.overlay !== 'journal') karte_S.blatt = hier.id; if (ui.overlay === 'journal') karte_S.gewechselt = false;
  const b = karte_bl(karte_S.blatt);
  B.innerHTML = `<div class="kaKopf">${frei.length > 1 ? frei.map(f => `<button data-b="${f.id}" class="${f.id === b.id ? 'on' : ''}">${{ dorf: 'Dorf', amt: 'Ebene −2', villa: 'Villa', wald: 'Wald' }[f.id]}</button>`).join('') : ''}` +
    `<label class="kaZiel"><input type="checkbox" ${settings.karteZiel !== false ? 'checked' : ''}> Ziel zeigen</label></div><div class="kaRahmen"><canvas class="kaView"></canvas><div class="kaTip"></div></div>` +
    '<div class="kaHilfe">Klick: Markierung · Mausrad: näher · Ziehen: verschieben · M: Karte</div>';
  B.querySelectorAll('.kaKopf button').forEach(el => el.onclick = e => { e.stopPropagation(); karte_S.blatt = el.dataset.b; karte_S.gewechselt = true; karte_S.view = { z: 1, x: 0, y: 0 }; Audio.paper(); renderJournal(); });
  const cb = B.querySelector('.kaZiel input'); cb.onclick = e => e.stopPropagation(); cb.onchange = () => { settings.karteZiel = cb.checked; saveSettings(); karte_S.compKey = ''; karte_male(); };
  const cv = B.querySelector('.kaView'), rahmen = B.querySelector('.kaRahmen'), cssW = Math.max(300, rahmen.clientWidth || Math.min(1000, innerWidth * .94) - 36 - 48), dpr = Math.min(2, devicePixelRatio || 1);
  if (!rahmen.clientWidth) requestAnimationFrame(() => { if (jTab === 'karte' && ui.overlay === 'journal' && rahmen.isConnected && rahmen.clientWidth && Math.abs(rahmen.clientWidth - cssW) > 8) renderJournal(); });
  if (!karte_S.ink[b.id] || karte_S.inkKap[b.id] !== kap()) { // erst zeichnen lassen (Fibel steht still), dann einsetzen
    cv.style.width = cssW + 'px'; cv.style.height = Math.round(cssW * .55) + 'px'; const x = cv.getContext('2d'); cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssW * .55 * dpr);
    x.fillStyle = '#e6dcc2'; x.fillRect(0, 0, cv.width, cv.height); x.font = `${Math.round(34 * dpr)}px Caveat, cursive`; x.fillStyle = 'rgba(44,42,50,.7)'; x.textAlign = 'center'; x.fillText('Moment … ich zeichne das eben auf.', cv.width / 2, cv.height / 2);
    setTimeout(() => { if (jTab === 'karte' && B.isConnected) { try { karte_comp(b); } catch (e) { console.error('Karte', e); } if (B.isConnected) karte_reiter(B); } }, 60); return; }
  let comp; try { comp = karte_comp(b); } catch (e) { console.error('Karte', e); return; }
  const cssH = Math.min(Math.round(innerHeight * .64), Math.round(cssW * comp.height / comp.width) + 2); cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px'; cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
  karte_S.cv = cv; karte_S.b = b; karte_male(); karte_events(cv, B.querySelector('.kaTip'));
}
function karte_fit(cv, comp) { return Math.min(cv.width / comp.width, cv.height / comp.height); }
function karte_male() {
  const cv = karte_S.cv, b = karte_S.b; if (!cv || !cv.isConnected) return; const comp = karte_comp(b), x = cv.getContext('2d'), V = karte_S.view, f = karte_fit(cv, comp) * V.z;
  const maxX = Math.max(0, (comp.width * f - cv.width) / 2), maxY = Math.max(0, (comp.height * f - cv.height) / 2); V.x = Math.max(-maxX, Math.min(maxX, V.x)); V.y = Math.max(-maxY, Math.min(maxY, V.y));
  x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, cv.width, cv.height); x.imageSmoothingQuality = 'high';
  const ox = (cv.width - comp.width * f) / 2 + V.x, oy = (cv.height - comp.height * f) / 2 + V.y; karte_S.tf = { f, ox, oy }; x.drawImage(comp, ox, oy, comp.width * f, comp.height * f);
}
function karte_events(cv, tip) {
  let drag = null; const pos = e => { const r = cv.getBoundingClientRect(), k = cv.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; };
  const papier = e => { const [cx, cy] = pos(e), T = karte_S.tf; return [(cx - T.ox) / T.f, (cy - T.oy) / T.f]; };
  cv.onwheel = e => { e.preventDefault(); e.stopPropagation(); const V = karte_S.view, [cx, cy] = pos(e), z0 = V.z, z1 = Math.max(1, Math.min(4, z0 * (e.deltaY < 0 ? 1.18 : 1 / 1.18))); if (z1 === z0) return;
    const mx = cx - cv.width / 2 - V.x, my = cy - cv.height / 2 - V.y; V.x -= mx * (z1 / z0 - 1); V.y -= my * (z1 / z0 - 1); V.z = z1; karte_male(); };
  cv.onmousedown = e => { e.stopPropagation(); drag = { x: e.clientX, y: e.clientY, vx: karte_S.view.x, vy: karte_S.view.y, moved: false }; };
  cv.onmousemove = e => { if (drag) { const k = cv.width / cv.getBoundingClientRect().width, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k; if (Math.hypot(dx, dy) > 5) drag.moved = true;
      if (drag.moved) { karte_S.view.x = drag.vx + dx; karte_S.view.y = drag.vy + dy; karte_male(); cv.style.cursor = 'grabbing'; } return; }
    const [px, py] = papier(e), b = karte_S.b, T = karte_S.tf; let t = '';
    for (const m of karte_S.m) { if (m[0] !== b.id) continue; const [mx, my] = karte_welt2px(b, m[1], m[2]); if (Math.hypot(px - mx, py - my) * T.f < 16) t = m[3] || (m[4] === 'kreide' ? 'Kreidezeichen' : 'Markierung'); }
    for (const [key, v] of Object.entries(karte_S.p)) { const q = story.side[key]; if (!q || q.state !== 'active' || v[0] !== b.id) continue; const [mx, my] = karte_welt2px(b, v[1], v[2]); if (Math.hypot(px - mx - 11, py - my + 29) * T.f < 18) t = q.title; }
    if (t) { const r = cv.getBoundingClientRect(); tip.textContent = t; tip.style.left = (e.clientX - r.left + 14) + 'px'; tip.style.top = (e.clientY - r.top - 10) + 'px'; tip.classList.add('on'); } else tip.classList.remove('on'); cv.style.cursor = 'crosshair'; };
  cv.onmouseleave = () => { tip.classList.remove('on'); drag = null; cv.style.cursor = 'crosshair'; };
  cv.onclick = e => e.stopPropagation();
  cv.onmouseup = e => { e.stopPropagation(); if (!drag) return; const d = drag; drag = null; cv.style.cursor = 'crosshair'; if (d.moved) return; karte_klick(papier(e), e); };
}
function karte_klick([px, py], e) { // vorhandene Markierung anklicken → bearbeiten; sonst neue
  const b = karte_S.b, T = karte_S.tf, [wx, wz] = karte_px2welt(b, px, py); let i = karte_S.m.findIndex(m => { if (m[0] !== b.id || m[4] === 'kreide') return false; const [mx, my] = karte_welt2px(b, m[1], m[2]); return Math.hypot(px - mx, py - my) * T.f < 16; });
  const rahmen = karte_S.cv.parentElement; let box = rahmen.querySelector('.kaZettel'); if (box) box.remove(); box = document.createElement('div'); box.className = 'kaZettel';
  const r = karte_S.cv.getBoundingClientRect(); box.style.left = Math.min(r.width - 250, Math.max(6, e.clientX - r.left + 12)) + 'px'; box.style.top = Math.min(r.height - 120, Math.max(6, e.clientY - r.top - 20)) + 'px';
  box.innerHTML = `<input maxlength="40" placeholder="Notiz …" value="${i >= 0 ? (karte_S.m[i][3] || '').replace(/"/g, '&quot;') : ''}"><div><button class="ok">${i >= 0 ? 'Ändern' : 'Eintragen'}</button>${i >= 0 ? '<button class="weg">Wegradieren</button>' : ''}<button class="ab">×</button></div>`;
  rahmen.appendChild(box); const inp = box.querySelector('input'); setTimeout(() => inp.focus(), 30);
  const fertig = () => { box.remove(); karte_S.compKey = ''; karte_male(); };
  const ok = () => { const t = inp.value.trim().slice(0, 40); if (i >= 0) karte_S.m[i][3] = t; else karte_S.m.push([b.id, +wx.toFixed(1), +wz.toFixed(1), t, 'marke']); Audio.paper(); fertig(); };
  box.onclick = box.onmousedown = box.onmouseup = ev => ev.stopPropagation(); box.querySelector('.ok').onclick = ev => { ev.stopPropagation(); ok(); }; box.querySelector('.ab').onclick = ev => { ev.stopPropagation(); box.remove(); };
  const w = box.querySelector('.weg'); if (w) w.onclick = ev => { ev.stopPropagation(); karte_S.m.splice(i, 1); Audio.play('stones1', { gain: .05, rate: 3, dur: .3 }); fertig(); };
  inp.onkeydown = ev => { ev.stopPropagation(); if (ev.key === 'Enter') ok(); if (ev.key === 'Escape') box.remove(); }; inp.onkeyup = ev => ev.stopPropagation();
}
// ---------------------------------------------------------------------  Schnittstellen
function karte_markierung(x, z, art, text) { const b = karte_blattAn(x, z); if (!b) return false; karte_S.m.push([b.id, +(+x).toFixed(1), +(+z).toFixed(1), String(text || '').slice(0, 40), art || 'marke']); karte_S.compKey = ''; return true; }
function karte_oeffnen(blatt) { if (blatt) { karte_S.blatt = blatt; karte_S.gewechselt = true; } jTab = 'karte'; renderJournal(); if (ui.overlay !== 'journal') openOverlay('journal'); }
// Nebenaufgaben: Ort merken, an dem Luke davon erfährt (oder q.karte = { x, z } aus dem Modul)
sideStart = (o => k => { const q = story.side[k], vorher = q && q.state; o(k); try { if (q && vorher === 'hidden' && q.state === 'active' && !karte_S.p[k]) { const p = q.karte || { x: player.pos.x, z: player.pos.z }, b = karte_blattAn(p.x, p.z); if (b) karte_S.p[k] = [b.id, +p.x.toFixed(1), +p.z.toFixed(1)]; } } catch (e) {} })(sideStart);
// Fibel mit Maus: beim Öffnen der Fibel die Maussperre lösen (sonst sind Reiter und Karte nicht anklickbar); beim Schließen sperrt closeOverlay wieder
openOverlay = (o => id => { o(id); if (id === 'journal' && document.pointerLockElement && !window.__testMove) document.exitPointerLock(); })(openOverlay);
KEY_HOOKS['KeyM'] = () => { if (!state.talking) karte_oeffnen(); };
(function karte_css() { const st = document.createElement('style'); st.id = 'kaCss'; st.textContent = `
#jBody[data-reiter="karte"] { padding: 18px 22px 20px; }
.kaKopf { display: flex; align-items: center; gap: 8px; margin: 0 0 10px; min-height: 30px; }
.kaKopf button { border: 0; cursor: pointer; padding: 5px 14px 4px; font: 22px Caveat, cursive; color: #2a2016; background: rgba(240,232,208,.8); box-shadow: 0 1px 2px rgba(0,0,0,.25); transform: rotate(-1deg); }
.kaKopf button:nth-child(even) { transform: rotate(1.2deg); } .kaKopf button.on { background: #f6eed6; color: #7c2418; box-shadow: 0 2px 5px rgba(0,0,0,.35); }
.kaZiel { margin-left: auto; font: 22px Caveat, cursive; color: #2a2016; cursor: pointer; user-select: none; } .kaZiel input { accent-color: #7c2418; vertical-align: middle; }
.kaRahmen { position: relative; line-height: 0; } .kaView { display: block; cursor: crosshair; filter: drop-shadow(0 6px 10px rgba(0,0,0,.35)); }
.kaTip { position: absolute; pointer-events: none; opacity: 0; transition: opacity .15s; padding: 6px 12px 4px; background: #f3ead0; box-shadow: 0 2px 6px rgba(0,0,0,.35); font: 22px/1.1 Caveat, cursive; color: #1e2b5c; transform: rotate(-1.5deg); white-space: nowrap; }
.kaTip.on { opacity: 1; }
.kaHilfe { margin-top: 10px; font: italic 15px "Cormorant Garamond", Georgia, serif; color: var(--pdim); text-align: right; }
.kaZettel { position: absolute; z-index: 3; width: 236px; padding: 12px 12px 10px; line-height: 1.2; background: linear-gradient(170deg, #f7efd6, #e9dcb8); box-shadow: 0 3px 10px rgba(0,0,0,.45); transform: rotate(-1.2deg); }
.kaZettel::before { content: ''; position: absolute; top: -8px; left: 38%; width: 70px; height: 18px; background: rgba(236,228,196,.7); transform: rotate(3deg); }
.kaZettel input { width: 100%; box-sizing: border-box; border: 0; border-bottom: 1.5px solid rgba(30,43,92,.5); background: transparent; font: 26px Caveat, cursive; color: #1e2b5c; outline: none; }
.kaZettel div { display: flex; gap: 6px; margin-top: 8px; } .kaZettel button { border: 1px solid rgba(60,40,20,.4); background: rgba(255,255,255,.35); cursor: pointer; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .12em; padding: 4px 8px; color: #2a2016; }
.kaZettel button.weg { color: #7c2418; } .kaZettel button.ab { margin-left: auto; }
`; document.head.appendChild(st); })();
// ---------------------------------------------------------------------  Aufbau, Tick, Spielstand
if (typeof sammeln_reiter === 'function') sammeln_reiter('karte', 'KARTE', karte_reiter, null, '#a39a7c');
WORLD_MODS.push(['Karte', async () => { karte_S.ready = true; for (let n = 1; n <= 6; n++) KAP_BEGIN[n].push(() => { karte_S.compKey = ''; }); }]);
WORLD_TICK.push(dt => karte_tick(dt));
function karte_b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 8) { let v = 0; for (let k = 0; k < 8; k++) if (u8[i + k]) v |= 1 << k; s += String.fromCharCode(v); } return btoa(s); }
function karte_unb64(str, n) { const s = atob(str), u = new Uint8Array(n); for (let i = 0; i < s.length; i++) { const v = s.charCodeAt(i); for (let k = 0; k < 8; k++) if (v & 1 << k && i * 8 + k < n) u[i * 8 + k] = 1; } return u; }
MOD_SAVE.push(['karte', () => ({ g: Object.fromEntries(KARTE_BL.map(b => [b.id, karte_b64(karte_S.g[b.id])])), d: karte_S.dims, m: karte_S.m, p: karte_S.p }),
  v => { if (!v) return; for (const b of KARTE_BL) { const d = karte_S.dims[b.id], vd = v.d && v.d[b.id]; if (v.g && v.g[b.id] && (!vd || (vd[0] === d[0] && vd[1] === d[1]))) try { karte_S.g[b.id] = karte_unb64(v.g[b.id], d[0] * d[1]); } catch (e) {} }
    karte_S.m = Array.isArray(v.m) ? v.m : []; karte_S.p = v.p && typeof v.p === 'object' ? v.p : {}; karte_S.compKey = ''; }]);
window.__karte = { S: karte_S, BL: KARTE_BL, auf: (id, x, z, r) => karte_aufdecken(karte_bl(id), x, z, r), comp: id => karte_comp(karte_bl(id)), oeffnen: karte_oeffnen, mark: karte_markierung, male: () => karte_male(), daten: id => karte_sammeln(karte_bl(id)), klick: (px, py) => karte_klick([px, py], { clientX: 300, clientY: 200 }) }; // Testzugriff
