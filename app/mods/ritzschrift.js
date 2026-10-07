// =====================================================================  RITZSCHRIFT (Modul „ritzschrift“): von Hand geritzte, gekreidete, geschmierte Schrift auf Wänden und Tafeln
// Nutzer 02.10./07.10.: „generierte Schrift … alles realistisch, Wandschrift zu generiert und abgeschnitten“. Keine Computerschrift: jeder Buchstabe ist ein Strichzug aus
// Stützpunkten (Druckbuchstaben), der bei jedem Zeichnen anders ausfällt – Neigung, Größe, Grundlinie, Handzittern, wechselnder Druck, Aussetzer, doppelte Spuren.
// Stile: 'ritz' (Fingernagel/Löffelstiel im Putz: dunkle Rille + helle Kante + Höhenrelief), 'kreide' (Tafelkreide, körnig), 'blut' (dick, glänzend, mit Tropfen).
// Zeichnet auf zwei Leinwände: C = Farbe (mit Alpha, wird als Abziehbild über die Wand gelegt), B = Höhenrelief (grau 128 = eben; optional, für bumpMap).
// Schnittstelle: ritz_flaeche(w, h, { text, zeilen, seed, stil, dichte, min, max }) → { c, b } · ritz_zeile(C, B, text, x, y, größe, { stil, alpha }) → Breite · ritz_breite(text, größe)
//   ritz_strich(C, B, [[x, y], …], größe, stil, alpha) · ritz_tex(c, b) → Material-Parameter (map, bumpMap) für Abziehbilder.
let ritz_rs = 1;
const ritz_R = (a = 0, b = 1) => { ritz_rs = (ritz_rs * 1664525 + 1013904223) >>> 0; return a + (b - a) * (ritz_rs / 4294967296); };
const ritz_RN = () => (ritz_R() + ritz_R() + ritz_R() - 1.5) / 1.5; // ≈ glockenförmig, −1 … 1
let ritz_GL = null;
function ritz_glyphen() {
  if (ritz_GL) return ritz_GL;
  const o = [.3, 0, .1, .12, .02, .4, .02, .62, .1, .88, .3, 1, .5, .88, .58, .62, .58, .4, .5, .12, .3, 0];
  const p = [0, 1, 0, 0, .34, 0, .56, .12, .56, .34, .34, .5, 0, .5];
  ritz_GL = {
    A: [[0, 1, .31, 0, .62, 1], [.12, .64, .5, .64]], B: [[0, 1, 0, 0, .35, 0, .55, .1, .55, .3, .35, .48, 0, .48], [.35, .48, .6, .58, .6, .8, .38, 1, 0, 1]],
    C: [[.58, .18, .45, .04, .28, 0, .12, .1, .02, .35, .02, .65, .12, .9, .28, 1, .46, .96, .6, .82]], D: [[0, 0, 0, 1], [0, 0, .3, 0, .52, .15, .6, .5, .52, .85, .3, 1, 0, 1]],
    E: [[.55, 0, 0, 0, 0, 1, .55, 1], [0, .5, .42, .5]], F: [[.55, 0, 0, 0, 0, 1], [0, .5, .42, .5]],
    G: [[.58, .18, .45, .04, .28, 0, .12, .1, .02, .35, .02, .65, .12, .9, .28, 1, .5, .96, .6, .8, .6, .55, .36, .55]], H: [[0, 0, 0, 1], [.58, 0, .58, 1], [0, .5, .58, .5]],
    I: [[.12, 0, .12, 1]], J: [[.42, 0, .42, .78, .34, .95, .18, 1, .04, .92]], K: [[0, 0, 0, 1], [.55, 0, 0, .58], [.2, .42, .58, 1]], L: [[0, 0, 0, 1, .5, 1]],
    M: [[0, 1, 0, 0, .34, .62, .68, 0, .68, 1]], N: [[0, 1, 0, 0, .58, 1, .58, 0]], O: [o], P: [p], Q: [o, [.35, .75, .62, 1.06]], R: [p, [.28, .5, .58, 1]],
    S: [[.54, .14, .4, .02, .22, 0, .06, .1, .04, .28, .16, .42, .4, .52, .56, .66, .56, .85, .4, .98, .2, 1, .04, .9]], T: [[0, 0, .6, 0], [.3, 0, .3, 1]],
    U: [[0, 0, 0, .72, .1, .94, .3, 1, .5, .94, .58, .72, .58, 0]], V: [[0, 0, .3, 1, .6, 0]], W: [[0, 0, .15, 1, .4, .3, .65, 1, .8, 0]], X: [[0, 0, .58, 1], [.58, 0, 0, 1]],
    Y: [[0, 0, .3, .5, .6, 0], [.3, .5, .3, 1]], Z: [[0, 0, .58, 0, 0, 1, .58, 1]],
    0: [[.28, 0, .1, .14, .03, .4, .03, .62, .1, .88, .28, 1, .46, .88, .54, .62, .54, .4, .46, .14, .28, 0]], 1: [[.06, .22, .26, 0, .26, 1]],
    2: [[.04, .2, .14, .04, .3, 0, .5, .06, .56, .26, .4, .5, .04, 1, .58, 1]], 3: [[.04, .1, .2, 0, .42, 0, .56, .14, .5, .36, .28, .48, .52, .6, .58, .82, .44, .98, .22, 1, .04, .9]],
    4: [[.46, 1, .46, 0, 0, .68, .62, .68]], 5: [[.54, 0, .08, 0, .04, .46, .3, .4, .5, .46, .58, .7, .46, .94, .26, 1, .04, .9]],
    6: [[.5, .04, .3, 0, .1, .18, .02, .5, .04, .8, .2, 1, .42, .98, .56, .8, .5, .58, .3, .5, .08, .6]], 7: [[0, 0, .58, 0, .22, 1]],
    8: [[.3, .5, .08, .36, .1, .12, .3, 0, .5, .12, .52, .36, .3, .5, .06, .68, .06, .88, .3, 1, .54, .88, .54, .68, .3, .5]],
    9: [[.52, .4, .3, .5, .08, .4, .04, .18, .2, .02, .42, .02, .56, .2, .54, .5, .46, .8, .3, 1, .1, .96]],
    '.': [[.08, .94, .1, 1]], ',': [[.12, .92, .06, 1.12]], ':': [[.08, .22, .1, .28], [.08, .86, .1, .92]], '-': [[0, .55, .4, .55]], '!': [[.08, 0, .08, .68], [.08, .93, .08, 1]], '/': [[.4, 0, 0, 1]],
    '(': [[.3, 0, .1, .3, .1, .7, .3, 1]], ')': [[.1, 0, .3, .3, .3, .7, .1, 1]], '?': [[.04, .2, .14, .04, .3, 0, .5, .08, .54, .26, .3, .46, .28, .66], [.28, .93, .28, 1]] };
  const W = { A: .62, B: .6, C: .6, D: .6, E: .55, F: .55, G: .6, H: .58, I: .12, J: .44, K: .58, L: .5, M: .68, N: .58, O: .58, P: .56, Q: .6, R: .58, S: .56, T: .6, U: .58, V: .6, W: .8, X: .58, Y: .6, Z: .58,
    0: .54, 1: .3, 2: .58, 3: .58, 4: .62, 5: .58, 6: .56, 7: .58, 8: .56, 9: .56, '.': .1, ',': .12, ':': .1, '-': .4, '!': .1, '/': .4, '(': .3, ')': .3, '?': .56 };
  for (const k in ritz_GL) ritz_GL[k].w = W[k] ?? .5; return ritz_GL; }
const RITZ_UMLAUT = { 'Ä': 'A', 'Ö': 'O', 'Ü': 'U' };
function ritz_norm(t) { return String(t).toUpperCase().replace(/ß/g, 'SS').replace(/ä/gi, 'Ä').replace(/ö/gi, 'Ö').replace(/ü/gi, 'Ü'); }
function ritz_breite(text, size) { const G = ritz_glyphen(); let w = 0; for (const ch of ritz_norm(text)) { if (ch === ' ') { w += .55; continue; } const g = G[RITZ_UMLAUT[ch] || ch]; w += (g ? g.w : .5) + .27; } return w * size; }
// Stützpunkte glätten (Catmull-Rom), dichte Punktfolge
function ritz_glatt(pts, step) {
  if (pts.length < 3) { const out = []; const [a, b] = [pts[0], pts[pts.length - 1]], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(L / step)); for (let i = 0; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]); return out; }
  const out = [], P = i => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(1, Math.ceil(L / step));
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; out.push([.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
      .5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]); } }
  out.push(pts[pts.length - 1]); return out; }
// ein Strichzug [[x, y], …] in Pixeln
function ritz_strich(C, B, pts, size, stil = 'ritz', alpha = 1) {
  const sp = Math.max(1.5, size * .07), P = ritz_glatt(pts, sp), n = P.length; if (n < 2) return; const ph = ritz_R(0, 6.28), amp = size * .012 * ritz_R(.6, 1.4);
  const Q = P.map((p, i) => { const t = i / Math.max(1, n - 1); let nx = 0, ny = 0; if (i > 0 && i < n - 1) { const dx = P[i + 1][0] - P[i - 1][0], dy = P[i + 1][1] - P[i - 1][1], L = Math.hypot(dx, dy) || 1; nx = -dy / L; ny = dx / L; }
    const w = (Math.sin(t * 5 + ph) * .6 + Math.sin(t * 13 + ph * 1.7) * .4) * amp; return [p[0] + nx * w, p[1] + ny * w]; });
  const lw0 = stil === 'kreide' ? Math.max(1.6, size * .085) : stil === 'blut' ? Math.max(2, size * .11) : Math.max(1.3, size * .058);
  const chunks = stil === 'ritz' ? Math.max(1, Math.min(5, Math.round(n / 5))) : 1, per = Math.ceil(n / chunks), seg = (i0, i1, f) => { C.beginPath(); C.moveTo(Q[i0][0] + f[0], Q[i0][1] + f[1]); for (let i = i0 + 1; i <= i1; i++) C.lineTo(Q[i][0] + f[0], Q[i][1] + f[1]); C.stroke(); };
  const segB = (i0, i1, f) => { B.beginPath(); B.moveTo(Q[i0][0] + f[0], Q[i0][1] + f[1]); for (let i = i0 + 1; i <= i1; i++) B.lineTo(Q[i][0] + f[0], Q[i][1] + f[1]); B.stroke(); };
  C.save(); C.lineCap = 'round'; C.lineJoin = 'round'; if (B) { B.save(); B.lineCap = 'round'; B.lineJoin = 'round'; }
  for (let c = 0; c < chunks; c++) { const i0 = c * per, i1 = Math.min(n - 1, (c + 1) * per); if (i1 <= i0) break; const press = (c === 0 ? 1.15 : 1) * ritz_R(.6, 1.15) * (c === chunks - 1 && chunks > 1 ? .8 : 1), lw = lw0 * press, a = Math.min(1, alpha * (.55 + .45 * press));
    if (stil === 'ritz' && ritz_R() < .07 && c > 0 && c < chunks - 1) continue; // der Nagel springt kurz aus der Rille
    if (stil === 'ritz') { // dünne Rille: dunkle Schattenseite + helle Kante gegenüber, dazwischen kaum Füllung
      C.strokeStyle = `rgba(10,8,6,${.7 * a})`; C.lineWidth = lw * .85; seg(i0, i1, [lw * .3, lw * .4]);
      C.strokeStyle = `rgba(236,229,212,${.62 * a})`; C.lineWidth = lw * .55; seg(i0, i1, [-lw * .28, -lw * .34]);
      if (B) { B.strokeStyle = `rgba(22,22,22,${.9 * a})`; B.lineWidth = lw * 1.0; segB(i0, i1, [0, 0]); B.strokeStyle = `rgba(200,200,200,${.7 * a})`; B.lineWidth = lw * .5; segB(i0, i1, [-lw * .9, -lw * .9]); } }
    else if (stil === 'kreide') {
      C.strokeStyle = `rgba(236,234,226,${.34 * a})`; C.lineWidth = lw * 1.5; seg(i0, i1, [0, 0]); C.strokeStyle = `rgba(244,242,235,${.62 * a})`; C.lineWidth = lw; seg(i0, i1, [ritz_RN() * .4, ritz_RN() * .4]);
      for (let i = i0; i <= i1; i += 1) { if (ritz_R() < .6) continue; C.fillStyle = `rgba(10,12,10,${ritz_R(.2, .55)})`; C.beginPath(); C.arc(Q[i][0] + ritz_RN() * lw * .9, Q[i][1] + ritz_RN() * lw * .9, ritz_R(.5, 1.4), 0, 6.3); C.fill(); } } // Körnung: Lücken im Kreidestrich
    else if (stil === 'blut') {
      C.strokeStyle = `rgba(52,4,4,${.95 * a})`; C.lineWidth = lw * 1.25; seg(i0, i1, [0, 0]); C.strokeStyle = `rgba(104,10,8,${.9 * a})`; C.lineWidth = lw * .8; seg(i0, i1, [0, 0]);
      C.strokeStyle = `rgba(170,40,32,${.35 * a})`; C.lineWidth = lw * .22; seg(i0, i1, [-lw * .2, -lw * .25]); } }
  if (stil === 'blut' && ritz_R() < .5) { const p = Q[Math.floor(ritz_R(.2, .95) * (n - 1))], L = size * ritz_R(.25, 1.1), lw = lw0 * ritz_R(.45, .8); // Tropfen
    C.strokeStyle = `rgba(78,6,6,${.9 * alpha})`; C.lineWidth = lw; C.beginPath(); C.moveTo(p[0], p[1]); C.lineTo(p[0] + ritz_RN() * .4, p[1] + L); C.stroke(); C.fillStyle = `rgba(78,6,6,${.9 * alpha})`; C.beginPath(); C.arc(p[0], p[1] + L, lw * .75, 0, 6.3); C.fill(); }
  C.restore(); if (B) B.restore(); }
function ritz_buchstabe(C, B, ch, x, y, size, stil, alpha, jit = 1) { // y = Grundlinie; gibt den Vorschub zurück
  const G = ritz_glyphen(), base = RITZ_UMLAUT[ch] || ch, g = G[base]; if (ch === ' ') return size * .55; if (!g) return size * .5;
  const rot = ritz_RN() * .08 * jit, sc = 1 + (ritz_R(.92, 1.08) - 1) * jit, dy = ritz_RN() * size * .05 * jit, dx = ritz_RN() * size * .03 * jit, sl = ritz_R(-.08, .12) * jit, cr = Math.cos(rot), sr = Math.sin(rot);
  const T = (gx, gy) => { const ux = (gx - g.w / 2) * size * sc + (gy - .5) * size * sl * sc, uy = (gy - 1) * size * sc; return [x + g.w * size / 2 + dx + ux * cr - uy * sr, y + dy + ux * sr + uy * cr]; };
  const doppelt = stil === 'ritz' && ritz_R() < .16; // manche Striche werden nachgezogen
  for (const s of g) { const pts = []; for (let i = 0; i < s.length; i += 2) pts.push(T(s[i], s[i + 1])); ritz_strich(C, B, pts, size, stil, alpha); if (doppelt) { const p2 = pts.map(p => [p[0] + ritz_RN() * size * .02, p[1] + ritz_RN() * size * .02]); ritz_strich(C, B, p2, size, stil, alpha * .7); } }
  if (RITZ_UMLAUT[ch]) { const a = T(g.w * .25, -.2), b = T(g.w * .75, -.2); for (const q of [a, b]) ritz_strich(C, B, [q, [q[0] + size * .02, q[1] + size * .03]], size, stil, alpha); }
  return (g.w + .27) * size * ritz_R(.96, 1.08); }
function ritz_zeile(C, B, text, x, y, size, o = {}) {
  const stil = o.stil || 'ritz', al = o.alpha ?? 1, ang = o.winkel || 0, t = ritz_norm(text); let cx = 0; const ca = Math.cos(ang), sa = Math.sin(ang);
  for (const ch of t) { const px = x + cx * ca, py = y + cx * sa; cx += ritz_buchstabe(C, B, ch, px, py, size, stil, al, o.jit ?? 1); } return cx; }
// Wandfläche voll Schrift: viele Zeilen, alte (schwache) unter neuen, nie über den Rand hinaus; Zeilen verlaufen leicht schief, manche abgebrochen oder durchgestrichen
function ritz_flaeche(w, h, o = {}) {
  ritz_rs = ((o.seed ?? 1) * 2654435761 + 12345) >>> 0; const c = document.createElement('canvas'), b = document.createElement('canvas'); c.width = b.width = w; c.height = b.height = h;
  const C = c.getContext('2d'), B = b.getContext('2d'); C.clearRect(0, 0, w, h); B.fillStyle = '#808080'; B.fillRect(0, 0, w, h);
  const neu = [], text = o.text || 'ICH WEISS ES JETZT', zeilen = o.zeilen ?? 30, min = o.min ?? 22, max = o.max ?? 52, stil = o.stil || 'ritz', m = Math.max(22, Math.min(w, h) * .04);
  for (let i = 0; i < zeilen; i++) {
    const size = ritz_R(min, max) * (ritz_R() < .15 ? .7 : 1), alt = ritz_R() < .35, al = alt ? ritz_R(.22, .42) : ritz_R(.6, 1), ang = ritz_RN() * .035; let y = 0;
    for (let k = 0; k < 10; k++) { y = ritz_R(m + size, h - m - size * .3); if (alt || !neu.some(q => Math.abs(q - y) < (size + 14) * .8)) break; } // frische Zeilen überlagern sich nicht, alte liegen darunter
    if (!alt) neu.push(y);
    let bw = ritz_breite(text, size), rep = 1; while (bw * (rep + 1) + size * .8 * rep < w - 2 * m && ritz_R() < .7) rep++;
    let full = rep * bw + (rep - 1) * size * .8; if (full > w - 2 * m) { rep = 1; full = bw; }
    if (full > w - 2 * m) continue; // Schrift passt nicht ganz hinein: gar nicht erst schreiben (nie abgeschnitten)
    const x0 = ritz_R(m, w - m - full); let cx = x0, cy = y;
    for (let r = 0; r < rep; r++) { const kurz = r === rep - 1 && ritz_R() < .25 ? Math.floor(ritz_R(5, text.length - 1)) : text.length, tt = text.slice(0, kurz).trimEnd(); // Zeile bricht manchmal mitten im Satz ab
      const adv = ritz_zeile(C, B, tt, cx, cy, size, { stil, alpha: al, winkel: ang }); cx += adv + size * .8; cy += Math.sin(ang) * (adv + size * .8); }
    if (ritz_R() < .08) { const yy = y - size * .35; ritz_strich(C, B, [[x0 - size * .1, yy + ritz_RN() * size * .1], [x0 + full * .5, yy + ritz_RN() * size * .2], [x0 + full * 1.02, yy + ritz_RN() * size * .1]], size * 1.4, stil, al); } } // durchgestrichen
  for (let i = 0; i < (o.kratzer ?? 14); i++) { const px = ritz_R(m, w - m), py = ritz_R(m, h - m), l = ritz_R(20, 90), an = ritz_R(-1.9, -1.2); ritz_strich(C, B, [[px, py], [px + Math.cos(an) * l, py + Math.sin(an) * l]], ritz_R(14, 24), stil, ritz_R(.25, .55)); } // freie Kratzer
  return { c, b }; }
// Material-Parameter für ein Abziehbild mit Höhenrelief
function ritz_tex(c, b) { const T = new THREE.CanvasTexture(c); T.colorSpace = THREE.SRGBColorSpace; T.anisotropy = 8; T.needsUpdate = true; const o = { map: T }; if (b) { const H = new THREE.CanvasTexture(b); H.anisotropy = 8; H.needsUpdate = true; o.bumpMap = H; o.bumpScale = 1.6; } return o; }
// Blutschrift als eigene Ebene: Farbe+Alpha und ein weich verlaufendes Höhenrelief (Wulst an jedem Strich, Tropfen hängen) – mit Klarlack-Glanz beleuchtet wirkt es nass
function ritz_blutFlaeche(w, h, zeilenfn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const C = c.getContext('2d'); zeilenfn(C);
  const b = document.createElement('canvas'); b.width = w; b.height = h; const B = b.getContext('2d'); B.fillStyle = '#000'; B.fillRect(0, 0, w, h);
  B.filter = 'blur(5px)'; B.drawImage(c, 0, 0); B.filter = 'blur(2px)'; B.globalAlpha = .6; B.drawImage(c, 0, 0); B.filter = 'none'; B.globalAlpha = 1; // Höhe aus der Deckkraft (Alpha → Grau)
  const id = B.getImageData(0, 0, w, h), d = id.data, src = C.getImageData(0, 0, w, h).data; for (let i = 0; i < d.length; i += 4) { const a = Math.min(255, d[i + 3] * 1.0 * 0 + (src[i + 3] * .55 + d[i + 3] * .6)); d[i] = d[i + 1] = d[i + 2] = a; d[i + 3] = 255; } B.putImageData(id, 0, 0);
  return { c, b }; }
function ritz_blutMat(f, glanz = .9) { const T = new THREE.CanvasTexture(f.c); T.colorSpace = THREE.SRGBColorSpace; T.anisotropy = 8; const H = new THREE.CanvasTexture(f.b); H.anisotropy = 8;
  return new THREE.MeshPhysicalMaterial({ map: T, bumpMap: H, bumpScale: 3.2, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, roughness: .22, metalness: 0, clearcoat: glanz, clearcoatRoughness: .08, color: 0xffffff }); }
// ---------------------------------------------------------------- Handschrift in Schreibschrift-Schriftarten (Caveat, Comic Sans …) auf allen Leinwänden der Welt
// Eine Schriftart setzt jeden Buchstaben gleich. Hier wird jeder Buchstabe einzeln gesetzt: eigene Grundlinie, Neigung, Größe, Druck (Deckkraft), dazu ein Zeilendrift –
// so entsteht das unregelmäßige Bild echter Handschrift. Gilt nur für Handschrift-Schriften; Druckschriften (Arial, Courier, Georgia) bleiben unberührt.
{ const P = CanvasRenderingContext2D.prototype, ft = P.fillText, st = P.strokeText, HAND = /Caveat|Comic Sans|Segoe Print|Gochi|Marker|Indie/i; let tief = false;
  const hand = (orig, kind) => function (text, x, y, maxW) {
    if (tief || maxW !== undefined || typeof text !== 'string' || text.length < 2 || !HAND.test(this.font)) return orig.call(this, text, x, y, maxW);
    const fm = /(\d+(?:\.\d+)?)px/.exec(this.font), sz = fm ? +fm[1] : 20; if (sz < 7) return orig.call(this, text, x, y);
    tief = true; const al = this.textAlign, ga = this.globalAlpha; try {
      const w = this.measureText(text).width, x0 = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x, drift = (Math.random() - .5) * .16 * sz, n = text.length; this.textAlign = 'left';
      for (let i = 0; i < n; i++) { const ch = text[i]; if (ch === ' ') continue; const px = x0 + (i ? this.measureText(text.slice(0, i)).width : 0), t = i / Math.max(1, n - 1) - .5, dy = (Math.random() - .5) * .09 * sz + t * drift, rot = (Math.random() - .5) * .12 + t * .02, sc = .94 + Math.random() * .12;
        this.save(); this.translate(px, y + dy); this.rotate(rot); this.scale(sc, sc * (.97 + Math.random() * .06)); this.globalAlpha = ga * (.82 + Math.random() * .18); orig.call(this, ch, 0, 0); this.restore(); } }
    finally { this.textAlign = al; this.globalAlpha = ga; tief = false; } };
  P.fillText = hand(ft); P.strokeText = hand(st); }
WORLD_MODS.push(['Ritzschrift', async () => {}]);
window.__ritz = { flaeche: ritz_flaeche, zeile: ritz_zeile, breite: ritz_breite, blut: ritz_blutFlaeche }; // Testzugriff
