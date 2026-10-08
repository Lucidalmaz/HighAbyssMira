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
const FEU = { bx: X + 76.3, bz: Z - 1.25, tip: 1, r: .29, h: .86, relX: X + 103.0, relZ: Z + 1.84, oilW: 6.4, oilD: 3.64, fw: 256, fh: 146 };
// ---------------------------------------------------------------- Texturen (prozedural, einmal beim Laden)
function feuer_canvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; echt_an(() => draw(c.getContext('2d'), w, h)); return c; }
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
// Flamme (Heizölbrand): wenige, große Zungen verschiedener Höhe (vSeed), Kontur von doppelt verwirbeltem Rauschen zerfressen, Spitzen lösen sich ab.
// Farbe als Temperatur: unten orange-rot, dazwischen dunkle, rußige Taschen (undurchsichtig), Gelb nur an dünnen Rändern und Spitzen; oben geht die Zunge in
// schwarzen Ruß über. Fast deckend gezeichnet (vorvervielfachte Deckkraft), damit sich Schichten nicht zu Weiß aufaddieren.
const FEU_FS_FLAME = `uniform float uTime, uInt, uCore; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW; ${FEU_NOISE}
  void main(){ float y = vUv.y, t = uTime * 1.5 + vSeed * 17.;
    float hgt = .72 + .38 * fract(vSeed * 7.31), yy = y / hgt;
    vec2 q = vec2(vUv.x * 2.4 + vSeed * 9.1, yy * 2.0 - t * 1.9);
    vec2 w = vec2(fB(q * .6 + vec2(0., t * .4)), fB(q * .6 + vec2(4.7, t * .35))) - .5;
    float nz = fB(q + w * vec2(1.9, 1.3)), fine = fN(q * 3.7 + w * 2.5 - vec2(0., t * 1.1));
    float x = (vUv.x - .5 + (nz - .5) * .55 * yy + w.x * .18 * yy) * 2.;
    float env = max(0., (1. - x * x * (1.15 + yy * 2.2)) * (1. - yy * .8) * smoothstep(0., .18, y));
    float life = smoothstep(0., .1, vAge) * (1. - smoothstep(.55, 1., vAge));
    float hot = smoothstep(.12, .8, env * (nz * 1.5 + fine * .35 + .05 + uCore * .3 * (1. - yy)) - yy * .28) * life * (.62 + .38 * nz);
    float dark = smoothstep(.06, .45, env * (1. - nz) * (.4 + .6 * fine)) * smoothstep(.1, .65, yy) * life;
    float a = max(hot, dark * .75) * smoothstep(1., .68, y) * smoothstep(.5, .3, abs(vUv.x - .5)); if (a < .02) discard;
    float base = 1. - smoothstep(0., .4, yy), thin = 1. - smoothstep(.2, .7, env);
    vec3 col = mix(vec3(.28, .025, .004), vec3(.88, .18, .015), smoothstep(0., .35, hot));
    col = mix(col, vec3(1., .38, .05), smoothstep(.3, .8, hot) * (.55 + .45 * base));
    col = mix(col, vec3(1., .58, .13), smoothstep(.6, 1., hot) * thin * .6 * (.4 + .6 * (1. - base)));
    col = mix(col, vec3(.05, .03, .018) * (.6 + .4 * fine), dark * (1. - hot * .8));
    gl_FragColor = vec4(col * uInt * a, a * .85); }`;
// Rauch: weiche, rollende Schwaden; von unten und zum Feuer hin orange angestrahlt; nah an der Kamera ausgeblendet (keine bildfüllenden Flächen)
const FEU_FS_SMOKE = `uniform float uTime, uA, uGlow; uniform vec3 uCol, uGlowPos; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW; ${FEU_NOISE}
  void main(){ vec2 q = vUv - .5; float r = length(q) * 2.;
    float n1 = fB(vUv * 2.2 + vec2(vSeed * 9., uTime * .06 + vAge * .9)), n2 = fB(vUv * 4.6 - vec2(uTime * .08 + vAge, vSeed * 3.));
    float d = smoothstep(1., .1, r + (n1 - .5) * .9) * (.55 + .45 * n2);
    float a = d * smoothstep(0., .2, vAge) * (1. - smoothstep(.6, 1., vAge)) * uA * smoothstep(.5, 2.2, distance(vW, cameraPosition)); if (a < .004) discard;
    float lit = uGlow * exp(-distance(vW, uGlowPos) * .45) * (1.35 - vUv.y * 1.15) * (.4 + .6 * n2);
    gl_FragColor = vec4(uCol * (.6 + .7 * n1) + vec3(1., .36, .07) * lit, min(a, .94)); }`;
const FEU_FS_DOT = `uniform sampler2D map; varying vec2 vUv; varying float vAge, vSeed; varying vec3 vW;
  void main(){ float a = texture2D(map, vUv).r * (1. - smoothstep(.55, 1., vAge)) * (.6 + .4 * sin(vAge * 22. + vSeed * 20.)); if (a < .01) discard; gl_FragColor = vec4(mix(vec3(1., .78, .4), vec3(1., .32, .06), vAge) * 1.4, a); }`;
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
function feuer_step(P, dt, kind, t, F) {
  const ip = P.ip.array, id = P.id.array, ceil = kind === 3 && F && F.deckeY !== undefined ? F.deckeY : feuer_S.ceil;
  for (let i = 0; i < P.n; i++) {
    P.age[i] += dt; if (P.age[i] >= P.life[i]) { const j = --P.n; if (i !== j) { P.x[i] = P.x[j]; P.y[i] = P.y[j]; P.z[i] = P.z[j]; P.vx[i] = P.vx[j]; P.vy[i] = P.vy[j]; P.vz[i] = P.vz[j]; P.age[i] = P.age[j]; P.life[i] = P.life[j]; P.size[i] = P.size[j]; P.s1[i] = P.s1[j]; P.rot[i] = P.rot[j]; P.rv[i] = P.rv[j]; P.seed[i] = P.seed[j]; } i--; continue; }
    if (kind === 0) { P.vy[i] *= 1 - dt * .5; P.vx[i] += Math.sin(t * 2.3 + P.seed[i] * 30) * dt * .25; }
    else if (kind === 1) { if (P.y[i] > ceil) { P.vy[i] = Math.min(P.vy[i], 0) - dt * .04; P.vx[i] = Math.min(.5, P.vx[i] + dt * .14); } else if (P.y[i] < ceil - .6) P.vy[i] += dt * .06; P.vz[i] *= 1 - dt * .4; if (P.z[i] > Z + 1.5 || P.z[i] < Z - 1.5) P.vz[i] = -P.vz[i] * .5; }
    else if (kind === 3) { P.vx[i] *= 1 - dt * .25; P.vz[i] *= 1 - dt * .25; P.vx[i] += Math.sin(t * .8 + P.seed[i] * 40) * dt * .05; if (F && F.deckeY !== undefined && P.y[i] > ceil) { P.vy[i] = Math.min(P.vy[i], 0); P.vx[i] += dt * .15; } else P.vy[i] += dt * .03; }
    else { const dr = 1 - dt * .35; P.vx[i] = P.vx[i] * dr + Math.sin(t * 5 + P.seed[i] * 50) * dt * .7; P.vz[i] = P.vz[i] * dr + Math.cos(t * 4.3 + P.seed[i] * 40) * dt * .7; P.vy[i] = P.vy[i] * (1 - dt * .15) - dt * (P.seed[i] > .6 ? 1.6 : .25); P.rot[i] = Math.atan2(-P.vx[i], P.vy[i]); }
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
    if (on && !S.alarm && A.buf.amb_alarm) { const s = A.ctx.createBufferSource(), g = A.ctx.createGain(), p = A.at(X + 105.5, 2.3, Z + 1.6, 4), nop = { stop() {} }; s.buffer = A.buf.amb_alarm; s.loop = true; // aufgenommene Glocke (Modul klang)
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5, t + .05); s.connect(g); g.connect(p); s.start(); S.alarm = { o: s, o2: nop, lf: nop, g, p }; }
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
  if (typeof klang_load === 'function') { const [a, b] = await Promise.all([klang_load('mu_feuer_a'), klang_load('mu_feuer_b')]); if (a && b) { S.cues = { a, b }; S.cueBusy = false; return; } } // echte Blechbläser, Pauken, Streicher (Modul klang); sonst Synthese
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
          uv += (vec2(sin(uv.y * 95. - uT * 11.) + sin(uv.y * 41. + uv.x * 17. - uT * 7.), cos(uv.x * 70. - uT * 9.)) * .0022 + vec2(sin(uv.y * 23. - uT * 4.3 + uv.x * 9.), cos(uv.x * 19. - uT * 3.1 + uv.y * 7.)) * .0016) * uAmt * m; }
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
  interact(S.bHit, 'Ölfass', () => feuer_barrelAct());
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
      if (ECHT.img.oel) { x.save(); x.globalCompositeOperation = 'lighten'; x.globalAlpha = .9; x.drawImage(ECHT.img.oel, 0, 0, w, w); x.restore(); } // echter Ölfleck (Megascans „Oil Stain“): Filmstruktur und Ränder als Detail der Lache
      x.globalAlpha = .08; for (let i = 0; i < 7; i++) { x.strokeStyle = ['#6a2fa0', '#2f7fa0', '#a09a2f', '#a0442f'][i % 4]; x.lineWidth = 6 + Math.random() * 10; x.beginPath(); x.arc(Math.random() * w, Math.random() * w, 30 + Math.random() * 90, 0, 6.28); x.stroke(); } }));
    col.colorSpace = THREE.SRGBColorSpace; col.wrapS = col.wrapT = THREE.RepeatWrapping; col.repeat.set(2.5, 1.4);
    const U = S.oilU = { uSpread: { value: 1.1 }, uIgn: { value: new THREE.Vector2(0, 0) }, uBurnR: { value: 0 }, uHeat: { value: 0 }, uTime: { value: 0 }, uChar: { value: 0 } };
    const mat = new THREE.MeshStandardMaterial({ map: col, alphaMap: S.fieldTex, color: 0xffffff, roughness: .07, metalness: .15, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -5, envMapIntensity: 1.3 });
    mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vFeuW;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vFeuW = (modelMatrix * vec4(transformed, 1.)).xyz;');
      sh.fragmentShader = 'uniform float uSpread, uBurnR, uHeat, uTime, uChar; uniform vec2 uIgn; varying vec3 vFeuW;\n' + sh.fragmentShader
        .replace('#include <alphamap_fragment>', 'float feuF = texture2D(alphaMap, vAlphaMapUv).g; float feuA = smoothstep(uSpread, uSpread + .05, feuF); diffuseColor.a *= feuA * (.96 + uChar * .04); diffuseColor.rgb *= 1. - uChar * .7;')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, .85, uChar);')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n float feuD = distance(vFeuW.xz, uIgn); float feuB = (1. - smoothstep(uBurnR - .5, uBurnR, feuD)) * feuA * uHeat; float feuN = .55 + .45 * sin(uTime * 11. + vFeuW.x * 7.3 + sin(vFeuW.z * 5. + uTime * 3.)); float feuP = smoothstep(.35, .8, sin(vFeuW.x * 3.1 + uTime * 1.3) * sin(vFeuW.z * 4.3 - uTime * .9) * .5 + .5 * feuF); totalEmissiveRadiance += vec3(1., .26, .04) * feuB * feuN * (.12 + .36 * feuP) + vec3(1., .4, .07) * (1. - smoothstep(0., .35, abs(feuD - uBurnR))) * feuA * step(.01, uHeat) * step(uBurnR, 7.) * .7;'); };
    const oil = S.oil = new THREE.Mesh(new THREE.PlaneGeometry(FEU.oilW, FEU.oilD), mat); oil.rotation.x = -PI / 2; oil.position.set(X + 96, -40, Z); oil.renderOrder = 2; oil.receiveShadow = true; oil.userData.noCol = true; scene.add(oil); }
  // Ölstrahl aus dem Spund des liegenden Fasses (glänzend, dunkel; nur in den ersten Sekunden des Auslaufens)
  S.stream = new THREE.Mesh(new THREE.CylinderGeometry(.02, .032, 1, 8, 1, true), new THREE.MeshStandardMaterial({ color: 0x140b05, roughness: .04, metalness: .15, transparent: true, opacity: .9, envMapIntensity: 1.6, side: THREE.DoubleSide })); S.stream.visible = false; S.stream.userData.noCol = true; S.stream.castShadow = false; scene.add(S.stream);
  // Ruß danach: Decke und beide Wände über der Brandstelle (Deckkraft wächst mit der Brenndauer)
  { const mk = (tex, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 1, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.userData.noCol = true; m.renderOrder = 1; m.position.set(0, -50, 0); scene.add(m); return m; };
    const tc = feuer_texSoot(512, 256, false), tw = feuer_texSoot(512, 192, true);
    S.sootC = mk(tc, 7, 3.6); S.sootC.rotation.x = PI / 2; S.sootN = mk(tw, 7, 2.3); S.sootN.rotation.y = PI; S.sootS = mk(tw, 7, 2.3); }
  // Partikel: Flammenwände, Zungen, heller Kern, Rauch, Funken
  { const dot = feuer_texDot(), T = S.timeU = { value: 0 };
    const mkMat = (fs, u, blend) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: FEU_VS, fragmentShader: fs, transparent: true, depthWrite: false, blending: blend, fog: false }); if (blend === THREE.CustomBlending) { m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; } return m; };
    const fl = (int, core, asp) => mkMat(FEU_FS_FLAME, { uTime: T, uInt: { value: int }, uCore: { value: core }, uCyl: { value: 1 }, uAsp: { value: asp } }, THREE.CustomBlending);
    S.pw = feuer_sys(120, fl(.62, 0, 1.5), 12); S.pf = feuer_sys(300, fl(.72, .2, 1.9), 13); S.pc = feuer_sys(140, fl(.8, .5, 1.1), 14);
    S.ps = feuer_sys(320, mkMat(FEU_FS_SMOKE, { uTime: T, uCol: { value: new THREE.Color(0x0a0908) }, uA: { value: .95 }, uGlowPos: { value: new THREE.Vector3() }, uGlow: { value: 0 }, uCyl: { value: 0 }, uAsp: { value: 1 } }, THREE.NormalBlending), 11);
    S.pe = feuer_sys(300, mkMat(FEU_FS_DOT, { map: { value: dot }, uCyl: { value: 0 }, uAsp: { value: 3.2 } }, THREE.AdditiveBlending), 15); }
  // Licht: ein echtes Punktlicht mit Schatten (Wände, Möbel, der Körper werfen flackernde Schatten), Schatten nur während des Feuers neu gezeichnet
  { const L = S.fireP = new THREE.PointLight(0xff6a26, 0, 16, 2); L.castShadow = true; L.shadow.mapSize.set(512, 512); L.shadow.bias = -.006; L.shadow.normalBias = .02; L.shadow.camera.near = .15; L.shadow.autoUpdate = false; L.shadow.needsUpdate = true; L.position.set(X + 97, .9, Z); scene.add(L); }
  S.bodyL = new VLight(0xff9048, 0, 7, 2); S.bodyL.position.set(X + 96, .8, Z); scene.add(S.bodyL);
  S.redL = new VLight(0xff1c0c, 0, 6, 2); S.redL.position.set(FEU.relX, 2.05, FEU.relZ - .35); scene.add(S.redL);
  try { S.haze = feuer_hazePass(); } catch (e) { console.warn('Feuer: Flimmern', e); }
  // Notentriegelung der Brandschutztür: Schild an der Nordwand, rote Rundumleuchte, Griff (E halten)
  { S.relSign = feuer_notschalter(FEU.relX, FEU.relZ);
    const lampM = new THREE.MeshBasicMaterial({ map: feuer_texDot(), color: 0xff2a14, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const lp = plane(.5, .5, FEU.relX, 1.72, FEU.relZ - .03, lampM, 0, PI); lp.userData.noCol = true; S.relLamp = lp;
    S.relHit = box(1.5, 1.7, 1.3, FEU.relX, 1.2, FEU.relZ - .5, hidden, { cast: false }); S.relHit.userData.noCol = true;
    interact(S.relHit, () => S.phase === 'escape' && !S.relOpen ? 'Notentriegelung ziehen (E halten)' : 'Notentriegelung', () => { if (S.phase === 'idle' && S.spent && (S.spentT || 0) > 90 && !S.done) { feuer_notAlarm(); return; } if (S.phase !== 'escape') { Audio.play(Audio.pick('keys1', 'keys2'), { gain: .3, rate: .5, x: FEU.relX, y: 1.2, z: FEU.relZ, ref: 2 }); toast(S.done ? 'Der Hebel hängt unten. Die Plombe ist gerissen.' : 'Der Hebel ist verplombt. „Nur bei Brandalarm.“ Er rührt sich keinen Millimeter.', 3600); } }); }
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
  { const css = document.createElement('style'); css.textContent = `#feuerAir { position: absolute; top: 146px; left: 56px; width: 220px; opacity: 0; transition: opacity .6s; }
    #feuerAir.show { opacity: 1; } #feuerAir b { display: block; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .5em; color: #d8b98a; text-shadow: 0 0 2px #000, 0 0 8px #000; margin-bottom: 6px; }
    #feuerAir i { display: block; height: 2px; background: rgba(201,163,106,.18); box-shadow: 0 0 6px #000; } #feuerAir u { display: block; height: 100%; width: 100%; background: linear-gradient(90deg, #8e1d15, #c9a36a); transform-origin: left; }
    #feuerAir.low u { background: #c23a2b; animation: feuerPulse .6s infinite; } @keyframes feuerPulse { 50% { opacity: .35; } }`; document.head.appendChild(css);
    const el = S.airEl = document.createElement('div'); el.id = 'feuerAir'; el.innerHTML = '<b>LUFT</b><i><u></u></i>'; document.getElementById('hud').appendChild(el); }
  window.__feuer = { flamme: (p, v, o) => feuer_flamme(p, v, o), S: feuer_S, FEU, zombie, obstacles, chaseDoor, gate, cell: spiderDoorOut, near: feuer_bedSpot, knock: () => feuer_knock(), ignite: () => feuer_ignite(), escape: () => feuer_escapeStart(), reset: id => feuer_reset(id || 'gang'), giveLighter: () => { feuer_lighterGone(); feuer_items(); addItem('feuerzeug'); }, render: () => feuer_renderCues() };
}]);
// Oberseite der Matratze im Prüfraum finden (Möbel kommen aus innen_kapitel); sonst neben dem Bett auf dem Boden
// ---------------------------------------------------------------- Notschalter (Notentriegelung): Metallgehäuse mit Schutzklappe, Plombe, Hebel, Kontrollleuchten, Leitungsrohr, Schrauben, Gebrauchsspuren (alles aus PBR-Teilen, ein Aufruf)
// feuer_notschalter(x, z, opts) → Gruppe; Stil später mit app/mods/bedienung.js angleichbar. Teile in feuer_S.relParts: lever, cover, ledR, ledG (Zugriff aus feuer_escapeUpdate).
// Echtes Modell: „Fire Alarm Button“ (Thorrian, CC-BY 4.0, Fab) – Handmelder mit Glasscheibe; Aufschrift „BREAK GLASS · PRESS HERE · FIRE“ ist Teil der Textur. Das Halten (E) drückt die Scheibe ein, beim Öffnen springt sie.
// Fehlt das Modell, springt feuer_notschalterAlt ein (Gehäuse aus Primitiven). Teile (Schnittstelle zu feuer_relTick): lever, cover, plombe, ledR, ledG (ohne Gegenstück am echten Modell: Platzhalter), glass.
function feuer_notschalter(x, z, o = {}) {
  const S = feuer_S, y = o.y ?? 1.3, g = new THREE.Group(); g.position.set(x, y, z - .02); g.rotation.y = PI; scene.add(g); g.userData.noCol = true;
  S.relParts = { g, lever: new THREE.Object3D(), cover: new THREE.Object3D(), plombe: { visible: true }, ledR: { emissiveIntensity: 0 }, ledG: { emissiveIntensity: 0 }, glass: null };
  (async () => { try {
    const m = await msFBX('w_alarm', 'model.fbx', { '*': { b: 'BaseColor.png', n: 'Normal_GL.png', r: 'Roughness.png', rough: 1 } });
    m.updateMatrixWorld(true); msFit(m, .13, 'y'); m.updateMatrixWorld(true);
    let body = null, glass = null; m.traverse(c => { if (!c.isMesh) return; if (/sphere/i.test(c.name)) glass = c; else if (!body) body = c; });
    if (!body) throw new Error('kein Gehäuse');
    // Vorderseite finden: vom Gehäuse zur Glasscheibe (waagrecht) → lokale +z (in den Gang)
    const bb = new THREE.Box3().setFromObject(body), gb = glass ? new THREE.Box3().setFromObject(glass) : bb, d = gb.getCenter(new THREE.Vector3()).sub(bb.getCenter(new THREE.Vector3()));
    m.rotation.y = -Math.atan2(d.x, d.z); // dreht die Richtung (d.x, d.z) auf +z
    if (glass) { const gm = [].concat(glass.material)[0].clone(); gm.alphaMap = msTex('w_alarm/Opacity.png'); gm.transparent = true; gm.alphaTest = 0; gm.depthWrite = false; gm.roughness = .15; glass.material = gm; glass.castShadow = false; S.relParts.glass = glass; }
    m.updateMatrixWorld(true); const b2 = new THREE.Box3().setFromObject(m), c = b2.getCenter(new THREE.Vector3()); m.position.x -= c.x; m.position.z -= b2.min.z; m.position.y -= c.y; // Rückseite an die Wand (z = 0), mittig
    m.traverse(c => { c.userData.noCol = true; c.raycast = () => {}; }); g.add(m); S.relModel = m;
  } catch (e) { console.warn('Notschalter: Modell fehlt – Ersatzgehäuse', e); scene.remove(g); feuer_notschalterAlt(x, z, o); } })();
  return g;
}
function feuer_notschalterAlt(x, z, o = {}) {
  const S = feuer_S, y = o.y ?? 1.25, g = new THREE.Group(); g.position.set(x, y, z - .02); g.rotation.y = PI; // lokale +z = in den Gang
  const wear = (w, h, base, fn) => { const c = feuer_canvas(w, h, (cx) => { cx.fillStyle = base; cx.fillRect(0, 0, w, h);
      for (let i = 0; i < w * h / 90; i++) { cx.fillStyle = `rgba(${Math.random() < .5 ? '14,10,8' : '210,200,185'},${Math.random() * .1})`; cx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1 + Math.random() * 1.5); }
      for (let i = 0; i < 26; i++) { cx.strokeStyle = `rgba(215,205,190,${.05 + Math.random() * .16})`; cx.lineWidth = .6; cx.beginPath(); const px = Math.random() * w, py = Math.random() * h; cx.moveTo(px, py); cx.lineTo(px + (Math.random() - .5) * 26, py + (Math.random() - .5) * 8); cx.stroke(); }
      const gr = cx.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(10,8,6,.38)'); cx.fillStyle = gr; cx.fillRect(0, 0, w, h); fn && fn(cx, w, h); }); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const rough = new THREE.CanvasTexture(feuer_canvas(128, 128, (cx, w, h) => { cx.fillStyle = '#9a9a9a'; cx.fillRect(0, 0, w, h); for (let i = 0; i < 700; i++) { const v = 90 + Math.random() * 150; cx.fillStyle = `rgb(${v},${v},${v})`; cx.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 3); } }));
  const redM = new THREE.MeshStandardMaterial({ map: wear(256, 384, '#8f1d14'), roughnessMap: rough, roughness: .7, metalness: .35, bumpMap: rough, bumpScale: .6 });
  const bed = typeof BED !== 'undefined'; // Baukasten bedienung.js: gleiche Materialien wie Tastenfeld, Sicherungs- und Funkkasten
  const steel = bed ? BED.mat('stahl') : new THREE.MeshStandardMaterial({ color: 0x8c8e8b, roughness: .42, metalness: .9, roughnessMap: rough });
  const dark = bed ? BED.mat('bakelit') : new THREE.MeshStandardMaterial({ color: 0x1a1a18, roughness: .8, metalness: .2 });
  const brass = bed ? BED.mat('messing') : new THREE.MeshStandardMaterial({ color: 0xa88a4a, roughness: .45, metalness: .85 });
  const add = (geo, mat, px, py, pz, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); m.rotation.set(rx, ry, rz); m.castShadow = false; g.add(m); return m; };
  // Rückplatte (Wandanschluss) und Gehäuse mit Rand
  add(new THREE.BoxGeometry(.32, .46, .012), dark, 0, 0, .006);
  add(new THREE.BoxGeometry(.28, .42, .07), redM, 0, 0, .047);
  add(new THREE.BoxGeometry(.296, .436, .014), redM, 0, 0, .082);
  // Beschriftung und Nische
  const lbl = wear(256, 128, '#d8d1bd', (cx, w) => { cx.fillStyle = '#7d130c'; cx.fillRect(0, 0, w, 38); cx.fillStyle = '#f1e6cf'; cx.textAlign = 'center'; cx.font = 'bold 25px Arial'; cx.fillText('NOTENTRIEGELUNG', w / 2, 28);
    cx.fillStyle = '#1b1a17'; cx.font = 'bold 15px Arial'; cx.fillText('BRANDSCHUTZTÜR  E-2 / 7', w / 2, 62); cx.font = '13px Arial'; cx.fillText('Klappe öffnen · Hebel ziehen', w / 2, 84); cx.fillText('nur bei BRANDALARM', w / 2, 104); });
  add(new THREE.PlaneGeometry(.236, .118), new THREE.MeshStandardMaterial({ map: lbl, roughness: .6, metalness: .1 }), 0, .148, .0905);
  add(new THREE.BoxGeometry(.236, .17, .004), dark, 0, -.062, .09);
  // Hebelachse, Hebel (T-Griff), Plombe
  const lever = new THREE.Group(); lever.position.set(0, -.016, .098); g.add(lever);
  { const m = new THREE.Mesh(new THREE.CylinderGeometry(.007, .007, .09, 12), steel); m.position.y = -.045; lever.add(m);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, .11, 16), new THREE.MeshStandardMaterial({ color: 0xb02416, roughness: .45, metalness: .1 })); h.rotation.z = PI / 2; h.position.y = -.095; lever.add(h);
    for (const sx of [-1, 1]) { const c = new THREE.Mesh(new THREE.SphereGeometry(.015, 12, 8), h.material); c.position.set(sx * .055, -.095, 0); lever.add(c); } }
  add(new THREE.CylinderGeometry(.017, .017, .012, 16), steel, 0, -.016, .093, PI / 2);
  const plombe = add(new THREE.CylinderGeometry(.006, .006, .004, 10), new THREE.MeshStandardMaterial({ color: 0x777b78, roughness: .35, metalness: .95 }), .012, -.052, .102, PI / 2); // Bleiplombe mit Draht
  add(new THREE.TorusGeometry(.012, .0012, 6, 14, PI * 1.4), brass, .012, -.04, .102, 0, 0, .6);
  // Schutzklappe (klarer, vergilbter Kunststoff, oben angeschlagen)
  const cover = new THREE.Group(); cover.position.set(0, .035, .105); g.add(cover);
  { const pm = new THREE.MeshPhysicalMaterial({ color: 0xcfd6d2, roughness: .22, metalness: 0, transparent: true, opacity: .34, clearcoat: .6, side: THREE.DoubleSide, depthWrite: false });
    const f = new THREE.Mesh(new THREE.BoxGeometry(.2, .15, .006), pm); f.position.set(0, -.075, .02); cover.add(f);
    for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.BoxGeometry(.006, .15, .03), pm); w.position.set(sx * .097, -.075, .006); cover.add(w); }
    const gr = new THREE.Mesh(new THREE.BoxGeometry(.05, .01, .012), dark); gr.position.set(0, -.145, .028); cover.add(gr); }
  for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(.005, .005, .028, 8), steel, sx * .08, .036, .105, 0, 0, PI / 2); // Scharniere
  // Kontrollleuchten mit Beschriftung
  const ledR = new THREE.MeshStandardMaterial({ color: 0x300604, emissive: 0xff1608, emissiveIntensity: 0, roughness: .3 }), ledG = new THREE.MeshStandardMaterial({ color: 0x052008, emissive: 0x18ff40, emissiveIntensity: 0, roughness: .3 });
  add(new THREE.CylinderGeometry(.01, .011, .012, 14), ledR, -.07, -.172, .092, PI / 2); add(new THREE.CylinderGeometry(.01, .011, .012, 14), ledG, .07, -.172, .092, PI / 2);
  add(new THREE.PlaneGeometry(.2, .03), new THREE.MeshStandardMaterial({ map: wear(256, 40, '#c9c2ae', (cx, w) => { cx.fillStyle = '#1b1a17'; cx.font = 'bold 20px Arial'; cx.textAlign = 'center'; cx.fillText('ALARM', 50, 28); cx.fillText('FREI', w - 52, 28); }), roughness: .7 }), 0, -.2, .0905);
  // Schrauben, Leitungsrohr zur Decke mit Schellen, Kabelausgang
  for (const [sx, sy] of [[-.135, .2], [.135, .2], [-.135, -.2], [.135, -.2]]) { const sm = add(new THREE.CylinderGeometry(.008, .008, .006, 6), steel, sx, sy, .09, PI / 2); sm.rotation.y = Math.random() * 3; }
  add(new THREE.CylinderGeometry(.013, .013, 1.0, 10), steel, 0, .72, .03);
  for (const py of [.36, .6, .84]) add(new THREE.BoxGeometry(.04, .012, .018), steel, 0, py, .042);
  add(new THREE.CylinderGeometry(.018, .018, .03, 10), steel, 0, .235, .05);
  g.traverse(m => { m.userData.noCol = true; m.raycast = () => {}; }); scene.add(g);
  S.relParts = { g, lever, cover, ledR, ledG, plombe };
  return g;
}
// Notschalter-Teile: Klappe geht beim Greifen auf, der Hebel folgt dem Halten, Plombe reißt, Leuchten wechseln von rot (Alarm) auf grün (frei)
// Rückfallweg ohne Kampf (90 s nach dem Aufstehen, nicht gezündet): Luke schlägt die Scheibe ein, der Alarm läuft, Peter bleibt stehen und zurück; dann wie gewohnt E halten
function feuer_notAlarm() { const S = feuer_S; if (S.phase !== 'idle') return; ch2.chase = 'fire'; try { Audio.chaseMusic(false); Audio.chaseLevel(0); } catch (e) {} PZ.ki = null; S.zs = null; feuer_anim(true);
  if (typeof qte_aktiv === 'function' && qte_aktiv() && typeof qte_ende === 'function') qte_ende(null); subtitle('Du schlägst die Scheibe ein. Irgendwo springt eine Sirene an.', 2800); feuer_escapeStart(); S.sanft = true; S.air = 30; if (S.airEl) S.airEl.classList.remove('show'); }
function feuer_relTick(pulse) { const S = feuer_S, R = S.relParts; if (!R) return; const p = S.relOpen ? 1 : Math.min(1, S.hold / 1.4), k = x => x * x * (3 - 2 * x);
  R.cover.rotation.x = -1.45 * (S.hold > 0 || S.relOpen ? k(Math.min(1, .35 + p * 1.5)) : 0); R.lever.rotation.x = -.95 * k(p); R.plombe.visible = S.hold < .15 && !S.relOpen; if (R.glass) { R.glass.visible = !(S.relOpen || S.hold > .7); }
  R.ledR.emissiveIntensity = S.relOpen ? 0 : .6 + 3.2 * pulse; R.ledG.emissiveIntensity = S.relOpen ? 3 : 0; }
function feuer_relReset() { const R = feuer_S.relParts; if (!R) return; R.cover.rotation.x = 0; R.lever.rotation.x = 0; R.plombe.visible = true; if (R.glass) R.glass.visible = true; R.ledR.emissiveIntensity = 0; R.ledG.emissiveIntensity = 0; }
// Zeitdruck nach dem Sturz: eine Zeile („ER STEHT AUF“) mit schwindender Frist, schneller werdender Herzschlag, Ziel „Öl anzünden“
function feuer_hurry(k, dt = 0) { const S = feuer_S, el = S.airEl; if (!el) return;
  if (k === null) { if (S.hurry) { S.hurry = false; el.classList.remove('show', 'low'); el.querySelector('b').textContent = 'LUFT'; } return; }
  if (!S.hurry) { S.hurry = true; S.hurryBeat = 0; el.querySelector('b').textContent = 'ER STEHT AUF'; el.classList.add('show'); try { setC2Objective('Das Öl anzünden – schnell! (E)'); } catch (e) {} }
  k = Math.max(0, Math.min(1, k)); el.querySelector('u').style.transform = `scaleX(${k.toFixed(3)})`; el.classList.toggle('low', k < .45);
  S.hurryBeat -= dt; if (S.hurryBeat <= 0) { S.hurryBeat = .95 - .5 * (1 - k); Audio.heart(); } }
// ---------------------------------------------------------------- Wiederverwendbare Flamme (Flammenzungen mit Rausch-Shader, rußiger Rauch, Funken, Licht-Modulation)
// feuer_flamme(parent, pos, opts) → { set(intensität 0…1.5), stop(), start(), update(dt, t) (läuft von selbst), posWorld }
//   parent  Object3D, an dem die Flamme hängt (null = Welt); pos  THREE.Vector3 lokal zum parent (Fußpunkt der Flamme)
//   opts    size (Meter Breite, Standard 1), height (Standard 1.6·size), intensity (Standard 1), smoke (0…2, Standard 1), sparks (0…2, Standard 1),
//           licht  ein VORHANDENES Licht (PointLight o. ä.) – seine Stärke wird um den Ausgangswert herum flackernd moduliert (es wird nie ein Licht angelegt),
//           lichtFaktor (Standard 2.2: Faktor auf die Ausgangsstärke bei intensity 1), deckeY (Rauch staut sich unter dieser Höhe, Standard: kein Dach),
//           klang  true = Knistern/Fauchen aus der Brandstelle (Audio), Rückgabe .set() steuert die Lautstärke
// Beispiel Haus der Erinnerung: const f = feuer_flamme(wandObj, new THREE.Vector3(0, 0, .1), { size: 1.4, licht: vorhandenesPunktlicht }); … f.set(.4) glimmt, f.stop() löscht.
// Leistung: je Flamme ein Instanz-Zeichenaufruf je Schicht (Flamme, Rauch, Funken), kein neues Licht, keine Zuweisungen pro Bild.
const FEU_FL = [];
function feuer_flamme(parent, pos, o = {}) {
  const S = feuer_S, size = o.size ?? 1, T = { value: 0 };
  const mk = (fs, u, blend) => { const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: FEU_VS, fragmentShader: fs, transparent: true, depthWrite: false, blending: blend, fog: false }); if (blend === THREE.CustomBlending) { m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneMinusSrcAlphaFactor; m.blendSrcAlpha = THREE.ZeroFactor; m.blendDstAlpha = THREE.OneFactor; } return m; };
  const fl = (int, core, asp) => mk(FEU_FS_FLAME, { uTime: T, uInt: { value: int }, uCore: { value: core }, uCyl: { value: 1 }, uAsp: { value: asp } }, THREE.CustomBlending);
  const F = { on: true, I: o.intensity ?? 1, size, h: o.height ?? size * 1.6, smoke: o.smoke ?? 1, sparks: o.sparks ?? 1, parent, pos: pos ? pos.clone() : new THREE.Vector3(), licht: o.licht || null, lichtFaktor: o.lichtFaktor ?? 2.2, deckeY: o.deckeY, klang: !!o.klang, T, a: [0, 0, 0, 0], world: new THREE.Vector3(), seed: Math.random() * 50 };
  F.licht0 = F.licht ? F.licht.intensity : 0;
  F.pf = feuer_sys(70, fl(.74, .25, 1.9), 13); F.pc = feuer_sys(40, fl(.82, .5, 1.1), 14);
  F.ps = feuer_sys(90, mk(FEU_FS_SMOKE, { uTime: T, uCol: { value: new THREE.Color(0x0a0908) }, uA: { value: .9 }, uGlowPos: { value: new THREE.Vector3() }, uGlow: { value: 0 }, uCyl: { value: 0 }, uAsp: { value: 1 } }, THREE.NormalBlending), 11);
  F.pe = feuer_sys(50, mk(FEU_FS_DOT, { map: { value: feuer_texDot() }, uCyl: { value: 0 }, uAsp: { value: 3.2 } }, THREE.AdditiveBlending), 15);
  F.set = i => { F.I = Math.max(0, i); F.on = F.I > .001 || F.pf.n + F.ps.n > 0; return F; };
  F.stop = () => { F.I = 0; return F; }; F.start = i => { F.I = i ?? 1; F.on = true; return F; };
  F.dispose = () => { const k = FEU_FL.indexOf(F); if (k >= 0) FEU_FL.splice(k, 1); for (const P of [F.pf, F.pc, F.ps, F.pe]) { scene.remove(P.m); P.g.dispose(); P.m.material.dispose(); } if (F.licht) F.licht.intensity = F.licht0; };
  FEU_FL.push(F); return F;
}
function feuer_flammenTick(dt, t) {
  for (const F of FEU_FL) { if (!F.on) continue; const I = F.I, s = F.size;
    if (F.parent) { _fhw.copy(F.pos); F.parent.localToWorld(_fhw); } else _fhw.copy(F.pos); F.world.copy(_fhw); F.T.value = t;
    const A = F.a; if (I > .001) {
      A[0] += I * (6 + 14 * s) * dt; while (A[0] > 1) { A[0]--; feuer_emit(F.pf, _fhw.x + rand(-.25, .25) * s, _fhw.y + .02, _fhw.z + rand(-.25, .25) * s, rand(-.06, .06), rand(.6, 1.2) * F.h / 1.6, rand(-.06, .06), rand(.8, 1.7), .35 * s, rand(.55, 1.1) * s * (.7 + .3 * I), rand(-.18, .18), rand(-.3, .3)); }
      A[1] += I * (4 + 8 * s) * dt; while (A[1] > 1) { A[1]--; feuer_emit(F.pc, _fhw.x + rand(-.1, .1) * s, _fhw.y, _fhw.z + rand(-.1, .1) * s, 0, rand(.15, .35), 0, rand(.5, .9), .3 * s, rand(.45, .8) * s * I, rand(-.1, .1), 0); }
      A[2] += I * F.smoke * (3 + 5 * s) * dt; while (A[2] > 1) { A[2]--; feuer_emit(F.ps, _fhw.x + rand(-.15, .15) * s, _fhw.y + F.h * rand(.8, 1.1), _fhw.z + rand(-.15, .15) * s, rand(-.08, .12), rand(.35, .7), rand(-.08, .08), rand(5, 8), rand(.45, .7) * s, rand(1.6, 2.6) * s, rand(0, 6), rand(-.1, .1)); }
      A[3] += I * F.sparks * (6 + 6 * s) * dt; while (A[3] > 1) { A[3]--; feuer_emit(F.pe, _fhw.x + rand(-.2, .2) * s, _fhw.y + F.h * rand(.2, .7), _fhw.z + rand(-.2, .2) * s, rand(-.3, .3), rand(.9, 2.2), rand(-.3, .3), rand(1, 2.6), .02, .01, 0, 0); } }
    for (const [Ps, k] of [[F.pf, 0], [F.pc, 0], [F.ps, 3], [F.pe, 2]]) if (Ps.n) feuer_step(Ps, dt, k, t, F);
    F.ps.m.material.uniforms.uGlowPos.value.set(_fhw.x, _fhw.y + .3 * s, _fhw.z); F.ps.m.material.uniforms.uGlow.value = I * .7;
    if (F.licht) { const f = 1 + Math.sin(t * 17 + F.seed) * .16 + Math.sin(t * 23.7 + F.seed) * .12 + Math.sin(t * 5.3) * .1 + (Math.random() - .5) * .16; F.licht.intensity = F.licht0 + (F.licht0 > 0 ? F.licht0 : 1) * F.lichtFaktor * I * f * (F.licht0 > 0 ? 1 : 3); }
    if (F.klang && I > .001) { if (Math.random() < dt * 9 * I) FEU_SND.crackle(_fhw.x, _fhw.z); }
    if (I <= .001 && !F.pf.n && !F.ps.n && !F.pe.n && !F.pc.n) { F.on = false; if (F.licht) F.licht.intensity = F.licht0; } }
}
const _fhw = new THREE.Vector3();
function feuer_bedSpot() {
  const rc = new THREE.Raycaster(), dn = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3(), bb = new THREE.Box3(); scene.updateMatrixWorld(true);
  const near = []; scene.traverse(m => { if (!m.isMesh || m.isInstancedMesh || !m.geometry || !m.visible) return; bb.setFromObject(m); if (bb.isEmpty() || bb.max.x < X + 39.8 || bb.min.x > X + 43 || bb.max.z < Z - 4.9 || bb.min.z > Z - 3.3 || bb.max.y > 1.4 || bb.max.y < .3) return; near.push({ m, top: bb.max.y, b: bb.clone() }); });
  for (const [dx, dz] of [[.72, 0], [.78, .12], [.66, -.1], [.35, -.05], [.1, 0], [-.2, 0]]) {
    const x = X + 41.4 + dx, z = Z - 4.4 + dz; rc.set(o.set(x, 1.6, z), dn); rc.far = 1.6; const sides = near.map(n => { const m = n.m.material; if (!m || Array.isArray(m)) return null; const sd = m.side; m.side = THREE.DoubleSide; return sd; }); const h = rc.intersectObjects(near.map(n => n.m), false).find(h => h.point.y > .3 && h.point.y < 1.05); near.forEach((n, i) => { if (sides[i] !== null) n.m.material.side = sides[i]; });
    if (h) return { x, y: h.point.y, z }; }
  for (const px of [X + 42.12, X + 41.6]) { let top = -1; for (const n of near) { const b = n.b; if (px > b.min.x && px < b.max.x && Z - 4.4 > b.min.z && Z - 4.4 < b.max.z && n.top < .95 && n.top > top) top = n.top; } if (top > .3) return { x: px, y: top - .012, z: Z - 4.4 }; }
  return { x: X + 42.9, y: 0, z: Z - 3.6 };
}
function feuer_items() { if (feuer_S.items) return; try { ITEMS.feuerzeug = { name: 'Peters Feuerzeug', desc: 'Ein Sturmfeuerzeug, Messing, angelaufen. Hinten mit einer Nadel hineingeritzt: „Für Peter. Damit du im Dunkeln nicht allein bist. – M.“' };
  ICONS.feuerzeug = '<svg viewBox="0 0 24 24"><rect x="7" y="10" width="10" height="11" rx="1.5"/><path d="M8 10V7h6v3M11 7c0-2 2-2.5 1.5-5"/></svg>'; feuer_S.items = true; } catch (e) {} }
function feuer_lighterGone() { const S = feuer_S; S.lighter = true; S.cellFree = true; if (S.lighterObj) S.lighterObj.visible = false; if (S.lHit) uninteract(S.lHit); if (S.glint) S.glint.material.opacity = 0; }
function feuer_takeLighter() {
  const S = feuer_S; if (S.lighter || state.talking) return; feuer_items(); S.lighter = true; if (S.lHit) uninteract(S.lHit); if (S.glint) S.glint.material.opacity = 0;
  const done = () => { addItem('feuerzeug'); FEU_SND.flick();
    (async () => { await wait(500); await say([['M. … Marion. Das ist Mamas Schrift. Sie hat es ihm geschenkt, und er hatte es die ganze Zeit hier unten.', 5600, 'LUKE']]); S.cellFree = true; })(); };
  const html = 'Ein Sturmfeuerzeug, Messing, angelaufen. Hinten, mit einer Nadel hineingeritzt:\n<span class="hand">„Für Peter. Damit du im Dunkeln nicht allein bist. – M.“</span>\n\nDu klappst es auf. Das Rad kratzt, ein Funke, eine kleine gelbe Flamme. Es ist noch Benzin drin.';
  if (S.lighterObj) liftTo(S.lighterObj, () => openNote('Peters Feuerzeug', html, 'feuerzeug', done), false); else openNote('Peters Feuerzeug', html, 'feuerzeug', done);
}
// ---------------------------------------------------------------- Das Fass
function feuer_barrelAct() {
  const S = feuer_S; if (S.phase !== 'idle') return;
  toast('Ein Fass Heizöl, randvoll und schwer. Der Spund ist durchgerostet.', 3800); if (!S.said.fass) { S.said.fass = true; gedanke('feuer_fass', 'Wenn das umkippt, schwimmt der ganze Gang.', 800, 2); } // Fassung 3 (AP-16): es kippt im Griff, per Skript (feuer_griff)
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
    if (k >= 1 && S.griffLauf) { S.phase = 'rest'; S.bv = 0; S.bx = FEU.bx; Audio.play('metalSlam', { gain: .8, rate: .75, x: FEU.bx, y: .3, z: S.bz, ref: 4 }); FEU_SND.clank(FEU.bx, S.bz, .7); feuer_spill(); return; } // im Griff: kippt, bleibt liegen, das Öl schießt heraus
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
  const bodyX = S.spillBodyX !== undefined ? S.spillBodyX : S.fell ? zombie.x - .85 : S.bx - 1.1; S.oilX = S.bx - FEU.oilW / 2 + 1.1;
  feuer_field(S.bx, S.bz, bodyX); S.oil.position.set(S.oilX, .016, Z); S.oilU.uSpread.value = 1.02; FEU_SND.pour(S.bx, S.bz);
}
// ---------------------------------------------------------------- Der Verfolger stürzt, liegt im Öl, steht wieder auf – oder brennt
function feuer_zs() { return typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; }
function feuer_anim(idle) { // Grundhaltung: Stehen (Idle) im Liegen, Gehen in der Jagd
  if (PZ.P) { PZ.lockClip = null; PZ.lockT = 0; pz_clip(idle ? 'idle' : 'walk', { fade: .4 }); return; } // R-10: Peter als Figur
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
  if (Q.st === 'fall') { const k = Math.min(1, Q.t / (PZ.P ? 3.1 : .62)); Q.th = 1.52 * k * k; Q.arms = Math.sin(k * PI) * 1.2;
    if (k >= 1) { Q.st = 'down'; Q.t = 0; Q.down = 0; Q.arms = 0; TOD_SND.thud(1); Audio.play('woodFall1', { gain: .7, rate: .6, x: Q.x, y: .2, z: Q.z, ref: 3 }); shake = Math.max(shake, .035); if (!S.spilled && S.phase === 'rest') feuer_spill(); } }
  else if (Q.st === 'down') { Q.down += dt; Q.th = 1.52 + Math.sin(Q.t * 1.7) * .02;
    // rutscht im Öl: versucht sich aufzurichten, gleitet wieder weg
    const cyc = (Q.t % 2.1) / 2.1; Q.sit = cyc < .55 ? Math.sin(cyc / .55 * PI) * .55 : 0; Q.writhe = .6;
    if (S.griff) { Q.sit = Q.down > 8.5 ? Math.min(.6, (Q.down - 8.5) / 3.5 * .6) : .04 + .02 * Math.sin(Q.t * 1.3); Q.writhe = Q.down > 8.5 ? .3 : .08; Q.slip = true; } // Fassung 3: er liegt im Öl, steht nicht auf, sieht Luke an – erst nach etwa zwölf Sekunden kommt er auf die Knie
    if (cyc > .5 && cyc < .52 && !Q.slip) { Q.slip = true; Audio.play('waterFlow', { gain: .3, rate: .9, lp: 900, dur: .5, x: Q.x - .8, y: .2, z: Q.z, ref: 2 }); Audio.groan(Q.x, Q.z, false); } if (cyc < .1) Q.slip = false;
    const limit = S.griff ? 12 : S.lighter ? 11 : 4.8; // Fassung 3: wer etwa zwölf Sekunden wartet, sieht Peter auf die Knie kommen
    if (S.lighter && S.spilled && S.phase === 'rest') feuer_hurry(1 - Q.down / limit, dt); else feuer_hurry(null);
    if (!S.said.oel && Q.down > 1.2) { S.said.oel = true; if (S.lighter) subtitle('Er liegt im Öl. Das Feuerzeug in deiner Tasche wiegt plötzlich schwer.', 3600, ''); else say([['Öl. Überall Öl. Wenn ich jetzt Feuer hätte …', 3000, 'LUKE']]); }
    if (Q.down > limit && S.phase !== 'ignite') { feuer_hurry(null); Q.st = 'rise'; Q.t = 0; Audio.groan(Q.x, Q.z, true); } }
  else if (Q.st === 'rise') { const k = Math.min(1, Q.t / (PZ.P ? 1.8 : 1.1)); Q.sit = Math.sin(Math.min(1, k * 1.6) * PI / 2) * (1 - k); Q.th = 1.52 * (1 - k * k * (3 - 2 * k)); Q.writhe = .3 * (1 - k);
    if (k >= 1) { zombie.greifT = 99; Q.st = null; S.zs = null; S.spent = true; S.fell = false; S.slipIn = 0; zombie.g.rotation.set(0, Q.yaw, 0); feuer_anim(false); ch2.chase = 'run'; Audio.chaseMusic(true); zombie.t = 0; if (!S.said.weiter) { S.said.weiter = true; subtitle('Er steht wieder auf. Das Öl tropft von ihm.', 2800); } return; } }
  else if (Q.st === 'nick') { Q.th = 1.52; const k = Q.t / 2; Q.nick = k < .45 ? Math.sin(k / .45 * PI) : 0; Q.weg = k > .5 ? Math.min(1, (k - .5) / .4) : 0; Q.weg = Q.weg * Q.weg * (3 - 2 * Q.weg); // einmal nicken, dann den Kopf wegdrehen
    if (Q.t >= 2) { Q.st = 'burn'; Q.t = 0; shake = Math.max(shake, .02); } }
  else if (Q.st === 'burn') { // brennt: liegt, den Kopf abgewandt; krümmt sich langsam zusammen (kein Aufrichten, kein Schrei)
    const b = Q.t; Q.burn = Math.min(1, b / 1.2); Q.char = Math.min(1, b / 9); Q.th = 1.52; Q.weg = 1; Q.nick = 0; Q.reach = 0; Q.sit = 0;
    Q.writhe = b < 3 ? .35 * Math.min(1, b) : Math.max(0, .35 - (b - 3) * .08); Q.curl = Math.min(1, Math.max(0, b - 2.5) / 4);
    if (b > 5.5 && !Q.thud && !PZ.P) { Q.thud = true; TOD_SND.thud(.5); FEU_SND.collapse(Q.x, Q.z); } }
  if (PZ.P) { zombie.g.position.set(Q.x, 0, Q.z); zombie.g.rotation.set(0, 0, 0); } // liegt mit dem Kopf nach Osten: zu Luke, zur Tür
  else { zombie.g.position.set(Q.x, .1 * Math.sin(Math.max(0, Q.th)), Q.z); zombie.g.rotation.set(0, Q.yaw, Q.th); }
  zombie.x = Q.x; zombie.z = Q.z;
}
// Knochen nach dem Animations-Mixer (dieser Tick läuft nach innen_kapitel): Haltung im Liegen, Aufrichten, Greifen, Krümmen
const _fzq = new THREE.Quaternion(), _fzl = new THREE.Vector3(), _fzf = new THREE.Vector3(), _fzp = new THREE.Vector3(), _fzu = new THREE.Vector3();
function feuer_bones(t) {
  if (PZ.P) return; // R-10: Peter als Figur – Haltung kommt aus echten Clips (pz_zsTick)
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
  if (Q.nick || Q.weg) { _fzu.set(0, 1, 0).applyQuaternion(_fzq); tod_bend(b.neck_01, _fzl, (Q.nick || 0) * .42); tod_bend(b.head, _fzl, (Q.nick || 0) * .2); tod_bend(b.neck_01, _fzu, -(Q.weg || 0) * .7); tod_bend(b.head, _fzu, -(Q.weg || 0) * .45); }
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
// Erste Chance: Peter liegt im Öl. Zweite Chance (er ist wieder aufgestanden): er läuft durch die Lache und Luke steht außerhalb, mit Abstand – dann kann man ihn immer noch anzünden.
// state.talking sperrt nicht mehr (Eingaben im Zeitdruck nie verschlucken); der Grund, warum es (noch) nicht geht, steht in feuer_igniteWhy.
function feuer_igniteBase() { const S = feuer_S; return S.lighter && S.spilled && S.phase !== 'ignite' && S.phase !== 'burn' && S.phase !== 'escape' && S.phase !== 'dying' && S.phase !== 'done' && !ui.overlay && S.spread < .8 && !(typeof tod_S !== 'undefined' && tod_S.dying); }
function feuer_outsideOil(P) { const S = feuer_S; return P.x > S.oilMaxX + .35 || P.x < S.oilMinX - .35; }
function feuer_canIgnite() { const S = feuer_S, P = player.pos, Q = S.zs; if (!feuer_igniteBase()) return false;
  if (Q) return Q.st === 'down' && ch2.chase === 'fire' && P.x > S.oilMaxX + .35 && Math.hypot(P.x - Q.x, P.z - Q.z) < 10;
  const d = Math.hypot(P.x - zombie.x, P.z - zombie.z);
  return S.spent && ch2.chase === 'run' && zombie.g.visible && Math.abs(zombie.z - Z) < 2.1 && zombie.x > S.oilMinX - .3 && zombie.x < S.oilMaxX + .3 && feuer_outsideOil(P) && d > 1.6 && d < 14; }
function feuer_igniteWhy() { const S = feuer_S, P = player.pos, Q = S.zs; if (!feuer_igniteBase()) return null;
  if (Q && Q.st === 'down' && ch2.chase === 'fire' && !feuer_outsideOil(P)) return 'Zu nah am Öl. Ein paar Schritte zurück.';
  if (!Q && S.spent && ch2.chase === 'run' && zombie.g.visible && Math.abs(zombie.z - Z) < 2.1 && zombie.x > S.oilMinX - .3 && zombie.x < S.oilMaxX + .3) { if (!feuer_outsideOil(P)) return 'Du stehst selbst im Öl. Raus aus der Lache!'; if (Math.hypot(P.x - zombie.x, P.z - zombie.z) <= 1.6) return 'Zu nah. Er ist gleich bei dir.'; } return null; }
const _fcq = new THREE.Quaternion(), _fcq2 = new THREE.Quaternion(), _fce = new THREE.Euler(), _fcm = new THREE.Matrix4(), _fcv = new THREE.Vector3(), _fct = new THREE.Vector3(), _fcu = new THREE.Vector3(0, 1, 0);
function feuer_cam(cam, dt) {
  const S = feuer_S, C = S.cine; if (!C) return; C.t += dt;
  const kin = Math.min(1, C.t / 1.2), kout = C.out ? Math.max(0, 1 - (C.t - C.out) / 1.2) : 1, k = Math.min(kin, kout), e = k * k * (3 - 2 * k);
  if (C.out && C.t - C.out > 1.2) { S.cine = null; setCamOverride(null); if (PZ.P) { camera.fov = fov; camera.updateProjectionMatrix(); } return; }
  const Q = S.zs, tb = .8 * (1 - (Q && Q.sit || 0) * .35), look = Q ? _fct.set(Q.x - Math.cos(Q.yaw) * tb, .4 + (Q.sit || 0) * .35, Q.z + Math.sin(Q.yaw) * tb) : _fct.set(S.ignX, .3, S.ignZ);
  if (PZ.P) { look.lerp(pz_kopfPos(_pv4), .5); const tf = fov - 9 * Math.min(1, C.t / 10) * e; if (Math.abs(cam.fov - tf) > .01) { cam.fov = tf; cam.updateProjectionMatrix(); } } // R-10: Blick auf sein Gesicht, die Brennweite zieht langsam zu
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
  if (!S.zs && S.spent && ch2.chase === 'run' && zombie.g.visible) { try { Audio.chaseMusic(false); PZ.ki = null; } catch (e) {} } // zweite Chance: die Jagd endet, er rutscht im Öl (feuer_zombieFall → Zustand „fall“)
  const Q = S.zs || (zombie.g.visible ? (feuer_zombieFall(false), S.zs) : null); if (!Q) return; if (Q.st !== 'down' && Q.st !== 'fall') { Q.st = 'down'; Q.t = 0; Q.th = 1.52; Q.arms = 0; }
  feuer_hurry(null); const vor = S.phase; S.phase = 'ignite'; const run = ++S.run; S.ignHit.position.set(0, -80, 0); uninteract(S.ignHit);
  state.talking = true; setScripted(() => true); vel.set(0, 0, 0);
  const P = player.pos, f = { x: -Math.sin(player.yaw), z: -Math.cos(player.yaw) };
  S.cine = { t: 0, ox: P.x, oz: P.z, sx: f.z * .45, sz: -f.x * .45 }; setCamOverride(feuer_cam);
  // Zündpunkt: der nächste nasse Punkt vor Luke
  let bi = -1, bd = 1e9; const A = S.pts; for (let i = 0; i < A.length; i += 3) { if (A[i + 2] < S.spread + .06) continue; const d = Math.hypot(A[i] - P.x, A[i + 1] - P.z); if (d < bd) { bd = d; bi = i; } }
  S.ignX = bi >= 0 ? A[bi] : Q.x + .8; S.ignZ = bi >= 0 ? A[bi + 1] : Q.z; S.oilU.uIgn.value.set(S.ignX, S.ignZ);
  // Fassung 3 (AP-16): Peters Feuerzeug bleibt bei Luke (Kap. 4 Joint, Kap. 5 Mamas Kerze, Kap. 6 Gravur) – geworfen wird nur die Flamme (ein brennender Fetzen vom Ärmel)
  subtitle('Das Feuerzeug. Der Daumen findet das Rad von allein.', 2600);
  if (PZ.P && typeof qte_start === 'function') { await wait(350); if (run !== S.run) return; const ok = await pz_qteFeuerzeug(); if (run !== S.run) return; // R-10: „Ruhig halten“ – zittert die Hand, reißt die Flamme ab
    if (!ok) { S.phase = vor; if (S.cine) S.cine.out = S.cine.out || S.cine.t; setScripted(null); state.talking = false; subtitle('Die Flamme reißt ab. Er bewegt sich.', 2400); if (S.zs) S.zs.down = (S.zs.down || 0) + 3.5; return; } }
  else { await wait(500); if (run !== S.run) return; FEU_SND.flick(); }
  // Wurf: vom Auge in einem Bogen zum Zündpunkt, die kleine Flamme fliegt mit
  const T = S.throwObj, sx = camera.position.x + f.x * .3 - f.z * .15, sy = camera.position.y - .25, sz = camera.position.z + f.z * .3 + f.x * .15;
  await wait(450); if (run !== S.run) return;
  S.throwT = { t: 0, sx, sy, sz, ex: S.ignX, ez: S.ignZ, d: .62 }; if (T) { T.position.set(sx, sy, sz); T.visible = false; }
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
  at(1300, () => subtitle('Die Flamme läuft über das Öl. Er sieht sie kommen.', 2600));
  at(4200, () => subtitle('Um sein Handgelenk schmilzt ein Plastikband: <b>KRANZ, P.</b>', 3800));
  at(7400, () => subtitle('Onkel Peter …?', 2400, 'LUKE'));
  at(PZ.P ? 12400 : 10200, () => { if (S.cine) S.cine.out = S.cine.t; }); // R-10: Peter richtet sich auf, greift zur Tür, bricht zusammen – die Einstellung wartet darauf
  at(PZ.P ? 13600 : 11400, () => feuer_escapeStart());
}
function feuer_zombieIgnite() { const S = feuer_S, Q = S.zs; if (!Q || Q.st === 'burn' || Q.st === 'nick') return; Q.st = 'nick'; Q.t = 0; Q.nick = 0; Q.weg = 0; Q.writhe = 0; Q.sit = 0; } // Fassung 3: Peter sieht die Flamme kommen. Er nickt. Einmal.

// ---------------------------------------------------------------- Flucht vor dem Rauch
function feuer_escapeStart(restart) {
  const S = feuer_S, run = restart ? ++S.run : S.run; S.phase = 'escape'; S.air = 30; S.hold = 0; S.relOpen = false; feuer_relReset(); S.escT = 0;
  if (!restart) { S.fog0 = { c: scene.fog.color.getHex(), d: scene.fog.density }; S.vig0 = filmPass.uniforms.vig.value; S.ca0 = filmPass.uniforms.ca.value; }
  setScripted(null); state.talking = false; if (S.cine) S.cine.out = S.cine.out || S.cine.t;
  const P = player.pos; if (!restart || !S.escPos) S.escPos = { x: Math.min(X + 105.4, Math.max(P.x, S.oilMaxX + .8)), z: Math.max(Z - 1.4, Math.min(Z + 1.4, P.z)), yaw: player.yaw };
  chaseDoor.lockedText = 'Die Brandschutztür. Zu. Irgendwo muss es eine Notentriegelung geben.';
  if (!restart) { if (typeof amt_box0 === 'function') Audio.intercomClick(...amt_box0()); else Audio.intercomClick(); feuer_doorShut(); Audio.play('metalHit2', { gain: .8, rate: .5, x: X + 106, y: 2.2, z: Z, ref: 4 }); shake = Math.max(shake, .02); }
  else feuer_doorShut();
  chaseDoor.lockedText = 'Die Brandschutztür. Zu. Irgendwo muss es eine Notentriegelung geben.'; FEU_SND.alarm(true);
  feuer_cue('a', false); feuer_cue('b', true);
  FEU_SND.loopNoise('draft', true, { x: X + 106, y: .1, z: Z, ref: 2.5, bp: 1650, q: 7, gain: .3 }); FEU_SND.loopNoise('draft2', true, { x: X + 106, y: .2, z: Z, ref: 2, bp: 420, q: 1.5, gain: .25, am: .35 });
  FEU_SND.loopNoise('breath', true, { flat: true, bp: 750, q: 1.1, gain: .16, am: .45 });
  setC2Objective('Raus hier! Der Rauch … Die Brandschutztür hat eine Notentriegelung.'); S.airEl.classList.add('show');
  todCheckpoint('flucht', 'Flucht vor dem Rauch', { x: S.escPos.x, y: 0, z: S.escPos.z, yaw: -PI / 2, persist: false, respawn: async () => { player.pos.set(S.escPos.x, 0, S.escPos.z); player.yaw = -PI / 2; } });
  const at = (ms, fn) => S.lines.push(setTimeout(() => { if (run === S.run && S.phase === 'escape') fn(); }, ms));
  if (!restart) { say([['„Brandalarm. Ebene minus zwei. Brandschutztüren schließen.“', 3400, 'LAUTSPRECHER']]);
    at(6300, () => subtitle('Die Tür ist zu. Irgendwo hier muss man sie aufkriegen.', 3200, 'LUKE')); }
  else at(1200, () => subtitle('Die rote Leuchte. Die Notentriegelung.', 2800, 'LUKE'));
  at(15000, () => { TOD_SND.cough(1); subtitle('Nicht einatmen. Nicht …', 2200, 'LUKE'); });
  at(21500, () => subtitle('Nicht hier unten. Nicht so wie er.', 2800, 'LUKE'));
}
function feuer_escapeUpdate(dt, t) {
  const S = feuer_S, P = player.pos; S.escT += dt; if (!tod_S.dying && !S.sanft) S.air = Math.max(0, S.air - dt); const s = 1 - S.air / 30;
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
  feuer_relTick(pulse);
  const dR = Math.hypot(P.x - FEU.relX, P.z - (FEU.relZ - .3)); camera.getWorldDirection(_fct);
  const rx = FEU.relX - P.x, rz = FEU.relZ - P.z, rl = Math.hypot(rx, rz) || 1, facing = dR < 1.3 || (_fct.x * rx + _fct.z * rz) / (Math.hypot(_fct.x, _fct.z) || 1) / rl > .3;
  if (!S.relOpen) {
    if (dR < 2.4 && facing && keys.KeyE && !ui.overlay) { S.hold += dt; if (S.hold % .3 < dt) Audio.play(Audio.pick('keys1', 'keys2'), { gain: .25, rate: .5, x: FEU.relX, y: 1.2, z: FEU.relZ, ref: 2 }); } else S.hold = Math.max(0, S.hold - dt * 1.5);
    $('sideInfo').textContent = S.hold > 0 ? '▮'.repeat(Math.ceil(S.hold / 1.4 * 10)).padEnd(10, '▯') : '';
    if (S.hold >= 1.4) { S.relOpen = true; $('sideInfo').textContent = ''; chaseDoor.locked = false; chaseDoor.set(true); Audio.slide(X + 106, Z); Audio.play('metalOpen', { gain: 1, rate: .7, x: X + 106, y: 1.2, z: Z, ref: 5 });
      FEU_SND.level('draft', 2.4); FEU_SND.level('draft2', 3); Audio.play('wind2', { gain: .9, rate: .8, dur: 3, fadeIn: .4, x: X + 106.5, y: 1, z: Z, ref: 3 }); subtitle('Kalte Luft!', 1600, 'LUKE'); setC2Objective('Durch die Tür!'); }
  }
  if (S.relOpen && P.x > X + 106.6) return feuer_escaped();
  if (S.air <= 0 && S.phase === 'escape') { S.phase = 'dying'; $('sideInfo').textContent = ''; FEU_SND.loopNoise('breath', false); todDie('rauch'); }
}
async function feuer_escaped() {
  const S = feuer_S; S.phase = 'done'; S.done = true; const run = ++S.run; if (typeof amt_danke === 'function') try { amt_danke(); } catch (e) {} // B-K2-04 liegt schon auf der Schwelle
  chaseDoor.shut = true; chaseDoor.set(false); chaseDoor.locked = true; chaseDoor.lockedText = 'Dahinter brennt es noch. Die Tür ist heiß.'; Audio.slam(chaseDoor.m.position.x, 1.2, chaseDoor.m.position.z); ch2.chase = 'done';
  feuer_cue('b', false); FEU_SND.loopNoise('draft', false); FEU_SND.loopNoise('draft2', false); FEU_SND.loopNoise('breath', false); S.airEl.classList.remove('show'); $('sideInfo').textContent = '';
  todMuffle(22000, 2.5);
  tod_S.seen.mess = true; todCheckpoint('messraum', 'Der Messraum', { x: X + 108.2, y: 0, z: Z, yaw: -PI / 2 });
  S.clearT = 0; // Sicht klärt sich im Tick
  setTimeout(() => { if (S.done) { zombie.g.visible = false; S.zs = null; feuer_stopFire(); } }, 2500);
  S.nachT = 0; // Fassung 3: kein Musikeinsatz; dreißig Sekunden nur Lüftung, dann kommen die Blechmänner (lwo_ag07)
  try { Audio.play('wind2', { gain: .12, rate: .6, dur: 30, fadeIn: 2, x: X + 108, y: 2.3, z: Z, ref: 4 }); } catch (e) {}
  await wait(500); TOD_SND.cough(1.1); await wait(1100); TOD_SND.cough(.8); TOD_SND.gasp(.7); await wait(900);
  if (run !== S.run) return;
  setC2Objective('Der Messraum. Hier ist es passiert.');
  await say([['Hinter der Tür knistert es. Dann nichts mehr.', 3400]]); await wait(1200);
  await say([['Ich hab ihn angezündet. Mamas Bruder. Mit dem Feuerzeug, das sie ihm geschenkt hat.', 4800, 'LUKE']]);
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
  const S = feuer_S; (S.lines || []).forEach(clearTimeout); S.lines = []; S.run++; pz_reset();
  if (S.done || !ch2.on) return;
  if (cpId === 'flucht' && (S.phase === 'escape' || S.phase === 'dying')) { // Feuer brennt weiter, Rauch zurück auf Anfang, 30 Sekunden
    S.ps.n = Math.min(S.ps.n, 120); feuer_escapeStart(true); return; }
  // alles auf Anfang: Fass steht, kein Öl, kein Feuer, kein Ruß, Verfolger fort, Tür offen
  feuer_hurry(null); feuer_relReset(); S.phase = 'idle'; S.cine = null; S.throwT = null; S.spilled = false; S.sanft = false; S.spentT = 0; S.eWas = false; S.said.zweit = S.said.zweit2 = false; if (S.stream) S.stream.visible = false; S.spillBodyX = undefined; S.fell = false; S.spent = false; S.zs = null; S.griff = false; S.griffLauf = false; S.lampe = null; if (S.lampeHit) uninteract(S.lampeHit); FEU.bx = X + 76.3; FEU.bz = Z - 1.25; FEU.tip = 1; if (S.bHit) S.bHit.position.set(FEU.bx, .55, FEU.bz); zombie.greifT = 0; S.spread = 1.1; S.H = 0; S.burnR = 0; S.hold = 0; S.relOpen = false; S.said.oel = false; S.said.fassHint = false; S.soot = 0;
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
setTimeout(() => { try { TOD_RESET.push((id) => feuer_reset(id)); } catch (e) {} }, 0); // verzögert wie augenzu (TOD_RESET aus tod.js)
MOD_SAVE.push(['feuer', () => ({ l: feuer_S.lighter, d: feuer_S.done }), v => { feuer_items(); if (v.l) { feuer_lighterGone(); if (!v.d && !story.items.includes('feuerzeug')) story.items.push('feuerzeug'); } if (v.d) feuer_S.done = true; }]);

// ---------------------------------------------------------------- Pro Bild
const _fhz = new THREE.Vector3();
WORLD_TICK.push((dt, t) => { try { if (FEU_FL.length) feuer_flammenTick(dt, t); } catch (e) { if (!feuer_S.errF) { feuer_S.errF = true; console.warn('Flamme', e); } } }); // wiederverwendbare Flammen laufen in jedem Kapitel
WORLD_TICK.push((dt, t) => {
  const S = feuer_S;
  try {
    if (!S.items) feuer_items();
    if (!ch2.on || !S.oil) return;
    const P = player.pos; S.timeU.value = t; S.frame++;
    try { pz_tick(dt, t); } catch (e) { if (!PZ.err) { PZ.err = true; console.warn('Peter', e); } } // R-10: Figur, Jagd, Kamera, QTE
    // Musik vorbereiten, sobald das Amt Strom hat (rendert im Hintergrund)
    if (!S.cues && !S.cueBusy && ch2.power && Audio.ctx && Audio.ctx.state === 'running') feuer_renderCues();
    // Feuerzeug: glänzt im Lampenlicht; Luke bemerkt es
    if (!S.lighter && S.glint && S.lighterObj) { const L = S.lighterObj.position, d = Math.hypot(P.x - L.x, P.z - L.z);
      if (d < 9) { _fct.set(L.x - camera.position.x, L.y - camera.position.y, L.z - camera.position.z).normalize(); camera.getWorldDirection(_fcv); const lit = flashOn && _fcv.dot(_fct) > .93;
        S.glint.material.opacity += ((lit ? .55 + .45 * Math.pow(Math.max(0, Math.sin(t * 3.1)), 8) : .08) - S.glint.material.opacity) * Math.min(1, dt * 8); S.glint.scale.setScalar(.1 + .05 * Math.sin(t * 2.3));
        if (lit && d < 4.5 && ch2.spiderPhase === 'gone') gedanke('feuer_glanz', 'Da, auf der Matratze. Da glänzt was.', 0, 2); }
      else S.glint.material.opacity = 0; }
    if (ch2.chase === 'run' && !S.said.klemmt && typeof gate !== 'undefined' && !gate.userData.open && gate.userData.holdT > .9) { S.said.klemmt = true; subtitle('Es klemmt!', 1400, 'LUKE'); }
    { const Zm = feuer_zs(); if (Zm && Zm.mx && !PZ.P && ch2.chase === 'run' && zombie.spNow !== undefined && !S.zs) for (const a of Zm.mx._actions || []) if (/walk/i.test(a.getClip().name)) a.timeScale = zombie.spNow < .05 ? .05 : .55 + zombie.spNow * .42; } // er geht; schnell nur, wenn er will
    feuer_barrelUpdate(dt, t); feuer_zombieUpdate(dt, t); feuer_bones(t);
    // Wurf des Feuerzeugs
    if (S.throwT && S.throwObj) { const W = S.throwT; W.t += dt; const k = Math.min(1, W.t / W.d); S.throwObj.position.set(W.sx + (W.ex - W.sx) * k, W.sy + (.02 - W.sy) * k + Math.sin(k * PI) * .45, W.sz + (W.ez - W.sz) * k); S.throwObj.rotation.set(k * 9, k * 5, 0);
      if (Math.random() < .8) feuer_emit(S.pc, S.throwObj.position.x, S.throwObj.position.y + .02, S.throwObj.position.z, 0, .25, 0, .3, .04, .08, 0, 0); }
    // Öl breitet sich aus
    if (S.spilled) { S.spillT += dt; S.spread = 1.02 - .94 * (1 - Math.exp(-S.spillT / 2.3)); S.oilU.uSpread.value = S.spread; S.oilU.uTime.value = t;
      const st = S.stream; if (st) { const u = S.spillT, on = u < 3.4 && S.bx !== undefined; st.visible = on; if (on) { const h = .55 * Math.min(1, u / .25) * (1 - Math.max(0, (u - 2.4) / 1)); st.scale.set(1 + Math.sin(t * 40) * .08, Math.max(.001, h), 1); st.position.set(S.bx, .02 + h / 2, S.bz + FEU.r + .43); } } }
    // Zünden anbieten: unsichtbare Fläche vor der Kamera trägt die Aufforderung (gleiches Aussehen wie jede Handlung)
    { const e = !!keys.KeyE, tap = e && !S.eWas; S.eWas = e; const can = feuer_canIgnite();
      if (tap && can) feuer_ignite(); else if (tap && !state.talking) { const why = feuer_igniteWhy(); if (why) toast(why, 2200); } // E zündet auch ohne getroffene Klickfläche
      if (S.spent && S.phase !== 'ignite' && S.phase !== 'burn' && S.phase !== 'escape' && ch2.chase === 'run' && !S.done) { S.spentT = (S.spentT || 0) + dt;
        if (S.spentT > 10 && !S.said.zweit && S.spilled && S.lighter) { S.said.zweit = true; subtitle('Das Öl liegt noch da. Das Feuerzeug auch.', 2800, 'LUKE'); }
        if (S.spentT > 90 && !S.said.zweit2) { S.said.zweit2 = true; subtitle('Locke ihn zurück ins Öl – oder schlag an der Brandschutztür Alarm.', 4200, 'LUKE'); try { setC2Objective('Peter ins Öl locken und anzünden – oder die Notentriegelung ziehen'); } catch (e2) {} } } }
    if (feuer_canIgnite()) { camera.getWorldDirection(_fcv); if (!interactables.includes(S.ignHit)) interact(S.ignHit, 'Das Öl anzünden', () => feuer_ignite()); S.ignHit.position.copy(camera.position).addScaledVector(_fcv, 1.1); S.ignHit.lookAt(camera.position);
      if (!S.said.feuer) { S.said.feuer = true; subtitle('Das Feuerzeug.', 1600, 'LUKE'); } }
    else if (interactables.includes(S.ignHit)) { uninteract(S.ignHit); S.ignHit.position.set(0, -80, 0); }
    // Peters Zelle: Osttür erst mit dem Feuerzeug; die Tafel liegt bis zum Schwarm unter dem Gespinst
    feuer_cellDoor(dt); feuer_lampeTick(dt);
    if (S.done && S.nachT !== undefined) { S.nachT += dt; if (S.nachT > 30 && typeof lwo_ag07 === 'function') lwo_ag07(); } if (typeof lwo_ag07Tick === 'function') lwo_ag07Tick(dt); // dreißig Sekunden Lüftung, dann AG-07
    if (!S.tafelFree && ch2.spiderPhase === 'gone' && typeof innen_kapitel_S !== 'undefined' && innen_kapitel_S.pruefCover) { S.tafelFree = true; innen_kapitel_S.pruefCover.visible = false; }
    // Die Brandschutztür ist zu (kein Weg ohne Feuer): Luke merkt es während der Jagd
    if (ch2.chase === 'run' && !S.said.tuer && P.x > X + 103.8) { S.said.tuer = true; Audio.thump(X + 106, 1.2, Z); subtitle('Zu! Die Tür ist zu! „Nur bei Brandalarm“ …', 2600, 'LUKE'); }
    // Peter ist wieder auf den Beinen und läuft durchs Öl: er rutscht noch einmal weg (einmal – dann kommt er durch)
    if (ch2.chase === 'run' && !S.griff && S.spent && !S.fell && S.spilled && (S.slips || 0) < 1 && zombie.g.visible && zombie.x > S.oilMinX + .4 && zombie.x < S.oilMaxX - .2 && Math.abs(zombie.z - Z) < 1.6) {
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
      S.accW = (S.accW || 0) + S.H * area * 16 * dt; while (S.accW > 1) { S.accW--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pw, p.x, -.02, p.z, rand(-.05, .05), rand(.06, .18), rand(-.05, .05), rand(1.4, 2.8), .8, rand(1.1, 2.0) * (.45 + p.v * .8), rand(-.1, .1), rand(-.06, .06)); }
      S.accF = (S.accF || 0) + S.H * (7 + 20 * area) * dt; while (S.accF > 1) { S.accF--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pf, p.x + rand(-.05, .05), .01, p.z + rand(-.05, .05), rand(-.08, .08), rand(.7, 1.4), rand(-.08, .08), rand(.8, 1.8), .35, rand(.5, 1.15) * (.4 + p.v * .85), rand(-.18, .18), rand(-.3, .3)); }
      S.accC = (S.accC || 0) + S.H * (5 + 12 * area) * dt; while (S.accC > 1) { S.accC--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pc, p.x, .0, p.z, 0, rand(.15, .35), 0, rand(.5, .95), .35, rand(.5, .85) * (.55 + p.v * .55), rand(-.1, .1), 0); }
      S.accS = (S.accS || 0) + S.H * 30 * dt; while (S.accS > 1) { S.accS--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.ps, p.x, rand(.6, 1.2), p.z, rand(-.1, .25), rand(.5, .9), rand(-.15, .15), rand(8, 11), rand(1.1, 1.5), rand(2.8, 4.2), rand(0, 6), rand(-.12, .12)); }
      if (S.phase === 'escape') { const s = 1 - S.air / 30; S.accS2 = (S.accS2 || 0) + (4 + 10 * s) * dt; while (S.accS2 > 1) { S.accS2--; feuer_emit(S.ps, P.x + rand(-1.5, 3.5), S.ceil + rand(-.3, .2), Math.max(Z - 1.5, Math.min(Z + 1.5, P.z + rand(-1.5, 1.5))), rand(0, .15), rand(-.05, .03), rand(-.1, .1), rand(7, 10), rand(1.6, 2.2), rand(3, 4), rand(0, 6), rand(-.08, .08)); } }
      S.accE = (S.accE || 0) + S.H * 24 * dt; while (S.accE > 1) { S.accE--; const p = feuer_burnPoint(); if (!p) break; feuer_emit(S.pe, p.x, rand(.2, .8), p.z, rand(-.35, .35), rand(1.0, 2.6), rand(-.35, .35), rand(1.3, 3.2), .02, .012, 0, 0); }
      // Der Körper brennt
      if (Q && Q.st === 'burn' && zombie.g.visible) { const Zm = feuer_zs(), bs = Zm && Zm.b ? ['spine_02', 'spine_03', 'head', 'upperarm_l', 'upperarm_r', 'lowerarm_l', 'lowerarm_r', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'pelvis'] : null;
        S.accB = (S.accB || 0) + (Q.burn || 0) * (1 - (Q.char || 0) * .4) * 40 * dt;
        while (S.accB > 1) { S.accB--; let x, y, z; if (bs) { const bn = Zm.b[bs[Math.floor(Math.random() * bs.length)]]; if (!bn) continue; bn.getWorldPosition(_fzp); x = _fzp.x; y = _fzp.y; z = _fzp.z; } else { const k = Math.random(); x = Q.x - Math.cos(Q.yaw) * k * 1.7; y = .25; z = Q.z + Math.sin(Q.yaw) * k * 1.7; }
          const big = Math.random() < .25; feuer_emit(big ? S.pw : S.pf, x + rand(-.08, .08), Math.max(.02, y - .1), z + rand(-.08, .08), rand(-.1, .1), rand(.8, 1.5), rand(-.1, .1), big ? rand(.9, 1.5) : rand(.5, 1.0), .2, big ? rand(.6, .95) : rand(.35, .6), rand(-.2, .2), rand(-.3, .3)); }
        S.bodyL.position.set(Q.x - Math.cos(Q.yaw) * .8, .7 + (Q.sit || 0) * .4, Q.z + Math.sin(Q.yaw) * .8); S.bodyL.intensity = (Q.burn || 0) * (1 - (Q.char || 0) * .5) * (4.5 + Math.sin(t * 19) * 1.2); }
      else S.bodyL.intensity *= 1 - Math.min(1, dt * 2);
      feuer_charUpdate(t);
      // Schattenlicht: flackert, wandert mit der Flammenmitte; Schatten jedes zweite Bild neu
      const fl = 1 + Math.sin(t * 17) * .16 + Math.sin(t * 23.7) * .12 + Math.sin(t * 5.3) * .1 + (Math.random() - .5) * .18;
      S.fireP.position.set(Math.max(S.oilMinX + 1, Math.min(S.oilMaxX - .5, S.ignX - Math.min(S.burnR, 2.5) * .5)) + Math.sin(t * 7.1) * .12, .75 + Math.sin(t * 9.3) * .08, Z + Math.sin(t * 6.3) * .1); S.fireP.intensity = S.H * 7.5 * fl;
      if (S.frame % 3 === 0) S.fireP.shadow.needsUpdate = true;
      // Klang: Brüllen schwillt an, Knistern, Knallen, einstürzende Teile, dumpfe Druckstöße
      FEU_SND.level('roar', S.H * (.8 + .2 * fl)); FEU_SND.level('roar2', S.H * .85); FEU_SND.level('hiss', S.H * (1 - S.oilU.uChar.value * .6));
      if (Math.random() < dt * 11 * S.H) { const p = feuer_burnPoint(); if (p) FEU_SND.crackle(p.x, p.z); }
      if (Math.random() < dt * .9 * S.H) { const p = feuer_burnPoint(); if (p) { FEU_SND.pop(p.x, p.z); for (let k = 0; k < 6; k++) feuer_emit(S.pe, p.x, .3, p.z, rand(-1, 1), rand(2, 4), rand(-1, 1), rand(.6, 1.4), .018, .01, 0, 0); } }
      S.colT = (S.colT ?? 4) - dt; if (S.colT < 0 && S.burnT > 3) { S.colT = rand(5, 9); const p = feuer_burnPoint(); if (p) { FEU_SND.collapse(p.x, p.z); shake = Math.max(shake, .02); for (let k = 0; k < 16; k++) feuer_emit(S.pe, p.x, 1.2, p.z, rand(-1.4, 1.4), rand(-.5, 2.5), rand(-1.4, 1.4), rand(.8, 1.8), .02, .012, 0, 0); } }
      S.ps.m.material.uniforms.uGlowPos.value.set(S.fireP.position.x, .5, Z); S.ps.m.material.uniforms.uGlow.value = S.H * .7 * fl;
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

// =====================================================================  Fassung 3 (AP-16): Der Griff (Kinosequenz Teil A „Bruder.“) – Pflicht, am klemmenden Gitter
// tod.js leitet den ersten Fang hierher (danach tötet jeder Fang). Luke steht am Gitter und sieht nach Osten; Peter kommt von hinten.
// Das Fass steht neben dem Gitter (FEU); liegt es weiter weg (Griff anderswo), wird es neben die beiden gestellt, bevor die Kamera hinsieht.
// Nach der Sequenz: Peter liegt zwei Meter weiter im Öl und sieht Luke an, die Stablampe liegt zwischen ihnen (Licht vom Boden), „Das Öl anzünden“ mit unsichtbarem Timer.
async function feuer_griff() { const S = feuer_S; if (S.griff || S.griffLauf) return; S.griffLauf = true; ch2.chase = 'griff'; ch2.caught++; Audio.chaseMusic(false); Audio.chaseLevel(0);
  const P = player.pos; player.yaw = -PI / 2; player.pitch = 0; vel.set(0, 0, 0);
  const ax = P.x, az = Math.max(Z - 1.25, Math.min(Z + 1.25, P.z)); let Lx = ax - (PZ.P ? 2.0 : 1.3), Lz = Math.max(Z - 1.1, Math.min(Z + 1.1, az));
  S.spillBodyX = undefined; S.k2aImp = false;
  if (Math.hypot(FEU.bx - (ax - .5), FEU.bz - (Z - 1.25)) > 2.2) { FEU.bx = ax - .5; FEU.bz = Z - 1.25; FEU.tip = 1; if (S.barrel) { S.barrel.position.set(FEU.bx, FEU.h / 2, FEU.bz); S.barrel.quaternion.identity(); S.barrel.rotation.y = .4; } if (S.bHit) S.bHit.position.set(FEU.bx, .55, FEU.bz); }
  if (typeof gate !== 'undefined' && !gate.userData.open && Math.abs(gate.position.x - ax) < 3) { gate.userData.open = true; tween(gate, { pos: gate.position.clone().setZ(gate.position.z + 3.2) }, .55); gate.userData.col.minX = gate.userData.col.maxX = -9999; Audio.slide(gate.position.x, Z); uninteract(gate); $('sideInfo').textContent = ''; }
  zombie.x = Lx; zombie.z = Lz; S.griffLauf = true;
  if (!S.griffGesehen && typeof kino_play === 'function' && typeof KINO !== 'undefined' && KINO.k2a && typeof kino_S !== 'undefined' && kino_S.ready) { S.griffGesehen = true; try { await kino_play('k2a'); } catch (e) { console.warn('Kino k2a', e); } if (feuer_k2aTot()) return pz_griffTod(); if (S.k2aImp && zombie.g.visible) { Lx = zombie.x; Lz = zombie.z; player.pos.x = Lx + 1.9; player.pos.z = Math.max(Z - 1.2, Math.min(Z + 1.2, Lz - .25)); } }
  else if (PZ.P && typeof qte_start === 'function') { S.griffGesehen = true; state.talking = true; setScripted(() => true); const r = await pz_griffOhneKino(ax, az); setScripted(null); state.talking = false; if (r === 'tot') return pz_griffTod(); } // R-10: Wiederholung aus Lukes Augen
  else { S.griffGesehen = true; shake = Math.max(shake, .05); Audio.play('metalSlam', { gain: .5, rate: .6, x: ax - .5, y: .4, z: Z - 1, ref: 3 }); await fade(1, 250); feuer_knock(); await wait(900); fade(0, 800); }
  if (S.phase === 'idle') feuer_knock(); await wait(80); if (!S.spilled) { S.fell = true; zombie.x = Lx; zombie.z = Lz; feuer_spill(); }
  // Peter liegt auf der Seite im Öl und sieht Luke an
  S.fell = true; S.zs = { st: PZ.P ? 'fall' : 'down', t: PZ.P ? 2 : 0, th: 1.52, yaw: Math.atan2(1, 0) + PI / 2, x: Lx, z: Lz, sit: 0, reach: 0, curl: 0, writhe: 0, char: 0, burn: 0, down: 0, arms: 0 };
  zombie.g.visible = true; feuer_anim(true); ch2.chase = 'fire'; S.griff = true; S.griffLauf = false; S.said.oel = false;
  camY = Math.min(camY, .95); // auf den Knien
  S.lampe = { x: (ax + Lx) / 2 + .15, z: Lz + .35, a: PI + .25 };
  if (!S.lampeHit) { S.lampeHit = box(.5, .3, .5, 0, .15, 0, hidden, { cast: false }); S.lampeHit.userData.noCol = true; }
  S.lampeHit.position.set(S.lampe.x, .15, S.lampe.z); interact(S.lampeHit, 'Stablampe aufheben', () => { S.lampe = null; uninteract(S.lampeHit); Audio.play('switch2', { gain: .25, rate: 1.2 }); });
  try { if (typeof todCheckpoint === 'function') {} } catch (e) {} }
// Die Lampe liegt auf dem Boden: der Kegel liegt flach über dem Beton und zeigt auf das Öl (die Lampe ist das einzige Licht, das zählt)
const _flq = new THREE.Quaternion(), _fle = new THREE.Euler(0, 0, 0, 'YXZ');
function feuer_lampeTick() { const S = feuer_S, L = S.lampe; if (!L || typeof flashRig === 'undefined') return;
  flashRig.position.set(L.x, .09, L.z); _fle.set(-.06, L.a, 0, 'YXZ'); _flq.setFromEuler(_fle); flashRig.quaternion.copy(_flq); flashRig.updateMatrixWorld();
  if (typeof fogUniforms !== 'undefined') { fogUniforms.flP.value.copy(flashRig.position); fogUniforms.flD.value.set(0, 0, -1).applyQuaternion(flashRig.quaternion); } }

// =====================================================================  R-10 (01.10.2026): Peter als echte Figur – Haut, Bewegung, Jagd-KI, Flucht-Kamera, Quick-Time-Events
// Figur  game/assets/chars/peter (Werkstatt: cast.json „peter“ – ow3-Körper, MN-Kopf, 1,97 m, grau; Mocap-Satz „peter“: idle (kaum noch stehen), walk (Hinken), schritt, run (Zombie-Lauf),
//        stolpern, fall_vor/fall_rueck, knie_tod, hug, packen, suchen, taumeln …). figuren.js bewegt sie (Mischer, Atmung, Blick, Gesicht); hier eine Schicht nach dem Mischer:
//        Kopf sucht und lauscht schief, eine Hand tastet an der Wand, Ausfall mit vorgestreckten Armen, Nicken/Abwenden, Winden im Feuer, der Griff zur Tür.
// Haut   eigenes Material über den Werkstatt-Texturen: blutleer grau-grün, Adern, Leichenflecken, eingesunkene Augen, offene Geschwüre (Fleisch aus kreaturen.js), die genähte
//        Schädelnarbe der Versuchsreihe K, Nässe, Lichtsaum (Wrap); Hemd/Hose verwaschenes Anstaltsgrün mit Flecken und Rissen; milchige Augen; gelbe Zähne; Haar in Strähnen; Öl.
// Jagd   ersetzt chaseUpdate der Basis, sobald die Figur geladen ist (ohne Figur: alter Verfolger). Zustände lauern → verdacht → suche → jagd → verloren, je mit eigener
//        Bewegung und eigenem Klang. Gehör (Rennen, Gehen, Gitter, Lampenschalter), Sicht (der Lampenkegel verrät Luke; ohne Licht nur aus der Nähe), Gedächtnis (letzte Stelle),
//        Absuchen der Gerümpelstapel, Lauern an Stapeln, Abfangen statt Hinterherlaufen, Wissen um das klemmende Gitter, Ausfall mit Ausweich-QTE.
// Kamera Blick über die Schulter (QTE-Taste „zurueck“, Standard Q), automatischer Schulterblick beim Ausfall von hinten, Impulse bei knappen Fehlgriffen, Sichtfeld folgt.
const PZ = { an: false, P: null, pg: null, ue: null, U: { pzT: { value: 0 }, pzOel: { value: 0 } }, snd: false, ki: null, plx: 0, plz: 0, flash0: false, lockClip: null, lockT: 0,
  cam: { zk: 0, side: 1, autoT: 0, autoN: 0, kick: 0, kickV: 0, dip: 0, dipV: 0, fovK: 0, fovSet: false, ausw: null }, herzT: 0, atemT: 2, zahnT: 4, wortT: 8, loco: '', spd: 0, lx: 0, lz: 0, ph: -1,
  screamCd: 0, lay: { kopf: 0, kopfV: 0, tilt: 0, wand: 0, greif: 0, lean: 0, nick: 0, weg: 0, winden: 0, tuer: 0, greifP: new THREE.Vector3() }, k2a: null };
const PZ_NOISE = `float pzH(vec3 p){ p = fract(p * .3183099 + .1); p *= 17.; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pzN(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(mix(mix(pzH(i), pzH(i + vec3(1,0,0)), f.x), mix(pzH(i + vec3(0,1,0)), pzH(i + vec3(1,1,0)), f.x), f.y), mix(mix(pzH(i + vec3(0,0,1)), pzH(i + vec3(1,0,1)), f.x), mix(pzH(i + vec3(0,1,1)), pzH(i + vec3(1,1,1)), f.x), f.y), f.z); }`;
// ---------------------------------------------------------------- Laden (sobald Kapitel 2 läuft; ohne Figur bleibt alles beim alten Verfolger)
async function pz_laden() {
  if (PZ.an || typeof figuren_embody !== 'function' || typeof zombie === 'undefined') return; PZ.an = true;
  try {
    const pg = new THREE.Group(); pg.name = 'PeterHalter'; pg.rotation.y = PI / 2; zombie.g.add(pg); // Figur schaut nach +z, der Verfolger nach +x
    let P = null; try { P = await pz_zmBau(pg); } catch (e) { console.warn('Zombie-Modell – Rückfall auf CC-Peter', e); P = null; }
    if (!P) P = await figuren_embody(pg, 'peter', {}); if (!P || P.id !== 'peter') { zombie.g.remove(pg); console.warn('Peter: Figur fehlt – alter Verfolger'); return; }
    P.fixed = true; P.rig.legs = []; PZ.P = P; PZ.pg = pg; // keine Fuß-IK: Liegen, Knien und Fallen bleiben wie aufgenommen
    for (const c of zombie.g.children) if (c !== pg) c.visible = false;
    const old = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S.zombie : null; if (old && old.zm) old.zm.visible = false;
    PZ.ue = pz_ueMap(P); if (typeof innen_kapitel_S !== 'undefined') innen_kapitel_S.zombie = { zm: P.obj, mx: P.mx, b: PZ.ue, eigen: true, peter: P };
    if (P.own) pz_zmHaut(P.obj); else await pz_haut(P.obj); feuer_S.zmats = null; if (!P.own) pz_mimik(); pz_play(P, 'idle', true);
    { const fe = window.__feuer; if (fe) fe.peter = PZ; } // Testzugriff (in der Veröffentlichung fehlt __feuer)
  } catch (e) { console.warn('Peter laden', e); }
}
// ---------------------------------------------------------------- Zombie-Modell „Number 7“ (Tony Flanagan, CC-BY 4.0, Fab): eigenes Mixamo-Skelett, 13 Clips – ersetzt den verformten CC-Menschen als Peter
// Die Zustandsmaschine (pz_*) bleibt: Clips werden auf ihre Schlüssel abgebildet (idle, suchen, walk, run, stolpern, hug, scream, fall_vor). fall_vor ist ein umgetakteter „Dying“-Clip, damit
// die Zeitmarken der Brand-/Sturz-Szenen (Stehen 1,15 · Sturzbeginn 1,9 · Knie 2,75 · Aufschlag 4,7 · Ende) weiter stimmen. Bei Fehlern lädt pz_laden den alten CC-Peter.
const PZ_ZM = { dir: 'zombie_p7', file: 'zom_7.glb', scale: 1.08, DV: 5.6 };
function pz_zmClip(src, o) {
  let c = o.sub ? THREE.AnimationUtils.subclip(src, o.name, o.sub[0], o.sub[1], 30) : src.clone(); c.name = o.name;
  if (o.map) { const K = o.map, f = t => { if (t <= K[0][1]) return K[0][0]; for (let i = 1; i < K.length; i++) if (t <= K[i][1]) return K[i - 1][0] + (t - K[i - 1][1]) / (K[i][1] - K[i - 1][1]) * (K[i][0] - K[i - 1][0]); return K[K.length - 1][0] + (t - K[K.length - 1][1]); };
    for (const tr of c.tracks) { const T = tr.times; for (let i = 0; i < T.length; i++) T[i] = f(T[i]); } c.resetDuration(); }
  const hp = c.tracks.find(t => /Hips\.position$/.test(t.name)); // Wurzelbewegung (Armature-cm, y = vorwärts) entfernen: der Körper bleibt an der Figurposition
  if (hp && o.fix) { const V = hp.values, T = hp.times, n = T.length, y0 = V[1], y1 = V[(n - 1) * 3 + 1], t1 = T[n - 1] || 1;
    for (let i = 0; i < n; i++) { const u = T[i] / t1; let sh = y0; if (o.fix === 'trend') sh = y0 + (y1 - y0) * u; else if (o.fix === 'fall') { const k = Math.max(0, Math.min(1, (T[i] - 1.9) / (4.7 - 1.9))); sh = y0 + 85 * k * k * (3 - 2 * k); } V[i * 3 + 1] -= sh; } }
  return c;
}
async function pz_zmBau(pg) {
  if (typeof msModel !== 'function' || typeof figuren_skc !== 'function' || typeof figuren_rig !== 'function') return null;
  const src = await msModel(PZ_ZM.dir, PZ_ZM.file); if (!src || !src.animations || !src.animations.length) return null;
  const sk = await figuren_skc(), obj = sk(src); obj.name = 'Person_peter_zm'; obj.scale.setScalar(PZ_ZM.scale); pg.add(obj);
  const A = n => src.animations.find(a => a.name === n); if (!A('Idle') || !A('Walk') || !A('Run') || !A('Dying')) { pg.remove(obj); return null; }
  const D = PZ_ZM.DV, mx = new THREE.AnimationMixer(obj), acts = {}, motion = {};
  const def = {
    idle: { c: 'Idle', fix: 'trend', loop: true }, suchen: { c: 'Idle', fix: 'trend', loop: true, ts: .8 },
    walk: { c: 'Walk', fix: 'trend', loop: true, speed: .33, phaseL: .1, phaseR: .59, rm: 'lin' }, run: { c: 'Run', fix: 'trend', loop: true, speed: 2.9, phaseL: .4, phaseR: .8, rm: 'lin' },
    stolpern: { c: 'Dying', fix: 'first', sub: [0, 26], loop: false }, scream: { c: 'Scream', fix: 'first', loop: false }, crawl: { c: 'Crawl', fix: 'trend', loop: true },
    hug: { c: 'Neck_Bite', fix: 'first', sub: [36, 81], loop: 'pp', off: 1.2 },
    fall_vor: { c: 'Dying', fix: 'fall', map: [[0, 0], [1.15, .3], [1.9, .75], [2.75, 1.45], [4.7, 2.35], [D, 3.33]], loop: false } };
  for (const [k, d] of Object.entries(def)) { const cl = pz_zmClip(A(d.c), Object.assign({ name: k }, d)), a = mx.clipAction(cl); a.enabled = false; acts[k] = a; motion[k] = { loop: d.loop, speed: d.speed, phaseL: d.phaseL, phaseR: d.phaseR, rm: d.rm, off: d.off || 0, ts: d.ts || 1 }; }
  acts.schritt = acts.walk; motion.schritt = motion.walk;
  const rig = figuren_rig(obj, null); rig.legs = [];
  return { id: 'peter', own: true, obj, mx, acts, cur: null, curK: null, g: pg, h: 1.97, motion, rig, mv: { vis: true, acc: 0, lookW: 0 }, look: null, lookW: 0, lk: { y: 0, p: 0 }, fixed: true };
}
// Haut: eigene Materialien (Klone) mit Ölnässe (pzOel: dunkler, glänzend, von unten nach oben) und leichter Verfinsterung; Blut/Geschwüre kommen aus der Textur
function pz_zmHaut(root) {
  root.traverse(m => { if (!m.isMesh) return; m.frustumCulled = false; m.castShadow = true; m.receiveShadow = true; m.userData.noCol = true;
    const ms = [].concat(m.material).map(src => { const c = src.clone(); c.envMapIntensity = .5; c.side = THREE.FrontSide; c.roughness = Math.max(.55, c.roughness ?? .6);
      c.onBeforeCompile = sh => { sh.uniforms.pzOel = PZ.U.pzOel;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPzP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPzP = position;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float pzOel; varying vec3 vPzP;\n' + PZ_NOISE)
          .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
{ diffuseColor.rgb *= vec3(.9, .93, .9); float w = pzOel * smoothstep(.0, .8, (1.5 - vPzP.y * .8) + (pzN(vPzP * 7.) - .5) * .9); diffuseColor.rgb *= mix(1., .36, w); roughnessFactor = mix(roughnessFactor, .13, w); }`); };
      c.customProgramCacheKey = () => 'pzzm'; c.needsUpdate = true; return c; });
    m.material = Array.isArray(m.material) ? ms : ms[0]; });
}
// Eigenes Abspielen (wie figuren_play: weich überblenden, Einmal-Clips halten das letzte Bild, Ping-Pong für das Halten)
function pz_play(P, k, first, o) { if (!P.own) return figuren_play(P, k, first, o);
  const a = P.acts[k] || P.acts.idle; if (!a || a === P.cur) return; const m = P.motion[k] || {}, prev = P.cur, once = o && o.once !== undefined ? o.once : m.loop === false, fade = Math.max(.15, (o && o.fade) || .4);
  a.reset(); a.setLoop(once ? THREE.LoopOnce : m.loop === 'pp' ? THREE.LoopPingPong : THREE.LoopRepeat, Infinity); a.clampWhenFinished = once; a.enabled = true; a.paused = false; a.timeScale = o && o.ts ? o.ts : m.ts || 1; a.setEffectiveWeight(1); a.play();
  if (prev && !first) { for (const n in P.acts) { const b = P.acts[n]; if (b === a || !b.enabled || !b.isScheduled()) continue; const w = b.getEffectiveWeight(); if (w > .001) { b.stopFading(); b._scheduleFading(fade, w, 0); } else b.stop(); } a._scheduleFading(fade, 0, 1); }
  else for (const n in P.acts) { const b = P.acts[n]; if (b !== a && b.isScheduled()) b.stop(); }
  P.cur = a; P.curK = k; }
function pz_look(P, t, w = 1) { if (!P) return; if (P.own) { P.look = t; P.lookW = t ? w : 0; } else figuren_lookAt(P, t, w); }
function pz_mim(P, n, w, d) { if (P && !P.own && typeof figuren_mimik === 'function') return figuren_mimik(P, n, w, d); return false; }
function pz_zmLoco(k, s) { const P = PZ.P, a = P.cur, m = P.motion[PZ.loco];
  if (a && m && m.speed) { const want = Math.max(k === 'walk' ? .45 : .5, Math.min(k === 'walk' ? 4.6 : 2.2, s / m.speed)); a.timeScale += (want - a.timeScale) * .18; } // Strecke je Zyklus aus dem Clip (m.speed), keine feste Grenze → Füße gleiten kaum
  if (a && m && m.phaseL !== undefined && s > .1) { const u = (a.time / a.getClip().duration) % 1, u0 = PZ.ph; PZ.ph = u; if (u0 >= 0) for (const f of [m.phaseL, m.phaseR]) if ((u0 < f && u >= f) || (u0 > u && (f > u0 || f <= u))) {
      if (!pz_ton('schritt', Math.min(1.1, .32 + s * .22), k === 'run' ? 1.06 : .96, false, .05)) Audio.stepAt(zombie.x, zombie.z, .5); if (k === 'walk' && f === m.phaseR && Math.random() < .6) pz_ton('schlurf', .6, .95, false, .05); } } else PZ.ph = -1; }
// Blick: Kopf folgt dem Ziel (Kamera, Punkt, Objekt) begrenzt (±63° Gier, ±29° Neigung) – nach dem Mischer, vor der Zusatzschicht
function pz_zmLook(dt) { const P = PZ.P, r = P.rig, L = P.lk; if (!r.head) return; let ty = 0, tp = 0; P.obj.getWorldQuaternion(_pqb);
  if (P.look && P.lookW > 0) { const T = P.look === 'cam' ? camera.position : P.look.isObject3D ? P.look.getWorldPosition(_pv3) : P.look; r.head.getWorldPosition(_pv1); _pv2.copy(T).sub(_pv1); _pfw.set(0, 0, 1).applyQuaternion(_pqb);
    let yaw = Math.atan2(_pv2.x, _pv2.z) - Math.atan2(_pfw.x, _pfw.z); yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)); ty = Math.max(-1.1, Math.min(1.1, yaw)) * P.lookW; tp = Math.max(-.5, Math.min(.5, Math.atan2(_pv2.y, Math.hypot(_pv2.x, _pv2.z)))) * P.lookW; }
  const k = 1 - Math.exp(-dt * 6); L.y += (ty - L.y) * k; L.p += (tp - L.p) * k;
  if (Math.abs(L.y) > .005) { pz_bend(r.neck, _pup, L.y * .4); pz_bend(r.head, _pup, L.y * .6); }
  if (Math.abs(L.p) > .005) { _pax.set(1, 0, 0).applyQuaternion(_pqb); pz_bend(r.head, _pax, -L.p * .7); } }
// Knochennamen wie beim alten Modell (tod.js, Brand-Partikel, kino.js lesen sie) → echte Knochen der Figur
function pz_ueMap(P) { const r = P.rig, f = re => { let o = null; P.obj.traverse(b => { if (!o && b.isBone && re.test(b.name.replace(/^.*[:|]/, '').replace(/^mixamorig/i, '').replace(/_\d+$/, ''))) o = b; }); return o; };
  return { pelvis: r.hips, spine_01: f(/^Spine$/i), spine_02: f(/^Spine1$/i), spine_03: r.chest || f(/^Spine2$/i), neck_01: r.neck, head: r.head, clavicle_l: r.lSh, clavicle_r: r.rSh, upperarm_l: r.lArm, upperarm_r: r.rArm,
    lowerarm_l: r.lFore, lowerarm_r: r.rFore, hand_l: r.lHand, hand_r: r.rHand, thigh_l: r.lUp, thigh_r: r.rUp, calf_l: r.lLeg, calf_r: r.rLeg, foot_l: r.lFoot, foot_r: r.rFoot }; }
// Mimik: das Lachen, das nicht aufhört (Zähne zeigen, Augen weit, Brauen innen hoch) – als eigener Eintrag in figuren.js
function pz_mimik() { try { if (typeof FIGUREN_MIMIK_V === 'undefined' || FIGUREN_MIMIK_V.zahn) return; const v = new Float32Array(FIGUREN_FACE_CH.length), set = (n, w) => { for (const k of [n, n + '_L', n + '_R']) if (FIGUREN_FACE_IX[k] !== undefined) v[FIGUREN_FACE_IX[k]] = w; };
  set('V_Open', .85); set('Mouth_Stretch', .38); set('Mouth_Frown', .22); set('Nose_Sneer', .5); set('Brow_Drop', .3); set('Eye_Squint', .12); set('Cheek_Raise', .12); FIGUREN_MIMIK_V.zahn = v; // schlaffer, offener Kiefer, gefletschte Zähne
  const w = new Float32Array(FIGUREN_FACE_CH.length); w.set(FIGUREN_MIMIK_V.schmerz || v); w[FIGUREN_FACE_IX.V_Open] = .6; FIGUREN_MIMIK_V.brand = w; } catch (e) {} }
// ---------------------------------------------------------------- Haut und Kleidung (je Figur eigene Materialien; die Werkstatt-Shader aus figuren.js bleiben davor)
function pz_bindOrt(root, re) { let p = null; root.traverse(m => { if (p || !m.isSkinnedMesh) return; m.skeleton.bones.forEach((b, i) => { if (!p && re.test(b.name)) p = new THREE.Vector3().setFromMatrixPosition(new THREE.Matrix4().copy(m.skeleton.boneInverses[i]).invert()); }); }); return p; }
async function pz_haut(root) {
  const T = typeof kr_tex === 'function' ? await kr_tex().catch(() => null) : null; root.updateMatrixWorld(true);
  // Bindungsraum → Meter mit Füßen auf 0 (für Rauschen, Narbe, Augenhöhlen)
  let y0 = 1e9, y1 = -1e9; const v = new THREE.Vector3(); root.traverse(m => { if (!m.isSkinnedMesh) return; const P = m.geometry.attributes.position; for (let i = 0; i < P.count; i += 7) { v.fromBufferAttribute(P, i).applyMatrix4(m.bindMatrix); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } });
  const sc = 1.97 / Math.max(1e-4, y1 - y0), toM = p => p ? new THREE.Vector3(p.x * sc, (p.y - y0) * sc, p.z * sc) : new THREE.Vector3(0, -9, 0);
  const eL = toM(pz_bindOrt(root, /L_Eye$|LeftEye/i)), eR = toM(pz_bindOrt(root, /R_Eye$|RightEye/i)), hd = toM(pz_bindOrt(root, /Head(_\d+)?$/i)), ht = toM(pz_bindOrt(root, /HeadTop/i));
  const top = ht.y > 0 ? ht : hd.clone().add(new THREE.Vector3(0, .17, 0)), fwd = eL.clone().add(eR).multiplyScalar(.5).sub(hd).setY(0).normalize();
  const sA = top.clone().addScaledVector(fwd, .07).add(new THREE.Vector3(.045, -.035, 0)), sB = top.clone().addScaledVector(fwd, -.11).add(new THREE.Vector3(-.02, -.055, 0)); // Schnitt über den Scheitel, leicht schräg
  const U = { pzT: PZ.U.pzT, pzOel: PZ.U.pzOel, pzBind: { value: new THREE.Matrix4() }, pzS: { value: sc }, pzY0: { value: y0 }, pzEyeL: { value: eL }, pzEyeR: { value: eR }, pzScarA: { value: sA }, pzScarB: { value: sB },
    pzMus: { value: T ? T.mus : null }, pzHasMus: { value: T ? 1 : 0 }, pzKind: { value: 0 } };
  root.traverse(m => { if (!m.isMesh) return; const ms = [].concat(m.material).map(src => { const n = src.name || ''; let kind = -1;
      if (/std_skin_head|^body$/i.test(n)) kind = 0; else if (/^material$|^bottom$/i.test(n)) kind = 1; else if (/shoes/i.test(n)) kind = 2; else if (/std_eye_[lr]$/i.test(n)) kind = 3; else if (/teeth|tongue/i.test(n)) kind = 4; else if (/hair|transparency/i.test(n) && src.alphaTest > 0) kind = 5;
      if (kind < 0) return src; const c = src.clone(), old = src.onBeforeCompile, ok = src.customProgramCacheKey ? src.customProgramCacheKey.call(src) : '', u = Object.assign({}, U, { pzBind: { value: m.isSkinnedMesh ? m.bindMatrix.clone() : m.matrix.clone() }, pzKind: { value: kind } });
      c.onBeforeCompile = (sh, r) => { if (old && old !== THREE.Material.prototype.onBeforeCompile) try { old(sh, r); } catch (e) {} pz_shader(sh, u, kind); };
      c.customProgramCacheKey = () => 'pz' + kind + '|' + ok; if (kind === 2) { c.color.multiplyScalar(.55); c.roughness = .5; } if (kind === 4 && /teeth/i.test(n)) c.color.setRGB(.86, .74, .52); if (kind === 4 && /tongue/i.test(n)) c.color.setRGB(.45, .3, .32);
      c.userData.pz = kind; c.needsUpdate = true; return c; });
    m.material = Array.isArray(m.material) ? ms : ms[0]; });
}
// Eingefallene Augenhöhlen, hohle Wangen und Schläfen: die Haut wird entlang ihrer Normalen nach innen gedrückt – nur an diesen Stellen (die Augäpfel selbst bleiben)
const PZ_HOHL = `{ vec3 q = vPz; float eL = distance(q, pzEyeL), eR = distance(q, pzEyeR), e = min(eL, eR);
  float ring = smoothstep(.02, .034, e) * (1. - smoothstep(.042, .075, e));
  vec3 cL = pzEyeL + vec3(.012, -.075, .0), cR = pzEyeR + vec3(-.012, -.075, .0); float ch = max(1. - smoothstep(.0, .05, distance(q, cL)), 1. - smoothstep(.0, .05, distance(q, cR)));
  vec3 tL = pzEyeL + vec3(.05, .025, -.02), tR = pzEyeR + vec3(-.05, .025, -.02); float te = max(1. - smoothstep(.0, .04, distance(q, tL)), 1. - smoothstep(.0, .04, distance(q, tR)));
  transformed -= objectNormal * (ring * .0075 + ch * .0095 + te * .005) / pzS; }`;
function pz_shader(sh, u, kind) { Object.assign(sh.uniforms, u);
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 pzBind; uniform float pzS, pzY0; uniform vec3 pzEyeL, pzEyeR; varying vec3 vPz; varying vec3 vPzN;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec3 b = (pzBind * vec4(transformed, 1.)).xyz; vPz = vec3(b.x * pzS, (b.y - pzY0) * pzS, b.z * pzS); vPzN = normalize(mat3(pzBind) * objectNormal); }\n' + (kind === 0 ? PZ_HOHL : ''));
  const head = `uniform float pzT, pzOel; uniform vec3 pzEyeL, pzEyeR, pzScarA, pzScarB; uniform sampler2D pzMus; uniform float pzHasMus; varying vec3 vPz; varying vec3 vPzN; float pzHt;\n${PZ_NOISE}
void pzWrap(IncidentLight L, vec3 n, vec3 dc, inout ReflectedLight R){ float nl = dot(n, L.direction); float w = max(0., (nl + .55) / 1.55) - max(0., nl); R.directDiffuse += L.color * dc * vec3(.62, .24, .17) * w * 1.5; }`;
  let col = '', rough = '';
  if (kind === 0) { // Haut
    col = `{ vec3 pp = vPz; float L0 = dot(diffuseColor.rgb, vec3(.3, .59, .11)); float n1 = pzN(pp * 6.), n2 = pzN(pp * 17. + 3.1), n3 = pzN(pp * 43. + 7.7);
      vec3 sk = mix(vec3(L0) * vec3(.66, .74, .6), diffuseColor.rgb * vec3(.7, .8, .68), .12) * mix(.78, 1.08, n1) * mix(.9, 1.06, n3); // graugrüne, verrottende Haut
      sk = mix(sk, vec3(.2, .27, .17) * (.55 + L0), smoothstep(.5, .78, pzN(pp * 3.7 + 9.)) * .6); sk = mix(sk, vec3(.4, .3, .22) * (.5 + L0), smoothstep(.62, .85, pzN(pp * 9. + 2.)) * .35);
      float ve = smoothstep(.9, .985, 1. - abs(pzN(pp * 11. + vec3(0., pp.y * 4., 0.)) * 2. - 1.)) * (.4 + .6 * n2); sk = mix(sk, vec3(.11, .09, .16), ve * .85);
      float lv = smoothstep(.55, .8, n1) * smoothstep(.3, .7, n2); sk = mix(sk, vec3(.26, .17, .26) * (.5 + L0), lv * .6);
      float eo = min(distance(pp, pzEyeL), distance(pp, pzEyeR)); float so = 1. - smoothstep(.016, .07, eo); sk = mix(sk, vec3(.035, .022, .03), so * .88);
      vec3 mc = (pzEyeL + pzEyeR) * .5 + vec3(0., -.105, .035); float md = length(vec2(pp.x - mc.x, (pp.y - mc.y) * (pp.y < mc.y ? .3 : 1.2))) + (n2 - .5) * .035 + (pzN(vec3(pp.x * 60., 0., 1.)) - .5) * .03 * step(pp.y, mc.y) * step(.0, pp.z - mc.z + .1);
      sk = mix(sk, vec3(.13, .02, .015), (1. - smoothstep(.016, .05, md)) * .62 * step(.0, pp.z - mc.z + .1)); // getrocknetes Blut um Mund und Kinn
      float uN = pzN(pp * 8.5 + 11.), ul = smoothstep(.77, .84, uN) * smoothstep(.22, .6, n3), ur = max(0., smoothstep(.68, .77, uN) - ul);
      vec3 fl = vec3(.34, .06, .045) * (.6 + .6 * n3); if (pzHasMus > .5) { vec3 kw = pow(abs(vPzN), vec3(4.)); kw /= kw.x + kw.y + kw.z + 1e-4; fl = (texture2D(pzMus, pp.zy * 7.).rgb * kw.x + texture2D(pzMus, pp.xz * 7.).rgb * kw.y + texture2D(pzMus, pp.xy * 7.).rgb * kw.z) * 1.25; }
      sk = mix(sk, vec3(.42, .33, .19) * (.7 + .5 * n3), ur * .65); sk = mix(sk, fl, ul);
      vec3 ab = pzScarB - pzScarA; float h = clamp(dot(pp - pzScarA, ab) / dot(ab, ab), 0., 1.); float sd = distance(pp, pzScarA + ab * h) * (1. + .5 * pzN(pp * 90.));
      float sc = (1. - smoothstep(.002, .0055, sd)) * step(.001, h) * step(h, .999), stp = smoothstep(.82, .93, fract(h * 24.)) * (1. - smoothstep(.007, .011, sd)) * step(.001, h) * step(h, .999);
      sk = mix(sk, vec3(.45, .2, .2), (1. - smoothstep(.004, .012, sd)) * .5 * step(.001, h) * step(h, .999)); sk = mix(sk, vec3(.12, .03, .03), sc); sk = mix(sk, vec3(.2, .19, .17), stp);
      sk = mix(sk, sk * vec3(.58, .52, .46), pzOel * (.6 + .4 * smoothstep(.3, .6, n1 + .2)));
      pzHt = ul * .6 - sc * .5 + stp * .4 + ur * .25; diffuseColor.rgb = sk; }`;
    rough = `roughnessFactor = mix(.36, .6, pzN(vPz * 17. + 3.1)); roughnessFactor = mix(roughnessFactor, .16, smoothstep(.8, .87, pzN(vPz * 8.5 + 11.))); roughnessFactor = mix(roughnessFactor, .2, pzOel);`; }
  else if (kind === 1) { // Anstaltshemd und -hose
    col = `{ vec3 pp = vPz; float L0 = dot(diffuseColor.rgb, vec3(.3, .59, .11)); float n1 = pzN(pp * 4.), n2 = pzN(pp * 13. + 2.), n3 = pzN(pp * 31. + 5.);
      vec3 cl = vec3(.62, .59, .5) * (.38 + .82 * L0) * mix(.78, 1., n2); // verdreckter, vergilbter Anstaltskittel
      cl = mix(cl, vec3(.1, .075, .05), (1. - smoothstep(.2, 1.5, pp.y)) * smoothstep(.3, .7, n1) * .4 + smoothstep(.55, .8, pzN(pp * 7. + 6.)) * .25); // Dreck, Schweißränder
      float pr = (1. - smoothstep(.05, .08, abs(fract(pp.x * 30. + pp.y * 30. + pp.z * 30.) - .5))) * (1. - smoothstep(.05, .08, abs(fract(pp.x * 30. - pp.y * 30. - pp.z * 30.) - .5))); cl *= 1. - pr * .2;
      float tie = (1. - smoothstep(.4, .6, L0)) * step(1.05, pp.y); cl = mix(cl, vec3(.22, .1, .065) * (.7 + .5 * n2), tie * .85);
      cl *= 1. - (smoothstep(.45, .8, n1) * .35 + (1. - smoothstep(.1, .9, pp.y)) * .3);
      float bl = smoothstep(.74, .82, pzN(pp * 5. + 4.)) * smoothstep(.3, .7, n3); cl = mix(cl, vec3(.25, .045, .03), bl * .75);
      float rip = smoothstep(.96, .994, 1. - abs(pzN(vec3(pp.x * 8., pp.y * 2.2, pp.z * 8.) + 9.) * 2. - 1.)) * smoothstep(.42, .62, pzN(pp * 2.6 + 1.)); cl = mix(cl, vec3(.1, .085, .07), rip * .55);
      float lo = smoothstep(.7, .8, pzN(pp * vec3(5., 3., 5.) + 21.)) * smoothstep(.45, .65, pzN(pp * 1.7 + 4.)); if (lo > .55 && pp.y > .25) discard; // zerrissene Stellen: die Haut darunter scheint durch
      cl = mix(cl, cl * vec3(.42, .38, .34), pzOel * (.6 + .4 * smoothstep(.25, .6, n1 + (1.2 - pp.y) * .45)));
      pzHt = -rip * .7 + bl * .1; diffuseColor.rgb = cl; }`;
    rough = `roughnessFactor = mix(.92, .5, smoothstep(.74, .82, pzN(vPz * 5. + 4.))); roughnessFactor = mix(roughnessFactor, .24, pzOel * smoothstep(.25, .6, pzN(vPz * 4.) + (1.2 - vPz.y) * .45));`; }
  else if (kind === 2) { col = `{ diffuseColor.rgb *= mix(.6, 1., pzN(vPz * 9.)); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * .3, pzOel); pzHt = 0.; }`; rough = 'roughnessFactor = mix(roughnessFactor, .25, pzOel);'; }
  else if (kind === 3) { col = `{ float L0 = dot(diffuseColor.rgb, vec3(.3, .59, .11)); vec3 ey = mix(diffuseColor.rgb * vec3(.8, .78, .74), vec3(.62, .62, .5) * (.5 + .45 * L0), .7); float rv = smoothstep(.78, .95, 1. - abs(pzN(vPz * 240.) * 2. - 1.)); diffuseColor.rgb = mix(ey, vec3(.5, .08, .06), rv * .55 * smoothstep(.3, .6, L0)); pzHt = 0.; }`; rough = 'roughnessFactor = .5;'; }
  else if (kind === 4) { col = `{ diffuseColor.rgb *= mix(vec3(.62, .48, .3), vec3(1.), smoothstep(.25, .75, pzN(vPz * 160.))); pzHt = 0.; }`; rough = 'roughnessFactor = .32;'; }
  else if (kind === 5) { col = `{ if (pzN(vPz * vec3(70., 12., 70.)) < .5 + .28 * pzN(vPz * 6.)) discard; diffuseColor.rgb *= .8; pzHt = 0.; }`; rough = 'roughnessFactor = mix(roughnessFactor, .3, pzOel);'; }
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + head)
    .replace('#include <roughnessmap_fragment>', col + '\n#include <roughnessmap_fragment>\n' + rough);
  if (kind <= 1) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{ vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float hx = dFdx(pzHt), hy = dFdy(pzHt); vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1);
  normal = normalize(abs(det) * normal - sign(det) * (hx * r1 + hy * r2) * .006); }`);
  if (kind === 0) sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );').join('RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight ); pzWrap( directLight, geometryNormal, material.diffuseColor, reflectedLight );'));
}
// ---------------------------------------------------------------- Klang: nur Aufnahmen (tools/klang_peter.py → game/audio/pz_*.ogg), räumlich an Peter
const PZ_KLANG = { schritt: 6, schlurf: 3, zahn: 3, atem: 4, lachen: 3, fall: 2, herz: 3, keuch: 3, stoehn: 1, stoff: 2 };
function pz_klangLaden() { if (PZ.snd || typeof klang_load !== 'function' || !Audio.ctx) return; PZ.snd = true; for (const [k, n] of Object.entries(PZ_KLANG)) for (let i = 1; i <= n; i++) klang_load('pz_' + k + '_' + i).catch(() => {}); }
function pz_ton(art, gain = 1, rate = 1, flat = false, y = 1.3) { const n = PZ_KLANG[art] || 1, k = 'pz_' + art + '_' + (1 + Math.floor(Math.random() * n)); if (!Audio.buf || !Audio.buf[k]) return false;
  Audio.play(k, flat ? { gain, rate } : { gain, rate: rate * rand(.95, 1.05), x: zombie.x, y, z: zombie.z, ref: 3 }); return true; }
// ---------------------------------------------------------------- Knochen-Schicht (nach dem Mischer, nur in Bildern, in denen figuren.js die Figur bewegt hat)
const _pqa = new THREE.Quaternion(), _pqb = new THREE.Quaternion(), _pqc = new THREE.Quaternion(), _pqi = new THREE.Quaternion(), _pv1 = new THREE.Vector3(), _pv2 = new THREE.Vector3(), _pv3 = new THREE.Vector3(), _pv4 = new THREE.Vector3(), _pax = new THREE.Vector3(), _pfw = new THREE.Vector3(), _pup = new THREE.Vector3(0, 1, 0);
function pz_knack() { if (!Audio.ctx) return; const n = 'wd_knochen_' + (1 + Math.floor(Math.random() * 6)); if (!Audio.buf || !Audio.buf[n]) return; Audio.play(n, { gain: .4, rate: rand(.8, 1.05), x: zombie.x, y: 1.5, z: zombie.z, ref: 2.5 }); }
// Röcheln/Stöhnen des Zombies: vorhandene Aufnahmen (undead*, zombie1) tief und gedämpft, räumlich an Peter
function pz_roehr(g = .5) { if (!Audio.ctx || !Audio.buf) return; const n = ['undead2', 'undead4', 'undead1', 'zombie1', 'undead3'].filter(k => Audio.buf[k]); if (!n.length) return; Audio.play(n[Math.floor(Math.random() * n.length)], { gain: g, rate: rand(.55, .75), lp: 1800, x: zombie.x, y: 1.4, z: zombie.z, ref: 3.5 }); }
function pz_schrei() { if (!Audio.ctx || !Audio.buf || !Audio.buf.sc_scream) return; Audio.play('sc_scream', { gain: .5, rate: rand(.68, .78), x: zombie.x, y: 1.5, z: zombie.z, ref: 4 }); }
function pz_bend(b, ax, a) { if (!b || !b.parent || !a) return; b.parent.getWorldQuaternion(_pqa); b.getWorldQuaternion(_pqb); _pqc.setFromAxisAngle(ax, a); b.quaternion.copy(_pqa.invert().multiply(_pqc).multiply(_pqb)); b.updateMatrixWorld(true); }
function pz_ziel(b, kind, T, w) { if (!b || !kind || !b.parent || w <= .001) return; b.getWorldPosition(_pv1); kind.getWorldPosition(_pv2); _pv2.sub(_pv1).normalize(); _pv3.copy(T).sub(_pv1).normalize();
  _pqc.setFromUnitVectors(_pv2, _pv3).slerp(_pqi, 1 - Math.min(1, w)); b.parent.getWorldQuaternion(_pqa); b.getWorldQuaternion(_pqb); b.quaternion.copy(_pqa.invert().multiply(_pqc).multiply(_pqb)); b.updateMatrixWorld(true); }
function pz_arm(s, T, w) { const r = PZ.P.rig, up = s < 0 ? r.lArm : r.rArm, fo = s < 0 ? r.lFore : r.rFore, ha = s < 0 ? r.lHand : r.rHand; if (!up || !fo || !ha) return;
  _pv4.copy(T); pz_ziel(up, fo, _pv4, w * .9); pz_ziel(fo, ha, _pv4, w); }
function pz_handPos(v = new THREE.Vector3(), s = 1) { const r = PZ.P && PZ.P.rig, h = r && (s < 0 ? r.lHand : r.rHand); if (h) return h.getWorldPosition(v); return v.set(zombie.x, 1.3, zombie.z); }
function pz_kopfPos(v = new THREE.Vector3()) { const h = PZ.P && PZ.P.rig.head; if (h) return h.getWorldPosition(v); return v.set(zombie.x, 1.75, zombie.z); }
function pz_schicht(dt, t) { const P = PZ.P, L = PZ.lay, r = P && P.rig; if (!r || !zombie.g.visible || !P.mv.vis || P.mv.acc !== 0) return;
  P.obj.getWorldQuaternion(_pqb); _pax.set(1, 0, 0).applyQuaternion(_pqb); _pfw.set(0, 0, 1).applyQuaternion(_pqb); const sp = PZ.ue;
  // Zombie-Gang: Torkeln (Rumpf pendelt im Schritt), hängender Kopf, ruckartiges Zucken mit Knochenknacken
  if (!feuer_S.zs && !(typeof kino_S !== 'undefined' && kino_S.on && kino_S.id === 'k2a')) { const J = PZ.jerk || (PZ.jerk = { t: rand(1.2, 3), tz: 0, tn: 0, ty: 0, z: 0, n: 0, y: 0, hold: 0 }), mv = Math.min(1, PZ.spd / 1.3), k = 1 - Math.exp(-dt * 24);
    J.t -= dt; if (J.t <= 0) { J.t = rand(1.1, 3.6); J.hold = rand(.12, .5); J.tz = rand(-.5, .5); J.tn = rand(-.12, .22); J.ty = rand(-.4, .4); if (PZ.spd > .05 || Math.random() < .5) pz_knack(); }
    else if (J.hold > 0) { J.hold -= dt; if (J.hold <= 0) { J.tz *= .3; J.tn *= .3; J.ty *= .3; } }
    J.z += (J.tz - J.z) * k; J.n += (J.tn - J.n) * k; J.y += (J.ty - J.y) * k;
    pz_bend(r.head, _pfw, J.z + .13); pz_bend(r.neck, _pax, J.n + .1); pz_bend(r.head, _pup, J.y);
    if (mv > .04) { const ph = t * (2.6 + PZ.spd * 1.1); pz_bend(sp.spine_01, _pfw, Math.sin(ph) * .09 * mv); pz_bend(sp.spine_02, _pfw, Math.sin(ph + 1.1) * .07 * mv); pz_bend(sp.spine_03, _pax, .09 * mv); } }
  // Oberkörper: vorgebeugt, beim Ausfall weiter; Hinken hebt die Schulter im Takt
  if (L.lean) { pz_bend(sp.spine_02, _pax, L.lean * .6); pz_bend(sp.spine_03, _pax, L.lean * .4); }
  // Kopf: sucht (Drehung), lauscht (schief), nickt, wendet sich ab
  if (L.kopf || L.tilt || L.nick || L.weg) { pz_bend(r.neck, _pup, L.kopf * .45 - L.weg * .55); pz_bend(r.head, _pup, L.kopf * .35 - L.weg * .4); pz_bend(r.head, _pfw, L.tilt); pz_bend(r.neck, _pax, L.nick * .35); pz_bend(r.head, _pax, L.nick * .25); }
  // Hand tastet an der Wand (Seite = Wand näher)
  if (L.wand > .01) { const s = PZ.wandS || 1; _pv4.set(zombie.x, 1.25 + Math.sin(t * 1.7) * .08, Z + s * 2.05).addScaledVector(_pfw, .35); pz_arm(_pv1.copy(_pv4).sub(r.hips.getWorldPosition(_pv2)).dot(_pax) > 0 ? -1 : 1, _pv4, L.wand); }
  // Greifen: beide Hände zum Ziel (Lukes Gesicht/Brust, beim Brand: die Tür)
  if (L.greif > .01) { pz_arm(-1, _pv4.copy(L.greifP).addScaledVector(_pax, .11), L.greif); pz_arm(1, _pv4.copy(L.greifP).addScaledVector(_pax, -.11), L.greif); }
  if (L.tuer > .01) pz_arm(1, L.greifP, L.tuer);
  // Winden im Feuer: Arme krallen, Rücken bäumt sich, Beine ziehen
  if (L.winden > .01) { const w = L.winden, a = Math.sin(t * 7.3) * w, b = Math.sin(t * 5.1 + 1) * w, c = Math.sin(t * 9.7 + 2) * w;
    pz_bend(sp.spine_02, _pax, -.18 * w + a * .1); pz_bend(sp.spine_02, _pfw, c * .18); pz_bend(r.lArm, _pax, -a * .5); pz_bend(r.rArm, _pax, b * .5); pz_bend(r.lFore, _pax, -Math.abs(b) * .7); pz_bend(r.rFore, _pax, -Math.abs(a) * .7);
    pz_bend(r.lUp, _pax, -Math.max(0, a) * .45); pz_bend(r.rUp, _pax, -Math.max(0, c) * .45); pz_bend(r.lLeg, _pax, Math.max(0, a) * .7); pz_bend(r.rLeg, _pax, Math.max(0, c) * .7); }
}
// ---------------------------------------------------------------- Clips (Fortbewegung nach echtem Tempo; Einmal-Clips mit Sperre)
function pz_clip(k, o = {}) { const P = PZ.P; if (!P || !P.acts[k]) return null; pz_play(P, k, false, { fade: o.fade ?? .35, once: o.once, ts: o.ts }); const a = P.acts[k]; if (o.t !== undefined) a.time = Math.max(0, o.t - ((P.motion && P.motion[k] && P.motion[k].off) || 0)); if (o.ts !== undefined) a.timeScale = o.ts; if (o.lock) { PZ.lockClip = k; PZ.lockT = o.lock; } PZ.loco = k; return a; }
function pz_loco(dt) { const P = PZ.P; if (!P) return; const vx = (zombie.x - PZ.lx) / Math.max(dt, 1e-3), vz = (zombie.z - PZ.lz) / Math.max(dt, 1e-3); PZ.lx = zombie.x; PZ.lz = zombie.z;
  const v = Math.min(7, Math.hypot(vx, vz)); PZ.spd += (v - PZ.spd) * Math.min(1, dt * 6);
  if (PZ.lockT > 0) { PZ.lockT -= dt; if (PZ.lockT > 0) return; PZ.lockClip = null; }
  const s = PZ.spd, cur = PZ.loco, K = PZ.ki; if (P.own) { const k = s < .14 ? (K && (K.st === 'verdacht' || K.st === 'verloren') ? 'suchen' : 'idle') : s < (cur === 'run' ? 1.3 : 1.55) ? 'walk' : 'run'; if (k !== cur) pz_clip(k, { fade: k === 'run' || cur === 'run' ? .25 : .4 }); return pz_zmLoco(k, s); }
  let k = s < .14 ? (K && (K.st === 'verdacht' || K.st === 'verloren') ? 'suchen' : 'idle') : s < (cur === 'walk' ? 1.05 : .85) ? 'walk' : s < (cur === 'run' ? 2.5 : 2.9) ? 'schritt' : 'run';
  if (k !== cur) pz_clip(k, { fade: k === 'run' || cur === 'run' ? .25 : .4 });
  const a = P.cur, m = P.motion && P.motion[PZ.loco]; if (a && m && m.rm === 'lin' && m.speed) a.timeScale = Math.max(.55, Math.min(k === 'walk' ? 1.9 : 1.6, s / m.speed));
  // Schritte genau beim Aufsetzen (Fußphasen aus den Bewegungsdaten)
  if (a && m && m.phaseL !== undefined && s > .1) { const u = (a.time / a.getClip().duration) % 1, u0 = PZ.ph; PZ.ph = u; if (u0 >= 0) for (const f of [m.phaseL, m.phaseR]) if ((u0 < f && u >= f) || (u0 > u && (f > u0 || f <= u))) {
      if (!pz_ton('schritt', Math.min(1.1, .32 + s * .22), k === 'run' ? 1.06 : .96, false, .05)) Audio.stepAt(zombie.x, zombie.z, .5); if (k === 'walk' && f === m.phaseR && Math.random() < .55) pz_ton('schlurf', .5, .95, false, .05); } } else PZ.ph = -1; }
// ---------------------------------------------------------------- Jagd-KI (ersetzt chaseUpdate der Basis, solange Peter als Figur da ist)
const pz_chaseAlt = chaseUpdate;
chaseUpdate = function (dt, t) { if (PZ.P && !feuer_S.altJagd) return pz_jagd(dt, t); return pz_chaseAlt(dt, t); };
function pz_kiNeu() { const P = player.pos; PZ.ki = { st: 'verdacht', t: 0, lkp: { x: P.x, z: P.z }, seen: 0, ungehoert: 0, lunge: 0, lungeCd: 2.5, ausw: 0, ziel: null, stapel: [], lauer: 0, glance: 0, stun: 0, wortT: 7, nahT: 0, stolpCd: 4, yaw: -PI / 2 + PI };
  zombie.g.rotation.set(0, 0, 0); PZ.lx = zombie.x; PZ.lz = zombie.z; PZ.plx = P.x; PZ.plz = P.z; pz_clip('suchen', { fade: .2 }); pz_ton('atem', .9, .9); }
function pz_jagd(dt, t) {
  const P = player.pos;
  if (ch2.chase === 'idle' && ch2.spiderPhase === 'gone' && P.x > X + 50 && P.x < X + 60 && Math.abs(P.z - Z) < 2) { startChase(); pz_kiNeu(); }
  // Gitter aufschieben (wie in der Basis): in der Jagd klemmt es 3 s – das hört man weit
  if (ch2.on && !gate.userData.open) { const near = Math.abs(P.x - gate.position.x) < 1.6 && Math.abs(P.z - Z) < 2 && P.x < gate.position.x;
    const need = ch2.chase === 'run' ? 3 : .8; gate.userData.need = need;
    if (near && keys.KeyE && !qte_aktivSicher()) { gate.userData.holdT += dt; if (gate.userData.holdT % .25 < dt) { Audio.flick(); if (need > 1) Audio.play('metalHit2', { gain: .18, rate: rand(1.1, 1.4), x: gate.position.x, y: 1, z: Z, ref: 2 }); }
      if (gate.userData.holdT > need && (ch2.chase !== 'run' || Math.hypot(zombie.x - P.x, zombie.z - P.z) < 2.4)) { gate.userData.open = true; tween(gate, { pos: gate.position.clone().setZ(gate.position.z + 3.2) }, .55); gate.userData.col.minX = gate.userData.col.maxX = -9999; Audio.slide(gate.position.x, Z); uninteract(gate); } }
    else gate.userData.holdT = Math.max(0, gate.userData.holdT - dt * 2);
    if (near && !gate.userData.open) $('sideInfo').textContent = gate.userData.holdT > 0 ? '▮'.repeat(Math.min(8, Math.ceil(gate.userData.holdT / need * 8))).padEnd(8, '▯') : ''; }
  if (ch2.chase !== 'run') return;
  if (!PZ.ki) pz_kiNeu();
  zombie.t += dt; pz_ki(dt, t);
  if (P.x > X + 106.6 && !chaseDoor.shut) { chaseDoor.shut = true; chaseDoor.set(false); chaseDoor.locked = true; Audio.slam(chaseDoor.m.position.x, 1.2, chaseDoor.m.position.z); ch2.chase = 'done'; Audio.chaseMusic(false); zombie.g.visible = false; }
}
function qte_aktivSicher() { return typeof qte_aktiv === 'function' && qte_aktiv(); }
function pz_ki(dt, t) {
  const K = PZ.ki, P = player.pos, S = feuer_S; K.t += dt; K.lungeCd -= dt; K.stolpCd -= dt; K.stun = Math.max(0, K.stun - dt);
  const dx = P.x - zombie.x, dz = P.z - zombie.z, d = Math.hypot(dx, dz) || .001;
  // ---- Sinne
  const ps = Math.hypot(P.x - PZ.plx, P.z - PZ.plz) / Math.max(dt, 1e-3); PZ.plx = P.x; PZ.plz = P.z;
  const amGitter = !gate.userData.open && Math.abs(P.x - gate.position.x) < 1.8 && gate.userData.holdT > .15;
  let laut = ps > 4.2 ? 13 : ps > 2.4 ? 7 : ps > .7 ? 3.2 : 0; if (amGitter) laut = 26; if (flashOn !== PZ.flash0) { PZ.flash0 = flashOn; laut = Math.max(laut, 3.5); }
  const fx = Math.cos(zombie.g.rotation.y), fz = -Math.sin(zombie.g.rotation.y), dot = (dx * fx + dz * fz) / d; camera.getWorldDirection(_pv1);
  const lit = flashOn && !state.blackout, inBeam = lit && d < 20 && (-dx * _pv1.x - dz * _pv1.z) / d > .9;
  const sieht = (lit && d < 17 && dot > .42) || inBeam || (d < 4.2 && dot > .1) || d < 2;
  const hoert = laut > 0 && d < laut;
  if (sieht) { K.seen = 0; K.lkp.x = P.x; K.lkp.z = P.z; } else K.seen += dt;
  if (hoert) { K.ungehoert = 0; K.lkp.x = P.x + rand(-.4, .4) * d * .08; K.lkp.z = P.z + rand(-.4, .4) * d * .08; } else K.ungehoert += dt;
  const go = (st) => { if (K.st === st) return; K.st = st; K.t = 0; K.ziel = null; K.stapel.length = 0; K.lauer = 0; pz_stimmung(st); };
  // ---- Zustände
  let tx = zombie.x, tz = zombie.z, sp = 0;
  if (amGitter) go('jagd'); // er weiß, dass das Gitter klemmt
  switch (K.st) {
    case 'lauern': { if (sieht) { go('jagd'); break; } if (hoert) { go('verdacht'); break; }
      if (!K.ziel || Math.hypot(K.ziel.x - zombie.x, K.ziel.z - zombie.z) < .5) K.ziel = { x: Math.max(X + 48, Math.min(gate.position.x - 1, zombie.x + rand(-6, 6))), z: Z + rand(-1.1, 1.1) };
      tx = K.ziel.x; tz = K.ziel.z; sp = K.t % 9 > 6.5 ? 0 : .55; break; }
    case 'verdacht': { tx = zombie.x; tz = zombie.z; sp = 0; if (sieht && K.t > .5) { go('jagd'); break; } if (K.t > 1.7) go('suche'); break; }
    case 'suche': { if (sieht) { go('jagd'); break; } if (hoert && d < 6) { go('jagd'); break; }
      if (!K.ziel) K.ziel = { x: K.lkp.x, z: K.lkp.z, art: 'lkp' };
      const zd = Math.hypot(K.ziel.x - zombie.x, K.ziel.z - zombie.z);
      if (K.lauer > 0) { K.lauer -= dt; sp = 0; if (K.lauer <= 0) K.ziel = null; break; }
      if (zd < .6) { // angekommen: umsehen, dann den nächsten Stapel absuchen – oder still daneben lauern
        if (K.ziel.art === 'lkp' || K.ziel.art === 'stapel') { const c = pz_stapel(K); if (c && Math.random() < .7) K.ziel = c; else { K.lauer = rand(2.2, 4.5); if (Math.random() < .35) K.lauer += 3; } } }
      tx = K.ziel ? K.ziel.x : zombie.x; tz = K.ziel ? K.ziel.z : zombie.z; sp = 1.05; if (K.t > 15) go('verloren'); break; }
    case 'jagd': { if (!sieht && K.ungehoert > 3.2 && K.seen > 3.2 && !amGitter) { go('suche'); break; }
      // Abfangen: dorthin, wo Luke gleich ist (nicht wo er war)
      const lead = Math.min(.9, d / 6), vx = (P.x - (PZ.plx2 ?? P.x)) / Math.max(dt, 1e-3), vz = (P.z - (PZ.plz2 ?? P.z)) / Math.max(dt, 1e-3);
      tx = sieht ? P.x + vx * lead : K.lkp.x; tz = sieht ? Math.max(Z - 1.5, Math.min(Z + 1.5, P.z + vz * lead)) : K.lkp.z;
      sp = d > 11 ? 4.0 : d > 5 ? 2.3 : 1.55; // er geht – schnell nur, wenn er will
      if (amGitter) { sp = d > 6 ? 2.0 : 1.2; sp = Math.min(5.2, Math.max(sp, (d - .9) / Math.max(.35, (gate.userData.need || 3) - gate.userData.holdT))); tx = P.x; tz = P.z; }
      else if (d < 1.9 && !K.lunge) { K.nahT += dt; if (K.nahT < 2.4) sp = 0; } else K.nahT = 0; // steht hinter Luke, atmet – erst dann greift er
      // Ausfall: ein plötzlicher Satz, die Arme voraus
      if (!amGitter && !K.lunge && K.lungeCd <= 0 && d > 1.9 && d < 4.4 && P.x < gate.position.x - 2.5 && sieht && !state.talking) { K.lunge = .95; K.lungeCd = rand(5.5, 8); pz_ausfall(d); }
      if (K.lunge > 0) { K.lunge -= dt; sp = qte_aktivSicher() ? Math.max(0, Math.min(5, (d - 1.25) * 6)) : 5.2; tx = P.x; tz = P.z; if (K.lunge <= 0) K.lunge = 0; }
      break; }
    case 'verloren': { sp = 0; if (sieht || (hoert && d < 8)) { go('jagd'); break; } if (K.t > 4.2) go('lauern'); break; }
  }
  PZ.plx2 = P.x; PZ.plz2 = P.z;
  if (PZ.P && PZ.P.own && sp > 0 && sp <= 1.6) sp *= .75; // das Zombie-Modell humpelt: Gehgeschwindigkeit passend zum Clip
  if (K.stun > 0) sp = Math.min(sp, K.stun > .6 ? 0 : .6);
  // ---- Bewegung, Blickrichtung (Körper dreht träge), Stolpern an Gerümpel
  const blocked = pz_geh(tx, tz, sp, dt);
  if (blocked && sp > 1.4 && K.stolpCd <= 0 && Math.random() < .4) { K.stolpCd = rand(6, 10); K.stun = .9; pz_clip('stolpern', { once: true, lock: 1.1, fade: .2 }); FEU_SND.clank(zombie.x, zombie.z, .5); pz_ton('atem', .8, 1.1); }
  const look = K.st === 'jagd' || K.st === 'verdacht' ? Math.atan2(K.st === 'jagd' ? dx : K.lkp.x - zombie.x, K.st === 'jagd' ? dz : K.lkp.z - zombie.z) - PI / 2 : sp > .1 ? Math.atan2(tx - zombie.x, tz - zombie.z) - PI / 2 : zombie.g.rotation.y;
  const dy = Math.atan2(Math.sin(look - zombie.g.rotation.y), Math.cos(look - zombie.g.rotation.y)); zombie.g.rotation.y += dy * Math.min(1, dt * (K.lunge ? 7 : 3.2));
  zombie.g.position.set(zombie.x, 0, zombie.z); zombie.g.rotation.x = zombie.g.rotation.z = 0;
  // ---- Fang
  Audio.chaseLevel(K.st === 'jagd' ? Math.max(.25, 1 - d / 12) : K.st === 'suche' ? .22 : .1);
  if (d < 1.1 && !qte_aktivSicher()) caught();
}
function pz_geh(tx, tz, sp, dt) { const dx = tx - zombie.x, dz = tz - zombie.z, d = Math.hypot(dx, dz) || 1e-3; if (sp <= 0 || d < .05) return false; const st = Math.min(d, sp * dt);
  let nx = zombie.x + dx / d * st, nz = zombie.z + dz / d * st, blocked = false; const hit = c => nx + .35 > c.minX && nx - .35 < c.maxX && nz + .35 > c.minZ && nz - .35 < c.maxZ;
  for (const o of obstacles) { const c = o.userData.col; if (hit(c)) { blocked = true; const cz = (c.minZ + c.maxZ) / 2; nz = zombie.z + (zombie.z > cz ? 1 : -1) * st; nx = zombie.x + dx / d * st * .3; if (hit(c)) nx = zombie.x; } }
  if (!gate.userData.open && nx > gate.position.x - .5) nx = gate.position.x - .5;
  zombie.x = nx; zombie.z = Math.max(Z - 1.6, Math.min(Z + 1.6, nz)); return blocked; }
// Nächster Stapel nahe der letzten Stelle: dahinter (an der Wand, auf der abgewandten Seite) sehen
function pz_stapel(K) { let best = null, bd = 6; for (const o of obstacles) { const c = o.userData.col; if (K.stapel.includes(c)) continue; const cx = (c.minX + c.maxX) / 2, cz = (c.minZ + c.maxZ) / 2, dd = Math.hypot(cx - K.lkp.x, cz - K.lkp.z); if (dd < bd) { bd = dd; best = c; } }
  if (!best) return null; K.stapel.push(best); const far = zombie.x < (best.minX + best.maxX) / 2 ? best.maxX + .55 : best.minX - .55, wz = (best.minZ + best.maxZ) / 2;
  return { x: Math.max(X + 47.5, Math.min(gate.position.x - .7, far)), z: Math.max(Z - 1.5, Math.min(Z + 1.5, wz)), art: 'stapel' }; }
// Zustand wechselt: hörbar und sichtbar (fair lesbar)
function pz_stimmung(st) { const P = PZ.P; if (!P) return;
  if (st === 'verdacht') { pz_ton('zahn', .8, 1); pz_mim(P, 'zahn', .6); }
  else if (st === 'suche') { pz_mim(P, 'zahn', .5); if (Math.random() < .5) pz_wort(); }
  else if (st === 'jagd') { pz_mim(P, 'zahn', 1); if (P.own && PZ.screamCd <= 0 && PZ.ki && Math.hypot(player.pos.x - zombie.x, player.pos.z - zombie.z) > 5.5) { PZ.screamCd = 40; pz_clip('scream', { once: true, lock: 2.4, fade: .2 }); PZ.ki.stun = Math.max(PZ.ki.stun, 2.1); pz_schrei(); } pz_ton('atem', 1.1, .92); if (Math.random() < .5) pz_ton('lachen', .55, .95); if (PZ.ki && PZ.ki.t > 0) Audio.chaseMusic(true); }
  else if (st === 'verloren') { pz_mim(P, 'zahn', .35); pz_ton('atem', .9, .82); pz_wort(true); } }
// Die gebrochene Stimme: fast Wörter („Luke …“, „raus …“) – Untertitel für Gehörlose; die Sprachausgabe (stimmen.js) übernimmt, sobald die Zeilen gebaut sind
function pz_wort(raus) { const P = PZ.P; if (!P || PZ.wortT > 0) return; PZ.wortT = rand(9, 15); const tx = raus ? '„… raus …“' : '„… Lu… ke …“';
  try { subtitle(tx, 1700, 'PETER'); } catch (e) {} pz_ton('lachen', .32, .78); setTimeout(() => pz_ton('atem', .6, .86), 500); }
// Ausfall mit Ausweich-QTE: die Hand kommt aus dem Dunkel, Luke duckt sich zur freien Seite weg
function pz_ausfall(d) { const K = PZ.ki, P = player.pos; pz_clip('run', { fade: .15 }); PZ.lay.greif = 0; pz_schrei(); pz_knack(); pz_ton('atem', 1.2, 1.05); if (Math.random() < .6) pz_ton('lachen', .5, 1);
  const fwdL = { x: -Math.sin(player.yaw), z: -Math.cos(player.yaw) }, rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw), hinten = ((zombie.x - P.x) * fwdL.x + (zombie.z - P.z) * fwdL.z) < -.2;
  if (hinten && PZ.cam.autoN < 2 && !keys[qte_tasteSicher('zurueck')]) { PZ.cam.autoT = .85; PZ.cam.autoN++; }
  if (K.ausw >= 2 || typeof qte_start !== 'function') return; // danach nur noch Laufen
  const s = (zombie.x - P.x) * rx + (zombie.z - P.z) * rz; let dir = s > 0 ? -1 : 1; const zN = P.z + rz * dir * .9; if (Math.abs(zN - Z) > 1.45) dir = -dir; // weg von der Hand, nie in die Wand
  const key = dir < 0 ? 'links' : 'rechts'; K.ausw++; PZ.cam.fovK = -4;
  qte_start({ type: 'tippen', keys: key, sperre: [dir < 0 ? 'rechts' : 'links'], duration: Math.max(.8, d / 5.2 + .25), window: [.4, .88], label: 'Ausweichen', at: () => pz_handPos(_pv3, 1),
    onOk: () => { PZ.cam.fovK = 0; PZ.cam.ausw = { t: 0, dx: rx * dir * .85, dz: rz * dir * .85, x0: P.x, z0: P.z }; PZ.cam.kick = dir * .07; PZ.cam.kickV = dir * 1.6; PZ.cam.dipV = -1.2;
      K.stun = 1.6; K.lunge = 0; K.lungeCd = 7; pz_clip('stolpern', { once: true, lock: 1.2, fade: .15 }); Audio.play('wind3', { gain: .35, rate: 1.8, dur: .4, x: zombie.x, y: 1.2, z: zombie.z, ref: 2 });
      FEU_SND.clank(zombie.x + .6, zombie.z, .55); pz_ton('stoehn', .7, 1, true); pz_ton('keuch', .5, 1, true); },
    onFail: () => { PZ.cam.fovK = 0; K.lunge = 0; PZ.cam.kickV = 2.4; caught(); } }); }
function qte_tasteSicher(r) { return typeof qte_taste === 'function' ? qte_taste(r) : 'KeyQ'; }
// ---------------------------------------------------------------- Kamera in der Flucht: Schulterblick, Impulse, Sichtfeld (nach der Ich-Kamera der Basis, vor dem Bild)
function pz_kamera(dt) { const C = PZ.cam, P = player.pos, aktiv = ch2.on && (ch2.chase === 'run' || C.zk > .002 || Math.abs(C.kick) > .001 || Math.abs(C.dip) > .001 || C.fovSet || C.ausw);
  if (!aktiv || camOverride || state.talking) { if (C.fovSet && !camOverride) { camera.fov = fov; camera.updateProjectionMatrix(); C.fovSet = false; } C.zk = 0; C.ausw = null; return; }
  // Ausweichschritt: Luke weicht seitlich aus (weich, mit Ducken)
  if (C.ausw) { const A = C.ausw; A.t += dt; const k = Math.min(1, A.t / .3), e = k * k * (3 - 2 * k), nx = A.x0 + A.dx * e, nz = A.z0 + A.dz * e;
    if (Math.abs(nz - Z) < 1.6) { P.x += nx - (A.lx ?? A.x0); P.z += nz - (A.lz ?? A.z0); } A.lx = nx; A.lz = nz; if (k >= 1) C.ausw = null; }
  const hold = ch2.chase === 'run' && !ui.overlay && !!keys[qte_tasteSicher('zurueck')]; C.autoT = Math.max(0, C.autoT - dt);
  const want = hold || C.autoT > 0 ? 1 : 0; if (want && C.zk < .02) { const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw); C.side = ((zombie.x - P.x) * rx + (zombie.z - P.z) * rz) > 0 ? -1 : 1; }
  C.zk += (want - C.zk) * (1 - Math.exp(-dt * (want ? 8.5 : 6.5))); const e = C.zk * C.zk * (3 - 2 * C.zk);
  // Federn: seitlicher Ruck (Rollen) und Ducken (Neigen) nach knappen Fehlgriffen
  C.kickV += (-C.kick * 140 - C.kickV * 9) * dt; C.kick += C.kickV * dt; C.dipV += (-C.dip * 110 - C.dipV * 11) * dt; C.dip += C.dipV * dt;
  if (e > .001) { camera.rotation.y += C.side * 2.4 * e; camera.rotation.x += -.12 * e; camera.rotation.z += -C.side * .05 * e; const rx = Math.cos(player.yaw), rz = -Math.sin(player.yaw); camera.position.x -= rx * C.side * .07 * e; camera.position.z -= rz * C.side * .07 * e; camera.position.y -= .03 * e; }
  camera.rotation.z += C.kick; camera.rotation.x += C.dip * .5; camera.position.y += C.dip * .12;
  const df = 7 * e + C.fovK; if (Math.abs(df) > .02 || C.fovSet) { camera.fov = fov + df; camera.updateProjectionMatrix(); C.fovSet = Math.abs(df) > .02; } }
// Lukes Herz: echte Schläge, Takt nach Bedrohung; Peters Atem/Zähne nach Zustand
function pz_klangTick(dt) { const K = PZ.ki; if (!K || ch2.chase !== 'run' || !zombie.g.visible) return; const d = Math.hypot(player.pos.x - zombie.x, player.pos.z - zombie.z);
  const thr = K.st === 'jagd' ? Math.max(0, 1 - d / 14) : K.st === 'suche' ? .35 * Math.max(0, 1 - d / 20) : .12;
  PZ.herzT -= dt; if (PZ.herzT <= 0) { PZ.herzT = 1.05 - .62 * thr; pz_ton('herz', .22 + .6 * thr, .95 + .1 * thr, true); }
  PZ.atemT -= dt; if (PZ.atemT <= 0) { PZ.atemT = K.st === 'jagd' ? rand(1.3, 2) : K.st === 'verdacht' ? 99 : rand(2.8, 4.4); if (K.st !== 'verdacht') pz_ton('atem', K.st === 'jagd' ? 1 : .6, K.st === 'jagd' ? .98 : .9); }
  PZ.zahnT -= dt; if (PZ.zahnT <= 0) { PZ.zahnT = K.st === 'verdacht' || K.st === 'suche' ? rand(2, 4) : rand(4, 8); pz_ton('zahn', K.st === 'jagd' ? .5 : .75, 1); }
  PZ.wortT -= dt; if ((K.st === 'suche' || K.st === 'lauern') && PZ.wortT <= 0 && d < 16) pz_wort(K.st === 'lauern');
  if (K.st === 'jagd' && Math.random() < dt * .08) pz_ton('lachen', .45, rand(.9, 1.05)); }
// Schicht-Werte der Jagd (Kopf sucht/lauscht, Hand an der Wand, vorgebeugt beim Ausfall)
function pz_jagdSchicht(dt, t) { const K = PZ.ki, L = PZ.lay; if (!K || ch2.chase !== 'run') return; const ke = 1 - Math.exp(-dt * 4);
  const kopfZ = K.st === 'lauern' || K.st === 'suche' ? Math.sin(t * .7) * .55 + Math.sin(t * 1.9) * .15 : 0, tiltZ = K.st === 'verdacht' || K.lauer > 0 ? .32 * Math.sin(Math.min(1, K.t * 2) * PI / 2) : K.st === 'verloren' ? .18 : 0;
  L.kopf += (kopfZ - L.kopf) * ke; L.tilt += (tiltZ - L.tilt) * ke;
  const wd = Math.abs(zombie.z - Z), wandZ = (K.st === 'lauern' || K.st === 'suche') && wd > .75 && PZ.spd > .15 ? 1 : 0; PZ.wandS = Math.sign(zombie.z - Z) || 1; L.wand += (wandZ * .85 - L.wand) * ke;
  if (wandZ && Math.random() < dt * .25) Audio.play('scrape3', { gain: .1, rate: rand(1.4, 1.8), dur: .7, x: zombie.x, y: 1.2, z: Z + PZ.wandS * 1.9, ref: 2 }); // Fingernägel über Beton und Blech
  const gz = K.lunge > 0 || (K.st === 'jagd' && Math.hypot(player.pos.x - zombie.x, player.pos.z - zombie.z) < 2.2) ? 1 : 0; L.greif += (gz * .8 - L.greif) * (1 - Math.exp(-dt * 7)); if (gz) L.greifP.copy(camera.position).y -= .35;
  L.lean += ((K.lunge > 0 ? .55 : K.st === 'jagd' ? .22 : .12) - L.lean) * ke;
  if (PZ.P) pz_look(PZ.P, K.st === 'jagd' ? 'cam' : null, .9); }
// ---------------------------------------------------------------- QTE-Ketten (Kinosequenz k2a und Ersatz ohne Kino): Losreißen, dann gegen das Fass
function pz_qte(o) { return new Promise(res => { if (typeof qte_start !== 'function') return res(true); qte_start(Object.assign({}, o, { onOk: h => { try { o.ok && o.ok(h); } catch (e) {} res(true); }, onFail: h => { try { o.nein && o.nein(h); } catch (e) {} res(false); } })); }); }
const pz_shake = (a, d) => { if (typeof kino_shake === 'function' && typeof kino_S !== 'undefined' && kino_S.on) kino_shake(a, d); else shake = Math.max(shake, a); };
async function pz_qteLos() { let k0 = 0;
  for (let r = 0; r < 2; r++) {
    const ok = await pz_qte({ type: 'haemmern', keys: 'ruetteln', need: r ? 8 : 10, duration: r ? 2.6 : 3.2, decay: r ? .4 : .32, label: r ? 'Luft!' : 'Losreißen', gross: true, onHit: k => { pz_shake(.02 + k * .02, .12); PZ.cam.kickV = (Math.random() < .5 ? -1 : 1) * (.9 + k); PZ.cam.dipV = -.8; if (Math.random() < .5) pz_knack(); else pz_ton('stoff', .5, rand(.9, 1.1), true); },
      onTick: k => { if (k > k0 + .05) { pz_shake(.012 + k * .01, .14); if (Math.random() < .35) pz_ton(Math.random() < .5 ? 'stoff' : 'keuch', .45, rand(.95, 1.1), true); } k0 = k; },
      ok: () => { pz_ton('stoehn', .9, 1, true); pz_ton('stoff', .8, .85, true); pz_shake(.05, .35); } });
    if (ok) return 'ok';
    if (r === 0) { pz_shake(.045, .7); pz_ton('keuch', 1, .85, true); try { subtitle('Er drückt fester. Die Luft geht aus.', 2000); } catch (e) {} await wait(650); k0 = 0; } }
  return 'tot'; }
async function pz_qteFass() { const at = () => _pv3.set(FEU.bx, .7, FEU.bz);
  for (let r = 0; r < 2; r++) {
    const ok = await pz_qte({ type: 'tippen', keys: 'aktion', duration: r ? 1.15 : 1.5, window: r ? [.55, .82] : [.5, .85], label: 'Gegen das Fass', at,
      ok: () => { if (feuer_S.phase === 'idle' && !(PZ.k2a && feuer_S.griffLauf)) feuer_knock(); pz_shake(.06, .6); Audio.play('metalSlam', { gain: .7, rate: .62, x: FEU.bx, y: .4, z: FEU.bz, ref: 3 }); } });
    if (ok) return 'ok';
    if (r === 0) { pz_shake(.05, .5); pz_ton('stoehn', .7, .9, true); try { subtitle('Ihr taumelt am Fass vorbei. Noch einmal!', 1800); } catch (e) {} await wait(450); } }
  return 'tot'; }
// Kinosequenz k2a („Bruder.“, kino.js) ruft je Einstellung feuer_k2a(phase); feuer_k2aHalt hält eine Einstellung, solange ein QTE läuft
function feuer_k2a(ph) { const P = PZ.P, A = typeof kino_S !== 'undefined' ? kino_S.k2a : null; if (!P) return false;
  const K = PZ.k2a || (PZ.k2a = { warte: false, tot: false, greifZ: 0, nah: 1, fall: false });
  if (ph === 'nah') { Object.assign(K, { warte: false, tot: false, greifZ: 0, nah: 1, fall: false, aufschlag: false }); PZ.ki = null; pz_clip('idle', { fade: .2 }); pz_mim(P, 'zahn', 1); pz_look(P, 'cam', 1); pz_ton('atem', 1, .9); pz_ton('zahn', .6, 1); }
  else if (ph === 'haende') { K.greifZ = .95; K.nah = .8; pz_ton('stoff', .6, 1, true); }
  else if (ph === 'druecken') { K.nah = .55; K.greifZ = .7; pz_clip('hug', { t: 1.4, ts: .3, fade: .5 }); pz_ton('atem', 1.1, .85); K.warte = true; pz_qteLos().then(r => { K.warte = false; if (r === 'tot') K.tot = true; }); }
  else if (ph === 'fass') { K.greifZ = .25; K.warte = true; pz_qteFass().then(r => { K.warte = false; if (r === 'tot') K.tot = true; }); }
  else if (ph === 'fall') { K.greifZ = 0; K.fall = true; K.ft = 0; K.knocked = false; K.imp = false; K.vx = 2.4; const S = feuer_S;
    // Totale: Peter läuft von Westen durch den Gang auf die Kamera zu; das Fass am Nordrand kippt in seine linke Flanke (Aufprall nach ~0,75 s), er stürzt nach vorn ins auslaufende Öl
    zombie.g.visible = true; zombie.x = FEU.bx - 1.8; zombie.z = Z + .02; zombie.g.position.set(zombie.x, 0, zombie.z); zombie.g.rotation.set(0, 0, 0); if (A) A.imp = true;
    S.spillBodyX = FEU.bx + .35; pz_look(P, null); pz_clip('run', { fade: .12, ts: .83 }); PZ.U.pzOel.value = Math.max(PZ.U.pzOel.value, .05); pz_ton('atem', 1, 1.15); pz_ton('lachen', .5, .9); }
  return true; }
function feuer_k2aHalt(sh, t) { if (PZ.k2a && PZ.k2a.warte && sh) sh._dur = Math.max(sh._dur, t + .08); }
function feuer_k2aTot() { return !!(PZ.k2a && PZ.k2a.tot); }
function pz_k2aTick(dt) { const K = PZ.k2a, L = PZ.lay, A = kino_S.k2a; if (!K || !A) return;
  L.greif += (K.greifZ - L.greif) * (1 - Math.exp(-dt * 3.2)); L.greifP.copy(camera.position); L.greifP.y -= .07; L.lean += (.2 - L.lean) * Math.min(1, dt * 3); L.kopf *= .9; L.tilt += (.12 - L.tilt) * Math.min(1, dt * 2);
  if (!K.fall && zombie.g.visible) { const d0 = Math.hypot(zombie.g.position.x - A.x, zombie.g.position.z - A.z), dn = d0 + (K.nah - d0) * Math.min(1, dt * 1.6); zombie.g.position.set(A.x - A.fx * dn, 0, A.z - A.fz * dn); }
  if (K.fall && K.vx === undefined) { PZ.U.pzOel.value = Math.min(1, PZ.U.pzOel.value + dt * .3); const fv = PZ.P.acts.fall_vor; if (fv && !K.aufschlag && fv.time > 4.7) { K.aufschlag = true; pz_knack(); pz_ton('fall', 1, 1, false, .2); Audio.play('waterFlow', { gain: .5, rate: .55, lp: 500, dur: 3, x: zombie.x, y: .1, z: zombie.z, ref: 2.5 }); } } // ohne Kino (Wiederholung)
  else if (K.fall) { const S = feuer_S; K.ft = (K.ft || 0) + dt; PZ.U.pzOel.value = Math.min(1, PZ.U.pzOel.value + dt * (K.imp ? .5 : .02));
    if (!K.imp) { zombie.x += K.vx * dt; if (!K.knocked && K.ft > .35 && S.phase === 'idle') { K.knocked = true; feuer_knock(); } // Fassbewegung: feuer_barrelUpdate (tip)
      if ((S.phase === 'tip' && S.bt > .4) || K.ft > 1.1) { K.imp = true; K.vx = 2.2; pz_clip('fall_vor', { once: true, fade: .1, t: 1.9, ts: 1.55 }); pz_look(PZ.P, null); pz_knack(); pz_ton('fall', 1, .9, false, .8); pz_ton('stoehn', .8, .95); pz_shake(.07, .6); PZ.cam.kickV = 1.4;
        Audio.play('metalSlam', { gain: .95, rate: .62, x: zombie.x, y: .6, z: Z - .4, ref: 4 }); Audio.play('woodHit2', { gain: .5, rate: .55, x: zombie.x, y: .8, z: zombie.z, ref: 3 }); FEU_SND.clank(zombie.x, Z - .3, .9); } }
    else { zombie.x += K.vx * dt; K.vx *= Math.exp(-dt * 4.2); }
    zombie.g.position.set(zombie.x, 0, zombie.z); zombie.g.rotation.set(0, 0, 0);
    const fv = PZ.P.acts.fall_vor; if (fv && K.imp && !K.aufschlag && fv.time > 4.7) { K.aufschlag = true; pz_knack(); pz_ton('fall', 1, 1, false, .2); Audio.play('waterFlow', { gain: .5, rate: .55, lp: 500, dur: 3, x: zombie.x, y: .1, z: zombie.z, ref: 2.5 }); Audio.play('waterFlow', { gain: .3, rate: .7, dur: .8, x: zombie.x + 1, y: .1, z: zombie.z, ref: 2 }); } } }
// ---------------------------------------------------------------- Peter im Öl, im Feuer, sein letzter Griff zur Tür (Zustände aus feuer_zombieUpdate, Bewegung aus echten Clips)
function pz_zsTick(dt, t) { const S = feuer_S, Q = S.zs, P = PZ.P, L = PZ.lay; if (!Q || !P || !zombie.g.visible) return; const fv = P.acts.fall_vor; if (!fv) return; const D = fv.getClip().duration, KN = 2.75;
  const halt = tm => { if (PZ.loco !== 'fall_vor') pz_clip('fall_vor', { once: true, fade: .5 }); fv.paused = false; fv.timeScale = 0; fv.time = Math.max(0, Math.min(D - .02, tm)); }, ez = k => k * k * (3 - 2 * k);
  L.greif *= .9; L.wand = 0; L.lean *= .9; L.kopf *= .92; L.tilt *= .95; if (S.spilled) PZ.U.pzOel.value = Math.min(1, PZ.U.pzOel.value + dt * .35);
  if (Q.st === 'fall') { if (PZ.loco !== 'fall_vor') pz_clip('fall_vor', { once: true, fade: .25, t: 1.9, ts: 1.55 }); if (!Q.aufschlag && fv.time > 4.7) { Q.aufschlag = true; pz_ton('fall', 1, 1, false, .2); } return; }
  if (Q.st === 'down') { halt(D - .03 - (D - .03 - KN) * Math.min(1, (Q.sit || 0) / .6)); pz_look(P, 'cam', .75); pz_mim(P, 'zahn', .45); L.winden += ((Q.writhe || 0) * .3 - L.winden) * Math.min(1, dt * 3); return; }
  if (Q.st === 'rise') { if (Q.r0 === undefined) Q.r0 = fv.time; const k = Math.min(1, Q.t / 1.8); halt(Q.r0 + (1.15 - Q.r0) * ez(k)); L.winden *= .9; pz_look(P, 'cam', 1); pz_mim(P, 'zahn', 1); return; }
  if (Q.st === 'nick') { halt(D - .03); L.nick = (Q.nick || 0) * .8; L.weg = Q.weg || 0; pz_look(P, null); return; }
  if (Q.st === 'burn') { const b = Q.t; pz_mim(P, 'brand', .9); L.nick *= .9;
    if (b < 3) { halt(D - .03); L.winden += (Math.min(1, b) * .9 - L.winden) * Math.min(1, dt * 4); L.weg = Math.max(0, 1 - b / 2.5); }
    else if (b < 4.6) { const k = ez((b - 3) / 1.6); halt(D - .03 - (D - .03 - KN) * k); L.winden *= 1 - Math.min(1, dt * 2); L.weg = 0; if (!Q.auf) { Q.auf = true; pz_ton('atem', 1.2, .8); } }
    else if (b < 6) { halt(KN); L.winden *= .9; L.tuer += (1 - L.tuer) * Math.min(1, dt * 3); L.greifP.set(X + 106, 1.25, Z); pz_look(P, L.greifP, 1); } // er greift an Luke vorbei zur Tür – er wollte raus
    else if (Q.liegt) halt(D - .03);
    else { if (!Q.sturz) { Q.sturz = true; fv.timeScale = 1.55; fv.time = KN; pz_ton('atem', .9, .7); } L.tuer *= 1 - Math.min(1, dt * 3); if (!Q.thudP && fv.time > 4.7) { Q.thudP = true; TOD_SND.thud(.6); FEU_SND.collapse(Q.x + 1.2, Q.z); pz_ton('fall', 1, .85, false, .2); shake = Math.max(shake, .03); }
      if (fv.time >= D - .05) { fv.timeScale = 0; fv.time = D - .03; Q.liegt = true; } } } }
// Feuerzeug ruhig halten („Nicht bewegen“): Funken, dann die Flamme – zittert die Hand oder lässt Luke los, reißt sie ab
function pz_feuerzeugPos(v) { camera.getWorldDirection(_pv1); _pv2.set(Math.cos(player.yaw), 0, -Math.sin(player.yaw)); return v.copy(camera.position).addScaledVector(_pv1, .42).addScaledVector(_pv2, .1).add(_pv3.set(0, -.2, 0)); }
function pz_qteFeuerzeug() { const S = feuer_S; let fT = 0;
  return pz_qte({ type: 'halten', keys: 'aktion', duration: 2.1, still: 1, label: 'Ruhig halten', at: () => pz_feuerzeugPos(_pv4),
    onTick: k => { fT -= 1 / 60; if (fT <= 0) { fT = k > .65 ? .25 : .5; pz_feuerzeugPos(_pv4); if (k < .65) { FEU_SND.flick(); for (let i = 0; i < 5; i++) feuer_emit(S.pe, _pv4.x, _pv4.y, _pv4.z, rand(-.4, .4), rand(.2, 1), rand(-.4, .4), rand(.15, .4), .012, .008, 0, 0); } }
      if (k > .65) { pz_feuerzeugPos(_pv4); if (Math.random() < .7) feuer_emit(S.pc, _pv4.x, _pv4.y + .01, _pv4.z, 0, .12, 0, .22, .025, .05, 0, 0); } } }); }
// Zweiter Griff ohne Kinosequenz (nach dem Tod, Wiederholung): Peter vor Luke, die Hände am Gesicht, dieselben QTEs aus Lukes Augen
async function pz_griffOhneKino(ax, az) { const P = player.pos, L = PZ.lay; zombie.g.visible = true; zombie.g.position.set(ax - .62, 0, az); zombie.g.rotation.set(0, 0, 0); zombie.x = ax - .62; zombie.z = az;
  player.yaw = PI / 2; player.pitch = -.05; PZ.k2a = { warte: true, tot: false, greifZ: .9, nah: .62, fall: false }; pz_clip('hug', { t: 1.4, ts: .3, fade: .3 }); pz_mim(PZ.P, 'zahn', 1); pz_look(PZ.P, 'cam', 1);
  const t0 = performance.now(), hold = setInterval(() => { L.greif += (PZ.k2a.greifZ - L.greif) * .15; L.greifP.copy(camera.position); L.greifP.y -= .07; if (performance.now() - t0 > 20000) clearInterval(hold); }, 16);
  pz_ton('atem', 1.1, .9); await wait(500); try { subtitle('„Bruder.“', 1600, 'PETER'); } catch (e) {} await wait(700);
  let r = await pz_qteLos(); if (r === 'ok') { PZ.k2a.greifZ = .25; r = await pz_qteFass(); } clearInterval(hold); PZ.k2a.warte = false; L.greif = 0;
  if (r === 'tot') { PZ.k2a.tot = true; return 'tot'; }
  PZ.k2a.fall = true; zombie.g.position.set(ax - 2.0, 0, az); zombie.x = ax - 2.0; pz_clip('fall_vor', { once: true, fade: .2, t: 1.9, ts: 1.55 }); player.yaw = PI / 2; return 'ok'; }
// ---------------------------------------------------------------- Pro Bild (aus dem Feuer-Takt)
function pz_tick(dt, t) {
  if (!PZ.an && ch2.on) pz_laden(); if (!PZ.P) return; PZ.U.pzT.value = t;
  if (ch2.on && Audio.ctx && Audio.ctx.state === 'running') pz_klangLaden();
  PZ.screamCd -= dt; if (PZ.P.own && zombie.g.visible && ch2.chase === 'run' && (PZ.roehrT = (PZ.roehrT ?? 6) - dt) <= 0) { PZ.roehrT = rand(7, 13); pz_roehr(.45); } if (PZ.P.own && zombie.g.visible) { PZ.P.mx.update(dt); PZ.P.obj.updateMatrixWorld(true); pz_zmLook(dt); }
  const S = feuer_S, L = PZ.lay;
  if (typeof tod_S !== 'undefined' && tod_S.dying) { L.greif = L.wand = L.lean = L.winden = L.tuer = L.kopf = L.tilt = 0; if (zombie.g.visible && PZ.loco !== 'idle' && !S.zs) pz_clip('idle', { fade: .3 }); pz_look(PZ.P, 'cam', 1); return; }
  if (typeof kino_S !== 'undefined' && kino_S.on && kino_S.id === 'k2a') pz_k2aTick(dt);
  else if (S.zs) pz_zsTick(dt, t);
  else if (ch2.chase === 'run' && PZ.ki) { pz_loco(dt); pz_jagdSchicht(dt, t); pz_klangTick(dt); }
  else { L.greif *= .9; L.winden *= .9; L.tuer *= .9; }
  pz_schicht(dt, t); pz_kamera(dt);
}
function pz_reset() { PZ.ki = null; PZ.k2a = null; PZ.lockClip = null; PZ.lockT = 0; PZ.U.pzOel.value = 0; Object.assign(PZ.lay, { kopf: 0, tilt: 0, wand: 0, greif: 0, lean: 0, nick: 0, weg: 0, winden: 0, tuer: 0 });
  Object.assign(PZ.cam, { zk: 0, autoT: 0, autoN: 0, kick: 0, kickV: 0, dip: 0, dipV: 0, fovK: 0, ausw: null }); if (PZ.cam.fovSet) { camera.fov = fov; camera.updateProjectionMatrix(); PZ.cam.fovSet = false; }
  if (typeof qte_aktiv === 'function' && qte_aktiv()) qte_ende(null); if (PZ.P) { pz_look(PZ.P, null); pz_mim(PZ.P, 'zahn', .6); pz_clip('idle', { fade: .2 }); } }
// Losreißen oder das Fass zweimal verfehlt: er hält fest, bis Luke keine Luft mehr bekommt (Tod, Speicherpunkt wie bisher)
function pz_griffTod() { const S = feuer_S; S.griffLauf = false; S.griff = false; ch2.chase = 'run'; if (typeof todDie === 'function') todDie('zombie'); }
