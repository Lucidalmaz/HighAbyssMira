// =====================================================================  BEDIENUNG (Modul „bedienung“, Auftrag 08.10.2026: alle Bedienelemente hochwertig und verständlich)
// Gemeinsamer Baukasten für Geräte, die der Spieler anfasst: Tastenfeld, Sicherungskasten, Funkkasten, Notentriegelung.
// Grundsatz: nur DARSTELLUNG und Bedienkomfort – Codes, Reihenfolgen, Logik und Rätsel-Hinweise der Module bleiben unberührt.
// Bausteine (alle teilen wenige Materialien und je Gerät höchstens drei 512er-Texturen; Texturen entstehen erst beim ersten Bau eines Geräts):
//   BED.mat(name)            – geteilte PBR-Materialien: stahl (gebürstet, Schmutz), lack (grauer Industrielack mit Abrieb/Rost), gummi, bakelit, messing, rot (Signalrot),
//                              schraube, glas (Display-/Skalenglas mit Fettfilm), kabel, gold (abgegriffenes Messing)
//   BED.rr(w,h,d,r,b)        – abgerundeter Quader (Extrusion mit Fase), geometrisch geteilt
//   BED.schraube(parent,x,y,z,r)  – Schlitz-/Torx-Schraube, zufällig gedreht
//   BED.led(parent,x,y,z,farbe)   – Messingring + Linse + Leuchtschein (.set(an, farbe, stärke))
//   BED.seg7(...)            – Siebensegment-Display (Glas, Geisterziffern, Eigenleuchten); .zeige(text, farbe)
//   BED.klick(art)           – Klick-/Rast-Geräusch aus den echten Aufnahmen (switch1/switch2/keys1/metalHit2/buzz), nie Sinuston
//   BED.keypad(o)            – Kellertür-Tastenfeld: Edelstahlplatte, Gummitasten (eindrückbar, 0·1·3 abgegriffen, Rest verstaubt), Display, LEDs, Kabel
//   BED.sicherung(o)         – Sicherungskasten Kap. 2: Rahmen, Schutzklappe mit Griff, sechs Kippautomaten mit Kontrollleuchten, Beschriftung
//   BED.funk(o)              – Funkkasten Kap. 3: Skalenfenster, Drehknöpfe, Kippschalter, Lautsprechergitter, Typenschild, Antenne
//   Notentriegelung (Kap. 2): baut feuer.js selbst (feuer_notschalter, Stilanker); sie nimmt ihre Metallteile aus BED.mat('stahl'/'messing'/'bakelit'). Warnstreifen: BED.warn().
const BED = { _m: {}, _t: {}, _g: {}, k1: null, sic: null, funk: null };
function bed_rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bed_cv(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); if (f) f(x, w, h); return c; }
function bed_tex(c, srgb = true, rep) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
// Normalkarte aus Höhenkarte (Rot-Kanal), Sobel, OpenGL-Konvention
function bed_normal(src, k = 2) { const w = src.width, h = src.height, d = src.getContext('2d').getImageData(0, 0, w, h).data, out = bed_cv(w, h), o = out.getContext('2d'), im = o.createImageData(w, h), o8 = im.data;
  const H = (x, y) => d[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
    o8[i] = (-dx / l * .5 + .5) * 255; o8[i + 1] = (dy / l * .5 + .5) * 255; o8[i + 2] = (1 / l * .5 + .5) * 255; o8[i + 3] = 255; }
  o.putImageData(im, 0, 0); return out; }

// ---------------------------------------------------------------- Texturen (gebürstetes Metall, Lack mit Abrieb, Gummi) – je einmal, 512 px
function bed_bürste(seed, W = 512, Hh = 512, o = {}) { // → { map, height, rough } als Leinwände
  const r = bed_rng(seed), base = o.base || [170, 173, 172];
  const map = bed_cv(W, Hh, (x, w, h) => { x.fillStyle = `rgb(${base})`; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = r() < .5 ? 255 : 0, y = r() * h, l = 30 + r() * 260, x0 = r() * w; x.fillStyle = `rgba(${v},${v},${v},${.03 + r() * .07})`; x.fillRect(x0, y, l, 1 + (r() < .15 ? 1 : 0)); if (x0 + l > w) x.fillRect(x0 - w, y, l, 1); }
    // Schmutz, Fingerfett, Wischspuren; Ränder dunkler (Dreck sammelt sich an den Kanten)
    for (let i = 0; i < 26; i++) { const cx = r() * w, cy = r() * h, rr = 10 + r() * 46, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(60,48,36,${.06 + r() * .1})`); g.addColorStop(1, 'rgba(60,48,36,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    const eg = x.createLinearGradient(0, 0, 0, h); eg.addColorStop(0, 'rgba(20,16,12,.28)'); eg.addColorStop(.12, 'rgba(20,16,12,0)'); eg.addColorStop(.88, 'rgba(20,16,12,0)'); eg.addColorStop(1, 'rgba(20,16,12,.34)'); x.fillStyle = eg; x.fillRect(0, 0, w, h);
    const eh = x.createLinearGradient(0, 0, w, 0); eh.addColorStop(0, 'rgba(20,16,12,.3)'); eh.addColorStop(.1, 'rgba(20,16,12,0)'); eh.addColorStop(.9, 'rgba(20,16,12,0)'); eh.addColorStop(1, 'rgba(20,16,12,.3)'); x.fillStyle = eh; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(255,255,255,${.1 + r() * .22})`; x.lineWidth = .6; x.beginPath(); const sx = r() * w, sy = r() * h, a = r() * 6.28, l = 8 + r() * 60; x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke(); } }); // Kratzer
  const height = bed_cv(W, Hh, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); const r2 = bed_rng(seed + 7);
    for (let i = 0; i < 2600; i++) { const v = r2() < .5 ? 255 : 0, y = r2() * h, l = 30 + r2() * 260, x0 = r2() * w; x.fillStyle = `rgba(${v},${v},${v},${.05 + r2() * .1})`; x.fillRect(x0, y, l, 1); if (x0 + l > w) x.fillRect(x0 - w, y, l, 1); } });
  const rough = bed_cv(W, Hh, (x, w, h) => { x.fillStyle = '#7c7c7c'; x.fillRect(0, 0, w, h); const r3 = bed_rng(seed + 3);
    for (let i = 0; i < 1400; i++) { const v = r3() < .5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${.03 + r3() * .06})`; x.fillRect(r3() * w, r3() * h, 20 + r3() * 200, 1); }
    for (let i = 0; i < 22; i++) { const cx = r3() * w, cy = r3() * h, rr = 12 + r3() * 40, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(210,210,210,.35)'); g.addColorStop(1, 'rgba(210,210,210,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); } });
  return { map, height, rough }; }
function bed_lackTex(seed, farbe = [74, 80, 76]) { const r = bed_rng(seed), W = 512;
  const map = bed_cv(W, W, (x, w, h) => { x.fillStyle = `rgb(${farbe})`; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 5000; i++) { const v = r() < .5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${r() * .05})`; x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3); }
    for (let i = 0; i < 34; i++) { const cx = r() * w, cy = r() * h, rr = 14 + r() * 70, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(16,12,8,${.05 + r() * .12})`); g.addColorStop(1, 'rgba(16,12,8,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
    for (let i = 0; i < 90; i++) { const cx = r() * w, cy = r() * h, rr = 1 + r() * 3.5; x.fillStyle = r() < .5 ? `rgba(120,64,28,${.35 + r() * .4})` : `rgba(150,150,146,${.3 + r() * .4})`; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); } // Abplatzer: Rost und blankes Blech
    for (let i = 0; i < 24; i++) { const cx = r() * w, cy = r() * h, l = 20 + r() * 80, g = x.createLinearGradient(cx, cy, cx, cy + l); g.addColorStop(0, 'rgba(110,60,28,.28)'); g.addColorStop(1, 'rgba(110,60,28,0)'); x.fillStyle = g; x.fillRect(cx, cy, 1.5 + r() * 2, l); } }); // Rostnasen
  const height = bed_cv(W, W, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); const r2 = bed_rng(seed + 5); for (let i = 0; i < 9000; i++) { const v = r2() < .5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${r2() * .09})`; x.fillRect(r2() * w, r2() * h, 1 + r2() * 2, 1 + r2() * 2); } for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.arc(r2() * w, r2() * h, 1 + r2() * 3, 0, 7); x.fill(); } });
  return { map, height }; }
function bed_tx() { const T = BED._t; if (T.stahl) return T;
  const b = bed_bürste(11), l = bed_lackTex(23), g = bed_lackTex(31, [30, 30, 30]);
  T.stahl = { map: bed_tex(b.map, true), normal: bed_tex(bed_normal(b.height, 1.6), false), rough: bed_tex(b.rough, false) };
  T.lack = { map: bed_tex(l.map, true), normal: bed_tex(bed_normal(l.height, 1.2), false) };
  T.gummi = { normal: bed_tex(bed_normal(g.height, 1.8), false) };
  return T; }

// ---------------------------------------------------------------- geteilte Materialien
BED.mat = function (n) { const M = BED._m; if (M[n]) return M[n]; const T = bed_tx(), S = THREE.MeshStandardMaterial;
  switch (n) {
    case 'stahl': M[n] = new S({ color: 0xffffff, map: T.stahl.map, normalMap: T.stahl.normal, normalScale: new THREE.Vector2(.5, .5), roughnessMap: T.stahl.rough, roughness: .62, metalness: .92 }); break;
    case 'lack': M[n] = new S({ color: 0xffffff, map: T.lack.map, normalMap: T.lack.normal, normalScale: new THREE.Vector2(.7, .7), roughness: .58, metalness: .42 }); break;
    case 'lackGross': { const mm = T.lack.map.clone(), nn = T.lack.normal.clone(); for (const t of [mm, nn]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 5); t.needsUpdate = true; } M[n] = new S({ color: 0xc8d0c4, map: mm, normalMap: nn, normalScale: new THREE.Vector2(.1, .1), roughness: .6, metalness: .35 }); break; }
    case 'gummi': M[n] = new S({ color: 0x242424, normalMap: T.gummi.normal, normalScale: new THREE.Vector2(.8, .8), roughness: .78, metalness: 0 }); break;
    case 'staub': M[n] = new S({ color: 0x2e2c28, normalMap: T.gummi.normal, normalScale: new THREE.Vector2(1.2, 1.2), roughness: .97, metalness: 0 }); break;
    case 'gold': M[n] = new S({ color: 0xc09a5a, roughness: .24, metalness: .88, normalMap: T.gummi.normal, normalScale: new THREE.Vector2(.35, .35) }); break;
    case 'bakelit': M[n] = new S({ color: 0x120c09, roughness: .3, metalness: .05 }); break;
    case 'messing': M[n] = new S({ color: 0xb08a3c, roughness: .3, metalness: .95 }); break;
    case 'rot': M[n] = new S({ color: 0xa31a10, roughness: .3, metalness: .15, normalMap: T.lack.normal, normalScale: new THREE.Vector2(.35, .35) }); break;
    case 'schraube': M[n] = new S({ color: 0x8a8d8c, roughness: .3, metalness: .95 }); break;
    case 'kabel': M[n] = new S({ color: 0x0f0f10, roughness: .55, metalness: .05 }); break;
    case 'glas': { const r = bed_rng(5), c = bed_cv(256, 128, (x, w, h) => { x.fillStyle = '#202020'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const cx = r() * w, cy = r() * h, rr = 8 + r() * 30, g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); } });
      M[n] = new S({ color: 0x0a100c, roughness: 1, roughnessMap: bed_tex(c, false), metalness: 0, transparent: true, opacity: .16, depthWrite: false, envMapIntensity: 1.6 }); break; }
    default: throw new Error('BED.mat ' + n);
  } return M[n]; };

// ---------------------------------------------------------------- Geometrie und Kleinteile
BED.rr = function (w, h, d, r, b = .002) { const key = [w, h, d, r, b].join('_'), G = BED._g; if (G[key]) return G[key]; const s = new THREE.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.0005, d - b * 2), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 5 }); g.translate(0, 0, -(d - b * 2) / 2); return G[key] = g; };
BED.mesh = function (parent, geo, mat, x, y, z, o = {}) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.ry) m.rotation.y = o.ry; if (o.rz) m.rotation.z = o.rz; m.castShadow = o.cast !== false; m.receiveShadow = true; m.userData.noCol = true; parent.add(m); return m; };
BED.schraube = function (p, x, y, z, r = .006, seed = 1) { const G = BED._g, k = 'schr' + r; if (!G[k]) { G[k] = new THREE.CylinderGeometry(r, r * 1.05, r * .55, 14); G[k + 's'] = new THREE.BoxGeometry(r * 1.7, r * .2, r * .3); }
  const a = bed_rng(seed * 977 + 13)() * 3.14, h = BED.mesh(p, G[k], BED.mat('schraube'), x, y, z, { rx: Math.PI / 2 }), s = new THREE.Mesh(G[k + 's'], BED.mat('bakelit')); s.position.y = r * .2; s.rotation.y = a; s.userData.noCol = true; h.add(s); return h; };
BED.glow = function () { if (BED._t.glow) return BED._t.glow; const c = bed_cv(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }); return BED._t.glow = bed_tex(c, false); };
BED.led = function (p, x, y, z, farbe = 0x33ff55, r = .0045) { const ring = BED.mesh(p, new THREE.TorusGeometry(r * 1.25, r * .35, 6, 14), BED.mat('messing'), x, y, z, { cast: false });
  const lm = new THREE.MeshStandardMaterial({ color: 0x151515, emissive: farbe, emissiveIntensity: 1.4, roughness: .15, metalness: 0 }), dome = BED.mesh(p, new THREE.SphereGeometry(r, 12, 8, 0, 6.283, 0, 1.5708), lm, x, y, z, { cast: false, rx: Math.PI / 2 });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: BED.glow(), color: farbe, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); sp.scale.set(r * 6, r * 6, 1); sp.position.set(x, y, z + r * .8); p.add(sp);
  const L = { ring, dome, sp, mat: lm, set(an, f, s = 1) { lm.emissive.set(f !== undefined ? f : farbe); lm.emissiveIntensity = an ? 1.6 * s : .04; sp.material.color.set(f !== undefined ? f : farbe); sp.material.opacity = an ? .6 * s : 0; sp.visible = an; } }; return L; };
BED.label = function (p, w, h, x, y, z, draw, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: bed_tex(bed_cv(o.px || 256, Math.round((o.px || 256) * h / w), draw)), roughness: o.rough ?? .5, metalness: o.metal ?? .1, transparent: !!o.alpha, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.position.set(x, y, z); m.receiveShadow = true; m.userData.noCol = true; p.add(m); return m; };
// Warnstreifen (gelb/schwarz) als Leinwand-Zeichnung
BED.warn = function (x, X, Y, W, H, st = 22) { x.save(); x.beginPath(); x.rect(X, Y, W, H); x.clip(); x.fillStyle = '#d9b41a'; x.fillRect(X, Y, W, H); x.fillStyle = '#17150f'; for (let i = -4; i < W / st + 4; i++) { x.beginPath(); x.moveTo(X + i * st * 2, Y + H); x.lineTo(X + i * st * 2 + st, Y + H); x.lineTo(X + i * st * 2 + st + H, Y); x.lineTo(X + i * st * 2 + H, Y); x.fill(); } x.restore(); };

// ---------------------------------------------------------------- Klick-Geräusche (nur echte Aufnahmen)
BED.klick = function (art = 'taste', o = {}) { try { if (!Audio.ctx) return; const v = () => 1 + (Math.random() - .5) * .16;
  if (art === 'taste') Audio.play('switch1', { gain: o.gain ?? .22, rate: 2.5 * v(), offset: 0, dur: .11, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'loeschen') Audio.play('switch1', { gain: o.gain ?? .22, rate: 1.7 * v(), offset: 0, dur: .13, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'gesperrt') Audio.play('metalHit2', { gain: o.gain ?? .1, rate: 2.2, dur: .09, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'falsch') { Audio.play('buzz', { gain: o.gain ?? .3, rate: 1.1, dur: .5, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 }); Audio.play('metalHit2', { gain: .12, rate: 1.9, dur: .1, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 }); }
  else if (art === 'kipp') Audio.play(Math.random() < .5 ? 'switch1' : 'switch2', { gain: o.gain ?? .3, rate: 1.4 * v(), dur: .25, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'klappe') Audio.play('metalOpen', { gain: o.gain ?? .5, rate: 1.25, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  else if (art === 'dreh') Audio.play('keys2', { gain: o.gain ?? .12, rate: 2.2 * v(), dur: .09, x: o.x, y: o.y, z: o.z, ref: o.ref || 2 });
  } catch (e) {} };

// ---------------------------------------------------------------- Siebensegment-Display (Glas, Geisterziffern, Eigenleuchten)
const BED_SEG = { '0': 'abcdef', '1': 'bc', '2': 'abdeg', '3': 'abcdg', '4': 'bcfg', '5': 'acdfg', '6': 'acdefg', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g', '_': 'd', ' ': '', 'E': 'adefg', 'r': 'eg', 'o': 'cdeg', 'P': 'abefg', 'n': 'ceg', 'F': 'aefg', 'A': 'abcefg', 'L': 'def', 'C': 'adef', 'U': 'bcdef', 'S': 'acdfg', 'H': 'bcefg', 'd': 'bcdeg', 'b': 'cdefg', 't': 'defg', 'c': 'deg', 'O': 'abcdef' };
function bed_seg7(c, ch, x, y, w, h, fill) { const t = w * .17, on = BED_SEG[ch] || '', hs = yc => [[x + t * .7, yc], [x + t * 1.4, yc - t / 2], [x + w - t * 1.4, yc - t / 2], [x + w - t * .7, yc], [x + w - t * 1.4, yc + t / 2], [x + t * 1.4, yc + t / 2]],
    vs = (xc, y0, y1) => [[xc, y0 + t * .7], [xc + t / 2, y0 + t * 1.4], [xc + t / 2, y1 - t * 1.4], [xc, y1 - t * .7], [xc - t / 2, y1 - t * 1.4], [xc - t / 2, y0 + t * 1.4]],
    P = { a: hs(y + t / 2), g: hs(y + h / 2), d: hs(y + h - t / 2), f: vs(x + t / 2, y, y + h / 2), b: vs(x + w - t / 2, y, y + h / 2), e: vs(x + t / 2, y + h / 2, y + h), c: vs(x + w - t / 2, y + h / 2, y + h) };
  for (const k of fill === 'geist' ? 'abcdefg' : on) { c.beginPath(); P[k].forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); } }
// Display: Breite w, Höhe h (Meter) → Gruppe; .zeige('1234', 0x6dff8a); Zellen = Anzahl Ziffern
BED.seg7 = function (parent, w, h, x, y, z, zellen = 4) { const PX = 256, PY = Math.round(256 * h / w), map = bed_cv(PX, PY), emi = bed_cv(PX, PY), tm = bed_tex(map), te = bed_tex(emi);
  const mat = new THREE.MeshStandardMaterial({ map: tm, emissiveMap: te, emissive: 0xffffff, emissiveIntensity: 1.1, roughness: .35, metalness: 0 }), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.userData.noCol = true; parent.add(m);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), BED.mat('glas')); gl.position.set(x, y, z + .0012); gl.userData.noCol = true; parent.add(gl);
  const D = { m, mat, text: null, col: null, zeige(text, farbe = 0x6dff8a, hell = 1) { text = String(text); const key = text + '|' + farbe; if (D.key === key) { mat.emissiveIntensity = 1.1 * hell; return; } D.key = key; D.text = text;
      const col = new THREE.Color(farbe), css = `rgb(${col.r * 255 | 0},${col.g * 255 | 0},${col.b * 255 | 0})`, cw = PX * .86 / zellen, ch = PY * .62, x0 = (PX - cw * zellen) / 2 + cw * .12, y0 = (PY - ch) / 2;
      const a = map.getContext('2d'), b = emi.getContext('2d'); a.clearRect(0, 0, PX, PY); b.clearRect(0, 0, PX, PY);
      const g = a.createLinearGradient(0, 0, 0, PY); g.addColorStop(0, '#0b120d'); g.addColorStop(1, '#050806'); a.fillStyle = g; a.fillRect(0, 0, PX, PY); b.fillStyle = '#000'; b.fillRect(0, 0, PX, PY);
      a.save(); a.transform(1, 0, -.1, 1, PY * .05, 0); b.save(); b.transform(1, 0, -.1, 1, PY * .05, 0);
      for (let i = 0; i < zellen; i++) { const cx = x0 + i * cw; a.fillStyle = 'rgba(150,170,150,.07)'; bed_seg7(a, '8', cx, y0, cw * .78, ch, 'geist'); const chr = text[i] || ' '; a.fillStyle = css; bed_seg7(a, chr, cx, y0, cw * .78, ch);
        b.shadowColor = css; b.shadowBlur = 9; b.fillStyle = css; bed_seg7(b, chr, cx, y0, cw * .78, ch); }
      a.restore(); b.restore(); a.fillStyle = 'rgba(0,0,0,.18)'; for (let yy = 0; yy < PY; yy += 3) a.fillRect(0, yy, PX, 1); // Pixelraster
      tm.needsUpdate = true; te.needsUpdate = true; mat.emissiveIntensity = 1.1 * hell; } };
  D.zeige('----'); return D; };

// ================================================================= TASTENFELD (Kellertür, Kap. 1)
// Vandalismusgeschütztes Zutrittsfeld: Gehäuse in Graphitlack, Frontplatte Edelstahl gebürstet mit eingravierter Beschriftung, 12 Gummitasten (eindrückbar),
// Siebensegment-Display unter Glas, zwei Kontrollleuchten, Kabelstutzen mit Leitung in der Wand. Taste 0·1·3 abgegriffen (Messing glänzt), übrige verstaubt.
// o: { x, y, z, ry, parent } – Gruppe schaut nach +z. Rückgabe: { g, press(k), zeige(text, farbe), led(gr, rot), tick(dt), pos }
BED.keypad = function (o = {}) { const P = o.parent || scene, g = new THREE.Group(); g.position.set(o.x || 0, o.y || 0, o.z || 0); g.rotation.y = o.ry || 0; P.add(g);
  const W = .2, Hh = .31, D = .03, zF = D / 2 + .0035, mat = BED.mat, M = BED.mesh, kp = { g, keys: {}, t: 0 };
  M(g, BED.rr(W, Hh, D, .012, .003), mat('lack'), 0, 0, 0);                                                    // Gehäuse
  // Frontplatte: Edelstahl, Beschriftung eingraviert (Karte erzeugt, Gravur hell/dunkel versetzt)
  const PW = W - .018, PH = Hh - .018, plate = bed_cv(512, 800, (x, w, h) => { const b = bed_bürste(41, 512, 800, { base: [176, 178, 176] }); x.drawImage(b.map, 0, 0);
      const r = bed_rng(77); // abgegriffene Zone um die Tasten 0·1·3: blank poliert, übrige Platte verschmutzt
      for (let i = 0; i < 18; i++) { const cx = w * (.22 + r() * .56), cy = h * (.30 + r() * .55), rr = 18 + r() * 40, gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gg.addColorStop(0, 'rgba(34,26,18,.14)'); gg.addColorStop(1, 'rgba(34,26,18,0)'); x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      x.textAlign = 'center'; const gravur = (t, px, py, sz, st = '') => { x.font = `${st} ${sz}px "Arial Narrow", "Segoe UI", Arial, sans-serif`; x.fillStyle = 'rgba(255,255,255,.55)'; x.fillText(t, px + 1, py + 1.5); x.fillStyle = 'rgba(28,26,24,.88)'; x.fillText(t, px, py); };
      });
  const plateHeight = bed_cv(512, 800, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); });
  const stahl = mat('stahl').clone(); stahl.map = bed_tex(plate); stahl.normalMap = bed_tex(bed_normal(plateHeight, 3), false); stahl.roughnessMap = BED._t.stahl.rough; stahl.normalScale.set(.9, .9);
  M(g, BED.rr(PW, PH, .004, .006, .0012), stahl, 0, 0, D / 2 + .0005);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) BED.schraube(g, sx * (PW / 2 - .011), sy * (PH / 2 - .011), zF + .0008, .0045, sx * 3 + sy + 5);
  // Display: Fassung schwarz, Siebensegment unter Glas
  M(g, BED.rr(.148, .05, .005, .005, .001), mat('bakelit'), 0, .1, zF + .0015);
  kp.disp = BED.seg7(g, .134, .037, 0, .1, zF + .0042, 4);
  // Kontrollleuchten
  kp.ledGr = BED.led(g, -.052, .066, zF + .002, 0x33ff55, .0038); kp.ledRt = BED.led(g, .052, .066, zF + .002, 0xff2a1a, .0038); kp.ledGr.set(true); kp.ledRt.set(false);
  // Tasten
  const AT = bed_cv(512, 256, (x, w, h) => { const cw = w / 4, chh = h / 3; x.textAlign = 'center'; x.textBaseline = 'middle';
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].forEach((k, i) => { const cx = (i % 4 + .5) * cw, cy = (Math.floor(i / 4) + .5) * chh, worn = '013'.includes(k); x.font = `bold ${k === 'OK' || k === 'C' ? 50 : 66}px "Arial Narrow", Arial, sans-serif`;
        x.fillStyle = worn ? 'rgba(40,28,14,.5)' : k === 'C' ? 'rgba(240,130,110,.78)' : k === 'OK' ? 'rgba(150,235,170,.8)' : 'rgba(205,200,186,.52)'; x.fillText(k, cx, cy + 4); }); });
  const legM = new THREE.MeshStandardMaterial({ map: bed_tex(AT), transparent: true, roughness: .6, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const KW = .042, KH = .03, KD = .009, kg = BED.rr(KW, KH, KD, .005, .0022), fassM = mat('bakelit');
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].forEach((k, i) => { const col = i % 3, row = Math.floor(i / 3), kx = (col - 1) * .0535, ky = .038 - row * .0415 - .008, worn = '013'.includes(k);
    M(g, BED.rr(KW + .007, KH + .007, .002, .006, .0008), fassM, kx, ky, zF + .0006, { cast: false });                         // dunkle Fassung (Tiefe)
    const piv = new THREE.Group(); piv.position.set(kx, ky, zF + .0038); g.add(piv); const key = M(piv, kg, worn ? mat('gold') : k === 'C' || k === 'OK' ? mat('gummi') : mat('staub'), 0, 0, 0);
    const lg = new THREE.PlaneGeometry(.028, .0186), uv = lg.attributes.uv, c0 = (i % 4) / 4, r0 = 1 - (Math.floor(i / 4) + 1) / 3; for (let u = 0; u < uv.count; u++) uv.setXY(u, c0 + uv.getX(u) * .25, r0 + uv.getY(u) / 3);
    const leg = new THREE.Mesh(lg, legM); leg.position.z = KD / 2 + .0006; leg.userData.noCol = true; piv.add(leg);
    kp.keys[k] = { piv, z0: piv.position.z, t: 0 }; });
  // Kabelstutzen unten, Leitung läuft an der Wand nach rechts und verschwindet
  M(g, new THREE.CylinderGeometry(.009, .011, .016, 12), mat('stahl'), .05, -Hh / 2 - .006, 0, { cast: false });
  const cab = new THREE.CatmullRomCurve3([new THREE.Vector3(.05, -Hh / 2 - .012, 0), new THREE.Vector3(.05, -Hh / 2 - .06, -.002), new THREE.Vector3(.07, -Hh / 2 - .11, -.009), new THREE.Vector3(.13, -Hh / 2 - .13, -.013), new THREE.Vector3(.2, -Hh / 2 - .13, -.02)]);
  M(g, new THREE.TubeGeometry(cab, 20, .0055, 8), mat('kabel'), 0, 0, 0, { cast: false });
  kp.pulse = 0;
  kp.press = function (k) { const K = kp.keys[k]; if (K) K.t = 1; };
  kp.zeige = function (t, farbe, hell) { kp.disp.zeige(t, farbe, hell); };
  kp.led = function (gr, rt) { kp.ledGr.set(!!gr); kp.ledRt.set(!!rt); };
  kp.tick = function (dt) { if (kp.hold && kp.keys[kp.hold]) kp.keys[kp.hold].t = .6; for (const k in kp.keys) { const K = kp.keys[k]; if (K.t > 0 && kp.hold !== k) { K.t = Math.max(0, K.t - dt / .16); } K.piv.position.z = K.z0 - (K.t > 0 ? (K.t > .5 ? 1 : K.t * 2) * .0034 : 0); } };
  return kp; };

// Kapitel 1 einbinden: das flache Kästchen keypadMesh bleibt als unsichtbare Klickfläche (Logik, Leuchtfarbe der Szenen kommen weiter von ihm),
// das neue Tastenfeld folgt Eingabe, Fehlversuchen und dem roten Leuchten. Echte Klick-Aufnahmen statt Sinuston.
function bed_kapitel1() { if (BED.k1 || typeof keypadMesh === 'undefined' || typeof kapitel1_kpPress !== 'function') return;
  const km = keypadMesh, p = km.position, kp = BED.k1 = BED.keypad({ x: p.x, y: p.y, z: p.z + .0, ry: 0 });
  km.material.visible = false; km.castShadow = false; km.userData.hlObj = kp.g; km.userData.noCol = km.userData.noCol;
  km.userData.label = () => state.cellarOpen ? 'In den Keller' : 'Code eingeben';
  const orig = kpPress; kp.msg = null; kp.msgT = 0; kp.idle = 0;
  kpPress = function (k) { const busy = performance.now() < kpBusy || ui.overlay !== 'keypad', v0 = kpValue; let ok = null; const ob = Audio.beep; Audio.beep = a => { ok = a; };
    try { orig(k); } finally { Audio.beep = ob; }
    if (busy) return; const at = { x: p.x, y: p.y, z: p.z };
    if (k === 'OK') { if (ok === true) { kp.msg = ['OPEn', 0x6dff8a]; kp.msgT = 4; kp.led(true, false); BED.klick('taste', at); } else { kp.msg = ['Err ', 0xff4a3a]; kp.msgT = 1.3; BED.klick('falsch', at); kp.led(false, true); } kp.press('OK'); }
    else if (k === 'C') { kp.press('C'); BED.klick('loeschen', at); }
    else if (kpValue !== v0) { kp.press(k); BED.klick('taste', at); }
    else { kp.press(k); BED.klick('gesperrt', at); } };
  WORLD_TICK.push((dt) => { if (!BED.k1) return; kp.tick(dt); const em = km.material.emissive, rot = em.r > .6 && em.g < .4, offen = state.cellarOpen;
    if (kp.msgT > 0) { kp.msgT -= dt; if (kp.msgT <= 0) { kp.msg = null; kp.led(true, false); } }
    let t, f = 0x6dff8a, hell = 1;
    if (rot) { t = (Math.floor(performance.now() / 380) & 1) ? 'Err ' : '----'; f = 0xff4a3a; kp.led(false, true); }
    else if (kp.msg) { t = kp.msg[0]; f = kp.msg[1]; }
    else if (ui.overlay === 'keypad') { t = kpValue.padEnd(4, '-'); kp.idle = 0; }
    else { kp.idle += dt; t = kp.idle > 4 || !kpValue ? '----' : kpValue.padEnd(4, '-'); hell = kp.idle > 4 ? .55 : 1; if (offen) { t = 'OPEn'; } }
    kp.zeige(t, f, hell); }); }
WORLD_TICK.push(() => { if (!BED.k1 && !BED._k1try && typeof keypadMesh !== 'undefined' && typeof camera !== 'undefined' && camera.position.distanceTo(keypadMesh.position) < 16) { BED._k1try = true; try { bed_kapitel1(); } catch (e) { console.warn('Bedienung: Tastenfeld', e); } } });

// Tastenfeld-Tafel im Eingabefenster: gleiche Edelstahl-/Gummi-Optik wie am Gerät (Klassen worn/dust der Rätselhilfe bleiben)
{ const st = document.createElement('style'); st.id = 'bedcss'; st.textContent = `
  #keypad .box { background: linear-gradient(100deg, rgba(255,255,255,.06), rgba(255,255,255,0) 30%, rgba(0,0,0,.12) 70%), repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, rgba(0,0,0,.035) 1px 2px), linear-gradient(180deg, #8d9090, #6b6e6e 55%, #5d6060) !important;
    border-radius: 14px !important; border: 0 !important; box-shadow: inset 0 0 0 2px rgba(255,255,255,.18), inset 0 0 0 5px #3a3d3d, inset 0 0 40px rgba(0,0,0,.35), 0 40px 100px rgba(0,0,0,.9), 0 0 0 1px #000 !important; padding: 34px 34px 26px !important; position: relative; }
  #keypad .box::before { content: 'ZUTRITT'; display: block; position: absolute; top: 10px; left: 0; right: 0; text-align: center; font: bold 13px "Arial Narrow", Arial, sans-serif; letter-spacing: .5em; color: #25282a; text-shadow: 0 1px 0 rgba(255,255,255,.5); }
  #keypad .box::after { content: ''; position: absolute; inset: 8px; border-radius: 10px; pointer-events: none; background: radial-gradient(circle at 12px 12px, #2b2d2d 3px, #7e8181 4px, transparent 5px) top left / 100% 100% no-repeat, radial-gradient(circle at calc(100% - 12px) 12px, #2b2d2d 3px, #7e8181 4px, transparent 5px), radial-gradient(circle at 12px calc(100% - 12px), #2b2d2d 3px, #7e8181 4px, transparent 5px), radial-gradient(circle at calc(100% - 12px) calc(100% - 12px), #2b2d2d 3px, #7e8181 4px, transparent 5px); }
  #kpDisplay { font: 700 40px "Share Tech Mono", "Consolas", "Courier New", monospace !important; border-radius: 4px !important; box-shadow: inset 0 0 22px rgba(0,0,0,.95), 0 0 0 3px #0c0c0c, 0 0 0 4px rgba(255,255,255,.2) !important; }
  #keypad button { border-radius: 9px !important; width: 66px !important; height: 52px !important; font: 700 24px "Arial Narrow", Arial, sans-serif !important; transition: transform .06s, box-shadow .06s;
    background: linear-gradient(180deg, #3a3a38, #1e1e1d 80%) !important; color: #cfcab8 !important; box-shadow: inset 0 1px 1px rgba(255,255,255,.22), inset 0 -3px 5px rgba(0,0,0,.6), 0 0 0 3px #101010, 0 4px 0 #0a0a0a, 0 6px 8px rgba(0,0,0,.55) !important; }
  #keypad button:active { transform: translateY(3px); box-shadow: inset 0 1px 1px rgba(255,255,255,.12), inset 0 -2px 4px rgba(0,0,0,.6), 0 0 0 3px #101010, 0 1px 0 #0a0a0a, 0 2px 3px rgba(0,0,0,.5) !important; }
  #keypad button:hover { filter: brightness(1.18); }
  #keypad button.dust { color: rgba(190,184,168,.55) !important; background: linear-gradient(180deg, #3b3a36, #24231f 80%) !important; filter: saturate(.5); }
  #keypad button.worn { color: rgba(40,28,14,.62) !important; text-shadow: none !important; background: linear-gradient(180deg, #d4b077, #a07a44 55%, #6e5230) !important; }
  #keypad button:nth-child(10) { color: #ff9a88 !important; } #keypad button:nth-child(12) { color: #9dffb4 !important; }
  #keypad .grid { grid-template-columns: repeat(3, 72px) !important; gap: 14px !important; }
  #keypad .hint { color: #cfc8b4; } `; document.head.appendChild(st); }

// ================================================================= SICHERUNGSKASTEN (Kap. 2, Amt)
// Ergänzt Basis-Kasten (fusePanel/fuseCover/fuseLeds): Rahmen mit Schrauben, Klappe mit Griff/Scharnieren/Schild, sechs Kippautomaten, die dem Zustand ch2.fuses folgen.
// Vorderseite des Kastens zeigt nach −z (Raum), Leuchten der Basis liegen bei Z+7,73.
BED.sicherung = function () { if (BED.sic || typeof fusePanel === 'undefined' || typeof fuseCover === 'undefined') return; const mat = BED.mat, M = BED.mesh, fp = fusePanel.position, S = BED.sic = { hebel: [] };
  const root = new THREE.Group(); root.position.set(fp.x, fp.y, fp.z - .06); root.rotation.y = Math.PI; scene.add(root); S.root = root; // lokal: +z = in den Raum (−z der Welt), x gespiegelt
  fusePanel.material = mat('lackGross'); fuseCover.material = mat('lackGross');
  if (typeof fuseLeds !== 'undefined') { const lg = new THREE.CylinderGeometry(.034, .036, .02, 20); lg.rotateX(Math.PI / 2); fuseLeds.forEach(l => { l.geometry = lg; }); } // Kontrollleuchten rund statt eckig
  // Innenleben (nur bei geöffneter Klappe sichtbar): schwarze Montageplatte, Schienen, sechs Kippautomaten unter den Kontrollleuchten der Basis
  M(root, BED.rr(1.3, 1.1, .006, .02, .002), mat('bakelit'), 0, 0, .003, { cast: false });
  for (const y of [.5, -.5]) M(root, BED.rr(1.3, .05, .014, .008, .002), mat('stahl'), 0, y, .007, { cast: false });
  const kgeo = BED.rr(.11, .24, .024, .008, .003), hgeo = new THREE.BoxGeometry(.036, .09, .018);
  for (let i = 0; i < 6; i++) { const x = .5 - i * .2;
    M(root, BED.rr(.14, .3, .004, .008, .001), mat('stahl'), x, -.1, .008, { cast: false }); M(root, kgeo, mat('bakelit'), x, -.1, .02);
    M(root, new THREE.BoxGeometry(.05, .006, .004), mat('bakelit'), x, -.1, .033, { cast: false });                  // Schlitz
    const pv = new THREE.Group(); pv.position.set(x, -.1, .03); root.add(pv); M(pv, hgeo, mat('rot'), 0, 0, .006); S.hebel.push({ pv }); }
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) BED.schraube(root, sx * .66, sy * .53, .01, .012, sx + sy * 2 + 9);
  // Klappe (Außenseite = −z der Welt): Warnschild, Griff, Scharniere – als Kinder von fuseCover, lokal gedreht (+z = Raumseite)
  const cv = new THREE.Group(); cv.position.set(0, 0, -.0155); cv.rotation.y = Math.PI; fuseCover.add(cv); S.cv = cv; // lokal x gespiegelt: Griff rechts = lokal −x
  M(cv, BED.rr(.05, .14, .026, .02, .004), mat('stahl'), -.6, -.1, .02);                                           // Griff (rechts)
  for (const y of [.4, -.4]) M(cv, new THREE.CylinderGeometry(.014, .014, .12, 12), mat('stahl'), .69, y, -.004);  // Scharniere (links)
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) BED.schraube(cv, sx * .64, sy * .54, .0028, .011, sx * 2 + sy + 31);
  fuseCover.userData.label = () => (typeof ch2 !== 'undefined' && ch2.coverOpen) ? 'Sicherungen schalten' : 'Sicherungskasten öffnen'; fusePanel.userData.label = fuseCover.userData.label;
  S.tick = (dt) => { if (typeof ch2 === 'undefined' || !ch2.fuses) return; root.visible = !!ch2.coverOpen; S.hebel.forEach((H, i) => { const an = ch2.fuses[i], ziel = an ? -.45 : .45; H.pv.rotation.x += (ziel - H.pv.rotation.x) * Math.min(1, dt * 14); if (H.last !== an) { if (H.last !== undefined && root.visible) BED.klick('kipp', { x: fp.x, y: fp.y, z: fp.z }); H.last = an; } }); };
  return S; };
WORLD_TICK.push((dt) => { if (BED.sic) return BED.sic.tick(dt); if (!BED._sicTry && typeof fusePanel !== 'undefined' && typeof camera !== 'undefined' && camera.position.distanceTo(fusePanel.position) < 22) { BED._sicTry = true; try { BED.sicherung(); } catch (e) { console.warn('Bedienung: Sicherungskasten', e); } } });

// ================================================================= FUNKKASTEN (Kap. 3, Stadtwerke-Umspannhäuschen)
// Ergänzt Basis-Kasten radioBox (.6 × 1.1 × .4 bei 5,4 | −6,6, Front nach +z): Skala mit Bernsteinlicht, zwei Drehknöpfe, Kippschalter, Lautsprecher, Schilder, Griff, Antenne.
BED.funk = function () { if (BED.funkB || typeof radioBox === 'undefined') return; const mat = BED.mat, M = BED.mesh, p = radioBox.position, S = BED.funkB = {}, root = new THREE.Group(); root.position.set(p.x, p.y - .55, p.z + .2 + .0); scene.add(root); // y = Boden, z = Vorderseite
  radioBox.material = mat('lackGross');
  scene.traverse(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && Math.abs(o.position.x - p.x) < .05 && Math.abs(o.position.y - .75) < .05 && Math.abs(o.position.z - (p.z + .21)) < .03) o.visible = false; }); // aufgeklebtes Amtsschild der Basis weg
  // Skala (Glas, Bernstein beleuchtet), Frequenzstriche, Zeiger
  const sk = BED.label(root, .36, .1, -.08, .93, .0016, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#6a3c10'); g.addColorStop(.5, '#e0a24a'); g.addColorStop(1, '#6a3c10'); c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#2a1608'; c.fillStyle = '#2a1608'; c.textAlign = 'center'; c.font = 'bold 22px "Arial Narrow", Arial'; for (let i = 0; i <= 40; i++) { const x = 20 + i * (w - 40) / 40, l = i % 5 ? 14 : 28; c.lineWidth = i % 5 ? 2 : 3; c.beginPath(); c.moveTo(x, h * .62); c.lineTo(x, h * .62 - l); c.stroke(); }
      }, { px: 512, rough: .25 }); sk.material.emissive = new THREE.Color(0xff9a30); sk.material.emissiveMap = sk.material.map; sk.material.emissiveIntensity = .55; S.skala = sk;
  M(root, BED.rr(.4, .14, .02, .012, .003), mat('bakelit'), -.08, .93, -.0085, { cast: false }); const gl = new THREE.Mesh(new THREE.PlaneGeometry(.36, .1), mat('glas')); gl.position.set(-.08, .93, .0036); gl.userData.noCol = true; root.add(gl);
  M(root, new THREE.BoxGeometry(.002, .11, .002), mat('rot'), -.15, .93, .004, { cast: false }); // Zeiger bei ~31,1
  // Knöpfe: Bakelit mit Riffelung, Messing-Skalenring
  const kn = (x, y, r, txt) => { M(root, new THREE.CylinderGeometry(r * 1.45, r * 1.5, .004, 28), mat('messing'), x, y, .002, { rx: Math.PI / 2, cast: false });
    const k = M(root, new THREE.CylinderGeometry(r, r * 1.08, .04, 28), mat('bakelit'), x, y, .022, { rx: Math.PI / 2 }); k.userData.dreh = true; for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; M(k, new THREE.BoxGeometry(r * .1, .036, r * .12), mat('bakelit'), Math.cos(a) * r * 1.02, 0, Math.sin(a) * r * 1.02, { cast: false }); }
    M(k, new THREE.BoxGeometry(r * .12, .003, r * .7), mat('messing'), 0, .021, r * .45, { cast: false }); // Markierung
    return k; };
  S.k1 = kn(-.14, .55, .05, 'ABSTIMMUNG'); S.k2 = kn(.1, .55, .035, 'LAUTSTÄRKE');
  // Kippschalter-Reihe
  for (let i = 0; i < 3; i++) { const x = -.14 + i * .1, y = .36; M(root, new THREE.CylinderGeometry(.016, .016, .006, 14), mat('stahl'), x, y, .003, { rx: Math.PI / 2, cast: false }); const h = M(root, new THREE.CylinderGeometry(.005, .007, .045, 10), mat('stahl'), x, y + .012, .02, { rz: .0, rx: i === 1 ? -.45 : .45 });
    M(h, new THREE.SphereGeometry(.0075, 10, 8), mat('stahl'), 0, .0225, 0, { cast: false }); }
  // Lautsprechergitter unten
  BED.label(root, .42, .16, 0, .13, .0017, (c, w, h) => { c.fillStyle = '#0c0c0b'; c.fillRect(0, 0, w, h); c.fillStyle = '#6c6e68'; for (let y = 6; y < h - 6; y += 12) for (let x = 6 + ((y / 12 | 0) % 2) * 6; x < w - 6; x += 12) { c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); } c.strokeStyle = '#3a3c38'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4); }, { px: 256, rough: .6, metal: .3 });
  // Griff, Nietreihe, Antenne
  for (let i = 0; i < 9; i++) { BED.schraube(root, -.26 + i * .065, 1.07 - .02, .0034, .006, i + 40); BED.schraube(root, -.26 + i * .065, .045, .0034, .006, i + 80); }
  const an = M(root, new THREE.CylinderGeometry(.004, .006, .6, 8), mat('stahl'), .22, 1.1 + .3, -.12); S.an = an; M(root, new THREE.CylinderGeometry(.018, .018, .03, 12), mat('bakelit'), .22, 1.1 + .01, -.12, { cast: false });
  // Beschriftung am Kasten: E-Hinweise
  radioBox.userData.label = () => (typeof ch3 !== 'undefined' && ch3.radio) ? 'Funkgerät (Rauschen)' : 'Funkgerät abstimmen'; radioBox.userData.hlObj = root;
  S.root = root; S.t = 0; S.tick = (dt) => { S.t += dt; const tun = (typeof ui !== 'undefined' && ui.overlay === 'puzzle'); S.k1.rotation.y += ((tun ? Math.sin(S.t * .8) * .8 : 0) - S.k1.rotation.y) * Math.min(1, dt * 3); S.skala.material.emissiveIntensity = (tun ? .9 : .55) + Math.sin(S.t * 31) * .02; }; return S; };
WORLD_TICK.push((dt) => { if (BED.funkB) return BED.funkB.tick(dt); if (!BED._funkTry && typeof radioBox !== 'undefined' && typeof camera !== 'undefined' && camera.position.distanceTo(radioBox.position) < 24) { BED._funkTry = true; try { BED.funk(); } catch (e) { console.warn('Bedienung: Funkkasten', e); } } });

window.__bed = BED; // Testzugriff (Release entfernt window.__*)
