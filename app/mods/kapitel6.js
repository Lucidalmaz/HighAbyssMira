// =====================================================================  KAPITEL 6 · WENDIGO (Modul „kapitel6“, Fassung 3 · AP-23; Grundgerüst aus W2-P11, angepasst)
// Quelle: story_final.md „Kapitel 6 · Wendigo“ (UK 1–9, Höhepunkt „Zwei Raben“, Abspann „Gleich wieder da“), Wendigo-Dossier 1.4–1.12, F3_extras Q-9 A-20 bis A-23.
// Freitag, 6. November 2026, kurz nach zwei bis zum Morgengrauen. Keine 03:13: um drei schlägt die Glocke dreimal (leben.js, Kapitel-6-Uhr) und hört auf.
// Ablauf (K6.beat): gitter (AG-18 Wolter, Sender A/B/C, drei Wege; Gitter aufbiegen, SP6-1) → krumen (Reh, Krähe frisst die Spur, Fuchs) → huette (SP6-2)
//   → zaun (eingedrückter Nordzaun) → faden (erste Stille-Zone, Anni; V-11; Hochsitz SP6-3: SB-11, Seite 2, B-K6-05, Pfandflasche; Justins Stimme ohne Schaben)
//   → falle (AG-19 am Amtsbus, drei Ausgänge, Sabotage „Wo vorne war“) → frass (SP6-4; AG-20 toter Blechmann, Merkblatt W; Fraßstelle, Seite 1 → „Wendigo“; Hirsch)
//   → wrack (A-20 die Jagd: Flucht zu Jonas’ Lager, Lager-SP, A-23 Hufe über Kinderfüßen, Silhouette, Hofer; Wrack SP6-5, Beobachter flieht, Handschuhfach)
//   → bau (Seite 6, Höhepunkt in hungrige.js) → epilog (Whiskey fliegt voraus, der Wald hat wieder ein Echo) → hochsitz → oben (Augen zu, SB-12, „Luna.“) → Abspann → Endkarte.
// Warum (Premium-Auftrag): jede Station sagt dem Spieler, wohin und weshalb – Luke folgt dem echten Luke (Brotkrumen, Handabdrücke, Kinderfüße); die LWO benutzt ihn als Köder;
//   nach der Fraßstelle flieht er vor dem Ding zum Lager und folgt dann den Kinderfüßen, über denen frische Hufe liegen, zum Wrack.
// Stille-Zonen (Bibel): Klangbett aus, Wind 20 %, Hall 0, Whiskey/Beobachter stumm, 3 s Übergang – über SP.silent (spannung.js/klang.js/whiskey.js/beobachter.js lesen es).
//   Zonen: freie Zone hinter dem Zaun, Hochsitz-Geschälter r 15, Bus r 15 (wächst in der Falle), Fraßstelle r 25, Bau r 30, Justins Stimme, und der Wendigo selbst (r 20 + 10).
// A-20 Jagd (K6J): das Hirschding läuft frei, folgt Lärm (Rennen, Pfandflasche), meidet die angehobene Lampe (weicht rückwärts, knickt ein), in seiner Zone entlädt sich die
//   Lampe 1,5-mal so schnell; leere/aus + Kontakt = Tod (Todesart „wendigo“). A-21: stirbt Luke durch ihn, fehlt danach ein Nachbild (höchstens zwei). A-22: das falsche Trippeln.
// Schnittstellen (typeof): kapStart/kapEnde · kino_play/kino_def (Abspann hier definiert) · lwo_szene/lwo_figur/lwo_kombi… · beobachter_zettel/beob_sichtung/beob_still ·
//   sammeln_platz/sammeln_sb/sammeln_fibel · whiskey_* · katzen_kater5 · augenzu_* · todCheckpoint/todDie/TOD_* · hungrige_* (Stufen, Seiten, Finale).
// Hooks für hungrige.js: k6_krumeVorn, k6_krumenFressen, k6_nachKraehe, k6_hungrigeDone, k6_seite, k6_bauFrei, k6_nachLager, k6_nacktFrei, k6_lampeStirbt, k6_feuerzeug,
//   k6_flamme, k6_feuerzeugWelt, k6_hinweis, k6_windStoss, k6_waldAufEinmal, k6_senderBeiIhm, k6_nachFinale · für tiefwald.js: k6_oben.
// Keine Lichter zur Laufzeit: Feuerzeug (VLight) beim Laden mit 0; Blechmann-Lampen über den einen LWO-Scheinwerfer; gefallene Lampe nur Leuchtbild.
const K6 = { on: false, beat: '', obj: '', sp: new Set(), told: new Set(), ready: false, grp: null, krumen: [], krIM: [], krM: null, eaten: false, prints: null, hands: null, blood: null,
  sil: 0, holdT: 0, openT: -1, lampDead: false, lighter: null, boy: null, chair: null, gi: 0, guideT: 0, epiBusy: false, kidT: 0, hint: null, wahl: null, saveT: 0,
  weg: null, variante: 'B', sender: 'jacke', v11: false, flasche: 0, flascheT: -1, ag18: false, ag18Busy: false, falleAn: false, falleFertig: false, falleWeg: null, sab: null, tote: 1,
  lager: false, lagerT: 0, rief: false, justinT: 0, zone: null, inZ: '', lastZ: '', cp: null, route: null, ri: 0, props: {}, tick: 0, epiEcho: false, jagdSeg: 0 };
const K6_BEATS = ['gitter', 'krumen', 'huette', 'zaun', 'faden', 'falle', 'frass', 'wrack', 'bau', 'epilog', 'hochsitz', 'oben', 'ende'];
const k6_ab = b => K6_BEATS.indexOf(K6.beat) >= K6_BEATS.indexOf(b);
const K6_WEG = [[-5, 203], [6, 200], [22, 196], [40, 189], [27, 184], [19, 176.5]]; // Whiskeys Rückweg vom Bau zum Hochsitz (Epilog)
const K6_ZUM_LAGER = [[8, 199.5], [24, 195.5], [40, 189], [52, 193], [59, 196.5], [64, 205], [70, 215], [76, 226], [80.2, 231.5]]; // Flucht nach dem Hirsch (Whiskey fliegt voraus)
const K6_KINDERSPUR = [[74, 229.5], [66, 226.5], [55, 224], [44, 220.5], [33, 217], [22, 212], [10, 208.5], [0, 206.2], [-6, 205.2]]; // A-23: vom Lager zum Wrack
const K6_BUS = { mitte: [61.2, 196.9], draht: [[55.2, 193.6], [56.4, 197.9]], netz: [[60.8, 197.6], [63.4, 195.2]], b: [[57, 201.2, 2.4], [66.5, 192.6, -.6], [69.6, 203, 3.9], [59.5, 205.2, 3.3]], wolf: [63.8, 202.2] };
const K6_AG20 = { a: [21.6, 195.6, 1.25], b: [19.4, 194.1, 1.1] }; // an Bäumen, 20 m vor der Fraßstelle
const K6_INTRO = '<p class="on" style="font-family:Georgia;font-size:12px;letter-spacing:.4em;color:#c9a36a;margin-bottom:22px">KAPITEL 6 · WENDIGO</p><p class="on">Freitag, kurz nach zwei.</p><p class="on">Lucy schläft bei Vegas. Diesmal ganz.</p><p class="on">Du nicht. In der Jacke: Peters Feuerzeug, die Lampe, drei Batterien.</p><p class="on">Hinter dem Spielplatz sitzt ein Junge mit deinem Namen in einem Wald, der kein Echo hat.</p><p class="on" style="font-family:Georgia;font-size:11px;letter-spacing:.35em;color:#8b7f68;margin-top:30px">KLICKEN ZUM WEITERSPIELEN</p>';
const _k6V = new THREE.Vector3(), _k6W = new THREE.Vector3(), _k6Z = new THREE.Matrix4().makeScale(0, 0, 0);
function k6_obj(t) { K6.obj = t; if (typeof setC3 === 'function') setC3(t); else $('objText').textContent = t; }
function k6_luke(t, ms = 2600) { subtitle(t, ms, 'LUKE'); }
function k6_denk(id, t, d = 0) { if (typeof gedanke === 'function') gedanke('k6_' + id, t, d, 3); }
function k6_wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function k6_has(k) { return story.items.includes(k); }
function k6_hh(k) { return typeof hungrige_has === 'function' && hungrige_has(k); }
function k6_near(x, z, r) { return Math.hypot(player.pos.x - x, player.pos.z - z) < r; }
function k6_frei() { return !state.talking && !ui.overlay && !scripted && !(typeof tod_S !== 'undefined' && tod_S.dying); }
function k6_hinweis(key, text) { const H = K6.hint; if (!H) return; if (!key) { H.classList.remove('show'); return; } H.innerHTML = '<b>' + key + '</b><span>' + trX(text || '') + '</span>'; H.classList.add('show'); }
// Speicherpunkte (Bibel SP6-1 … SP6-5, dazu Jonas’ Lager als einziger zwischen AG-20 und dem Bau): Wiederkehr am Ort, Gefahr zurückgesetzt
function k6_cp(id, label, x, z, yaw) { if (K6.sp.has(id)) return; K6.sp.add(id); const P = player.pos; K6.cp = { id, x: x ?? P.x, z: z ?? P.z, yaw: yaw ?? player.yaw };
  if (typeof todCheckpoint === 'function') todCheckpoint(id, label, { x: K6.cp.x, y: 0, z: K6.cp.z, yaw: K6.cp.yaw, respawn: async () => k6_wiederkehr() }); else saveGame(6); }
function k6_wiederkehr() { const C = K6.cp; if (C) { player.pos.set(C.x, 0, C.z); player.yaw = C.yaw; } k6_jagdReset(25); if (K6.falleAn && !K6.falleFertig) k6_falleReset(); K6.lampDead = false; flashOn = true; }
// ---------------------------------------------------------------- Texturen für Spuren (Decals, beim Laden gezeichnet)
function k6_tex(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function k6_blot(g, x, y, rx, ry, a, col) { const gr = g.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry)); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(.72, `rgba(${col},${a * .8})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.beginPath(); g.arc(x, y, rx, 0, 7); g.fill(); g.restore(); }
// kleiner nackter Fuß (links; rechts = gespiegelt): Ferse, Außenkante, Ballen, fünf Zehen – nasse Erde, ausgefranst
const k6_footTex = () => k6_tex(128, 256, (g, w, h) => { g.clearRect(0, 0, w, h); const c = '34,24,16';
  k6_blot(g, 66, 206, 25, 31, .8, c); for (let i = 0; i < 9; i++) k6_blot(g, 74 - i * 1.2, 180 - i * 11, 16 + Math.sin(i * .7) * 3, 14, .72, c); // Ferse, Außenkante
  k6_blot(g, 60, 92, 34, 26, .82, c); // Ballen
  [[40, 50, 11], [56, 42, 9], [70, 42, 8], [82, 47, 7], [92, 55, 6]].forEach(([x, y, r]) => k6_blot(g, x, y, r, r * 1.2, .85, c));
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] *= .7 + Math.random() * .3; g.putImageData(id, 0, 0); });
// kleine Hand im Staub (hell, trocken) bzw. im Moos (dunkel, eingedrückt)
const k6_handTex = col => k6_tex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h);
  k6_blot(g, 64, 80, 26, 24, .75, col); [[34, 52, 8, 16, -.5], [48, 32, 7, 18, -.15], [64, 26, 7, 19, 0], [79, 31, 6, 17, .15], [92, 60, 6, 12, .7]].forEach(([x, y, rx, ry, a]) => { g.save(); g.translate(x, y); g.rotate(a); g.translate(-x, -y); k6_blot(g, x, y, rx, ry, .75, col); g.restore(); });
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] *= .6 + Math.random() * .4; g.putImageData(id, 0, 0); });
// gespaltener Huf, frisch und tief (A-23): zwei Klauen, der Rand aufgeworfen, nass glänzend
const k6_hufTex = () => k6_tex(128, 128, (g, w, h) => { g.clearRect(0, 0, w, h); const c = '16,11,8'; for (const dx of [-15, 15]) { k6_blot(g, 64 + dx, 66, 12, 30, .92, c); k6_blot(g, 64 + dx * 1.15, 96, 7, 9, .6, c); }
  const id = g.getImageData(0, 0, w, h), d = id.data; for (let i = 3; i < d.length; i += 4) d[i] *= .75 + Math.random() * .25; g.putImageData(id, 0, 0); });
// Eisennetz der Bergung: grobes Geflecht, dunkel, mit Rost
const k6_netzTex = () => k6_tex(256, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.lineWidth = 3.2; for (let i = 0; i <= 12; i++) { const k = i * w / 12; g.strokeStyle = `rgba(${40 + rand(0, 40)},${30 + rand(0, 16)},${22},.95)`;
  g.beginPath(); g.moveTo(k + rand(-2, 2), 0); g.lineTo(k + rand(-2, 2), h); g.stroke(); g.beginPath(); g.moveTo(0, k + rand(-2, 2)); g.lineTo(w, k + rand(-2, 2)); g.stroke(); } });
function k6_decalMat(map, rough = .7) { return new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: rough, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4 }); }
function k6_decals(mat, list, w, h) { // list: [x, z, ry, s, spiegeln, y] → eine Instanzgruppe (ein Zeichenaufruf)
  const g = new THREE.PlaneGeometry(w, h); g.rotateX(-PI / 2); const im = new THREE.InstancedMesh(g, mat, list.length), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  list.forEach(([x, z, ry, sc, mir, y], i) => { im.setMatrixAt(i, new THREE.Matrix4().compose(v.set(x, y ?? .034, z), q.setFromEuler(e.set(0, ry, 0)), s.set(mir ? -sc : sc, 1, sc))); });
  im.receiveShadow = true; im.castShadow = false; im.userData.noCol = true; im.userData.noCull = true; im.computeBoundingSphere(); K6.grp.add(im); return im; }
// Punkte entlang einer Polylinie alle ~step m: [x, z, Richtung]
function k6_along(P, step, from = 0) { const out = []; let acc = from; for (let i = 0; i < P.length - 1; i++) { const [ax, az] = P[i], [bx, bz] = P[i + 1], L = Math.hypot(bx - ax, bz - az), a = Math.atan2(bx - ax, bz - az);
  while (acc <= L) { const k = acc / L; out.push([ax + (bx - ax) * k, az + (bz - az) * k, a]); acc += step; } acc -= L; } return out; }
function k6_papier(w, h, x, y, z, rx, ry, col = 0xd9d1bb) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: col, roughness: .92, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); m.receiveShadow = true; m.userData.noCol = true; K6.grp.add(m); return m; }
// ---------------------------------------------------------------- Aufbau (beim Laden; alles in K6.grp, unsichtbar bis Kapitel 6)
WORLD_MODS.push(['Kapitel 6', async () => {
  const T = THREE; K6.grp = new T.Group(); K6.grp.name = 'kapitel6'; K6.grp.visible = false; K6.grp.userData.noCol = true; scene.add(K6.grp);
  // --- Brotkrumen: Papas Brot, zerbröselt (Scan w_brot, verkleinert) – alle 4–6 m auf dem Weg vom Gitter bis zu Zayns Hütte
  try { const parts = await msBake('w_brot', 'model.glb'); const bb = new T.Box3(); parts.forEach(p => { p.geo.computeBoundingBox(); bb.union(p.geo.boundingBox); }); const sz = bb.getSize(new T.Vector3()), mx = Math.max(sz.x, sz.y, sz.z) || 1, c = bb.getCenter(new T.Vector3());
    const route = typeof WALD_PATHS !== 'undefined' ? WALD_PATHS[0] : [[30, 96], [57, 146.8]], pts = k6_along(route, 5, 2.5).filter(p => p[1] > 99.2), M = [], q = new T.Quaternion(), e = new T.Euler();
    pts.forEach(([x, z]) => { const cl = { x: x + rand(-.5, .5), z: z + rand(-.5, .5), idx: [] }; for (let k = 0; k < 5; k++) { const s = rand(.028, .055) / mx; cl.idx.push(M.length);
        M.push(new T.Matrix4().compose(new T.Vector3(cl.x + rand(-.28, .28), .015, cl.z + rand(-.28, .28)), q.setFromEuler(e.set(rand(0, 6), rand(0, 6), rand(0, 6))), new T.Vector3(s, s * rand(.5, .8), s)).multiply(new T.Matrix4().makeTranslation(-c.x, -bb.min.y, -c.z))); }
      K6.krumen.push(cl); });
    K6.krM = M; K6.krIM = parts.map(p => { const mat = p.mat.clone(); if (mat.color) mat.color.multiplyScalar(1.25); const im = new T.InstancedMesh(p.geo, mat, M.length); M.forEach((m, i) => im.setMatrixAt(i, m)); im.castShadow = false; im.receiveShadow = true; im.userData.noCol = true; im.userData.noCull = true; im.computeBoundingSphere(); K6.grp.add(im); return im; });
  } catch (e) { console.warn('Kapitel6: Brotkrumen', e); }
  const fussMat = k6_decalMat(k6_footTex(), .45);
  // --- kleine nackte Fußspuren unter dem Gitter hindurch (durch die aufgebogene Ecke rechts) auf den Weg
  { const L = []; let x = 33.7, z = 95.6, a = -.25; for (let i = 0; i < 22; i++) { const side = i % 2 ? 1 : -1; a += (Math.atan2(29.6 - x, 105 - z) - a) * .2; x += Math.sin(a) * .36; z += Math.cos(a) * .36;
      L.push([x + Math.cos(a) * .06 * side, z - Math.sin(a) * .06 * side, a, rand(.95, 1.05), side > 0]); }
    K6.prints = k6_decals(fussMat, L, .085, .17); }
  // --- Hände: im Staub der Hütte und hinaus zur eingedrückten Stelle im Nordzaun; im Moos an den Wollbäumen (der Junge folgt der Wolle auch)
  { const H = typeof WALD !== 'undefined' ? WALD.hut : { x: 58, z: 149.5 }, L = [];
    for (let i = 0; i < 6; i++) L.push([H.x + rand(-1.2, 1), H.z + rand(-1.2, 1.2), rand(0, 6.28), rand(.9, 1.1), i % 2, .045]);
    for (const [x, z, a] of k6_along([[57.4, 147.3], [52, 146.4], [48, 147.5], [46, 149], [44, 152.5], [42.2, 155.6]], 1.6)) L.push([x + rand(-.2, .2), z + rand(-.2, .2), a + rand(-.3, .3), rand(.9, 1.05), Math.random() < .5]);
    K6.handsDust = k6_decals(k6_decalMat(k6_handTex('150,140,120'), .95), L, .1, .1);
    const M2 = [], route = typeof TIEF_PATHS !== 'undefined' ? [...TIEF_PATHS[0], ...TIEF_PATHS[1].slice(1)] : [];
    for (const [x, z, a] of k6_along(route, 9, 4)) { const nx = Math.cos(a), nz = -Math.sin(a); for (let k = 0; k < 2; k++) M2.push([x + nx * 1.1 + rand(-.25, .25), z + nz * 1.1 + rand(-.25, .25), a + rand(-.6, .6), rand(.9, 1.1), k, .038]); }
    K6.handsMoss = k6_decals(k6_decalMat(k6_handTex('20,26,14'), .9), M2, .1, .1); }
  // --- A-23 „Hufe über Kinderfüßen“: vom Lager nach Westen zum Wrack – kleine nackte Abdrücke und Brotkrumen, darüber frischer die gespaltenen Hufe, die ihnen folgen (erst nach dem Lager)
  { const F = [], H = []; let i = 0; for (const [x, z, a] of k6_along(K6_KINDERSPUR, .42, .2)) { const s = i++ % 2 ? 1 : -1; F.push([x + Math.cos(a) * .06 * s, z - Math.sin(a) * .06 * s, a, rand(.95, 1.05), s > 0, .036]); }
    i = 0; for (const [x, z, a] of k6_along(K6_KINDERSPUR, 1.25, .5)) { const s = i++ % 2 ? 1 : -1; H.push([x + Math.cos(a) * .12 * s + rand(-.05, .05), z - Math.sin(a) * .12 * s, a + rand(-.1, .1), rand(.95, 1.1), false, .039]); } // nur zwei nebeneinander: auf zwei Beinen
    K6.kindF = k6_decals(fussMat, F, .085, .17); K6.hufe = k6_decals(k6_decalMat(k6_hufTex(), .15), H, .24, .28); K6.kindF.visible = K6.hufe.visible = false; }
  // --- Blutspur vom Weg am Amtsbus zur Fraßstelle (es hat das Reh dorthin geschleift)
  { const L = []; for (const [x, z] of k6_along([[40, 189], [22, 196], [8, 199.6], [3.5, 199.8]], 2.6, 1)) L.push([x + rand(-.4, .4), z + rand(-.4, .4), rand(0, 6.28), rand(.7, 1.3), Math.random() < .5, .036]);
    let bm = null; for (let i = 0; i < 40 && !(FAB.blood && FAB.blood.spatter); i++) await wait(100); const sp = FAB.blood && FAB.blood.spatter; bm = sp && sp.isMaterial ? sp : null;
    K6.blood = k6_decals(bm || k6_decalMat(k6_handTex('70,6,4'), .3), L, .45, .45); }
  // --- Hochsitz: ein alter Stuhl (Scan), darauf später der Junge
  try { const TS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 }, y = 3.1; const ch = await msFBX('chair', 'model.fbx', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } });
    msFit(ch, .92, 'y'); const g = msGround(ch); g.position.set(TS.x + .15, y, TS.z + .35); g.rotation.y = PI; g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); K6.grp.add(g); K6.chair = g;
    const bg = new T.Group(); bg.position.set(TS.x + .15, y, TS.z + .42); bg.visible = false; bg.userData.noCol = true; K6.grp.add(bg); K6.boy = { g: bg, P: null }; } catch (e) { console.warn('Kapitel6: Hochsitz', e); }
  // --- Peters Feuerzeug in der Hand (Scan w_lighter) mit Flammen-Sprite; das Licht ist ein VLight, beim Laden mit 0 angelegt
  try { const src = await msModel('w_lighter', 'model.glb'); const o = msGround(msFit(src.clone(true), .065, 'y')); o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; m.frustumCulled = false; } });
    const g = new T.Group(); g.add(o); const fl = new T.Sprite(new T.SpriteMaterial({ map: flameTex, color: 0xffd08a, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); fl.scale.set(.022, .038, 1); fl.position.y = .082; g.add(fl);
    g.visible = false; g.userData.noCol = true; scene.add(g); const L = new VLight(0xffb266, 0, 6.5, 2); scene.add(L); K6.lighter = { g, fl, L, on: false, t: 0, size: 1, lean: null, welt: false }; } catch (e) { console.warn('Kapitel6: Feuerzeug', e); }
  // --- Requisiten der Falle (AG-19): zwei Eisennetze an Seilen zwischen den Bäumen, ein Stolperdraht auf Kniehöhe (Glanz nur im Lampenlicht), die gefallene Lampe
  { const nm = new T.MeshStandardMaterial({ map: k6_netzTex(), transparent: true, alphaTest: .35, roughness: .55, metalness: .75, side: T.DoubleSide }), rope = new T.MeshStandardMaterial({ color: 0x3a3024, roughness: .95 });
    K6.netze = K6_BUS.netz.map(([x, z]) => { const g = new T.Group(); const n = new T.Mesh(new T.PlaneGeometry(3.4, 3.4, 6, 6), nm); n.rotation.x = -PI / 2; n.castShadow = true; g.add(n);
      const pa = n.geometry.attributes.position; for (let i = 0; i < pa.count; i++) { const a = pa.getX(i), b = pa.getY(i); pa.setZ(i, -(1 - (a * a + b * b) / 5.8) * .45); } n.geometry.computeVertexNormals(); // hängt durch
      const ropes = []; for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) { const r = new T.Mesh(new T.CylinderGeometry(.012, .012, 1, 5), rope); r.position.set(dx, 0, dz); g.add(r); ropes.push(r); }
      g.position.set(x, 3.9, z); g.userData = { y0: 3.9, ropes, fall: -1 }; K6.grp.add(g); k6_seile(g); return g; });
    const [a, b] = K6_BUS.draht, dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz); const w = new T.Mesh(new T.CylinderGeometry(.0035, .0035, L, 4), new T.MeshStandardMaterial({ color: 0x9aa0a6, roughness: .12, metalness: 1 }));
    w.rotation.set(PI / 2, 0, 0); const wg = new T.Group(); wg.add(w); wg.position.set((a[0] + b[0]) / 2, .46, (a[1] + b[1]) / 2); wg.rotation.y = Math.atan2(dx, dz); K6.grp.add(wg); K6.draht = wg;
    const lg = new T.Group(); const body = new T.Mesh(new T.CylinderGeometry(.045, .05, .2, 12), new T.MeshStandardMaterial({ color: 0x5d6064, roughness: .45, metalness: .7 })); body.rotation.x = PI / 2; lg.add(body);
    const lens = new T.Mesh(new T.CircleGeometry(.042, 16), new T.MeshBasicMaterial({ color: 0xfff4de })); lens.position.z = .101; lg.add(lens);
    const glow = new T.Sprite(new T.SpriteMaterial({ map: poolTex, color: 0xe8eeff, transparent: true, opacity: .8, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.setScalar(.9); glow.position.z = .16; lg.add(glow);
    lg.visible = false; lg.userData.noCol = true; K6.grp.add(lg); K6.lampe = lg; }
  // --- AG-20: das glatte „Kissen“ unter der Kapuze (kein Gesicht), die Dienstmarke „3-4“, das Merkblatt in der Brusttasche
  { K6.kissen = new T.Mesh(new T.SphereGeometry(.1, 20, 14), new T.MeshStandardMaterial({ color: 0xd9c9b8, roughness: .55 })); K6.kissen.scale.set(.95, 1.15, .7); K6.kissen.visible = false;
    K6.marke = new T.Mesh(new T.PlaneGeometry(.07, .045), new T.MeshStandardMaterial({ roughness: .4, metalness: .6, map: k6_tex(128, 80, (g, w, h) => { g.fillStyle = '#9aa0a2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c1c1c'; g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.fillText('3-4', w / 2, 58); }) })); K6.marke.visible = false; }
  // --- Pfandflasche auf dem ersten Pfad (Bier, acht Cent): Glas, braun
  { const pts = [[.0, 0], [.032, 0], [.034, .01], [.034, .16], [.03, .19], [.013, .22], [.012, .27], [.014, .28], [0, .28]].map(([x, y]) => new T.Vector2(x, y));
    const f = new T.Mesh(new T.LatheGeometry(pts, 16), new T.MeshPhysicalMaterial({ color: 0x3d1f08, roughness: .08, metalness: 0, transmission: .35, transparent: true, opacity: .9, clearcoat: 1 }));
    f.rotation.set(PI / 2 - .08, 0, .9); f.position.set(20.4, .035, 120.2); f.castShadow = true; K6.grp.add(f); K6.flascheM = f;
    K6.flascheHit = box(.5, .4, .5, 20.4, .2, 120.2, hidden, { cast: false }); interact(K6.flascheHit, () => K6.on && !K6.flasche ? 'Eine Pfandflasche' : '', () => k6_flascheNehmen()); }
  // --- Wrack: Handschuhfach (Hofers Seite 5, Hildes Polaroid „— H.“) · Bau: die gefallene Batterie zwischen den Rippen (nach dem Höhepunkt)
  if (typeof TIEF !== 'undefined') { const W = TIEF.wreck; K6.hfHit = box(.6, .5, .6, W.x + 1.1, .9, W.z - .7, hidden, { cast: false }); interact(K6.hfHit, () => K6.on && !K6.told.has('handschuhfach') ? 'Das Handschuhfach' : '', () => k6_handschuhfach()); }
  { const B = typeof HUNGRIGE !== 'undefined' ? HUNGRIGE.bau : { x: -13.2, z: 206.8 }; const bt = new T.Mesh(new T.CylinderGeometry(.017, .017, .06, 10), new T.MeshStandardMaterial({ color: 0x2b2b2e, roughness: .35, metalness: .6 })); bt.rotation.z = PI / 2 - .3; bt.position.set(B.x + .9, .03, B.z - .6); bt.visible = false; K6.grp.add(bt); K6.batM = bt;
    K6.batHit = box(.5, .4, .5, B.x + .9, .2, B.z - .6, hidden, { cast: false }); interact(K6.batHit, () => K6.on && K6.batFall && !K6.batDa ? 'Die Batterie zwischen den Rippen' : '', () => { if (!K6.batFall || K6.batDa) return; K6.batDa = true; bt.visible = false; if (typeof addBattery === 'function') addBattery(1); k6_luke('Da bist du ja.', 1800); }); }
  // --- AP-24 (Autorentscheid 01.10.2026): das Funkgerät der Bergung zurücklegen (+4) – am Hochsitz statt am Gitter (der Weg führt nicht zurück; dort holt die Bergung es ab)
  if (typeof TIEF !== 'undefined') { const H = TIEF.stand; K6.funkZHit = box(.5, .6, .5, H.x + 1.05, 1.2, H.z - 1, hidden, { cast: false }); interact(K6.funkZHit, () => K6.on && k6_has('bergungsfunk') && !K6.told.has('funkZurueck') ? 'Das Funkgerät an den Pfosten hängen (für die Bergung)' : '', () => k6_funkZurueck()); }
  // --- Bestandsliste-Fetzen auf der Trittstufe des Busses (nach der Falle)
  if (typeof TIEF !== 'undefined') { const B = TIEF.bus; K6.liste = k6_papier(.19, .25, B.x - 3.1, .06, B.z - 1.6, -PI / 2 + .1, .8, 0xe6e1d2); K6.liste.visible = false;
    K6.listeHit = box(.5, .4, .5, B.x - 3.1, .2, B.z - 1.6, hidden, { cast: false }); interact(K6.listeHit, () => K6.on && K6.falleFertig ? 'Ein Klemmbrett-Blatt' : '', () => k6_liste()); }
  // --- Einblendungen: „E – …“ und Auswahl (Tasten 1–3)
  { const css = document.createElement('style'); css.textContent = `#k6Hint { position: absolute; left: 50%; bottom: 23%; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; opacity: 0; transition: opacity .6s; pointer-events: none;
      font: 600 14px "Cormorant Garamond", Georgia, serif; letter-spacing: .32em; color: #e9dfc8; text-shadow: 0 0 2px #000, 0 0 10px #000; white-space: nowrap; } #k6Hint.show { opacity: 1; }
    #k6Hint b, #k6Wahl b { display: inline-flex; align-items: center; justify-content: center; min-width: 28px; height: 28px; padding: 0 6px; letter-spacing: 0; border: 1px solid rgba(201,163,106,.7); border-radius: 3px; background: rgba(8,7,6,.62); color: #f3e7cc; font: 700 14px Georgia, serif; }
    #k6Wahl { position: absolute; left: 50%; bottom: 31%; transform: translateX(-50%); display: flex; flex-direction: column; gap: 10px; opacity: 0; transition: opacity .5s; pointer-events: none; }
    #k6Wahl.show { opacity: 1; } #k6Wahl div { display: flex; align-items: center; gap: 14px; font: italic 20px "Cormorant Garamond", Georgia, serif; color: #e2d6b8; text-shadow: 0 0 3px #000, 0 0 12px #000; white-space: nowrap; }`;
    document.head.appendChild(css); const hud = document.getElementById('hud'); K6.hint = document.createElement('div'); K6.hint.id = 'k6Hint'; hud.appendChild(K6.hint); K6.wahl = document.createElement('div'); K6.wahl.id = 'k6Wahl'; hud.appendChild(K6.wahl); }
  // --- Kinderblick (Taste G): die Hauptaufgabe
  if (typeof hintAdd === 'function') { const H = (id, x, z, open) => hintAdd({ id, x, y: 0, z, kind: 'story', near: 60, open: () => K6.on && open() });
    H('k6_huette', 58, 149.5, () => K6.beat === 'krumen' || K6.beat === 'huette'); H('k6_zaun', 42, 156.5, () => K6.beat === 'zaun'); H('k6_hochsitz', 14, 178.5, () => K6.beat === 'faden' && !K6.sp.has('k6_hochsitz'));
    H('k6_bus', 65, 199.5, () => (K6.beat === 'faden' && K6.sp.has('k6_hochsitz')) || (K6.beat === 'falle' && !K6.falleAn)); H('k6_mitte', K6_BUS.mitte[0], K6_BUS.mitte[1], () => K6.beat === 'falle' && K6.falleAn && K6.falle && K6.falle.ph === 'bereit' && K6.weg !== 'ab');
    H('k6_frass', 1.5, 199.6, () => K6.beat === 'frass' && !k6_hh('spuren')); H('k6_lager', 80.5, 233, () => K6.beat === 'wrack' && !K6.lager);
    H('k6_wrack', -10, 204.5, () => K6.beat === 'wrack' && K6.lager); H('k6_bau', -13.2, 206.8, () => K6.beat === 'bau' && !k6_hh('bau')); H('k6_hochsitz2', 14, 178.5, () => K6.beat === 'hochsitz'); }
  // --- Todesart „wendigo“ (tod.js bleibt unverändert: Tabellen von außen erweitert, wie kapitel5.js)
  if (typeof TOD_LINES !== 'undefined') TOD_LINES.wendigo = ['Es hat nicht gebissen. Es hat probiert.', 'Du hast die Lampe gesenkt. Nur einmal.', 'Im Wald hat niemand gehört, wie du gerufen hast. Nur einer.'];
  if (typeof TOD_ANIM !== 'undefined') TOD_ANIM.wendigo = A => { const B = A.base; flashOn = false; A.maxBack = Math.max(A.maxBack ?? 1.2, .6);
    A.curve = t => { if (t < .28) { const k = tod_ease(t / .28); return { h: 1.65 + .28 * k, back: -.08 * k, pitch: tod_lerp(B.pitch, .55, k), roll: .12 * k, shake: .07 }; } // hochgerissen
      if (t < 1.3) { const k = tod_ease((t - .28) / 1.02); return { h: 1.93 - 1.55 * k, back: -.08 + 1.3 * k, pitch: .55 - 1.0 * k, roll: .12 + .5 * k, yaw: .5 * k, shake: .035 * (1 - k) }; } // nach hinten ins Dunkel gezogen
      return { h: .38, back: 1.22, pitch: -.45, roll: .62, yaw: .5, shake: 0 }; };
    gtAfter(20, () => { Audio.crack(); if (Audio.groan) Audio.groan(B.x, B.z, true); }); gtAfter(350, () => Audio.play('scrape3', { gain: .35, rate: .5, x: B.x, y: .3, z: B.z })); gtAfter(900, () => { if (typeof TOD_SND !== 'undefined') TOD_SND.thud(.8); });
    gtAfter(1600, () => Audio.whisper(B.x, 1, B.z, 1.6)); return 4800; };
  if (typeof TOD_RESET !== 'undefined') TOD_RESET.push((id, kind) => { if (!K6.on) return; k6_hinweis(''); K6.wahl.classList.remove('show'); if (kind === 'wendigo') { k6_nachbildGefressen(); if (FLASH.spare === 0 && FLASH.charge < .3) FLASH.charge = .55; } });
  modItem('pfandflasche', 'Pfandflasche', 'Bier, acht Cent. „Wenn ich das überlebe, ist das mein Anfang.“', 'paper');
  modItem('seitenschneider', 'Seitenschneider', 'Aus der Werkzeugtasche der Bergung. Schneidet Draht.', 'key');
  modItem('bergungsfunk', 'Funkgerät der Bergung', 'Vom toten Blechmann. Es rauscht, als würde jemand zuhören.', 'paper');
  K6.ready = true;
}]);
function k6_seile(g) { for (const r of g.userData.ropes) { const top = 8.2, y = g.position.y; r.scale.y = Math.max(.05, top - y); r.position.y = (top - y) / 2; } }
// ---------------------------------------------------------------- Brotkrumen und die Krähe (Hooks für hungrige.js)
function k6_krumeVorn() { // eine noch liegende Krume 5–12 m vor Luke, im Blick
  if (!K6.on || K6.eaten || K6.beat !== 'krumen') return null; const P = player.pos, f = flatDir(); let best = null, bd = 1e9;
  for (const c of K6.krumen) { if (c.gone) continue; const dx = c.x - P.x, dz = c.z - P.z, d = Math.hypot(dx, dz); if (d < 5 || d > 12 || (dx * f.x + dz * f.z) / d < .7) continue; if (d < bd) { bd = d; best = c; } }
  return best ? [best.x, 0, best.z] : null;
}
function k6_krumeWeg(c) { if (c.gone) return; c.gone = true; for (const i of c.idx) for (const im of K6.krIM) { im.setMatrixAt(i, _k6Z); im.instanceMatrix.needsUpdate = true; } }
function k6_krumenFressen(x, z) { for (const c of K6.krumen) if (Math.hypot(c.x - x, c.z - z) < 2.5) k6_krumeWeg(c); }
function k6_nachKraehe(ate, pos) { // die Krähe hat gefressen: auch die übrigen Krumen voraus sind fort · Whiskey schreit sie an, jagt sie drei Bäume weit, kommt zurück und putzt sich demonstrativ
  if (!K6.on) return; const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null;
  if (W && W.g && W.g.visible && pos && typeof whiskey_fly === 'function' && !W.fl) { const P = player.pos, back = W.g.position.clone(); try { whiskey_mimic('schrei', { force: true }); } catch (e) {}
    whiskey_fly(new THREE.Vector3(pos.x + (pos.x - P.x) * .6, 5, pos.z + (pos.z - P.z) * .6), () => setTimeout(() => whiskey_fly(back, () => { try { whiskey_play('IdleScratchWing', .2, true); } catch (e) {} }), 900)); }
  if (K6.eaten || !ate) return; K6.eaten = true; const P = player.pos;
  for (const c of K6.krumen) if (c.z > P.z - 2) k6_krumeWeg(c);
  setTimeout(() => { if (K6.beat === 'krumen') { k6_obj('Die Spur ist weg. Zayns Hütte liegt hinten links.'); k6_set('huette'); } }, 5200);
}
// ---------------------------------------------------------------- Stufen aus hungrige.js (Rückruf)
function k6_hungrigeDone(id) { if (!K6.on) return;
  if (id === 'hirsch' && K6.beat === 'frass') { k6_set('wrack'); K6.jagdSeg = 1; setTimeout(() => { if (K6.beat !== 'wrack' || K6.lager) return; k6_obj('Weg vom Bau. Whiskey fliegt nach Osten – zu Jonas’ Lager.'); k6_route(K6_ZUM_LAGER); }, 2600); }
}
function k6_seite(i, neu) { if (!K6.on) return; if (i === 1 && K6.beat === 'frass' && neu) setTimeout(() => { if (!state.talking) k6_obj('Das Ding ist hier. Irgendwo.'); }, 9000); }
function k6_bauFrei() { return !K6.on || K6.beat === 'bau' || k6_ab('epilog'); }
function k6_nachLager() { return !K6.on || K6.lager; }
function k6_nacktFrei(id) { if (!K6.on) return true; if (id === 'wolf') return false; return true; } // den Geschälten Wolf spielt die Falle (AG-19) selbst
// ---------------------------------------------------------------- Lampe, Batterie, Feuerzeug (Höhepunkt am Bau)
function k6_feuerzeug(on) {
  const L = K6.lighter; if (L) { L.on = on; L.g.visible = on; L.size = 1; L.lean = null; if (!on) L.L.intensity = 0; }
  if (on) { Audio.play('lighterClick', { gain: .4, rate: 1 }); setTimeout(() => Audio.play('switch2', { gain: .12, rate: .7 }), 160); }
  else if (K6.lampDead) { K6.lampDead = false; flashOn = true; state.flashFail = Math.max(state.flashFail, .5); Audio.play('woodHit3', { gain: .12, rate: 2.2 }); } // Tontechniker-Reflex: gegen die Handfläche geschlagen, sie geht wieder an
}
function k6_flamme(k, x, y, z) { const L = K6.lighter; if (!L) return; if (k !== undefined) L.size = k; if (x !== undefined) L.lean = new THREE.Vector3(x, y, z); }
function k6_feuerzeugWelt(on) { const L = K6.lighter; if (!L) return; L.welt = on; if (on) { const fx = -Math.sin(player.yaw), fz = -Math.cos(player.yaw); L.g.position.set(player.pos.x + fx * .35 + fz * .18, 1.42, player.pos.z + fz * .35 - fx * .18); L.g.rotation.set(0, player.yaw, 0); } }
function k6_taste(code, ms) { return new Promise(res => { const t0 = performance.now(); let done = false; const k = e => { if (e.code === code || (code === 'KeyE' && e.code === 'Enter')) { done = true; removeEventListener('keydown', k, true); res(true); } }; addEventListener('keydown', k, true);
  const safe = () => { if (done) return; if (performance.now() - t0 > ms) { removeEventListener('keydown', k, true); res(false); } else setTimeout(safe, 400); }; setTimeout(safe, 400); }); }
async function k6_lampeStirbt() {
  if (!K6.on) return; state.flashFail = 1.4; Audio.play('buzz', { gain: .12, rate: 1.4, dur: .6 }); await k6_wait(1400);
  K6.lampDead = true; flashOn = false; Audio.play('switch1', { gain: .15, rate: .6 }); await k6_wait(500);
  await say([['Nicht jetzt.', 1800, 'LUKE']]);
  if (FLASH.spare > 0) { k6_hinweis('E', 'Batterie wechseln'); await k6_taste('KeyE', 60000); k6_hinweis(''); // die Finger zittern, die Batterie rutscht weg und fällt zwischen die Rippen
    FLASH.spare--; K6.batFall = true; K6.batDa = false; if (K6.batM) K6.batM.visible = true; shake = Math.max(shake, .015); await k6_wait(420);
    const B = HUNGRIGE.bau; Audio.play('woodHit3', { gain: .16, rate: 2.6, x: B.x + .9, y: .1, z: B.z - .6, ref: 2 }); await k6_wait(1200); }
  k6_hinweis('E', 'Feuerzeug'); await k6_taste('KeyE', 60000); k6_hinweis(''); k6_feuerzeug(true); await k6_wait(900);
  await say([['Damit du im Dunkeln nicht allein bist.', 3000, 'LUKE']]);
}
function k6_lighterTick(dt, t) {
  const L = K6.lighter; if (!L) return; if (K6.lampDead) flashOn = false;
  if (!L.on) return; L.t += dt; if (!L.welt) { _k6V.set(.15, -.16, -.36).applyQuaternion(camera.quaternion).add(camera.position); L.g.position.copy(_k6V); L.g.quaternion.copy(camera.quaternion); L.g.rotateX(.25); }
  const fk = .85 + Math.sin(t * 13) * .06 + Math.sin(t * 29 + 1.3) * .05 + (Math.random() - .5) * .06, s = L.size; L.fl.scale.set(.022 * fk * s, .038 * (2 - fk) * s, 1);
  L.fl.material.rotation = L.lean ? Math.max(-.6, Math.min(.6, (L.lean.x - L.g.position.x) * .3)) : 0; // die Flamme neigt sich zu ihm hin, als würde sie eingeatmet
  L.fl.getWorldPosition(L.L.position); L.L.position.y += .02; L.L.intensity += (3 * fk * s - L.L.intensity) * Math.min(1, dt * 10);
}
function k6_windStoss() { if (Audio.gust) Audio.gust(1.4); K6.stossT = 1.2; } // ein einziger Stoß durch die Kronen in der Stille-Zone
function k6_waldAufEinmal() { const P = player.pos; K6.stossT = 1.1; // eine Sekunde lang alle Geräusche des Waldes, dann abgeschnitten
  try { if (Audio.owl) Audio.owl(P.x + 20, P.z + 15); if (Audio.gust) Audio.gust(1.5); if (Audio.deerBark) Audio.deerBark(P.x - 18, P.z + 22); Audio.play('dog', { gain: .25, rate: .9, dur: .9, x: P.x + 60, y: 1, z: P.z - 40, ref: 12 }); Audio.caw(P.x - 9, 8, P.z + 6); } catch (e) {} }
function k6_senderBeiIhm() { return K6.sender === 'wendigo'; }
// ---------------------------------------------------------------- Stille-Zonen (Werte vorab, keine Allokation) + Lampenverbrauch in der Zone
const K6_ZONEN = [
  { id: 'frei', x: 35.5, z: 166.5, r: 6, soft: 5, on: () => K6.beat === 'faden' && !K6.told.has('freiAus') }, // die erste: an einer Stelle ohne Fraßstelle, nur Laub
  { id: 'justin', x: 40.5, z: 189.5, r: 7, soft: 5, on: () => K6.justinT > 0 },
  { id: 'hochsitz', x: 14, z: 178.5, r: 15, soft: 6, on: () => !!(hungrige_S.ev && hungrige_S.ev.id === 'nackt_reh') }, // um das Geschälte Reh, wo es gerade ist
  { id: 'bus', x: 65, z: 199.5, r: 15, soft: 6, on: () => K6.falleAn && !K6.falleFertig && !!K6.falle && K6.falle.wolf && K6.falle.wph !== 'lie' }, // um den Geschälten Wolf, sobald er steht; wächst beim Warten
  { id: 'frass', x: 1.5, z: 199.6, r: 25, soft: 6, on: () => k6_ab('frass') },
  { id: 'bau', x: -13.2, z: 206.8, r: 30, soft: 6, on: () => k6_ab('frass') }];
function k6_zoneWert(Z, P) { const d = Math.hypot(P.x - Z.x, P.z - Z.z); return d < Z.r ? 1 : d < Z.r + Z.soft ? (Z.r + Z.soft - d) / Z.soft : 0; }
function k6_stille(dt) {
  if (!K6.on || typeof SP === 'undefined') return; const P = player.pos; let want = 0, zone = null;
  const off = (typeof hungrige_S !== 'undefined' && hungrige_S.finale && !hungrige_S.cine) || k6_ab('epilog') || state.inBasement || state.zone === 'canal';
  if (!off && !(typeof hungrige_S !== 'undefined' && hungrige_S.cine)) {
    for (const Z of K6_ZONEN) { if (!Z.on()) continue; if (Z.id === 'hochsitz' && hungrige_S.ev && hungrige_S.ev.id === 'nackt_reh' && hungrige_S.ev.V) { Z.x = hungrige_S.ev.V.g.position.x; Z.z = hungrige_S.ev.V.g.position.z; } else if (Z.id === 'hochsitz') { Z.x = 14; Z.z = 178.5; }
      if (Z.id === 'bus') { const w = K6.falle.wolf.g.position; Z.x = w.x; Z.z = w.z; Z.r = K6.falle.wachs ? 15 + 9 * Math.min(1, K6.falle.wachs) : 15; } const s = k6_zoneWert(Z, P); if (s > want) { want = s; zone = Z; } }
    const J = K6J; if (J.aktiv && J.st !== 'aus' && J.st !== 'weg') { const d = Math.hypot(P.x - J.p.x, P.z - J.p.z), s = d < 20 ? 1 : d < 30 ? (30 - d) / 10 : 0; if (s > want) { want = s; zone = K6J; } } } // er trägt die Stille mit sich
  else if (typeof hungrige_S !== 'undefined' && hungrige_S.cine) { want = 1; zone = K6_ZONEN[5]; } // im Höhepunkt: kein Wind, keine Tiere, Hall null
  if (K6.stossT > 0) { K6.stossT -= dt; want = Math.min(want, .15); }
  const st = dt / 3; K6.sil += Math.max(-st, Math.min(st, want - K6.sil)); SP.silent = K6.sil; if (typeof spannung_bed === 'function') spannung_bed(false);
  if (K6.sil > .5 && flashOn && !K6.lampDead && FLASH.charge > 0) { const T = FLASH_TIERS[FLASH.tier]; FLASH.charge = Math.max(0, FLASH.charge - dt / T.life * .5 * K6.sil); } // A-20: in der Stille 1,5-mal so schnell leer
  K6.zone = K6.sil > .9 ? zone : null; const zid = K6.zone ? (K6.zone === K6J ? 'jagd' : K6.zone.id) : '';
  if (zid !== K6.inZ) { const vor = K6.inZ; K6.inZ = zid; k6_zoneWechsel(vor, zid); }
}
function k6_zoneWechsel(vor, jetzt) {
  const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null;
  if (jetzt && !K6.told.has('still') && k6_frei()) { K6.told.add('still'); k6_luke('Hier ist es still. Nicht leise. Still.', 3400); setTimeout(() => { if (K6.sil > .8 && !state.talking) { k6_luke('„Whiskey?“', 1800); } }, 4200); } // er ruft: nichts kommt zurück
  if (jetzt === 'frass' && !K6.rief && k6_near(1.5, 199.6, 13)) { K6.rief = true; setTimeout(() => { if (!state.talking) k6_luke('„Luke?“', 2000); }, 1400); } // der Ruf, den das Ding im Höhepunkt zurückgibt
  if (vor === 'frei' && !jetzt) { K6.told.add('freiAus'); if (W && W.g && W.g.visible) try { whiskey_play('IdleScratchWing', .2, true); } catch (e) {} // wie ein Radio, das jemand wieder anschaltet; Whiskey schüttelt sich
    if (!K6.told.has('anni1')) { K6.told.add('anni1'); const f = flatDir(), P = player.pos; setTimeout(() => { if (typeof hungrige_stimme === 'function') hungrige_stimme(P.x - f.z * 7, 1.2, P.z + f.x * 7, '„Papa? Papa, ich bin’s.“', 'ANNI?', 2600, 'anni_1');
        if (W && W.g && typeof whiskey_blick === 'function') whiskey_blick(P.x + f.z * 6, 1.2, P.z - f.x * 6, 5); // Whiskey sieht NICHT hin: wo er nicht hinsieht, ist niemand
        setTimeout(() => k6_denk('anni1', 'Ein Mädchen. Sagt Papa. Hier gibt es keinen Papa. Hier gibt es nicht mal ein Echo.'), 3000); if (typeof sammeln_fibel === 'function') sammeln_fibel('R-K6'); }, 1500); } }
  if (jetzt && K6.flasche === 1 && Math.hypot(vel.x, vel.z) > .8) k6_flascheKlirr(); // die Flasche klirrt in der Jacke, viel zu laut
}
// ---------------------------------------------------------------- Die Pfandflasche (Humor, Lärm, Hochsitz)
function k6_flascheNehmen() { if (K6.flasche) return; K6.flasche = 1; K6.flascheT = 0; K6.flascheM.visible = false; uninteract(K6.flascheHit); if (!k6_has('pfandflasche')) story.items.push('pfandflasche'); Audio.play('glass1', { gain: .2, rate: 1.3 });
  k6_luke('Acht Cent. Wenn ich das überlebe, ist das mein Anfang.', 3200); }
function k6_flascheKlirr() { if (K6.flasche !== 1) return; K6.flasche = 2; const P = player.pos; Audio.play('glass1', { gain: .55, rate: 1.1, x: P.x, y: 1, z: P.z }); k6_laerm(P.x, P.z, 45);
  setTimeout(() => { k6_luke('Viel zu laut.', 1800); toast('Du wickelst die Flasche in deine Mütze.', 2600); }, 900); }
// ---------------------------------------------------------------- Ablauf
function k6_set(b) { if (K6.beat === b) return; K6.beat = b; if (typeof saveGame === 'function' && b !== 'oben') saveGame(6); }
function k6_beats(dt) {
  const B = K6.beat, P = player.pos, has = k => typeof tief_has === 'function' && tief_has(k), hh = k6_hh;
  if (B === 'krumen') { if (!K6.told.has('deckel') && typeof wald_in === 'function' && wald_in(P.x, P.z) && P.z > 101.5) k6_deckel(); if (k6_near(58, 149.5, 13)) { k6_obj('Zayns Hütte.'); k6_set('huette'); } }
  else if (B === 'huette') { const R = typeof wald_S !== 'undefined' && wald_S.hutRect; const inHut = R ? P.x > R.x0 - .3 && P.x < R.x1 + .3 && P.z > R.z0 - .6 && P.z < R.z1 + .3 : k6_near(58, 149.5, 2.5);
    if (inHut && !K6.told.has('huette')) { K6.told.add('huette'); k6_cp('k6_huette', 'SP6-2 · Zayns Hütte'); setTimeout(() => { if (K6.beat === 'huette') { k6_luke('Er schläft hier. Manchmal. Zwischen dem Stall und … was auch immer da hinten ist.', 4200); k6_obj('Die kleinen Hände führen hinaus. Zum eingedrückten Zaun.'); k6_set('zaun'); } }, 5000); } }
  else if (B === 'zaun') { if (k6_near(42, 156.4, 4.5) || has('tief_zettel_1') || P.z > 158) { k6_obj('Die rote Wolle. Und kleine Hände im Moos: Er folgt ihr auch.'); k6_set('faden'); } }
  else if (B === 'faden') { if (!K6.v11 && K6.variante === 'A' && k6_near(41.3, 159.6, 3) && k6_frei()) k6_v11(); // gleich hinter dem Zaun: das Handy rauscht wie ein Funkgerät
    if (!K6.sp.has('k6_hochsitz') && k6_near(65, 199.5, 24) && !K6.told.has('busFrueh') && k6_frei()) { K6.told.add('busFrueh'); k6_denk('busFrueh', 'Die Wolle kommt vom Hochsitz. Da war ich noch nicht. Er vielleicht schon.'); }
    if (k6_near(14, 178.5, 7)) { k6_cp('k6_hochsitz', 'SP6-3 · Der Hochsitz', 14, 175.4, PI); if (!K6.told.has('sb11')) k6_obj('Der Hochsitz. Hinauf.'); }
    k6_standTick(dt);
    if (K6.sp.has('k6_hochsitz') && !K6.told.has('justin') && k6_near(40.5, 189.5, 6) && k6_frei()) k6_justinStimme();
    if (K6.sp.has('k6_hochsitz') && k6_near(65, 199.5, 26)) k6_falleStart(); }
  else if (B === 'frass') { k6_ag20Tick(); if (!K6.told.has('anniFrass') && k6_near(10, 198.8, 5) && k6_frei()) { K6.told.add('anniFrass'); const f = flatDir(); if (typeof hungrige_stimme === 'function') hungrige_stimme(P.x - f.x * 5, 1.2, P.z - f.z * 5, '„Du hast unterschrieben. Ist schon gut. Ich hab den Lampion gemocht.“', 'ANNI?', 4200, 'anni_3'); } }
  else if (B === 'wrack') { k6_routeTick(); if (!K6.lager && k6_near(80.5, 233, 9)) { k6_cp('k6_lager', 'Jonas’ Lager', 78.6, 230.4, -.6); K6.lagerT += dt; const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null;
      if ((W && W.flags && W.flags.has('k6_3')) || K6.lagerT > 45) k6_lagerFertig(); else if (K6.lagerT > 3 && !K6.told.has('lagerHin')) { K6.told.add('lagerHin'); k6_obj('Jonas’ Lager. Durchatmen. Whiskey sitzt auf der Zeltstange.'); } }
    if (K6.lager && K6.kindF && !K6.told.has('hufe')) { for (const [x, z] of K6_KINDERSPUR) if (k6_near(x, z, 3.5)) { K6.told.add('hufe'); setTimeout(() => k6_luke('Er ist hinter ihm her.', 2600), 600); break; } }
    if (K6.lager && k6_near(-10, 204.5, 16) && !K6.told.has('beobFlucht')) k6_beobFlucht();
    if (K6.lager && k6_near(-10, 204.5, 9)) { k6_cp('k6_wrack', 'SP6-5 · Das Wrack', -5.8, 203.2, 1.9); k6_obj('Hinter dem Wrack. Da, wo es still ist.'); k6_set('bau'); }
    if (!K6.lager && k6_near(-13.2, 206.8, 11) && !K6.told.has('bauZuFrueh') && k6_frei()) { K6.told.add('bauZuFrueh'); k6_denk('bauFrueh', 'Nicht da rein. Nicht jetzt. Nicht mit dem Ding im Rücken.'); } }
  else if (B === 'bau') { if (typeof hungrige_S !== 'undefined' && hungrige_S.finale && !hungrige_S.cine) k6_epilog(); }
  else if (B === 'epilog') k6_guide(dt);
}
// Absperrgitter: ab Kapitel 5 die Kinderlücke, in Kapitel 6 aufbiegen (E halten, wie das Gitter im Amt) – erst nach Wolter (AG-18)
function k6_gitter(dt) {
  const D = typeof gruen_S !== 'undefined' && gruen_S.dustBarrier; if (!D) return;
  K6.kidT -= dt; if (K6.kidT < 0) { K6.kidT = 1; D.setKid(typeof kapAb === 'function' ? kapAb(5) : K6.on); }
  if (K6.openT >= 0) { K6.openT += dt; D.setOpen(Math.min(1, K6.openT / 1.3)); if (K6.openT >= 1.3) K6.openT = -1; return; }
  if (!K6.on || D.open) return; const P = player.pos, near = Math.abs(P.x - 30.1) < 5 && P.z > 95.3 && P.z < 98.3;
  if (near && !K6.ag18) { if (!K6.told.has('gitterNoch') && keys.KeyE) { K6.told.add('gitterNoch'); k6_luke('Gleich. Erst will ich wissen, wer da hinter mir parkt.', 2600); } return; }
  if (near && keys.KeyE && !ui.overlay && !scripted && !state.talking) { K6.holdT += dt; if (K6.holdT % .3 < dt) Audio.play(Audio.pick('metalHit1', 'metalHit2'), { gain: .1, rate: rand(1.4, 1.9), dur: .15, x: 33, y: .6, z: 98 });
    if (K6.holdT > 1.6) { K6.holdT = 0; K6.openT = 0; Audio.play('metalSheet', { gain: .35, rate: .8, x: 32, y: .5, z: 98.3 }); Audio.play('scrape2', { gain: .25, rate: .9, x: 32, y: .2, z: 98.5 }); $('sideInfo').textContent = '';
      if (K6.beat === 'gitter') { k6_set('krumen'); k6_obj('Folge den Brotkrumen.'); setTimeout(async () => { await say([['Hildes Brot. Er hat es zerbröselt. Damit er zurückfindet.', 3600, 'LUKE']]);
        k6_denk('maerchen', 'Ein Neunjähriger, der Brotkrumen streut. Und ich hab als Kind das Märchen nie zu Ende gelesen, weil ich wissen wollte, wie das Lebkuchenhaus schmeckt.', 600); }, 1500); } } }
  else K6.holdT = Math.max(0, K6.holdT - dt * 2);
  if (near && K6.ag18) $('sideInfo').textContent = K6.holdT > 0 ? '▮'.repeat(Math.ceil(K6.holdT / 1.6 * 8)).padEnd(8, '▯') : '';
}
// Das Dorf ist gesperrt (Abnahme): diesseits des Gitters nur der Platz davor – Luke geht nicht zurück, und er sagt, warum
function k6_sperre() { if (!K6.on || k6_ab('epilog')) return; const P = player.pos; if (P.z > 98.6) return; let hit = false;
  if (P.z < 86.5) { P.z = 86.5; hit = true; } if (P.x < 22.5) { P.x = 22.5; hit = true; } if (P.x > 38.5) { P.x = 38.5; hit = true; }
  if (hit) { vel.set(0, 0, 0); if (!K6.told.has('sperre') || (K6.sperreT || 0) < performance.now()) { K6.told.add('sperre'); K6.sperreT = performance.now() + 20000; k6_luke('Nein. Lucy schläft. Ich geh nicht zurück, bevor ich ihn gefunden hab.', 3200); } } }
// ---------------------------------------------------------------- UK 1 · „Wildschaden“: AG-18 Wolter, Auftrag 2
function k6_gehe(F, pts, v, ms) { return Promise.race([lwo_gehe(F, pts, v), k6_wait(ms)]); } // Gehen mit Zeitgrenze: eine Figur, die hängen bleibt, hält die Szene nicht auf
function k6_heini() { return k6_has('heini') || k6_has('polaroid_heini') || story.lore.some(l => /heini/i.test(l.key)); }
async function k6_ag18() {
  if (K6.ag18 || K6.ag18Busy || typeof lwo_szene !== 'function' || typeof lwo_figur !== 'function') { if (typeof lwo_szene !== 'function') K6.ag18 = true; return; }
  const W = lwo_figur('wolter'), B0 = lwo_figur('b0'); if (!W) { K6.ag18 = true; return; } K6.ag18Busy = true;
  try {
    // Scheinwerfer von hinten: der graue Kombi steht mit laufendem Motor auf dem Weg vom Spielplatz
    if (typeof lwo_kombiZeigen === 'function') { lwo_kombiZeigen(33.8, 84.6, 0, { stand: true, motor: true }); setTimeout(() => { try { lwo_kombiFernlicht(); } catch (e) {} }, 300); }
    if (B0) { lwo_zeigen(B0, 35.6, 83.4, -.5); lwo_blick(B0, null); } k6_ag18Tasche(true);
    lwo_zeigen(W, 32.4, 86.4, 0); await k6_wait(900); await k6_gehe(W, [[31.3, 90.4]], .9, 7000); lwo_blick(W, 'luke');
    const res = await lwo_szene('AG-18', { at: { x: 31, z: 92.5 }, radius: 16, figuren: { W }, bed: b => b === 'heini' ? k6_heini() : false,
      hook: async (tu) => { if (tu === 'senderZeigen') { k6_ag18Sender(W); return true; }
        if (tu && tu.r && /Whiskey/.test(tu.r)) { k6_whiskeyDeckel(); await k6_wait(2600); return true; }
        if (tu && tu.r && /Seitenschneider/.test(tu.r)) { K6.schneiderFrei = true; return true; } return false; } });
    const S = lwo_S.seen; K6.weg = S.ag18_mit !== undefined ? 'mit' : S.ag18_ab !== undefined ? 'ab' : 'spaeter'; lwo_S.auftrag2 = K6.weg; story.lwo.ag18 = K6.weg; // beobachter.js liest story.lwo.ag18 (B-K6-06)
    if (k6_heini()) lwo_ereignis('heini');
    if (K6.variante === 'C') K6.sender = K6.weg === 'ab' ? 'wolter' : 'jacke'; // C: er hält ihn hoch – nimmt Luke ihn zurück, oder Wolter steckt ihn wieder ein
    // Wolter geht zum Kombi, dreht sich auf dem Weg um
    await k6_gehe(W, [[32.6, 86.8]], .9, 6000); lwo_blick(W, 'luke'); await k6_wait(400);
    await lwo_zeile('W', '„Was immer da drin mit Ihrer Stimme spricht, Herr Brandt: Es ist nicht Ihre Schwester. Die liegt bei Herrn Vegas auf dem Sofa. Unter der karierten Decke.“');
    await k6_wait(1600); lwo_weg(W);
    if (typeof lwo_kombiLicht === 'function') lwo_kombiLicht({}); await k6_wait(8000); k6_ag18Tasche(false); if (B0) lwo_weg(B0); // der Blechmann packt ein; der Kombi fährt ohne Licht davon
    if (typeof lwo_kombiFahre === 'function') { await Promise.race([lwo_kombiFahre([[33.8, 72], [33.8, 50]], 3.2, true), k6_wait(9000)]); } if (typeof lwo_kombiWeg === 'function') lwo_kombiWeg();
    await say([['Er weiß, welche Decke. Hast du das gehört? Er weiß, welche Decke.', 3600, 'LUKE']]);
  } catch (e) { console.warn('Kapitel6: AG-18', e); }
  finally { K6.ag18 = true; K6.ag18Busy = false; k6_ag18Tasche(false); }
  if (K6.beat === 'gitter') k6_obj('Das Gitter aufbiegen. Der Junge ist darunter durch.');
}
function k6_ag18Sender(W) { const g = K6.props.sender || (K6.props.sender = new THREE.Mesh(new THREE.BoxGeometry(.05, .02, .034), new THREE.MeshStandardMaterial({ color: 0x5c5e61, roughness: .5, metalness: .7 }))); if (!g.parent) scene.add(g);
  g.position.set(W.g.position.x + .25, 1.28, W.g.position.z + .3); g.visible = true; setTimeout(() => { g.visible = false; }, 4500); }
function k6_ag18Tasche(on) { const T = K6.props; if (on && !T.tasche) { const g = new THREE.Group(); const bag = new THREE.Mesh(new THREE.BoxGeometry(.42, .24, .2), new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: .9 })); bag.position.y = .12; g.add(bag);
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .6, 14), new THREE.MeshStandardMaterial({ map: k6_netzTex(), color: 0x6a6258, roughness: .7, metalness: .5 })); roll.rotation.z = PI / 2; roll.position.set(-.55, .22, .1); g.add(roll);
    g.position.set(36.2, 0, 83.8); scene.add(g); T.tasche = g; T.taschenHit = box(.9, .6, .7, 36, .3, 83.9, hidden, { cast: false });
    interact(T.taschenHit, () => K6.on && K6.schneiderFrei && !K6.schneider ? 'Den Seitenschneider einstecken' : '', () => { if (K6.schneider || !K6.schneiderFrei) return; K6.schneider = true; if (!k6_has('seitenschneider')) story.items.push('seitenschneider'); if (typeof lwo_ereignis === 'function') lwo_ereignis('seitenschneider');
      Audio.play('keys2', { gain: .2, rate: 1.6 }); setTimeout(() => lwo_zeile('W', '„Den bekommen wir zurück, Herr Brandt.“'), 700); }); }
  if (T.tasche) T.tasche.visible = !!on; if (!on && T.taschenHit) uninteract(T.taschenHit); }
function k6_whiskeyDeckel() { // K6-1: aufs Kombi-Dach, an der Antenne picken, den Deckel der Thermoskanne klauen, über das Gitter und zurück
  const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; if (!W || !W.g || typeof whiskey_setzen !== 'function') { if (typeof whiskey_thermosdeckel === 'function') whiskey_thermosdeckel(); return; }
  whiskey_setzen(33.8, 1.62, 84.9, () => { setTimeout(() => { Audio.play('metalHit1', { gain: .14, rate: 2.8, x: 33.8, y: 1.6, z: 84.9 }); whiskey_thermosdeckel();
    setTimeout(() => whiskey_fly(new THREE.Vector3(30.4, 4.5, 104), () => setTimeout(() => whiskey_fly(new THREE.Vector3(27.98, 2.05, 98.02), null), 1400)), 900); }, 1100); }); }
// Der Deckel vor Lukes Fuß, erster Schritt in die Dustwoods (Bibel UK 2)
function k6_deckel() { K6.told.add('deckel'); const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; if (!W || !W.flags || !W.flags.has('k6_1') || W.flags.has('deckel') || typeof whiskey_deckelHin !== 'function') return;
  whiskey_deckelHin(); setTimeout(async () => { if (state.talking) return; await say([['Tausch? Was willst du dafür?', 2200, 'LUKE']]); try { whiskey_mimic('fahrrad', { force: true }); } catch (e) {} await k6_wait(1600); await say([['Ich hab kein Fahrrad. Du weißt, dass ich kein Fahrrad hab.', 3200, 'LUKE']]); }, 1200); }
// ---------------------------------------------------------------- UK 4 · V-11 „Der Köder bewegt sich“ (nur Variante A)
function k6_wahl(opts, ms = 0) { K6.wahl.innerHTML = opts.map((o, i) => `<div><b>${i + 1}</b><span>${trX(o)}</span></div>`).join(''); K6.wahl.classList.add('show');
  return new Promise(res => { let done = false; const k = e => { const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (!m || +m[2] > opts.length) return; e.preventDefault(); e.stopImmediatePropagation(); done = true; removeEventListener('keydown', k, true); K6.wahl.classList.remove('show'); res(+m[2] - 1); };
    addEventListener('keydown', k, true); if (ms) setTimeout(() => { if (!done) { removeEventListener('keydown', k, true); K6.wahl.classList.remove('show'); res(-1); } }, ms); }); }
async function k6_v11() { K6.v11 = true; state.talking = true;
  try { if (typeof lwo_zeile === 'function') await lwo_zeile('F', '„Köder bewegt sich nach Norden. Sender aktiv.“', { handy: true }); else subtitle('„Köder bewegt sich nach Norden. Sender aktiv.“', 3000, 'FUNK');
    Audio.play('items1', { gain: .2, rate: .9 }); await say([['Seit wann. Seit wann ist das da drin.', 2800, 'LUKE']]); k6_denk('v11', 'Der Tee. Er hat mir die Hand auf die Jacke gelegt.');
    const i = await k6_wahl(['Den Kasten behalten.', 'Den Kasten wegwerfen.']);
    if (i === 1) { K6.sender = 'wendigo'; if (typeof lwo_S !== 'undefined') lwo_S.sender = 'thrown'; const f = flatDir(), P = player.pos; Audio.play('stones1', { gain: .12, rate: 1.6, x: P.x + f.x * 9, y: .1, z: P.z + f.z * 9 }); k6_luke('Such mich doch.', 1800); }
    else { K6.sender = 'jacke'; if (typeof lwo_S !== 'undefined') lwo_S.sender = 'kept'; }
    if (typeof lwo_S !== 'undefined') lwo_S.seen['v:V-11:6'] = 1;
  } finally { state.talking = false; } }
// ---------------------------------------------------------------- UK 4 · Hochsitz: SB-11, B-K6-05, Anni unter der Plattform, die Pfandflasche
function k6_oben() { // tiefwald.js: oben auf dem Hochsitz angekommen
  if (!K6.on) return false; if (K6.beat === 'hochsitz' && !K6.epiBusy) { k6_hochsitz(); return true; }
  if (K6.beat === 'faden' && !K6.told.has('oben1')) { K6.told.add('oben1'); if (typeof beobachter_zettel === 'function') try { beobachter_zettel('b_k6_05', { pos: [TIEF.stand.x + .55, 3.13, TIEF.stand.z + .62] }); } catch (e) {}
    setTimeout(() => { if (player.pos.y > 2 && typeof hungrige_stimme === 'function') hungrige_stimme(TIEF.stand.x + .4, .4, TIEF.stand.z + .2, '„Papa? … Papa, ich bin gleich wieder da.“', 'ANNI?', 3200, 'anni_2'); }, 11000); }
  return false;
}
function k6_standTick(dt) {
  const P = player.pos; if (!K6.told.has('sb11') && typeof sammeln_hatSB === 'function' && sammeln_hatSB(11) && !ui.overlay) { K6.told.add('sb11'); setTimeout(async () => { await say([['Mit seiner Stimme. Es hat als Erstes den Ritter probiert.', 3400, 'LUKE']]);
      k6_denk('sb11', 'Whiskey legt ihm die Seiten hin. Der hier hat sie hingelegt und ist hoch. Wie ich.', 400); k6_obj('Die Wolle führt weiter. Zum alten Bus.'); K6.fallT = 0; }, 800); }
  // Whiskey beleidigt: dreimal „Kum!“, dann nimmt er die Pfandflasche und lässt sie fallen – von unten klirrt es zurück
  if (K6.told.has('sb11') && !K6.told.has('flaschefall') && (K6.flasche === 1 || K6.flasche === 2) && P.y > 2 && typeof whiskey_S !== 'undefined' && whiskey_S.g && !state.talking) { K6.fallT = (K6.fallT || 0) + dt; if (K6.fallT > 4) k6_flascheFall(); }
}
async function k6_flascheFall() { K6.told.add('flaschefall'); const W = whiskey_S, H = TIEF.stand; state.talking = true;
  try { whiskey_setzen(H.x + .95, 4.02, H.z); for (let i = 0; i < 3; i++) { await k6_wait(1500); try { whiskey_mimic('kum', { force: true }); } catch (e) {} }
    await k6_wait(1200); K6.flasche = 3; story.items = story.items.filter(k => k !== 'pfandflasche'); Audio.flap(H.x + .9, 4, H.z); await k6_wait(900);
    Audio.play('glass1', { gain: .8, rate: .95, x: H.x + 1.2, y: .1, z: H.z - .8, ref: 6 }); k6_laerm(H.x, H.z, 60); await k6_wait(1100);
    await say([['Das waren acht Cent, du Ratte mit Flügeln.', 2800, 'LUKE']]); await k6_wait(1400);
    Audio.play('glass1', { gain: .5, rate: .93, x: H.x - 14, y: .1, z: H.z + 9, ref: 6 }); // etwas hat es nachgemacht
    if (W.g) try { whiskey_blick(H.x - 14, .5, H.z + 9, 8); } catch (e) {} } finally { state.talking = false; } }
// Unterwegs zwischen Hochsitz und Bus: eine kleine Stille-Zone, Justins Stimme ohne das Schaben der Platten
function k6_justinStimme() { K6.told.add('justin'); K6.justinT = 12; const f = flatDir(), P = player.pos;
  setTimeout(() => { if (typeof hungrige_stimme === 'function') hungrige_stimme(P.x + f.z * 5, 1.7, P.z - f.x * 5, '„Such mich, Papa.“', 'JUSTINS STIMME?', 2600, 'justin_falsch');
    setTimeout(() => k6_denk('justin', 'Der Ritter klingt wie eine Werkstatt, wenn er geht. Das da ist nicht gegangen. Das stand einfach da.'), 3200);
    setTimeout(() => { if (typeof beobachter_zettel === 'function') try { const g = flatDir(); beobachter_zettel('b_k6_04', { pos: [player.pos.x - g.x * 1.4, .05, player.pos.z - g.z * 1.4] }); } catch (e) {} }, 8000); }, 2600); }
// ---------------------------------------------------------------- UK 5 · „Sieben Kindersitze“: AG-19, die Falle der Blechmänner
function k6_falleStart() { if (K6.falleAn) return; K6.falleAn = true; k6_set('falle');
  const F = K6.falle = { ph: 'bereit', t: 0, mitteT: 0, wachs: 0, wolf: null, b: [], gezogen: null, wegT: 0, netzAuf: false, noHalt: 0 };
  if (typeof lwo_figur === 'function') K6_BUS.b.forEach(([x, z, ry], i) => { const B = lwo_figur('b' + i); if (!B) return; lwo_zeigen(B, x, z, ry); lwo_blick(B, 'luke'); lwo_lampe(B, false); F.b.push(B); });
  for (const n of K6.netze) { n.position.y = n.userData.y0; n.rotation.set(0, 0, 0); k6_seile(n); n.visible = true; } K6.draht.visible = true;
  k6_falleWolf(); if (typeof beobachter_zettel === 'function') try { beobachter_zettel('b_k6_06', { pos: [TIEF.bus.x - 1.5, 1.02, TIEF.bus.z + 1.1] }); } catch (e) {}
  if (typeof BEOB_SPERREN !== 'undefined' && !K6.sperreB) { K6.sperreB = true; BEOB_SPERREN.push(() => K6.on && K6.falleAn && !K6.falleFertig); }
  setTimeout(() => { if (typeof lwo_funk === 'function') lwo_funk('„Bergung an Nachsorge. Köder in Sichtweite.“', { x: 57, z: 201 }); }, 2400);
  setTimeout(() => { if (K6.falle && K6.falle.ph === 'bereit') k6_obj(K6.weg === 'ab' ? 'Der Bus. Irgendwas stimmt hier nicht.' : 'Stell dich in die Mitte, neben den Bus. Sagt der Blechmann mit der Hand.'); if (K6.weg !== 'ab' && F.b[0]) lwo_clip(F.b[0], 'look'); }, 5200);
}
function k6_falleWolf() { const F = K6.falle; if (F.wolf || typeof hungrige_beast !== 'function') return; const V = hungrige_beast('wolf', 1.2); if (!V) return; hungrige_nackt(V);
  const [x, z] = K6_BUS.wolf, sg = solidGround(x, .6, z); V.g.position.set(x, sg > -1 ? Math.max(0, sg) : 0, z); V.g.rotation.y = 2.4; V.g.visible = true; leben_play(V, 'Rest', 0); V.mx.update(2); V.sender = false; F.wolf = V; F.wph = 'lie'; F.away = 0; }
function k6_falleReset() { const F = K6.falle; if (!F) return; if (F.wolf) { hungrige_off(F.wolf); F.wolf = null; } for (const B of F.b) lwo_weg(B); K6.falleAn = false; K6.falle = null; K6.netzLuke = false; if (K6.props.netzCam) K6.props.netzCam.visible = false; k6_set('faden'); }
function k6_falleTick(dt) { const F = K6.falle; if (!F) return; F.t += dt; const P = player.pos, V = F.wolf;
  if (V && V.g.visible) { leben_beastUpd(V, dt, 60); k6_wolfTick(V, dt); }
  // Bus-Tür: Anni aus dem Bus (N-07)
  if (!K6.told.has('anniBus') && k6_near(TIEF.bus.x - 1.4, TIEF.bus.z + 1.4, 2.6) && k6_frei()) { K6.told.add('anniBus'); if (typeof hungrige_stimme === 'function') hungrige_stimme(TIEF.bus.x, 1.2, TIEF.bus.z, '„Kommst du mit rein? Es ist gar nicht dunkel da drin. Es ist nur lang.“', 'ANNI?', 4000, 'anni_4'); }
  if (!K6.told.has('warm') && k6_near(TIEF.bus.x - 1.5, TIEF.bus.z + 1.1, 1.8) && k6_frei()) { K6.told.add('warm'); setTimeout(() => k6_luke('Warm. Da hat gerade jemand gesessen. Jemand Kleines.', 3000), 1500); }
  if (F.ph === 'bereit') {
    if (K6.weg === 'ab') { const [a, b] = K6_BUS.draht; if (k6_segDist(P.x, P.z, a, b) < .45 && P.y < .6) k6_netzAufLuke(); return; } // niemand sagt ihm, wo der Draht liegt
    if (k6_near(K6_BUS.mitte[0], K6_BUS.mitte[1], 1.7)) { F.mitteT += dt; if (F.mitteT > .6) k6_falleWarten(); } }
  else if (F.ph === 'warten') { F.halt = true; k6_halten(K6_BUS.mitte[0], K6_BUS.mitte[1]); F.wachs = Math.min(1, F.wachs + dt / 40); if (F.t > F.dauer) k6_falleZu(); }
  else if (F.ph === 'netz') { k6_halten(F.hx, F.hz); if (F.frei) k6_freiTick(dt); }
  for (const n of K6.netze) { const U = n.userData; if (U.fall >= 0) { U.fall += dt; const k = Math.min(1, U.fall / .55); n.position.y = U.y0 + (U.y1 - U.y0) * k * k; n.rotation.x = Math.sin(U.fall * 9) * .06 * (1 - k); k6_seile(n); if (k >= 1) U.fall = -1; } }
  if (K6.lampe.visible && K6.lampe.userData.v) { const L = K6.lampe, U = L.userData; U.t += dt; L.position.y = Math.max(.05, L.position.y + U.v * dt); U.v -= 9.8 * dt; if (L.position.y <= .05) { U.v = Math.abs(U.v) > 1.2 ? -U.v * .25 : 0; } L.rotation.y += U.spin * dt; U.spin *= .985; L.rotation.z = PI / 2; }
}
function k6_segDist(x, z, a, b) { const vx = b[0] - a[0], vz = b[1] - a[1], L = vx * vx + vz * vz, k = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / L)); return Math.hypot(x - a[0] - vx * k, z - a[1] - vz * k); }
function k6_halten(x, z) { const P = player.pos, d = Math.hypot(P.x - x, P.z - z); if (d > .5) { P.x = x + (P.x - x) / d * .5; P.z = z + (P.z - z) / d * .5; vel.set(0, 0, 0); } }
// Der Geschälte Wolf (R6-3 „Wo vorne war“): liegt wie tot; kommt nur näher, wenn Luke wegsieht oder die Lampe senkt; unter 2,5 m springt er. Mit Licht drauf: „Sender anhängen“.
function k6_wolfTick(V, dt) { const F = K6.falle, p = V.g.position, d = hungrige_dist(V), f = leben_facing(p.x, p.y + .5, p.z), lit = hungrige_lit(V, 14, .95, .5);
  if (F.wph === 'lie') { if (d < 5.2 && f > .55) { F.wph = 'rise'; F.wt = 0; leben_play(V, 'RestToGoBackUp', .1, 1, true); k6_ton('stoehn', p.x, .4, p.z, .5, () => Audio.groan(p.x, p.z, false)); if (!K6.told.has('wolfG')) { K6.told.add('wolfG'); setTimeout(() => k6_denk('wolf', 'Was hier im Wald wohnt, hat keine Eile.'), 2600); } } }
  else if (F.wph === 'rise') { F.wt += dt; hungrige_facePlayer(V, dt * 1.5); if (F.wt > 1.9) { F.wph = 'stare'; leben_play(V, 'IdleAggressive', .3); k6_ton('knurr', p.x, .5, p.z, .45, () => Audio.growl(p.x, p.z, false)); } }
  else if (F.wph === 'geh') { F.wt = (F.wt || 0) - dt; if (F.wt < 0) { F.wt = .95; hungrige_nass(V, .3); } if (leben_beastMove(V, dt)) { F.wph = 'steht'; leben_play(V, 'IdleAggressive', .3); } } // geht in die Netze, wie gerufen
  else if (F.wph === 'stare') { hungrige_facePlayer(V, dt * 4); if (F.ph !== 'bereit') return;
    if ((f < .35 || !flashOn) && d < 20) F.away += dt; else if (F.away > .5 && f > .8) { F.away = 0; const P = player.pos, k = Math.max(0, 1 - 2.2 / (d || 1)); p.x = P.x + (p.x - P.x) * k * .6; p.z = P.z + (p.z - P.z) * k * .6; hungrige_nass(V, .4); k6_ton('knurr', p.x, .5, p.z, .6, () => Audio.growl(p.x, p.z, true)); glitchV = Math.max(glitchV, .4); }
    const kannHaengen = K6.sender === 'jacke' && K6.weg === 'spaeter' && lit && d < 1.9 && !V.sender; // R6-3: Lampe drauf, nicht senken, auf Armlänge
    if (kannHaengen) { k6_hinweis('E', 'Sender anhängen'); if (keys.KeyE && !K6.hangT) { K6.hangT = 1; V.sender = true; K6.sender = 'wolf'; k6_hinweis(''); Audio.play('metalHit1', { gain: .12, rate: 2.4, x: p.x, y: .5, z: p.z }); k6_luke('Jetzt bist du der Köder.', 2200); } }
    else if (K6.hint.classList.contains('show') && K6.hint.textContent.includes('Sender')) k6_hinweis('');
    if (d < 2.5 && !lit && !K6.sprungT) k6_wolfSprung(V); } }
async function k6_wolfSprung(V) { K6.sprungT = 1; leben_play(V, 'JumpBite', .05, 1, true); Audio.stinger(true); scareCount++; shake = .1; glitchV = .7; await k6_wait(450); if (typeof cutLights === 'function') cutLights(900);
  await k6_wait(500); $('fade').style.transition = 'opacity .25s'; $('fade').style.background = '#000'; $('fade').style.opacity = 1; await k6_wait(1600); // Luke fällt, Schwarzbild, Neustart vor der Lichtung am Bus
  const F = K6.falle; if (F && F.wolf) { const [x, z] = K6_BUS.wolf; F.wolf.g.position.set(x, F.wolf.g.position.y, z); F.wph = 'lie'; leben_play(F.wolf, 'Rest', .2); F.away = 0; }
  player.pos.set(49.5, 0, 192.4); player.yaw = -2.1; vel.set(0, 0, 0); K6.sprungT = 0; $('fade').style.transition = 'opacity 1.4s'; $('fade').style.opacity = 0; k6_denk('sprung', 'Er kommt, wenn ich wegseh. Lampe oben lassen. Merk dir das, Idiot.'); }
async function k6_falleWarten() { const F = K6.falle; if (F.ph !== 'bereit') return; F.ph = 'warten'; F.t = 0; F.dauer = K6.sender === 'jacke' ? 40 : 22; k6_obj('Warten.'); k6_hinweis('');
  if (K6.sender === 'jacke') { K6.senderBlink = true; } // die winzige rote Lampe an der Kante blinkt
  for (const B of F.b) lwo_lampe(B, false); if (typeof lwo_funk === 'function') lwo_funk('„Köder in Position. Netz eins scharf.“', { x: 57, z: 201 });
  setTimeout(() => { if (F.ph === 'warten' && typeof lwo_funk === 'function') lwo_funk('„Da ist was. Da ist was Großes.“', { x: 66.5, z: 192.6 }); }, (F.dauer - 8) * 1000); }
// Die Netze fallen · der Wolf (oder nichts) · ein Blechmann wird weggezogen · Funk je Weg · Wolter · (Mitmachen) die Glocke schlägt drei
async function k6_falleZu() { const F = K6.falle; F.ph = 'zu'; K6.senderBlink = false; const V = F.wolf, sab = K6.sender === 'wolf' ? 'wolf' : K6.sender === 'weiher' ? 'weiher' : K6.sender === 'wendigo' ? 'wendigo' : null;
  const weg = sab ? 'sabotage' : 'mit'; K6.falleWeg = weg; K6.sab = sab; const N0 = K6_BUS.netz[0], fu = (t, o) => typeof lwo_funk === 'function' ? lwo_funk(t, o || { x: 57, z: 201 }) : null;
  try {
    // Der Geschälte Wolf steht auf und geht in die Netze (Mitmachen, Sender am Wolf) – bei Weiher/Wendigo geht er ins Dunkel: die Netze fallen auf nichts
    if (V) { if (F.wph === 'lie') { leben_play(V, 'RestToGoBackUp', .1, 1, true); Audio.groan(V.g.position.x, V.g.position.z, false); await k6_wait(1900); }
      const hin = sab === 'weiher' || sab === 'wendigo' ? [V.g.position.x + 26, V.g.position.z + 16] : N0; F.wph = 'geh'; V.tx = hin[0]; V.tz = hin[1]; V.sp = 1.3; leben_play(V, 'Walk', .35, .8);
      for (let i = 0; i < 60 && F.wph === 'geh'; i++) await k6_wait(100); if (sab === 'weiher' || sab === 'wendigo') setTimeout(() => { if (F.wolf) hungrige_off(F.wolf); }, 3000); }
    for (const n of K6.netze) { n.userData.fall = 0; n.userData.y1 = .28; } Audio.play('metalSheet', { gain: .5, rate: .6, x: N0[0], y: 3, z: N0[1] }); setTimeout(() => Audio.play('metalSlam', { gain: .4, rate: .7, x: N0[0], y: .3, z: N0[1] }), 520);
    if (V && (sab === 'wolf' || !sab)) setTimeout(() => { F.wph = 'netz'; leben_play(V, 'Death', .1, 1, true); k6_ton('stoehn', V.g.position.x, .4, V.g.position.z, .8, () => Audio.growl(V.g.position.x, V.g.position.z, true)); }, 600);
    await k6_wait(700); for (const B of F.b.slice(0, 3)) { lwo_lampe(B, true); lwo_gehe(B, [[N0[0] + rand(-1.6, 1.6), N0[1] + rand(-1.6, 1.6)]], 2.2); }
    if (sab) { await k6_wait(900); await fu(sab === 'weiher' ? '„Nachsorge, das Signal ist im Wasser.“' : sab === 'wolf' ? '„… im Wolf.“' : '„Nachsorge, das Signal kommt von hinten. Das Signal kommt von HINTEN –“'); }
    else { await k6_wait(600); await fu('„Das geht durch das Eisen. Das geht einfach DURCH …“', { x: N0[0], z: N0[1] }); }
    // Hinter ihnen, außerhalb des Lichts, wird einer leise weggezogen (Sabotage: in Lukes Blickfeld)
    let B = F.b[3] || F.b[2]; if (sab) { let best = -2; for (const b of F.b) { if (!b.g.visible) continue; const p = b.g.position, f = leben_facing(p.x, 1.4, p.z); if (f > best) { best = f; B = b; } } }
    await k6_wait(700); await k6_wegziehen(B, !!sab);
    if (sab) { await lwo_zeile('FW', '„Das ist bedauerlich. Herr Brandt, wenn Sie das hören: Wir wissen jetzt, dass Sie nicht mitspielen. Das wird gespeichert.“'); lwo_ereignis('ag19_sabotage'); lwo_drohung('ag19'); K6.tote = 2; K6.nachFunk = '„Sie haben zwei Männer auf dem Gewissen, Herr Brandt. Ich schreibe das auf.“'; }
    else { await fu('„Bergung zwei, melden. Bergung zwei.“'); await lwo_zeile('FW', '„Das ist bedauerlich. Abbruch. Köder bleibt.“'); lwo_ereignis('ag19_mit'); }
    for (const b of F.b) { if (b === B || !b.g.visible) continue; lwo_lampe(b, false); lwo_gehe(b, [[b.g.position.x + 28, b.g.position.z - 20]], 1.6); LWO.hideQ.push(b); } if (V && !sab) setTimeout(() => { if (F.wolf) hungrige_off(F.wolf); }, 3500); // mit dem gefangenen Wolf zurück; die Netze hängen leer
    if (!sab) { await k6_wait(2600); await lwo_zeile('W', '„Sie haben Wort gehalten. Der Junge im Stall spricht mit niemandem. Außer mit Ihnen. Das haben wir gesehen.“', { handy: true }); await k6_wait(700); await lwo_zeile('W', '„Es ist drei.“', { handy: true });
      if (typeof leben_uhr === 'function') { await k6_wait(900); try { leben_uhr(3, 0, true); } catch (e) {} } } // die Glocke schlägt dreimal. Und hört auf.
  } catch (e) { console.warn('Kapitel6: Falle', e); }
  k6_falleEnde(weg);
}
async function k6_wegziehen(B, sichtbar) { if (!B) return; const P = player.pos; lwo_lampe(B, true); await k6_wait(900);
  const g = B.g.position, x0 = g.x, z0 = g.z, dx = g.x - P.x, dz = g.z - P.z, L = Math.hypot(dx, dz) || 1; if (typeof lwo_filterAtem === 'function') lwo_filterAtem(x0, 1.6, z0);
  if (sichtbar && typeof hungrige_S !== 'undefined' && hungrige_S.dt) { const D = hungrige_S.dt; D.g.position.set(x0 + dx / L * 2, 0, z0 + dz / L * 2); D.g.rotation.set(0, Math.atan2(-dx, -dz), 0); D.g.scale.setScalar(1); D.g.visible = true; setTimeout(() => { if (!hungrige_S.ev && !hungrige_S.cine) D.g.visible = false; }, 500); scareCount++; Audio.stinger(true); }
  for (let k = 0; k < 6; k++) { g.x = x0 + dx / L * k * 1.4; g.z = z0 + dz / L * k * 1.4; await k6_wait(45); } lwo_weg(B); Audio.play('scrape3', { gain: .25, rate: .6, x: x0, y: .3, z: z0 });
  const Lp = K6.lampe; Lp.position.set(x0, 1.3, z0); Lp.userData = { v: 0, spin: 7, t: 0 }; Lp.visible = true; Audio.play('metalHit2', { gain: .22, rate: 1.2, x: x0, y: .1, z: z0 }); } // die Lampe fällt und dreht sich im Laub, brennt weiter
// Ablehnen: Luke geht ahnungslos in den Draht, die Netze fallen auf ihn
async function k6_netzAufLuke() { const F = K6.falle; if (F.ph !== 'bereit') return; F.ph = 'netz'; K6.falleWeg = 'ab'; const P = player.pos; F.hx = P.x; F.hz = P.z; state.talking = true;
  try { Audio.play('metalSheet', { gain: .6, rate: .6, x: P.x, y: 3, z: P.z }); const n = K6.netze[0]; n.position.set(P.x, 3.9, P.z); n.userData.fall = 0; n.userData.y1 = 1.5; shake = .14; glitchV = .4; await k6_wait(560); Audio.play('metalSlam', { gain: .5, rate: .8 }); if (typeof TOD_SND !== 'undefined') TOD_SND.thud(.6);
    k6_netzCam(true); const [a, b] = [F.b[0], F.b[1]], f = flatDir(); if (a) { lwo_zeigen(a, P.x - f.z * .75, P.z + f.x * .75, 0); lwo_blick(a, 'luke'); lwo_lampe(a, true); } if (b) { lwo_zeigen(b, P.x + f.z * .75, P.z - f.x * .75, 0); lwo_blick(b, 'luke'); }
    await lwo_zeile('F', '„Köder gesichert. Warten auf Kontakt.“'); lwo_ereignis('ag19_netz'); state.talking = false; k6_obj('Atmen. Nur atmen.');
    for (let i = 0; i < 12; i++) { await k6_wait(4000); if (typeof kino_atem === 'function') kino_atem(.08, .9); } // sechzig Sekunden unter dem Netz
    state.talking = true; if (typeof lwo_filterAtem === 'function' && b) lwo_filterAtem(b.g.position.x, 1.6, b.g.position.z); await k6_wait(1800); if (b) lwo_weg(b); if (typeof kino_stoff === 'function') kino_stoff(.08); shake = .05; // die Hand bleibt einen Moment zu lange auf der Schulter
    await k6_wait(700); if (a) { lwo_gehe(a, [[a.g.position.x + 26, a.g.position.z - 16]], 2.6); LWO.hideQ.push(a); } for (const B of F.b.slice(2)) { lwo_lampe(B, false); lwo_gehe(B, [[B.g.position.x + 30, B.g.position.z - 14]], 2.4); LWO.hideQ.push(B); }
    const Lp = K6.lampe; Lp.position.set(P.x + 1.6, 1.2, P.z + .8); Lp.userData = { v: 0, spin: 5, t: 0 }; Lp.visible = true; state.talking = false;
    const messer = story.lore.some(l => l.key === 'wald_welpe'); F.frei = { n: 0, messer, hold: 0 }; k6_hinweis('E', messer ? 'Mit Jonas’ Taschenmesser freischneiden (halten)' : 'Freiwühlen (mehrmals drücken)');
  } catch (e) { console.warn('Kapitel6: Netz', e); state.talking = false; } }
function k6_netzCam(on) { let m = K6.props.netzCam; if (!m && on) { m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.1), new THREE.MeshStandardMaterial({ map: k6_netzTex(), transparent: true, alphaTest: .35, roughness: .6, metalness: .6, side: THREE.DoubleSide, depthTest: false })); m.renderOrder = 9; camera.add(m); m.position.set(0, 0, -.32); K6.props.netzCam = m; if (!camera.parent) scene.add(camera); } if (m) m.visible = on; }
function k6_freiTick(dt) { const F = K6.falle, R = F.frei; if (R.messer) { if (keys.KeyE) { R.hold += dt; if (Math.floor(R.hold * 3) !== Math.floor((R.hold - dt) * 3)) Audio.play('scrape1', { gain: .12, rate: 1.8 }); } if (R.hold > 2.2) k6_freiDone(); }
  else if (keys.KeyE && !R.down) { R.down = true; R.n++; Audio.play('metalHit2', { gain: .1, rate: rand(1.5, 2) }); shake = .02; if (R.n >= 12) k6_freiDone(); } else if (!keys.KeyE) R.down = false; }
function k6_freiDone() { const F = K6.falle; F.frei = null; k6_hinweis(''); k6_netzCam(false); K6.netze[0].visible = false; Audio.play('metalSheet', { gain: .3, rate: 1.1 }); k6_falleEnde('ab'); }
function k6_falleEnde(weg) { K6.falleFertig = true; K6.falleWeg = weg; if (K6.falle) K6.falle.ph = 'fertig'; state.talking = false; k6_hinweis('');
  if (typeof beobachter_falle === 'function') try { beobachter_falle(weg === 'sabotage' ? 'sabotage' : weg === 'ab' ? 'ab' : 'mit'); } catch (e) {}
  if (!k6_hh('nackt_wolf') && typeof hungrige_done === 'function') hungrige_done('nackt_wolf', ''); // der Geschälte Wolf war die Falle
  K6.liste.visible = true; setTimeout(async () => { if (weg === 'sabotage' && K6.nachFunk) { await lwo_zeile('FW', K6.nachFunk); } k6_luke(weg === 'mit' ? 'Die haben Angst. Die Blechmänner haben Angst.' : 'Die fliehen. Die, die mich im Amt gejagt haben, fliehen.', 3200);
    k6_obj('Der Blutspur nach. Zur Fraßstelle.'); k6_set('frass'); k6_cp('k6_bus', 'SP6-4 · Die Trittstufe am Bus', TIEF.bus.x - 3.4, TIEF.bus.z - 2.4, -1.6); }, 2400); }
function k6_liste() { openNote('Klemmbrett · BfR · AST 7', '<span class="hand">BfR · AST 7 · Bestand · Auszug für Bergung (Blatt 3, Rest fehlt)\n\nProbe W (Projekt WENDIGO) · entwichen 13.07.1992 · Wirt Hofer · Leiter Pell (seit 1994: s. Probe W)\nProbe T · Weiher Dustwoods · nicht bergen · zieht\nBegleitvogel, beringt · nicht fangbar (beißt, klaut)\nKindersitze · 7 · im Bus · Bus: verlegt Wald (Motorschaden 2009, nie geborgen)\n\n</span><i>Handschriftlich:</i> <span class="hand">Köder: K-3. Netz 1 + 2. Bei Verlust Köder: melden, nicht bergen.</span>\n\nSEHEN · BERGEN · SCHWEIGEN', 'k6_bestand',
  () => { if (!K6.told.has('liste')) { K6.told.add('liste'); setTimeout(() => k6_luke('„Bei Verlust Köder.“ Ich steh auf einer Liste zwischen einem Teich und einem Raben.', 4200), 500); } }); }
// Sabotage über den Weiher: „Probe T zieht“ – das rote Blinken sinkt zehn Sekunden lang
function k6_weiherTick() { if (!K6.on || K6.sender !== 'jacke' || K6.weg !== 'spaeter' || K6.falleFertig || typeof TIEF === 'undefined') return; const J = TIEF.jetty; if (!k6_near(J.x1, J.z1, 1.8)) { if (K6.weiherHin) { K6.weiherHin = false; k6_hinweis(''); } return; }
  if (!K6.weiherHin) { K6.weiherHin = true; k6_hinweis('E', 'Den Sender ins Wasser werfen'); } if (keys.KeyE) { K6.weiherHin = false; k6_hinweis(''); K6.sender = 'weiher'; Audio.play('waterLoop', { gain: .2, offset: 1, dur: .6, rate: 1.2, x: J.x1 + 1, y: 0, z: J.z1 + 1 }); K6.blinkSink = 10; k6_luke('Zieh.', 1400); } }
// ---------------------------------------------------------------- UK 6 · AG-20: der tote Blechmann (bei Sabotage zwei: Posten 3-4)
function k6_ag20Tick() { if (K6.told.has('ag20')) return; const [x, z] = K6_AG20.a; if (!k6_near(x, z, 16)) return; if (!K6.ag20Auf) k6_ag20Aufbau(); if (k6_near(x, z, 5.5) && k6_frei()) k6_ag20(); }
function k6_ag20Aufbau() { K6.ag20Auf = true; if (typeof lwo_figur !== 'function') return; const put = (k, [x, z, ry], kissen) => { const B = lwo_figur(k); if (!B) return null; lwo_zeigen(B, x, z, ry); lwo_blick(B, null); lwo_lampe(B, false); if (typeof lwo_sitzen === 'function') try { lwo_sitzen(B, .36); } catch (e) {}
    const head = typeof lwo_bone === 'function' ? lwo_bone(B.obj, /Head$/i) : null; if (head && kissen) { head.add(K6.kissen); K6.kissen.position.set(0, .07, .085); K6.kissen.visible = true; } return B; };
  K6.tot = put('b4', K6_AG20.a, true); if (K6.tote > 1) { const B = put('b5', K6_AG20.b, false); if (B) { const sp = typeof lwo_bone === 'function' ? lwo_bone(B.obj, /Spine2|Spine1|Chest/i) : null; if (sp) { sp.add(K6.marke); K6.marke.position.set(.08, .1, .16); K6.marke.visible = true; } K6.tot2 = B; } } }
async function k6_ag20() { K6.told.add('ag20'); state.flashFail = Math.max(state.flashFail, .45); player.pitch = Math.max(player.pitch - .25, -.9); // er leuchtet – und senkt die Lampe sofort
  if (typeof lwo_szene === 'function') await lwo_szene('AG-20', { figuren: { funk: { x: K6_AG20.a[0], z: K6_AG20.a[1] } }, hook: async (tu) => { if (tu && tu.r && /Merkblatt/.test(tu.r)) { await k6_merkblatt(); return true; } return false; } });
  if (K6.tot2) setTimeout(() => k6_luke('Dreiundvierzig … nein. Drei-vier. Der ist alt. Der war damals schon dabei.', 3600), 800);
  K6.funkHit = K6.funkHit || box(.5, .5, .5, K6_AG20.a[0] + .35, .5, K6_AG20.a[1] + .2, hidden, { cast: false }); interact(K6.funkHit, () => K6.on && !K6.funk ? 'Das Funkgerät nehmen' : '', () => { if (K6.funk) return; K6.funk = true; story.items.push('bergungsfunk'); if (typeof lwo_ereignis === 'function') lwo_ereignis('ag20_funk'); Audio.play('static', { gain: .06, dur: .8, hp: 400 }); });
  K6.ketteHit = K6.ketteHit || box(.6, .4, .6, K6_AG20.a[0] - .6, .2, K6_AG20.a[1] + .5, hidden, { cast: false }); interact(K6.ketteHit, () => K6.on && !K6.kette ? 'Die Kettenrolle nehmen' : '', () => { if (K6.kette) return; K6.kette = true; if (typeof lwo_ereignis === 'function') lwo_ereignis('ag20_kette'); Audio.play('keys3', { gain: .25, rate: .7 }); k6_luke('Eisen. Hilft nicht. Nehm ich trotzdem.', 2400); });
  k6_obj('Die Fraßstelle. Da vorn, wo das Blut endet.'); }
// AP-24: Funkgerät am Hochsitz zurücklegen (+4 über lwo_ereignis 'funk_zurueck'); der Scan hängt danach am Pfosten (nachgeladen, kein Licht)
function k6_funkZurueck() { if (!K6.on || !k6_has('bergungsfunk') || K6.told.has('funkZurueck')) return; K6.told.add('funkZurueck'); story.items = story.items.filter(k => k !== 'bergungsfunk');
  if (typeof lwo_ereignis === 'function') lwo_ereignis('funk_zurueck'); Audio.play('static', { gain: .05, dur: .5, hp: 400 }); k6_funkModell(); k6_luke('Für die Nachsorge. Die holen es sich. Die holen sich alles.', 3200); if (typeof saveGame === 'function') saveGame(6); }
function k6_funkModell() { if (K6.props.funk || typeof TIEF === 'undefined') return; K6.props.funk = true; const H = TIEF.stand;
  msModel('w_funk', 'model.glb').then(src => { const o = msGround(msFit(src.clone(true), .24, 'max')); o.position.set(H.x + .96, 1.18, H.z - .95); o.rotation.set(0, PI + .3, .12); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); o.userData.noCol = true; K6.grp.add(o); }).catch(e => console.warn('Kapitel6: Funkgerät', e)); }
function k6_merkblatt() { return new Promise(res => openNote('BfR · Bergung · Merkblatt W', '<span class="hand">Probe W meidet Lampenlicht über 300 Lumen. Lampe nie senken.\nProbe W spricht. Nicht antworten. Es sind nicht Ihre Angehörigen.\nBei Kontakt mit dem Begleitvogel (beringt): Abbruch. Vogel nicht bergen.\nWer hört, dass er beim Namen gerufen wird, meldet sich bei der Nachsorge.</span>', 'k6_merkblatt', res)); }
// ---------------------------------------------------------------- UK 6/7 · Lager, Wrack, Beobachter, Handschuhfach
function k6_lagerFertig() { K6.lager = true; K6.jagdSeg = 2; K6.route = null; if (K6.kindF) { K6.kindF.visible = true; K6.hufe.visible = true; } k6_obj('Kleine nackte Füße im Laub, Richtung Westen. Zum Wrack.'); if (typeof saveGame === 'function') saveGame(6); }
function k6_beobFlucht() { K6.told.add('beobFlucht'); const W = TIEF.wreck; if (typeof beob_sichtung === 'function') try { beob_sichtung([W.x + 1.8, 0, W.z - 1.4], .85, { weg: [[W.x + 1.8, 0, W.z - 1.4], [W.x - 1, 0, W.z + 1.2], [W.x - 4.5, 0, W.z + 3.6]] }); } catch (e) {} // weniger als eine Sekunde, auf drei Zehen: er flieht
  if (typeof beob_still === 'function') beob_still(45); setTimeout(() => k6_denk('beobFlucht', 'Der rennt weg. Der rennt sonst nie weg.'), 1600); }
function k6_handschuhfach() { if (K6.told.has('handschuhfach')) return; K6.told.add('handschuhfach'); Audio.play('metalOpen', { gain: .2, rate: 1.2 });
  const pola = 'Ein Polaroid, verblichen, im selben weißen Rahmen wie die Bilder aus Hildes Kamera: eine Frau von hinten am Rand der Senke, langes dunkles Kleid, eine Laterne in der Hand, ein Rabe auf der Schulter.\n\nAuf der Rückseite, mit Kuli: <span class="hand">„Rand. Sie hat die Laterne genommen. Ich hab sie nicht aufgehalten. — H.“</span>';
  if (!story.lore.some(l => l.key === 'k6_polaroid_h')) story.lore.push({ key: 'k6_polaroid_h', title: 'Polaroid · „— H.“', html: pola });
  if (typeof album_abheften === 'function') try { album_abheften('k6_rand', { serie: 'Kapitel 6', notiz: 'Rand. Sie hat die Laterne genommen. — H.', datum: '2011' }); } catch (e) {}
  openNote('Im Handschuhfach', pola, null, async () => { await say([['H. Hofer. Von damals. Sie war schon mal da. Und Whiskey auch.', 4000, 'LUKE']]); if (typeof hungrige_seite === 'function') hungrige_seite(5); }); }
// ---------------------------------------------------------------- Whiskey führt (Flucht zum Lager; Epilog zum Hochsitz)
function k6_whiskeyStation() { if (typeof WHISKEY_ST === 'undefined') return; let st = null; for (const s of WHISKEY_ST) if (s.when() && !s.done()) st = s; whiskey_S.st = st; whiskey_S.left = st; } // Stationen ruhen, solange er führt
function k6_route(pts) { K6.route = pts; K6.ri = 0; K6.guideT = .5; }
function k6_routeTick() { const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; if (!K6.route || !W || !W.g || typeof whiskey_fly !== 'function') return; if (W.fl || W.mode === 'take' || W.mode === 'fly') return; k6_whiskeyStation();
  K6.guideT -= .2; if (K6.guideT > 0) return; const d = Math.hypot(player.pos.x - W.g.position.x, player.pos.z - W.g.position.z); if (d > 13 && K6.ri > 0) return;
  if (K6.ri < K6.route.length) { const [x, z] = K6.route[K6.ri++]; const y = typeof whiskey_perch === 'function' ? whiskey_perch(x, z) : 0; whiskey_fly(new THREE.Vector3(x, Math.max(y, 2.2), z), null); K6.guideT = 1.2; } else K6.route = null; }
// ---------------------------------------------------------------- A-20 · Die Jagd: das Hirschding läuft frei (zwischen Hirsch und Lager, dann vom Lager bis zum Wrack)
const K6J = { st: 'aus', p: new THREE.Vector3(), vis: new THREE.Vector3(), yaw: 0, t: 0, cool: 0, nz: null, nzT: 99, lit: 0, lurk: 0, frT: 0, ph: 0, stepT: 0, voiceT: 25, fleeT: 0, trippeln: false, kills: 0, mim: 0, gT: 0 };
function k6_ton(art, x, y, z, gain, alt) { if (typeof hungrige_ton === 'function') hungrige_ton(art, x, y, z, gain, alt); else if (alt) alt(); } // Q-1: Wendigo-Laute aus Aufnahmen
function k6_laerm(x, z, r) { if (!K6.on) return; K6J.nz = K6J.nz || new THREE.Vector3(); K6J.nz.set(x, 0, z); K6J.nzT = 0; K6J.nzR = r; } // er folgt Lärm
function k6_jagdAktiv() { if (!K6.on || K6.beat !== 'wrack' || !k6_hh('hirsch') || typeof hungrige_S === 'undefined' || !hungrige_S.dt) return false;
  if (hungrige_S.ev || hungrige_S.cine || state.talking || ui.overlay || (typeof tod_S !== 'undefined' && tod_S.dying)) return false; const P = player.pos;
  if (Math.hypot(P.x - 80.5, P.z - 233) < 17) return false; if (K6.lager && Math.hypot(P.x + 10, P.z - 204.5) < 16) return false; return typeof tief_in === 'function' && tief_in(P.x, P.z); }
function k6_jagdReset(cool) { const J = K6J; J.st = 'weg'; J.cool = cool; J.lit = 0; J.lurk = 0; if (typeof hungrige_S !== 'undefined' && hungrige_S.dt && !hungrige_S.ev && !hungrige_S.cine) hungrige_S.dt.g.visible = false; }
function k6_jagdPlatz(dist, hinten) { const P = player.pos, f = flatDir(); for (let k = 0; k < 16; k++) { const a = Math.atan2(f.x, f.z) + (hinten ? PI : 0) + rand(-1.1, 1.1), x = P.x + Math.sin(a) * dist, z = P.z + Math.cos(a) * dist;
    if (typeof tief_in === 'function' && !tief_in(x, z)) continue; if (!leben_free(x, z, .8, .7)) continue; return [x, z]; } return null; }
function k6_jagd(dt) { const J = K6J, D = typeof hungrige_S !== 'undefined' ? hungrige_S.dt : null; J.aktiv = k6_jagdAktiv();
  if (!J.aktiv) { if (J.st !== 'aus' && J.st !== 'weg' && D && !hungrige_S.ev && !hungrige_S.cine) D.g.visible = false; if (J.st === 'lauern' || J.st === 'sturm' || J.st === 'flucht') { J.st = 'weg'; J.cool = 8; } return; }
  const P = player.pos; J.t += dt; J.nzT += dt;
  if (J.st === 'aus' || J.st === 'weg') { J.cool -= dt; if (J.cool > 0) { if (D.g.visible && !hungrige_S.ev) D.g.visible = false; return; } const s = k6_jagdPlatz(38, true); if (!s) return; J.p.set(s[0], 0, s[1]); J.vis.copy(J.p); J.st = 'fern'; J.lurk = 0; }
  const dx = P.x - J.p.x, dz = P.z - J.p.z, d = Math.hypot(dx, dz) || 1, f = flatDir(), face = -(dx * f.x + dz * f.z) / d, lampe = flashOn && !K6.lampDead && FLASH.charge > .12 && state.flashFail <= 0;
  const lit = lampe && d < 18 && leben_facing(J.p.x, J.p.y + 1.7, J.p.z) > .955;
  let tx = P.x, tz = P.z, sp = 0;
  if (J.st === 'fern') { const nz = J.nz && J.nzT < 12 && Math.hypot(J.nz.x - J.p.x, J.nz.z - J.p.z) < 70; if (nz) { tx = J.nz.x; tz = J.nz.z; sp = 3.2; } else { const r = 24; tx = P.x - f.x * r; tz = P.z - f.z * r; sp = 1.5; } if (d < 23) { J.st = 'lauern'; J.lurk = 0; J.voiceT = rand(8, 14); } }
  else if (J.st === 'lauern') { J.lurk += dt; const r = 11; tx = P.x - f.x * r + f.z * 3; tz = P.z - f.z * r - f.x * 3; sp = face > .6 ? 0 : 1.3; // hinter Luke, außerhalb des Lichts; bleibt stehen, wenn Luke herschaut
    if (J.nz && J.nzT < 3) { tx = P.x; tz = P.z; sp = 3.4; } if (lit) J.lit += dt; else J.lit = Math.max(0, J.lit - dt * .5);
    if (!lampe && d < 17 && J.lurk > 2) { J.st = 'sturm'; k6_ton('ruf', J.p.x, 2, J.p.z, .9, () => Audio.crack()); } else if (J.lurk > 22 && !lampe) J.st = 'sturm';
    J.voiceT -= dt; if (J.voiceT < 0 && d < 24) { J.voiceT = rand(26, 40); k6_jagdStimme(); }
    if (!J.trippeln && K6.jagdSeg === 2 && d < 20 && J.lurk > 6) k6_trippeln(); }
  else if (J.st === 'sturm') { tx = P.x; tz = P.z; sp = d > 2 ? 3.8 : 6; if (lit) J.lit += dt * 2; if (d < 1.35) { if (!lampe) { k6_jagdTod(); return; } J.st = 'flucht'; J.fleeT = 0; shake = .08; glitchV = .5; Audio.growl(J.p.x, J.p.z, true); scareCount++; } }
  else if (J.st === 'flucht') { J.fleeT += dt; tx = J.p.x - dx; tz = J.p.z - dz; sp = 6; if (J.fleeT > 2.3) { J.st = 'weg'; J.cool = rand(20, 30); D.g.visible = false; return; } }
  if ((J.st === 'lauern' || J.st === 'sturm') && J.lit > .3) { J.st = 'flucht'; J.fleeT = 0; J.lit = 0; k6_ton('knochen', J.p.x, 1.8, J.p.z, .8, () => Audio.crack()); setTimeout(() => k6_ton('knochen', J.p.x, 1, J.p.z, .7, () => Audio.crack()), 260); k6_ton('stoehn', J.p.x, 2, J.p.z, .7, () => Audio.groan(J.p.x, J.p.z, true)); if (typeof hungrige_nebel === 'function') hungrige_nebel(J.p.x, 1.4, J.p.z, 1.2); } // Pells Dressur: vor der angehobenen Lampe weicht er rückwärts
  // Bewegung: einfaches Ausweichen um Stämme, im tiefen Wald bleiben
  if (sp > 0) { let ax = tx - J.p.x, az = tz - J.p.z; const al = Math.hypot(ax, az); if (al > .2) { ax /= al; az /= al; let ok = false; for (const turn of [0, .5, -.5, 1, -1, 1.6, -1.6]) { const c = Math.cos(turn), s = Math.sin(turn), vx = ax * c - az * s, vz = ax * s + az * c, nx = J.p.x + vx * .9, nz = J.p.z + vz * .9;
      if (leben_free(nx, nz, .8, .5) && (typeof tief_in !== 'function' || tief_in(nx, nz))) { const st = Math.min(al, sp * dt); J.p.x += vx * st; J.p.z += vz * st; ok = true; break; } } J.ph += dt * sp * 1.15; if (!ok) J.ph += dt; } }
  J.gT -= dt; if (J.gT < 0) { J.gT = .25; const sg = solidGround(J.p.x, J.p.y + .6, J.p.z); J.p.y = sg > -1 ? Math.max(0, sg) : 0; }
  J.yaw = J.st === 'flucht' ? Math.atan2(dx, dz) : leben_ang(J.yaw, Math.atan2(dx, dz), Math.min(1, dt * 2.5)); // flieht rückwärts, das Gesicht zu Luke
  // Schritte: zwei dumpfe Tritte je Schritt, dazu ein Knochenknacken; kein Atem
  if (sp > 0 && d < 16) { J.stepT -= dt * sp; if (J.stepT < 0) { J.stepT = 1.05; const x = J.p.x, z = J.p.z; k6_ton('huf', x, .1, z, .55, () => Audio.thump && Audio.thump(x, .3, z)); setTimeout(() => k6_ton('huf', x, .1, z, .3), 170); if (Math.random() < .35) k6_ton('knochen', x, 1.5, z, .18, () => Audio.play('woodCrack', { gain: .05, rate: rand(1.8, 2.4), x, y: 1.5, z, ref: 3 })); } } // zwei Tritte je Schritt (Q-1: Aufnahmen)
  // Bild: ruckend wie ein Film mit fehlenden Bildern (9 Bilder je Sekunde), nur in Lukes Nähe sichtbar – man sieht ihn fast nie
  const zeigen = (J.st === 'lauern' || J.st === 'sturm' || J.st === 'flucht') && d < 26; D.g.visible = zeigen;
  if (zeigen) { J.frT += dt; if (J.frT > 1 / 9 || (J.st === 'flucht' && !D.kr)) { J.frT = 0; J.vis.copy(J.p); } const g = D.g, m = sp > 0, sw = Math.sin(J.ph * PI);
    if (D.kr) { g.position.copy(J.vis); g.rotation.set(0, J.yaw, 0); g.scale.setScalar(1); } else { // Q-1: mit Skelett bewegt kreaturen.js Beine, Rumpf und Kopf (Clips im selben 9-Bilder-Takt)
    g.position.set(J.vis.x, J.vis.y - (m ? .05 * Math.abs(sw) : 0), J.vis.z); g.rotation.set(J.st === 'flucht' ? -.3 - .1 * Math.abs(sw) : m ? .08 : 0, J.yaw, m ? .06 * sw : (Math.sin(J.t * 5.3) > .98 ? .05 : 0));
    g.scale.set(1, J.st === 'flucht' ? .86 + .12 * Math.abs(Math.sin(J.fleeT * 26)) : 1, 1); } } }
function k6_jagdStimme() { const J = K6J, L = [['„Papa? Papa, ich bin’s.“', 'ANNI?', 'anni_j'], ['„Großer …“', 'LUCYS STIMME?', 'lucy_j'], ['„Nachtschicht, Junge. Ich muss mal raus. Ich hab Hunger.“', 'HOFER?', 'hofer_j']];
  if (K6.rief) L.push(['„Luke?“', 'DEINE STIMME?', 'luke_j']); const v = L[(J.mim++) % L.length]; if (typeof hungrige_stimme === 'function') hungrige_stimme(J.p.x, 1.9, J.p.z, v[0], v[1], 2400, v[2]); }
// A-22 · das falsche Trippeln: links das vertraute Beobachter-Trippeln – Whiskey schaut nach rechts, dort liegen drei Kiesel übereinander
function k6_trippeln() { const J = K6J; J.trippeln = true; const P = player.pos, f = flatDir(); for (let i = 0; i < 7; i++) setTimeout(() => { if (Audio.stepAt) Audio.stepAt(J.p.x + i * .15, J.p.z, .3); else Audio.play('stepG1', { gain: .14, rate: 1.9, x: J.p.x, y: 0, z: J.p.z }); }, i * 130);
  Audio.play('stones1', { gain: .1, rate: 1.8, x: J.p.x, y: .1, z: J.p.z }); const rx = P.x - f.z * 6, rz = P.z + f.x * 6;
  if (typeof beob_spur === 'function') try { beob_spur('kiesel', { pos: [rx, 0, rz] }); } catch (e) {} if (typeof whiskey_blick === 'function') whiskey_blick(rx, .2, rz, 8); }
async function k6_jagdTod() { K6J.st = 'weg'; K6J.cool = 30; K6J.kills++; if (typeof todDie === 'function') { const D = hungrige_S.dt, f = flatDir(); D.g.visible = true; D.g.position.set(player.pos.x + f.x * .9, 0, player.pos.z + f.z * .9); D.g.rotation.set(0, Math.atan2(-f.x, -f.z), 0); D.g.scale.setScalar(1); setTimeout(() => { D.g.visible = false; }, 700); await todDie('wendigo'); } }
// A-21 · Er frisst, was du gesehen hast: nach dem Tod durch ihn fehlt eine Nachbild-Seite (höchstens zwei, nie eine, die man braucht)
function k6_nachbildGefressen() { const L = story.lore.filter(l => /^echo_/.test(l.key)); if (L.filter(l => l.gefressen).length >= 2) return; const l = L.find(x => !x.gefressen); if (!l) return;
  l.gefressen = true; l.title = l.title + ' — gefressen —'; l.html = '<span style="filter:blur(1.6px);opacity:.5">' + l.html + '</span>\n\n<i>Die Schrift ist verschmiert. Die Seite hat einen halbrunden Riss.</i>'; setTimeout(() => k6_denk('gefressen', 'Da fehlt was. Ein Bild, das ich hatte. Angebissen.', 2500), 100); }
// ---------------------------------------------------------------- Epilog: Whiskey fliegt voraus, der Hochsitz, Augen zu
function k6_nachFinale(at) { K6.whAt = at ? at.clone() : null; if (K6.batFall && K6.batM) K6.batM.visible = !K6.batDa; if (typeof whiskey_S !== 'undefined' && whiskey_S.g && at) { const W = whiskey_S; W.fl = null; W.mode = 'perch'; W.g.position.copy(at); W.g.visible = true; if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', .2); } }
function k6_epilog() {
  if (K6.beat !== 'bau') return; k6_feuerzeug(false); K6.lampDead = false; flashOn = true; k6_set('epilog'); k6_obj('Whiskey fliegt voraus. Folge ihm.'); k6_jagdReset(1e9);
  if (typeof leben_uhr === 'function') try { leben_uhr(4, 50); } catch (e) {}
  if (typeof WL !== 'undefined') WL.morgen = true; K6.gi = 0; K6.guideT = 3; k6_boy(true);
  setTimeout(async () => { if (K6.epiEcho || state.talking) return; K6.epiEcho = true; await say([['„Whiskey!“', 1400, 'LUKE']]); subtitle('<i>„… Whiskey …“</i>', 1800, ''); await k6_wait(2000); k6_luke('Ein Echo. Da ist wieder ein Echo.', 2600); }, 9000); // der Wald hat wieder ein Echo – er lacht einmal kurz
  if (typeof whiskey_S === 'undefined' || !whiskey_S.g || typeof whiskey_fly !== 'function') { k6_obj('Der Hochsitz.'); k6_set('hochsitz'); }
  else if (!K6.whAt) { const W = whiskey_S, p = HUNGRIGE.pfahl; W.fl = null; W.mode = 'perch'; W.g.position.set(p.x, 2.1, p.z); W.g.visible = true; }
}
function k6_guide(dt) {
  const W = whiskey_S; if (!W || !W.g) return; k6_whiskeyStation(); if (W.fl || W.mode === 'take' || W.mode === 'fly') return; K6.guideT -= dt; if (K6.guideT > 0) return;
  const d = Math.hypot(player.pos.x - W.g.position.x, player.pos.z - W.g.position.z); if (d > 12 && K6.gi > 0) return;
  const TS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 };
  if (K6.gi < K6_WEG.length) { const [x, z] = K6_WEG[K6.gi++]; const y = typeof whiskey_perch === 'function' ? whiskey_perch(x, z) : 0; whiskey_fly(new THREE.Vector3(x, y, z), null); K6.guideT = 1; }
  else if (K6.gi === K6_WEG.length) { K6.gi++; whiskey_fly(new THREE.Vector3(TS.x + .95, 4.02, TS.z), () => { if (K6.beat === 'epilog') { k6_obj('Der Hochsitz. Oben sitzt jemand.'); k6_set('hochsitz'); } }); }
}
async function k6_boy(on) {
  const b = K6.boy; if (!b) return; b.g.visible = on; if (!on || b.P || b.loading || typeof figuren_embody !== 'function') return; b.loading = true;
  try { const P = await figuren_embody(b.g, 'luke_echt', { clip: 'idle', sit: 3.1 + .46 }); b.P = P; if (P) { P.obj.traverse(o => { if (o.isMesh) o.castShadow = true; }); if (P.mx) P.mx.stopAllAction(); } } catch (e) { console.warn('Kapitel6: Junge', e); } b.loading = false;
}
function k6_zuWarten() { return new Promise(res => { const f = () => (typeof augenzu_zu !== 'function' || augenzu_zu()) ? res() : setTimeout(f, 80); f(); }); }
async function k6_sayZu(lines) { for (const l of lines) { await k6_zuWarten(); const [t, ms, who] = l, d = Math.max(ms, readMs(trX(t))); subtitle(t, d + 250, who); await k6_wait(d); } }
function k6_tasteZu(n, ms) { return new Promise(res => { let done = false; const k = e => { const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (!m || +m[2] > n) return; if (typeof augenzu_zu === 'function' && !augenzu_zu()) return; done = true; removeEventListener('keydown', k, true); res(+m[2] - 1); };
  addEventListener('keydown', k, true); if (ms) setTimeout(() => { if (!done) { removeEventListener('keydown', k, true); res(-1); } }, ms); }); }
// SB-12 vom echten Luke vorgelesen: stockend, „Vor-hang. Vorhang.“, „Wiese“ statt „Wîse“; die vierte Zeile je nach Antwort in Kapitel 3
function k6_sb12Zeilen() { const P = typeof SAMMELN_SB !== 'undefined' ? SAMMELN_SB[11] : null, a = (typeof ch3 !== 'undefined' && (ch3.answer || ch3.choice)) || 'A';
  const L = P ? P.txt.map(t => t === '@4' ? (P.var && P.var[a]) || '' : t).filter(Boolean) : ['Luke. Ich schreib den Namen, weil ich ihn nicht sagen kann, ohne dass mir was wegbricht.'];
  return L.map(t => t.replace('Nicht hinterm Vorhang.', 'Nicht hinterm Vor-hang. … Vorhang.').replace('Wîse', 'Wiese')); }
async function k6_hochsitz() {
  K6.epiBusy = true; k6_set('oben'); state.talking = true; const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null;
  try {
    await k6_wait(800); k6_luke('Nicht hinsehen.', 2400); await k6_wait(1600);
    if (typeof augenzu_frei === 'function') augenzu_frei({ wirkt: true, hinweis: 'Q halten – Augen zu' }); else { $('fade').style.background = '#000'; await fade(1, 1200); }
    await k6_zuWarten(); await k6_wait(900);
    Audio.play('heartbeat', { gain: .1, rate: .8, dur: .9, lp: 300 }); if (W && W.g) Audio.flap(W.g.position.x, W.g.position.y, W.g.position.z);
    await k6_sayZu([['Du bist mir nachgekommen.', 2600, 'ECHTER LUKE'], ['Das hat noch keiner.', 2400, 'ECHTER LUKE']]);
    const kreis = typeof tief_has === 'function' && tief_has('tief_achter');
    const opt = [['Ich guck nicht hin. Versprochen.', [['Versprochen ist versprochen.', 2600, 'ECHTER LUKE']]],
      ...(kreis ? [['Der achte Stöckchenmann …', [['Den hab ich gemacht. Vor Jahren. Für dich. Damit du auch einen Platz hast.', 4400, 'ECHTER LUKE']]]] : []),
      ['Kommst du mit heim?', [['Wenn ich heimgeh, musst du gehen. Einer von uns ist immer übrig.', 4600, 'ECHTER LUKE'], ['Sie spielt nur mit einem Luke.', 2600, 'ECHTER LUKE']]],
      ['Hat Mama …', [['Mama schläft. Im Stall. Sie hat mir gesagt, ich soll dich nicht ansehen, sonst wird’s dir schlecht.', 4800, 'ECHTER LUKE'], ['Ich hab dich trotzdem einmal angeguckt. Bei Vegas, durchs Fenster. Du guckst wie ich, wenn ich lüg.', 5200, 'ECHTER LUKE']]]];
    let asked = 0;
    while (opt.length) { await k6_zuWarten(); K6.wahl.innerHTML = opt.map((o, i) => `<div><b>${i + 1}</b><span>„${trX(o[0])}“</span></div>`).join(''); K6.wahl.classList.add('show');
      const i = await k6_tasteZu(opt.length, asked ? 16000 : 0); K6.wahl.classList.remove('show'); if (i < 0) break;
      const [q, a] = opt.splice(i, 1)[0]; asked++; await k6_sayZu([[q, 2400, 'LUKE'], ...a]); await k6_wait(500); }
    await k6_sayZu([['Du zitterst ja.', 2200, 'ECHTER LUKE']]);
    const P = player.pos; if (typeof kino_stoff === 'function') kino_stoff(.07); else for (let i = 0; i < 3; i++) setTimeout(() => { if (typeof wl_rustle === 'function') wl_rustle(P.x + .3, P.z + .5, .9); }, i * 420); await k6_wait(1700); // Luke zieht die Jacke aus und legt sie ihm um
    await k6_sayZu([['Die ist warm.', 2200, 'ECHTER LUKE']]); await k6_wait(1800);
    await k6_sayZu([['Meine hängt an der Vogelscheuche. Jetzt hab ich deine. Gerecht.', 4400, 'ECHTER LUKE']]);
    // W-14 · SB-12: Federn, ein Landegeräusch, Papier – Whiskey legt es Luke aufs Knie; der Junge liest vor
    await k6_wait(1400); if (typeof whiskey_bringt === 'function' && W && W.g) whiskey_bringt(); else Audio.paper && Audio.paper(); await k6_wait(1600);
    await k6_sayZu([['Der Vogel hat dir was mitgebracht. Aus drinnen. Er darf da rein und raus. Ich nicht.', 4600, 'ECHTER LUKE'], ['Soll ich vorlesen? Ich kann das. Ich hab’s in der Schule gelernt, bevor …', 4200, 'ECHTER LUKE']]);
    if (typeof sammeln_sb === 'function') try { sammeln_sb(12, true); } catch (e) {}
    for (const z of k6_sb12Zeilen()) { await k6_sayZu([['<i>' + z + '</i>', Math.max(3800, z.length * 70), 'ECHTER LUKE']]); await k6_wait(700); }
    await k6_sayZu([['Da steht dein Name. Luke. Er hat dich beim Namen geschrieben.', 4200, 'ECHTER LUKE']]); await k6_wait(900); await k6_sayZu([['Meinen auch. Ist ja derselbe.', 2800, 'ECHTER LUKE']]);
    // W-15 · „Luna.“ – ganz nah an Lukes Ohr, das einzige Mal wach in ganzen Silben
    await k6_wait(1600); if (typeof whiskey_luna === 'function') whiskey_luna(); await k6_wait(2600);
    await k6_sayZu([['Das sagt er manchmal. Drinnen. Dann geht sie hin und guckt, und er ist schon weg.', 4800, 'ECHTER LUKE']]);
    await k6_wait(1200); $('fade').style.background = '#000'; await fade(1, 900);
  } catch (e) { console.error('Kapitel6: Hochsitz', e); }
  if (typeof augenzu_sperre === 'function') augenzu_sperre(); state.talking = false; K6.wahl.classList.remove('show');
  await k6_ende();
}
// ---------------------------------------------------------------- Abspann „Gleich wieder da“ (80 s, über kino.js) und Endkarte
function k6_kinoDef() { if (typeof kino_def !== 'function' || K6.kinoDef) return; K6.kinoDef = true;
  const TS = typeof TIEF !== 'undefined' ? TIEF.stand : { x: 14, z: 178.5 }, stufe = typeof lwo_stufe === 'function' ? lwo_stufe() : 'mittel', ab = K6.weg === 'ab', V = (x, y, z) => new THREE.Vector3(x, y, z);
  const fb = k6_papier(.3, .21, 0, -40, 0, 0, 0, 0xe4dcc6); fb.material.map = k6_tex(512, 360, (g, w, h) => { g.fillStyle = '#e6decb'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2622'; g.font = '19px "Courier New"';
    g.fillText('28.07.2009 · 23:40 · Verschwunden: 7', 24, 60); g.fillText('05.08.2009 · 03:13 · Rückgeführt: 6 · Offen: 1', 24, 96); g.fillText('Gez. Dr. T. Seiler', 24, 132); g.font = 'italic 24px "Caveat", cursive'; g.fillStyle = '#4a4540';
    g.fillText('Drei Uhr dreizehn. Sie kommt noch.', 40, 190); g.fillStyle = '#58575a'; g.font = '22px "Courier New"'; g.fillText('Offen: 1. Und einer, der es nie war.', 44, 262); });
  fb.material.needsUpdate = true; fb.visible = false; K6.fbM = fb;
  kino_def('k6', [
    { black: true, dur: 8, lines: [['Du machst die Augen erst auf, als du unten bist.', '', 1.2, 6200]],
      sfx: [[() => Audio.play('woodSqueak1', { gain: .2, rate: .9 }), .4], [() => kino_atem(.06, 1.25), 1.6], [() => Audio.play('woodSqueak1', { gain: .16, rate: 1.05 }), 2.4], [() => Audio.flap && Audio.flap(kino_S.sv.pos.x + .5, 4, kino_S.sv.pos.z), 3.4], [() => kino_atem(.05, 1.25), 4.8], [() => Audio.play('woodSqueak2', { gain: .15, rate: .95 }), 6.2]] },
    { from: [14, 1.2, 175], to: [16.2, 4, 176.2], look: [14.1, 3.5, 178.5], lookTo: [14.15, 3.8, 178.8], dur: 8, fov: 46, env: 'dawn', fadeIn: 1400,
      setup() { kino_fig('echt', TS.x + .15, 3.1, TS.z + .42, 0, 'idle', { sit: 3.56 }); const j = kino_show('jacke', TS.x + .15, 3.62, TS.z + .32, 0); if (j) j.rotation.set(-.15, 0, 0); kino_rabeSitz(TS.x + .95, 4.02, TS.z, -PI / 2); },
      sfx: [[() => kino_vogel(6, 8, 184), 2], [() => kino_vogel(24, 9, 170, 4), 5.5]] },
    { from: [12.6, .9, 172.5], to: [12.4, 1, 172.2], look: [TS.x + .95, 4.2, TS.z], dur: 6, fov: 38, env: 'dawn',
      setup() { kino_rabeSitz(TS.x + .95, 4.02, TS.z, -PI / 2); }, sfx: [[() => { const R = kino_S.rabe; if (R) { Audio.flap(R.g.position.x, 4, R.g.position.z); kino_rabeFly(R.g.position.clone(), V(-70, 26, 168), 5); } }, 1.2]] }, // Whiskey fliegt nach Westen zur Senke und kommt nicht zurück
    { from: [14, 21, 180], to: [13.4, 21.4, 178.8], look: [-8, 3, 60], dur: 8, fov: 42, env: 'haze',
      setup() { kino_lamps(L => { L._m = L.mode; L.mode = 'on'; }); kino_S.k6i = 0; kino_hide('rabe'); kino_figOff('echt'); kino_hide('jacke'); },
      tick(k, t) { const n = Math.floor((t - 1.5) / .7); if (typeof lamps !== 'undefined') while (kino_S.k6i < Math.min(n, lamps.length)) lamps[kino_S.k6i++].mode = 'off'; }, sfx: [[() => kino_vogel(8, 9, 186), .8], [() => kino_vogel(22, 10, 172, 4), 3], [() => Audio.owl && Audio.owl(30, 150), 5.4]] },
    { from: [-12.2, 1.45, 205.9], to: [-12.35, 1.42, 206.1], look: [-13.9, 1.4, 207.6], dur: 6, fov: 40, env: 'dawn',
      setup(sh) { const H = typeof hungrige_S !== 'undefined' ? hungrige_S : null; sh.sk = H && H.skull; if (sh.sk) sh.sk.visible = false; }, teardown(sh) { if (sh.sk) sh.sk.visible = true; },
      lines: [['„Gleich wieder da.“', 'ANNI?', 3.4, 2600]], sfx: [[() => Audio.deerBark && Audio.deerBark(-4, 214), 1.4], [() => Audio.whisper(-40, 1.5, 230, 1.2), 3.3]] },
    { from: [0, -39.62, .42], to: [0, -39.66, .36], look: [0, -40, 0], dur: 8, fov: 34, // Fahrtenbuch am Armaturenbrett: die neue Zeile, frisch mit Bleistift; daneben dampft ein Thermosbecher
      setup() { K6.fbM.position.set(0, -40, 0); K6.fbM.rotation.set(-PI / 2 + .35, 0, 0); K6.fbM.visible = true; kino_S.lit[0] = kino_S.litFB || (kino_S.litFB = { p: kino_V(.2, -39.4, .3), c: 0xcfd6e6, d: 3, i: 1.4 }); }, teardown() { K6.fbM.visible = false; } },
    { from: [30.6, 1.62, 93.2], to: [30.6, 1.6, 93.6], look: [30.4, 1.4, 104], dur: 10, fov: 40, env: 'dawn', // Waldrand am Nordzaun: Nachsorge 12 winkt, der Kopf dreht sich weiter, als ein Kopf sich dreht
      setup(sh) { const N = typeof lwo_figur === 'function' ? lwo_figur('n12') : null; sh.N = N; if (N) { lwo_zeigen(N, 30.8, 103.5, PI); lwo_blick(N, null); lwo_clip(N, 'look'); sh.head = typeof lwo_bone === 'function' ? lwo_bone(N.obj, /Head$/i) : null; }
        if (ab && K6.props.tasche === undefined) {} if (ab) { const z = k6_papier(.15, .2, 30.2, 1.2, 97.8, 0, PI); sh.zettel = z; } },
      tick(k, t, dt, sh) { if (sh.head && t > 3.5) sh.head.rotateY(Math.min(2.6, (t - 3.5) * .55)); if (sh.N && stufe === 'mittel' && t > 7) sh.N.g.position.z += dt * .6; }, // der LWO-Takt setzt den Kopf jedes Bild neu: die Drehung ist absolut
      lines: stufe === 'miserabel' ? [['„Freitag frei.“', '', 6.5, 2200]] : [], sfx: [[() => Audio.play('paper1', { gain: .1, rate: 1.2, x: 30.8, y: 1.2, z: 103.5 }), 2.5]],
      teardown(sh) { if (sh.N) lwo_weg(sh.N); if (sh.zettel) sh.zettel.visible = false; } },
    { from: [42.3, 1.55, 155.6], to: [42.2, 1.5, 155.4], look: [42.1, 0, 154.2], dur: 6, fov: 44, env: 'dawn', // am eingedrückten Zaun, Blick nach unten: B-K6-07 hinter Lukes Füßen
      setup() { if (typeof beobachter_zettel === 'function') try { beobachter_zettel('b_k6_07', { pos: [42.1, .05, 154.3] }); } catch (e) {} },
      sfx: [[() => Audio.paper && Audio.paper(), 1.2], [() => { for (let i = 0; i < 6; i++) setTimeout(() => Audio.stepAt ? Audio.stepAt(40 - i * .4, 152 - i * .3, .25) : null, i * 140); }, 2.6]] },
    { from: [96, 1.3, -6], to: [120, 1.3, -6], look: [118, 1, -2], lookTo: [140, 1, -2], dur: 8, fov: 40, env: 'dawn', // der graue Kombi auf der Landstraße – Wolter, zu niemandem
      setup(sh) { if (typeof lwo_kombiZeigen === 'function') { lwo_kombiZeigen(104, -2, PI / 2, { motor: true }); sh.k = true; } }, tick(k, t, dt, sh) { const K = typeof lwo_kombi === 'function' ? lwo_kombi() : null; if (K && sh.k) K.g.position.x = 104 + t * 4.2; },
      lines: [['„Es hat nie gegen das Licht gewirkt. Das ist bedauerlich.“', 'WOLTER', 2.2, 4200]], teardown(sh) { if (sh.k && typeof lwo_kombiWeg === 'function') lwo_kombiWeg(); } },
    { from: [-25, 1.32, -9.6], to: [-25, 1.3, -10.1], look: [-25, 1.08, -12.2], dur: 8, fov: 36, env: 'dawn', // Nr. 3 durchs Fenster: Hänschen auf der Fensterbank sieht genau in die Kamera
      setup() { if (typeof katzen_kater5 === 'function') try { katzen_kater5('vegas', { x: -25, y: .98, z: -12.02, ry: 0 }); } catch (e) {} kino_S.lit[0] = kino_S.litV || (kino_S.litV = { p: kino_V(-25, 1.6, -13.4), c: 0xffc98a, d: 5, i: 1.8 }); },
      sfx: [[() => kino_atem(.05, .55, -25.5, 1, -13.5), 1.5], [() => Audio.play('static', { gain: .05, dur: .6, hp: 400 }), 4.2], [() => kino_atem(.05, .55, -25.5, 1, -13.5), 5.4]] },
    { black: true, dur: 4, fadeOut: 1400, setup() { kino_still(true, 2); } },
  ], { name: 'Gleich wieder da', skipAfter: 3, done() { kino_lamps(L => { if (L._m !== undefined) { L.mode = L._m; delete L._m; } }); kino_figOff('echt'); if (K6.fbM) K6.fbM.visible = false; } });
}
async function k6_ende() {
  k6_set('ende'); if (typeof hungrige_S !== 'undefined') hungrige_S.epilog = true;
  if (!story.lore.some(l => l.key === 'k6_hochsitz')) story.lore.push({ key: 'k6_hochsitz', title: 'Kapitel 6 · Die ist warm', html: 'Oben auf dem Hochsitz schläft ein Junge mit deinem Namen. Du hast ihn nicht angesehen.\n\nDeine Jacke hat er jetzt. Seine hängt an der Vogelscheuche.' });
  try { saveGame(6); } catch (e) {}
  if (typeof kino_play === 'function') { if (K6.boy) K6.boy.g.visible = false; try { k6_kinoDef(); if (typeof kino_preload === 'function') await kino_preload('k6'); await kino_play('k6'); } catch (e) { console.error('Kino k6', e); } } else { $('fade').style.background = '#000'; await fade(1, 1200); await k6_wait(1500); }
  if (typeof kapEnde === 'function') { try { kapEnde(6); } catch (e) { console.error('kapEnde(6)', e); } }
  const ec = $('endcard'); state.ending = true; state.talking = false;
  ec.querySelector('h1').textContent = 'KAPITEL 6 · WENDIGO · ENDE'; // Fassung 3, wortgleich
  ec.querySelector('p').innerHTML = 'Er ist nicht tot. Er weiß jetzt, wem der Rabe gehört.<br>Auf dem Hochsitz schläft ein Junge in deiner Jacke. Du hast ihn nicht angesehen.<br>Der Rabe ist nach Westen geflogen.<br>Am Samstag kommt Jonas.';
  const E = typeof lwo_kapitelende === 'function' ? lwo_kapitelende(6) : null, zettel = typeof beob_S !== 'undefined' ? beob_S.given.size : 0, fotos = story.photos ? story.photos.size : 0;
  $('endStats').innerHTML = `FOTOS ${fotos} · FUNDE ${story.lore.length} · ZETTEL ${zettel}` + (E && E.zeile ? `<br><span style="opacity:.7;font-style:italic">${E.zeile}</span>` : '');
  ec.querySelector('.next').textContent = 'HIGH ABYSS MIRA · FORTSETZUNG FOLGT';
  const b4 = ec.querySelector('.go4'); if (b4) b4.style.display = 'none';
  const go = ec.querySelector('.go'); go.style.display = ''; go.textContent = 'ZUM TITEL'; go.onclick = e => { e.stopPropagation(); location.reload(); };
  document.exitPointerLock(); ui.overlay = 'endcard'; ec.classList.add('show'); document.body.classList.add('ov'); $('fade').style.opacity = 0;
}
// ---------------------------------------------------------------- Start
function k6_welt(laden) {
  // Kapitel 3 (Ort nach Ende B) und 4 herstellen – chapter3Begin speichert Kapitel 3: beim Weiterspielen den Spielstand nicht überschreiben
  const sg = saveGame; if (laden) saveGame = () => {}; try { if (typeof chapter3Begin === 'function') chapter3Begin(); } finally { saveGame = sg; }
  ch3.met = true; ch3.part = 'town'; ch3.lampsOff = true; ch3.chase = 'done'; if (!ch3.choice) ch3.choice = 'B'; hunt.on = false; grey.visible = false; if (justin && justin.g) justin.g.visible = false;
  state.zone = null; state.ending = false; try { canalAtmo(false); } catch (e) {} Audio.hum(false); Audio.chaseMusic(false); Audio.setArea(false, false);
  lamps.forEach(L => { L.mode = 'on'; L.dead = 0; }); if (typeof anwesen_S !== 'undefined') anwesen_S.ch4 = true;
  if (typeof feuer_items === 'function') feuer_items(); if (ITEMS.feuerzeug && !story.items.includes('feuerzeug')) story.items.push('feuerzeug'); // Peters Feuerzeug (Kapitel 2)
  const kerze = Object.keys(ITEMS).find(k => /kerze/i.test(k)); if (kerze && !story.items.includes(kerze)) story.items.push(kerze); // Mamas Kerze (Kapitel 5, falls vorhanden)
  if (!laden) { FLASH.charge = Math.max(FLASH.charge ?? 1, .9); FLASH.spare = Math.max(FLASH.spare || 0, 3); try { flashApply(); } catch (e) {} } // „die Lampe, drei Batterien“
  if (typeof sammeln_platz === 'function' && !K6.sb11Platz) { K6.sb11Platz = true; try { sammeln_platz('SB-11', { x: 14, y: 3.78, z: 179.41, ry: PI, stehend: true, ab: 6, label: 'Eine Seite, an einen Nagel gespießt' }); } catch (e) { console.warn('Kapitel6: SB-11', e); } }
  if (typeof katzen_kater5 === 'function' && !k6_ab('krumen')) try { katzen_kater5('gitter', { x: 30.4, z: 95.9, ry: 0, punkt: [26.6, .3, 99.2] }); } catch (e) {} // Hänschen: zwei Meter vor dem Gitter, keinen Schritt weiter
}
function k6_reset() { K6.beat = 'gitter'; K6.sp.clear(); K6.told.clear(); K6.eaten = false; K6.gi = 0; K6.ag18 = false; K6.weg = null; K6.v11 = false; K6.flasche = 0; K6.falleAn = false; K6.falleFertig = false; K6.falleWeg = null; K6.sab = null; K6.tote = 1; K6.lager = false; K6.lagerT = 0; K6.rief = false; K6.cp = null; K6.jagdSeg = 0; K6.batFall = false; K6.batDa = false;
  K6.variante = typeof lwo_senderVariante === 'function' ? lwo_senderVariante() : 'B'; K6.sender = K6.variante === 'C' ? 'wolter' : 'jacke';
  for (const c of K6.krumen) c.gone = false; for (const im of K6.krIM) { K6.krM.forEach((m, i) => im.setMatrixAt(i, m)); im.instanceMatrix.needsUpdate = true; } if (K6.flascheM) { K6.flascheM.visible = true; interact(K6.flascheHit, () => K6.on && !K6.flasche ? 'Eine Pfandflasche' : '', () => k6_flascheNehmen()); } k6_jagdReset(0); K6J.st = 'aus'; }
async function startChapter6() {
  $('subPanel').classList.remove('show'); $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov');
  menu.attract = false; state.started = true; document.body.classList.remove('menu'); $('start').classList.remove('show');
  const laden = typeof KAP !== 'undefined' && KAP.laden;
  K6.on = true; if (typeof wald_S !== 'undefined') wald_S.k6 = true;
  if (!laden || !K6.beat) k6_reset(); k6_welt(laden); if (laden) k6_resumeWelt();
  if (typeof kapStart === 'function') kapStart(6); else { setChapter(6); saveFlag('ch6'); if (!laden) saveGame(6); }
  if (!laden || K6.beat === 'gitter') { player.pos.set(30, 0, 91.5); player.yaw = PI; } player.pitch = 0; vel.set(0, 0, 0); camY = 1.65; flashOn = true; // Blick nach Norden, aufs Gitter
  if (typeof hungrige_prep === 'function') hungrige_prep().catch(e => console.warn('Kapitel6: Vorbereitung', e));
  $('fade').style.background = '#000'; $('fade').style.opacity = 1; await wait(300);
  $('intro').innerHTML = K6_INTRO; $('introSeq').classList.add('show'); $('fade').style.opacity = 0;
  $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; lockPointer();
    if (K6.beat === 'gitter') { k6_obj('Hinter dem Gitter ist der Junge. Aber erst: wer parkt da hinter dir?'); k6_cp('k6_gitter', 'SP6-1 · Das Absperrgitter', 30, 91.5, PI); k6_start1(); } };
}
async function k6_start1() { // Whiskey still auf dem Gitter; der Kiesel links, Hänschen starrt dorthin; dann die Scheinwerfer
  await k6_wait(1800); await say([['Du sagst gar nichts. Das ist neu. Das gefällt mir nicht.', 3400, 'LUKE']]);
  Audio.play('stones1', { gain: .12, rate: 1.7, x: 26.6, y: .1, z: 99.2, ref: 3 }); await k6_wait(2600);
  if (!K6.told.has('kater')) { K6.told.add('kater'); k6_luke('Okay. Verstanden. Du bleibst hier und hältst den Spielplatz.', 3200); } await k6_wait(3600); k6_ag18(); }
// Weiterspielen: Welt passend zum gespeicherten Beat (Gitter offen, gefressene Krumen, der Junge oben)
function k6_resumeWelt() {
  const D = typeof gruen_S !== 'undefined' && gruen_S.dustBarrier; if (D && k6_ab('krumen')) D.setOpen(1);
  for (const c of K6.krumen) if (K6.eaten || c.gone) { c.gone = false; k6_krumeWeg(c); } if (K6.flasche && K6.flascheM) K6.flascheM.visible = false;
  if (K6.beat === 'oben' || K6.beat === 'ende') K6.beat = 'hochsitz'; if (K6.beat === 'epilog') K6.beat = 'hochsitz'; // Whiskey wartet schon oben
  if (K6.beat === 'falle' && !K6.falleFertig) { K6.falleAn = false; K6.beat = 'faden'; } // die Falle beginnt beim nächsten Nähern neu
  if (K6.lager && K6.kindF) { K6.kindF.visible = true; K6.hufe.visible = true; } if (K6.falleFertig) K6.liste.visible = true;
  if (story.lwo) story.lwo.ag18 = K6.weg; if (K6.told.has('funkZurueck')) k6_funkModell(); // AP-24
  if (k6_ab('epilog')) { k6_boy(true); if (typeof WL !== 'undefined') WL.morgen = true; if (typeof whiskey_S !== 'undefined' && whiskey_S.g) { const TS = TIEF.stand; whiskey_S.fl = null; whiskey_S.mode = 'perch'; whiskey_S.g.visible = true; whiskey_S.g.position.set(TS.x + .95, 4.02, TS.z); } }
}
MOD_SAVE.push(['kapitel6', () => ({ on: K6.on, beat: K6.beat, sp: [...K6.sp], told: [...K6.told], eaten: K6.eaten, gone: K6.krumen.map((c, i) => c.gone ? i : -1).filter(i => i >= 0),
    weg: K6.weg, variante: K6.variante, sender: K6.sender, v11: K6.v11, flasche: K6.flasche, ag18: K6.ag18, falleFertig: K6.falleFertig, falleWeg: K6.falleWeg, tote: K6.tote, lager: K6.lager, rief: K6.rief, cp: K6.cp, batFall: K6.batFall, batDa: K6.batDa, kills: K6J.kills }),
  v => { K6.on = false; K6.beat = v.beat || ''; K6.sp = new Set(v.sp || []); K6.told = new Set(v.told || []); K6.eaten = !!v.eaten; (v.gone || []).forEach(i => { if (K6.krumen[i]) K6.krumen[i].gone = true; }); K6.lampDead = false;
    K6.weg = v.weg || null; K6.variante = v.variante || 'B'; K6.sender = v.sender || 'jacke'; K6.v11 = !!v.v11; K6.flasche = +v.flasche || 0; K6.ag18 = !!v.ag18 || k6_ab('krumen'); K6.falleFertig = !!v.falleFertig; K6.falleWeg = v.falleWeg || null; K6.falleAn = K6.falleFertig;
    K6.tote = +v.tote || 1; K6.lager = !!v.lager; K6.rief = !!v.rief; K6.cp = v.cp || null; K6.batFall = !!v.batFall; K6.batDa = !!v.batDa; K6J.kills = +v.kills || 0; K6.jagdSeg = K6.lager ? 2 : 1; }]);
if (typeof CH_RESUME !== 'undefined') CH_RESUME.push((d, at) => { if (d.chapter !== 6 || !K6.on) return; const C = K6.cp;
  if (k6_ab('epilog')) { const TS = TIEF.stand; player.pos.set(TS.x, 0, TS.z - 4); player.yaw = PI; } else if (C && K6.beat !== 'gitter') { player.pos.set(C.x, 0, C.z); player.yaw = C.yaw; } // am letzten Speicherpunkt, Blick in die richtige Richtung
  if (K6.cp && typeof todCheckpoint === 'function') todCheckpoint(K6.cp.id, 'Weiter', { x: K6.cp.x, y: 0, z: K6.cp.z, yaw: K6.cp.yaw, respawn: async () => k6_wiederkehr(), quiet: true });
  if (K6.beat === 'gitter' && !K6.ag18) setTimeout(() => k6_start1(), 1200); if (d.obj) K6.obj = d.obj; });
// ---------------------------------------------------------------- Takt
WORLD_TICK.push((dt, t) => {
  if (!K6.ready) return; const on = K6.on && state.started && !menu.attract;
  if (K6.grp.visible !== on) K6.grp.visible = on;
  k6_gitter(dt); if (!on) return;
  k6_lighterTick(dt, t); k6_stille(dt); k6_sperre(); k6_jagd(dt); k6_weiherTick();
  if (K6.justinT > 0) K6.justinT -= dt;
  if (K6.flasche === 1 && K6.flascheT >= 0 && !K6.told.has('bkr')) { K6.flascheT += dt; if (K6.flascheT > 120 && k6_frei()) { K6.told.add('bkr'); if (typeof beobachter_zettel === 'function') try { const f = flatDir(); beobachter_zettel('b_k6_03', { pos: [player.pos.x - f.x * 1.3, .05, player.pos.z - f.z * 1.3] }); } catch (e) {} } } // B-K6-03 „Bin ich reich“
  if (K6.flasche === 1 && K6.inZ && Math.hypot(vel.x, vel.z) > 3.5) k6_flascheKlirr(); if (Math.hypot(vel.x, vel.z) > 4.6 && K6.beat === 'wrack') k6_laerm(player.pos.x, player.pos.z, 30); // Rennen ist Lärm
  if (K6.falle && (K6.falle.ph !== 'fertig' || K6.lampe.visible)) k6_falleTick(dt); // jedes Bild: Wolf, Netze, gefallene Lampe
  K6.saveT -= dt; if (K6.saveT < 0) { K6.saveT = .2; if (!ui.overlay && !state.ending) k6_beats(.2); }
});
window.__k6 = { S: K6, J: K6J, ev: s => eval(s), start: () => startChapter6(), set: b => { K6.beat = b; }, epilog: () => k6_epilog(), hochsitz: () => k6_hochsitz(), ende: () => k6_ende(), lampe: () => k6_lampeStirbt(), feuerzeug: on => k6_feuerzeug(on), boy: on => k6_boy(on),
  ag18: () => k6_ag18(), falle: () => k6_falleStart(), zu: () => k6_falleZu(), ag20: () => { k6_ag20Aufbau(); return k6_ag20(); }, lager: () => k6_lagerFertig(), jagd: () => { K6.beat = 'wrack'; K6J.st = 'weg'; K6J.cool = 0; }, tod: () => k6_jagdTod(),
  kino: () => { k6_kinoDef(); return kino_play('k6'); }, D: () => typeof gruen_S !== 'undefined' && gruen_S.dustBarrier, SP: () => typeof SP !== 'undefined' ? SP : null, wh: () => whiskey_S.g, whFl: () => !!whiskey_S.fl }; // Testzugriff
