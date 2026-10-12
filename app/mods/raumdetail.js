// =====================================================================  RAUMDETAIL (Modul „raumdetail“): Folgeauftrag 9 – Räume authentisch, detailreich, weder zu voll noch zu leer
// Setzt auf dem Raum-Baukasten von bewohnt.js auf (Strahlprüfung auf Auflage, Klickflächen/Türen frei, Sichtprüfung, Instanzen je Modellteil): je Raum läuft nach dem
// vorhandenen Aufbau eine zweite Liste (RD.bau[id]) mit Alltagsdingen, die zur Nutzung des Raums passen (Quelle/Grund je Zeile im Kommentar).
// Dazu: Bodenbeläge (Scan-Oberflächen) und Sockelleisten/Türrahmen als zusammengefasste Geometrie je Raum, ruhigere Decken (Normalstärke).
// Modelle: vorhandene Scans (game/assets/ms/*), Poly Haven CC0 (ms/rd_<id>, app/tools/raum_opt.mjs). Nichts schwebt: Ablagen per Strahl (c.a), Wände per Strahl (c.w).
const RD = { bau: {}, mats: new Map(), orig: new Map(), off: false, S: { ceilDone: false, log: {} } };
const RD_PH = (id, size, axis = 'y', extra = {}) => ['rd_' + id, Object.assign({ file: 'model.glb', size, axis }, extra)];
Object.assign(BW_KITS, {
  // vorhandene Scans, hier mit Zielmaßen (m) statt Faktor
  tisch: ['metaltable', { file: 'model.gltf', dims: [1.8, .76, .8] }], tresen: ['metaltable', { file: 'model.gltf', dims: [2.2, .92, .66] }], tischS: ['metaltable', { file: 'model.gltf', dims: [1.2, .74, .7] }],
  stuhl: ['chair', { file: 'model.fbx', size: .93, spec: { '*': { b: 'chair_Albedo.jpg', n: 'chair_Normal.jpg', r: 'chair_Roughness.jpg', ao: 'chair_AO.jpg' } } }],
  herd: ['herd', { file: 'herd.glb', size: .92 }], haengeschr: ['haengeschrank', { file: 'haengeschrank.glb', size: .7 }],
  tonne: ['trashcan', { size: .59 }], uhr: ['wallclock', { file: 'model.gltf', size: .5 }], telefon: ['w_telefon', { file: 'model.glb', size: .22, axis: 'max' }],
  fernseher: ['crt', { file: 'model.glb', size: .38, axis: 'x' }], palette: ['pallet_ms', { file: 'model.gltf', size: 1.2, axis: 'x' }],
  // Poly Haven (CC0)
  kasse: RD_PH('CashRegister_01', .42, 'max'), kessel: RD_PH('vintage_electric_kettle', .26), muelleimer: RD_PH('metal_trash_can', .55), feuerlk: RD_PH('korean_fire_extinguisher_01', .5),
  feuermelder: RD_PH('fire_alarm', .14, 'max'), karton: RD_PH('cardboard_box_01', .45, 'max'), kiste: RD_PH('wooden_crate_01', .5, 'max'), schreibtisch: RD_PH('metal_office_desk', 1.4, 'x'),
  hocker: RD_PH('metal_stool_01', .5), stahlregal: RD_PH('steel_frame_shelves_01', 1.8), tafel: RD_PH('standing_chalkboard_01', 1.1), klemmbrett: RD_PH('clipboard', .3, 'max'),
  warnschild: RD_PH('WetFloorSign_01', .6), besen: RD_PH('plastic_broom', 1.25), kehrblech: RD_PH('dustpan', .3, 'max'), reiniger: RD_PH('multi_cleaner_bottle', .27), bleiche: RD_PH('bleach_bottle', .27),
  holzeimer: RD_PH('wooden_bucket_01', .3), gieskanne: RD_PH('watering_can_metal_01', .3), elherd: RD_PH('electric_stove', .9), mikro: RD_PH('vintage_microwave', .3), teeset: RD_PH('tea_set_01', .3, 'max'),
  emailtopf: RD_PH('pot_enamel_01', .22), wecker: RD_PH('alarm_clock_01', .14), wanduhr: RD_PH('wall_clock', .32, 'max'),
  vase1: RD_PH('ceramic_vase_01', .3), vase2: RD_PH('ceramic_vase_02', .26), vase4: RD_PH('ceramic_vase_04', .24), vaseA: RD_PH('antique_ceramic_vase_01', .34), pflanze: RD_PH('potted_plant_04', .45),
  korb: RD_PH('wicker_basket_01', .32, 'max'), schale: RD_PH('wooden_bowl_02', .22, 'max'), krug: RD_PH('jug_01', .22), oellampe: RD_PH('vintage_oil_lamp', .3), leuchter: RD_PH('wooden_candlestick', .22),
  stehrahmen1: RD_PH('standing_picture_frame_01', .2, 'max'), stehrahmen2: RD_PH('standing_picture_frame_02', .22, 'max'), bild1: RD_PH('hanging_picture_frame_01', .45, 'max'), bild2: RD_PH('hanging_picture_frame_02', .5, 'max'),
  zierrahmen: RD_PH('fancy_picture_frame_01', .45, 'max'), kissen: RD_PH('throw_pillows_01', .45, 'max'), bregal: RD_PH('wooden_bookshelf_worn', 1.8), kommode: RD_PH('vintage_wooden_drawer_01', .8, 'max'),
  mschrank: RD_PH('painted_wooden_cabinet', 1.5), nachttisch: RD_PH('painted_wooden_nightstand', .55), wregal: RD_PH('painted_wooden_shelves', 1.5), pstuhl: RD_PH('painted_wooden_chair_01', .95),
  ptisch: RD_PH('painted_wooden_table', .76), phocker: RD_PH('painted_wooden_stool', .45), schaukel: RD_PH('Rockingchair_01', 1.0), sessel: RD_PH('ArmChair_01', .95), cnachttisch: RD_PH('ClassicNightstand_01', .6),
  gkommode: RD_PH('GothicCommode_01', .9), holzhocker: RD_PH('wooden_stool_01', .48), holzbesen: RD_PH('wooden_broom', 1.3), gummistiefel: RD_PH('rubber_boots', .35, 'max'), koffer: RD_PH('vintage_suitcase', .6, 'max'),
  spiegel: RD_PH('ornate_mirror_01', 1.0), tv1: RD_PH('Television_01', .5, 'max'), tv2: RD_PH('television_02', .5, 'max'), kofferradio: RD_PH('boombox', .5, 'max'), standuhr: RD_PH('vintage_grandfather_clock_01', 1.9),
  schulstuhl: RD_PH('SchoolChair_01', .8), schulpult: RD_PH('SchoolDesk_01', .75), hefter: RD_PH('vintage_stapler', .16, 'max'), metallregal: RD_PH('worn_metal_rack', 1.8), werkzeugkiste: RD_PH('metal_tool_chest', .6, 'max'),
  werkzeugwagen: RD_PH('tool_cart', .8), sackkarre: RD_PH('hand_truck', 1.1), kiste2: RD_PH('wooden_crate_02', .5, 'max'), plastikkiste: RD_PH('plastic_crate_02', .5, 'max'), kamera: RD_PH('security_camera_01', .3, 'max'),
  stromkasten: RD_PH('power_box_01', .6), verteiler: RD_PH('utility_box_01', .5), leuchtstoff: RD_PH('mounted_fluorescent_lights', 1.2, 'x'), hallenlampe: RD_PH('hanging_industrial_lamp', .4),
  wandlampe: RD_PH('industrial_wall_lamp', .3), generator: RD_PH('portable_generator', .55), gasflasche: RD_PH('propane_tank', .55), allreiniger: RD_PH('all_purpose_cleaner', .26),
  plastikbox: RD_PH('plastic_container', .35, 'max'), sanikasten: RD_PH('medical_box', .3, 'max'), kruecken: RD_PH('vintage_crutches_01', 1.1), rollstuhl: RD_PH('wheelchair_01', .95), gasmaske: RD_PH('old_gas_mask', .25, 'max'),
  multimeter: RD_PH('retro_multimeter', .2, 'max'), messgeraet: RD_PH('vintage_spacecraft_instrument', .3, 'max'), blechkrug: RD_PH('metal_jug', .22), thermos2: RD_PH('modified_thermos', .3), schneidebrett: RD_PH('wooden_cutting_board', .35, 'max'),
  dosen: RD_PH('russian_food_cans_01', .2, 'max'), konserven: RD_PH('long_life_food', .22, 'max'), holzloeffel: RD_PH('wooden_spoon', .3, 'max'), thermos3: RD_PH('plastic_thermos', .3), altbett: RD_PH('old_bed_frame', 1.9, 'max'),
  tagesbett: RD_PH('vintage_day_bed', 1.9, 'max'), pflanztopf: RD_PH('planter_pot_clay', .25), handbohrer: RD_PH('vintage_hand_drill', .3, 'max'), spinnrad: RD_PH('spinning_wheel_01', .85), rundtisch: RD_PH('round_wooden_table_01', .72),
  beistelltisch: RD_PH('side_table_01', .5), kleintisch: RD_PH('small_wooden_table_01', .55), esstuhl: RD_PH('dining_chair_02', .9), klapphocker: RD_PH('folding_wooden_stool', .45), barhocker: RD_PH('bar_chair_round_01', .75),
  leiter: RD_PH('wooden_ladder', 2.1), spaten: RD_PH('rusted_spade_01', 1.15), beil: RD_PH('hatchet', .36, 'max'), laterne: RD_PH('wooden_lantern_01', .3), schlauch: RD_PH('garden_hose_wall_mounted_01', .5, 'max'),
  kuehl: ['kuehlschrank_alt', { file: 'model.glb', size: 1.5 }],
  // Weiß-Räume: gleiche Modelle, aber mit dem Weiß der Räume (whiteMat der Basis, ohne Textur)
  wholzhocker: ['rd_wooden_stool_01', { file: 'model.glb', size: .48, mat: () => whiteMat }], wgummistiefel: ['rd_rubber_boots', { file: 'model.glb', size: .35, axis: 'max', mat: () => whiteMat }],
  wkorb: ['rd_wicker_basket_01', { file: 'model.glb', size: .32, axis: 'max', mat: () => whiteMat }], wrundtisch: ['rd_round_wooden_table_01', { file: 'model.glb', size: .72, mat: () => whiteMat }],
  wteekanne: ['rd_tea_set_01', { file: 'model.glb', size: .28, axis: 'max', mat: () => whiteMat }], wpflanze: ['rd_potted_plant_04', { file: 'model.glb', size: .45, mat: () => whiteMat }],
  wleuchter: ['rd_wooden_candlestick', { file: 'model.glb', size: .22, mat: () => whiteMat }], wvase: ['rd_ceramic_vase_02', { file: 'model.glb', size: .26, mat: () => whiteMat }], dosen2: RD_PH('russian_food_cans_01', .2, 'max'), teekanne: RD_PH('tea_set_01', .28, 'max'), 
  rollwagen: RD_PH('industrial_storage_cart', .85), kaefiglampe: RD_PH('caged_hanging_light', .3), ofen: RD_PH('barrel_stove', .8), kanisterGruen: RD_PH('metal_jerrycan_green', .4), altreifen: RD_PH('old_tyre', .65, 'max'),
});

// ---------------------------------------------------------------------  Hilfen: Material-Cache, zusammengefasste Geometrie je Raum
function rd_mat(key, o = {}) { const k = key + '|' + (o.tint ?? 0xffffff) + '|' + (o.nrm ?? 1) + '|' + (o.rough ?? ''); if (RD.mats.has(k)) return RD.mats.get(k);
  const m = msSurfMat(key, { tint: o.tint ?? 0xffffff, nrm: o.nrm ?? 1 }); if (o.rough != null) { m.roughness = o.rough; m.roughnessMap = null; } m.polygonOffset = !!o.po; if (o.po) { m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  RD.mats.set(k, m); return m; }
// Box mit auf Weltmaß (je 2 m = 1 UV-Einheit) skalierten UVs; (x, y, z) = Mitte, ry = Drehung
function rd_box(w, h, d, x, y, z, ry = 0, tile = 2) { const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, n = g.attributes.normal;
  for (let i = 0; i < uv.count; i++) { const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)); const a = nx > .5 ? d : w, b = ny > .5 ? d : h; uv.setXY(i, uv.getX(i) * a / tile, uv.getY(i) * b / tile); }
  g.rotateY(ry); g.translate(x, y, z); return g; }
function rd_plane(w, d, x, y, z, tile = 2, rot = 0) { const g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * w / tile, uv.getY(i) * d / tile);
  g.rotateX(-PI / 2); if (rot) g.rotateY(rot); g.translate(x, y, z); return g; }
// Sammelt Geometrien je Material und hängt sie als ein Mesh je Material an die Raumgruppe
function rd_sammler(c) { const m = new Map(); return { add(mat, geo) { if (!m.has(mat)) m.set(mat, []); m.get(mat).push(geo); },
  fertig() { for (const [mat, geos] of m) { const geo = geos.length > 1 ? mergeGeometries(geos.map(g => g.index ? g.toNonIndexed() : g)) : geos[0]; if (!geo) continue; geo.computeBoundingSphere();
      const me = new THREE.Mesh(geo, mat); me.receiveShadow = true; me.castShadow = false; me.userData.noCol = true; me.userData.bw = 1; me.userData.rdTrim = 1; c.g.add(me); (c.g.userData.rdTrim || (c.g.userData.rdTrim = [])).push(me); } } }; }
// Sockelleiste (Profil aus zwei Leisten) an einem Wandstück: achse 'x' = Wand läuft entlang x bei z = fest, n = +1/−1 Blickrichtung in den Raum; luecken = [[von, bis], …] Türen
function rd_leiste(S, mat, achse, fest, a, b, n, y0, luecken = [], h = .1, t = .018) {
  const segs = []; let cur = a; for (const [l0, l1] of luecken.slice().sort((p, q) => p[0] - q[0])) { if (l0 > cur) segs.push([cur, Math.min(l0, b)]); cur = Math.max(cur, l1); } if (cur < b) segs.push([cur, b]);
  for (const [s, e] of segs) { const len = e - s; if (len < .05) continue; const m = (s + e) / 2;
    if (achse === 'x') { S.add(mat, rd_box(len, h, t, m, y0 + h / 2, fest + n * t / 2)); S.add(mat, rd_box(len, .014, t + .008, m, y0 + h + .007, fest + n * (t + .008) / 2)); }
    else { S.add(mat, rd_box(t, h, len, fest + n * t / 2, y0 + h / 2, m)); S.add(mat, rd_box(t + .008, .014, len, fest + n * (t + .008) / 2, y0 + h + .007, m)); } } }
// Türrahmen (Zarge) für eine Öffnung: achse 'z' = Wand steht bei x = fest (Öffnung läuft entlang z), mitte = Türmitte, w = lichte Breite, dicke = Wandstärke
function rd_zarge(S, mat, achse, fest, mitte, w, y0, hoehe = 2.06, dicke = .3, b = .07, t = .02) {
  const add = (sign) => { const off = sign * (dicke / 2 + t / 2);
    if (achse === 'z') { S.add(mat, rd_box(t, hoehe, b, fest + off, y0 + hoehe / 2, mitte - w / 2 - b / 2)); S.add(mat, rd_box(t, hoehe, b, fest + off, y0 + hoehe / 2, mitte + w / 2 + b / 2)); S.add(mat, rd_box(t, b, w + 2 * b, fest + off, y0 + hoehe + b / 2, mitte)); }
    else { S.add(mat, rd_box(b, hoehe, t, mitte - w / 2 - b / 2, y0 + hoehe / 2, fest + off)); S.add(mat, rd_box(b, hoehe, t, mitte + w / 2 + b / 2, y0 + hoehe / 2, fest + off)); S.add(mat, rd_box(w + 2 * b, b, t, mitte, y0 + hoehe + b / 2, fest + off)); } };
  add(1); add(-1); }


// Räume eines Hauses: Bodenbelag je Raum (rdt_*-Scan), Sockelleisten an allen Wänden außer in Türöffnungen, Zargen an den Durchgängen.
//   rooms: [{ x0, x1, z0, z1 (Innenmaße), boden: 'wood_floor_worn', tile, rot, leiste: false }]  doors: [{ ax: 'x'|'z' (Wand läuft entlang), at: feste Koordinate der Wandmitte, pos: Mitte der Öffnung, w: Breite, dicke }]
function rd_haus(c, y0, rooms, doors, o = {}) { const S = rd_sammler(c), t = o.leiste ?? .018, h = o.h ?? .1;
  const mL = rd_mat('planks_painted', { tint: o.tint ?? 0xe4ddcf, nrm: .35, rough: .7 });
  for (const R of rooms) { const cx = (R.x0 + R.x1) / 2, cz = (R.z0 + R.z1) / 2;
    if (R.boden) S.add(rd_mat('rdt_' + R.boden, { nrm: .6, po: true, tint: R.tint ?? 0xffffff }), rd_plane(R.x1 - R.x0 + .02, R.z1 - R.z0 + .02, cx, y0 + (o.fy ?? .021), cz, R.tile || 1.6, R.rot || 0));
    if (R.leiste === false) continue;
    for (const [achse, fest, a, b, n] of [['x', R.z0, R.x0, R.x1, 1], ['x', R.z1, R.x0, R.x1, -1], ['z', R.x0, R.z0, R.z1, 1], ['z', R.x1, R.z0, R.z1, -1]]) {
      const gaps = []; for (const d of doors) if (d.ax === achse && Math.abs(d.at - fest) < (d.dicke || .2) / 2 + .15 && d.pos > a - .05 && d.pos < b + .05) gaps.push([d.pos - d.w / 2 - .06, d.pos + d.w / 2 + .06]);
      rd_leiste(S, mL, achse, fest, a, b, n, y0 + (o.fy ?? .021), gaps, h, t); } }
  for (const d of doors) if (!d.ohne) rd_zarge(S, mL, d.ax === 'x' ? 'x' : 'z', d.at, d.pos, d.w, y0 + (o.fy ?? .021), d.h ?? 2.04, d.dicke ?? .2);
  S.fertig(); }

// ---------------------------------------------------------------------  Decken ruhiger: die Putz-/Betonscans wellten sich an Zimmerdecken (Normalstärke 1, Kachel 2 m) wie Wasser
function rd_decken() { if (!scene) return 0; scene.updateMatrixWorld(true); const bb = new THREE.Box3(), sz = new THREE.Vector3(), cache = new Map(); let n = 0;
  scene.traverse(o => { if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || o.userData.rdDecke || !o.geometry || o.geometry.type !== 'BoxGeometry') return; const m = o.material; if (!m || Array.isArray(m) || !m.map || !m.normalMap) return;
    bb.setFromObject(o); bb.getSize(sz); if (sz.y < .05 || sz.y > .7 || sz.x < 2.2 || sz.z < 2.2 || bb.min.y < 1.9 || bb.min.y > 3.9) return;
    let nm = cache.get(m.uuid); if (!nm) { nm = m.clone(); nm.onBeforeCompile = m.onBeforeCompile; nm.customProgramCacheKey = m.customProgramCacheKey; nm.userData = m.userData; /* clone() verliert die Shader-Haken → sonst neues Programm (Ruckler beim ersten Blick) */ nm.normalScale.set(.1, .1); nm.aoMapIntensity = .5; nm.color.multiplyScalar(1.15); cache.set(m.uuid, nm); } /* Klon: dasselbe Shader-Programm (kein Neuübersetzen), nur Uniforms */ o.userData.rdOrig = [m, o.receiveShadow]; o.userData.rdNeu = nm; o.material = nm; o.receiveShadow = false; /* Lampe sitzt an der Decke: Schattenkarte flimmert dort wie Mondkrater */ o.userData.rdDecke = 1; n++; }); return n; } // Decken: gestrichen, einfarbig matt (die Scans trugen eingebackene Schatten/Poren und wirkten im Lampenkegel wie Mondkrater)
// Normalstärken der Wand-/Bodenscans (wall_damaged, wall_plaster …) waren auf 1: im Lampenkegel wie Mondkrater. Ruhiger, damit Wände wie Putz/Beton aussehen
function rd_flaechen() { const want = new Map(); for (const [k, v] of [['block', .28], ['concrete', .28], ['plaster', .4], ['floor', .45], ['wallpaper', .5], ['wallpaper2', .5], ['ash', .35]]) { const m = M[k]; if (!m) continue; if (m.normalMap) want.set(m.normalMap, v); else if (m.map) want.set(m.map, v); if (m.normalScale) { RD.orig.set(m, [m.normalScale.x, m.roughness, m.roughnessMap]); m.normalScale.set(v, v); } }
  // Nur Uniforms (normalScale): Programmvarianten bleiben gleich, sonst Neuübersetzung beim ersten Blick (Spitzen im Leistungs-Gate). Klone (wall()/box()) teilen die Textur mit M.*, tragen aber eigene Parameter
  const seen = new Set(); let n = 0; scene.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m || seen.has(m)) continue; seen.add(m); const v = want.get(m.normalMap || m.map); if (v != null && m.normalScale) { if (!RD.orig.has(m)) RD.orig.set(m, [m.normalScale.x, m.roughness, m.roughnessMap]); m.normalScale.set(v, v); n++; } } }); return n; }
WORLD_MODS.push(['Raumdetail (Decken, Flächen ruhiger)', async () => { try { rd_flaechen(); RD.S.decken = rd_decken(); } catch (e) { console.warn('raumdetail: Decken', e); } }]);


// ---------------------------------------------------------------------  Villa-Räume als Bewohnt-Räume: Arbeitszimmer, Anrichte, Obergeschoss, Keller, Nr. 9 (Aufbau beim Betreten über VILLA_BAU, Gruppe VILLA.g)
if (typeof VILLA_R !== 'undefined' && typeof VILLA_TUER !== 'undefined') for (const k of ['az', 'an', 'og', 'kr', 'nr9']) { const R0 = VILLA_R[k]; if (!R0 || BW_RAEUME.some(d => d.id === 'v_' + k)) continue;
  BW_RAEUME.push({ id: 'v_' + k, name: 'Villa · ' + R0.name, r: () => ({ x0: R0.x0 + .15, x1: R0.x1 - .15, z0: R0.z0 + .15, z1: R0.z1 - .15 }), y0: 0, h: R0.h, tueren: () => [[VILLA_TUER[k][0], VILLA_TUER[k][1], 1.0]],
    vorab: () => VILLA.gebaut.has(k), aktiv: () => VILLA.raum === k && !!VILLA.g && VILLA.g.visible, async bau(c) {} }); }
WORLD_MODS.push(['Raumdetail (Villa-Räume einhängen)', async () => { if (typeof VILLA_BAU === 'undefined') return; for (const k of ['az', 'an', 'og', 'kr', 'nr9']) { const alt = VILLA_BAU[k]; if (!alt || alt.rd) continue;
  const f = async R => { await alt(R); try { await bw_vorher('v_' + k, 2500); } catch (e) {} }; f.rd = 1; VILLA_BAU[k] = f; } }]);


// ---------------------------------------------------------------------  weitere Amt-Räume (Vorraum, Messraum): bisher ohne Dressing
for (const [id, name, x0, x1, z0, z1] of [['amt_vorraum', 'Amt · Vorraum', 106.15, 109.85, -7.85, 7.85], ['amt_messraum', 'Amt · Messraum', 110.15, 119.85, -7.85, 7.85]]) { if (BW_RAEUME.some(d => d.id === id)) continue;
  const R = { x0: C2.x + x0, x1: C2.x + x1, z0: C2.z + z0, z1: C2.z + z1 };
  BW_RAEUME.push({ id, name, r: () => R, y0: 0, h: C2.h, tueren: () => [[R.x0 - .2, C2.z, 1.2], [R.x1 + .2, C2.z, 1.2]],
    vorab: P => bw_rNah(P, { x0: R.x0 - .2, x1: R.x1 + .2, z0: R.z0, z1: R.z1 }, 12), aktiv: () => bw_rNah(player.pos, { x0: R.x0 - .2, x1: R.x1 + .2, z0: R.z0, z1: R.z1 }, 18), async bau(c) {} }); }


// ---------------------------------------------------------------------  weitere Orte als Räume: Kiosk, Zayns Hütte, Stall, die Weiß-Räume (Kap. 3)
{ const nr = (id, name, r, y0, h, tueren, vorab) => { if (BW_RAEUME.some(d => d.id === id)) return; BW_RAEUME.push({ id, name, r, y0, h, tueren, vorab: P => { try { return vorab(P); } catch (e) { return false; } },
      aktiv: () => { try { const q = r(); return !!q && bw_rNah(player.pos, q, 14); } catch (e) { return false; } }, async bau(c) {} }); };
  nr('kiosk', 'Tankstelle · Kiosk', () => ({ x0: 106.3, x1: 117.7, z0: 25.2, z1: 30.7 }), 0, 3.3, () => [[113.35, 25.1, 1.0]], P => bw_nah(P, 112, 28, 22));
  nr('huette', 'Zayns Hütte', () => { const R = typeof wald_S !== 'undefined' && wald_S.hutRect; return R ? { x0: R.x0 + .1, x1: R.x1 - .1, z0: R.z0 + .1, z1: R.z1 - .1 } : { x0: 56.4, x1: 59.6, z0: 147.7, z1: 151.3 }; }, 0, 2.45, () => [[56.9, 147.6, .9]], P => bw_nah(P, 58, 149.5, 25));
  // (Stall: die Scan-Szene ist dicht genug, kein Zusatz)
  if (0) nr('stall', 'Stall (Hof)', () => { const O = typeof ausbau_ost_west_OW !== 'undefined' ? ausbau_ost_west_OW : null; const R = O && O.dbg && O.dbg.barnRect; return R ? { x0: R.x0 + .2, x1: R.x1 - .2, z0: R.z0 + .2, z1: R.z1 - .2 } : { x0: -145, x1: -139, z0: -31, z1: -25 }; }, 0, 3.2, () => [], P => bw_nah(P, -142, -28, 30));
  if (typeof C3 !== 'undefined') for (const [k, a, b, hz] of [['weiss1', 0, 8, 3], ['weiss2', 8, 20, 6], ['weiss3', 20, 32, 6], ['weiss4', 32, 52, 10]])
    nr(k, 'Weiß · Raum ' + k.slice(5), () => ({ x0: C3.x + a + .2, x1: C3.x + b - .2, z0: C3.z - hz + .2, z1: C3.z + hz - .2 }), 0, C3.h, () => [[C3.x + a, C3.z, 1.2], [C3.x + b, C3.z, 1.2]], P => bw_rNah(P, { x0: C3.x + a, x1: C3.x + b, z0: C3.z - hz, z1: C3.z + hz }, 12)); }


// ---------------------------------------------------------------------  Mikrostruktur drinnen ruhiger: das Detail-Normalen-Rauschen der Grafik (grafik.js, 2,5–9 m) ließ gestrichene Wände/Decken im Lampenkegel wie Mondkrater wirken
// Im Raum auf 40 % (weich überblendet), draußen unverändert.
WORLD_TICK.push(dt => { if (typeof GRAFIK === 'undefined' || !GRAFIK.ready || typeof bw_S === 'undefined') return; const S = RD.S; let drin = false; const P = player.pos;
  for (const E of bw_S.liste) { if (!E.g.visible) continue; let r = null; try { r = E.D.r(); } catch (e) {} if (r && P.x > r.x0 - .6 && P.x < r.x1 + .6 && P.z > r.z0 - .6 && P.z < r.z1 + .6) { drin = true; break; } }
  if (!drin && typeof kirchberg_S !== 'undefined' && kirchberg_S.inRaum) drin = true; if (!drin && typeof VILLA !== 'undefined' && VILLA.raum) drin = true;
  S.detK = (S.detK ?? 1) + ((drin && !RD.off ? .4 : 1) - (S.detK ?? 1)) * Math.min(1, dt * 2.5);
  let det = true; try { det = !!grafik_fx().det; } catch (e) {} GRAFIK.u0.y = det ? S.detK : 0; });


// Vorher/Nachher für die Abnahme (nur Test): vorher(true) = Zustand ohne Raum-Detail (Zusatzliste aus, Decken/Flächen wie in der Basis)
RD.vorher = on => { RD.off = !!on; for (const [m, v] of RD.orig) { if (on) { m.normalScale.set(1, 1); m.roughness = v[1]; m.roughnessMap = v[2]; } else { const k = [...RD.orig.keys()]; } m.needsUpdate = true; }
  if (on) scene.traverse(o => { if (o.userData && o.userData.rdOrig) { const [m, rs] = o.userData.rdOrig; o.material = m; o.receiveShadow = rs; o.userData.rdWas = 1; } });
  else { scene.traverse(o => { if (o.userData && o.userData.rdWas) { o.material = o.userData.rdNeu; o.receiveShadow = false; o.userData.rdWas = 0; } }); rd_flaechen(); } };


// Villa-Halle, Bus, Wrack: Räume zum Abnehmen (Halle: ANW_HALL; Bus/Wrack: Blender-Innenausbau, tiefwald.js)
{ const nr2 = (id, name, r, y0, h, vorab) => { if (BW_RAEUME.some(d => d.id === id)) return; BW_RAEUME.push({ id, name, r, y0, h, tueren: () => [], vorab, aktiv: () => { try { return bw_rNah(player.pos, r(), 16); } catch (e) { return false; } }, async bau(c) {} }); };
  if (typeof ANW_HALL !== 'undefined') nr2('v_halle', 'Villa · Halle', () => ({ x0: ANW_HALL.x - ANW_HALL.w / 2 + .2, x1: ANW_HALL.x + ANW_HALL.w / 2 - .2, z0: ANW_HALL.z - ANW_HALL.d / 2 + .2, z1: ANW_HALL.z + ANW_HALL.d / 2 - .2 }), 0, ANW_HALL.h, P => typeof anwesen_S !== 'undefined' && !!anwesen_S.inHall && Math.abs(P.x - ANW_HALL.x) < ANW_HALL.w && Math.abs(P.z - ANW_HALL.z) < ANW_HALL.d);   // erst in der Halle (anwesen_S.hall gibt es schon beim Laden: Aufbau mitten im Spiel = Ruckler)
  if (typeof TIEF !== 'undefined') nr2('bus_innen', 'Bus (innen)', () => ({ x0: TIEF.bus.x - 1.0, x1: TIEF.bus.x + 1.0, z0: TIEF.bus.z - 2.5, z1: TIEF.bus.z + 2.5 }), 0, 2.2, P => bw_nah(P, TIEF.bus.x, TIEF.bus.z, 20)); }


// ---------------------------------------------------------------------  Wandverschmutzung mit Ursache: Wasserflecken unter der Decke, Stockflecken in Wandmitte, schmale Wasserläufe von oben
// Je Wand 2–4 Flecken (deterministisch je Raum); die Wandfläche wird per Strahl gefunden (Rechteck der Räume ist unterschiedlich weit eingerückt), Abstand 5 mm.
function rd_wandfleck(c, id, o = {}) { const r = c.r, y0 = c.y0, H = c.H, seed = [...id].reduce((a, ch) => a * 31 + ch.charCodeAt(0) | 0, 7);
  let sd = seed; const R = () => { sd = Math.imul(sd ^ sd >>> 15, 2246822519) + 374761393 | 0; return ((sd >>> 0) % 10000) / 10000; };
  const cand = []; scene.updateMatrixWorld(); const bb = new THREE.Box3(), box = new THREE.Box3(new THREE.Vector3(r.x0 - .6, y0 - .3, r.z0 - .6), new THREE.Vector3(r.x1 + .6, y0 + H + .5, r.z1 + .6));
  scene.traverse(o2 => { if (!o2.isMesh || !o2.visible || o2.userData.bw || o2.isSkinnedMesh || o2.isInstancedMesh) return; const m = [].concat(o2.material)[0]; if (!m || m.visible === false || m.transparent) return; bb.setFromObject(o2);
    const s = bb.getSize(new THREE.Vector3()); if (!bb.isEmpty() && bb.intersectsBox(box) && Math.max(s.x, s.z) > 1.2 && s.y > 1.2) cand.push(o2); });   // nur Wandmeshes (groß und hoch)
  const rc = new THREE.Raycaster(), O = new THREE.Vector3(), D = new THREE.Vector3(); let n = 0;
  const seiten = [['S', 0, 1, r.z0, 'x'], ['N', 0, -1, r.z1, 'x'], ['W', 1, 0, r.x0, 'z'], ['O', -1, 0, r.x1, 'z']];
  for (const [face, nx, nz, w0, along] of seiten) { const len = along === 'x' ? r.x1 - r.x0 : r.z1 - r.z0, k = Math.max(1, Math.min(4, Math.round(len / 4.5)));
    for (let i = 0; i < k; i++) { const t = (along === 'x' ? r.x0 : r.z0) + len * (i + .2 + R() * .6) / k, art = R(), hh = art < .45 ? .8 + R() * .9 : art < .8 ? .5 + R() * .5 : 1.2 + R() * .6;
      const y = art < .45 ? y0 + H - hh / 2 - .05 : art < .8 ? y0 + .35 + R() * .9 : y0 + .2 + R() * 1.6;
      const px = along === 'x' ? t : w0 + nx * -.0, pz = along === 'x' ? w0 : t;   // Strahl von innen (0,5 m Abstand) gegen die Wand
      O.set(along === 'x' ? t : w0 + nx * .5, y, along === 'x' ? w0 + nz * .5 : t); D.set(-nx, 0, -nz); rc.set(O, D); rc.far = 1.2; let best = null;
      for (const m of cand) { const h = rc.intersectObject(m, false)[0]; if (h && (!best || h.distance < best.distance)) best = h; } if (!best) continue;
      const nrm = best.face.normal.clone().transformDirection(best.object.matrixWorld); if (Math.abs(nrm.y) > .3 || nrm.x * nx + nrm.z * nz < .7) continue;   // nur senkrechte, zum Raum zeigende Flächen
      const X = best.point.x + nx * .005, Z = best.point.z + nz * .005, w = art < .45 ? .35 + R() * .5 : art < .8 ? .6 + R() * .8 : .16 + R() * .14;   // art ≥ .8: schmaler Wasserlauf von oben
      c.fleck('grime', w, hh, X, art >= .8 ? y0 + H - hh / 2 - .04 : y, Z, face, art >= .8 ? 0 : (R() - .5) * (art < .45 ? .12 : 1.2), art < .45 ? 0x3a3a30 : art < .8 ? 0x4a4034 : 0x2c2a26, .4 + R() * .3); n++; } }
  return n; }

// ---------------------------------------------------------------------  Einbinden: Aufbau der Räume um die zweite Liste erweitern
// c.A(name, x, z, { min, max, r, ry, s }): wie c.a, aber mit eigener Strahlprüfung gegen ALLE sichtbaren Meshes des Raums (auch Decken, Läufer, Möbel aus Basis-Modulen, die
// c.a nicht als Auflage kennt): höchste Fläche zwischen min und max unter (x, z), Unterkante darauf (c.fix). Vier Fußpunkte müssen ≈ gleich hoch liegen (≤ 4 cm).
function rd_auflage(c) { const r = c.r, y0 = c.y0, box = new THREE.Box3(new THREE.Vector3(r.x0 - .5, y0 - .3, r.z0 - .5), new THREE.Vector3(r.x1 + .5, y0 + c.H + .5, r.z1 + .5));
  const cand = []; scene.updateMatrixWorld(); const bb = new THREE.Box3(); scene.traverse(o => { if (!o.isMesh || !o.visible || o.userData.bw || o.isSkinnedMesh) return; const m = [].concat(o.material)[0]; if (!m || m.visible === false || m.blending === THREE.AdditiveBlending) return; bb.setFromObject(o); if (!bb.isEmpty() && bb.intersectsBox(box)) cand.push(o); });
  const rc = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), O = new THREE.Vector3();
  const hoch = (x, z, von, lo) => { O.set(x, von, z); rc.set(O, DOWN); rc.far = von - lo + .02; let best = -Infinity; for (const o of cand) { const h = rc.intersectObject(o, false)[0]; if (h && h.point.y > best && h.point.y >= lo) best = h.point.y; } return best; };
  return async (name, x, z, o = {}) => { const K = await bw_kit(name); if (!K) return null; const lo = o.min ?? y0 + .3, hi = o.max ?? y0 + 2.0, s = o.s || 1, hx = K.sz.x * s * .35, hz = K.sz.z * s * .35;
    for (let i = 0; i < 18; i++) { const w = i * 2.39996, d = (o.r ?? .3) * Math.sqrt(i / 17), px = x + Math.cos(w) * d, pz = z + Math.sin(w) * d; const von = hi + .06; const y = hoch(px, pz, von, lo); if (!isFinite(y)) continue;
      let ok = true; for (const [qx, qz] of [[hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]]) { const q = hoch(px + qx, pz + qz, von, lo); if (!isFinite(q) || Math.abs(q - y) > .04) { ok = false; break; } } if (!ok) continue;
      const q = await c.fix(name, px, y, pz, o); if (q) return q; } return null; }; }
// Alle Platzierungen der zweiten Liste tragen rd: true → eigene Instanzgruppen (E.rd), nur in der Nähe sichtbar (Zeichenaufrufe/Dreiecke im Leistungs-Gate)
function rd_markieren(c) { for (const [m, i] of [['b', 3], ['a', 3], ['w', 4], ['bw', 3], ['stapel', 4], ['fix', 4]]) { const f = c[m]; if (!f || f.rd) continue;
    const g = (...a) => { while (a.length < i) a.push(undefined); a[i] = Object.assign({}, a[i] || {}, { rd: true }); return f(...a); }; g.rd = 1; c[m] = g; } }
function rd_hook() { for (const D of BW_RAEUME) { if (!RD.bau[D.id]) continue; if (!D.bau0) D.bau0 = D.bau; const alt = D.bau0, tab = RD.bau;   // bau0: Original (bei erneutem Einlesen im Test wird nur der Wrapper ersetzt)
  D.bau = async function (c) { await alt.call(D, c); const t0 = performance.now(); if (RD.off) return; rd_markieren(c); c.A = rd_auflage(c); try { await tab[D.id](c, D); } catch (e) { console.warn('raumdetail: ' + D.id, e); } if (!RD.noWand) try { RD.S.wand = (RD.S.wand || 0) + rd_wandfleck(c, D.id); } catch (e) { console.warn('raumdetail: Wandflecken ' + D.id, e); } RD.S.log[D.id] = Math.round(performance.now() - t0); }; } }
WORLD_TICK.push(dt => { const S = RD.S; S.tk = (S.tk || 0) - dt; if (S.tk > 0 || typeof bw_S === 'undefined') return; S.tk = .3; const P = player.pos;
  for (const E of bw_S.liste) { if (!E.rd || !E.g.visible) continue; let r = null; try { r = E.D.r(); } catch (e) {} if (!r) continue;
    const d = Math.hypot(Math.max(r.x0 - P.x, 0, P.x - r.x1), Math.max(r.z0 - P.z, 0, P.z - r.z1)); const an = d < (E.rdOn ? 2.8 : 1.6), at = d < (E.rdTr ? 10 : 8);   // Props nur im Raum/an der Tür (jede Zusatz-Instanz kostet im Leistungs-Gate ≈ 5×), Böden/Leisten bis 8 m
    if (an !== E.rdOn) { E.rdOn = an; for (const G of E.rd) G.visible = an; } if (at !== E.rdTr) { E.rdTr = at; for (const m of E.g.userData.rdTrim || []) m.visible = at; } } });
RD.hook = rd_hook; RD.flaechen = rd_flaechen; RD.decken = rd_decken; RD.kits = BW_KITS;
WORLD_MODS.push(['Raumdetail (Räume einhängen)', async () => { rd_hook(); }]); // nach allen Teilen (raumdetail_*.js): ihre RD.bau-Einträge stehen dann
window.__rd = RD;
