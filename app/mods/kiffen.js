// =====================================================================  KIFFEN (Modul „kiffen“, Zusatzwunsch X-6): Kiffer-Welt, Aufgabe „Fünf Minuten“ und die Joint-Szene auf Vegas' Veranda
// Nutzerwunsch (F3_extras.md X-6): Utensilien in der Welt (Pflanzen, Bong, Papes, Feuerzeuge, Poster, Sticker) mit Lukes trockenen Kommentaren; nach belastenden
// Flashbacks sammelt Luke Grinder, Knolle, Papes und Tips und dreht sich auf Vegas' Veranda einen Joint – jeder Handgriff vom Spieler ausgelöst.
// Kanon: Anfang Kapitel 4 (Morgen nach der Nacht von Kap. 1–3). Nur Erwachsene (Luke 26, Mike 27, Roxy 25, Vegas). Kein Werturteil, kein Spielvorteil außer
// kurzer Ruhe (Angst/Herzschlag der Regie auf 0). Luke nie von vorn: die Kamera zeigt nur seine Hände. Whiskey macht nur nach (Husten), wach kein Satz.
// Modelle (CC-BY, CREDITS.md; aufbereitet mit tools/_x6_assets.mjs): assets/ms/haende (Detective Hands, Tony Flanagan: nur Unterarme/Hände, Skelett ab Unterarm),
//   assets/ms/kiffen/{grinder (in Deckel/Körper geschnitten), knolle, papes (Aufdruck neutral), joints, ascher, bong, tuetchen, pflanze, papier}; Peters Feuerzeug = w_lighter.
// Selbst gezeichnet (erlaubt: Decals/Partikel/Papier): Poster und Sticker (Canvas), das Blättchen beim Drehen und der Pappstreifen (verformbare Papierflächen wie im Album),
//   Krümel, Glut, Rauch, Asche, Flamme (Sprites/Punkte). Licht: EIN VLight für die Feuerzeugflamme, beim Laden mit Intensität 0 – zur Laufzeit wird kein Licht angelegt.
// Bewegung (Q-11): Hände über Griffpunkte (KG: Handgelenk aus Griffpunkt + Handlage, Unterarm vom Ellbogen), Finger je Gelenk gebeugt, darüber eine Feder-Schicht
//   (kritisch gedämpft, leichtes Nachschwingen, Finger mit versetzten Frequenzen) und lebendige Fingerbewegung; Rauchen (heben, Zug, senken, halten, abklopfen) nach
//   echter Bewegungsaufnahme (Mocap „Smoking 01“, Klian, CC-BY; tools/_x6_mocap.mjs → assets/ms/haende/rauchen.json), der Joint klemmt zwischen Zeige- und Mittelfinger.
//   Zittern nach den Flashbacks klingt mit jedem Zug ab. Krümel/Asche fallen mit Schwerkraft, Rauch verwirbelt, Glut glimmt beim Zug auf, die Flamme beleuchtet die Hände.
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
  grinder: { ort: 'Nr. 4, dein altes Zimmer', ortRueck: 'Nr. 4, unter der losen Stufe', item: 'kf_grinder', modell: 'grinder',
    text: '2016. Oma hat die Schublade nie aufgemacht. Oder doch, und nichts gesagt.', textRueck: 'Die lose Stufe vor Omas Tür. Mein Versteck von 2016. Oma hat es nie gefunden. Glaub ich.' },
  papes: { ort: 'Nr. 4, hinter dem Poster', ortRueck: 'Nr. 4, unter der losen Stufe', item: 'kf_papes', modell: 'papes',
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
function kf_hat(id) { return !!story.items && story.items.includes(id); } // story.items entsteht erst nach der Modul-Marke
function kf_ton(n, o = {}) { try { if (Audio.ctx && Audio.buf[n]) return Audio.play(n, { gain: o.gain ?? .6, rate: o.rate ?? (1 + (Math.random() - .5) * .06), delay: o.delay || 0, dest: o.x !== undefined ? undefined : Audio.master, x: o.x, y: o.y, z: o.z, ref: o.ref, lp: o.lp, hp: o.hp, dur: o.dur, offset: o.offset }); } catch (e) {} return null; }

// ================================================================ Gegenstände (Jacke = story.items: Story-Dinge zählen nie gegen den Beutel)
function kf_itemsEintragen() { for (const [k, v] of Object.entries(KF_ITEMS)) { ITEMS[k] = v; ICONS[k] = KF_ICONS[k]; } } // ITEMS/ICONS entstehen erst nach der Modul-Marke → im ersten Bild eintragen
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
const KF_SITZ = { x: -27.5, y: 0, z: -10.95, yaw: Math.PI, auge: .8 }; // Verandakante Nr. 3 (Blick auf die Straße); Sitzhöhe wird gemessen, Auge .8 m darüber
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

// ---------------------------------------------------------------- Blättchen: verformbare Papierfläche (Knick → Mulde → Rolle → Kleberand → gedrehte Spitze → Abbrand)
// Länge entlang lokal x (u 0 = Tip-Ende, 1 = Spitze), Breite v (0 = vordere Kante, 1 = Kleberand). Zustand kf_PA: mulde 0…1, rolle 0…1.15, spitze 0…1, brand 0…1, kegel 0…1
const KF_PAP = { L: .105, W: .044, NU: 30, NV: 11 };
const kf_PA = { mulde: 0, rolle: 0, spitze: 0, brand: 0, kegel: 0, nass: 0, wellen: 1 };
function kf_papK() { const A = kf_PA; return Math.max(A.mulde * .5, A.rolle * 1.02); } // 0 flach · .5 Rinne · ≥ 1 Rohr
function kf_papPunkt(u, v, o) { // Mittelachse bei y = 0; Querschnitt in (y, z); z zeigt aus der Rinne heraus (oben)
  const A = kf_PA, W = KF_PAP.W, x = (u - .5) * KF_PAP.L, k = kf_papK(); const kegel = 1 - .22 * A.kegel * (1 - u);
  const s = (v - .32) * W; let y, z;
  if (k < .004) { y = s; z = 0; } else { const kap = 2 * Math.PI * k / W / kegel, a = kap * s; const sp = 1 - .07 * Math.max(0, a - Math.PI * 1.6) / Math.PI; // Überlappung: spiralig nach innen
    y = Math.sin(a) / kap * sp; z = (1 - Math.cos(a)) / kap * sp; }
  z += Math.sin(u * 9 + v * 4) * .0005 * A.wellen; // Papier ist nie ganz glatt
  // gedrehte Spitze: die letzten 12 % laufen zur Achse zusammen und verdrehen sich
  const tw = A.spitze * kf_clamp((u - .88) / .12); if (tw > 0) { const cz = k > .6 ? W / (2 * Math.PI * Math.max(.5, k)) * kegel : 0; const ry = y, rz = z - cz, a = tw * 2.6, sq = 1 - .82 * tw;
    y = (ry * Math.cos(a) - rz * Math.sin(a)) * sq; z = cz + (ry * Math.sin(a) + rz * Math.cos(a)) * sq; }
  return o.set(x, y, z); }
function kf_papAchse(u, o) { const A = kf_PA, W = KF_PAP.W, k = kf_papK(), kegel = 1 - .22 * A.kegel * (1 - u); const x = (u - .5) * KF_PAP.L;
  if (k < .004) return o.set(x, (.5 - .32) * W * .6, .0015); const kap = 2 * Math.PI * k / W / kegel; if (k >= .55) return o.set(x, 0, 1 / kap); return o.set(x, 0, Math.min(1 / kap, .02) * .45 + .002); }
function kf_papBau(tex, nrm) {
  const NU = KF_PAP.NU, NV = KF_PAP.NV, n = (NU + 1) * (NV + 1), g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3).fill(1), idx = [];
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const k = j * (NU + 1) + i; uv[k * 2] = i / NU; uv[k * 2 + 1] = j / NV; }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setIndex(idx);
  const m = new THREE.MeshStandardMaterial({ map: tex, normalMap: nrm, color: 0xf6f1e6, roughness: .84, metalness: 0, side: THREE.DoubleSide, vertexColors: true, transparent: true, opacity: .96 });
  m.normalScale.set(.3, .3); const me = new THREE.Mesh(g, m); me.castShadow = true; me.receiveShadow = true; me.frustumCulled = false; return me; }
function kf_papUpdate(me) { const g = me.geometry, P = g.attributes.position.array, N = g.attributes.normal.array, C = g.attributes.color.array, NU = KF_PAP.NU, NV = KF_PAP.NV, V = KF_V, e = .003, A = kf_PA;
  const bu = 1 - A.brand * .72; // Abbrand: alles jenseits der Brandkante sammelt sich an ihr
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const k = j * (NU + 1) + i, u = i / NU, v = j / NV, ub = Math.min(u, bu);
    kf_papPunkt(ub, v, V.v0); kf_papPunkt(Math.min(1, ub + e), v, V.v1).sub(V.v0); if (ub + e > 1) V.v1.negate(); kf_papPunkt(ub, Math.min(1, v + e), V.v2).sub(V.v0); if (v + e > 1) V.v2.negate();
    V.v3.crossVectors(V.v1, V.v2); const l = V.v3.length() || 1;
    P[k * 3] = V.v0.x; P[k * 3 + 1] = V.v0.y; P[k * 3 + 2] = V.v0.z; N[k * 3] = V.v3.x / l; N[k * 3 + 1] = V.v3.y / l; N[k * 3 + 2] = V.v3.z / l;
    let r = 1, gg = 1, b = 1; if (A.brand > 0) { const d = (bu - u) / .03; if (d < 1) { const c = kf_clamp(d); r = .12 + .88 * c; gg = .1 + .9 * c; b = .09 + .91 * c; if (u >= bu - .004) { r = .5; gg = .49; b = .47; } } }
    if (v > .86 && A.nass > 0) { const w = A.nass * .25; r *= 1 - w; gg *= 1 - w; b *= 1 - w * 1.2; } C[k * 3] = r; C[k * 3 + 1] = gg; C[k * 3 + 2] = b; }
  g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; g.attributes.color.needsUpdate = true; }
// ---------------------------------------------------------------- Tip: Pappstreifen (Zickzack gefaltet, dann gerollt). u entlang des Streifens (wird Querschnitt), v = Höhe (wird Achse)
const KF_TIP = { L: .05, H: .016, NU: 40 }, kf_TA = { falt: 0, roll: 0 };
const kf_tipQ = new Float32Array((KF_TIP.NU + 1) * 2);
function kf_tipBau(tex) { const NU = KF_TIP.NU, n = (NU + 1) * 2, g = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), nor = new Float32Array(n * 3), idx = [];
  for (let j = 0; j <= 1; j++) for (let i = 0; i <= NU; i++) { const k = j * (NU + 1) + i; uv[k * 2] = i / NU; uv[k * 2 + 1] = j; }
  for (let i = 0; i < NU; i++) { const a = i, b = i + 1, c = i + NU + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setIndex(idx);
  const me = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: .95, side: THREE.DoubleSide })); me.castShadow = true; me.frustumCulled = false; return me; }
function kf_tipUpdate(me) { const NU = KF_TIP.NU, L = KF_TIP.L, ds = L / NU, A = kf_TA; let x = 0, y = 0, th = 0; kf_tipQ[0] = 0; kf_tipQ[1] = 0; const nz = Math.round(NU * .36);
  for (let i = 1; i <= NU; i++) { let dth = 0;
    if (i < nz) { if (i % 4 === 0) dth = ((i / 4) % 2 ? 1 : -1) * 2.7 * A.falt; } // Zickzack: scharfe Knicke alle 4 Stücke
    else dth = A.roll * ds / .0036; // Rolle um den Zickzack (Radius ~3,6 mm)
    th += dth; x += Math.cos(th) * ds; y += Math.sin(th) * ds; kf_tipQ[i * 2] = x; kf_tipQ[i * 2 + 1] = y; }
  const cx = kf_tipQ[(nz >> 1) * 2], cy = kf_tipQ[(nz >> 1) * 2 + 1] + .0022 * A.roll; const g = me.geometry, P = g.attributes.position.array, N = g.attributes.normal.array;
  for (let j = 0; j <= 1; j++) for (let i = 0; i <= NU; i++) { const k = j * (NU + 1) + i; P[k * 3] = (j - .5) * KF_TIP.H; P[k * 3 + 1] = kf_tipQ[i * 2 + 1] - cy; P[k * 3 + 2] = kf_tipQ[i * 2] - cx;
    const i0 = Math.max(0, i - 1), i1 = Math.min(NU, i + 1), tx = kf_tipQ[i1 * 2] - kf_tipQ[i0 * 2], ty = kf_tipQ[i1 * 2 + 1] - kf_tipQ[i0 * 2 + 1], l = Math.hypot(tx, ty) || 1; N[k * 3] = 0; N[k * 3 + 1] = tx / l; N[k * 3 + 2] = -ty / l; }
  g.attributes.position.needsUpdate = true; g.attributes.normal.needsUpdate = true; }
// ---------------------------------------------------------------- Teilchen: Krümel (Punkte), Rauch (Sprites), Glut, Flamme, Funken
const KF_KR = 170, KF_RAUCH = 48;
const kf_T = { kr: [], rauch: [], glut: null, flamme: null, funken: null, fk: [], krN: 0 };
function kf_teilchenBau() { const T = kf_T;
  const g = new THREE.BufferGeometry(), p = new Float32Array(KF_KR * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setDrawRange(0, KF_KR);
  T.krP = new THREE.Points(g, new THREE.PointsMaterial({ map: kf_texKruemel(), size: .0042, sizeAttenuation: true, transparent: true, alphaTest: .3, depthWrite: true, color: 0xc4c6b0 })); T.krP.frustumCulled = false; T.krP.visible = false; kf_R.seat.add(T.krP);
  for (let i = 0; i < KF_KR; i++) T.kr.push({ st: 0, u: Math.random(), v: Math.random(), h: Math.random(), x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, t: 0 });
  const rt = kf_texRauch(); for (let i = 0; i < KF_RAUCH; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: rt, color: 0xdcdcd6, transparent: true, opacity: 0, depthWrite: false })); s.visible = false; s.frustumCulled = false; kf_R.seat.add(s);
    T.rauch.push({ s, a: 0, l: 1, v: new THREE.Vector3(), sz: .02, gr: .1, op: .3, rot: 0, vr: 0 }); }
  T.glut = new THREE.Sprite(new THREE.SpriteMaterial({ map: kf_texGlow('rgba(255,240,200,1)', 'rgba(255,100,25,.85)'), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); T.glut.scale.setScalar(.014); T.glut.visible = false; kf_R.seat.add(T.glut);
  T.flamme = new THREE.Sprite(new THREE.SpriteMaterial({ map: kf_texFlamme(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); T.flamme.center.set(.5, .05); T.flamme.scale.set(.011, .026, 1); T.flamme.visible = false; kf_R.seat.add(T.flamme);
  const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(24 * 3), 3)); T.funken = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xffc070, size: .0024, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); T.funken.frustumCulled = false; T.funken.visible = false; kf_R.seat.add(T.funken);
  for (let i = 0; i < 24; i++) T.fk.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, a: 9 });
  const ag = new THREE.BufferGeometry(); ag.setAttribute('position', new THREE.BufferAttribute(new Float32Array(10 * 3), 3)); T.asche = new THREE.Points(ag, new THREE.PointsMaterial({ color: 0x8a8884, size: .0028, transparent: true, opacity: 0, depthWrite: false })); T.asche.frustumCulled = false; T.asche.visible = false; kf_R.seat.add(T.asche);
  T.as = Array.from({ length: 10 }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }));
}
function kf_rauchStoss(p, n, vx, vy, vz, sz, op, life = 2.6) { const T = kf_T; let k = 0; for (const r of T.rauch) { if (r.s.visible) continue; r.s.visible = true; r.a = 0; r.l = life * (.7 + Math.random() * .7); r.s.position.set(p.x + (Math.random() - .5) * .006, p.y, p.z + (Math.random() - .5) * .006);
    r.v.set(vx + (Math.random() - .5) * .07, vy + Math.random() * .03, vz + (Math.random() - .5) * .07); r.sz = sz * (.7 + Math.random() * .6); r.gr = sz * (3 + Math.random() * 3.5); r.op = op * (.6 + Math.random() * .5); r.rot = Math.random() * 6.28; r.vr = (Math.random() - .5) * .7; if (++k >= n) break; } }
function kf_teilchenTick(dt, t) { const T = kf_T; kf_ascheTick(dt);
  for (const r of T.rauch) { if (!r.s.visible) continue; r.a += dt; const k = r.a / r.l; if (k >= 1) { r.s.visible = false; continue; }
    r.v.y += dt * .06; r.v.multiplyScalar(1 - dt * 1.1); r.s.position.x += (r.v.x + Math.sin(t * 1.7 + r.rot * 3) * .014 * k) * dt; r.s.position.y += r.v.y * dt; r.s.position.z += (r.v.z + Math.cos(t * 1.3 + r.rot * 2) * .012 * k) * dt;
    const sz = r.sz + r.gr * Math.sqrt(k); r.s.scale.set(sz, sz, 1); r.s.material.rotation = r.rot + r.vr * r.a; r.s.material.opacity = r.op * Math.min(1, k * 5) * (1 - k) * (1 - k); }
  if (T.funken.visible) { const P = T.funken.geometry.attributes.position.array; let alive = 0; for (let i = 0; i < 24; i++) { const f = T.fk[i]; f.a += dt; if (f.a > .3) { P[i * 3 + 1] = -99; continue; } alive++; f.vy -= dt * 2.5; f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt; P[i * 3] = f.x; P[i * 3 + 1] = f.y; P[i * 3 + 2] = f.z; }
    T.funken.geometry.attributes.position.needsUpdate = true; T.funken.material.opacity = alive ? .95 : 0; if (!alive) T.funken.visible = false; } }
function kf_funken(p) { const T = kf_T; T.funken.visible = true; for (const f of T.fk) { f.a = Math.random() * .08; f.x = p.x; f.y = p.y; f.z = p.z; f.vx = (Math.random() - .5) * .5; f.vy = Math.random() * .45 + .1; f.vz = (Math.random() - .5) * .5; } }

// ================================================================ Nachbearbeitung: weiche Welt + Nachbild-Blitze (ein Durchgang vor dem Filmkorn; ohne Einsatz abgeschaltet)
function kiffen_passBau() {
  const p = new ShaderPass({ uniforms: { tDiffuse: { value: null }, tFl: { value: null }, uW: { value: 0 }, uT: { value: 0 }, uFl: { value: 0 }, uCut: { value: 0 }, uZoom: { value: 0 }, uTint: { value: new THREE.Vector3(.8, .92, 1.15) }, uPx: { value: new THREE.Vector2(1 / 1600, 1 / 900) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse, tFl; uniform float uW, uT, uFl, uCut, uZoom; uniform vec3 uTint; uniform vec2 uPx; varying vec2 vUv;
      float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){ vec2 uv = vUv, d = uv - .5;
        uv += (vec2(sin(uv.y * 5. + uT * .7), cos(uv.x * 4. + uT * .55)) * .0014 + d * sin(uT * .45) * .004) * uW; // die Welt atmet ein wenig
        vec4 c = texture2D(tDiffuse, uv);
        if (uW > .001) { vec3 b = vec3(0.); float r = (3. + 6. * dot(d, d) * 4.) * uW;
          for (int i = 0; i < 6; i++) { float a = float(i) * 2.39996, rr = sqrt((float(i) + .5) / 6.) * r; b += texture2D(tDiffuse, uv + vec2(cos(a), sin(a)) * rr * uPx).rgb; } b /= 6.;
          vec3 s = mix(c.rgb, b, .4 * uW) + max(b - .45, 0.) * .55 * uW; // weich, Lichter blühen auf
          float l = dot(s, vec3(.2126, .7152, .0722)); s = mix(vec3(l), s, 1. + .3 * uW); // Farben satter
          s *= mix(vec3(1.), vec3(1.08, 1.0, .88), uW); float hl = smoothstep(.35, 1., l); s = mix(s, s * (1. - .12 * hl) + .06 * hl, uW); // wärmer, Lichter weicher (Schwarz bleibt schwarz)
          s *= 1. - uW * .22 * smoothstep(.35, .9, length(d * vec2(1.5, 1.))); // weiche Vignette
          c.rgb = s; }
        if (uFl > .001) { vec2 fu = .5 + (vUv - .5) * (1. - uZoom * .08); vec2 o = d * .014 * uFl;
          vec3 im = vec3(texture2D(tFl, fu + o).r, texture2D(tFl, fu).g, texture2D(tFl, fu - o).b); im = pow(im, vec3(1.15)) * uTint;
          float n = rnd(vUv * vec2(1920., 1080.) + fract(uT) * 91.); float scan = .92 + .08 * sin(vUv.y * 900. + uT * 40.);
          c.rgb = mix(c.rgb * .1, im * scan + (n - .5) * .16, uFl); }
        c.rgb *= 1. - uCut; gl_FragColor = c; }` });
  const i = composer.passes.indexOf(filmPass); if (i < 0) return null; composer.insertPass(p, i); p.enabled = false; return p; }
// Nachbilder (Leinwand, einmal beim Laden gezeichnet): Hilde im Strahl · Peter im Öl · das graue Gesicht im Tank
function kf_flashBilder() { const W = 1024, H = 576, R = kf_rnd(1975);
  const hilde = kf_cnv(W, H, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); const g = x.createLinearGradient(W / 2, 0, W / 2, H); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(210,225,255,.55)');
      x.fillStyle = g; x.beginPath(); x.moveTo(W * .46, 0); x.lineTo(W * .54, 0); x.lineTo(W * .68, H); x.lineTo(W * .32, H); x.fill();
      for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(255,255,255,${R() * .9})`; const yy = R() * H, spread = .04 + yy / H * .14; x.fillRect(W * (.5 + (R() - .5) * spread * 2), yy, 2, 2); }
      x.fillStyle = '#050608'; x.save(); x.translate(W * .5, H * .42); x.rotate(.08); // kleine alte Frau, schwebend, Arme hängen
      x.beginPath(); x.arc(0, -64, 17, 0, 7); x.fill(); x.beginPath(); x.moveTo(-26, -44); x.quadraticCurveTo(0, -54, 26, -44); x.lineTo(40, 60); x.lineTo(-38, 60); x.closePath(); x.fill();
      x.lineWidth = 7; x.strokeStyle = '#050608'; x.beginPath(); x.moveTo(-24, -40); x.quadraticCurveTo(-36, 0, -30, 34); x.moveTo(24, -40); x.quadraticCurveTo(36, 4, 31, 36); x.moveTo(-12, 60); x.lineTo(-15, 108); x.moveTo(12, 60); x.lineTo(16, 104); x.stroke(); x.restore();
      const rg = x.createRadialGradient(W / 2, H * .96, 10, W / 2, H * .96, W * .2); rg.addColorStop(0, 'rgba(255,255,255,.8)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, H * .8, W, H * .2); });
  const peter = kf_cnv(W, H, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); for (let i = 0; i < 14; i++) { x.strokeStyle = `rgba(200,210,230,${.05 + R() * .18})`; x.lineWidth = 1 + R() * 2; x.beginPath(); x.ellipse(W / 2, H * .72, 60 + i * 38, 10 + i * 6, 0, 0, 7); x.stroke(); }
      const fg = x.createRadialGradient(W / 2, H * .5, 10, W / 2, H * .52, 150); fg.addColorStop(0, 'rgba(235,235,240,1)'); fg.addColorStop(1, 'rgba(160,160,170,.0)'); x.fillStyle = fg; x.beginPath(); x.ellipse(W / 2, H * .52, 96, 128, 0, Math.PI, 0); x.lineTo(W / 2 + 96, H * .7); x.lineTo(W / 2 - 96, H * .7); x.fill();
      x.fillStyle = '#000'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(W / 2 + s * 36, H * .44, 16, 22, 0, 0, 7); x.fill(); }
      x.beginPath(); x.ellipse(W / 2, H * .6, 62, 22, 0, 0, 7); x.fill(); x.fillStyle = '#f4f4f4'; for (let i = 0; i < 22; i++) { const a = Math.PI * (i / 21), tx = W / 2 - Math.cos(a) * 58, ty = H * .6 + (i % 2 ? -1 : 1) * 4; x.beginPath(); x.moveTo(tx - 4, ty - (i % 2 ? 0 : 14)); x.lineTo(tx + 4, ty - (i % 2 ? 0 : 14)); x.lineTo(tx, ty + (i % 2 ? 14 : 0)); x.fill(); }
      for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(0,0,0,.95)'; const dx = W / 2 + (R() - .5) * 190; x.fillRect(dx, H * .3 + R() * 50, 3 + R() * 5, 60 + R() * 140); }
      x.fillStyle = '#000'; x.fillRect(0, H * .7, W, H * .3); for (let i = 0; i < 40; i++) { x.strokeStyle = `rgba(220,225,240,${R() * .25})`; x.beginPath(); const yy = H * (.72 + R() * .26); x.moveTo(R() * W, yy); x.lineTo(R() * W, yy + 1); x.stroke(); } });
  const grau = kf_cnv(W, H, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); const tg = x.createLinearGradient(0, 0, W, 0); tg.addColorStop(0, 'rgba(120,150,150,.15)'); tg.addColorStop(.5, 'rgba(170,200,195,.45)'); tg.addColorStop(1, 'rgba(120,150,150,.15)');
      x.fillStyle = tg; x.fillRect(W * .22, H * .05, W * .56, H * .9); x.strokeStyle = 'rgba(210,220,220,.7)'; x.lineWidth = 6; x.strokeRect(W * .22, H * .05, W * .56, H * .9);
      const fi = typeof faceTexes !== 'undefined' && faceTexes.grey && faceTexes.grey.image; if (fi) { x.save(); x.globalAlpha = .95; x.filter = 'grayscale(1) contrast(1.4) brightness(1.2)'; x.drawImage(fi, W * .36, H * .16, W * .28, H * .6); x.restore(); }
      else { x.fillStyle = '#9a9c9e'; x.beginPath(); x.ellipse(W / 2, H * .45, 110, 150, 0, 0, 7); x.fill(); x.fillStyle = '#000'; for (const s of [-1, 1]) { x.beginPath(); x.ellipse(W / 2 + s * 42, H * .4, 18, 24, 0, 0, 7); x.fill(); } }
      for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(230,240,240,${R() * .6})`; x.lineWidth = 1.5; x.beginPath(); x.arc(W * (.25 + R() * .5), H * R(), 2 + R() * 7, 0, 7); x.stroke(); }
      for (let i = 0; i < 7; i++) { x.strokeStyle = 'rgba(255,255,255,.1)'; x.lineWidth = 14; x.beginPath(); const xx = W * (.26 + R() * .48); x.moveTo(xx, H * .05); x.lineTo(xx - 40, H * .95); x.stroke(); } });
  // Nachbild-Anmutung: weich, doppelt belichtet, Korn – nie scharf wie ein Foto
  const nb = c => kf_cnv(W, H, x => { x.filter = 'blur(3px)'; x.drawImage(c, 0, 0); x.filter = 'blur(6px)'; x.globalAlpha = .35; x.drawImage(c, 14, 6); x.globalAlpha = 1; x.filter = 'none';
    const im = x.getImageData(0, 0, W, H), d = im.data; for (let i = 0; i < d.length; i += 4) { const n = (R() - .5) * 38; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(im, 0, 0); });
  return [hilde, peter, grau].map(nb).map(c => { const t = tex(c, false); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }); }

// ================================================================ Requisiten und Schlüsselbilder
// Schlüssel einer Requisite: { a: 'L' | 'R' (Lage relativ zum Handknochen: x Daumenseite, y Finger, z aus der Handfläche) | undefined (Sitzraum), p: [x, y, z], r: [rx, ry, rz] } · null = versteckt
const kf_PR = {}; // name → { o }
function kf_prop(name, o) { o.visible = false; o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; } }); kf_R.seat.add(o); kf_PR[name] = { o }; return o; }
function kf_keyLage(K, oP, oQ) { const V = KF_V;
  if (K.a) { const P = kf_P[K.a], Q = kf_HQ[K.a]; oP.set(K.p[0], K.p[1], K.p[2]).applyQuaternion(Q).add(P.w); oQ.copy(Q).multiply(V.q0.setFromEuler(V.e0.set(K.r[0], K.r[1], K.r[2]))); }
  else if (K.d) { oP.set(K.p[0], K.p[1], K.p[2]); oQ.setFromUnitVectors(V.v4.set(1, 0, 0), V.v3.set(K.d[0], K.d[1], K.d[2])); } // Richtung der Längsachse (Joint)
  else { oP.set(K.p[0], K.p[1], K.p[2]); oQ.setFromEuler(V.e0.set(K.r[0], K.r[1], K.r[2])); } }
const kf_kp = [new THREE.Vector3(), new THREE.Vector3()], kf_kq = [new THREE.Quaternion(), new THREE.Quaternion()];
function kf_propSetzen(name, A, B, k) { const pr = kf_PR[name]; if (!pr) return; const o = pr.o;
  if (!A && !B) { o.visible = false; return; }
  if (!B) { if (k >= .5) { o.visible = false; return; } kf_keyLage(A, o.position, o.quaternion); o.visible = true; return; } // verschwindet (Tasche) zur Hälfte
  if (!A) { if (k < .5) { o.visible = false; return; } kf_keyLage(B, o.position, o.quaternion); o.visible = true; return; } // taucht zur Hälfte auf
  kf_keyLage(A, kf_kp[0], kf_kq[0]); kf_keyLage(B, kf_kp[1], kf_kq[1]); o.position.lerpVectors(kf_kp[0], kf_kp[1], k); o.quaternion.slerpQuaternions(kf_kq[0], kf_kq[1], k); o.visible = true; }
// Posen-Bibliothek (Sitzraum: Ursprung Augenpunkt, x rechts, y oben, −z vorn). Spiegeln: x → −x
const KF_SPIEGEL = p => KP([-p.w[0], p.w[1], p.w[2]], [-p.f[0], p.f[1], p.f[2]], [-p.n[0], p.n[1], p.n[2]], p.c.slice(), p.s, p.t);
const KF_H = {};
// Griffpunkte in der Hand (x Daumenseite, y entlang der Finger, z aus der Handfläche) – aus den Knochen der Bindepose gemessen
const KF_OFF = { palm: [0, .08, .026], pinch: [.048, .125, .042], top: [0, .072, .022] };
// Pose über einen Griffpunkt: das Handgelenk ergibt sich aus Lage der Hand und Griffpunkt (g = Punkt in der Welt, der im Griff liegen soll)
function KG(side, g, f, n, c, s, t, off) { const V = KF_V, Y = V.v0.set(f[0], f[1], f[2]).normalize(), Z = V.v1.set(n[0], n[1], n[2]).addScaledVector(Y, -Y.dot(V.v1.set(n[0], n[1], n[2]))).normalize(), X = V.v2.crossVectors(Y, Z);
  const o = V.v3.set(off[0] * (side === 'R' ? 1 : -1), off[1], off[2]).applyQuaternion(V.q0.setFromRotationMatrix(V.m0.makeBasis(X, Y, Z)));
  return KP([g[0] - o.x, g[1] - o.y, g[2] - o.z], f, n, c, s, t); }
const kf_n = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; }, kf_add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const KF_ORT = {}; // wichtige Punkte (Sitzraum)
function kf_posen() { const H = KF_H, O = KF_ORT, F = KF_OFF;
  O.G0 = [-.035, -.44, -.42]; O.nL = kf_n(.12, 1, .1); O.T = kf_add(O.G0, O.nL, .047); // Grinder in der linken Hand, Deckeloberseite
  O.P = [0, -.35, -.4]; O.Prx = -1.0; O.Pm = [0, -.14, -.19]; // Blättchen vor der Brust, beim Lecken am Mund
  O.M = [0, -.085, -.07]; O.dH = kf_n(-.78, .18, -.6); O.JH = [.1, -.4, -.34]; O.dM = kf_n(.12, -.32, -.94); O.JM = kf_add(O.M, O.dM, .0525); O.tip = kf_add(O.M, O.dM, .105);
  O.F0 = kf_add(O.tip, [0, -.074, .004]); // Feuerzeug (Unterkante) unter der Spitze
  const MO = kiffen_S.mo; if (MO) { const fr = tt => MO.R[Math.round(tt * MO.fps)], h = fr(20.2), z = fr(15.2); // Halten und Zug aus der Aufnahme – der Joint liegt im Spalt Zeige-/Mittelfinger
    O.JH = kf_add(h.j, h.n, -.024); O.dH = h.n; // (Anzünden: Joint in den Lippen, Spitze nach vorn unten – bleibt wie oben)
    H.haltMo = KP(h.w, h.f, h.n, h.c, .1, .55); H.mundMo = KP(z.w, z.f, z.n, z.c, .1, .55); }
  H.ruheR = KP([.17, -.66, -.22], [-.12, -.3, -1], [-.1, -1, .3], [.35, .38, .42, .48, .55], .2, .2); H.ruheL = KF_SPIEGEL(H.ruheR);
  H.vornR = KP([.11, -.47, -.3], [-.42, .12, -.9], [-.2, .95, .2], [.35, .35, .42, .5, .58], .15, .3); H.vornL = KF_SPIEGEL(H.vornR);
  H.taschR = KP([.3, -.7, -.02], [-.1, -.6, -.8], [-.9, 0, .2], [.5, .6, .6, .6, .6], .1, .4); H.taschL = KF_SPIEGEL(H.taschR);
  H.schaleL = KG('L', O.G0, [.4, .08, -.91], O.nL, [.45, .52, .58, .64, .7], .08, .35, F.palm);
  H.griffR = KG('R', kf_add(O.T, [0, .004, 0]), [-.85, -.3, -.42], [-.2, -1, .15], [.5, .56, .6, .64, .68], .25, .75, F.top); // von rechts über den Deckel (der Unterarm bleibt rechts)
  H.zangeR = KG('R', kf_add(O.T, [.005, .05, 0]), [-.8, -.15, -.58], [-.35, -.8, .45], [.55, .5, .7, .85, .92], .05, .95, F.pinch);
  H.dropR = KG('R', kf_add(O.T, [.0, .014, 0]), [-.8, -.25, -.55], [-.35, -.8, .45], [.35, .3, .6, .85, .92], .25, .6, F.pinch);
  const ex = [Math.cos(O.Prx) * 0, 0, 0]; void ex;
  H.blattL = KG('L', kf_add(O.P, [-.046, 0, 0]), [.55, -.1, -.83], [.2, .8, .55], [.5, .32, .44, .6, .72], .1, .65, F.pinch); H.blattR = KF_SPIEGEL(H.blattL);
  H.rollL = KG('L', kf_add(O.P, [-.032, .012, .004]), [.35, .45, -.82], [.8, .2, .55], [.62, .44, .52, .64, .74], .06, .85, F.pinch); H.rollR = KF_SPIEGEL(H.rollL);
  H.leckL = KG('L', kf_add(O.Pm, [-.032, .012, .004]), [.35, .5, -.79], [.8, .2, .55], [.62, .44, .52, .64, .74], .06, .85, F.pinch); H.leckR = KF_SPIEGEL(H.leckL);
  H.schaleR = KG('R', [.07, -.4, -.4], [-.4, .08, -.91], [-.12, 1, .1], [.45, .52, .58, .64, .7], .08, .35, F.palm);
  H.kippR = KG('R', kf_add(O.P, [.0, .085, .015]), [-.5, .15, -.85], [-.25, -.9, .35], [.5, .55, .6, .66, .72], .1, .5, F.palm);
  H.haltR = KG('R', kf_add(O.JH, O.dH, -.0315), [-.55, .55, -.62], [-.55, .2, .8], [.6, .5, .66, .78, .86], .05, .85, F.pinch);
  H.mundR = KG('R', kf_add(O.M, O.dM, .021), [-.55, .7, .45], [-.8, -.35, -.5], [.6, .5, .66, .78, .86], .05, .85, F.pinch);
  H.feuerR = KG('R', kf_add(O.F0, [0, .026, 0]), [-.5, -.05, -.86], [-.88, .1, .45], [.66, .7, .74, .78, .8], .04, .2, F.palm); // Feuerzeug aufrecht in der Rechten, Daumen am Rad
  H.schirmL = KG('L', kf_add(O.tip, [-.035, -.015, .0]), [.25, .55, -.8], [.92, .1, .35], [.3, .32, .36, .42, .5], .12, .3, F.palm); // linke Hand schirmt die Flamme ab
  H.feuerL = H.schirmL;
  if (H.haltMo) { H.haltR = H.haltMo; H.mundR = H.mundMo; }
  H.gravurL = KG('L', [-.015, -.2, -.2], [.45, .4, -.8], [.05, .85, .5], [.5, .56, .6, .64, .68], .05, .5, F.palm);
}
// ---------------------------------------------------------------- Die Schritte der Szene
// art: 'auto' (läuft von selbst) · 'klick' (Klick löst die Bewegung aus, dann dauer s) · 'halten' (Maustaste/Leertaste halten: dauer s) · 'maus' (bedarf px Mausweg) · 'rauchen'
// keys: [[t 0…1, { L, R, pr: { name: key | null }, ch: { … }, cam: [yaw, pitch] }], …] – fehlende Einträge übernehmen den Stand davor
const KF_GR = { bodyP: KF_OFF.palm, bodyR: [Math.PI / 2, 0, 0] };
const KF_STEPS = [];
function kf_schritte() { const H = KF_H, S = KF_STEPS, O = KF_ORT, F = KF_OFF, cut = kiffen_S.gr ? kiffen_S.gr.cut : .027; S.length = 0; const PI2 = Math.PI / 2;
  const gb = { a: 'L', p: F.palm, r: KF_GR.bodyR }, deckelAuf = h => ({ a: 'L', p: [0, F.palm[1], F.palm[2] + cut + h], r: KF_GR.bodyR });
  const lidR = { a: 'R', p: [0, F.top[1], F.top[2] + (.047 - cut) + .002], r: [-PI2, 0, 0] };
  const blatt = (p, rx) => ({ p, r: [rx, 0, 0] }), joint = (c, d) => ({ p: c, d });
  S.push({ id: 'setzen', art: 'auto', dauer: 1.9, keys: [[0, { L: H.ruheL, R: H.ruheR, cam: [0, -.2], ch: { deckelD: 0, einsatz: 0, knolle: 1, blatt: 0, mulde: 0, rolle: 0, spitze: 0, brand: 0, kegel: 0, nass: 0, falt: 0, tipRoll: 0, flamme: 0, glut: 0, kr: 0 },
      pr: { koerper: null, deckel: null, knolle: null, papes: null, blatt: null, tip: null, feuerzeug: null } }], [1, { cam: [0, -.62] }]] });
  S.push({ id: 'nehmen', art: 'klick', hint: [['Klick', 'Grinder aus der Tasche']], dauer: 2.3, ton: [[.25, 'kfKlack', .12]], keys: [[0, {}], [.3, { R: H.taschR, L: H.vornL }],
      [.55, { R: H.schaleR, L: H.schaleL, pr: { koerper: { a: 'R', p: F.palm, r: KF_GR.bodyR }, deckel: { a: 'R', p: [0, F.palm[1], F.palm[2] + cut], r: KF_GR.bodyR } } }],
      [1, { R: H.griffR, pr: { koerper: gb, deckel: deckelAuf(0) }, cam: [0, -.8] }]] });
  S.push({ id: 'auf', art: 'klick', hint: [['Klick', 'Deckel abschrauben']], dauer: 2.2, ton: [[.05, 'kfGewinde', .4], [.62, 'kfKlack', .3]], keys: [[0, {}], [.55, { ch: { deckelD: -3.2 } }], [.62, { pr: { deckel: lidR } }], [.75, { R: KG('R', kf_add(O.T, [.03, .05, .02]), [-.3, -.25, -.92], [-.08, -1, -.12], [.5, .56, .6, .64, .68], .25, .75, F.top) }],
      [1, { R: H.vornR, pr: { deckel: { p: [.21, -.8, -.08], r: [0, .4, 0] } }, ch: { einsatz: 1 } }]] });
  S.push({ id: 'knolle', art: 'klick', hint: [['Klick', 'Knolle hineinlegen']], dauer: 2.8, ton: [[.12, 'kfPapier', .2], [.78, 'kfKlack', .1]], keys: [[0, {}], [.3, { R: H.taschR }], [.55, { R: H.zangeR, pr: { knolle: { a: 'R', p: F.pinch, r: [0, 0, 0] } } }],
      [.8, { R: H.dropR, pr: { knolle: { a: 'L', p: [0, F.palm[1], F.palm[2] + cut - .012], r: [PI2, 0, 0] } }, ch: { knolle: .8 } }], [1, { R: H.vornR, ch: { knolle: .78 } }]] });
  S.push({ id: 'zu', art: 'auto', dauer: 1.7, ton: [[.5, 'kfGewinde', .35]], keys: [[0, {}], [.3, { R: H.griffR, pr: { deckel: lidR } }], [.45, { pr: { deckel: deckelAuf(.008) }, ch: { einsatz: 0 } }], [.5, { pr: { knolle: null } }], [1, { pr: { deckel: deckelAuf(0) }, ch: { deckelD: 0 } }]] });
  S.push({ id: 'grinden', art: 'maus', bedarf: 2600, hint: [['Maus hin und her', 'drehen']], keys: [[0, {}], [1, {}]], live: 'grind' });
  S.push({ id: 'oeffnen', art: 'klick', hint: [['Klick', 'aufschrauben']], dauer: 2.0, ton: [[.05, 'kfGewinde', .4], [.6, 'kfKlack', .3]], keys: [[0, {}], [.55, { ch: { deckelD: -3 } }], [.62, { pr: { deckel: lidR } }],
      [1, { R: H.vornR, pr: { deckel: { p: [.21, -.8, -.08], r: [0, .4, 0] } }, ch: { einsatz: 2 } }]] });
  S.push({ id: 'blatt', art: 'klick', hint: [['Klick', 'ein Blättchen ziehen']], dauer: 3.2, ton: [[.55, 'kfPapier', .35]], keys: [[0, {}], [.2, { R: H.schaleR, pr: { koerper: { a: 'R', p: F.palm, r: KF_GR.bodyR } } }],
      [.35, { L: H.taschL, pr: { koerper: { p: [.2, -.8, -.16], r: [0, 0, 0] } } }], [.55, { L: H.blattL, R: H.vornR, pr: { papes: { a: 'L', p: [-.01, .1, .03], r: [0, 0, PI2] } } }],
      [.8, { R: H.zangeR, pr: { blatt: { a: 'L', p: [-.02, .12, .035], r: [0, 0, PI2] } }, ch: { blatt: 1 } }], [1, { R: H.blattR, pr: { papes: null, blatt: blatt(O.P, O.Prx) }, cam: [0, -.72] }]] });
  S.push({ id: 'falten', art: 'klick', hint: [['Klick', 'Pappe falten']], dauer: 2.2, ton: [[.25, 'kfFalt', .35], [.5, 'kfFalt', .3], [.72, 'kfFalt', .3]], keys: [[0, {}], [.2, { R: H.zangeR, pr: { tip: { a: 'R', p: F.pinch, r: [0, PI2, 0] } }, ch: { falt: 0 } }], [1, { ch: { falt: 1 } }]] });
  S.push({ id: 'tip', art: 'halten', hint: [['Halten', 'Tip rollen']], dauer: 1.4, ton: [[.1, 'kfRoll', .2]], keys: [[0, {}], [1, { ch: { tipRoll: 1 } }]] });
  S.push({ id: 'einlegen', art: 'auto', dauer: 1.5, keys: [[0, {}], [.6, { ch: { mulde: .55 } }], [1, { R: H.blattR, pr: { tip: { p: kf_add(O.P, [-.045, .004, .0]), r: [O.Prx, PI2, 0], tip: 1 } }, ch: { mulde: .9 } }]] });
  S.push({ id: 'fuellen', art: 'halten', hint: [['Halten', 'Gras einstreuen']], dauer: 2.8, keys: [[0, {}], [.2, { R: H.schaleR, pr: { koerper: { a: 'R', p: F.palm, r: KF_GR.bodyR } } }], [.32, { R: H.kippR }], [.9, { ch: { kr: 1 } }],
      [1, { R: H.blattR, pr: { koerper: { p: [.2, -.8, -.16], r: [0, 1, 0] } } }]], live: 'fuellen' });
  S.push({ id: 'rollen', art: 'maus', bedarf: 1800, hint: [['Maus auf und ab', 'andrücken und rollen']], keys: [[0, { L: H.rollL, R: H.rollR }], [1, { ch: { rolle: .82, kegel: 1, mulde: .9 } }]], live: 'rollen' });
  S.push({ id: 'lecken', art: 'klick', hint: [['Klick', 'anlecken']], dauer: 2.4, ton: [[.45, 'kfLeck', .35]], keys: [[0, {}], [.35, { L: H.leckL, R: H.leckR, pr: { blatt: blatt(O.Pm, -.4) }, cam: [0, -.55] }],
      [.6, { ch: { nass: 1 } }], [1, { L: H.rollL, R: H.rollR, pr: { blatt: blatt(O.P, O.Prx) }, cam: [0, -.72] }]] });
  S.push({ id: 'kleben', art: 'maus', bedarf: 1200, hint: [['Maus zur Seite', 'zukleben']], keys: [[0, {}], [1, { ch: { rolle: 1.45 } }]], live: 'kleben' });
  S.push({ id: 'spitze', art: 'maus', bedarf: 900, hint: [['Maus kreisen', 'Spitze drehen']], keys: [[0, { R: KG('R', kf_add(O.P, [.05, 0, 0]), [-.2, .45, -.87], [-.85, .2, .45], [.6, .5, .66, .8, .88], .05, .9, F.pinch) }], [1, { ch: { spitze: 1 } }]], live: 'spitze' });
  S.push({ id: 'feuer', art: 'klick', hint: [['Klick', 'Peters Feuerzeug']], dauer: 2.8, ton: [[.3, 'kfKlack', .12]], keys: [[0, {}], [.3, { L: H.taschL, R: H.haltR, pr: { blatt: joint(O.JH, O.dH) } }],
      [.7, { L: H.gravurL, pr: { feuerzeug: { a: 'L', p: [0, .085, .03], r: [0, 0, 0] } } }], [1, { cam: [-.04, -.8] }]], halt: 3 });
  S.push({ id: 'rad', art: 'klick', hint: [['Klick', 'Rad drehen']], dauer: 1.4, keys: [[0, {}], [.25, { R: H.vornR, pr: { blatt: joint(O.JM, O.dM) } }], [.5, { L: H.schirmL, R: H.feuerR, pr: { feuerzeug: { a: 'R', p: [-.028, .08, .04], r: [0, 0, -Math.PI / 2] } }, cam: [0, -.62] }], [1, {}]], live: 'rad' });
  S.push({ id: 'anzuenden', art: 'halten', hint: [['Halten', 'anziehen']], dauer: 2.2, keys: [[0, {}], [1, { ch: { brand: .05, glut: 1 } }]], live: 'anzuenden' });
  S.push({ id: 'weg', art: 'auto', dauer: 1.4, ton: [[.05, 'kfDeckelZ', .5]], keys: [[0, {}], [.35, { R: H.taschR, L: H.ruheL, ch: { flamme: 0 } }], [.55, { pr: { feuerzeug: null } }], [.8, { R: H.mundR }], [1, { R: H.haltR, pr: { blatt: joint(O.JH, O.dH) }, cam: [0, -.5] }]] });
  S.push({ id: 'rauchen', art: 'rauchen', hint: [['Halten', 'ziehen']], keys: [[0, {}], [1, {}]], live: 'rauchen' });
  S.push({ id: 'aufstehen', art: 'auto', dauer: 2.0, keys: [[0, {}], [.5, { R: H.ruheR, pr: { blatt: { p: [.3, -.8, .02], r: [0, 1.2, 0] } } }], [1, { cam: [0, -.1] }]] });
  // Schlüssel vervollständigen (fehlende Einträge vom Stand davor)
  let cur = { L: null, R: null, pr: {}, ch: {}, cam: [0, 0] };
  for (const st of S) for (const kk of st.keys) { const K = kk[1]; const full = { L: K.L || cur.L, R: K.R || cur.R, pr: Object.assign({}, cur.pr, K.pr || {}), ch: Object.assign({}, cur.ch, K.ch || {}), cam: K.cam || cur.cam }; kk[1] = full; cur = full; }
}
// ---------------------------------------------------------------- Laufzeit der Szene
const kf_Z = { on: false, i: -1, p: 0, pV: 0, st: null, t: 0, akt: false, zug: 0, zuege: 0, rauchT: 0, lidA: 0, lidV: 0, grindG: null, hustet: false, vegas: false, whiskey: false, fertig: false, blend: 0, blendZ: 0,
  camY: 0, camP: 0, camYz: 0, camPz: 0, look: null, saved: null, sitz: new THREE.Vector3(), yaw: Math.PI, flTon: null, glutTon: null, res: null, halt: 0, tonI: 0, einT: 0, ausT: 0, wart: 0, opts: {} };
const kf_CH = { deckelD: 0, einsatz: 0, knolle: 1, blatt: 0, mulde: 0, rolle: 0, spitze: 0, brand: 0, kegel: 0, nass: 0, falt: 0, tipRoll: 0, flamme: 0, glut: 0, kr: 0 };
function kf_eval(st, p) { const K = st.keys; let a = K[0], b = K[K.length - 1], k = 0;
  for (let i = 0; i < K.length - 1; i++) if (p >= K[i][0] && p <= K[i + 1][0]) { a = K[i]; b = K[i + 1]; k = kf_io((p - a[0]) / Math.max(1e-6, b[0] - a[0])); break; }
  if (p > K[K.length - 1][0]) { a = b; k = 1; }
  const A = a[1], B = b[1]; kf_mixPose(kf_P.L, A.L, B.L, k); kf_mixPose(kf_P.R, A.R, B.R, k);
  for (const c in kf_CH) kf_CH[c] = kf_lerp(A.ch[c] ?? 0, B.ch[c] ?? 0, k);
  kf_Z.camYz = kf_lerp(A.cam[0], B.cam[0], k); kf_Z.camPz = kf_lerp(A.cam[1], B.cam[1], k); return [A, B, k]; }
// Hand um eine Achse durch einen Punkt drehen (Grinder-Deckel)
function kf_handDreh(P, cx, cy, cz, ax, ay, az, ang) { const V = KF_V, q = V.q2.setFromAxisAngle(V.v4.set(ax, ay, az).normalize(), ang); P.w.x -= cx; P.w.y -= cy; P.w.z -= cz; P.w.applyQuaternion(q); P.w.x += cx; P.w.y += cy; P.w.z += cz; P.f.applyQuaternion(q); P.n.applyQuaternion(q); }
const kf_lebend = {
  grind(dt, t) { const Z = kf_Z, mv = kiffen_S.in.dx; Z.lidV = kf_lerp(Z.lidV, mv / Math.max(dt, .001) * .0035, Math.min(1, dt * 12)); const zahn = .5 + .5 * Math.abs(Math.sin(Z.lidA * 9 + (Z.gw = (Z.gw || 0) + Math.abs(mv) * .004))); Z.lidA = kf_clamp(Z.lidA + mv * .0042 * zahn, -.95, .95); if (zahn < .56 && Math.abs(mv) > 3) shake = Math.max(shake, .0025); // Zähne greifen: Widerstand, kleiner Ruck
    const g = kf_PR.koerper.o.position; const ax = KF_V.v1.set(0, 0, 1).applyQuaternion(kf_HQ.L); kf_handDreh(kf_P.R, g.x, g.y, g.z, ax.x, ax.y, ax.z, Z.lidA); kf_CH.deckelD = Z.lidA;
    kf_P.L.w.y += Math.sin(t * 23) * .0008 * Math.min(1, Math.abs(Z.lidV)); // die haltende Hand bekommt den Widerstand ab
    const sp = Math.min(1, Math.abs(Z.lidV) * .5); if (Z.grindG) Z.grindG.g.gain.setTargetAtTime(sp * .5, Audio.ctx.currentTime, .05); },
  fuellen(dt, t) { const Z = kf_Z; if (Z.p > .3 && Z.p < .92 && kiffen_S.in.down) { Z.krT = (Z.krT || 0) - dt; if (Z.krT < 0) { Z.krT = .025; kf_kruemelFall(); } if (!Z.streuT || t > Z.streuT) { Z.streuT = t + .5; kf_ton('kfGrind', { gain: .07, rate: .6, dur: .5 }); } } },
  rollen(dt, t) { const Z = kf_Z, d = kiffen_S.in.dy; Z.rollPh = (Z.rollPh || 0) + d * .012; const o = Math.sin(Z.rollPh); kf_PA.rolle = kf_lerp(.3, .82, kf_ease(Z.p)) + o * .07 * (1 - Z.p * .5);
    kf_P.L.w.y += o * .006; kf_P.R.w.y += o * .006; kf_P.L.c[0] = kf_P.R.c[0] = .62 + o * .12; if (Math.abs(d) > 2 && (!Z.rollT || t > Z.rollT)) { Z.rollT = t + .9; kf_ton('kfRoll', { gain: .22 }); } },
  kleben(dt, t) { const Z = kf_Z, d = kiffen_S.in.dx; Z.klebX = kf_clamp((Z.klebX || 0) + d * .00004, -.03, .03); kf_P.L.w.x += Z.klebX; kf_P.R.w.x += Z.klebX; kf_PA.nass = 1 - Z.p * .6; if (Math.abs(d) > 2 && (!Z.rollT || t > Z.rollT)) { Z.rollT = t + .8; kf_ton('kfRoll', { gain: .16, rate: 1.2 }); } },
  spitze(dt, t) { const Z = kf_Z, d = Math.abs(kiffen_S.in.dx) + Math.abs(kiffen_S.in.dy); Z.spPh = (Z.spPh || 0) + d * .02; kf_handDreh(kf_P.R, .085, -.37, -.3, -.35, .2, -.92, Math.sin(Z.spPh) * .5); if (d > 3 && (!Z.rollT || t > Z.rollT)) { Z.rollT = t + .5; kf_ton('kfPapier', { gain: .12, rate: 1.4, dur: .3 }); } },
  rad(dt, t) { const Z = kf_Z; if (Z.p > .45 && Z.p < .62 && !Z.feuer) { const k = (Z.p - .45) / .17; kf_P.R.c[0] = .15 + .75 * Math.sin(Math.PI * k); kf_P.R.t = .2 + .5 * Math.sin(Math.PI * k); } // Daumen reißt das Rad
    if (!Z.radDone && Z.p > .45) { Z.radDone = true; kf_ton('kfDeckelZ', { gain: .5 }); Z.radN = (Z.radN || 0) + 1; kf_ton('kfRad', { gain: .5, delay: .25 }); const f = kf_PR.feuerzeug.o.position;
      setTimeout(() => { kf_funken(KF_V.v4.copy(f).setY(f.y + .03)); if (Z.radN >= 2 || kiffen_S.in.test) { kf_ton('kfWusch', { gain: .45 }); kf_CH.flamme = 1; Z.feuer = true; Z.flTon = kf_ton('kfFlamme', { gain: .1 }); if (Z.flTon) Z.flTon.src.loop = true; } else { subtitle('Nur Funken. Der Stein ist alt.', 1800, 'LUKE'); Z.p = 0; Z.radDone = false; Z.akt = false; kf_hint(Z.st && Z.st.hint); } }, 280); }
    if (Z.feuer) kf_CH.flamme = 1; },
  anzuenden(dt, t) { const Z = kf_Z; kf_CH.flamme = 1; if (kiffen_S.in.down) { kf_CH.glut = Math.min(1, .3 + Z.p); if (!Z.einT || t > Z.einT) { Z.einT = t + 1.7; kf_ton('kfEin', { gain: .3, dur: 1.6 }); } } },
  rauchen(dt, t) { kf_rauchenTick(dt, t); } };
// Krümel: fallen aus dem gekippten Grinder in die Rinne und bleiben dort (Lage auf dem Papier in u/v), rollen mit ein
function kf_kruemelFall() { const T = kf_T; for (const c of T.kr) { if (c.st) continue; c.st = 1; c.t = 0; const ko = kf_PR.koerper.o, g = KF_V.v4.set(0, .027, 0).applyQuaternion(ko.quaternion).add(ko.position); c.x = g.x + (Math.random() - .5) * .014; c.y = g.y; c.z = g.z + (Math.random() - .5) * .014; c.vx = (Math.random() - .5) * .05; c.vy = -.05; c.vz = (Math.random() - .5) * .05;
  c.u = .1 + Math.random() * .78; c.v = .3 + Math.random() * .14; c.h = Math.random(); T.krN++; return; } }
function kf_kruemelTick(dt) { const T = kf_T, P = T.krP.geometry.attributes.position.array, bl = kf_PR.blatt.o, V = KF_V; let any = false;
  for (let i = 0; i < KF_KR; i++) { const c = T.kr[i]; if (!c.st) { P[i * 3 + 1] = -99; continue; } any = true;
    if (c.st === 1) { c.t += dt; c.vy -= 9.8 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      // Ziel: Punkt auf dem Blatt
      kf_papAchse(c.u, V.v0); V.v0.y += (c.v - .32) * KF_PAP.W * (1 - kf_clamp(kf_papK() * 1.6)) * .8; V.v0.z += c.h * .002; V.v0.applyQuaternion(bl.quaternion).add(bl.position);
      if (c.y <= V.v0.y || c.t > .6) c.st = 2; else { P[i * 3] = c.x; P[i * 3 + 1] = c.y; P[i * 3 + 2] = c.z; continue; } }
    kf_papAchse(c.u, V.v0); const k = kf_clamp(kf_papK() * 1.3); V.v0.y += ((c.v - .32) * KF_PAP.W * .8 * (1 - k) + (c.h - .5) * .004 * k); V.v0.z += (c.h - .5) * .003 * k + c.h * .002 * (1 - k);
    if (kf_PA.brand > 0 && c.u > 1 - kf_PA.brand * .72) V.v0.y = -99; V.v0.applyQuaternion(bl.quaternion).add(bl.position); P[i * 3] = V.v0.x; P[i * 3 + 1] = V.v0.y; P[i * 3 + 2] = V.v0.z; }
  T.krP.visible = any && bl.visible; T.krP.geometry.attributes.position.needsUpdate = true; }
function kf_kruemelAlle() { let n = 0; for (const c of kf_T.kr) if (!c.st && n++ < 150) { c.st = 2; c.u = .1 + Math.random() * .78; c.v = .3 + Math.random() * .14; c.h = Math.random(); } }
// Weltlage eines Punkts auf dem Joint (u entlang, Achse)
function kf_jointPunkt(u, o) { const bl = kf_PR.blatt.o; kf_papAchse(u, o); return o.applyQuaternion(bl.quaternion).add(bl.position); }
// ---------------------------------------------------------------- Rauchen: Zug = halten; loslassen = ausatmen. Husten nach dem ersten Zug, Whiskey äfft nach, Vegas im Türrahmen
// Rauchen nach echter Bewegungsaufnahme (Mocap „Smoking 01“, Klian, Rokoko-Anzug mit Handschuhen, CC-BY → assets/ms/haende/rauchen.json, tools/_x6_mocap.mjs):
// Abschnitte der Aufnahme: heben → Zug (am Mund, hin und her, solange gehalten) → senken → halten (Ruhe) · nach dem 2. und 4. Zug abklopfen
const KF_MO = { halten: [20.2, 26.4, 'pp'], heben: [12.5, 14.3], zug: [14.3, 16.4, 'pp'], senken: [16.6, 20.2], klopfen: [31.2, 33.9] };
function kf_moSetzen(tt, P) { const M = kiffen_S.mo; if (!M) return false; const R = M.R, f = Math.max(0, Math.min(R.length - 1.001, tt * M.fps)), i = Math.floor(f), k = f - i, a = R[i], b = R[i + 1];
  P.w.set(kf_lerp(a.w[0], b.w[0], k), kf_lerp(a.w[1], b.w[1], k), kf_lerp(a.w[2], b.w[2], k)); P.f.set(kf_lerp(a.f[0], b.f[0], k), kf_lerp(a.f[1], b.f[1], k), kf_lerp(a.f[2], b.f[2], k)).normalize();
  P.n.set(kf_lerp(a.n[0], b.n[0], k), kf_lerp(a.n[1], b.n[1], k), kf_lerp(a.n[2], b.n[2], k)).normalize(); for (let c = 0; c < 5; c++) P.c[c] = kf_lerp(a.c[c], b.c[c], k); P.s = .1; P.t = .55; return true; }
function kf_moWeiter(dt) { const m = kf_Z.mo, G = KF_MO[m.seg]; m.t += dt * m.dir;
  if (G[2] === 'pp') { const lo = G[0] + (m.seg === 'zug' ? .4 : 0); if (m.t > G[1]) { m.t = G[1]; m.dir = -1; } else if (m.t < lo) { m.t = lo; m.dir = 1; } return false; }
  return m.t >= G[1]; }
function kf_moSeg(seg) { const m = kf_Z.mo; m.seg = seg; m.t = KF_MO[seg][0]; m.dir = 1; m.segT = 0; }
function kf_rauchenTick(dt, t) { const Z = kf_Z, S = kiffen_S, H = KF_H, V = KF_V;
  if (S.in.test) { Z.testT = (Z.testT || 0) + dt; S.in.down = (Z.testT % 9) < 4.2; if (Z.zuege >= 3) S.in.ende = true; } // Selbsttest: Züge simulieren
  if (!Z.mo) Z.mo = { seg: 'halten', t: KF_MO.halten[0], dir: 1, segT: 0 };
  const m = Z.mo, druck = S.in.down && Z.ausT <= .6 && !Z.pause; m.segT += dt;
  if (m.seg === 'halten' && druck) kf_moSeg('heben');
  const ende = kf_moWeiter(dt);
  if (m.seg === 'heben' && ende) kf_moSeg('zug');
  else if (m.seg === 'zug' && !druck && m.segT > .5) { if (m.segT > 1) { // ausatmen beim Senken
      Z.zuege++; Z.ausT = 2.6; S.zittern *= .72; kf_ton('kfAus', { gain: .32, delay: .35 }); S.weichZiel = Math.min(1, .3 + Z.zuege * .24); if (Z.zuege === 1) S.weichT = 0;
      if (Z.zuege === 1 && !Z.hustet) { Z.hustet = true; setTimeout(() => { kf_ton('kfHusten', { gain: .55 }); shake = Math.max(shake, .018); kf_husten(); }, 900); }
      if (Z.zuege === 3 && !Z.vegas && Z.opts.vegas !== false) setTimeout(() => kf_vegas(), 3200); }
    kf_moSeg('senken'); }
  else if (m.seg === 'senken' && ende) { if ((Z.zuege === 2 || Z.zuege === 4) && Z.klopf !== Z.zuege) { Z.klopf = Z.zuege; kf_moSeg('klopfen'); } else kf_moSeg('halten'); }
  else if (m.seg === 'klopfen') { if (!Z.klopfT && m.t > 32.9) { Z.klopfT = 1; kf_asche(); } if (ende) { Z.klopfT = 0; kf_moSeg('halten'); } }
  if (!kf_moSetzen(m.t, kf_P.R)) kf_mixPose(kf_P.R, H.haltR, H.mundR, m.seg === 'zug' ? 1 : 0);
  kf_mixPose(kf_P.L, H.ruheL, H.ruheL, 0);
  const ziehen = m.seg === 'zug' && druck; Z.zug = kf_lerp(Z.zug, m.seg === 'zug' || m.seg === 'heben' ? 1 : 0, Math.min(1, dt * 2.5));
  Z.camPz = Z.blickY ? .12 : kf_lerp(-.52, -.36, Z.zug); Z.camYz = Z.blickY || 0;
  kf_CH.glut = kf_lerp(kf_CH.glut, ziehen ? 1 : .42, Math.min(1, dt * (ziehen ? 4 : 1.5)));
  if (ziehen) { kf_CH.brand = Math.min(.95, kf_CH.brand + dt * .012); if (!Z.einT || t > Z.einT) { Z.einT = t + 1.7; kf_ton('kfEin', { gain: .26, dur: 1.6 }); } }
  if (Z.ausT > 0) { Z.ausT -= dt; const k = Z.ausT / 2.6; if (k > .3 && k < .88 && (!Z.ausP || t > Z.ausP)) { Z.ausP = t + .05; kf_rauchStoss(V.v0.set(0, -.075, -.09), 2, (Math.random() - .5) * .05, .015, -.32 * k, .018, .34 * k, 3.4); } }
  // Glut glimmt, Rauchfaden steigt auf (dichter beim Zug)
  kf_jointPunkt(1 - kf_CH.brand * .72, V.v1); if (!Z.fadT || t > Z.fadT) { Z.fadT = t + (ziehen ? .035 : .1); kf_rauchStoss(V.v1, 1, 0, .05, 0, .005, ziehen ? .09 : .2, 3.2); }
  if (ziehen && (!Z.glT || t > Z.glT)) { Z.glT = t + .35; kf_ton('kfGlut', { gain: .1, dur: .4, offset: Math.random() }); }
  if (Z.zuege >= 3 && !Z.endHint) { Z.endHint = true; kf_hint([['Halten', 'noch ein Zug'], ['E', 'aufstehen']]); }
  if (m.seg === 'halten' && !Z.pause && Z.ausT <= 0 && ((Z.zuege >= 3 && S.in.ende) || Z.zuege >= 6)) Z.fertig = true; }
// Abklopfen: ein paar Aschestücke fallen (Schwerkraft), die Glut wird kurz kleiner
function kf_asche() { const T = kf_T, p = kf_jointPunkt(1 - kf_CH.brand * .72 + .01, KF_V.v2); if (!T.asche) return; T.asche.visible = true; T.ascheT = 0;
  for (const a of T.as) { a.x = p.x + (Math.random() - .5) * .004; a.y = p.y; a.z = p.z + (Math.random() - .5) * .004; a.vx = (Math.random() - .5) * .08; a.vy = -.05 - Math.random() * .1; a.vz = (Math.random() - .5) * .08; }
  kf_CH.brand = Math.max(0, kf_CH.brand - .012); kf_ton('kfKlack', { gain: .04, rate: 1.8 }); }
function kf_ascheTick(dt) { const T = kf_T; if (!T.asche || !T.asche.visible) return; T.ascheT += dt; const P = T.asche.geometry.attributes.position.array;
  for (let i = 0; i < T.as.length; i++) { const a = T.as[i]; a.vy -= 9.8 * dt * .6; a.vx *= 1 - dt * 2; a.vz *= 1 - dt * 2; a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt; P[i * 3] = a.x; P[i * 3 + 1] = a.y; P[i * 3 + 2] = a.z; }
  T.asche.geometry.attributes.position.needsUpdate = true; T.asche.material.opacity = Math.max(0, 1 - T.ascheT / 1.4); if (T.ascheT > 1.4) T.asche.visible = false; }
function kf_husten() { const Z = kf_Z; if (Z.opts.whiskey === false || typeof whiskey_S === 'undefined' || !whiskey_S.g || whiskey_S.light || (typeof whiskey_unten === 'function' && whiskey_unten())) { setTimeout(() => subtitle('Okay. Langsam.', 1800, 'LUKE'), 900); return; }
  const W = whiskey_S, sp = kf_welt(.75, -.35, -.2, KF_V.v2); // Geländerende rechts vorn
  try { whiskey_setzen(sp.x, sp.y, sp.z, () => { whiskey_blick(Z.sitz.x, Z.sitz.y + 1.1, Z.sitz.z, 5); }); } catch (e) {}
  setTimeout(() => { const g = W.g && W.g.position; if (!g) return; // Nachahmung: Lukes Husten, einen Tick zu hoch, zu dumpf, zu schnell
    kf_ton('kfHusten', { gain: .5, rate: 1.12, lp: 2600, x: g.x, y: g.y + .25, z: g.z, ref: 4 }); try { whiskey_play && whiskey_play('EatSomething', .15); W.puff = Math.max(W.puff || 0, .8); } catch (e) {}
    setTimeout(() => subtitle('Sehr witzig.', 1800, 'LUKE'), 1500); }, 2600); }
// Vegas im Türrahmen (albers.js): Kette ab, Tür auf, ein Satz. Luke dreht nur den Kopf – nie von vorn zu sehen, er sitzt mit dem Rücken zur Tür
async function kf_vegas() { const Z = kf_Z; if (Z.vegas || typeof albers_S === 'undefined') return; const A = albers_S; if (A.busy) return; Z.vegas = true; Z.pause = true; A.busy = true;
  try { Audio.play && Audio.play('doorCreak', { gain: .35, rate: 1.1, x: A.door.x, y: 1.2, z: A.door.z, ref: 3 }); } catch (e) {}
  A.open = 1; A.wOpen = true; setTimeout(() => { A.wOpen = false; }, 200); // Figur sichtbar, Licht aus dem Türspalt (albers_door)
  await wait(900); { const dx = A.door.x + .2 - Z.sitz.x, dz = A.door.z + .45 - Z.sitz.z, y = Math.atan2(-dx, -dz); Z.blickY = kf_clamp(Math.atan2(Math.sin(y - Z.yaw), Math.cos(y - Z.yaw)), -2.3, 2.3); } await wait(1300);
  await say([['„Riecht wie fünfundsiebzig. Nur ohne die Herren.“', 3600, 'LARS VEGAS']]);
  await wait(400); Z.blickY = 0; await wait(900); A.open = 0; try { Audio.play(Audio.pick('woodClose1', 'woodClose2'), { gain: .45, x: A.door.x, y: 1.2, z: A.door.z, ref: 3 }); } catch (e) {} A.busy = false; Z.pause = false; }
// Sitzraum → Welt
function kf_welt(x, y, z, o) { return o.set(x, y, z).applyQuaternion(kf_R.seat.quaternion).add(kf_R.seat.position); }
// ---------------------------------------------------------------- Kamera: vom Stehen in den Sitz, Blick auf die Hände; atmet, zittert nach den Flashbacks
function kf_camFn(cam, dt) { const Z = kf_Z, S = kiffen_S, st = Z.saved; if (!st) return; const k = kf_io(Z.blend), t = performance.now() / 1000;
  const sp = kf_R.seat.position, br = Math.sin(t * 1.35) * .004 + Math.sin(t * .47) * .002;
  cam.position.set(kf_lerp(st.x, sp.x, k), kf_lerp(st.y, sp.y + br, k), kf_lerp(st.z, sp.z, k));
  Z.camY = kf_lerp(Z.camY, Z.camYz, Math.min(1, dt * 2.6)); Z.camP = kf_lerp(Z.camP, Z.camPz, Math.min(1, dt * 2.4)); if (Z.camFix) { Z.camY = Z.camFix[0]; Z.camP = Z.camFix[1]; if (Z.camFix[2]) cam.position.add(kf_welt(Z.camFix[2][0], Z.camFix[2][1], Z.camFix[2][2], KF_V.v4).sub(kf_R.seat.position)); }
  const z = S.zittern * .004, w = S.weich; const yaw = Z.yaw + Z.camY + Math.sin(t * .31) * .006 * (1 + w * 2) + Math.sin(t * 7.3) * z, pitch = Z.camP + Math.sin(t * .23) * .005 * (1 + w) + Math.sin(t * 8.1) * z;
  const dy = Math.atan2(Math.sin(yaw - st.yaw), Math.cos(yaw - st.yaw)); cam.rotation.set(kf_lerp(st.pitch, pitch, k), st.yaw + dy * k, Math.sin(t * .4) * .006 * w * k); }
function kf_hint(list) { const el = kiffen_S.hintEl; if (!el) return; if (!list) { el.classList.remove('on'); return; } el.querySelector('.t').innerHTML = list.map(([k, v]) => `<span><kbd>${trX(k)}</kbd> ${trX(v)}</span>`).join(''); el.classList.add('on'); }
function kf_prog(p) { const el = kiffen_S.hintEl; if (el) el.querySelector('.b i').style.width = (p === null ? 0 : Math.round(kf_clamp(p) * 100)) + '%'; if (el) el.querySelector('.b').style.opacity = p === null ? 0 : 1; }
// Ein Schritt: Promise bis p = 1
function kf_schritt(st) { const Z = kf_Z; Z.st = st; Z.p = 0; Z.akt = st.art === 'auto'; Z.tonI = 0; Z.radDone = false; Z.feuer = Z.feuer || false; kiffen_S.in.klick = 0; kiffen_S.in.ende = false;
  kf_hint(st.hint || null); kf_prog(st.art === 'maus' || st.art === 'halten' ? 0 : null);
  if (st.id === 'grinden' && Audio.ctx && Audio.buf.kfGrind) { Z.grindG = Audio.play('kfGrind', { gain: 0, loop: true, dest: Audio.master }); }
  return new Promise(res => { Z.res = res; }); }
function kf_schrittTick(dt, t) { const Z = kf_Z, st = Z.st, S = kiffen_S; if (!st) return;
  if (st.art === 'klick') { if (!Z.akt && (S.in.klick > 0 || S.in.test)) { Z.akt = true; S.in.klick = 0; kf_hint(null); } if (Z.akt) Z.p += dt / st.dauer; }
  else if (st.art === 'auto') Z.p += dt / st.dauer;
  else if (st.art === 'halten') { if (S.in.down || S.in.test) Z.p += dt / st.dauer; kf_prog(Z.p); }
  else if (st.art === 'maus') { Z.p += (Math.abs(S.in.dx) + Math.abs(S.in.dy)) / st.bedarf + (S.in.test ? dt / 1.5 : 0); kf_prog(Z.p); }
  else if (st.art === 'rauchen') { Z.p = .5; if (S.in.test && !Z.testZ) { Z.testZ = 1; } }
  Z.p = Math.min(1, Z.p); kf_eval(st, Z.p);
  if (st.ton) while (Z.tonI < st.ton.length && Z.p >= st.ton[Z.tonI][0] && (Z.akt || st.art !== 'klick')) { const [, n, g] = st.ton[Z.tonI++]; kf_ton(n, { gain: g }); }
  if (st.live && kf_lebend[st.live]) kf_lebend[st.live](dt, t);
  S.in.dx = 0; S.in.dy = 0;
  if (st.art === 'rauchen' ? Z.fertig : Z.p >= 1) { if (st.halt && !Z.halt) { Z.halt = st.halt; if (st.id === 'feuer') subtitle('<i>„Für Peter. Damit du im Dunkeln nicht allein bist. – M.“</i>', 4200); return; } if (Z.halt > 0) { Z.halt -= dt; if (Z.halt > 0) return; } Z.halt = 0;
    if (Z.grindG) { try { Z.grindG.stop(.2); } catch (e) {} Z.grindG = null; } kf_hint(null); kf_prog(null); const r = Z.res; Z.res = null; Z.st = null; r && r(); } }
// Feder-Schicht über den Schlüsselbildern: Hände beschleunigen, bremsen, schwingen leicht nach (kritisch gedämpft, ζ < 1) – nie lineares Gleiten
const kf_SP = { L: null, R: null, init: false };
function kf_federInit() { for (const s of ['L', 'R']) { const P = kf_P[s]; kf_SP[s] = { w: P.w.clone(), wv: new THREE.Vector3(), f: P.f.clone(), fv: new THREE.Vector3(), n: P.n.clone(), nv: new THREE.Vector3(), c: P.c.slice(), cv: [0, 0, 0, 0, 0], t: P.t, tv: 0 }; } kf_SP.init = true; }
function kf_feder1(x, v, ziel, om, ze, dt) { const a = om * om * (ziel - x) - 2 * ze * om * v; v += a * dt; return [x + v * dt, v]; }
function kf_federV(x, v, ziel, om, ze, dt) { const V = KF_V.v4.copy(ziel).sub(x).multiplyScalar(om * om).addScaledVector(v, -2 * ze * om); v.addScaledVector(V, dt); x.addScaledVector(v, dt); }
function kf_feder(dt) { if (!kf_SP.init) kf_federInit(); const h = Math.min(dt, 1 / 30), n = dt > 1 / 60 ? 2 : 1, st = h / n;
  for (const s of ['L', 'R']) { const P = kf_P[s], F = kf_SP[s];
    for (let k = 0; k < n; k++) { kf_federV(F.w, F.wv, P.w, 13, .78, st); kf_federV(F.f, F.fv, P.f, 15, .8, st); kf_federV(F.n, F.nv, P.n, 15, .8, st);
      for (let i = 0; i < 5; i++) { const om = 17 + i * 1.5; const r = kf_feder1(F.c[i], F.cv[i], P.c[i], om, .72, st); F.c[i] = r[0]; F.cv[i] = r[1]; } const r = kf_feder1(F.t, F.tv, P.t, 16, .75, st); F.t = r[0]; F.tv = r[1]; }
    P.w.copy(F.w); P.f.copy(F.f).normalize(); P.n.copy(F.n).normalize(); for (let i = 0; i < 5; i++) P.c[i] = F.c[i]; P.t = F.t; } }
// Alles aus dem Zustand auf die Bühne
function kf_anwenden(dt, t) { const Z = kf_Z, S = kiffen_S, st = Z.st; const za = S.zittern;
  if (st) for (const s of ['L', 'R']) { const P = kf_P[s]; if (za > 0) { P.w.x += (Math.sin(t * 9.1 + (s === 'L' ? 0 : 2)) + Math.sin(t * 13.7)) * .0007 * za; P.w.y += Math.sin(t * 11.3 + (s === 'L' ? 1 : 3)) * .0008 * za; }
    P.w.y += Math.sin(t * 1.35) * .003; }
  if (st) { for (const s of ['L', 'R']) { const c = kf_P[s].c; for (let i = 0; i < 5; i++) c[i] += Math.sin(t * (1.3 + i * .37) + i * 1.9 + (s === 'L' ? 0 : 2.3)) * .012 * (1 + za * 2); } // lebendige Finger
    kf_feder(dt); for (const s of ['L', 'R']) kf_applyHand(s, kf_P[s]); }
  // Requisiten nach Schlüsseln (aus dem aktuellen Schritt)
  if (st) { const K = st.keys; let a = K[0], b = K[K.length - 1], k = 0; for (let i = 0; i < K.length - 1; i++) if (Z.p >= K[i][0] && Z.p <= K[i + 1][0]) { a = K[i]; b = K[i + 1]; k = kf_io((Z.p - a[0]) / Math.max(1e-6, b[0] - a[0])); break; }
    if (Z.p > K[K.length - 1][0]) { a = b; k = 1; } for (const n in kf_PR) if (n !== 'glutSprite') kf_propSetzen(n, a[1].pr[n], b[1].pr[n], k); }
  if (st && st.live === 'rauchen') { const bl = kf_PR.blatt.o, B = kf_R.B.R; if (kiffen_S.mo && B.f[1][1] && B.f[2][1]) { // zwischen Zeige- und Mittelfinger geklemmt, Filter zur Handflächenseite
      kf_R.rig.updateMatrixWorld(true); const j = KF_V.v2.setFromMatrixPosition(B.f[1][1].matrixWorld).add(KF_V.v3.setFromMatrixPosition(B.f[2][1].matrixWorld)).multiplyScalar(.5); kf_R.seat.worldToLocal(j);
      const n = kf_P.R.n; bl.position.copy(j).addScaledVector(n, -.024); bl.quaternion.setFromUnitVectors(KF_V.v3.set(1, 0, 0), n); }
    else { const O = KF_ORT; kf_keyLage({ p: O.JH, d: O.dH }, kf_kp[0], kf_kq[0]); kf_keyLage({ p: O.JM, d: O.dM }, kf_kp[1], kf_kq[1]); const k = kf_ease(Z.zug); bl.position.lerpVectors(kf_kp[0], kf_kp[1], k); bl.quaternion.slerpQuaternions(kf_kq[0], kf_kq[1], k); }
    bl.visible = true; }
  // Kanäle
  const g = kf_PR.deckel.o, gb = kf_PR.koerper.o; if (g.visible) { g.rotateOnAxis(KF_V.v0.set(0, 1, 0), kf_CH.deckelD); }
  if (kf_PR.einsatz) { const e = kf_PR.einsatz.o; e.visible = gb.visible && kf_CH.einsatz > .5; if (e.visible) { e.position.copy(gb.position); e.quaternion.copy(gb.quaternion); e.translateY((S.gr ? S.gr.cut : .027) - .001); e.rotateX(-Math.PI / 2); } }
  const kn = kf_PR.knolle.o; kn.scale.setScalar(kf_CH.knolle);
  kf_PA.mulde = kf_CH.mulde; if (!(st && (st.live === 'rollen'))) kf_PA.rolle = kf_CH.rolle; kf_PA.spitze = kf_CH.spitze; kf_PA.kegel = kf_CH.kegel; kf_PA.brand = kf_CH.brand; if (!(st && st.live === 'kleben')) kf_PA.nass = kf_CH.nass;
  const bl = kf_PR.blatt.o; if (bl.visible) { const sl = kf_CH.blatt; bl.scale.set(kf_lerp(.2, 1, sl), 1, 1); kf_papUpdate(bl.children[0]); }
  kf_TA.falt = kf_CH.falt; kf_TA.roll = kf_CH.tipRoll; const tp = kf_PR.tip.o; if (tp.visible) { kf_tipUpdate(tp.children[0]); if (st && st.keys[st.keys.length - 1][1].pr.tip && st.keys[st.keys.length - 1][1].pr.tip.tip && Z.p > .95) { kf_jointPunkt(.07, tp.position); tp.quaternion.copy(bl.quaternion); tp.rotateY(Math.PI / 2); } }
  if (Z.st && (Z.st.id === 'rollen' || Z.st.id === 'lecken' || Z.st.id === 'kleben' || Z.st.id === 'spitze' || Z.st.id === 'feuer' || Z.st.id === 'rad' || Z.st.id === 'anzuenden' || Z.st.id === 'weg' || Z.st.id === 'rauchen' || Z.st.id === 'aufstehen')) { if (tp.visible || kf_CH.tipRoll > .9) { tp.visible = bl.visible; kf_jointPunkt(.035, tp.position); tp.quaternion.copy(bl.quaternion); tp.rotateY(Math.PI / 2); tp.scale.setScalar(kf_lerp(1, .82, kf_clamp(kf_PA.rolle - .5))); } }
  kf_kruemelTick(dt);
  // Flamme, Glut, Licht
  const T = kf_T, fz = kf_PR.feuerzeug.o, L = S.vl; const fl = kf_CH.flamme > .5 && fz.visible;
  T.flamme.visible = fl; if (fl) { T.flamme.position.copy(fz.position).add(KF_V.v4.set(0, .061, 0).applyQuaternion(fz.quaternion)); if (Z.st && Z.st.id === 'anzuenden') T.flamme.position.lerp(kf_jointPunkt(1, KF_V.v3), .35);
    const fk = .85 + Math.sin(t * 31) * .06 + Math.sin(t * 17.3) * .08 + (Math.random() - .5) * .05; T.flamme.scale.set(.011 * fk, .026 * (fk + .1 * Math.sin(t * 9)), 1); T.flamme.material.opacity = .95; T.flamme.material.rotation = Math.sin(t * 3.1) * .08 + (Z.st && Z.st.id === 'anzuenden' ? -.5 : 0); }
  const gl = kf_CH.glut; T.glut.visible = gl > .02 && bl.visible; if (T.glut.visible) { kf_jointPunkt(1 - kf_PA.brand * .72, T.glut.position); const f = gl * (.8 + Math.sin(t * 13) * .1 + Math.sin(t * 5.3) * .1); T.glut.material.opacity = kf_clamp(f); T.glut.scale.setScalar(.008 + .01 * f); }
  if (L) { const w = KF_V.v3; if (fl) { L.color.setHex(0xffa24a); L.intensity = .55 * (.85 + Math.sin(t * 29) * .08 + Math.sin(t * 13.7) * .05 + Math.random() * .05); L.distance = 1.8; kf_welt(T.flamme.position.x, T.flamme.position.y + .02, T.flamme.position.z, w); L.position.copy(w); }
    else if (Z.hell) { L.color.setHex(0xfff0dc); L.intensity = Z.hell; L.distance = 3; kf_welt(.3, .4, .2, w); L.position.copy(w); }
    else if (T.glut.visible) { L.color.setHex(0xff6a20); L.intensity = .1 * gl; L.distance = .6; kf_welt(T.glut.position.x, T.glut.position.y, T.glut.position.z, w); L.position.copy(w); } else L.intensity = 0; }
  if (Z.flTon && !fl) { try { Z.flTon.stop(.15); } catch (e) {} Z.flTon = null; }
}
// Verandalampe von Nr. 3 (porchLights[0]) während der Szene an – Vegas hat das Licht angemacht; danach wie vorher
function kf_veranda(an) { const Z = kf_Z, p = typeof porchLights !== 'undefined' && porchLights[0]; if (!p) return; if (an) { if (Z.porchWar === undefined) Z.porchWar = !!p.dead; p.dead = false; } else if (Z.porchWar !== undefined) { p.dead = Z.porchWar; Z.porchWar = undefined; } }
// Sitzplatz messen (Verandakante) und die Bühne dorthin setzen
function kf_sitzMessen(x, z) { const y = kf_boden(x, z, 1.3, 1.4); return y === null || y > .9 ? .35 : y; } // Verandadielen (unter dem Dach messen)
function kf_buehne(opts) { const Z = kf_Z, s = opts.sitz || [KF_SITZ.x, null, KF_SITZ.z, KF_SITZ.yaw]; Z.yaw = s[3]; const y0 = s[1] ?? kf_sitzMessen(s[0] + Math.sin(Z.yaw) * .25, s[2] + Math.cos(Z.yaw) * .25);
  Z.sitz.set(s[0], y0, s[2]); kf_R.seat.position.set(s[0] - Math.sin(Z.yaw) * .05, y0 + KF_SITZ.auge, s[2] - Math.cos(Z.yaw) * .05); kf_R.seat.rotation.set(0, Z.yaw, 0); kf_R.seat.updateMatrixWorld(true);
  kf_R.rig.visible = true; kf_R.seat.visible = true; for (const c of kf_T.kr) { c.st = 0; } kf_T.krN = 0; Object.assign(kf_PA, { mulde: 0, rolle: 0, spitze: 0, brand: 0, kegel: 0, nass: 0 }); Object.assign(kf_TA, { falt: 0, roll: 0 }); }
// ---------------------------------------------------------------- Die Szene
async function kiffen_szene(opts = {}) {
  const S = kiffen_S, Z = kf_Z; if (!S.ready || Z.on) return false; if (!kf_R.ready) { console.warn('Kiffen: Hände fehlen'); return false; }
  Z.on = true; S.szene = true; Z.opts = opts; state.talking = true; Z.fertig = false; Z.zuege = 0; Z.hustet = false; Z.vegas = false; Z.feuer = false; Z.radN = 0; Z.endHint = false; Z.blickY = 0; Z.pause = false; Z.halt = 0; Z.lidA = 0; Z.ausT = 0; Z.zug = 0; Z.mo = null; Z.klopf = 0; Z.klopfT = 0;
  Z.saved = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: player.yaw, pitch: player.pitch, px: player.pos.x, py: player.pos.y, pz: player.pos.z };
  kf_buehne(opts); kf_veranda(true); kf_eval(KF_STEPS[0], 0); kf_SP.init = false; Z.camY = 0; Z.camP = player.pitch; Z.blend = 0; Z.blendZ = 1; flashOn = false;
  setScripted(() => { player.yaw = Z.saved.yaw; player.pitch = Z.saved.pitch; return true; }); setCamOverride(kf_camFn);
  if (typeof spannung_hush === 'function') try { spannung_hush(20); } catch (e) {}
  try { for (const st of KF_STEPS) { if (st.id === 'aufstehen') break; await kf_schritt(st); } await kf_schritt(KF_STEPS[KF_STEPS.length - 1]); }
  catch (e) { console.error('Kiffen: Szene', e); }
  // aufstehen: Kamera zurück, der Stummel landet in Vegas' Aschenbecher
  Z.blendZ = 0; await wait(1800); if (S.aschStummel) S.aschStummel.visible = true;
  for (const n in kf_PR) kf_PR[n].o.visible = false; kf_T.glut.visible = kf_T.flamme.visible = false; kf_T.krP.visible = false; kf_R.rig.visible = false; if (S.vl) S.vl.intensity = 0;
  const sv = Z.saved; player.pos.set(sv.px, sv.py, sv.pz); kf_veranda(false); setScripted(null); setCamOverride(null); state.talking = false; Z.on = false; S.szene = false; S.done = true; Z.st = null;
  if (story.side.kf_fuenf) sideDone('kf_fuenf', 'Fünf Minuten auf Vegas’ Veranda. Es waren eher zwölf.'); S.auf = 'fertig';
  for (const k of ['kf_grinder', 'kf_papes', 'kf_knolle', 'kf_tips']) { const i = story.items.indexOf(k); if (i >= 0 && k !== 'kf_grinder') story.items.splice(i, 1); } // Grinder bleibt in der Jacke
  if (typeof gedanke === 'function') gedanke('kf_danach', 'Zwölf Minuten, nicht fünf. Reicht trotzdem.', 9000, 3);
  try { saveGame(kf_kap()); } catch (e) {} return true; }
// Weiche Welt, Zeitlupe, Ruhe (läuft nach der Szene weiter, insgesamt ~80 s ab dem ersten Zug)
const KF_WEICH = 80;
function kf_weichTick(rdt, t) { const S = kiffen_S; if (S.weichZiel <= 0 && S.weich <= .001) { if (S.pass && S.pass.enabled && !S.flashAn) S.pass.enabled = false; S.zeit = 1; return; }
  S.weichT += rdt; if (S.weichT > KF_WEICH - 14 && !kf_Z.on) S.weichZiel = Math.max(0, 1 - (S.weichT - (KF_WEICH - 14)) / 14);
  if (S.weichT > KF_WEICH && !kf_Z.on) S.weichZiel = 0;
  S.weich = kf_lerp(S.weich, S.weichZiel, Math.min(1, rdt * .35)); if (S.pass) { S.pass.enabled = true; S.pass.uniforms.uW.value = S.weich * .9; }
  S.zeit = 1 - .16 * kf_clamp(S.weich); // leichte Zeitlupe der Welt
  if (S.weich > .05) { if (typeof fear !== 'undefined') fear.v = Math.min(fear.v, .05); if (typeof SP !== 'undefined') { SP.peak = Math.min(SP.peak, SP.t - 600); SP.lastMinor = Math.max(SP.lastMinor, SP.t - 20); SP.lastMajor = Math.max(SP.lastMajor, SP.t - 20); } S.zittern = Math.max(0, S.zittern - rdt * .05 * S.weich); } // Zittern klingt beim Rauchen ab
  if (Audio.world && Audio.ctx) { const g = 1 - .45 * kf_clamp(S.weich); if (Math.abs(g - S.worldG) > .02) { S.worldG = g; Audio.world.gain.setTargetAtTime(g, Audio.ctx.currentTime, .6); } } }

// ================================================================ Flashbacks (Nachbild-Stil): kurze Schnitte, Ton-Abriss, Herzschlag – danach zittern die Hände
async function kiffen_flash(opts = {}) { const S = kiffen_S; if (!S.pass || S.flashAn) return; S.flashAn = true; const U = S.pass.uniforms; S.pass.enabled = true; const was = state.talking; state.talking = true;
  const ctxT = () => Audio.ctx ? Audio.ctx.currentTime : 0; const cut = on => { try { if (Audio.world) Audio.world.gain.setTargetAtTime(on ? 0 : 1, ctxT(), on ? .01 : .5); if (Audio.hushG) Audio.hushG.gain.setTargetAtTime(on ? 0 : 1, ctxT(), on ? .01 : .8); } catch (e) {} };
  const bild = async (i, ms, tint) => { U.tFl.value = S.flTex[i]; U.uTint.value.set(...tint); kf_ton('kfSchnitt', { gain: .7 }); U.uFl.value = 1; U.uZoom.value = 0; glitchV = .6; shake = Math.max(shake, .03);
    const t0 = performance.now(); while (performance.now() - t0 < ms) { const k = (performance.now() - t0) / ms; U.uZoom.value = k; U.uFl.value = k < .15 ? 1 : 1 - (k - .15) * .25; U.uT.value = performance.now() / 1000; await wait(16); }
    U.uFl.value = 0; U.uCut.value = 1; };
  try { cut(true); kf_ton('kfTinnitus', { gain: .55 }); Audio.heart && Audio.heart(); await wait(120);
    await bild(0, 780, [.82, .93, 1.18]); await wait(230); U.uCut.value = 0; await wait(260); Audio.heart && Audio.heart();
    await bild(1, 560, [1.15, .92, .82]); await wait(180); U.uCut.value = 0; await wait(220);
    await bild(2, 950, [.8, 1, .98]); await wait(420); Audio.heart && Audio.heart();
    U.uCut.value = 0; cut(false); kf_ton('kfAtemFlash', { gain: .5 }); shake = Math.max(shake, .02); S.zittern = 1; setTimeout(() => Audio.heart && Audio.heart(), 900); setTimeout(() => Audio.heart && Audio.heart(), 1800);
  } finally { U.uFl.value = 0; U.uCut.value = 0; S.flashAn = false; if (S.weich <= .001) S.pass.enabled = false; state.talking = was; } }

// ================================================================ Aufgabe „Fünf Minuten“
function kf_aufgabeText() { const S = kiffen_S, L = [];
  const ort = id => S.echt[id] ? KF_FUNDE[id].ort : (KF_FUNDE[id].ortRueck || KF_FUNDE[id].ort);
  L.push((kf_hat('kf_grinder') ? '✓ ' : '· ') + 'Grinder – ' + ort('grinder')); L.push((kf_hat('kf_papes') ? '✓ ' : '· ') + 'Blättchen – ' + ort('papes'));
  L.push((kf_hat('kf_knolle') ? '✓ ' : '· ') + 'Etwas zum Drehen – ' + ort('knolle')); L.push((kf_hat('kf_tips') ? '✓ ' : '· ') + 'Tips – ' + ort('tips'));
  if (S.auf === 'bereit') L.push('Vegas’ Veranda, Nr. 3. Hinsetzen.'); return L.join('\n'); }
function kf_aufgabeSync() { const q = story.side.kf_fuenf; if (!q) return; if (q.state !== 'done') q.desc = kf_aufgabeText(); try { updateSideInfo(); } catch (e) {} }
async function kiffen_start(opts = {}) { const S = kiffen_S; if (S.auf !== 'aus' || !S.ready) return false; S.auf = 'flash';
  await kiffen_flash(opts); await wait(900); subtitle('Ich brauch fünf Minuten. Nur fünf.', 3200, 'LUKE'); await wait(2600);
  S.auf = 'suche'; sideStart('kf_fuenf'); kf_aufgabeSync(); kf_fundeSync(); try { saveGame(kf_kap()); } catch (e) {} return true; }
function kf_alle() { return ['kf_grinder', 'kf_papes', 'kf_knolle', 'kf_tips'].every(kf_hat); }
function kf_gefunden(id) { const S = kiffen_S, F = KF_FUNDE[id]; if (kf_hat(F.item)) return; kiffen_nimm(F.item); S.funde.add(id);
  const tx = S.echt[id] ? F.text : (F.textRueck || F.text); if (tx) subtitle(tx, 3600, id === 'knolle' ? '' : 'LUKE'); if (F.luke) setTimeout(() => subtitle(F.luke, 2000, 'LUKE'), 3900);
  Audio.play && Audio.play('keys2', { gain: .16, rate: 1.5, dur: .3 }); kf_fundeSync(); if (kf_alle() && S.auf === 'suche') { S.auf = 'bereit'; setTimeout(() => { questPop('FÜNF MINUTEN', 'Vegas’ Veranda, Nr. 3'); if (typeof gedanke === 'function') gedanke('kf_bereit', 'Alles da. Vegas’ Veranda. Da sieht mich keiner. Außer Vegas. Und dem Vogel.', 1500, 3); }, 4200); }
  kf_aufgabeSync(); }
// Tips bei Vegas: durch den Türspalt (albers.js), solange es seine Küche noch nicht gibt (AP-19 → kiffen_fund('tips', pos))
async function kf_vegasTips() { if (kf_hat('kf_tips')) return; const say1 = [['„Tips? Nimm den Pappdeckel von den Streichhölzern. Hab ich ’75 auch so gemacht.“', 4200, 'LARS VEGAS']];
  const f = async () => { await wait(500); Audio.play && Audio.play('paper1', { gain: .2 }); kf_gefunden('tips'); };
  if (typeof albers_whiskey === 'function') { const ok = await albers_whiskey([...say1, f]); if (ok) return; } await say(say1); await f(); }

// ================================================================ Fundorte (Aufgabe) und Weltdeko
// Rückfall-Fundorte, die es schon gibt: Nr. 4 von außen (Podest vor der Haustür, „lose Stufe“), Roxys Laube (Schrebergärten, Parzelle mit Licht), Vegas' Tür
const KF_ORTE = {
  grinder: { at: [-27.42, null, 12.22], ry: 0 }, papes: { at: [-27.3, null, 12.02], ry: 1.9 },
  knolle: { at: [-109.9, 0, 24.05], ry: 1.2, hit: [.6, .5, .6] }, tips: { tuer: true } };
function kf_boden(x, z, von = 2.4, bis = 3.2) { try { const rc = new THREE.Raycaster(new THREE.Vector3(x, von, z), new THREE.Vector3(0, -1, 0), 0, bis); rc.camera = camera; const h = rc.intersectObjects(scene.children, true).find(h => h.object.visible && !h.object.isSprite && !h.object.isPoints && !(h.object.material && (h.object.material.transparent || h.object.material.visible === false)) && !kf_istMein(h.object));
  return h ? h.point.y : null; } catch (e) { return null; } }
function kf_istMein(o) { for (let p = o; p; p = p.parent) if (p === kf_R.seat || (p.userData && p.userData.kf)) return true; return false; }
async function kf_modell(key, size, axis = 'y') { const src = await msModel(key, 'model.glb'); const o = src.clone(true); o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); if (size) msFit(o, size, axis); const g = msGround(o); g.userData.kf = true; return g; }
function kf_hit(w, h, d, x, y, z, label, act) { const m = box(w, h, d, x, y, z, hidden, { cast: false }); m.userData.noCol = true; m.userData.kf = true; interact(m, label, act); return m; }
async function kf_fundeBau() { const S = kiffen_S;
  // Nr. 4: Lukes Versteck von 2016 unter der losen Stufe vor der Tür (bis AP-15 das Zimmer baut)
  for (const id of ['grinder', 'papes']) { const O = KF_ORTE[id]; const o = id === 'grinder' ? await kf_modell('kiffen/grinder', .047) : await kf_modell('kiffen/papes', .105, 'max');
    const y = O.at[1] ?? (kf_boden(O.at[0], O.at[2], 1.2, 1.3) ?? .45); o.position.set(O.at[0], y, O.at[2]); o.rotation.y = O.ry; o.visible = false; scene.add(o); S.fundObj[id] = o; }
  // Roxys Laube: Topfpflanzen neben der Tür, darunter das Tütchen mit dem Zettel
  { const O = KF_ORTE.knolle, y = kf_boden(O.at[0], O.at[2]) ?? 0; const o = new THREE.Group(); o.userData.kf = true; const t = await kf_modell('kiffen/tuetchen', .07, 'max'); t.rotation.y = .4; o.add(t);
    const zt = kf_cnv(256, 192, (x, w, h) => { x.fillStyle = '#efe8d6'; x.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(120,150,190,.35)'; x.beginPath(); x.moveTo(0, 30 + i * 28); x.lineTo(w, 30 + i * 28); x.stroke(); }
      x.fillStyle = 'rgba(30,40,120,.9)'; x.font = '34px Caveat, cursive'; x.fillText('Für schlechte', 22, 70); x.fillText('Nächte. R.', 40, 118); x.strokeStyle = 'rgba(30,40,120,.8)'; x.beginPath(); x.arc(196, 108, 9, 0, 6); x.stroke(); });
    const zm = new THREE.Mesh(new THREE.PlaneGeometry(.075, .056), new THREE.MeshStandardMaterial({ map: tex(zt, true), roughness: .9, side: THREE.DoubleSide })); zm.rotation.set(-Math.PI / 2, 0, .3); zm.position.set(.045, .003, .03); zm.castShadow = true; o.add(zm);
    o.position.set(O.at[0], y, O.at[2]); o.rotation.y = O.ry; o.visible = false; scene.add(o); S.fundObj.knolle = o; }
  S.fundHit.grinder = kf_hit(.6, .35, .5, -27.36, (S.fundObj.grinder.position.y || .45) + .1, 12.12, () => 'Lose Stufe', () => { kf_gefunden('grinder'); kf_gefunden('papes'); });
  S.fundHit.knolle = kf_hit(.6, .45, .6, KF_ORTE.knolle.at[0], (S.fundObj.knolle.position.y || 0) + .2, KF_ORTE.knolle.at[2], 'Unter dem Blumentopf', () => kf_gefunden('knolle'));
  S.fundHit.tips = kf_hit(1.1, 2.1, .35, -28, 1.5, -12.05, 'Vegas nach Tips fragen', () => kf_vegasTips());
  S.sitzHit = kf_hit(1.4, .9, .8, KF_SITZ.x, .7, KF_SITZ.z - .15, 'Hinsetzen · fünf Minuten', () => kiffen_szene({}));
  for (const k in S.fundHit) uninteract(S.fundHit[k]); uninteract(S.sitzHit);
  S.fundBereit = true; for (const [id, v] of Object.entries(S.fundPos || {})) if (v) kiffen_fund(id, v[0], v[1]); }
// Kapitel-Ort ersetzt den Rückfall: kiffen_fund('grinder', [x, y, z, ry]) (AP-15 Nr. 4 innen) · kiffen_fund('tips', [x, y, z]) (AP-19 Vegas' Küche)
function kiffen_fund(id, pos, o = {}) { const S = kiffen_S; if (!KF_FUNDE[id]) return false; S.echt[id] = !!pos; (S.fundPos || (S.fundPos = {}))[id] = pos ? [pos, o] : null;
  if (!S.fundBereit) return true; // Module vor „kiffen“ in ORDER (nr4.js): Ort merken, nach dem Aufbau anwenden
  if (!pos) { kf_aufgabeSync(); return true; }
  if (id === 'tips') { if (!S.tipObj) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.052, .036), new THREE.MeshStandardMaterial({ map: kf_texPappe(), roughness: .95, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.castShadow = true; const g = new THREE.Group(); g.add(m); g.userData.kf = true; scene.add(g); S.tipObj = g; S.fundObj.tips = g; }
    uninteract(S.fundHit.tips); S.fundHit.tips = kf_hit(.3, .2, .3, pos[0], pos[1] + .05, pos[2], o.label || 'Streichholzschachtel', () => { subtitle('„Tips? Nimm den Pappdeckel von den Streichhölzern. Hab ich ’75 auch so gemacht.“', 4200, 'LARS VEGAS'); kf_gefunden('tips'); }); uninteract(S.fundHit.tips); }
  const ob = S.fundObj[id]; if (ob) { ob.position.set(pos[0], pos[1], pos[2]); ob.rotation.y = pos[3] || 0; }
  const h = S.fundHit[id === 'papes' ? 'papes' : id]; if (id === 'papes' && !S.fundHit.papes) { S.fundHit.papes = kf_hit(.3, .25, .3, pos[0], pos[1] + .08, pos[2], o.label || 'Hinter dem Poster', () => kf_gefunden('papes')); uninteract(S.fundHit.papes); }
  else if (h) { h.position.set(pos[0], pos[1] + .1, pos[2]); if (o.label) h.userData.label = o.label; if (id === 'grinder') h.userData.action = () => kf_gefunden('grinder'); }
  kf_aufgabeSync(); kf_fundeSync(); return true; }
function kf_fundeSync() { const S = kiffen_S, suche = S.auf === 'suche' || S.auf === 'bereit';
  for (const id of ['grinder', 'papes', 'knolle', 'tips']) { const o = S.fundObj[id], h = S.fundHit[id], F = KF_FUNDE[id], offen = suche && !kf_hat(F.item); if (o) o.visible = offen; if (h) { const on = interactables.includes(h); if (offen && !on) interactables.push(h); else if (!offen && on) uninteract(h); } }
  const sitz = S.auf === 'bereit' && !kf_Z.on, on = interactables.includes(S.sitzHit); if (sitz && !on) interactables.push(S.sitzHit); else if (!sitz && on) uninteract(S.sitzHit); }
// ---------------------------------------------------------------- Weltdeko: nur an Orten, die es gibt; sichtbar ab Kapitel k (kapAb)
const KF_DEKO_TEXT = {
  dub: 'Kellerdub Soundsystem, Jugendzentrum Kreisstadt. Klingt nach Keller. Klingt nach Mike.',
  tanke: 'Blättchen neunzig Cent. Darunter, in Kuli: „– M.“ Mike hat die Preise selbst geschrieben.',
  hanfTanke: 'Ein Hanfblatt auf der Wand einer Tankstelle. Mutig, Mike.',
  theke: 'Blättchen neben den Kaugummis. Und ein Feuerzeug, an einer Schnur festgebunden. Mike kannte seine Kundschaft.',
  hanfBus: 'Halb abgekratzt. Irgendwer hat hier auf den Bus gewartet und die Zeit genutzt.',
  reggaeBus: '„One Love, Abgrund.“ Der Bus kommt trotzdem nicht.',
  feuerBus: 'Ein Feuerzeug auf der Bank. Leer. Wie der Fahrplan.',
  auto: 'Auf dem Armaturenbrett: Blättchen und ein Feuerzeug. Der Fahrer hatte Prioritäten.',
  bong: 'Eine Bong. In der Remise. Zwischen dem Heu. Brandschutz war hier nie ein Thema.',
  pflanzen: 'Die Growlampe ist aus. Die Pflanzen haben trotzdem durchgehalten. Respekt.',
  ascher: 'Vegas’ Aschenbecher. Voll mit Kippen ohne Filter.', ascher2: 'Vegas’ Aschenbecher. Kippen ohne Filter. Und seit heute ein Stummel mit.' };
function kf_klebRay(art, ox, oy, oz, dx, dy, dz, o = {}) { try { const rc = new THREE.Raycaster(new THREE.Vector3(ox, oy, oz), new THREE.Vector3(dx, dy, dz).normalize(), 0, o.weit || 2.5); rc.camera = camera;
  const h = rc.intersectObjects(scene.children, true).find(h => h.object.visible && h.face && !h.object.isSprite && !kf_istMein(h.object) && !(h.object.material && h.object.material.visible === false) && (o.glas || !(h.object.material && h.object.material.transparent)));
  if (!h) return null; const n = h.face.normal.clone().transformDirection(h.object.matrixWorld); if (n.dot(rc.ray.direction) > 0) n.negate(); const p = h.point.addScaledVector(n, .004);
  const m = kiffen_poster(art, p.x, p.y, p.z, Math.atan2(n.x, n.z), o); if (m && Math.abs(n.y) > .5) m.lookAt(p.x + n.x, p.y + n.y, p.z + n.z); return m; } catch (e) { console.warn('Kiffen: Aufkleber', art, e); return null; } }
async function kiffen_deko() { const S = kiffen_S, D = S.deko; const add = (o, k, text, hit) => { if (!o) return; o.userData.kf = true; o.visible = false; const e = { o, k, text, hit: null }; if (hit) { e.hit = kf_hit(...hit, 'Ansehen', () => subtitle(typeof e.text === 'function' ? e.text() : e.text, 4200, 'LUKE')); uninteract(e.hit); } D.push(e); return e; };
  try {
    // Tankstelle Kranz (Mikes Tankstelle): Poster an der Rückwand innen, Preisaushang, Aufkleber außen, Blättchen und Feuerzeug auf der Theke
    add(kiffen_poster('dub', 109.3, 1.72, 30.735, Math.PI), 1, KF_DEKO_TEXT.dub, [.5, .7, .3, 109.3, 1.72, 30.6]);
    add(kiffen_poster('tanke', 106.265, 1.62, 27.6, Math.PI / 2), 1, KF_DEKO_TEXT.tanke, [.3, .5, .4, 106.4, 1.62, 27.6]);
    add(kiffen_poster('hanf', 116.9, 1.46, 24.862, Math.PI, { rz: .2 }), 1, KF_DEKO_TEXT.hanfTanke, [.25, .25, .25, 116.9, 1.46, 24.8]);
    { const ty = kf_boden(111.1, 25.9, 1.6, 1.2) ?? .95; const g = new THREE.Group(); g.position.set(111.15, ty, 25.9); for (const [dx, dz, r] of [[0, 0, .2], [.035, .01, .5], [.015, -.02, -.3]]) { const p = await kf_modell('kiffen/papes', .105, 'max'); p.position.set(dx, 0, dz); p.rotation.y = r; p.children[0].rotation.x = Math.PI / 2 * 0; g.add(p); }
      const f = await kf_modell('w_lighter', .06); f.position.set(.13, 0, .03); f.rotation.set(0, .9, 0); g.add(f); scene.add(g); add(g, 1, KF_DEKO_TEXT.theke, [.4, .25, .3, 111.2, ty + .08, 25.9]); }
    // Bushaltestelle Kirchberg: zwei Aufkleber an der Rückwand, ein Feuerzeug auf der Bank
    add(kiffen_poster('hanf', 11.9, 1.28, 51.99, 0, { rz: -.35 }), 1, KF_DEKO_TEXT.hanfBus, [.25, .25, .2, 11.9, 1.28, 52.05]);
    add(kiffen_poster('reggae', 9.35, .98, 51.99, 0, { rz: .12 }), 1, KF_DEKO_TEXT.reggaeBus, [.3, .2, .2, 9.35, .98, 52.05]);
    { const by = kf_boden(10.55, 52.4, 1.2, 1) ?? .47; const f = await kf_modell('w_lighter', .06); f.rotation.set(Math.PI / 2, 0, .6); f.position.set(10.55, by + .014, 52.4); scene.add(f); add(f, 1, KF_DEKO_TEXT.feuerBus, [.25, .2, .25, 10.55, by + .05, 52.4]); }
    // beiges Auto vor Nr. 2 (strasse.js): Blättchen + Feuerzeug auf dem Armaturenbrett (Höhe gemessen)
    for (const dx of [.95, -.95]) { const y = kf_boden(-49.5 + dx, 3.1 + .25, 1.28, .5); if (y !== null && y > .8 && y < 1.2) { const g = new THREE.Group(); g.position.set(-49.5 + dx, y, 3.1 + .25); const p = await kf_modell('kiffen/papes', .105, 'max'); p.rotation.y = 1.2; g.add(p); const f = await kf_modell('w_lighter', .055); f.rotation.set(Math.PI / 2, 0, .3); f.position.set(.02, .012, -.14); g.add(f); scene.add(g); add(g, 1, KF_DEKO_TEXT.auto); break; } }
    // Remise (Hof): Bong neben dem Heu
    { const y = kf_boden(-126.9, -34.6) ?? 0; const b = await kf_modell('kiffen/bong', .36); b.position.set(-126.9, y, -34.6); b.rotation.y = .7; b.traverse(m => { if (m.isMesh && m.material.transparent) { m.material.depthWrite = false; m.material.envMapIntensity = .45; m.material.roughness = .12; m.castShadow = false; } }); scene.add(b); add(b, 1, KF_DEKO_TEXT.bong, [.35, .5, .35, -126.9, y + .2, -34.6]); }
    // Roxys Laube: zwei Topfpflanzen an der Tür (die Knolle darunter gehört zur Aufgabe), Aufkleber an der Laube
    { const y = kf_boden(-109.95, 23.55) ?? 0; const p1 = await kf_modell('kiffen/pflanze', 1.02); p1.position.set(-109.95, y, 23.55); p1.rotation.y = 2.1; scene.add(p1); add(p1, 1, KF_DEKO_TEXT.pflanzen, [.7, 1.1, .7, -109.95, y + .55, 23.55]);
      const y2 = kf_boden(-109.85, 26.55) ?? 0; const p2 = await kf_modell('kiffen/topf', .72); p2.position.set(-109.85, y2, 26.55); p2.rotation.y = -.6; scene.add(p2); add(p2, 1, KF_DEKO_TEXT.pflanzen);
      add(kf_klebRay('reggae', -111.5, 1.35, 25.3, 1, 0, 0, { rz: -.08 }), 1, null); }
    // Vegas' Veranda: Aschenbecher auf den Dielen neben der Tür (ab Kap. 4; nach der Szene mit Stummel)
    { const y = kf_boden(-26.55, -11.95, 1.6, 1.6) ?? .45; const a = await kf_modell('kiffen/ascher', .105, 'max'); a.position.set(-26.55, y, -11.95); scene.add(a);
      const st = await kf_modell('kiffen/joints', .092, 'max'); st.scale.multiplyScalar(.45); st.position.set(-26.53, y + .012, -11.93); st.rotation.set(0, .8, .05); st.visible = false; scene.add(st); S.aschStummel = st;
      add(a, 4, () => S.done ? KF_DEKO_TEXT.ascher2 : KF_DEKO_TEXT.ascher, [.25, .15, .25, -26.55, y + .05, -11.95]); }
  } catch (e) { console.warn('Kiffen: Deko', e); } }
function kf_dekoSync() { const S = kiffen_S, k = kf_kap(); if (S.dekoK === k) return; S.dekoK = k; for (const e of S.deko) { const on = typeof kapAb === 'function' ? kapAb(e.k) : k >= e.k; e.o.visible = on; if (e.hit) { const has = interactables.includes(e.hit); if (on && !has) interactables.push(e.hit); else if (!on && has) uninteract(e.hit); } }
  if (S.aschStummel) S.aschStummel.visible = S.done; }

// ================================================================ Eingabe (nur während der Szene)
addEventListener('mousedown', e => { if (!kf_Z.on || e.button !== 0 || ui.paused) return; kiffen_S.in.down = true; kiffen_S.in.klick++; }, true);
addEventListener('mouseup', e => { if (e.button === 0) kiffen_S.in.down = false; }, true);
addEventListener('mousemove', e => { if (!kf_Z.on || ui.paused) return; if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return; kiffen_S.in.dx += e.movementX || 0; kiffen_S.in.dy += e.movementY || 0; }, true);
addEventListener('keydown', e => { if (!kf_Z.on || ui.paused) return; if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) { kiffen_S.in.down = true; kiffen_S.in.klick++; } } if (e.code === 'KeyE' && !e.repeat) kiffen_S.in.ende = true; }, true);
addEventListener('keyup', e => { if (e.code === 'Space') kiffen_S.in.down = false; }, true);
{ const css = document.createElement('style'); css.textContent = `
  body.kfSzene #prompt, body.kfSzene #crosshair { visibility: hidden !important; }
  #kfHint { position: fixed; left: 0; right: 0; bottom: 4.2vh; z-index: 6; display: flex; flex-direction: column; align-items: center; gap: 9px; pointer-events: none; opacity: 0; transition: opacity .6s; }
  #kfHint.on { opacity: 1; }
  #kfHint .t { display: flex; gap: 34px; font: 600 12px "Cormorant Garamond", Georgia, serif; letter-spacing: .24em; color: #d9cdb2; text-shadow: 0 0 4px #000, 0 0 14px #000; text-transform: uppercase; }
  #kfHint kbd { font: 600 11px Georgia; border: 1px solid rgba(201,163,106,.6); padding: 1px 6px; margin: 0 3px; color: var(--gold, #c9a36a); border-radius: 2px; }
  #kfHint .b { width: 160px; height: 1px; background: rgba(217,205,178,.18); opacity: 0; transition: opacity .4s; }
  #kfHint .b i { display: block; height: 100%; width: 0; background: linear-gradient(90deg, rgba(201,163,106,.2), rgba(201,163,106,.9)); box-shadow: 0 0 6px rgba(201,163,106,.6); transition: width .12s linear; }`;
  document.head.appendChild(css); const d = document.createElement('div'); d.id = 'kfHint'; d.innerHTML = '<div class="t"></div><div class="b"><i></i></div>'; document.body.appendChild(d); kiffen_S.hintEl = d; }

// ================================================================ Laden
WORLD_MODS.push(['Kiffen', async () => { const S = kiffen_S, R = kf_R;
  story.side.kf_fuenf = { title: 'Fünf Minuten', desc: 'Grinder, Blättchen, etwas zum Drehen, Tips.', state: 'hidden' }; // schon beim Laden da → wird mit dem Spielstand gesichert
  R.seat = new THREE.Group(); R.seat.position.set(0, -60, 0); scene.add(R.seat);
  try { const src = await msModel('haende', 'model.glb'); const { clone } = await import('three/addons/utils/SkeletonUtils.js'); kf_rigBau(clone(src)); } catch (e) { console.warn('Kiffen: Hände', e); }
  try { S.gr = await fetch('assets/ms/kiffen/grinder/meta.json').then(r => r.json()); } catch (e) { S.gr = { h: .0466, cut: .0268, r: .029 }; }
  try { const src = await msModel('kiffen/grinder', 'model.glb'); src.updateMatrixWorld(true); for (const n of ['koerper', 'deckel']) { let m = null; src.traverse(o => { if (o.isMesh && (o.name === n || (o.parent && o.parent.name === n))) m = m || o; });
      const g = new THREE.Group(), c = m.clone(); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.set(1, 1, 1); c.material = m.material; m.material.envMapIntensity = .9; g.add(c); kf_prop(n, g); }
    const e = new THREE.Mesh(new THREE.CircleGeometry(S.gr.r * .92, 40), new THREE.MeshStandardMaterial({ map: kf_texEinsatz(), roughness: .8, metalness: .2 })); const eg = new THREE.Group(); eg.add(e); kf_prop('einsatz', eg); } catch (e) { console.warn('Kiffen: Grinder', e); }
  try { kf_prop('knolle', await kf_modell('kiffen/knolle', .03)); } catch (e) { console.warn('Kiffen: Knolle', e); }
  try { const p = await kf_modell('kiffen/papes', .105, 'max'); kf_prop('papes', p); } catch (e) { console.warn('Kiffen: Papes', e); }
  try { const f = await kf_modell('w_lighter', .058); f.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); m.material.metalness = Math.max(m.material.metalness, .75); m.material.roughness = Math.min(m.material.roughness, .42); m.material.envMapIntensity = 1.2; } }); const gr = kf_cnv(256, 296, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(40,30,15,.75)'; x.strokeStyle = 'rgba(255,240,200,.55)'; x.lineWidth = 1; x.textAlign = 'center'; x.font = 'italic 25px Georgia';
      ['Für Peter.', 'Damit du im', 'Dunkeln nicht', 'allein bist.', '– M.'].forEach((l, i) => { const yy = 60 + i * 44; x.fillText(l, w / 2 + (i === 4 ? 40 : 0), yy); x.strokeText(l, w / 2 + (i === 4 ? 40 : 0) - .6, yy - .6); });
      for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(30,20,10,${Math.random() * .25})`; x.beginPath(); const a = Math.random() * w, b = Math.random() * h; x.moveTo(a, b); x.lineTo(a + Math.random() * 40 - 20, b + Math.random() * 6 - 3); x.stroke(); } });
    const bb = new THREE.Box3().setFromObject(f), sz = bb.getSize(new THREE.Vector3()); const gm = new THREE.Mesh(new THREE.PlaneGeometry(sz.x * .78, sz.x * .9), new THREE.MeshStandardMaterial({ map: tex(gr, true), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, roughness: .35, metalness: .6 }));
    gm.position.set((bb.min.x + bb.max.x) / 2, sz.y * .44, bb.max.z + .0004); f.add(gm); kiffen_S.gravur = gm;
    kf_prop('feuerzeug', f); } catch (e) { console.warn('Kiffen: Feuerzeug', e); }
  { const g = new THREE.Group(); g.add(kf_papBau(msTex('kiffen/papier/b.jpg', true), msTex('kiffen/papier/n.jpg'))); kf_prop('blatt', g); }
  { const g = new THREE.Group(); g.add(kf_tipBau(kf_texPappe())); kf_prop('tip', g); }
  kf_teilchenBau(); S.vl = new VLight(0xffa24a, 0, 2, 2); scene.add(S.vl); S.fill = new VLight(0xffc68e, 0, 3.2, 2); scene.add(S.fill); // Flamme/Glut · Verandalicht auf den Händen (beide beim Laden mit 0)
  S.pass = kiffen_passBau(); S.flTex = kf_flashBilder(); if (S.pass) { S.pass.uniforms.tFl.value = S.flTex[0]; try { const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), S.pass.material); renderer.compile(q, camera); } catch (e) {} }
  try { S.mo = await fetch('assets/ms/haende/rauchen.json').then(r => r.json()); } catch (e) { console.warn('Kiffen: Mocap', e); S.mo = null; }
  kf_posen(); kf_schritte(); await kf_fundeBau(); await kiffen_deko();
  // Beim Vorübersetzen der Shader sichtbar (tief unter der Welt), im ersten Bild versteckt
  for (const n in kf_PR) kf_PR[n].o.visible = true; if (R.rig) R.rig.visible = true; kf_T.krP.visible = true; kf_T.glut.visible = true; kf_T.flamme.visible = true; for (const r of kf_T.rauch) r.s.visible = true;
  for (const e of S.deko) e.o.visible = true; for (const k in S.fundObj) S.fundObj[k].visible = true;
  S.ready = true; }]);
function kf_allesAus() { for (const n in kf_PR) kf_PR[n].o.visible = false; if (kf_R.rig) kf_R.rig.visible = false; kf_T.krP.visible = false; kf_T.glut.visible = false; kf_T.flamme.visible = false; for (const r of kf_T.rauch) r.s.visible = false; kiffen_S.dekoK = -1; kf_fundeSync(); kf_dekoSync(); }
MOD_SAVE.push(['kiffen', () => { const S = kiffen_S; return { auf: S.auf === 'flash' ? 'aus' : S.auf, done: S.done, echt: S.echt, zittern: +S.zittern.toFixed(2) }; },
  v => { const S = kiffen_S; if (!v) return; S.auf = v.auf || 'aus'; S.done = !!v.done; if (v.echt) Object.assign(S.echt, v.echt); S.zittern = v.zittern || 0; S.dekoK = -1; if (S.ready) { kf_fundeSync(); kf_aufgabeSync(); } }]);
WORLD_TICK.push((dt, t) => { const S = kiffen_S; if (!S.ready) return; { const n = performance.now(); S.fpsN = (S.fpsN || 0) + 1; if (!S.fpsT) S.fpsT = n; if (n - S.fpsT > 1000) { S.fps = Math.round(S.fpsN * 1000 / (n - S.fpsT)); S.fpsN = 0; S.fpsT = n; } } // Messung für den Selbsttest
  if (!S.hid) { S.hid = true; kf_allesAus(); try { kf_itemsEintragen(); } catch (e) { console.warn('Kiffen: Gegenstände', e); } }
  if (!S.hookClock && typeof clock !== 'undefined' && clock.getDelta) { S.hookClock = true; const gd = clock.getDelta.bind(clock); clock.getDelta = () => gd() * S.zeit; } // Zeitlupe der Welt
  const jetzt = performance.now(), echt = S.lastT ? Math.min(.25, (jetzt - S.lastT) / 1000) : dt; S.lastT = jetzt; const rdt = S.in.test ? Math.max(dt / S.zeit, echt) : dt / S.zeit; // Selbsttest: Echtzeit auch bei wenigen Bildern je Sekunde
  if (!S.klang && Audio.ctx) { S.klang = true; kiffen_klangBau().catch(e => console.warn('Kiffen: Klänge', e)); }
  if (S.zittern > 0 && !kf_Z.on) S.zittern = Math.max(0, S.zittern - rdt / 900);
  kf_weichTick(rdt, t); if (S.pass && S.pass.enabled) S.pass.uniforms.uT.value = t;
  const Z = kf_Z; document.body.classList.toggle('kfSzene', Z.on); if (S.fill) { const fi = Z.on && !Z.hell ? 2.1 * kf_io(Z.blend) : 0; if (fi > 0) kf_welt(.28, .5, .32, S.fill.position); if (Math.abs(S.fill.intensity - fi) > .001) S.fill.intensity = fi; }
  if (Z.on) { Z.blend = kf_clamp(Z.blend + (Z.blendZ ? 1 : -1) * rdt / 1.7);
    if (Z.lab) { kf_eval(Z.st, Z.p); if (Z.labCh) Object.assign(kf_CH, Z.labCh); } else kf_schrittTick(rdt, t); kf_anwenden(rdt, t); kf_teilchenTick(rdt, t); }
  else if (kf_T.rauch.length && kf_T.rauch.some(r => r.s.visible)) kf_teilchenTick(rdt, t);
  S.chk = (S.chk || 0) - rdt; if (S.chk > 0) return; S.chk = .5; kf_dekoSync(); kf_fundeSync();
  // Aufgabe startet von selbst ~45 s nach Beginn von Kap. 4 (bis AP-19 den Moment selbst setzt: kiffen_S.auto = false + kiffen_start())
  if (S.auto && S.auf === 'aus' && kf_kap() === 4 && typeof anwesen_S !== 'undefined' && anwesen_S.ch4 && state.started && !state.talking && !ui.overlay && !scripted && !camOverride && !anwesen_S.inHall) { S.k4T += .5; if (S.k4T > 45) kiffen_start(); } });
// ================================================================ Testzugriff
window.__kiffen = { S: kiffen_S, Z: kf_Z, R: kf_R, P: kf_P, PA: kf_PA, TA: kf_TA, H: KF_H, STEPS: KF_STEPS, start: o => kiffen_start(o), flash: o => kiffen_flash(o), szene: o => kiffen_szene(o || {}), fund: kiffen_fund, deko: () => kiffen_deko(), poster: kiffen_poster,
  // Szene direkt starten, alle Schritte laufen von selbst (Klick/Halten/Maus werden simuliert)
  auto(on = true) { kiffen_S.in.test = on; return on; }, lampe(on = true) { flashOn = !!on; return flashOn; }, finde: id => { kf_gefunden(id); return story.items.filter(k => k.startsWith('kf_')).join(','); }, fundeText: () => kf_aufgabeText(), klick() { kiffen_S.in.klick++; }, halten(on) { kiffen_S.in.down = !!on; }, maus(dx, dy = 0) { kiffen_S.in.dx += dx; kiffen_S.in.dy += dy; }, ende() { kiffen_S.in.ende = true; },
  // Standbild: Schritt id bei Fortschritt p (ohne Ablauf) – für Screenshots und Posen-Feinschliff
  zeige(id, p = 1, opts = {}) { const Z = kf_Z, i = KF_STEPS.findIndex(s => s.id === id); if (i < 0) return 'Schritt fehlt';
    if (!Z.on) { Z.on = true; Z.lab = true; Z.saved = { x: camera.position.x, y: camera.position.y, z: camera.position.z, yaw: player.yaw, pitch: player.pitch, px: player.pos.x, py: player.pos.y, pz: player.pos.z }; kf_buehne(opts); kf_veranda(true); kf_SP.init = false; flashOn = false; Z.blend = 1; Z.blendZ = 1; setCamOverride(kf_camFn); setScripted(() => { player.yaw = Z.saved.yaw; player.pitch = Z.saved.pitch; return true; }); }
    Z.hell = opts.hell || 0; Z.camFix = opts.cam || null; Z.zug = opts.zug || 0; Z.labCh = opts.ch || null; Z.st = KF_STEPS[i]; Z.p = p; if (i >= KF_STEPS.findIndex(s => s.id === 'fuellen')) kf_kruemelAlle(); kf_eval(Z.st, p); Z.camY = Z.camYz; Z.camP = Z.camPz;
    if (id === 'rollen') kf_PA.rolle = kf_lerp(.3, .82, p); return id + ' ' + p; },
  labEnde() { const Z = kf_Z; kf_veranda(false); if (kiffen_S.vl) kiffen_S.vl.intensity = 0; Z.hell = 0; Z.on = false; Z.lab = false; Z.st = null; setCamOverride(null); setScripted(null); kf_allesAus(); return 'ok'; },
  pose(side, json) { KF_H[side] = KP(json.w, json.f, json.n, json.c, json.s, json.t); kf_schritte(); return 'ok'; },
  info() { const Z = kf_Z, S = kiffen_S; return { auf: S.auf, st: Z.st && Z.st.id, p: +Z.p.toFixed(2), zuege: Z.zuege, weich: +S.weich.toFixed(2), zeit: +S.zeit.toFixed(2), items: story.items.filter(k => k.startsWith('kf_')), done: S.done, rig: kf_R.ready, deko: S.deko.length, fps: S.fps }; } };
