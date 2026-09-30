// =====================================================================  WELT-MODUL · weiss (Paket W2-P7) – Kapitel 3 · Das Weiße & Ende C
// Texte wortgleich aus story_final.md, „Produktionsplan Kapitel 1–6“, PK-C K3-6 … K3-10 (T7 in PK-G).
//   Raum 1: Schrank an der Nordwand, ein Spalt offen – wer näher als 3 m ist, hört ein Kind atmen; sieht Luke hinein, ist es still (leer).
//   Raum 2: hildeTalks als Auswahl, room2Solved ohne Geständnis.
//   Raum 3, Teil 1 „Die Nacht von 1312“: bereifte Wiese, Birken (Scan w_birke/lod.glb), stehende Flammen (Sprites), sieben Nachhall-Kinder mit
//     lantern2, Nachhall-Klon des Ritters, Spuren (Decals) · fünf Stellen · „Was lügt?“ · Geständnis · Lore c3_1312.
//   Raum 3, Teil 2 „Der Hohe Abgrund“: Weißblende, Stühle, flackernde Lucy, die große Papierlaterne (nur Emissive), acht Schläge (je eine Handlung),
//     Blitze durch Lukes Augen, Helm-Szene von hinten mit Spiegelung im Visier, Zusatzzeilen, Justins Angebot · Wahl A/B/C · Ende C.
// Technik: alles beim Laden angelegt und versteckt; keine Lichter (nur Intensität/Farbe der vorhandenen Raumlichter von Raum 3); Nebel/Himmel werden
// gesichert und zurückgesetzt; keine Allokationen im Takt.
const weiss_S = { ok: false, ghostU: { value: 3.2 }, phase: null, seen: new Set(), tries: 0, asked: new Set(), bw: null, fast: false, envK: 0, flk: 0, cnt: 0,
  miraFace: null, helmHeld: false, kleineT: 0, schrankLook: 0, atemT: 0, log: [] };
const WEISS_HINTS = ['geh_versteck', 'echo_kanal_laterne', 'nord_suehnekreuz', 'c3_hilde_versteck', 'z7_gruendung'];
const weiss_has = k => story.lore.some(l => l.key === k);
// Versteck-Hinweise für Ende C: Raum 3 (c3_1312) zählt automatisch, dazu mindestens zwei weitere
function weiss_hinweise() { const other = WEISS_HINTS.filter(weiss_has), n = (weiss_has('c3_1312') ? 1 : 0) + other.length; return { n, other, c: weiss_has('c3_1312') && n >= 3 }; }
const _wv = new THREE.Vector3(), _wd = new THREE.Vector3(), _wq = new THREE.Quaternion(), _wm = new THREE.Matrix4();

// ---------------------------------------------------------------- Klang: Atem, Glocke über dem Weißen
function weiss_atem(v, x, y, z) { const A = Audio; if (!A.ctx) return; const c = A.ctx, t = c.currentTime, n = A.noise(false), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 640; bp.Q.value = .9;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .9); g.gain.linearRampToValueAtTime(v * .12, t + 1.25); g.gain.linearRampToValueAtTime(v * .75, t + 1.7); g.gain.linearRampToValueAtTime(0, t + 2.7);
  n.connect(bp); bp.connect(g); g.connect(A.at(x, y, z, 1.1)); n.stop(t + 2.9); }
// Einzelner Glockenschlag (leben_bellStrike), hier aus dem Weiß über der Senke statt vom Kirchberg
function weiss_glocke(v = .8) { if (typeof leben_bellStrike !== 'function' || typeof leben_CHAPEL === 'undefined') return; const C = leben_CHAPEL, o = [C.x, C.y, C.z];
  C.x = X3 + 42; C.y = 26; C.z = Z3; try { leben_bellStrike(v, false); } finally { C.x = o[0]; C.y = o[1]; C.z = o[2]; } }
async function weiss_kino(id) { if (typeof kino_play === 'function') { try { await kino_play(id); } catch (e) { console.error('Kino ' + id, e); } } }

// ---------------------------------------------------------------- Nachhall-Material: wie figuren_ghostMat, aber mit eigener Stärke (nicht an Echos gebunden)
function weiss_ghostMat(src) { const M = weiss_S.gm || (weiss_S.gm = new Map()); if (M.has(src)) return M.get(src);
  const b = figuren_ghostMat(src), m = b.clone(); m.onBeforeCompile = sh => { b.onBeforeCompile(sh); sh.uniforms.uGhost = weiss_S.ghostU; }; m.customProgramCacheKey = () => 'figuren_ghost2'; M.set(src, m); return m; }
function weiss_ghostify(o) { o.traverse(m => { if (m.isMesh) { m.material = Array.isArray(m.material) ? m.material.map(weiss_ghostMat) : weiss_ghostMat(m.material); m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; } }); }

// ---------------------------------------------------------------- Texturen (Canvas): Flamme, Schein, Reif, Abdrücke, Tau, Laternenpapier, Spiegelung, Spalt
function weiss_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
const WEISS_TEX = {
  flame: () => weiss_cv(64, 128, (x, w, h) => { x.save(); x.translate(w / 2, h * .74); x.scale(.36, 1); const g = x.createRadialGradient(0, -18, 1, 0, -22, 62); g.addColorStop(0, 'rgba(255,252,236,1)'); g.addColorStop(.22, 'rgba(255,222,150,.95)'); g.addColorStop(.52, 'rgba(255,146,52,.5)'); g.addColorStop(1, 'rgba(200,70,12,0)');
    x.fillStyle = g; x.beginPath(); x.ellipse(0, -26, 70, 66, 0, 0, 7); x.fill(); x.restore(); const b = x.createRadialGradient(w / 2, h * .8, 0, w / 2, h * .8, 9); b.addColorStop(0, 'rgba(140,170,255,.5)'); b.addColorStop(1, 'rgba(140,170,255,0)'); x.fillStyle = b; x.fillRect(0, 0, w, h); }),
  glow: () => weiss_cv(64, 64, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.3, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }),
  frost: () => weiss_cv(512, 512, (x, w) => { x.clearRect(0, 0, w, w); for (let i = 0; i < 9000; i++) { const px = Math.random() * w, py = Math.random() * w, r = Math.random() * 2.2 + .4; x.fillStyle = `rgba(255,255,255,${(Math.random() * .5 + .25).toFixed(2)})`; x.fillRect(px, py, r, r * (Math.random() < .5 ? 1 : 3)); }
    for (let i = 0; i < 60; i++) { const cx = Math.random() * w, cy = Math.random() * w, g = x.createRadialGradient(cx, cy, 0, cx, cy, 90); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); } }),
  boot: () => weiss_cv(64, 160, (x) => { x.fillStyle = 'rgba(40,52,44,.9)'; x.beginPath(); x.ellipse(32, 46, 24, 42, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(32, 130, 19, 24, 0, 0, 7); x.fill();
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,.55)'; for (let y = 14; y < 84; y += 9) x.fillRect(12, y, 40, 3); for (let y = 114; y < 150; y += 8) x.fillRect(16, y, 32, 3); }),
  foot: () => weiss_cv(64, 128, (x) => { x.fillStyle = 'rgba(40,52,44,.85)'; x.beginPath(); x.ellipse(33, 58, 16, 26, .08, 0, 7); x.fill(); x.beginPath(); x.ellipse(30, 100, 12, 17, 0, 0, 7); x.fill(); x.fillRect(22, 70, 18, 24);
    x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.ellipse(44, 84, 7, 14, 0, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; [[22, 26, 6.5], [32, 22, 5], [40, 24, 4.3], [47, 28, 3.8], [52, 34, 3.4]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); }); }),
  hoof: () => weiss_cv(96, 96, (x, w) => { x.strokeStyle = 'rgba(40,52,44,.92)'; x.lineWidth = 13; x.beginPath(); x.arc(w / 2, w * .44, 30, Math.PI * .92, Math.PI * .08, false); x.stroke(); x.fillStyle = 'rgba(40,52,44,.35)'; x.beginPath(); x.arc(w / 2, w * .46, 24, 0, 7); x.fill();
    x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 6; i++) { const a = Math.PI * (.95 + i * .22); x.beginPath(); x.arc(w / 2 + Math.cos(a) * 30, w * .44 + Math.sin(a) * 30, 2.2, 0, 7); x.fill(); } }),
  tau: () => weiss_cv(256, 256, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, w * .3, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.18, 'rgba(255,255,255,.95)'); g.addColorStop(.55, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }),
  spalt: () => weiss_cv(16, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(0,0,0,.96)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 4, w, h - 8); }),
  // Papier der großen Laterne: Kinderzeichnungen wie an der Wand in Hildes Keller (Buntstift), Rippen quer
  papier: () => weiss_cv(1024, 512, (x, w, h) => { x.fillStyle = '#f2e4c6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(150,110,60,${(Math.random() * .08).toFixed(3)})`; x.fillRect(Math.random() * w, Math.random() * h, Math.random() * 30, 1); }
    const cr = (col, wd = 4) => { x.strokeStyle = col; x.lineWidth = wd; x.lineCap = 'round'; x.lineJoin = 'round'; }; const jit = v => v + (Math.random() - .5) * 2.4;
    const kid = (cx, cy, s, col) => { cr(col, 3.5); x.beginPath(); x.arc(cx, cy - 44 * s, 10 * s, 0, 7); x.moveTo(jit(cx), cy - 34 * s); x.lineTo(jit(cx), cy); x.lineTo(cx - 10 * s, cy + 26 * s); x.moveTo(cx, cy); x.lineTo(cx + 10 * s, cy + 26 * s); x.moveTo(cx - 14 * s, cy - 22 * s); x.lineTo(cx + 16 * s, cy - 20 * s); x.stroke();
      cr('#c87818', 3); x.beginPath(); x.moveTo(cx + 16 * s, cy - 20 * s); x.lineTo(cx + 16 * s, cy - 6 * s); x.stroke(); x.fillStyle = 'rgba(230,150,30,.8)'; x.beginPath(); x.arc(cx + 16 * s, cy, 7 * s, 0, 7); x.fill(); };
    for (let rep = 0; rep < 2; rep++) { const o = rep * w / 2;
      for (let i = 0; i < 7; i++) kid(o + 60 + i * 52, 330 + (i % 2) * 8, 1, ['#b02020', '#2040b0', '#208030', '#202020', '#8030a0', '#b05010', '#2060a0'][i]);
      cr('#303030', 6); x.beginPath(); x.moveTo(o + 440, 200); x.lineTo(o + 440, 380); x.moveTo(o + 400, 260); x.lineTo(o + 480, 260); x.moveTo(o + 440, 380); x.lineTo(o + 415, 430); x.moveTo(o + 440, 380); x.lineTo(o + 465, 430); x.stroke(); x.beginPath(); x.arc(o + 440, 176, 22, 0, 7); x.stroke();
      cr('#a01818', 5); x.beginPath(); x.ellipse(o + 250, 150, 110, 30, 0, 0, 7); x.stroke(); cr('#d8d8e8', 10); for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(o + 205 + k * 22, 178); x.lineTo(o + 180 + k * 34, 290); x.stroke(); }
      x.fillStyle = '#a01818'; x.font = 'bold 34px Caveat, cursive'; x.fillText(rep ? 'wir 8' : 'DAS LICHT', o + 170, 90); }
    x.fillStyle = 'rgba(90,60,30,.55)'; for (let i = 1; i < 16; i++) x.fillRect(0, i * h / 16, w, 2); }),
  // Spiegelung im blanken Visier: weißer Raum, darin ein Gesicht mit braunen Augen (verzerrt, verblasst)
  visier: () => weiss_cv(256, 160, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#eef0f2'); g.addColorStop(1, '#c4c9cf'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.save(); x.translate(w / 2, h * .52); x.scale(1.25, .92); x.filter = 'blur(1.4px)'; x.fillStyle = '#4a4038'; x.beginPath(); x.ellipse(0, 70, 78, 38, 0, 0, 7); x.fill();
    const s = x.createRadialGradient(-6, -8, 4, 0, 0, 44); s.addColorStop(0, '#caa088'); s.addColorStop(1, '#7a5a48'); x.fillStyle = s; x.beginPath(); x.ellipse(0, 0, 30, 40, 0, 0, 7); x.fill();
    x.fillStyle = '#2e241e'; x.beginPath(); x.ellipse(0, -30, 33, 18, 0, Math.PI, 0); x.fill(); x.filter = 'none';
    for (const ex of [-12, 12]) { x.fillStyle = '#d8d0c6'; x.beginPath(); x.ellipse(ex, -4, 6.5, 3, 0, 0, 7); x.fill(); x.fillStyle = '#6a3e1e'; x.beginPath(); x.arc(ex, -4, 3, 0, 7); x.fill(); x.fillStyle = '#140c08'; x.beginPath(); x.arc(ex, -4, 1.3, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(ex + .8, -5.6, 1, 1); }
    x.restore(); x.globalCompositeOperation = 'lighter'; const st = x.createLinearGradient(0, 0, w, h); st.addColorStop(.35, 'rgba(255,255,255,0)'); st.addColorStop(.45, 'rgba(255,255,255,.35)'); st.addColorStop(.55, 'rgba(255,255,255,0)'); x.fillStyle = st; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-in'; const m = x.createRadialGradient(w / 2, h / 2, h * .25, w / 2, h / 2, w * .5); m.addColorStop(0, 'rgba(0,0,0,.9)'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, w, h); }),
};
function weiss_sprite(t, color, sx, sy, fog = false, op = 1) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog, opacity: op })); s.scale.set(sx, sy, 1); s.userData.noCol = true; return s; }
function weiss_decalMat(canvas, o = {}) { return new THREE.MeshStandardMaterial({ map: tex(canvas, true), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, roughness: o.rough ?? .95, color: o.color ?? 0xffffff, side: THREE.DoubleSide, opacity: o.op ?? 1 }); }
// Abdrücke als Instanzen einer flachen Fläche: pts = [[x, z, Drehung, Spiegel]]
function weiss_prints(mat, w, h, pts, y) { const g = new THREE.PlaneGeometry(w, h); g.rotateX(-Math.PI / 2); const im = new THREE.InstancedMesh(g, mat, pts.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  pts.forEach(([x, z, r, mir], i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r); s.set(mir ? -1 : 1, 1, 1); p.set(x, y + (i % 7) * .0003, z); im.setMatrixAt(i, m.compose(p, q, s)); }); im.computeBoundingSphere(); im.receiveShadow = true; im.userData.noCull = true; im.userData.noCol = true; return im; }
// Spur von A nach B (Schrittweite st, seitlicher Versatz off); Drehung: Zehen zeigen in Laufrichtung (−z der Textur = vorn)
function weiss_trail(ax, az, bx, bz, st, off) { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, r = Math.atan2(-ux, -uz), out = []; for (let d = 0, i = 0; d <= L; d += st, i++) { const s = i % 2 ? 1 : -1; out.push([ax + ux * d - uz * off * s, az + uz * d + ux * off * s, r + (Math.random() - .5) * .12, s > 0]); } return out; }

// ---------------------------------------------------------------- Aufbau beim Laden (alles versteckt)
WORLD_MODS.push(['Das Weiße · Raum 3 und Ende C', async () => {
  const S = weiss_S, CX = X3 + 42, CZ = Z3, V = THREE.Vector3, T = WEISS_TEX, IK = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S : null;
  const flameT = tex(T.flame(), true), glowT = tex(T.glow(), true);
  S.r3L = c3Lights.filter(l => l.position.x > X3 + 32); S.r3L.forEach(l => { l.userData.i0 = l.intensity; l.userData.c0 = l.color.getHex(); });
  S.ceil = []; scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.parameters && Math.abs(o.position.x - CX) < .01 && Math.abs(o.position.z - CZ) < .01 && Math.abs(o.position.y - (C3.h + .1)) < .01) S.ceil.push(o); });

  // ---- Raum 1: Spalt am Schrank (Innenraum-Modul setzt den Schrank), Stelle zum Öffnen
  if (IK && IK.schrank) { const b = IK.schrank, x = (b.min.x + b.max.x) / 2, z = b.min.z, h = Math.min(.8, (b.max.y - b.min.y) * .36);
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(.04, h), weiss_decalMat(T.spalt(), { rough: 1 })); sp.position.set(x + .004, .12 + h / 2, z - .006); sp.rotation.y = Math.PI; scene.add(sp);
    S.schrank = { x, z, y: .12 + h / 2 };
    const hit = box(Math.min(1.1, b.max.x - b.min.x), h + .1, .12, x, .12 + h / 2, z - .02, hidden, { cast: false });
    interact(hit, () => ch3.schrank ? 'Der Schrank (leer)' : 'Den Schrank öffnen', () => weiss_schrank()); }

  // ---- Raum 3, Teil 1: die Nacht von 1312
  const N = new THREE.Group(); N.visible = false; N.userData.noCol = true; scene.add(N); S.night = N;
  { const gm = msSurfMat('lawn1', { tint: 0x9aa89e, rep: 9 }); const g = new THREE.Mesh(new THREE.PlaneGeometry(19.4, 19.4), gm); g.rotation.x = -Math.PI / 2; g.position.set(CX, .022, CZ); g.receiveShadow = true; N.add(g);
    const ft = tex(T.frost(), true); ft.repeat.set(5, 5); const fm = new THREE.MeshStandardMaterial({ map: ft, emissiveMap: ft, emissive: 0x3a4658, transparent: true, depthWrite: false, color: 0xe8f0ff, roughness: .45, polygonOffset: true, polygonOffsetFactor: -2 });
    const f = new THREE.Mesh(new THREE.PlaneGeometry(19.4, 19.4), fm); f.rotation.x = -Math.PI / 2; f.position.set(CX, .026, CZ); f.receiveShadow = true; N.add(f); }
  // bereifte Grasbüschel (Scan wildgrass1)
  try { const gr = await msBake('wildgrass1'); const L = []; for (let i = 0; i < 170; i++) { let x, z, k = 0; do { x = CX + rand(-9.3, 9.3); z = CZ + rand(-9.3, 9.3); k++; } while (Math.hypot(x - CX, z - CZ) < 3.4 && k < 20); L.push(msM4(x, 0, z, rand(0, 6.28), rand(.45, .8))); }
    gr.forEach(p => { const mt = [].concat(p.mat).map(m => { const c = m.clone(); c.color = new THREE.Color(0xc9d6de); return c; }); const im = new THREE.InstancedMesh(p.geo, mt.length === 1 ? mt[0] : mt, L.length); L.forEach((M, i) => im.setMatrixAt(i, M)); im.receiveShadow = true; im.computeBoundingSphere(); im.userData.noCull = true; N.add(im); });
  } catch (e) { console.warn('weiss Gras', e); }
  // Birken: Stämme aus dem Scan (bis in die Decke – die Kronen verschwinden im Weiß)
  S.birchCols = [];
  try { const src = await msModel('w_birke', 'lod.glb'); let mesh = null; src.traverse(o => { if (!mesh && o.isMesh) mesh = o; });
    const P = [[-7, 8.2], [-8.4, -8.6], [-2.2, 8.8], [2.6, 7.6], [6.8, 8.6], [8.6, 4.6], [8.9, -7.9], [3.8, -8.3], [-1.6, -8.9], [5.6, -5.2], [-5.5, -6.8]];
    const bm = mesh.material.clone(); bm.emissive = new THREE.Color(0x2a3240); bm.emissiveMap = bm.map; const im = new THREE.InstancedMesh(mesh.geometry, bm, P.length); im.castShadow = true; im.receiveShadow = true;
    P.forEach(([dx, dz], i) => { const s = rand(.95, 1.3), x = CX + dx, z = CZ + dz; im.setMatrixAt(i, msM4(x, -.05, z, rand(0, 6.28), new V(s, 1.08, s), rand(-.03, .03), rand(-.03, .03))); const c = addCol(x - .15 * s, x + .15 * s, z - .15 * s, z + .15 * s); S.birchCols.push([c, { ...c }]); c.minX = c.maxX = -9999; });
    im.computeBoundingSphere(); im.userData.noCull = true; N.add(im); } catch (e) { console.warn('weiss Birken', e); }
  // Fackelflammen, die in der Luft stillstehen
  for (const [dx, y, dz] of [[-5.8, 2.1, 5.2], [-6.4, 1.95, -4.6], [-3.2, 2.2, 6.9], [4.6, 2.05, -3.9], [6.8, 2.2, 1.6]]) { const f = weiss_sprite(flameT, 0xffc890, .34, .72); f.position.set(CX + dx, y, CZ + dz); N.add(f); const g = weiss_sprite(glowT, 0xff9a48, 1.9, 1.9, false, .45); g.position.copy(f.position); N.add(g); }
  // Tau am Rand der Senke (nass, glänzend)
  { const r = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.6, 72), new THREE.MeshStandardMaterial({ map: tex(T.tau(), true), transparent: true, depthWrite: false, color: 0x2a3430, roughness: .06, metalness: .1, polygonOffset: true, polygonOffsetFactor: -3 }));
    r.rotation.x = -Math.PI / 2; r.position.set(CX, .029, CZ); N.add(r); }
  // Sieben Nachhall-Kinder mit Laternen, mitten im Schritt zur Senke
  S.kidA = []; let lantern = null;
  try { const o = await msFBX('lantern2', 'model.fbx', { LANTERN_pieces_low: { color: 0x2b2622, metal: .6, rough: .55 }, LANTERN_glass_low: { color: 0xffe6bc, rough: .12, emissive: 0xff8a30, transparent: true } });
    o.traverse(m => { if (m.isMesh) { [].concat(m.material).forEach(x => { if (x.transparent) { x.opacity = .6; x.emissiveIntensity = .9; } }); } }); lantern = msGround(msFit(o, .3, 'y')); } catch (e) { console.warn('weiss Laterne', e); }
  const radii = [4.1, 3.6, 3.3, 2.95, 3.2, 3.7, 4.2];
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i - 3) * .2, r = radii[i], x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(CX - x, CZ - z); N.add(g);
    try { const P = await figuren_embody(g, i % 2 ? 'gezaehlt_m' : 'gezaehlt_j', { clip: 'walk' }); if (P) { if (P.cur) { P.cur.time = rand(.1, .9); P.cur.timeScale = 0; } P.mx.update(0); weiss_ghostify(P.obj); }
      g.updateMatrixWorld(true); let hand = null; if (P) P.obj.traverse(b => { if (!hand && /right.?hand$|hand_r$/i.test(b.name)) hand = b; });
      const hp = hand ? hand.getWorldPosition(new V()) : new V(x + .2, .75, z); if (lantern) { const l = lantern.clone(); l.position.set(hp.x, Math.max(.05, hp.y - .34), hp.z); l.rotation.y = rand(0, 6); N.add(l);
        const f = weiss_sprite(flameT, 0xffd8a0, .05, .1); f.position.set(hp.x, Math.max(.05, hp.y - .34) + .13, hp.z); N.add(f); const gl = weiss_sprite(glowT, 0xffa050, .5, .5, false, .55); gl.position.copy(f.position); N.add(gl); S.kidA.push({ x, z, lp: f.position.clone() }); }
    } catch (e) { console.warn('weiss Kind', e); } }
  // Nachhall-Klon des Ritters am Rand, wo seine Spuren enden
  const jb = .3, jx = CX + Math.cos(jb) * 2.95, jz = CZ + Math.sin(jb) * 2.95; S.jPos = new V(jx, 0, jz);
  try { if (justin.model && justin.mixer) { const sk = await figuren_skc(), c = sk(justin.model); const g = new THREE.Group(); g.add(c); g.position.set(jx, 0, jz); g.rotation.y = Math.atan2(CX - jx, CZ - jz); N.add(g);
      const mx = new THREE.AnimationMixer(c), idle = justin.acts.idle; if (idle) { mx.clipAction(idle.getClip()).play(); mx.update(1.3); } weiss_ghostify(c); S.jGhost = g; S.jGhostMx = mx;
      // dunkler Umriss derselben Haltung für die Blitze durch Lukes Augen (beim Laden angelegt, damit nichts nachübersetzt wird)
      const c2 = sk(justin.model), g2 = new THREE.Group(); g2.add(c2); const sil = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: .9 }); c2.traverse(m => { if (m.isMesh) { m.material = sil; m.frustumCulled = false; } });
      const mx2 = new THREE.AnimationMixer(c2); if (idle) { mx2.clipAction(idle.getClip()).play(); mx2.update(1.3); } g2.position.set(X3 + 2, 0, Z3 - 1.2); g2.visible = false; scene.add(g2); S.jSil = g2; S.jSilPar = scene;
      g2.traverse(b => { if (b.isBone && b.name === 'hand_l') S.jsHandL = b; });
      g.updateMatrixWorld(true); c.traverse(b => { if (b.isBone && b.name === 'hand_l') S.jgHandL = b; if (b.isBone && b.name === 'hand_r') S.jgHandR = b; }); } } catch (e) { console.warn('weiss Ritter-Nachhall', e); }
  // Spuren (Decals): Stiefel und Hufe vom Hof bis genau an die Kante, sieben Paar Kinderfüße hinein
  { const pm = c => weiss_decalMat(c, { color: 0x9aa89e }); const boots = weiss_trail(CX + 9.4, CZ + 2.6, jx + .35, jz + .1, .72, .13);
    N.add(weiss_prints(pm(T.boot()), .13, .32, boots, .031));
    const hb = Math.atan2(1.9 - 4.2, 2.66 - 9.4), he = [CX + Math.cos(.62) * 2.78, CZ + Math.sin(.62) * 2.78], hooves = weiss_trail(CX + 9.4, CZ + 4.3, he[0], he[1], .55, .2); void hb;
    N.add(weiss_prints(pm(T.hoof()), .15, .15, hooves, .032));
    let feet = []; for (let i = 0; i < 7; i++) { const a = Math.PI + (i - 3) * .2, r = radii[i]; feet = feet.concat(weiss_trail(CX + Math.cos(a) * (r + 5.6), CZ + Math.sin(a) * (r + 5.6), CX + Math.cos(a) * .9, CZ + Math.sin(a) * .9, .44, .07)); }
    N.add(weiss_prints(pm(T.foot()), .09, .18, feet, .033));
    if (S.jgHandL) { const h = S.jgHandL.getWorldPosition(new V()); const bm = msSurfMat('blood_s1', { alpha: true, tint: 0x8a6060 }); for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.PlaneGeometry(.12, .12), bm); d.rotation.set(-Math.PI / 2, 0, rand(0, 6)); d.position.set(h.x + rand(-.12, .12), .035, h.z + rand(-.12, .12)); N.add(d); } } }
  // Fünf Stellen (unsichtbare Flächen; erst während des Rätsels ansprechbar)
  { const hand = S.jgHandR ? S.jgHandR.getWorldPosition(new V()) : new V(jx, .9, jz + .3), front = S.kidA[3] ? S.kidA[3].lp : new V(CX - 2.9, .5, CZ);
    const mk = (w, h, d, x, y, z) => { const b = box(w, h, d, x, y, z, hidden, { cast: false }); b.userData.noCol = true; return b; };
    S.spots = [mk(2.4, .3, 1.6, CX + 5.2, .15, CZ + 2.2), mk(1.6, .3, 2.4, CX - 5.6, .15, CZ), mk(.7, .45, .7, jx, .22, jz), mk(.36, .4, .36, front.x, front.y, front.z), mk(.45, .9, .45, hand.x, Math.max(.5, hand.y - .25), hand.z)]; }

  // ---- Raum 3, Teil 2: der Hohe Abgrund – die große Papierlaterne (nur Emissive), Stab, Lucy, die Kleine mit echtem Gesicht
  const A = new THREE.Group(); A.visible = false; A.userData.noCol = true; scene.add(A); S.abgrund = A;
  try { const o = await msFBX('w_papierlaterne', 'model.fbx', {}); o.updateMatrixWorld(true); let one = null; o.traverse(m => { if (!one && m.isMesh && /Dupli/.test(m.name)) one = m; });
    const geo = one.geometry.clone().applyMatrix4(one.matrixWorld); geo.computeBoundingBox(); const bb = geo.boundingBox, sz = bb.getSize(new V()), s = 30 / sz.y;
    geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2); geo.scale(s, s, s);
    { const p = geo.attributes.position, n = new Float32Array(p.count * 3), v = new V(); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).sub(_wv.set(0, 15, 0)).normalize(); n[i * 3] = v.x; n[i * 3 + 1] = v.y; n[i * 3 + 2] = v.z; } geo.setAttribute('normal', new THREE.BufferAttribute(n, 3)); }
    const pt = tex(T.papier(), true); const paper = new THREE.MeshStandardMaterial({ map: pt, emissiveMap: pt, color: 0xf0e0c4, emissive: 0xffb060, emissiveIntensity: 2.6, roughness: .9, side: THREE.DoubleSide, fog: true });
    paper.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance *= .5 + 1.15 * pow(max(dot(normal, normalize(vViewPosition)), 0.), 1.5);'); }; paper.customProgramCacheKey = () => 'weiss_lampion';
    const cap = new THREE.MeshStandardMaterial({ color: 0x1c1612, roughness: .55, metalness: .2 }); const mats = [].concat(one.material).map((m, i) => /paper/i.test(m.name) ? cap : paper); // die Kugel trägt im Modell das zweite Material
    const L = new THREE.Mesh(geo, mats.length === 1 ? mats[0] : mats); L.position.set(CX, 11, CZ); L.userData.noCol = true; A.add(L); S.lampion = L; S.paper = paper;
    const fl = weiss_sprite(flameT, 0xffd090, 7, 13); fl.position.set(CX, 17, CZ); A.add(fl);
    S.lampTop = new V(CX, 41, CZ);
  } catch (e) { console.warn('weiss Papierlaterne', e); }
  try { const src = await msModel('w_birke', 'lod.glb'); let mesh = null; src.traverse(o => { if (!mesh && o.isMesh) mesh = o; }); // der Stab: eine Birkenstange, oben im Weiß verschwunden
    const st = new THREE.Mesh(mesh.geometry, mesh.material); st.scale.set(2.2, 22, 2.2); st.position.set(CX, 40.5, CZ); st.rotation.z = -.42; st.userData.noCol = true; A.add(st); } catch (e) { console.warn('weiss Stab', e); }
  // Lucy (Nachhall von lucy_erw) flackert auf dem Stuhl der kleinen Lucy
  try { const k = kids[1] && kids[1].k; if (k) { const g = new THREE.Group(); g.position.set(k.position.x, 0, k.position.z); g.rotation.y = k.rotation.y; A.add(g); g.updateMatrixWorld(true);
      const P = await figuren_embody(g, 'lucy_erw', { sit: .52 }); if (P) weiss_ghostify(P.obj); S.lucy = g; } } catch (e) { console.warn('weiss Lucy', e); }
  // Die Kleine: grau (graue) – für einen Atemzug mit echtem Gesicht (kleine)
  try { await figuren_embody(mira, 'graue'); const g = new THREE.Group(); g.visible = false; scene.add(g); await figuren_embody(g, 'kleine'); S.miraK = g; } catch (e) { console.warn('weiss Kleine', e); }
  // Helm: einmal vom Skelett gelöst (Geometrie im Kopfraum), die Spiegelung auf dem Visier
  try { let helm = null, head = null; justin.model.traverse(o => { if (!helm && o.isSkinnedMesh && /helm/i.test(o.name + ' ' + (o.material && o.material.name || ''))) helm = o; if (o.isBone && o.name === 'head') head = o; });
    if (helm && head) { justin.model.updateMatrixWorld(true); helm.skeleton.update(); const pos = helm.geometry.attributes.position, out = new Float32Array(pos.count * 3), inv = new THREE.Matrix4().copy(head.matrixWorld).invert(), v = new V();
      for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); helm.applyBoneTransform(i, v); v.applyMatrix4(helm.matrixWorld).applyMatrix4(inv); out[i * 3] = v.x; out[i * 3 + 1] = v.y; out[i * 3 + 2] = v.z; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(out, 3)); for (const k of ['normal', 'uv']) if (helm.geometry.attributes[k]) g.setAttribute(k, helm.geometry.attributes[k]); if (helm.geometry.index) g.setIndex(helm.geometry.index); g.computeVertexNormals(); g.computeBoundingSphere();
      const hq = head.getWorldQuaternion(new THREE.Quaternion()).invert(), gq = justin.g.getWorldQuaternion(new THREE.Quaternion());
      const fwd = new V(0, 0, 1).applyQuaternion(gq).applyQuaternion(hq).normalize(), up = new V(0, 1, 0).applyQuaternion(hq).normalize();
      const hm = new THREE.Mesh(g, helm.material); hm.castShadow = true; hm.visible = false; hm.userData.noCol = true; scene.add(hm);
      // Visier: die Punkte, die am weitesten nach vorn reichen
      let fmax = -1e9; for (let i = 0; i < pos.count; i++) { const d = out[i * 3] * fwd.x + out[i * 3 + 1] * fwd.y + out[i * 3 + 2] * fwd.z; if (d > fmax) fmax = d; }
      const c = new V(); let n = 0; for (let i = 0; i < pos.count; i++) { v.set(out[i * 3], out[i * 3 + 1], out[i * 3 + 2]); if (v.dot(fwd) > fmax - .035) { c.add(v); n++; } } c.multiplyScalar(1 / Math.max(1, n));
      const vm = new THREE.MeshBasicMaterial({ map: tex(T.visier(), true), transparent: true, depthWrite: false, opacity: .45, polygonOffset: true, polygonOffsetFactor: -4 });
      const vp = new THREE.Mesh(new THREE.PlaneGeometry(.075, .048), vm); vp.position.copy(c).addScaledVector(fwd, .006); vp.quaternion.setFromRotationMatrix(_wm.makeBasis(new V().crossVectors(up, fwd).normalize(), up, fwd)); hm.add(vp);
      S.helm = { real: helm, head, mesh: hm, fwd, up, t: 0 }; } } catch (e) { console.warn('weiss Helm', e); }

  // Raum 3 beginnt als Nacht: Stühle, sitzende Kinder und die Kleine erst in Teil 2
  weiss_teil2Sichtbar(false); N.visible = true; // Nacht ist ab jetzt der Ausgangszustand des Raums (Lichter dort erst ab offener Tür gedimmt)
  S.ok = true;
}]);
function weiss_chairs() { const IK = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S : null; return IK && IK.inst && IK.inst['chair**'] || []; }
function weiss_teil2Sichtbar(on) { weiss_chairs().forEach(m => m.visible = on); kids.forEach(K => K.k.visible = on); mira.visible = on;
  const IK = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S : null; if (IK && IK.papaich) { IK.papaich.visible = on; if (on) { if (!interactables.includes(IK.papaich)) interactables.push(IK.papaich); } else uninteract(IK.papaich); } }

// ---------------------------------------------------------------- Umgebung: Nacht (Teil 1), Weiß (Teil 2), zurück
function weiss_env(mode, k = 1) { const S = weiss_S, U = skyMat.uniforms;
  if (!S.sv) S.sv = { fogC: scene.fog.color.getHex(), fogD: scene.fog.density, skyH: U.horizon.value.clone(), skyZ: U.zenith.value.clone(), dim: U.dim.value, gfC: fogUniforms.color.value.clone() };
  const sv = S.sv; S.env = mode;
  if (mode === 'night') { scene.fog.color.setHex(sv.fogC).lerp(_wc.setHex(0x0a0f17), k); scene.fog.density = sv.fogD + (.16 - sv.fogD) * k; fogUniforms.color.value.copy(sv.gfC).lerp(_wc.setHex(0x0a0f17), k); S.ceil.forEach(c => c.visible = true); return; }
  if (mode === 'white') { scene.fog.color.setHex(0xeceef1); scene.fog.density = .016; fogUniforms.color.value.setHex(0xeceef1); U.horizon.value.setHex(0xf0f2f5); U.zenith.value.setHex(0xf6f7f9); U.dim.value = 1.4; S.ceil.forEach(c => c.visible = false); sky.visible = false; scene.background = _wbg; weiss_licht(1); return; }
  scene.fog.color.setHex(sv.fogC); scene.fog.density = sv.fogD; fogUniforms.color.value.copy(sv.gfC); U.horizon.value.copy(sv.skyH); U.zenith.value.copy(sv.skyZ); U.dim.value = sv.dim; S.ceil.forEach(c => c.visible = true); sky.visible = true; scene.background = null; S.sv = null; S.env = null; }
const _wbg = new THREE.Color(0xeef0f3);
const _wc = new THREE.Color();
function weiss_licht(k) { for (const l of weiss_S.r3L || []) { l.intensity = l.userData.i0 * k; l.color.setHex(l.userData.c0); if (k < 1) l.color.lerp(_wc.setHex(0x9db2d8), 1 - k); } }

// ---------------------------------------------------------------- Raum 1: der Schrank (K3-6)
function weiss_schrank() { if (ch3.schrank) return toast('Leer. Nur ein Paar Kinderschuhe, Größe 33.', 3000); ch3.schrank = true; Audio.creak(.2);
  openNote('Der Schrank', 'Leer. Nur ein Paar Kinderschuhe, Größe 33.', null, () => { if (weiss_S.jSaid) return; weiss_S.jSaid = true;
    say([['Nicht deine. Nicht Lucys.', 2600, 'DU'], ['„Der Knabe, der hier schlief … Lass ihn. Sieh nicht so genau hin.“', 4400, JS]]); }); }

// ---------------------------------------------------------------- Raum 2: Hilde (K3-7) und die Uhr (T7)
const WEISS_HILDE = [
  { k: 'kueche', q: 'Sie haben mich angegriffen. In der Küche.', a: '„Ich wollte dich festhalten, Junge. Weg von der Tür. Du warst schneller.“' },
  { k: 'los', q: 'Sie haben Zayn gezogen.', a: '„Das Los war das Los. Ich hab siebzehn Jahre gezählt, ob sie ihn wieder hergibt. Sie hat nie.“' },
  { k: 'wer', q: 'Wer hat angefangen?', a: '„Frag ihn nicht nach dem Handel. Frag ihn, warum er sich versteckt.“' },
  { k: 'jonas', q: 'Und Jonas?', a: '„Er ruft jeden Sonntag an. Ich geh nie ran. Wenn ich seine Stimme höre, zähl ich falsch.“', nur: () => weiss_has('zayn_rucksack') }];
hildeTalks = async function () {
  ch3.hildeSpoke = true; state.talking = true; const W = 'HILDE WENDT';
  await say([['Am Küchentisch sitzt Frau Wendt. Die Frau, die das Licht vor deinen Augen nach oben gerissen hat.', 4400], ['„Luke. Oder wie immer du heißt.“', 2800, W], ['„Deshalb ist Zayn hiergeblieben. Und jetzt bin ich es auch.“', 3600, W]]);
  state.talking = false; weiss_hildeFragen();
};
function weiss_hildeFragen() { const S = weiss_S, open = WEISS_HILDE.filter(f => !S.asked.has(f.k) && (!f.nur || f.nur())); if (!open.length) return weiss_hildeEnde();
  let pick = null;
  openPuzzle(`<h3>FRAU WENDT</h3><p>Sie sieht dich an und wartet.</p><div class="row" style="flex-direction:column;align-items:center;gap:12px">${open.map(f => `<button data-k="${f.k}" style="min-width:380px">${f.q}</button>`).join('')}<button data-k="-" style="min-width:380px;opacity:.75">NICHTS MEHR FRAGEN</button></div>`, box => {
    box.querySelectorAll('button[data-k]').forEach(b => b.onclick = e => { e.stopPropagation(); pick = b.dataset.k; closeOverlay(); }); });
  ui.onClose = () => setTimeout(() => weiss_hildeAntwort(pick), 250); }
async function weiss_hildeAntwort(k) { const S = weiss_S, f = WEISS_HILDE.find(x => x.k === k); if (!f) return weiss_hildeEnde();
  S.asked.add(k); state.talking = true; await say([[f.q, 2600, 'DU'], [f.a, 4200, 'HILDE WENDT']]); state.talking = false;
  if (k === 'wer' && !weiss_has('c3_hilde_versteck')) story.lore.push({ key: 'c3_hilde_versteck', title: 'Hilde im Weißen', html: '„Frag ihn nicht nach dem Handel. Frag ihn, warum er sich versteckt.“' });
  weiss_hildeFragen(); }
async function weiss_hildeEnde() { if (weiss_S.hildeEnde) return; weiss_S.hildeEnde = true; state.talking = true;
  await say([['„Die Uhr da. Stell sie auf die Zeit, zu der sie dich gebracht haben. Dann lässt es euch durch.“', 4600, 'HILDE WENDT']]);
  state.talking = false; setC3('Stell die Küchenuhr auf die Zeit, zu der man dich gebracht hat.'); }
room2Solved = async function () {
  ch3.room2 = true; Audio.chime(); state.talking = true;
  await say([['Die Uhr schlägt einmal. Frau Wendt steht auf und geht zur Tür.', 3800], ['„Zähl für mich weiter.“', 2800, 'HILDE WENDT']]);
  const fd = $('fade'); fd.style.background = '#e8ecf0'; await fade(.55, 700); hilde.visible = false; await fade(0, 1100); fd.style.background = '#000';
  await say([['Sie löst sich auf wie Atem an einer Scheibe.', 3200], ['Justin steht in der Tür. Er sieht dich nicht an.', 3000], ['„Komm. Der letzte Raum.“', 2600, JS]]);
  state.talking = false; weiss_licht(.12); door2w.set(true); Audio.slide(X3 + 32, Z3); setC3('Der Hohe Abgrund. Geh hinein.'); weiss_S.phase = 'tuer';
};

// ---------------------------------------------------------------- Raum 3, Teil 1: Die Nacht von 1312 (K3-8)
const WEISS_SPUR = [
  { n: 1, label: 'Stiefel- und Hufspuren am Rand', t: 'Stiefel. Hufe. Sie kommen vom Hof und enden genau an der Kante. Keine führt hinein.' },
  { n: 2, label: 'Kinderspuren', t: 'Sieben Paar nackte Füße. Sie führen hinein.' },
  { n: 3, label: 'Seine Stiefel', t: 'Trocken. Der Rand ist nass vom Tau.' },
  { n: 4, label: 'Die vorderste Laterne', t: 'Die Kerze ist kaum heruntergebrannt.' },
  { n: 5, label: 'Sein Schwert', t: 'Sauber. Nur seine linke Hand blutet.' }];
room3Scene = async function () {
  const S = weiss_S; if (ch3.room3) return; ch3.room3 = true; S.phase = 'nacht'; state.talking = true; justin.look = false; Audio.hum(false);
  jWalk(X3 + 35.4, Z3 + 1.7, () => { justin.g.rotation.y = Math.PI / 2; });
  await wait(2600); // Stille
  await say([['„Ich suchte sie die ganze Nacht. Ich ging hinein, bis das Licht mich verbrannte.“', 4800, JS], ['„Erst dann holte ich die Kinder.“', 3000, JS]]);
  state.talking = false; setC3('Eine Erinnerung lügt. Sieh genau hin.'); S.phase = 'spuren';
  (S.spots || []).forEach((b, i) => interact(b, WEISS_SPUR[i].label, () => weiss_spur(i + 1)));
};
async function weiss_spur(n) { const S = weiss_S, f = WEISS_SPUR[n - 1]; if (S.phase !== 'spuren' && S.phase !== 'frage') return;
  S.seen.add(n); await say([[f.t, 3800]]);
  if (S.seen.size === 5 && S.phase === 'spuren') { S.phase = 'frage'; setTimeout(() => weiss_luegt(), 600); } }
function weiss_luegt() { const S = weiss_S; if (S.phase !== 'frage' || ui.overlay) return;
  openPuzzle(`<h3>WAS LÜGT?</h3><p>Eine Erinnerung lügt. Sieh genau hin.</p><div class="row" style="flex-direction:column;align-items:center;gap:12px">${WEISS_SPUR.map(f => `<button data-n="${f.n}" style="min-width:380px">${f.label}</button>`).join('')}<button data-n="0" style="min-width:380px;opacity:.75">NOCH EINMAL HINSEHEN</button></div>`, box => {
    box.querySelectorAll('button[data-n]').forEach(b => b.onclick = e => { e.stopPropagation(); closeOverlay(); const n = +b.dataset.n; if (n) setTimeout(() => weiss_luegtWahl(n), 200); }); }); }
async function weiss_luegtWahl(n) { const S = weiss_S; if (S.phase !== 'frage') return; S.log.push('wahl' + n);
  if (n === 1) return weiss_gestaendnis();
  S.tries++; state.talking = true;
  await say([[n === 3 || n === 5 ? 'Das stimmt. Aber es reicht nicht. Wo ist er gegangen?' : 'Das ist wahr. So war es.', 3400]]);
  state.talking = false;
  if (S.tries === 2) { const ex = X3 + 42 + 3.5, ez = Z3 + 2.1; jWalk(ex, ez, () => { justin.g.rotation.y = Math.atan2(X3 + 44.7 - ex, Z3 + .9 - ez); }); await wait(2400); await say([['Justin sieht auf die Kante hinunter.', 3200]]); }
  setTimeout(() => weiss_luegt(), 500); }
async function weiss_gestaendnis() { const S = weiss_S; S.phase = 'gestaendnis'; (S.spots || []).forEach(uninteract); state.talking = true; justin.look = false;
  jPlay('kneel'); await wait(1400);
  await say([['„Ich bin nie hineingegangen. Ich hatte Angst. Also habe ich bezahlt. Mit ihren Kindern.“', 5200, JS], ['„Siebzehn Jahre später rief sie: Ich komme. Und ich habe mich versteckt. Seitdem. Jedes Mal.“', 5400, JS]]);
  await wait(900); await say([['Du hast dich versteckt. Siebenhundert Jahre lang.', 3600, 'DU']]);
  if (!weiss_has('c3_1312')) story.lore.push({ key: 'c3_1312', title: 'Die Nacht von 1312', html: '„Ich suchte sie die ganze Nacht. Ich ging hinein, bis das Licht mich verbrannte.“\n\nStiefel. Hufe. Sie kommen vom Hof und enden genau an der Kante. Keine führt hinein.\n\n„Ich bin nie hineingegangen. Ich hatte Angst. Also habe ich bezahlt. Mit ihren Kindern.“\n„Siebzehn Jahre später rief sie: Ich komme. Und ich habe mich versteckt. Seitdem. Jedes Mal.“' });
  questPop('ERINNERUNG', 'Die Nacht von 1312'); await wait(1600); weiss_teil2(); }

// ---------------------------------------------------------------- Raum 3, Teil 2: Der Hohe Abgrund (K3-9), acht Schläge
function weiss_beat(kind, target, ms = 10000) { return new Promise(res => { weiss_S.bw = { kind, target, t: 0, hold: 0, ms: ms / 1000, x: player.pos.x, z: player.pos.z, res }; }); }
async function weiss_glide(tx, tz, sec) { const x0 = player.pos.x, z0 = player.pos.z; let t = 0; await new Promise(res => setScripted(dt => { t += dt / sec; const k = Math.min(1, t), e = k * k * (3 - 2 * k);
  player.pos.x = x0 + (tx - x0) * e; player.pos.z = z0 + (tz - z0) * e; if (k >= 1) { res(); return false; } })); }
async function weiss_teil2() { const S = weiss_S, CX = X3 + 42, CZ = Z3; S.phase = 'abgrund'; state.talking = true;
  const fd = $('fade'); fd.style.background = '#fff'; await fade(1, 600);
  S.night.visible = false; S.birchCols.forEach(([c]) => { c.minX = c.maxX = -9999; }); weiss_teil2Sichtbar(true); S.abgrund.visible = true; weiss_env('white');
  player.pos.set(CX - 7.6, 0, CZ + 1.2); player.yaw = -Math.PI / 2; player.pitch = .05; vel.set(0, 0, 0); jPlace(CX - 7.2, CZ - .2, Math.PI / 2); justin.look = false;
  S.miraFace = 'weg'; S.counting = true; Audio.hum(true);
  await wait(250); await fade(0, 600); fd.style.background = '#000'; state.talking = false;
  // Die Laterne – Luke sieht hinauf
  await weiss_beat('look', S.lampion ? S.lampion.position.clone().setY(22) : new THREE.Vector3(CX, 22, CZ), 9000);
  state.talking = true; await say([['Das war nie ein UFO. Das ist ihre Laterne.', 3800, 'DU']]); state.talking = false;
  // 1: Justin tritt mit Luke an der Hand in den Kreis
  await weiss_beat('step', null, 8000); weiss_glocke(); state.talking = true; S.counting = false;
  subtitle('Justin tritt mit dir an der Hand in den Kreis.', 3200); jWalk(CX - 3.8, CZ - .3); await weiss_glide(CX - 3.9, CZ + .8, 2.8);
  await say([['„… Papa?“', 2600, 'DAS KIND']]); S.miraFace = 'justin'; await wait(700); S.kleineT = 1.3; await wait(1600); state.talking = false;
  // 2: Gefunden
  await weiss_beat('look', kids.map(K => K.k.position.clone().setY(.9)), 9000); weiss_glocke(); state.talking = true;
  Audio.giggle(CX, 1.2, CZ); setTimeout(() => { for (let i = 0; i < 3; i++) { const K = kids[i * 2]; if (K) Audio.giggle(K.k.position.x, 1, K.k.position.z); } }, 900);
  await say([['„Gefunden.“', 2400, 'DAS KIND'], ['Sie lacht, glücklich. Die sieben auf den Stühlen lachen mit, ohne Münder.', 4200]]); state.talking = false;
  // 3: Bruder – Blitze durch Lukes Augen
  await weiss_beat('look', mira.position.clone().setY(.9), 9000); weiss_glocke(); state.talking = true; S.miraFace = null;
  await say([['„Und du hast ihn mitgebracht, Bruder. Ich hab dich gemacht. Aus seinem Blut an meinen Händen.“', 5200, 'DAS KIND'], ['„Darum hast du seine Augen. Ich hab die ganze Nacht durch dich geguckt.“', 4600, 'DAS KIND']]);
  await weiss_blitze(); await say([['„Im Eisen seh ich ihn nicht. Durch dich schon.“', 3800, 'DAS KIND']]); state.talking = false;
  // 4: Der Helm
  await weiss_beat('look', justin.g.position.clone().setY(1.5), 9000); weiss_glocke(); await weiss_helmSzene();
  // 5: Zusatzzeilen (je eine, wenn vorhanden) und Peter (immer)
  await weiss_beat('step', null, 7000); weiss_glocke(); state.talking = true; const ex = [];
  if (ch3.myst.has('chronik')) ex.push(['„Siebenhundertvierzehn Jahre, Papa. Zweiundvierzig Mal hab ich gerufen.“', 4400, 'DAS KIND']);
  if (ch3.myst.has('albers')) ex.push(['„Papa räumt auf. Immer. Er bringt sie mir weg.“', 3200, 'DAS KIND']);
  if (ch3.myst.has('buch')) ex.push(['„Die Frau hat so schön gezählt.“', 2800, 'DAS KIND']);
  if (ch3.myst.has('stimme')) ex.push(['Du warst das. Am Telefon. Mit Lucys Stimme.', 3200, 'DU'], ['„Natürlich. Du solltest herkommen. Du solltest es wissen.“', 3600, 'DAS KIND']);
  ex.push(['„Onkel Peter ist heimgekommen. Du hast ihn warm gemacht.“', 3800, 'DAS KIND'], ['„Ich habe ihn 1975 heimgeführt. An dieser Hand.“', 3600, JS]);
  await say(ex); state.talking = false;
  // 6: Ein Stück von Papa ist noch draußen
  await weiss_beat('look', mira.position.clone().setY(.9), 8000); weiss_glocke(); state.talking = true;
  await say([['„Das Spiel ist erst aus, wenn alle gefunden sind. Papa ist gefunden. Aber ein Stück von Papa ist noch draußen.“', 5600, 'DAS KIND']]); S.miraFace = 'du';
  await say([['Sie sieht dich an.', 2400]]); state.talking = false;
  // 7: Justins Angebot
  await weiss_beat('look', justin.g.position.clone().setY(1.5), 8000); weiss_glocke(); state.talking = true; justin.look = true;
  await say([['„Knabe. Wie immer man dich nennt – hör mich an.“', 4000, JS],
    ['„Wenn ich hinabsteige, und mit mir das Kind, das aus mir ist, dann ist der Handel erfüllt. Der Abgrund schließt sich. Für immer.“', 5600, JS],
    ['„Die Geholten kommen heim. Deine Schwester kommt heim. Nur du nicht.“', 4000, JS],
    ['„Bleibst du, gehe ich allein. Vielleicht genügt es ihr. Vielleicht nicht. Dann kommt sie in siebzehn Jahren wieder.“', 5400, JS],
    ['„Ich zwinge dich nicht. Das habe ich einmal getan, mit sieben Kindern. Nie wieder.“', 4400, JS]]); state.talking = false;
  // 8: Was will sie?
  await weiss_beat('step', null, 6000); weiss_glocke(); state.talking = true;
  const P = player.pos, dx = CX - P.x, dz = CZ - P.z, d = Math.hypot(dx, dz) || 1; jWalk(P.x + dx / d * 1.1, P.z + dz / d * 1.1, () => { justin.look = true; jPlay('kneel'); }); await wait(2000);
  await say([['„Du bist aus mir gemacht. Du träumst ihre Träume. Sag mir, Knabe: Was will sie?“', 5200, JS]]);
  state.talking = false; S.phase = 'wahl'; showChoice(); }

// Blitze durch Lukes Augen: drei harte Schnitte à 0,3 s – Ostende der Straße (Kap. 1), die Lichtsäule, Justins Hand an der Kreuzung
async function weiss_blitze(nur) { const S = weiss_S, jg = S.jSil || S.jGhost; if (!jg) return; S.blitzOn = true; const par = jg.parent, p0 = jg.position.clone(), r0 = jg.rotation.y, fd = $('fade'), pk = pillarMat.uniforms.opacity.value, fog = [scene.fog.color.getHex(), scene.fog.density], ceil = S.ceil.map(c => c.visible);
  const px = pillar.position.x, hand = new THREE.Vector3();
  const shots = [{ j: [67, 4.6, -Math.PI / 2], cam: [61.6, 1.66, 4.1], look: () => [67, 1.35, 4.6] }, { j: [px, .6, px > 0 ? -Math.PI / 2 : Math.PI / 2], cam: [px + (px > 0 ? -6 : 6), 1.6, 1.9], look: () => [px, 2.1, .4], pillar: true },
    { j: [1.5, -5.2, .9], cam: [2.35, 1.3, -4.45], look: () => { const hb = jg === S.jSil ? S.jsHandL : S.jgHandL; return hb ? hb.getWorldPosition(hand).toArray() : [1.5, 1, -5.2]; } }];
  scene.add(jg); jg.visible = true; setScripted(() => true); let cur = null; /* überbelichtet wie ein Blitz: Weiß bleibt, der Ritter steht als dunkler Umriss darin */ setCamOverride(cam => { if (cur) { cam.position.set(cur.cam[0], cur.cam[1], cur.cam[2]); const l = cur.l; cam.lookAt(l[0], l[1], l[2]); } });
  try { for (const sh of shots) { if (nur && shots.indexOf(sh) + 1 !== nur) continue; fd.style.transition = 'none'; fd.style.background = '#fff'; fd.style.opacity = 1; Audio.stinger(false);
      jg.position.set(sh.j[0], 0, sh.j[1]); jg.rotation.y = sh.j[2]; jg.updateMatrixWorld(true); scene.fog.color.setHex(S.sv ? S.sv.fogC : fog[0]); scene.fog.density = .03; pillarMat.uniforms.opacity.value = sh.pillar ? .45 : 0;
      cur = { cam: sh.cam, l: sh.look() }; PERF_CULL.t = 0; await wait(80); fd.style.opacity = 0; S.blitzCut = shots.indexOf(sh) + 1; await wait(S.blitzMs || 300); }
    fd.style.opacity = 1; await wait(90);
  } finally { setCamOverride(null); cur = null; setScripted(null); pillarMat.uniforms.opacity.value = pk; scene.fog.color.setHex(fog[0]); scene.fog.density = fog[1]; S.ceil.forEach((c, i) => c.visible = ceil[i]);
    par.add(jg); jg.position.copy(p0); jg.rotation.y = r0; if (jg === S.jSil) jg.visible = false; PERF_CULL.t = 0; fd.style.transition = 'opacity .35s'; fd.style.opacity = 0; await wait(380); fd.style.background = '#000'; S.blitzOn = false; } }

// Justin nimmt den Helm ab – Kamera von hinten, im Visier Lukes Gesicht mit braunen Augen; Nahaufnahme der linken Hand
async function weiss_helmSzene() { const S = weiss_S, H = S.helm; state.talking = true; justin.look = true; jPlay('idle');
  const g = justin.g, P = player.pos; g.rotation.y = Math.atan2(P.x - g.position.x, P.z - g.position.z); justin.look = false; await wait(200);
  const f = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), left = new THREE.Vector3(f.z, 0, -f.x); // Justins linke Seite
  const camA = g.position.clone().addScaledVector(f, -.95).addScaledVector(left, 1.0).setY(1.45), lookA = new THREE.Vector3(), camB = new THREE.Vector3(), lookB = new THREE.Vector3();
  let mode = 'A'; setScripted(() => true);
  setCamOverride(cam => { if (mode === 'A') { cam.position.copy(camA); cam.lookAt(lookA); } else { cam.position.copy(camB); cam.lookAt(lookB); } });
  if (H) { H.real.visible = false; H.mesh.visible = true; H.t = 0; S.helmHeld = true; S.helmL = left.clone(); S.helmF = f.clone(); }
  lookA.copy(g.position).addScaledVector(left, .45).addScaledVector(f, .05).setY(1.02); PERF_CULL.t = 0;
  Audio.play && Audio.play(Audio.pick ? Audio.pick('metalOpen', 'metalSheet') : 'metalOpen', { gain: .25, rate: 1.3, x: g.position.x, y: 1.7, z: g.position.z, ref: 2 });
  await say([['Justin nimmt den Helm ab.', 2600]]); await wait(1400);
  if (S.jHandL()) { S.jHandL().getWorldPosition(lookB); camB.copy(lookB).addScaledVector(left, .42).addScaledVector(f, -.12).add(_wv.set(0, .1, 0)); }
  mode = 'B'; PERF_CULL.t = 0; await say([['Seine linke Hand: dieselbe halbrunde Narbe.', 3200]]);
  mode = 'A'; PERF_CULL.t = 0;
  await say([['„Ich wusste es, als ich dich an der Kreuzung sah. Ich habe dich gebraucht, um gefunden zu werden. Allein hätte ich es nie gekonnt.“', 6000, JS]]);
  setCamOverride(null); setScripted(null); state.talking = false; }
weiss_S.jHandL = () => { if (weiss_S._hl === undefined) { weiss_S._hl = null; if (justin.model) justin.model.traverse(b => { if (b.isBone && b.name === 'hand_l') weiss_S._hl = b; }); } return weiss_S._hl; };

// ---------------------------------------------------------------- Die Wahl (K3-10) und die Enden
showChoice = function () {
  if (ch3.choice) return; const H = weiss_hinweise(); weiss_S.phase = 'wahl';
  const b = (id, t) => `<button id="${id}" style="min-width:380px">${t}</button>`;
  openPuzzle(`<h3>WAS WILL SIE?</h3><p>Justin wartet. Das Kind lächelt. Sieben Kinder sehen dich an.</p><div class="row" style="flex-direction:column;align-items:center;gap:14px">
    ${b('chA', '„Dich. Dein Blut. Sie will es zurück.“')}${b('chB', '„Den Handel. Sieben Kinder, wie damals.“')}${H.c ? b('chC', '„Dass du sie suchst. Du hast immer nur gezählt.“') : ''}</div>`, box => {
    const go = (c, fn) => e => { e.stopPropagation(); ch3.choice = c; closeOverlay(); fn(); };
    box.querySelector('#chA').onclick = go('A', () => endingA()); box.querySelector('#chB').onclick = go('B', () => endingB());
    const c = box.querySelector('#chC'); if (c) c.onclick = go('C', () => endingC());
  });
  ui.onClose = () => { if (!ch3.choice) setTimeout(showChoice, 400); };
};
// Vor jeder Kinosequenz: Raum 3 zurück in den Grundzustand (Nebel, Himmel, Decke, Helm, Lucy)
function weiss_aufraeumen() { const S = weiss_S; S.bw = null; S.helmHeld = false; if (S.helm) { S.helm.mesh.visible = false; S.helm.real.visible = true; } if (S.miraK) S.miraK.visible = false;
  if (S.lucy) S.lucy.visible = true; if (S.abgrund) S.abgrund.visible = false; if (S.env) weiss_env(null); weiss_licht(1); setCamOverride(null); setScripted(null); }
async function weiss_vorKino(id) { weiss_aufraeumen(); await weiss_kino(id); }
async function endingC() {
  state.talking = true; justin.look = true; jPlay('idle');
  await say([['„Dass du sie suchst. Du hast immer nur gezählt.“', 3600, 'DU'], ['Justin sieht dich an. Zum ersten Mal richtig.', 3600]]);
  $('fade').style.background = '#fff'; await fade(1, 1800);
  if (typeof kino_play === 'function') await weiss_vorKino('k3c');
  else { weiss_aufraeumen(); await say([['Er legt Schwert und Helm auf den leeren achten Stuhl. Er dreht sich um, legt die Hände vor die Augen und zählt laut.', 5000], ['„Eins. Zwei. Drei …“', 3000, JS], ['„… Siebzehn.“', 2600, JS], ['„Ich komme.“', 2400, JS], ['„Danke, Luke.“', 2600, JS]]); }
  c3Endcard('KAPITEL 3 — ENDE · SUCH MICH', '5. November 2026, Morgengrauen. Auf der Kreuzung stehen sie alle, barfuß. Zayn. Mike. Roxy. Hilde.<br>Lucy hält zwei Hände: die eines Jungen mit hellblauen Augen – und deine.<br>Über dem Wald ist der Himmel zum ersten Mal einfach nur Himmel.<br>Auf dem Ortsschild hat jemand die Zahl durchgestrichen. Daneben, in Kinderschrift: ALLE.', 'HIGH ABYSS MIRA · FORTSETZUNG FOLGT');
  if (typeof kapEnde === 'function') kapEnde(3);
}
// Justin im Weißen: während Raum 3 nur das Rätsel „Was lügt?“, sonst wie bisher
jHint = (o => async function () { const S = weiss_S; if (ch3.part === 'white' && ch3.room3) { if (S.phase === 'frage') weiss_luegt(); return; } return o(); })(jHint);

// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  const S = weiss_S; if (!S.ok || !ch3.on || ch3.part !== 'white') return; const P = player.pos, CX = X3 + 42, CZ = Z3;
  // Raum 1: im Schrank atmet ein Kind – bis Luke hineinsieht
  const K = S.schrank; if (K && !ch3.schrank && S.schrankLook < .5) { const d = Math.hypot(P.x - K.x, P.z - K.z);
    if (d < 3) { S.atemT -= dt; if (S.atemT <= 0) { S.atemT = rand(3.1, 3.9); weiss_atem(.05, K.x, K.y, K.z - .1); }
      if (d < 2.3) { camera.getWorldDirection(_wd); _wv.set(K.x - camera.position.x, K.y - camera.position.y, K.z - camera.position.z).normalize(); if (_wd.dot(_wv) > .975) S.schrankLook += dt; } } }
  // Raum 3, Teil 1: hinter der Tür wird es Nacht
  if (ch3.room2 && (S.phase === 'tuer' || S.phase === 'nacht' || S.phase === 'spuren' || S.phase === 'frage' || S.phase === 'gestaendnis')) { const k = THREE.MathUtils.clamp((P.x - (X3 + 29.5)) / 4, 0, 1); if (Math.abs(k - S.envK) > .002 || !S.env) { S.envK = k; weiss_env('night', k); } }
  if (S.phase === 'abgrund' || S.phase === 'wahl') {
    if (S.miraFace === 'weg') mira.lookAt(2 * mira.position.x - P.x, mira.position.y, 2 * mira.position.z - P.z); else if (S.miraFace === 'justin') mira.lookAt(justin.g.position.x, mira.position.y, justin.g.position.z);
    if (S.miraK) { S.kleineT = Math.max(0, S.kleineT - dt); const kl = S.kleineT > 0 && S.kleineT < 1.05; if (S.miraK.visible !== kl) { S.miraK.visible = kl; mira.visible = !kl; } if (kl) { S.miraK.position.copy(mira.position); S.miraK.quaternion.copy(mira.quaternion); } }
    if (S.lucy) { S.flk -= dt; if (S.flk <= 0) { S.lucy.visible = !S.lucy.visible; S.flk = S.lucy.visible ? rand(.06, .55) : rand(.25, 1.6); } }
    if (S.counting) { S.cnt -= dt; if (S.cnt <= 0) { S.cnt = rand(2.2, 3); Audio.whisper(mira.position.x, 1, mira.position.z, 1.6); } }
    if (S.paper) S.paper.emissiveIntensity = 2.6 * (.96 + .04 * Math.sin(t * 1.3));
  }
  // Helm in Justins linker Hand
  const H = S.helm; if (H && S.helmHeld) { H.t = Math.min(1, H.t + dt / 1.8); const e = H.t * H.t * (3 - 2 * H.t), hb = S.jHandL();
    H.head.updateWorldMatrix(true, false); H.head.getWorldPosition(_wv); H.head.getWorldQuaternion(_wq);
    if (hb) { hb.getWorldPosition(_wd); _wd.y -= .06; _wd.addScaledVector(S.helmL, .2).addScaledVector(S.helmF, .06); } else _wd.copy(justin.g.position).addScaledVector(S.helmL, .35).setY(1);
    H.mesh.position.lerpVectors(_wv, _wd, e);
    // gehalten: Visier zur Seite und leicht nach hinten gedreht (die Kamera hinter ihm sieht hinein)
    if (!S.hq) { S.hq = new THREE.Quaternion(); S.hq2 = new THREE.Quaternion(); S.hm = new THREE.Matrix4(); S.hv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]; }
    const [fw, up, rt] = S.hv; fw.copy(S.helmL).multiplyScalar(.8).addScaledVector(S.helmF, -.6).add(_wc3.set(0, .25, 0)).normalize(); up.set(0, 1, 0); rt.crossVectors(up, fw).normalize(); up.crossVectors(fw, rt).normalize();
    const lr = _wc4.crossVectors(H.up, H.fwd).normalize(); S.hm.makeBasis(rt, up, fw); S.hq.setFromRotationMatrix(S.hm); S.hm.makeBasis(lr, H.up, H.fwd); S.hq2.setFromRotationMatrix(S.hm).invert(); S.hq.multiply(S.hq2);
    H.mesh.quaternion.copy(_wq).slerp(S.hq, e); }
  // Takte der acht Schläge: warten, bis Luke hinsieht / einen Schritt geht
  const B = S.bw; if (B) { B.t += dt; let ok = S.fast || B.t > B.ms;
    if (!ok && !ui.overlay && !state.talking) { if (B.kind === 'step') ok = Math.hypot(P.x - B.x, P.z - B.z) > .6;
      else { camera.getWorldDirection(_wd); const L = Array.isArray(B.target) ? B.target : [B.target]; let see = false; for (const p of L) { _wv.copy(p).sub(camera.position).normalize(); if (_wd.dot(_wv) > .96) { see = true; break; } }
        B.hold = see ? B.hold + dt : 0; ok = B.hold > .3; } }
    if (ok) { S.bw = null; B.res(); } }
});
const _wc3 = new THREE.Vector3(), _wc4 = new THREE.Vector3();
window.__weiss = { S: weiss_S, hints: weiss_hinweise, spur: n => weiss_spur(n), wahl: n => weiss_luegtWahl(n), teil2: () => weiss_teil2(), helm: () => weiss_helmSzene(), blitze: n => weiss_blitze(n), env: m => weiss_env(m), aufraeumen: weiss_aufraeumen,
  room3: () => room3Scene(), hilde: () => hildeTalks(), room2: () => room2Solved(), choice: () => showChoice(), endC: () => endingC() }; // Testzugriff
