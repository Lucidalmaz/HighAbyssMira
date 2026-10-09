// =====================================================================  KAPITEL 1 · „KELLER BLEIBT ZU“ (Modul „kapitel1“, Fassung 3 · AP-14): der Hauptweg
// Unterkapitel 1–7 nach story_final.md (Kapitel 1): Ortsschild/Gestalt am Ostende/Nachbild an der Kreuzung · Nr. 9 von außen (AG-02 baut lwo.js) ·
// Nr. 7 („Der Sessel ist noch warm“, „Nicht du“) · Kellertür (3110, Fehlversuche, Hilfeleiter) · Keller („LUKE, 9“, Polaroid auf dem Gurtstuhl,
// Tonband, „… danke, Luke …“) · „Von Ost nach West“ (Stromausfall, Laternen werden ausgeblasen, 1,4 s, Luftholen, Nr. 7 zuletzt) ·
// „Ich seh dich gleich …“ (Verstecken vor dem Kegel mit Deckungsvolumen, A-03 steigender Preis) · Stahltür zu → Abspann k1 (kino.js) → Endkarte
// (Zählerzeile: kino.js/sammeln.js) + lwo_kapitelende(1) → Kapitel 2 hinter der Wand · geheimes Ende „Fahr heim“ (nur vor dem Tonband).
// Alles Weitere der Welt (Nebenaufgaben, Katzen, Beobachter, Whiskey, LWO, Kino) über deren Funktionen – immer mit typeof.
// Technik: Basis-Funktionen werden hier umhüllt/ersetzt (startOutage, leaveBasement, enterBasement, ending, scareWendtKitchen, scareCellarDoor, kpPress)
// oder ihre Klickflächen neu belegt (Briefkasten, Kalender, Tonband, Zeichnungen, Kellertreppe). Keine Lichter zur Laufzeit, keine Allokationen im Takt.
const K1 = { f: new Set(), T: 0, ready: false, deco: [], cov: [], v: { on: false, done: false, n: 0, exp: 0, sp: { x: 0, z: 0, vx: 0, vz: 0 }, tgt: { x: 0, z: 0 }, tT: 0, last: null, spd: 3.4, limp: 0,
  lift: null, grace: 0, vegas: false, aeff: false, wz: -1 }, aus: null, hum: null, tv: { t: 0, fr: 0 }, lampe: null, kp: { t: 0, blick: false }, band: null, heim: false, a04: { n: 0, t: 120 } };
const kapitel1_v3 = new THREE.Vector3(), kapitel1_v3b = new THREE.Vector3(), kapitel1_q = new THREE.Quaternion(), kapitel1_o = new THREE.Object3D();
MOD_SAVE.push(['kapitel1', () => ({ f: [...K1.f], n: K1.v.n }), v => { if (v && Array.isArray(v.f)) v.f.forEach(x => K1.f.add(x)); if (v && +v.n) K1.v.n = +v.n; }]);
function kapitel1_on() { return state.started && !menu.attract && !state.ch1Done && !(typeof ch2 !== 'undefined' && ch2.on) && (typeof kap !== 'function' || kap() === 1); }
function kapitel1_lore(key, title, html) { if (story.lore.some(l => l.key === key)) return false; story.lore.push({ key, title, html }); return true; }
function kapitel1_d(x, z) { return Math.hypot(player.pos.x - x, player.pos.z - z); }
function kapitel1_blick(x, y, z) { camera.getWorldDirection(kapitel1_v3b); kapitel1_v3.set(x - camera.position.x, y - camera.position.y, z - camera.position.z).normalize(); return kapitel1_v3b.dot(kapitel1_v3); }
const kapitel1_hit = (w, h, d, x, y, z) => box(w, h, d, x, y, z, hidden, { cast: false });
function kapitel1_zeile(t, ms, who) { subtitle(t, ms, who); }
// ---------------------------------------------------------------- Papier/Kreide als Decal (Canvas-Textur, im Dunkeln nur mit Lampe lesbar)
function kapitel1_cnv(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); echt_an(() => draw(x, w, h)); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function kapitel1_mat(tex, o = {}) { return new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: .04, depthWrite: false, roughness: o.rough ?? .95, metalness: o.metal ?? 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, color: o.color ?? 0xffffff }); }
function kapitel1_decal(tex, w, h, x, y, z, rx, ry, rz = 0, o = {}) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), kapitel1_mat(tex, o)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz, 'YXZ'); m.receiveShadow = true; m.renderOrder = 2; scene.add(m); K1.deco.push(m); return m; }
function kapitel1_papier(x, w, h, tint = '#e8e0cc') { papierScan(x, w, h, tint); // echtes Papier
  const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .2, w / 2, h / 2, Math.max(w, h) * .75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(90,60,20,.28)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
function kapitel1_kreideStrich(x, pts, lw = 7, col = 'rgba(236,232,220,.85)') { x.lineCap = 'round'; x.lineJoin = 'round'; // Kreide: mehrere dünne, zittrige Züge übereinander, dazwischen Korn
  for (let pass = 0; pass < 4; pass++) { x.strokeStyle = col; x.globalAlpha = pass ? .38 : .55; x.lineWidth = lw * (pass ? rand(.35, .6) : .75); x.beginPath(); pts.forEach((p, i) => { const j = lw * .22; i ? x.lineTo(p[0] + rand(-j, j), p[1] + rand(-j, j)) : x.moveTo(p[0] + rand(-j, j), p[1] + rand(-j, j)); }); x.stroke(); }
  x.globalAlpha = 1; x.fillStyle = col; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.hypot(bx - ax, by - ay) / 2; for (let k = 0; k < n; k++) { const u = Math.random(); x.globalAlpha = rand(.1, .5); x.fillRect(ax + (bx - ax) * u + rand(-lw, lw) * .7, ay + (by - ay) * u + rand(-lw, lw) * .7, rand(1, 2.4), rand(1, 2.4)); } } x.globalAlpha = 1;
  x.globalCompositeOperation = 'destination-out'; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.hypot(bx - ax, by - ay) / 3; for (let k = 0; k < n; k++) { const u = Math.random(); x.fillStyle = `rgba(0,0,0,${rand(.3, .9)})`; x.fillRect(ax + (bx - ax) * u + rand(-lw, lw) * .5, ay + (by - ay) * u + rand(-lw, lw) * .5, rand(1, 3), rand(1, 3)); } } x.globalCompositeOperation = 'source-over'; }
function kapitel1_verwaschen(x, w, h, n = 90, r = [2, 7]) { kreideKorn(x, w, h); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < n; i++) { x.fillStyle = `rgba(0,0,0,${rand(.15, .6)})`; x.beginPath(); x.arc(rand(0, w), rand(0, h), rand(r[0], r[1]), 0, 7); x.fill(); } x.globalCompositeOperation = 'source-over'; }
// Pfeile als InstancedMesh (ein Zeichenaufruf je Sorte): Richtung = Weltwinkel, Pfeilspitze zeigt nach (dx, dz)
function kapitel1_bodenY(x, z) { if (Math.abs(z) < 4.1 || (Math.abs(x) < 4.1 && z < 0 && z > -46)) return .031; if (Math.abs(z) < 6.1 || (Math.abs(x) < 6.1 && z < 0 && z > -46)) return .156; return .036; }
function kapitel1_pfeile(tex, list, size) { const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: .9, polygonOffset: true, polygonOffsetFactor: -2 }), list.length);
  list.forEach(([x, z, dx, dz], i) => { kapitel1_o.position.set(x, kapitel1_bodenY(x, z), z); kapitel1_o.rotation.set(-PI / 2, Math.atan2(-dz, dx) + rand(-.1, .1), 0, 'YXZ'); kapitel1_o.scale.setScalar(rand(.9, 1.1)); kapitel1_o.updateMatrix(); im.setMatrixAt(i, kapitel1_o.matrix); });
  im.receiveShadow = true; im.renderOrder = 2; scene.add(im); return im; }
// Oberkante unter (x, z) in einer Gruppe (Möbel), für Dinge, die auf etwas liegen
const kapitel1_rc = new THREE.Raycaster();
function kapitel1_topY(name, x, z, yFrom, fb) { const g = name ? scene.getObjectByName(name) : scene; if (!g) return fb; kapitel1_rc.set(kapitel1_v3.set(x, yFrom, z), kapitel1_v3b.set(0, -1, 0)); kapitel1_rc.far = yFrom; kapitel1_rc.camera = camera; const h = kapitel1_rc.intersectObject(g, true).find(h => h.object.visible && h.object.material && h.object.material.visible !== false && !h.object.material.transparent && !h.object.isSprite); return h ? h.point.y : fb; }

// ================================================================= Umsetzung Text gegen Welt (Kap. 1): Schlüssel mit Panda-Anhänger, Linse im Astloch, Wolldecke, Obstschale, Bus
// Haustürschlüssel (Nickel), Ring, Kettchen und Lucys Panda aus Plastik („ein Ohr ab“). Aufgebaut in der xy-Ebene (Vorderseite = +z), weil liftTo den Träger mit +z zur Kamera dreht; im Briefkasten liegt der Träger mit rotation.x = −π/2 flach.
function kapitel1_pandaSchluessel() { const T = THREE, g = new T.Group(); g.userData.noCol = true;
  const nickel = new T.MeshStandardMaterial({ color: 0xb9bcc0, metalness: 1, roughness: .3 }), messing = new T.MeshStandardMaterial({ color: 0xa8873c, metalness: 1, roughness: .35 });
  // Schlüssel: Kopf (Rundbügel mit Loch), Hals, Schaft mit Bart (Zähne) – 2 mm stark, in der xz-Ebene, Spitze nach −z
  const prof = new T.Shape(); // Umriss in (x, z): Bügel oben (z>0), Schaft nach −z
  prof.moveTo(-.0034, -.003); prof.lineTo(-.0034, -.0295); prof.lineTo(-.0075, -.0295); prof.lineTo(-.0075, -.0325); prof.lineTo(-.0034, -.0325); prof.lineTo(-.0034, -.0365); prof.lineTo(-.0075, -.0365); prof.lineTo(-.0075, -.039); prof.lineTo(-.0034, -.039); prof.lineTo(-.0034, -.0425); prof.lineTo(.0034, -.0425); prof.lineTo(.0034, -.003);
  prof.absarc(0, .008, .0125, -.2, PI + .2, false); prof.lineTo(-.0034, -.003);
  const loch = new T.Path(); loch.absarc(0, .0105, .0042, 0, PI * 2, true); prof.holes.push(loch);
  const schl = new T.Mesh(new T.ExtrudeGeometry(prof, { depth: .0022, bevelEnabled: true, bevelSize: .0004, bevelThickness: .0004, bevelSegments: 1, curveSegments: 14 }), nickel); schl.position.set(0, 0, -.0011); schl.castShadow = true; g.add(schl);
  // Schlüsselring (Stahldraht) durch das Loch, daran das Kettchen und der Panda
  const ring = new T.Mesh(new T.TorusGeometry(.0105, .0007, 6, 22), nickel); ring.position.set(0, .0105, 0); ring.rotation.set(.9, 0, 0); g.add(ring);
  const kette = []; for (let i = 0; i < 6; i++) { const gl = new T.Mesh(new T.TorusGeometry(.0027, .0004, 5, 10), nickel); gl.position.set(.011 + i * .0045, .0105 + Math.sin(i * 1.1) * .002, .0012); gl.rotation.set(i % 2 ? PI / 2 : 0, 0, 0); g.add(gl); kette.push(gl); }
  // Panda (Plastik, ca. 3,4 cm): liegt auf dem Rücken neben dem Schlüssel – weißer Körper, schwarze Arme/Beine/Augenflecken, ein Ohr abgebrochen
  const pw = new T.MeshStandardMaterial({ color: 0xf0eee6, roughness: .32, metalness: 0 }), ps = new T.MeshStandardMaterial({ color: 0x151515, roughness: .35 }), pb = new T.MeshStandardMaterial({ color: 0xd8cfae, roughness: .6 }), P = new T.Group(); P.position.set(.049, .0105, .0105 * 0 + .0001); P.rotation.set(0, 0, -PI / 2 + .25); g.add(P);
  const sp = (r, mat, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new T.Mesh(new T.SphereGeometry(r, 16, 12), mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; P.add(m); return m; };
  sp(.0125, pw, 0, 0, 0, 1, 1.12, .8); sp(.0108, pw, 0, .0185, .002, 1.05, .95, .9); // Körper, Kopf
  sp(.0052, ps, -.0098, .027, .0005, 1, 1, .6); sp(.0043, pb, .0098, .0262, .0005, 1, .8, .5); // linkes Ohr, rechtes Ohr abgebrochen (heller Bruchstumpf)
  sp(.0033, ps, -.0045, .019, .0092, 1, 1.3, .5); sp(.0033, ps, .0045, .019, .0092, 1, 1.3, .5); sp(.0011, pw, -.0045, .0195, .0108); sp(.0011, pw, .0045, .0195, .0108); sp(.0016, ps, 0, .0148, .0112, 1.2, .9, .8); // Augenflecken, Augen, Nase
  sp(.0036, ps, -.0128, .004, .0005, .8, 1.8, .8); sp(.0036, ps, .0128, .004, .0005, .8, 1.8, .8); sp(.0042, ps, -.006, -.0128, .0008, 1, 1.2, 1); sp(.0042, ps, .006, -.0128, .0008, 1, 1.2, 1); // Arme, Beine
  const osen = new T.Mesh(new T.TorusGeometry(.0028, .0005, 5, 10), nickel); osen.position.set(0, .0292, -.001); osen.rotation.y = PI / 2; P.add(osen);
  g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); return g; }
// Linse hinter dem Astloch von Nr. 9: schwarzes Objektivrohr mit entspiegeltem Glas (bläulich-violett), konzentrische Ringe; dahinter die rote Leuchte (Sprite aus kapitel1_welt)
function kapitel1_linseBau() { const T = THREE, g = new T.Group(), schwarz = new T.MeshStandardMaterial({ color: 0x0e0e10, roughness: .6, metalness: .5 });
  const rohr = new T.Mesh(new T.CylinderGeometry(.034, .037, .06, 24, 1, true), schwarz); rohr.rotation.x = PI / 2; rohr.material.side = T.DoubleSide; g.add(rohr);
  const ring = new T.Mesh(new T.TorusGeometry(.034, .004, 8, 28), schwarz); ring.position.z = .03; g.add(ring);
  const glas = new T.MeshStandardMaterial({ color: 0x1a1a3a, metalness: .2, roughness: .03, envMapIntensity: 2.4, emissive: 0x0a0a22, emissiveIntensity: .6 });
  const linse = new T.Mesh(new T.SphereGeometry(.031, 24, 12, 0, PI * 2, 0, .85), glas); linse.rotation.x = PI / 2; linse.position.z = .012; linse.scale.set(1, 1, .5); g.add(linse);
  for (const r of [.02, .0125, .006]) { const rr = new T.Mesh(new T.TorusGeometry(r, .0007, 6, 24), new T.MeshStandardMaterial({ color: 0x3a3a60, roughness: .1, metalness: .8 })); rr.position.z = .021 - r * .25; g.add(rr); }
  g.userData.noCol = true; g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); return g; }
// Obstschale (Steingut, blauer Rand) mit Äpfeln; die Dienstmarke liegt frei auf dem Schalenboden daneben
function kapitel1_obstschale() { const T = THREE, g = new T.Group(), kera = new T.MeshStandardMaterial({ color: 0xe0d8c0, roughness: .35 }), blau = new T.MeshStandardMaterial({ color: 0x27427a, roughness: .35 });
  const prof = [[0, 0], [.055, 0], [.07, .006], [.1, .032], [.126, .062], [.1285, .066], [.1245, .068], [.12, .062], [.095, .036], [.066, .014], [.05, .0085], [0, .0085]].map(p => new T.Vector2(p[0], p[1]));
  const sch = new T.Mesh(new T.LatheGeometry(prof, 36), kera); sch.castShadow = sch.receiveShadow = true; g.add(sch); const rd = new T.Mesh(new T.TorusGeometry(.1255, .0032, 6, 40), blau); rd.rotation.x = PI / 2; rd.position.y = .064; g.add(rd);
  const tx = kapitel1_cnv(64, 64, (x, w) => { const q = x.createLinearGradient(0, 0, w, 0); q.addColorStop(0, '#9a1c14'); q.addColorStop(.5, '#c4551e'); q.addColorStop(1, '#8a2a16'); x.fillStyle = q; x.fillRect(0, 0, w, w); for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(230,200,80,${Math.random() * .3})`; x.fillRect(Math.random() * w, Math.random() * w, 1, 6); } });
  const am = new T.MeshStandardMaterial({ map: tx, roughness: .38 }), sm = new T.MeshStandardMaterial({ color: 0x4a3418, roughness: .9 });
  for (const [x, z, r] of [[-.05, -.03, 1], [-.015, .035, .95], [-.075, .045, .9]]) { const a = new T.Mesh(new T.SphereGeometry(.036 * r, 18, 14), am); a.scale.y = .9; a.position.set(x, .0085 + .03 * r, z); a.castShadow = true; g.add(a); const st = new T.Mesh(new T.CylinderGeometry(.0013, .0013, .016, 5), sm); st.position.set(x, .0085 + .062 * r, z); st.rotation.z = .2; g.add(st); }
  g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); g.userData.noCol = true; return g; }
// Zusammengelegte Wolldecke: gefaltet (Drittel, Drittel), Schottenkaro aus Wolle, Fransen an einer Schmalseite, Kanten rundlich gewellt, ein Zipfel hängt über die Lehne
function kapitel1_deckeTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#6a2a24'; x.fillRect(0, 0, 512, 512); // rotbraun
  const band = (pos, w, col, alpha) => { x.fillStyle = col; x.globalAlpha = alpha; x.fillRect(pos, 0, w, 512); x.fillRect(0, pos, 512, w); x.globalAlpha = 1; };
  band(64, 36, '#1f3a2c', .85); band(192, 12, '#d6c9a0', .8); band(256, 64, '#1f3a2c', .85); band(384, 12, '#d6c9a0', .8); band(448, 36, '#1a1a1c', .6); band(130, 6, '#c8a24a', .7);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '255,240,210' : '20,10,6'},${Math.random() * .12})`; const l = 2 + Math.random() * 6; if (Math.random() < .5) x.fillRect(Math.random() * 512, Math.random() * 512, l, 1); else x.fillRect(Math.random() * 512, Math.random() * 512, 1, l); }
  x.strokeStyle = 'rgba(0,0,0,.18)'; x.lineWidth = 1; for (let i = 0; i < 512; i += 3) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke(); } x.strokeStyle = 'rgba(255,255,255,.07)'; for (let i = 1; i < 512; i += 3) { x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); } // Webstruktur
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t; }
function kapitel1_decke(w = .62, l = .42, h = .085) { const T = THREE, g = new T.Group(), tx = kapitel1_deckeTex(); tx.repeat.set(1.1, .8);
  const mat = new T.MeshStandardMaterial({ map: tx, bumpMap: tx, bumpScale: .6, roughness: 1, side: T.DoubleSide }), geo = new T.BoxGeometry(w, h, l, 28, 6, 20), P = geo.attributes.position, v = new T.Vector3();
  for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i); const ux = v.x / (w / 2), uz = v.z / (l / 2), uy = v.y / (h / 2), e = 2.8, k = Math.pow(Math.abs(ux), e) + Math.pow(Math.abs(uz), e); // gerundete Kanten
    const rr = k > 1 ? 1 / Math.pow(k, 1 / e) : 1; let x = v.x * (1 - (1 - rr) * .55), z = v.z * (1 - (1 - rr) * .55), y = v.y;
    y *= 1 - .22 * Math.pow(Math.abs(ux), 3) - .12 * Math.pow(Math.abs(uz), 3); y += Math.sin(v.x * 38 + 1.3) * .0022 * (uy + 1) + Math.sin(v.z * 31) * .0016 * (uy + 1) + (uy > 0 ? Math.sin(v.x * 11) * .004 : 0); // Falten, weiche Wölbung
    P.setXYZ(i, x, y, z); }
  geo.computeVertexNormals(); const dk = new T.Mesh(geo, mat); dk.castShadow = dk.receiveShadow = true; g.add(dk);
  const fr = new T.MeshStandardMaterial({ color: 0xcbbd98, roughness: 1 }); for (let i = 0; i < 26; i++) { const f = new T.Mesh(new T.CylinderGeometry(.0013, .0013, .05, 4), fr); f.rotation.z = PI / 2 - .12 + Math.random() * .24; f.rotation.y = (Math.random() - .5) * .3; f.position.set(w / 2 + .02, -h * .35 + Math.random() * .01, -l / 2 + .012 + i * (l - .024) / 25); g.add(f); } // Fransen an der Schmalseite
  g.userData.noCol = true; g.traverse(m => { if (m.isMesh) m.userData.noCol = true; }); return g; }

// Geheimes Ende „Fahr heim“: der Bus (Transporter-Scan, auf Buslänge gestreckt) rollt im Nebel an die Haltestelle – zwei Scheinwerfer, Fahrer als dunkle Silhouette hinter der Scheibe, sonst leer
async function kapitel1_busBau() { if (K1.bus) return K1.bus; const T = THREE; K1.bus = { g: new T.Group(), L: null, fertig: false }; K1.bus.g.visible = false; K1.bus.g.userData.noCol = true; scene.add(K1.bus.g);
  try { const o = await msFBX('vans', 'model.fbx', { '*': { b: 'van_grau_d.jpg', n: 'van_damaged_n.jpg', r: 'van_damaged_roughness.jpg', m: 'van_damaged_metallic.jpg', rough: 1 } });
    msFit(o, 7.4, 'max'); const gg = msGround(o); gg.traverse(m => { if (m.isMesh) { m.castShadow = false; m.userData.noCol = true; } }); K1.bus.g.add(gg); const bb = new T.Box3().setFromObject(gg); K1.bus.bb = bb; K1.bus.lang = bb.max.x - bb.min.x > bb.max.z - bb.min.z ? 'x' : 'z'; } catch (e) { console.warn('kapitel1 Bus', e); }
  const glow = new T.SpriteMaterial({ map: kapitel1_cnv(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,248,226,1)'); g.addColorStop(.25, 'rgba(255,236,190,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), color: 0xfff0d0, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
  K1.bus.glow = []; for (let i = 0; i < 2; i++) { const s = new T.Sprite(glow); s.scale.setScalar(1.8); K1.bus.g.add(s); K1.bus.glow.push(s); }
  K1.bus.licht = new VLight(0xffe8c0, 0, 16, 2); K1.bus.licht.position.set(0, 1.2, 0); scene.add(K1.bus.licht); return K1.bus; }
async function kapitel1_busFahrt() { const B = K1.bus; if (!B || !B.bb) return; const bb = B.bb, lang = B.lang, T = THREE, vorn = B.vorn || 1, L = bb.max[lang] - bb.min[lang], quer = lang === 'x' ? 'z' : 'x';
  // Scheinwerfer an die Frontkante
  B.glow.forEach((s, i) => { const p = new T.Vector3(); p[lang] = vorn > 0 ? bb.max[lang] - .1 : bb.min[lang] + .1; p[quer] = (i ? .75 : -.75); p.y = .78; s.position.copy(p); });
  const g = B.g, x0 = -34, x1 = 5.2, z = 57.4, ry0 = lang === 'x' ? (vorn > 0 ? 0 : PI) : (vorn > 0 ? PI / 2 : -PI / 2); // fährt nach +x (Straße Am Kirchberg, Haltestelle bei x ≈ 9)
  g.rotation.y = ry0; g.position.set(x0, 0, z); g.visible = true; const t0 = performance.now(), D = 6200;
  await new Promise(res => { const f = () => { const k = Math.min(1, (performance.now() - t0) / D), e = 1 - Math.pow(1 - k, 2.2), x = x0 + (x1 - x0) * e; g.position.x = x; B.licht.position.set(x + L * .5 * vorn, 1.1, z); B.licht.intensity = 2.4 * Math.min(1, k * 4); B.glow.forEach(s => s.material.opacity = Math.min(1, k * 3)); if (k < 1) requestAnimationFrame(f); else res(); }; f(); });
  setTimeout(() => { g.visible = false; B.licht.intensity = 0; }, 5200); }

// ================================================================= Welt: Kreide, Hufeisen, Zeichen, Requisiten (Q-8 / X-7)
async function kapitel1_welt() {
  // --- weiße Kinderkreide-Pfeile vom Ortsschild nach Osten („der erste zeigt nach Osten, die Straße hinunter“)
  const weiss = kapitel1_cnv(256, 256, (x, w, h) => { kapitel1_kreideStrich(x, [[38, 132], [200, 126]], 13); kapitel1_kreideStrich(x, [[150, 80], [206, 126], [146, 178]], 13); kapitel1_verwaschen(x, w, h, 120, [2, 8]); });
  kapitel1_pfeile(weiss, [[-63.5, 2.6, 1, 0], [-54, 3.3, 1, .05], [-44.5, 2.2, 1, -.04], [-33.8, 3.1, 1, 0], [-24.5, 2.4, 1, .06], [-13.5, 2.9, 1, 0], [12.5, 2.2, 1, -.05]], .78);
  // --- Lucys blaue Pfeile (Kreis am Schaft): vom Briefkasten Nr. 7 den Kirchweg hinauf zur Haltestelle – gegen die weißen Pfeile
  const blau = kapitel1_cnv(256, 256, (x, w, h) => { const c = 'rgba(70,120,215,.9)'; kapitel1_kreideStrich(x, [[40, 128], [196, 128]], 11, c); kapitel1_kreideStrich(x, [[152, 86], [200, 128], [152, 170]], 11, c);
    x.strokeStyle = c; x.lineWidth = 8; x.beginPath(); x.arc(84, 128, 20, 0, 7); x.stroke(); kapitel1_verwaschen(x, w, h, 90, [2, 6]); });
  K1.blau = kapitel1_pfeile(blau, [[27.2, -5.9, -1, .15], [20.5, -4.4, -1, 0], [13, -3.6, -1, .05], [4.5, -2.4, -1, .2], [-4.8, 1.5, -.3, 1], [-6.9, 9, 0, 1], [-7.5, 21, 0, 1], [-7.1, 34, .05, 1], [-5.2, 45.5, .3, 1], [1.5, 51.2, 1, .2]], .6);
  // --- Hufeisen über jeder Haustür – eine Instanz je Tür
  const tueren = [[23, -12.15, 1], [-47, -12.15, 1]]; for (const h of houses) if (!h.hollow && h.x !== undefined) { const fz = h.z + h.facing * h.d / 2; tueren.push([h.doorX ?? h.x, fz + h.facing * .02, h.facing]); }
  try { const hp = await msBake('hufeisen', 'model.glb'); // Quixel „Old Horseshoe“ (Scan, 13 cm), Öffnung nach oben, auf dem Türrahmen; 09.10.: statt Canvas-Fläche
    msInst(hp, tueren.map(([x, z, f]) => msM4(x, 2.96, z + f * .034, f > 0 ? 0 : PI, 1.2, 0, 0)), { shadow: false }).forEach(im => { im.userData.noCol = true; }); } catch (e) { console.warn('Hufeisen', e); }
  // --- Lunas Hüpfkästchen mit 17 Feldern (weiße Kreide, halb verwaschen) auf dem Gehweg an der Kreuzung
  { const t = kapitel1_cnv(256, 1024, (x, w, h) => { const fh = h / 18; for (let i = 0; i < 17; i++) { const y = h - (i + 1) * fh; kapitel1_kreideStrich(x, [[50, y], [206, y], [206, y + fh], [50, y + fh], [50, y]], 6); x.fillStyle = 'rgba(236,232,220,.8)'; x.font = '44px Caveat, cursive'; x.fillText(String(i + 1), 112 + rand(-8, 8), y + fh * .72); }
      kapitel1_kreideStrich(x, [[128, 18], [128, 48]], 6); x.beginPath(); x.arc(128, 18, 14, 0, 7); x.stroke(); kapitel1_verwaschen(x, w, h, 260, [3, 10]); });
    kapitel1_decal(t, .9, 3.6, -9.5, .157, -5.1, -PI / 2, PI / 2, 0); }
  // --- Martinslaterne, Kinderkreide, vor Nr. 7 auf dem Gehweg (nur im Lampenlicht zu lesen)
  { const t = kapitel1_cnv(512, 512, (x, w, h) => { kapitel1_kreideStrich(x, [[256, 60], [256, 150]], 6); kapitel1_kreideStrich(x, [[120, 150], [392, 150]], 6); kapitel1_kreideStrich(x, [[170, 150], [150, 380], [362, 380], [342, 150]], 7);
      for (const [a, b] of [[200, 220], [256, 260], [312, 220]]) { x.beginPath(); x.arc(a, b, 26, 0, 7); x.stroke(); } kapitel1_kreideStrich(x, [[210, 330], [256, 300], [302, 330]], 5);
      x.fillStyle = 'rgba(236,232,220,.75)'; x.font = '54px Caveat, cursive'; x.fillText('LATERNE LATERNE', 96, 470); kapitel1_verwaschen(x, w, h, 160, [3, 9]); });
    kapitel1_decal(t, 1.1, 1.1, 20.6, .157, -5.15, -PI / 2, PI, 0); }
  // --- Stiefelabdruck mit Platten im Matsch unter der Laterne am Ostende (Justin, Kap. 1)
  { const t = kapitel1_cnv(256, 512, (x, w, h) => { x.fillStyle = 'rgba(30,24,18,.8)'; x.beginPath(); x.ellipse(128, 170, 70, 130, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(128, 420, 58, 70, 0, 0, 7); x.fill();
      x.fillStyle = 'rgba(80,70,60,.9)'; for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) x.fillRect(80 + c * 34, 70 + r * 40, 24, 12); kapitel1_verwaschen(x, w, h, 50, [3, 9]); });
    kapitel1_decal(t, .19, .38, 68.3, .035, 5.1, -PI / 2, .4, 0, { rough: .3 }); }
  // --- Nr. 9: rotes Glimmen im Astloch der Bretter (Standby-Leuchte einer Kamera); kein „Aufbrechen“ in Kap. 1 (02 C10)
  { const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: kapitel1_cnv(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,60,40,1)'); g.addColorStop(.3, 'rgba(255,20,10,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), color: 0xff5040, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.position.set(46.985, 1.536, -12.282); glow.scale.setScalar(.075); scene.add(glow); K1.glimmen = glow;
    { // Astloch im Brett (dunkles Loch mit Jahresringen) und die Linse einer Kamera, die dahinter sitzt und mit dem Glas durch das Loch ragt
      const c = kapitel1_cnv(256, 256, (x, w) => { const g = x.createRadialGradient(128, 128, 20, 128, 128, 126); g.addColorStop(0, 'rgba(4,3,2,1)'); g.addColorStop(.52, 'rgba(6,4,3,1)'); g.addColorStop(.62, 'rgba(60,38,20,.95)'); g.addColorStop(.74, 'rgba(34,22,12,.85)'); g.addColorStop(.88, 'rgba(70,46,26,.55)'); g.addColorStop(1, 'rgba(70,46,26,0)'); x.fillStyle = g; x.beginPath(); x.ellipse(128, 128, 126, 108, .3, 0, 7); x.fill();
        x.strokeStyle = 'rgba(20,12,6,.55)'; x.lineWidth = 2; for (let r = 78; r < 126; r += 8) { x.beginPath(); x.ellipse(128, 128, r, r * .86, .3, 0, 7); x.stroke(); } });
      kapitel1_decal(c, .125, .11, 46.95, 1.5, -12.2965, 0, 0, .2); K1.linse = kapitel1_linseBau(); K1.linse.position.set(46.95, 1.5, -12.318); K1.linse.rotation.y = -.45; scene.add(K1.linse); }
    interact(kapitel1_hit(.35, .35, .3, 47.2, 1.52, -12.3), 'Astloch', () => { toast('Im Astloch der Bretter glimmt es rot, wie eine Standby-Leuchte. Dahinter ein rundes Glas. Es zeigt auf Nr. 7.', 5200); if (typeof gedanke === 'function') gedanke('ort_nr9', 'Ein Glas hinter den Brettern. Es zeigt auf Nr. 7. Nicht auf die Straße. Auf Nr. 7.', 5600, 2); }); }
  // --- Lucys altes Fahrrad an der Mauer vor Nr. 1 (Deckung beim Verstecken)
  try { const s = await msModel('bicycle'); const o = msGround(msFit(s.clone(true), 1.72, 'max')); o.rotation.z = .12; msPlace(o, -44.1, 0, -11.45, PI / 2 - .05); o.traverse(m => { if (m.isMesh) m.userData.noCol = true; });
    interact(kapitel1_hit(1.8, 1, .6, -44.1, .5, -11.45), 'Fahrrad', () => toast('Lucys altes Fahrrad. Die Kette ist rostig, der Sattel zerkratzt. Am Lenker hängt noch die Klingel, die nie funktioniert hat.', 4800)); } catch (e) { console.warn('kapitel1 Fahrrad', e); }
  // --- Nr. 7: Teller mit dem angebissenen Butterbrot auf der Sofalehne, Dienstmarke + Kugelschreiber in der Schale am Küchentisch
  try { const brot = await msModel('w_brot', 'model.glb'), tel = await msModel('w_teller', 'model.glb');
    // Sessel neben dem Sofa (Sofa-Scan auf Sesselbreite gestaucht, brauner Bezug): davor der Teller mit dem angebissenen Brot auf dem Sitz, über der Lehne die zusammengelegte Wolldecke
    let SX = 21.7 /* QA-Kollision 09.10.: war 22.4 = halb vor der Wandöffnung (23, −17) */, SZ = -16.15; try { const ses = await msFBX('sofa', 'model.fbx', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0x86725c } }); msFit(ses, 2.0, 'x'); ses.scale.x *= .52; const sg = msGround(ses); sg.updateMatrixWorld(true);
      const sb = new THREE.Box3().setFromObject(sg), sd = sb.max.z - sb.min.z; sg.name = 'k1_sessel'; sg.position.set(SX, Y, -16.87 + sd / 2); sg.rotation.y = .06; sg.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); scene.add(sg); sg.updateMatrixWorld(true); K1.sessel = sg;
      const bb = new THREE.Box3().setFromObject(sg), dk = kapitel1_decke(); dk.position.set(SX + .04, bb.max.y + .03, -16.87 + .2); dk.rotation.set(-.2, .1, .02); scene.add(dk); K1.decke = dk; SZ = -16.87 + sd * .55; } catch (e) { console.warn('kapitel1 Sessel', e); }
    const ys = kapitel1_topY('k1_sessel', SX, SZ, Y + 1.4, Y + .5); const t1 = msGround(msFit(tel.clone(true), .2, 'max')); msPlace(t1, SX, ys + .003, SZ, .4); const b1 = msGround(msFit(brot.clone(true), .12, 'max')); msPlace(b1, SX - .02, ys + .02, SZ + .01, 1.2); K1.brot = [t1, b1];
    const yt = kapitel1_topY('io_nr7', 28.35, -14.85, Y + 1.5, Y + .78); K1.yTisch = yt; const t2 = kapitel1_obstschale(); t2.position.set(28.38, yt + .002, -14.86); scene.add(t2); K1.schale = t2; } catch (e) { console.warn('kapitel1 Teller', e); }
  { const marke = kapitel1_cnv(256, 160, (x, w, h) => { x.clearRect(0, 0, w, h); const g = x.createRadialGradient(80, 70, 6, 80, 80, 62); g.addColorStop(0, '#d8d2c0'); g.addColorStop(.6, '#9a9484'); g.addColorStop(1, '#4a463c'); x.fillStyle = g; x.beginPath(); x.ellipse(80, 80, 58, 62, 0, 0, 7); x.fill();
      x.fillStyle = '#2a2822'; x.font = 'bold 15px Georgia'; x.textAlign = 'center'; x.fillText('BfR', 80, 64); x.font = '11px Georgia'; x.fillText('VERWALTUNG', 80, 86); x.font = 'bold 20px Georgia'; x.fillText('03', 80, 110);
      x.fillStyle = '#20263a'; x.fillRect(150, 30, 90, 10); x.fillStyle = '#b8b8b8'; x.fillRect(228, 28, 20, 14); x.fillStyle = '#c0c0c0'; x.fillRect(158, 26, 50, 3); x.strokeStyle = '#333'; x.lineWidth = 1; x.beginPath(); x.arc(170, 27, 2.5, 0, 7); x.stroke(); });
    const ym = (K1.yTisch || Y + .78) + .022; kapitel1_decal(marke, .22, .14, 28.45, ym - .0, -14.8, -PI / 2, .3, 0, { rough: .4, metal: .5 });
    interact(kapitel1_hit(.3, .12, .3, 28.38, ym, -14.86), 'Schale', () => { toast('In der Obstschale: Hildes alte Dienstmarke. „BfR · Verwaltung · 03“. Daneben ein Kugelschreiber.', 4800);
      if (kapitel1_lore('zeichen_1', 'Zeichen · 1', '<span class="hand">Kugelschreiber, Nr. 7, Obstschale. Auf dem Clip, winzig: ein Auge über einer Flamme, in einem Kreis.</span>')) questPop('ABENTEUERFIBEL', 'Zeichen'); }); }
  // Sessel: leer und warm; Decke, Butterbrot
  interact(kapitel1_hit(1.0, .9, .85, 21.7, Y + .5, -16.4), 'Sessel', () => { if (!K1.f.has('sessel')) { K1.f.add('sessel'); toast('Leer. Und warm. Auf der Lehne eine zusammengelegte Wolldecke, ein Butterbrot mit einem Bissen raus.', 5200); setTimeout(() => { if (!state.talking) kapitel1_zeile('<i>Sie war eben noch hier.</i>', 2600, 'LUKE'); }, 5400); } else toast('Das Polster ist noch warm.', 2600); });
  // Kühlschrank: Magnet vom Kaninchenzüchterverein und das Foto „Laternenfest 2008“
  { const im = new Image(); im.src = 'assets/polaroid/zayn.jpg'; await new Promise(r => { im.onload = r; im.onerror = r; setTimeout(r, 2500); });
    const foto = kapitel1_cnv(256, 300, (x, w, h) => { x.fillStyle = '#efe7d4'; x.fillRect(0, 0, w, h); if (im.width) { x.filter = 'sepia(.55) saturate(.7) contrast(.9) brightness(.95)'; x.drawImage(im, 14, 14, w - 28, 230); x.filter = 'none'; } else { x.fillStyle = '#6a6252'; x.fillRect(14, 14, w - 28, 230); }
      x.fillStyle = 'rgba(80,60,30,.18)'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a342a'; x.font = '26px Caveat, cursive'; x.fillText('Laternenfest 08', 30, 282); });
    kapitel1_decal(foto, .14, .165, 30.935, Y + .98, -16.52, 0, -PI / 2, .06, { rough: .5 });
    const mag = kapitel1_cnv(128, 128, (x, w) => { x.clearRect(0, 0, w, w); x.fillStyle = '#e8dcc0'; x.beginPath(); x.arc(64, 64, 54, 0, 7); x.fill(); x.fillStyle = '#6a4a2a'; x.beginPath(); x.ellipse(64, 70, 22, 16, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(56, 44, 6, 16, -.3, 0, 7); x.fill(); x.beginPath(); x.ellipse(72, 44, 6, 16, .3, 0, 7); x.fill();
      x.fillStyle = '#3a2a1a'; x.font = 'bold 11px Arial'; x.textAlign = 'center'; x.fillText('KZV L.E.', 64, 108); });
    kapitel1_decal(mag, .06, .06, 30.93, Y + 1.07, -16.47, 0, -PI / 2, 0, { rough: .3 });
    interact(kapitel1_hit(.1, .24, .22, 30.9, Y + .99, -16.52), 'Foto am Kühlschrank', () => openNote('Foto am Kühlschrank', 'Ein kleiner Junge mit Locken, im roten Shirt, die Arme lang an den Seiten. Er lächelt nicht.\n\n<i>Rückseite:</i>\n<span class="hand">„Laternenfest 2008. Jonas hat die Laterne angezündet. Nicht die Kerze. Die Laterne.“</span>', 'k1_foto2008')); }
  try { fridgeNote.material.map = kapitel1_cnv(220, 270, (x, w, h) => { kapitel1_papier(x, w, h, '#efe6c4'); x.fillStyle = '#16161a'; x.font = 'bold 28px Caveat, cursive'; x.fillText('31.10.', 18, 38); x.font = 'bold 40px Caveat, cursive'; // Filzstift in Hildes Handschrift (Strichjitter je Buchstabe), keine Druckschrift
      ['KELLER', 'BLEIBT ZU.'].forEach((l, i) => x.fillText(l, 18, 94 + i * 40)); x.font = 'bold 24px Caveat, cursive'; ['Egal wer ruft.', 'Egal mit welcher', 'Stimme.'].forEach((l, i) => x.fillText(l, 18, 180 + i * 26)); x.font = '24px Caveat, cursive'; x.fillText('– H. Wendt', 110, 256);
      x.fillStyle = 'rgba(90,40,20,.35)'; x.beginPath(); x.arc(170, 30, 16, 0, 7); x.fill(); }); fridgeNote.material.color.set(0xffffff); fridgeNote.material.needsUpdate = true; } catch (e) {}
  // Tastenfeld: Modell (Keypad Door Lock) und Anzeige baut bedienung.js; keypadMesh bleibt unsichtbare Klickfläche
  // Etikett aus Hildes Prägegerät über dem Tastenfeld
  // (Nutzer 08.10.: keine generierten Aufkleber) – kein Etikett mehr, sondern Schablonenschrift in grauer Sprühfarbe direkt auf der Stahltür, mit Abplatzern und Overspray
  { const t = echt_an(() => kapitel1_cnv(512, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(214,212,200,.92)'; x.font = 'bold 36px Arial'; x.textAlign = 'center'; x.fillText('BITTE NICHT HÄMMERN', w / 2, 44); }), 'schablone');
    kapitel1_decal(t, .17, .021, 30.75, Y + 1.29, -21.73, 0, 0, .015, { rough: .55 }); }
  // Batterien im Dreieck im Flur, Kontakte nach innen
  K1.batt = []; try { const yb = Math.max(Y, kapitel1_topY(null, 22.35, -14.45, Y + .5, Y)); for (let i = 0; i < 3; i++) { const o = typeof ausruestung_ue === 'function' ? await ausruestung_ue('batterie', .055) : null; if (!o) break; const a = i / 3 * PI * 2 + .3, w = new THREE.Group(); o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o), hgt = bb.max.y - bb.min.y; o.rotation.set(0, 0, PI / 2); o.position.set(hgt / 2 + .015, Math.min(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2, 0); w.add(o); w.position.set(22.35 + Math.sin(a) * .09, yb + .002, -14.45 + Math.cos(a) * .09); w.rotation.y = a + PI / 2; scene.add(w); K1.batt.push(w); } } catch (e) { console.warn('kapitel1 Batterien', e); }
  if (!K1.f.has('batt')) interact(K1.battHit = kapitel1_hit(.4, .12, .4, 22.35, Y + .05, -14.45), 'Batterien', () => { if (K1.f.has('batt')) return; K1.f.add('batt'); K1.batt.forEach(o => o.visible = false); uninteract(K1.battHit); addBattery(3); kapitel1_zeile('Wer legt Batterien in ein Dreieck? … Danke, wer immer du bist.', 4200, 'LUKE'); });
  else K1.batt.forEach(o => o.visible = false);
  // Lucys Zettel auf der Anrichte im Flur (nach dem Keller, „heim“ frisch unterstrichen)
  { const t = kapitel1_cnv(256, 200, (x, w, h) => { kapitel1_papier(x, w, h, '#ede6d2'); x.fillStyle = '#1f2a6a'; x.font = '19px Caveat, cursive'; ['Großer, falls ich nicht heimkomme:', 'Hilde macht nachts nicht auf.', 'Das Band im Keller ist für dich.', 'Hör es. Dann fahr heim.', 'Hinter den Bildern ist eine Tür.', 'L. (22.10.)'].forEach((l, i) => x.fillText(l, 16, 30 + i * 28));
      x.strokeStyle = 'rgba(40,40,40,.85)'; x.lineWidth = 2; x.beginPath(); x.moveTo(170, 116); x.lineTo(206, 115); x.stroke(); });
    const ya = kapitel1_topY('io_nr7', 20.62, -15.35, Y + 1.6, Y + .9) + .004; K1.zettel = kapitel1_decal(t, .21, .165, 20.62, ya, -15.35, -PI / 2, PI / 2 + .2, 0); K1.zettel.visible = false; K1.zettelHit = kapitel1_hit(.3, .1, .3, 20.62, ya + .02, -15.35); }
  // --- Keller: Schild am Gurtstuhl, Polaroid auf der Sitzfläche, Oma Ernas Zettel, Hildes Strichliste, Jahreszahlen im Balken
  { const t = kapitel1_cnv(256, 96, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9c9a92'); g.addColorStop(1, '#6e6c66'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = '#1c1c1a'; x.font = 'bold 15px Arial'; x.textAlign = 'center';
      x.fillText('Inventar BfR', w / 2, 28); x.font = '13px Arial'; x.fillText('Außenstelle Lost Eyengless · Nachsorge', w / 2, 50); x.strokeStyle = '#1c1c1a'; x.lineWidth = 2; x.beginPath(); x.ellipse(w / 2, 74, 11, 6, 0, 0, 7); x.stroke(); x.beginPath(); x.arc(w / 2, 74, 3, 0, 7); x.fill();
      x.beginPath(); x.moveTo(w / 2 - 4, 88); x.quadraticCurveTo(w / 2, 80, w / 2 + 4, 88); x.stroke(); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(90,50,20,${rand(.1, .3)})`; x.fillRect(rand(0, w), rand(0, h), rand(2, 6), rand(2, 5)); } });
    { const m = kapitel1_decal(t, .17, .064, 299, .82, 299.69, 0, PI, 0, { rough: .4, metal: .7 }); m.material.bumpMap = t; m.material.bumpScale = 1.6; m.material.needsUpdate = true; } } // Prägung: die dunkle Schrift ist im Relief vertieft (Bump aus der Farbleinwand)
  K1.pola = kapitel1_polaStuhl(); { const p = K1.pola; p.position.set(299.05, kapitel1_topY('io_keller', 299.05, 300.05, 1.2, .5) + .004, 300.05); }
  interact(K1.polaHit = kapitel1_hit(.2, .08, .2, 299.05, .52, 300.05), 'Polaroid', () => kapitel1_polaAnsehen());
  { const t = kapitel1_cnv(256, 160, (x, w, h) => { kapitel1_papier(x, w, h, '#e4dcc4'); x.fillStyle = '#2a2a3a'; x.font = '20px Caveat, cursive'; ['Hilde, Deine Kassetten sind', 'noch bei mir. Die mit Heino', 'behalte ich. – Erna.'].forEach((l, i) => x.fillText(l, 16, 40 + i * 32)); });
    const yk = kapitel1_topY('io_keller', 301.45, 296.72, 1.4, .76) + .004; kapitel1_decal(t, .16, .1, 301.45, yk, 296.72, -PI / 2, 0, .25);
    interact(kapitel1_hit(.2, .06, .14, 301.45, yk + .02, 296.72), 'Zettel', () => { openNote('Zettel auf der Obstkiste', '<span class="hand">„Hilde, Deine Kassetten sind noch bei mir. Die mit Heino behalte ich. – Erna.“</span>', 'k1_erna', () => { if (!K1.f.has('erna')) { K1.f.add('erna'); setTimeout(() => kapitel1_zeile('Oma.', 2200, 'LUKE'), 500); } }); }); }
  { const t = kapitel1_cnv(512, 160, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(40,30,24,.9)'; x.font = '30px Caveat, cursive'; x.fillText('Für Großer. Erst hören, dann heim. – L.', 12, 60); });
    kapitel1_decal(t, .3, .09, 302, .87, 296.63, 0, 0, -.03); }
  { const t = kapitel1_cnv(512, 256, (x, w, h) => { x.clearRect(0, 0, w, h); let px = 20; for (let g = 0; g < 9; g++) { const y0 = g < 5 ? 30 : 140, xx = (g % 5) * 96 + 16; for (let i = 0; i < 4; i++) kapitel1_kreideStrich(x, [[xx + i * 16, y0], [xx + i * 16 + rand(-3, 3), y0 + 70]], 5); if (g < 8) kapitel1_kreideStrich(x, [[xx - 8, y0 + 50], [xx + 64, y0 + 18]], 5); px += 1; }
      kapitel1_verwaschen(x, w, h, 80, [2, 6]); });
    kapitel1_decal(t, .9, .45, 295.12, 1.35, 298.8, 0, PI / 2, 0); }
  { const t = kapitel1_cnv(512, 96, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(30,22,14,.75)'; x.lineWidth = 3; x.font = '46px Georgia'; x.strokeText('1958 1975 1992 2009', 14, 64); });
    kapitel1_decal(t, .9, .17, 298.6, 2.25, 300.2, PI / 2, PI / 2, 0); }
  // Gurte am Stuhl (Basis-Gummibänder): geschlossen, nach dem Schreck „offen“ (hängen herab)
  try { await kapitel1_busBau(); } catch (e) { console.warn('kapitel1 Bus', e); }
  K1.gurte = []; scene.traverse(o => { if (o.userData && typeof o.userData.gurtAuf === 'function') K1.gurte.push({ o }); }); // Gurtbänder baut innen_ort (echte Lederbänder mit Schnalle), jedes kennt sein Aufgehen
}
// Polaroid auf dem Gurtstuhl (Hilde hat es gemacht): Mädchen in Lucys blauem Kleid, grau, ohne Mund, festgeschnallt
function kapitel1_polaCanvas(im) { const c = document.createElement('canvas'); c.width = 300; c.height = 360; const x = c.getContext('2d');
  kapitel1_papier(x, 300, 360, '#f0ebe0'); x.fillStyle = '#16181c'; x.fillRect(18, 18, 264, 264);
  if (im && im.width) { x.save(); x.beginPath(); x.rect(18, 18, 264, 264); x.clip(); x.filter = 'grayscale(.85) contrast(1.15) brightness(.78)'; x.drawImage(im, 18, 18, 264, 264); x.filter = 'none';
    x.fillStyle = 'rgba(70,110,170,.28)'; x.fillRect(18, 150, 264, 132); x.fillStyle = 'rgba(150,150,150,.55)'; x.beginPath(); x.ellipse(150, 105, 44, 56, 0, 0, 7); x.fill();
    x.fillStyle = '#050505'; x.beginPath(); x.ellipse(132, 98, 10, 13, 0, 0, 7); x.fill(); x.beginPath(); x.ellipse(168, 98, 10, 13, 0, 0, 7); x.fill(); x.restore(); }
  x.strokeStyle = 'rgba(40,24,16,.9)'; x.lineWidth = 7; for (const y of [200, 236]) { x.beginPath(); x.moveTo(40, y); x.lineTo(262, y + 4); x.stroke(); }
  const g = x.createRadialGradient(150, 150, 60, 150, 150, 200); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = g; x.fillRect(18, 18, 264, 264);
  x.fillStyle = '#1b1b2a'; x.font = '24px Caveat, cursive'; x.fillText('31.10. Sie sitzt still, solange ich zähle.', 20, 326); return c; }
function kapitel1_polaStuhl() { const c = document.createElement('canvas'); c.width = 300; c.height = 360; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.088, .105), new THREE.MeshStandardMaterial({ map: t, roughness: .45 })); m.rotation.set(-PI / 2, 0, .35); scene.add(m);
  const im = new Image(); im.onload = () => { const s = kapitel1_polaCanvas(im); c.getContext('2d').drawImage(s, 0, 0); t.needsUpdate = true; K1.polaImg = s; }; im.onerror = () => { const s = kapitel1_polaCanvas(null); c.getContext('2d').drawImage(s, 0, 0); t.needsUpdate = true; K1.polaImg = s; }; im.src = 'assets/polaroid/lucy.jpg';
  return m; }
function kapitel1_polaAnsehen() { const src = K1.polaImg ? K1.polaImg.toDataURL('image/jpeg', .85) : '';
  openNote('Polaroid auf dem Stuhl', (src ? `<img src="${src}" style="width:62%;display:block;margin:0 auto 14px;transform:rotate(-1.5deg);box-shadow:0 6px 18px rgba(0,0,0,.6)">` : '') + 'Hildes Schrift auf dem weißen Rand:\n<span class="hand">„31.10. Sie sitzt still, solange ich zähle.“</span>\n\nFestgeschnallt, zwei Gurte quer über Brust und Bauch, wie auf diesem Stuhl: ein Mädchen in Lucys Panda-Top. Das Gesicht grau, ohne Mund, die Augen schwarz.', 'k1_polaStuhl',
    () => { if (!K1.f.has('polaStuhl')) { K1.f.add('polaStuhl'); setTimeout(() => kapitel1_zeile('Wie schnallt man jemanden fest, der nicht da ist?', 3600, 'LUKE'), 700); } }); }
// Zeichnungswand: Dutzende Kinderzeichnungen, alle „LUKE, 9“; rote Lackschrift; in der Ecke die Regel
function kapitel1_wachs(x, pts, col, lw = 4) { // Wachsmalstift: Wachs bleibt nur auf den Papierhöhen (echtes Korn) – kleine Hilfsleinwand nur um den Strich
  const m = x.getTransform(), P = pts.map(([a, b]) => [m.a * a + m.c * b + m.e, m.b * a + m.d * b + m.f]), pad = lw * 3 + 6;
  const x0 = Math.floor(Math.min(...P.map(p => p[0])) - pad), y0 = Math.floor(Math.min(...P.map(p => p[1])) - pad), w = Math.ceil(Math.max(...P.map(p => p[0])) + pad) - x0, h = Math.ceil(Math.max(...P.map(p => p[1])) + pad) - y0;
  if (w <= 0 || h <= 0 || w * h > 4e6) { kapitel1_kreideStrich(x, pts, lw, col); return; }
  const t = document.createElement('canvas'); t.width = w; t.height = h; const y = t.getContext('2d'); y.setTransform(m.a, m.b, m.c, m.d, m.e - x0, m.f - y0);
  kapitel1_kreideStrich(y, pts, lw, col); echt_wachsKorn(y, w, h); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(t, x0, y0); x.restore(); }
function kapitel1_kritzel(x, cx, cy, rx, ry, col, n = 14) { const pts = []; for (let i = 0; i < n; i++) { const u = i / (n - 1); pts.push([cx - rx + u * rx * 2 + rand(-3, 3), cy + (i % 2 ? -ry : ry) * Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) + rand(-3, 3)]); } kapitel1_wachs(x, pts, col, 5); }
// Hildes Satz in Blut: gerade Druckbuchstaben, zwei Zeilen, dicke Striche mit Wulst und Tropfen, Klarlack-Glanz (Höhenrelief aus der Deckkraft). Nur die Wand trägt es, keine Schriftart.
function kapitel1_blutSchrift() { const A = B.wallArt; if (!A || A.userData.blut) return; A.userData.blut = true; ritz_rs = 4711; const W = 2048, H = 324, y0 = 700; // Streifen y 700…1024 der Wandleinwand (2048×1024 auf 8×3,8 m)
  const f = ritz_blutFlaeche(W, H, C => { ritz_zeile(C, null, 'SIE NEHMEN NUR DIE,', 150, 118, 72, { stil: 'blut', winkel: -.006, jit: .6, alpha: .96 }); ritz_zeile(C, null, 'DIE SCHON MAL WEG WAREN.', 130, 232, 72, { stil: 'blut', winkel: .004, jit: .6, alpha: .96 }); });
  const m = ritz_blutMat(f, .95), hh = H / 1024 * 3.8, cy = 1.9 + (.5 - (y0 + H / 2) / 1024) * 3.8, mesh = new THREE.Mesh(new THREE.PlaneGeometry(8, hh), m); mesh.position.set(0, cy - 1.9, .006); mesh.userData.noCol = true; A.add(mesh); A.userData.blutMesh = mesh; } // Kind der Wand: atmet, skaliert und wandert mit
function kapitel1_wandTex() {
  const W = (c, a) => `rgba(${c},${a ?? .9})`, motiv = [
    (x, w, h) => { kapitel1_kritzel(x, w / 2, h * .3, w * .36, h * .1, W('235,205,90'), 18); for (let i = -3; i <= 3; i++) kapitel1_wachs(x, [[w / 2 + i * 11, h * .21], [w / 2 + i * 14, h * .31], [w / 2 + i * 11, h * .4]], W('150,110,50'), 3); // Scheibe mit Rippen wie ein Fisch von unten
      for (let i = 0; i < 9; i++) kapitel1_wachs(x, [[w * .45 + rand(-6, 6), h * .42], [w * (.25 + i * .06), h * .92]], W('250,225,120', .5), 5); },
    (x, w, h) => { for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, cx = w / 2 + Math.cos(a) * w * .3, cy = h * .5 + Math.sin(a) * h * .28; kapitel1_wachs(x, [[cx - 7, cy + 14], [cx - 7, cy - 8], [cx + 7, cy - 8], [cx + 7, cy + 14]], W('120,70,40'), 3); kapitel1_wachs(x, [[cx - 7, cy + 2], [cx + 7, cy + 2]], W('120,70,40'), 3); } }, // acht Stühle im Kreis
    (x, w, h) => { kapitel1_kritzel(x, w * .42, h * .62, w * .16, h * .2, W('200,205,215'), 12); kapitel1_kritzel(x, w * .42, h * .3, 13, 13, W('150,150,150'), 9); x.fillStyle = '#111'; x.fillRect(w * .42 - 8, h * .3 - 4, 5, 6); x.fillRect(w * .42 + 3, h * .3 - 4, 5, 6); // Mädchen ohne Mund mit Laterne
      kapitel1_wachs(x, [[w * .52, h * .48], [w * .7, h * .44], [w * .7, h * .52]], W('40,40,40'), 3); kapitel1_kritzel(x, w * .7, h * .6, 9, 9, W('255,170,40'), 8); },
    (x, w, h) => { for (let i = 0; i < 6; i++) { const cx = w * .14 + i * w * .15, cy = h * .55, c = W(['40,60,160', '160,40,40', '40,120,60', '120,80,30', '30,30,30', '140,60,140'][i]); kapitel1_wachs(x, [[cx, cy - 15], [cx, cy + 8], [cx - 6, cy + 22]], c, 3); kapitel1_wachs(x, [[cx, cy + 8], [cx + 6, cy + 22]], c, 3); kapitel1_kritzel(x, cx, cy - 22, 7, 7, c, 6); }
      kapitel1_wachs(x, [[w * .08, h * .5], [w * .92, h * .5]], W('30,30,30', .8), 3); }, // Kinder an einer Kette wie beim Kettenfangen
  ];
  return kapitel1_cnv(2048, 1024, (x, w, h) => { x.clearRect(0, 0, w, h); const farben = ['30,50,150', '150,30,30', '30,110,50', '110,60,30', '30,30,30'];
    for (let i = 0; i < 58; i++) { const px = rand(20, w - 170), py = rand(16, h * .66), pw = rand(118, 168), ph = rand(128, 168);
      x.save(); x.translate(px + pw / 2, py + ph / 2); x.rotate(rand(-.16, .16)); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(-pw / 2 + 4, -ph / 2 + 5, pw, ph); x.translate(-pw / 2, -ph / 2); papierScan(x, pw, ph, `hsl(${rand(36, 52)},${rand(10, 30)}%,${rand(62, 80)}%)`, { dreck: rand(.25, .6) }); /* QA-Art 09.10.: Papier etwas gealterter/dunkler – im Lampenkegel war die Wand ein weißer Block */ // echtes Papier (Faserscan + Altersflecken) statt flacher Farbe
      { const eg = x.createLinearGradient(0, 0, pw, ph); eg.addColorStop(0, 'rgba(255,250,235,.10)'); eg.addColorStop(.5, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(60,40,20,.14)'); x.fillStyle = eg; x.fillRect(0, 0, pw, ph); x.strokeStyle = 'rgba(80,60,40,.22)'; x.lineWidth = 1.2; x.strokeRect(.6, .6, pw - 1.2, ph - 1.2); } // Papierkanten dunkeln, Licht von links oben
      if (rand(0, 1) < .5) { x.save(); x.beginPath(); x.rect(0, 0, pw, ph); x.clip(); echt_fleck(x, rand(0, pw), rand(0, ph), pw * rand(.5, 1.1), 'rgb(112,86,50)', rand(.1, .26), rand(0, 6.28)); x.restore(); } // Wasserflecken aus dem Feuchtescan
      { const sk = rand(.72, 1.04), sp = rand(0, 1) < .35; x.save(); x.translate(pw / 2 + rand(-12, 12), ph / 2 + rand(-10, 8)); x.rotate(rand(-.12, .12)); x.scale(sp ? -sk : sk, sk); x.translate(-pw / 2, -ph / 2); // QA-Art 09.10.: vier Motive auf 58 Blättern – je Blatt anders gesetzt (Größe, Lage, Neigung, gespiegelt), damit keine Kopien in Reihe entstehen
        motiv[i % motiv.length](x, pw, ph); x.restore(); }
      if (rand(0, 1) < .6) kapitel1_kritzel(x, pw * rand(.8, .92), ph * rand(.35, .65), 8, rand(14, 24), W('125,125,130', .5), 9); // grauer Fleck am Bildrand, weggerubbelt (nicht auf jedem Blatt)
      { const sx = rand(0, 1) < .8 ? pw - rand(56, 70) : rand(8, 20), sy = ph - rand(6, 14); echt_wachsText(x, 'LUKE, 9', sx, sy, `${rand(12, 18) | 0}px "Comic Sans MS", Caveat, cursive`, W(farben[(i * 3 + (rand(0, 2) | 0)) % farben.length], rand(.7, .9)), rand(-.12, .08)); } // Wachsstift-Unterschrift mit Korn, Lage/Größe/Farbe je Blatt verschieden
      x.fillStyle = '#a9a9a9'; x.beginPath(); x.arc(pw / 2 + rand(-4, 4), 6, 3.5, 0, 7); x.fill(); x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(pw / 2 - 1, 8, 3, 3); x.restore(); }
    // Hildes Satz („SIE NEHMEN NUR DIE …“) steht jetzt als echte Blutschrift auf einer eigenen Ebene (kapitel1_blutSchrift)
    x.save(); x.translate(1700, 990); x.rotate(-.1); x.fillStyle = 'rgba(40,60,150,.7)'; x.font = '19px "Comic Sans MS", Caveat, cursive'; x.fillText('REGEL: WER GEFUNDEN', 0, 0); x.fillText('WIRD MUSS ZÄLEN', 8, 22); x.restore(); });
}

// ================================================================= UK 1: die Gestalt am Ostende, das Nachbild an der Kreuzung
function kapitel1_ostende() { if (K1.f.has('ostende')) return; K1.f.add('ostende'); state.watcherGone = true; K1.ost = { t: 0, d0: scene.fog.density, aus: false }; if (typeof eyes !== 'undefined') eyes.visible = false; watcher.visible = true; watcher.position.set(69.3, 0, 5.1); watcher.rotation.y = -PI / 2; }
function kapitel1_ostTick(dt) { const O = K1.ost; if (!O) return; O.t += dt; const k = O.t < .9 ? O.t / .9 : O.t < 3.1 ? 1 : Math.max(0, 1 - (O.t - 3.1) / 1.2); scene.fog.density = O.d0 * (1 - .72 * k);
  if (O.t > 2.3 && !O.aus) { O.aus = true; endLamp.mode = 'k1puste'; endLamp.dead = 0; if (typeof kino_pusten === 'function') kino_pusten(.05, endLamp.wx, 5, endLamp.wz); }
  if (O.t > 3.3 && !O.ruf) { O.ruf = true; watcher.visible = false; Audio.whisper(player.pos.x + 26, 1.7, player.pos.z + 1, 1.3); subtitle('… Lu–?', 2400, ''); setTimeout(() => kapitel1_zeile('<i>„… Lucy?“ Hat der gerade Lucy gerufen? … Wer steht nachts am Straßenende und ruft nach meiner Schwester?</i>', 5600, 'LUKE'), 2600); }
  if (O.t > 4.4) { scene.fog.density = O.d0; K1.ost = null; } }
function kapitel1_nachbild() { if (K1.f.has('nachbild')) return; const E = ECHOES.find(e => e.id === 'echo_kreuzung'); if (!E || echoSeen.has(E.id) || state.talking) return; K1.f.add('nachbild');
  playEcho(E).then(() => { setTimeout(() => { if (typeof gedanke === 'function') gedanke('k1_narbe', 'Die Narbe. Fahrradunfall, hat Mama gesagt. Ich weiß nicht mal, welches Fahrrad.', 0, 3); }, 7500);
    kapitel1_lore('werbinich_2', 'Wer bin ich? · 2', '<span class="hand">Die Narbe hat gebrannt. Fahrradunfall, hat Mama gesagt. Welches Fahrrad?</span>'); }); }

// ================================================================= UK 3: Nr. 7 (Briefkasten, Katzen, Fernseher, „Nicht du“)
function kapitel1_briefkasten() {
  if (state.hasKey) return toast('Leer. Nur ein toter Falter.');
  state.hasKey = true; door7.locked = false; setMain(1); setTimeout(() => addItem('key'), 900);
  tween(mailbox7.userData.lid, { rx: 1.45 }, .5); Audio.play('metalOpen', { gain: .35, rate: 1.4, x: 28.4, y: 1.2, z: -6.9, ref: 2 });
  setTimeout(() => { Audio.chime(); liftTo(keyMesh, () => openNote('Im Briefkasten', 'Der Haustürschlüssel, an Lucys Anhänger: ein Panda aus Plastik, ein Ohr ab. Darunter ein Zettel in Lucys Schleifen-Schrift:\n\n<span class="hand">Großer, falls ich nicht heimkomme:\nHilde macht nachts nicht auf. Sie weiß nie, wer vor der Tür steht.\nDas Band im Keller ist für dich. Hör es. Dann fahr heim.\nHinter den Bildern ist eine Tür. Mach sie NICHT auf.\nL. (22.10.)</span>\n\n<i>Rückseite, eine Einkaufsliste:</i>\n<span class="hand">Katzenfutter für Gisela, Kerzen, Batterien, Tampons</span>', 'key',
    () => { setTimeout(() => { if (!state.talking) kapitel1_zeile('Wohnst du hier? Ich hab einen Schlüssel, du nicht.', 3400, 'LUKE'); }, 900); }), false); }, 520);
  setTimeout(() => { if (typeof sideStart === 'function' && story.side.seven) sideStart('seven'); }, 5000); setTimeout(() => { if (typeof sideStart === 'function' && story.side.call) sideStart('call'); }, 20000);
}
function kapitel1_katzenTick(dt) { if (typeof katzen_get !== 'function' || !kapitel1_on()) return; const P = player.pos;
  // HÄNSCHEN sitzt inzwischen auf dem Briefkasten von Nr. 7, als wäre er der Hausherr
  if (!K1.f.has('haenschen') && !state.hasKey && P.x > -8 && kapitel1_d(28.4, -6.9) > 16) { const k = katzen_get('HÄNSCHEN'); if (k) { K1.f.add('haenschen'); try { katzen_place(k, 28.5, -6.2, { pose: 'sit' }); katzen_jumpTo(k, 28.4, 1.36, -6.9, 'sit'); katzen_stare(k, [29.6, .2, -11.7]); } catch (e) {} } }
  // PETER läuft Luke vor der Tür zwischen die Beine und beißt in den Schnürsenkel
  if (!K1.f.has('peter') && state.hasKey && !state.slammed && P.x > 21 && P.x < 29 && P.z < -6.8 && P.z > -11.8) { const k = katzen_get('PETER'); if (k) { K1.f.add('peter'); try { if (!k.on) katzen_spawn({ name: 'PETER', x: P.x + 2, z: P.z + 1.4, pose: 'sit' }); katzen_goto(k, P.x + .25, P.z + .2, { lauf: true, dann: 'stand', fertig: () => { Audio.play('scrape1', { gain: .08, rate: 2.6, x: P.x, y: .1, z: P.z, ref: 1, dur: .25 }); setTimeout(() => kapitel1_zeile('Aua. Peter. Du bist ja ein Charmeur.', 3000, 'LUKE'), 350); setTimeout(() => { try { katzen_goto(k, 24.6, -7.4, { dann: 'sit' }); } catch (e) {} }, 2600); } }); } catch (e) {} } }
  // Stromausfall: BÄRBEL sitzt hinter Luke auf dem Bordstein und sieht nicht nach oben – sie sieht in die Hecke
  if (state.outage && K1.aus && !K1.f.has('baerbel') && K1.aus.t > 4) { const k = katzen_get('BÄRBEL'); if (k) { K1.f.add('baerbel'); try { const f = flatDir(), x = P.x - f.x * 3.2, z = Math.max(-6.4, Math.min(6.4, P.z - f.z * 3.2)); katzen_place(k, x, z > 0 ? 6.3 : -6.3, { pose: 'sit' }); katzen_stare(k, [37, .6, -9]); } catch (e) {} } }
}
// Fernseher: ein graues Gesicht ohne Mund taucht aus dem Schnee auf, dann „HALLO LUKE“ in Kinderkreide (R-9: gerenderter Kopf mit Röhrenbild, kino_tvGesicht)
function kapitel1_tv() { return true; }
function kapitel1_tvTick(dt) { const T = K1.tv; if (tvLight.userData.dead || K1.f.has('tv') || !kapitel1_on()) return; const d = camera.position.distanceTo(tvScreen.position), look = kapitel1_blick(tvScreen.position.x, tvScreen.position.y, tvScreen.position.z);
  if (!T.fr) { if (d < 3.4 && look > .93 && Math.hypot(vel.x, vel.z) < .5) T.t += dt; else T.t = Math.max(0, T.t - dt); if (T.t > 1.4) { T.fr = 1; T.ft = 0; } return; }
  // Bühne: eigenes, feineres Bild (256×192) für die Dauer des Gesichts, danach wieder das Rauschbild der Basis
  if (!T.cv) { T.cv = document.createElement('canvas'); T.cv.width = 256; T.cv.height = 192; T.cx = T.cv.getContext('2d'); T.tx = new THREE.CanvasTexture(T.cv); T.tx.colorSpace = tvTex.colorSpace; T.map0 = tvScreen.material.emissiveMap; tvScreen.material.emissiveMap = T.tx; tvScreen.material.needsUpdate = true;
    if (typeof kino_tvTon === 'function') kino_tvTon(tvScreen.position); }
  T.ft += dt; const t = T.ft, x = T.cx, W = 256, H = 192;
  if (t < 1.05 && typeof kino_tvGesicht === 'function') { const k = t < .35 ? (t / .35) * (t / .35) : t < .9 ? 1 : Math.max(0, 1 - (t - .9) / .15); kino_tvGesicht(x, W, H, t, k); tvLight.intensity = 1.1 + 1.4 * k; }
  else if (t < 1.85) { const im = x.createImageData(W, H); for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 200; im.data[i] = im.data[i + 1] = v * .92; im.data[i + 2] = v; im.data[i + 3] = 255; } x.putImageData(im, 0, 0);
    if (t > 1.15) { x.save(); x.translate(128 + rand(-1, 1), 104); x.rotate(-.04); x.font = 'bold 34px Caveat, "Comic Sans MS", cursive'; x.textAlign = 'center'; x.lineJoin = 'round';
      x.strokeStyle = 'rgba(20,20,22,.85)'; x.lineWidth = 9; x.strokeText('HALLO LUKE', 0, 0); x.fillStyle = 'rgba(244,241,230,.95)'; x.fillText('HALLO LUKE', 0, 0);
      x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(0,0,0,${rand(.2, .7)})`; x.fillRect(rand(-100, 100), rand(-28, 6), rand(1, 3), 1); } x.restore(); } tvLight.intensity = 1.6; }
  else { tvScreen.material.emissiveMap = T.map0; tvScreen.material.needsUpdate = true; K1.f.add('tv'); state.tvSeen = true; setTimeout(() => kapitel1_zeile('Netzbrummen, fünfzig Hertz. Sauber. Wenigstens der Strom funktioniert hier noch.', 4200, 'LUKE'), 1600); return; }
  T.tx.needsUpdate = true; }
// „Nicht du“: Hilde packt das linke Handgelenk, dreht die Handfläche unter die Küchenlampe, sieht hin, sieht ihm ins Gesicht
async function kapitel1_nichtDu() {
  scareCount++; setFace(stalker, 'wendt'); const P = player.pos; K1.f.add('nichtdu');
  const from = stalker.position.clone(), to = inFront(.5, Y).clone(); let t = 0; const dur = 1.05;
  while (t < dur) { await wait(16); t += .016; const k = t / dur, e = k * k * (3 - 2 * k); stalker.position.lerpVectors(from, to, e); stalker.position.y = Y + Math.sin(k * PI * 2) * .012; stalker.lookAt(P.x, Y, P.z); }
  Audio.play('items1', { gain: .35, rate: 1.4, x: P.x, y: 1.1, z: P.z, ref: 1, dur: .35 }); Audio.heart(); shake = .02; K1.griff = { t: 0 };
  setCamOverride((cam, dt) => { const G = K1.griff; if (!G) return; G.t += dt; const w = G.t < .45 ? kapitel1_ease(G.t / .45) : G.t < 2.3 ? 1 : Math.max(0, 1 - (G.t - 2.3) / .5);
    const f = flatDir(); kapitel1_o.position.copy(cam.position); kapitel1_o.lookAt(P.x + f.x * .45 - f.z * .22, Y + (G.t < 1.3 ? .95 : 1.55), P.z + f.z * .45 + f.x * .22); cam.quaternion.slerp(kapitel1_o.quaternion, w); });
  await wait(1350); subtitle('„Nicht du.“', 2400, 'HILDE'); await wait(1500);
  Audio.play('glass1', { gain: .7, rate: .9, x: 29, y: 1, z: -14.5, ref: 3 }); kitchenLight.userData.dead = true; tube.material.emissiveIntensity = 0;
  await cutLights(800); K1.griff = null; setCamOverride(null); hideStalker(); kitchenLight.userData.dead = false; kapitel1_fussspuren();
  toast('Der Flur ist leer. Auf den Fliesen kleine nackte Fußabdrücke, Grashalme darin, fremdes, hellgrünes Gras im November. Sie führen zur Kellertür. Und hören dort auf. Von innen.', 6200);
  setTimeout(() => { if (!state.talking) kapitel1_zeile('Die Alte hat Kinderfüße?', 2800, 'LUKE'); }, 7200);
  if (typeof gedanke === 'function') gedanke('k1_hilde', 'Das war Frau Wendt. Hilde. Sie hat mir in die Hand geguckt wie in einen Ausweis. „Nicht du.“ Wen hat sie denn erwartet?', 16000, 2); // F3 Verständlichkeit: wer war das, welche Frage bleibt
  // Lukes Taschenlampe liegt jetzt auf dem Boden und leuchtet genau auf das Tastenfeld
  K1.lampe = { x: 29.9, y: Y + .06, z: -20.3 }; K1.lampeHit = kapitel1_hit(.45, .2, .45, 29.9, Y + .1, -20.3); interact(K1.lampeHit, 'Taschenlampe aufheben', () => { K1.lampe = null; uninteract(K1.lampeHit); flashOn = true; Audio.play('switch1', { gain: .35 }); });
  flashOn = true; try { saveGame(1); } catch (e) {} if (typeof todCpShow === 'function') todCpShow('Der Sessel ist noch warm');
}
const kapitel1_ease = k => k * k * (3 - 2 * k);
function kapitel1_fussspuren() { if (K1.fuss) { K1.fuss.visible = true; return; } const t = kapitel1_cnv(64, 128, (x, w, h) => { x.fillStyle = 'rgba(46,56,30,.55)'; if (!echt_fuss(x, 32, 64, 108, 'rgb(46,56,30)', .6, false)) { x.beginPath(); x.ellipse(32, 80, 13, 30, 0, 0, 7); x.fill(); for (let i = 0; i < 5; i++) { x.beginPath(); x.arc(20 + i * 6, 42 - Math.abs(2 - i) * 3, 4, 0, 7); x.fill(); } } // echter Abdruck aus Farbspritzern
    x.strokeStyle = 'rgba(120,190,70,.8)'; x.lineWidth = 1.5; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(rand(18, 46), rand(60, 110)); x.lineTo(rand(18, 46), rand(60, 110)); x.stroke(); } });
  const pts = [[27.2, -15.2], [27.7, -16.1], [28.1, -17.2], [28.8, -18.1], [29.2, -19.2], [29.9, -20.1], [30.2, -21.1]]; const im = new THREE.InstancedMesh(new THREE.PlaneGeometry(.075, .15), kapitel1_mat(t), pts.length);
  pts.forEach(([x, z], i) => { const n = pts[Math.min(i + 1, pts.length - 1)], p = pts[Math.max(0, i - 1)]; kapitel1_o.position.set(x + (i % 2 ? .07 : -.07), Y + .006, z); kapitel1_o.rotation.set(-PI / 2, 0, Math.atan2(n[0] - p[0], -(n[1] - p[1]))); kapitel1_o.scale.setScalar(1); kapitel1_o.updateMatrix(); im.setMatrixAt(i, kapitel1_o.matrix); });
  scene.add(im); K1.fuss = im; }
function kapitel1_lampeTick() { const L = K1.lampe; if (!L) return; flashRig.position.set(L.x, L.y, L.z); kapitel1_o.position.set(L.x, L.y, L.z); kapitel1_o.lookAt(keypadMesh.position.x, keypadMesh.position.y, keypadMesh.position.z); kapitel1_o.rotateY(PI); flashRig.quaternion.copy(kapitel1_o.quaternion); } // Lampe leuchtet entlang −z

// ================================================================= UK 4: Kellertür, Code 3110, Fehlversuche, Hilfeleiter
function kapitel1_kpPress(k) {
  if (performance.now() < kpBusy || ui.overlay !== 'keypad') return;
  const disp = $('kpDisplay'); disp.classList.remove('err');
  if (k === 'C') kpValue = '';
  else if (k === 'OK') { kpBusy = performance.now() + 500;
    if (kpValue === '3110') { Audio.beep(true); closeOverlay(); state.cellarOpen = true; Audio.play('lockOpen', { gain: .8, x: 30, y: 1.2, z: -21.8, ref: 2 }); K1.stimmeAus = true; subtitle('„Gro–“', 700, 'LUCY?');
      setTimeout(() => { tween(cellarDoor, { ry: -1.5 }, 1.1); Audio.creak(.35, 30, 1.2, -21.8); }, 350); setTimeout(enterBasement, 1600); return; }
    Audio.beep(false); void disp.offsetWidth; disp.classList.add('err'); kpValue = ''; const n = ++state.wrongCodes;
    if (n === 1) { kpSay('Falsch. Unter den Dielen kratzt etwas, von der Kellertreppe her.'); Audio.play('scrape2', { gain: .22, rate: .8, x: 30.2, y: .3, z: -21.2, ref: 2 }); setTimeout(() => { if (ui.overlay === 'keypad') subtitle('„Du kannst das, Großer.“', 2800, 'LUCY?'); }, 1500); K1.kp.blick = true; }
    else if (n === 2) { kpSay('Stille. Die Stimme ist weg.'); K1.stimmeAus = true; setTimeout(() => { subtitle('Es lauscht.', 2200, 'LUKE'); setTimeout(() => toast('Sie hat den Tag eingekreist, an dem es zurückkam. Tag und Monat.', 5200), 2600); }, 900); }
    else if (n === 3) { closeOverlay(); scareCellarDoor(); setTimeout(() => toast('Lies, was im Haus liegt. Der Kalender weiß den Tag.', 5200), 7000); return; }
    else if (n === 4) kpSay('Der Kalender weiß den Tag. Erst der Tag, dann der Monat.');
    else { kpSay(n === 5 ? 'Stille.' : 'Nur 0, 1 und 3 sind abgegriffen. Der eingekreiste Tag, dann der Monat.'); if (n === 5) kapitel1_whiskeyFenster(); }
  } else if (kpValue.length < 4) { kpValue += k; Audio.beep(true); }
  kpRender();
}
// Dritter Fehlversuch: drei Schläge von innen, Tastenfeld rot, ein Flüstern – kein Stinger (A-26); B-K1-02 legt beobachter.js hinter Lukes Füße
async function kapitel1_scareKellertuer() {
  scareCount++; const base = cellarDoor.position.z;
  for (let i = 0; i < 3; i++) { Audio.play('metalSlam', { gain: 1.2, rate: rand(.85, .95), x: 30, y: 1, z: -22.2, ref: 2 }); Audio.thump(30, 1, -22.2); shake = .08;
    for (let k = 0; k < 8; k++) { cellarDoor.position.z = base + (Math.random() - .5) * .07 * (1 - k / 8); await wait(30); } cellarDoor.position.z = base; await wait(i === 1 ? 900 : 420); }
  keypadMesh.material.emissive.set(0xff3030); keypadMesh.material.emissiveIntensity = 2;
  await wait(700); Audio.whisper(30, 1.4, -21.8, 1.4); subtitle('<i>… nicht … raten …</i>', 1800);
  setTimeout(() => { keypadMesh.material.emissive.set(0x33ff55); keypadMesh.material.emissiveIntensity = .9; }, 4000);
}
// Hilfe 5: Whiskey hackt am Küchenfenster gegen die Scheibe, dreimal, dann einmal
function kapitel1_whiskeyFenster() { if (typeof whiskey_setzen !== 'function' || K1.f.has('fenster')) return; K1.f.add('fenster'); const x = 27.4, y = 1.68, z = -11.98;
  whiskey_setzen(x, y, z, () => { const pk = i => setTimeout(() => { Audio.play('woodHit1', { gain: .16, rate: 2.4, x, y: y + .1, z, ref: 2, dur: .12 }); if (typeof whiskey_play === 'function') whiskey_play('EatSomething', .06, true, 1.6); }, i);
    [0, 380, 760, 1900].forEach(pk); }); }
function kapitel1_kpTick(dt) { if (!K1.f.has('haemmern') && !ui.overlay && !state.talking && !state.cellarOpen && camera.position.distanceTo(keypadMesh.position) < 2.3 && kapitel1_blick(30.75, Y + 1.29, -21.73) > .95) { K1.f.add('haemmern'); state.talking = true;
    say([['Wer hämmert denn auf ein Tastenfeld?', 2600, 'LUKE'], ['…', 1400], ['… Ach so. Von innen.', 2600, 'LUKE']]).then(() => { state.talking = false; }); }
  if (ui.overlay === 'keypad' && !state.cellarOpen) { K1.kp.t += dt; if (K1.kp.t > 40 && !K1.f.has('kp40') && typeof gedanke === 'function') { K1.f.add('kp40'); gedanke('k1_kp40', 'Vier Ziffern. Welche Tasten sind abgegriffen? Und was hat Hilde in ihrem Kalender angestrichen?', 0, 3); }
    if (!K1.f.has('kpStimme')) { K1.f.add('kpStimme'); kapitel1_stimme(); } }
  // Hilfe 2: nach dem ersten Fehlversuch zuckt der Blick zum Kalender, sobald das Tastenfeld zu ist
  if (K1.kp.blick && !ui.overlay && !state.talking) { K1.kp.blick = false; K1.kp.b = { t: 0 }; setCamOverride((cam, d) => { const B = K1.kp.b; if (!B) return; B.t += d; const w = B.t < .35 ? kapitel1_ease(B.t / .35) * .55 : Math.max(0, .55 * (1 - (B.t - .6) / .5));
      kapitel1_o.position.copy(cam.position); kapitel1_o.lookAt(calendar.position.x, calendar.position.y, calendar.position.z); cam.quaternion.slerp(kapitel1_o.quaternion, w); if (B.t > 1.15) { K1.kp.b = null; setCamOverride(null); } }); } }
// Lucys Stimme hinter der Tür; darunter ganz leise eine Spieluhr (E D C H C) – Luke hört es, er ist Tontechniker
async function kapitel1_stimme() { await wait(700); if (state.cellarOpen || K1.stimmeAus) return; Audio.whisper(30, 1.1, -22.3, 1.4);
  subtitle('„Luke? Luke, bist du das? Mach auf. Bitte.“', 3600, 'LUCY?'); if (typeof kino_box === 'function') kino_box(['E5', 'D5', 'C5', 'B4', 'C5'], .4, .014, .97); await wait(3900); if (state.cellarOpen || K1.stimmeAus) return;
  subtitle('„Es ist so dunkel hier. Großer, mach auf.“', 3600, 'LUCY?'); if (typeof kino_box === 'function') kino_box(['E5', 'D5', 'C5', 'B4', 'C5'], .2, .012, .97);
  if (typeof gedanke === 'function') gedanke('k1_spieluhr', 'Da läuft was unter ihrer Stimme. Eine Spieluhr? Lucy hatte so eine. … Sie hat „Großer“ gesagt. Nur Lucy sagt Großer.', 4200, 3); }

// ================================================================= UK 5: Keller (Zeichnungen, Tonband, „… danke, Luke …“)
async function kapitel1_enterBasement() {
  if (K1.v.on) return kapitel1_kellerEnde();
  if (stairBusy || state.inBasement) return; stairBusy = true;
  try { Audio.creak(undefined, 30, 1.2, -21.8); await fade(1, 900); state.inBasement = true; setMain(4);
    player.pos.set(B.x + 4.28, 0, B.z + 3.45); player.yaw = 1.0; /* R-6: am Fuß der Kellertreppe */ player.pitch = -.1; vel.set(0, 0, 0); camY = 1.65; await wait(400); } finally { stairBusy = false; } fade(0, 1600);
  if (!K1.f.has('sommer')) { K1.f.add('sommer'); setTimeout(() => kapitel1_zeile('Beton. Und … Sommer? Es riecht nach Sommer.', 3600, 'LUKE'), 900); try { saveGame(1); } catch (e) {} setTimeout(() => { if (typeof todCpShow === 'function') todCpShow('LUKE, 9'); }, 1200); }
}
function kapitel1_wand() { if (!K1.f.has('wand')) { K1.f.add('wand'); kapitel1_zeile('Ich hab nie gemalt. Ich hab nicht mal in der Schule gemalt.', 3800, 'LUKE');
    if (kapitel1_lore('werbinich_1', 'Wer bin ich? · 1', '<span class="hand">Ich hab nie gemalt. Auf jeder Zeichnung steht mein Name.</span>')) questPop('ABENTEUERFIBEL', 'Wer bin ich?'); return; }
  if (!K1.f.has('regel')) { K1.f.add('regel'); toast('In einer Ecke, Buntstift, kindlich: „REGEL: WER GEFUNDEN WIRD MUSS ZÄLEN“.', 5200); return; }
  toast('Kinderzeichnungen. Buntstift, Wachsmalkreide. Jede unten rechts signiert: LUKE, 9.', 4200); }
async function kapitel1_band() {
  if (state.talking || state.heardTape) return; if (!K1.f.has('bandZettel')) { K1.f.add('bandZettel'); return openNote('Zettel am Kassettenrekorder', '<span class="hand">„Für Großer. Erst hören, dann heim. – L.“</span>', 'k1_bandzettel'); }
  state.talking = true; Audio.tape(true); state.tapeOn = true; const bx = B.x + 2, bz = B.z - 3.2; Audio.play('switch1', { gain: .5, x: bx, y: .9, z: bz, ref: 1.5 });
  const L = 'LUCY · TONBAND';
  await say([['*Rauschen. Fingernägel kratzen am Mikrofon.*', 2200], ['„Hey, Großer. Ich weiß jetzt, was im Sommer 2009 passiert ist. Nicht nur, dass. Was.“', 4600, L], ['„Wir waren weg. Sieben Kinder. Ich. Und du auch.“', 3800, L], ['„Hilde hat mir alles gezeigt. Sie zählt nachts. Sie sagt, es sind immer acht.“', 4400, L], ['*Knacken. Räuspern.*', 1800]]);
  // das Band läuft weiter, wenn Luke stehen bleibt
  const t0 = performance.now(); let still = 0; while (performance.now() - t0 < 20000) { await wait(100); still = Math.hypot(vel.x, vel.z) < .35 ? still + .1 : 0; if (still > 1.2) break; }
  await kapitel1_danke();
  await say([['„Sie haben uns zurückgebracht. Aber nicht alles von uns.“', 4200, L], ['„Wenn du das hörst, bin ich schon wieder weg. Fahr heim, Großer. Frag Hilde nichts. Frag niemanden. Fahr heim.“', 6200, L], ['*Klick. Bandende.*', 1500]]);
  Audio.tape(false); state.tapeOn = false; Audio.play('switch2', { gain: .5, x: bx, y: .9, z: bz, ref: 1.5 }); state.heardTape = true; setMain(5); addItem('tape');
  kapitel1_lore('tape', 'Lucys Tonband', '„Hey, Großer. Ich weiß jetzt, was im Sommer 2009 passiert ist. Nicht nur, dass. Was.\nWir waren weg. Sieben Kinder. Ich. Und du auch.\nHilde hat mir alles gezeigt. Sie zählt nachts. Sie sagt, es sind immer acht.\n(Knacken, Räuspern)\nSie haben uns zurückgebracht. Aber nicht alles von uns.\nWenn du das hörst, bin ich schon wieder weg. Fahr heim, Großer. Frag Hilde nichts. Frag niemanden. Fahr heim.“');
  await wait(5000); state.talking = false; subtitle('<i>Irgendwas ist gerade an mir vorbei die Treppe hoch. Und ich hab ihm die Tür aufgemacht.</i>', 5200, 'LUKE');
}
// „… danke, Luke …“ (Stufe 3): die Birne stirbt; im Flackern (vier Zuckungen, jede kürzer) sitzt jemand auf dem Stuhl. Birne an: leer, Gurte offen, nackte Füße die Treppe hoch
async function kapitel1_danke() {
  scareCount++; const b = bLights[0]; b.dark = true; b.bulb.material.emissiveIntensity = 0; flashOn = false; state.blackout = true; Audio.buzz(B.x - 1, 2.3, B.z);
  await wait(1500); sitter.position.set(B.x - 1, .05, B.z + .05); sitter.scale.setScalar(.9); sitter.rotation.y = 0; setFace(sitter, 'lena'); Audio.play('woodSqueak1', { gain: .5, x: B.x - 1, y: .6, z: B.z, ref: 2 });
  const zuck = [260, 170, 110, 70]; for (let i = 0; i < 4; i++) { b.dark = false; b.bulb.material.emissiveIntensity = 5; state.blackout = false; sitter.visible = true; sitter.lookAt(camera.position.x, .05, camera.position.z);
    if (i === 1) { subtitle('„… danke, Luke …“', 2600, 'LUCY?'); Audio.whisper(B.x - 1, 1.3, B.z, 1.1); } await wait(zuck[i]); b.dark = true; b.bulb.material.emissiveIntensity = 0; state.blackout = true; sitter.visible = false; await wait(rand(260, 480)); }
  await wait(400); b.dark = false; b.bulb.material.emissiveIntensity = 5; state.blackout = false; flashOn = true; state.flashFail = 1.2; kapitel1_gurteAuf(); state.chainsT = 6;
  for (let i = 0; i < 8; i++) setTimeout(() => Audio.stepAt(B.x + 4.2, B.z + 2.9 - i * .3, .09 + i * .004), 900 + i * 260); // nackte Füße, nach oben
  toast('Der Stuhl ist leer. Die Gurte sind offen.', 4200); }
function kapitel1_gurteAuf() { K1.f.add('gurte'); if (!K1.gurte || !K1.gurte.length) { K1.gurte = []; scene.traverse(o => { if (o.userData && typeof o.userData.gurtAuf === 'function') K1.gurte.push({ o }); }); } K1.gurte.forEach(({ o }) => { if (!o.userData.offen) { o.userData.offen = true; o.userData.gurtAuf(); } }); if (K1.pola) K1.pola.visible = false; if (K1.polaHit) uninteract(K1.polaHit); }
function kapitel1_treppe() { if (K1.v.on || K1.v.done || state.ch1Done) return toast('Die schwere Tür ist zu. Von dieser Seite gibt es kein Tastenfeld.', 3800); if (!state.heardTape) return toast('Noch nicht. Lucy wollte, dass du hier etwas findest.'); leaveBasement(); }

// ================================================================= UK 6: Von Ost nach West
async function kapitel1_leaveBasement() {
  if (stairBusy || !state.inBasement) return; stairBusy = true;
  try { await fade(1, 900); state.inBasement = false; player.pos.set(30, 0, -20.6); player.yaw = 0; player.pitch = 0; vel.set(0, 0, 0); camY = Y + 1.65; await wait(500); } finally { stairBusy = false; } fade(0, 1200);
  if (K1.f.has('oben')) return; K1.f.add('oben'); setMain(5);
  // die Haustür, die zugeschlagen war, ist angelehnt; auf der Anrichte liegt Lucys Zettel wieder ausgebreitet, „heim“ frisch unterstrichen
  K1.tuerWinkel = door7.openAngle; door7.openAngle = door7.openAngle * .3; door7.set(true); Audio.creak(.12, 23, 1.2, door7.pivot.position.z);
  if (K1.zettel) { K1.zettel.visible = true; interact(K1.zettelHit, 'Lucys Zettel', () => openNote('Lucys Zettel', '<span class="hand">Großer, falls ich nicht heimkomme:\nHilde macht nachts nicht auf. Sie weiß nie, wer vor der Tür steht.\nDas Band im Keller ist für dich. Hör es. Dann fahr <u>heim</u>.\nHinter den Bildern ist eine Tür. Mach sie NICHT auf.\nL. (22.10.)</span>\n\n<i>Fibel:</i> <span class="hand">Das war vorhin nicht unterstrichen. Ich hab keinen Bleistift.</span>', 'k1_zettel2')); }
  K1.obenT = 0;
}
function kapitel1_obenTick(dt) { if (!K1.f.has('oben') || !kapitel1_on()) return;
  /* Haustür nach dem Keller steht nur „angelehnt“ (27°): die Türplatte sperrt dann fast die ganze Öffnung, man kam nur nach Schließen + Öffnen hinaus (Testlauf 08.10.). Tritt Luke an die Tür (oder schließt er sie), schwingt sie ganz auf – auch während des Stromausfalls. */
  if (K1.tuerWinkel !== undefined && (!door7.open || (!state.inBasement && kapitel1_d(23, -13.4) < 2.6))) { door7.openAngle = K1.tuerWinkel; K1.tuerWinkel = undefined; }
  if (state.outage) return; K1.obenT += dt;
  const P = player.pos, drin = !!indoorRect() || state.inBasement;
  if (!drin && !K1.still && kapitel1_d(28.4, -6.9) < 14) { K1.still = { t: 0 }; if (typeof whiskey_S !== 'undefined') whiskey_S.forceStill = 30; }
  if (K1.still) { K1.still.t += dt; if (K1.still.t > .6 && !K1.still.g) { K1.still.g = 1; kapitel1_zeile('<i>Der Vogel ist still. Seit ich hier bin, war der nie still.</i>', 4200, 'LUKE'); } if (K1.still.t > 5.2) startOutage(); }
  else if (K1.obenT > 150) startOutage(); }
// Stromausfall (ersetzt die Basis): Lampe flackert und stirbt, Häuser dunkel, Brummen; dann werden die Laternen ausgeblasen, von Ost nach West, im Takt eines Kindes
async function kapitel1_ausfall() {
  if (state.outage) return; state.outage = true; setMain(6); K1.aus = { t: 0, q: [], ufo: null, hilde: false, ruf: false };
  state.flashFail = 2.2; setTimeout(() => { K1.lampeTot = true; }, 2200);
  [livingLight, kitchenLight, tvLight, booth.light].forEach(l => l.userData.dead = true); shade.material.emissiveIntensity = 0; tube.material.emissiveIntensity = 0; tvScreen.material.emissiveIntensity = 0; houseLit.forEach(m => m.emissiveIntensity = 0);
  Audio.play('switch2', { gain: .3, rate: .6, x: 25, y: 1.5, z: -14, ref: 3 });
  const pl = [...porchLights].sort((a, b) => b.light.position.x - a.light.position.x); pl.forEach((p, i) => setTimeout(() => { p.dead = true; }, 600 + i * 330));
  await wait(2600); Audio.hum(true); shake = .012; Audio.play('rumble', { gain: .35, rate: .55, lp: 260 }); Audio.play('glass1', { gain: .05, rate: 1.6, x: 25, y: 1.5, z: -12.2, ref: 3 });
  await wait(1400); kapitel1_zeile('Netzbrummen. Fünfzig Hertz. Nur dass hier gerade kein Strom ist. Super. Ganz toll.', 4600, 'LUKE');
  // Laternen: Hauptstraße von Ost nach West, 1,4 s Abstand, je ein Luftholen; die vor Nr. 7 bleibt (sie geht erst in der Kinosequenz aus)
  K1.aus.n = 0; const nr7 = lamps.find(L => Math.abs(L.wx - 20) < .6 && Math.abs(L.wz - 4.6) < .6); K1.nr7 = nr7;
  const strasse = lamps.filter(L => L !== nr7 && L.mode !== 'off' && Math.abs(L.wz) < 7 && Math.abs(L.wx) < 76).sort((a, b) => b.wx - a.wx), rest = lamps.filter(L => L !== nr7 && !strasse.includes(L));
  await wait(3000); K1.aus.ufo = { t: 0, from: new THREE.Vector3(-70, 58, -95), to: new THREE.Vector3(20.8, 21, 1.7) };
  K1.aus.n = strasse.length; for (let i = 0; i < strasse.length; i++) { const L = strasse[i]; if (typeof kino_einatmen === 'function') kino_einatmen(.11, L.wx, 4.8, L.wz); else Audio.whisper(L.wx, 4.8, L.wz, .7);
    setTimeout(() => { L.mode = 'k1puste'; L.dead = 0; if (typeof kino_pusten === 'function') kino_pusten(.09, L.wx, 4.8, L.wz); rest.filter(R => R.mode !== 'k1puste' && R.wx > L.wx - 10).forEach(R => { R.mode = 'k1puste'; R.dead = 0; }); }, 560);
    await wait(1400); }
  rest.forEach(R => { if (R.mode !== 'k1puste') { R.mode = 'k1puste'; R.dead = 0; } });
  await wait(1200); K1.aus.hilde = true; victim.visible = true; victim.position.set(22.8, 0, 2.2); victim.rotation.set(0, PI * .92, 0); K1.aus.hT = 0;
}
function kapitel1_ausTick(dt, t) { const A = K1.aus; if (!A || K1.v.on || state.ch1Done) return; A.t += dt;
  // Laternen im Modus „k1puste“ (Basis): ausgeblasen, der Draht glüht nach; danach aus
  for (const L of lamps) if (L.mode === 'k1puste' && L.dead > 3) L.mode = 'off';
  if (K1.lampeTot && !state.phase2) { flashlight.intensity = 0; bounce.intensity = 0; fogUniforms.flK.value.x = 0; }
  // die Scheibe schiebt sich über die Dächer
  if (A.ufo && !state.phase2) { const U = A.ufo; U.t += dt; const k = Math.min(1, U.t / 16), e = kapitel1_ease(k); ufo.position.lerpVectors(U.from, U.to, e); ufo.position.y += Math.sin(t * .9) * .35; ufo.rotation.z = Math.sin(t * .7) * .05;
    kapitel1_ufoTick(dt, t, 0); }
  if (A.hilde && !state.phase2) { A.hT += dt; const P = player.pos; const nah = kapitel1_d(22.8, 2.2) < 15 && !indoorRect() && !state.inBasement;
    if (A.hT > 20 && !A.ruf) { A.ruf = true; subtitle('„Luke.“', 2200, 'HILDE'); }
    if ((nah && A.hT > 1.5) || A.hT > 23) { A.hilde = false; if (!(typeof kino_hilde === 'function' && kino_hilde())) { state.ufoOn = true; state.ufoT = 20; startPhase2(); } } }
}
function kapitel1_ufoTick(dt, t, beam) { const U = ufo.userData; U.tick(dt, t); U.dots.rotation.y += dt * .8; U.dots.children.forEach((d, i) => d.material.emissiveIntensity = Math.sin(t * 6 + i) > 0 ? 7 : 1); U.under.intensity = 60;
  U.beam.uniforms.opacity.value = .5 * beam * (.85 + Math.random() * .15); U.spot.intensity = 900 * beam; U.motes.material.opacity = .45 * beam;
  if (beam > 0) { const mp = U.motes.geometry.attributes.position; for (let i = 0; i < mp.count; i++) { let y = mp.getY(i) + dt * 2.5; if (y > 0) y -= 30; mp.setY(i, y); } mp.needsUpdate = true; } }
// A-02: nahe Nr. 7 (vor dem Keller) brummen die Laternen ganz leise E D C H C – nur, wer stehen bleibt, hört es
function kapitel1_humTick(dt) { const A = Audio; if (!A.ctx) return; const L = K1.nr7 || lamps.find(l => Math.abs(l.wx - 20) < .6 && Math.abs(l.wz - 4.6) < .6); if (!L) return;
  const on = kapitel1_on() && !state.cellarOpen && !state.outage && !state.inBasement && !indoorRect() && kapitel1_d(L.wx, L.wz) < 25; K1.humStill = on && Math.hypot(vel.x, vel.z) < .3 ? (K1.humStill || 0) + dt : 0;
  if (!K1.hum) { if (!on) return; const c = A.ctx, o1 = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o1.type = 'triangle'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 420; g.gain.value = 0;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(A.at(L.wx, 5, L.wz, 6)); o1.start(); o2.start(); K1.hum = { o1, o2, g, i: 0, t: 0 }; }
  const H = K1.hum, c = A.ctx, want = on && K1.humStill > 2 ? .03 : 0; if (want !== H.want) { H.want = want; H.g.gain.cancelScheduledValues(c.currentTime); H.g.gain.setTargetAtTime(want, c.currentTime, .6); } if (want <= 0) return;
  H.t -= dt; if (H.t <= 0) { const n = [164.8, 146.8, 130.8, 123.5, 130.8][H.i % 5]; H.i++; H.t = H.i % 5 === 0 ? 1.6 : .75; H.o1.frequency.setTargetAtTime(n, c.currentTime, .05); H.o2.frequency.setTargetAtTime(n * 2.003, c.currentTime, .05); }
  if (K1.humStill > 7 && !K1.f.has('a02')) { K1.f.add('a02'); kapitel1_zeile('<i>Die Laternen brummen in Moll. Ich muss dringend schlafen.</i>', 3800, 'LUKE'); } }

// ================================================================= UK 7: „Ich seh dich gleich …“ – Verstecken vor dem Kegel (Deckungsvolumen, A-03)
function kapitel1_deckungBau() { const C = K1.cov = [], add = (x0, x1, z0, z1, id, rx, rz) => C.push({ x0, x1, z0, z1, id, rx: rx ?? (x0 + x1) / 2, rz: rz ?? (z0 + z1) / 2 });
  for (const [hx, z0, z1] of [[-39.5, -25, -8], [-17.5, -25, -8], [37, -25, -8], [59, -25, -8], [-39.5, 9, 25], [-17.5, 9, 25], [34, 9, 25], [58, 9, 25]]) add(hx - 1.35, hx + 1.35, z0, z1, 'hecke', hx + (hx > 0 ? -1.1 : 1.1), z0 < 0 ? z1 - .8 : z0 + .8);
  for (const [x, z] of [[-29.7, -6.62], [-45.4, -6.62], [24.7, -6.62], [48.2, -6.62], [47.55, -6.6], [-48.4, 6.62], [-26.4, 6.62], [-25.75, 6.6], [23.6, 6.62], [47.6, 6.62]]) add(x - .95, x + .95, z - .95, z + .95, 'tonne', x, z > 0 ? z + .9 : z - .9);
  add(6.9, 9.1, 6.5, 8.7, 'zelle', 8, 7.6); add(-31.5, -24.5, -12.9, -10.2, 'veranda', -28, -11.2); add(42, 50, 10.2, 12.9, 'veranda8', 46, 11.4); add(21.6, 24.4, -12.7, -10.5, 'tuer7', 23, -11.2); add(-45.2, -43, -12.3, -10.6, 'fahrrad', -44.1, -10.9);
  if (typeof treeSpots !== 'undefined') for (const [x, z] of treeSpots) if (Math.abs(z) < 30 && Math.abs(x) < 80) add(x - 1.5, x + 1.5, z - 1.5, z + 1.5, 'baum', x, z); }
function kapitel1_deckung(x, z) { for (const c of K1.cov) if (x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return c; return null; }
function kapitel1_versteck() {
  const V = K1.v; if (V.on || V.done) return; V.on = true; state.ufoOn = false; state.phase2 = false; state.talking = false; K1.lampeTot = false; if (victim) victim.visible = false;
  for (const L of lamps) { L.mode = 'off'; } if (K1.nr7) K1.nr7.mode = 'off'; if (K1.aus) K1.aus.ufo = null;
  MAIN[7] = 'Versteck dich vor dem Licht. Zurück in den Keller – unter der Erde sieht sie dich nicht.'; setMain(7); $('objText').textContent = trX(MAIN[7]);
  const P = player.pos; V.last = { x: P.x, z: P.z, yaw: player.yaw }; V.sp.x = ufo.position.x; V.sp.z = ufo.position.z; V.sp.vx = V.sp.vz = 0; V.tgt.x = P.x + 1.2; V.tgt.z = P.z + .4; V.tT = 3.2; V.grace = 3; V.exp = 0;
  if (V.n >= 3) V.spd = 3.4 * 1.2; Audio.hum(true);
  if (typeof lwo_kapitelende === 'function') try { const E = lwo_kapitelende(1); if (E.stufe === 'hoch') { K1.stift = kapitel1_hit(.3, .1, .3, 22.5, .06, 2.0); kapitel1_stiftWelt(); interact(K1.stift, 'Kugelschreiber', () => { uninteract(K1.stift); if (K1.stiftG) K1.stiftG.visible = false; kapitel1_lore('k1_stift', 'Ein Kugelschreiber', '<span class="hand">Neben der Lesebrille, zwischen den Polaroids: ein Kugelschreiber. Auf dem Clip ein Auge über einer Flamme. Wir waren hier.</span>'); toast('Ein Kugelschreiber. Auf dem Clip: ein Auge über einer Flamme.', 4000); }); } } catch (e) {}
  if (typeof whiskey_S !== 'undefined') whiskey_S.forceStill = 999;
}
// Auf dem Asphalt vor Nr. 7 (Kapitelende, Stufe „hoch“): Lesebrille und der graue Kugelschreiber mit dem Auge auf dem Clip, bis Luke ihn aufhebt
function kapitel1_stiftWelt() { if (K1.stiftG) { K1.stiftG.visible = true; return; } const g = new THREE.Group(), y = kapitel1_bodenY(22.5, 2.0); K1.stiftG = g; g.position.set(22.5, y, 2.0); scene.add(g);
  if (typeof kirchberg_kuliBau === 'function') { const k = kirchberg_kuliBau(); k.position.set(.04, 0, .03); k.rotation.y = 1.1; g.add(k); }
  msModel('brille', 'model.glb').then(b => { const o = msGround(msFit(b.clone(true), .14, 'max')); o.position.set(-.12, 0, -.05); o.rotation.y = .5; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.userData.noCol = true; } }); g.add(o); }).catch(() => {}); }
function kapitel1_vTick(dt, t) { const V = K1.v; if (!V.on) return; const P = player.pos, S = V.sp;
  // Kegel: sucht wie eine Taschenlampe in einer Kinderhand – zu schnell, dann zu langsam, zittrig; schnüffelt an Deckungen
  V.tT -= dt; if (V.grace > 0) V.grace -= dt;
  const dT = Math.hypot(V.tgt.x - S.x, V.tgt.z - S.z); if ((dT < .8 || V.tT <= 0) && !V.lift) { const r = Math.random(), c = kapitel1_deckung(P.x, P.z);
    if (c && r < .45) { V.tgt.x = c.rx + rand(-1.5, 1.5); V.tgt.z = c.rz + rand(-1.5, 1.5); V.tT = rand(1.8, 3); }
    else if (r < .75) { const a = rand(0, 6.28), d = rand(2, 6.5); V.tgt.x = P.x + Math.cos(a) * d; V.tgt.z = P.z + Math.sin(a) * d; V.tT = rand(1.4, 2.6); }
    else { V.tgt.x = P.x + (23 - P.x) * rand(.3, .7) + rand(-3, 3); V.tgt.z = P.z + (-10 - P.z) * rand(.3, .7) + rand(-2, 2); V.tT = rand(1.5, 3); } }
  const sp = V.spd * (.55 + .7 * (.5 + .5 * Math.sin(t * .83 + Math.sin(t * .31) * 2))), ax = (V.tgt.x - S.x) * 3.2 - S.vx * 2.4, az = (V.tgt.z - S.z) * 3.2 - S.vz * 2.4; S.vx += ax * dt; S.vz += az * dt; const vv = Math.hypot(S.vx, S.vz); if (vv > sp) { S.vx *= sp / vv; S.vz *= sp / vv; }
  S.x += (S.vx + Math.sin(t * 13) * .35 + Math.sin(t * 29) * .18) * dt; S.z += (S.vz + Math.cos(t * 11) * .3) * dt;
  ufo.position.set(S.x, 20 + Math.sin(t * .9) * .3, S.z); ufo.rotation.z = Math.sin(t * .7) * .04; const atmen = V.lift && V.lift.n === 3 ? 1 + .03 * Math.sin(t * 1.9) : 1; ufo.scale.setScalar(atmen);
  kapitel1_ufoTick(dt, t, .62 + .08 * Math.sin(t * 7));
  if (V.lift) return kapitel1_liftTick(dt);
  if ((Math.hypot(P.x - 30.5, P.z + 21.1) < 1.3 || state.inBasement) && !stairBusy) return kapitel1_kellerEnde(); /* auch wenn Luke beim Beginn des Versteckens schon unten ist: die Treppe ist dann zu (kapitel1_treppe), sonst gäbe es keinen Weg weiter (Testlauf 08.10.) */
  // Deckung, Innenraum, Erfassung
  const c = kapitel1_deckung(P.x, P.z), innen = !!indoorRect(), front = innen && P.z > -13.8 && P.x > 20 && P.x < 32;
  if (c) { V.last = { x: c.rx, z: c.rz, yaw: player.yaw }; /* R-1: die Zelle klingelt im Versteck nicht mehr */
    if (c.id === 'veranda' && !V.vegas && typeof albers_whiskey === 'function') { V.vegas = true; albers_whiskey([['„Bleib unten, Junge! Nicht ins Licht gucken! Die sieht nur, was ihre Lampen sehen!“', 4200], ['„Und wenn du den Vogel siehst, sag ihm, der Speck ist für Bruno.“', 3600]]).catch(() => {}); }
    if (!V.aeff && Math.hypot(S.x - P.x, S.z - P.z) < 6 && typeof whiskey_mimic === 'function' && typeof whiskey_S !== 'undefined' && whiskey_S.g && whiskey_S.g.visible && Math.hypot(whiskey_S.g.position.x - P.x, whiskey_S.g.position.z - P.z) < 9) {
      V.aeff = true; if (whiskey_mimic('autotuer', { force: true })) /* Gag-Budget H-1: im Versteck das Warnsummen der Autotür statt „Himmelherrgott!“ */ { V.tgt.x = P.x + rand(-1, 1); V.tgt.z = P.z + rand(-1, 1); V.tT = 2.2; } } }
  const r = 3.7 + (flashOn && flashlight.intensity > 1 ? 1.4 : 0), d = Math.hypot(S.x - P.x, S.z - P.z), sicht = d < r && V.grace <= 0 && (!c || c.id === 'baum' && d < 1.6) && (!innen || front) && !state.inBasement;
  V.exp = sicht ? V.exp + dt : Math.max(0, V.exp - dt * 1.5); if (sicht && V.exp > .3 && !V.warn) { V.warn = true; Audio.heart(); } if (!sicht) V.warn = false;
  if (V.exp > 1) kapitel1_erwischt();
  // Whiskey fliegt vor, von Deckung zu Deckung, und wartet still auf dem nächsten Schattenstück (Richtung Nr. 7)
  V.wT = (V.wT || 0) - dt; if (V.wT <= 0 && typeof whiskey_setzen === 'function') { V.wT = 2; let best = null, bd = 1e9; for (const q of K1.cov) { const dq = Math.hypot(q.rx - 23, q.rz + 11.2), dp = Math.hypot(q.rx - P.x, q.rz - P.z); if (dq < Math.hypot(P.x - 23, P.z + 11.2) - 1.5 && dp < 16 && dp + dq < bd) { bd = dp + dq; best = q; } }
    if (best && best !== V.wq) { V.wq = best; whiskey_setzen(best.rx, (typeof whiskey_perch === 'function' ? whiskey_perch(best.rx, best.rz) : 1.2), best.rz); } }
  if (V.limp > 0) { V.limp -= dt; const a = 1 - Math.exp(-dt * 9), m = .6 / (.6 + .4 * a); vel.x *= m; vel.z *= m; }
}
// Erwischt: gehoben und fallen gelassen – jedes Mal schlimmer (A-03); kein Tod, sie spielt
function kapitel1_erwischt() { const V = K1.v; V.n++; V.exp = 0; const n = V.n > 3 ? 1 + ((V.n - 1) % 3) : V.n; V.lift = { n, t: 0, h: n === 1 ? 1 : n === 2 ? 3 : 5, hold: n === 3 ? 5 : n === 2 ? .5 : .3, y: 0, vy: 0, ph: 'auf' };
  setScripted(() => true); V.lift.pitch0 = player.pitch; if (Audio.ufoNear) Audio.ufoNear(1); shake = .03;
  if (V.n === 1) setTimeout(() => Audio.giggle(player.pos.x + 1.5, 3, player.pos.z), 500);
  setCamOverride((cam, dt) => { const L = V.lift; if (!L) return; cam.position.y += L.y; cam.rotation.z += Math.sin(L.t * 2.1) * .03 * Math.min(1, L.y);
    if (L.n === 3 && L.ph === 'halt') { kapitel1_o.position.copy(cam.position); kapitel1_o.lookAt(ufo.position.x, ufo.position.y - 1, ufo.position.z); cam.quaternion.slerp(kapitel1_o.quaternion, Math.min(1, L.t2 * .8)); } }); }
function kapitel1_liftTick(dt) { const V = K1.v, L = V.lift; L.t += dt;
  if (L.ph === 'auf') { const k = Math.min(1, L.t / (1 + L.h * .25)); L.y = L.h * (1 - Math.pow(1 - k, 3)) + Math.sin(L.t * 3) * .02; if (k >= 1) { L.ph = 'halt'; L.t2 = 0; } }
  else if (L.ph === 'halt') { L.t2 += dt; L.y = L.h + Math.sin(L.t * 1.3) * .06; if (L.t2 > L.hold) { L.ph = L.n === 3 ? 'schwarz' : 'fall'; L.vy = 0; if (L.n === 3) { $('fade').style.transition = 'opacity 250ms'; $('fade').style.opacity = 1; L.t3 = 0; } } }
  else if (L.ph === 'fall') { L.vy -= 9.81 * dt; L.y += L.vy * dt; if (L.y <= 0) { L.y = 0; L.ph = 'schwarz'; L.t3 = 0; Audio.thump(player.pos.x, 0, player.pos.z); Audio.play(Audio.pick('stepC2', 'stepC4'), { gain: .9, rate: .7 }); shake = L.n === 2 ? .14 : .07; if (L.n === 2) { Audio.heart(); setTimeout(() => Audio.heart(), 700); }
      setTimeout(() => { $('fade').style.transition = 'opacity 380ms'; $('fade').style.opacity = 1; }, L.n === 2 ? 900 : 450); } }
  else if (L.ph === 'schwarz') { L.t3 += dt; if (L.t3 > (L.n === 2 ? 1.9 : 1.3)) { // Neustart an der letzten Deckung, der Kegel weit weg
      const P = player.pos, D = V.last || { x: 23, z: -8 }; P.set(D.x, 0, D.z); player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; V.sp.x = D.x + (Math.random() < .5 ? -1 : 1) * rand(13, 18); V.sp.z = D.z + rand(-6, 6); V.sp.vx = V.sp.vz = 0; V.tgt.x = V.sp.x; V.tgt.z = V.sp.z; V.tT = 2.5; V.grace = 2.5;
      V.lift = null; setScripted(null); setCamOverride(null); state.talking = false; if (ui.overlay) { try { closeOverlay(); } catch (e) {} } /* nach dem Erwischtwerden nie gesperrt: eine abgebrochene Zeile/Whiskey-Szene ließ talking hängen → Tür/Interaktion tot */ fade(0, 900); if (L.n === 2) { V.limp = 8; state.flashFail = 3; } if (L.n === 3) V.spd = 3.4 * 1.2; if (typeof whiskey_S !== 'undefined') V.wq = null; } } }
// Im Keller: die Stahltür fällt zu, das Brummen wird leiser, die Zeichnungswand wölbt sich, ganz weit unten lacht ein Kind
async function kapitel1_kellerEnde() { const V = K1.v; if (V.done) return; V.done = true; V.on = false; if (V.lift) { V.lift = null; setScripted(null); setCamOverride(null); $('fade').style.opacity = 0; } V.limp = 0; if (typeof whiskey_S !== 'undefined') whiskey_S.forceStill = 0; for (let i = 0; i < 60 && stairBusy; i++) await wait(100); stairBusy = true; /* vorher: bei belegter Treppe still abgebrochen (Szene „erledigt“, aber kein Keller: Spiel hing im Ufo-Licht) */
  try { Audio.creak(undefined, 30, 1.2, -21.8); await fade(1, 700); state.inBasement = true; player.pos.set(B.x + 4.28, 0, B.z + 3.45); player.yaw = 1.0; /* R-6: am Fuß der Kellertreppe */ player.pitch = -.05; vel.set(0, 0, 0); camY = 1.65;
    ufo.position.set(0, -800, 0); const U = ufo.userData; U.beam.uniforms.opacity.value = 0; U.spot.intensity = 0; U.under.intensity = 0; U.motes.material.opacity = 0; await wait(300); } finally { stairBusy = false; }
  fade(0, 1300); await wait(500); Audio.play('metalSlam', { gain: 1.3, rate: .8, x: B.x + 4.28, y: 3.6, z: B.z - .85, ref: 3 }); Audio.thump(B.x + 4.28, 3.6, B.z - .85); /* R-6: Kellertür oben am Podest */ shake = .09;
  setTimeout(() => Audio.hum(false), 2500); Audio.play('rumble', { gain: .3, rate: .5, lp: 220 }); state.talking = true; K1.wb = { t: 0 };
  await wait(3200); Audio.play('giggle', { gain: .2, rate: .78, offset: .2, dur: 1.8, x: B.x - .5, y: -4, z: B.z - 5, ref: 2, lp: 1300 });
  await wait(2600); await say([['<i>Unter der Erde sieht sie mich nicht. Hat Hilde geschrien. Hinter die Bilder. Lucy.</i>', 5200, 'LUKE']]); state.talking = false; $('objText').textContent = trX('Hilde hat auf die Zeichnungswand gezeigt. Leg die Hand an die Zeichnungen.');
  K1.wandHand = kapitel1_hit(3, 2, .4, B.x - .5, 1.3, B.z - 3.7); interact(K1.wandHand, 'Die Hand an die Wand legen', async () => { uninteract(K1.wandHand); toast('Sie ist warm.', 2600); await wait(2400); kapitel1_ende(); }); }
function kapitel1_wbTick(dt) { const W = K1.wb; if (!W || !B.wallArt) return; W.t += dt; if (!W.s0) W.s0 = { s: B.wallArt.scale.clone(), z: B.wallArt.position.z }; const k = Math.min(1, W.t / 9), s = 1 + .03 * kapitel1_ease(k) + .004 * Math.sin(W.t * 1.7);
  B.wallArt.scale.set(W.s0.s.x * s, W.s0.s.y * s, W.s0.s.z); B.wallArt.position.z = W.s0.z + (s - 1) * .8; }
// Abspann k1 (kino.js) → Endkarte mit vier Zählern → Kapitel 2 hinter der Wand
async function kapitel1_ende() { if (K1.f.has('ende')) return; K1.f.add('ende'); state.talking = true; await fade(1, 900); await wait(2000);
  state.phase2 = false; state.ufoOn = false; state.outage = false; state.ch1Done = true; state.cellarOpen = true; victim.visible = false; Audio.hum(false); if (Audio.drone) Audio.drone.gain.value = .02;
  if (K1.wb && K1.wb.s0) { B.wallArt.scale.copy(K1.wb.s0.s); B.wallArt.position.z = K1.wb.s0.z; } K1.wb = null;
  if (typeof kapEnde === 'function') kapEnde(1); else saveFlag('ch2');
  let E = null; try { E = typeof lwo_kapitelende === 'function' ? lwo_kapitelende(1) : null; } catch (e) {}
  if (typeof kino_play === 'function') { try { await kino_play('k1', { aufblenden: 1600 }); } catch (e) { console.error('Kino k1', e); } } else fade(0, 1600);
  state.talking = false; if (E && E.stufe === 'miserabel') kapitel1_lore('k1_dienstplan', 'Ein Blatt, das da nicht hingehört', '<span class="hand">Dienstplan L. Brandt, Studio, Nachtschicht Mo–Do, Fr frei</span>');
  // die Kellerwand hat nachgegeben: dahinter ein Gang (Kapitel 2, uebergang.js)
  if (typeof uebergang_S !== 'undefined' && uebergang_S.plug) { const S = uebergang_S; S.open = true; S.plug.forEach(o => { uninteract(o); msHide(o); }); }
  setMain(8); setTimeout(() => subtitle('Die Wand gibt nach. Dahinter ist kein Keller mehr. Ein Gang – älter als das Haus.', 4800), 1800); try { saveGame(1); } catch (e) {}
}

// ================================================================= Geheimes Ende „Fahr heim“ (nur vor dem Tonband) · Erfolg „Heimfahrer“
function kapitel1_heimOk() { return kapitel1_on() && !state.heardTape && !state.outage && story.main >= 1; }
async function kapitel1_heim() { if (!kapitel1_heimOk() || state.talking || K1.heim) return; K1.heim = true; state.talking = true; const mitSchluessel = story.items.includes('autoschluessel');
  const f = $('fade'); f.style.transition = 'opacity 5s'; f.style.background = '#d8d2c2'; f.style.opacity = .82; subtitle('Es wird hell, ohne dass die Nacht etwas getan hätte.', 4200);
  if (!mitSchluessel && typeof whiskey_setzen === 'function') whiskey_setzen(8.45, 2.25, 51.9);
  await wait(4200); Audio.engine && Audio.engine(true, -20, 60); await wait(2600); kapitel1_busFahrt(); subtitle('Der Bus kommt. Leer bis auf den Fahrer, der nichts fragt.', 4200); await wait(3800); Audio.engine && Audio.engine(false);
  f.style.transition = 'opacity 1.2s'; f.style.background = '#000'; f.style.opacity = 1; await wait(1400);
  const karte = typeof kino_karte === 'function' ? kino_karte : async l => { toast(l.join(' '), 9000); await wait(9000); };
  await karte([' ', 'Du steigst ein. Du fragst nichts.', 'In der Stadt legst du dich angezogen aufs Bett und schläfst sofort ein.', 'Um 03:13 stehst du auf, ziehst die Schuhe aus und gehst hinaus.', 'Wer einmal drin war, den findet sie wieder.'], { bleiben: true });
  await karte([' ', 'Das war nicht das Ende. Zurück zur Haltestelle?']);
  player.pos.set(9.4, 0, 50.6); player.yaw = PI; player.pitch = 0; vel.set(0, 0, 0); f.style.background = '#000';
  if (typeof sammeln_fibel === 'function') { sammeln_fibel('R-K1'); sammeln_fibel('R-heim'); }
  if (!K1.f.has('heimfahrer')) { K1.f.add('heimfahrer'); kapitel1_lore('erfolg_heimfahrer', 'Erfolg · Heimfahrer', '<span class="hand">Regel: Wer einmal drin war, den findet sie wieder. (Ich hab’s ausprobiert.)</span>'); setTimeout(() => questPop('ERFOLG', 'Heimfahrer'), 2400); }
  await fade(0, 1800); state.talking = false; K1.heim = false; }

// ================================================================= A-04: zwei Männer, die immer schon da sind (nach AG-02, 2–4 Mal, nie ein Wort)
function kapitel1_a04Tick(dt) { const A = K1.a04; if (A.n >= 3 || typeof lwo_praesenz !== 'function' || typeof lwo_S === 'undefined' || !lwo_S.seen || !lwo_S.seen['ag:AG-02'] || !kapitel1_on() || state.outage || state.inBasement || indoorRect()) return;
  if (A.on) { A.on -= dt; if (A.on <= 0 && typeof LWO !== 'undefined' && LWO.praesenz) { LWO.praesenz = null; if (LWO.F.n11) LWO.hideQ.push(LWO.F.n11); if (LWO.F.n12) LWO.hideQ.push(LWO.F.n12); } if (A.on > 0) return; A.on = 0; }
  A.t -= dt; if (A.t > 0) return; A.t = rand(150, 240); const P = player.pos, f = flatDir();
  const orte = [[-6, 30, PI], [62, -3, -PI / 2], [-66, 12, PI / 2], [104, 8, -PI / 2], [-30, 44, PI], [40, 34, PI * .8]].filter(([x, z]) => { const d = kapitel1_d(x, z); return d > 25 && d < 42 && ((x - P.x) * f.x + (z - P.z) * f.z) / d > .3; });
  if (!orte.length) { A.t = 20; return; } const [x, z, ry] = orte[Math.floor(Math.random() * orte.length)];
  if (lwo_praesenz(x, z, Math.atan2(P.x - x, P.z - z), { nurKurz: A.n === 1, weg: [[Math.sin(ry) * 30, Math.cos(ry) * 30]] })) { A.n++; A.on = 45; } }

// ================================================================= Einhängen
WORLD_MODS.push(['Kapitel 1 (Hauptweg)', async () => {
  try { await kapitel1_welt(); } catch (e) { console.warn('kapitel1 Welt', e); }
  kapitel1_deckungBau();
  // Staub im Strahl: weiche runde Partikel statt harter Quadrate (von nah sonst große helle Kästchen und viel Überzeichnung)
  try { const m = ufo.userData.motes.material; m.map = kapitel1_cnv(64, 64, (x, w) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }); m.size = .05; m.needsUpdate = true; } catch (e) {}
  // Zeichnungswand: neue Kinderzeichnungen (alle „LUKE, 9“) – das Material teilen alle Stücke (auch die aus uebergang.js)
  try { const m = B.wallArt.material; if (m.map) m.map.dispose(); m.map = kapitel1_wandTex(); m.needsUpdate = true; kapitel1_blutSchrift(); } catch (e) { console.warn('Blutschrift', e); }
  // Texte/Aktionen der Basis im Hauptweg (Fassung 3)
  MAIN[7] = 'Versteck dich vor dem Licht. Zurück in den Keller – unter der Erde sieht sie dich nicht.';
  // F3 Verständlichkeit: jede Aufgabe sagt, warum (Lucys Anruf, Lucys Band, das, was die Treppe hoch ist)
  MAIN[3] = 'Öffne die Kellertür. Das Tastenfeld will vier Ziffern.'; MAIN[6] = 'Der Strom ist weg, die Laternen erlöschen. Geh nach draußen und sieh nach, was da kommt.'; if (story.main === 3 || story.main === 6) $('objText').textContent = trX(MAIN[story.main]);
  MAIN[0] = 'Lucy hat angerufen: „Haus Nummer 7. Der Keller.“ Finde Haus Nr. 7.'; MAIN[2] = 'Durchsuche Haus Nr. 7. Lucy hat dir ein Band im Keller hinterlassen.';
  MAIN[5] = 'Irgendwas ist an dir vorbei die Treppe hoch. Hinterher.'; MAIN[8] = 'Hinter die Bilder, hat Hilde geschrien. Folge dem Gang hinter der Wand.'; if (story.main === 0 || story.main === 2 || story.main === 5) $('objText').textContent = trX(MAIN[story.main]);
  { const E = ECHOES.find(e => e.id === 'echo_kreuzung'); if (E) { E.title = 'Nachbild · Die Kreuzung'; E.lines = [['Warmer Asphalt. Sommernacht. Kinder, barfuß, in einer Reihe. Eine Männerstimme zählt: „… fünf, sechs, sieben. Sieben. Gott sei Dank.“', 5600], ['Eine Kinderstimme, ganz nah: „Acht.“', 3000], ['Am Nebelrand steht noch ein Junge. Er zählt nicht mit. Dann ist er weg.', 4200], ['Das Bild kommt zurück. Regen.', 2600]]; } }
  uninteract(mailbox7); interact(mailbox7, 'Briefkasten öffnen', kapitel1_briefkasten);
  uninteract(calendar); interact(calendar, 'Kalender ansehen', () => { state.readCal = true; openNote('Kalender · Oktober', '<i>Werbekalender der Sparkasse. Hildes Druckbuchstaben:</i>\n\n<span class="hand">23. – L. unten. Keiner darf das wissen. Auch der Kalender nicht.</span>\n\n<b>31.</b> ist dick eingekreist, immer wieder, bis das Papier durch ist:\n<span class="hand" style="color:#8a1010">SIE IST ZURÜCK. ABER DAS IST NICHT LUCY.</span>\n\n<i>Umblättern, November:</i>\n<span class="hand">3. – Sie übt Lucys Stimme. Durch die Tür. Sie will ihn anrufen. Ich hab das Telefon versteckt. Sie braucht keins.\n4. – ——</span>', 'calendar'); });
  uninteract(B.tape); interact(B.tape, () => K1.f.has('bandZettel') ? 'Kassette abspielen' : 'Zettel am Rekorder', kapitel1_band);
  uninteract(B.wallArt); interact(B.wallArt, 'Zeichnungen ansehen', kapitel1_wand);
  uninteract(stairs); interact(stairs, 'Nach oben gehen', kapitel1_treppe);
  { const heimHit = kapitel1_hit(1.4, 1.6, 1.2, 9.6, .8, 52.6); K1.heimHit = heimHit; interact(heimHit, () => story.items.includes('autoschluessel') ? 'Nach Hause fahren' : 'Auf den ersten Bus warten', kapitel1_heim); }
  if (typeof WHISKEY_ST !== 'undefined') WHISKEY_ST.unshift({ id: 'k1_versteck', prio: true, at: [23.6, 6.62], when: () => K1.v.on, done: () => !K1.v.on, mood: 'still' });
  kpPress = kapitel1_kpPress; scareCellarDoor = kapitel1_scareKellertuer; scareWendtKitchen = kapitel1_nichtDu; enterBasement = kapitel1_enterBasement; leaveBasement = kapitel1_leaveBasement; startOutage = kapitel1_ausfall;
  { const orig = ending; ending = async function (...a) { if (kapitel1_on() && !K1.v.done) { kapitel1_versteck(); return; } return orig.apply(this, a); }; }
  // Nach dem Laden: Stand der Welt nachziehen
  if (K1.f.has('gurte')) kapitel1_gurteAuf(); if (state.watcherGone) { watcher.visible = false; if (typeof eyes !== 'undefined') eyes.visible = false; }
  if (state.ch1Done && typeof uebergang_S !== 'undefined' && uebergang_S.plug && !uebergang_S.open) { const S = uebergang_S; S.open = true; S.plug.forEach(o => { uninteract(o); msHide(o); }); }
  window.__k1 = { K1, versteck: kapitel1_versteck, ausfall: kapitel1_ausfall, ende: kapitel1_ende, heim: kapitel1_heim, kellerEnde: kapitel1_kellerEnde, erwischt: kapitel1_erwischt, nichtDu: kapitel1_nichtDu, danke: kapitel1_danke, ostende: kapitel1_ostende, nachbild: kapitel1_nachbild, bus: kapitel1_busFahrt, briefkasten: kapitel1_briefkasten }; // Testzugriff
  K1.ready = true;
}]);
WORLD_TICK.push((dt, t) => {
  if (!K1.ready || !state.started || menu.attract) return; K1.T += dt; const P = player.pos;
  if (kapitel1_on()) {
    // UK 1: beim ersten Schritt Richtung Osten die Gestalt am Ostende; an der Kreuzung das erste Nachbild
    if (!K1.f.has('ostende') && story.main === 0 && P.x > -63.5 && P.x < -40 && vel.x > .8) kapitel1_ostende();
    if (!K1.f.has('nachbild') && Math.hypot(P.x - 5, P.z) < 6.5 && !state.talking && !ui.overlay) kapitel1_nachbild();
    if (state.watcherGone && !state.outage && endLamp.mode !== 'k1puste' && endLamp.mode !== 'off') endLamp.mode = 'off';
    if (K1.glimmen) K1.glimmen.material.opacity = .55 + .45 * (Math.sin(t * 1.3) > .2 ? 1 : .35);
    if (K1.blau) K1.blau.visible = !state.outage;
    if (K1.heimHit) K1.heimHit.position.y = kapitel1_heimOk() && !K1.heim ? .8 : -50;
    if (!K1.f.has('sp_ag02') && typeof lwo_S !== 'undefined' && lwo_S.seen && lwo_S.seen['ag:AG-02'] && !state.talking && !(typeof LWO !== 'undefined' && LWO.playing)) { K1.f.add('sp_ag02'); try { saveGame(1); } catch (e) {} if (typeof todCpShow === 'function') todCpShow('Sind Sie von hier?'); } // Speicherpunkt nach AG-02
    kapitel1_katzenTick(dt); kapitel1_tvTick(dt); kapitel1_kpTick(dt); kapitel1_obenTick(dt); kapitel1_humTick(dt); kapitel1_a04Tick(dt);
  } else if (K1.heimHit && K1.heimHit.position.y > 0) K1.heimHit.position.y = -50;
  kapitel1_ostTick(dt); kapitel1_lampeTick(); kapitel1_ausTick(dt, t); kapitel1_vTick(dt, t); kapitel1_wbTick(dt);
});
