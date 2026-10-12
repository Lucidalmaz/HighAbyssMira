// =====================================================================  WENDIGO (Modul „wendigo“, Folgeauftrag 8) – Präsenz, Vorboten und Formen in Kapitel 1–5
// STAND: fertig, aber NOCH NICHT in tools/assemble.js (ORDER) eingetragen und nie im Spiel gelaufen (kein Testlauf möglich, keine Spielinstanz). Einbau und Messplan: docs/gameplay/wendigo_integration.md.
//
// EINBAU-ANLEITUNG (Kurzfassung – Einzelheiten und Hook-Stellen im Integrationsdokument):
//  1. assemble.js: 'wendigo' in ORDER direkt NACH 'kreaturen' und VOR 'raender' einfügen (braucht kreaturen/hungrige/beobachter/spannung/auftritt-Funktionen erst zur Laufzeit).
//  2. Modelle liegen in game/assets/ms/wendigo_{reh,hirsch,fleisch,haut,hirschding}/model.glb; `node tools/ktx.mjs` erzeugt die komprimierten Fassungen (vor dem Gate!).
//  3. Selbsttest: window.__wd.report() (Zustand, Budget, Ereignisse); window.__wd.auftritt('k3_reh') erzwingt ein Ereignis (ignoriert Abstand/Kapitel, nicht Sicherheits-Sperren).
//  4. Perf-Gate: node app/tools/perf_gate.mjs (docs/gameplay/performance_budget.md). Dieses Modul legt keinen eigenen Shader an (nur MeshStandardMaterial aus den GLB) und tickt nur,
//     solange ein Ereignis läuft oder die Budget-Uhr zählt (O(1) je Bild).
//
// Verhalten (docs/gameplay/wendigo_konzept.md §5): schlaf → beobachten → (folgen | lauern) → rueckzug → schlaf; blutdurst als seltener Ausbruch (K5); ab Kapitel 6 passiv ('k6'):
// hungrige.js/kapitel6.js führen. Der Wendigo wird nie benannt (Kanon: erst Hofer Seite 1), spricht in Kap. 1–5 nicht, hinterlässt Verluste statt Schäden.
// Alle Zugriffe auf andere Module sind `typeof`-geprüft; fehlt ein Modul, wird das jeweilige Ereignis still ausgelassen.

const WD_PARAM = {
  gap: [0, [360, 540], [300, 480], [300, 420], [300, 420], [240, 360]],  // Abstand zwischen Auftritten je Kapitel (s Spielzeit, ruhig)
  max: [0, 3, 2, 2, 4, 6],                                                // Höchstzahl Auftritte je Kapitel
  start: [0, 420, 240, 240, 200, 160],                                    // frühestens nach s im Kapitel
  seeMin: .6, seeMax: 2.0, litThr: .965, viewThr: .88, litDist: 26, nearHide: 12, ruhe: 90,
  dist: { reh: [22, 35], hirsch: [35, 45], hirschding: [26, 42], fleisch: [10, 20] },
  speed: { folgen: 1.3, lauern: .5, rueck: 1.6 },
};
const WENDIGO_TEXTE = {   // fertige Zeilen (Konzept §4); Ziel: gedanke(id, …) bzw. story.lore
  g_hall: 'Ich hab gerufen. Der Wald hat es behalten.',
  g_fell: 'Das ist kein Wild, das hängen bleibt. Das hat sich ausgezogen.',
  g_mast: 'Zwei Masten. Gestern waren es keine zwei.',
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
// Ereignisse: id, Kapitel, Art (ton | form | spur | kadaver | text), Form, Bedingung (nur Ort/Zeit; Ruhe prüft die Regie), Abhängigkeit
const WD_AUFTRITTE = [
  { id: 'k1_hall', k: 1, art: 'ton', cond: () => wd_aussen(), gedanke: 'g_hall' },
  { id: 'k1_fell', k: 1, art: 'spur', was: 'haut', cond: () => wd_aussen(), lore: 'wd_haut', gedanke: 'g_fell', nach: ['k1_hall'] },
  { id: 'k1_mast', k: 1, art: 'form', form: 'hirschding', still: true, dunkel: true, nacht: true, cond: () => wd_aussen(), gedanke: 'g_mast', nach: ['k1_fell'] },
  { id: 'k2_schacht', k: 2, art: 'text', cond: () => true, gedanke: 'g_schacht' },
  { id: 'k2_bestand', k: 2, art: 'text', cond: () => true, lore: 'wd_bestand' },
  { id: 'k2_futter', k: 2, art: 'text', cond: () => true, lore: 'wd_futter', nach: ['k2_bestand'] },
  { id: 'k3_funk', k: 3, art: 'ton', cond: () => true, gedanke: 'g_band', nur: 'hook' },
  { id: 'k3_reh', k: 3, art: 'form', form: 'reh', rueck: true, cond: () => wd_aussen() && wd_tag() !== 'nacht', gedanke: 'g_reh' },
  { id: 'k4_fenster', k: 4, art: 'ton', cond: () => true, gedanke: 'g_fenster', nur: 'hook' },
  { id: 'k4_spur', k: 4, art: 'spur', was: 'huf_neben', cond: () => wd_aussen(), lore: 'wd_spur', gedanke: 'g_spur' },
  { id: 'k4_aas', k: 4, art: 'kadaver', cond: () => wd_aussen(), gedanke: 'g_aas', nach: ['k4_spur'] },
  { id: 'k5_nebel', k: 5, art: 'form', form: 'hirsch', still: true, nacht: true, cond: () => wd_aussen(), gedanke: 'g_nebel', mal: 2 },
  { id: 'k5_kratz', k: 5, art: 'spur', was: 'kratz', cond: () => wd_aussen(), gedanke: 'g_kratz', nach: ['k5_nebel'] },
  { id: 'k5_stehen', k: 5, art: 'form', form: 'hirschding', still: true, dunkel: true, nacht: true, cond: () => wd_aussen(), gedanke: 'g_gitter', nach: ['k5_kratz'] },
  { id: 'k5_blut', k: 5, art: 'kadaver', gross: true, cond: () => wd_aussen(), gedanke: 'g_kinder', lore: 'wd_reihe', nach: ['k5_stehen'], blutdurst: true },
];
const wd_S = { ready: false, mode: 'schlaf', done: new Set(), n: {}, wissen: 0, t: 0, kT: 0, k: 0, next: 0, ruheBis: 0, A: null, ev: null, models: {}, loading: {}, dec: [], trail: [], trailT: 0,
  log: [], stat: { auftritte: 0, gesehen: 0, rueckzug: 0, spuren: 0, kadaver: 0, hart: 0 }, seenT: 0, lastPos: new THREE.Vector3(), v: 0, litT: 0, tmp: new THREE.Vector3() };
MOD_SAVE.push(['wendigo', () => ({ done: [...wd_S.done], n: wd_S.n, wissen: wd_S.wissen }),
  v => { (v.done || []).forEach(k => wd_S.done.add(k)); wd_S.n = v.n || {}; wd_S.wissen = v.wissen || 0; }]);

// ---------------------------------------------------------------- Zustandsabfragen (alles typeof-geprüft)
function wd_k() { try { return typeof curChapter === 'function' ? curChapter() : 1; } catch (e) { return 1; } }
function wd_aussen() { return !state.inBasement && state.zone !== 'canal' && !(typeof indoorRect === 'function' && indoorRect()); }
function wd_tag() { try { if (typeof nat !== 'undefined' && nat.night !== undefined) return nat.night > .5 ? 'nacht' : 'tag'; if (typeof WL !== 'undefined' && WL.night !== undefined) return WL.night > .5 ? 'nacht' : 'tag'; } catch (e) {} return 'x'; }
function wd_ruhig() {
  if (!state.started || menu.attract || state.talking || state.ending || state.blackout || (typeof ui !== 'undefined' && ui.overlay) || (typeof scripted !== 'undefined' && scripted) || (typeof dir !== 'undefined' && dir.busy)) return false;
  if (typeof hunt !== 'undefined' && hunt.on) return false;
  if (typeof spannung_traurig === 'function' && spannung_traurig()) return false;
  if (typeof SP !== 'undefined' && (SP.chase || SP.stress > .4)) return false;
  return true;
}
function wd_dist(p) { const P = player.pos; return Math.hypot(p.x - P.x, p.z - P.z); }
function wd_facing(x, y, z) { try { return typeof leben_facing === 'function' ? leben_facing(x, y, z) : -1; } catch (e) { return -1; } }
function wd_los(x, y, z) { try { return typeof hungrige_los === 'function' ? hungrige_los(x, y, z) : true; } catch (e) { return true; } }
function wd_lit(p, dMax = WD_PARAM.litDist) { try { const L = typeof tausch_licht === 'function' ? tausch_licht() : null; const an = typeof flashOn !== 'undefined' ? flashOn : (L && L.an); return !!an && !state.blackout && wd_dist(p) < dMax && wd_facing(p.x, p.y + 1.2, p.z) > WD_PARAM.litThr; } catch (e) { return false; } }
function wd_spot(dMin, dMax, spread = .5, voraus = true) {
  const P = player.pos; let f; try { f = flatDir(); } catch (e) { f = new THREE.Vector3(0, 0, 1); } if (!voraus) f.negate();
  for (let k = 0; k < 30; k++) {
    const a = Math.atan2(f.x, f.z) + (Math.random() * 2 - 1) * spread, d = dMin + Math.random() * (dMax - dMin), x = P.x + Math.sin(a) * d, z = P.z + Math.cos(a) * d;
    try { if (typeof leben_inHouse === 'function' && leben_inHouse(x, z, 1.5)) continue; if (typeof leben_free === 'function' && !leben_free(x, z, .5, .9)) continue; } catch (e) {}
    const sg = typeof solidGround === 'function' ? solidGround(x, P.y + 1.2, z) : 0; const y = sg > -1 ? Math.max(0, sg) : 0;
    if (voraus && !wd_los(x, y + 1, z)) continue; return [x, y, z]; }
  return null;
}
function wd_log(s) { wd_S.log.push([Math.round(wd_S.t), s]); if (wd_S.log.length > 40) wd_S.log.shift(); }

// ---------------------------------------------------------------- Modelle und Akteur (ein Akteur, eine Form zur Zeit)
const WD_CLIPS = {
  hirschding: { idle: 'stehen', walk: 'gehen', run: 'sturm', lauern: 'lauern', beobachten: 'beobachten', bruellen: 'schrei', fressen: 'fressen', uebergang: 'uebergang' },
  _tier: { idle: /IdleBreathe$/, walk: /Walk$/, run: /Run$/, lauern: 'lauern', beobachten: 'beobachten', bruellen: 'bruellen', fressen: 'fressen', uebergang: 'uebergang' },
};
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
      let meta = {}; try { const e = src.userData && (src.userData.motion || src.userData.gltfExtensions); meta = typeof src.userData.motion === 'string' ? JSON.parse(src.userData.motion) : (src.userData.motion || {}); } catch (e) {}
      const M = { form, g, o, mx, A, morph, meta, cur: null, name: '', src };
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
  M.g.scale.setScalar(o.scale || 1);
  M.o.traverse(m => { if (m.isMesh) { const ms = [].concat(m.material); for (const mt of ms) { if (!mt.userData.wdC) mt.userData.wdC = mt.color ? mt.color.clone() : null; if (mt.color && mt.userData.wdC) mt.color.copy(mt.userData.wdC).multiplyScalar(o.dunkel ? .18 : 1); } } });
  wd_play(M, o.clip || 'idle', 0, 1); M.g.visible = true; wd_S.A = M; return M;
}

// ---------------------------------------------------------------- Spuren, Kadaver, Fund
function wd_huf(tex) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = 'rgba(30,18,10,.85)';
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(32 + sx * 9, 32, 6, 15, sx * .12, 0, 7); g.fill(); }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function wd_decal(x, z, rot, s = .32) {
  const sg = typeof solidGround === 'function' ? solidGround(x, player.pos.y + 1.2, z) : 0, y = (sg > -1 ? Math.max(0, sg) : 0) + .012;
  const S = wd_S; S.huf = S.huf || wd_huf(); S.hufM = S.hufM || new THREE.MeshBasicMaterial({ map: S.huf, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new THREE.Mesh(S.hufG || (S.hufG = new THREE.PlaneGeometry(1, 1)), S.hufM); m.scale.set(s, s * 1.2, 1); m.rotation.set(-Math.PI / 2, 0, rot); m.position.set(x, y, z); m.userData.noCol = true; scene.add(m); S.dec.push(m);
  if (S.dec.length > 40) { const o = S.dec.shift(); scene.remove(o); } return m;
}
function wd_spurReihe(kind) {
  const S = wd_S, P = player.pos;
  if (kind === 'huf_neben') {   // neben Lukes eigenem letzten Weg (Positionspuffer), 0,7 m seitlich, endet an seiner Fußspur
    const T = S.trail; if (T.length < 8) return false; const n = Math.min(T.length - 1, 18);
    for (let i = 0; i < n; i++) { const a = T[T.length - 1 - i], b = T[T.length - 2 - i] || a, dx = a[0] - b[0], dz = a[1] - b[1], l = Math.hypot(dx, dz) || 1; wd_decal(a[0] + dz / l * .7, a[1] - dx / l * .7, Math.atan2(dx, dz)); } return true; }
  const f = (() => { try { return flatDir(); } catch (e) { return new THREE.Vector3(0, 0, 1); } })(), x0 = P.x + f.x * 12, z0 = P.z + f.z * 12;
  for (let i = 0; i < 10; i++) wd_decal(x0 + f.x * i * .62 + (i % 2) * .12, z0 + f.z * i * .62, Math.atan2(f.x, f.z)); return true;
}
function wd_fund(pos) {   // Haut/Fell am Pfosten: kleines rotes Bündel + E-Interaktion (Fibel-Eintrag)
  const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5a1812, roughness: .3 })); m.scale.set(1, .4, 1.6); m.position.set(pos[0], pos[1] + .12, pos[2]); m.userData.noCol = true; scene.add(m); wd_S.dec.push(m);
  if (typeof interact === 'function') interact(m, 'Fell untersuchen', () => { const L = WENDIGO_TEXTE.lore.wd_haut; if (!story.lore.some(l => l.key === 'wd_haut')) story.lore.push({ key: 'wd_haut', title: L[0], html: L[1] }); try { openNote(L[0], L[1], 'wd_haut'); } catch (e) {} });
  return m;
}
async function wd_kadaver(gross, pos) {
  const M = await wd_bau('fleisch', false); if (!M) return null; const g = M.g;   // eigene Instanz (kein Klon einer Skelett-Figur)
  g.position.set(pos[0], pos[1], pos[2]); g.rotation.set(0, Math.random() * 6.28, 0); g.scale.setScalar(gross ? 1 : .55);
  try { const c = Object.keys(M.A).find(k => /Death$/.test(k)); if (c) { const a = M.A[c]; a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.play(); M.mx.setTime(a.getClip().duration); } } catch (e) {}
  g.visible = true; wd_S.dec.push(g); wd_S.stat.kadaver++; return g;
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
  S.next = S.t + WD_PARAM.gap[k][0] + Math.random() * (WD_PARAM.gap[k][1] - WD_PARAM.gap[k][0]); wd_log('fertig ' + e.id); try { if (typeof spannung_did === 'function') spannung_did('wd_' + e.art, 'amb'); } catch (x) {} try { if (typeof saveGame === 'function') saveGame(k); } catch (x) {} }
function wd_ton(art, p, gain) { try { if (Audio.wendigo && Audio.wendigo(art, p[0], p[1] || 1.2, p[2], gain)) return true; } catch (e) {} try { Audio.whisper(p[0], p[1] || 1.2, p[2], gain * 1.2); } catch (e) {} return false; }
async function wd_start(e, erzwingen) {
  const S = wd_S; if (S.ev) return false; S.ev = { e, t: 0, seen: 0, phase: 'an', form: e.form };
  const P = player.pos; wd_log('start ' + e.id);
  if (e.art === 'ton') { const f = wd_spot(26, 40, 1.4, false) || [P.x + 20, 0, P.z]; try { if (typeof spannung_hush === 'function') spannung_hush(2.5, .1); } catch (x) {} setTimeout(() => { wd_ton('ruf', f, .6); wd_text(e); }, 1200); S.ev.phase = 'aus'; S.ev.t = -3; }
  else if (e.art === 'text') { wd_text(e); S.ev.phase = 'aus'; S.ev.t = -1; }
  else if (e.art === 'spur') {
    if (e.was === 'haut') { const f = wd_spot(14, 24, .45); if (!f) { S.ev = null; return false; } wd_fund(f); wd_decal(f[0] + .3, f[2], 0); wd_decal(f[0] + .3, f[2] + .6, 0); wd_S.stat.spuren++; }
    else if (e.was === 'kratz') { if (!wd_kratz()) { S.ev = null; return false; } }
    else if (!wd_spurReihe(e.was)) { S.ev = null; return false; }
    S.stat.spuren++; setTimeout(() => wd_text(e), 1500); S.ev.phase = 'aus'; S.ev.t = -2; }
  else if (e.art === 'kadaver') { const f = wd_spot(e.gross ? 16 : 10, e.gross ? 28 : 18, .5); if (!f) { S.ev = null; return false; } const g = await wd_kadaver(!!e.gross, f);
    if (e.blutdurst) { try { if (typeof spannung_hush === 'function') spannung_hush(3, .1); } catch (x) {} wd_ton('fleisch', f, .7); setTimeout(() => wd_ton('ruf', [f[0] + 30, 1.5, f[2] + 30], .8), 600); }
    setTimeout(() => wd_text(e), 1800); S.ev.phase = 'aus'; S.ev.t = -2; }
  else if (e.art === 'form') {
    const d = WD_PARAM.dist[e.form] || [26, 40], f = wd_spot(d[0], d[1], .55); if (!f) { S.ev = null; return false; }
    const M = await wd_zeige(e.form, f, { dunkel: !!e.dunkel, clip: e.form === 'hirschding' ? 'beobachten' : 'idle', scale: e.form === 'hirschding' ? .95 : 1 }); if (!M) { S.ev = null; return false; }
    S.ev.phase = 'beobachten'; S.seenT = 0; S.stat.gesehen += 0; wd_ton('knochen', f, .2); }
  return true;
}
function wd_nah() { const A = wd_S.A; return !!(A && A.g.visible && wd_dist(A.g.position) < 40); }   // für BEOB_SPERREN
function wd_kratz() {
  // vier Striche in 2,3 m Höhe an der Außenwand des nächsten Hauses (indoorRects: x0, x1, zb, zf)
  const P = player.pos; let best = null, bd = 1e9; try { for (const r of (typeof indoorRects !== 'undefined' ? indoorRects : [])) { const cx = Math.max(r.x0, Math.min(P.x, r.x1)), cz = Math.max(r.zb, Math.min(P.z, r.zf)), d = Math.hypot(P.x - cx, P.z - cz); if (d < bd && d > 1.5) { bd = d; best = [r, cx, cz]; } } } catch (e) {}
  if (!best || bd > 30) return false; const [r, cx, cz] = best; const m = new THREE.Group();
  for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.012, .34), new THREE.MeshBasicMaterial({ color: 0x1a120c, polygonOffset: true, polygonOffsetFactor: -2 })); l.position.set((i - 1.5) * .05, 0, 0); l.rotation.z = (i - 1.5) * .05; m.add(l); }
  const onX = Math.abs(P.x - cx) > Math.abs(P.z - cz); m.position.set(onX ? (P.x < cx ? r.x0 : r.x1) + (P.x < cx ? -.02 : .02) : cx, 2.3, onX ? cz : (P.z < cz ? r.zb - .02 : r.zf + .02)); m.rotation.y = onX ? Math.PI / 2 : 0; m.userData.noCol = true; scene.add(m); wd_S.dec.push(m); return true;
}

// ---------------------------------------------------------------- Mensch im Fenster (Hofers Gesicht auf falschem Körper)
// Nutzt fensterfigur.js (ff_neu: echter 3D-Körper hinter dem Glas) mit dem Menschenmodell 'polizist' (figuren.js: HOFER → 'polizist'): der Körper steht, der Kopf ist 2,1 rad zu weit gedreht
// und folgt Luke mit Verzögerung. Gesicht „Hofer“ = das Polizisten-Gesicht des Spiels (Beweis-7-Foto), dunkel und ohne Atem (Mikroatmung wird abgeschaltet).
// Auslöser: nach Kapitel 4 (S.wissen) als Wiedererkennen, davor nur als „Mensch“ – Entscheidung 8 in wendigo_konzept.md.
function wd_fensterHofer(dauer = 3.4) {
  try {
    if (typeof ff_neu !== 'function' || typeof beob_fenster !== 'function') return false;
    const P = player.pos, f = beob_fenster(P.x, P.z, 28); if (!f) return false;
    const W = f.W, nx = Math.sin(W.ry), nz = Math.cos(W.ry);
    const rec = ff_neu(W.g, W.x + nx * .058, W.y, W.z + nz * .058, W.ry, W.pw, W.ph, 'polizist', { warm: false, tief: .55, dunkel: .5 }); if (!rec) return false;
    rec.ziel = 1; wd_S.fenster = rec;
    const t0 = performance.now(); const twist = () => { try {
      const hd = rec.P && rec.P.rig && rec.P.rig.head;
      if (hd && !rec.wdTw) { rec.wdTw = 1; if (rec.P.mv) rec.P.mv.autoLook = null; if (typeof anim_ueber === 'function') anim_ueber(hd, () => { hd.rotation.y += 2.1 * Math.min(1, (performance.now() - t0) / 1800); }); }
    } catch (e) {} }; const iv = setInterval(twist, 250);
    setTimeout(() => { rec.ziel = 0; }, dauer * 1000);
    setTimeout(() => { clearInterval(iv); try { if (rec.quad && rec.quad.parent) rec.quad.parent.remove(rec.quad); const i = FF.recs.indexOf(rec); if (i >= 0) FF.recs.splice(i, 1); } catch (e) {} wd_S.fenster = null; }, dauer * 1000 + 3500);
    return true;
  } catch (e) { console.warn('Wendigo: Fenster', e); return false; }
}

// ---------------------------------------------------------------- Takt
function wd_tick(dt) {
  const S = wd_S; if (!S.ready || !state.started || menu.attract) return; S.t += dt; const k = wd_k();
  if (k !== S.k) { S.k = k; S.kT = 0; S.next = S.t + WD_PARAM.start[Math.min(k, 5)] * (.8 + Math.random() * .4); wd_hide(); S.ev = null; for (const o of S.dec) { try { scene.remove(o); } catch (e) {} } S.dec.length = 0; wd_log('Kapitel ' + k); }
  S.kT += dt; S.mode = k >= 6 ? 'k6' : S.ev ? S.ev.phase : 'schlaf'; if (k >= 6 || k < 1) return;
  // Pfad-Puffer (für die Hufspur neben Lukes Weg), alle 0,8 m
  const P = player.pos; if (Math.hypot(P.x - S.lastPos.x, P.z - S.lastPos.z) > .8) { S.trail.push([P.x, P.z]); if (S.trail.length > 120) S.trail.shift(); S.lastPos.set(P.x, 0, P.z); }
  const ev = S.ev;
  if (!ev) {
    if (S.t < S.next || S.t < S.ruheBis) return; const cnt = WD_AUFTRITTE.filter(e => e.k === k).reduce((a, e) => a + (S.n[e.id] || 0), 0); if (cnt >= WD_PARAM.max[k]) return;
    if (!wd_ruhig() || !wd_aussen()) return;
    let ok = true; try { if (typeof spannung_can === 'function') ok = spannung_can('wd_ev', 'amb'); } catch (e) {} if (!ok) return;
    const e = wd_wahl(); if (!e) { S.next = S.t + 30; return; } wd_start(e); return; }
  ev.t += dt; const A = S.A;
  if (ev.phase === 'aus') { if (ev.t >= 0) { wd_fertig(ev.e); S.ev = null; } return; }
  if (!A) { if (ev.t > 20) { S.ev = null; } return; }
  A.mx.update(dt); const p = A.g.position, d = wd_dist(p), cam = camera.position;
  // Kopf/Körper zu Luke wenden: in Rasten (≈ 20°), kein weiches Folgen („Schädel aufgesteckt“)
  const want = Math.atan2(P.x - p.x, P.z - p.z); let df = Math.atan2(Math.sin(want - A.g.rotation.y), Math.cos(want - A.g.rotation.y)); if (Math.abs(df) > .35) { A.g.rotation.y += Math.round(df / .35) * .35; try { wd_ton('knochen', [p.x, 1.2, p.z], .12); } catch (x) {} }
  if (ev.e.rueck && ev.phase === 'beobachten') { const sp = .9; p.x += (p.x - P.x) / (d || 1) * sp * dt; p.z += (p.z - P.z) / (d || 1) * sp * dt; wd_play(A, 'walk', .2, -1); }
  const inView = wd_facing(p.x, p.y + 1.2, p.z) > WD_PARAM.viewThr && d < 45;
  if (ev.phase === 'beobachten') {
    S.seenT = inView ? S.seenT + dt : Math.max(0, S.seenT - dt * .5);
    if (!ev.counted && S.seenT > WD_PARAM.seeMin) { ev.counted = true; S.stat.gesehen++; wd_text(ev.e); try { if (typeof spannung_schreck === 'function') spannung_schreck(1, 'wd_' + ev.e.id); } catch (x) {} }
    if (S.seenT > WD_PARAM.seeMax || (ev.counted && !inView) || wd_lit(p) || d < WD_PARAM.nearHide || ev.t > 45) { ev.phase = 'rueckzug'; ev.t = 0; S.stat.rueckzug++; A.g.visible = false; /* auftritt_reg blendet weich aus */ }
  } else if (ev.phase === 'rueckzug') {
    if (ev.t > 1.2) { wd_hide(); if (!ev.counted) wd_text(ev.e); wd_fertig(ev.e); S.ev = null; }
  }
}
WORLD_TICK.push(dt => { try { wd_tick(dt); } catch (e) { console.warn('Wendigo: Takt', e); wd_S.ready = false; } });

// ---------------------------------------------------------------- Einstieg
WORLD_MODS.push(['Wendigo (Präsenz, Vorboten, Formen Kap. 1–5)', async () => {
  const S = wd_S; S.ready = true; S.k = 0;
  try { if (typeof SP_GAP !== 'undefined') Object.assign(SP_GAP, { wd_ev: 240, wd_ton: 240, wd_form: 300, wd_spur: 300, wd_kadaver: 360, wd_text: 120 }); } catch (e) {}
  try { if (typeof BEOB_SPERREN !== 'undefined') BEOB_SPERREN.push(() => wd_nah()); } catch (e) {}
  // Vorladen (ruhig, nacheinander): Reh/Hirsch früh, Hirschding und Fleisch später – erst wenn das Kapitel läuft (Speicher/Ladezeit)
  const lade = async () => { for (const f of ['reh', 'fleisch', 'hirsch', 'hirschding']) { if (!state.started) { await new Promise(r => setTimeout(r, 4000)); continue; } await wd_modell(f); await new Promise(r => setTimeout(r, 2500)); } };
  setTimeout(lade, 90000);
  window.__wd = {
    S, WD_PARAM, WD_AUFTRITTE, WENDIGO_TEXTE,
    report: () => ({ mode: S.mode, k: S.k, t: Math.round(S.t), next: Math.round(S.next), done: [...S.done], n: S.n, stat: S.stat, log: S.log.slice(-12), modelle: Object.keys(S.models).filter(k => S.models[k]), kadaver: S.dec.length }),
    auftritt: id => { const e = WD_AUFTRITTE.find(x => x.id === id); return e ? wd_start(e, true) : false; },
    zettel: id => { const e = WD_AUFTRITTE.find(x => x.id === 'k2_' + id); if (e) { wd_text(e); wd_fertig(e); } },
    tonband: () => { try { subtitle('<i>' + WENDIGO_TEXTE.t_band + '</i>', 4200, 'BAND?'); } catch (e) {} const e = WD_AUFTRITTE.find(x => x.id === 'k3_funk'); if (e) { wd_text(e); wd_fertig(e); } },
    fenster: () => { const e = WD_AUFTRITTE.find(x => x.id === 'k4_fenster'); const ok = wd_fensterHofer(); if (e) { wd_ton('knochen', [player.pos.x + 6, 3, player.pos.z], .3); setTimeout(() => wd_text(e), ok ? 1500 : 0); wd_fertig(e); } return ok; },
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
  };
}]);
