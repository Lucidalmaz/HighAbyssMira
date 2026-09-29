// =====================================================================  FEUER (Modul „feuer“): Das Ölfass im langen Gang, Onkel Peter brennt, Flucht vor dem Rauch
// Kanon: Der Zahn-Mann ist Peter Kranz – Mamas Bruder, die Kopie von 1975, seit 1992 auf Ebene −2 eingesperrt. Er jagt nicht aus Bosheit, er sucht den Ausgang.
// Ablauf:
//  1) Im Prüfraum (= Peters Zelle, PK-D K2-4) liegt auf der Matratze sein Feuerzeug: Messing, „P. K.“, Rückseite „Für Peter. Damit du im Dunkeln nicht allein bist. – M.“
//     (Marion, Lukes Mutter). Das Feuerzeug ist Pflicht: die östliche Stahltür (spiderDoorOut) entriegelt erst, wenn Luke es genommen hat; 20 s nach dem Schwarm
//     wird „Die Matratze. Da glänzt was.“ zur Aufgabe.
//  2) Die Brandschutztür zum Messraum (chaseDoor) ist von Anfang an zu: „Notentriegelung nur bei Brandalarm“. Einen Weg ohne Feuer gibt es nicht.
//     Am Ende des langen Gangs steht ein Fass Heizöl. Während der Jagd: E → Luke wirft sich dagegen, es kippt und rollt (Drehung um die eigene Achse,
//     Sprünge an den Sicken, Rollgeräusch) zurück in den Gang, trifft den Verfolger, er stürzt, das Öl läuft um ihn herum aus.
//  3) „Das Öl anzünden“ → Zwischensequenz (Handkamera): die Flamme läuft über das Öl, er brennt, richtet sich noch einmal auf, greift an Luke
//     vorbei zur Tür (er wollte raus), bricht zusammen. Musik offline gerendert (Blech, Taiko, steigende Streicher, dann Lucys Motiv auf dem Cello).
//     Zögert Luke zu lange, rappelt er sich auf und rutscht im Öl noch einmal weg – beim dritten Mal kommt er durch (dann: Tod, Speicherpunkt „Der lange Gang“).
//  4) Brandalarm: die Brandschutztür bleibt zu. 30 Sekunden Luft. Schwarzer Heizölrauch sammelt sich unter der Decke und sinkt, Husten, Herz, Atem, der Klang wird dumpf,
//     das Bild läuft zu. Rote Rundumleuchte an der Notentriegelung (E halten), kalte Luft pfeift unter der Tür. Wer es nicht schafft, stirbt (Modul tod).
// Bild: Flammen als Rausch-Shader (drei Schichten: Flammenwände, Zungen, heller Kern), Funken/Glut, volumetrisch wirkender, vom Feuer angestrahlter Rauch,
//       Hitzeflimmern (eigener Nachbearbeitungs-Durchgang, ohne Feuer wirkungslos), flackerndes Schattenlicht, danach Ruß an Decke, Wänden und Boden.
// Leistung: alle Lichter, Durchgänge und Partikelsysteme entstehen beim Laden (Intensität/Anzahl 0) – nie .visible an Lichtern schalten. Keine Zuweisungen pro Bild.
const feuer_S = { phase: 'idle', lighter: false, done: false, items: false, run: 0, t: 0, H: 0, burnR: 0, spread: 1.1, zs: null, air: 30, hold: 0, said: {}, cues: null, cueBusy: false, snd: {}, lightModes: null, lines: [], soot: 0, frame: 0 };
const FEU = { bx: X + 104.3, bz: Z - .9, tip: 1, r: .29, h: .86, relX: X + 103.0, relZ: Z + 1.84, oilW: 6.4, oilD: 3.64, fw: 256, fh: 146 };
// ---------------------------------------------------------------- Texturen (prozedural, einmal beim Laden)
function feuer_canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function feuer_texDot() { return new THREE.CanvasTexture(feuer_canvas(32, 32, (x, w) => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, '#fff'); g.addColorStop(.35, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); })); }
function feuer_texSoot(w, h, vertical) { const t = new THREE.CanvasTexture(feuer_canvas(w, h, (x) => { x.clearRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) { const px = Math.random() * w, py = vertical ? h * (.25 + Math.random() * .75) : Math.random() * h, r = 8 + Math.random() * (vertical ? 40 : 60), g = x.createRadialGradient(px, py, 0, px, py, r); const a = vertical ? .1 + .25 * (py / h) : .16;
    g.addColorStop(0, `rgba(8,6,5,${a})`); g.addColorStop(1, 'rgba(8,6,5,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
  if (vertical) for (let i = 0; i < 40; i++) { const px = Math.random() * w, g = x.createLinearGradient(0, h, 0, h * (.1 + Math.random() * .4)); g.addColorStop(0, 'rgba(6,5,4,.55)'); g.addColorStop(1, 'rgba(6,5,4,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(px - 18 - Math.random() * 20, h); x.quadraticCurveTo(px + (Math.random() - .5) * 40, h * .5, px + (Math.random() - .5) * 20, h * (.1 + Math.random() * .3)); x.quadraticCurveTo(px + 30, h * .6, px + 22 + Math.random() * 20, h); x.fill(); }
  const e = x.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(0,0,0,1)'); e.addColorStop(.12, 'rgba(0,0,0,0)'); e.addColorStop(.88, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(0,0,0,1)'); x.globalCompositeOperation = 'destination-out'; x.fillStyle = e; x.fillRect(0, 0, w, h); })); t.colorSpace = THREE.SRGBColorSpace; return t; }
// ---------------------------------------------------------------- Partikel: Billboards als Instanzen (ein Zeichenaufruf je Schicht); Aussehen im Shader aus Rauschen
const FEU_NOISE = `float fH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float fN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(fH(i), fH(i + vec2(1., 0.)), f.x), mix(fH(i + vec2(0., 1.)), fH(i + vec2(1., 1.)), f.x), f.y); }
  float fB(vec2 p){ return fN(p) * .5 + fN(p * 2.03 + 1.7) * .3 + fN(p * 4.11 + 3.1) * .2; }`;
const FEU_VS = `attribute vec3 iPos; attribute vec4 iD; uniform float uCyl, uAsp; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW;
  void main(){ vUv = uv; vAge = iD.y; vSeed = iD.w;
    vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vec3 camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 r = mix(camR, normalize(vec3(camR.x, 0., camR.z) + vec3(1e-4, 0., 0.)), uCyl); vec3 u = mix(camU, vec3(0., 1., 0.), uCyl);
    float c = cos(iD.z), s = sin(iD.z); vec2 p = position.xy; p.y = (p.y + .5 * uCyl) * uAsp - .12 * uCyl * uAsp; p = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    vW = iPos + (r * p.x + u * p.y) * iD.x; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.); }`;
// Flamme: turbulentes Rauschen steigt durch eine sich verjüngende Form; Temperatur → weiß – gelb – orange – rot – Ruß
const FEU_FS_FLAME = `uniform float uTime, uInt, uCore; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW; ${FEU_NOISE}
  void main(){ float y = vUv.y, t = uTime * 1.6 + vSeed * 13.;
    // Hülle: unten breit und rund, oben schmal; Rauschen, das nach oben strömt, frisst sie zu Zungen an
    vec2 q = vec2(vUv.x * 3.1 + vSeed * 7.3, y * 2.6 - t * 2.2); float nz = fB(q + vec2(fB(q * .8 + vec2(0., t * .6)) * 1.1 - .55, 0.));
    float x = (vUv.x - .5 + (nz - .5) * .38 * y) * 2.; float env = (1. - x * x * (1.6 + y * 2.4)) * (1. - y * .92) * smoothstep(0., .14, y);
    float f = env * (nz * 1.45 + .12 + uCore * .35 * (1. - y)) - y * .16;
    float heat = smoothstep(.1, .95, f) * smoothstep(0., .12, vAge) * (1. - smoothstep(.5, 1., vAge));
    if (heat < .02) discard;
    vec3 col = mix(vec3(.35, .04, .01), vec3(.95, .26, .03), smoothstep(.02, .28, heat)); col = mix(col, vec3(1., .58, .14), smoothstep(.28, .6, heat)); col = mix(col, vec3(1., .88, .62), smoothstep(.6, .95, heat) * (.35 + .65 * uCore));
    float a = clamp(heat * 1.3, 0., 1.); gl_FragColor = vec4(col * uInt * (.35 + heat * .8) * a, a * .42); }`;
// Rauch: weiche, rollende Schwaden; von unten und zum Feuer hin orange angestrahlt; nah an der Kamera ausgeblendet (keine bildfüllenden Flächen)
const FEU_FS_SMOKE = `uniform float uTime, uA, uGlow; uniform vec3 uCol, uGlowPos; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW; ${FEU_NOISE}
  void main(){ vec2 q = vUv - .5; float r = length(q) * 2.;
    float n1 = fB(vUv * 2.2 + vec2(vSeed * 9., uTime * .06 + vAge * .9)), n2 = fB(vUv * 4.6 - vec2(uTime * .08 + vAge, vSeed * 3.));
    float d = smoothstep(1., .15, r + (n1 - .5) * .9) * (.5 + .5 * n2);
    float a = d * smoothstep(0., .2, vAge) * (1. - smoothstep(.6, 1., vAge)) * uA * smoothstep(.5, 2.2, distance(vW, cameraPosition)); if (a < .004) discard;
    float lit = uGlow * exp(-distance(vW, uGlowPos) * .33) * (1.15 - vUv.y * .7) * (.55 + .45 * n2);
    gl_FragColor = vec4(uCol * (.65 + .6 * n1) + vec3(1., .42, .12) * lit, min(a, .9)); }`;
const FEU_FS_DOT = `uniform sampler2D map; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW;
  void main(){ float a = texture2D(map, vUv).r * (1. - smoothstep(.55, 1., vAge)) * (.55 + .45 * sin(vAge * 40. + vSeed * 20.)); if (a < .01) discard; gl_FragColor = vec4(mix(vec3(1., .8, .45), vec3(1., .35, .08), vAge) * 1.6, a); }`;
function feuer_sys(N, mat, order) {
  const pl = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry(); g.index = pl.index; g.setAttribute('position', pl.attributes.position); g.setAttribute('uv', pl.attributes.uv);
  const ip = new THREE.InstancedBufferAttribute(new Float32Array(N * 3), 3), id = new THREE.InstancedBufferAttribute(new Float32Array(N * 4), 4); ip.setUsage(THREE.DynamicDrawUsage); id.setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', ip); g.setAttribute('iD', id); g.instanceCount = 0; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = order; m.userData.noCol = true; m.castShadow = false; m.receiveShadow = false; scene.add(m);
  const F = () => new Float32Array(N); return { m, g, ip, id, N, n: 0, x: F(), y: F(), z: F(), vx: F(), vy: F(), vz: F(), age: F(), life: F(), size: F(), s1: F(), rot: F(), rv: F(), seed: F() };
}
function feuer_emit(P, x, y, z, vx, vy, vz, life, size, size1, rot, rv) {
  if (P.n >= P.N) return; const i = P.n++; P.x[i] = x; P.y[i] = y; P.z[i] = z; P.vx[i] = vx; P.vy[i] = vy; P.vz[i] = vz; P.age[i] = 0; P.life[i] = life; P.size[i] = size; P.s1[i] = size1; P.rot[i] = rot; P.rv[i] = rv; P.seed[i] = Math.random();
}
// kind: 0 Flamme, 1 Rauch (steigt bis unter die Decke, breitet sich aus, zieht zur Tür, sinkt ab), 2 Funken/Glut (wirbeln, fallen, Streifen in Flugrichtung)
function feuer_step(P, dt, kind, t) {
  const ip = P.ip.array, id = P.id.array, ceil = feuer_S.ceil;
  for (let i = 0; i < P.n; i++) {
    P.age[i] += dt; if (P.age[i] >= P.life[i]) { const j = --P.n; if (i !== j) { P.x[i] = P.x[j]; P.y[i] = P.y[j]; P.z[i] = P.z[j]; P.vx[i] = P.vx[j]; P.vy[i] = P.vy[j]; P.vz[i] = P.vz[j]; P.age[i] = P.age[j]; P.life[i] = P.life[j]; P.size[i] = P.size[j]; P.s1[i] = P.s1[j]; P.rot[i] = P.rot[j]; P.rv[i] = P.rv[j]; P.seed[i] = P.seed[j]; } i--; continue; }
    if (kind === 0) { P.vy[i] *= 1 - dt * .5; P.vx[i] += Math.sin(t * 2.3 + P.seed[i] * 30) * dt * .25; }
    else if (kind === 1) { if (P.y[i] > ceil) { P.vy[i] = Math.min(P.vy[i], 0) - dt * .04; P.vx[i] = Math.min(.5, P.vx[i] + dt * .14); } else if (P.y[i] < ceil - .6) P.vy[i] += dt * .06; P.vz[i] *= 1 - dt * .4; if (P.z[i] > Z + 1.5 || P.z[i] < Z - 1.5) P.vz[i] = -P.vz[i] * .5; }
    else { P.vx[i] += Math.sin(t * 7 + P.seed[i] * 50) * dt * 1.6; P.vz[i] += Math.cos(t * 6 + P.seed[i] * 40) * dt * 1.6; P.vy[i] -= dt * (P.seed[i] > .6 ? 2.2 : .3); P.rot[i] = Math.atan2(-P.vx[i], P.vy[i]); }
    P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt; P.z[i] += P.vz[i] * dt; if (kind !== 2) P.rot[i] += P.rv[i] * dt;
    const k = P.age[i] / P.life[i]; ip[i * 3] = P.x[i]; ip[i * 3 + 1] = P.y[i]; ip[i * 3 + 2] = P.z[i];
    id[i * 4] = P.size[i] + (P.s1[i] - P.size[i]) * (kind === 0 ? Math.sin(k * 3.14) : k); id[i * 4 + 1] = k; id[i * 4 + 2] = P.rot[i]; id[i * 4 + 3] = P.seed[i];
  }
  P.g.instanceCount = P.n; if (P.n) { P.ip.needsUpdate = true; P.id.needsUpdate = true; }
}
// ---------------------------------------------------------------- Öl: „Ankunftszeit“-Feld (1 = sofort nass, 0 = nie) – wird beim Auslaufen berechnet
function feuer_hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function feuer_noise(x, y) { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = feuer_hash(ix, iy), b = feuer_hash(ix + 1, iy), c = feuer_hash(ix, iy + 1), d = feuer_hash(ix + 1, iy + 1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
function feuer_field(ox, oz, bodyX) {
  const S = feuer_S, W = FEU.fw, Hh = FEU.fh, f = S.field, cx = S.oilX, img = S.fieldCtx.createImageData(W, Hh), pts = [], seed = Math.random() * 100;
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const wx = cx + (i / (W - 1) - .5) * FEU.oilW, wz = Z + (j / (Hh - 1) - .5) * FEU.oilD;
    // zwei Quellen: das Spundloch am Fass und die Senke unter dem Körper (das Öl läuft um ihn herum); Richtung Tür kaum Öl
    const d1 = Math.hypot((wx - ox) * .9, (wz - oz) * 1.15), d2 = Math.hypot((wx - bodyX) * .75, (wz - Z) * 1.2) + .35;
    const n = feuer_noise(wx * 1.6 + seed, wz * 1.6) * .65 + feuer_noise(wx * 4.1 + seed, wz * 4.1) * .35;
    let v = 1 - Math.min(d1, d2) * (.72 + .6 * n) / 2.5; if (Math.abs(wz - Z) > 1.78) v = 0; if (wx > ox) v *= Math.max(0, 1 - (wx - ox) / .75); v = Math.max(0, Math.min(1, v));
    f[j * W + i] = v; const p = (j * W + i) * 4, g = Math.round(v * 255); img.data[p] = g; img.data[p + 1] = g; img.data[p + 2] = g; img.data[p + 3] = 255;
    if (v > .1 && ((i + j) & 1) === 0) pts.push(wx, wz, v);
  }
  S.fieldCtx.putImageData(img, 0, 0); S.fieldTex.needsUpdate = true; S.pts = new Float32Array(pts);
  let mnx = 1e9, mxx = -1e9; for (let k = 0; k < S.pts.length; k += 3) if (S.pts[k + 2] > .12) { mnx = Math.min(mnx, S.pts[k]); mxx = Math.max(mxx, S.pts[k]); } S.oilMinX = mnx; S.oilMaxX = mxx;
}
// Zufälliger brennender Punkt (nass und von der Flammenfront erreicht)
const _fp = { x: 0, z: 0, v: 0 };
function feuer_burnPoint() { const S = feuer_S, A = S.pts; if (!A || !A.length) return null; const n = A.length / 3;
  for (let k = 0; k < 6; k++) { const i = Math.floor(Math.random() * n) * 3; if (A[i + 2] < S.spread + .02) continue; if (Math.hypot(A[i] - S.ignX, A[i + 1] - S.ignZ) > S.burnR) continue; _fp.x = A[i]; _fp.z = A[i + 1]; _fp.v = A[i + 2]; return _fp; } return null; }
// ---------------------------------------------------------------- Klänge (synthetisch und aus vorhandenen Aufnahmen, räumlich an der Brandstelle)
const FEU_SND = {
  clank(x, z, v = .5) { Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: v, rate: rand(.5, .7), x, y: .3, z, ref: 3 }); },
  flick() { const A = Audio; if (!A.ctx) return; A.play('switch1', { gain: .45, rate: 1.9 }); const n = A.noise(false), hp = A.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3200; n.connect(hp); A.env(hp, .25, .002, .09, .06); n.stop(A.ctx.currentTime + .3); },
  // Entzündung: tiefer Luftsog, dann das „Wuff“ der Druckwelle, danach Nachhall der Flammen
  wuff(x, z) { const A = Audio; if (!A.ctx) return; const t = A.ctx.currentTime, d = A.at(x, .5, z, 6);
    const s = A.noise(false), sb = A.ctx.createBiquadFilter(); sb.type = 'bandpass'; sb.Q.value = .9; sb.frequency.setValueAtTime(90, t); sb.frequency.exponentialRampToValueAtTime(520, t + .38); s.connect(sb); const sg = A.ctx.createGain(); sg.gain.setValueAtTime(0, t); sg.gain.linearRampToValueAtTime(.55, t + .36); sg.gain.linearRampToValueAtTime(0, t + .42); sb.connect(sg); sg.connect(d); s.stop(t + .6);
    const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = .7; bp.frequency.setValueAtTime(180, t + .38); bp.frequency.exponentialRampToValueAtTime(2400, t + .9); bp.frequency.exponentialRampToValueAtTime(420, t + 2.6); n.connect(bp); A.env(bp, 1.3, .03, 2.4, .38, d); n.stop(t + 3.3);
    const o = A.osc('sine', 58, .38, 1.6); o.frequency.setValueAtTime(58, t + .38); o.frequency.exponentialRampToValueAtTime(24, t + 1.6); A.env(o, 1.1, .01, 1.3, .38);
    const o2 = A.osc('triangle', 36, .4, 1.2); A.env(o2, .6, .02, 1, .4); A.play('wind3', { gain: .8, rate: 1.6, dur: 1.8, delay: .38, x, y: 1, z, ref: 4 }); },
  crackle(x, z) { const A = Audio; if (!A.ctx) return; const d = A.at(x, .4, z, 3), n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(1800, 5200); bp.Q.value = 3; n.connect(bp); A.env(bp, rand(.3, .8), .001, rand(.01, .04), 0, d); if (Math.random() < .45) A.env(bp, rand(.2, .6), .001, .02, rand(.03, .08), d); n.stop(A.ctx.currentTime + .3); },
  pop(x, z) { const A = Audio; if (!A.ctx) return; const d = A.at(x, .5, z, 4); const o = A.osc('sine', rand(90, 140), 0, .3); o.frequency.exponentialRampToValueAtTime(40, A.ctx.currentTime + .15); A.env(o, .6, .002, .18, 0, d); const n = A.noise(false), hp = A.ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900; n.connect(hp); A.env(hp, .7, .001, .06, 0, d); n.stop(A.ctx.currentTime + .3); },
  collapse(x, z) { Audio.play(Audio.pick('woodFall1', 'woodFall2'), { gain: .8, rate: rand(.55, .75), x, y: 1.5, z, ref: 4 }); if (Math.random() < .6) Audio.play('metalHit2', { gain: .6, rate: .45, delay: .15, x, y: .3, z, ref: 4 }); TOD_SND.thud(.45); },
  // brennender Körper: vorhandene Stimmen tiefer, verzerrt, dumpf
  scream(x, z, k = 0) { const A = Audio; if (!A.ctx) return; const name = ['undead2', 'undead4', 'undead1', 'zombie1', 'undead3'][k % 5], b = A.buf[name]; if (!b) return;
    const s = A.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = [.72, .64, .8, .6, .7][k % 5]; const ws = A.ctx.createWaveShaper(); if (!FEU_SND.curve) { const c = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const v = i / 511.5 - 1; c[i] = Math.tanh(v * 3.5); } FEU_SND.curve = c; } ws.curve = FEU_SND.curve;
    const lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const g = A.ctx.createGain(); g.gain.value = 1.1; s.connect(ws); ws.connect(lp); lp.connect(g); g.connect(A.at(x, .6, z, 4)); s.start(0, k === 3 ? rand(0, Math.max(0, b.duration - 3)) : 0, Math.min(b.duration, 3.2)); },
  pour(x, z) { Audio.play('waterFlow', { gain: .75, rate: .5, lp: 420, dur: 4.5, fadeIn: .3, x, y: .3, z, ref: 3 }); Audio.play('waterFlow', { gain: .35, rate: .38, lp: 300, dur: 6, delay: .8, x, y: .1, z, ref: 3 }); },
  // Endlose Rauschquellen (Brüllen in drei Bändern, zischendes Öl, Rollen, Luftzug, Atem)
  // Brandalarm: elektrische Glocke (Klöppel ~21 Hz auf einer Schale), unter der Decke am Ende des Gangs
  alarm(on) { const A = Audio, S = feuer_S.snd; if (!A.ctx) return; const t = A.ctx.currentTime;
    if (on && !S.alarm) { const o = A.ctx.createOscillator(), o2 = A.ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1180; o2.type = 'triangle'; o2.frequency.value = 2870;
      const bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 2.2; const am = A.ctx.createGain(); am.gain.value = .5;
      const lf = A.ctx.createOscillator(); lf.type = 'square'; lf.frequency.value = 21; const lg = A.ctx.createGain(); lg.gain.value = .5; lf.connect(lg); lg.connect(am.gain);
      const g = A.ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.09, t + .05); o.connect(bp); o2.connect(bp); bp.connect(am); am.connect(g); const p = A.at(X + 105.5, 2.3, Z + 1.6, 4); g.connect(p);
      o.start(); o2.start(); lf.start(); S.alarm = { o, o2, lf, g, p }; }
    if (!on && S.alarm) { const a = S.alarm; S.alarm = null; a.g.gain.setTargetAtTime(0, t, .15); setTimeout(() => { try { a.o.stop(); a.o2.stop(); a.lf.stop(); a.p.disconnect(); } catch (e) {} }, 1200); } },
  loopNoise(key, on, { x, y = 1, z, ref = 4, lp, bp, hp, q = 1, gain = .3, am = 0, flat = false } = {}) { const A = Audio, S = feuer_S.snd; if (!A.ctx) return null;
    if (on && !S[key]) { const n = A.noise(true); let node = n; if (hp) { const f = A.ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; } if (lp) { const f = A.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; } let bpf = null; if (bp) { bpf = A.ctx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = bp; bpf.Q.value = q; node.connect(bpf); node = bpf; }
      let amG = null, amO = null; if (am) { amG = A.ctx.createGain(); amG.gain.value = .5; amO = A.ctx.createOscillator(); amO.frequency.value = am; const og = A.ctx.createGain(); og.gain.value = .5; amO.connect(og); og.connect(amG.gain); amO.start(); node.connect(amG); node = amG; }
      const g = A.ctx.createGain(); g.gain.value = 0; node.connect(g); const p = flat ? null : A.at(x, y, z, ref); g.connect(p || A.master); S[key] = { n, g, p, gain, amO, bpf }; return S[key]; }
    if (!on && S[key]) { const s = S[key]; S[key] = null; s.g.gain.setTargetAtTime(0, A.ctx.currentTime, .4); setTimeout(() => { try { s.n.stop(); if (s.amO) s.amO.stop(); if (s.p) s.p.disconnect(); } catch (e) {} }, 2500); }
    return S[key] || null; },
  level(key, v, x, z) { const s = feuer_S.snd[key]; if (!s || !Audio.ctx) return; s.g.gain.setTargetAtTime(v * s.gain, Audio.ctx.currentTime, .12); if (x !== undefined && s.p && s.p.positionX) { s.p.positionX.value = x; s.p.positionZ.value = z; } },
};
// ---------------------------------------------------------------- Musik: vorab offline gerendert (kostet im Spiel nichts)
function feuer_mus() {
  const N = n => KN(n);
  const TK = (c, o, t, v, big) => { const f0 = big ? 64 : 82, s = KI.osc(c, 'sine', f0, t, 1.3); s.frequency.setValueAtTime(f0, t); s.frequency.exponentialRampToValueAtTime(big ? 29 : 41, t + .42); const g = KI.env(c, t, .004, v, big ? 1.3 : .65); s.connect(g); g.connect(o);
    const n = c.createBufferSource(); n.buffer = KI.noise(c); const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = big ? 380 : 700; const ng = KI.env(c, t, .002, v * .5, .15); n.connect(lp); lp.connect(ng); ng.connect(o); n.start(t); n.stop(t + .3); };
  const BR = (c, o, t, fs, dur, v) => { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 1.3; lp.frequency.setValueAtTime(160, t); lp.frequency.linearRampToValueAtTime(1250, t + Math.min(1.3, dur * .4)); lp.frequency.linearRampToValueAtTime(650, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .4); g.gain.setValueAtTime(v, t + dur * .72); g.gain.linearRampToValueAtTime(0, t + dur); lp.connect(g); g.connect(o);
    for (const f of fs) for (const d of [-.0045, 0, .005]) { const s = KI.osc(c, 'sawtooth', f * (1 + d), t, dur); s.connect(lp); } };
  const RISE = (c, o, t, fs, dur, v, semi) => { for (const f of fs) for (const d of [-.006, .006]) { const f0 = f * (1 + d), s = KI.osc(c, 'sawtooth', f0, t, dur + .3); s.frequency.setValueAtTime(f0, t); s.frequency.exponentialRampToValueAtTime(f0 * Math.pow(2, semi / 12), t + dur);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(450, t); lp.frequency.exponentialRampToValueAtTime(4200, t + dur); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + dur * .9); g.gain.linearRampToValueAtTime(0, t + dur + .25); s.connect(lp); lp.connect(g); g.connect(o); } };
  const TREM = (c, o, t, fs, dur, v0, v1, semi) => { const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(3000, t + dur); const g = c.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v0, t + 2); g.gain.linearRampToValueAtTime(v1, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + .4);
    const am = c.createGain(); am.gain.value = .55; const lf = KI.osc(c, 'sine', 8.5, t, dur + .5), lg = c.createGain(); lg.gain.value = .45; lf.connect(lg); lg.connect(am.gain); lp.connect(am); am.connect(g); g.connect(o);
    for (const f of fs) for (const d of [-.005, .005]) { const s = KI.osc(c, 'sawtooth', f * (1 + d), t, dur + .5); s.frequency.setValueAtTime(f * (1 + d), t); s.frequency.exponentialRampToValueAtTime(f * (1 + d) * Math.pow(2, semi / 12), t + dur); s.connect(lp); } };
  // A (0 = die Flamme fängt): Schlag, Blech in d-Moll, Taiko im 6/8, Streicher-Cluster steigt; 6,6 s Zusammenbruch (A-Dur-Schlag); dann Lucys Motiv auf dem Cello
  const A = (c, o) => { TK(c, o, 0, 1, true); TK(c, o, .03, .8, true); BR(c, o, .05, [N('D2'), N('A2'), N('D3'), N('F3')], 6.7, .05);
    const pat = [1, 0, 0, .6, 0, .45]; for (let k = 0; k < 28; k++) { const t = 1 + k * .2; if (t > 6.4) break; if (pat[k % 6]) TK(c, o, t, pat[k % 6] * (.42 + k * .014), false); }
    RISE(c, o, 2.2, [N('D4'), N('Eb4'), N('A4')], 4.2, .014, 5); BR(c, o, 3.4, [N('D1') * 2, N('A1')], 3.2, .04);
    TK(c, o, 6.6, 1.1, true); TK(c, o, 6.63, .9, true); BR(c, o, 6.6, [N('A1'), N('E2'), N('A2'), N('C#3')], 1.7, .065);
    KI.bow(c, o, 7.1, N('D2'), 6, .03, 480);
    ['E3', 'D3', 'C3', 'B2', 'C3'].forEach((n, i) => KI.bow(c, o, 7.5 + i * .95, N(n), i === 4 ? 2.6 : 1.25, .055, 950)); };
  // B: Flucht, 30 s – Puls wird schneller, eine Uhr tickt, Streicher steigen, Blechstöße
  const B = (c, o) => { let t = 0, k = 0; while (t < 30) { const p = t / 30; TK(c, o, t, .3 + .45 * p, k % 4 === 0); t += .9 - .48 * p; k++; }
    for (let s = 0; s < 30; s++) { const n = c.createBufferSource(); n.buffer = KI.noise(c); const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5200; const g = KI.env(c, s + .5, .001, .05, .03); n.connect(hp); hp.connect(g); g.connect(o); n.start(s + .5); n.stop(s + .6); }
    TREM(c, o, 0, [N('D3'), N('A3')], 30, .012, .04, 3);
    [8, 16, 24].forEach(tt => BR(c, o, tt, [N('D2'), N('A2'), N('D3')], 1.5, .045)); BR(c, o, 27, [N('Bb1'), N('F2'), N('Bb2')], 3.2, .055);
    RISE(c, o, 24, [N('E5'), N('F5')], 6, .01, 2); };
  return { A, B };
}
async function feuer_renderCues() {
  const S = feuer_S; if (S.cues || S.cueBusy || typeof KI === 'undefined' || !Audio.ctx) return; S.cueBusy = true;
  try { const M = feuer_mus(), sr = 32000;
    const mk = async (len, fn) => { const c = new OfflineAudioContext(2, Math.ceil(sr * len), sr), o = KI.chain(c, .36, 4.2); fn(c, o); const b = await c.startRendering();
      let pk = 1e-4; for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i += 3) { const a = Math.abs(d[i]); if (a > pk) pk = a; } }
      const g = Math.min(4, .82 / pk); for (let ch = 0; ch < b.numberOfChannels; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i++) d[i] *= g; } return b; };
    S.cues = { a: await mk(14.5, M.A), b: await mk(35, M.B) };
  } catch (e) { console.warn('Feuer: Musik', e); }
  S.cueBusy = false;
}
function feuer_cue(name, on) {
  const S = feuer_S, A = Audio; if (!A.ctx) return; const cur = S.snd['cue_' + name];
  if (cur) { S.snd['cue_' + name] = null; const t = A.ctx.currentTime; cur.g.gain.cancelScheduledValues(t); cur.g.gain.setValueAtTime(cur.g.gain.value, t); cur.g.gain.linearRampToValueAtTime(0, t + (on ? .1 : 1.8)); try { cur.s.stop(t + 2); } catch (e) {} }
  if (!on || !S.cues || !S.cues[name]) return;
  const s = A.ctx.createBufferSource(); s.buffer = S.cues[name]; const g = A.ctx.createGain(); g.gain.value = .95 * (settings.music ?? 1); s.connect(g); g.connect(A.master); s.start(); S.snd['cue_' + name] = { s, g };
}
// ---------------------------------------------------------------- Hitzeflimmern: eigener Nachbearbeitungs-Durchgang (ohne Feuer: uAmt = 0 → reines Durchreichen)
function feuer_hazePass() {
  if (typeof ShaderPass === 'undefined') return null;
  const p = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uAmt: { value: 0 }, uC: { value: new THREE.Vector2(.5, .5) }, uR: { value: .3 }, uT: { value: 0 }, uAsp: { value: 1.7 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt, uR, uT, uAsp; uniform vec2 uC; varying vec2 vUv;
      void main(){ vec2 uv = vUv; if (uAmt > 0.) { vec2 d = (uv - uC) * vec2(uAsp, 1.); float m = smoothstep(uR, uR * .2, length(d * vec2(1., .7))) * smoothstep(-.35, .05, uv.y - uC.y + uR * .4);
          uv += vec2(sin(uv.y * 95. - uT * 11.) + sin(uv.y * 41. + uv.x * 17. - uT * 7.), cos(uv.x * 70. - uT * 9.)) * .0018 * uAmt * m; }
        gl_FragColor = texture2D(tDiffuse, uv); }` });
  const i = composer.passes.indexOf(filmPass); if (i < 0) return null; composer.insertPass(p, i); return p;
}

// ---------------------------------------------------------------- Aufbau beim Laden
WORLD_MODS.push(['Feuer', async () => {
  const S = feuer_S; S.ceil = C2.h - .35;
  // Ölfass (Scan) – Drehpunkt in der Fassmitte
  try { const src = await msModel('w_barrel', 'model.glb'), m = src.clone(true); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) o.material.envMapIntensity = .7; } });
    msFit(m, .86); const g = msGround(m); g.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(g); FEU.h = bb.max.y; FEU.r = Math.min(.33, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 * .92);
    g.position.y = -FEU.h / 2; const piv = new THREE.Group(); piv.add(g); piv.position.set(FEU.bx, FEU.h / 2, FEU.bz); piv.rotation.y = .4; scene.add(piv); S.barrel = piv;
  } catch (e) { console.warn('Feuer: Fass', e); }
  S.bHit = box(.8, 1.1, .8, FEU.bx, .55, FEU.bz, hidden, { cast: false }); S.bHit.userData.noCol = true;
  interact(S.bHit, () => ch2.chase === 'run' ? 'Fass umstoßen' : 'Ölfass', () => feuer_barrelAct());
  // Feuerzeug (Scan) auf der Matratze im Prüfraum
  try { const src = await msModel('w_lighter', 'model.glb'), mk = () => { const m = src.clone(true); m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; if (o.material) { o.material.metalness = Math.max(o.material.metalness || 0, .55); o.material.roughness = Math.min(o.material.roughness ?? 1, .45); } } }); msFit(m, .058); m.rotation.x = -PI / 2; const g = msGround(m); g.userData.noCol = true; return g; };
    const L = S.lighterObj = mk(); const spot = feuer_bedSpot(); L.position.set(spot.x, spot.y + .004, spot.z); L.rotation.y = .7; scene.add(L);
    S.lHit = box(.3, .16, .3, spot.x, spot.y + .06, spot.z, hidden, { cast: false }); S.lHit.userData.noCol = true; interact(S.lHit, 'Feuerzeug', () => feuer_takeLighter());
    const T = S.throwObj = mk(); T.position.set(0, -60, 0); scene.add(T);
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: feuer_texDot(), color: 0xffe6b0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })); gl.position.set(spot.x, spot.y + .03, spot.z); gl.scale.setScalar(.12); gl.userData.noCol = true; scene.add(gl); S.glint = gl;
  } catch (e) { console.warn('Feuer: Feuerzeug', e); }
  // Öllache (Decal): Farbe, Glanz, Ausbreitung, Glutfront und Verkohlen per Uniform – ein Programm, beim Laden übersetzt
  { const cv = document.createElement('canvas'); cv.width = FEU.fw; cv.height = FEU.fh; S.fieldCtx = cv.getContext('2d'); S.fieldCtx.fillStyle = '#000'; S.fieldCtx.fillRect(0, 0, FEU.fw, FEU.fh); S.fieldTex = new THREE.CanvasTexture(cv); S.field = new Float32Array(FEU.fw * FEU.fh);
    const col = new THREE.CanvasTexture(feuer_canvas(256, 256, (x, w) => { x.fillStyle = '#0b0806'; x.fillRect(0, 0, w, w); for (let i = 0; i < 90; i++) { const g = x.createRadialGradient(Math.random() * w, Math.random() * w, 0, Math.random() * w, Math.random() * w, 10 + Math.random() * 40); g.addColorStop(0, `rgba(${40 + Math.random() * 30},${24 + Math.random() * 20},${10 + Math.random() * 12},.35)`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }
      x.globalAlpha = .08; for (let i = 0; i < 7; i++) { x.strokeStyle = ['#6a2fa0', '#2f7fa0', '#a09a2f', '#a0442f'][i % 4]; x.lineWidth = 6 + Math.random() * 10; x.beginPath(); x.arc(Math.random() * w, Math.random() * w, 30 + Math.random() * 90, 0, 6.28); x.stroke(); } }));
    col.colorSpace = THREE.SRGBColorSpace; col.wrapS = col.wrapT = THREE.RepeatWrapping; col.repeat.set(2.5, 1.4);
    const U = S.oilU = { uSpread: { value: 1.1 }, uIgn: { value: new THREE.Vector2(0, 0) }, uBurnR: { value: 0 }, uHeat: { value: 0 }, uTime: { value: 0 }, uChar: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: col, alphaMap: S.fieldTex, color: 0xffffff, roughness: .07, metalness: .15, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, envMapIntensity: 1.3 });
    mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vFeuW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vFeuW = (modelMatrix * vec4(transformed, 1.)).xyz;');
      sh.fragmentShader = 'uniform float uSpread, uBurnR, uHeat, uTime, uChar; uniform vec2 uIgn; varying vec3 vFeuW;\n' + sh.fragmentShader
        .replace('#include <alphamap_fragment>', 'float feuF = texture2D(alphaMap, vAlphaMapUv).g; float feuA = smoothstep(uSpread, uSpread + .05, feuF); diffuseColor.a *= feuA * (.96 + uChar * .04); diffuseColor.rgb *= 1. - uChar * .7;')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .85, uChar);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float feuD = distance(vFeuW.xz, uIgn); float feuB = (1. - smoothstep(uBurnR - .5, uBurnR, feuD)) * feuA * uHeat; float feuN = .55 + .45 * sin(uTime * 11. + vFeuW.x * 7.3 + sin(vFeuW.z * 5. + uTime * 3.)); float feuP = smoothstep(.35, .8, sin(vFeuW.x * 3.1 + uTime * 1.3) * sin(vFeuW.z * 4.3 - uTime * .9) * .5 + .5 * feuF); totalEmissiveRadiance += vec3(1., .3, .05) * feuB * feuN * (.28 + .6 * feuP) + vec3(1., .45, .08) * (1. - smoothstep(0., .35, abs(feuD - uBurnR))) * feuA * step(.01, uHeat) * step(uBurnR, 7.) * 1.2;'); };
    const oil = S.oil = new THREE.Mesh(new THREE.PlaneGeometry(FEU.oilW, FEU.oilD), mat); oil.rotation.x = -PI / 2; oil.position.set(X + 96, -40, Z); oil.renderOrder = 2; oil.receiveShadow = true; oil.userData.noCol = true; scene.add(oil); }
  // Ruß danach: Decke und beide Wände über der Brandstelle (Deckkraft wächst mit der Brenndauer)
  { const mk = (tex, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.userData.noCol = true; m.renderOrder = 1; m.position.set(0, -50, 0); scene.add(m); return m; };
    const tc = feuer_texSoot(512, 256, false), tw = feuer_texSoot(512, 192, true);
    S.sootC = mk(tc, 7, 3.6); S.sootC.rotation.x = PI / 2; S.sootN = mk(tw, 7, 2.3); S.sootN.rotation.y = PI; S.sootS = mk(tw, 7, 2.3); }
  // Partikel: Flammenwände, Zungen, heller Kern, Rauch, Funken
  { const dot = feuer_texDot(), T = S.timeU = { value: 0 };
    const mkMat = (fs, u, blend) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: FEU_VS, fragmentShader: fs, transparent: true, depthWrite: false, blending: blend, fog: false }); if (blend === THREE.CustomBlending) { m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; } return m; };
    const fl = (int, core, asp) => mkMat(FEU_FS_FLAME, { uTime: T, uInt: { value: int }, uCore: { value: core }, uCyl: { value: 1 }, uAsp: { value: asp } }, THREE.CustomBlending);
    S.pw = feuer_sys(120, fl(.7, 0, 1.25), 12); S.pf = feuer_sys(300, fl(.85, .25, 1.7), 13); S.pc = feuer_sys(140, fl(.8, .45, 1.4), 14);
    S.ps = feuer_sys(320, mkMat(FEU_FS_SMOKE, { uTime: T, uCol: { value: new THREE.Color(0x191511) }, uA: { value: .62 }, uGlowPos: { value: new THREE.Vector3() }, uGlow: { value: 0 }, uCyl: { value: 0 }, uAsp: { value: 1 } }, THREE.NormalBlending), 11);
    S.pe = feuer_sys(300, mkMat(FEU_FS_DOT, { map: { value: dot }, uCyl: { value: 0 }, uAsp: { value: 3.2 } }, THREE.AdditiveBlending), 15); }
  // Licht: ein echtes Punktlicht mit Schatten (Wände, Möbel, der Körper werfen flackernde Schatten), Schatten nur während des Feuers neu gezeichnet
  { const L = S.fireP = new THREE.PointLight(0xff7a30, 0, 16, 2); L.castShadow = true; L.shadow.mapSize.set(512, 512); L.shadow.bias = -.006; L.shadow.normalBias = .02; L.shadow.camera.near = .15; L.shadow.autoUpdate = false; L.shadow.needsUpdate = true; L.position.set(X + 97, .9, Z); scene.add(L); }
  S.bodyL = new VLight(0xff9048, 0, 7, 2); S.bodyL.position.set(X + 96, .8, Z); scene.add(S.bodyL);
  S.redL = new VLight(0xff1c0c, 0, 6, 2); S.redL.position.set(FEU.relX, 2.05, FEU.relZ - .35); scene.add(S.redL);
  try { S.haze = feuer_hazePass(); } catch (e) { console.warn('Feuer: Flimmern', e); }
  // Notentriegelung der Brandschutztür: Schild an der Nordwand, rote Rundumleuchte, Griff (E halten)
  { const sign = new THREE.MeshStandardMaterial({ roughness: .55, metalness: .3, transparent: true, polygonOffset: true, polygonOffsetFactor: -4, map: new THREE.CanvasTexture(feuer_canvas(256, 384, (x, w, h) => {
      x.fillStyle = '#5b5e5a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '40,24,12' : '120,110,96'},${Math.random() * .12})`; x.fillRect(Math.random() * w, Math.random() * h, Math.random() * 12, Math.random() * 3); }
      x.fillStyle = '#9b1b12'; x.fillRect(18, 18, w - 36, 62); x.fillStyle = '#f1e6cf'; x.font = 'bold 25px Arial'; x.textAlign = 'center'; x.fillText('NOTENTRIEGELUNG', w / 2, 50); x.font = 'bold 15px Arial'; x.fillText('BRANDSCHUTZTÜR  E-2 / 7', w / 2, 72);
      for (let i = -2; i < 12; i++) { x.fillStyle = i % 2 ? '#d9b41a' : '#161410'; x.beginPath(); x.moveTo(18 + i * 22, 100); x.lineTo(40 + i * 22, 100); x.lineTo(18 + i * 22, 122); x.lineTo(-4 + i * 22, 122); x.fill(); }
      x.fillStyle = '#2b2d2b'; x.fillRect(70, 140, 116, 196); x.fillStyle = '#131412'; x.fillRect(122, 160, 12, 150); const g = x.createLinearGradient(80, 0, 176, 0); g.addColorStop(0, '#7a130c'); g.addColorStop(.5, '#d0301f'); g.addColorStop(1, '#6a0f08'); x.fillStyle = g; x.fillRect(84, 168, 88, 26); x.fillStyle = '#1a1a18'; x.fillRect(118, 188, 20, 40);
      x.fillStyle = '#e8dcc0'; x.font = 'bold 14px Arial'; x.fillText('HEBEL ZIEHEN', w / 2, 356); x.fillText('UND HALTEN', w / 2, 374); })) });
    sign.map.colorSpace = THREE.SRGBColorSpace; const sp = plane(.42, .63, FEU.relX, 1.25, FEU.relZ - .012, sign, 0, PI); sp.userData.noCol = true; S.relSign = sp;
    const lampM = new THREE.MeshBasicMaterial({ map: feuer_texDot(), color: 0xff2a14, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const lp = plane(.5, .5, FEU.relX, 1.72, FEU.relZ - .03, lampM, 0, PI); lp.userData.noCol = true; S.relLamp = lp;
    S.relHit = box(.7, .9, .4, FEU.relX, 1.25, FEU.relZ - .2, hidden, { cast: false }); S.relHit.userData.noCol = true;
    interact(S.relHit, () => S.phase === 'escape' && !S.relOpen ? 'Notentriegelung ziehen (E halten)' : 'Notentriegelung', () => { if (S.phase !== 'escape') { Audio.play(Audio.pick('keys1', 'keys2'), { gain: .3, rate: .5, x: FEU.relX, y: 1.2, z: FEU.relZ, ref: 2 }); toast(S.done ? 'Der Hebel hängt unten. Die Plombe ist gerissen.' : 'Der Hebel ist verplombt. „Nur bei Brandalarm.“ Er rührt sich keinen Millimeter.', 3600); } }); }
  // Brandschutztür: von Anfang an zu (PK-D K2-5). Schild auf dem Türblatt (fährt mit), kein Licht.
  { const sm = new THREE.MeshStandardMaterial({ roughness: .5, metalness: .25, transparent: true, polygonOffset: true, polygonOffsetFactor: -4, map: new THREE.CanvasTexture(feuer_canvas(256, 320, (x, w, h) => {
      x.fillStyle = '#b8231a'; x.fillRect(0, 0, w, h); x.fillStyle = '#efe6d2'; x.fillRect(10, 10, w - 20, h - 20); x.fillStyle = '#b8231a'; x.fillRect(10, 10, w - 20, 70);
      x.fillStyle = '#f7efdc'; x.textAlign = 'center'; x.font = 'bold 27px Arial'; x.fillText('BRANDSCHUTZ-', w / 2, 44); x.fillText('TÜR', w / 2, 72);
      x.fillStyle = '#1d1c1a'; x.font = 'bold 22px Arial'; x.fillText('Selbstschließend.', w / 2, 122); x.font = '21px Arial'; x.fillText('Notentriegelung', w / 2, 170); x.fillText('nur bei', w / 2, 198); x.font = 'bold 24px Arial'; x.fillText('BRANDALARM', w / 2, 230);
      x.font = '15px Arial'; x.fillText('→ roter Hebel, Nordwand', w / 2, 276);
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '60,34,16' : '20,18,16'},${Math.random() * .12})`; x.fillRect(Math.random() * w, Math.random() * h, Math.random() * 10, Math.random() * 3); } })) });
    sm.map.colorSpace = THREE.SRGBColorSpace; const ds = new THREE.Mesh(new THREE.PlaneGeometry(.34, .425), sm); ds.rotation.y = -PI / 2; ds.position.set(-.066, .3, .28); ds.userData.noCol = true; ds.raycast = () => {}; chaseDoor.m.add(ds); }
  feuer_doorShut();
  // Hitze-Wand (Kollisionskiste, sonst weit weg) und Zünd-Fläche (Aufforderung „anzünden“, sonst weit weg)
  S.heatCol = addCol(-9999, -9998, -9999, -9998, 3, -1);
  S.ignHit = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), hidden); S.ignHit.position.set(0, -80, 0); S.ignHit.userData.noCol = true; scene.add(S.ignHit);
  // Luftanzeige
  { const css = document.createElement('style'); css.textContent = `#feuerAir { position: absolute; top: 118px; left: 56px; width: 220px; opacity: 0; transition: opacity .6s; }
    #feuerAir.show { opacity: 1; } #feuerAir b { display: block; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .5em; color: #d8b98a; text-shadow: 0 0 2px #000, 0 0 8px #000; margin-bottom: 6px; }
    #feuerAir i { display: block; height: 2px; background: rgba(201,163,106,.18); box-shadow: 0 0 6px #000; } #feuerAir u { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #8e1d15, #c9a36a); transform-origin: left; }
    #feuerAir.low u { background: #c23a2b; animation: feuerPulse .6s infinite; } @keyframes feuerPulse { 50% { opacity: .35; } }`; document.head.appendChild(css);
    const el = S.airEl = document.createElement('div'); el.id = 'feuerAir'; el.innerHTML = '<b>LUFT</b><i><u></u></i>'; document.getElementById('hud').appendChild(el); }
  window.__feuer = { S: feuer_S, FEU, zombie, obstacles, chaseDoor, gate, cell: spiderDoorOut, near: feuer_bedSpot, knock: () => feuer_knock(), ignite: () => feuer_ignite(), escape: () => feuer_escapeStart(), reset: id => feuer_reset(id || 'gang'), giveLighter: () => { feuer_lighterGone(); feuer_items(); addItem('feuerzeug'); }, render: () => feuer_renderCues() };
}]);
// Oberseite der Matratze im Prüfraum finden (Möbel kommen aus innen_kapitel); sonst neben dem Bett auf dem Boden
function feuer_bedSpot() {
  const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3(), bb = new THREE.Box3(); scene.updateMatrixWorld(true);
  const near = []; scene.traverse(m => { if (!m.isMesh || m.isInstancedMesh || !m.geometry || !m.visible) return; bb.setFromObject(m); if (bb.isEmpty() || bb.max.x < X + 39.8 || bb.min.x > X + 43 || bb.max.z < Z - 4.9 || bb.min.z > Z - 3.3 || bb.max.y > 1.4 || bb.max.y < .3) return; near.push({ m, top: bb.max.y, b: bb.clone() }); });
  for (const [dx, dz] of [[.72, 0], [.78, .12], [.66, -.1], [.35, -.05], [.1, 0], [-.2, 0]]) {
    const x = X + 41.4 + dx, z = Z - 4.4 + dz; rc.set(o.set(x, 1.6, z), dn); rc.far = 1.6; const sides = near.map(n => { const m = n.m.material; if (!m || Array.isArray(m)) return null; const sd = m.side; m.side = THREE.DoubleSide; return sd; }); const h = rc.intersectObjects(near.map(n => n.m), false).find(h => h.point.y > .3 && h.point.y < 1.05); near.forEach((n, i) => { if (sides[i] !== null) n.m.material.side = sides[i]; });
    if (h) return { x, y: h.point.y, z }; }
  for (const px of [X + 42.12, X + 41.6]) { let top = -1; for (const n of near) { const b = n.b; if (px > b.min.x && px < b.max.x && Z - 4.4 > b.min.z && Z - 4.4 < b.max.z && n.top < .95 && n.top > top) top = n.top; } if (top > .3) return { x: px, y: top - .012, z: Z - 4.4 }; }
  return { x: X + 42.9, y: 0, z: Z - 3.6 };
}
function feuer_items() { if (feuer_S.items) return; try { ITEMS.feuerzeug = { name: 'Feuerzeug „P. K.“', desc: 'Messing, zerkratzt. Rückseite: „Für Peter. Damit du im Dunkeln nicht allein bist. – M.“ Es ist noch Benzin drin.' };
  ICONS.feuerzeug = '<svg viewBox="0 0 24 24"><rect x="7" y="10" width="10" height="11" rx="1.5"/><path d="M8 10V7h6v3M11 7c0-2 2-2.5 1.5-5"/></svg>'; feuer_S.items = true; } catch (e) {} }
function feuer_lighterGone() { const S = feuer_S; S.lighter = true; S.cellFree = true; if (S.lighterObj) S.lighterObj.visible = false; if (S.lHit) uninteract(S.lHit); if (S.glint) S.glint.material.opacity = 0; }
function feuer_takeLighter() {
  const S = feuer_S; if (S.lighter || state.talking) return; feuer_items(); S.lighter = true; if (S.lHit) uninteract(S.lHit); if (S.glint) S.glint.material.opacity = 0;
  const done = () => { addItem('feuerzeug'); FEU_SND.flick();
    (async () => { await wait(500); await say([['P. K. … Peter Kranz.', 2400, 'LUKE'], ['Mamas Bruder. Oma hat sein Zimmer nie wieder aufgeschlossen.', 3800, 'LUKE'], ['„M.“ Marion. Sie hat ihm das geschenkt.', 3200, 'LUKE'], ['Was macht sein Feuerzeug hier unten, auf so einem Bett?', 3400, 'LUKE']]); S.cellFree = true; })(); };
  const html = 'Messing, zerkratzt, schwer für seine Größe. Auf dem Deckel eingraviert: <b>P. K.</b>\n\nAuf der Rückseite, kleiner, mit einer Nadel nachgezogen:\n<span class="hand">„Für Peter. Damit du im Dunkeln nicht allein bist. – M.“</span>\n\nDu klappst es auf. Das Rad kratzt, ein Funke, eine kleine gelbe Flamme. Es ist noch Benzin drin.';
  if (S.lighterObj) liftTo(S.lighterObj, () => openNote('Ein Feuerzeug', html, 'feuerzeug', done), false); else openNote('Ein Feuerzeug', html, 'feuerzeug', done);
}
// ---------------------------------------------------------------- Das Fass
function feuer_barrelAct() {
  const S = feuer_S; if (S.phase !== 'idle') return;
  if (ch2.chase !== 'run') { toast('Ein Fass Heizöl, randvoll und schwer. Der Spund ist durchgerostet.', 3800); if (!S.said.fass) { S.said.fass = true; gedanke('feuer_fass', 'Wenn das umkippt, schwimmt der ganze Gang.', 800, 2); } return; }
  feuer_knock();
}
function feuer_knock() {
  const S = feuer_S; if (S.phase !== 'idle' || !S.barrel) return; S.phase = 'tip'; S.bt = 0; S.run++; const s = FEU.tip;
  uninteract(S.bHit); S.barrel.userData.noCol = true; S.barrel.rotation.y = 0; Audio.thump(FEU.bx, .5, FEU.bz); Audio.play('woodHit2', { gain: .6, rate: .7, x: FEU.bx, y: .5, z: FEU.bz, ref: 3 });
  S.edgeZ = FEU.bz + s * FEU.r; S.bv = 0; S.bang = 0; S.bx = FEU.bx; S.bz = FEU.bz + s * (FEU.r + FEU.h / 2); if (!S.said.tritt) { S.said.tritt = true; subtitle('Du wirfst dich gegen das Fass. Es kippt.', 2200); }
}
const _fq1 = new THREE.Quaternion(), _fq2 = new THREE.Quaternion(), _fax = new THREE.Vector3(1, 0, 0), _faz = new THREE.Vector3(0, 0, 1);
function feuer_barrelUpdate(dt, t) {
  const S = feuer_S, B = S.barrel; if (!B) return; const r = FEU.r, hl = FEU.h / 2, s = FEU.tip;
  if (S.phase === 'tip') { S.bt += dt; const k = Math.min(1, S.bt / .5), a = k * k * PI / 2; // kippt über die Unterkante in die Gangmitte
    B.position.set(FEU.bx, Math.cos(a) * hl + Math.sin(a) * r, S.edgeZ + s * (Math.sin(a) * hl - Math.cos(a) * r)); B.quaternion.setFromAxisAngle(_fax, s * a);
    if (k >= 1) { S.phase = 'roll'; S.bv = 5.4; S.bounce = .07; Audio.play('metalSlam', { gain: .9, rate: .75, x: FEU.bx, y: .3, z: S.bz, ref: 4 }); FEU_SND.clank(FEU.bx, S.bz, .7); shake = Math.max(shake, .02);
      FEU_SND.loopNoise('roll', true, { x: FEU.bx, y: .2, z: S.bz, ref: 3, lp: 170, gain: .9 }); } return; }
  if (S.phase !== 'roll' && S.phase !== 'rest') return;
  if (S.phase === 'roll') {
    // der Verfolger rennt dir nach – mitten in die Bahn des Fasses
    if (ch2.chase === 'run' && zombie.x < S.bx && zombie.x > S.bx - 7) zombie.z += (S.bz - zombie.z) * Math.min(1, dt * 2.5);
    const nx = S.bx - S.bv * dt; let hitObs = false;
    for (const o of obstacles) { const c = o.userData.col; if (nx - r < c.maxX && nx + r > c.minX && S.bz - hl < c.maxZ && S.bz + hl > c.minZ && S.bx - r >= c.maxX - .02) { hitObs = true; break; } }
    if (hitObs) { S.bv = S.bv > 1.2 ? -S.bv * .22 : 0; FEU_SND.clank(S.bx, S.bz, .8); } else S.bx = nx;
    // Trifft den Verfolger an den Schienbeinen
    if (ch2.chase === 'run' && zombie.g.visible && Math.abs(zombie.x - S.bx) < r + .38 && Math.abs(zombie.z - S.bz) < hl + .55 && S.bv > .4) { feuer_zombieFall(true); S.bv = -S.bv * .12; FEU_SND.clank(S.bx, S.bz, 1); Audio.play('metalSheet', { gain: .5, rate: .6, x: S.bx, y: .5, z: S.bz, ref: 3 }); }
    S.bv -= Math.sign(S.bv) * dt * (Math.abs(S.bv) > 1 ? .75 : 2.2); S.bang += S.bv / r * dt;
    S.bounce = Math.max(0, S.bounce - dt * .12); const hop = Math.abs(Math.sin(S.bang)) * .006 + S.bounce * Math.abs(Math.sin(S.bang * 1.5)) * .5;
    if (Math.floor(S.bang / PI) !== S.bk) { S.bk = Math.floor(S.bang / PI); FEU_SND.clank(S.bx, S.bz, Math.min(.5, Math.abs(S.bv) * .1)); }
    FEU_SND.level('roll', Math.min(1, Math.abs(S.bv) / 4), S.bx, S.bz);
    if (Math.abs(S.bv) < .12) { S.phase = 'rest'; S.bv = 0; FEU_SND.loopNoise('roll', false); feuer_spill(); }
    B.position.set(S.bx, r + hop, S.bz); _fq1.setFromAxisAngle(_fax, s * PI / 2); _fq2.setFromAxisAngle(_faz, S.bang); B.quaternion.copy(_fq2).multiply(_fq1);
  }
  // Liegt das Fass und rennt der Verfolger hinein, stolpert er
  if (S.phase === 'rest' && !S.fell && !S.spent && ch2.chase === 'run' && zombie.g.visible && Math.abs(zombie.x - S.bx) < r + .3 && Math.abs(zombie.z - S.bz) < hl + .45) feuer_zombieFall(false);
}
// ---------------------------------------------------------------- Öl läuft aus
function feuer_spill() {
  const S = feuer_S; if (S.spilled) return; S.spilled = true; S.spillT = 0;
  const bodyX = S.fell ? zombie.x - .85 : S.bx - 1.1; S.oilX = S.bx - FEU.oilW / 2 + 1.1;
  feuer_field(S.bx, S.bz, bodyX); S.oil.position.set(S.oilX, .016, Z); S.oilU.uSpread.value = 1.02; FEU_SND.pour(S.bx, S.bz);
}
// ---------------------------------------------------------------- Der Verfolger stürzt, liegt im Öl, steht wieder auf – oder brennt
function feuer_zs() { return typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; }
function feuer_anim(idle) { // Grundhaltung: Stehen (Idle) im Liegen, Gehen in der Jagd
  const Zm = feuer_zs(); if (!Zm || !innen_kapitel_S.ghostGL) return; const cl = innen_kapitel_S.ghostGL.animations, w = cl.find(a => /walk/i.test(a.name)), i = cl.find(a => /idle/i.test(a.name)); if (!w || !i) return;
  const aw = Zm.mx.clipAction(w), ai = Zm.mx.clipAction(i); if (idle) { aw.stop(); ai.reset().play(); } else { ai.stop(); aw.reset().play(); aw.timeScale = 2.3; } Zm.mx.timeScale = 1;
}
function feuer_zombieFall(byRoll) {
  const S = feuer_S; if (S.fell) return; S.fell = true; ch2.chase = 'fire'; Audio.chaseMusic(false); Audio.chaseLevel(0);
  S.zs = { st: 'fall', t: 0, th: 0, yaw: zombie.g.rotation.y, x: zombie.x, z: zombie.z, sit: 0, reach: 0, curl: 0, writhe: 0, char: 0, burn: 0, down: 0 };
  feuer_anim(true); zombie.g.rotation.z = 0; Audio.groan(zombie.x, zombie.z, true);
  if (!S.spilled && S.phase === 'roll') S.bv = Math.min(S.bv, .6);
}
function feuer_zombieUpdate(dt, t) {
  const S = feuer_S, Q = S.zs; if (!Q || !zombie.g.visible) return; Q.t += dt;
  if (Q.st === 'fall') { const k = Math.min(1, Q.t / .62); Q.th = 1.52 * k * k; Q.arms = Math.sin(k * PI) * 1.2;
    if (k >= 1) { Q.st = 'down'; Q.t = 0; Q.down = 0; Q.arms = 0; TOD_SND.thud(1); Audio.play('woodFall1', { gain: .7, rate: .6, x: Q.x, y: .2, z: Q.z, ref: 3 }); shake = Math.max(shake, .035); if (!S.spilled && S.phase === 'rest') feuer_spill(); } }
  else if (Q.st === 'down') { Q.down += dt; Q.th = 1.52 + Math.sin(Q.t * 1.7) * .02;
    // rutscht im Öl: versucht sich aufzurichten, gleitet wieder weg
    const cyc = (Q.t % 2.1) / 2.1; Q.sit = cyc < .55 ? Math.sin(cyc / .55 * PI) * .55 : 0; Q.writhe = .6;
    if (cyc > .5 && cyc < .52 && !Q.slip) { Q.slip = true; Audio.play('waterFlow', { gain: .3, rate: .9, lp: 900, dur: .5, x: Q.x - .8, y: .2, z: Q.z, ref: 2 }); Audio.groan(Q.x, Q.z, false); } if (cyc < .1) Q.slip = false;
    const limit = S.lighter ? 11 : 4.8;
    if (!S.said.oel && Q.down > 1.2) { S.said.oel = true; if (S.lighter) subtitle('Er liegt im Öl. Das Feuerzeug in deiner Tasche wiegt plötzlich schwer.', 3600, ''); else say([['Öl. Überall Öl. Wenn ich jetzt Feuer hätte …', 3000, 'LUKE']]); }
    if (Q.down > limit && S.phase !== 'ignite') { Q.st = 'rise'; Q.t = 0; Audio.groan(Q.x, Q.z, true); } }
  else if (Q.st === 'rise') { const k = Math.min(1, Q.t / 1.1); Q.sit = Math.sin(Math.min(1, k * 1.6) * PI / 2) * (1 - k); Q.th = 1.52 * (1 - k * k * (3 - 2 * k)); Q.writhe = .3 * (1 - k);
    if (k >= 1) { Q.st = null; S.zs = null; S.spent = true; S.fell = false; S.slipIn = 0; zombie.g.rotation.set(0, Q.yaw, 0); feuer_anim(false); ch2.chase = 'run'; Audio.chaseMusic(true); zombie.t = 0; if (!S.said.weiter) { S.said.weiter = true; subtitle('Er steht wieder auf. Das Öl tropft von ihm.', 2800); } return; } }
  else if (Q.st === 'burn') { // brennt: windet sich, richtet sich auf, greift an dir vorbei zur Tür, bricht zusammen, krümmt sich
    const b = Q.t; Q.burn = Math.min(1, b / 1.2); Q.char = Math.min(1, b / 9); Q.th = 1.52;
    if (b < 2.3) { Q.writhe = 1.3; Q.sit = Math.max(0, Math.sin(b * 4.2)) * .35; }
    else if (b < 3.6) { const k = (b - 2.3) / 1.3; Q.writhe = .7 * (1 - k); Q.sit = .35 + .75 * k * k * (3 - 2 * k); Q.reach = k; }
    else if (b < 5.0) { Q.writhe = .15; Q.sit = 1.1 + Math.sin(b * 2.2) * .06; Q.reach = 1; }
    else if (b < 5.7) { const k = (b - 5) / .7; Q.sit = 1.1 * (1 - k * k) - .15 * k; Q.reach = 1 - k; Q.writhe = 0; }
    else { Q.sit = -.12; Q.reach = 0; Q.curl = Math.min(1, (b - 5.7) / 2.2); Q.writhe = Math.max(0, .25 - (b - 5.7) * .05); if (!Q.thud) { Q.thud = true; TOD_SND.thud(.8); FEU_SND.collapse(Q.x, Q.z); FEU_SND.scream(Q.x, Q.z, 3); } } }
  zombie.g.position.set(Q.x, .1 * Math.sin(Math.max(0, Q.th)), Q.z); zombie.g.rotation.set(0, Q.yaw, Q.th);
  zombie.x = Q.x; zombie.z = Q.z;
}
// Knochen nach dem Animations-Mixer (dieser Tick läuft nach innen_kapitel): Haltung im Liegen, Aufrichten, Greifen, Krümmen
const _fzq = new THREE.Quaternion(), _fzl = new THREE.Vector3(), _fzf = new THREE.Vector3(), _fzp = new THREE.Vector3();
function feuer_bones(t) {
  const S = feuer_S, Q = S.zs, Zm = feuer_zs(); if (!Q || !Zm || !Zm.b || !zombie.g.visible) return; const b = Zm.b;
  Zm.zm.getWorldQuaternion(_fzq); _fzl.set(1, 0, 0).applyQuaternion(_fzq); _fzf.set(0, 0, 1).applyQuaternion(_fzq);
  // innen_kapitel beugt jedes Bild nach vorn (Jagdhaltung) – im Liegen zurücknehmen
  tod_bend(b.spine_02, _fzl, -.45); tod_bend(b.upperarm_l, _fzl, 1.25); tod_bend(b.upperarm_r, _fzl, 1.1); tod_bend(b.neck_01, _fzl, .35);
  const w = Q.writhe || 0, s = Q.sit || 0, rc = Q.reach || 0, cu = Q.curl || 0, ar = Q.arms || 0;
  const sw = Math.sin(t * 7.3) * w, sw2 = Math.sin(t * 5.1 + 1) * w, sw3 = Math.sin(t * 9.7 + 2) * w;
  tod_bend(b.spine_01, _fzl, s * .38 + sw * .12 + cu * .15); tod_bend(b.spine_02, _fzl, s * .4 + sw2 * .1 + cu * .2); tod_bend(b.spine_03, _fzl, s * .32 + cu * .15);
  tod_bend(b.spine_02, _fzf, sw3 * .22); tod_bend(b.neck_01, _fzl, s * .15 - sw * .2 + cu * .3);
  tod_bend(b.upperarm_l, _fzl, -ar - rc * 1.35 - cu * .8 + sw * .5); tod_bend(b.upperarm_r, _fzl, -ar - rc * 1.15 - cu * .7 - sw2 * .5);
  tod_bend(b.upperarm_l, _fzf, sw3 * .4); tod_bend(b.upperarm_r, _fzf, -sw * .4);
  tod_bend(b.lowerarm_l, _fzl, -rc * .15 - cu * 1.5 - Math.abs(sw2) * .4); tod_bend(b.lowerarm_r, _fzl, -rc * .3 - cu * 1.5 - Math.abs(sw) * .4);
  tod_bend(b.thigh_l, _fzl, -cu * .8 - Math.max(0, sw) * .5); tod_bend(b.thigh_r, _fzl, -cu * .7 - Math.max(0, sw3) * .5);
  tod_bend(b.calf_l, _fzl, cu * 1.1 + Math.max(0, sw) * .8); tod_bend(b.calf_r, _fzl, cu * 1.0 + Math.max(0, sw3) * .8);
}
// Verkohlen: Fleisch dunkelt nach, glimmt von innen
const _fcol = new THREE.Color();
function feuer_mats() { const S = feuer_S; if (S.zmats) return S.zmats; const L = []; zombie.g.traverse(o => { if (o.isMesh && o.material && o.material.color && o.material.emissive && !L.some(e => e.m === o.material)) L.push({ m: o.material, c: o.material.color.clone(), e: o.material.emissive.clone(), ei: o.material.emissiveIntensity }); }); return S.zmats = L; }
function feuer_charUpdate(t) { const S = feuer_S, Q = S.zs; if (!Q) return; const k = Q.char || 0, glow = (Q.burn || 0) * (1 - k * .55) * (.6 + .4 * Math.sin(t * 13) * Math.sin(t * 7.7));
  for (const e of feuer_mats()) { e.m.color.copy(e.c).lerp(_fcol.setHex(0x0e0806), k * .93); e.m.emissive.setRGB(.32 * glow, .07 * glow, .01 * glow); e.m.emissiveIntensity = 1; } }
function feuer_matsReset() { for (const e of feuer_mats()) { e.m.color.copy(e.c); e.m.emissive.copy(e.e); e.m.emissiveIntensity = e.ei; } }

// ---------------------------------------------------------------- Zünden (Zwischensequenz mit Handkamera)
function feuer_canIgnite() { const S = feuer_S, P = player.pos, Q = S.zs;
  return S.lighter && S.spilled && Q && Q.st === 'down' && S.phase !== 'ignite' && ch2.chase === 'fire' && S.spread < .8 && P.x > S.oilMaxX + .35 && Math.hypot(P.x - Q.x, P.z - Q.z) < 10 && !state.talking && !ui.overlay; }
const _fcq = new THREE.Quaternion(), _fcq2 = new THREE.Quaternion(), _fce = new THREE.Euler(), _fcm = new THREE.Matrix4(), _fcv = new THREE.Vector3(), _fct = new THREE.Vector3(), _fcu = new THREE.Vector3(0, 1, 0);
function feuer_cam(cam, dt) {
  const S = feuer_S, C = S.cine; if (!C) return; C.t += dt;
  const kin = Math.min(1, C.t / 1.2), kout = C.out ? Math.max(0, 1 - (C.t - C.out) / 1.2) : 1, k = Math.min(kin, kout), e = k * k * (3 - 2 * k);
  if (C.out && C.t - C.out > 1.2) { S.cine = null; setCamOverride(null); return; }
  const Q = S.zs, tb = .8 * (1 - (Q && Q.sit || 0) * .35), look = Q ? _fct.set(Q.x - Math.cos(Q.yaw) * tb, .4 + (Q.sit || 0) * .35, Q.z + Math.sin(Q.yaw) * tb) : _fct.set(S.ignX, .3, S.ignZ);
  // langsame Fahrt auf ihn zu, tief (Flammen im Vordergrund = Tiefe), Handkamera: atmende, leicht zitternde Bewegung
  const dolly = Math.min(1, C.t / 11) * .75, dx = look.x - C.ox, dz = look.z - C.oz, dl = Math.hypot(dx, dz) || 1, T = C.t;
  const hx = Math.sin(T * 1.13) * .018 + Math.sin(T * 2.71 + 1) * .008, hy = Math.sin(T * 1.57 + 2) * .012 + Math.sin(T * 3.3) * .005;
  _fcv.set(C.ox + dx / dl * dolly + C.sx + hx, 1.18 + hy - Math.min(1, C.t / 11) * .12, C.oz + dz / dl * dolly + C.sz + hx * .6);
  cam.position.lerp(_fcv, e); _fcm.lookAt(_fcv, look, _fcu); _fcq.setFromRotationMatrix(_fcm);
  _fce.set(Math.sin(T * .93) * .012 + Math.sin(T * 2.3) * .004, Math.sin(T * .71 + 1) * .014, Math.sin(T * 1.21 + 3) * .018); _fcq2.setFromEuler(_fce); _fcq.multiply(_fcq2);
  cam.quaternion.slerp(_fcq, e);
  if (shake > 0) { cam.position.x += (Math.random() - .5) * shake * .6; cam.position.y += (Math.random() - .5) * shake * .6; }
}
async function feuer_ignite() {
  const S = feuer_S; if (S.phase === 'ignite' || S.phase === 'burn' || S.phase === 'escape') return; if (!S.spilled) { feuer_spill(); S.spillT = 6; }
  const Q = S.zs || (zombie.g.visible ? (feuer_zombieFall(false), S.zs) : null); if (!Q) return; if (Q.st !== 'down') { Q.st = 'down'; Q.t = 0; Q.th = 1.52; Q.arms = 0; }
  S.phase = 'ignite'; const run = ++S.run; S.ignHit.position.set(0, -80, 0); uninteract(S.ignHit);
  state.talking = true; setScripted(() => true); vel.set(0, 0, 0);
  const P = player.pos, f = { x: -Math.sin(player.yaw), z: -Math.cos(player.yaw) };
  S.cine = { t: 0, ox: P.x, oz: P.z, sx: f.z * .45, sz: -f.x * .45 }; setCamOverride(feuer_cam);
  // Zündpunkt: der nächste nasse Punkt vor Luke
  let bi = -1, bd = 1e9; const A = S.pts; for (let i = 0; i < A.length; i += 3) { if (A[i + 2] < S.spread + .06) continue; const d = Math.hypot(A[i] - P.x, A[i + 1] - P.z); if (d < bd) { bd = d; bi = i; } }
  S.ignX = bi >= 0 ? A[bi] : Q.x + .8; S.ignZ = bi >= 0 ? A[bi + 1] : Q.z; S.oilU.uIgn.value.set(S.ignX, S.ignZ);
  story.items = story.items.filter(k => k !== 'feuerzeug');
  subtitle('Das Feuerzeug. Der Daumen findet das Rad von allein.', 2600);
  await wait(500); if (run !== S.run) return; FEU_SND.flick();
  // Wurf: vom Auge in einem Bogen zum Zündpunkt, die kleine Flamme fliegt mit
  const T = S.throwObj, sx = camera.position.x + f.x * .3 - f.z * .15, sy = camera.position.y - .25, sz = camera.position.z + f.z * .3 + f.x * .15;
  await wait(450); if (run !== S.run) return;
  S.throwT = { t: 0, sx, sy, sz, ex: S.ignX, ez: S.ignZ, d: .62 }; if (T) T.position.set(sx, sy, sz);
  await wait(640); if (run !== S.run) return;
  if (T) T.position.set(0, -60, 0); S.throwT = null;
  // Zündung: Sog, „Wuff“, Brüllen in drei Bändern, zischendes Öl
  S.phase = 'burn'; S.burnT = 0; S.burnR = .05; S.soot = 0; FEU_SND.wuff(S.ignX, S.ignZ); feuer_cue('a', true); shake = Math.max(shake, .05); glitchV = .12;
  const fx = S.oilX + 1.2;
  FEU_SND.loopNoise('roar', true, { x: fx, y: .8, z: Z, ref: 4, lp: 180, gain: 1.6 }); FEU_SND.loopNoise('roar2', true, { x: fx, y: 1, z: Z, ref: 4, bp: 620, q: .7, gain: .9, am: 7.3 }); FEU_SND.loopNoise('hiss', true, { x: fx, y: .1, z: Z, ref: 3, hp: 3800, gain: .22, am: 13 });
  S.lightModes = c2Lights.map(L => [L, L.mode, L.cur]); c2Lights.forEach(L => { const lx = L.tube.position.x; if (lx > X + 86 && lx < X + 106) { L.mode = 'dying'; L.dead = -rand(.3, 1.6); } });
  // Ruß-Flächen an die Brandstelle
  S.sootC.position.set(S.oilX + .6, C2.h - .012, Z); S.sootN.position.set(S.oilX + .6, 1.15, Z + 1.835); S.sootS.position.set(S.oilX + .6, 1.15, Z - 1.835);
  const at = (ms, fn) => S.lines.push(setTimeout(() => { if (run === S.run && (S.phase === 'burn' || S.phase === 'escape')) fn(); }, ms));
  at(2100, () => subtitle('Um sein Handgelenk schmilzt ein Plastikband. Darauf, gerade noch lesbar: <b>KRANZ, P.</b>', 4200));
  at(5000, () => subtitle('Onkel Peter …?', 2200, 'LUKE'));
  at(7700, () => subtitle('Er wollte nicht zu mir. Er wollte raus.', 3300, 'LUKE'));
  at(10200, () => { if (S.cine) S.cine.out = S.cine.t; });
  at(11400, () => feuer_escapeStart());
}
function feuer_zombieIgnite() { const S = feuer_S, Q = S.zs; if (!Q || Q.st === 'burn') return; Q.st = 'burn'; Q.t = 0; FEU_SND.scream(Q.x, Q.z, 0); setTimeout(() => { if (S.zs === Q) FEU_SND.scream(Q.x, Q.z, 1); }, 1600); setTimeout(() => { if (S.zs === Q) FEU_SND.scream(Q.x, Q.z, 2); }, 3300); shake = Math.max(shake, .03); }

// ---------------------------------------------------------------- Flucht vor dem Rauch
function feuer_escapeStart(restart) {
  const S = feuer_S, run = restart ? ++S.run : S.run; S.phase = 'escape'; S.air = 30; S.hold = 0; S.relOpen = false; S.escT = 0;
  if (!restart) { S.fog0 = { c: scene.fog.color.getHex(), d: scene.fog.density }; S.vig0 = filmPass.uniforms.vig.value; S.ca0 = filmPass.uniforms.ca.value; }
  setScripted(null); state.talking = false; if (S.cine) S.cine.out = S.cine.out || S.cine.t;
  const P = player.pos; if (!restart || !S.escPos) S.escPos = { x: Math.min(X + 105.4, Math.max(P.x, S.oilMaxX + .8)), z: Math.max(Z - 1.4, Math.min(Z + 1.4, P.z)), yaw: player.yaw };
  chaseDoor.lockedText = 'Die Brandschutztür. Zu. Irgendwo muss es eine Notentriegelung geben.';
  if (!restart) { Audio.intercomClick(); feuer_doorShut(); Audio.play('metalHit2', { gain: .8, rate: .5, x: X + 106, y: 2.2, z: Z, ref: 4 }); shake = Math.max(shake, .02); }
  else feuer_doorShut();
  chaseDoor.lockedText = 'Die Brandschutztür. Zu. Irgendwo muss es eine Notentriegelung geben.'; FEU_SND.alarm(true);
  feuer_cue('a', false); feuer_cue('b', true);
  FEU_SND.loopNoise('draft', true, { x: X + 106, y: .1, z: Z, ref: 2.5, bp: 1650, q: 7, gain: .3 }); FEU_SND.loopNoise('draft2', true, { x: X + 106, y: .2, z: Z, ref: 2, bp: 420, q: 1.5, gain: .25, am: .35 });
  FEU_SND.loopNoise('breath', true, { flat: true, bp: 750, q: 1.1, gain: .16, am: .45 });
  setC2Objective('Raus hier! Der Rauch … Die Brandschutztür hat eine Notentriegelung.'); S.airEl.classList.add('show');
  todCheckpoint('flucht', 'Flucht vor dem Rauch', { x: S.escPos.x, y: 0, z: S.escPos.z, yaw: -PI / 2, persist: false, respawn: async () => { player.pos.set(S.escPos.x, 0, S.escPos.z); player.yaw = -PI / 2; } });
  const at = (ms, fn) => S.lines.push(setTimeout(() => { if (run === S.run && S.phase === 'escape') fn(); }, ms));
  if (!restart) { say([['„Brandalarm. Ebene minus zwei. Brandschutztüren schließen.“', 3400, 'LAUTSPRECHER'], ['„Bitte nicht rennen.“ … *Kichern*', 2400, 'LAUTSPRECHER']]);
    at(6300, () => subtitle('Die Tür ist zu. Irgendwo hier muss man sie aufkriegen.', 3200, 'LUKE')); }
  else at(1200, () => subtitle('Die rote Leuchte. Die Notentriegelung.', 2800, 'LUKE'));
  at(15000, () => { TOD_SND.cough(1); subtitle('Nicht einatmen. Nicht …', 2200, 'LUKE'); });
  at(21500, () => subtitle('Nicht hier unten. Nicht so wie er.', 2800, 'LUKE'));
}
function feuer_escapeUpdate(dt, t) {
  const S = feuer_S, P = player.pos; S.escT += dt; if (!tod_S.dying) S.air = Math.max(0, S.air - dt); const s = 1 - S.air / 30;
  S.airEl.querySelector('u').style.transform = `scaleX(${(S.air / 30).toFixed(3)})`; S.airEl.classList.toggle('low', S.air < 9);
  // Sicht: Rauch wird dichter und sinkt; Ränder werden schwarz, das Bild verschwimmt; der Klang wird dumpf
  S.ceil = C2.h - .35 - 1.2 * Math.min(1, s * 1.25);
  scene.fog.density = .09 + .48 * Math.pow(s, 1.25); scene.fog.color.setRGB(.11 + .03 * Math.sin(t * 3), .085, .07);
  filmPass.uniforms.vig.value = S.vig0 + 1.5 * s; filmPass.uniforms.ca.value = S.ca0 + .02 * s;
  renderer.domElement.style.filter = s > .55 ? `blur(${((s - .55) * 4.5).toFixed(2)}px)` : '';
  S.muffT = (S.muffT || 0) - dt; if (S.muffT < 0) { S.muffT = .5; todMuffle(Math.max(650, 16000 * Math.pow(1 - s, 2.2)), .5); }
  FEU_SND.level('breath', .25 + s * 1.1); const br = feuer_S.snd.breath; if (br && br.amO) br.amO.frequency.setTargetAtTime(.4 + s * .75, Audio.ctx.currentTime, .5);
  if (s > .7 && Math.random() < dt * .7) shake = Math.max(shake, .012);
  S.coughT = (S.coughT ?? 3) - dt; if (S.coughT < 0) { S.coughT = rand(4.5, 6.5) * (1 - s * .65); TOD_SND.cough(.7 + s * .5); }
  S.beatT = (S.beatT ?? 1) - dt; if (s > .35 && S.beatT < 0) { S.beatT = 1.15 - s * .5; Audio.heart(); }
  Audio.duck(1.2);
  // Notentriegelung: rote Rundumleuchte, E halten
  const pulse = Math.pow(Math.max(0, Math.sin(t * 5.2)), 3); S.redL.intensity = S.relOpen ? .6 : .8 + 5 * pulse; S.relLamp.material.opacity = S.relOpen ? .25 : .25 + .75 * pulse;
  const dR = Math.hypot(P.x - FEU.relX, P.z - (FEU.relZ - .3)); camera.getWorldDirection(_fct);
  const facing = _fct.z > .25 || dR < .9;
  if (!S.relOpen) {
    if (dR < 1.8 && facing && keys.KeyE && !ui.overlay) { S.hold += dt; if (S.hold % .3 < dt) Audio.play(Audio.pick('keys1', 'keys2'), { gain: .25, rate: .5, x: FEU.relX, y: 1.2, z: FEU.relZ, ref: 2 }); } else S.hold = Math.max(0, S.hold - dt * 1.5);
    $('sideInfo').textContent = S.hold > 0 ? '▮'.repeat(Math.ceil(S.hold / 2.2 * 10)).padEnd(10, '▯') : '';
    if (S.hold >= 2.2) { S.relOpen = true; $('sideInfo').textContent = ''; chaseDoor.locked = false; chaseDoor.set(true); Audio.slide(X + 106, Z); Audio.play('metalOpen', { gain: 1, rate: .7, x: X + 106, y: 1.2, z: Z, ref: 5 });
      FEU_SND.level('draft', 2.4); FEU_SND.level('draft2', 3); Audio.play('wind2', { gain: .9, rate: .8, dur: 3, fadeIn: .4, x: X + 106.5, y: 1, z: Z, ref: 3 }); subtitle('Kalte Luft!', 1600, 'LUKE'); setC2Objective('Durch die Tür!'); }
  }
  if (S.relOpen && P.x > X + 106.6) return feuer_escaped();
  if (S.air <= 0 && S.phase === 'escape') { S.phase = 'dying'; $('sideInfo').textContent = ''; FEU_SND.loopNoise('breath', false); todDie('rauch'); }
}
async function feuer_escaped() {
  const S = feuer_S; S.phase = 'done'; S.done = true; const run = ++S.run;
  chaseDoor.shut = true; chaseDoor.set(false); chaseDoor.locked = true; chaseDoor.lockedText = 'Dahinter brennt es noch. Die Tür ist heiß.'; Audio.slam(); ch2.chase = 'done';
  feuer_cue('b', false); FEU_SND.loopNoise('draft', false); FEU_SND.loopNoise('draft2', false); FEU_SND.loopNoise('breath', false); S.airEl.classList.remove('show'); $('sideInfo').textContent = '';
  todMuffle(22000, 2.5);
  tod_S.seen.mess = true; todCheckpoint('messraum', 'Der Messraum', { x: X + 108.2, y: 0, z: Z, yaw: -PI / 2 });
  S.clearT = 0; // Sicht klärt sich im Tick
  setTimeout(() => { if (S.done) { zombie.g.visible = false; S.zs = null; feuer_stopFire(); } }, 2500);
  try { const A = Audio; if (A.ctx) KI.pad(A.ctx, A.master, A.ctx.currentTime + .6, [KN('D3'), KN('A3'), KN('F4')], 9, .022, 800); } catch (e) {}
  await wait(500); TOD_SND.cough(1.1); await wait(1100); TOD_SND.cough(.8); TOD_SND.gasp(.7); await wait(900);
  if (run !== S.run) return;
  setC2Objective('Der Messraum. Hier ist es passiert.');
  await say([['Luft. Kalte Luft.', 2400, 'LUKE'], ['Hinter der Tür knistert es. Dann nichts mehr.', 3200], ['Ich hab ihn angezündet. Mamas Bruder. Mit dem Feuerzeug, das sie ihm geschenkt hat.', 4600, 'LUKE'],
    ['Bei Oma im Flur hängen zwei Fotos von ihm. Auf dem einen hat er blaue Augen. Zwei Jahre später braune.', 4800, 'LUKE'], ['… Meine sind auch braun.', 3000, 'LUKE']]);
  gedanke('feuer_nachher', 'Vierunddreißig Jahre hier unten. Er hat es die ganze Zeit gewusst. Und keiner ist gekommen.', 25000, 2);
}
function feuer_stopFire() { const S = feuer_S; S.H = 0; S.burnR = 0; for (const P of [S.pw, S.pf, S.pc, S.ps, S.pe]) { P.n = 0; P.g.instanceCount = 0; } S.fireP.intensity = S.bodyL.intensity = S.redL.intensity = 0; S.relLamp.material.opacity = 0; if (S.haze) S.haze.uniforms.uAmt.value = 0;
  for (const k of ['roar', 'roar2', 'hiss', 'draft', 'draft2', 'breath']) FEU_SND.loopNoise(k, false); FEU_SND.alarm(false); S.oilU.uHeat.value = 0; S.heatCol.minX = -9999; S.heatCol.maxX = -9998; }
function feuer_restoreView() { const S = feuer_S; if (S.fog0) { scene.fog.color.setHex(S.fog0.c); scene.fog.density = S.fog0.d; } if (S.vig0 !== undefined) { filmPass.uniforms.vig.value = S.vig0; filmPass.uniforms.ca.value = S.ca0; } renderer.domElement.style.filter = ''; S.ceil = C2.h - .35; }
// Brandschutztür zu und verriegelt (Grundzustand bis zum Brandalarm)
function feuer_doorShut() { chaseDoor.shut = true; // „shut“: die Basis beendet die Jagd hinter der Tür nie von selbst (kein Weg ohne Feuer)
  chaseDoor.locked = true; chaseDoor.open = false; chaseDoor.lockedText = 'Die Brandschutztür. Zu. „Notentriegelung nur bei Brandalarm.“';
  chaseDoor.m.position.y = 1.2; Object.assign(chaseDoor.col, chaseDoor.saved); }
// Peters Zelle: die Osttür gibt erst nach, wenn Luke das Feuerzeug hat (sie spielt – sie will, dass er es mitnimmt)
function feuer_cellDoor(dt) {
  const S = feuer_S; if (ch2.spiderPhase !== 'gone' || S.done) return;
  if (!S.cellFree) {
    if (!spiderDoorOut.locked || !S.cellLock) { S.cellLock = true; spiderDoorOut.locked = true; spiderDoorOut.lockedText = 'Der Riegel sitzt. Von drüben rührt sich nichts.'; S.cellT = 0; S.cellObj = false; setC2Objective('Raus hier. Die Stahltür im Osten.'); }
    S.cellT += dt; if (!S.cellObj && S.cellT > 20) { S.cellObj = true; setC2Objective('Die Matratze. Da glänzt was.'); }
  } else if (S.cellLock) { S.cellLock = false; spiderDoorOut.locked = false; spiderDoorOut.lockedText = '';
    Audio.play('metalOpen', { gain: .6, rate: 1.35, delay: 1.2, x: X + 46, y: 1.2, z: Z, ref: 3 }); Audio.play('switch1', { gain: .5, rate: .6, delay: 1.1, x: X + 46, y: 1.3, z: Z, ref: 2 });
    setTimeout(() => { if (feuer_S.lighter) { subtitle('Hinter dir, an der Osttür: ein Riegel. Er springt auf. Als hätte jemand gewartet, bis du es hast.', 4600); setC2Objective('Die östliche Stahltür ist frei. Geh weiter.'); } }, 1300); }
}
// ---------------------------------------------------------------- Zurücksetzen (Wiederkehr nach dem Tod)
function feuer_reset(cpId) {
  const S = feuer_S; (S.lines || []).forEach(clearTimeout); S.lines = []; S.run++;
  if (S.done || !ch2.on) return;
  if (cpId === 'flucht' && (S.phase === 'escape' || S.phase === 'dying')) { // Feuer brennt weiter, Rauch zurück auf Anfang, 30 Sekunden
    S.ps.n = Math.min(S.ps.n, 120); feuer_escapeStart(true); return; }
  // alles auf Anfang: Fass steht, kein Öl, kein Feuer, kein Ruß, Verfolger fort, Tür offen
  S.phase = 'idle'; S.cine = null; S.throwT = null; S.spilled = false; S.fell = false; S.spent = false; S.zs = null; S.spread = 1.1; S.H = 0; S.burnR = 0; S.hold = 0; S.relOpen = false; S.said.oel = false; S.said.fassHint = false; S.soot = 0;
  if (S.barrel) { S.barrel.position.set(FEU.bx, FEU.h / 2, FEU.bz); S.barrel.quaternion.identity(); S.barrel.rotation.y = .4; S.barrel.userData.noCol = false; }
  if (!interactables.includes(S.bHit)) interact(S.bHit, S.bHit.userData.label, S.bHit.userData.action);
  S.oil.position.y = -40; S.oilU.uSpread.value = 1.1; S.oilU.uBurnR.value = 0; S.oilU.uHeat.value = 0; S.oilU.uChar.value = 0;
  for (const m of [S.sootC, S.sootN, S.sootS]) { m.material.opacity = 0; m.position.y = -50; }
  feuer_stopFire(); FEU_SND.loopNoise('roll', false); feuer_cue('a', false); feuer_cue('b', false); S.airEl.classList.remove('show'); $('sideInfo').textContent = '';
  feuer_restoreView(); if (S.throwObj) S.throwObj.position.set(0, -60, 0);
  if (S.zmats) feuer_matsReset(); zombie.g.visible = false; zombie.g.rotation.set(0, 0, 0); zombie.g.position.y = 0; feuer_anim(false);
  if (S.lightModes) { for (const [L, m, c] of S.lightModes) { L.mode = m; L.cur = c; L.dead = 0; } S.lightModes = null; }
  if (ch2.chase !== 'done') ch2.chase = 'idle';
  feuer_doorShut(); S.slips = 0; S.said.tuer = false;
  if (S.lighter && !story.items.includes('feuerzeug')) story.items.push('feuerzeug');
  setScripted(null); if (camOverride === feuer_cam) setCamOverride(null);
}
TOD_RESET.push((id) => feuer_reset(id));
MOD_SAVE.push(['feuer', () => ({ l: feuer_S.lighter, d: feuer_S.done }), v => { feuer_items(); if (v.l) { feuer_lighterGone(); if (!v.d && !story.items.includes('feuerzeug')) story.items.push('feuerzeug'); } if (v.d) feuer_S.done = true; }]);

// ---------------------------------------------------------------- Pro Bild
const _fhz = new THREE.Vector3();
WORLD_TICK.push((dt, t) => {
  const S = feuer_S;
  try {
    if (!S.items) feuer_items();
    if (!ch2.on || !S.oil) return;
    const P = player.pos; S.timeU.value = t; S.frame++;
    // Musik vorbereiten, sobald das Amt Strom hat (rendert im Hintergrund)
    if (!S.cues && !S.cueBusy && ch2.power && Audio.ctx && Audio.ctx.state === 'running') feuer_renderCues();
    // Feuerzeug: glänzt im Lampenlicht; Luke bemerkt es
    if (!S.lighter && S.glint && S.lighterObj) { const L = S.lighterObj.position, d = Math.hypot(P.x - L.x, P.z - L.z);
      if (d < 9) { _fct.set(L.x - camera.position.x, L.y - camera.position.y, L.z - camera.position.z).normalize(); camera.getWorldDirection(_fcv); const lit = flashOn && _fcv.dot(_fct) > .93;
        S.glint.material.opacity += ((lit ? .55 + .45 * Math.pow(Math.max(0, Math.sin(t * 3.1)), 8) : .08) - S.glint.material.opacity) * Math.min(1, dt * 8); S.glint.scale.setScalar(.1 + .05 * Math.sin(t * 2.3));
        if (lit && d < 4.5 && ch2.spiderPhase === 'gone') gedanke('feuer_glanz', 'Da, auf der Matratze. Da glänzt was.', 0, 2); }
      else S.glint.material.opacity = 0; }
    if (ch2.chase === 'run' && S.phase === 'idle' && !S.said.fassHint && Math.hypot(P.x - FEU.bx, P.z - FEU.bz) < 4.5) { S.said.fassHint = true; subtitle('Das Ölfass! Umwerfen!', 1800, 'LUKE'); }
    feuer_barrelUpdate(dt, t); feuer_zombieUpdate(dt, t); feuer_bones(t);
    // Wurf des Feuerzeugs
    if (S.throwT && S.throwObj) { const W = S.throwT; W.t += dt; const k = Math.min(1, W.t / W.d); S.throwObj.position.set(W.sx + (W.ex - W.sx) * k, W.sy + (.02 - W.sy) * k + Math.sin(k * PI) * .45, W.sz + (W.ez - W.sz) * k); S.throwObj.rotation.set(k * 9, k * 5, 0);
      if (Math.random() < .8) feuer_emit(S.pc, S.throwObj.position.x, S.throwObj.position.y + .02, S.throwObj.position.z, 0, .25, 0, .3, .04, .08, 0, 0); }
    // Öl breitet sich aus
    if (S.spilled) { S.spillT += dt; S.spread = 1.02 - .94 * (1 - Math.exp(-S.spillT / 2.3)); S.oilU.uSpread.value = S.spread; S.oilU.uTime.value = t; }
    // Zünden anbieten: unsichtbare Fläche vor der Kamera trägt die Aufforderung (gleiches Aussehen wie jede Handlung)
    if (feuer_canIgnite()) { camera.getWorldDirection(_fcv); if (!interactables.includes(S.ignHit)) interact(S.ignHit, 'Das Öl anzünden', () => feuer_ignite()); S.ignHit.position.copy(camera.position).addScaledVector(_fcv, 1.1); S.ignHit.lookAt(camera.position);
      if (!S.said.feuer) { S.said.feuer = true; subtitle('Das Feuerzeug.', 1600, 'LUKE'); } }
    else if (interactables.includes(S.ignHit)) { uninteract(S.ignHit); S.ignHit.position.set(0, -80, 0); }
    // Peters Zelle: Osttür erst mit dem Feuerzeug; die Tafel liegt bis zum Schwarm unter dem Gespinst
    feuer_cellDoor(dt);
    if (!S.tafelFree && ch2.spiderPhase === 'gone' && typeof innen_kapitel_S !== 'undefined' && innen_kapitel_S.pruefCover) { S.tafelFree = true; innen_kapitel_S.pruefCover.visible = false; }
    // Die Brandschutztür ist zu (kein Weg ohne Feuer): Luke merkt es während der Jagd
    if (ch2.chase === 'run' && !S.said.tuer && P.x > X + 103.8) { S.said.tuer = true; Audio.thump(X + 106, 1.2, Z); subtitle('Zu! Die Tür ist zu! „Nur bei Brandalarm“ …', 2600, 'LUKE'); }
    // Peter ist wieder auf den Beinen und läuft durchs Öl: er rutscht noch einmal weg (einmal – dann kommt er durch)
    if (ch2.chase === 'run' && S.spent && !S.fell && S.spilled && (S.slips || 0) < 1 && zombie.g.visible && zombie.x > S.oilMinX + .4 && zombie.x < S.oilMaxX - .2 && Math.abs(zombie.z - Z) < 1.6) {
      S.slipIn = (S.slipIn || 0) + dt; if (S.slipIn > .9) { S.slipIn = 0; S.slips = (S.slips || 0) + 1; feuer_zombieFall(false); if (S.zs) S.zs.down = 3.5; subtitle('Er rutscht im Öl weg. Noch einmal.', 2200); } }
    // Feuer
    const burning = S.phase === 'burn' || S.phase === 'escape' || S.phase === 'dying' || (S.phase === 'done' && S.H > 0);
    if (burning) {
      if (S.phase === 'burn') S.burnT += dt;
      S.burnR = Math.min(9, S.burnR + dt * (S.burnR < 1 ? 1.6 : 3.4)); S.H = Math.min(1, S.H + dt * .8);
      const Q = S.zs; if (Q && Q.st !== 'burn' && Math.hypot(Q.x - Math.cos(Q.yaw) * .8 - S.ignX, Q.z + Math.sin(Q.yaw) * .8 - S.ignZ) < S.burnR + .3) feuer_zombieIgnite();
      S.oilU.uBurnR.value = S.burnR; S.oilU.uHeat.value = S.H; S.oilU.uTime.value = t; S.oilU.uChar.value = Math.min(1, S.oilU.uChar.value + dt * .03);
      S.soot = Math.min(1, S.soot + dt * .045); S.sootC.material.opacity = S.soot * .92; S.sootN.material.opacity = S.sootS.material.opacity = S.soot * .8;
      // Hitze-Wand: niemand geht zurück ins Feuer
      S.heatCol.minX = S.oilMinX - 2; S.heatCol.maxX = Math.min(S.oilMaxX, S.ignX + S.burnR) + .15; S.heatCol.minZ = Z - 2; S.heatCol.maxZ = Z + 2;
      if (P.x < S.heatCol.maxX + .5 && !S.said.hitze && S.phase === 'escape') { S.said.hitze = true; toast('Die Hitze ist eine Wand. Da kommst du nicht durch.', 2600); }
      // Flammen aus dem Öl: breite Flammenwände, Zungen, heller Kern am Boden; Funken
      const area = Math.min(1, S.burnR / 3);
      S.accW = (S.accW || 0) + S.H * area * 42 * dt; while (S.accW > 1) { S.accW--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pw, p.x, -.02, p.z, rand(-.05, .05), rand(.08, .2), rand(-.05, .05), rand(1.3, 2), .6, rand(.9, 1.4) * (.35 + p.v * .9), rand(-.06, .06), rand(-.04, .04)); }
      S.accF = (S.accF || 0) + S.H * (30 + 110 * area) * dt; while (S.accF > 1) { S.accF--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pf, p.x + rand(-.05, .05), .01, p.z + rand(-.05, .05), rand(-.08, .08), rand(.8, 1.5), rand(-.08, .08), rand(.6, 1.1), .16, rand(.28, .52) * (.3 + p.v * 1.0), rand(-.18, .18), rand(-.3, .3)); }
      S.accC = (S.accC || 0) + S.H * (20 + 70 * area) * dt; while (S.accC > 1) { S.accC--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pc, p.x, .0, p.z, 0, rand(.3, .6), 0, rand(.35, .6), .12, rand(.16, .28) * (.4 + p.v * .8), rand(-.1, .1), 0); }
      S.accS = (S.accS || 0) + S.H * 20 * dt; while (S.accS > 1) { S.accS--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.ps, p.x, rand(.9, 1.4), p.z, rand(-.1, .25), rand(.5, .9), rand(-.15, .15), rand(8, 11), rand(.9, 1.3), rand(2.4, 3.4), rand(0, 6), rand(-.12, .12)); }
      if (S.phase === 'escape') { const s = 1 - S.air / 30; S.accS2 = (S.accS2 || 0) + (4 + 10 * s) * dt; while (S.accS2 > 1) { S.accS2--; feuer_emit(S.ps, P.x + rand(-1.5, 3.5), S.ceil + rand(-.3, .2), Math.max(Z - 1.5, Math.min(Z + 1.5, P.z + rand(-1.5, 1.5))), rand(0, .15), rand(-.05, .03), rand(-.1, .1), rand(7, 10), rand(1.6, 2.2), rand(3, 4), rand(0, 6), rand(-.08, .08)); } }
      S.accE = (S.accE || 0) + S.H * 22 * dt; while (S.accE > 1) { S.accE--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pe, p.x, rand(.2, .8), p.z, rand(-.4, .4), rand(1.4, 3.2), rand(-.4, .4), rand(.9, 2.4), .016, .01, 0, 0); }
      // Der Körper brennt
      if (Q && Q.st === 'burn' && zombie.g.visible) { const Zm = feuer_zs(), bs = Zm && Zm.b ? ['spine_02', 'spine_03', 'head', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'pelvis'] : null;
        S.accB = (S.accB || 0) + (Q.burn || 0) * (1 - (Q.char || 0) * .4) * 75 * dt;
        while (S.accB > 1) { S.accB--; let x, y, z; if (bs) { const bn = Zm.b[bs[Math.floor(Math.random() * bs.length)]]; if (!bn) continue; bn.getWorldPosition(_fzp); x = _fzp.x; y = _fzp.y; z = _fzp.z; } else { const k = Math.random(); x = Q.x - Math.cos(Q.yaw) * k * 1.7; y = .25; z = Q.z + Math.sin(Q.yaw) * k * 1.7; }
          const big = Math.random() < .25; feuer_emit(big ? S.pw : S.pf, x + rand(-.08, .08), Math.max(.02, y - .1), z + rand(-.08, .08), rand(-.1, .1), rand(.8, 1.5), rand(-.1, .1), big ? rand(.8, 1.2) : rand(.45, .8), .15, big ? rand(.45, .65) : rand(.25, .4), rand(-.2, .2), rand(-.3, .3)); }
        S.bodyL.position.set(Q.x - Math.cos(Q.yaw) * .8, .7 + (Q.sit || 0) * .4, Q.z + Math.sin(Q.yaw) * .8); S.bodyL.intensity = (Q.burn || 0) * (1 - (Q.char || 0) * .5) * (4.5 + Math.sin(t * 19) * 1.2); }
      else S.bodyL.intensity *= 1 - Math.min(1, dt * 2);
      feuer_charUpdate(t);
      // Schattenlicht: flackert, wandert mit der Flammenmitte; Schatten jedes zweite Bild neu
      const fl = 1 + Math.sin(t * 17) * .16 + Math.sin(t * 23.7) * .12 + Math.sin(t * 5.3) * .1 + (Math.random() - .5) * .18;
      S.fireP.position.set(Math.max(S.oilMinX + 1, Math.min(S.oilMaxX - .5, S.ignX - Math.min(S.burnR, 2.5) * .5)) + Math.sin(t * 7.1) * .12, .75 + Math.sin(t * 9.3) * .08, Z + Math.sin(t * 6.3) * .1); S.fireP.intensity = S.H * 9 * fl;
      if (S.frame % 3 === 0) S.fireP.shadow.needsUpdate = true;
      // Klang: Brüllen schwillt an, Knistern, Knallen, einstürzende Teile, dumpfe Druckstöße
      FEU_SND.level('roar', S.H * (.8 + .2 * fl)); FEU_SND.level('roar2', S.H * .85); FEU_SND.level('hiss', S.H * (1 - S.oilU.uChar.value * .6));
      if (Math.random() < dt * 11 * S.H) { const p = feuer_burnPoint(); if (p) FEU_SND.crackle(p.x, p.z); }
      if (Math.random() < dt * .9 * S.H) { const p = feuer_burnPoint(); if (p) { FEU_SND.pop(p.x, p.z); for (let k = 0; k < 6; k++) feuer_emit(S.pe, p.x, .3, p.z, rand(-1, 1), rand(2, 4), rand(-1, 1), rand(.6, 1.4), .018, .01, 0, 0); } }
      S.colT = (S.colT ?? 4) - dt; if (S.colT < 0 && S.burnT > 3) { S.colT = rand(5, 9); const p = feuer_burnPoint(); if (p) { FEU_SND.collapse(p.x, p.z); shake = Math.max(shake, .02); for (let k = 0; k < 16; k++) feuer_emit(S.pe, p.x, 1.2, p.z, rand(-1.4, 1.4), rand(-.5, 2.5), rand(-1.4, 1.4), rand(.8, 1.8), .02, .012, 0, 0); } }
      S.ps.m.material.uniforms.uGlowPos.value.set(S.fireP.position.x, .5, Z); S.ps.m.material.uniforms.uGlow.value = S.H * .55 * fl;
      // Hitzeflimmern über den Flammen (Bildmitte des Brandes auf dem Schirm)
      if (S.haze) { _fhz.set(S.fireP.position.x, .9, Z).project(camera); const on = _fhz.z < 1 && Math.abs(_fhz.x) < 1.6 && Math.abs(_fhz.y) < 1.6; const U = S.haze.uniforms;
        U.uAmt.value = on ? S.H * (S.phase === 'escape' ? .8 : 1) : 0; U.uC.value.set(_fhz.x * .5 + .5, _fhz.y * .5 + .5); U.uR.value = Math.min(.6, 1.5 / Math.max(1.5, camera.position.distanceTo(S.fireP.position))); U.uT.value = t; U.uAsp.value = camera.aspect; }
    }
    for (const [Ps, k] of [[S.pw, 0], [S.pf, 0], [S.pc, 0], [S.ps, 1], [S.pe, 2]]) if (Ps.n) feuer_step(Ps, dt, k, t);
    if (S.phase === 'escape') feuer_escapeUpdate(dt, t);
    else if (S.phase !== 'dying' && S.phase !== 'burn' && S.phase !== 'ignite' && S.redL.intensity > 0 && !S.done) S.redL.intensity = 0;
    // Nach der Flucht: Sicht klärt sich
    if (S.done && S.clearT !== undefined && S.clearT < 1 && S.fog0) { S.clearT = Math.min(1, S.clearT + dt / 2.5); const k = S.clearT;
      scene.fog.density += (S.fog0.d - scene.fog.density) * Math.min(1, dt * 2 + k * k); if (k >= 1) feuer_restoreView(); else { filmPass.uniforms.vig.value += (S.vig0 - filmPass.uniforms.vig.value) * dt * 2; if (k > .5) renderer.domElement.style.filter = ''; } }
  } catch (e) { if (!S.err) { S.err = true; console.warn('Feuer-Tick', e); } }
});
