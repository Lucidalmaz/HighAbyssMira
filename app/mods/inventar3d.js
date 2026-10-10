// =====================================================================  INVENTAR 3D (Modul „inventar3d“, Nutzerauftrag 10.10.2026)
// Das Inventar der Fibel zeigt echte 3D-Gegenstände statt Zeichnungen:
//   · Liste: Kategorien (Chips), Sortierung, Scrollen (kein 12-Slot-Limit), je Gegenstand ein aus dem Modell gerendertes Symbol (Sprite), „NEU“-Marke
//   · Detail: Offscreen-Renderer (eigener WebGL-Kontext, nur solange das Inventar offen ist), Maus ziehen = drehen, Rad = Zoom, Doppelklick = zurück,
//     Selbstdrehung im Leerlauf, weiches Dreipunktlicht + Umgebungsbild; Name, Kategorie, Fundort (Kapitel · Ort), Beschreibung, BENUTZEN, KOMBINIEREN
//   · Aufheben: eigene Darstellung (Gegenstand dreht sich groß vor dem Bild, Glanzring, Name, fliegt zur Fibel) – anders als in der Welt
// Modelle: INV3D_MODELLE (key → Verzeichnis unter assets/ms) · Regeln INV3D_REGELN (Name/Symbol → Modell) · ohne Modell: Notiz-/Kartenfläche mit Fotostapel (siehe item_katalog.md)
// Schnittstelle: inv3d_icon(key) → Promise<dataURL|null> · inv3d_pickup(key) · Testzugriff __inv3d · speichert Fundorte (MOD_SAVE „inventar3d“)
const INV3D = { r: null, scene: null, cam: null, env: null, holder: null, cur: null, curKey: null, cache: new Map(), icon: new Map(), iconWait: new Map(), found: {}, seen: new Set(),
  filt: 'alle', sort: 'neu', combine: null, sel: null, yaw: .6, pitch: .18, zoom: 1, vyaw: 0, idle: 0, raf: 0, view: null, ctx: null, drag: null, known: null, chkT: 0, lastClose: 0, pick: null, css: false, w: 0, h: 0 };

// --- Modellbibliothek: Modell-Id → { d: Verzeichnis unter assets/ms, f: Datei, fbx: Materialangaben (FBX mit losen Texturen), rx/ry/rz: Grad (Ausrichtung im Betrachter), s: Größenfaktor, tint: Farbe }
const INV3D_MODELLE = {
  // UE-Importe tragen nur weiße Platzhaltermaterialien → Werkstoffe hier festgelegt (mat: Materialname | '*' → color/metal/rough/opacity)
  schluessel: { d: '../ue/schluesselteil', mat: { '*': { color: 0xa88548, metal: .9, rough: .36 } } },
  batterie: { d: '../ue/batterie', mat: { '*': { color: 0x34383d, metal: .75, rough: .38 } } },
  brechstange: { d: '../ue/brechstange', mat: { '*': { color: 0x6a5b50, metal: 1, rough: .58 } } },
  drahtschneider: { d: '../ue/drahtschneider', mat: { '*': { color: 0x8a2d25, metal: .55, rough: .48 } } },
  lampe1: { d: 'it_lampe1' }, lampe2: { d: '../ue/lampe2' },
  lampe3: { d: 'it_lampe3', mat: { Lantern_01_brass: { color: 0xc25a1e, metal: .55, rough: .42 }, Lantern_01_glass: { color: 0xdbe7ea, metal: 0, rough: .08, opacity: .28 } } },
  sicherung: { d: 'it_sicherung' }, leiter: { d: '../ue/leiter', mat: { '*': { color: 0xa5abb0, metal: .85, rough: .4 } } }, lichtstein: { d: 'it_lichtstein' },
  kamera: { d: 'w_kamera' }, feuerzeug: { d: 'w_lighter' }, album: { d: 'it_album' }, buch: { d: 'w_buch' }, thermos: { d: 'w_thermos' }, spieluhr: { d: 'w_spieluhr' }, teller: { d: 'w_teller', pit: .7 }, tasse: { d: 'w_tasse' },
  brot: { d: 'w_brot', pit: .5 }, funk: { d: 'it_funk' }, rekorder: { d: 'it_rekorder', pit: .35 }, hufeisen: { d: 'hufeisen' }, brille: { d: 'it_brille', pit: .3 }, jerrycan: { d: 'jerrycan', f: 'model.gltf' }, urne: { d: 'w_urne' }, teddy: { d: 'it_teddy' },
  messer: { d: 'messer', fbx: { '*': { b: 'b.jpg', n: 'n.jpg', r: 'r.jpg', m: 'm.jpg', rough: 1, color: 0xa89a8a } }, pit: .5 },
  laterne: { d: 'lantern1', fbx: { lantern: { b: 'lantern_and_bulb_lantern_BaseColor.1001.png', n: 'lantern_and_bulb_lantern_Normal.1001.jpg', r: 'lantern_and_bulb_lantern_Roughness.1001.jpg', m: 'lantern_and_bulb_lantern_Metallic.1001.jpg' }, buln: { b: 'lantern_and_bulb_buln_BaseColor.1001.png', rough: .2 } } },
  kerze: { d: 'candles', pick: /^Candle_large_big_new$/, fbx: { Used_candles: { b: 'Used_candles_BaseColor.jpg', n: 'Used_candles_Normal.jpg', r: 'Used_candles_Roughness.jpg' }, Candles_new: { b: 'Candles_new_BaseColor.jpg', n: 'Candles_new_Normal.jpg', r: 'Candles_new_Roughness.jpg' }, Extra_for_candles: { b: 'Extra_for_candles_BaseColor.jpg', r: 'Extra_for_candles_Roughness.jpg' } } },
  // Poly Haven (CC0): ph_<id> – siehe CREDITS.md
  kassette: { d: 'it_kassette', pit: .5 }, tonbandgeraet: { d: 'ph_cassette_player', pit: .4 }, postkarte: { d: 'it_postkarte', pit: .6 },
  ordner: { d: 'it_ordner', pit: .35 }, notizblock: { d: 'it_notizblock', pit: .6 }, a4: { d: 'it_a4', pit: .7 },
  zigaretten: { d: 'it_zigaretten', pit: .3 }, zange: { d: 'ph_pliers', pit: .4 }, flasche: { d: 'it_flasche', pit: .15 },
  dose: { d: 'ph_can_rusted', pit: .3 }, blechdose: { d: 'ph_oil_tin', pit: .3 }, kuli: { d: 'it_kuli', pit: .5 },
  // Eigenbau Blender (tools/blender/item_bau.py): Kleinteile ohne freie Vorlage, nur Material, keine Schrift
  umschlag: { d: 'it_umschlag', pit: .55 }, brief: { d: 'it_brief', pit: .6 }, zettel: { d: 'it_blatt', pit: .6 }, fahrkarte: { d: 'it_fahrkarte', pit: .6 }, muenze: { d: 'it_muenze', pit: .5 }, murmel: { d: 'it_murmel' },
  ring: { d: 'it_ring', pit: .5 }, glocke: { d: 'it_glocke' }, kreide: { d: 'it_kreide', pit: .4 }, halsband: { d: 'it_halsband', pit: .6 }, handy: { d: 'it_handy', pit: .55 }, autoschluessel: { d: 'it_autoschluessel', pit: .5 },
  folie: { d: 'it_folie' }, plombe: { d: 'it_plombe', pit: .4 }, kronkorken: { d: 'it_kronkorken', pit: .5 }, riemen: { d: 'it_riemen', pit: .5 }, riegel: { d: 'it_riegel', pit: .3 }, schnalle: { d: 'it_schnalle', pit: .5 },
  dienstnadel: { d: 'it_dienstnadel', pit: .4 }, polaroid: { d: 'it_polaroid', pit: .3 }, grinder: { d: 'it_grinder', pit: .5 }, papes: { d: 'it_papes', pit: .5 }, knolle: { d: 'it_knolle' }, tips: { d: 'it_tips', pit: .4 }, schuh: { d: 'it_schuh', pit: .3 },
  lampion: { d: 'it_lampion', pit: .15 }, akte: { d: 'it_akte', pit: .5 }, rucksack: { d: 'it_rucksack', pit: .15 },
};
// Gegenstand → Modell-Id (ausdrücklich), danach Regeln nach Name (erste passende gewinnt)
const INV3D_ITEM = {
  // Schlüssel
  key: 'schluessel', zimmer7: 'schluessel', fuse: 'schluessel', baumhausschluessel: 'schluessel', spindschluessel: 'schluessel', n3_kapschluessel: 'schluessel', n3_pfarrschluessel: 'schluessel', villaschluessel: 'schluessel',
  schluesselteile: 'schluessel', autoschluessel: 'autoschluessel', ring_hufeisen: 'hufeisen',
  // Werkzeug / Gerät / Licht
  batterie: 'batterie', brechstange: 'brechstange', brecheisen: 'brechstange', n3_brecheisen: 'brechstange', drahtschneider: 'drahtschneider', seitenschneider: 'zange', sicherung: 'sicherung',
  lampe1: 'lampe1', lampe2: 'lampe2', lampe3: 'lampe3', leiter_amt: 'leiter', feuerzeug: 'feuerzeug', jonas_messer: 'messer', mamas_kerze: 'kerze', lampion: 'lampion', nord_lantern: 'laterne', n3_glocke: 'glocke',
  // Ton / Foto / Funk
  polaroid_kamera: 'kamera', zayn_kamera: 'kamera', tape: 'rekorder', tonband_ast: 'tonbandgeraet', bergungsfunk: 'funk', sender: 'funk', phone: 'handy',
  n3_kassette_peter: 'kassette', n3_kassette_band: 'kassette', pell_kassette: 'kassette', heino: 'kassette', zayn_kassette: 'kassette', polaroid_heini: 'polaroid',
  // Papier / Akten
  fibel: 'buch', buch: 'buch', haushaltsbuch: 'buch', fotoalbum: 'album', n3_ordner: 'ordner', predigtmappe: 'ordner', hildes_antworten: 'notizblock', umschlag7: 'umschlag', brief_edda: 'brief',
  heidi_karte: 'postkarte', jonas_karte: 'postkarte', wartenummer: 'fahrkarte', nord_fahrkarte: 'fahrkarte', einwilligungen: 'zettel', da10: 'zettel', n3_lieferschein: 'zettel', rechnung_durchschlag: 'zettel',
  rechnung_kuehnle: 'zettel', dina_zeichnung: 'zettel', ow_seiten: 'zettel', heidis_karten: 'postkarte',
  // Erinnerung / Persönliches
  collar: 'halsband', euro_bruno: 'muenze', murmel: 'murmel', miras_ring: 'ring', n3_schuh: 'schuh', lucys_spieluhr: 'spieluhr', brot: 'brot', boerek: 'brot', teddy: 'teddy', nord_baer: 'teddy', geh_lichtstein: 'lichtstein',
  cleo_kreide: 'kreide', cleo_dose: 'blechdose', kronkorken: 'kronkorken', alufolie: 'folie', alupaeckchen: 'folie', kaugummipapier: 'folie', plombe: 'plombe', dienstnadel: 'dienstnadel', lesebrille: 'brille',
  ranzenriemen: 'riemen', riegel_halb: 'riegel', schnalle_turm: 'schnalle', lwo_kuli: 'kuli',
  // Vorräte / Sonstiges
  thermoskanne: 'thermos', thermos_bfr: 'thermos', pfandflasche: 'flasche', futterdose: 'dose', lucy_zigaretten: 'zigaretten', kf_grinder: 'grinder', kf_papes: 'papes', kf_knolle: 'knolle', kf_tips: 'tips' };
// Abwandlungen je Gegenstand (gleiches Modell, anderer Werkstoff/Größe): color = Grundfarbe (bei Texturen Tönung), metal, rough, s = Größenfaktor
const INV3D_VAR = {
  zimmer7: { s: .92 }, fuse: { color: 0x8f949a, metal: 1, rough: .35, s: .85 }, baumhausschluessel: { color: 0xd0aa52, s: .68 }, spindschluessel: { color: 0xb9bcc0, metal: 1, rough: .3 },
  n3_kapschluessel: { color: 0x4a4540, metal: .9, rough: .55, s: 1.12 }, n3_pfarrschluessel: { color: 0x5a4a3c, metal: .9, rough: .5, s: 1.05 }, villaschluessel: { color: 0x7a5a30, metal: .9, rough: .4, s: 1.15 },
  schluesselteile: { color: 0x6b4a32, metal: .8, rough: .7, s: .8 }, dienstnadel: {},
  n3_kassette_band: { color: 0x9fb0c8 }, pell_kassette: { color: 0xc8a0a0 }, heino: { color: 0xb8c8a0 }, zayn_kassette: { color: 0xe0c070 },
  einwilligungen: { color: 0xeeeeee }, da10: { color: 0xd8d0b8 }, n3_lieferschein: { color: 0xe6e0c0 }, rechnung_durchschlag: { color: 0xc8e0d8 }, rechnung_kuehnle: { color: 0xe8dcc8 }, dina_zeichnung: { color: 0xf4f0e4 }, ow_seiten: { color: 0xc9c0a0 },
  thermos_bfr: { color: 0x9fb09a }, nord_baer: { color: 0x9aa0b0 }, sender: { s: .6 }, jonas_karte: { color: 0xdcd0b0 }, heidis_karten: { color: 0xe8e0d8 }, nord_fahrkarte: { color: 0xd8e0c8 }, wartenummer: { color: 0xe8c8a0 },
  alupaeckchen: { s: 1.1 }, kaugummipapier: { s: .55 } };
const INV3D_REGELN = [[/schl(ü|u|ue)ssel|key/i, 'schluessel'], [/lampe|taschenlampe|stablampe/i, 'lampe2'], [/kerze/i, 'kerze'], [/laterne|lampion/i, 'laterne'], [/brille/i, 'brille'], [/teddy|b(ä|ae)r/i, 'teddy'],
  [/thermos/i, 'thermos'], [/kanister/i, 'jerrycan'], [/kassette|tonband/i, 'kassette'], [/brief|umschlag/i, 'umschlag'], [/karte/i, 'postkarte'], [/zettel|seite|blatt|notiz|akte|protokoll|rechnung|liste/i, 'zettel'], [/foto|polaroid|bild/i, 'polaroid']];
const INV3D_KAT = [['alle', 'ALLE'], ['schluessel', 'SCHLÜSSEL'], ['werkzeug', 'WERKZEUG'], ['licht', 'LICHT & GERÄT'], ['papier', 'PAPIER & AKTEN'], ['ton', 'TON & FOTO'], ['persoenlich', 'ERINNERUNG'], ['sonst', 'SONSTIGES']];
function inv3d_kat(k) {
  const it = (typeof ITEMS !== 'undefined' && ITEMS[k]) || {}; let n = ''; try { n = String(it.name || ''); } catch (e) {} const s = (k + ' ' + n).toLowerCase();
  if (/schl(ü|u|ue)ssel|schluessel|^key$|^fuse$|schluesselteile|plombe/.test(s)) return 'schluessel';
  if (/kassette|tonband|tape|rekorder|funk|handy|phone|sender|kamera|polaroid|foto/.test(s)) return 'ton';
  if (/lampe|laterne|lampion|batterie|feuerzeug|kerze|licht|grauer kasten|leiter/.test(s)) return 'licht';
  if (/brech|draht|seitenschneider|zange|messer|kreide|kuli|kugelschreiber|hammer|glocke|schraub/.test(s)) return 'werkzeug';
  if (/brief|karte|akte|buch|heft|zettel|umschlag|rechnung|lieferschein|ordner|mappe|zeichnung|papier|nummer|einwilligung|da10|album|fibel|seite|durchschlag|antworten|haushalt|zeitung|blatt/.test(s)) return 'papier';
  if (/halsband|ring|schuh|murmel|spieluhr|teddy|puppe|brot|b(ö|o|oe)rek|dose|flasche|thermos|m(ü|u)nze|kronkorken|stein|kaugummi/.test(s)) return 'persoenlich';
  return 'sonst';
}
function inv3d_ort() { try { const p = G.player.pos, b = typeof karte_blattAn === 'function' ? karte_blattAn(p.x, p.z) : null; const id = b ? b.id : (p.z > 118 ? 'wald' : 'dorf');
    const L = typeof karte_orte === 'function' ? karte_orte(b || (typeof karte_bl === 'function' ? karte_bl(id) : { id })) : []; let best = null, bd = 1e9;
    for (const [x, z, t] of L) { const d = Math.hypot(x - p.x, z - p.z); if (d < bd && d < 60 && !/^(Nr\.|\d)/.test(t)) { bd = d; best = t; } }
    if (best) return best + (bd > 14 ? ' (in der Nähe)' : ''); return { dorf: 'im Ort', wald: 'im Wald', amt: 'im Amt', villa: 'in der Villa' }[id] || ''; } catch (e) { return ''; } }
function inv3d_kapNr() { try { return typeof kap === 'function' ? kap() : (state.chapter || 1); } catch (e) { return 1; } }
function inv3d_info(k) { const it = ITEMS[k] || { name: k, desc: '' }; let name = k, desc = ''; try { name = String(it.name); desc = String(it.desc || ''); } catch (e) {} return { name, desc }; }

// ---------------------------------------------------------------- Modellwahl
function inv3d_modell(k) {
  if (INV3D_MODELLE[k]) return INV3D_MODELLE[k]; // Testzugriff: Modell-Id direkt
  let m = null; const id = INV3D_ITEM[k];
  if (id) m = INV3D_MODELLE[id] || null;
  else { const n = inv3d_info(k).name.toLowerCase(), t = k + ' ' + n; for (const [re, mid] of INV3D_REGELN) if (re.test(t)) { m = INV3D_MODELLE[mid] || null; break; } }
  const v = m && INV3D_VAR[k]; if (!v || !Object.keys(v).length) return m;
  if (!inv3d_modell.cache) inv3d_modell.cache = new Map(); let r = inv3d_modell.cache.get(k); if (r && r.base === m) return r;
  const ov = {}; for (const f of ['color', 'metal', 'rough']) if (v[f] != null) ov[f] = v[f];
  r = Object.assign({}, m, { base: m, s: (m.s || 1) * (v.s || 1), vk: k, mat: Object.keys(ov).length ? Object.assign({}, m.mat, { '*': Object.assign({}, m.mat && m.mat['*'], ov) }) : m.mat });
  inv3d_modell.cache.set(k, r); return r;
}
// ---------------------------------------------------------------- Renderer (nur bei offenem Inventar / Aufheben)
function inv3d_env(r) {
  const pm = new THREE.PMREMGenerator(r), es = new THREE.Scene(); es.background = new THREE.Color(0x0d0b09);
  const box = new THREE.Mesh(new THREE.BoxGeometry(20, 12, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8d8578).multiplyScalar(1.5), side: THREE.BackSide })); es.add(box); // Raumfarbe (warmgrau) – auch rein metallische Teile bekommen Umgebung
  const panel = (w, h, x, y, z, c, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
  panel(7, 5, -6, 5, 6, 0xffe9cc, 7); panel(6, 3, 7, 3, -5, 0x9db6ff, 5); panel(10, 6, 0, 9, 0, 0xffffff, 3); panel(9, 2, 0, -2, 7, 0xffd9a8, 2.4); panel(3, 6, 7, 1, 5, 0xfff3e0, 3.5);
  const t = pm.fromScene(es, .03).texture; pm.dispose(); es.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); }); return t;
}
// Der Vorschau-Renderer nutzt den Hauptrenderer (gemeinsame Texturen/Geometrien, kein zweiter GL-Kontext): eigene Szene → Zielpuffer (Halbfloat, MSAA) → OutputPass
// (Tonwert + sRGB) → 8-Bit-Puffer → asynchrone Rückgabe in ein 2D-Canvas. Puffer nur, solange das Inventar offen ist.
function inv3d_start(w, h) {
  const I = INV3D;
  if (!I.scene) {
    I.r = renderer; I.scene = new THREE.Scene(); I.cam = new THREE.PerspectiveCamera(30, 1, .05, 50);
    I.env = inv3d_env(I.r); I.scene.environment = I.env; I.scene.environmentIntensity = 1;
    const key = new THREE.DirectionalLight(0xfff0dc, 2.4); key.position.set(-2.4, 3.2, 3.4); const rim = new THREE.DirectionalLight(0x9fb4ff, 1.5); rim.position.set(3, 1.6, -3);
    const fill = new THREE.HemisphereLight(0xcdd6e8, 0x3a2e22, .5); I.scene.add(key, rim, fill);
    I.holder = new THREE.Group(); I.scene.add(I.holder);
    const sc = document.createElement('canvas'); sc.width = sc.height = 128; const x = sc.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    I.shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false })); I.shadow.rotation.x = -Math.PI / 2; I.scene.add(I.shadow);
    I.out = new OutputPass();
  }
  if (w && (I.w !== w || I.h !== h || !I.rt1)) { I.w = w; I.h = h; if (I.rt1) { I.rt1.dispose(); I.rt2.dispose(); }
    I.rt1 = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true }); I.rt2 = new THREE.WebGLRenderTarget(w, h, { type: THREE.UnsignedByteType, depthBuffer: false });
    I.cam.aspect = w / h; I.cam.updateProjectionMatrix(); I.buf = new Uint8Array(w * h * 4); I.img = new ImageData(w, h); I.tmp = null; }
  return I;
}
function inv3d_stop() { const I = INV3D; cancelAnimationFrame(I.raf); I.raf = 0; I.lastClose = performance.now();
  setTimeout(() => { if (INV3D.raf || INV3D.pick || performance.now() - INV3D.lastClose < 7000 || !INV3D.scene) return; try { const I = INV3D; I.env && I.env.dispose(); if (I.rt1) { I.rt1.dispose(); I.rt2.dispose(); } I.out && I.out.dispose(); } catch (e) {}
    const I = INV3D; I.rt1 = I.rt2 = I.scene = I.holder = I.cur = I.curKey = I.env = I.out = null; I.w = I.h = 0; }, 8000); }

// Modell laden → normalisiert (Mitte im Ursprung, größte Ausdehnung 1,6) in eine Gruppe
async function inv3d_lade(k) {
  const I = INV3D, m = inv3d_modell(k); if (!m) return null;
  const ck = m.d + '/' + (m.f || 'model.glb') + '|' + (m.pick || '') + '|' + (m.vk || '') + '|' + (m.rx || 0) + '|' + (m.ry || 0) + '|' + (m.rz || 0);
  if (I.cache.has(ck)) return I.cache.get(ck).then(g => g && g.clone(true));
  const p = (async () => {
    try { const src = m.fbx ? await msFBX(m.d, m.f || 'model.fbx', m.fbx) : await msModel(m.d, m.f || 'model.glb'); const o = src.clone(true), g = new THREE.Group(), pivot = new THREE.Group();
      if (m.pick) { o.traverse(c => { if (c.isMesh && !m.pick.test(c.name)) { c.geometry = new THREE.BufferGeometry(); c.userData.leer = true; } }); } // nicht gewählte Teile ausblenden (Kinder bleiben)
      o.traverse(c => { if (c.isMesh && !c.userData.leer) { c.frustumCulled = false; c.castShadow = c.receiveShadow = false;
        const one = x => { const y = x.clone(); y.fog = false; const ov = m.mat && (m.mat[y.name] || m.mat['*']); if (ov) { if (ov.color != null) y.color.set(ov.color); if (ov.metal != null) y.metalness = ov.metal; if (ov.rough != null) y.roughness = ov.rough; if (ov.opacity != null) { y.transparent = true; y.opacity = ov.opacity; y.depthWrite = false; } y.map = y.map; } return y; };
        c.material = Array.isArray(c.material) ? c.material.map(one) : one(c.material); } });
      o.position.set(0, 0, 0); pivot.add(o); pivot.rotation.set((m.rx || 0) * Math.PI / 180, (m.ry || 0) * Math.PI / 180, (m.rz || 0) * Math.PI / 180); g.add(pivot); g.updateMatrixWorld(true);
      const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3()), s = (1.6 / Math.max(sz.x, sz.y, sz.z, 1e-6)) * (m.s || 1);
      pivot.position.set(0, 0, 0); pivot.scale.setScalar(s); pivot.position.copy(c).multiplyScalar(-s);
      const out = new THREE.Group(); out.add(g); out.userData.h = sz.y * s; return out; } catch (e) { console.warn('inv3d: Modell fehlt', k, e); return null; } })();
  I.cache.set(ck, p); return p.then(g => g && g.clone(true));
}
function inv3d_zeige(g) { const I = INV3D; if (I.cur) I.holder.remove(I.cur); I.cur = g; if (g) { I.holder.add(g); I.shadow.position.y = -(g.userData.h || 1.6) * .5 - .02; } I.holder.rotation.set(0, 0, 0); }
function inv3d_kamera(zoom) { const I = INV3D; const d = 5.2 / (zoom || 1); I.cam.position.set(0, .5 * (1 / (zoom || 1)) + .2, d); I.cam.lookAt(0, 0, 0); }
// ein Bild rendern und in ein 2D-Canvas legen (asynchron; gibt false zurück, wenn gerade ein Bild unterwegs ist)
function inv3d_bild(into, yaw, pitch, zoom) { const I = INV3D; if (!I.scene || !I.cur || !I.rt1 || I.busy) return Promise.resolve(false);
  I.busy = true; const r = I.r; I.holder.rotation.set(pitch, yaw, 0); inv3d_kamera(zoom);
  const rt0 = r.getRenderTarget(), ac = r.autoClear, cc = r.getClearColor(new THREE.Color()), ca = r.getClearAlpha(); const sm = r.shadowMap.autoUpdate;
  try { r.autoClear = true; r.setClearColor(0x000000, 0); r.setRenderTarget(I.rt1); r.render(I.scene, I.cam); I.out.render(r, I.rt2, I.rt1); }
  catch (e) { I.busy = false; r.setRenderTarget(rt0); r.autoClear = ac; r.setClearColor(cc, ca); return Promise.resolve(false); }
  r.setRenderTarget(rt0); r.autoClear = ac; r.setClearColor(cc, ca); r.shadowMap.autoUpdate = sm;
  const w = I.w, h = I.h, buf = I.buf, tok = I.scene;
  return r.readRenderTargetPixelsAsync(I.rt2, 0, 0, w, h, buf).then(() => { I.busy = false; if (INV3D.scene !== tok) return false;
    const d = I.img.data; // Zeilen von unten nach oben, nicht vormultipliziert → vormultipliert-Ausgleich
    for (let y = 0; y < h; y++) { const so = (h - 1 - y) * w * 4, dof = y * w * 4; for (let i = 0; i < w * 4; i += 4) { const a = buf[so + i + 3]; if (a === 255 || a === 0) { d[dof + i] = buf[so + i]; d[dof + i + 1] = buf[so + i + 1]; d[dof + i + 2] = buf[so + i + 2]; d[dof + i + 3] = a; }
        else { const k = 255 / a; d[dof + i] = Math.min(255, buf[so + i] * k); d[dof + i + 1] = Math.min(255, buf[so + i + 1] * k); d[dof + i + 2] = Math.min(255, buf[so + i + 2] * k); d[dof + i + 3] = a; } } }
    if (into.width === w && into.height === h) into.getContext('2d').putImageData(I.img, 0, 0);
    else { if (!I.tmp) { I.tmp = document.createElement('canvas'); I.tmp.width = w; I.tmp.height = h; } I.tmp.getContext('2d').putImageData(I.img, 0, 0); const x = into.getContext('2d'), ar = into.width / into.height; let sw = w, sh = h, sx = 0, sy = 0;
      if (w / h > ar) { sw = h * ar; sx = (w - sw) / 2; } else { sh = w / ar; sy = (h - sh) / 2; } x.clearRect(0, 0, into.width, into.height); x.drawImage(I.tmp, sx, sy, sw, sh, 0, 0, into.width, into.height); }
    return true; }).catch(() => { I.busy = false; return false; });
}

// Symbole (Sprites) je Gegenstand
function inv3d_icon(k) {
  const I = INV3D; if (I.icon.has(k)) return Promise.resolve(I.icon.get(k)); if (I.iconWait.has(k)) return I.iconWait.get(k);
  const p = (async () => { try { const g = await inv3d_lade(k); if (!g) { I.icon.set(k, null); return null; }
      const st = inv3d_start(I.w || 256, I.h || 256); if (!I.rt1) inv3d_start(256, 256); const keep = I.cur; inv3d_zeige(g);
      const c = document.createElement('canvas'); c.width = c.height = 128; let ok = false;
      for (let i = 0; i < 150 && !ok; i++) { if (I.cur !== g) inv3d_zeige(g); ok = await inv3d_bild(c, .55, (inv3d_modell(k) || {}).pit || .22, 1.45); if (!ok) { if (i > 100) I.busy = false; await new Promise(r => setTimeout(r, 16)); } }
      const u = ok ? c.toDataURL('image/png') : null; if (u) I.icon.set(k, u); if (I.cur === g) inv3d_zeige(keep || null); return u; }
    catch (e) { I.icon.set(k, null); return null; } finally { I.iconWait.delete(k); } })();
  I.iconWait.set(k, p); return p;
}

// ---------------------------------------------------------------- Oberfläche (Fibel · Reiter INVENTAR)
function inv3d_css() { if (INV3D.css) return; INV3D.css = true; const s = document.createElement('style'); s.textContent = `
.iv { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(0,1fr); gap: 22px; margin-top: 6px; }
.iv-bar { grid-column: 1 / -1; display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.iv-bar button { font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .24em; padding: 5px 10px; background: rgba(90,60,28,.07); border: 1px solid rgba(60,40,20,.35); color: #2d2117; cursor: pointer; border-radius: 2px; transition: background .18s, border-color .18s, transform .18s; }
.iv-bar button:hover { background: rgba(124,36,24,.1); border-color: var(--pred, #7c2418); }
.iv-bar button.on { background: rgba(124,36,24,.16); border-color: var(--pred, #7c2418); color: #4a140c; }
.iv-bar .sp { flex: 1; } .iv-bar .cnt { font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .2em; opacity: .7; }
.iv-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr)); grid-auto-rows: 104px; gap: 9px; max-height: min(52vh, 460px); overflow-y: auto; padding: 3px 6px 3px 2px; align-content: start; scrollbar-width: thin; }
.iv-it { position: relative; height: 104px; min-width: 0; background: rgba(90,60,28,.06); border: 1px solid rgba(60,40,20,.32); border-radius: 3px; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: inset 0 0 14px rgba(90,60,28,.16); transition: transform .16s ease, border-color .16s, box-shadow .16s, background .16s; overflow: hidden; animation: ivIn .38s ease both; }
.iv-it:hover { transform: translateY(-2px); border-color: var(--pred, #7c2418); background: rgba(124,36,24,.07); }
.iv-it.sel { border-color: var(--pred, #7c2418); box-shadow: inset 0 0 0 1px rgba(124,36,24,.55), 0 0 14px rgba(124,36,24,.25); background: rgba(124,36,24,.1); }
.iv-it.kmb { border-style: dashed; }
.iv-it img { width: 88%; height: 74%; margin-bottom: 14px; object-fit: contain; filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); }
.iv-it svg { width: 46%; height: 46%; margin-bottom: 12px; fill: none; stroke: #2d2117; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.iv-it i { position: absolute; left: 0; right: 0; bottom: 0; padding: 2px 4px; font: 600 10px "Cormorant Garamond", Georgia, serif; letter-spacing: .04em; font-style: normal; text-align: center; color: #fff6e0; background: linear-gradient(0deg, rgba(20,12,6,.78), rgba(20,12,6,0)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.iv-it em { position: absolute; top: 3px; right: 3px; font: 700 8px Georgia, serif; letter-spacing: .12em; color: #fff; background: var(--pred, #7c2418); padding: 1px 4px; border-radius: 2px; font-style: normal; animation: ivPulse 1.8s ease-in-out infinite; }
.iv-det { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.iv-view { position: relative; height: clamp(190px, 33vh, 300px); border-radius: 4px; overflow: hidden; background: radial-gradient(ellipse at 50% 38%, #4a3f33 0%, #241d16 62%, #14100c 100%); box-shadow: inset 0 0 40px rgba(0,0,0,.65), 0 0 0 1px rgba(60,40,20,.5); cursor: grab; touch-action: none; }
.iv-view.drag { cursor: grabbing; }
.iv-view canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.iv-view .hint { position: absolute; left: 0; right: 0; bottom: 6px; text-align: center; font: 600 9px "Cormorant Garamond", Georgia, serif; letter-spacing: .26em; color: rgba(255,240,215,.5); pointer-events: none; transition: opacity .6s; }
.iv-view .flat { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
.iv-view .flat svg { width: 46%; height: 46%; fill: none; stroke: #e9dcc0; stroke-width: 1.2; opacity: .85; }
.iv-det h3 { margin: 2px 0 0; font: 600 21px "Cormorant Garamond", Georgia, serif; letter-spacing: .06em; color: #2a1a10; }
.iv-meta { font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .22em; color: var(--pred, #7c2418); text-transform: uppercase; }
.iv-det p { margin: 0; font-size: 17px; line-height: 1.42; color: #2f2419; min-height: 3.6em; }
.iv-act { display: flex; gap: 8px; flex-wrap: wrap; }
.iv-act button { font: 600 11px "Cormorant Garamond", Georgia, serif; letter-spacing: .26em; padding: 7px 14px; background: rgba(90,60,28,.1); border: 1px solid rgba(60,40,20,.5); color: #2a1a10; cursor: pointer; border-radius: 2px; transition: background .16s, transform .16s; }
.iv-act button:hover { background: rgba(124,36,24,.16); transform: translateY(-1px); } .iv-act button.on { background: rgba(124,36,24,.24); border-color: var(--pred, #7c2418); }
.iv-act button[disabled] { opacity: .4; cursor: default; transform: none; }
@keyframes ivIn { from { opacity: 0; transform: translateY(8px) scale(.94); } to { opacity: 1; transform: none; } }
@keyframes ivPulse { 50% { opacity: .55; } }
#inv3dPick { position: fixed; right: 6vw; bottom: 17vh; width: min(34vw, 360px); aspect-ratio: 1; z-index: 40; pointer-events: none; opacity: 0; will-change: transform, opacity; }
#inv3dPick canvas { width: 100%; height: 100%; display: block; }
#inv3dPick .nm { position: absolute; left: -20%; right: -20%; bottom: -2px; text-align: center; font: 600 15px "Cormorant Garamond", Georgia, serif; letter-spacing: .3em; text-transform: uppercase; color: #f4e7c8; text-shadow: 0 1px 6px #000, 0 0 14px rgba(255,214,150,.5); }
#inv3dPick .nm small { display: block; font-size: 10px; letter-spacing: .4em; color: #c9a36a; margin-bottom: 3px; }
@media (max-width: 820px) { .iv { grid-template-columns: 1fr; } }`; document.head.appendChild(s); }

const INV3D_FLACH = '<svg viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>';
function inv3d_sortiert() {
  const I = INV3D, all = story.items.filter(k => ITEMS[k]); const idx = new Map(story.items.map((k, i) => [k, i]));
  let L = all.filter(k => I.filt === 'alle' || inv3d_kat(k) === I.filt);
  if (I.sort === 'az') L.sort((a, b) => inv3d_info(a).name.localeCompare(inv3d_info(b).name, 'de'));
  else if (I.sort === 'kat') L.sort((a, b) => inv3d_kat(a).localeCompare(inv3d_kat(b)) || idx.get(b) - idx.get(a));
  else L.sort((a, b) => idx.get(b) - idx.get(a)); // neueste zuerst
  return L;
}
function inv3d_render() {
  const I = INV3D, B = $('jBody'); if (!B) return; I.queue = []; inv3d_css(); cancelAnimationFrame(I.raf); I.raf = 0;
  for (const k of story.items) if (ITEMS[k] && !I.found[k]) I.found[k] = I.found[k] || { ch: 0 }; // vor dem Einbau gefundene: Fundort unbekannt
  const list = inv3d_sortiert(), total = story.items.filter(k => ITEMS[k]).length; if (!list.includes(I.sel)) I.sel = list[0] || null;
  const cats = INV3D_KAT.filter(([c]) => c === 'alle' || story.items.some(k => ITEMS[k] && inv3d_kat(k) === c));
  if (!cats.some(([c]) => c === I.filt)) I.filt = 'alle';
  B.innerHTML = `<h2>INVENTAR · ${total}</h2><div class="iv"><div class="iv-bar">${cats.map(([c, l]) => `<button data-c="${c}" class="${I.filt === c ? 'on' : ''}">${l}</button>`).join('')}<span class="sp"></span>
    <button data-s="neu" class="${I.sort === 'neu' ? 'on' : ''}">NEUESTE</button><button data-s="az" class="${I.sort === 'az' ? 'on' : ''}">A–Z</button><button data-s="kat" class="${I.sort === 'kat' ? 'on' : ''}">ART</button></div>
    <div class="iv-list">${list.map((k, i) => { const ic = I.icon.get(k), nm = inv3d_info(k).name; return `<div class="iv-it${k === I.sel ? ' sel' : ''}${I.combine && I.combine !== k ? ' kmb' : ''}" data-k="${k}" style="animation-delay:${Math.min(i, 14) * 22}ms" title="${esc(nm)}">${ic ? `<img src="${ic}">` : (ICONS[k] || ICONS.paper)}<i>${esc(nm)}</i>${I.seen.has(k) || !I.found[k] || !I.found[k].t ? '' : '<em>NEU</em>'}</div>`; }).join('')}</div>
    <div class="iv-det"><div class="iv-view"><div class="flat"></div><canvas></canvas><div class="hint">ZIEHEN · DREHEN &nbsp;&nbsp; RAD · ZOOM &nbsp;&nbsp; DOPPELKLICK · ZURÜCK</div></div>
      <div class="iv-meta"></div><h3></h3><p></p><div class="iv-act"><button data-a="use">BENUTZEN</button><button data-a="mix">KOMBINIEREN</button></div></div></div>
    <div id="invDesc" style="display:none"></div>`;
  B.querySelectorAll('.iv-bar button').forEach(b => b.onclick = e => { e.stopPropagation(); if (b.dataset.c) I.filt = b.dataset.c; if (b.dataset.s) I.sort = b.dataset.s; Audio.paper(); inv3d_render(); });
  B.querySelectorAll('.iv-it').forEach(el => el.onclick = e => { e.stopPropagation(); const k = el.dataset.k;
    if (I.combine && I.combine !== k) { const a = I.combine; I.combine = null; inv3d_kombi(a, k); inv3d_detail(); B.querySelectorAll('.iv-it').forEach(x => x.classList.remove('kmb')); return; }
    I.sel = k; I.combine = null; I.seen.add(k); Audio.play('keys1', { gain: .08, rate: 2.2, dur: .1 }); B.querySelectorAll('.iv-it').forEach(x => { x.classList.toggle('sel', x === el); x.classList.remove('kmb'); }); const nw = el.querySelector('em'); if (nw) nw.remove(); inv3d_detail(true); });
  I.view = B.querySelector('.iv-view'); I.ctx = I.view.querySelector('canvas');
  const act = B.querySelector('.iv-act'); act.querySelector('[data-a=use]').onclick = e => { e.stopPropagation(); inv3d_use(I.sel); };
  act.querySelector('[data-a=mix]').onclick = e => { e.stopPropagation(); I.combine = I.combine ? null : I.sel; Audio.paper(); B.querySelectorAll('.iv-it').forEach(x => x.classList.toggle('kmb', !!I.combine && x.dataset.k !== I.combine)); inv3d_detail(); };
  inv3d_steuerung(); inv3d_detail(true); inv3d_symbole(list);
}
async function inv3d_symbole(list) { const I = INV3D; list.slice(0, 6).forEach(k => { if (inv3d_modell(k)) inv3d_lade(k).catch(() => {}); }); // Modelle schon parallel laden, gezeichnet wird nacheinander
  for (let n = 0; n < list.length; n++) { const k = list[n]; if (n + 5 < list.length && inv3d_modell(list[n + 5]) && !I.icon.has(list[n + 5])) inv3d_lade(list[n + 5]).catch(() => {}); if (I.icon.has(k) || !inv3d_modell(k)) continue; if (!(ui.overlay === 'journal' && jTab === 'inventar')) return;
    const u = await inv3d_icon(k); if (u) { const el = $('jBody').querySelector(`.iv-it[data-k="${k}"]`); if (el) { const svg = el.querySelector('svg'); if (svg) { const im = document.createElement('img'); im.src = u; svg.replaceWith(im); } } }
    await new Promise(r => setTimeout(r, 20)); } }
let inv3d_detailTok = 0;
async function inv3d_detail(reset) {
  const I = INV3D, B = $('jBody'), k = I.sel; if (!B || !I.view) return; const tok = ++inv3d_detailTok;
  const m = B.querySelector('.iv-meta'), h = B.querySelector('.iv-det h3'), p = B.querySelector('.iv-det p'); if (!m) return;
  if (!k) { m.textContent = ''; h.textContent = 'Nichts bei dir'; p.textContent = 'Was du findest, landet hier.'; return; }
  const it = inv3d_info(k), f = I.found[k] || {}, kat = INV3D_KAT.find(([c]) => c === inv3d_kat(k));
  m.textContent = `${kat ? kat[1] : ''}${f.ch ? ' · KAPITEL ' + f.ch : ''}${f.ort ? ' · ' + f.ort : ''}`; h.textContent = it.name;
  p.textContent = I.combine ? `„${it.name}“ mit einem anderen Gegenstand kombinieren – wähle ihn in der Liste.` : it.desc;
  B.querySelector('[data-a=mix]').classList.toggle('on', !!I.combine);
  if (reset) { const mm = inv3d_modell(k); I.pit = mm && mm.pit || .18; I.yaw = .6; I.pitch = I.pit; I.zoom = 1; I.vyaw = 0; I.idle = 0; }
  const g = await inv3d_lade(k); if (tok !== inv3d_detailTok || !I.view || !I.view.isConnected) return;
  const flat = I.view.querySelector('.flat'), cv = I.ctx;
  if (!g) { flat.innerHTML = ICONS[k] || ICONS.paper; cv.style.display = 'none'; cancelAnimationFrame(I.raf); I.raf = 0; return; }
  flat.innerHTML = ''; cv.style.display = '';
  const r = I.view.getBoundingClientRect(), w = Math.max(160, Math.round(r.width)), hh = Math.max(140, Math.round(r.height)), dpr = Math.min(devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(hh * dpr); inv3d_start(cv.width, cv.height); inv3d_zeige(g); I.curKey = k;
  if (!I.raf) inv3d_schleife();
}
function inv3d_schleife() { const I = INV3D; let last = performance.now();
  const f = now => { I.raf = 0; if (!(ui.overlay === 'journal' && jTab === 'inventar') || !I.view || !I.view.isConnected || !I.scene) { inv3d_stop(); return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now; I.idle += dt;
    if (!I.drag) { I.yaw += I.vyaw * dt; I.vyaw *= Math.pow(.04, dt); if (I.idle > 1.6 && Math.abs(I.vyaw) < .3) I.yaw += .5 * dt; I.pitch += ((I.pit || .18) - I.pitch) * Math.min(1, dt * (I.idle > 1.6 ? 1.2 : 0)); }
    inv3d_bild(I.ctx, I.yaw, I.pitch, I.zoom); const hint = I.view.querySelector('.hint'); if (hint && I.idle > 6) hint.style.opacity = 0;
    I.raf = requestAnimationFrame(f); };
  I.raf = requestAnimationFrame(f); }
function inv3d_steuerung() { const I = INV3D, v = I.view; if (!v) return;
  v.onpointerdown = e => { e.stopPropagation(); I.drag = { x: e.clientX, y: e.clientY, t: performance.now() }; v.classList.add('drag'); try { v.setPointerCapture(e.pointerId); } catch (x) {} I.idle = 0; I.vyaw = 0; };
  v.onpointermove = e => { if (!I.drag) return; const dx = e.clientX - I.drag.x, dy = e.clientY - I.drag.y, now = performance.now(), dt = Math.max(.008, (now - I.drag.t) / 1000); I.drag.x = e.clientX; I.drag.y = e.clientY; I.drag.t = now;
    I.yaw += dx * .011; I.pitch = Math.max(-1.1, Math.min(1.1, I.pitch + dy * .008)); I.vyaw = Math.max(-9, Math.min(9, dx * .011 / dt)); I.idle = 0; };
  const up = e => { if (!I.drag) return; I.drag = null; v.classList.remove('drag'); I.idle = 0; };
  v.onpointerup = up; v.onpointercancel = up; v.onlostpointercapture = up;
  v.onwheel = e => { e.preventDefault(); e.stopPropagation(); I.zoom = Math.max(.6, Math.min(2.6, I.zoom * Math.exp(-e.deltaY * .0012))); I.idle = 0; };
  v.ondblclick = e => { e.stopPropagation(); I.yaw = .6; I.pitch = I.pit || .18; I.zoom = 1; I.vyaw = 0; I.idle = 0; Audio.paper(); }; }

// Pfeiltasten wählen im Inventar (wie Maus: Detail wechselt, Liste scrollt mit)
function inv3d_tasten(e) { if (!(ui.overlay === 'journal' && jTab === 'inventar') || !INV3D.view || !INV3D.view.isConnected) return;
  const dx = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 0, ArrowDown: 0 }[e.code]; if (dx === undefined) return;
  const B = $('jBody'), els = [...B.querySelectorAll('.iv-it')]; if (!els.length) return; let i = Math.max(0, els.findIndex(x => x.classList.contains('sel')));
  const L = B.querySelector('.iv-list'), cols = Math.max(1, Math.round(L.clientWidth / (els[0].getBoundingClientRect().width + 9)));
  i += e.code === 'ArrowUp' ? -cols : e.code === 'ArrowDown' ? cols : dx; i = Math.max(0, Math.min(els.length - 1, i)); e.preventDefault(); e.stopPropagation();
  els[i].click(); els[i].scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
try { window.removeEventListener('keydown', window.inv3d_keyfn, true); } catch (e) {} window.inv3d_keyfn = inv3d_tasten; window.addEventListener('keydown', inv3d_tasten, true);

// ---------------------------------------------------------------- Benutzen / Kombinieren
const INV3D_KOMBI = { 'batterie+lampe1': 'bat', 'batterie+lampe2': 'bat', 'batterie+lampe3': 'bat' };
function inv3d_kombi(a, b) { const key = [a, b].sort().join('+'), r = INV3D_KOMBI[key] || INV3D_KOMBI[b + '+' + a];
  if (r === 'bat') { try { flashReload(); } catch (e) {} return; }
  Audio.play('switch1', { gain: .12, rate: .8 }); toast('Das passt nicht zusammen. Vielleicht an einem anderen Ort.', 2400); }
function inv3d_use(k) { if (!k) return; const kat = inv3d_kat(k);
  if (k === 'batterie') { try { flashReload(); } catch (e) {} return; }
  if (/^lampe\d$/.test(k)) { toast('Die Lampe hängt an dir – [F] an/aus, [R] Batterie wechseln.', 3200); return; }
  if (k === 'fibel') { toast('Du hältst sie schon in der Hand.', 2000); return; }
  const T = { schluessel: 'Der passt nur an eine Stelle. Geh nah an die Tür oder das Schloss – dann nimmt ihn Luke von selbst.', werkzeug: 'Das braucht Luke an der richtigen Stelle. Nah ran, dann nimmt er es.',
    licht: 'Luke hält es bereit. Es wirkt, wenn er an der richtigen Stelle steht.', papier: 'Lesen kann er es nur in Ruhe – er legt es zu den Funden der Fibel.', ton: 'Dafür braucht Luke ein Gerät – und einen stillen Ort.',
    persoenlich: 'Das behält er bei sich. Vielleicht erkennt es jemand.', sonst: 'Hier nützt es ihm nichts. Er behält es.' };
  Audio.play('keys1', { gain: .1, rate: 1.3, dur: .12 }); toast(T[kat] || T.sonst, 3000); }

// ---------------------------------------------------------------- Aufheben (eigene Darstellung)
async function inv3d_pickup(k) {
  const I = INV3D; if (!ITEMS[k]) return; if (I.pick) { if (!I.queue) I.queue = []; if (!I.queue.includes(k) && I.queue.length < 3) I.queue.push(k); return; } // Stau (Massenvergabe/Laden): höchstens 3 warten, der Rest kommt still ins Inventar
  if (typeof kino_S !== 'undefined' && kino_S.on) return; if (ui.overlay === 'journal') return;
  I.pick = { t0: performance.now(), k }; inv3d_css();
  try {
    const g = await inv3d_lade(k); if (!g) return;
    let el = $('inv3dPick'); if (!el) { el = document.createElement('div'); el.id = 'inv3dPick'; el.innerHTML = '<canvas width="480" height="480"></canvas><div class="nm"><small>AUFGENOMMEN</small><span></span></div>'; document.body.appendChild(el); }
    const cv = el.querySelector('canvas'), nm = inv3d_info(k).name; el.querySelector('.nm span').textContent = nm; inv3d_start(480, 480);
    inv3d_zeige(g); I.curKey = k; I.pick.t0 = performance.now(); const T = 3.1; const kat = inv3d_kat(k), pit = (inv3d_modell(k) || {}).pit || .22;
    try { if (kat === 'papier') Audio.paper(); else if (kat === 'schluessel') Audio.play('keys2', { gain: .16, rate: 1.5, dur: .25 }); else Audio.play('keys1', { gain: .14, rate: 1.1, dur: .2 }); } catch (e) {}
    await new Promise(res => { const f = now => { const t = (now - I.pick.t0) / 1000; if (t >= T || !I.scene || I.curKey !== k || (ui.overlay && t > .15)) { res(); return; }
        const inn = Math.min(1, t / .5), out = t > 2.4 ? Math.min(1, (t - 2.4) / .7) : 0, ease = x => x * x * (3 - 2 * x), ei = 1 - Math.pow(1 - inn, 3), eo = ease(out);
        const sc = (.4 + .6 * ei) * (1 - .86 * eo), dx = innerWidth * .06 * eo, dy = -(1 - ei) * -26 - 250 * eo;
        el.style.opacity = String(Math.min(ei * 1.3, 1) * (1 - Math.max(0, out - .5) / .5)); el.style.transform = `translate(${dx}px, ${dy}px) scale(${sc})`;
        inv3d_bild(cv, .3 + t * 1.3 + (1 - ei) * 2.6, pit + Math.sin(t * 1.4) * .07, 1.0 + .06 * Math.sin(t * 2)); requestAnimationFrame(f); }; requestAnimationFrame(f); });
    el.style.opacity = 0;
  } finally { I.pick = null; const nxt = I.queue && I.queue.shift(); if (nxt) setTimeout(() => inv3d_pickup(nxt).catch(() => {}), 120);
    else if (!(ui.overlay === 'journal' && jTab === 'inventar')) { inv3d_zeige(null); inv3d_stop(); } }
}
// Wache: neue Gegenstände erkennen (addItem und direkte story.items.push), Fundort merken, Aufheben-Darstellung
function inv3d_wache() { const I = INV3D; if (!I.known) { I.known = new Set(story.items); return; }
  const neu = story.items.filter(k => !I.known.has(k) && ITEMS[k]); if (!neu.length && story.items.length >= I.known.size) { return; }
  const n = new Set(story.items); const echt = neu.length && neu.length <= 2 && state && state.started;
  for (const k of neu) { I.found[k] = I.found[k] && I.found[k].t ? I.found[k] : { ch: inv3d_kapNr(), ort: echt ? inv3d_ort() : '', t: Date.now() }; }
  I.known = n; if (echt) { for (const k of neu) { setTimeout(() => inv3d_pickup(k).catch(() => {}), 350); } } }

// ---------------------------------------------------------------- Weltmodelle (statt Platzhalterformen der Basis)
// Halsband (Basis baut Torus + Scheibe): echtes Lederhalsband mit Messingmarke, liegend auf dem Aschekreis
async function inv3d_welt() {
  try { if (typeof collar === 'undefined' || !collar.parent || collar.parent.userData.inv3d) return; const g = collar.parent; g.userData.inv3d = 1;
    const m = await inv3d_lade('collar'); if (!m) return; const size = .2, s = size / 1.6; m.scale.setScalar(s); m.position.set(0, -g.position.y + (m.userData.h || 0.3) * s / 2 + .004, 0);
    m.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); g.children.filter(c => c !== collar && c.isMesh).forEach(c => g.remove(c)); g.add(m); } catch (e) { console.warn('inv3d: Halsband', e); }
}
setTimeout(inv3d_welt, 2500);
// Handy im Wagen (Basis: schwarzer Quader mit blauem Leuchten): echtes Telefon, Schirm leicht bläulich (3 % Akku)
async function inv3d_weltHandy() {
  try { if (typeof lenaPhone === 'undefined' || lenaPhone.userData.inv3d) return; lenaPhone.userData.inv3d = 1;
    const m = await inv3d_lade('phone'); if (!m) return; const s = .15 / 1.6; m.scale.setScalar(s);
    m.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = true; if (c.material && /Glas/i.test(c.material.name || '')) { c.material.emissive = new THREE.Color(0x14233a); c.material.emissiveIntensity = .5; } } });
    lenaPhone.material = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }); lenaPhone.add(m); m.position.set(0, 0, 0); } catch (e) { console.warn('inv3d: Handy', e); }
}
setTimeout(inv3d_weltHandy, 3000);


// ---------------------------------------------------------------- Einhängen
window.inv3d_orig = window.inv3d_orig || { rj: renderJournal, ai: addItem }; // Testhilfe: erneutes Einspielen des Moduls umhüllt das Original, nicht die Vorfassung
renderJournal = (o => () => { if (jTab !== 'inventar') { cancelAnimationFrame(INV3D.raf); INV3D.raf = 0; return o(); } o(); try { inv3d_render(); } catch (e) { console.warn('inv3d', e); } })(window.inv3d_orig.rj);
addItem = (o => key => { const had = story.items.includes(key); o(key); try { if (!had && story.items.includes(key)) inv3d_wache(); } catch (e) {} })(window.inv3d_orig.ai);
try { clearInterval(window.inv3d_timer); } catch (e) {} window.inv3d_timer = setInterval(() => { try { if (typeof story !== 'undefined' && story.items) inv3d_wache(); } catch (e) {} }, 500);
MOD_SAVE.push(['inventar3d', () => ({ found: INV3D.found, seen: [...INV3D.seen].slice(-200) }), v => { if (v && v.found) INV3D.found = v.found; if (v && Array.isArray(v.seen)) v.seen.forEach(k => INV3D.seen.add(k)); }]);
window.__inv3d = { I: INV3D, kat: inv3d_kat, modell: inv3d_modell, lade: inv3d_lade, icon: inv3d_icon, pickup: inv3d_pickup, render: inv3d_render, reg: INV3D_MODELLE, item: INV3D_ITEM, regeln: INV3D_REGELN, info: inv3d_info, start: inv3d_start, zeige: inv3d_zeige, bild: inv3d_bild };
