// =====================================================================  TRAUM (Modul „traum“): Der Anfang – ein Traum, ein Rabe, die Abenteuerfibel
// Luke ist nach Lucys Anruf („Haus Nummer 7. Der Keller.“) die ganze Nacht nach Lost Eyengless gefahren und am Ortsschild im Auto eingeschlafen.
// Im Traum: die leere Straße seiner Kindheit im weißen Nebel. Ein Rabe landet auf einer Laterne und flüstert ihm zu, worum es geht –
// Lucy hat sich versteckt, die Stadt versteckt ein Geheimnis, und Luke versteckt sich vor sich selbst. Er gibt ihm die Abenteuerfibel zurück,
// das Heft, das Luke als Kind mit Jonas und Zayn vollgeschrieben hat: Darin steht ab jetzt jede Aufgabe und jeder Fund (Taste Tab).
// Dann wacht Luke auf – nicht im Auto, sondern mitten auf der Straße, im Regen: „Huh…? Warum stehe ich denn jetzt mitten in der Nacht bei Regen auf der Straße?“
// Filmische Umsetzung: Kamerafahrten (setCamOverride), Letterbox, Traumfilter, eigener Nebel, echter Raben-Scan (Modul whiskey), Traummusik (Modul klang).
const traum_S = { on: false, t: 0, shot: -1, book: null, skip: false, fog0: null, crow: null };
const TRAUM_SHOTS = [ // Kamera von → nach, Blick, Dauer, Zeilen [Text, Sprecher, Zeitpunkt in s]
  { from: [-44, 1.3, .6], to: [-18, 1.5, .2], look: 'perch', dur: 11, lines: [['Die Straße deiner Kindheit. Lost Eyengless. Kein Mensch. Kein Laut.', '', .8], ['Nur irgendwo ein Kind, das zählt. Leise. Bis siebzehn.', '', 6]] },
  { rel: 'perch', from: [-6, -1.6, 5], to: [-3.4, -1.2, 3.2], look: 'crow', dur: 10, crow: 'land', lines: [['Luke.', 'DER RABE', 2.2], ['Du hast lange geschlafen. Siebzehn Jahre lang.', 'DER RABE', 4.4]] },
  { rel: 'perch', from: [-1.7, -.3, 1.4], to: [-.95, -.05, .85], look: 'crow', dur: 13, lines: [['Deine Schwester ist nicht verschwunden. Sie hat sich versteckt. Vor etwas, das sucht.', 'DER RABE', .5], ['In dieser Stadt versteckt sich jeder vor irgendwem. Die Kinder vor dem Licht. Der Ritter vor seinem Kind.', 'DER RABE', 5.6], ['Und du … vor dir selbst.', 'DER RABE', 10.4]] },
  { rel: 'book', from: [1.1, 1.25, 1.9], to: [.5, .65, 1.0], look: 'book', dur: 16, crow: 'book', lines: [['Das ist deine Abenteuerfibel. Du hast sie als Kind geschrieben – mit Jonas und Zayn.', 'DER RABE', 1], ['Sie schreibt weiter. Alles, was du findest. Jeden Weg, den du gehen musst.', 'DER RABE', 6.2], ['Sieh hinein, wenn du nicht weiterweißt. Sie gehört wieder dir.', 'DER RABE', 11]] },
  { rel: 'book', from: [.38, .5, .62], to: [.28, .42, .46], look: 'crowHead', dur: 10, lines: [['Finde Lucy. Finde heraus, was mit dieser Stadt geschehen ist.', 'DER RABE', .6], ['Und finde heraus, wer du bist.', 'DER RABE', 5.2]] }];
const TRAUM_BOOK = { x: .1, z: .2 }, TRAUM_PERCH = { x: 0, y: 3, z: 0 }; // zur Laufzeit: die Laterne an der Kreuzung
function traum_css() { if (document.getElementById('traumCss')) return; const s = document.createElement('style'); s.id = 'traumCss';
  s.textContent = `body.cine #hud, body.cine #crosshair, body.cine #prompt, body.cine #objective, body.cine #sideInfo, body.cine #hudHint, body.cine #batt, body.cine #kbHud, body.cine #toast { opacity: 0 !important; transition: opacity .6s; }
  #traumBars::before, #traumBars::after { content: ''; position: fixed; left: 0; right: 0; height: 11vh; background: #000; z-index: 8; transition: transform 1.2s ease; } #traumBars::before { top: 0; transform: translateY(-100%); } #traumBars::after { bottom: 0; transform: translateY(100%); }
  body.cine #traumBars::before, body.cine #traumBars::after { transform: none; }
  #traumTitle { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 9; pointer-events: none; opacity: 0; transition: opacity 2s; font: italic 34px Georgia, serif; letter-spacing: .3em; color: #cfc6b2; text-shadow: 0 0 30px rgba(160,190,255,.35); }
  #traumSkip { position: fixed; right: 26px; bottom: 13vh; z-index: 9; font: 11px Georgia, serif; letter-spacing: .3em; color: #6d6555; opacity: 0; transition: opacity 1s; } body.cine #traumSkip { opacity: .8; }`;
  document.head.appendChild(s); for (const [id, txt] of [['traumBars', ''], ['traumTitle', 'Du träumst.'], ['traumSkip', 'KLICK · ÜBERSPRINGEN']]) { const d = document.createElement('div'); d.id = id; d.textContent = txt; document.body.appendChild(d); } }
WORLD_MODS.push(['Traum', async () => {
  traum_css(); const T = THREE;
  // Die Fibel: ein altes Kinderheft mit festem Einband, das im Traum auf dem nassen Asphalt liegt
  const cover = new T.MeshStandardMaterial({ roughness: .8, map: tex(cnv(256, (c, w) => { c.fillStyle = '#5a2a22'; c.fillRect(0, 0, w, w); for (let i = 0; i < 400; i++) { c.fillStyle = `rgba(0,0,0,${rand(.02, .08)})`; c.fillRect(rand(0, w), rand(0, w), rand(2, 18), 1); }
    c.strokeStyle = '#c9a36a'; c.lineWidth = 4; c.strokeRect(14, 14, w - 28, w - 28); c.fillStyle = '#e8dcc0'; c.font = 'bold 26px "Comic Sans MS", cursive'; c.textAlign = 'center'; c.fillText('MEINE', w / 2, 92); c.fillText('ABENTEUER-', w / 2, 128); c.fillText('FIBEL', w / 2, 164);
    c.font = '18px "Comic Sans MS", cursive'; c.fillStyle = '#d88a70'; c.fillText('GEHEIM!!', w / 2, 210); }), true) });
  const pages = new T.MeshStandardMaterial({ color: 0xe6dcc4, roughness: 1 });
  const book = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(.22, .03, .3), [pages, pages, cover, pages, pages, pages]); book.add(b); book.position.set(TRAUM_BOOK.x, .017, TRAUM_BOOK.z); book.rotation.y = .5; book.visible = false; book.userData.noCol = true; scene.add(book); traum_S.book = book;
  modItem('fibel', 'Abenteuerfibel', 'Dein Kinderheft, fester roter Einband, auf dem Deckel: MEINE ABENTEUERFIBEL – GEHEIM!! Früher standen eure Abenteuer darin. Jetzt schreibt es weiter: jede Aufgabe, jeder Fund. [Tab]', 'paper');
}]);
// Neuer Anfang statt der Texttafel: Traum → Aufwachen auf der Straße
runIntro = async function traum_intro() {
  const S = traum_S; if (S.on) return; S.on = true; S.skip = false; S.t = 0; S.shot = -1; if (typeof klang_S !== 'undefined') klang_S.intro = true;
  $('start').classList.remove('show'); Audio.init(); menu.attract = false; document.body.classList.remove('menu'); document.body.classList.add('cine');
  player.pos.set(-66, 0, 2); player.yaw = -PI / 2; player.pitch = 0; vel.set(0, 0, 0);
  $('fade').style.transition = 'none'; $('fade').style.background = '#000'; $('fade').style.opacity = 1;
  const title = $('traumTitle'); title.style.opacity = 1; Audio.whisper(-66, 1.6, 3, 2.6); if (typeof klang_dream === 'function') klang_dream(true);
  S.fog0 = { c: scene.fog.color.getHex(), d: scene.fog.density }; scene.fog.color.set(0x3a414c); scene.fog.density = .046; renderer.domElement.style.filter = 'grayscale(.55) brightness(1.12) contrast(.92) blur(.4px)';
  if (Audio.rain) Audio.rain.gain.setTargetAtTime(.02, Audio.ctx.currentTime, .5);
  { const L = [...lamps].sort((a, b) => Math.hypot(a.wx, a.wz) - Math.hypot(b.wx, b.wz))[0]; if (L) { TRAUM_PERCH.x = L.wx; TRAUM_PERCH.z = L.wz; TRAUM_PERCH.y = Math.max(2.4, typeof whiskey_perch === 'function' ? whiskey_perch(L.wx, L.wz) : 3); TRAUM_BOOK.x = L.wx + 1.3; TRAUM_BOOK.z = L.wz + 1.1; } }
  S.book.position.set(TRAUM_BOOK.x, .017, TRAUM_BOOK.z); S.book.visible = true; const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; S.crow = W && W.g ? W : null;
  if (S.crow) { S.crow.g.visible = true; S.crow.g.position.set(-30, 9, -20); S.crow.mode = 'intro'; }
  const skip = () => { S.skip = true; }; $('introSeq').classList.remove('show'); renderer.domElement.addEventListener('pointerdown', skip, { once: true }); document.addEventListener('keydown', e => { if (e.code === 'Escape' || e.code === 'Space') skip(); }, { once: true });
  await wait(3200); if (!S.skip) { title.style.opacity = 0; await wait(1400); }
  $('fade').style.transition = 'opacity 2.2s'; $('fade').style.opacity = 0; S.shot = 0; S.t = 0; traum_lines();
  setCamOverride((cam, dt) => traum_cam(cam, dt));
};
function traum_lines() { const sh = TRAUM_SHOTS[traum_S.shot]; if (!sh) return; const id = traum_S.shot;
  for (const [txt, who, at] of sh.lines) setTimeout(() => { if (traum_S.shot === id && !traum_S.skip) { subtitle(`<i>${txt}</i>`, Math.max(3600, txt.length * 58), who); if (who) { if (traum_S.crow) Audio.whisper(traum_S.crow.g.position.x, traum_S.crow.g.position.y, traum_S.crow.g.position.z, 1.4); } } }, at * 1000); }
function traum_crowPos(what) { const S = traum_S, W = S.crow; if (!W) return;
  if (what === 'land') { const p = TRAUM_PERCH; if (typeof whiskey_fly === 'function') whiskey_fly(new THREE.Vector3(p.x, p.y, p.z), () => { if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', .3); });
    else W.g.position.set(p.x, p.y, p.z); Audio.flap(p.x, p.y, p.z); setTimeout(() => Audio.caw(p.x, p.y, p.z), 1800); }
  if (what === 'book') { if (typeof whiskey_fly === 'function') whiskey_fly(new THREE.Vector3(TRAUM_BOOK.x + .05, .05, TRAUM_BOOK.z + .02), () => { if (typeof whiskey_play === 'function') whiskey_play('Hop', .2, true); }); Audio.flap(TRAUM_BOOK.x, .6, TRAUM_BOOK.z); } }
const _trV = new THREE.Vector3();
function traum_cam(cam, dt) {
  const S = traum_S; if (!S.on) return; S.t += dt; const sh = TRAUM_SHOTS[S.shot]; if (!sh) return;
  if (S.crow && S.crow.mx) S.crow.mx.update(dt); if (S.crow && S.crow.fl && typeof whiskey_S !== 'undefined') { /* Flug läuft im Modul whiskey nur mit gestartetem Spiel – hier selbst fortschreiben */ const F = S.crow.fl, g = S.crow.g; F.t = Math.min(1, F.t + dt / F.dur); const k = F.t, a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
    g.position.set(a * F.from.x + b * F.ctrl.x + c * F.to.x, a * F.from.y + b * F.ctrl.y + c * F.to.y, a * F.from.z + b * F.ctrl.z + c * F.to.z); if (F.t >= 1) { S.crow.fl = null; F.then && F.then(); } }
  if (S.t === dt || S.shotStarted !== S.shot) { S.shotStarted = S.shot; if (sh.crow) traum_crowPos(sh.crow); }
  const k = Math.min(1, S.t / sh.dur), e = k * k * (3 - 2 * k), o = sh.rel === 'perch' ? [TRAUM_PERCH.x, TRAUM_PERCH.y, TRAUM_PERCH.z] : sh.rel === 'book' ? [TRAUM_BOOK.x, 0, TRAUM_BOOK.z] : [0, 0, 0];
  cam.position.set(o[0] + sh.from[0] + (sh.to[0] - sh.from[0]) * e, Math.max(.25, o[1] + sh.from[1] + (sh.to[1] - sh.from[1]) * e), o[2] + sh.from[2] + (sh.to[2] - sh.from[2]) * e);
  if (sh.look === 'crow' && S.crow) _trV.copy(S.crow.g.position).add({ x: 0, y: .25, z: 0 }); else if (sh.look === 'crowHead' && S.crow) _trV.copy(S.crow.g.position).add({ x: 0, y: .32, z: 0 }); else if (sh.look === 'book') _trV.set(TRAUM_BOOK.x, .05, TRAUM_BOOK.z); else if (sh.look === 'perch') _trV.set(TRAUM_PERCH.x, 1.6, TRAUM_PERCH.z); else _trV.set(...(Array.isArray(sh.look) ? sh.look : [0, 1, 0]));
  cam.lookAt(_trV); cam.rotateZ(Math.sin(S.t * .4) * .02); if (typeof PERF_CULL !== 'undefined' && S.t < dt * 1.5) PERF_CULL.t = 0;
  if (S.skip || S.t >= sh.dur) { if (S.skip || S.shot >= TRAUM_SHOTS.length - 1) return traum_wake(); S.shot++; S.t = 0; traum_lines(); }
}
async function traum_wake() {
  const S = traum_S; if (S.waking) return; S.waking = true;
  if (!S.skip) { Audio.caw(0, .6, .4); Audio.scareSound('whisperBurst'); glitchV = 1; } $('fade').style.transition = 'opacity .25s'; $('fade').style.background = '#fff'; $('fade').style.opacity = 1; await wait(600);
  setCamOverride(null); S.on = false; document.body.classList.remove('cine'); renderer.domElement.style.filter = ''; scene.fog.color.setHex(S.fog0.c); scene.fog.density = S.fog0.d; S.book.visible = false;
  if (typeof klang_dream === 'function') klang_dream(false); if (typeof klang_S !== 'undefined') klang_S.intro = false;
  if (S.crow) { S.crow.g.visible = false; S.crow.mode = 'gone'; S.crow.fl = null; }
  $('fade').style.background = '#000'; await wait(500);
  window.__traumWake = () => traum_awake(); beginGame();
}
async function traum_awake() { // beginGame blendet ein; dann das Aufwachen
  window.__traumWake = null; shake = .03; Audio.heart(); if (Audio.rain) Audio.rain.gain.setTargetAtTime(.5, Audio.ctx.currentTime, 1.5); addItem('fibel');
  state.talking = true;
  await say([['Huh…? Warum stehe ich denn jetzt mitten in der Nacht bei Regen auf der Straße?', 5200, 'LUKE'], ['Das Auto … steht noch am Ortsschild. Ich bin hergelaufen. Im Schlaf.', 4600, 'LUKE'],
    ['In der Jackentasche: ein Kinderheft mit rotem Einband. Meine Abenteuerfibel. Die hab ich seit siebzehn Jahren nicht gesehen.', 5600]]);
  state.talking = false; questPop('ABENTEUERFIBEL', 'Taste Tab – Aufgaben, Funde, Inventar, Fotos');
  setTimeout(() => { if (typeof gedanke === 'function') gedanke('traum_lucy', 'Lucy. Seit dem 23. verschwunden. Und letzte Nacht ihr Anruf: „Haus Nummer 7. Der Keller.“ … Ich bin durchgefahren und im Auto eingeschlafen. Jetzt ist es schon wieder Nacht.', 0, 3); }, 2500);
  story.lore.push({ key: 'traum', title: 'Der Traum vom Raben', html: 'Die leere Straße, weißer Nebel. Ein Rabe auf einer Laterne:\n\n„Deine Schwester ist nicht verschwunden. Sie hat sich versteckt. Vor etwas, das sucht.“\n„In dieser Stadt versteckt sich jeder vor irgendwem. Die Kinder vor dem Licht. Der Ritter vor seinem Kind. Und du … vor dir selbst.“\n\nEr hat mir die Abenteuerfibel zurückgegeben: „Finde Lucy. Finde heraus, was mit dieser Stadt geschehen ist. Und finde heraus, wer du bist.“' });
}
WORLD_TICK.push(() => {}); // Eintrag für die Messanzeige (ein Tick je Modul)
window.__traum = { S: traum_S, start: () => runIntro(), applySave: d => applySave(d), loadSave: () => loadSave(), saveGame: c => saveGame(c) }; // Testzugriff
