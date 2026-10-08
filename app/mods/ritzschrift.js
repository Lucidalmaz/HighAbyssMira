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
// Krallenspuren (Finger/Nägel von innen an eine Tür gezogen): Bündel aus 3–5 fast parallelen Rillen, leicht gebogen, unten kräftig, oben auslaufend
function ritz_kratzer(w, h, o = {}) {
  if (typeof ECHT !== 'undefined' && ECHT.img.kratz) { // echte Kratzer: Megascans „Scratches“ (Brush) – freigelegtes Material hell mit dunklem Schatten, im Relief als Rille
    const c = document.createElement('canvas'), bc = document.createElement('canvas'); c.width = bc.width = w; c.height = bc.height = h; const C = c.getContext('2d'), B = bc.getContext('2d'), n = (o.bueschel ?? 5) + 1, sd = ((o.seed ?? 1) * 2654435761 + 777) >>> 0, gs = Math.min(1, (o.groesse ?? 120) / 110) * .8;
    B.fillStyle = '#808080'; B.fillRect(0, 0, w, h); C.save(); C.translate(1.2, 1.6); echt_kratz(C, w, h, n, 'rgba(20,14,10,1)', .55, gs, sd); C.restore(); echt_kratz(C, w, h, n, 'rgba(226,218,200,1)', .85, gs, sd); echt_kratz(B, w, h, n, 'rgb(36,36,36)', .95, gs, sd);
    return { c, b: bc }; }
  ritz_rs = ((o.seed ?? 1) * 2654435761 + 777) >>> 0; const c = document.createElement('canvas'), b = document.createElement('canvas'); c.width = b.width = w; c.height = b.height = h;
  const C = c.getContext('2d'), B = b.getContext('2d'); C.clearRect(0, 0, w, h); B.fillStyle = '#808080'; B.fillRect(0, 0, w, h); const gr = o.bueschel ?? 5, sz = o.groesse ?? 120;
  for (let g = 0; g < gr; g++) { const x0 = w * (.1 + .8 * (g + ritz_R(-.2, .2)) / Math.max(1, gr - 1)) * (gr > 1 ? 1 : 0) + (gr > 1 ? 0 : w / 2), y0 = h * ritz_R(.55, .95), len = h * ritz_R(.3, .75), ang = -Math.PI / 2 + ritz_RN() * .35, bend = ritz_RN() * .22, n = 3 + Math.floor(ritz_R(0, 2.99)), gap = ritz_R(11, 17);
    for (let k = 0; k < n; k++) { const L = len * ritz_R(.75, 1.05), pts = [], ox = Math.cos(ang + Math.PI / 2) * (k - (n - 1) / 2) * gap, oy = Math.sin(ang + Math.PI / 2) * (k - (n - 1) / 2) * gap;
      for (let t = 0; t <= 1.001; t += .125) { const a = ang + bend * t * 1.6; pts.push([x0 + ox + Math.cos(a) * L * t + ritz_RN() * 1.2, y0 + oy + Math.sin(a) * L * t + ritz_RN() * 1.2]); }
      ritz_strich(C, B, pts, sz * ritz_R(.85, 1.15), 'ritz', ritz_R(.7, 1)); } }
  for (let i = 0; i < 40; i++) { const x = ritz_R(0, w), y = ritz_R(h * .3, h), r = ritz_R(.6, 2.2); C.fillStyle = `rgba(220,212,196,${ritz_R(.15, .5)})`; C.beginPath(); C.arc(x, y, r, 0, 6.3); C.fill(); } // abgesplitterte Farbe
  return { c, b }; }
// Material-Parameter für ein Abziehbild mit Höhenrelief
function ritz_tex(c, b) { const T = new THREE.CanvasTexture(c); T.colorSpace = THREE.SRGBColorSpace; T.anisotropy = 8; T.needsUpdate = true; const o = { map: T }; if (b) { const H = new THREE.CanvasTexture(b); H.anisotropy = 8; H.needsUpdate = true; o.bumpMap = H; o.bumpScale = 1.6; } return o; }
// Blutschrift als eigene Ebene: Farbe+Alpha und ein weich verlaufendes Höhenrelief (Wulst an jedem Strich, Tropfen hängen) – mit Klarlack-Glanz beleuchtet wirkt es nass
function ritz_blutFlaeche(w, h, zeilenfn) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const C = c.getContext('2d'); zeilenfn(C);
  { // Blut läuft und zieht ins Material: weicher dunkler Hof unter der Schrift, von den Strichunterkanten laufen Spuren nach unten (Schwerkraft), enden in einem Tropfen
    const t = document.createElement('canvas'); t.width = w; t.height = h; t.getContext('2d').drawImage(c, 0, 0); C.save(); C.globalCompositeOperation = 'destination-over'; C.filter = 'blur(7px)'; C.globalAlpha = .45; C.drawImage(t, 0, 0); C.restore();
    const d = C.getImageData(0, 0, w, h).data; let x = 20 + ritz_R(0, 14); while (x < w - 20) { let yb = -1; for (let y = h - 8; y > 0; y--) if (d[(y * w + (x | 0)) * 4 + 3] > 200) { yb = y; break; }
      if (yb > 0 && ritz_R() < .38) { const L = Math.min(h - yb - 4, ritz_R(18, 85)), lw = ritz_R(1.6, 3.4); if (L > 8) { const g = C.createLinearGradient(0, yb, 0, yb + L); g.addColorStop(0, 'rgba(96,9,8,.92)'); g.addColorStop(.85, 'rgba(78,6,6,.75)'); g.addColorStop(1, 'rgba(70,5,5,.0)');
        C.fillStyle = g; C.fillRect(x - lw / 2, yb - 3, lw, L + 3); C.fillStyle = 'rgba(78,6,6,.7)'; C.beginPath(); C.ellipse(x, yb + L * .9, lw * .75, lw * 1.1, 0, 0, 6.3); C.fill(); } }
      x += ritz_R(16, 44); } }
  const b = document.createElement('canvas'); b.width = w; b.height = h; const B = b.getContext('2d'); B.fillStyle = '#000'; B.fillRect(0, 0, w, h);
  B.filter = 'blur(5px)'; B.drawImage(c, 0, 0); B.filter = 'blur(2px)'; B.globalAlpha = .6; B.drawImage(c, 0, 0); B.filter = 'none'; B.globalAlpha = 1; // Höhe aus der Deckkraft (Alpha → Grau)
  const id = B.getImageData(0, 0, w, h), d = id.data, src = C.getImageData(0, 0, w, h).data; for (let i = 0; i < d.length; i += 4) { const a = Math.min(255, d[i + 3] * 1.0 * 0 + (src[i + 3] * .55 + d[i + 3] * .6)); d[i] = d[i + 1] = d[i + 2] = a; d[i + 3] = 255; } B.putImageData(id, 0, 0);
  return { c, b }; }
function ritz_blutMat(f, glanz = .9) { const T = new THREE.CanvasTexture(f.c); T.colorSpace = THREE.SRGBColorSpace; T.anisotropy = 8; const H = new THREE.CanvasTexture(f.b); H.anisotropy = 8;
  return new THREE.MeshPhysicalMaterial({ map: T, bumpMap: H, bumpScale: 3.2, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, roughness: .3, metalness: 0, clearcoat: glanz, clearcoatRoughness: .08, color: 0xffffff }); }
// ---------------------------------------------------------------- Handschrift in Schreibschrift-Schriftarten (Caveat, Comic Sans …) auf allen Leinwänden der Welt
// Eine Schriftart setzt jeden Buchstaben gleich. Hier wird jeder Buchstabe einzeln gesetzt: eigene Grundlinie, Neigung, Größe, Druck (Deckkraft), dazu ein Zeilendrift –
// so entsteht das unregelmäßige Bild echter Handschrift. Gilt nur für Handschrift-Schriften; Druckschriften (Arial, Courier, Georgia) bleiben unberührt.
{ const P = CanvasRenderingContext2D.prototype, ft = P.fillText, st = P.strokeText, HAND = /Caveat|Comic Sans|Segoe Print|Gochi|Marker|Indie/i; let tief = false;
  const hand = (orig, kind) => function (text, x, y, maxW) {
    if (ECHT.an > 0 && !tief && kind === 'fill' && typeof text === 'string' && !HAND.test(this.font)) { tief = true; try { if (echt_text(this, orig, text, x, y, maxW)) return; } catch (e) {} finally { tief = false; } } // gedruckte/gemalte Schrift auf Schildern und Zetteln: Farbband, Schablone, Abplatzer (echt_text)
    if (tief || maxW !== undefined || typeof text !== 'string' || text.length < 2 || !HAND.test(this.font)) return orig.call(this, text, x, y, maxW);
    const fm = /(\d+(?:\.\d+)?)px/.exec(this.font), sz = fm ? +fm[1] : 20; if (sz < 7) return orig.call(this, text, x, y);
    tief = true; const al = this.textAlign, ga = this.globalAlpha; try {
      const w = this.measureText(text).width, x0 = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x, drift = (Math.random() - .5) * .16 * sz, n = text.length; this.textAlign = 'left';
      for (let i = 0; i < n; i++) { const ch = text[i]; if (ch === ' ') continue; const px = x0 + (i ? this.measureText(text.slice(0, i)).width : 0), t = i / Math.max(1, n - 1) - .5, dy = (Math.random() - .5) * .09 * sz + t * drift, rot = (Math.random() - .5) * .12 + t * .02, sc = .94 + Math.random() * .12;
        this.save(); this.translate(px, y + dy); this.rotate(rot); this.scale(sc, sc * (.97 + Math.random() * .06)); this.globalAlpha = ga * (.82 + Math.random() * .18); orig.call(this, ch, 0, 0); this.restore(); } }
    finally { this.textAlign = al; this.globalAlpha = ga; tief = false; } };
  P.fillText = hand(ft, 'fill'); P.strokeText = hand(st, 'stroke'); }

// ================================================================  ECHT: Pinsel, Spuren und Schrift aus echten Scans (Nutzer 08.10.: „keine generierten Schriften/Zeichnungen, alles echt“)
// Pinsel = Megascans-Brushes (Fab Standard, kostenlos): Hand Print, Hand Smear, Blood Drops, Wipe Marks, Paint Brush, Spray Paint, Moisture Stain, Scratches → assets/ms/pinsel/*.png (weiß + Alpha).
// echt_stempel(x, name, cx, cy, breite, farbe, alpha, drehung, spiegeln) stempelt einen Pinsel in Farbe; echt_wachsKorn(x, w, h) macht aus gezogenen Linien Wachsmal-/Buntstiftstriche
// (Papierzahn + Wischstreifen des Wipe-Marks-Scans); echt_an(fn) schaltet für alles, was fn auf Leinwände schreibt, die Echt-Schrift ein (echt_text): Schreibmaschine mit Farbbandschwankung,
// Schablonenschrift mit Stegen, Abplatzern und Overspray, Druckfarbe mit Papierzahn und Tintenhof – die Texte bleiben, nur die Anmutung ist echt.
const ECHT = { img: {}, an: 0, rs: 4242 };
const echt_R = (a = 0, b = 1) => { ECHT.rs = (ECHT.rs * 1664525 + 1013904223) >>> 0; return a + (b - a) * (ECHT.rs / 4294967296); };
ECHT.p = Promise.all(['hand', 'handblut', 'tropfen', 'wisch', 'farbe', 'spray', 'feucht', 'kratz', 'oel'].map(n => new Promise(r => { const i = new Image(); i.onload = () => { ECHT.img[n] = i; r(); }; i.onerror = () => r(); i.src = n === 'oel' ? 'assets/ms/oel/b.png' : 'assets/ms/pinsel/' + n + '.png'; setTimeout(r, 9000); })));
function echt_an(fn, modus) { const m0 = ECHT.modus; ECHT.an++; ECHT.modus = modus || m0 || 'druck'; try { return fn(); } finally { ECHT.an--; ECHT.modus = m0; } } // modus 'druck' (Standard: Farbband/Toner mit Papierzahn) oder 'schablone' (gesprühte Schablonenschrift mit Stegen, Abplatzern, Overspray)
// Pinsel gefärbt stempeln: Mitte (cx, cy), Breite in Pixeln (Höhe nach Seitenverhältnis), optional Ausschnitt [sx, sy, sw, sh] des Pinselbildes
function echt_stempel(x, name, cx, cy, bw, farbe = '#000', alpha = 1, rot = 0, spiegel = false, ausschnitt = null) {
  const im = ECHT.img[name]; if (!im) return false; const [sx, sy, sw, sh] = ausschnitt || [0, 0, im.width, im.height], bh = bw * sh / sw, W = Math.max(2, Math.min(1024, Math.ceil(bw))), H = Math.max(2, Math.min(1024, Math.ceil(bh * W / bw)));
  const t = document.createElement('canvas'); t.width = W; t.height = H; const c = t.getContext('2d'); c.drawImage(im, sx, sy, sw, sh, 0, 0, W, H); c.globalCompositeOperation = 'source-in'; c.fillStyle = farbe; c.fillRect(0, 0, W, H);
  if (ausschnitt) { const g = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .2, W / 2, H / 2, Math.min(W, H) * .5); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.globalCompositeOperation = 'destination-in'; c.fillStyle = g; c.fillRect(0, 0, W, H); } // Ausschnitt weich auslaufen lassen
  x.save(); x.globalAlpha *= alpha; x.translate(cx, cy); x.rotate(rot); if (spiegel) x.scale(-1, 1); x.drawImage(t, -bw / 2, -bh / 2, bw, bh); x.restore(); return true; }
// Handabdruck: art 'blut' (frische, verschmierte Hand – Hand-Smear-Scan) oder 'trocken' (Staub-/Feuchtabdruck – Hand-Print-Scan); hoehe = Höhe in Pixeln
function echt_hand(x, cx, cy, hoehe, farbe = '#fff', alpha = 1, rot = 0, spiegel = false, art = 'blut') {
  const n = art === 'blut' && ECHT.img.handblut ? 'handblut' : 'hand', im = ECHT.img[n]; if (!im) return false; return echt_stempel(x, n, cx, cy, hoehe * im.width / im.height, farbe, alpha, rot, spiegel); }
// Wachsmal-/Buntstiftkorn: auf eine Leinwand anwenden, die nur die Striche enthält (kleine Hilfsleinwand um den Strich) – Zahn des Papiers + Streifen des Wischscans
function echt_wachsKorn(x, w, h, st = .4) { try { kreideKorn(x, w, h, 64); const W = ECHT.img.wisch; if (!W || w < 4 || h < 4) return;
    const m = document.createElement('canvas'); m.width = w; m.height = h; const c = m.getContext('2d'), k = Math.max(w, h) > 220 ? 1 : 1.6, sw = Math.min(W.width, w / k), sh = Math.min(W.height, h / k), sx = echt_R(0, W.width - sw), sy = echt_R(0, W.height - sh);
    c.globalAlpha = 1 - st; c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.globalAlpha = 1; c.drawImage(W, sx, sy, sw, sh, 0, 0, w, h); c.globalAlpha = .6; c.drawImage(W, sx, sy, sw, sh, 0, 0, w, h); c.globalAlpha = 1; // Alpha ≈ (1 − st) + Streifen (verstärkt)
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(m, 0, 0); x.restore(); } catch (e) {} }
// Schrift mit Wachsmalstift/Buntstift (Name unter einer Zeichnung): erst auf Hilfsleinwand schreiben, dann das Wachskorn drüber
function echt_wachsText(x, text, px, py, font, col, rot = 0) { const m = /(\d+(?:\.\d+)?)px/.exec(font), sz = m ? +m[1] : 16, w = Math.ceil(text.length * sz * .8 + 24), h = Math.ceil(sz * 2), t = document.createElement('canvas'); t.width = w; t.height = h; const c = t.getContext('2d');
  c.font = font; c.fillStyle = col; c.fillText(text, 10, sz * 1.35); echt_wachsKorn(c, w, h); x.save(); x.translate(px, py); x.rotate(rot); x.drawImage(t, -10, -sz * 1.35); x.restore(); }
// Fußabdruck (nackt/Schuhsohle) aus echten Farbspritzern: Ferse, Ballen, fünf Zehen als gestempelte Farb-Pinsel (Paint Brush) – ausgefranste, nasse Ränder statt glatter Ellipsen; links = gespiegelt
function echt_fuss(x, cx, cy, L, farbe, alpha = .7, links = false) { const W0 = ECHT.img.wisch, T0 = ECHT.img.tropfen; if (!W0 || !T0) return false;
  const W = Math.ceil(L * .9), H = Math.ceil(L * 1.15), t = document.createElement('canvas'); t.width = W; t.height = H; const c = t.getContext('2d'); c.translate(W / 2, H / 2); if (links) c.scale(-1, 1); c.fillStyle = '#fff'; c.filter = 'blur(' + Math.max(.8, L * .008) + 'px)';
  const E = (px, py, rx, ry, a = 0) => { c.beginPath(); c.ellipse(px * L, py * L, rx * L, ry * L, a, 0, 7); c.fill(); };
  E(.02, .31, .105, .12); E(.035, .14, .07, .12, .1); E(-.01, -.07, .155, .14); E(.045, .0, .1, .12); // Ferse, Außenkante, Ballen
  [[-.115, -.325, .05, .06], [-.045, -.37, .042, .05], [.02, -.385, .038, .047], [.083, -.368, .034, .043], [.135, -.325, .03, .04]].forEach(([px, py, rx, ry]) => E(px, py, rx, ry)); // fünf Zehen
  c.filter = 'none'; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out'; // nasser Schlamm: Streifen des Wischscans und kleine Löcher aus dem Tropfenscan
  c.globalAlpha = .55; c.drawImage(W0, echt_R(0, W0.width * .4), echt_R(0, W0.height * .4), W0.width * .6, W0.height * .6, 0, 0, W, H); c.globalAlpha = 1;
  for (let i = 0; i < 5; i++) echt_stempel(c, 'tropfen', echt_R(.15, .85) * W, echt_R(.1, .9) * H, L * .09, '#000', .8, echt_R(0, 6), false, [echt_R(0, 600), echt_R(0, 600), 400, 400]);
  c.globalCompositeOperation = 'source-over'; for (let i = 0; i < 4; i++) echt_stempel(c, 'tropfen', echt_R(.05, .95) * W, echt_R(.05, .95) * H, L * .05, '#fff', .9, echt_R(0, 6), false, [echt_R(0, 600), echt_R(0, 600), 240, 240]); // Spritzer daneben
  c.globalCompositeOperation = 'source-in'; c.fillStyle = farbe; c.fillRect(0, 0, W, H);
  x.save(); x.globalAlpha *= alpha; x.drawImage(t, cx - W / 2, cy - H / 2); x.restore(); return true; }
// Kinderhand-Strich (Wachsmalstift/Buntstift): zittrige, leicht schwankende Linie mit wechselndem Druck, überfahrenen Konturen (zweiter Zug daneben), Überschuss am Ende,
// dann Papierzahn + Wischstreifen aus den echten Scans (echt_wachsKorn). pts = [[x, y], …] in Leinwandkoordinaten, lw = Strichbreite, o: { zuege, zittern, druck }
function echt_kind(c, pts, col = '#333', lw = 5, o = {}) { if (!pts || pts.length < 2) return; const zuege = o.zuege ?? 2, zit = o.zittern ?? 1, pad = Math.ceil(lw * 3 + 14), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.floor(Math.min(...xs) - pad), y0 = Math.floor(Math.min(...ys) - pad), W = Math.ceil(Math.max(...xs) + pad) - x0, H = Math.ceil(Math.max(...ys) + pad) - y0; if (W < 2 || H < 2 || W * H > 4e6) return;
  const t = document.createElement('canvas'); t.width = W; t.height = H; const g = t.getContext('2d'); g.translate(-x0, -y0); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = col;
  for (let z = 0; z < zuege; z++) { const ph = echt_R(0, 6.28), ph2 = echt_R(0, 6.28), P = pts.map(p => [p[0], p[1]]); const L = pts.length, a = P[L - 1], b = P[L - 2], dl = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; // Überschuss am Ende
    P[L - 1] = [a[0] + (a[0] - b[0]) / dl * echt_R(0, lw * 1.6), a[1] + (a[1] - b[1]) / dl * echt_R(0, lw * 1.6)];
    let prev = null, dist = 0; for (let i = 1; i < P.length; i++) { const [ax, ay] = P[i - 1], [bx, by] = P[i], len = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(len / 6)), nx = -(by - ay) / (len || 1), ny = (bx - ax) / (len || 1);
      for (let k = 0; k <= n; k++) { const u = k / n, d = dist + len * u, w = Math.sin(d / 23 + ph) * lw * .45 * zit + Math.sin(d / 9 + ph2) * lw * .18 * zit + echt_R(-.5, .5) * zit, X = ax + (bx - ax) * u + nx * w + (z ? echt_R(-1, 1) * lw * .5 : 0), Y = ay + (by - ay) * u + ny * w + (z ? echt_R(-1, 1) * lw * .5 : 0);
        if (prev) { g.globalAlpha = (z ? .5 : .8) * (o.druck ?? 1) * (.65 + .35 * Math.sin(d / 31 + ph2 * 2)); g.lineWidth = lw * (.7 + .5 * (.5 + .5 * Math.sin(d / 17 + ph))) * (z ? .8 : 1); g.beginPath(); g.moveTo(prev[0], prev[1]); g.lineTo(X, Y); g.stroke(); } prev = [X, Y]; } dist += len; } }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; echt_wachsKorn(g, W, H, .4); c.drawImage(t, x0, y0); }
// Ausmalen wie ein Kind: Zickzack-Schraffur über ein Rechteck [x0, y0, x1, y1] (läuft über die Ränder hinaus, ungleiche Abstände)
function echt_schraff(c, r, col, lw = 8, sp = 7, o = {}) { const [x0, y0, x1, y1] = r, pts = []; let up = false; for (let y = y0; y <= y1; y += sp * echt_R(.8, 1.3)) { const a = [x0 + echt_R(-6, 3), y + echt_R(-3, 3)], b = [x1 + echt_R(-3, 7), y + sp * .4 + echt_R(-3, 3)]; if (up) pts.push(b, a); else pts.push(a, b); up = !up; } echt_kind(c, pts, col, lw, { zuege: 1, zittern: .6, ...o }); }
// Kreis/Ellipse als Kinderstrich (nicht ganz geschlossen, Anfang und Ende überlappen)
function echt_kreis(c, cx, cy, rx, ry, col, lw = 5, o = {}) { const pts = [], a0 = echt_R(0, 6.28), n = Math.max(10, Math.ceil(Math.max(rx, ry) / 3)); for (let i = 0; i <= n + 2; i++) { const a = a0 + i / n * 6.28 * 1.04, k = 1 + .05 * Math.sin(a * 2 + a0); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); } echt_kind(c, pts, col, lw, o); }
// Papierflecken: Feuchtigkeit (Moisture-Stain-Scan) als Wasserrand auf einem Blatt
function echt_fleck(x, cx, cy, breite, farbe = 'rgba(120,96,60,1)', alpha = .25, rot = 0) { return echt_stempel(x, 'feucht', cx, cy, breite, farbe, alpha, rot, echt_R() < .5); }
// Kratzer (Scratches-Scan) in eine Fläche: n Stücke, farbe = freigelegtes Material
function echt_kratz(x, w, h, n, farbe, alpha = .8, groesse = .5, seed) { const im = ECHT.img.kratz; if (!im) return false; if (seed !== undefined) ECHT.rs = seed >>> 0;
  for (let i = 0; i < n; i++) { const s = Math.min(im.width, im.height) * echt_R(.28, .5), sx = echt_R(0, im.width - s), sy = echt_R(0, im.height - s), bw = Math.min(w, h) * groesse * echt_R(.7, 1.3);
    echt_stempel(x, 'kratz', echt_R(.15, .85) * w, echt_R(.15, .85) * h, bw, farbe, alpha, echt_R(-.5, .5) + (echt_R() < .5 ? 0 : Math.PI), echt_R() < .5, [sx, sy, s, s]); } return true; }
// Schrift auf Schildern/Zetteln (aus dem fillText-Haken oben, nur innerhalb von echt_an)
function echt_text(ctx, orig, text, x, y, maxW) {
  if (ECHT.modus === 'sauber') return false; // Email, Displays, Glas: keine Papier-/Farbwirkung
  const f = ctx.font, m = /(\d+(?:\.\d+)?)px/.exec(f), sz = m ? +m[1] : 16; if (sz < 9 || sz > 160 || text.trim().length < 2) return false;
  const bold = /bold|[6-9]00/.test(f), mono = /Courier|monospace|Special Elite/i.test(f), serif = /Georgia|Times|serif/i.test(f) && !/sans-serif/i.test(f), gross = ECHT.modus === 'schablone' && bold && !mono && !serif && text === text.toUpperCase() && /[A-ZÄÖÜ]{2}/.test(text) && sz >= 16;
  const tm = ctx.getTransform(), w = ctx.measureText(text).width, al = ctx.textAlign, bl = ctx.textBaseline, pad = sz * .5 + 6, x0 = al === 'center' ? x - w / 2 : (al === 'right' || al === 'end') ? x - w : x;
  const lx = x0 - pad, ly = y - sz * 1.4, lw = w + pad * 2, lh = sz * 2.8, P = [[lx, ly], [lx + lw, ly], [lx, ly + lh], [lx + lw, ly + lh]].map(([a, b]) => [tm.a * a + tm.c * b + tm.e, tm.b * a + tm.d * b + tm.f]);
  const bx = Math.floor(Math.min(...P.map(p => p[0]))), by = Math.floor(Math.min(...P.map(p => p[1]))), bw = Math.ceil(Math.max(...P.map(p => p[0]))) - bx, bh = Math.ceil(Math.max(...P.map(p => p[1]))) - by;
  if (bw < 4 || bh < 4 || bw > 2400 || bh > 1600) return false;
  const sc = document.createElement('canvas'); sc.width = bw; sc.height = bh; const sx = sc.getContext('2d'); sx.setTransform(tm.a, tm.b, tm.c, tm.d, tm.e - bx, tm.f - by); sx.font = f; sx.textAlign = 'left'; sx.textBaseline = bl; sx.fillStyle = ctx.fillStyle; sx.direction = ctx.direction || 'ltr';
  if (mono) { // Schreibmaschine: jeder Anschlag anders – Grundlinie, Neigung, Farbbanddruck, Doppelschlag, halbe Buchstaben
    for (let i = 0; i < text.length; i++) { const ch = text[i]; if (ch === ' ') continue; const px = x0 + ctx.measureText(text.slice(0, i)).width, a = echt_R() < .08 ? echt_R(.3, .5) : echt_R(.68, 1);
      sx.save(); sx.translate(px, y + echt_R(-1, 1) * sz * .03); sx.rotate(echt_R(-1, 1) * .018); sx.globalAlpha = a; orig.call(sx, ch, 0, 0); if (echt_R() < .14) { sx.globalAlpha = a * .4; orig.call(sx, ch, echt_R(.4, .9), echt_R(-.5, .5)); } sx.restore(); } }
  else orig.call(sx, text, x0, y);
  if (gross) { // Schablone: Stege in geschlossenen Buchstaben (O, D, A, B …)
    sx.save(); sx.globalCompositeOperation = 'destination-out'; sx.fillStyle = '#000'; const cap = sz * .72, yb = bl === 'middle' ? y + cap / 2 : bl === 'top' || bl === 'hanging' ? y + cap : bl === 'bottom' ? y - sz * .2 : y, gap = Math.max(1.3, sz * .055);
    for (let i = 0; i < text.length; i++) { if (!/[ABDOPQRÄÖ04689]/.test(text[i])) continue; const cx = x0 + ctx.measureText(text.slice(0, i)).width, cw = ctx.measureText(text[i]).width; sx.fillRect(cx + cw * .02, yb - cap * .5 - gap / 2, cw * .24, gap); sx.fillRect(cx + cw * .72, yb - cap * .5 - gap / 2, cw * .26, gap); }
    sx.restore(); }
  // Druck: Farbe sitzt auf dem Papierzahn – unmaskierte Schrift als Tintenhof (Grundstärke), darüber die gekörnte; Schablone: volle Deckkraft mit Abplatzern aus dem Tropfenscan und Kratzern
  const sy = document.createElement('canvas'); sy.width = bw; sy.height = bh; const yx = sy.getContext('2d'); yx.drawImage(sc, 0, 0);
  if (gross) { yx.globalCompositeOperation = 'destination-out'; echt_kratz(yx, bw, bh, 1 + Math.floor(bw / 260), '#000', .6, .45); // Abplatzer: Kratzer und Ausbrüche in der Farbe
    for (let i = 0, n = 2 + Math.floor(bw / 70); i < n; i++) echt_stempel(yx, 'tropfen', echt_R(0, bw), echt_R(bh * .2, bh * .8), sz * echt_R(.25, .6), '#000', echt_R(.6, 1), echt_R(0, 6), false, [echt_R(0, 600), echt_R(0, 600), 380, 380]);
    yx.globalCompositeOperation = 'source-over'; }
  else kreideKorn(yx, bw, bh, Math.max(96, Math.min(bw, bh) * .6));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (gross) { ctx.save(); ctx.filter = 'blur(' + Math.max(1, sz * .035) + 'px)'; ctx.globalAlpha *= .16; ctx.drawImage(sc, bx, by); ctx.restore(); // Overspray: weicher Farbhof und feine Sprühpunkte
    for (let i = 0, n = Math.floor(bw / 4); i < n; i++) { const a = echt_R(0, bw), b = echt_R(bh * .25, bh * .75); ctx.save(); ctx.globalAlpha *= echt_R(.1, .35); ctx.fillStyle = sx.fillStyle; ctx.beginPath(); ctx.arc(bx + a, by + b, echt_R(.4, 1), 0, 7); ctx.fill(); ctx.restore(); } }
  else { ctx.save(); ctx.globalAlpha *= mono ? .35 : .6; ctx.drawImage(sc, bx, by); ctx.restore(); }
  ctx.drawImage(sy, bx, by); ctx.restore(); return true; }
WORLD_MODS.unshift(['Echt-Pinsel', async () => { await ECHT.p; }]); // als Erstes: alle Pinsel (Hände, Kratzer, Kreide, Spritzer) sind geladen, bevor die Module ihre Leinwände malen
WORLD_MODS.push(['Ritzschrift', async () => {}]);
window.__ritz = { kratzer: ritz_kratzer, flaeche: ritz_flaeche, zeile: ritz_zeile, breite: ritz_breite, blut: ritz_blutFlaeche }; // Testzugriff
