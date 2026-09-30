// =====================================================================  NR. 4 (Modul „nr4“, AP-15 Fassung 3): Oma Ernas Haus, Haus Kranz, Lukes Jugendzuhause
// Nebenaufgabe 5 „Für den Fall, dass du kommst“: Grundriss von Nr. 1 gespiegelt (Diele, Stube, Küche, Peters Zimmer – abgeschlossen bis Kap. 3),
// oben Lukes altes Jugendzimmer (Poster von 2016, dahinter die Papes; Grinder in der Schreibtischschublade – X-6, Fundorte für kiffen.js) mit Bad,
// Keller mit Oma Ernas Pfandkisten („Pfanddomino“, Slapstick S-09). Zettel E-01 … E-20 + drei Zettel nur hier + drei Tonproben (Wortlaut 85).
// Alles abgedeckt (Laken über den Möbeln), nur die Zettel nicht; riecht nach Mottenkugeln und Kaffee. Whiskey: Mikrowellen-Pling am Küchenfenster,
// Küchenwecker beim Gehen (einmal). Außerdem die Ergänzungen in Nr. 1 für „Flocke“ (Hundenapf, fünf Becher, blaues Kinderrad, Kinderkiste mit Jonas' Regelseite,
// U-Heft, Kinderschuh) – innen_ort.js bleibt unberührt, die Dinge werden hier dazugestellt.
// Räume liegen weit außerhalb der Welt (Überblendung an der Haustür wie anwesen_enterHall); Werkzeuge aus kirchberg.js (kirchberg_raum, _rein, _raus, _papier …).
const nr4_S = { ready: false, zettel: new Set(), steps: {}, peterStuhl: 0, flaschen: 0, ausGeh: false };
const NR4 = { x: -1400, z: 1400, og: { x: -1400, z: 1426 }, keller: { x: -1400, z: 1446 }, haus: { x: -28, z: 17, d: 9 } };
// Oma Ernas Zettel: [id, Ort (Raum), Text] – Wortlaut 85 §4 (E-01 … E-20), dazu die drei nur hier (Herd, Kassettenregal, Album) und die Tonproben (85 §1)
const NR4_ZETTEL = {
  'E-01': 'Für den Fall, dass du kommst: Das Bett oben ist bezogen. Schon länger. Beeil dich, frischer wird’s nicht. – Oma',
  'E-02': 'Wenn du das liest, bist du zu spät zum Essen.',
  'E-03': 'LUKAS. Die Pfandflaschen sind für Lucys Führerschein. Nicht für deine Kassetten. Ich hab nachgezählt!',
  'E-04': 'Königsberger Klopse: Kapern NICHT rauspulen. Ich seh das. Ich seh alles. – E.',
  'E-05': 'Das Hufeisen bleibt hängen. Frag nicht. Der Schmied hat auch nicht gefragt, und dem ging’s gut.',
  'E-06': 'Wenn nachts das Telefon geht und keiner sagt was: NICHT Hallo sagen. Auflegen. Die lernen sonst, wie man klingt.',
  'E-07': 'Der Wecker klingelt um drei Uhr dreizehn. Ich hab ihn nicht gestellt. Ich hab ihn in den Kühlschrank gelegt. Jetzt klingelt der Kühlschrank.',
  'E-08': 'An den, der mir immer die Batterien rausnimmt und im Dreieck hinlegt: Die brauch ich für Rosamunde Pilcher! Leg sie wenigstens zurück.',
  'E-09': 'Hilde schreibt sich alles in den Kalender, sogar wann sie weinen darf. Ich hab gesagt, das macht man einfach. Sie sagt, dann macht man’s zu oft.',
  'E-10': 'Peters Zimmer bleibt zu. Wenn ich da reingeh, komm ich nicht mehr raus. Er isst seit dem Sommer Rosenkohl. Früher nie. Ich hab ihm Nachschlag gegeben.',
  'E-11': 'Blaue Dose: für meinen Wechselbalg. Rote Dose: für Lucy. Wer tauscht, kriegt Rosenkohl.',
  'E-12': 'Keine Laterne ins Fenster. Auch nicht an Martin. Ich weiß, das Fest fällt aus. Eben drum.',
  'E-13': 'Wer nachts barfuß rausgeht, kriegt Hausarrest bis Ostern. Wer mit Schuhen rausgeht, auch. Keiner geht raus.',
  'E-14': 'Wenn der Mann mit dem Hut klingelt: Ich bin nicht da. Auch wenn ich da bin. Der hat seinen eigenen Tee.',
  'E-15': 'Marion summt wieder das Schlaflied beim Abwasch. Von mir hat sie das nicht. Ich kenn nur die Melodie. Die singen die Kinder, die zurückkommen, und keiner weiß, von wem.',
  'E-16': 'Das Amt setzt Peter einen Gedenkstein. Ich hab gesagt, der sitzt oben und isst Rosenkohl. Die machen’s trotzdem. Ich geh da nie hin.',
  'E-17': 'Lucy hat Luke die Haare geschnitten. Er sieht aus wie ein Igel nach einer schweren Zeit. Er ist trotzdem der Schönste. Sag’s ihm nicht.',
  'E-18': 'Wer das liest, ist das Finanzamt oder neugierig. Beide kriegen Kassler.',
  'E-19': 'Giselas Kater saß eine Stunde im Flur und hat in die Ecke geguckt. Ich hab ihm Wurst gegeben. Der Ecke auch. Die war morgens weg.',
  'E-20': 'Rote Wolle ist alle. Der Wendt-Junge hat sie wieder geholt. Soll er. Ich kauf neue. Ich kauf so viel, wie er braucht.',
  herd: 'Der Herd ist aus. Ich hab nachgeguckt. Zweimal. Guck trotzdem.',
  kassetten: 'Hildes Kassetten. Gebe ich nicht zurück. Die mit Heino schon gar nicht.',
  album: 'Man sagt Wechselbalg. Ich sag Peter.',
  t_pfand: 'LUKAS. Pfandflaschen sind KEIN Deko!',
  t_kuehl: 'Kind, der Kühlschrank ist kein Fernseher. Zumachen.',
  t_zaehl: 'Mein Wechselbalg hat heute Nacht wieder im Schlaf gezählt. Ich hab mitgezählt. Wir sind bis vierzehn gekommen.' };
const NR4_ORT = { 'E-01': 'Garderobe', 'E-02': 'Küchentisch', 'E-03': 'Pfandkisten', 'E-04': 'Kühlschranktür', 'E-05': 'Haustür, unter dem Hufeisen', 'E-06': 'Am Telefon', 'E-07': 'Fensterbank, beim Küchenwecker', 'E-08': 'Couchtisch', 'E-09': 'Wandkalender',
  'E-10': 'Peters Zimmertür', 'E-11': 'Keksdosen im Schrank', 'E-12': 'Wohnzimmerfenster', 'E-13': 'Schuhregal', 'E-14': 'Türspion', 'E-15': 'Spülbecken', 'E-16': 'Schublade, unter Trauerkarten', 'E-17': 'Badezimmerspiegel', 'E-18': 'Haushaltsbuch',
  'E-19': 'Flurkommode', 'E-20': 'Nähkasten', herd: 'Herd', kassetten: 'Kassettenregal', album: 'Im Album, zwischen den Peter-Fotos', t_pfand: 'Kellertreppe', t_kuehl: 'Kühlschrank, innen', t_zaehl: 'Nachttisch oben' };

// Zettel: gelbliches Papier, Kuli, Tesafilm, Unterstreichungen durchs Papier (Vorschau als Abziehbild, Wortlaut in der Notiz)
function nr4_zettel(id, x, y, z, ry, o = {}) { const t = NR4_ZETTEL[id]; if (!t) return null;
  const w = o.w || .15, h = o.h || .11, worte = t.split(' '), zeilen = []; let cur = ''; for (const wd of worte) { if ((cur + ' ' + wd).length > 22) { zeilen.push(cur); cur = wd; } else cur = cur ? cur + ' ' + wd : wd; } if (cur) zeilen.push(cur);
  const px = Math.max(26, Math.min(40, 300 / Math.max(6, zeilen.length)));
  const map = kirchberg_papier({ w: 384, h: 280, bg: o.bg || '#efe6c4', flecken: 1, tesa: !o.liegt, zeilen: zeilen.slice(0, 7).map((l, i) => [l, 22, 52 + i * px * 1.05, px, 'rgba(22,32,96,.92)', null, (i % 2 ? .012 : -.01), /NICHT|KEIN|LUKAS|ALLES|NIE/.test(l) ? 1 : 0]) });
  const d = kirchberg_decal(map, w, h, x, y, z, ry, { rx: o.liegt ? -PI / 2 : 0, rz: o.rz ?? (kirchberg_r() - .5) * .12, parent: o.parent });
  const hit = kirchberg_hit(Math.max(.22, w + .08), o.liegt ? .12 : Math.max(.2, h + .08), .22, x, y, z, 'Zettel · ' + NR4_ORT[id], () => nr4_lesen(id)); hit.rotation.y = ry; return d; }
function nr4_lesen(id) { if (id === 'E-18' && kapAb(4) && typeof neben4_haushaltsbuch === 'function') return neben4_haushaltsbuch(); // AP-20: ab Kap. 4 das ganze Haushaltsbuch
  const S = nr4_S, neu = !S.zettel.has(id); S.zettel.add(id); kirchberg_start('nr4_oma', { x: NR4.haus.x, z: NR4.haus.z - 6 });
  openNote('Oma Ernas Zettel · ' + NR4_ORT[id], `<span class="hand">${NR4_ZETTEL[id]}</span><br><br><i style="opacity:.7">Kuli, Tesafilm. ${id.startsWith('E-') ? id : ''}</i>`, 'nr4_' + id, () => nr4_nachZettel(id, neu)); }
async function nr4_nachZettel(id, neu) { const S = nr4_S;
  if (id === 'E-11' && neu) { await wait(400); subtitle('Wechselbalg. Hat sie immer gesagt. Ich dachte, das heißt Frechdachs.', 3800, 'LUKE');
    story.lore.push({ key: 'nr4_wechselbalg', title: 'Wer bin ich? · 4', html: 'Wechselbalg. Oma hat es immer gesagt. Mein Wechselbalg.' }); S.steps.wechselbalg = 1; }
  if (id === 'E-08' && neu) { await wait(400); subtitle('Im Dreieck. Wer legt Batterien im Dreieck hin?', 3000, 'LUKE'); }
  const n = [...S.zettel].filter(k => k.startsWith('E-')).length; kirchberg_desc('nr4_oma', `Oma Ernas Zettel: ${n}/20. Dazu die an Herd, Kassettenregal und im Album.`);
  nr4_check(); nr4_save(); }
function nr4_check() { const S = nr4_S, n = [...S.zettel].filter(k => k.startsWith('E-')).length;
  if (n >= 20 && S.zettel.has('album') && S.steps.fotos) { kirchberg_fertig('nr4_oma', 'Peter kam mit anderen Augen zurück und wurde geliebt. Luke hieß genauso: Wechselbalg.');
    if (!story.lore.some(l => l.key === 'nr4_oma')) story.lore.push({ key: 'nr4_oma', title: 'Oma Erna', html: 'Erna Kranz, 1934–2020. Es gibt sie nur noch als Handschrift: Kuli, Tesafilm, Ausrufezeichen. Sie hat für den Fall geschrieben, dass du kommst.' });
    if (!story.lore.some(l => l.key === 'nr4_peter')) story.lore.push({ key: 'nr4_peter', title: 'Onkel Peter', html: 'Peter Kranz, Sommer 1974: blaue Augen. 1976: braune. Derselbe Scheitel.' }); } }

// ---------------------------------------------------------------------  Bau
async function nr4_bau() {
  const S = nr4_S, T = THREE, C = NR4, H = NR4.haus;
  const chairSpec = { chair: { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } };
  const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg` });
  const hutchSpec = tint => ({ 'Wood-1': { ...W_('Wood-1'), color: tint }, 'Wood-2': { ...W_('Wood-2'), color: tint }, 'Wood-3': { ...W_('Wood-3'), color: tint }, Metal: { ...W_('Metal'), m: 'T_Metal_Metallic.jpg' } });
  const bedSpec = b => ({ blanket: { b: 'blanket_color.jpg', n: 'blanket_nrm.jpg', r: 'blanket_rough.jpg', ds: 1, color: b }, mattress: { b: 'mattress_color.jpg', n: 'mattress_nrm.jpg', r: 'mattresss_rough.jpg', color: 0xb8b0a4 }, bed: { b: 'bed_color.jpg', n: 'bed_nrm.jpg', r: 'bed_Rough.jpg', m: 'bed_metalic.jpg' } });
  const sheerSpec = tint => ({ '*': { b: 'DefaultMaterial_Base_color.png', n: 'DefaultMaterial_Normal_DirectX.jpg', r: 'DefaultMaterial_Roughness.png', a: 'DefaultMaterial_Opacity.png', ds: 1, transparent: true, alphaTest: .02, flipN: true, color: tint } });
  const retroSpec = { '*': { b: 'curtainroom_01_-_Default_BaseColor.jpg', n: 'curtainroom_01_-_Default_Normal.jpg', r: 'curtainroom_01_-_Default_Roughness.jpg', ds: 1, color: 0x8a7a70 } };
  const put = (o, x, y, z, ry, par) => kirchberg_setze(o, x, y, z, ry, par);
  // Laken über Möbeln: dasselbe Möbel-Scan-Modell, mit Stoff überzogen (Gardinen-Scan als Tuch, leicht gewellt)
  const lakenMat = new T.MeshStandardMaterial({ map: msTex('curtain_sheer/DefaultMaterial_Base_color.png', true), normalMap: M.cloth && M.cloth.normalMap || null, color: 0xd8d2c4, roughness: 1, side: T.DoubleSide });
  const laken = o => { if (!o) return o; o.traverse(m => { if (m.isMesh) { m.material = lakenMat; } }); return o; };
  const nacht = () => new T.MeshStandardMaterial({ color: 0x030507, roughness: .3, emissive: 0x0a1018, emissiveIntensity: .7 });
  const fenster = async (R, x, z, ry, yc = 1.55, curt = 'both') => { const gl = new T.Mesh(new T.PlaneGeometry(1, 1.25), nacht()); gl.position.set(x, yc, z); gl.rotation.y = ry; R.g.add(gl);
    const f = await kirchberg_mod('window', 'model.gltf', 1.4); if (f) { f.scale.x *= .85; put(f, x - Math.sin(ry) * .01, yc - .7, z - Math.cos(ry) * .01, ry, R.g); }
    const c = await kirchberg_fbx('curtain_sheer', sheerSpec(0xcfc6b2)); if (c) { c.traverse(m => { if (m.isMesh) { m.material.depthWrite = false; m.castShadow = false; } }); msFit(c, 1.65, 'y'); put(c, x + Math.sin(ry) * .12, yc - .85, z + Math.cos(ry) * .12, ry, R.g); }
    if (curt === 'both') for (const s of [-1, 1]) { const r = await kirchberg_fbx('curtain_retro', retroSpec); if (r) { r.traverse(m => { if (m.isMesh && (m.name === 'Cylinder001' || m.name === 'Torus026')) m.visible = false; }); msFit(r, 1.9, 'y'); r.scale.x *= .45; put(r, x + Math.cos(ry) * s * .72 + Math.sin(ry) * .2, yc - 1.05, z - Math.sin(ry) * s * .72 + Math.cos(ry) * .2, ry, R.g); } } };
  const schmutz = (R, w, h, x, y, z, ry, rx = 0, tint = 0x7a6a50, op = .75) => { const m = msSurfMat('grime', { alpha: true, tint }); m.opacity = op; const d = new T.Mesh(new T.PlaneGeometry(w, h), m); d.position.set(x, y, z); d.rotation.set(rx, ry, 0, 'YXZ'); d.renderOrder = 1; d.userData.noCol = true; R.g.add(d); };
  const spinnweben = (R, pts) => { const src = scene.getObjectByName ? null : null; for (const [x, y, z, ry, s] of pts) { if (!nr4_S.cob) return; const w = nr4_S.cob.clone(); w.position.set(x, y, z); w.rotation.set(0, ry, kirchberg_r(-.3, .3)); w.scale.setScalar(.0105 * (s || 1)); R.g.add(w); } };
  // Spinnwebe aus dem Bestand (Fab „cobwebs“ – dasselbe Netz wie in Nr. 7)
  scene.traverse(o => { if (!nr4_S.cob && o.isMesh && o.material && o.material.transparent && o.material.map && o.material.color && o.material.color.getHex() === 0xd8d4c8 && o.geometry.type === 'BufferGeometry') nr4_S.cob = o; });

  // ================= Erdgeschoss (12 × 10 m, Grundriss Nr. 1 gespiegelt): Diele (vorn links, Haustür) · Stube (vorn rechts) · Küche (hinten links) · Peters Zimmer (hinten rechts, zu)
  const R = kirchberg_raum({ id: 'nr4', x: C.x, z: C.z, w: 12, d: 10, h: 2.75, wand: 'wallpaper_old', wandTint: 0xa8987c, boden: 'floor_worn', bodenTint: 0x7a6a56,
    waende: [['x', C.z, C.x - 6, C.x + 6, [{ at: C.x - 3, w: 1.1 }, { at: C.x + 3, w: 1.1 }]], ['z', C.x, C.z, C.z + 5, [{ at: C.z + 2.5, w: 1.2 }]], ['z', C.x, C.z - 5, C.z, []]],
    tuer: [C.x - 3, C.z + 4.95, PI], tuerWand: 'n', rein: { x: C.x - 3, z: C.z + 3.9, yaw: 0 }, raus: { x: H.x, z: H.z - H.d / 2 - 1.5, yaw: 0 }, rausLabel: 'Hinaus (Haustür)' });
  S.R = R; const g = R.g, x0 = R.x0, x1 = R.x1, z0 = R.z0, z1 = R.z1;
  // ---- Diele (x −6…0, z 0…5)
  { const gar = await kirchberg_mod('wardrobe', 'model.gltf', 1.9); if (gar) put(gar, x0 + .32, 0, C.z + 3.3, PI / 2, g);
    const jacke = await kirchberg_fbx('w_jacke', { '*': { b: 'model.jpg', rough: .95, ds: true } }, .8); if (jacke) { jacke.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.5, .42, .36); } }); put(jacke, x0 + .45, 1.05, C.z + 3.6, PI / 2, g); }
    nr4_zettel('E-01', x0 + .115, 1.45, C.z + 2.7, PI / 2, { parent: null });
    nr4_zettel('E-05', C.x - 3 + .45, 2.12, z1 - .115, PI); nr4_zettel('E-14', C.x - 3 - .38, 1.58, z1 - .115, PI, { w: .12, h: .09 });
    // Hufeisen über der Tür (Scan-Oberfläche Rost auf gebogenem Band – kein Modell im Katalog: als Abziehbild)
    kirchberg_decal(kirchberg_tex(kirchberg_cnv(128, 128, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = '#5a4230'; x.lineWidth = 16; x.lineCap = 'round'; x.beginPath(); x.arc(w / 2, w * .44, w * .3, PI * .95, PI * .05, true); x.stroke(); x.fillStyle = '#2a1e14'; for (let i = 0; i < 6; i++) { const a = PI * (1 - i / 5) * .9 + .15; x.beginPath(); x.arc(w / 2 + Math.cos(a) * w * .3, w * .44 - Math.sin(a) * w * .3, 3, 0, 7); x.fill(); } })), .2, .2, C.x - 3, 2.42, z1 - .112, PI, { alpha: true, parent: g });
    const reg = await kirchberg_fbx('dresser', hutchSpec(0x7a6a58), .55); if (reg) put(reg, C.x - 1.1, 0, z1 - .35, PI, g); nr4_zettel('E-13', C.x - 1.1, .58, z1 - .38, 0, { liegt: true });
    const kom = await kirchberg_fbx('dresser', hutchSpec(0x8a7a64), .95); if (kom) { put(kom, C.x - .35, 0, C.z + 1.3, -PI / 2, g); S.kom = kom; }
    const ky = S.kom ? kirchberg_top(S.kom, C.x - .35, C.z + 1.3, 3, .95) : .95;
    nr4_zettel('E-19', C.x - .32, ky + .002, C.z + 1.45, 0, { liegt: true });
    // Telefon mit Wählscheibe (Radio-Scan als Ersatz für das fehlende Telefon – nur der Hörer-Klang), Zettel E-06
    { const tel = await kirchberg_mod('radio', 'model.gltf', .22, 'max'); if (tel) { tel.traverse(m => { if (m.name === 'tubes') m.visible = false; if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiplyScalar(.35); } }); put(tel, C.x - .4, ky, C.z + 1.0, -PI / 2, g); }
      nr4_zettel('E-06', C.x - .115, ky + .25, C.z + .95, -PI / 2, { w: .13, h: .1 }); }
    // zwei Fotos im Flur: Peter 1974 (blaue Augen), Peter 1976 (braune Augen)
    const foto = (jahr, augen) => kirchberg_papier({ w: 256, h: 320, bg: '#d8ccb0', flecken: 1, fn: (x, w, h) => { const gg = x.createLinearGradient(0, 20, 0, h - 60); gg.addColorStop(0, jahr < 1975 ? '#b8a878' : '#a8a098'); gg.addColorStop(1, '#5a4a30'); x.fillStyle = gg; x.fillRect(16, 16, w - 32, h - 70);
      if (jahr < 1975) { x.fillStyle = 'rgba(80,60,40,.6)'; x.fillRect(150, 60, 80, 50); x.fillStyle = 'rgba(160,40,30,.5)'; x.fillRect(160, 70, 30, 12); } // die Tankstelle Kranz hinten
      x.fillStyle = '#3a2a1c'; x.beginPath(); x.ellipse(w / 2, 130, 34, 40, 0, 0, 7); x.fill(); x.fillStyle = '#c8a48a'; x.beginPath(); x.ellipse(w / 2, 140, 28, 32, 0, 0, 7); x.fill(); x.fillStyle = '#3a2a1c'; x.fillRect(w / 2 - 32, 102, 64, 16); x.fillRect(w / 2 - 2, 100, 4, 20);
      x.fillStyle = augen; for (const dx of [-10, 10]) { x.beginPath(); x.arc(w / 2 + dx, 140, 3.2, 0, 7); x.fill(); } x.fillStyle = '#6a3a2a'; x.fillRect(w / 2 - 9, 158, 18, 3); if (jahr < 1975) { x.fillStyle = '#f0e8d8'; x.fillRect(w / 2 - 4, 158, 5, 4); } // Zahnlücke
      x.fillStyle = '#4a5a7a'; x.fillRect(w / 2 - 44, 172, 88, 70); x.fillStyle = 'rgba(40,30,20,.85)'; x.font = '24px "Caveat", cursive'; x.fillText(jahr < 1975 ? 'Peter, Sommer 1974' : 'Peter, 1976', 30, h - 22); } });
    for (const [dz, jahr, aug] of [[.55, 1974, '#4a7ab8'], [1.25, 1976, '#5a3a22']]) { const fr = await kirchberg_mod('frame_deco', 'model.gltf', .38); if (fr) put(fr, x0 + .12, 1.5, C.z + dz, PI / 2, g); kirchberg_decal(foto(jahr, aug), .2, .25, x0 + .135, 1.68, C.z + dz, PI / 2, { parent: g }); }
    kirchberg_hit(.3, .5, 1.2, x0 + .2, 1.62, C.z + .9, 'Zwei Fotos im Flur', () => { S.steps.fotos = 1; openNote('Zwei Fotos im Flur', 'Links: Junge, acht, Zahnlücke, die Tankstelle Kranz hinten, blaue Augen. „Peter, Sommer 1974“.\nRechts: derselbe Junge, zehn, Schulfoto, derselbe Scheitel, braune Augen. „Peter, 1976“.', 'nr4_fotos',
      async () => { await say([['Onkel Peter. Hab ich nie kennengelernt.', 2800, 'LUKE']]); await wait(600); await say([['Blaue Augen und dann braune. Geht das?', 3000, 'LUKE']]); nr4_check(); }); });
    // Treppe nach oben (Stufen aus Dielenholz) und Kellertür
    const stufe = kirchberg_mat('floor_wood', 0x5a4636, .8); for (let k = 0; k < 6; k++) box(1, .18, .3, x0 + .75 + 0, .09 + k * .18, C.z + .45 + k * .3, stufe, { parent: g, collide: k < 2 });
    box(1.1, 1.1, 1.8, x0 + .75, .55, C.z + 1.3, hidden, { collide: true, cast: false });
    S.treppeHit = kirchberg_hit(1, 1.6, 1.8, x0 + .75, 1, C.z + 1.3, 'Treppe nach oben', () => nr4_wechsel('og'));
    { const d = await kirchberg_mod('door1', 'model.gltf', 2.0); if (d) put(d, C.x - 1.6, 0, C.z + .115, 0, g); nr4_zettel('t_pfand', C.x - 1.6, 1.5, C.z + .15, 0, { w: .12, h: .09 });
      S.kellerHit = kirchberg_hit(1, 2, .4, C.x - 1.6, 1, C.z + .3, 'Kellertür', () => nr4_wechsel('keller')); }
    kirchberg_licht(R, 0xffbf80, .9, 5.5, C.x - 3, 2.5, C.z + 2.5);
    schmutz(R, 1.2, .8, x0 + .105, .45, C.z + 4, PI / 2);
    await kirchberg_kram(g, [['teppich', C.x - 3.2, 0, C.z + 2.6, .05, .9], ['zeitung', C.x - 4.6, 0, C.z + 4.2, .4], ['zeitung', C.x - 4.4, 0, C.z + 4.4, 1.1], ['stapel', C.x - .3, ky, C.z + 1.7], ['glas', C.x - .45, ky, C.z + .75], ['stapel', x0 + .4, 0, C.z + 4.5]]); kirchberg_birne(R, C.x - 3, 2.35, C.z + 2.5, .6); spinnweben(R, [[x0 + .2, 2.6, z1 - .2, -PI / 4, .6], [C.x - .2, 2.6, C.z + .2, PI * .75, .5]]); }
  // ---- Stube (x 0…6, z 0…5): Sofa und Sessel unter Laken, Couchtisch mit Fernbedienung in Folie + Batterien im Dreieck, Kassettenregal, Fernseher, Nähkasten, Kalender
  { const sofa = laken(await kirchberg_fbx('sofa', { Sofa: { b: 'Sofa_BaseColor.jpg', n: 'Sofa_Normal.jpg', r: 'Sofa_Roughness.jpg' } }, 2.0, 'x')); if (sofa) put(sofa, C.x + 3.2, 0, z1 - .55, PI, g);
    const ses = laken(await kirchberg_fbx('chair', chairSpec, .95)); if (ses) put(ses, C.x + 5.1, 0, C.z + 2.6, -PI / 2 - .3, g);
    const tisch = await kirchberg_mod('metaltable', 'model.gltf', 0); if (tisch) { tisch.scale.set(.28, .5, .45); S.couch = put(tisch, C.x + 3.2, 0, C.z + 3, 0, g); }
    const cy = S.couch ? kirchberg_top(S.couch, C.x + 3.2, C.z + 3, 2, .45) : .45;
    // Batterien im Dreieck (Beobachter-Spur, E-08) und die Fernbedienung in Frischhaltefolie
    const bat = await kirchberg_mod('../ue/batterie', 'model.glb', .05, 'max'); if (bat) for (let i = 0; i < 3; i++) { const b = bat.clone(true); const a = i / 3 * PI * 2; b.rotation.z = PI / 2; put(b, C.x + 3.1 + Math.cos(a) * .045, cy + .008, C.z + 3.05 + Math.sin(a) * .045, a + PI / 2, g); }
    { const fb = await kirchberg_mod('radio', 'model.gltf', .17, 'max'); if (fb) { fb.traverse(m => { if (m.name === 'tubes') m.visible = false; if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.12, .12, .12); m.material.roughness = .2; } }); fb.scale.y *= .3; put(fb, C.x + 3.45, cy, C.z + 2.95, .4, g); } }
    nr4_zettel('E-08', C.x + 3.35, cy + .003, C.z + 3.15, 0, { liegt: true });
    const tv = await kirchberg_mod('crt', 'model.glb', .5); if (tv) put(tv, C.x + 3.2, .48, C.z + .45, 0, g); { const k = await kirchberg_fbx('dresser', hutchSpec(0x6a5a48), .48); if (k) put(k, C.x + 3.2, 0, C.z + .4, 0, g); }
    // Kassettenregal (Wandbord mit Kassetten-Stapeln als Bücher-Scan) + Heino-Kassette (Tauschgut)
    { const sh = await kirchberg_mod('shelf', 'model.gltf', 1.1, 'x'); if (sh) put(sh, x1 - .15, 1.2, C.z + 1.6, -PI / 2, g);
      const kas = await kirchberg_mod('w_buch', 'model.glb', .11, 'max'); if (kas) for (let i = 0; i < 16; i++) { const k = kas.clone(true); k.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setHSL(i * .13 % 1, .35, .35); } }); k.rotation.z = PI / 2; put(k, x1 - .18, 1.25 + (i > 7 ? .01 : 0), C.z + 1.15 + (i % 8) * .12, 0, g); }
      nr4_zettel('kassetten', x1 - .115, 1.55, C.z + 1.95, -PI / 2, { w: .13, h: .1 });
      kirchberg_hit(.3, .4, 1.1, x1 - .2, 1.3, C.z + 1.6, 'Kassetten', () => { if (nr4_S.steps.heino) return toast('Hildes Kassetten. Handschrift auf jeder Hülle. Eine Lücke, wo Heino war.', 3200); nr4_S.steps.heino = 1; if (typeof tausch_gib === 'function') tausch_gib('heino', 1, true); modItem('heino', 'Heino-Kassette', 'Glitzernde Hülle. Hildes Schrift: „Nicht von mir.“', 'paper'); addItem('heino'); toast('Du nimmst die Heino-Kassette. Die Hülle glitzert. Der Rabe wird sie mögen.', 3600); nr4_save(); }); }
    // Fotoalbum auf dem Sessel-Laken (Peter-Fotos, Zettel „Man sagt Wechselbalg“)
    { const al = await kirchberg_mod('w_buch', 'model.glb', .3, 'max'); if (al) { al.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.35, .24, .16); } }); put(al, C.x + 4.2, .48, C.z + 2.3, .7, g); }
      kirchberg_hit(.4, .3, .4, C.x + 4.2, .55, C.z + 2.3, 'Fotoalbum', () => nr4_lesen('album')); }
    // Nähkasten (Kommode klein) mit rotem Wollfaden, Wandkalender, Wohnzimmerfenster mit E-12
    { const n = await kirchberg_fbx('dresser', hutchSpec(0x9a7a5a), .42); if (n) put(n, x1 - .45, 0, z1 - .4, -PI / 2, g); nr4_zettel('E-20', x1 - .45, .43, z1 - .38, 0, { liegt: true }); }
    { const kal = kirchberg_papier({ w: 300, h: 420, bg: '#f2ecde', zeilen: [['NOVEMBER 2020', 26, 50, 30, '#8a1a14', 'Georgia, serif', 0]], fn: (x, w, h) => { x.strokeStyle = '#999'; for (let r = 0; r < 6; r++) for (let c = 0; c < 7; c++) x.strokeRect(20 + c * 38, 80 + r * 50, 38, 50); x.fillStyle = 'rgba(20,30,100,.85)'; x.font = '20px Caveat'; x.fillText('Hilde Kaffee', 62, 170); x.fillText('Arzt', 172, 270); } });
      kirchberg_decal(kal, .3, .42, C.x + .115, 1.5, C.z + 4, PI / 2, { parent: g }); nr4_zettel('E-09', C.x + .118, 1.18, C.z + 4.1, PI / 2, { w: .12, h: .09 }); }
    await fenster(R, C.x + 3.2, z1 - .11, PI); nr4_zettel('E-12', C.x + 2.55, 1.2, z1 - .12, PI, { w: .12, h: .09 });
    { const sl = await kirchberg_mod('floorlamp', 'model.gltf', 1.55); if (sl) put(sl, x1 - .4, 0, C.z + .4, 0, g); } kirchberg_licht(R, 0xffb870, 1.1, 6, x1 - .4, 1.45, C.z + .45);
    { const u = await kirchberg_mod('wallclock', 'model.gltf', .8); if (u) put(u, C.x + 1.4, 1.35, C.z + .115, 0, g); }
    { const f = await kirchberg_mod('frame_dmg', 'model.gltf', .6); if (f) put(f, C.x + 4.6, 1.5, z1 - .12, PI, g); }
    schmutz(R, 2, 1.4, C.x + 3, .004, C.z + 2.8, 0, -PI / 2, 0x5a4a38, .45);
    await kirchberg_kram(g, [['teppich', C.x + 3.2, 0, C.z + 2.9, .1, 1.1], ['tasse', C.x + 2.9, cy, C.z + 2.85], ['zeitung', C.x + 3.6, cy, C.z + 3.2, .3, .7], ['stapel', C.x + .5, 0, z1 - .4], ['stapel', x1 - .4, 0, C.z + .9], ['glas', C.x + 3.5, .98, C.z + .45], ['teller', C.x + 2.8, .98, C.z + .42]]); spinnweben(R, [[x1 - .2, 2.6, z1 - .2, PI * 1.25, .7], [x1 - .2, 2.6, C.z + .2, -PI / 4, .5]]); }
  // ---- Küche (x −6…0, z −5…0): Buffet, Unterschränke, Herd, Spüle, Kühlschrank mit Wecker, Küchentisch, Keksdosen, Schublade mit Trauerkarten, Haushaltsbuch
  { let cabW = 0; for (let i = 0; i < 4; i++) { const c = await kirchberg_fbx('dresser', hutchSpec(0xd8cfb8), .9); if (!c) continue; const gg = put(c, x0 + .6 + i * (cabW || .9), 0, z0 + .38, 0, g); if (!cabW) { const b = new T.Box3().setFromObject(gg); cabW = b.max.x - b.min.x; } }
    const topY = .92;
    const em = new T.MeshStandardMaterial({ map: msTex('wall_plaster/b.jpg', true), normalMap: msTex('wall_plaster/n.jpg'), color: 0xdcd4c2, roughness: .4, metalness: .05 }); em.normalScale.set(.3, .3);
    box(.66, 1.62, .64, C.x - .45, .81, z0 + .45, em, { collide: true, parent: g }); box(.03, .32, .03, C.x - .8, 1.15, z0 + .79, new T.MeshStandardMaterial({ color: 0xaaa8a0, metalness: 1, roughness: .35 }), { parent: g });
    nr4_zettel('E-04', C.x - .45, 1.32, z0 + .775, 0, { w: .13, h: .1 }); nr4_zettel('t_kuehl', C.x - .3, 1.05, z0 + .775, 0, { w: .12, h: .09 });
    kirchberg_hit(.7, 1.7, .5, C.x - .45, .85, z0 + .6, 'Kühlschrank öffnen', () => { if (!nr4_S.zettel.has('E-07')) return toast('Der Kühlschrank ist leer bis auf eine Sache: ein alter Küchenwecker, auf dem Gemüsefach. Zeiger auf 3:13.', 4200); toast('Kalt. Leer. Nur der Wecker.', 2200); });
    nr4_zettel('E-07', x0 + .6 + 1.4, 1.52, z0 + .115, 0, { w: .13, h: .1 }); // Fensterbank beim Wecker
    await fenster(R, x0 + 2, z0 + .11, 0, 1.6, 'sheer');
    nr4_zettel('herd', x0 + .65, topY + .2, z0 + .66, 0, { liegt: false, w: .12, h: .09 }); nr4_zettel('E-15', x0 + 2.4, topY + .3, z0 + .12, 0, { w: .13, h: .1 });
    nr4_zettel('E-16', x0 + 1.6, topY - .25, z0 + .79, 0, { w: .12, h: .09 }); nr4_zettel('E-11', x0 + 3.2, topY - .3, z0 + .79, 0, { w: .12, h: .09 });
    { const buf = await kirchberg_fbx('dresser', hutchSpec(0xcfc2a4), 2.0); if (buf) put(buf, x0 + .38, 0, C.z - 2.8, PI / 2, g);
      const tas = await kirchberg_mod('w_tasse', 'model.glb', .09); if (tas) for (let i = 0; i < 5; i++) { put(tas.clone(true), x0 + .3, 1.3, C.z - 3.35 + i * .2, kirchberg_r(0, 6), g); } }
    const tisch = await kirchberg_mod('metaltable', 'model.gltf', 0); if (tisch) { tisch.scale.set(.3, .82, .75); S.kt = put(tisch, C.x - 2.6, 0, C.z - 2.4, 0, g); }
    const ty = S.kt ? kirchberg_top(S.kt, C.x - 2.6, C.z - 2.4, 3, .78) : .78;
    { const m = msSurfMat('wallpaper_fabric', { tint: 0xc8b8a0 }); m.userData.tile = .5; const d = plane(1.2, 1, C.x - 2.6, ty + .004, C.z - 2.4, m); d.userData.noCol = true; }
    for (const [dx, dz, ry] of [[-.7, 0, PI / 2], [.7, 0, -PI / 2], [0, .62, PI]]) { const c = await kirchberg_fbx('chair', chairSpec, .92); if (c) put(c, C.x - 2.6 + dx, 0, C.z - 2.4 + dz, ry + kirchberg_r(-.1, .1), g); }
    nr4_zettel('E-02', C.x - 2.6, ty + .003, C.z - 2.35, 0, { liegt: true });
    { const t = await kirchberg_mod('w_tasse', 'model.glb', .1); if (t) put(t, C.x - 2.2, ty, C.z - 2.2, 1, g); const t2 = await kirchberg_mod('w_teller', 'model.glb', .22, 'max'); if (t2) put(t2, C.x - 2.9, ty, C.z - 2.5, 0, g); }
    { const hb = await kirchberg_mod('w_buch', 'model.glb', .26, 'max'); if (hb) { hb.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.22, .34, .24); } }); S.hb = put(hb, x0 + .45, 1.02, C.z - 2.2, PI / 2, g); } S.hbZettel = nr4_zettel('E-18', x0 + .48, 1.08, C.z - 2.2, PI / 2, { liegt: true, w: .12, h: .09 }); } // AP-20: grünes Kassenbuch (Haushaltsbuch), ab Kap. 4 „Kassler, vier achtzig“
    kirchberg_licht(R, 0xffc88a, 1.3, 6, C.x - 2.6, 2.5, C.z - 2.4); { const f = await kirchberg_mod('frame_deco', 'model.gltf', .5); if (f) put(f, C.x - .12, 1.5, C.z - 3.5, -PI / 2, g); }
    schmutz(R, 1.8, 1.2, x0 + 2, .004, C.z - 1.2, 0, -PI / 2, 0x5a4a38, .5);
    await kirchberg_kram(g, [['teppich', C.x - 2.6, 0, C.z - 2.4, 0, .7], ['tasse', x0 + .9, .92, z0 + .45], ['teller', x0 + 1.4, .92, z0 + .45], ['glas', x0 + 2.8, .92, z0 + .5], ['glas', x0 + 3.05, .92, z0 + .42], ['stapel', x0 + .4, 1.5, C.z - 3.1], ['zeitung', C.x - 2.3, ty, C.z - 2.6, .9, .6]]); kirchberg_birne(R, C.x - 2.6, 2.3, C.z - 2.4, .2); schmutz(R, 2.4, .6, x0 + 2, 1.25, z0 + .105, 0); spinnweben(R, [[x0 + .2, 2.6, z0 + .2, PI / 4, .7]]); }
  // ---- Peters Zimmer (x 0…6, z −5…0): abgeschlossen bis Kap. 3 – durchs Schlüsselloch: frisch bezogenes Bett, Plüschhund, ein Stuhl zum Fenster, kein Staub
  { const d = await kirchberg_mod('door1', 'model.gltf', 2.0); if (d) put(d, C.x + 3, 0, C.z + .02, 0, g); box(1.1, 2.2, .08, C.x + 3, 1.1, C.z, hidden, { collide: true, cast: false, parent: g });
    nr4_zettel('E-10', C.x + 3.25, 1.45, C.z + .07, 0, { w: .13, h: .1 });
    S.peterHit = kirchberg_hit(1, 2, .4, C.x + 3, 1.1, C.z + .25, () => kapAb(3) ? 'Peters Zimmer' : 'Durchs Schlüsselloch sehen', () => nr4_schluesselloch());
    const bett = await kirchberg_fbx('hospbed', bedSpec(0xe0dcd4)); if (bett) { bett.scale.set(.009, .009, -.009); put(bett, x1 - 1, 0, C.z - 3.6, PI / 2, g); }
    const hund = await kirchberg_fbx('teddy_retro', { material0: { b: 'teddy-bear.jpg', color: 0xc8b8a0 }, material1: { b: 'teddy-bear1.jpg', color: 0xc8b8a0 } }, .3); if (hund) put(hund, x1 - .7, .55, C.z - 4.2, -PI / 2 - .3, g);
    const st = await kirchberg_fbx('chair', chairSpec, .9); if (st) { S.peterStuhl = put(st, C.x + 2, 0, C.z - 3.8, PI + .2, g); }
    await fenster(R, C.x + 2.4, z0 + .11, 0, 1.55, 'sheer'); kirchberg_licht(R, 0xb8c8e0, .35, 4, C.x + 2.4, 1.5, z0 + .5); // Mondlicht durchs Fenster
    { const sh = await kirchberg_mod('shelf', 'model.gltf', .9, 'x'); if (sh) put(sh, C.x + .15, 1.4, C.z - 2, PI / 2, g); } }
  await kirchberg_kram(g, [['teppich', C.x + 3.5, 0, C.z - 2.6, .2, .8], ['stapel', C.x + .2, 1.42, C.z - 2.2], ['glas', C.x + .2, 1.42, C.z - 1.7]]);

  // ================= Oben: Lukes altes Jugendzimmer (5 × 4 m) + Bad (2,2 × 4 m)
  { const O = C.og, R2 = kirchberg_raum({ id: 'nr4_og', x: O.x, z: O.z, w: 7.2, d: 4, h: 2.45, wand: 'wallpaper_fabric', wandTint: 0x7c8a8e, boden: 'floor_wood', bodenTint: 0x6a5240,
      waende: [['z', O.x + 1.4, O.z - 2, O.z + 2, [{ at: O.z + 1.2, w: .95 }]]], rein: { x: O.x - 2.9, z: O.z + 1.2, yaw: -PI / 2 } });
    S.R2 = R2; const g2 = R2.g, a0 = R2.x0, a1 = R2.x1, b0 = R2.z0, b1 = R2.z1;
    // Treppengeländer oben (nach unten)
    { const st = kirchberg_mat('floor_wood', 0x5a4636, .8); for (let k = 0; k < 3; k++) box(1, .05, .3, a0 + .6, .02 - k * .0, b1 - .45 - k * .3, st, { parent: g2 }); }
    kirchberg_hit(1, 1, 1, a0 + .6, .5, b1 - .7, 'Treppe nach unten', () => nr4_wechsel('eg'));
    // Bett, frisch bezogen (E-01), Nachttisch mit Tonprobe, Schreibtisch mit Schublade (Grinder), Poster von 2016 (dahinter die Papes), Aufkleber, Schrank, CRT, Regal, Stehlampe
    const bett = await kirchberg_fbx('hospbed', bedSpec(0x3a4a6a)); if (bett) { bett.scale.set(.009, .009, -.009); put(bett, a0 + 1.1, 0, b0 + 1.1, 0, g2); }
    { const nt = await kirchberg_fbx('dresser', hutchSpec(0x6a5040), .5); if (nt) put(nt, a0 + .35, 0, b1 - 1.6, PI / 2, g2); nr4_zettel('t_zaehl', a0 + .36, .51, b1 - 1.6, 0, { liegt: true }); }
    const tisch = await kirchberg_mod('metaltable', 'model.gltf', 0); if (tisch) { tisch.scale.set(.36, .78, .6); S.lt = put(tisch, O.x - .2, 0, b0 + .42, 0, g2); }
    const ly = S.lt ? kirchberg_top(S.lt, O.x - .2, b0 + .42, 3, .75) : .75;
    { const c = await kirchberg_fbx('chair', chairSpec, .9); if (c) put(c, O.x - .1, 0, b0 + 1.05, PI + .3, g2); }
    { const tv = await kirchberg_mod('crt', 'model.glb', .36); if (tv) put(tv, O.x + .45, ly, b0 + .35, -.2, g2); const r = await kirchberg_mod('radio', 'model.gltf', .28, 'max'); if (r) { r.traverse(m => { if (m.name === 'tubes') m.visible = false; }); put(r, O.x - .75, ly, b0 + .32, .15, g2); } }
    { const sch = await kirchberg_mod('wardrobe', 'model.gltf', 1.85); if (sch) put(sch, O.x + 1.05, 0, b1 - .6, PI, g2); }
    { const sl = await kirchberg_mod('floorlamp', 'model.gltf', 1.45); if (sl) put(sl, O.x + 1.05, 0, b0 + .35, 0, g2); } kirchberg_licht(R2, 0xffc890, 1, 5, O.x + 1.0, 1.35, b0 + .45);
    await fenster(R2, a0 + 1.1, b0 + .11, 0, 1.45, 'sheer');
    // Poster „Die Nebelkrähen – 2016“ (kiffen.js) über dem Schreibtisch; Aufkleber am Schrank und am Fensterrahmen
    if (typeof kiffen_poster === 'function') { const p = kiffen_poster('band', O.x - .2, 1.55, b0 + .106, 0); if (p) g2.attach(p); const p2 = kiffen_poster('dub', a0 + .106, 1.5, O.z + .1, PI / 2); if (p2) g2.attach(p2);
      for (const [art, x, y, z, ry] of [['hanf', O.x + .75, 1.2, b1 - .96, PI], ['reggae', a0 + 1.7, 1.2, b0 + .107, 0], ['hanf', O.x - .9, .7, b0 + .107, 0]]) { const s2 = kiffen_poster(art, x, y, z, ry); if (s2) g2.attach(s2); } }
    kirchberg_hit(.5, .7, .3, O.x - .2, 1.55, b0 + .25, 'Poster von 2016', () => toast('„Die Nebelkrähen · live · Alte Schmiede · 2016“. Eine Ecke ist schon oft abgelöst worden. Der Tesafilm ist weich.', 4200));
    // Fundorte X-6 (Kap. 4): Papes hinter dem Poster, Grinder in der Schublade
    S.kf = { papes: [O.x + .02, 1.3, b0 + .16, 0], grinder: [O.x - .55, ly - .08, b0 + .38, .3] }; // Fundorte X-6 (kiffen.js, sobald es geladen ist)
    { const tr = await kirchberg_fbx('teddy_retro', { material0: { b: 'teddy-bear.jpg', color: 0xa89888 }, material1: { b: 'teddy-bear1.jpg', color: 0xa89888 } }, .22); if (tr) put(tr, a0 + 1.5, .55, b0 + .5, .6, g2); }
    { const sh = await kirchberg_mod('shelf', 'model.gltf', .9, 'x'); if (sh) put(sh, a0 + .15, 1.6, O.z + 1.4, PI / 2, g2); const bu = await kirchberg_mod('w_buch', 'model.glb', .2, 'max'); if (bu) for (let i = 0; i < 7; i++) { const b = bu.clone(true); b.rotation.z = PI / 2; put(b, a0 + .2, 1.62, O.z + 1.1 + i * .08, 0, g2); } }
    // Bad: Spiegel (E-17), Waschbecken-Ersatz (Unterschrank), Handtuch
    { const mir = await kirchberg_fbx('mirror', { 'Mirror Border': { b: 'Gold_MIrror_Diffuse.png', n: 'Gold_Mirror_Normal.jpg', r: 'Gold_Mirror_Roughness.png', metal: 1, color: 0xb8a880 }, Mirror: { r: 'Mirror_Roughness.png', metal: 1, rough: .08, color: 0x9aa2aa } });
      if (mir) { mir.rotation.x = -PI / 2; msFit(mir, .7, 'y'); const gm = msGround(mir); put(gm, a1 - .1, 1.2, O.z - .4, -PI / 2, g2); }
      const ws = await kirchberg_fbx('dresser', hutchSpec(0xe0dcd0), .82); if (ws) put(ws, a1 - .35, 0, O.z - .4, -PI / 2, g2); nr4_zettel('E-17', a1 - .11, 1.25, O.z + .05, -PI / 2, { w: .12, h: .09 });
      kirchberg_licht(R2, 0xe8f0ff, .6, 3.5, a1 - 1, 2.2, O.z); }
    schmutz(R2, 1.4, 1, O.x - .2, .004, O.z, 0, -PI / 2, 0x5a4a38, .4);
    await kirchberg_kram(g2, [['teppich', O.x - 1.2, 0, O.z + .3, .3, .9], ['stapel', O.x - .6, ly, b0 + .5], ['tasse', O.x + .1, ly, b0 + .45], ['zeitung', a0 + 2.4, 0, b1 - .6, .8, .8], ['stapel', a0 + .3, 0, b1 - .3], ['glas', a0 + .36, .51, b1 - 1.45]]); spinnweben(R2, [[a1 - .2, 2.3, b0 + .2, -PI / 4, .5]]); }

  // ================= Keller (6 × 5 m, 2,3 m): Pfandkisten, Regale mit Einmachgläsern, Tonprobe, „Pfanddomino“
  { const K = C.keller, R3 = kirchberg_raum({ id: 'nr4_keller', x: K.x, z: K.z, w: 6, d: 5, h: 2.3, wand: 'wall_damaged', wandTint: 0x8a8478, wandTile: 2, boden: 'wet_asphalt', bodenTint: 0x6a6660, decke: 'wall_plaster', rein: { x: K.x - 2.2, z: K.z + 1.7, yaw: PI } });
    S.R3 = R3; const g3 = R3.g, c0 = R3.x0, c1 = R3.x1, d0 = R3.z0, d1 = R3.z1;
    { const st = kirchberg_mat('planks_painted', 0x4a3a2c, 1); for (let k = 0; k < 5; k++) box(1, .05, .28, c0 + .6, 2.1 - k * .42, d1 - .3 - k * .24, st, { parent: g3 }); }
    kirchberg_hit(1, 2, 1, c0 + .6, 1, d1 - .6, 'Kellertreppe hinauf', () => nr4_wechsel('eg'));
    for (let i = 0; i < 2; i++) { const s = await kirchberg_mod('wardrobe', 'model.gltf', 1.9); if (s) put(s, c1 - .3, 0, K.z - 1.2 + i * 1.6, -PI / 2, g3); }
    const glas = await kirchberg_mod('w_becher', 'model.glb', .12); if (glas) for (let i = 0; i < 18; i++) { const b = glas.clone(true); b.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setHSL(.08 + (i % 4) * .05, .5, .35); } }); put(b, c1 - .3, .45 + (i % 3) * .45, K.z - 1.6 + (i / 3 | 0) * .28, kirchberg_r(0, 6), g3); }
    // Pfandkisten (fehlendes Modell „Getränkekiste mit Pfandflaschen“ → Paletten-Scan mit Kanistern als Rückfall)
    { const p = await kirchberg_mod('pallet_ms', 'model.gltf', 1.1, 'max'); if (p) put(p, K.x - .6, 0, d0 + .7, .1, g3); const k2 = await kirchberg_mod('jerrycan', 'model.gltf', .45); if (k2) { put(k2, K.x - .9, .14, d0 + .6, .4, g3); put(k2.clone(true), K.x - .45, .14, d0 + .75, -.3, g3); } }
    nr4_zettel('E-03', K.x - .6, .75, d0 + .115, 0, { w: .13, h: .1 });
    S.domHit = kirchberg_hit(1.4, 1, 1, K.x - .6, .4, d0 + .7, 'Pfandkisten', () => nr4_domino());
    kirchberg_licht(R3, 0xffd8a0, .7, 5, K.x, 2.1, K.z); // nackte Glühbirne an der Decke (Birne als Emission)
    { const bm = new T.Mesh(new T.SphereGeometry(.04, 10, 8), new T.MeshStandardMaterial({ color: 0x222, emissive: 0xffd8a0, emissiveIntensity: 3 })); bm.position.set(K.x, 2.18, K.z); bm.userData.noCol = true; g3.add(bm); }
    schmutz(R3, 2, 1.4, K.x, .004, K.z, 0, -PI / 2, 0x3a3228, .6);
    await kirchberg_kram(g3, [['glas', K.x + 1.3, 0, d0 + .4], ['glas', K.x + 1.5, 0, d0 + .5], ['zeitung', K.x + .6, 0, K.z + .6, 1.3], ['stapel', c0 + .5, 0, K.z - 1.4]]); schmutz(R3, 2.4, 1, c0 + .105, .5, K.z, PI / 2, 0, 0x5a4a38, .8); spinnweben(R3, [[c1 - .2, 2.1, d0 + .2, -PI / 4, .9], [c0 + .2, 2.1, d0 + .2, PI / 4, .8]]); }

  // ================= Außen: Haustür von Nr. 4 (Basis-Klickfläche), Plastikreiher mit Schlüssel, Küchenfenster (Whiskey-Pling)
  { const d = typeof doorOf !== 'undefined' && doorOf[4]; if (d) { d.userData.label = () => 'Nr. 4 · Omas Haus'; d.userData.action = () => nr4_haustuer(); } S.door = d;
    const reiher = await kirchberg_mod('w_urne', 'model.glb', .35).catch(() => null); if (reiher) { reiher.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.4, .32, .26); } }); put(reiher, H.x + 1.4, .35, H.z - H.d / 2 - .8, 0); } }
}
async function nr4_haustuer() { const S = nr4_S; if (state.talking) return;
  if (kap() === 2 || (typeof ch2 !== 'undefined' && ch2.on)) return toast('Abgeschlossen.', 1600);
  kirchberg_start('nr4_oma', { x: NR4.haus.x, z: NR4.haus.z - 6 });
  if (!S.steps.drin) { S.steps.drin = 1; toast('Dein alter Schlüsselbund passt noch. Das Schloss geht schwer.', 2800); }
  await kirchberg_rein('nr4'); S.ausGeh = true; if (!S.steps.pling) { S.steps.pling = 1; setTimeout(() => { if (kirchberg_S.inRaum === 'nr4' && typeof whiskey_mimic === 'function') { whiskey_mimic('pling', { force: true, at: [NR4.x - 3, 1.5, NR4.z - 5.3] }); setTimeout(() => subtitle('Das ist Omas Mikrowelle. Woher kennst du Omas Mikrowelle?', 3600, 'LUKE'), 1600); } }, 9000); } }
// Innen wechseln: Erdgeschoss ↔ oben ↔ Keller (Überblendung, dieselbe Weise wie kirchberg_rein)
async function nr4_wechsel(wohin) { if (state.talking) return; const K = kirchberg_S; state.talking = true; Audio.play(Audio.pick('woodSqueak1', 'woodSqueak2'), { gain: .3, rate: .7 });
  try { await fade(1, 500); const R = K.raeume[wohin === 'og' ? 'nr4_og' : wohin === 'keller' ? 'nr4_keller' : 'nr4'];
    const p = wohin === 'eg' ? (K.inRaum === 'nr4_keller' ? { x: NR4.x - 1.6, z: NR4.z + .9, yaw: PI } : { x: NR4.x - 5.1, z: NR4.z + 3.1, yaw: PI }) : R.def.rein; player.pos.set(p.x, 0, p.z); player.yaw = p.yaw; player.pitch = 0; if (typeof vel !== 'undefined') vel.set(0, 0, 0);
    K.inRaum = R.def.id; if (typeof PERF_CULL !== 'undefined') PERF_CULL.t = 0; await wait(200); await fade(0, 600); } finally { state.talking = false; } }
// Peters Zimmer durchs Schlüsselloch (Kap. 1/2): Blick hinein, der Stuhl steht beim zweiten Blick zur Tür gedreht (Stufe 1)
async function nr4_schluesselloch() { const S = nr4_S; if (kapAb(3)) return toast('Offen. Ein Kopfkissen, darauf ein Zettel.', 2400); // E-21 und SB-05 legt AP-18 hier ab
  if (state.talking) return; state.talking = true; const cam0 = { x: player.pos.x, z: player.pos.z, yaw: player.yaw, pitch: player.pitch };
  const hole = document.createElement('div'); hole.style.cssText = 'position:fixed;inset:0;z-index:5;pointer-events:none;background:radial-gradient(ellipse 9% 15% at 50% 46%,transparent 55%,#000 72%),radial-gradient(circle 4% at 50% 38%,transparent 60%,#000 75%);opacity:0;transition:opacity .6s';
  document.body.appendChild(hole);
  try { await fade(1, 400); player.pos.set(NR4.x + 3, 0, NR4.z + .15); player.yaw = 0; player.pitch = -.12; if (S.peterStuhl && S.peterN) { S.peterStuhl.rotation.y = 0 + .25; } S.peterN = (S.peterN || 0) + 1;
    hole.style.opacity = 1; await fade(0, 500); await wait(2400);
    if (S.peterN === 1) subtitle('Bett frisch bezogen, ein Plüschhund, ein Stuhl zum Fenster. Kein Staub.', 3800); else { subtitle('Der Stuhl. Er steht zur Tür gedreht.', 3000); Audio.play('woodSqueak2', { gain: .06, rate: 1.4 }); }
    await wait(3200); await fade(1, 400); hole.remove(); player.pos.set(cam0.x, 0, cam0.z); player.yaw = cam0.yaw; player.pitch = cam0.pitch; await fade(0, 500); }
  finally { state.talking = false; if (hole.parentNode) hole.remove(); } }
// S-09 Pfanddomino: der Flaschenturm kippt, jede klingt anders (E D C H C), die letzte richtet sich auf (Stufe 1)
async function nr4_domino() { const S = nr4_S; if (S.steps.domino) return toast('Omas Pfandkisten. Einunddreißig Flaschen, jede sauber gespült.', 3000); S.steps.domino = 1; state.talking = true;
  try { const K = NR4.keller; const noten = [659, 587, 523, 494, 523, 587, 440]; for (let i = 0; i < noten.length; i++) { Audio.play('glass1', { gain: .35, rate: noten[i] / 587, x: K.x - .6 + i * .2, y: .3, z: K.z - 1.8 + i * .1, ref: 2 }); await wait(260 + i * 30); if (i === 4) subtitle('E. D. C. H. C …', 1600, 'LUKE'); }
    await wait(900); Audio.play('stones1', { gain: .08, rate: 2.6, dur: 1.2, x: K.x + 1, y: .1, z: K.z, ref: 2 }); await wait(1300); Audio.play('glass1', { gain: .12, rate: .8, x: K.x + 1.8, y: .2, z: K.z + .3, ref: 2 });
    await wait(700); subtitle('Nein. Das hab ich nicht gehört.', 2600, 'LUKE'); } finally { state.talking = false; } }

// ---------------------------------------------------------------------  Nr. 1: Ergänzungen für „Flocke“ (Hundenapf, Becher, Kinderrad, Kinderkiste, U-Heft, Kinderschuh)
async function nr4_nr1() { const S = nr4_S, Yh = typeof Y !== 'undefined' ? Y : .43, put = (o, x, y, z, ry) => kirchberg_setze(o, x, y, z, ry);
  // Hundenapf vor der Tür: Blechnapf mit Regenwasser, weiße Lackschrift FLOCKE
  { const n = await kirchberg_mod('w_teller', 'model.glb', .24, 'max'); if (n) { n.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.6, .6, .58); m.material.metalness = .7; m.material.roughness = .35; } }); put(n, -46.1, .22, -11.35, .3); }
    const wasser = new THREE.Mesh(new THREE.CircleGeometry(.085, 20), new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: .04, metalness: .2, transparent: true, opacity: .8 })); wasser.rotation.x = -PI / 2; wasser.position.set(-46.1, .245, -11.35); wasser.userData.noCol = true; scene.add(wasser);
    kirchberg_decal(kirchberg_tex(kirchberg_cnv(256, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = 'rgba(240,238,228,.9)'; x.font = 'bold 44px Georgia'; x.textAlign = 'center'; x.fillText('FLOCKE', w / 2, 46); })), .16, .04, -46.1, .235, -11.25, 0, { alpha: true });
    kirchberg_hit(.4, .25, .4, -46.1, .3, -11.35, 'Hundenapf', () => { toast('Ein Blechnapf mit Regenwasser. Weiße Lackschrift: FLOCKE.', 3400); setTimeout(async () => { await say([['Flocke.', 1400, 'LUKE']]); await wait(600); await say([['Wir hatten einen Hund. Ich weiß nicht mal, wie der aussah.', 3600, 'LUKE']]); }, 1200); kirchberg_start('home'); }); }
  // Küche Nr. 1: Hakenbrett mit fünf getöpferten Bechern (MAMA, PAPA mit geklebtem Henkel, LUCY, LUKE, einer ohne Namen)
  { const b = await kirchberg_mod('w_tasse', 'model.glb', .1); if (b) { const namen = ['MAMA', 'PAPA', 'LUCY', 'LUKE', '']; namen.forEach((n, i) => { const c = b.clone(true); c.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.setRGB(.45 + i * .03, .38, .28); } }); put(c, -55.84, Yh + 1.52, -16.2 + i * .18, PI / 2); }); }
    kirchberg_hit(.3, .3, 1, -55.8, Yh + 1.55, -15.85, 'Hakenbrett mit fünf Bechern', () => openNote('Die Becher', 'Fünf, selbst getöpfert: MAMA. PAPA, der Henkel geklebt. LUCY. LUKE. Der fünfte hat dieselbe Glasur und keinen Namen, innen ein brauner Kakaorand. Der mit LUKE ist staubig.', 'nr1_becher',
      async () => { await say([['Der ohne Namen war meiner. Aus dem hab ich immer getrunken.', 3400, 'LUKE']]); await wait(700); await say([['Warum steht auf meinem nichts drauf?', 2600, 'LUKE']]); nr4_flocke('becher'); })); }
  // Flur: Lukes blaues Kinderrad – kein Kratzer, keine Delle
  { const r = await kirchberg_mod('bicycle', 'model.gltf', .7); if (r) { r.traverse(m => { if (m.isMesh && m.material) { m.material = m.material.clone(); if (m.material.color) m.material.color.lerp(new THREE.Color(0x2a4a9a), .7); } }); put(r, -44.55, Yh, -13.2, PI / 2); }
    kirchberg_hit(1, .8, .4, -44.55, Yh + .45, -13.2, 'Blaues Kinderrad', () => { toast('Dein blaues Kinderrad. Kein Kratzer, keine Delle.', 3000); nr4_flocke('rad'); }); }
  // Kinderzimmer: Kinderkiste „LUKE – NICHT WEGWERFEN“ mit Jonas' Regelseite (kleine Kommode als Kiste)
  { const W_ = k => ({ b: `T_${k}_BaseColor.jpg`, n: `T_${k}_Normal.jpg`, r: `T_${k}_Roughness.jpg`, color: 0x8a9ab8 }); const k = await kirchberg_fbx('dresser', { 'Wood-1': W_('Wood-1'), 'Wood-2': W_('Wood-2'), 'Wood-3': W_('Wood-3'), Metal: { b: 'T_Metal_BaseColor.jpg' } }, .5);
    if (k) put(k, -55.5, Yh, -21.2, PI / 2); kirchberg_decal(kirchberg_tex(kirchberg_cnv(256, 64, (x, w, h) => { x.fillStyle = '#e8e0c8'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1a1a'; x.font = 'bold 26px "Caveat"'; x.fillText('LUKE – NICHT WEGWERFEN', 10, 42); })), .3, .075, -55.24, Yh + .38, -21.2, PI / 2);
    kirchberg_hit(.6, .5, .6, -55.4, Yh + .3, -21.2, 'Kinderkiste', () => openNote('Jonas’ Regelseite', '<span class="hand" style="font-family:\'Caveat\';color:#8a1010">DIE REGELN (GEHEIM!!!) – JONAS (CHEF), LUKE (VIZE), ZAYN (DARF NICHT, IST 7)<br>1. WER GEFUNDEN WIRD MUSS ZÄLEN<br>2. EISEN IST FREI!!!<br>3. NICHT BEWEGEN WENN SIE GUCKT<br><span style="color:#1a3a8a">4. WER PUPST MUSS ZÄLEN</span></span>', 'nr1_regeln',
      async () => { await say([['Regel vier ist von mir. Die Schrift ist meine.', 3000, 'LUKE']]); await wait(700); await say([['Ich erinnere mich bloß nicht dran.', 2600, 'LUKE']]); if (typeof sammeln_fibel === 'function') try { sammeln_fibel('R-K1'); } catch (e) {} nr4_flocke('regeln'); })); }
  // Elternschlafzimmer: gelbes Kinderuntersuchungsheft in der Kommode, ein Kinderschuh zwischen Mamas Mänteln (kein Schuh-Modell: Notiz)
  kirchberg_hit(.5, .3, .4, -45.2, Yh + .85, -21.4, 'Kommodenschublade', () => openNote('Kinderuntersuchungsheft', 'Gelb. Brandt, Luke. U9: o. B. (Stempel, Frühjahr 2009).\nDarunter ohne Stempel, Mamas Schrift: <span class="hand">Aug. 09 – Narbe li. Handfläche, halbrund. Fahrradunfall.</span>', 'nr1_uheft', () => { subtitle('Fahrradunfall. Das Rad hat nicht mal einen Kratzer.', 3200, 'LUKE'); nr4_flocke('heft'); }));
  kirchberg_hit(.6, 1.2, .5, -44.5, Yh + 1, -20.2, 'Zwischen Mamas Mänteln', () => openNote('Ein Kinderschuh', 'Blau, Klettverschluss, Größe 33. Nur der linke.', 'nr1_schuh', () => { subtitle('Dreiunddreißig. Mit neun hatte ich fünfunddreißig. Glaub ich.', 3400, 'LUKE'); nr4_flocke('schuh'); }));
}
function nr4_flocke(k) { const S = nr4_S; S.steps['f_' + k] = 1; const n = ['becher', 'rad', 'regeln', 'heft', 'schuh'].filter(x => S.steps['f_' + x]).length;
  if (n >= 3 && !story.lore.some(l => l.key === 'nr1_werbinich3')) story.lore.push({ key: 'nr1_werbinich3', title: 'Wer bin ich? · 3', html: 'Foto: blau. Spiegel: braun. Narbe: Fahrrad ohne Kratzer. Ich hab nie gefragt.' });
  nr4_save(); }

// ---------------------------------------------------------------------  Speicherstand, Laden, Takt
function nr4_save() { if (typeof saveGame === 'function' && state.started && !state.ending) try { saveGame(curChapter()); } catch (e) {} }
MOD_SAVE.push(['nr4', () => ({ zettel: [...nr4_S.zettel], steps: nr4_S.steps }), v => { if (!v || typeof v !== 'object') return; (v.zettel || []).forEach(z => nr4_S.zettel.add(z)); Object.assign(nr4_S.steps, v.steps || {}); }]);
WORLD_MODS.push(['Nr. 4 (Oma Ernas Haus)', async () => { try { await document.fonts.load('30px Caveat'); } catch (e) {} await nr4_bau(); try { await nr4_nr1(); } catch (e) { console.warn('Nr. 1 Ergänzungen', e); } nr4_S.ready = true;
  window.__nr4 = { S: nr4_S, rein: () => kirchberg_rein('nr4'), wechsel: nr4_wechsel, lesen: nr4_lesen, domino: nr4_domino, loch: nr4_schluesselloch }; }]); // Testzugriff
WORLD_TICK.push(dt => { const S = nr4_S; if (!S.ready) return;
  if (S.kf && !S.kfOk && typeof kiffen_S !== 'undefined' && kiffen_S.ready && typeof kiffen_fund === 'function') { S.kfOk = true; try { kiffen_fund('papes', S.kf.papes, { label: 'Hinter dem Poster von 2016' }); kiffen_fund('grinder', S.kf.grinder, { label: 'Schreibtischschublade' }); } catch (e) { console.warn('Nr. 4: Kiffen-Fundorte', e); } }
  // Beim Gehen rasselt Omas Küchenwecker im Garten (E-07: der Wecker liegt drinnen im Kühlschrank) – Whiskey, einmal in diesem Kapitel
  if (S.ausGeh && !kirchberg_S.inRaum) { S.ausGeh = false; if (!S.steps.wecker && kap() === 1) { S.steps.wecker = 1; setTimeout(() => { if (typeof whiskey_mimic === 'function') whiskey_mimic('wecker', { force: true, at: [NR4.haus.x + 4, 1.2, NR4.haus.z - 2] }); setTimeout(() => subtitle('Mach das nicht. Bitte.', 2600, 'LUKE'), 2400); }, 600); } }
  if (S.peterHit) { const on = kirchberg_S.inRaum === 'nr4'; } });
