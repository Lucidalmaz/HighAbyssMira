// =====================================================================  ALBUM (Modul „album“, Zusatzwunsch X-5): Lukes Fotoalbum – echte Seiten zum Blättern, Fotos zum Herausnehmen und Umdrehen
// Einband: Fab „Leather Book“ (Smoggybeard, CC-BY) → game/assets/ms/album/model.glb (tools/_x5_assets.mjs: in Metern, an der halben Dicke in Deckel- und
// Rückenhälfte geschnitten). Die Seiten sind eigene, gebogene Flächen mit Kartonpapier (Canvas beim Laden), Fotoecken, eingeklebten Abzügen und Lukes
// Bleistiftschrift. Geblättert wird mit einer echten Seite, die sich beim Umschlagen wölbt (Eckpunkte je Bild neu, Ecke läuft vor).
// Quellen, die von selbst eingesammelt werden: die sieben Polaroids (Basis PHOTOS/story.photos), die Abzüge der Indizienwände (fotos.js, sobald gesehen),
// Zayns Kinderkamera (zayn.js, sobald gelöst), Hildes Kamera in Kap. 5 (kamera.js; das eine Kreuzungsbild mit dem Neunten blendet ihn nach 1 s aus, 02 D6).
// Weitere Fotos (Grete, Porträt, „HEINI“, Hildes Laube …) heften spätere Module mit album_abheften(id, { bild, serie, art, notiz, datum, hinten }) ab.
// Leere Plätze sind nur Fotoecken – keine Zahl, keine Gesamtzahl.
// „Bühne“ (auch für beutel.js): eigene kleine Szene mit eigenem Licht (beim Laden angelegt), gerendert im selben Bild nach einem Linsen-Durchgang, der die
// Welt weichzeichnet und abdunkelt (Tiefenschärfe-Anmutung); die Spielkamera senkt den Blick zu Lukes Händen (setCamOverride). Die Welt läuft weiter.
// Tasten: [P] Album (in den Einstellungen belegbar), A/D oder ←/→ blättern, Klick Foto herausnehmen, F umdrehen, Esc/P zuklappen.
// Schnittstelle: album_abheften(id, def) · album_hat(id) · album_auf() · album_zu() · album_buehne…/album_kam… (für beutel.js) · album_tasten.
const ALBUM_SERIEN = { sieben: 'Die Sieben', zayn: 'Zayns Kamera', wand: 'Von den Wänden', kap5: 'Hildes Kamera', sonst: 'Dazwischen' };
const ALBUM_SERIE_ORDER = ['sieben', 'zayn', 'wand', 'kap5', 'sonst'];
const ALBUM_DATUM = { 1: '4.11.', 2: '5.11.', 3: '5.11.', 4: '5.11.', 5: '5.11.', 6: '6.11.' };
// Abzüge in echten Maßen (mm): Rahmenbreite/-höhe, Bildfenster (x, y, b, h) innerhalb des Rahmens
const ALBUM_ART = { pola: { w: 88, h: 107, img: [5.5, 5.5, 77, 82], rand: '#ece6d6' }, sofort: { w: 94, h: 92, img: [5, 5, 84, 63], rand: '#efebe2' },
  abzug: { w: 124, h: 84, img: [4, 4, 116, 76], rand: '#f1ede4' }, kinder: { w: 106, h: 80, img: [3.5, 3.5, 99, 73], rand: '#f3efe7' } };
const album_S = { hat: false, e: [], neu: [], spread: 0, open: false, phase: '', t: 0, weltT: 0, sync: 0, still: true, lastZ: null, zaynOk: false, kamN: 0,
  img: new Map(), pages: [], pageTex: new Map(), mesh: {}, card: null, pick: null, hover: null, flights: [], einkleben: [], turn: null, beobT: [], iconUrl: '', aufT: 0, geo: null, ready: false };
let album_tasten = { album: 'KeyP', beutel: 'KeyI' }; try { Object.assign(album_tasten, JSON.parse(localStorage.getItem('ham_tasten') || '{}')); } catch (e) {}
const album_hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return ((h >>> 0) % 10000) / 10000; };
const album_ease = t => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t), album_out = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3), album_io = t => t <= 0 ? 0 : t >= 1 ? 1 : .5 - .5 * Math.cos(Math.PI * t);
function album_kap() { try { return typeof kap === 'function' ? kap() : curChapter(); } catch (e) { return 1; } }

// ================================================================ Bühne (geteilt mit beutel.js)
const album_B = { ready: false, scene: null, cam: null, lens: null, pass: null, spot: null, hemi: null, rim: null, owner: null, k: 0, kZiel: 0, pitch: -.62, lean: .05, camFn: null, v: null, q: null };
function album_buehneBau() {
  const B = album_B, T = THREE; B.scene = new T.Scene(); B.cam = new T.PerspectiveCamera(32, innerWidth / innerHeight, .02, 6); B.scene.add(B.cam);
  // Licht (einmal beim Laden): die Taschenlampe in Lukes rechter Hand als Kegel, dazu Nacht-Grundlicht und ein kalter Saum von hinten links
  B.hemi = new T.HemisphereLight(0x9aa6c0, 0x241c14, .28); B.scene.add(B.hemi);
  B.spot = new T.SpotLight(0xffe2bc, 1.1, 6, .62, .85, 2); B.spot.position.set(.2, .34, .08); B.spot.target.position.set(0, -.08, -.46); B.scene.add(B.spot, B.spot.target);
  B.rim = new T.DirectionalLight(0x8ea4d0, .35); B.rim.position.set(-.6, .5, -.8); B.scene.add(B.rim);
  B.fill = new T.PointLight(0xffc690, 0, 1.5, 2); B.fill.position.set(-.15, -.05, -.2); B.scene.add(B.fill);
  if (scene.environment) { B.scene.environment = scene.environment; B.scene.environmentIntensity = .25; }
  B.v = new T.Vector3(); B.q = new T.Quaternion();
  // Linse: Welt weich und dunkler (vor Bloom/Tonwerten), danach die Bühne obenauf
  B.lens = new ShaderPass({ uniforms: { tDiffuse: { value: null }, uAmt: { value: 0 }, uDim: { value: 0 }, uPx: { value: new T.Vector2(1 / 1600, 1 / 900) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt, uDim; uniform vec2 uPx; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 s = c.rgb; float w = 1.; vec2 d = vUv - .5; float r = length(d * vec2(1.6, 1.));
        float k = uAmt * (.45 + .9 * smoothstep(.05, .7, r));
        for (int i = 0; i < 14; i++) { float a = float(i) * 2.39996, rr = sqrt((float(i) + .5) / 14.); vec2 o = vec2(cos(a), sin(a)) * rr * k * 11. * uPx; s += texture2D(tDiffuse, vUv + o).rgb; w += 1.; }
        s /= w; float l = dot(s, vec3(.3, .5, .2)); s = mix(s, vec3(l) * vec3(.92, .96, 1.06), uDim * .35);
        s *= 1. - uDim * (.42 + .4 * smoothstep(.2, .85, r)); gl_FragColor = vec4(s, c.a); }` });
  B.lens.enabled = false;
  B.pass = { enabled: false, needsSwap: false, clear: false, renderToScreen: false, setSize() {}, dispose() {},
    render(r, w, read) { const ac = r.autoClear; r.autoClear = false; r.setRenderTarget(read); r.clearDepth(); r.render(B.scene, B.cam); r.autoClear = ac; } };
  const i = composer.passes.indexOf(bloom); composer.insertPass(B.lens, i < 0 ? 2 : i); composer.insertPass(B.pass, (i < 0 ? 2 : i) + 1);
  B.camFn = (cam, dt) => { const k = album_io(B.k); if (k <= 0) return; cam.rotation.x = player.pitch + (B.pitch - player.pitch) * k; cam.position.y -= B.lean * k;
    const t = performance.now() / 1000; cam.rotation.z += Math.sin(t * .8) * .004 * k; cam.rotation.y += Math.sin(t * .53) * .003 * k; };
  addEventListener('resize', () => { B.cam.aspect = innerWidth / innerHeight; B.cam.updateProjectionMatrix(); });
  B.ready = true;
}
// Bühne an/aus (owner: 'album' | 'beutel'); die Fahrt selbst steuert album_buehneTick über B.kZiel
function album_buehne(owner, on) { const B = album_B; if (!B.ready) return;
  if (on) { B.owner = owner; B.kZiel = 1; B.lens.enabled = true; B.pass.enabled = true; if (camOverride !== B.camFn) setCamOverride(B.camFn); }
  else if (B.owner === owner) B.kZiel = 0; }
function album_buehneTick(dt) { const B = album_B; if (!B.ready) return;
  if (B.k !== B.kZiel) { B.k += Math.sign(B.kZiel - B.k) * dt / (B.kZiel ? .75 : .6); if ((B.kZiel === 1 && B.k > 1) || (B.kZiel === 0 && B.k < 0)) B.k = B.kZiel; }
  const k = album_io(B.k); B.lens.uniforms.uAmt.value = k; B.lens.uniforms.uDim.value = k * .9;
  if (B.k <= 0 && B.kZiel === 0) { if (B.lens.enabled) { B.lens.enabled = false; B.pass.enabled = false; } if (camOverride === B.camFn) setCamOverride(null); B.owner = null; }
  // Licht folgt der echten Taschenlampe (an/aus, schwache Batterie, Flackern)
  const T = FLASH_TIERS[FLASH.tier], on = flashOn && FLASH.charge > 0 && state.flashFail <= 0; const f = T ? Math.min(1.2, flashlight.intensity / T.intensity) : 1;
  B.spot.intensity = on ? 1.15 * f * (B.spotK || 1) : 0; B.spot.color.setHex(T ? T.color : 0xffe2bc); B.hemi.intensity = on ? .22 : .42; B.rim.intensity = on ? .3 : .5;
  B.fill.intensity = typeof tausch_S !== 'undefined' && tausch_S.L && tausch_S.L.intensity > .1 ? .35 : 0; }
// Beim Laden: Programme übersetzen und Texturen hochladen (kein Ruckeln beim ersten Öffnen)
function album_buehneVorbereiten() { const B = album_B; if (!B.ready) return; const vis = []; B.scene.traverse(o => { vis.push([o, o.visible]); o.visible = true; });
  try { renderer.setRenderTarget(composer.readBuffer); renderer.compile(B.scene, B.cam); B.scene.traverse(o => { if (o.material) for (const m of [].concat(o.material)) for (const k in m) { const t = m[k]; if (t && t.isTexture) renderer.initTexture(t); } });
    const tmp = new THREE.Scene(), q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), B.lens.material); tmp.add(q); renderer.compile(tmp, B.cam); }
  catch (e) { console.warn('Album: Vorbereiten', e); } finally { renderer.setRenderTarget(null); for (const [o, v] of vis) o.visible = v; } }
// Gefahr: nicht öffnen (Jagd, Tod, Film, Gespräch) – mit Lukes Satz
function album_gefahr() { const own = camOverride && camOverride === album_B.camFn;
  if (!state.started || state.ending || ui.paused || (ui.overlay && ui.overlay !== 'albumOv' && ui.overlay !== 'beutelOv')) return 'x';
  if (state.talking || (scripted) || (camOverride && !own) || (typeof mantle !== 'undefined' && mantle)) return 'x';
  if ((typeof tod_S !== 'undefined' && tod_S.dying) || (typeof kino_busy === 'function' && kino_busy()) || state.blackout) return 'x';
  if ((typeof SP !== 'undefined' && SP.chase) || (typeof ch3 !== 'undefined' && ch3.chase === 'run') || state.scaring || (typeof hunt !== 'undefined' && hunt.on)) return 'Nicht jetzt. Nicht, solange es hinter mir her ist.';
  if (typeof kamera_S !== 'undefined' && (kamera_S.hoch || kamera_S.busy)) return 'x';
  if (typeof fear !== 'undefined' && fear.v > .82) return 'Meine Hände zittern. Erst weg hier.';
  return ''; }
function album_nein(msg) { if (msg && msg !== 'x') { toast(msg, 2600); } else Audio.beep && Audio.beep(false); }

// ================================================================ Klänge (einmal beim Laden synthetisch gerendert → Audio.buf)
async function album_klangBau() {
  if (!Audio.ctx || Audio.buf.albBlatt) return; const sr = 44100;
  const mk = async (name, dur, fn) => { const oc = new OfflineAudioContext(2, Math.ceil(sr * dur), sr); fn(oc, oc.destination); Audio.buf[name] = await oc.startRendering(); };
  const noise = (oc, dur) => { const b = oc.createBuffer(1, Math.ceil(sr * dur), sr), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = oc.createBufferSource(); s.buffer = b; return s; };
  const R = (a, b) => a + Math.random() * (b - a);
  // Blättern: Luftzug + Papierrauschen mit Knistern, Frequenz steigt beim Anheben, fällt beim Ablegen
  await mk('albBlatt', .8, (oc, out) => { const n = noise(oc, .8), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.Q.value = .9;
    bp.frequency.setValueAtTime(900, 0); bp.frequency.linearRampToValueAtTime(3400, .25); bp.frequency.linearRampToValueAtTime(1500, .7);
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.35, .06); g.gain.linearRampToValueAtTime(.18, .3); g.gain.linearRampToValueAtTime(.4, .58); g.gain.exponentialRampToValueAtTime(.001, .78);
    n.connect(bp); bp.connect(g); g.connect(out); n.start();
    for (let i = 0; i < 16; i++) { const c = noise(oc, .03), h = oc.createBiquadFilter(), cg = oc.createGain(), t = R(.02, .65); h.type = 'highpass'; h.frequency.value = R(2500, 6000); cg.gain.setValueAtTime(R(.05, .22), t); cg.gain.exponentialRampToValueAtTime(.001, t + R(.01, .03)); c.connect(h); h.connect(cg); cg.connect(out); c.start(t); }
    const a = noise(oc, .8), lp = oc.createBiquadFilter(), ag = oc.createGain(); lp.type = 'lowpass'; lp.frequency.value = 260; ag.gain.setValueAtTime(0, 0); ag.gain.linearRampToValueAtTime(.5, .3); ag.gain.exponentialRampToValueAtTime(.001, .75); a.connect(lp); lp.connect(ag); ag.connect(out); a.start(); });
  // Foto aus den Ecken ziehen / hineinschieben: kurzes, helles Gleiten
  await mk('albFoto', .35, (oc, out) => { const n = noise(oc, .35), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 1.4;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.3, .03); for (let i = 1; i < 8; i++) g.gain.linearRampToValueAtTime(R(.12, .32), i * .03); g.gain.exponentialRampToValueAtTime(.001, .32); n.connect(bp); bp.connect(g); g.connect(out); n.start();
    const c = noise(oc, .02), cg = oc.createGain(); cg.gain.setValueAtTime(.25, .25); cg.gain.exponentialRampToValueAtTime(.001, .27); c.connect(cg); cg.connect(out); c.start(.25); });
  // Leder: Haften und Rutschen (Knarzen) beim Aufklappen des Einbands
  await mk('albLeder', .7, (oc, out) => { const n = noise(oc, .7), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = 780; bp.Q.value = 3.5;
    g.gain.setValueAtTime(0, 0); let t = .02; while (t < .6) { const a = R(.15, .5) * (1 - t / .7); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .002); g.gain.exponentialRampToValueAtTime(.001, t + R(.008, .02)); t += R(.012, .04); }
    n.connect(bp); bp.connect(g); g.connect(out); n.start(); const lo = noise(oc, .7), lp = oc.createBiquadFilter(), lg = oc.createGain(); lp.type = 'lowpass'; lp.frequency.value = 400; lg.gain.setValueAtTime(.12, 0); lg.gain.exponentialRampToValueAtTime(.001, .6); lo.connect(lp); lp.connect(lg); lg.connect(out); lo.start(); });
  // Einband fällt zu / legt sich auf: dumpfer Schlag
  await mk('albDumpf', .45, (oc, out) => { const o = oc.createOscillator(), g = oc.createGain(); o.frequency.setValueAtTime(120, 0); o.frequency.exponentialRampToValueAtTime(55, .2); g.gain.setValueAtTime(.55, 0); g.gain.exponentialRampToValueAtTime(.001, .3); o.connect(g); g.connect(out); o.start(); o.stop(.4);
    const n = noise(oc, .2), lp = oc.createBiquadFilter(), ng = oc.createGain(); lp.type = 'lowpass'; lp.frequency.value = 1200; ng.gain.setValueAtTime(.35, 0); ng.gain.exponentialRampToValueAtTime(.001, .12); n.connect(lp); lp.connect(ng); ng.connect(out); n.start(); });
  // Druckknopf am Riemen
  await mk('albKnopf', .12, (oc, out) => { for (const [t, f, a] of [[0, 2600, .5], [.035, 1700, .3]]) { const n = noise(oc, .03), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 6; g.gain.setValueAtTime(a, t); g.gain.exponentialRampToValueAtTime(.001, t + .02); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); } });
  // Reißverschluss (für den Rucksack): Zähnchen, schneller werdend
  await mk('albZipp', .9, (oc, out) => { let t = .02, r = 28; while (t < .82) { const n = noise(oc, .012), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = R(3200, 5200); bp.Q.value = 5; g.gain.setValueAtTime(R(.18, .32), t); g.gain.exponentialRampToValueAtTime(.001, t + .01); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); t += 1 / r; r = Math.min(70, r * 1.035); }
    const n = noise(oc, .9), hp = oc.createBiquadFilter(), g = oc.createGain(); hp.type = 'bandpass'; hp.frequency.value = 2500; hp.Q.value = .8; g.gain.setValueAtTime(.05, 0); g.gain.linearRampToValueAtTime(.09, .6); g.gain.exponentialRampToValueAtTime(.001, .88); n.connect(hp); hp.connect(g); g.connect(out); n.start(); });
  // Steckschnalle (Kunststoff)
  await mk('albSchnalle', .2, (oc, out) => { for (const [t, f, a] of [[0, 1900, .45], [.05, 3100, .35], [.07, 1200, .2]]) { const n = noise(oc, .03), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 4; g.gain.setValueAtTime(a, t); g.gain.exponentialRampToValueAtTime(.001, t + .025); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); } });
  // Stoff/Riemen über die Schulter
  await mk('albStoff', .6, (oc, out) => { const n = noise(oc, .6), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(600, 0); bp.frequency.linearRampToValueAtTime(1800, .35); bp.Q.value = .7;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.3, .12); g.gain.linearRampToValueAtTime(.12, .4); g.gain.exponentialRampToValueAtTime(.001, .58); n.connect(bp); bp.connect(g); g.connect(out); n.start(); });
}
function album_ton(n, o = {}) { try { if (Audio.ctx && Audio.buf[n]) Audio.play(n, { pan: o.pan ?? 0, gain: o.gain ?? .6, rate: o.rate ?? (1 + (Math.random() - .5) * .08), delay: o.delay || 0 }); } catch (e) {} }

// ================================================================ Bilder und Einträge
function album_bild(src) { if (!src) return Promise.resolve(null); const c = album_S.img.get(src); if (c) return c.p;
  const im = new Image(); const p = new Promise(r => { im.onload = () => r(im); im.onerror = () => r(null); }); im.src = src; album_S.img.set(src, { p, im }); return p; }
function album_bildJetzt(src) { const c = album_S.img.get(src); return c && c.im.complete && c.im.naturalWidth ? c.im : null; }
// Laufzeit-Bild (Canvas/Daten-URL) klein halten, damit es in den Spielstand passt
function album_klein(url, w = 320) { return new Promise(res => { const im = new Image(); im.onload = () => { const s = Math.min(1, w / im.naturalWidth), c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; im.onerror = () => res(url); im.src = url; }); }
function album_hat(id) { return album_S.e.some(e => e.id === id); }
function album_serie(e) { return ALBUM_SERIEN[e.serie] ? e.serie : 'sonst'; }
// Öffentlich: ein Foto abheften. def = { bild (URL/Daten-URL), bild2? (ohne den Neunten), serie, art: pola|sofort|abzug|kinder, notiz, datum, hinten: { stil, kreide?, druck?, typ?, stempel?, blei? }, still? }
async function album_abheften(id, def = {}) {
  const S = album_S; if (!id || album_hat(id)) return false;
  let src = def.bild; if (src && src.toDataURL) src = src.toDataURL('image/jpeg', .85); if (src && src.startsWith('data:') && src.length > 60000) src = await album_klein(src, def.art === 'pola' ? 360 : 400);
  let src2 = def.bild2 || null; if (src2 && src2.startsWith && src2.startsWith('data:') && src2.length > 60000) src2 = await album_klein(src2, 400);
  if (album_hat(id)) return false; const kp = album_kap();
  const e = { id, serie: def.serie || 'sonst', art: ALBUM_ART[def.art] ? def.art : 'abzug', src, src2, notiz: def.notiz || '', datum: def.datum || ALBUM_DATUM[kp] || '', hinten: def.hinten || null, k: kp, t: Date.now(), dyn: !!(src && src.startsWith('data:') && !def.basis) };
  if (def.hand) e.hand = def.hand; S.e.push(e); album_bild(src); if (src2) album_bild(src2); album_layout();
  if (!def.still && !S.still) { S.neu.push(id); if (S.hat) album_flug(e); }
  return true;
}
// Seiten aufbauen: Vorsatz, dann je Serie ab neuer Seite zwei Plätze je Seite; am Ende eine leere Seite (nur Ecken)
function album_layout() {
  const S = album_S, P = [{ art: 'vorsatz' }]; const by = {}; for (const e of S.e) (by[album_serie(e)] ||= []).push(e);
  for (const s of ALBUM_SERIE_ORDER) { const L = by[s]; if (!L || !L.length) continue; for (let i = 0; i < L.length; i += 2) P.push({ art: 'seite', titel: i === 0 ? ALBUM_SERIEN[s] : '', slots: [L[i], L[i + 1] || null], serie: s }); }
  P.push({ art: 'seite', titel: '', slots: [null, null], leer: true }); if (P.length % 2) P.push({ art: 'seite', titel: '', slots: [null, null], leer: true });
  const old = S.pages; S.pages = P; S.ver = (S.ver || 0) + 1;
  // Texturen der Seiten, deren Inhalt sich geändert hat, neu malen lassen
  for (const [i, t] of S.pageTex) { const a = old[i], b = P[i]; if (!a || !b || a.art !== b.art || a.titel !== b.titel || (a.slots || []).map(x => x && x.id).join() !== (b.slots || []).map(x => x && x.id).join()) t.dirty = true; }
}
function album_spreadVon(id) { const i = album_S.pages.findIndex(p => p.slots && p.slots.some(e => e && e.id === id)); return i < 0 ? 0 : Math.floor(i / 2); }
function album_spreads() { return Math.ceil(album_S.pages.length / 2); }

// ================================================================ Papier und Schrift (Canvas)
const ALBUM_PX = { W: 768, H: 1222, L: .1805, Z: .1435 }; ALBUM_PX.mm = ALBUM_PX.W / (ALBUM_PX.L * 1000);
let album_papier = null;
function album_papierBau() { const { W, H } = ALBUM_PX, out = {};
  for (const side of ['L', 'R']) { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    x.fillStyle = '#d6cbb2'; x.fillRect(0, 0, W, H);
    // Karton: grobe Wolken, Fasern, Stockflecken
    for (let i = 0; i < 90; i++) { const r = 40 + Math.random() * 180, g = x.createRadialGradient(Math.random() * W, Math.random() * H, 0, 0, 0, 0); void g; }
    for (let i = 0; i < 70; i++) { const cx = Math.random() * W, cy = Math.random() * H, r = 50 + Math.random() * 220, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); const d = Math.random() < .5; g.addColorStop(0, d ? 'rgba(120,90,50,.07)' : 'rgba(255,248,230,.07)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
    const im = x.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n * .8; } x.putImageData(im, 0, 0);
    x.lineCap = 'round'; for (let i = 0; i < 900; i++) { const px = Math.random() * W, py = Math.random() * H, a = Math.random() * 6.28, l = 3 + Math.random() * 12; x.strokeStyle = Math.random() < .6 ? 'rgba(110,86,52,.16)' : 'rgba(255,250,236,.22)'; x.lineWidth = .6 + Math.random() * .8; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + .5) * l * .5, py + Math.sin(a + .5) * l * .5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    for (let i = 0; i < 26; i++) { const px = Math.random() * W, py = Math.random() * H, r = .8 + Math.random() * (Math.random() < .15 ? 7 : 2.4), g = x.createRadialGradient(px, py, 0, px, py, r * 2); g.addColorStop(0, 'rgba(128,78,36,.38)'); g.addColorStop(.5, 'rgba(140,92,48,.16)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r * 2, py - r * 2, r * 4, r * 4); }
    // Ränder nachgedunkelt, Falz zur Bindung hin (links bei rechten Seiten)
    const edge = x.createLinearGradient(0, 0, 0, H); edge.addColorStop(0, 'rgba(90,64,34,.22)'); edge.addColorStop(.05, 'rgba(0,0,0,0)'); edge.addColorStop(.95, 'rgba(0,0,0,0)'); edge.addColorStop(1, 'rgba(90,64,34,.26)'); x.fillStyle = edge; x.fillRect(0, 0, W, H);
    const gx = side === 'R' ? 0 : W, g2 = x.createLinearGradient(gx, 0, side === 'R' ? 110 : W - 110, 0); g2.addColorStop(0, 'rgba(40,26,12,.55)'); g2.addColorStop(.35, 'rgba(60,40,20,.14)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, W, H);
    const ox = side === 'R' ? W : 0, g3 = x.createLinearGradient(ox, 0, side === 'R' ? W - 40 : 40, 0); g3.addColorStop(0, 'rgba(90,64,34,.3)'); g3.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g3; x.fillRect(0, 0, W, H);
    // Prägung der Kartonrippe (feine senkrechte Linien)
    x.globalAlpha = .05; for (let px = 0; px < W; px += 3) { x.fillStyle = px % 6 ? '#fff' : '#5a4428'; x.fillRect(px, 0, 1, H); } x.globalAlpha = 1;
    out[side] = c; }
  // Vorsatz: dunkles, gewolktes Papier mit Lukes Kürzel auf einem Schildchen
  { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.fillStyle = '#2f2a24'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 140; i++) { const cx = Math.random() * W, cy = Math.random() * H, r = 30 + Math.random() * 160, g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, Math.random() < .5 ? 'rgba(90,70,48,.18)' : 'rgba(10,8,6,.2)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
    x.strokeStyle = 'rgba(160,130,90,.08)'; x.lineWidth = 1.2; for (let i = 0; i < 60; i++) { x.beginPath(); let px = Math.random() * W, py = Math.random() * H; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (Math.random() - .5) * 120; py += Math.random() * 90; x.lineTo(px, py); } x.stroke(); }
    const im = x.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(im, 0, 0);
    x.save(); x.translate(W * .52, H * .78); x.rotate(-.025); x.shadowColor = 'rgba(0,0,0,.5)'; x.shadowBlur = 8; x.shadowOffsetY = 3; x.fillStyle = '#e4d9c0'; x.fillRect(-130, -48, 260, 96); x.shadowBlur = 0; x.shadowOffsetY = 0;
    x.strokeStyle = 'rgba(120,40,30,.55)'; x.lineWidth = 2; x.strokeRect(-120, -38, 240, 76); x.strokeStyle = 'rgba(120,40,30,.3)'; x.strokeRect(-115, -33, 230, 66); x.restore();
    out.vorsatz = c; }
  album_papier = out; }
// Bleistift: Caveat, graphitgrau, leicht glänzend, zeilenweise mit kleinem Versatz
function album_blei(x, text, px, py, { size = 34, max = 600, rot = -.02, align = 'left', farbe = 'rgba(48,47,54,.86)' } = {}) {
  x.save(); x.translate(px, py); x.rotate(rot); x.font = `${size}px Caveat, cursive`; x.textAlign = align; x.textBaseline = 'alphabetic';
  const words = String(text).split(/\s+/), lines = []; let l = ''; for (const w of words) { const t = l ? l + ' ' + w : w; if (x.measureText(t).width > max && l) { lines.push(l); l = w; } else l = t; } if (l) lines.push(l);
  lines.forEach((ln, i) => { const y = i * size * 1.02, dx = Math.sin(i * 1.7) * 2; x.fillStyle = farbe; x.fillText(ln, dx, y); x.globalAlpha = .35; x.fillStyle = 'rgba(120,120,130,.6)'; x.fillText(ln, dx + .6, y - .5); x.globalAlpha = 1; });
  x.restore(); return lines.length * size * 1.02; }
// Ein Abzug mit Rahmen in einen 2D-Kontext zeichnen (Mitte cx|cy, Drehung rot, Maßstab px/mm); gibt die Rahmenmaße in px zurück
function album_abzugMalen(x, e, cx, cy, rot, mm, { schatten = true, ohne = false } = {}) {
  const A = ALBUM_ART[e.art], w = A.w * mm, h = A.h * mm; x.save(); x.translate(cx, cy); x.rotate(rot);
  if (schatten) { x.shadowColor = 'rgba(30,18,6,.5)'; x.shadowBlur = 12 * mm / 4.25; x.shadowOffsetX = 2 * mm / 4.25; x.shadowOffsetY = 5 * mm / 4.25; }
  const im = album_bildJetzt(ohne && e.src2 ? e.src2 : e.src);
  if (e.art === 'pola' && e.serie === 'sieben' && im) { x.drawImage(im, -w / 2, -h / 2, w, h); } // Hildes Polaroids haben ihren Rahmen schon im Bild
  else { x.fillStyle = A.rand; x.fillRect(-w / 2, -h / 2, w, h); x.shadowColor = 'transparent'; const [ix, iy, iw, ih] = A.img;
    if (im) { const s = Math.max(iw / im.naturalWidth, ih / im.naturalHeight), sw = iw / s, sh = ih / s; x.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, -w / 2 + ix * mm, -h / 2 + iy * mm, iw * mm, ih * mm); }
    else { x.fillStyle = '#26241f'; x.fillRect(-w / 2 + ix * mm, -h / 2 + iy * mm, iw * mm, ih * mm); }
    // Papierstruktur des Rahmens, feiner Glanz über dem Bild
    const g = x.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,.07)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.06)'); x.fillStyle = g; x.fillRect(-w / 2, -h / 2, w, h);
    if (e.art === 'kinder') { x.fillStyle = 'rgba(255,150,40,.85)'; x.font = `bold ${Math.round(3.2 * mm)}px monospace`; x.textAlign = 'right'; x.fillText(e.stempel || '07 · 09', w / 2 - 6 * mm, h / 2 - 7 * mm); }
    if (e.art === 'sofort' && e.hand) album_blei(x, e.hand, 0, h / 2 - 11 * mm, { size: Math.round(5.2 * mm), max: w - 10 * mm, align: 'center', rot: 0, farbe: 'rgba(40,40,70,.8)' }); }
  x.restore(); return { w, h }; }
// Fotoecken (schwarzes Papier, gefalzt) an den vier Ecken eines gedrehten Rechtecks
function album_ecken(x, cx, cy, w, h, rot, mm) { const s = 7.5 * mm;
  x.save(); x.translate(cx, cy); x.rotate(rot);
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { x.save(); x.translate(sx * w / 2, sy * h / 2); x.scale(sx, sy);
    x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 3; x.shadowOffsetY = 1.5; x.fillStyle = '#15130f'; x.beginPath(); x.moveTo(-s * .78, -s * .12 - 2); x.lineTo(s * .22 + 2, -s * .12 - 2); x.lineTo(s * .22 + 2, s * .78); x.closePath(); x.fill();
    x.shadowColor = 'transparent'; x.strokeStyle = 'rgba(255,255,255,.09)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-s * .74, -s * .1); x.lineTo(s * .18, s * .74); x.stroke(); x.restore(); }
  x.restore(); }
// Platz eines Eintrags auf der Seite (px im Seiten-Canvas): Mitte, Drehung, Beschriftung daneben oder darunter
function album_platz(page, i, side) { const { W, H, mm } = ALBUM_PX, e = page.slots[i], art = e ? e.art : (page.slots[0] ? page.slots[0].art : 'pola'), A = ALBUM_ART[art];
  const w = A.w * mm, h = A.h * mm, seitlich = w < 470, cy = H * (i ? .74 : .305) + (page.titel && !i ? 18 : 0), gut = side === 'R' ? 70 : W - 70, frei = side === 'R' ? 1 : -1;
  const cx = seitlich ? (side === 'R' ? gut + 26 + w / 2 : gut - 26 - w / 2) : W / 2 + frei * 18, rot = e ? (album_hash(e.id) - .5) * .07 : (i ? .012 : -.01);
  return { cx, cy, w, h, rot, seitlich, capX: seitlich ? (side === 'R' ? cx + w / 2 + 28 : cx - w / 2 - 28) : cx - w / 2 + 12, capY: seitlich ? cy - h * .18 : cy + h / 2 + 46, capMax: seitlich ? W - w - 150 : w, capAlign: seitlich && side === 'L' ? 'right' : 'left' }; }
// Eine Seite malen (Index in S.pages; side: L = linke, R = rechte Buchseite); ausgenommen: der gerade herausgenommene/einfliegende Eintrag
function album_seiteMalen(c, idx, side) {
  const S = album_S, x = c.getContext('2d'), { W, H, mm } = ALBUM_PX, p = S.pages[idx]; if (!album_papier) album_papierBau();
  if (!p) { x.drawImage(album_papier[side], 0, 0); return; }
  if (p.art === 'vorsatz') { x.drawImage(album_papier.vorsatz, 0, 0); album_blei(x, 'L. B.', W * .52, H * .78 + 14, { size: 46, align: 'center', rot: -.04, farbe: 'rgba(40,40,46,.85)' }); return; }
  x.drawImage(album_papier[side], 0, 0);
  if (p.titel) { const tx = side === 'R' ? 120 : W - 120; const hh = album_blei(x, p.titel, tx, 92, { size: 50, align: side === 'R' ? 'left' : 'right', rot: -.012 });
    x.save(); x.strokeStyle = 'rgba(52,52,58,.6)'; x.lineWidth = 1.6; x.beginPath(); const w0 = Math.min(360, p.titel.length * 22); const a = side === 'R' ? tx : tx - w0; x.moveTo(a - 4, 104); x.bezierCurveTo(a + w0 * .3, 108, a + w0 * .7, 100, a + w0 + 8, 106); x.stroke(); x.restore(); void hh; }
  for (let i = 0; i < 2; i++) { const e = p.slots[i]; if (!e && !p.leer && i === 1 && !p.slots[0]) continue; const L = album_platz(p, i, side);
    const weg = e && ((S.pick && S.pick.e === e) || S.einkleben.some(q => q.e === e && !q.fertig)); if (e && !weg) { album_abzugMalen(x, e, L.cx, L.cy, L.rot, mm, { ohne: !!e.src2 }); }
    album_ecken(x, L.cx, L.cy, L.w, L.h, L.rot, mm);
    if (e) { const cap = e.notiz; let y = L.capY; if (cap) y += album_blei(x, cap, L.capX, y, { size: 33, max: L.capMax, align: L.capAlign, rot: L.seitlich ? -.03 : -.015 }); if (e.datum) album_blei(x, e.datum, L.capX + (L.capAlign === 'right' ? -4 : 6), y + 4, { size: 30, align: L.capAlign, rot: -.03, farbe: 'rgba(56,55,62,.7)' }); } }
}
// Seitentextur (gecacht; bei Änderungen neu gemalt)
function album_seitenTex(idx, side) { const S = album_S, k = idx + side; let t = S.pageTex.get(k);
  if (!t) { const c = document.createElement('canvas'); c.width = ALBUM_PX.W; c.height = ALBUM_PX.H; t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.dirty = true; t.minFilter = THREE.LinearMipmapLinearFilter; S.pageTex.set(k, t);
    if (S.pageTex.size > 12) { for (const [kk, tt] of S.pageTex) { if (Math.abs(parseInt(kk) - idx) > 5) { tt.dispose(); S.pageTex.delete(kk); break; } } } }
  if (t.dirty) { t.dirty = false; album_seiteMalen(t.image, idx, side); t.needsUpdate = true; } return t; }
function album_seitenNeu(e) { for (const [k, t] of album_S.pageTex) { const idx = parseInt(k), p = album_S.pages[idx]; if (!e || (p && p.slots && p.slots.includes(e))) t.dirty = true; } }

// ================================================================ 3D-Album (in der Bühne)
const ALBUM_N = 30, ALBUM_M = 6; // Spalten (von der Bindung zur Kante) × Zeilen der gebogenen Seiten
function album_profil(s) { const L = ALBUM_PX.L, u = Math.min(1, s / .034); return .0006 - .0064 * (1 - u * u * (3 - 2 * u)) + .0011 * Math.sin(Math.PI * Math.min(1, s / L)); }
// Seiten-Geometrie: rechts (s → x = s), links (im geschlossenen Deckel: x = s, y = −profil; nach dem Aufklappen um 180° liegt sie links)
function album_seitenGeo(links) { const { L, Z } = ALBUM_PX, g = new THREE.BufferGeometry(), N = ALBUM_N, M = ALBUM_M, pos = new Float32Array((N + 1) * (M + 1) * 3), uv = new Float32Array((N + 1) * (M + 1) * 2), idx = [];
  for (let j = 0; j <= M; j++) for (let i = 0; i <= N; i++) { const k = j * (N + 1) + i, s = L * i / N, z = -Z + 2 * Z * j / M; pos[k * 3] = s; pos[k * 3 + 1] = (links ? -1 : 1) * album_profil(s); pos[k * 3 + 2] = z; uv[k * 2] = links ? 1 - i / N : i / N; uv[k * 2 + 1] = 1 - j / M; }
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  g.setIndex(idx); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; }
async function album_modellBau() {
  const S = album_S, B = album_B, T = THREE; const root = new T.Group(); root.visible = false; B.scene.add(root);
  const src = await msModel('album', 'model.glb'); const book = src.clone(true); let deckel = null, ruecken = null;
  book.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (o.material) { o.material = o.material.clone(); o.material.envMapIntensity = .22; } if (o.name.startsWith('deckel')) deckel = o; if (o.name.startsWith('ruecken')) ruecken = o; } });
  const achse = new T.Group(); root.add(achse); // Buchmitte: beim Öffnen wandert die Bindung in die Mitte
  const piv = new T.Group(); achse.add(piv); if (deckel) { deckel.parent.remove(deckel); piv.add(deckel); } if (ruecken) { ruecken.parent.remove(ruecken); achse.add(ruecken); }
  const pm = () => new T.MeshStandardMaterial({ roughness: .93, metalness: 0, side: T.DoubleSide, envMapIntensity: .15 });
  const pageR = new T.Mesh(album_seitenGeo(false), pm()), pageL = new T.Mesh(album_seitenGeo(true), pm()); achse.add(pageR); piv.add(pageL); pageR.frustumCulled = pageL.frustumCulled = false;
  // Umblätter-Seite: eine Geometrie (Punkte/Normalen geteilt), Vorderseite und Rückseite mit eigenen UVs
  const gF = album_seitenGeo(false), gB = new T.BufferGeometry(); gB.setIndex(gF.index); gB.setAttribute('position', gF.attributes.position); gB.setAttribute('normal', gF.attributes.normal);
  const uvB = gF.attributes.uv.array.slice(); for (let i = 0; i < uvB.length; i += 2) uvB[i] = 1 - uvB[i]; gB.setAttribute('uv', new T.BufferAttribute(uvB, 2));
  const mF = pm(), mB = pm(); mF.side = T.FrontSide; mB.side = T.BackSide; const turnF = new T.Mesh(gF, mF), turnB = new T.Mesh(gB, mB); turnF.visible = turnB.visible = false; turnF.frustumCulled = turnB.frustumCulled = false; achse.add(turnF, turnB);
  // Foto-Karte (Herausnehmen, Umdrehen, Einkleben): dünner Karton, Vorder-/Rückseite als Canvas
  const cF = document.createElement('canvas'), cB = document.createElement('canvas'); cF.width = cB.width = 512; cF.height = cB.height = 640;
  const tF = new T.CanvasTexture(cF), tB = new T.CanvasTexture(cB); tF.colorSpace = tB.colorSpace = T.SRGBColorSpace; tF.anisotropy = tB.anisotropy = 8;
  const edge = new T.MeshStandardMaterial({ color: 0xe8e2d4, roughness: .8 }), front = new T.MeshStandardMaterial({ map: tF, roughness: .34, metalness: 0, envMapIntensity: .5, transparent: true }), back = new T.MeshStandardMaterial({ map: tB, roughness: .8, transparent: true });
  const card = new T.Mesh(new T.BoxGeometry(1, 1, .0006), [edge, edge, edge, edge, front, back]); card.visible = false; card.frustumCulled = false; B.scene.add(card);
  S.mesh = { root, achse, piv, pageR, pageL, turnF, turnB, card, cF, cB, tF, tB, front, back, deckel, ruecken };
  // Vorbereitung: alle Materialien einmal mit Textur (sonst Neuübersetzung beim ersten Blättern)
  const t0 = album_seitenTex(0, 'L'); for (const m of [pageR.material, pageL.material, mF, mB]) m.map = t0; album_fotoKarte(null);
}
// Umblätter-Seite formen: th 0 = liegt rechts, π = liegt links; Ecke unten läuft vor, Kante hinkt nach
function album_turnForm(th) { const { L, Z } = ALBUM_PX, N = ALBUM_N, M = ALBUM_M, g = album_S.mesh.turnF.geometry, P = g.attributes.position.array, sn = Math.sin(th);
  const wR = 1 - album_ease(th / .5), wL = album_ease((th - (Math.PI - .5)) / .5);
  for (let j = 0; j <= M; j++) { const v = j / M; let x = 0, y = album_profil(0) + .0009;
    for (let i = 0; i <= N; i++) { const k = (j * (N + 1) + i) * 3, u = i / N, s = L * u;
      if (i > 0) { const um = (i - .5) / N, ph = th - .95 * sn * Math.pow(um, 1.6) + .42 * sn * um * um * (v - .5); x += Math.cos(ph) * L / N; y += Math.sin(ph) * L / N; }
      const yr = album_profil(s) + .0009; let px = x, py = y; px = px + (s - px) * wR; py = py + (yr - py) * wR; px = px + (-s - px) * wL; py = py + (yr - py) * wL;
      P[k] = px; P[k + 1] = py; P[k + 2] = -Z + 2 * Z * v; } }
  g.attributes.position.needsUpdate = true; g.computeVertexNormals(); }

// ================================================================ Karte (Foto in der Hand): Vorder- und Rückseite malen
function album_fotoKarte(e) { const M = album_S.mesh; if (!M.cF) return; const f = M.cF.getContext('2d'), b = M.cB.getContext('2d'), W = 512, H = 640;
  f.clearRect(0, 0, W, H); b.clearRect(0, 0, W, H); if (!e) { M.tF.needsUpdate = M.tB.needsUpdate = true; return; }
  const A = ALBUM_ART[e.art], s = Math.min(W / A.w, H / A.h); const w = A.w * s, h = A.h * s; M.card.scale.set(A.w / 1000, A.h / 1000, 1);
  f.save(); f.translate(W / 2, H / 2); f.scale(W / w, H / h); f.translate(-W / 2, -H / 2); album_abzugMalen(f, e, W / 2, H / 2, 0, s, { schatten: false, ohne: false }); f.restore();
  // Rückseite je Stil
  const H0 = e.hinten || {}; const stil = H0.stil || (e.art === 'pola' || e.art === 'sofort' ? 'pola' : 'papier');
  if (stil === 'pola') { b.fillStyle = '#2c2b29'; b.fillRect(0, 0, W, H); const im = b.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; } b.putImageData(im, 0, 0);
    b.fillStyle = 'rgba(255,255,255,.05)'; b.fillRect(W * .08, H * .08, W * .84, H * .64); b.strokeStyle = 'rgba(255,255,255,.07)'; b.lineWidth = 2; b.strokeRect(W * .08, H * .08, W * .84, H * .64);
    b.fillStyle = '#1f1e1c'; b.fillRect(0, H * .8, W, H * .2); }
  else { b.fillStyle = '#efebe1'; b.fillRect(0, 0, W, H); b.save(); b.rotate(-.5); b.fillStyle = 'rgba(120,130,150,.13)'; b.font = '15px "Special Elite", monospace'; for (let y = -200; y < H + 400; y += 38) for (let x = -400; x < W + 200; x += 170) b.fillText(H0.druck || 'FOTOPAPIER', x + (y % 76 ? 85 : 0), y); b.restore(); }
  // Aufschriften
  if (H0.kreide) { const k = document.createElement('canvas'); k.width = W; k.height = H; const kx = k.getContext('2d'); kx.translate(W / 2, H * .42); kx.rotate(-.06); kx.font = 'bold 58px Caveat, cursive'; kx.textAlign = 'center'; kx.fillStyle = 'rgba(236,232,220,.92)';
    H0.kreide.split('\n').forEach((l, i) => kx.fillText(l, 0, i * 62)); kx.setTransform(1, 0, 0, 1, 0, 0); kx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 5200; i++) { kx.fillStyle = `rgba(0,0,0,${.25 + Math.random() * .6})`; kx.fillRect(Math.random() * W, H * .2 + Math.random() * H * .5, 1 + Math.random() * 2.2, 1 + Math.random() * 1.6); } b.drawImage(k, 0, 0); }
  if (H0.typ) { b.save(); b.translate(W * .12, H * .16); b.rotate(.012); b.fillStyle = 'rgba(245,238,214,.95)'; b.fillRect(-10, -34, W * .78, 30 + H0.typ.length * 30); b.fillStyle = '#2a2622'; b.font = '22px "Special Elite", "Courier New", monospace'; H0.typ.forEach((l, i) => b.fillText(l, 0, i * 30)); b.restore(); }
  if (H0.stempel) { b.save(); b.translate(W * .52, H * .66); b.rotate(-.12); b.strokeStyle = 'rgba(150,30,26,.72)'; b.lineWidth = 4; b.strokeRect(-190, -40, 380, 80); b.fillStyle = 'rgba(150,30,26,.72)'; b.font = 'bold 30px "Special Elite", monospace'; b.textAlign = 'center'; b.fillText(H0.stempel, 0, 10);
    b.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 500; i++) b.fillRect(-200 + Math.random() * 400, -45 + Math.random() * 90, 2, 2); b.restore(); b.globalCompositeOperation = 'source-over'; }
  if (H0.blei) album_blei(b, H0.blei, W * .12, H * .88, { size: 34, max: W * .76, farbe: stil === 'pola' ? 'rgba(200,196,186,.75)' : 'rgba(48,47,54,.8)' });
  M.tF.needsUpdate = M.tB.needsUpdate = true; }

// ================================================================ Öffnen / Schließen / Blättern
const ALBUM_POSE = { // in Kamera-Koordinaten der Bühne: aus der Innentasche der Jacke (unten links) → in den Händen → aufgeklappt
  jacke: { p: [-.2, -.33, -.36], r: [.35, .75, 1.25] }, hand: { p: [.0, -.07, -.6], r: [1.05, 0, 0] }, offen: { p: [0, -.028, -.62], r: [1.16, 0, 0] } };
const album_tmp = { e0: null, e1: null, q0: null, q1: null, v: null, ray: null, m: null, hits: [] };
function album_pose(a, b, k, o) { const T = album_tmp; T.q0.setFromEuler(T.e0.set(a.r[0], a.r[1], a.r[2])); T.q1.setFromEuler(T.e1.set(b.r[0], b.r[1], b.r[2])); o.quaternion.slerpQuaternions(T.q0, T.q1, k);
  o.position.set(a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k + Math.sin(k * Math.PI) * .03, a.p[2] + (b.p[2] - a.p[2]) * k); }
function album_darf() { return !album_S.open && album_S.ready && !(typeof beutel_S !== 'undefined' && beutel_S.open) && album_B.owner === null; }
function album_auf() {
  const S = album_S; if (!S.ready || S.open) return; if (!S.hat) return toast(S.e.length ? 'Die Fotos stecken lose in der Jacke. Ein Album wäre gut.' : 'Kein Album. Noch nicht.', 2600);
  const g = album_gefahr(); if (g) return album_nein(g); if (!album_darf()) return;
  if (!Audio.buf || !Audio.buf.albBlatt) album_klangBau().catch(() => {});
  S.open = true; S.phase = 'auf'; S.t = 0; S.pick = null; S.turn = null;
  if (S.neu.length) S.spread = album_spreadVon(S.neu[0]); S.spread = Math.max(0, Math.min(album_spreads() - 1, S.spread));
  S.einkleben = S.neu.filter(id => album_spreadVon(id) === S.spread).map(id => ({ e: S.e.find(x => x.id === id), t: 0, fertig: false })).filter(q => q.e);
  S.neu = S.neu.filter(id => !S.einkleben.some(q => q.e.id === id)); album_seitenNeu(null); album_spreadZeigen();
  ui.overlay = 'albumOv'; $('albumOv').classList.add('show'); document.body.classList.add('ov'); if (document.pointerLockElement) document.exitPointerLock();
  album_B.pitch = -.66; album_B.lean = .06; album_buehne('album', true); album_B.spotK = 1.5; album_B.spot.target.position.set(0, -.05, -.62); S.mesh.root.visible = true; album_pose(ALBUM_POSE.jacke, ALBUM_POSE.jacke, 0, S.mesh.root); S.mesh.piv.rotation.z = 0; S.mesh.achse.position.x = -.094;
  album_ton('albStoff', { gain: .35, pan: -.4 }); album_hinweis(); if (typeof spannung_did === 'function') { /* Welt läuft weiter */ }
}
function album_zu(schnell) { const S = album_S; if (!S.open || S.phase === 'zu') return; if (S.pick) album_pickZurueck(true); S.turn = null; S.mesh.turnF.visible = S.mesh.turnB.visible = false;
  for (const q of S.einkleben) q.fertig = true; S.einkleben.length = 0; album_seitenNeu(null); album_spreadZeigen(); S.phase = 'zu'; S.t = schnell ? .9 : 0; $('albumOv').classList.remove('hint'); document.body.style.cursor = ''; }
function album_ende() { const S = album_S; S.open = false; S.phase = ''; S.mesh.root.visible = false; S.mesh.card.visible = false; album_buehne('album', false); document.body.style.cursor = '';
  if (ui.overlay === 'albumOv') closeOverlay(); else $('albumOv').classList.remove('show', 'hint'); }
function album_spreadZeigen() { const S = album_S, M = S.mesh, i = S.spread; M.pageL.material.map = album_seitenTex(2 * i, 'L'); M.pageR.material.map = album_seitenTex(2 * i + 1, 'R'); album_beobPruefen(); }
function album_blaettern(d) { const S = album_S; if (!S.open || S.phase !== 'offen' || S.turn || S.pick || S.einkleben.length) return; const n = S.spread + d; if (n < 0 || n >= album_spreads()) { album_ton('albFoto', { gain: .08, rate: .6 }); return; }
  const M = S.mesh, i = S.spread; S.turn = { d, t: 0, von: i, nach: n };
  if (d > 0) { M.turnF.material.map = album_seitenTex(2 * i + 1, 'R'); M.turnB.material.map = album_seitenTex(2 * n, 'L'); M.pageR.material.map = album_seitenTex(2 * n + 1, 'R'); }
  else { M.turnF.material.map = album_seitenTex(2 * n + 1, 'R'); M.turnB.material.map = album_seitenTex(2 * i, 'L'); M.pageL.material.map = album_seitenTex(2 * n, 'L'); }
  album_turnForm(d > 0 ? 0 : Math.PI); M.turnF.visible = M.turnB.visible = true; album_ton('albBlatt', { gain: .5, rate: .95 + Math.random() * .12, pan: d > 0 ? .15 : -.15 }); S.beobT.length = 0; }
// Nachbar-Seiten schon malen und hochladen (je Bild höchstens eine)
function album_vorladen() { const S = album_S; for (const i of [S.spread + 1, S.spread - 1]) { if (i < 0 || i >= album_spreads()) continue; for (const [k, sd] of [[2 * i, 'L'], [2 * i + 1, 'R']]) { const t = S.pageTex.get(k + sd); if (!t || t.dirty) { const tt = album_seitenTex(k, sd); renderer.initTexture(tt); return; } } } }

// ================================================================ Foto herausnehmen / umdrehen / zurück
function album_slotWelt(idx, i, side, out) { const S = album_S, p = S.pages[idx], L = album_platz(p, i, side), { W, H } = ALBUM_PX, u = L.cx / W, v = L.cy / H;
  const s = side === 'R' ? u * ALBUM_PX.L : (1 - u) * ALBUM_PX.L, x = side === 'R' ? s : -s, y = album_profil(s) + .0016, z = -ALBUM_PX.Z + 2 * ALBUM_PX.Z * v; out.set(x, y, z); S.mesh.achse.localToWorld(out); return L; }
function album_kartePlatz(idx, i, side, card) { const T = album_tmp, M = album_S.mesh; const L = album_slotWelt(idx, i, side, card.position);
  M.achse.getWorldQuaternion(card.quaternion); T.q0.setFromEuler(T.e0.set(-Math.PI / 2, 0, 0)); card.quaternion.multiply(T.q0); T.q1.setFromEuler(T.e1.set(0, 0, -L.rot)); card.quaternion.multiply(T.q1); return L; }
function album_trefferSlot(cx, cy) { const S = album_S, M = S.mesh, T = album_tmp; T.m.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1); T.ray.setFromCamera(T.m, album_B.cam);
  for (const [mesh, side] of [[M.pageL, 'L'], [M.pageR, 'R']]) { T.hits.length = 0; T.ray.intersectObject(mesh, false, T.hits); const h = T.hits[0]; if (!h || !h.uv) continue;
    const idx = 2 * S.spread + (side === 'L' ? 0 : 1), p = S.pages[idx]; if (!p || !p.slots) return null; const px = h.uv.x * ALBUM_PX.W, py = (1 - h.uv.y) * ALBUM_PX.H;
    for (let i = 0; i < 2; i++) { const e = p.slots[i]; if (!e) continue; const L = album_platz(p, i, side), dx = px - L.cx, dy = py - L.cy, c = Math.cos(-L.rot), s = Math.sin(-L.rot), rx = dx * c - dy * s, ry = dx * s + dy * c;
      if (Math.abs(rx) < L.w / 2 && Math.abs(ry) < L.h / 2) return { idx, i, side, e }; } return null; } return null; }
function album_pickNehmen(h) { const S = album_S, M = S.mesh; if (S.pick || S.turn || S.phase !== 'offen') return;
  album_fotoKarte(h.e); M.front.opacity = M.back.opacity = 1; album_kartePlatz(h.idx, h.i, h.side, M.card); M.card.visible = true;
  S.pick = { ...h, t: 0, zurueck: false, yaw: 0, yawZiel: 0, drag: null, p0: M.card.position.clone(), q0: M.card.quaternion.clone() };
  album_seitenNeu(h.e); album_spreadZeigen(); album_ton('albFoto', { gain: .5 }); album_hinweis(); }
function album_pickZurueck(sofort) { const S = album_S, P = S.pick; if (!P) return; if (sofort) { S.pick = null; S.mesh.card.visible = false; album_seitenNeu(P.e); album_spreadZeigen(); return; }
  if (P.zurueck) return; P.zurueck = true; P.t = 0; P.p1 = S.mesh.card.position.clone(); P.q1 = S.mesh.card.quaternion.clone(); album_ton('albFoto', { gain: .45, rate: .9, delay: .25 }); }
function album_umdrehen() { const P = album_S.pick; if (!P || P.zurueck || P.t < .45) return; P.yawZiel += Math.PI; album_ton('albFoto', { gain: .2, rate: 1.4 }); }
// Der Neunte (02 D6): auf dem einen Kreuzungsbild ist er eine Sekunde da, dann ist die Stelle leer
function album_beobPruefen() { const S = album_S; S.beobT.length = 0; if (!S.open) return; for (const k of [0, 1]) { const idx = 2 * S.spread + k, p = S.pages[idx]; if (!p || !p.slots) continue; p.slots.forEach((e, i) => { if (e && e.src2) S.beobT.push({ idx, i, side: k ? 'R' : 'L', e, t: 0 }); }); } }

// ================================================================ 2D-Flug: neuer Fund wandert ins Album (Album zu)
function album_flug(e) { const S = album_S; S.flights.push(e); if (S.flights.length === 1) album_flugStart(); }
async function album_flugStart() { const S = album_S; const e = S.flights[0]; if (!e) return;
  await album_bild(e.src); for (let i = 0; i < 400 && (ui.overlay || state.talking || album_S.open); i++) await wait(300); const el = $('albumFlug'), ic = $('albumIcon'); const A = ALBUM_ART[e.art], h = Math.min(innerHeight * .34, 300), w = h * A.w / A.h;
  const c = document.createElement('canvas'); c.width = Math.round(w * 1.2); c.height = Math.round(h * 1.2); const x = c.getContext('2d'); x.translate(c.width / 2, c.height / 2); album_abzugMalen(x, e, 0, 0, 0, c.width / 1.2 / A.w, { schatten: false });
  el.innerHTML = ''; el.appendChild(c); c.style.width = w + 'px'; c.style.height = h + 'px';
  el.style.transition = 'none'; el.style.opacity = '0'; el.style.transform = `translate(-50%, -50%) translate(${innerWidth * .5}px, ${innerHeight * .5}px) rotate(-3deg) scale(.9)`; void el.offsetWidth;
  ic.classList.add('on'); el.style.transition = 'transform .5s cubic-bezier(.2,.8,.3,1), opacity .35s'; el.style.opacity = '1'; el.style.transform = `translate(-50%, -50%) translate(${innerWidth * .5}px, ${innerHeight * .47}px) rotate(2deg) scale(1)`;
  await wait(1100); album_ton('albFoto', { gain: .4, pan: -.5 });
  el.style.transition = 'transform .75s cubic-bezier(.55,0,.35,1), opacity .5s .45s'; const r = ic.getBoundingClientRect(); el.style.transform = `translate(-50%, -50%) translate(${r.left + r.width * .55}px, ${r.top + r.height * .5}px) rotate(-14deg) scale(.16)`; el.style.opacity = '0';
  await wait(700); ic.classList.add('schnapp'); album_ton('albKnopf', { gain: .25, pan: -.55 }); await wait(260); ic.classList.remove('schnapp');
  const nm = e.notiz ? e.notiz.split(' · ')[0] : 'Foto'; $('albumIconT').innerHTML = `Abgeheftet: ${nm}<br><kbd>${album_tastenName(album_tasten.album)}</kbd> Album`;
  await wait(1900); S.flights.shift(); if (S.flights.length) album_flugStart(); else ic.classList.remove('on'); }
function album_tastenName(code) { return !code ? '?' : code.startsWith('Key') ? code.slice(3) : code.startsWith('Digit') ? code.slice(5) : ({ Space: 'Leertaste', Backquote: '^', Minus: 'ß', Period: '.', Comma: ',', Semicolon: 'Ö', Quote: 'Ä', BracketLeft: 'Ü' }[code] || code); }
function album_hinweis() { const S = album_S, el = $('albumOvT'); if (!el) return; const nm = album_tastenName(album_tasten.album);
  el.innerHTML = S.pick ? `<span><kbd>Ziehen</kbd> drehen</span><span><kbd>F</kbd> umdrehen</span><span><kbd>Klick</kbd> <kbd>Esc</kbd> zurück in die Ecken</span>`
    : `<span><kbd>A</kbd><kbd>D</kbd> blättern</span><span><kbd>Klick</kbd> Foto herausnehmen</span><span><kbd>${nm}</kbd> <kbd>Esc</kbd> zuklappen</span>`; }

// ================================================================ Oberfläche (Hinweisleiste, Flug, Symbol) und Eingabe
{ const css = document.createElement('style'); css.textContent = `
  #albumOv { position: fixed; left: 0; right: 0; bottom: 3.2vh; z-index: 6; display: flex; justify-content: center; pointer-events: none; opacity: 0; transition: opacity .5s; }
  #albumOv.show.hint { opacity: 1; }
  #albumOvT { display: flex; gap: 34px; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .24em; color: #d9cdb2; text-shadow: 0 0 4px #000, 0 0 14px #000; text-transform: uppercase; }
  #albumOvT kbd, #albumIconT kbd { font: 600 11px Georgia; border: 1px solid rgba(201,163,106,.6); padding: 1px 6px; margin: 0 3px; color: var(--gold, #c9a36a); border-radius: 2px; }
  #albumCap { position: fixed; z-index: 6; pointer-events: none; font: 22px/1.1 Caveat, cursive; color: #e8dcc0; text-shadow: 0 0 6px #000, 0 0 16px #000; opacity: 0; transition: opacity .25s; transform: translate(14px, 10px); max-width: 320px; }
  #albumCap.on { opacity: .95; }
  #albumFlug { position: fixed; left: 0; top: 0; z-index: 7; pointer-events: none; opacity: 0; filter: drop-shadow(0 14px 22px rgba(0,0,0,.7)); will-change: transform; }
  #albumIcon { position: fixed; left: 34px; bottom: 30px; z-index: 6; pointer-events: none; display: flex; align-items: center; gap: 16px; opacity: 0; transform: translateY(14px); transition: opacity .6s, transform .6s cubic-bezier(.2,.8,.3,1); }
  #albumIcon.on { opacity: 1; transform: none; }
  #albumIcon .buch { width: 78px; height: 102px; border-radius: 3px 6px 6px 3px; background-size: cover; background-position: center; box-shadow: 0 8px 22px rgba(0,0,0,.75), inset 0 0 0 1px rgba(0,0,0,.4), inset 7px 0 10px rgba(0,0,0,.45); transform: rotate(-4deg); transition: transform .25s cubic-bezier(.3,1.6,.5,1); position: relative; }
  #albumIcon.schnapp .buch { transform: rotate(-4deg) scale(1.08); }
  #albumIconT { font: 600 12px/1.9 "Cormorant Garamond", Georgia, serif; letter-spacing: .2em; color: #d9cdb2; text-shadow: 0 0 4px #000, 0 0 12px #000; text-transform: uppercase; }`;
  document.head.appendChild(css);
  const mk = (id, html) => { const d = document.createElement('div'); d.id = id; if (html) d.innerHTML = html; document.body.appendChild(d); return d; };
  mk('albumOv', '<div id="albumOvT"></div>'); mk('albumFlug'); mk('albumCap'); mk('albumIcon', '<div class="buch"></div><div id="albumIconT"></div>'); }
addEventListener('keydown', e => { const S = album_S; if (e.repeat) return;
  if (S.open) { if (ui.overlay !== 'albumOv') return; e.preventDefault(); e.stopPropagation();
    if (e.code === 'Escape' || e.code === album_tasten.album) { if (S.pick) album_pickZurueck(); else album_zu(); return; }
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') album_blaettern(-1); else if (e.code === 'KeyD' || e.code === 'ArrowRight') album_blaettern(1);
    else if (e.code === 'KeyF' || e.code === 'KeyR') album_umdrehen(); return; }
  if (e.code === album_tasten.album && state.started && !ui.overlay && !ui.paused && !state.talking && !(typeof GL !== 'undefined' && GL.lost)) album_auf(); }, true);
addEventListener('mousemove', e => { const S = album_S; if (!S.open || S.phase !== 'offen') return; const P = S.pick;
  if (P) { if (P.drag) { P.yaw += (e.clientX - P.drag) * .012; P.yawZiel = P.yaw; P.drag = e.clientX; } document.body.style.cursor = P.drag ? 'grabbing' : 'grab'; return; }
  if (S.turn || S.einkleben.length) return; const h = album_trefferSlot(e.clientX, e.clientY); S.hover = h; document.body.style.cursor = h ? 'pointer' : 'default';
  const cap = $('albumCap'); if (h) { cap.textContent = h.e.notiz || ''; cap.style.left = e.clientX + 'px'; cap.style.top = e.clientY + 'px'; cap.classList.toggle('on', !!h.e.notiz); } else cap.classList.remove('on'); });
addEventListener('mousedown', e => { const S = album_S; if (!S.open || ui.overlay !== 'albumOv' || S.phase !== 'offen') return; if (e.button !== 0) return;
  const P = S.pick; if (P) { if (P.t >= .45 && !P.zurueck) { P.drag = e.clientX; P.dragX0 = e.clientX; } return; }
  const h = album_trefferSlot(e.clientX, e.clientY); if (h) { $('albumCap').classList.remove('on'); album_pickNehmen(h); return; }
  // Klick auf die Seitenränder blättert
  if (e.clientX > innerWidth * .8) album_blaettern(1); else if (e.clientX < innerWidth * .2) album_blaettern(-1); });
addEventListener('mouseup', e => { const P = album_S.pick; if (!P || !P.drag) return; const moved = Math.abs(e.clientX - P.dragX0) > 6; P.drag = null; if (!moved) album_pickZurueck(); });
addEventListener('wheel', e => { const S = album_S; if (!S.open || S.phase !== 'offen' || S.pick) return; album_blaettern(e.deltaY > 0 ? 1 : -1); }, { passive: true });

// ================================================================ Tick: Animationen
function album_tick(dt) {
  const S = album_S, M = S.mesh; if (!S.ready) return;
  album_buehneTick(dt);
  if (!S.open) return;
  if (ui.overlay !== 'albumOv' && S.phase !== 'zu') { album_ende(); return; } // von außen geschlossen (Tod, Kontextverlust …)
  if (S.phase !== 'zu') { const g = album_gefahr(); if (g) { album_zu(g === 'x'); } }
  S.t += dt; const t = S.t, R = M.root;
  if (S.phase === 'auf') {
    // 0–0,6 s: aus der Jacke in die Hände · 0,6–0,8 s Druckknopf · 0,8–1,45 s Einband auf
    const k1 = album_out(t / .6); album_pose(ALBUM_POSE.jacke, ALBUM_POSE.hand, k1, R);
    if (t > .6 && !S.knopf) { S.knopf = true; album_ton('albKnopf', { gain: .55 }); }
    const k2 = album_io((t - .78) / .7), pop = t > .6 && t < .8 ? Math.sin((t - .6) / .2 * Math.PI) * .06 : 0; M.piv.rotation.z = k2 * Math.PI + pop;
    if (t > .78 && !S.leder) { S.leder = true; album_ton('albLeder', { gain: .5 }); }
    if (t > .78) { const k3 = album_io((t - .78) / .75); album_pose(ALBUM_POSE.hand, ALBUM_POSE.offen, k3, R); M.achse.position.x = -.094 * (1 - k3); }
    if (t > 1.44 && !S.lag) { S.lag = true; album_ton('albDumpf', { gain: .3, rate: 1.3 }); }
    if (t >= 1.6) { S.phase = 'offen'; S.t = 0; S.knopf = S.leder = S.lag = false; M.piv.rotation.z = Math.PI; M.achse.position.x = 0; $('albumOv').classList.add('hint'); album_hinweis(); album_beobPruefen(); } }
  else if (S.phase === 'zu') {
    const k1 = album_io(t / .55); M.piv.rotation.z = Math.PI * (1 - k1); M.achse.position.x = -.094 * k1; album_pose(ALBUM_POSE.offen, ALBUM_POSE.hand, k1, R);
    if (t > .42 && !S.lag) { S.lag = true; album_ton('albDumpf', { gain: .45 }); album_ton('albKnopf', { gain: .4, delay: .18 }); }
    if (t > .55) { const k2 = album_io((t - .55) / .5); album_pose(ALBUM_POSE.hand, ALBUM_POSE.jacke, k2, R); if (!S.stoff) { S.stoff = true; album_ton('albStoff', { gain: .3, pan: -.4 }); album_buehne('album', false); } }
    if (t >= 1.08) { S.lag = S.stoff = false; album_ende(); return; } }
  else { // offen: atmen, wiegen
    const o = ALBUM_POSE.offen; R.position.set(o.p[0] + Math.sin(t * .6) * .0025, o.p[1] + Math.sin(t * 1.05) * .0018, o.p[2]); album_tmp.e0.set(o.r[0] + Math.sin(t * .7) * .006, Math.sin(t * .45) * .008, Math.sin(t * .5) * .004); R.quaternion.setFromEuler(album_tmp.e0);
    if (!S.turn && !S.pick) album_vorladen(); }
  // Blättern
  const U = S.turn; if (U) { U.t += dt / .78; const th = U.d > 0 ? Math.PI * album_io(U.t) : Math.PI * (1 - album_io(U.t)); album_turnForm(th);
    if (U.t >= 1) { S.spread = U.nach; S.turn = null; M.turnF.visible = M.turnB.visible = false; album_spreadZeigen(); album_ton('albFoto', { gain: .12, rate: .7 }); } }
  // Einkleben neuer Fotos (nacheinander): aus der Jacke unten links in die Ecken
  const Q = S.einkleben[0]; if (Q && S.phase === 'offen' && !S.turn) { const pidx = S.pages.findIndex(p => p.slots && p.slots.includes(Q.e)), side = pidx % 2 ? 'R' : 'L', slot = pidx >= 0 ? S.pages[pidx].slots.indexOf(Q.e) : -1;
    if (pidx < 0 || Math.floor(pidx / 2) !== S.spread) { S.einkleben.shift(); }
    else { if (Q.t === 0) { album_fotoKarte(Q.e); M.front.opacity = M.back.opacity = 1; M.card.visible = true; album_ton('albFoto', { gain: .45, delay: .35 }); }
      Q.t += dt / 1.05; const k = album_io(Q.t); album_kartePlatz(pidx, slot, side, M.card); const z = album_tmp.v.copy(M.card.position); const qz = album_tmp.q1.copy(M.card.quaternion);
      album_tmp.q0.setFromEuler(album_tmp.e0.set(.4, .6, 1.1)); M.card.quaternion.slerpQuaternions(album_tmp.q0, qz, album_out(Q.t)); M.card.position.set(-.2 + (z.x + .2) * k, -.25 + (z.y + .25) * k + Math.sin(k * Math.PI) * .07, -.3 + (z.z + .3) * k);
      if (Q.t >= 1) { Q.fertig = true; S.einkleben.shift(); M.card.visible = false; album_seitenNeu(Q.e); album_spreadZeigen(); album_ton('albKnopf', { gain: .2, rate: 1.6 }); } } }
  // Foto in der Hand
  const P = S.pick; if (P && !P.zurueck) { P.t += dt / .5; const k = album_out(P.t), v = album_tmp.v.set(0, .006, -.29); if (!P.drag) P.yaw += (P.yawZiel - P.yaw) * Math.min(1, dt * 9);
      album_tmp.q1.setFromEuler(album_tmp.e1.set(Math.sin(t * .8) * .02, P.yaw, Math.sin(t * .6) * .015)); M.card.quaternion.slerpQuaternions(P.q0, album_tmp.q1, k); M.card.position.lerpVectors(P.p0, v, k); M.card.position.y += Math.sin(k * Math.PI) * .03; }
  else if (P && P.zurueck) { P.t += dt / .45; const k = album_io(P.t); album_kartePlatz(P.idx, P.i, P.side, M.card); album_tmp.v.copy(M.card.position); album_tmp.q0.copy(M.card.quaternion);
    M.card.position.lerpVectors(P.p1, album_tmp.v, k); M.card.position.y += Math.sin(k * Math.PI) * .02; M.card.quaternion.slerpQuaternions(P.q1, album_tmp.q0, k);
    if (P.t >= 1) { S.pick = null; M.card.visible = false; album_seitenNeu(P.e); album_spreadZeigen(); album_hinweis(); document.body.style.cursor = 'default'; } }
  // der Neunte: 1 s, dann weg
  if (S.beobT.length && S.phase === 'offen' && !S.turn && !S.pick && !S.einkleben.length) { const b = S.beobT[0];
    if (b.t === 0) { const e = { ...b.e, src2: null }; album_fotoKarte(e); album_kartePlatz(b.idx, b.i, b.side, M.card); M.card.position.y += 0; M.front.opacity = 1; M.back.opacity = 1; M.card.visible = true; }
    b.t += dt; album_kartePlatz(b.idx, b.i, b.side, M.card); const f = 1 - album_ease((b.t - 1) / .35); M.front.opacity = M.back.opacity = f;
    if (b.t > 1.4) { M.card.visible = false; M.front.opacity = M.back.opacity = 1; S.beobT.shift(); } }
}

// ================================================================ Quellen: automatisch einsammeln
function album_ortAusHinweis(h) { return String(h || '').replace(/^(Im|In der|In den|Im|In|Bei|Auf dem|Auf der|Am|An der)\s+/, '').replace(/\.$/, ''); }
function album_quellen() {
  const S = album_S, still = S.still;
  // 1) die sieben Polaroids
  if (typeof PHOTOS !== 'undefined' && story.photos) for (const i of story.photos) { const id = 'sieben_' + i; if (album_hat(id)) continue; const p = PHOTOS[i]; if (!p || !p.url) continue;
    album_abheften(id, { bild: p.url, basis: true, serie: 'sieben', art: 'pola', notiz: `${p.name} · ${album_ortAusHinweis(p.hint)}`, datum: ALBUM_DATUM[1], hinten: { stil: 'pola', kreide: 'Wer ist das\nachte Kind?' }, still }); }
  // 2) Indizienwände: Abzug, sobald das Foto genau angesehen wurde
  if (typeof fotos_S !== 'undefined' && typeof FOTOS !== 'undefined') for (const k of fotos_S.seen) { const id = 'wand_' + k.slice(5); if (album_hat(id)) continue; const f = FOTOS.find(x => 'foto_' + x.wall + '_' + x.id === k); if (!f) continue;
    const d = f.datum.split(' · ')[0], hint = f.wall === 'keller' ? 'Hildes Wand' : 'Lucys Wand';
    album_abheften(id, { bild: 'assets/fotos/' + f.id + '.jpg', serie: 'wand', art: 'abzug', notiz: `Beweis ${f.nr} · ${f.ort} (Abzug, ${hint})`, datum: d, hinten: { stil: 'papier', typ: [`BEWEIS Nr. ${f.nr}`, f.datum, f.ort, f.quelle], stempel: f.id === 'bergung' ? 'BfR · B3 · 13.07.1992 · 03:13' : null }, still }); }
  // 3) Zayns Kinderkamera (gelöst)
  if (typeof zayn_S !== 'undefined' && zayn_S.stage >= 2 && zayn_S.photos && zayn_S.photos.length && !album_hat('zayn_0')) {
    const was = ['Schaukel', 'Ball', 'Giraffe', 'Baum', 'Karussell', 'Waldrand']; zayn_S.photos.forEach((u, i) => { if (!u) return; album_abheften('zayn_' + i, { bild: u, serie: 'zayn', art: 'kinder', notiz: i < 5 ? `Spielplatz, Bild ${i + 1} – ${was[i]} fehlt. Zayn einen Schritt näher am Wald.` : 'Das letzte: nur noch der Waldrand. „Kommst du mir nach?“', datum: 'Juli 2009', hinten: { stil: 'papier', druck: 'FOTOPAPIER · MATT' }, still }); }); }
  // 4) Hildes Kamera (Kap. 5)
  if (typeof kamera_S !== 'undefined' && kamera_S.fotos && kamera_S.fotos.length && !kamera_S.busy && !(kamera_S.zeigT > 0)) {
    for (let n = 0; n < kamera_S.fotos.length; n++) { const F = kamera_S.fotos[n], Z = F.album || {}; if (!F.url || F.alb) continue; F.alb = true; const txt = (Z.hand || F.text || '').replace(/<[^>]+>/g, ''), kurz = txt.length > 90 ? txt.slice(0, 88).replace(/\s+\S*$/, '') + ' …' : txt;
      album_abheften('kap5_' + Date.now().toString(36) + '_' + n, { bild: F.url, bild2: F.ohne || null, serie: 'kap5', art: 'sofort', notiz: kurz, hand: Z.hand || '', datum: ALBUM_DATUM[5], hinten: { stil: 'pola', blei: Z.stempel ? String(Z.stempel).replace(/\s/g, '') : '' }, still }); } }
}
// Kap. 5: beim Auslösen den Neunten mit und ohne abziehen (nur wenn das Ziel ihn zeigen darf)
function album_kameraHuelle() { if (typeof kamera_render !== 'function' || album_S.kamHuelle) return; album_S.kamHuelle = true; const o = kamera_render;
  kamera_render = function (stamp, Z) { const url = o.call(this, stamp, Z); let ohne = null;
    try { const V = typeof beob_S !== 'undefined' ? beob_S.V : null; if (Z && Z.beob && V && V.g && V.g.visible) { V.g.visible = false; try { ohne = o.call(this, stamp, Z); } finally { V.g.visible = true; } } } catch (e) {}
    album_S.lastZ = { hand: Z && Z.hand, stempel: Z && Z.stempel, ohne }; return url; };
  // das Foto im Stapel der Kamera bekommt die Angaben mit
  const push0 = Array.prototype.push; const arr = kamera_S.fotos; arr.push = function (...a) { for (const F of a) if (F && album_S.lastZ) { F.album = album_S.lastZ; F.ohne = album_S.lastZ.ohne; album_S.lastZ = null; } return push0.apply(this, a); }; }

// ================================================================ Album in der Welt: Hildes Regal (Nr. 7), neben dem ersten Polaroid
async function album_weltBau() { const S = album_S; try {
  const src = await msModel('album', 'model.glb'); const g = src.clone(true); g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const w = new THREE.Group(); w.add(g); scene.add(w);
  const P = typeof PHOTOS !== 'undefined' && PHOTOS[3] && PHOTOS[3].mesh ? PHOTOS[3].mesh.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(21.9, Y + .61, -12.55);
  w.position.set(P.x, P.y - .004 + .034, P.z + .28); w.rotation.y = 1.45; w.userData.noCol = true; S.welt = w;
  const hit = box(.26, .12, .34, w.position.x, w.position.y, w.position.z, hidden, { cast: false }); interact(hit, 'Fotoalbum', () => album_nehmen()); S.weltHit = hit; album_weltSync(); }
  catch (e) { console.warn('Album: Welt', e); } }
function album_weltSync() { const S = album_S; if (!S.welt) return; S.welt.visible = !S.hat; if (S.hat) uninteract(S.weltHit); else if (!interactables.includes(S.weltHit)) interactables.push(S.weltHit); }
function album_nehmen() { const S = album_S; if (S.hat) return; S.hat = true; album_weltSync(); Audio.play && Audio.play('woodHit1', { gain: .15, rate: 1.4 }); album_ton('albLeder', { gain: .3 });
  const n = S.e.length; openNote('Ein Fotoalbum', 'Leder, schwer, ein Riemen mit Druckknopf. Die Seiten sind leer – aber in jeder stecken schon Fotoecken, schwarz, sorgfältig eingeklebt. Seite um Seite.\n\nAls hätte jemand gewusst, dass es Bilder geben wird.' + (n ? '\n\n<span class="hand">Die Fotos aus der Jacke kommen hier rein. Ordentlich. Hilde hätte es so gewollt.</span>' : ''), 'album_nehmen',
    () => { S.neu = S.e.map(e => e.id); toast(`[${album_tastenName(album_tasten.album)}] Fotoalbum`, 3200); if (!story.items.includes('fotoalbum')) story.items.push('fotoalbum'); }); }

// ================================================================ Einstellungen: Tasten belegen (Album, Beutel)
const ALBUM_BELEGT = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyF', 'KeyR', 'KeyG', 'KeyC', 'KeyK', 'KeyL', 'KeyM', 'KeyV', 'KeyJ', 'KeyQ', 'Tab', 'Space', 'ShiftLeft', 'ShiftRight', 'Escape', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F3']);
function album_tastenRows() { return ['album', 'beutel'].map(k => `<div class="row"><span>${k === 'album' ? 'Taste: Fotoalbum' : 'Taste: Beutel'}</span><span class="close" style="margin:0"><button class="albTaste" data-k="${k}">${album_tastenName(album_tasten[k])}</button></span></div>`).join(''); }
function album_tastenBind(panel) { panel.querySelectorAll('.albTaste').forEach(b => b.onclick = ev => { ev.stopPropagation(); b.textContent = '…'; const k = b.dataset.k;
  const h = e => { e.preventDefault(); e.stopPropagation(); removeEventListener('keydown', h, true); if (e.code === 'Escape') { b.textContent = album_tastenName(album_tasten[k]); return; }
    const other = k === 'album' ? 'beutel' : 'album'; if (ALBUM_BELEGT.has(e.code) || e.code === album_tasten[other]) { b.textContent = album_tastenName(album_tasten[k]); toast('Diese Taste ist schon belegt.', 2200); return; }
    album_tasten[k] = e.code; try { localStorage.setItem('ham_tasten', JSON.stringify(album_tasten)); } catch (er) {} b.textContent = album_tastenName(e.code); };
  addEventListener('keydown', h, true); }); }
function album_tastenHook() { const s = $('mSet'), c = $('mCtrl'); if (!s || !c || !s.onclick || !c.onclick) return false; if (s.albHook) return true; s.albHook = true;
    const o1 = s.onclick; s.onclick = e => { o1 && o1.call(s, e); const P = $('subPanel'), cl = P.querySelector('.close:last-child'); const d = document.createElement('div'); d.innerHTML = album_tastenRows(); cl ? P.insertBefore(d, cl) : P.appendChild(d); album_tastenBind(d); if (P.querySelectorAll) P.querySelectorAll('input[type=range]').forEach(r => { try { rangeFill(r); } catch (er) {} }); };
    const o2 = c.onclick; c.onclick = e => { o2 && o2.call(c, e); const K = $('subPanel').querySelector('.keys'); if (K) K.insertAdjacentHTML('beforeend', `<span><kbd class="k">${album_tastenName(album_tasten.beutel)}</kbd></span><span>Beutel öffnen: Fächer, Untersuchen, Benutzen</span><span><kbd class="k">${album_tastenName(album_tasten.album)}</kbd></span><span>Fotoalbum: blättern, Fotos herausnehmen und umdrehen</span>`); };
    return true; }

// ================================================================ Spielstand, Neues Spiel, Fibel
MOD_SAVE.push(['album', () => { const S = album_S; return { hat: S.hat, spread: S.spread, neu: S.neu.slice(0, 40), e: S.e.map(e => ({ id: e.id, serie: e.serie, art: e.art, src: e.dyn ? e.src : (e.src && e.src.startsWith('data:') ? '' : e.src), src2: e.src2 || null, notiz: e.notiz, datum: e.datum, hinten: e.hinten, k: e.k, t: e.t, dyn: e.dyn })) }; },
  v => { const S = album_S; if (!v || typeof v !== 'object') return; S.hat = !!v.hat; S.spread = v.spread | 0; S.neu = Array.isArray(v.neu) ? v.neu : [];
    S.e = (v.e || []).filter(e => e && e.id); for (const e of S.e) { if (e.id.startsWith('sieben_') && typeof PHOTOS !== 'undefined') { const p = PHOTOS[+e.id.slice(7)]; if (p && p.url) e.src = p.url; } if (e.src) album_bild(e.src); if (e.src2) album_bild(e.src2); }
    S.still = true; album_layout(); album_seitenNeu(null); album_weltSync(); }]);
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { const S = album_S; S.hat = false; S.e = []; S.neu = []; S.spread = 0; S.still = true; album_layout(); album_seitenNeu(null); album_weltSync(); } return r; })(beginGame);
renderJournal = (o => () => { o(); try { if (jTab === 'inventar' || jTab === 'aufgaben') return; if (jTab === 'fallwand' || jTab === 'funde') return; const B = $('jBody'), S = album_S; if (!B || !S.hat) return;
  const d = document.createElement('p'); d.style.cssText = 'margin-top:14px;color:var(--dim);font-size:15px'; d.innerHTML = `Im Album: ${S.e.length} ${S.e.length === 1 ? 'Foto' : 'Fotos'} · <kbd style="font:600 11px Georgia;border:1px solid rgba(201,163,106,.6);padding:1px 6px;color:var(--gold)">${album_tastenName(album_tasten.album)}</kbd> öffnen`; B.appendChild(d); } catch (e) {} })(renderJournal);

// Fibel-Reiter „FOTOALBUM“ (sammeln.js): kleine Übersicht, Klick schlägt das Album an der Stelle auf
function album_reiter(B) { const S = album_S; const serien = ALBUM_SERIE_ORDER.filter(k => S.e.some(e => album_serie(e) === k));
  B.innerHTML = `<h2>FOTOALBUM · ${S.e.length} ${S.e.length === 1 ? 'FOTO' : 'FOTOS'}</h2>` + (serien.map(k => `<h3 style="font:24px Caveat,cursive;margin:14px 0 6px;color:#3a3226">${ALBUM_SERIEN[k]}</h3><div style="display:flex;flex-wrap:wrap;gap:10px">${S.e.filter(e => album_serie(e) === k).map(e => `<img data-id="${e.id}" src="${e.src2 || e.src}" title="${(e.notiz || '').replace(/"/g, '&quot;')}" style="height:86px;box-shadow:0 3px 8px rgba(0,0,0,.45);transform:rotate(${((album_hash(e.id) - .5) * 5).toFixed(1)}deg);cursor:pointer;background:#eee;padding:${e.art === 'pola' && e.serie === 'sieben' ? 0 : 4}px">`).join('')}</div>`).join('') || '<p><small>Noch leer.</small></p>')
    + `<p style="margin-top:18px;color:var(--pdim,#5a4a35);font-size:15px"><kbd style="font:600 11px Georgia;border:1px solid rgba(124,36,24,.5);padding:1px 6px">${album_tastenName(album_tasten.album)}</kbd> Album aufschlagen · Klick auf ein Foto schlägt die Seite auf</p>`;
  B.querySelectorAll('img[data-id]').forEach(im => im.onclick = e => { e.stopPropagation(); S.spread = album_spreadVon(im.dataset.id); if (ui.overlay === 'journal') closeOverlay(); setTimeout(() => album_auf(), 60); }); }
// ================================================================ Laden
WORLD_MODS.push(['Album', async () => {
  const S = album_S; album_tmp.e0 = new THREE.Euler(); album_tmp.e1 = new THREE.Euler(); album_tmp.q0 = new THREE.Quaternion(); album_tmp.q1 = new THREE.Quaternion(); album_tmp.v = new THREE.Vector3(); album_tmp.ray = new THREE.Raycaster(); album_tmp.m = new THREE.Vector2();
  try { await document.fonts.load('40px Caveat'); await document.fonts.load('20px "Special Elite"'); } catch (e) {}
  album_buehneBau(); album_papierBau();
  try { await album_modellBau(); } catch (e) { console.warn('Album: Modell', e); return; }
  await album_weltBau(); album_layout();
  try { await album_klangBau(); } catch (e) { console.warn('Album: Klänge', e); }
  $('albumIcon').querySelector('.buch').style.backgroundImage = "url('assets/ms/album/cover.jpg')";
  // Die Welt läuft weiter: Umgebungs- und kleine Schreckgeräusche dürfen auch bei offenem Album/Beutel kommen (große Schrecken nicht – man sieht nichts)
  if (typeof spannung_can === 'function' && !album_S.spHuelle) { album_S.spHuelle = true; const o = spannung_can; spannung_can = function (fam, cls, x) { const ov = ui.overlay; if (ov === 'albumOv' || ov === 'beutelOv') { if (cls === 'major') return false; ui.overlay = null; try { return o.apply(this, arguments); } finally { ui.overlay = ov; } } return o.apply(this, arguments); }; }
  album_kameraHuelle(); try { modItem('fotoalbum', 'Fotoalbum', 'Leder, ein Riemen mit Druckknopf, Fotoecken auf jeder Seite. [' + album_tastenName(album_tasten.album) + '] öffnen.', 'buch'); } catch (e) {}
  { const iv = setInterval(() => { if (album_tastenHook()) clearInterval(iv); }, 400); }
  album_buehneVorbereiten(); S.ready = true;
  if (typeof sammeln_reiter === 'function') sammeln_reiter('album', 'FOTOALBUM', album_reiter, () => album_S.hat, '#8f7a64');
  window.__album = { S: album_S, B: album_B, auf: album_auf, zu: album_zu, blaettern: album_blaettern, abheften: album_abheften, nehmen: album_nehmen, quellen: album_quellen, layout: album_layout, spreadVon: album_spreadVon, umdrehen: album_umdrehen, zurueck: () => album_pickZurueck(),
    wand: k => { if (typeof fotos_S !== 'undefined') fotos_S.seen.add(k); }, SAVE: MOD_SAVE, spread: n => { album_S.spread = n; album_spreadZeigen(); },
    unten: (x, z) => { const L = []; scene.traverse(o => { if (!o.isMesh || !o.visible || o.isInstancedMesh || o.isSkinnedMesh || !o.geometry || !o.material || o.material.visible === false) return; if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const c = o.geometry.boundingSphere.center.clone().applyMatrix4(o.matrixWorld); const r = o.geometry.boundingSphere.radius * o.matrixWorld.getMaxScaleOnAxis(); if (Math.hypot(c.x - x, c.z - z) < r + .5) L.push(o); });
      const R = new THREE.Raycaster(new THREE.Vector3(x, 2.6, z), new THREE.Vector3(0, -1, 0), 0, 3); let h = null; try { h = R.intersectObjects(L, false)[0]; } catch (e) { return 'err'; } return h ? [+h.point.y.toFixed(3), h.face ? +h.face.normal.clone().transformDirection(h.object.matrixWorld).y.toFixed(2) : 0, (h.object.name || h.object.parent && h.object.parent.name || '').slice(0, 14)] : null; },
    probe: (nx = 0, ny = 0) => { const r = new THREE.Raycaster(); r.setFromCamera(new THREE.Vector2(nx, ny), camera); r.far = 6; const h = r.intersectObjects(scene.children, true).find(h => h.object.visible && h.object.material && h.object.material.visible !== false); return h ? { p: h.point.toArray().map(v => +v.toFixed(3)), n: h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld).toArray().map(v => +v.toFixed(2)) : null, o: h.object.name } : null; },
    pickErstes: () => { const S = album_S; for (const k of [0, 1]) { const idx = 2 * S.spread + k, p = S.pages[idx]; if (p && p.slots) for (let i = 0; i < 2; i++) if (p.slots[i]) { album_pickNehmen({ idx, i, side: k ? 'R' : 'L', e: p.slots[i] }); return p.slots[i].id; } } return null; } }; // Testzugriff
}]);
WORLD_TICK.push(dt => {
  const S = album_S; if (!S.ready) return;
  S.sync -= dt; if (S.sync <= 0) { S.sync = .5; album_quellen(); if (S.still) S.still = false;
    if (!S.hat && state.started && album_kap() >= 2) { S.hat = true; album_weltSync(); } } // ab Kapitel 2 steckt es in der Jacke (auch bei Kapitelwahl)
  album_tick(dt);
});
