// =====================================================================  KAPITEL 5 (Modul „kapitel5“, Fassung 3 · AP-21): „Iss auf, Bruder“ (Hauptweg, UK 1–14)
// Donnerstag, 5. November 2026, 18:10 bis 23:40. Nur vorhandene Umgebungen: Veranda und Fenster von Nr. 3, Nr. 7, Nr. 1 innen, Kreuzung,
// Westweg, Hof/Stall, Schrebergärten, Kirchweg, Kirchberg (Gedenkfeld, offenes Grab), Nordzaun-Lücke. Texte wortgleich aus story_final.md (Fassung 3, Kapitel 5).
// Fassung 3: AG-15 (lwo_szene), Gisela + Hänschen (katzen_kater5, Tragen mit den Detective-Händen), Schleife mit Heidis Karten/A-19, Kinosequenz „Runde drei“
// (setCamOverride), Kichern aus allen Laternen (02 H4), A-17 (Lucy schwebt), AG-17 am Kirchweg, V-09/V-10, Friedhof mit Grete/Voss/AG-16 und A-18 (Blitz),
// Einlösungen der Kap.-3-Geschenke (Riemen bei Gisela, Riegel auf Hildes Küchentisch, Schnalle im Fundamentstein), B-K5-01 … 07 + H1 über beobachter_zettel.
// Aufbau: alles (Figuren, Requisiten, Lichter mit Intensität 0, Decals, Flammen-Sprites) wird BEIM LADEN angelegt und versteckt;
// im Spiel werden nur Sichtbarkeit (ohne Lichter), Positionen und Intensitäten geändert. Kein Laden, keine Lichter, keine Allokationen im Takt.
// Zustandsmaschine: k5.beat (K5_BEATS). Speicherpunkte SP5-1 … SP5-7 über todCheckpoint (tod.js); Todesart „tisch“ über TOD_ANIM/TOD_LINES von außen.
// Fremde Module werden nicht geändert: Objekte werden gesucht und gesteuert, Interaktionen umhüllt (innen_ort, albers, ausbau_nord, ausbau_ost_west, base).
const K5_BEATS = ['aus', 'intro', 'veranda', 'fenster', 'kamera', 'foto1', 'licht', 'tuer', 'tisch', 'schleife', 'foto2', 'spieluhr', 'heimweg', 'lucy', 'anruf', 'brot', 'stall', 'augenauf', 'tappen', 'grab', 'zaun', 'ende'];
const k5 = { stallTok: 0, on: false, beat: 'aus', bt: 0, sp: '', runde: 0, f: {}, pend: null, tok: 0, sitzt: false, pust: false, atem: 0, verpasst: 0, gz: 0, laden: false };
const K5 = { ready: false, g: {}, o: {}, L: {}, hit: {}, dec: {}, eyes: {}, path: null, v: null };
const k5_i = b => K5_BEATS.indexOf(b);
const k5_ab = b => k5_i(k5.beat) >= k5_i(b);
const k5_vor = b => k5_i(k5.beat) < k5_i(b);
const K5_Y = .43; // Fußboden der Häuser
const K5_POS = { veranda: [-27.2, 0, -10.55, PI], nr7: [23.6, K5_Y, -14.6, -PI / 2], tuer: [-47, 0, -9.4, 0], kinder: [-53.2, K5_Y, -19.4, PI], kreuz: [1.8, 0, 3.2, -2.4], stall: [-135.6, 0, -30.1, PI / 2], tor: [-52.5, 0, 64.6, PI] };
// Sprecher (Fassung 3): die Frau am Tisch heißt bis zum Stimmwechsel „LUCY?“ (Kinotabelle „Runde drei“: wechselt bei „Bruder“ zu LUNA)
const K5_W = { V: 'VEGAS', L: 'LUCY', LU: 'LUKE', H: 'LUCY?', K: 'LUNA', E: 'ECHTER LUKE', M: 'MAMA', A: 'ANRUF', G: 'GISELA', N11: 'NACHSORGE 11', N12: 'NACHSORGE 12' };
// Geräusch-Untertitel (A-25): standardmäßig aus, nur im Barrierefrei-Modus (settings.geraeusche, AP-26) als Geräuschangabe
function k5_geraeusch(t, ms = 3000) { try { if (typeof settings !== 'undefined' && settings.geraeusche) subtitle('[' + t + ']', ms); } catch (e) {} }
function k5_lwo() { return typeof lwo_stufe === 'function' ? lwo_stufe() : 'mittel'; }
function k5_antwort() { return typeof ch3 !== 'undefined' ? ch3.answer || ch3.choice || null : null; }
function k5_zettel(id, o) { if (typeof beobachter_zettel === 'function') { try { return beobachter_zettel(id, o); } catch (e) { console.warn('Kapitel 5: Zettel ' + id, e); } } return false; }
function k5_kater(modus, o) { if (typeof katzen_kater5 === 'function') { try { return katzen_kater5(modus, o || {}); } catch (e) { console.warn('Kapitel 5: Kater', e); } } return null; }
function k5_gesehenLore(k) { return story.lore.some(l => l.key === k); }
const _k5v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], _k5q = new THREE.Quaternion(), _k5q2 = new THREE.Quaternion();

// ---------------------------------------------------------------- kleine Werkzeuge
function k5_task(t) { story.main = 99; if (typeof setC3 === 'function') setC3(t); else $('objText').textContent = t; }
function k5_denk(t, ms) { subtitle('<i>' + t + '</i>', ms || Math.max(4200, readMs(t)), 'LUKE'); }
async function k5_sag(lines) { for (const l of lines) { if (!k5.on) return; await say([l]); } }
function k5_uhr(h, m, schlag) { if (typeof leben_uhr === 'function') { try { leben_uhr(h, m, schlag); } catch (e) { console.warn('Kapitel 5: Uhr', e); } } }
function k5_hat(k) { return story.items.includes(k); }
function k5_item(k, name, desc, icon) { try { modItem(k, name, desc, icon); } catch (e) {} if (!k5_hat(k)) { try { addItem(k); } catch (e) { story.items.push(k); } } }
function k5_weg(k) { story.items = story.items.filter(x => x !== k); }
function k5_lore(key, title, html) { if (!story.lore.some(l => l.key === key)) story.lore.push({ key, title, html }); }
function k5_blick(x, y, z) { const d = _k5v[0].set(x - camera.position.x, y - camera.position.y, z - camera.position.z); const l = d.length() || 1; return (d.x * fwd.x + d.y * fwd.y + d.z * fwd.z) / l; }
function k5_dist(x, z) { return Math.hypot(player.pos.x - x, player.pos.z - z); }
function k5_platz(p) { player.pos.set(p[0], p[1], p[2]); player.yaw = p[3]; player.pitch = 0; vel.set(0, 0, 0); camY = p[1] + 1.65; }
function k5_fig(key) { return K5.g[key] || null; }
function k5_show(key, on) { const g = K5.g[key] || K5.o[key]; if (g) g.visible = !!on; return g; }
function k5_clip(g, k, fixed = true) { const P = g && g.userData.person; if (!P) return; P.fixed = fixed; if (typeof figuren_play === 'function') figuren_play(P, k); }
function k5_face(g, x, z) { g.rotation.y = Math.atan2(x - g.position.x, z - g.position.z); }
function k5_in1() { const P = player.pos; return P.x > -56 && P.x < -44 && P.z > -22 && P.z < -12.1 && P.y > .3; } // in Nr. 1
function k5_kueche() { const P = player.pos; return P.x > -55.9 && P.x < -50.05 && P.z > -17 && P.z < -12.2; }
// Augen zu: augenzu.js (W2-P5), sonst eigene Schwarzblende auf Q (nie ohne Wirkung)
function k5_zu() { if (typeof augenzu_zu === 'function' && augenzu_zu()) return true; return !!(k5.qFrei && keys.KeyQ && typeof augenzu_frei !== 'function'); }
function k5_qFrei(on, hinweis) { k5.qFrei = on; if (typeof augenzu_frei === 'function') { if (on) augenzu_frei({ wirkt: true, hinweis: hinweis || '' }); else augenzu_sperre(); } else if (!on) K5.v.el.zu.classList.remove('on'); }

// ---------------------------------------------------------------- Klang (synthetisch, positional; nur bei Ereignissen erzeugt)
const K5_MEL = [659, 587, 523, 494, 523, 587, 659, 659, 587, 523, 494, 440, 494, 523, 494, 440, 392, 440, 494, 440]; // Lucys Spieluhr (wie Audio.musicBox)
function k5_box(x, y, z, o = {}) { // eine Runde der Spieluhr; tempo < 1 = langsamer, det = verstimmt, leier = Leiern, v = Lautstärke. Rückgabe: Dauer in s
  const A = Audio; if (!A.ctx) return 12; const d = A.at(x, y, z, o.ref || 1.6), tempo = o.tempo || 1, det = o.det || 0, lei = o.leier || 0, v = o.v ?? .06, n = o.n || K5_MEL.length;
  let t0 = .05; for (let i = 0; i < n; i++) { const f = K5_MEL[i] * (1 - i * .0025) * (1 + (Math.random() - .5) * det) * (1 + Math.sin(i * 1.7) * lei);
    if (A.buf.kb_spieluhr_E6 && A.buf.kb_spieluhr_A6) { const hi = f * 2 > 1500; A.play(hi ? 'kb_spieluhr_A6' : 'kb_spieluhr_E6', { gain: v * 2, rate: f * 2 / (hi ? 1760 : 1318.5), delay: t0, dest: d }); } // echte Zinke (Modul klang), sonst Sinus
    else [1, 2.01, 3.02].forEach((m, j) => { const os = A.osc('sine', f * m, t0, 1.8); A.env(os, [v, v * .36, v * .14][j], .004, 1.5, t0, d); }); t0 += (.42 + i * .025) / tempo * (1 + (Math.random() - .5) * lei * 4); }
  return t0 + 1.2; }
function k5_summen(x, y, z, v = .03) { // Lucys Lied, gesummt (eine Oktave tiefer, weich, mit Vibrato)
  const A = Audio; if (!A.ctx) return 12; const c = A.ctx, d = A.at(x, y, z, 2); let t = c.currentTime + .1;
  for (let i = 0; i < 12; i++) { const f = K5_MEL[i] / 2, len = .42 + i * .025, o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter(); o.type = 'triangle'; o2.type = 'sine';
    o.frequency.value = f; o2.frequency.value = f * 2.002; lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .08); g.gain.setValueAtTime(v * .85, t + len * .8); g.gain.linearRampToValueAtTime(0, t + len + .05); o.start(t); o2.start(t); o.stop(t + len + .1); o2.stop(t + len + .1); t += len; }
  return t - c.currentTime + .3; }
function k5_atem(x, y, z, v = .12) { // ein kleiner, kalter Atemzug
  const A = Audio; if (!A.ctx) return; const c = A.ctx, d = A.at(x, y, z, .6), t = c.currentTime;
  for (const [t0, dur, f0, f1, g0] of [[0, .9, 700, 1500, v], [1.05, 1.2, 1300, 600, v * .8]]) { const n = A.noise(false), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, t + t0); bp.frequency.linearRampToValueAtTime(f1, t + t0 + dur); n.connect(bp); bp.connect(g); g.connect(d);
    g.gain.setValueAtTime(0, t + t0); g.gain.linearRampToValueAtTime(g0, t + t0 + dur * .45); g.gain.linearRampToValueAtTime(0, t + t0 + dur); n.stop(t + t0 + dur + .1); } }
function k5_klirr(x, y, z) { const A = Audio; if (!A.ctx) return; const d = A.at(x, y, z, 1.4); for (let i = 0; i < 2; i++) { const o = A.osc('sine', rand(2600, 4200), i * rand(.05, .12), .5); A.env(o, .03, .002, .3, i * .08, d); } }
function k5_radio(x, y, z) { // Wunschkonzert, gedämpft: ein alter Walzer durch einen kleinen Lautsprecher
  const A = Audio; if (!A.ctx) return 16; const c = A.ctx, d = A.at(x, y, z, 1.5), bp = c.createBiquadFilter(), g = c.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = .7; bp.connect(g); g.connect(d); g.gain.value = .045;
  const mel = [523, 659, 784, 659, 587, 698, 880, 698, 523, 659, 784, 1046, 988, 880, 784, 698], bass = [131, 175, 131, 196]; let t = c.currentTime + .05;
  mel.forEach((f, i) => { const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = f; const e = c.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(.5, t + .03); e.gain.exponentialRampToValueAtTime(.01, t + .9); o.connect(e); e.connect(bp); o.start(t); o.stop(t + 1);
    if (i % 3 === 0) { const b = c.createOscillator(); b.type = 'sine'; b.frequency.value = bass[(i / 3 | 0) % 4]; const eb = c.createGain(); eb.gain.setValueAtTime(0, t); eb.gain.linearRampToValueAtTime(.7, t + .02); eb.gain.exponentialRampToValueAtTime(.01, t + 1.2); b.connect(eb); eb.connect(bp); b.start(t); b.stop(t + 1.3); }
    t += .5; });
  const n = A.noise(false), hp = c.createBiquadFilter(), ng = c.createGain(); hp.type = 'highpass'; hp.frequency.value = 3000; ng.gain.value = .08; n.connect(hp); hp.connect(ng); ng.connect(bp); n.stop(c.currentTime + 8.3);
  return 8.4; }
function k5_tapp(x, z, v = .5) { // kleine nackte Füße auf nassem Boden
  Audio.play(Audio.pick('stepWet1', 'stepWet2', 'stepWet3'), { gain: .22 * v, rate: rand(1.55, 1.8), x, y: .05, z, ref: 2.2, hp: 500 }) || Audio.play(Audio.pick('stepG1', 'stepG2'), { gain: .15 * v, rate: 1.7, x, y: .05, z, ref: 2.2 }); }
function k5_stroh(x, z) { const A = Audio; if (!A.ctx) return; const d = A.at(x, .3, z, 1.2); for (let i = 0; i < 3; i++) { const n = A.noise(false), bp = A.ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = rand(2500, 5000); bp.Q.value = 1.5; n.connect(bp); A.env(bp, .05, .01, rand(.08, .2), i * rand(.08, .16), d); n.stop(A.ctx.currentTime + 1); } }
function k5_kauen(x, z) { const A = Audio; if (!A.ctx) return; const d = A.at(x, .6, z, .8); for (let i = 0; i < 6; i++) { const n = A.noise(false), lp = A.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = rand(500, 900); n.connect(lp); A.env(lp, .06, .01, .07, i * .32 + rand(0, .05), d); n.stop(A.ctx.currentTime + 2.5); } }
function k5_schrei(v = .35) { if (Audio.scareSound) { const w = Audio.world ? Audio.world.gain.value : 1; Audio.scareSound('screech'); } }

// ---------------------------------------------------------------- Texturen (Decals, Papier) – per Canvas, einmal beim Laden
function k5_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function k5_decal(canvas, w, h, o = {}) { const m = new THREE.MeshStandardMaterial({ map: tex(canvas, true), transparent: true, depthWrite: false, roughness: o.rough ?? .95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, opacity: o.op ?? 1, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
  if (o.emissive) { m.emissive = new THREE.Color(o.emissive); m.emissiveMap = m.map; m.emissiveIntensity = o.ei ?? .3; }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.renderOrder = 2; p.receiveShadow = true; p.userData.noCol = true; p.visible = false; scene.add(p); return p; }
function k5_tFuss(links) { return k5_cv(96, 192, (c, w, h) => { c.clearRect(0, 0, w, h); c.save(); if (links) { c.translate(w, 0); c.scale(-1, 1); } c.fillStyle = 'rgba(28,30,26,.55)'; c.filter = 'blur(1.4px)';
  c.beginPath(); c.ellipse(46, 118, 20, 44, .08, 0, 7); c.fill(); c.beginPath(); c.ellipse(52, 60, 22, 22, 0, 0, 7); c.fill();
  [[30, 30, 8], [44, 22, 7], [57, 22, 6.5], [68, 28, 6], [77, 38, 5]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
  c.filter = 'none'; c.strokeStyle = 'rgba(70,96,40,.9)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { const x = rand(28, 70), y = rand(40, 150); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + rand(-8, 8), y - 8, x + rand(-10, 10), y - rand(12, 22)); c.stroke(); } c.restore(); }); }
function k5_tHasen() { return k5_cv(512, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.save(); c.translate(w / 2, h / 2); c.scale(2, 1); const g = c.createRadialGradient(0, 0, 10, 0, 0, 124); g.addColorStop(0, 'rgba(222,226,228,.3)'); g.addColorStop(.65, 'rgba(210,214,216,.16)'); g.addColorStop(1, 'rgba(200,200,200,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 124, 0, 7); c.fill(); c.restore();
  c.globalCompositeOperation = 'destination-out'; c.font = '56px "Comic Sans MS", Caveat, cursive'; c.textAlign = 'center'; c.lineWidth = 7; c.strokeStyle = 'rgba(0,0,0,.85)'; c.save(); c.translate(w / 2, h / 2 + 30); c.rotate(-.05); c.strokeText('HASENBROT', 0, 0); c.restore();
  c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(190,200,205,.25)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = 80 + i * 62 + rand(-10, 10); c.beginPath(); c.moveTo(x, 150 + rand(0, 20)); c.lineTo(x + rand(-3, 3), 220 + rand(0, 30)); c.stroke(); } }); }
function k5_tPfeil() { return k5_cv(256, 256, (c, w, h) => { c.clearRect(0, 0, w, h); const g = c.createRadialGradient(128, 128, 10, 128, 128, 126); g.addColorStop(0, 'rgba(220,226,230,.3)'); g.addColorStop(1, 'rgba(220,226,230,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.translate(w, 0); c.scale(-1, 1); c.strokeStyle = 'rgba(120,160,215,.8)'; c.lineWidth = 11; c.lineCap = 'round'; c.beginPath(); c.arc(128, 128, 62, -.4, PI * 1.55); c.stroke(); // von innen gemalt: von außen spiegelverkehrt
  const a = PI * 1.55, ex = 128 + Math.cos(a) * 62, ey = 128 + Math.sin(a) * 62; c.beginPath(); c.moveTo(ex - 22, ey - 10); c.lineTo(ex + 4, ey + 2); c.lineTo(ex - 10, ey + 26); c.stroke(); }); }
function k5_tZahn() { return k5_cv(64, 64, (c) => { c.clearRect(0, 0, 64, 64); c.fillStyle = '#e8e2d0'; c.strokeStyle = 'rgba(120,100,80,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(20, 18); c.quadraticCurveTo(32, 8, 44, 18); c.lineTo(42, 34); c.quadraticCurveTo(40, 50, 36, 52); c.lineTo(33, 38); c.lineTo(30, 38); c.lineTo(27, 52); c.quadraticCurveTo(23, 48, 22, 34); c.closePath(); c.fill(); c.stroke(); }); }
function k5_tFeder() { return k5_cv(64, 256, (c) => { c.clearRect(0, 0, 64, 256); c.strokeStyle = '#161412'; c.lineWidth = 2; c.beginPath(); c.moveTo(32, 250); c.quadraticCurveTo(30, 120, 34, 8); c.stroke();
  for (let y = 20; y < 220; y += 3) { const k = Math.sin((y - 10) / 230 * PI); c.strokeStyle = `rgba(${14 + rand(0, 14)},${14 + rand(0, 12)},${18 + rand(0, 16)},.9)`; c.lineWidth = 1.3; c.beginPath(); c.moveTo(32, y); c.lineTo(32 - 26 * k + rand(-2, 2), y + 14); c.moveTo(33, y); c.lineTo(33 + 24 * k + rand(-2, 2), y + 13); c.stroke(); } }); }
function k5_tHase() { return k5_cv(256, 256, (c) => { c.clearRect(0, 0, 256, 256); c.strokeStyle = 'rgba(190,120,140,.75)'; c.fillStyle = 'rgba(230,180,190,.5)'; c.lineWidth = 4;
  c.beginPath(); c.ellipse(128, 150, 34, 30, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(112, 96, 9, 30, -.2, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(144, 96, 9, 30, .2, 0, 7); c.fill(); c.stroke();
  c.fillStyle = 'rgba(60,40,40,.8)'; c.beginPath(); c.arc(117, 144, 3.5, 0, 7); c.arc(139, 144, 3.5, 0, 7); c.fill(); c.strokeStyle = 'rgba(200,160,110,.6)'; c.lineWidth = 3; c.beginPath(); c.arc(128, 128, 104, 0, 7); c.stroke(); }); }
function k5_tFilm() { return k5_cv(128, 96, (c, w, h) => { c.fillStyle = '#1b1b1d'; c.fillRect(0, 0, w, h); c.fillStyle = '#d8d0bc'; c.fillRect(8, 8, w - 16, 30); c.fillStyle = '#b3261a'; c.fillRect(8, 40, w - 16, 6); c.fillStyle = '#1b1b1d'; c.font = 'bold 15px Arial'; c.fillText('INSTANT FILM', 14, 28); c.fillStyle = '#9a927c'; c.font = '10px Arial'; c.fillText('10 EXP · 1994', 14, 64); }); }
function k5_tKreide(kind) { return k5_cv(1024, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.lineCap = 'round';
  if (kind === 'striche') { c.strokeStyle = 'rgba(232,230,220,.72)'; for (let r = 0; r < 9; r++) for (let g = 0; g < 17; g++) { const x0 = 18 + g * 59 + rand(-3, 3), y0 = 20 + r * 55 + rand(-3, 3); if (r === 8 && g > 9) continue;
      c.lineWidth = rand(2.2, 3.4); for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x0 + k * 9, y0); c.lineTo(x0 + k * 9 + rand(-2, 2), y0 + 38); c.stroke(); } c.beginPath(); c.moveTo(x0 - 5, y0 + 30); c.lineTo(x0 + 34, y0 + 6); c.stroke(); } }
  else if (kind === 'augen') { c.font = '120px Caveat, "Comic Sans MS", cursive'; c.textAlign = 'center'; c.fillStyle = 'rgba(40,30,22,.8)'; c.strokeStyle = 'rgba(210,190,160,.35)'; c.lineWidth = 3; c.save(); c.translate(w / 2, h / 2 + 40); c.rotate(-.04); c.fillText('AUGEN ZU', 0, 0); c.strokeText('AUGEN ZU', 0, 0); c.restore(); }
  else { c.strokeStyle = 'rgba(236,234,226,.85)'; c.lineWidth = 7; const man = (x, eye) => { c.beginPath(); c.arc(x, 150, 40, 0, 7); c.stroke(); c.beginPath(); c.moveTo(x, 190); c.lineTo(x, 330); c.moveTo(x, 330); c.lineTo(x - 36, 430); c.moveTo(x, 330); c.lineTo(x + 36, 430); c.moveTo(x - 60, 240); c.lineTo(x + 60, 240); c.stroke();
      c.fillStyle = eye; c.beginPath(); c.arc(x - 14, 142, 8, 0, 7); c.arc(x + 14, 142, 8, 0, 7); c.fill(); };
    man(360, '#3a78d8'); man(640, '#6a4020'); c.beginPath(); c.moveTo(420, 240); c.lineTo(580, 240); c.stroke(); c.font = '84px Caveat, "Comic Sans MS", cursive'; c.textAlign = 'center'; c.fillStyle = 'rgba(236,234,226,.9)'; c.fillText('DU + ICH', w / 2, 500); } }); }
function k5_tBrief() { return k5_cv(128, 80, (c, w, h) => { c.fillStyle = '#e4dccb'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(120,100,80,.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(w / 2, h * .55); c.lineTo(w, 0); c.stroke(); c.fillStyle = '#b04030'; c.fillRect(w - 26, 8, 16, 18); }); }
function k5_tFlamme(kalt) { return k5_cv(64, 128, (c) => { c.clearRect(0, 0, 64, 128); const g = c.createRadialGradient(32, 84, 2, 32, 70, 40); if (kalt) { g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.3, 'rgba(225,238,255,.9)'); g.addColorStop(.7, 'rgba(160,190,255,.25)'); }
  else { g.addColorStop(0, 'rgba(255,248,224,1)'); g.addColorStop(.3, 'rgba(255,196,90,.9)'); g.addColorStop(.7, 'rgba(255,120,30,.25)'); } g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(32, 6); c.quadraticCurveTo(54, 70, 32, 118); c.quadraticCurveTo(10, 70, 32, 6); c.fill(); }); }
function k5_tSchein() { return k5_cv(128, 128, (c) => { const g = c.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.25, 'rgba(230,240,255,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); }); }
function k5_tErde() { return k5_cv(256, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.filter = 'blur(6px)'; c.fillStyle = 'rgba(30,22,14,.8)'; c.beginPath(); c.ellipse(128, 70, 90, 34, 0, 0, 7); c.fill(); c.filter = 'none';
  c.fillStyle = 'rgba(15,10,6,.5)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(rand(50, 206), rand(46, 96), rand(1, 4), 0, 7); c.fill(); } }); }
function k5_sprite(canvas, color, sx, sy, fog = true) { const m = new THREE.SpriteMaterial({ map: tex(canvas, true), color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog }); const s = new THREE.Sprite(m); s.scale.set(sx, sy, 1); s.visible = false; s.userData.noCol = true; scene.add(s); return s; }

// ---------------------------------------------------------------- Aussehen: Auswahl-Leiste, Sitz-Hinweis, eigene Schwarzblende (falls augenzu.js fehlt)
{
  const css = document.createElement('style');
  css.textContent = `#k5Wahl { position: absolute; left: 6%; bottom: 24%; display: none; flex-direction: column; gap: 7px; min-width: 340px; max-width: 64vw; z-index: 6; }
  #k5Wahl.on { display: flex; } #k5Wahl div { font: 18px/1.35 "Cormorant Garamond", Georgia, serif; color: #e9dfc8; text-shadow: 0 0 3px #000, 0 0 12px #000; padding: 5px 14px; background: linear-gradient(90deg, rgba(8,7,6,.62), rgba(8,7,6,.12)); border-left: 1px solid rgba(201,163,106,.55); cursor: pointer; pointer-events: auto; }
  #k5Wahl div:hover { color: #fff4dc; border-left-color: #c9a36a; } #k5Wahl b { display: inline-block; width: 22px; color: #c9a36a; font: 700 14px Georgia; }
  #k5Tip { position: absolute; left: 50%; bottom: 30%; transform: translateX(-50%); font: 600 14px "Cormorant Garamond", Georgia, serif; letter-spacing: .28em; color: #e9dfc8; text-shadow: 0 0 3px #000, 0 0 12px #000; opacity: 0; transition: opacity .6s; white-space: nowrap; }
  #k5Tip.on { opacity: 1; } #k5Tip kbd { font: 700 13px Georgia; border: 1px solid rgba(201,163,106,.7); padding: 2px 8px; margin: 0 6px; color: #f3e7cc; border-radius: 3px; background: rgba(8,7,6,.6); }
  #k5Zu { position: fixed; inset: 0; pointer-events: none; background: #000; opacity: 0; transition: opacity .3s; } #k5Zu.on { opacity: 1; }`;
  document.head.appendChild(css);
  const hud = document.getElementById('hud');
  const w = document.createElement('div'); w.id = 'k5Wahl'; hud.appendChild(w);
  const t = document.createElement('div'); t.id = 'k5Tip'; hud.appendChild(t);
  const z = document.createElement('div'); z.id = 'k5Zu'; document.body.insertBefore(z, hud);
  K5.v = { el: { wahl: w, tip: t, zu: z } };
}
function k5_tip(html, ms = 0) { const t = K5.v.el.tip; t.innerHTML = html; t.classList.toggle('on', !!html); clearTimeout(K5.v.tipTo); if (html && ms) K5.v.tipTo = setTimeout(() => t.classList.remove('on'), ms); }
// Auswahl ohne Mauszeiger: Tasten 1 … n (oder Klick). abbruch() → true bricht ab (−2). Rückgabe: Index, −1 bei Zeitablauf
function k5_wahl(opts, { zeit = 0, abbruch = null } = {}) {
  const el = K5.v.el.wahl; el.innerHTML = opts.map((o, i) => `<div data-i="${i}"><b>${i + 1}</b>${trX(o)}</div>`).join(''); el.classList.add('on');
  return new Promise(res => { let done = false; const t0 = performance.now();
    const fin = v => { if (done) return; done = true; el.classList.remove('on'); el.innerHTML = ''; removeEventListener('keydown', key, true); clearInterval(iv); K5.v.wahlFin = null; res(v); };
    const key = e => { const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (!m) return; const i = +m[2] - 1; if (i < opts.length) { e.preventDefault(); e.stopImmediatePropagation(); fin(i); } };
    el.onclick = e => { const d = e.target.closest('[data-i]'); if (d) fin(+d.dataset.i); };
    addEventListener('keydown', key, true); K5.v.wahlFin = fin;
    const iv = setInterval(() => { if (!k5.on) fin(-2); else if (abbruch && abbruch()) fin(-2); else if (zeit && performance.now() - t0 > zeit && !ui.paused) fin(-1); }, 100); });
}

// ---------------------------------------------------------------- Aufbau beim Laden
WORLD_MODS.push(['Kapitel 5', async () => {
  const T = THREE, S = K5;
  const fig = async (key, id, x, y, z, ry, opt = {}) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.name = 'k5_' + key; scene.add(g);
    try { await figuren_embody(g, id, opt); } catch (e) { console.warn('Kapitel 5: Figur ' + id, e); } g.visible = false; S.g[key] = g; return g; };
  const eyesOf = g => { const P = g.userData.person, L = []; if (!P) return L; P.obj.traverse(o => { if (!o.isMesh) return; const ms = [].concat(o.material);
    const nm = ms.map(m => { if (m && /Std_Eye_[LR]|Std_Cornea_[LR]/.test(m.name || '')) { const c = m.clone(); c.emissive = new T.Color(0xe8eef4); c.emissiveIntensity = 0; L.push(c); return c; } return m; });
    o.material = Array.isArray(o.material) ? nm : nm[0]; }); return L; };
  const noShadow = g => g.traverse(o => { if (o.isMesh) o.castShadow = false; });
  // --- Figuren (einmal geklont, versteckt; figuren.js bewegt sie, sobald sie sichtbar sind)
  if (typeof figuren_embody === 'function') {
    await Promise.all([
      fig('lucyWin', 'lucy_erw', -25, .45, -12.9, 0, { clip: 'window' }), fig('heim', 'lucy_erw', -53.6, K5_Y, -15.6, PI / 2), fig('heimSitz', 'lucy_erw', 0, K5_Y, 0, 0, { sit: K5_Y + .47 }), fig('lucyK', 'lucy_erw', 0, 0, 0, 0),
      fig('graue', 'graue', 0, -30, 0, 0), fig('luke', 'luke_echt', 0, -30, 0, 0), fig('mama', 'mama', -46.4, K5_Y, -15.9, -PI / 2, { ghost: true, clip: 'idle' }),
      // Friedhof (UK 13): drei Behaltene, Pfarrer Voss (Erwachsenen-Rig wie weiss.js, grau), Grete (Mädchen, ganz hinten, rückt nie näher)
      ...['gezaehlt_j', 'gezaehlt_m', 'gezaehlt_j', 'amt1', 'gezaehlt_m'].map((id, i) => fig('gz' + i, id, 0, -30, 0, 0)),
      fig('gisela', 'gisela', -48.6, 0, -8.4, PI)]);
    for (let i = 0; i < 5; i++) if (S.g['gz' + i]) noShadow(S.g['gz' + i]); // Leistung am Friedhof: die Behaltenen werfen keinen Schatten (Nebel, Kerzenlicht)
    { const V = S.g.gz3 && S.g.gz3.userData.person; if (V && typeof weiss_grau === 'function') { try { weiss_grau(V.obj, .35); } catch (e) {} } } // Voss: grau wie in Raum 2
    for (const k of ['lucyWin', 'heim', 'heimSitz', 'lucyK']) if (S.g[k]) S.eyes[k] = eyesOf(S.g[k]);
    if (S.g.lucyWin) { noShadow(S.g.lucyWin); S.g.lucyWin.traverse(o => { if (o.isMesh) o.renderOrder = 21; }); }
  }
  // --- Fenster von Nr. 3 (links neben der Tür, x −25): Innenraum ist nur Illusion → „Tiefen-Radierer“ über der Scheibe (keine Farbe, schreibt Fernwert),
  //     danach Lucy mit höherer Zeichenreihenfolge: sie erscheint genau im Fensterausschnitt, sonst verdeckt die Hauswand sie
  { let wx = -25, wy = 1.75, wz = -12.44;
    try { let best = 9; for (const W of (typeof fassaden_S !== 'undefined' ? fassaden_S.windows : [])) { const p = _k5v[1].set(W.x, W.y, W.z); W.g.localToWorld(p); const d = Math.hypot(p.x + 25, p.z + 12.45) + Math.abs(p.y - 1.75); if (d < best) { best = d; wx = p.x; wy = p.y; wz = p.z; } } } catch (e) {}
    S.win3 = { x: wx, y: wy, z: wz };
    const er = new T.Mesh(new T.PlaneGeometry(.86, 1.5), new T.ShaderMaterial({ vertexShader: 'void main(){ vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); p.z = p.w * .99999; gl_Position = p; }', fragmentShader: 'void main(){ gl_FragColor = vec4(0.); }', colorWrite: false, depthFunc: T.AlwaysDepth }));
    er.position.set(wx, wy, wz - .03); er.renderOrder = 20; er.visible = false; er.userData.noCol = true; er.frustumCulled = false; scene.add(er); S.o.radierer = er;
    if (S.g.lucyWin) S.g.lucyWin.position.set(wx + .05, .45, wz - .3);
    S.o.pfeil = k5_decal(k5_tPfeil(), .42, .42, { op: 0 }); S.o.pfeil.position.set(wx + .22, wy - .24, wz + .012);
    S.L.win3 = new VLight(0xffc890, 0, 4, 2); S.L.win3.position.set(wx + .2, wy + .35, wz + .45); scene.add(S.L.win3); }
  // --- Nr. 1: Tisch, Gedecke, Stühle, Lampen, Decals
  const G1 = scene.getObjectByName('io_nr1') || scene;
  const bb = new T.Box3(), within = (o, x0, x1, z0, z1) => { bb.setFromObject(o); const cx = (bb.min.x + bb.max.x) / 2, cz = (bb.min.z + bb.max.z) / 2; return cx > x0 && cx < x1 && cz > z0 && cz < z1; };
  let tisch = null; if (G1 !== scene) { const rc = new T.Raycaster(new T.Vector3(-53, 3, -14.8), new T.Vector3(0, -1, 0), 0, 3); const h = rc.intersectObject(G1, true).find(q => q.object.isMesh && q.object.visible && q.point.y > K5_Y + .4 && q.point.y < K5_Y + 1.1);
    if (h) { let o = h.object; while (o.parent && o.parent !== G1) o = o.parent; bb.setFromObject(o); if (bb.max.x - bb.min.x < 2 && bb.max.z - bb.min.z < 2.5) { tisch = bb.clone(); tisch.max.y = h.point.y; } } }
  if (!tisch) { tisch = new T.Box3(new T.Vector3(-53.3, K5_Y, -15.5), new T.Vector3(-52.7, K5_Y + .77, -14.1)); console.warn('Kapitel 5: Tisch nicht gefunden'); }
  S.tisch = tisch; const tx = (tisch.min.x + tisch.max.x) / 2, tz = (tisch.min.z + tisch.max.z) / 2, ty = tisch.max.y + .004;
  const alongX = tisch.max.x - tisch.min.x >= tisch.max.z - tisch.min.z; S.alongX = alongX;
  S.plaetze = alongX ? { papa: [tisch.max.x - .17, tz], mama: [tisch.min.x + .17, tz], luke: [tx - .12, tisch.min.z + .15], kind: [tx + .14, tisch.max.z - .14] }
    : { papa: [tx, tisch.max.z - .17], mama: [tx, tisch.min.z + .17], luke: [tisch.min.x + .15, tz], kind: [tisch.max.x - .15, tz] };
  S.sitz = alongX ? { x: tx - .12, z: tisch.min.z - .42, yaw: PI, hx: tx - .12, hz: tisch.min.z - .5 } : { x: tisch.min.x - .42, z: tz, yaw: -PI / 2, hx: tisch.min.x - .55, hz: tz };
  const put = (o, x, y, z, ry = 0) => { const g = msGround(o); g.position.set(x, y, z); g.rotation.y = ry; g.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); g.userData.noCol = true; g.visible = false; scene.add(g); return g; };
  const part = (src, re) => { let r = null; src.traverse(m => { if (!r && m.isMesh && re.test(m.name + ' ' + (m.parent ? m.parent.name : ''))) r = m; }); return r; };
  const teil = (src, re, size, axis = 'max') => { src.updateMatrixWorld(true); const ms = []; src.traverse(m => { if (m.isMesh && (!re || re.test(m.name + ' ' + (m.parent ? m.parent.name : '') + ' ' + (m.material && m.material.name)))) ms.push(m); });
    if (!ms.length) return null; const g = new T.Group(); const b = new T.Box3(); for (const m of ms) { const geo = m.geometry.clone().applyMatrix4(m.matrixWorld); geo.computeBoundingBox(); b.union(geo.boundingBox); const mm = new T.Mesh(geo, m.material); g.add(mm); }
    const sz = b.getSize(new T.Vector3()), cur = axis === 'max' ? Math.max(sz.x, sz.y, sz.z) : sz[axis], k = size / Math.max(1e-6, cur);
    for (const mm of g.children) { mm.geometry.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); mm.geometry.scale(k, k, k); mm.geometry.computeBoundingBox(); mm.geometry.computeBoundingSphere(); } return g; };
  S.ged = { papa: [], mama: [], luke: [], kind: [] }; S.gras = [];
  try {
    const [teller, becher, besteck, brot] = await Promise.all(['w_teller', 'w_becher', 'w_besteck', 'w_brot'].map(k => msModel(k, 'model.glb')));
    const plate = () => teil(teller, /plate_dinner/i, .26) || teil(teller, null, .26), kid = () => teil(teller, /plate_salad/i, .2) || teil(teller, null, .2);
    for (const k of ['papa', 'mama', 'luke']) { const [x, z] = S.plaetze[k]; if (k !== 'papa') S.ged[k].push(put(plate(), x, ty, z)); }
    { const [x, z] = S.plaetze.kind; const p = put(kid(), x, ty, z); p.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color = new T.Color(0xe8e2d8); } }); S.ged.kind.push(p); const d = k5_decal(k5_tHase(), .15, .15); d.rotation.x = -PI / 2; bb.setFromObject(p); d.position.set(x, bb.max.y - .004, z); S.ged.kind.push(d); }
    { const [x, z] = S.plaetze.papa; S.ged.papa.push(put(teil(becher, null, .085, 'y'), x - .03, ty, z + (S.alongX ? .16 : 0) - (S.alongX ? 0 : .03)));
      const l = teil(besteck, /Object_5|spoon|loeffel/i, .19) || teil(besteck, null, .19); l.children.forEach(m => { m.geometry.rotateX(-PI / 2); m.geometry.computeBoundingBox(); }); S.ged.papa.push(put(l, x - .15, ty, z, .1));
      S.brot = put(teil(brot, /Bread_1/i, .15) || teil(brot, null, .15), x - .01, ty, z - .06, .6); S.ged.papa.push(S.brot);
      S.brotHalb = []; S.brot.traverse(m => { if (m.isMesh && m.visible) S.brotHalb.push(m); }); }
    { const [x, z] = S.plaetze.mama; const f = k5_decal(k5_tFeder(), .045, .18); f.rotation.set(-PI / 2, 0, .9); f.position.set(x + .15, ty + .003, z + .02); S.ged.mama.push(f); }
    { const [x, z] = S.plaetze.luke; const d = k5_decal(k5_tZahn(), .03, .03); d.rotation.x = -PI / 2; d.position.set(x + .04, ty + .026, z + .03); S.zahn = d; S.ged.luke.push(d); }
    // Gras vom Tau auf den Tellern (Scan-Gras, klein): Lukes Platz sofort, in Runde 3 auf allen
    { const gt = k5_cv(256, 256, c => { c.clearRect(0, 0, 256, 256); c.lineCap = 'round'; for (let i = 0; i < 90; i++) { const a = rand(0, 6.28), r = rand(0, 70), x = 128 + Math.cos(a) * r, y = 128 + Math.sin(a) * r, b = rand(-1.2, 1.2), L = rand(18, 46);
        c.strokeStyle = `rgba(${90 + rand(0, 50)},${150 + rand(0, 60)},${50 + rand(0, 30)},.95)`; c.lineWidth = rand(2, 3.6); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(b) * L * .5 + rand(-6, 6), y + Math.sin(b) * L * .5, x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); }
        c.fillStyle = 'rgba(210,225,235,.5)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(rand(60, 196), rand(60, 196), rand(1, 2.4), 0, 7); c.fill(); } });
      for (const k of ['luke', 'papa', 'mama', 'kind']) { const [x, z] = S.plaetze[k]; const g = k5_decal(gt, .17, .17); g.rotation.set(-PI / 2, 0, rand(0, 6)); g.position.set(x, ty + .02, z); S.gras.push([k, g]); } }
    // Stall: sauber abgeleckter Teller auf der Palette, Brot (das Luke mitbringt)
    S.stallTeller = put(plate(), 0, -30, 0); S.stallBrot = put(teil(brot, /Bread_1/i, .15) || teil(brot, null, .15), 0, -30, 0);
    S.stallBrotTeile = []; S.stallBrot.traverse(m => { if (m.isMesh && m.visible) S.stallBrotTeile.push(m); });
  } catch (e) { console.warn('Kapitel 5: Gedecke', e); }
  // Mamas Kerze (neu, nie angezündet) auf ihrem Teller + Kerze in der Hand am Grab
  try { const src = await msFBX('candles', 'model.fbx', { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg', color: 0xd8cfbf }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', n: 'Extra_for_candles_Normal.jpg', r: 'Extra_for_candles_Roughness.jpg', m: 'Extra_for_candles_Metallic.jpg' } });
    src.updateMatrixWorld(true); const names = []; src.traverse(m => { if (m.isMesh) names.push(m); });
    const pick = names.find(m => /thin/i.test(m.name) && /new/i.test(m.name + m.material.name)) || names.find(m => /new/i.test(m.material.name || '')) || names.find(m => /thin/i.test(m.name)) || names[0];
    const mk = () => { const g = pick.geometry.clone().applyMatrix4(pick.matrixWorld); g.computeBoundingBox(); const b = g.boundingBox; g.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2); const s = .16 / Math.max(.001, b.max.y - b.min.y); g.scale(s, s, s); g.computeBoundingBox(); g.computeBoundingSphere();
      const m = new T.Mesh(g, pick.material); m.castShadow = true; m.receiveShadow = true; m.userData.noCol = true; m.visible = false; scene.add(m); return m; };
    { const [x, z] = S.plaetze.mama; const tellerH = .016; S.kerzeTisch = mk(); S.kerzeTisch.position.set(x, ty + tellerH, z); S.ged.mama.push(S.kerzeTisch); }
    S.kerzeHand = mk(); S.kerzeHand.scale.setScalar(.7);
  } catch (e) { console.warn('Kapitel 5: Kerze', e); }
  S.flHand = k5_sprite(k5_tFlamme(false), 0xffffff, .035, .07); S.flKalt = k5_sprite(k5_tFlamme(true), 0xffffff, .03, .085); S.flZeug = k5_sprite(k5_tFlamme(false), 0xffffff, .025, .05);
  S.L.hand = new VLight(0xffb060, 0, 5, 2); S.L.hand.position.set(0, -50, 0); scene.add(S.L.hand);
  // Villa Seiler, Dachfenster: kerzengerade, kalt-weiße Flamme (Miras Handschrift) – Sprite ohne Nebel, damit sie vom Kirchberg aus zu sehen ist
  S.o.villa = k5_sprite(k5_tFlamme(true), 0xffffff, .28, .62, false); S.o.villa.position.set(-125, 8.05, 66.2);
  S.o.villaSchein = k5_sprite(k5_tSchein(), 0xdfe8ff, 2.2, 2.2, false); S.o.villaSchein.position.set(-125, 8.05, 66.25); S.o.villaSchein.material.opacity = .45;
  // Lampen in Nr. 1: Küche (Stehlampe, Scan) und Wohnzimmer (vorhandene Stehlampe) – Licht mit Quelle, beim Laden auf 0
  S.lampMats = [];
  try { const fl = await msModel('floorlamp'); const g = put(fl.clone(true), -55.45, K5_Y, -12.75, .9); g.visible = true; g.userData.noCol = false;
    const ms = []; g.traverse(m => { if (m.isMesh) { bb.setFromObject(m); ms.push([m, bb.max.y]); } }); ms.sort((a, b) => b[1] - a[1]);
    if (ms[0]) { const sm = ms[0][0].material.clone(); sm.emissive = new T.Color(0xffb46b); sm.emissiveMap = sm.map; sm.emissiveIntensity = 0; ms[0][0].material = sm; S.lampMats.push(sm); }
    bb.setFromObject(g); S.L.kueche = new VLight(0xffb46b, 0, 8.5, 2); S.L.kueche.position.set(-55.1, bb.max.y - .2, -13.05); scene.add(S.L.kueche);
    addCol(-55.7, -55.2, -13.0, -12.5); } catch (e) { console.warn('Kapitel 5: Küchenlampe', e); S.L.kueche = new VLight(0xffb46b, 0, 7, 2); S.L.kueche.position.set(-53, K5_Y + 2.2, -14.6); scene.add(S.L.kueche); }
  { let wl = null; if (G1 !== scene) for (const c of G1.children) if (within(c, -49.9, -49, -13.2, -12.2)) { bb.setFromObject(c); if (bb.max.y - bb.min.y > 1.2) { wl = c; break; } }
    if (wl) { const ms = []; wl.traverse(m => { if (m.isMesh) { bb.setFromObject(m); ms.push([m, bb.max.y]); } }); ms.sort((a, b) => b[1] - a[1]); if (ms[0]) { const sm = ms[0][0].material.clone(); sm.emissive = new T.Color(0xffb46b); sm.emissiveMap = sm.map; sm.emissiveIntensity = 0; ms[0][0].material = sm; S.lampMats.push(sm); } }
    S.L.wohn = new VLight(0xffb46b, 0, 8.5, 2); S.L.wohn.position.set(-49.45, K5_Y + 1.42, -12.75); scene.add(S.L.wohn); }
  // zwei weitere Stühle (Scan) an die Kopfenden
  try { const spec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
    const plz = alongX ? [[tisch.max.x + .34, tz, -PI / 2, 'N'], [S.sitz.x, tisch.min.z - .36, 0, 'S']] : [[tx, tisch.max.z + .32, PI, 'N'], [tx, tisch.min.z - .32, 0, 'S']];
    for (const [x, z, ry, k] of plz) { const c = await msFBX('chair', 'model.fbx', spec); msFit(c, .92, 'y'); const g = put(c, x, K5_Y, z, ry); g.userData.noCol = false; S.o['stuhl' + k] = g; } } catch (e) { console.warn('Kapitel 5: Stühle', e); }
  // Laken → Möbel (Sofa, Anrichte), damit nichts schwebt (der Teddy sitzt dann auf dem Sofa)
  S.laken = msFind((m, b) => m.geometry && m.geometry.type === 'BoxGeometry' && m.geometry.parameters.widthSegments === 10 && b.min.x > -50.5 && b.max.x < -43.5 && b.min.z > -17.2 && b.max.z < -12);
  try { const so = await msFBX('sofa', 'model.fbx', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg', color: 0x9a8a7c } }); msFit(so, 2.0, 'x'); S.o.sofa = put(so, -44.72, K5_Y, -15.2, -PI / 2); S.o.sofa.userData.noCol = false;
    const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg` }); const dr = await msFBX('dresser', 'model.fbx', { 'Wood-1': W_('Wood-1'), 'Wood-2': W_('Wood-2'), 'Wood-3': W_('Wood-3'), Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } }); msFit(dr, 1.0, 'y'); S.o.anrichte = put(dr, -48.55, K5_Y, -16.6, 0); S.o.anrichte.userData.noCol = false;
    const ch = await msFBX('chair', 'model.fbx', { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } }); msFit(ch, .92, 'y'); S.o.sessel = put(ch, -49.15, K5_Y, -15.45, PI / 2 + .5); S.o.sessel.userData.noCol = false;
  } catch (e) { console.warn('Kapitel 5: Möbel', e); }
  S.teddy = null; if (G1 !== scene) for (const c of G1.children) { if (within(c, -45.1, -44.3, -14.9, -14.2)) { bb.setFromObject(c); if (bb.max.y - bb.min.y < .45 && bb.min.y > .6) { S.teddy = c; S.teddyY = c.position.y; break; } } }
  // Decals: nasse Fußspuren mit fremdem Gras (Küche → Kinderzimmer), HASENBROT an der Küchenscheibe, Gras um die Füße der Heimkehrerin
  S.spuren = []; { const pts = [[-53.5, -15.95], [-53.25, -16.35], [-53.45, -16.85], [-53.15, -17.35], [-53.4, -17.9], [-53.1, -18.45], [-53.35, -19.0], [-53.05, -19.6], [-53.3, -20.2], [-53.05, -20.8]]; const tl = k5_tFuss(true), tr = k5_tFuss(false);
    pts.forEach(([x, z], i) => { const d = k5_decal(i % 2 ? tr : tl, .11, .22, { op: .9 }); d.rotation.set(-PI / 2, 0, PI + rand(-.15, .15)); d.position.set(x, K5_Y + .003, z); S.spuren.push(d); }); }
  S.o.hasen = k5_decal(k5_tHasen(), .62, .31, { op: .95 }); S.o.hasen.rotation.y = PI; S.o.hasen.position.set(-51.2, K5_Y + 1.62, -12.29);
  S.o.fussGras = k5_decal(k5_cv(128, 128, c => { c.clearRect(0, 0, 128, 128); c.lineCap = 'round'; for (let i = 0; i < 70; i++) { const a = rand(0, 6.28), r = rand(20, 56), x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r; c.strokeStyle = `rgba(${60 + rand(0, 30)},${90 + rand(0, 40)},${35 + rand(0, 20)},.85)`; c.lineWidth = rand(1, 2.2); c.beginPath(); c.moveTo(x, y); c.lineTo(x + rand(-6, 6), y + rand(-10, 10)); c.stroke(); } }), .7, .7);
  S.o.fussGras.rotation.x = -PI / 2;
  // Familienfoto (Wohnzimmer): drei Stufen, aus der vorhandenen Textur abgeleitet – der Junge wird blasser, weiß, fehlt
  try { const map = familyPhoto.material.map, im = map && map.image; S.foto = [map];
    if (im) for (const k of [.4, .78, 1]) { const c = k5_cv(256, 256, (x) => { x.drawImage(im, 0, 0, 256, 256); const gx = 200, gy = 120; x.save(); x.filter = 'blur(3px)';
        x.fillStyle = k < 1 ? `rgba(235,232,222,${k * .85})` : 'rgba(154,138,106,1)'; x.beginPath(); x.ellipse(gx, gy, 20, 48, 0, 0, 7); x.fill(); x.beginPath(); x.arc(gx, gy - 38, 14, 0, 7); x.fill();
        if (k === 1) { x.fillStyle = 'rgba(154,138,106,.9)'; x.fillRect(gx - 22, gy - 56, 44, 130); } x.restore(); }); const t = tex(c, true); try { renderer.initTexture(t); } catch (e) {} S.foto.push(t); } } catch (e) { console.warn('Kapitel 5: Familienfoto', e); }
  // Filmpack in der Kommode (Absicherung, K5-8) und in Hildes Laube; Briefe im Briefkasten Nr. 7
  S.o.film = k5_decal(k5_tFilm(), .11, .085); S.o.film.rotation.x = -PI / 2; S.o.film.position.set(-44.62, K5_Y + .87, -18.55);
  S.briefe = []; for (let i = 0; i < 3; i++) { const b = k5_decal(k5_tBrief(), .2, .12, { ds: true }); b.position.set(28.4 + (i - 1) * .04, 1.16 + i * .012, -6.72 + i * .01); b.rotation.set(-.35 - i * .1, rand(-.2, .2), rand(-.2, .2)); S.briefe.push(b); }
  // Polaroid-Kamera auf Hildes Stuhl (Nr. 7 Wohnzimmer)
  try { S.kamY = k5_sitzY(21.3, -12.95); const cam = await msModel('w_kamera', 'model.glb'); const c = msFit(cam.clone(true), .13, 'max'); S.o.kamera = put(c, 21.3, S.kamY, -12.95, .5);
    S.o.zettel = k5_decal(k5_cv(128, 96, (x, w, h) => { x.fillStyle = '#ece6d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a2a3a'; x.font = '15px Caveat, cursive'; x.fillText('Die Kamera lügt nicht.', 6, 30); x.fillText('Menschen schon. – H.', 6, 56); }), .1, .075); S.o.zettel.rotation.set(-PI / 2, 0, .3); } catch (e) { console.warn('Kapitel 5: Kamera-Modell', e); }
  // Stall: Palette als Brett-Tisch, Kreidestriche, AUGEN ZU, später DU + ICH; Erdspur unter dem Absperrgitter
  try { const pal = await msModel('pallet_ms'); S.o.palette = put(msFit(pal.clone(true), .95, 'max'), 0, -30, 0); } catch (e) { console.warn('Kapitel 5: Palette', e); }
  S.o.striche = k5_decal(k5_tKreide('striche'), 1.8, .9); S.o.augen = k5_decal(k5_tKreide('augen'), .5, .25); S.o.duich = k5_decal(k5_tKreide('duich'), 1.0, .5); S.o.erde = k5_decal(k5_tErde(), 1.1, .55, { op: .9 }); S.o.erde.rotation.x = -PI / 2;
  // Vegas' Sturmlaterne (lantern2) für Lucy am Ende, Licht beim Laden auf 0
  try { const ln = await msFBX('lantern1', 'model.fbx', { lantern: { b: 'lantern_and_bulb_lantern_BaseColor.1001.png', n: 'lantern_and_bulb_lantern_Normal.1001.jpg', r: 'lantern_and_bulb_lantern_Roughness.1001.jpg', m: 'lantern_and_bulb_lantern_Metallic.1001.jpg' }, buln: { b: 'lantern_and_bulb_buln_BaseColor.1001.png', rough: .2, emissive: 0xffb060 } }); S.o.laterne = put(msFit(ln, .34, 'y'), 0, -30, 0);
    const lm = ln.clone(true); lm.traverse(m => { if (m.isMesh) m.material = figuren_ghostMat(m.material); }); S.o.laterneM = put(lm, 0, -30, 0); if (S.o.anrichte) S.anrichteY = new T.Box3().setFromObject(S.o.anrichte).max.y; } catch (e) { console.warn('Kapitel 5: Laterne', e); }
  S.L.laterne = new VLight(0xffb060, 0, 7, 2); S.L.laterne.position.set(0, -50, 0); scene.add(S.L.laterne);
  S.L.stall = new VLight(0xc8d4e8, 0, 5, 2); S.L.stall.position.set(0, -50, 0); scene.add(S.L.stall);
  // Klickflächen (unsichtbar; nur im passenden Takt in interactables)
  const hit = (key, w, h, d, label, fn) => { const m = box(w, h, d, 0, -40, 0, hidden, { cast: false }); m.userData.noCol = true; interact(m, label, fn); uninteract(m); S.hit[key] = m; return m; };
  hit('lucyWin', 1.2, 1.8, .6, () => 'Ans Fenster klopfen', () => k5_fensterReden());
  hit('kamera', .5, .4, .5, 'Hildes Kamera nehmen', () => k5_kameraNehmen());
  for (const k of ['papa', 'mama', 'luke', 'kind']) hit('g_' + k, .34, .3, .34, () => k5_platzLabel(k), () => k5_gedeck(k));
  hit('stuhl', .6, .9, .6, 'Hinsetzen', () => k5_setzen());
  hit('spieluhr', .35, .3, .3, 'Lucys Spieluhr nehmen', () => k5_spieluhrNehmen());
  hit('film', .5, .3, .9, 'Schublade öffnen', () => k5_filmNehmen());
  hit('lucyK', 1, 1.9, 1, () => k5_lucyLabel(), () => k5_lucyAktion());
  hit('stallTeller', .9, .5, .9, () => k5.f.brotHin ? 'Warten' : 'Das Brot auf den Teller legen', () => k5_brotHin());
  hit('grab', 1.3, .8, 2.2, 'Ins Grab steigen', () => k5_insGrab());
  hit('kleine', 1.2, 1.4, 1.2, () => k5_kleineLabel(), () => k5_kleineAktion());
  hit('gitter', 8, 2.2, 1.2, () => 'Absperrgitter', () => k5_gitter());
  S.ready = true;
  window.__k5 = { k5, K5, start: () => startChapter5(), go: b => k5_setup(b, true), setup: b => k5_setup(b), sitzen: () => k5_setzen(), essen: () => k5_essen(), aufstehen: () => k5_aufstehen(), schwelle: () => k5_schwelle(), atem: () => k5_atemStart(),
    brot: () => k5_brotHin(), kerze: () => k5_kerzeAnzuenden(), lucy: () => k5_lucyAktion(), telefon: () => k5_telefon(), spieluhr: () => k5_spieluhrNehmen(), kameraNehmen: () => k5_kameraNehmen(), gitter: () => k5_gitter(), wahl: i => K5.v.wahlFin && K5.v.wahlFin(i) }; // Testzugriff
}]);

// ---------------------------------------------------------------- Welt für Kapitel 5 (wie Kapitel 4: Kapitel 1–3 ruhen, Strom ist da)
function k5_welt() {
  $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov'); state.ending = false; state.talking = false;
  ch3.part = 'town'; ch3.lampsOff = true; ch3.chase = 'done'; ch3.met = true; ch3.ringing = false; hunt.on = false; grey.visible = false; if (typeof justin !== 'undefined' && justin && justin.g) justin.g.visible = false;
  state.zone = null; state.outage = false; state.flashFail = 0; try { canalAtmo(false); } catch (e) {} Audio.hum(false); Audio.chaseMusic(false); Audio.setArea(false, false);
  lamps.forEach(L => { L.mode = 'on'; L.dead = 0; }); porchLights.forEach(p => p.dead = false); booth.light.userData.dead = false;
  if (typeof albers_S !== 'undefined') { albers_S.hissed = true; albers_S.open = 0; }
  if (typeof tod_S !== 'undefined') Object.assign(tod_S.seen, { k1: true, k2: true, gang: true, mess: true, k3: true, c3: true });
  if (!k5_hat('feuerzeug')) { try { k5_item('feuerzeug', ITEMS.feuerzeug ? ITEMS.feuerzeug.name : 'Peters Feuerzeug', ITEMS.feuerzeug ? ITEMS.feuerzeug.desc : 'Messing, abgegriffen. „Damit du im Dunkeln nicht allein bist. – M.“', 'key'); } catch (e) {} }
  k5_huellen(); flashOn = true;
}
// Fremde Interaktionen einmal umhüllen (Datei bleibt unverändert): nur in Kapitel 5 anders
function k5_huellen() {
  if (k5.huellen) return; k5.huellen = true;
  const lab = o => { const l = o.userData.label; try { return typeof l === 'function' ? String(l()) : String(l || ''); } catch (e) { return ''; } };
  const wrap = (re, x, z, r, fn, obj) => { const m = obj || interactables.find(o => re.test(lab(o)) && Math.hypot(o.getWorldPosition(_k5v[2]).x - x, _k5v[2].z - z) < r); if (!m) { console.warn('Kapitel 5: nicht gefunden', re); return; } fn(m, m.userData.action, m.userData.label); };
  if (typeof booth !== 'undefined' && booth.phone) { const o = booth.phone.userData.action, ol = booth.phone.userData.label; booth.phone.userData.action = () => k5.on ? k5_telefon() : o && o(); booth.phone.userData.label = () => k5.on ? (k5.beat === 'anruf' ? 'Hörer abnehmen' : 'Telefon') : (typeof ol === 'function' ? ol() : ol); if (!interactables.includes(booth.phone)) interactables.push(booth.phone); }
  wrap(/Briefkasten/, 28.4, -6.9, 2.2, (m, o, ol) => { m.userData.label = () => k5.on ? (k5.f.briefe ? 'Briefkasten' : 'Briefkasten · Post') : (typeof ol === 'function' ? ol() : ol); m.userData.action = () => k5.on ? k5_briefe() : o(); }, typeof mailbox7 !== 'undefined' ? mailbox7 : null);
  wrap(/^Laube/, -107.2, 25, 2.5, (m, o, ol) => { m.userData.label = () => k5.on && !k5.f.laube ? 'Laube · Schublade' : (typeof ol === 'function' ? ol() : ol); m.userData.action = () => k5.on && !k5.f.laube ? k5_laube() : o(); });
  if (typeof albers_talk === 'function') albers_talk = (o => async (...a) => { if (!k5.on) return o(...a); if (state.talking) return;
    state.talking = true; albers_S.open = 1; try { await say([[k5_ab('lucy') && k5_vor('ende') ? '„Sie schläft. Diesmal richtig. Geh, Junge. Mach, was du machen musst.“' : '„Sie schläft. Lass sie schlafen, Junge.“', 3800, K5_W.V]]); } finally { albers_S.open = 0; state.talking = false; } })(albers_talk);
}
// Bett (Milchzahn) und Stoffhase: merken, ob Luke sie kennt (für die Gedanken am Tisch) – ab jetzt in jedem Kapitel
function k5_merker() {
  const find = (label, x, z) => interactables.find(o => o.userData.label === label && Math.hypot(o.getWorldPosition(_k5v[2]).x - x, _k5v[2].z - z) < 1.6);
  const bett = find('Bett', -47.02, -20.9); if (bett) { const o = bett.userData.action; bett.userData.action = () => { if (k5.on && k5_ab('tisch')) return toast('Das Kissen ist leer. Nur das Taschentuch liegt noch da, zusammengefaltet, als hätte es jemand ordentlich hinterlassen.', 5200); k5.f.bett = true; o(); }; }
  const hase = find('Stoffhase', -55.2, -21.35); if (hase) { const o = hase.userData.action; hase.userData.action = () => { k5.f.hase = true; o(); }; }
}

// ---------------------------------------------------------------- Zustand je Takt (Neustart am Speicherpunkt, Laden, Tests)
function k5_setup(beat, spring) {
  const S = K5, b = k5_i(beat); k5.beat = beat; k5.bt = 0; k5.tok++; k5.sitzt = false; k5.atem = 0; k5.atemAn = false; k5_tip(''); if (K5.v.wahlFin) K5.v.wahlFin(-2);
  if (k5.ownScript) { k5.ownScript = false; setScripted(null); setCamOverride(null); } if (!(typeof kino_busy === 'function' && kino_busy())) state.talking = false;
  const vis = (key, on) => { const o = S.g[key] || S.o[key]; if (o) o.visible = !!on; };
  const hits = (key, on) => { const h = S.hit[key]; if (!h) return; const i = interactables.indexOf(h); if (on && i < 0) interactables.push(h); else if (!on && i >= 0) interactables.splice(i, 1); };
  for (const k in S.hit) hits(k, false);
  // Nr. 3: Lucy am Fenster (K5-2 … K5-4)
  const amFenster = b >= k5_i('veranda') && b <= k5_i('foto1'); vis('lucyWin', amFenster && b >= k5_i('fenster')); vis('radierer', amFenster && b >= k5_i('fenster')); if (S.L.win3) S.L.win3.intensity = amFenster && b >= k5_i('fenster') ? 1.7 : 0;
  if (S.o.pfeil) { S.o.pfeil.visible = b >= k5_i('fenster') && b <= k5_i('foto1') && k5.f.pfeil; S.o.pfeil.material.opacity = 1; }
  if (amFenster && b >= k5_i('fenster')) { hits('lucyWin', true); S.hit.lucyWin.position.set(S.win3.x, S.win3.y, S.win3.z + .3); }
  // Nr. 7: Kamera
  vis('kamera', !k5_hat('polaroid_kamera') && !(typeof kamera_S !== 'undefined' && kamera_S.frei)); vis('zettel', S.o.kamera && S.o.kamera.visible);
  if (S.o.kamera && S.o.kamera.visible) { const sy = S.kamY; S.o.zettel.position.set(21.5, sy + .004, -13.12); hits('kamera', b >= k5_i('kamera')); S.hit.kamera.position.set(21.3, sy + .1, -12.95); }
  S.briefe.forEach(m => m.visible = !k5.f.briefe);
  // Nr. 1
  const licht = b >= k5_i('tuer') && b <= k5_i('spieluhr'), tischVoll = b >= k5_i('licht') && b <= k5_i('spieluhr'), drin = b >= k5_i('tuer');
  k5_lichter1(licht ? 1 : 0, true);
  for (const k of ['papa', 'mama', 'luke', 'kind']) for (const o of S.ged[k]) o.visible = tischVoll || (k === 'luke' && b > k5_i('spieluhr'));
  if (S.brot) S.brot.visible = !k5_hat('brot') && !k5.f.brotStall && b <= k5_i('stall');
  if (S.kerzeTisch) S.kerzeTisch.visible = tischVoll && !k5_hat('mamas_kerze');
  if (typeof album !== 'undefined') { if (S.albumY === undefined) S.albumY = album.position.y; album.position.y = tischVoll ? -40 : S.albumY; }
  try { const pm = PHOTOS[5] && PHOTOS[5].mesh; if (pm) { if (S.p5Y === undefined) S.p5Y = pm.position.y; pm.position.y = tischVoll ? -40 : S.p5Y; } } catch (e) {}
  for (const [k, g] of S.gras) g.visible = k === 'luke' && drin;
  if (S.zahn) S.zahn.visible = b >= k5_i('licht');
  (S.laken || []).forEach(m => { m.visible = !drin; }); for (const k of ['sofa', 'anrichte', 'sessel']) vis(k, drin);
  if (S.teddy && S.o.sofa) { S.teddy.position.y = S.teddyY; if (drin) { const tb = new THREE.Box3().setFromObject(S.teddy), y = k5_sitzY((tb.min.x + tb.max.x) / 2, (tb.min.z + tb.max.z) / 2, S.o.sofa); if (y > K5_Y + .2) S.teddy.position.y += (y - .01) - tb.min.y; } }
  for (const k of ['stuhlN', 'stuhlS']) vis(k, drin);
  S.spuren.forEach(d => d.visible = drin); vis('hasen', drin); vis('film', false);
  const heim = S.g.heim; if (heim) { heim.visible = b >= k5_i('tuer') && b <= k5_i('schleife'); heim.position.set(-54.2, K5_Y, -15.6); heim.rotation.y = PI / 2; k5_clip(heim, 'idle', false); }
  vis('fussGras', heim && heim.visible); vis('mama', false); vis('heimSitz', false);
  if (S.foto && S.foto[0]) familyPhoto.material.map = S.foto[0];
  if (b >= k5_i('licht') && b <= k5_i('spieluhr') && typeof door1 !== 'undefined') { door1.locked = false; if (!door1.open) { door1.openAngle = .45; door1.set(true); } }
  if (b >= k5_i('tisch') && b <= k5_i('schleife')) { hits('g_papa', true); hits('g_mama', true); hits('g_luke', true); hits('g_kind', true); hits('stuhl', true); k5_hitsTisch(); }
  if (b === k5_i('spieluhr') || (b > k5_i('spieluhr') && b <= k5_i('stall') && !k5_hat('brot') && !k5.f.brotStall)) { hits('g_papa', true); k5_hitsTisch(); }
  if (b === k5_i('spieluhr')) { hits('spieluhr', true); const mb = musicBox.getWorldPosition(_k5v[2]); S.hit.spieluhr.position.set(mb.x, mb.y + .05, mb.z); musicBox.visible = true; }
  if (b > k5_i('spieluhr')) musicBox.visible = false;
  // Kreuzung: Lucy
  const lk = S.g.lucyK; if (lk) { lk.visible = b >= k5_i('heimweg') && b <= k5_i('brot') && !(b === k5_i('brot') && k5.f.lucyWeg); lk.position.set(0, 0, 0); k5_face(lk, 8, 7.6); k5_clip(lk, 'idle', true); k5_augen('lucyK', b <= k5_i('heimweg') || (b === k5_i('lucy') && !k5.f.ganz) ? 1 : 0); }
  if (b >= k5_i('heimweg') && b <= k5_i('brot')) { hits('lucyK', true); S.hit.lucyK.position.set(0, .95, 0); }
  // Stall
  k5_stallAufbau(); if (b >= k5_i('brot') && b <= k5_i('augenauf')) hits('stallTeller', true);
  vis('duich', b >= k5_i('augenauf'));
  if (S.stallBrot) { S.stallBrot.visible = k5.f.brotStall && b <= k5_i('stall'); S.stallBrotTeile.forEach((m, i) => m.visible = !(k5.f.brotHalb && i === 0)); }
  // Friedhof
  const grab = b === k5_i('grab'); k5_grabAufbau(grab); if (grab) { hits('grab', true); hits('kleine', true); }
  vis('villa', b === k5_i('zaun') && k5.f.villa); vis('villaSchein', b === k5_i('zaun') && k5.f.villa);
  if (S.o.erde) { S.o.erde.visible = true; S.o.erde.position.set(30.2, .012, 98.05); }
  if (b >= k5_i('zaun')) { hits('gitter', true); S.hit.gitter.position.set(30, 1.1, 98.2); }
  if (S.g.luke && !grab && b !== k5_i('augenauf') && b !== k5_i('zaun')) S.g.luke.visible = false;
  if (b !== k5_i('grab')) for (let i = 0; i < 5; i++) if (S.g['gz' + i]) S.g['gz' + i].visible = false;
  if (S.g.graue && b !== k5_i('grab')) S.g.graue.visible = false;
  // Lichter am Westweg: in Kapitel 5 ab dem Stall aus
  if (b >= k5_i('stall')) k5_westLampen(true);
  // Kamera
  if (b >= k5_i('foto1') && typeof kamera_frei === 'function' && typeof kamera_S !== 'undefined' && !kamera_S.frei) kamera_frei(k5.film ?? 3);
  if (typeof kamera_ziel === 'function') kamera_ziel(k5_kameraZiel);
  k5.pust = false; k5.qFrei = false; if (typeof augenzu_sperre === 'function') augenzu_sperre();
  if (spring) k5_takt(beat);
}
function k5_hitsTisch() { const S = K5, ty = S.tisch.max.y; for (const k of ['papa', 'mama', 'luke', 'kind']) { const h = S.hit['g_' + k]; if (h) h.position.set(S.plaetze[k][0], ty + .1, S.plaetze[k][1]); }
  if (S.hit.stuhl) S.hit.stuhl.position.set(S.sitz.hx, K5_Y + .45, S.sitz.hz); }
function k5_sitzY(x, z, obj) { const rc = k5_sitzY.rc || (k5_sitzY.rc = new THREE.Raycaster()); rc.camera = camera; rc.set(_k5v[3].set(x, 3, z), _k5v[1].set(0, -1, 0)); rc.far = 3; const h = rc.intersectObject(obj || scene, true).find(q => q.object.isMesh && !q.object.isInstancedMesh && q.object.visible && !q.object.userData.noCol && q.object.material !== hidden && !(q.object.material && q.object.material.transparent)); return h ? h.point.y : K5_Y + .47; }
function k5_lichter1(k, sofort) { const S = K5; S.lichtZiel = k; if (sofort) S.lichtK = k; }
function k5_augen(key, k) { for (const m of K5.eyes[key] || []) m.emissiveIntensity = 1.4 * k; K5['augenK_' + key] = k; }
function k5_westLampen(aus) { for (const L of lamps) if (L.wx < -75 && L.wx > -130 && Math.abs(L.wz) < 8) L.mode = aus ? 'off' : 'on'; }

// ---------------------------------------------------------------- Kapitelstart
const C5_INTRO = '<p class="on" style="font-family:Georgia;font-size:12px;letter-spacing:.4em;color:#c9a36a;margin-bottom:22px">KAPITEL 5 · ISS AUF, BRUDER</p><p class="on">Derselbe Tag. Abend.</p><p class="on">Du hast geschlafen. Zum ersten Mal seit August nicht um 03:13 aufgewacht.</p><p class="on">Lucy liegt bei Vegas auf dem Sofa. Sie friert. Sie hat den ganzen Tag nichts gegessen.</p><p class="on">Vorhin hat sie gesagt: „Heute Abend koch ich. Wie früher.“</p><p class="on" style="font-family:Georgia;font-size:11px;letter-spacing:.35em;color:#8b7f68;margin-top:30px">KLICKEN ZUM WEITERSPIELEN</p>';
async function startChapter5() {
  $('subPanel').classList.remove('show'); menu.attract = false; state.started = true; document.body.classList.remove('menu'); $('start').classList.remove('show');
  const laden = typeof KAP !== 'undefined' && KAP.laden, pend = laden ? k5.pend : null; k5.pend = null;
  chapter3Begin(); ch3.met = true;
  k5.on = true; if (!pend) { k5.f = { bett: k5.f.bett, hase: k5.f.hase }; k5.film = 3; k5.sp = ''; }
  if (typeof kapStart === 'function') kapStart(5); else { if (typeof KAP !== 'undefined') KAP.n = 5; setChapter(5); saveFlag('ch5'); }
  k5_welt(); k5_merker();
  $('fade').style.background = '#000'; $('fade').style.opacity = 1; await wait(300);
  $('intro').innerHTML = C5_INTRO; $('introSeq').classList.add('show'); $('fade').style.opacity = 0;
  if (pend) { // Weiterspielen: am letzten Speicherpunkt dieses Kapitels (resumeAfterIntro setzt danach nur die gespeicherte Aufgabe)
    const sp = pend.sp || 'k5_veranda'; k5_wieder(sp, true);
    $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; lockPointer(); };
    CH_RESUME.push(k5_nachLaden); return; }
  k5_uhr(18, 10, false); k5_setup('intro'); k5_platz(K5_POS.veranda);
  $('introSeq').onclick = () => { $('introSeq').classList.remove('show'); $('introSeq').onclick = null; lockPointer(); k5_setup('veranda', true); };
}
function k5_nachLaden(d, at) { const i = CH_RESUME.indexOf(k5_nachLaden); if (i >= 0) CH_RESUME.splice(i, 1); if (!k5.on) return; k5_wieder(k5.sp || 'k5_veranda', true); saveGame(5); }
// Speicherpunkte: [Takt, Ort, Aufgabe, Uhr]
const K5_SP = {
  k5_veranda: ['veranda', 'veranda', 'SP5-1 · Die Veranda', null, [18, 10]],
  k5_kamera: ['foto1', 'nr7', 'SP5-2 · Hildes Kamera', 'Mach ein Foto von Lucy.', [18, 20]],
  k5_tuer: ['tuer', 'tuer', 'SP5-3 · Vor Nr. 1', 'Nr. 1. Wer deckt da den Tisch?', [18, 40]],
  k5_spieluhr: ['heimweg', 'kinder', 'SP5-4 · Lucys Spieluhr', 'Bring Lucy die Spieluhr.', [19, 5]],
  k5_lucy: ['anruf', 'kreuz', 'SP5-5 · Die Kreuzung', null, [19, 25]],
  k5_stall: ['stall', 'stall', 'SP5-6 · Der Stall', 'Warten.', [20, 0]],
  k5_friedhof: ['grab', 'tor', 'SP5-7 · Das Friedhofstor', 'Der Kirchberg. Das Gedenkfeld.', [23, 0]] };
function k5_sp(id) { const E = K5_SP[id]; k5.sp = id; const p = K5_POS[E[1]];
  if (typeof todCheckpoint === 'function') todCheckpoint(id, E[2].replace(/^SP5-\d · /, ''), { x: p[0], y: p[1], z: p[2], yaw: p[3], respawn: async () => k5_wieder(id, false) }); else saveGame(5); }
function k5_wieder(id, laden) { const E = K5_SP[id] || K5_SP.k5_veranda; k5.on = true; k5_welt(); if (E[4]) k5_uhr(E[4][0], E[4][1], false);
  if (id === 'k5_spieluhr' && !k5_hat('lucys_spieluhr')) k5_item('lucys_spieluhr', 'Lucys Spieluhr', 'Holz, der Deckel verzogen. Die Melodie leiert – aber sie ist Lucys.', 'paper');
  if (id === 'k5_stall' && !k5_hat('brot') && !k5.f.brotStall) k5_item('brot', 'Ein Kanten Brot', 'Von Papas Platz. Nicht angeschnitten.', 'paper');
  if (typeof $ === 'function') $('fade').style.background = '#000';
  k5_setup(E[0]); k5_platz(K5_POS[E[1]]); k5.sp = id;
  if (E[3]) k5_task(E[3]); k5_takt(E[0], true); }

// ---------------------------------------------------------------- Takte (Abläufe)
async function k5_takt(beat, wieder) {
  const tok = k5.tok, ok = () => k5.on && tok === k5.tok, S = K5;
  if (beat === 'veranda') { // K5-1 · 18:10 · Ruhe
    if (!wieder) k5_sp('k5_veranda'); k5_task('Lucy schläft bei Vegas. Warte auf der Veranda.');
    let t = 0; state.talking = true; k5.ownScript = true; setScripted(dt => { t += dt; return t < 4.2; });
    setCamOverride((cam) => { const k = Math.min(1, Math.max(0, (t - 3) / 1.2)); cam.position.y = player.pos.y + 1.22 + .43 * (k * k * (3 - 2 * k)); if (t > 4.3) { setCamOverride(null); k5.ownScript = false; } });
    for (let i = 0; i < 4; i++) setTimeout(() => Audio.drip(-26.2, 2.6, -10.9), 600 + i * rand(700, 1300));
    await wait(4400); if (!ok()) return; state.talking = false;
    await wait(1200); if (!ok()) return; Audio.chains(-28, 1.2, -12.2); Audio.creak(.25); if (typeof albers_S !== 'undefined') albers_S.open = 1; await wait(900);
    state.talking = true; await k5_sag([['„Sie schläft. Endlich.“', 2800, K5_W.V], ['„Friert seit heute Mittag. Bei zweiundzwanzig Grad, Junge.“', 4200, K5_W.V], ['„Und sie hat mich gefragt, wo Flocke ist. Flocke ist seit Jahren tot.“', 4600, K5_W.V]]);
    state.talking = false; if (typeof albers_S !== 'undefined') albers_S.open = 0; if (!ok()) return;
    await wait(3000); if (!ok()) return; k5_setup('fenster', true); return; }
  if (beat === 'fenster') { // K5-2 · 18:15 · Erleichterung mit Riss
    const g = S.g.lucyWin; if (g) { g.visible = true; k5_clip(g, 'window_knock'); }
    for (let i = 0; i < 3; i++) setTimeout(() => Audio.play('woodHit1', { gain: .16, rate: 2.2, x: S.win3.x, y: S.win3.y, z: S.win3.z, ref: 2 }) || Audio.knock(), i * 380);
    k5_task('Lucy. Am Fenster.'); await wait(2600); if (!ok()) return; if (g) k5_clip(g, 'window'); k5.f.pfeil = true; if (S.o.pfeil) { S.o.pfeil.visible = true; S.o.pfeil.material.opacity = 0; }
    if (k5_dist(S.win3.x, S.win3.z) < 6) k5_fensterReden(); return; }
  if (beat === 'kamera') { k5_task('Hildes Polaroid-Kamera. Nr. 7, Wohnzimmer.'); k5_uhr(18, 20); return; }
  if (beat === 'foto1') { k5_task('Mach ein Foto von Lucy.'); return; }
  if (beat === 'licht') { // K5-5 · 18:35
    k5_uhr(18, 35); await wait(4000); if (!ok()) return; k5_lichter1(1); k5.radioT = 0; k5.klirrT = 1; if (S.g.heim) S.g.heim.visible = true;
    k5_atem(S.win3.x, 1.3, S.win3.z - .5, .05);
    if (typeof albers_S !== 'undefined') albers_S.open = 1; state.talking = true;
    await k5_sag([['„Brandts Küche. Da hat seit Marion keiner mehr Licht gemacht.“', 4200, K5_W.V], ['„Lucy schläft. Und da drüben deckt sie den Tisch.“', 3800, K5_W.LU]]);
    state.talking = false; if (typeof albers_S !== 'undefined') albers_S.open = 0; if (!ok()) return; k5_task('Nr. 1. Wer deckt da den Tisch?'); return; }
  if (beat === 'tuer') { // K5-6 · 18:40
    if (!wieder) k5_sp('k5_tuer'); k5_uhr(18, 40); k5_task('Nr. 1. Wer deckt da den Tisch?'); return; }
  if (beat === 'tisch') { // K5-7 · 18:45
    k5_uhr(18, 45); const h = S.g.heim; if (h) { h.position.set(-53.6, K5_Y, -15.55); k5_face(h, player.pos.x, player.pos.z); k5_clip(h, 'look', true); }
    k5.summT = 1.5; k5.setzT = 15; k5.setzN = 0; k5.tischT = 0;
    state.talking = true; await k5_sag([['„Da bist du ja, Bruder.“', 2800, K5_W.H], ['„Setz dich. Ich hab gekocht.“', 3000, K5_W.H]]); state.talking = false; if (!ok()) return;
    if (h) k5_clip(h, 'idle', false); k5_task('Der gedeckte Tisch.'); return; }
  if (beat === 'spieluhr') { k5_task('Lucys Spieluhr. Das Kinderzimmer.'); k5.boxT = 0; return; }
  if (beat === 'heimweg') { // K5-11
    if (!wieder) { k5_sp('k5_spieluhr'); } k5_task('Bring Lucy die Spieluhr.'); k5.jagd = { an: false, t: 5, dur: 0, seenT: 0, ruf: false }; k5_lichter1(0); return; }
  if (beat === 'anruf') { k5_uhr(19, 25); k5.ringT = 0; k5_task('Die Telefonzelle klingelt.'); return; }
  if (beat === 'brot') { k5_task(k5_hat('brot') ? 'Brot. Der Stall am Hof. Guck ihn nicht an.' : 'Brot. Der Stall am Hof. Guck ihn nicht an.'); return; }
  if (beat === 'stall') { if (!wieder) k5_sp('k5_stall'); k5_uhr(20, 0, false); k5_task(k5.f.brotStall ? 'Warten.' : 'Das Brot. Auf den Teller.'); k5.stT = 0; k5.hint = 0; if (k5.f.brotStall) k5_qFrei(true, ''); return; }
  if (beat === 'augenauf') return k5_augenAuf();
  if (beat === 'tappen') { k5_uhr(20, 35); k5_task('Hinterher.'); k5.tp = { i: 0, x: -137.6, z: -30.1, t: 0, st: 0, weit: 0 }; return; }
  if (beat === 'grab') { if (!wieder) k5_sp('k5_friedhof'); k5_task('Der Kirchberg. Das Gedenkfeld.'); k5.gr = { t: 0, gesagt: false, hinw: 0, feuer: 0, zeugT: 0, gTimer: 0 }; return; }
  if (beat === 'zaun') { k5_task('Hinterher.'); return; }
}

// ---------------------------------------------------------------- K5-2 · Lucy am Fenster: Dialog mit Auswahl
async function k5_fensterReden() {
  if (k5.beat !== 'fenster' || k5.f.fensterGesagt || state.talking) return; k5.f.fensterGesagt = true; const tok = k5.tok;
  state.talking = true; uninteract(K5.hit.lucyWin);
  const O = [['„Wie geht\'s dir?“', [['„Kalt. Als hätte ich innen ein Fenster offen gelassen.“', 4200, K5_W.L]]],
    ['„Deine Augen …“', [['„Wo mir was fehlt, ist es weiß. Sie hat noch ein Stück von mir.“', 4600, K5_W.L]], true],
    ['„Du hast gesagt, du kochst heute.“', [['„Hab ich das? Ich koch nie. Das war Mama.“', 3800, K5_W.L]]],
    ['„Ich hab Onkel Peter verbrannt.“', [['„Er hat seit 1992 gewartet, dass einer die Tür aufmacht. Du hast sie aufgemacht, Großer. Nur anders.“', 5600, K5_W.L]]]];
  try {
    while (O.length && k5.on && tok === k5.tok) {
      const i = await k5_wahl([...O.map(o => o[0]), 'Nichts sagen.'], { zeit: 30000 }); if (i < 0 || i >= O.length) break;
      const [q, lines, weiss] = O.splice(i, 1)[0]; subtitle(q, 1800, K5_W.LU); await wait(1600);
      if (weiss) { k5_augen('lucyWin', .9); setTimeout(() => k5_augen('lucyWin', 0), 1400); }
      await say(lines); }
    if (!k5.on || tok !== k5.tok) return;
    await say([['„Hildes Kamera. Die lügt nicht. Hol sie mir.“', 3600, K5_W.L], ['„Ich will wissen, ob ich noch ganz da bin.“', 3200, K5_W.L], ['„Und Großer … wenn dich heute einer zum Essen ruft, der nicht ich bin: Iss nichts.“', 5200, K5_W.L]]);
  } finally { state.talking = false; }
  if (tok !== k5.tok) return; k5.beat = 'kamera'; k5_takt('kamera');
  if (K5.hit.kamera) { interactables.includes(K5.hit.kamera) || interactables.push(K5.hit.kamera); }
}
// ---------------------------------------------------------------- K5-3 · Nr. 7: Kamera, Briefe
function k5_kameraNehmen() {
  if (!k5.on || k5_vor('kamera')) return; uninteract(K5.hit.kamera); if (K5.o.kamera) K5.o.kamera.visible = false; if (K5.o.zettel) K5.o.zettel.visible = false;
  Audio.play('items1', { gain: .4 }) || Audio.paper();
  openNote('Hildes Kamera', 'Eine Sofortbildkamera, alt, das Leder an den Kanten abgewetzt. Das Zählwerk steht auf <b>3</b>.\n\nDarunter ein Zettel:\n\n<span class="hand">Die Kamera lügt nicht. Menschen schon. – H.</span>', 'k5_kamera', () => {
    if (typeof kamera_frei === 'function') kamera_frei(3); k5.film = 3; k5.beat = 'foto1'; k5_sp('k5_kamera'); k5_takt('foto1'); });
}
function k5_briefe() {
  if (k5.f.briefe) return toast('Der Briefkasten ist leer. Die Klappe hängt schief.', 2600);
  k5.f.briefe = true; K5.briefe.forEach(m => m.visible = false); Audio.paper();
  const B = [['Brief aus Hamburg · 2019', '<span class="hand">„Mama, ich ruf jeden Sonntag um sieben an. Du gehst nie ran. Ich weiß, dass du da bist. Ich hör dich atmen, bevor du auflegst. — J.“</span>', 'k5_brief1'],
    ['Brief aus Hamburg · 2023', '<span class="hand">„Ich hab jetzt eine Wohnung mit Balkon. Da steht ein Bett für dich. Seinen Namen sag ich nicht mehr. Dann legst du wenigstens nicht sofort auf. — J.“</span>', 'k5_brief2'],
    ['Brief aus Hamburg · Poststempel 02.11.2026', '<span class="hand">„Die Polizei hat angerufen, wegen Lucy Brandt. Ich komm am Samstag. Geh nachts nicht auf die Kreuzung. Bitte. — Jonas“</span>', 'k5_brief3']];
  const next = i => { if (i >= B.length) { subtitle('„Jonas. Er lebt. Er hat jeden Sonntag angerufen.“', 4200, K5_W.LU); if (typeof gedanke === 'function') gedanke('k5_jonas', 'Hilde hatte zwei Söhne. Mitgezählt hat sie nur einen.', 60000, 2); return; }
    openNote(B[i][0], 'Drei Umschläge, Poststempel Hamburg. Adressiert an Frau Hilde Wendt.\n\n' + B[i][1], B[i][2], () => setTimeout(() => next(i + 1), 250)); };
  next(0);
}
function k5_laube() { k5.f.laube = true; Audio.play('woodSqueak1', { gain: .3, x: -107.2, y: 1, z: 25, ref: 2 });
  openNote('Hildes Laube', 'In der Schublade unter dem Pflanztisch, zwischen Samentüten und einer Gartenschere: zwei Filmpacks für eine Sofortbildkamera. Ungeöffnet.\n\n<span class="hand">Für den Jungen. Falls er je lacht.</span>', 'k5_laube', () => { if (typeof kamera_film === 'function') kamera_film(2); k5.film = (k5.film || 0) + 2; questPop('INVENTAR', 'Zwei Filmpacks'); }); }
function k5_filmNehmen() { if (k5.f.film) return; k5.f.film = true; uninteract(K5.hit.film); K5.o.film.visible = false; Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .4, rate: .9, x: -44.5, y: 1, z: -18.6, ref: 2 });
  openNote('Ein Filmpack', 'In der Schublade, unter Mamas Briefpapier: ein Filmpack. Noch in Folie.\n\n<span class="hand">Mama hat Filme gehortet. Für Fotos, die sie nie gemacht hat.</span>', 'k5_filmpack', () => { if (typeof kamera_film === 'function') kamera_film(3); }); }

// ---------------------------------------------------------------- Kamera: Ziele je Takt (kamera_ziel)
function k5_kameraZiel(cam) {
  if (!k5.on) return null; const S = K5, P = player.pos;
  if (k5.beat === 'foto1' && S.g.lucyWin && S.g.lucyWin.visible && k5_dist(S.win3.x, S.win3.z) < 16 && k5_blick(S.win3.x, S.win3.y, S.win3.z) > .9) return {
    stempel: '05 · 11 · 26', fov: 24, blitz: .35, vorFoto() { const g = S.g.graue; if (!g) return; const L = S.g.lucyWin; g.position.set(L.position.x + .22, L.position.y, L.position.z - .32); g.rotation.y = .3; g.visible = true; g.traverse(o => { if (o.isMesh) { o.renderOrder = 21; o.castShadow = false; } }); k5_graueArm(true); },
    nachFoto() { const g = S.g.graue; if (g) { g.visible = false; k5_graueArm(false); g.traverse(o => { if (o.isMesh) o.renderOrder = 0; }); } }, halten: 6,
    async nachEntwickeln() { k5_lore('k5_foto1', 'Das erste Foto', 'Lucy hinter dem Glas. Auf ihrer Schulter eine kleine graue Hand, die nicht da ist, wenn man hinsieht.'); state.talking = true;
      await k5_sag([['„Ist sie noch da?“', 2600, K5_W.L], ['„… Ja.“', 2000, K5_W.LU], ['„Dann spielt sie noch mit mir.“', 3200, K5_W.L]]); state.talking = false;
      if (S.g.lucyWin) S.g.lucyWin.visible = false; if (S.o.radierer) S.o.radierer.visible = false; S.L.win3.intensity = 0; uninteract(S.hit.lucyWin); Audio.play('woodClose1', { gain: .2, x: S.win3.x, y: 1.4, z: S.win3.z, ref: 2 });
      k5_setup('licht', true); } };
  if (k5.beat === 'licht' && P.z > -11.5 && k5_dist(-51.2, -12.2) < 26 && k5_blick(-51.2, 1.9, -12.3) > .95 && !k5.f.fotoKueche) return {
    stempel: '05 · 11 · 26', vorFoto() { const h = S.g.heim, g = S.g.graue; if (h) { S.heimSicht = h.visible; h.visible = false; } if (g) { const y = k5_sitzY(-52.55, -14.0); g.position.set(-52.55, y, -14.0); k5_face(g, -53, -14.8); g.visible = true; k5_clip(g, 'look', true); } },
    nachFoto() { const h = S.g.heim, g = S.g.graue; if (h) h.visible = S.heimSicht; if (g) g.visible = false; k5.f.fotoKueche = true; },
    nachEntwickeln() { k5_lore('k5_foto_kueche', 'Das Küchenfenster', 'Keine Frau am Tisch. Ein kleines Mädchen im Sommerkleid, auf einem Stuhl, das sich streckt, um Teller hinzustellen. Grau.'); } };
  if ((k5.beat === 'tisch' || (k5.beat === 'schleife' && k5.runde < 2)) && k5_in1() && ((S.g.heim && S.g.heim.visible && k5_dist(S.g.heim.position.x, S.g.heim.position.z) < 7) || (S.g.heimSitz && S.g.heimSitz.visible))) return {
    sperre: 'weggedreht', sperrText: 'Sie hat sich weggedreht.', beimHeben() { k5_weggedreht(); } };
  if (k5.beat === 'schleife' && k5.runde >= 3 && k5.atemAn) {
    const d = K5.atemDir; const ok = fwd.x * d.x + fwd.z * d.z > .55; if (ok) return {
      stempel: '05 · 11 · 26', halten: 4, vorFoto() { const g = S.g.graue; if (!g) return; g.position.set(camera.position.x + d.x * 1.9, K5_Y, camera.position.z + d.z * 1.9); k5_face(g, camera.position.x, camera.position.z); k5_clip(g, 'idle', true); g.visible = true; },
      nachFoto() { if (S.g.graue) S.g.graue.visible = false; k5.atem = 0; k5.atemAn = false; k5.f.foto2 = true; },
      async nachEntwickeln() { await k5_heimkehrerin(); } }; }
  return null;
}
function k5_weggedreht() { const h = K5.g.heim; if (!h || !h.visible) return; k5.weg = 2.5; if (!k5.f.nichtKnipsen || performance.now() - (k5.f.nkT || 0) > 12000) { k5.f.nichtKnipsen = true; k5.f.nkT = performance.now(); subtitle('„Nicht knipsen. Beim Essen wird nicht geknipst.“', 3600, K5_W.H); } }
// graue Hand auf Lucys Schulter (nur fürs Foto): rechter Arm der Kleinen hoch
function k5_graueArm(on) { const g = K5.g.graue, P = g && g.userData.person; if (!P) return; const b = figuren_bones(P.obj); if (!b.RightArm) return;
  if (on) { P.mx.update(0); g.updateMatrixWorld(true); const ax = _k5v[1].set(0, 0, 1).applyQuaternion(g.getWorldQuaternion(_k5q)); const bend = (bn, a) => { bn.parent.getWorldQuaternion(_k5q2); bn.getWorldQuaternion(_k5q); const d = new THREE.Quaternion().setFromAxisAngle(ax, a); bn.quaternion.copy(_k5q2.invert().multiply(d).multiply(_k5q)); bn.updateMatrixWorld(true); };
    bend(b.RightArm, 1.9); if (b.RightForeArm) bend(b.RightForeArm, .5); } }

// ---------------------------------------------------------------- K5-7 · Der gedeckte Tisch
function k5_platzLabel(k) { if (k === 'papa' && k5_ab('spieluhr')) return 'Den Kanten Brot nehmen'; return { papa: 'Kopfende', mama: 'Gegenüber', luke: 'Dein Platz', kind: 'Kinderteller' }[k]; }
async function k5_gedeck(k) {
  if (!k5.on) return;
  if (k === 'papa' && k5_ab('spieluhr')) { if (K5.brot) K5.brot.visible = false; uninteract(K5.hit.g_papa); k5_item('brot', 'Ein Kanten Brot', 'Von Papas Platz. Nicht angeschnitten.', 'paper'); return; }
  if (state.talking) return; state.talking = true;
  try {
    if (k === 'papa') await say([['Ein Zinnbecher, ein Eisenlöffel, ein Kanten Brot, nicht angeschnitten. Auf dem Stuhl hat nie jemand gesessen.', 5200], ['„Papas Platz. Papa ist nur Laterne laufen.“', 3600, K5_W.H]]);
    if (k === 'mama') await say([['Ein weißer Teller. Darauf eine Kerze, nie angezündet. Daneben eine schwarze Feder.', 4800], ['„Mamas Platz. Mama kommt noch. Sie bringt das Licht mit.“', 3800, K5_W.H]]);
    if (k === 'luke') { await say([['Auf dem Teller: Gras, nass vom Tau. Und ein Milchzahn.', 3800]]); if (k5.f.bett) await say([['„Luke, 7. Der lag auf Mamas Kissen. Das ist nicht meiner.“', 4200, K5_W.LU]]); k5.f.zahnGesehen = true; }
    if (k === 'kind') { await say([['Leer und sauber.', 2400], ['„Meiner.“', 2200, K5_W.H]]); if (k5.f.hase) await say([['„Lucys Häschenteller. Den hatte sie, bis sie zwölf war.“', 3800, K5_W.LU]]); }
  } finally { state.talking = false; }
}
function k5_setzen() {
  if (!k5.on || k5.sitzt || state.talking || !(k5.beat === 'tisch' || k5.beat === 'schleife')) return;
  const S = K5, cz = S.sitz.z, sx = S.sitz.x; k5.sitzt = true; k5.sitzT = 0; const tok = k5.tok;
  player.pos.set(sx, K5_Y, cz); player.yaw = S.sitz.yaw; player.pitch = -.25; vel.set(0, 0, 0);
  k5.ownScript = true; setScripted(() => k5.sitzt); setCamOverride((cam, dt) => { if (!k5.sitzt) return; cam.position.set(sx, K5_Y + 1.12, cz); });
  if (typeof kamera_zu === 'function') kamera_zu(); for (const k of ['g_papa', 'g_mama', 'g_luke', 'g_kind', 'stuhl']) uninteract(K5.hit[k]);
  subtitle('„Iss, Bruder.“', 2600, K5_W.H);
  setTimeout(() => { if (k5.sitzt && tok === k5.tok) k5_tip('<kbd>E</kbd> essen &nbsp;·&nbsp; <kbd>LEERTASTE</kbd> aufstehen'); }, 3000);
}
function k5_aufstehen() { if (!k5.sitzt) return; k5.sitzt = false; k5.ownScript = false; for (const k of ['g_papa', 'g_mama', 'g_luke', 'g_kind', 'stuhl']) if (!interactables.includes(K5.hit[k])) interactables.push(K5.hit[k]); k5_tip(''); setScripted(null); setCamOverride(null); player.pitch = 0; camY = player.pos.y + 1.65; player.pos.x -= .25; }
function k5_essen() { if (!k5.sitzt) return; k5_tip(''); k5.sitzt = false; k5.ownScript = false; setScripted(null); setCamOverride(null); if (typeof todDie === 'function') todDie('tisch'); else { subtitle('Du hast aufgegessen. Jetzt bleibst du über Nacht.', 5000); k5_wieder('k5_tuer'); } }
addEventListener('keydown', e => { if (!k5.sitzt || e.repeat || ui.overlay) return; if (e.code === 'KeyE') { e.preventDefault(); e.stopImmediatePropagation(); if (k5.sitzT > 3) k5_essen(); } else if (e.code === 'Space') { e.preventDefault(); e.stopImmediatePropagation(); k5_aufstehen(); } }, true);
addEventListener('keydown', e => { if (!k5.on || !k5.pust || e.code !== 'KeyF' || e.repeat) return; if (!k5.f.pustF) { k5.f.pustF = true; toast('Die Lampe bleibt aus. Als hätte sie keinen Strom mehr – nie gehabt.', 3200); } Audio.beep(false); }, true);
// Todesart „tisch“ (tod.js bleibt unverändert: Tabellen von außen erweitert)
if (typeof TOD_LINES !== 'undefined') TOD_LINES.tisch = ['Du hast aufgegessen. Jetzt bleibst du über Nacht.'];
if (typeof TOD_ANIM !== 'undefined') TOD_ANIM.tisch = A => {
  const B = A.base; B.fy = K5_Y; A.maxBack = 0; A.maxSideP = A.maxSideN = 0;
  A.curve = t => { const k = tod_ease(Math.min(1, t / 2.6)), k2 = tod_ease(Math.min(1, Math.max(0, (t - 2.6) / 2))); return { h: 1.12 - .3 * k - .06 * k2, pitch: tod_lerp(-.3, -1.05, k), roll: .04 * k2, back: -.12 * k, shake: .002 }; };
  A.onFrame = t => { filmPass.uniforms.vig.value = Math.max(filmPass.uniforms.vig.value, tod_lerp(tod_S.vig0, 2.6, Math.min(1, t / 5))); };
  gtAfter(900, () => { subtitle('Gras. Kalt an den Lippen.', 2400); }); gtAfter(2300, () => { if (K5.g.heim) Audio.giggle(K5.g.heim.position.x, 1.5, K5.g.heim.position.z); });
  gtAfter(3000, () => { const ls = K5.g.heim; if (ls) k5_summen(ls.position.x, 1.5, ls.position.z, .02); }); gtAfter(3900, () => Audio.giggle(player.pos.x + .6, 1.2, player.pos.z - .4));
  gtAfter(4600, () => { $('fade').style.transition = 'opacity 1.3s'; $('fade').style.background = '#fff'; }); [1200, 2600, 4200].forEach(ms => gtAfter(ms, () => Audio.heart()));
  return 6200; };
if (typeof TOD_RESET !== 'undefined') TOD_RESET.push(() => { if (!k5.on) return; $('fade').style.background = '#000'; k5.sitzt = false; k5_tip(''); if (K5.v.wahlFin) K5.v.wahlFin(-2); });

// ---------------------------------------------------------------- K5-8 · Die Schleife
function k5_schwelle() { // Versetzen ohne Schnitt: an die Tür Wohnzimmer → Küche, Blick in die Küche (relative Drehung bleibt)
  const S = K5; player.pos.set(-49.35, K5_Y, -14.5 + (player.pos.x + 53) * .5); player.yaw += PI / 2; vel.set(0, 0, 0); camY = K5_Y + 1.65;
  if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0;
  k5.runde = Math.min(3, k5.runde + 1); const r = k5.runde, h = S.g.heim;
  if (S.foto && S.foto[r]) familyPhoto.material.map = S.foto[r];
  k5.boxT = .5; k5.rT = 0;
  const hs = S.g.heimSitz; if (hs) hs.visible = r === 1;
  if (r === 1) { if (h) h.visible = false; if (hs) { const cz = (S.tisch.min.z + S.tisch.max.z) / 2; if (S.alongX) { hs.position.set(-52.55, K5_Y, S.tisch.max.z + .5); hs.rotation.y = PI + .25; } else { hs.position.set(S.tisch.max.x + .42, K5_Y, cz); hs.rotation.y = -PI / 2; } }
    setTimeout(() => { if (k5.runde === 1 && k5.on) subtitle('„Setz dich, Bruder.“', 2800, K5_W.H); }, 2200); }
  if (r === 2) { if (h) h.visible = false; K5.o.fussGras.visible = false; k5.mamaT = 1.5; if (typeof kamera_S !== 'undefined' && kamera_S.film <= 0 && !k5.f.film) { K5.o.film.visible = true; const hf = K5.hit.film; hf.position.set(-44.55, K5_Y + .8, -18.6); if (!interactables.includes(hf)) interactables.push(hf); } }
  if (r === 3) { if (h) h.visible = false; for (const [, g] of S.gras) g.visible = true; k5.stille = 1; k5.atemT = 3.6; k5.atem = 0; if (typeof leben_hush === 'function') leben_hush(8);
    if (typeof kamera_S !== 'undefined' && kamera_S.film <= 0 && !k5.f.film) { K5.o.film.visible = true; const hf = K5.hit.film; hf.position.set(-44.55, K5_Y + .8, -18.6); if (!interactables.includes(hf)) interactables.push(hf); setTimeout(() => k5_denk('Kein Film. … Mama hat Filme gehortet. Die Kommode.'), 1500); } }
}
function k5_atemStart() { // Runde 3: ein Atem direkt hinter Luke → 6 s, um sich umzudrehen und abzudrücken
  const d = K5.atemDir || (K5.atemDir = new THREE.Vector3()); d.set(-fwd.x, 0, -fwd.z).normalize(); if (!d.lengthSq()) d.set(1, 0, 0);
  k5.atem = 6; k5.atemAn = true; k5_atem(camera.position.x + d.x * .7, camera.position.y - .05, camera.position.z + d.z * .7, .16);
  subtitle('Hinter dir. Ein Atem. Klein. Kalt.', 4200); k5_tip('<kbd>C</kbd> Kamera', 5000);
}
async function k5_atemVerpasst() {
  k5.atem = 0; k5.atemAn = false; k5.verpasst++; if (typeof kamera_zu === 'function') kamera_zu(); state.talking = true;
  Audio.scareSound('whisperBurst'); shake = .05; glitchV = .5; subtitle('Kleine, kalte Finger an deinem Hals.', 2600); await wait(2400);
  subtitle('„Iss auf, Bruder.“', 2600, K5_W.H); await wait(2600); state.talking = false; if (!k5.on || k5.beat !== 'schleife') return;
  if (k5.verpasst === 2) k5_denk('Nicht umdrehen und gucken. Umdrehen und abdrücken.', 5000);
  k5.atemT = 7; // Runde 3 beginnt neu
}
// K5-9 · Das Foto (19:00): sie steht vor ihm – Lucys Gesicht, die Stimme rutscht weg
async function k5_heimkehrerin() {
  const S = K5, h = S.g.heim; k5.beat = 'foto2'; state.talking = true; k5_uhr(19, 0);
  try {
    if (S.g.heimSitz) S.g.heimSitz.visible = false; if (h) { h.position.set(camera.position.x + fwd.x * 1.1, K5_Y, camera.position.z + fwd.z * 1.1); k5_face(h, camera.position.x, camera.position.z); h.visible = true; k5_clip(h, 'idle', true); }
    await wait(900); const mb = () => k5_box(h ? h.position.x : player.pos.x, 1.5, h ? h.position.z : player.pos.z, { v: .12, tempo: .9, det: .03 });
    mb(); await say([['„Jetzt weißt du\'s.“', 2600, K5_W.K]]); await say([['„Wir tragen beide ein geliehenes Gesicht, Bruder.“', 3600, K5_W.K]]); mb(); await say([['„Warum darfst du bleiben und ich nicht?“', 3600, K5_W.K]]);
    // Licht aus (1,5 s): Luke greift nach der Tischkante – Wachs
    k5_lichter1(0, true); flashOn = false; Audio.slam && Audio.play('woodHit2', { gain: .15, rate: .7 }); await wait(700);
    if (h) h.visible = false; const cz = (S.tisch.min.z + S.tisch.max.z) / 2; if (S.alongX) { player.pos.set(S.tisch.min.x - .5, K5_Y, (S.tisch.min.z + S.tisch.max.z) / 2); player.yaw = -PI / 2; } else { player.pos.set(S.plaetze.mama[0] - .1, K5_Y, S.tisch.min.z - .55); player.yaw = 0; } player.pitch = -.2; camY = K5_Y + 1.65;
    if (S.kerzeTisch) S.kerzeTisch.visible = false; subtitle('Du hältst sie fest, bis das Licht wiederkommt.', 3200); await wait(1600);
    k5_item('mamas_kerze', 'Mamas Kerze', 'Vom gedeckten Tisch. Nie angezündet. Das Wachs ist kalt.', 'paper'); await wait(900);
    k5_lichter1(1, true); flashOn = true; await wait(900);
    await say([['„Das war sie. Die ganze Zeit.“', 3400, K5_W.LU]]);
    k5_lore('k5_heimkehrerin', 'Luna mit Lucys Gesicht', 'Die Stimme am Telefon. Die Gestalt auf dem Gurtstuhl. Das Gesicht am Tank. Das Graukind. Die Frau am Tisch. Luna, mit Lucys Gesicht.');
  } finally { state.talking = false; }
  k5_setup('spieluhr', true);
}

// ---------------------------------------------------------------- K5-10 · Die Spieluhr
async function k5_spieluhrNehmen() {
  if (k5.beat !== 'spieluhr') return; uninteract(K5.hit.spieluhr); k5.boxT = 1e9;
  if (typeof mbLidPiv !== 'undefined') tween(mbLidPiv, { rx: 0 }, .4); Audio.play('woodSqueak2', { gain: .25, rate: 1.4, x: -53.3, y: 1.4, z: -21.7, ref: 1.5 });
  await wait(500); musicBox.visible = false; k5_item('lucys_spieluhr', 'Lucys Spieluhr', 'Holz, der Deckel verzogen. Die Melodie leiert – aber sie ist Lucys.', 'paper');
  k5_uhr(19, 5); await wait(1500); k5_schrei(); subtitle('„Das ist MEINS!“', 3200, K5_W.K); await wait(3000);
  k5.beat = 'heimweg'; k5_sp('k5_spieluhr'); k5_setup('heimweg', true);
}
// ---------------------------------------------------------------- K5-11/12 · Heimweg, Lucy, Anruf
function k5_lucyLabel() { if (k5.beat === 'heimweg' && k5_hat('lucys_spieluhr')) return 'Lucy die Spieluhr geben'; if (k5.beat === 'lucy' || k5.beat === 'anruf') return 'Lucy'; return 'Lucy'; }
async function k5_lucyAktion() {
  if (!k5.on || state.talking) return; const S = K5, L = S.g.lucyK;
  if (k5.beat === 'heimweg' && k5_hat('lucys_spieluhr')) { // K5-12 · 19:25
    k5.beat = 'lucy'; k5.jagd = null; grey.visible = false; k5_weg('lucys_spieluhr'); state.talking = true;
    try { if (L) k5_face(L, player.pos.x, player.pos.z); Audio.play('woodSqueak2', { gain: .2, rate: 1.6, x: 0, y: 1.2, z: 0, ref: 1.5 }); await wait(900);
      k5_box(0, 1.2, 0, { v: .07 }); for (let i = 0; i < 40; i++) { k5_augen('lucyK', 1 - i / 40); await wait(70); } k5.f.ganz = true;
      k5_sp('k5_lucy'); await wait(600);
      await say([['„Großer.“', 2200, K5_W.L], ['„… Da bist du.“', 2400, K5_W.L], ['„Sie hat jetzt keine Spieluhr mehr unter der Stimme. Pass auf, wem du glaubst.“', 4800, K5_W.L]]);
    } finally { state.talking = false; }
    k5.beat = 'anruf'; k5_takt('anruf'); return; }
  if (k5.beat === 'anruf') return subtitle('Lucy sieht zur Telefonzelle. „Geh ran, Großer.“', 3000);
  if (k5.beat === 'brot') return subtitle('„Geh. Ich bin bei Vegas.“', 2600, K5_W.L);
  toast('Lucy steht barfuß auf dem Asphalt. Sie sieht dich nicht.', 3000);
}
async function k5_telefon() {
  if (k5.beat !== 'anruf') return toast('Nur Rauschen. Dann nichts.', 2400);
  if (state.talking) return; k5.beat = 'anrufLaeuft'; state.talking = true; if (typeof handset === 'function') handset(true);
  try { await wait(900); await say([['Rauschen. Keine Spieluhr darunter.', 2800], ['„Du hast ihr was weggenommen. Jetzt nimmt sie dir was weg.“', 4200, K5_W.A], ['„Komm in den Stall. Bring Brot. Und guck mich nicht an.“', 4200, K5_W.A], ['Klick.', 1600]]);
    if (typeof handset === 'function') handset(false); await say([['„Keine Spieluhr. Das war … ich. Als Kind.“', 3800, K5_W.LU]]);
    const L = K5.g.lucyK; if (L) k5_face(L, player.pos.x, player.pos.z);
    await say([['„Der Junge im Stall. Hilde hat ihm jeden Abend Brot hingestellt. Seit 2009.“', 4600, K5_W.L], ['„Sie hat es mir im Oktober gezeigt. Heute hat\'s keiner gemacht.“', 4200, K5_W.L], ['„Ich geh zu Vegas. Ich hab ja wieder beide Hälften.“', 4000, K5_W.L]]);
  } finally { state.talking = false; if (typeof handset === 'function' && typeof heldHandset !== 'undefined' && heldHandset.visible) handset(false); }
  k5.beat = 'brot'; k5.f.lucyGeht = true; k5_takt('brot'); if (K5.g.lucyK) k5_clip(K5.g.lucyK, 'walk', false);
}
// ---------------------------------------------------------------- K5-13 · Der Stall
function k5_stallAufbau() { const S = K5, OW = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null, d = OW && OW.dbg;
  const R = d && d.barnRect, x0 = R ? (R.min ? R.min.x : R.x0 ?? R.minX ?? -145.29) : -145.29, z1 = R ? (R.max ? R.max.z : R.z1 ?? R.maxZ ?? -24.54) : -24.54;
  const px = x0 + 1.4, pz = z1 - 1.0; S.stallP = [px, pz];
  if (S.o.palette) { S.o.palette.visible = true; S.o.palette.position.set(px, 0, pz); }
  const top = S.o.palette ? new THREE.Box3().setFromObject(S.o.palette).max.y : .15;
  if (S.stallTeller) { S.stallTeller.visible = true; S.stallTeller.position.set(px + .1, top + .002, pz); }
  if (S.stallBrot) S.stallBrot.position.set(px + .1, top + .02, pz);
  S.o.augen.visible = true; S.o.augen.scale.setScalar(.75); S.o.augen.rotation.set(-PI / 2, 0, PI / 2); S.o.augen.position.set(px + .12, top + .004, pz + .3);
  S.o.duich.rotation.set(-PI / 2, 0, PI / 2); S.o.duich.position.set(px - .22, top + .005, pz - .08); S.o.duich.scale.setScalar(.62);
  S.o.striche.visible = true; S.o.striche.scale.set(.85, .7, 1); S.o.striche.position.set(px + .4, .52, z1 - .1); S.o.striche.rotation.set(0, PI, 0);
  if (S.hit.stallTeller) S.hit.stallTeller.position.set(px + .1, top + .15, pz);
  S.stallTuer = d && d.barnDoor ? [d.barnDoor.x, d.barnDoor.z] : [-138.2, -30.1]; }
async function k5_brotHin() {
  if (!(k5.beat === 'stall' || k5.beat === 'brot') || k5.f.brotStall) return;
  if (!k5_hat('brot')) return toast('Ein Teller, sauber abgeleckt. Du hast nichts, was du darauflegen könntest.', 3200);
  k5_weg('brot'); k5.f.brotStall = true; if (K5.stallBrot) { K5.stallBrot.visible = true; K5.stallBrotTeile.forEach(m => m.visible = true); }
  Audio.play('items2', { gain: .3 }) || Audio.paper();
  if (k5.beat !== 'stall') { k5.beat = 'stall'; k5_sp('k5_stall'); }
  k5_task('Warten.'); k5.stT = 0; k5.hint = 0; k5_qFrei(true, '');
}
// Augen zu: Stroh, kleine Schritte, Kauen, eine kalte Hand – dann das Gespräch auf schwarzem Bild
async function k5_stallSzene() {
  const tok = ++k5.stallTok, ok = () => k5.on && k5.beat === 'stall' && tok === k5.stallTok && k5_zu(), S = K5, [px, pz] = S.stallP, [dx, dz] = S.stallTuer;
  const w = async ms => { const t0 = performance.now(); while (performance.now() - t0 < ms) { await wait(100); if (!ok()) throw 'auf'; } };
  k5.f.gekaut = false;
  try {
    await w(2200); k5_stroh(dx - 1, dz); await w(900);
    for (let i = 0; i < 7; i++) { const k = i / 6; k5_tapp(dx + (px - dx) * k, dz + (pz - dz) * k, .7); await w(430); }
    k5_stroh(px, pz); await w(800); k5_kauen(px + .2, pz); k5.f.gekaut = true; await w(2600); k5_kauen(px + .2, pz); await w(1900);
    subtitle('Eine kleine, kalte Hand in deiner.', 3400); await w(3400);
    await say([['„Nicht gucken. Wenn du guckst, guckt sie mit.“', 3600, K5_W.E]]); if (!ok()) throw 'auf';
    await say([['„Du hast Lucy die Spieluhr gebracht. Das war gut.“', 3600, K5_W.E]]); if (!ok()) throw 'auf';
    const O = [['„Wer bist du?“', [['„Du weißt es doch. Du hast mich am Telefon gehört.“', 3800, K5_W.E], ['„Ich bin der, der ‚Klar‘ gesagt hat.“', 3400, K5_W.E]]],
      ['„Wie ist das passiert?“', [['Die Hand drückt fester.', 2200], ['„Der Eisenmann hatte mich an der Hand. Ganz fest.“', 3800, K5_W.E], ['„Sie hat meine Hand aus seiner genommen. Und deine reingelegt.“', 4400, K5_W.E], ['„Er hat\'s nicht gemerkt. Deine Hand war ja seine.“', 4000, K5_W.E]]],
      ['„Mama?“', [['„Sie ist gekommen. 2011. Mit einer Laterne.“', 3800, K5_W.E], ['„Sie ist geblieben, damit ich nicht allein bin.“', 3600, K5_W.E], ['„Sie sagt, den anderen hat sie auch lieb gehabt. Dich.“', 4000, K5_W.E]]]];
    if (story.lore.some(l => l.key === 'ow_kassenbuch') && story.lore.some(l => l.key === 'ow_kassette')) O.push(['„Der Kanister an der Tankstelle?“', [['„Den hab ich für Roxy geholt. Sie wollte zurück. Ich wollte heim. Wir haben getauscht.“', 5200, K5_W.E]]]);
    while (O.length) { const i = await k5_wahl([...O.map(o => o[0]), 'Nur seine Hand halten.'], { zeit: 26000, abbruch: () => !k5_zu() }); if (i === -2) throw 'auf'; if (i < 0 || i >= O.length) break;
      const [q, lines] = O.splice(i, 1)[0]; subtitle(q, 1800, K5_W.LU); await w(1600); for (const l of lines) { await say([l]); if (!ok()) throw 'auf'; } }
    await say([['„War es schön? Mein Leben?“', 3200, K5_W.E]]); if (!ok()) throw 'auf';
    const a = await k5_wahl(['„Ja.“', '„Ich weiß nicht.“'], { abbruch: () => !k5_zu() });
    if (a === -2) { k5.f.keineAntwort = true; return k5_augenAuf(true); }
    if (a === 0) { subtitle('„Ja.“', 1600, K5_W.LU); await w(1500); await say([['„Gut.“', 1800, K5_W.E]]); k5_kichern(px, pz); }
    else { subtitle('„Ich weiß nicht.“', 1800, K5_W.LU); await w(1600); await say([['„Dann mach, dass es schön wird. Einer von uns muss.“', 4200, K5_W.E]]); }
    if (!ok()) throw 'auf';
    await say([['„Sie hat dir ein Bett gemacht. Am Kirchberg. Wenn sie ruft, geh nicht hin.“', 4600, K5_W.E]]); if (!ok()) throw 'auf';
    await say([['„Ich muss jetzt. Sie guckt gleich wieder.“', 3400, K5_W.E]]);
    return k5_augenAuf(true);
  } catch (e) { if (e !== 'auf') console.warn('Kapitel 5: Stall', e); if (tok !== k5.stallTok || k5.beat !== 'stall') return;
    if (K5.v.wahlFin) K5.v.wahlFin(-2);
    if (k5.f.gekaut) { k5.f.brotHalb = true; if (K5.stallBrotTeile[0]) K5.stallBrotTeile[0].visible = false; }
    subtitle('Weg. Er kommt wieder, wenn du nicht guckst.', 3600); }
}
function k5_kichern(x, z) { const A = Audio; if (!A.ctx) return; const d = A.at(x, 1, z, 1); for (let i = 0; i < 3; i++) { const o = A.osc('sine', rand(620, 760), i * .13, .2); A.env(o, .02, .01, .1, i * .13, d); } }
// K5-14 · Augen auf (20:30)
async function k5_augenAuf(zwang) {
  const S = K5, [dx, dz] = S.stallTuer, L = S.g.luke; k5.beat = 'augenauf'; k5.stallTok++; state.talking = true; uninteract(S.hit.stallTeller);
  try {
    await say([['„Augen auf, Bruder.“', 2400, K5_W.K]]);
    if (typeof augenzu_oeffnen === 'function') augenzu_oeffnen(); k5_qFrei(false); K5.v.el.zu.classList.remove('on'); k5_uhr(20, 30);
    if (L) { L.position.set(dx + .2, 0, dz); k5_face(L, player.pos.x, player.pos.z); L.visible = true; k5_clip(L, 'nervous', true); }
    S.L.stall.position.set(dx + 1.2, 1.8, dz); S.L.stall.intensity = .5;
    await wait(1700); if (L) { k5_clip(L, 'walk', false); k5.renne = { g: L, pfad: [[dx + 6, dz + 1], [dx + 16, dz + 6]], i: 0, v: 4.2, weg: true }; }
    await say([['„Da ist er ja.“', 2400, K5_W.K]]); S.o.duich.visible = true; S.L.stall.intensity = 0;
    await wait(800); await say([['„Ich hab ihn angesehen.“', 2800, K5_W.LU]]);
  } finally { state.talking = false; }
  k5.beat = 'tappen'; k5_takt('tappen');
}
// ---------------------------------------------------------------- K5-15 · Dem Tappen nach
const K5_TAPP = [[-137.6, -30.1], [-131, -26.5], [-127, -16], [-125.5, -6], [-118, 1.5], [-115, 8], [-115, 22], [-115.5, 36], [-118, 46], [-122, 52], [-125, 55], [-114, 53.5], [-96, 53.5], [-82, 56.5], [-66, 60.5], [-55, 62], [-52.5, 64.4]];
async function k5_tappEnde() {
  k5.tp = null; state.talking = true; await fade(1, 1400);
  subtitle('Das Tappen führt dich im Kreis. Durch die Gärten, am Hof vorbei, zweimal um die Villa. Als es aufhört, schlägt es auf dem Kirchberg elf.', 9000);
  k5_platz(K5_POS.tor); k5_uhr(23, 0, true); if (typeof leben_uhr !== 'function' && typeof leben_bellStrike === 'function') for (let i = 0; i < 11; i++) setTimeout(() => leben_bellStrike(.65, false), 1500 + i * 3300);
  await wait(7000); state.talking = false; fade(0, 2600);
  k5_setup('grab', true);
}
// ---------------------------------------------------------------- K5-16 · Das Bett
function k5_grabAufbau(on) { const S = K5, N = typeof ausbau_nord !== 'undefined' ? ausbau_nord : null;
  const pit = N && N.pit ? N.pit : { x: -36.95, z: 71.83 }; S.pit = pit;
  if (N && N.cand) for (const C of N.cand) { if (!C) continue; if (on) { C.k5 = C.k5 ?? C.on; ausbau_nord_setFlame(C, true); } else if (C.k5 !== undefined) { ausbau_nord_setFlame(C, C.k5); C.k5 = undefined; } }
  const K = S.g.graue, L = S.g.luke;
  if (on) { if (K) { K.position.set(pit.x + .75, 0, pit.z - .55); K.rotation.y = PI + .5; K.visible = true; k5_clip(K, 'idle', true); }
    if (L) { L.position.set(pit.x + 1.25, 0, pit.z - .45); L.rotation.y = PI + .2; L.visible = true; k5_clip(L, 'nervous', true); }
    const spots = [[-45.6, 74.5], [-42.9, 70.1], [-39.6, 74.6], [-44.3, 69.6], [-34.8, 74.9]];
    spots.forEach(([x, z], i) => { const g = S.g['gz' + i]; if (!g) return; g.position.set(x, 0, z); g.visible = true; k5_face(g, -52.5, 66.9); k5_clip(g, 'idle', false); g.userData.k5z = z; });
    if (S.hit.grab) S.hit.grab.position.set(pit.x, .4, pit.z); if (S.hit.kleine) S.hit.kleine.position.set(pit.x + .9, .7, pit.z - .5); }
}
function k5_kleineLabel() { if (!k5.gr) return ''; if (k5_hat('mamas_kerze') && k5_hat('feuerzeug') && (k5.gr.feuer > 0 || k5.gr.hinw >= 4)) return 'Mamas Kerze anzünden'; return k5_hat('feuerzeug') ? 'Feuerzeug anzünden' : 'Luna'; }
async function k5_kleineAktion() {
  if (k5.beat !== 'grab' || state.talking || !k5.gr) return;
  if (k5_kleineLabel() === 'Mamas Kerze anzünden') return k5_kerzeAnzuenden();
  if (!k5_hat('feuerzeug')) return;
  // Feuerzeug allein: „Pust.“ – die Flamme stirbt
  k5.gr.feuer++; k5.gr.zeugT = 1.6; const f = K5.flZeug; state.talking = true; if (Audio.flick) Audio.flick();
  await wait(1000); await say([['„Pust.“', 1600, K5_W.K]]); k5.gr.zeugT = 0; state.talking = false;
}
async function k5_insGrab() {
  if (k5.beat !== 'grab' || state.talking) return; state.talking = true;
  try { await say([['„Nicht! Wer sich verschenkt, gehört ihr ganz.“', 3400, K5_W.E], ['„Die da hat sich verschenkt. Weißt du noch, wie sie hieß?“', 4000, K5_W.E], ['…', 2600], ['„Siehst du.“', 2200, K5_W.E]]);
    player.pos.x -= fwd.x * .6; player.pos.z -= fwd.z * .6; } finally { state.talking = false; }
}
async function k5_kerzeAnzuenden() {
  if (k5.beat !== 'grab' || k5.f.kerze) return; if (!k5_hat('mamas_kerze') || !k5_hat('feuerzeug')) return;
  const S = K5, K = S.g.graue, L = S.g.luke; k5.f.kerze = true; state.talking = true; k5_tip(''); uninteract(S.hit.kleine); uninteract(S.hit.grab);
  try {
    k5.hand = { t: 0, phase: 'an' }; if (S.kerzeHand) S.kerzeHand.visible = true; if (Audio.flick) Audio.flick(); await wait(1200);
    k5.hand.phase = 'brennt'; S.flHand.visible = true; await wait(1400);
    if (K) k5_clip(K, 'look', true); Audio.play('air1', { gain: .2, rate: 1.4 }); await wait(1600);
    k5.hand.phase = 'kalt'; S.flHand.visible = false; S.flKalt.visible = true; k5.f.villa = true; S.o.villa.visible = S.o.villaSchein.visible = true;
    if (Audio.chime) Audio.chime(); await wait(2200);
    await say([['„… Mama?“', 2200, K5_W.K], ['„Mama, ich war gar nicht böse.“', 3200, K5_W.K]]);
    // sie lässt die Hand los und läuft zur Villa, wird im Laufen zu Nebel; die Gezählten sinken in die Erde; die Grablichter gehen aus
    if (K) { k5_clip(K, 'walk', false); k5.renne = { g: K, pfad: [[S.pit.x - 6, S.pit.z + 2], [-60, 78], [-80, 75]], i: 0, v: 3.2, nebel: 3.4 }; }
    k5.sinken = 2.5; await wait(2200);
    if (typeof ausbau_nord !== 'undefined' && ausbau_nord.cand) for (const C of ausbau_nord.cand) if (C) { ausbau_nord_setFlame(C, false); C.k5 = undefined; }
    await wait(1200); k5.hand.phase = 'gelb'; S.flKalt.visible = false; S.flHand.visible = true; await wait(1600);
    k5.hand.phase = 'aus'; S.flHand.visible = false; await wait(700); subtitle('Das Wachs ist kalt, obwohl sie gebrannt hat.', 3600); await wait(2400);
    if (S.kerzeHand) S.kerzeHand.visible = false; k5.hand = null; k5.pust = false;
    if (L) { k5_face(L, 30, 98); k5_clip(L, 'walk', false); }
    await say([['„Im Wald findet sie keinen! Der hat kein Echo!“', 3600, K5_W.E]]);
  } finally { state.talking = false; }
  k5.beat = 'zaun'; if (L) k5.renne = { g: L, pfad: [[S.pit.x - 4, 69.2], [-52.5, 67.6], [-52.5, 61.5], [-30, 60], [0, 60], [22, 62], [29, 70], [30, 86], [30, 97.2], [30.2, 99.6]], i: 0, v: 4.6, weg: true };
  k5_setup('zaun'); k5.beat = 'zaun'; k5_takt('zaun');
}
// ---------------------------------------------------------------- K5-17 · Kein Echo (23:40)
async function k5_gitter() {
  if (k5.beat !== 'zaun' || state.talking || k5.f.gitter) return; k5.f.gitter = true; state.talking = true; const S = K5, L = S.g.lucyK;
  try {
    toast('Zu eng. Mit Draht an die Pfosten gebunden.', 3000); if (typeof leben_hush === 'function') leben_hush(14); await wait(3200);
    await say([['„Luke!“', 1800, K5_W.LU]]); await wait(2600); await say([['„Kein Echo. Nicht mal von meinem Namen.“', 3600, K5_W.LU]]);
    k5_uhr(23, 40);
    if (L) { k5_augen('lucyK', 0); L.visible = true; L.position.set(30.4, 0, 85.5); L.rotation.y = 0; k5_clip(L, 'walk', false); k5.lucyEnde = { t: 0 }; if (S.o.laterne) S.o.laterne.visible = true; }
    await wait(4200); if (L) k5_clip(L, 'idle', true);
    await say([['„Großer.“', 2200, K5_W.L], ['„Komm heim.“', 2600, K5_W.L]]);
  } finally { state.talking = false; }
  await wait(900); return k5_ende();
}
async function k5_ende() {
  const S = K5; k5.beat = 'ende'; k5.lucyEnde = null; for (const k of ['villa', 'villaSchein', 'laterne']) if (S.o[k]) S.o[k].visible = false; if (S.g.lucyK) S.g.lucyK.visible = false; S.L.laterne.intensity = 0;
  if (typeof kino_play === 'function') { try { await kino_play('k5'); } catch (e) { console.warn('Kapitel 5: Kino', e); } } else await fade(1, 2000);
  if (typeof kapEnde === 'function') kapEnde(5); else saveFlag('ch6');
  state.ending = true; Audio.hum(false);
  $('endcard').querySelector('h1').textContent = 'KAPITEL 5 — ENDE · ISS AUF, BRUDER';
  $('endcard').querySelector('p').innerHTML = 'Vier Teller. Einer blieb leer.<br>Einer ist in den Wald gelaufen, der kein Echo hat.<br>Lucy hat „heim“ gesagt. Du bist mitgegangen.';
  $('endStats').innerHTML = `FOTOS ${typeof kamera_S !== 'undefined' ? kamera_S.n : 0} · FUNDE ${story.lore.length}`;
  const n6 = typeof startChapter6 === 'function'; $('endcard').querySelector('.next').textContent = n6 ? 'KAPITEL 6 · WENDIGO' : 'HIGH ABYSS MIRA · KAPITEL 6 FOLGT';
  const go = $('endcard').querySelector('.go'); go.style.display = ''; go.textContent = n6 ? 'WEITER · KAPITEL 6 · WENDIGO' : 'ZURÜCK ZUM HAUPTMENÜ';
  go.onclick = async e => { if (e) e.stopPropagation(); if (!n6) return location.reload(); go.onclick = null; $('endcard').classList.remove('show'); ui.overlay = null; document.body.classList.remove('ov'); state.ending = false; k5.on = false; k5_setup('aus'); await startChapter6(); };
  document.exitPointerLock(); ui.overlay = 'endcard'; $('endcard').classList.add('show'); document.body.classList.add('ov'); $('fade').style.opacity = 0;
  k5.on = false; if (n6) saveGame(6);
}

// ---------------------------------------------------------------- Spielstand
MOD_SAVE.push(['kapitel5', () => (k5.on || k5.sp ? { sp: k5.sp, f: k5.f, film: typeof kamera_S !== 'undefined' ? kamera_S.film : k5.film } : { f: { bett: !!k5.f.bett, hase: !!k5.f.hase } }),
  v => { k5.f = Object.assign({}, v.f || {}); if (v.sp) { k5.pend = { sp: v.sp }; k5.sp = v.sp; k5.film = v.film ?? 3; } }]);

// ---------------------------------------------------------------- Takt pro Bild (keine Allokationen)
WORLD_TICK.push((dt, t) => {
  const S = K5; if (!S.ready) return;
  // Lichtübergänge in Nr. 1 (auch außerhalb des Kapitels auf 0 halten)
  if (S.lichtK !== S.lichtZiel) { const z = S.lichtZiel || 0; S.lichtK = Math.abs(z - (S.lichtK || 0)) < .02 ? z : (S.lichtK || 0) + (z - (S.lichtK || 0)) * Math.min(1, dt * 1.6); }
  const lk = k5.on ? (S.lichtK || 0) : 0; if (S.L.kueche) S.L.kueche.intensity = 3.6 * lk; if (S.L.wohn) S.L.wohn.intensity = 1.8 * lk; for (const m of S.lampMats) m.emissiveIntensity = .6 * lk;
  if (!k5.on || !state.started) return;
  k5.bt += dt; const P = player.pos, b = k5.beat;
  if (rain && rain.m) rain.m.visible = false; // nach dem Regen: klar und kalt
  if (Audio.rain && Audio.ctx && (k5.rainT = (k5.rainT || 0) - dt) < 0) { k5.rainT = 2; Audio.rain.gain.setTargetAtTime(.04, Audio.ctx.currentTime, 1.5); }
  if (k5.pust) flashOn = false;
  if (k5.sitzt) k5.sitzT += dt;
  // --- Lucy am Fenster: Kreispfeil erscheint, Augen manchmal weiß
  if (S.g.lucyWin && S.g.lucyWin.visible) { const L = S.g.lucyWin, a = Math.max(-.7, Math.min(.7, Math.atan2(P.x - L.position.x, P.z - L.position.z))); L.rotation.y += (a - L.rotation.y) * Math.min(1, dt * 1.5); }
  if (S.o.pfeil && S.o.pfeil.visible && S.o.pfeil.material.opacity < 1) S.o.pfeil.material.opacity = Math.min(1, S.o.pfeil.material.opacity + dt * .35);
  if (b === 'fenster' && k5.bt > 2.8 && !k5.f.fensterGesagt && !state.talking && k5_dist(S.win3.x, S.win3.z) < 5.5) k5_fensterReden();
  // --- K5-6 an der Tür: Speicherpunkt, dann Spuren und HASENBROT
  if (b === 'licht') { k5.radioT = (k5.radioT || 0) - dt; if (k5.radioT < 0) k5.radioT = k5_radio(-54.9, K5_Y + 1.1, -12.7) + 2; k5.klirrT -= dt; if (k5.klirrT < 0) { k5.klirrT = rand(1.8, 5); k5_klirr(-53, K5_Y + .9, -14.8); }
    const h = S.g.heim; if (h && h.visible) { const k = .5 + .5 * Math.sin(k5.bt * .45); h.position.x = -53.9 + 1.5 * k; h.position.z = -14.3 + .95 * k; h.rotation.y = Math.cos(k5.bt * .45) > 0 ? 1.0 : -2.1; }
    if (Math.hypot(P.x + 47, P.z + 11.2) < 3.2 && !k5.f.tuerSP) { k5.f.tuerSP = true; k5.beat = 'tuer'; k5_setup('tuer', true); } }
  if (b === 'tuer') { k5.radioT = (k5.radioT || 0) - dt; if (k5.radioT < 0) k5.radioT = k5_radio(-54.9, K5_Y + 1.1, -12.7) + 2;
    if (typeof door1 !== 'undefined' && door1.openAngle < 1 && k5_dist(-47, -12) < 2) { door1.openAngle = 1.55; door1.set(true); }
    if (k5_in1() && !k5.f.hasenGesagt && P.x < -50 && k5_blick(-51.2, K5_Y + 1.6, -12.3) > .8) { k5.f.hasenGesagt = true; subtitle('„Das hat sie von mir. Ich hab es ihr gezeigt.“', 3800, K5_W.LU); }
    if (k5_in1() && k5_kueche()) { k5.beat = 'tisch'; k5_setup('tisch', true); } }
  // --- K5-7 am Tisch: summen, „Setz dich doch.“, 8 s → die Spieluhr, Kamera-Sperre
  if (b === 'tisch' || b === 'schleife') { const h = S.g.heim;
    if (h && h.visible && h.userData.person && !h.userData.person.sit) { if (k5.weg > 0) { k5.weg -= dt; const a = Math.atan2(P.x - h.position.x, P.z - h.position.z) + PI; h.rotation.y += Math.atan2(Math.sin(a - h.rotation.y), Math.cos(a - h.rotation.y)) * Math.min(1, dt * 6); k5_haendeVorsGesicht(h); }
      else if (!k5.f.starrt || k5.bt % 4 < 2) { const a = Math.atan2(P.x - h.position.x, P.z - h.position.z); h.rotation.y += Math.atan2(Math.sin(a - h.rotation.y), Math.cos(a - h.rotation.y)) * Math.min(1, dt * 2); }
      S.o.fussGras.visible = true; S.o.fussGras.position.set(h.position.x, K5_Y + .004, h.position.z); }
    if (b === 'tisch' && h && !state.talking) { k5.summT -= dt; if (k5.summT < 0 && !k5.f.starrt) { k5.summT = k5_summen(h.position.x, 1.55, h.position.z) + .6; k5_box(-53.3, 1.4, -21.7, { v: .018, ref: 1 }); }
      k5.setzT -= dt; if (k5.setzT < 0 && k5_in1() && !k5.sitzt) { k5.setzT = 15; k5.setzN++; subtitle('„Setz dich doch.“', 2600, K5_W.H); if (k5.setzN >= 3) k5.f.starrt = true; }
      k5.tischT += dt; if (k5.tischT > 8 && !k5.f.spieluhrGesagt) { k5.f.spieluhrGesagt = true; subtitle('„Unter ihrer Stimme … die Spieluhr. Lucys Spieluhr. Sie läuft im Kinderzimmer.“', 5600, K5_W.LU); setTimeout(() => k5_task('Lucys Spieluhr. Das Kinderzimmer.'), 5200); }
      if (!k5.f.schleifeRuf && P.z < -16.35 && P.x > -54.2 && P.x < -51.8 && k5_kueche()) { k5.f.schleifeRuf = true; k5.beat = 'schleife'; k5.runde = 0; subtitle('„Du bist doch gerade erst gekommen.“', 3000, K5_W.H); } }
    if (b === 'schleife') {
      if (P.z < -17.02 && P.x > -55.8 && P.x < -50.1 && P.y > .3 && !k5.sitzt) k5_schwelle();
      k5.boxT -= dt; if (k5.boxT < 0 && k5.runde < 3) { k5.boxT = k5_box(-53.3, 1.4, -21.7, { v: .03, tempo: [1, .82, .66, .5][k5.runde], det: [0, 0, .06, .08][k5.runde], leier: [0, .01, .02, .04][k5.runde] }); }
      if (k5.runde === 2 && k5.mamaT > 0) { k5.mamaT -= dt; if (k5.mamaT <= 0) k5_mama(); }
      if (k5.runde >= 3 && !state.talking) { if (k5.atemAn) { k5.atem -= dt; if (k5.atem <= 0 && !(typeof kamera_S !== 'undefined' && kamera_S.busy)) { k5.atemAn = false; k5_atemVerpasst(); } } else if (k5.atemT > 0) { k5.atemT -= dt; if (k5.atemT <= 0 && k5_in1()) k5_atemStart(); } }
    } }
  // --- K5-10: die Spieluhr spielt offen
  if (b === 'spieluhr') { k5.boxT -= dt; if (k5.boxT < 0) { k5.boxT = k5_box(-53.3, 1.4, -21.7, { v: .05, tempo: .9, leier: .012 }) + .5; if (typeof mbLidPiv !== 'undefined' && mbLidPiv.rotation.x > -1) tween(mbLidPiv, { rx: -1.4 }, .5); } }
  // --- K5-11: die Graue jagt (nur ungesehen; im Taschenlampenlicht zerfällt sie); Vegas ruft; das Telefon klingelt
  if (b === 'heimweg' && k5.jagd && !state.talking && !ui.overlay) k5_jagd(dt);
  if ((b === 'heimweg' || b === 'lucy' || b === 'anruf') && k5_dist(8, 7.6) < 42) { k5.ringT = (k5.ringT || 0) - dt; if (k5.ringT < 0) { k5.ringT = 3.2; Audio.ring(.09 * Math.max(0, 1 - k5_dist(8, 7.6) / 45)); } }
  if (b === 'brot' && S.g.lucyK && S.g.lucyK.visible && k5.f.lucyGeht) { const L = S.g.lucyK, dx = -28 - L.position.x, dz = -11.4 - L.position.z, d = Math.hypot(dx, dz); if (d < .4) { L.visible = false; k5.f.lucyWeg = true; k5.f.lucyGeht = false; Audio.play('woodClose1', { gain: .4, x: -28, y: 1.2, z: -12.2, ref: 3 }); } else { L.position.x += dx / d * 1.25 * dt; L.position.z += dz / d * 1.25 * dt; L.rotation.y = Math.atan2(dx, dz); } }
  // --- K5-13: Laternen des Westwegs gehen hinter Luke aus; Hilfeleiter im Stall; Augen zu
  if ((b === 'brot' || b === 'stall') && P.x < -70) for (const L of lamps) if (L.mode === 'on' && L.wx < -18 && L.wx > -130 && Math.abs(L.wz) < 8 && L.wx > P.x + 11) { L.mode = 'dying'; L.dead = 0; break; }
  if (b === 'brot' && S.stallP && Math.hypot(P.x - S.stallTuer[0], P.z - S.stallTuer[1]) < 3.5) { k5.beat = 'stall'; k5_setup('stall', true); }
  if (b === 'stall' && k5.f.brotStall) { if (!state.talking && !k5_zu()) { k5.stT += dt;
      if (k5.stT > 20 && k5.hint < 1) { k5.hint = 1; k5_denk('Er kommt nicht, solange ich hinsehe. Sie sieht durch mich. Also darf ich nicht sehen.', 6000); }
      if (k5.stT > 35 && k5.hint < 2) { k5.hint = 2; k5_qFrei(true, 'Q halten – Augen zu'); if (typeof augenzu_frei !== 'function') k5_tip('<kbd>Q</kbd> halten – Augen zu', 8000); if (story.lore.some(l => l.key === 'ow_heft')) setTimeout(() => k5_denk('„Wenn sie nicht hinsieht, darf ich runter in den Stall.“'), 9000); } }
    const zu = k5_zu(); if (typeof augenzu_frei !== 'function') K5.v.el.zu.classList.toggle('on', zu);
    if (zu && !k5.zuWar) k5_stallSzene(); k5.zuWar = zu; }
  // --- laufende Figuren (Luke im Stall, die Kleine zur Villa, der Junge zur Nordzaun-Lücke)
  if (k5.renne) { const R = k5.renne, g = R.g, Q = R.pfad[R.i]; if (!Q) { if (R.weg) g.visible = false; k5.renne = null; } else { const dx = Q[0] - g.position.x, dz = Q[1] - g.position.z, d = Math.hypot(dx, dz); if (d < .3) R.i++; else { const s = Math.min(d, R.v * dt); g.position.x += dx / d * s; g.position.z += dz / d * s; g.rotation.y = Math.atan2(dx, dz); }
      if (R.nebel) { R.nebel -= dt; if (R.nebel <= 0) { g.visible = false; k5.renne = null; Audio.whisper(g.position.x, 1, g.position.z, 1.4); } } } }
  // --- K5-15: das Tappen läuft voraus
  if (b === 'tappen' && k5.tp && !state.talking) { const T = k5.tp, Q = K5_TAPP[T.i]; const d = Math.hypot(P.x - T.x, P.z - T.z);
    T.st -= dt; if (T.st < 0) { T.st = .36 + (d > 9 ? .16 : 0); k5_tapp(T.x + rand(-.1, .1), T.z + rand(-.1, .1), d > 18 ? 1 : .8); }
    if (Q) { if (d < 11) { const dx = Q[0] - T.x, dz = Q[1] - T.z, e = Math.hypot(dx, dz), s = Math.min(e, 1.35 * dt); if (e < .2) T.i++; else { T.x += dx / e * s; T.z += dz / e * s; } } }
    else if (d < 4) k5_tappEnde();
    T.t += dt; if (d > 26 && (T.weit -= dt) < 0) { T.weit = 14; subtitle('Irgendwo vor dir, leise: kleine nackte Füße auf nassem Boden.', 3600); } }
  // --- K5-16: das Bett
  if (b === 'grab' && k5.gr) k5_grabTick(dt);
  if (k5.sinken > 0) { k5.sinken -= dt; for (let i = 0; i < 5; i++) { const g = S.g['gz' + i]; if (g && g.visible) { g.position.y -= dt * .7; if (g.position.y < -1.5) g.visible = false; } } }
  if (k5.hand) k5_handKerze(dt);
  // --- K5-17: Lucy mit der Sturmlaterne
  if (k5.lucyEnde && S.g.lucyK) { const L = S.g.lucyK, e = k5.lucyEnde; e.t += dt; if (L.position.z < 94.2) L.position.z += 1.2 * dt;
    k5_haltLaterne(L); S.L.laterne.intensity = 1.6 * (.94 + .06 * Math.sin(t * 11)); }
});
// Hände vors Gesicht (die Heimkehrerin fürchtet die Kamera): Unterarme hoch, nach dem Animations-Mischer
function k5_haendeVorsGesicht(h) { const P = h.userData.person; if (!P) return; const b = P.b || (P.b = figuren_bones(P.obj)); if (!b.LeftArm || !b.RightArm) return;
  const ax = _k5v[1].set(1, 0, 0).applyQuaternion(h.getWorldQuaternion(_k5q)), bend = (bn, a) => { if (!bn || !bn.parent) return; bn.parent.getWorldQuaternion(_k5q2); bn.getWorldQuaternion(_k5q); const d = K5.qd || (K5.qd = new THREE.Quaternion()); d.setFromAxisAngle(ax, a); bn.quaternion.copy(_k5q2.invert().multiply(d).multiply(_k5q)); bn.updateMatrixWorld(true); };
  bend(b.LeftArm, -1.25); bend(b.RightArm, -1.25); bend(b.LeftForeArm, -1.5); bend(b.RightForeArm, -1.5); }
// Runde 2: Nachhall – Mama, 2011, schreibt einen Brief und zündet eine Laterne an
async function k5_mama() { const S = K5, g = S.g.mama; if (!g || state.talking) return; state.talking = true;
  try { g.position.set(-48.35, K5_Y, -16.05); g.rotation.y = PI + .35; g.visible = true; if (S.o.laterneM) { S.o.laterneM.visible = true; S.o.laterneM.position.set(-47.95, S.anrichteY || K5_Y + 1, -16.45); } if (typeof figuren_memoryLook === 'function') figuren_memoryLook(true); Audio.whisper(-46.9, 1.4, -16, 1.6);
    for (let i = 0; i <= 20; i++) { echoMat.opacity = .35 * i / 20; await wait(40); }
    await say([['Im Wohnzimmer flackert es. Mama, 2011, schreibt einen Brief. Dann zündet sie eine Laterne an.', 4800], ['„Ich hol ihn. Und dann komm ich zu dir zurück.“', 3800, K5_W.M]]);
    for (let i = 20; i >= 0; i--) { echoMat.opacity = .35 * i / 20; await wait(40); }
  } finally { g.visible = false; if (S.o.laterneM) S.o.laterneM.visible = false; echoMat.opacity = 0; if (typeof figuren_memoryLook === 'function') figuren_memoryLook(false); state.talking = false; }
  await wait(2500); if (k5.on && k5.beat === 'schleife') k5_denk('Die Kamera. Sie hat sich weggedreht, als ich sie gehoben hab. Warum hat sie Angst davor?', 5600); }
// K5-11: die Graue (vorhandene Figur „grey“) – bewegt sich nur ungesehen, zerfällt im Licht
function k5_jagd(dt) { const J = k5.jagd, P = player.pos, gy = grey;
  if (!J.ruf && P.z > -11 && P.x > -46) { J.ruf = true; if (typeof albers_S !== 'undefined') albers_S.open = 1; subtitle('„Sie ist raus! Barfuß! Zur Kreuzung!“', 3600, K5_W.V); setTimeout(() => { if (typeof albers_S !== 'undefined') albers_S.open = 0; }, 4200); }
  if (k5_in1()) return;
  if (!J.an) { J.t -= dt; if (J.t < 0) { const a = Math.atan2(-fwd.x, -fwd.z) + rand(-.6, .6); gy.position.set(P.x + Math.sin(a) * 18, 0, P.z + Math.cos(a) * 18); gy.visible = true; J.an = true; Audio.giggle(gy.position.x, 1.2, gy.position.z); subtitle('Irgendwo hinter dir: ein Kichern. Ganz leise.', 3200); } return; }
  const dx = P.x - gy.position.x, dz = P.z - gy.position.z, d = Math.hypot(dx, dz) || .01, seen = (fwd.x * -dx + fwd.z * -dz) / d > .6 && d < 40;
  gy.rotation.y = Math.atan2(dx, dz);
  if (seen) { J.seenT += dt; if (flashOn && d < 8 && J.seenT > .35) { Audio.scareSound('screech'); glitchV = .8; shake = .03; const a = Math.atan2(-fwd.x, -fwd.z) + rand(-.8, .8); gy.position.set(P.x + Math.sin(a) * 20, 0, P.z + Math.cos(a) * 20); J.seenT = 0; } }
  else { const sp = d > 12 ? 5.2 : 3.4; gy.position.x += dx / d * sp * dt; gy.position.z += dz / d * sp * dt; J.seenT = 0; }
  if (d < 1.15) { J.an = false; J.t = 6; gy.visible = false; k5_gefangen(); } }
async function k5_gefangen() { state.talking = true; Audio.scareSound('scream'); shake = .1; glitchV = 1;
  try { const f = inFront(.5, .55); grey.position.copy(f); grey.lookAt(camera.position.x, .55, camera.position.z); grey.visible = true; await wait(380); grey.visible = false; grey.position.y = 0;
    await fade(1, 900); subtitle('Kleine, kalte Finger an deinem Hals. „Iss auf, Bruder.“', 4200); k5_platz(K5_POS.kinder); await wait(1600); fade(0, 1400); } finally { state.talking = false; } }
// K5-16: Hilfeleiter, Ochs am Berg, „Pust.“
function k5_grabTick(dt) { const G = k5.gr, S = K5, P = player.pos, pit = S.pit, dK = Math.hypot(P.x - pit.x, P.z - pit.z);
  G.t += dt;
  if (!G.gesagt && dK < 10 && !state.talking) { G.gesagt = true; G.t = 0; state.talking = true;
    say([['„Schlafenszeit, Bruder.“', 2600, K5_W.K], ['„Ich hab dir ein Bett gemacht. Die Männer vom Amt haben geholfen.“', 4200, K5_W.K], ['„Du legst dich rein. Dann bist du daheim. Und er darf nach Hause. Tausch.“', 4600, K5_W.K], ['„Glaub ihr nicht! Sie gibt nie zurück, was sie nimmt.“', 3800, K5_W.E]]).then(() => { state.talking = false; G.t = 0; }); }
  if (!G.gesagt || state.talking) return;
  if (G.hinw < 3 && G.t > 15) { G.hinw = 3; k5_denk('Sie pustet jedes Licht aus. Jedes? … „Mamas Platz. Sie bringt das Licht mit.“', 6200); }
  if (G.hinw < 4 && G.t > 30 && k5_hat('mamas_kerze') && k5_hat('feuerzeug')) { G.hinw = 4; k5_tip('<kbd>E</kbd> Mamas Kerze anzünden', 9000); }
  // Taschenlampe auf sie → „Pust.“
  const K = S.g.graue; if (!k5.pust && flashOn && K && K.visible && dK < 16 && k5_blick(K.position.x, 1, K.position.z) > .94) { k5.pust = true; flashOn = false; G.hinw = Math.max(G.hinw, 2); state.talking = true;
    say([['„Pust.“', 1600, K5_W.K]]).then(async () => { if (Audio.flick) Audio.flick(); await say([['„Aus. Einfach ausgepustet.“', 2800, K5_W.LU]]); state.talking = false; }); }
  // Ochs am Berg: die Gezählten rücken näher, wenn Luke nicht hinsieht – greifen nie an
  for (let i = 0; i < 5; i++) { const g = S.g['gz' + i]; if (!g || !g.visible) continue; const Pp = g.userData.person, dx = P.x - g.position.x, dz = P.z - g.position.z, d = Math.hypot(dx, dz) || .01, seen = k5_blick(g.position.x, 1, g.position.z) > .5 && d < 30;
    if (Pp) Pp.mx.timeScale = seen ? 0 : 1;
    if (!seen && d > 2.6) { const s = 1.1 * dt; g.position.x += dx / d * s; g.position.z += dz / d * s; g.rotation.y = Math.atan2(dx, dz); } else if (!seen) g.rotation.y = Math.atan2(dx, dz); }
  // Feuerzeugflamme (allein) vor der Kamera, bis sie ausgepustet wird
  const f = S.flZeug; if (G.zeugT > 0) { G.zeugT -= dt; f.visible = true; f.position.copy(camera.position).addScaledVector(fwd, .42); f.position.y -= .12; } else f.visible = false; }
// Mamas Kerze in Lukes Hand (vor der Kamera), Flamme gelb → kerzengerade kalt-weiß → gelb → aus
function k5_handKerze(dt) { const H = k5.hand, S = K5, c = S.kerzeHand; H.t += dt; if (!c) return;
  const r = _k5v[1].set(-fwd.z, 0, fwd.x).normalize(); c.position.copy(camera.position).addScaledVector(fwd, .5).addScaledVector(r, .1); c.position.y -= .36; c.rotation.set(0, 0, 0);
  const top = c.position.y + .16 * c.scale.y + .03; for (const f of [S.flHand, S.flKalt]) f.position.set(c.position.x, top, c.position.z);
  S.flHand.scale.set(.035 * (1 + Math.sin(H.t * 17) * .08), .07 * (1 + Math.sin(H.t * 23) * .1), 1);
  S.L.hand.position.set(c.position.x, top + .05, c.position.z);
  if (H.phase === 'brennt' || H.phase === 'gelb') { S.L.hand.color.setHex(0xffb060); S.L.hand.intensity = .3 + Math.sin(H.t * 13) * .04; }
  else if (H.phase === 'kalt') { S.L.hand.color.setHex(0xdfe8ff); S.L.hand.intensity = .4; }
  else S.L.hand.intensity = 0; }
function k5_haltLaterne(L) { const S = K5, ln = S.o.laterne; if (!ln) return; const P = L.userData.person; let hand = null; if (P) { const b = P.b || (P.b = figuren_bones(P.obj)); hand = b.RightHand || null; }
  if (hand) { hand.getWorldPosition(ln.position); ln.position.y -= .32; } else ln.position.set(L.position.x + .3, .7, L.position.z + .2);
  S.L.laterne.position.set(ln.position.x, ln.position.y + .18, ln.position.z); }
