// =====================================================================  TRAUM (Modul „traum“): Prolog „Du hast lange geschlafen“ (Fassung 3, AP-13 mit A-01)
// Luke ist nach Lucys Anruf („Haus Nummer 7. Der Keller.“) die ganze Nacht durchgefahren und am Ortsschild im Auto eingeschlafen. Der Prolog ist sein Traum:
// die Ahornstraße im weißen Nebel, leer, ohne Laut; irgendwo zählt ein Kind. A-01: Nach der Fahrt aus dem Nebel geht der Spieler selbst, sehr langsam (1,1 m/s,
// kein Rennen), auf die Kreuzung zu – die Laterne kommt nicht näher (Kamera-Offset „zieht die Kreuzung mit“, Gegenzoom hält die Laterne gleich groß),
// das Zählen wird mit jedem Schritt lauter, immer hinter ihm. Nach 25–35 s landet der Rabe; ab da wie geschrieben: nur der Rabe spricht (Miras Worte),
// er gibt die Abenteuerfibel zurück; Höhepunkt „Kum, Wîse“ (kino.js, 22 s, Kindergesicht 1,2 s). Aufwachen im Regen am Ortsschild, Autotür hinter ihm offen,
// Innenlicht an (strasse.js), die Fibel nass in der Jacke. Stimmen: Hook stimmen_spielen (X-1), bis dahin gehauchte Formant-Stimme.
const traum_S = { on: false, t: 0, shot: -1, book: null, skip: false, fog0: null, crow: null, free: null, zI: 0, zDone: false, snd: [], keyFn: null, ptrFn: null, nebelG: null, tf: null };
// 08.10.2026 (Nutzerentscheidung: Traum bleibt, wird besser): Rabe spätestens ~11 s nach Traumbeginn (kurze Einführung 3,8 s, dann Gehen 2–3,5 s, Anflug 4,8 s),
// scharfes Bild (kein Weichzeichner, Tiefe durch Nebelschichten), skripteter Anflug mit Gleiten, Bremsflügeln, Flare, Zehen-Griff und Ausbalancieren,
// Kamera mit Schrittgewicht, echte Samples im Ton, klarer Story-Kontext (Lucy, Haus Nr. 7, Fibel), danach die geführte Fibel-Tour (fibeltour.js).
const TRAUM_FREI = { v: 1.1, kx: .15, kz: .5, rad: 4, tMin: 1.8, tMax: 3.4, weg: 1.0, fovMax: 94, schritt: .74, flug: 4.8 };
const TRAUM_SHOTS = [ // Kamera von → nach, Blick, Dauer, Zeilen [Text, Sprecher, Zeitpunkt in s, Art ('gedanke' | 'frau')]
  { from: [-20, 1.3, .6], to: [-15.6, 1.5, .3], look: 'perch', dur: 3.8, frei: true, lines: [['Die Straße deiner Kindheit. Lost Eyengless. Kein Mensch. Kein Laut.', '', .5], ['Nur irgendwo ein Kind, das zählt.', '', 2.6]] },
  { rel: 'perch', from: [-6, -1.6, 5], to: [-3.4, -1.2, 3.2], look: 'crow', dur: 11.5, lines: [['Luke.', 'DER RABE', 1.4], ['Du hast lange geschlafen. Siebzehn Jahre lang.', 'DER RABE', 3],
    ['Ein Vogel, der meinen Namen kennt. Träume sind auch nicht mehr, was sie mal waren.', 'LUKE', 7.4, 'gedanke']] },
  { rel: 'perch', from: [-1.7, -.3, 1.4], to: [-.95, -.05, .85], look: 'crow', dur: 15, lines: [['Deine Schwester Lucy ist nicht verschwunden. Sie hat sich versteckt. Vor etwas, das sucht.', 'DER RABE', .4],
    ['Sie hat dich angerufen: „Haus Nummer 7. Der Keller.“ Dort fängt es an.', 'DER RABE', 5.4], ['In diesem Dorf versteckt sich jeder vor irgendwem. Und du, Kind … vor dir selbst.', 'DER RABE', 10.4]] },
  { rel: 'book', arm: true, from: [1.9, 1.25, 1.0], to: [1.0, .62, .45], look: 'book', dur: 17, crow: 'book', lines: [['Das ist deine Abenteuerfibel. Ein Kinderheft. Du, Jonas und Zayn habt eure Abenteuer hineingeschrieben.', 'DER RABE', 1],
    ['Jetzt schreibt sie weiter. Jede Aufgabe, jeden Fund, jeden Weg, den du gehen musst.', 'DER RABE', 6.4], ['Wenn du nicht weiterweißt, sieh hinein. Sie gehört wieder dir.', 'DER RABE', 11.6]] },
  // Rückfall, falls kino.js nicht bereit ist (sonst läuft hier die Kinosequenz „Kum, Wîse“, 22 s, nicht überspringbar)
  { rel: 'book', arm: true, from: [.62, .5, .38], to: [.46, .42, .28], look: 'crowHead', dur: 22, lines: [['Deine Aufgabe: Finde Lucy. Haus Nummer 7. Der Keller.', 'DER RABE', .6], ['Finde heraus, was mit diesem Dorf geschehen ist. Und wer du bist.', 'DER RABE', 5.2],
    ['Kum, Wîse.', 'DER RABE', 14.5, 'frau']] }];
const TRAUM_BOOK = { x: .1, z: .2 }, TRAUM_PERCH = { x: 0, y: 3, z: 0 }; // zur Laufzeit: die Laterne an der Kreuzung
function traum_css() { if (document.getElementById('traumCss')) return; const s = document.createElement('style'); s.id = 'traumCss';
  s.textContent = `body.cine #hud, body.cine #crosshair, body.cine #prompt, body.cine #objective, body.cine #sideInfo, body.cine #hudHint, body.cine #batt, body.cine #kbHud, body.cine #toast { opacity: 0 !important; transition: opacity .6s; }
  #traumBars::before, #traumBars::after { content: ''; position: fixed; left: 0; right: 0; height: 11vh; background: #000; z-index: 8; transition: transform 1.2s ease; } #traumBars::before { top: 0; transform: translateY(-100%); } #traumBars::after { bottom: 0; transform: translateY(100%); }
  body.cine #traumBars::before, body.cine #traumBars::after { transform: none; } body.traumFrei #traumBars::before { transform: translateY(-45%); } body.traumFrei #traumBars::after { transform: translateY(45%); }
  #traumTitle { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 9; pointer-events: none; opacity: 0; transition: opacity 2s; font: italic 34px Georgia, serif; letter-spacing: .3em; color: #cfc6b2; text-shadow: 0 0 30px rgba(160,190,255,.35); }
  #traumSkip { position: fixed; right: 26px; bottom: 13vh; z-index: 9; font: 11px Georgia, serif; letter-spacing: .3em; color: #6d6555; opacity: 0; transition: opacity 1s; } body.cine #traumSkip { opacity: .8; }
  #traumHint { position: fixed; left: 50%; bottom: 15vh; transform: translateX(-50%); z-index: 9; font: 12px Georgia, serif; letter-spacing: .45em; color: #a79d88; opacity: 0; transition: opacity 2.4s; pointer-events: none; text-shadow: 0 0 12px #000; } #traumHint.on { opacity: .75; }`;
  document.head.appendChild(s); for (const [id, txt] of [['traumBars', ''], ['traumTitle', 'Du träumst.'], ['traumSkip', 'KLICK · ÜBERSPRINGEN'], ['traumHint', 'W · GEHEN']]) { const d = document.createElement('div'); d.id = id; d.textContent = txt; document.body.appendChild(d); } }
// Die Fibel auf dem nassen Asphalt: echter Buch-Scan (w_buch), darauf der Einband als Aufkleber-Decal – Wachstuch, Aufkleber vom Kinderarzt, Filzstift-Etikett
function traum_einband(w, h) { return cnv(512, (c, s) => { const H = Math.round(s * h / w); c.canvas.height = H; const g = c.createLinearGradient(0, 0, s, H); g.addColorStop(0, '#7c2b22'); g.addColorStop(1, '#5a1c17'); c.fillStyle = g; c.fillRect(0, 0, s, H);
    for (let y = 8; y < H; y += 22) for (let x = 8 + (y / 22 % 2) * 11; x < s; x += 22) { c.fillStyle = 'rgba(236,214,190,.13)'; c.beginPath(); c.arc(x, y, 3.2, 0, 7); c.fill(); } // Wachstuch-Punkte
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,235,220'},${rand(.02, .08)})`; c.fillRect(rand(0, s), rand(0, H), rand(1, 14), 1); } // Knicke, Abrieb
    c.strokeStyle = 'rgba(240,220,200,.18)'; c.lineWidth = 7; c.strokeRect(3, 3, s - 6, H - 6); // abgestoßene Kanten
    c.save(); c.translate(s * .5, H * .36); c.rotate(-.04); c.fillStyle = '#e9e1cc'; c.fillRect(-s * .4, -H * .17, s * .8, H * .34); c.strokeStyle = 'rgba(120,100,70,.35)'; c.lineWidth = 2; c.strokeRect(-s * .4, -H * .17, s * .8, H * .34);
    c.fillStyle = '#1d2b5a'; c.textAlign = 'center'; c.font = `bold ${s * .085}px Caveat, "Comic Sans MS", cursive`; c.fillText('ABENTEUERFIBEL', 0, -H * .045);
    c.font = `${s * .058}px Caveat, "Comic Sans MS", cursive`; c.fillText('LUKE, JONAS, ZAYN', 0, H * .055); c.fillStyle = '#b3261e'; c.font = `bold ${s * .064}px Caveat, "Comic Sans MS", cursive`; c.fillText('GEHEIM!!', 0, H * .14);
    c.strokeStyle = '#b3261e'; c.lineWidth = 3; c.beginPath(); c.moveTo(-s * .12, H * .155); c.lineTo(s * .13, H * .15); c.stroke(); c.restore();
    c.save(); c.translate(s * .74, H * .76); c.rotate(.3); const r = s * .1; c.fillStyle = '#e8c53a'; c.beginPath(); c.arc(0, 0, r, .5, PI * 2 - .1); c.lineTo(r * .7, r * .5); c.closePath(); c.fill(); // Aufkleber vom Kinderarzt (eine Ecke abgeknibbelt)
    c.strokeStyle = '#a3561a'; c.lineWidth = 3; c.beginPath(); c.arc(0, -r * .05, r * .52, .3, PI - .3); c.stroke(); c.fillStyle = '#a3561a'; c.beginPath(); c.arc(-r * .3, -r * .3, r * .08, 0, 7); c.arc(r * .3, -r * .3, r * .08, 0, 7); c.fill();
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; c.fillRect(Math.cos(a) * r * 1.02 - 2, Math.sin(a) * r * 1.02 - 2, 4, 4); } c.restore();
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${rand(.05, .16)})`; c.beginPath(); c.arc(rand(0, s), rand(0, H), rand(1, 4), 0, 7); c.fill(); } }); } // Regentropfen
WORLD_MODS.push(['Traum', async () => {
  traum_css(); const T = THREE;
  const book = new T.Group(); book.visible = false; book.userData.noCol = true; scene.add(book); traum_S.book = book;
  try { const m = (await msModel('w_buch', 'model.glb')).clone(true); m.updateMatrixWorld(true); let bb = new T.Box3().setFromObject(m), sz = bb.getSize(new T.Vector3());
    if (sz.x < sz.y && sz.x <= sz.z) m.rotation.z = PI / 2; else if (sz.z < sz.y && sz.z < sz.x) m.rotation.x = PI / 2; // flach hinlegen
    msFit(m, .3, 'max'); const gm = msGround(m); gm.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); book.add(gm); gm.updateMatrixWorld(true);
    bb = new T.Box3().setFromObject(gm); sz = bb.getSize(new T.Vector3());
    const cv = traum_einband(sz.x, sz.z), deck = new T.Mesh(new T.PlaneGeometry(sz.x * .96, sz.z * .96), new T.MeshStandardMaterial({ map: tex(cv, true), roughness: .32, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 }));
    deck.rotation.x = -PI / 2; deck.position.set((bb.min.x + bb.max.x) / 2, bb.max.y + .0015, (bb.min.z + bb.max.z) / 2); deck.receiveShadow = true; book.add(deck); traum_S.bookH = sz.y;
  } catch (e) { console.warn('Traum: Fibel-Modell', e); }
  modItem('fibel', 'Abenteuerfibel', 'Dein dickes Kinderheft mit Wachstuch-Einband, ein Aufkleber vom Kinderarzt drauf: ABENTEUERFIBEL – LUKE, JONAS, ZAYN – GEHEIM!! Früher standen eure Abenteuer darin. Jetzt schreibt es weiter: jede Aufgabe, jeder Fund. [Tab]', 'paper');
  try { k1_ortsschildPrep(); } catch (e) { console.warn('Ortsschild 210', e); } // Kapitel 1 (W2-P3), siehe unten
}]);
// Neuer Anfang statt der Texttafel: Traum → Aufwachen auf der Straße
runIntro = async function traum_intro() {
  const S = traum_S; if (S.on) return; S.on = true; S.skip = false; S.waking = false; S.t = 0; S.nt = 0; S.tf = null; S.sit = null; S.zehen = undefined; S.zehenAn = false; S.shot = -1; S.free = null; S.zI = 0; S.zDone = false; S.shotStarted = -1; S.kino = false; if (typeof klang_S !== 'undefined') klang_S.intro = true;
  try { if (typeof klang_load === 'function') ['ui_fibel_1', 'ui_fibel_2', 'ui_seite', 'ui_stift', 'pk_metall_1', 'pk_metall_2', 'pk_metall_3', 'fx_atem', 'amb_wind'].forEach(n => klang_load(n).catch(() => {})); } catch (e) {} // Töne für Traum und Fibel-Tour vorab
  if (!window.__testMove) try { lockPointer(); } catch (e) {} // noch in der Klick-Geste des Menüs: Maus für die Traumstraße (A-01) sperren
  $('start').classList.remove('show'); Audio.init(); menu.attract = false; document.body.classList.remove('menu'); document.body.classList.add('cine');
  player.pos.set(-66, 0, 2); player.yaw = -PI / 2; player.pitch = 0; vel.set(0, 0, 0); setScripted(() => true); // die Spielfigur ruht (keine Schritte/Schwerkraft des Grundspiels)
  $('fade').style.transition = 'none'; $('fade').style.background = '#000'; $('fade').style.opacity = 1;
  const title = $('traumTitle'); title.style.opacity = 1; Audio.whisper(-66, 1.6, 3, 2.6); if (typeof klang_dream === 'function') klang_dream(true);
  S.fog0 = { c: scene.fog.color.getHex(), d: scene.fog.density, bg: scene.background, sky: sky.visible, gf: fogUniforms.color.value.clone() }; traum_nebel(); renderer.domElement.style.filter = 'grayscale(.5) brightness(1.06) contrast(1.07)'; // scharf: kein Weichzeichner, Tiefe kommt aus den Nebelschichten
  if (Audio.ctx) { const t0 = Audio.ctx.currentTime; if (Audio.rain) Audio.rain.gain.setTargetAtTime(.02, t0, .5); if (Audio.wind) Audio.wind.gain.setTargetAtTime(.035, t0, 1.2); } // „kein Wind“: nur ganz fern
  try { traum_orte(); } catch (e) { console.warn('Traum: Orte', e); }
  try { traum_schichten(); } catch (e) { console.warn('Traum: Nebelschichten', e); }
  if (Audio.ctx) S.snd.push(Audio.loop('amb_wind', { gain: .05, lp: 420, fadeIn: 5 })); // Windschatten: nur ein tiefes, hohles Streichen, kein Böenwind
  S.book.position.set(TRAUM_BOOK.x, 0, TRAUM_BOOK.z); S.book.rotation.y = .5; S.book.visible = true; const W = typeof whiskey_S !== 'undefined' ? whiskey_S : null; S.crow = W && W.g ? W : null;
  if (S.crow) { S.crow.g.visible = false; S.crow.fl = null; S.crow.g.position.set(TRAUM_PERCH.x, -60, TRAUM_PERCH.z); S.crow.mode = 'intro'; } // erst mit der Landung sichtbar
  // Überspringen: Klick / Leertaste / Esc – nicht auf der Traumstraße (dort sperrt der Klick die Maus, nur Esc überspringt) und nie in der Kinosequenz
  S.ptrFn = () => { if (!S.on || S.kino || S.waking) return; if (S.free) { if (document.pointerLockElement !== renderer.domElement) lockPointer(); return; } S.skip = true; };
  S.keyFn = e => { if (!S.on || S.kino || S.waking || e.repeat) return; if (e.code === 'Escape' || (e.code === 'Space' && !S.free)) S.skip = true; };
  $('introSeq').classList.remove('show'); renderer.domElement.addEventListener('pointerdown', S.ptrFn); document.addEventListener('keydown', S.keyFn);
  await wait(2300); if (!S.skip) { title.style.opacity = 0; await wait(900); }
  $('fade').style.transition = 'opacity 1.6s'; $('fade').style.opacity = 0; S.shot = 0; S.t = 0; traum_lines();
  setCamOverride((cam, dt) => traum_cam(cam, dt));
};
// Nebelwelt: Himmel weg, Hintergrund = Nebelfarbe – die Straße löst sich nach ~30 m auf, Lichter bleiben als Quellen im Dunst
function traum_nebel() { const c = 0x343a42; scene.fog.color.setHex(c); scene.fog.density = .052; sky.visible = false; scene.background = _trBg.setHex(c); fogUniforms.color.value.setHex(0x3a4048); rain.m.scale.setScalar(1e-4); } // im Traum regnet es nicht (nur leise zu hören)
const _trBg = new THREE.Color();
// Die Laterne an der Kreuzung: Sitzplatz des Raben oben auf dem Leuchtenkopf (Strahl von oben, einmal beim Start), die Fibel daneben auf dem Asphalt
function traum_orte() { const L = [...lamps].sort((a, b) => Math.hypot(a.wx, a.wz) - Math.hypot(b.wx, b.wz))[0]; if (!L) return; const T = THREE;
  TRAUM_PERCH.x = L.wx; TRAUM_PERCH.z = L.wz; let top = typeof whiskey_perch === 'function' ? whiskey_perch(L.wx, L.wz) : 0;
  if (!(top > 3)) try { const bb = new T.Box3(), cand = []; // Leuchtenkopf per Strahl suchen – nur feste, sichtbare Teile direkt über dem Lichtpunkt
    scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.position) return; const m = o.material; if (!m || (!Array.isArray(m) && (m.transparent || m.visible === false))) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); if (L.wx < bb.min.x - .05 || L.wx > bb.max.x + .05 || L.wz < bb.min.z - .05 || L.wz > bb.max.z + .05 || bb.max.y > 9 || bb.max.y < 3) return;
      for (let q = o; q; q = q.parent) if (!q.visible) return; cand.push(o); });
    const rc = new T.Raycaster(new T.Vector3(L.wx, 12, L.wz), new T.Vector3(0, -1, 0), 0, 11), h = cand.length ? rc.intersectObjects(cand, false)[0] : null; if (h) top = h.point.y; traum_S.perchN = cand.length;
  } catch (e) { console.warn('Traum: Laternenkopf', e); }
  TRAUM_PERCH.y = top > 3 ? top : 5.3; traum_S.perchL = L;
  // Fibel: im Lichtkegel der Laterne, seitlich des Auslegers, auf festem Boden – so bleibt auch der Blick der Kinosequenz (Kamera zwischen Rabe und Fibel) frei vom Leuchtenkopf
  const ax = -(L.az || 0), az = L.ax || 0, an = Math.hypot(ax, az), ux = an ? ax / an : 1, uz = an ? az / an : 0, sf = (x, z) => (Audio.surfaceAt ? Audio.surfaceAt(x, z) : 'wet');
  let bx = L.wx + ux * 1.1 + uz * .25, bz = L.wz + uz * 1.1 - ux * .25; for (const d of [1.1, 1.5, .7, 1.9]) { const x = L.wx + ux * d + uz * .25, z = L.wz + uz * d - ux * .25; if (sf(x, z) === 'wet' || sf(x, z) === 'hard') { bx = x; bz = z; break; } }
  TRAUM_BOOK.x = bx; TRAUM_BOOK.z = bz; TRAUM_BOOK.ux = ux; TRAUM_BOOK.uz = uz; }
// Stimme zur Zeile: Sprachausgabe (X-1), sonst gehaucht am Raben
function traum_stimme(key, who, art, p) { if (art === 'gedanke' || !who) return; if (typeof stimmen_spielen === 'function') { try { if (stimmen_spielen(key, [p.x, p.y, p.z])) return; } catch (e) {} }
  if (art === 'frau' && typeof kino_kum === 'function') return kino_kum(p); Audio.whisper(p.x, p.y, p.z, 1.4); }
function traum_lines() { const sh = TRAUM_SHOTS[traum_S.shot]; if (!sh) return; const id = traum_S.shot;
  sh.lines.forEach(([txt, who, at, art], i) => setTimeout(() => { const S = traum_S; if (S.shot !== id || S.skip || S.free || !S.on) return;
    subtitle(`<i>${txt}</i>`, Math.max(1700, txt.length * 62), who); const p = S.crow ? S.crow.g.position : camera.position; traum_stimme('traum_' + id + '_' + i, who, art, p); if (who === 'DER RABE' && typeof whiskey_sprechen === 'function') whiskey_sprechen(Math.max(1200, txt.length * 58)); }, at * 1000)); }
function traum_crowPos(what) { const S = traum_S, W = S.crow; if (!W) return;
  if (what === 'land') { const p = TRAUM_PERCH; if (W.g.visible && W.g.position.distanceTo(_trV.set(p.x, p.y, p.z)) < .4) { if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', .3); return; } // schon gelandet (A-01)
    W.g.visible = true; if (W.g.position.y < -10) W.g.position.set(p.x - 24, p.y + 7, p.z - 14);
    if (typeof whiskey_fly === 'function') whiskey_fly(new THREE.Vector3(p.x, p.y, p.z), () => { if (typeof whiskey_play === 'function') whiskey_play('IdleLookAround', .3); }); else W.g.position.set(p.x, p.y, p.z); }
  if (what === 'book') { if (typeof whiskey_fly === 'function') whiskey_fly(new THREE.Vector3(TRAUM_BOOK.x + .05, (traum_S.bookH || .04) + .01, TRAUM_BOOK.z + .02), () => { if (typeof whiskey_play === 'function') whiskey_play('Hop', .2, true); }); Audio.flap(TRAUM_BOOK.x, .6, TRAUM_BOOK.z); } }
// ---------------------------------------------------------------- Raben-Animation im Traum
// Hilfen: Smoothstep, Kamera-Atmen (unrunde Schwingungen), Nebelschichten (Tiefe ohne Unschärfe), Raben-Töne aus echten Aufnahmen
const traum_sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const _trP = new THREE.Vector3(), _trD = new THREE.Vector3(), _trQ = new THREE.Quaternion();
function traum_atem(t) { // natürliches Atmen und leichtes Stehwackeln (keine gleichmäßige Sinus-Schaukel)
  return { y: Math.sin(t * 1.62) * .0042 + Math.sin(t * .71 + 1.3) * .0025, x: Math.sin(t * .47 + .6) * .004 + Math.sin(t * 1.13) * .0015, rx: Math.sin(t * 1.62 + .4) * .0016 + Math.sin(t * .39) * .0022,
    ry: Math.sin(t * .53 + 2.1) * .0035 + Math.sin(t * 1.37) * .0012, rz: Math.sin(t * .4) * .012 + Math.sin(t * .91 + 1) * .004 }; }
// Nebelschichten: Dunstbänder in mehreren Tiefen und Höhen, die langsam die Straße entlangziehen – Parallaxe statt Weichzeichner
function traum_schichten() { const S = traum_S, T = THREE; if (S.nebelG) { S.nebelG.visible = true; return; }
  const g = new T.Group(); g.userData.noCol = true;
  const mk = band => tex(cnv(256, (c, s) => { c.clearRect(0, 0, s, s); for (let i = 0; i < (band ? 6 : 10); i++) { const x = rand(.14, .86) * s, y = (band ? rand(.42, .58) : rand(.3, .7)) * s, r = rand(.15, .3) * s;
        const gr = c.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(255,255,255,${rand(.4, .8).toFixed(2)})`); gr.addColorStop(.55, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        c.save(); c.translate(x, y); c.scale(band ? 2 : 1.3, band ? .42 : .85); c.fillStyle = gr; c.fillRect(-r, -r, 2 * r, 2 * r); c.restore(); } }), true);
  const maps = [mk(false), mk(false), mk(true), mk(true)];
  for (let i = 0; i < 16; i++) { const band = i % 3 === 2, m = new T.SpriteMaterial({ map: maps[(band ? 2 : 0) + (i % 2)], color: band ? 0x5d6671 : 0x78818b, transparent: true, opacity: 0, depthWrite: false }), sp = new T.Sprite(m);
    sp.scale.set(band ? rand(20, 30) : rand(14, 24), band ? rand(1.6, 2.4) : rand(4, 7), 1); sp.position.set(rand(-34, 12), band ? rand(.35, .8) : rand(1.5, 3.4), rand(-8, 8));
    sp.userData = { base: band ? rand(.3, .46) : rand(.16, .3), vx: rand(.12, .34) * (Math.random() < .8 ? 1 : -1), ph: rand(0, 6.28) }; sp.renderOrder = 2; g.add(sp); }
  scene.add(g); S.nebelG = g; }
function traum_schichtenTick(dt, t) { const G = traum_S.nebelG; if (!G || !G.visible) return; const c = camera.position;
  for (const sp of G.children) { const u = sp.userData, p = sp.position; p.x += u.vx * dt; if (p.x > 14) p.x = -36; else if (p.x < -36) p.x = 14;
    const d = Math.hypot(p.x - c.x, p.z - c.z); sp.material.opacity = u.base * traum_sm(2.2, 7, d) * traum_sm(0, 1.5, t) * traum_sm(-36, -30, p.x) * (1 - traum_sm(8, 14, p.x)) * (.88 + .12 * Math.sin(t * .3 + u.ph)); } }
function traum_schichtenWeg() { const S = traum_S, G = S.nebelG; if (!G) return; scene.remove(G); for (const sp of G.children) { if (sp.material.map) sp.material.map.dispose(); sp.material.dispose(); } S.nebelG = null; }
const traum_nm = (...n) => { const L = n.filter(k => Audio.buf && Audio.buf[k]); return L.length ? L[Math.floor(Math.random() * L.length)] : null; };
// Flügelschlag: weicher tiefer Stoß (Herzschlag-Aufnahme, stark tiefpassgefiltert = Luftverdrängung) plus leises Federrascheln (Buschrauschen, langsam, gedämpft) – keine Rauschblöcke
function traum_fluegel(p, v = 1) { const A = Audio; if (!A.ctx || !A.buf) return; const o = { x: p.x, y: p.y, z: p.z, ref: 3 };
  if (A.buf.heartbeat) A.play('heartbeat', { ...o, gain: .46 * v, rate: rand(1.12, 1.3), lp: 230, dur: .3 });
  const f = traum_nm('fx_busch_1', 'fx_busch_2', 'fx_busch_3', 'fx_busch_4', 'fx_busch_5', 'fx_busch_6'); if (f) A.play(f, { ...o, gain: .13 * v, rate: rand(.62, .8), lp: 1200, dur: .55 }); }
function traum_rabenruf(p, gain = .5, lp = 0) { const A = Audio; if (!A.ctx) return; const k = traum_nm('crow1', 'crow2'); if (k) A.play(k, { gain, rate: rand(.74, .82), vary: .05, x: p.x, y: p.y, z: p.z, ref: 5, ...(lp ? { lp } : {}) }); }
function traum_krallen(p) { const A = Audio; if (!A.ctx) return; const k = traum_nm('pk_metall_1', 'pk_metall_2', 'pk_metall_3'); if (k) { A.play(k, { gain: .1, rate: rand(1.5, 1.9), dur: .16, x: p.x, y: p.y, z: p.z, ref: 2 }); A.play(k, { gain: .06, rate: rand(1.7, 2.1), dur: .12, delay: .17, x: p.x, y: p.y, z: p.z, ref: 2 }); } }
function traum_atmen(v = 1) { const A = Audio; if (!A.ctx) return; const n = traum_nm('fx_atem'); if (n) A.play(n, { gain: .09 * v, lp: 2600, rate: rand(.9, 1.0), vary: .03 }); } // Lukes eigener Atem, leise im Kopf
// Zehen-Griff: nach dem Mixer die Zehenglieder um eine zur Zehenrichtung senkrechte, waagrechte Achse nach unten krümmen (Achse einmal aus der Pose bestimmt, in Knochenkoordinaten gespeichert)
function traum_zehen(k) { const S = traum_S, W = S.crow; if (!W || !W.m) return; let Z = S.zehen; if (Z === undefined && k < .02) return; // Achsen erst bestimmen, wenn die Füße die Landehaltung haben
  if (Z === undefined) { Z = S.zehen = []; try { W.g.updateMatrixWorld(true); const T = THREE, dls = new Map(), cand = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
      W.m.traverse(b => { if (!b.isBone || !/Toe/.test(b.name)) return; const kid = b.children.find(c => c.isBone && /Toe/.test(c.name)); let dl = kid ? kid.position.clone() : dls.get(b.parent); if (!dl || dl.lengthSq() < 1e-10) return; dl = dl.clone().normalize(); dls.set(b, dl); // Glied-Richtung in Knochenkoordinaten
        const wq = b.getWorldQuaternion(new T.Quaternion()), dW = dl.clone().applyQuaternion(wq); let best = null, bd = 0; // die Drehachse wählen, die die Zehenspitze am stärksten nach unten bewegt
        for (const a of cand) { const av = new T.Vector3(a[0], a[1], a[2]); if (Math.abs(av.dot(dl)) > .7) continue; const d2 = dW.clone().applyAxisAngle(av.clone().applyQuaternion(wq), .4), dy = d2.y - dW.y; if (dy < bd) { bd = dy; best = av; } }
        if (best && bd < -.02) Z.push({ b, q0: b.quaternion.clone(), ax: best }); });
    } catch (e) { Z.length = 0; } }
  if (!Z.length) return; if (k < .002) { if (S.zehenAn) { for (const z of Z) z.b.quaternion.copy(z.q0); S.zehenAn = false; } return; }
  S.zehenAn = true; for (const z of Z) { _trQ.setFromAxisAngle(z.ax, k * .55); z.b.quaternion.copy(z.q0).multiply(_trQ); } }
// Sitzender Rabe: Körper dreht sich langsam zu Luke, Kopf mit Blicksprüngen (Sakkaden) und Zucken, Atem und Gefieder-Aufplustern, Zehen halten fest
function traum_sitzD() { const S = traum_S; return S.sit || (S.sit = { hy: 0, hr: 0, hyT: 0, hrT: 0, sacT: .6, puff: 0, puffT: rand(2.5, 5), breath: 0, hw: 1, toe: 0, idleT: rand(3, 5) }); }
function traum_sitz(dt) { const S = traum_S, W = S.crow, g = W.g; if (!g.visible) return; const D = traum_sitzD();
  const want = Math.atan2(camera.position.x - g.position.x, camera.position.z - g.position.z); let diff = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y));
  if (S.free || (S.shot >= 1 && S.shot <= 2)) { g.rotation.y += diff * Math.min(1, dt * 1.1); diff = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y)); }
  D.sacT -= dt; if (D.sacT <= 0) { D.sacT = rand(.5, 2.1); D.hyT = Math.random() < .72 ? Math.max(-.95, Math.min(.95, diff)) + rand(-.18, .18) : rand(-1, 1); D.hrT = Math.random() < .3 ? rand(-.4, .4) : 0; }
  D.hyT = Math.max(-.95, Math.min(.95, D.hyT)); const dh = D.hyT - D.hy; D.hy += Math.sign(dh) * Math.min(Math.abs(dh), 8 * dt, .14, Math.abs(dh) * Math.min(1, dt * 22)); D.hr += (D.hrT - D.hr) * Math.min(1, dt * 8);
  D.idleT -= dt; if (D.idleT <= 0 && !S.tf && typeof whiskey_play === 'function') { D.idleT = rand(3.5, 7); const k = ['IdleLookAround', 'IdleLookAround', 'IdleScratchWing'][Math.floor(Math.random() * 3)]; whiskey_play(k, .4); if (k === 'IdleScratchWing') D.puff = Math.max(D.puff, .7); } // gelegentlich Gefieder ordnen
  D.puffT -= dt; if (D.puffT <= 0) { D.puffT = rand(2.5, 6); D.puff = Math.max(D.puff, rand(.35, .7)); D.hrT = rand(-.3, .3); } // Gefiederzucken
  D.puff = Math.max(0, D.puff - dt * .6); D.breath += dt * 2.5;
  const cn = W.cur && W.cur.getClip ? W.cur.getClip().name : '', eigen = /LookAround|Scratch|Stretch|Eat|Hop|Landing|TakeOff/.test(cn); D.hw += ((eigen ? .3 : 1) - D.hw) * Math.min(1, dt * 5);
  if (typeof whiskey_headApply === 'function' && W.head) whiskey_headApply(D.hy * D.hw, D.hr * D.hw);
  if (W.m && W.base) { const b = W.base * (1 + .012 * Math.sin(D.breath)), pf = 1 + .08 * Math.sin(Math.min(1, D.puff) * PI); W.m.scale.set(b * pf, b * (1 + .03 * (pf - 1)), b * pf); }
  traum_zehen(S.tf || g.position.y > 1 ? D.toe : 0); }
// Der Anflug: aus dem Nebel seitlich ins Bild, Gleitflug über den Asphalt, Bremsflügelschläge, Flare, Aufsetzen auf dem Leuchtenkopf, Zehen greifen, Ausbalancieren
function traum_anflugStart(cam) { const S = traum_S, W = S.crow, P = TRAUM_PERCH, T = THREE; if (!W || !W.g || typeof whiskey_play !== 'function') return false;
  const fx = P.x - cam.position.x, fz = P.z - cam.position.z, fl = Math.hypot(fx, fz) || 1, ax = fx / fl, az = fz / fl, lx = az, lz = -ax; // vor / links (aus Lukes Blick)
  const A = new T.Vector3(P.x + lx * 25 - ax * 4, P.y + 5.2, P.z + lz * 25 - az * 4), c1 = new T.Vector3(P.x + lx * 12 - ax * 7.5, P.y + 4.2, P.z + lz * 12 - az * 7.5), c2 = new T.Vector3(P.x + lx * 3.4 - ax * 1.6, P.y + 1.15, P.z + lz * 3.4 - az * 1.6), L = new T.Vector3(P.x, P.y, P.z);
  W.fl = null; W.mode = 'intro'; W.g.position.copy(A); W.g.visible = true; W.g.rotation.set(0, Math.atan2(L.x - A.x, L.z - A.z), 0); traum_sitzD().toe = 0;
  S.tf = { A, c1, c2, L, sec: 0, t: 0, dur: TRAUM_FREI.flug, bi: 0, stage: 0, caw1: false, caw2: false, touch: null, yaw: W.g.rotation.y, z0: 0,
    beats: [[.04, .5], [.11, .5], [.19, .55], [.26, .5], [.70, 1], [.745, .95], [.79, .9], [.835, .8], [.875, .7], [.91, .55], [.95, .4]] }; // Flügelschläge (Zeitpunkt 0–1, Stärke): erst ruhige Schläge, dann dicht und kräftig beim Bremsen
  whiskey_play('Fly', .1); return true; }
function traum_anflug(dt) { const S = traum_S, W = S.crow, g = W.g, tf = S.tf, D = traum_sitzD();
  if (!tf.touch) { tf.sec += dt; const t = tf.t = Math.min(1, tf.sec / tf.dur), u = .22 * t + .78 * (1 - (1 - t) * (1 - t)), w = 1 - u, A = tf.A, c1 = tf.c1, c2 = tf.c2, L = tf.L;
    _trP.set(w * w * w * A.x + 3 * w * w * u * c1.x + 3 * w * u * u * c2.x + u * u * u * L.x, w * w * w * A.y + 3 * w * w * u * c1.y + 3 * w * u * u * c2.y + u * u * u * L.y, w * w * w * A.z + 3 * w * w * u * c1.z + 3 * w * u * u * c2.z + u * u * u * L.z);
    _trD.set(3 * w * w * (c1.x - A.x) + 6 * w * u * (c2.x - c1.x) + 3 * u * u * (L.x - c2.x), 3 * w * w * (c1.y - A.y) + 6 * w * u * (c2.y - c1.y) + 3 * u * u * (L.y - c2.y), 3 * w * w * (c1.z - A.z) + 6 * w * u * (c2.z - c1.z) + 3 * u * u * (L.z - c2.z));
    const hl = Math.hypot(_trD.x, _trD.z) || 1e-4, yawT = Math.atan2(_trD.x, _trD.z), dy = Math.atan2(Math.sin(yawT - tf.yaw), Math.cos(yawT - tf.yaw)); tf.yaw += dy * Math.min(1, dt * 9); g.rotation.y = tf.yaw;
    const gl = Math.max(-.5, Math.min(.5, -Math.atan2(_trD.y, hl) * .8)), fla = traum_sm(.74, .96, t); g.rotation.x += ((gl * (1 - fla) - .55 * fla) - g.rotation.x) * Math.min(1, dt * 8); // Nase folgt der Bahn, im Flare steil aufgerichtet
    g.rotation.z += (Math.max(-.55, Math.min(.55, -(dy / Math.max(dt, 1e-3)) * .3)) - g.rotation.z) * Math.min(1, dt * 5); // in die Kurve legen
    g.position.copy(_trP); tf.z0 = g.rotation.z;
    while (tf.bi < tf.beats.length && t >= tf.beats[tf.bi][0]) { traum_fluegel(g.position, tf.beats[tf.bi][1]); tf.bi++; }
    if (!tf.caw1 && tf.sec > .25) { tf.caw1 = true; traum_rabenruf(g.position, .5, 2200); } if (!tf.caw2 && t > .5) { tf.caw2 = true; traum_rabenruf(g.position, .55); }
    if (tf.stage === 0 && t > .3) { tf.stage = 1; whiskey_play('Glide', .5); }
    if (tf.stage === 1 && t >= .68) { tf.stage = 2; const cd = W.A.Landing ? W.A.Landing.getClip().duration : 1; whiskey_play('Landing', .15, true, Math.max(.55, Math.min(1.3, cd / 1.5))); }
    D.toe = .6 * traum_sm(.92, 1, t);
    if (t >= 1) { tf.touch = { t: 0, w: 0 }; traum_krallen(g.position); } }
  else { const k = tf.touch, e = k.t += dt, L = tf.L; g.position.set(L.x, L.y - .045 * Math.sin(Math.min(1, e / .5) * PI), L.z); // Aufsetzen: kurz in die Knie
    g.rotation.x += (.035 * Math.sin(8 * e) * Math.exp(-3 * e) - g.rotation.x) * Math.min(1, dt * 4.5);
    g.rotation.z = tf.z0 * Math.exp(-5 * e) + .11 * Math.sin(10.5 * e) * Math.exp(-2.6 * e); // Ausbalancieren: schaukelt aus, bis er steht
    if (k.w < 2 && e > (k.w === 0 ? .12 : .3)) { traum_fluegel(g.position, .35); k.w++; }
    if (e > .65 && !k.idle) { k.idle = true; whiskey_play('IdleLookAround', .7); D.puff = 1; }
    D.toe = .6 + .4 * traum_sm(0, .3, e);
    if (e >= 2) { S.tf = null; D.toe = .95; if (S.free) { S.free.phase = 'gelandet'; S.free.rt = 0; } traum_rabenruf(L, .5); } } }
// Flug des Raben im Traum: Anflug (skriptet, traum_anflug), Sitzen (traum_sitz) und der kurze Hüpfer zur Fibel (wie im laufenden Spiel: schnell ab, langsam an, Nase in Flugrichtung)
function traum_flug(dt) { const S = traum_S, W = S.crow; if (!W || !W.g) return; if (W.mx) { W.mx.update(dt); if (typeof whiskey_kiefer === 'function') whiskey_kiefer(dt); } const g = W.g, F = W.fl; // Kiefer: Schnabel bewegt sich, wenn der Rabe spricht
  if (S.tf) { traum_anflug(dt); if (S.tf && S.tf.touch) traum_sitz(dt); else if (S.tf) traum_zehen(traum_sitzD().toe); return; }
  if (!F) { g.rotation.x += (0 - g.rotation.x) * Math.min(1, dt * 5); traum_sitz(dt); return; }
  traum_zehen(0); // Hüpfer zur Fibel: Zehen wieder lösen
  F.t = Math.min(1, F.t + dt / F.dur); const u = .25 * F.t + .75 * (1 - (1 - F.t) * (1 - F.t)), a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
  const nx = a * F.from.x + b * F.ctrl.x + c * F.to.x, ny = a * F.from.y + b * F.ctrl.y + c * F.to.y, nz = a * F.from.z + b * F.ctrl.z + c * F.to.z;
  const dx = nx - g.position.x, dz = nz - g.position.z, dy = ny - g.position.y, h = Math.hypot(dx, dz); if (h > 1e-4) { let d = Math.atan2(dx, dz) - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, dt * 10); }
  g.rotation.x += (Math.max(-.5, Math.min(.5, -Math.atan2(dy, h + 1e-3) * .8)) * (F.t > .85 ? -.6 : 1) - g.rotation.x) * Math.min(1, dt * 8); g.position.set(nx, ny, nz);
  if (typeof whiskey_play === 'function') { if (W.mode === 'take') { W.tt -= dt; if (W.tt < 0) { W.mode = 'fly'; whiskey_play('Fly', .2); } }
    else if (F.t > .8 && !F.land) { F.land = true; whiskey_play('Landing', .12, true); traum_fluegel(g.position, .8); setTimeout(() => traum_fluegel(g.position, .6), 170); }
    else if (F.t < .8 && !F.land && F.dur > 2.4) { const want = Math.sin(performance.now() * .0009 + F.dur) > .35 ? 'Glide' : 'Fly'; if (W.cur !== W.A[want]) whiskey_play(want, .4); } }
  if (F.t >= 1) { W.fl = null; W.mode = 'intro'; if (F.then) F.then(); } }
// Ein Kind zählt, gehaucht (Formant-Rauschen, Kinderstimme: hohe Formanten), räumlich; Sprachausgabe (X-1) ersetzt es über stimmen_spielen
const TRAUM_WORT = { vierzehn: [['f', 0, .09], [0, .08, .16, 380, 2700], ['ts', .27, .07], [0, .33, .14, 560, 2300], [0, .45, .12, 300, 1500, .5]], // vier – zehn
  'fünfzehn': [['f', 0, .08], [0, .07, .17, 330, 1900], ['f', .25, .06], ['ts', .33, .07], [0, .39, .14, 560, 2300], [0, .51, .12, 300, 1500, .5]] };
function traum_zaehl(wort, x, y, z, hell = .5) { const A = Audio; if (!A.ctx) return; if (typeof stimmen_spielen === 'function') { try { if (stimmen_spielen('traum_zaehlen_' + wort, [x, y, z])) return; } catch (e) {} }
  const c = A.ctx, d = A.at(x, y, z, 1); if (A.cut) return; const out = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400 + hell * 4200; out.gain.value = .5; out.connect(lp); lp.connect(d);
  { const dl = c.createDelay(1), fb = c.createGain(), dlp = c.createBiquadFilter(), eg = c.createGain(); dl.delayTime.value = .27; fb.gain.value = .34; dlp.type = 'lowpass'; dlp.frequency.value = 1100; eg.gain.value = .42; lp.connect(dl); dl.connect(dlp); dlp.connect(fb); fb.connect(dl); dlp.connect(eg); eg.connect(d);
    setTimeout(() => { try { lp.disconnect(dl); fb.disconnect(); } catch (e) {} }, 3800); } // ferner Hall der leeren Straße (Rückkopplung wird nach dem Ausklingen getrennt)
  const t0 = c.currentTime + .02, rt = rand(.94, 1.06);
  for (const s of TRAUM_WORT[wort] || []) { const n = A.noise(false), g = c.createGain(), at = t0 + s[1] * rt, du = s[2] * rt; g.gain.value = 0; n.connect(g); g.connect(out);
    if (typeof s[0] === 'string') { const hp = c.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = s[0] === 'f' ? 5200 : 7200; hp.Q.value = .8; n.disconnect(); n.connect(hp); hp.connect(g); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(s[0] === 'f' ? .12 : .2, at + .015); g.gain.linearRampToValueAtTime(0, at + du); }
    else { const f1 = c.createBiquadFilter(), f2 = c.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.frequency.value = s[3] * rt; f2.frequency.value = s[4] * rt; f1.Q.value = 6; f2.Q.value = 8; n.disconnect(); n.connect(f1); n.connect(f2); f1.connect(g); f2.connect(g);
      const v = .55 * (s[5] || 1); g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(v, at + .04); g.gain.setValueAtTime(v * .85, at + du * .7); g.gain.linearRampToValueAtTime(0, at + du); }
    n.stop(at + du + .05); } }
// Nasse Schritte in der leeren Straße: der Tritt selbst und zwei Rückwürfe von den Fassaden (Nachhall), gelegentlich Pfützenplätschern – alles echte Aufnahmen
function traum_schritt(x, z, v) { const A = Audio, k = A.pick('stepWet1', 'stepWet2', 'stepWet3'); A.play(k, { gain: .34 * v, vary: .06, varyGain: .2, x, y: .05, z, ref: 2 });
  A.play(k, { gain: .075 * v, rate: .93, lp: 1500, delay: .21, x: x + 7, y: 3, z: z + 4, ref: 4 }); A.play(k, { gain: .035 * v, rate: .88, lp: 1000, delay: .47, x: x - 9, y: 3, z: z - 5, ref: 6 });
  if (Math.random() < .35) A.play('waterLoop', { gain: .06 * v, offset: rand(0, 3), dur: .25, rate: 1.3, hp: 600, x, y: .05, z, ref: 2 }); }
const _trV = new THREE.Vector3(), _trV2 = new THREE.Vector3();
function traum_cam(cam, dt) {
  const S = traum_S; if (!S.on) return; S.t += dt; S.nt = (S.nt || 0) + dt;
  traum_flug(dt); traum_schichtenTick(dt, S.nt); if (S.skip) return traum_wake();
  if (S.free) return traum_frei(cam, dt);
  const sh = TRAUM_SHOTS[S.shot]; if (!sh) return;
  if (S.shotStarted !== S.shot) { S.shotStarted = S.shot; if (sh.crow) traum_crowPos(sh.crow); }
  const k = Math.min(1, S.t / sh.dur), e = k * k * (3 - 2 * k), o = sh.rel === 'perch' ? [TRAUM_PERCH.x, TRAUM_PERCH.y, TRAUM_PERCH.z] : sh.rel === 'book' ? [TRAUM_BOOK.x, 0, TRAUM_BOOK.z] : [0, 0, 0], at = traum_atem(S.nt + 3);
  let px = sh.from[0] + (sh.to[0] - sh.from[0]) * e, pz = sh.from[2] + (sh.to[2] - sh.from[2]) * e; if (sh.arm) { const ux = TRAUM_BOOK.ux ?? 1, uz = TRAUM_BOOK.uz ?? 0, a = px; px = ux * a + uz * pz; pz = uz * a - ux * pz; } // entlang Ausleger / quer
  cam.position.set(o[0] + px + at.x, Math.max(.25, o[1] + sh.from[1] + (sh.to[1] - sh.from[1]) * e + at.y), o[2] + pz);
  if (sh.look === 'crow' && S.crow) _trV.copy(S.crow.g.position).add({ x: 0, y: .25, z: 0 }); else if (sh.look === 'crowHead' && S.crow) _trV.copy(S.crow.g.position).add({ x: 0, y: .32, z: 0 }); else if (sh.look === 'book') _trV.set(TRAUM_BOOK.x, .05, TRAUM_BOOK.z); else if (sh.look === 'perch') _trV.set(TRAUM_PERCH.x, 1.6, TRAUM_PERCH.z); else _trV.set(...(Array.isArray(sh.look) ? sh.look : [0, 1, 0]));
  cam.lookAt(_trV); cam.rotateZ(at.rz * 1.6); cam.rotateX(at.rx); cam.rotateY(at.ry); if (typeof PERF_CULL !== 'undefined' && S.t < dt * 1.5) PERF_CULL.t = 0;
  if (S.shot === 0 && !S.zDone && S.t > 2.4) { S.zDone = true; const b = cam.getWorldDirection(_trV2); traum_zaehl('vierzehn', cam.position.x - b.x * 16, 1.1, cam.position.z - b.z * 16, 0); S.zI = 1; } // ganz fern, hinter der Kamera
  if (S.t >= sh.dur) { if (sh.frei) return traum_freiStart(cam); if (S.shot >= TRAUM_SHOTS.length - 1) return traum_wake(); S.shot++; S.t = 0; if (S.shot === TRAUM_SHOTS.length - 1 && typeof kino_prolog === 'function' && kino_prolog()) return; traum_lines(); } // AP-10: letzter Shot = Kinosequenz „Kum, Wîse“
}
// ---------------------------------------------------------------- A-01: die Traumstraße gehört dem Spieler
function traum_freiStart(cam) { const S = traum_S, d = cam.getWorldDirection(_trV2);
  player.yaw = Math.atan2(-d.x, -d.z); player.pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
  const fov0 = camera.fov; S.free = { t: 0, x: cam.position.x, z: cam.position.z, x0: cam.position.x, z0: cam.position.z, y: cam.position.y, vx: 0, vz: 0, weg: 0, ph: 0, si: 0, steps: 0, cy: player.yaw, cp: player.pitch, roll0: S.t,
    fov0, fov: fov0, ly: player.yaw, lp: player.pitch, d0: Math.hypot(cam.position.x - TRAUM_PERCH.x, cam.position.y - TRAUM_PERCH.y + .3, cam.position.z - TRAUM_PERCH.z), zT: 1.2, phase: 'gehen', rt: 0, hint: false, dip: 0, dipV: 0, atT: 1.8, zk: 0, cut: false };
  document.body.classList.add('traumFrei'); $('traumSkip').textContent = 'ESC · ÜBERSPRINGEN'; addEventListener('mousemove', traum_maus);
  if (Audio.ctx) { const P = TRAUM_PERCH; S.snd.push(Audio.loop('rumble', { gain: .05, lp: 180, fadeIn: 5 }), Audio.loop('buzz', { gain: .03, fadeIn: 3, x: P.x, y: P.y + .1, z: P.z, ref: 2 })); } // fernes Brummen, die Laterne summt
}
const traum_wink = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
// Eigener Blick auf der Traumstraße (unabhängig von allem, was sonst an player.yaw zieht): Maus bei gesperrtem Zeiger
function traum_maus(e) { const F = traum_S.free; if (!F || window.__testMove || document.pointerLockElement !== renderer.domElement || Math.abs(e.movementX) > 400 || Math.abs(e.movementY) > 400) return;
  F.ly -= e.movementX * sens * .0011; F.lp -= (settings.invert ? -1 : 1) * e.movementY * sens * .0011; }
function traum_frei(cam, dt) { const S = traum_S, F = S.free, T = TRAUM_FREI, P = TRAUM_PERCH; F.t += dt; F.rt += dt;
  let f = 0, s = 0; if (F.phase === 'gehen' && !ui.overlay) { f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0); s = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0); }
  // Blick: Kopf folgt der Maus weich (kritisch gedämpft); sobald der Rabe zu hören ist, dreht er sich mit kurzer Reaktionszeit zum Geräusch und folgt dem Vogel bis zur Landung
  if (F.phase === 'rabe' || F.phase === 'gelandet') { const C = S.crow, q = C && C.g.visible ? C.g.position : _trV2.set(P.x, P.y, P.z), w = traum_sm(.3, 1.3, F.rt), dx = q.x - cam.position.x, dz = q.z - cam.position.z;
    F.ly += traum_wink(Math.atan2(-dx, -dz), F.ly) * (1 - Math.exp(-dt * 2.8 * w)); F.lp += (Math.atan2(q.y + .15 - cam.position.y, Math.hypot(dx, dz) || 1) - F.lp) * (1 - Math.exp(-dt * 2.2 * w)); }
  F.lp = Math.max(-.7, Math.min(.6, F.lp)); const kl = 1 - Math.exp(-dt * 12); F.cy += traum_wink(F.ly, F.cy) * kl; F.cp += (F.lp - F.cp) * kl;
  // Gehen: 1,1 m/s, schwer (Trägheit), kein Rennen; die Strecke zur Kreuzung wird nicht kürzer
  const n = Math.hypot(f, s) || 1, sy = Math.sin(F.cy), cy = Math.cos(F.cy), wx = (-sy * f + cy * s) / n * T.v, wz = (-cy * f - sy * s) / n * T.v, ka = 1 - Math.exp(-dt * (f || s ? 2.4 : 3.2));
  F.vx += (wx - F.vx) * ka; F.vz += (wz - F.vz) * ka; const sp = Math.hypot(F.vx, F.vz); F.weg += sp * dt;
  { const rx = P.x - F.x, rz = P.z - F.z, rl = Math.hypot(rx, rz) || 1, ux = rx / rl, uz = rz / rl, vr = F.vx * ux + F.vz * uz, tx = F.vx - vr * ux, tz = F.vz - vr * uz; // zur Laterne hin kaum Weg, quer etwas mehr
    let nx = F.x + (vr * ux * T.kx + tx * T.kz) * dt, nz = F.z + (vr * uz * T.kx + tz * T.kz) * dt; const ox = nx - F.x0, oz = nz - F.z0, ol = Math.hypot(ox, oz); if (ol > T.rad) { nx = F.x0 + ox / ol * T.rad; nz = F.z0 + oz / ol * T.rad; } F.x = nx; F.z = nz; }
  const bob = settings.bob ? 1 : .3;
  F.ph += sp * dt / T.schritt * PI; const si = Math.floor(F.ph / PI); if (si !== F.si) { F.si = si; if (sp > .3) { F.steps++; const v = Math.min(1, sp / T.v); traum_schritt(F.x, F.z, v); F.dipV -= .8 * v * bob; } } // jeder Tritt drückt den Kopf kurz hinunter
  F.atT -= dt; if (F.atT <= 0) { F.atT = rand(3.4, 4.8); traum_atmen(sp > .3 ? 1.2 : .8); }
  const amp = (settings.bob ? .028 : .006) * Math.min(1, sp / T.v), at = traum_atem(S.nt + 3);
  F.dipV += (-F.dip * 240 - F.dipV * 19) * dt; F.dip += F.dipV * dt; // Schrittfeder: Gewicht, federt zurück
  F.y += (1.58 - F.y) * Math.min(1, dt * 1.5); const lat = Math.sin(F.ph) * amp * .4;
  cam.position.set(F.x + cy * (lat + at.x), F.y + Math.abs(Math.sin(F.ph)) * amp - amp * .5 + at.y + F.dip, F.z - sy * (lat + at.x));
  cam.rotation.set(F.cp + Math.sin(F.ph * 2) * amp * .12 + at.rx + F.dip * 1.1, F.cy + at.ry, at.rz * Math.max(.5, 1 - F.t / 6) + Math.sin(F.ph) * amp * .08);
  // Gegenzoom: Abstand × tan(fov/2) bleibt gleich → die Laterne bleibt gleich groß, egal wie weit er geht; zur Landung zieht der Blick leicht heran
  const zt = (S.tf && S.tf.touch) || F.phase === 'gelandet' ? .2 : S.tf ? .2 * traum_sm(.45, 1, S.tf.t) : 0; F.zk += (zt - F.zk) * Math.min(1, dt * 1.6);
  const dd = Math.hypot(cam.position.x - P.x, cam.position.y - P.y + .3, cam.position.z - P.z), fv = Math.min(T.fovMax, 2 * Math.atan(Math.tan(F.fov0 * PI / 360) * F.d0 / Math.max(1, dd)) * 180 / PI) * (1 - F.zk);
  if (Math.abs(fv - F.fov) > .02) { F.fov = fv; cam.fov = fv; cam.updateProjectionMatrix(); }
  // Hinweis, falls niemand losgeht
  const hint = F.phase === 'gehen' && F.t > 1.6 && F.weg < .3; if (hint !== F.hint) { F.hint = hint; $('traumHint').classList.toggle('on', hint); }
  // Das Zählen: immer hinter ihm, mit jedem Schritt näher und heller
  if (F.phase === 'gehen') { F.zT -= dt; if (F.zT <= 0) { F.zT = rand(2.2, 3); const w = S.zI++ % 2 ? 'fünfzehn' : 'vierzehn', D = Math.max(.7, 9 - F.steps * .3), hell = Math.min(1, F.steps / 26);
      traum_zaehl(w, cam.position.x + sy * D + cy * rand(-.4, .4), 1.05, cam.position.z + cy * D - sy * rand(-.4, .4), hell); subtitle(`<i>… ${w} …</i>`, 1500, ''); }
    if ((F.t >= T.tMin && F.weg >= T.weg) || F.t >= T.tMax) traum_freiRabe(cam); }
  else if (F.phase === 'gelandet' && F.rt > 1.1) traum_freiEnde();
}
function traum_freiRabe(cam) { const S = traum_S, F = S.free; F.phase = 'rabe'; F.rt = 0; $('traumHint').classList.remove('on'); // das Zählen bricht ab; der Rabe kommt von der Seite aus dem Nebel
  if (!S.crow || !traum_anflugStart(cam)) { F.phase = 'gelandet'; if (S.crow && S.crow.g) { const P = TRAUM_PERCH; S.crow.g.visible = true; S.crow.g.position.set(P.x, P.y, P.z); } } }
function traum_freiEnde() { const S = traum_S, F = S.free; if (!F || F.cut) return; F.cut = true; const fd = $('fade'); fd.style.background = '#000'; fd.style.transition = 'opacity .28s'; fd.style.opacity = 1; // kurzer Schnitt über Schwarz
  setTimeout(() => { if (!S.on || S.waking) return; removeEventListener('mousemove', traum_maus); if (S.free) { player.yaw = S.free.ly; player.pitch = S.free.lp; } S.free = null; document.body.classList.remove('traumFrei'); $('traumSkip').textContent = 'KLICK · ÜBERSPRINGEN'; camera.fov = fov; camera.updateProjectionMatrix();
    S.shot = 1; S.t = 0; traum_lines(); fd.style.transition = 'opacity .9s'; fd.style.opacity = 0; }, 300); }
async function traum_wake() {
  const S = traum_S; if (S.waking) return; S.waking = true;
  removeEventListener('mousemove', traum_maus); if (S.free) { S.free = null; document.body.classList.remove('traumFrei'); $('traumHint').classList.remove('on'); } camera.fov = fov; camera.updateProjectionMatrix();
  S.tf = null; try { traum_zehen(0); } catch (e) {} try { traum_schichtenWeg(); } catch (e) {} if (S.crow && S.crow.m && S.crow.base) S.crow.m.scale.setScalar(S.crow.base);
  for (const h of S.snd) if (h) h.stop(1.2); S.snd.length = 0;
  renderer.domElement.removeEventListener('pointerdown', S.ptrFn); document.removeEventListener('keydown', S.keyFn);
  if (!S.skip) { Audio.caw(0, .6, .4); Audio.scareSound('whisperBurst'); glitchV = 1; } $('fade').style.transition = 'opacity .25s'; $('fade').style.background = '#fff'; $('fade').style.opacity = 1; await wait(600);
  setCamOverride(null); setScripted(null); S.on = false; document.body.classList.remove('cine'); renderer.domElement.style.filter = ''; scene.fog.color.setHex(S.fog0.c); scene.fog.density = S.fog0.d; scene.background = S.fog0.bg; sky.visible = S.fog0.sky; fogUniforms.color.value.copy(S.fog0.gf); rain.m.scale.setScalar(1); S.book.visible = false; $('traumSkip').textContent = 'KLICK · ÜBERSPRINGEN';
  if (typeof klang_dream === 'function') klang_dream(false); if (typeof klang_S !== 'undefined') klang_S.intro = false;
  if (S.crow) { S.crow.g.visible = false; S.crow.mode = 'gone'; S.crow.fl = null; }
  $('fade').style.background = '#000'; await wait(500);
  window.__traumWake = () => traum_awake(); beginGame();
}
// Er tastet die Jacke ab: Stoff, dann Papier
function traum_jacke() { const A = Audio; if (!A.ctx) return; for (let i = 0; i < 3; i++) { const nz = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(700, 1400); bp.Q.value = .8; nz.connect(bp); A.env(bp, .1, .02, .14, i * .21 + rand(0, .04)); nz.stop(A.ctx.currentTime + 1); }
  setTimeout(() => A.paper && A.paper(), 700); }
// Funde aus dem Traum (vor der Fibel-Tour angelegt, damit die Seite „Funde“ dort schon etwas zeigt)
function traum_lore() {
  if (!story.lore.some(l => l.key === 'kum_wise')) story.lore.push({ key: 'kum_wise', title: 'Kum, Wîse', html: '<span class="hand">Das hat der Rabe im Traum gesagt. Mit der Stimme einer Frau, nicht mit seiner.\n\n„Kum“ ist alt – so hat man vor Jahrhunderten „komm“ gesagt.\n„Wîse“ klingt wie ein Name. Vielleicht „der Weise“. Wenn ich es leise sage, dreht er den Kopf.</span>' });
  if (!story.lore.some(l => l.key === 'traum')) story.lore.push({ key: 'traum', title: 'Der Traum vom Raben', html: 'Die leere Straße, weißer Nebel. Irgendwo zählt ein Kind. Ein Rabe landet auf der Laterne an der Kreuzung:\n\n„Luke. Du hast lange geschlafen. Siebzehn Jahre lang.“\n„Deine Schwester Lucy ist nicht verschwunden. Sie hat sich versteckt. Vor etwas, das sucht.“\n„Sie hat dich angerufen: Haus Nummer 7. Der Keller. Dort fängt es an.“\n„In diesem Dorf versteckt sich jeder vor irgendwem. Und du, Kind … vor dir selbst.“\n\nEr hat mir die Abenteuerfibel zurückgegeben – das Kinderheft, das ich als Kind mit Jonas und Zayn geschrieben habe. Es schreibt jetzt weiter, was ich finde.\n\n„Deine Aufgabe: Finde Lucy. Finde heraus, was mit diesem Dorf geschehen ist. Und wer du bist.“\n\n„Kum, Wîse.“' }); }
async function traum_awake() { // beginGame blendet ein; dann das Aufwachen
  window.__traumWake = null; shake = .03; Audio.heart(); if (Audio.ctx) { const t0 = Audio.ctx.currentTime; if (Audio.rain) Audio.rain.gain.setTargetAtTime(.5, t0, 1.5); if (Audio.wind) Audio.wind.gain.setTargetAtTime(.5, t0, 2); }
  if (typeof strasse_autoAuf === 'function') try { strasse_autoAuf(true); } catch (e) {} // hinter ihm: Fahrertür offen, Innenlicht, Tür-offen-Gong
  state.talking = true; try { traum_lore(); } catch (e) {}
  await say([['Huh …? Warum steh ich nachts im Regen auf der Straße?', 4600, 'LUKE']]);
  traum_jacke(); await wait(1100); addItem('fibel');
  await say([['<i>Die Fibel steckt drin. Sie ist nass. Sie ist echt.</i>', 3800, 'LUKE']]);
  try { if (typeof fibeltour_start === 'function') await fibeltour_start(); } catch (e) { console.warn('Fibel-Tour', e); } // geführte Tour durch die Seiten der Fibel (Enter = weiter, X = überspringen)
  // F3 Verständlichkeit (Nutzer 01.10.2026): woher Luke weiß, dass Lucy seit dem 23. weg ist – Kühns Nachricht auf SEINEM Handy (Stimme wie AG-03, ohne „Institut“)
  await wait(900); toast('Dein Handy brummt: 1 gespeicherte Sprachnachricht. Die Polizei, letzte Woche. Du kennst sie auswendig.', 4200); await wait(1600); try { Audio.play('static', { gain: .04, dur: .8, hp: 400 }); } catch (e) {}
  await say([['„Herr Brandt? Kühn hier, Polizei, ne. Wegen Ihrer Schwester. Die ist seit dem 23. nicht mehr gesehen worden.“', 5200, 'KÜHN · MAILBOX'], ['„Wir kümmern uns. Sie müssen da nicht extra herkommen, gell. Wirklich nicht.“', 4200, 'KÜHN · MAILBOX'], ['<i>Nicht extra herkommen. Tja.</i>', 2600, 'LUKE']]);
  state.talking = false; questPop('ABENTEUERFIBEL', 'Taste Tab – jederzeit nachlesen');
  setTimeout(() => { if (typeof gedanke === 'function') gedanke('traum_lucy', 'Lucy. Seit dem 23. verschwunden. Und letzte Nacht ihr Anruf: „Haus Nummer 7. Der Keller.“ Ich bin durchgefahren. Und dann hab ich den ganzen Tag im Auto gepennt. Am Ortsschild. Super.', 0, 3); }, 2500);
  // F3 Verständlichkeit: wer Lucy ist und warum Luke jetzt kommt (Schuld: elf Anrufe, Kern §10.1) – eigenes Fenster, damit die Whiskey-Szene am Ortsschild sie nicht verdrängt
  setTimeout(() => { if (typeof gedanke === 'function') gedanke('traum_elf', 'Meine Zwillingsschwester. Am 23. hat sie mich elfmal angerufen. Elfmal weggedrückt, ich war ja beschäftigt. Diesmal fahr ich nicht ohne sie.', 0, 3); }, 13000);
  setTimeout(() => { if (typeof gedanke === 'function') gedanke('traum_kum', '„Kum, Wîse.“ Hat der Rabe im Traum gesagt, mit einer Frauenstimme. Klingt uralt: „kum“ wie „komm“. Und Wîse … ein Name. Vielleicht „der Weise“.', 0, 3); }, 26000);
}
// ---------------------------------------------------------------- Kapitel 1 (W2-P3): der UFO-Kegel und die Ortstafel
// UFO-Kegel (Kanon Beat 8): das Licht im Kegel flackert wie eine Kerze – nur die Intensität des vorhandenen Spots (und die Deckkraft des Strahls),
// kein neues Licht – und wer im Kegel steht, hört leise Papier rascheln.
// Ortstafel: die Kreide-210 malt kino.js in K1 (kino_schild, bleibt danach). Hier nur der passende Text beim Ansehen, sobald Kapitel 1 vorbei ist.
const K1_S = { zus: null, plate: null, act0: null, actP0: null, act210: null, want: null, fl: 1, flTar: 1, flT: 0, rsT: 0 };
function k1_ortsschildPrep() {
  const S = K1_S; scene.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.parameters || Math.abs(o.position.x + 72.3) > .2 || Math.abs(o.position.z - 6.3) > .2) return; const p = o.geometry.parameters;
    if (Math.abs(p.width - .72) < .01 && Math.abs(p.height - .3) < .01) S.zus = o; else if (Math.abs(p.width - 1.4) < .01 && Math.abs(p.height - .77) < .01) S.plate = o; });
  if (S.zus) S.act0 = S.zus.userData.action; if (S.plate) S.actP0 = S.plate.userData.action;
  S.act210 = () => toast('Lost Eyengless. Darunter „Einwohner 214“ – durchgestrichen, 211. Daneben, frisch in Kreide: 210.', 5200);
}
function k1_schildText(on) { const S = K1_S; S.want = on;
  if (S.zus && S.act0) S.zus.userData.action = on ? S.act210 : S.act0; if (S.plate && S.actP0) S.plate.userData.action = on ? S.act210 : S.actP0; }
function k1_rascheln(px, pz) { // leises Papierrascheln: ein paar kurze, bandgefilterte Knister-Stöße aus dem Rauschen (keine Aufnahme vorhanden)
  const A = Audio; if (!A.ctx || !A.noiseBuf) return; const d = A.at(px + rand(-.7, .7), 1.2, pz + rand(-.7, .7), 1.5); if (A.cut) return;
  const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2600, 4400); bp.Q.value = .9; n.connect(bp);
  const k = 3 + Math.floor(Math.random() * 4); let at = 0; for (let i = 0; i < k; i++) { A.env(bp, rand(.03, .07), .004, rand(.025, .08), at, d); at += rand(.04, .12); }
  n.stop(A.ctx.currentTime + at + .4); }
WORLD_TICK.push((dt, t, indoor) => { const S = K1_S;
  if (S.zus) { const want = !!state.ch1Done || (typeof kap === 'function' ? kap() : curChapter()) >= 2; if (want !== S.want) k1_schildText(want); } // nur bei Wechsel
  if (!state.ufoOn || !state.phase2) return; const sp = ufo.userData.spot; if (!(sp.intensity > 0)) return;
  S.flT -= dt; if (S.flT <= 0) { S.flT = rand(.05, .16); S.flTar = Math.random() < .07 ? rand(.35, .55) : rand(.72, 1); } // Kerze: unruhig, ab und zu ein kurzes Einknicken
  S.fl += (S.flTar - S.fl) * Math.min(1, dt * 16); const f = S.fl * (.95 + .05 * Math.sin(t * 13.7));
  sp.intensity *= f; ufo.userData.beam.uniforms.opacity.value *= .55 + .45 * f;
  const dx = player.pos.x - ufo.position.x, dz = player.pos.z - ufo.position.z;
  if (!indoor && dx * dx + dz * dz < 14.4) { S.rsT -= dt; if (S.rsT <= 0) { S.rsT = rand(.9, 2.1); k1_rascheln(player.pos.x, player.pos.z); } } else S.rsT = Math.min(S.rsT, .35);
});
// ---------------------------------------------------------------- Zweiter Traum (Abspann Kap. 4, 02 E2; Wortlaut Dossier 83 §3 = Master). AP-08 stellt ihn bereit, AP-19/kino.js ruft ihn.
// Wieder DER RABE, wieder Miras Stimme, näher, als säße er auf der Bettkante. Nur Untertitel + Flüstern; Kamera/Bild bleiben beim Aufrufer.
const TRAUM_ZWEITER = [['Dreizehn Atemzüge hab ich gebraucht bis zum Rand. Du brauchst länger. Das ist gut.', 'DER RABE', 0], ['Der Ring passt dir. Er hat gehalten, bis die Hand nicht mehr konnte. Sag ihm das, wenn du ihn wiedersiehst.', 'DER RABE', 6.2],
  ['Ich komm. Ich weiß nur noch nicht, in welcher Nacht.', 'DER RABE', 14], ['Such.', 'DER RABE', 19.6]];
async function traum_zweiter(o = {}) { // o.x/y/z: Flüsterort (Standard: an der Kamera), gibt nach ~22 s zurück
  const p = o.x !== undefined ? o : camera.position;
  for (let i = 0; i < TRAUM_ZWEITER.length; i++) { const [t, who, at] = TRAUM_ZWEITER[i], next = i + 1 < TRAUM_ZWEITER.length ? TRAUM_ZWEITER[i + 1][2] : at + 2.6;
    subtitle(`<i>${t}</i>`, Math.max(2400, (next - at) * 1000 - 200), who); Audio.whisper(p.x + .4, (p.y || 1.4) + .1, p.z + .3, 1.2); await wait((next - at) * 1000); }
  if (!story.lore.some(l => l.key === 'traum2')) story.lore.push({ key: 'traum2', title: 'Der zweite Traum', html: TRAUM_ZWEITER.map(l => '„' + l[0] + '“').join('\n') }); }
window.__traum = { S: traum_S, P: TRAUM_PERCH, st: () => (typeof strasse_S !== 'undefined' ? strasse_S : null), wh: () => (typeof whiskey_S !== 'undefined' ? whiskey_S : null), zu: () => strasse_autoZu(), start: () => runIntro(), applySave: d => applySave(d), loadSave: () => loadSave(), saveGame: c => saveGame(c) }; // Testzugriff
