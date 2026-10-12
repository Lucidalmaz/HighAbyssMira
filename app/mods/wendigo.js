// =====================================================================  WENDIGO (Modul „wendigo“, Folgeauftrag 8) – Präsenz, Vorboten und Formen in Kapitel 1–5
// Stand 12.10.2026 (Integrationslauf): eingetragen in tools/assemble.js (nach 'kreaturen'), im Spiel gemessen. Konzept, Kanon, Texte: docs/gameplay/wendigo_konzept.md; Ergebnis: wendigo_integration.md.
//
// Leitbild (Autor/Nutzer 10.10.): Er ist DAUERHAFT als Bedrohung da, ohne dass der Spieler weiß, dass er es ist; Spiegelbild des Beobachters (nett: Zettel/Spuren – böse: Fraß/Laut/Form);
// nie aufdringlich. Darum zwei Schichten:
//  · Präsenz (wd_praesenz): leise, seltene Laute am Rand (Hufe im Metronomtakt, Knochen, Schnüffeln), danach schweigt der Beobachter – kein Bild, nie ein Text.
//  · Auftritte (WD_AUFTRITTE, 14 Ereignisse): Ton, Spur, Kadaver, Form, Mensch im Fenster; je höchstens einmal, Regie über spannung_can/did, nie in Dialog/Kino/Jagd/Trauer.
// Verhalten (§5 des Konzepts): schlaf → beobachten → rueckzug → schlaf; „still“-Formen bewegen sich nur, wenn Luke nicht hinsieht (Weeping); der Kopf dreht in Rasten (anim_ueber, nie
// aufaddiert), der Körper nur außerhalb des Bildes; Gehen mit Wegtempo = Schrittlänge des Clips (kein Gleiten); ab Kapitel 6 passiv ('k6'): hungrige.js/kapitel6.js führen.
// Der Wendigo wird nie benannt (Kanon: erst Hofer Seite 1), spricht in Kap. 1–5 nicht, hinterlässt Verluste statt Schäden. Alle Zugriffe auf andere Module sind `typeof`-geprüft.

const WD_PARAM = {
  gap: [0, [360, 540], [300, 480], [300, 420], [300, 420], [240, 360]],  // Abstand zwischen Auftritten je Kapitel (s Spielzeit, ruhig)
  max: [0, 3, 3, 2, 3, 6],                                                // Höchstzahl Auftritte je Kapitel
  start: [0, 420, 240, 240, 200, 160],                                    // frühestens nach s im Kapitel
  praesenz: [0, [170, 260], [150, 240], [150, 230], [130, 200], [110, 170]], // Abstand der leisen Präsenz-Laute (s)
  seeMin: .6, seeMax: 2.0, litThr: .965, viewThr: .88, litDist: 26, nearHide: 12, ruhe: 90,
  dist: { reh: [22, 35], hirsch: [35, 45], hirschding: [26, 42], fleisch: [10, 20] },
  schritt: { reh: 1.037, fleisch: 1.037, haut: 1.037, hirsch: 1.145, hirschding: 1.2 },   // m/s: Wurzelbewegung des Geh-Clips (Reh 1,079 m / 1,04 s, Hirsch 1,193 m / 1,04 s, Hirschding Meta 1,2; gemessen) – mit diesem Tempo gleitet nichts
};
const WENDIGO_TEXTE = {   // fertige Zeilen (Konzept §4); Ziel: gedanke(id, …) bzw. story.lore
  g_hall: 'Ich hab gerufen. Der Wald hat es behalten.',
  g_fell: 'Das ist kein Wild, das hängen bleibt. Das hat sich ausgezogen.',
  g_mast: 'Zwei Masten. Eben war es nur einer.',
  g_schacht: 'Hier unten hallt nichts. Das ist nicht der Beton.',
  g_band: 'Es holt keine Luft. Ein Mensch holt Luft, auch auf Band.',
  g_reh: 'Es geht rückwärts, als wüsste es nicht, wo vorn ist.',
  g_fenster: 'Der Körper steht, der Kopf kommt hinterher. Kein Mensch dreht so.',
  g_spur: 'Zwei Hufe neben meinen Schuhen. Jemand ist mit mir gegangen.',
  g_aas: 'Das hat probiert und aufgehört. Nicht satt. Enttäuscht.',
  g_nebel: 'Es bewegt sich nur, wenn ich weggucke. Das hat Wartezeit gelernt.',
  g_kratz: 'Zwei dreißig. Das kratzt nicht, um reinzukommen. Das zählt die Höhe.',
  g_gitter: 'Whiskey schaut hin und sagt nichts. Der Rabe hat Respekt, wie vor einem Hausmeister.',
  g_kinder: 'Es führt mich irgendwohin. Es will nicht mich. Es will, was ich finde.',
  t_band: '„… Station Nord, Seiler, Probe liegt am Rand, ich wiederhole …“',
  lore: {
    wd_haut: ['Fund am Zaun', 'Nasses Fell, rot, an der Pfostenspitze. Darunter zwei Hufspuren hintereinander, als ginge etwas aufrecht. Die Spur endet am Zaun und fängt dahinter nicht wieder an.'],
    wd_bestand: ['Bestandsliste, durchgestrichen', 'BESTAND · Probe W · entwichen 13.07.1992 · Wirt: Hofer · Leiter: Pell (seit 1994: s. Probe W)'],
    wd_futter: ['Fütterungsprotokoll, Zelle W', 'Tag 1 Hirsch. Tag 3 Hund. Tag 8: Licht. Tag 9: „Es nimmt, was nicht mehr hinsieht.“ – R. P.'],
    wd_spur: ['Spuren im Beet', 'Gespaltene Hufe, immer nur zwei, in einer Linie. Sie laufen neben meinen und hören dort auf, wo ich stehen geblieben bin.'],
    wd_reihe: ['Der Wald im Dorf', 'Ich habe nichts gesehen, was ich einen Namen nennen würde. Ein Reh, das falsch geht. Ein Hirsch im Nebel, der wartet. Ein Kratzen in zwei Metern Höhe. Alles hat dieselbe Geduld.'],
  },
};
// Ereignisse: id, Kapitel, Art (ton | form | spur | kadaver | text | fenster), Form, Bedingung (nur Ort/Zeit; Ruhe prüft die Regie), Abhängigkeit
const WD_AUFTRITTE = [
  { id: 'k1_hall', k: 1, art: 'ton', cond: () => wd_aussen() && wd_von(29, -9, 25), gedanke: 'g_hall' },
  { id: 'k1_fell', k: 1, art: 'spur', was: 'haut', cond: () => wd_aussen(), lore: 'wd_haut', gedanke: 'g_fell', nach: ['k1_hall'] },
  { id: 'k1_mast', k: 1, art: 'form', form: 'hirschding', mast: true, still: true, dunkel: true, nacht: true, cond: () => wd_aussen() && !state.outage, gedanke: 'g_mast', nach: ['k1_fell'] },
  { id: 'k2_bestand', k: 2, art: 'text', cond: () => wd_amtX(19, 60), lore: 'wd_bestand' },
  { id: 'k2_futter', k: 2, art: 'text', cond: () => wd_amtX(60, 1e9), lore: 'wd_futter', nach: ['k2_bestand'] },
  { id: 'k2_schacht', k: 2, art: 'text', cond: () => wd_amtX(60, 1e9), gedanke: 'g_schacht', nach: ['k2_futter'] },
  { id: 'k3_funk', k: 3, art: 'ton', cond: () => true, gedanke: 'g_band', nur: 'hook' },
  { id: 'k3_reh', k: 3, art: 'form', form: 'reh', rueck: true, cond: () => wd_aussen(), gedanke: 'g_reh' },
  { id: 'k4_fenster', k: 4, art: 'fenster', cond: () => wd_aussen() && !!wd_fensterWahl(9, 26), gedanke: 'g_fenster' },
  { id: 'k4_spur', k: 4, art: 'spur', was: 'huf_neben', cond: () => wd_aussen(), lore: 'wd_spur', gedanke: 'g_spur' },
  { id: 'k4_aas', k: 4, art: 'kadaver', cond: () => wd_aussen(), gedanke: 'g_aas', nach: ['k4_spur'] },
  { id: 'k5_nebel', k: 5, art: 'form', form: 'hirsch', still: true, nacht: true, cond: () => wd_aussen(), gedanke: 'g_nebel', mal: 2 },
  { id: 'k5_kratz', k: 5, art: 'spur', was: 'kratz', cond: () => wd_aussen(), gedanke: 'g_kratz', nach: ['k5_nebel'] },
  { id: 'k5_stehen', k: 5, art: 'form', form: 'hirschding', mast: true, still: true, dunkel: true, nacht: true, cond: () => wd_aussen(), gedanke: 'g_gitter', nach: ['k5_kratz'] },
  { id: 'k5_blut', k: 5, art: 'kadaver', gross: true, cond: () => wd_aussen(), gedanke: 'g_kinder', lore: 'wd_reihe', nach: ['k5_stehen'], blutdurst: true },
];
const wd_S = { ready: false, mode: 'schlaf', done: new Set(), n: {}, wissen: 0, t: 0, kT: 0, k: 0, next: 0, ruheBis: 0, A: null, ev: null, models: {}, loading: {}, dec: [], trail: [], trailT: 0, praeT: 0, praeN: 0,
  log: [], stat: { auftritte: 0, gesehen: 0, rueckzug: 0, spuren: 0, kadaver: 0, hart: 0, praesenz: 0 }, seenT: 0, lastPos: new THREE.Vector3(), v: 0, litT: 0, tmp: new THREE.Vector3() };
MOD_SAVE.push(['wendigo', () => ({ done: [...wd_S.done], n: wd_S.n, wissen: wd_S.wissen }),
  v => { if (!v || typeof v !== 'object') return; (v.done || []).forEach(k => wd_S.done.add(k)); wd_S.n = v.n || {}; wd_S.wissen = v.wissen || 0; }]);

// ---------------------------------------------------------------- Zustandsabfragen (alles typeof-geprüft)
function wd_k() { try { return typeof curChapter === 'function' ? curChapter() : 1; } catch (e) { return 1; } }
function wd_aussen() { return !state.inBasement && state.zone !== 'canal' && !(typeof indoorRect === 'function' && indoorRect()); }
// Tageszeit: das Spiel läuft nachts; Kapitel 4 (Morgen) und der Epilog Kapitel 6 sind hell (WL.morgen)
function wd_tag() { try { if (wd_k() === 4 || (typeof WL !== 'undefined' && WL.morgen)) return 'tag'; } catch (e) {} return 'nacht'; }
function wd_von(x, z, d) { return Math.hypot(player.pos.x - x, player.pos.z - z) > d; }
function wd_amtX(a, b) { try { if (typeof C2 === 'undefined' || !C2) return false; const dx = player.pos.x - C2.x; return dx > a && dx < b; } catch (e) { return false; } }
function wd_ruhig() {
  if (!state.started || menu.attract || state.talking || state.ending || state.blackout || (typeof ui !== 'undefined' && ui.overlay) || (typeof scripted !== 'undefined' && scripted) || (typeof dir !== 'undefined' && dir.busy)) return false;
  if (typeof hunt !== 'undefined' && hunt.on) return false;
  if (typeof kino_S !== 'undefined' && kino_S.on) return false;
  if (typeof spannung_traurig === 'function' && spannung_traurig()) return false;
  if (typeof SP !== 'undefined' && (SP.chase || SP.stress > .4)) return false;
  return true;
}
function wd_dist(p) { const P = player.pos; return Math.hypot(p.x - P.x, p.z - P.z); }
function wd_facing(x, y, z) { try { return typeof leben_facing === 'function' ? leben_facing(x, y, z) : -1; } catch (e) { return -1; } }
function wd_los(x, y, z) { try { return typeof hungrige_los === 'function' ? hungrige_los(x, y, z) : true; } catch (e) { return true; } }
function wd_lit(p, dMax = WD_PARAM.litDist) { try { const L = typeof tausch_licht === 'function' ? tausch_licht() : null; const an = typeof flashOn !== 'undefined' ? flashOn : (L && L.an); return !!an && !state.blackout && wd_dist(p) < dMax && wd_facing(p.x, p.y + 1.2, p.z) > WD_PARAM.litThr; } catch (e) { return false; } }
function wd_boden(x, z) { const sg = typeof solidGround === 'function' ? solidGround(x, player.pos.y + 1.2, z) : 0; return sg > -1 ? Math.max(0, sg) : 0; }
function wd_frei(x, z, r = .9) { try { if (typeof leben_inHouse === 'function' && leben_inHouse(x, z, 1.5)) return false; if (typeof leben_free === 'function' && !leben_free(x, z, .95, Math.min(r, .5))) return false; } catch (e) {} return true; }   // Körperhöhe 0,95 m: Straßenschutt und Laub am Boden (< 0,1 m) sperren kein Tier dieser Größe
function wd_spot(dMin, dMax, spread = .5, voraus = true) {
  const P = player.pos; let f; try { f = flatDir(); } catch (e) { f = new THREE.Vector3(0, 0, 1); } if (!voraus) f.negate();
  for (let k = 0; k < 30; k++) {
    const a = Math.atan2(f.x, f.z) + (Math.random() * 2 - 1) * spread, d = dMin + Math.random() * (dMax - dMin), x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d;
    if (!wd_frei(x, z)) continue;
    const y = wd_boden(x, z);
    if (voraus && !wd_los(x, y + 1, z)) continue; return [x, y, z]; }
  return null;
}
// neben einen Laternenmast vor dem Spieler (Konzept k1_nacht: „Zwei Masten“), 1 m seitlich der Sichtlinie
function wd_mast(dMin, dMax) {
  const P = player.pos, L = typeof lamps !== 'undefined' ? lamps : [], c = [];
  for (const l of L) { const p = l.g && l.g.position; if (!p) continue; const d = wd_dist(p); if (d < dMin || d > dMax || wd_facing(p.x, 2.5, p.z) < .72) continue; c.push([l, d]); }
  for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; }
  for (const [l, d] of c) { const p = l.g.position, dx = (p.x - P.x) / d, dz = (p.z - P.z) / d;
    for (const s of [1, -1]) { const x = p.x + dz * s * 1.05, z = p.z - dx * s * 1.05; if (!wd_frei(x, z, .6)) continue; const y = wd_boden(x, z); if (!wd_los(x, y + 1, z)) continue; return [x, y, z]; } }
  return null;
}
function wd_log(s) { wd_S.log.push([Math.round(wd_S.t), s]); if (wd_S.log.length > 40) wd_S.log.shift(); }

// ---------------------------------------------------------------- Modelle und Akteur (ein Akteur, eine Form zur Zeit)
const WD_CLIPS = {
  hirschding: { idle: 'stehen', walk: 'gehen', run: 'sturm', lauern: 'lauern', beobachten: 'beobachten', bruellen: 'schrei', fressen: 'fressen', uebergang: 'uebergang' },
  _tier: { idle: /IdleBreathe$/, walk: /Walk$/, run: /Run$/, lauern: 'lauern', beobachten: 'beobachten', bruellen: 'bruellen', fressen: 'fressen', uebergang: 'uebergang' },
};
const WD_Q = { a: new THREE.Quaternion(), b: new THREE.Quaternion(), c: new THREE.Quaternion() };
async function wd_bau(form, vorwaermen) {
  try {
      const src = await msModel('wendigo_' + form, 'model.glb');
      const sk = typeof figuren_skc === 'function' ? await figuren_skc() : (typeof leben_S !== 'undefined' ? leben_S.skc : null);
      const o = sk ? sk(src) : src.clone(true);
      o.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; } });
      const g = new THREE.Group(); g.add(o); g.visible = false; g.userData.noCol = true; scene.add(g);
      try { auftritt_reg(g, { name: 'Wendigo:' + form, ein: .45, aus: .35, r: 2.6 }); } catch (e) {}
      const mx = new THREE.AnimationMixer(o), A = {}; for (const c of src.animations || []) A[c.name] = mx.clipAction(c);
      const morph = []; o.traverse(m => { if (m.isMesh && m.morphTargetDictionary) morph.push(m); });
      let meta = {}; try { meta = typeof src.userData.motion === 'string' ? JSON.parse(src.userData.motion) : (src.userData.motion || {}); } catch (e) {}
      let head = null; o.traverse(b => { if (b.isBone && /-Head$/.test(b.name)) head = b; });
      const M = { form, g, o, mx, A, morph, meta, head, hy: 0, hyT: 0, hyAt: -9, cur: null, name: '', src };
      try { if (vorwaermen && renderer.compileAsync) { g.visible = true; g.position.set(player.pos.x, -80, player.pos.z); await renderer.compileAsync(g, camera, scene); g.visible = false; } } catch (e) {}  // Shader vorab, kein Ruckler beim ersten Auftritt
      return M;
  } catch (e) { console.warn('Wendigo: Modell', form, e); return null; }
}
async function wd_modell(form) {
  const S = wd_S; if (form in S.models && S.models[form]) return S.models[form]; if (S.loading[form]) return S.loading[form];
  S.loading[form] = wd_bau(form, true).then(M => (S.models[form] = M)); return S.loading[form];
}
function wd_clip(M, rolle) {
  const tab = WD_CLIPS[M.form] || WD_CLIPS._tier, w = tab[rolle]; if (!w) return null;
  if (typeof w === 'string') return M.A[w] || null;
  const n = Object.keys(M.A).find(k => w.test(k)); return n ? M.A[n] : null;
}
function wd_play(M, rolle, fade = .25, ts = 1, once = false) {
  const a = wd_clip(M, rolle); if (!a) return null; if (M.cur === a) { a.timeScale = ts; return a; }
  a.reset(); a.timeScale = ts; a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity); a.clampWhenFinished = !!once;
  if (M.cur && fade > 0) { a.fadeIn(fade).play(); M.cur.fadeOut(fade); } else { if (M.cur) M.cur.stop(); a.play(); } M.cur = a; return a;
}
function wd_morph(M, name, v) { for (const m of M.morph) { const i = m.morphTargetDictionary[name]; if (i !== undefined) m.morphTargetInfluences[i] = v; } }
function wd_hide() { const A = wd_S.A; if (!A) return; A.g.visible = false; A.g.scale.setScalar(1); wd_S.A = null; }
async function wd_zeige(form, pos, o = {}) {
  const M = await wd_modell(form); if (!M) return null; wd_hide();
  for (const m of M.morph) m.morphTargetInfluences.fill(0);
  M.g.position.set(pos[0], pos[1], pos[2]); M.g.rotation.set(0, Math.atan2(player.pos.x - pos[0], player.pos.z - pos[2]), 0);
  M.g.scale.setScalar(o.scale || 1); M.hy = M.hyT = 0; M.hyAt = -9;
  M.o.traverse(m => { if (m.isMesh) { const ms = [].concat(m.material); for (const mt of ms) { if (!mt.userData.wdC) mt.userData.wdC = mt.color ? mt.color.clone() : null; if (mt.color && mt.userData.wdC) mt.color.copy(mt.userData.wdC).multiplyScalar(o.dunkel ? .18 : 1); } } });
  wd_play(M, o.clip || 'idle', 0, 1); M.mx.update(.01); M.g.visible = true; wd_S.A = M; return M;
}
// Kopf in Rasten (≈ 20°) zu Luke: Ziel wird gerastet, die Drehung selbst ist kurz und weich; anim_ueber setzt jedes Bild auf die Mixer-Pose zurück (kein Aufaddieren = kein „Disco-Kopf“)
function wd_kopf(M, dt) {
  const h = M.head; if (!h || !M.g.visible) return; const p = M.g.position, cam = camera.position;
  let d = Math.atan2(cam.x - p.x, cam.z - p.z) - M.g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); d = Math.max(-1.25, Math.min(1.25, d));
  const r = Math.round(d / .35) * .35;
  if (Math.abs(r - M.hyT) > .01 && wd_S.t - M.hyAt > 1.1) { M.hyT = r; M.hyAt = wd_S.t; if (wd_dist(p) < 40) { try { Audio.wendigo && Audio.wendigo('knochen', p.x, 1.4, p.z, .1); } catch (e) {} } }
  M.hy += (M.hyT - M.hy) * Math.min(1, dt * 9);
  if (Math.abs(M.hy) < .002) return;
  const f = () => { h.parent.updateWorldMatrix(true, false); h.updateWorldMatrix(false, false); h.getWorldQuaternion(WD_Q.a); WD_Q.b.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, M.hy); WD_Q.a.premultiply(WD_Q.b);
    h.parent.getWorldQuaternion(WD_Q.c).invert(); h.quaternion.copy(WD_Q.c.multiply(WD_Q.a)); };
  if (typeof anim_ueber === 'function') anim_ueber(h, f); else f();
}

// ---------------------------------------------------------------- Spuren, Kadaver, Fund
function wd_huf() {   // Abdruck eines Spalthufes: zwei gespitzte Hälften mit Wulstrand, Matsch quillt an den Seiten; ohne Schrift, mit weichem Rand
  const c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d'), halbe = sx => { const x = 64 + sx * 19;
    g.save(); g.translate(x, 100); g.rotate(sx * .09); g.beginPath(); g.moveTo(0, -78); g.bezierCurveTo(24, -52, 30, 4, 25, 40); g.bezierCurveTo(20, 66, -18, 66, -22, 36); g.bezierCurveTo(-26, -6, -18, -52, 0, -78); g.closePath();
    const gr = g.createRadialGradient(0, 4, 4, 0, 4, 66); gr.addColorStop(0, 'rgba(8,5,3,.95)'); gr.addColorStop(.62, 'rgba(18,11,6,.9)'); gr.addColorStop(1, 'rgba(44,30,18,.0)'); g.fillStyle = gr; g.fill();
    g.lineWidth = 7; g.strokeStyle = 'rgba(58,40,24,.55)'; g.stroke(); g.restore(); };
  g.filter = 'blur(1.4px)'; halbe(-1); halbe(1);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function wd_decal(x, z, rot, s = .30) {
  const y = wd_boden(x, z) + .012, S = wd_S;
  S.huf = S.huf || wd_huf(); S.hufM = S.hufM || new THREE.MeshLambertMaterial({ map: S.huf, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const m = new THREE.Mesh(S.hufG || (S.hufG = new THREE.PlaneGeometry(1, 1.5)), S.hufM); m.scale.set(s, s, 1); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, y, z); m.userData.noCol = true; scene.add(m); S.dec.push(m);
  if (S.dec.length > 60) { const o = S.dec.shift(); scene.remove(o); } return m;
}
function wd_spurReihe(kind) {
  const S = wd_S, P = player.pos;
  if (kind === 'huf_neben') {   // neben Lukes eigenem letzten Weg (Positionspuffer), 0,7 m seitlich, endet an seiner Fußspur
    const T = S.trail; if (T.length < 8) return false; const n = Math.min(T.length - 1, 18);
    for (let i = 0; i < n; i++) { const a = T[T.length - 1 - i], b = T[T.length - 2 - i] || a, dx = a[0] - b[0], dz = a[1] - b[1], l = Math.hypot(dx, dz) || 1; if (!wd_frei(a[0] + dz / l * .7, a[1] - dx / l * .7, .3)) continue;
      wd_decal(a[0] + dz / l * .7, a[1] - dx / l * .7, Math.atan2(dx, dz) + Math.PI); } return true; }
  const f = (() => { try { return flatDir(); } catch (e) { return new THREE.Vector3(0, 0, 1); } })(), x0 = P.x + f.x * 12, z0 = P.z + f.z * 12;
  for (let i = 0; i < 10; i++) wd_decal(x0 + f.x * i * .62 + (i % 2) * .12, z0 + f.z * i * .62, Math.atan2(f.x, f.z) + Math.PI); return true;
}
// abgelegte Haut: das Modell „haut“ (haarlos, nass) liegt zusammengefallen am Boden; E untersuchen → Fibel-Fund
async function wd_pelz(pos) {
  const M = await wd_bau('haut', false); if (!M) return null; const g = M.g; g.position.set(pos[0], pos[1], pos[2]); g.rotation.set(0, Math.random() * 6.28, 0); g.scale.setScalar(.62);
  try { const c = Object.keys(M.A).find(k => /Death$/.test(k)); if (c) { const a = M.A[c]; a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.play(); M.mx.setTime(a.getClip().duration); } } catch (e) {}
  g.visible = true; wd_S.dec.push(g);
  if (typeof interact === 'function') { const hit = new THREE.Mesh(new THREE.BoxGeometry(1.1, .5, .9), hidden); hit.position.set(pos[0], pos[1] + .25, pos[2]); hit.userData.noCol = true; scene.add(hit); wd_S.dec.push(hit);
    interact(hit, 'Haut untersuchen', () => { const L = WENDIGO_TEXTE.lore.wd_haut; if (!story.lore.some(l => l.key === 'wd_haut')) story.lore.push({ key: 'wd_haut', title: L[0], html: L[1] }); try { openNote(L[0], L[1], 'wd_haut'); } catch (e) {} uninteract(hit); }); }
  return g;
}
function wd_blutfleck(x, z, r) {
  const S = wd_S; if (!S.blutT) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.filter = 'blur(2px)';
    for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, d = Math.random() * 44, rr = 4 + Math.random() * 14 * (1 - d / 60); g.fillStyle = `rgba(${40 + Math.random() * 30 | 0},4,4,${.55 + Math.random() * .35})`; g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, rr, 0, 7); g.fill(); }
    S.blutT = new THREE.CanvasTexture(c); S.blutM = new THREE.MeshLambertMaterial({ map: S.blutT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }); }
  const m = new THREE.Mesh(S.hufG || (S.hufG = new THREE.PlaneGeometry(1, 1.5)), S.blutM); m.scale.set(r * 2, r * 2 / 1.5, 1); m.rotation.set(-Math.PI / 2, 0, Math.random() * 6.28); m.position.set(x, wd_boden(x, z) + .014, z); m.userData.noCol = true; scene.add(m); S.dec.push(m); return m;
}
async function wd_kadaver(gross, pos) {
  const M = await wd_bau('fleisch', false); if (!M) return null; const g = M.g;   // eigene Instanz (kein Klon einer Skelett-Figur)
  g.position.set(pos[0], pos[1], pos[2]); g.rotation.set(0, Math.random() * 6.28, 0); g.scale.setScalar(gross ? 1 : .55);
  try { const c = Object.keys(M.A).find(k => /Death$/.test(k)); if (c) { const a = M.A[c]; a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.play(); M.mx.setTime(a.getClip().duration); } } catch (e) {}
  g.visible = true; wd_S.dec.push(g); wd_S.stat.kadaver++; try { wd_blutfleck(pos[0], pos[2], gross ? 1.5 : .9); } catch (e) {} return g;
}

// ---------------------------------------------------------------- Ereignisse
function wd_wahl() {
  const S = wd_S, k = wd_k(); if (k > 5 || k < 1) return null;
  for (const e of WD_AUFTRITTE) {
    if (e.k !== k || e.nur === 'hook') continue; const cnt = S.n[e.id] || 0; if (cnt >= (e.mal || 1)) continue;
    if (e.nach && !e.nach.every(x => S.done.has(x))) continue;
    if (e.nacht && wd_tag() === 'tag') continue;
    try { if (!e.cond()) continue; } catch (x) { continue; }
    return e; }
  return null;
}
function wd_text(e) {
  if (e.gedanke && typeof gedanke === 'function') gedanke('wd_' + e.id, WENDIGO_TEXTE[e.gedanke], 1800, 2);
  if (e.lore && WENDIGO_TEXTE.lore[e.lore] && !story.lore.some(l => l.key === e.lore)) { const L = WENDIGO_TEXTE.lore[e.lore]; story.lore.push({ key: e.lore, title: L[0], html: L[1] }); try { if (typeof toast === 'function') toast('Fibel: ' + L[0], 3000); } catch (x) {} }
}
function wd_fertig(e) { const S = wd_S, k = wd_k(); S.n[e.id] = (S.n[e.id] || 0) + 1; if (S.n[e.id] >= (e.mal || 1)) S.done.add(e.id); S.stat.auftritte++; S.ruheBis = S.t + WD_PARAM.ruhe;
  S.next = S.t + WD_PARAM.gap[k][0] + Math.random() * (WD_PARAM.gap[k][1] - WD_PARAM.gap[k][0]); wd_log('fertig ' + e.id); try { if (typeof spannung_did === 'function') spannung_did('wd_' + e.art, 'amb'); } catch (x) {}
  try { if (typeof saveGame === 'function') saveGame(k); } catch (x) {}
  try { if (typeof beob_still === 'function') beob_still(e.art === 'text' ? 20 : 45); } catch (x) {} }   // Spiegel: wo er war, ist der Beobachter still
function wd_ton(art, p, gain) { try { if (Audio.wendigo && Audio.wendigo(art, p[0], p[1] || 1.2, p[2], gain)) return true; } catch (e) {} try { Audio.whisper(p[0], p[1] || 1.2, p[2], gain * 1.2); } catch (e) {} return false; }
async function wd_start(e, erzwingen) {
  const S = wd_S; if (S.ev) return false; S.ev = { e, t: 0, seen: 0, phase: 'an', form: e.form };
  const P = player.pos; wd_log('start ' + e.id);
  try { if (typeof spannung_did === 'function') spannung_did('wd_ev', 'amb'); } catch (x) {}
  if (e.art === 'ton') { const f = wd_spot(26, 40, 1.4, false) || [P.x + 20, 0, P.z]; try { if (typeof spannung_hush === 'function') spannung_hush(2.5, .1); } catch (x) {} setTimeout(() => { wd_ton('ruf', f, .6); wd_text(e); }, 1200); S.ev.phase = 'aus'; S.ev.t = -3; }
  else if (e.art === 'text') { wd_text(e); S.ev.phase = 'aus'; S.ev.t = -1; }
  else if (e.art === 'spur') {
    if (e.was === 'haut') { const f = wd_spot(14, 24, .45); if (!f) { S.ev = null; return false; } const g = await wd_pelz(f); if (!g) { S.ev = null; return false; }
      for (let i = 0; i < 4; i++) wd_decal(f[0] + .9 + (i % 2) * .1, f[2] + i * .62 - .6, Math.PI * (i % 2) + .1); S.stat.kadaver++; }
    else if (e.was === 'kratz') { if (!wd_kratz()) { S.ev = null; return false; } }
    else if (!wd_spurReihe(e.was)) { S.ev = null; return false; }
    S.stat.spuren++; setTimeout(() => wd_text(e), 1500); S.ev.phase = 'aus'; S.ev.t = -2; }
  else if (e.art === 'kadaver') { const f = wd_spot(e.gross ? 16 : 10, e.gross ? 28 : 18, .5); if (!f) { S.ev = null; return false; } const g = await wd_kadaver(!!e.gross, f);
    if (e.blutdurst) { try { if (typeof spannung_hush === 'function') spannung_hush(3, .1); } catch (x) {} wd_ton('fleisch', f, .7); setTimeout(() => wd_ton('ruf', [f[0] + 30, 1.5, f[2] + 30], .8), 600); }
    setTimeout(() => wd_text(e), 1800); S.ev.phase = 'aus'; S.ev.t = -2; }
  else if (e.art === 'fenster') { const ok = wd_fensterHofer(); if (!ok) { S.ev = null; return false; } wd_ton('knochen', [P.x + 6, 3, P.z], .25); setTimeout(() => wd_text(e), 1500); S.ev.phase = 'aus'; S.ev.t = -4.5; }
  else if (e.art === 'form') {
    const d = WD_PARAM.dist[e.form] || [26, 40], f = (e.mast && wd_mast(d[0] - 6, d[1])) || wd_spot(d[0], d[1], .55); if (!f) { S.ev = null; return false; }
    const M = await wd_zeige(e.form, f, { dunkel: !!e.dunkel, clip: 'idle', scale: e.form === 'hirschding' ? .95 : 1 }); if (!M) { S.ev = null; return false; }
    S.ev.phase = 'beobachten'; S.seenT = 0; wd_ton('knochen', f, .2); }
  return true;
}
function wd_nah() { const A = wd_S.A; return !!(A && A.g.visible && wd_dist(A.g.position) < 40); }   // für BEOB_SPERREN
// vier Furchen in 2,3 m Höhe an der Außenwand des nächsten Hauses: heller Holzgrund der Splitter, dunkle Ränder, Fasern am Ende (indoorRects: x0, x1, zb, zf)
function wd_kratzTex() {
  const c = document.createElement('canvas'); c.width = 192; c.height = 384; const g = c.getContext('2d');
  for (let i = 0; i < 4; i++) { const x0 = 30 + i * 36 + (i % 2) * 4, bog = (i - 1.5) * 5;
    g.beginPath(); g.moveTo(x0, 8); g.bezierCurveTo(x0 + bog, 120, x0 - bog, 240, x0 + bog * .6, 372); g.lineCap = 'round';
    g.lineWidth = 11; g.strokeStyle = 'rgba(16,10,6,.8)'; g.stroke();            // Rand/Tiefe
    g.lineWidth = 5; g.strokeStyle = 'rgba(176,150,112,.95)'; g.stroke();        // frisches Holz im Grund
    for (let j = 0; j < 9; j++) { const yy = 20 + Math.random() * 330, xx = x0 + bog * (yy / 384 - .5) * .8; g.lineWidth = 1.2; g.strokeStyle = 'rgba(190,164,126,.8)'; g.beginPath(); g.moveTo(xx + (Math.random() - .5) * 4, yy); g.lineTo(xx + (Math.random() - .5) * 11, yy + 12 + Math.random() * 18); g.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function wd_kratz() {
  const P = player.pos; let best = null, bd = 1e9; try { for (const r of (typeof indoorRects !== 'undefined' ? indoorRects : [])) { const cx = Math.max(r.x0, Math.min(P.x, r.x1)), cz = Math.max(r.zb, Math.min(P.z, r.zf)), d = Math.hypot(P.x - cx, P.z - cz); if (d < bd && d > 1.5) { bd = d; best = [r, cx, cz]; } } } catch (e) {}
  if (!best || bd > 30) return false; const [r, cx, cz] = best, S = wd_S;
  S.kratzM = S.kratzM || new THREE.MeshLambertMaterial({ map: wd_kratzTex(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.26, .52), S.kratzM);
  const onX = Math.abs(P.x - cx) > Math.abs(P.z - cz); m.position.set(onX ? (P.x < cx ? r.x0 - .012 : r.x1 + .012) : cx, 2.3, onX ? cz : (P.z < cz ? r.zb - .012 : r.zf + .012));
  m.rotation.y = onX ? (P.x < cx ? -Math.PI / 2 : Math.PI / 2) : (P.z < cz ? Math.PI : 0); m.userData.noCol = true; scene.add(m); S.dec.push(m); return true;
}

// ---------------------------------------------------------------- Mensch im Fenster (Hofers Gesicht auf falschem Körper)
// Nutzt fensterfigur.js (ff_neu: echter 3D-Körper hinter dem Glas) mit dem Menschenmodell 'polizist' (figuren.js: HOFER → 'polizist'): der Körper steht, der Kopf ist 2,1 rad zu weit gedreht
// und wird jedes Bild nach dem Mixer überlagert (anim_ueber; vorher nur einmal gesetzt → vom Mixer sofort überschrieben). Mikroatmung aus. Vor Kapitel-4-Ende nur „ein Mensch“.
function wd_fensterWahl(dMin, dMax) {
  try { const fs = typeof fassaden_S !== 'undefined' && fassaden_S.windows; if (!fs) return null; const P = player.pos, v = new THREE.Vector3(), nr = new THREE.Vector3(); let best = null, bs = -9;
    for (const W of fs) { if (W.boarded || W.y > 3 || !W.pw || !W.g) continue; W.g.updateWorldMatrix(true, false); v.set(W.x, W.y, W.z).applyMatrix4(W.g.matrixWorld);
      const d = Math.hypot(v.x - P.x, v.z - P.z); if (d < dMin || d > dMax) continue; const f = wd_facing(v.x, v.y, v.z); if (f < .78) continue;
      nr.set(Math.sin(W.ry), 0, Math.cos(W.ry)).transformDirection(W.g.matrixWorld); if (nr.x * (P.x - v.x) + nr.z * (P.z - v.z) < .35 * d) continue;   // Scheibe schaut zu Luke
      if (!wd_los(v.x, v.y, v.z)) continue; const s = f - d * .004; if (s > bs) { bs = s; best = W; } }
    return best; } catch (e) { return null; }
}
function wd_fensterHofer(dauer = 3.4) {
  try {
    if (typeof ff_neu !== 'function') return false;
    const W = wd_fensterWahl(9, 26) || wd_fensterWahl(4, 32); if (!W) return false;
    const nx = Math.sin(W.ry), nz = Math.cos(W.ry);
    const rec = ff_neu(W.g, W.x + nx * .058, W.y, W.z + nz * .058, W.ry, W.pw, W.ph, 'polizist', { warm: false, tief: .55, dunkel: .5 }); if (!rec) return false;
    rec.ziel = 1; wd_S.fenster = rec; const t0 = performance.now(); let hd = null, an = true;
    const tw = () => { if (!an) return; try { hd = hd || (rec.P && rec.P.rig && rec.P.rig.head); if (!hd) return; if (rec.P.mv) rec.P.mv.autoLook = null;
      const k = Math.min(1, (performance.now() - t0) / 1800), ang = 2.1 * k * k * (3 - 2 * k);
      const f = () => { hd.parent.updateWorldMatrix(true, false); hd.updateWorldMatrix(false, false); hd.getWorldQuaternion(WD_Q.a); WD_Q.b.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, ang); WD_Q.a.premultiply(WD_Q.b); hd.parent.getWorldQuaternion(WD_Q.c).invert(); hd.quaternion.copy(WD_Q.c.multiply(WD_Q.a)); };
      if (typeof anim_ueber === 'function') anim_ueber(hd, f); else f(); } catch (e) {} };
    WORLD_TICK.push(tw);
    setTimeout(() => { rec.ziel = 0; }, dauer * 1000);
    setTimeout(() => { an = false; const i = WORLD_TICK.indexOf(tw); if (i >= 0) WORLD_TICK.splice(i, 1); try { if (rec.quad && rec.quad.parent) rec.quad.parent.remove(rec.quad); const j = FF.recs.indexOf(rec); if (j >= 0) FF.recs.splice(j, 1); rec.alive = false; if (rec.wrap) FF.scene.remove(rec.wrap); } catch (e) {} wd_S.fenster = null; }, dauer * 1000 + 3500);
    return true;
  } catch (e) { console.warn('Wendigo: Fenster', e); return false; }
}

// ---------------------------------------------------------------- Präsenz: leise Laute am Rand, kein Bild (Konzept „dauerhaft präsent, unerkannt“; Spiegel der Beobachter-Spuren)
function wd_praesenz() {
  const S = wd_S, k = wd_k(), r = Math.random(); const f = wd_spot(16, 34, 2.4, false) || wd_spot(16, 34, 1.2, true); if (!f) return false;
  try { if (typeof spannung_did === 'function') spannung_did('wd_ton', 'amb'); } catch (e) {}
  if (r < .45) {   // vier Hufschläge im Metronomtakt (0,62 s), ziehen seitlich vorbei – ein Tier läuft nie so gleichmäßig
    const P = player.pos, dx = f[0] - P.x, dz = f[2] - P.z, l = Math.hypot(dx, dz) || 1, tx = -dz / l, tz = dx / l;
    for (let i = 0; i < 4; i++) setTimeout(() => { try { Audio.wendigo('huf', f[0] + tx * (i - 1.5) * 1.1, .1, f[2] + tz * (i - 1.5) * 1.1, .3); } catch (e) {} }, i * 620);
  } else if (r < .75) { try { if (typeof spannung_hush === 'function') spannung_hush(1.6, .2); } catch (e) {} setTimeout(() => wd_ton('knochen', f, .22), 1700); }
  else if (r < .9) wd_ton('schnueff', [f[0], .8, f[2]], .22);
  else wd_ton('schritt', [f[0], .1, f[2]], .25);
  S.stat.praesenz++; wd_log('präsenz'); try { if (typeof beob_still === 'function') beob_still(28); } catch (e) {} return true;
}

// ---------------------------------------------------------------- Takt
function wd_vorlauf() {   // Modell des nächsten Ereignisses rechtzeitig laden (Dekodieren/Programme im Leerlauf), nichts im Voraus auf der Grafikkarte
  const S = wd_S, k = wd_k(); if (S.preT > S.t) return; S.preT = S.t + 8; if (S.t < S.next - 50 || S.ev) return;
  const e = WD_AUFTRITTE.find(x => x.k === k && x.nur !== 'hook' && (S.n[x.id] || 0) < (x.mal || 1) && (!x.nach || x.nach.every(q => S.done.has(q))));
  if (!e) return; const f = e.art === 'form' ? e.form : e.art === 'kadaver' ? 'fleisch' : e.was === 'haut' ? 'haut' : null; if (f && !S.models[f] && !S.loading[f]) wd_modell(f);
}
function wd_tick(dt) {
  const S = wd_S; if (!S.ready || !state.started || menu.attract) return; S.t += dt; const k = wd_k();
  if (!S.klang && typeof Audio !== 'undefined' && Audio.ctx) { S.klang = 1; try { if (typeof kr_klang === 'function') kr_klang(); } catch (e) {} }   // Aufnahmen der Laute (sonst erst mit Kapitel 6 geladen)
  if (k !== S.k) { S.k = k; S.kT = 0; S.next = S.t + WD_PARAM.start[Math.min(k, 5)] * (.8 + Math.random() * .4); S.praeT = S.t + 60 + Math.random() * 90; wd_hide(); S.ev = null; for (const o of S.dec) { try { scene.remove(o); } catch (e) {} } S.dec.length = 0; wd_log('Kapitel ' + k); }
  S.kT += dt; S.mode = k >= 6 ? 'k6' : S.ev ? S.ev.phase : 'schlaf'; if (k >= 6 || k < 1) return;
  // Pfad-Puffer (für die Hufspur neben Lukes Weg), alle 0,8 m
  const P = player.pos; if (Math.hypot(P.x - S.lastPos.x, P.z - S.lastPos.z) > .8) { S.trail.push([P.x, P.z]); if (S.trail.length > 120) S.trail.shift(); S.lastPos.set(P.x, 0, P.z); }
  if (!S.wissen && (S.t | 0) % 5 === 0) { try { if (story.lore.some(l => l.key === 'pell_4')) S.wissen = 1; } catch (e) {} }   // Pells Heft gelesen (Kap. 4)
  const ev = S.ev;
  if (!ev) {
    wd_vorlauf();
    if (S.t >= S.praeT && !S.ev) { S.praeT = S.t + WD_PARAM.praesenz[k][0] + Math.random() * (WD_PARAM.praesenz[k][1] - WD_PARAM.praesenz[k][0]);
      if (S.t > S.ruheBis && wd_ruhig() && wd_aussen()) { let ok = true; try { if (typeof spannung_can === 'function') ok = spannung_can('wd_ton', 'amb'); } catch (e) {} if (ok) wd_praesenz(); } }
    if (S.t < S.next || S.t < S.ruheBis) return; const cnt = WD_AUFTRITTE.filter(e => e.k === k).reduce((a, e) => a + (S.n[e.id] || 0), 0); if (cnt >= WD_PARAM.max[k]) return;
    if (!wd_ruhig()) return;
    let ok = true; try { if (typeof spannung_can === 'function') ok = spannung_can('wd_ev', 'amb'); } catch (e) {} if (!ok) return;
    const e = wd_wahl(); if (!e) { S.next = S.t + 30; return; } wd_start(e); return; }
  ev.t += dt; const A = S.A;
  if (ev.phase === 'aus') { if (ev.t >= 0) { wd_fertig(ev.e); S.ev = null; } return; }
  if (!A) { if (ev.t > 20) { S.ev = null; } return; }
  const g = A.g, p = g.position, d = wd_dist(p);
  const sicht = wd_facing(p.x, p.y + 1.2, p.z), amBild = sicht > .5 && d < 70, inView = sicht > WD_PARAM.viewThr && d < 45;
  if (ev.phase === 'beobachten') {
    // Gehen nur außerhalb des Bildes („Weeping“): Wegtempo = Schrittlänge des Clips; im Bild steht er, Kopf in Rasten
    let geht = false;
    if (ev.e.rueck) { const sp = WD_PARAM.schritt[A.form] || 1.04, nx = p.x + (p.x - P.x) / (d || 1) * sp * dt, nz = p.z + (p.z - P.z) / (d || 1) * sp * dt; if (wd_frei(nx, nz, .5)) { p.x = nx; p.z = nz; p.y = wd_boden(nx, nz); geht = 'rueck'; } else { ev.t = Math.max(ev.t, 44); } }
    else if (ev.e.still && !amBild && d > WD_PARAM.nearHide + 4) { const sp = WD_PARAM.schritt[A.form] || 1.04, nx = p.x + (P.x - p.x) / d * sp * dt, nz = p.z + (P.z - p.z) / d * sp * dt; if (wd_frei(nx, nz, .5)) { p.x = nx; p.z = nz; p.y = wd_boden(nx, nz); geht = 'vor'; } }
    if (geht === 'rueck') wd_play(A, 'walk', .2, -1); else if (geht === 'vor') wd_play(A, 'walk', .2, 1); else wd_play(A, 'idle', .35, 1);
    // Körper dreht nur, wenn niemand hinsieht (kein Drehen auf der Stelle im Bild); Kopf übernimmt im Bild
    if (!amBild) { const want = Math.atan2(P.x - p.x, P.z - p.z); const df = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)); g.rotation.y += Math.max(-1.4 * dt, Math.min(1.4 * dt, df)); }
    A.mx.update(dt); wd_kopf(A, dt);
    S.seenT = inView ? S.seenT + dt : Math.max(0, S.seenT - dt * .5);
    if (!ev.counted && S.seenT > WD_PARAM.seeMin) { ev.counted = true; S.stat.gesehen++; wd_text(ev.e); try { if (typeof spannung_schreck === 'function') spannung_schreck(1, 'wd_' + ev.e.id); } catch (x) {} }
    if (!S.hold && (S.seenT > WD_PARAM.seeMax || (ev.counted && !inView) || wd_lit(p) || d < WD_PARAM.nearHide || ev.t > 45)) { ev.phase = 'rueckzug'; ev.t = 0; S.stat.rueckzug++; A.g.visible = false; /* auftritt_reg blendet weich aus */ }
  } else if (ev.phase === 'rueckzug') {
    if (ev.t > 1.2) { wd_hide(); if (!ev.counted) wd_text(ev.e); wd_fertig(ev.e); S.ev = null; }
  }
}
WORLD_TICK.push(dt => { try { wd_tick(dt); } catch (e) { console.warn('Wendigo: Takt', e); wd_S.ready = false; } });

function wd_tonband() { try { subtitle('<i>' + WENDIGO_TEXTE.t_band + '</i>', 4200, 'BAND?'); } catch (e) {} const e = WD_AUFTRITTE.find(x => x.id === 'k3_funk'); if (e) { try { wd_ton('knochen', [player.pos.x + 8, 1.2, player.pos.z], .18); } catch (x) {} setTimeout(() => wd_text(e), 3500); wd_fertig(e); } }
// ---------------------------------------------------------------- Haken in andere Module (ohne deren Dateien zu ändern; alles typeof-geprüft)
function wd_haken() {
  // Kap. 3: Funkkasten zu Ende gesprochen → ein Satz auf dem Band, Wort für Wort ein zweites Mal, ohne Atem
  try { if (typeof lucy3_funk === 'function' && !lucy3_funk.__wd) { const o = lucy3_funk; lucy3_funk = function () { const r = o.apply(this, arguments); try { if (wd_k() === 3 && !wd_S.done.has('k3_funk')) { let n = 0; const iv = setInterval(() => { n++; try { if (n > 90 || wd_k() !== 3) return clearInterval(iv); if (typeof lucy3_S !== 'undefined' && lucy3_S.win) return; if (state.talking || (typeof ui !== 'undefined' && ui.overlay)) return; clearInterval(iv); setTimeout(() => wd_tonband(), 2500); } catch (e) { clearInterval(iv); } }, 2000); } } catch (e) {} return r; }; lucy3_funk.__wd = 1; } } catch (e) {}
}

// ---------------------------------------------------------------- Einstieg
WORLD_MODS.push(['Wendigo (Präsenz, Vorboten, Formen Kap. 1–5)', async () => {
  const S = wd_S; S.ready = true; S.k = 0; S.praeT = 90;
  try { if (typeof SP_GAP !== 'undefined') Object.assign(SP_GAP, { wd_ev: 240, wd_ton: 150, wd_form: 300, wd_spur: 300, wd_kadaver: 360, wd_text: 120, wd_fenster: 300 }); } catch (e) {}
  try { if (typeof BEOB_SPERREN !== 'undefined') BEOB_SPERREN.push(() => wd_nah()); } catch (e) {}
  wd_haken();
  window.__wd = {
    S, WD_PARAM, WD_AUFTRITTE, WENDIGO_TEXTE,
    report: () => ({ mode: S.mode, k: S.k, t: Math.round(S.t), next: Math.round(S.next), praeT: Math.round(S.praeT), done: [...S.done], n: S.n, stat: S.stat, log: S.log.slice(-12), modelle: Object.keys(S.models).filter(k => S.models[k]), kadaver: S.dec.length, wissen: S.wissen }),
    auftritt: id => { const e = WD_AUFTRITTE.find(x => x.id === id); return e ? wd_start(e, true) : false; },
    zettel: id => { const e = WD_AUFTRITTE.find(x => x.id === 'k2_' + id); if (e) { wd_text(e); wd_fertig(e); } },
    tonband: () => wd_tonband(),
    fenster: () => { const e = WD_AUFTRITTE.find(x => x.id === 'k4_fenster'); const ok = wd_fensterHofer(); if (e) { wd_ton('knochen', [player.pos.x + 6, 3, player.pos.z], .3); setTimeout(() => wd_text(e), ok ? 1500 : 0); wd_fertig(e); } return ok; },
    praesenz: () => wd_praesenz(), frei: (x, z, r) => wd_frei(x, z, r), boden: (x, z) => wd_boden(x, z),
    pelz: p => wd_pelz(p || wd_spot(8, 12) || [player.pos.x + 8, 0, player.pos.z]), blut: (x, z, r) => wd_blutfleck(x, z, r || 1),
    sicht: () => { const A = wd_S.A; return A ? { v: A.g.visible, a: A.g.__auf && A.g.__auf.a, real: A.g.__auf && A.g.__auf.real, p: A.g.position.toArray(), hy: A.hy, cur: A.cur && A.cur.getClip().name } : null; },
    zeige: (f, pos, o) => wd_zeige(f, pos, o || {}), mast: (a, b) => wd_mast(a || 20, b || 40), spot: (a, b, c, d) => wd_spot(a, b, c, d),
    spur: was => wd_spurReihe(was), kadaver: g => wd_kadaver(!!g, wd_spot(10, 18) || [player.pos.x + 10, 0, player.pos.z]),
    form: async (f, o) => { const sp = wd_spot(14, 24) || [player.pos.x + 14, 0, player.pos.z]; return wd_zeige(f, sp, o || {}); },
    uebergang: async (von, zu, kette) => {
      // Kette: bekleidet (reh/hirsch) → Clip „uebergang“ (Riss über Rücken/Bauch/Flanke/Hals, Knochen schieben, Kopf falsch, Maul, Geweih wächst) → Fleisch → (optional) Hirschding mit „aufstieg“
      const A = wd_S.A; if (!A) return false; const p = A.g.position.toArray(), ry = A.g.rotation.y;
      wd_play(A, 'uebergang', .1, 1, true); try { wd_ton('knochen', [p[0], 1.2, p[2]], .5); } catch (e) {}
      const warte = ms => new Promise(r => setTimeout(r, ms));
      await warte(2200); const M2 = await wd_zeige(zu || 'fleisch', p, { clip: 'idle' }); if (M2) M2.g.rotation.y = ry;
      if (kette && M2) { await warte(1800); try { wd_ton('ruf', [p[0], 1.5, p[2]], .6); } catch (e) {} const M3 = await wd_zeige('hirschding', p, { clip: 'idle' }); if (M3) { M3.g.rotation.y = ry; wd_play(M3, 'uebergang', .1, 1, true); } }
      return true; },
    aus: () => { wd_hide(); S.ev = null; }, nah: wd_nah,
    tick: dt => { if (S.A) { S.A.mx.update(dt); wd_kopf(S.A, dt); } },
  };
}]);
