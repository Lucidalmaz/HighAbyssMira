// =====================================================================  NEBEN4 (Modul „neben4“, Fassung 3 · AP-20): Kapitel 4 · Nebenaufgaben
// Kanon: story_final.md Kapitel 4 „Nebenaufgaben“ (Wortlaute), Dossier Neue Figuren („Unzustellbar“ mit allen Briefen, „Siebzehn Näpfe“ Kap. 4,
// „Der Kreisel, der nicht umfällt“), LWO-Dossier Z-10, Beobachter-Dossier 82 5.9 (B-K4-N4…N6), 02 C2/F2/F3/I3.
// Acht Aufgaben (Fibel-Namen) – jede sagt in der Fibel, WARUM Luke das tut (premium_auftrag „Story“):
//   Gasleck (Kerzen vor Nr. 7, Band −4 je Verstoß, Blechkiste/Whiskey K4-2, Mülltüte hinter der Tonne von Nr. 9, zurückstecken, Kreide)
//   Kassler, vier achtzig (Nr. 4, Haushaltsbuch → Gegenstand 'haushaltsbuch' = AG-12 Weg 2, villa.js bietet ihn dann selbst an)
//   Unzustellbar (Günther an Nr. 1, Wege a/b/c; a/b: Schuppen mit Fächern, B-K4-N6, Zusammenbruch; c: Schuppen zu, weiter in Kap. 5 „Der gelbe Kasten“)
//   Der Kreisel, der nicht umfällt (Teedose in Heinrichs Zimmer, villa.js ruft neben4_teedose; Foto −5 über AG-14, läuft in Kap. 5 weiter)
//   Aus aller Welt (Weltkarte im Arbeitszimmer, villa.js ruft neben4_karte; Rätsel mit Hilfeleiter, B-K4-N5, Tonband, Vegas)
//   Papas Marke (Frage nach dem Vogel bei Vegas, whiskey.js ruft neben4_marke nach K4-4)
//   Siebzehn Näpfe (Kap. 4: Funkspruch, Keiner am Transporter, Gisela am Zaun)
//   Dieselbe Kanne (Wolters Thermoskanne aus Kap. 3, „G. W.“, AG-14 +5)
// Haken in anderen Modulen (klein, per typeof): villa.js (villa_vegasNochmal, villa_azKarte, villa_ogTeedose) · nr4.js (nr4_lesen 'E-18', nr4_S.hb) ·
//   whiskey.js (whiskey_papasMarke → neben4_marke) · kirchberg.js (kirchberg_S.zaun: Gisela am Zaun sichtbar).
// Schnittstelle für Kap. 5 (AP-21/22): neben4_hat(k): 'gasleck_zurueck' (neue Kerze brennt), 'post_c' (Schuppen noch zu → Einbruch −15, B-K5-N1),
//   'post_ab' (Schuppen leer), 'grete_foto' (HEINI möglich), 'haushaltsbuch' · neben4_postWeg() → 'a'|'b'|'c'|null · Aufgabe 'k5_kasten' („Der gelbe Kasten“)
//   ist registriert; bei Weg c startet sie mit Kapitel 5 von selbst.
// Regeln: keine Lichter zur Laufzeit (die drei Kerzen entstehen beim Laden; Fotos rendert eine eigene kleine Bühne außerhalb der Welt), keine Allokationen im Takt.
const neben4_S = { ready: false, st: {}, o: {}, chk: 0, t: 0, nachLaden: false, busy: false, img: {}, studio: null, v: new THREE.Vector3() };
const NEBEN4 = {
  k4_gasleck: ['Gasleck', 'Vor Nr. 7 brennen drei Kerzen für Hilde, an jeder lehnt eines ihrer Polaroids. Ein Mann vom Aufräumkommando tauscht sie gegen leere. Hilde hat ihr Leben lang gezählt und fotografiert, was keiner sehen wollte – ihre Bilder gehören nicht in den Müll. Unter dem Band durch nur, wo keiner hinsieht.'],
  k4_kassler: ['Kassler, vier achtzig', 'In Nr. 4, Omas Küche, liegt ihr Haushaltsbuch: ein grünes Kassenbuch mit Stoffrücken, dasselbe Modell wie Hildes Zählbuch. Nachsorge 11 will ein grünes Heft. Und vielleicht steht darin, wohin Oma donnerstags gegangen ist.'],
  k4_post: ['Unzustellbar', 'Günther Maas, der Postbote. In der ersten Nacht hat er mir einen Brief an Lucy aus der Hand gerissen: „Unzustellbar.“ Absender J. W., Hamburg. Sein Schuppen hinter der Tankstelle hat ein neues Schloss.'],
  k4_kreisel: ['Der Kreisel, der nicht umfällt', 'In Heinrichs Zimmer, in einer Teedose ohne Tee: ein Foto. Ein Junge und ein Mädchen mit Zöpfen und einem Blechkreisel. Das Mädchen kenne ich. Sie saß in Nimmerheim auf dem Kinderstuhl im Kreis.'],
  k4_welt: ['Aus aller Welt', 'Seilers Weltkarte im Arbeitszimmer: neun Nadeln, neun Kürzel. Die Zeitungsausschnitte „Aus aller Welt“ liegen lose daneben – jemand hat sie abgenommen. Wenn jeder wieder an seiner Nadel steckt, weiß ich, wo die LWO sonst noch ist.'],
  k4_marke: ['Papas Marke', 'Ich hab Vegas nach dem Vogel gefragt. „Der gehört keinem.“ Draußen, auf dem Fensterbrett von Nr. 3, sitzt Whiskey und hat etwas mitgebracht.'],
  k4_naepfe: ['Siebzehn Näpfe', 'Über Funk: „Die Katze von der Rieke sitzt wieder da und guckt in die Ecke.“ Keiner, Giselas dünner grauer Kater, sitzt an der Kreuzung neben dem Transporter des Kommandos. Gisela vermisst ihn – und wo ihre Katzen hinstarren, liegt etwas.'],
  k4_kanne: ['Dieselbe Kanne', 'Wolters Thermoskanne aus der Nacht an der Bushaltestelle. „Dieselbe Kanne“, hat Justin über ihn gesagt. Auf dem Boden, unter dem Aufkleber, eingeritzt: G. W. Wolter ist heute in der Villa Seiler.'],
};
const NEBEN4_K5 = { k5_kasten: ['Der gelbe Kasten', 'Günthers Schuppen hinter der Tankstelle ist noch zu. Neues Schloss. Mit dem Brecheisen aus dem Schrott der Tankstelle ginge es. Heute Nacht.'] };
const n4_st = k => neben4_S.st[k] || (neben4_S.st[k] = {});
const n4_k4 = () => (typeof kap === 'function' ? kap() : 1) === 4;
const n4_hand = s => '<span class="hand">' + s + '</span>';
const n4_masch = s => '<span style="font-family:\'Courier New\',monospace;font-size:.92em;letter-spacing:.02em">' + s + '</span>';
const n4_item = k => story.items.includes(k);
function n4_start(k, desc, karte) { const q = story.side[k]; if (!q || q.state === 'zu' || q.state === 'done') return; if (karte && !q.karte) q.karte = karte; if (desc) q.desc = desc; if (q.state === 'hidden') sideStart(k); try { updateSideInfo(); } catch (e) {} }
function n4_desc(k, desc) { const q = story.side[k]; if (q && q.state !== 'done' && q.state !== 'zu') { q.desc = desc; try { updateSideInfo(); } catch (e) {} } }
function n4_fertig(k, desc) { const q = story.side[k]; if (!q || q.state === 'done') return; if (q.state === 'zu' || q.state === 'hidden') q.state = 'active'; sideDone(k, desc); }
function n4_offen(k) { const q = story.side[k]; return !!q && q.state === 'active'; }
function n4_lore(key, title, html) { if (!story.lore.some(l => l.key === key)) story.lore.push({ key, title, html }); }
function n4_save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(typeof curChapter === 'function' ? curChapter() : 4); } catch (e) {} }
async function n4_says(lines) { if (typeof villa_says === 'function') return villa_says(lines); const war = state.talking; state.talking = true; try { await say(lines); } finally { state.talking = war; } }
function n4_gedanke(id, t, d = 600) { if (typeof gedanke === 'function') gedanke(id, t, d, 3); else subtitle(t, 3800, 'LUKE'); }
function n4_frei() { return state.started && !state.talking && !ui.overlay && !state.ending && !neben4_S.busy && !(typeof LWO !== 'undefined' && LWO.playing) && !(typeof kiffen_S !== 'undefined' && kiffen_S.szene) && !(typeof VILLA !== 'undefined' && (VILLA.busy || VILLA.hp || VILLA.ag13)); }
function n4_draussen() { const P = player.pos; return Math.abs(P.x) < 250 && Math.abs(P.z) < 250 && !state.inBasement && !(typeof VILLA !== 'undefined' && VILLA.raum) && !(typeof kirchberg_S !== 'undefined' && kirchberg_S.inRaum) && !(typeof anwesen_S !== 'undefined' && anwesen_S.inHall); }
const n4_d = (x, z) => Math.hypot(player.pos.x - x, player.pos.z - z);
function n4_boden(x, z) { try { const g = solidGround(x, 1.2, z); return g > -1 && g < 1.2 ? Math.max(0, g) : 0; } catch (e) { return 0; } }
function neben4_hat(k) { const S = neben4_S.st;
  if (k === 'gasleck_zurueck') return !!(S.gas && S.gas.zurueck); if (k === 'post_c') return !!(S.post && S.post.weg === 'c'); if (k === 'post_ab') return !!(S.post && (S.post.weg === 'a' || S.post.weg === 'b'));
  if (k === 'grete_foto') return typeof villa_hat === 'function' && villa_hat('gretefoto'); if (k === 'haushaltsbuch') return !!(S.kassler && S.kassler.genommen); return !!(S.flags && S.flags[k]); }
function neben4_postWeg() { return (neben4_S.st.post && neben4_S.st.post.weg) || null; }

// ---------------------------------------------------------------------  Register (vor dem Laden des Spielstands) · Kapitelende · Kapitel 5
function neben4_register() { for (const [k, [title, desc]] of Object.entries(NEBEN4)) { const q = story.side[k]; if (q) { q.title = title; if (q.state === 'hidden') q.desc = desc; q.kap = 4; } else story.side[k] = { title, desc, state: 'hidden', kap: 4 }; }
  for (const [k, [title, desc]] of Object.entries(NEBEN4_K5)) if (!story.side[k]) story.side[k] = { title, desc, state: 'hidden', kap: 5 }; }
// Am Ende von Kapitel 4: offene Aufgaben schließen – außer dem Kreisel (Kap. 5/6) und „Unzustellbar“ bei Weg c (Einbruch in Kap. 5)
function neben4_kapEnde() { for (const k of Object.keys(NEBEN4)) { const q = story.side[k]; if (!q || q.state !== 'active') continue;
    if (k === 'k4_kreisel') continue; if (k === 'k4_post' && neben4_postWeg() === 'c') { q.desc = 'Günther hat mich gehen lassen, und ich ihn. Sein Schuppen ist noch zu. Neues Schloss. Heute Nacht, mit dem Brecheisen.'; continue; }
    q.state = 'zu'; q.desc = q.desc.replace(/\s*\(Der Tag ist vorbei\.\)$/, '') + ' (Der Tag ist vorbei.)'; }
  try { updateSideInfo(); } catch (e) {} }
function neben4_kap5() { const q = story.side.k5_kasten; if (neben4_postWeg() === 'c' && q && q.state === 'hidden') n4_start('k5_kasten', NEBEN4_K5.k5_kasten[1], { x: 100.5, z: -26.5 }); } // AP-25: nur beim ersten Start – Weiterspielen in Kap. 5 setzt den Fortschritt nicht zurück

// ---------------------------------------------------------------------  Bilder: eigene kleine Bühne (außerhalb der Welt) und Abzüge
function n4_cv(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; if (fn) fn(c.getContext('2d'), w, h); return c; }
function n4_laden(src) { return new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src; }); }
function n4_studio() { const S = neben4_S; if (S.studio) return S.studio; const T = THREE, W = 360, H = 360;
  const sc = new T.Scene(); sc.add(new T.HemisphereLight(0xc8d0e0, 0x302820, .45)); const blitz = new T.DirectionalLight(0xfff2dc, 3); sc.add(blitz, blitz.target);
  const kante = new T.DirectionalLight(0x90a0c0, .7); kante.position.set(-2, 2.5, -3); sc.add(kante);
  return (S.studio = { sc, blitz, W, H, cam: new T.PerspectiveCamera(36, 1, .02, 40), rt: new T.WebGLRenderTarget(W, H), buf: new Uint8Array(W * H * 4) }); }
function n4_render(obj, o) { const St = n4_studio(), T = THREE; St.sc.background = new T.Color(o.bg ?? 0x0c0b0a); St.sc.add(obj); obj.updateMatrixWorld(true); obj.traverse(m => { m.frustumCulled = false; });
  St.cam.fov = o.fov || 36; St.cam.position.set(...o.von); St.cam.lookAt(...o.auf); St.cam.updateProjectionMatrix(); St.cam.updateMatrixWorld(true);
  St.blitz.position.copy(St.cam.position); St.blitz.intensity = o.blitz ?? 3; St.blitz.target.position.set(...o.auf); St.blitz.target.updateMatrixWorld();
  try { renderer.setRenderTarget(St.rt); renderer.clear(); renderer.render(St.sc, St.cam); renderer.readRenderTargetPixels(St.rt, 0, 0, St.W, St.H, St.buf); } finally { renderer.setRenderTarget(null); St.sc.remove(obj); }
  return n4_cv(St.W, St.H, (x, W, H) => { const im = x.createImageData(W, H), d = im.data, b = St.buf;
    for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const s = ((H - 1 - y) * W + i) * 4, t = (y * W + i) * 4; for (let k = 0; k < 3; k++) d[t + k] = Math.min(255, Math.pow(b[s + k] / 255, 1 / 2.2) * 255); d[t + 3] = 255; }
    x.putImageData(im, 0, 0); }); }
// Sofortbild-Anmutung: harter Blitz-Abfall, angehobene Schwärzen, Korn, Vignette; o.kalt (Oktober), o.dunkel
function n4_pola(src, o = {}) { return n4_cv(360, 360, (x, W, H) => { x.drawImage(src, 0, 0, W, H); const im = x.getImageData(0, 0, W, H), d = im.data, dk = o.dunkel || 1;
  for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const t = (y * W + i) * 4, vx = i / W - .5, vy = y / H - .45, vig = Math.max(0, 1 - (vx * vx + vy * vy) * 2.1), n = (Math.random() - .5) * 22;
    const L = (d[t] * .3 + d[t + 1] * .59 + d[t + 2] * .11);
    for (let k = 0; k < 3; k++) { let v = d[t + k] * .78 + L * .22; v = 16 + v * .84 * dk; if (o.kalt) v += k === 2 ? 10 : k === 0 ? -8 : 0; else v += k === 0 ? 8 : k === 2 ? -10 : 0; d[t + k] = Math.max(0, Math.min(255, v * (.35 + .65 * vig) + n)); } }
  x.putImageData(im, 0, 0); }); }
// Alter Abzug (1941): Sepia, weiches Korn, Kratzer, Zackenrand
function n4_sepia(src) { return n4_cv(360, 300, (x, W, H) => { x.fillStyle = '#e8dcc0'; x.fillRect(0, 0, W, H); x.filter = 'blur(.9px)'; x.drawImage(src, 30, 0, 300, 360, 14, 14, W - 28, H - 28); x.filter = 'none';
  const im = x.getImageData(0, 0, W, H), d = im.data;
  for (let y = 14; y < H - 14; y++) for (let i = 14; i < W - 14; i++) { const t = (y * W + i) * 4, L = d[t] * .3 + d[t + 1] * .59 + d[t + 2] * .11, n = (Math.random() - .5) * 26, vx = i / W - .5, vy = y / H - .5, vig = 1 - (vx * vx + vy * vy) * 1.3;
    const v = Math.max(0, Math.min(255, (40 + L * .78) * vig + n)); d[t] = v * 1.05 + 14; d[t + 1] = v * .9 + 8; d[t + 2] = v * .7; }
  x.putImageData(im, 0, 0); x.strokeStyle = 'rgba(245,235,210,.35)'; x.lineWidth = 1; for (let k = 0; k < 9; k++) { x.beginPath(); const a = Math.random() * W; x.moveTo(a, 14); x.lineTo(a + (Math.random() - .5) * 40, H - 14); x.stroke(); }
  x.fillStyle = '#e8dcc0'; for (let i = 0; i < W; i += 9) { x.beginPath(); x.arc(i, 0, 5, 0, 7); x.arc(i, H, 5, 0, 7); x.fill(); } for (let j = 0; j < H; j += 9) { x.beginPath(); x.arc(0, j, 5, 0, 7); x.arc(W, j, 5, 0, 7); x.fill(); } }); }
async function n4_klon(key, file) { const src = await msModel(key, file); const sk = typeof figuren_skc === 'function' ? await figuren_skc() : null; const o = sk ? sk(src) : src.clone(true);
  const clips = src.animations || []; const c = clips.find(a => /idle/i.test(a.name)) || clips[0]; if (c) { const mx = new THREE.AnimationMixer(o); mx.clipAction(c).play(); mx.update(.7); } return o; }
// Die vier Polaroids aus „Gasleck“ (Hildes Kuli auf dem Rand): 0 Kreuzung 2009 · 1 Oktober, Lucy an der Kreuzung · 2 Lucy mit Teddy · 3 der Vogel
// Story-Prüfung R-1: keine „acht Füße + neunter“ mehr in Kap. 4 (nur Kap. 1, 3, 5) und kein „Brot für den Jungen“ (nur Kap. 1, 2, 5)
const N4_POLA = [
  { titel: '2009, die Kreuzung', hinten: '2009, die Kreuzung. Der Abend davor.', luke: 'Die Kreuzung, bevor das Licht kam. Sie hat die Stelle fotografiert, als könnte die weglaufen.' },
  { titel: 'Oktober. Lucy.', hinten: 'Oktober. Lucy an der Kreuzung, drei Uhr. Zählt mit. Ich hab sie heimgeschickt.', luke: 'Lucy. Mitten in der Nacht, an der Kreuzung. Zu weit weg für ein Gesicht. „Zählt mit.“' },
  { titel: 'Lucy, 24.10.', hinten: 'Lucy, 24.10., mit Teddy. Sie weiß es jetzt. Gut so.', luke: 'Hilde konnte nicht fotografieren. Von Lucy ist nur der Ärmel drauf. Und der Teddy. „Sie weiß es jetzt.“ Seit dem 24. Oktober.' },
  { titel: 'Der Vogel', hinten: 'Der Vogel. Seit 75 derselbe. Derselbe Ring.', luke: 'Seit fünfundsiebzig derselbe Vogel. Raben werden alt. So alt nicht.' } ];
async function n4_polaBild(i) { const S = neben4_S; if (S.img['p' + i]) return S.img['p' + i]; let c = null;
  try {
    if (i === 0 || i === 1) { const im = await n4_laden('assets/fotos/kreuzung.jpg'); const roh = n4_cv(360, 360, (x, W, H) => { x.fillStyle = '#0a0a0c'; x.fillRect(0, 0, W, H); if (!im) return;
        if (i === 0) x.drawImage(im, 330, 330, 300, 300, 0, 0, W, H); else x.drawImage(im, 356, 432, 230, 206, 0, 0, W, H);
        if (i === 1) { x.save(); x.filter = 'blur(2.2px)'; x.globalAlpha = .85; const bx = 214, by = 150; x.fillStyle = 'rgba(58,72,96,.95)'; x.beginPath(); x.ellipse(bx, by + 30, 9, 26, 0, 0, 7); x.fill(); // Lucy, klein und unscharf, blaue Jacke
          x.fillStyle = 'rgba(200,190,170,.75)'; x.beginPath(); x.arc(bx, by, 6.5, 0, 7); x.fill(); x.fillStyle = 'rgba(30,28,26,.8)'; x.fillRect(bx - 7, by + 54, 5, 16); x.fillRect(bx + 2, by + 54, 5, 16); x.restore(); } });
      c = n4_pola(roh, i === 1 ? { kalt: true, dunkel: .82 } : {}); }
    else if (i === 2) { const o = new THREE.Group(); const t = await n4_klon('teddy_scan', 'model.glb'); msFit(t, .32, 'max'); const tg = msGround(t); tg.rotation.y = .35; o.add(tg);
      const decke = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), new THREE.MeshStandardMaterial({ color: 0x4a3024, roughness: 1 })); decke.rotation.x = -PI / 2; o.add(decke);
      const roh = n4_render(o, { von: [.32, .36, .62], auf: [0, .15, 0], bg: 0x120e0c, fov: 40 }); const x = roh.getContext('2d'); x.save(); x.filter = 'blur(7px)'; x.fillStyle = 'rgba(58,72,96,.92)'; x.beginPath(); x.ellipse(-10, 250, 70, 150, .35, 0, 7); x.fill(); x.restore();
      c = n4_pola(roh); }
    else { const o = new THREE.Group(); const r = await n4_klon('animal_crow', 'model.glb'); msFit(r, .34); o.add(msGround(r)); c = n4_pola(n4_render(o, { von: [.28, .26, .62], auf: [0, .17, 0], bg: 0x07080a, fov: 34, blitz: 3.6 }), { kalt: true }); }
  } catch (e) { console.warn('neben4: Polaroid ' + i, e); }
  if (!c) c = n4_cv(360, 360, (x, W, H) => { x.fillStyle = '#16140f'; x.fillRect(0, 0, W, H); });
  return (S.img['p' + i] = c.toDataURL('image/jpeg', .84)); }
// Rahmen fürs Polaroid an der Kerze (Weltobjekt): Bild oder leer
function n4_rahmenTex(bild) { const c = n4_cv(176, 214, (x, w, h) => { x.fillStyle = '#ece6d6'; x.fillRect(0, 0, w, h); x.fillStyle = bild ? '#111' : '#dcd8cc'; x.fillRect(11, 11, 154, 164); if (bild) x.drawImage(bild, 11, 11, 154, 164);
    const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,.08)'); g.addColorStop(1, 'rgba(60,50,30,.18)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }

// =====================================================================  1 · „Gasleck“
// Kerzen vor Nr. 7 (Hildes Haustür bei z −11,74): die Wegpunkte des Arbeiters b2 (villa.js VILLA_CREW) liegen davor; Band = Rechteck vor dem Haus
const N4_KERZEN = [[21.3, -10.7], [23.6, -10.9], [25.8, -10.7]];
const N4_BAND = { x0: 20.3, x1: 26.9, z0: -11.7, z1: -8.1 };
const N4_KISTE = [27.6, -7.5], N4_TUETE = [48.95, -7.25], N4_LATERNE = [20, 4.6];
async function neben4_gasBau() { const S = neben4_S, O = S.o, T = THREE, g = new T.Group(); g.name = 'neben4_gasleck'; g.visible = false; scene.add(g); O.gas = g;
  O.kerzen = []; O.polas = [];
  for (let i = 0; i < 3; i++) { const [x, z] = N4_KERZEN[i], y = n4_boden(x, z); const C = candleAt(x, y, z); C.g.visible = false; C.on = false; C.light.intensity = 0; O.kerzen.push(C);
    const m = new T.Mesh(new T.PlaneGeometry(.088, .107), new T.MeshStandardMaterial({ map: n4_rahmenTex(null), roughness: .55 })); m.position.set(x + .07, y + .055, z + .03); m.rotation.set(-.32, .1 - i * .08, 0, 'YXZ'); m.userData.noCol = true; g.add(m); O.polas.push(m);
    const h = kirchberg_hit(.45, .5, .45, x, y + .2, z, () => n4_kerzeLabel(i), () => n4_kerze(i)); kirchberg_an(h, false); O['kh' + i] = h; }
  O.leerTex = O.polas[0].material.map;
  // Absperrband „GASLECK · BETRETEN VERBOTEN“ zwischen vier Leitkegeln (Scan), Band als Stoffstreifen (Abziehbild)
  const bt = kirchberg_tex(kirchberg_cnv(512, 32, (x, w, h) => { for (let i = -2; i < w / 16 + 2; i++) { x.fillStyle = i % 2 ? '#c8231c' : '#f2efe6'; x.beginPath(); x.moveTo(i * 16, 0); x.lineTo(i * 16 + 16, 0); x.lineTo(i * 16 + 4, h); x.lineTo(i * 16 - 12, h); x.fill(); }
    x.fillStyle = 'rgba(242,239,230,.94)'; x.fillRect(150, 5, 212, 22); x.fillStyle = '#1a1a1a'; x.font = 'bold 17px Arial'; x.fillText('GASLECK · BETRETEN VERBOTEN', 156, 22); }));
  bt.wrapS = T.RepeatWrapping; const bm = new T.MeshStandardMaterial({ map: bt, side: T.DoubleSide, roughness: .6 });
  const B = N4_BAND, ecken = [[B.x0, B.z1], [B.x1, B.z1], [B.x0, B.z0 + .35], [B.x1, B.z0 + .35]];
  const kegel = await kirchberg_mod('cone_ms', 'model.gltf', .5); for (const [x, z] of ecken) if (kegel) kirchberg_setze(kegel.clone(true), x, n4_boden(x, z), z, x * 1.7, g).userData.band = 1;
  const band = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), t = bm.clone(); t.map = bt.clone(); t.map.needsUpdate = true; t.map.repeat.set(L / 3.2, 1); const m = new T.Mesh(new T.PlaneGeometry(L, .07), t);
    m.position.set((ax + bx) / 2, .46, (az + bz) / 2); m.rotation.y = -Math.atan2(bz - az, bx - ax); m.userData.noCol = true; m.userData.band = 1; g.add(m); };
  band(B.x0, B.z1, B.x1, B.z1); band(B.x0, B.z1, B.x0, B.z0 + .35); band(B.x1, B.z1, B.x1, B.z0 + .35);
  // Blechkiste des Kommandos (Blechdosen-Scan, groß) – Whiskey bringt hier das vierte Bild (K4-2)
  const ki = await kirchberg_mod('w_blech', 'model.glb', .46, 'max'); if (ki) { ki.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiplyScalar(.75); } }); kirchberg_setze(ki, N4_KISTE[0], n4_boden(...N4_KISTE), N4_KISTE[1], .4, g); O.kiste = ki; }
  const kTop = ki ? new T.Box3().setFromObject(ki).max.y : .35; O.kisteY = kTop;
  O.pola4 = new T.Mesh(new T.PlaneGeometry(.088, .107), new T.MeshStandardMaterial({ map: n4_rahmenTex(null), roughness: .55 })); O.pola4.rotation.set(-PI / 2, 0, .6, 'YXZ'); O.pola4.position.set(N4_KISTE[0], kTop + .004, N4_KISTE[1]); O.pola4.visible = false; O.pola4.userData.noCol = true; g.add(O.pola4);
  O.kisteHit = kirchberg_hit(.6, .6, .6, N4_KISTE[0], .3, N4_KISTE[1], () => neben4_S.st.gas && neben4_S.st.gas.w4 === 'da' ? 'Polaroid auf der Blechkiste' : 'Blechkiste des Kommandos', () => n4_kiste()); kirchberg_an(O.kisteHit, false);
  // Mülltüte hinter der Tonne von Nr. 9 (eigene Gruppe: bleibt auch, wenn das Kommando abzieht)
  const tg = new T.Group(); tg.visible = false; scene.add(tg); O.tueteG = tg; const sack = await kirchberg_mod('trashbag', 'model.gltf', .62); if (sack) kirchberg_setze(sack, N4_TUETE[0], 0, N4_TUETE[1], 2.2, tg);
  O.tueteHit = kirchberg_hit(.7, .7, .7, N4_TUETE[0], .35, N4_TUETE[1], 'Mülltüte hinter der Tonne', () => n4_tuete()); kirchberg_an(O.tueteHit, false);
  // Kreide am Laternenpfahl (Nordseite der Straße, gegenüber Nr. 7): EISEN IST FREI und die Antwort darunter
  const lg = new T.Group(); lg.visible = false; scene.add(lg); O.kreideG = lg; const [lx, lz] = N4_LATERNE;
  O.kreide1 = kirchberg_decal(kirchberg_papier({ w: 256, h: 96, bg: 'rgba(0,0,0,0)', flecken: 0, zeilen: [['EISEN IST FREI', 16, 60, 40, 'rgba(236,232,220,.92)', '"Caveat", cursive', -.04]] }), .34, .13, lx, 1.32, lz - .12, PI, { alpha: true, parent: lg });
  O.kreide2 = kirchberg_decal(kirchberg_papier({ w: 256, h: 64, bg: 'rgba(0,0,0,0)', flecken: 0, zeilen: [['Bitte nicht auf Gemeindeeigentum.', 8, 40, 22, 'rgba(30,40,90,.85)', 'Arial', 0]] }), .3, .075, lx, 1.17, lz - .121, PI, { alpha: true, parent: lg });
  O.kreide1.visible = false; O.kreide2.visible = false;
  O.laterneHit = kirchberg_hit(.5, 1.6, .5, lx, .9, lz - .2, 'Laternenpfahl · mit Hildes Kreide schreiben', () => n4_kreide()); kirchberg_an(O.laterneHit, false); }
function n4_gasZahl() { const G = n4_st('gas'); return [0, 1, 2, 3].filter(i => G.p && G.p[i]).length; }
function n4_gasDesc() { const G = n4_st('gas'), n = n4_gasZahl(); let t = NEBEN4.k4_gasleck[1] + ` Gerettet: ${n} / 4.`;
  if (G.c && G.c.includes('leer')) t += ' Was er tauscht, landet im Müll – hinter der Tonne von Nr. 9, wo das Kommando seine Tüten abstellt.'; n4_desc('k4_gasleck', t); }
const n4_kommandoDa = () => typeof VILLA !== 'undefined' && VILLA.crew;
const n4_kommandoWeg = () => !n4_kommandoDa() && typeof anwesen_S !== 'undefined' && (anwesen_S.open || anwesen_S.hallDone);
function n4_kerzeLabel(i) { const G = n4_st('gas'), c = (G.c || [])[i]; if (c === 'hilde') return 'Polaroid an der Kerze';
  if (n4_kommandoWeg() && !G.zurueck && n4_gasZahl() > 0) return 'Hildes Bilder zurückstecken'; if (c === 'leer') return 'Kerze · ein leeres Polaroid'; return 'Kerze für Hilde'; }
async function n4_kerze(i) { const G = n4_st('gas'), O = neben4_S.o; if (state.talking) return; G.c = G.c || ['hilde', 'hilde', 'hilde']; const c = G.c[i];
  if (!G.start) { G.start = 1; G.t = 0; n4_start('k4_gasleck', null, { x: 23.6, z: -10 }); }
  if (c === 'hilde') { G.c[i] = 'luke'; O.polas[i].visible = false; Audio.paper(); if (i === 1 && !G.kreide0) { G.kreide0 = 1; setTimeout(() => toast('Neben der Kerze liegt ein Stück Kreide. Hildes Kreide. Du steckst sie ein.', 3600), 2600); } await n4_polaNehmen(i); return; }
  if (n4_kommandoWeg() && !G.zurueck && n4_gasZahl() > 0) return n4_zurueck();
  if (c === 'leer') return toast('Ein leeres Polaroid. Weiß, glatt, ohne Schrift. Hildes Bild ist weg. Das Kommando wirft nichts weg. Es stellt es hin, wo es keiner sucht.', 5200);
  toast(G.zurueck ? 'Hildes Bilder lehnen wieder an den Kerzen. Die Flammen stehen gerade.' : 'Die Kerze brennt. Das Bild ist in deiner Jacke.', 3200); }
async function n4_polaNehmen(i) { const G = n4_st('gas'); G.p = G.p || {}; if (G.p[i]) return; G.p[i] = 1; const P = N4_POLA[i]; neben4_S.busy = true;
  try { const bild = await n4_polaBild(i);
    try { if (typeof album_abheften === 'function') album_abheften('k4_pola_' + i, { bild, art: 'pola', serie: 'sonst', notiz: 'Hildes Polaroid · ' + P.titel, hinten: { stil: 'pola', blei: P.hinten } }); } catch (e) { console.warn('neben4: Album', e); }
    await new Promise(r => openNote('Hildes Polaroid · ' + P.titel, `<img src="${bild}" style="width:52%;display:block;margin:0 auto 12px;border:9px solid #ece6d6;border-bottom-width:30px;transform:rotate(${i % 2 ? 1.5 : -1.2}deg);box-shadow:0 6px 18px rgba(0,0,0,.6)">`
      + 'Auf dem weißen Rand, Hildes Kuli:\n' + n4_hand('„' + P.hinten + '“'), 'k4_pola_' + i, r));
    if (i === 1) { try { for (let k = 0; k < 3; k++) Audio.play('woodHit1', { gain: .05, rate: 2.2, delay: .5 + k * .34, x: player.pos.x, y: .1, z: player.pos.z - 1.2, ref: 2 }); } catch (e) {} }
  } finally { neben4_S.busy = false; }
  await n4_says([[P.luke, Math.max(3600, P.luke.length * 55), 'LUKE']]); n4_gasDesc(); n4_save();
  if (n4_gasZahl() >= 4) { n4_fertig('k4_gasleck', 'Alle vier Bilder gerettet. Hilde hat den Neunten gezählt und gesehen, wie er aussieht. Und der Vogel hat einem Jungen Brot gebracht.' + (G.zurueck ? ' Die Bilder lehnen wieder an ihren Kerzen.' : ' Wenn das Kommando weg ist, gehören sie zurück an ihre Kerzen.'));
    setTimeout(() => n4_gedanke('n4_gas4', 'Neun. Hilde hat neun gezählt, und keiner hat ihr geglaubt. Sie hat es fotografiert, damit einer es sieht.'), 1800); } }
async function n4_kiste() { const G = n4_st('gas'), O = neben4_S.o; if (G.w4 === 'da') { G.w4 = 'genommen'; O.pola4.visible = false; Audio.paper(); await n4_polaNehmen(3); return; }
  toast('Eine Blechkiste mit Schablonenschrift: AST 7 · BILDTAUSCH. Darin, sauber gestapelt, leere Polaroids. Hunderte.', 4600); }
async function n4_tuete() { const G = n4_st('gas'), O = neben4_S.o; if (state.talking) return; G.c = G.c || ['hilde', 'hilde', 'hilde'];
  const rest = [0, 1, 2].filter(i => G.c[i] === 'leer' && !(G.p && G.p[i]));
  if (!rest.length) return toast(G.tuete ? 'Butterbrotpapier, sorgfältig gefaltet. Kreidestaub. Sonst nichts mehr.' : 'Eine Mülltüte des Kommandos, zugeknotet. Butterbrotpapier, Kreidestaub, nasse Lappen. Keine Bilder.', 4200);
  G.tuete = 1; Audio.paper(); await n4_says([['Du knotest die Tüte auf. Unter nassen Lappen und Butterbrotpapier: ' + (rest.length === 1 ? 'ein Polaroid' : rest.length + ' Polaroids') + ', mit einem Gummiband zusammengehalten. Säuberlich. Wie Akten.', 5200]]);
  for (const i of rest) await n4_polaNehmen(i); }
async function n4_zurueck() { const G = n4_st('gas'), O = neben4_S.o; G.zurueck = 1; neben4_S.busy = true;
  try { for (let i = 0; i < 3; i++) if (G.p && G.p[i]) { O.polas[i].material.map = n4_rahmenTex(await n4_laden(await n4_polaBild(i))); O.polas[i].material.needsUpdate = true; O.polas[i].visible = true; }
    Audio.paper(); await n4_says([['Du steckst Hildes Bilder zurück an ihre Kerzen. Eins nach dem anderen. Die Flammen flackern kurz und stehen dann wieder gerade.', 5200]]); } finally { neben4_S.busy = false; }
  const q = story.side.k4_gasleck; if (q && q.state === 'done') q.desc = 'Alle vier Bilder gerettet und zurück an Hildes Kerzen. Hilde hat den Neunten gezählt und gesehen, wie er aussieht.'; else n4_gasDesc();
  n4_save(); setTimeout(() => n4_gedanke('n4_kreideIdee', 'Hildes Kreide ist noch in meiner Tasche. Der Laternenpfahl gegenüber ist frisch geschrubbt.'), 2200); }
async function n4_kreide() { const G = n4_st('gas'), O = neben4_S.o; if (G.kreide || state.talking) return; G.kreide = 1; O.kreide1.visible = true; O.kreideG.visible = true; kirchberg_an(O.laterneHit, false);
  try { Audio.play('scrape3', { gain: .15, rate: 2.6, dur: .5 }); } catch (e) {} await n4_says([['Du schreibst mit Hildes Kreide an den Laternenpfahl, groß, in Druckbuchstaben: EISEN IST FREI.', 4400]]); n4_save(); }
function n4_gasTick(dt) { const S = neben4_S, O = S.o, G = n4_st('gas'), P = player.pos; if (!O.gas) return; G.c = G.c || ['hilde', 'hilde', 'hilde'];
  const k4 = n4_k4(), da = k4 && n4_draussen(); const crew = n4_kommandoDa();
  O.gas.visible = k4; for (let i = 0; i < 3; i++) { const C = O.kerzen[i]; if (C.on !== k4) { C.on = k4; C.g.visible = k4; if (!k4) C.light.intensity = 0; } O.polas[i].visible = k4 && (G.c[i] !== 'luke' || !!G.zurueck && !!(G.p && G.p[i])); kirchberg_an(O['kh' + i], k4 && da); }
  for (const m of O.gas.children) if (m.userData.band) m.visible = crew; if (O.kiste) O.kiste.visible = crew || G.w4 === 'da';
  O.tueteG.visible = k4; kirchberg_an(O.tueteHit, k4 && n4_offen('k4_gasleck')); kirchberg_an(O.kisteHit, k4 && (crew || G.w4 === 'da')); O.kreideG.visible = k4 && !!G.kreide;
  kirchberg_an(O.laterneHit, k4 && !!G.kreide0 && !G.kreide && n4_kommandoWeg());
  if (!k4) return;
  // Hildes Bilder an den Kerzen erst laden, wenn Luke in die Nähe kommt (die Bühne rendert einmal)
  if (!O.bilder && n4_d(23.6, -10.7) < 45) { O.bilder = 1; for (let i = 0; i < 3; i++) if (G.c[i] === 'hilde') n4_polaBild(i).then(n4_laden).then(im => { if (im && n4_st('gas').c[i] === 'hilde') { O.polas[i].material.map = n4_rahmenTex(im); O.polas[i].material.needsUpdate = true; } }); }
  // Start: nach AG-11 oder wer an die Kerzen kommt
  if (!G.start && ((typeof villa_hat === 'function' && villa_hat('ag11')) || (n4_d(23.6, -10.7) < 5 && crew)) && n4_frei()) { G.start = 1; G.t = 0; n4_start('k4_gasleck', null, { x: 23.6, z: -10 }); n4_gasDesc(); }
  if (!G.start) return; G.t = (G.t || 0) + dt;
  // Der Arbeiter (b2) geht die Kerzen ab und tauscht, was er erreicht (erst 25 s nach dem Start, damit Luke eine Chance hat)
  const b2 = crew && typeof lwo_figur === 'function' ? lwo_figur('b2') : null;
  if (b2 && b2.g.visible && G.t > 25) { G.tausch = G.tausch || [0, 0, 0];
    for (let i = 0; i < 3; i++) { const [x, z] = N4_KERZEN[i], d = Math.hypot(b2.g.position.x - x, b2.g.position.z - (z + 1.2)); if (d < .9 && G.c[i] === 'hilde') { G.tausch[i] += dt; if (G.tausch[i] > 1.6) { G.c[i] = 'leer'; G.tausch[i] = 0; O.polas[i].material.map = O.leerTex; O.polas[i].material.needsUpdate = true;
          try { Audio.play('stones1', { gain: .06, rate: 3, dur: .25, x, y: .2, z, ref: 2 }); Audio.paper(); } catch (e) {} if (n4_d(x, z) < 16 && !G.tauschGesehen) { G.tauschGesehen = 1; n4_gedanke('n4_tausch', 'Er hat getauscht. Hildes Bild ist in seiner Tasche, an der Kerze lehnt ein weißes.', 200); } n4_gasDesc(); } } else G.tausch[i] = 0; } }
  // Absperrband: unter dem Band durch, wo einer hinsieht → −4 (Schlüssel ag11_band_n), einmal je Betreten
  const B = N4_BAND, drin = crew && da && P.x > B.x0 && P.x < B.x1 && P.z > B.z0 && P.z < B.z1;
  if (drin && !G.drin) { G.drin = 1; let F = null; for (const k of ['b1', 'b2', 'b3']) { const f = lwo_figur(k); if (!f || !f.g.visible) continue; const dx = P.x - f.g.position.x, dz = P.z - f.g.position.z, d = Math.hypot(dx, dz); if (d > 14) continue;
      const ry = f.g.rotation.y; if ((Math.sin(ry) * dx + Math.cos(ry) * dz) / Math.max(.01, d) > .3) { F = f; break; } }
    if (F) { G.band = (G.band || 0) + 1; if (typeof lwo_trust === 'function') lwo_trust(-4, 'ag11_band_' + G.band); lwo_blick(F, 'luke'); lwo_sprich(F, 2600); subtitle('„Der Herr. Hinter das Band. Wir schreiben das sonst auf.“', 3400, 'ARBEITER');
      if (G.band === 1) n4_gedanke('n4_band', 'Er hat’s aufgeschrieben. Die schreiben alles auf. Nächstes Mal, wenn keiner hersieht.', 3600); n4_save(); }
    else if (!G.bandTipp) { G.bandTipp = 1; n4_gedanke('n4_bandTipp', 'Keiner hat hergesehen.', 200); } }
  else if (!drin) G.drin = 0;
  // K4-2: Whiskey landet auf der Blechkiste und lässt das vierte Bild fallen
  if (!G.w4 && crew && (n4_gasZahl() >= 1 || G.t > 45) && n4_d(...N4_KISTE) < 22 && n4_frei()) { G.w4 = 'kommt'; try { if (typeof whiskey_setzen === 'function') whiskey_setzen(N4_KISTE[0], O.kisteY + .02, N4_KISTE[1]); } catch (e) {}
    setTimeout(() => { G.w4 = 'da'; O.pola4.visible = true; try { const w = typeof whiskey_S !== 'undefined' && whiskey_S.g ? whiskey_S.g.position : null; Audio.flap(w ? w.x : N4_KISTE[0], 1, w ? w.z : N4_KISTE[1]); Audio.paper(); } catch (e) {}
      O.pola4.material.map = O.leerTex; n4_polaBild(3).then(u => n4_laden(u)).then(im => { if (im) { O.pola4.material.map = n4_rahmenTex(im); O.pola4.material.needsUpdate = true; } });
      subtitle('Whiskey landet auf der Blechkiste des Kommandos. Er lässt etwas fallen. Ein Polaroid, geklaut von den Falschen.', 5200); }, 3200); }
  // Antwort unter der Kreide: sobald Luke weg war und wiederkommt
  if (G.kreide && !G.antwort) { const d = n4_d(...N4_LATERNE); if (d > 32) G.kreideWeg = 1; else if (G.kreideWeg && d < 9) { G.antwort = 1; O.kreide2.visible = true; setTimeout(() => n4_gedanke('n4_antwort', '„Bitte nicht auf Gemeindeeigentum.“ Die schreiben zurück. Mit Kuli.', 300), 400); n4_save(); } } }
function n4_gasNachLaden() { const O = neben4_S.o, G = n4_st('gas'); if (!O.gas) return; G.c = G.c || ['hilde', 'hilde', 'hilde'];
  for (let i = 0; i < 3; i++) { if (G.zurueck && G.p && G.p[i]) n4_polaBild(i).then(n4_laden).then(im => { O.polas[i].material.map = n4_rahmenTex(im); O.polas[i].material.needsUpdate = true; }); else if (G.c[i] === 'leer') O.polas[i].material.map = O.leerTex; }
  if (G.w4 === 'kommt') G.w4 = 'da'; O.pola4.visible = G.w4 === 'da'; O.kreide2.visible = !!G.antwort; O.kreide1.visible = !!G.kreide; O.bilder = 0;
  if (G.w4 === 'da') n4_polaBild(3).then(n4_laden).then(im => { if (im) { O.pola4.material.map = n4_rahmenTex(im); O.pola4.material.needsUpdate = true; } }); }

// =====================================================================  2 · „Kassler, vier achtzig“ (Nr. 4, Küche; nr4.js ruft ab Kap. 4 hierher)
async function neben4_haushaltsbuch() { const K = n4_st('kassler'); if (state.talking || neben4_S.busy) return;
  if (K.genommen) return toast('Die Stelle auf dem Buffet ist heller als der Rest. Da lag das Buch.', 2600);
  n4_start('k4_kassler', null, { x: -28, z: 11 }); neben4_S.busy = true;
  try { if (typeof nr4_S !== 'undefined') nr4_S.zettel.add('E-18');
    const e18 = (typeof NR4_ZETTEL !== 'undefined' && NR4_ZETTEL['E-18']) || 'Wer das liest, ist das Finanzamt oder neugierig. Beide kriegen Kassler.';
    await new Promise(r => openNote('Oma Ernas Haushaltsbuch', 'Ein grünes Kassenbuch mit Stoffrücken. Dasselbe Modell wie Hildes Zählbuch, nur dicker, und die Ecken sind weich vom Blättern.\n\nInnen im Umschlag klebt ein Zettel, Tesafilm, Kuli:\n' + n4_hand('„' + e18 + '“')
      + '\n\n' + n4_hand('„Dienstag. Kassler, 4,80. Milch. Pfand zurück: 1,25. Donnerstag Amt.“') + '\n\n' + n4_hand('„Donnerstag. Kassler für P. mitgenommen, zum Amt. Durfte nicht rein. Hab’s dem Kurzen gegeben. Der hat’s aufgegessen, glaub ich.“')
      + '\n\n' + n4_hand('„Die Zwillinge wollen Pommes. Kriegen Kassler. Luke guckt wieder so. Egal, ich hab ihn lieb. Zettel an Kühlschrank: NICHT AN DIE LAMPE.“'), 'k4_haushaltsbuch', r));
    if (!K.gelesen) { K.gelesen = 1; await n4_says([['„Ich hab sieben Jahre lang Kassler gegessen und dachte, das ist ein Gemüse.“', 3800, 'LUKE']]); }
    await new Promise(r => openNote('Die letzte beschriebene Seite', 'Viele leere Seiten. Dann, ganz hinten, dieselbe Schrift, derselbe Kuli. Kein Datum, kein Jahr:\n\n' + n4_hand('„Luke kommt heim. Kassler kaufen. Er mag keins.“'), null, r));
    try { Audio.play('woodHit1', { gain: .06, rate: .7, x: player.pos.x + 1.5, y: 1.2, z: player.pos.z - 1 }); } catch (e) {}
    await n4_says([['Oma ist seit zwei Jahren tot.', 2600, 'LUKE']]);
    n4_lore('k4_donnerstage', 'Oma Ernas Donnerstage', 'Oma hat Peter nach 1992 jeden Donnerstag Essen zum Amt gebracht. Kassler, immer Kassler. Das Amt hat es erlaubt, solange sie den Mund hielt. Reingelassen hat man sie nie.\n\n„Das Amt kommt donnerstags.“ Sie ist auch hingegangen.');
    const ag12offen = typeof villa_hat === 'function' && !villa_hat('ag12');
    const i = await kirchberg_wahl(['Das Buch einstecken', 'Liegen lassen']);
    if (i === 0) { K.genommen = 1; modItem('haushaltsbuch', 'Oma Ernas Haushaltsbuch', 'Grünes Kassenbuch, Stoffrücken – dasselbe Modell wie Hildes Zählbuch. Jeden Donnerstag: Kassler. „Donnerstag Amt.“', 'paper'); addItem('haushaltsbuch');
      if (typeof nr4_S !== 'undefined') { if (nr4_S.hb) nr4_S.hb.visible = false; if (nr4_S.hbZettel) nr4_S.hbZettel.visible = false; }
      if (ag12offen) setTimeout(() => n4_gedanke('n4_faelschung', 'Nachsorge 11 will ein grünes Heft. Das hier ist grün. Ob Nachsorge 12 lesen kann?', 200), 900); }
    n4_fertig('k4_kassler', 'Oma hat Peter nach 1992 jeden Donnerstag Essen zum Amt gebracht. Reingelassen hat man sie nie. „Das Amt kommt donnerstags“ hat eine zweite Seite.' + (K.genommen ? ' Das Buch steckt in meiner Jacke – grün, Stoffrücken, wie Hildes Zählbuch.' : ''));
    setTimeout(() => n4_gedanke('n4_donnerstag', 'Donnerstags. Sie ist jeden Donnerstag hingegangen, mit Kassler für Peter. Und hat es keinem gesagt. Nicht mal mir.', 300), 2400);
  } finally { neben4_S.busy = false; } n4_save(); }

// =====================================================================  3 · „Unzustellbar“ (Günther Maas; Rad und Figur aus post.js, Schuppen aus post.js/kirchberg.js)
const N4_TOR1 = [-50.9, -5.9];
const N4_BRIEFE = {
  zeit: { label: 'Fach ZEITUNG / POLIZEI / LANDTAG', titel: 'Edda Brands Brief an die Zeitung', lore: 'k4_brief_edda',
    html: () => 'Ein dicker Umschlag, Schreibmaschine, an eine Hamburger Redaktion, Dezember 2012. Die Marke nie abgestempelt. Darauf der BfR-Stempel „Ausgang“ und darüber: UNZUSTELLBAR – ZURÜCK.\n\n' + n4_masch('Sehr geehrte Redaktion,\nich war von 1994 bis zu diesem Sommer Ärztin einer Dienststelle, die nach außen „Bundesstelle für Rückführung“ heißt und nach innen ganz anders. Sie liegt unter einem Wohnhaus in Lost Eyengless. Es gibt sie in keinem Haushaltsplan.\nDort wurde an Kindern geforscht, die aus dem Wald zurückkamen und nicht dieselben waren. Man nennt das Versuchsreihe K. Einer ist tot, einer lebt und darf es nicht. Ein dritter ist vorgesehen; er ist heute zwölf und heißt Brandt.\nEs geht um eine Substanz, die nicht fault, und um Leute, die glauben, sie retten die Welt, wenn sie schweigen. Ich habe zehn Durchschläge einer Akte gemacht. Dies ist der erste Brief. Wenn er nicht ankommt, kommt ein anderer.\nIch unterschreibe mit Namen, weil sonst keiner glaubt, dass jemand so etwas mit Namen unterschreibt.\nDr. Edda Brand') },
  a1: { label: 'Fach AHORN 1', titel: 'AHORN 1 · Post für Nr. 1', lore: 'k4_briefe_ahorn1',
    html: () => 'Ein leerer Umschlag mit Kinderschrift, an Lucy Brandt, Ahornstraße 1. Günthers Vermerk: ' + n4_hand('„Zugestellt an Nr. 2. Da wohnt keiner. Da darf ich.“') /* R-1: Heidi hier ohne eigenen Beat (ihre Karten: Kap. 1, Kap. 5) */
      + '\n\nEin Brief von 2011, an Luke Brandt, Kinderschrift:\n' + n4_hand('Luke, du bist auch weg. Nicht so wie Zayn, anders. Du guckst mich seit dem Sommer an, als würdest du mich nicht kennen. Ich hab ihn vierzig mal gesucht, mit der Wolle, du warst nur zweimal mit. Wenn du mein Freund bist, dann sag es. Wenn nicht, dann sag es auch. Jonas.')
      + '\n\nUnd der aus der ersten Nacht, Poststempel Hamburg, 30. Oktober, an Lucy:\n' + n4_hand('Lucy, ich hab deinen Brief. Dreimal gelesen, dann Mama angerufen. Sie geht nicht ran, wie immer. Ich komm am Samstag. Ich bring die Wolle mit, wenn du meinst, dass das was nützt. Sag Luke nichts. Der kommt eh nicht. – Jonas') },
  a5: { label: 'Fach AHORN 5', titel: 'AHORN 5 · Roxys Karte', lore: 'k4_brief_roxy',
    html: () => 'Eine Karte ohne Marke, Juni 2026, an Lucy. Nie abgeschickt. Günther hat sie am Morgen nach dem Brand aus dem Kasten von Nr. 5 gefischt.\n\n' + n4_hand('Lucy, sag dem Lars, er soll aufhören zu zählen. Ich geh hoch. Da oben war es warm. Nimm den Fisch aus dem Aquarium, ich hab vergessen, wie der heißt. R.') },
  a7: { label: 'Fach AHORN 7', titel: 'AHORN 7 · Jonas an Hilde', lore: 'k4_briefe_jonas',
    html: () => 'Drei Briefe aus Hamburg, an Hilde Wendt. Geöffnet, wieder zugeklebt.\n\n' + n4_hand('(2014) Mama, ich ruf dich jeden Sonntag an. Du gehst nicht ran. Ich weiß, warum. Ich bin trotzdem dran. Es ist okay, dass du die Kugel gezogen hast, ich hätte sie auch gezogen, ich hätte keine andere gezogen. Ruf zurück. Jonas.')
      + '\n\n' + n4_hand('(2020) Mama, die Oma Kranz ist gestorben, hat Luke geschrieben, ein Satz, mehr schreibt der nicht. Stellst du dem Jungen im Stall immer noch Brot hin? Ich hab das als Kind gesehen und nie gefragt. Jetzt frag ich. J.')
      + '\n\n' + n4_hand('(Oktober 2026, ungeöffnet, Poststempel Hamburg, 30. Oktober) Mama. Lucy hat geschrieben. Ich komm am Samstag. Geh ran. Bitte, einmal. Jonas.') },
  hof: { label: 'Fach HOF', titel: 'An das Christkind, Himmel', lore: 'k4_brief_christkind',
    html: () => 'Ein Brief in Rot, „An das Christkind, Himmel“, Dezember 2009:\n\n' + n4_hand('Liebes Christkind, ich will kein Geschenk. Ich will den Zayn. Wenn du den nicht hast, dann sag mir, wer ihn hat. Ich hab die Wolle schon. Jonas Wendt, 10 Jahre, Ahornstraße 7. PS: Mama weint im Keller, ich glaub, sie sucht auch.') },
  s75: { label: 'Postsack 1975', titel: 'Marions Brief ans Christkind', lore: 'k4_brief_marion',
    html: () => 'Aus der Zeit von Günthers Vater. Ein Brief mit Buntstift, „An das Christkind“, Dezember 1975:\n\n' + n4_hand('Liebes Christkind, bring mir den richtigen Peter zurück. Der hier ist auch lieb, aber er hat die falschen Augen und er weiß es. Ich hab ihn trotzdem lieb, sag das keinem. Marion Kranz, 9 Jahre, Nr. 4.') + '\n\n<i>Marion Kranz. Mama.</i>' },
  s59: { label: 'Postsack 1959', titel: 'Hedwig Rieke an Herrn Wolter', lore: 'k4_briefe_hedwig',
    html: () => 'Zwei Briefe, alte Schrift, Sütterlin-Reste. „An das Amt, z. Hd. Herrn Wolter“.\n\n' + n4_hand('(März 1959) Herr Wolter, wo ist der Junge, den Sie im August mitgenommen haben? Es war nicht mein Hans. Aber er hat geweint wie einer. Ich hätte ihn behalten sollen. Sagen Sie mir, wo er ist, ich hole ihn. Hedwig Rieke.')
      + '\n\n' + n4_hand('(November 1961) Herr Wolter, Sie haben nicht geantwortet. Der Herr Doktor sagt, der Junge ist „verlegt“. Verlegt ist ein Wort für Akten. Meine Tochter fragt jeden Abend, ob er weint. Ich sage nein. H. Rieke.') } };
const N4_FACH = { a1: 0, a5: 4, a7: 5, hof: 6, zeit: 7 }; // Index der Obstkiste in post.js (AHORN 1…5, AHORN 7, HOF, ZEITUNG)
function n4_postBereit() { const P = n4_st('post'); if (P.szene || !n4_k4() || typeof post_S === 'undefined' || !post_S.ride || !post_S.F) return false; if (typeof villa_hat !== 'function') return false;
  return (villa_hat('ag12') || villa_hat('ag12_offen')) && !(typeof anwesen_S !== 'undefined' && anwesen_S.hallDone); }
function n4_postTick(dt) { const S = neben4_S, P = n4_st('post'), R = typeof post_S !== 'undefined' ? post_S.ride : null; if (!R) return;
  if (!n4_k4()) { if (P.zeigen) { P.zeigen = 0; R.g.visible = false; } return; }
  // Günther wartet am Gartentor von Nr. 1 (erscheint nur, wenn Luke weit weg ist); Szene bei Annäherung
  if (!P.szene && !P.zeigen && n4_postBereit() && n4_d(...N4_TOR1) > 28) { P.zeigen = 1; R.g.position.set(N4_TOR1[0], 0, N4_TOR1[1]); R.g.rotation.y = PI / 2; R.v = 0; R.path = null; R.fahrer = true; R.g.visible = true; }
  if (P.zeigen === 1 && !P.szene && n4_d(...N4_TOR1) < 7 && n4_frei() && n4_draussen()) n4_guenther();
  // Weg c: einer vom Kommando faltet am Tankstellenvorplatz Absperrband (bis zum Kapitelende)
  if (P.weg === 'c' && typeof lwo_figur === 'function') { const F = lwo_figur('b4'); if (F && !F.g.visible && n4_d(96, -19) > 40 && !(typeof anwesen_S !== 'undefined' && anwesen_S.hallDone)) { lwo_zeigen(F, 96.2, -19.4, -PI / 2); lwo_lampe(F, false); lwo_clip(F, 'look'); } }
  // Schuppen innen (Weg a/b): Fächer anklickbar, Günther auf dem Hocker
  const K = typeof kirchberg_S !== 'undefined' ? kirchberg_S : null, drin = K && K.inRaum === 'schuppen', aktiv = drin && (P.weg === 'a' || P.weg === 'b') && !P.fertig;
  for (const k in S.o.fach || {}) kirchberg_an(S.o.fach[k], aktiv && !(P.gelesen && P.gelesen[k]));
  if (S.o.gSitz) S.o.gSitz.visible = drin && (P.weg === 'a' || P.weg === 'b') && !P.dunkel; if (S.o.gTuer) S.o.gTuer.visible = drin && !!P.dunkel; }
async function n4_guenther() { const P = n4_st('post'), R = post_S.ride, S = neben4_S; P.szene = 1; S.busy = true; state.talking = true; const G = (t, ms) => post_zeile(t, ms, 'GÜNTHER'), L = (t, ms) => { subtitle(t, (ms || 2800) + 250, 'LUKE'); return wait(ms || 2800); };
  n4_start('k4_post', null, { x: N4_TOR1[0], z: N4_TOR1[1] });
  try { try { Audio.play('metalHit2', { gain: .3, rate: 1.3, x: R.g.position.x, y: .6, z: R.g.position.z, ref: 3 }); } catch (e) {}
    await n4_says([['Der Postbote steckt die Zeitungsrolle an deine Haustür. Das Rad lehnt schief am Zaun, das Schutzblech klappert noch.', 5200]]); state.talking = true; // Gag-Budget H-1: kein drittes Gartentor
    await G('Das ist die Zeitung. Ich bring nur die Zeitung. Da steht drin, alle wohlauf.', 3800); await L('„Wer hat das geschrieben?“', 2000); await G('Steht drunter. (hw). Steht immer drunter.', 2800);
    await L('„Sie haben mich gestern gemeldet.“', 2400); await G('Ich hab … also, ich hab gesagt, dass Sie da sind. Das ist keine Meldung. Das ist … Auskunft.', 4400);
    await L('„Und in der ersten Nacht haben Sie mir einen Brief an meine Schwester aus der Hand gerissen. J. W., Hamburg.“', 4400); await G('Der ist nicht weg. Bei mir ist nichts weg.', 2800);
    await G('Hamse mal ’ne Zigarette? Ich hab eine, aber die ist die letzte.', 3400);
    const hatZ = n4_item('lucy_zigaretten'), opts = [], wege = [];
    if (hatZ) { opts.push('Lucys Zigaretten anbieten'); wege.push('a'); } opts.push('„Ich erzähl dem Wolter, was in dem Schuppen liegt.“'); wege.push('b'); opts.push('Ihn fahren lassen.'); wege.push('c');
    let i = await kirchberg_wahl(opts); if (i < 0) i = opts.length - 1; const weg = wege[i]; P.weg = weg; state.talking = true;
    if (weg === 'a') { story.items = story.items.filter(k => k !== 'lucy_zigaretten'); Audio.play('switch1', { gain: .15, rate: 2.5, x: R.g.position.x, y: 1.5, z: R.g.position.z, ref: 1.5 }); subtitle('Er nimmt die Packung, raucht sofort. Die Hand zittert beim Anzünden.', 3400); await wait(3200);
      await G('Ein paar Rückläufer gibt’s. Nicht viele. Die liegen im Schuppen. Ich hab nie was weggeworfen. Wegwerfen ist … das darf man nicht.', 5200); }
    else if (weg === 'b') { try { if (typeof lwo_ereignis === 'function') lwo_ereignis('unzustellbar_drohen'); } catch (e) {} subtitle('Günther wird weiß. Die Zigarette hinterm Ohr fällt ihm auf den Lenker.', 3400); await wait(3200); await G('Nicht … nicht den Wolter. Bitte.', 2600); }
    if (weg === 'a' || weg === 'b') { await G('Jetzt. Die sind alle in der Ahornstraße und an der Villa. Jetzt guckt keiner. Das ist das erste Mal seit fünfundachtzig, dass keiner guckt.', 5600);
      if (typeof kirchberg_oeffne === 'function') kirchberg_oeffne('schuppen'); n4_desc('k4_post', 'Günther schließt seinen Schuppen hinter der Tankstelle auf. „Jetzt guckt keiner.“ Da liegen die Briefe, die nie ankommen durften – auch der an Lucy.'); story.side.k4_post.karte = { x: 101, z: -26.5 };
      state.talking = false; R.bremsen = false; post_fahrZu([[-40, -4.4], [0, -4.1], [40, -3.9], [72, -4.2]], 3.8).then(() => { R.g.visible = false; P.zeigen = 2; });
      setTimeout(() => post_klingel(R.g.position.x, 1.3, R.g.position.z, 1), 2600); }
    else { state.talking = false; R.bremsen = true; await post_fahrZu([[-40, -4.4], [-31, -4.3]], 3.4); await wait(1400); await post_fahrZu([[-44.5, -4.6]], 1.4); state.talking = true;
      await G('Wenn Sie da reingehen, wenn ich weg bin: Das ist Einbruch. Das muss ich melden.', 4000); await wait(1600); await G('Mach ich aber nicht.', 2000);
      state.talking = false; R.bremsen = false; post_fahrZu([[-30, -4.2], [10, -4], [50, -4], [80, -4.2]], 3.8).then(() => { R.g.visible = false; P.zeigen = 2; });
      n4_desc('k4_post', 'Günther hat mich gehen lassen, und ich ihn. Sein Schuppen hinter der Tankstelle hat ein neues Schloss, und vorne faltet einer vom Kommando Absperrband. Heute nicht. Heute Nacht.'); story.side.k4_post.karte = { x: 101, z: -26.5 }; }
  } catch (e) { console.warn('neben4: Günther', e); } finally { state.talking = false; S.busy = false; } n4_save(); }
// Schuppentür (post.js-Klickfläche): bei Weg c heute zu
function n4_schuppenZu() { n4_gedanke('n4_schloss', 'Neues Schloss. Ginge mit der Brechstange. Nicht, solange der da vorn sein Band faltet. Heute Nacht.', 0); toast('Das Vorhängeschloss ist neu. Das Auge darauf ist frisch geprägt.', 3000); }
async function n4_schuppenBau() { const S = neben4_S, O = S.o, K = typeof kirchberg_S !== 'undefined' ? kirchberg_S : null, R = K && K.raeume.schuppen; if (!R || O.fach) return; const C = POST_RAUM.schuppen, T = THREE;
  O.fach = {}; for (const [k, i] of Object.entries(N4_FACH)) { const x = R.x0 + .45 + (i % 4) * .56, y = .02 + (i / 4 | 0) * .42 + (i === 7 ? .84 : 0), z = R.z0 + .3; O.fach[k] = kirchberg_hit(.52, .32, .4, x, y + .16, z, N4_BRIEFE[k].label, () => n4_fach(k)); kirchberg_an(O.fach[k], false); }
  O.fach.s75 = kirchberg_hit(.46, .7, .46, R.x1 - .5, .35, C.z - .8, N4_BRIEFE.s75.label, () => n4_fach('s75')); O.fach.s59 = kirchberg_hit(.46, .7, .46, R.x1 - 1.0, .35, C.z - .8, N4_BRIEFE.s59.label, () => n4_fach('s59'));
  kirchberg_an(O.fach.s75, false); kirchberg_an(O.fach.s59, false);
  R.g.traverse(m => { if (m.isMesh && m.material && m.material.emissiveIntensity > 2 && m.geometry && m.geometry.type === 'CylinderGeometry') O.neon = m; }); O.neonL = R.licht[0] || null;
  if (typeof figuren_embody === 'function') { const g1 = new T.Group(); g1.position.set(C.x - .62, 0, C.z + .72); g1.rotation.y = PI / 2 + .5; /* Sitz-Clip dreht um ~90° (Testbild): so sieht er auf die Fächer */ R.g.add(g1); O.gSitz = g1; O.gSitzP = await figuren_embody(g1, 'guenther', { sit: .45 });
    const g2 = new T.Group(); g2.position.set(C.x + 1.05, 0, C.z + 1.55); g2.rotation.y = PI; g2.visible = false; R.g.add(g2); O.gTuer = g2; O.gTuerP = await figuren_embody(g2, 'guenther', { clip: 'idle' });
    try { if (O.gSitzP) figuren_lookAt(O.gSitzP, camera, .5); if (O.gTuerP) figuren_lookAt(O.gTuerP, camera, .7); } catch (e) {} } }
async function n4_schuppenRein() { const P = n4_st('post'); if (!n4_k4() || !(P.weg === 'a' || P.weg === 'b') || P.fertig) return; await n4_schuppenBau();
  if (!P.drin) { P.drin = 1; setTimeout(() => n4_says([['Günther sitzt auf dem Hocker und sieht auf die Fächer. Er sagt nichts mehr. Er wartet, bis du gelesen hast.', 4800]]), 900); } }
async function n4_fach(k) { const P = n4_st('post'), B = N4_BRIEFE[k], S = neben4_S; if (state.talking || S.busy) return; P.gelesen = P.gelesen || {}; if (P.gelesen[k]) return; S.busy = true;
  try { if (P.dunkel && k !== 's59') P.dunkel = 0; Audio.paper();
    await new Promise(r => openNote(B.titel, B.html(), B.lore, r)); P.gelesen[k] = 1; const n = Object.keys(P.gelesen).length;
    if (k === 'a1') await n4_says([['„Er kommt am Samstag. Jonas. Und sie hat ihm geschrieben, und keiner hat mir was gesagt.“', 4200, 'LUKE']]);
    if (k === 'zeit') await n4_says([['„‚Er ist heute zwölf und heißt Brandt.‘ Zwei Tausend zwölf. Das bin ich.“', 3800, 'LUKE']]);
    if (k === 's75') await n4_says([['„‚Er hat die falschen Augen und er weiß es.‘ Mama hat es 1975 schon gewusst. Bei Peter.“', 4200, 'LUKE']]);
    if (n === 3) { n4_flacker(2.4); await wait(900); await post_zeile('Da steht immer einer. Seit dem Sommer, als der Pfarrer weg ist. Ich hab mich dran gewöhnt. Man gewöhnt sich an alles, das ist das Problem.', 6200, 'GÜNTHER'); }
    if (k === 's59') await n4_dunkel();
    if (n >= 7) await n4_zusammenbruch(); else n4_desc('k4_post', `Günthers Schuppen. Obstkisten mit Straßennamen, Postsäcke nach Jahren. Briefe gelesen: ${n} / 7.`);
  } finally { S.busy = false; } n4_save(); }
function n4_flacker(sek) { const O = neben4_S.o; if (!O.neon) return; let t = 0; const i0 = O.neonL ? O.neonL.intensity : 0, e0 = O.neon.material.emissiveIntensity;
  const iv = setInterval(() => { t += .06; const an = Math.random() > .35; O.neon.material.emissiveIntensity = an ? e0 : .05; if (O.neonL) O.neonL.intensity = an ? i0 : i0 * .08; if (t > sek) { clearInterval(iv); O.neon.material.emissiveIntensity = e0; if (O.neonL) O.neonL.intensity = i0; } }, 60); }
async function n4_dunkel() { const O = neben4_S.o, P = n4_st('post'), C = POST_RAUM.schuppen; if (!O.neon) return; const i0 = O.neonL ? O.neonL.intensity : 0, e0 = O.neon.material.emissiveIntensity, fl = typeof flashOn !== 'undefined' ? flashOn : false;
  state.talking = true;
  try { O.neon.material.emissiveIntensity = 0; if (O.neonL) O.neonL.intensity = 0; if (typeof flashOn !== 'undefined') flashOn = false; await wait(900);
    for (let k = 0; k < 7; k++) { try { Audio.play('stones1', { gain: .035, rate: 3.4, dur: .12, delay: k * .19, x: C.x - .4, y: .6, z: C.z + .5, ref: 1.5 }); } catch (e) {} } Audio.paper(); await wait(1900);
    O.neon.material.emissiveIntensity = e0; if (O.neonL) O.neonL.intensity = i0; if (typeof flashOn !== 'undefined') flashOn = fl; P.dunkel = 1;
    try { if (typeof beobachter_zettel === 'function') beobachter_zettel('b_k4_n6', { pos: [C.x - .62, .62, C.z + .72] }); } catch (e) { console.warn('neben4: B-K4-N6', e); }
    await wait(700); await n4_says([['Licht. Auf dem Hocker, wo Günther saß, liegt ein gefalteter Zettel. Günther steht an der Tür. Er hat nichts gesehen.', 5200]]);
  } finally { state.talking = false; } }
async function n4_zusammenbruch() { const P = n4_st('post'), C = POST_RAUM.schuppen; P.fertig = 1; P.dunkel = 0; state.talking = true;
  try { await n4_says([['Günther sitzt wieder auf dem Hocker, die letzte Zigarette zwischen den Fingern. Er zündet sie nicht an.', 4400]]); state.talking = true;
    await post_zeile('Ich hab einen zugestellt. Einen. In vierzig Jahren. Den von Ihrer Schwester an den Jonas.', 5000, 'GÜNTHER'); await post_zeile('„Hilde hat mir alles gezeigt. Komm am Samstag und bring die Wolle mit.“', 4200, 'GÜNTHER');
    await wait(1200); await post_zeile('Also. Ich trag das heut Nachmittag aus. Alles. Bis auf den einen.', 3800, 'GÜNTHER');
    subtitle('Er steckt Edda Brands Brief in die Innentasche. Den gibt er dir nicht. Dafür drückt er dir seine Thermoskanne in die Hand.', 5200); await wait(5000);
    modItem('thermos_bfr', 'Günthers Thermoskanne', 'Grau, zerbeult, Aufkleber „BfR – Wir bringen Sie heim“. Kaffee, noch warm. Tauschgut für den Raben oder ein Kaffee für Vegas.', 'paper'); addItem('thermos_bfr');
    post_klingel(C.x, 3, C.z, 1.1); await wait(1400); await post_zeile('Ich hab nichts gesehen!', 2000, 'GÜNTHER');
  } finally { state.talking = false; }
  n4_fertig('k4_post', 'Günther hat vierzig Jahre Post gesammelt, die nie ankommen durfte. Heute Nachmittag trägt er alles aus. Bis auf einen Brief: Edda Brands, an eine Hamburger Zeitung – „ein dritter ist vorgesehen … und heißt Brandt“. Den hat er eingesteckt. Jonas kommt am Samstag, weil Günther einmal zugestellt hat.');
  if (P.weg === 'b') setTimeout(() => { if (typeof lwo_funk === 'function' && !state.talking) lwo_funk('„Maas meldet: Brandt, L., droht. Maas weint dabei. Notiert.“'); }, 26000); n4_save(); }

// =====================================================================  4 · „Der Kreisel, der nicht umfällt“ (villa.js villa_ogTeedose → hier)
async function neben4_teedose(schonGesehen) { const K = n4_st('kreisel'), S = neben4_S; if (S.busy) return; S.busy = true;
  try { const neu = !K.gesehen; n4_start('k4_kreisel');
    if (neu) await n4_says([['„Er trinkt seit Jahrzehnten Tee und hat keinen. Klar.“', 3000, 'LUKE']]);
    if (K.gesehen && K.entschieden) { toast(typeof villa_hat === 'function' && villa_hat('gretefoto') ? 'Die Teedose ist leer. Das Foto steckt in deiner Jacke.' : 'Kein Tee. Das Foto von Grete und Heinrich, Zackenrand, Sommer 1941.', 3200); return; }
    await new Promise(r => openNote('Eine Teedose aus Blech', 'Kein Tee darin. Ein Foto, Schwarzweiß, Zackenrand, an den Rändern weich gegriffen.\n\n<i>Vorderseite:</i> Ein Junge in kurzen Hosen, ernst, die Hand halb vor dem Gesicht. Ein Mädchen mit Zöpfen und Schleife, lachend, einen Blechkreisel in der Hand. Dahinter ein Forsthaus.', null, r));
    try { for (let k = 0; k < 3; k++) Audio.play('metalHit1', { gain: .1, rate: 3.1, delay: .15 + k * .42, x: -886.4, y: .5, z: 928.4, ref: 2 }); } catch (e) {} await wait(1500);
    await new Promise(r => openNote('Die Rückseite', '<i>Tinte, alte Schrift:</i>\n' + n4_hand('„Grete und Heinrich. Sommer 1941. Das letzte.“') + '\n\n<i>Darunter, Kuli, viel später:</i>\n' + n4_hand('„Sie ist nicht tot. Ich habe sie gesehen. Sie hat den Kreisel noch. – H. W.“'), 'k4_grete_foto', r));
    if (neu) { K.gesehen = 1; await n4_says([['Die Heizung tickt. Dreimal. Genau, als du das Foto umgedreht hast.', 3400], ['Das Mädchen kenne ich. Der Kinderstuhl im Kreis, in Nimmerheim. Zöpfe. Beine, die baumeln. Sie hat nicht nach mir gegriffen. Sie hat meine Hand angeguckt.', 6400, 'LUKE']]);
      n4_lore('k4_grete', 'Grete und Heinrich', 'Das Mädchen mit den Zöpfen heißt Grete. Der Junge heißt Heinrich Wolter.\n\nSommer 1941. „Das letzte.“ Er hat sie nicht festhalten können. Alles, was Außenstelle 7 tut, hat ein Junge angefangen, der seine Schwester nicht festhalten konnte.');
      if (n4_offen('k4_kanne') || n4_item('thermoskanne')) setTimeout(() => n4_gedanke('n4_gw', 'G. W. auf dem Boden der Kanne. Grete Wolter.', 200), 2600); }
    if (schonGesehen && typeof villa_hat === 'function' && villa_hat('gretefoto')) { K.entschieden = 1; return; }
    const i = await kirchberg_wahl(['Das Foto einstecken', 'Zurücklegen']); K.entschieden = 1;
    if (i === 0) { if (typeof villa_setz === 'function') villa_setz('gretefoto'); n4_desc('k4_kreisel', 'Das Foto von Grete und Heinrich steckt in meiner Jacke. „Sie ist nicht tot. Ich habe sie gesehen.“ Wolter wird es vermissen. Grete sitzt in Nimmerheim auf dem Kinderstuhl – und hat den Kreisel noch.');
      n4_greteBild().then(bild => { try { if (typeof album_abheften === 'function') album_abheften('grete', { bild, art: 'abzug', serie: 'sonst', notiz: 'Grete und Heinrich · Sommer 1941', datum: '1941', hinten: { stil: 'papier', blei: 'Grete und Heinrich. Sommer 1941. Das letzte.\nSie ist nicht tot. Ich habe sie gesehen. Sie hat den Kreisel noch. – H. W.' } }); } catch (e) { console.warn('neben4: Album Grete', e); } }); }
    else n4_desc('k4_kreisel', 'Ich habe das Foto zurück in die Dose gelegt. Grete und Heinrich, Sommer 1941. Sie sitzt in Nimmerheim auf dem Kinderstuhl. Er steht seitdem am Rand und sieht zu.');
  } finally { S.busy = false; } n4_save(); }
// Grete und Heinrich (1941) als alter Abzug: zwei Kinderfiguren aus der Werkstatt auf der Bühne, Sepia; Rückfall: Silhouetten
async function n4_greteBild() { const S = neben4_S; if (S.img.grete) return S.img.grete; let c = null;
  try { if (typeof figuren_load === 'function') { const o = new THREE.Group(), sk = await figuren_skc();
      for (const [id, x, ry] of [['zayn', -.34, .25], ['dina', .36, -.2]]) { const T = await figuren_load(id); if (!T) continue; const f = sk(T.scene); const cl = T.clips.idle || Object.values(T.clips)[0]; if (cl) { const mx = new THREE.AnimationMixer(f); mx.clipAction(cl).play(); mx.update(x < 0 ? .4 : 1.3); } f.position.x = x; f.rotation.y = ry; o.add(f); }
      const b = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ color: 0x6a6258, roughness: 1 })); b.rotation.x = -PI / 2; o.add(b);
      if (o.children.length > 1) c = n4_sepia(n4_render(o, { von: [0, 1.05, 3.1], auf: [0, .78, 0], bg: 0x9a9284, fov: 32, blitz: 1.6 })); } } catch (e) { console.warn('neben4: Grete-Bild', e); }
  if (!c) c = n4_sepia(n4_cv(360, 360, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#b8b0a0'); g.addColorStop(1, '#6a6256'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.filter = 'blur(3px)'; x.fillStyle = '#3a342c';
    x.fillRect(110, 150, 40, 130); x.beginPath(); x.arc(130, 136, 20, 0, 7); x.fill(); x.fillRect(206, 168, 36, 112); x.beginPath(); x.arc(224, 154, 19, 0, 7); x.fill(); }));
  return (S.img.grete = c.toDataURL('image/jpeg', .84)); }

// =====================================================================  5 · „Aus aller Welt“ (villa.js villa_azKarte → hier): Weltkarte, sechs Ausschnitte, neun Nadeln
const N4_NADELN = ['1 · OH – oben wohnt es noch', '2 · IRL', '3 · LAG', '4 · SALZ', '5 · URAL', '6 · INSEL', '7 · wir.', '8 · CL', '9 · NORD'];
const N4_AUSSCHNITTE = [
  { ort: 'Ohio', nadel: 0, t: 'Anwohner klagen über Kinderstimmen aus einem Haus, das seit 1947 leer steht. Die Stimmen singen im Kanon. Ein „Institut“ hat das Grundstück gekauft.' },
  { ort: 'Nordsee', nadel: 8, t: 'Ölkonzern hält stillgelegte Bohrinsel aus Umweltgründen besetzt. Ein Sprecher: „Wir fördern nicht mehr. Wir halten nur dicht.“' },
  { ort: 'Lagune', nadel: 2, t: 'Fischer melden Licht unter dem Wasser. Behörden: Algen. Das Baden ist an der Stelle seit 1961 verboten; die Bojen tragen ein Auge.' },
  { ort: 'Ural', nadel: 4, t: 'Bergwerk nach 70 Jahren wieder „in Betrieb“, fördert aber nichts. Nachtschicht meldet Klopfzeichen aus Stollen 3. Die Gewerkschaft hat einen Dolmetscher angefordert.' },
  { ort: 'Irland', nadel: 1, t: 'Moorleiche entpuppt sich als „nicht abschließend datierbar“. Das Fundstück wurde in einen Kühlwagen mit ausländischem Kennzeichen verladen. Es hat, so ein Torfstecher, „gezählt“.' },
  { ort: 'Chile', nadel: 7, t: 'Station 4 eines Provinzkrankenhauses seit Jahrzehnten wegen Renovierung geschlossen. Die Nachtschwester bringt weiterhin Essen. Auf die Frage, für wen, lächelt sie.' } ];
async function neben4_karte() { const W = n4_st('welt'); if (state.talking) return;
  if (W.fertig) return openNote('Die Weltkarte', 'Sechs Ausschnitte an sechs Nadeln. Die Klappe am Rahmen steht offen. Bei der Sieben, in Seilers Schrift: ' + n4_hand('„wir.“'), null);
  if (!(typeof villa_hat === 'function' && villa_hat('karte'))) {
    await new Promise(r => openNote('Die Weltkarte', 'Darüber ein Messingschild: <b>LUCID WORLD ORGANIZATION · AUSSENSTELLEN</b>\n\nNeun Nadeln, jede mit Nummer und Kürzel in Seilers Schrift. Bei der Sieben: ' + n4_hand('„wir.“') + '\n\nDrumherum lose Zeitungsausschnitte, „Aus aller Welt“. Jemand hat sie abgenommen und liegen lassen. Unten am Kartenrahmen: eine kleine Klappe mit Schlüsselloch. Kein Schlüssel.', 'villa_weltkarte', r));
    if (typeof villa_setz === 'function') villa_setz('karte'); try { if (typeof sammeln_z === 'function') sammeln_z(10); } catch (e) {} await wait(300);
    await n4_says([['Lucid World Organization. Klingt wie ein Energydrink. Zählt Kinder.', 3800, 'LUKE']]); // Story-Prüfung V-4 (U-78 sitzt hier)
    await n4_says([['„Außenstelle sieben. Es gibt also mindestens sechs andere Dörfer, in denen irgendwer ‚Gasleck‘ in die Zeitung schreibt.“', 5200, 'LUKE']]); }
  n4_start('k4_welt'); n4_weltRaetsel(); }
function n4_weltRaetsel() { const W = n4_st('welt'); W.sitz = W.sitz || {}; W.fehl = W.fehl || 0; let wahl = null;
  const tipp = () => W.fehl >= 8 ? 'Hinter dir raschelt Papier. Ein gefalteter Zettel liegt auf dem Boden.' : W.fehl >= 6 ? 'Neben sechs Nadeln sind feine Löcher im Kork. Da hat schon mal etwas gesteckt.' : W.fehl >= 4 ? 'Draußen klopft Whiskey an die Scheibe neben der Karte. Auf Höhe der Nordsee.' : W.fehl >= 2 ? '„Die Kürzel sind Orte. Und die Meldungen auch.“' : 'Erst einen Ausschnitt wählen, dann seine Nadel.';
  const html = () => `<h3>AUS ALLER WELT</h3><p style="margin:.2em 0 .7em">Seilers Weltkarte. Sechs lose Ausschnitte, neun Nadeln.</p><div style="display:flex;gap:16px;flex-wrap:wrap;text-align:left">`
    + `<div style="flex:1 1 300px;display:flex;flex-direction:column;gap:6px">${N4_AUSSCHNITTE.map((a, i) => { const s = W.sitz[i] !== undefined; return `<button data-a="${i}" ${s ? 'disabled' : ''} style="text-align:left;font:13px Georgia;padding:6px 8px;background:${s ? '#cfc6b0' : wahl === i ? '#f3e7b8' : '#ece3cb'};color:#222;border:1px solid #8a7a5a;opacity:${s ? .6 : 1}"><b>${a.ort}.</b> ${a.t}${s ? ` <i>→ Nadel ${W.sitz[i] + 1}</i>` : ''}</button>`; }).join('')}</div>`
    + `<div style="flex:0 1 220px;display:flex;flex-direction:column;gap:5px">${N4_NADELN.map((n, j) => { const loch = W.fehl >= 6 && N4_AUSSCHNITTE.some(a => a.nadel === j); return `<button data-n="${j}" style="text-align:left;font:15px Caveat,cursive;padding:4px 8px">${n}${loch ? ' <span style="opacity:.6">· ◦</span>' : ''}</button>`; }).join('')}</div></div>`
    + `<p style="margin-top:.8em;font-style:italic;opacity:.85">${tipp()}</p>`;
  const bind = box => { box.querySelectorAll('button[data-a]').forEach(b => b.onclick = e => { e.stopPropagation(); wahl = +b.dataset.a; box.innerHTML = html(); bind(box); });
    box.querySelectorAll('button[data-n]').forEach(b => b.onclick = e => { e.stopPropagation(); if (wahl === null) return; const j = +b.dataset.n, a = N4_AUSSCHNITTE[wahl];
      if (a.nadel === j) { W.sitz[wahl] = j; try { Audio.play('stones1', { gain: .08, rate: 3.2, dur: .2 }); } catch (e2) {} }
      else { W.fehl++; try { Audio.play('metalHit1', { gain: .06, rate: 3 }); } catch (e2) {} if (W.fehl === 4) n4_whiskeyScheibe(); if (W.fehl === 8) { try { if (typeof beobachter_zettel === 'function') beobachter_zettel('b_k4_n5', { vor: true }); } catch (e3) {} } }
      wahl = null; if (Object.keys(W.sitz).length >= 6) { closeOverlay(); n4_weltFertig(); return; } box.innerHTML = html(); bind(box); n4_save(); }); };
  openPuzzle(html(), box => bind(box)); }
function n4_whiskeyScheibe() { try { for (let k = 0; k < 3; k++) Audio.play('woodHit1', { gain: .12, rate: 2.8, delay: k * .22, x: player.pos.x - 1, y: 1.8, z: player.pos.z + 1.5, ref: 2 }); } catch (e) {} }
async function n4_weltFertig() { const W = n4_st('welt'); if (W.fertig) return; W.fertig = 1; state.talking = true;
  try { try { Audio.play('drawer1', { gain: .45, x: -920.7, y: 1.2, z: 901.6, ref: 2 }) || Audio.play('woodHit1', { gain: .3, rate: .8, x: -920.7, y: 1.2, z: 901.6, ref: 2 }); } catch (e) {}
    await n4_says([['Als der letzte Ausschnitt an seiner Nadel steckt, springt unten am Kartenrahmen die Klappe auf. Darin: ein Tonband. Aufkleber, Schreibmaschine: „Kanal 3 · alle AST · 1992“.', 6200]]); state.talking = true;
    modItem('tonband_ast', 'Tonband · Kanal 3', '„Kanal 3 · alle AST · 1992“. Funkfetzen aus neun Außenstellen. Eine Stimme sagt auf Deutsch „danke“.', 'paper'); addItem('tonband_ast');
    try { Audio.play('switch1', { gain: .4 }); } catch (e) {} const band = (t, ms) => { try { if (typeof lwo_funkKlang === 'function') lwo_funkKlang(ms / 1000, null, 'band'); } catch (e) {} subtitle(t, ms + 250, 'TONBAND'); return wait(ms); };
    await band('(Rauschen. Funkfetzen in fremden Sprachen. Jemand zählt, auf Spanisch, sehr langsam.)', 4600); await band('„… it’s counting again …“', 3000);
    subtitle('(Drei Klopfzeichen. Dumpf, wie durch Fels.)', 3400, 'TONBAND'); try { for (let k = 0; k < 3; k++) Audio.play('woodHit1', { gain: .16, rate: .55, delay: k * .9 }); } catch (e) {} await wait(3400);
    await band('„Danke.“', 2200); await wait(1800);
    try { for (let k = 0; k < 3; k++) Audio.play('woodHit1', { gain: .5, rate: .6, delay: k * .9, x: player.pos.x - 1.8, y: 1.3, z: player.pos.z, ref: 2 }); } catch (e) {} await wait(3200);
    await n4_says([['Dreimal. In der Wand des Arbeitszimmers. Dieselbe Pause.', 3200], ['„Vegas hat recht gehabt. Überall. Und überall liegt etwas.“', 3600, 'LUKE']]);
    n4_lore('k4_ast', 'Die neun Außenstellen', n4_masch('1 OH · 2 IRL · 3 LAG · 4 SALZ · 5 URAL · 6 INSEL · 7 wir. · 8 CL · 9 NORD') + '\n\nAuf der Rückseite der Klappe, Schreibmaschine: ' + n4_masch('„AST 6 · seit 1983 ohne Personal · Versorgung läuft weiter“') + '\n\nWer wird versorgt?');
  } finally { state.talking = false; }
  n4_fertig('k4_welt', 'Die LWO ist überall, und überall liegt etwas: Ohio, Irland, die Lagune, der Ural, Chile, die Nordsee. Außenstelle 6 hat seit 1983 kein Personal. „Versorgung läuft weiter.“ Auf dem Tonband sagt jemand „danke“.'); n4_save(); }

// =====================================================================  6 · „Papas Marke“ · Vegas (villa.js villa_vegasNochmal → hier; whiskey.js whiskey_papasMarke → neben4_marke)
async function neben4_vegas() { const W = n4_st('welt'), M = n4_st('marke'); const V = (t, ms) => [t, ms, 'VEGAS'];
  if (n4_item('tonband_ast') && !W.vegas) { W.vegas = 1; await n4_says([['Du legst Vegas das Tonband hin. Er hört es zweimal. Beim Klopfen steht er auf.', 4200], V('„Der Ural! Ich hab’s immer gesagt, der Ural! … Was hab ich gesagt?“', 4200), ['„Dass der Ural lügt.“', 2400, 'LUKE'], V('„Siehste.“', 1800)]); n4_save(); return true; }
  const zoll = typeof whiskey_S !== 'undefined' && whiskey_S.flags.has('k4_zoll'), marke = typeof whiskey_S !== 'undefined' && whiskey_S.flags.has('k4_4');
  if (zoll && !marke && !M.frage && (M.angeboten || 0) < 2 && story.side.k4_marke && story.side.k4_marke.state === 'hidden') { M.angeboten = (M.angeboten || 0) + 1; const i = await kirchberg_wahl(['Nach dem Vogel fragen', 'Nichts sagen']); if (i !== 0) return false; M.frage = 1;
    await n4_says([['„Der Vogel. Wem gehört der eigentlich?“', 2400, 'LUKE'], V('„Der gehört keinem. Der war schon da, als ich so klein war wie deine Schwester damals.“', 4400), V('„Frag ihn selber. Der sitzt draußen auf meinem Fensterbrett und guckt, als hätt er was für dich.“', 4600)]);
    n4_start('k4_marke', null, { x: -25, z: -12.3 }); n4_save(); return true; }
  return false; }
function neben4_marke() { const M = n4_st('marke'); if (M.fertig) return; M.fertig = 1; const q = story.side.k4_marke; if (q && q.state === 'hidden') { q.state = 'active'; }
  setTimeout(() => { toast('Der Chip hängt wieder an deinem Schlüsselbund, neben dem Schlüssel von Nr. 4.', 3600); n4_gedanke('n4_wise', 'Whiskey. Ein Flaschenetikett. Und er hört drauf, weil es fast klingt wie sein richtiger Name.', 3800); }, 600);
  n4_fertig('k4_marke', 'Whiskey hat Vegas einen rostigen Kronkorken gebracht: Papas Marke. Vegas hat den Vogel nach der Flasche genannt. Daneben lag mein Einkaufswagenchip. Er hebt auf, was man ihm gibt.'); n4_save(); }

// =====================================================================  7 · „Siebzehn Näpfe“ (Kap. 4): Keiner am Transporter, Gisela am Zaun
const N4_VAN = [7.7, -4.25], N4_KIESEL = [4.85, -3.65];
async function neben4_vanBau() { const O = neben4_S.o, g = new THREE.Group(); g.visible = false; scene.add(g); O.van = g;
  try { const src = await msFBX('vans', 'model.fbx', { '*': { b: 'van_damaged_d.jpg', n: 'van_damaged_n.jpg', r: 'van_damaged_roughness.jpg', m: 'van_damaged_metallic.jpg', rough: 1 } }); const v = src.clone(true); msFit(v, 5, 'max');
    v.traverse(m => { if (m.isMesh) { m.material = Array.isArray(m.material) ? m.material.map(x => x.clone()) : m.material.clone(); for (const mm of [].concat(m.material)) if (mm.color) mm.color.lerp(new THREE.Color(0xe4e2dc), .55); m.castShadow = true; m.receiveShadow = true; } });
    const vg = msGround(v); const b = new THREE.Box3().setFromObject(vg), s = b.getSize(new THREE.Vector3()); if (s.z > s.x) vg.rotation.y = PI / 2; vg.position.set(N4_VAN[0], 0, N4_VAN[1]); g.add(vg); vg.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(vg); O.vanCol = addCol(bb.min.x, bb.max.x, bb.min.z, bb.max.z, bb.max.y, -1); n4_vanCol(false); } catch (e) { console.warn('neben4: Transporter', e); }
  try { if (typeof beob_spur === 'function') beob_spur('kiesel', { pos: [N4_KIESEL[0], n4_boden(...N4_KIESEL), N4_KIESEL[1]], k: [4] }); } catch (e) {} }
function n4_vanCol(an) { const O = neben4_S.o, c = O.vanCol; if (!c) return; if (!c.sv) c.sv = [c.minX, c.maxX, c.minZ, c.maxZ]; if (an) [c.minX, c.maxX, c.minZ, c.maxZ] = c.sv; else { c.minX = c.maxX = -9999; c.minZ = c.maxZ = -9999; } O.vanAn = an; }
function n4_keinerKlick() { if (typeof katzen_get !== 'function') return; const k = katzen_get('KEINER'); if (!k || !n4_k4()) return; const N = n4_st('naepfe'); if (N.fertig) return;
  katzen_klick(k, () => katzen_S.carry === k ? '' : 'Keiner hochheben', () => n4_keinerNehmen()); }
function n4_keinerNehmen() { const N = n4_st('naepfe'), k = katzen_get('KEINER'); if (!k || state.talking || katzen_S.carry === k) return; if (katzen_S.carry) return toast('Eine Katze reicht. Die andere Hand braucht die Lampe.', 2600);
  if (!N.start) { N.start = 1; n4_start('k4_naepfe', null, { x: 26, z: 50.5 }); }
  try { katzen_fauch(k, [N4_KIESEL[0], .1, N4_KIESEL[1]], true); } catch (e) {}
  setTimeout(() => { katzen_tragen(k); N.traegt = 1; if (k.klick) uninteract(k.klick); subtitle('Keiner krallt sich an deiner Kapuze fest und lässt sich tragen wie ein Kragen.', 4000); setTimeout(() => subtitle('„Ich trag eine Katze als Schal. Das ist mein Leben jetzt.“', 3400, 'LUKE'), 4200);
    n4_desc('k4_naepfe', 'Keiner hängt an meiner Kapuze. Gisela wartet am Napfbrett, Am Kirchberg 3.'); }, 550); }
function n4_naepfeTick() { const N = n4_st('naepfe'), O = neben4_S.o, k4 = n4_k4(), crew = n4_kommandoDa();
  if (O.van) { O.van.visible = k4 && crew; if ((k4 && crew) !== !!O.vanAn) n4_vanCol(k4 && crew); }
  if (k4 && N.fertig && typeof kirchberg_S !== 'undefined' && kirchberg_S.zaun && kirchberg_S.brett && n4_d(kirchberg_S.brett.x, kirchberg_S.brett.z) > 22) { kirchberg_S.zaun = false; const G = kirchberg_S.F.gisela; if (G && G.acts.window_lean) kirchberg_clip(G, 'window_lean'); }
  if (!k4 || N.fertig) return;
  { const k = typeof katzen_get === 'function' ? katzen_get('KEINER') : null; if (k && k.klick && !N.traegt && k.klick.userData.action && !k.klick.userData.action.n4) { const f = () => n4_keinerNehmen(); f.n4 = true; k.klick.userData.action = f; k.klick.userData.label = () => katzen_S.carry === k ? '' : 'Keiner hochheben'; if (!interactables.includes(k.klick)) interactables.push(k.klick); } }
  if (!N.funk && crew && typeof villa_S !== 'undefined' && villa_S.uk >= 2 && n4_d(3, -2.5) < 24 && n4_frei() && n4_draussen()) { N.funk = 1; if (typeof lwo_funk === 'function') lwo_funk('„Die Katze von der Rieke sitzt wieder da und guckt in die Ecke.“', { x: 4.2, z: -5.6 }); if (!N.start) { N.start = 1; setTimeout(() => n4_start('k4_naepfe', null, { x: 3, z: -3 }), 3000); } }
  if (N.traegt && typeof kirchberg_S !== 'undefined' && kirchberg_S.brett) { const B = kirchberg_S.brett; if (Math.hypot(player.pos.x - B.x, player.pos.z - (B.z + .8)) < 4 && n4_frei()) n4_gisela(); } }
async function n4_gisela() { const N = n4_st('naepfe'), K = kirchberg_S, B = K.brett, G = K.F.gisela, k = katzen_get('KEINER'); if (N.szene) return; N.szene = 1; neben4_S.busy = true; state.talking = true;
  try { if (G) { if (G.idle0 && G.acts.idle !== G.idle0) { G.acts.idle.setEffectiveWeight(0); G.acts.idle = G.idle0; G.idle0.setEffectiveWeight(1); } G.g.position.set(B.x - 1.4, 0, B.z - .2); G.g.rotation.y = 0; K.zaun = true; lwo_blick(G, 'luke'); }
    const i = typeof KB_NAPF_NAMEN !== 'undefined' ? Math.max(0, KB_NAPF_NAMEN.indexOf('KEINER')) : 3; if (k) katzen_absetzen(k, B.x - B.len / 2 + (i + .5) * B.len / 18, B.z + .45); N.traegt = 0;
    const sag = z => typeof kirchberg_sag === 'function' ? kirchberg_sag(G, z) : say(z);
    await sag([['Gisela steht am Zaun, im Mantel, und sieht die Straße hinunter. Um die Ecke ist eben ein grauer Kombi verschwunden.', 5200, '']]);
    await sag([['Der Handschuh. Immer noch derselbe. Ich hab den schon gehasst, da war ich zehn.', 4600, 'GISELA']]); // R-1/W-4: „nicht gesund“ nur noch Kap. 3
    if (typeof villa_hat === 'function' && villa_hat('kakten')) { const w = await kirchberg_wahl(['„Warum heißt er Keiner?“', 'Nichts fragen']); state.talking = true;
      if (w === 0) { await sag([['Weil keiner gesagt hat, wie er heißt. Der Junge damals. Der, der nicht der Hans war.', 4800, 'GISELA']]); await wait(900);
        await sag([['Meine Mutter hat die Tür zugemacht. Die zwei Herren haben ihn mitgenommen, der Wolter und der Doktor. „Verlegt“, hieß es.', 5600, 'GISELA'], ['Ich hab mir immer gedacht, da, wo er hin ist, geht’s ihm besser.', 3800, 'GISELA']]);
        await n4_says([['Du sagst nichts. Du weißt aus der Akte, wo der Junge liegt: unter dem Stein „Unbekanntes Kind · 08“. Gisela weiß es nicht. Und du sagst es ihr nicht.', 6400]]);
        if (neben4_S.st.post && neben4_S.st.post.gelesen && neben4_S.st.post.gelesen.s59) setTimeout(() => n4_gedanke('n4_hedwig', '„Meine Tochter fragt jeden Abend, ob er weint.“ Die Tochter steht vor mir. Achtundsiebzig.', 200), 1500); } }
    else await sag([['Bring ihn an seinen Napf. Der Vierte von links. Den findet er allein nie.', 3600, 'GISELA']]);
  } finally { state.talking = false; neben4_S.busy = false; }
  n4_lore('k4_keiner', 'Keiner', 'Giselas dünner grauer Kater. „Weil keiner gesagt hat, wie er heißt. Der Junge damals. Der, der nicht der Hans war.“\n\nDie Familie hat nie erfahren, was aus dem Jungen wurde. Ich weiß es jetzt. Als Einziger außer der LWO.');
  N.fertig = 1; n4_fertig('k4_naepfe', 'Keiner sitzt wieder an seinem Napf. Er heißt so, weil keiner gesagt hat, wie der Junge hieß, der 1958 statt Hänschen zurückkam. Gisela hat nie erfahren, was aus ihm wurde. Ich weiß es.'); n4_save(); }

// =====================================================================  8 · „Dieselbe Kanne“ (Wolters Thermoskanne aus Kap. 3; AG-14 +5 über lwo.js 'ag14_kanne')
function n4_kanneTick() { const K = n4_st('kanne'); if (!n4_k4() || K.fertig) return;
  if (!K.start && n4_item('thermoskanne') && typeof villa_S !== 'undefined' && villa_S.uk >= 2 && n4_frei() && n4_draussen()) { K.start = 1;
    modItem('thermoskanne', 'Wolters Thermoskanne', 'Von der Bushaltestelle (Kap. 3). Innen riecht sie nach Fenchel. Auf dem Boden, unter dem Aufkleber, mit dem Taschenmesser eingeritzt: G. W.', 'paper');
    n4_says([['„Wolters Kanne ist immer noch in meiner Jacke. Justin hat über ihn gesagt: ‚Dieselbe Kanne.‘ Als hätte er sie schon mal gesehen.“', 5200, 'LUKE'], ['Du drehst sie um. Auf dem Boden, unter dem Aufkleber, mit dem Taschenmesser eingeritzt: G. W.', 4200]]).then(() => n4_start('k4_kanne', null)); n4_save(); return; }
  if (K.start && typeof villa_hat === 'function' && villa_hat('ag14')) { K.fertig = 1; const gab = typeof lwo_S !== 'undefined' && lwo_S.seen && lwo_S.seen.ag14_kanne !== undefined, grete = typeof villa_S !== 'undefined' && villa_S.grete;
    modItem('thermoskanne', 'Thermoskanne G. W.', 'Wolters Kanne. ' + (gab ? '„Behalten Sie sie. Sie werden frieren, später.“ ' : '') + 'Auf dem Boden eingeritzt: G. W.' + (grete ? ' Grete Wolter.' : ''), 'paper');
    n4_fertig('k4_kanne', (gab ? 'Ich habe Wolter die Kanne hingestellt. „Sie haben sie mir aufgehoben.“ Er hat sie mir gelassen: „Sie werden frieren, später.“' : 'Ich habe die Kanne behalten. Wolter hat nicht danach gefragt.') + ' G. W. – sie gehörte einmal Grete, oder sie war für sie gedacht.'); n4_save(); } }

// ---------------------------------------------------------------------  Spielstand · Laden · Takt
MOD_SAVE.push(['neben4', () => ({ st: neben4_S.st }), v => { if (v && v.st && typeof v.st === 'object') neben4_S.st = v.st; neben4_S.nachLaden = true; }]);
beginGame = (o => function (resume) { const r = o.apply(this, arguments); if (!resume && state.started) { neben4_S.st = {}; neben4_S.nachLaden = true; } return r; })(beginGame);
WORLD_MODS.push(['Nebenaufgaben Kap. 4', async () => { const S = neben4_S; neben4_register();
  try { await document.fonts.load('30px Caveat'); } catch (e) {}
  try { await neben4_gasBau(); } catch (e) { console.warn('neben4: Gasleck', e); }
  try { await neben4_vanBau(); } catch (e) { console.warn('neben4: Transporter', e); }
  // Schuppentür (post.js): bei Weg c heute zu · Schuppen betreten: Günther und die Fächer
  try { const h = typeof post_S !== 'undefined' && post_S.schuppenHit; if (h) { const alt = h.userData.action; h.userData.action = () => (n4_k4() && neben4_postWeg() === 'c') ? n4_schuppenZu() : alt && alt(); }
    const R = typeof kirchberg_S !== 'undefined' && kirchberg_S.raeume.schuppen; if (R) { const alt = R.def.onRein; R.def.onRein = () => { try { if (alt) alt(); } catch (e) {} n4_schuppenRein(); }; } } catch (e) { console.warn('neben4: Schuppen', e); }
  if (typeof katzen_S !== 'undefined') katzen_S.nachRegie.push(kp => { if (kp !== 4) return; const N = n4_st('naepfe'), k = katzen_get('KEINER');
    if (N.fertig && k && typeof kirchberg_S !== 'undefined' && kirchberg_S.brett) { const B = kirchberg_S.brett, i = Math.max(0, KB_NAPF_NAMEN.indexOf('KEINER')); katzen_place(k, B.x - B.len / 2 + (i + .5) * B.len / 18, B.z + .45, { pose: 'loaf' }); } else setTimeout(n4_keinerKlick, 300); });
  if (typeof KAP_END !== 'undefined') KAP_END[4].push(() => neben4_kapEnde());
  if (typeof KAP_BEGIN !== 'undefined') { KAP_BEGIN[5].push(() => neben4_kap5()); }
  S.ready = true; window.__neben4 = { S, st: n4_st, gas: n4_gasTick, pola: n4_polaNehmen, bild: n4_polaBild, grete: n4_greteBild, guenther: n4_guenther, fach: n4_fach, karte: neben4_karte, buch: neben4_haushaltsbuch, gisela: n4_gisela, keiner: n4_keinerNehmen }; }]); // Testzugriff
WORLD_TICK.push(dt => { const S = neben4_S; if (!S.ready || !state.started) return;
  if (S.nachLaden) { S.nachLaden = false; n4_gasNachLaden(); const K = S.st.kassler; if (K && K.genommen && typeof nr4_S !== 'undefined') { if (nr4_S.hb) nr4_S.hb.visible = false; if (nr4_S.hbZettel) nr4_S.hbZettel.visible = false; }
    if (S.st.kanne && S.st.kanne.start && n4_item('thermoskanne')) modItem('thermoskanne', S.st.kanne.fertig ? 'Thermoskanne G. W.' : 'Wolters Thermoskanne', 'Auf dem Boden, unter dem Aufkleber, eingeritzt: G. W.', 'paper');
    if (n4_item('haushaltsbuch')) modItem('haushaltsbuch', 'Oma Ernas Haushaltsbuch', 'Grünes Kassenbuch, Stoffrücken – dasselbe Modell wie Hildes Zählbuch. Jeden Donnerstag: Kassler.', 'paper');
    if (n4_item('tonband_ast')) modItem('tonband_ast', 'Tonband · Kanal 3', '„Kanal 3 · alle AST · 1992“.', 'paper'); if (n4_item('thermos_bfr')) modItem('thermos_bfr', 'Günthers Thermoskanne', '„BfR – Wir bringen Sie heim“.', 'paper');
    if (n4_k4()) setTimeout(n4_keinerKlick, 500); }
  S.chk -= dt; if (S.chk > 0) return; const d = .2 - S.chk; S.chk = .2;
  try { n4_gasTick(d); } catch (e) { console.warn('neben4: Gasleck', e); S.chk = 2; }
  try { n4_postTick(d); n4_naepfeTick(); n4_kanneTick(); } catch (e) { console.warn('neben4: Takt', e); S.chk = 2; } });
