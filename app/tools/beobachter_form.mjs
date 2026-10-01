// R-21 · Der Beobachter, Gestalt: das vorhandene Modell („Cute Alien Pet“, MissTxxT) wird wie mit Modellier-Pinseln umgeformt –
// kein neues Netz, nur die vorhandenen Ecken verschoben (Kanon: großer runder Kopf, große dunkle Augen, kein Mund, zwei Fühler, drei Finger, drei lange Zehen).
// Aus dem Plüschtier wird ein Wesen mit Kindchenschema, das nicht ganz stimmt: dünner Hals, schmaler Rumpf mit kleinem Bauch, dünne Glieder mit
// Knie und Ellenbogen, zu lange Arme, drei lange Finger mit geschwollenen Kuppen, drei lange Zehen, Rippen unter zu dünner Haut, eingesunkene Augenhöhlen.
// Eingabe: three-Szene des Originals. Ausgabe: Teile { name, pos (Float32, Meter, +z vorn, Füße auf 0), nrm, uv, idx } – Normalen neu berechnet.
import * as THREE from 'three';
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, k) => a + (b - a) * k;
const gau = (x, c, w) => { const u = (x - c) / w; return Math.exp(-u * u); };
// ---------------------------------------------------------------- Netz-Werkzeuge
function weld(pos) { const key = new Map(), id = new Int32Array(pos.length / 3); let n = 0; // gleiche Lage = gleicher Punkt (Naht der UV-Inseln)
  for (let i = 0; i < id.length; i++) { const k = Math.round(pos[i * 3] * 2e5) + ',' + Math.round(pos[i * 3 + 1] * 2e5) + ',' + Math.round(pos[i * 3 + 2] * 2e5); let j = key.get(k); if (j === undefined) { j = n++; key.set(k, j); } id[i] = j; } return { id, n }; }
function nachbarn(idx, W) { const nb = Array.from({ length: W.n }, () => new Set()); for (let t = 0; t < idx.length; t += 3) for (let k = 0; k < 3; k++) { const a = W.id[idx[t + k]], b = W.id[idx[t + (k + 1) % 3]]; if (a !== b) { nb[a].add(b); nb[b].add(a); } } return nb.map(s => [...s]); }
// Glätten (Laplace) mit Gewicht je Punkt 0…1 – zum Wegschmelzen von Mund-Rille und Daumen
function glaetten(P, idx, gew, iter) { const W = weld(P), nb = nachbarn(idx, W), q = new Float64Array(W.n * 3), w = new Float64Array(W.n), cnt = new Int32Array(W.n);
  for (let i = 0; i < W.id.length; i++) { const j = W.id[i]; if (cnt[j]++) continue; q[j * 3] = P[i * 3]; q[j * 3 + 1] = P[i * 3 + 1]; q[j * 3 + 2] = P[i * 3 + 2]; w[j] = gew(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); }
  const tmp = new Float64Array(W.n * 3); for (let it = 0; it < iter; it++) { for (let j = 0; j < W.n; j++) { const L = nb[j]; if (!w[j] || !L.length) { tmp[j * 3] = q[j * 3]; tmp[j * 3 + 1] = q[j * 3 + 1]; tmp[j * 3 + 2] = q[j * 3 + 2]; continue; }
      let x = 0, y = 0, z = 0; for (const k of L) { x += q[k * 3]; y += q[k * 3 + 1]; z += q[k * 3 + 2]; } const a = w[j] * .6; tmp[j * 3] = lerp(q[j * 3], x / L.length, a); tmp[j * 3 + 1] = lerp(q[j * 3 + 1], y / L.length, a); tmp[j * 3 + 2] = lerp(q[j * 3 + 2], z / L.length, a); } q.set(tmp); }
  for (let i = 0; i < W.id.length; i++) { const j = W.id[i]; P[i * 3] = q[j * 3]; P[i * 3 + 1] = q[j * 3 + 1]; P[i * 3 + 2] = q[j * 3 + 2]; } }
export function normalen(P, idx) { const W = weld(P), acc = new Float64Array(W.n * 3);
  for (let t = 0; t < idx.length; t += 3) { const a = idx[t], b = idx[t + 1], c = idx[t + 2]; const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; for (const i of [a, b, c]) { const j = W.id[i]; acc[j * 3] += nx; acc[j * 3 + 1] += ny; acc[j * 3 + 2] += nz; } }
  const N = new Float32Array(P.length); for (let i = 0; i < W.id.length; i++) { const j = W.id[i], l = Math.hypot(acc[j * 3], acc[j * 3 + 1], acc[j * 3 + 2]) || 1; N[i * 3] = acc[j * 3] / l; N[i * 3 + 1] = acc[j * 3 + 1] / l; N[i * 3 + 2] = acc[j * 3 + 2] / l; } return N; }
// Mittellinie einer Punktmenge je Höhenscheibe (geglättet) → Funktion y → [cx, cz]
function achse(P, filt, y0, y1, n) { const sx = new Float64Array(n), sz = new Float64Array(n), c = new Float64Array(n);
  for (let i = 0; i < P.length; i += 3) { const x = P[i], y = P[i + 1], z = P[i + 2]; if (y < y0 || y >= y1 || !filt(x, y, z)) continue; const k = Math.floor((y - y0) / (y1 - y0) * n); sx[k] += x; sz[k] += z; c[k]++; }
  const cx = [], cz = []; for (let k = 0; k < n; k++) { cx.push(c[k] ? sx[k] / c[k] : NaN); cz.push(c[k] ? sz[k] / c[k] : NaN); }
  for (const a of [cx, cz]) { for (let k = 0; k < n; k++) if (isNaN(a[k])) a[k] = a[k - 1] ?? a.find(v => !isNaN(v)); for (let it = 0; it < 3; it++) for (let k = 1; k < n - 1; k++) a[k] = (a[k - 1] + a[k] * 2 + a[k + 1]) / 4; }
  return y => { const f = Math.max(0, Math.min(n - 1.001, (y - y0) / (y1 - y0) * n - .5)), k = Math.floor(f), u = f - k; return [lerp(cx[k], cx[k + 1], u), lerp(cz[k], cz[k + 1], u)]; }; }
// ---------------------------------------------------------------- Maße (Original, Meter): Beine 0….10, Rumpf .10….41, Kopf .334….66, Fühler bis .82, Augen y≈.493
export const FORM = { bein: .125, hals: .1, kopfS: .87, armL: .42, finger: 3.1, fuss: .045, endH: .82 };
export function umformen(teile) { // teile: { arm, koerper, kopf, augen } je { pos, idx, uv }
  const F = FORM, A = teile.arm.pos, K = teile.koerper.pos, H = teile.kopf.pos, E = teile.augen.pos;
  // 1) Mund-Rille und Nasenansatz im Kopf wegschmelzen (kein sichtbarer Mund, Dossier §2)
  glaetten(H, teile.kopf.idx, (x, y, z) => z > .09 ? sm(.08, .035, Math.hypot(x / 1.3, y - .45)) : 0, 140);
  glaetten(K, teile.koerper.idx, (x, y, z) => z < -.09 ? sm(.05, .02, Math.abs(x)) * sm(.1, .115, y) * sm(.18, .16, y) : 0, 40); // Grübchen am Rücken
  // 2) Daumen-Knubbel der Hände wegschmelzen (drei Finger, nicht vier)
  for (let i = 0; i < A.length; i += 3) { const y = A[i + 1], z = A[i + 2]; if (y > .145 && y < .182 && z > .01) { const w = sm(.145, .15, y) * sm(.182, .172, y); A[i + 2] = lerp(z, .01 + (z - .01) * .12, w); } }
  glaetten(A, teile.arm.idx, (x, y, z) => z > .0 && y > .142 && y < .185 ? sm(0, .01, z) * .7 : 0, 25);
  // Achsen messen (vor dem Verformen)
  const beinL = achse(K, x => x > 0, 0, .1, 10), beinR = achse(K, x => x < 0, 0, .1, 10), rumpf = achse(K, () => true, .095, .42, 14);
  const armL = achse(A, x => x > 0, .125, .36, 12), armR = achse(A, x => x < 0, .125, .36, 12);
  // Rumpf-Verformung (auch für die Schulterpunkte der Arme)
  const off = y => F.bein * sm(.022, .1, y); // Beine länger: Fuß bleibt, Unterschenkel und Oberschenkel strecken sich
  const halsHub = y => F.hals * sm(.318, .376, y);
  const rumpfF = (x, y, z) => { if (y < .09) return [x, y + off(y), z]; const [cx, cz] = rumpf(y), dx = x - cx, dz = z - cz;
    const k = 1;
    // Profil: Hüfte, kleiner Bauch, schmale Taille, Brustkorb, Schultern – dann der dünne Hals
    const pf = (pts) => { for (let n = 1; n < pts.length; n++) if (y <= pts[n][0]) return lerp(pts[n - 1][1], pts[n][1], sm(pts[n - 1][0], pts[n][0], y)); return pts[pts.length - 1][1]; };
    let fx = lerp(1, pf([[.09, .76], [.14, .72], [.2, .66], [.26, .68], [.3, .74], [.33, .74]]), k);
    let fz = lerp(1, dz > 0 ? pf([[.09, .78], [.16, .84], [.21, .82], [.26, .7], [.33, .66]]) : pf([[.09, .7], [.16, .62], [.22, .66], [.28, .68], [.33, .64]]), k);
    const kh = sm(.296, .366, y), ke = 1 - (1 - kh) ** 1.6; fx = lerp(fx, .27, ke); fz = lerp(fz, .33, ke); // abfallende Schultern in den Hals
    return [cx + dx * fx, y + off(y) + halsHub(y), cz + dz * fz]; };
  for (let i = 0; i < K.length; i += 3) { let x = K[i], y = K[i + 1], z = K[i + 2];
    if (y < .11) { const s = x > 0 ? 1 : -1, ax = s > 0 ? beinL(Math.min(y, .095)) : beinR(Math.min(y, .095)), dx = x - ax[0], dz = z - ax[1];
      // Beine dünn: Fuß bleibt breit (süß), Knöchel schmal, Wade/Knie, Oberschenkel etwas voller, am Schritt zurück auf 1
      const r = y < .02 ? 1 : y < .035 ? lerp(1, .56, sm(.02, .035, y)) : y < .06 ? lerp(.56, .6, sm(.035, .06, y)) : y < .095 ? lerp(.6, .74, sm(.06, .095, y)) : .74;
      const knie = gau(y, .055, .012) * .006; // Kniescheibe vorn
      const nx = ax[0] + dx * r, nz = ax[1] + dz * r + (dz > 0 ? knie : 0); const k = sm(.078, .11, y); const [tx, ty, tz] = rumpfF(x, y, z);
      K[i] = lerp(nx, tx, k); K[i + 1] = lerp(y + off(y), ty, k); K[i + 2] = lerp(nz, tz, k); }
    else { const [tx, ty, tz] = rumpfF(x, y, z); K[i] = tx; K[i + 1] = ty; K[i + 2] = tz; } }
  // 3) Zehen: der Fuß-Stumpf teilt sich vorn in drei lange Zehen (Rillen dazwischen, Zehen nach vorn gezogen)
  for (let i = 0; i < K.length; i += 3) { const y = K[i + 1]; if (y > .05) continue; const s = K[i] > 0 ? 1 : -1, ax = s > 0 ? beinL(.005) : beinR(.005), u = (K[i] - ax[0]) / .05, z = K[i + 2];
    const vorn = sm(-.005, .045, z), lobe = Math.max(...[-.62, 0, .62].map(c => gau(u, c, .2))), rille = 1 - lobe;
    const hk = sm(.05, .015, y); // nur unten
    K[i + 2] = z + F.fuss * vorn * hk * (lobe * 1.0 - rille * .35); K[i + 1] = y - rille * vorn * hk * .006 * sm(.004, .02, y); K[i] = ax[0] + (K[i] - ax[0]) * lerp(1, .9, vorn * hk); }
  // 4) Arme: an die schmaleren Schultern, dünn, länger (Hände bis an die Knie), Ellenbogen, drei lange Finger mit Kuppen
  // Fingerachsen: je Hand drei Häufchen (k-Mittel über x/z der Ecken unter dem Handballen)
  const fz0 = [-.034, -.014, .006], FC = { 1: [], '-1': [] };
  for (const s of [1, -1]) { let c = fz0.map(z => [.211 * s, z]); for (let it = 0; it < 12; it++) { const acc = c.map(() => [0, 0, 0]);
      for (let i = 0; i < A.length; i += 3) { if (A[i + 1] > .143 || Math.sign(A[i]) !== s) continue; let b = 0, bd = 1e9; c.forEach((q, k) => { const d = (A[i] - q[0]) ** 2 + (A[i + 2] - q[1]) ** 2; if (d < bd) { bd = d; b = k; } }); acc[b][0] += A[i]; acc[b][1] += A[i + 2]; acc[b][2]++; }
      c = c.map((q, k) => acc[k][2] ? [acc[k][0] / acc[k][2], acc[k][1] / acc[k][2]] : q); } FC[s] = c; }
  const fing = i => { const s = A[i] > 0 ? 1 : -1, c = FC[s]; let b = c[0], bd = 1e9; for (const q of c) { const d = (A[i] - q[0]) ** 2 + (A[i + 2] - q[1]) ** 2; if (d < bd) { bd = d; b = q; } } return b; };
  for (let i = 0; i < A.length; i += 3) { const x = A[i], y = A[i + 1], z = A[i + 2], s = x > 0 ? 1 : -1, ax = s > 0 ? armL : armR;
    const sh = [.128 * s, .345, -.01], [sx2, , sz2] = rumpfF(sh[0], sh[1], sh[2]), shOff = [sx2 - sh[0], 0, sz2 - sh[2]];
    const yc = Math.min(Math.max(y, .15), .35), [cx, cz] = ax(yc), dx = x - cx, dz = z - cz, t = Math.max(0, Math.min(1, (.35 - y) / .2)); // 0 Schulter … 1 Hand
    const r = t < .06 ? lerp(1, .78, t / .06) : lerp(.74, .62, sm(.2, .55, t)) * (1 + .1 * gau(t, .5, .07)) + .12 * sm(.8, 1, t); // dünner, Ellenbogen, Hand etwas breiter
    let nx = cx + dx * r, ny = y, nz = cz + dz * r;
    ny -= F.armL * .22 * sm(.05, 1, t) * t; // Unterarm länger
    if (y < .147) { const d = .147 - y, fc = fing(i), kup = 1 - .2 * sm(.003, .01, d) * (1 - sm(.011, .017, d)) + .3 * gau(d, .017, .0045); // Finger: lang und dünn, die Kuppe geschwollen
      ny -= d * (F.finger - 1); nx = fc[0] * r + cx * (1 - r) + (x - fc[0]) * kup; nz = fc[1] * r + cz * (1 - r) + (z - fc[1]) * kup; }
    if (t < .22) { const w = 1 - t / .22; ny -= .016 * w * w; nx -= s * .01 * w; } // Schulterkappe unter die abfallende Schulter
    A[i] = nx + shOff[0]; A[i + 1] = ny + off(.2) + halsHub(.3); A[i + 2] = nz + shOff[2]; }
  // 5) Kopf: etwas kleiner (Körper wirkt länger), sitzt auf dem gestreckten Hals; eingesunkene Augenhöhlen, leichter Brauenwulst
  const kopfFuss = [0, .334, .03], hub = off(.2) + F.hals; const eL = [.084, .493, .114];
  const kopfT = (P, haut) => { for (let i = 0; i < P.length; i += 3) { let x = P[i], y = P[i + 1], z = P[i + 2];
    if (haut) { const ex = Math.abs(x) - eL[0], ey = y - eL[1], d = Math.hypot(ex / 1.0, ey / .95); if (z > .05) { const rim = gau(d, .06, .014), brow = gau(d, .07, .016) * sm(.0, .03, ey) * sm(.06, .02, Math.abs(ex));
        const nlen = Math.hypot(x, y - .48, z - .02) || 1, k = -.004 * rim + .0035 * brow; x += x / nlen * k; y += (y - .48) / nlen * k; z += (z - .02) / nlen * k; } }
    P[i] = kopfFuss[0] + (x - kopfFuss[0]) * F.kopfS; P[i + 1] = kopfFuss[1] + (y - kopfFuss[1]) * F.kopfS + hub; P[i + 2] = kopfFuss[2] + (z - kopfFuss[2]) * F.kopfS; } };
  kopfT(H, true); kopfT(E, false);
  // 6) Auf Endhöhe bringen
  let top = -1e9, bot = 1e9; for (const P of [A, K, H, E]) for (let i = 1; i < P.length; i += 3) { top = Math.max(top, P[i]); bot = Math.min(bot, P[i]); }
  const S = F.endH / (top - bot); for (const P of [A, K, H, E]) for (let i = 0; i < P.length; i += 3) { P[i] *= S; P[i + 1] = (P[i + 1] - bot) * S; P[i + 2] *= S; }
  return { S, hub, kopfFuss, kopfS: F.kopfS };
}
