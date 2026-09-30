// =====================================================================  KIFFEN (Modul „kiffen“, Zusatzwunsch X-6): Kiffer-Welt, Aufgabe „Fünf Minuten“ und die Joint-Szene auf Vegas' Veranda
// Nutzerwunsch (F3_extras.md X-6): Utensilien in der Welt (Pflanzen, Bong, Papes, Feuerzeuge, Poster, Sticker) mit Lukes trockenen Kommentaren; nach belastenden
// Flashbacks sammelt Luke Grinder, Knolle, Papes und Tips und dreht sich auf Vegas' Veranda einen Joint – jeder Handgriff vom Spieler ausgelöst.
// Kanon: Anfang Kapitel 4 (Morgen nach der Nacht von Kap. 1–3). Nur Erwachsene (Luke 26, Mike 27, Roxy 25, Vegas). Kein Werturteil, kein Spielvorteil außer
// kurzer Ruhe (Angst/Herzschlag der Regie auf 0). Luke nie von vorn: die Kamera zeigt nur seine Hände. Whiskey macht nur nach (Husten), wach kein Satz.
// Modelle (CC-BY, CREDITS.md; aufbereitet mit tools/_x6_assets.mjs): assets/ms/haende (Detective Hands, Tony Flanagan: nur Unterarme/Hände, Skelett ab Unterarm),
//   assets/ms/kiffen/{grinder (in Deckel/Körper geschnitten), knolle, papes (Aufdruck neutral), joints, ascher, bong, tuetchen, pflanze, papier}; Peters Feuerzeug = w_lighter.
// Selbst gezeichnet (erlaubt: Decals/Partikel/Papier): Poster und Sticker (Canvas), das Blättchen beim Drehen und der Pappstreifen (verformbare Papierflächen wie im Album),
//   Krümel, Glut, Rauch, Asche, Flamme (Sprites/Punkte). Licht: EIN VLight für die Feuerzeugflamme, beim Laden mit Intensität 0 – zur Laufzeit wird kein Licht angelegt.
// Nachbearbeitung: ein eigener Durchgang vor dem Filmkorn (weiche Welt + Nachbild-Blitze), ohne Einsatz abgeschaltet. Zeitlupe: Welt-Uhr × kiffen_S.zeit (≥ 0,8).
// Schnittstelle (per typeof von Kapitel-APs):
//   kiffen_start(opts)        Flashbacks + „Ich brauch fünf Minuten. Nur fünf.“ + Aufgabe „Fünf Minuten“ (AP-19 am Anfang von Kap. 4; bis dahin startet sie von selbst,
//                             kiffen_S.auto = false schaltet das ab)
//   kiffen_flash(opts)        nur die Nachbild-Blitze (Promise)
//   kiffen_fund(id, pos, o)   Fundort setzen: id 'grinder' | 'papes' | 'knolle' | 'tips'; pos [x, y, z, ry] – AP-15 (Nr. 4 innen: Schublade/Poster), AP-19 (Vegas' Küche)
//   kiffen_poster(art, x, y, z, ry, o)  Poster/Sticker-Decal an eine Wand (art: 'reggae' | 'band' | 'hanf' | 'dub' | 'tanke' …) – z. B. für Lukes Jugendzimmer (AP-15)
//   kiffen_szene(opts)        die Joint-Szene (Promise): opts.sofort (ohne Sammeln), opts.whiskey/vegas (false = ohne), opts.sitz [x, y, z, yaw]
//   kiffen_deko()             Weltdeko (beim Laden; Sichtbarkeit je Kapitel über kapAb)
//   window.__kiffen           Testzugriff (Szene direkt starten, Schritte auslösen, Posen setzen)
const KF_ITEMS = {
  kf_grinder: { name: 'Grinder', desc: 'Alu, schwarz, vier Teile. Lag seit 2016 in meiner Schublade. Das Gewinde knirscht wie früher.' },
  kf_papes: { name: 'Blättchen', desc: 'Lange Blättchen, zweiunddreißig Stück. Zwei fehlen. Die hab ich mit sechzehn für Einkaufszettel benutzt. Angeblich.' },
  kf_knolle: { name: 'Knolle', desc: 'Ein Knöllchen im Tütchen, dazu ein Zettel: „Für schlechte Nächte. R.“' },
  kf_tips: { name: 'Pappdeckel', desc: 'Der Deckel einer Streichholzschachtel. Vegas sagt, daraus werden Tips. Vegas sagt viel.' } };
const KF_ICONS = {
  kf_grinder: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="7" rx="7" ry="2.5"/><path d="M5 7v4c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V7"/><path d="M5 12v5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-5"/></svg>',
  kf_papes: '<svg viewBox="0 0 24 24"><path d="M3 9h18v7H3z"/><path d="M3 9l3-3h15v3"/><path d="M7 12.5h9"/></svg>',
  kf_knolle: '<svg viewBox="0 0 24 24"><path d="M12 3c3 2 5 5 4.5 9-.4 3.4-2.3 6-4.5 7-2.2-1-4.1-3.6-4.5-7C7 8 9 5 12 3z"/><path d="M12 19v3M8 9l-3-1M16 9l3-1M8 14l-3 1M16 14l3 1"/></svg>',
  kf_tips: '<svg viewBox="0 0 24 24"><path d="M4 8h16v8H4z"/><path d="M8 8v8M11 8v8"/></svg>' };
// Fundorte. rueck = vorhandener Ort (Rückfall), solange der eigentliche Ort noch nicht gebaut ist (AP-15: Nr. 4 innen, AP-19: Vegas' Küche)
const KF_FUNDE = {
  grinder: { ort: 'Nr. 4, dein altes Zimmer', ortRueck: 'Nr. 4, hinter dem Fensterladen', item: 'kf_grinder', modell: 'grinder',
    text: '2016. Oma hat die Schublade nie aufgemacht. Oder doch, und nichts gesagt.', textRueck: 'Hinterm Fensterladen. Mein Versteck von 2016. Oma hat es nie gefunden. Glaub ich.' },
  papes: { ort: 'Nr. 4, hinter dem Poster', ortRueck: 'Nr. 4, hinter dem Fensterladen', item: 'kf_papes', modell: 'papes',
    text: 'Hinter dem Poster. Wo sonst. Mit sechzehn ist man nicht kreativ.', textRueck: 'Blättchen. Zweiunddreißig minus zwei. Die Bilanz meiner Jugend.' },
  knolle: { ort: 'Roxys Laube (Schrebergärten)', item: 'kf_knolle', modell: 'tuetchen',
    text: 'Ein Tütchen, festgeklemmt unter dem Topf. Auf dem Zettel, Kuli: „Für schlechte Nächte. R.“', luke: 'Danke, Roxy.' },
  tips: { ort: 'Bei Vegas (Nr. 3)', item: 'kf_tips', modell: null, text: '' } };
const kiffen_S = { ready: false, auf: 'aus', funde: new Set(), echt: {}, done: false, auto: true, flashT: 0, k4T: 0, zittern: 0, weich: 0, weichZiel: 0, weichT: 0, zeit: 1, szene: false,
  // Laufzeit ↓
  R: null, P: {}, deko: [], dekoK: -1, fundObj: {}, fundHit: {}, pass: null, flTex: [], flame: null, vl: null, hookClock: false, worldG: 1, busy: false, in: { dx: 0, dy: 0, down: false, klick: 0 }, hintEl: null };
const KF_V = { v0: new THREE.Vector3(), v1: new THREE.Vector3(), v2: new THREE.Vector3(), v3: new THREE.Vector3(), v4: new THREE.Vector3(), q0: new THREE.Quaternion(), q1: new THREE.Quaternion(), q2: new THREE.Quaternion(),
  q3: new THREE.Quaternion(), m0: new THREE.Matrix4(), m1: new THREE.Matrix4(), e0: new THREE.Euler(), s1: new THREE.Vector3(1, 1, 1), up: new THREE.Vector3(0, 1, 0) };
const kf_clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x, kf_ease = t => { t = kf_clamp(t); return t * t * (3 - 2 * t); }, kf_io = t => { t = kf_clamp(t); return .5 - .5 * Math.cos(Math.PI * t); };
const kf_lerp = (a, b, k) => a + (b - a) * k;
function kf_kap() { try { return typeof kap === 'function' ? kap() : curChapter(); } catch (e) { return 1; } }
function kf_hat(id) { return story.items.includes(id); }
function kf_ton(n, o = {}) { try { if (Audio.ctx && Audio.buf[n]) return Audio.play(n, { gain: o.gain ?? .6, rate: o.rate ?? (1 + (Math.random() - .5) * .06), delay: o.delay || 0, dest: o.x !== undefined ? undefined : Audio.master, x: o.x, y: o.y, z: o.z, ref: o.ref, lp: o.lp, hp: o.hp, dur: o.dur, offset: o.offset }); } catch (e) {} return null; }

// ================================================================ Gegenstände (Jacke = story.items: Story-Dinge zählen nie gegen den Beutel)
for (const [k, v] of Object.entries(KF_ITEMS)) { ITEMS[k] = v; if (typeof ICONS !== 'undefined') ICONS[k] = KF_ICONS[k]; }
if (typeof BEUTEL_MODELLE !== 'undefined') Object.assign(BEUTEL_MODELLE, { kf_grinder: ['kiffen/grinder'], kf_papes: ['kiffen/papes'], kf_knolle: ['kiffen/knolle'] });
function kiffen_nimm(key) { if (kf_hat(key)) return; addItem(key); }

// ================================================================ Klänge (einmal beim Laden synthetisch gerendert → Audio.buf)
async function kiffen_klangBau() {
  if (!Audio.ctx || Audio.buf.kfGrind) return; const sr = 44100;
  const mk = async (name, dur, fn, ch = 2) => { const oc = new OfflineAudioContext(ch, Math.ceil(sr * dur), sr); fn(oc, oc.destination); Audio.buf[name] = await oc.startRendering(); };
  const noise = (oc, dur, col = 0) => { const b = oc.createBuffer(1, Math.ceil(sr * dur), sr), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = l * col + w * (1 - col); d[i] = col ? l * 3 : w; } const s = oc.createBufferSource(); s.buffer = b; return s; };
  const R = (a, b) => a + Math.random() * (b - a);
  const burst = (oc, out, t, f, q, a, len, type = 'bandpass') => { const n = noise(oc, len + .02), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = type; bp.frequency.value = f; bp.Q.value = q; g.gain.setValueAtTime(a, t); g.gain.exponentialRampToValueAtTime(.0008, t + len); n.connect(bp); bp.connect(g); g.connect(out); n.start(t); };
  // Grinder: Alu-Zähne reißen durch Pflanze – dichtes, trockenes Knirschen mit metallischem Schaben (Schleife, 1,6 s)
  await mk('kfGrind', 1.6, (oc, out) => { for (let t = 0; t < 1.58; t += R(.004, .016)) burst(oc, out, t, R(1800, 5200), R(2, 6), R(.05, .22), R(.006, .02));
    for (let t = 0; t < 1.5; t += R(.03, .09)) burst(oc, out, t, R(600, 1100), 8, R(.08, .2), R(.02, .05));
    const s = noise(oc, 1.6), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = 3400; bp.Q.value = 1.2; g.gain.value = .035; s.connect(bp); bp.connect(g); g.connect(out); s.start(); });
  // Gewinde: kurze, harte Klicks (Deckel auf/zu), Magnet-Klack beim Aufsetzen
  await mk('kfGewinde', .9, (oc, out) => { for (let i = 0; i < 7; i++) burst(oc, out, i * .11 + R(0, .02), R(3500, 5500), 9, R(.12, .25), .012); });
  await mk('kfKlack', .25, (oc, out) => { burst(oc, out, 0, 2400, 5, .6, .03); burst(oc, out, .004, 900, 3, .35, .06); const o = oc.createOscillator(), g = oc.createGain(); o.frequency.value = 1650; g.gain.setValueAtTime(.06, 0); g.gain.exponentialRampToValueAtTime(.001, .18); o.connect(g); g.connect(out); o.start(); o.stop(.2); });
  // Papier: Knistern (Blatt ziehen), Rollen (weiches Reiben), Falten (Pappe), Lecken (feuchtes Schnalzen)
  await mk('kfPapier', .7, (oc, out) => { const n = noise(oc, .7), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(2600, 0); bp.frequency.linearRampToValueAtTime(5200, .5); bp.Q.value = 1.2;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.2, .05); g.gain.linearRampToValueAtTime(.12, .45); g.gain.exponentialRampToValueAtTime(.001, .68); n.connect(bp); bp.connect(g); g.connect(out); n.start();
    for (let i = 0; i < 26; i++) burst(oc, out, R(.02, .6), R(3000, 8000), 3, R(.04, .2), R(.004, .012), 'highpass'); });
  await mk('kfRoll', 1.2, (oc, out) => { const n = noise(oc, 1.2, .6), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = .7;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.3, .15); g.gain.setValueAtTime(.3, 1); g.gain.linearRampToValueAtTime(0, 1.2); n.connect(bp); bp.connect(g); g.connect(out); n.start();
    for (let i = 0; i < 18; i++) burst(oc, out, R(.05, 1.1), R(2500, 6000), 4, R(.02, .07), .01, 'highpass'); });
  await mk('kfFalt', .35, (oc, out) => { burst(oc, out, 0, 1300, 2, .5, .05); burst(oc, out, .02, 3200, 3, .25, .07); for (let i = 0; i < 6; i++) burst(oc, out, R(.03, .25), R(2000, 5000), 5, .08, .01); });
  await mk('kfLeck', .45, (oc, out) => { const n = noise(oc, .45, .3), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, 0); bp.frequency.linearRampToValueAtTime(2200, .35); bp.Q.value = 2.5;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.18, .08); g.gain.exponentialRampToValueAtTime(.001, .42); n.connect(bp); bp.connect(g); g.connect(out); n.start(); burst(oc, out, .36, 1800, 6, .25, .02); });
  // Sturmfeuerzeug: Deckel-Klack, Reibrad (Feuerstein), Flammen-Wusch, Brennen (Schleife)
  await mk('kfDeckelZ', .3, (oc, out) => { burst(oc, out, 0, 3100, 7, .7, .025); burst(oc, out, .003, 1400, 5, .4, .08); const o = oc.createOscillator(), g = oc.createGain(); o.frequency.value = 2380; g.gain.setValueAtTime(.08, 0); g.gain.exponentialRampToValueAtTime(.001, .25); o.connect(g); g.connect(out); o.start(); o.stop(.28); });
  await mk('kfRad', .32, (oc, out) => { for (let t = 0; t < .16; t += R(.003, .008)) burst(oc, out, t, R(4000, 9000), 4, R(.1, .3), .006, 'highpass'); burst(oc, out, .16, 5500, 2, .35, .05, 'highpass'); });
  await mk('kfWusch', .8, (oc, out) => { const n = noise(oc, .8, .5), lp = oc.createBiquadFilter(), g = oc.createGain(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3000, 0); lp.frequency.exponentialRampToValueAtTime(500, .6);
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.45, .03); g.gain.exponentialRampToValueAtTime(.02, .7); n.connect(lp); lp.connect(g); g.connect(out); n.start(); });
  await mk('kfFlamme', 2, (oc, out) => { const n = noise(oc, 2, .8), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'lowpass'; bp.frequency.value = 700; g.gain.value = .22; n.connect(bp); bp.connect(g); g.connect(out); n.start(); });
  // Glut: kleine Knistern (beim Zug dichter), Einatmen am Joint, Ausatmen, Husten
  await mk('kfGlut', 1.4, (oc, out) => { for (let t = 0; t < 1.35; t += R(.02, .09)) burst(oc, out, t, R(2500, 7000), 3, R(.04, .22), R(.003, .01), 'highpass');
    const n = noise(oc, 1.4, .7), lp = oc.createBiquadFilter(), g = oc.createGain(); lp.type = 'lowpass'; lp.frequency.value = 900; g.gain.value = .05; n.connect(lp); lp.connect(g); g.connect(out); n.start(); });
  await mk('kfEin', 1.8, (oc, out) => { const n = noise(oc, 1.8, .2), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1700; bp.Q.value = .8;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.12, .3); g.gain.linearRampToValueAtTime(.16, 1.5); g.gain.linearRampToValueAtTime(0, 1.8); n.connect(bp); bp.connect(g); g.connect(out); n.start(); });
  await mk('kfAus', 2.8, (oc, out) => { const n = noise(oc, 2.8, .4), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(900, 0); bp.frequency.linearRampToValueAtTime(600, 2.6); bp.Q.value = .6;
    g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.3, .25); g.gain.linearRampToValueAtTime(.18, 1.4); g.gain.linearRampToValueAtTime(0, 2.7); n.connect(bp); bp.connect(g); g.connect(out); n.start(); });
  await mk('kfHusten', 1.3, (oc, out) => { [0, .32, .58].forEach((t0, i) => { const n = noise(oc, .3, .1), bp = oc.createBiquadFilter(), bp2 = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = R(500, 700); bp.Q.value = 3; bp2.type = 'bandpass'; bp2.frequency.value = R(1400, 1900); bp2.Q.value = 4;
    const a = [.9, .7, .45][i]; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(a, t0 + .012); g.gain.exponentialRampToValueAtTime(.001, t0 + .26); n.connect(bp); n.connect(bp2); bp.connect(g); bp2.connect(g); g.connect(out); n.start(t0);
    const o = oc.createOscillator(), og = oc.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(R(120, 150), t0); o.frequency.exponentialRampToValueAtTime(80, t0 + .2); og.gain.setValueAtTime(.12 * a, t0); og.gain.exponentialRampToValueAtTime(.001, t0 + .2); const lp = oc.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; o.connect(lp); lp.connect(og); og.connect(out); o.start(t0); o.stop(t0 + .25); }); });
  // Flashback: Tinnitus (hoher Ton mit Schwebung) und harter Schnitt (Klick + tiefer Stoß)
  await mk('kfTinnitus', 3, (oc, out) => { for (const f of [4150, 4163]) { const o = oc.createOscillator(), g = oc.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, 0); g.gain.linearRampToValueAtTime(.05, .4); g.gain.setValueAtTime(.05, 2.4); g.gain.linearRampToValueAtTime(0, 3); o.connect(g); g.connect(out); o.start(); o.stop(3); } });
  await mk('kfSchnitt', .5, (oc, out) => { burst(oc, out, 0, 2000, .6, .5, .03); const o = oc.createOscillator(), g = oc.createGain(); o.frequency.setValueAtTime(90, 0); o.frequency.exponentialRampToValueAtTime(38, .35); g.gain.setValueAtTime(.8, 0); g.gain.exponentialRampToValueAtTime(.001, .45); o.connect(g); g.connect(out); o.start(); o.stop(.5); });
  await mk('kfAtemFlash', 3.2, (oc, out) => { for (let i = 0; i < 4; i++) { const t0 = i * .8, n = noise(oc, .7, .3), bp = oc.createBiquadFilter(), g = oc.createGain(); bp.type = 'bandpass'; bp.frequency.value = i % 2 ? 900 : 1500; bp.Q.value = .7;
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(.2, t0 + .12); g.gain.exponentialRampToValueAtTime(.001, t0 + .6); n.connect(bp); bp.connect(g); g.connect(out); n.start(t0); } });
}

// ================================================================ Texturen (Canvas, beim Laden)
function kf_cnv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); return c; }
function kf_rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// Gebrauchsspuren über ein Poster: Knicke, Sonnenbleiche, Klebeband, Reißzwecken, Wasserflecken, eingerissene Ecken
function kf_patina(x, w, h, r, o = {}) {
  const g = x.createLinearGradient(0, 0, w * .3, h); g.addColorStop(0, `rgba(255,248,225,${o.bleich ?? .22})`); g.addColorStop(1, 'rgba(255,248,225,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  x.globalCompositeOperation = 'multiply'; for (let i = 0; i < 5; i++) { const cx = r() * w, cy = r() * h, rr = 30 + r() * w * .25, rg = x.createRadialGradient(cx, cy, rr * .2, cx, cy, rr); rg.addColorStop(0, 'rgba(160,130,90,.0)'); rg.addColorStop(.8, `rgba(150,120,80,${.12 + r() * .12})`); rg.addColorStop(1, 'rgba(150,120,80,0)'); x.fillStyle = rg; x.fillRect(0, 0, w, h); }
  x.globalCompositeOperation = 'source-over';
  for (const [a, b, c, d] of [[0, h * (.45 + r() * .1), w, h * (.45 + r() * .1)], [w * (.48 + r() * .06), 0, w * (.48 + r() * .06), h]]) { x.strokeStyle = 'rgba(255,255,255,.28)'; x.lineWidth = 2; x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(a, b + 2); x.lineTo(c, d + 2); x.stroke(); }
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${r() < .5 ? '0,0,0' : '255,250,235'},${r() * .08})`; x.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  if (o.band !== false) for (const [cx, cy, an] of [[w * .1, h * .04, -.5], [w * .9, h * .05, .45]]) { x.save(); x.translate(cx, cy); x.rotate(an); x.fillStyle = 'rgba(236,226,190,.55)'; x.fillRect(-w * .09, -h * .018, w * .18, h * .036); x.restore(); }
  if (o.zwecke) for (const [cx, cy] of [[w * .06, h * .03], [w * .94, h * .03], [w * .06, h * .97], [w * .94, h * .97]]) { x.fillStyle = 'rgba(40,40,40,.35)'; x.beginPath(); x.arc(cx + 2, cy + 3, 7, 0, 7); x.fill(); x.fillStyle = '#b8a060'; x.beginPath(); x.arc(cx, cy, 6, 0, 7); x.fill(); }
  // eingerissene Ecke (Alpha)
  x.globalCompositeOperation = 'destination-out'; x.beginPath(); const cw = w * (.06 + r() * .08); x.moveTo(w, h); x.lineTo(w - cw, h); for (let k = 0; k < 6; k++) x.lineTo(w - cw * (1 - k / 6) + (r() - .5) * 8, h - cw * k / 6 * .9); x.lineTo(w, h - cw); x.closePath(); x.fill(); x.globalCompositeOperation = 'source-over';
}
function kf_blatt(x, cx, cy, s, rot, farbe) { // Hanfblatt (7 Finger, gesägte Ränder) – als Grafik, keine Marke
  x.save(); x.translate(cx, cy); x.rotate(rot); x.fillStyle = farbe;
  const F = [[0, 1], [-.42, .86], [.42, .86], [-.8, .52], [.8, .52], [-1.05, .12], [1.05, .12]];
  for (const [a, l] of F) { x.save(); x.rotate(a); x.beginPath(); x.moveTo(0, 0); const L = s * l, W = s * .13 * (l + .3); for (let k = 0; k <= 10; k++) { const t = k / 10; x.lineTo(W * Math.sin(Math.PI * t) * (k % 2 ? 1.12 : .92), -L * t); }
    for (let k = 10; k >= 0; k--) { const t = k / 10; x.lineTo(-W * Math.sin(Math.PI * t) * (k % 2 ? 1.12 : .92), -L * t); } x.fill(); x.restore(); }
  x.fillRect(-s * .02, 0, s * .04, s * .35); x.restore(); }
const KF_POSTER = {
  // Reggae/Dub-Abend (erfunden): rot-gold-grüne Balken, Löwe als Scherenschnitt, Siebdruck-Anmutung
  dub: { w: .42, h: .6, px: [512, 732], draw: (x, w, h, r) => { x.fillStyle = '#1b1712'; x.fillRect(0, 0, w, h); ['#a8261c', '#d7a526', '#2d6b33'].forEach((c, i) => { x.fillStyle = c; x.fillRect(0, h * (.04 + i * .045), w, h * .04); x.fillRect(0, h * (.84 + i * .045), w, h * .035); });
      x.fillStyle = '#d9b24a'; x.beginPath(); x.arc(w / 2, h * .42, w * .26, 0, 7); x.fill(); x.fillStyle = '#1b1712'; x.beginPath(); x.ellipse(w / 2, h * .45, w * .15, w * .19, 0, 0, 7); x.fill(); for (let i = 0; i < 22; i++) { const a = i / 22 * 6.28; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * w * .16, h * .43 + Math.sin(a) * w * .2); x.lineTo(w / 2 + Math.cos(a + .14) * w * .25, h * .43 + Math.sin(a + .14) * w * .27); x.lineTo(w / 2 + Math.cos(a + .28) * w * .16, h * .43 + Math.sin(a + .28) * w * .2); x.fill(); }
      x.fillStyle = '#e9dcb4'; x.textAlign = 'center'; x.font = `bold ${w * .12}px Impact, Arial Black, sans-serif`; x.fillText('KELLERDUB', w / 2, h * .72); x.font = `${w * .055}px Georgia`; x.fillText('SOUNDSYSTEM · ALL NIGHT', w / 2, h * .775); x.font = `${w * .045}px Georgia`; x.fillText('Jugendzentrum Kreisstadt · Sa 14.05.', w / 2, h * .815); } },
  // Band-Poster (erfundene Band „Die Nebelkrähen“), Kopierer-Look
  band: { w: .44, h: .62, px: [512, 722], draw: (x, w, h, r) => { x.fillStyle = '#e8e4da'; x.fillRect(0, 0, w, h); for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(0,0,0,${r() * .12})`; x.fillRect(r() * w, r() * h, 2, 2); }
      x.fillStyle = '#111'; for (let i = 0; i < 9; i++) { const cx = w * (.15 + r() * .7), cy = h * (.18 + r() * .4); x.save(); x.translate(cx, cy); x.rotate(r() * .8 - .4); x.beginPath(); x.moveTo(-40, 0); x.quadraticCurveTo(-10, -22, 0, -4); x.quadraticCurveTo(10, -22, 40, 0); x.quadraticCurveTo(10, -8, 0, 6); x.quadraticCurveTo(-10, -8, -40, 0); x.fill(); x.restore(); }
      x.font = `bold ${w * .13}px "Courier New", monospace`; x.textAlign = 'center'; x.fillText('DIE', w / 2, h * .7); x.fillText('NEBELKRÄHEN', w / 2, h * .8); x.font = `${w * .045}px "Courier New", monospace`; x.fillText('LIVE · ALTE SCHMIEDE · 2016 · EINTRITT FREI', w / 2, h * .88); } },
  // Hanfblatt-Aufkleber (rund), verblasst und zerkratzt
  hanf: { w: .09, h: .09, px: [256, 256], rund: true, draw: (x, w, h, r) => { x.fillStyle = '#e9e0c4'; x.beginPath(); x.arc(w / 2, h / 2, w * .48, 0, 7); x.fill(); x.fillStyle = '#2f6a2c'; x.beginPath(); x.arc(w / 2, h / 2, w * .43, 0, 7); x.fill();
      kf_blatt(x, w / 2, h * .66, w * .3, 0, '#e7dcb2'); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(255,255,255,${r() * .4})`; x.lineWidth = 1; x.beginPath(); const a = r() * w, b = r() * h; x.moveTo(a, b); x.lineTo(a + r() * 60 - 30, b + r() * 20 - 10); x.stroke(); } } },
  // Rot-gold-grüner Streifen-Aufkleber mit Schrift
  reggae: { w: .14, h: .05, px: [420, 150], draw: (x, w, h, r) => { ['#9d2a1f', '#d6a62b', '#2e6a36'].forEach((c, i) => { x.fillStyle = c; x.fillRect(0, i * h / 3, w, h / 3 + 1); }); x.fillStyle = '#f2e8cc'; x.font = `bold ${h * .38}px Georgia`; x.textAlign = 'center'; x.fillText('ONE LOVE, ABGRUND', w / 2, h * .63); } },
  // Aushang Tankstelle: Rauchwaren-Preise
  tanke: { w: .3, h: .42, px: [420, 588], draw: (x, w, h, r) => { x.fillStyle = '#f1ebd8'; x.fillRect(0, 0, w, h); x.fillStyle = '#8a1c14'; x.fillRect(0, 0, w, h * .14); x.fillStyle = '#fff'; x.font = `bold ${w * .1}px Arial`; x.textAlign = 'center'; x.fillText('RAUCHWAREN', w / 2, h * .1);
      x.fillStyle = '#222'; x.textAlign = 'left'; x.font = `${w * .062}px Arial`; [['Zigaretten', '5,20 €'], ['Tabak 40 g', '4,90 €'], ['Blättchen', '0,90 €'], ['Filtertips', '0,60 €'], ['Feuerzeug', '1,00 €']].forEach(([a, b], i) => { x.fillText(a, w * .08, h * (.26 + i * .1)); x.textAlign = 'right'; x.fillText(b, w * .92, h * (.26 + i * .1)); x.textAlign = 'left'; });
      x.font = `italic ${w * .05}px Georgia`; x.fillStyle = '#5a1510'; x.fillText('Abgabe nur ab 18. Ausweis!', w * .08, h * .82); x.strokeStyle = 'rgba(20,30,110,.8)'; x.lineWidth = 3; x.beginPath(); x.moveTo(w * .1, h * .9); x.bezierCurveTo(w * .3, h * .86, w * .5, h * .95, w * .8, h * .88); x.stroke();
      x.fillStyle = 'rgba(20,30,110,.85)'; x.font = `${w * .07}px Caveat, cursive`; x.fillText('– M.', w * .72, h * .95); } } };
const KF_POSTER_TEX = {};
function kf_posterTex(art) { if (KF_POSTER_TEX[art]) return KF_POSTER_TEX[art]; const P = KF_POSTER[art]; const r = kf_rnd(art.length * 7919 + 13);
  const c = kf_cnv(P.px[0], P.px[1], (x, w, h) => { P.draw(x, w, h, r); if (P.rund) { x.globalCompositeOperation = 'destination-in'; x.beginPath(); x.arc(w / 2, h / 2, w * .48, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; } else kf_patina(x, w, h, r, { zwecke: art === 'band', band: art !== 'band' }); });
  const t = tex(c, true); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return KF_POSTER_TEX[art] = t; }
// Decal an eine Wand: flache Fläche mit leichtem Versatz, Gebrauchsspuren im Bild
function kiffen_poster(art, x, y, z, ry, o = {}) { const P = KF_POSTER[art]; if (!P) return null;
  const m = new THREE.MeshStandardMaterial({ map: kf_posterTex(art), transparent: true, alphaTest: .08, roughness: o.rough ?? .82, metalness: 0, polygonOffset: true, polygonOffsetFactor: -4, depthWrite: false, side: THREE.FrontSide });
  const s = o.s || 1, me = new THREE.Mesh(new THREE.PlaneGeometry(P.w * s, P.h * s), m); me.position.set(x, y, z); me.rotation.set(o.rx || 0, ry, o.rz ?? (Math.random() - .5) * .06); me.receiveShadow = true; me.userData.noCol = true; scene.add(me); return me; }
// Rauch, Glut, Flamme, Krümel, Papier
function kf_texRauch() { return tex(kf_cnv(128, 128, (x, w) => { for (let i = 0; i < 14; i++) { const cx = w * (.3 + Math.random() * .4), cy = w * (.3 + Math.random() * .4), r = w * (.12 + Math.random() * .2), g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); } }), true); }
function kf_texGlow(c0, c1) { return tex(kf_cnv(64, 64, (x, w) => { const g = x.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, c0); g.addColorStop(.25, c1); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, w); }), true); }
function kf_texFlamme() { return tex(kf_cnv(64, 128, (x, w, h) => { const g = x.createRadialGradient(w / 2, h * .72, 1, w / 2, h * .6, h * .5); g.addColorStop(0, 'rgba(160,190,255,1)'); g.addColorStop(.12, 'rgba(255,240,200,1)'); g.addColorStop(.4, 'rgba(255,170,60,.85)'); g.addColorStop(1, 'rgba(255,90,10,0)');
  x.fillStyle = g; x.beginPath(); x.moveTo(w / 2, h * .04); x.bezierCurveTo(w * .95, h * .5, w * .8, h * .95, w / 2, h * .95); x.bezierCurveTo(w * .2, h * .95, w * .05, h * .5, w / 2, h * .04); x.fill(); }), true); }
function kf_texKruemel() { return tex(kf_cnv(64, 64, (x, w) => { x.clearRect(0, 0, w, w); for (let i = 0; i < 5; i++) { x.fillStyle = ['#5d6b2e', '#7c8a3a', '#4a5526', '#8c7a44', '#6f7d34'][i]; x.beginPath(); const cx = w / 2 + (Math.random() - .5) * w * .3, cy = w / 2 + (Math.random() - .5) * w * .3; for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28, rr = w * (.12 + Math.random() * .2); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.fill(); } }), true); }
function kf_texEinsatz() { return tex(kf_cnv(256, 256, (x, w) => { x.fillStyle = '#1e1d1c'; x.beginPath(); x.arc(w / 2, w / 2, w / 2, 0, 7); x.fill(); // Zähne im Kreis, dazwischen gemahlene Blüte
  for (let i = 0; i < 1400; i++) { const a = Math.random() * 6.28, rr = Math.sqrt(Math.random()) * w * .46; x.fillStyle = ['#56632a', '#6d7a33', '#43502a', '#8a7b48', '#5e6b2c', '#9aa45a'][i % 6]; x.fillRect(w / 2 + Math.cos(a) * rr, w / 2 + Math.sin(a) * rr, 2 + Math.random() * 4, 2 + Math.random() * 3); }
  for (const rr of [.16, .27, .38]) for (let i = 0; i < Math.round(rr * 60); i++) { const a = i / Math.round(rr * 60) * 6.28; x.save(); x.translate(w / 2 + Math.cos(a) * rr * w, w / 2 + Math.sin(a) * rr * w); x.rotate(a); const g = x.createLinearGradient(-5, 0, 5, 0); g.addColorStop(0, '#2a2927'); g.addColorStop(.5, '#9a9a96'); g.addColorStop(1, '#2a2927'); x.fillStyle = g; x.beginPath(); x.moveTo(-5, 5); x.lineTo(0, -6); x.lineTo(5, 5); x.fill(); x.restore(); }
  x.strokeStyle = '#6f6e6a'; x.lineWidth = 5; x.beginPath(); x.arc(w / 2, w / 2, w * .48, 0, 7); x.stroke(); }), true); }
function kf_texPappe() { return tex(kf_cnv(256, 64, (x, w, h) => { x.fillStyle = '#b89a6c'; x.fillRect(0, 0, w, h); for (let i = 0; i < 1500; i++) { x.fillStyle = `rgba(${Math.random() < .5 ? '90,60,30' : '230,210,170'},${Math.random() * .25})`; x.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 1); }
  x.fillStyle = 'rgba(120,30,20,.85)'; x.fillRect(0, 0, w, h * .18); x.fillStyle = 'rgba(40,30,20,.5)'; x.font = `bold ${h * .32}px Arial`; x.fillText('SICHERHEITSZÜNDHÖLZER', 6, h * .72); x.fillStyle = 'rgba(60,40,25,.6)'; x.fillRect(w * .82, h * .3, w * .14, h * .5); }), true); }

// ================================================================ Bühne in der Welt: Sitzplatz, Hände-Rig, Requisiten
// Alles hängt an kf_R.seat (Welt-Gruppe am Sitzplatz, Achsen wie die Kamera: x rechts, y oben, −z vorn); Ursprung = Lukes Augenpunkt im Sitzen.
const KF_SITZ = { x: -27.2, y: 0, z: -10.95, yaw: Math.PI, auge: 1.18 }; // Verandakante Nr. 3 (Blick auf die Straße); y wird beim Laden gemessen
const kf_R = { seat: null, rig: null, mesh: null, B: { L: null, R: null }, len: .148, props: {}, ready: false };
const KF_FING = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
function kf_rigBau(src) {
  const R = kf_R; R.rig = src; src.traverse(o => { if (o.isSkinnedMesh) { R.mesh = o; o.frustumCulled = false; o.castShadow = true; o.receiveShadow = true;
    const m = o.material; m.roughness = 1; m.envMapIntensity = .55; if (m.normalMap) m.normalScale.set(1.1, 1.1); } });
  for (const s of ['L', 'R']) { const B = { fore: null, hand: null, f: [], bindF: [], bindH: new THREE.Quaternion(), off: new THREE.Vector3(), s: s === 'R' ? 1 : -1 };
    src.traverse(o => { if (!o.isBone) return; if (o.name === s + '_ForeArm') B.fore = o; if (o.name === s + '_Hand') B.hand = o; });
    B.bindH.copy(B.hand.quaternion); B.off.copy(B.hand.position); R.len = B.off.length();
    for (const f of KF_FING) { const chain = [], bind = []; for (let i = 1; i <= 3; i++) { let b = null; src.traverse(o => { if (o.isBone && o.name === s + '_Hand' + f + i) b = o; }); chain.push(b); bind.push(b ? b.quaternion.clone() : null); } B.f.push(chain); B.bindF.push(bind); }
    R.B[s] = B; }
  // Händedruck: Hände leicht wärmer (Durchblutung), Ärmel dunkler (Lukes Jacke)
  R.seat.add(src); R.ready = true;
}
// Hand-Pose: w Handgelenk (Sitzraum), f Fingerrichtung, n Handflächen-Normale, c Beugung [Daumen, Zeige, Mittel, Ring, Klein] 0…1, s Spreizung, t Daumen-Opposition
function KP(w, f, n, c = [.3, .3, .35, .4, .45], s = .15, t = .3) { return { w, f, n, c, s, t }; }
const KF_ELL = { L: [-.24, -.66, .02], R: [.24, -.66, .02] }; // Ellbogen (etwa neben der Hüfte) – der Unterarm zeigt vom Ellbogen zum Handgelenk
const kf_P = { L: { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3(), c: [0, 0, 0, 0, 0], s: 0, t: 0 }, R: { w: new THREE.Vector3(), f: new THREE.Vector3(), n: new THREE.Vector3(), c: [0, 0, 0, 0, 0], s: 0, t: 0 } };
const kf_HQ = { L: new THREE.Quaternion(), R: new THREE.Quaternion() }; // Weltlage der Handknochen (Sitzraum), für angehängte Requisiten
function kf_mixPose(o, a, b, k) { o.w.set(kf_lerp(a.w[0], b.w[0], k), kf_lerp(a.w[1], b.w[1], k), kf_lerp(a.w[2], b.w[2], k)); o.f.set(kf_lerp(a.f[0], b.f[0], k), kf_lerp(a.f[1], b.f[1], k), kf_lerp(a.f[2], b.f[2], k)).normalize();
  o.n.set(kf_lerp(a.n[0], b.n[0], k), kf_lerp(a.n[1], b.n[1], k), kf_lerp(a.n[2], b.n[2], k)).normalize(); for (let i = 0; i < 5; i++) o.c[i] = kf_lerp(a.c[i], b.c[i], k); o.s = kf_lerp(a.s, b.s, k); o.t = kf_lerp(a.t, b.t, k); }
// Pose auf die Knochen: Handlage aus (f, n), Unterarm vom Ellbogen zum Handgelenk (Schwung ohne Verdrehung), Finger um die lokale x-Achse gebeugt
function kf_applyHand(side, P) {
  const B = kf_R.B[side]; if (!B) return; const V = KF_V, Y = V.v0.copy(P.f), Z = V.v1.copy(P.n).addScaledVector(Y, -Y.dot(P.n)).normalize(), X = V.v2.crossVectors(Y, Z).normalize();
  const Qh = kf_HQ[side].setFromRotationMatrix(V.m0.makeBasis(X, Y, Z));
  const E = KF_ELL[side], dir = V.v3.set(P.w.x - E[0], P.w.y - E[1], P.w.z - E[2]).normalize();
  const Qf = V.q1.setFromUnitVectors(Y, dir).multiply(Qh); // Unterarm: Hand um den Knick ins Handgelenk gedreht
  // Handgelenk-Knick begrenzen (Anatomie): höchstens ~55° zwischen Unterarm und Hand
  const ang = Y.angleTo(dir); if (ang > .95) { V.q2.setFromUnitVectors(Y, dir); V.q3.identity().slerp(V.q2, .95 / ang); Qf.copy(V.q3).multiply(Qh); }
  B.fore.quaternion.copy(Qf); B.fore.position.copy(P.w).sub(V.v4.copy(B.off).applyQuaternion(Qf));
  B.hand.quaternion.copy(Qf).invert().multiply(Qh);
  const sg = B.s; for (let fi = 0; fi < 5; fi++) { const ch = B.f[fi], bd = B.bindF[fi], c = P.c[fi]; if (!ch[0]) continue;
    if (fi === 0) { // Daumen: Opposition am Grundgelenk, Beugung an Glied 2/3
      ch[0].quaternion.copy(bd[0]).multiply(V.q0.setFromEuler(V.e0.set(c * .35 + P.t * .3, -sg * P.t * .55, sg * P.t * .35)));
      ch[1].quaternion.copy(bd[1]).multiply(V.q0.setFromEuler(V.e0.set(c * .75, 0, 0))); ch[2].quaternion.copy(bd[2]).multiply(V.q0.setFromEuler(V.e0.set(c * 1.0, 0, 0))); continue; }
    const spr = (fi === 1 ? -1.1 : fi === 2 ? 0 : fi === 3 ? .7 : 1.4) * P.s * .16 * sg;
    ch[0].quaternion.copy(bd[0]).multiply(V.q0.setFromEuler(V.e0.set(c * 1.35, 0, spr))); ch[1].quaternion.copy(bd[1]).multiply(V.q0.setFromEuler(V.e0.set(c * 1.62, 0, 0)));
    ch[2].quaternion.copy(bd[2]).multiply(V.q0.setFromEuler(V.e0.set(c * 1.1, 0, 0))); }
}
