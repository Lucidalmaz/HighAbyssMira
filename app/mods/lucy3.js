// =====================================================================  LUCY 3 (Modul „lucy3“, Paket W2-P6): Kapitel 3 · Straße
// Lucy ist in Kapitel 3 halb hier: ihr Auto an der Südsperre läuft (Leerlauf, Abgas, Radio rauscht), auf der beschlagenen Heckscheibe steht von innen
// GROSSER, darunter halb weggewischt HASEN…; blaue Kreispfeile (ihr Zeichen) führen zum Funkkasten. Dort antworten ZWEI Lucys (Kanal A/B) –
// nur das nie ausgesprochene Wort (in den Staub geschrieben) an die echte löst. Die Laternenfolge sagt niemand mehr vor: Lucy nennt die Regel,
// Zählbuch + Einwilligungen liefern die Daten. Jede richtig gelöschte Laterne zeigt 3 s den Nachhall der Unterschrift an diesem Haus.
// Texte wortgleich aus story_final.md, Produktionsplan PK-C K3-1 … K3-5.
// Basisfunktionen werden hier NEU ZUGEWIESEN (oberste Ebene, also vor gedanken.js' Umhüllung in WORLD_MODS → deren Gedanken bleiben erhalten):
//   chapter3Opening, radioPuzzle, broadcast, pressSwitch, wrongSwitch. justinArrives bekommt in WORLD_MODS (nach gedanken) eine Sperre während des Intros.
const lucy3_S = { opening: false, openDone: false, tuned: false, greeted: false, asked: new Set(), allAsked: false, word: null, busy: false, tok: 0, log: [], luke: '',
  radioFails: 0, lampFails: 0, justinTold: false, win: null, car: { ok: false }, arrows: [], smoke: [], eng: null, hiss: null, k3: false, carIa: false, look1: false, look2: false,
  hand: null, handK: 0, handOn: false, signs: {}, signBusy: false, lampPrev: [], lights: [], hlMats: [], scopeA: 0, scopeB: 0, tine: 0, info: {} };
MOD_SAVE.push(['lucy3', () => ({ tuned: lucy3_S.tuned, look1: lucy3_S.look1, look2: lucy3_S.look2 }), v => { lucy3_S.look1 = !!v.look1; lucy3_S.look2 = !!v.look2; }]);
const lucy3_sleep = ms => new Promise(r => setTimeout(r, ms));
// Kapitel 3, Straße (nicht in Kap. 4–6, wo ch3.on weiter wahr ist)
function lucy3_isK3() { if (!ch3.on || ch3.part !== 'town') return false; if (typeof kap === 'function') return kap() === 3; return !(typeof anwesen_S !== 'undefined' && anwesen_S.ch4); }

// ---------------------------------------------------------------- Aussehen des Funkgeräts (Eisen, Messing, Bernstein-Skala, grüne Leuchtröhren)
{ const st = document.createElement('style'); st.id = 'lucy3css'; st.textContent = `
  #puzzle .box.l3box { width: min(840px, 94vw); max-width: 840px; padding: 34px 38px 26px; }
  .l3 .sticker { display: inline-block; font: 15px "Special Elite", monospace; color: #2a2016; background: linear-gradient(175deg, #e2d8bc, #cbbf9d); padding: 6px 14px 5px; transform: rotate(-1.4deg); box-shadow: 0 2px 6px rgba(0,0,0,.6); margin: 0 0 18px; }
  .l3 .dial { position: relative; height: 122px; border-radius: 5px; overflow: hidden; background: #070504; box-shadow: inset 0 0 0 1px rgba(201,163,106,.28), inset 0 10px 26px rgba(0,0,0,.95), 0 0 0 5px #14100c, 0 0 0 6px rgba(201,163,106,.14), 0 12px 30px rgba(0,0,0,.7); }
  .l3 .dial canvas { display: block; width: 100%; height: 122px; }
  .l3 .dial::after { content: ''; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, rgba(255,255,255,.07), transparent 38%, transparent 70%, rgba(0,0,0,.35)); }
  .l3 .tune { display: flex; align-items: center; gap: 24px; margin: 20px 4px 4px; }
  .l3 .eye { flex: none; width: 96px; height: 96px; border-radius: 50%; box-shadow: 0 0 0 4px #0b0907, 0 0 0 5px rgba(201,163,106,.3), 0 6px 18px rgba(0,0,0,.8); }
  .l3 .eye canvas { display: block; width: 96px; height: 96px; border-radius: 50%; }
  .l3 .knob { flex: 1; text-align: left; }
  .l3 .knob input[type=range] { width: 100%; }
  .l3 .freq { font: 34px/1 "Special Elite", monospace; letter-spacing: .08em; color: #ffc46a; text-shadow: 0 0 10px rgba(255,160,60,.55), 0 0 26px rgba(255,120,30,.25); margin: 2px 0 8px; }
  .l3 .freq small { font-size: 15px; letter-spacing: .3em; color: #b0874c; margin-left: 8px; }
  .l3 .fine { display: flex; gap: 8px; align-items: center; margin-top: 6px; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .4em; color: #8a7d66; }
  #puzzle .l3 .fine button { min-width: 38px; padding: 5px 10px; font-size: 16px; }
  .l3 .status { min-height: 28px; margin: 12px 0 0; font: italic 18px "Cormorant Garamond", Georgia, serif; color: #c7b99b; }
  .l3 .chans { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .l3 .ch { position: relative; padding: 12px 14px 10px; background: linear-gradient(180deg, #13100d, #090706); border: 1px solid rgba(201,163,106,.2); box-shadow: inset 0 0 34px rgba(0,0,0,.85), 0 6px 16px rgba(0,0,0,.6); transition: border-color .3s; }
  .l3 .ch.live { border-color: rgba(255,176,80,.55); }
  .l3 .ch h4 { display: flex; align-items: center; gap: 12px; margin: 0 0 9px; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .5em; color: var(--gold); }
  .l3 .lamp { width: 15px; height: 15px; border-radius: 50%; flex: none; background: radial-gradient(circle at 35% 30%, #4a2412, #170804 70%); box-shadow: 0 0 0 2px #0a0806, 0 0 0 3px rgba(201,163,106,.25); transition: background .08s, box-shadow .08s; }
  .l3 .lamp.on { background: radial-gradient(circle at 35% 30%, #fff5d6, #ffb448 45%, #a4580c); box-shadow: 0 0 16px 4px rgba(255,170,60,.7), 0 0 0 2px #0a0806, 0 0 0 3px rgba(255,190,110,.5); }
  .l3 .lamp.red { background: radial-gradient(circle at 35% 30%, #ffd8cc, #ff3b24 45%, #7d0c04); box-shadow: 0 0 18px 5px rgba(255,50,30,.75), 0 0 0 2px #0a0806, 0 0 0 3px rgba(255,90,70,.5); }
  .l3 .lamp.dead { background: #0d0604; box-shadow: 0 0 0 2px #0a0806, 0 0 0 3px rgba(90,70,50,.2); }
  .l3 canvas.scope { display: block; width: 100%; height: 58px; border-radius: 3px; background: radial-gradient(ellipse at center, #0c1a10, #040705 80%); box-shadow: inset 0 0 14px #000, 0 0 0 1px rgba(120,210,150,.14); }
  .l3 .log { height: 138px; overflow-y: auto; margin-top: 9px; padding-right: 4px; text-align: left; font: 18px/1.35 "Cormorant Garamond", Georgia, serif; color: #e6d9bc; }
  .l3 .log div { margin: 0 0 5px; animation: l3in .5s ease-out; }
  .l3 .log .q { margin-top: 9px; font-size: 14px; font-style: italic; letter-spacing: .04em; color: #7f735e; }
  .l3 .log .fx { font-style: italic; letter-spacing: .08em; color: #b8574a; }
  .l3 .log .mute { font-style: italic; color: #5e5446; }
  @keyframes l3in { from { opacity: 0; transform: translateY(4px); filter: blur(2px); } to { opacity: 1; transform: none; filter: none; } }
  .l3 .luke { min-height: 30px; margin: 14px 0 2px; font: italic 20px "Cormorant Garamond", Georgia, serif; color: #ecd09a; text-shadow: 0 0 12px rgba(0,0,0,.9); }
  .l3 .luke b { margin-right: 12px; font: 600 11px "Cormorant Garamond", Georgia, serif; font-style: normal; letter-spacing: .4em; color: #8a7d66; }
  .l3 .sect { margin: 14px 0 8px; font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .5em; color: #8a7d66; }
  #puzzle .l3 button:disabled { opacity: .32; cursor: default; box-shadow: none; }
  #puzzle .l3 .words button { font: 15px "Special Elite", monospace; letter-spacing: .14em; padding: 9px 14px; }
  #puzzle .l3 .words button.sel { color: #fff3d8; box-shadow: inset 0 0 0 1px rgba(255,200,120,.6), 0 0 14px rgba(255,180,90,.25); }
  .l3 .dust { position: relative; height: 78px; max-width: 540px; margin: 10px auto 4px; border-radius: 3px; overflow: hidden;
    background: radial-gradient(60% 90% at 30% 40%, rgba(214,206,186,.35), transparent 70%), radial-gradient(40% 70% at 80% 70%, rgba(190,180,160,.3), transparent 70%), var(--noise), linear-gradient(180deg, #6d675b, #56514a 60%, #4a463f);
    box-shadow: inset 0 0 0 1px rgba(0,0,0,.6), inset 0 2px 10px rgba(0,0,0,.5), 0 0 0 4px #14100c, 0 0 0 5px rgba(201,163,106,.12); }
  .l3 .dust::before { content: ''; position: absolute; inset: 0; opacity: .5; background: radial-gradient(circle, rgba(236,228,206,.5) .6px, transparent 1.2px) 0 0 / 5px 6px, radial-gradient(circle, rgba(20,16,12,.35) .6px, transparent 1.3px) 2px 3px / 7px 5px; }
  .l3 .dust span { position: absolute; left: 0; right: 0; top: 0; font: 62px/80px Caveat, cursive; letter-spacing: .03em; color: #1f1c18; text-shadow: 0 1px 0 rgba(255,250,230,.18), 0 -1px 2px rgba(0,0,0,.7); clip-path: inset(0 100% 0 0); animation: l3write 1.4s steps(28) forwards; }
  .l3 .dust span.gone { animation: l3wipe .9s ease-in forwards; clip-path: none; }
  .l3 .dust em { position: absolute; left: 0; right: 0; top: 26px; font: italic 17px "Cormorant Garamond", Georgia, serif; color: rgba(40,34,28,.8); }
  @keyframes l3write { to { clip-path: inset(0 0 0 0); } }
  @keyframes l3wipe { to { opacity: 0; filter: blur(6px); transform: translateX(40px); } }
  #puzzle .l3 .send button { margin-top: 12px; letter-spacing: .32em; padding: 12px 22px; color: #1b140c; background: linear-gradient(180deg, #e2c68c, #b08a52 55%, #8a6a3c); box-shadow: inset 0 1px 0 rgba(255,245,215,.6), 0 3px 0 #3d2d17, 0 6px 14px rgba(0,0,0,.6); }
  #puzzle .l3 .send button:hover:not(:disabled) { background: linear-gradient(180deg, #f0d6a0, #c49c62 55%, #9a7846); color: #000; }
  .l3 .ch.shriek { animation: l3shake .07s linear 14; border-color: rgba(255,60,40,.7); }
  @keyframes l3shake { 0% { transform: translate(0,0); } 25% { transform: translate(-3px,1px); } 50% { transform: translate(2px,-2px); } 75% { transform: translate(3px,2px); } 100% { transform: translate(0,0); } }
  .l3.flare { animation: l3flare .9s ease-out; }
  @keyframes l3flare { 0% { filter: brightness(2.2) saturate(.5); } 100% { filter: none; } }
`; document.head.appendChild(st); }

// ---------------------------------------------------------------- Klang: Funkstimmen ohne Klartext (Silben unter Rauschen), Spieluhr-Zinken, Kratzen
function lucy3_voice(kind, sec, dest, gain = 1) {
  const A = Audio; if (!A.ctx) return; const ctx = A.ctx, t = ctx.currentTime + .03; if (!dest) dest = A.at(5.4, 1, -6.6, 3);
  const f0 = kind === 'amt' ? 108 : kind === 'a' ? 246 : 226;
  const out = ctx.createGain(); out.gain.value = (kind === 'amt' ? .55 : .5) * gain; out.connect(dest || A.world);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'b' ? 2400 : 3000; hp.connect(lp); lp.connect(out);
  const src = ctx.createOscillator(); src.type = 'sawtooth'; src.frequency.setValueAtTime(f0, t);
  const f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.Q.value = 7; f2.Q.value = 9;
  const am = ctx.createGain(); am.gain.value = 0; src.connect(f1); src.connect(f2); f1.connect(am); f2.connect(am); am.connect(hp);
  let x = t; while (x < t + sec) { const d = rand(.11, .25), v = Math.random() < .14 ? 0 : rand(.4, 1);
    am.gain.setTargetAtTime(v, x, .018); am.gain.setTargetAtTime(v * .2, x + d * .72, .03);
    f1.frequency.setValueAtTime(rand(480, 880), x); f2.frequency.setValueAtTime(rand(1150, 2300), x); src.frequency.setTargetAtTime(f0 * rand(.9, 1.14), x, .05); x += d; }
  am.gain.setTargetAtTime(0, t + sec, .05); src.start(t); src.stop(t + sec + .5);
  const n = A.noise(false), nb = ctx.createBiquadFilter(), ng = ctx.createGain(); nb.type = 'bandpass'; nb.frequency.value = 1900; nb.Q.value = .7; ng.gain.value = kind === 'b' ? .16 : .08;
  n.connect(nb); nb.connect(ng); ng.connect(hp); n.stop(t + sec + .5);
  if (kind === 'a' || kind === 'amt') lucy3_tines(sec, dest, gain); // Regel 5: unter jeder geliehenen Stimme läuft ihre Spieluhr
}
function lucy3_tines(sec, dest, gain = 1) { const A = Audio; if (!A.ctx) return; const notes = [1319, 1175, 1047, 988, 1047, 1175, 1319, 1568];
  if (A.buf.kb_spieluhr_E6 && A.buf.kb_spieluhr_A6) { for (let i = 0, n = Math.max(2, Math.floor(sec / .46)); i < n; i++) { const f = notes[i % notes.length] * (1 - i * .002), hi = f > 1500; A.play(hi ? 'kb_spieluhr_A6' : 'kb_spieluhr_E6', { gain: .03 * gain, rate: f / (hi ? 1760 : 1318.5), delay: .05 + i * .46, dest: dest || A.world }); } return; } // echte Zinken (Modul klang)
  for (let i = 0, n = Math.max(2, Math.floor(sec / .46)); i < n; i++) [1, 2.01].forEach((m, j) => { const o = A.osc('sine', notes[i % notes.length] * m * (1 - i * .002), .05 + i * .46, 1.3); A.env(o, (j ? .005 : .014) * gain, .004, 1.1, .05 + i * .46, dest || A.world); }); }
function lucy3_scratch(x, z, twice) { const A = Audio; if (!A.ctx) return; const ctx = A.ctx, d = A.at(x, 1, z, 3), t0 = ctx.currentTime + .05;
  [0, twice ? 1.25 : -1].forEach(off => { if (off < 0) return; const n = A.noise(false), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = 3600; bp.Q.value = 1.6; g.gain.value = 0;
    n.connect(bp); bp.connect(g); g.connect(d); const t = t0 + off; for (let k = 0; k < 14; k++) g.gain.setValueAtTime(Math.random() < .75 ? rand(.08, .22) : 0, t + k * .045); g.gain.setValueAtTime(0, t + .66); n.stop(t + .8); }); }
// Rauschschleife des Funkgeräts (nur solange ein Fenster offen ist) mit Überlagerungspfeifen beim Abstimmen
function lucy3_radioOn() { const A = Audio; if (!A.ctx || lucy3_S.win) return; const ctx = A.ctx, n = A.noise(true), bp = ctx.createBiquadFilter(), g = ctx.createGain();
  bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = .6; g.gain.value = 0; g.gain.setTargetAtTime(.055, ctx.currentTime, .15); n.connect(bp); bp.connect(g); const p = A.at(5.4, 1, -6.6, 3); g.connect(p);
  const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'sine'; o.frequency.value = 900; og.gain.value = 0; o.connect(og); og.connect(p); o.start();
  lucy3_S.win = { n, g, o, og }; }
function lucy3_radioOff() { const W = lucy3_S.win; if (!W) return; lucy3_S.win = null; const t = Audio.ctx.currentTime; W.g.gain.setTargetAtTime(0, t, .1); W.og.gain.setTargetAtTime(0, t, .05); try { W.n.stop(t + .6); W.o.stop(t + .6); } catch (e) {} }

// ---------------------------------------------------------------- K3-1: Intro nach dem Klick – Glocke 3 + 13, Kinderstimme, Laternen, Luke, dann die Kuh
function lucy3_bells() { // Paket P2 (leben.js): Promise, erfüllt beim 16. Schlag; ohne P2 dieselbe Folge hier (Abstand 3,3 s, nach dem dritten 2 s Pause)
  if (typeof leben_bell3plus13 === 'function') { let r; try { r = leben_bell3plus13(); } catch (e) { console.warn('Glocke 3+13', e); }
    return Promise.race([Promise.resolve(r), lucy3_sleep(64000)]); }
  return new Promise(res => { const T = [0, 3300, 6600]; for (let i = 0; i < 13; i++) T.push(6600 + 3300 + 2000 + i * 3300);
    T.forEach((ms, i) => setTimeout(() => { if (typeof leben_bellStrike === 'function') leben_bellStrike(.7, false); if (i === 15) setTimeout(res, 300); }, ms)); }); }
// Fassung 3 (AP-17, Kap. 3 UK 1): Zusammensacken am Gully, Tafel, Aufwachen auf dem Asphalt (unscharf, Vorwärts = aufrappeln), Glocke 3 + 13,
// beim dreizehnten Schlag die Kinderstimme direkt am LINKEN Ohr, alle Laternen gehen an und atmen; Luke geht drei Schritte → „Blinde Kuh“.
const lucy3_weg = () => typeof kapitel3_S !== 'undefined' && kapitel3_S.resumed; // Weiterspielen mitten im Kapitel: kein Intro
async function lucy3_tafel() { // nahtloser Weg aus Kapitel 2: Luke sackt am Gully zusammen, dann die Tafel (Startmenü zeigt sie schon selbst)
  const fd = $('fade'); fd.style.background = '#000'; camY = Math.min(camY, .6); await fade(1, 900); try { document.exitPointerLock(); } catch (e) {}
  $('intro').innerHTML = typeof C3_INTRO !== 'undefined' ? C3_INTRO : ''; $('introSeq').classList.add('show'); fd.style.opacity = 0;
  await new Promise(r => { $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; try { lockPointer(); } catch (e) {} r(); }; }); }
async function lucy3_aufwachen() { // Kamera liegt auf dem Asphalt, die Sicht ist erst unscharf; Vorwärts = aufrappeln
  const cv = renderer.domElement, P = player.pos; player.pitch = .32; cv.style.transition = 'none'; cv.style.filter = 'blur(7px) brightness(.8)';
  let steh = false, k = 0; setScripted(dt => { if (!steh && (keys.KeyW || keys.ArrowUp)) { steh = true; cv.style.transition = 'filter 2.4s ease-out'; cv.style.filter = ''; }
    if (steh) { k = Math.min(1, k + dt / 1.5); const e = k * k * (3 - 2 * k); P.y = -1.35 * (1 - e); player.pitch += (0 - player.pitch) * Math.min(1, dt * 2); if (k >= 1) { P.y = 0; return false; } }
    else P.y = -1.35; return true; });
  const t0 = performance.now(); let hint = false; while (scripted) { await wait(120); if (!hint && performance.now() - t0 > 6000 && !steh) { hint = true; toast('W – aufstehen', 2600); } }
  setTimeout(() => { if (!cv.style.transition.includes('2.4')) cv.style.filter = ''; }, 2600); }
async function lucy3_opening() {
  const S = lucy3_S; if (S.opening) return; S.opening = true; const K = typeof kapitel3_S !== 'undefined' ? kapitel3_S : null;
  try {
    const nahtlos = K && !K.tafel, vorbei = typeof leben_uhrSync === 'function' && leben_uhrSync().c3; // die Glocke hat schon unter der Endkarte von Kapitel 2 geschlagen
    setC3('Hol Lucy zurück. Finde heraus, was mit Lost Eyengless geschehen ist.'); // F3 Verständlichkeit: das Ziel zuerst (Kap. 3 UK 5 „Hol Lucy zurück“)
    lamps.forEach(L => { L.mode = 'off'; }); // die Laternen der Ahornstraße sind aus, alle
    if (nahtlos) { await lucy3_tafel(); if (lucy3_weg()) return; }
    await lucy3_aufwachen(); if (lucy3_weg()) return;
    const P0 = player.pos.clone(); if (K) K.leine = P0; // bis die Glocke fertig ist, geht er nicht weit
    if (!vorbei) { await wait(1200); await lucy3_bells(); } else await wait(1600);
    if (lucy3_weg()) return;
    const P = player.pos, lx = -Math.cos(player.yaw) * .32, lz = Math.sin(player.yaw) * .32; // direkt am linken Ohr, so nah, dass man den Atem spürt
    Audio.whisper(P.x + lx, 1.62, P.z + lz, 1.6); Audio.giggle(P.x + lx * 1.2, 1.6, P.z + lz * 1.2);
    subtitle('„… siebzehn. Ich komme!“', 3000, 'KINDERSTIMME');
    lamps.forEach(L => { L.mode = 'pulse'; L.dead = 0; }); Audio.flick(); Audio.hum(true); // sämtliche Laternen gehen an, auch die ausgeblasenen – hell, dunkler, wieder hell; ein Summen im Bauch
    await wait(3400);
    await say([['Elf Anrufe. Diesmal geh ich ran.', 3200, 'DU']]);
    if (typeof gedanke === 'function') gedanke('c3_lucyweg', 'Der Tank war leer. Die Luke stand offen, und oben hat es geatmet. Was immer da oben ist, es hat jetzt Lucy.', 9000, 3); // F3 Verständlichkeit: was passiert ist, warum Luke weitermacht
    if (K) K.leine = null; if (typeof saveGame === 'function') saveGame(3); // Speicherpunkt „Kreuzung, 03:13“
    // R-1 (Story-Prüfung): kein Kiesel hinter der Telefonzelle mehr – Kiesel nur, wo eine Katze hinstarrt
    // UK 2: Luke geht drei Schritte in irgendeine Richtung
    const st = player.pos.clone(); while (Math.hypot(player.pos.x - st.x, player.pos.z - st.z) < 2.3) { await wait(150); if (lucy3_weg() || cowFx.done) return; }
    if (typeof kino_play === 'function' && typeof kino_S !== 'undefined' && kino_S.ready && typeof KINO !== 'undefined' && KINO.k3kuh && !cowFx.done) { Audio.hum(false); await kino_play('k3kuh').catch(e => console.error('Kino k3kuh', e)); Audio.hum(true); }
    else { cowDrop(); cowHit.position.set(-7.5, .6, .8); }
  } finally { S.opening = false; S.openDone = true; if (K) K.leine = null; }
}
chapter3Opening = lucy3_opening;

// ---------------------------------------------------------------- K3-4: Funkkasten 31,10 – Abstimmen (Skala, magisches Auge, Überlagerungspfeifen)
const LUCY3_BANDS = [[3.3, '90 m'], [4.9, '60 m'], [6.0, '49 m'], [7.2, '41 m'], [9.6, '31 m'], [11.8, '25 m'], [13.7, '22 m'], [15.4, '19 m'], [17.7, '16 m'], [21.6, '13 m'], [25.8, '11 m']];
function lucy3_drawDial(c, f, sig, t) {
  const x = c.getContext('2d'), w = c.width, h = c.height, fx = v => 34 + (v - 3) / 29 * (w - 68);
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6e4515'); g.addColorStop(.5, '#b07a34'); g.addColorStop(1, '#5a370f'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  const glow = x.createRadialGradient(w / 2, h * .55, 10, w / 2, h * .55, w * .6); glow.addColorStop(0, `rgba(255,205,120,${.35 + sig * .15})`); glow.addColorStop(1, 'rgba(255,120,30,0)'); x.fillStyle = glow; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(28,12,2,.9)'; x.fillStyle = 'rgba(28,12,2,.92)'; x.textAlign = 'center';
  for (let v = 3; v <= 32.001; v += .5) { const X = fx(v), big = Math.abs(v - Math.round(v)) < .01; x.lineWidth = big ? 2 : 1; x.beginPath(); x.moveTo(X, 92); x.lineTo(X, big ? 140 : 120); x.stroke();
    if (big && Math.round(v) % 2 === 1) { x.font = '600 34px "Cormorant Garamond", Georgia, serif'; x.fillText(String(Math.round(v)), X, 180); } }
  x.lineWidth = 3; x.beginPath(); x.moveTo(fx(3), 140); x.lineTo(fx(32), 140); x.stroke();
  x.font = 'italic 28px "Cormorant Garamond", Georgia, serif'; x.fillStyle = 'rgba(40,18,4,.85)';
  for (const [v, s] of LUCY3_BANDS) { const X = fx(v); x.fillText(s, X, 50); x.beginPath(); x.moveTo(X - 20, 64); x.lineTo(X + 20, 64); x.stroke(); }
  x.font = '600 22px "Cormorant Garamond", Georgia, serif'; x.fillStyle = 'rgba(40,18,4,.8)'; x.fillText('K U R Z W E L L E  ·  M H z', w / 2, 226);
  const X = fx(f) + Math.sin(t * 31) * .6; x.strokeStyle = '#a30d06'; x.lineWidth = 5; x.shadowColor = 'rgba(255,40,20,.7)'; x.shadowBlur = 8; x.beginPath(); x.moveTo(X, 6); x.lineTo(X, h - 6); x.stroke(); x.shadowBlur = 0;
  const v = x.createLinearGradient(0, 0, w, 0); v.addColorStop(0, 'rgba(0,0,0,.55)'); v.addColorStop(.12, 'rgba(0,0,0,0)'); v.addColorStop(.88, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.55)'); x.fillStyle = v; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * w, Math.random() * h, 1, 1);
}
function lucy3_drawEye(c, sig, t) {
  const x = c.getContext('2d'), w = c.width, r = w / 2; x.clearRect(0, 0, w, w);
  const bg = x.createRadialGradient(r, r, 2, r, r, r); bg.addColorStop(0, '#07130a'); bg.addColorStop(1, '#010302'); x.fillStyle = bg; x.beginPath(); x.arc(r, r, r, 0, 7); x.fill();
  const open = (1 - sig) * 1.7 + .05 + Math.sin(t * 23) * .02 * (1 - sig); // Schattenkeil schließt sich, je näher der Sender
  const gl = x.createRadialGradient(r, r, r * .22, r, r, r * .95); gl.addColorStop(0, `rgba(170,255,170,${.55 + sig * .35})`); gl.addColorStop(.6, `rgba(60,210,90,${.45 + sig * .3})`); gl.addColorStop(1, 'rgba(10,80,30,.15)');
  x.fillStyle = gl; x.beginPath(); x.moveTo(r, r); x.arc(r, r, r * .92, -PI / 2 + open / 2, -PI / 2 - open / 2 + PI * 2); x.closePath(); x.fill();
  x.fillStyle = '#020403'; x.beginPath(); x.arc(r, r, r * .24, 0, 7); x.fill(); x.strokeStyle = 'rgba(120,255,140,.25)'; x.lineWidth = 1; x.beginPath(); x.arc(r, r, r * .24, 0, 7); x.stroke();
  const sh = x.createRadialGradient(r * .7, r * .6, 1, r * .7, r * .6, r); sh.addColorStop(0, 'rgba(255,255,255,.12)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); x.fillStyle = sh; x.fillRect(0, 0, w, w);
}
function lucy3_radioPuzzle() {
  const S = lucy3_S;
  if (typeof kap === 'function' && kap() >= 4) return toast('Der Kasten ist tot. Kein Rauschen. Nichts.', 3000); // Sperre nach Kapitel 3: Funkkasten tot
  if (ch3.radio) return toast('Nur noch Rauschen. Und ganz hinten jemand, der atmet.', 4200);
  if (S.busy || state.talking) return;
  if (S.sperreBis && performance.now() < S.sperreBis) return toast('Der Kasten ist zu. Das Rauschen dahinter lacht leise.', 2600); // nach einem Fehlschlag zehn Sekunden zu
  if (S.tuned) return lucy3_funk();
  const tok = ++S.tok; lucy3_radioOn();
  openPuzzle(`<div class="l3"><h3>FUNKKASTEN · BUNDESSTELLE FÜR RÜCKFÜHRUNG</h3><div><span class="sticker">Notfrequenz: siehe Dienstbuch H. Wendt.</span></div>
    <div class="dial"><canvas id="l3Dial" width="1480" height="244"></canvas></div>
    <div class="tune"><div class="eye"><canvas id="l3Eye" width="192" height="192"></canvas></div>
      <div class="knob"><div class="freq" id="l3F">14,00<small>MHz</small></div><input type="range" id="rF" min="3" max="32" step="0.01" value="14.00">
        <div class="fine">FEIN <button id="l3Dn">−</button><button id="l3Up">+</button></div></div></div>
    <div class="status" id="l3St"></div><div class="row"><button id="rOk">HINHÖREN</button></div></div>`, box => {
    box.classList.add('l3box'); lucy3_S.boxed = true; const f = box.querySelector('#rF'), dial = box.querySelector('#l3Dial'), eye = box.querySelector('#l3Eye'), st = box.querySelector('#l3St');
    let sig = 0, murT = 0;
    const upd = () => { const v = +f.value, d = Math.abs(v - RADIO_F); sig = Math.exp(-d * d / (2 * .32 * .32)); box.querySelector('#l3F').innerHTML = v.toFixed(2).replace('.', ',') + '<small>MHz</small>';
      const W = S.win; if (W) { const t = Audio.ctx.currentTime; W.o.frequency.setTargetAtTime(40 + Math.min(2600, d * 1500), t, .03); W.og.gain.setTargetAtTime(d < .06 ? 0 : .02 * Math.min(1, sig * 3), t, .05); W.g.gain.setTargetAtTime(.03 + .05 * (1 - sig), t, .08); }
      if (typeof rangeFill === 'function') rangeFill(f); };
    f.oninput = () => { upd(); st.textContent = ''; if (Math.random() < .3) Audio.flick(); }; upd();
    box.querySelector('#l3Dn').onclick = e => { e.stopPropagation(); f.value = (+f.value - .01).toFixed(2); f.oninput(); };
    box.querySelector('#l3Up').onclick = e => { e.stopPropagation(); f.value = (+f.value + .01).toFixed(2); f.oninput(); };
    let kaltT = 0; const t00 = performance.now() / 1000;
    const draw = () => { if (tok !== S.tok || ui.overlay !== 'puzzle') return; const t = performance.now() / 1000; lucy3_drawDial(dial, +f.value, sig, t); lucy3_drawEye(eye, Math.min(1, sig + (Math.random() - .5) * .04), t);
      if (Math.abs(+f.value - RADIO_F) < .06 && t > murT) { murT = t + 2.6; lucy3_voice('amt', 1.8, null, .35); }
      // auf 13,10 und 10,31 flüstert kurz eine Kinderstimme „kalt, kalt, eiskalt“
      if ((Math.abs(+f.value - 13.1) < .05 || Math.abs(+f.value - 10.31) < .05) && t > kaltT) { kaltT = t + 5; Audio.whisper(player.pos.x + .3, 1.6, player.pos.z, 1.4); st.textContent = '„kalt, kalt, eiskalt“'; }
      S.dialT = (S.dialT || 0) + 1 / 60; if (!S.hintDial && t - t00 > 55) { S.hintDial = true; lucy3_lukeGedanke('Der Tag, an dem sie kam. Den Tag hab ich heute Nacht schon mal irgendwo eingetippt.'); }
      requestAnimationFrame(draw); };
    requestAnimationFrame(draw);
    box.querySelector('#rOk').onclick = e => { e.stopPropagation(); const d = Math.abs(+f.value - RADIO_F);
      if (d < .06) { closeOverlay(); broadcast(); }
      else { Audio.beep(false); st.textContent = d < .6 ? 'Da – ganz schwach, eine Stimme unter dem Rauschen. Ein kleines Stück weiter.' : d < 3 ? 'Rauschen. Vielleicht ein Pfeifen darin.' : 'Nur Rauschen.'; } };
  });
  ui.onClose = () => { if (tok === S.tok) lucy3_radioOff(); lucy3_unbox(); };
}
// Das Rätselfenster teilen sich alle: die breite Funk-Gestalt nach dem Schließen wieder entfernen
function lucy3_unbox() { const b = $('puzzle').querySelector('.box'); if (b) b.classList.remove('l3box'); }
radioPuzzle = lucy3_radioPuzzle;
async function lucy3_broadcast() {
  const S = lucy3_S; if (ch3.radio) return;
  S.tuned = true; state.talking = true; radioLed.material.emissive.set(0xffa020); Audio.intercomClick(radioLed.position.x, radioLed.position.y, radioLed.position.z); const F = 'FUNK · 31,10 MHz', d = Audio.ctx ? Audio.at(5.4, 1, -6.6, 3) : null;
  setTimeout(() => lucy3_voice('amt', 3.2, d), 1700);
  await say([['„Hier Außenstelle Lost Eyengless. Zyklus siebzehn. Alle Kinder bitte an ihre Plätze.“', 4600, 'AMTSSTIMME']]); Audio.play('switch1', { gain: .2, rate: .7, x: 5.4, y: 1, z: -6.6, ref: 2 }); await wait(900); // Gong, Rauschen; unter der Amtsstimme läuft die Spieluhr; ein Knacken
  state.talking = false; lucy3_funk();
}
broadcast = lucy3_broadcast;

// ---------------------------------------------------------------- K3-4: zwei Kanäle, drei Fragen, in den Staub schreiben, senden
const LUCY3_Q = [
  ['hund', 'Wie hieß unser Hund?', '„Flocke.“', '„Flocke.“'],
  ['wo', 'Wo bist du?', '„Im Dunkeln. Hol mich raus.“', '„Im Dunkeln. Im Tank, glaub ich. Es ist nass.“'],
  ['wort', 'Sag unser Wort.', '„Hasen … Hasen … sag du es zuerst, Großer.“', '„Das haben wir nie gesagt. Schreib’s. Dann weiß ich, dass du’s bist.“']];
// Lukes Gedanke (Hilfeleiter): im Funkfenster in der Zeile „DU“, sonst als Untertitel
function lucy3_lukeGedanke(t) { const S = lucy3_S; if (S.box) { const el = S.box.querySelector('#l3Luke'); if (el) el.innerHTML = `<b>LUKE</b><i>${t}</i>`; S.luke = ''; }
  else if (ui.overlay === 'puzzle') { const st = $('puzzle').querySelector('#l3St'); if (st) st.innerHTML = `<i>${t}</i>`; } subtitle(t, 4600, 'LUKE'); }
const LUCY3_WORDS = ['FLOCKE', 'GROSSER', 'HEIM', 'HASENBROT'];
function lucy3_funk() {
  const S = lucy3_S, tok = ++S.tok; lucy3_radioOn();
  openPuzzle(`<div class="l3"><h3>FUNKKASTEN · 31,10 MHz</h3>
    <div class="chans">${['A', 'B'].map(c => `<div class="ch" id="l3C${c}"><h4><span class="lamp" id="l3L${c}"></span>KANAL ${c}</h4><canvas class="scope" id="l3O${c}" width="600" height="116"></canvas><div class="log" id="l3G${c}"></div></div>`).join('')}</div>
    <div class="luke" id="l3Luke"></div>
    <div class="sect">FRAGEN</div><div class="row qs">${LUCY3_Q.map(q => `<button data-q="${q[0]}">${q[1]}</button>`).join('')}</div>
    <div class="sect">IN DEN STAUB SCHREIBEN</div><div class="row words">${LUCY3_WORDS.map(w => `<button data-w="${w}">${w}</button>`).join('')}</div>
    <div class="dust" id="l3Dust"><em>Auf dem Deckel liegt Staub. Man könnte hineinschreiben.</em></div>
    <div class="row send"><button id="l3SA">AN KANAL A SENDEN</button><button id="l3SB">AN KANAL B SENDEN</button><button id="l3Say" style="opacity:.8">INS MIKROFON SAGEN</button></div></div>`, box => {
    box.classList.add('l3box'); lucy3_S.boxed = true; S.box = box;
    for (const c of ['A', 'B']) { const G = box.querySelector('#l3G' + c); for (const e of S.log) if (e.c === c) lucy3_logEl(G, e); G.scrollTop = 1e6; if (S.dead && c === 'A') box.querySelector('#l3LA').classList.add('dead'); }
    lucy3_lukeShow(S.luke);
    if (S.word) lucy3_dustShow(S.word, true);
    box.querySelectorAll('.qs button').forEach(b => b.onclick = e => { e.stopPropagation(); lucy3_ask(b.dataset.q, tok); });
    box.querySelectorAll('.words button').forEach(b => b.onclick = e => { e.stopPropagation(); lucy3_write(b.dataset.w, tok); });
    box.querySelector('#l3SA').onclick = e => { e.stopPropagation(); lucy3_send('A', tok); };
    box.querySelector('#l3SB').onclick = e => { e.stopPropagation(); lucy3_send('B', tok); };
    box.querySelector('#l3Say').onclick = e => { e.stopPropagation(); lucy3_sagen(tok); };
    const cA = box.querySelector('#l3OA'), cB = box.querySelector('#l3OB');
    const draw = () => { if (tok !== S.tok || ui.overlay !== 'puzzle') return; const t = performance.now() / 1000; lucy3_scope(cA, S.scopeA, t, true, S.dead); lucy3_scope(cB, S.scopeB, t, false, false); lucy3_btns(); requestAnimationFrame(draw); };
    requestAnimationFrame(draw);
  });
  ui.onClose = () => { if (tok === S.tok) { S.tok++; lucy3_radioOff(); S.scopeA = S.scopeB = 0; S.box = null; if (!ch3.radio) S.busy = false; } lucy3_unbox(); };
  if (!S.greeted) lucy3_greet(tok);
}
function lucy3_btns() { const S = lucy3_S, box = S.box; if (!box) return; const b = S.busy || !S.greeted;
  box.querySelectorAll('.qs button').forEach(x => { x.disabled = b; x.style.opacity = S.asked.has(x.dataset.q) && !b ? .6 : ''; });
  box.querySelectorAll('.words button').forEach(x => { x.disabled = b; x.classList.toggle('sel', x.dataset.w === S.word); });
  box.querySelector('#l3SA').disabled = box.querySelector('#l3SB').disabled = box.querySelector('#l3Say').disabled = b || !S.word; }
function lucy3_scope(c, amp, t, tines, dead) {
  if (!c) return; const x = c.getContext('2d'), w = c.width, h = c.height, m = h / 2; x.fillStyle = 'rgba(3,8,5,.55)'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(80,160,100,.12)'; x.lineWidth = 1; for (let i = 1; i < 6; i++) { x.beginPath(); x.moveTo(i * w / 6, 0); x.lineTo(i * w / 6, h); x.stroke(); } x.beginPath(); x.moveTo(0, m); x.lineTo(w, m); x.stroke();
  x.strokeStyle = dead ? 'rgba(90,120,95,.35)' : `rgba(130,255,160,${.55 + amp * .4})`; x.lineWidth = 2; x.shadowColor = 'rgba(90,255,140,.8)'; x.shadowBlur = dead ? 0 : 6; x.beginPath();
  for (let i = 0; i <= w; i += 3) { const u = i / w; let y = dead ? 0 : (Math.random() - .5) * 7 * (1 - amp * .5);
    if (!dead && amp > .02) y += Math.sin(u * 55 + t * 40) * Math.sin(u * 9 - t * 7) * amp * m * .8 + (Math.random() - .5) * amp * 16;
    if (!dead && tines && amp > .02) { const ph = (t * 2.17 + u * .6) % 1; if (ph < .035) y -= amp * m * .55 * (1 - ph / .035); } // Zinken der Spieluhr: kurze, regelmäßige Spitzen
    i ? x.lineTo(i, m + y) : x.moveTo(i, m + y); }
  x.stroke(); x.shadowBlur = 0;
}
function lucy3_logEl(G, e) { const d = document.createElement('div'); d.className = e.k || ''; d.textContent = e.t; G.appendChild(d); return d; }
function lucy3_log(c, t, k) { const S = lucy3_S, e = { c, t, k }; S.log.push(e); if (S.box) { const G = S.box.querySelector('#l3G' + c); if (G) { lucy3_logEl(G, e); G.scrollTop = 1e6; } } }
function lucy3_lukeShow(t) { const S = lucy3_S; S.luke = t; if (S.box) S.box.querySelector('#l3Luke').innerHTML = t ? `<b>DU</b>${t}` : ''; }
function lucy3_lamp(c, cls) { const S = lucy3_S; if (!S.box) return; const L = S.box.querySelector('#l3L' + c), C = S.box.querySelector('#l3C' + c); if (!L) return; L.className = 'lamp' + (cls ? ' ' + cls : ''); C.classList.toggle('live', cls === 'on'); }
const lucy3_dur = t => Math.max(1.5, Math.min(4.2, t.length * .055));
// Eine Antwort auf einem Kanal: Lampe, Stimme (ohne Klartext), Leuchtspur, Mitschrift
async function lucy3_speak(c, t, tok) { const S = lucy3_S; if (tok !== S.tok) return false; const sec = lucy3_dur(t);
  lucy3_lamp(c, 'on'); lucy3_voice(c === 'A' ? 'a' : 'b', sec); if (c === 'A') S.scopeA = 1; else S.scopeB = 1; lucy3_log(c, t, 'v');
  await lucy3_sleep(sec * 1000 + 250); lucy3_lamp(c, S.dead && c === 'A' ? 'dead' : ''); if (c === 'A') S.scopeA = 0; else S.scopeB = 0; await lucy3_sleep(420); return tok === S.tok; }
async function lucy3_greet(tok) { const S = lucy3_S; S.busy = true; await lucy3_sleep(900); if (tok !== S.tok) return;
  const t = '„Großer? Großer, bist du das?“'; lucy3_lamp('A', 'on'); lucy3_lamp('B', 'on'); S.scopeA = S.scopeB = 1; lucy3_voice('a', 2.2, null, .8); lucy3_voice('b', 2.2, null, .8);
  if (!S.log.length) { lucy3_log('A', t, 'v'); lucy3_log('B', t, 'v'); } await lucy3_sleep(2600); lucy3_lamp('A', ''); lucy3_lamp('B', ''); S.scopeA = S.scopeB = 0; if (tok !== S.tok) return;
  await lucy3_sleep(500); lucy3_lukeShow('„Beide sagen Großer.“'); S.greeted = true; ch3.funk = true; S.busy = false;
  // Hilfeleiter: (2) Kanal B wiederholt nach einer Minute leise; (3) nach drei Minuten ohne Fortschritt kratzt Whiskey Striche in den Staub
  setTimeout(async () => { if (ch3.radio || S.box === null || !S.box || S.busy) return; const t = S.tok; S.busy = true; await lucy3_speak('B', '„Schreib’s, Großer.“', t); if (t === S.tok) S.busy = false; }, 60000);
  setTimeout(() => { if (!ch3.radio && S.radioFails < 2 && typeof whiskey_schreibgeste === 'function') try { whiskey_schreibgeste(); } catch (e) {} }, 180000); }
async function lucy3_ask(id, tok) { const S = lucy3_S; if (S.busy || tok !== S.tok) return; const q = LUCY3_Q.find(x => x[0] === id); if (!q) return; S.busy = true;
  lucy3_lukeShow(`„${q[1]}“`); lucy3_log('A', '— ' + q[1], 'q'); lucy3_log('B', '— ' + q[1], 'q'); await lucy3_sleep(1100);
  const qa = id === 'wort' && S.gesagt ? '„HASENBROT. Siehst du, Großer? Ich bin’s.“' : q[2]; // nach dem lauten Sagen kann Kanal A es auch
  if (await lucy3_speak('A', qa, tok) && await lucy3_speak('B', q[3], tok)) { S.asked.add(id);
    if (S.asked.size === 3 && !S.allAsked) { S.allAsked = true; await lucy3_sleep(400); lucy3_lukeGedanke('Eine von beiden hört durch mich mit. Was weiß Lucy, das ich nie laut gesagt hab?'); } }
  if (tok === S.tok) S.busy = false; }
function lucy3_dustShow(w, instant) { const S = lucy3_S; if (!S.box) return; const D = S.box.querySelector('#l3Dust'); D.innerHTML = ''; const s = document.createElement('span'); s.textContent = w; if (instant) s.style.animation = 'none', s.style.clipPath = 'none'; D.appendChild(s); }
async function lucy3_write(w, tok) { const S = lucy3_S; if (S.busy || tok !== S.tok || S.word === w) return; S.busy = true;
  if (S.word && S.box) { const old = S.box.querySelector('#l3Dust span'); if (old) { old.className = 'gone'; Audio.paper(); await lucy3_sleep(700); } }
  S.word = w; lucy3_dustShow(w); lucy3_scratch(player.pos.x, player.pos.z, false); await lucy3_sleep(1400); if (tok === S.tok) S.busy = false; }
async function lucy3_send(c, tok) { const S = lucy3_S; if (S.busy || tok !== S.tok || !S.word) return; S.busy = true; const w = S.word;
  Audio.intercomClick(radioLed.position.x, radioLed.position.y, radioLed.position.z); lucy3_log(c, `— ${w}`, 'q'); await lucy3_sleep(900); if (tok !== S.tok) return;
  if (w === 'HASENBROT' && c === 'B' && (!S.gesagt || S.asked.has('wo'))) return lucy3_win(tok); // nach dem lauten Sagen geht es nur noch über Frage 2 (nur B weiß vom Tank)
  lucy3_fail(tok);
}
// Das Wort laut ins Mikrofon sagen: dann ist es verbraucht – Kanal A sagt es ab jetzt auch (der einzige dauerhafte Fehler des Kapitels)
async function lucy3_sagen(tok) { const S = lucy3_S; if (S.busy || tok !== S.tok || !S.word) return; S.busy = true; const w = S.word;
  lucy3_lukeShow(`„${w.charAt(0) + w.slice(1).toLowerCase()}.“`); lucy3_log('A', '— ' + w + ' (laut)', 'q'); lucy3_log('B', '— ' + w + ' (laut)', 'q'); await lucy3_sleep(1200);
  if (w === 'HASENBROT') { S.gesagt = true; S.scopeA = 1; lucy3_lamp('A', 'on'); lucy3_log('A', '„Hasenbrot.“', 'v'); lucy3_voice('a', 1.4); Audio.giggle(player.pos.x + .6, 1.5, player.pos.z); await lucy3_sleep(1800); S.scopeA = 0; lucy3_lamp('A', ''); }
  if (tok === S.tok) S.busy = false; }
async function lucy3_win(tok) { const S = lucy3_S; ch3.radio = true; state.talking = true;
  await lucy3_speak('B', '„Da bist du.“', tok);
  // Kanal A kreischt und verstummt
  if (S.box) S.box.querySelector('#l3CA').classList.add('shriek'); lucy3_lamp('A', 'red'); S.scopeA = 1; lucy3_log('A', '*kreischt*', 'fx'); Audio.screech(); shake = .03; glitchV = .5;
  await lucy3_sleep(1300); S.dead = true; S.scopeA = 0; lucy3_lamp('A', 'dead'); lucy3_log('A', '— verstummt —', 'mute'); if (S.box) S.box.querySelector('#l3CA').classList.remove('shriek');
  await lucy3_sleep(1800);
  if (ui.overlay === 'puzzle' && tok === S.tok) closeOverlay(); S.busy = false; lucy3_radioOff();
  radioLed.material.emissive.set(0x30ff60);
  // Lucy (B), mit Rauschen, keine Spieluhr – die Stimme kommt aus dem Kasten
  const L = 'LUCY · KANAL B', lines = [['„Sie hat die Lampen ausgeblasen, wie sie uns geholt hat. Mach’s genauso. Dann denkt sie, es ist ihr eigenes Spiel.“', 5600, L],
    ['„Vor unseren Häusern. In ihrer Reihenfolge. Hilde hat aufgeschrieben, wann.“', 4600, L]];
  const d = Audio.ctx ? Audio.at(5.4, 1, -6.6, 3) : null;
  for (const l of lines) { lucy3_voice('b', Math.min(4.5, l[1] / 1000 * .85), d, .9); await say([l]); }
  await say([['Lucy, ich –', 1400, 'DU']]); lucy3_voice('b', 2.8, d, .9); await say([['„Großer. Ich hör dich atmen. Hör nicht auf damit.“', 4200, L]]);
  state.talking = false; lucy3_blink(); if (typeof sammeln_fibel === 'function') sammeln_fibel('R-K3c');
  setC3('Lösch die Laternen vor den Häusern, in der Reihenfolge, in der sie die Kinder geholt hat.');
  story.lore = story.lore.filter(x => x.key !== 'c3funk');
  story.lore.push({ key: 'c3funk', title: 'Zwei Lucys', html: 'Zwei Kanäle, beide „Großer“. Beide kennen Flocke. Beide sind im Dunkeln. Nur eine weiß, dass wir HASENBROT nie laut gesagt haben.\n\n<span class="hand">Regel Stille Post: Sie kann jede Stimme. Sie kann kein Wort, das nie gesagt wurde.</span>' });
  questPop('NACHBILD', 'Zwei Lucys'); if (typeof kapitel3_uk_setzen === 'function') kapitel3_uk_setzen(7); if (typeof saveGame === 'function') saveGame(3); // Speicherpunkt „Kanal B“
}
async function lucy3_fail(tok) { const S = lucy3_S; S.radioFails++;
  lucy3_lamp('A', 'red'); S.scopeA = 1; lucy3_log('A', '*lacht*', 'fx'); Audio.giggle(player.pos.x + 1, 1.5, player.pos.z - .5); await lucy3_sleep(1200); if (tok !== S.tok) return;
  lucy3_log('A', '„Sieben, eins, drei, fünf.“', 'v'); Audio.whisper(player.pos.x + .4, 1.6, player.pos.z, 2); lucy3_voice('a', 1.8, null, .5); await lucy3_sleep(2200);
  S.scopeA = 0; lucy3_lamp('A', ''); lucy3_flare(); if (S.box) S.box.querySelector('.l3').classList.add('flare');
  await lucy3_sleep(900); S.word = null; if (ui.overlay === 'puzzle' && tok === S.tok) closeOverlay(); S.busy = false; lucy3_radioOff(); S.sperreBis = performance.now() + 10000; // der Kasten schließt sich für zehn Sekunden
  // Hilfeleiter: (3) Whiskey kratzt Striche in den Staub (nach zwei falschen Sendungen), (4) B-K3-H2 hinter Lukes Füßen (nach dem dritten Fehlversuch)
  if (S.radioFails === 2 && typeof whiskey_schreibgeste === 'function') setTimeout(() => { try { whiskey_schreibgeste(); } catch (e) {} }, 11000);
  if (S.radioFails === 3 && typeof beobachter_zettel === 'function') setTimeout(() => { try { beobachter_zettel('B-K3-H2', {}); } catch (e) {} }, 6000);
  for (let i = 0; i < 3; i++) setTimeout(() => Audio.giggle(player.pos.x + rand(-9, 9), 1.2, player.pos.z + rand(-9, 9)), 400 + i * 700);
  // Hilfe (5): Justin am Funkkasten, einmal von sich aus
  if (!S.justinTold && ch3.met) setTimeout(() => { if (S.justinTold || ch3.radio || state.talking || ui.overlay || jDist() > 14) return; S.justinTold = true; state.talking = true;
    say([['„Stimmen kann sie nachmachen. Was nie gesagt wurde, nicht.“', 4200, JS]]).then(() => { state.talking = false; }); }, 4200);
}
// Alle Laternen flammen auf (auch schon gelöschte), danach zurück in ihren vorigen Zustand
function lucy3_flare() { const P = lucy3_S.lampPrev; if (P.length !== lamps.length) P.length = lamps.length; if (lucy3_S.flaring) return; lucy3_S.flaring = true;
  lamps.forEach((L, i) => { P[i] = L.mode; L.mode = 'flicker'; }); Audio.stinger(false); shake = .03; glitchV = .6;
  setTimeout(() => { lamps.forEach((L, i) => { if (L.mode === 'flicker') L.mode = P[i] || 'pulse'; }); lucy3_S.flaring = false; }, 2600); }
// Lucys Antwort, sichtbar: das Auto an der Südsperre blendet zweimal auf
function lucy3_blink() { const S = lucy3_S; if (!S.lights.length && !S.hlMats.length) return; const set = k => { S.lights.forEach(l => l.intensity = l.userData.l3i * k); S.hlMats.forEach(m => m.emissiveIntensity = m.userData.l3e * k); };
  [[0, 0], [260, 1.8], [520, 0], [780, 1.8], [1300, 1]].forEach(([ms, k]) => setTimeout(() => set(k), ms)); }

// ---------------------------------------------------------------- K3-5: Laternen – herleiten, Fehlschläge mit Hilfeleiter, Nachhall der Unterschriften
const LUCY3_SIGN = { // Nachhall am Haus (3 s, eine Zeile): wer an welchem Tag unterschrieben hat
  5: { who: 'reuter', clip: 'look', line: ['„Wenn\'s denn sein muss.“', 3000, 'FRAU REUTER, 2009'] }, // Q-6: eigene Figur Frau Reuter (Ersatz aydin, solange nicht gebaut)
  3: { who: 'vegas', clip: 'nervous', line: ['„Für Mike. Gott vergib mir.“', 3000, 'VEGAS, 2009'] },
  1: { who: 'mama', clip: 'nervous', line: null, twice: true }, // Mama setzt zweimal an – keine Zeile, nur der Füller
  7: { who: 'hilde', clip: 'idle', line: ['„Das Los ist das Los.“', 3000, 'HILDE WENDT, 2009'] } };
async function lucy3_sign(S0) { const E = LUCY3_SIGN[S0.n], g = lucy3_S.signs[S0.n]; if (!E) return; const x = S0.m.position.x + .9, z = -7.05;
  if (g) { g.position.set(x, 0, z); g.rotation.y = Math.atan2(player.pos.x - x, player.pos.z - z); g.visible = true; }
  const useGhost = !!g && !state.talking; lucy3_S.signBusy = true;
  Audio.whisper(x, 1.6, z, 1.6); glitchV = .45; if (typeof figuren_memoryLook === 'function') figuren_memoryLook(true);
  const o0 = echoMat.opacity; if (useGhost) for (let k = 0; k <= 12; k++) { echoMat.opacity = k / 12 * .32; await lucy3_sleep(30); }
  if (E.line) subtitle(E.line[0], E.line[1], E.line[2]); if (E.twice) lucy3_scratch(x, z, true); else lucy3_scratch(x, z, false);
  await lucy3_sleep(3000);
  if (useGhost) for (let k = 12; k >= 0; k--) { echoMat.opacity = k / 12 * .32 * (Math.random() < .3 ? .3 : 1); await lucy3_sleep(34); }
  echoMat.opacity = useGhost ? 0 : o0; if (g) g.visible = false; if (typeof figuren_memoryLook === 'function' && !state.talking) figuren_memoryLook(false); lucy3_S.signBusy = false; }
function lucy3_pressSwitch(S) {
  if (typeof kap === 'function' && kap() >= 4) return toast('Absperrband. Der Kasten ist verplombt.', 2600); // Sperre nach Kapitel 3 (AG-11)
  if (ch3.lampsOff) return toast('Alle Laternen sind aus. Nur das Weiß über der Senke bleibt.');
  if (!ch3.met) return toast('Blechschild, Stadtwerke: LEUCHTE AUS / EIN · Nur für befugtes Personal · Schlüssel beim Amt.' + (S.n === 7 ? ' Darüber ein Zettel in Hildes Druckschrift: ZULETZT.' : ''), 5200);
  if (S.off) return toast('Der Hebel steht schon auf AUS.');
  if (lucy3_S.flaring || lucy3_S.signBusy) return;
  if (!ch3.seq.length) lucy3_S.erster = S.n; // Wolters Folge (1, 3, 5, 7) scheitert schon am ersten Kasten
  S.off = true; S.L.mode = 'off'; ch3.seq.push(S.n); Audio.play('switch2', { gain: .6, x: S.m.position.x, y: .8, z: -5.5, ref: 2 }); Audio.flick();
  const ok = ch3.seq.every((n, i) => n === LAMP_ORDER[i]);
  if (!ok) { wrongSwitch(); return; }
  if (ch3.seq.length === 4) { lucy3_sign(S).then(() => lampsOut()); return; }
  lucy3_enger(ch3.seq.length); lucy3_sign(S).then(() => { if (typeof saveGame === 'function' && !state.talking) saveGame(3); }); // Speicherpunkt nach jeder richtig gelöschten Laterne
}
// Nach jeder Laterne wird das Summen tiefer, die Straße enger (Nebel rückt herein), und eine Kinderstimme irgendwo zählt rückwärts
function lucy3_enger(n) { const S = lucy3_S; if (!S.nebel0) S.nebel0 = scene.fog.density; S.nebelZiel = S.nebel0 * (1 + .28 * n);
  setTimeout(() => { const P = player.pos, a = rand(0, 6.28); Audio.whisper(P.x + Math.sin(a) * 9, 1.2, P.z + Math.cos(a) * 9, 1.8); if (!S.zaehlt) { S.zaehlt = true; subtitle('„vier … drei …“', 2600, 'KINDERSTIMME'); } }, 4200); }
pressSwitch = lucy3_pressSwitch;
async function lucy3_wrongSwitch() {
  const S = lucy3_S; S.lampFails++; ch3.lampFails = S.lampFails; ch3.seq = []; shake = .03; glitchV = .6;
  lamps.forEach(L => { if (L.mode !== 'off' || switchBoxes.some(B => B.L === L)) L.mode = 'flicker'; }); // alle Laternen flammen gleichzeitig auf, Kinderlachen, die Hebel springen zurück
  Audio.giggle(player.pos.x + 4, 1.2, player.pos.z - 4); setTimeout(() => Audio.giggle(player.pos.x - 6, 1.2, player.pos.z + 3), 700);
  await wait(2600); switchBoxes.forEach(B => { B.off = false; }); lamps.forEach(L => L.mode = 'pulse');
  subtitle('Falsch. So hat sie sie nicht geholt.', 3400); await wait(3400);
  if (S.erster === 1 && !S.post && typeof kapitel3_S !== 'undefined' && kapitel3_S.ag09) { S.post = true; await say([['Wie die Post. Sehr witzig, Herr Wolter.', 3000, 'LUKE']]); }
  if (!ch3.radio) { jHint(); return; }
  const k = S.lampFails;
  if (k === 1) { await say([['Juni, Juli, Oktober. Die hat nicht nach Hausnummern geholt. Nach Kalender.', 4400, 'LUKE']]); return; } // (2)
  // (3) nach dem zweiten Fehler: B-K3-H3 (beobachter.js, automatisch) · (4) nach dem dritten: der Funkkasten knackt, Lucy; „ZULETZT.“ leuchtet im Lampenlicht auf · (5) Justin
  if (k === 3 && !state.talking) { await wait(900); state.talking = true; Audio.intercomClick(radioLed.position.x, radioLed.position.y, radioLed.position.z); lucy3_voice('b', 3, Audio.ctx ? Audio.at(5.4, 1, -6.6, 3) : null, .9);
    await say([['„Hilde hat als Letzte unterschrieben. Sie hat sie als Letzte geholt.“', 4400, 'LUCY · FUNK']]); state.talking = false; S.zuletztLeuchtet = true; }
  if (k >= 4 && !S.jLamp && ch3.met && jDist() < 16 && !state.talking) { S.jLamp = true; state.talking = true; await say([['„Fang bei der an, die zuerst gegangen ist. Die mit dem Feuer.“', 4000, JS]]); state.talking = false; }
}
wrongSwitch = lucy3_wrongSwitch;

// ---------------------------------------------------------------- K3-3: Lucys Auto an der Südsperre (Decals, Abgas, Motor, Radio, Handabdruck)
// Beschlagene Heckscheibe: Beschlag mit Tropfen; GROSSER mit dem Finger freigewischt (von innen), darunter älter HASEN…, der Rest mit dem Ärmel weg
function lucy3_fogTex() { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'), w = 1024, h = 512;
  const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(196,204,210,.34)'); g.addColorStop(1, 'rgba(186,194,200,.46)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(235,240,244,${rand(.03, .1)})`; x.beginPath(); x.arc(rand(0, w), rand(0, h), rand(.6, 2.6), 0, 7); x.fill(); } // Beschlag-Körnung
  // Ränder dichter (Scheibe beschlägt vom Rand her)
  const e = x.createRadialGradient(w / 2, h / 2, h * .2, w / 2, h / 2, w * .62); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(1, 'rgba(215,222,226,.22)'); x.fillStyle = e; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'destination-out';
  // GROSSER – Fingerschrift, frisch
  x.save(); x.translate(w * .5, h * .4); x.rotate(-.035); x.font = '500 196px Caveat, cursive'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(0,0,0,.93)'; x.fillText('GROSSER', 0, 0);
  x.lineWidth = 3; x.strokeStyle = 'rgba(0,0,0,.6)'; x.strokeText('GROSSER', 0, 0); x.restore();
  // Tropfen, die aus den Buchstaben herunterlaufen
  for (let i = 0; i < 22; i++) { const px = rand(w * .17, w * .83), py = rand(h * .45, h * .52), L = rand(30, 150); x.lineWidth = rand(3, 6); x.strokeStyle = 'rgba(0,0,0,.75)'; x.beginPath(); x.moveTo(px, py); x.bezierCurveTo(px + rand(-4, 4), py + L * .4, px + rand(-6, 6), py + L * .7, px + rand(-5, 5), py + L); x.stroke(); x.beginPath(); x.arc(px, py + L, x.lineWidth * .9, 0, 7); x.fill(); }
  // HASEN… – älter, halb wieder beschlagen
  x.save(); x.translate(w * .34, h * .8); x.rotate(.03); x.font = '500 110px Caveat, cursive'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(0,0,0,.5)'; x.fillText('HASEN', 0, 0); x.restore();
  // … der Rest mit dem Ärmel weggewischt: breiter, weicher Bogen
  for (let i = 0; i < 9; i++) { const y = h * .76 + i * 5; x.lineWidth = 22; x.lineCap = 'round'; x.strokeStyle = `rgba(0,0,0,${.07 + Math.random() * .05})`; x.beginPath(); x.moveTo(w * .56, y + 26); x.quadraticCurveTo(w * .7, y - 30, w * .9, y + 12); x.stroke(); }
  x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(215,220,224,${rand(.1, .25)})`; x.beginPath(); x.arc(rand(w * .2, w * .5), rand(h * .72, h * .9), rand(3, 12), 0, 7); x.fill(); } // neu beschlagen
  // weiche Ränder: der Beschlag endet am Scheibenrahmen nicht als Rechteck
  x.globalCompositeOperation = 'destination-in'; const fx = x.createLinearGradient(0, 0, w, 0); fx.addColorStop(0, 'rgba(0,0,0,0)'); fx.addColorStop(.06, '#000'); fx.addColorStop(.94, '#000'); fx.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = fx; x.fillRect(0, 0, w, h);
  const fy = x.createLinearGradient(0, 0, 0, h); fy.addColorStop(0, 'rgba(0,0,0,0)'); fy.addColorStop(.08, '#000'); fy.addColorStop(.92, '#000'); fy.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = fy; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over';
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function lucy3_handTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = 'rgba(14,18,22,.72)'; x.translate(128, 150); x.rotate(-.18);
  x.beginPath(); x.ellipse(0, 20, 40, 48, 0, 0, 7); x.fill();
  [[-38, -30, -.5, 13, 44], [-16, -58, -.12, 11, 52], [4, -64, .02, 11, 56], [24, -56, .15, 10, 50], [42, -34, .42, 9, 38]].forEach(([fx, fy, r, rw, rh]) => { x.save(); x.translate(fx, fy); x.rotate(r); x.beginPath(); x.ellipse(0, 0, rw, rh / 2, 0, 0, 7); x.fill(); x.restore(); });
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(0,0,0,${rand(.2, .7)})`; x.beginPath(); x.arc(rand(0, 256), rand(0, 256), rand(1, 3), 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
// Blauer Kreispfeil (Lucys Zeichen): Kreis, aus dem ein Pfeil in Laufrichtung zeigt – Sprühfarbe, leicht rückstrahlend
function lucy3_arrowTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.strokeStyle = 'rgba(60,140,255,.95)'; x.fillStyle = x.strokeStyle; x.lineCap = 'round'; x.lineWidth = 15;
  x.beginPath(); x.arc(104, 128, 58, .55, PI * 2 - .15); x.stroke(); // offener Kreis
  x.beginPath(); x.moveTo(150, 94); x.lineTo(226, 128); x.stroke(); x.beginPath(); x.moveTo(226, 128); x.lineTo(186, 104); x.lineTo(196, 152); x.closePath(); x.fill(); // Pfeil tangential hinaus
  x.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 420; i++) { x.fillStyle = `rgba(0,0,0,${rand(.15, .55)})`; x.beginPath(); x.arc(rand(0, 256), rand(0, 256), rand(1, 4), 0, 7); x.fill(); }
  x.globalCompositeOperation = 'source-over'; for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(70,150,255,.5)'; x.beginPath(); x.arc(104 + rand(-80, 120), 128 + rand(-80, 80), rand(.8, 2), 0, 7); x.fill(); } // Sprühnebel
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }
function lucy3_puffTex() { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(235,238,240,.55)'); g.addColorStop(.5, 'rgba(220,224,228,.22)'); g.addColorStop(1, 'rgba(210,214,218,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); }
function lucy3_hitMat(h) { const m = h.object.material; return Array.isArray(m) ? m[h.face ? h.face.materialIndex : 0] || m[0] : m; }
function lucy3_visibleHit(o) { for (let p = o; p; p = p.parent) if (!p.visible) return false; const m = [].concat(o.material)[0]; return !!m && m.visible !== false; }
function lucy3_buildCar() {
  const C = lucy3_S.car, car = lenaCar; car.updateMatrixWorld(true); const rc = new THREE.Raycaster(), V = (a, b, c) => new THREE.Vector3(a, b, c);
  const hitsAt = (y, z) => { const o = car.localToWorld(V(4.5, y, z)), t = car.localToWorld(V(-4.5, y, z)); rc.set(o, t.sub(o).normalize()); rc.far = 9; return rc.intersectObject(car, true).filter(h => lucy3_visibleHit(h.object)); };
  // Heckscheibe suchen: von hinten waagerecht auf das Auto zielen; der erste Treffer auf Glas ist die Scheibe
  const pts = []; let nrm = null;
  for (let y = .8; y <= 1.5; y += .03) { const H = hitsAt(y, 0)[0]; if (!H) continue; const m = lucy3_hitMat(H); const glass = /glass|window/i.test(m.name || '') || (m.transparent && m.opacity < .95);
    if (glass) { pts.push(car.worldToLocal(H.point.clone())); if (!nrm && H.face) nrm = H.face.normal.clone().transformDirection(H.object.matrixWorld); } }
  C.info = { glassHits: pts.length, probe: [.9, 1.1, 1.3].map(y => hitsAt(y, 0).slice(0, 3).map(h => `${h.object.name}|${(lucy3_hitMat(h) || {}).name}|${car.worldToLocal(h.point.clone()).toArray().map(v => v.toFixed(2))}`)) };
  if (pts.length < 3) { // Ersatz (Primitiv-Auto ohne Scan): feste Lage der hinteren Scheibe
    pts.length = 0; pts.push(V(1.15, 1.0, 0), V(.72, 1.34, 0)); nrm = V(1, 1.1, 0).normalize().transformDirection(car.matrixWorld); }
  const lo = pts[0], hi = pts[pts.length - 1], mid = lo.clone().add(hi).multiplyScalar(.5), len = lo.distanceTo(hi);
  let wz = 0; for (let z = .1; z < 1; z += .05) { const H = hitsAt(mid.y, z)[0]; if (H && car.worldToLocal(H.point.clone()).x > mid.x - .25) wz = z; else break; } // halbe Breite der Scheibe
  const W = Math.max(.7, wz * 2 * .92), Hh = Math.max(.3, len * .9);
  C.info.win = { lo: lo.toArray().map(v => +v.toFixed(2)), hi: hi.toArray().map(v => +v.toFixed(2)), w: +W.toFixed(2), h: +Hh.toFixed(2) };
  const wMid = car.localToWorld(mid.clone()); if (!nrm) nrm = V(1, 0, 0).transformDirection(car.matrixWorld); if (nrm.dot(car.localToWorld(V(1, 0, 0)).sub(car.getWorldPosition(V(0, 0, 0)))) < 0) nrm.negate();
  const up = car.localToWorld(hi.clone()).sub(car.localToWorld(lo.clone())).normalize();
  const mk = (tx, w, h, off, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tx, transparent: true, depthWrite: false, roughness: .32, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, ...o }));
    const z = nrm.clone(), y = up.clone().sub(z.clone().multiplyScalar(up.dot(z))).normalize(), x = new THREE.Vector3().crossVectors(y, z); m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    m.position.copy(wMid).addScaledVector(nrm, off); m.renderOrder = 3; m.userData.noCol = true; m.castShadow = false; m.receiveShadow = false; scene.add(m); return m; };
  C.fog = mk(lucy3_fogTex(), W * 1.04, Hh * 1.12, .012, { color: 0xb4bec6, roughness: .6 });
  C.fog.visible = false; C.hand = mk(lucy3_handTex(), .2, .2, .016, { opacity: 0, color: 0xffffff }); C.hand.visible = false; C.hand.position.addScaledVector(up, Hh * .05).add(new THREE.Vector3().crossVectors(up, nrm).normalize().multiplyScalar(W * .3));
  // zwei Untersuchungsstellen: Scheibe oben (GROSSER), Scheibe unten (HASEN…)
  const hb = (dy, lab, fn) => { const p = wMid.clone().addScaledVector(up, dy).addScaledVector(nrm, .12); const b = box(W * .9, .2, .2, p.x, p.y, p.z, hidden, { cast: false }); b.quaternion.copy(C.fog.quaternion); b.userData.noCol = true; b.userData.l3 = [lab, fn]; return b; };
  C.hitTop = hb(Hh * .12, 'Heckscheibe ansehen', lucy3_lookTop); C.hitLow = hb(-Hh * .32, 'Heckscheibe unten ansehen', lucy3_lookLow);
  // Auspuff: hinten unten, Fahrerseite
  C.exh = car.localToWorld(V(2.2, .3, -.48)); C.dir = V(1, 0, 0).transformDirection(car.matrixWorld);
  const pt = lucy3_puffTex(); for (let i = 0; i < 9; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pt, transparent: true, depthWrite: false, opacity: 0, color: 0xc9cfd4, fog: false })); s.visible = false; s.renderOrder = 2; s.frustumCulled = false; s.userData.a = i / 9 * 2.6; scene.add(s); lucy3_S.smoke.push(s); }
  // Scheinwerfer (für Lucys Antwort) – vorhandene Lichter/Materialien, nichts Neues
  car.traverse(o => { if (o.isSpotLight) { o.userData.l3i = o.intensity; lucy3_S.lights.push(o); } if (o.isMesh) for (const m of [].concat(o.material)) if (m && /LightForward/i.test(m.name || '') && !lucy3_S.hlMats.includes(m)) { m.userData.l3e = m.emissiveIntensity; lucy3_S.hlMats.push(m); } });
  C.pos = car.getWorldPosition(V(0, 0, 0)); C.ok = true;
}
// Blaue Kreispfeile vom Auto über die Südstraße bis zum Funkkasten (5,4 / −6,6)
function lucy3_buildArrows() { const tx = lucy3_arrowTex(), pts = [[2.9, -31.5], [3.1, -27], [2.8, -22.5], [3.2, -18], [2.9, -13.8], [3.4, -10.2], [4.5, -8.1]];
  pts.forEach(([x, z], i) => { const n = pts[i + 1] || [5.4, -6.6], ang = Math.atan2(n[0] - x, n[1] - z); const onWalk = isWalk(x, z) && !isRoad(x, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.78, .78), new THREE.MeshStandardMaterial({ map: tx, transparent: true, depthWrite: false, roughness: .55, color: 0x9cc4ff, emissive: 0x2a6cff, emissiveMap: tx, emissiveIntensity: .12, polygonOffset: true, polygonOffsetFactor: -3 }));
    m.rotation.set(-PI / 2, 0, ang - PI / 2 + rand(-.12, .12), 'YXZ'); m.position.set(x, onWalk ? .155 : .035, z); m.visible = false; m.userData.noCol = true; scene.add(m); lucy3_S.arrows.push(m); }); }
async function lucy3_lookTop() { const S = lucy3_S; if (state.talking || !lucy3_isK3()) return; state.talking = true; S.look1 = true;
  await say([['Von innen geschrieben. Da sitzt keiner.', 3600], ['Lucy. Sie ist halb hier.', 3200, 'DU']]); state.talking = false; }
async function lucy3_lookLow() { const S = lucy3_S; if (state.talking || !lucy3_isK3()) return; state.talking = true; S.look2 = true;
  await say([['Darunter, älter, halb weggewischt: HASEN… Den Rest hat jemand mit dem Ärmel weggemacht.', 5200]]); state.talking = false;
  if (typeof gedanke === 'function') gedanke('lucy3_hasen', 'Unser Wort. Nie laut gesagt. Nur an Scheiben geschrieben.', 600, 3); else subtitle('Unser Wort. Nie laut gesagt. Nur an Scheiben geschrieben.', 4200, 'LUKE'); }
// Motor (Leerlauf) und Autoradio auf 31,10: beide Schleifen einmal anlegen, dann nur noch lauter/leiser
function lucy3_carSound(on) { const S = lucy3_S, A = Audio, C = S.car; if (!A.ctx || !C.ok) return; const t = A.ctx.currentTime;
  if (on && !S.eng) { const p = A.at(C.pos.x, .7, C.pos.z, 5); S.eng = A.play('carEngine', { loop: true, gain: 0, lp: 520, rate: .7, dest: p });
    const n = A.noise(true), bp = A.ctx.createBiquadFilter(), g = A.ctx.createGain(), pr = A.at(C.pos.x - .2, 1, C.pos.z, 2); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .8; g.gain.value = 0; n.connect(bp); bp.connect(g); g.connect(pr); S.hiss = { n, g }; }
  if (S.eng) S.eng.g.gain.setTargetAtTime(on ? .55 : 0, t, .6); if (S.hiss) S.hiss.g.gain.setTargetAtTime(on ? .09 : 0, t, .6); }

WORLD_MODS.push(['Lucy (Kap. 3)', async () => {
  // Justin tritt erst nach dem Intro (Glocke, Kuh) aus dem Licht – Sperre VOR gedanken' Umhüllung, damit dessen Gedanke erst mit Justin kommt
  { const ja = justinArrives; justinArrives = function (...a) { if (lucy3_S.opening) return; return ja.apply(this, a); }; }
  try { await document.fonts.load('500 190px Caveat'); await document.fonts.load('500 104px Caveat'); } catch (e) {}
  try { lucy3_buildCar(); } catch (e) { console.warn('Lucy3: Auto', e); }
  try { lucy3_buildArrows(); } catch (e) { console.warn('Lucy3: Pfeile', e); }
  // Kasten vor Nr. 7: Zettel in Hildes Druckschrift „ZULETZT.“ (leuchtet nach dem dritten Fehlschlag im Lampenlicht auf) · ab Kap. 4 Absperrband an allen vier Kästen
  try { const B7 = switchBoxes.find(b => b.n === 7); if (B7) { const c = document.createElement('canvas'); c.width = 256; c.height = 160; const x = c.getContext('2d'); x.fillStyle = '#e8e0c8'; x.fillRect(6, 8, 244, 146);
      x.fillStyle = 'rgba(120,100,70,.25)'; for (let i = 0; i < 300; i++) x.fillRect(Math.random() * 256, Math.random() * 160, 2, 1); x.fillStyle = '#2a2622'; x.font = 'bold 52px "Special Elite", Courier New'; x.textAlign = 'center'; x.fillText('ZULETZT.', 128, 100);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.2, .125), new THREE.MeshStandardMaterial({ map: tex(c, true), roughness: .95, emissive: 0xfff2d0, emissiveMap: tex(c, true), emissiveIntensity: 0, polygonOffset: true, polygonOffsetFactor: -3 }));
      m.position.set(B7.m.position.x + .08, .56, -5.388); m.rotation.z = -.06; m.userData.noCol = true; scene.add(m); lucy3_S.zuletzt = m; }
    const bc = document.createElement('canvas'); bc.width = 512; bc.height = 64; const bx = bc.getContext('2d'); for (let i = 0; i < 16; i++) { bx.fillStyle = i % 2 ? '#f1efe6' : '#c8261e'; bx.beginPath(); bx.moveTo(i * 32, 0); bx.lineTo(i * 32 + 32, 0); bx.lineTo(i * 32 + 16, 64); bx.lineTo(i * 32 - 16, 64); bx.fill(); }
    bx.fillStyle = '#111'; bx.font = 'bold 26px Arial'; bx.textAlign = 'center'; bx.fillText('GASLECK · BETRETEN VERBOTEN', 256, 42);
    const bm = new THREE.MeshStandardMaterial({ map: tex(bc, true), roughness: .6, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 }); lucy3_S.band = [];
    for (const B of switchBoxes) for (const [dz, ry] of [[.16, 0], [-.16, PI]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.6, .075), bm); m.position.set(B.m.position.x, .62, -5.55 + dz); m.rotation.set(0, ry, .5); m.visible = false; m.userData.noCol = true; scene.add(m); lucy3_S.band.push(m); } } catch (e) { console.warn('Lucy3: Zettel/Band', e); }
  // Nachhall-Gestalten der Unterschriften beim Laden besetzen (nie während des Spiels laden)
  if (typeof figuren_embody === 'function') for (const [n, E] of Object.entries(LUCY3_SIGN)) { const g = new THREE.Group(); g.visible = false; g.userData.noCol = true; scene.add(g);
    try { await figuren_embody(g, E.who, { ghost: true, clip: E.clip }); lucy3_S.signs[n] = g; } catch (e) { console.warn('Lucy3: Nachbild ' + E.who, e); } }
  window.__lucy3 = { S: lucy3_S, radio: () => radioPuzzle(), press: n => pressSwitch(switchBoxes.find(b => b.n === n)), opening: () => chapter3Opening(), jHint: () => jHint(), wrong: () => wrongSwitch(),
    car: () => lenaCar, radioBox: () => radioBox, boxes: () => switchBoxes, lookTop: () => lucy3_lookTop(), lookLow: () => lucy3_lookLow(), isK3: lucy3_isK3, sign: n => lucy3_sign(switchBoxes.find(b => b.n === n)) }; // Testzugriff
}]);
WORLD_TICK.push((dt, t) => {
  const S = lucy3_S, C = S.car;
  if (S.boxed && ui.overlay !== 'puzzle') { S.boxed = false; lucy3_unbox(); lucy3_radioOff(); } // auch wenn das Fenster anders geschlossen wurde
  { const ab4 = typeof kap === 'function' && kap() >= 4; if (S.band && S.band.length && S.band[0].visible !== ab4) for (const m of S.band) m.visible = ab4; }
  if (S.zuletzt) { let k = 0; if (S.zuletztLeuchtet && flashOn && ch3.on && !ch3.lampsOff) { const z = S.zuletzt.position, dx = z.x - camera.position.x, dy = z.y - camera.position.y, dz = z.z - camera.position.z, d = Math.hypot(dx, dy, dz) || 1; if (d < 14 && (fwd.x * dx + fwd.y * dy + fwd.z * dz) / d > .9) k = .8; }
    S.zuletzt.material.emissiveIntensity += (k - S.zuletzt.material.emissiveIntensity) * Math.min(1, dt * 4); }
  if (S.nebelZiel && ch3.on && ch3.part === 'town' && !ch3.lampsOff && scene.fog) scene.fog.density += (S.nebelZiel - scene.fog.density) * Math.min(1, dt * .3); // die Straße wird enger
  if (!C.ok) return; const k3 = lucy3_isK3();
  if (k3 !== S.k3) { S.k3 = k3; for (const a of S.arrows) a.visible = k3; C.fog.visible = k3; C.hand.visible = k3 && S.handOn; if (!k3) for (const s of S.smoke) s.visible = false;
    if (k3 && !S.carIa) { S.carIa = true; interact(C.hitTop, 'Heckscheibe ansehen', lucy3_lookTop); interact(C.hitLow, 'Heckscheibe unten ansehen', lucy3_lookLow); }
    if (!k3 && S.carIa) { S.carIa = false; uninteract(C.hitTop); uninteract(C.hitLow); }
    if (!k3) { lucy3_carSound(false); S.engOn = false; } }
  if (!k3) return;
  const P = player.pos, dx = P.x - C.pos.x, dz = P.z - C.pos.z, dC = Math.sqrt(dx * dx + dz * dz);
  if (!S.engOn && Audio.ctx && (S.eng || dC < 32)) { lucy3_carSound(true); S.engOn = !!S.eng; }
  // Abgas im Leerlauf: Wölkchen steigen aus dem Auspuff, treiben nach hinten und vergehen (nur in Sichtweite)
  const near = dC < 45;
  for (const s of S.smoke) { if (!near) { s.visible = false; continue; } s.userData.a += dt; if (s.userData.a > 2.6) s.userData.a -= 2.6; const a = s.userData.a, u = a / 2.6;
    s.position.set(C.exh.x + C.dir.x * (.1 + a * .55) + Math.sin(a * 2 + s.id) * .05, C.exh.y + a * a * .06, C.exh.z + C.dir.z * (.1 + a * .55)); s.scale.setScalar(.22 + u * 1.1); s.material.opacity = .55 * Math.sin(Math.min(1, u * 1.2) * PI) * (1 - u * .4); s.visible = true; }
  // Handabdruck von innen: erscheint einmal, wenn man die Heckscheibe aus der Nähe ansieht
  if (!S.handOn && dC < 5.5 && flashOn) { const hx = C.fog.position.x - camera.position.x, hy = C.fog.position.y - camera.position.y, hz = C.fog.position.z - camera.position.z, hl = Math.hypot(hx, hy, hz) || 1;
    if ((fwd.x * hx + fwd.y * hy + fwd.z * hz) / hl > .93) { S.handOn = true; C.hand.visible = true; Audio.play('glass1', { gain: .18, rate: .55, x: C.fog.position.x, y: C.fog.position.y, z: C.fog.position.z, ref: 2 }); } }
  if (S.handOn && S.handK < 1) { S.handK = Math.min(1, S.handK + dt * .7); C.hand.material.opacity = S.handK * .85; }
  // Kreispfeile: rückstrahlende Farbe – leuchten auf, wenn die Taschenlampe sie trifft
  const cx = camera.position.x, cz = camera.position.z;
  for (const a of S.arrows) { const ax = a.position.x - cx, ay = a.position.y - camera.position.y, az = a.position.z - cz, d = Math.hypot(ax, ay, az) || 1;
    const hit = flashOn && d < 16 ? Math.max(0, ((fwd.x * ax + fwd.y * ay + fwd.z * az) / d - .9) / .1) : 0; const tgt = .12 + hit * .9 * (1 - d / 20);
    a.material.emissiveIntensity += (tgt - a.material.emissiveIntensity) * Math.min(1, dt * 6); }
});
