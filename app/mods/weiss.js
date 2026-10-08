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
function weiss_atem(v, x, y, z) { const A = Audio; if (!A.ctx) return; if (A.atemEcht && A.atemEcht(v * 1.5, .85, x, y, z)) return; const c = A.ctx, t = c.currentTime, n = A.noise(false), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 640; bp.Q.value = .9;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .9); g.gain.linearRampToValueAtTime(v * .12, t + 1.25); g.gain.linearRampToValueAtTime(v * .75, t + 1.7); g.gain.linearRampToValueAtTime(0, t + 2.7);
  n.connect(bp); bp.connect(g); g.connect(A.at(x, y, z, 1.1)); n.stop(t + 2.9); }
// Einzelner Glockenschlag (leben_bellStrike), hier aus dem Weiß über der Senke statt vom Kirchberg
function weiss_glocke(v = .8) { if (typeof leben_bellStrike !== 'function' || typeof leben_CHAPEL === 'undefined') return; const C = leben_CHAPEL, o = [C.x, C.y, C.z];
  C.x = X3 + 42; C.y = 26; C.z = Z3; try { leben_bellStrike(v, false); } finally { C.x = o[0]; C.y = o[1]; C.z = o[2]; } }
async function weiss_kino(id) { if (typeof kino_play === 'function') { try { await kino_play(id); } catch (e) { console.error('Kino ' + id, e); } } }

// ---------------------------------------------------------------- Nachhall: derselbe Geister-Look wie alle Erinnerungen (geister.js), eigene Stärke weiss_S.ghostU (nicht an Echos gebunden)
function weiss_ghostify(o) { const Q = o.parent && o.parent.userData.person, P = Q && Q.obj === o ? Q : null;
  geister_bau(o, { strength: weiss_S.ghostU, P, g: P ? P.g : o.parent || null, h: P ? P.h : 1.94 }); if (P) geister_person(P); o.traverse(m => { if (m.isMesh) m.frustumCulled = false; }); }

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
  papier: () => weiss_cv(1024, 512, (X, w, h) => { papierScan(X, w, h, '#f2e4c6', { dreck: .4 }); const Lc = document.createElement('canvas'); Lc.width = w; Lc.height = h; const x = Lc.getContext('2d'); // echtes Papier; die Buntstiftstriche auf eigener Ebene mit Wachskorn (echte Scans)
    const cr = (col, wd = 4) => { x.strokeStyle = col; x.lineWidth = wd; x.lineCap = 'round'; x.lineJoin = 'round'; }; const jit = v => v + (Math.random() - .5) * 2.4;
    const kid = (cx, cy, s, col) => { cr(col, 3.5); x.beginPath(); x.arc(cx, cy - 44 * s, 10 * s, 0, 7); x.moveTo(jit(cx), cy - 34 * s); x.lineTo(jit(cx), cy); x.lineTo(cx - 10 * s, cy + 26 * s); x.moveTo(cx, cy); x.lineTo(cx + 10 * s, cy + 26 * s); x.moveTo(cx - 14 * s, cy - 22 * s); x.lineTo(cx + 16 * s, cy - 20 * s); x.stroke();
      cr('#c87818', 3); x.beginPath(); x.moveTo(cx + 16 * s, cy - 20 * s); x.lineTo(cx + 16 * s, cy - 6 * s); x.stroke(); x.fillStyle = 'rgba(230,150,30,.8)'; x.beginPath(); x.arc(cx + 16 * s, cy, 7 * s, 0, 7); x.fill(); };
    for (let rep = 0; rep < 2; rep++) { const o = rep * w / 2;
      for (let i = 0; i < 7; i++) kid(o + 60 + i * 52, 330 + (i % 2) * 8, 1, ['#b02020', '#2040b0', '#208030', '#202020', '#8030a0', '#b05010', '#2060a0'][i]);
      cr('#303030', 6); x.beginPath(); x.moveTo(o + 440, 200); x.lineTo(o + 440, 380); x.moveTo(o + 400, 260); x.lineTo(o + 480, 260); x.moveTo(o + 440, 380); x.lineTo(o + 415, 430); x.moveTo(o + 440, 380); x.lineTo(o + 465, 430); x.stroke(); x.beginPath(); x.arc(o + 440, 176, 22, 0, 7); x.stroke();
      cr('#a01818', 5); x.beginPath(); x.ellipse(o + 250, 150, 110, 30, 0, 0, 7); x.stroke(); cr('#d8d8e8', 10); for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(o + 205 + k * 22, 178); x.lineTo(o + 180 + k * 34, 290); x.stroke(); }
      x.fillStyle = '#a01818'; x.font = 'bold 34px Caveat, cursive'; x.fillText(rep ? 'wir 8' : 'DAS LICHT', o + 170, 90); }
    echt_wachsKorn(x, w, h, .4); X.drawImage(Lc, 0, 0); X.fillStyle = 'rgba(90,60,30,.4)'; for (let i = 1; i < 16; i++) X.fillRect(0, i * h / 16, w, 2); }),
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
WORLD_MODS.push(['Nimmerheim · Raum 3 und Ende C', async () => {
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
  for (let i = 0; i < 6; i++) { const a = Math.PI + (i - 2.5) * .22, r = radii[i] + .4, x = CX + Math.cos(a) * r, z = CZ + Math.sin(a) * r; // Fassung 3: sechs Kinder hinter Luna
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(CX - x, CZ - z); N.add(g);
    try { const P = await figuren_embody(g, i % 2 ? 'gezaehlt_m' : 'gezaehlt_j', { clip: 'walk' }); if (P) { if (P.cur) { P.cur.time = rand(.1, .9); P.cur.timeScale = 0; } P.mx.update(0); weiss_ghostify(P.obj); }
      g.updateMatrixWorld(true); let hand = null; if (P) P.obj.traverse(b => { if (!hand && /right.?hand$|hand_r$/i.test(b.name)) hand = b; });
      const hp = hand ? hand.getWorldPosition(new V()) : new V(x + .2, .75, z); if (lantern) { const l = lantern.clone(); l.position.set(hp.x, Math.max(.05, hp.y - .34), hp.z); l.rotation.y = rand(0, 6); N.add(l);
        const f = weiss_sprite(flameT, 0xffd8a0, .05, .1); f.position.set(hp.x, Math.max(.05, hp.y - .34) + .13, hp.z); N.add(f); const gl = weiss_sprite(glowT, 0xffa050, .5, .5, false, .55); gl.position.copy(f.position); N.add(gl); S.kidA.push({ x, z, lp: f.position.clone() }); }
    } catch (e) { console.warn('weiss Kind', e); } }
  // Nachhall-Klon des Ritters am Rand, wo seine Spuren enden
  const jb = .3, jx = CX + Math.cos(jb) * 2.95, jz = CZ + Math.sin(jb) * 2.95; S.jPos = new V(jx, 0, jz);
  try { if (justin.model && justin.mixer) { const sk = await figuren_skc(), c = justin_nachbildKlon(sk(justin.model)); const g = new THREE.Group(); g.add(c); g.position.set(jx, 0, jz); g.rotation.y = Math.atan2(CX - jx, CZ - jz); N.add(g);
      const mx = new THREE.AnimationMixer(c), idle = justin.acts.idle; if (idle) { mx.clipAction(idle.getClip()).play(); mx.update(1.3); } weiss_ghostify(c); S.jGhost = g; S.jGhostMx = mx;
      // dunkler Umriss derselben Haltung für die Blitze durch Lukes Augen (beim Laden angelegt, damit nichts nachübersetzt wird)
      const c2 = justin_nachbildKlon(sk(justin.model)), g2 = new THREE.Group(); g2.add(c2); const sil = new THREE.MeshStandardMaterial({ color: 0x0b0b0d, roughness: .9 }); c2.traverse(m => { if (m.isMesh) { m.material = sil; m.frustumCulled = false; } });
      const mx2 = new THREE.AnimationMixer(c2); if (idle) { mx2.clipAction(idle.getClip()).play(); mx2.update(1.3); } g2.position.set(X3 + 2, 0, Z3 - 1.2); g2.visible = false; scene.add(g2); S.jSil = g2; S.jSilPar = scene;
      g2.traverse(b => { if (b.isBone && b.name === 'hand_l') S.jsHandL = b; });
      g.updateMatrixWorld(true); c.traverse(b => { if (b.isBone && b.name === 'hand_l') S.jgHandL = b; if (b.isBone && b.name === 'hand_r') S.jgHandR = b; }); } } catch (e) { console.warn('weiss Ritter-Nachbild', e); }
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
  try { await figuren_embody(graukind, 'graue'); const g = new THREE.Group(); g.visible = false; scene.add(g); await figuren_embody(g, 'graukind'); S.miraK = g; } catch (e) { console.warn('weiss Kleine', e); }
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

  // ================= Fassung 3 (AP-17): Raum 1 (Gegenstände, Kreidefrage), Raum 2 (Voss), Nacht 1312 (Luna, Mira, Riss, sechs Kinder), Abgrund (Behaltene, Lichtschiff)
  try { await weiss_f3Bau(N, A, CX, CZ, lantern, flameT, glowT); } catch (e) { console.warn('weiss Fassung 3', e); }
  try { await weiss_luecken(N, A, CX, CZ); } catch (e) { console.warn('weiss Abgleich Kap. 3', e); } // Hände, Ring, Brandmal, Schleifspur, Kreisel, Nachtlicht-Fisch, Spieluhr

  // Raum 3 beginnt als Nacht: Stühle, sitzende Kinder und die Kleine erst in Teil 2
  weiss_teil2Sichtbar(false); N.visible = true; // Nacht ist ab jetzt der Ausgangszustand des Raums (Lichter dort erst ab offener Tür gedimmt)
  S.ok = true;
}]);
function weiss_chairs() { const IK = typeof innen_kapitel_S !== 'undefined' ? innen_kapitel_S : null; return IK && IK.inst && IK.inst['chair**'] || []; }
function weiss_teil2Sichtbar(on) { weiss_chairs().forEach(m => m.visible = on); kids.forEach(K => K.k.visible = on); graukind.visible = on;
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
function weiss_schrank() { if (ch3.schrank) return toast('Leer. Nur ein Paar Kinderschuhe, Größe 33.', 3000); ch3.schrank = true; { const K = weiss_S.schrank; Audio.creak(.2, K ? K.x : X3 + 14, 1.2, K ? K.z : Z3 + 4); }
  openNote('Der Schrank', 'Leer. Nur ein Paar Kinderschuhe, Größe 33.', null, () => { if (weiss_S.jSaid) return; weiss_S.jSaid = true;
    say([['Nicht deine. Nicht Lucys.', 2600, 'DU'], ['„Der Knabe, der hier schlief … Lass ihn. Sieh nicht so genau hin.“', 4400, JS]]); }); }

// ---------------------------------------------------------------- Raum 2: Hilde (K3-7) und die Uhr (T7)
const WEISS_HILDE = [
  { k: 'kueche', q: 'Sie haben mich angegriffen. In der Küche.', a: '„Ich wollte dich festhalten, Junge. Weg von der Tür. Du warst schneller. Du warst immer schneller als der andere.“' },
  { k: 'los', q: 'Sie haben Zayn gezogen.', a: '„Das Los war das Los. Ich hab siebzehn Jahre gezählt, ob sie ihn wieder hergibt. Sie hat nie.“' },
  { k: 'wer', q: 'Wer hat angefangen?', a: '„Frag ihn nicht, was sie will. Frag ihn nach seiner Hand.“' }, // Fassung 3: Kap. 3 UK 12
  { k: 'jonas', q: 'Und Jonas?', a: '„Er ruft jeden Sonntag an. Ich geh nie ran. Wenn ich seine Stimme höre, zähl ich falsch.“', nur: () => weiss_has('zayn_rucksack') }];
hildeTalks = async function () {
  ch3.hildeSpoke = true; state.talking = true; const W = 'HILDE WENDT';
  await say([['Am Küchentisch sitzt Frau Wendt. Die Frau, die das Licht vor deinen Augen nach oben gerissen hat.', 4400], ['„Luke. Oder wie immer du heißt.“', 2800, W], ['„So lange hab ich auf meinen Zayn gewartet. Jetzt bin ich bei ihm. Nur anders, als ich wollte.“', 4400, W]]);
  state.talking = false; weiss_hildeFragen();
};
function weiss_hildeFragen() { const S = weiss_S, open = WEISS_HILDE.filter(f => !S.asked.has(f.k) && (!f.nur || f.nur())); if (!open.length) return weiss_hildeEnde();
  let pick = null;
  openPuzzle(`<h3>FRAU WENDT</h3><p>Sie sieht dich an und wartet.</p><div class="row" style="flex-direction:column;align-items:center;gap:12px">${open.map(f => `<button data-k="${f.k}" style="min-width:380px">${f.q}</button>`).join('')}<button data-k="-" style="min-width:380px;opacity:.75">NICHTS MEHR FRAGEN</button></div>`, box => {
    box.querySelectorAll('button[data-k]').forEach(b => b.onclick = e => { e.stopPropagation(); pick = b.dataset.k; closeOverlay(); }); });
  ui.onClose = () => setTimeout(() => weiss_hildeAntwort(pick), 250); }
async function weiss_hildeAntwort(k) { const S = weiss_S, f = WEISS_HILDE.find(x => x.k === k); if (!f) return weiss_hildeEnde();
  S.asked.add(k); state.talking = true; await say([[f.q, 2600, 'DU'], [f.a, 4200, 'HILDE WENDT']]); state.talking = false;
  if (k === 'wer' && !weiss_has('c3_hilde_versteck')) story.lore.push({ key: 'c3_hilde_versteck', title: 'Hilde in Nimmerheim', html: '„Frag ihn nicht, was sie will. Frag ihn nach seiner Hand.“' });
  weiss_hildeFragen(); }
async function weiss_hildeEnde() { if (weiss_S.hildeEnde) return; weiss_S.hildeEnde = true; state.talking = true;
  await say([['„Die Uhr da. Stell sie auf die Zeit, zu der sie dich gebracht haben. Dann lässt es euch durch.“', 4600, 'HILDE WENDT']]);
  state.talking = false; setC3('Stell die Küchenuhr auf die Zeit, zu der man dich gebracht hat.'); }
room2Solved = async function () {
  ch3.room2 = true; Audio.chime(); state.talking = true;
  await say([['Die Uhr schlägt einmal. Frau Wendt steht auf und geht zur Tür.', 3800], ['„Zähl für mich weiter.“', 2800, 'HILDE WENDT']]);
  const fd = $('fade'); fd.style.background = '#e8ecf0'; await fade(.55, 700); hilde.visible = false; await fade(0, 1100); fd.style.background = '#000';
  await say([['Sie löst sich auf wie Atem an einer Scheibe.', 3200], ['Justin steht in der Tür. Er sieht dich nicht an.', 3000], ['„Komm. Der letzte Raum. Da wollte ich nie mit jemandem hin.“', 3400, JS]]);
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
  await say([['„Das ist die Nacht. Ich seh sie jedes Mal, wenn ich reinkomme. Sie ist immer gleich.“', 4400, JS], // Fassung 3: Justin-Dossier 3.11 (Deduktion nach 02 B9: AP-17)
    ['„Sie ging hinein, für Luna. Ich hatte ihre Hand. Der Riss kam, und er zog, und das Licht hat mir die Haut verbrannt.“', 5600, JS], ['„Sie hat losgelassen. Ich hielt, bis das Licht mir die Hand nahm.“', 4200, JS]]);
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
  justin_knien(true); await wait(1400); // AP-12: Knien ohne Clip (Becken sinkt, Knie beugen)
  await say([['„Ich hab’s nicht gewollt. Es hat gebrannt, und ich hab geschrien, und dann war die Hand auf. Einfach auf. Wie vom Topf.“', 5600, JS], // Fassung 3: Justin-Dossier 3.12
    ['„Jede Nacht hab ich’s anders erzählt. Irgendwann glaubt man sich.“', 4000, JS], ['„Mira.“', 2400, JS]]);
  await wait(900); await say([['Sie hat gehalten.', 2600, 'DU'], ['„Ja.“', 1800, JS]]);
  justin_knien(false); await wait(900); await justin_sprich('aufstehen', { frei: false }); // AP-12: 3.12, im Aufstehen
  if (!weiss_has('c3_1312')) story.lore.push({ key: 'c3_1312', title: 'Die Nacht von 1312', html: '„Sie hat losgelassen. Ich hielt, bis das Licht mir die Hand nahm.“\n\nStiefel. Hufe. Sie kommen vom Hof und enden genau an der Kante.\n\n„Ich hab’s nicht gewollt. Es hat gebrannt, und ich hab geschrien, und dann war die Hand auf. Einfach auf. Wie vom Topf.“\n„Jede Nacht hab ich’s anders erzählt. Irgendwann glaubt man sich.“\n\nSie hat gehalten.' });
  questPop('NACHBILD', 'Die Nacht von 1312'); await wait(1600); weiss_teil2(); }

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
  state.talking = true; await say([['Das war nie ein UFO. Das ist ein Tier, und es ist krank.', 3800, 'DU']]); state.talking = false;
  // 1: Justin tritt mit Luke an der Hand in den Kreis
  await weiss_beat('step', null, 8000); weiss_glocke(); state.talking = true; S.counting = false;
  subtitle('Justin tritt mit dir an der Hand in den Kreis.', 3200); jWalk(CX - 3.8, CZ - .3); await weiss_glide(CX - 3.9, CZ + .8, 2.8);
  await say([['„… Papa?“', 2600, 'DAS KIND']]); S.miraFace = 'justin'; await wait(700); S.kleineT = 1.3; await wait(1600); state.talking = false;
  // 2: Gefunden
  await weiss_beat('look', kids.map(K => K.k.position.clone().setY(.9)), 9000); weiss_glocke(); state.talking = true;
  Audio.giggle(CX, 1.2, CZ); setTimeout(() => { for (let i = 0; i < 3; i++) { const K = kids[i * 2]; if (K) Audio.giggle(K.k.position.x, 1, K.k.position.z); } }, 900);
  await say([['„Bruder. Du hast ihn mitgebracht.“', 2800, 'DAS KIND'], ['Sie lacht, glücklich. Die sieben auf den Stühlen lachen mit, ohne Münder.', 4200]]); state.talking = false; // „Gefunden!“ erst im Finale (Kern §12)
  // 3: Bruder – Blitze durch Lukes Augen
  await weiss_beat('look', graukind.position.clone().setY(.9), 9000); weiss_glocke(); state.talking = true; S.miraFace = null;
  await say([['„Ich hab dich gemacht. Aus seiner Hand. Darum hast du seine Augen.“', 4600, 'DAS KIND'], ['„Ich hab die ganze Nacht durch dich geguckt.“', 3400, 'DAS KIND']]);
  await weiss_blitze(); await say([['„Papa mogelt. Er ruft und ruft, und er ist nicht da. Wie die Großen beim Verstecken, wenn sie keine Lust mehr haben.“', 5600, 'DAS KIND']]); state.talking = false; // sie weiß nichts von der Rüstung
  // 4: Der Helm
  await weiss_beat('look', justin.g.position.clone().setY(1.5), 9000); weiss_glocke(); await weiss_helmSzene();
  // 5: Zusatzzeilen (je eine, wenn vorhanden) und Peter (immer)
  await weiss_beat('step', null, 7000); weiss_glocke(); state.talking = true; const ex = [];
  if (ch3.myst.has('chronik')) ex.push(['„Siebenhundertvierzehn Jahre, Papa. Zweiundvierzig Mal hab ich gerufen.“', 4400, 'DAS KIND']);
  if (ch3.myst.has('albers')) ex.push(['„Der alte Mann mit dem Silberhut. Der guckt immer nach oben. Ich wink ihm.“', 4200, 'DAS KIND']);
  if (ch3.myst.has('buch')) ex.push(['„Die Frau hat so schön gezählt. Ich hab ihr zugehört, jede Nacht.“', 4000, 'DAS KIND']);
  if (ch3.myst.has('stimme')) ex.push(['„Du bist rangegangen. Endlich.“', 3000, 'DAS KIND']);
  ex.push(['„Onkel Peter ist heimgekommen. Du hast ihn warm gemacht.“', 3800, 'DAS KIND'], ['„Ich hab ihn herausgeführt, damals. An dieser Hand.“', 3600, JS]);
  await say(ex); state.talking = false;
  // 6: Ein Stück von Papa ist noch draußen
  await weiss_beat('look', graukind.position.clone().setY(.9), 8000); weiss_glocke(); state.talking = true;
  await say([['„Das Spiel ist erst aus, wenn alle gefunden sind. Papa ist gefunden. Fast.“', 4600, 'DAS KIND'], ['„Ein Stück von Papa ist noch draußen.“', 3200, 'DAS KIND']]); S.miraFace = 'du';
  await say([['Sie sieht dich an.', 2400]]); state.talking = false;
  // 7: Justins Angebot
  await weiss_beat('look', justin.g.position.clone().setY(1.5), 8000); weiss_glocke(); state.talking = true; justin.look = true;
  await say([['Du hättest es sagen können.', 2600, 'DU'], ['„Dann hättest du weggesehen.“', 2800, JS]]); state.talking = false; // Fassung 3: Justin-Dossier 3.13, Schlag 7
  // 8: Was will sie?
  await weiss_beat('step', null, 6000); weiss_glocke(); state.talking = true;
  const P = player.pos, dx = CX - P.x, dz = CZ - P.z, d = Math.hypot(dx, dz) || 1; jWalk(P.x + dx / d * 1.1, P.z + dz / d * 1.1, () => { justin.look = true; justin_knien(true); }); await wait(2000);
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

// Justin nimmt den Helm ab – das zweite und letzte Mal Gesicht (02 B1); im Visier Lukes Gesicht mit braunen Augen (AP-12: justin.js)
async function weiss_helmSzene() { const S = weiss_S; state.talking = true; justin.look = true; jPlay('idle');
  const g = justin.g, P = player.pos; g.rotation.y = Math.atan2(P.x - g.position.x, P.z - g.position.z); justin.look = false; await wait(200);
  const f = new THREE.Vector3(Math.sin(g.rotation.y), 0, Math.cos(g.rotation.y)), left = new THREE.Vector3(f.z, 0, -f.x); // Justins linke Seite
  // AP-12: Kamera über Lukes Schulter (Luke nie von vorn) auf Justins Gesicht; der Helm sinkt in seine linke Hand (justin_helmAb), dann langsam näher an das Gesicht
  void left; S.helmNah = false; const eye = new THREE.Vector3(P.x, 1.62, P.z), to = g.position.clone().setY(1.62).sub(eye).normalize(), rt = new THREE.Vector3(-to.z, 0, to.x), camA = eye.clone().addScaledVector(to, -.3).addScaledVector(rt, .22).add(_wv.set(0, .06, 0));
  const kopf = new THREE.Vector3(), hb = justin_S.bones.head; let nah = 0; setScripted(() => true); PERF_CULL.t = 0;
  setCamOverride((cam, dt) => { if (hb) hb.getWorldPosition(kopf); else kopf.copy(g.position).setY(1.75); kopf.y += .02; nah = Math.min(1, nah + (dt || .016) / 5.5 * (S.helmNah ? 1 : 0)); const e = nah * nah * (3 - 2 * nah);
    cam.position.copy(camA).lerp(_wc3.copy(kopf).addScaledVector(to, -1.05).addScaledVector(rt, .12).add(_wv.set(0, .03, 0)), e * .7); cam.lookAt(kopf); });
  const ab = justin_helmAb(); await say([['Justin nimmt den Helm ab.', 2600]]); await ab; S.helmNah = true;
  await say([['„Papa.“', 2400, 'DAS KIND']]); await wait(1800);
  await say([['„Ich hab es an der Kreuzung gewusst. Deine Augen. Ich hab dich gebraucht, damit sie mich sieht.“', 5200, JS], ['„Ich hatte kein anderes Fenster.“', 3000, JS]]); // Fassung 3: 3.13, Schlag 6
  setCamOverride(null); setScripted(null); state.talking = false; }
weiss_S.jHandL = () => { if (weiss_S._hl === undefined) { weiss_S._hl = null; if (justin.model) justin.model.traverse(b => { if (b.isBone && b.name === 'hand_l') weiss_S._hl = b; }); } return weiss_S._hl; };

// ---------------------------------------------------------------- Die Wahl (K3-10) und die Enden
showChoice = function () {
  if (ch3.choice) return; weiss_S.phase = 'wahl'; // Fassung 3 (Kern §12, AP-12): immer drei Antworten, kein Untertext
  const b = (id, t) => `<button id="${id}" style="min-width:380px">${t}</button>`;
  openPuzzle(`<h3>WAS WILL SIE?</h3><p>Justin wartet. Sieben Kinder sehen dich an.</p><div class="row" style="flex-direction:column;align-items:center;gap:14px">
    ${b('chA', '„Dich. Dass du bleibst.“')}${b('chB', '„Spielen. Sieben Kinder, wie damals.“')}${b('chC', '„Dass du sie suchst.“')}</div>`, box => {
    for (const c of ['A', 'B', 'C']) box.querySelector('#ch' + c).onclick = e => { e.stopPropagation(); ch3.choice = c; closeOverlay(); justin_antwort(c); };
  });
  ui.onClose = () => { if (!ch3.choice) setTimeout(showChoice, 400); };
};
// Vor jeder Kinosequenz: Raum 3 zurück in den Grundzustand (Nebel, Himmel, Decke, Helm, Lucy)
function weiss_aufraeumen() { const S = weiss_S; S.bw = null; S.helmHeld = false; if (S.helm) { S.helm.mesh.visible = false; S.helm.real.visible = true; } if (S.miraK) S.miraK.visible = false;
  if (S.lucy) S.lucy.visible = true; if (S.abgrund) S.abgrund.visible = false; if (S.env) weiss_env(null); weiss_licht(1); setCamOverride(null); setScripted(null); }
async function weiss_vorKino(id) { weiss_aufraeumen(); await weiss_kino(id); }
async function endingC() { return justin_antwort('C'); } // Fassung 3 (AP-12): Antwort C, Geschenk, „Noch eine Runde“, Abspann k3c, Endkarte in justin.js
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
    if (S.miraFace === 'weg') graukind.lookAt(2 * graukind.position.x - P.x, graukind.position.y, 2 * graukind.position.z - P.z); else if (S.miraFace === 'justin') graukind.lookAt(justin.g.position.x, graukind.position.y, justin.g.position.z);
    if (S.miraK) { S.kleineT = Math.max(0, S.kleineT - dt); const kl = S.kleineT > 0 && S.kleineT < 1.05; if (S.miraK.visible !== kl) { S.miraK.visible = kl; graukind.visible = !kl; } if (kl) { S.miraK.position.copy(graukind.position); S.miraK.quaternion.copy(graukind.quaternion); } }
    if (S.lucy) { S.flk -= dt; if (S.flk <= 0) { S.lucy.visible = !S.lucy.visible; S.flk = S.lucy.visible ? rand(.06, .55) : rand(.25, 1.6); } }
    if (S.counting) { S.cnt -= dt; if (S.cnt <= 0) { S.cnt = rand(2.2, 3); Audio.whisper(graukind.position.x, 1, graukind.position.z, 1.6); } }
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
// =====================================================================  FASSUNG 3 (AP-17): Nimmerheim nach Kap. 3 UK 10–14 (Wortlaute aus story_final.md)
// Übergang, Raum 1 (Gegenstände, Lösung Geburtstagskarte, Luke sagt die zweite Zeile), Raum 2 (Hilde mit „Wer ist der Neunte?“, Voss auf dem Stuhl, Uhr ohne Ziffern),
// Raum 3 (Deduktion an sechs Stellen, „Wessen Hand ist aufgegangen?“ MIRAS · JUSTINS, SB-07), Abgrund (Schläge 1–10, Kinosequenz „Blinzeln“), „Noch eine Runde“ mit Lucy.
const WEISS_F3 = { stellen: new Set(), fehl: 0, uhrFehl: 0, frage: false, voss: null, mira: null, riss: null, sb07: false };
function weiss_grau(obj, k = .6) { obj.traverse(m => { if (!m.isMesh) return; const arr = [].concat(m.material).map(x => { const c = x.clone(); if (c.color) c.color.multiplyScalar(k).lerp(new THREE.Color(.5, .52, .55), .55); return c; }); m.material = arr.length === 1 ? arr[0] : arr; }); }
async function weiss_f3Bau(N, A, CX, CZ) {
  const S = weiss_S, V = THREE.Vector3;
  // Abgrund: die Behaltenen auf den Stühlen (Kap. 3 UK 14): Zayn, Mike, Roxy, Hilde, Cleo, das Mädchen mit dem Kreisel; Lucy (erwachsen, flackernd) statt des Kindes auf ihrem Stuhl
  const BES = ['zayn', null, 'mike', 'roxy', 'hilde', 'cleo', 'gezaehlt_m'];
  for (let i = 0; i < kids.length && i < BES.length; i++) { if (!BES[i]) continue; try { const P = await figuren_embody(kids[i].k, BES[i], { sit: BES[i] === 'hilde' ? .48 : .52 }); if (P) weiss_grau(P.obj); } catch (e) { console.warn('weiss Behaltene', BES[i], e); } }
  if (kids[0] && typeof figuren_hund === 'function') figuren_hund(null, 0, 0, { an: kids[0].k, ab: [.22, .58], grau: true }); // Q-6: Bruno, grau wie Zayn, zu seinen Füßen (Bibel UK 14 / Blinzeln 8,0 s)
  // Raum 1: Gegenstände nach Kap. 3 UK 11
  const R = r1Items; R.spieluhr.name = 'Die Spieluhr'; R.spieluhr.text = 'Lucys. Sie stand immer bei ihm, weil sie Angst hatte, dass sie nachts angeht.';
  R.licht.name = 'Das blaue Nachtlicht'; R.licht.text = 'Sein Fisch. Der ging beim Umzug kaputt. Nein. Der ging kaputt, als ich elf war.';
  R.kalender.name = 'Der Kalender'; R.kalender.text = '27. Sommerfest. Ausrufezeichen. Er hat sich gefreut.';
  R.zeichnung.name = 'Eine Zeichnung'; R.zeichnung.text = 'Das Laternenfest, in Wachsmalstift, „für Luke von Dina“. Am Rand hat sie einen gemalt, der keine Farbe hat. Ohne Gesicht. Als würde man ihn nur halb sehen. Wir haben ihn alle so gemalt. Ich auch.';
  R.karte.name = 'Eine Geburtstagskarte'; R.karte.text = 'Vorne ein Clown mit Luftballons, die Zahl 10 in Glitzer. Innen: „Zum 10. Geburtstag, Luke! Deine Oma Erna.“ Darunter, in Omas steiler Schrift: „Nicht alles auf einmal für Süßes. Ich seh das.“ Fünf Euro mit Büroklammer.';
  for (const [k, it] of Object.entries(R)) { uninteract(it.m); interact(it.m, () => it.name, () => weiss_r1Sehen(k, it)); }
  // Raum 2: Pfarrer Voss als erwachsener Behaltener auf einem Stuhl an der Wand (grau, Laterne ohne Kerze); Vorlage: Erwachsenen-Rig, dunkel getönt
  try { const g = new THREE.Group(); g.position.set(X3 + 21.3, 0, Z3 - 4.9); g.rotation.y = .5; scene.add(g); const P = await figuren_embody(g, 'voss', { sit: .46 }); // Q-6: Voss im Talar (Ersatz amt1)
    if (P) weiss_grau(P.obj, .35);
    WEISS_F3.voss = g; const h = box(.8, 1.4, .8, g.position.x, .7, g.position.z, hidden, { cast: false }); h.userData.noCol = true; interact(h, 'Der Mann auf dem Stuhl', () => weiss_voss()); } catch (e) { console.warn('weiss Voss', e); }
  // Raum 3: Mira (Nachbild) vor dem Ritter, der Riss vor ihrem Gesicht; Luna ganz vorn am Rand
  try { const jb = .3, mx = CX + Math.cos(jb) * 2.25, mz = CZ + Math.sin(jb) * 2.25, g = new THREE.Group(); g.position.set(mx, 0, mz); g.rotation.y = Math.atan2(CX - mx, CZ - mz); N.add(g);
    const P = await figuren_embody(g, 'mira', { clip: 'walk' }); if (P) { if (P.cur) P.cur.timeScale = 0; P.mx.update(.4); weiss_ghostify(P.obj); } WEISS_F3.mira = g; // Q-6: Miras eigene Figur (Locken mit Scharlachschimmer; Ersatz dina_erw, solange nicht gebaut)
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(.34, 2.3), weiss_decalMat(WEISS_TEX.spalt(), { rough: 1 })); sp.position.set(CX + Math.cos(jb) * 1.55, 1.2, CZ + Math.sin(jb) * 1.55); sp.rotation.y = g.rotation.y; N.add(sp); WEISS_F3.riss = sp; } catch (e) { console.warn('weiss Mira', e); }
  try { const a = Math.PI, lx = CX + Math.cos(a) * 2.45, lz = CZ + Math.sin(a) * 2.45, g = new THREE.Group(); g.position.set(lx, 0, lz); g.rotation.y = Math.atan2(CX - lx, CZ - lz); N.add(g);
    const P = await figuren_embody(g, 'graukind', { clip: 'walk' }); if (P) { if (P.cur) P.cur.timeScale = 0; P.mx.update(.2); weiss_ghostify(P.obj); } WEISS_F3.luna = g; } catch (e) { console.warn('weiss Luna', e); }
  // Stellen der Deduktion (unsichtbare Flächen, erst mit SB-07 ansprechbar)
  const J = S.jPos || new V(CX + 2.8, 0, CZ + .9), M = WEISS_F3.mira ? WEISS_F3.mira.position : J, L = WEISS_F3.luna ? WEISS_F3.luna.position : new V(CX - 2.4, 0, CZ), Ri = WEISS_F3.riss ? WEISS_F3.riss.position : M;
  const mk = (w, h, d, x, y, z) => { const b = box(w, h, d, x, y, z, hidden, { cast: false }); b.userData.noCol = true; return b; };
  WEISS_F3.spots = { mira: mk(.6, .9, .6, (M.x + J.x) / 2, .95, (M.z + J.z) / 2 + .15), handschuh: mk(.45, .6, .45, (M.x + J.x) / 2 + .2, 1.05, (M.z + J.z) / 2 - .25), luna: mk(.8, 1.2, .8, L.x, .6, L.z),
    riss: mk(.5, 2, .5, Ri.x, 1, Ri.z), stiefel: mk(.6, .4, .6, J.x - .25, .2, J.z) };
}
function weiss_r1Sehen(k, it) { it.seen = true; openNote(it.name, it.text, null, () => {
  if (k === 'kalender' && !WEISS_F3.kal) { WEISS_F3.kal = true; subtitle('Der Abend vor dem Achtundzwanzigsten. Alles hier ist von diesem Abend.', 4200, 'LUKE'); }
  if (k === 'zeichnung') { if (typeof justin_rh === 'function') justin_rh('RH-5'); if (typeof justin_sprich === 'function' && !state.talking) justin_sprich('wise5'); } }); }
// Übergang (UK 10): Weißblende, nur Whiskeys Flügel; Justins Satz
enterWhite = async function () {
  ch3.part = 'white'; ch3.pillarK = 0; ch3.chase = 'done'; $('fade').style.background = '#fff'; try { Audio.flap(player.pos.x, 2, player.pos.z); } catch (e) {} await fade(1, 1800);
  state.inBasement = true; Audio.hum(false); Audio.chaseMusic(false); Audio.setArea(true, true);
  player.pos.set(X3 + 1.6, 0, Z3); player.yaw = -PI / 2; player.pitch = 0; vel.set(0, 0, 0); camY = 1.65;
  jPlace(X3 + 3.2, Z3 + 1.3, -PI / 2); justin.g.visible = true; justin.look = true; flashOn = false; if (typeof kapitel3_uk_setzen === 'function') kapitel3_uk_setzen(11);
  await wait(600); await fade(0, 2200); $('fade').style.background = '#000';
  state.talking = true; await say([['Kein Oben, kein Unten. Weiß, das nach Sommer riecht, nach gemähtem Gras und heißem Asphalt.', 4400], ['„Es baut aus dem, was es genommen hat. Zimmer, Küchen, Wiesen. Es zeigt dir, was du kennst. Eins davon lügt. Immer.“', 5400, JS]]);
  state.talking = false; setC3('Geh Justin nach.'); };
// Raum 1 betreten / Ablauf in Nimmerheim (ersetzt c3WhiteUpdate der Basis: nur die Zeilen sind neu)
c3WhiteUpdate = (o => function (dt, t) {
  const P = player.pos;
  if (!ch3.r1Seen && P.x > X3 + 8.6) { ch3.r1Seen = true; setC3('Finde, was nicht in diese Nacht gehört. Die Frage steht an der Tür.'); state.talking = true;
    say([['„Dein Zimmer.“', 1800, JS], ['„Nein. Seines. Der Abend, bevor er ging.“', 3200, JS]]).then(() => { state.talking = false; }); }
  return o(dt, t); })(c3WhiteUpdate);
room1Answer = async function (k) {
  if (k === 'karte') { ch3.room1 = true; Audio.chime(); r1Items.karte.m.visible = false; uninteract(r1Items.karte.m); door1w.set(true); Audio.slide(X3 + 20, Z3); setC3('Geh weiter.'); state.talking = true;
    await say([['Die Karte zerfällt zu weißem Staub. Die Tür gleitet auf.', 3000], ['„Den zehnten Geburtstag hat der Knabe, der hier schlief, nie gehabt.“', 4200, JS], ['Ich schon. Das ist meine Erinnerung. Nicht seine.', 3200, 'DU']]);
    state.talking = false; if (typeof kapitel3_uk_setzen === 'function') kapitel3_uk_setzen(12); return; }
  ch3.tries1++; glitchV = .6; const K = weiss_S.schrank; Audio.giggle(K ? K.x : X3 + 14, 1, K ? K.z : Z3 + 4); subtitle('Nein. Das war hier. In dieser Nacht.', 3200);
  const L = r1Items.licht.m.material; if (L && L.emissiveIntensity !== undefined) { const e0 = L.emissiveIntensity; [0, .2, .9, 0, 1].forEach((f, i) => setTimeout(() => L.emissiveIntensity = e0 * f, 90 * i)); setTimeout(() => L.emissiveIntensity = e0, 700); }
  if (ch3.tries1 === 2) setTimeout(() => { if (!state.talking) say([['„Alles hier gab es am Abend, bevor er ging. Was gab es erst danach?“', 4400, JS]]); }, 1400);
  if (ch3.tries1 === 3) { const m = r1Items.karte.m.position; setTimeout(() => { const dx = m.x - camera.position.x, dy = m.y - camera.position.y, dz = m.z - camera.position.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }, 900); }
  if (ch3.tries1 >= 4) setTimeout(() => subtitle('Oma hat mir zum Zehnten fünf Euro geschenkt. Mir.', 3600, 'LUKE'), 1400); };
weiss_schrank = function () { if (ch3.schrank) return toast('Leer. Kleiderbügel, ein Anorak, ein Paar Kinderschuhe, Größe 33.', 3000); ch3.schrank = true; { const K = weiss_S.schrank; Audio.creak(.2, K ? K.x : X3 + 14, 1.2, K ? K.z : Z3 + 4); }
  openNote('Der Schrank', 'Leer. Kleiderbügel, ein Anorak, unten ein Paar Kinderschuhe Größe 33 mit Klettverschluss, sauber nebeneinander.', null, () => { if (weiss_S.jSaid) return; weiss_S.jSaid = true;
    const P = player.pos; weiss_atem(.06, P.x + Math.sin(player.yaw) * .9, 1.2, P.z + Math.cos(player.yaw) * .9); // das Atmen geht weiter, jetzt hinter Luke
    say([['Nicht meine. Nicht Lucys.', 2600, 'DU'], ['„Lass ihn zu. Sieh nicht so genau hin.“', 3400, JS]]); }); };
// Raum 2: Hilde (UK 12) – fünf Fragen, „Wer ist der Neunte?“ nur mit dem Zählbuch, Jonas nur mit Zayns Rucksack
WEISS_HILDE.length = 0; WEISS_HILDE.push(
  { k: 'kueche', q: 'Sie haben mich angegriffen. In der Küche.', a: '„Ich wollte dich festhalten, Junge. Weg von der Tür. Du warst schneller. Du warst immer schneller als der andere.“' },
  { k: 'los', q: 'Sie haben Zayn gezogen.', a: '„Das Los war das Los. Ich hab siebzehn Jahre gezählt, ob sie ihn wieder hergibt. Sie hat nie.“' },
  { k: 'wer', q: 'Wer hat angefangen?', a: '„Frag ihn nicht, was sie will. Frag ihn nach seiner Hand.“' },
  { k: 'nichtdu', q: 'Was hieß ‚Nicht du‘?', a: '„Ich hab den anderen erwartet. Den mit den blauen Augen. Der kommt manchmal ans Küchenfenster, wenn das Brot nicht da ist.“', a2: '„Dann standst du da, mit seiner Narbe in der Hand. Da wusst ich, wer dich gerufen hat.“' }, // Story-Prüfung V-5
  { k: 'neun', q: 'Wer ist der Neunte?', a: '„Einer von früher. Klein wie ein Kind, aber keins. Der zählt mit. Der ist nicht von ihr.“', a2: '„Er hat mir mal einen Zettel gebracht. Ich hab ihn nicht gelesen. Man liest so was nicht.“', nur: () => story.items.includes('buch') || weiss_has('c3buch') },
  { k: 'jonas', q: 'Und Jonas?', a: '„Er ruft jeden Sonntag an. Ich geh nie ran. Wenn ich seine Stimme höre, zähl ich falsch.“', nur: () => weiss_has('zayn_rucksack') || (typeof neben3_hat === 'function' && neben3_hat('k3_rucksack')) });
weiss_hildeAntwort = async function (k) { const S = weiss_S, f = WEISS_HILDE.find(x => x.k === k); if (!f) return weiss_hildeEnde();
  S.asked.add(k); state.talking = true; await say([[f.q, 2600, 'DU'], [f.a, 4400, 'HILDE WENDT']]); if (f.a2) await say([[f.a2, 4200, 'HILDE WENDT']]);
  if (k === 'wer') { justin.look = false; await wait(1200); justin.look = true; } state.talking = false; weiss_hildeFragen(); };
drawClock = function () { const c = clockTex.image.getContext('2d'), w = 256, [h, m] = ch3.clock; c.clearRect(0, 0, w, w); c.fillStyle = '#f2efe6'; c.beginPath(); c.arc(w / 2, w / 2, 124, 0, 7); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 6; c.stroke(); // keine Ziffern (UK 12)
  const hand = (a, l, wd) => { c.lineWidth = wd; c.beginPath(); c.moveTo(w / 2, w / 2); c.lineTo(w / 2 + Math.cos(a) * l, w / 2 + Math.sin(a) * l); c.stroke(); };
  hand(((h % 12) + m / 60) / 12 * PI * 2 - PI / 2, 56, 8); hand(m / 60 * PI * 2 - PI / 2, 88, 5); clockTex.needsUpdate = true; };
// Fehlversuche an der Uhr zählen (die Basis setzt die Zeiger dann auf zwölf zurück): nach zwei Fehlern Justin
{ const toast0 = toast; toast = function (t, ms) { if (typeof t === 'string' && t.startsWith('Die Zeiger springen zurück auf zwölf') && ch3.part === 'white') { WEISS_F3.uhrFehl++;
      if (WEISS_F3.uhrFehl === 1) setTimeout(() => subtitle('Jede Uhr im Dorf ist heut Nacht bei derselben Minute stehen geblieben.', 4000, 'LUKE'), 3600);
      if (WEISS_F3.uhrFehl === 2) setTimeout(() => { if (!state.talking) say([['„Die dritte Stunde. Dreizehn Atemzüge.“', 3400, JS]]); }, 3600); }
    return toast0.apply(this, arguments); }; }
async function weiss_voss() { if (state.talking) return; state.talking = true;
  try { const kennt = typeof neben3_hat === 'function' && neben3_hat('k3_predigt');
    await say([['Ein Pfarrer. Grau wie die Kinder. Ich dachte, sie behält nur Kinder.', 3800, 'LUKE']]);
    if (!WEISS_F3.vossJ) { WEISS_F3.vossJ = true; await say([['„Der wollte die Kinder aus dem Dorf bringen. Die in den grauen Mänteln haben die Straße zugemacht.“', 5000, JS], ['„Da hat er sie in den Keller unter der Kapelle gebracht. Und ist selbst in den Nebel gegangen, damit sie einen hat.“', 5400, JS]]); }
    if (kennt && !WEISS_F3.vossK) { WEISS_F3.vossK = true; await say([['Voss. Das ist Pfarrer Voss.', 2600, 'DU']]); if (story.items.includes('predigtmappe')) await say([['Ich bring Ihnen die Reifen in Ordnung.', 3000, 'DU']]); }
    if (!kennt && !weiss_has('c3_behalten_voss')) story.lore.push({ key: 'c3_behalten_voss', title: 'Behaltene', html: 'Ein Erwachsener. Ein Pfarrer?' });
  } finally { state.talking = false; } }
room2Solved = async function () {
  ch3.room2 = true; Audio.chime(); state.talking = true;
  await say([['Die Uhr schlägt einmal. Frau Wendt steht auf und geht zur Tür. Sie bleibt neben dir stehen, ohne dich anzusehen.', 4600]]);
  if (!weiss_has('z7_dienstbuch')) await say([['„Ich hab die Lose gezogen, Junge. Auch seins.“', 3400, 'HILDE WENDT']]);
  await say([['„Zähl für mich weiter.“', 2800, 'HILDE WENDT']]);
  const fd = $('fade'); fd.style.background = '#e8ecf0'; await fade(.55, 700); hilde.visible = false; await fade(0, 1100); fd.style.background = '#000';
  const V = WEISS_F3.voss; if (V) { const P = player.pos; V.rotation.y = Math.atan2(P.x - V.position.x, P.z - V.position.z); }
  await say([['Der Pfarrer auf dem Stuhl dreht den Kopf zu dir, zum ersten Mal, und nickt, ganz leicht.', 3800], ['„Komm. Der letzte Raum. Da wollte ich nie mit jemandem hin.“', 3400, JS]]);
  state.talking = false; weiss_licht(.12); door2w.set(true); Audio.slide(X3 + 32, Z3); setC3('Der letzte Raum.'); weiss_S.phase = 'tuer'; if (typeof kapitel3_uk_setzen === 'function') kapitel3_uk_setzen(13); };
// Raum 3 (UK 13): Justins Fassung, SB-07 im Reif, Deduktion an sechs Stellen, Tafel ab drei Stellen
const WEISS_STELLEN = {
  mira: ['Miras rechte Hand', 'Die Finger sind zu. Gekrümmt bis in die Spitzen. Die greift noch. Die hat nicht losgelassen.'],
  handschuh: ['Der Panzerhandschuh des Nachbild-Ritters', 'Offen. Die Finger gespreizt, als wäre etwas Heißes drin gewesen. Innen ist das Leder verbrannt. Halbrund.'],
  ring: ['Der Ringabdruck', 'Ihr Ring. Ein halber Mond, silbern. Er sitzt außen an ihrem Finger. Der hat sich in eine fremde Handfläche gebrannt. Das geht nur, wenn die andere Hand fest zu war, als es heiß wurde. Und jetzt ist sie auf.'],
  luna: ['Luna am Rand', 'Sie ruft was. Über die Schulter. Man sieht es am Mund: Such mich.'],
  riss: ['Der Riss', 'Alles zieht nach vorn. Ihr Haar. Der Vogel. Ihre Hand zeigt nach hinten. Sie hat sich gegen das Ziehen gestemmt. Bis zuletzt.'],
  stiefel: ['Der Stiefel des Ritters', 'Vorgerutscht, die Spitze schon über der Kante. Im Reif eine Schleifspur. Den hat es mitgezogen. Nicht sie.'] };
room3Scene = async function () {
  const S = weiss_S; if (ch3.room3) return; ch3.room3 = true; S.phase = 'nacht'; state.talking = true; justin.look = false; Audio.hum(false);
  jWalk(X3 + 35.4, Z3 + 1.7, () => { justin.g.rotation.y = Math.PI / 2 + 1.2; }); await wait(2600); // am Rand der Wiese, neben einer Birke; er sieht nicht hin
  await say([['„Das ist die Nacht. Ich seh sie jedes Mal, wenn ich reinkomme. Sie ist immer gleich.“', 4400, JS],
    ['„Sie ging hinein, für Luna. Ich hatte ihre Hand. Der Riss kam, und er zog, und das Licht hat mir die Haut verbrannt.“', 5600, JS], ['„Sie hat losgelassen. Ich hielt, bis das Licht mir die Hand nahm.“', 4200, JS]]);
  state.talking = false; setC3('Am Rand der Wiese liegt ein Blatt im Reif.');
  if (typeof sammeln_platz === 'function' && !(typeof sammeln_hatSB === 'function' && sammeln_hatSB(7))) try { sammeln_platz('SB-07', { x: X3 + 36.6, y: .03, z: Z3 - 1.4, ab: 3, label: 'Ein Blatt im Reif' }); } catch (e) { console.warn('SB-07', e); }
  S.phase = 'sb07'; };
function weiss_haendeAuftrag() { const S = weiss_S; if (S.phase !== 'sb07') return; S.phase = 'spuren'; setC3('Sieh dir die Hände an.');
  say([['„Sieh nicht auf sie. Sieh, wohin du willst.“', 3200, JS]]);
  const Sp = WEISS_F3.spots || {}; for (const [k, b] of Object.entries(Sp)) interact(b, () => (k === 'mira' && WEISS_F3.stellen.has('handschuh') && !WEISS_F3.stellen.has('ring')) ? 'Miras Hand noch einmal ansehen' : WEISS_STELLEN[k][0], () => weiss_stelle(k)); }
async function weiss_stelle(k) { const S = weiss_S; if (S.phase !== 'spuren' || state.talking || ui.overlay) return;
  if (k === 'mira' && WEISS_F3.stellen.has('mira') && WEISS_F3.stellen.has('handschuh') && !WEISS_F3.stellen.has('ring')) k = 'ring';
  WEISS_F3.stellen.add(k); state.talking = true; await say([[WEISS_STELLEN[k][1], 5200, 'LUKE']]); state.talking = false;
  if (WEISS_F3.stellen.size >= 3 && !WEISS_F3.frage) { WEISS_F3.frage = true; setTimeout(() => weiss_tafel(), 500); } }
function weiss_tafel() { const S = weiss_S; if (S.phase !== 'spuren' || ui.overlay) return;
  const li = Object.entries(WEISS_STELLEN).map(([k, v]) => `<div style="display:flex;gap:12px;align-items:baseline;margin:4px 0;font:17px 'Cormorant Garamond',Georgia,serif;color:${WEISS_F3.stellen.has(k) ? '#e8dcc0' : '#6e6556'}"><b style="width:18px">${WEISS_F3.stellen.has(k) ? '✓' : '·'}</b>${v[0]}</div>`).join('');
  openPuzzle(`<h3>WESSEN HAND IST AUFGEGANGEN?</h3><div style="max-width:440px;margin:6px auto 18px;text-align:left">${li}</div><div class="row"><button data-w="M" style="min-width:160px">MIRAS</button><button data-w="J" style="min-width:160px">JUSTINS</button></div><div class="row"><button data-w="-" style="opacity:.75">NOCH HINSEHEN</button></div>`, box => {
    box.querySelectorAll('button[data-w]').forEach(b => b.onclick = e => { e.stopPropagation(); const w = b.dataset.w; closeOverlay(); if (w !== '-') setTimeout(() => weiss_tafelWahl(w), 250); }); }); }
async function weiss_tafelWahl(w) { const S = weiss_S; if (S.phase !== 'spuren') return;
  if (w === 'J') return weiss_gestaendnisF3();
  WEISS_F3.fehl++; state.talking = true; await say([['„Ja. So war es.“', 1600, JS]]); await wait(1400); await say([['… Nein. Noch mal.', 2400, 'DU']]); state.talking = false;
  if (WEISS_F3.fehl === 2 && typeof whiskey_setzen === 'function') { const b = WEISS_F3.spots.handschuh.position; try { whiskey_setzen(b.x, b.y - .05, b.z); } catch (e) {} }
  if (WEISS_F3.fehl >= 3) { const b = WEISS_F3.spots.handschuh.position; const dx = b.x - camera.position.x, dy = b.y - camera.position.y, dz = b.z - camera.position.z; player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); }
  if (WEISS_F3.stellen.size >= 3) setTimeout(() => { if (!WEISS_F3.nachhilfe) { WEISS_F3.nachhilfe = true; subtitle('Einer von beiden hat die Hand noch zu.', 3400, 'LUKE'); } }, 1500); }
async function weiss_gestaendnisF3() { const S = weiss_S; S.phase = 'gestaendnis'; for (const b of Object.values(WEISS_F3.spots || {})) uninteract(b); state.talking = true; justin.look = false;
  await say([['Du sagst es nicht. Du siehst Justin an. Er sieht auf seine linke Hand. Er zieht den Handschuh aus. Die Handfläche: eine halbrunde Brandnarbe. Dieselbe wie deine.', 6400]]);
  await say([['Du hältst deine Hand daneben. Zwei halbe Monde.', 3200]]);
  await say([['„… Ihre Finger sind zu.“', 2600, JS], ['„Ich hab’s nicht gewollt. Es hat gebrannt, und ich hab geschrien, und dann war die Hand auf. Einfach auf. Wie vom Topf.“', 5600, JS],
    ['„Jede Nacht hab ich’s anders erzählt. Irgendwann glaubt man sich.“', 4000, JS], ['Sie hat gehalten.', 2400, 'DU'], ['„Ja.“', 1600, JS]]);
  justin_knien(true); await wait(1400); await say([['„Mira.“', 2400, JS]]); justin_knien(false); await wait(900);
  if (typeof sammeln_fibel === 'function') sammeln_fibel('sb07_strike');
  await say([['Zwei schmale nackte Füße, eine Frau, die Fersen tief im Reif, gegen den Zug.', 4200, 'NACHBILD'], ['Daneben ein großer Stiefel, der Stück für Stück zur Kante rutscht.', 4000, 'NACHBILD'],
    ['Sie zieht nach hinten. Er wird mitgenommen. Dann ein Schrei.', 3600, 'NACHBILD'], ['Dann ist nur noch der Stiefel da.', 3000, 'NACHBILD']]);
  await justin_sprich('aufstehen', { frei: false });
  if (!weiss_has('c3_1312')) story.lore.push({ key: 'c3_1312', title: 'Die Nacht von 1312', html: 'Luna ging hinein, sechs hinterher. Mira holte die sechs heraus und ging noch einmal. Justin hielt ihre Hand. Ein Riss zog.\n\n<span class="hand">Sie hat nicht losgelassen. Er. Seine Narbe ist meine.</span>' });
  questPop('NACHBILD', 'Die Nacht von 1312'); state.talking = false; await wait(1600); weiss_teil2(); }
// SB-07 aufgehoben → Aufgabe „Sieh dir die Hände an.“
WORLD_TICK.push(() => { if (weiss_S.phase === 'sb07' && typeof sammeln_hatSB === 'function' && sammeln_hatSB(7) && !ui.overlay) weiss_haendeAuftrag(); });
jHint = (o => async function () { if (ch3.part === 'white' && weiss_S.phase === 'spuren' && WEISS_F3.frage) return weiss_tafel(); return o(); })(jHint);
// Abgrund (UK 14): die Schläge, an Spieleraktionen gebunden; nach Schlag 3 die Kinosequenz „Blinzeln“
weiss_teil2 = async function () { const S = weiss_S, CX = X3 + 42, CZ = Z3; S.phase = 'abgrund'; state.talking = true;
  const fd = $('fade'); fd.style.background = '#fff'; await fade(1, 1100);
  S.night.visible = false; S.birchCols.forEach(([c]) => { c.minX = c.maxX = -9999; }); weiss_teil2Sichtbar(true); if (kids[1]) kids[1].k.visible = false; S.abgrund.visible = true; weiss_env('white');
  player.pos.set(CX - 7.6, 0, CZ + 1.2); player.yaw = -Math.PI / 2; player.pitch = .05; vel.set(0, 0, 0); jPlace(CX - 7.2, CZ - .2, Math.PI / 2); justin.look = false;
  S.miraFace = 'weg'; S.counting = true; Audio.hum(true); if (typeof kapitel3_uk_setzen === 'function') kapitel3_uk_setzen(14);
  await wait(250); await fade(0, 600); fd.style.background = '#000'; state.talking = false;
  subtitle('„… fünfzehn … sechzehn …“', 3000, 'LUNA');
  await weiss_beat('look', S.lampion ? S.lampion.position.clone().setY(22) : new THREE.Vector3(CX, 22, CZ), 9000);
  state.talking = true; await say([['Das war nie ein UFO. Das ist ein Tier, und es ist krank.', 3800, 'DU']]); state.talking = false;
  // 1 · Schritt
  await weiss_beat('step', null, 8000); state.talking = true; S.counting = false; jWalk(CX - 3.8, CZ - .3); await weiss_glide(CX - 3.9, CZ + .8, 2.8);
  await say([['„… Papa?“', 2400, 'LUNA']]); S.miraFace = 'justin'; await wait(500); S.kleineT = 1.3; await wait(1500); state.talking = false;
  // 2 · Ansehen
  await weiss_beat('look', kids.map(K => K.k.position.clone().setY(.9)), 9000); state.talking = true; Audio.giggle(CX, 6, CZ + 4);
  await say([['„Bruder. Du hast ihn mitgebracht.“', 2800, 'LUNA']]); state.talking = false;
  // 3 · Schritt – Blitze durch Lukes Augen, dann das Blinzeln
  await weiss_beat('step', null, 8000); state.talking = true; S.miraFace = null;
  await say([['„Ich hab dich gemacht. Aus seiner Hand. Darum hast du seine Augen.“', 4600, 'LUNA'], ['„Ich hab die ganze Nacht durch dich geguckt.“', 3400, 'LUNA']]);
  await weiss_blitze(); state.talking = false;
  if (typeof kino_play === 'function') { const env = S.env; weiss_teil2Sichtbar(false); if (S.lucy) S.lucy.visible = false; const gk = graukind.visible; graukind.visible = false;
    try { await kino_play('k3blinzeln', { mitte: [CX, CZ] }); } catch (e) { console.error('Kino k3blinzeln', e); }
    weiss_teil2Sichtbar(true); if (kids[1]) kids[1].k.visible = false; graukind.visible = gk; if (env === 'white' && S.env !== 'white') weiss_env('white'); }
  if (!weiss_has('c3_behalten_grete')) story.lore.push({ key: 'c3_behalten_grete', title: 'Behaltene', html: 'Ein kleines Mädchen mit einem Kreisel. Hat nicht nach mir gegriffen. Hat meine Hand angeguckt.' });
  // 4 · Luna, traurig
  state.talking = true; await say([['„Papa mogelt. Er ruft und ruft, und er ist nicht da. Wie die Großen beim Verstecken, wenn sie keine Lust mehr haben.“', 5600, 'LUNA']]); state.talking = false;
  // 5/6 · Justin ansehen: der Helm
  await weiss_beat('look', justin.g.position.clone().setY(1.5), 9000); await weiss_helmSzene();
  // 7
  state.talking = true; justin.look = true; await say([['Du hättest es sagen können.', 2600, 'DU'], ['„Dann hättest du weggesehen.“', 2800, JS]]);
  // 8 · Zusatzzeilen, je genau eine, wenn vorhanden
  const ex = [], hat = k => typeof neben3_hat === 'function' && neben3_hat(k);
  if (story.items.includes('buch') || weiss_has('c3buch')) ex.push(['„Die Frau hat so schön gezählt. Ich hab ihr zugehört, jede Nacht.“', 4000, 'LUNA']);
  if (ch3.callDone) ex.push(['„Du bist rangegangen. Endlich.“', 2800, 'LUNA']);
  if (hat('k3_rot') || ch3.side.ordner) ex.push(['„Der alte Mann mit dem Silberhut. Der guckt immer nach oben. Ich wink ihm.“', 4200, 'LUNA']);
  ex.push(['„Onkel Peter ist heimgekommen. Du hast ihn warm gemacht.“', 3800, 'LUNA'], ['„Ich hab ihn herausgeführt, damals. An dieser Hand.“', 3600, JS]);
  if (hat('k3_kapelle') || ch3.side.fenster) ex.push(['„Auf dem Fenster in der Kirche bin ich ganz vorn. Mit meiner Laterne. Die hab ich immer noch.“', 4600, 'LUNA']);
  if (hat('k3_klar') || ch3.side.klar) ex.push(['„Der mit den blauen Augen hat Klar gesagt. Der darf immer mitspielen.“', 4200, 'LUNA']);
  await say(ex);
  // 9
  await say([['„Das Spiel ist erst aus, wenn alle gefunden sind. Papa ist gefunden. Fast.“', 4600, 'LUNA'], ['„Ein Stück von Papa ist noch draußen.“', 3200, 'LUNA']]); S.miraFace = 'du';
  if (S.lucy) { S.flk = 0; } await say([['„Großer.“', 2200, 'LUCY (ohne Ton)']]); state.talking = false;
  // 10 · Was will sie?
  await weiss_beat('step', null, 6000); state.talking = true;
  const P = player.pos, dx = CX - P.x, dz = CZ - P.z, d = Math.hypot(dx, dz) || 1; jWalk(P.x + dx / d * 1.1, P.z + dz / d * 1.1, () => { justin.look = true; justin_knien(true); }); await wait(2000);
  await say([['„Du bist aus mir gemacht. Du träumst ihre Träume. Sag mir, Knabe: Was will sie?“', 5200, JS]]);
  state.talking = false; S.phase = 'wahl'; showChoice(); };
// „Noch eine Runde“: danach steht Lucy neben Luke und hält seine Hand (Hook um justin_runde, AP-12)
if (typeof justin_runde === 'function') justin_runde = (o => async function (...a) { await o.apply(this, a); if (weiss_S.lucy) weiss_S.lucy.visible = false;
  await say([['Lucys Stuhl flackert. Dann steht sie neben dir, nass, und hält deine Hand. Richtig. Fünf Finger, abgekaute Nägel.', 5200], ['„Großer. Du atmest immer noch.“', 3000, 'LUCY']]); await wait(600); })(justin_runde);

window.__weiss = { S: weiss_S, hints: weiss_hinweise, spur: n => weiss_spur(n), wahl: n => weiss_luegtWahl(n), teil2: () => weiss_teil2(), helm: () => weiss_helmSzene(), blitze: n => weiss_blitze(n), env: m => weiss_env(m), aufraeumen: weiss_aufraeumen,
  room3: () => room3Scene(), hilde: () => hildeTalks(), room2: () => room2Solved(), choice: () => showChoice(), endC: () => endingC() }; // Testzugriff

// ---------------------------------------------------------------- Abgleich Kap. 3 (Text gegen Welt): was Luke an den Händen und im Reif „sieht“ muss dort auch sein
// Rätsel „Wessen Hand ist aufgegangen?“: Miras rechte Hand geschlossen mit Ring (halber Mond), Handschuh des Ritters offen und innen verbrannt, Schleifspur im Reif hinter dem Stiefel.
// Bindepose-Annahme: Handflächen zeigen im Rest nach unten (T-/A-Pose); die Fingerdrehung wird daraus für jeden Knochen berechnet und jeden Takt auf die Grundpose gesetzt (überschreibt die Animation).
const _wlV = new THREE.Vector3(), _wlQ = new THREE.Quaternion(), _wlM = new THREE.Matrix4();
function weiss_knochenBind(b) { const root = weiss_wurzel(b); let sk = null; root.traverse(m => { if (!sk && m.isSkinnedMesh && m.skeleton.bones.indexOf(b) >= 0) sk = m.skeleton; }); if (!sk) return null; const i = sk.bones.indexOf(b); return new THREE.Matrix4().copy(sk.boneInverses[i]).invert(); }
function weiss_wurzel(b) { let o = b; while (o.parent && !(o.parent.isScene)) o = o.parent; return o; }
function weiss_fingerKetten(hand) { const k = {}; hand.traverse(b => { if (!b.isBone || b === hand) return; const m = /(thumb|index|middle|ring|pinky|little)/i.exec(b.name); if (!m) return; const f = m[1].toLowerCase().replace('little', 'pinky'); (k[f] = k[f] || []).push(b); });
  const tiefe = b => { let n = 0; for (let o = b; o && o.parent; o = o.parent) n++; return n; }; for (const f in k) k[f].sort((a, b) => tiefe(a) - tiefe(b)); return k; }
// job: { b, base, dq } – jeder Takt: b.quaternion = base * dq
function weiss_handPose(hand, o) { const jobs = [], K = weiss_fingerKetten(hand), p = o.palm || new THREE.Vector3(0, -1, 0), up = new THREE.Vector3(0, 1, 0); const bp = {}; const mat = b => (bp[b.uuid] || (bp[b.uuid] = weiss_knochenBind(b)));
  const mids = K.middle && K.middle[0] && mat(K.middle[0]); const pm = mids ? new THREE.Vector3().setFromMatrixPosition(mids) : null;
  for (const [f, ch] of Object.entries(K)) { const curl = (o.curl && o.curl[f] !== undefined ? o.curl[f] : o.curl && o.curl.all) || 0, spread = o.spread ? o.spread[f] || 0 : 0;
    for (let i = 0; i < Math.min(3, ch.length - 1); i++) { const b = ch[i], M = mat(b), Mn = mat(ch[i + 1]); if (!M || !Mn) continue; const pos = new THREE.Vector3().setFromMatrixPosition(M), pn = new THREE.Vector3().setFromMatrixPosition(Mn), d = pn.clone().sub(pos).normalize();
      const Rb = new THREE.Quaternion().setFromRotationMatrix(M.clone().extractRotation(M)), Ri = Rb.clone().invert(); let dq = new THREE.Quaternion();
      if (i === 0 && spread && pm) { const s = new THREE.Vector3().crossVectors(up, d), lat = pos.clone().sub(pm).dot(s), sg = Math.sign(lat) || 1; dq.multiply(new THREE.Quaternion().setFromAxisAngle(up.clone().applyQuaternion(Ri), sg * spread * Math.PI / 180)); }
      const a = new THREE.Vector3().crossVectors(d, p); if (a.lengthSq() > 1e-6) { a.normalize().applyQuaternion(Ri); const ang = (Array.isArray(curl) ? curl[i] : curl * (i === 0 ? .8 : i === 1 ? 1 : .7)) * Math.PI / 180; dq.multiply(new THREE.Quaternion().setFromAxisAngle(a, ang)); }
      jobs.push({ b, base: b.quaternion.clone(), dq }); } }
  return jobs; }
function weiss_handTick() { const J = weiss_S.handJobs; if (!J) return; for (const j of J) j.b.quaternion.copy(j.base).multiply(j.dq); }
// Schleifspur: abgeschabter Reif, zwei Fersenrillen, ausgerissene Halme am Rand
function weiss_schleifspur(N, J) { const ux = Math.cos(.3), uz = Math.sin(.3), c = kirchberg_cnv(512, 160, (x, w, h) => { x.clearRect(0, 0, w, h);
    for (const dy of [-26, 26]) { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(34,46,38,0)'); g.addColorStop(.25, 'rgba(34,46,38,.55)'); g.addColorStop(1, 'rgba(24,34,28,.9)'); x.strokeStyle = g; x.lineWidth = 20 + (dy > 0 ? 3 : 0); x.lineCap = 'round'; x.beginPath(); x.moveTo(8, h / 2 + dy * .3); x.bezierCurveTo(w * .35, h / 2 + dy * .4, w * .65, h / 2 + dy * .8, w - 20, h / 2 + dy); x.stroke(); }
    x.fillStyle = 'rgba(28,38,32,.35)'; x.beginPath(); x.moveTo(0, h / 2); x.quadraticCurveTo(w * .5, h * .2, w, h * .28); x.lineTo(w, h * .76); x.quadraticCurveTo(w * .5, h * .8, 0, h / 2); x.fill();
    for (let i = 0; i < 160; i++) { const px = kirchberg_r(30, w - 10), py = h / 2 + kirchberg_r(-46, 46); x.fillStyle = kirchberg_r() < .55 ? `rgba(240,248,255,${kirchberg_r(.2, .7)})` : `rgba(40,56,40,${kirchberg_r(.3, .8)})`; x.fillRect(px, py, kirchberg_r(2, 9), kirchberg_r(1, 3)); } }),
    m = new THREE.Mesh(new THREE.PlaneGeometry(1.7, .53).rotateX(-Math.PI / 2), weiss_decalMat(c, { color: 0xbfc8cc })); m.position.set(J.x + ux * .75, .038, J.z + uz * .75); m.rotation.y = Math.PI - .3; m.userData.noCol = true; N.add(m); return m; }
async function weiss_luecken(N, A, CX, CZ) { const S = weiss_S, T = THREE, V = T.Vector3, F3 = WEISS_F3; S.handJobs = [];
  // Schleifspur hinter dem Stiefel des Ritters
  if (S.jPos) F3.schleif = weiss_schleifspur(N, S.jPos);
  // Miras rechte Hand: Finger zu, gekrümmt; Ring mit halbem Mond am Ringfinger
  try { const P = F3.mira && F3.mira.userData.person; if (P) { let hr = null; P.obj.traverse(b => { if (!hr && b.isBone && /RightHand(_\d+)?$/.test(b.name)) hr = b; });
      if (hr) { S.handJobs.push(...weiss_handPose(hr, { curl: { all: 82, thumb: 40 } }));
        const K = weiss_fingerKetten(hr), rg = K.ring && K.ring[0], rn = K.ring && K.ring[1]; if (rg && rn) { const s = 1 / (rg.getWorldScale(new V()).x || 1), dir = rn.position.clone().normalize(), q = new T.Quaternion().setFromUnitVectors(new V(0, 0, 1), dir);
          const silber = new T.MeshStandardMaterial({ color: 0xd8dce0, roughness: .22, metalness: 1 }), g = new T.Group(); g.scale.setScalar(s); g.position.copy(rn.position).multiplyScalar(.5); g.quaternion.copy(q);
          g.add(new T.Mesh(new T.TorusGeometry(.0092, .0016, 8, 24), silber)); const mond = new T.Mesh(new T.CircleGeometry(.0058, 16, 0, Math.PI), silber); mond.position.set(.0092, 0, 0); mond.rotation.set(0, Math.PI / 2, 0); mond.scale.set(1, 1, 1); g.add(mond);
          const mond2 = mond.clone(); mond2.rotation.y = -Math.PI / 2; g.add(mond2); g.traverse(m => { if (m.isMesh) { m.userData.noCol = true; m.castShadow = false; } }); rg.add(g); F3.ring = g; } } } } catch (e) { console.warn('weiss Miras Hand', e); }
  // Handschuh des Ritters: offen, Finger gespreizt, Leder innen verbrannt (halbrund)
  try { if (S.jgHandL) { S.handJobs.push(...weiss_handPose(S.jgHandL, { curl: { all: -6 }, spread: { all: 14, thumb: 18 } }));
      const K = weiss_fingerKetten(S.jgHandL), mid = K.middle && K.middle[0], s = 1 / (S.jgHandL.getWorldScale(new V()).x || 1); const M = weiss_knochenBind(S.jgHandL);
      if (mid && M) { const Ri = new T.Quaternion().setFromRotationMatrix(M.clone().extractRotation(M)).invert(), pal = new V(0, -1, 0).applyQuaternion(Ri), br = kirchberg_tex(kirchberg_cnv(128, 128, (x, w) => { x.clearRect(0, 0, w, w); const g = x.createRadialGradient(w / 2, w * .62, 4, w / 2, w * .62, w * .42); g.addColorStop(0, 'rgba(10,6,4,.96)'); g.addColorStop(.7, 'rgba(30,16,8,.9)'); g.addColorStop(1, 'rgba(60,34,16,0)'); x.fillStyle = g; x.beginPath(); x.arc(w / 2, w * .62, w * .42, Math.PI, 0); x.lineTo(w * .92, w * .62); x.lineTo(w * .08, w * .62); x.fill(); x.strokeStyle = 'rgba(200,90,30,.5)'; x.lineWidth = 3; x.beginPath(); x.arc(w / 2, w * .62, w * .4, Math.PI * 1.05, Math.PI * 1.95); x.stroke(); }));
        const d = new T.Mesh(new T.PlaneGeometry(.075 * s, .075 * s), new T.MeshStandardMaterial({ map: br, transparent: true, depthWrite: false, roughness: .9, polygonOffset: true, polygonOffsetFactor: -3, side: T.DoubleSide })); d.quaternion.setFromUnitVectors(new V(0, 0, 1), pal); d.position.copy(mid.position).multiplyScalar(.45).addScaledVector(pal, .012 * s); d.userData.noCol = true; S.jgHandL.add(d); F3.brand = d; } } } catch (e) { console.warn('weiss Handschuh', e); }
  // Abgrund: der Kreisel des Mädchens auf Stuhl 7 (Blechkreisel, vor ihre Füße gefallen)
  try { const k = kids[6] && kids[6].k; if (k) { const prof = [[0, 0], [.004, .004], [.03, .05], [.052, .082], [.058, .1], [.05, .108], [.02, .112], [.007, .13], [.007, .17], [.0045, .175], [0, .175]].map(p => new T.Vector2(p[0], p[1])), geo = new T.LatheGeometry(prof, 24);
      const farbe = kirchberg_tex(kirchberg_cnv(256, 64, (x, w, h) => { const cs = ['#8a2c22', '#2d4f7a', '#c9a03a', '#2d4f7a']; for (let i = 0; i < 4; i++) { x.fillStyle = cs[i]; x.fillRect(0, i * 16, w, 16); } for (let i = 0; i < 200; i++) { x.fillStyle = `rgba(60,50,40,${kirchberg_r(.1, .4)})`; x.fillRect(kirchberg_r(0, w), kirchberg_r(0, h), kirchberg_r(1, 5), kirchberg_r(1, 3)); } }));
      const m = new T.Mesh(geo, new T.MeshStandardMaterial({ map: farbe, roughness: .5, metalness: .7 })); m.castShadow = true; m.userData.noCol = true; const g = new T.Group(); g.add(m); m.rotation.z = Math.PI / 2 - .25; m.position.y = .06;
      g.position.set(k.position.x + Math.sin(k.rotation.y) * .42 + Math.cos(k.rotation.y) * .12, 0, k.position.z + Math.cos(k.rotation.y) * .42 - Math.sin(k.rotation.y) * .12); g.rotation.y = k.rotation.y * 1.7; A.add(g); F3.kreisel = g; } } catch (e) { console.warn('weiss Kreisel', e); }
  // Raum 1: das Nachtlicht ist ein Fisch (steckdosenblau), die Spieluhr die Rosenkiste aus dem Scan
  try { const R = r1Items; const lm = R.licht.m, fish = new T.Shape(); fish.moveTo(.07, 0); fish.quadraticCurveTo(.03, .05, -.025, .036); fish.lineTo(-.075, .06); fish.quadraticCurveTo(-.058, 0, -.075, -.06); fish.lineTo(-.025, -.036); fish.quadraticCurveTo(.03, -.05, .07, 0);
    const eye = new T.Path(); eye.absarc(.04, .008, .006, 0, Math.PI * 2, true); fish.holes.push(eye); const fg = new T.ExtrudeGeometry(fish, { depth: .02, bevelEnabled: true, bevelThickness: .006, bevelSize: .005, bevelSegments: 3 });
    lm.geometry = fg; lm.position.set(lm.position.x, .32, Z3 - 5.808); lm.rotation.set(0, 0, 0); lm.material = lm.material.clone(); lm.material.color.setHex(0x1a2a50); lm.material.emissive.setHex(0x5f86ff); lm.material.emissiveIntensity = 2.2; lm.material.roughness = .35;
    const platte = new T.Mesh(neben3x_rbox ? neben3x_rbox(.13, .13, .02, .02) : new T.BoxGeometry(.13, .13, .02), new T.MeshStandardMaterial({ color: 0xcfcdc4, roughness: .5 })); platte.position.set(lm.position.x, lm.position.y, Z3 - 5.82); platte.userData.noCol = true; scene.add(platte); F3.nachtlicht = platte;
    const sm = R.spieluhr.m, mod = await kirchberg_mod('w_spieluhr', 'model.glb', .17, 'max'); if (mod) { mod.position.set(sm.position.x, sm.position.y - .06, sm.position.z); mod.rotation.y = sm.rotation.y; mod.traverse(o => { o.userData.noCol = true; }); scene.add(mod); sm.material = hidden; F3.spieluhr = mod; } } catch (e) { console.warn('weiss Raum 1', e); } }

WORLD_TICK.push(() => weiss_handTick());

// Ende von Kapitel 3 → Kapitel 4: enterWhite setzt state.inBasement, die Kinosequenz stellt es danach wieder her, nichts setzte es zurück – Kapitel 4 begann im Dorf mit „Keller“-Umwelt (Mond und Spiegelung aus, Regen aus, Klang gedämpft, Dorfleben aus). Testlauf 08.10.
chapter4Begin = (o => function (...a) { state.inBasement = false; indoorK = 0; lastArea = ''; return o.apply(this, a); })(chapter4Begin);
