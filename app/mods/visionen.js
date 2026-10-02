// =====================================================================  VISIONEN (Modul „visionen“): Hinweis-System aus Totems und Lichtsteinen
// · HINTS: gemeinsames Register offener Fundorte (Echos, Polaroids, Geheimnisse, Werkzeug, Story-Orte). Andere Module tragen sich mit hintAdd() ein.
// · Totem-Visionen: Wer ein Zählgestell berührt, sieht für ein paar Sekunden durch fremde Augen – einen Ort, der später wichtig wird.
//   Welche Vision kommt, hängt vom Spielstand ab (die wichtigste noch offene, die noch nicht gezeigt wurde). Danach: „Deutung“ (Säule zum nächsten Ziel).
// · Kinderblick (Taste G): Die gesammelten Lichtsteine hochhalten. Für einige Sekunden sieht Luke wie ein Kind: Lichtsäulen durch Wände
//   an allem, was hier noch zu finden ist; Gefahr (die Graue) leuchtet rot. Ladungen = Anzahl Steine, laden langsam nach.
const HINTS = [];
function hintAdd(h) { HINTS.push(h); return h; } // { id, x, y, z, open: () => bool, kind, near (m, nur in dieser Nähe) }
const HINT_COL = { echo: 0x9cc4ff, foto: 0xfff0cc, geheim: 0x7ff0d8, werkzeug: 0xffc070, story: 0xff7060, teil: 0xd9b3ff, gefahr: 0xff2a1a };
MOD_SAVE.push(['visionen', () => [...visionen_S.shown], v => v.forEach(id => visionen_S.shown.add(id))]);
const visionen_S = { kb: { charges: 0, rech: 0, t: 0, used: 0 }, pillars: [], V: null, shown: new Set(), deutT: 0, el: null, vig: null, flash: null, force: null };
let VISION_RECHARGE = 75; // s pro Ladung
// --- Lichtsäule: durch Wände sichtbar (depthTest aus), von unten nach oben ausblendend, pulsierend
const _kbMat = col => new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, side: THREE.DoubleSide,
  uniforms: { col: { value: new THREE.Color(col) }, a: { value: 0 }, t: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
  fragmentShader: 'uniform vec3 col; uniform float a, t; varying vec2 vUv; void main(){ float v = pow(1. - vUv.y, 2.2) * (.75 + .25 * sin(t * 5. + vUv.y * 20.)); float e = 1. - abs(vUv.x * 2. - 1.); gl_FragColor = vec4(col * v * (.35 + .65 * e) * a, 1.); }' });
function visionen_pillar() {
  const g = new THREE.Group(), m = _kbMat(0xffffff), beam = new THREE.Mesh(new THREE.CylinderGeometry(.32, .32, 24, 18, 1, true), m); beam.position.y = 12; beam.renderOrder = 998;
  const ring = new THREE.Mesh(new THREE.RingGeometry(.35, .75, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  ring.rotation.x = -PI / 2; ring.position.y = .05; ring.renderOrder = 998; g.add(beam, ring); g.visible = false; g.userData = { m, ring, delay: 0, life: 0, far: false }; g.traverse(o => { o.userData.noCol = true; o.frustumCulled = false; }); scene.add(g); return g;
}
function visionen_open(h) { try { return h.open(); } catch (e) { return false; } }
function visionen_near(maxD, P = player.pos) { // offene Hinweise nach Entfernung (nur in derselben „Welt“: Höhe und Kapitelbereich über die Distanz)
  return HINTS.filter(h => visionen_open(h)).map(h => ({ h, d: Math.hypot(h.x - P.x, h.z - P.z) })).filter(o => o.d < Math.min(maxD, o.h.near || 1e9) && Math.abs((o.h.y || 0) - P.y) < 12).sort((a, b) => a.d - b.d);
}
function visionen_stones() { return story.lore.filter(l => /^geh_stein_/.test(l.key)).length; }
function visionen_show(list, dur) { // Säulen setzen; erscheinen nacheinander wie eine Welle, die von Luke ausgeht
  const S = visionen_S; while (S.pillars.length < list.length) S.pillars.push(visionen_pillar());
  S.pillars.forEach((p, i) => { const o = list[i]; if (!o) { p.visible = false; p.userData.life = 0; return; }
    p.position.set(o.h.x, o.h.y || 0, o.h.z); const c = new THREE.Color(HINT_COL[o.h.kind] || 0xffffff); p.userData.m.uniforms.col.value.copy(c); p.userData.ring.material.color.copy(c);
    p.userData.delay = o.d / 30; p.userData.life = dur; p.userData.far = !!o.far; p.scale.set(o.far ? 1.8 : 1, 1, o.far ? 1.8 : 1); p.userData.track = o.track || null; p.visible = true; });
}
// --- Kinderblick (G)
function kinderblick() {
  const S = visionen_S, K = S.kb, n = visionen_stones();
  if (!n) { if (!K.hintT || performance.now() - K.hintT > 20000) { K.hintT = performance.now(); toast('Nichts in den Taschen, das im Dunkeln leuchtet.', 2600); } return; }
  if (K.t > 0) return;
  if (K.charges < 1) return toast(`Die Steine sind kalt. Sie brauchen noch ${Math.ceil(VISION_RECHARGE - K.rech)} Sekunden.`, 2600);
  K.charges--; K.t = 6.5 + n * .5; K.used++; const R = 38 + n * 6; // mehr Steine: länger und weiter
  const list = visionen_near(R).slice(0, 14);
  if (typeof hunt !== 'undefined' && hunt.on && grey.visible) list.unshift({ h: { x: grey.position.x, y: 0, z: grey.position.z, kind: 'gefahr' }, d: Math.hypot(grey.position.x - player.pos.x, grey.position.z - player.pos.z), track: grey });
  let say = '';
  if (!list.length) { const far = visionen_near(900)[0]; if (far) { list.push({ ...far, far: true }); say = 'Hier ist nichts mehr. Aber dort … weiter weg.'; } else say = 'Die Steine bleiben still. Hier ist alles gefunden.'; }
  visionen_show(list, K.t); S.el.classList.add('on'); renderer.domElement.style.filter = 'saturate(.35) contrast(1.12) brightness(1.08) hue-rotate(-8deg)';
  Audio.duck(K.t); Audio.heart(); glitchV = Math.max(glitchV, .35);
  const first = list.find(o => !o.far && o.h.kind !== 'gefahr') || list[0]; if (first) Audio.whisper(first.h.x, 1.4, first.h.z, 2.2);
  if (say) setTimeout(() => subtitle(`<i>${say}</i>`, 3600), 700);
  else if (K.used === 1) setTimeout(() => subtitle('<i>Die Steine werden warm. Und plötzlich sehe ich alles, wie ich es als Kind gesehen hab: wo man suchen muss.</i>', 5200, 'LUKE'), 900);
  if (list.some(o => o.h.kind === 'gefahr')) setTimeout(() => subtitle('<i>Rot. Da. Sie steht hinter der Wand. Sie wartet.</i>', 3600, 'LUKE'), 1600);
  visionen_hud(true);
}
function visionen_hud(show) { const S = visionen_S, n = visionen_stones(); if (!S.hud) return; S.hud.style.opacity = n && (show || S.kb.t > 0 || S.kb.charges < n) ? 1 : 0;
  S.hud.innerHTML = n ? `<b>G</b> ${'◆'.repeat(S.kb.charges)}<span style="opacity:.3">${'◆'.repeat(Math.max(0, n - S.kb.charges))}</span>` : ''; }
// --- Totem-Visionen: kleine Kamerafahrten durch fremde Augen (Luke bleibt stehen, der Blick geht woanders hin)
const VISIONS = [
  { id: 'keller', title: 'Hinter den Zeichnungen', open: () => !ch2.on && !ch3.on && !story.items.includes('brechstange'),
    shots: [{ from: [26, 2.4, -2.5], to: [26, 2.1, -6.5], look: [26, 2.6, -15], dur: 4.2, text: 'Nr. 7. Hildes Haus. Das Licht im Hauswirtschaftsraum geht an. Niemand drin.' },
      { from: [24.5, 1.9, -19.5], to: [25.8, 1.7, -20.2], look: [26.5, 1.05, -20.7], dur: 4.4, text: 'Ihre Werkbank. Unter dem Tuch: Eisen. Schwer genug für eine Wand.', inside: true },
      { from: [B.x - 1, 1.55, B.z - 1], to: [B.x - 1.6, 1.4, B.z - 2.4], look: [B.x - 2, 1.2, B.z - 4], dur: 4, text: 'Die Kinderzeichnungen im Keller. Dahinter klingt die Wand hohl.', inside: true }] },
  { id: 'anwesen', title: 'Die Villa Seiler', open: () => !(typeof anwesen_S !== 'undefined' && anwesen_S.open),
    shots: [{ from: [-125, 1.8, 47], to: [-125, 2.6, 53], look: [-125, 6.5, 70], dur: 4.6, text: 'Das Anwesen. Oben brennt das eine Fenster. Es hat immer gebrannt.' },
      { from: [-122.6, 1.8, 57.8], to: [-124.3, 1.7, 59.6], look: [-125, 1.6, 61.4], dur: 4.8, text: 'Die Tür hat kein Schlüsselloch. Sie hat acht. Acht Teile eines Schlüssels – versteckt, wo Kinder sich verstecken.' },
      { from: [-110, 5.5, 57.5], to: [-113.5, 7.5, 55.5], look: [-125, 4, 66], dur: 4, text: 'Einer unter der Erde. Einer im Wasser. Einer ganz oben. Und eine Maschine, die sie wieder zusammenfügt.' }] },
  { id: 'gedenk', title: 'Das achte Grab', open: () => !story.lore.some(l => l.key === 'cleo_gedenk'),
    shots: [{ from: [-41, 2.4, 66.5], to: [-45, 1.9, 68.2], look: [-47.5, .7, 72.9], dur: 4.6, text: 'Das Gedenkfeld. Sieben Gräber. Daneben ein achter Stein, weiß gekratzt.', fig: { at: [-48.65, 72.1], rot: 0, s: .56 } },
      { from: [-47.4, 1.2, 70.2], to: [-47.9, 1.1, 70.8], look: [-48.65, .8, 72.3], dur: 4.2, text: 'Ein Mädchen steht davor. Sie wartet, dass jemand ihren Namen sagt. Keiner tut es.', fig: { at: [-48.65, 72.1], rot: 0, s: .56 } }] },
  { id: 'wald', title: 'Er wollte, dass ich ihm folge', open: () => !story.lore.some(l => l.key === 'zayn_ende'),
    shots: [{ from: [31, 2.1, 79], to: [31, 2, 86], look: [30, 1.4, 100], dur: 5.2, text: 'Der Spielplatz. Die Schaukel bewegt sich. Kein Wind.', fig: { at: [30, 93], to: [30, 99.5], rot: 0, s: .6 } },
      { from: [30.5, 1.5, 92], to: [30.2, 1.4, 94.5], look: [30, 1, 100], dur: 4.4, text: 'Er dreht sich um. Er winkt nicht. Er wartet nur. Dahinter: der Wald, in den keiner durfte.', fig: { at: [30, 100], rot: PI, s: .6 } }] },
  { id: 'rabe', title: 'Etwas, das warm ist', open: () => ch3.on && typeof whiskey_S !== 'undefined' && !whiskey_S.trade,
    shots: [{ from: [-27, 2.2, -2.5], to: [-27.1, 2, -6.8], look: [-27.2, 1.9, -11.2], dur: 4.8, text: 'Der Rabe auf Vegas’ Geländer. Er legt den Kopf schief. Zwischen seinen Füßen: ein Schlüssel.' },
      { from: [-26, 1.6, -9.5], to: [-26.6, 1.6, -10.3], look: [-27.2, 1.7, -11.2], dur: 3.8, text: 'Er will tauschen. Etwas, das warm ist und leuchtet.' }] },
  { id: 'steine', title: 'Sieben, die im Dunkeln zählen', open: () => visionen_stones() < 7,
    shots: [{ from: [-12.2, 1.5, -13.4], to: [-12.2, .9, -11.2], look: [-12.2, 0, -9.4], dur: 4.8, text: 'Mach das Licht aus. Dann siehst du uns. Wir zählen. Wir leuchten, wenn du uns hältst.', dark: true }] }];
function visionen_totem(i) {
  const S = visionen_S; if (S.V || state.talking || state.ending) return false;
  const v = VISIONS.find(x => !S.shown.has(x.id) && (() => { try { return x.open(); } catch (e) { return false; } })());
  if (!v) { // Deutung: das Gestell zeigt die Richtung zum wichtigsten offenen Ort
    if (S.deutT > 0) return toast('Das Gestell ist still. Gleich wieder.', 2200), true;
    const far = visionen_near(900).filter(o => o.d > 8)[0]; S.deutT = 45;
    if (!far) return toast('Das Gestell ist still. Hier hat niemand mehr etwas zu sagen.', 3000), true;
    visionen_show([{ ...far, far: true }], 22); Audio.whisper(far.h.x, 1.4, far.h.z, 2.4); toast('Folge dem Licht – dort ist noch etwas zu finden.', 3800); return true;
  }
  S.shown.add(v.id); visionen_play(v); return true;
}
function visionen_play(v) {
  const S = visionen_S; S.V = { v, i: -1, t: 0, fig: null }; state.talking = true; setScripted(() => S.V ? undefined : false);
  S.flash.style.transition = 'none'; S.flash.style.opacity = 1; Audio.stinger(false); Audio.duck(v.shots.reduce((a, s) => a + s.dur, 0) + 2); Audio.whisper(player.pos.x + 1, 1.6, player.pos.z, 2.6);
  renderer.domElement.style.filter = 'grayscale(.75) sepia(.35) contrast(1.25) brightness(1.12)'; S.vig.classList.add('on'); glitchV = .9; visionen_next();
  setCamOverride((cam, dt) => { const V = S.V; if (!V) return; const sh = v.shots[V.i], k = Math.min(1, V.t / sh.dur), e = k * k * (3 - 2 * k);
    cam.position.set(sh.from[0] + (sh.to[0] - sh.from[0]) * e, sh.from[1] + (sh.to[1] - sh.from[1]) * e, sh.from[2] + (sh.to[2] - sh.from[2]) * e);
    cam.lookAt(sh.look[0], sh.look[1], sh.look[2]); cam.rotateZ(Math.sin(V.t * 1.7) * .012); });
}
function visionen_next() {
  const S = visionen_S, V = S.V, v = V.v; V.i++; V.t = 0;
  if (V.fig) { V.fig.visible = false; V.fig = null; echoMat.opacity = 0; }
  if (V.i >= v.shots.length) return visionen_end();
  const sh = v.shots[V.i]; if (V.i > 0) { S.flash.style.transition = 'none'; S.flash.style.opacity = .85; glitchV = .6; Audio.play('static', { gain: .08, dur: .3 }); }
  requestAnimationFrame(() => { S.flash.style.transition = 'opacity .7s'; S.flash.style.opacity = 0; });
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; // Kamera springt: Instanzen um den neuen Blickpunkt einblenden
  if (sh.fig) { const F = echoFigs[0]; F.position.set(sh.fig.at[0], 0, sh.fig.at[1]); F.rotation.y = sh.fig.rot; F.scale.setScalar(sh.fig.s); F.visible = true; V.fig = F; echoMat.opacity = .3; if (typeof figuren_person === 'function') figuren_person(F, sh.fig.s < .58 ? 'kleine' : 'zayn'); } // Mädchen am achten Stein / Zayn auf dem Weg zum Wald
  V.flashWas = flashOn; if (sh.dark && flashOn) flashOn = false;
  subtitle(`<i>${sh.text}</i>`, sh.dur * 1000 - 200, V.i === 0 ? 'VISION' : '');
}
function visionen_end() {
  const S = visionen_S, v = S.V.v; S.flash.style.transition = 'none'; S.flash.style.opacity = 1; requestAnimationFrame(() => { S.flash.style.transition = 'opacity 1.2s'; S.flash.style.opacity = 0; });
  if (S.V.flashWas) flashOn = true; S.V = null; setCamOverride(null); state.talking = false; renderer.domElement.style.filter = ''; S.vig.classList.remove('on'); glitchV = .5; shake = .02;
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
  story.lore.push({ key: 'vision_' + v.id, title: 'Vision · ' + v.title, html: v.shots.map(s => s.text).join('\n\n') }); questPop('VISION', v.title);
  { const L = v.shots[v.shots.length - 1].look, P = player.pos; setTimeout(() => { visionen_show([{ h: { x: L[0], y: 0, z: L[2], kind: 'story' }, d: Math.hypot(L[0] - P.x, L[2] - P.z), far: true }], 25); toast('Folge dem Licht – dort ist, was du gesehen hast.', 3800); }, 2600); } // Vision → Lichtsäule zum gezeigten Ort (vorher wusste man nicht, wohin)
  const react = { keller: 'Das war … Nr. 7. Hildes Werkbank. Woher weiß ich, wie es da drin aussieht?', anwesen: 'Acht Teile. Ein Schlüssel für ein Haus, in dem seit Jahren keiner mehr wohnt. Okay. Ich such sie.', gedenk: 'Ein achtes Grab. Ich kenn sie. Ich weiß, dass ich sie kenne.',
    wald: 'Zayn. Das war Zayn. Er stand da, als wäre er nie weg gewesen.', rabe: 'Der Rabe will was. Was Warmes, das leuchtet. … Eine Batterie?', steine: 'Licht aus. Die Steine zeigen sich nur im Dunkeln.' }[v.id];
  if (react && typeof gedanke === 'function') gedanke('vision_' + v.id, react, 1200, 3); else if (react) setTimeout(() => subtitle(react, 4200, 'LUKE'), 1200);
}
WORLD_MODS.push(['Visionen', async () => {
  const S = visionen_S;
  const css = document.createElement('style'); css.textContent = `#kbVig{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .8s;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 45%,rgba(40,90,140,.28) 80%,rgba(10,30,60,.6) 100%);z-index:4}
#kbVig.on{opacity:1}#visVig{position:fixed;inset:0;pointer-events:none;opacity:0;transition:opacity .6s;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 35%,rgba(0,0,0,.55) 75%,#000 100%);z-index:4}#visVig.on{opacity:1}
#visFlash{position:fixed;inset:0;pointer-events:none;opacity:0;background:#e8f0ff;z-index:5;mix-blend-mode:screen}#kbHud{position:fixed;left:22px;bottom:64px;font:13px/1 system-ui,sans-serif;letter-spacing:.2em;color:#bfe6ff;text-shadow:0 0 8px #58a8ff;opacity:0;transition:opacity .6s;pointer-events:none;z-index:6}#kbHud b{border:1px solid #bfe6ff88;border-radius:3px;padding:1px 5px;margin-right:6px;font-weight:600}`;
  document.head.appendChild(css);
  for (const [id, k] of [['kbVig', 'el'], ['visVig', 'vig'], ['visFlash', 'flash'], ['kbHud', 'hud']]) { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); S[k] = d; }
  KEY_HOOKS.KeyG = kinderblick;
  const exp = () => { if (!window.G) return setTimeout(exp, 250); G.vis = { S, HINTS, kinderblick, visionen_totem, VISIONS, near: visionen_near }; // Testzugriff (G entsteht erst nach den Modulen)
    G.mods = { whiskey: typeof whiskey_S !== 'undefined' ? whiskey_S : null, albers: typeof albers_S !== 'undefined' ? albers_S : null, geheimnisse: typeof geheimnisse_S !== 'undefined' ? geheimnisse_S : null, ausruestung: typeof ausruestung_S !== 'undefined' ? ausruestung_S : null, ow: ausbau_ost_west_OW, anwesen: typeof anwesen_S !== 'undefined' ? anwesen_S : null }; }; exp();
  // --- Register füllen: alles, was im Grundspiel und in den Modulen gefunden werden kann
  for (const a of echoAnchors) hintAdd({ id: a.E.id, x: a.E.at[0], y: a.E.at[1] > 1.3 ? Y : 0, z: a.E.at[2], kind: 'echo', open: () => !echoSeen.has(a.E.id) });
  PHOTOS.forEach((p, i) => { const at = p.pos || p.candle || [p.zone[0], 0, p.zone[1]]; hintAdd({ id: 'foto' + i, x: at[0], y: i === 6 ? 0 : (at[1] > 2 ? Y : 0), z: at[2], kind: 'foto', open: () => !story.photos.has(i) && (i === 6) === !!state.inBasement }); });
  if (typeof geheimnisse_S !== 'undefined') {
    geheimnisse_S.stones.forEach(s => hintAdd({ id: s.key, x: s.o.position.x, y: 0, z: s.o.position.z, kind: 'geheim', near: 30, open: () => !geheimnisse_has(s.key) }));
    geheimnisse_S.wrecks.forEach(w => hintAdd({ id: w.key, x: w.o.position.x, y: 0, z: w.o.position.z, kind: 'geheim', open: () => !geheimnisse_has(w.key) }));
    geheimnisse_S.totems.forEach(T => hintAdd({ id: T.key, x: T.g.position.x, y: 0, z: T.g.position.z, kind: 'geheim', open: () => !geheimnisse_has(T.key) }));
  }
  if (typeof ausruestung_S !== 'undefined') for (const sp of ausruestung_S.spots) hintAdd({ id: sp.id, x: sp.x, y: sp.y > 2 ? Y : 0, z: sp.z, kind: 'werkzeug', open: () => !ausruestung_S.taken.has(sp.id) });
  if (typeof whiskey_S !== 'undefined') hintAdd({ id: 'whiskey', get x() { return whiskey_S.g ? whiskey_S.g.position.x : 0; }, get z() { return whiskey_S.g ? whiskey_S.g.position.z : 0; }, y: 0, kind: 'story', open: () => !!(whiskey_S.st && whiskey_S.mode === 'perch' && whiskey_S.g.visible) });
}]);
WORLD_TICK.push((dt, t) => {
  const S = visionen_S, K = S.kb; if (!S.el || !state.started) return; const n = visionen_stones();
  if (K.max !== n) { K.charges += Math.max(0, n - (K.max || 0)); K.max = n; K.charges = Math.min(K.charges, n); visionen_hud(true); setTimeout(() => visionen_hud(false), 4000); }
  if (K.charges < n) { K.rech += dt; if (K.rech >= VISION_RECHARGE) { K.rech = 0; K.charges++; visionen_hud(true); setTimeout(() => visionen_hud(false), 3000); } } else K.rech = 0;
  if (S.deutT > 0) S.deutT -= dt;
  if (K.t > 0) { K.t -= dt; if (K.t <= 0) { S.el.classList.remove('on'); if (!S.V) renderer.domElement.style.filter = ''; visionen_hud(false); } }
  for (const p of S.pillars) { if (!p.visible) continue; const u = p.userData; if (u.delay > 0) { u.delay -= dt; u.m.uniforms.a.value = 0; u.ring.material.opacity = 0; continue; }
    u.life -= dt; if (u.life <= 0) { p.visible = false; continue; } if (u.track) p.position.set(u.track.position.x, 0, u.track.position.z);
    const a = Math.min(1, (u.age = (u.age || 0) + dt) * 2) * Math.min(1, u.life / 1.2); u.m.uniforms.a.value = a * (u.far ? .8 : 1); u.m.uniforms.t.value = t; u.ring.material.opacity = a * .6; u.ring.scale.setScalar(1 + (t * .8 % 1) * .6); if (u.life <= dt * 1.5) u.age = 0; }
  if (S.V) { S.V.t += dt; const V = S.V, sh = V.v.shots[V.i];
    if (V.fig && sh.fig && sh.fig.to) { const k = Math.min(1, V.t / sh.dur); V.fig.position.x = sh.fig.at[0] + (sh.fig.to[0] - sh.fig.at[0]) * k; V.fig.position.z = sh.fig.at[1] + (sh.fig.to[1] - sh.fig.at[1]) * k; }
    if (V.fig) echoMat.opacity = .3 * (Math.random() < .06 ? .3 : 1);
    if (V.t >= sh.dur) visionen_next(); }
});
